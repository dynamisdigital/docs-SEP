# Steps - M-Sprint 3 - Auth Real + Shell Mobile + Guards

**Spec de origem**: [`specs/fase-1/203-msprint-3-shell-mobile-auth.md`](../../specs/fase-1/203-msprint-3-shell-mobile-auth.md)

**Status**: planejada para execucao no repo `sep-mobile`, branch sugerida `feature/msprint-3-shell-mobile-auth`.

**Objetivo geral**: trocar o fluxo principal de autenticacao para a API real entregue pela Sprint 3 backend, manter MSW como fallback `dev-offline`, implementar shell mobile autenticado com tabs inferiores e introduzir guards/interceptors funcionais para sessao, autorizacao e tratamento centralizado de `401`/`403`.

**Esforco total estimado**: 3-4 dias de Dev Mobile dedicado.

**Repo de destino**: `sep-mobile` (clonado em `<sep-mobile-root>/` na maquina do dev). Modelo de 3 repos independentes (PRD secao 11, AGENT.md).

**Localizacao do projeto mobile**: `<sep-mobile-root>/`.

**Lembrete sobre fronteira de design system**: no mobile **so se usa Notion**, inclusive em telas publicas e autenticadas. Nao usar tokens Apple e nao adicionar framework CSS terceiro.

**Estado observado antes da sprint**:
- A M-Sprint 2 entregou `AuthService`, `TokenStorageService` com Capacitor Preferences, telas publicas e MSW.
- `src/main.ts` configura providers diretamente no `bootstrapApplication`; nao existe `src/app/app.config.ts`.
- `AuthService` ainda possui `API_BASE_URL` hardcoded e envia `Authorization` manualmente em `loadCurrentUser()`.
- `src/main.ts` usa `provideHttpClient(withInterceptorsFromDi())`; a M-Sprint 3 deve trocar para interceptors funcionais.
- `src/app/app.routes.ts` possui rotas publicas, `/design-system` e wildcard.

**Ordem de execucao recomendada**:

```text
M-3.0 (prechecks)
   |
   v
M-3.1 (environments + MSW dev-offline)
   |
   v
M-3.2 (AuthService + sessao com Preferences)
   |
   +---> M-3.3 (interceptors funcionais)
   |
   +---> M-3.4 (guards funcionais)
            |
            v
M-3.5 (rotas autenticadas + shell tabs)
   |
   v
M-3.6 (paginas 401/403 + redirects publicos)
   |
   v
M-3.7 (testes e validacao final)
```

- M-3.0 e obrigatoria antes de qualquer edicao.
- M-3.1 e M-3.2 preparam a integracao real com backend.
- M-3.3 e M-3.4 podem ser executadas em paralelo depois de M-3.2, desde que nao editem os mesmos testes ao mesmo tempo.
- M-3.5 depende de guards/interceptors para proteger o shell.
- M-3.6 cria apenas paginas minimas de suporte; telas autenticadas concretas entram na M-Sprint 4.
- M-3.7 fecha a sprint inteira.

**Como usar este arquivo**:
1. Execute os prechecks da Task M-3.0.
2. Execute cada task na ordem indicada.
3. Em cada step, rode a verificacao antes de seguir.
4. Ao final de cada task, valide a "Definicao de pronto" da task.
5. Comite com mensagens Conventional Commits por task ou por grupo coerente.
6. Nao avance para a M-Sprint 4 sem login real, shell, guards e interceptors verdes localmente.

**Pre-requisitos globais**:
- M-Sprint 2 concluida: splash, welcome, login, register, `AuthService`, `TokenStorageService` e MSW funcionando.
- Sprint 3 backend concluida: `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, JWT e autorizacao por role.
- Backend local rodando em `http://localhost:8080`.
- CORS no backend aceitando `http://localhost:8100`.
- Tokens Notion mobile disponiveis em `src/styles/_notion-mobile-*.scss` e `src/theme/variables.scss`.
- Nenhum framework CSS terceiro deve ser adicionado.

**Fora de escopo durante estes steps**:
- Telas autenticadas concretas de perfil, alterar senha, tomador ou credora.
- Smoke E2E completo contra backend real.
- Build nativo Android/iOS.
- Roles dedicadas para empresa credora. Nesta sprint `CLIENTE` usa tabs de tomador e `ADMIN` usa tabs administrativas reduzidas.

---

## Task M-3.0 - Prechecks da M-Sprint 3

**Objetivo**: confirmar que o repo mobile e o backend estao no ponto correto para integrar auth real.

**Pre-requisito**: branch da M-Sprint 3 criada a partir de `develop` atualizada.

**Esforco**: 20-30 min.

### Step 203.0.1 - Confirmar estado do repo mobile

**Comando**:
```bash
cd <sep-mobile-root>
git status --short --branch
ls -la src/main.ts src/app/app.routes.ts src/app/core/auth/auth.service.ts src/app/core/auth/token-storage.service.ts
ls -la src/app/features/public src/mocks/handlers.ts public/mockServiceWorker.js
```

**Verificacao**:
- Branch esperada: `feature/msprint-3-shell-mobile-auth` ou nome equivalente da sprint.
- M-Sprint 2 existe: rotas publicas, login, register, `AuthService`, `TokenStorageService` e MSW.
- Se houver alteracoes pendentes nao relacionadas, revisar antes de editar.

### Step 203.0.2 - Confirmar scripts, Ionic e tokens Notion mobile

