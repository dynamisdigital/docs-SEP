# Spec 100 - Trilha Frontend Foundation (paralela as Sprints 0-4 backend)

## Metadados

- **ID da Spec**: 100
- **Titulo**: Trilha Frontend Foundation - F-Sprints 0 a 4 paralelas ao backend
- **Status**: aprovada para execucao
- **Fase do produto**: Epic 12 - Fundacao Frontend (incremental ao longo das F-Sprints)
- **Origem**: PRD - API SEP, Secao 22 + Plano de melhorias R7
- **Responsavel principal**: Dev Pleno Frontend 1 (lider) + Dev Pleno Frontend 2
- **Equipe sugerida**: 2 Devs Plenos Frontend dedicados; Dev Senior em revisao de contratos e arquitetura

## Objetivo

Materializar a Epic 12 (Fundacao Frontend) **em paralelo** as Sprints 0-4 do backend, evitando que os 2 Devs Plenos Frontend fiquem ociosos durante 4-5 semanas predominantemente backend. Ao final da F-Sprint 4, o "Frontend MVP" esta navegavel: telas Apple (landing, login, register), shell Notion, biblioteca de componentes, telas autenticadas iniciais (perfil, alterar senha, admin de usuarios), guards e tratamento de erros — tudo consumindo a API real entregue pelas Sprints 1-4 backend.

## Escopo

### Em escopo
- F-Sprint 0: setup do projeto Angular 20.x + tooling (lint, format, hooks, testes)
- F-Sprint 1: tokens SCSS extraidos de Apple e Notion + design system showcase
- F-Sprint 2: telas Apple (landing, login, register) com MSW (Mock Service Worker)
- F-Sprint 3: integracao com auth real (login, /auth/me), shell Notion, guards, controle de sessao
- F-Sprint 4: telas autenticadas (perfil, alterar senha, admin de usuarios, dashboard inicial casca)
- biblioteca interna de componentes Notion (botoes, inputs, cards, tabelas, modais, toasts, loaders)
- testes Vitest unitarios e Playwright E2E para o golden path

### Fora de escopo nesta trilha
- telas das jornadas funcionais (Epic 13 - Frontend de Jornadas)
- mobile (Epic 14 - Mobile SEP, trilha futura propria)
- backend (specs 000-004)
- deploy frontend (Epic 16)

## Pre-requisitos globais

- PRD aprovado, design systems Apple e Notion definidos
- CLAUDE.md criado (orienta agentes futuros)
- Sprint 0 backend tem GitHub repo + branch protection + Conventional Commits prontos (compartilhados com frontend)
- Nodejs LTS instalado (>= 20.x)
- Acesso aos contratos de API expostos no PRD §21

## F-Sprints e Tasks

### F-Sprint 0 (paralela a Sprint 0 backend) - Setup do projeto Angular

**Objetivo**: scaffold Angular 20.x + tooling completo, sem ainda implementar tela.

#### Task F-0.1 - Scaffold Angular 20.x

**Descricao**
Inicializar o projeto Angular 20.x com Standalone Components, Signals, SCSS e estrutura modular por feature.

**Comando base**
```bash
npx @angular/cli@20 new sep-frontend --standalone --style=scss --routing --strict --skip-tests
```

**Estrutura de pastas esperada**
- `apps/sep-frontend/`
- `apps/sep-frontend/src/app/{core,shared,features,layout}`
- `apps/sep-frontend/src/styles/{_tokens.scss,_apple.scss,_notion.scss,_mixins.scss,index.scss}`
- `apps/sep-frontend/src/app/features/{public,authenticated}` (separacao por superficie de DS)

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

#### Task F-0.2 - Tooling: ESLint + Prettier + Stylelint + Husky + lint-staged

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

#### Task F-0.3 - Vitest + Playwright + MSW

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

#### Task F-0.4 - GitHub Actions CI Frontend

**Descricao**
Pipeline minimo: lint, test, build em cada PR.

**Arquivos esperados**
- `.github/workflows/frontend-ci.yml`

