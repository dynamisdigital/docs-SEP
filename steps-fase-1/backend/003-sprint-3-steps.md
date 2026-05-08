# Steps - Sprint 3 - Seguranca e Autenticacao JWT

**Spec de origem**: [`specs/fase-1/003-sprint-3-seguranca-autenticacao.md`](../../specs/fase-1/003-sprint-3-seguranca-autenticacao.md)

**Objetivo geral**: entregar autenticacao JWT completa no backend SEP: login publico, emissao e validacao de token, filtro de autenticacao, `/api/v1/auth/me`, autorizacao por perfil e ownership nos endpoints de usuario, alteracao da propria senha e auditoria com UUID do usuario autenticado.

**Esforco total estimado**: 3-4 dias de Dev Senior dedicado. A Task 3.2 pode iniciar parcialmente em paralelo apos os DTOs e o principal autenticado da Task 3.1 estarem definidos, mas a verificacao final depende do filtro JWT e do `SecurityFilterChain`.

**Workspace root**: `<sep-api-root>/`.

## Erratum: path do SecurityConfig

A spec 003 cita `shared/config/SecurityConfig.java` em alguns trechos. O codigo real da API mantem a configuracao em:

`<sep-api-root>/src/main/java/com/dynamis/sep_api/identity/infrastructure/config/SecurityConfig.java`

Todos os steps abaixo usam esse path real. Nao mover a classe nesta sprint.

## Ordem de execucao recomendada

```
Task 3.1a (principal + DTOs + UserDetailsService + JwtTokenProvider)
   |
   v
Task 3.1b (JwtAuthenticationFilter + SecurityConfig + login + /auth/me)
   |
   +---> Task 3.2 (GET usuarios + role/ownership)
           |
           v
       Task 3.3 (PATCH senha propria)
```

- Task 3.1a e raiz tecnica.
- Task 3.1b fecha autenticacao real.
- Task 3.2 depende do principal autenticado e de method security.
- Task 3.3 depende de ownership e de auditoria autenticada.

## Como usar este arquivo

1. Leia a Task inteira antes de codificar.
2. Execute os steps na ordem.
3. Rode a verificacao indicada ao final de cada bloco.
4. Se um snippet divergir do codigo real, preserve o comportamento descrito e siga o padrao local.
5. No repo `sep-api`, o agente pode criar branch e commitar. No repo `docs-SEP`, nao comitar.

## Pre-requisitos globais

- Sprint 2 concluida no `sep-api`.
- `Usuario`, `Role`, `UsuarioRepository`, `UsuarioMapper`, DTOs e `POST /api/v1/usuarios` funcionando.
- `PasswordEncoder` ja exposto em `SecurityConfig`.
- `ConflitoException` ja `non-sealed`.
- `springdocVersion` atualizado para linha compativel com Spring Boot 3.5.x (ex.: `2.8.13`) para evitar 500 em `/v3/api-docs`.
- Postgres local via Docker Compose disponivel para testes de contexto (`docker compose up -d postgres`).
- Branch de trabalho sugerida:
  ```bash
  cd <sep-api-root>
  git checkout develop
  git pull --ff-only
  git checkout -b feature/sprint-3-seguranca-autenticacao
  ```

---

## Task 3.1a - Principal autenticado, DTOs, UserDetailsService e JWT provider

**Objetivo**: criar a base de identidade usada pelo filtro JWT, pelo login e pela auditoria.

### Step 3.1a.1 - Criar principal `UsuarioAutenticado`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/identity/infrastructure/security/UsuarioAutenticado.java`

**Conteudo esperado**:

- `record UsuarioAutenticado(UUID id, String username, Role role) implements UserDetails`
- `getAuthorities()` deve retornar `ROLE_` + `role.name()`.
- `getPassword()` deve retornar `null` para principals vindos de JWT.
- `getUsername()` deve retornar o e-mail.
- `isAccountNonExpired`, `isAccountNonLocked`, `isCredentialsNonExpired`, `isEnabled` retornam `true`.

**Decisao**: usar `Authentication.getName()` como UUID canonico do usuario autenticado. Para isso, o `UsernamePasswordAuthenticationToken` criado pelo filtro deve usar `UsuarioAutenticado` como principal e o `AuditorAwareImpl` deve detectar esse tipo.

### Step 3.1a.2 - Criar DTOs de autenticacao

