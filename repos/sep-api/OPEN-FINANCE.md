# OPEN-FINANCE — sep-api

Documento operacional do ciclo Open Finance Brasil integrado ao modulo `credito` (Sprint 9 — Epic 6 parte 2). Atualizado pos-implementacao.

> Spec: [`specs/fase-2/009-sprint-9-credito-open-finance.md`](../../specs/fase-2/009-sprint-9-credito-open-finance.md). Steps: [`steps-fase-2/backend/009-sprint-9-steps.md`](../../steps-fase-2/backend/009-sprint-9-steps.md).
> ADRs relacionados: [0004](../../adr/0004-provider-pattern-para-integracoes-externas.md), [0008](../../adr/0008-wiremock-para-testes-integracao-celcoin.md), [0012](../../adr/0012-motor-de-regras-de-credito-interno.md).

## Objetivo

Enriquecer a analise de credito (Sprint 8) com consentimento Open Finance Brasil opt-in. Tomador autoriza compartilhamento de dados bancarios via Celcoin/Finansystech; backend recebe snapshot consolidado e reavalia o score com `RegraOpenFinanceMovimentacao`.

## Fluxo end-to-end

```text
Tomador com proposta EM_ANALISE/PRE_APROVADA/PENDENCIA
  -> POST /api/v1/credito/propostas/{id}/open-finance/consentimento
     - persiste ConsentimentoOpenFinance local em PENDENTE (sem idExterno)
     - chama OpenFinanceProvider.iniciarConsentimento com Idempotency-Key
       deterministica 'open-finance:consent:<consentimento.id>'
     - vincularExterno + save: persiste url + idExterno Celcoin
     - publica OpenFinanceConsentimentoIniciadoEvent
  -> resposta 201 com urlAutorizacao
  -> tomador autoriza no provider externo (fluxo OF Brasil)
  -> POST /api/v1/webhooks/celcoin/open-finance (HMAC + Idempotency-Key)
     - ProcessarWebhookOpenFinanceUseCase persiste outbox
     - roteia por type:
         consent.authorized -> ProcessarCallbackConsentimentoUseCase
           - marca AUTORIZADO + publica OpenFinanceAutorizadoEvent
         consent.denied/expired -> marca NEGADO + publica
                                   OpenFinanceNegadoEvent
         movement.data -> apenas ack (movimentacao real e PULL)
  -> OpenFinanceAutorizadoListener AFTER_COMMIT
     -> ConsultarMovimentacaoOpenFinanceUseCase (REQUIRES_NEW)
        - chama provider.consultarMovimentacao (PULL)
        - sanitiza payload via OpenFinancePayloadSanitizer (LGPD)
        - persiste MovimentacaoOpenFinance (V18 unique consentimento_id)
        - publica OpenFinanceDadosRecebidosEvent
  -> OpenFinanceDadosRecebidosListener AFTER_COMMIT
     -> ReavaliarPropostaComOpenFinanceUseCase (REQUIRES_NEW)
        - skip se proposta APROVADA/REJEITADA (final)
        - re-executa motor com contexto enriquecido
        - sobrescreve ScoreInterno + RegraCreditoAvaliada
        - promove EM_ANALISE -> PRE_APROVADA quando threshold cruzado
          (conservador: nao rejeita automaticamente)
        - publica OpenFinanceReavaliacaoEvent
  -> OpenFinanceAuditListener AFTER_COMMIT (REQUIRES_NEW)
     -> grava audit_log_seguranca pra cada evento
```

## Estados do consentimento

| Status | Significado |
| ------ | ----------- |
| `PENDENTE` | Link criado, aguardando autorizacao do tomador. V17 unique parcial garante 1 PENDENTE por proposta. |
| `AUTORIZADO` | Tomador autorizou — dados disponiveis pra consulta via provider. |
| `NEGADO` | Tomador recusou — score nao muda; `consent.expired` mapeado pra este estado tambem. |
| `EXPIRADO` | Reservado pra futura limpeza administrativa; nao usado no fluxo atual. |

Transicoes unidirecionais a partir de PENDENTE. `consent.denied` apos `consent.authorized` apenas loga WARN — provider e fonte de verdade externa (TODO sprint futura: revogacao tardia).

## Endpoints

| Metodo | Path | Auth | Descricao |
| ------ | ---- | ---- | --------- |
| `POST` | `/api/v1/credito/propostas/{id}/open-finance/consentimento` | CLIENTE dono | Inicia consentimento — anti-orphan 2-fase |
| `GET` | `/api/v1/credito/propostas/{id}/open-finance` | CLIENTE dono ou FINANCEIRO/ADMIN | Status + ultima movimentacao consolidada |
| `POST` | `/api/v1/webhooks/celcoin/open-finance` | HMAC (`X-Webhook-Signature` ou `X-Celcoin-Signature`) + `Idempotency-Key` | Callback do provider |

