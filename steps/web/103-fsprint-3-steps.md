# Steps - F-Sprint 3 - Auth Real + Shell Notion + Guards

**Spec de origem**: [`specs/fase-1/103-fsprint-3-shell-notion-auth.md`](../../specs/fase-1/103-fsprint-3-shell-notion-auth.md)

**Objetivo geral**: trocar o caminho principal de autenticacao para a API real entregue pela Sprint 3 backend, manter MSW como fallback `dev-offline`, implementar shell autenticado Notion e introduzir guards/interceptors funcionais para sessao, autorizacao e tratamento centralizado de `401`/`403`.

**Esforco total estimado**: 3-4 dias de Dev Pleno Frontend dedicado, ou 4-5 dias dividido entre os dois Devs Plenos.

**Workspace root**: `<sep-app-root>/`.

**Localizacao do projeto Angular**: `<sep-app-root>/`.

**Ordem de execucao recomendada**:

```text
F-3.0 (prechecks)
  |
  +---> F-3.1 (environments + API real)
          |
          +---> F-3.2 (AuthService e sessao)
                  |
                  +---> F-3.3 (interceptors)
                  |
                  +---> F-3.4 (guards)
                          |
                          +---> F-3.5 (shell Notion)
                                  |
                                  +---> F-3.6 (dashboard casca + access denied)
                                          |
                                          +---> F-3.7 (testes)
                                                  |
                                                  +---> F-3.8 (validacao final)
```

- F-3.0 e obrigatoria antes de qualquer edicao.
- F-3.1 e F-3.2 preparam o contrato de autenticacao real.
- F-3.3 e F-3.4 podem ser feitas em paralelo por devs diferentes depois de F-3.2.
- F-3.5 depende de guards/interceptors para proteger a rota autenticada.
- F-3.6 cria apenas paginas minimas de suporte; telas autenticadas funcionais entram na F-Sprint 4.
- F-3.7 e F-3.8 fecham a sprint inteira.

**Como usar este arquivo**:
1. Execute os prechecks da Task F-3.0.
2. Execute cada task na ordem indicada.
3. Em cada step, rode a verificacao antes de seguir.
4. Ao final, valide com a "Definicao de pronto" da sprint.
5. Comite com mensagens Conventional Commits por task ou por grupo coerente.

**Pre-requisitos globais**:
- F-Sprint 2 concluida: landing, login, register, `AuthService` e MSW funcionando.
- Sprint 3 backend concluida: `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, JWT e autorizacao por role/ownership.
- Backend local rodando em `http://localhost:8080`.
- Tokens Notion disponiveis em `src/styles/_notion-*.scss`.
- Nenhum framework CSS terceiro deve ser adicionado.
- Superficies publicas continuam Apple; a partir de `/app` usar Notion.

---

## Task F-3.0 - Prechecks da F-Sprint 3

**Objetivo**: confirmar que o frontend e o backend estao no ponto correto para integrar auth real.

**Pre-requisito**: branch da F-Sprint 3 criada a partir de `develop` atualizada.

**Esforco**: 20-30 min.

### Step 103.0.1 - Confirmar estado do repo web

**Comando**:
```bash
cd <sep-app-root>
git status --short --branch
ls -la src/app/core/auth/auth.service.ts src/mocks/handlers.ts src/app/features/public
```

**Verificacao**:
- Branch esperada: `feature/fsprint-3-shell-notion-auth` ou nome equivalente da sprint.
- F-Sprint 2 existe: rotas publicas, login, register e MSW.
- Se houver alteracoes pendentes nao relacionadas, revisar antes de editar.

### Step 103.0.2 - Confirmar scripts e tokens Notion

**Comando**:
```bash
cd <sep-app-root>
npm run
ls -la src/styles/_notion-tokens.scss src/styles/_notion-typography.scss src/styles/_notion-components.scss
```

**Verificacao**:
- Scripts existentes: `lint`, `lint:scss`, `test`, `build`, `start`.
- Tokens Notion existem.
- Se tokens Notion estiverem ausentes, abortar e concluir primeiro F-Sprint 1.

