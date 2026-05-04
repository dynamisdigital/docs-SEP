# Spec 014 - Sprint 14 - Backoffice operacional

## Metadados

- **ID da Spec**: 014
- **Titulo**: Sprint 14 - Modulo `backoffice` + fila operacional + reprocessos + visao consolidada (Epic 9, sprint unica)
- **Status**: aprovada para execucao (apos conclusao da Sprint 13)
- **Fase do produto**: Fase 2 — Epic 9 (sprint unica que consolida a operacao assistida da Fase 2)
- **Origem**: PRD §11 (Modulo backoffice), §22 (Sprint 14), §25 (Epic 9); ADRs 0001, 0007
- **Depende de**: [`013-sprint-13-cobranca-inadimplencia.md`](./013-sprint-13-cobranca-inadimplencia.md)
- **Responsavel principal**: Dev Senior

## Objetivo

Consolidar a operacao assistida da Fase 2 entregando o modulo `backoffice`. Esta sprint unifica em uma unica fila operacional todas as situacoes que exigem intervencao humana: propostas pendentes, KYC/KYB com erro, contratos sem assinatura, cobrancas problematicas, parcelas inadimplentes, webhooks que falharam.

A sprint introduz capacidade de comentarios internos, justificativas auditaveis, reprocessos manuais (re-disparo de webhooks via Outbox + re-tentativa de chamadas a providers) e visao consolidada para o financeiro interno acompanhar onboarding, analise, formalizacao e cobranca em um lugar so. Fecha o ciclo da Fase 2 — daqui para frente, a operacao da SEP pode ser conduzida pelo time interno sem necessitar de developers.

## Escopo

### Em escopo (apenas backend)

- Novo modulo `backoffice` em `com.dynamis.broker_app.backoffice` (DDD + Hexagonal)
- Entidades de dominio:
  - `ItemFilaOperacional` (registro normalizado de cada item que precisa de atencao; agrega referencias para o objeto original via `tipoEntidade` + `entidadeId`)
  - `ComentarioInterno` (comentarios + justificativas; N:1 com `ItemFilaOperacional`)
  - `Reprocesso` (registro de cada tentativa manual de reprocessar uma operacao falha)
- Value objects: `TipoItemFila` (sealed: `ONBOARDING_PENDENTE`, `ONBOARDING_ERRO`, `PROPOSTA_PENDENTE`, `CONTRATO_NAO_ASSINADO`, `COBRANCA_INADIMPLENTE`, `WEBHOOK_FALHOU`, `OUTRO`), `PrioridadeItem` (sealed: `BAIXA`, `MEDIA`, `ALTA`, `CRITICA`), `StatusItemFila` (sealed: `ABERTO`, `EM_TRATAMENTO`, `RESOLVIDO`, `IGNORADO`)
- **Listeners** consumindo eventos das sprints anteriores:
  - `OnboardingFinalizadoListener` → cria item se `REPROVADO` ou `PENDENCIA`
  - `PropostaPendenciaListener` → cria item se proposta entra em `EM_ANALISE` por mais de 24h
  - `ContratoAceitoListener` → cria item se contrato fica em `ACEITO` por mais de 48h sem progredir para `EM_ASSINATURA`
  - `ParcelaInadimplenteListener` → cria item de alta prioridade
  - `WebhookFalhouListener` → cria item para itens que ficaram na Outbox por mais de 1h sem processamento
- Use cases:
  - `ListarFilaOperacionalUseCase` (filtros: tipo, prioridade, status, dataAbertura, atribuidoA)
  - `AssumirItemFilaUseCase` (operador atribui item a si mesmo; transiciona para `EM_TRATAMENTO`)
  - `RegistrarComentarioUseCase`
  - `MarcarItemResolvidoUseCase` (com justificativa obrigatoria)
  - `MarcarItemIgnoradoUseCase` (com justificativa obrigatoria)
  - `ReprocessarWebhookUseCase` (re-dispara processamento de evento da Outbox)
  - `ReprocessarChamadaProviderUseCase` (re-tenta chamada a provider externo que falhou)
  - `ConsultarVisaoConsolidadaUseCase` (dashboard: contadores por status, tempo medio de tratamento)
