# Steps - Sprint 0 - Hygiene & Foundation

**Spec de origem**: [`specs/000-sprint-0-hygiene-foundation.md`](../../specs/000-sprint-0-hygiene-foundation.md)

**Objetivo geral**: estabelecer o terreno tecnico minimo (tooling, repo settings, ADRs, CI) antes da Sprint 1, sem deixar divida tecnica desde o primeiro PR.

**Esforco total estimado**: 1-2 dias de Dev Senior dedicado ou 3-4 dias paralelo a F-Sprint 0 do Frontend.

**Ordem de execucao recomendada** (dependencias entre tasks):
```
Task 0.1 (meta-arquivos)
  |
  +---> Task 0.7 (Conventional Commits — pode rodar em paralelo)
  |
  +---> Task 0.2 (Spotless) -----> Task 0.3 (JaCoCo) -----> Task 0.4 (pre-commit)
  |
  +---> Task 0.5 (GitHub repo) ---> Task 0.6 (CI)
  |
  +---> Task 0.8 (ADRs — ja feita) ✅
  |
  +---> Task 0.9 (estrutura de pacotes — depende da Task 1.1a da Sprint 1)
```

**Como usar este arquivo**:
1. Leia a Task que vai executar
2. Execute step a step na ordem
3. Em cada step, rode a verificacao antes de seguir
4. Ao final da Task, valide com a "Definicao de pronto" da task
5. Comite com a mensagem sugerida
6. Marque a task como concluida no checklist final

---

## Task 0.1 — Meta-arquivos do Repositorio

**Objetivo**: criar os 3 arquivos basicos de configuracao do repo (`.gitignore`, `.editorconfig`, `.gitattributes`).

**Pre-requisito**: repositorio Git inicializado em `C:/workspace-sep/`.

**Esforco**: 15-20 min.

### Step 0.1.1 — Criar `.gitignore`

**Arquivo**: `C:/workspace-sep/.gitignore`

**Conteudo:**
```gitignore
# ========================
# Java + Gradle
# ========================
*.class
*.jar
*.war
*.ear
*.nar
hs_err_pid*
replay_pid*

build/
.gradle/
gradle-app.setting
!gradle/wrapper/gradle-wrapper.jar
!gradle/wrapper/gradle-wrapper.properties

out/
target/
.gradle-cache/

# ========================
# IntelliJ IDEA
# ========================
.idea/
*.iml
*.iws
*.ipr
.idea_modules/

# ========================
# VS Code
# ========================
.vscode/*
!.vscode/settings.json.example
!.vscode/extensions.json

# ========================
# Eclipse
# ========================
.classpath
.project
.settings/
.metadata/
bin/
tmp/
*.tmp
*.bak
*.swp
*~.nib
local.properties
.loadpath
.recommenders/

# ========================
# NetBeans
# ========================
nbproject/private/
nbbuild/
nbdist/
.nb-gradle/

# ========================
# Node / Frontend (Angular, Ionic)
# ========================
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
.pnpm-store/

dist/
.angular/
.ng-build-cache/

*.tsbuildinfo
coverage/

# Playwright
test-results/
playwright-report/
.playwright-cache/

# Mobile (Capacitor)
android/
ios/
.capacitor/

# ========================
# Sistema operacional
# ========================
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
desktop.ini

# ========================
# Variaveis de ambiente / secrets
# ========================
.env
.env.local
.env.*.local
*.pem
*.key
secrets/
credentials.json

# ========================
# Logs
# ========================
*.log
logs/

# ========================
# Docker
# ========================
.docker/
postgres-data/
*-data/

# ========================
# Outros
# ========================
.history/
.cache/
```

**Verificacao:**
```bash
cd C:/workspace-sep
git status
# Espera: nao deve listar build/, .gradle/, .idea/, node_modules/ etc.
```

### Step 0.1.2 — Criar `.editorconfig`

**Arquivo**: `C:/workspace-sep/.editorconfig`

**Conteudo:**
```editorconfig
# EditorConfig: https://editorconfig.org/
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space

# Java: 4 espacos (padrao Spring/Spotless)
[*.java]
indent_size = 4
max_line_length = 120

# Gradle Groovy / Kotlin DSL
[*.{gradle,gradle.kts}]
indent_size = 4

# Frontend: 2 espacos
[*.{ts,js,html,scss,css,json,yml,yaml}]
indent_size = 2

# Markdown: preserva trailing whitespace
[*.md]
indent_size = 2
trim_trailing_whitespace = false
max_line_length = off

# Makefile usa tabs
[Makefile]
indent_style = tab

# SQL (Flyway)
[*.sql]
indent_size = 2
```

**Verificacao**: abrir arquivo `.java` e `.ts` no editor; confirmar indentacao automatica.

### Step 0.1.3 — Criar `.gitattributes`

**Arquivo**: `C:/workspace-sep/.gitattributes`

**Conteudo:**
```gitattributes
* text=auto eol=lf

*.java text eol=lf
*.gradle text eol=lf
*.kts text eol=lf
*.properties text eol=lf
*.yml text eol=lf
*.yaml text eol=lf
*.json text eol=lf
*.md text eol=lf
*.sql text eol=lf
*.html text eol=lf
*.ts text eol=lf
*.scss text eol=lf
*.css text eol=lf
*.sh text eol=lf
*.xml text eol=lf

*.bat text eol=crlf
*.cmd text eol=crlf

*.jar binary
*.war binary
*.ear binary
*.zip binary
*.tar.gz binary
*.png binary
*.jpg binary
*.jpeg binary
*.gif binary
*.ico binary
*.pdf binary
*.woff binary
*.woff2 binary
*.ttf binary
*.eot binary

*.gradle linguist-language=Groovy
*.kts linguist-language=Kotlin
docs-sep/** linguist-documentation
```

**Verificacao:**
```bash
git check-attr eol -- src/main/java/Foo.java
# Espera: src/main/java/Foo.java: eol: lf
```

### Step 0.1.4 — Renormalizar arquivos existentes (opcional)

```bash
cd C:/workspace-sep
git add --renormalize .
git status
git diff --check
```

Se houver mudancas, comitar:
```bash
git commit -m "chore: renormalizar line endings via .gitattributes"
```

### Definicao de pronto da Task 0.1
- [ ] `.gitignore` criado
- [ ] `.editorconfig` criado
- [ ] `.gitattributes` criado
- [ ] `git status` ignora artefatos
- [ ] Editor respeita `.editorconfig`

### Commit Task 0.1
```bash
git add .gitignore .editorconfig .gitattributes
git commit -m "chore: adicionar meta-arquivos do repositorio"
```