**Comando**:
```bash
cd <sep-mobile-root>
npm run
npm ls @ionic/angular @capacitor/core @capacitor/preferences @analogjs/vitest-angular msw --depth=0
ls -la src/styles/_notion-mobile-tokens.scss src/styles/_notion-mobile-typography.scss src/styles/_notion-mobile-components.scss src/theme/variables.scss
```

**Verificacao**:
- Scripts existentes: `lint`, `lint:scss`, `test`, `build`, `start`.
- `@capacitor/preferences` instalado.
- Tokens Notion mobile existem.
- Se tokens Notion mobile estiverem ausentes, abortar e concluir primeiro a M-Sprint 1.

### Step 203.0.3 - Confirmar backend Sprint 3

**Comando**:
```bash
curl -i http://localhost:8080/actuator/health
```

**Verificacao**:
- Espera `200 OK`.
- Se backend nao estiver rodando, subir `sep-api` conforme steps backend antes de testar auth real.

**Teste manual dos endpoints**:
```bash
curl -i -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@empresa.com","password":"123456"}'
```

**Verificacao**:
- Espera `200 OK` com `accessToken`, `tokenType`, `expiresIn` e `usuario`.
- Se nao houver usuario local, criar via `POST /api/v1/usuarios` antes de validar login.

### Step 203.0.4 - Rodar baseline antes de editar

**Comando**:
```bash
cd <sep-mobile-root>
npm run lint
npm run lint:scss
npm run test
npm run build
```

**Verificacao**:
- Todos os comandos passam antes de iniciar.
- Warning de budget SCSS herdado pode ser registrado, mas erro bloqueia a sprint.
- Se o E2E da M-Sprint 2 ainda tiver assert stale no splash/welcome, registrar como follow-up separado; nao bloquear M-3 se lint/test/build estiverem verdes.

### Definicao de pronto da Task M-3.0
- [ ] M-Sprint 2 confirmada no mobile
- [ ] Tokens Notion mobile existem
- [ ] Backend Sprint 3 responde localmente
- [ ] Login real pode ser testado com usuario local
- [ ] Baseline de lint/test/build passa

### Commit Task M-3.0
Nao gera commit - e apenas validacao do ambiente.

---

## Task M-3.1 - Environments e modo dev-offline

**Objetivo**: remover URL fixa do `AuthService`, criar configuracao de ambiente e manter MSW disponivel como modo offline explicito.

**Pre-requisito**: Task M-3.0 concluida.

**Esforco**: 2-3 horas.

**Arquivos afetados**:
- `<sep-mobile-root>/angular.json`
- `<sep-mobile-root>/src/environments/environment.ts`
- `<sep-mobile-root>/src/environments/environment.dev-offline.ts`
- `<sep-mobile-root>/src/main.ts`
- `<sep-mobile-root>/src/app/core/auth/auth.service.ts`

### Step 203.1.1 - Criar environments

**Comando**:
```bash
cd <sep-mobile-root>
mkdir -p src/environments
```

**Arquivo**: `<sep-mobile-root>/src/environments/environment.ts`

**Conteudo esperado**:
```ts
export const environment = {
  apiBaseUrl: 'http://localhost:8080/api/v1',
  useMsw: false,
};
```

**Arquivo**: `<sep-mobile-root>/src/environments/environment.dev-offline.ts`

