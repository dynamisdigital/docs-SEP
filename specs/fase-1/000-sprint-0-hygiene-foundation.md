# Spec 000 - Sprint 0 - Hygiene & Foundation

## Metadados

- **ID da Spec**: 000
- **Titulo**: Sprint 0 - Hygiene & Foundation
- **Status**: concluida em 2026-05-04 (branch `sprint-0/hygiene-foundation` no repo `sep-api`)
- **Fase do produto**: pre-Epic 1 (preparacao do terreno)
- **Origem**: PRD - API SEP, Secao 22 + Plano de melhorias R1
- **Responsavel principal**: Dev Senior (com apoio dos Devs Plenos para tooling Frontend)
- **Equipe sugerida**: equipe completa (1 Dev Senior + 2 Devs Plenos Frontend) — todos contribuem para o setup inicial

## Objetivo

Estabelecer o terreno tecnico minimo para que as Sprints 1-4 (backend) e a trilha Frontend paralela (Specs 1XX) comecem com qualidade: tooling de formatacao, lint, testes, cobertura, pre-commit, CI minimo, ADRs, conventional commits e meta-arquivos do projeto.

Sem isso, a Sprint 1 comecaria produzindo divida tecnica imediata (codigo sem padronizacao, sem rede de seguranca de testes, sem consciencia regulatoria de mudancas).

## Escopo

### Em escopo
- Meta-arquivos do repositorio (`.gitignore`, `.editorconfig`, `.gitattributes`, `AGENT.md` ja criado)
- Spotless + Palantir Java Format configurados no Gradle (preparado para Sprint 1)
- JaCoCo configurado com target inicial 70% por modulo
- Pre-commit hooks via Git hooks (backend) e Husky + lint-staged (frontend, na trilha paralela 1XX)
- Conventional Commits documentado
- GitHub repo settings: branch protection na `main`, PR template, issue templates
- GitHub Actions CI minimo: build + test + Spotless check + JaCoCo report
- Pasta `adr/` com `0000-template.md` e os 5-7 primeiros ADRs migrados do PRD
- Estrutura inicial das pastas do monolito modular DDD (sem codigo, so estrutura)

### Fora de escopo nesta spec
- Codigo Java de aplicacao (Sprint 1)
- Qualquer logica de dominio
- Deploy remoto, AWS, Docker em producao
- Frontend funcional (vai na trilha 1XX)

## Pre-requisitos globais

- PRD aprovado (ja existe)
- AGENT.md criado (ja existe na raiz)
- Repositorio Git inicializado
- Acesso a GitHub para configurar branch protection

## Tasks

### Task 0.1 - Meta-arquivos do repositorio

**Descricao**
Criar os arquivos de configuracao basica do repositorio para garantir consistencia de formatacao e ignorar artefatos de build.

**Arquivos esperados**
- `.gitignore` — padroes Java + Gradle + IntelliJ + VS Code + Eclipse + Node + macOS + Windows
- `.editorconfig` — 4-spaces para Java; 2-spaces para TS, SCSS, YAML, JSON, MD; LF; UTF-8; final newline
- `.gitattributes` — text=auto, eol=lf por padrao; binarios marcados; `*.gradle text eol=lf`

**Criterios de verificacao**
- `git status` ignora `build/`, `.gradle/`, `.idea/`, `.vscode/settings.json`, `node_modules/`, `dist/`
- Editor (IntelliJ ou VS Code) respeita `.editorconfig`
- `git diff` nao mostra mudancas de EOL spurias

**Pre-requisitos**
- Repositorio Git inicializado

**Dependencias**
- nenhuma

**Responsavel sugerido**
- Dev Senior

---

### Task 0.2 - Spotless + Palantir Java Format

**Descricao**
Configurar Spotless no `build.gradle` (sera criado na Sprint 1, mas o snippet precisa estar pronto neste spec) com Palantir Java Format como formatador. Spotless deve falhar build se codigo estiver fora de padrao.