---

## Task 0.2 — Spotless + Palantir Java Format

**Objetivo**: configurar formatador automatico que falha build em codigo desformatado.

**Pre-requisito**: Sprint 1 Task 1.1a (projeto Gradle inicial) — pode rodar em paralelo com Sprint 1 inicio.

**Esforco**: 30 min.

### Step 0.2.1 — Adicionar plugin Spotless ao `build.gradle`

**Arquivo**: `C:/workspace-sep/build.gradle`

**Snippet (bloco plugins completo):**
```gradle
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.5.0'
    id 'io.spring.dependency-management' version '1.1.6'
    id 'com.diffplug.spotless' version '6.25.0'
    id 'jacoco'
}
```

**Verificacao:**
```bash
./gradlew tasks --group "verification" | grep -i spotless
# Espera: spotlessCheck, spotlessApply, spotlessJavaCheck
```

### Step 0.2.2 — Configurar bloco `spotless { }`

**Arquivo**: `C:/workspace-sep/build.gradle` (apos `dependencies { }`)

**Snippet:**
```gradle
spotless {
    java {
        target 'src/**/*.java'
        targetExclude 'build/generated/**', 'build/generated-sources/**'

        palantirJavaFormat('2.50.0')
        removeUnusedImports()
        importOrder('', 'java|javax', '\\#')
        endWithNewline()
        trimTrailingWhitespace()
    }

    groovyGradle {
        target '*.gradle', 'gradle/**/*.gradle'
        greclipse()
        endWithNewline()
        trimTrailingWhitespace()
    }

    format 'misc', {
        target '*.md', '*.yml', '*.yaml', '*.json', '.gitignore', '.editorconfig'
        targetExclude 'build/**', '.gradle/**', 'node_modules/**'
        trimTrailingWhitespace()
        endWithNewline()
        indentWithSpaces(2)
    }

    sql {
        target 'src/main/resources/db/migration/**/*.sql'
        dbeaver()
        endWithNewline()
    }
}
```

**Verificacao:**
```bash
./gradlew spotlessCheck
# Em projeto vazio passa.
```

### Step 0.2.3 — Adicionar `spotlessCheck` como dependencia de `check`

**Arquivo**: `C:/workspace-sep/build.gradle` (apos bloco spotless)

**Snippet:**
```gradle
check.dependsOn 'spotlessCheck'
```

**Verificacao:**
```bash
./gradlew check --dry-run | grep -i spotless
```

### Step 0.2.4 — Documentar comandos no README

**Arquivo**: `C:/workspace-sep/README.md`

**Adicionar secao:**
````markdown
## Code Style

Este projeto usa **Spotless + Palantir Java Format**.

```bash
# Verificar formatacao
./gradlew spotlessCheck

# Aplicar formatacao
./gradlew spotlessApply

# Verificar tudo (build + tests + spotless)
./gradlew check
```

### IDE
- **IntelliJ**: Settings → Editor → Code Style → Java → "Set from..." → Palantir Style
- **VS Code**: extension "Language Support for Java by Red Hat"
````

### Step 0.2.5 — Teste end-to-end de Spotless

```bash
# 1. Criar arquivo Java desformatado
mkdir -p src/main/java/com/dynamis/broker_app
cat > src/main/java/com/dynamis/broker_app/SpotlessTest.java << 'EOF'
package com.dynamis.broker_app;
public class SpotlessTest{
    public void   foo(  ){System.out.println("hi"  );}
}
EOF

# 2. Rodar spotlessCheck — deve falhar
./gradlew spotlessCheck
# Espera: BUILD FAILED com mensagem de violacao

# 3. Aplicar formatacao
./gradlew spotlessApply

# 4. Verificar — deve passar
./gradlew spotlessCheck
# Espera: BUILD SUCCESSFUL

# 5. Limpar
rm src/main/java/com/dynamis/broker_app/SpotlessTest.java
```

### Definicao de pronto da Task 0.2
- [ ] Plugin Spotless declarado com versao
- [ ] Bloco `spotless { }` configurado para Java/Gradle/MD/SQL
- [ ] `check.dependsOn 'spotlessCheck'` ativo
- [ ] README documenta comandos
- [ ] Teste end-to-end passou

### Commit Task 0.2
```bash
git add build.gradle README.md
git commit -m "chore: configurar Spotless + Palantir Java Format"
```

---

## Task 0.3 — JaCoCo com Target 70%

**Objetivo**: configurar relatorio de cobertura. Verificacao desligada inicialmente; ativada na Sprint 4.

**Pre-requisito**: Task 0.2 concluida.

**Esforco**: 20-30 min.

### Step 0.3.1 — Adicionar plugin JaCoCo

**Arquivo**: `C:/workspace-sep/build.gradle`

**Snippet (verificar presenca):**
```gradle
plugins {
    // ... outros
    id 'jacoco'
}
```

### Step 0.3.2 — Configurar bloco `jacoco { }` e `test { }`

**Arquivo**: `C:/workspace-sep/build.gradle`

**Snippet:**
```gradle
jacoco {
    toolVersion = '0.8.12'
}

test {
    useJUnitPlatform()
    finalizedBy jacocoTestReport
}
```

### Step 0.3.3 — Configurar `jacocoTestReport`

**Arquivo**: `C:/workspace-sep/build.gradle`

**Snippet:**
```gradle
jacocoTestReport {
    dependsOn test
    reports {
        html.required = true
        xml.required = true
        csv.required = false

        html.outputLocation = layout.buildDirectory.dir('reports/jacoco/html')
        xml.outputLocation = layout.buildDirectory.file('reports/jacoco/jacoco.xml')
    }

    afterEvaluate {
        classDirectories.setFrom(files(classDirectories.files.collect {
            fileTree(dir: it, exclude: [
                '**/BrokerAppApplication.class',
                '**/config/**',
                '**/dto/**',
                '**/*MapperImpl.class',
                '**/package-info.class',
                '**/exception/*Exception.class'
            ])
        }))
    }
}
```

**Verificacao:**
```bash
mkdir -p src/test/java/com/dynamis/broker_app
cat > src/test/java/com/dynamis/broker_app/SmokeTest.java << 'EOF'
package com.dynamis.broker_app;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertTrue;
class SmokeTest {
    @Test void smoke() { assertTrue(true); }
}
EOF

./gradlew test jacocoTestReport
# Espera: BUILD SUCCESSFUL + relatorio em build/reports/jacoco/html/
```

