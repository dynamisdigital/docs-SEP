# PR — Sprint 9 (Credito — Open Finance)

Artefato exigido pela Task 9.9 (steps `009-sprint-9-steps.md`). Conteudo abaixo
deve ser usado ao abrir o PR manualmente (`gh pr create --base develop ...` ou via UI).

## Titulo sugerido

```
feat(credito): Sprint 9 — Open Finance Brasil (consentimento + reavaliacao + audit)
```

## Resumo

- Enriquece a analise de credito (Sprint 8) com **Open Finance Brasil** via integracao
  Celcoin/Finansystech (Epic 6 parte 2). Tomador autoriza compartilhamento de dados
  bancarios; backend recebe snapshot consolidado e reavalia score automaticamente.
- Provider Pattern (ADR 0004): `OpenFinanceProvider` com Fake + Celcoin adapters,
  OAuth2 client-credentials proprio em `credito` (sem cross-import com `onboarding`),
  Resilience4j instance `celcoin-open-finance` + WireMock IT.
- 2 endpoints REST + 1 webhook + 5 use cases + 4 eventos de dominio + 5 tipos de audit
  novos. Anti-orphan no consentimento (save local PENDENTE antes do provider) +
  idempotencia tripla (outbox + status-alvo + V18 unique).
- Reavaliacao conservadora: SO promove `EM_ANALISE -> PRE_APROVADA`; nao rejeita
  automaticamente — parecer manual preserva discricionariedade quando OF piora score.

## Escopo tecnico

### Dominio + persistencia
- `ConsentimentoOpenFinance` (factories `iniciarLocal` + `vincularExterno` — anti-orphan)
- `MovimentacaoOpenFinance` (snapshot consolidado JSONB; payload sanitizado pelo
  `OpenFinancePayloadSanitizer` antes de persistir)
- `StatusConsentimento` (PENDENTE/AUTORIZADO/NEGADO/EXPIRADO) + transicoes unidirecionais
- 3 migrations Flyway:
  - `V17__criar_tabelas_open_finance.sql`: `consentimento_open_finance` + `movimentacao_open_finance`,
    unique parcial `WHERE status='PENDENTE'`, FKs sem CASCADE
  - `V18__unique_movimentacao_open_finance.sql`: UNIQUE consentimento_id (1 snapshot 1:1)
  - `V19__ampliar_audit_seguranca_tipo_open_finance.sql`: 5 tipos novos em
    `chk_audit_seguranca_tipo`

### Provider Pattern (ADR 0004)
- Port `OpenFinanceProvider` + DTOs do dominio (`RequisicaoConsentimento`,
  `RespostaConsentimento`, `MovimentacaoConsolidada`)
- `FakeOpenFinanceProvider` (default `app.open-finance.provider=fake`) com idExterno
  unico por chamada (UUID v6 — preserva historico NEGADO/EXPIRADO no V17 unique parcial)
- `CelcoinOpenFinanceProvider` HTTP real + `CelcoinOpenFinanceOAuthTokenProvider`
  (cache OAuth proprio do modulo `credito` — preserva DDD)
- `CelcoinOpenFinanceMapper` MapStruct + validacao defensiva (response null, consent_id
  vazio, authorization_url ausente -> IllegalStateException)
- Resilience4j `celcoin-open-finance` (retry 3x em 5xx/IO, circuit breaker, timeout 30s)

### Use cases + listeners
- `IniciarConsentimentoOpenFinanceUseCase`: validacoes ownership + status + 409 race;
  pattern 2-fase save local antes do provider (Idempotency-Key estavel
  `open-finance:consent:<id>`)
- `ProcessarCallbackConsentimentoUseCase`: idempotencia tardia + conflito logado
- `ConsultarMovimentacaoOpenFinanceUseCase` (REQUIRES_NEW): consulta + sanitizer +
  persist; race condition via DataIntegrityViolation -> fallback findByConsentimentoId
- `ReavaliarPropostaComOpenFinanceUseCase` (REQUIRES_NEW): re-executa motor com
  contexto enriquecido; `scoreRepository.flush()` antes do save evita unique violation
  no reavaliação (delete + insert pattern)
- `ProcessarWebhookOpenFinanceUseCase`: roteia por tipo + outbox idempotente
- `OpenFinanceAutorizadoListener` (AFTER_COMMIT) -> dispara consulta
- `OpenFinanceDadosRecebidosListener` (AFTER_COMMIT) -> dispara reavaliacao
- `OpenFinanceAuditListener` (AFTER_COMMIT + REQUIRES_NEW) -> 5 handlers de audit

### Motor + regra Open Finance
- `RegraResultado` ganha `ajusteScore` (factories `passouComBonus` +
  `falhouComPenalidadeExtra`); `MotorRegrasCredito.calcularScore` soma `ajusteTotal`
  e clampa `[0, 1000]`