### Validacoes do POST consentimento (codigo OF-400-001 / OF-400-002):

- `cpfCnpjTomador`: 11 ou 14 digitos puros (`@Pattern \d{11}|\d{14}`)
- `redirectUri`: `^https?://[^\s]+$` — bloqueia `javascript:`, `data:` (anti-SSRF/open-redirect)

### Codigos HTTP

- `POST consentimento`: 201 / 400 / 401 / 403 / 404 / 409 / 422
- `GET status`: 200 / 401 / 403 / 404
- `POST webhook`: 202 (aceito ou duplicado idempotente) / 400 / 401

## Variaveis de ambiente

```yaml
app:
  open-finance:
    provider: ${APP_OPEN_FINANCE_PROVIDER:fake}  # 'fake' (default) ou 'celcoin'
  celcoin:
    open-finance:
      base-url: ${APP_CELCOIN_OPEN_FINANCE_BASE_URL:https://sandbox.openfinance.celcoin.dev/open-finance/v1}
      client-id: ${APP_CELCOIN_OPEN_FINANCE_CLIENT_ID:}
      client-secret: ${APP_CELCOIN_OPEN_FINANCE_CLIENT_SECRET:}
  webhooks:
    secrets:
      celcoin-open-finance: ${APP_WEBHOOK_SECRET_CELCOIN_OPEN_FINANCE:dev-open-finance-webhook-secret-change-me}

resilience4j:
  circuitbreaker.instances.celcoin-open-finance: default
  retry.instances.celcoin-open-finance: 3 attempts, 500ms wait, 5xx/IO retry
  timelimiter.instances.celcoin-open-finance: 30s
```

OAuth2 client-credentials cache via `CelcoinOpenFinanceOAuthTokenProvider` (modulo `credito`, isolado do bloco onboarding — preserva DDD).

## Dados persistidos

### `consentimento_open_finance`

PK + `proposta_id` (FK sem CASCADE) + `tomador_id` (FK sem CASCADE) + `status` + `url_autorizacao` + `id_externo_celcoin` + datas (`data_inicio`, `data_autorizacao`, `data_expiracao`).

Unique parcial `WHERE status='PENDENTE'` (V17) garante 1 ativo por proposta + preserva historico NEGADO/EXPIRADO.

### `movimentacao_open_finance`

PK + `consentimento_id` (FK + V18 unique 1:1) + `proposta_id` (FK redundante para leitura) + `payload_consolidado` JSONB + agregados (`media_entradas_mensal`, `media_saidas_mensal`, `saldo_medio`, `numero_meses_avaliados`) + `data_recebimento`.

V18 unique consentimento_id garante 1 snapshot por consentimento; corridas de callback retornam o snapshot ja persistido via `findByConsentimentoId`.

## LGPD — defesa em profundidade

- `OpenFinancePayloadSanitizer` filtra recursivamente: `account_id`, `account_number`, `agency_number`, `branch_code`, `transactions`, `raw_transactions`, `transaction_list`, `extrato`, `cpf`, `cnpj`, `document_number`, `holder_name`, `holder_document`.
- **Fail-closed**: payload nao-JSON valido devolve placeholder `{"_sanitizer_error":"non-json","_size":N}` — evita persistencia de PII se provider mudar contrato.
- Audit log carrega apenas IDs + agregados; NUNCA payload bruto.
- FKs sem `ON DELETE CASCADE` (CMN 4.656/2018 + LGPD retencao 5 anos).
- Retencao recomendada do snapshot: 5 anos pos-decisao da proposta (TODO formalizar em politica corporativa).

## Reavaliacao de score

`RegraOpenFinanceMovimentacao` (modulo `credito.application.service.regras`):

| Cenario | Resultado | `ajusteScore` |
| ------- | --------- | ------------- |
| Sem snapshot (opt-in nao usado) | PASSOU | 0 (neutro) |
| `mediaEntradasMensal >= 3x parcela` | PASSOU | +200 (bonus forte) |
| `mediaEntradasMensal >= 1x parcela` | PASSOU | +100 (bonus parcial) |
| `mediaEntradasMensal < parcela` | FALHOU | 0 (motor aplica penalidade padrao) |
| `saldoMedio < 0` (cheque especial recorrente) | FALHOU | -150 (alerta forte) |

`parcelaEstimada = valorSolicitado / prazoMeses` (sem juros — Sprint 10+ adiciona calculo financeiro real).