**Arquivos esperados (preparados para Sprint 1)**
- Snippet de configuracao Spotless documentado em `specs/000-sprint-0-hygiene-foundation.md` ou em `adr/0003-spotless-palantir-format.md`
- Configuracao para rodar em `*.java`, `*.gradle`, `*.md` e `*.yml`

**Configuracao recomendada**
```gradle
spotless {
    java {
        palantirJavaFormat('2.50.0')
        removeUnusedImports()
        endWithNewline()
    }
    kotlinGradle {
        ktlint()
    }
    format 'misc', {
        target '*.md', '*.yml', '*.yaml'
        trimTrailingWhitespace()
        endWithNewline()
    }
}
```

**Criterios de verificacao**
- `./gradlew spotlessCheck` passa em codigo bem formatado
- `./gradlew spotlessApply` aplica formatacao
- Pre-commit hook chama `spotlessCheck`

**Pre-requisitos**
- Task 0.1 concluida

**Dependencias**
- nenhuma

**Responsavel sugerido**
- Dev Senior

---

### Task 0.3 - JaCoCo com target 70%

**Descricao**
Configurar JaCoCo no `build.gradle` (Sprint 1) com target de cobertura 70% por modulo. Build deve falhar se cobertura cair abaixo do target depois de Sprint 4 estar concluida.

**Configuracao recomendada (snippet para Sprint 1)**
```gradle
jacoco {
    toolVersion = "0.8.11"
}

jacocoTestCoverageVerification {
    violationRules {
        rule {
            limit {
                minimum = 0.70
            }
        }
    }
}

test {
    finalizedBy jacocoTestReport
}
```

**Criterios de verificacao**
- `./gradlew test jacocoTestReport` gera relatorio HTML em `build/reports/jacoco/`
- `./gradlew jacocoTestCoverageVerification` falha se cobertura < 70%
- CI publica o relatorio

**Pre-requisitos**
- Task 0.2 concluida

**Dependencias**
- depende de testes existirem (Sprints 1-4 com R6 distribuido)

**Responsavel sugerido**
- Dev Senior

---

### Task 0.4 - Pre-commit hooks

**Descricao**
Configurar Git hooks no repositorio `sep-api` para bloquear commits com codigo Java desformatado. Cada repositorio gerencia seu pre-commit independentemente: `sep-api` usa `.githooks/pre-commit` minimalista (so Spotless), `sep-app` e `sep-mobile` usam Husky + lint-staged padrao via `npx husky init` (orientacoes em [`100-fsprint-0-setup-angular.md`](./100-fsprint-0-setup-angular.md) e [`200-msprint-0-setup-ionic.md`](./200-msprint-0-setup-ionic.md)).

**Arquivos esperados (apenas no repo `sep-api`)**
- `<sep-api-root>/.githooks/pre-commit` rodando `./gradlew spotlessCheck`
- `<sep-api-root>/README.md` documentando `git config core.hooksPath .githooks`

**Criterios de verificacao**
- Commit com codigo desformatado e bloqueado
- Mensagem de erro orienta o desenvolvedor a rodar `./gradlew spotlessApply`
- Bypass via `--no-verify` documentado mas desencorajado

**Pre-requisitos**
- Tasks 0.2 e 0.3 concluidas

**Dependencias**
- Spotless configurado (Task 0.2)

**Responsavel sugerido**
- Dev Senior (backend) + Dev Pleno Frontend 1 (frontend hooks)

---

### Task 0.5 - GitHub repo settings + templates

**Descricao**
Configurar a `main` como branch protegida, exigir PR review e CI verde. Criar templates de issue e PR.

