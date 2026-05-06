# Steps - Sprint 4 - Estabilizacao, Documentacao, Cobertura e Webhook Receiver

**Spec de origem**: [`specs/fase-1/004-sprint-4-erros-docs-testes.md`](../../specs/fase-1/004-sprint-4-erros-docs-testes.md)

**Objetivo geral**: consolidar a fundacao backend da API SEP evoluindo erros padronizados, documentacao OpenAPI, cobertura JaCoCo e o Webhook Receiver Pattern com idempotencia e assinatura HMAC.

**Esforco total estimado**: 3-5 dias de Dev Senior dedicado. Tasks 4.1 e 4.2 podem iniciar em paralelo; Tasks 4.3 e 4.4 dependem dos contratos de erro e documentacao estarem estaveis.

**Workspace root**: `<sep-api-root>/`.

## Erratum: smoke E2E com Postgres local

A spec 004 pede smoke E2E com Testcontainers. O estado real do projeto, registrado no `CONTEXT.md` apos a Sprint 1, manteve testes de contexto usando PostgreSQL local via Docker Compose por incompatibilidade conhecida entre Testcontainers 1.21.x e Docker Engine 28+ no ambiente atual.

Nesta Sprint 4, os smoke E2E devem usar o mesmo padrao vigente:

- subir `sep-postgres` via Docker Compose;
- rodar testes com profile `dev` ou profile equivalente ja existente;
- manter a migracao para Testcontainers como follow-up cross-sprint.

Nao tentar resolver Testcontainers dentro desta sprint, a menos que o usuario solicite explicitamente.

## Ordem de execucao recomendada

```text
Task 4.1 (ApiExceptionHandler completo + security handlers)
   |
   +---> Task 4.2 (OpenAPI + Swagger UI)
           |
           +---> Task 4.3 (JaCoCo + smoke E2E)
           |
           +---> Task 4.4 (Webhook Receiver Pattern)
```

- Task 4.1 estabiliza o contrato de erro usado por todas as demais tasks.
- Task 4.2 documenta os endpoints existentes e prepara a documentacao do webhook.
- Task 4.3 fecha qualidade e cobertura.
- Task 4.4 adiciona a infraestrutura compartilhada de webhooks para Pix e integracoes futuras.

## Como usar este arquivo

1. Leia a Task inteira antes de codificar.
2. Execute os steps na ordem.
3. Rode a verificacao indicada ao final de cada bloco.
4. Se um snippet divergir do codigo real, preserve o comportamento descrito e siga o padrao local.
5. No repo `sep-api`, o agente pode criar branch e commitar quando solicitado. No repo `docs-SEP`, nao comitar.

## Pre-requisitos globais

- Sprint 3 concluida e mergeada em `develop`.
- `POST /api/v1/usuarios`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, `GET /api/v1/usuarios`, `GET /api/v1/usuarios/{id}` e `PATCH /api/v1/usuarios/{id}/senha` funcionando.
- `ApiExceptionHandler`, `ErrorResponseDto`, `CorrelationIdFilter`, `SecurityConfig`, JWT e auditoria autenticada ja existentes.
- Postgres local disponivel:

```bash
cd <sep-api-root>
docker compose up -d postgres
```

- Branch de trabalho sugerida:

```bash
cd <sep-api-root>
git checkout develop
git pull --ff-only
git checkout -b feature/sprint-4-erros-docs-testes
```

---

## Task 4.1 - Evoluir `ApiExceptionHandler` e handlers de seguranca

**Objetivo**: padronizar todas as respostas de erro da API, incluindo erros vindos do Spring Security antes de chegarem ao MVC.

