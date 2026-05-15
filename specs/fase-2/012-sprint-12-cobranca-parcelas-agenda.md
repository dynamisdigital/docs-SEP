# Spec 012 - Sprint 12 - Cobranca (parcelas e agenda)

## Metadados

- **ID da Spec**: 012
- **Titulo**: Sprint 12 - Modulo `cobranca` + parcelas + agenda + recebimentos via escrow
- **Status**: aprovada para execucao (apos conclusao da Sprint 11)
- **Fase do produto**: Fase 2 — Epic 8 (parte 1)
- **Origem**: PRD §11 (Modulo cobranca + escrow), §22 (Sprint 12), §25 (Epic 8); ADRs 0001, 0005, 0007
- **Depende de**: [`011-sprint-11-formalizacao-assinatura-digital.md`](./011-sprint-11-formalizacao-assinatura-digital.md)
- **Responsavel principal**: Dev Senior

## Objetivo

Entregar a estrutura inicial de cobranca pos-formalizacao. A sprint cria o modulo `cobranca`, modela `ParcelaCobranca`, `AgendaPagamento` e `Recebimento`, gera as parcelas automaticamente quando um contrato e assinado (Sprint 11), calcula juros/multas/encargos e consome o modulo `escrow` (modelado desde Sprint 1) para registrar recebimentos na conta segregada — atendendo a obrigacao regulatoria de segregacao patrimonial CMN 4.656/2018.

A integracao com meio de pagamento real (Pix) **nao** entra aqui — fica para a Epic 15. Esta sprint cobre o ciclo: contrato assinado → agenda gerada → parcelas pendentes → recebimento manual via API → escrow atualizado. Inadimplencia e recuperacao ficam para a Sprint 13.

## Escopo

### Em escopo (apenas backend)

- Novo modulo `cobranca` em `com.dynamis.sep_api.cobranca` (DDD + Hexagonal/Ports & Adapters)
- Entidades de dominio:
  - `AgendaPagamento` (agregado raiz; 1:1 com `Contrato`)
  - `ParcelaCobranca` (entidade filha; N:1 com `AgendaPagamento`)
  - `Recebimento` (registro de pagamento de uma parcela; pode ser parcial)
- Value objects: `StatusParcela` (sealed: `PENDENTE`, `PAGA`, `PARCIALMENTE_PAGA`, `ATRASADA`, `INADIMPLENTE`), `ComposicaoValor` (record com `principal`, `juros`, `multa`, `encargos`, `total`)
- Calculadoras de financeiras:
  - `CalculadoraSAC` (Sistema de Amortizacao Constante)
  - `CalculadoraPrice` (Tabela Price)
  - `CalculadoraJurosMora` (juros de mora pos-vencimento)
  - `CalculadoraMulta` (multa pos-atraso, default 2% conforme CDC)
  - Motor selecionavel por config; default `Price` para Sprint 12
- **Consumo do modulo `escrow`** (modelado desde Sprint 1):
  - Cobranca depende de `escrow.application.port.in.RegistrarMovimentacaoEscrowUseCase` (interface publica do modulo)
  - Cada `Recebimento` gera uma `MovimentacaoEscrow` (entrada no wallet correspondente a operacao)
  - Mantem segregacao patrimonial obrigatoria (CMN 4.656/2018)
- Use cases:
  - `GerarAgendaPagamentoUseCase` (consome `ContratoAssinadoEvent` da Sprint 11; calcula parcelas + persiste agenda)
  - `RegistrarRecebimentoUseCase` (recebimento manual; cria `Recebimento` + atualiza parcela + dispara movimentacao no escrow)
  - `ConsultarParcelasUseCase` (filtros: por contrato, por status, por vencimento)
  - `CalcularValorAtualizadoParcelaUseCase` (retorna valor com juros e multa atualizados ate hoje)
  - `MarcarParcelaAtrasadaJob` (job agendado @Scheduled para detectar atrasos diariamente)
