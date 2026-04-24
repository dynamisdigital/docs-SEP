# Spec 004 - Sprint 4 - Tratamento de Erros, Documentacao e Testes

## Metadados

- **ID da Spec**: 004
- **Titulo**: Sprint 4 - Tratamento de Erros, Documentacao e Testes
- **Status**: aprovada para execucao (apos estabilizacao da Spec 003)
- **Fase do produto**: Epic 4 - Tratamento de erros e documentacao
- **Origem**: PRD - API SEP, Secao 22 (Backlog Tecnico Implementavel)
- **Depende de**: [`003-sprint-3-seguranca-autenticacao.md`](./003-sprint-3-seguranca-autenticacao.md)
- **Responsavel principal**: Dev Senior

## Objetivo

Consolidar a qualidade da API fechando tres frentes finais desta fase: tratamento centralizado de erros com payload padronizado, documentacao OpenAPI completa exposta via Swagger UI e cobertura minima de testes automatizados para os cenarios criticos de autenticacao e autorizacao. Ao final desta sprint, a fundacao da API esta pronta para entrega e para integracao com o frontend Angular em fases posteriores.

## Escopo

### Em escopo
- `ApiExceptionHandler` anotado com `@RestControllerAdvice` cobrindo:
  - validacao de `@Valid` (MethodArgumentNotValidException) -> `400`
  - violacoes de integridade (DataIntegrityViolationException, ex.: `username` duplicado) -> `409`
  - excecoes de autenticacao (AuthenticationException, BadCredentialsException) -> `401`
  - excecoes de autorizacao (AccessDeniedException) -> `403`
  - excecoes de negocio proprias (ex.: `UsuarioNaoEncontradoException`, `SenhaAtualIncorretaException`) -> codigos apropriados
  - fallback generico `500` para excecoes nao mapeadas
- `ErrorResponseDto` padronizado com: `timestamp`, `status`, `error`, `message`, `path` e `traceId` opcional
- Springdoc OpenAPI configurado com `OpenApiConfig.java`
  - info da API, `security scheme` HTTP Bearer para JWT
  - tags separando `auth` e `usuarios`
  - exemplos coerentes com o PRD (datas ISO-8601 com offset, ids `uuid`)
  - schemas corretos para todos os DTOs
  - Swagger UI acessivel em ambiente `dev`
- Testes automatizados dos cenarios obrigatorios do PRD, concentrados nos fluxos de autenticacao e autorizacao, com teste de integracao leve quando fizer sentido

### Fora de escopo nesta spec
- deploy remoto
- GitHub Actions, CI/CD e pipelines
- observabilidade avancada alem do Actuator
- testes de performance ou carga
- geracao automatica de changelog

## Pre-requisitos globais

- Spec 003 concluida e validada
- endpoints principais (`auth/login`, `auth/me`, `usuarios`) funcionais
- DTOs consolidados
- regras de seguranca e ownership estabilizadas

## Tasks

### Task 4.1 - ApiExceptionHandler e payload padrao de erro

**Descricao**
Implementar o handler centralizado de excecoes e padronizar a estrutura de erro retornada pela API. O payload deve ser suficiente para apoiar o frontend e possuir espaco para evolucao futura (ex.: `traceId`).

**Arquivos esperados**
- `exception/ApiExceptionHandler.java`
- `web/dto/ErrorResponseDto.java`
- excecoes de dominio proprias em `exception/` conforme necessidade (ex.: `UsuarioNaoEncontradoException`, `SenhaAtualIncorretaException`)

**Formato do payload padrao**
```json
{
  "timestamp": "2026-04-24T18:35:00-03:00",
  "status": 400,
  "error": "Bad Request",
  "message": "password deve conter exatamente 6 caracteres",
  "path": "/api/v1/usuarios",
  "traceId": "opcional"
}
```