Motor `MotorRegrasCredito.calcularScore` soma `ajusteTotal` ao score base e clampa em `[0, 1000]`.

`ReavaliarPropostaComOpenFinanceUseCase` (REQUIRES_NEW):

- Skip se proposta `APROVADA`/`REJEITADA` (final).
- Skip se snapshot ausente.
- Sobrescreve `ScoreInterno` + `RegraCreditoAvaliada` (delete + flush + insert — flush explicito evita unique violation `score_interno_proposta_id_key`).
- Promove `EM_ANALISE -> PRE_APROVADA` quando motor sugerir; **NAO** rejeita automaticamente — parecer manual preserva discricionariedade.
- Sempre publica `OpenFinanceReavaliacaoEvent` com `scoreAnterior/Novo + statusAnterior/Novo`.

## Auditoria (5 tipos novos, V19)

| Tipo | Detalhes JSON |
| ---- | ------------- |
| `OPEN_FINANCE_CONSENTIMENTO_INICIADO` | consentimentoId, propostaId, idExternoCelcoin |
| `OPEN_FINANCE_AUTORIZADO` | consentimentoId, propostaId, idExternoCelcoin |
| `OPEN_FINANCE_NEGADO` | consentimentoId, propostaId |
| `OPEN_FINANCE_DADOS_RECEBIDOS` | movimentacaoId, consentimentoId, propostaId, numeroMesesAvaliados |
| `OPEN_FINANCE_REAVALIACAO` | propostaId, consentimentoId, scoreAnterior/Novo, statusAnterior/Novo |

Listener `OpenFinanceAuditListener` usa `@TransactionalEventListener(AFTER_COMMIT) + @Transactional(REQUIRES_NEW)` (padrao Sprint 8 `CreditoAuditListener`).

## Idempotencia

Tripla camada:

1. **Outbox webhook**: `RegistrarWebhookEventUseCase` rejeita duplicada por `Idempotency-Key`.
2. **Use case consentimento**: callback duplicado com status-alvo identico = no-op silencioso.
3. **Use case movimentacao**: `findByConsentimentoId` retorna snapshot ja-persistido sem chamar provider novamente; V18 unique cobre corrida.

Idempotency-Key recomendada caller -> adapter HTTP:
- `iniciarConsentimento`: `open-finance:consent:<consentimento.id>` (estavel pra retry)
- `consultarMovimentacao`: `open-finance:movement:<idExterno>`

## Como rodar local

### Profile `dev` (default fake)

```bash
docker compose up -d
./gradlew bootRun
```

Provider `fake` retorna snapshot deterministico (entradas R$10k/saidas R$7k/saldo medio R$3k/6 meses).

### Provider Celcoin (sandbox)

```bash
export APP_OPEN_FINANCE_PROVIDER=celcoin
export APP_CELCOIN_OPEN_FINANCE_CLIENT_ID=...
export APP_CELCOIN_OPEN_FINANCE_CLIENT_SECRET=...
./gradlew bootRun
```

### Testes

```bash
./gradlew test --tests "*OpenFinance*"
./gradlew test --tests "*OpenFinanceIT"   # E2E Postgres sep_test
./gradlew check
```

Pre-requisito IT: `docker compose up -d sep-postgres && createdb -h localhost -U sep sep_test`.

## Limitacoes Sprint 9 / TODO sprints futuras

- **Opt-in apenas** — sem renovacao automatica de consentimento.
- **PULL via listener** — `movement.data` push do provider apenas ack; consulta real e dispatch pelo listener AUTORIZADO.
- **Sem revogacao tardia** — `consent.denied` apos `consent.authorized` ignorado; sprint futura adicionara fluxo `/consents/{id}/revoke` + tipo audit dedicado.
- **Sem multiplos provedores** — apenas Celcoin/Finansystech.
- **Sem ML/bureau externo**.
- **Sem calculo financeiro real** — parcela = `valor/prazo` sem juros/IOF/CET.
- **Sem UI web/mobile** — apenas backend.
- **Listener engole RuntimeException** — falha no Consultar/Reavaliar e log-only; retry humano via job ou requisicao nova (padrao Sprint 8).
- **Thresholds hardcoded** — `BONUS_FORTE=200/PARCIAL=100/PENALIDADE_SALDO_NEGATIVO=150` em codigo; sprint futura migra pra `CreditoMotorProperties`.

## Referencias externas

- Open Finance Brasil: https://openfinancebrasil.org.br/
- Resolucao BCB 32/2020 (consentimento)
- Resolucao CMN 4.656/2018 (analise de credito SEP)
- Celcoin Finansystech: docs em `docs-sep/Aprendizado Celcoin e SEP/`
