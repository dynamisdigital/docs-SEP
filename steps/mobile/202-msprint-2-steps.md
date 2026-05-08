# Steps - M-Sprint 2 - Telas Mobile Publicas + MSW

**Spec de origem**: [`specs/fase-1/202-msprint-2-telas-publicas-mobile.md`](../../specs/fase-1/202-msprint-2-telas-publicas-mobile.md)

**Status**: concluida em 2026-05-07 no repo `sep-mobile`, branch `feature/msprint-2-telas-publicas-mobile`.

**Objetivo geral**: implementar as telas publicas iniciais do app mobile SEP seguindo o design system Notion adaptado para mobile: splash, boas-vindas, login e cadastro publico. Nesta sprint, as chamadas HTTP usam MSW para simular os contratos do PRD secao 21 antes da integracao real prevista para a M-Sprint 3.

**Esforco total estimado**: 3-4 dias de Dev Mobile dedicado.

**Repo de destino**: `sep-mobile` (clonado em `<sep-mobile-root>/` na maquina do dev). Modelo de 3 repos independentes (PRD secao 11, AGENT.md).

**Localizacao do projeto mobile**: `<sep-mobile-root>/`.

**Lembrete sobre fronteira de design system**: no mobile **so se usa Notion**, inclusive em telas publicas. Nao usar tokens Apple e nao adicionar framework CSS terceiro.

**Estado observado antes da sprint**:
- A M-Sprint 1 ja entregou tokens, tipografia, mixins e showcase Notion mobile.
- O app mobile configura providers diretamente em `src/main.ts`; nao existe `src/app/app.config.ts`.
- `@capacitor/preferences` ainda precisa ser instalado para esta sprint.
- `src/mocks/handlers.ts` ja possui mocks iniciais de `auth/login` e `auth/me`, mas deve ser substituido/expandido por handlers com sucesso e falha.

**Resultado observado apos a sprint**:
- `@capacitor/preferences` instalado e usado por `TokenStorageService`.
- `src/main.ts` passou a prover `HttpClient`.
- Rotas publicas em `features/public/public.routes.ts`.
- Telas entregues: `splash`, `welcome`, `login`, `register`.
- `core/api/api.models.ts`, `core/auth/auth.service.ts` e `core/auth/token-storage.service.ts` implementados.
- `src/mocks/handlers.ts` cobre login, `/auth/me` e cadastro publico.
- Fixes finais aplicados para exibir caracteres digitados em `ion-input` e impedir que dark mode do browser quebre o visual Notion.
- Validacao local em 2026-05-07: `npm run lint`, `npm run lint:scss`, `npm run test` (8 arquivos, 28 testes) e `npm run build` passaram.
- `npm run e2e` executado apos a atualizacao documental: 2/3 testes passaram; o smoke do splash falhou por assert procurando `Credito empresarial...` como heading, enquanto o texto real esta em paragrafo na tela `/welcome`.
- Warnings remanescentes nao bloqueantes: budget SCSS em `welcome.component.scss` e `design-system/pages/typography.component.scss`; Sass legacy JS API no Vitest; stderr Ionic em teste de splash sem falhar suite.

**Ordem de execucao recomendada**:

```text
M-2.0 (prechecks)
   |
   v
M-2.1 (dependencias + HttpClient)
   |
   v
M-2.2 (rotas publicas)
   |
   v
M-2.3 (contratos + TokenStorage + AuthService)
   |
   v
M-2.4 (MSW handlers)
   |
   +---> M-2.5 (splash)
   |
   +---> M-2.6 (welcome)
   |
   +---> M-2.7 (login + register)
             |
             v
M-2.8 (testes e validacao final)
```

- M-2.0 e obrigatoria antes de qualquer edicao.
- M-2.1 prepara a dependencia mobile e o `HttpClient` usado pelos servicos.
- M-2.2 cria a navegacao publica e preserva `/design-system`.
- M-2.3 cria os contratos e servicos compartilhados por splash/login/register.
- M-2.4 deixa os mocks alinhados ao PRD antes das telas consumirem HTTP.
- M-2.5, M-2.6 e M-2.7 podem ser distribuidas entre devs depois de M-2.4, desde que nao editem os mesmos arquivos ao mesmo tempo.
- M-2.8 fecha a sprint inteira.

