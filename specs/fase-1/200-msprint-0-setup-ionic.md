# Spec 200 - M-Sprint 0 - Setup Ionic + Angular + Capacitor + Tooling

## Metadados

- **ID da Spec**: 200
- **Titulo**: M-Sprint 0 - Setup do projeto Mobile (Ionic 8.4+ + Angular 20.x + Capacitor 6) + Tooling
- **Status**: concluida em 2026-05-04 (branch `msprint-0/setup-ionic` no repo `sep-mobile`)
- **Fase do produto**: Epic 14 - Mobile SEP (primeira M-Sprint)
- **Trilha**: Mobile (paralela a Sprint 0 backend e F-Sprint 0 frontend web)
- **Origem**: PRD - API SEP, Secao 22 + MOBILE-SCREENS-PLAN.md
- **Depende de**: nenhum spec anterior; pode iniciar em paralelo a Sprint 0 backend e F-Sprint 0 frontend
- **Responsavel principal**: Dev Mobile (dedicado)

## Objetivo

Inicializar o projeto Mobile SEP com Ionic 8.4+ + Angular 20.x + Capacitor 6, e configurar todo o tooling de qualidade (lint, format, hooks, testes, CI mobile) **antes** de implementar qualquer tela. Espelha as M-Sprints 0 e F-Sprint 0 (backend + web), garantindo padroes desde o primeiro PR mobile.

## Escopo

### Em escopo
- Scaffold Ionic 8.4+ com Angular 20.x (Standalone Components, Signals, SCSS, strict mode)
- Capacitor 6 configurado para PWA (validacao inicial); Android/iOS via Capacitor sao adicionados em fase posterior (Epic 14 Fase Mobile 2+)
- Estrutura de pastas modular por feature, separando jornadas (`features/tomador`, `features/credora`)
- ESLint (flat config) + Prettier + Stylelint
- Husky + lint-staged (pre-commit auto-fix)
- Vitest (unit tests) + Playwright (E2E em PWA) + MSW (Mock Service Worker)
- GitHub Actions Mobile CI (lint, test, build PWA em cada PR)
- Pacote inicial de scripts npm (`start`, `lint`, `test`, `e2e`, `build`, `cap:add`, `cap:sync`)

### Fora de escopo nesta M-Sprint
- Tokens Notion adaptados para mobile (M-Sprint 1)
- Telas reais (M-Sprint 2 em diante)
- Shell autenticado mobile (M-Sprint 3)
- Integracao com backend real (M-Sprint 3+)
- Build Android/iOS via Capacitor (Epic 14 Fase Mobile 2+, depois da estabilizacao das M-Sprints 0-4)
- Jornadas funcionais (Epic 14 Fase Mobile 2+: tomador onboarding, credora oportunidades, etc.)

## Pre-requisitos globais

- PRD aprovado, design system Notion definido (`docs-sep/DESIGN-notion.md`)
- `AGENT.md` criado (orienta agentes futuros)
- Sprint 0 backend tem GitHub repo + branch protection + Conventional Commits prontos (compartilhados)
- Node.js LTS instalado (>= 20.x)
- Java JDK 17 (apenas se for habilitar build Android no futuro — opcional nesta M-Sprint)
- Xcode (apenas se for habilitar build iOS no futuro — opcional, requer macOS)

## Tasks

### Task M-0.1 - Scaffold Ionic 8.4+ + Angular 20.x + Capacitor 6

**Descricao**
Inicializar o projeto mobile com Ionic CLI usando o template Angular 20.x Standalone, e adicionar Capacitor 6 para preparacao mobile nativa.

**Comandos base**
```bash
# Instalar Ionic CLI
npm install -g @ionic/cli@latest

# Criar projeto Ionic + Angular 20.x Standalone
ionic start sep-mobile blank --type=angular --capacitor

# Validar versoes
cd sep-mobile
npx ng version  # deve mostrar Angular 20.x
npx ionic info  # deve mostrar Ionic 8.4+
```

**Estrutura de pastas esperada**
- `<sep-mobile-root>/`
- `<sep-mobile-root>/src/app/{core,shared,features,layout}`
- `<sep-mobile-root>/src/app/features/{public,tomador,credora}` (separacao por jornada)
- `<sep-mobile-root>/src/styles/{_tokens.scss,_notion-mobile.scss,_mixins.scss,index.scss}`
- `<sep-mobile-root>/capacitor.config.ts`

