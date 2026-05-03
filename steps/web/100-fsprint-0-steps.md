# Steps - F-Sprint 0 - Setup Angular + Tooling

**Spec de origem**: [`specs/100-fsprint-0-setup-angular.md`](../../specs/100-fsprint-0-setup-angular.md)

**Objetivo geral**: inicializar o projeto Angular 20.x (Standalone Components + Signals + SCSS + strict) e configurar todo o tooling de qualidade (lint, format, hooks, testes, MSW, CI) **antes** de escrever qualquer tela ou componente. Espelha a Sprint 0 backend para o frontend.

**Esforco total estimado**: 2-3 dias de Dev Pleno Frontend dedicado, ou 4-5 dias dividido entre os dois Devs Plenos.

**Workspace root**: `C:/workspace-sep/` (mantida a convencao do `steps/000-sprint-0-steps.md`; em Linux/macOS, substituir pelo equivalente local).

**Localizacao do projeto Angular**: `C:/workspace-sep/apps/sep-frontend/` (subpasta dedicada, deixando o root livre para o backend Gradle e demais artefatos do monorepo).

**Ordem de execucao recomendada** (dependencias entre tasks):

```
F-0.1 (scaffold Angular)
  |
  +---> F-0.2 (lint/format/hooks)
  |        |
  |        +---> F-0.3 (Vitest + Playwright + MSW)
  |                  |
  |                  +---> F-0.4 (GitHub Actions Frontend CI)
```

- F-0.1 e raiz.
- F-0.2 depende de F-0.1.
- F-0.3 depende de F-0.1 e F-0.2.
- F-0.4 depende de F-0.1, F-0.2 e F-0.3.

**Como usar este arquivo**:
1. Leia a Task que vai executar.
2. Execute step a step na ordem.
3. Em cada step, rode a verificacao antes de seguir.
4. Ao final da Task, valide com a "Definicao de pronto" da task.
5. Comite com a mensagem sugerida (Conventional Commits, ja preparado na Sprint 0 backend).
6. Marque a task como concluida no checklist final.

**Pre-requisitos globais**:
- Node.js LTS `>= 20.x` instalado (`node -v` deve retornar `v20.x.x` ou superior)
- npm `>= 10.x` (`npm -v`)
- Git inicializado em `C:/workspace-sep/`
- Sprint 0 backend ja criou `.gitignore`, `.editorconfig`, `.gitattributes`, branch protection e Conventional Commits documentados em `CONTRIBUTING.md`
- PRD aprovado e design systems Apple/Notion definidos em `docs-sep/`

---

## Task F-0.1 — Scaffold Angular 20.x

**Objetivo**: criar o projeto Angular 20.x com Standalone Components, Signals, SCSS e estrutura modular por feature, ja organizada para a fronteira de design system (publica/Apple vs autenticada/Notion).

**Pre-requisito**: Node.js LTS `>= 20.x`.

**Esforco**: 30-45 min.

### Step 100.1.1 — Criar a pasta `apps/`

**Comando**:
```bash
cd C:/workspace-sep
mkdir -p apps
```

**Verificacao**:
```bash
ls -la apps
# Espera: pasta vazia criada
```

### Step 100.1.2 — Gerar o projeto com Angular CLI 20

**Comando**:
```bash
cd C:/workspace-sep/apps
npx @angular/cli@20 new sep-frontend \
  --standalone \
  --style=scss \
  --routing \
  --strict \
  --skip-tests \
  --skip-git \
  --package-manager=npm
```

**Flags explicadas**:
- `--standalone` → sem `NgModule`, todos os componentes standalone (PRD §11)
- `--style=scss` → SCSS puro, sem framework CSS (PRD §11, ADR 0002)
- `--routing` → cria `app.routes.ts` (necessario para guards futuros)
- `--strict` → TypeScript strict mode (`noImplicitAny`, `strictNullChecks`, etc.)
- `--skip-tests` → nao gera arquivos `.spec.ts` no scaffold; testes vamos configurar com Vitest na F-0.3
- `--skip-git` → nao cria git init (o repo raiz ja tem git)
- `--package-manager=npm` → padronizar com a Sprint 0 backend e CI

**Verificacao**:
```bash
ls -la C:/workspace-sep/apps/sep-frontend
# Espera: package.json, angular.json, tsconfig*.json, src/, public/
cat C:/workspace-sep/apps/sep-frontend/package.json | grep '"@angular/core"'
# Espera: "^20.x.y"
```

### Step 100.1.3 — Confirmar versao Angular instalada

**Comando**:
```bash
cd C:/workspace-sep/apps/sep-frontend
npx ng version
```

**Espera**:
```
Angular CLI: 20.x.x
Node: 20.x.x
Package Manager: npm 10.x.x
Angular: 20.x.x
```

