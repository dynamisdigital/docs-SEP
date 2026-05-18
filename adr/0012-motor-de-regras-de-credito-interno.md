# ADR 0012 - Motor de Regras de Credito Interno em Java Puro

## Status

Aceito (2026-05-18). Sprint 8 (Epic 6 parte 1 — Credito).

> **Nota de numeracao:** o spec 008 (Sprint 8 Task 8.7) referencia "ADR 0011 — motor de regras". O numero 0011 ja havia sido alocado para [ADR 0011 - Reavaliacao da Stack Frontend e Mobile](./0011-reavaliacao-stack-frontend-mobile-angular-ionic.md) em 2026-04-27. Esta ADR cobre o tema previsto na Task 8.7 sob o proximo numero livre.

## Contexto

A Sprint 8 (Epic 6 parte 1) introduz o nucleo de **analise de credito interna** do produto SEP. O motor de regras precisa avaliar propostas (`PropostaCredito`) contra heuristicas declarativas — onboarding aprovado, idade minima PF, tempo minimo de existencia PJ, valor maximo por perfil, prazo maximo por perfil — produzindo `ScoreInterno` (0-1000) e sugerindo `StatusProposta` inicial (`PRE_APROVADA`, `EM_ANALISE` ou `REJEITADA`).

Forcas relevantes:

- **Resolucao CMN 4.656/2018 Art. 9**: exige trilha auditavel completa de por que cada proposta foi aprovada ou rejeitada.
- **Conjunto inicial pequeno**: 5 regras na Sprint 8; expansao prevista na Sprint 9 (Open Finance) e Sprint 10+ (campanhas por linha de produto, na Epic 10 Empresa Credora).
- **Necessidade de ajuste rapido**: thresholds (penalidade, score de pre-aprovacao, limites por perfil) devem ser configuraveis sem deploy de codigo, para que financeiro/produto ajustem politica de credito sem rebuild.
- **Risco regulatorio baixo para Sprint 8**: cobertura inicial e capital de giro PJ + emprestimo generico PF; nao ha ainda diferenciacao por campanha ou linha de produto.
- **Manutencao por equipe pequena (~1 Dev Senior + futuros)**: introducao de nova stack/tecnologia para regras teria custo de onboarding desproporcional ao tamanho inicial do conjunto.

## Decisao

Adotaremos **motor de regras em Java puro** (sem DSL externa) para a Sprint 8, com a seguinte arquitetura:

- Interface `RegraCredito` em `credito.application.service` declara `nome()` e `avaliar(ContextoAvaliacaoCredito)` retornando `RegraResultado` (`PASSOU` / `FALHOU` / `PENDENTE`, com flag `bloqueante`).
- Implementacoes individuais como `@Component`s em `credito.application.service.regras` (`RegraOnboardingAprovado`, `RegraIdadeMinimaPessoa`, `RegraTempoExistenciaEmpresa`, `RegraValorMaximo`, `RegraPrazoMaximo`).
- Orquestrador `MotorRegrasCredito` recebe `List<RegraCredito>` via injecao Spring, agrega resultados e calcula `score = max(0, scoreInicial - penalidadeFalha * falhas - penalidadePendencia * pendencias)`.
- Thresholds e pesos em `CreditoMotorProperties` (record `@ConfigurationProperties("app.credito.motor")`) — ajustaveis via `application.yml` ou env vars sem rebuild.
- Bloqueio absoluto (`FALHOU + bloqueante`) sobrepoe score e sugere `REJEITADA`.

## Alternativas consideradas

- **(b) DSL com Drools**: descartada por adicionar dependencia pesada (regras como `.drl`, runtime KIE), curva de aprendizado e custo operacional desproporcionais ao tamanho atual de 5 regras. Eventualmente recuperavel se o conjunto crescer >20 regras ou se houver demanda real de campanhas dinamicas.
- **(c) Expression Language (JEXL / MVEL / Spring SpEL)**: descartada por desencorajar testes unitarios isolados das regras (avaliacao via string menos rastreavel em IDE), e por ainda exigir codigo Java pra parsear contextos.
- **(d) Servico externo de score (bureau / SaaS)**: fora de escopo da Sprint 8 — Open Finance entra na Sprint 9 (ADR proprio), bureau de credito comercial fica para Sprint 12+ se houver necessidade real.

## Consequencias

### Positivas