```yaml
name: Frontend CI

on:
  pull_request:
    paths: ['apps/sep-frontend/**']
  push:
    branches: [main]
    paths: ['apps/sep-frontend/**']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: apps/sep-frontend/package-lock.json
      - working-directory: apps/sep-frontend
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

### F-Sprint 1 (paralela a Sprint 1 backend) - Tokens SCSS + Design System Showcase

**Objetivo**: traduzir tokens dos design systems Apple e Notion para SCSS reutilizavel; expor um showcase navegavel.

#### Task F-1.1 - Tokens SCSS Apple (publico)

**Descricao**
Extrair literalmente todos os tokens de `docs-sep/DESIGN-apple.md` para SCSS. Cobre: cores, tipografia (com importacao SF Pro Display/Text via fallback Inter), espacamento, raios, sombras, regras do/dont.

**Arquivos esperados**
- `src/styles/_apple-tokens.scss` (variaveis CSS + SCSS)
- `src/styles/_apple-typography.scss` (mixins por nivel: hero-display, display-lg, body, etc.)
- `src/styles/_apple-components.scss` (mixins reutilizaveis: button-primary, search-input, etc.)

**Criterios de verificacao**
- todos os tokens listados em `DESIGN-apple.md` mapeados em SCSS
- codigo SCSS valida no Stylelint
- documentacao breve em comentarios de cada bloco

**Pre-requisitos**
- F-Sprint 0 concluida

**Responsavel sugerido**
- Dev Pleno Frontend 1

---

#### Task F-1.2 - Tokens SCSS Notion (autenticado)

**Descricao**
Mesmo que F-1.1 mas para `docs-sep/DESIGN-notion.md`. Cobre: cores warm, NotionInter via Inter fallback, espacamento, raios, sombras multilayer.

**Arquivos esperados**
- `src/styles/_notion-tokens.scss`
- `src/styles/_notion-typography.scss`
- `src/styles/_notion-components.scss`

**Pre-requisitos**
- F-Sprint 0 concluida

**Responsavel sugerido**
- Dev Pleno Frontend 1

---

#### Task F-1.3 - Design System Showcase (rota `/design-system`)

**Descricao**
Criar uma rota `/design-system` (acessivel apenas em modo dev) que exibe todos os tokens, tipografia, componentes em ambos os DS lado a lado. Funciona como Storybook leve sem instalar Storybook.

**Arquivos esperados**
- `src/app/features/design-system/design-system.routes.ts`
- `src/app/features/design-system/showcase.component.ts`
- subrotas `/design-system/apple` e `/design-system/notion`

**Criterios de verificacao**
- abre em `http://localhost:4200/design-system`
- mostra paleta de cores, tipografia, todos os componentes nos 2 DS
- documentacao inline explica quando usar cada um

**Pre-requisitos**
- Tasks F-1.1, F-1.2 concluidas

**Responsavel sugerido**
- Dev Pleno Frontend 2

---

### F-Sprint 2 (paralela a Sprint 2 backend) - Telas Apple + MSW

**Objetivo**: implementar landing, login e register seguindo Apple, com MSW mockando contratos da Sprint 2 backend (POST /api/v1/usuarios).

#### Task F-2.1 - Tela Landing (Apple)

**Descricao**
Implementar a landing publica seguindo `DESIGN-apple.md` literalmente: alternancia de tiles light/dark, hero typography, CTAs em pill blue.

**Arquivos esperados**
- `src/app/features/public/landing/landing.component.ts`
- `landing.component.html`, `landing.component.scss`
- imagens placeholder em `src/assets/landing/`

**Criterios de verificacao**
- visualmente fiel ao spec Apple
- responsivo (breakpoints do Apple)
- tests Vitest snapshot do componente
- sem console.error no browser

**Pre-requisitos**
- F-Sprint 1 concluida (tokens disponiveis)

**Responsavel sugerido**
- Dev Pleno Frontend 1

---

#### Task F-2.2 - Tela Login + MSW

**Descricao**
Tela de login estilo Apple (clean form com pill button), consumindo `POST /api/v1/auth/login` via MSW (mock Sprint 3 backend ainda nao pronta).

**Arquivos esperados**
- `src/app/features/public/login/login.component.ts`
- `src/mocks/handlers.ts` com handler para `POST /api/v1/auth/login` retornando token mock
- `src/app/core/auth/auth.service.ts` (Signals-based, com `currentUser$` Signal)

