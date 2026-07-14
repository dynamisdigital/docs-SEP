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

O `EscrowProvider` foi criado no modulo `escrow` (nao em `pix`): Pix consome escrow por porta; escrow continua capacidade transversal. O `RegistrarMovimentacaoEscrowUseCase` local (Sprint 12) nao foi alterado na Sprint 19; a Sprint 29 o ampliou com `registrarAporte` (ver secao de aporte abaixo).

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
      RECEBIMENTO_PIX      -> cria PixRecebimento (dedup por end_to_end_id),
                              correlaciona por txid e concilia a parcela
                              (Sprint 21) + PROCESSADO
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
- A partir da Sprint 21, `RECEBIMENTO_PIX` correlaciona e concilia a parcela (ver secao abaixo). `STATUS_TRANSFERENCIA` segue o desembolso (Sprint 20).

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

## Recebimento e conciliacao (Sprint 21 — Epic 15 parte 3)

> Spec: [`specs/fase-3/021-sprint-21-pix-recebimento-conciliacao.md`](../../specs/fase-3/021-sprint-21-pix-recebimento-conciliacao.md). Steps: [`steps-fase-3/backend/021-sprint-21-steps.md`](../../steps-fase-3/backend/021-sprint-21-steps.md).

Recebimento Pix de parcelas com conciliacao automatica, mantendo a operacao assistida para divergencias. O dinheiro entra via webhook; a baixa passa pelo caminho oficial de `cobranca`.

### Referencia Pix deterministica (`txid`)

`PixReferenciaRecebimento` (V51) liga um `txid` controlado pelo SEP a uma parcela — sem ele nao ha baixa automatica. `GerarReferenciaRecebimentoPixUseCase` le a parcela elegivel via `CobrancaRecebimentoPixQueryPort` (o `pix` nunca toca entidades de cobranca), persiste a referencia `ATIVA` (anti-orphan: flush antes do provider; corrida cai na UNIQUE parcial `1 ATIVA por parcela` -> 409) e pede o copia-cola ao `PixProvider.criarCobrancaRecebimento`. Idempotente por parcela: referencia `ATIVA` existente e reaproveitada (`novo=false`). So persiste ids/txid/valor/copia-cola — sem dado pessoal/bancario.

### Endpoints REST (`/api/v1/pix/recebimentos`)

| Metodo | Rota | Roles | Observacao |
| ------ | ---- | ----- | ---------- |
| `POST` | `/referencias` | `FINANCEIRO`, `ADMIN` | gera/reaproveita referencia; 201 (novo) / 200 (idempotente). **Sem step-up** (cobranca para pagamento proprio) |
| `GET` | `/referencias/{id}` | `FINANCEIRO`, `ADMIN`, `BACKOFFICE` | leitura local |
| `GET` | `/{id}` | `FINANCEIRO`, `ADMIN`, `BACKOFFICE` | recebimento (operacao assistida) |

Self-service do tomador (CLIENTE owner) fica para o front das jornadas (follow-up); nesta sprint a geracao eh operada por `FINANCEIRO`/`ADMIN`.

### Conciliacao do webhook

`ProcessarWebhookPixUseCase` para `RECEBIMENTO_PIX`: cria `PixRecebimento` (insert isolado em `PixRecebimentoTransacaoService`, `REQUIRES_NEW` — corrida na UNIQUE de `end_to_end_id` vira idempotente sem deixar a tx do webhook rollback-only), correlaciona pela referencia (`txid` -> fallback `providerReferenciaId`). Sem referencia -> `NAO_IDENTIFICADO`; com referencia -> `EM_PROCESSAMENTO` + dispara `ConciliarRecebimentoPixUseCase` (`REQUIRES_NEW`). Falha de baixa marca o recebimento `FALHOU` em tx separada e o webhook conclui `PROCESSADO` (sem 5xx).

