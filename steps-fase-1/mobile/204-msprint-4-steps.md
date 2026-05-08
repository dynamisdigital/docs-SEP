# Steps - M-Sprint 4 - Telas Autenticadas Mobile + Smoke E2E PWA

**Spec de origem**: [`specs/fase-1/204-msprint-4-telas-autenticadas-mobile.md`](../../specs/fase-1/204-msprint-4-telas-autenticadas-mobile.md)

**Status**: planejada para execucao no repo `sep-mobile`, branch sugerida `feature/msprint-4-telas-autenticadas-mobile`.

**Objetivo geral**: fechar a Fundacao Mobile entregando as telas autenticadas iniciais do app SEP: Meu Perfil, Alterar Senha, casca de inicio do tomador, casca de inicio da empresa credora e smoke E2E Playwright em PWA contra backend real.

**Esforco total estimado**: 3-4 dias de Dev Mobile dedicado.

**Repo de destino**: `sep-mobile` (clonado em `<sep-mobile-root>/` na maquina do dev). Modelo de 3 repos independentes (PRD secao 11, AGENT.md).

**Localizacao do projeto mobile**: `<sep-mobile-root>/`.

**Lembrete sobre fronteira de design system**: no mobile **so se usa Notion**, inclusive nas telas publicas e autenticadas. Nao usar tokens Apple e nao adicionar framework CSS terceiro.

**Estado esperado antes da sprint**:
- M-Sprint 3 concluida: auth real, `environment.apiBaseUrl`, guards, interceptors, shell mobile, tabs inferiores e paginas `/session-expired` e `/access-denied`.
- `AuthService` usa Capacitor Preferences, `getAccessToken()`, `hasToken()`, `loadCurrentUser()` e `clearSession()`.
- Rotas autenticadas atuais em `/app`: `inicio`, `propostas`, `parcelas`, `perfil`, `admin`.
- `/app/perfil` ainda aponta para `PlaceholderComponent` e sera substituida pela tela real de Perfil.
- `TabsComponent` filtra tabs por role: `CLIENTE` ve Inicio, Propostas, Parcelas e Perfil; `ADMIN` ve Inicio, Perfil e Admin.
- `playwright.config.ts` ja usa projeto `mobile-chromium` com viewport mobile via device Pixel 5 e webServer em `:8100`.

**Ordem de execucao recomendada**:

```text
M-4.0 (prechecks)
   |
   v
M-4.1 (contratos + UsuariosService)
   |
   v
M-4.2 (rotas autenticadas finais)
   |
   +---> M-4.3 (Meu Perfil)
   |
   +---> M-4.4 (Alterar Senha)
   |
   +---> M-4.5 (Inicio Tomador)
   |
   +---> M-4.6 (Inicio Credora)
            |
            v
M-4.7 (Smoke E2E PWA)
   |
   v
M-4.8 (validacao final)
```

- M-4.0 e obrigatoria antes de qualquer edicao.
- M-4.1 centraliza o endpoint de alteracao de senha fora do `AuthService`.
- M-4.2 troca placeholders por rotas reais.
- M-4.3, M-4.4, M-4.5 e M-4.6 podem ser distribuidas depois de M-4.2, desde que nao editem os mesmos arquivos ao mesmo tempo.
- M-4.7 depende das telas reais prontas e do backend rodando localmente.
- M-4.8 fecha a sprint inteira.

**Como usar este arquivo**:
1. Execute os prechecks da Task M-4.0.
2. Execute cada task na ordem indicada.
3. Em cada step, rode a verificacao antes de seguir.
4. Ao final de cada task, valide a "Definicao de pronto" da task.
5. Comite com mensagens Conventional Commits por task ou por grupo coerente.
6. Nao avance para Epic 14 Fase Mobile 2+ sem a M-Sprint 4 verde localmente.

**Pre-requisitos globais**:
- M-Sprint 3 concluida e verde localmente.
- Sprint 3 backend Task 3.3 concluida: `PATCH /api/v1/usuarios/{id}/senha`.
- Sprint 4 backend disponivel para smoke E2E real, com tratamento de erro padronizado.
- Backend local rodando em `http://localhost:8080`.
- CORS no backend aceitando `http://localhost:8100`.
- Tokens Notion mobile disponiveis em `src/styles/_notion-mobile-*.scss` e `src/theme/variables.scss`.
- Nenhum framework CSS terceiro deve ser adicionado.

**Fora de escopo durante estes steps**:
- Telas funcionais de onboarding, solicitacao de emprestimo, proposta ativa, parcelas reais ou carteira.
- Build Capacitor Android/iOS.
- Push notifications.
- Role dedicada para empresa credora. A casca credora deve existir como estrutura isolada, mas nao deve aparecer nas tabs enquanto so existirem `ADMIN` e `CLIENTE`.
- Cobertura E2E exaustiva. Esta sprint cobre apenas smoke/golden path.