### Step 0.3.4 — Configurar `jacocoTestCoverageVerification` (DESATIVADA)

**Arquivo**: `C:/workspace-sep/build.gradle`

**Snippet:**
```gradle
jacocoTestCoverageVerification {
    dependsOn jacocoTestReport

    violationRules {
        rule {
            // ATIVAR na Sprint 4 (Task 4.3) quando cobertura distribuida estabilizar
            enabled = false

            limit {
                counter = 'LINE'
                value = 'COVEREDRATIO'
                minimum = 0.70
            }
        }

        rule {
            element = 'CLASS'
            includes = ['**.config.**', '**.dto.**']
            limit {
                counter = 'LINE'
                value = 'COVEREDRATIO'
                minimum = 0.0
            }
        }
    }
}

// NAO adicionar a check ainda; ativar na Sprint 4
// check.dependsOn 'jacocoTestCoverageVerification'
```

### Step 0.3.5 — Documentar no README

**Adicionar secao ao README.md:**
````markdown
## Cobertura de Testes

JaCoCo com target **70% por modulo** (validacao ativada na Sprint 4).

```bash
./gradlew test jacocoTestReport
start build/reports/jacoco/html/index.html  # Windows
```

### Exclusoes
- `BrokerAppApplication`, `config/**`, `dto/**`, `*MapperImpl`, `package-info`, excecoes simples
````

### Step 0.3.6 — Teste e limpeza

```bash
./gradlew clean test jacocoTestReport
ls build/reports/jacoco/html/index.html
rm src/test/java/com/dynamis/broker_app/SmokeTest.java
```

### Definicao de pronto da Task 0.3
- [ ] Plugin JaCoCo declarado
- [ ] `toolVersion = '0.8.12'`
- [ ] `jacocoTestReport` gera HTML + XML
- [ ] Exclusoes configuradas
- [ ] `jacocoTestCoverageVerification` configurado mas desligado
- [ ] Comentario "ATIVAR NA SPRINT 4" presente
- [ ] README atualizado

### Commit Task 0.3
```bash
git add build.gradle README.md
git commit -m "chore: configurar JaCoCo com target 70% (verificacao desligada ate Sprint 4)"
```

---

## Task 0.4 — Pre-commit Hooks

**Objetivo**: bloquear commits com codigo desformatado via Git hook chamando Spotless.

**Pre-requisito**: Tasks 0.2 e 0.3 concluidas.

**Esforco**: 20 min.

### Step 0.4.1 — Criar pasta `.githooks/`

**Comando:**
```bash
cd C:/workspace-sep
mkdir -p .githooks
```

### Step 0.4.2 — Criar hook `pre-commit`

**Arquivo**: `C:/workspace-sep/.githooks/pre-commit`

**Conteudo:**
```bash
#!/usr/bin/env bash
#
# Pre-commit hook do projeto SEP
# Bloqueia commit se Spotless detectar codigo desformatado.
#
# Para pular o hook (NAO RECOMENDADO):
#   git commit --no-verify
#

set -e

echo "🔍 Pre-commit: rodando Spotless..."

# Detecta se esta em Windows (Git Bash) ou Unix
if command -v ./gradlew.bat &> /dev/null; then
    GRADLEW="./gradlew.bat"
else
    GRADLEW="./gradlew"
fi

# Roda spotlessCheck
if ! $GRADLEW spotlessCheck --quiet; then
    echo ""
    echo "❌ Spotless detectou codigo desformatado."
    echo ""
    echo "Para corrigir automaticamente:"
    echo "  $GRADLEW spotlessApply"
    echo ""
    echo "Depois adicione e tente o commit novamente:"
    echo "  git add ."
    echo "  git commit"
    echo ""
    exit 1
fi

echo "✅ Spotless OK."
exit 0
```

**Tornar executavel (Linux/Mac):**
```bash
chmod +x .githooks/pre-commit
```

**No Windows**, o `git` respeita o shebang do arquivo via Git Bash; nao precisa `chmod`.

### Step 0.4.3 — Configurar Git para usar `.githooks/`

**Comando (executar uma vez por dev):**
```bash
cd C:/workspace-sep
git config core.hooksPath .githooks
```

**Verificacao:**
```bash
git config --get core.hooksPath
# Espera: .githooks
```

### Step 0.4.4 — Documentar setup no README

**Arquivo**: `C:/workspace-sep/README.md`

**Adicionar secao:**
````markdown
## Pre-commit Hooks

Este projeto usa Git hooks customizados em `.githooks/`. **Cada dev precisa configurar uma vez:**

```bash
git config core.hooksPath .githooks
```

O hook `pre-commit` roda `./gradlew spotlessCheck` antes de cada commit. Se o codigo estiver desformatado, o commit e bloqueado e voce ve a mensagem com o comando para corrigir.

### Para pular o hook (use com responsabilidade)
```bash
git commit --no-verify
```
````

### Step 0.4.5 — Adicionar verificacao ao README "Setup do desenvolvedor"

**Arquivo**: `README.md` (secao Getting Started, se existir)

**Adicionar checklist:**
```markdown
## Setup do desenvolvedor

Apos clonar o repositorio:

1. Instalar Java 21 LTS
2. Instalar Docker e Docker Compose
3. **Configurar pre-commit hook:** `git config core.hooksPath .githooks`
4. Rodar `./gradlew build` pela primeira vez
```

### Step 0.4.6 — Teste end-to-end do hook

```bash
# 1. Criar arquivo Java desformatado
cat > src/main/java/com/dynamis/broker_app/HookTest.java << 'EOF'
package com.dynamis.broker_app;
public class HookTest{public void  foo(){}}
EOF

# 2. Tentar commit — deve ser bloqueado
git add src/main/java/com/dynamis/broker_app/HookTest.java
git commit -m "test: hook test"
# Espera: "❌ Spotless detectou codigo desformatado." e commit nao acontece

# 3. Aplicar formatacao
./gradlew spotlessApply

# 4. Tentar commit de novo — deve passar
git add src/main/java/com/dynamis/broker_app/HookTest.java
git commit -m "test: hook test"
# Espera: "✅ Spotless OK." e commit feito

# 5. Reverter o teste
git reset --soft HEAD~1
rm src/main/java/com/dynamis/broker_app/HookTest.java
git add src/main/java/com/dynamis/broker_app/HookTest.java  # remove
```

### Definicao de pronto da Task 0.4
- [ ] Pasta `.githooks/` criada
- [ ] Arquivo `.githooks/pre-commit` com bash valido
- [ ] `git config core.hooksPath .githooks` executado pelo dev
- [ ] README documenta o setup
- [ ] Teste end-to-end: commit desformatado e bloqueado
- [ ] Teste end-to-end: commit formatado passa

