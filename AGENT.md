# AGENT.md - Orientacao consolidada para agentes de IA neste projeto

Este arquivo consolida a orientacao para os agentes de IA que assumem trabalho no projeto SEP. Substitui os arquivos anteriores `CLAUDE.md`, `CODEX.md` e `COPILOT.md`, agora apagados.

## Como usar este arquivo

- O AGENT.md e **apendice oficial do PRD** (ver `docs-sep/PRD.md` §28). Toda nova instancia de agente de IA, antes de tocar no repositorio, deve ler:
  1. [`docs-sep/PRD.md`](docs-sep/PRD.md)
  2. [`docs-sep/CONTEXT.md`](docs-sep/CONTEXT.md)
  3. Este arquivo (`AGENT.md`), pelo menos a secao do agente em uso
  4. O spec relevante em `specs/`
  5. O step correspondente em `steps-fase-1/{backend,web,mobile}/` ou `steps-fase-2/{backend,web,mobile}/`, quando existir
  6. ADRs relevantes em `adr/`
- O conteudo esta organizado em **tres secoes**, uma por agente: Claude, Codex e Copilot. As secoes tem sobreposicao (estado do projeto, stack, arquitetura, marco regulatorio, convencoes), mas cada uma foi escrita com o tom e os detalhes que fazem sentido para o agente correspondente.
- Quando houver conflito aparente entre as secoes, **prevalece o PRD** (`docs-sep/PRD.md`) e os ADRs (`adr/`). As secoes deste arquivo nao reescrevem o PRD; complementam-no.

## Indice