**Como usar este arquivo**:
1. Execute os prechecks da Task M-2.0.
2. Execute cada task na ordem indicada.
3. Em cada step, rode a verificacao antes de seguir.
4. Ao final da Task, valide a "Definicao de pronto" da task.
5. Comite com mensagens Conventional Commits por task ou por grupo coerente.
6. Nao avance para a M-Sprint 3 sem a M-Sprint 2 verde localmente.

**Pre-requisitos globais**:
- M-Sprint 0 concluida: Ionic 8.4+ + Angular 20.x + Capacitor + MSW + Vitest + Playwright + lint/build configurados.
- M-Sprint 1 concluida: tokens Notion mobile em `src/styles/` e `src/theme/variables.scss`.
- Contratos do PRD secao 21 disponiveis.
- Backend real nao e dependencia desta sprint; usar MSW.
- Nenhum framework CSS terceiro deve ser adicionado.

**Fora de escopo durante estes steps**:
- Integracao com auth real.
- Shell autenticado mobile.
- Telas autenticadas de perfil, alterar senha ou dashboards.
- Recuperacao de senha.
- Plataformas nativas Android/iOS como alvo funcional; a validacao continua PWA-first.

---

## Task M-2.0 - Prechecks da M-Sprint 2

**Objetivo**: confirmar que o repo mobile esta pronto para receber as telas publicas e que a M-Sprint 1 esta verde.

**Pre-requisito**: branch da M-Sprint 2 criada a partir de `develop` atualizada.

**Esforco**: 20-30 min.

### Step 202.0.1 - Confirmar estrutura do app mobile

**Comando**:
```bash
cd <sep-mobile-root>
ls -la package.json angular.json capacitor.config.ts src/app src/styles src/theme src/mocks
ls -la src/styles/_notion-mobile-tokens.scss src/styles/_notion-mobile-typography.scss src/styles/_notion-mobile-components.scss src/theme/variables.scss
```

**Verificacao**:
- `package.json`, `angular.json`, `capacitor.config.ts`, `src/app`, `src/styles`, `src/theme` e `src/mocks` existem.
- Os arquivos de tokens, tipografia, componentes e variables da M-Sprint 1 existem.
- Se qualquer arquivo da M-Sprint 1 estiver ausente, abortar e concluir a M-Sprint 1 antes.

### Step 202.0.2 - Confirmar scripts e dependencias

**Comando**:
```bash
cd <sep-mobile-root>
node -v
npm -v
npx ng version
npm ls @ionic/angular @capacitor/core @analogjs/vite-plugin-angular msw --depth=0
npm run
```

**Verificacao**:
- Node `20.x` ou superior.
- Angular `20.x`.
- Ionic Angular `8.x`.
- Scripts existentes: `lint`, `lint:scss`, `test`, `build`, `start`.
- MSW ja instalado.

### Step 202.0.3 - Confirmar MSW e rotas atuais

**Comando**:
```bash
cd <sep-mobile-root>
ls -la src/mocks/browser.ts src/mocks/handlers.ts src/mocks/server.ts public/mockServiceWorker.js
sed -n '1,220p' src/main.ts
sed -n '1,180p' src/app/app.routes.ts
```

**Verificacao**:
- MSW esta configurado.
- `src/main.ts` carrega MSW por flag localStorage `NG_APP_USE_MSW`.
- `/design-system` existe e deve ser preservada.
- O provider de rotas esta em `src/main.ts`, nao em `app.config.ts`.

### Step 202.0.4 - Rodar baseline antes de editar

**Comando**:
```bash
cd <sep-mobile-root>
npm run lint
npm run lint:scss
npm run test
npm run build
```

**Verificacao**:
- Todos os comandos passam antes de iniciar a implementacao.
- Falha herdada deve ser corrigida antes de implementar as telas.
- Warning de budget CSS nao bloqueia a sprint, mas deve ser registrado se continuar aparecendo.

