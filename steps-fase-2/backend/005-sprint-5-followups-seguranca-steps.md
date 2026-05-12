# Steps - Sprint 5 Follow-ups de Seguranca

**Origem**: code review da Sprint 5 em 2026-05-12.

**Spec relacionada**: [`specs/fase-2/005-sprint-5-endurecimento-seguranca.md`](../../specs/fase-2/005-sprint-5-endurecimento-seguranca.md)

**Status**: a implementar.

**Objetivo geral**: fechar lacunas de seguranca e integracao que ficaram como pendencia da Sprint 5 antes de iniciar ou liberar fluxos sensiveis das Sprints 6+. Este follow-up nao cria nova capacidade de produto; ele completa o contrato de endurecimento de autenticacao, sessao, cadastro canalizado, reset obrigatorio de senha, step-up e refresh token.

**Repos de destino**:
- `sep-api`: backend Spring Boot, owner principal.
- `sep-app`: frontend web Angular.
- `sep-mobile`: mobile Ionic/Angular.
- `docs-SEP`: documentacao, somente se os contratos mudarem.

**Branches sugeridas**:
- `sep-api`: `feature/fix-sprint-5-seguranca`
- `sep-app`: `feature/fix-fsprint-5-seguranca`
- `sep-mobile`: `feature/fix-msprint-5-seguranca`

**Prioridade**:
1. Bloquear criacao publica de `ADMIN`.
2. Corrigir refresh token web para cookie httpOnly ou, no minimo, nao persistir refresh em `localStorage` em producao.
3. Corrigir CORS para `X-Step-Up-Token`.
4. Enforcar `precisaRedefinirSenha` no backend.
5. Completar step-up no mobile via fallback TOTP.
6. Tornar refresh token rotativo seguro contra concorrencia.

---

## Plano Executivo

### Problemas a corrigir

| ID | Risco | Repo principal | Problema |
|----|-------|----------------|----------|
| F5-FIX-01 | Critico | `sep-api` | `POST /api/v1/usuarios` ainda permite criar `ADMIN` sem autenticacao. |
| F5-FIX-02 | Alto | `sep-api` + `sep-app` | Refresh token web fica em `localStorage`; spec pede cookie httpOnly. |
| F5-FIX-03 | Alto | `sep-api` | CORS nao permite `X-Step-Up-Token`, quebrando step-up no browser. |
| F5-FIX-04 | Alto | `sep-api` + clientes | `precisaRedefinirSenha` depende de redirect client-side; backend ainda emite sessao completa. |
| F5-FIX-05 | Medio | `sep-mobile` + `sep-api` | Mobile nao tem fluxo de step-up/fallback TOTP para alterar senha com MFA ativo. |
| F5-FIX-06 | Medio | `sep-api` | Rotacao de refresh token nao possui protecao contra refresh concorrente. |

### Ordem de execucao recomendada

```text
5F.0 prechecks
 |
 v
5F.1 bloquear criacao publica de ADMIN
 |
 +--> 5F.2 cookie httpOnly / storage seguro do refresh web
 +--> 5F.3 CORS para X-Step-Up-Token
 +--> 5F.4 reset obrigatorio server-side
 +--> 5F.6 refresh token concurrency-safe
        |
        v
5F.5 step-up mobile com fallback TOTP
 |
 v
5F.7 testes integrados e documentacao
```

### Criterio de pronto do follow-up

- `POST /api/v1/usuarios` publico nao cria `ADMIN`.
- Criacao/promocao de usuario interno ocorre apenas por endpoint autenticado de `ADMIN`, ou fica explicitamente fora deste follow-up com cadastro admin manual documentado.
- Web nao persiste refresh token em `localStorage` em ambiente de producao.
- `X-Step-Up-Token` passa no preflight CORS.
- Usuario com `precisaRedefinirSenha=true` nao acessa recursos protegidos comuns antes de alterar a senha.
- Mobile consegue alterar senha quando MFA esta ativo, executando step-up TOTP antes do PATCH.
- Duas chamadas concorrentes usando o mesmo refresh token nao emitem dois refresh tokens validos.
- Suites locais relevantes passam nos tres repos.

---

## Task 5F.0 - Prechecks