Se o Angular CLI instalou versao `< 20`, abortar e investigar — o PRD trava o baseline em `20.x` (AGENT.md, ADR 0003).

### Step 100.1.4 — Validar TypeScript strict

**Arquivo**: `apps/sep-frontend/tsconfig.json`

**Conferir** que possui (ja vem do `--strict`):
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true
  }
}
```

**Verificacao**:
```bash
cd C:/workspace-sep/apps/sep-frontend
npx tsc --noEmit
# Espera: zero erros
```

### Step 100.1.5 — Criar a estrutura de pastas DDD/feature

A spec exige separacao entre superficies publicas (Apple) e autenticadas (Notion).

**Comandos**:
```bash
cd C:/workspace-sep/apps/sep-frontend/src/app

mkdir -p core/{auth,http,config,guards,interceptors}
mkdir -p shared/{components,directives,pipes,models,utils}
mkdir -p layout/{public-shell,authenticated-shell}
mkdir -p features/public
mkdir -p features/authenticated
```

**Comandos para a pasta de styles**:
```bash
cd C:/workspace-sep/apps/sep-frontend/src
mkdir -p styles
touch styles/_tokens.scss
touch styles/_apple.scss
touch styles/_notion.scss
touch styles/_mixins.scss
touch styles/index.scss
```

**Conteudo inicial** de `apps/sep-frontend/src/styles/index.scss` (placeholder, F-Sprint 1 vai popular):
```scss
// Indice central de estilos globais.
// Os tokens reais vem na F-Sprint 1 (specs/101-fsprint-1-design-tokens-showcase.md).

@use "tokens" as *;
@use "mixins" as *;
@use "apple" as *;
@use "notion" as *;
```

**Conteudo placeholder** dos demais (apenas comentario para o build nao quebrar):
```scss
// _tokens.scss — populado na F-Sprint 1
// _apple.scss — populado na F-Sprint 1 (superficies publicas)
// _notion.scss — populado na F-Sprint 1 (superficies autenticadas)
// _mixins.scss — populado na F-Sprint 1
```

### Step 100.1.6 — Plugar `styles/index.scss` no build

**Arquivo**: `apps/sep-frontend/angular.json`

**Localizar** `projects.sep-frontend.architect.build.options.styles` e ajustar:
```json
"styles": [
  "src/styles/index.scss",
  "src/styles.scss"
]
```

**Verificacao**:
```bash
cd C:/workspace-sep/apps/sep-frontend
npm run build
# Espera: BUILD SUCCESSFUL, com warnings somente se houver
```

### Step 100.1.7 — Subir o dev server

**Comando**:
```bash
cd C:/workspace-sep/apps/sep-frontend
npm run start
```

**Verificacao**:
- Abrir `http://localhost:4200/` no navegador
- Espera: pagina default do Angular (logo + welcome)
- Console do navegador sem erros

Encerrar com `Ctrl+C` apos confirmar.

### Step 100.1.8 — Atualizar `.gitignore` raiz para a pasta `apps/`

A Sprint 0 backend ja cobriu `node_modules/`, `dist/`, `.angular/` etc. genericamente. Confirmar que continua valido com a nova subpasta:

**Verificacao**:
```bash
cd C:/workspace-sep
echo "test" > apps/sep-frontend/dist/foo.txt 2>/dev/null || true
git status
# Espera: dist/ NAO listado em "untracked"
rm -rf apps/sep-frontend/dist
```

Se `dist/` aparecer no `git status`, ajustar o `.gitignore` raiz adicionando:
```gitignore
apps/*/dist/
apps/*/.angular/
apps/*/node_modules/
```

### Definicao de pronto da Task F-0.1
- [ ] `apps/sep-frontend/` criado
- [ ] `npx ng version` reporta Angular `20.x`
- [ ] `npm run start` sobe em `http://localhost:4200/`
- [ ] `npm run build` passa
- [ ] TypeScript strict mode ativo (`tsc --noEmit` sem erros)
- [ ] Standalone Components configurados (sem `app.module.ts`; `app.config.ts` no lugar)
- [ ] Estrutura de pastas `core/`, `shared/`, `layout/`, `features/{public,authenticated}` criada
- [ ] Pasta `src/styles/` com placeholders dos arquivos SCSS
- [ ] `.gitignore` raiz cobre artefatos do Angular

### Commit Task F-0.1
```bash
git add apps/sep-frontend
git add .gitignore  # se ajustado
git commit -m "chore(frontend): scaffold inicial Angular 20.x com SCSS e estrutura DDD"
```

---

## Task F-0.2 — Tooling: ESLint + Prettier + Stylelint + Husky + lint-staged

**Objetivo**: configurar lint/format/hooks de qualidade frontend, espelhando o que Spotless faz para Java na Sprint 0 backend. Cada commit deve sair com codigo formatado e lintado.