### Step 103.0.3 - Confirmar backend Sprint 3

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
- Se nao houver usuario admin local, criar via `POST /api/v1/usuarios` antes de validar login.

### Step 103.0.4 - Rodar baseline antes de editar

**Comando**:
```bash
cd <sep-app-root>
npm run lint
npm run lint:scss
npm run test
npm run build
```

**Verificacao**:
- Todos os comandos passam antes de iniciar.
- Warning de budget herdado pode ser registrado, mas erro bloqueia a sprint.

### Definicao de pronto da Task F-3.0
- [ ] F-Sprint 2 confirmada no frontend
- [ ] Tokens Notion existem
- [ ] Backend Sprint 3 responde localmente
- [ ] Login real pode ser testado com usuario local
- [ ] Baseline de lint/test/build passa

---

## Task F-3.1 - Environments e API real

**Objetivo**: remover URL fixa do `AuthService`, criar configuracao de ambiente e manter MSW disponivel como modo offline explicito.

**Pre-requisito**: Task F-3.0 concluida.

**Esforco**: 2-3 horas.

**Arquivos afetados**:
- `<sep-app-root>/angular.json`
- `<sep-app-root>/src/environments/environment.ts`
- `<sep-app-root>/src/environments/environment.dev-offline.ts`
- `<sep-app-root>/src/main.ts`
- `<sep-app-root>/src/app/core/auth/auth.service.ts`

### Step 103.1.1 - Criar environments

**Comando**:
```bash
cd <sep-app-root>
mkdir -p src/environments
```

**Arquivo**: `<sep-app-root>/src/environments/environment.ts`

**Conteudo esperado**:
```ts
export const environment = {
  apiBaseUrl: 'http://localhost:8080/api/v1',
  useMsw: false,
};
```

**Arquivo**: `<sep-app-root>/src/environments/environment.dev-offline.ts`

**Conteudo esperado**:
```ts
export const environment = {
  apiBaseUrl: 'http://localhost:8080/api/v1',
  useMsw: true,
};
```

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint
```

### Step 103.1.2 - Registrar configuracao `dev-offline`

**Arquivo**: `<sep-app-root>/angular.json`

Adicionar em `projects.sep-app.architect.build.configurations`:
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

Adicionar em `projects.sep-app.architect.serve.configurations`:
```json
"dev-offline": {
  "buildTarget": "sep-app:build:dev-offline"
}
```

**Verificacao**:
```bash
cd <sep-app-root>
npx ng build --configuration dev-offline
```

### Step 103.1.3 - Atualizar bootstrap do MSW

**Arquivo**: `<sep-app-root>/src/main.ts`

**Conteudo esperado**:
```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';
import { environment } from './environments/environment';