**Capacitor: configuracao inicial**
- `appId: 'com.dynamis.sep.mobile'`
- `appName: 'SEP'`
- `webDir: 'www'` (output do Ionic build)

**Decisoes ja consolidadas**
- Standalone Components (sem `NgModule`)
- TypeScript strict mode
- SCSS como camada de estilizacao (sem framework CSS adicional alem dos componentes Ionic)
- Componentes Ionic customizados via CSS variables/SCSS para respeitar tokens Notion (M-Sprint 1)

**Criterios de verificacao**
- `npm run start` (ou `ionic serve`) sobe em `http://localhost:8100`
- TypeScript strict mode ativo
- Standalone Components configurados
- Estrutura de pastas criada
- `capacitor.config.ts` presente com `appId` e `appName` corretos
- Build PWA funciona: `npm run build` gera `www/` valido

**Pre-requisitos**
- Node.js LTS >= 20.x
- npm ou pnpm

**Dependencias**
- nenhuma

**Responsavel sugerido**
- Dev Mobile

---

### Task M-0.2 - Tooling: ESLint + Prettier + Stylelint + Husky + lint-staged

**Descricao**
Configurar tooling de qualidade espelhando o que a F-Sprint 0 frontend web faz, adaptado ao contexto Ionic.

**Pacotes a instalar**
```json
{
  "devDependencies": {
    "@angular-eslint/builder": "^20.x",
    "@angular-eslint/eslint-plugin": "^20.x",
    "@ionic/eslint-config": "^0.4.x",
    "eslint": "^9.x",
    "eslint-config-prettier": "^9.x",
    "prettier": "^3.x",
    "stylelint": "^16.x",
    "stylelint-config-standard-scss": "^14.x",
    "husky": "^9.x",
    "lint-staged": "^15.x"
  }
}
```

**Configuracoes esperadas**
- `eslint.config.js` (flat config, herda de `@ionic/eslint-config` quando disponivel)
- `.prettierrc.json` (2 espacos, single quote, semi true, trailing comma `all`)
- `.stylelintrc.json` (config standard SCSS com excecoes para Ionic CSS variables `--ion-*`)
- `.husky/pre-commit` rodando `lint-staged`
- `package.json` com `lint-staged` config:
  ```json
  {
    "lint-staged": {
      "*.{ts,html}": ["eslint --fix", "prettier --write"],
      "*.scss": ["stylelint --fix", "prettier --write"]
    }
  }
  ```

**Criterios de verificacao**
- `npm run lint` executa sem erros em codigo bem formatado
- pre-commit bloqueia commit com codigo nao formatado
- pre-commit auto-fix trivial issues
- Stylelint nao reclama de `--ion-color-primary` (whitelist de Ionic CSS vars)

**Pre-requisitos**
- Task M-0.1 concluida

**Dependencias**
- depende de Task M-0.1

**Responsavel sugerido**
- Dev Mobile

---

### Task M-0.3 - Vitest + Playwright (PWA) + MSW

**Descricao**
Setup das ferramentas de teste: Vitest para unit tests, Playwright para E2E em PWA (Chromium browser), MSW para mockar API durante desenvolvimento.

**Pacotes**
- `vitest`, `@vitest/coverage-v8`, `@testing-library/angular`, `@testing-library/jest-dom`
- `@playwright/test`
- `msw`

**Arquivos esperados**
- `vitest.config.ts`
- `playwright.config.ts` (configurado para `viewport: { width: 375, height: 812 }` simulando iPhone)
- `src/mocks/handlers.ts` (handlers MSW por endpoint da API)
- `src/mocks/browser.ts`
- `e2e/smoke.spec.ts` (placeholder)

**Criterios de verificacao**
- `npm run test` (Vitest) executa
- `npm run e2e` (Playwright) executa em PWA local com viewport mobile
- MSW intercepta chamadas em modo `dev` quando ativado

**Pre-requisitos**
- Tasks M-0.1, M-0.2 concluidas

**Dependencias**
- depende de Tasks M-0.1, M-0.2

**Responsavel sugerido**
- Dev Mobile

---

### Task M-0.4 - GitHub Actions Mobile CI

**Descricao**
Pipeline minimo: lint, test, build PWA em cada PR.

