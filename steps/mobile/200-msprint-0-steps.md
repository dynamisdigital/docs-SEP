# Steps - M-Sprint 0 - Setup Ionic + Angular + Capacitor + Tooling

**Spec de origem**: [`specs/fase-1/200-msprint-0-setup-ionic.md`](../../specs/fase-1/200-msprint-0-setup-ionic.md)

**Objetivo geral**: inicializar o projeto Mobile SEP com Ionic `8.4+`, Angular `20.x`, Capacitor `6`, SCSS, strict mode e tooling completo de qualidade antes de implementar telas reais ou integrar com backend.

**Esforco total estimado**: 2-3 dias de Dev Mobile dedicado.

**Repo de destino**: `sep-mobile` (clonado em `<sep-mobile-root>/` na maquina do dev). Modelo de 3 repos independentes (PRD §11, AGENT.md). O projeto Ionic ocupa diretamente a raiz do repo — sem subpasta `apps/`.

**Ordem de execucao recomendada**:

```text
M-0.1 (scaffold Ionic)
  |
  +---> M-0.2 (lint/format/hooks)
           |
           +---> M-0.3 (Vitest + Playwright + MSW)
                    |
                    +---> M-0.4 (GitHub Actions Mobile CI)
```

- M-0.1 e raiz.
- M-0.2 depende de M-0.1.
- M-0.3 depende de M-0.1 e M-0.2.
- M-0.4 depende de M-0.1, M-0.2 e M-0.3.

**Como usar este arquivo**:

1. Leia a task completa antes de executar.
2. Execute os steps na ordem.
3. Rode a verificacao de cada step antes de seguir.
4. Ao final da task, valide a definicao de pronto.
5. Comite somente quando solicitado, usando Conventional Commits.
6. Nao avance para M-Sprint 1 sem a M-Sprint 0 verde localmente.

**Pre-requisitos globais**:

- Node.js LTS `>= 20.x` instalado.
- npm `>= 10.x` instalado.
- Git inicializado no workspace.
- PRD aprovado.
- `AGENT.md` lido (pelo menos a Secao Codex e a Secao Claude).
- Design system Notion definido em `docs-sep/DESIGN-notion.md`.
- ADR 0003 vigente: Angular `20.x` + Ionic `8.4+` + Capacitor `6`.

**Fora de escopo durante estes steps**:

- Nao adicionar Android ou iOS via Capacitor nesta sprint.
- Nao implementar telas reais.
- Nao aplicar tokens finais do Notion.
- Nao integrar com backend real.
- Nao criar regra de negocio no app mobile.

---

## Task M-0.1 - Scaffold Ionic 8.4+ + Angular 20.x + Capacitor 6

**Objetivo**: criar o projeto Ionic/Angular em `<sep-mobile-root>`, com Capacitor configurado para validacao PWA inicial, strict mode e estrutura modular por jornada.

**Pre-requisito**: Node.js `>= 20.x`.

**Esforco**: 45-60 min.

### Step 200.1.1 - Confirmar ambiente local

**Comando**:

```bash
cd <sep-mobile-root>
node -v
npm -v
git status --short
```

**Verificacao**:

- `node -v` deve retornar `v20.x.x` ou superior.
- `npm -v` deve retornar `10.x.x` ou superior.
- `git status --short` pode ter alteracoes documentais existentes, mas nao deve haver conflito com `<sep-mobile-root>`.

### Step 200.1.2 - Gerar projeto Ionic na raiz do repo

O Ionic CLI nao tem flag para gerar in-place. A estrategia e gerar em pasta temporaria e mover o conteudo para a raiz do repo `sep-mobile`.

**Comando**:

```bash
cd <sep-mobile-root>
# 1. Gerar em pasta temporaria
npx @ionic/cli@latest start .ionic-temp blank \
  --type=angular --capacitor \
  --package-id=com.dynamis.sep.mobile --no-git

# 2. Mover conteudo (incluindo arquivos ocultos) para a raiz do repo
shopt -s dotglob 2>/dev/null || true
mv .ionic-temp/* .ionic-temp/.* . 2>/dev/null || true
rmdir .ionic-temp
```

