# Spec 003 - Sprint 3 - Seguranca e Autenticacao JWT

## Metadados

- **ID da Spec**: 003
- **Titulo**: Sprint 3 - Seguranca e Autenticacao JWT
- **Status**: **Concluida em 2026-05-05** (commit `242b2a0` na branch `feature/sprint-3-seguranca-autenticacao` do `sep-api`, mergeada via PR para `develop`/`main`)
- **Fase do produto**: Epic 3 - Seguranca e Autenticacao JWT
- **Origem**: PRD - API SEP, Secao 22 (Backlog Tecnico Implementavel)
- **Depende de**: [`002-sprint-2-gestao-usuarios.md`](./002-sprint-2-gestao-usuarios.md)
- **Responsavel principal**: Dev Senior

## Erratum (registrado na conclusao)

- **`UsuarioAutenticado` em vez de `User` simples**: spec sugere `User` do Spring Security em alguns trechos; implementacao usa `record UsuarioAutenticado(UUID id, String username, Role role) implements UserDetails` para evitar round-trip ao banco em rotas autenticadas e permitir que `AuditorAwareImpl` extraia o UUID via `principal.id()`. Decisao tecnica documentada nos steps Task 3.1a.1.
- **`UsuarioMapper.toEntity` continua ausente**: mapper segue sem `toEntity` (decisao da Sprint 2: entidade tem construtor `protected` e factory `Usuario.criar`). `AutenticarUsuarioUseCase` usa apenas `mapper.toResponse`; nenhum use case da Sprint 3 precisou criar entidade via mapper.
- **`AuthController` busca usuario direto no `UsuarioRepository` para `/me`**: para evitar circular dep com use case que ainda nao existia, `/auth/me` injeta `UsuarioRepository` diretamente. Refactor para `ConsultarUsuarioUseCase` fica como follow-up de Sprint 4 (cobrindo a observacao do step 3.1b.5).
- **`RecursoNaoEncontradoException` e `ValidacaoException` -> `non-sealed`**: mesma estrategia da `ConflitoException` na Sprint 2. Permite `UsuarioNaoEncontradoException` (Task 3.2.1, codigo `USR-404-001`) e `SenhaAtualIncorretaException` (Task 3.3.2, codigo `USR-400-001`) como subtypes por modulo, sem mexer no `permits` da raiz `DomainException`.
- **Handlers 401/403 antecipados no `ApiExceptionHandler`**: spec deixa mapeamento completo para Sprint 4, mas testes da Sprint 3 (Tasks 3.2 e 3.3) exigem 401 (`AuthenticationException`) e 403 (`AccessDeniedException`) padronizados via `ErrorResponseDto`. Adicao minima registrada como scope-creep necessario.
- **Sem token retorna 403 (default Spring Security 6) em vez de 401**: `JwtAuthenticationFilter` so responde 401 quando ha token presente e invalido. Sem header, a chain segue ate `@PreAuthorize` que delega para o `AccessDeniedHandler` default = 403. Sprint 4 pluga `AuthenticationEntryPoint` customizado para uniformizar 401.
- **`UsuarioRepositoryTest` mantido sem Testcontainers**: heranca do desvio Sprint 1 (issue Docker Engine 28+ documentada em `SmokeBootTest`). Migracao para Testcontainers continua follow-up cross-sprint.
- **`UsuarioControllerSecurityTest` e `UsuarioControllerSenhaTest`** usam `@WebMvcTest` + `@TestConfiguration` com `@EnableMethodSecurity` + `@AutoConfigureMockMvc(addFilters = false)` para isolar AOP de `@PreAuthorize` da chain de filtros. Pattern documentado para reuso em sprints futuras.

## Objetivo

Entregar o mecanismo completo de autenticacao e autorizacao da API: login com emissao de JWT, filtro que valida o token em toda rota protegida, recurso `/auth/me`, consulta/listagem de usuario com autorizacao por perfil e ownership, e alteracao da propria senha apenas pelo usuario autenticado. Ao final desta sprint, a API deve respeitar integralmente o padrao de JWT e auditoria definidos no PRD.

## Escopo

### Em escopo
- `JwtTokenProvider` para emissao e validacao de tokens
- `JwtAuthenticationFilter` registrado antes do `UsernamePasswordAuthenticationFilter`
- `CustomUserDetailsService` carregando o usuario pelo `username` (e-mail)
- `AuthService` com operacao de login autenticando por `username` + `password`
- `AuthController` expondo:
  - `POST /api/v1/auth/login` (publico, retorna `TokenResponseDto`)
  - `GET /api/v1/auth/me` (autenticado, retorna `UsuarioResponseDto`)
