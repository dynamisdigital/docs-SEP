# Steps - F-Sprint 4 - Telas Autenticadas + Smoke E2E

**Spec de origem**: [`specs/fase-1/104-fsprint-4-telas-autenticadas.md`](../../specs/fase-1/104-fsprint-4-telas-autenticadas.md)

**Objetivo geral**: fechar a Fundacao Frontend entregando as telas autenticadas iniciais do web SEP: Meu Perfil, Alterar Senha, Administracao de Usuarios, Detalhe de Usuario e dashboard administrativa em formato de casca. A sprint tambem valida o golden path com Playwright contra o backend real.

**Esforco total estimado**: 3-4 dias de dois Devs Plenos Frontend, ou 5-6 dias com um Dev Pleno dedicado.

**Workspace root**: `<sep-app-root>/`.

**Localizacao do projeto Angular**: `<sep-app-root>/`.

**Ordem de execucao recomendada**:

```text
F-4.0 (prechecks)
  |
  +---> F-4.1 (contratos + UsuariosService)
          |
          +---> F-4.2 (rotas + menu)
                  |
                  +---> F-4.3 (Meu Perfil)
                  |
                  +---> F-4.4 (Alterar Senha)
                  |
                  +---> F-4.5 (Admin de Usuarios)
                  |
                  +---> F-4.6 (Dashboard casca)
                          |
                          +---> F-4.7 (Smoke E2E Playwright)
                                  |
                                  +---> F-4.8 (validacao final)
```

- F-4.0 e obrigatoria antes de qualquer edicao.
- F-4.1 centraliza o consumo dos endpoints de usuarios fora do `AuthService`.
- F-4.2 abre as rotas reais que as telas seguintes vao usar.
- F-4.3, F-4.4, F-4.5 e F-4.6 podem ser distribuidas entre devs depois de F-4.2.
- F-4.7 depende de todas as telas implementadas e do backend real rodando.
- F-4.8 fecha a sprint inteira e consolida o DoD.

**Como usar este arquivo**:
1. Execute os prechecks da Task F-4.0.
2. Execute cada task na ordem indicada.
3. Em cada step, rode a verificacao antes de seguir.
4. Ao final, valide com a "Definicao de pronto" da sprint.
5. Comite com mensagens Conventional Commits por task ou por grupo coerente.

**Pre-requisitos globais**:
- F-Sprint 3 concluida: shell Notion, auth real, guards, interceptors e dashboard placeholder.
- Sprint 4 backend concluida localmente ou mergeada: auth, usuarios, alterar senha, OpenAPI e handlers de erro padronizados.
- Backend local rodando em `http://localhost:8080`.
- Tokens Notion disponiveis em `src/styles/_notion-*.scss`.
- Nenhum framework CSS terceiro deve ser adicionado.
- Superficies autenticadas devem usar apenas Notion. Nao usar tokens Apple dentro de `/app`.

---

## Task F-4.0 - Prechecks da F-Sprint 4

**Objetivo**: confirmar que o web e o backend estao no ponto correto para implementar as telas autenticadas.

**Pre-requisito**: branch da F-Sprint 4 criada a partir de `develop` atualizada.

**Esforco**: 30-45 min.

### Step 104.0.1 - Confirmar estado do repo web

**Comando**:
```bash
cd <sep-app-root>
git status --short --branch
ls -la src/app/features/authenticated src/app/layout src/app/core/auth src/app/core/guards src/app/core/interceptors
```

**Verificacao**:
- Branch esperada: `feature/fsprint-4-telas-autenticadas` ou nome equivalente da sprint.
- F-Sprint 3 existe: `authenticated.routes.ts`, shell, header, sidenav, breadcrumbs, guards e interceptors.
- Se houver alteracoes pendentes nao relacionadas, revisar antes de editar.

### Step 104.0.2 - Confirmar scripts, tokens Notion e rotas atuais

**Comando**:
```bash
cd <sep-app-root>
npm run
ls -la src/styles/_notion-tokens.scss src/styles/_notion-typography.scss src/styles/_notion-components.scss
sed -n '1,220p' src/app/features/authenticated/authenticated.routes.ts
sed -n '1,220p' src/app/layout/sidenav/sidenav.component.ts
```

**Verificacao**:
- Scripts existentes: `lint`, `lint:scss`, `test`, `build`, `e2e`.
- Tokens Notion existem.
- Rotas autenticadas atuais ainda apontam para dashboard e admin placeholder da F-Sprint 3.

### Step 104.0.3 - Confirmar backend real