### Step 4.1.1 - Revisar o payload padrao

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/shared/exception/ErrorResponseDto.java`

**Comportamento esperado**:

- Manter o record com:
  - `OffsetDateTime timestamp`
  - `int status`
  - `String error`
  - `String message`
  - `String path`
  - `String traceId`
- Manter `@JsonInclude(JsonInclude.Include.NON_NULL)`.
- Manter factory `of(...)`.
- Usar `CorrelationIdFilter.MDC_KEY` como origem semantica do `traceId`.

**Decisao**: nao renomear `correlationId` no MDC. O JSON continua expondo o campo `traceId`, preenchido com o valor de `MDC.get(CorrelationIdFilter.MDC_KEY)`.

### Step 4.1.2 - Evoluir `ApiExceptionHandler`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/shared/exception/ApiExceptionHandler.java`

**Mudancas obrigatorias**:

- Substituir comentario de "stub da Sprint 1" por descricao de handler consolidado.
- Centralizar o acesso ao trace id com `CorrelationIdFilter.MDC_KEY`.
- Manter handlers existentes e ajustar mensagens:
  - `MethodArgumentNotValidException` -> `400`
  - `HttpMessageNotReadableException` -> `400`
  - `DataIntegrityViolationException` -> `409`
  - `NoHandlerFoundException` e `NoResourceFoundException` -> `404`
  - `DomainException` -> `400`, `404` ou `409` conforme subtipo
  - `AccessDeniedException` -> `403`
  - `AuthenticationException` -> `401`
  - fallback `Exception` -> `500`
- Para `DataIntegrityViolationException`, retornar mensagem amigavel para `username` duplicado quando a causa mencionar `usuario_username_key` ou `username`.
- No fallback `500`, logar excecao completa no servidor e responder mensagem generica sem stacktrace.

**Mensagem sugerida para fallback 500**:

```text
Erro interno. Consulte o suporte com o traceId.
```

**Regra**: nao expor stacktrace, nome de classe Java ou mensagem SQL bruta no response.

### Step 4.1.3 - Criar `ApiAuthenticationEntryPoint`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/identity/infrastructure/security/ApiAuthenticationEntryPoint.java`

**Comportamento**:

- Implementa `AuthenticationEntryPoint`.
- Escreve JSON `ErrorResponseDto` com:
  - `status = 401`
  - `error = "Unauthorized"`
  - `message = "Autenticacao requerida"`
  - `path = request.getRequestURI()`
  - `traceId = MDC.get(CorrelationIdFilter.MDC_KEY)`
- Usa `ObjectMapper` para serializar.
- Seta `Content-Type: application/json`.
- Nao chama `sendError`, para evitar HTML/default response.

### Step 4.1.4 - Criar `ApiAccessDeniedHandler`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/identity/infrastructure/security/ApiAccessDeniedHandler.java`

**Comportamento**:

- Implementa `AccessDeniedHandler`.
- Escreve JSON `ErrorResponseDto` com:
  - `status = 403`
  - `error = "Forbidden"`
  - `message = "Acesso negado"`
  - `path = request.getRequestURI()`
  - `traceId = MDC.get(CorrelationIdFilter.MDC_KEY)`
- Usa `ObjectMapper` e `Content-Type: application/json`.

### Step 4.1.5 - Atualizar `SecurityConfig`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/identity/infrastructure/config/SecurityConfig.java`

**Mudancas**:

- Injetar `ApiAuthenticationEntryPoint`.
- Injetar `ApiAccessDeniedHandler`.
- Configurar:

```java
.exceptionHandling(ex -> ex
    .authenticationEntryPoint(apiAuthenticationEntryPoint)
    .accessDeniedHandler(apiAccessDeniedHandler))
```

- Manter rotas publicas ja existentes:
  - Actuator
  - `/v3/api-docs/**`
  - `/swagger-ui.html`
  - `/swagger-ui/**`
  - `POST /api/v1/usuarios`
  - `POST /api/v1/auth/login`
- Manter `JwtAuthenticationFilter` antes de `UsernamePasswordAuthenticationFilter`.

**Aceite**: rota protegida sem token deve retornar `401` com `ErrorResponseDto`, nao `403` default.