- validacao do hash de senha via `BCryptPasswordEncoder`
- claims do JWT: `sub` (UUID do usuario), `email`, `roles`, `iat`, `exp`
- expiracao configuravel por propriedade (`app.jwt.expiration-seconds`)
- autorizacao por perfil e ownership aplicada aos endpoints de usuario:
  - `GET /api/v1/usuarios/{id}`: admin pode qualquer, cliente apenas o proprio
  - `GET /api/v1/usuarios`: apenas admin, cliente recebe `403 Forbidden`
  - `PATCH /api/v1/usuarios/{id}/senha`: apenas o proprio usuario autenticado
- ajuste do `SecurityConfig` consolidando liberacao publica do cadastro e do login, protecao dos demais endpoints, CORS e integracao com o filtro JWT
- auditoria persistindo o UUID do usuario autenticado em operacoes autenticadas

### Fora de escopo nesta spec
- refresh token (explicitamente fora nesta fase)
- blacklist de token ou logout server-side (logout tratado no cliente)
- evolucao do `ApiExceptionHandler` para mapeamento completo (Sprint 4 — stub ja existe da Sprint 1)
- Swagger UI detalhada (Sprint 4)
- qualquer regra de dominio alem das definidas na Sprint 2

## Pre-requisitos globais

- Spec 002 concluida e validada
- entidade `Usuario`, repositorio, DTOs e criacao publica funcionais
- dependencia de JWT ja declarada no `build.gradle` (Sprint 1)
- `AuditorAware` da Sprint 2 pronto para ler o UUID do usuario autenticado

## Tasks

### Task 3.1 - Seguranca JWT, BCrypt e login

**Descricao**
Implementar no modulo `identity` o provider, o filtro, o `UserDetailsService`, o caso de uso de autenticacao e o controller de autenticacao, habilitando login com JWT e consulta do usuario autenticado em `/auth/me`. Ativar a propagacao de `correlationId` via `CorrelationIdFilter` (criado na Sprint 1).

**Arquivos esperados**
- `identity/infrastructure/security/JwtTokenProvider.java`
- `identity/infrastructure/security/JwtAuthenticationFilter.java`
- `identity/infrastructure/security/CustomUserDetailsService.java`
- `identity/application/usecase/AutenticarUsuarioUseCase.java`
- `identity/web/controller/AuthController.java`
- `identity/web/dto/LoginRequestDto.java` (`record`)
- `identity/web/dto/TokenResponseDto.java` (`record`)
- update em `shared/config/SecurityConfig.java` registrando o `JwtAuthenticationFilter` e mantendo o `CorrelationIdFilter`
- update em `shared/audit/AuditorAwareImpl.java` para extrair UUID do `Authentication` quando presente
- testes obrigatorios:
  - `JwtTokenProviderTest` (gera token, valida, extrai claims)
  - `JwtAuthenticationFilterTest` (`@WebMvcTest` com filter)
  - `AutenticarUsuarioUseCaseTest` (`@MockitoExtension`)
  - `AuthControllerTest` (`@WebMvcTest`)

**Regras de validacao dos DTOs de autenticacao**
- `LoginRequestDto.username`: `@NotBlank`, `@Email`
- `LoginRequestDto.password`: `@NotBlank`
- `TokenResponseDto`: apenas campos de resposta (`accessToken`, `tokenType`, `expiresIn`, `usuario`), sem validacao de entrada

**Detalhes de implementacao**
- `JwtTokenProvider`:
  - emite token com claims `sub` (**UUID v6 do usuario, serializado como string canonica `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`**), `email`, `roles`, `iat`, `exp`
  - assinatura HS256 com secret configurado por `app.jwt.secret` (decodificado da prop como Base64-encoded bytes; minimo 256 bits)
  - expiracao configuravel por `app.jwt.expiration-seconds`
  - usa **JJWT 0.12.x** API (`Jwts.builder()`, `Jwts.parser().verifyWith(key)`)
  - metodos de emissao, validacao e extracao do `Authentication`
  - propaga `correlationId` extraido do MDC para os logs de emissao/validacao
- `JwtAuthenticationFilter`:
  - extende `OncePerRequestFilter`
  - le o header `Authorization: Bearer <token>`
  - valida assinatura, expiracao e integridade
  - popula o `SecurityContextHolder` com os papeis prefixados por `ROLE_`
- `CustomUserDetailsService`:
  - implementa `UserDetailsService`, buscando por `username` (e-mail)
  - devolve um `UserDetails` com as authorities derivadas do enum `Role`
- `AuthService.login(LoginRequestDto)`:
  - valida credenciais com `BCryptPasswordEncoder.matches`
  - emite o token via `JwtTokenProvider`
  - retorna `TokenResponseDto` com `accessToken`, `tokenType = Bearer`, `expiresIn` e `usuario`
- `AuthController`:
  - `POST /api/v1/auth/login` publico
  - `GET /api/v1/auth/me` autenticado, retornando o `UsuarioResponseDto` do principal