**Comando**:
```bash
curl -i http://localhost:8080/actuator/health
```

**Verificacao**:
- Espera `200 OK`.
- Se backend nao estiver rodando, subir `sep-api` antes de validar E2E real.

**Teste manual minimo dos endpoints**:
```bash
curl -i -X POST http://localhost:8080/api/v1/usuarios \
  -H "Content-Type: application/json" \
  -d '{"username":"fsprint4-admin@empresa.com","password":"123456","role":"ADMIN"}'

curl -i -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"fsprint4-admin@empresa.com","password":"123456"}'
```

**Verificacao**:
- Criacao pode retornar `201 Created` ou `409 Conflict` se o usuario ja existir.
- Login deve retornar `200 OK` com `accessToken`, `tokenType`, `expiresIn` e `usuario`.
- Guardar token apenas para validacoes manuais, se necessario.

### Step 104.0.4 - Rodar baseline antes de editar

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

### Definicao de pronto da Task F-4.0
- [x] F-Sprint 3 confirmada no frontend
- [x] Tokens Notion existem
- [x] Backend real responde localmente
- [x] Login real pode ser testado com usuario local
- [x] Baseline de lint/test/build passa

---

## Task F-4.1 - Contratos e UsuariosService

**Objetivo**: preparar contratos e servico dedicado para os endpoints de usuarios, mantendo `AuthService` focado em sessao/autenticacao.

**Pre-requisito**: Task F-4.0 concluida.

**Esforco**: 2-3 horas.

**Arquivos afetados**:
- `<sep-app-root>/src/app/core/api/api.models.ts`
- `<sep-app-root>/src/app/core/users/usuarios.service.ts`
- `<sep-app-root>/src/app/core/users/usuarios.service.spec.ts`

### Step 104.1.1 - Adicionar contrato de alteracao de senha

**Arquivo**: `<sep-app-root>/src/app/core/api/api.models.ts`

**Adicionar**:
```ts
export interface UsuarioSenhaUpdateRequest {
  passwordAtual: string;
  novaSenha: string;
}
```

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint
```

### Step 104.1.2 - Criar `UsuariosService`

**Arquivo**: `<sep-app-root>/src/app/core/users/usuarios.service.ts`

**Conteudo esperado**:
```ts
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { UsuarioResponse, UsuarioSenhaUpdateRequest } from '../api/api.models';

const API_BASE_URL = environment.apiBaseUrl;

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly http = inject(HttpClient);

  listar(): Observable<UsuarioResponse[]> {
    return this.http.get<UsuarioResponse[]>(`${API_BASE_URL}/usuarios`);
  }

  buscarPorId(id: string): Observable<UsuarioResponse> {
    return this.http.get<UsuarioResponse>(`${API_BASE_URL}/usuarios/${id}`);
  }

  alterarSenha(id: string, payload: UsuarioSenhaUpdateRequest): Observable<void> {
    return this.http.patch<void>(`${API_BASE_URL}/usuarios/${id}/senha`, payload);
  }
}
```

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint
```

### Step 104.1.3 - Testar `UsuariosService`

**Arquivo**: `<sep-app-root>/src/app/core/users/usuarios.service.spec.ts`

**Cenarios obrigatorios**:
- `listar()` chama `GET /usuarios`.
- `buscarPorId(id)` chama `GET /usuarios/{id}`.
- `alterarSenha(id, payload)` chama `PATCH /usuarios/{id}/senha` com `passwordAtual` e `novaSenha`.

**Verificacao**:
```bash
cd <sep-app-root>
npm run test -- --run src/app/core/users/usuarios.service.spec.ts
```

### Definicao de pronto da Task F-4.1
- [x] `UsuarioSenhaUpdateRequest` existe
- [x] `UsuariosService` centraliza endpoints de usuarios
- [x] `AuthService` continua responsavel apenas por login/register/me/sessao
- [x] Testes do servico passam

---

## Task F-4.2 - Rotas autenticadas e menu

**Objetivo**: abrir as rotas reais das telas autenticadas e substituir links placeholder do menu lateral.

**Pre-requisito**: Task F-4.1 concluida.

**Esforco**: 2-3 horas.

**Arquivos afetados**:
- `<sep-app-root>/src/app/features/authenticated/authenticated.routes.ts`
- `<sep-app-root>/src/app/layout/sidenav/sidenav.component.ts`
- `<sep-app-root>/src/app/layout/sidenav/sidenav.component.spec.ts`

### Step 104.2.1 - Atualizar rotas autenticadas

**Arquivo**: `<sep-app-root>/src/app/features/authenticated/authenticated.routes.ts`