### Commit Task 0.4
```bash
git add .githooks/pre-commit README.md
git commit -m "chore: adicionar pre-commit hook que roda Spotless"
```

### Observacoes
- **Frontend**: Husky + lint-staged sera configurado em [`specs/100-fsprint-0-setup-angular.md`](../../specs/100-fsprint-0-setup-angular.md). Os 2 hooks coexistem (Git hook backend + Husky frontend) sem conflito.
- **Hook em CI**: o CI (Task 0.6) tambem roda `spotlessCheck`, garantindo que mesmo commits com `--no-verify` sejam barrados na PR.

---

## Task 0.5 — GitHub Repo Settings + Templates

**Objetivo**: criar templates de PR/issue e documentar configuracoes manuais a fazer no GitHub web (branch protection, etc.).

**Pre-requisito**: nenhum (pode rodar a qualquer momento).

**Esforco**: 30 min (10 min arquivos + 20 min config manual no GitHub).

### Step 0.5.1 — Criar pasta `.github/`

```bash
cd C:/workspace-sep
mkdir -p .github/ISSUE_TEMPLATE
```

### Step 0.5.2 — Criar `PULL_REQUEST_TEMPLATE.md`

**Arquivo**: `C:/workspace-sep/.github/PULL_REQUEST_TEMPLATE.md`

**Conteudo:**
```markdown
## Descricao

<!-- Descreva o que esta PR faz e por que. Inclua link para issue/spec relevante. -->

Closes #

## Tipo de mudanca

<!-- Marque com x -->

- [ ] feat (nova funcionalidade)
- [ ] fix (correcao de bug)
- [ ] refactor (refatoracao sem mudanca de comportamento)
- [ ] docs (documentacao)
- [ ] test (testes)
- [ ] chore (build, ci, infra, dependencias)
- [ ] style (formatacao, sem mudanca de codigo)
- [ ] perf (performance)

## Spec / ADR / Step de origem

<!-- Cite o spec, ADR ou step que esta PR materializa -->

- Spec: `specs/00X-...md`
- Step: `specs/00X-steps/0.X.X-...`
- ADR (se aplicavel): `adr/000X-....md`

## Como testar

<!-- Passos manuais para validar a mudanca -->

1.
2.
3.

## Checklist

- [ ] Codigo segue Spotless (`./gradlew spotlessCheck` passa)
- [ ] Testes adicionados/atualizados (TDD)
- [ ] `./gradlew check` passa localmente
- [ ] JaCoCo nao regride
- [ ] Documentacao atualizada se necessario
- [ ] Cross-refs em PRD/CONTEXT/specs validadas se mudou decisao
- [ ] Conventional Commits respeitado nos commits desta PR
- [ ] Sem secrets/credentials no diff
```

### Step 0.5.3 — Criar template de bug report

**Arquivo**: `C:/workspace-sep/.github/ISSUE_TEMPLATE/bug_report.md`

**Conteudo:**
```markdown
---
name: Bug Report
about: Reportar um problema
title: '[BUG] '
labels: bug
assignees: ''
---

## Descricao

<!-- O que aconteceu? -->

## Comportamento esperado

<!-- O que deveria acontecer? -->

## Como reproduzir

1.
2.
3.

## Ambiente

- OS:
- Java version:
- Browser (se frontend):
- Branch / commit:

## Logs / screenshots

<!-- Cole logs ou anexe screenshots -->

## Spec relacionada

<!-- Link para spec ou PRD se relevante -->
```

### Step 0.5.4 — Criar template de feature request

**Arquivo**: `C:/workspace-sep/.github/ISSUE_TEMPLATE/feature_request.md`

**Conteudo:**
```markdown
---
name: Feature Request
about: Sugerir uma nova funcionalidade
title: '[FEAT] '
labels: enhancement
assignees: ''
---

## Problema / motivacao

<!-- Que dor essa feature resolve? -->

## Proposta

<!-- O que voce esta sugerindo? -->

## Alternativas consideradas

<!-- O que voce ja pensou e descartou? -->

## Impacto no roadmap

<!-- Esta feature se encaixa em qual Epic do PRD? -->

- Epic relacionada: Epic XX - Nome
- Modulo afetado: `<modulo>`

## Criterios de aceite

- [ ]
- [ ]
```

### Step 0.5.5 — Criar `CODEOWNERS` (opcional inicial)

**Arquivo**: `C:/workspace-sep/.github/CODEOWNERS`

**Conteudo:**
```
# CODEOWNERS — define quem e auto-atribuido como reviewer em cada area.
# Documentacao: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners

# Default: Dev Senior aprova qualquer PR
* @MAURICIO_GITHUB_USERNAME

# Frontend
apps/sep-frontend/ @FRONTEND_DEV_1_USERNAME @FRONTEND_DEV_2_USERNAME

# Specs e ADRs
specs/ @MAURICIO_GITHUB_USERNAME
adr/ @MAURICIO_GITHUB_USERNAME
```

**ATENCAO**: substituir `@MAURICIO_GITHUB_USERNAME` etc. por usernames GitHub reais antes de comitar.

### Step 0.5.6 — Configurar branch protection na `main` (manual no GitHub)

**Acao manual** — apos push do repositorio para o GitHub:

1. Abrir `https://github.com/<owner>/<repo>/settings/branches`
2. Clicar em "Add branch protection rule"
3. Branch name pattern: `main`
4. Marcar:
   - [x] Require a pull request before merging
     - [x] Require approvals (1 minimo)
     - [x] Dismiss stale pull request approvals when new commits are pushed
   - [x] Require status checks to pass before merging
     - [x] Require branches to be up to date before merging
     - Adicionar status checks (apos CI rodar pela primeira vez):
       - `build` (Task 0.6)
       - `Frontend CI / build` (Spec 100 — F-Sprint 0)
   - [x] Require conversation resolution before merging
   - [x] Require linear history
   - [ ] Require signed commits (opcional, recomendado)
   - [ ] Include administrators (recomendado para forcar Dev Senior tambem a usar PR)
5. Salvar

### Step 0.5.7 — Configurar geral do repo (manual)

**Acao manual:**

1. Em `Settings → General`:
   - **Default branch**: `main`
   - **Pull Requests**:
     - [x] Allow squash merging (default)
     - [ ] Allow merge commits (desativar)
     - [ ] Allow rebase merging (desativar)
     - [x] Always suggest updating pull request branches
     - [x] Automatically delete head branches
