# Spec 007 - Sprint 7 - Onboarding KYB Empresa + PLD

## Metadados

- **ID da Spec**: 007
- **Titulo**: Sprint 7 - Onboarding KYB Pessoa Juridica + PLD (consultas COAF, OFAC, INTERPOL, MTE)
- **Status**: aprovada para execucao (apos conclusao da Sprint 6)
- **Fase do produto**: Fase 2 — Epic 5 (parte 2)
- **Origem**: PRD §3.1 (Marco regulatorio CMN 4.656/2018), §11 (Modulo onboarding + Provider Pattern), §22 (Sprint 7), §25 (Epic 5); ADRs 0004, 0008
- **Depende de**: [`006-sprint-6-onboarding-kyc-pessoa.md`](./006-sprint-6-onboarding-kyc-pessoa.md)
- **Responsavel principal**: Dev Senior

## Objetivo

Estender o modulo `onboarding` (criado na Sprint 6) para suportar Pessoa Juridica (KYB) e adicionar a camada de PLD (Prevencao a Lavagem de Dinheiro) com consultas obrigatorias as bases COAF, OFAC, INTERPOL e MTE — exigencia legal nao-negociavel da Resolucao CMN 4.656/2018.

A sprint reaproveita toda a infraestrutura de Provider Pattern, Webhook Receiver e auditoria reforcada introduzida na Sprint 6, evitando duplicacao. O resultado entregue e a capacidade da plataforma de cadastrar e validar tanto tomadores PJ quanto futuros credores PJ (consumido pela Epic 10), com trilha PLD completa para auditoria BACEN.

## Escopo

### Em escopo (apenas backend)

- Extensao do modulo `onboarding`:
  - Entidades novas: `KybEmpresa`, `ConsultaCNPJ`, `RepresentanteLegal`
  - Value objects: `Cnpj` (com validacao), `TipoSocietario` (sealed: `LTDA`, `SA`, `EIRELI`, `MEI`, `OUTROS`), `PorteEmpresa` (sealed: `MEI`, `ME`, `EPP`, `MEDIO`, `GRANDE`)
  - Generalizacao de `SolicitacaoOnboarding` (Sprint 6) para abrigar PJ via `tipo` (`PESSOA` | `EMPRESA`) — refactor controlado
- **Provider Pattern** (ADR 0004) — dois novos providers:
  - `KybProvider` (port + `CelcoinKybProvider` + `FakeKybProvider`) — consulta de CNPJ na Receita Federal via Celcoin, verifica situacao cadastral (ATIVA, SUSPENSA, INAPTA, BAIXADA), socios e representantes legais
  - `BackgroundCheckProvider` (port + `CelcoinBackgroundCheckProvider` + `FakeBackgroundCheckProvider`) — consultas as bases PLD (COAF, OFAC, INTERPOL, MTE)
- Use cases:
  - `IniciarOnboardingEmpresaUseCase` (cria `SolicitacaoOnboarding` tipo `EMPRESA` + `KybEmpresa`)
  - `IniciarVerificacaoKybUseCase` (chama `KybProvider.consultarCnpj(...)` e move para `EM_VERIFICACAO`)
  - `IniciarPldPessoaUseCase` (apos KYC PF aprovado, dispara `BackgroundCheckProvider.consultarPessoa(...)`)
  - `IniciarPldEmpresaUseCase` (apos KYB aprovado, dispara `BackgroundCheckProvider.consultarEmpresa(...)`)
  - `ProcessarCallbackKybUseCase` e `ProcessarCallbackPldUseCase` (consumidos pelos webhooks)
  - `ConsultarRepresentantesLegaisUseCase`
- Endpoints REST:
  - `POST /api/v1/onboarding/empresa` — inicia solicitacao PJ
  - `POST /api/v1/onboarding/empresa/{id}/documentos` — upload de contrato social, CCMEI, comprovante de endereco
  - `POST /api/v1/onboarding/empresa/{id}/verificar` — dispara KYB + PLD na sequencia
  - `GET /api/v1/onboarding/empresa/{id}` — status + resultado consolidado
  - `GET /api/v1/onboarding/empresa/{id}/representantes` — lista representantes legais retornados pelo `KybProvider`