`ConciliarRecebimentoPixUseCase` baixa a parcela via `CobrancaRecebimentoPixPort` -> adapter -> `RegistrarRecebimentoUseCase` de cobranca (dono do lock, valor devido, status, `Recebimento` e movimentacao escrow). `meioPagamento=PIX`, `registradoPor=tomadorId`. **Idempotencia em camadas**: webhook por `(provider,event_id)`; recebimento por `end_to_end_id`; baixa/escrow por `Idempotency-Key = pix:<endToEndId>` (escrow registrado uma unica vez). Valor exato com parcela quitada -> referencia `PAGA`; parcial/maior -> baixa aplicada + referencia `DIVERGENTE`. `endToEndId` ausente ou referencia nao-ATIVA -> nao baixa (divergencia).

### Backoffice de divergencias

Toda divergencia (referencia desconhecida, nao-ATIVA, `endToEndId` ausente, valor parcial/maior, falha de baixa) publica `PixRecebimentoDivergenteEvent`; `RecebimentoPixDivergenteListener` (AFTER_COMMIT) cria item idempotente `RECEBIMENTO_PIX_DIVERGENTE`/`PIX_RECEBIMENTO` (`V52` estende os CHECKs). Detalhe por `PixRecebimentoObjetoOriginalAdapter` (status/valor/parcela — nunca payload/chave). **Sem reprocesso de provider**: o Pix ja foi recebido; o tratamento eh operacao assistida (assumir/comentar/resolver/ignorar). Nenhum caso divergente fica apenas em log.

## Leitura owner-scoped (Sprint 26 — Gates P1-P3 da M-Sprint 11)

> Spec: [`specs/fase-3/026-sprint-26-pix-leitura-owner-scoped.md`](../../specs/fase-3/026-sprint-26-pix-leitura-owner-scoped.md). Steps: [`steps-fase-3/backend/026-sprint-26-steps.md`](../../steps-fase-3/backend/026-sprint-26-steps.md).

Tres leituras publicas, minimas e read-only que expoem o estado Pix ao tomador e a credora **donos** da operacao, sem liberar nenhuma rota operacional das Sprints 19-21 a `CLIENTE`. Destravam a M-Sprint 11 (Pix mobile). Ownership validada ANTES de revelar; recurso inexistente e recurso alheio retornam o mesmo `404` neutro (sem UUID, anti-enumeracao). Sem step-up, provider, evento ou auditoria (mesma postura das leituras do tomador em `cobranca`). Unica migration: indice de leitura `V53` em `pix_recebimento (referencia_id, data_criacao)` (P2), sem mudanca de schema de dominio.

### Enums publicos

- `StatusPixPublico` (P1/P3): `EM_PROCESSAMENTO | LIQUIDADO | FALHOU | CANCELADO`.
- `StatusPixParcelaPublico` (P2): `AGUARDANDO | EM_PROCESSAMENTO | LIQUIDADO | DIVERGENTE | FALHOU | EXPIRADO | CANCELADO`.

Nunca reutilizam os enums/DTOs operacionais. Mapa transferencia->publico em fonte unica (`StatusPixPublicoMapper`): `CRIADA|SOLICITADA|PROCESSANDO -> EM_PROCESSAMENTO`, `CONCLUIDA -> LIQUIDADO`, `FALHOU -> FALHOU`, `CANCELADA -> CANCELADO`.

### Endpoints

| Gate | Rota | Auth | Modulo |
| ---- | ---- | ---- | ------ |
| P1 | `GET /api/v1/pix/contratos/{contratoId}/desembolso` | `hasRole('CLIENTE')` | `pix` |
| P2 | `GET /api/v1/pix/parcelas/{parcelaId}/status` | `hasRole('CLIENTE')` | `pix` |
| P3 | `GET /api/v1/credores/carteira/{operacaoId}/pix` | `isAuthenticated()` (sem role `CREDORA`) | `credores` |

