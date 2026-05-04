# Spec 010 - Sprint 10 - Formalizacao (geracao de contrato)

## Metadados

- **ID da Spec**: 010
- **Titulo**: Sprint 10 - Formalizacao Contratual (modulo `contratos` + geracao de contrato + fluxo de aceite)
- **Status**: aprovada para execucao (apos conclusao da Sprint 9)
- **Fase do produto**: Fase 2 — Epic 7 (parte 1)
- **Origem**: PRD §11 (Modulo contratos), §22 (Sprint 10), §25 (Epic 7); ADRs 0001, 0007
- **Depende de**: [`009-sprint-9-credito-open-finance.md`](./009-sprint-9-credito-open-finance.md)
- **Responsavel principal**: Dev Senior

## Objetivo

Iniciar a formalizacao contratual com a criacao do modulo `contratos`. A sprint entrega a capacidade de gerar um contrato a partir de uma proposta de credito aprovada, usando templates parametrizaveis por tipo de operacao, registrar o aceite explicito do tomador e gerenciar os estados da formalizacao ate o ponto pre-assinatura.

A assinatura digital efetiva (com provider externo + CCB) fica para a Sprint 11. Esta sprint cobre apenas a etapa de geracao + aceite, deixando o contrato em estado `ACEITO` pronto para a integracao com o `AssinaturaDigitalProvider` da proxima sprint. O bloqueio de desembolso ja e aplicado: nada flui adiante sem `Contrato` em estado `ASSINADO` (que so vem na Sprint 11).

## Escopo

### Em escopo (apenas backend)

- Novo modulo `contratos` em `com.dynamis.broker_app.contratos` (DDD + Hexagonal/Ports & Adapters)
- Entidades de dominio:
  - `Contrato` (agregado raiz; estende `EntidadeAuditavel`)
  - `ClausulaContratual` (entidade filha; cada clausula tem `ordem`, `titulo`, `texto`)
  - `VersaoContrato` (historico de geracoes de um mesmo contrato; permite re-geracao se proposta for ajustada)
  - `AceiteContrato` (1:1 com versao mais recente; carrega `dataAceite`, `ipOrigem`, `userAgentOrigem`)
- Value objects: `StatusFormalizacao` (sealed: `GERADO`, `AGUARDANDO_ACEITE`, `ACEITO`, `EM_ASSINATURA`, `ASSINADO`, `CANCELADO`), `TipoContrato` (sealed: `MUTUO`, `CCB`, `OUTROS`)
- Templates de contrato:
  - `TemplateEngine` (port em `application.port.out`) — interface generica para renderizar templates
  - `JinjaTemplateEngine` ou similar (`application/usecase/template/`) — implementacao usando `org.thymeleaf` (vem com Spring) para gerar texto a partir de variaveis
  - Templates como recursos em `src/main/resources/templates/contratos/<tipo>.txt` (texto plano nesta sprint; PDF/HTML estruturado em sprint futura)
  - Variaveis: dados do tomador, valor da proposta, prazo, taxa, parcelas, data de geracao
- Use cases:
  - `GerarContratoUseCase` (consome `PropostaAprovadaEvent` ou e disparado manualmente; gera nova `VersaoContrato`)
  - `ConsultarContratoUseCase`
  - `RegistrarAceiteUseCase` (tomador aceita; valida step-up authentication; transiciona para `ACEITO`)
  - `CancelarContratoUseCase` (apenas antes do aceite; financeiro)
- Endpoints REST em `/api/v1/contratos`:
  - `GET /api/v1/contratos/proposta/{propostaId}` — consulta contrato vigente
  - `GET /api/v1/contratos/{id}` — consulta detalhada por id
  - `GET /api/v1/contratos/{id}/versoes` — lista versoes
  - `PATCH /api/v1/contratos/{id}/aceite` — registra aceite (tomador autenticado, ownership, step-up)
  - `POST /api/v1/contratos/{id}/cancelar` — cancela (financeiro apenas, com justificativa)
