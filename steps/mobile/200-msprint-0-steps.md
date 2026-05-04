# Steps - M-Sprint 0 - Setup Ionic + Angular + Capacitor + Tooling

**Spec de origem**: [`specs/fase-1/200-msprint-0-setup-ionic.md`](../../specs/fase-1/200-msprint-0-setup-ionic.md)

**Objetivo geral**: inicializar o projeto Mobile SEP com Ionic `8.4+`, Angular `20.x`, Capacitor `6`, SCSS, strict mode e tooling completo de qualidade antes de implementar telas reais ou integrar com backend.

**Esforco total estimado**: 2-3 dias de Dev Mobile dedicado.

**Workspace root**: `<workspace-root>` (neste ambiente local: `/home/mauricio/workspaces/workspace-sep`; em Windows, usar `C:/workspace-sep`).

**Localizacao do projeto mobile**: `<workspace-root>/apps/sep-mobile/`.

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

**Objetivo**: criar o projeto Ionic/Angular em `apps/sep-mobile`, com Capacitor configurado para validacao PWA inicial, strict mode e estrutura modular por jornada.

**Pre-requisito**: Node.js `>= 20.x`.

**Esforco**: 45-60 min.

### Step 200.1.1 - Confirmar ambiente local

**Comando**:

```bash
cd <workspace-root>
node -v
npm -v
git status --short
```

**Verificacao**:

- `node -v` deve retornar `v20.x.x` ou superior.
- `npm -v` deve retornar `10.x.x` ou superior.
- `git status --short` pode ter alteracoes documentais existentes, mas nao deve haver conflito com `apps/sep-mobile`.

### Step 200.1.2 - Criar pasta `apps/`

**Comando**:

```bash
cd <workspace-root>
mkdir -p apps
```

**Verificacao**:

```bash
ls -la apps
```

Espera: pasta `apps/` existente.

### Step 200.1.3 - Gerar projeto Ionic

**Comando base**:

```bash
cd <workspace-root>/apps
npx @ionic/cli@latest start sep-mobile blank --type=angular --capacitor --package-id=com.dynamis.sep.mobile --no-git
```

**Respostas esperadas do CLI**:

- Framework: Angular.
- Template: blank.
- Capacitor: habilitado.
- Git: nao inicializar dentro do app, pois o repositorio e o root do workspace.

**Verificacao**:

```bash
cd <workspace-root>/apps/sep-mobile
ls -la
test -f package.json
test -f capacitor.config.ts
test -d src/app
```

### Step 200.1.4 - Validar Angular 20.x, Ionic 8.4+ e Capacitor 6

**Comando**:

```bash
cd <workspace-root>/apps/sep-mobile
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

### Step 200.1.5 - Ajustar `capacitor.config.ts`

**Arquivo**: `apps/sep-mobile/capacitor.config.ts`

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
cd <workspace-root>/apps/sep-mobile
npx cap ls
```

Espera: Capacitor reconhece a configuracao, mesmo sem plataformas nativas adicionadas.

### Step 200.1.6 - Confirmar strict mode TypeScript e Angular

**Arquivos**:

- `apps/sep-mobile/tsconfig.json`
- `apps/sep-mobile/tsconfig.app.json`

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
cd <workspace-root>/apps/sep-mobile
npx tsc --noEmit
```

Espera: zero erros.

### Step 200.1.7 - Criar estrutura modular de pastas

**Comandos**:

```bash
cd <workspace-root>/apps/sep-mobile/src/app
mkdir -p core/{auth,http,config,guards,interceptors,storage}
mkdir -p shared/{components,directives,pipes,models,utils}
mkdir -p layout/{public-shell,mobile-tabs,stack-shell}
mkdir -p features/{public,tomador,credora}
```

**Comandos para estilos**:

```bash
cd <workspace-root>/apps/sep-mobile/src
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
cd <workspace-root>/apps/sep-mobile
find src/app -maxdepth 3 -type d | sort
find src/styles -maxdepth 1 -type f | sort
```

### Step 200.1.8 - Plugar `src/styles/index.scss` no build

**Arquivo**: `apps/sep-mobile/angular.json`

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
cd <workspace-root>/apps/sep-mobile
npm run build
```

Espera: build gera `www/`.

### Step 200.1.9 - Subir PWA local

**Comando**:

```bash
cd <workspace-root>/apps/sep-mobile
npm run start
```

**Verificacao**:

- Abrir `http://localhost:8100/`.
- Espera: app blank do Ionic carregando sem erro no console.
- Encerrar com `Ctrl+C` depois de confirmar.

### Step 200.1.10 - Conferir `.gitignore` raiz

**Arquivo**: `<workspace-root>/.gitignore`