- **P1** (`PixDesembolsoTomadorResponse { status: StatusPixPublico, valor, atualizadoEm }`): ownership por `ContratoDesembolsoQueryPort` (contrato -> `tomadorId`); transferencia mais recente do contrato via novo finder **sem filtro** `findFirstByContratoIdOrderByDataCriacaoDesc` (reflete a tentativa corrente inclusive `FALHOU`/`CANCELADA`; o finder filtrado da Sprint 20 segue so para bloqueio de novo desembolso).
- **P2** (`PixPagamentoParcelaResponse { status: StatusPixParcelaPublico, valor, atualizadoEm, mensagemPublica }`): ownership por `ParcelaTomadorQueryPort` (parcela -> `agenda.contratoId` -> `tomadorId`). Estado derivado por `StatusPixParcelaPublicoMapper` a partir da referencia atual da parcela + recebimento buscado pela `referenciaId` dessa referencia (nunca o mais recente da parcela). Precedencia: estados terminais da referencia (`CANCELADA|EXPIRADA|PAGA|DIVERGENTE`) sao autoritativos; so com referencia `ATIVA` o recebimento orienta (`NAO_IDENTIFICADO->DIVERGENTE`, `FALHOU`, `CONCILIADO->LIQUIDADO`, `RECEBIDO|EM_PROCESSAMENTO->EM_PROCESSAMENTO`); default `AGUARDANDO`. `atualizadoEm` = `dataModificacao` da fonte vencedora. `mensagemPublica` fixa/sanitizada so em `DIVERGENTE`/`FALHOU`. Historico liquidado segue no B1 da M-9.
- **P3** (`PixOperacaoCredoraResponse { status: String, valor, atualizadoEm }`): no modulo `credores`; resolve a credora por `usuarioId` e valida a posse da operacao (`findByIdAndEmpresaCredoraId`) antes de consultar o Pix por `operacao.contratoId` via porta consumer-driven `PixOperacaoStatusQueryPort` (adapter delega ao `ConsultarStatusPixPorContratoUseCase` de `pix`; `status` cruza como `String` para `credores` nao depender do dominio de `pix`). Excecao 404 **generica sem UUID** (`StatusPixOperacaoNaoEncontradoException`), ao contrario das excecoes de carteira que ecoam o UUID.

Nenhuma resposta expoe chave Pix, `txid`, `endToEndId`, IDs internos, provider, escrow, motivo tecnico ou dados do tomador (na jornada da credora).

### Testes

- Unit: `StatusPixPublicoMapperTest`, `StatusPixParcelaPublicoMapperTest` (precedencia exaustiva + referencia terminal vence recebimento posterior), `ConsultarDesembolsoTomadorUseCaseTest`, `ConsultarStatusPixParcelaUseCaseTest`, `ConsultarStatusPixPorContratoUseCaseTest`, `ConsultarStatusPixOperacaoCredoraUseCaseTest`.
- Web (`@WebMvcTest`): `PixTomadorControllerTest`, `EmpresaCredoraCarteiraControllerTest` (200/404/400/403, campos proibidos).
- Integracao E2E (auth real + Postgres): `PixTomadorLeituraIT` (P1/P2 — ownership, 404 anti-enumeracao, finder sem filtro, ordenacao, pareamento por `referenciaId`, isolamento operacional) e `CredoraOperacaoPixIT` (P3).

## Aporte da credora no escrow (Sprint 29 — Epic 15)

O aporte assistido da credora (modulo `credores`, ver [`CREDORES.md`](./CREDORES.md)) movimenta o
escrow **local** (fake) — nenhum dinheiro real; o port `EscrowProvider` e o adapter Celcoin ficam
intocados (ativacao real na Fase 5).

- `RegistrarMovimentacaoEscrowUseCase.registrarAporte(cmd)` — mesmo contrato de idempotencia do
  recebimento (`idempotency_key` UNIQUE global; replay retorna a movimentacao existente), mas a
  movimentacao `Aporte` nasce `EM_PROCESSAMENTO` e **nao credita** o saldo da wallet no registro.
- Chave de idempotencia no escrow e namespaced: `aporte:<aporteId>` (evita colisao com o UNIQUE
  global e cabe no `VARCHAR(100)`); `external_reference_id` = id do `AporteCredora`.