**Conteudo esperado**:
```ts
export const environment = {
  apiBaseUrl: 'http://localhost:8080/api/v1',
  useMsw: true,
};
```

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
```

### Step 203.1.2 - Registrar configuracao `dev-offline`

**Arquivo**: `<sep-mobile-root>/angular.json`

Adicionar em `projects.<nome-do-projeto>.architect.build.configurations`:
```json
"dev-offline": {
  "optimization": false,
  "extractLicenses": false,
  "sourceMap": true,
  "fileReplacements": [
    {
      "replace": "src/environments/environment.ts",
      "with": "src/environments/environment.dev-offline.ts"
    }
  ]
}
```

Adicionar em `projects.<nome-do-projeto>.architect.serve.configurations`:
```json
"dev-offline": {
  "buildTarget": "<nome-do-projeto>:build:dev-offline"
}
```

**Regra**:
- Usar o nome real do projeto definido em `angular.json`.
- Preservar as configuracoes existentes do Ionic/Capacitor e os assets de MSW.

**Verificacao**:
```bash
cd <sep-mobile-root>
npx ng build --configuration dev-offline
```

### Step 203.1.3 - Atualizar bootstrap do MSW

**Arquivo**: `<sep-mobile-root>/src/main.ts`

Adicionar import:
```ts
import { environment } from './environments/environment';
```

Atualizar `prepare()`:
```ts
async function prepare(): Promise<void> {
  const forceMsw =
    typeof window !== 'undefined' && window.localStorage?.getItem('NG_APP_USE_MSW') === 'true';

  if (environment.useMsw || forceMsw) {
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
}
```

**Regras**:
- `npm run start` usa API real por padrao.
- `npx ng serve --configuration dev-offline --port 8100` ativa MSW por build config.
- `localStorage.NG_APP_USE_MSW=true` continua como override local.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run build
npx ng build --configuration dev-offline
```

### Step 203.1.4 - Usar `environment.apiBaseUrl` no AuthService

**Arquivo**: `<sep-mobile-root>/src/app/core/auth/auth.service.ts`

Substituir:
```ts
const API_BASE_URL = 'http://localhost:8080/api/v1';
```

Por:
```ts
import { environment } from '../../../environments/environment';

const API_BASE_URL = environment.apiBaseUrl;
```

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run test
npm run build
```

### Definicao de pronto da Task M-3.1
- [ ] API real e padrao em `environment.ts`
- [ ] `dev-offline` ativa MSW por configuracao
- [ ] Override por `localStorage.NG_APP_USE_MSW` preservado
- [ ] AuthService nao possui URL hardcoded
- [ ] Build normal e build `dev-offline` passam

### Commit Task M-3.1
Mensagem sugerida:
```text
feat(mobile): configurar ambientes de auth real
```

---

## Task M-3.2 - AuthService e estado de sessao

**Objetivo**: evoluir o servico de autenticacao para suportar sessao real com token em Capacitor Preferences, carregamento de `/auth/me`, limpeza centralizada e acesso assincrono ao token por guards/interceptors.

**Pre-requisito**: Task M-3.1 concluida.

**Esforco**: 3-4 horas.

**Arquivos afetados**:
- `<sep-mobile-root>/src/app/core/auth/auth.service.ts`
- `<sep-mobile-root>/src/app/core/auth/auth.service.spec.ts`
- `<sep-mobile-root>/src/app/core/api/api.models.ts`

### Step 203.2.1 - Normalizar roles no mobile

**Arquivo**: `<sep-mobile-root>/src/app/core/api/api.models.ts`

Manter `UsuarioRole` como valores do dominio/API:
```ts
export type UsuarioRole = 'ADMIN' | 'CLIENTE';
```

Adicionar helper opcional para route data:
```ts
export type RouteRole = UsuarioRole;
```

**Regra**:
- Nao usar `ROLE_ADMIN`/`ROLE_CLIENTE` nos dados do usuario. O backend retorna `ADMIN`/`CLIENTE`.
- Se alguma documentacao mencionar `ROLE_ADMIN`, traduzir no mobile para `ADMIN`.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
```

### Step 203.2.2 - Evoluir AuthService

**Arquivo**: `<sep-mobile-root>/src/app/core/auth/auth.service.ts`

**Comportamento esperado**:
- `currentUser`: Signal readonly.
- `loadingUser`: Signal readonly para splash/guards/shell.
- `hasToken()`: metodo async que consulta `TokenStorageService`.
- `isAuthenticated`: computed baseado no usuario carregado em memoria.
- `login(payload)`: salva token em Preferences e seta usuario vindo do `TokenResponse`.
- `loadCurrentUser()`: chama `GET /auth/me`, seta usuario e retorna `Promise<UsuarioResponse | null>`.
- `clearSession()`: remove token de Preferences e limpa usuario.
- `logout()`: chama `clearSession()`.
- `getAccessToken()`: retorna `Promise<string | null>` para interceptor.

**Pseudocodigo**:
```ts
private readonly loadingUserState = signal(false);

readonly loadingUser = this.loadingUserState.asReadonly();
readonly isAuthenticated = computed(() => this.currentUserState() !== null);

async getAccessToken(): Promise<string | null> {
  return this.tokenStorage.getToken();
}

async hasToken(): Promise<boolean> {
  return (await this.getAccessToken()) !== null;
}

async loadCurrentUser(): Promise<UsuarioResponse | null> {
  if (!(await this.hasToken())) {
    this.currentUserState.set(null);
    return null;
  }

  this.loadingUserState.set(true);
  try {
    const usuario = await firstValueFrom(this.http.get<UsuarioResponse>(`${API_BASE_URL}/auth/me`));
    this.currentUserState.set(usuario);
    return usuario;
  } catch {
    await this.clearSession();
    return null;
  } finally {
    this.loadingUserState.set(false);
  }
}

async clearSession(): Promise<void> {
  await this.tokenStorage.clearToken();
  this.currentUserState.set(null);
}
```

**Regra importante**:
- Remover header manual de `loadCurrentUser()`. A partir desta sprint, o `authInterceptor` anexa `Authorization`.
- `isAuthenticated` so deve ficar `true` depois de usuario carregado. Token invalido em Preferences nao deve renderizar shell como autenticado.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
npm run test
```

### Step 203.2.3 - Atualizar testes do AuthService

**Arquivo**: `<sep-mobile-root>/src/app/core/auth/auth.service.spec.ts`

**Cenarios obrigatorios**:
- `login()` grava token e usuario atual.
- `loadCurrentUser()` chama `/auth/me` e popula usuario quando ha token.
- `loadCurrentUser()` retorna `null` sem token.
- Falha em `/auth/me` chama `clearSession()` e limpa usuario.
- `clearSession()` remove token e usuario.
- `logout()` delega para limpeza local.
- Login invalido nao deixa usuario autenticado.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run test -- src/app/core/auth/auth.service.spec.ts
```

### Definicao de pronto da Task M-3.2
- [ ] AuthService carrega usuario real por `/auth/me`
- [ ] Estado de loading exposto
- [ ] Sessao e limpa por metodo centralizado
- [ ] Token em Preferences acessivel para interceptor
- [ ] Header manual removido de `loadCurrentUser()`
- [ ] Testes de AuthService passam

### Commit Task M-3.2
Mensagem sugerida:
```text
feat(mobile): evoluir sessao com preferences
```

---

## Task M-3.3 - HTTP interceptors funcionais

**Objetivo**: anexar JWT nas chamadas protegidas e centralizar tratamento de `401` e `403`.

**Pre-requisito**: Task M-3.2 concluida.

**Esforco**: 3-4 horas.

**Arquivos afetados**:
- `<sep-mobile-root>/src/main.ts`
- `<sep-mobile-root>/src/app/core/interceptors/auth.interceptor.ts`
- `<sep-mobile-root>/src/app/core/interceptors/error.interceptor.ts`
- testes em `<sep-mobile-root>/src/app/core/interceptors/`

### Step 203.3.1 - Criar interceptor de Authorization assincrono

**Arquivo**: `<sep-mobile-root>/src/app/core/interceptors/auth.interceptor.ts`

**Conteudo esperado**:
```ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';

import { AuthService } from '../auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const isLoginRequest = req.url.includes('/auth/login');
  const isRegisterRequest = req.url.endsWith('/usuarios');

  if (isLoginRequest || isRegisterRequest) {
    return next(req);
  }

  return from(auth.getAccessToken()).pipe(
    switchMap((token) => {
      if (!token) {
        return next(req);
      }

      return next(
        req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );
    }),
  );
};
```

**Regra**:
- Como Capacitor Preferences e async, o interceptor deve usar `from(...).pipe(switchMap(...))`.
- `POST /auth/login` e `POST /usuarios` nao recebem `Authorization` automaticamente.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
```

### Step 203.3.2 - Criar interceptor de erro

**Arquivo**: `<sep-mobile-root>/src/app/core/interceptors/error.interceptor.ts`

**Conteudo esperado**:
```ts
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';

import { AuthService } from '../auth/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      if (error.status === 401 && !req.url.includes('/auth/login')) {
        return from(auth.clearSession()).pipe(
          switchMap(() => {
            void router.navigateByUrl('/session-expired');
            return throwError(() => error);
          }),
        );
      }

      if (error.status === 403) {
        void router.navigateByUrl('/access-denied');
      }

      return throwError(() => error);
    }),
  );
};
```

**Regra**:
- `401` do proprio login nao deve redirecionar; o componente Login mostra feedback local.
- `401` em rota protegida limpa Preferences e redireciona para `/session-expired`.
- `403` vai para `/access-denied`.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
```