async function prepare(): Promise<void> {
  const forceMsw =
    typeof window !== 'undefined' && window.localStorage?.getItem('NG_APP_USE_MSW') === 'true';

  if (environment.useMsw || forceMsw) {
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
}

prepare().then(() => bootstrapApplication(App, appConfig).catch((err) => console.error(err)));
```

**Regras**:
- `npm run start` usa API real por padrao.
- `npx ng serve --configuration dev-offline` ativa MSW por build config.
- `localStorage.NG_APP_USE_MSW=true` continua como override local.

**Verificacao**:
```bash
cd <sep-app-root>
npm run build
npx ng build --configuration dev-offline
```

### Step 103.1.4 - Usar `environment.apiBaseUrl` no AuthService

**Arquivo**: `<sep-app-root>/src/app/core/auth/auth.service.ts`

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
cd <sep-app-root>
npm run test
npm run build
```

### Definicao de pronto da Task F-3.1
- [ ] API real e padrao em `environment.ts`
- [ ] `dev-offline` ativa MSW por configuracao
- [ ] Override por `localStorage.NG_APP_USE_MSW` preservado
- [ ] AuthService nao possui URL hardcoded
- [ ] Build normal e build `dev-offline` passam

---

## Task F-3.2 - AuthService e estado de sessao

**Objetivo**: evoluir o servico de autenticacao para suportar sessao real, carregamento de `/auth/me`, limpeza centralizada e acesso ao token por interceptor/guards.

**Pre-requisito**: Task F-3.1 concluida.

**Esforco**: 3-4 horas.

**Arquivos afetados**:
- `<sep-app-root>/src/app/core/auth/auth.service.ts`
- `<sep-app-root>/src/app/core/auth/auth.service.spec.ts`
- `<sep-app-root>/src/app/core/api/api.models.ts`

### Step 103.2.1 - Normalizar roles no frontend

**Arquivo**: `<sep-app-root>/src/app/core/api/api.models.ts`

Manter `UsuarioRole` como valores do dominio/API:
```ts
export type UsuarioRole = 'ADMIN' | 'CLIENTE';
```

Adicionar helper opcional para compatibilidade com route data:
```ts
export type RouteRole = UsuarioRole;
```

**Regra**:
- Nao usar `ROLE_ADMIN` nos dados do usuario. O backend retorna `ADMIN`/`CLIENTE`.
- Se alguma documentacao mencionar `ROLE_ADMIN`, traduzir no frontend para `ADMIN`.

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint
```

### Step 103.2.2 - Evoluir AuthService

**Arquivo**: `<sep-app-root>/src/app/core/auth/auth.service.ts`

**Comportamento esperado**:
- `currentUser`: Signal readonly.
- `isAuthenticated`: computed baseado em token existente e usuario carregado.
- `loadingUser`: Signal readonly para shell/guards.
- `login(payload)`: salva token, seta usuario vindo do `TokenResponse`.
- `loadCurrentUser()`: chama `GET /auth/me`, seta usuario e retorna `Observable<UsuarioResponse>`.
- `clearSession()`: remove token e limpa usuario.
- `logout()`: chama `clearSession()`.
- `getAccessToken()`: retorna token do `localStorage`.

**Pseudocodigo**:
```ts
private readonly loadingUserState = signal(false);

readonly loadingUser = this.loadingUserState.asReadonly();
readonly hasToken = computed(() => Boolean(this.getAccessToken()));
readonly isAuthenticated = computed(() => Boolean(this.getAccessToken() && this.currentUserState()));

loadCurrentUser(): Observable<UsuarioResponse> {
  this.loadingUserState.set(true);
  return this.http.get<UsuarioResponse>(`${API_BASE_URL}/auth/me`).pipe(
    tap((usuario) => this.currentUserState.set(usuario)),
    finalize(() => this.loadingUserState.set(false)),
  );
}

clearSession(): void {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  this.currentUserState.set(null);
}
```

**Nota**:
- `isAuthenticated` so deve ficar `true` depois de token + usuario carregado. Isso evita shell renderizar com token invalido.

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint
npm run test
```

### Step 103.2.3 - Atualizar testes do AuthService

**Arquivo**: `<sep-app-root>/src/app/core/auth/auth.service.spec.ts`

**Cenarios obrigatorios**:
- `login()` grava token e usuario atual.
- `loadCurrentUser()` chama `/auth/me` e popula usuario.
- `clearSession()` remove token e usuario.
- `logout()` delega para limpeza local.
- Login invalido nao deixa usuario autenticado.

**Verificacao**:
```bash
cd <sep-app-root>
npm run test -- src/app/core/auth/auth.service.spec.ts
```

### Definicao de pronto da Task F-3.2
- [ ] AuthService carrega usuario real por `/auth/me`
- [ ] Estado de loading exposto
- [ ] Sessao e limpa por metodo centralizado
- [ ] Token acessivel para interceptor
- [ ] Testes de AuthService passam

---

## Task F-3.3 - HTTP interceptors funcionais

**Objetivo**: anexar JWT nas chamadas protegidas e centralizar tratamento de `401` e `403`.

**Pre-requisito**: Task F-3.2 concluida.

**Esforco**: 3-4 horas.

**Arquivos afetados**:
- `<sep-app-root>/src/app/app.config.ts`
- `<sep-app-root>/src/app/core/interceptors/auth.interceptor.ts`
- `<sep-app-root>/src/app/core/interceptors/error.interceptor.ts`
- testes em `<sep-app-root>/src/app/core/interceptors/`

### Step 103.3.1 - Criar interceptor de Authorization

**Arquivo**: `<sep-app-root>/src/app/core/interceptors/auth.interceptor.ts`

**Conteudo esperado**:
```ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthService } from '../auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getAccessToken();
  const isLoginRequest = req.url.includes('/auth/login');

  if (!token || isLoginRequest) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );
};
```

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint
```

### Step 103.3.2 - Criar interceptor de erro

**Arquivo**: `<sep-app-root>/src/app/core/interceptors/error.interceptor.ts`

**Conteudo esperado**:
```ts
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../auth/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401 && !req.url.includes('/auth/login')) {
          auth.clearSession();
          void router.navigateByUrl('/login');
        }

        if (error.status === 403) {
          void router.navigateByUrl('/access-denied');
        }
      }

      return throwError(() => error);
    }),
  );
};
```

**Regra**:
- `401` do próprio login nao deve redirecionar duas vezes; o componente Login mostra feedback local.
- `403` deve ir para pagina de acesso negado.

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint
```