2. Em `Settings → Actions → General`:
   - Workflow permissions: "Read and write" se CI precisar comentar PR
3. Em `Settings → Code security and analysis`:
   - [x] Dependabot alerts
   - [x] Dependabot security updates
   - [x] Secret scanning

### Definicao de pronto da Task 0.5
- [ ] Pasta `.github/` criada
- [ ] `PULL_REQUEST_TEMPLATE.md` criado
- [ ] `.github/ISSUE_TEMPLATE/bug_report.md` criado
- [ ] `.github/ISSUE_TEMPLATE/feature_request.md` criado
- [ ] `CODEOWNERS` criado (com usernames placeholder ate ter usernames reais)
- [ ] Branch protection ativa na `main` (manual no GitHub)
- [ ] Repo settings configurados (squash merge, auto-delete branches)
- [ ] Dependabot ativado

### Commit Task 0.5
```bash
git add .github/
git commit -m "chore: adicionar templates de PR/issue e CODEOWNERS"
```

### Observacoes
- Branch protection so faz sentido apos repo estar publicado no GitHub
- `CODEOWNERS` precisa que os usuarios sejam membros/colaboradores do repo

---

## Task 0.6 — GitHub Actions CI Minimo

**Objetivo**: pipeline CI que roda em cada PR e push, executando build + test + Spotless + JaCoCo.

**Pre-requisito**: Tasks 0.2 e 0.3 concluidas.

**Esforco**: 30 min.

### Step 0.6.1 — Criar pasta `.github/workflows/`

```bash
cd C:/workspace-sep
mkdir -p .github/workflows
```

### Step 0.6.2 — Criar workflow `ci.yml`

**Arquivo**: `C:/workspace-sep/.github/workflows/ci.yml`

**Conteudo:**
```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

# Cancela runs antigos do mesmo PR/branch quando novos chegam
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  build:
    name: Build, Test, Spotless, JaCoCo
    runs-on: ubuntu-latest
    timeout-minutes: 15

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: sep
          POSTGRES_PASSWORD: sep
          POSTGRES_DB: sep_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Java 21
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '21'

      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@v3
        with:
          cache-read-only: ${{ github.ref != 'refs/heads/main' }}

      - name: Spotless check
        run: ./gradlew spotlessCheck

      - name: Build
        run: ./gradlew build -x test --no-daemon

      - name: Test (com Testcontainers)
        run: ./gradlew test --no-daemon
        env:
          SPRING_DATASOURCE_URL: jdbc:postgresql://localhost:5432/sep_test
          SPRING_DATASOURCE_USERNAME: sep
          SPRING_DATASOURCE_PASSWORD: sep

      - name: JaCoCo report
        if: always()
        run: ./gradlew jacocoTestReport --no-daemon

      - name: Upload JaCoCo report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: jacoco-report
          path: build/reports/jacoco/
          retention-days: 14

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: build/reports/tests/
          retention-days: 14

      # Quando ativar verificacao na Sprint 4, descomentar:
      # - name: JaCoCo verification (>= 70%)
      #   run: ./gradlew jacocoTestCoverageVerification --no-daemon
```

### Step 0.6.3 — Criar workflow opcional para validacao de Markdown

**Arquivo**: `C:/workspace-sep/.github/workflows/docs.yml` (opcional)

**Conteudo:**
```yaml
name: Docs Validation

on:
  pull_request:
    paths:
      - 'docs-sep/**'
      - 'specs/**'
      - 'adr/**'
      - '*.md'

jobs:
  lint-markdown:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4

      - name: Markdown lint
        uses: DavidAnson/markdownlint-cli2-action@v16
        with:
          globs: |
            docs-sep/**/*.md
            specs/**/*.md
            adr/**/*.md
            *.md
        continue-on-error: true  # nao bloqueia inicialmente; ativar depois
```

### Step 0.6.4 — Documentar CI no README

**Arquivo**: `C:/workspace-sep/README.md`

**Adicionar secao:**
````markdown
## Continuous Integration

PRs e push para `main` rodam:
- **Spotless check** — formato de codigo
- **Build** — compilacao com Gradle
- **Test** — JUnit 5 + Testcontainers (Postgres real)
- **JaCoCo** — relatorio de cobertura (verificacao 70% ativa apos Sprint 4)

Resultados ficam em **Actions** no GitHub. Relatorios JaCoCo ficam disponiveis como artifact por 14 dias.

### Branch protection
- `main` exige PR review + CI verde
- Squash merge apenas
- Branches deletadas automaticamente apos merge
````

### Step 0.6.5 — Teste end-to-end do CI (apos publicar no GitHub)

**Acao:**

```bash
# 1. Push do workflow
git add .github/workflows/
git commit -m "ci: adicionar pipeline CI minimo (build + test + spotless + jacoco)"
git push

# 2. Abrir PR de teste
git checkout -b test/ci
echo "# test" >> README.md
git add README.md
git commit -m "test: trigger CI"
git push -u origin test/ci

# 3. Abrir PR no GitHub e observar Actions executando
# 4. Apos verde, fechar PR sem merge
```

### Definicao de pronto da Task 0.6
- [ ] `.github/workflows/ci.yml` criado
- [ ] CI roda em PR e push para `main`
- [ ] Job `build` faz: checkout, Java 21, Gradle, Postgres service, Spotless, Build, Test, JaCoCo report
- [ ] Artifacts (JaCoCo, test results) sao publicados
- [ ] Concurrency cancel ativo
- [ ] Comentario lembrando "ATIVAR jacocoTestCoverageVerification na Sprint 4"
- [ ] Workflow opcional de docs criado (continue-on-error inicial)
- [ ] README atualizado
- [ ] PR de teste passou no CI

### Commit Task 0.6
```bash
git add .github/workflows/ README.md
git commit -m "ci: adicionar pipeline CI minimo (build + test + spotless + jacoco)"
```

### Observacoes
- **Custo**: GitHub Actions e gratis para repos publicos e tem cota generosa para privados (2000 min/mes em conta free, 3000 em Pro)
- **Postgres em CI**: usa service container `postgres:16`. Testcontainers tambem funciona dentro da Action.
- **Cache do Gradle**: `gradle/actions/setup-gradle@v3` cuida automaticamente.
- **Failures comuns**: Java version mismatch entre local e CI; sempre fixar Java 21 em ambos.
- **Deploy**: NAO incluso. Deploy fica para Epic 16 (Infraestrutura AWS).

---

## Task 0.7 — Conventional Commits + CONTRIBUTING

