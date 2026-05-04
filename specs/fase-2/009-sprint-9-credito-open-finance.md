# Spec 009 - Sprint 9 - Credito (integracao Open Finance)

## Metadados

- **ID da Spec**: 009
- **Titulo**: Sprint 9 - Analise de Credito enriquecida com Open Finance (`OpenFinanceProvider` via Celcoin/Finansystech)
- **Status**: aprovada para execucao (apos conclusao da Sprint 8)
- **Fase do produto**: Fase 2 — Epic 6 (parte 2)
- **Origem**: PRD §11 (Modulo credito + Provider Pattern), §22 (Sprint 9), §25 (Epic 6); ADRs 0004, 0008
- **Depende de**: [`008-sprint-8-credito-regras-parecer.md`](./008-sprint-8-credito-regras-parecer.md)
- **Responsavel principal**: Dev Senior

## Objetivo

Enriquecer a analise de credito (Sprint 8) com dados de Open Finance via integracao com Celcoin Finansystech. Permite consultar a movimentacao bancaria do tomador (com seu consentimento explicito) e usar esses dados para enriquecer o `ScoreInterno` e refinar o parecer manual.

A sprint introduz o `OpenFinanceProvider` (port + adapters Fake/Celcoin), o ciclo de consentimento Open Finance (geracao do link de consentimento + callback de autorizacao), e a integracao desses dados com o motor de regras existente.

## Escopo

### Em escopo (apenas backend)

- **Provider Pattern** (ADR 0004):
  - `OpenFinanceProvider` (port em `credito.application.port.out`)
  - `CelcoinOpenFinanceProvider` (adapter via `RestClient` + Resilience4j; integra Celcoin Finansystech)
  - `FakeOpenFinanceProvider` (testes e dev; retorna massa fixa)
- Entidades novas:
  - `ConsentimentoOpenFinance` (vincula tomador + escopo + status `PENDENTE`/`AUTORIZADO`/`NEGADO`/`EXPIRADO`)
  - `MovimentacaoOpenFinance` (snapshot de movimentacao bancaria recebida; usado como input do motor)
- Use cases:
  - `IniciarConsentimentoOpenFinanceUseCase` (gera URL de consentimento Celcoin + persiste `ConsentimentoOpenFinance` em `PENDENTE`)
  - `ProcessarCallbackConsentimentoUseCase` (callback de autorizacao: atualiza status para `AUTORIZADO`/`NEGADO`)
  - `ConsultarMovimentacaoOpenFinanceUseCase` (apos autorizacao, busca dados via `OpenFinanceProvider` e persiste snapshot)
  - `ReavaliarPropostaComOpenFinanceUseCase` (re-executa motor de regras adicionando dados Open Finance)
- Endpoints REST:
  - `POST /api/v1/credito/propostas/{id}/open-finance/consentimento` — gera URL para o tomador autorizar
  - `GET /api/v1/credito/propostas/{id}/open-finance` — consulta status + ultima movimentacao recebida
- Webhook:
  - `POST /api/v1/webhooks/celcoin/open-finance` — callback de autorizacao + recebimento de dados de movimentacao (idempotencia + HMAC + Outbox)
- Nova regra no motor de credito (Sprint 8):
  - `RegraOpenFinanceMovimentacao` — analisa media de entradas, frequencia de movimentacao, ratio entradas/saidas; contribui com ate +200 pontos no score
- Migrations Flyway: `consentimento_open_finance`, `movimentacao_open_finance`
- Auditoria reforcada: novos tipos no `audit_log_seguranca`: `OPEN_FINANCE_CONSENTIMENTO_INICIADO`, `OPEN_FINANCE_AUTORIZADO`, `OPEN_FINANCE_NEGADO`, `OPEN_FINANCE_DADOS_RECEBIDOS`, `OPEN_FINANCE_REAVALIACAO`

### Fora de escopo nesta Sprint
- Renovacao automatica de consentimento Open Finance — sprint futura
- Outros provedores Open Finance alem de Celcoin/Finansystech — fora do escopo
- ML / score externo — fora do escopo do produto
- Telas frontend/mobile — apenas backend (decisao 2026-05-04)

## Pre-requisitos globais

- Sprint 8 concluida (modulo `credito` com motor de regras + parecer + role `ROLE_FINANCEIRO`)
- Credenciais Celcoin Finansystech sandbox disponiveis (`app.celcoin.open-finance.*`)
- Decisao operacional: o consentimento Open Finance e opcional na proposta — proposta pode ser aprovada sem ele, mas Open Finance enriquece o score

