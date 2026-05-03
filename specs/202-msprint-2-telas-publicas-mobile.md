# Spec 202 - M-Sprint 2 - Telas Mobile Publicas + MSW

## Metadados

- **ID da Spec**: 202
- **Titulo**: M-Sprint 2 - Splash, Boas-vindas, Login e Register mobile com MSW
- **Status**: aprovada para execucao (apos conclusao da M-Sprint 1)
- **Fase do produto**: Epic 14 - Mobile SEP
- **Trilha**: Mobile (paralela a Sprint 2 backend e F-Sprint 2 frontend web)
- **Origem**: PRD - API SEP, Secao 22 + MOBILE-SCREENS-PLAN.md secoes 6.1-6.4
- **Depende de**: [`201-msprint-1-tokens-notion-mobile.md`](./201-msprint-1-tokens-notion-mobile.md)
- **Responsavel principal**: Dev Mobile

## Objetivo

Implementar as 4 primeiras telas publicas do mobile seguindo Notion mobile-adaptado: splash inicial, boas-vindas/landing mobile, login e register publico. Como o backend Sprint 3 ainda nao tem auth real, as chamadas HTTP sao interceptadas via **MSW** com handlers que simulam os contratos do PRD §21. Permite validar UX, fluxo, ergonomia mobile (toque, teclado virtual, navegacao em pilha) antes da integracao real (M-Sprint 3).

## Escopo

### Em escopo
- Splash / carregamento inicial (verifica token local, redireciona)
- Tela boas-vindas / landing mobile (Notion mobile-adaptado): mensagem curta de valor, entradas para tomador e empresa credora, CTAs login/cadastro
- Tela login (Notion mobile-adaptado) com MSW mockando `POST /api/v1/auth/login`
- Tela register/cadastro publico (Notion mobile-adaptado) com MSW mockando `POST /api/v1/usuarios`
- `auth.service.ts` baseado em Signals (`currentUser` Signal)
- Storage de token: usar Capacitor Preferences API (mais seguro que localStorage em mobile, e funciona em PWA + Android/iOS)
- Handlers MSW para os 3 endpoints
- Testes Vitest cobrindo validacao, sucesso e falha

### Fora de escopo nesta M-Sprint
- Integracao com auth real (M-Sprint 3 — substitui MSW)
- Shell autenticado mobile (M-Sprint 3)
- Telas autenticadas: perfil, alterar senha (M-Sprint 4)
- Recuperacao de senha (futuro, fora desta trilha)

## Pre-requisitos globais

- M-Sprint 1 concluida (tokens Notion mobile + componentes Ionic customizados)
- M-Sprint 0 concluida (MSW configurado em `src/mocks/`)
- Contratos da API publicados em PRD §21 (Sprint 2 backend nao precisa estar pronta)
- Capacitor Preferences plugin instalado: `npm install @capacitor/preferences && npx cap sync`

## Tasks

### Task M-2.1 - Splash / Carregamento Inicial

**Descricao**
Implementar a tela de splash que aparece ao abrir o app, verifica se ha token local salvo via Capacitor Preferences, e decide o redirecionamento (boas-vindas se nao autenticado, dashboard se autenticado e token valido).

**Arquivos esperados**
- `src/app/features/public/splash/splash.component.ts`
- `splash.component.html`, `splash.component.scss`
- `src/app/core/auth/token-storage.service.ts` (wrapper sobre Capacitor Preferences)

**Criterios de verificacao**
- Splash exibe logo SEP por ~1.5s (suficiente para verificar token)
- Se nao houver token, redireciona para `/welcome`
- Se houver token, chama `/auth/me` (M-Sprint 3) ou redireciona para `/welcome` por enquanto (mock retorna ainda nao autenticado)
- Token storage usa Capacitor Preferences (assincrono)
- Testes Vitest cobrem cenario com e sem token

**Pre-requisitos**
- M-Sprint 1 concluida

**Dependencias**
- nenhuma dentro desta M-Sprint

**Responsavel sugerido**
- Dev Mobile

---

### Task M-2.2 - Boas-vindas / Landing Mobile

**Descricao**
Implementar a tela publica que apresenta o produto SEP em formato mobile, orientando o visitante sobre as 2 jornadas (tomador e empresa credora) e direcionando para login ou cadastro.

**Arquivos esperados**
- `src/app/features/public/welcome/welcome.component.ts`
- `welcome.component.html`, `welcome.component.scss`
- imagens placeholder em `src/assets/welcome/` (ilustracoes mobile-friendly)

**Elementos da tela (per MOBILE-SCREENS-PLAN.md §6.2)**
- Marca SEP (logo)
- Mensagem curta de valor
- 2 cards de jornada: "Sou tomador" e "Sou empresa credora"
- CTA primario "Entrar"
- CTA secundario "Criar conta"
- Indicacao de seguranca/confianca em linguagem simples

**Criterios de verificacao**
- Visualmente fiel ao Notion mobile-adaptado
- Responsivo (375px ate tablets, com layout otimizado)
- Funciona sem autenticacao
- Nao depende de API na primeira versao
- Testes Vitest cobrem renderizacao + navegacao para login/register

**Pre-requisitos**
- M-Sprint 1 concluida

**Dependencias**
- pode rodar em paralelo com M-2.3 e M-2.4