- Endpoints REST em `/api/v1/backoffice`:
  - `GET /api/v1/backoffice/fila` — lista itens (filtros)
  - `GET /api/v1/backoffice/fila/{id}` — detalha item + objeto original referenciado
  - `POST /api/v1/backoffice/fila/{id}/assumir` (`ROLE_FINANCEIRO` ou `ROLE_BACKOFFICE`)
  - `POST /api/v1/backoffice/fila/{id}/comentarios`
  - `PATCH /api/v1/backoffice/fila/{id}/resolver` (justificativa obrigatoria)
  - `PATCH /api/v1/backoffice/fila/{id}/ignorar` (justificativa obrigatoria)
  - `POST /api/v1/backoffice/reprocessos/webhook/{webhookEventId}` (re-dispara webhook)
  - `POST /api/v1/backoffice/reprocessos/provider/{tipoChamada}/{idEntidade}` (re-tenta chamada a provider)
  - `GET /api/v1/backoffice/dashboard` — visao consolidada (contadores + metricas)
- Nova role `ROLE_BACKOFFICE`:
  - Migration adiciona role
  - Permite operar fila + reprocessos sem permissoes amplas de financeiro
  - Pode ser cumulativa com `ROLE_FINANCEIRO`
- Migrations Flyway: `item_fila_operacional`, `comentario_interno`, `reprocesso`
- Auditoria reforcada: novos tipos `ITEM_FILA_CRIADO`, `ITEM_ASSUMIDO`, `COMENTARIO_REGISTRADO`, `ITEM_RESOLVIDO`, `ITEM_IGNORADO`, `REPROCESSO_DISPARADO`

### Fora de escopo nesta Sprint
- Telas frontend/mobile do backoffice — Frontend de Jornadas (Epic 13)
- SLA + alertas automaticos para itens em atraso — sprint futura
- Atribuicao automatica de itens (round-robin) — sprint futura; nesta sprint e manual
- Relatorios exportaveis (CSV/PDF) — sprint futura
- BI / dashboards externos — sprint futura

## Pre-requisitos globais

- Sprint 13 concluida (modulo `cobranca` completo com inadimplencia e renegociacao)
- Todos os modulos da Fase 2 funcionais (`identity`, `onboarding`, `credito`, `contratos`, `cobranca`, `escrow`)
- Webhook Receiver com Outbox da Sprint 4 funcional
- Step-up authentication da Sprint 5

## Tasks

### Task 14.1 — Criacao do modulo `backoffice` e entidades

**Arquivos esperados**
- `backoffice/domain/model/ItemFilaOperacional.java`
- `backoffice/domain/model/ComentarioInterno.java`
- `backoffice/domain/model/Reprocesso.java`
- `backoffice/domain/vo/TipoItemFila.java` (sealed)
- `backoffice/domain/vo/PrioridadeItem.java` (sealed)
- `backoffice/domain/vo/StatusItemFila.java` (sealed)
- `backoffice/domain/event/ItemFilaCriadoEvent.java`
- `backoffice/domain/event/ItemResolvidoEvent.java`
- `backoffice/infrastructure/persistence/ItemFilaOperacionalRepository.java`
- `src/main/resources/db/migration/V<n>__criar_tabelas_backoffice.sql`

**Esquema SQL (resumo)**
```sql
CREATE TABLE item_fila_operacional (
  id UUID PRIMARY KEY,
  tipo VARCHAR(40) NOT NULL,
  prioridade VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  tipo_entidade VARCHAR(40) NOT NULL,
  entidade_id UUID NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  atribuido_a UUID,
  data_abertura TIMESTAMP WITH TIME ZONE NOT NULL,
  data_resolucao TIMESTAMP WITH TIME ZONE,
  data_criacao TIMESTAMP WITH TIME ZONE NOT NULL,
  data_modificacao TIMESTAMP WITH TIME ZONE NOT NULL,
  criado_por VARCHAR(50) NOT NULL,
  modificado_por VARCHAR(50) NOT NULL,
  CONSTRAINT uq_item_unico_por_entidade UNIQUE (tipo, tipo_entidade, entidade_id) DEFERRABLE
);
CREATE INDEX idx_fila_status_prioridade ON item_fila_operacional(status, prioridade, data_abertura);
CREATE INDEX idx_fila_atribuido ON item_fila_operacional(atribuido_a) WHERE atribuido_a IS NOT NULL;

CREATE TABLE comentario_interno (
  id UUID PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES item_fila_operacional(id),
  autor_id UUID NOT NULL,
  conteudo TEXT NOT NULL,
  data_criacao TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE reprocesso (
  id UUID PRIMARY KEY,
  item_id UUID REFERENCES item_fila_operacional(id),
  tipo VARCHAR(40) NOT NULL,
  identificador_externo VARCHAR(255),
  status VARCHAR(20) NOT NULL,
  resultado TEXT,
  data_disparo TIMESTAMP WITH TIME ZONE NOT NULL,
  disparado_por UUID NOT NULL
);
```