### Step 4.1.6 - Criar testes do handler completo e security handlers

**Arquivos**:

- `<sep-api-root>/src/test/java/com/dynamis/sep_api/shared/exception/ApiExceptionHandlerCompletoTest.java`
- `<sep-api-root>/src/test/java/com/dynamis/sep_api/identity/infrastructure/security/ApiAuthenticationEntryPointTest.java`
- `<sep-api-root>/src/test/java/com/dynamis/sep_api/identity/infrastructure/security/ApiAccessDeniedHandlerTest.java`

**Cenarios minimos**:

1. DTO invalido retorna `400` com `timestamp`, `status`, `error`, `message`, `path`.
2. Body invalido retorna `400`.
3. Username duplicado retorna `409` com mensagem amigavel.
4. `UsuarioNaoEncontradoException` retorna `404`.
5. `SenhaAtualIncorretaException` retorna `400`.
6. `AccessDeniedException` retorna `403`.
7. `BadCredentialsException` retorna `401`.
8. Excecao generica retorna `500` sem stacktrace.
9. `ApiAuthenticationEntryPoint` serializa `ErrorResponseDto` em `401`.
10. `ApiAccessDeniedHandler` serializa `ErrorResponseDto` em `403`.

**Verificacao**:

```bash
./gradlew test \
  --tests "*ApiExceptionHandlerCompletoTest" \
  --tests "*ApiAuthenticationEntryPointTest" \
  --tests "*ApiAccessDeniedHandlerTest"
```

### Definicao de pronto da Task 4.1

- [ ] Todos os erros retornam `ErrorResponseDto`.
- [ ] Sem token em rota protegida retorna `401` padronizado.
- [ ] Usuario sem permissao retorna `403` padronizado.
- [ ] `traceId` vem do MDC/correlation id.
- [ ] Stacktrace nao aparece em response.

### Commit sugerido

```bash
git add src/main/java/com/dynamis/sep_api/shared/exception/ \
        src/main/java/com/dynamis/sep_api/identity/infrastructure/security/ \
        src/main/java/com/dynamis/sep_api/identity/infrastructure/config/SecurityConfig.java \
        src/test/java/com/dynamis/sep_api/shared/exception/ \
        src/test/java/com/dynamis/sep_api/identity/infrastructure/security/
git commit -m "feat(backend): padronizar erros e handlers de seguranca"
```

---

## Task 4.2 - Springdoc OpenAPI e Swagger UI

**Objetivo**: documentar auth, usuarios e webhooks com schemas, exemplos e security scheme Bearer JWT.

### Step 4.2.1 - Criar `OpenApiConfig`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/shared/config/OpenApiConfig.java`

**Conteudo esperado**:

- Bean `OpenAPI`.
- `Info`:
  - title: `SEP API`
  - version: `0.0.1`
  - description: `API REST da plataforma SEP`
- `SecurityScheme`:
  - name: `bearerAuth`
  - type: `HTTP`
  - scheme: `bearer`
  - bearerFormat: `JWT`
- `SecurityRequirement` global para `bearerAuth`.

**Observacao**: endpoints publicos continuam liberados no Spring Security; o security scheme global serve para habilitar o botao `Authorize`.

### Step 4.2.2 - Revisar propriedades Springdoc

**Arquivo**: `<sep-api-root>/src/main/resources/application.yml`

**Garantir**:

- `/v3/api-docs` habilitado.
- Swagger UI em `/swagger-ui.html`.
- Ordenacao de operacoes por metodo.
- Tags ordenadas alfabeticamente.

**Nao remover** as liberacoes de docs em `SecurityConfig`.

### Step 4.2.3 - Anotar `AuthController`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/identity/web/controller/AuthController.java`

**Anotacoes esperadas**:

- `@Tag(name = "auth", description = "Autenticacao e usuario autenticado")`
- `@Operation` em:
  - `POST /api/v1/auth/login`
  - `GET /api/v1/auth/me`