**Pre-requisito**: Task F-0.1 concluida.

**Esforco**: 1-2 horas.

### Step 100.2.1 — Instalar Angular ESLint (flat config)

**Comando**:
```bash
cd C:/workspace-sep/apps/sep-frontend
npx ng add @angular-eslint/schematics --skip-confirmation
```

Este schematic ja:
- Adiciona `eslint`, `@angular-eslint/*`, `@typescript-eslint/*`
- Cria `eslint.config.js` na raiz do projeto Angular (flat config moderno do ESLint 9)
- Cria target `lint` em `angular.json`

**Verificacao**:
```bash
cd C:/workspace-sep/apps/sep-frontend
npx eslint --version
# Espera: v9.x
ls eslint.config.js
# Espera: arquivo presente
npm run lint
# Espera: passa sem erros (codigo do scaffold ja vem limpo)
```

### Step 100.2.2 — Instalar Prettier + integracao com ESLint

**Comando**:
```bash
cd C:/workspace-sep/apps/sep-frontend
npm install --save-dev prettier@^3 eslint-config-prettier@^9
```

**Arquivo**: `apps/sep-frontend/.prettierrc.json`
```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "quoteProps": "as-needed",
  "trailingComma": "all",
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "overrides": [
    {
      "files": "*.html",
      "options": {
        "parser": "angular"
      }
    },
    {
      "files": "*.scss",
      "options": {
        "singleQuote": false
      }
    }
  ]
}
```

**Arquivo**: `apps/sep-frontend/.prettierignore`
```
dist
.angular
coverage
node_modules
*.lock
```

### Step 100.2.3 — Plugar Prettier no `eslint.config.js`

**Arquivo**: `apps/sep-frontend/eslint.config.js`

Adicionar o `eslint-config-prettier` no fim do array de configs para desligar regras conflitantes com Prettier:

```js
// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const prettier = require('eslint-config-prettier');

module.exports = tseslint.config(
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
      prettier,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'sep', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'sep', style: 'kebab-case' },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {},
  },
);
```

**Nota** sobre o prefixo `sep`: alinhado ao dominio do produto (SEP = Sociedade de Emprestimo entre Pessoas), substitui o default `app-`.

**Verificacao**:
```bash
cd C:/workspace-sep/apps/sep-frontend
npm run lint
# Espera: passa
npx prettier --check "src/**/*.{ts,html,scss,json}"
# Espera: All matched files use Prettier code style!
```

### Step 100.2.4 — Adicionar npm scripts de format

**Arquivo**: `apps/sep-frontend/package.json` — secao `scripts`:
```json
{
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "watch": "ng build --watch --configuration development",
    "lint": "ng lint",
    "format": "prettier --write \"src/**/*.{ts,html,scss,json}\"",
    "format:check": "prettier --check \"src/**/*.{ts,html,scss,json}\""
  }
}
```

(Os scripts `test`, `e2e` e MSW vao ser adicionados na Task F-0.3.)

### Step 100.2.5 — Instalar e configurar Stylelint

**Comando**:
```bash
cd C:/workspace-sep/apps/sep-frontend
npm install --save-dev \
  stylelint@^16 \
  stylelint-config-standard-scss@^14 \
  stylelint-config-prettier-scss@^1
```

**Arquivo**: `apps/sep-frontend/.stylelintrc.json`
```json
{
  "extends": [
    "stylelint-config-standard-scss",
    "stylelint-config-prettier-scss"
  ],
  "rules": {
    "selector-class-pattern": [
      "^[a-z][a-zA-Z0-9-]*$",
      {
        "message": "Use kebab-case ou camelCase para classes (ex.: .login-form, .btnPrimary)"
      }
    ],
    "scss/at-import-partial-extension": null,
    "no-descending-specificity": null,
    "scss/dollar-variable-pattern": "^[a-z][a-zA-Z0-9-]*$"
  },
  "ignoreFiles": [
    "dist/**/*",
    ".angular/**/*",
    "coverage/**/*",
    "node_modules/**/*"
  ]
}
```

**Adicionar script** ao `package.json`:
```json
{
  "scripts": {
    "lint:scss": "stylelint \"src/**/*.scss\"",
    "lint:scss:fix": "stylelint \"src/**/*.scss\" --fix"
  }
}
```

**Verificacao**:
```bash
cd C:/workspace-sep/apps/sep-frontend
npm run lint:scss
# Espera: passa (placeholders de styles/ sao apenas comentarios; sem regras pra validar)
```

### Step 100.2.6 — Instalar Husky + lint-staged