**Comportamento esperado**:
- `/app/dashboard` carrega dashboard.
- `/app/profile` carrega Meu Perfil.
- `/app/profile/change-password` carrega Alterar Senha.
- `/app/admin/users` exige `roleGuard` com `roles: ['ADMIN']`.
- `/app/admin/users/:id` exige `roleGuard` com `roles: ['ADMIN']`.
- `/app/admin` redireciona para `/app/admin/users`.

**Snippet de referencia**:
```ts
{
  path: 'profile',
  loadComponent: () =>
    import('./profile/profile.component').then((m) => m.ProfileComponent),
  data: { breadcrumb: 'Meu perfil' },
},
{
  path: 'profile/change-password',
  loadComponent: () =>
    import('./profile/change-password/change-password.component').then(
      (m) => m.ChangePasswordComponent,
    ),
  data: { breadcrumb: 'Alterar senha' },
},
{
  path: 'admin',
  canActivate: [roleGuard],
  data: { roles: ['ADMIN'], breadcrumb: 'Administracao' },
  children: [
    { path: '', pathMatch: 'full', redirectTo: 'users' },
    {
      path: 'users',
      loadComponent: () =>
        import('./admin/users/users-list.component').then((m) => m.UsersListComponent),
      data: { breadcrumb: 'Usuarios' },
    },
    {
      path: 'users/:id',
      loadComponent: () =>
        import('./admin/users/user-detail.component').then((m) => m.UserDetailComponent),
      data: { breadcrumb: 'Detalhe de usuario' },
    },
  ],
}
```

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint
```

### Step 104.2.2 - Atualizar menu lateral

**Arquivo**: `<sep-app-root>/src/app/layout/sidenav/sidenav.component.ts`

**Comportamento esperado**:
- `Dashboard` aponta para `/app/dashboard`.
- `Meu perfil` aponta para `/app/profile` e nao fica mais disabled.
- `Administracao` aponta para `/app/admin/users` e aparece apenas para `ADMIN`.

**Snippet esperado**:
```ts
const items: MenuItem[] = [
  { label: 'Dashboard', route: '/app/dashboard' },
  { label: 'Meu perfil', route: '/app/profile' },
  { label: 'Administracao', route: '/app/admin/users', roles: ['ADMIN'] },
];
```

**Verificacao**:
```bash
cd <sep-app-root>
npm run test -- --run src/app/layout/sidenav/sidenav.component.spec.ts
```

### Step 104.2.3 - Ajustar testes do menu

**Arquivo**: `<sep-app-root>/src/app/layout/sidenav/sidenav.component.spec.ts`

**Cenarios obrigatorios**:
- usuario `ADMIN` ve Dashboard, Meu perfil e Administracao.
- usuario `CLIENTE` ve Dashboard e Meu perfil, mas nao ve Administracao.
- link Meu perfil aponta para `/app/profile`.
- link Administracao aponta para `/app/admin/users`.

**Verificacao**:
```bash
cd <sep-app-root>
npm run test -- --run src/app/layout/sidenav/sidenav.component.spec.ts
```

### Definicao de pronto da Task F-4.2
- [x] Rotas autenticadas da F-Sprint 4 existem
- [x] Rotas admin usam `roleGuard`
- [x] Menu lateral aponta para telas reais
- [x] Testes do menu passam

---

## Task F-4.3 - Tela Meu Perfil

**Objetivo**: exibir os dados do usuario autenticado usando o contrato de `/auth/me` ja carregado pelo shell/guard.

**Pre-requisito**: Task F-4.2 concluida.

**Esforco**: 3-4 horas.

**Arquivos afetados**:
- `<sep-app-root>/src/app/features/authenticated/profile/profile.component.ts`
- `<sep-app-root>/src/app/features/authenticated/profile/profile.component.html`
- `<sep-app-root>/src/app/features/authenticated/profile/profile.component.scss`
- `<sep-app-root>/src/app/features/authenticated/profile/profile.component.spec.ts`

### Step 104.3.1 - Criar componente standalone de perfil

**Arquivo**: `<sep-app-root>/src/app/features/authenticated/profile/profile.component.ts`

**Comportamento esperado**:
- Injetar `AuthService`.
- Expor `currentUser` e `loadingUser`.
- Ter acao `recarregar()` chamando `loadCurrentUser()`.
- Nao chamar `GET /usuarios/{id}` para o proprio perfil; usar `/auth/me` via `AuthService`.

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint
```

### Step 104.3.2 - Implementar template do perfil