### Step 203.3.3 - Registrar interceptors no bootstrap

**Arquivo**: `<sep-mobile-root>/src/main.ts`

Substituir import:
```ts
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
```

Por:
```ts
import { provideHttpClient, withInterceptors } from '@angular/common/http';
```

Adicionar imports:
```ts
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { errorInterceptor } from './app/core/interceptors/error.interceptor';
```

Substituir provider:
```ts
provideHttpClient(withInterceptorsFromDi()),
```

Por:
```ts
provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
```

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run build
```

### Step 203.3.4 - Testar interceptors

**Arquivos**:
- `<sep-mobile-root>/src/app/core/interceptors/auth.interceptor.spec.ts`
- `<sep-mobile-root>/src/app/core/interceptors/error.interceptor.spec.ts`

**Cenarios obrigatorios**:
- Request comum com token em Preferences recebe `Authorization: Bearer`.
- `/auth/login` nao recebe Authorization automaticamente.
- `POST /usuarios` nao recebe Authorization automaticamente.
- Request sem token segue sem Authorization.
- `401` em rota protegida chama `clearSession()` e navega para `/session-expired`.
- `401` em `/auth/login` nao redireciona automaticamente.
- `403` navega para `/access-denied`.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run test -- src/app/core/interceptors
```

### Definicao de pronto da Task M-3.3
- [ ] JWT anexado automaticamente em chamadas protegidas
- [ ] Login e cadastro publico nao recebem Authorization legado
- [ ] `401` limpa sessao e redireciona para `/session-expired`
- [ ] `403` redireciona para acesso negado
- [ ] Interceptors funcionais registrados em `src/main.ts`
- [ ] Testes de interceptors passam

### Commit Task M-3.3
Mensagem sugerida:
```text
feat(mobile): adicionar interceptors de auth
```

---

## Task M-3.4 - Functional Guards

**Objetivo**: proteger rotas autenticadas e aplicar autorizacao por role no mobile, sem substituir a seguranca do backend.

**Pre-requisito**: Task M-3.2 concluida.

**Esforco**: 3-4 horas.

**Arquivos afetados**:
- `<sep-mobile-root>/src/app/core/guards/auth.guard.ts`
- `<sep-mobile-root>/src/app/core/guards/role.guard.ts`
- testes em `<sep-mobile-root>/src/app/core/guards/`

### Step 203.4.1 - Criar auth guard

**Arquivo**: `<sep-mobile-root>/src/app/core/guards/auth.guard.ts`

**Comportamento esperado**:
- Se nao houver token: redirecionar para `/welcome`.
- Se houver usuario em memoria: permitir.
- Se houver token sem usuario em memoria: chamar `loadCurrentUser()` e permitir se sucesso.
- Se `/auth/me` falhar ou retornar `null`: limpar sessao e redirecionar para `/welcome`.