### Step 103.3.3 - Registrar interceptors

**Arquivo**: `<sep-app-root>/src/app/app.config.ts`

Substituir `withInterceptorsFromDi()` por interceptors funcionais:
```ts
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
```

**Verificacao**:
```bash
cd <sep-app-root>
npm run build
```

### Step 103.3.4 - Testar interceptors

**Arquivos**:
- `<sep-app-root>/src/app/core/interceptors/auth.interceptor.spec.ts`
- `<sep-app-root>/src/app/core/interceptors/error.interceptor.spec.ts`

**Cenarios obrigatorios**:
- Request comum com token recebe `Authorization: Bearer`.
- `/auth/login` nao recebe Authorization automaticamente.
- `401` em rota protegida chama `clearSession()` e navega para `/login`.
- `403` navega para `/access-denied`.

**Verificacao**:
```bash
cd <sep-app-root>
npm run test -- src/app/core/interceptors
```

### Definicao de pronto da Task F-3.3
- [ ] JWT anexado automaticamente em chamadas protegidas
- [ ] Login nao recebe Authorization legado
- [ ] `401` limpa sessao e redireciona
- [ ] `403` redireciona para acesso negado
- [ ] Testes de interceptors passam

---

## Task F-3.4 - Functional Guards

**Objetivo**: proteger rotas autenticadas e aplicar autorizacao por role no frontend, sem substituir a seguranca do backend.

**Pre-requisito**: Task F-3.2 concluida.

**Esforco**: 3-4 horas.

**Arquivos afetados**:
- `<sep-app-root>/src/app/core/guards/auth.guard.ts`
- `<sep-app-root>/src/app/core/guards/role.guard.ts`
- testes em `<sep-app-root>/src/app/core/guards/`

### Step 103.4.1 - Criar auth guard

**Arquivo**: `<sep-app-root>/src/app/core/guards/auth.guard.ts`

**Comportamento esperado**:
- Se nao houver token: redirecionar para `/login`.
- Se houver token e usuario em memoria: permitir.
- Se houver token sem usuario em memoria: chamar `loadCurrentUser()` e permitir se sucesso.
- Se `/auth/me` falhar: limpar sessao e redirecionar para `/login`.

