# Steps - F-Sprint 2 - Telas Apple Publicas + MSW

**Spec de origem**: [`specs/fase-1/102-fsprint-2-telas-apple-publicas.md`](../../specs/fase-1/102-fsprint-2-telas-apple-publicas.md)

**Objetivo geral**: implementar as telas publicas do web SEP seguindo o design system Apple: landing, login e cadastro publico. Nesta sprint, as chamadas HTTP usam MSW para simular os contratos do PRD §21 antes da integracao real da F-Sprint 3.

**Esforco total estimado**: 2-3 dias de Dev Pleno Frontend dedicado, ou 3-4 dias dividido entre os dois Devs Plenos.

**Workspace root**: `<sep-app-root>/`.

**Localizacao do projeto Angular**: `<sep-app-root>/`.

**Ordem de execucao recomendada**:

```text
F-2.0 (prechecks)
  |
  +---> F-2.1 (base de rotas publicas)
          |
          +---> F-2.2 (contratos + AuthService)
                  |
                  +---> F-2.3 (MSW handlers)
                  |
                  +---> F-2.4 (landing)
                  |
                  +---> F-2.5 (login)
                  |
                  +---> F-2.6 (register)
                          |
                          +---> F-2.7 (testes)
                                  |
                                  +---> F-2.8 (validacao final)
```

- F-2.0 e obrigatoria antes de qualquer edicao.
- F-2.1 prepara a casca de roteamento e remove o placeholder Angular.
- F-2.2 cria tipos e servico compartilhado usados por login/register.
- F-2.3 pode rodar em paralelo com F-2.4 depois de F-2.2.
- F-2.4, F-2.5 e F-2.6 podem ser distribuidas entre devs, desde que nao editem o mesmo arquivo ao mesmo tempo.
- F-2.7 e F-2.8 fecham a sprint inteira.

**Como usar este arquivo**:
1. Execute os prechecks da Task F-2.0.
2. Execute cada task na ordem indicada.
3. Em cada step, rode a verificacao antes de seguir.
4. Ao final, valide com a "Definicao de pronto" da sprint.
5. Comite com mensagens Conventional Commits por task ou por grupo coerente.

**Pre-requisitos globais**:
- F-Sprint 0 concluida: Angular 20.x, MSW, Vitest, Playwright, lint e build configurados.
- F-Sprint 1 concluida: tokens Apple disponiveis em `src/styles/_apple-*.scss`.
- Nenhum framework CSS terceiro deve ser adicionado.
- Esta F-Sprint usa apenas Apple. Nao usar tokens Notion nas telas publicas.
- Backend real nao e dependencia desta sprint; contratos sao mockados via MSW.

---

## Task F-2.0 - Prechecks da F-Sprint 2

**Objetivo**: confirmar que o repo web esta pronto para receber as telas publicas.

**Pre-requisito**: branch da F-Sprint 2 criada a partir de `develop` atualizada.

**Esforco**: 15-20 min.

### Step 102.0.1 - Confirmar estrutura do app Angular

**Comando**:
```bash
cd <sep-app-root>
ls -la package.json angular.json tsconfig.json src/app src/styles src/mocks
```

**Verificacao**:
- `package.json`, `angular.json`, `src/app`, `src/styles` e `src/mocks` existem.
- Se `src/mocks` nao existir, abortar e concluir primeiro a F-Sprint 0.

### Step 102.0.2 - Confirmar scripts e dependencias

**Comando**:
```bash
cd <sep-app-root>
node -v
npm -v
npx ng version
npm run
```

**Verificacao**:
- Node `20.x` ou superior.
- Angular `20.x`.
- Scripts existentes: `lint`, `lint:scss`, `test`, `build`, `start`.
- Dependencias existentes: `@angular/forms`, `msw`, `vitest`, `@testing-library/angular`.

### Step 102.0.3 - Confirmar tokens Apple

