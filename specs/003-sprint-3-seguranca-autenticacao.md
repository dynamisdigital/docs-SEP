# Spec 003 - Sprint 3 - Seguranca e Autenticacao JWT

## Metadados

- **ID da Spec**: 003
- **Titulo**: Sprint 3 - Seguranca e Autenticacao JWT
- **Status**: aprovada para execucao (apos conclusao da Spec 002)
- **Fase do produto**: Epic 3 - Seguranca e Autenticacao JWT
- **Origem**: PRD - API SEP, Secao 22 (Backlog Tecnico Implementavel)
- **Depende de**: [`002-sprint-2-gestao-usuarios.md`](./002-sprint-2-gestao-usuarios.md)
- **Responsavel principal**: Dev Senior

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
- `ApiExceptionHandler` formal (Sprint 4)
- Swagger UI detalhada (Sprint 4)
- testes automatizados (Sprint 4)
- qualquer regra de dominio alem das definidas na Sprint 2

## Pre-requisitos globais

- Spec 002 concluida e validada
- entidade `Usuario`, repositorio, DTOs e criacao publica funcionais
- dependencia de JWT ja declarada no `build.gradle` (Sprint 1)
- `AuditorAware` da Sprint 2 pronto para ler o UUID do usuario autenticado

## Tasks

### Task 3.1 - Seguranca JWT, BCrypt e login

**Descricao**
Implementar o provider, o filtro, o `UserDetailsService`, o servico de autenticacao e o controller de autenticacao, habilitando login com JWT e consulta do usuario autenticado em `/auth/me`.

**Arquivos esperados**
- `security/JwtTokenProvider.java`
- `security/JwtAuthenticationFilter.java`
- `security/CustomUserDetailsService.java`
- `service/AuthService.java`
- `web/controller/AuthController.java`
- `web/dto/LoginRequestDto.java`
- `web/dto/TokenResponseDto.java`

**Regras de validacao dos DTOs de autenticacao**
- `LoginRequestDto.username`: `@NotBlank`, `@Email`
- `LoginRequestDto.password`: `@NotBlank`
- `TokenResponseDto`: apenas campos de resposta (`accessToken`, `tokenType`, `expiresIn`, `usuario`), sem validacao de entrada

**Detalhes de implementacao**
- `JwtTokenProvider`:
  - emite token com claims `sub` (UUID como string), `email`, `roles`, `iat`, `exp`
  - assinatura HS256 com secret configurado por `app.jwt.secret`
  - expiracao configuravel por `app.jwt.expiration-seconds`
  - metodos de emissao, validacao e extracao do `Authentication`
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
Proteger os endpoints de usuario com regras de perfil e ownership. Aplicar as restricoes diretamente no `SecurityConfig` e reforca-las no service quando necessario, evitando que a regra viva apenas na borda HTTP.

**Arquivos esperados**
- `config/SecurityConfig.java`
- `service/UsuarioService.java`
- `web/controller/UsuarioController.java`

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
- `service/UsuarioService.java`
- `web/controller/UsuarioController.java`

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
Task 3.1
  |
  +---> Task 3.2
  |       |
  +-------+--> Task 3.3
```

- Task 3.1 habilita autenticacao e e raiz das demais.
- Task 3.2 precisa da autenticacao funcional para aplicar perfil e ownership.
- Task 3.3 precisa do ownership da Task 3.2 e do fluxo JWT da Task 3.1.

## Definicao de pronto (Sprint 3)

- login funcional em `POST /api/v1/auth/login` emitindo JWT com as claims obrigatorias
- `GET /api/v1/auth/me` retorna o usuario autenticado
- `GET /api/v1/usuarios/{id}` respeita perfil e ownership
- `GET /api/v1/usuarios` permitido apenas para admin
- `PATCH /api/v1/usuarios/{id}/senha` permitido apenas ao proprio usuario
- senha validada e atualizada via BCrypt
- auditoria persiste o UUID do usuario autenticado
- logout tratado apenas no cliente (sem endpoint dedicado)

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

- **Sprint 4** formaliza o `ApiExceptionHandler` que padroniza as respostas de erro de autenticacao (401), autorizacao (403), validacao (400) e conflito (409). Consome os cenarios desta sprint para ajustar mensagens e mapeamentos.
- **Sprint 4** documenta em Swagger os schemas de `TokenResponseDto`, `LoginRequestDto`, `UsuarioResponseDto` e os codigos de resposta consolidados aqui.
- **Sprint 4** cobre com testes automatizados os cenarios de autenticacao e autorizacao implementados nesta sprint.

## Restricoes e regras de execucao

- sem refresh token nesta fase
- sem blacklist de token nesta fase
- logout e responsabilidade do cliente (descartar o `accessToken`)
- commits podem ser feitos pelo agente de IA quando solicitado
- push e PR permanecem manuais
- ao final de cada task, parar para teste local manual

## Referencias

- [PRD - API SEP](../docs-sep/PRD.md), Secoes 6, 7, 8, 9, 14, 15 e 22
- [CONTEXT.md](../docs-sep/CONTEXT.md)
- [Spec 001](./001-sprint-1-fundacao-tecnica.md)
- [Spec 002](./002-sprint-2-gestao-usuarios.md)