---

## Task M-4.0 - Prechecks da M-Sprint 4

**Objetivo**: confirmar que o mobile e o backend estao no ponto correto para implementar as telas autenticadas.

**Pre-requisito**: branch da M-Sprint 4 criada a partir de `develop` atualizada.

**Esforco**: 30-45 min.

### Step 204.0.1 - Confirmar estado do repo mobile

**Comando**:
```bash
cd <sep-mobile-root>
git status --short --branch
ls -la src/app/features/authenticated src/app/layout src/app/core/auth src/app/core/guards src/app/core/interceptors
sed -n '1,220p' src/app/features/authenticated/authenticated.routes.ts
sed -n '1,220p' src/app/layout/tabs/tabs.component.ts
```

**Verificacao**:
- Branch esperada: `feature/msprint-4-telas-autenticadas-mobile` ou nome equivalente da sprint.
- M-Sprint 3 existe: shell, header mobile, tabs, guards, interceptors, paginas de erro e rotas `/app`.
- `/app/perfil` ainda pode apontar para placeholder; isso sera corrigido na M-4.2.
- Se houver alteracoes pendentes nao relacionadas, revisar antes de editar.

### Step 204.0.2 - Confirmar scripts, tokens e Playwright

**Comando**:
```bash
cd <sep-mobile-root>
npm run
ls -la src/styles/_notion-mobile-tokens.scss src/styles/_notion-mobile-typography.scss src/styles/_notion-mobile-components.scss src/theme/variables.scss
ls -la playwright.config.ts e2e
```

**Verificacao**:
- Scripts existentes: `lint`, `lint:scss`, `test`, `build`, `e2e` ou script equivalente de Playwright.
- Tokens Notion mobile existem.
- Playwright esta configurado para PWA/mobile.
- Se `e2e` nao existir ainda, criar na Task M-4.7.

### Step 204.0.3 - Confirmar backend real

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
  -d '{"username":"msprint4-cliente@empresa.com","password":"123456","role":"CLIENTE"}'

curl -i -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"msprint4-cliente@empresa.com","password":"123456"}'
```

**Verificacao**:
- Criacao pode retornar `201 Created` ou `409 Conflict` se o usuario ja existir.
- Login deve retornar `200 OK` com `accessToken`, `tokenType`, `expiresIn` e `usuario`.

### Step 204.0.4 - Rodar baseline antes de editar

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

### Definicao de pronto da Task M-4.0
- [ ] M-Sprint 3 confirmada no mobile
- [ ] Tokens Notion mobile existem
- [ ] Backend real responde localmente
- [ ] Login real pode ser testado com usuario local
- [ ] Baseline de lint/test/build passa

### Commit Task M-4.0
Nao gera commit - e apenas validacao do ambiente.

---

## Task M-4.1 - Contratos e UsuariosService

**Objetivo**: preparar contrato e servico dedicado para alterar senha, mantendo `AuthService` focado em sessao/autenticacao.

**Pre-requisito**: Task M-4.0 concluida.

**Esforco**: 2-3 horas.

**Arquivos afetados**:
- `<sep-mobile-root>/src/app/core/api/api.models.ts`
- `<sep-mobile-root>/src/app/core/users/usuarios.service.ts`
- `<sep-mobile-root>/src/app/core/users/usuarios.service.spec.ts`

### Step 204.1.1 - Adicionar contrato de alteracao de senha

**Arquivo**: `<sep-mobile-root>/src/app/core/api/api.models.ts`

**Adicionar**:
```ts
export interface UsuarioSenhaUpdateRequest {
  passwordAtual: string;
  novaSenha: string;
}
```

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
```

### Step 204.1.2 - Criar `UsuariosService`

**Arquivo**: `<sep-mobile-root>/src/app/core/users/usuarios.service.ts`

**Conteudo esperado**:
```ts
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { UsuarioSenhaUpdateRequest } from '../api/api.models';

const API_BASE_URL = environment.apiBaseUrl;

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly http = inject(HttpClient);

  alterarSenha(id: string, payload: UsuarioSenhaUpdateRequest): Promise<void> {
    return firstValueFrom(this.http.patch<void>(`${API_BASE_URL}/usuarios/${id}/senha`, payload));
  }
}
```