**Comando**:
```bash
cd <sep-app-root>
ls -la src/styles/_apple-tokens.scss src/styles/_apple-typography.scss src/styles/_apple-components.scss
```

**Verificacao**:
- Os tres arquivos existem.
- Se qualquer arquivo estiver ausente, abortar e concluir primeiro a F-Sprint 1.

### Step 102.0.4 - Rodar baseline antes de editar

**Comando**:
```bash
cd <sep-app-root>
npm run lint
npm run lint:scss
npm run test
npm run build
```

**Verificacao**:
- Todos os comandos passam antes de iniciar a F-Sprint 2.
- Falha herdada deve ser corrigida antes de implementar telas.

### Definicao de pronto da Task F-2.0
- [ ] App Angular existe em `<sep-app-root>/`
- [ ] Angular `20.x` confirmado
- [ ] Tokens Apple existem
- [ ] MSW existe em `src/mocks/`
- [ ] Baseline de lint/test/build passa

---

## Task F-2.1 - Base de rotas publicas

**Objetivo**: substituir a tela placeholder do Angular por roteamento real e criar a estrutura das features publicas.

**Pre-requisito**: Task F-2.0 concluida.

**Esforco**: 45-60 min.

**Arquivos afetados**:
- `<sep-app-root>/src/app/app.html`
- `<sep-app-root>/src/app/app.scss`
- `<sep-app-root>/src/app/app.routes.ts`
- `<sep-app-root>/src/app/features/public/public.routes.ts`
- pastas em `<sep-app-root>/src/app/features/public/{landing,login,register}`

### Step 102.1.1 - Substituir placeholder por router outlet

**Arquivo**: `<sep-app-root>/src/app/app.html`

**Conteudo esperado**:
```html
<router-outlet />
```

**Arquivo**: `<sep-app-root>/src/app/app.scss`

**Conteudo esperado**:
```scss
:host {
  display: block;
  min-height: 100vh;
}
```

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint
```

### Step 102.1.2 - Criar estrutura de features publicas

**Comando**:
```bash
cd <sep-app-root>
mkdir -p src/app/features/public/landing
mkdir -p src/app/features/public/login
mkdir -p src/app/features/public/register
mkdir -p src/app/core/auth
mkdir -p src/app/core/api
```

**Verificacao**:
```bash
cd <sep-app-root>
ls -la src/app/features/public src/app/core/auth src/app/core/api
```

### Step 102.1.3 - Criar rotas publicas lazy

**Arquivo**: `<sep-app-root>/src/app/features/public/public.routes.ts`

**Conteudo esperado**:
```ts
import { Routes } from '@angular/router';

export const PUBLIC_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./register/register.component').then((m) => m.RegisterComponent),
  },
];
```

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint
```

### Step 102.1.4 - Atualizar rotas raiz

**Arquivo**: `<sep-app-root>/src/app/app.routes.ts`

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
cd <sep-app-root>
npm run build
```

### Definicao de pronto da Task F-2.1
- [ ] Placeholder Angular removido
- [ ] `router-outlet` renderiza as rotas
- [ ] Rotas `/`, `/login`, `/register` planejadas via lazy loading
- [ ] `/design-system` preservada
- [ ] `npm run build` passa

---

## Task F-2.2 - Contratos frontend e AuthService

**Objetivo**: criar tipos alinhados ao PRD §21 e um `AuthService` baseado em Signals para login, usuario atual e persistencia temporaria do token.

**Pre-requisito**: Task F-2.1 concluida.

**Esforco**: 2-3 horas.

**Arquivos afetados**:
- `<sep-app-root>/src/app/app.config.ts`
- `<sep-app-root>/src/app/core/api/api.models.ts`
- `<sep-app-root>/src/app/core/auth/auth.service.ts`

### Step 102.2.1 - Habilitar HttpClient

**Arquivo**: `<sep-app-root>/src/app/app.config.ts`

**Mudanca esperada**:
```ts
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
```

Adicionar em `providers`:
```ts
provideHttpClient(withInterceptorsFromDi()),
```

**Verificacao**:
```bash
cd <sep-app-root>
npm run build
```

### Step 102.2.2 - Criar modelos dos contratos PRD §21

**Arquivo**: `<sep-app-root>/src/app/core/api/api.models.ts`

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
cd <sep-app-root>
npm run lint
```