**Pseudocodigo**:
```ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../auth/auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.currentUser()) {
    return true;
  }

  if (!(await auth.hasToken())) {
    return router.parseUrl('/welcome');
  }

  const usuario = await auth.loadCurrentUser();
  if (usuario) {
    return true;
  }

  await auth.clearSession();
  return router.parseUrl('/welcome');
};
```

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
```

### Step 203.4.2 - Criar role guard

**Arquivo**: `<sep-mobile-root>/src/app/core/guards/role.guard.ts`

**Comportamento esperado**:
- Ler roles exigidas de `route.data['roles']`.
- Se nao houver roles exigidas, permitir.
- Se usuario atual tiver role exigida, permitir.
- Se nao tiver, redirecionar para `/access-denied`.

**Pseudocodigo**:
```ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { UsuarioRole } from '../api/api.models';
import { AuthService } from '../auth/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowedRoles = (route.data['roles'] ?? []) as UsuarioRole[];
  const user = auth.currentUser();

  if (!allowedRoles.length) {
    return true;
  }

  if (user && allowedRoles.includes(user.role)) {
    return true;
  }

  return router.parseUrl('/access-denied');
};
```

**Regra**:
- O mobile usa `ADMIN` e `CLIENTE`, conforme DTO real do backend.
- Backend continua sendo a autoridade final de autorizacao.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
```

### Step 203.4.3 - Testar guards

**Arquivos**:
- `<sep-mobile-root>/src/app/core/guards/auth.guard.spec.ts`
- `<sep-mobile-root>/src/app/core/guards/role.guard.spec.ts`

**Cenarios obrigatorios**:
- Sem token: `authGuard` retorna UrlTree `/welcome`.
- Usuario em memoria: permite.
- Token + usuario ausente: chama `loadCurrentUser()` e permite.
- Falha em `/auth/me`: limpa sessao e redireciona para `/welcome`.
- `roleGuard` permite `ADMIN` quando `data.roles = ['ADMIN']`.
- `roleGuard` permite `CLIENTE` quando `data.roles = ['CLIENTE']`.
- `roleGuard` bloqueia `CLIENTE` para rota admin.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run test -- src/app/core/guards
```

### Definicao de pronto da Task M-3.4
- [ ] Rotas autenticadas exigem token valido
- [ ] `/auth/me` carrega usuario quando necessario
- [ ] Roles usam `ADMIN`/`CLIENTE`
- [ ] Usuario sem role exigida vai para `/access-denied`
- [ ] Testes de guards passam

### Commit Task M-3.4
Mensagem sugerida:
```text
feat(mobile): proteger rotas autenticadas
```

---

## Task M-3.5 - Shell mobile autenticado com tabs

**Objetivo**: criar shell autenticado em `/app` usando Ionic e Notion mobile: header simples, tabs inferiores e area de conteudo.

**Pre-requisito**: Tasks M-3.3 e M-3.4 concluidas.

**Esforco**: 6-8 horas.

**Arquivos afetados**:
- `<sep-mobile-root>/src/app/app.routes.ts`
- `<sep-mobile-root>/src/app/features/authenticated/authenticated.routes.ts`
- `<sep-mobile-root>/src/app/layout/shell/shell.component.*`
- `<sep-mobile-root>/src/app/layout/header-mobile/header-mobile.component.*`
- `<sep-mobile-root>/src/app/layout/tabs/tabs.component.*`
- `<sep-mobile-root>/src/app/features/authenticated/home/home.component.*`
- `<sep-mobile-root>/src/app/features/authenticated/placeholder/placeholder.component.*`

### Step 203.5.1 - Criar estrutura de layout autenticado

**Comando**:
```bash
cd <sep-mobile-root>
mkdir -p src/app/layout/shell
mkdir -p src/app/layout/header-mobile
mkdir -p src/app/layout/tabs
mkdir -p src/app/features/authenticated/home
mkdir -p src/app/features/authenticated/placeholder
```

**Verificacao**:
```bash
cd <sep-mobile-root>
ls -la src/app/layout src/app/features/authenticated
```

### Step 203.5.2 - Criar rotas autenticadas

**Arquivo**: `<sep-mobile-root>/src/app/features/authenticated/authenticated.routes.ts`

**Conteudo esperado**:
```ts
import { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';
import { roleGuard } from '../../core/guards/role.guard';

export const AUTHENTICATED_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../../layout/shell/shell.component').then((m) => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'inicio',
      },
      {
        path: 'inicio',
        loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent),
        data: { tab: 'inicio' },
      },
      {
        path: 'propostas',
        loadComponent: () =>
          import('./placeholder/placeholder.component').then((m) => m.PlaceholderComponent),
        data: { tab: 'propostas', title: 'Propostas' },
      },
      {
        path: 'parcelas',
        loadComponent: () =>
          import('./placeholder/placeholder.component').then((m) => m.PlaceholderComponent),
        data: { tab: 'parcelas', title: 'Parcelas' },
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./placeholder/placeholder.component').then((m) => m.PlaceholderComponent),
        data: { tab: 'perfil', title: 'Perfil' },
      },
      {
        path: 'admin',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'], tab: 'admin', title: 'Administracao' },
        loadComponent: () =>
          import('./placeholder/placeholder.component').then((m) => m.PlaceholderComponent),
      },
    ],
  },
];
```

**Regra**:
- `perfil` ainda e placeholder nesta sprint; a tela real entra na M-Sprint 4.
- `admin` e placeholder reduzido para validar `roleGuard`.

### Step 203.5.3 - Atualizar rotas raiz

**Arquivo**: `<sep-mobile-root>/src/app/app.routes.ts`

Adicionar antes do wildcard:
```ts
{
  path: 'app',
  loadChildren: () =>
    import('./features/authenticated/authenticated.routes').then((m) => m.AUTHENTICATED_ROUTES),
},
{
  path: 'access-denied',
  loadComponent: () =>
    import('./features/error/access-denied.component').then((m) => m.AccessDeniedComponent),
},
{
  path: 'session-expired',
  loadComponent: () =>
    import('./features/error/session-expired.component').then((m) => m.SessionExpiredComponent),
},
```

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run build
```