- `@ApiResponse` para:
  - `200`
  - `400` quando request invalido
  - `401` quando credenciais invalidas ou token ausente

**Regra**: exemplos devem usar `username`, `password`, `accessToken`, `tokenType`, `expiresIn` conforme PRD.

### Step 4.2.4 - Anotar `UsuarioController`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/usuarios/web/controller/UsuarioController.java`

**Anotacoes esperadas**:

- `@Tag(name = "usuarios", description = "Cadastro e gestao de usuarios")`
- `@Operation` para:
  - criar usuario
  - buscar por id
  - listar usuarios
  - alterar senha
- `@ApiResponse` para:
  - `200`, `201`, `204`
  - `400`
  - `401`
  - `403`
  - `404`
  - `409`

**Regra**: nao expor `password` no schema de response.

### Step 4.2.5 - Adicionar exemplos nos DTOs quando util

**Arquivos principais**:

- `<sep-api-root>/src/main/java/com/dynamis/sep_api/usuarios/web/dto/UsuarioCreateDto.java`
- `<sep-api-root>/src/main/java/com/dynamis/sep_api/usuarios/web/dto/UsuarioResponseDto.java`
- `<sep-api-root>/src/main/java/com/dynamis/sep_api/usuarios/web/dto/UsuarioSenhaUpdateDto.java`
- `<sep-api-root>/src/main/java/com/dynamis/sep_api/identity/web/dto/LoginRequestDto.java`
- `<sep-api-root>/src/main/java/com/dynamis/sep_api/identity/web/dto/TokenResponseDto.java`
- `<sep-api-root>/src/main/java/com/dynamis/sep_api/shared/exception/ErrorResponseDto.java`

**Preferencia**:

- Usar `@Schema` nos records e campos quando isso melhorar a Swagger UI.
- Manter exemplos coerentes com PRD:
  - UUID v6 canonico.
  - datas ISO-8601 com offset.
  - roles `ADMIN` e `CLIENTE`.

### Step 4.2.6 - Criar teste OpenAPI

**Arquivo**: `<sep-api-root>/src/test/java/com/dynamis/sep_api/shared/config/OpenApiConfigTest.java`

**Cenarios minimos**:

1. `GET /v3/api-docs` retorna `200`.
2. JSON contem `bearerAuth`.
3. JSON contem paths:
   - `/api/v1/auth/login`
   - `/api/v1/auth/me`
   - `/api/v1/usuarios`
   - `/api/v1/usuarios/{id}`
   - `/api/v1/usuarios/{id}/senha`
4. JSON contem schemas dos DTOs principais.

**Verificacao**:

```bash
./gradlew test --tests "*OpenApiConfigTest"
```

### Definicao de pronto da Task 4.2

- [ ] Swagger UI abre em profile `dev`.
- [ ] Botao `Authorize` aceita token JWT.
- [ ] Auth e usuarios aparecem em tags separadas.
- [ ] Schemas dos DTOs batem com o PRD.
- [ ] ErrorResponseDto aparece como schema de erro.

### Commit sugerido

```bash
git add src/main/java/com/dynamis/sep_api/shared/config/ \
        src/main/java/com/dynamis/sep_api/identity/web/ \
        src/main/java/com/dynamis/sep_api/usuarios/web/ \
        src/main/java/com/dynamis/sep_api/shared/exception/ErrorResponseDto.java \
        src/main/resources/application.yml \
        src/test/java/com/dynamis/sep_api/shared/config/
git commit -m "docs(backend): documentar API com OpenAPI e Swagger"
```

---

## Task 4.3 - Cobertura JaCoCo e smoke E2E

**Objetivo**: ativar o gate de cobertura de 70% e adicionar smoke E2E do fluxo principal da API usando PostgreSQL local via Docker Compose.

### Step 4.3.1 - Medir cobertura atual

