# Observabilidade Operacional do SEP

## Finalidade

Este documento define logging, correlacao, coleta e resposta a incidentes do SEP. A fonte da
decisao e a ADR 0016.

Observabilidade operacional responde "o sistema esta funcionando e onde falhou?". A tabela
`audit_log_seguranca` responde "quem executou um evento regulatorio ou de seguranca?". Os dois
mecanismos nao compartilham retencao, acesso ou payload.

## Sinais atuais

| Sinal | Implementacao | Estado |
|---|---|---|
| Logs | SLF4J + Logback + Logstash Encoder | JSON em prod; console em dev/test |
| Metricas | Actuator + Micrometer + Prometheus | Endpoint local de management em prod |
| Traces | Nao implementado | `correlationId` por request, sem spans |
| Erros cliente | `ErrorResponseDto.traceId` | Codigo de suporte em 5xx web/mobile |
| Auditoria | `audit_log_seguranca` | Persistencia separada |

## Schema do log JSON

Campos base:

| Campo | Tipo | Regra |
|---|---|---|
| `timestamp` | ISO-8601 UTC | Gerado pelo encoder |
| `service` | string | `sep-api` |
| `environment` | string | `dev`, `hml` ou `prod` |
| `version` | string | Release/commit informado por `APP_VERSION` |
| `level` | string | `INFO`, `WARN` ou `ERROR` em operacao |
| `logger` | string | Classe de origem |
| `thread` | string | Thread de execucao |
| `message` | string | Descricao curta e sanitizada |
| `correlationId` | string opcional | Identificador do request |
| `event` | string opcional | Evento operacional estavel |
| `exception` | string opcional | Stack trace somente quando necessario |

Campos de `http_request_completed`: `method`, `path`, `status`, `durationMs`.

## Eventos alertaveis

| Evento | Nivel | Uso |
|---|---|---|
| `http_request_completed` | INFO | Volume, latencia e status HTTP |
| `unhandled_exception` | ERROR | Excecao inesperada tratada como 500 |
| `provider_failed` | WARN | Integracao externa falhou de forma controlada |
| `job_failed` | ERROR | Item de job falhou e requer acompanhamento |
| `data_integrity_violation` | WARN | Constraint rejeitou operacao |
| `rate_limit_exceeded` | WARN | Limite de autenticacao excedido |
| `account_lockout` | WARN | Conta entrou em lockout; detalhes ficam na auditoria |

## Politica de dados

Nunca registrar:

- senha, JWT, refresh token, TOTP, backup code ou step-up token;
- CPF, CNPJ, e-mail, telefone, nome completo ou IP;
- chave Pix, conta, agencia, dados bancarios ou documento KYC/KYB;
- request/response body, payload de webhook ou resposta bruta de provider;
- headers, cookies, query string ou idempotency key;
- corpo/assunto/destinatario de notificacao.

Permitido quando necessario:

- UUID interno de proposta, contrato, parcela, transferencia ou item de backoffice;
- nome estavel do provider e operacao;
- status HTTP e classe da excecao;
- identificador externo apenas quando nao carregar dado pessoal ou credencial.

Stack traces ficam restritos a logs operacionais de acesso controlado. Excecoes de provider que
podem carregar body externo devem ser resumidas por tipo/status.

## Correlacao

1. Cliente pode enviar `X-Correlation-Id`.
2. Backend aceita somente `[A-Za-z0-9._:-]{1,128}`; caso contrario gera UUID.
3. O valor entra no MDC, na resposta `X-Correlation-Id` e em `ErrorResponseDto.traceId`.
4. Calls outbound propagam o header.
5. O MDC e limpo no `finally` do filtro.
6. Suporte pesquisa o valor recebido do usuario no campo JSON `correlationId`.

`traceId` e nome historico do contrato HTTP. Ele nao representa trace OpenTelemetry nesta versao.

## Profiles

### Dev

- Ativacao explicita: `SPRING_PROFILES_ACTIVE=dev`.
- Console legivel.
- Root INFO, pacote SEP DEBUG, frameworks INFO.

### Test

- Console legivel.
- Root WARN e pacote SEP INFO.

### Prod