**Arquivos esperados**
- `.github/workflows/ci.yml` (copiado do template `sep-mobile-pwa-ci.template.yml`)

```yaml
name: Mobile CI

on:
  pull_request:
    paths: ['<sep-mobile-root>/**']
  push:
    branches: [main]
    paths: ['<sep-mobile-root>/**']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: <sep-mobile-root>/package-lock.json
      - working-directory: <sep-mobile-root>
        run: |
          npm ci
          npm run lint
          npm run test -- --coverage
          npm run build
```

**Criterios de verificacao**
- PR com erro de lint, teste ou build fica vermelho
- Tempo total < 5 min

**Pre-requisitos**
- Tasks M-0.1, M-0.2, M-0.3 concluidas

**Responsavel sugerido**
- Dev Mobile

---

## Grafo de dependencias entre as tasks

```
M-0.1 (scaffold Ionic)
  |
  +---> M-0.2 (lint/format/hooks) --+
  |                                  |
  +---> M-0.3 (Vitest/Playwright/MSW) (depende de M-0.1 + M-0.2)
                                     |
                                     v
                                  M-0.4 (GitHub Actions Mobile CI)
```

## Definicao de pronto da M-Sprint 0

- [x] Projeto Ionic 8 rodando com `npm run start` em `http://localhost:8100/`
- [x] Angular 20.3.x Standalone confirmado via `ng version`
- [x] Capacitor 8.3.x configurado em `capacitor.config.ts` (Ionic CLI gerou Cap 8 default — ver desvio abaixo)
- [x] TypeScript strict mode ativo
- [x] ESLint 9 + Prettier 3 + Stylelint 16 configurados (whitelist `--ion-*`)
- [x] Husky 9 + lint-staged 15 bloqueando commits desformatados
- [x] Vitest 2 e Playwright 1 (viewport mobile via Pixel 5) executando localmente
- [x] MSW 2 configurado: worker (browser) ativo via flag `localStorage.NG_APP_USE_MSW`; server (Node) com wiring deferido para M-Sprint 2/3
- [x] GitHub Actions Mobile CI (`name: CI-MOBILE`) verde
- [x] Build PWA funcional (`npm run build` gera `www/`)

## Resultado da execucao

- **Data de conclusao**: 2026-05-04
- **Branch**: `msprint-0/setup-ionic` no repo `sep-mobile` (originada de `develop` apos `pull --ff-only`)
- **Commits** (4, em ordem):
  - `chore(mobile): scaffold Ionic 8 + Angular 20 + Capacitor 8 com SCSS, strict e estrutura DDD` (Task M-0.1)
  - `chore(mobile): adicionar ESLint, Prettier, Stylelint, Husky e lint-staged` (Task M-0.2)
  - `chore(mobile): adicionar Vitest, Playwright PWA e MSW com smoke tests` (Task M-0.3)
  - `ci(mobile): adicionar workflow CI-MOBILE (lint + test + build PWA)` (Task M-0.4)