**Arquivos**:

- `<sep-api-root>/src/main/java/com/dynamis/sep_api/identity/web/dto/LoginRequestDto.java`
- `<sep-api-root>/src/main/java/com/dynamis/sep_api/identity/web/dto/TokenResponseDto.java`

**Contratos**:

```java
public record LoginRequestDto(
    @NotBlank @Email String username,
    @NotBlank String password
) {}
```

```java
public record TokenResponseDto(
    String accessToken,
    String tokenType,
    long expiresIn,
    UsuarioResponseDto usuario
) {}
```

**Regra**: `tokenType` deve ser sempre `"Bearer"`.

### Step 3.1a.3 - Criar `CustomUserDetailsService`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/identity/infrastructure/security/CustomUserDetailsService.java`

**Comportamento**:

- Implementa `UserDetailsService`.
- Injeta `UsuarioRepository`.
- Busca usuario por `username`.
- Se nao encontrar, lanca `UsernameNotFoundException`.
- Retorna `org.springframework.security.core.userdetails.User` com:
  - username = `usuario.getUsername()`
  - password = `usuario.getPassword()`
  - authorities = `ROLE_` + `usuario.getRole().name()`

**Verificacao**:

```bash
./gradlew compileJava
```

### Step 3.1a.4 - Criar `JwtTokenProvider`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/identity/infrastructure/security/JwtTokenProvider.java`

**Responsabilidades**:

- Ler `app.jwt.secret` e `app.jwt.expiration-seconds`.
- Secret deve ser interpretado como Base64 quando possivel.
- Se o valor nao for Base64 valido, usar bytes UTF-8 apenas para compatibilidade com o placeholder dev.
- Validar minimo de 256 bits antes de criar `SecretKey`.
- Emitir token HS256 com JJWT 0.12.x.
- Claims obrigatorias:
  - `sub`: UUID do usuario em string canonica
  - `email`: username/e-mail
  - `roles`: lista com `ROLE_ADMIN` ou `ROLE_CLIENTE`
  - `iat`
  - `exp`
- Expor metodos:
  - `String gerarToken(Usuario usuario)`
  - `boolean tokenValido(String token)`
  - `UsuarioAutenticado extrairPrincipal(String token)`
  - `long getExpirationSeconds()`

**Detalhe JJWT 0.12.x**:

Use `Jwts.builder()` para emissao e `Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token)` para parse.

**Falhas esperadas**:

- Token expirado, malformado ou com assinatura invalida deve resultar em `tokenValido(...) == false`.
- `extrairPrincipal(...)` pode lancar excecao JJWT; o filtro deve capturar e responder sem autenticar.

### Step 3.1a.5 - Criar `JwtTokenProviderTest`

**Arquivo**: `<sep-api-root>/src/test/java/com/dynamis/sep_api/identity/infrastructure/security/JwtTokenProviderTest.java`

**Cenarios minimos**:

1. Gera token valido com claims `sub`, `email`, `roles`, `iat`, `exp`.
2. Extrai `UsuarioAutenticado` com `id`, `username` e `role`.
3. Rejeita token expirado.
4. Rejeita token assinado com outro secret.

**Observacao**: instanciar o provider diretamente no teste com secret Base64 fixo de 32 bytes. Nao subir Spring context.

**Verificacao**:

```bash
./gradlew test --tests "*JwtTokenProviderTest"
```

---

## Task 3.1b - Filtro JWT, SecurityConfig, login e `/auth/me`

**Objetivo**: plugar autenticacao no Spring Security e expor os endpoints de auth.

### Step 3.1b.1 - Criar `JwtAuthenticationFilter`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/identity/infrastructure/security/JwtAuthenticationFilter.java`

**Comportamento**:

- Extende `OncePerRequestFilter`.
- Le `Authorization`.
- Se ausente ou sem prefixo `Bearer `, apenas continua a chain.
- Se token valido:
  - extrai `UsuarioAutenticado`
  - cria `UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities())`
  - seta details com `WebAuthenticationDetailsSource`
  - popula `SecurityContextHolder`
- Se token invalido:
  - limpa `SecurityContextHolder`
  - responde `401 Unauthorized`
  - nao chama a chain.

**Regra**: nao logar token completo.

### Step 3.1b.2 - Atualizar `SecurityConfig`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/identity/infrastructure/config/SecurityConfig.java`

