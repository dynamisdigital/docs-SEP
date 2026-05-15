# Spec 008 - Sprint 8 - Credito (regras internas + parecer)

## Metadados

- **ID da Spec**: 008
- **Titulo**: Sprint 8 - Analise de Credito interna (modulo `credito` + motor de regras + parecer manual)
- **Status**: aprovada para execucao (apos conclusao da Sprint 7)
- **Fase do produto**: Fase 2 — Epic 6 (parte 1)
- **Origem**: PRD §11 (Modulo credito), §22 (Sprint 8), §25 (Epic 6); ADRs 0001, 0007
- **Depende de**: [`007-sprint-7-onboarding-kyb-empresa.md`](./007-sprint-7-onboarding-kyb-empresa.md)
- **Responsavel principal**: Dev Senior

## Objetivo

Entregar o nucleo da analise de credito interno do produto SEP. Implementa o modulo `credito` com modelagem da `PropostaCredito`, motor de regras simples baseado em heuristicas declarativas (sem ML), score interno e esteira de aprovacao manual via parecer do time interno (consumida pelo backoffice na Sprint 14).

A sprint **nao** integra Open Finance ainda — fica para a Sprint 9. O motor de regras nesta sprint usa apenas dados disponiveis localmente: resultado do onboarding (Sprint 6/7), valor solicitado e prazo. O resultado entregue e uma `DecisaoCredito` com status `APROVADA`, `REJEITADA` ou `PENDENCIA`, que servira de pre-requisito para a formalizacao (Sprint 10).

## Escopo

### Em escopo (apenas backend)

- Novo modulo `credito` em `com.dynamis.sep_api.credito` (DDD + Hexagonal/Ports & Adapters)
- Entidades de dominio:
  - `PropostaCredito` (agregado raiz; estende `EntidadeAuditavel`)
  - `ParecerCredito` (entidade filha; pode haver multiplos pareceres ao longo do ciclo, com versao)
  - `ScoreInterno` (1:1 com `PropostaCredito`; calculado pelo motor de regras)
  - `DecisaoCredito` (1:1 com `PropostaCredito`; resultado final apos parecer)
  - `RegraCredito` (entidade que persiste a regra avaliada; util para auditoria de "por que aprovou/rejeitou")
- Value objects: `StatusProposta` (sealed: `EM_ANALISE`, `PRE_APROVADA`, `APROVADA`, `REJEITADA`, `PENDENCIA`), `TipoOperacao` (sealed: `CAPITAL_GIRO`, `OUTROS`), `Money` (record com valor + moeda BRL)
- Motor de regras simples (heuristicas declarativas):
  - Implementacao Java pura (sem DSL externa nesta sprint; ADR 0011 sera proposto na Sprint 8 para revisar se vale migrar para Drools/JEXL no futuro)
  - Regras avaliam: idade da pessoa, tempo de existencia da empresa, valor solicitado vs limite por perfil, prazo solicitado vs limite, status do onboarding (`APROVADO_FINAL` obrigatorio)
  - Cada regra retorna `RegraResultado` (`PASSOU`, `FALHOU`, `PENDENTE`) com motivo textual
  - Motor agrega resultados em `ScoreInterno` (0-1000) + `StatusProposta` inicial (`PRE_APROVADA` se score >= 700; `EM_ANALISE` caso contrario; `REJEITADA` automatica se onboarding nao `APROVADO_FINAL`)
- Esteira de parecer manual:
  - Operador interno (`ROLE_FINANCEIRO` — nova role nesta sprint, via Sprint 5 password policy + canalizacao) adiciona `ParecerCredito` com decisao final
  - Decisao manual sobrepoe a sugestao automatica do motor; auditoria captura ambos
  - Estados validos de transicao gerenciados pelo agregado