**Regra**:
- Nesta sprint mobile so precisa de `alterarSenha()`.
- Nao adicionar listagem/admin de usuarios no mobile.
- O `authInterceptor` da M-Sprint 3 deve anexar o Bearer token automaticamente.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
```

### Step 204.1.3 - Testar `UsuariosService`

**Arquivo**: `<sep-mobile-root>/src/app/core/users/usuarios.service.spec.ts`

**Cenarios obrigatorios**:
- `alterarSenha(id, payload)` chama `PATCH /usuarios/{id}/senha`.
- Payload usa exatamente `passwordAtual` e `novaSenha`.
- Erro `400` ou `403` do backend e propagado para o componente tratar.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run test -- src/app/core/users/usuarios.service.spec.ts
```

### Definicao de pronto da Task M-4.1
- [ ] `UsuarioSenhaUpdateRequest` existe
- [ ] `UsuariosService` centraliza `PATCH /usuarios/{id}/senha`
- [ ] `AuthService` continua responsavel apenas por login/register/me/sessao
- [ ] Testes do servico passam

### Commit Task M-4.1
Mensagem sugerida:
```text
feat(mobile): adicionar servico de usuarios
```

---

## Task M-4.2 - Rotas autenticadas finais

**Objetivo**: substituir placeholders por rotas reais de perfil/alteracao de senha e reservar a rota da casca credora sem expor nas tabs.

**Pre-requisito**: Task M-4.1 concluida.

**Esforco**: 2-3 horas.

**Arquivos afetados**:
- `<sep-mobile-root>/src/app/features/authenticated/authenticated.routes.ts`
- `<sep-mobile-root>/src/app/layout/tabs/tabs.component.ts`
- `<sep-mobile-root>/src/app/layout/tabs/tabs.component.spec.ts`

### Step 204.2.1 - Atualizar rotas autenticadas

**Arquivo**: `<sep-mobile-root>/src/app/features/authenticated/authenticated.routes.ts`

**Comportamento esperado**:
- `/app/inicio` carrega a casca real do tomador.
- `/app/perfil` carrega `ProfileComponent`.
- `/app/perfil/alterar-senha` carrega `ChangePasswordComponent`.
- `/app/credora/inicio` carrega a casca credora, protegida por `roleGuard` para futura role, mas sem aparecer nas tabs atuais.
- `/app/propostas`, `/app/parcelas` e `/app/admin` podem continuar como placeholders nesta sprint.

**Exemplo de rotas alteradas/adicionadas**:
```ts
{
  path: 'inicio',
  loadComponent: () =>
    import('../tomador/home/home.component').then((m) => m.TomadorHomeComponent),
  data: { tab: 'inicio' },
},
{
  path: 'perfil',
  loadComponent: () => import('./profile/profile.component').then((m) => m.ProfileComponent),
  data: { tab: 'perfil' },
},
{
  path: 'perfil/alterar-senha',
  loadComponent: () =>
    import('./profile/change-password/change-password.component').then(
      (m) => m.ChangePasswordComponent,
    ),
  data: { tab: 'perfil' },
},
{
  path: 'credora/inicio',
  loadComponent: () =>
    import('../credora/home/home.component').then((m) => m.CredoraHomeComponent),
  data: { tab: 'credora-inicio' },
},
```

**Regra**:
- A rota credora existe para validar a casca, mas nao deve ser linkada nas tabs enquanto nao houver role dedicada.
- Se a organizacao `features/tomador` e `features/credora` ainda nao existir, cria-la nas Tasks M-4.5 e M-4.6.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run build
```

### Step 204.2.2 - Confirmar tabs atuais

**Arquivo**: `<sep-mobile-root>/src/app/layout/tabs/tabs.component.ts`

**Comportamento esperado**:
- Manter `CLIENTE`: Inicio, Propostas, Parcelas, Perfil.
- Manter `ADMIN`: Inicio, Perfil, Admin.
- Nao adicionar tab Credora nesta sprint.
- Garantir que a tab Perfil navegue para `/app/perfil`.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run test -- src/app/layout/tabs/tabs.component.spec.ts
```

### Step 204.2.3 - Testar rotas autenticadas

**Arquivo**: criar ou atualizar teste de rotas, se o projeto ja tiver padrao para isso.