- `ReconciliarAporteEscrowUseCase` — `liquidar` transiciona `EM_PROCESSAMENTO -> LIQUIDADA` e
  credita a wallet **uma unica vez**; `falhar` transiciona para `FALHOU` sem credito. Ambos
  idempotentes e serializados por `SELECT FOR UPDATE` na movimentacao + lock da wallet via
  `findByPropostaIdForUpdate` (mesmo lock do recebimento — sem credito duplo nem lost update).
- `MovimentacaoEscrow` ganhou `criarAporte`, `marcarLiquidada` e `marcarFalhou` (guardas de estado;
  mensagens de erro so com o status).
- O modulo `credores` consome tudo por portas consumer-driven (`RegistrarAporteEscrowPort`,
  `ReconciliarAporteEscrowPort`) com adapter unico (`AporteEscrowAdapter`) que sanitiza erro bruto
  (`AporteEscrowException`, mensagem fixa).
- Wallet reusada: a mesma wallet por proposta da Sprint 12 (sem wallet nova por operacao).

## Gestao de chaves da conta operacional (Sprint 31 — Epic 15)

> Spec: [`specs/fase-4/031-sprint-31-pix-gestao-chaves.md`](../../specs/fase-4/031-sprint-31-pix-gestao-chaves.md). Steps: [`steps-fase-4/backend/031-sprint-31-steps.md`](../../steps-fase-4/backend/031-sprint-31-steps.md).

Gestao **assistida** (financeiro/admin) de chaves Pix da conta operacional/escrow via Provider
Pattern. **Nenhum dinheiro e movido**; desembolso/recebimento/conciliacao (Sprints 19-21) ficam
intocados. Roda sobre fake default; o skeleton Celcoin e coberto por WireMock e **nao** e ativado
(Fase 5).

### Endpoints REST (`/api/v1/pix/chaves`)

| Metodo | Rota | Roles | Seguranca |
| ------ | ---- | ----- | --------- |
| `POST` | `/api/v1/pix/chaves` | `FINANCEIRO`, `ADMIN` | **step-up estrito** (`@RequireStepUpEstrito`) + `Idempotency-Key` |
| `GET` | `/api/v1/pix/chaves` | `FINANCEIRO`, `ADMIN` | autenticado — leitura local, **sem step-up**, nunca consulta o provider |
| `DELETE` | `/api/v1/pix/chaves/{chaveId}` | `FINANCEIRO`, `ADMIN` | **step-up estrito** (`@RequireStepUpEstrito`) |

- `POST` retorna **201** quando cria; **200** no replay idempotente (mesma key + mesmo tipo/valor).
  Key reutilizada com payload diferente ou chave equivalente ja `ATIVA` -> **409**. Request:
  `tipo` + `valor`. Response: `id`, `tipo`, `valorMascarado`, `status`, `criadaEm`, `removidaEm`
  (sem `novo`; ele so decide o status HTTP).
- `DELETE` retorna **204** para remocao nova **ou** replay de chave ja `INATIVA`; UUID inexistente
  (ou fora do escopo da conta) -> **404 neutro** com mensagem que nao ecoa o UUID.
- `GET` inclui `ATIVA` e `INATIVA` (historico), da mais recente para a mais antiga.

### Tipos e normalizacao

`TipoChavePix`: `CPF | CNPJ | EMAIL | TELEFONE | EVP`. `NormalizadorChavePix` canonicaliza uma
unica vez antes de hash/mascara/provider: CPF 11 e CNPJ 14 digitos (remove pontuacao) **com
digitos verificadores mod-11 validos e rejeicao de sequencias repetidas**; TELEFONE
E.164 Brasil `+55DDDNUMERO` (10-11 digitos nacionais, DDD com ambos os digitos 1-9; sem DDI assume
`+55`); EMAIL trim + lowercase (regex estrita, limite DICT 77); EVP UUID canonico lowercase. Valor
invalido -> `400` **sem ecoar o valor**.

### Dominio, persistencia e concorrencia