**Objetivo**: documentar a convencao de mensagens de commit e estabelecer um guia de contribuicao.

**Pre-requisito**: nenhum (pode rodar a qualquer momento).

**Esforco**: 20 min.

### Step 0.7.1 — Criar `CONTRIBUTING.md`

**Arquivo**: `C:/workspace-sep/CONTRIBUTING.md`

**Conteudo:**
```markdown
# Contribuindo para o Projeto SEP

## Antes de comecar

1. Leia o [PRD](docs-sep/PRD.md), o [CONTEXT](docs-sep/CONTEXT.md) e o [AGENT.md](AGENT.md)
2. Confirme o setup do dev:
   - Java 21 LTS instalado
   - Docker e Docker Compose funcionais
   - Pre-commit hook configurado: `git config core.hooksPath .githooks`
3. Pegue uma task em uma spec (`specs/0XX-...md`) ou abra uma issue

## Workflow de desenvolvimento

1. Crie uma branch a partir de `main`:
   ```bash
   git checkout -b feat/<modulo>/<descricao-curta>
   # ou: fix/<modulo>/<descricao-curta>
   ```

2. Implemente seguindo o spec/step correspondente
3. Rode localmente:
   ```bash
   ./gradlew spotlessApply  # auto-formatar
   ./gradlew check          # build + test + spotless
   ```
4. Commit com Conventional Commits (ver abaixo)
5. Abra PR usando o template
6. Aguarde 1 review aprovado + CI verde
7. Squash merge (configurado como default)

## Conventional Commits

Mensagens de commit seguem [Conventional Commits 1.0.0](https://www.conventionalcommits.org/pt-br/v1.0.0/).

### Formato

```
<tipo>(<escopo opcional>): <descricao em portugues, modo imperativo>

[body opcional]

[footer opcional]
```

### Tipos aceitos

| Tipo | Quando usar |
|------|-------------|
| `feat` | Nova funcionalidade visivel ao usuario |
| `fix` | Correcao de bug |
| `docs` | Apenas documentacao (PRD, README, ADR, spec, etc.) |
| `style` | Formatacao, sem mudanca de logica (whitespace, missing semi-colons) |
| `refactor` | Refatoracao sem mudanca de comportamento externo |
| `perf` | Melhoria de performance |
| `test` | Adicionar/corrigir testes |
| `build` | Mudancas no build system, dependencias |
| `ci` | Mudancas no GitHub Actions, configs de CI |
| `chore` | Outras tarefas (configs, infra menor, .gitignore) |
| `revert` | Reverter commit anterior |

### Escopo (opcional, mas recomendado)

Use o nome do modulo de dominio quando aplicavel:

- `feat(usuarios): adicionar endpoint de listagem`
- `fix(identity): corrigir validacao de claims JWT`
- `chore(spotless): atualizar para Palantir 2.50.1`
- `docs(prd): clarificar requisito de KYB`
- `test(escrow): adicionar teste de wallet duplicada`

### Exemplos

```
feat(usuarios): adicionar criacao publica de usuario
fix(auth): rejeitar tokens com claim sub vazia
docs(adr): adicionar ADR 0009 sobre observabilidade
chore: atualizar Spring Boot para 3.5.1
refactor(escrow): extrair MovimentacaoFactory
test(identity): cobrir cenario de token expirado
ci: adicionar cache Gradle no workflow
```

### Body e footer (opcionais)

```
feat(credito): integrar OpenFinanceProvider Celcoin

Implementa a primeira chamada para a API de Open Finance
da Celcoin via Finansystech. Adapter fica em
infrastructure.adapter.openfinance.

Closes #42
BREAKING CHANGE: parametro `cpfTomador` agora e obrigatorio
em CreditoApplicationDto.
```

### Breaking changes

Marque com `BREAKING CHANGE:` no footer ou `!` apos o tipo:
```
feat(usuarios)!: trocar formato do id para UUID v6
```

### Lingua

- **tipo**: ingles (`feat`, `fix`, etc.)
- **escopo**: nome do modulo em ingles ou portugues, conforme nome do pacote
- **descricao + body**: portugues (pt-BR), modo imperativo, primeira letra minuscula, sem ponto final

### Validacao automatica (futura)

A validacao de Conventional Commits sera adicionada ao CI futuramente via [commitlint](https://commitlint.js.org/). Por enquanto e responsabilidade do dev.

## Code Style

Ver [README - Code Style](README.md#code-style).

## Testes

TDD distribuido: cada Sprint entrega testes correspondentes ao escopo. JaCoCo sera ativado na Sprint 4 com target 70%.

```bash
./gradlew test
./gradlew test jacocoTestReport
```

## Pull Requests

Use o template em `.github/PULL_REQUEST_TEMPLATE.md`. Antes de pedir review:
- [ ] CI verde
- [ ] Spec/step de origem citado no PR
- [ ] Testes adicionados se for codigo
- [ ] Cross-refs validados se mudou decisao

## Duvidas

Abra uma issue ou consulte:
- [PRD](docs-sep/PRD.md) - visao do produto
- [CONTEXT](docs-sep/CONTEXT.md) - historia das decisoes
- [ADRs](adr/) - decisoes arquiteturais
- [Specs](specs/) - especificacoes por sprint
- [AGENT.md](AGENT.md) - orientacao para agentes IA
```

### Step 0.7.2 — Documentar referencia rapida no README

**Arquivo**: `C:/workspace-sep/README.md`

**Adicionar secao:**
````markdown
## Conventional Commits

Mensagens de commit seguem [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/). Ver [CONTRIBUTING.md](CONTRIBUTING.md) para detalhes.

```
feat(usuarios): adicionar criacao publica
fix(auth): rejeitar token com sub vazia
docs(adr): adicionar ADR 0009
chore: atualizar Spring Boot 3.5.1
```
````

### Step 0.7.3 — Decidir sobre commitlint (opcional)

**Acao**: documentar como follow-up. Por enquanto fica responsabilidade do dev.

**Adicionar a `CONTRIBUTING.md` ou abrir issue:**