**Comandos**:
```bash
cd C:/workspace-sep
# Os hooks do Husky precisam de package.json no root OU no projeto Angular
# Como o repo e hibrido (backend Gradle + frontend npm), instalamos o Husky
# DENTRO de apps/sep-frontend/ e configuramos para subir um nivel.
cd apps/sep-frontend
npm install --save-dev husky@^9 lint-staged@^15
npx husky init
```

`husky init` cria `.husky/pre-commit` com `npm test` por padrao. Vamos sobrescrever.

**Arquivo**: `apps/sep-frontend/.husky/pre-commit`
```sh
cd "$(dirname "$0")/.."
npx lint-staged
```

(O `cd` garante que o hook rode no diretorio do projeto Angular, pois o git invoca o hook a partir da raiz do repo.)

**Tornar executavel** (Linux/macOS):
```bash
chmod +x apps/sep-frontend/.husky/pre-commit
```

**Configurar `lint-staged`** em `apps/sep-frontend/package.json`:
```json
{
  "lint-staged": {
    "*.{ts,html}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.scss": [
      "stylelint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

### Step 100.2.7 — Apontar Husky para o root do repo

Como o git esta no root (`C:/workspace-sep/.git`) e o `npm install` rodou em `apps/sep-frontend/`, o Husky por padrao instala hooks em `apps/sep-frontend/.husky`, mas o git procura hooks em `C:/workspace-sep/.git/hooks/` ou `core.hooksPath`.

**Solucao**: configurar `core.hooksPath` apontando para `apps/sep-frontend/.husky` no root.

**Comando**:
```bash
cd C:/workspace-sep
git config core.hooksPath apps/sep-frontend/.husky
```

**Atencao**: a Sprint 0 backend pode ter configurado `core.hooksPath` para `.githooks/` (pre-commit do Spotless). Se ja existir, **nao sobrescrever** — em vez disso, criar um hook agregador:

**Arquivo alternativo**: `C:/workspace-sep/.githooks/pre-commit` (apendar ao hook do backend):
```sh
#!/bin/sh
# Hook agregador: roda Spotless do backend (se aplicavel) e lint-staged do frontend.

set -e

# Spotless backend (se houver mudanca em arquivos Java/Gradle)
if git diff --cached --name-only | grep -qE '\.(java|gradle|kts)$'; then
  echo "→ rodando Spotless backend..."
  ./gradlew spotlessCheck
fi

# lint-staged frontend (se houver mudanca em arquivos do apps/sep-frontend)
if git diff --cached --name-only | grep -q '^apps/sep-frontend/'; then
  echo "→ rodando lint-staged frontend..."
  cd apps/sep-frontend
  npx lint-staged
fi
```

```bash
chmod +x C:/workspace-sep/.githooks/pre-commit
git config core.hooksPath .githooks
```

### Step 100.2.8 — Validar o pre-commit hook

**Teste de fumaca**:
```bash
cd C:/workspace-sep/apps/sep-frontend
# 1. Sujar um arquivo TS de proposito (sem ponto-e-virgula)
echo "const x = 1" >> src/app/app.ts
git add src/app/app.ts
git commit -m "test: validar pre-commit"
# Espera: hook auto-corrige (adiciona ;) e o commit passa
git log -1 --stat
git diff HEAD~1 src/app/app.ts
# Espera: ver `const x = 1;` no diff (com ; adicionado pelo Prettier/ESLint)
git reset --hard HEAD~1   # reverte o commit de teste
```

### Definicao de pronto da Task F-0.2
- [ ] ESLint 9 (flat config) configurado e passando
- [ ] Prettier 3 com `.prettierrc.json` e `.prettierignore`
- [ ] Stylelint 16 com config standard SCSS
- [ ] Husky + lint-staged instalados
- [ ] Pre-commit hook bloqueia commit com codigo desformatado e auto-corrige issues triviais
- [ ] `core.hooksPath` apontando para o lugar certo (ou hook agregador se backend ja usa)
- [ ] Scripts npm: `lint`, `lint:scss`, `format`, `format:check`
- [ ] Prefixo de seletor configurado para `sep` (componente kebab-case, diretiva camelCase)

### Commit Task F-0.2
```bash
cd C:/workspace-sep
git add apps/sep-frontend/{eslint.config.js,.prettierrc.json,.prettierignore,.stylelintrc.json,.husky,package.json,package-lock.json}
git add .githooks/pre-commit  # se criou o agregador
git commit -m "chore(frontend): adicionar ESLint, Prettier, Stylelint, Husky e lint-staged"
```

---

## Task F-0.3 — Vitest + Playwright + MSW

**Objetivo**: configurar Vitest para unit tests, Playwright para E2E e MSW (Mock Service Worker) para mocks de API durante dev e testes — sem ainda escrever testes funcionais reais (eles vem nas F-Sprints 2-4).

**Pre-requisito**: Tasks F-0.1 e F-0.2 concluidas.

**Esforco**: 2-3 horas.

### Step 100.3.1 — Instalar Vitest com adapter Angular

Angular 20 introduziu suporte experimental ao builder `unit-test` com Vitest, mas ainda esta em maturacao. A opcao mais estavel hoje e o adapter da AnalogJS, oficial para projetos Angular standalone.

**Comando**:
```bash
cd C:/workspace-sep/apps/sep-frontend
npm install --save-dev \
  vitest@^2 \
  @vitest/coverage-v8@^2 \
  @analogjs/vitest-angular@^1 \
  @analogjs/vite-plugin-angular@^1 \
  @testing-library/angular@^17 \
  @testing-library/jest-dom@^6 \
  jsdom@^25