**Pseudocodigo**:
```ts
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.getAccessToken()) {
    return router.parseUrl('/login');
  }

  if (auth.currentUser()) {
    return true;
  }

  return auth.loadCurrentUser().pipe(
    map(() => true),
    catchError(() => {
      auth.clearSession();
      return of(router.parseUrl('/login'));
    }),
  );
};
```

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint
```

### Step 103.4.2 - Criar role guard

**Arquivo**: `<sep-app-root>/src/app/core/guards/role.guard.ts`

**Comportamento esperado**:
- Ler roles exigidas de `route.data['roles']`.
- Se nao houver roles exigidas, permitir.
- Se usuario atual tiver role exigida, permitir.
- Se nao tiver, redirecionar para `/access-denied`.

**Pseudocodigo**:
```ts
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
- O frontend usa `ADMIN` e `CLIENTE`, conforme DTO real do backend.
- Backend continua sendo a autoridade final de autorizacao.

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint
```

### Step 103.4.3 - Testar guards

**Arquivos**:
- `<sep-app-root>/src/app/core/guards/auth.guard.spec.ts`
- `<sep-app-root>/src/app/core/guards/role.guard.spec.ts`

**Cenarios obrigatorios**:
- Sem token: `authGuard` retorna UrlTree `/login`.
- Token + usuario em memoria: permite.
- Token + usuario ausente: chama `/auth/me` e permite.
- Falha em `/auth/me`: limpa sessao e redireciona.
- `roleGuard` permite `ADMIN` quando `data.roles = ['ADMIN']`.
- `roleGuard` bloqueia `CLIENTE` para rota admin.

**Verificacao**:
```bash
cd <sep-app-root>
npm run test -- src/app/core/guards
```

### Definicao de pronto da Task F-3.4
- [ ] Rotas autenticadas exigem token valido
- [ ] `/auth/me` carrega usuario quando necessario
- [ ] Roles usam `ADMIN`/`CLIENTE`
- [ ] Usuario sem role exigida vai para `/access-denied`
- [ ] Testes de guards passam

---

## Task F-3.5 - Shell autenticado Notion

**Objetivo**: criar shell autenticado em `/app` usando design system Notion: header, sidenav collapsable, breadcrumbs e area de conteudo.

**Pre-requisito**: Tasks F-3.3 e F-3.4 concluidas.

**Esforco**: 6-8 horas.

**Arquivos afetados**:
- `<sep-app-root>/src/app/app.routes.ts`
- `<sep-app-root>/src/app/layout/shell/shell.component.*`
- `<sep-app-root>/src/app/layout/header/header.component.*`
- `<sep-app-root>/src/app/layout/sidenav/sidenav.component.*`
- `<sep-app-root>/src/app/layout/breadcrumbs/breadcrumbs.component.*`
- `<sep-app-root>/src/app/features/authenticated/authenticated.routes.ts`

### Step 103.5.1 - Criar estrutura de layout autenticado

**Comando**:
```bash
cd <sep-app-root>
mkdir -p src/app/layout/shell
mkdir -p src/app/layout/header
mkdir -p src/app/layout/sidenav
mkdir -p src/app/layout/breadcrumbs
mkdir -p src/app/features/authenticated/dashboard
```

**Verificacao**:
```bash
cd <sep-app-root>
ls -la src/app/layout src/app/features/authenticated
```

### Step 103.5.2 - Criar rotas autenticadas

**Arquivo**: `<sep-app-root>/src/app/features/authenticated/authenticated.routes.ts`

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
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
        data: { breadcrumb: 'Dashboard' },
      },
      {
        path: 'admin',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'], breadcrumb: 'Administracao' },
        loadComponent: () =>
          import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
    ],
  },
];
```

**Nota**:
- A rota `/app/admin` e placeholder apenas para validar role guard nesta sprint.
- Telas admin reais entram na F-Sprint 4.

### Step 103.5.3 - Atualizar rotas raiz

**Arquivo**: `<sep-app-root>/src/app/app.routes.ts`

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
```

**Verificacao**:
```bash
cd <sep-app-root>
npm run build
```

### Step 103.5.4 - Implementar ShellComponent

**Arquivos**:
- `<sep-app-root>/src/app/layout/shell/shell.component.ts`
- `<sep-app-root>/src/app/layout/shell/shell.component.html`
- `<sep-app-root>/src/app/layout/shell/shell.component.scss`

**Comportamento esperado**:
- Estado `sidenavCollapsed` via Signal.
- Renderiza `sep-header`, `sep-sidenav`, `sep-breadcrumbs` e `router-outlet`.
- Layout Notion em duas colunas no desktop.
- Em mobile, sidenav vira painel superior/colapsavel simples.

**Regras visuais**:
- Usar `@use "../../../styles/notion-typography"` e `notion-components`.
- Canvas branco/warm white.
- Bordas whisper.
- Raio 4px para botoes funcionais.
- Sem Apple tokens dentro do shell autenticado.

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint:scss
npm run build
```