- Listener:
  - `PropostaAprovadaListener` em `contratos/application/listener/` — escuta evento da Sprint 8 e dispara `GerarContratoUseCase` automaticamente
- Migrations Flyway: novas tabelas `contrato`, `clausula_contratual`, `versao_contrato`, `aceite_contrato`
- Auditoria reforcada: novos tipos no `audit_log_seguranca`: `CONTRATO_GERADO`, `CONTRATO_NOVA_VERSAO`, `CONTRATO_ACEITO`, `CONTRATO_CANCELADO`
- Bloqueio de desembolso: documentado nesta sprint (cobranca da Sprint 12 nao gerara parcelas sem `Contrato` em `ASSINADO`); a Sprint 12 valida no codigo
- Retencao: contratos sao documentos legais — retencao 10 anos minimo (politica documentada)

### Fora de escopo nesta Sprint
- Assinatura digital com provider externo — Sprint 11
- Geracao de PDF estruturado / HTML rich — sprint futura (esta sprint usa texto plano)
- CCB (Cedula de Credito Bancario) — Sprint 11
- Renegociacao contratual — sprint futura (Epic 8 estendida)
- Templates por linha de produto da Empresa Credora — Epic 10
- Telas frontend/mobile — apenas backend (decisao 2026-05-04)

## Pre-requisitos globais

- Sprint 9 concluida (modulo `credito` completo, propostas podem chegar em `APROVADA`)
- Step-up authentication da Sprint 5 funcional (obrigatoria para registrar aceite)
- ADRs 0001, 0007 vigentes

## Tasks

### Task 10.1 — Criacao do modulo `contratos` e entidades

**Arquivos esperados**
- `contratos/domain/model/Contrato.java`
- `contratos/domain/model/ClausulaContratual.java`
- `contratos/domain/model/VersaoContrato.java`
- `contratos/domain/model/AceiteContrato.java`
- `contratos/domain/vo/StatusFormalizacao.java` (sealed)
- `contratos/domain/vo/TipoContrato.java` (sealed)
- `contratos/domain/event/ContratoGeradoEvent.java`
- `contratos/domain/event/ContratoAceitoEvent.java`
- `contratos/domain/event/ContratoCanceladoEvent.java`
- `contratos/infrastructure/persistence/ContratoRepository.java`
- `src/main/resources/db/migration/V<n>__criar_tabelas_contratos.sql`

**Esquema SQL (resumo)**
```sql
CREATE TABLE contrato (
  id UUID PRIMARY KEY,
  proposta_id UUID NOT NULL UNIQUE REFERENCES proposta_credito(id),
  tipo VARCHAR(40) NOT NULL,
  status VARCHAR(40) NOT NULL,
  data_criacao TIMESTAMP WITH TIME ZONE NOT NULL,
  data_modificacao TIMESTAMP WITH TIME ZONE NOT NULL,
  criado_por VARCHAR(50) NOT NULL,
  modificado_por VARCHAR(50) NOT NULL
);

CREATE TABLE versao_contrato (
  id UUID PRIMARY KEY,
  contrato_id UUID NOT NULL REFERENCES contrato(id),
  numero INTEGER NOT NULL,
  conteudo_texto TEXT NOT NULL,
  hash_sha256 VARCHAR(64) NOT NULL,
  data_geracao TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT uq_versao_contrato_numero UNIQUE (contrato_id, numero)
);

CREATE TABLE clausula_contratual (
  id UUID PRIMARY KEY,
  versao_id UUID NOT NULL REFERENCES versao_contrato(id),
  ordem INTEGER NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  texto TEXT NOT NULL,
  CONSTRAINT uq_clausula_versao_ordem UNIQUE (versao_id, ordem)
);

CREATE TABLE aceite_contrato (
  id UUID PRIMARY KEY,
  versao_id UUID NOT NULL UNIQUE REFERENCES versao_contrato(id),
  tomador_id UUID NOT NULL,
  data_aceite TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_origem VARCHAR(45),
  user_agent_origem VARCHAR(500)
);
```