**Arquivo**: `<sep-app-root>/src/app/features/authenticated/profile/profile.component.html`

**Conteudo esperado**:
- Cabecalho com titulo `Meu perfil`.
- Card principal com e-mail, role e id.
- Card de auditoria com `dataCriacao`, `dataModificacao`, `criadoPor`, `modificadoPor`.
- Acoes:
  - link para `/app/profile/change-password`
  - botao para recarregar dados
- Estado vazio quando `currentUser()` ainda for `null`.

**Verificacao manual**:
```bash
cd <sep-app-root>
npm run start
```

Acessar `/app/profile` apos login e confirmar renderizacao.

### Step 104.3.3 - Estilizar com Notion

**Arquivo**: `<sep-app-root>/src/app/features/authenticated/profile/profile.component.scss`

**Regras visuais**:
- Usar `@use '../../../../styles/notion-tokens'` e mixins Notion existentes, ajustando o caminho conforme a estrutura real dos arquivos SCSS.
- Cards com fundo warm-white, whisper border e raio pequeno.
- Tipografia compacta, sem hero-scale.
- Responsivo em uma coluna no mobile e duas colunas em desktop quando houver espaco.

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint:scss
```

### Step 104.3.4 - Testar tela de perfil

**Arquivo**: `<sep-app-root>/src/app/features/authenticated/profile/profile.component.spec.ts`

**Cenarios obrigatorios**:
- renderiza e-mail, role e id do usuario logado.
- renderiza campos de auditoria.
- link `Alterar senha` aponta para `/app/profile/change-password`.
- estado vazio aparece quando `currentUser` e `null`.

**Verificacao**:
```bash
cd <sep-app-root>
npm run test -- --run src/app/features/authenticated/profile/profile.component.spec.ts
```

### Definicao de pronto da Task F-4.3
- [x] `/app/profile` renderiza dados do usuario autenticado
- [x] Link para alterar senha funciona
- [x] Estados basicos existem
- [x] Visual segue Notion
- [x] Testes passam

---

## Task F-4.4 - Tela Alterar Senha

**Objetivo**: permitir que o usuario autenticado altere a propria senha usando `PATCH /api/v1/usuarios/{id}/senha`.

**Pre-requisito**: Tasks F-4.1 e F-4.2 concluidas.

**Esforco**: 4-5 horas.

**Arquivos afetados**:
- `<sep-app-root>/src/app/features/authenticated/profile/change-password/change-password.component.ts`
- `<sep-app-root>/src/app/features/authenticated/profile/change-password/change-password.component.html`
- `<sep-app-root>/src/app/features/authenticated/profile/change-password/change-password.component.scss`
- `<sep-app-root>/src/app/features/authenticated/profile/change-password/change-password.component.spec.ts`

### Step 104.4.1 - Criar componente e form reativo

**Arquivo**: `<sep-app-root>/src/app/features/authenticated/profile/change-password/change-password.component.ts`

**Comportamento esperado**:
- Standalone component com `ReactiveFormsModule` e `RouterLink`.
- Injetar `AuthService` e `UsuariosService`.
- Form controls:
  - `passwordAtual`: obrigatorio.
  - `novaSenha`: obrigatorio, `minLength(6)`, `maxLength(6)`.
  - `confirmacaoNovaSenha`: obrigatorio.
- Validator de grupo para confirmar que `confirmacaoNovaSenha === novaSenha`.
- Ao salvar:
  - bloquear submit se form invalido.
  - usar `currentUser().id` como id da rota `PATCH`.
  - enviar apenas `passwordAtual` e `novaSenha`.
  - em sucesso, exibir mensagem e limpar o form.
  - em erro, exibir mensagem do backend quando existir `ApiErrorResponse.message`.
- Manter usuario autenticado depois do sucesso.

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint
```

### Step 104.4.2 - Implementar template

**Arquivo**: `<sep-app-root>/src/app/features/authenticated/profile/change-password/change-password.component.html`

**Conteudo esperado**:
- Titulo `Alterar senha`.
- Campo senha atual.
- Campo nova senha.
- Campo confirmacao da nova senha.
- Feedback inline para senha obrigatoria, nova senha com exatamente 6 caracteres e confirmacao divergente.
- Mensagem de sucesso.
- Mensagem de erro.
- Botao `Salvar nova senha`.
- Link de retorno para `/app/profile`.

**Verificacao manual**:
```bash
cd <sep-app-root>
npm run start
```

Acessar `/app/profile/change-password` apos login e confirmar validacoes locais.

### Step 104.4.3 - Estilizar com Notion