- Webhooks:
  - `POST /api/v1/webhooks/celcoin/kyb` — callback assincrono do KYB
  - `POST /api/v1/webhooks/celcoin/pld` — callback assincrono do background check PLD
  - Reusam o pattern da Sprint 4 (`Idempotency-Key`, validacao HMAC, Outbox)
- PLD obrigatoriamente aplicado a pessoas e empresas:
  - Para PF: PLD dispara automaticamente apos KYC `APROVADO` (a Sprint 6 deixou esse follow-up para a Sprint 7)
  - Para PJ: PLD dispara automaticamente apos KYB `APROVADO`, e tambem para cada representante legal retornado
  - Resultado PLD com hit em qualquer base bloqueia onboarding (`REPROVADO_PLD`); resultado limpo move para `APROVADO_FINAL`
- Migrations Flyway: alteracoes em `solicitacao_onboarding` (campo `tipo`), novas tabelas `kyb_empresa`, `consulta_cnpj`, `representante_legal`, `consulta_pld`
- Auditoria reforcada: novos tipos no `audit_log_seguranca` (Sprint 5): `KYB_INICIADO`, `KYB_FINALIZADO_*`, `PLD_INICIADO`, `PLD_HIT_DETECTADO`, `PLD_LIMPO`

### Fora de escopo nesta Sprint
- Reprocessamento manual de KYB ou PLD com erro — Sprint 14 (Backoffice)
- Retencao especial de dados PLD (LGPD Art. 16 — 5 anos minimo) — politica fica documentada, mas job de purge entra em sprint futura
- Telas frontend/mobile — apenas backend na Fase 2 (decisao 2026-05-04)
- Watchlist proprietaria do produto — fora do escopo (delegado a Celcoin/parceiros)
- Renovacao periodica de KYC/KYB (re-onboarding apos N meses) — sprint futura

## Pre-requisitos globais

- Sprint 6 concluida (modulo `onboarding` PF funcional, infraestrutura de Provider/Webhook/auditoria estabelecida)
- ADRs 0004, 0007, 0008 vigentes
- Credenciais Celcoin sandbox para KYB e Background Check disponiveis
- Validacao operacional: confirmar com area juridica se as 4 bases PLD (COAF, OFAC, INTERPOL, MTE) cobrem a obrigacao integral do produto SEP — senao adicionar bases extras nesta sprint

## Tasks

### Task 7.1 — Refactor: generalizar `SolicitacaoOnboarding` para PJ

**Descricao**
Adicionar campo `tipo` em `SolicitacaoOnboarding` e ajustar o agregado para suportar PF e PJ. Migracao Flyway aditiva (sem perda de dados).

**Arquivos esperados**
- update `onboarding/domain/model/SolicitacaoOnboarding.java`: novo campo `TipoSolicitante tipo` (sealed: `PESSOA`, `EMPRESA`)
- update `onboarding/domain/vo/StatusOnboarding.java`: adicionar `APROVADO_FINAL`, `REPROVADO_PLD`
- `src/main/resources/db/migration/V<n>__alterar_solicitacao_onboarding_tipo.sql`
- update unique constraint: `(documento, status)` em vez de `(cpf, status)` para acomodar CNPJ

**Testes**
- update `SolicitacaoOnboardingTest`: cobertura das transicoes para PJ
- migration test: dados existentes (PF) recebem `tipo = PESSOA` no backfill

**Pre-requisitos**: Sprint 6 concluida.
**Responsavel**: Dev Senior.

---

### Task 7.2 — Entidades KYB

**Descricao**
Modelar as entidades especificas de pessoa juridica.