- [Repositorios do projeto](#repositorios-do-projeto)
- [Secao Claude](#secao-claude)
- [Secao Codex](#secao-codex)
- [Secao Copilot](#secao-copilot)

---

## Repositorios do projeto

A partir de 2026-05-04, o projeto SEP opera em **3 repositorios independentes** no GitHub:

- **`sep-api`** — backend Java + Spring Boot (package `com.dynamis.sep_api`); pre-commit via `.githooks/pre-commit` minimo (Spotless)
- **`sep-app`** — frontend web Angular 20.x; pre-commit via Husky + lint-staged padrao (`npx husky init`)
- **`sep-mobile`** — mobile Ionic 8.4 + Angular 20.x + Capacitor 6; pre-commit via Husky + lint-staged padrao (`npx husky init`)
- **`docs-SEP`** (este repositorio) — documentacao consolidada (PRD, ADRs, specs, steps-fase-1, steps-fase-2, AGENT.md, templates de CI)

Cada repo gerencia independentemente seu CI, hooks de pre-commit e dependencias. Cross-references nos specs/steps usam os placeholders `<sep-api-root>`, `<sep-app-root>` e `<sep-mobile-root>` para representar a raiz local de cada repo clonado.

**CI**: os workflows de cada repo sao copiados de `docs-sep/ci-pipelines/templates/` (ver [`docs-sep/ci-pipelines/README.md`](docs-sep/ci-pipelines/README.md)). Como cada repo so contem um app, os workflows nao precisam de `paths-filter` nem `working-directory`.

**Operacao git para o agente de IA**:

- Nos repos **`sep-api`**, **`sep-app`** e **`sep-mobile`** (codigo): o agente realiza apenas **commits** (com descricao) e **criacao de branches por sprint**. Push e PR continuam **manuais**, executados pelo desenvolvedor humano.
- **Checkpoint obrigatorio ao final de cada Task**: antes de preparar staging ou commit da Task, o agente deve parar e apresentar um checkpoint para revisao humana. O checkpoint deve listar arquivos criados/modificados/removidos, comandos de teste/build executados e resultado, riscos/pendencias e sugestao de mensagem de commit. O agente fica aguardando comando explicito do usuario para seguir com `git add` e `git commit`. Sem esse comando, nao deve fazer staging nem commit.
- No repo **`docs-SEP`** (documentacao): **toda operacao git e manual**. O agente **nao** cria branches, **nao** comita, **nao** faz push, **nao** faz reset/rebase/merge. Quando precisar atualizar PRD, CONTEXT, ADRs, specs, steps ou este AGENT.md, o agente edita os arquivos no working tree e para por ai; o desenvolvedor humano revisa, organiza branches e comita manualmente. Esta regra existe porque `docs-SEP` e a fonte de verdade do projeto e o usuario quer controle integral sobre essa historia.

**Modelo de branches em `sep-api`/`sep-app`/`sep-mobile` (FIXADO em 2026-05-06, revisado mesmo dia)**:

```
feature/<sprint-ou-tema>   ──(squash)──>   develop
                                              │
                                              │  (futuro: develop → homologacao → main)
                                              │
                                              ▼
                                        (merge commit)
                                              │
                                              ▼
                                            main
```

- **`main`** — protegida; recebe **apenas PRs de `develop`** (e futuramente `homologacao`); merge tipo **merge commit** (sem squash) para preservar historico de cada feature; tag de release opcional
- **`develop`** — base de integracao; recebe PRs de `feature/*` via **squash merge** (1 commit por feature em develop); protegida contra delecao para sobreviver ao setting `delete_branch_on_merge=true`
- **`homologacao`** (futura) — sera inserida entre `develop` e `main` quando o ambiente AWS de homologacao entrar em jogo (apos Sprint 4 / Epic 16 — `Infraestrutura AWS futura`). **Nao existe atualmente** — documentar como roadmap; criar quando o pipeline `aws-develop`/`homologacao` for ativado
- **`feature/<sprint-ou-tema>`** — nasce de `develop` apos `pull --ff-only`; PR vai para `develop`; auto-deletada apos squash merge
- **`feature/fix-<descricao>`** — para bugs em codigo ja integrado em `develop` ou `main`; nasce de `develop`; PR vai para `develop` (tratamento identico a feature normal)
- **Sem prefixos `fix/*` ou `hotfix/*`** — Conventional Commit `fix(...)` ja diferencia o tipo

**Fluxo padrao de feature**:

1. `git checkout develop`
2. `git pull --ff-only` — se falhar (divergencia), abortar e avisar o usuario
3. `git checkout -b feature/<nome-sprint>` (ou `feature/fix-<descricao>` para bugfix) — **1 branch unica para toda a sprint**
4. Commits durante a execucao com **numero flexivel** (Conventional Commits obrigatorio) — agente decide granularidade pelo escopo logico (Task, Step, modulo, refactor)
5. **Push e PR manuais** — agente NAO faz `git push`, NAO abre PR via `gh pr create`
6. PR sempre tem destino `develop` (NUNCA `main` direto)
7. Apos squash merge em `develop`:
   - branch remota deletada automaticamente (setting `delete_branch_on_merge=true`)
   - usuario faz `git checkout develop && git pull --ff-only` localmente
   - branch local pode permanecer como historico ate user apagar manualmente

**Integracao `develop → main` (release)**:

- Quando o conjunto de features em `develop` esta pronto para liberar:
  - usuario abre PR `develop → main` manualmente
  - merge tipo **merge commit** (sem squash) para preservar historico individual de cada feature (evita ruido de "Develop (#N)" como commit unico)
  - `develop` continua viva apos o merge — protegida contra delecao
- Quando `homologacao` existir: cadeia vira `develop → homologacao → main`. Cada salto eh PR + merge commit. Validacao funcional roda em `homologacao` antes de chegar em `main`

**Bugs em codigo**:

- **Sprint em andamento (branch nao mergeada)**: continuar comitando na propria branch da sprint com Conventional Commit `fix(...)`
- **Codigo ja em `develop` ou `main`**: criar nova branch `feature/fix-<descricao>` a partir de `develop` fresca; PR vai para `develop` como qualquer feature
- **Hotfix urgente em `main` (codigo em producao quebrado)**: excecao rara — abrir branch `feature/fix-<x>` a partir de `main`, PR direto pra `main` com aprovacao explicita do usuario; depois propagar pra `develop` via merge `main → develop`. Nao automatizar; sempre confirmar com usuario antes

**Commits durante execucao**:

- **1 branch por sprint** (`feature/<nome-sprint>`); toda a sprint vive nessa unica branch.
- **Numero de commits flexivel** — quantos forem necessarios pra agrupar mudancas coerentes. Agente decide pelo escopo logico (Task, Step, modulo, refactor), nao por contagem fixa.
- Heuristica: cada commit deve ser auto-contido e o subject explicar o que mudou. Evitar mega-commit "fim da sprint" (perde rastreabilidade) e tambem commits triviais por arquivo (poluem historico).
- Ao concluir uma Task implementada, executar um **checkpoint pre-commit** antes de qualquer staging:
  - `git status --short --branch`
  - `git diff --stat` e, quando util, lista de arquivos alterados
  - testes/build/lint relevantes da Task e seus resultados
  - pendencias, riscos e sugestao de mensagem Conventional Commit
  - aguardar o usuario testar manualmente e responder com comando explicito para seguir
- Antes do commit, somente depois do checkpoint aprovado pelo usuario: `git status` + `git ls-files --others --exclude-standard <paths>` para garantir que nada novo ficou untracked.
- `git add <paths-especificos>` (NAO `git add -A` — evita pegar `.claude/`, `.env`, etc.).
- Mensagem: `<tipo>(<modulo>): <descricao>` — `feat`, `fix`, `ci`, `chore`, `test`, `docs`, `refactor`.
- Hook automatico de `git add` apos Write/Edit foi removido em 2026-05-06; agente faz `git add` explicito.

**Fim de sprint — descricao PR**:

Quando todas as Tasks de uma sprint estiverem `[x]` ou explicitamente confirmadas como concluidas, o agente gera **descricao de PR por branch** contendo:

- **Titulo sugerido** (Conventional Commits)
- **Resumo** (1-3 bullets)
- **Escopo tecnico** (modulos/arquivos chave, dependencias adicionadas/removidas, migrations)
- **Como validar** (comandos de testes/build, endpoints/rotas afetadas)
- **Riscos / breaking changes** (lista explicita ou "nenhum")
- **Referencia** ao spec/step relevante

Nao fazer push nem `gh pr create` sem pedido explicito. Usuario abre o PR manualmente com a descricao gerada.

---

## Secao Claude

> Conteudo originalmente em `CLAUDE.md`, preservado como secao especifica para Claude Code.

Este arquivo orienta agentes de IA (Claude Code, GitHub Copilot, etc.) que assumirem trabalho no projeto SEP. Leia antes de qualquer acao.

### Estado atual do projeto

Fase: **100% documental**. Zero codigo escrito. Todos os artefatos sao Markdown/HTML em `docs-sep/`, `specs/` e `adr/`.

Documento principal: [`docs-sep/PRD.md`](docs-sep/PRD.md). Sempre comece lendo o PRD antes de propor qualquer mudanca.

### Visao do produto

SEP (Sociedade de Emprestimo entre Pessoas) com foco inicial em capital de giro PJ. O produto se apoia em Banking as a Service (Celcoin) para Pix, escrow, KYC/KYB e demais movimentacoes financeiras. Quatro jornadas previstas: tomador, empresa credora, financeiro interno, administrador.

A entrega tecnica atual e a fundacao backend da API.

### Stack confirmada

#### Backend
- Java `21` LTS
- Spring Boot `3.5.x` (pinar versao explicita)
- Gradle (Kotlin DSL aceitavel se preferido)
- PostgreSQL `16`
- Hibernate `6.x`
- Spring Security `6` + JWT (JJWT `0.12.x`)
- BCrypt para hash de senha
- Flyway para migrations
- Springdoc OpenAPI (Swagger UI)
- Spring Boot Actuator
- **MapStruct** (geracao de codigo, type-safe) — substituiu ModelMapper
- **RestClient** (Spring 6 sync) para integracoes Celcoin; `WebClient` reservado para streams
- **Resilience4j** para circuit breaker/retry/timeout em integracoes externas
- **Micrometer + Prometheus** para metricas
- **Testcontainers** para testes de integracao com PostgreSQL real
- **WireMock 3.x** para integration tests dos adapters HTTP do Celcoin (ver ADR 0008)
- Test slices: `@WebMvcTest`, `@DataJpaTest`, `@JsonTest`
- Records para DTOs, Sealed types para Roles/eventos, Pattern matching, Virtual threads

#### Frontend
- Angular `20.x` (sem framework CSS de terceiros)
- SCSS puro
- Standalone Components + Signals
- ESLint + Prettier + Stylelint
- Vitest (unit) + Playwright (E2E)
- Husky + lint-staged

#### Mobile
- Baseline: `Angular 20.x + Ionic 8.4+ + Capacitor 6`
- Avaliar upgrade para Angular 21 na fase de implementacao mobile, condicionado a release oficial Ionic + plugins
- Storage de token via `Capacitor Preferences` (PWA + Android/iOS)
- Validacao em PWA primeiro; build Android/iOS via Capacitor entra em fase posterior
- Trilha de execucao: M-Sprints 0-4 em `specs/fase-1/200-204`, conduzida por Dev Mobile dedicado

#### Design Systems
- [`docs-sep/DESIGN-apple.md`](docs-sep/DESIGN-apple.md) — superficies publicas (landing, login, cadastro)
- [`docs-sep/DESIGN-notion.md`](docs-sep/DESIGN-notion.md) — superficies autenticadas e todo o mobile
- Fronteira: estado de autenticacao (`/auth/me`)

#### Qualidade e tooling
- Spotless + Palantir Java Format
- JaCoCo target 70% por modulo
- Pre-commit hooks (Husky frontend, Git hooks backend)
- GitHub Actions para CI (build, test, lint, JaCoCo)
- Conventional Commits

### Arquitetura

- **Monolito modular orientado a DDD** (1 deploy Spring Boot, 1 banco PostgreSQL nesta fase)
- **Hexagonal/Ports & Adapters dentro de cada modulo** (`domain`, `application`, `infrastructure`, `web`)
- **Provider Pattern** obrigatorio para integracoes externas (Celcoin):
  - Interface em `<modulo>.application.port.out.<X>Provider`
  - Implementacao em `<modulo>.infrastructure.adapter.<X>.Celcoin<X>Provider`
- Sem microservicos nesta fase

Modulos previstos: `identity`, `usuarios`, `onboarding`, `credito`, `contratos`, `cobranca`, `escrow`, `backoffice`, `financeiro`, `credores`, `pix`, `shared`.

### Roteiro de Sprints

- **Sprint 0** — Hygiene & Foundation (tooling, repo setup, AGENT.md, ADRs, CI minimo)
- **Sprint 1** — Fundacao Tecnica (projeto Spring Boot, Postgres, Flyway, ApiExceptionHandler stub, Auditoria base, adapter pattern stub)
- **Sprint 2** — Gestao de Usuarios (entidade Usuario com Records, MapStruct, criacao publica, BCrypt, testes)
- **Sprint 3** — Seguranca/Auth (JWT, login, autorizacao por perfil/ownership, mTLS prep, correlationId)
- **Sprint 4** — Erros, Documentacao, Testes, Webhook Receiver (Pix prep)

Specs em `specs/fase-1/000` a `specs/fase-1/004` para backend; `specs/fase-1/100` a `specs/fase-1/104` para frontend web (1 arquivo por F-Sprint); `specs/fase-1/200` a `specs/fase-1/204` para mobile (1 arquivo por M-Sprint).

### Roadmap (16 Epics)

Ver [`docs-sep/PRD.md`](docs-sep/PRD.md) §25. Resumo:
1-4: Sprints 1-4 (backend foundation)
5: Onboarding KYC/KYB
6: Analise de Credito
7: Formalizacao Contratual
8: Cobranca e Inadimplencia
9: Backoffice Operacional
10: Jornada da Empresa Credora
11: Administracao e Governanca
12: Fundacao Frontend
13: Frontend de Jornadas
14: Mobile SEP
15: Movimentacao Pix
16: Infraestrutura AWS Futura

### Marco regulatorio

SEPs sao reguladas pela **Resolucao CMN nº 4.656/2018**. Implicacoes:
- KYC/KYB e obrigatorio por lei (nao opcional)
- Segregacao patrimonial via conta escrow e obrigatoria
- Consultas a COAF, OFAC, INTERPOL, MTE para PLD
- Auditoria reforcada de operacoes financeiras

### Convencoes do projeto

- Tabelas e colunas em portugues
- Identificadores: UUID v6 (lib `com.fasterxml.uuid:java-uuid-generator:5.1.0`)
- UUID nativo no PostgreSQL, `java.util.UUID` no Java
- Sem soft delete nesta fase
- Datas serializadas em ISO-8601 com offset
- Senhas: BCrypt; politica atual de 6 caracteres sera revisada antes de producao
- Locale `pt-BR`, timezone `America/Sao_Paulo`
- Logout: tratado no cliente (sem refresh token nesta fase)

### Como iniciar uma nova conversa

1. Leia [`docs-sep/PRD.md`](docs-sep/PRD.md)
2. Leia [`docs-sep/CONTEXT.md`](docs-sep/CONTEXT.md) para historico de decisoes
3. Leia este `AGENT.md` (pelo menos a [Secao Claude](#secao-claude))
4. Leia o spec relevante em `specs/`
5. Leia o steps correspondente em `steps-fase-1/` ou `steps-fase-2/` (detalhamento por task antes de codificar)
6. Leia ADRs em `adr/` para racional de decisoes arquiteturais
7. Antes de propor mudanca grande, considere abrir um ADR novo

### Hierarquia SDD do projeto

```
PRD → ADRs → Specs → Steps → Codigo
docs-sep/  adr/  specs/  steps-fase-1/  steps-fase-2/
```

- **PRD** = visao do produto (alto nivel)
- **ADRs** = decisoes arquiteturais imutaveis
- **Specs** = o que fazer por sprint (medio nivel, com tasks numeradas)
- **Steps** = como fazer (granular, com snippets prontos para codificar)
- **Codigo** = a verdade final apos execucao

Steps devem ser criados **just-in-time** antes de executar cada sprint, nao todos de uma vez.

### O que NAO fazer

- Nao reintroduzir Bootstrap, Tailwind, Material ou template administrativo pronto
- Nao acoplar modulos a Celcoin diretamente — sempre via Provider Pattern
- Nao criar microservicos nesta fase
- Nao adicionar soft delete
- Nao usar ModelMapper (foi substituido por MapStruct)
- Nao regredir Angular abaixo de `20`
- Nao gerar specs/plans automaticamente sem confirmacao do usuario
- Nao iniciar implementacao remota AWS antes da Sprint 3 / Epic 3 concluida

### Comunicacao

- Idioma: portugues (pt-BR) para conversa, codigo em ingles tecnico
- Commits podem ser feitos por agente quando solicitado; push e PR sao manuais

---

## Secao Codex

> Conteudo originalmente em `CODEX.md`, preservado como secao especifica para o agente Codex.

Este arquivo orienta o agente Codex ao assumir trabalho no projeto SEP. Leia antes de qualquer acao relevante no repositorio.

### Estado atual do projeto

Fase: **100% documental**. Ainda nao ha codigo de aplicacao implementado. Os artefatos atuais vivem principalmente em:

- `docs-sep/`
- `specs/`
- `steps-fase-1/`
- `steps-fase-2/`
- `adr/`

Documento principal: [`docs-sep/PRD.md`](docs-sep/PRD.md). Sempre comece lendo o PRD antes de propor mudancas de produto, arquitetura, specs, steps ou codigo.

Contexto historico: [`docs-sep/CONTEXT.md`](docs-sep/CONTEXT.md). Use este arquivo para entender decisoes ja tomadas e evitar reabrir discussoes encerradas sem motivo tecnico claro.

### Como iniciar trabalho neste projeto

Ordem padrao de leitura:

1. [`docs-sep/PRD.md`](docs-sep/PRD.md)
2. [`docs-sep/CONTEXT.md`](docs-sep/CONTEXT.md)
3. Este arquivo (`AGENT.md`), com foco na [Secao Claude](#secao-claude) para a visao geral e nesta [Secao Codex](#secao-codex) para o operacional do agente
4. O spec relevante em `specs/`
5. O step correspondente em `steps-fase-1/` ou `steps-fase-2/`, quando existir
6. ADRs relevantes em `adr/`

Se o trabalho for implementar uma sprint ou task, leia primeiro o spec e o step correspondente. Steps devem ser criados **just-in-time**, antes da execucao da sprint ou task, e nao todos de uma vez.

### Hierarquia SDD do projeto

```text
PRD -> ADRs -> Specs -> Steps -> Codigo
docs-sep/  adr/  specs/  steps-fase-1/  steps-fase-2/
```

- **PRD**: visao de produto, escopo, roadmap e prioridades.
- **ADRs**: decisoes arquiteturais e seus racionais.
- **Specs**: o que fazer por sprint, em nivel implementavel.
- **Steps**: como executar uma task ou sprint de forma granular.
- **Codigo**: verdade final depois que a implementacao existir.

Ao encontrar conflito, priorize a decisao mais especifica e mais recente, mas nao altere ADR ou PRD sem deixar claro o impacto.

### Visao do produto

O projeto e uma plataforma SEP (Sociedade de Emprestimo entre Pessoas) com foco inicial em capital de giro PJ. A estrategia usa Banking as a Service, com forte referencia ao ecossistema Celcoin, para KYC/KYB, escrow, Pix, Open Finance e operacoes financeiras futuras.

Quatro jornadas de negocio previstas:

- tomador de emprestimo
- empresa credora
- financeiro interno
- administrador do sistema

A entrega tecnica atual e a fundacao backend da API, antes das jornadas completas.

### Stack confirmada

#### Backend

- Java `21` LTS
- Spring Boot `3.5.x`, com versao minor pinada
- Gradle `8.x` com Wrapper
- PostgreSQL `16`
- Hibernate `6.x`
- Spring Security `6` + JWT com JJWT `0.12.x`
- BCrypt para hash de senha
- Flyway para migrations
- Springdoc OpenAPI `2.x`
- Spring Boot Actuator
- MapStruct, no lugar de ModelMapper
- RestClient para integracoes REST Celcoin
- WebClient apenas para streams reativos futuros
- Resilience4j para circuit breaker, retry e timeout
- Micrometer + Prometheus
- JUnit 5 + AssertJ
- Testcontainers com PostgreSQL real, sem H2
- WireMock `3.x` para integration tests de adapters HTTP Celcoin
- Test slices: `@WebMvcTest`, `@DataJpaTest`, `@JsonTest`

#### Frontend

- Angular `20.x`
- Standalone Components
- Signals
- SCSS puro
- Sem Bootstrap, Tailwind, Material ou template administrativo pronto
- ESLint + Prettier + Stylelint
- Vitest e Playwright
- Husky + lint-staged

#### Mobile

- Angular `20.x` + Ionic `8.4+` + Capacitor `6`
- Upgrade para Angular `21` apenas se Ionic e plugins Capacitor tiverem suporte oficial explicito
- Storage de token via Capacitor Preferences
- Validacao inicial em PWA/browser
- Escopo inicial limitado a tomador e empresa credora

### Design systems

- [`docs-sep/DESIGN-apple.md`](docs-sep/DESIGN-apple.md): superficies publicas web, como landing, login e cadastro.
- [`docs-sep/DESIGN-notion.md`](docs-sep/DESIGN-notion.md): superficies autenticadas web e todo o mobile.

A fronteira visual no web e o estado de autenticacao: antes do login usa Apple; a partir de `/auth/me` usa Notion.

Nao introduza frameworks CSS de terceiros nem templates administrativos prontos. Componentes devem ser proprios, com tokens extraidos dos design systems para SCSS.

### Arquitetura backend

- Monolito modular orientado a DDD.
- Um unico deploy Spring Boot nesta fase.
- Um unico banco PostgreSQL nesta fase.
- Hexagonal/Ports & Adapters dentro de cada modulo.
- Separacao por modulos de dominio, nao por camadas globais.
- Sem microservicos na fase inicial.

Modulos previstos:

- `identity`
- `usuarios`
- `onboarding`
- `credito`
- `contratos`
- `cobranca`
- `escrow`
- `backoffice`
- `financeiro`
- `credores`
- `pix`
- `shared`

Estrutura interna esperada por modulo:

- `domain`
- `application`
- `application.port.out`
- `infrastructure`
- `infrastructure.adapter`
- `web`

Regras importantes:

- Controllers nao acessam repositories diretamente.
- Um modulo nao acessa repository interno de outro modulo.
- DTOs de API ficam na borda `web`.
- Entidades JPA permanecem encapsuladas no modulo dono.
- JWT e seguranca ficam em `identity`, mas regras de negocio continuam no modulo dono.
- `shared` deve permanecer pequeno e nao virar deposito generico.

### Provider Pattern

Toda integracao externa deve ser isolada por porta e adapter:

- Porta em `<modulo>.application.port.out.<X>Provider`
- Adapter real em `<modulo>.infrastructure.adapter.<X>.Celcoin<X>Provider`
- Fake/stub em `<modulo>.infrastructure.adapter.<X>.Fake<X>Provider`
- Integration test com WireMock para adapter HTTP real

Nao acople dominio diretamente a Celcoin ou outro provedor.

### Marco regulatorio

O produto opera sob a Resolucao CMN nº 4.656/2018. Implicacoes desde o inicio:

- KYC/KYB obrigatorio por lei.
- Segregacao patrimonial via conta escrow obrigatoria.
- PLD com consultas a COAF, OFAC, INTERPOL e MTE.
- Auditoria reforcada para operacoes financeiras e acessos administrativos.

O modulo `escrow` deve ser modelado desde a Sprint 1, mesmo antes da integracao Celcoin.

### Roteiro de sprints

- Sprint 0: Hygiene & Foundation.
- Sprint 1: Fundacao Tecnica.
- Sprint 2: Gestao de Usuarios.
- Sprint 3: Seguranca e Autenticacao JWT.
- Sprint 4: Erros, Documentacao, Testes e Webhook Receiver.

Specs backend: `specs/fase-1/000` a `specs/fase-1/004`.

Trilha frontend web: `specs/fase-1/100` a `specs/fase-1/104`.

Trilha mobile: `specs/fase-1/200` a `specs/fase-1/204`.

### Convencoes do projeto

- Conversa em portugues pt-BR.
- Tabelas e colunas em portugues.
- Dominio Java preferencialmente em portugues, respeitando termos tecnicos consolidados.
- Identificadores com UUID v6 usando `com.fasterxml.uuid:java-uuid-generator:5.1.0`.
- UUID nativo no PostgreSQL e `java.util.UUID` no Java.
- Sem soft delete nesta fase.
- Datas em ISO-8601 com offset.
- Locale `pt-BR`.
- Timezone `America/Sao_Paulo`.
- Senhas com BCrypt.
- Politica inicial de senha: exatamente 6 caracteres, conforme PRD.
- JWT sem refresh token nesta fase.
- Logout tratado no cliente nesta fase.
- Auditoria deve priorizar UUID do usuario autenticado, com fallback tecnico `system`.

### Regras para o Codex

- Antes de alterar arquivos, leia o contexto suficiente e informe objetivamente o que sera editado.
- Nao implemente a API inteira sem confirmacao explicita.
- Nao gere todos os specs, plans ou steps automaticamente sem confirmacao.
- Prefira tarefas pequenas, alinhadas ao spec ou step atual.
- Ao implementar codigo, rode testes locais relevantes ao final da task, quando o ambiente permitir.
- Ao final de cada Task, faca checkpoint pre-commit e aguarde aprovacao/comando explicito do usuario antes de `git add` e `git commit`.
- Nao reverta alteracoes existentes do usuario.
- Nao use comandos destrutivos sem pedido explicito.
- Commits podem ser feitos pelo agente apenas quando solicitado; push e PR sao manuais.
- Se uma decisao arquitetural mudar, avalie criar ou atualizar ADR.

### O que nao fazer

- Nao reintroduzir Bootstrap, Tailwind, Material ou template administrativo pronto.
- Nao usar ModelMapper.
- Nao criar microservicos nesta fase.
- Nao adicionar soft delete.
- Nao acoplar modulos diretamente a Celcoin.
- Nao regredir Angular abaixo de `20`.
- Nao iniciar AWS, EC2, RDS, CI/CD remoto ou deploy antes do gate minimo da Sprint 3.
- Nao antecipar Pix antes de onboarding, analise de credito, formalizacao e cobranca inicial.
- Nao colocar regra de negocio no frontend ou mobile.

### Fontes principais

- [`docs-sep/PRD.md`](docs-sep/PRD.md)
- [`docs-sep/CONTEXT.md`](docs-sep/CONTEXT.md)
- [Secao Claude](#secao-claude) deste arquivo
- [`adr/`](adr/)
- [`specs/`](specs/)
- [`steps-fase-1/`](steps-fase-1/)
- [`steps-fase-2/`](steps-fase-2/)

---

## Secao Copilot

> Conteudo originalmente em `COPILOT.md`, preservado como secao especifica para o GitHub Copilot CLI.

Este arquivo orienta o GitHub Copilot CLI ao assumir trabalho no projeto SEP. Leia antes de qualquer acao.

### Estado atual do projeto

Fase: documentacao consolidada com repos de codigo separados. Os artefatos documentais atuais estao em `docs-sep/`, `specs/`, `steps-fase-1/`, `steps-fase-2/` e `adr/`.

Documento principal: [`docs-sep/PRD.md`](docs-sep/PRD.md). Sempre comece por ele antes de propor mudanca, spec ou implementacao.

### Contexto do produto

SEP (Sociedade de Emprestimo entre Pessoas) com foco inicial em capital de giro PJ. O produto usa Banking as a Service, com foco em Celcoin, para suportar Pix, escrow, KYC/KYB e operacoes financeiras relacionadas.

Quatro jornadas previstas:
- tomador
- empresa credora
- financeiro interno
- administrador

A entrega tecnica inicial continua sendo a **fundacao backend da API**.

### Stack confirmada

#### Backend
- Java `21` LTS
- Spring Boot `3.5.x`
- Gradle
- PostgreSQL `16`
- Hibernate `6.x`
- Spring Security `6` + JWT (`JJWT 0.12.x`)
- BCrypt
- Flyway
- Springdoc OpenAPI
- Spring Boot Actuator
- MapStruct
- RestClient (Spring 6) para integracoes sync
- Resilience4j
- Micrometer + Prometheus
- Testcontainers
- WireMock 3.x

#### Frontend
- Angular `20.x`
- SCSS puro
- Standalone Components + Signals
- ESLint + Prettier + Stylelint
- Vitest + Playwright

#### Mobile
- Angular `20.x + Ionic 8.4+ + Capacitor 6`
- avaliar Angular `21` apenas na fase mobile, se houver compatibilidade oficial
- token storage via `Capacitor Preferences`
- validacao em PWA primeiro

### Design systems oficiais

- [`docs-sep/DESIGN-apple.md`](docs-sep/DESIGN-apple.md) -> superficies publicas
- [`docs-sep/DESIGN-notion.md`](docs-sep/DESIGN-notion.md) -> superficies autenticadas e todo o mobile

Fronteira visual: estado de autenticacao (`/auth/me`).

### Arquitetura obrigatoria

- monolito modular orientado a DDD
- hexagonal / ports and adapters dentro de cada modulo
- sem microservicos nesta fase
- Provider Pattern obrigatorio para integracoes externas

Padrao de integracao externa:
- interface em `<modulo>.application.port.out.<X>Provider`
- implementacao em `<modulo>.infrastructure.adapter.<X>.Celcoin<X>Provider`

Modulos previstos:
- `identity`
- `usuarios`
- `onboarding`
- `credito`
- `contratos`
- `cobranca`
- `escrow`
- `backoffice`
- `financeiro`
- `credores`
- `pix`
- `shared`

### Marco regulatorio

O produto deve respeitar a **Resolucao CMN 4.656/2018** desde a fundacao:
- KYC/KYB obrigatorio
- segregacao patrimonial via escrow obrigatoria
- trilhas de PLD obrigatorias
- auditoria reforcada para operacoes financeiras

### Convencoes do projeto

- tabelas e colunas em portugues
- identificadores com UUID v6 (`com.fasterxml.uuid:java-uuid-generator:5.1.0`)
- UUID nativo no PostgreSQL e `java.util.UUID` no Java
- sem soft delete nesta fase
- datas em ISO-8601 com offset
- locale `pt-BR`
- timezone `America/Sao_Paulo`
- senhas com BCrypt
- politica inicial de senha: `6 caracteres`
- logout tratado no cliente nesta fase

### Ordem de leitura ao iniciar trabalho

1. [`docs-sep/PRD.md`](docs-sep/PRD.md)
2. [`docs-sep/CONTEXT.md`](docs-sep/CONTEXT.md)
3. Este arquivo (`AGENT.md`), com prioridade para esta [Secao Copilot](#secao-copilot)
4. spec relevante em `specs/`
5. steps relevante em `steps-fase-1/` ou `steps-fase-2/`
6. ADRs em `adr/`

Antes de alteracoes grandes de arquitetura, considerar novo ADR.

### Hierarquia SDD

```text
PRD -> ADRs -> Specs -> Steps -> Codigo
docs-sep/  adr/  specs/  steps-fase-1/  steps-fase-2/
```

- PRD = visao do produto
- ADRs = decisoes arquiteturais
- Specs = o que fazer por sprint
- Steps = como fazer em nivel granular
- Codigo = implementacao final

### Roadmap consolidado

1. Fundacao da API
2. Gestao de usuarios
3. Seguranca e autenticacao JWT
4. Tratamento de erros e documentacao
5. Onboarding KYC/KYB
6. Analise de credito
7. Formalizacao contratual
8. Cobranca e inadimplencia
9. Backoffice operacional
10. Jornada da empresa credora
11. Administracao e governanca
12. Fundacao Frontend
13. Frontend de Jornadas
14. Mobile SEP
15. Movimentacao Pix
16. Infraestrutura AWS futura

### Roteiro de sprints iniciais

- Sprint 0 -> Hygiene & Foundation
- Sprint 1 -> Fundacao Tecnica
- Sprint 2 -> Gestao de Usuarios
- Sprint 3 -> Seguranca/Auth
- Sprint 4 -> Erros, Documentacao, Testes, Webhook Receiver

### O que o Copilot deve fazer

- responder em portugues (pt-BR) na conversa
- usar ingles tecnico em codigo, nomes tecnicos e exemplos de implementacao
- preservar a hierarquia PRD -> ADR -> Specs -> Steps -> Codigo
- ler o spec e o steps correspondentes antes de implementar
- seguir os padroes ja fechados no PRD e ADRs
- fazer mudancas pequenas, precisas e alinhadas ao escopo pedido
- atualizar documentacao quando a mudanca impactar diretamente os artefatos do projeto

### O que o Copilot nao deve fazer

- nao gerar specs, plans ou implementacoes amplas sem confirmacao do usuario
- nao reintroduzir Bootstrap, Tailwind, Material ou template administrativo pronto
- nao acoplar modulos diretamente a Celcoin
- nao criar microservicos nesta fase
- nao adicionar soft delete
- nao usar ModelMapper
- nao regredir Angular abaixo de `20`
- nao antecipar AWS remota antes do gate minimo da Sprint 3 / Epic 3

### Regra pratica para implementacao

Se o usuario pedir execucao:
- primeiro releia PRD, CONTEXT, spec e steps relevantes
- depois implemente apenas o recorte autorizado
- valide coerencia com ADRs e convencoes
- pare ao entregar o resultado solicitado, sem expandir escopo por conta propria

### Comunicacao e operacao

- commits podem ser feitos pelo agente quando solicitado
- push e PR sao manuais
- testes locais devem acontecer ao final de cada task quando houver implementacao
- infraestrutura remota, CI/CD e deploy ficam em fase separada

### Relacao com a Secao Claude

Esta secao complementa a [Secao Claude](#secao-claude) deste mesmo arquivo para uso explicito do GitHub Copilot CLI, sem substituir o PRD, o CONTEXT e os demais artefatos oficiais do projeto.