### Step 203.5.4 - Criar ShellComponent com `ion-tabs`

**Arquivo**: `<sep-mobile-root>/src/app/layout/shell/shell.component.ts`

**Conteudo esperado**:
```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IonPage, IonRouterOutlet, IonTabs } from '@ionic/angular/standalone';

import { HeaderMobileComponent } from '../header-mobile/header-mobile.component';
import { TabsComponent } from '../tabs/tabs.component';

@Component({
  selector: 'sep-shell',
  standalone: true,
  imports: [IonPage, IonRouterOutlet, IonTabs, HeaderMobileComponent, TabsComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {}
```

**Arquivo**: `<sep-mobile-root>/src/app/layout/shell/shell.component.html`

**Conteudo esperado**:
```html
<ion-page class="sep-shell">
  <sep-header-mobile />
  <ion-tabs class="sep-shell-tabs">
    <ion-router-outlet />
    <sep-tabs />
  </ion-tabs>
</ion-page>
```

**Ajuste se necessario**:
- O `TabsComponent` deve renderizar o `ion-tab-bar slot="bottom"`.
- A validacao final deve confirmar que as rotas filhas renderizam dentro do shell.

### Step 203.5.5 - Criar HeaderMobileComponent

**Arquivo**: `<sep-mobile-root>/src/app/layout/header-mobile/header-mobile.component.ts`

**Comportamento esperado**:
- Exibir marca curta `SEP`.
- Exibir e-mail do usuario autenticado vindo de `AuthService.currentUser()`.
- Exibir badge de role `ADMIN` ou `CLIENTE`.
- Botao de logout chama `auth.logout()` e navega para `/welcome`.

**Pseudocodigo**:
```ts
readonly user = this.auth.currentUser;

async logout(): Promise<void> {
  await this.auth.logout();
  await this.router.navigateByUrl('/welcome');
}
```

**Regras visuais**:
- Header compacto, touch target minimo 44px.
- Usar tokens Notion mobile, warm-white e whisper border.
- Nao usar texto explicativo sobre funcionalidades.

### Step 203.5.6 - Criar TabsComponent

**Arquivo**: `<sep-mobile-root>/src/app/layout/tabs/tabs.component.ts`

**Comportamento esperado**:
- Computar tabs por role.
- `CLIENTE`: Inicio, Propostas, Parcelas, Perfil.
- `ADMIN`: Inicio, Perfil, Administracao.
- Tabs inativas com peso 400; ativa com peso 600.

**Modelo sugerido**:
```ts
interface MobileTab {
  label: string;
  icon: string;
  path: string;
  roles: UsuarioRole[];
}
```

**Tabela inicial**:
```ts
[
  { label: 'Inicio', icon: 'home-outline', path: '/app/inicio', roles: ['ADMIN', 'CLIENTE'] },
  { label: 'Propostas', icon: 'document-text-outline', path: '/app/propostas', roles: ['CLIENTE'] },
  { label: 'Parcelas', icon: 'calendar-outline', path: '/app/parcelas', roles: ['CLIENTE'] },
  { label: 'Perfil', icon: 'person-outline', path: '/app/perfil', roles: ['ADMIN', 'CLIENTE'] },
  { label: 'Admin', icon: 'settings-outline', path: '/app/admin', roles: ['ADMIN'] },
]
```

**Template esperado**:
- Usar `ion-tab-bar slot="bottom"`.
- Usar `ion-tab-button` ou links com `routerLink`, conforme padrao Ionic que funcionar melhor com as rotas atuais.
- Se usar Ionicons, garantir que os icones estejam registrados conforme o padrao do app.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
npm run build
```

### Step 203.5.7 - Criar home e placeholder autenticados

**Arquivos**:
- `<sep-mobile-root>/src/app/features/authenticated/home/home.component.ts`
- `<sep-mobile-root>/src/app/features/authenticated/home/home.component.html`
- `<sep-mobile-root>/src/app/features/authenticated/home/home.component.scss`
- `<sep-mobile-root>/src/app/features/authenticated/placeholder/placeholder.component.ts`
- `<sep-mobile-root>/src/app/features/authenticated/placeholder/placeholder.component.html`
- `<sep-mobile-root>/src/app/features/authenticated/placeholder/placeholder.component.scss`

**Comportamento esperado**:
- Home mostra saudacao curta com e-mail do usuario e 2-3 atalhos em cards Notion mobile.
- Placeholder mostra apenas o titulo da rota e estado `Em preparacao`.
- Nao chamar endpoints alem de `/auth/me` nesta sprint.

**Regra**:
- Nao implementar perfil real, alterar senha, propostas ou parcelas agora. Esses itens entram na M-Sprint 4 ou Epic 14 Fase Mobile 2+.

### Step 203.5.8 - Testar shell e tabs

**Arquivos**:
- `<sep-mobile-root>/src/app/layout/shell/shell.component.spec.ts`
- `<sep-mobile-root>/src/app/layout/header-mobile/header-mobile.component.spec.ts`
- `<sep-mobile-root>/src/app/layout/tabs/tabs.component.spec.ts`
- `<sep-mobile-root>/src/app/features/authenticated/home/home.component.spec.ts`

**Cenarios obrigatorios**:
- Header renderiza usuario atual.
- Logout chama `AuthService.logout()` e navega para `/welcome`.
- `CLIENTE` ve Inicio, Propostas, Parcelas e Perfil.
- `ADMIN` ve Inicio, Perfil e Admin; nao ve Propostas/Parcelas.
- Shell renderiza header e tab bar.
- Home renderiza saudacao baseada em `currentUser`.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run test -- src/app/layout src/app/features/authenticated
```

