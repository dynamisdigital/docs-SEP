# Steps - F-Sprint 0 - Setup Angular + Tooling

**Spec de origem**: [`specs/fase-1/100-fsprint-0-setup-angular.md`](../../specs/fase-1/100-fsprint-0-setup-angular.md)

**Objetivo geral**: inicializar o projeto Angular 20.x (Standalone Components + Signals + SCSS + strict) e configurar todo o tooling de qualidade (lint, format, hooks, testes, MSW, CI) **antes** de escrever qualquer tela ou componente. Espelha a Sprint 0 backend para o frontend.

**Esforco total estimado**: 2-3 dias de Dev Pleno Frontend dedicado, ou 4-5 dias dividido entre os dois Devs Plenos.

**Repo de destino**: `sep-app` (clonado em `<sep-app-root>/` na maquina do dev). Modelo de 3 repos independentes (PRD §11, AGENT.md). O projeto Angular ocupa diretamente a raiz do repo — sem subpasta `apps/`.

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
- Git inicializado em `<sep-app-root>/`
- Sprint 0 backend ja criou `.gitignore`, `.editorconfig`, `.gitattributes`, branch protection e Conventional Commits documentados em `CONTRIBUTING.md`
- PRD aprovado e design systems Apple/Notion definidos em `docs-sep/`

---

## Task F-0.1 — Scaffold Angular 20.x

**Objetivo**: criar o projeto Angular 20.x com Standalone Components, Signals, SCSS e estrutura modular por feature, ja organizada para a fronteira de design system (publica/Apple vs autenticada/Notion).

**Pre-requisito**: Node.js LTS `>= 20.x`.

**Esforco**: 30-45 min.

### Step 100.1.1 — Gerar o projeto Angular na raiz do repo

O Angular CLI nao gera projeto in-place no diretorio atual por padrao; precisamos gerar num diretorio temporario e mover o conteudo para a raiz do repo `sep-app`.

**Comando**:
```bash
cd <sep-app-root>
npx @angular/cli@20 new sep-app \
  --standalone \
  --style=scss \
  --routing \
  --strict \
  --skip-tests \
  --skip-git \
  --package-manager=npm \
  --directory=.
```

A flag `--directory=.` faz o CLI gerar o projeto **no diretorio atual** (raiz do repo), sem criar subpasta extra. O nome `sep-app` e usado apenas como `name` no `package.json`.

**Flags explicadas**:
- `--standalone` → sem `NgModule`, todos os componentes standalone (PRD §11)
- `--style=scss` → SCSS puro, sem framework CSS (PRD §11, ADR 0002)
- `--routing` → cria `app.routes.ts` (necessario para guards futuros)
- `--strict` → TypeScript strict mode (`noImplicitAny`, `strictNullChecks`, etc.)
- `--skip-tests` → nao gera `.spec.ts` no scaffold; testes vem com Vitest na F-0.3
- `--skip-git` → nao cria git init (o repo `sep-app` ja foi inicializado manualmente no GitHub)
- `--package-manager=npm`
- `--directory=.` → projeto na raiz do repo, sem subpasta

**Verificacao**:
```bash
ls -la <sep-app-root>
# Espera: package.json, angular.json, tsconfig*.json, src/, public/
cat <sep-app-root>/package.json | grep '"@angular/core"'
# Espera: "^20.x.y"
```

### Step 100.1.2 — Confirmar versao Angular instalada

**Comando**:
```bash
cd <sep-app-root>
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

### Step 100.1.3 — Validar TypeScript strict

**Arquivo**: `<sep-app-root>/tsconfig.json`

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
cd <sep-app-root>
npx tsc --noEmit
# Espera: zero erros
```

### Step 100.1.4 — Criar a estrutura de pastas DDD/feature

A spec exige separacao entre superficies publicas (Apple) e autenticadas (Notion).

**Comandos**:
```bash
cd <sep-app-root>/src/app

mkdir -p core/{auth,http,config,guards,interceptors}
mkdir -p shared/{components,directives,pipes,models,utils}
mkdir -p layout/{public-shell,authenticated-shell}
mkdir -p features/public
mkdir -p features/authenticated
```

**Comandos para a pasta de styles**:
```bash
cd <sep-app-root>/src
mkdir -p styles
touch styles/_tokens.scss
touch styles/_apple.scss
touch styles/_notion.scss
touch styles/_mixins.scss
touch styles/index.scss
```