**Respostas esperadas do CLI**:

- Framework: Angular
- Template: blank
- Capacitor: habilitado
- Git: nao inicializar (o repo `sep-mobile` ja foi criado manualmente no GitHub)

**Verificacao**:

```bash
cd <sep-mobile-root>
test -f package.json && echo "OK package.json"
test -f capacitor.config.ts && echo "OK capacitor.config.ts"
test -d src/app && echo "OK src/app"
```

### Step 200.1.3 - Validar Angular 20.x, Ionic 8.4+ e Capacitor 6

**Comando**:

```bash
cd <sep-mobile-root>
npx ng version
npx ionic info
npm ls @capacitor/core @capacitor/cli @ionic/angular @angular/core
```

**Espera**:

- `@angular/core` em `20.x`.
- `@ionic/angular` em `8.4.x` ou superior dentro da linha `8.x`.
- `@capacitor/core` e `@capacitor/cli` em `6.x`.

**Regra de parada**:

Se o scaffold gerar Angular abaixo de `20` ou acima de `20`, pausar e ajustar antes de qualquer outro step. O ADR 0003 trava Angular `20.x`; nao regredir para `19` ou `17`, e nao aceitar `21` nesta M-Sprint sem decisao explicita.

### Step 200.1.4 - Ajustar `capacitor.config.ts`

**Arquivo**: `<sep-mobile-root>/capacitor.config.ts`

**Conteudo esperado**:

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dynamis.sep.mobile',
  appName: 'SEP',
  webDir: 'www',
};

export default config;
```

**Verificacao**:

```bash
cd <sep-mobile-root>
npx cap ls
```

Espera: Capacitor reconhece a configuracao, mesmo sem plataformas nativas adicionadas.

### Step 200.1.5 - Confirmar strict mode TypeScript e Angular

**Arquivos**:

- `<sep-mobile-root>/tsconfig.json`
- `<sep-mobile-root>/tsconfig.app.json`

**Conferir** que `tsconfig.json` possui strict habilitado:

```json
{
  "compilerOptions": {
    "strict": true
  },
  "angularCompilerOptions": {
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true
  }
}
```

**Verificacao**:

```bash
cd <sep-mobile-root>
npx tsc --noEmit
```

Espera: zero erros.

### Step 200.1.6 - Criar estrutura modular de pastas

**Comandos**:

```bash
cd <sep-mobile-root>/src/app
mkdir -p core/{auth,http,config,guards,interceptors,storage}
mkdir -p shared/{components,directives,pipes,models,utils}
mkdir -p layout/{public-shell,mobile-tabs,stack-shell}
mkdir -p features/{public,tomador,credora}
```

**Comandos para estilos**:

```bash
cd <sep-mobile-root>/src
mkdir -p styles
touch styles/_tokens.scss
touch styles/_notion-mobile.scss
touch styles/_ionic-overrides.scss
touch styles/_mixins.scss
touch styles/index.scss
```

**Conteudo inicial de `src/styles/index.scss`**:

```scss
// Indice central de estilos mobile.
// Tokens reais entram na M-Sprint 1.

@use "tokens" as *;
@use "mixins" as *;
@use "notion-mobile" as *;
@use "ionic-overrides" as *;
```

**Conteudo placeholder para os demais SCSS**:

```scss
// Placeholder da M-Sprint 0.
// Conteudo real sera definido na M-Sprint 1.
```

**Verificacao**:

```bash
cd <sep-mobile-root>
find src/app -maxdepth 3 -type d | sort
find src/styles -maxdepth 1 -type f | sort
```

### Step 200.1.7 - Plugar `src/styles/index.scss` no build

**Arquivo**: `<sep-mobile-root>/angular.json`

**Ajuste esperado** em `projects.<nome>.architect.build.options.styles`:

```json
"styles": [
  "src/theme/variables.scss",
  "src/global.scss",
  "src/styles/index.scss"
]
```

**Observacao**:

Preserve os arquivos padrao do Ionic, especialmente `src/theme/variables.scss` e `src/global.scss`. O `index.scss` sera a camada do produto.

**Verificacao**:

```bash
cd <sep-mobile-root>
npm run build
```

Espera: build gera `www/`.

### Step 200.1.8 - Subir PWA local

**Comando**:

```bash
cd <sep-mobile-root>
npm run start
```

**Verificacao**:

- Abrir `http://localhost:8100/`.
- Espera: app blank do Ionic carregando sem erro no console.
- Encerrar com `Ctrl+C` depois de confirmar.