**Objetivo**: confirmar baseline dos tres repos antes dos fixes.

### Step 5F.0.1 - Conferir branches e working tree

```bash
cd <sep-api-root>
git status --short --branch

cd <sep-app-root>
git status --short --branch

cd <sep-mobile-root>
git status --short --branch
```

**Verificacao**:
- Repos em `develop` atualizada antes de criar branches.
- Working tree sem alteracoes nao relacionadas.

### Step 5F.0.2 - Rodar baseline

```bash
cd <sep-api-root>
./gradlew test

cd <sep-app-root>
npm run lint
npm run lint:scss
npm run test
npm run build

cd <sep-mobile-root>
npm run lint
npm run lint:scss
npm run test
npm run build
```

**Verificacao**:
- Registrar qualquer falha herdada antes de alterar codigo.

---

## Task 5F.1 - Bloquear criacao publica de ADMIN

**Repo**: `sep-api`

**Objetivo**: remover a possibilidade de usuario anonimo criar `ADMIN` via `POST /api/v1/usuarios`.

### Step 5F.1.1 - Definir regra de criacao publica

Regra recomendada:
- `POST /api/v1/usuarios` publico cria apenas `CLIENTE`.
- Se o payload vier com `role=ADMIN`, retornar `403 Forbidden` ou `400 Bad Request` com mensagem clara.
- Preferencia tecnica: criar DTO publico sem campo `role` para novos clientes e manter compatibilidade temporaria apenas se necessario.

Arquivos provaveis:
- `usuarios/web/dto/UsuarioCreateDto.java`
- `usuarios/application/usecase/CriarUsuarioUseCase.java`
- `usuarios/web/controller/UsuarioController.java`
- `shared/exception/ApiExceptionHandler.java`, se precisar mapear excecao nova.

### Step 5F.1.2 - Criar caminho autenticado para usuario interno

Opcao recomendada:
- Criar endpoint autenticado para `ADMIN`, por exemplo `POST /api/v1/admin/usuarios` ou `POST /api/v1/usuarios/internos`.
- Permitir criacao de `ADMIN` somente nesse endpoint.
- Proteger com `@PreAuthorize("hasRole('ADMIN')")`.
- Auditar criacao de usuario interno em `audit_log_seguranca`, se houver evento adequado; se nao houver, registrar follow-up para `ROLE_ALTERADO`/`USUARIO_INTERNO_CRIADO`.

Se o projeto ainda nao precisa criar novos admins via API:
- Remover a criacao publica de `ADMIN`.
- Documentar que admin inicial fica via seed/migration/dev manual ate Sprint 8, quando promocao de roles entra no spec.

### Step 5F.1.3 - Testes

Adicionar/ajustar:
- `UsuarioControllerTest`: anonimo cria `CLIENTE` com sucesso.
- `UsuarioControllerTest`: anonimo tenta criar `ADMIN` e recebe erro.
- `CriarUsuarioUseCaseTest`: regra de role publica.
- Se houver endpoint interno: teste `ADMIN` cria `ADMIN`; `CLIENTE`/anonimo nao cria.

**Definicao de pronto**:
- Exploit `POST /api/v1/usuarios {"role":"ADMIN"}` nao funciona anonimamente.

---

## Task 5F.2 - Corrigir refresh token web

**Repos**: `sep-api`, `sep-app`

**Objetivo**: alinhar o refresh token web ao spec da Sprint 5: cookie httpOnly, SameSite strict e secure em ambiente remoto/producao.

### Step 5F.2.1 - Backend emitir refresh token via cookie para canal web

Opcoes:
- Curto prazo: `AuthController` define cookie `Set-Cookie` em login, TOTP verify e refresh, mantendo body para mobile/dev-local.
- Medio prazo: introduzir canal explicito (`WEB`, `MOBILE`) no request/claim, conforme ADR 0009, para decidir se refresh vai em cookie ou body.

Regras do cookie web:
- `HttpOnly`
- `Secure` em ambiente remoto/producao
- `SameSite=Strict` ou `Lax` se Strict quebrar fluxo local controlado
- `Path=/api/v1/auth`
- Expiracao alinhada a `app.jwt.refresh-expiration-seconds`