### Step 102.2.3 - Criar AuthService com Signals

**Arquivo**: `<sep-app-root>/src/app/core/auth/auth.service.ts`

**Conteudo esperado**:
```ts
import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import {
  LoginRequest,
  TokenResponse,
  UsuarioCreateRequest,
  UsuarioResponse,
} from '../api/api.models';

const API_BASE_URL = 'http://localhost:8080/api/v1';
const ACCESS_TOKEN_KEY = 'SEP_ACCESS_TOKEN';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly currentUserState = signal<UsuarioResponse | null>(null);

  readonly currentUser = this.currentUserState.asReadonly();
  readonly isAuthenticated = computed(() => Boolean(this.currentUserState()));

  login(payload: LoginRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${API_BASE_URL}/auth/login`, payload).pipe(
      tap((response) => {
        window.localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
        this.currentUserState.set(response.usuario);
      }),
    );
  }

  register(payload: UsuarioCreateRequest): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(`${API_BASE_URL}/usuarios`, payload);
  }

  me(): Observable<UsuarioResponse> {
    return this.http.get<UsuarioResponse>(`${API_BASE_URL}/auth/me`).pipe(
      tap((usuario) => {
        this.currentUserState.set(usuario);
      }),
    );
  }

  logout(): void {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    this.currentUserState.set(null);
  }

  getAccessToken(): string | null {
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  }
}
```

**Notas**:
- `localStorage` e temporario nesta F-Sprint, conforme spec. Revisar na F-Sprint 3.
- Nao criar interceptor JWT nesta sprint; ele entra na F-Sprint 3.

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint
npm run build
```

### Definicao de pronto da Task F-2.2
- [ ] `HttpClient` habilitado
- [ ] Tipos alinhados ao PRD §21
- [ ] `AuthService` com `currentUser` Signal
- [ ] Login persiste token mock em `localStorage`
- [ ] Register usa `POST /api/v1/usuarios`
- [ ] `npm run build` passa

---

## Task F-2.3 - MSW handlers dos contratos publicos

**Objetivo**: evoluir os handlers MSW para cobrir sucesso e falha de login/cadastro com payloads coerentes com o PRD.

**Pre-requisito**: Task F-2.2 concluida.

**Esforco**: 1-2 horas.

**Arquivos afetados**:
- `<sep-app-root>/src/mocks/handlers.ts`
- `<sep-app-root>/src/test-setup.ts`

### Step 102.3.1 - Criar helpers de resposta

**Arquivo**: `<sep-app-root>/src/mocks/handlers.ts`