### Definicao de pronto da Task M-2.0
- [ ] Estrutura do app mobile validada
- [ ] Tokens Notion mobile da M-Sprint 1 presentes
- [ ] MSW existente e compreendido
- [ ] Scripts e dependencias principais confirmados
- [ ] Baseline de lint/test/build passa

### Commit Task M-2.0
Nao gera commit - e apenas validacao do ambiente.

---

## Task M-2.1 - Dependencias mobile e HttpClient

**Objetivo**: instalar a persistencia de token apropriada para mobile/PWA e habilitar `HttpClient` no bootstrap atual do Ionic/Angular.

**Pre-requisito**: Task M-2.0 concluida.

**Esforco**: 30-45 min.

**Arquivos afetados**:
- `<sep-mobile-root>/package.json`
- `<sep-mobile-root>/package-lock.json`
- `<sep-mobile-root>/src/main.ts`

### Step 202.1.1 - Instalar Capacitor Preferences

**Comando**:
```bash
cd <sep-mobile-root>
npm install @capacitor/preferences
npx cap sync
```

**Verificacao**:
```bash
cd <sep-mobile-root>
npm ls @capacitor/preferences --depth=0
npm run build
```

**Espera**:
- `@capacitor/preferences` aparece em `dependencies`.
- `package-lock.json` atualizado.
- Build continua verde.

### Step 202.1.2 - Habilitar HttpClient no bootstrap

**Arquivo**: `<sep-mobile-root>/src/main.ts`

**Mudanca esperada**:
```ts
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
```

Adicionar no array `providers` do `bootstrapApplication`:
```ts
provideHttpClient(withInterceptorsFromDi()),
```

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
npm run build
```

### Definicao de pronto da Task M-2.1
- [ ] `@capacitor/preferences` instalado
- [ ] `npx cap sync` executado
- [ ] `HttpClient` disponivel via providers em `src/main.ts`
- [ ] `npm run lint` e `npm run build` passam

### Commit Task M-2.1
Mensagem sugerida:
```text
chore(mobile): adicionar preferences e http client
```

---

## Task M-2.2 - Base de rotas publicas

**Objetivo**: criar a estrutura lazy de rotas publicas e fazer o app abrir no splash.

**Pre-requisito**: Task M-2.1 concluida.

**Esforco**: 1-2 horas.

**Arquivos afetados**:
- `<sep-mobile-root>/src/app/app.routes.ts`
- `<sep-mobile-root>/src/app/features/public/public.routes.ts`
- pastas em `<sep-mobile-root>/src/app/features/public/{splash,welcome,login,register}`

### Step 202.2.1 - Criar estrutura de features publicas

**Comando**:
```bash
cd <sep-mobile-root>
mkdir -p src/app/features/public/splash
mkdir -p src/app/features/public/welcome
mkdir -p src/app/features/public/login
mkdir -p src/app/features/public/register
mkdir -p src/app/core/api
mkdir -p src/app/core/auth
```

**Verificacao**:
```bash
cd <sep-mobile-root>
ls -la src/app/features/public src/app/core/api src/app/core/auth
```

### Step 202.2.2 - Criar componentes placeholder minimos

**Arquivos**:
- `<sep-mobile-root>/src/app/features/public/splash/splash.component.ts`
- `<sep-mobile-root>/src/app/features/public/welcome/welcome.component.ts`
- `<sep-mobile-root>/src/app/features/public/login/login.component.ts`
- `<sep-mobile-root>/src/app/features/public/register/register.component.ts`

**Conteudo esperado nesta etapa**:
- Standalone components.
- Imports Ionic standalone minimos (`IonContent`, `IonButton` quando necessario).
- Templates inline simples apenas para permitir build.
- Estilos podem ficar vazios nesta etapa se as telas forem implementadas nas Tasks M-2.5 a M-2.7.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
```

### Step 202.2.3 - Criar rotas publicas lazy

**Arquivo**: `<sep-mobile-root>/src/app/features/public/public.routes.ts`