Arquivos provaveis:
- `identity/web/controller/AuthController.java`
- `identity/web/controller/MfaController.java`
- `identity/application/usecase/RefreshTokenUseCase.java`
- `identity/application/usecase/VerificarTotpUseCase.java`
- DTOs de auth, se o contrato separar resposta web/mobile.
- `application.yml` para propriedades do cookie.

### Step 5F.2.2 - Web parar de persistir refresh em localStorage

Arquivos provaveis:
- `src/app/core/auth/auth.service.ts`
- `src/app/core/api/api.models.ts`
- testes de `AuthService`

Regras:
- `ACCESS_TOKEN` pode continuar em memoria/localStorage por enquanto, conforme decisao do projeto.
- `REFRESH_TOKEN` nao deve ir para `localStorage` em producao.
- `refresh()` web deve chamar `/auth/refresh` com `withCredentials` quando cookie for adotado.
- `logout()` web deve chamar `/auth/logout` com cookie, ou aceitar fallback dev-local se contrato ainda estiver em transicao.

### Step 5F.2.3 - CORS com credenciais

Confirmar:
- `app.cors.allow-credentials=true`.
- `allowed-origins` sem wildcard em ambientes com cookie.
- Angular usa `withCredentials: true` nos endpoints que dependem do cookie.

### Step 5F.2.4 - Testes

Backend:
- Login web envia `Set-Cookie`.
- Refresh com cookie retorna novo access e renova cookie.
- Logout expira/revoga cookie.
- Mobile ainda consegue receber refresh token pelo contrato mobile, se aplicavel.

Web:
- `AuthService` nao grava `SEP_REFRESH_TOKEN` no `localStorage`.
- `refresh()` usa credenciais/cookie.
- `logout()` limpa estado local e chama backend.

**Definicao de pronto**:
- Busca por `SEP_REFRESH_TOKEN` no web nao encontra persistencia em `localStorage` para producao.

---

## Task 5F.3 - Corrigir CORS para step-up

**Repo**: `sep-api`

**Objetivo**: permitir que o web envie `X-Step-Up-Token` em chamadas cross-origin.

### Step 5F.3.1 - Atualizar allowed headers

Arquivo:
- `src/main/resources/application.yml`

Adicionar:
- `X-Step-Up-Token`

Valor esperado:
```yaml
app:
  cors:
    allowed-headers: Authorization,Content-Type,Idempotency-Key,X-Correlation-Id,X-Step-Up-Token
```

### Step 5F.3.2 - Testar preflight

Adicionar teste de CORS ou smoke com `OPTIONS`:

```bash
curl -i -X OPTIONS http://localhost:8080/api/v1/usuarios/<id>/senha \
  -H "Origin: http://localhost:4200" \
  -H "Access-Control-Request-Method: PATCH" \
  -H "Access-Control-Request-Headers: authorization,content-type,x-step-up-token"
```

**Verificacao**:
- Resposta contem `Access-Control-Allow-Headers` incluindo `X-Step-Up-Token`.

### Step 5F.3.3 - Testes

Adicionar teste em backend:
- `CorsConfigTest` ou teste em `SecurityConfig` cobrindo preflight com `X-Step-Up-Token`.

**Definicao de pronto**:
- Alterar senha com step-up no Angular nao falha no preflight.

---

## Task 5F.4 - Enforcar reset obrigatorio server-side

**Repo**: `sep-api`

**Objetivo**: impedir que usuario com `precisaRedefinirSenha=true` use a API normalmente ignorando o redirect do frontend.

### Step 5F.4.1 - Definir comportamento de login

Regra recomendada:
- Login com senha valida e `precisaRedefinirSenha=true` pode emitir token limitado apenas para alterar senha, ou emitir resposta especifica sem sessao completa.
- Nao permitir acesso amplo com token normal antes da troca de senha.

Opcoes:
1. **Token limitado**: JWT com claim `password_reset_required=true`; filtro/guard backend permite apenas `/auth/me` e `PATCH /usuarios/{id}/senha`.
2. **Resposta sem token**: login retorna `passwordResetRequired=true` + `resetChallengeId`; endpoint proprio troca senha usando challenge.

Preferencia pragmatica:
- Token limitado com claim, por ser menor mudanca no contrato atual.

