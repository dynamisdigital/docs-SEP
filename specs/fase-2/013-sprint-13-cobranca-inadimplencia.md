# Spec 013 - Sprint 13 - Cobranca (inadimplencia e recuperacao)

## Metadados

- **ID da Spec**: 013
- **Titulo**: Sprint 13 - Inadimplencia + workflows de cobranca + renegociacao basica + `NotificationProvider`
- **Status**: aprovada para execucao (apos conclusao da Sprint 12 e ADR 0014 aceito)
- **Fase do produto**: Fase 2 — Epic 8 (parte 2)
- **Origem**: PRD §11 (Modulo cobranca + Provider Pattern), §22 (Sprint 13), §25 (Epic 8); ADRs 0004, 0008
- **Depende de**: [`012-sprint-12-cobranca-parcelas-agenda.md`](./012-sprint-12-cobranca-parcelas-agenda.md), ADR 0014 (estrategia de notificacoes — gate)
- **Responsavel principal**: Dev Senior

> **Nota de numeracao:** esta sprint usa ADR 0014 para notificacoes transacionais porque ADR 0013 ja esta ocupado por assinatura digital.

## Objetivo

Estender o modulo `cobranca` (Sprint 12) para tratar inadimplencia: detectar atrasos, escalonar workflows de cobranca, permitir renegociacao basica de parcelas atrasadas e notificar tomador/financeiro via email e SMS atraves do `NotificationProvider`.

A sprint introduz o `NotificationProvider` (Provider Pattern com adapter SMTP inicial e SMS via Zenvia) e implementa um motor simples de workflow de cobranca configuravel: dia X de atraso → notificacao Y. Renegociacao basica permite gerar nova `AgendaPagamento` substituta para parcelas inadimplentes apos negociacao com o tomador.

## Escopo

### Em escopo (apenas backend)

- **ADR 0014** — estrategia de notificacoes transacionais (gate da sprint)
- **Provider Pattern** (ADR 0004):
  - `NotificationProvider` (port em `cobranca.application.port.out` — possivelmente promovido para `shared` em sprint futura se outros modulos consumirem)
  - `SmtpNotificationProvider` (adapter inicial via JavaMail/Spring Mail) — email
  - `ZenviaSmsNotificationProvider` (adapter para SMS — definido pelo ADR 0014)
  - `LogNotificationProvider` (fake; loga mensagens para dev/testes)
- Entidades novas no modulo `cobranca`:
  - `WorkflowCobranca` (define os passos de escalonamento por dia de atraso)
  - `EventoCobranca` (registro de cada acao tomada: notificacao enviada, contato realizado, etc.)
  - `Renegociacao` (registra alteracoes acordadas: novo prazo, novo valor de parcela, descontos)
- Value objects: novos estados em `StatusParcela` adicionados na Sprint 12: `INADIMPLENTE`, `RENEGOCIADA`, `EM_NEGOCIACAO`
- Use cases:
  - `EscalarCobrancaUseCase` (consome `ParcelaAtrasouEvent` da Sprint 12; aplica workflow de escalonamento)
  - `MarcarParcelaInadimplenteJob` (job @Scheduled; apos 90 dias de atraso → `INADIMPLENTE`)
  - `IniciarRenegociacaoUseCase` (financeiro propoe nova condicao)
  - `AceitarRenegociacaoUseCase` (tomador aceita com step-up; gera nova `AgendaPagamento` substituta)
  - `RegistrarEventoCobrancaUseCase` (financeiro registra contato manual com tomador)
- Endpoints REST:
  - `GET /api/v1/cobranca/inadimplencia` — lista parcelas inadimplentes/atrasadas (`ROLE_FINANCEIRO`)
  - `POST /api/v1/cobranca/parcelas/{id}/contato` — registra evento manual de contato (`ROLE_FINANCEIRO`)
  - `POST /api/v1/cobranca/parcelas/{id}/renegociacao` — financeiro propoe renegociacao
  - `PATCH /api/v1/cobranca/renegociacoes/{id}/aceite` — tomador aceita (ownership + step-up)
  - `PATCH /api/v1/cobranca/renegociacoes/{id}/recusa` — tomador recusa (ownership)