- Ativacao obrigatoria: `SPRING_PROFILES_ACTIVE=prod`.
- JSON Lines em `${LOG_PATH:/var/log/sep-api}/application.json`.
- Rotacao diaria/50 MB, sete historicos e teto local de 2 GB.
- Management em `${MANAGEMENT_ADDRESS:127.0.0.1}:${MANAGEMENT_PORT:8081}`.

Variaveis:

```text
SPRING_PROFILES_ACTIVE=prod
DEBUG=false
APP_ENVIRONMENT=prod
APP_VERSION=<release-ou-commit>
LOG_PATH=/var/log/sep-api
MANAGEMENT_ADDRESS=127.0.0.1
MANAGEMENT_PORT=8081
```

`DEBUG` e uma propriedade reconhecida pelo Spring Boot. Ambientes que ja usam essa variavel para
outro significado devem remove-la ou defini-la como `false` no processo do `sep-api`.

## Actuator

- API publica: `/actuator/health` e subpaths.
- Produção local: health, info e prometheus em `127.0.0.1:8081`.
- `/actuator/**` nao e mais liberado genericamente.
- Exposicao remota futura deve acontecer por security group/proxy, nunca abrindo a porta de
  management para a internet.

## Referencia de suporte nos clientes

Web e mobile acrescentam `Codigo de suporte: <traceId>` ao `message` somente quando:

- HTTP status e 500 ou superior;
- o body segue o formato `ApiErrorResponse`;
- o trace id atende ao mesmo contrato do backend.

Erros 4xx permanecem exatamente como retornados. Nao ha envio remoto de erro nesta fase.

## CloudWatch Agent

Templates:

- `cloudwatch-agent-sep-api-dev.json`
- `cloudwatch-agent-sep-api-hml.json`
- `cloudwatch-agent-sep-api-prod.json`

Pre-requisitos na EC2:

1. Criar usuario do servico e grupo compartilhado com `cwagent`.
2. Garantir leitura de `/var/log/sep-api/application*.json`.
3. Anexar role IAM minima com `logs:CreateLogStream`, `logs:DescribeLogStreams` e
   `logs:PutLogEvents`.
4. Copiar o template do ambiente para
   `/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json`.
5. Ativar:

```bash
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
```

Validar:

```bash
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -m ec2 -a status
```

## Filtros e alarmes

Exemplo para producao, executado apenas apos definir credenciais e `SNS_TOPIC_ARN`:

```bash
LOG_GROUP=/sep/prod/sep-api
NAMESPACE=SEP/Observability

aws logs put-metric-filter \
  --log-group-name "$LOG_GROUP" \
  --filter-name SepUnhandledException \
  --filter-pattern '{ $.event = "unhandled_exception" }' \
  --metric-transformations \
    metricName=UnhandledException,metricNamespace=$NAMESPACE,metricValue=1

aws logs put-metric-filter \
  --log-group-name "$LOG_GROUP" \
  --filter-name SepJobFailed \
  --filter-pattern '{ $.event = "job_failed" }' \
  --metric-transformations \
    metricName=JobFailed,metricNamespace=$NAMESPACE,metricValue=1

aws logs put-metric-filter \
  --log-group-name "$LOG_GROUP" \
  --filter-name SepHttp5xx \
  --filter-pattern '{ $.event = "http_request_completed" && $.status >= 500 }' \
  --metric-transformations \
    metricName=Http5xx,metricNamespace=$NAMESPACE,metricValue=1
```

Alarmes:

- `UnhandledException`: `Sum >= 1` em cinco minutos.
- `JobFailed`: `Sum >= 1` em cinco minutos.
- `Http5xx`: `Sum >= 3` em cinco minutos.
- Acao: topico indicado por `SNS_TOPIC_ARN`.

## Rotina de incidente

1. Copiar o codigo de suporte informado.
2. Consultar `correlationId` no log group do ambiente.
3. Ler primeiro `http_request_completed`, depois `unhandled_exception`/`provider_failed`.
4. Identificar versao, path, status e classe da excecao.
5. Consultar `audit_log_seguranca` apenas se o incidente envolver evento auditavel.
6. Nao copiar payload ou dado pessoal para ticket; registrar IDs internos e correlation id.

## Pendencias

- Provisionar EC2, IAM, log groups, SNS e alarmes no Epic 16.
- Validar o agent em ambiente remoto real.
- Definir SLOs antes de criar alarmes de latencia/availability.
- Reavaliar OpenTelemetry quando houver multiplos processos ou necessidade de spans.