**Conteudo esperado**:
```ts
import { Routes } from '@angular/router';

export const PUBLIC_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./splash/splash.component').then((m) => m.SplashComponent),
  },
  {
    path: 'welcome',
    loadComponent: () => import('./welcome/welcome.component').then((m) => m.WelcomeComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.component').then((m) => m.RegisterComponent),
  },
];
```

### Step 202.2.4 - Atualizar rotas raiz

**Arquivo**: `<sep-mobile-root>/src/app/app.routes.ts`

**Conteudo esperado**:
```ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./features/public/public.routes').then((m) => m.PUBLIC_ROUTES),
  },
  {
    path: 'design-system',
    loadChildren: () =>
      import('./features/design-system/design-system.routes').then((m) => m.DESIGN_SYSTEM_ROUTES),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
```

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run build
```

### Definicao de pronto da Task M-2.2
- [ ] Estrutura `features/public` criada
- [ ] Rotas `/`, `/welcome`, `/login`, `/register` existem por lazy loading
- [ ] `/design-system` preservada
- [ ] Rota inicial aponta para splash
- [ ] `npm run build` passa

### Commit Task M-2.2
Mensagem sugerida:
```text
feat(mobile): criar rotas publicas
```

---

## Task M-2.3 - Contratos, TokenStorageService e AuthService

**Objetivo**: criar os tipos alinhados ao PRD secao 21, encapsular o storage de token via Capacitor Preferences e disponibilizar um `AuthService` baseado em Signals para login, cadastro, usuario atual e logout.

**Pre-requisito**: Task M-2.2 concluida.

**Esforco**: 3-4 horas.

**Arquivos afetados**:
- `<sep-mobile-root>/src/app/core/api/api.models.ts`
- `<sep-mobile-root>/src/app/core/auth/token-storage.service.ts`
- `<sep-mobile-root>/src/app/core/auth/auth.service.ts`

### Step 202.3.1 - Criar modelos dos contratos PRD secao 21

**Arquivo**: `<sep-mobile-root>/src/app/core/api/api.models.ts`

**Conteudo esperado**:
```ts
export type UsuarioRole = 'ADMIN' | 'CLIENTE';

export interface UsuarioResponse {
  id: string;
  username: string;
  role: UsuarioRole;
  dataCriacao: string;
  dataModificacao: string;
  criadoPor: string;
  modificadoPor: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  usuario: UsuarioResponse;
}

export interface UsuarioCreateRequest {
  username: string;
  password: string;
  role: UsuarioRole;
}

export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  traceId?: string;
}
```

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
```

### Step 202.3.2 - Criar TokenStorageService

**Arquivo**: `<sep-mobile-root>/src/app/core/auth/token-storage.service.ts`

**Comportamento esperado**:
- Usar `Preferences` de `@capacitor/preferences`.
- Chave fixa: `sep.auth.accessToken`.
- Metodos publicos:
  - `getToken(): Promise<string | null>`
  - `setToken(token: string): Promise<void>`
  - `clearToken(): Promise<void>`
- Nao usar `localStorage` para token.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
npm run test
```

### Step 202.3.3 - Criar AuthService com Signals

**Arquivo**: `<sep-mobile-root>/src/app/core/auth/auth.service.ts`

**Comportamento esperado**:
- `currentUser` como signal privado gravavel e leitura publica.
- `isAuthenticated` como `computed`.
- `login(request: LoginRequest)` chama `POST /api/v1/auth/login`, salva token via `TokenStorageService` e atualiza usuario.
- `register(request: UsuarioCreateRequest)` chama `POST /api/v1/usuarios`.
- `loadCurrentUser()` chama `GET /api/v1/auth/me` apenas quando houver token; se falhar, limpa token e usuario.
- `logout()` limpa token e usuario.
- Base URL constante nesta sprint: `http://localhost:8080/api/v1`.
- Sem interceptor JWT nesta sprint; isso fica para M-Sprint 3.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
npm run test
```

### Step 202.3.4 - Testar servicos compartilhados

**Arquivos esperados**:
- `<sep-mobile-root>/src/app/core/auth/token-storage.service.spec.ts`
- `<sep-mobile-root>/src/app/core/auth/auth.service.spec.ts`

**Cenarios minimos**:
- `TokenStorageService` salva, le e remove token.
- `AuthService.login` atualiza `currentUser` e salva token.
- `AuthService.logout` limpa usuario e token.
- `AuthService.loadCurrentUser` sem token retorna `null` ou estado nao autenticado sem chamar API.
- Falha em `loadCurrentUser` limpa a sessao local.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run test
```