**Conteudo base esperado**:
```ts
import { http, HttpResponse } from 'msw';

const baseUrl = 'http://localhost:8080/api/v1';
const now = '2026-04-24T18:30:00-03:00';

const adminUsuario = {
  id: '1f0799c0-98b9-6d9d-bc4a-7d6f5b771001',
  username: 'admin@empresa.com',
  role: 'ADMIN',
  dataCriacao: now,
  dataModificacao: now,
  criadoPor: 'system',
  modificadoPor: 'system',
};

function errorResponse(status: number, error: string, message: string, path: string) {
  return HttpResponse.json(
    {
      timestamp: now,
      status,
      error,
      message,
      path,
    },
    { status },
  );
}
```

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint
```

### Step 102.3.2 - Implementar login mockado

**Arquivo**: `<sep-app-root>/src/mocks/handlers.ts`

**Handler esperado**:
```ts
http.post(`${baseUrl}/auth/login`, async ({ request }) => {
  const body = (await request.json()) as { username?: string; password?: string };

  if (body.username !== 'admin@empresa.com' || body.password !== '123456') {
    return errorResponse(401, 'Unauthorized', 'Credenciais invalidas', '/api/v1/auth/login');
  }

  return HttpResponse.json({
    accessToken: 'mock-jwt-token',
    tokenType: 'Bearer',
    expiresIn: 3600,
    usuario: adminUsuario,
  });
});
```

**Verificacao manual**:
- Com MSW ligado, login com `admin@empresa.com` / `123456` retorna sucesso.
- Qualquer outro par retorna `401`.

### Step 102.3.3 - Implementar cadastro mockado

**Arquivo**: `<sep-app-root>/src/mocks/handlers.ts`

**Handler esperado**:
```ts
http.post(`${baseUrl}/usuarios`, async ({ request }) => {
  const body = (await request.json()) as { username?: string; password?: string; role?: string };

  if (body.username === 'duplicado@empresa.com') {
    return errorResponse(409, 'Conflict', 'username ja cadastrado', '/api/v1/usuarios');
  }

  return HttpResponse.json(
    {
      id: '1f0799c0-98b9-6d9d-bc4a-7d6f5b771010',
      username: body.username,
      role: body.role,
      dataCriacao: now,
      dataModificacao: now,
      criadoPor: 'system',
      modificadoPor: 'system',
    },
    { status: 201 },
  );
});
```

**Verificacao manual**:
- Cadastro com `duplicado@empresa.com` retorna `409`.
- Cadastro com e-mail novo retorna `201`.

### Step 102.3.4 - Manter `/auth/me`

**Arquivo**: `<sep-app-root>/src/mocks/handlers.ts`

**Handler esperado**:
```ts
http.get(`${baseUrl}/auth/me`, () => HttpResponse.json(adminUsuario));
```

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint
```

### Step 102.3.5 - Plugar MSW server nos testes

**Arquivo**: `<sep-app-root>/src/test-setup.ts`

**Adicionar imports**:
```ts
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './mocks/server';
```