**Conteudo inicial** de `<sep-app-root>/src/styles/index.scss` (placeholder, F-Sprint 1 vai popular):
```scss
// Indice central de estilos globais.
// Os tokens reais vem na F-Sprint 1 (specs/fase-1/101-fsprint-1-design-tokens-showcase.md).

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

### Step 100.1.5 — Plugar `styles/index.scss` no build

**Arquivo**: `<sep-app-root>/angular.json`

**Localizar** `projects.sep-app.architect.build.options.styles` e ajustar:
```json
"styles": [
  "src/styles/index.scss",
  "src/styles.scss"
]
```

**Verificacao**:
```bash
cd <sep-app-root>
npm run build
# Espera: BUILD SUCCESSFUL, com warnings somente se houver
```

### Step 100.1.6 — Subir o dev server

**Comando**:
```bash
cd <sep-app-root>
npm run start
```

**Verificacao**:
- Abrir `http://localhost:4200/` no navegador
- Espera: pagina default do Angular (logo + welcome)
- Console do navegador sem erros

Encerrar com `Ctrl+C` apos confirmar.

### Step 100.1.7 — Configurar `.gitignore` do repo

O Angular CLI ja gera um `.gitignore` razoavel. Confirmar que cobre os artefatos esperados:

**Verificacao**:
```bash
cd <sep-app-root>
mkdir -p dist && echo "test" > dist/foo.txt
git status
# Espera: dist/ NAO listado em "untracked"
rm -rf dist
```

Se `dist/` aparecer no `git status`, adicionar ao `<sep-app-root>/.gitignore`:
```gitignore
node_modules/
dist/
.angular/
coverage/
playwright-report/
test-results/
```

### Definicao de pronto da Task F-0.1
- [ ] `<sep-app-root>/` criado
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
git add <sep-app-root>
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
cd <sep-app-root>
npx ng add @angular-eslint/schematics --skip-confirmation
```

Este schematic ja:
- Adiciona `eslint`, `@angular-eslint/*`, `@typescript-eslint/*`
- Cria `eslint.config.js` na raiz do projeto Angular (flat config moderno do ESLint 9)
- Cria target `lint` em `angular.json`

**Verificacao**:
```bash
cd <sep-app-root>
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
cd <sep-app-root>
npm install --save-dev prettier@^3 eslint-config-prettier@^9
```

**Arquivo**: `<sep-app-root>/.prettierrc.json`
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

**Arquivo**: `<sep-app-root>/.prettierignore`
```
dist
.angular
coverage
node_modules
*.lock
```

### Step 100.2.3 — Plugar Prettier no `eslint.config.js`

**Arquivo**: `<sep-app-root>/eslint.config.js`

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
cd <sep-app-root>
npm run lint
# Espera: passa
npx prettier --check "src/**/*.{ts,html,scss,json}"
# Espera: All matched files use Prettier code style!
```

### Step 100.2.4 — Adicionar npm scripts de format

**Arquivo**: `<sep-app-root>/package.json` — secao `scripts`:
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
cd <sep-app-root>
npm install --save-dev \
  stylelint@^16 \
  stylelint-config-standard-scss@^14 \
  stylelint-config-prettier-scss@^1
```

**Arquivo**: `<sep-app-root>/.stylelintrc.json`
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
cd <sep-app-root>
npm run lint:scss
# Espera: passa (placeholders de styles/ sao apenas comentarios; sem regras pra validar)
```

### Step 100.2.6 — Instalar Husky + lint-staged

**Contexto**: o repo `sep-app` e independente (modelo de 3 repos). Husky e instalado e configurado de forma padrao na raiz do repo, sem necessidade de agregador cross-repo.

**Comandos**:
```bash
cd <sep-app-root>
npm install --save-dev husky@^9 lint-staged@^15
npx husky init
```

`husky init` cria `.husky/pre-commit` com `npm test` por padrao. Vamos sobrescrever para rodar `lint-staged` (mais rapido e relevante).

**Arquivo**: `<sep-app-root>/.husky/pre-commit`
```sh
npx lint-staged
```

**Tornar executavel** (Linux/macOS):
```bash
chmod +x <sep-app-root>/.husky/pre-commit
```

**Configurar `lint-staged`** em `<sep-app-root>/package.json`:
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

### Step 100.2.7 — Validar o pre-commit hook

`husky init` ja configura tudo automaticamente — Husky cria o `.husky/_/` e o hook `.husky/pre-commit` aponta para o `prepare` script no `package.json` (instalado pelo `husky init`). Nao precisa setar `core.hooksPath` manualmente.

**Teste de fumaca**:
```bash
cd <sep-app-root>
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