### Definicao de pronto da Task M-2.3
- [ ] Modelos TypeScript alinhados ao PRD secao 21
- [ ] Token salvo apenas via Capacitor Preferences
- [ ] `AuthService` usa Signals
- [ ] Login, cadastro, carregamento de usuario e logout modelados
- [ ] Testes unitarios dos servicos passam

### Commit Task M-2.3
Mensagem sugerida:
```text
feat(mobile): adicionar auth service com preferences
```

---

## Task M-2.4 - MSW handlers dos contratos publicos

**Objetivo**: substituir os stubs iniciais por handlers MSW que cubram sucesso e falha dos endpoints publicos usados nesta sprint.

**Pre-requisito**: Task M-2.3 concluida.

**Esforco**: 1-2 horas.

**Arquivos afetados**:
- `<sep-mobile-root>/src/mocks/handlers.ts`

### Step 202.4.1 - Criar massa mock compartilhada

**Arquivo**: `<sep-mobile-root>/src/mocks/handlers.ts`

**Dados esperados**:
- Usuario cliente:
  - `id`: UUID fixo
  - `username`: `cliente@empresa.com`
  - `role`: `CLIENTE`
- Usuario admin para cadastro:
  - `role`: `ADMIN`
- Datas ISO-8601 com offset `-03:00`.
- Token mock: `mock-jwt-token`.

### Step 202.4.2 - Implementar handler de login

**Endpoint**: `POST http://localhost:8080/api/v1/auth/login`

**Comportamento esperado**:
- Se `username` for `cliente@empresa.com` e `password` for `123456`, retornar `200` com `TokenResponse`.
- Para qualquer outro par de credenciais, retornar `401` com `ApiErrorResponse`.

### Step 202.4.3 - Implementar handler de auth/me

**Endpoint**: `GET http://localhost:8080/api/v1/auth/me`

**Comportamento esperado**:
- Se header `Authorization` tiver `Bearer mock-jwt-token`, retornar `200` com `UsuarioResponse`.
- Sem token ou token diferente, retornar `401` com `ApiErrorResponse`.

### Step 202.4.4 - Implementar handler de cadastro

**Endpoint**: `POST http://localhost:8080/api/v1/usuarios`

**Comportamento esperado**:
- Se `username` for `duplicado@empresa.com`, retornar `409` com `ApiErrorResponse`.
- Se `password` nao tiver exatamente 6 caracteres, retornar `400`.
- Se `role` nao for `ADMIN` ou `CLIENTE`, retornar `400`.
- Caso contrario, retornar `201` com `UsuarioResponse`.

**Observacao de produto**:
Nesta M-Sprint, o cadastro mobile ainda aceita `ADMIN` ou `CLIENTE`, conforme PRD e spec 202. A restricao para apenas cliente/tomador fica como revisao futura antes de publicacao em store.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
npm run test
```

### Definicao de pronto da Task M-2.4
- [ ] `auth/login`, `auth/me` e `usuarios` mockados
- [ ] Sucesso e falhas principais cobertos
- [ ] Erros seguem `ApiErrorResponse`
- [ ] Handlers alinhados ao PRD secao 21

### Commit Task M-2.4
Mensagem sugerida:
```text
feat(mobile): mockar contratos publicos com msw
```

---

## Task M-2.5 - Splash / carregamento inicial

**Objetivo**: implementar a tela inicial que verifica a sessao local e decide o redirecionamento publico.

**Pre-requisito**: Task M-2.4 concluida.

**Esforco**: 2-3 horas.

**Arquivos afetados**:
- `<sep-mobile-root>/src/app/features/public/splash/splash.component.ts`
- `<sep-mobile-root>/src/app/features/public/splash/splash.component.scss`
- `<sep-mobile-root>/src/app/features/public/splash/splash.component.spec.ts`

### Step 202.5.1 - Implementar comportamento do splash

**Comportamento esperado**:
- Renderizar marca `SEP` e indicador de carregamento discreto.
- Aguardar aproximadamente 1.5s antes de navegar, para evitar flash visual.
- Chamar `AuthService.loadCurrentUser()`.
- Se retornar usuario, navegar temporariamente para `/welcome` nesta sprint.
- Se nao houver usuario/token valido, navegar para `/welcome`.
- Nao acessar dashboard autenticado nesta sprint; isso entra na M-Sprint 3.

### Step 202.5.2 - Aplicar visual Notion mobile

**Regras visuais**:
- Usar `ion-content`.
- Fundo warm Notion.
- Conteudo centralizado sem card decorativo.
- Logo/titulo com tipografia Notion mobile.
- Touch e espacamentos alinhados aos tokens da M-Sprint 1.

### Step 202.5.3 - Testar splash

**Cenarios minimos**:
- Sem token navega para `/welcome`.
- Com token invalido limpa sessao e navega para `/welcome`.
- Renderiza marca SEP.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run test
npm run build
```