**Pre-requisitos**: Sprint 13 concluida.
**Responsavel**: Dev Senior.

---

### Task 14.2 — Listeners de eventos das sprints anteriores

**Arquivos esperados**
- `backoffice/application/listener/OnboardingFinalizadoListener.java` (escuta `OnboardingFinalizadoEvent` da Sprint 6/7)
- `backoffice/application/listener/PropostaPendenciaListener.java` (verifica propostas em `EM_ANALISE` por > 24h via job)
- `backoffice/application/listener/ContratoAceitoListener.java` (verifica contratos em `ACEITO` por > 48h sem progredir)
- `backoffice/application/listener/ParcelaInadimplenteListener.java` (escuta `ParcelaInadimplenteEvent` da Sprint 13)
- `backoffice/application/listener/WebhookFalhouListener.java` (verifica Outbox para eventos sem processamento ha > 1h)
- `backoffice/application/job/VerificadorPendenciasJob.java` (`@Scheduled` cron `0 */15 * * * *`; consolida verificacoes baseadas em tempo)

**Regras**
- Idempotencia: nao cria item duplicado se ja existe item ativo do mesmo tipo para a mesma entidade
- Cada item gera evento `ItemFilaCriadoEvent` para audit trail

**Testes obrigatorios**
- Test de cada listener (recebe evento, cria item)
- `VerificadorPendenciasJobTest`

**Pre-requisitos**: Task 14.1.
**Responsavel**: Dev Senior.

---

### Task 14.3 — Use cases de fila + comentarios + resolucao

**Arquivos esperados**
- `backoffice/application/usecase/ListarFilaOperacionalUseCase.java`
- `backoffice/application/usecase/AssumirItemFilaUseCase.java`
- `backoffice/application/usecase/RegistrarComentarioUseCase.java`
- `backoffice/application/usecase/MarcarItemResolvidoUseCase.java`
- `backoffice/application/usecase/MarcarItemIgnoradoUseCase.java`

**Regras**
- `AssumirItemFilaUseCase`: transiciona para `EM_TRATAMENTO`; registra `atribuido_a`
- `MarcarItemResolvidoUseCase`: exige justificativa minima de 20 caracteres + step-up; transiciona para `RESOLVIDO`
- `MarcarItemIgnoradoUseCase`: exige justificativa + step-up; transiciona para `IGNORADO`
- Listagem com paginacao + filtros via Spring Data Specification
- Apenas `ROLE_FINANCEIRO` ou `ROLE_BACKOFFICE` acessam

**Testes obrigatorios**
- Cada use case com testes happy path + edge cases

**Pre-requisitos**: Task 14.1.
**Responsavel**: Dev Senior.

---

### Task 14.4 — Use cases de reprocessamento

**Arquivos esperados**
- `backoffice/application/usecase/ReprocessarWebhookUseCase.java`
- `backoffice/application/usecase/ReprocessarChamadaProviderUseCase.java`

**Regras**
- `ReprocessarWebhookUseCase`: re-dispara processamento de evento da Outbox (Sprint 4); cria `Reprocesso` para auditoria
- `ReprocessarChamadaProviderUseCase`: re-tenta chamada externa que falhou (KYC, KYB, PLD, OpenFinance, AssinaturaDigital); cria `Reprocesso`
- Step-up obrigatorio em ambos
- Limita a 3 reprocessos manuais por entidade em 24h (controle anti-abuso)

**Testes obrigatorios**
- `ReprocessarWebhookUseCaseTest`, `ReprocessarChamadaProviderUseCaseTest`

**Pre-requisitos**: Task 14.1.
**Responsavel**: Dev Senior.

---

### Task 14.5 — Visao consolidada / dashboard

**Arquivos esperados**
- `backoffice/application/usecase/ConsultarVisaoConsolidadaUseCase.java`
- `backoffice/application/dto/DashboardBackoffice.java` (record com contadores + metricas)

