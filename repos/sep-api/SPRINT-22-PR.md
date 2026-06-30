# PR — Sprint 22 — Observabilidade Operacional MVP

Artefato temporario de apoio a abertura/revisao do PR. Historico definitivo fica no PR do
GitHub, no step da sprint, nos docs operacionais e no PRD/CONTEXT.

- **Spec**: `specs/fase-3/022-sprint-22-observabilidade-operacional.md`
- **Step**: `steps-fase-3/backend/022-sprint-22-steps.md`
- **ADR**: `adr/0016-observabilidade-operacional-cloudwatch.md`
- **Branches**: `sep-api` -> `feature/sprint-22-observabilidade-operacional` (base `develop`/1741eee);
  `sep-app` -> `feature/fsprint-observabilidade-suporte` (base `develop`/2352779);
  `sep-mobile` -> 22.5 integrado na branch da M-Sprint 7 (commit `3cda599`).

## Summary

Logs backend pesquisaveis e correlacionaveis, profile `prod` seguro, referencia de suporte para
erros 5xx em web/mobile e artefatos CloudWatch versionados — sem provisionar AWS.

## Mudancas por modulo

### sep-api

- **Logging e profiles (Task 22.2)**: profiles `dev`/`test`/`prod` explicitos (remove
  `spring.profiles.default: dev`); `logback-spring.xml` com JSON Lines em prod (rolling diario
  50MB, 7 dias, teto 2GB, async, whitelist de MDC = `correlationId`) e console legivel fora de prod.
- **Correlacao, request log e sanitizacao (Task 22.3)**: `CorrelationIdFilter` valida
  `[A-Za-z0-9._:-]{1,128}` e gera UUID fora do contrato; `RequestLoggingFilter` (apos a correlacao)
  emite `http_request_completed` (method/path/status/durationMs) via `getRequestURI`, excluindo
  `/actuator`. Sanitizacao de logs de email, lockout, rate limit, webhooks/callbacks
  (Assinatura/KYB/KYC/PLD/Open Finance) e chamada outbound (Celcoin OAuth): removidos
  `idempotencyKey`, destinatario, username e IP.
- **Actuator e eventos alertaveis (Task 22.4)**: API publica expoe apenas `/actuator/health`;
  `ManagementSecurityConfig` libera health/info/prometheus somente no listener local
  (prod `127.0.0.1:8081`). `ApiExceptionHandler` emite `unhandled_exception`/`provider_failed`/
  `data_integrity_violation` estruturados, sem stack nem causa SQL no payload. Jobs de cobranca
  registram `job_failed` em ERROR e seguem o lote.

### sep-app / sep-mobile (Task 22.5)

- `core/api/support-reference.ts` (identico nos dois): valida `traceId`, clona `HttpErrorResponse`
  apenas em 5xx com trace valido e acrescenta `Codigo de suporte: <traceId>` (idempotente); 4xx
  inalterados; sem telemetria/redirect.

### docs-SEP (Task 22.1 e 22.6)

- ADR 0016, `docs-sep/OBSERVABILIDADE.md`, spec e step 022.
- Templates CloudWatch Agent (`dev`/`hml`/`prod`) + runbook de filtros/alarmes (retencao 30/30/90,
  filtros `unhandled_exception`/`job_failed`/`http_request_completed` status>=500, alarmes SNS
  documentados e inativos).
- Atualizacoes em PRD-FASE-3, CONTEXT-PARTE-2 e AI-ROADMAP.

## Migrations

- Nenhuma. Sem mudanca de schema, contrato REST ou evento.

## Test plan

- `sep-api`: `./gradlew check` — BUILD SUCCESSFUL (suite + spotless + jacoco).
- `sep-app` / `sep-mobile`: `error.interceptor.spec.ts` — 5/5 em cada; 3 templates CloudWatch
  validados por `python3 -m json.tool`.

## Decisoes

- `traceId` mantido no payload por compatibilidade, preenchido pelo MDC `correlationId`.
- Profile `prod` exige ativacao explicita (`SPRING_PROFILES_ACTIVE=prod`); sem default `dev`.
- Templates CloudWatch ficam inativos ate existir EC2/IAM/SNS.

## Pendencias / follow-ups aceitos

- **IDs externos Celcoin em log (a decidir com o time)**: `consent_id`
  (`ProcessarWebhookOpenFinanceUseCase`, 4 ocorrencias) e `verification_id`
  (`ProcessarCallbackKycUseCase`) seguem em log. Nao constam da lista explicita da decisao
  bloqueante; ambiguos frente ao ADR 0016 item 6 (UUID interno permitido, externo nao). Registrado
  em `steps-fase-3/backend/022-sprint-22-steps.md` (§Pendencias conhecidas).
- **Teste-guarda de sanitizacao**: recomendado um teste que falhe se `idempotencyKey` voltar aos
  logs de webhooks/callbacks (gap de cobertura mascarou a sanitizacao parcial corrigida nesta
  rodada).
- **Pre-existente, fora de escopo da Sprint 22**: `ApiExceptionHandler` (handlers
  `provider_failed`) devolve `ex.getMessage()` do provider no corpo da resposta 5xx — comportamento
  anterior, nao introduzido aqui. Revisar separadamente a sanitizacao dessas mensagens.

## Notas

- Code review feito por revisores paralelos por area + validacao manual dos findings.
- Correcao aplicada nesta rodada: sanitizacao completa de `idempotencyKey` nos logs de
  webhooks/callbacks (Assinatura, KYB, KYC, PLD) — antes parcial.

## Commits

### sep-api (`feature/sprint-22-observabilidade-operacional`)

- `feat(api): profiles e logging json de producao`
- `feat(api): correlation id, request log e sanitizacao de logs`
- `feat(api): restringir actuator e padronizar eventos alertaveis`

### sep-app (`feature/fsprint-observabilidade-suporte`)

- `feat(web): anexar codigo de suporte a erros 5xx`

### sep-mobile (branch da M-Sprint 7)

- `feat(mobile): anexar codigo de suporte a erros 5xx` (`3cda599`)