```

### Step 100.3.2 — Configurar `vitest.config.ts`

**Arquivo**: `apps/sep-frontend/vitest.config.ts`
```ts
/// <reference types="vitest" />
import angular from '@analogjs/vite-plugin-angular';
import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  plugins: [angular()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: 'coverage',
      exclude: [
        'src/main.ts',
        'src/test-setup.ts',
        'src/mocks/**',
        '**/*.config.ts',
      ],
    },
  },
  define: {
    'import.meta.vitest': mode !== 'production',
  },
}));
```

**Arquivo**: `apps/sep-frontend/src/test-setup.ts`
```ts
import '@analogjs/vitest-angular/setup-zone';
import '@testing-library/jest-dom/vitest';

import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import { getTestBed } from '@angular/core/testing';

getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting(), {
  teardown: { destroyAfterEach: true },
});
```

### Step 100.3.3 — Adicionar scripts npm de teste

**Arquivo**: `apps/sep-frontend/package.json`
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Step 100.3.4 — Criar 1 teste smoke

**Arquivo**: `apps/sep-frontend/src/app/app.spec.ts`
```ts
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { App } from './app';

describe('App', () => {
  it('deve renderizar sem quebrar', async () => {
    await render(App);
    expect(screen.getByRole('main', { hidden: true }) ?? document.body).toBeTruthy();
  });
});
```

(Substituir `App` pelo nome real do componente raiz se o scaffold gerou outro nome — Angular 20 gera por padrao `App` em `app.ts`/`app.html`.)

**Verificacao**:
```bash
cd C:/workspace-sep/apps/sep-frontend
npm run test
# Espera: 1 passed (app.spec.ts)
npm run test:coverage
# Espera: relatorio em coverage/index.html
```

### Step 100.3.5 — Instalar Playwright

**Comando**:
```bash
cd C:/workspace-sep/apps/sep-frontend
npm install --save-dev @playwright/test@^1
npx playwright install --with-deps chromium
```

(Apenas Chromium para o smoke; Firefox/WebKit podem entrar em F-Sprint 4 quando os E2E reais forem escritos.)

### Step 100.3.6 — Configurar `playwright.config.ts`

**Arquivo**: `apps/sep-frontend/playwright.config.ts`
```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run start -- --port 4200',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

### Step 100.3.7 — Criar smoke E2E placeholder

**Arquivo**: `apps/sep-frontend/e2e/smoke.spec.ts`
```ts
import { expect, test } from '@playwright/test';

test('app sobe e responde no /', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/sep/i);
});
```

**Atualizar** `apps/sep-frontend/src/index.html` para garantir um `<title>` matchavel:
```html
<title>SEP Frontend</title>
```

**Adicionar script** ao `package.json`:
```json
{
  "scripts": {
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui"
  }
}
```

**Verificacao**:
```bash
cd C:/workspace-sep/apps/sep-frontend
npm run e2e
# Espera: 1 passed (smoke.spec.ts), HTML report em playwright-report/
```

### Step 100.3.8 — Atualizar `.gitignore` para artefatos de teste

Confirmar que o `.gitignore` raiz (Sprint 0 backend) cobre, ou complementar:
```gitignore
apps/*/coverage/
apps/*/playwright-report/
apps/*/test-results/
apps/*/.playwright-cache/
```

### Step 100.3.9 — Instalar e configurar MSW

**Comando**:
```bash
cd C:/workspace-sep/apps/sep-frontend
npm install --save-dev msw@^2
npx msw init public/ --save
```

`msw init` gera `public/mockServiceWorker.js`, registrado pelo Angular CLI automaticamente como asset estatico.

### Step 100.3.10 — Criar handlers MSW iniciais