**Mudancas**:

- Injetar `JwtAuthenticationFilter`.
- Adicionar `@EnableMethodSecurity(prePostEnabled = true)`.
- Manter stateless e CSRF desabilitado.
- Manter docs e actuator liberados em dev/fundacao.
- Liberar:
  - `POST /api/v1/usuarios`
  - `POST /api/v1/auth/login`
- Proteger qualquer outra rota.
- Registrar filtro:

```java
.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
```

**Nao remover** o bean `PasswordEncoder`.

### Step 3.1b.3 - Atualizar `AuditorAwareImpl`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/shared/audit/AuditorAwareImpl.java`

**Comportamento novo**:

- Se nao houver autenticacao real: retornar `system`.
- Se principal for `UsuarioAutenticado`: retornar `principal.id().toString()`.
- Caso contrario: retornar `auth.getName()` se nao estiver em branco.

**Aceite**: operacoes publicas continuam gravando `system`; operacoes autenticadas gravam UUID.

### Step 3.1b.4 - Criar `AutenticarUsuarioUseCase`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/identity/application/usecase/AutenticarUsuarioUseCase.java`

**Comportamento**:

- Injeta `UsuarioRepository`, `PasswordEncoder`, `JwtTokenProvider`, `UsuarioMapper`.
- Busca usuario por `dto.username()`.
- Se usuario nao existir ou senha nao bater: lancar `BadCredentialsException`.
- Emite token.
- Retorna `TokenResponseDto(token, "Bearer", expirationSeconds, mapper.toResponse(usuario))`.

**Decisao de erro**: nesta sprint usar `BadCredentialsException`; Sprint 4 padroniza payloads finais.

### Step 3.1b.5 - Criar `AuthController`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/identity/web/controller/AuthController.java`

**Endpoints**:

- `POST /api/v1/auth/login`
  - publico
  - request `@Valid LoginRequestDto`
  - response `200 OK TokenResponseDto`
- `GET /api/v1/auth/me`
  - autenticado
  - usa `@AuthenticationPrincipal UsuarioAutenticado principal`
  - busca usuario atual por id via repository/use case
  - response `200 OK UsuarioResponseDto`

**Preferencia**: para `/me`, criar um metodo privado ou use case simples na Task 3.2 se `ConsultarUsuarioUseCase` ainda nao existir. Ao final da sprint, evitar duplicacao usando `ConsultarUsuarioUseCase`.

### Step 3.1b.6 - Criar testes de login e filtro

**Arquivos**:

- `<sep-api-root>/src/test/java/com/dynamis/sep_api/identity/application/usecase/AutenticarUsuarioUseCaseTest.java`
- `<sep-api-root>/src/test/java/com/dynamis/sep_api/identity/infrastructure/security/JwtAuthenticationFilterTest.java`
- `<sep-api-root>/src/test/java/com/dynamis/sep_api/identity/web/controller/AuthControllerTest.java`

**Cenarios obrigatorios**:

- Login valido retorna token Bearer e usuario sem password.
- Senha invalida lanca `BadCredentialsException`.
- Usuario inexistente lanca `BadCredentialsException`.
- Filtro popula `SecurityContext` com token valido.
- Filtro retorna `401` para token invalido.
- `/auth/me` retorna o usuario do principal.

**Verificacao**:

```bash
./gradlew test \
  --tests "*JwtTokenProviderTest" \
  --tests "*JwtAuthenticationFilterTest" \
  --tests "*AutenticarUsuarioUseCaseTest" \
  --tests "*AuthControllerTest"
```

### Definicao de pronto da Task 3.1

- [ ] JWT emitido com claims obrigatorias.
- [ ] Token valido autentica requests protegidos.
- [ ] Token invalido/expirado resulta em `401`.
- [ ] Login publico funciona.
- [ ] `/api/v1/auth/me` autenticado funciona.
- [ ] Auditoria autenticada passa a enxergar UUID.

### Commit sugerido

```bash
git add src/main/java/com/dynamis/sep_api/identity/ \
        src/main/java/com/dynamis/sep_api/shared/audit/AuditorAwareImpl.java \
        src/test/java/com/dynamis/sep_api/identity/
git commit -m "feat(backend): autenticacao JWT com login e auth me"
```

---

## Task 3.2 - Autorizacao por perfil e ownership