**Responsavel sugerido**
- Dev Mobile

---

### Task M-2.3 - Tela Login + MSW

**Descricao**
Tela de login mobile-adaptada (formulario clean, teclado virtual otimizado, autoFocus no email) consumindo `POST /api/v1/auth/login` via MSW.

**Arquivos esperados**
- `src/app/features/public/login/login.component.ts`
- `src/mocks/handlers.ts` com handler para `POST /api/v1/auth/login`
- `src/app/core/auth/auth.service.ts` (Signals-based, com `currentUser` Signal)

**Comportamentos mobile-specific**
- `inputmode="email"` no campo de e-mail (teclado virtual otimizado)
- `autocomplete="username"` e `autocomplete="current-password"`
- Botao de submit ocupa largura total (touch target generoso)
- Erro de credenciais mostra ion-toast com cor semantica

**Criterios de verificacao**
- Form validado (email, senha 6 chars)
- Erro de credenciais mostra ion-toast com feedback claro
- Sucesso armazena token via Capacitor Preferences
- Sucesso redireciona para shell autenticado (em M-Sprint 3)
- Testes Vitest cobrem validacao + sucesso + falha
- MSW intercepta a chamada em dev

**Pre-requisitos**
- M-Sprint 1 concluida

**Dependencias**
- pode rodar em paralelo com M-2.2 e M-2.4

**Responsavel sugerido**
- Dev Mobile

---

### Task M-2.4 - Tela Register + MSW

**Descricao**
Tela de cadastro publico mobile-adaptada consumindo `POST /api/v1/usuarios` via MSW.

**Arquivos esperados**
- `src/app/features/public/register/register.component.ts`
- `src/mocks/handlers.ts` complementado com handler para `POST /api/v1/usuarios`

**Lacuna a confirmar (per MOBILE-SCREENS-PLAN.md §6.4 Lacuna)**
> Antes de app publico real, revisar se cadastro mobile pode criar apenas cliente/tomador e nao admin.

Por enquanto, na M-Sprint 2, o cadastro segue o mesmo PRD (cria ADMIN ou CLIENTE). A restricao para apenas CLIENTE no mobile vira em revisao futura, antes da publicacao em store.

**Criterios de verificacao**
- Form validado (email, senha 6 chars exatos, role)
- Erro de username duplicado mostra ion-toast (mock retorna 409)
- Sucesso redireciona para login
- Testes cobrem todos os cenarios

**Pre-requisitos**
- M-Sprint 1 concluida

**Dependencias**
- pode rodar em paralelo com M-2.2 e M-2.3

**Responsavel sugerido**
- Dev Mobile

---

## Grafo de dependencias entre as tasks

```
M-Sprint 1 concluida
       |
       +---> M-2.1 (Splash)            [pode comecar primeiro pois e infraestrutura]
       +---> M-2.2 (Boas-vindas)       [pode rodar em paralelo]
       +---> M-2.3 (Login)             [pode rodar em paralelo]
       +---> M-2.4 (Register)          [pode rodar em paralelo]
```

## Definicao de pronto da M-Sprint 2

- 4 telas publicas mobile navegaveis (splash, boas-vindas, login, register)
- Login e Register funcionais com MSW mockando contratos
- Token storage via Capacitor Preferences operacional
- `auth.service.ts` com Signals
- Handlers MSW para os 3 endpoints
- Testes Vitest cobrindo todos os cenarios criticos
- Sem `console.error` no PWA
- Mobile CI verde

## Impacto na M-Sprint seguinte

A M-Sprint 3 (`specs/203-msprint-3-shell-mobile-auth.md`) consome:
- `auth.service.ts` ja criado (apenas troca o backend mock pelo real)
- Telas mobile ja prontas continuam funcionando, so passam a chamar API real
- `token-storage.service.ts` operacional para guardar JWT

## Restricoes e regras de execucao

- M-Sprint 2 pode rodar em paralelo a Sprint 2 backend (independente — usa MSW)
- Sprint 3 backend so e necessaria a partir da M-Sprint 3 (quando MSW e substituido)
- Todas as telas seguem Notion mobile-adaptado; sem mistura com Apple
- Code review por Dev Senior valida contratos HTTP + validacao de formulario
- Tests obrigatorios em cada PR
- Validar em PWA real (Chrome DevTools mobile viewport ou device fisico via `ionic serve --external`)

## Referencias

- [PRD - API SEP §21 (contratos), §22](../docs-sep/PRD.md)
- [DESIGN-notion.md](../docs-sep/DESIGN-notion.md)
- [MOBILE-SCREENS-PLAN.md §6.1, §6.2, §6.3, §6.4](../docs-sep/MOBILE-SCREENS-PLAN.md)
- [Capacitor Preferences API](https://capacitorjs.com/docs/apis/preferences)
- [Spec 002 - Sprint 2 backend (paralela)](./002-sprint-2-gestao-usuarios.md)
- [Spec 102 - F-Sprint 2 frontend web (paralela)](./102-fsprint-2-telas-apple-publicas.md)
- [Spec 201 - M-Sprint 1 (anterior)](./201-msprint-1-tokens-notion-mobile.md)
- [Spec 203 - M-Sprint 3 (proxima)](./203-msprint-3-shell-mobile-auth.md)