- Use cases:
  - `CriarPropostaCreditoUseCase` (valida pre-requisitos: onboarding `APROVADO_FINAL`)
  - `AvaliarPropostaUseCase` (executa motor de regras; gera `ScoreInterno`)
  - `RegistrarParecerUseCase` (operador interno adiciona parecer + decisao)
  - `ConsultarPropostaUseCase`
  - `ListarPropostasPendentesUseCase` (para dashboard do backoffice na Sprint 14)
- Endpoints REST em `/api/v1/credito`:
  - `POST /api/v1/credito/propostas` — cria proposta (cliente autenticado)
  - `GET /api/v1/credito/propostas/{id}` — consulta proposta (ownership ou `ROLE_FINANCEIRO`)
  - `GET /api/v1/credito/propostas` — lista propostas (filtros: `status`, `tomadorId`); ownership ou `ROLE_FINANCEIRO`
  - `POST /api/v1/credito/propostas/{id}/parecer` — registra parecer manual (`ROLE_FINANCEIRO` apenas)
  - `GET /api/v1/credito/propostas/{id}/regras` — lista regras avaliadas + resultado (auditoria; `ROLE_FINANCEIRO` apenas)
- Migrations Flyway: novas tabelas `proposta_credito`, `parecer_credito`, `score_interno`, `decisao_credito`, `regra_credito_avaliada`
- Auditoria reforcada: novos tipos no `audit_log_seguranca` (Sprint 5): `PROPOSTA_CRIADA`, `PROPOSTA_AVALIADA_MOTOR`, `PARECER_REGISTRADO`, `PROPOSTA_APROVADA`, `PROPOSTA_REJEITADA`
- Bloqueio de desembolso: `Contrato` (Sprint 10) so pode ser gerado a partir de `PropostaCredito` com status `APROVADA`
- Eventos de dominio: `PropostaAprovadaEvent`, `PropostaRejeitadaEvent` (futuros listeners de Sprints 10+)
- Nova role `ROLE_FINANCEIRO`:
  - Migration que adiciona o role como valor valido em `Usuario.role`
  - Endpoint admin para promover usuarios a `FINANCEIRO` (`POST /api/v1/usuarios/{id}/role` — apenas `ROLE_ADMIN`)
  - Step-up authentication (Sprint 5) obrigatoria para registrar parecer

### Fora de escopo nesta Sprint
- Integracao Open Finance — Sprint 9
- Calculo de juros, taxas, IOF — entra na Sprint 10 (Formalizacao) ou Sprint 12 (Cobranca)
- Limite dinamico por perfil — apenas heuristicas estaticas nesta sprint
- ML / score externo — fora do escopo do produto
- Telas frontend/mobile — apenas backend na Fase 2 (decisao 2026-05-04)
- ADR 0011 final sobre motor de regras vs DSL externa — proposto durante a sprint, decisao registrada antes do fim

## Pre-requisitos globais

- Sprint 7 concluida (KYC + KYB + PLD funcionais; modulo `onboarding` completo)
- Onboarding `APROVADO_FINAL` disponivel como pre-requisito de criacao de proposta
- Step-up authentication da Sprint 5 funcional (obrigatorio para registrar parecer)
- Decisao operacional: ja temos um operador `FINANCEIRO` cadastrado para validar manualmente as primeiras propostas

## Tasks

### Task 8.1 — Criacao do modulo `credito` e entidades

**Descricao**
Criar a estrutura DDD do modulo + entidades + migrations.

**Arquivos esperados**
- `credito/domain/model/PropostaCredito.java` (agregado raiz)
- `credito/domain/model/ParecerCredito.java`
- `credito/domain/model/ScoreInterno.java`
- `credito/domain/model/DecisaoCredito.java`
- `credito/domain/model/RegraCreditoAvaliada.java`
- `credito/domain/vo/StatusProposta.java` (sealed)
- `credito/domain/vo/TipoOperacao.java` (sealed)
- `credito/domain/vo/Money.java` (record)
- `credito/domain/event/PropostaAprovadaEvent.java`
- `credito/domain/event/PropostaRejeitadaEvent.java`
- `credito/domain/exception/PropostaInvalidaException.java`
- `credito/infrastructure/persistence/PropostaCreditoRepository.java`
- `src/main/resources/db/migration/V<n>__criar_tabelas_credito.sql`