**Conteudo do dashboard**
- Contadores por `tipo`, por `prioridade`, por `status`
- Tempo medio de resolucao (ultimos 30 dias)
- Itens criticos abertos ha mais de 48h
- Top 5 tipos de itens mais frequentes
- Recebimentos do dia (consume Sprint 12)
- Inadimplencia total (R$ + numero de parcelas; consume Sprint 13)
- Numero de propostas por status (consume Sprint 8)

**Testes obrigatorios**
- `ConsultarVisaoConsolidadaUseCaseTest`

**Pre-requisitos**: Task 14.1 + integracoes leves com modulos anteriores.
**Responsavel**: Dev Senior.

---

### Task 14.6 — Nova role `ROLE_BACKOFFICE`

**Arquivos esperados**
- update enum/sealed `Role.java` (Sprint 8) com novo valor `BACKOFFICE`
- `src/main/resources/db/migration/V<n>__adicionar_role_backoffice.sql`
- update `PromoverUsuarioRoleUseCase` (Sprint 8) para suportar nova role

**Regras**
- Permite acesso a fila + reprocessos sem dar acessos amplos de financeiro
- Nao tem acesso a `RegistrarParecerUseCase` (parecer de credito) nem a `RegistrarRecebimentoUseCase` (recebimento de cobranca)
- Auditoria de promocao registrada em `audit_log_seguranca`

**Pre-requisitos**: Task 14.1.
**Responsavel**: Dev Senior.

---

### Task 14.7 — Endpoints REST + DTOs

**Arquivos esperados**
- `backoffice/web/controller/BackofficeController.java`
- `backoffice/web/controller/BackofficeReprocessoController.java`
- `backoffice/web/controller/BackofficeDashboardController.java`
- `backoffice/web/dto/ItemFilaResponse.java`, `ComentarioRequest`, `ResolverRequest`, `IgnorarRequest`, `DashboardResponse`, etc.
- `backoffice/web/mapper/BackofficeWebMapper.java`

**Endpoints**
- `GET /api/v1/backoffice/fila` (filtros + paginacao; `ROLE_FINANCEIRO`/`ROLE_BACKOFFICE`)
- `GET /api/v1/backoffice/fila/{id}` (com objeto original referenciado)
- `POST /api/v1/backoffice/fila/{id}/assumir`
- `POST /api/v1/backoffice/fila/{id}/comentarios`
- `PATCH /api/v1/backoffice/fila/{id}/resolver` (step-up + justificativa)
- `PATCH /api/v1/backoffice/fila/{id}/ignorar` (step-up + justificativa)
- `POST /api/v1/backoffice/reprocessos/webhook/{webhookEventId}` (step-up)
- `POST /api/v1/backoffice/reprocessos/provider/{tipoChamada}/{idEntidade}` (step-up)
- `GET /api/v1/backoffice/dashboard`

**OpenAPI** completa.

**Testes obrigatorios**
- `BackofficeControllerTest`, `BackofficeReprocessoControllerTest`, `BackofficeDashboardControllerTest`

**Pre-requisitos**: Tasks 14.3, 14.4, 14.5, 14.6.
**Responsavel**: Dev Senior.

---

### Task 14.8 — Auditoria reforcada

**Arquivos esperados**
- update enum `AuditLogSegurancaTipo`: `ITEM_FILA_CRIADO`, `ITEM_ASSUMIDO`, `COMENTARIO_REGISTRADO`, `ITEM_RESOLVIDO`, `ITEM_IGNORADO`, `REPROCESSO_DISPARADO`
- `backoffice/application/listener/BackofficeAuditListener.java`

**Pre-requisitos**: Tasks 14.3, 14.4.
**Responsavel**: Dev Senior.

---

### Task 14.9 — Testes E2E

**Cenarios obrigatorios**
- Onboarding entra em `REPROVADO` (Sprint 6) → listener cria item na fila com prioridade alta
- Operador `BACKOFFICE` lista fila → assume item → adiciona comentario → marca resolvido com justificativa
- Operador `BACKOFFICE` tenta resolver sem step-up → 403
- Operador `BACKOFFICE` tenta registrar parecer de credito → 403 (nao tem permissao)
- Webhook falhou (Outbox) → listener cria item → operador re-dispara → reprocesso registrado
- Reprocesso 4o em 24h → 429 (limite anti-abuso)
- Item duplicado nao e criado (idempotencia)
- Dashboard retorna metricas consolidadas