**Objetivo**: adicionar endpoints de consulta/listagem de usuarios protegidos por perfil e ownership.

### Step 3.2.1 - Criar excecao de usuario nao encontrado

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/usuarios/application/exception/UsuarioNaoEncontradoException.java`

**Conteudo esperado**:

- Extende `RecursoNaoEncontradoException`.
- Codigo `USR-404-001`.
- Mensagem inclui o UUID solicitado.

### Step 3.2.2 - Criar `ConsultarUsuarioUseCase`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/usuarios/application/usecase/ConsultarUsuarioUseCase.java`

**Assinatura sugerida**:

```java
@Transactional(readOnly = true)
public Usuario executar(UUID id, UsuarioAutenticado principal)
```

**Regras**:

- `ADMIN`: pode consultar qualquer id.
- `CLIENTE`: pode consultar apenas `principal.id()`.
- Violacao de ownership: lancar `AccessDeniedException`.
- Usuario inexistente: lancar `UsuarioNaoEncontradoException`.

### Step 3.2.3 - Criar `ListarUsuariosUseCase`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/usuarios/application/usecase/ListarUsuariosUseCase.java`

**Assinatura sugerida**:

```java
@Transactional(readOnly = true)
public List<Usuario> executar()
```

**Regra**: autorizacao de `ADMIN` fica no controller por `@PreAuthorize("hasRole('ADMIN')")`.

### Step 3.2.4 - Atualizar `UsuarioController`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/usuarios/web/controller/UsuarioController.java`

**Endpoints novos**:

- `GET /api/v1/usuarios/{id}`
  - `@PreAuthorize("isAuthenticated()")`
  - recebe `@AuthenticationPrincipal UsuarioAutenticado principal`
  - usa `ConsultarUsuarioUseCase`
  - retorna `UsuarioResponseDto`
- `GET /api/v1/usuarios`
  - `@PreAuthorize("hasRole('ADMIN')")`
  - usa `ListarUsuariosUseCase`
  - retorna `List<UsuarioResponseDto>`

**Manter** `POST /api/v1/usuarios` publico sem `@PreAuthorize`.

### Step 3.2.5 - Criar testes de ownership e controller

**Arquivos**:

- `<sep-api-root>/src/test/java/com/dynamis/sep_api/usuarios/application/usecase/ConsultarUsuarioUseCaseTest.java`
- `<sep-api-root>/src/test/java/com/dynamis/sep_api/usuarios/web/controller/UsuarioControllerSecurityTest.java`

**Cenarios obrigatorios**:

1. Admin consulta usuario alheio.
2. Cliente consulta proprio usuario.
3. Cliente consultando id alheio recebe `AccessDeniedException`.
4. Admin lista todos.
5. Cliente listando todos recebe `403`.
6. Request sem token em rota protegida recebe `401`.

**Verificacao**:

```bash
./gradlew test \
  --tests "*ConsultarUsuarioUseCaseTest" \
  --tests "*UsuarioControllerSecurityTest"
```

### Definicao de pronto da Task 3.2

- [ ] `GET /api/v1/usuarios/{id}` protegido por autenticacao e ownership.
- [ ] `GET /api/v1/usuarios` restrito a `ADMIN`.
- [ ] Cliente nao acessa dados de outro usuario.
- [ ] Token ausente/invalido em rotas protegidas retorna `401`.

### Commit sugerido

```bash
git add src/main/java/com/dynamis/sep_api/usuarios/ \
        src/main/java/com/dynamis/sep_api/identity/infrastructure/config/SecurityConfig.java \
        src/test/java/com/dynamis/sep_api/usuarios/
git commit -m "feat(backend): autorizacao de usuarios por perfil e ownership"
```

---

## Task 3.3 - Alteracao da propria senha

**Objetivo**: permitir que o usuario autenticado altere a propria senha com validacao da senha atual e persistencia BCrypt da nova senha.

### Step 3.3.1 - Atualizar entidade `Usuario`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/usuarios/domain/model/Usuario.java`

**Adicionar metodo**:

```java
public void alterarSenha(String novoPasswordHash) {
    this.password = novoPasswordHash;
}
```

**Regra**: o metodo recebe hash, nunca senha em texto claro.

### Step 3.3.2 - Criar `SenhaAtualIncorretaException`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/usuarios/application/exception/SenhaAtualIncorretaException.java`