**Criterios de verificacao**
- form validado (email, senha 6 chars)
- erro de credenciais mostra feedback
- sucesso armazena token (localStorage por enquanto, revisar para httpOnly cookie no futuro)
- testes Vitest cobrem validacao + sucesso + falha
- MSW intercepta a chamada em dev

**Pre-requisitos**
- F-Sprint 1 concluida

**Responsavel sugerido**
- Dev Pleno Frontend 2

---

#### Task F-2.3 - Tela Register + MSW

**Descricao**
Tela de cadastro publico estilo Apple, consumindo `POST /api/v1/usuarios` via MSW.

**Criterios de verificacao**
- form validado (email, senha 6 chars exatos, role)
- erro de username duplicado mostra feedback (mock retorna 409)
- sucesso redireciona para login
- testes cobrem todos os cenarios

**Pre-requisitos**
- F-Sprint 1 concluida

**Responsavel sugerido**
- Dev Pleno Frontend 2

---

### F-Sprint 3 (paralela a Sprint 3 backend) - Integracao auth real + Shell Notion

**Objetivo**: substituir mocks MSW por API real (Sprint 3 backend), implementar shell Notion + guards + controle de sessao.

#### Task F-3.1 - Substituir MSW por API real (login + /me)

**Descricao**
Apontar `auth.service.ts` para a URL real do backend Sprint 3. Manter MSW disponivel via flag para desenvolvimento offline.

**Criterios de verificacao**
- login real funciona contra backend rodando localmente
- token armazenado e enviado em `Authorization: Bearer <token>` para `/auth/me`
- erros 401/403 sao tratados via interceptor

**Pre-requisitos**
- Sprint 3 backend concluida (Task 3.1 entregue endpoint `/auth/login` e `/auth/me`)

**Responsavel sugerido**
- Dev Pleno Frontend 2

---

#### Task F-3.2 - Shell Autenticado Notion

**Descricao**
Implementar o shell autenticado seguindo `DESIGN-notion.md`: header com logo + user menu, menu lateral (collapsable), breadcrumbs, area de conteudo.

**Arquivos esperados**
- `src/app/layout/shell/shell.component.ts`
- `src/app/layout/header/header.component.ts`
- `src/app/layout/sidenav/sidenav.component.ts`
- `src/app/layout/breadcrumbs/breadcrumbs.component.ts`

**Criterios de verificacao**
- visualmente fiel a Notion
- responsivo (breakpoints do Notion)
- testes Vitest cobrem navegacao basica

**Pre-requisitos**
- F-Sprint 1 concluida (tokens Notion disponiveis)

**Responsavel sugerido**
- Dev Pleno Frontend 1

---

#### Task F-3.3 - Guards funcionais + interceptors

**Descricao**
Functional Guards (Angular 20) para proteger rotas autenticadas + interceptor HTTP para anexar token e tratar 401/403.

**Arquivos esperados**
- `src/app/core/guards/auth.guard.ts` (functional guard)
- `src/app/core/guards/role.guard.ts` (verifica `ROLE_ADMIN` para rotas admin)
- `src/app/core/interceptors/auth.interceptor.ts` (functional interceptor)
- `src/app/core/interceptors/error.interceptor.ts`

**Criterios de verificacao**
- rota protegida sem token redireciona para `/login`
- 401 do backend limpa sessao e redireciona
- 403 mostra pagina "acesso negado"
- testes Vitest cobrem guards e interceptors

**Pre-requisitos**
- Tasks F-3.1, F-3.2 concluidas

**Responsavel sugerido**
- Dev Pleno Frontend 2

---

### F-Sprint 4 (paralela a Sprint 4 backend) - Telas autenticadas iniciais

**Objetivo**: implementar perfil, alterar senha, admin de usuarios, dashboard inicial (casca) consumindo APIs reais das Sprints 1-4.

#### Task F-4.1 - Tela Meu Perfil

**Descricao**
Tela mostrando dados do `/auth/me`, com link para alterar senha. Estilo Notion.

**Pre-requisitos**
- F-Sprint 3 concluida