- Workflow de cobranca (configuravel via yaml):
  - Dia 0 de atraso → notificacao email amigavel
  - Dia 5 → email + SMS lembrete
  - Dia 15 → email firme + SMS
  - Dia 30 → email + SMS + flag para contato manual do financeiro
  - Dia 60 → escalonamento avancado (gera evento para backoffice)
  - Dia 90 → marca como `INADIMPLENTE`
- Migrations Flyway: `workflow_cobranca`, `evento_cobranca`, `renegociacao`
- Templates de notificacao em `src/main/resources/templates/notificacoes/`
- Auditoria reforcada: novos tipos `NOTIFICACAO_ENVIADA`, `EVENTO_COBRANCA_REGISTRADO`, `PARCELA_INADIMPLENTE`, `RENEGOCIACAO_PROPOSTA`, `RENEGOCIACAO_ACEITA`, `RENEGOCIACAO_RECUSADA`

### Fora de escopo nesta Sprint
- Cobranca extrajudicial / juridica — sprint futura
- Cessao de credito — sprint futura
- Negativacao em birôs (Serasa, SPC) — sprint futura
- ML para predicao de inadimplencia — fora do escopo
- Telas frontend/mobile — apenas backend (decisao 2026-05-04)

## Pre-requisitos globais

- Sprint 12 concluida (modulo `cobranca` com agenda + parcelas + recebimentos + job de atraso)
- **ADR 0014 aceito antes do inicio da sprint** — define provedor SMS + estrategia de templates
- Credenciais SMTP funcionais (`spring.mail.*`)
- Credenciais sandbox Zenvia
- Step-up authentication (Sprint 5) operacional

## Tasks

### Task 13.1 — ADR 0014: estrategia de notificacoes transacionais (GATE)

**Arquivos esperados**
- `adr/0014-estrategia-de-notificacoes-transacionais.md`

**Conteudo**
- Contexto: necessidade de email + SMS transacionais para cobranca
- Alternativas: SMTP proprio (email) + Twilio/Zenvia/TotalVoice (SMS); ou SES + SNS AWS; ou Sendgrid + similar
- Decisao: SMTP via Spring Mail (email) + Zenvia (SMS)
- Templates: gerenciados via Thymeleaf (ja em uso na Sprint 10)
- Consequencias: custo por SMS, throughput, retries, opt-out

**Pre-requisitos**: avaliacao tecnica + comercial.
**Responsavel**: Dev Senior + PO.

---

### Task 13.2 — Entidades + migrations

**Arquivos esperados**
- `cobranca/domain/model/WorkflowCobranca.java` (configuracao do workflow; carregada de yaml na boot)
- `cobranca/domain/model/EventoCobranca.java`
- `cobranca/domain/model/Renegociacao.java`
- update `cobranca/domain/vo/StatusParcela.java` com `INADIMPLENTE`, `RENEGOCIADA`, `EM_NEGOCIACAO`
- update `cobranca/domain/vo/StatusRenegociacao.java` (sealed: `PROPOSTA`, `ACEITA`, `RECUSADA`, `EXPIRADA`)
- `src/main/resources/db/migration/V<n>__criar_tabelas_inadimplencia.sql`

**Pre-requisitos**: ADR 0014 aceito.
**Responsavel**: Dev Senior.

---

### Task 13.3 — `NotificationProvider` (port + Smtp + Sms + Log)