## Tasks

### Task 9.1 — Entidades + migrations Open Finance

**Descricao**
Modelar e migrar as entidades de consentimento e movimentacao.

**Arquivos esperados**
- `credito/domain/model/ConsentimentoOpenFinance.java`
- `credito/domain/model/MovimentacaoOpenFinance.java` (snapshot consolidado por proposta)
- `credito/domain/vo/StatusConsentimento.java` (sealed: `PENDENTE`, `AUTORIZADO`, `NEGADO`, `EXPIRADO`)
- `src/main/resources/db/migration/V<n>__criar_tabelas_open_finance.sql`

**Esquema SQL (resumo)**
```sql
CREATE TABLE consentimento_open_finance (
  id UUID PRIMARY KEY,
  proposta_id UUID NOT NULL REFERENCES proposta_credito(id),
  tomador_id UUID NOT NULL,
  status VARCHAR(40) NOT NULL,
  url_autorizacao TEXT,
  id_externo_celcoin VARCHAR(255),
  data_inicio TIMESTAMP WITH TIME ZONE,
  data_autorizacao TIMESTAMP WITH TIME ZONE,
  data_expiracao TIMESTAMP WITH TIME ZONE,
  CONSTRAINT uq_consentimento_proposta_ativo UNIQUE (proposta_id, status)
);

CREATE TABLE movimentacao_open_finance (
  id UUID PRIMARY KEY,
  consentimento_id UUID NOT NULL REFERENCES consentimento_open_finance(id),
  payload_consolidado JSONB NOT NULL,
  media_entradas_mensal NUMERIC(15,2),
  media_saidas_mensal NUMERIC(15,2),
  saldo_medio NUMERIC(15,2),
  numero_meses_avaliados INTEGER,
  data_recebimento TIMESTAMP WITH TIME ZONE NOT NULL
);
```

**Testes obrigatorios**
- `ConsentimentoOpenFinanceTest`, `*RepositoryTest`

**Pre-requisitos**: Sprint 8 concluida.
**Responsavel**: Dev Senior.

---

### Task 9.2 — `OpenFinanceProvider` (port + Fake + Celcoin)

**Descricao**
Definir contrato e implementar adapters.

**Arquivos esperados**
- `credito/application/port/out/OpenFinanceProvider.java`
- `credito/application/port/out/dto/RequisicaoConsentimento.java`
- `credito/application/port/out/dto/RespostaConsentimento.java` (carrega `urlAutorizacao`, `idExterno`, `dataExpiracao`)
- `credito/application/port/out/dto/MovimentacaoConsolidada.java`
- `credito/infrastructure/adapter/celcoin/FakeOpenFinanceProvider.java`
- `credito/infrastructure/adapter/celcoin/CelcoinOpenFinanceProvider.java`
- `credito/infrastructure/adapter/celcoin/CelcoinOpenFinanceMapper.java` (MapStruct)
- update `CelcoinResilienceConfig` com circuit breaker `celcoin-open-finance`

**Testes obrigatorios**
- `FakeOpenFinanceProviderTest`
- `CelcoinOpenFinanceProviderIT` (WireMock; valida OAuth + headers + parsing + retry)

**Pre-requisitos**: Task 9.1.
**Responsavel**: Dev Senior.

---

### Task 9.3 — Use cases de consentimento e consulta

**Descricao**
Implementar a orquestracao do ciclo de consentimento.

**Arquivos esperados**
- `credito/application/usecase/IniciarConsentimentoOpenFinanceUseCase.java`
- `credito/application/usecase/ProcessarCallbackConsentimentoUseCase.java`
- `credito/application/usecase/ConsultarMovimentacaoOpenFinanceUseCase.java`

**Regras**
- `IniciarConsentimentoOpenFinanceUseCase` exige proposta em status `EM_ANALISE` ou `PRE_APROVADA` (nao faz sentido para `APROVADA`/`REJEITADA`)
- Callback recebido: se `AUTORIZADO`, dispara automaticamente `ConsultarMovimentacaoOpenFinanceUseCase`
- `ConsultarMovimentacaoOpenFinanceUseCase` chama `OpenFinanceProvider`, calcula medias, persiste `MovimentacaoOpenFinance`
- Apos persistir, dispara `ReavaliarPropostaComOpenFinanceUseCase`