**Testes obrigatorios**
- `ContratoTest` (transicoes de estado)
- `*RepositoryTest`

**Pre-requisitos**: Sprint 9 concluida.
**Responsavel**: Dev Senior.

---

### Task 10.2 — Engine de templates + templates iniciais

**Descricao**
Implementar o engine de templates usando Thymeleaf (ja disponivel via Spring Boot starters; nao adiciona dependencia nova significativa). Criar templates iniciais para `MUTUO` e `CCB` (texto base — CCB completa entra na Sprint 11).

**Arquivos esperados**
- `contratos/application/port/out/TemplateEngine.java`
- `contratos/infrastructure/template/ThymeleafTemplateEngine.java`
- `contratos/application/service/ContextoContratoBuilder.java` (monta o map de variaveis a partir de `PropostaCredito` + dados do tomador)
- `src/main/resources/templates/contratos/mutuo.txt`
- `src/main/resources/templates/contratos/ccb.txt` (esqueleto; refinado na Sprint 11)
- `src/main/resources/templates/contratos/clausulas-padrao.txt` (clausulas comuns: foro, multa, etc.)

**Variaveis padrao no contexto**
- `tomador`: nome, documento, endereco
- `valor`: valor solicitado formatado
- `prazo`: meses + numero de parcelas
- `dataGeracao`: data formatada pt-BR
- `clausulasPadrao`: lista de clausulas comuns

**Testes obrigatorios**
- `ThymeleafTemplateEngineTest` (renderizacao com variaveis)
- `ContextoContratoBuilderTest`

**Pre-requisitos**: Task 10.1.
**Responsavel**: Dev Senior.

---

### Task 10.3 — Use case `GerarContratoUseCase` + listener de proposta aprovada

**Descricao**
Implementar a geracao de contrato a partir de proposta aprovada, com versionamento.

**Arquivos esperados**
- `contratos/application/usecase/GerarContratoUseCase.java`
- `contratos/application/listener/PropostaAprovadaListener.java`

**Regras**
- Listener escuta `PropostaAprovadaEvent` (Sprint 8) e dispara use case
- Use case verifica se ja existe `Contrato` para a proposta:
  - Se nao existe: cria `Contrato` em `GERADO` + nova `VersaoContrato` (numero 1) + `ClausulaContratual` extraidas do template
  - Se existe e esta em `GERADO` ou `AGUARDANDO_ACEITE`: cria nova `VersaoContrato` (numero+1); estado volta para `AGUARDANDO_ACEITE`; auditoria captura "regenerado"
  - Se existe e esta em `ACEITO`/`EM_ASSINATURA`/`ASSINADO`: rejeita; nao se regenera contrato ja aceito
- `hash_sha256` calculado sobre o texto final da versao para evitar adulteracao detectavel
- Move automaticamente para `AGUARDANDO_ACEITE` apos primeira geracao

**Testes obrigatorios**
- `GerarContratoUseCaseTest` (criacao OK; regeneracao OK; rejeicao em ACEITO/SIGNED)
- `PropostaAprovadaListenerTest` (recebe evento e dispara use case)

**Pre-requisitos**: Tasks 10.1, 10.2.
**Responsavel**: Dev Senior.

---

### Task 10.4 — Use case `RegistrarAceiteUseCase`

**Descricao**
Implementar o aceite explicito do tomador, com captura de evidencia (ip + user agent + step-up).

**Arquivos esperados**
- `contratos/application/usecase/RegistrarAceiteUseCase.java`

**Regras**
- Exige step-up authentication (annotation `@RequireStepUp` da Sprint 5)
- Captura `ipOrigem` e `userAgentOrigem` a partir do `HttpServletRequest`
- Apenas o proprio tomador pode aceitar (ownership)
- Aceite e sobre uma versao especifica; se houver `VersaoContrato` mais recente, exige re-aceite
- Apos aceite, transiciona para `ACEITO` e dispara `ContratoAceitoEvent`
- Se contrato ja em `ACEITO`/`EM_ASSINATURA`/`ASSINADO`: 409 Conflict