**Adicionar no final**:
```ts
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

**Verificacao**:
```bash
cd <sep-app-root>
npm run test
```

### Definicao de pronto da Task F-2.3
- [ ] Login mockado cobre sucesso e credenciais invalidas
- [ ] Cadastro mockado cobre sucesso e e-mail duplicado
- [ ] `/auth/me` preservado
- [ ] MSW server ativo nos testes
- [ ] `npm run test` passa

---

## Task F-2.4 - Landing publica Apple

**Objetivo**: implementar a landing em `/` com hero institucional, tiles alternados light/dark e CTAs para login/cadastro.

**Pre-requisito**: Task F-2.1 concluida.

**Esforco**: 4-6 horas.

**Arquivos afetados**:
- `<sep-app-root>/angular.json`
- `<sep-app-root>/src/app/features/public/landing/landing.component.ts`
- `<sep-app-root>/src/app/features/public/landing/landing.component.html`
- `<sep-app-root>/src/app/features/public/landing/landing.component.scss`
- `<sep-app-root>/src/app/features/public/landing/landing.component.spec.ts`
- `<sep-app-root>/src/assets/landing/`

### Step 102.4.1 - Criar assets placeholder

**Comando**:
```bash
cd <sep-app-root>
mkdir -p src/assets/landing
```

Criar placeholders simples em SVG ou WebP:
- `src/assets/landing/sep-capital.svg`
- `src/assets/landing/sep-escrow.svg`
- `src/assets/landing/sep-credito.svg`

**Arquivo**: `<sep-app-root>/angular.json`

Confirmar que `projects.sep-app.architect.build.options.assets` e `projects.sep-app.architect.test.options.assets` incluem `src/assets`, pois o scaffold Angular atual copia apenas `public/`:
```json
"assets": [
  {
    "glob": "**/*",
    "input": "public"
  },
  {
    "glob": "**/*",
    "input": "src/assets",
    "output": "/assets"
  }
]
```

**Diretriz visual**:
- Placeholder deve ser neutro e funcionar como produto/artefato da interface.
- Nao usar gradientes decorativos.
- Produto/render pode usar a sombra Apple apenas no elemento visual, nao no tile.

**Verificacao**:
```bash
cd <sep-app-root>
ls -la src/assets/landing
npm run build
```

### Step 102.4.2 - Criar componente standalone

**Arquivo**: `<sep-app-root>/src/app/features/public/landing/landing.component.ts`

**Conteudo esperado**:
```ts
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'sep-landing',
  imports: [RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent {}
```

**Verificacao**:
```bash
cd <sep-app-root>
npm run build
```

### Step 102.4.3 - Implementar HTML da landing

**Arquivo**: `<sep-app-root>/src/app/features/public/landing/landing.component.html`

**Estrutura obrigatoria**:
- `header` global preto com links: SEP, Credito PJ, Seguranca, Entrar.
- `main` com:
  - hero light/parchment com H1 "Capital de giro com experiencia simples."
  - CTA primario "Criar conta" para `/register`
  - CTA secundario "Entrar" para `/login`
  - tile dark sobre seguranca, auditoria e escrow
  - tile light sobre jornada do tomador
  - tile dark-2 sobre empresa credora
- `footer` parchment com texto institucional e links de login/cadastro.

**Texto recomendado**:
```html
<h1>Capital de giro com experiencia simples.</h1>
<p>Uma base digital para conectar empresas que precisam de credito a empresas que querem aportar recursos com rastreabilidade.</p>
```

**Regras**:
- Nao prometer credito aprovado.
- Nao citar Pix como funcionalidade ativa.
- Nao usar termos como "investimento garantido".
- Landing nao chama API.

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint
```

### Step 102.4.4 - Implementar SCSS Apple da landing

**Arquivo**: `<sep-app-root>/src/app/features/public/landing/landing.component.scss`

**Regras obrigatorias**:
- Usar `@use '../../../../styles/apple-tokens';`, `apple-typography` e `apple-components` conforme padrao da F-Sprint 1.
- Superficies full-bleed sem borda e sem radius.
- Alternar `--apple-color-canvas-parchment`, `--apple-color-surface-tile-1`, `--apple-color-canvas`, `--apple-color-surface-tile-2`.
- CTA sempre Action Blue.
- Responsivo nos breakpoints `1068px`, `833px`, `640px`, `419px`.

**Pseudocodigo SCSS**:
```scss
.apple-page {
  min-height: 100vh;
  background: var(--apple-color-canvas);
  color: var(--apple-color-ink);
}

.global-nav {
  height: 44px;
  background: var(--apple-color-surface-black);
  color: var(--apple-color-on-dark);
}

.tile {
  min-height: calc(100vh - 44px);
  padding: var(--apple-space-section) var(--apple-space-xl);
  text-align: center;
}

.tile--dark {
  background: var(--apple-color-surface-tile-1);
  color: var(--apple-color-on-dark);
}

.cta {
  border-radius: var(--apple-radius-pill);
}
```

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint:scss
npm run build
```

### Step 102.4.5 - Testar landing

**Arquivo**: `<sep-app-root>/src/app/features/public/landing/landing.component.spec.ts`

**Cenarios obrigatorios**:
- Renderiza headline principal.
- Renderiza links para `/login` e `/register`.
- Renderiza conteudo de seguranca/escrow.

**Verificacao**:
```bash
cd <sep-app-root>
npm run test
```

### Definicao de pronto da Task F-2.4
- [ ] Landing navegavel em `/`
- [ ] CTA para `/login` e `/register`
- [ ] Tiles alternam light/dark
- [ ] Nao ha chamada HTTP na landing
- [ ] Testes da landing passam
- [ ] `npm run build` passa

---

## Task F-2.5 - Login Apple + MSW

**Objetivo**: implementar a tela `/login` com formulario reativo, validacao local e chamada mockada para `POST /api/v1/auth/login`.

**Pre-requisito**: Tasks F-2.2 e F-2.3 concluidas.

**Esforco**: 4-6 horas.

**Arquivos afetados**:
- `<sep-app-root>/src/app/features/public/login/login.component.ts`
- `<sep-app-root>/src/app/features/public/login/login.component.html`
- `<sep-app-root>/src/app/features/public/login/login.component.scss`
- `<sep-app-root>/src/app/features/public/login/login.component.spec.ts`

### Step 102.5.1 - Criar componente Login

**Arquivo**: `<sep-app-root>/src/app/features/public/login/login.component.ts`

**Conteudo esperado**:
```ts
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'sep-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigateByUrl('/design-system/notion');
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('E-mail ou senha invalidos.');
      },
    });
  }
}
```

**Nota**:
- O redirecionamento para `/design-system/notion` e temporario ate a F-Sprint 3 criar o shell autenticado.

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint
```