**Testes obrigatorios**
- `IniciarConsentimentoOpenFinanceUseCaseTest`
- `ProcessarCallbackConsentimentoUseCaseTest` (autorizado → dispara consulta; negado → marca status)
- `ConsultarMovimentacaoOpenFinanceUseCaseTest` (calculos de media corretos)

**Pre-requisitos**: Tasks 9.1, 9.2.
**Responsavel**: Dev Senior.

---

### Task 9.4 — Nova regra no motor de credito + reavaliacao

**Descricao**
Adicionar `RegraOpenFinanceMovimentacao` ao motor existente da Sprint 8 + use case `ReavaliarPropostaComOpenFinanceUseCase`.

**Arquivos esperados**
- `credito/application/service/regras/RegraOpenFinanceMovimentacao.java`
- update `MotorRegrasCredito` para receber a nova regra via DI (sem mudancas no contrato)
- `credito/application/usecase/ReavaliarPropostaComOpenFinanceUseCase.java`

**Comportamento da regra**
- Se nao houver `MovimentacaoOpenFinance` para a proposta → `PENDENTE` (sem impacto no score)
- Se media_entradas_mensal >= 3x valor_solicitado / prazo_meses → `PASSOU` (+200 pontos)
- Se media_entradas_mensal >= 1x valor_solicitado / prazo_meses → `PASSOU` parcial (+100 pontos)
- Caso contrario → `FALHOU` (-50 pontos)
- Saldo medio negativo (cheque especial recorrente) → `FALHOU` (alerta forte)

**Reavaliacao**
- `ReavaliarPropostaComOpenFinanceUseCase` re-executa motor com dados Open Finance + recalcula `ScoreInterno`
- Se score subir e cruzar threshold de `PRE_APROVADA` → atualiza status (motor pode mudar sugestao)
- Auditoria captura comparativo: score antes vs depois

**Testes obrigatorios**
- `RegraOpenFinanceMovimentacaoTest` (todos os cenarios)
- `ReavaliarPropostaComOpenFinanceUseCaseTest`

**Pre-requisitos**: Tasks 9.1, 9.3.
**Responsavel**: Dev Senior.

---

### Task 9.5 — Webhook Open Finance

**Descricao**
Endpoint que recebe os dois tipos de callback Celcoin Open Finance: autorizacao do consentimento e payload de movimentacao.

**Arquivos esperados**
- `credito/web/controller/CelcoinOpenFinanceWebhookController.java` — `POST /api/v1/webhooks/celcoin/open-finance`
- `credito/web/dto/CelcoinOpenFinanceCallback.java` (carrega `tipo` para discriminar autorizacao vs movimentacao)

**Regras**
- Idempotencia (`Idempotency-Key`)
- HMAC validation (mesmo padrao da Sprint 6)
- Outbox para reprocessamento
- Discrimina `tipo` do callback e roteia para `ProcessarCallbackConsentimentoUseCase` ou diretamente para `ConsultarMovimentacaoOpenFinanceUseCase`

**Testes obrigatorios**
- `CelcoinOpenFinanceWebhookControllerTest`

**Pre-requisitos**: Tasks 9.3, 9.4.
**Responsavel**: Dev Senior.

---

### Task 9.6 — Endpoints REST + DTOs

**Descricao**
Expor os 2 endpoints REST de Open Finance.

**Arquivos esperados**
- update `CreditoController` ou novo `OpenFinanceController` em `credito/web/controller/`
- DTOs em `credito/web/dto/`: `IniciarConsentimentoResponse`, `OpenFinanceStatusResponse`

**Endpoints**
- `POST /api/v1/credito/propostas/{id}/open-finance/consentimento` — gera URL; ownership obrigatorio
- `GET /api/v1/credito/propostas/{id}/open-finance` — status + dados consolidados; ownership ou `ROLE_FINANCEIRO`

**Testes obrigatorios**
- `OpenFinanceControllerTest`

**Pre-requisitos**: Tasks 9.3, 9.4, 9.5.
**Responsavel**: Dev Senior.

---

### Task 9.7 — Auditoria reforcada Open Finance

**Descricao**
Adicionar tipos e listener.

**Arquivos esperados**
- update enum `AuditLogSegurancaTipo`: `OPEN_FINANCE_CONSENTIMENTO_INICIADO`, `OPEN_FINANCE_AUTORIZADO`, `OPEN_FINANCE_NEGADO`, `OPEN_FINANCE_DADOS_RECEBIDOS`, `OPEN_FINANCE_REAVALIACAO`
- update `CreditoAuditListener` (Sprint 8) para os novos eventos