> **TODO follow-up**: avaliar adicao de [commitlint](https://commitlint.js.org/) com husky para enforcar Conventional Commits no pre-commit hook. Decisao pendente: o overhead vale para um time de 3 devs?

### Definicao de pronto da Task 0.7
- [ ] `CONTRIBUTING.md` criado
- [ ] Conventional Commits documentado com tipos, escopos e exemplos
- [ ] README tem referencia rapida + link para CONTRIBUTING
- [ ] Time foi avisado da convencao (mensagem no Slack/email)

### Commit Task 0.7
```bash
git add CONTRIBUTING.md README.md
git commit -m "docs: adicionar CONTRIBUTING.md com Conventional Commits"
```

### Observacoes
- **Por que portugues no body?**: equipe e brasileira, melhora leitura. Tipo em ingles porque e padrao da convencao e ferramentas (commitlint, semantic-release) o esperam.
- **Validacao automatica**: pode entrar via `commitlint` + Husky depois. Por enquanto fica como expectativa cultural.

---

## Task 0.8 — ADRs Iniciais

**Objetivo**: criar a pasta `adr/` com template + 5-7 ADRs migrados das principais decisoes do PRD.

**Status**: ✅ **JA CONCLUIDA** durante a aplicacao do plano de melhorias.

**Verificacao:**
```bash
ls C:/workspace-sep/adr/
# Espera ver:
# 0000-template.md
# 0001-monolito-modular-orientado-a-ddd.md
# 0002-design-systems-apple-e-notion-com-scss-puro.md
# 0003-stack-angular-20-ionic-8-capacitor-6.md
# 0004-provider-pattern-para-integracoes-externas.md
# 0005-segregacao-patrimonial-via-conta-escrow.md
# 0006-mapstruct-substitui-modelmapper.md
# 0007-ddd-com-hexagonal-ports-and-adapters-por-modulo.md
```

### Definicao de pronto da Task 0.8
- [x] Pasta `adr/` existe
- [x] Template `0000-template.md` presente
- [x] 7 ADRs iniciais criados (0001-0007)
- [x] Cross-refs do PRD para ADRs presentes (PRD §11, §18, §27)

### Observacoes
- ADRs sao **imutaveis** apos aceitos. Para mudar, criar novo ADR que substitua o anterior (registrar em "Substituido por").
- Quando adicionar um novo ADR durante o projeto, lembrar de:
  1. Numerar sequencialmente (proximo seria `0008`)
  2. Cross-ref no PRD §18 ("Decisoes registradas em ADR")
  3. Citar no commit (`docs(adr): adicionar ADR 0009 sobre X`)

---

## Task 0.9 — Estrutura Inicial de Pacotes DDD

**Objetivo**: criar a arvore de pacotes do monolito modular DDD com `package-info.java` por modulo, sem codigo de negocio.

**Pre-requisito**: Task 1.1a (projeto Gradle inicial) executada — esta task esta na fronteira entre Sprint 0 e Sprint 1.

**Esforco**: 1 hora.

### Step 0.9.1 — Definir os 12 modulos e 4 sub-pacotes

**Lista dos 12 modulos** (PRD §19):
- `identity`, `usuarios`, `onboarding`, `credito`, `contratos`, `cobranca`, `escrow`, `backoffice`, `financeiro`, `credores`, `pix`, `shared`

**4 sub-pacotes por modulo** (Hexagonal/Ports & Adapters):
- `domain`, `application`, `infrastructure`, `web`

**Total**: 12 × 4 = **48 pacotes**, cada um com seu `package-info.java`.

### Step 0.9.2 — Criar script para gerar a estrutura

**Arquivo**: `C:/workspace-sep/scripts/create-package-structure.sh` (opcional, agiliza)

**Conteudo:**
```bash
#!/usr/bin/env bash
set -e

BASE_DIR="src/main/java/com/dynamis/broker_app"
MODULES=("identity" "usuarios" "onboarding" "credito" "contratos" "cobranca" "escrow" "backoffice" "financeiro" "credores" "pix" "shared")
LAYERS=("domain" "application" "infrastructure" "web")

for module in "${MODULES[@]}"; do
    for layer in "${LAYERS[@]}"; do
        DIR="$BASE_DIR/$module/$layer"
        mkdir -p "$DIR"
        echo "Criando $DIR/package-info.java..."
    done
done

echo ""
echo "Estrutura criada. Agora preencha cada package-info.java conforme Step 0.9.3."
```

**Tornar executavel:**
```bash
chmod +x scripts/create-package-structure.sh
./scripts/create-package-structure.sh
```

### Step 0.9.3 — Criar `package-info.java` para cada modulo (template)

**Acao**: para cada um dos 12 modulos × 4 layers = 48 arquivos, criar `package-info.java` com Javadoc descrevendo a responsabilidade.

**Exemplo para `identity`** (replicar para outros modulos com adaptacao):

#### `identity/domain/package-info.java`
```java
/**
 * Modulo Identity - Camada de Dominio.
 *
 * <p>Contem entidades, value objects, enums, sealed types e regras centrais
 * relacionadas a identidade e autenticacao do usuario.
 *
 * <p>Responsabilidade: representar quem e o usuario autenticado, suas roles,
 * suas credenciais (sem expor implementacao de hash) e seus papeis no sistema.
 *
 * <p>Sem dependencias de Spring, JPA ou frameworks de infraestrutura.
 *
 * @see com.dynamis.broker_app.identity.application
 * @see com.dynamis.broker_app.identity.infrastructure
 */
package com.dynamis.broker_app.identity.domain;
```

#### `identity/application/package-info.java`
```java
/**
 * Modulo Identity - Camada de Aplicacao.
 *
 * <p>Casos de uso de autenticacao e autorizacao: login, validacao de token,
 * extracao de principal autenticado.
 *
 * <p>Expoe portas de saida em {@code application.port.out} para integracoes
 * externas seguindo o Provider Pattern (ADR 0004).
 *
 * @see com.dynamis.broker_app.identity.domain
 * @see com.dynamis.broker_app.identity.infrastructure
 */
package com.dynamis.broker_app.identity.application;
```

#### `identity/infrastructure/package-info.java`
```java
/**
 * Modulo Identity - Camada de Infraestrutura.
 *
 * <p>Implementacoes concretas das portas de saida, integracoes com Spring Security,
 * configuracao de filtros JWT e adapters externos quando aplicavel.
 *
 * @see com.dynamis.broker_app.identity.application
 */
package com.dynamis.broker_app.identity.infrastructure;
```

#### `identity/web/package-info.java`
```java
/**
 * Modulo Identity - Camada Web.
 *
 * <p>Controllers REST de autenticacao, DTOs (records) e MapStruct mappers
 * deste modulo.
 *
 * <p>Endpoints expostos: {@code POST /api/v1/auth/login},
 * {@code GET /api/v1/auth/me}.
 *
 * @see com.dynamis.broker_app.identity.application
 */
package com.dynamis.broker_app.identity.web;
```

### Step 0.9.4 — Tabela de responsabilidades por modulo (referencia)

| Modulo | Responsabilidade resumida |
|--------|---------------------------|
| `identity` | Autenticacao, JWT, senha, roles, permissoes, usuario autenticado |
| `usuarios` | Cadastro de usuario, perfil inicial, ownership, dados basicos |
| `onboarding` | KYC/KYB, documentos, validacoes cadastrais (consome `KycProvider`/`KybProvider`) |
| `credito` | Proposta, analise de credito, parecer, decisao (pode consumir `OpenFinanceProvider`) |
| `contratos` | Formalizacao, aceite, assinatura, status contratual (consome `AssinaturaDigitalProvider`) |
| `cobranca` | Parcelas, vencimentos, cobranca, inadimplencia (consome `escrow`) |
| `escrow` | Conta escrow, wallets, movimentacoes — segregacao patrimonial obrigatoria (CMN 4.656/2018) |
| `backoffice` | Filas, pendencias, excecoes, comentarios, reprocessos |
| `financeiro` | Conciliacao, controles internos, visao operacional financeira |
| `credores` | Jornada da empresa credora, carteira, aportes, operacoes financiadas (consome `escrow`) |
| `pix` | Movimentacao Pix, webhooks, conciliacao, status (consome `PixProvider` e `escrow`) |
| `shared` | Excecoes, auditoria, configuracoes transversais, `ApiExceptionHandler`, `ErrorResponseDto`, base de adapters HTTP, Webhook Receiver, utilitarios |

**Use essa tabela** ao escrever cada `package-info.java` — adapte o exemplo de `identity` para cada modulo.

### Step 0.9.5 — Verificacao da estrutura

```bash
# Listar a estrutura criada
find src/main/java/com/dynamis/broker_app -name "package-info.java" | sort

# Espera 48 linhas, uma para cada combinacao modulo/layer
# Exemplo:
# src/main/java/com/dynamis/broker_app/backoffice/application/package-info.java
# src/main/java/com/dynamis/broker_app/backoffice/domain/package-info.java
# ... etc
```

### Step 0.9.6 — Verificacao de compilacao

```bash
./gradlew compileJava
# Espera: BUILD SUCCESSFUL (estrutura compila vazia)
```

### Step 0.9.7 — Gerar Javadoc para validar

```bash
./gradlew javadoc
# Espera: BUILD SUCCESSFUL
# Abrir build/docs/javadoc/index.html para ver os modulos documentados
```

### Definicao de pronto da Task 0.9
- [ ] 12 modulos criados (`identity` a `shared`)
- [ ] 4 sub-pacotes por modulo (`domain`, `application`, `infrastructure`, `web`)
- [ ] 48 arquivos `package-info.java` com Javadoc
- [ ] `./gradlew compileJava` passa
- [ ] `./gradlew javadoc` gera index com todos os modulos

### Commit Task 0.9
```bash
git add src/main/java/com/dynamis/broker_app/
git commit -m "chore: criar estrutura inicial de pacotes do monolito modular DDD"
```

### Observacoes
- A estrutura sera populada incrementalmente nas Sprints 1-4 e Epics 5+
- `package-info.java` ajuda a documentar fronteiras DDD e aparece no Javadoc
- Sub-pacotes mais profundos (`application/usecase`, `application/port/out`, `infrastructure/adapter`) sao criados sob demanda quando o codigo aparecer

---

## Definicao de Pronto da Sprint 0 (consolidada)

A Sprint 0 esta concluida quando todas as 9 tasks estiverem com checklist completo:

- [ ] **Task 0.1** — meta-arquivos criados e respeitados
- [ ] **Task 0.2** — Spotless rodando localmente + check
- [ ] **Task 0.3** — JaCoCo configurado (verificacao desligada ate Sprint 4)
- [ ] **Task 0.4** — pre-commit hook bloqueando codigo desformatado
- [ ] **Task 0.5** — repo GitHub configurado (branch protection + templates)
- [ ] **Task 0.6** — CI verde rodando build + test + Spotless + JaCoCo
- [ ] **Task 0.7** — Conventional Commits documentado em CONTRIBUTING.md
- [x] **Task 0.8** — ADRs iniciais (ja concluida — 7 ADRs em `adr/`)
- [ ] **Task 0.9** — estrutura de pacotes DDD com 48 `package-info.java`

## Estado esperado do repositorio apos Sprint 0

```
C:/workspace-sep/
├── .editorconfig
├── .gitattributes
├── .gitignore
├── .githooks/
│   └── pre-commit
├── .github/
│   ├── CODEOWNERS
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── workflows/
│       ├── ci.yml
│       └── docs.yml
├── adr/                                  # ja existe
│   ├── 0000-template.md
│   └── 0001-...md ate 0007-...md
├── build.gradle                          # com Spotless + JaCoCo
├── settings.gradle                       # criado em Sprint 1 Task 1.1a
├── gradle/wrapper/                       # criado em Sprint 1 Task 1.1a
├── gradlew, gradlew.bat                  # criado em Sprint 1 Task 1.1a
├── docs-sep/                             # ja existe
├── specs/                                # ja existe
├── src/main/java/com/dynamis/broker_app/ # 48 package-info.java
├── AGENT.md                             # ja existe
├── CONTRIBUTING.md
├── README.md                             # atualizado com secoes Sprint 0
└── scripts/
    └── create-package-structure.sh       # opcional
```

## Proximos passos apos Sprint 0

1. **Sprint 1** — comeca com [`specs/001-sprint-1-fundacao-tecnica.md`](../../specs/001-sprint-1-fundacao-tecnica.md). Antes, gerar `steps/001-sprint-1-steps.md` seguindo o mesmo padrao deste arquivo.
2. **F-Sprint 0 Frontend** — em paralelo, comecar [`specs/100-fsprint-0-setup-angular.md`](../../specs/100-fsprint-0-setup-angular.md) (escopo dos Devs Plenos Frontend). As proximas F-Sprints estao em `specs/101` a `specs/104`.

## Referencias
- [Spec 000](../../specs/000-sprint-0-hygiene-foundation.md) — descricao alta das tasks
- [PRD §11, §18, §22](../../docs-sep/PRD.md) — stack, decisoes consolidadas, backlog
- [AGENT.md](../../AGENT.md) — orientacao para agentes
- [CONTRIBUTING.md](../../CONTRIBUTING.md) — Conventional Commits e workflow
- ADRs [0001](../../adr/0001-monolito-modular-orientado-a-ddd.md) a [0007](../../adr/0007-ddd-com-hexagonal-ports-and-adapters-por-modulo.md)