**Arquivos esperados**
- `onboarding/domain/model/KybEmpresa.java` (1:1 com `SolicitacaoOnboarding` quando tipo `EMPRESA`)
- `onboarding/domain/model/ConsultaCNPJ.java` (resultado da consulta a Receita Federal — situacao, atividades, capital social, data abertura)
- `onboarding/domain/model/RepresentanteLegal.java` (N:1 com `KybEmpresa`; cada representante e tambem submetido ao PLD)
- `onboarding/domain/vo/Cnpj.java`
- `onboarding/domain/vo/TipoSocietario.java` (sealed)
- `onboarding/domain/vo/PorteEmpresa.java` (sealed)
- `src/main/resources/db/migration/V<n>__criar_tabelas_kyb.sql`

**Testes obrigatorios**
- `CnpjTest`, `KybEmpresaRepositoryTest`, `RepresentanteLegalRepositoryTest`

**Pre-requisitos**: Task 7.1.
**Responsavel**: Dev Senior.

---

### Task 7.3 — `KybProvider` (port + adapters Fake/Celcoin)

**Descricao**
Definir contrato + implementar adapters para consulta KYB.

**Arquivos esperados**
- `onboarding/application/port/out/KybProvider.java`
- `onboarding/application/port/out/dto/RequisicaoKyb.java` (record com cnpj)
- `onboarding/application/port/out/dto/RespostaKyb.java` (record com situacao, lista de representantes, dados cadastrais)
- `onboarding/infrastructure/adapter/celcoin/FakeKybProvider.java`
- `onboarding/infrastructure/adapter/celcoin/CelcoinKybProvider.java`
- `onboarding/infrastructure/adapter/celcoin/CelcoinKybMapper.java` (MapStruct)
- update `CelcoinResilienceConfig` com circuit breaker `celcoin-kyb`

**Testes obrigatorios**
- `FakeKybProviderTest`, `CelcoinKybMapperTest`
- `CelcoinKybProviderIT` (WireMock; valida contratos OAuth + resposta + retry)

**Pre-requisitos**: Tasks 7.1, 7.2.
**Responsavel**: Dev Senior.

---

### Task 7.4 — `BackgroundCheckProvider` (PLD)

**Descricao**
Provider para consultas PLD nas 4 bases obrigatorias (COAF, OFAC, INTERPOL, MTE). Consulta parametrizada por nome + documento (CPF ou CNPJ).

**Arquivos esperados**
- `onboarding/application/port/out/BackgroundCheckProvider.java`
- `onboarding/application/port/out/dto/RequisicaoPld.java` (record com nome, documento, tipo `PESSOA`/`EMPRESA`)
- `onboarding/application/port/out/dto/RespostaPld.java` (record com lista de hits por base; cada hit detalhado)
- `onboarding/application/port/out/dto/HitPld.java` (record com `base`, `motivo`, `severidade`, `dataInclusao`)
- `onboarding/infrastructure/adapter/celcoin/FakeBackgroundCheckProvider.java`
- `onboarding/infrastructure/adapter/celcoin/CelcoinBackgroundCheckProvider.java`
- `onboarding/infrastructure/adapter/celcoin/CelcoinBackgroundCheckMapper.java`
- update `CelcoinResilienceConfig` com circuit breaker `celcoin-background-check`

**Regras**
- Consulta as 4 bases em paralelo (futures); resultado consolidado
- Qualquer hit em qualquer base e considerado bloqueador (`REPROVADO_PLD`)
- Detalhamento de hit retornado para auditoria; nunca exposto publicamente

**Testes obrigatorios**
- `FakeBackgroundCheckProviderTest`
- `CelcoinBackgroundCheckProviderIT` (WireMock simulando todas as 4 bases)

**Pre-requisitos**: Task 7.2.
**Responsavel**: Dev Senior.

---

### Task 7.5 — Use cases KYB e PLD

**Descricao**
Implementar a orquestracao do ciclo KYB e o disparo automatico de PLD.