**Conferir** se cobre artefatos mobile:

```gitignore
apps/*/node_modules/
apps/*/dist/
apps/*/.angular/
apps/*/www/
apps/*/android/
apps/*/ios/
```

**Observacao**:

`android/` e `ios/` ficam ignorados por enquanto porque nao serao adicionados nesta sprint. Quando a fase nativa chegar, a decisao de versionar essas pastas deve ser registrada explicitamente.

### Definicao de pronto da Task M-0.1

- [ ] `apps/sep-mobile/` criado.
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
git add apps/sep-mobile .gitignore
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
cd <workspace-root>/apps/sep-mobile
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

**Arquivo**: `apps/sep-mobile/.prettierrc.json`

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

**Arquivo**: `apps/sep-mobile/.prettierignore`

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

**Arquivo**: `apps/sep-mobile/eslint.config.js`

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

**Arquivo**: `apps/sep-mobile/.stylelintrc.json`

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

**Arquivo**: `apps/sep-mobile/package.json`

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

**Arquivo**: `apps/sep-mobile/package.json`

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

### Step 200.2.7 - Integrar lint-staged ao agregador `.githooks/pre-commit`

**Contexto**: o repositorio adota um **unico agregador** de pre-commit em `<workspace-root>/.githooks/pre-commit`, configurado pela Sprint 0 backend (`steps/backend/000-sprint-0-steps.md`, Task 0.4). A F-Sprint 0 web (`steps/web/100-fsprint-0-steps.md`, Step 100.2.7) ja extendeu esse agregador para incluir o `lint-staged` do frontend. Esta task adiciona o terceiro bloco condicional (mobile), preservando os dois anteriores.

**Pre-condicoes**:

- `git config --get core.hooksPath` deve retornar `.githooks`. Se ainda nao retornar, executar:
  ```bash
  cd <workspace-root>
  git config core.hooksPath .githooks
  ```
- O arquivo `<workspace-root>/.githooks/pre-commit` ja deve existir (criado pela Sprint 0 backend Task 0.4).

**Nao usar `husky init`**: Husky por padrao instala `.husky/` em outro caminho e seta `core.hooksPath=.husky`, o que sobrescreveria o agregador. O Husky entra apenas como **dependencia de dev** para que `npx lint-staged` funcione, mas o ponto de entrada do hook continua sendo `.githooks/pre-commit`.

**Arquivo**: `<workspace-root>/.githooks/pre-commit`

**Conteudo final esperado** (com os 3 blocos: backend Spotless + frontend lint-staged + mobile lint-staged):

```sh
#!/bin/sh
# Hook agregador: roda Spotless do backend, lint-staged do frontend e lint-staged do mobile,
# condicionado aos arquivos staged de cada trilha.

set -e

# Spotless backend (se houver mudanca em arquivos Java/Gradle/Kotlin DSL)
if git diff --cached --name-only | grep -qE '\.(java|gradle|kts)$'; then
  echo "→ rodando Spotless backend..."
  ./gradlew spotlessCheck
fi

# lint-staged frontend (se houver mudanca em apps/sep-frontend/)
if git diff --cached --name-only | grep -q '^apps/sep-frontend/'; then
  echo "→ rodando lint-staged frontend..."
  cd apps/sep-frontend
  npx lint-staged
  cd - > /dev/null
fi

# lint-staged mobile (se houver mudanca em apps/sep-mobile/)
if git diff --cached --name-only | grep -q '^apps/sep-mobile/'; then
  echo "→ rodando lint-staged mobile..."
  cd apps/sep-mobile
  npx lint-staged
  cd - > /dev/null
fi
```

**Tornar executavel** (Linux/macOS):
```bash
chmod +x <workspace-root>/.githooks/pre-commit
```

**Verificacao**:
```bash
# 1. Sujar um arquivo TS de proposito
cd <workspace-root>/apps/sep-mobile
echo "const x = 1" >> src/app/app.component.ts
git add src/app/app.component.ts
git commit -m "test: validar pre-commit mobile"
# Espera: hook mobile dispara, auto-corrige (adiciona ;) e o commit passa
git reset --hard HEAD~1   # reverte o commit de teste
```

**Observacao**:
- Husky permanece em `package.json` apenas para o `npx lint-staged` resolver corretamente; nao instalar hooks via `husky init`.
- Se o agregador ainda nao foi extendido pela F-Sprint 0 web, copiar o bloco frontend do `steps/web/100-fsprint-0-steps.md` Step 100.2.7 antes de adicionar o bloco mobile.

### Step 200.2.8 - Rodar lint e format check

**Comando**:

```bash
cd <workspace-root>/apps/sep-mobile
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
- [ ] Bloco mobile adicionado ao agregador `.githooks/pre-commit` (sem usar `husky init`).
- [ ] `core.hooksPath` aponta para `.githooks` (compartilhado com backend e web).
- [ ] lint-staged configurado para TS, HTML, SCSS, JSON, Markdown e YAML.
- [ ] `npm run lint` passa.
- [ ] `npm run format:check` passa.

### Commit sugerido da Task M-0.2

```bash
git add apps/sep-mobile .githooks/pre-commit
git commit -m "chore(mobile): configure lint and formatting"
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
cd <workspace-root>/apps/sep-mobile
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

**Arquivo**: `apps/sep-mobile/vitest.config.ts`

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

**Arquivo**: `apps/sep-mobile/src/test/setup.ts`

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

**Arquivo**: `apps/sep-mobile/src/app/app.component.spec.ts`

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

**Arquivo**: `apps/sep-mobile/package.json`

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

**Arquivo**: `apps/sep-mobile/src/mocks/handlers.ts`

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

**Arquivo**: `apps/sep-mobile/src/mocks/browser.ts`

**Conteudo**:

```ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
```

### Step 200.3.6 - Preparar service worker do MSW

**Comando**:

```bash
cd <workspace-root>/apps/sep-mobile
npx msw init public/ --save
```

**Verificacao**:

```bash
test -f public/mockServiceWorker.js
```

### Step 200.3.7 - Ativar MSW somente em desenvolvimento local

**Arquivo**: `apps/sep-mobile/src/main.ts`

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

**Arquivo**: `apps/sep-mobile/playwright.config.ts`

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

**Arquivo**: `apps/sep-mobile/e2e/smoke.spec.ts`

**Conteudo**:

```ts
import { expect, test } from '@playwright/test';

test('carrega o PWA mobile', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('ion-app')).toBeVisible();
});
```

### Step 200.3.10 - Ajustar scripts E2E

**Arquivo**: `apps/sep-mobile/package.json`

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
cd <workspace-root>/apps/sep-mobile
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
git add apps/sep-mobile
git commit -m "test(mobile): configure vitest playwright and msw"
```

---

## Task M-0.4 - GitHub Actions Mobile CI

**Objetivo**: criar pipeline minimo para validar lint, testes e build PWA do app mobile em PRs e pushes relevantes.

**Pre-requisito**: Tasks M-0.1, M-0.2 e M-0.3 concluidas.

**Esforco**: 30-45 min.

### Step 200.4.1 - Criar workflow Mobile CI

**Arquivo**: `<workspace-root>/.github/workflows/mobile-ci.yml`

**Conteudo**:

```yaml
name: Mobile CI

on:
  pull_request:
    paths:
      - 'apps/sep-mobile/**'
      - '.github/workflows/mobile-ci.yml'
  push:
    branches:
      - main
    paths:
      - 'apps/sep-mobile/**'
      - '.github/workflows/mobile-ci.yml'

jobs:
  build:
    runs-on: ubuntu-latest

    defaults:
      run:
        working-directory: apps/sep-mobile

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: npm
          cache-dependency-path: apps/sep-mobile/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Unit tests
        run: npm run test:coverage

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: E2E smoke
        run: npm run e2e

      - name: Build PWA
        run: npm run build
```

### Step 200.4.2 - Validar workflow localmente por equivalencia

**Comando**:

```bash
cd <workspace-root>/apps/sep-mobile
npm ci
npm run lint
npm run test:coverage
npm run e2e
npm run build
```

**Espera**:

Todos os comandos passam localmente antes de abrir PR.

### Step 200.4.3 - Conferir escopo do workflow

**Verificacao**:

```bash
cd <workspace-root>
grep -n "apps/sep-mobile" .github/workflows/mobile-ci.yml
```

Espera: workflow dispara apenas para alteracoes mobile ou no proprio workflow.

### Definicao de pronto da Task M-0.4

- [ ] `.github/workflows/mobile-ci.yml` criado.
- [ ] CI usa Node `20`.
- [ ] CI usa `npm ci`.
- [ ] CI roda lint.
- [ ] CI roda unit tests com coverage.
- [ ] CI roda smoke E2E Playwright.
- [ ] CI roda build PWA.
- [ ] Paths limitados a `apps/sep-mobile/**` e workflow mobile.

### Commit sugerido da Task M-0.4

```bash
git add .github/workflows/mobile-ci.yml
git commit -m "ci(mobile): add mobile pipeline"
```

---

## Checklist final da M-Sprint 0

- [ ] Projeto Ionic em `apps/sep-mobile/`.
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
cd <workspace-root>/apps/sep-mobile
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