**Comando**:

```bash
./gradlew test jacocoTestReport
```

**Relatorio**:

```text
<sep-api-root>/build/reports/jacoco/html/index.html
```

**Acao**:

- Identificar classes abaixo do alvo efetivo.
- Priorizar testes de comportamento em use cases, filtros, handlers, validators e controller slices.
- Nao criar testes apenas para cobrir getters/setters ou DTOs simples.

### Step 4.3.2 - Ativar verification rule no JaCoCo

**Arquivo**: `<sep-api-root>/build.gradle`

**Mudancas**:

- Em `jacocoTestCoverageVerification`, alterar a regra principal para:

```groovy
enabled = true
```

- Ativar:

```groovy
check.dependsOn 'jacocoTestCoverageVerification'
```

**Manter exclusoes ja existentes**:

- `SepApiApplication`
- `config`
- `dto`
- `*MapperImpl`
- `package-info`
- exceptions simples

### Step 4.3.3 - Criar `SmokeE2ETest`

**Arquivo**: `<sep-api-root>/src/test/java/com/dynamis/sep_api/SmokeE2ETest.java`

**Configuracao**:

- `@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)`
- `@ActiveProfiles("dev")`
- RestAssured com `@LocalServerPort`.
- Requer PostgreSQL local via Docker Compose.
- Usar usernames unicos por teste, por exemplo com UUID no local-part do e-mail.

**Cenarios no mesmo fluxo**:

1. Criar admin com `POST /api/v1/usuarios` -> `201`.
2. Criar cliente com `POST /api/v1/usuarios` -> `201`.
3. Login admin -> `200`, capturar `accessToken`.
4. Login cliente -> `200`, capturar `accessToken`.
5. `/api/v1/auth/me` com token admin -> `200`.
6. `GET /api/v1/usuarios` com token admin -> `200`.
7. `GET /api/v1/usuarios` com token cliente -> `403`.
8. `PATCH /api/v1/usuarios/{clienteId}/senha` com token cliente -> `204`.
9. `PATCH /api/v1/usuarios/{adminId}/senha` com token cliente -> `403`.

**Regra**: smoke E2E valida integracao real, nao substitui testes unitarios/slice existentes.

### Step 4.3.4 - Complementar lacunas de cobertura

**Possiveis alvos**:

- `ApiAuthenticationEntryPoint`
- `ApiAccessDeniedHandler`
- `HmacSignatureValidator` quando criado na Task 4.4
- `RegistrarWebhookEventUseCase` quando criado na Task 4.4
- casos negativos do `JwtAuthenticationFilter`
- mensagens especificas do `ApiExceptionHandler`

**Criterio**:

- Criar testes apenas onde houver comportamento relevante ou risco de regressao.
- Evitar inflar cobertura com testes que apenas instanciam records.

### Step 4.3.5 - Verificacao final da task

**Comando**:

```bash
./gradlew test jacocoTestReport jacocoTestCoverageVerification
```

**Tambem validar**:

```bash
./gradlew check
```

### Step 4.3.6 - Manter CI em duas etapas

**Arquivo**: `<sep-api-root>/.github/workflows/ci.yml`

**Estrutura esperada**:

- Job `test`:
  - roda em push para `feature/**`, `develop` e `main`;
  - roda em PR para `develop` e `main`;
  - sobe PostgreSQL 16 como service container;
  - executa `spotlessCheck`;
  - executa `test jacocoTestCoverageVerification`;
  - publica artifacts de testes e JaCoCo.
- Job `build`:
  - depende de `test`;
  - executa `bootJar`;
  - publica o JAR como artifact.

**Regra**: nao adicionar build/push de imagem Docker, GHCR ou deploy remoto nesta sprint. Isso pertence a Epic 16 / infraestrutura futura.

### Definicao de pronto da Task 4.3