**Arquivos esperados**
- `onboarding/application/usecase/IniciarOnboardingEmpresaUseCase.java`
- `onboarding/application/usecase/IniciarVerificacaoKybUseCase.java`
- `onboarding/application/usecase/IniciarPldPessoaUseCase.java`
- `onboarding/application/usecase/IniciarPldEmpresaUseCase.java`
- `onboarding/application/usecase/ConsultarRepresentantesLegaisUseCase.java`
- `onboarding/application/listener/PldOrchestrationListener.java` — escuta `OnboardingFinalizadoEvent` (Sprint 6) e dispara PLD automaticamente

**Regras**
- Para PJ: ao receber callback KYB com sucesso, dispara PLD para a empresa + cada representante legal retornado
- Para PF: ao receber callback KYC com `APROVADO` (Sprint 6), `PldOrchestrationListener` automaticamente dispara `IniciarPldPessoaUseCase`
- Falha em PLD de qualquer representante bloqueia onboarding completo da empresa
- Idempotencia em todos os disparos (header `Idempotency-Key` deterministico baseado em `solicitacaoId + revisao`)

**Testes obrigatorios**
- `IniciarOnboardingEmpresaUseCaseTest` (CNPJ duplicado rejeitado; sucesso)
- `PldOrchestrationListenerTest` (recebe evento KYC `APROVADO` e dispara PLD)
- `IniciarPldEmpresaUseCaseTest` (orquestra PLD da empresa + cada representante)

**Pre-requisitos**: Tasks 7.3, 7.4.
**Responsavel**: Dev Senior.

---

### Task 7.6 — Webhooks KYB e PLD

**Descricao**
Dois webhooks separados, cada um com idempotencia + validacao HMAC, seguindo o pattern da Sprint 4 e replicando a Task 6.4.

**Arquivos esperados**
- `onboarding/web/controller/CelcoinKybWebhookController.java` — `POST /api/v1/webhooks/celcoin/kyb`
- `onboarding/web/controller/CelcoinPldWebhookController.java` — `POST /api/v1/webhooks/celcoin/pld`
- `onboarding/application/usecase/ProcessarCallbackKybUseCase.java`
- `onboarding/application/usecase/ProcessarCallbackPldUseCase.java`
- DTOs respectivos em `onboarding/web/dto/`

**Regras**
- KYB callback com `situacao != ATIVA` → `REPROVADO`
- PLD callback com qualquer hit → `REPROVADO_PLD` (com motivo gravado para auditoria)
- PLD callback limpo + KYB ja `APROVADO` → `APROVADO_FINAL`
- Outbox + retry conforme Sprint 4

**Testes obrigatorios**
- `CelcoinKybWebhookControllerTest`, `CelcoinPldWebhookControllerTest` (cada cenario: aprovado, reprovado, idempotencia, HMAC invalido)
- `ProcessarCallbackKybUseCaseTest`, `ProcessarCallbackPldUseCaseTest`

**Pre-requisitos**: Tasks 7.3, 7.4, 7.5.
**Responsavel**: Dev Senior.

---

### Task 7.7 — Endpoints REST + DTOs PJ

**Descricao**
Expor os 4 endpoints PJ no controller dedicado, seguindo o padrao da Sprint 6.

**Arquivos esperados**
- `onboarding/web/controller/OnboardingEmpresaController.java`
- `onboarding/web/dto/IniciarOnboardingEmpresaRequest.java`
- `onboarding/web/dto/EmpresaResponse.java`
- `onboarding/web/dto/RepresentanteLegalResponse.java`
- `onboarding/web/dto/StatusOnboardingEmpresaResponse.java`

**Endpoints**
- `POST /api/v1/onboarding/empresa` (autenticado)
- `POST /api/v1/onboarding/empresa/{id}/documentos` (multipart; ownership)
- `POST /api/v1/onboarding/empresa/{id}/verificar` (idempotente; ownership)
- `GET /api/v1/onboarding/empresa/{id}` (ownership ou ADMIN)
- `GET /api/v1/onboarding/empresa/{id}/representantes` (ownership ou ADMIN)

**OpenAPI**
- Documentacao Springdoc completa com exemplos
- Reusa `ErrorResponseDto` (Sprint 4)

**Testes obrigatorios**
- `OnboardingEmpresaControllerTest` (`@WebMvcTest`; cobertura de cada endpoint, ownership, validacao CNPJ)