### Definicao de pronto da Task M-2.5
- [ ] Splash e rota inicial funcionando
- [ ] Sessao local consultada via `AuthService`
- [ ] Redirecionamento para `/welcome` definido para todos os cenarios desta sprint
- [ ] Testes do splash passam

### Commit Task M-2.5
Mensagem sugerida:
```text
feat(mobile): implementar splash publico
```

---

## Task M-2.6 - Boas-vindas / landing mobile

**Objetivo**: implementar a tela publica que apresenta o SEP e direciona para login ou cadastro.

**Pre-requisito**: Task M-2.4 concluida.

**Esforco**: 3-4 horas.

**Arquivos afetados**:
- `<sep-mobile-root>/src/app/features/public/welcome/welcome.component.ts`
- `<sep-mobile-root>/src/app/features/public/welcome/welcome.component.scss`
- `<sep-mobile-root>/src/app/features/public/welcome/welcome.component.spec.ts`

### Step 202.6.1 - Implementar conteudo da tela

**Elementos obrigatorios**:
- Marca SEP.
- Mensagem curta de valor para capital de giro.
- Dois cards simples de jornada:
  - `Sou tomador`
  - `Sou empresa credora`
- CTA primario `Entrar` navegando para `/login`.
- CTA secundario `Criar conta` navegando para `/register`.
- Indicacao simples de seguranca/confianca.

**Texto sugerido**:
- Headline: `Credito empresarial com acompanhamento simples`
- Apoio: `Solicite, acompanhe e organize sua jornada de emprestimo pelo app SEP.`
- Seguranca: `Ambiente preparado para cadastro seguro e auditoria das operacoes.`

### Step 202.6.2 - Aplicar layout mobile

**Regras visuais**:
- Usar `ion-content` com area principal vertical.
- Nao criar hero de marketing complexo.
- Cards com raio e sombra Notion mobile.
- Botoes com touch target confortavel.
- Layout responsivo de 375px ate tablet.

### Step 202.6.3 - Testar welcome

