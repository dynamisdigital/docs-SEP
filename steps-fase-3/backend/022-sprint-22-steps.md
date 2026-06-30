# Steps - Sprint 22 - Observabilidade Operacional MVP

**Spec de origem**:
[`022-sprint-22-observabilidade-operacional.md`](../../specs/fase-3/022-sprint-22-observabilidade-operacional.md)

**ADR**: [`0016-observabilidade-operacional-cloudwatch.md`](../../adr/0016-observabilidade-operacional-cloudwatch.md)

**Status**: implementada (2026-06-30). Codigo commitado nas feature branches; PR/merge em `develop` manual e pendente. Code review por area concluido; P1 de sanitizacao (idempotencyKey) corrigido; pendencias em §Pendencias conhecidas.

**Objetivo geral**: tornar erros pesquisaveis por correlation id, proteger dados sensiveis e
preparar coleta/alertas CloudWatch sem provisionar AWS.

**Repos de destino**:

- `sep-api`: logging, filtros, Actuator e testes.
- `sep-app`: referencia de suporte para 5xx.
- `sep-mobile`: referencia de suporte para 5xx.
- `docs-SEP`: ADR, politica, runbook e templates CloudWatch.

**Branches sugeridas**:

- `sep-api`: `feature/sprint-22-observabilidade-operacional`
- `sep-app`: `feature/fsprint-observabilidade-suporte`
- `sep-mobile`: integrar na branch funcional vigente sem reverter alteracoes da M-Sprint 7.

## Decisoes bloqueantes

- `audit_log_seguranca` nao recebe stack trace nem substitui log tecnico.
- O profile `prod` precisa ser ativado explicitamente; nao existe profile default `dev`.
- O backend continua usando `traceId` no payload por compatibilidade, preenchido pelo MDC
  `correlationId`.
- Somente uma lista branca do MDC entra no JSON.
- Request log usa `request.getRequestURI()` e nunca `getRequestURL()`, query, body ou headers.
- Arquivos CloudWatch sao templates inativos ate existir EC2/IAM/SNS.

## Task 22.1 - Politica e contratos documentais

### Implementacao

- Criar ADR 0016.
- Criar spec 022 e este steps.
- Criar `docs-sep/OBSERVABILIDADE.md`.
- Atualizar PRD-FASE-3, CONTEXT-PARTE-2, READMEs e AI-ROADMAP.

### Verificacao

- Links relativos validos.
- Termos `log operacional`, `audit_log_seguranca`, `correlationId` e `traceId` sem ambiguidade.

## Task 22.2 - Logging de producao

### Implementacao

- Remover `spring.profiles.default: dev`.
- Manter base em INFO, dev com pacote da aplicacao em DEBUG e test com root WARN.
- Criar `application-prod.yml` com:
  - management em `127.0.0.1:8081`;
  - `LOG_PATH=/var/log/sep-api`;
  - health probes e Prometheus;
  - frameworks em WARN.
- Criar `logback-spring.xml`:
  - console pattern fora de prod;
  - JSON Lines em prod;
  - rolling diario + 50 MB, 7 arquivos/dias e teto local de 2 GB;
  - async appender sem descarte;
  - lista branca de MDC contendo apenas `correlationId`.

### Verificacao

```bash
cd <sep-api-root>
./gradlew test --tests '*ObservabilityConfigurationTest'
LOG_PATH=/tmp/sep-api-logs APP_ENVIRONMENT=prod \
  ./gradlew bootRun --args='--spring.profiles.active=prod --debug=false'
```

- Cada linha de `/tmp/sep-api-logs/application.json` deve ser JSON valido.
- Startup deve conter `service`, `environment`, `version`, `level`, `logger` e `message`.

## Task 22.3 - Correlacao, request logging e sanitizacao

### Implementacao

- `CorrelationIdFilter` aceita `[A-Za-z0-9._:-]{1,128}` e gera UUID fora desse contrato.
- `RequestLoggingFilter` executa logo apos o filtro de correlacao.
- Registrar `http_request_completed`, method, path, status e durationMs.
- Excluir `/actuator/**` do request log.
- Sanitizar mensagens de email fake, lockout, rate limit, webhook e chamada HTTP outbound.
- Nunca registrar idempotency key, destinatario, corpo, username, IP ou query.