> Nota sobre os outros repos: `sep-api` usa `.githooks/pre-commit` minimo (Spotless) — ver Sprint 0 backend Task 0.4. `sep-mobile` segue o mesmo padrao Husky deste repo (ver M-Sprint 0 Step 200.2.7). Cada repo gerencia hooks independentemente.

### Definicao de pronto da Task F-0.2
- [ ] ESLint 9 (flat config) configurado e passando
- [ ] Prettier 3 com `.prettierrc.json` e `.prettierignore`
- [ ] Stylelint 16 com config standard SCSS
- [ ] Husky + lint-staged instalados via `husky init`
- [ ] Pre-commit hook bloqueia commit com codigo desformatado e auto-corrige issues triviais
- [ ] Scripts npm: `lint`, `lint:scss`, `format`, `format:check`
- [ ] Prefixo de seletor configurado para `sep` (componente kebab-case, diretiva camelCase)

### Commit Task F-0.2
```bash
cd <sep-app-root>
git add eslint.config.js .prettierrc.json .prettierignore .stylelintrc.json .husky package.json package-lock.json
git commit -m "chore: adicionar ESLint, Prettier, Stylelint, Husky e lint-staged"
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
cd <sep-app-root>
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

**Arquivo**: `<sep-app-root>/vitest.config.ts`
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

**Arquivo**: `<sep-app-root>/src/test-setup.ts`
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

**Arquivo**: `<sep-app-root>/package.json`
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

**Arquivo**: `<sep-app-root>/src/app/app.spec.ts`
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
cd <sep-app-root>
npm run test
# Espera: 1 passed (app.spec.ts)
npm run test:coverage
# Espera: relatorio em coverage/index.html
```

### Step 100.3.5 — Instalar Playwright

**Comando**:
```bash
cd <sep-app-root>
npm install --save-dev @playwright/test@^1
npx playwright install --with-deps chromium
```

(Apenas Chromium para o smoke; Firefox/WebKit podem entrar em F-Sprint 4 quando os E2E reais forem escritos.)

### Step 100.3.6 — Configurar `playwright.config.ts`

**Arquivo**: `<sep-app-root>/playwright.config.ts`
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

**Arquivo**: `<sep-app-root>/e2e/smoke.spec.ts`
```ts
import { expect, test } from '@playwright/test';

test('app sobe e responde no /', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/sep/i);
});
```

**Atualizar** `<sep-app-root>/src/index.html` para garantir um `<title>` matchavel:
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
cd <sep-app-root>
npm run e2e
# Espera: 1 passed (smoke.spec.ts), HTML report em playwright-report/
```

### Step 100.3.8 — Atualizar `.gitignore` para artefatos de teste

Confirmar que o `.gitignore` do repo `sep-app` (gerado pelo Angular CLI) cobre, ou complementar:
```gitignore
coverage/
playwright-report/
test-results/
.playwright-cache/
```

### Step 100.3.9 — Instalar e configurar MSW

**Comando**:
```bash
cd <sep-app-root>
npm install --save-dev msw@^2
npx msw init public/ --save
```

`msw init` gera `public/mockServiceWorker.js`, registrado pelo Angular CLI automaticamente como asset estatico.

### Step 100.3.10 — Criar handlers MSW iniciais

**Arquivo**: `<sep-app-root>/src/mocks/handlers.ts`
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

**Arquivo**: `<sep-app-root>/src/mocks/browser.ts`
```ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
```

**Arquivo**: `<sep-app-root>/src/mocks/server.ts`
```ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

### Step 100.3.11 — Habilitar MSW em modo `dev` (opt-in)

**Arquivo**: `<sep-app-root>/src/main.ts`

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