### Step 200.1.9 - Conferir `.gitignore` do repo

**Arquivo**: `<sep-mobile-root>/.gitignore`

O Ionic CLI ja gera um `.gitignore` razoavel. Confirmar que cobre os artefatos esperados:

```gitignore
node_modules/
dist/
.angular/
www/
android/
ios/
.capacitor/
coverage/
playwright-report/
test-results/
```

**Observacao**:

`android/` e `ios/` ficam ignorados por enquanto porque nao serao adicionados nesta sprint. Quando a fase nativa chegar, a decisao de versionar essas pastas deve ser registrada explicitamente.

### Definicao de pronto da Task M-0.1

- [ ] `<sep-mobile-root>/` criado.
- [ ] Angular `20.x` confirmado.
- [ ] Ionic `8.4+` confirmado.
- [ ] Capacitor `6.x` confirmado.
- [ ] `capacitor.config.ts` com `appId`, `appName` e `webDir` corretos.
- [ ] Strict mode ativo.
- [ ] Estrutura `core/`, `shared/`, `layout/`, `features/{public,tomador,credora}` criada.
- [ ] `src/styles/` criado com placeholders.
- [ ] `npm run build` gera `www/`.
- [ ] `npm run start` sobe em `http://localhost:8100/`.

### Commit sugerido da Task M-0.1

```bash
git add <sep-mobile-root> .gitignore
git commit -m "feat(mobile): scaffold ionic app"
```

---

## Task M-0.2 - Tooling: ESLint + Prettier + Stylelint + Husky + lint-staged

**Objetivo**: configurar lint, formatacao, stylelint SCSS, pre-commit e lint-staged para bloquear problemas triviais antes do PR.

**Pre-requisito**: Task M-0.1 concluida.

**Esforco**: 60-90 min.

### Step 200.2.1 - Instalar dependencias de tooling

**Comando**:

```bash
cd <sep-mobile-root>
npm install --save-dev \
  eslint@^9 \
  @eslint/js@^9 \
  @angular-eslint/builder@^20 \
  angular-eslint@^20 \
  typescript-eslint@^8 \
  @ionic/eslint-config@^0.4 \
  eslint-config-prettier@^9 \
  prettier@^3 \
  stylelint@^16 \
  stylelint-config-standard-scss@^14 \
  husky@^9 \
  lint-staged@^15
```

**Verificacao**:

```bash
npm ls eslint angular-eslint typescript-eslint prettier stylelint husky lint-staged
```

### Step 200.2.2 - Criar `.prettierrc.json`

**Arquivo**: `<sep-mobile-root>/.prettierrc.json`

**Conteudo**:

```json
{
  "singleQuote": true,
  "semi": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

**Arquivo**: `<sep-mobile-root>/.prettierignore`

**Conteudo**:

```gitignore
node_modules/
www/
coverage/
playwright-report/
test-results/
.angular/
```

### Step 200.2.3 - Criar `eslint.config.js`

**Arquivo**: `<sep-mobile-root>/eslint.config.js`

**Conteudo base**:

```js
// @ts-check
const eslint = require('@eslint/js');
const angular = require('angular-eslint');
const prettier = require('eslint-config-prettier');
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
  {
    ignores: ['www/**', 'coverage/**', 'playwright-report/**', 'test-results/**'],
  },
  {
    files: ['**/*.ts'],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended, ...angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/component-class-suffix': ['error', { suffixes: ['Page', 'Component'] }],
      '@angular-eslint/directive-class-suffix': ['error', { suffixes: ['Directive'] }],
      '@angular-eslint/no-empty-lifecycle-method': 'error',
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
  },
  prettier,
);
```

**Observacao**:

Se o pacote `@ionic/eslint-config` expuser preset compativel com ESLint flat config no momento da execucao, pode ser incorporado aqui. A regra principal e manter ESLint `9` e Angular ESLint `20`.

### Step 200.2.4 - Criar `.stylelintrc.json`

**Arquivo**: `<sep-mobile-root>/.stylelintrc.json`

**Conteudo**:

```json
{
  "extends": ["stylelint-config-standard-scss"],
  "rules": {
    "custom-property-pattern": [
      "^([a-z][a-z0-9]*)(-[a-z0-9]+)*$|^ion-[a-z0-9-]+$",
      {
        "message": "Use kebab-case para CSS custom properties; variaveis --ion-* sao permitidas."
      }
    ],
    "selector-class-pattern": null,
    "scss/dollar-variable-pattern": null
  }
}
```

**Verificacao especifica**:

Stylelint nao deve reclamar de variaveis como `--ion-color-primary`.

### Step 200.2.5 - Ajustar scripts do `package.json`

**Arquivo**: `<sep-mobile-root>/package.json`

**Scripts esperados**:

```json
{
  "scripts": {
    "start": "ionic serve --host=0.0.0.0",
    "build": "ionic build",
    "lint": "eslint . && stylelint \"src/**/*.scss\"",
    "lint:fix": "eslint . --fix && stylelint \"src/**/*.scss\" --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "cap:add": "cap add",
    "cap:sync": "cap sync"
  }
}
```

**Observacao**:

`cap:add` fica disponivel, mas nao deve ser usado nesta sprint para Android/iOS.

### Step 200.2.6 - Configurar lint-staged

**Arquivo**: `<sep-mobile-root>/package.json`

**Adicionar na raiz do JSON**:

```json
{
  "lint-staged": {
    "*.{ts,html}": ["eslint --fix", "prettier --write"],
    "*.scss": ["stylelint --fix", "prettier --write"],
    "*.{json,md,yml,yaml}": ["prettier --write"]
  }
}
```

### Step 200.2.7 - Inicializar Husky no repo `sep-mobile`

**Contexto**: o repo `sep-mobile` e independente (modelo de 3 repos). Husky e instalado e configurado de forma padrao na raiz do repo, sem dependencia de outros repositorios.

**Comandos**:
```bash
cd <sep-mobile-root>
npx husky init
```

`husky init` cria `.husky/_/` (gitignored) e `.husky/pre-commit` com `npm test` por padrao. Vamos sobrescrever para rodar `lint-staged` (mais rapido e relevante).

**Arquivo**: `<sep-mobile-root>/.husky/pre-commit`

**Conteudo**:
```sh
npx lint-staged
```

**Tornar executavel** (Linux/macOS):
```bash
chmod +x <sep-mobile-root>/.husky/pre-commit
```

**Verificacao**:
```bash
# 1. Sujar um arquivo TS de proposito
cd <sep-mobile-root>
echo "const x = 1" >> src/app/app.component.ts
git add src/app/app.component.ts
git commit -m "test: validar pre-commit mobile"
# Espera: hook auto-corrige (adiciona ;) e o commit passa
git reset --hard HEAD~1   # reverte o commit de teste
```

> Nota sobre os outros repos: `sep-api` usa `.githooks/pre-commit` minimo (Spotless) — ver Sprint 0 backend Task 0.4. `sep-app` segue o mesmo padrao Husky deste repo (ver F-Sprint 0 Step 100.2.6/100.2.7). Cada repo gerencia hooks independentemente.

### Step 200.2.8 - Rodar lint e format check

**Comando**:

```bash
cd <sep-mobile-root>
npm run lint
npm run format:check
```

**Espera**:

Zero erros.

### Definicao de pronto da Task M-0.2

- [ ] ESLint `9` configurado.
- [ ] Angular ESLint `20` configurado.
- [ ] Prettier configurado.
- [ ] Stylelint configurado com suporte a `--ion-*`.
- [ ] Husky inicializado no repo via `npx husky init`.
- [ ] `.husky/pre-commit` rodando `npx lint-staged`.
- [ ] lint-staged configurado para TS, HTML, SCSS, JSON, Markdown e YAML.
- [ ] `npm run lint` passa.
- [ ] `npm run format:check` passa.

### Commit sugerido da Task M-0.2

```bash
cd <sep-mobile-root>
git add eslint.config.js .prettierrc.json .prettierignore .stylelintrc.json .husky package.json package-lock.json
git commit -m "chore: configure lint, formatting and pre-commit hooks"
```

---

## Task M-0.3 - Vitest + Playwright PWA + MSW

**Objetivo**: configurar testes unitarios com Vitest, E2E PWA com Playwright em viewport mobile e MSW para mocks de API em desenvolvimento.

**Pre-requisito**: Tasks M-0.1 e M-0.2 concluidas.

**Esforco**: 90-120 min.

### Step 200.3.1 - Instalar dependencias de teste

**Por que `@analogjs/vitest-angular`**: o Vitest sozinho nao compila templates Angular (HTML/SCSS inline dos componentes). O plugin `@analogjs/vite-plugin-angular` plugado em `vitest.config.ts` faz o Vite entender Angular, e o `@analogjs/vitest-angular` cuida do bootstrap do TestBed para o ambiente Vitest. Sem esses dois pacotes, qualquer teste que chame `render(AppComponent)` quebra. Mesmo padrao adotado pela F-Sprint 0 web (`steps/web/100-fsprint-0-steps.md`, Step 100.3.1).

**Comando**:

```bash
cd <sep-mobile-root>
npm install --save-dev \
  vitest@^2 \
  @vitest/coverage-v8@^2 \
  @analogjs/vitest-angular@^1 \
  @analogjs/vite-plugin-angular@^1 \
  jsdom@^25 \
  @testing-library/angular@^17 \
  @testing-library/jest-dom@^6 \
  @playwright/test@^1.48 \
  msw@^2