**Esquema SQL (resumo)**
```sql
CREATE TABLE proposta_credito (
  id UUID PRIMARY KEY,
  tomador_id UUID NOT NULL REFERENCES usuario(id),
  solicitacao_onboarding_id UUID NOT NULL REFERENCES solicitacao_onboarding(id),
  tipo_operacao VARCHAR(40) NOT NULL,
  valor_solicitado NUMERIC(15,2) NOT NULL,
  prazo_meses INTEGER NOT NULL,
  status VARCHAR(40) NOT NULL,
  data_criacao TIMESTAMP WITH TIME ZONE NOT NULL,
  data_modificacao TIMESTAMP WITH TIME ZONE NOT NULL,
  criado_por VARCHAR(50) NOT NULL,
  modificado_por VARCHAR(50) NOT NULL
);
CREATE INDEX idx_proposta_status ON proposta_credito(status);
CREATE INDEX idx_proposta_tomador ON proposta_credito(tomador_id);
```

**Testes obrigatorios**
- `PropostaCreditoTest` (transicoes de estado validas/invalidas)
- `PropostaCreditoRepositoryTest` (`@DataJpaTest` + Testcontainers)

**Pre-requisitos**: Sprint 7 concluida.
**Responsavel**: Dev Senior.

---

### Task 8.2 — Motor de regras de credito

**Descricao**
Implementar o motor de regras como conjunto de classes Java avaliando heuristicas declarativas. Cada regra implementa `RegraCredito` com metodo `avaliar(PropostaCredito)`.

**Arquivos esperados**
- `credito/application/service/MotorRegrasCredito.java` (orquestrador; recebe lista de regras via DI e agrega resultados)
- `credito/application/service/RegraCredito.java` (interface)
- `credito/application/service/regras/RegraOnboardingAprovado.java` (proposta exige `APROVADO_FINAL`)
- `credito/application/service/regras/RegraIdadeMinimaPessoa.java` (>= 18 anos)
- `credito/application/service/regras/RegraTempoExistenciaEmpresa.java` (>= 6 meses)
- `credito/application/service/regras/RegraValorMaximo.java` (limite de R$ 50k para PF, R$ 200k para PJ na Sprint 8 — configuravel)
- `credito/application/service/regras/RegraPrazoMaximo.java` (12 meses para PF, 24 meses para PJ)
- `credito/application/service/dto/RegraResultado.java` (record com `nome`, `status`, `motivo`)

**Comportamento**
- Cada regra retorna `RegraResultado` com `PASSOU`, `FALHOU` ou `PENDENTE`
- Motor calcula `ScoreInterno` (1000 - (50 × num_falhas) - (20 × num_pendentes); minimo 0)
- Motor sugere `StatusProposta` inicial:
  - Qualquer `RegraOnboardingAprovado` `FALHOU` → `REJEITADA` (bloqueante absoluto)
  - Score >= 700 → `PRE_APROVADA`
  - Score >= 400 → `EM_ANALISE`
  - Score < 400 → `REJEITADA`
- Configuracao de pesos e thresholds via `application.yml` (`app.credito.motor.*`) — facil ajuste sem mudanca de codigo

**Testes obrigatorios**
- `MotorRegrasCreditoTest` (cenarios: todas regras passam → score 1000; algumas falham → score reduzido; onboarding nao aprovado → REJEITADA imediata)
- Testes individuais de cada regra (`RegraOnboardingAprovadoTest`, etc.)

**Pre-requisitos**: Task 8.1.
**Responsavel**: Dev Senior.