### Step 103.5.5 - Implementar HeaderComponent

**Arquivos**:
- `<sep-app-root>/src/app/layout/header/header.component.ts`
- `<sep-app-root>/src/app/layout/header/header.component.html`
- `<sep-app-root>/src/app/layout/header/header.component.scss`

**Comportamento esperado**:
- Mostra marca SEP.
- Mostra e-mail e role do `auth.currentUser()`.
- Botao de collapse da sidenav.
- Botao "Sair" chama `auth.logout()` e navega para `/login`.

**Verificacao**:
```bash
cd <sep-app-root>
npm run test
```

### Step 103.5.6 - Implementar SidenavComponent

**Arquivos**:
- `<sep-app-root>/src/app/layout/sidenav/sidenav.component.ts`
- `<sep-app-root>/src/app/layout/sidenav/sidenav.component.html`
- `<sep-app-root>/src/app/layout/sidenav/sidenav.component.scss`

**Menu minimo**:
- Dashboard: `/app/dashboard`, todos autenticados.
- Administracao: `/app/admin`, apenas `ADMIN`.
- Meu perfil: placeholder desabilitado ou rota futura anotada para F-Sprint 4.

**Comportamento esperado**:
- Recebe `collapsed` como input.
- Esconde itens sem permissao usando `auth.currentUser()?.role`.
- Link ativo usa estilo Notion discreto.

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint
npm run lint:scss
```

### Step 103.5.7 - Implementar BreadcrumbsComponent

**Arquivos**:
- `<sep-app-root>/src/app/layout/breadcrumbs/breadcrumbs.component.ts`
- `<sep-app-root>/src/app/layout/breadcrumbs/breadcrumbs.component.html`
- `<sep-app-root>/src/app/layout/breadcrumbs/breadcrumbs.component.scss`

**Comportamento esperado**:
- Ler `ActivatedRoute`/`NavigationEnd`.
- Exibir `Início` + labels de `route.data['breadcrumb']`.
- Para F-Sprint 3, basta suportar `/app/dashboard` e `/app/admin`.

**Verificacao**:
```bash
cd <sep-app-root>
npm run build
```

### Definicao de pronto da Task F-3.5
- [ ] `/app` renderiza shell autenticado
- [ ] Header mostra usuario logado
- [ ] Sidenav colapsa
- [ ] Breadcrumbs refletem rota atual
- [ ] Itens sem permissao ficam ocultos
- [ ] Visual usa Notion, nao Apple

---

## Task F-3.6 - Dashboard casca e acesso negado

**Objetivo**: criar telas minimas para validar shell, guards e fluxo `403`, sem antecipar F-Sprint 4.

**Pre-requisito**: Task F-3.5 concluida.

**Esforco**: 3-4 horas.

**Arquivos afetados**:
- `<sep-app-root>/src/app/features/authenticated/dashboard/dashboard.component.*`
- `<sep-app-root>/src/app/features/error/access-denied.component.ts`
- `<sep-app-root>/src/app/features/error/access-denied.component.scss`
- `<sep-app-root>/src/app/features/error/access-denied.component.spec.ts`

### Step 103.6.1 - Criar dashboard casca

**Arquivos**:
- `<sep-app-root>/src/app/features/authenticated/dashboard/dashboard.component.ts`
- `<sep-app-root>/src/app/features/authenticated/dashboard/dashboard.component.html`
- `<sep-app-root>/src/app/features/authenticated/dashboard/dashboard.component.scss`

**Conteudo minimo**:
- Saudacao com `auth.currentUser()?.username`.
- Badge com role.
- 3 cards placeholder:
  - Perfil e sessao.
  - Usuarios e administracao.
  - Proximas jornadas.

**Regras**:
- Nao chamar endpoints alem de `/auth/me`.
- Nao implementar telas de perfil/admin reais.
- Usar cards Notion com whisper border.

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint:scss
npm run build
```

### Step 103.6.2 - Criar AccessDeniedComponent

**Arquivo**: `<sep-app-root>/src/app/features/error/access-denied.component.ts`

