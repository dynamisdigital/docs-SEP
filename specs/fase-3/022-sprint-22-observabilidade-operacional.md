# Spec 022 - Sprint 22 - Observabilidade Operacional MVP

## Metadados

- **ID da Spec**: 022
- **Titulo**: Sprint 22 - Observabilidade operacional e preparacao CloudWatch
- **Status**: implementada (PR/merge em `develop` pendente — manual)
- **Fase do produto**: Fase 3 - Epic 16
- **Trilha**: Cross-stack (`sep-api`, `sep-app`, `sep-mobile`, `docs-SEP`)
- **Origem**: PRD Epic 16 e ADR 0016
- **Depende de**: Sprints 1, 4 e 5; login/autorizacao concluidos
- **Responsavel principal**: Dev Senior

## Objetivo

Entregar logs backend pesquisaveis e correlacionaveis, com profile seguro de producao,
referencia de suporte nos clientes e artefatos prontos para CloudWatch, sem depender de uma conta
AWS existente.

## Escopo

### Em escopo

- Politica de logging e separacao da auditoria regulatoria.
- JSON Lines rotativo em producao e console legivel em dev/test.
- Validacao e propagacao de `X-Correlation-Id`.
- Registro estruturado de requests, erros inesperados, falhas de provider e jobs.
- Revisao de mensagens com risco de dados sensiveis.
- Restricao de Actuator e management local em producao.
- Codigo de suporte para 5xx no web/mobile.
- Configuracao do CloudWatch Agent, retencao, filtros e alarmes documentados.

### Fora de escopo

- Criar conta AWS, EC2, RDS, IAM, SNS ou infraestrutura Terraform.
- Instalar Sentry, Firebase Crashlytics ou SDK equivalente.
- OpenTelemetry, spans ou tracing distribuido.
- Substituir `traceId` por novo contrato REST.
- Usar log tecnico como trilha de auditoria regulatoria.

## Tasks de implementacao

1. Criar ADR, politica e documentacao da Sprint 22.
2. Criar profiles e logging JSON rotativo para producao.
3. Endurecer correlation id, request logging e sanitizacao.
4. Restringir Actuator e padronizar eventos alertaveis.
5. Apresentar referencia de suporte em erros 5xx web/mobile.
6. Versionar configuracoes CloudWatch e runbook de ativacao.

## Interfaces

- Nenhum endpoint REST novo.
- `ErrorResponseDto` permanece inalterado.
- `X-Correlation-Id` permanece aceito e devolvido, agora validado.
- O schema JSON definido em `OBSERVABILIDADE.md` e contrato operacional.

## Definition of Done

- Profiles `dev`, `test` e `prod` possuem niveis e destinos explicitos.
- Uma resposta 5xx pode ser localizada pelo `traceId`/`correlationId`.
- Query string, body, headers e dados pessoais nao entram no request log.
- Actuator nao usa mais matcher publico `/actuator/**`.
- Web e mobile preservam mensagens 4xx e acrescentam codigo apenas em 5xx.
- Configuracoes CloudWatch para dev/hml/prod sao JSON validos.
- Backend, web e mobile passam em testes, lint e build.