**Conteudo esperado**:

- Extende `ValidacaoException`.
- Codigo `USR-400-001`.
- Mensagem: `Senha atual incorreta`.

**Observacao**: se `ValidacaoException` ainda estiver `final`, alterar para `non-sealed` como foi feito com `ConflitoException`. O switch de `ApiExceptionHandler` continua cobrindo descendentes.

### Step 3.3.3 - Criar `AlterarSenhaUseCase`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/usuarios/application/usecase/AlterarSenhaUseCase.java`

**Assinatura sugerida**:

```java
@Transactional
public void executar(UUID id, UsuarioSenhaUpdateDto dto, UsuarioAutenticado principal)
```

**Regras**:

- `principal.id()` deve ser igual ao `id` da URL.
- Se diferente, lancar `AccessDeniedException`.
- Buscar usuario por id; se nao existir, lancar `UsuarioNaoEncontradoException`.
- Validar `passwordAtual` com `passwordEncoder.matches(dto.passwordAtual(), usuario.getPassword())`.
- Se nao bater, lancar `SenhaAtualIncorretaException`.
- Gerar hash de `dto.novaSenha()`.
- Chamar `usuario.alterarSenha(hash)`.
- Persistir via dirty checking JPA.

### Step 3.3.4 - Atualizar `UsuarioController`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/usuarios/web/controller/UsuarioController.java`

**Endpoint novo**:

- `PATCH /api/v1/usuarios/{id}/senha`
  - `@PreAuthorize("isAuthenticated()")`
  - body `@Valid UsuarioSenhaUpdateDto`
  - principal `@AuthenticationPrincipal UsuarioAutenticado`
  - response `204 No Content`

### Step 3.3.5 - Criar testes de alteracao de senha

**Arquivos**:

- `<sep-api-root>/src/test/java/com/dynamis/sep_api/usuarios/application/usecase/AlterarSenhaUseCaseTest.java`
- `<sep-api-root>/src/test/java/com/dynamis/sep_api/usuarios/web/controller/UsuarioControllerSenhaTest.java`

**Cenarios obrigatorios**:

1. Usuario altera a propria senha com sucesso.
2. Usuario nao altera senha de terceiro (`AccessDeniedException` / `403`).
3. Senha atual incorreta retorna erro de validacao.
4. Nova senha persistida e hash BCrypt, nao texto claro.
5. Endpoint retorna `204 No Content`.
6. DTO invalido retorna `400`.

### Step 3.3.6 - Verificar auditoria autenticada

**Verificacao manual**:

1. Criar usuario por `POST /api/v1/usuarios`.
2. Fazer login.
3. Chamar `PATCH /api/v1/usuarios/{id}/senha` com token.
4. Consultar banco:

```bash
docker exec sep-postgres psql -U sep -d sep_dev -c \
  "SELECT id, username, modificado_por, substr(password, 1, 4) AS pw_prefix FROM usuario WHERE id = '<uuid>';"
```

**Esperado**:

- `modificado_por = <uuid do usuario autenticado>`
- `pw_prefix = '$2a$'`

### Definicao de pronto da Task 3.3

- [ ] `PATCH /api/v1/usuarios/{id}/senha` autenticado.
- [ ] Apenas o proprio usuario altera a propria senha.
- [ ] Senha atual incorreta falha.
- [ ] Nova senha persiste como BCrypt.
- [ ] Auditoria grava UUID em `modificado_por`.

### Commit sugerido

```bash
git add src/main/java/com/dynamis/sep_api/usuarios/ \
        src/test/java/com/dynamis/sep_api/usuarios/
git commit -m "feat(backend): alteracao autenticada da propria senha"
```

---

## Verificacao manual fim de sprint

### Preparar ambiente

```bash
cd <sep-api-root>
docker compose up -d postgres
./gradlew bootRun --args='--spring.profiles.active=dev'
```

### Cenarios curl

Criar admin:

```bash
curl -i -X POST http://localhost:8080/api/v1/usuarios \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@sep.test","password":"123456","role":"ADMIN"}'
```

Criar cliente:

```bash
curl -i -X POST http://localhost:8080/api/v1/usuarios \
  -H "Content-Type: application/json" \
  -d '{"username":"cliente@sep.test","password":"654321","role":"CLIENTE"}'
```

Login:

```bash
curl -i -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@sep.test","password":"123456"}'
```

