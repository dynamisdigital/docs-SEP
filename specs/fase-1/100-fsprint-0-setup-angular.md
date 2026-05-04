# Spec 100 - F-Sprint 0 - Setup Angular + Tooling

## Metadados

- **ID da Spec**: 100
- **Titulo**: F-Sprint 0 - Setup do projeto Angular 20.x + Tooling completo
- **Status**: aprovada para execucao
- **Fase do produto**: Epic 12 - Fundacao Frontend (primeira F-Sprint)
- **Trilha**: Frontend (paralela a Sprint 0 backend)
- **Origem**: PRD - API SEP, Secao 22 (Trilha paralela Frontend) + Plano de melhorias R7
- **Depende de**: nenhum spec anterior; pode iniciar em paralelo a Sprint 0 backend
- **Responsavel principal**: Dev Pleno Frontend 1 (lider) + Dev Pleno Frontend 2

## Objetivo

Inicializar o projeto Angular 20.x com Standalone Components, Signals, SCSS, e configurar todo o tooling de qualidade (lint, format, hooks, testes, CI) **antes** de escrever qualquer tela ou componente. Espelha a Sprint 0 backend, garantindo que cada commit do frontend ja sera processado por padroes desde o primeiro PR.

## Escopo

### Em escopo
- Scaffold Angular 20.x com Standalone Components, Signals, SCSS, strict mode
- Estrutura de pastas modular por feature
- ESLint (flat config) + Prettier + Stylelint (SCSS standard)
- Husky + lint-staged (pre-commit auto-fix)
- Vitest (unit tests) + Playwright (E2E) + MSW (Mock Service Worker)
- GitHub Actions Frontend CI (lint, test, build em cada PR)
- Pacote inicial de scripts npm (`start`, `lint`, `test`, `e2e`, `build`)

### Fora de escopo nesta F-Sprint
- Tokens SCSS dos design systems (F-Sprint 1)
- Telas reais (F-Sprint 2 em diante)
- Shell autenticado (F-Sprint 3)
- Integracao com backend real (F-Sprint 3+)

## Pre-requisitos globais

- PRD aprovado, design systems Apple e Notion definidos (existem em `docs-sep/`)
- `AGENT.md` criado (orienta agentes futuros)
- Sprint 0 backend tem GitHub repo + branch protection + Conventional Commits prontos (compartilhados com frontend)
- Node.js LTS instalado (>= 20.x)

## Tasks

### Task F-0.1 - Scaffold Angular 20.x

**Descricao**
Inicializar o projeto Angular 20.x com Standalone Components, Signals, SCSS e estrutura modular por feature.

**Comando base**
```bash
npx @angular/cli@20 new sep-frontend --standalone --style=scss --routing --strict --skip-tests
```

**Estrutura de pastas esperada**
- `<sep-app-root>/`
- `<sep-app-root>/src/app/{core,shared,features,layout}`
- `<sep-app-root>/src/styles/{_tokens.scss,_apple.scss,_notion.scss,_mixins.scss,index.scss}`
- `<sep-app-root>/src/app/features/{public,authenticated}` (separacao por superficie de DS)

**Criterios de verificacao**
- `npm run start` sobe em `http://localhost:4200`
- TypeScript strict mode ativo
- Standalone Components configurados (sem `NgModule`)
- estrutura de pastas criada

**Pre-requisitos**
- Node.js LTS >= 20.x

**Dependencias**
- nenhuma

**Responsavel sugerido**
- Dev Pleno Frontend 1

---

### Task F-0.2 - Tooling: ESLint + Prettier + Stylelint + Husky + lint-staged

**Descricao**
Configurar tooling de qualidade para frontend, espelhando o que a Sprint 0 backend faz para Java (Spotless equivalente).