---

### Task 8.3 — Use cases de proposta e avaliacao

**Descricao**
Implementar os use cases de criacao + avaliacao + consulta + listagem.

**Arquivos esperados**
- `credito/application/usecase/CriarPropostaCreditoUseCase.java`
- `credito/application/usecase/AvaliarPropostaUseCase.java` (executa motor; persiste `ScoreInterno` + lista de `RegraCreditoAvaliada`)
- `credito/application/usecase/ConsultarPropostaUseCase.java`
- `credito/application/usecase/ListarPropostasPendentesUseCase.java` (filtros: `status`, `tomadorId`, paginacao)

**Regras de negocio**
- `CriarPropostaCreditoUseCase` valida que existe `SolicitacaoOnboarding` com status `APROVADO_FINAL` para o tomador; senao 422
- Apos criar, dispara `AvaliarPropostaUseCase` automaticamente (event-driven via Spring `ApplicationEvent`)
- Listagem de pendentes apenas para `ROLE_FINANCEIRO` ou `ROLE_ADMIN`

**Testes obrigatorios**
- `CriarPropostaCreditoUseCaseTest` (sucesso; rejeitado se onboarding pendente)
- `AvaliarPropostaUseCaseTest` (mocka motor; valida persistencia)

**Pre-requisitos**: Tasks 8.1, 8.2.
**Responsavel**: Dev Senior.

---

### Task 8.4 — Use case `RegistrarParecerUseCase` + nova role `ROLE_FINANCEIRO`

**Descricao**
Adicionar a role `ROLE_FINANCEIRO` no sistema e implementar o use case de parecer manual com step-up authentication (Sprint 5).

**Arquivos esperados**
- update enum/sealed type de roles em `identity/domain/vo/Role.java`: novo valor `FINANCEIRO`
- `src/main/resources/db/migration/V<n>__adicionar_role_financeiro.sql` (apenas alteracao de check constraint)
- `credito/application/usecase/RegistrarParecerUseCase.java`
- `identity/application/usecase/PromoverUsuarioRoleUseCase.java` (apenas ADMIN; alteracoes de role auditadas)
- `identity/web/controller/UsuariosController.java` ganha `POST /api/v1/usuarios/{id}/role`

**Regras**
- `RegistrarParecerUseCase` exige step-up token valido (annotation `@RequireStepUp` da Sprint 5)
- Parecer carrega `decisao` (`APROVAR`, `REJEITAR`, `PENDENCIA`) + `justificativa` obrigatoria
- Decisao manual sobrepoe sugestao do motor; auditoria captura ambos
- Apos `APROVAR`, dispara `PropostaAprovadaEvent`; apos `REJEITAR`, dispara `PropostaRejeitadaEvent`
- Promocao a `ROLE_FINANCEIRO` apenas por ADMIN; gravado em `audit_log_seguranca` como `ROLE_ALTERADO`

**Testes obrigatorios**
- `RegistrarParecerUseCaseTest` (sem step-up → 403; com step-up + role FINANCEIRO → OK; sem role → 403)
- `PromoverUsuarioRoleUseCaseTest`

**Pre-requisitos**: Tasks 8.1, 8.2, 8.3.
**Responsavel**: Dev Senior.

---

### Task 8.5 — Endpoints REST + DTOs

**Descricao**
Expor os 5 endpoints do modulo, seguindo o padrao do projeto.

**Arquivos esperados**
- `credito/web/controller/CreditoController.java`
- `credito/web/dto/CriarPropostaRequest.java` (record: `solicitacaoOnboardingId`, `tipoOperacao`, `valorSolicitado`, `prazoMeses`)
- `credito/web/dto/PropostaResponse.java` (record com proposta + score + parecer mais recente)
- `credito/web/dto/RegistrarParecerRequest.java` (record: `decisao`, `justificativa`)
- `credito/web/dto/RegraAvaliadaResponse.java`
- `credito/web/mapper/CreditoWebMapper.java` (MapStruct)