**Arquivos esperados**
- `cobranca/application/port/out/NotificationProvider.java`
- `cobranca/application/port/out/dto/Notificacao.java` (record com `canal`, `destinatario`, `template`, `variaveis`)
- `cobranca/application/port/out/dto/Canal.java` (sealed: `EMAIL`, `SMS`)
- `cobranca/infrastructure/adapter/notification/SmtpNotificationProvider.java`
- `cobranca/infrastructure/adapter/notification/ZenviaSmsNotificationProvider.java`
- `cobranca/infrastructure/adapter/notification/LogNotificationProvider.java`
- `cobranca/infrastructure/adapter/notification/TemplateNotificacaoEngine.java` (Thymeleaf reusado da Sprint 10)
- templates em `src/main/resources/templates/notificacoes/`:
  - `cobranca-amigavel-email.html`, `cobranca-firme-email.html`, `cobranca-final-email.html`
  - `cobranca-lembrete-sms.txt`, `cobranca-firme-sms.txt`

**Regras**
- `LogNotificationProvider` ativo em `dev`/`local-wiremock`
- `Smtp` + `Sms` reais ativos em `homologacao`/`producao`
- Resilience4j: retry 3x + circuit breaker para SMS provider

**Testes obrigatorios**
- `LogNotificationProviderTest`
- `ZenviaSmsNotificationProviderIT` (WireMock)
- `TemplateNotificacaoEngineTest`

**Pre-requisitos**: Tasks 13.1, 13.2.
**Responsavel**: Dev Senior.

---

### Task 13.4 — Use case `EscalarCobrancaUseCase` + listener

**Arquivos esperados**
- `cobranca/application/usecase/EscalarCobrancaUseCase.java`
- `cobranca/application/listener/ParcelaAtrasouListener.java`
- `cobranca/application/job/EscaladorCobrancaJob.java` (re-roda escalonamento diariamente para parcelas ja em atraso)

**Regras**
- Listener escuta `ParcelaAtrasouEvent` (Sprint 12) e dispara primeira notificacao (Dia 0)
- Job diario re-avalia parcelas em atraso e dispara novas notificacoes conforme dia de atraso atual + `WorkflowCobranca` configurado
- Idempotencia: nao envia mesma notificacao duas vezes para mesma parcela no mesmo dia
- Cada notificacao gera `EventoCobranca` para historico

**Configuracao yaml exemplo**
```yaml
app:
  cobranca:
    workflow:
      dias-atraso:
        - dia: 0
          notificacoes: [email-amigavel]
        - dia: 5
          notificacoes: [email-amigavel, sms-lembrete]
        - dia: 15
          notificacoes: [email-firme, sms-firme]
        - dia: 30
          notificacoes: [email-firme, sms-firme]
          flag-contato-manual: true
        - dia: 60
          notificacoes: [email-final]
          escalonar-para-backoffice: true
        - dia: 90
          marcar-inadimplente: true
```

**Testes obrigatorios**
- `EscalarCobrancaUseCaseTest`
- `ParcelaAtrasouListenerTest`
- `EscaladorCobrancaJobTest` (controla `Clock`)

**Pre-requisitos**: Tasks 13.2, 13.3.
**Responsavel**: Dev Senior.

---

### Task 13.5 — `MarcarParcelaInadimplenteJob`

**Arquivos esperados**
- `cobranca/application/job/MarcarParcelaInadimplenteJob.java` (`@Scheduled` cron `0 30 2 * * *`; roda 30 min apos `MarcarParcelaAtrasadaJob` da Sprint 12)

**Regras**
- Apos 90 dias de atraso → `INADIMPLENTE` + dispara `ParcelaInadimplenteEvent` (consumido por backoffice na Sprint 14)
- Notifica financeiro + tomador uma ultima vez

**Testes obrigatorios**
- `MarcarParcelaInadimplenteJobTest`

**Pre-requisitos**: Task 13.2.
**Responsavel**: Dev Senior.

---

### Task 13.6 — Use cases de renegociacao