- Endpoints REST em `/api/v1/cobranca`:
  - `GET /api/v1/cobranca/contratos/{contratoId}/agenda` — lista parcelas; ownership ou `ROLE_FINANCEIRO`
  - `GET /api/v1/cobranca/parcelas/{id}` — consulta parcela com calculo atualizado
  - `POST /api/v1/cobranca/parcelas/{id}/recebimentos` — registra recebimento manual (`ROLE_FINANCEIRO`; idempotente)
  - `GET /api/v1/cobranca/recebimentos` — lista recebimentos (filtros; `ROLE_FINANCEIRO`)
- Job agendado:
  - `MarcarParcelaAtrasadaJob` (`@Scheduled(cron)`) roda diariamente as 02:00 BRT; marca parcelas vencidas como `ATRASADA`; emite `ParcelaAtrasouEvent`
- Migrations Flyway: `agenda_pagamento`, `parcela_cobranca`, `recebimento`
- Auditoria reforcada: novos tipos `AGENDA_GERADA`, `PARCELA_CRIADA`, `RECEBIMENTO_REGISTRADO`, `PARCELA_PAGA`, `PARCELA_ATRASADA`, `MOVIMENTACAO_ESCROW_CRIADA`
- Eventos de dominio: `AgendaGeradaEvent`, `RecebimentoRegistradoEvent`, `ParcelaPagaEvent`, `ParcelaAtrasouEvent` (consumidos por Sprint 13)

### Fora de escopo nesta Sprint
- Integracao com meio de pagamento real (Pix) — Epic 15
- Boletos — sprint futura
- Cobranca ativa / inadimplencia — Sprint 13
- Renegociacao — Sprint 13 (basico) e sprint futura (avancado)
- Dashboard financeiro — Sprint 14 (Backoffice)
- Telas frontend/mobile — apenas backend (decisao 2026-05-04)

## Pre-requisitos globais

- Sprint 11 concluida (modulo `contratos` completo; `ContratoAssinadoEvent` disponivel)
- Modulo `escrow` da Sprint 1 com entidades modeladas (sem `EscrowProvider` real ainda; consumo via use case interno)
- ADRs 0001, 0005 (escrow), 0007 vigentes
- Decisao operacional: recebimento na Sprint 12 e manual via API (financeiro registra apos confirmar pagamento off-band); automacao via Pix vem na Epic 15

## Tasks

### Task 12.1 — Criacao do modulo `cobranca` e entidades

**Arquivos esperados**
- `cobranca/domain/model/AgendaPagamento.java`
- `cobranca/domain/model/ParcelaCobranca.java`
- `cobranca/domain/model/Recebimento.java`
- `cobranca/domain/vo/StatusParcela.java` (sealed)
- `cobranca/domain/vo/ComposicaoValor.java` (record)
- `cobranca/domain/event/AgendaGeradaEvent.java`
- `cobranca/domain/event/RecebimentoRegistradoEvent.java`
- `cobranca/domain/event/ParcelaPagaEvent.java`
- `cobranca/domain/event/ParcelaAtrasouEvent.java`
- `cobranca/infrastructure/persistence/AgendaPagamentoRepository.java`
- `cobranca/infrastructure/persistence/ParcelaCobrancaRepository.java`
- `src/main/resources/db/migration/V<n>__criar_tabelas_cobranca.sql`

**Esquema SQL (resumo)**
```sql
CREATE TABLE agenda_pagamento (
  id UUID PRIMARY KEY,
  contrato_id UUID NOT NULL UNIQUE REFERENCES contrato(id),
  numero_parcelas INTEGER NOT NULL,
  valor_total NUMERIC(15,2) NOT NULL,
  data_geracao TIMESTAMP WITH TIME ZONE NOT NULL,
  data_criacao TIMESTAMP WITH TIME ZONE NOT NULL,
  data_modificacao TIMESTAMP WITH TIME ZONE NOT NULL,
  criado_por VARCHAR(50) NOT NULL,
  modificado_por VARCHAR(50) NOT NULL
);

CREATE TABLE parcela_cobranca (
  id UUID PRIMARY KEY,
  agenda_id UUID NOT NULL REFERENCES agenda_pagamento(id),
  numero INTEGER NOT NULL,
  valor_principal NUMERIC(15,2) NOT NULL,
  valor_juros NUMERIC(15,2) NOT NULL DEFAULT 0,
  valor_multa NUMERIC(15,2) NOT NULL DEFAULT 0,
  valor_encargos NUMERIC(15,2) NOT NULL DEFAULT 0,
  data_vencimento DATE NOT NULL,
  status VARCHAR(40) NOT NULL,
  CONSTRAINT uq_parcela_agenda_numero UNIQUE (agenda_id, numero)
);
CREATE INDEX idx_parcela_status_vencimento ON parcela_cobranca(status, data_vencimento);

CREATE TABLE recebimento (
  id UUID PRIMARY KEY,
  parcela_id UUID NOT NULL REFERENCES parcela_cobranca(id),
  valor_recebido NUMERIC(15,2) NOT NULL,
  data_recebimento TIMESTAMP WITH TIME ZONE NOT NULL,
  meio_pagamento VARCHAR(40),
  identificador_externo VARCHAR(255),
  observacao TEXT,
  registrado_por VARCHAR(50) NOT NULL
);
```