- `ContextoAvaliacaoCredito` ganha `movimentacaoOpenFinance` opcional + ctor compat 5-arg
- `RegraOpenFinanceMovimentacao`: bonus +200 (entradas >= 3x parcela), +100 (>= 1x);
  penalidade -150 saldo medio negativo; PASSOU neutro sem snapshot (opt-in)

### Web
- `OpenFinanceController` 2 endpoints com `@PreAuthorize` + Swagger completo
- `IniciarConsentimentoOpenFinanceRequest` validacao `@Pattern`:
  - `cpfCnpjTomador` 11 ou 14 digitos puros
  - `redirectUri` regex `^https?://[^\s]+$` (bloqueia SSRF/open-redirect)
- `CelcoinOpenFinanceWebhookController`: HMAC + Idempotency-Key obrigatorios

### LGPD — defesa em profundidade
- `OpenFinancePayloadSanitizer` filtra recursivamente 13 campos sensiveis
  (account_id/number, agency_number, branch_code, transactions, raw_transactions,
  transaction_list, extrato, cpf, cnpj, document_number, holder_name, holder_document)
- **Fail-closed**: payload nao-JSON valido devolve placeholder
  `{"_sanitizer_error":"non-json","_size":N}` em vez do payload bruto
- Audit log carrega APENAS IDs + agregados; NUNCA payload bruto

### Auditoria (5 tipos novos)
- `OPEN_FINANCE_CONSENTIMENTO_INICIADO`
- `OPEN_FINANCE_AUTORIZADO`
- `OPEN_FINANCE_NEGADO`
- `OPEN_FINANCE_DADOS_RECEBIDOS`
- `OPEN_FINANCE_REAVALIACAO`

## Endpoints novos

| Metodo | Path | Auth |
| ------ | ---- | ---- |
| `POST` | `/api/v1/credito/propostas/{id}/open-finance/consentimento` | CLIENTE dono |
| `GET` | `/api/v1/credito/propostas/{id}/open-finance` | CLIENTE dono ou FINANCEIRO/ADMIN |
| `POST` | `/api/v1/webhooks/celcoin/open-finance` | HMAC + Idempotency-Key |

## Como validar

```bash
cd <sep-api-root>
docker compose up -d sep-postgres
createdb -h localhost -U sep sep_test  # se ainda nao criado

# unit + IT
./gradlew test --tests "*OpenFinance*"
./gradlew test --tests "*OpenFinanceIT"   # E2E sep_test
./gradlew check

# smoke local
./gradlew bootRun
```

Cenarios E2E cobertos em `OpenFinanceIT`:
- Fluxo feliz: PRE_APROVADA -> consentimento -> webhook AUTORIZADO -> snapshot ->
  reavaliacao -> 4 eventos audit
- NEGADO marca status; score nao muda
- Cliente alheio -> 403
- HMAC invalido -> 401; sem idem-key -> 400
- Idempotencia 2x mesma key
- Proposta APROVADA nao reavalia

## Riscos / breaking changes

- **Nenhum breaking change** em API publica (apenas adicoes).
- `RegraResultado` ganhou campo `ajusteScore`; tests Sprint 8 que usavam constructor
  direto (`new RegraResultado(...)`) atualizados com `, 0`.
- `ContextoAvaliacaoCredito` ganhou campo `movimentacaoOpenFinance`; ctor compat
  5-arg preserva chamadas Sprint 8.
- Migrations V17/V18/V19 aditivas — preservam constraints e dados anteriores.
- 2 use cases (`ConsultarMovimentacao`, `Reavaliar`) usam `@Transactional(REQUIRES_NEW)`
  pra funcionar em listener AFTER_COMMIT; javadoc alerta sobre suspensao de tx se
  invocados por controller futuro.

## Pendencias / TODO sprints futuras

- Revogacao tardia de consentimento (`consent.denied` apos `consent.authorized`
  hoje apenas loga WARN — sprint futura adiciona `/consents/{id}/revoke`)
- Thresholds `BONUS_FORTE/PARCIAL/PENALIDADE_SALDO_NEGATIVO` hardcoded; migrar pra
  `CreditoMotorProperties`
- Multiplos provedores Open Finance (apenas Celcoin/Finansystech atualmente)
- Renovacao automatica de consentimento
- UI web/mobile (apenas backend nesta sprint)

## Referencias

- Spec: [`specs/fase-2/009-sprint-9-credito-open-finance.md`](../../specs/fase-2/009-sprint-9-credito-open-finance.md)
- Steps: [`steps-fase-2/backend/009-sprint-9-steps.md`](../../steps-fase-2/backend/009-sprint-9-steps.md)
- ADRs: 0004 (Provider Pattern), 0008 (WireMock), 0012 (motor de credito)
- Docs: `OPEN-FINANCE.md`, `CREDITO.md` atualizado com secao Sprint 9
- Open Finance Brasil: https://openfinancebrasil.org.br/
- Resolucao BCB 32/2020 + CMN 4.656/2018