### Step 102.5.2 - Implementar HTML do login

**Arquivo**: `<sep-app-root>/src/app/features/public/login/login.component.html`

**Estrutura obrigatoria**:
- Link de retorno para `/`.
- H1 "Entrar na SEP".
- Form com `username` e `password`.
- Mensagens de validacao:
  - e-mail obrigatorio/invalido.
  - senha deve conter exatamente 6 caracteres.
- Erro de credenciais.
- CTA primario "Entrar".
- Link para `/register`.

**Regras**:
- Usar `autocomplete="email"` e `autocomplete="current-password"`.
- Botao desabilitado durante loading.
- Nao exibir token na tela.

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint
```

### Step 102.5.3 - Implementar SCSS do login

**Arquivo**: `<sep-app-root>/src/app/features/public/login/login.component.scss`

**Regras obrigatorias**:
- Canvas Apple light/parchment.
- Form compacto, centralizado, sem card com sombra.
- Inputs em formato pill, altura minima 44px.
- Erros em texto objetivo; usar cor funcional discreta, sem introduzir nova cor de marca.
- CTA primario Action Blue.

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint:scss
npm run build
```

### Step 102.5.4 - Testar login

**Arquivo**: `<sep-app-root>/src/app/features/public/login/login.component.spec.ts`

**Cenarios obrigatorios**:
- Campos vazios bloqueiam submit.
- E-mail invalido mostra validacao.
- Senha diferente de 6 caracteres mostra validacao.
- `admin@empresa.com` + `123456` chama login e persiste usuario.
- Credenciais invalidas exibem "E-mail ou senha invalidos."

**Verificacao**:
```bash
cd <sep-app-root>
npm run test
```

### Definicao de pronto da Task F-2.5
- [ ] `/login` renderiza visual Apple
- [ ] Form valida e-mail e senha de 6 caracteres
- [ ] Sucesso usa MSW e atualiza `AuthService.currentUser`
- [ ] Falha mostra feedback
- [ ] Testes de login passam

---

## Task F-2.6 - Cadastro publico Apple + MSW

**Objetivo**: implementar a tela `/register` com formulario reativo, validacao local e chamada mockada para `POST /api/v1/usuarios`.

**Pre-requisito**: Tasks F-2.2 e F-2.3 concluidas.

**Esforco**: 4-6 horas.

**Arquivos afetados**:
- `<sep-app-root>/src/app/features/public/register/register.component.ts`
- `<sep-app-root>/src/app/features/public/register/register.component.html`
- `<sep-app-root>/src/app/features/public/register/register.component.scss`
- `<sep-app-root>/src/app/features/public/register/register.component.spec.ts`

### Step 102.6.1 - Criar componente Register

**Arquivo**: `<sep-app-root>/src/app/features/public/register/register.component.ts`