**Conteudo esperado**:
```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'sep-access-denied',
  imports: [RouterLink],
  template: `
    <main class="access-denied">
      <section class="access-denied__panel" aria-labelledby="access-denied-title">
        <p class="access-denied__badge">403</p>
        <h1 id="access-denied-title">Acesso negado</h1>
        <p>Seu perfil nao possui permissao para acessar esta area.</p>
        <a routerLink="/app/dashboard">Voltar ao dashboard</a>
      </section>
    </main>
  `,
  styleUrl: './access-denied.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessDeniedComponent {}
```

**Verificacao**:
```bash
cd <sep-app-root>
npm run build
```

### Step 103.6.3 - Estilizar acesso negado com Notion

**Arquivo**: `<sep-app-root>/src/app/features/error/access-denied.component.scss`

**Regras**:
- Warm white de fundo.
- Painel central com card Notion.
- Link azul Notion.
- Sem tokens Apple.

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint:scss
```

### Definicao de pronto da Task F-3.6
- [ ] `/app/dashboard` renderiza casca autenticada
- [ ] `/access-denied` renderiza pagina 403
- [ ] Nenhuma tela funcional da F-Sprint 4 foi antecipada
- [ ] Estilos usam Notion

---

## Task F-3.7 - Testes da F-Sprint 3

**Objetivo**: cobrir auth real, guards, interceptors e shell com Vitest.

**Pre-requisito**: Tasks F-3.1 a F-3.6 concluidas.

**Esforco**: 4-6 horas.

### Step 103.7.1 - Atualizar testes existentes

**Arquivos**:
- `<sep-app-root>/src/app/features/public/login/login.component.spec.ts`
- `<sep-app-root>/src/app/core/auth/auth.service.spec.ts`

**Ajustes esperados**:
- Login continua testavel com MSW.
- Testes consideram `environment.apiBaseUrl`.
- Sucesso de login em componente redireciona para `/app/dashboard`, nao mais `/design-system/notion`.

**Verificacao**:
```bash
cd <sep-app-root>
npm run test -- src/app/features/public/login/login.component.spec.ts src/app/core/auth/auth.service.spec.ts
```

### Step 103.7.2 - Testar shell

**Arquivos recomendados**:
- `<sep-app-root>/src/app/layout/shell/shell.component.spec.ts`
- `<sep-app-root>/src/app/layout/header/header.component.spec.ts`
- `<sep-app-root>/src/app/layout/sidenav/sidenav.component.spec.ts`
- `<sep-app-root>/src/app/layout/breadcrumbs/breadcrumbs.component.spec.ts`

**Cenarios obrigatorios**:
- Shell renderiza header, sidenav, breadcrumbs e outlet.
- Header mostra username e role.
- Logout limpa sessao e navega para `/login`.
- Sidenav mostra Administracao para `ADMIN`.
- Sidenav esconde Administracao para `CLIENTE`.
- Toggle altera estado colapsado.

**Verificacao**:
```bash
cd <sep-app-root>
npm run test -- src/app/layout
```

### Step 103.7.3 - Testar acesso negado e dashboard

**Arquivos recomendados**:
- `<sep-app-root>/src/app/features/error/access-denied.component.spec.ts`
- `<sep-app-root>/src/app/features/authenticated/dashboard/dashboard.component.spec.ts`

**Cenarios obrigatorios**:
- Access denied mostra "Acesso negado" e link para dashboard.
- Dashboard mostra usuario e role quando `currentUser` existe.

**Verificacao**:
```bash
cd <sep-app-root>
npm run test -- src/app/features/error src/app/features/authenticated
```

### Step 103.7.4 - Rodar suite completa

**Comando**:
```bash
cd <sep-app-root>
npm run test
```

**Verificacao**:
- Todos os testes passam.
- MSW server continua ativo no `test-setup.ts`.

### Definicao de pronto da Task F-3.7
- [ ] Testes de AuthService atualizados
- [ ] Testes de interceptors passam
- [ ] Testes de guards passam
- [ ] Testes de shell/header/sidenav/breadcrumbs passam
- [ ] Testes de dashboard/access denied passam
- [ ] Suite completa passa

---

## Task F-3.8 - Validacao final da F-Sprint 3

**Objetivo**: fechar a sprint com qualidade automatizada, smoke real contra backend e smoke offline com MSW.

**Pre-requisito**: Tasks F-3.0 a F-3.7 concluidas.

**Esforco**: 45-60 min.

### Step 103.8.1 - Rodar qualidade completa

**Comando**:
```bash
cd <sep-app-root>
npm run lint
npm run lint:scss
npm run test
npm run build
npx ng build --configuration dev-offline
```

**Verificacao**:
- Todos os comandos passam.
- Warnings devem ser registrados na descricao do PR se existirem.

### Step 103.8.2 - Smoke real com backend

**Pre-condicao**:
- Backend `sep-api` rodando em `http://localhost:8080`.
- Usuario local existente para login.