**Cenarios obrigatorios**:
- `/app/perfil` resolve `ProfileComponent`.
- `/app/perfil/alterar-senha` resolve `ChangePasswordComponent`.
- `/app/inicio` resolve casca tomador.
- Tabs nao exibem link para casca credora.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run test -- src/app/features/authenticated src/app/layout/tabs
```

### Definicao de pronto da Task M-4.2
- [ ] `/app/perfil` aponta para tela real
- [ ] `/app/perfil/alterar-senha` existe
- [ ] `/app/inicio` aponta para casca tomador
- [ ] Casca credora tem rota isolada
- [ ] Tabs permanecem coerentes com roles atuais

### Commit Task M-4.2
Mensagem sugerida:
```text
feat(mobile): abrir rotas autenticadas finais
```

---

## Task M-4.3 - Tela Meu Perfil Mobile

**Objetivo**: implementar tela de perfil mobile com dados do usuario autenticado, link para alterar senha e logout.

**Pre-requisito**: Task M-4.2 concluida.

**Esforco**: 4-5 horas.

**Arquivos afetados**:
- `<sep-mobile-root>/src/app/features/authenticated/profile/profile.component.ts`
- `<sep-mobile-root>/src/app/features/authenticated/profile/profile.component.html`
- `<sep-mobile-root>/src/app/features/authenticated/profile/profile.component.scss`
- `<sep-mobile-root>/src/app/features/authenticated/profile/profile.component.spec.ts`

### Step 204.3.1 - Criar ProfileComponent

**Arquivo**: `<sep-mobile-root>/src/app/features/authenticated/profile/profile.component.ts`

**Comportamento esperado**:
- Usar `AuthService.currentUser()` como fonte principal.
- Botao `Recarregar` chama `auth.loadCurrentUser()`.
- Botao `Alterar senha` navega para `/app/perfil/alterar-senha`.
- Botao `Sair` chama `auth.logout()` e navega para `/welcome`.
- Exibir `id` resumido, `username`, `role`, `dataCriacao`, `dataModificacao`, `criadoPor` e `modificadoPor`.

**Pseudocodigo**:
```ts
readonly user = this.auth.currentUser;

shortId(id: string): string {
  return `${id.slice(0, 8)}...${id.slice(-4)}`;
}

async reload(): Promise<void> {
  await this.auth.loadCurrentUser();
}

async logout(): Promise<void> {
  await this.auth.logout();
  await this.router.navigateByUrl('/welcome');
}
```

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
```

### Step 204.3.2 - Implementar template e SCSS

**Arquivos**:
- `<sep-mobile-root>/src/app/features/authenticated/profile/profile.component.html`
- `<sep-mobile-root>/src/app/features/authenticated/profile/profile.component.scss`

**Conteudo esperado**:
- `ion-content` com layout Notion mobile.
- Cards simples para Identificacao e Auditoria.
- Botoes full-width com touch target generoso.
- Link/botao para alterar senha com `routerLink="/app/perfil/alterar-senha"`.
- Mensagens curtas, sem texto explicativo sobre funcionalidades futuras.

**Regras visuais**:
- Usar tokens Notion mobile.
- Evitar card dentro de card.
- Garantir que textos longos como e-mail e UUID quebrem linha sem overflow.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint:scss
npm run build
```

### Step 204.3.3 - Testar ProfileComponent

**Arquivo**: `<sep-mobile-root>/src/app/features/authenticated/profile/profile.component.spec.ts`

**Cenarios obrigatorios**:
- Renderiza e-mail, role e id resumido do usuario.
- Link de alterar senha aponta para `/app/perfil/alterar-senha`.
- Botao recarregar chama `loadCurrentUser()`.
- Botao sair chama `logout()` e navega para `/welcome`.
- Nao quebra quando `currentUser()` ainda e `null`; renderizar estado simples de carregamento/vazio.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run test -- src/app/features/authenticated/profile/profile.component.spec.ts
```

### Definicao de pronto da Task M-4.3
- [ ] Perfil renderiza dados do usuario autenticado
- [ ] Link para alterar senha funciona
- [ ] Logout limpa sessao e volta para `/welcome`
- [ ] Layout e responsivo e fiel ao Notion mobile
- [ ] Testes do componente passam

### Commit Task M-4.3
Mensagem sugerida:
```text
feat(mobile): implementar perfil autenticado
```

---

## Task M-4.4 - Tela Alterar Senha Mobile

**Objetivo**: implementar formulario mobile para alterar a senha do proprio usuario autenticado.

**Pre-requisito**: Tasks M-4.1 e M-4.3 concluidas.

**Esforco**: 5-6 horas.

**Arquivos afetados**:
- `<sep-mobile-root>/src/app/features/authenticated/profile/change-password/change-password.component.ts`
- `<sep-mobile-root>/src/app/features/authenticated/profile/change-password/change-password.component.html`
- `<sep-mobile-root>/src/app/features/authenticated/profile/change-password/change-password.component.scss`
- `<sep-mobile-root>/src/app/features/authenticated/profile/change-password/change-password.component.spec.ts`

### Step 204.4.1 - Criar ChangePasswordComponent

**Arquivo**: `<sep-mobile-root>/src/app/features/authenticated/profile/change-password/change-password.component.ts`

