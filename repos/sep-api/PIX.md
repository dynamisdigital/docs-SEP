# PIX — sep-api

Documento operacional da fundacao do modulo `pix` e do `EscrowProvider` (Sprint 19 — Epic 15 parte 1). Atualizado pos-implementacao.

> Spec: [`specs/fase-3/019-sprint-19-pix-foundation-escrow-provider.md`](../../specs/fase-3/019-sprint-19-pix-foundation-escrow-provider.md). Steps: [`steps-fase-3/backend/019-sprint-19-steps.md`](../../steps-fase-3/backend/019-sprint-19-steps.md).
> ADRs relacionados: [0004](../../adr/0004-provider-pattern-para-integracoes-externas.md) (Provider Pattern), [0005](../../adr/0005-conta-escrow-segregacao-patrimonial.md) (Escrow), [0008](../../adr/0008-wiremock-para-testes-integracao-celcoin.md) (WireMock).

## Objetivo

Criar a fundacao backend do Pix: dominio isolado de Celcoin, persistencia com idempotencia, ports `PixProvider`/`EscrowProvider` (Provider Pattern), adapters Fake (dev/test) + Celcoin skeleton (WireMock) e o receiver de webhook Pix com HMAC e auditoria.

**Foundation — fora de escopo nesta sprint:** desembolso Pix real, conciliacao automatica de parcela de cobranca, split/Pix automatico/devolucao, aporte da credora. Esses comandos ficam para as Sprints 20/21.

## Modulo e arquitetura

Pacote `com.dynamis.sep_api.pix`, monolito modular DDD + Hexagonal:

- `domain` — entidades, VOs de status, eventos de dominio. Sem HTTP/Celcoin.
- `application.port.out` — `PixProvider` + DTOs de dominio; excecoes `PixProviderException`/`PixProviderHttpException`.
- `application.usecase` — `ProcessarWebhookPixUseCase`.
- `application.listener` — `PixWebhookAuditListener`.
- `infrastructure.adapter` — `FakePixProvider`, `celcoin.CelcoinPixProvider`, `PixWebhookNormalizer`.
- `web.controller` — `PixWebhookController`.

O `EscrowProvider` foi criado no modulo `escrow` (nao em `pix`): Pix consome escrow por porta; escrow continua capacidade transversal. O `RegistrarMovimentacaoEscrowUseCase` local (Sprint 12) **nao** foi alterado.

## Dominio

| Entidade | Estados | Idempotencia / dedup |
| -------- | ------- | -------------------- |
| `PixTransferencia` | `CRIADA -> SOLICITADA -> PROCESSANDO -> CONCLUIDA` / `FALHOU` / `CANCELADA` | `idempotency_key` UNIQUE |
| `PixRecebimento` | `RECEBIDO -> EM_PROCESSAMENTO -> CONCILIADO` / `NAO_IDENTIFICADO` / `FALHOU` | `end_to_end_id` UNIQUE parcial (quando presente) |
| `PixWebhookEvent` | `RECEBIDO -> PROCESSADO` / `IGNORADO` / `FALHOU` | `(provider, event_id)` UNIQUE |

Regras de dominio:

- Transicoes guardadas (`IllegalStateException` em transicao invalida); estados terminais nao reprocessam.
- Valores monetarios rejeitam mais de 2 casas decimais (sem arredondamento silencioso).
- `PixRecebimento` normaliza `end_to_end_id` em branco para `null` (evita duplicidade artificial na unique parcial).
- `PixWebhookEvent` guarda apenas `payload_hash` (SHA-256 hex, validado no dominio) — **nunca** o payload bruto (minimizacao de dados sensiveis).
- UUID v6 + auditoria (`EntidadeAuditavel`).

Migracao: `V45__criar_tabelas_pix_foundation.sql` (3 tabelas, sem FK/CASCADE, CHECKs de status/valor, indices por status+data para fila operacional futura).

## Provider Pattern

Selecao por property; `fake` e o default seguro em dev/test (sem credenciais).

| Port | Property | Operacoes |
| ---- | -------- | --------- |
| `PixProvider` | `app.pix.provider=fake\|celcoin` | `solicitarTransferencia`, `consultarTransferencia`, `normalizarWebhook` |
| `EscrowProvider` | `app.escrow.provider=fake\|celcoin` | `criarContaEscrow`, `consultarContaEscrow`, `criarWallet`, `consultarWallet`, `consultarSaldo` |