**Conteudo esperado**:
```ts
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { UsuarioRole } from '../../../core/api/api.models';

@Component({
  selector: 'sep-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    role: ['CLIENTE' as UsuarioRole, [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigateByUrl('/login');
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Ja existe um usuario com este e-mail.');
      },
    });
  }
}
```

**Nota**:
- O role `ADMIN` permanece disponivel porque o PRD permite nesta fase. Revisar antes de ambiente remoto/producao.

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint
```

### Step 102.6.2 - Implementar HTML do cadastro

**Arquivo**: `<sep-app-root>/src/app/features/public/register/register.component.html`

**Estrutura obrigatoria**:
- Link de retorno para `/`.
- H1 "Criar conta SEP".
- Form com `username`, `password`, `role`.
- Role como controle explicito com opcoes `CLIENTE` e `ADMIN`.
- Mensagens de validacao:
  - e-mail obrigatorio/invalido.
  - senha deve conter exatamente 6 caracteres.
  - perfil obrigatorio.
- Erro de e-mail duplicado.
- CTA primario "Criar conta".
- Link para `/login`.

**Regras**:
- Usar `autocomplete="email"` e `autocomplete="new-password"`.
- Nao criar regra de negocio no frontend alem das validacoes do contrato.
- Apos sucesso, redirecionar para `/login`.

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint
```

### Step 102.6.3 - Implementar SCSS do cadastro

**Arquivo**: `<sep-app-root>/src/app/features/public/register/register.component.scss`