**Arquivo**: `<sep-app-root>/src/app/features/authenticated/profile/change-password/change-password.component.scss`

**Regras visuais**:
- Form em painel Notion compacto.
- Inputs com borda discreta e foco visivel.
- Mensagens de erro/sucesso sem bloquear layout.
- Botao primario com raio pequeno conforme componentes Notion autenticados.

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint:scss
```

### Step 104.4.4 - Testar alterar senha

**Arquivo**: `<sep-app-root>/src/app/features/authenticated/profile/change-password/change-password.component.spec.ts`

**Cenarios obrigatorios**:
- form inicia invalido.
- nova senha exige exatamente 6 caracteres.
- confirmacao precisa ser igual a nova senha.
- submit valido chama `UsuariosService.alterarSenha` com id do usuario logado.
- sucesso mostra feedback e mantem sessao.
- erro 400/403 mostra mensagem amigavel.

**Verificacao**:
```bash
cd <sep-app-root>
npm run test -- --run src/app/features/authenticated/profile/change-password/change-password.component.spec.ts
```

### Definicao de pronto da Task F-4.4
- [x] `/app/profile/change-password` funciona para usuario autenticado
- [x] Validacoes locais estao implementadas
- [x] Sucesso nao encerra sessao
- [x] Erros de API aparecem na tela
- [x] Testes passam

---

## Task F-4.5 - Administracao de Usuarios

**Objetivo**: implementar lista e detalhe de usuarios para `ADMIN`, consumindo os endpoints reais de usuarios.

**Pre-requisito**: Tasks F-4.1 e F-4.2 concluidas.

**Esforco**: 1 dia.

**Arquivos afetados**:
- `<sep-app-root>/src/app/features/authenticated/admin/users/users-list.component.ts`
- `<sep-app-root>/src/app/features/authenticated/admin/users/users-list.component.html`
- `<sep-app-root>/src/app/features/authenticated/admin/users/users-list.component.scss`
- `<sep-app-root>/src/app/features/authenticated/admin/users/users-list.component.spec.ts`
- `<sep-app-root>/src/app/features/authenticated/admin/users/user-detail.component.ts`
- `<sep-app-root>/src/app/features/authenticated/admin/users/user-detail.component.html`
- `<sep-app-root>/src/app/features/authenticated/admin/users/user-detail.component.scss`
- `<sep-app-root>/src/app/features/authenticated/admin/users/user-detail.component.spec.ts`

### Step 104.5.1 - Criar lista de usuarios

**Arquivo**: `<sep-app-root>/src/app/features/authenticated/admin/users/users-list.component.ts`

**Comportamento esperado**:
- Injetar `UsuariosService`.
- Carregar usuarios no init.
- Estados: `loading`, `errorMessage`, `usuarios`.
- Filtro local por e-mail usando signal ou form control simples.
- Dados exibidos: id, username, role, dataCriacao, dataModificacao.
- Link de detalhe para `/app/admin/users/{id}`.
- Nao implementar paginacao server-side nesta sprint.

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint
```

### Step 104.5.2 - Implementar template e SCSS da lista

**Arquivos**:
- `<sep-app-root>/src/app/features/authenticated/admin/users/users-list.component.html`
- `<sep-app-root>/src/app/features/authenticated/admin/users/users-list.component.scss`

**Conteudo esperado**:
- Cabecalho `Administracao de usuarios`.
- Campo de filtro local por e-mail.
- Estado de carregamento.
- Estado de erro com botao tentar novamente.
- Estado vazio quando lista vier vazia ou filtro nao encontrar resultado.
- Tabela Notion com whisper border.
- Em viewport pequena, tabela pode rolar horizontalmente sem quebrar layout.

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint:scss
```

### Step 104.5.3 - Criar detalhe de usuario

**Arquivo**: `<sep-app-root>/src/app/features/authenticated/admin/users/user-detail.component.ts`

**Comportamento esperado**:
- Ler `id` de `ActivatedRoute`.
- Chamar `UsuariosService.buscarPorId(id)`.
- Estados: `loading`, `errorMessage`, `usuario`.
- Exibir botao/link de volta para `/app/admin/users`.
- Nao permitir edicao de usuario nesta sprint.

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint
```

### Step 104.5.4 - Implementar template e SCSS do detalhe

**Arquivos**:
- `<sep-app-root>/src/app/features/authenticated/admin/users/user-detail.component.html`
- `<sep-app-root>/src/app/features/authenticated/admin/users/user-detail.component.scss`