**Pre-requisitos**: Tasks 9.3, 9.5.
**Responsavel**: Dev Senior.

---

### Task 9.8 — Testes de integracao end-to-end

**Cenarios obrigatorios**
- Tomador inicia consentimento → URL retornada → callback de autorizacao chega → dados Open Finance recebidos → reavaliacao automatica → score sobe → `PRE_APROVADA`
- Tomador inicia consentimento → callback de negacao → status `NEGADO` → score nao muda
- Webhook com HMAC invalido → 401
- Webhook idempotente
- Tomador A tenta iniciar consentimento na proposta de B → 403
- Reavaliacao automatica nao executa em proposta ja `APROVADA` ou `REJEITADA`

**Arquivos esperados**
- `credito/web/OpenFinanceIT.java`

**Pre-requisitos**: Tasks 9.1-9.7.
**Responsavel**: Dev Senior.

---

### Task 9.9 — Documentacao

**Arquivos esperados**
- update `docs-sep/PRD.md` §22 Sprint 9 — marcar como executada (apos merge)
- update `docs-sep/CREDITO.md` — adicionar secao Open Finance (fluxo de consentimento, regra, reavaliacao)
- update Swagger UI

**Pre-requisitos**: Tasks 9.1-9.8.
**Responsavel**: Dev Senior.

---

## Grafo de dependencias entre as tasks

```
Sprint 8 concluida
        |
        v
Task 9.1 (entidades + migrations)
        |
        +---> Task 9.2 (OpenFinanceProvider Fake + Celcoin) -+
                                                              |
                                                              +---> Task 9.3 (use cases consentimento)
                                                                              |
                                                                              +---> Task 9.4 (nova regra + reavaliacao)
                                                                              |
                                                                              v
                                                                    Task 9.5 (webhook)
                                                                              |
                                                                              v
                                                                    Task 9.6 (endpoints REST)
                                                                              |
                                                                              v
                                                                    Task 9.7 (auditoria)
                                                                              |
                                                                              v
                                                                    Task 9.8 (testes E2E)
                                                                              |
                                                                              v
                                                                    Task 9.9 (documentacao)
```

## Definicao de pronto da Sprint 9

- `OpenFinanceProvider` com Fake + Celcoin adapters
- Ciclo de consentimento + recebimento de dados funcional
- Nova regra `RegraOpenFinanceMovimentacao` integrada ao motor (Sprint 8)
- Reavaliacao automatica funcional
- 2 endpoints REST + 1 webhook documentados
- Auditoria reforcada para todos os eventos
- Suite E2E passando
- WireMock test do `CelcoinOpenFinanceProviderIT` passando
- Cobertura JaCoCo do modulo `credito` consolidada >= 70%

## Impacto na Sprint seguinte (Sprint 10 — Formalizacao)

- Modulo `credito` finalizado: a Sprint 10 (Formalizacao) consome `PropostaCredito` com status `APROVADA` como pre-requisito para gerar contrato
- Ja existe listener `PropostaAprovadaEvent` (Sprint 8) que a Sprint 10 vai escutar para iniciar formalizacao automaticamente

## Restricoes e regras de execucao

- Open Finance e **opt-in** do tomador — consentimento explicito obrigatorio
- Dados Open Finance tem retencao limitada (LGPD) — politica documentada nesta sprint
- Provider Pattern obrigatorio
- Sem F-Sprint 9 / M-Sprint 9 — apenas backend (decisao 2026-05-04)

## Referencias

- [PRD §11](../../docs-sep/PRD.md)
- [PRD §22 (Sprint 9)](../../docs-sep/PRD.md)
- [PRD §25 (Epic 6)](../../docs-sep/PRD.md)
- [PRD §29](../../docs-sep/PRD.md)
- [ADR 0004](../../adr/0004-provider-pattern-para-integracoes-externas.md)
- [ADR 0008](../../adr/0008-wiremock-para-testes-integracao-celcoin.md)
- [Spec 008 - Sprint 8 (dependencia)](./008-sprint-8-credito-regras-parecer.md)
- [Spec 010 - Sprint 10 (proxima — Formalizacao)](./010-sprint-10-formalizacao-geracao-contrato.md)
- Open Finance Brasil: https://openfinancebrasil.org.br/
- Celcoin Finansystech: docs internas em `docs-sep/Aprendizado Celcoin e SEP/`