**Arquivos esperados**
- `.github/PULL_REQUEST_TEMPLATE.md`
- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`
- `.github/CODEOWNERS` (opcional inicialmente)

**Configuracao manual no GitHub (documentar no README)**
- Branch protection na `main`: requer 1 review, requer CI passando, dismiss stale reviews
- Linear history (sem merge commits)
- Conventional Commits enforced via PR title check (futuro)

**Criterios de verificacao**
- PR aberto traz template populado
- Issue traz template selecionavel
- Push direto na `main` e bloqueado

**Pre-requisitos**
- Repositorio em GitHub

**Dependencias**
- nenhuma

**Responsavel sugerido**
- Dev Senior

---

### Task 0.6 - GitHub Actions CI minimo

**Descricao**
Criar pipeline CI que roda em cada PR e push para `main`: build, test, Spotless, JaCoCo. Sem deploy.

**Arquivos esperados**
- `.github/workflows/ci.yml`

**Configuracao recomendada**
```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: sep
          POSTGRES_PASSWORD: sep
          POSTGRES_DB: sep_test
        ports: [5432:5432]
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '21'
      - uses: gradle/actions/setup-gradle@v3
      - run: ./gradlew spotlessCheck build jacocoTestReport jacocoTestCoverageVerification
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: jacoco-report
          path: build/reports/jacoco/