- [ ] JaCoCo verification rule ativa.
- [ ] `check` depende de `jacocoTestCoverageVerification`.
- [ ] Cobertura >= 70%.
- [ ] Smoke E2E passa com Postgres local.
- [ ] CI separado em `test` -> `build`, sem deploy.
- [ ] Suite completa verde.

### Commit sugerido

```bash
git add build.gradle src/test/java/com/dynamis/sep_api/
git commit -m "test(backend): ativar cobertura e smoke e2e"
```

---

## Task 4.4 - Webhook Receiver Pattern

**Objetivo**: adicionar receptor generico de webhooks em `shared`, com assinatura HMAC, idempotencia por `Idempotency-Key` e registro outbox stub para processamento futuro.

### Step 4.4.1 - Criar migration `webhook_event_log`

**Arquivo**: `<sep-api-root>/src/main/resources/db/migration/V3__criar_webhook_event_log.sql`

**Tabela esperada**:

- `id uuid PRIMARY KEY`
- `provider varchar(50) NOT NULL`
- `event varchar(100) NOT NULL`
- `idempotency_key varchar(120) NOT NULL`
- `signature varchar(512)`
- `payload jsonb NOT NULL`
- `status varchar(30) NOT NULL`
- `erro text`
- `data_recebimento timestamp with time zone NOT NULL`
- `data_processamento timestamp with time zone`
- `data_criacao timestamp with time zone NOT NULL`
- `data_modificacao timestamp with time zone NOT NULL`
- `criado_por varchar(50) NOT NULL`
- `modificado_por varchar(50) NOT NULL`
- unique constraint em `idempotency_key`

**Status inicial**: `PENDENTE`.

**Decisao**: unique apenas em `idempotency_key`, conforme spec. Se no futuro algum provider puder repetir chave entre eventos diferentes, criar ADR/ajuste de contrato.

### Step 4.4.2 - Criar entidade `WebhookEventLog`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/shared/domain/model/WebhookEventLog.java`

**Comportamento**:

- Entidade JPA no schema da tabela `webhook_event_log`.
- Extende `EntidadeAuditavel`.
- Gera UUID v6 com `Generators.timeBasedReorderedGenerator()`.
- Factory estatica `registrar(...)` criando evento `PENDENTE`.
- Campos:
  - `UUID id`
  - `String provider`
  - `String event`
  - `String idempotencyKey`
  - `String signature`
  - `String payload`
  - `WebhookEventStatus status`
  - `String erro`
  - `OffsetDateTime dataRecebimento`
  - `OffsetDateTime dataProcessamento`

**Observacao**: persistir payload como `jsonb`. No Java, usar `String payload` nesta sprint para manter o receiver generico e simples.

### Step 4.4.3 - Criar enum `WebhookEventStatus`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/shared/domain/model/WebhookEventStatus.java`

**Valores iniciais**:

```java
PENDENTE,
PROCESSADO,
FALHOU
```

**Regra**: Sprint 4 grava apenas `PENDENTE`. Demais status ficam prontos para Epics futuras.

### Step 4.4.4 - Criar repository

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/shared/infrastructure/persistence/WebhookEventLogRepository.java`

**Metodos**:

```java
boolean existsByIdempotencyKey(String idempotencyKey);
Optional<WebhookEventLog> findByIdempotencyKey(String idempotencyKey);
```

### Step 4.4.5 - Criar DTO de envelope

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/shared/web/dto/WebhookEnvelopeDto.java`

**Contrato**:

```java
public record WebhookEnvelopeDto(
    String provider,
    String event,
    String idempotencyKey,
    String payload
) {}
```

**Uso**: response interno/testes e documentacao. O endpoint recebe o body bruto como `String` para validar assinatura sobre o payload original.

### Step 4.4.6 - Criar porta `WebhookSignatureValidator`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/shared/application/port/out/WebhookSignatureValidator.java`

**Assinatura**:

```java
boolean isValid(String provider, String payload, String signature);
```