**Testes obrigatorios**
- `AgendaPagamentoTest` (transicoes), `ParcelaCobrancaTest`, `*RepositoryTest`

**Pre-requisitos**: Sprint 11 concluida.
**Responsavel**: Dev Senior.

---

### Task 12.2 — Calculadoras financeiras

**Descricao**
Implementar SAC, Price, Juros de Mora e Multa.

**Arquivos esperados**
- `cobranca/application/service/calculo/CalculadoraAmortizacao.java` (interface)
- `cobranca/application/service/calculo/CalculadoraPrice.java`
- `cobranca/application/service/calculo/CalculadoraSAC.java`
- `cobranca/application/service/calculo/CalculadoraJurosMora.java`
- `cobranca/application/service/calculo/CalculadoraMulta.java`
- `cobranca/application/service/calculo/dto/ParametrosCalculo.java`
- `cobranca/application/service/calculo/dto/ResultadoCalculo.java`

**Comportamento**
- `CalculadoraPrice`: parcelas iguais; juros decrescentes; principal crescente
- `CalculadoraSAC`: parcelas decrescentes; principal constante
- Juros de mora: 1% ao mes pro rata die (default; configuravel)
- Multa: 2% sobre valor em atraso (default CDC; configuravel)
- Encargos: nao calculado nesta sprint (zero)

**Testes obrigatorios**
- `CalculadoraPriceTest` (cenarios conhecidos com valores esperados)
- `CalculadoraSACTest`
- `CalculadoraJurosMoraTest`
- `CalculadoraMultaTest`

**Pre-requisitos**: Task 12.1.
**Responsavel**: Dev Senior.

---

### Task 12.3 — Use case `GerarAgendaPagamentoUseCase` + listener

**Arquivos esperados**
- `cobranca/application/usecase/GerarAgendaPagamentoUseCase.java`
- `cobranca/application/listener/ContratoAssinadoListener.java` — escuta `ContratoAssinadoEvent` (Sprint 11) e dispara use case

**Regras**
- Idempotencia: se ja existe `AgendaPagamento` para o contrato, nao recria
- Calcula parcelas usando calculadora Price (default Sprint 12)
- Vencimento da primeira parcela: 30 dias apos assinatura (configuravel)
- Subsequentes: a cada 30 dias
- Persiste agenda + todas as parcelas em uma transacao
- Dispara `AgendaGeradaEvent`

**Testes obrigatorios**
- `GerarAgendaPagamentoUseCaseTest` (cenarios: 12 parcelas, 24 parcelas; idempotencia)
- `ContratoAssinadoListenerTest`

**Pre-requisitos**: Tasks 12.1, 12.2.
**Responsavel**: Dev Senior.

---

### Task 12.4 — Use case `RegistrarRecebimentoUseCase` + integracao com escrow

**Descricao**
Registrar recebimento de uma parcela, atualizar status, gerar movimentacao no escrow segregado.

**Arquivos esperados**
- `cobranca/application/usecase/RegistrarRecebimentoUseCase.java`
- `cobranca/application/port/in/AnyPortFromEscrow.java` (re-import; ou referencia direta a use case do `escrow.application.usecase.RegistrarMovimentacaoEscrowUseCase`)