### Step 5F.4.2 - Backend bloquear rotas comuns

Arquivos provaveis:
- `JwtTokenProvider.java` para claim.
- `UsuarioAutenticado.java` para expor flag, se necessario.
- Novo filter/aspect/interceptor de seguranca para negar rotas comuns quando reset obrigatorio estiver ativo.
- `AlterarSenhaUseCase.java` para limpar flag apos sucesso, ja parcialmente feito pela entidade.

Regras:
- `PATCH /api/v1/usuarios/{id}/senha` permitido ao proprio usuario.
- `GET /api/v1/auth/me` permitido para renderizar UI.
- Outros endpoints autenticados retornam `403` ou `423` com codigo de erro claro, por exemplo `AUTH-403-PASSWORD_RESET_REQUIRED`.

### Step 5F.4.3 - Clientes respeitarem novo contrato

Web:
- Se login retorna reset obrigatorio, redirecionar para alterar senha.
- Se qualquer rota retorna erro de reset obrigatorio, redirecionar para alterar senha.

Mobile:
- Mesmo comportamento, rota `/app/perfil/alterar-senha?forced=true`.

### Step 5F.4.4 - Testes

Backend:
- Usuario com flag `true` faz login e nao acessa recurso comum.
- Usuario com flag `true` altera propria senha e flag vira `false`.
- Depois da troca, login/acesso normal funciona.

Web/mobile:
- Redirect de login continua funcionando.
- Erro server-side de reset obrigatorio redireciona para tela correta.

**Definicao de pronto**:
- Cliente malicioso nao consegue ignorar `precisaRedefinirSenha`.

---

## Task 5F.5 - Completar step-up mobile com fallback TOTP

**Repos**: `sep-mobile`, possivelmente `sep-api`

**Objetivo**: permitir que o mobile execute operacoes sensiveis com MFA ativo, inicialmente via fallback TOTP. Biometria nativa real pode continuar para fase Android/iOS, mas o fluxo funcional nao deve ficar quebrado.

### Step 5F.5.1 - Adicionar store/interceptor de step-up no mobile

Arquivos esperados:
- `src/app/core/auth/step-up-token.store.ts`
- `src/app/core/interceptors/step-up.interceptor.ts`
- `src/app/app.config.ts`

Comportamento:
- Store guarda step-up token em memoria, uso unico.
- Interceptor anexa `X-Step-Up-Token` apenas em rotas sensiveis:
  - `PATCH /usuarios/{id}/senha`
  - futuras rotas sensiveis quando entrarem.

### Step 5F.5.2 - Criar service e tela de step-up mobile

Arquivos esperados:
- `src/app/core/auth/step-up.service.ts`
- `src/app/features/authenticated/step-up/step-up.component.ts`
- rota `/app/step-up?next=...`

Fluxo:
1. Chama `POST /auth/step-up/initiate`.
2. Usuario informa codigo TOTP.
3. Chama `POST /auth/step-up/complete`.
4. Armazena step-up token em memoria.
5. Navega para `next` e reexecuta operacao ou retorna para a tela original.

### Step 5F.5.3 - Integrar alterar senha mobile

Arquivo:
- `features/authenticated/profile/change-password/change-password.component.ts`

Comportamento:
- Se backend retorna `403` por step-up ausente e usuario tem `mfaHabilitado=true`, navegar para `/app/step-up?next=/app/perfil/alterar-senha`.
- Alternativa melhor: iniciar step-up antes do submit quando `currentUser().mfaHabilitado=true`.

### Step 5F.5.4 - Biometria

Manter documentado:
- Plugin nativo `@capacitor-community/biometric-auth` continua fase Android/iOS.
- Para PWA/dev-local, fallback TOTP e o fluxo obrigatorio.

### Step 5F.5.5 - Testes

Mobile:
- `StepUpService` inicia/completa challenge.
- `stepUpInterceptor` anexa e consome token.
- Change password com MFA ativo redireciona para step-up ou usa token antes do PATCH.
- E2E PWA cobre alterar senha com MFA/step-up, quando backend estiver rodando.

**Definicao de pronto**:
- Usuario mobile com MFA ativo consegue alterar senha sem depender de plugin nativo.