### Step 4.4.7 - Criar `HmacSignatureValidator`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/shared/infrastructure/adapter/HmacSignatureValidator.java`

**Comportamento**:

- Implementa `WebhookSignatureValidator`.
- Le secrets por provider via propriedades `app.webhooks.secrets`.
- Algoritmo: `HmacSHA256`.
- Header esperado: hash hexadecimal lowercase.
- Comparacao deve usar `MessageDigest.isEqual(...)`.
- Se provider nao tiver secret configurado, considerar assinatura invalida e logar warning sem expor secret.

**Propriedade sugerida em `application.yml`**:

```yaml
app:
  webhooks:
    secrets:
      celcoin: ${APP_WEBHOOK_SECRET_CELCOIN:dev-webhook-secret-change-me}
```

### Step 4.4.8 - Criar `RegistrarWebhookEventUseCase`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/shared/application/usecase/RegistrarWebhookEventUseCase.java`

**Assinatura sugerida**:

```java
@Transactional
public boolean executar(String provider, String event, String idempotencyKey, String signature, String payload)
```

**Comportamento**:

- Validar `provider`, `event`, `idempotencyKey` e `payload` nao vazios.
- Se `idempotencyKey` ja existir, retornar `false` sem criar novo registro.
- Criar `WebhookEventLog.registrar(...)`.
- Persistir no repository.
- Retornar `true` quando novo evento for gravado.

**Regra de concorrencia**:

- A unique constraint no banco e a garantia final.
- Se ocorrer `DataIntegrityViolationException` por corrida de idempotencia, tratar como duplicado idempotente e retornar `false`.

### Step 4.4.9 - Criar `WebhookController`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/shared/web/controller/WebhookController.java`

**Endpoint**:

```text
POST /api/v1/webhooks/{provider}/{event}
```

**Headers**:

- `Idempotency-Key`: obrigatorio.
- `X-Webhook-Signature`: obrigatorio.

**Comportamento**:

- Receber body bruto como `String`.
- Validar headers obrigatorios; ausentes retornam `400` via `ValidacaoException` ou `ResponseStatusException`.
- Validar assinatura com `WebhookSignatureValidator`.
- Assinatura invalida retorna `401`.
- Chamar `RegistrarWebhookEventUseCase`.
- Retornar `202 Accepted` tanto para evento novo quanto para duplicado idempotente.

**OpenAPI**:

- Anotar com `@Tag(name = "webhooks")`.
- Documentar headers, `202`, `400`, `401`.

### Step 4.4.10 - Liberar endpoint de webhook no `SecurityConfig`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/identity/infrastructure/config/SecurityConfig.java`

**Mudanca**:

- Liberar:

```java
.requestMatchers(HttpMethod.POST, "/api/v1/webhooks/**").permitAll()
```

**Justificativa**: webhooks autenticam por assinatura HMAC, nao por JWT.

### Step 4.4.11 - Criar testes do webhook

**Arquivos**:

- `<sep-api-root>/src/test/java/com/dynamis/sep_api/shared/infrastructure/adapter/HmacSignatureValidatorTest.java`
- `<sep-api-root>/src/test/java/com/dynamis/sep_api/shared/application/usecase/RegistrarWebhookEventUseCaseTest.java`
- `<sep-api-root>/src/test/java/com/dynamis/sep_api/shared/web/controller/WebhookControllerTest.java`

**Cenarios minimos**:

1. HMAC valido retorna `true`.
2. HMAC invalido retorna `false`.
3. Provider sem secret retorna `false`.
4. Use case grava evento novo como `PENDENTE`.
5. Use case trata idempotency key duplicada sem novo registro.
6. Controller retorna `202` para evento novo.
7. Controller retorna `202` para evento duplicado.
8. Controller retorna `400` sem `Idempotency-Key`.
9. Controller retorna `400` sem `X-Webhook-Signature`.
10. Controller retorna `401` com assinatura invalida.