**Testes obrigatorios**
- `RegistrarAceiteUseCaseTest` (sucesso; sem step-up → 403; ja aceito → 409; tomador errado → 403)

**Pre-requisitos**: Tasks 10.1, 10.3.
**Responsavel**: Dev Senior.

---

### Task 10.5 — Use case `CancelarContratoUseCase`

**Descricao**
Permitir cancelamento de contrato pelo financeiro antes do aceite.

**Arquivos esperados**
- `contratos/application/usecase/CancelarContratoUseCase.java`

**Regras**
- Apenas `ROLE_FINANCEIRO` ou `ROLE_ADMIN`
- Step-up obrigatorio
- Justificativa obrigatoria
- Apenas em estados `GERADO` ou `AGUARDANDO_ACEITE`; demais estados → 409
- Transiciona para `CANCELADO` e dispara `ContratoCanceladoEvent`

**Testes obrigatorios**
- `CancelarContratoUseCaseTest`

**Pre-requisitos**: Task 10.1.
**Responsavel**: Dev Senior.

---

### Task 10.6 — Endpoints REST + DTOs

**Arquivos esperados**
- `contratos/web/controller/ContratoController.java`
- `contratos/web/dto/ContratoResponse.java`
- `contratos/web/dto/VersaoContratoResponse.java`
- `contratos/web/dto/RegistrarAceiteRequest.java` (vazio; aceite por verbo HTTP)
- `contratos/web/dto/CancelarContratoRequest.java` (`justificativa`)
- `contratos/web/mapper/ContratoWebMapper.java`

**Endpoints**
- `GET /api/v1/contratos/proposta/{propostaId}` — ownership ou `ROLE_FINANCEIRO`
- `GET /api/v1/contratos/{id}` — ownership ou `ROLE_FINANCEIRO`
- `GET /api/v1/contratos/{id}/versoes` — ownership ou `ROLE_FINANCEIRO`
- `PATCH /api/v1/contratos/{id}/aceite` — tomador (ownership) + step-up
- `POST /api/v1/contratos/{id}/cancelar` — `ROLE_FINANCEIRO` + step-up

**OpenAPI** completa.

**Testes obrigatorios**
- `ContratoControllerTest` (`@WebMvcTest`)

**Pre-requisitos**: Tasks 10.3, 10.4, 10.5.
**Responsavel**: Dev Senior.

---

### Task 10.7 — Auditoria reforcada

**Arquivos esperados**
- update enum `AuditLogSegurancaTipo`: `CONTRATO_GERADO`, `CONTRATO_NOVA_VERSAO`, `CONTRATO_ACEITO`, `CONTRATO_CANCELADO`
- `contratos/application/listener/ContratoAuditListener.java`

**Regras**
- `CONTRATO_ACEITO` grava: hash da versao aceita, ip, user agent, tomador (alem da auditoria padrao)
- `CONTRATO_CANCELADO` grava: justificativa + financeiro responsavel

**Testes obrigatorios**
- `ContratoAuditListenerTest`

**Pre-requisitos**: Tasks 10.3, 10.4, 10.5.
**Responsavel**: Dev Senior.

---

### Task 10.8 — Testes E2E

**Cenarios obrigatorios**
- Proposta aprovada (Sprint 8) dispara geracao automatica → `Contrato` criado em `AGUARDANDO_ACEITE`
- Tomador consulta → recebe versao mais recente
- Tomador aceita com step-up → `ACEITO` + auditoria com ip/user-agent
- Tomador tenta aceitar sem step-up → 403
- Outro tomador tenta aceitar → 403
- Financeiro cancela em `AGUARDANDO_ACEITE` → `CANCELADO`
- Financeiro tenta cancelar em `ACEITO` → 409
- Geracao com proposta ainda nao aprovada → erro
- Re-geracao em `AGUARDANDO_ACEITE` → nova versao + estado volta para `AGUARDANDO_ACEITE`

