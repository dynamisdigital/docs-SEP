# Spec 004 - Sprint 4 - Estabilizacao, Documentacao, Cobertura e Webhook Receiver

## Metadados

- **ID da Spec**: 004
- **Titulo**: Sprint 4 - Estabilizacao, Documentacao, Cobertura e Webhook Receiver
- **Status**: aprovada para execucao (apos estabilizacao da Spec 003)
- **Fase do produto**: Epic 4 - Tratamento de erros, documentacao e testes
- **Origem**: PRD - API SEP, Secao 22 (Backlog Tecnico Implementavel)
- **Depende de**: [`003-sprint-3-seguranca-autenticacao.md`](./003-sprint-3-seguranca-autenticacao.md)
- **Responsavel principal**: Dev Senior

## Objetivo

Consolidar a qualidade da API fechando quatro frentes finais desta fase:

1. **Evolucao** do `ApiExceptionHandler` ja criado na Sprint 1 (mapeamento completo de excecoes — antes era um stub)
2. Documentacao OpenAPI completa exposta via Swagger UI
3. Cobertura JaCoCo no target 70% por modulo + smoke tests E2E (testes unitarios e de slice ja foram entregues distribuidamente nas Sprints 1-3 via TDD)
4. **Webhook Receiver Pattern** (`/api/v1/webhooks/{provider}/{event}`) com idempotencia via `Idempotency-Key` e Outbox stub, preparando Epic 15 (Pix)

Ao final desta sprint, a fundacao da API esta pronta para entrega e para integracao com o frontend Angular (em paralelo via spec 100) em fases posteriores. A trilha mobile e as Epics 5-16 podem comecar.

## Escopo

### Em escopo
- **evolucao** do `ApiExceptionHandler` (criado como stub na Sprint 1) com mapeamento completo:
  - validacao de `@Valid` (MethodArgumentNotValidException) -> `400`
  - violacoes de integridade (DataIntegrityViolationException, ex.: `username` duplicado) -> `409`
  - excecoes de autenticacao (AuthenticationException, BadCredentialsException) -> `401`
  - excecoes de autorizacao (AccessDeniedException) -> `403`
  - excecoes de negocio proprias estendendo `DomainException` (ex.: `UsuarioNaoEncontradoException`, `SenhaAtualIncorretaException`, `UsernameJaExisteException`) -> codigos apropriados
  - fallback generico `500` para excecoes nao mapeadas, com log completo no servidor mas mensagem generica no response
- `ErrorResponseDto` (record ja existente) padronizado com: `timestamp`, `status`, `error`, `message`, `path`, `traceId` (preenchido a partir do MDC)
- Springdoc OpenAPI configurado com `OpenApiConfig.java`
  - info da API, `security scheme` HTTP Bearer para JWT
  - tags separando `auth` e `usuarios`
  - exemplos coerentes com o PRD (datas ISO-8601 com offset, ids `uuid v6`)
  - schemas corretos para todos os DTOs (records)
  - Swagger UI acessivel em ambiente `dev`
- **Webhook Receiver Pattern**:
  - endpoint generico `POST /api/v1/webhooks/{provider}/{event}` em `shared.web.controller.WebhookController`
  - validacao de assinatura HMAC por provider (configuravel)
  - idempotencia via header `Idempotency-Key` armazenado em tabela `webhook_event_log`
  - Outbox stub para garantir processamento posterior
  - registro de evento e retry assincronos via `@Async` (preparacao para futura fila/event bus)
  - testes de filter, idempotencia e retry
- cobertura JaCoCo no target 70% por modulo, validada em CI
- smoke tests E2E com `@SpringBootTest` + RestAssured cobrindo o fluxo completo (criar usuario, login, /me)

### Fora de escopo nesta spec
- deploy remoto (Epic 16 - Infraestrutura AWS Futura)
- pipelines complexos (CI minimo ja entregue na Sprint 0)
- observabilidade avancada alem do Actuator + Micrometer + Prometheus (Epic 16)
- testes de performance ou carga
- geracao automatica de changelog
- implementacao real de provedor Celcoin (Epic 5+)

## Pre-requisitos globais

- Spec 003 concluida e validada
- endpoints principais (`auth/login`, `auth/me`, `usuarios`) funcionais
- DTOs consolidados
- regras de seguranca e ownership estabilizadas

## Tasks

### Task 4.1 - Evolucao do ApiExceptionHandler

**Descricao**
**Evoluir** o `ApiExceptionHandler` ja criado como stub na Sprint 1 (`shared.exception.ApiExceptionHandler`), adicionando mapeamentos completos para todos os cenarios de erro da API. O `ErrorResponseDto` (record) ja existe — apenas garantir preenchimento correto de `traceId` a partir do MDC populado pelo `CorrelationIdFilter`.