**Arquivos esperados**
- `cobranca/application/usecase/IniciarRenegociacaoUseCase.java`
- `cobranca/application/usecase/AceitarRenegociacaoUseCase.java`
- `cobranca/application/usecase/RecusarRenegociacaoUseCase.java`

**Regras**
- `IniciarRenegociacaoUseCase` (`ROLE_FINANCEIRO` + step-up): cria `Renegociacao` em `PROPOSTA`; transiciona parcelas envolvidas para `EM_NEGOCIACAO`; notifica tomador (email + SMS)
- `AceitarRenegociacaoUseCase` (tomador, ownership, step-up): aceita; gera nova `AgendaPagamento` substituta; transiciona parcelas antigas para `RENEGOCIADA`
- `RecusarRenegociacaoUseCase` (tomador, ownership): recusa; parcelas voltam ao status anterior (`ATRASADA` ou `INADIMPLENTE`)
- Renegociacao expira em 7 dias se nao houver decisao

**Testes obrigatorios**
- `IniciarRenegociacaoUseCaseTest`, `AceitarRenegociacaoUseCaseTest`, `RecusarRenegociacaoUseCaseTest`

**Pre-requisitos**: Tasks 13.2, 13.3.
**Responsavel**: Dev Senior.

---

### Task 13.7 — Endpoints REST + DTOs

**Arquivos esperados**
- update `CobrancaController` (Sprint 12)
- `cobranca/web/dto/InadimplenciaResponse.java`
- `cobranca/web/dto/RegistrarContatoRequest.java`
- `cobranca/web/dto/IniciarRenegociacaoRequest.java`
- `cobranca/web/dto/RenegociacaoResponse.java`

**Endpoints**
- `GET /api/v1/cobranca/inadimplencia` (`ROLE_FINANCEIRO`; filtros: dias_atraso_min, dias_atraso_max, status)
- `POST /api/v1/cobranca/parcelas/{id}/contato` (`ROLE_FINANCEIRO`)
- `POST /api/v1/cobranca/parcelas/{id}/renegociacao` (`ROLE_FINANCEIRO` + step-up)
- `PATCH /api/v1/cobranca/renegociacoes/{id}/aceite` (tomador, step-up)
- `PATCH /api/v1/cobranca/renegociacoes/{id}/recusa` (tomador)

**OpenAPI** completa.

**Testes obrigatorios**
- `CobrancaInadimplenciaControllerTest`

**Pre-requisitos**: Tasks 13.4, 13.5, 13.6.
**Responsavel**: Dev Senior.

---

### Task 13.8 — Auditoria reforcada

**Arquivos esperados**
- update enum `AuditLogSegurancaTipo`: `NOTIFICACAO_ENVIADA`, `EVENTO_COBRANCA_REGISTRADO`, `PARCELA_INADIMPLENTE`, `RENEGOCIACAO_PROPOSTA`, `RENEGOCIACAO_ACEITA`, `RENEGOCIACAO_RECUSADA`
- update `CobrancaAuditListener` (Sprint 12)

**Pre-requisitos**: Tasks 13.4, 13.5, 13.6.
**Responsavel**: Dev Senior.

---

### Task 13.9 — Testes E2E

**Cenarios obrigatorios**
- Parcela vence → job da Sprint 12 marca `ATRASADA` → listener desta sprint envia notificacao (`LogNotificationProvider`)
- Avancar relogio: dia 5 → 2 notificacoes; dia 15 → notificacao firme; dia 30 → flag contato manual
- Dia 90 → parcela marcada `INADIMPLENTE`
- Financeiro propoe renegociacao → tomador aceita → nova `AgendaPagamento` substituta
- Financeiro propoe renegociacao → tomador recusa → parcelas voltam ao status original
- Tomador tenta aceitar renegociacao sem step-up → 403
- Notificacao nao duplicada no mesmo dia

**Arquivos esperados**
- `cobranca/web/InadimplenciaIT.java`
- `cobranca/web/RenegociacaoIT.java`