**OpenAPI**
- Documentacao Springdoc completa
- Reusa `ErrorResponseDto`

**Testes obrigatorios**
- `CreditoControllerTest` (`@WebMvcTest` cobrindo todos endpoints, ownership, roles, step-up)

**Pre-requisitos**: Tasks 8.3, 8.4.
**Responsavel**: Dev Senior.

---

### Task 8.6 — Auditoria reforcada de credito

**Descricao**
Adicionar tipos de eventos no `audit_log_seguranca` (Sprint 5) e listener no modulo `credito`.

**Arquivos esperados**
- update sealed enum `AuditLogSegurancaTipo`: `PROPOSTA_CRIADA`, `PROPOSTA_AVALIADA_MOTOR`, `PARECER_REGISTRADO`, `PROPOSTA_APROVADA`, `PROPOSTA_REJEITADA`, `ROLE_ALTERADO`
- `credito/application/listener/CreditoAuditListener.java`

**Regras**
- `PARECER_REGISTRADO` grava: parecerista, decisao, justificativa, score do motor (para comparar com decisao manual)
- `PROPOSTA_APROVADA` e gatilho para sprints futuras (Sprint 10 escuta para iniciar formalizacao)

**Testes obrigatorios**
- `CreditoAuditListenerTest`

**Pre-requisitos**: Tasks 8.3, 8.4.
**Responsavel**: Dev Senior.

---

### Task 8.7 — ADR 0011 — Motor de regras de credito

**Descricao**
Documentar a decisao de manter o motor de regras como classes Java puras nesta sprint (vs DSL/Drools). Avaliar trade-offs e definir gatilho para revisitar a decisao no futuro.

**Arquivos esperados**
- `adr/0011-motor-de-regras-de-credito-interno.md`

**Conteudo**
- Contexto: necessidade de avaliar propostas com regras de negocio mutaveis
- Alternativas avaliadas: (a) classes Java puras com config externa em yaml, (b) DSL com Drools, (c) JEXL/MVEL, (d) servico externo
- Decisao: opcao (a) para Sprint 8 — simplicidade, sem nova dependencia, regras inicialmente estaveis
- Consequencias: facilita evolucao incremental; quando o numero de regras crescer (>20) ou produto comecar a ter campanhas com regras dinamicas, revisitar (b) ou (c)
- Gatilho de revisao: apos a Epic 10 (Empresa Credora) entrar — pode trazer regras de credito dinamicas por linha de produto

**Pre-requisitos**: Task 8.2 (decisao formada com base na implementacao).
**Responsavel**: Dev Senior.

---

### Task 8.8 — Testes de integracao end-to-end

**Descricao**
Suite cobrindo o ciclo completo de proposta + avaliacao + parecer.

**Cenarios obrigatorios**
- Tomador com onboarding `APROVADO_FINAL` cria proposta → motor avalia → score >= 700 → `PRE_APROVADA`; financeiro registra parecer `APROVAR` → `APROVADA`
- Tomador sem onboarding aprovado tenta criar proposta → 422
- Proposta com valor acima do limite → motor reduz score → `EM_ANALISE`; financeiro registra parecer `REJEITAR` → `REJEITADA`
- Cliente tenta listar propostas pendentes (rota financeiro) → 403
- Financeiro tenta registrar parecer sem step-up → 403
- Step-up valido + parecer registrado → 200; auditoria gravada
- Promocao a `ROLE_FINANCEIRO` por ADMIN → OK
- Promocao a role por nao-admin → 403

**Arquivos esperados**
- `credito/web/CreditoIT.java`

**Pre-requisitos**: Tasks 8.1-8.6.
**Responsavel**: Dev Senior.

---

### Task 8.9 — Documentacao + atualizacao do PRD

**Descricao**
Atualizar artefatos da Sprint 8.