**Arquivo**: `apps/sep-frontend/src/mocks/handlers.ts`
```ts
import { http, HttpResponse } from 'msw';

const baseUrl = 'http://localhost:8080/api/v1';

// Mocks alinhados com PRD §21 (contratos iniciais dos endpoints).
// Sao stubs para a F-Sprint 0; F-Sprint 2/3 substituem por mocks reais.
export const handlers = [
  http.post(`${baseUrl}/auth/login`, () =>
    HttpResponse.json({
      accessToken: 'mock-jwt-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
      usuario: {
        id: '1f0799c0-98b9-6d9d-bc4a-7d6f5b771001',
        username: 'admin@empresa.com',
        role: 'ADMIN',
        dataCriacao: '2026-04-24T18:30:00-03:00',
        dataModificacao: '2026-04-24T18:30:00-03:00',
        criadoPor: 'system',
        modificadoPor: 'system',
      },
    }),
  ),

  http.get(`${baseUrl}/auth/me`, () =>
    HttpResponse.json({
      id: '1f0799c0-98b9-6d9d-bc4a-7d6f5b771001',
      username: 'admin@empresa.com',
      role: 'ADMIN',
      dataCriacao: '2026-04-24T18:30:00-03:00',
      dataModificacao: '2026-04-24T18:30:00-03:00',
      criadoPor: 'system',
      modificadoPor: 'system',
    }),
  ),
];
```

**Arquivo**: `apps/sep-frontend/src/mocks/browser.ts`
```ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
```

**Arquivo**: `apps/sep-frontend/src/mocks/server.ts`
```ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

### Step 100.3.11 — Habilitar MSW em modo `dev` (opt-in)

**Arquivo**: `apps/sep-frontend/src/main.ts`

Modificar para iniciar o worker quando `import.meta.env.NG_APP_USE_MSW === 'true'`:

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

async function prepare(): Promise<void> {
  if (import.meta.env['NG_APP_USE_MSW'] === 'true') {
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
}

prepare().then(() =>
  bootstrapApplication(App, appConfig).catch((err) => console.error(err)),
);
```

**Como ativar localmente**:
```bash
NG_APP_USE_MSW=true npm run start
```

(No Windows PowerShell: `$env:NG_APP_USE_MSW="true"; npm run start`.)

### Step 100.3.12 — Plugar MSW nos testes Vitest (server)

**Atualizar** `apps/sep-frontend/src/test-setup.ts`:
```ts
import '@analogjs/vitest-angular/setup-zone';
import '@testing-library/jest-dom/vitest';

import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import { getTestBed } from '@angular/core/testing';
import { afterAll, afterEach, beforeAll } from 'vitest';

import { server } from './mocks/server';

getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting(), {
  teardown: { destroyAfterEach: true },
});

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

**Verificacao**:
```bash
cd C:/workspace-sep/apps/sep-frontend
npm run test
# Espera: smoke continua passando, sem warnings de MSW
```

### Definicao de pronto da Task F-0.3
- [ ] Vitest 2.x configurado via `@analogjs/vitest-angular`
- [ ] `npm run test` executa o smoke `app.spec.ts`
- [ ] `npm run test:coverage` gera relatorio em `coverage/`
- [ ] Playwright 1.x configurado com Chromium e webServer auto
- [ ] `npm run e2e` executa o smoke `e2e/smoke.spec.ts`
- [ ] MSW 2.x instalado, `mockServiceWorker.js` em `public/`
- [ ] `handlers.ts` com 2 mocks alinhados ao PRD §21 (`POST /auth/login`, `GET /auth/me`)
- [ ] `browser.ts` (worker para dev) e `server.ts` (server para Vitest)
- [ ] MSW ativado em dev via env var `NG_APP_USE_MSW=true`
- [ ] MSW server plugado no `test-setup.ts`

### Commit Task F-0.3
```bash
cd C:/workspace-sep
git add apps/sep-frontend/{vitest.config.ts,playwright.config.ts,e2e,src/test-setup.ts,src/mocks,src/main.ts,src/index.html,public/mockServiceWorker.js,package.json,package-lock.json}
git commit -m "chore(frontend): adicionar Vitest, Playwright e MSW com smoke tests"
```

---

## Task F-0.4 — GitHub Actions Frontend CI

**Objetivo**: criar pipeline minimo (`lint`, `test`, `build`) que roda em cada PR que mexer em `apps/sep-frontend/`. PR fica vermelho se algum desses passos falhar.

**Pre-requisito**: Tasks F-0.1, F-0.2 e F-0.3 concluidas; branch protection ja configurada na Sprint 0 backend.

**Esforco**: 30-45 min.

### Step 100.4.1 — Criar o workflow

**Arquivo**: `C:/workspace-sep/.github/workflows/frontend-ci.yml`
```yaml
name: Frontend CI

on:
  pull_request:
    paths:
      - 'apps/sep-frontend/**'
      - '.github/workflows/frontend-ci.yml'
  push:
    branches: [main]
    paths:
      - 'apps/sep-frontend/**'
      - '.github/workflows/frontend-ci.yml'