**Responsavel sugerido**
- Dev Pleno Frontend 2

---

#### Task F-4.2 - Tela Alterar Senha

**Descricao**
Form com senha atual + nova senha + confirmacao, consumindo `PATCH /api/v1/usuarios/{id}/senha`.

**Pre-requisitos**
- F-Sprint 3 concluida + Sprint 3 backend Task 3.3

**Responsavel sugerido**
- Dev Pleno Frontend 2

---

#### Task F-4.3 - Administracao de Usuarios (apenas ADMIN)

**Descricao**
Tabela de usuarios consumindo `GET /api/v1/usuarios`, com link para detalhe (`GET /api/v1/usuarios/{id}`).

**Criterios de verificacao**
- so acessivel com role ADMIN (role guard)
- estilo Notion: tabela whisper border, colunas claras
- testes Vitest cobrem renderizacao da tabela

**Pre-requisitos**
- F-Sprint 3 concluida + Sprint 3 backend Task 3.2

**Responsavel sugerido**
- Dev Pleno Frontend 1

---

#### Task F-4.4 - Dashboard Administrativa (Casca)

**Descricao**
Primeira tela autenticada com cards placeholder, atalhos e conteudo mockado (sera populado quando jornadas funcionais existirem - Epic 13).

**Pre-requisitos**
- F-Sprint 3 concluida

**Responsavel sugerido**
- Dev Pleno Frontend 1

---

#### Task F-4.5 - Smoke E2E Playwright

**Descricao**
Suite Playwright cobrindo o golden path:
- abrir landing
- ir para register, criar usuario
- ir para login, autenticar
- chegar no shell autenticado
- ver perfil
- alterar senha
- (se ADMIN) listar usuarios

**Arquivos esperados**
- `e2e/golden-path.spec.ts`

**Criterios de verificacao**
- E2E roda contra backend local
- CI executa (idealmente apos backend Sprint 4 completa)

**Pre-requisitos**
- todas as Tasks F-4.x concluidas + Sprint 4 backend completa

**Responsavel sugerido**
- Dev Pleno Frontend 1 + Dev Pleno Frontend 2

---

## Definicao de pronto da trilha (apos F-Sprint 4)

- projeto Angular 20.x rodando com tooling completo (lint, format, hooks, testes)
- tokens SCSS dos 2 design systems implementados e usados
- showcase em `/design-system` documenta tudo
- telas Apple (landing, login, register) navegaveis consumindo API real
- shell Notion + guards funcionais
- telas autenticadas (perfil, alterar senha, admin de usuarios, dashboard casca) funcionais
- Vitest + Playwright passando, com cobertura razoavel
- CI Frontend verde
- "Frontend MVP" demonstravel para stakeholders
- documentacao breve do que ficou pronto + proximos passos para Epic 13 (Frontend de Jornadas)

## Restricoes e regras de execucao

- Frontend pode comecar na F-Sprint 0 imediatamente, em paralelo a Sprint 0 backend
- F-Sprint 2 usa MSW para nao bloquear espera por backend Sprint 3
- a partir da F-Sprint 3, Frontend depende de backend estar entregue (auth real)
- commits podem ser feitos pelo agente quando solicitado; push e PR manuais
- code review cruzado: Dev Senior revisa contratos; Devs Plenos Frontend revisam codigo entre si

## Referencias

- [PRD - API SEP](../docs-sep/PRD.md), Secoes 11 e 22
- [DESIGN-apple.md](../docs-sep/DESIGN-apple.md)
- [DESIGN-notion.md](../docs-sep/DESIGN-notion.md)
- [WEB-SCREENS-PLAN.md](../docs-sep/WEB-SCREENS-PLAN.md)
- [Spec 000 - Sprint 0 backend](./000-sprint-0-hygiene-foundation.md)
- [Spec 001 - Sprint 1](./001-sprint-1-fundacao-tecnica.md)
- [Spec 002 - Sprint 2](./002-sprint-2-gestao-usuarios.md)
- [Spec 003 - Sprint 3](./003-sprint-3-seguranca-autenticacao.md)
- [Spec 004 - Sprint 4](./004-sprint-4-erros-docs-testes.md)