Adapters Celcoin (skeleton, ativados so com a property):

- OAuth2 client-credentials dedicado por modulo (`CelcoinPixOAuthTokenProvider` / `CelcoinEscrowOAuthTokenProvider`), cache em memoria + clock skew 30s. **Fail-fast no boot**: credenciais ausentes quando `provider=celcoin` impedem a subida.
- `RestClientFactory` com timeout; Resilience4j instances `celcoin-pix` / `celcoin-escrow` (retry 5xx/IO + circuit breaker). Token client tambem com timeout explicito.
- `Idempotency-Key` enviada em chamadas com efeito externo (via MDC + `IdempotencyKeyInterceptor`).
- Erros HTTP traduzidos para `PixProvider(Http)Exception` / `EscrowProvider(Http)Exception` — nenhum tipo de framework/response cru vaza para application. Status desconhecido tambem vira excecao de provider.
- DTOs Celcoin vivem so no adapter; o dominio nunca os ve.

> Nota de retry: como o Resilience4j roteia retry por tipo de excecao via YAML (sem predicate), a `*ProviderHttpException` esta nos `retryExceptions` e, por consequencia, 4xx tambem reentra ate `maxAttempts`. Aceito para o skeleton (Idempotency-Key protege reenvios), mesmo tradeoff de `clicksign-assinatura`. Predicate Java (retry so em 5xx) e follow-up.

### Properties

```yaml
app:
  pix:
    provider: ${APP_PIX_PROVIDER:fake}
  escrow:
    provider: ${APP_ESCROW_PROVIDER:fake}
  webhooks:
    secrets:
      celcoin-pix: ${APP_WEBHOOK_SECRET_CELCOIN_PIX:...}
  celcoin:
    pix:     { base-url, client-id, client-secret }   # app.celcoin.pix.*
    escrow:  { base-url, client-id, client-secret }   # app.celcoin.escrow.*
```

## Webhook Pix

`POST /api/v1/webhooks/celcoin/pix` (rota literal, publica via `permitAll` — autenticacao por HMAC, nao JWT).

Fluxo (`ProcessarWebhookPixUseCase`, `@Transactional`):

```text
PixWebhookController
  - exige header X-Webhook-Signature (alias X-Celcoin-Signature) + body
  - WebhookSignatureValidator.isValid("celcoin-pix", payload, signature)
    invalido -> 401 (BadCredentialsException)
  - passa o correlationId do MDC ao use case
ProcessarWebhookPixUseCase
  - PixProvider.normalizarWebhook(payload) -> EventoWebhookPixNormalizado
    (parsing + SHA-256 ficam no adapter; PixWebhookNormalizer compartilhado)
  - event_id ausente -> 400
  - dedup por (provider, event_id): duplicado -> 202 sem reprocessar
  - persiste PixWebhookEvent RECEBIDO (saveAndFlush; corrida de event_id
    cai no unique e e tratada como duplicado) + publica PixWebhookRecebidoEvent
  - roteia por tipo:
      RECEBIMENTO_PIX      -> cria PixRecebimento inicial (dedup por
                              end_to_end_id) + PROCESSADO
      STATUS_TRANSFERENCIA -> reconcilia o desembolso (Sprint 20): reconsulta
                              o provider (trigger) e sincroniza idempotentemente;
                              external id desconhecido -> IGNORADO
      DESCONHECIDO         -> IGNORADO com motivo
  - falha de processamento -> FALHOU (reprocesso futuro), sem 5xx
  - publica PixWebhookProcessadoEvent (exceto DESCONHECIDO) ou PixWebhookFalhouEvent
  -> 202 ACCEPTED
```

Garantias:

- **HMAC obrigatorio** (secret `app.webhooks.secrets.celcoin-pix`); assinatura invalida -> 401.
- **Idempotencia** por `event_id` do payload (nao por header). Duplicado -> 202 sem novo registro/processamento.
- **Minimizacao**: payload bruto nunca persistido — so o hash. Sem `Idempotency-Key` exigido no header.
- Recebimento nao concilia parcela de cobranca nem dispara desembolso nesta fase.

## Desembolso assistido (Sprint 20 — Epic 15 parte 2)