**Arquivos esperados**
- update em `shared/exception/ApiExceptionHandler.java` (ja existente)
- `usuarios/application/exception/UsuarioNaoEncontradoException.java` (estende `DomainException`)
- `identity/application/exception/CredenciaisInvalidasException.java` (se necessario, alem das de Spring Security)
- testes obrigatorios:
  - `ApiExceptionHandlerCompletoTest` (`@WebMvcTest` cobrindo cada mapeamento)
  - cenarios complementam o `ApiExceptionHandlerTest` da Sprint 1 (que ja cobre os 3 mapeamentos basicos)

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
- `shared/config/OpenApiConfig.java`
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

### Task 4.3 - Cobertura JaCoCo e smoke tests E2E

**Descricao**
Cobertura JaCoCo no target 70% por modulo. Os testes unitarios e de slice ja foram entregues distribuidamente nas Sprints 1-3 via TDD. Esta task complementa o que faltar, adiciona smoke tests E2E e ativa a verificacao JaCoCo no CI.

**Arquivos esperados**
- testes complementares onde a cobertura ainda nao atingiu 70%
- `src/test/java/com/dynamis/broker_app/SmokeE2ETest.java` (`@SpringBootTest` + RestAssured + Testcontainers)
- ativacao de `jacocoTestCoverageVerification` no `build.gradle` (ja configurado na Sprint 0; agora bloqueia merge se < 70%)

**Cenarios minimos do smoke E2E (RestAssured)**
- POST /api/v1/usuarios cria admin (201)
- POST /api/v1/usuarios cria cliente (201)
- POST /api/v1/auth/login com admin retorna token (200)
- GET /api/v1/auth/me com token do admin retorna o admin (200)
- GET /api/v1/usuarios como admin lista (200)
- GET /api/v1/usuarios como cliente retorna 403
- PATCH /api/v1/usuarios/{id}/senha do proprio usuario altera senha (204)
- PATCH /api/v1/usuarios/{id}/senha em id alheio retorna 403

**Auditoria de cenarios obrigatorios do PRD §24** — todos ja cobertos pelos testes distribuidos das Sprints 1-3:
- criar usuario com e-mail valido (Sprint 2 - UsuarioControllerTest)
- rejeitar e-mail invalido (Sprint 2)
- rejeitar e-mail duplicado (Sprint 2)
- rejeitar senha com tamanho diferente de 6 (Sprint 2)
- autenticar com credenciais validas (Sprint 3 - AuthControllerTest)
- falhar autenticacao com senha invalida (Sprint 3)
- admin consultar qualquer usuario (Sprint 3 - UsuarioControllerSecurityTest)
- cliente consultar apenas o proprio usuario (Sprint 3)
- cliente nao listar usuarios `403` (Sprint 3)
- admin listar usuarios (Sprint 3)
- usuario alterar a propria senha (Sprint 3 - UsuarioControllerSenhaTest)
- usuario nao alterar senha de terceiro `403` (Sprint 3)
- auditoria preencher criacao e modificacao (Sprint 1 + Sprint 2)
- migrations subirem corretamente no boot da aplicacao (Sprint 1 - SmokeBootTest)
- healthcheck responder com sucesso (Sprint 1 - SmokeBootTest)
- respostas de erro seguirem payload padronizado (Sprint 1 + Sprint 4 - ApiExceptionHandlerTest)
- token expirado/invalido rejeitado (Sprint 3 - JwtAuthenticationFilterTest)
- claims `sub`, `email`, `roles` presentes no JWT (Sprint 3 - JwtTokenProviderTest)
- auditoria usar UUID do usuario autenticado / fallback `system` (Sprint 3 - AuditorAwareImpl + Sprint 1 - AuditorAwareImplTest)

**Criterios de verificacao**
- `./gradlew test jacocoTestReport jacocoTestCoverageVerification` passa todos
- cobertura JaCoCo >= 70% por modulo
- smoke E2E roda contra Testcontainers e cobre todo o golden path
- CI bloqueia merge se cobertura < 70%

**Pre-requisitos**
- todas as Sprints 1-3 com testes verdes
- Task 4.1 com handler completo (smoke E2E exercita os erros)

**Dependencias**
- depende de Tasks 4.1, 4.2

**Responsavel sugerido**
- Dev Senior

---

### Task 4.4 - Webhook Receiver Pattern (preparacao para Pix)

**Descricao**
Introduzir o padrao de receptor de webhooks generico em `shared.web.controller.WebhookController`, com idempotencia via `Idempotency-Key`, validacao de assinatura HMAC por provider e Outbox stub para garantir processamento posterior. Esta infra sera consumida pela Epic 15 (Pix) com webhooks Celcoin (`proposta_aprovada`, `pagamento_recebido`, `transferencia_liquidada`, etc.).