**Conteudo esperado**:
- Cabecalho `Detalhe de usuario`.
- Card com id, username e role.
- Card de auditoria com datas e autores.
- Estados loading, erro e vazio.
- Link de retorno para a lista.

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint:scss
```

### Step 104.5.5 - Testar lista e detalhe

**Arquivos**:
- `<sep-app-root>/src/app/features/authenticated/admin/users/users-list.component.spec.ts`
- `<sep-app-root>/src/app/features/authenticated/admin/users/user-detail.component.spec.ts`

**Cenarios obrigatorios da lista**:
- carrega usuarios ao iniciar.
- renderiza tabela com username, role e datas.
- filtro local reduz a lista por e-mail.
- estado vazio aparece quando lista e vazia.
- erro de API mostra mensagem e permite tentar novamente.
- link de detalhe aponta para `/app/admin/users/{id}`.

**Cenarios obrigatorios do detalhe**:
- le id da rota e chama `buscarPorId`.
- renderiza dados e auditoria do usuario.
- erro de API mostra feedback.
- link voltar aponta para `/app/admin/users`.

**Verificacao**:
```bash
cd <sep-app-root>
npm run test -- --run src/app/features/authenticated/admin/users
```

### Step 104.5.6 - Validar acesso negado para CLIENTE

**Verificacao manual**:
```bash
cd <sep-app-root>
npm run start
```

1. Logar com usuario `CLIENTE`.
2. Acessar `/app/admin/users`.
3. Confirmar redirect para `/access-denied`.

**Teste unitario recomendado**:
- Manter esta regra coberta em `role.guard.spec.ts`.
- Se o guard ja cobre, nao duplicar teste em componentes.

### Definicao de pronto da Task F-4.5
- [x] `/app/admin/users` lista usuarios para ADMIN
- [x] `/app/admin/users/:id` mostra detalhe para ADMIN
- [x] CLIENTE nao acessa rotas admin
- [x] Estados loading/vazio/erro existem
- [x] Filtro local por e-mail existe
- [x] Testes passam

---

## Task F-4.6 - Dashboard administrativa casca

**Objetivo**: evoluir o dashboard placeholder da F-Sprint 3 para uma casca navegavel, com atalhos reais para as telas da F-Sprint 4.

**Pre-requisito**: Tasks F-4.2, F-4.3, F-4.4 e F-4.5 concluidas.

**Esforco**: 3-4 horas.

**Arquivos afetados**:
- `<sep-app-root>/src/app/features/authenticated/dashboard/dashboard.component.ts`
- `<sep-app-root>/src/app/features/authenticated/dashboard/dashboard.component.html`
- `<sep-app-root>/src/app/features/authenticated/dashboard/dashboard.component.scss`
- `<sep-app-root>/src/app/features/authenticated/dashboard/dashboard.component.spec.ts`

### Step 104.6.1 - Ajustar dados do dashboard

**Arquivo**: `<sep-app-root>/src/app/features/authenticated/dashboard/dashboard.component.ts`

**Comportamento esperado**:
- Continuar usando `AuthService.currentUser`.
- Definir atalhos:
  - `Meu perfil` -> `/app/profile`
  - `Alterar senha` -> `/app/profile/change-password`
  - `Administracao de usuarios` -> `/app/admin/users`, somente quando role for `ADMIN`
- Definir cards placeholder:
  - `Onboarding`
  - `Analise de credito`
  - `Formalizacao`
  - `Cobranca`
- Cards placeholder nao devem apontar para rotas inexistentes nesta sprint.

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint
```

### Step 104.6.2 - Atualizar template e estilo

**Arquivos**:
- `<sep-app-root>/src/app/features/authenticated/dashboard/dashboard.component.html`
- `<sep-app-root>/src/app/features/authenticated/dashboard/dashboard.component.scss`