**Pre-requisitos**: Tasks 7.5, 7.6.
**Responsavel**: Dev Senior.

---

### Task 7.8 — Auditoria reforcada KYB + PLD

**Descricao**
Adicionar novos tipos de eventos no `audit_log_seguranca` (Sprint 5) e conectar listeners.

**Arquivos esperados**
- update sealed enum `AuditLogSegurancaTipo` (Sprint 5): `KYB_INICIADO`, `KYB_FINALIZADO_APROVADO`, `KYB_FINALIZADO_REPROVADO`, `PLD_INICIADO`, `PLD_HIT_DETECTADO`, `PLD_LIMPO`, `PLD_FINALIZADO`
- update `OnboardingAuditListener` (Task 6.6) para cobrir os novos eventos PJ + PLD

**Regras**
- Eventos PLD com `PLD_HIT_DETECTADO` gravam o detalhamento do hit (base, motivo, severidade) para auditoria BACEN
- Retencao minima 5 anos para eventos PLD (LGPD Art. 16) — politica documentada nesta sprint, job de purge em sprint futura

**Testes obrigatorios**
- `OnboardingAuditListenerTest` (todos os novos eventos gravados corretamente)

**Pre-requisitos**: Tasks 7.5, 7.6.
**Responsavel**: Dev Senior.

---

### Task 7.9 — Testes de integracao end-to-end PJ + PLD

**Descricao**
Suite que cobre o ciclo completo de onboarding PJ + PLD, incluindo follow-up automatico de PLD apos KYC PF (Sprint 6).

**Cenarios obrigatorios**
- Empresa cadastra → KYB OK + PLD limpo (empresa + representantes) → `APROVADO_FINAL`
- Empresa cadastra → KYB OK + PLD com hit em representante → `REPROVADO_PLD`
- Empresa cadastra → KYB com situacao SUSPENSA → `REPROVADO` (PLD nao dispara)
- Pessoa Fisica passa KYC `APROVADO` (Sprint 6) → PLD dispara automaticamente → PLD limpo → `APROVADO_FINAL`
- Pessoa Fisica passa KYC `APROVADO` → PLD com hit → `REPROVADO_PLD`
- CNPJ duplicado em solicitacao ativa → 409
- Webhook KYB com HMAC invalido → 401
- Webhook PLD idempotente

**Arquivos esperados**
- `onboarding/web/OnboardingEmpresaIT.java`
- `onboarding/web/PldFollowupIT.java` (cobre o follow-up automatico de PLD apos KYC PF)

**Pre-requisitos**: Tasks 7.1-7.8.
**Responsavel**: Dev Senior.

---

### Task 7.10 — Documentacao + atualizacao do PRD

**Descricao**
Atualizar artefatos de documentacao da Sprint 7.

**Arquivos esperados**
- update `docs-sep/PRD.md` §22 Sprint 7 — marcar como executada (apos merge)
- update `docs-SEP/repos/sep-api/ONBOARDING.md` (criado na Sprint 6) — adicionar secao PJ + PLD com diagrama de estados consolidado
- novo `docs-SEP/repos/sep-api/PLD.md` — politica PLD do produto: bases, criterios de bloqueio, retencao, fluxo de excecoes
- update Swagger UI

**Pre-requisitos**: Tasks 7.1-7.9.
**Responsavel**: Dev Senior + revisao juridica do `PLD.md`.

---

## Grafo de dependencias entre as tasks

```
Sprint 6 concluida
        |
        v
Task 7.1 (refactor SolicitacaoOnboarding tipo PF/PJ)
        |
        +---> Task 7.2 (entidades KYB) -----+
                                            |
                                            +---> Task 7.3 (KybProvider) -+
                                            +---> Task 7.4 (BackgroundCheckProvider PLD) -+
                                                                                          |
                                                                                          v
                                                                                Task 7.5 (use cases KYB + PLD)
                                                                                          |
                                                                                          v
                                                                                Task 7.6 (webhooks KYB + PLD)
                                                                                          |
                                                                                          v
                                                                                Task 7.7 (endpoints REST + DTOs)
                                                                                          |
                                                                                          v
                                                                                Task 7.8 (auditoria reforcada)
                                                                                          |
                                                                                          v
                                                                                Task 7.9 (testes E2E)
                                                                                          |
                                                                                          v
                                                                                Task 7.10 (documentacao + PLD.md)
```