### Verificacao

```bash
cd <sep-api-root>
./gradlew test \
  --tests '*CorrelationIdFilterTest' \
  --tests '*RequestLoggingFilterTest' \
  --tests '*LogEmailServiceTest'
```

## Task 22.4 - Actuator e eventos alertaveis

### Implementacao

- Publicar somente `/actuator/health` na API.
- No profile prod, liberar health/info/prometheus somente no management local.
- `ApiExceptionHandler` registra:
  - `unhandled_exception` com stack trace;
  - `provider_failed` sem payload ou mensagem externa;
  - `data_integrity_violation` sem causa SQL.
- Jobs que capturam falha por item registram `job_failed` em ERROR e continuam conforme regra
  existente.

### Verificacao

- `/actuator/metrics` sem autenticacao nao pode responder 200.
- Management prod deve bindar apenas em `127.0.0.1:8081`.
- Erro inesperado continua retornando payload amigavel, sem stack trace.

## Task 22.5 - Codigo de suporte web/mobile

### Implementacao

- Criar `core/api/support-reference.ts` nos dois clientes.
- Validar o `traceId` com o mesmo contrato do backend.
- O interceptor clona `HttpErrorResponse` somente para status 5xx com trace valido.
- Acrescentar `Codigo de suporte: <traceId>` ao `message`.
- Nao redirecionar, enviar telemetria ou alterar 4xx.

### Verificacao

```bash
cd <sep-app-root>
npm run test -- src/app/core/interceptors/error.interceptor.spec.ts

cd <sep-mobile-root>
npm run test -- src/app/core/interceptors/error.interceptor.spec.ts
```

## Task 22.6 - CloudWatch ready

### Implementacao

- Versionar um JSON do CloudWatch Agent por ambiente.
- Usar log stream `{instance_id}` e o arquivo `/var/log/sep-api/application.json`.
- Retencao de 30 dias em dev/hml e 90 em prod.
- Documentar filtros para:
  - `unhandled_exception`;
  - `job_failed`;
  - `http_request_completed` com status maior ou igual a 500.
- Documentar alarmes SNS, sem executa-los.

### Verificacao

```bash
python3 -m json.tool docs-sep/ci-pipelines/templates/cloudwatch-agent-sep-api-dev.json
python3 -m json.tool docs-sep/ci-pipelines/templates/cloudwatch-agent-sep-api-hml.json
python3 -m json.tool docs-sep/ci-pipelines/templates/cloudwatch-agent-sep-api-prod.json
```

## Gate final

```bash
cd <sep-api-root>
./gradlew check

cd <sep-app-root>
npm run format:check
npm run lint
npm run lint:scss
npm run test
npm run build

cd <sep-mobile-root>
npm run format:check
npm run lint
npm run lint:scss
npm run test
npm run build
```

Registrar separadamente qualquer falha ambiental, especialmente PostgreSQL local, EC2 inexistente
ou arquivos legados pertencentes a `nobody`.

## Pendencias conhecidas (pos-review)

- **IDs externos do provider em log (a decidir com o time).** Apos a sanitizacao da Task 22.3,
  permanecem em log dois identificadores EXTERNOS da Celcoin, fora da lista explicita da decisao
  bloqueante (que cita apenas idempotency key, destinatario, corpo, username, IP e query), mas
  ambiguos frente ao ADR 0016 item 6 (que permite UUIDs internos de diagnostico, nao externos):
  - `consent_id` em `ProcessarWebhookOpenFinanceUseCase` (4 ocorrencias: linhas 106, 113, 128, 132).
  - `verification_id` em `ProcessarCallbackKycUseCase` (linha ~110).
  Decisao pendente: manter pelo valor diagnostico de correlacao ou mascarar/remover. Nao alterado
  nesta rodada; o `idempotencyKey` (proibicao explicita) ja foi removido dos logs de todos os
  webhooks/callbacks.
- **Gap de cobertura que mascarou o vazamento.** Nenhum teste cobre as linhas de log dos callbacks
  KYC/KYB/PLD e dos webhooks de assinatura/Open Finance — por isso a sanitizacao parcial passou no
  `./gradlew check`. Recomendado um teste-guarda que assegure ausencia de `idempotencyKey` nesses
  logs antes de fechar a Task 22.3 de forma duravel.