**Conteudo esperado**:
- Saudacao com e-mail do usuario.
- Badge de role.
- Atalhos navegaveis para telas reais.
- Secao de cards placeholder para jornadas futuras, visualmente marcados como indisponiveis ou "em preparacao".
- Visual Notion: denso, funcional, sem hero nem marketing.

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint:scss
```

### Step 104.6.3 - Testar dashboard

**Arquivo**: `<sep-app-root>/src/app/features/authenticated/dashboard/dashboard.component.spec.ts`

**Cenarios obrigatorios**:
- renderiza saudacao com usuario logado.
- ADMIN ve atalho de administracao.
- CLIENTE nao ve atalho de administracao.
- atalhos de perfil e senha existem para todos autenticados.
- cards placeholder nao criam links para rotas inexistentes.

**Verificacao**:
```bash
cd <sep-app-root>
npm run test -- --run src/app/features/authenticated/dashboard/dashboard.component.spec.ts
```

### Definicao de pronto da Task F-4.6
- [x] `/app/dashboard` e navegavel e util como casca
- [x] Atalhos reais existem
- [x] ADMIN ve administracao
- [x] CLIENTE nao ve administracao
- [x] Cards futuros nao criam rotas quebradas
- [x] Testes passam

---

## Task F-4.7 - Smoke E2E Playwright contra backend real

**Objetivo**: validar o golden path da Fundacao Frontend contra o backend local real, sem MSW.

**Pre-requisito**: Tasks F-4.1 a F-4.6 concluidas e backend real rodando.

**Esforco**: 1 dia.

**Arquivos afetados**:
- `<sep-app-root>/e2e/fixtures/users.ts`
- `<sep-app-root>/e2e/golden-path.spec.ts`
- `<sep-app-root>/e2e/admin-flow.spec.ts`
- `<sep-app-root>/playwright.config.ts` somente se for necessario ajustar timeout/artifacts sem mudar a estrategia de backend real

### Step 104.7.1 - Criar fixtures de usuarios unicos

**Arquivo**: `<sep-app-root>/e2e/fixtures/users.ts`

**Conteudo esperado**:
```ts
export function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}@empresa.com`;
}

export const defaultPassword = '123456';
export const changedPassword = '654321';
```

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint
```

### Step 104.7.2 - Implementar golden path de usuario autenticado

**Arquivo**: `<sep-app-root>/e2e/golden-path.spec.ts`

**Cenario obrigatorio**:
1. Abrir `/`.
2. Navegar para cadastro.
3. Criar usuario `CLIENTE` com e-mail unico.
4. Navegar para login.
5. Autenticar com senha inicial.
6. Confirmar chegada em `/app/dashboard`.
7. Abrir `Meu perfil`.
8. Confirmar e-mail e role.
9. Abrir `Alterar senha`.
10. Alterar senha para `654321`.
11. Fazer logout.
12. Logar novamente com a nova senha.
13. Confirmar dashboard autenticado.

**Regras**:
- Nao usar MSW.
- Nao depender de dados fixos preexistentes.
- Usar seletores por role/texto visivel sempre que possivel.
- Se algum texto estiver duplicado, adicionar `aria-label` nos componentes durante a implementacao da tela.

**Verificacao**:
```bash
cd <sep-app-root>
npm run e2e -- e2e/golden-path.spec.ts
```

### Step 104.7.3 - Implementar fluxo ADMIN

**Arquivo**: `<sep-app-root>/e2e/admin-flow.spec.ts`

**Cenario obrigatorio**:
1. Criar usuario `ADMIN` com e-mail unico pela tela de cadastro.
2. Logar como ADMIN.
3. Confirmar dashboard autenticado.
4. Abrir `Administracao`.
5. Confirmar tabela de usuarios.
6. Filtrar pelo e-mail admin criado.
7. Abrir detalhe do usuario.
8. Confirmar id, e-mail, role e auditoria basica.

**Cenario de acesso negado recomendado**:
1. Criar/logar usuario `CLIENTE`.
2. Acessar diretamente `/app/admin/users`.
3. Confirmar redirecionamento para `/access-denied`.

**Verificacao**:
```bash
cd <sep-app-root>
npm run e2e -- e2e/admin-flow.spec.ts
```

### Step 104.7.4 - Garantir artifacts de falha

**Arquivo**: `<sep-app-root>/playwright.config.ts`

**Estado esperado**:
- `screenshot: 'only-on-failure'`.
- `trace: 'on-first-retry'`.
- Reporter HTML com `open: 'never'`.

**Ajuste permitido**:
- Aumentar timeout somente se o backend local real estiver consistentemente mais lento.
- Nao trocar o webServer para `dev-offline`.

**Verificacao**:
```bash
cd <sep-app-root>
npm run e2e
```

### Definicao de pronto da Task F-4.7
- [x] Golden path CLIENTE passa contra backend real
- [x] Fluxo ADMIN passa contra backend real
- [x] CLIENTE nao acessa administracao
- [x] Dados de teste sao unicos por execucao
- [x] Playwright gera screenshot/trace em falha

---

## Task F-4.8 - Validacao final da F-Sprint 4

**Objetivo**: fechar a sprint com todos os checks locais verdes e DoD consolidado.

**Pre-requisito**: Tasks F-4.1 a F-4.7 concluidas.

**Esforco**: 1-2 horas.

### Step 104.8.1 - Rodar suite completa do frontend

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
- Se houver warning de budget herdado, registrar no resumo da sprint.
- Erro de lint, SCSS, teste ou build bloqueia a conclusao.

### Step 104.8.2 - Rodar E2E completo contra backend real

**Pre-condicao**:
- `sep-api` rodando em `http://localhost:8080`.
- Banco local disponivel.