- `ChavePix` (`chave_pix`, `V58`): estados `ATIVA -> INATIVA` (unica transicao; remocao e logica,
  historico nunca apagado). Campos minimizados: `valor_hash` SHA-256 (64) + `valor_mascarado`
  (<= 80) — **nao existe coluna de valor bruto**; `provider_key_id` e `idempotency_key` sao
  internos e nunca aparecem em resposta/erro/auditoria.
- Protecoes no banco: UNIQUE `(conta_escrow_id, idempotency_key)`; UNIQUE **parcial**
  `(conta_escrow_id, tipo, valor_hash) WHERE status='ATIVA'` (chave equivalente pode ser
  recadastrada apos inativacao, com key nova); CHECK de coerencia da remocao (INATIVA exige ator +
  instante); FK sem CASCADE.
- Conta operacional resolvida por porta dedicada (`ContaOperacionalEscrowQueryPort` ->
  `ContaEscrow` titular `SEP-COBRANCA` `ATIVA`; `contaTecnicaId` = `external_id` quando existir).
- Cadastro (`CadastrarChavePixUseCase`): serializado por **advisory lock transacional** em
  (conta, tipo, hash) adquirido ANTES das verificacoes e da chamada externa — requisicoes
  concorrentes com o mesmo valor e keys diferentes nao cadastram duas chaves no provider (o
  perdedor re-checa sob o lock e leva 409 sem chamada externa; zero chave orfa). Provider e
  chamado **antes** de persistir — falha externa nao cria chave `ATIVA` nem auditoria; o provider
  honra idempotencia (mesma key), permitindo retry seguro; as UNIQUEs da V58 seguem como defesa
  residual, convergidas para replay ou 409, nunca 500.
- Remocao (`RemoverChavePixUseCase`): `SELECT FOR UPDATE` escopado na conta serializa remocoes
  concorrentes (uma unica chamada de provider/auditoria); provider falha -> rollback, chave segue
  `ATIVA` para retentativa.

### Provider

`PixProvider` ganhou `cadastrarChave(comando, idempotencyKey, correlationId)` (resposta = so
`providerKeyId`) e `removerChave(providerKeyId, correlationId)` — mesmo mecanismo de selecao
(`app.pix.provider`). `FakePixProvider` (default): idempotente por key (`computeIfAbsent`),
thread-safe, falhas armaveis e `reset()`; retem apenas **fingerprint SHA-256** do comando — o
valor em claro nao fica em memoria alem do request. `CelcoinPixProvider`: `POST/DELETE /pix/keys` — contrato
**skeleton local da Fase 4** (validar contra a doc real na Fase 5); reusa OAuth2, retry/circuit
breaker, `MDCBridge` e traducao sanitizada; `404` no DELETE e sucesso idempotente sem retry. A
chave em claro so trafega no body HTTP em memoria; logs levam apenas `key_id`.

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

Gestao de chaves (Sprint 31) — `PixChaveAuditListener` (AFTER_COMMIT + REQUIRES_NEW), CHECK ampliado em `V59`:

| Evento | Quando |
| ------ | ------ |
| `PIX_CHAVE_CADASTRADA` | chave cadastrada no provider e persistida `ATIVA` (so criacao nova; replay nao re-audita) |
| `PIX_CHAVE_REMOVIDA` | transicao efetiva `ATIVA -> INATIVA` (replay de chave inativa nao re-audita) |

`usuario_id` = **operador** (financeiro/admin) que executou a mutacao. Detalhes JSON: apenas `chaveId`, `contaEscrowId` (local), `tipo` e `status` — nunca valor, hash, mascara, `providerKeyId` ou idempotency key (os eventos sequer os transportam).

## Testes