### Definicao de pronto da Task M-3.5
- [ ] Rota `/app` protegida por `authGuard`
- [ ] Shell mobile com tabs inferiores renderiza corretamente
- [ ] Header mostra usuario autenticado e logout funcional
- [ ] Tabs sao filtradas por role
- [ ] Placeholders autenticados nao implementam regra de negocio
- [ ] Testes de shell, header, tabs e home passam

### Commit Task M-3.5
Mensagem sugerida:
```text
feat(mobile): criar shell autenticado com tabs
```

---

## Task M-3.6 - Paginas 401/403 e redirects publicos

**Objetivo**: criar paginas minimas de erro de sessao/acesso e ajustar o fluxo publico para entrar no shell autenticado apos login real.

**Pre-requisito**: Task M-3.5 concluida.

**Esforco**: 2-3 horas.

**Arquivos afetados**:
- `<sep-mobile-root>/src/app/features/error/access-denied.component.ts`
- `<sep-mobile-root>/src/app/features/error/session-expired.component.ts`
- `<sep-mobile-root>/src/app/features/public/login/login.component.ts`
- `<sep-mobile-root>/src/app/features/public/splash/splash.component.ts`

### Step 203.6.1 - Criar pagina de acesso negado

**Arquivo**: `<sep-mobile-root>/src/app/features/error/access-denied.component.ts`

**Comportamento esperado**:
- Tela standalone simples com `ion-content`.
- Mensagem curta: `Acesso negado`.
- Botao volta para `/app/inicio` se autenticado ou `/welcome` se nao autenticado.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
```

### Step 203.6.2 - Criar pagina de sessao expirada

**Arquivo**: `<sep-mobile-root>/src/app/features/error/session-expired.component.ts`

**Comportamento esperado**:
- Tela standalone simples com `ion-content`.
- Mensagem curta: `Sessao expirada`.
- Botao vai para `/welcome`.
- Nao tentar renovar token; refresh token esta fora de escopo desta fase.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
```

### Step 203.6.3 - Redirecionar login para shell autenticado

**Arquivo**: `<sep-mobile-root>/src/app/features/public/login/login.component.ts`

**Mudanca esperada**:
- Apos `auth.login(...)` bem-sucedido, navegar para `/app/inicio`.
- Login invalido continua exibindo erro local, sem interceptar para `/session-expired`.

**Verificacao manual**:
```bash
cd <sep-mobile-root>
npm run start -- --port 8100
```

No browser:
- Fazer login com usuario real.
- Confirmar navegacao para `/app/inicio`.
- Recarregar pagina em `/app/inicio` e confirmar que `/auth/me` repopula usuario.

### Step 203.6.4 - Ajustar splash para sessao existente

**Arquivo**: `<sep-mobile-root>/src/app/features/public/splash/splash.component.ts`

**Comportamento esperado**:
- Ao abrir app, chamar `auth.loadCurrentUser()`.
- Se houver usuario valido, navegar para `/app/inicio`.
- Se nao houver sessao valida, navegar para `/welcome`.

**Regra**:
- Erro em `/auth/me` deve limpar sessao via `AuthService` e seguir para `/welcome`.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run test -- src/app/features/public/splash
```

### Step 203.6.5 - Testar paginas de erro e redirects

**Arquivos**:
- `<sep-mobile-root>/src/app/features/error/access-denied.component.spec.ts`
- `<sep-mobile-root>/src/app/features/error/session-expired.component.spec.ts`
- atualizar testes de login e splash existentes

**Cenarios obrigatorios**:
- AccessDeniedComponent renderiza mensagem e botao.
- SessionExpiredComponent renderiza mensagem e botao.
- Login bem-sucedido navega para `/app/inicio`.
- Login invalido fica na tela de login e exibe erro local.
- Splash com sessao valida navega para `/app/inicio`.
- Splash sem sessao navega para `/welcome`.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run test -- src/app/features/error src/app/features/public
```

### Definicao de pronto da Task M-3.6
- [ ] `/access-denied` existe e usa visual Notion mobile
- [ ] `/session-expired` existe e usa visual Notion mobile
- [ ] Login real redireciona para `/app/inicio`
- [ ] Splash aproveita sessao valida e rejeita sessao invalida
- [ ] Testes de erro, login e splash passam

### Commit Task M-3.6
Mensagem sugerida:
```text
feat(mobile): finalizar fluxo de sessao autenticada
```

---

## Task M-3.7 - Validacao final da M-Sprint 3

**Objetivo**: validar a sprint inteira localmente, com API real e com fallback MSW `dev-offline`.

**Pre-requisito**: Tasks M-3.1 a M-3.6 concluidas.

**Esforco**: 1-2 horas.

### Step 203.7.1 - Rodar suite local completa

**Comando**:
```bash
cd <sep-mobile-root>
npm run lint
npm run lint:scss
npm run test
npm run build
npx ng build --configuration dev-offline
```