**Comando**:
```bash
cd <sep-app-root>
npm run start
```

**Validacao manual**:
- `/login` autentica contra backend real.
- Token e salvo.
- `/app/dashboard` carrega usuario via `/auth/me`.
- Requisicao para `/auth/me` envia `Authorization: Bearer <token>`.
- Token invalido/expirado gera `401`, limpa sessao e redireciona para `/login`.
- Usuario sem permissao para rota admin vai para `/access-denied`.

### Step 103.8.3 - Smoke offline com MSW

**Comando**:
```bash
cd <sep-app-root>
npx ng serve --configuration dev-offline
```

**Validacao manual**:
- Login com `admin@empresa.com` / `123456` funciona via MSW.
- `/app/dashboard` abre shell Notion.
- MSW nao e necessario no build normal.

### Step 103.8.4 - Conferir arquivos para staging

**Comando**:
```bash
cd <sep-app-root>
git status --short
git ls-files --others --exclude-standard src/app src/environments src/mocks angular.json
```

**Verificacao**:
- Arquivos novos esperados aparecem.
- Artefatos de build/teste nao aparecem (`dist/`, `coverage/`, `.angular/`, `test-results/`).
- Evitar `git add -A`.

### Definicao de pronto da F-Sprint 3
- [ ] Login real funcionando contra backend Sprint 3
- [ ] Token JWT enviado em `Authorization: Bearer` para `/auth/me`
- [ ] MSW disponivel por `dev-offline`
- [ ] Shell Notion implementado: header, sidenav, breadcrumbs, user menu
- [ ] `authGuard` e `roleGuard` funcionais
- [ ] `authInterceptor` e `errorInterceptor` funcionais
- [ ] Pagina `access-denied` para `403`
- [ ] Sessao expirada limpa estado e redireciona para login
- [ ] Testes Vitest cobrem guards, interceptors e shell
- [ ] `npm run lint` passa
- [ ] `npm run lint:scss` passa
- [ ] `npm run test` passa
- [ ] `npm run build` passa
- [ ] `npx ng build --configuration dev-offline` passa

### Commits sugeridos da F-Sprint 3

Se dividir por grupos coerentes:
```bash
git add angular.json src/environments src/main.ts src/app/core/auth src/app/core/api
git commit -m "feat(auth): configura API real e sessao autenticada"

git add src/app/app.config.ts src/app/core/interceptors src/app/core/guards
git commit -m "feat(auth): adiciona interceptors e guards funcionais"

git add src/app/app.routes.ts src/app/layout src/app/features/authenticated src/app/features/error
git commit -m "feat(frontend): implementa shell autenticado Notion"

git add src/app/**/*.spec.ts
git commit -m "test(frontend): cobre shell autenticado e controle de acesso"
```

**Observacao**:
- Push e PR sao manuais.
- PR deve apontar para `develop`.
- Nao usar `git add -A`; adicionar paths especificos.

---

## Impacto esperado na F-Sprint 4

- F-Sprint 4 passa a criar telas concretas dentro de `/app`.
- Perfil, alterar senha e administracao de usuarios reutilizam shell, guards e interceptors.
- MSW segue disponivel como `dev-offline`, mas validacao principal passa pela API real.
