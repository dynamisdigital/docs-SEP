# Spec 102 - F-Sprint 2 - Telas Apple Publicas + MSW

## Metadados

- **ID da Spec**: 102
- **Titulo**: F-Sprint 2 - Landing, Login e Register seguindo Apple, com MSW mockando contratos
- **Status**: aprovada para execucao (apos conclusao da F-Sprint 1)
- **Fase do produto**: Epic 12 - Fundacao Frontend
- **Trilha**: Frontend (paralela a Sprint 2 backend)
- **Origem**: PRD - API SEP, Secao 22 (Trilha paralela Frontend) + Plano de melhorias R7
- **Depende de**: [`101-fsprint-1-design-tokens-showcase.md`](./101-fsprint-1-design-tokens-showcase.md)
- **Responsavel principal**: Dev Pleno Frontend 1 (lider) + Dev Pleno Frontend 2

## Objetivo

Implementar as 3 telas publicas (sem autenticacao) seguindo o design system Apple literalmente: landing institucional, login e cadastro publico. Como o backend ainda nao tem autenticacao real (Sprint 3 em paralelo), as chamadas HTTP sao interceptadas via **MSW (Mock Service Worker)** com handlers que simulam os contratos do PRD §21. Permite o time validar UX, fluxo e fidelidade visual antes da integracao real (que vem na F-Sprint 3).

> **Nota apos [ADR 0009 - Separacao de Canal por Perfil](../adr/0009-separacao-de-canal-por-perfil.md)**: a tela de **cadastro publico generico** desta F-Sprint **e temporaria**. A partir da Sprint 5 (Endurecimento de Seguranca, ADR 0010), o cadastro publico no web e desativado:
> - Tomadores serao direcionados para o app mobile (canal exclusivo)
> - Empresas credoras serao cadastradas por convite emitido por administrador
> - Admin/Financeiro/Backoffice serao criados internamente por administrador autenticado
>
> A F-Sprint 2 ainda implementa a tela de cadastro publico, mas inclui aviso visual ("Para criar conta como tomador, baixe o app SEP") preparando a transicao da Sprint 5.

## Escopo

### Em escopo
- Landing publica (Apple) com hero + tiles alternados light/dark + CTAs em pill blue
- Tela de login (Apple) com form clean e MSW mockando `POST /api/v1/auth/login`
- Tela de register/cadastro publico (Apple) com MSW mockando `POST /api/v1/usuarios`
- `auth.service.ts` baseado em Signals (`currentUser` Signal)
- Handlers MSW para os 3 endpoints
- Testes Vitest cobrindo validacao, sucesso e falha de cada formulario
- Imagens placeholder em `src/assets/landing/`

### Fora de escopo nesta F-Sprint
- Integracao com auth real (F-Sprint 3 — substitui MSW)
- Shell autenticado (F-Sprint 3)
- Telas autenticadas: perfil, alterar senha, admin (F-Sprint 4)
- Tokens Notion sendo usados (este F-Sprint e 100% Apple)

## Pre-requisitos globais

- F-Sprint 1 concluida (tokens Apple disponiveis em SCSS)
- F-Sprint 0 concluida (MSW configurado em `src/mocks/`)
- Contratos da API publicados em PRD §21 (Sprint 2 backend nao precisa estar pronta)

## Tasks

### Task F-2.1 - Tela Landing (Apple)

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

**Dependencias**
- nenhuma dentro desta F-Sprint (pode ser primeira a iniciar)

**Responsavel sugerido**
- Dev Pleno Frontend 1

---

### Task F-2.2 - Tela Login + MSW

**Descricao**
Tela de login estilo Apple (clean form com pill button), consumindo `POST /api/v1/auth/login` via MSW (mock Sprint 3 backend ainda nao pronta).

**Arquivos esperados**
- `src/app/features/public/login/login.component.ts`
- `src/mocks/handlers.ts` com handler para `POST /api/v1/auth/login` retornando token mock
- `src/app/core/auth/auth.service.ts` (Signals-based, com `currentUser` Signal)

**Criterios de verificacao**
- form validado (email, senha 6 chars)
- erro de credenciais mostra feedback
- sucesso armazena token (localStorage por enquanto, revisar para httpOnly cookie no futuro)
- testes Vitest cobrem validacao + sucesso + falha
- MSW intercepta a chamada em dev

**Pre-requisitos**
- F-Sprint 1 concluida

**Dependencias**
- pode rodar em paralelo com F-2.1 e F-2.3

**Responsavel sugerido**
- Dev Pleno Frontend 2

---

### Task F-2.3 - Tela Register + MSW

**Descricao**
Tela de cadastro publico estilo Apple, consumindo `POST /api/v1/usuarios` via MSW.

**Arquivos esperados**
- `src/app/features/public/register/register.component.ts`
- `src/mocks/handlers.ts` complementado com handler para `POST /api/v1/usuarios`

**Criterios de verificacao**
- form validado (email, senha 6 chars exatos, role)
- erro de username duplicado mostra feedback (mock retorna 409)
- sucesso redireciona para login
- testes cobrem todos os cenarios

**Pre-requisitos**
- F-Sprint 1 concluida

**Dependencias**
- pode rodar em paralelo com F-2.1 e F-2.2

**Responsavel sugerido**
- Dev Pleno Frontend 2

---

## Grafo de dependencias entre as tasks

```
F-Sprint 1 concluida
       |
       +---> F-2.1 (Landing)   [pode rodar em paralelo]
       +---> F-2.2 (Login)     [pode rodar em paralelo]
       +---> F-2.3 (Register)  [pode rodar em paralelo]
```

As 3 tasks sao independentes entre si. Podem ser distribuidas entre os 2 Devs Plenos Frontend.

## Definicao de pronto da F-Sprint 2

- Landing publica navegavel em `/`
- Login funcional com MSW (`/login`)
- Register funcional com MSW (`/register`)
- 3 telas visualmente fiéis ao Apple (review do Dev Senior)
- `auth.service.ts` com Signals operacional
- Handlers MSW para os 3 endpoints
- Testes Vitest cobrindo todos os cenarios criticos
- Sem `console.error` no browser
- CI Frontend verde

## Impacto na F-Sprint seguinte

A F-Sprint 3 (`specs/103-fsprint-3-shell-notion-auth.md`) consome:
- `auth.service.ts` ja criado (apenas troca o backend mock pelo real)
- Telas Apple ja prontas funcionam exatamente como na F-Sprint 2 (so passam a chamar API real)
- Handlers MSW ficam disponiveis para fallback `dev-offline`

## Restricoes e regras de execucao

- F-Sprint 2 pode rodar em paralelo a Sprint 2 backend (independente — usa MSW)
- Sprint 2 backend so precisa estar pronta a partir da F-Sprint 3 (quando MSW e substituido)
- Todas as 3 telas seguem Apple literalmente; sem mistura com Notion
- Code review por Dev Senior valida fidelidade visual ao DS antes do merge
- Tests obrigatorios em cada PR

## Referencias

- [PRD - API SEP §21 (contratos), §22](../docs-sep/PRD.md)
- [DESIGN-apple.md](../docs-sep/DESIGN-apple.md)
- [WEB-SCREENS-PLAN.md](../docs-sep/WEB-SCREENS-PLAN.md) §5.1, §5.2, §5.3
- [Spec 002 - Sprint 2 backend (paralela)](./002-sprint-2-gestao-usuarios.md)
- [Spec 101 - F-Sprint 1 (anterior)](./101-fsprint-1-design-tokens-showcase.md)
- [Spec 103 - F-Sprint 3 (proxima)](./103-fsprint-3-shell-notion-auth.md)