**Mapeamentos minimos**
- `MethodArgumentNotValidException` -> `400` com mensagem derivada dos `FieldError`
- `DataIntegrityViolationException` -> `409` com mensagem amigavel quando for conflito de `username`
- `BadCredentialsException`, `AuthenticationException` -> `401`
- `AccessDeniedException` -> `403`
- excecoes de dominio proprias -> codigos apropriados
- fallback `Exception` -> `500` com mensagem generica e log completo no servidor

**Criterios de verificacao**
- validacao de entrada invalida retorna `400` no formato padrao
- tentativa de cadastro duplicado retorna `409` no formato padrao
- chamada a rota protegida sem token retorna `401` no formato padrao
- cliente tentando listar usuarios retorna `403` no formato padrao
- conflito logico (ex.: senha atual errada) retorna codigo apropriado no formato padrao
- stacktrace nao e exposto no response em nenhum cenario

**Pre-requisitos**
- endpoints principais implementados

**Dependencias**
- pode iniciar no fim da Sprint 2
- deve considerar os cenarios finais apos Tasks 2.3, 3.1, 3.2 e 3.3

**Responsavel sugerido**
- Dev Senior

---

### Task 4.2 - Springdoc OpenAPI e Swagger UI

**Descricao**
Configurar a documentacao OpenAPI da API com Springdoc, anotar os controllers relevantes, definir o `security scheme` para JWT e garantir que os exemplos estejam coerentes com o PRD.

**Arquivos esperados**
- `config/OpenApiConfig.java`
- controllers anotados (`@Tag`, `@Operation`, `@ApiResponse`, `@Parameter`) conforme necessidade
- `application.yml` com as propriedades do Springdoc (path da Swagger UI, etc.)

**Detalhes de implementacao**
- `OpenApiConfig`:
  - `OpenAPI` bean com `Info` (titulo, descricao, versao)
  - `Components` com `SecurityScheme` HTTP Bearer (`bearerFormat = JWT`)
  - `SecurityRequirement` global ou por operacao
- tags:
  - `auth` para `AuthController`
  - `usuarios` para `UsuarioController`
- exemplos coerentes:
  - datas em ISO-8601 com offset
  - `id` como UUID exemplo real
  - `role` apenas com valores `ADMIN` ou `CLIENTE`
- todos os DTOs (`UsuarioCreateDto`, `UsuarioResponseDto`, `UsuarioSenhaUpdateDto`, `LoginRequestDto`, `TokenResponseDto`, `ErrorResponseDto`) expostos com schemas corretos
- Swagger UI acessivel em profile `dev` (ex.: `/swagger-ui.html` ou `/swagger-ui/index.html`)

**Criterios de verificacao**
- Swagger UI abre localmente em profile `dev`
- todos os endpoints da API aparecem documentados
- botao de `Authorize` aceita um JWT para testar rotas protegidas
- schemas dos DTOs batem com os contratos do PRD
- exemplos de datas e identificadores coerentes com o padrao

**Pre-requisitos**
- DTOs definidos
- endpoints principais implementados

**Dependencias**
- depende da Task 2.2
- depende da Task 2.3
- depende da Task 3.1
- depende da Task 3.2
- pode evoluir em paralelo com a Task 4.1

**Responsavel sugerido**
- Dev Senior (com revisao funcional dos devs frontend)

---

### Task 4.3 - Testes de autenticacao e autorizacao

**Descricao**
Cobrir com testes automatizados os cenarios criticos listados no PRD para autenticacao e autorizacao, alem dos cenarios chave de validacao e auditoria. Priorizar testes de integracao leves usando `@SpringBootTest` + `MockMvc` ou `@WebMvcTest` quando aplicavel.

**Arquivos esperados**
- `src/test/java/.../UsuarioControllerTest.java`
- `src/test/java/.../AuthControllerTest.java`
- `src/test/java/.../security/JwtAuthenticationFilterTest.java` (ou equivalente)
- demais classes de suporte conforme necessidade