**Verificacao**:

```bash
./gradlew test \
  --tests "*HmacSignatureValidatorTest" \
  --tests "*RegistrarWebhookEventUseCaseTest" \
  --tests "*WebhookControllerTest"
```

### Definicao de pronto da Task 4.4

- [ ] Migration `V3` criada e validada pelo Flyway.
- [ ] Webhook grava eventos novos como `PENDENTE`.
- [ ] Idempotencia impede registro duplicado.
- [ ] Assinatura HMAC invalida retorna `401`.
- [ ] Headers ausentes retornam `400`.
- [ ] Endpoint retorna `202` para evento aceito ou duplicado idempotente.

### Commit sugerido

```bash
git add src/main/resources/db/migration/V3__criar_webhook_event_log.sql \
        src/main/java/com/dynamis/sep_api/shared/ \
        src/main/java/com/dynamis/sep_api/identity/infrastructure/config/SecurityConfig.java \
        src/main/resources/application.yml \
        src/test/java/com/dynamis/sep_api/shared/
git commit -m "feat(backend): adicionar webhook receiver pattern"
```

---

## Verificacao final da Sprint 4

### Suite automatizada

```bash
cd <sep-api-root>
docker compose up -d postgres
./gradlew clean test jacocoTestReport jacocoTestCoverageVerification
./gradlew check
```

### Smoke manual de erros

```bash
curl -i http://localhost:8080/api/v1/auth/me
```

Esperado: `401` com `ErrorResponseDto`.

```bash
curl -i -X POST http://localhost:8080/api/v1/usuarios \
  -H 'Content-Type: application/json' \
  -d '{"username":"email-invalido","password":"123","role":"CLIENTE"}'
```

Esperado: `400` com `ErrorResponseDto`.

### Smoke manual Swagger

1. Subir a API em profile `dev`.
2. Abrir `/swagger-ui.html`.
3. Confirmar tags `auth`, `usuarios` e `webhooks`.
4. Fazer login por `/api/v1/auth/login`.
5. Clicar em `Authorize`, colar o JWT.
6. Executar `/api/v1/auth/me`.

### Smoke manual webhook

1. Gerar assinatura HMAC-SHA256 hexadecimal do body usando o secret dev.
2. Enviar `POST /api/v1/webhooks/celcoin/pagamento_recebido`.
3. Repetir a mesma chamada com a mesma `Idempotency-Key`.
4. Confirmar que ambas retornam `202`.
5. Consultar banco e confirmar apenas 1 registro em `webhook_event_log`.

## Definicao de pronto da Sprint 4

- [ ] `ApiExceptionHandler` consolidado.
- [ ] `AuthenticationEntryPoint` e `AccessDeniedHandler` retornam JSON padronizado.
- [ ] `traceId` preenchido a partir do correlation id.
- [ ] Swagger UI acessivel em `dev`.
- [ ] OpenAPI documenta auth, usuarios e webhooks.
- [ ] JaCoCo 70% ativo e bloqueante.
- [ ] Smoke E2E passa com Postgres local.
- [ ] Webhook Receiver Pattern implementado com HMAC, idempotencia e outbox stub.
- [ ] `./gradlew clean test jacocoTestReport jacocoTestCoverageVerification` verde.
- [ ] `./gradlew check` verde.

## Referencias

- [PRD - API SEP](../../docs-sep/PRD.md), Secoes 13, 17, 22, 23 e 24
- [CONTEXT.md](../../docs-sep/CONTEXT.md)
- [Spec 001](../../specs/fase-1/001-sprint-1-fundacao-tecnica.md)
- [Spec 002](../../specs/fase-1/002-sprint-2-gestao-usuarios.md)
- [Spec 003](../../specs/fase-1/003-sprint-3-seguranca-autenticacao.md)
- [Spec 004](../../specs/fase-1/004-sprint-4-erros-docs-testes.md)