**Arquivos esperados**
- `shared/web/controller/WebhookController.java`
- `shared/web/dto/WebhookEnvelopeDto.java` (record)
- `shared/application/usecase/RegistrarWebhookEventUseCase.java`
- `shared/domain/model/WebhookEventLog.java` (entidade JPA com `idempotencyKey` unique)
- `shared/infrastructure/persistence/WebhookEventLogRepository.java`
- `shared/application/port/out/WebhookSignatureValidator.java` (interface)
- `shared/infrastructure/adapter/HmacSignatureValidator.java`
- `src/main/resources/db/migration/V<n>__criar_webhook_event_log.sql`
- testes obrigatorios:
  - `WebhookControllerTest` (5 cenarios: idempotencia, assinatura valida, assinatura invalida, evento duplicado, evento novo)
  - `RegistrarWebhookEventUseCaseTest`
  - `HmacSignatureValidatorTest`

**Contrato do endpoint**
- `POST /api/v1/webhooks/{provider}/{event}` recebe payload generico (JSON)
- header obrigatorio: `Idempotency-Key`
- header de assinatura: `X-Webhook-Signature` (HMAC-SHA256 do body com secret por provider)
- response: `202 Accepted` se evento aceito (mesmo se duplicado idempotente)
- response: `401` se assinatura invalida; `400` se headers ausentes

**Outbox stub**
- evento e gravado em `webhook_event_log` com status `PENDENTE`
- processamento real fica para a Epic correspondente (Pix, etc.) via `@Async` ou polling
- nesta sprint, apenas o stub esta presente (registro + log)

**Criterios de verificacao**
- chamada com mesma `Idempotency-Key` duas vezes retorna `202` ambas, mas grava 1 registro
- assinatura HMAC invalida retorna `401`
- evento e persistido com `status = PENDENTE`
- testes passam com Testcontainers

**Pre-requisitos**
- Tasks 4.1, 4.2 concluidas (handler e docs prontos)

**Dependencias**
- depende de Tasks 4.1, 4.2

**Responsavel sugerido**
- Dev Senior

## Grafo de dependencias entre as tasks

```
Task 4.1 (evolucao ApiExceptionHandler) --+
                                          |
Task 4.2 (Springdoc + Swagger UI)      --+---+--> Task 4.3 (cobertura + smoke E2E)
                                              +--> Task 4.4 (Webhook Receiver)
```

- Tasks 4.1 e 4.2 podem evoluir em paralelo.
- Tasks 4.3 e 4.4 dependem de 4.1 e 4.2 estarem completas.
- Tasks 4.3 e 4.4 podem rodar em paralelo entre si.

## Definicao de pronto (Sprint 4)

- `ApiExceptionHandler` evoluido cobrindo validacao, autenticacao, autorizacao, conflito, recurso nao encontrado e fallback generico
- `ErrorResponseDto` padronizado em todas as respostas de erro, com `traceId` populado a partir do MDC
- stacktrace jamais exposta em response
- Swagger UI acessivel em `dev`, com `security scheme` JWT
- todos os DTOs (records) e endpoints documentados em OpenAPI
- exemplos e schemas coerentes com o PRD
- cobertura JaCoCo >= 70% por modulo, validada em CI
- smoke E2E passa com Testcontainers cobrindo o golden path
- `Webhook Receiver Pattern` em `shared` com idempotencia, assinatura HMAC e Outbox stub
- `./gradlew test jacocoTestReport jacocoTestCoverageVerification` verde
- CI bloqueia PRs com cobertura < 70%

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
- a infraestrutura futura (Epic 16 - AWS) ira reutilizar:
  - o endpoint de healthcheck
  - as metricas Prometheus
  - as migrations versionadas
  - o padrao de configuracao por ambiente
- a Epic 15 (Pix) plugara o `PixProvider` Celcoin no `Webhook Receiver Pattern` desta sprint
- as Epics 5-11 reusarao o `ApiExceptionHandler` evoluido, o padrao de documentacao e a base de testes

## Restricoes e regras de execucao

- CI minimo (build + test + Spotless + JaCoCo) ja entregue na Sprint 0
- deploy remoto e observabilidade avancada ficam para a Epic 16
- commits podem ser feitos pelo agente de IA quando solicitado
- push e PR permanecem manuais
- ao final de cada task, parar para teste local manual

## Referencias

- [PRD - API SEP](../../docs-sep/PRD.md), Secoes 7, 8, 13, 17, 22, 23 e 24
- [CONTEXT.md](../../docs-sep/CONTEXT.md)
- [Spec 001](./001-sprint-1-fundacao-tecnica.md)
- [Spec 002](./002-sprint-2-gestao-usuarios.md)
- [Spec 003](./003-sprint-3-seguranca-autenticacao.md)