**Comando**:
```bash
cd <sep-app-root>
npm run e2e
```

**Verificacao**:
- `smoke.spec.ts`, `golden-path.spec.ts` e `admin-flow.spec.ts` passam.
- Tempo total desejado: menor que 3 minutos no ambiente local.

### Step 104.8.3 - Conferir navegacao manual minima

**Comando**:
```bash
cd <sep-app-root>
npm run start
```

**Checklist manual**:
- [x] `/` abre landing Apple.
- [x] `/login` autentica usuario real.
- [x] `/app/dashboard` usa visual Notion.
- [x] `/app/profile` mostra dados do usuario.
- [x] `/app/profile/change-password` altera senha.
- [x] `/app/admin/users` lista usuarios para ADMIN.
- [x] `/app/admin/users/:id` mostra detalhe para ADMIN.
- [x] CLIENTE em `/app/admin/users` cai em `/access-denied`.
- [x] Logout volta para `/login`.

### Step 104.8.4 - Conferir arquivos novos e untracked

**Comando**:
```bash
cd <sep-app-root>
git status --short
git ls-files --others --exclude-standard src/app e2e
```

**Verificacao**:
- Todos os arquivos novos relevantes estao rastreados antes do commit.
- Nao adicionar arquivos de cache, screenshots locais, `playwright-report/`, `.env` ou artefatos gerados.

### Step 104.8.5 - Sugestao de commits

**Commits sugeridos**:
```text
feat(web): adicionar servico de usuarios autenticados
feat(web): implementar perfil e alteracao de senha
feat(web): implementar administracao de usuarios
feat(web): evoluir dashboard autenticado
test(web): adicionar smoke e2e autenticado
```

**Observacao**:
- Numero de commits e flexivel. Agrupar por escopo logico, seguindo Conventional Commits.
- Push e PR sao manuais.

### Definicao de pronto da Task F-4.8
- [x] Lint passa
- [x] Stylelint passa
- [x] Vitest passa
- [x] Build passa
- [x] Playwright passa contra backend real
- [x] DoD da F-Sprint 4 atendido
- [x] Resumo de PR pode ser gerado

---

## Definicao de pronto da F-Sprint 4

- [x] Tela "Meu Perfil" consumindo `/auth/me`
- [x] Tela "Alterar Senha" funcional contra backend real
- [x] Administracao de Usuarios restrita a `ADMIN`
- [x] Detalhe de Usuario restrito a `ADMIN`
- [x] Dashboard autenticada com atalhos reais e placeholders corretos
- [x] Role guard barra `CLIENTE` em rotas admin
- [x] Smoke E2E Playwright passa contra backend local real
- [x] CI pode rodar lint, stylelint, unit tests, build e E2E
- [x] Visual autenticado segue Notion, sem Apple tokens e sem frameworks CSS
- [x] Frontend MVP demonstravel para stakeholders

## Riscos e decisoes registradas

- O E2E desta sprint usa backend real, nao MSW. Se o backend nao estiver rodando, os testes devem falhar explicitamente.
- O cadastro publico de `ADMIN` continua permitido porque o backend da Fase 1 permite `ADMIN` e `CLIENTE`; revisar antes de ambiente remoto real.
- Paginacao, filtros server-side e edicao de usuario ficam fora da F-Sprint 4 porque os endpoints iniciais nao suportam essas capacidades.
- Dashboards das jornadas funcionais ficam para Epic 13; a dashboard desta sprint e apenas casca navegavel.
- Regras de negocio permanecem no backend. O frontend valida UX, permissao visual e roteamento, mas nao decide dominio.

## Referencias

- [`specs/fase-1/104-fsprint-4-telas-autenticadas.md`](../../specs/fase-1/104-fsprint-4-telas-autenticadas.md)
- [`docs-sep/PRD.md`](../../docs-sep/PRD.md)
- [`docs-sep/WEB-SCREENS-PLAN.md`](../../docs-sep/WEB-SCREENS-PLAN.md)
- [`docs-sep/DESIGN-notion.md`](../../docs-sep/DESIGN-notion.md)
- [`steps-fase-1/web/103-fsprint-3-steps.md`](./103-fsprint-3-steps.md)