```

**Verificacao**:

```bash
npm ls vitest @playwright/test msw @analogjs/vitest-angular @analogjs/vite-plugin-angular
```

### Step 200.3.2 - Criar `vitest.config.ts`

**Arquivo**: `<sep-mobile-root>/vitest.config.ts`

**Conteudo**:

```ts
/// <reference types="vitest" />
import angular from '@analogjs/vite-plugin-angular';
import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  plugins: [angular()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: 'coverage',
      exclude: [
        'src/main.ts',
        'src/test/setup.ts',
        'src/mocks/**',
        '**/*.config.ts',
      ],
    },
  },
}));
```

**Observacao**: o plugin `@analogjs/vite-plugin-angular` e obrigatorio para o Vite/Vitest processar templates dos componentes Ionic/Angular. Sem ele, o Vitest reclama com `Unknown file extension ".html"` ou erros de parsing dos componentes.

### Step 200.3.3 - Criar setup de testes

**Arquivo**: `<sep-mobile-root>/src/test/setup.ts`

**Conteudo**:

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

**Observacao**: `setup-zone` precisa vir antes de qualquer import do `@angular/core/testing` para configurar `Zone.js` no contexto Vitest.

**Arquivo**: `<sep-mobile-root>/src/app/app.component.spec.ts`

**Conteudo base**:

```ts
import { render, screen } from '@testing-library/angular';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  it('renderiza o app Ionic inicial', async () => {
    await render(AppComponent);

    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
```

**Observacao**:

Se o template Ionic inicial nao expuser `role="main"`, ajustar o teste para um elemento real do scaffold sem alterar a intencao do smoke test.

### Step 200.3.4 - Ajustar scripts de teste no `package.json`

**Arquivo**: `<sep-mobile-root>/package.json`

**Scripts esperados**:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

Preserve os scripts criados nas tasks anteriores.

### Step 200.3.5 - Criar handlers MSW

**Arquivo**: `<sep-mobile-root>/src/mocks/handlers.ts`

**Conteudo**:

```ts
import { http, HttpResponse } from 'msw';

const API_BASE_URL = '/api/v1';

export const handlers = [
  http.post(`${API_BASE_URL}/auth/login`, () => {
    return HttpResponse.json({
      accessToken: 'mock-access-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
      usuario: {
        id: '1f0799c0-98b9-6d9d-bc4a-7d6f5b771001',
        username: 'cliente@empresa.com',
        role: 'CLIENTE',
        dataCriacao: '2026-04-24T18:30:00-03:00',
        dataModificacao: '2026-04-24T18:30:00-03:00',
        criadoPor: 'system',
        modificadoPor: 'system',
      },
    });
  }),
  http.get(`${API_BASE_URL}/auth/me`, () => {
    return HttpResponse.json({
      id: '1f0799c0-98b9-6d9d-bc4a-7d6f5b771001',
      username: 'cliente@empresa.com',
      role: 'CLIENTE',
      dataCriacao: '2026-04-24T18:30:00-03:00',
      dataModificacao: '2026-04-24T18:30:00-03:00',
      criadoPor: 'system',
      modificadoPor: 'system',
    });
  }),
];
```

**Arquivo**: `<sep-mobile-root>/src/mocks/browser.ts`

**Conteudo**:

```ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
```

### Step 200.3.6 - Preparar service worker do MSW

**Comando**:

```bash
cd <sep-mobile-root>
npx msw init public/ --save
```

**Verificacao**:

```bash
test -f public/mockServiceWorker.js
```

### Step 200.3.7 - Ativar MSW somente em desenvolvimento local

**Arquivo**: `<sep-mobile-root>/src/main.ts`

**Padrao esperado**:

```ts
import { isDevMode } from '@angular/core';

async function enableMocking(): Promise<void> {
  if (!isDevMode()) {
    return;
  }

  const { worker } = await import('./mocks/browser');
  await worker.start({
    onUnhandledRequest: 'bypass',
  });
}

enableMocking().then(() => {
  // Bootstrap Angular/Ionic existente fica aqui.
});
```

**Observacao**:

Preserve o bootstrap gerado pelo Ionic. O ponto importante e iniciar MSW antes do bootstrap em ambiente dev, sem afetar build de producao.

### Step 200.3.8 - Criar Playwright config mobile PWA

**Arquivo**: `<sep-mobile-root>/playwright.config.ts`

**Conteudo**:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html']] : [['list'], ['html']],
  use: {
    baseURL: 'http://127.0.0.1:8100',
    viewport: { width: 375, height: 812 },
    trace: 'on-first-retry',
    ...devices['iPhone 13'],
  },
  webServer: {
    command: 'npx ionic serve --host=127.0.0.1 --port=8100',
    url: 'http://127.0.0.1:8100',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

### Step 200.3.9 - Criar smoke E2E

**Arquivo**: `<sep-mobile-root>/e2e/smoke.spec.ts`

**Conteudo**:

```ts
import { expect, test } from '@playwright/test';

test('carrega o PWA mobile', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('ion-app')).toBeVisible();
});
```

### Step 200.3.10 - Ajustar scripts E2E

**Arquivo**: `<sep-mobile-root>/package.json`

**Scripts esperados**:

```json
{
  "scripts": {
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui"
  }
}
```

### Step 200.3.11 - Rodar testes

**Comando**:

```bash
cd <sep-mobile-root>
npm run test
npm run e2e
```

**Espera**:

- Vitest passa.
- Playwright sobe o PWA local e passa no smoke.
- MSW nao quebra o bootstrap em dev.

### Definicao de pronto da Task M-0.3

- [ ] Vitest configurado.
- [ ] Smoke unitario inicial passando.
- [ ] Playwright configurado com viewport mobile.
- [ ] Smoke E2E PWA passando.
- [ ] MSW configurado em `src/mocks`.
- [ ] `mockServiceWorker.js` criado em `public/`.
- [ ] `npm run test` passa.
- [ ] `npm run e2e` passa.

### Commit sugerido da Task M-0.3

```bash
git add <sep-mobile-root>
git commit -m "test(mobile): configure vitest playwright and msw"
```

---

## Task M-0.4 - GitHub Actions Mobile CI

**Objetivo**: criar pipeline minimo para validar lint, testes e build PWA do app mobile em PRs e pushes relevantes.

**Pre-requisito**: Tasks M-0.1, M-0.2 e M-0.3 concluidas.

**Esforco**: 30-45 min.

### Step 200.4.1 - Copiar template de CI para o repo

O template de CI mobile vive versionado em `docs-SEP/docs-sep/ci-pipelines/templates/sep-mobile-pwa-ci.template.yml`. Copiar para o repo `sep-mobile`:

**Comando**:

```bash
mkdir -p <sep-mobile-root>/.github/workflows
cp <docs-SEP-root>/docs-sep/ci-pipelines/templates/sep-mobile-pwa-ci.template.yml \
   <sep-mobile-root>/.github/workflows/ci.yml