concurrency:
  group: frontend-ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  build:
    name: Lint, Test e Build
    runs-on: ubuntu-latest
    timeout-minutes: 15

    defaults:
      run:
        working-directory: apps/sep-frontend

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: apps/sep-frontend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Format check (Prettier)
        run: npm run format:check

      - name: Lint TypeScript
        run: npm run lint

      - name: Lint SCSS
        run: npm run lint:scss

      - name: Unit tests (Vitest)
        run: npm run test:coverage

      - name: Build (production)
        run: npm run build

      - name: Upload coverage
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: frontend-coverage
          path: apps/sep-frontend/coverage
          retention-days: 7
```

### Step 100.4.2 — (Opcional) workflow separado para E2E

E2E tende a ser mais lento; manter num job separado evita atrasar o feedback do PR.

**Arquivo**: `C:/workspace-sep/.github/workflows/frontend-e2e.yml`
```yaml
name: Frontend E2E

on:
  pull_request:
    paths:
      - 'apps/sep-frontend/**'
      - '.github/workflows/frontend-e2e.yml'

concurrency:
  group: frontend-e2e-${{ github.ref }}
  cancel-in-progress: true

jobs:
  e2e:
    name: Smoke E2E (Playwright)
    runs-on: ubuntu-latest
    timeout-minutes: 20

    defaults:
      run:
        working-directory: apps/sep-frontend

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: apps/sep-frontend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run E2E
        run: npm run e2e

      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: apps/sep-frontend/playwright-report
          retention-days: 7