**Comportamento esperado**:
- Form reativo com `passwordAtual`, `novaSenha`, `confirmacaoNovaSenha`.
- `passwordAtual`: required.
- `novaSenha`: required, minLength(6), maxLength(6).
- `confirmacaoNovaSenha`: required e igual a `novaSenha`.
- Submit chama `UsuariosService.alterarSenha(currentUser.id, { passwordAtual, novaSenha })`.
- Sucesso limpa o form e mostra feedback de sucesso.
- Falha mostra mensagem do `ApiErrorResponse.message` quando existir.
- Manter usuario autenticado apos sucesso.

**Pseudocodigo**:
```ts
readonly form = this.fb.nonNullable.group(
  {
    passwordAtual: ['', [Validators.required]],
    novaSenha: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    confirmacaoNovaSenha: ['', [Validators.required]],
  },
  { validators: confirmacaoIgualValidator },
);

async submit(): Promise<void> {
  const user = this.auth.currentUser();
  if (!user || this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  await this.usuarios.alterarSenha(user.id, {
    passwordAtual: this.form.controls.passwordAtual.value,
    novaSenha: this.form.controls.novaSenha.value,
  });
}
```

**Regra**:
- Usar `type="password"` e `autocomplete="current-password"` / `autocomplete="new-password"`.
- Nao usar `inputmode="numeric"`; PRD exige 6 caracteres, nao apenas numeros.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
```

### Step 204.4.2 - Implementar template e feedback

**Arquivos**:
- `<sep-mobile-root>/src/app/features/authenticated/profile/change-password/change-password.component.html`
- `<sep-mobile-root>/src/app/features/authenticated/profile/change-password/change-password.component.scss`

**Conteudo esperado**:
- `ion-content` com form compacto.
- Campos full-width com labels claros.
- Botao submit full-width.
- Link/botao voltar para `/app/perfil`.
- Feedback de sucesso com `role="status"` ou `ion-toast`.
- Feedback de erro com `role="alert"` ou `ion-toast`.

**Regras visuais**:
- Touch target minimo 44px.
- Texto deve caber em 375px sem overflow.
- Nao usar modais nesta sprint.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint:scss
npm run build
```

### Step 204.4.3 - Testar ChangePasswordComponent

**Arquivo**: `<sep-mobile-root>/src/app/features/authenticated/profile/change-password/change-password.component.spec.ts`