```

> Substituir `<docs-SEP-root>` pelo caminho local onde o repo `docs-SEP` esta clonado.

O template ja vem sem `paths-filter` nem `working-directory` (cada repo so tem um app — workflow roda no root do repo).

### Step 200.4.2 - Validar suite local antes do primeiro push

**Comando**:

```bash
cd <sep-mobile-root>
npm ci
npm run lint
npm run test:coverage
npm run e2e
npm run build
```

**Espera**:

Todos os comandos passam localmente antes de abrir PR no GitHub.

### Definicao de pronto da Task M-0.4

- [ ] `.github/workflows/ci.yml` copiado do template `sep-mobile-pwa-ci.template.yml`.
- [ ] CI usa Node `20`.
- [ ] CI usa `npm ci`.
- [ ] CI roda lint, test:coverage, build PWA.
- [ ] CI nao tem `paths-filter` (modelo de 3 repos: cada repo so tem um app).
- [ ] Suite local verde antes do primeiro push.

### Commit sugerido da Task M-0.4

```bash
git add .github/workflows/ci.yml
git commit -m "ci: adicionar workflow de validacao PWA"
```

---

## Checklist final da M-Sprint 0

- [ ] Projeto Ionic em `<sep-mobile-root>/`.
- [ ] Angular `20.x` confirmado.
- [ ] Ionic `8.4+` confirmado.
- [ ] Capacitor `6.x` confirmado.
- [ ] Capacitor configurado com `appId: com.dynamis.sep.mobile`.
- [ ] Build PWA gera `www/`.
- [ ] `npm run start` sobe em `http://localhost:8100`.
- [ ] Estrutura modular criada para `core`, `shared`, `layout`, `features/public`, `features/tomador`, `features/credora`.
- [ ] SCSS centralizado em `src/styles/index.scss`.
- [ ] ESLint, Prettier e Stylelint configurados.
- [ ] Husky e lint-staged configurados.
- [ ] Vitest configurado e passando.
- [ ] Playwright configurado e passando em viewport mobile.
- [ ] MSW configurado para mocks de auth.
- [ ] Mobile CI criado.
- [ ] Nenhuma plataforma nativa Android/iOS adicionada nesta sprint.