**Atualizar** `<sep-app-root>/src/test-setup.ts`:
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
cd <sep-app-root>
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
cd <sep-app-root>
git add <sep-app-root>/{vitest.config.ts,playwright.config.ts,e2e,src/test-setup.ts,src/mocks,src/main.ts,src/index.html,public/mockServiceWorker.js,package.json,package-lock.json}
git commit -m "chore(frontend): adicionar Vitest, Playwright e MSW com smoke tests"
```

---

## Task F-0.4 — GitHub Actions CI

**Objetivo**: copiar template de CI para o repo `sep-app` para ter validacao automatica em cada PR (lint, test, build).

**Pre-requisito**: Tasks F-0.1, F-0.2 e F-0.3 concluidas; branch protection ja configurada manualmente no GitHub.

**Esforco**: 15-30 min.

### Step 100.4.1 — Copiar template de CI para o repo

O template de CI web vive versionado em `docs-SEP/docs-sep/ci-pipelines/templates/sep-app-ci.template.yml`. Copiar para o repo `sep-app`:

```bash
mkdir -p <sep-app-root>/.github/workflows
cp <docs-SEP-root>/docs-sep/ci-pipelines/templates/sep-app-ci.template.yml \
   <sep-app-root>/.github/workflows/ci.yml
```

> Substituir `<docs-SEP-root>` pelo caminho local onde o repo `docs-SEP` esta clonado.

O template ja vem sem `paths-filter` nem `working-directory` (cada repo so tem um app — workflow roda no root do repo).

### Step 100.4.2 — Validar suite local antes do primeiro push

```bash
cd <sep-app-root>
npm ci
npm run format:check
npm run lint
npm run lint:scss
npm run test:coverage
npm run build
```

**Espera**: tudo verde antes de abrir o primeiro PR no GitHub.

### Step 100.4.3 — Configurar branch protection no GitHub

Em `sep-app` → `Settings → Branches → Add branch protection rule` para `main`:

- Marcar `Lint, Test e Build` (job do `ci.yml`) como **required check**
- Habilitar "Require pull request before merging"
- Habilitar "Require status checks to pass before merging"

### Definicao de pronto da Task F-0.4
- [ ] `.github/workflows/ci.yml` copiado do template `sep-app-ci.template.yml`
- [ ] CI usa Node 20 e roda lint, format:check, test:coverage, build
- [ ] CI nao tem `paths-filter` (modelo de 3 repos: cada repo so tem um app)
- [ ] Suite local verde antes do primeiro push
- [ ] Branch protection inclui o check de CI como required
- [ ] PR de teste passou verde

### Commit Task F-0.4
```bash
cd <sep-app-root>
git add .github/workflows/ci.yml
git commit -m "ci: adicionar workflow de validacao (lint + test + build)"
```

---

## Definicao de Pronto da F-Sprint 0 (consolidada)

**F-Sprint 0 concluida em 2026-05-04** (branch `fsprint-0/setup-angular` no repo `sep-app`, build CI-APP no GitHub verde).

- [x] **Task F-0.1** — projeto Angular 20.3.19 rodando, strict, standalone, estrutura DDD
- [x] **Task F-0.2** — ESLint + Prettier + Stylelint + Husky + lint-staged
- [x] **Task F-0.3** — Vitest + Playwright + smoke tests; MSW worker (browser) ativo via `localStorage.NG_APP_USE_MSW`; MSW server (Node) deferido para F-Sprint 2/3 (polyfills ja prontos em `test-polyfills.ts`)
- [x] **Task F-0.4** — GitHub Actions Frontend CI (`name: CI-APP`) verde

## Estado esperado do repositorio apos F-Sprint 0

```
<sep-app-root>/                              # repo sep-app (independente)
├── .github/
│   └── workflows/
│       └── ci.yml                          # copiado do template sep-app-ci
├── .husky/
│   └── pre-commit                          # npx lint-staged
├── e2e/
│   └── smoke.spec.ts
├── public/
│   └── mockServiceWorker.js
├── src/
│   ├── app/
│   │   ├── core/{auth,http,config,guards,interceptors}/
│   │   ├── shared/{components,directives,pipes,models,utils}/
│   │   ├── layout/{public-shell,authenticated-shell}/
│   │   ├── features/
│   │   │   ├── public/
│   │   │   └── authenticated/
│   │   ├── app.ts
│   │   ├── app.config.ts
│   │   ├── app.routes.ts
│   │   └── app.spec.ts
│   ├── mocks/
│   │   ├── browser.ts
│   │   ├── handlers.ts
│   │   └── server.ts
│   ├── styles/
│   │   ├── _apple.scss
│   │   ├── _mixins.scss
│   │   ├── _notion.scss
│   │   ├── _tokens.scss
│   │   └── index.scss
│   ├── index.html
│   ├── main.ts
│   └── test-setup.ts
├── .prettierrc.json
├── .prettierignore
├── .stylelintrc.json
├── angular.json
├── eslint.config.js
├── package.json
├── package-lock.json
├── playwright.config.ts
├── tsconfig.json
└── vitest.config.ts
```

> Os repos `sep-api` e `sep-mobile` vivem em diretorios independentes; nao sao subpastas deste.

## Impacto na F-Sprint seguinte

A F-Sprint 1 (`specs/fase-1/101-fsprint-1-design-tokens-showcase.md`) consome:
- `src/styles/_tokens.scss`, `_apple.scss`, `_notion.scss`, `_mixins.scss` (ja como placeholders) — sera populada com tokens reais
- Stylelint configurado para validar as variaveis SCSS dos tokens
- Vitest pronto para testes de snapshot do showcase
- Rota `/design-system` consumindo a estrutura de `features/`

## Restricoes e regras de execucao

- F-Sprint 0 pode comecar **imediatamente**, em paralelo com Sprint 0 backend; nao depende de backend ainda
- **Modelo de branches** (ver `AGENT.md`): 1 branch por F-Sprint, nascida de `develop` apos `git pull --ff-only`. Toda a sprint vive nessa branch unica. PR vai para `develop` (nunca direto para `main`); merge tipo squash.
- **Commits**: numero flexivel — agente decide pelo escopo logico (Task, Step, modulo, refactor). Conventional Commits obrigatorio. `git status` + `git add <paths>` + `git commit` explicitos (hook automatico de `git add` foi removido em 2026-05-06).
- **Push e PR sao manuais** (regra do AGENT.md) — agente nao faz `git push` nem `gh pr create`.
- Code review cruzado entre Devs Plenos Frontend; Dev Senior revisa mudancas que afetam contrato com backend (configuracao de CORS, mocks MSW)
- O repo `sep-app` gerencia pre-commit independentemente do `sep-api` e `sep-mobile`; Husky padrao instala em `.husky/` automaticamente (Step 100.2.7)
- Versoes pinadas no `package.json` devem respeitar a stack do PRD: Angular `^20`, ESLint `^9`, Prettier `^3`, Stylelint `^16`, Husky `^9`, lint-staged `^15`, Vitest `^2`, Playwright `^1`, MSW `^2`

## Proximos passos apos F-Sprint 0

1. **F-Sprint 1** — comeca com [`specs/fase-1/101-fsprint-1-design-tokens-showcase.md`](../../specs/fase-1/101-fsprint-1-design-tokens-showcase.md). Antes, gerar `steps-fase-1/web/101-fsprint-1-steps.md` seguindo o mesmo padrao deste arquivo.
2. **Sprint 1 backend** — comeca em paralelo com [`specs/fase-1/001-sprint-1-fundacao-tecnica.md`](../../specs/fase-1/001-sprint-1-fundacao-tecnica.md).

## Referencias

- [Spec 100](../../specs/fase-1/100-fsprint-0-setup-angular.md) — descricao alta das tasks
- [PRD §11, §22](../../docs-sep/PRD.md) — stack frontend e composicao de equipe
- [DESIGN-apple.md](../../docs-sep/DESIGN-apple.md) — superficies publicas (consumido na F-Sprint 1+)
- [DESIGN-notion.md](../../docs-sep/DESIGN-notion.md) — superficies autenticadas (consumido na F-Sprint 1+)
- [WEB-SCREENS-PLAN.md](../../docs-sep/WEB-SCREENS-PLAN.md) — plano de telas web
- [Spec 000 — Sprint 0 backend](../../specs/fase-1/000-sprint-0-hygiene-foundation.md)
- [Steps 000 — Sprint 0 backend](../backend/000-sprint-0-steps.md)
- [AGENT.md](../../AGENT.md)
- ADRs [0002 — Design systems Apple/Notion + SCSS puro](../../adr/0002-design-systems-apple-e-notion-com-scss-puro.md), [0003 — Stack Angular 20 + Ionic 8 + Capacitor 6](../../adr/0003-stack-angular-20-ionic-8-capacitor-6.md)