**Pre-requisitos**: Tasks 13.1-13.8.
**Responsavel**: Dev Senior.

---

### Task 13.10 — Documentacao

**Arquivos esperados**
- update `docs-sep/PRD.md` §22 Sprint 13 — marcar como executada (apos merge)
- update `docs-SEP/repos/sep-api/COBRANCA.md` (criada na Sprint 12) — adicionar secao inadimplencia + workflow + renegociacao
- novo `docs-SEP/repos/sep-api/NOTIFICACOES.md` — politica de comunicacao com tomador, opt-out, retencao
- update Swagger UI

**Pre-requisitos**: Tasks 13.1-13.9.
**Responsavel**: Dev Senior + revisao juridica do `NOTIFICACOES.md` (LGPD).

---

## Grafo de dependencias

```
Sprint 12 concluida
        |
        v
Task 13.1 (ADR 0014 — gate)
        |
        v
Task 13.2 (entidades + migrations)
        |
        +---> Task 13.3 (NotificationProvider) -+
                                                 |
                                                 +---> Task 13.4 (escalar cobranca + listener)
                                                 +---> Task 13.5 (job inadimplencia)
                                                 +---> Task 13.6 (renegociacao)
                                                                  |
                                                                  v
                                                        Task 13.7 (endpoints REST)
                                                                  |
                                                                  v
                                                        Task 13.8 (auditoria)
                                                                  |
                                                                  v
                                                        Task 13.9 (testes E2E)
                                                                  |
                                                                  v
                                                        Task 13.10 (documentacao)
```

## Definicao de pronto da Sprint 13

- ADR 0014 aceito (provedor SMS + estrategia de templates)
- Modulo `cobranca` estendido com entidades de inadimplencia
- `NotificationProvider` com SMTP + SMS + Log adapters
- Workflow de cobranca operacional (configuravel via yaml)
- Job de marcacao de inadimplencia (90 dias) operacional
- Renegociacao basica funcional (proposta + aceite/recusa + nova agenda)
- 5 endpoints REST documentados
- Auditoria reforcada
- Suite E2E passando
- Cobertura JaCoCo do modulo `cobranca` consolidada >= 70%
- `NOTIFICACOES.md` revisado pela area juridica (LGPD)

## Impacto na Sprint seguinte (Sprint 14 — Backoffice)

- Sprint 14 consome `ParcelaInadimplenteEvent` para listar na fila operacional
- Sprint 14 consolida visao financeira incluindo dashboards de inadimplencia
- Sprint 14 oferece reprocessos manuais (re-disparo de notificacoes que falharam)

## Restricoes e regras de execucao

- **Notificacoes seguem LGPD** — opt-out obrigatorio em todas as comunicacoes (excecao para inadimplencia critica conforme parecer juridico)
- ADR 0014 e gate inviolavel
- Provider Pattern obrigatorio
- Sem F-Sprint 13 / M-Sprint 13 — apenas backend (decisao 2026-05-04)

## Referencias

- [PRD §11](../../docs-sep/PRD.md)
- [PRD §22 (Sprint 13)](../../docs-sep/PRD.md)
- [PRD §25 (Epic 8)](../../docs-sep/PRD.md)
- [PRD §29](../../docs-sep/PRD.md)
- [ADR 0004](../../adr/0004-provider-pattern-para-integracoes-externas.md)
- [ADR 0014](../../adr/0014-estrategia-de-notificacoes-transacionais.md) (criado nesta sprint, gate)
- [Spec 012 - Sprint 12 (dependencia)](./012-sprint-12-cobranca-parcelas-agenda.md)
- [Spec 014 - Sprint 14 (proxima — Backoffice)](./014-sprint-14-backoffice-operacional.md)
- LGPD Lei 13.709/2018 (consentimento + opt-out)
- CDC Lei 8.078/1990 (regras de cobranca)