**Regras obrigatorias**:
- Reutilizar linguagem visual do login.
- Inputs e select com altura minima 44px.
- CTA primario Action Blue.
- Sem cards com sombra.
- Layout responsivo ate `419px` sem overflow horizontal.

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint:scss
npm run build
```

### Step 102.6.4 - Testar cadastro

**Arquivo**: `<sep-app-root>/src/app/features/public/register/register.component.spec.ts`

**Cenarios obrigatorios**:
- Campos vazios bloqueiam submit.
- E-mail invalido mostra validacao.
- Senha diferente de 6 caracteres mostra validacao.
- Cadastro com e-mail novo redireciona para login.
- Cadastro com `duplicado@empresa.com` mostra erro de duplicidade.

**Verificacao**:
```bash
cd <sep-app-root>
npm run test
```

### Definicao de pronto da Task F-2.6
- [ ] `/register` renderiza visual Apple
- [ ] Form valida e-mail, senha e role
- [ ] Sucesso usa MSW e redireciona para `/login`
- [ ] Erro 409 mostra feedback
- [ ] Testes de cadastro passam

---

## Task F-2.7 - Testes integrados da superficie publica

**Objetivo**: garantir que as tres telas publicas funcionam juntas e que os mocks nao quebram contratos.

**Pre-requisito**: Tasks F-2.4, F-2.5 e F-2.6 concluidas.

**Esforco**: 2-3 horas.

### Step 102.7.1 - Revisar cobertura dos componentes

**Comando**:
```bash
cd <sep-app-root>
npm run test -- --coverage
```

**Verificacao**:
- Landing, login, register e AuthService aparecem no relatorio.
- Falhas por componentes publicos devem ser corrigidas antes de seguir.

### Step 102.7.2 - Adicionar testes de AuthService se necessario

**Arquivo opcional**: `<sep-app-root>/src/app/core/auth/auth.service.spec.ts`

**Cenarios recomendados**:
- `login()` grava token e usuario atual.
- `register()` envia payload e retorna usuario.
- `logout()` limpa token e usuario.

**Verificacao**:
```bash
cd <sep-app-root>
npm run test
```

### Step 102.7.3 - Validar navegacao publica

**Comando**:
```bash
cd <sep-app-root>
npm run build
```

**Verificacao manual no browser**:
```bash
cd <sep-app-root>
npm run start
```

No console do navegador:
```js
localStorage.setItem('NG_APP_USE_MSW', 'true')
```

Recarregar e validar:
- `/` abre landing.
- CTA "Entrar" vai para `/login`.
- CTA "Criar conta" vai para `/register`.
- Login com `admin@empresa.com` / `123456` funciona.
- Login invalido mostra erro.
- Cadastro com `duplicado@empresa.com` mostra erro.
- Cadastro com e-mail novo redireciona para login.

### Definicao de pronto da Task F-2.7
- [ ] Testes cobrem landing, login e register
- [ ] MSW server roda nos testes
- [ ] Fluxo publico navegavel manualmente
- [ ] Sem `console.error` no browser

---

## Task F-2.8 - Validacao final da F-Sprint 2

**Objetivo**: fechar a sprint com verificacoes automatizadas, smoke manual e checklist de pronto.

**Pre-requisito**: Tasks F-2.0 a F-2.7 concluidas.

**Esforco**: 30-45 min.

### Step 102.8.1 - Rodar qualidade completa

**Comando**:
```bash
cd <sep-app-root>
npm run lint
npm run lint:scss
npm run test
npm run build
```

**Verificacao**:
- Todos os comandos passam.
- Nenhum ajuste automatico via `lint:scss:fix` ou `format` deve ficar sem revisao.

### Step 102.8.2 - Conferir arquivos untracked

**Comando**:
```bash
cd <sep-app-root>
git status --short
git ls-files --others --exclude-standard src/app src/assets src/mocks src/styles
```

**Verificacao**:
- Arquivos novos esperados aparecem para staging.
- Nenhum artefato de build/teste aparece (`dist/`, `coverage/`, `.angular/`, `test-results/`).

### Step 102.8.3 - Revisao visual obrigatoria

**Checklist visual**:
- Landing usa tiles full-bleed sem radius.
- Nao ha gradientes decorativos.
- Nao ha sombras em cards, botoes ou texto.
- Action Blue e o unico accent interativo.
- Login e cadastro usam linguagem Apple, sem Notion.
- Breakpoints `1068px`, `833px`, `640px`, `419px` nao quebram layout.
- Textos nao prometem aprovacao de credito, rendimento ou Pix ativo.

### Definicao de pronto da F-Sprint 2
- [ ] Landing publica navegavel em `/`
- [ ] Login funcional com MSW em `/login`
- [ ] Cadastro publico funcional com MSW em `/register`
- [ ] `AuthService` com Signals operacional
- [ ] Handlers MSW para `POST /auth/login`, `GET /auth/me` e `POST /usuarios`
- [ ] Testes Vitest cobrindo validacao, sucesso e falha dos formularios
- [ ] Sem `console.error` no browser
- [ ] `npm run lint` passa
- [ ] `npm run lint:scss` passa
- [ ] `npm run test` passa
- [ ] `npm run build` passa

### Commit sugerido da F-Sprint 2

Se a sprint for entregue em um unico commit:
```bash
git add src/app/app.html src/app/app.scss src/app/app.routes.ts
git add angular.json src/app/core src/app/features/public src/assets/landing src/mocks src/test-setup.ts
git commit -m "feat(frontend): implementa telas publicas Apple com MSW"
```

Se dividir por task:
```bash
git commit -m "feat(frontend): estrutura rotas publicas Apple"
git commit -m "feat(auth): adiciona AuthService com signals e MSW"
git commit -m "feat(frontend): implementa landing publica Apple"
git commit -m "feat(frontend): implementa login e cadastro publicos"
git commit -m "test(frontend): cobre fluxos publicos com Vitest e MSW"
```

**Observacao**:
- Push e PR sao manuais.
- PR deve apontar para `develop`.
- Nao usar `git add -A`; adicionar paths especificos.

---

## Impacto esperado na F-Sprint 3

- `AuthService` sera reaproveitado e recebera interceptor JWT/guards.
- MSW fica disponivel como modo `dev-offline`.
- Rotas publicas permanecem Apple.
- A partir de `/auth/me`, a F-Sprint 3 introduz shell autenticado Notion.