- Cada regra eh classe Java testavel com Mockito + JUnit, sem rede ou interpretador externo. Cobertura por cenarios em `Regra*Test.java` direta.
- IDE da auto-complete, refactor seguro, deteccao de codigo morto.
- Sem dependencia operacional nova (Drools, MVEL etc.); jar do `sep-api` continua com mesma supply chain.
- `CreditoMotorProperties` permite ajuste de thresholds sem deploy estrutural — apenas restart com env vars novas.
- Trilha auditavel garantida pela camada de persistencia: cada regra avaliada vira `RegraCreditoAvaliada` em tabela propria (FK sem CASCADE), atendendo CMN 4.656/2018 Art. 9.

### Negativas

- **Adicionar nova regra exige deploy**: nao da pra ligar/desligar regra sem rebuild — config YAML cobre apenas thresholds/pesos, nao a lista de regras ativas.
- **Combinacoes complexas ficam verbose**: se a politica de credito evoluir para "X AND (Y OR (Z AND W)) com peso variavel por linha de produto", o modelo atual em `@Component`s individuais fica ruidoso. DSL ofereceria sintaxe mais densa para esse caso.
- **Nao permite simulacao por nao-tecnicos**: financeiro nao consegue mudar uma regra via UI ou planilha — depende sempre de codigo + deploy.

### Neutras

- Decisao manual do operador FINANCEIRO via `ParecerCredito` **sobrepoe** sugestao do motor (CMN 4.656/2018 Art. 9). Motor e ferramenta de apoio, nao autoridade final.
- Listener de auditoria (`CreditoAuditListener`) e fluxo de eventos `PROPOSTA_AVALIADA_MOTOR`/`PROPOSTA_APROVADA`/`PROPOSTA_REJEITADA` sao independentes da escolha do motor — qualquer reimplementacao futura deve preservar esses contratos.

## Gatilhos de revisao

Esta ADR deve ser revisitada quando **qualquer um** dos cenarios abaixo ocorrer:

1. **Mais de 20 regras ativas** ao mesmo tempo — verbosidade em `@Component`s individuais comeca a justificar DSL.
2. **Epic 10 (Empresa Credora) entrar em planejamento** com requisito explicito de campanhas/linhas de produto com regras dinamicas por linha — DSL ou servico externo passa a ser opcao real.
3. **Demanda por simulacao por nao-tecnicos** (financeiro testar mudanca de regra antes de aplicar) — motor puro Java nao oferece esse caminho sem UI custom.
4. **Bureaux de credito externos** entrarem como fonte primaria de decisao (Sprint 12+) — neste caso o motor pode virar um agregador de scores externos + heuristicas internas, e DSL ou servico externo podem ganhar escala.

Revisao em qualquer gatilho deve produzir nova ADR (revoga ou estende esta) com analise atualizada das alternativas (b)/(c)/(d).

## Implementacao

- `sep-api/src/main/java/com/dynamis/sep_api/credito/application/service/RegraCredito.java`
- `sep-api/src/main/java/com/dynamis/sep_api/credito/application/service/MotorRegrasCredito.java`
- `sep-api/src/main/java/com/dynamis/sep_api/credito/application/service/CreditoMotorProperties.java`
- `sep-api/src/main/java/com/dynamis/sep_api/credito/application/service/regras/*.java` (5 regras)
- `sep-api/src/main/resources/application.yml` (bloco `app.credito.motor.*`)
- Testes: `sep-api/src/test/java/com/dynamis/sep_api/credito/application/service/MotorRegrasCreditoTest.java` + `regras/*Test.java`

Auditoria sincrona da execucao do motor (`PROPOSTA_AVALIADA_MOTOR`) acontece dentro de `PropostaAvaliacaoTransacional.avaliar` — Step 008.6.3 do spec exige "motor sem audit -> PENDENCIA". Falha de audit causa rollback do happy path, e o fallback do `AvaliarPropostaUseCase` marca proposta como `PENDENCIA` em transacao isolada.

## Referencias

- [Spec 008 - Sprint 8 Credito (regras internas + parecer)](../specs/fase-2/008-sprint-8-credito-regras-parecer.md)
- [Steps 008 - Sprint 8](../steps-fase-2/backend/008-sprint-8-steps.md)
- [ADR 0001 - Monolito modular orientado a DDD](./0001-monolito-modular-orientado-a-ddd.md)
- [ADR 0007 - DDD com Hexagonal/Ports & Adapters por modulo](./0007-ddd-com-hexagonal-ports-and-adapters-por-modulo.md)
- Resolucao CMN 4.656/2018 — Art. 9 (analise de credito)