**Arquivos esperados**
- `contratos/web/ContratoIT.java`

**Pre-requisitos**: Tasks 10.1-10.7.
**Responsavel**: Dev Senior.

---

### Task 10.9 — Documentacao

**Arquivos esperados**
- update `docs-sep/PRD.md` §22 Sprint 10 — marcar como executada (apos merge)
- novo `docs-sep/CONTRATOS.md` — fluxo, estados, templates, retencao
- update Swagger UI

**Pre-requisitos**: Tasks 10.1-10.8.
**Responsavel**: Dev Senior.

---

## Grafo de dependencias

```
Sprint 9 concluida
        |
        v
Task 10.1 (entidades + migrations)
        |
        +---> Task 10.2 (template engine + templates iniciais) -+
                                                                 |
                                                                 +---> Task 10.3 (gerar + listener)
                                                                              |
                                                                              +---> Task 10.4 (aceite)
                                                                              +---> Task 10.5 (cancelar)
                                                                                          |
                                                                                          v
                                                                                Task 10.6 (endpoints REST)
                                                                                          |
                                                                                          v
                                                                                Task 10.7 (auditoria)
                                                                                          |
                                                                                          v
                                                                                Task 10.8 (testes E2E)
                                                                                          |
                                                                                          v
                                                                                Task 10.9 (documentacao)
```

## Definicao de pronto da Sprint 10

- Modulo `contratos` criado com estrutura DDD
- Entidades + migrations funcionais
- Template engine Thymeleaf operacional + templates `MUTUO` e `CCB` (esqueleto)
- Geracao automatica via listener de `PropostaAprovadaEvent`
- Versionamento de contrato funcional (re-geracao mantem historico)
- Aceite com step-up + captura de ip/user-agent
- Cancelamento por financeiro funcional
- 5 endpoints REST documentados
- Auditoria reforcada
- Suite E2E passando
- Cobertura JaCoCo do modulo `contratos` >= 70%
- `CONTRATOS.md` publicado

## Impacto na Sprint seguinte (Sprint 11 — Assinatura Digital + CCB)

- Sprint 11 transiciona contratos `ACEITO` → `EM_ASSINATURA` → `ASSINADO`
- Sprint 11 adiciona `AssinaturaDigitalProvider` + ADR 0012 (escolha do provedor)
- Sprint 11 enriquece template CCB (Cedula de Credito Bancario completa)

## Restricoes e regras de execucao

- **Contratos sao documentos legais** — retencao 10 anos minimo
- **Hash da versao aceita e prova** — qualquer alteracao detectavel via comparacao
- Sem F-Sprint 10 / M-Sprint 10 — apenas backend (decisao 2026-05-04)

## Referencias

- [PRD §11](../../docs-sep/PRD.md)
- [PRD §22 (Sprint 10)](../../docs-sep/PRD.md)
- [PRD §25 (Epic 7)](../../docs-sep/PRD.md)
- [PRD §29](../../docs-sep/PRD.md)
- [ADR 0001](../../adr/0001-monolito-modular-orientado-a-ddd.md)
- [ADR 0007](../../adr/0007-ddd-com-hexagonal-ports-and-adapters-por-modulo.md)
- [Spec 005 - Sprint 5 (step-up, dependencia)](./005-sprint-5-endurecimento-seguranca.md)
- [Spec 008 - Sprint 8 (PropostaAprovadaEvent, dependencia)](./008-sprint-8-credito-regras-parecer.md)
- [Spec 011 - Sprint 11 (proxima — Assinatura Digital + CCB)](./011-sprint-11-formalizacao-assinatura-digital.md)
- Resolucao CMN 4.656/2018 — Art. 11 (formalizacao)