## Validacao final local

Rodar na ordem:

```bash
cd <sep-mobile-root>
npm run lint
npm run format:check
npm run test:coverage
npm run e2e
npm run build
```

Resultado esperado:

- Todos os comandos passam.
- `www/` e gerado.
- Relatorios locais de coverage e Playwright nao entram no Git.

## Impacto na M-Sprint 1

A M-Sprint 1 (`specs/fase-1/201-msprint-1-tokens-notion-mobile.md`) deve consumir:

- `src/styles/_tokens.scss`
- `src/styles/_notion-mobile.scss`
- `src/styles/_ionic-overrides.scss`
- `src/styles/_mixins.scss`
- `src/styles/index.scss`
- Stylelint ja preparado para CSS variables Ionic.
- Vitest pronto para testes de showcase.

## Referencias

- [`specs/fase-1/200-msprint-0-setup-ionic.md`](../../specs/fase-1/200-msprint-0-setup-ionic.md)
- [`docs-sep/PRD.md`](../../docs-sep/PRD.md)
- [`docs-sep/MOBILE-SCREENS-PLAN.md`](../../docs-sep/MOBILE-SCREENS-PLAN.md)
- [`docs-sep/DESIGN-notion.md`](../../docs-sep/DESIGN-notion.md)
- [`adr/0003-stack-angular-20-ionic-8-capacitor-6.md`](../../adr/0003-stack-angular-20-ionic-8-capacitor-6.md)
- [`AGENT.md`](../../AGENT.md)
- [`AGENT.md`](../../AGENT.md)