## Definicao de pronto da Sprint 7

- `SolicitacaoOnboarding` suporta PF e PJ (refactor com migration aditiva, sem perda de dados)
- Entidades `KybEmpresa`, `ConsultaCNPJ`, `RepresentanteLegal` modeladas e migradas
- `KybProvider` e `BackgroundCheckProvider` com Fake + Celcoin adapters
- 5 endpoints REST PJ funcionais e documentados
- 2 webhooks (`/celcoin/kyb`, `/celcoin/pld`) com idempotencia + HMAC + Outbox
- PLD dispara automaticamente apos KYC PF aprovado (follow-up da Sprint 6)
- Auditoria reforcada cobrindo todos os eventos KYB + PLD (alem da auditoria JPA padrao)
- Suite E2E passando com cenarios de hit PLD em representante legal
- WireMock tests dos 2 novos `*ProviderIT` passando
- Cobertura JaCoCo do modulo `onboarding` >= 70% (consolidada com a Sprint 6)
- `PLD.md` revisado pela area juridica e publicado em `docs-SEP/repos/sep-api/`

## Impacto na Sprint seguinte (Sprint 8 — Credito)

- Modulo `onboarding` completo: a Sprint 8 (Credito — regras + parecer) consome `ResultadoVerificacao` com status `APROVADO_FINAL` como pre-requisito de criacao de proposta
- Listener de eventos do dominio `onboarding` ja estabelecido — Sprint 8 reusa pattern para reagir a aprovacao
- Se algum momento KYB/PLD for re-disparado (re-onboarding), o motor de credito da Sprint 8 deve ser notificado para revalidar elegibilidade — pre-requisito anotado para sprints futuras

## Restricoes e regras de execucao

- **PLD e obrigatorio por lei** — nao pode ser desativado em ambiente de producao; flag de bypass apenas em `dev`/`local-wiremock`
- **Hits PLD nunca expostos publicamente** — apenas para auditoria interna (BACEN, COAF se solicitado)
- Retencao minima de eventos PLD: 5 anos (LGPD Art. 16)
- Provider Pattern obrigatorio (ADR 0004)
- Sem F-Sprint 7 / M-Sprint 7 — apenas backend (decisao 2026-05-04)

## Referencias

- [PRD §3.1 (Marco regulatorio CMN 4.656/2018)](../../docs-sep/PRD.md)
- [PRD §11 (Modulo onboarding + Provider Pattern)](../../docs-sep/PRD.md)
- [PRD §22 (Sprint 7)](../../docs-sep/PRD.md)
- [PRD §25 (Epic 5)](../../docs-sep/PRD.md)
- [PRD §29 (Mapeamento Fase 2)](../../docs-sep/PRD.md)
- [ADR 0004 - Provider Pattern](../../adr/0004-provider-pattern-para-integracoes-externas.md)
- [ADR 0008 - WireMock](../../adr/0008-wiremock-para-testes-integracao-celcoin.md)
- [Spec 006 - Sprint 6 (KYC PF, dependencia)](./006-sprint-6-onboarding-kyc-pessoa.md)
- [Spec 008 - Sprint 8 (proxima — Credito)](./008-sprint-8-credito-regras-parecer.md)
- Resolucao CMN 4.656/2018 — Art. 8 (KYC/KYB obrigatorio), Art. 17 (PLD)
- Lei 9.613/1998 (Lavagem de Dinheiro)
- COAF — Conselho de Controle de Atividades Financeiras
- OFAC — Office of Foreign Assets Control (US Treasury)
- INTERPOL Notices
- MTE — Lista de Trabalho Escravo
