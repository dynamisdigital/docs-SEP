# Spec 200 - M-Sprint 0 - Setup Ionic + Angular + Capacitor + Tooling

## Metadados

- **ID da Spec**: 200
- **Titulo**: M-Sprint 0 - Setup do projeto Mobile (Ionic 8.4+ + Angular 20.x + Capacitor 6) + Tooling
- **Status**: aprovada para execucao
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
- `apps/sep-mobile/`
- `apps/sep-mobile/src/app/{core,shared,features,layout}`
- `apps/sep-mobile/src/app/features/{public,tomador,credora}` (separacao por jornada)
- `apps/sep-mobile/src/styles/{_tokens.scss,_notion-mobile.scss,_mixins.scss,index.scss}`
- `apps/sep-mobile/capacitor.config.ts`

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
- `.github/workflows/mobile-ci.yml`

```yaml
name: Mobile CI

on:
  pull_request:
    paths: ['apps/sep-mobile/**']
  push:
    branches: [main]
    paths: ['apps/sep-mobile/**']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: apps/sep-mobile/package-lock.json
      - working-directory: apps/sep-mobile
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

- Projeto Ionic 8.4+ rodando com `npm run start` ou `ionic serve`
- Angular 20.x Standalone confirmado via `ng version`
- Capacitor 6 configurado em `capacitor.config.ts`
- TypeScript strict mode ativo
- ESLint + Prettier + Stylelint configurados (com whitelist de CSS vars Ionic)
- Husky + lint-staged bloqueando commits desformatados
- Vitest e Playwright (viewport mobile) executando localmente
- MSW configurado e interceptando chamadas em dev
- GitHub Actions Mobile CI verde em PR de teste
- Build PWA funcional (`npm run build` gera `www/`)

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

A combinacao `Ionic 8.4+ + Angular 20.x + Capacitor 6` foi consolidada no [ADR 0003](../adr/0003-stack-angular-20-ionic-8-capacitor-6.md) como baseline. Caso a versao mais recente do Ionic no momento da execucao nao suporte Angular 20.x, **atualizar o Ionic** em vez de regredir o Angular (o ADR 0003 estabelece essa direcao).

## Referencias

- [PRD - API SEP §11 (Base mobile), §22 (Trilha paralela Mobile)](../docs-sep/PRD.md)
- [DESIGN-notion.md](../docs-sep/DESIGN-notion.md)
- [MOBILE-SCREENS-PLAN.md](../docs-sep/MOBILE-SCREENS-PLAN.md) - Fase Mobile 0
- [ADR 0003 - Stack Angular 20 + Ionic 8 + Capacitor 6](../adr/0003-stack-angular-20-ionic-8-capacitor-6.md)
- [Spec 000 - Sprint 0 backend](./000-sprint-0-hygiene-foundation.md)
- [Spec 100 - F-Sprint 0 frontend web (paralela)](./100-fsprint-0-setup-angular.md)
- [Spec 201 - M-Sprint 1 (proxima)](./201-msprint-1-tokens-notion-mobile.md)