**Verificacao**:
- Todos os comandos passam.
- Warnings de budget SCSS podem ser registrados se ja existentes, mas erro bloqueia a sprint.

### Step 203.7.2 - Validar fluxo com backend real

**Pre-requisito**:
- `sep-api` rodando em `http://localhost:8080`.
- Usuario local criado com senha `123456`.

**Comando**:
```bash
cd <sep-mobile-root>
npm run start -- --port 8100
```

**Roteiro manual**:
1. Abrir `http://localhost:8100`.
2. Confirmar splash redirecionando para `/welcome` sem sessao.
3. Fazer login com usuario real.
4. Confirmar redirecionamento para `/app/inicio`.
5. Confirmar header com e-mail do usuario.
6. Confirmar tabs conforme role.
7. Recarregar `/app/inicio` e confirmar que a sessao volta via `/auth/me`.
8. Clicar logout e confirmar retorno para `/welcome`.
9. Tentar acessar `/app/inicio` sem token e confirmar redirect para `/welcome`.

**Verificacao**:
- DevTools Network mostra `POST /api/v1/auth/login` e `GET /api/v1/auth/me`.
- Chamadas protegidas possuem header `Authorization: Bearer <token>`.
- CORS nao bloqueia `localhost:8100`.

### Step 203.7.3 - Validar fallback dev-offline com MSW

**Comando**:
```bash
cd <sep-mobile-root>
npx ng serve --configuration dev-offline --port 8100
```

**Roteiro manual**:
1. Abrir `http://localhost:8100`.
2. Fazer login com credenciais aceitas pelo MSW da M-Sprint 2.
3. Confirmar redirecionamento para `/app/inicio`.
4. Confirmar `/auth/me` mockado populando header.

**Verificacao**:
- App funciona sem backend real.
- MSW nao fica ativo no build normal sem flag/config.

### Step 203.7.4 - Checar arquivos novos e untracked

**Comando**:
```bash
cd <sep-mobile-root>
git status --short
git ls-files --others --exclude-standard
```

**Verificacao**:
- Arquivos novos esperados aparecem.
- Nenhum artefato de build, coverage, screenshots ou `.env` deve entrar em commit.
- Usar `git add <paths-especificos>`, nao `git add -A`.

### Definicao de pronto da Task M-3.7
- [ ] Lint, lint:scss, test e build passam
- [ ] Build `dev-offline` passa
- [ ] Login real com backend Sprint 3 validado manualmente
- [ ] Fallback MSW validado manualmente
- [ ] Header, tabs, guards, interceptors e redirects funcionando
- [ ] Untracked revisados antes do commit

### Commit Task M-3.7
Pode nao gerar commit proprio se apenas validar. Se houver ajustes de testes/docs:
```text
test(mobile): cobrir shell e sessao autenticada
```

---

## Definicao de pronto da M-Sprint 3

- [ ] Login real funcionando contra backend Sprint 3
- [ ] Token JWT armazenado em Capacitor Preferences
- [ ] Interceptor envia `Authorization: Bearer <token>` para `/auth/me` e demais chamadas protegidas
- [ ] MSW disponivel via `--configuration dev-offline` e override `localStorage.NG_APP_USE_MSW=true`
- [ ] Shell mobile com tabs inferiores e header simples implementado
- [ ] Tabs filtradas por role (`CLIENTE` tomador, `ADMIN` reduzido)
- [ ] Functional Guards `authGuard` e `roleGuard` funcionais
- [ ] HTTP interceptors `authInterceptor` e `errorInterceptor` funcionais
- [ ] Paginas `/session-expired` e `/access-denied` implementadas
- [ ] Logout limpa Preferences e redireciona para `/welcome`
- [ ] Splash reaproveita sessao valida e descarta sessao invalida
- [ ] Testes Vitest cobrindo AuthService, guards, interceptors, shell, header, tabs e paginas de erro
- [ ] `npm run lint`, `npm run lint:scss`, `npm run test`, `npm run build` e `npx ng build --configuration dev-offline` verdes

## Impacto na M-Sprint seguinte

A M-Sprint 4 (`specs/fase-1/204-msprint-4-telas-autenticadas-mobile.md`) consome:
- Shell mobile para envolver as telas autenticadas.
- Guards e interceptors para proteger rotas.
- `AuthService` apontando para backend real.
- Token storage operacional com Capacitor Preferences.
- Rotas `/app/perfil` e placeholders que serao substituidos por telas concretas.

## Referencias

- [Spec 203 - M-Sprint 3](../../specs/fase-1/203-msprint-3-shell-mobile-auth.md)
- [Spec 202 - M-Sprint 2](../../specs/fase-1/202-msprint-2-telas-publicas-mobile.md)
- [Spec 204 - M-Sprint 4](../../specs/fase-1/204-msprint-4-telas-autenticadas-mobile.md)
- [Spec 003 - Sprint 3 backend](../../specs/fase-1/003-sprint-3-seguranca-autenticacao.md)
- [Spec 103 - F-Sprint 3 web](../../specs/fase-1/103-fsprint-3-shell-notion-auth.md)
- [PRD - API SEP](../../docs-sep/PRD.md)
- [DESIGN-notion.md](../../docs-sep/DESIGN-notion.md)
- [MOBILE-SCREENS-PLAN.md](../../docs-sep/MOBILE-SCREENS-PLAN.md)