> Spec: [`specs/fase-3/020-sprint-20-pix-desembolso-assistido.md`](../../specs/fase-3/020-sprint-20-pix-desembolso-assistido.md). Steps: [`steps-fase-3/backend/020-sprint-20-steps.md`](../../steps-fase-3/backend/020-sprint-20-steps.md).

Desembolso Pix **assistido pelo financeiro** apos contrato assinado. Nao ha desembolso automatico.

### Endpoints REST (`/api/v1/pix/desembolsos`)

| Metodo | Rota | Roles | Seguranca |
| ------ | ---- | ----- | --------- |
| `POST` | `/api/v1/pix/desembolsos` | `FINANCEIRO`, `ADMIN` | **step-up estrito** (`@RequireStepUpEstrito`, sem bypass de MFA) + `Idempotency-Key` |
| `GET` | `/api/v1/pix/desembolsos/{id}` | `FINANCEIRO`, `ADMIN`, `BACKOFFICE` | autenticado — **leitura local** (nao chama provider) |
| `POST` | `/api/v1/pix/desembolsos/{id}/status` | `FINANCEIRO`, `ADMIN`, `BACKOFFICE` | **step-up** (`@RequireStepUp`) — reconcilia consultando o provider |

- `POST` retorna **201** quando cria; **200** no retorno idempotente (mesma key/contrato/valor/chave). Payload divergente -> **409**.
- Request: `contratoId`, `valor`, `chavePixDestino`. Response: id/contrato/status/valor/**mascara** da chave + `novo`. A chave em claro **nunca** volta na resposta.

### Elegibilidade (ports de leitura cruzada)

O modulo `pix` valida elegibilidade sem acoplar-se a entidades de outros modulos — ports em `pix.application.port.out` + adapters em `pix.infrastructure.adapter.{contratos,cobranca,escrow}`:

1. contrato existe e esta `ASSINADO`;
2. existe agenda de cobranca ativa para o contrato;
3. existe wallet/conta escrow operacional (`ATIVA`) para a proposta;
4. valor informado igual ao valor financiado do contrato (proposta).

Inelegibilidade -> 404 (contrato inexistente) ou 422 (nao assinado / sem agenda / escrow inoperante / valor divergente). Codigos `PIX-404-*`/`PIX-422-*`.

### Idempotencia e duplicidade

- `Idempotency-Key` obrigatoria. Reapresentacao consistente -> transferencia existente; divergente -> 409 (`PIX-409-IDEMPOTENCIA`).
- **Um desembolso por contrato**: UNIQUE parcial `pix_transferencia (contrato_id) WHERE status ocupado` (CRIADA/SOLICITADA/PROCESSANDO/CONCLUIDA) — `FALHOU`/`CANCELADA` liberam retry. Duplicidade -> 409 (`PIX-409-DESEMBOLSO-DUPLICADO`); corrida concorrente -> 409 (`PIX-409-CONFLITO-CONCORRENTE`, sem reconsulta em tx rollback-only).

### Fluxo de provider e status

`SolicitarDesembolsoPixUseCase` orquestra em 2 fases via `DesembolsoTransacaoService` (`REQUIRES_NEW`): fase 1 **comita** `CRIADA` ANTES da chamada externa (**anti-orphan real** — flush nao basta, precisa commit); fase 2 chama `PixProvider.solicitarTransferencia` e aplica status via `SincronizadorStatusTransferencia` (PENDENTE->SOLICITADA, PROCESSANDO->PROCESSANDO, CONCLUIDA->CONCLUIDA, REJEITADA/falha tecnica->FALHOU). Se a fase 2 falhar, o registro local persiste rastreavel. `ConsultarStatusDesembolsoPixUseCase` (POST `/status`/reprocesso) reconsulta o provider e sincroniza idempotentemente (so avanca; terminal nao falha); leitura **resiliente** (provider indisponivel devolve status local com `providerIndisponivel=true`; `providerConsultado` distingue reconsulta real de no-op). O GET faz leitura local (`reconsultarProvider=false`).

### Minimizacao de dados (CMN 4.656/2018 + LGPD)

A chave Pix destino **nunca** eh persistida em claro: `pix_transferencia` guarda apenas `chave_destino_hash` (SHA-256, consistencia idempotente) e `chave_destino_mascara` (resposta/auditoria). A chave em claro so trafega no request e no comando ao provider. Migrations: `V47` (evolucao da transferencia + unique parcial por contrato), `V49` (unique parcial de `external_id`).

### Backoffice

Falha de desembolso (`PixTransferenciaFalhouEvent`) gera item `DESEMBOLSO_PIX_FALHOU` na fila operacional (`DesembolsoPixFalhouListener`, AFTER_COMMIT). Reprocesso (`PixTransferenciaRetentativaStrategy`, `TipoChamadaProvider.PIX_TRANSFERENCIA`) eh **seguro**: apenas reconsulta status (nunca reenvia — chave nao persistida); provider indisponivel -> FALHA (sem falso sucesso). `BACKOFFICE` nao inicia desembolso novo. Detalhe do item resolvido por `PixTransferenciaObjetoOriginalAdapter` (status + mascara). Migration `V48` estende os CHECKs de backoffice.

## Auditoria

`PixWebhookAuditListener` (`@TransactionalEventListener` AFTER_COMMIT + `@Transactional` REQUIRES_NEW, padrao `CobrancaAuditListener`) grava em `audit_log_seguranca`:

| Evento | Quando |
| ------ | ------ |
| `PIX_WEBHOOK_RECEBIDO` | webhook registrado no outbox |
| `PIX_WEBHOOK_PROCESSADO` | recebimento criado ou status reconhecido |
| `PIX_WEBHOOK_FALHOU` | falha de processamento |

`usuario_id` fica nulo (autenticacao por HMAC). Detalhes JSON carregam apenas `eventId` + `tipo` + `provider` — sem payload, hash ou dado bancario. CHECK ampliado em `V46`.

Desembolso (Sprint 20) — `PixDesembolsoAuditListener` (AFTER_COMMIT + REQUIRES_NEW), CHECK ampliado em `V50`:

| Evento | Quando |
| ------ | ------ |
| `PIX_TRANSFERENCIA_SOLICITADA` | provider aceitou a transferencia |
| `PIX_TRANSFERENCIA_CONCLUIDA` | desembolso liquidado |
| `PIX_TRANSFERENCIA_FALHOU` | rejeicao do provider ou falha tecnica |

`usuario_id` aponta para o **tomador** (sujeito da operacao); o operador que disparou fica em `criado_por` da `pix_transferencia` (auditoria JPA). Detalhes JSON: apenas ids + valor + status/motivo — a **chave Pix nunca entra no audit log** (os eventos sequer a transportam).

## Testes

- Dominio: `PixDomainTest` (estados validos/invalidos, hash SHA-256, scale, blank).
- Persistencia/idempotencia: `PixRepositoryTest` (unique, unique parcial, composto).
- Providers: `FakePixProviderTest`, `FakeEscrowProviderTest`, `CelcoinPixProviderIT`, `CelcoinEscrowProviderIT` (WireMock: OAuth Bearer, parsing, map de status, retry 5xx, traducao de erro, Idempotency-Key).
- Webhook: `PixWebhookIT` (HMAC + alias, idempotencia, minimizacao, FALHOU, IGNORADO, correlationId, auditoria).

## Pendencias

Entregue na Sprint 20: desembolso assistido (REST + elegibilidade + idempotencia + step-up estrito + provider + status + webhook + backoffice + auditoria).

Follow-ups / Sprint 21:

- **Smoke E2E RestAssured full-chain** do desembolso (contrato ASSINADO + agenda + escrow + step-up token) — registrado como follow-up; logica coberta por testes de use case e HTTP/seguranca por `@WebMvcTest` (`PixDesembolsoControllerTest`, aspect real).
- **Gap escrow `externalId`** para Celcoin real: `Wallet`/`ContaEscrow` locais (Sprint 12) tem `external_id` nulo; desembolso via Celcoin real depende dele. Use cases de provisionamento escrow via `EscrowProvider` + auditoria `ESCROW_*_PROVIDER_CRIADA`.
- Conciliacao automatica de `PixRecebimento` com parcela de cobranca (Sprint 21).
- Retry predicate Java (retry so em 5xx) para `celcoin-pix` / `celcoin-escrow`.
- Contrato Celcoin real (endpoints/campos do skeleton sao suposicao validada por WireMock, nao pelo contrato fechado).