**Cenarios minimos**:
- Renderiza marca, headline e dois cards de jornada.
- Botao `Entrar` navega para `/login`.
- Botao `Criar conta` navega para `/register`.
- Nao faz chamada HTTP.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run test
npm run build
```

### Definicao de pronto da Task M-2.6
- [ ] Welcome renderiza proposta de valor
- [ ] Jornadas tomador e empresa credora aparecem
- [ ] CTAs navegam corretamente
- [ ] Tela nao depende de API
- [ ] Testes passam

### Commit Task M-2.6
Mensagem sugerida:
```text
feat(mobile): implementar boas vindas publicas
```

---

## Task M-2.7 - Login e cadastro publico

**Objetivo**: implementar formularios publicos mobile para autenticar e cadastrar usuario via MSW.

**Pre-requisito**: Tasks M-2.3 e M-2.4 concluidas.

**Esforco**: 5-7 horas.

**Arquivos afetados**:
- `<sep-mobile-root>/src/app/features/public/login/login.component.ts`
- `<sep-mobile-root>/src/app/features/public/login/login.component.scss`
- `<sep-mobile-root>/src/app/features/public/login/login.component.spec.ts`
- `<sep-mobile-root>/src/app/features/public/register/register.component.ts`
- `<sep-mobile-root>/src/app/features/public/register/register.component.scss`
- `<sep-mobile-root>/src/app/features/public/register/register.component.spec.ts`

### Step 202.7.1 - Implementar LoginComponent

**Comportamento esperado**:
- Reactive Form com:
  - `username`: obrigatorio, e-mail valido
  - `password`: obrigatorio, exatamente 6 caracteres
- Campo e-mail com `type="email"`, `inputmode="email"` e `autocomplete="username"`.
- Campo senha com `type="password"` e `autocomplete="current-password"`.
- Submit chama `AuthService.login`.
- Sucesso salva token pelo servico e navega temporariamente para `/welcome` nesta sprint.
- Falha `401` mostra `ion-toast` com mensagem clara.
- Link para `/register`.

**Observacao**:
O redirecionamento para shell autenticado entra na M-Sprint 3. Nesta sprint, manter `/welcome` apos sucesso para evitar criar shell fora de escopo.

### Step 202.7.2 - Implementar RegisterComponent

**Comportamento esperado**:
- Reactive Form com:
  - `username`: obrigatorio, e-mail valido
  - `password`: obrigatorio, exatamente 6 caracteres
  - `role`: obrigatorio, valores `CLIENTE` ou `ADMIN`
- Valor padrao recomendado: `CLIENTE`.
- Submit chama `AuthService.register`.
- Sucesso mostra feedback e navega para `/login`.
- Falha `409` mostra erro de e-mail duplicado.
- Falha `400` mostra erro generico de validacao.
- Link para `/login`.

### Step 202.7.3 - Aplicar ergonomia mobile

**Regras visuais e UX**:
- Usar componentes Ionic standalone.
- Submit com largura total e altura minima compativel com touch target.
- Mensagens de erro inline para campos tocados/invalidos.
- `ion-toast` para falhas de API.
- Espacamento suficiente para teclado virtual.
- Nao usar cards aninhados.

### Step 202.7.4 - Testar login e register

**Cenarios minimos do login**:
- Campos obrigatorios.
- E-mail invalido.
- Senha diferente de 6 caracteres.
- Credenciais validas chamam servico e navegam.
- Credenciais invalidas mostram toast/erro.

**Cenarios minimos do register**:
- Campos obrigatorios.
- E-mail invalido.
- Senha diferente de 6 caracteres.
- Role obrigatorio.
- Cadastro valido navega para login.
- E-mail duplicado mostra erro.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run test
npm run build
```

### Definicao de pronto da Task M-2.7
- [ ] Login funcional com MSW
- [ ] Cadastro funcional com MSW
- [ ] Validacoes de formulario implementadas
- [ ] Toasts de erro implementados
- [ ] Token salvo em sucesso de login
- [ ] Testes criticos passam

### Commit Task M-2.7
Mensagem sugerida:
```text
feat(mobile): implementar login e cadastro publicos
```

---

## Task M-2.8 - Testes, E2E leve e validacao final

**Objetivo**: fechar a sprint com suite local verde e validacao visual/funcional minima em PWA.

**Pre-requisito**: Tasks M-2.5, M-2.6 e M-2.7 concluidas.

**Esforco**: 2-3 horas.

### Step 202.8.1 - Rodar suite completa

**Comando**:
```bash
cd <sep-mobile-root>
npm run lint
npm run lint:scss
npm run test
npm run build
```

**Verificacao**:
- Todos os comandos passam.
- Se houver warning de budget CSS, registrar no PR; se virar erro, ajustar CSS ou budget antes de concluir.

### Step 202.8.2 - Validar MSW em PWA local

**Comando**:
```bash
cd <sep-mobile-root>
npm run start
```

**Passos manuais no navegador**:
1. Abrir `http://localhost:8100`.
2. Ativar MSW no console:
   ```js
   localStorage.setItem('NG_APP_USE_MSW', 'true')
   ```