```

### Step 100.4.3 — Atualizar branch protection no GitHub

A branch protection ja foi criada na Sprint 0 backend (Task 0.5). Adicionar agora os checks novos como **required** em `Settings → Branches → main`:

- `Lint, Test e Build` (do `frontend-ci.yml`)
- `Smoke E2E (Playwright)` — opcional como required (avaliar custo)

### Step 100.4.4 — Validar com PR de teste

**Procedimento**:
1. Criar branch `chore/test-frontend-ci`
2. Fazer mudanca trivial em `apps/sep-frontend/src/app/app.ts` (adicionar comentario)
3. Commitar e empurrar
4. Abrir PR
5. Verificar que `Frontend CI` aparece, roda e fica verde
6. (Opcional) introduzir erro de lint deliberado, validar que CI fica vermelho, corrigir, validar verde

**Comando para introduzir erro deliberado**:
```bash
# Adicionar uma linha sem ;, com Prettier vai pegar
echo "const broken = 'no-semi'" >> apps/sep-frontend/src/app/app.ts
git add apps/sep-frontend/src/app/app.ts
git commit --no-verify -m "test: forcar erro de lint para validar CI"
git push
```

(`--no-verify` apenas para o teste — em commit normal o pre-commit do hook ja barra.)

### Step 100.4.5 — Tempo total < 5 min

Conferir no GitHub Actions que o job `Lint, Test e Build` roda em menos de 5 minutos. Se ultrapassar:
- Ativar caching de `~/.npm` via `cache: 'npm'` (ja esta)
- Considerar skip de E2E em PRs apenas com mudanca em `*.md`

### Definicao de pronto da Task F-0.4
- [ ] `.github/workflows/frontend-ci.yml` criado e rodando
- [ ] CI roda apenas quando ha mudanca em `apps/sep-frontend/**` ou no proprio yaml
- [ ] Steps: format check, lint TS, lint SCSS, test com coverage, build
- [ ] Coverage e upload de artefato configurado
- [ ] (Opcional) `frontend-e2e.yml` rodando smoke E2E
- [ ] Branch protection inclui o check de Frontend CI como required
- [ ] PR de teste passou verde, e PR com erro deliberado ficou vermelho
- [ ] Tempo total do job principal < 5 min

### Commit Task F-0.4
```bash
cd C:/workspace-sep
git add .github/workflows/frontend-ci.yml
git add .github/workflows/frontend-e2e.yml  # se criou o E2E
git commit -m "ci(frontend): adicionar pipeline de lint, test e build no GitHub Actions"
```

---

## Definicao de Pronto da F-Sprint 0 (consolidada)

A F-Sprint 0 esta concluida quando todas as 4 tasks estiverem com checklist completo:

- [ ] **Task F-0.1** — projeto Angular 20.x rodando, strict, standalone, estrutura DDD
- [ ] **Task F-0.2** — ESLint + Prettier + Stylelint + Husky + lint-staged
- [ ] **Task F-0.3** — Vitest + Playwright + MSW com smoke tests
- [ ] **Task F-0.4** — GitHub Actions Frontend CI verde

## Estado esperado do repositorio apos F-Sprint 0

```
C:/workspace-sep/
├── .github/
│   └── workflows/
│       ├── ci.yml                          # backend (Sprint 0)
│       ├── frontend-ci.yml                 # NOVO
│       └── frontend-e2e.yml                # NOVO (opcional)
├── apps/
│   └── sep-frontend/
│       ├── .husky/
│       │   └── pre-commit
│       ├── e2e/
│       │   └── smoke.spec.ts
│       ├── public/
│       │   └── mockServiceWorker.js
│       ├── src/
│       │   ├── app/
│       │   │   ├── core/{auth,http,config,guards,interceptors}/
│       │   │   ├── shared/{components,directives,pipes,models,utils}/
│       │   │   ├── layout/{public-shell,authenticated-shell}/
│       │   │   ├── features/
│       │   │   │   ├── public/
│       │   │   │   └── authenticated/
│       │   │   ├── app.ts
│       │   │   ├── app.config.ts
│       │   │   ├── app.routes.ts
│       │   │   └── app.spec.ts
│       │   ├── mocks/
│       │   │   ├── browser.ts
│       │   │   ├── handlers.ts
│       │   │   └── server.ts
│       │   ├── styles/
│       │   │   ├── _apple.scss
│       │   │   ├── _mixins.scss
│       │   │   ├── _notion.scss
│       │   │   ├── _tokens.scss
│       │   │   └── index.scss
│       │   ├── index.html
│       │   ├── main.ts
│       │   └── test-setup.ts
│       ├── .prettierrc.json
│       ├── .prettierignore
│       ├── .stylelintrc.json
│       ├── angular.json
│       ├── eslint.config.js
│       ├── package.json
│       ├── package-lock.json
│       ├── playwright.config.ts
│       ├── tsconfig.json
│       └── vitest.config.ts
└── (demais artefatos da Sprint 0 backend e docs-sep/, specs/, adr/, steps/)
```

## Impacto na F-Sprint seguinte

A F-Sprint 1 (`specs/101-fsprint-1-design-tokens-showcase.md`) consome:
- `src/styles/_tokens.scss`, `_apple.scss`, `_notion.scss`, `_mixins.scss` (ja como placeholders) — sera populada com tokens reais
- Stylelint configurado para validar as variaveis SCSS dos tokens
- Vitest pronto para testes de snapshot do showcase
- Rota `/design-system` consumindo a estrutura de `features/`

## Restricoes e regras de execucao

- F-Sprint 0 pode comecar **imediatamente**, em paralelo com Sprint 0 backend; nao depende de backend ainda
- Commits podem ser feitos pelo agente; push e PR sao manuais (AGENT.md)
- Code review cruzado entre Devs Plenos Frontend; Dev Senior revisa mudancas que afetam contrato com backend (configuracao de CORS, mocks MSW)
- Caso a Sprint 0 backend altere `core.hooksPath`, sincronizar para nao quebrar o pre-commit do frontend (Step 100.2.7)
- Versoes pinadas no `package.json` devem respeitar a stack do PRD: Angular `^20`, ESLint `^9`, Prettier `^3`, Stylelint `^16`, Husky `^9`, lint-staged `^15`, Vitest `^2`, Playwright `^1`, MSW `^2`

## Proximos passos apos F-Sprint 0

1. **F-Sprint 1** — comeca com [`specs/101-fsprint-1-design-tokens-showcase.md`](../../specs/101-fsprint-1-design-tokens-showcase.md). Antes, gerar `steps/101-fsprint-1-steps.md` seguindo o mesmo padrao deste arquivo.
2. **Sprint 1 backend** — comeca em paralelo com [`specs/001-sprint-1-fundacao-tecnica.md`](../../specs/001-sprint-1-fundacao-tecnica.md).

## Referencias

- [Spec 100](../../specs/100-fsprint-0-setup-angular.md) — descricao alta das tasks
- [PRD §11, §22](../../docs-sep/PRD.md) — stack frontend e composicao de equipe
- [DESIGN-apple.md](../../docs-sep/DESIGN-apple.md) — superficies publicas (consumido na F-Sprint 1+)
- [DESIGN-notion.md](../../docs-sep/DESIGN-notion.md) — superficies autenticadas (consumido na F-Sprint 1+)
- [WEB-SCREENS-PLAN.md](../../docs-sep/WEB-SCREENS-PLAN.md) — plano de telas web
- [Spec 000 — Sprint 0 backend](../../specs/000-sprint-0-hygiene-foundation.md)
- [Steps 000 — Sprint 0 backend](../backend/000-sprint-0-steps.md)
- [AGENT.md](../../AGENT.md)
- ADRs [0002 — Design systems Apple/Notion + SCSS puro](../../adr/0002-design-systems-apple-e-notion-com-scss-puro.md), [0003 — Stack Angular 20 + Ionic 8 + Capacitor 6](../../adr/0003-stack-angular-20-ionic-8-capacitor-6.md)