**Regras**
- Valor recebido pode ser igual, menor (parcial) ou maior (overpayment) que o devido atualizado
- Calcula valor atualizado da parcela na hora (juros + multa se atrasada)
- Se `valor_recebido >= valor_atualizado` → `PAGA`
- Se `0 < valor_recebido < valor_atualizado` → `PARCIALMENTE_PAGA`
- Se `valor_recebido > valor_atualizado` → registra excedente em campo `observacao`; status `PAGA` (tratamento de excedente fica para sprint futura)
- Idempotencia: header `Idempotency-Key` baseado em `parcelaId + valorRecebido + dataRecebimento`
- Dispara `MovimentacaoEscrow` no modulo `escrow` (conta segregada)
- Dispara `RecebimentoRegistradoEvent` + `ParcelaPagaEvent` (se aplicavel)

**Testes obrigatorios**
- `RegistrarRecebimentoUseCaseTest` (pagamento total, parcial, overpayment; idempotencia)
- Test de integracao com escrow (movimentacao gerada na conta certa)

**Pre-requisitos**: Tasks 12.1, 12.3.
**Responsavel**: Dev Senior.

---

### Task 12.5 — `CalcularValorAtualizadoParcelaUseCase` + Job de detecao de atraso

**Arquivos esperados**
- `cobranca/application/usecase/CalcularValorAtualizadoParcelaUseCase.java`
- `cobranca/application/job/MarcarParcelaAtrasadaJob.java` (anotada com `@Scheduled(cron)`)
- `cobranca/application/usecase/ConsultarParcelasUseCase.java`

**Regras**
- `CalcularValorAtualizadoParcelaUseCase`: para parcelas pendentes, retorna `valor_principal + juros_mora_acumulado + multa (se aplicavel)`
- `MarcarParcelaAtrasadaJob`: cron `0 0 2 * * *` (diariamente as 02:00 BRT); para cada parcela `PENDENTE` com `data_vencimento < hoje`, transiciona para `ATRASADA` e dispara `ParcelaAtrasouEvent`

**Testes obrigatorios**
- `CalcularValorAtualizadoParcelaUseCaseTest`
- `MarcarParcelaAtrasadaJobTest` (controla relogio com `Clock` injetado)

**Pre-requisitos**: Tasks 12.1, 12.2.
**Responsavel**: Dev Senior.

---

### Task 12.6 — Endpoints REST + DTOs

**Arquivos esperados**
- `cobranca/web/controller/CobrancaController.java`
- `cobranca/web/dto/AgendaPagamentoResponse.java`
- `cobranca/web/dto/ParcelaResponse.java`
- `cobranca/web/dto/RegistrarRecebimentoRequest.java` (`valorRecebido`, `dataRecebimento`, `meioPagamento`, `observacao`)
- `cobranca/web/dto/RecebimentoResponse.java`
- `cobranca/web/mapper/CobrancaWebMapper.java`

**Endpoints**
- `GET /api/v1/cobranca/contratos/{contratoId}/agenda` (ownership ou `ROLE_FINANCEIRO`)
- `GET /api/v1/cobranca/parcelas/{id}` (ownership ou `ROLE_FINANCEIRO`)
- `POST /api/v1/cobranca/parcelas/{id}/recebimentos` (`ROLE_FINANCEIRO`, idempotente)
- `GET /api/v1/cobranca/recebimentos` (`ROLE_FINANCEIRO`)

**OpenAPI** completa.

**Testes obrigatorios**
- `CobrancaControllerTest` (`@WebMvcTest`)

**Pre-requisitos**: Tasks 12.3, 12.4, 12.5.
**Responsavel**: Dev Senior.

---

### Task 12.7 — Auditoria reforcada

**Arquivos esperados**
- update enum `AuditLogSegurancaTipo`: `AGENDA_GERADA`, `PARCELA_CRIADA`, `RECEBIMENTO_REGISTRADO`, `PARCELA_PAGA`, `PARCELA_ATRASADA`, `MOVIMENTACAO_ESCROW_CRIADA`
- `cobranca/application/listener/CobrancaAuditListener.java`

**Pre-requisitos**: Tasks 12.3, 12.4, 12.5.
**Responsavel**: Dev Senior.

---

### Task 12.8 — Testes E2E