Consultar `/auth/me`:

```bash
curl -i http://localhost:8080/api/v1/auth/me \
  -H "Authorization: Bearer <token>"
```

Listar usuarios como admin:

```bash
curl -i http://localhost:8080/api/v1/usuarios \
  -H "Authorization: Bearer <admin-token>"
```

Tentar listar como cliente:

```bash
curl -i http://localhost:8080/api/v1/usuarios \
  -H "Authorization: Bearer <cliente-token>"
# Esperado: 403
```

Consultar proprio usuario como cliente:

```bash
curl -i http://localhost:8080/api/v1/usuarios/<cliente-id> \
  -H "Authorization: Bearer <cliente-token>"
```

Consultar usuario alheio como cliente:

```bash
curl -i http://localhost:8080/api/v1/usuarios/<admin-id> \
  -H "Authorization: Bearer <cliente-token>"
# Esperado: 403
```

Alterar propria senha:

```bash
curl -i -X PATCH http://localhost:8080/api/v1/usuarios/<cliente-id>/senha \
  -H "Authorization: Bearer <cliente-token>" \
  -H "Content-Type: application/json" \
  -d '{"passwordAtual":"654321","novaSenha":"abcdef"}'
# Esperado: 204
```

Token ausente em rota protegida:

```bash
curl -i http://localhost:8080/api/v1/auth/me
# Esperado: 401
```

## Suite final

```bash
cd <sep-api-root>
./gradlew spotlessApply
./gradlew clean test bootJar
./gradlew jacocoTestReport
```

## Definicao de pronto da Sprint 3

- [ ] Login em `POST /api/v1/auth/login` emite JWT.
- [ ] JWT contem `sub`, `email`, `roles`, `iat`, `exp`.
- [ ] `GET /api/v1/auth/me` retorna usuario autenticado.
- [ ] Filtro JWT autentica rotas protegidas.
- [ ] Token ausente/invalido/expirado retorna `401`.
- [ ] `GET /api/v1/usuarios/{id}` respeita role e ownership.
- [ ] `GET /api/v1/usuarios` e apenas `ADMIN`.
- [ ] `PATCH /api/v1/usuarios/{id}/senha` e apenas proprio usuario.
- [ ] Auditoria autenticada grava UUID.
- [ ] Publicos continuam publicos: docs, actuator, cadastro, login.
- [ ] `./gradlew clean test bootJar` verde.

## Estado esperado do repositorio apos Sprint 3

Novos blocos principais:

```
src/main/java/com/dynamis/sep_api/
├── identity/
│   ├── application/usecase/AutenticarUsuarioUseCase.java
│   ├── infrastructure/security/
│   │   ├── CustomUserDetailsService.java
│   │   ├── JwtAuthenticationFilter.java
│   │   ├── JwtTokenProvider.java
│   │   └── UsuarioAutenticado.java
│   └── web/
│       ├── controller/AuthController.java
│       └── dto/
│           ├── LoginRequestDto.java
│           └── TokenResponseDto.java
└── usuarios/
    ├── application/exception/
    │   ├── SenhaAtualIncorretaException.java
    │   └── UsuarioNaoEncontradoException.java
    └── application/usecase/
        ├── AlterarSenhaUseCase.java
        ├── ConsultarUsuarioUseCase.java
        └── ListarUsuariosUseCase.java
```

Arquivos modificados principais:

- `identity/infrastructure/config/SecurityConfig.java`
- `shared/audit/AuditorAwareImpl.java`
- `usuarios/domain/model/Usuario.java`
- `usuarios/web/controller/UsuarioController.java`

## Proximos passos apos Sprint 3

1. Sprint 4 evolui `ApiExceptionHandler` para padrao completo de erros.
2. Sprint 4 documenta OpenAPI/Swagger com responses e schemas detalhados.
3. Frontend web/mobile passam a consumir login real e rotas autenticadas.

## Referencias

- [Spec 003 - Sprint 3 Seguranca e Autenticacao JWT](../../specs/fase-1/003-sprint-3-seguranca-autenticacao.md)
- [Steps Sprint 2 backend](./002-sprint-2-steps.md)
- [ADR 0007 - DDD com Hexagonal](../../adr/0007-ddd-com-hexagonal-ports-and-adapters-por-modulo.md)
- [PRD](../../docs-sep/PRD.md)