**Arquivos esperados**
- `backoffice/web/BackofficeIT.java`
- `backoffice/web/ReprocessoIT.java`

**Pre-requisitos**: Tasks 14.1-14.8.
**Responsavel**: Dev Senior.

---

### Task 14.10 — Documentacao + fechamento da Fase 2

**Arquivos esperados**
- update `docs-sep/PRD.md` §22 Sprint 14 — marcar como executada (apos merge)
- update `docs-sep/PRD.md` §29 — marcar Fase 2 como concluida
- novo `docs-sep/BACKOFFICE.md` — fluxo, papeis, reprocessos, dashboard
- update `docs-sep/CONTEXT.md` — registrar conclusao da Fase 2
- update Swagger UI

**Pre-requisitos**: Tasks 14.1-14.9.
**Responsavel**: Dev Senior + revisao do PO.

---

## Grafo de dependencias

```
Sprint 13 concluida
        |
        v
Task 14.1 (entidades + migrations)
        |
        +---> Task 14.2 (listeners de eventos) -----+
        +---> Task 14.6 (role BACKOFFICE) ----------+
                                                     |
                                                     +---> Task 14.3 (use cases fila)
                                                     +---> Task 14.4 (reprocessos)
                                                     +---> Task 14.5 (dashboard)
                                                                  |
                                                                  v
                                                        Task 14.7 (endpoints REST)
                                                                  |
                                                                  v
                                                        Task 14.8 (auditoria)
                                                                  |
                                                                  v
                                                        Task 14.9 (testes E2E)
                                                                  |
                                                                  v
                                                        Task 14.10 (documentacao + fechamento Fase 2)
```

## Definicao de pronto da Sprint 14

- Modulo `backoffice` criado com estrutura DDD
- Entidades + migrations funcionais
- 5 listeners criando itens na fila a partir de eventos das sprints anteriores
- Use cases de fila, comentarios, resolucao, ignorar, reprocessos operacionais
- Role `ROLE_BACKOFFICE` adicionada
- Dashboard de visao consolidada operacional
- 9 endpoints REST documentados
- Auditoria reforcada
- Suite E2E passando
- Cobertura JaCoCo do modulo `backoffice` >= 70%
- `BACKOFFICE.md` publicado
- **Fase 2 marcada como concluida** no PRD §29 + CONTEXT.md atualizado

## Impacto pos-Fase 2

- Fase 2 entregue: jornada completa de contratacao funcional (KYC/KYB → Credito → Formalizacao → Cobranca → Backoffice)
- Operacao da SEP pode ser conduzida pelo time interno sem developers
- Proxima fase (Fase 3) pode incluir:
  - Frontend Web e Mobile da Fase 2 (consumir os contratos estabilizados — decisao 2026-05-04)
  - Epic 10 (Jornada Empresa Credora)
  - Epic 11 (Administracao e governanca avancada)
  - Epic 15 (Pix — automatizar recebimentos)

## Restricoes e regras de execucao

- **Operacoes de backoffice sao auditadas integralmente** — toda acao gera evento em `audit_log_seguranca`
- Reprocessos limitados a 3 por entidade/24h (anti-abuso)
- Step-up obrigatorio em todas as acoes de mudanca de estado
- Sem F-Sprint 14 / M-Sprint 14 — apenas backend (decisao 2026-05-04)
- Backoffice mobile **nunca** entra em escopo (decisao do PRD §11 sobre Mobile SEP)

## Referencias

- [PRD §11 (Modulo backoffice)](../../docs-sep/PRD.md)
- [PRD §22 (Sprint 14)](../../docs-sep/PRD.md)
- [PRD §25 (Epic 9)](../../docs-sep/PRD.md)
- [PRD §29 (Mapeamento Fase 2)](../../docs-sep/PRD.md)
- [ADR 0001](../../adr/0001-monolito-modular-orientado-a-ddd.md)
- [ADR 0007](../../adr/0007-ddd-com-hexagonal-ports-and-adapters-por-modulo.md)
- [Spec 005 - Sprint 5 (step-up, dependencia)](./005-sprint-5-endurecimento-seguranca.md)
- [Spec 008 - Sprint 8 (role e step-up, dependencia)](./008-sprint-8-credito-regras-parecer.md)
- [Spec 013 - Sprint 13 (dependencia direta)](./013-sprint-13-cobranca-inadimplencia.md)