- **Validacoes locais**: `npm run format:check`, `lint`, `lint:scss`, `test:coverage` (1 passed), `e2e` (1 passed em Pixel 5/Chromium), `build` (`www/` gerado) — todos verdes
- **Versoes finais resolvidas**: Ionic 8 + Angular 20.3.19 + **Capacitor 8.3.1** (vs Cap 6 do ADR 0003), `@capacitor/app` 8.1, `@capacitor/haptics` 8.0.2, `@capacitor/keyboard` 8.0.3, `@capacitor/status-bar` 8.0.2, ESLint 9.39, Prettier 3.8, Stylelint 16.26, Husky 9.1, Vitest 2.1, `@analogjs/vitest-angular` 1.22, Playwright 1.59, MSW 2.14, `@testing-library/angular` 18.1.1, happy-dom (substituiu jsdom)
- **Desvios do spec/steps**:
  - **Capacitor 8.3.1** (nao 6 como ADR 0003 e o spec). Ionic CLI atual gera Capacitor 8 por default; PRD §11 estabelece direcao de **atualizar Ionic em vez de regredir Capacitor** quando combinacao mais recente nao bater com ADR. ADR de update sera criado antes da fase de Android/iOS para reformalizar a baseline.
  - Template `--type=angular-standalone` (vs default NgModule). O Ionic CLI default produz template legacy; standalone exigiu flag explicita.
  - Files legacy karma removidos do scaffold (`test.ts`, `polyfills.ts`, `zone-flags.ts`, `karma.conf.js`, target `test` Karma do `angular.json`) — substituidos por Vitest na M-0.3.
  - `vitest.config.mts` (nao `.ts`) — `@analogjs/vite-plugin-angular` e ESM-only e Vitest tenta carregar config via require; `.mts` forca ESM.
  - `environment: 'happy-dom'` (nao `jsdom`) — `@mswjs/interceptors` precisa de `TransformStream` global, jsdom 25 nao expoe.
  - **MSW server NAO plugado em `test-setup.ts`** — happy-dom nao tem `BroadcastChannel`; deferido para M-Sprint 2/3 quando primeiro teste dependente da API entrar. Polyfills (Web Streams + `BroadcastChannel` stub) ja prontos em `src/test-polyfills.ts`.
  - `src/main.ts` MSW gate via `localStorage.NG_APP_USE_MSW === 'true'` (nao `isDevMode()` do step) — consistencia com sep-app e desacoplamento de build env vars.
  - `@testing-library/angular@18.1.1` (nao `^17`) — versao 17 puxa `@angular/animations@21` transitivamente, conflita com Angular 20; 18.1.1 suporta Angular 20+ nativamente.
  - `npm ci --legacy-peer-deps` necessario — `@angular/build` declara `vitest@^3.1.1` como peer optional, mas pinamos `vitest@^2` por compat com `@analogjs/vitest-angular@^1`.
  - Playwright **Pixel 5 (Chromium)** ao inves de iPhone 13 (WebKit) do step — viewport mobile real sem precisar instalar webkit no CI.
  - Workflow renomeado para `name: CI-MOBILE` (template chega como `name: CI`) para diferenciar de `CI-API` e `CI-APP` em required checks cross-repo.
  - `package.json` e `package-lock.json` versionados ja com todas as devDependencies das 4 Tasks (commit unico em M-0.1) para evitar checkpoints intermediarios.
  - Repo public folder (`public/mockServiceWorker.js`) adicionado em `angular.json:architect.build.options.assets` para o build copiar para `www/`.

## Impacto na M-Sprint seguinte

A M-Sprint 1 (`specs/201-msprint-1-tokens-notion-mobile.md`) consome:
- Estrutura de pastas `src/styles/` para colocar tokens Notion adaptados
- Stylelint configurado com whitelist de CSS variables Ionic
- Vitest pronto para testes de snapshot do showcase

## Restricoes e regras de execucao

- M-Sprint 0 pode comecar **imediatamente**, em paralelo com Sprint 0 backend e F-Sprint 0 frontend
- Nao depende de backend ainda
- Nao depende do Frontend Web ainda (mas reutilizara contratos quando integrar)
- Build Android/iOS fica para fase posterior (Capacitor `add android` / `add ios` quando o produto estiver mais maduro)
- Commits podem ser feitos pelo agente quando solicitado; push e PR manuais
- Code review do Dev Senior (do backend) revisa configuracoes que impactam contrato com API

## Compatibilidade Ionic v8 + Angular 20

A combinacao `Ionic 8.4+ + Angular 20.x + Capacitor 6` foi consolidada no [ADR 0003](../../adr/0003-stack-angular-20-ionic-8-capacitor-6.md) como baseline. Caso a versao mais recente do Ionic no momento da execucao nao suporte Angular 20.x, **atualizar o Ionic** em vez de regredir o Angular (o ADR 0003 estabelece essa direcao).

## Referencias

- [PRD - API SEP §11 (Base mobile), §22 (Trilha paralela Mobile)](../../docs-sep/PRD.md)
- [DESIGN-notion.md](../../docs-sep/DESIGN-notion.md)
- [MOBILE-SCREENS-PLAN.md](../../docs-sep/MOBILE-SCREENS-PLAN.md) - Fase Mobile 0
- [ADR 0003 - Stack Angular 20 + Ionic 8 + Capacitor 6](../../adr/0003-stack-angular-20-ionic-8-capacitor-6.md)
- [Spec 000 - Sprint 0 backend](./000-sprint-0-hygiene-foundation.md)
- [Spec 100 - F-Sprint 0 frontend web (paralela)](./100-fsprint-0-setup-angular.md)
- [Spec 201 - M-Sprint 1 (proxima)](./201-msprint-1-tokens-notion-mobile.md)