**Cenarios obrigatorios**
- Contrato assinado (Sprint 11) → listener dispara → `AgendaPagamento` criada com 12 parcelas Price
- Tomador consulta agenda → recebe lista
- Financeiro registra recebimento total → parcela `PAGA` + movimentacao no escrow
- Financeiro registra recebimento parcial → parcela `PARCIALMENTE_PAGA`
- Cliente tenta registrar recebimento → 403
- Idempotencia de recebimento (mesmo `Idempotency-Key` → mesmo resultado)
- Job de atraso roda → parcela vencida marca como `ATRASADA`
- Calculo de valor atualizado de parcela atrasada inclui juros + multa

**Arquivos esperados**
- `cobranca/web/CobrancaIT.java`

**Pre-requisitos**: Tasks 12.1-12.7.
**Responsavel**: Dev Senior.

---

### Task 12.9 — Documentacao

**Arquivos esperados**
- update `docs-sep/PRD.md` §22 Sprint 12 — marcar como executada (apos merge)
- novo `docs-SEP/repos/sep-api/COBRANCA.md` — fluxo, calculadoras, integracao com escrow, retencao
- update Swagger UI

**Pre-requisitos**: Tasks 12.1-12.8.
**Responsavel**: Dev Senior.

---

## Grafo de dependencias

```
Sprint 11 concluida
        |
        v
Task 12.1 (entidades + migrations)
        |
        +---> Task 12.2 (calculadoras) -----+
        |                                    |
        +---> Task 12.3 (gerar agenda + listener) -+
                                                    |
                                                    +---> Task 12.4 (recebimento + escrow)
                                                    +---> Task 12.5 (calculo atualizado + job atraso)
                                                                  |
                                                                  v
                                                        Task 12.6 (endpoints REST)
                                                                  |
                                                                  v
                                                        Task 12.7 (auditoria)
                                                                  |
                                                                  v
                                                        Task 12.8 (testes E2E)
                                                                  |
                                                                  v
                                                        Task 12.9 (documentacao)
```

## Definicao de pronto da Sprint 12

- Modulo `cobranca` criado com estrutura DDD
- Entidades + migrations funcionais
- Calculadoras Price + SAC + JurosMora + Multa testadas
- Geracao automatica via listener de `ContratoAssinadoEvent`
- Recebimento manual via API + integracao com escrow funcional (segregacao patrimonial atendida)
- Job de detecao de atraso operacional (cron diario)
- 4 endpoints REST documentados
- Auditoria reforcada
- Suite E2E passando
- Cobertura JaCoCo do modulo `cobranca` >= 70%
- `COBRANCA.md` publicado

## Impacto na Sprint seguinte (Sprint 13 — Inadimplencia)

- Sprint 13 escuta `ParcelaAtrasouEvent` (gerado pelo job desta sprint) para iniciar workflows de cobranca
- Sprint 13 introduz estados `EM_NEGOCIACAO` e `INADIMPLENTE`
- Sprint 13 traz `NotificationProvider` (email/SMS) — gate ADR 0013

## Restricoes e regras de execucao

- **Segregacao patrimonial e obrigatoria** — todo recebimento gera movimentacao no escrow (CMN 4.656/2018)
- Recebimento manual nesta sprint — automacao via Pix vem na Epic 15
- Sem F-Sprint 12 / M-Sprint 12 — apenas backend (decisao 2026-05-04)

## Referencias

- [PRD §11 (modulo cobranca + escrow)](../../docs-sep/PRD.md)
- [PRD §22 (Sprint 12)](../../docs-sep/PRD.md)
- [PRD §25 (Epic 8)](../../docs-sep/PRD.md)
- [PRD §29](../../docs-sep/PRD.md)
- [ADR 0005 - Segregacao patrimonial via escrow](../../adr/0005-segregacao-patrimonial-via-conta-escrow.md)
- [Spec 011 - Sprint 11 (dependencia)](./011-sprint-11-formalizacao-assinatura-digital.md)
- [Spec 013 - Sprint 13 (proxima — Inadimplencia)](./013-sprint-13-cobranca-inadimplencia.md)
- Resolucao CMN 4.656/2018 — Art. 18 (segregacao patrimonial)
- CDC Lei 8.078/1990 (multa 2%)