**Cenarios obrigatorios**:
- Form invalido sem senha atual.
- Nova senha precisa ter exatamente 6 caracteres.
- Confirmacao precisa ser igual a nova senha.
- Submit valido chama `UsuariosService.alterarSenha()` com id do usuario atual.
- Sucesso exibe feedback e mantem sessao.
- Erro do backend exibe mensagem amigavel.
- Sem usuario atual, submit nao chama service.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run test -- src/app/features/authenticated/profile/change-password
```

### Definicao de pronto da Task M-4.4
- [ ] Form valida campos obrigatorios
- [ ] Nova senha exige exatamente 6 caracteres
- [ ] Confirmacao precisa bater com nova senha
- [ ] `PATCH /usuarios/{id}/senha` e chamado via `UsuariosService`
- [ ] Sucesso mantem usuario autenticado
- [ ] Testes do componente passam

### Commit Task M-4.4
Mensagem sugerida:
```text
feat(mobile): implementar alteracao de senha
```

---

## Task M-4.5 - Inicio do Tomador (casca)

**Objetivo**: evoluir a primeira tab Inicio para uma casca do tomador, com cards placeholder para futuras jornadas.

**Pre-requisito**: Task M-4.2 concluida.

**Esforco**: 4-5 horas.

**Arquivos afetados**:
- `<sep-mobile-root>/src/app/features/tomador/home/home.component.ts`
- `<sep-mobile-root>/src/app/features/tomador/home/home.component.html`
- `<sep-mobile-root>/src/app/features/tomador/home/home.component.scss`
- `<sep-mobile-root>/src/app/features/tomador/home/home.component.spec.ts`
- opcionalmente remover ou deixar de usar `<sep-mobile-root>/src/app/features/authenticated/home/*`

### Step 204.5.1 - Criar TomadorHomeComponent

**Arquivo**: `<sep-mobile-root>/src/app/features/tomador/home/home.component.ts`

**Comportamento esperado**:
- Saudacao com e-mail do usuario autenticado.
- Cards placeholder:
  - `Status do cadastro`
  - `Proposta ativa`
  - `Proximas parcelas`
- Atalhos:
  - `Onboarding`
  - `Solicitar emprestimo`
  - `Acompanhar proposta`
- Atalhos nao navegam para telas inexistentes; ao tocar, mostram feedback `Funcionalidade em breve`.

**Pseudocodigo**:
```ts
readonly user = this.auth.currentUser;
readonly cards = [...];
readonly shortcuts = [...];

showSoon(): void {
  this.soonMessage.set('Funcionalidade em breve');
}
```

**Regra**:
- Nao chamar endpoints alem de `/auth/me`, ja carregado pelo guard.
- Nao adicionar regra de negocio de credito no mobile.

### Step 204.5.2 - Implementar template e SCSS

**Arquivos**:
- `<sep-mobile-root>/src/app/features/tomador/home/home.component.html`
- `<sep-mobile-root>/src/app/features/tomador/home/home.component.scss`

**Conteudo esperado**:
- Layout mobile de scan rapido.
- Cards Notion mobile com badges `Em breve`.
- Botoes/atalhos com touch target generoso.
- Feedback simples quando atalho placeholder for tocado.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
npm run lint:scss
npm run build
```

### Step 204.5.3 - Testar TomadorHomeComponent

**Arquivo**: `<sep-mobile-root>/src/app/features/tomador/home/home.component.spec.ts`

**Cenarios obrigatorios**:
- Renderiza saudacao com usuario atual.
- Renderiza cards `Status do cadastro`, `Proposta ativa` e `Proximas parcelas`.
- Renderiza atalhos com badge `Em breve`.
- Clique em atalho placeholder exibe feedback.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run test -- src/app/features/tomador/home
```

### Definicao de pronto da Task M-4.5
- [ ] `/app/inicio` renderiza casca do tomador
- [ ] Cards placeholder aparecem com badge `Em breve`
- [ ] Atalhos nao navegam para rotas inexistentes
- [ ] Nenhuma regra de negocio fica no mobile
- [ ] Testes passam

### Commit Task M-4.5
Mensagem sugerida:
```text
feat(mobile): criar inicio do tomador
```

---

## Task M-4.6 - Inicio da Empresa Credora (casca)

**Objetivo**: criar a casca visual da empresa credora para futura Epic 14 Fase Mobile 3, sem expor a rota nas tabs atuais.

**Pre-requisito**: Task M-4.2 concluida.

**Esforco**: 3-4 horas.

**Arquivos afetados**:
- `<sep-mobile-root>/src/app/features/credora/home/home.component.ts`
- `<sep-mobile-root>/src/app/features/credora/home/home.component.html`
- `<sep-mobile-root>/src/app/features/credora/home/home.component.scss`
- `<sep-mobile-root>/src/app/features/credora/home/home.component.spec.ts`

### Step 204.6.1 - Criar CredoraHomeComponent

**Arquivo**: `<sep-mobile-root>/src/app/features/credora/home/home.component.ts`

**Comportamento esperado**:
- Saudacao simples.
- Cards placeholder:
  - `Status do cadastro/KYB`
  - `Resumo de oportunidades`
  - `Operacoes financiadas`
  - `Carteira`
- Todos os itens funcionais ficam como `Em breve`.

**Regra**:
- Como ainda nao existe role dedicada para empresa credora, esta casca nao deve aparecer para `CLIENTE` nem `ADMIN` nas tabs.
- A rota pode existir para validar layout e servir de base futura.

### Step 204.6.2 - Implementar template e SCSS

**Arquivos**:
- `<sep-mobile-root>/src/app/features/credora/home/home.component.html`
- `<sep-mobile-root>/src/app/features/credora/home/home.component.scss`

**Conteudo esperado**:
- Visual Notion mobile.
- Cards simples, sem dados reais.
- Sem chamadas HTTP novas.
- Textos curtos e cabiveis em 375px.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
npm run lint:scss
npm run build
```

### Step 204.6.3 - Testar CredoraHomeComponent

**Arquivo**: `<sep-mobile-root>/src/app/features/credora/home/home.component.spec.ts`

**Cenarios obrigatorios**:
- Renderiza saudacao.
- Renderiza cards de KYB, oportunidades, operacoes e carteira.
- Exibe badges `Em breve`.
- Nao depende de endpoints ainda inexistentes.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run test -- src/app/features/credora/home
```

### Definicao de pronto da Task M-4.6
- [ ] Casca credora existe em rota isolada
- [ ] Casca credora nao aparece nas tabs atuais
- [ ] Cards placeholder seguem Notion mobile
- [ ] Nenhum endpoint futuro e chamado
- [ ] Testes passam

### Commit Task M-4.6
Mensagem sugerida:
```text
feat(mobile): criar inicio da credora
```

---

## Task M-4.7 - Smoke E2E Playwright PWA

**Objetivo**: validar o golden path mobile em PWA contra backend real.

**Pre-requisito**: Tasks M-4.1 a M-4.6 concluidas e backend local rodando.

**Esforco**: 4-6 horas.

**Arquivos afetados**:
- `<sep-mobile-root>/e2e/fixtures/users.ts`
- `<sep-mobile-root>/e2e/golden-path-mobile.spec.ts`
- `<sep-mobile-root>/playwright.config.ts` se precisar ajustar viewport ou webServer

### Step 204.7.1 - Criar fixtures E2E

**Arquivo**: `<sep-mobile-root>/e2e/fixtures/users.ts`

**Conteudo esperado**:
```ts
export const defaultPassword = '123456';
export const changedPassword = '654321';

export function uniqueEmail(prefix = 'mobile'): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}@empresa.com`;
}
```

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
```

### Step 204.7.2 - Criar golden path mobile

**Arquivo**: `<sep-mobile-root>/e2e/golden-path-mobile.spec.ts`

**Fluxo obrigatorio**:
1. Abrir app no splash/welcome.
2. Ir para cadastro.
3. Criar usuario `CLIENTE` com e-mail unico.
4. Ir para login.
5. Autenticar com senha inicial.
6. Confirmar chegada em `/app/inicio`.
7. Confirmar tabs inferiores.
8. Ir para Perfil.
9. Ir para Alterar senha.
10. Alterar senha para `654321`.
11. Voltar para Perfil ou Inicio.
12. Fazer logout.
13. Relogar com a nova senha.
14. Confirmar retorno ao shell.

**Regras Playwright**:
- Preferir `getByRole()` e labels acessiveis.
- Quando e-mail aparecer em header e conteudo, escopar buscas com `page.getByRole('main')` ou container equivalente.
- Nao depender de delays fixos; usar expectativas de URL/visibilidade.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run e2e -- e2e/golden-path-mobile.spec.ts
```

### Step 204.7.3 - Ajustar Playwright se necessario

**Arquivo**: `<sep-mobile-root>/playwright.config.ts`

**Comportamento esperado**:
- `baseURL` permanece `http://127.0.0.1:8100`.
- WebServer sobe `npm run start -- --host=127.0.0.1 --port=8100`.
- Projeto mobile usa Chromium com viewport mobile. O device Pixel 5 atual e aceitavel.
- `screenshot: 'only-on-failure'` e `trace: 'on-first-retry'` permanecem.

**Regra**:
- Nao trocar para WebKit nesta sprint; CI mobile atual usa Chromium.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run e2e
```

### Step 204.7.4 - Garantir E2E no CI mobile

**Arquivo**: `<sep-mobile-root>/.github/workflows/ci.yml`

**Comportamento esperado**:
- Se o CI ja roda `npm run e2e`, apenas confirmar.
- Se ainda nao roda, adicionar job ou step E2E apos build/test, respeitando o padrao do repo.
- O E2E contra backend real so deve ser ativado se o workflow tambem subir backend ou apontar para backend disponivel. Se isso ainda nao existir, registrar como pendencia operacional e manter E2E local como requisito desta sprint.

**Regra**:
- Nao introduzir dependencia remota instavel no CI sem backend controlado.
- Se o CI nao puder rodar E2E real agora, documentar no PR que `npm run e2e` e validacao local obrigatoria ate a pipeline cross-repo existir.

### Definicao de pronto da Task M-4.7
- [ ] Fixture de usuario unico existe
- [ ] Golden path mobile cobre cadastro, login, perfil, alterar senha, logout e relogin
- [ ] E2E roda em PWA/Chromium mobile
- [ ] Screenshots/traces de falha continuam configurados
- [ ] Limitacao de CI E2E real esta resolvida ou explicitamente documentada

### Commit Task M-4.7
Mensagem sugerida:
```text
test(mobile): cobrir golden path autenticado
```

---

## Task M-4.8 - Validacao final da M-Sprint 4

**Objetivo**: validar a sprint inteira localmente e fechar a Fundacao Mobile.

**Pre-requisito**: Tasks M-4.1 a M-4.7 concluidas.

**Esforco**: 1-2 horas.

### Step 204.8.1 - Rodar suite local completa

**Comando**:
```bash
cd <sep-mobile-root>
npm run lint
npm run lint:scss
npm run test
npm run build
npm run e2e
```

**Verificacao**:
- Todos os comandos passam.
- Warnings de budget SCSS podem ser registrados se ja existentes, mas erro bloqueia a sprint.

### Step 204.8.2 - Validar fluxo manual PWA com backend real

**Pre-requisito**:
- `sep-api` rodando em `http://localhost:8080`.

**Comando**:
```bash
cd <sep-mobile-root>
npm run start -- --host=127.0.0.1 --port=8100
```

**Roteiro manual**:
1. Abrir `http://127.0.0.1:8100`.
2. Cadastrar usuario `CLIENTE`.
3. Fazer login.
4. Confirmar `/app/inicio` com casca tomador.
5. Abrir `/app/perfil`.
6. Abrir `/app/perfil/alterar-senha`.
7. Alterar senha.
8. Fazer logout.
9. Relogar com a nova senha.
10. Confirmar que a sessao continua funcionando apos reload.

**Verificacao**:
- DevTools Network mostra `POST /usuarios`, `POST /auth/login`, `GET /auth/me` e `PATCH /usuarios/{id}/senha`.
- Chamadas protegidas possuem `Authorization: Bearer <token>`.
- CORS nao bloqueia `localhost:8100`.

### Step 204.8.3 - Validar PWA em device fisico

**Comando**:
```bash
cd <sep-mobile-root>
npm run start -- --host=0.0.0.0 --port=8100
```

**Roteiro manual**:
1. Descobrir o IP local da maquina.
2. Abrir `http://<ip-local>:8100` no celular na mesma rede.
3. Repetir login, perfil e alterar senha.
4. Confirmar que touch targets e quebras de texto funcionam em tela real.

**Regra**:
- Esta validacao e PWA/browser. Nao adicionar Android/iOS nativo nesta sprint.

### Step 204.8.4 - Checar arquivos novos e untracked

**Comando**:
```bash
cd <sep-mobile-root>
git status --short
git ls-files --others --exclude-standard
```

**Verificacao**:
- Arquivos novos esperados aparecem.
- Nenhum artefato de build, coverage, screenshots, traces ou `.env` deve entrar em commit.
- Usar `git add <paths-especificos>`, nao `git add -A`.

### Definicao de pronto da Task M-4.8
- [ ] Lint, lint:scss, test, build e e2e passam localmente
- [ ] Fluxo manual PWA validado com backend real
- [ ] Device fisico validado via `--host=0.0.0.0`
- [ ] Untracked revisados antes do commit
- [ ] Pendencias de CI E2E real documentadas, se existirem

### Commit Task M-4.8
Pode nao gerar commit proprio se apenas validar. Se houver ajustes finais:
```text
chore(mobile): finalizar fundacao autenticada
```

---

## Definicao de pronto da M-Sprint 4

- [ ] Tela "Meu Perfil" consumindo estado real de `/auth/me`
- [ ] Tela "Alterar Senha" funcional contra `PATCH /api/v1/usuarios/{id}/senha`
- [ ] Casca de inicio do tomador navegavel em `/app/inicio`
- [ ] Casca de inicio da empresa credora criada em rota isolada
- [ ] Tabs continuam coerentes com roles atuais
- [ ] Smoke E2E Playwright PWA passando contra backend local
- [ ] Logout limpa Preferences e redireciona para `/welcome`
- [ ] Relogin com senha alterada funciona
- [ ] `npm run lint`, `npm run lint:scss`, `npm run test`, `npm run build` e `npm run e2e` verdes
- [ ] Validacao manual em device fisico feita via `--host=0.0.0.0`

## Definicao de pronto da trilha Mobile Foundation

- [ ] Projeto Ionic + Angular + Capacitor rodando com tooling completo
- [ ] Tokens Notion mobile-adaptados em SCSS e componentes Ionic customizados
- [ ] Showcase em `/design-system`
- [ ] Telas publicas: splash, boas-vindas, login e cadastro
- [ ] Auth real com token em Capacitor Preferences
- [ ] Shell mobile com tabs inferiores, guards e interceptors
- [ ] Telas autenticadas iniciais: perfil, alterar senha, inicio tomador e casca credora
- [ ] Vitest e Playwright PWA passando
- [ ] Mobile MVP demonstravel para stakeholders em PWA

## Impacto nas fases seguintes

- Epic 14 Fase Mobile 2 pode substituir a casca do tomador por dashboard funcional, onboarding, solicitacao e acompanhamento de proposta.
- Epic 14 Fase Mobile 3 pode substituir a casca da credora por oportunidades, operacoes financiadas e carteira.
- Build Android/iOS via Capacitor deve entrar em fase posterior, depois da validacao PWA.

## Referencias

- [Spec 204 - M-Sprint 4](../../specs/fase-1/204-msprint-4-telas-autenticadas-mobile.md)
- [Spec 203 - M-Sprint 3](../../specs/fase-1/203-msprint-3-shell-mobile-auth.md)
- [Spec 003 - Sprint 3 backend](../../specs/fase-1/003-sprint-3-seguranca-autenticacao.md)
- [Spec 004 - Sprint 4 backend](../../specs/fase-1/004-sprint-4-erros-docs-testes.md)
- [Spec 104 - F-Sprint 4 web](../../specs/fase-1/104-fsprint-4-telas-autenticadas.md)
- [PRD - API SEP](../../docs-sep/PRD.md)
- [DESIGN-notion.md](../../docs-sep/DESIGN-notion.md)
- [MOBILE-SCREENS-PLAN.md](../../docs-sep/MOBILE-SCREENS-PLAN.md)