**Cenarios minimos cobertos**
- criar usuario com e-mail valido
- rejeitar e-mail invalido
- rejeitar e-mail duplicado
- rejeitar senha com tamanho diferente de 6
- autenticar com credenciais validas
- falhar autenticacao com senha invalida
- admin consultar qualquer usuario
- cliente consultar apenas o proprio usuario
- cliente nao listar usuarios (`403`)
- admin listar usuarios
- usuario alterar a propria senha
- usuario nao alterar senha de terceiro (`403`)
- auditoria preencher criacao e modificacao
- migrations subirem corretamente no boot da aplicacao
- healthcheck responder com sucesso
- respostas de erro seguirem payload padronizado
- token expirado ser rejeitado (`401`)
- token invalido ser rejeitado (`401`)
- claims `sub`, `email` e `roles` presentes no JWT emitido
- auditoria usar o identificador do usuario autenticado em operacao autenticada
- auditoria usar fallback `system` quando nao houver autenticacao

**Criterios de verificacao**
- `./gradlew test` executa todos os testes com sucesso
- cenarios criticos do PRD cobertos
- testes rodam em isolamento usando banco de teste adequado (ex.: Testcontainers ou banco `dev` descartavel)

**Pre-requisitos**
- regras de seguranca estabilizadas
- payloads de request e response consolidados

**Dependencias**
- depende da Task 3.1
- depende da Task 3.2
- depende da Task 3.3
- depende parcialmente da Task 4.1

**Responsavel sugerido**
- Dev Senior

## Grafo de dependencias entre as tasks

```
Task 4.1  --+
            |
Task 4.2  --+---> Task 4.3
```

- Task 4.1 e Task 4.2 podem evoluir em paralelo.
- Task 4.3 consome os formatos finalizados de erro e a documentacao para validar contratos.

## Definicao de pronto (Sprint 4)

- `ApiExceptionHandler` cobrindo validacao, autenticacao, autorizacao, conflito e fallback generico
- `ErrorResponseDto` padronizado em todas as respostas de erro
- stacktrace jamais exposta em response
- Swagger UI acessivel em `dev`, com `security scheme` JWT
- todos os DTOs e endpoints documentados em OpenAPI
- exemplos e schemas coerentes com o PRD
- suite de testes automatizados cobrindo os cenarios obrigatorios
- `./gradlew test` verde localmente

## Cenarios de verificacao manual complementar

- enviar payload invalido em `POST /usuarios` -> ver `400` no formato padrao
- enviar `username` duplicado -> ver `409` no formato padrao
- chamar rota protegida sem token -> ver `401` no formato padrao
- cliente tentando listar -> ver `403` no formato padrao
- abrir Swagger UI, clicar em `Authorize`, colar um JWT e executar `/auth/me`
- inspecionar os schemas dos DTOs na Swagger UI e comparar com o PRD
- rodar a suite de testes via `./gradlew test` e confirmar que todos passam

## Impacto nas fases seguintes

- esta spec consolida a entrega da fase inicial da API SEP
- a proxima onda de produto (Onboarding KYC/KYB, Analise de credito, Formalizacao, Cobranca) herda:
  - o padrao de erro
  - o padrao de documentacao
  - a base de testes
  - a infra de seguranca
- a infraestrutura futura (Epic 14) ira reutilizar:
  - o endpoint de healthcheck
  - as migrations versionadas
  - o padrao de configuracao por ambiente

## Restricoes e regras de execucao

- sem CI/CD nesta fase (testes rodam localmente)
- commits podem ser feitos pelo agente de IA quando solicitado
- push e PR permanecem manuais
- ao final de cada task, parar para teste local manual
- GitHub Actions, deploy e observabilidade avancada ficam para o Epic 14

## Referencias

- [PRD - API SEP](../docs-sep/PRD.md), Secoes 7, 8, 13, 17, 22, 23 e 24
- [CONTEXT.md](../docs-sep/CONTEXT.md)
- [Spec 001](./001-sprint-1-fundacao-tecnica.md)
- [Spec 002](./002-sprint-2-gestao-usuarios.md)
- [Spec 003](./003-sprint-3-seguranca-autenticacao.md)
