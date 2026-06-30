# ADR 0016 - Observabilidade Operacional com Logs Estruturados e CloudWatch

## Status

**Aceito** em 2026-06-30 para a Sprint 22.

## Contexto

O SEP ja possuia Actuator, Micrometer/Prometheus, `CorrelationIdFilter`, MDC e o campo
`ErrorResponseDto.traceId`. Essa fundacao permitia correlacionar uma resposta de erro com o
processamento backend, mas nao fechava o ciclo operacional:

- o encoder Logstash estava declarado sem `logback-spring.xml`;
- nao havia profile de producao, coleta centralizada, retencao ou alertas;
- o profile default era `dev`, com niveis excessivos para producao;
- Actuator estava liberado por `/actuator/**`;
- web e mobile conheciam `traceId`, mas nao o apresentavam como referencia de suporte;
- mensagens existentes podiam carregar e-mail, IP, username, idempotency key, query string ou
  conteudo de notificacao.

O `audit_log_seguranca` e uma trilha persistente de eventos regulatorios e de seguranca. Ele nao
substitui logs tecnicos, nao deve receber stack trace e possui governanca propria.

## Decisao

1. O backend usa Logback com dois formatos:
   - `dev/test`: console legivel;
   - `prod`: JSON Lines assincrono e rotativo em `/var/log/sep-api/application.json`.
2. O JSON operacional possui schema estavel com `timestamp`, `service`, `environment`, `version`,
   `level`, `logger`, `thread`, `message`, `correlationId` e campos estruturados do evento.
3. O `X-Correlation-Id` aceita somente 1 a 128 caracteres em `[A-Za-z0-9._:-]`; entrada invalida
   e substituida por UUID.
4. Cada request de negocio gera `http_request_completed` com metodo, path sem query, status e
   duracao. Actuator fica fora desse log para evitar ruido.
5. Erros inesperados usam `unhandled_exception`; falhas de provider e jobs usam
   `provider_failed` e `job_failed`.
6. Logs operacionais nunca devem conter senha, token, CPF/CNPJ, e-mail, telefone, IP, dados
   bancarios, payload, body, headers, query string ou idempotency key. UUIDs internos podem ser
   usados quando necessarios para diagnostico.
7. Em producao, management fica em `127.0.0.1:8081`; somente o healthcheck permanece publico na
   API. Prometheus e acessivel apenas na interface local de management.
8. Web e mobile acrescentam `Codigo de suporte: <traceId>` somente a respostas 5xx que possuam
   identificador valido. Nao ha SDK remoto nos clientes neste MVP.
9. A coleta futura em EC2 usa CloudWatch Agent. Grupos:
   - `/sep/dev/sep-api`, 30 dias;
   - `/sep/hml/sep-api`, 30 dias;
   - `/sep/prod/sep-api`, 90 dias.
10. OpenTelemetry, tracing distribuido, Sentry e provisionamento IaC ficam fora da Sprint 22.

## Consequencias

### Positivas

- Um codigo apresentado ao usuario localiza o request e a excecao no backend.
- CloudWatch pode filtrar eventos sem parse ad hoc de texto.
- O profile `prod` nasce com nivel, rotacao e management restritos.
- Auditoria regulatoria e diagnostico tecnico passam a ter ownership explicito.

### Negativas

- A gravacao local exige permissao e monitoramento de disco em `/var/log/sep-api`.
- Alertas so podem ser ativados quando existirem conta AWS, EC2, IAM e SNS.
- O nome historico `traceId` continua representando o `correlationId`, sem tracing real.

## Alternativas consideradas

1. **Loki + Grafana + Prometheus local primeiro**: adiada porque o destino remoto definido no PRD
   e AWS/EC2 e ainda nao existe operacao local multiusuario.
2. **OpenTelemetry completo**: adiado; o monolito ainda obtem diagnostico suficiente com request
   correlation e metricas Micrometer.
3. **Sentry no web/mobile**: adiado por custo, governanca LGPD e ausencia de decisao de fornecedor.
4. **Usar `audit_log_seguranca` para erros tecnicos**: rejeitado por misturar retencao, finalidade,
   acesso e formato de dados incompatíveis.

## Referencias

- [`docs-sep/OBSERVABILIDADE.md`](../docs-sep/OBSERVABILIDADE.md)
- [`specs/fase-3/022-sprint-22-observabilidade-operacional.md`](../specs/fase-3/022-sprint-22-observabilidade-operacional.md)
- [Spring Boot Observability](https://docs.spring.io/spring-boot/reference/actuator/observability.html)
- [AWS CloudWatch Agent](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Install-CloudWatch-Agent.html)