---

## Task 5F.6 - Tornar refresh token concurrency-safe

**Repo**: `sep-api`

**Objetivo**: impedir que duas chamadas simultaneas com o mesmo refresh token gerem dois tokens validos.

### Step 5F.6.1 - Escolher estrategia de lock

Opcoes:
1. **Pessimistic lock**: `findByTokenHashForUpdate` com `@Lock(PESSIMISTIC_WRITE)`.
2. **Optimistic lock**: adicionar `@Version` em `RefreshToken`.
3. **Update condicional**: executar `UPDATE refresh_token SET status='USADO' WHERE token_hash=:hash AND status='ATIVO'` e validar `rows=1`.

Preferencia pragmatica:
- Update condicional ou lock pessimista. Evita dupla emissao e e facil testar.

### Step 5F.6.2 - Ajustar repository/use case

Arquivos provaveis:
- `RefreshTokenRepository.java`
- `RefreshTokenUseCase.java`
- `RefreshToken.java`, se usar `@Version`.

Regra:
- Apenas uma transacao consegue trocar `ATIVO -> USADO`.
- A segunda chamada deve cair como reuse/invalidacao da familia, ou receber 401 sem emitir novo token.

### Step 5F.6.3 - Teste concorrente

Adicionar teste:
- Criar refresh token valido.
- Disparar duas chamadas concorrentes para `RefreshTokenUseCase.executar(token)`.
- Verificar que apenas uma retorna sucesso.
- Verificar que nao existem dois novos refresh tokens ativos na mesma familia.

**Definicao de pronto**:
- Teste concorrente falha no estado atual e passa com a correcao.

---

## Task 5F.7 - Validacao final e documentacao

**Repos**: `sep-api`, `sep-app`, `sep-mobile`, `docs-SEP`

### Step 5F.7.1 - Rodar suites locais

Backend:
```bash
cd <sep-api-root>
./gradlew clean test
./gradlew check
```

Web:
```bash
cd <sep-app-root>
npm run lint
npm run lint:scss
npm run test
npm run build
```

Mobile:
```bash
cd <sep-mobile-root>
npm run lint
npm run lint:scss
npm run test
npm run build
```

### Step 5F.7.2 - Smoke manual cross-stack

Cenarios minimos:
- Criacao publica de `CLIENTE` funciona.
- Criacao publica de `ADMIN` falha.
- Login web com MFA ativo -> verify TOTP -> refresh -> logout.
- Alterar senha web com step-up.
- Login mobile com MFA ativo -> verify TOTP -> alterar senha com step-up fallback.
- Usuario com `precisaRedefinirSenha=true` nao acessa recurso comum antes da troca.
- Duplo refresh simultaneo nao emite dois tokens.

### Step 5F.7.3 - Atualizar documentacao

Atualizar se o contrato mudar:
- `docs-sep/SEGURANCA.md`
- spec/steps da Sprint 5, se algum comportamento documentado precisar ser corrigido.
- PRD somente se houver mudanca de produto, nao para bugfix tecnico.

### Step 5F.7.4 - Descricao de PR

Gerar descricao por repo com:
- Titulo sugerido.
- Resumo.
- Escopo tecnico.
- Como validar.
- Riscos.
- Referencia a este arquivo.

**Definicao de pronto**:
- Todos os criterios do follow-up atendidos e documentados.

---

## Checklist Final

- [ ] `POST /api/v1/usuarios` anonimo nao cria `ADMIN`.
- [ ] Caminho de criacao/promocao de usuario interno esta protegido ou explicitamente documentado como manual.
- [ ] Web nao guarda refresh token em `localStorage` para producao.
- [ ] Cookie de refresh web usa `HttpOnly`, `Secure` em remoto/producao e `SameSite`.
- [ ] CORS aceita `X-Step-Up-Token`.
- [ ] `precisaRedefinirSenha=true` e enforced pelo backend.
- [ ] Mobile tem step-up TOTP funcional para alterar senha.
- [ ] Refresh token rotativo e seguro contra concorrencia.
- [ ] Testes backend passam.
- [ ] Testes web passam.
- [ ] Testes mobile passam.
- [ ] `docs-sep/SEGURANCA.md` atualizado se necessario.