**Pacotes a instalar**
```json
{
  "devDependencies": {
    "@angular-eslint/builder": "^20.x",
    "@angular-eslint/eslint-plugin": "^20.x",
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
- `eslint.config.js` (flat config)
- `.prettierrc.json` (2 espacos, single quote, semi true, trailing comma `all`)
- `.stylelintrc.json` (config standard SCSS)
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

**Pre-requisitos**
- Task F-0.1 concluida

**Dependencias**
- depende de Task F-0.1

**Responsavel sugerido**
- Dev Pleno Frontend 1

---

### Task F-0.3 - Vitest + Playwright + MSW

**Descricao**
Setup das ferramentas de teste: Vitest para unit tests, Playwright para E2E, MSW (Mock Service Worker) para mockar API durante desenvolvimento.

**Pacotes**
- `vitest`, `@vitest/coverage-v8`, `@testing-library/angular`, `@testing-library/jest-dom`
- `@playwright/test`
- `msw`

**Arquivos esperados**
- `vitest.config.ts`
- `playwright.config.ts`
- `src/mocks/handlers.ts` (handlers MSW por endpoint da API)
- `src/mocks/browser.ts`, `src/mocks/server.ts`
- `e2e/smoke.spec.ts` (placeholder)

**Criterios de verificacao**
- `npm run test` (Vitest) executa
- `npm run e2e` (Playwright) executa
- MSW intercepta chamadas em modo `dev` quando ativado

**Pre-requisitos**
- Tasks F-0.1, F-0.2 concluidas

**Dependencias**
- depende de Tasks F-0.1, F-0.2

**Responsavel sugerido**
- Dev Pleno Frontend 2

---

### Task F-0.4 - GitHub Actions CI Frontend

**Descricao**
Pipeline minimo: lint, test, build em cada PR.

**Arquivos esperados**
- `.github/workflows/ci.yml` (copiado do template `sep-app-ci.template.yml`)

```yaml
name: Frontend CI

on:
  pull_request:
    paths: ['<sep-app-root>/**']
  push:
    branches: [main]
    paths: ['<sep-app-root>/**']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: <sep-app-root>/package-lock.json
      - working-directory: <sep-app-root>
        run: |
          npm ci
          npm run lint
          npm run test -- --coverage
          npm run build
```

**Criterios de verificacao**
- PR com erro de lint, teste ou build fica vermelho
- tempo total < 5 min

**Pre-requisitos**
- Tasks F-0.1, F-0.2, F-0.3 concluidas

**Responsavel sugerido**
- Dev Pleno Frontend 1

---

## Grafo de dependencias entre as tasks

```
F-0.1 (scaffold)
  |
  +---> F-0.2 (lint/format/hooks) --+
  |                                  |
  +---> F-0.3 (Vitest/Playwright/MSW) (depende de F-0.1 + F-0.2)
                                     |
                                     v
                                  F-0.4 (GitHub Actions CI)
```

- F-0.1 e raiz.
- F-0.2 depende de F-0.1.
- F-0.3 depende de F-0.1 e F-0.2.
- F-0.4 depende de F-0.1, F-0.2, F-0.3 (precisa dos comandos npm prontos).

## Definicao de pronto da F-Sprint 0

- Projeto Angular 20.x rodando com `npm run start`
- TypeScript strict mode ativo
- Standalone Components configurados (sem NgModule)
- ESLint + Prettier + Stylelint configurados
- Husky + lint-staged bloqueando commits desformatados
- Vitest e Playwright executando localmente
- MSW configurado e interceptando chamadas em dev
- GitHub Actions Frontend CI verde em PR de teste
- Estrutura de pastas DDD (`features/public`, `features/authenticated`) criada

## Impacto na F-Sprint seguinte

A F-Sprint 1 (`specs/101-fsprint-1-design-tokens-showcase.md`) consome:
- Estrutura de pastas `src/styles/` para colocar tokens SCSS
- Stylelint configurado para validar SCSS dos tokens
- Vitest pronto para testes de snapshot do showcase

## Restricoes e regras de execucao

- F-Sprint 0 pode comecar **imediatamente**, em paralelo com Sprint 0 backend
- Nao depende de backend ainda
- Commits podem ser feitos pelo agente quando solicitado; push e PR manuais
- Code review cruzado entre Devs Plenos Frontend; Dev Senior revisa configuracoes que impactam contrato com backend (CORS, etc.)

## Referencias

- [PRD - API SEP §11, §22](../../docs-sep/PRD.md)
- [DESIGN-apple.md](../../docs-sep/DESIGN-apple.md)
- [DESIGN-notion.md](../../docs-sep/DESIGN-notion.md)
- [WEB-SCREENS-PLAN.md](../../docs-sep/WEB-SCREENS-PLAN.md)
- [Spec 000 - Sprint 0 backend](./000-sprint-0-hygiene-foundation.md)
- [Spec 101 - F-Sprint 1 (proxima)](./101-fsprint-1-design-tokens-showcase.md)