- Dominio: `PixDomainTest` (estados validos/invalidos, hash SHA-256, scale, blank).
- Persistencia/idempotencia: `PixRepositoryTest` (unique, unique parcial, composto).
- Providers: `FakePixProviderTest`, `FakeEscrowProviderTest`, `CelcoinPixProviderIT`, `CelcoinEscrowProviderIT` (WireMock: OAuth Bearer, parsing, map de status, retry 5xx, traducao de erro, Idempotency-Key).
- Webhook: `PixWebhookIT` (HMAC + alias, idempotencia, minimizacao, FALHOU, IGNORADO, correlationId, auditoria).
- Recebimento (Sprint 21): `ProcessarWebhookPixRecebimentoTest` (correlacao txid/fallback, NAO_IDENTIFICADO, corrida idempotente, dispara conciliacao), `ConciliarRecebimentoPixUseCaseTest` (exato->PAGA, parcial/maior->DIVERGENTE, nao-ATIVA/sem-e2e nao baixa, replay, marcarFalha), `RecebimentoPixDivergenteListenerTest`, `PixRecebimentoObjetoOriginalAdapterTest`, `PixRecebimentoControllerTest` (`@WebMvcTest`, roles/403/404), `PixRecebimentoConciliacaoIT` (smoke E2E full-chain: referencia->webhook->CONCILIADO->parcela PAGA->Recebimento PIX + escrow->replay nao duplica).
- Gestao de chaves (Sprint 31): `NormalizadorChavePixTest` (normalizacao/rejeicao por tipo sem eco), `ChavePixTest` (dominio, ATIVA->INATIVA idempotente), `ChavePixRepositoryTest` (schema sem valor bruto, UNIQUEs, CHECK de coerencia, lock serializa 2 transacoes reais), `FakePixProviderTest` (chaves: idempotencia, conflito sanitizado, falhas armadas, reset), `CelcoinPixProviderIT` (WireMock: POST/DELETE `/pix/keys`, Bearer + Idempotency-Key, 404 idempotente sem retry, 4xx/5xx sanitizados), `CadastrarChavePixUseCaseTest`/`ListarChavesPixUseCaseTest`/`RemoverChavePixUseCaseTest`, `PixChaveAuditListenerTest`, `PixChaveControllerTest` (`@WebMvcTest`: roles, step-up estrito, 400 sem eco, campos proibidos), `PixChaveIT` (E2E auth real + Postgres: POST->GET->DELETE->GET, replay, colisao normalizada, falha de provider sem estado orfao, minimizacao em tabela/JSON/audit, auditoria unica).

## Pendencias

Entregue na Sprint 20: desembolso assistido. Entregue na Sprint 21: recebimento Pix de parcela (referencia `txid` + REST + webhook correlacionado + baixa via port de cobranca + escrow idempotente + backoffice de divergencias). Entregue na Sprint 31: gestao assistida de chaves Pix da conta operacional (cadastro idempotente + listagem mascarada + remocao logica, fake default + skeleton Celcoin WireMock; nenhum dinheiro movido).

Follow-ups:
- **Self-service do tomador** (CLIENTE owner gera referencia da propria parcela) — fica para o front das jornadas (web/mobile).
- **Reprocesso local** de recebimento `FALHOU` (re-rodar conciliacao sem provider) — nao implementado; tratamento atual eh operacao assistida.

- **Smoke E2E RestAssured full-chain** do desembolso (contrato ASSINADO + agenda + escrow + step-up token) — registrado como follow-up; logica coberta por testes de use case e HTTP/seguranca por `@WebMvcTest` (`PixDesembolsoControllerTest`, aspect real).
- **Gap escrow `externalId`** para Celcoin real: `Wallet`/`ContaEscrow` locais (Sprint 12) tem `external_id` nulo; desembolso via Celcoin real depende dele. Use cases de provisionamento escrow via `EscrowProvider` + auditoria `ESCROW_*_PROVIDER_CRIADA`.
- Conciliacao automatica de `PixRecebimento` com parcela de cobranca (Sprint 21).
- Retry predicate Java (retry so em 5xx) para `celcoin-pix` / `celcoin-escrow`.
- Contrato Celcoin real (endpoints/campos do skeleton sao suposicao validada por WireMock, nao pelo contrato fechado) — inclui `POST/DELETE /pix/keys` da Sprint 31 (gestao de chaves); validacao obrigatoria contra a documentacao/credenciais reais na Fase 5.