3. Recarregar a pagina.
4. Validar `/welcome`, `/login` e `/register`.
5. Login valido: `cliente@empresa.com` / `123456`.
6. Login invalido: qualquer outra credencial.
7. Cadastro duplicado: `duplicado@empresa.com`.

**Verificacao**:
- MSW intercepta as chamadas.
- Nao aparecem `console.error` inesperados.
- Fluxos funcionam em viewport mobile.

### Step 202.8.3 - Adicionar ou ajustar smoke E2E

**Arquivo esperado**:
- `<sep-mobile-root>/e2e/smoke.spec.ts`

**Cenarios minimos**:
- App abre e redireciona para welcome.
- Welcome navega para login.
- Welcome navega para register.
- Login valido com MSW nao quebra o app.
- Register valido navega para login.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run e2e
```

**Observacao**:
Se o ambiente local nao suportar browser do Playwright, registrar a limitacao e manter `npm run lint`, `npm run lint:scss`, `npm run test` e `npm run build` como gates obrigatorios.

### Step 202.8.4 - Conferir working tree e arquivos novos

**Comando**:
```bash
cd <sep-mobile-root>
git status --short
git ls-files --others --exclude-standard src e2e package.json package-lock.json capacitor.config.ts
```

**Verificacao**:
- Arquivos novos esperados aparecem e serao adicionados explicitamente.
- Nao adicionar `.angular/`, `coverage/`, `www/`, `test-results/`, `playwright-report/` ou arquivos locais.

### Definicao de pronto da M-Sprint 2
- [x] Splash, welcome, login e register navegaveis
- [x] Login e register usam MSW
- [x] Token storage via Capacitor Preferences
- [x] `AuthService` com Signals
- [x] Handlers MSW para `auth/login`, `auth/me` e `usuarios`
- [x] Testes Vitest cobrindo servicos e telas criticas
- [x] Smoke E2E atualizado; execucao local documentada com 2/3 passando e ajuste pendente no assert do splash
- [x] `npm run lint`, `npm run lint:scss`, `npm run test` e `npm run build` passam
- [ ] Validacao manual PWA sem `console.error` inesperado ainda deve ser confirmada junto do ajuste E2E

### Commit Task M-2.8
Mensagem sugerida:
```text
test(mobile): validar telas publicas da msprint 2
```

---

## Descricao sugerida de PR da M-Sprint 2

**Titulo sugerido**:
```text
feat(mobile): implementar telas publicas com msw
```

**Resumo**:
- Implementa splash, boas-vindas, login e cadastro publico no mobile.
- Adiciona `AuthService` com Signals e storage via Capacitor Preferences.
- Mocka contratos de auth/usuarios com MSW para validar a UX antes do backend real.
- Inclui fixes finais para inputs Ionic e dark mode do browser.

**Escopo tecnico**:
- Rotas publicas lazy em `features/public`.
- Contratos TypeScript alinhados ao PRD secao 21.
- Handlers MSW para `POST /auth/login`, `GET /auth/me` e `POST /usuarios`.
- Testes unitarios e smoke E2E dos fluxos publicos.

**Como validar**:
```bash
npm run lint
npm run lint:scss
npm run test
npm run build
npm run e2e
```

**Riscos / breaking changes**:
- Nenhum breaking change esperado.
- O login ainda redireciona temporariamente para `/welcome`; o shell autenticado entra na M-Sprint 3.
- Cadastro mobile ainda permite `ADMIN` e `CLIENTE`, conforme PRD atual; restringir para cliente/tomador e revisao futura.
- Build verde com warnings nao bloqueantes de budget SCSS.
- Smoke E2E atualizado, mas `npm run e2e` local ficou 2/3: ajustar o assert do splash para validar o paragrafo/headline real da tela welcome.

**Referencias**:
- `docs-SEP/specs/fase-1/202-msprint-2-telas-publicas-mobile.md`
- `docs-SEP/docs-sep/MOBILE-SCREENS-PLAN.md` secoes 6.1 a 6.4
- `docs-SEP/docs-sep/PRD.md` secoes 20 e 21