**Criterios de verificacao**
- login com credenciais validas gera um JWT que valida no backend
- claims `sub`, `email`, `roles`, `iat` e `exp` presentes no token emitido
- `sub` carrega o UUID do usuario
- login com senha invalida falha
- token expirado e rejeitado pelo filtro
- token com assinatura invalida e rejeitado pelo filtro
- `GET /auth/me` retorna o usuario correto para um token valido

**Pre-requisitos**
- Spec 002 concluida
- criacao de usuario funcional (Task 2.3)

**Dependencias**
- depende da Task 2.3

**Responsavel sugerido**
- Dev Senior

---

### Task 3.2 - Autorizacao por perfil e ownership

**Descricao**
Proteger os endpoints de usuario com regras de perfil e ownership. Aplicar as restricoes via `@PreAuthorize` (Spring Security 6) no controller e reforca-las no use case quando ownership exige logica de comparacao com `principal.sub`.

Esta task pode comecar **em paralelo** com a Task 3.1 apos os contratos de DTO de auth (Task 3.1 parcial: `LoginRequestDto`, `TokenResponseDto`) estarem definidos. So fica bloqueada na finalizacao quando o `SecurityFilterChain` da Task 3.1 estiver pronto.

**Arquivos esperados**
- update em `shared/config/SecurityConfig.java` (com `@EnableMethodSecurity(prePostEnabled = true)`)
- `usuarios/application/usecase/ConsultarUsuarioUseCase.java` (regra ownership)
- `usuarios/application/usecase/ListarUsuariosUseCase.java`
- update em `usuarios/web/controller/UsuarioController.java` (adiciona `GET /{id}` e `GET /`)
- testes obrigatorios:
  - `ConsultarUsuarioUseCaseTest` (admin acessa qualquer; cliente acessa proprio)
  - `UsuarioControllerSecurityTest` (`@WebMvcTest` com `@WithMockUser` testando perfil e ownership)

**Regras de autorizacao**
- `POST /api/v1/usuarios`: publico (mantem regra da Sprint 2)
- `GET /api/v1/usuarios/{id}`: autenticado
  - `ROLE_ADMIN` pode consultar qualquer `id`
  - `ROLE_CLIENTE` pode consultar apenas o proprio (ownership validado no service comparando `principal.sub` com o `id` solicitado)
- `GET /api/v1/usuarios`: autenticado e `ROLE_ADMIN` apenas
  - `ROLE_CLIENTE` recebe `403 Forbidden`
- demais rotas (a serem adicionadas em fases futuras) continuam negadas por padrao

**Criterios de verificacao**
- admin autenticado consulta qualquer usuario por id
- cliente autenticado consulta apenas o proprio usuario
- cliente autenticado recebe `403` ao tentar listar
- admin autenticado lista todos os usuarios
- token ausente ou invalido em rotas protegidas resulta em `401 Unauthorized`

**Pre-requisitos**
- autenticacao JWT funcional (Task 3.1)
- endpoints base de usuario existentes (Sprint 2)

**Dependencias**
- depende da Task 3.1
- depende da Task 2.3

**Responsavel sugerido**
- Dev Senior

---

### Task 3.3 - Alteracao da propria senha

**Descricao**
Expor `PATCH /api/v1/usuarios/{id}/senha` permitindo que o proprio usuario autenticado altere sua senha. A operacao exige a senha atual e aplica o hash BCrypt na nova.

**Arquivos esperados**
- `usuarios/application/usecase/AlterarSenhaUseCase.java`
- update em `usuarios/web/controller/UsuarioController.java`
- `usuarios/application/exception/SenhaAtualIncorretaException.java` (estende `DomainException`)
- testes obrigatorios:
  - `AlterarSenhaUseCaseTest` (5 cenarios: sucesso, senha atual errada, ownership, hash novo, modificadoPor preenchido)
  - `UsuarioControllerSenhaTest` (`@WebMvcTest`)

**Regras**
- request: `UsuarioSenhaUpdateDto` com `passwordAtual` e `novaSenha`
- validacao: `novaSenha` com exatamente 6 caracteres
- ownership: `principal.sub` deve ser igual ao `id` da URL, caso contrario `403 Forbidden`
- `passwordAtual` deve bater com o hash armazenado, caso contrario `400 Bad Request` (o payload padrao de erro sera formalizado na Sprint 4)
- response: `204 No Content`
- auditoria: `modificadoPor` deve ser preenchido com o UUID do proprio usuario autenticado

**Criterios de verificacao**
- usuario autenticado altera a propria senha com sucesso
- usuario autenticado nao altera senha de terceiros (`403`)
- `passwordAtual` incorreta e recusada
- nova senha e persistida com hash BCrypt
- campo `modificadoPor` do registro persistido contem o UUID do proprio usuario

