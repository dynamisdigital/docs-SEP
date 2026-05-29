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
      STATUS_TRANSFERENCIA -> apenas reconhece (PROCESSADO; sem desembolso)
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

## Auditoria

`PixWebhookAuditListener` (`@TransactionalEventListener` AFTER_COMMIT + `@Transactional` REQUIRES_NEW, padrao `CobrancaAuditListener`) grava em `audit_log_seguranca`:

| Evento | Quando |
| ------ | ------ |
| `PIX_WEBHOOK_RECEBIDO` | webhook registrado no outbox |
| `PIX_WEBHOOK_PROCESSADO` | recebimento criado ou status reconhecido |
| `PIX_WEBHOOK_FALHOU` | falha de processamento |

`usuario_id` fica nulo (autenticacao por HMAC). Detalhes JSON carregam apenas `eventId` + `tipo` + `provider` — sem payload, hash ou dado bancario. CHECK ampliado em `V46`.

Eventos de provider de desembolso/escrow (`PIX_TRANSFERENCIA_SOLICITADA`, `ESCROW_*_PROVIDER_CRIADA`) ficam para as Sprints 20/21, quando houver use case que os dispare.

## Testes

- Dominio: `PixDomainTest` (estados validos/invalidos, hash SHA-256, scale, blank).
- Persistencia/idempotencia: `PixRepositoryTest` (unique, unique parcial, composto).
- Providers: `FakePixProviderTest`, `FakeEscrowProviderTest`, `CelcoinPixProviderIT`, `CelcoinEscrowProviderIT` (WireMock: OAuth Bearer, parsing, map de status, retry 5xx, traducao de erro, Idempotency-Key).
- Webhook: `PixWebhookIT` (HMAC + alias, idempotencia, minimizacao, FALHOU, IGNORADO, correlationId, auditoria).

## Pendencias para Sprints 20/21

- Desembolso Pix real (use case que solicita ao `PixProvider`) + auditoria `PIX_TRANSFERENCIA_SOLICITADA`.
- Use cases de provisionamento escrow via `EscrowProvider` + auditoria `ESCROW_*_PROVIDER_CRIADA` + coluna `Wallet.externalId`.
- Conciliacao automatica de `PixRecebimento` com parcela de cobranca.
- Retry predicate Java (retry so em 5xx) para `celcoin-pix` / `celcoin-escrow`.
- Contrato Celcoin real (endpoints/campos do skeleton sao suposicao validada por WireMock, nao pelo contrato fechado).