```

**Criterios de verificacao**
- PR vermelho se Spotless falhar, build falhar, test falhar ou cobertura < 70%
- Relatorio JaCoCo disponivel como artifact
- Tempo total < 5 min

**Pre-requisitos**
- Tasks 0.2, 0.3 concluidas

**Dependencias**
- Repositorio em GitHub
- Gradle Wrapper definido

**Responsavel sugerido**
- Dev Senior

---

### Task 0.7 - Conventional Commits

**Descricao**
Documentar convencao de mensagens de commit baseada em Conventional Commits. Opcionalmente adicionar check no CI.

**Arquivos esperados**
- Secao em `CONTRIBUTING.md` ou no `README.md`
- `commitlint.config.js` (futuro, se adotado)

**Convencao**
- Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `build`, `ci`, `perf`
- Escopo opcional: `feat(usuarios): ...`, `fix(auth): ...`
- Footer: `BREAKING CHANGE:` quando aplicavel
- Idioma: portugues no body, ingles tecnico no tipo

**Criterios de verificacao**
- Documentacao acessivel no repositorio
- Time concorda com a convencao
- Commits novos seguem o padrao

**Pre-requisitos**
- nenhum

**Dependencias**
- nenhuma

**Responsavel sugerido**
- Dev Senior

---

### Task 0.8 - ADRs iniciais

**Descricao**
Criar a pasta `adr/` (ja criada) e migrar 5-7 decisoes mais relevantes do PRD para ADRs versionados. Manter PRD como fonte de visao do produto, ADRs como fonte de racional tecnico.

**Arquivos esperados**
- `adr/0000-template.md` (ja criado)
- `adr/0001-monolito-modular-orientado-a-ddd.md`
- `adr/0002-design-systems-apple-e-notion-com-scss-puro.md`
- `adr/0003-stack-angular-20-ionic-8-capacitor-6.md`
- `adr/0004-provider-pattern-para-integracoes-externas.md`
- `adr/0005-segregacao-patrimonial-via-conta-escrow.md`
- `adr/0006-mapstruct-substitui-modelmapper.md`
- `adr/0007-ddd-com-hexagonal-ports-and-adapters-por-modulo.md`

**Criterios de verificacao**
- Cada ADR segue o template (Status, Contexto, Decisao, Alternativas, Consequencias)
- Cross-refs do PRD para ADRs onde apropriado
- Equipe usa ADRs como referencia em discussoes futuras

**Pre-requisitos**
- ADR template (Task 0.0 ja feita)

**Dependencias**
- nenhuma

**Responsavel sugerido**
- Dev Senior

---

### Task 0.9 - Estrutura inicial de pacotes (sem codigo)

**Descricao**
Criar a arvore de pacotes do monolito modular DDD prevista no PRD §19, com `package-info.java` por modulo descrevendo a fronteira. Sem codigo de negocio, so estrutura.

**Arquivos esperados (preparados para Sprint 1)**
- `src/main/java/com/dynamis/sep_api/identity/{domain,application,infrastructure,web}/package-info.java`
- Mesmo padrao para `usuarios`, `onboarding`, `credito`, `contratos`, `cobranca`, `escrow`, `backoffice`, `financeiro`, `credores`, `pix`, `shared`
- Cada `package-info.java` documenta a responsabilidade do pacote

**Criterios de verificacao**
- Estrutura compila vazia
- Documentacao Javadoc gera index dos modulos

**Pre-requisitos**
- Sprint 1 Task 1.1 (projeto Gradle) — esta task pode ser executada DEPOIS da Sprint 1.1

**Dependencias**
- depende de Task 1.1 da Sprint 1

**Responsavel sugerido**
- Dev Senior

---

## Criterios de Pronto da Sprint 0

- [x] `.gitignore`, `.editorconfig`, `.gitattributes` aplicados e respeitados
- [x] Spotless configurado e rodando localmente + CI
- [x] JaCoCo configurado com target 70% (validacao desligada ate Sprint 4 ter cobertura)
- [x] Pre-commit hook rodando Spotless
- [x] Branch protection ativa
- [x] CI verde rodando build + test + Spotless + JaCoCo report
- [x] Conventional Commits documentado
- [x] ADR template + ADRs iniciais escritos (0001-0011 vivem em `docs-SEP/adr/`, referenciados pelo `sep-api/README.md`)
- [x] Estrutura de pacotes inicial criada (12 modulos x 4 layers = 48 `package-info.java`)

## Resultado da execucao

- **Data de conclusao**: 2026-05-04
- **Branch**: `sprint-0/hygiene-foundation` no repo `sep-api`
- **Commits** (7, em ordem):
  - `chore: adicionar meta-arquivos do repositorio` (Task 0.1)
  - `build: adicionar Gradle wrapper 8.10.2 com Spotless e JaCoCo` (bootstrap + Tasks 0.2 e 0.3)
  - `chore: adicionar pre-commit hook que roda Spotless` (Task 0.4)
  - `chore: adicionar templates de PR/issue e CODEOWNERS` (Task 0.5)
  - `ci: adicionar pipeline CI minimo (build + test + spotless + jacoco)` (Task 0.6)
  - `docs: adicionar CONTRIBUTING.md com Conventional Commits` (Task 0.7)
  - `chore: criar estrutura inicial de pacotes do monolito modular DDD` (Task 0.9)
- **Validacoes locais**: `./gradlew check` verde, `./gradlew javadoc` verde, hook pre-commit disparado nos 7 commits
- **Validacoes manuais (humano)**: build CI no GitHub verde, branch protection ativa, CODEOWNERS preenchido com `@mauriciofcjr`
- **Desvios do spec/steps**:
  - Workflow `.github/workflows/ci.yml` renomeado de `name: CI` para `name: CI-API` para diferenciar dos CIs futuros de `sep-app` e `sep-mobile`
  - `build.gradle` ainda nao inclui o plugin `org.springframework.boot` nem dependencias da aplicacao — esses entram na Sprint 1 Task 1.1b para evitar que o plugin Spring Boot exija main class antes da hora
  - `SepApiApplication.java` ficou como stub (final class privada) so para destravar `./gradlew javadoc`; ganhara `@SpringBootApplication` e `main` real na Sprint 1 Task 1.1b
  - ADRs nao foram duplicados no `sep-api`: vivem apenas em `docs-SEP/adr/` e o `sep-api/README.md` referencia via `../docs-SEP/adr/`

## Decisoes para validar antes da Sprint 0

- Confirmar que Palantir Java Format e a escolha (alternativas: Google Java Format, Spotless default)
- Confirmar uso de Git hooks puros vs ferramentas tipo Lefthook ou pre-commit (Python tool)
- Confirmar se queremos Conventional Commits enforcement automatico (commitlint) ja na Sprint 0 ou apenas documentacao

## Esforco estimado

- Total: 1-2 dias com Dev Senior trabalhando dedicado, ou 3-4 dias diluido com Sprints 1-2 paralelas
- Nada bloqueia Sprint 1 — Sprint 0 pode rodar em paralelo aos primeiros dias da Sprint 1, com a condicao de Spotless e CI estarem prontos antes do primeiro PR de codigo