**Pre-requisitos**
- autenticacao funcional (Task 3.1)
- ownership implementado (Task 3.2)

**Dependencias**
- depende da Task 3.1
- depende da Task 3.2

**Responsavel sugerido**
- Dev Senior

## Grafo de dependencias entre as tasks

```
Task 3.1 (JWT + login + AuthController + auditoria autenticada)
  |
  +---> Task 3.2 (autorizacao perfil + ownership) [pode comecar em paralelo apos contratos DTO de auth]
  |        |
  +--------+--> Task 3.3 (alterar senha)
```

- Task 3.1 habilita autenticacao e e raiz da Task 3.3.
- Task 3.2 pode ser iniciada em paralelo apos os contratos DTO da Task 3.1, finalizando-se quando o `SecurityFilterChain` estiver pronto.
- Task 3.3 precisa do ownership da Task 3.2 e do fluxo JWT da Task 3.1.

## Definicao de pronto (Sprint 3)

- login funcional em `POST /api/v1/auth/login` emitindo JWT com as claims obrigatorias (`sub` UUID v6, `email`, `roles`, `iat`, `exp`)
- `GET /api/v1/auth/me` retorna o usuario autenticado
- `GET /api/v1/usuarios/{id}` respeita perfil e ownership
- `GET /api/v1/usuarios` permitido apenas para admin
- `PATCH /api/v1/usuarios/{id}/senha` permitido apenas ao proprio usuario
- senha validada e atualizada via BCrypt
- `AuditorAware` agora extrai UUID do `Authentication`; auditoria persiste o UUID do usuario autenticado em operacoes autenticadas e mantem `system` em operacoes publicas
- `correlationId` propagado via MDC em logs de autenticacao
- logout tratado apenas no cliente (sem endpoint dedicado)
- ao menos 12 testes automatizados passando: `JwtTokenProviderTest`, `JwtAuthenticationFilterTest`, `AutenticarUsuarioUseCaseTest`, `AuthControllerTest`, `ConsultarUsuarioUseCaseTest`, `UsuarioControllerSecurityTest`, `AlterarSenhaUseCaseTest`, `UsuarioControllerSenhaTest`
- JaCoCo nao regride (target 70% por modulo)

## Cenarios de verificacao manual

- login com credenciais validas -> `200 OK` com `accessToken`
- login com senha errada -> falha
- decodificar o token emitido e confirmar `sub = UUID`, `email`, `roles`
- chamar `/auth/me` com o token e receber o usuario do principal
- chamar `/api/v1/usuarios/{id}` como admin para outro usuario -> sucesso
- chamar `/api/v1/usuarios/{id}` como cliente para id alheio -> `403`
- chamar `/api/v1/usuarios/{id}` como cliente para o proprio id -> sucesso
- chamar `/api/v1/usuarios` como cliente -> `403`
- chamar `/api/v1/usuarios` como admin -> lista
- chamar `PATCH /usuarios/{id}/senha` no proprio id com `passwordAtual` correta -> `204`
- chamar `PATCH /usuarios/{id}/senha` no proprio id com `passwordAtual` errada -> falha
- chamar `PATCH /usuarios/{id}/senha` em id alheio -> `403`
- confirmar no banco que `modificadoPor` armazena o UUID do usuario autenticado
- enviar token expirado -> `401`
- enviar token com assinatura invalida -> `401`

## Impacto nas sprints seguintes

- **Sprint 4** **evolui** o `ApiExceptionHandler` (stub da Sprint 1) para mapeamento completo, padronizando as respostas de erro de autenticacao (401), autorizacao (403), validacao (400), conflito (409), recurso nao encontrado (404) e erro generico (500).
- **Sprint 4** documenta em Swagger os schemas de `TokenResponseDto`, `LoginRequestDto`, `UsuarioResponseDto` e os codigos de resposta consolidados aqui.
- **Sprint 4** complementa cobertura JaCoCo no target 70% para garantir que todos os caminhos cobertos manualmente nesta Sprint estejam tambem cobertos automaticamente.
- **Sprint 4** introduz o `Webhook Receiver Pattern` que consumira o filtro de autenticacao desta Sprint para validar webhooks que exigem token (futuras integracoes).

## Restricoes e regras de execucao

- sem refresh token nesta fase
- sem blacklist de token nesta fase
- logout e responsabilidade do cliente (descartar o `accessToken`)
- commits podem ser feitos pelo agente de IA quando solicitado
- push e PR permanecem manuais
- ao final de cada task, parar para teste local manual

## Referencias

- [PRD - API SEP](../../docs-sep/PRD.md), Secoes 6, 7, 8, 9, 14, 15 e 22
- [CONTEXT.md](../../docs-sep/CONTEXT.md)
- [Spec 001](./001-sprint-1-fundacao-tecnica.md)
- [Spec 002](./002-sprint-2-gestao-usuarios.md)