**Arquivos esperados**
- update `docs-sep/PRD.md` §22 Sprint 8 — marcar como executada (apos merge)
- novo `docs-SEP/repos/sep-api/CREDITO.md` — visao consolidada do modulo credito (regras, motor, parecer, fluxo)
- update Swagger UI

**Pre-requisitos**: Tasks 8.1-8.8.
**Responsavel**: Dev Senior.

---

## Grafo de dependencias entre as tasks

```
Sprint 7 concluida
        |
        v
Task 8.1 (entidades + migrations)
        |
        +---> Task 8.2 (motor de regras) ---+
        |                                    |
        +---> Task 8.3 (use cases proposta + avaliacao) ---+
                                                            |
                                                            +---> Task 8.4 (parecer + role FINANCEIRO)
                                                            |
                                                            v
                                                  Task 8.5 (endpoints REST)
                                                            |
                                                            v
                                                  Task 8.6 (auditoria)
                                                            |
                                                            +---> Task 8.7 (ADR 0011)
                                                            |
                                                            v
                                                  Task 8.8 (testes E2E)
                                                            |
                                                            v
                                                  Task 8.9 (documentacao)
```

## Definicao de pronto da Sprint 8

- Modulo `credito` criado com estrutura DDD + Hexagonal
- Entidades + migrations Flyway funcionais
- Motor de regras com 5 regras iniciais (Onboarding, Idade, Tempo Empresa, Valor, Prazo) operacional + configuravel via yaml
- Esteira de parecer manual com role `ROLE_FINANCEIRO` + step-up funcional
- 5 endpoints REST documentados
- Auditoria reforcada gravando todos os eventos de credito
- ADR 0011 publicado e aceito
- Suite E2E passando
- Cobertura JaCoCo do modulo `credito` >= 70%
- `CREDITO.md` publicado em `docs-SEP/repos/sep-api/`

## Impacto na Sprint seguinte (Sprint 9 — Open Finance)

- Modulo `credito` consumira `OpenFinanceProvider` (criado na Sprint 9) para enriquecer o `ScoreInterno`
- Motor de regras ganha nova regra `RegraOpenFinanceMovimentacao` na Sprint 9
- A esteira manual permanece — Open Finance e enriquecimento, nao substitui parecer

## Restricoes e regras de execucao

- **Decisao de credito e operacao regulada** — toda alteracao em motor/regras gera auditoria reforcada
- Motor de regras nao pode rodar sem auditoria — se `audit_log_seguranca` estiver indisponivel, motor retorna `PENDENCIA` com motivo "auditoria indisponivel"
- Sem F-Sprint 8 / M-Sprint 8 — apenas backend (decisao 2026-05-04)

## Referencias

- [PRD §11 (Modulo credito + Provider Pattern)](../../docs-sep/PRD.md)
- [PRD §22 (Sprint 8)](../../docs-sep/PRD.md)
- [PRD §25 (Epic 6)](../../docs-sep/PRD.md)
- [PRD §29 (Mapeamento Fase 2)](../../docs-sep/PRD.md)
- [ADR 0001 - Monolito modular orientado a DDD](../../adr/0001-monolito-modular-orientado-a-ddd.md)
- [ADR 0007 - DDD com Hexagonal](../../adr/0007-ddd-com-hexagonal-ports-and-adapters-por-modulo.md)
- ADR 0011 (criado na Sprint 8)
- [Spec 005 - Sprint 5 (step-up authentication, dependencia)](./005-sprint-5-endurecimento-seguranca.md)
- [Spec 007 - Sprint 7 (onboarding KYB + PLD, dependencia)](./007-sprint-7-onboarding-kyb-empresa.md)
- [Spec 009 - Sprint 9 (proxima — Open Finance)](./009-sprint-9-credito-open-finance.md)
- Resolucao CMN 4.656/2018 — Art. 9 (analise de credito)
