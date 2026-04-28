# Spec 001 - Sprint 1 - Fundacao Tecnica

## Metadados

- **ID da Spec**: 001
- **Titulo**: Sprint 1 - Fundacao Tecnica da API SEP
- **Status**: aprovada para execucao
- **Fase do produto**: Epic 1 - Fundacao da API
- **Origem**: PRD - API SEP, Secao 22 (Backlog Tecnico Implementavel)
- **Responsavel principal**: Dev Senior
- **Equipe sugerida**: 1 Dev Senior (ownership), 2 Devs Plenos Frontend (entregaveis paralelos de preparacao)

## Objetivo

Entregar a fundacao tecnica do backend SEP, provendo o alicerce sobre o qual as sprints posteriores irao construir as jornadas de produto. Ao final desta sprint, a aplicacao Spring Boot deve subir localmente, com PostgreSQL em Docker, Flyway aplicando migrations no boot, configuracao regional do Brasil, CORS previsto para integracao futura com Angular e endpoint de saude exposto via Actuator.

## Escopo

### Em escopo
- projeto Java 21 + Spring Boot 3.x configurado com Gradle
- profile `dev` funcional com `application-dev.yml`
- dependencias principais resolvidas: web, security, data-jpa, actuator, validation, flyway, springdoc, mapstruct (substitui modelmapper), java-uuid-generator, resilience4j, micrometer-prometheus, testcontainers
- PostgreSQL local via Docker Compose
- configuracao de locale `pt-BR` e timezone `America/Sao_Paulo`
- CORS basico configurado no `SecurityConfig`
- Actuator exposto com endpoint de healthcheck
- Flyway ativo com migration inicial versionada

### Fora de escopo nesta spec
- entidade `Usuario`, DTOs e controllers (Sprint 2)
- seguranca JWT, BCrypt e login (Sprint 3)
- evolucao do `ApiExceptionHandler` (stub e criado nesta Sprint 1; mapeamento completo na Sprint 4)
- Springdoc documentado em detalhe (Sprint 4 — config minima ja entra em Task 1.1c)
- regra de negocio do modulo `escrow` (apenas modelagem nesta Sprint; logica fica para Epic 15)
- qualquer outra regra de negocio de dominio
- deploy remoto e CI/CD avancado (CI minimo ja vem da Sprint 0)

## Pre-requisitos globais

- PRD aprovado para a stack backend
- Java 21 instalado localmente
- Docker e Docker Compose funcionais na maquina do desenvolvedor
- Gradle Wrapper definido ou planejado para o projeto
- acesso ao repositorio backend

## Tasks

### Task 1.1a - Projeto Gradle e estrutura inicial de pacotes DDD

**Descricao**
Inicializar o projeto Spring Boot com Gradle, definir o Wrapper e criar a arvore de pacotes do monolito modular DDD com `package-info.java` por modulo.

**Arquivos esperados**
- `build.gradle` (esqueleto)
- `settings.gradle`
- `gradle/wrapper/gradle-wrapper.properties` (Gradle `8.x`)
- `src/main/java/com/dynamis/broker_app/{identity,usuarios,onboarding,credito,contratos,cobranca,escrow,backoffice,financeiro,credores,pix,shared}/{domain,application,infrastructure,web}/package-info.java`

**Padrao interno de cada modulo (Hexagonal/Ports & Adapters)**
- `<modulo>.domain.{model,event,exception,vo}`
- `<modulo>.application.{usecase,port.out,service}`
- `<modulo>.infrastructure.{persistence,adapter,config}`
- `<modulo>.web.{controller,dto,mapper}`

**Criterios de verificacao**
- `./gradlew --version` confirma Gradle 8.x
- estrutura de pacotes existe e compila vazia
- cada `package-info.java` documenta a responsabilidade do pacote

**Pre-requisitos**
- PRD aprovado, Sprint 0 com Spotless e CI prontos
- Java 21 disponivel

**Dependencias**
- nenhuma

**Responsavel sugerido**
- Dev Senior

---

### Task 1.1b - Dependencias do Gradle (versoes pinadas)

**Descricao**
Declarar todas as dependencias necessarias para sustentar as Sprints 1-4 e a arquitetura definida no PRD §11, com versoes pinadas explicitas.

**Dependencias obrigatorias (versoes pinadas)**
```gradle
plugins {
    id 'org.springframework.boot' version '3.5.x' // pinar minor mais recente
    id 'io.spring.dependency-management' version '1.1.x'
    id 'com.diffplug.spotless' version '6.x'
    id 'jacoco'
}

dependencies {
    // Spring Boot starters
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-security'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    implementation 'org.springframework.boot:spring-boot-starter-actuator'

    // Persistencia
    implementation 'org.flywaydb:flyway-core'
    implementation 'org.flywaydb:flyway-database-postgresql'
    runtimeOnly 'org.postgresql:postgresql'

    // JWT
    implementation 'io.jsonwebtoken:jjwt-api:0.12.6'
    runtimeOnly 'io.jsonwebtoken:jjwt-impl:0.12.6'
    runtimeOnly 'io.jsonwebtoken:jjwt-jackson:0.12.6'

    // Documentacao
    implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:2.6.0'

    // Mapeamento (substitui ModelMapper)
    implementation 'org.mapstruct:mapstruct:1.6.x'
    annotationProcessor 'org.mapstruct:mapstruct-processor:1.6.x'

    // UUID v6
    implementation 'com.fasterxml.uuid:java-uuid-generator:5.1.0'

    // Resiliencia (Celcoin)
    implementation 'io.github.resilience4j:resilience4j-spring-boot3:2.x'

    // Observabilidade
    implementation 'io.micrometer:micrometer-registry-prometheus'

    // Logs estruturados
    implementation 'net.logstash.logback:logstash-logback-encoder:8.0'

    // Testes
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'org.springframework.security:spring-security-test'
    testImplementation 'org.testcontainers:junit-jupiter:1.20.x'
    testImplementation 'org.testcontainers:postgresql:1.20.x'
    testImplementation 'io.rest-assured:rest-assured:5.5.x'

    // WireMock para integration tests dos adapters HTTP de Celcoin (ADR 0008)
    testImplementation 'org.wiremock:wiremock-standalone:3.9.2'
    testImplementation 'org.wiremock.integrations:wiremock-spring-boot:3.1.0'
}
```

**Decisoes ja consolidadas (ver PRD §18)**
- **MapStruct** substitui ModelMapper (type-safe, gera codigo)
- **Testcontainers** com PostgreSQL real, sem H2
- **WireMock 3.x** para integration tests dos adapters HTTP de Celcoin (ADR 0008)
- **Resilience4j** para circuit breaker/retry/timeout (preparacao Celcoin)
- **Micrometer + Prometheus** para metricas
- JWT pinado em `0.12.x` (API + Impl + Jackson)

**Criterios de verificacao**
- `./gradlew dependencies` resolve todas sem conflito
- `./gradlew build` compila vazio sem erro
- Annotation processor do MapStruct ativo

**Pre-requisitos**
- Task 1.1a concluida

**Dependencias**
- depende de Task 1.1a

**Responsavel sugerido**
- Dev Senior

---

### Task 1.1c - application.yml e profiles

**Descricao**
Configurar `application.yml` (defaults) e `application-dev.yml` (perfil de desenvolvimento), incluindo conexao com PostgreSQL, Flyway, Actuator, Jackson (timezone + ISO-8601), Springdoc, e propriedades do JWT (placeholders, valores reais ficam em variaveis de ambiente).

**Arquivos esperados**
- `src/main/resources/application.yml`
- `src/main/resources/application-dev.yml`
- `src/main/resources/application-test.yml` (para Testcontainers)

**Configuracoes obrigatorias**
- `spring.profiles.default: dev`
- `spring.datasource` (variaveis de ambiente para credenciais)
- `spring.jpa.hibernate.ddl-auto: validate` (Flyway gerencia schema)
- `spring.jackson.time-zone: America/Sao_Paulo`
- `spring.jackson.serialization.write-dates-with-zone-id: true`
- `management.endpoints.web.exposure.include: health,info,metrics,prometheus`
- `springdoc.swagger-ui.path: /swagger-ui.html`
- `app.jwt.secret: ${APP_JWT_SECRET:placeholder-dev-only}`
- `app.jwt.expiration-seconds: ${APP_JWT_EXPIRATION:3600}`

**Criterios de verificacao**
- `./gradlew bootRun` sobe com profile `dev` sem erro
- `/actuator/health` responde `{"status":"UP"}`
- `/actuator/prometheus` expoe metricas
- `/swagger-ui.html` acessivel

**Pre-requisitos**
- Task 1.1b concluida

**Dependencias**
- depende de Task 1.1b

**Responsavel sugerido**
- Dev Senior

---

### Task 1.2 - PostgreSQL local com Docker Compose

**Descricao**
Prover o banco PostgreSQL local via Docker Compose, garantindo conexao estavel da aplicacao em profile `dev`.

**Arquivos esperados**
- `docker-compose.yml`

**Parametros recomendados**
- imagem oficial `postgres:16`
- banco `sep_dev`
- usuario e senha configuraveis por variavel de ambiente
- porta `5432` exposta
- volume nomeado para persistencia dos dados

**Criterios de verificacao**
- `docker compose up -d` sobe o banco sem erros
- aplicacao Spring Boot conecta no banco usando as credenciais do `application-dev.yml`
- volume persiste os dados entre `up` e `down` controlados

**Pre-requisitos**
- Task 1.1 concluida
- Docker funcional na maquina

**Dependencias**
- depende de Task 1.1

**Responsavel sugerido**
- Dev Senior

---

### Task 1.3 - Locale, Timezone, CORS e Actuator

**Descricao**
Configurar aspectos regionais e transversais da API: locale `pt-BR`, timezone `America/Sao_Paulo`, CORS preparado para integracao com o frontend Angular e endpoint de healthcheck via Actuator.

**Arquivos esperados**
- `config/LocaleConfig.java`
- `config/SecurityConfig.java` (apenas o bloco de CORS nesta task; o filtro JWT entra na Sprint 3)
- `src/main/resources/application.yml` (propriedades de Actuator e serializacao de datas)

**Criterios de verificacao**
- timezone do contexto da JVM e do Jackson alinhado a `America/Sao_Paulo`
- datas serializadas em ISO-8601 com offset (ex.: `2026-04-24T18:30:00-03:00`)
- locale default configurado como `pt-BR`
- CORS basico liberando a origem do frontend de desenvolvimento
- endpoint `/actuator/health` responde com `200 OK`

**Pre-requisitos**
- Task 1.1 concluida

**Dependencias**
- depende de Task 1.1
- pode ocorrer em paralelo com Task 1.2

**Responsavel sugerido**
- Dev Senior

---

### Task 1.4 - Flyway e migration inicial

**Descricao**
Ativar o Flyway e criar a migration inicial versionada, preparando o schema que sustentara a entidade `Usuario` da Sprint 2. A tabela inicial deve usar o tipo `uuid` nativo do PostgreSQL quando aplicavel.

**Arquivos esperados**
- `src/main/resources/db/migration/V1__init.sql`

**Conteudo minimo sugerido da V1**
- criacao da tabela base (ex.: `usuario`) com colunas em portugues
- identificador como `uuid` nativo do PostgreSQL
- constraints minimas compativeis com as regras do PRD (ex.: `username` unico, `role` obrigatorio)
- campos de auditoria JPA presentes: `data_criacao`, `data_modificacao`, `criado_por`, `modificado_por`

Observacao: a task pode optar por deixar apenas o esqueleto do schema da tabela `usuario`, com a populacao final de DTOs e service acontecendo na Sprint 2. A decisao fica a criterio do Dev Senior desde que a migration da Sprint 2 nao quebre a V1.

**Criterios de verificacao**
- schema inicial criado no boot da aplicacao
- `flyway_schema_history` populado com o registro da V1
- tabela inicial criada com tipo `uuid` nativo nas colunas de identificador

**Pre-requisitos**
- Task 1.1 concluida
- Task 1.2 concluida

**Dependencias**
- depende de Task 1.2
- idealmente apos Task 1.3 para alinhar configuracoes base

**Responsavel sugerido**
- Dev Senior

### Task 1.5 - ApiExceptionHandler stub e ErrorResponseDto

**Descricao**
Criar a base do tratamento centralizado de erros desde a Sprint 1 para evitar refatoracao tardia. Sprint 4 evolui esse handler com mapeamentos completos.

**Arquivos esperados**
- `src/main/java/com/dynamis/broker_app/shared/exception/ApiExceptionHandler.java`
- `src/main/java/com/dynamis/broker_app/shared/exception/ErrorResponseDto.java` (`record`)
- `src/main/java/com/dynamis/broker_app/shared/exception/DomainException.java` (sealed type para hierarquia de excecoes de dominio)

**Conteudo minimo**
- `ErrorResponseDto` como `record` com campos `timestamp`, `status`, `error`, `message`, `path`, `traceId` (opcional)
- `ApiExceptionHandler` com `@RestControllerAdvice` mapeando ao menos: `MethodArgumentNotValidException`, `DataIntegrityViolationException`, `Exception` (fallback)
- payload sempre em formato `ErrorResponseDto` para qualquer 4xx/5xx
- propagacao de `traceId` do MDC quando presente

**Criterios de verificacao**
- chamada a endpoint inexistente retorna `ErrorResponseDto` 404
- chamada com body invalido retorna `ErrorResponseDto` 400
- excecao nao tratada retorna `ErrorResponseDto` 500 com mensagem generica (sem stack trace)

**Pre-requisitos**
- Task 1.1c concluida

**Dependencias**
- depende de Task 1.1c

**Responsavel sugerido**
- Dev Senior

---

### Task 1.6 - Auditoria JPA base (EntidadeAuditavel + AuditorAware)

**Descricao**
Materializar a auditoria conforme PRD §15: criar entidade abstrata `EntidadeAuditavel` com os 4 campos obrigatorios, `AuditorAware` com fallback `system`, e habilitar `@EnableJpaAuditing`.

**Arquivos esperados**
- `src/main/java/com/dynamis/broker_app/shared/audit/EntidadeAuditavel.java` (mapped superclass com `@CreatedDate`, `@LastModifiedDate`, `@CreatedBy`, `@LastModifiedBy`)
- `src/main/java/com/dynamis/broker_app/shared/audit/AuditorAwareImpl.java`
- `src/main/java/com/dynamis/broker_app/shared/audit/JpaAuditingConfig.java` (`@EnableJpaAuditing(auditorAwareRef = "auditorAware")`)

**Comportamento do AuditorAware**
- se houver `Authentication` no `SecurityContext` com principal carregando UUID, retorna `Optional.of(uuidAsString)`
- caso contrario retorna `Optional.of("system")`
- nunca retorna `Optional.empty()` para garantir preenchimento de auditoria

**Criterios de verificacao**
- entidade que estende `EntidadeAuditavel` ganha automaticamente os 4 campos de auditoria persistidos
- criacao em contexto sem auth grava `criadoPor = "system"`
- atualizacao em contexto com auth (futura, Sprint 3) gravara o UUID do usuario

**Pre-requisitos**
- Task 1.1c concluida

**Dependencias**
- nenhuma (pode rodar em paralelo com Task 1.5)

**Responsavel sugerido**
- Dev Senior

---

### Task 1.7 - Estrutura de adapter para integracoes externas (shared.integration)

**Descricao**
Preparar a infraestrutura comum para o `Provider Pattern` definido no PRD §11: classes base de adapter HTTP (RestClient + Resilience4j), suporte a `Idempotency-Key`, propagacao de `correlationId` via MDC, e configuracao de `RestClient` por provider.

**Arquivos esperados**
- `src/main/java/com/dynamis/broker_app/shared/integration/RestClientFactory.java` (configura `RestClient` com timeouts, interceptors de log e MDC)
- `src/main/java/com/dynamis/broker_app/shared/integration/Resilience4jConfig.java` (configuracao default de circuit breaker + retry + timeout)
- `src/main/java/com/dynamis/broker_app/shared/integration/IdempotencyKeyInterceptor.java`
- `src/main/java/com/dynamis/broker_app/shared/integration/CorrelationIdFilter.java` (servlet filter que injeta `correlationId` no MDC para toda request)

**Criterios de verificacao**
- `RestClient` pode ser criado por nome (ex.: `restClientFactory.forProvider("celcoin")`)
- circuit breaker abre apos N falhas consecutivas configuravel
- requests externas levam header `Idempotency-Key` quando configurado
- logs de request/response incluem `correlationId` no MDC

**Estrategia de teste (preparacao para Epic 5+)**

A camada de adapter (`infrastructure.adapter.<X>`) sera testada com **WireMock 3.x** quando os primeiros `Celcoin<X>Provider` reais forem implementados (Epic 5 em diante). Padrao definido no [ADR 0008](../adr/0008-wiremock-para-testes-integracao-celcoin.md):

- arquivo de teste: `<modulo>.infrastructure.adapter.<X>.Celcoin<X>ProviderIT.java`
- anotacoes: `@SpringBootTest` + `@WireMockTest(httpPort = 8089)`
- stubs: `src/test/resources/wiremock/<provider>/mappings/*.json`
- cenarios obrigatorios por adapter: sucesso, erro 4xx, erro 5xx, retry em rate limit, timeout

Nesta Sprint 1, apenas a dependencia esta declarada (Task 1.1b). O primeiro uso real fica para a Task 4.4 (Webhook Receiver) e depois Epic 5.

**Pre-requisitos**
- Task 1.1c concluida

**Dependencias**
- nenhuma (pode rodar em paralelo com Tasks 1.5, 1.6)

**Responsavel sugerido**
- Dev Senior

---

### Task 1.8 - Modelagem inicial do modulo escrow

**Descricao**
Modelar as entidades transversais do modulo `escrow` (PRD §11, §19) desde a Sprint 1 para evitar retrabalho arquitetural quando o `EscrowProvider` (Celcoin) for plugado em fase posterior. Sem implementacao de regra de negocio nesta sprint — so estrutura.

**Arquivos esperados**
- `src/main/java/com/dynamis/broker_app/escrow/domain/model/ContaEscrow.java` (entidade JPA)
- `src/main/java/com/dynamis/broker_app/escrow/domain/model/Wallet.java` (sub-conta por proposta/operacao)
- `src/main/java/com/dynamis/broker_app/escrow/domain/model/MovimentacaoEscrow.java`
- `src/main/java/com/dynamis/broker_app/escrow/application/port/out/EscrowProvider.java` (interface vazia, sera implementada na Epic 15)
- `src/main/resources/db/migration/V2__criar_estrutura_escrow.sql` (tabelas correspondentes)

**Conteudo minimo das entidades**
- `ContaEscrow`: id (UUID v6), externalId (string, ID Celcoin), titular, status, dataCriacao, dataModificacao + auditoria (estende `EntidadeAuditavel`)
- `Wallet`: id, contaEscrow (FK), propostaId (UUID, opcional), tipoWallet (enum), saldo (BigDecimal), auditoria
- `MovimentacaoEscrow`: id, wallet (FK), tipo (sealed type ou enum: APORTE, DESEMBOLSO, RECEBIMENTO, RETIRADA), valor, idempotencyKey (unique), status, dataMovimentacao, auditoria

**Criterios de verificacao**
- entidades compilam e tabelas sao criadas pela V2 do Flyway
- `EscrowProvider` interface declarada (vazia, sem metodos ainda)
- modulo `escrow` documentado em `package-info.java`
- ADR `0005-segregacao-patrimonial-via-conta-escrow.md` referenciado

**Pre-requisitos**
- Task 1.4 concluida (Flyway + V1)
- Task 1.6 concluida (auditoria base disponivel)

**Dependencias**
- depende de Tasks 1.4 e 1.6

**Responsavel sugerido**
- Dev Senior

---

### Task 1.9 - Teste de boot e healthcheck

**Descricao**
Garantir que o contexto Spring carrega e que o healthcheck responde, com test slice apropriado e Testcontainers para a parte de banco. Inicia a cultura de TDD distribuido.

**Arquivos esperados**
- `src/test/java/com/dynamis/broker_app/SmokeBootTest.java` (`@SpringBootTest` com Testcontainers Postgres)
- `src/test/java/com/dynamis/broker_app/shared/exception/ApiExceptionHandlerTest.java` (`@WebMvcTest`)
- `src/test/resources/application-test.yml` (overrides para teste)

**Cenarios cobertos**
- Spring context loads sem erro
- `GET /actuator/health` responde `200 {"status":"UP"}`
- excecao nao tratada retorna `ErrorResponseDto` 500
- request com body invalido retorna `ErrorResponseDto` 400

**Criterios de verificacao**
- `./gradlew test` passa todos os testes
- JaCoCo report gerado em `build/reports/jacoco/`
- Testcontainers sobe Postgres real para o teste

**Pre-requisitos**
- Tasks 1.5, 1.6 concluidas

**Dependencias**
- depende de Tasks 1.5 e 1.6

**Responsavel sugerido**
- Dev Senior

---

## Grafo de dependencias entre as tasks

```
Task 1.1a (Gradle + estrutura)
   |
   +--> Task 1.1b (Dependencias) --> Task 1.1c (application.yml)
                                          |
                              +-----------+-----------+-----------+
                              |           |           |           |
                          Task 1.2   Task 1.3    Task 1.5    Task 1.6
                          (Postgres) (Locale)    (ApiExc)    (Auditoria)
                              |                                  |
                              +--------------+                   |
                                             v                   v
                                          Task 1.4 ---->  Task 1.8 (escrow)
                                             |                   |
                                             |          Task 1.7 (adapter pattern)
                                             |                   |
                                             +--------+----------+
                                                      v
                                                 Task 1.9 (testes de boot)
```

- Task 1.1a e a raiz; 1.1b/1.1c sequenciais.
- Tasks 1.2, 1.3, 1.5, 1.6, 1.7 podem rodar em paralelo apos Task 1.1c.
- Task 1.4 depende do banco (1.2).
- Task 1.8 (escrow) depende de 1.4 e 1.6.
- Task 1.9 (testes) consolida e fecha a sprint.

## Definicao de pronto (Sprint 1)

A Sprint 1 e considerada concluida quando todos os itens abaixo forem atendidos:

- projeto sobe com `./gradlew bootRun` sem erro em profile `dev`
- PostgreSQL sobe via `docker compose up -d` e a aplicacao conecta
- `/actuator/health` responde com status `UP`
- `/actuator/prometheus` expoe metricas
- `/swagger-ui.html` acessivel
- locale default e `pt-BR`, timezone `America/Sao_Paulo`
- CORS basico configurado para a origem do frontend de desenvolvimento
- Flyway aplica V1 (schema base) e V2 (escrow) no boot
- `flyway_schema_history` contem os registros V1 e V2
- estrutura de pacotes DDD criada com `package-info.java` por modulo
- `ApiExceptionHandler` stub funcional retorna `ErrorResponseDto` para 4xx/5xx
- `EntidadeAuditavel` + `AuditorAware` com fallback `system` funcionais
- `RestClientFactory` + `Resilience4jConfig` + `CorrelationIdFilter` em `shared.integration` operacionais
- Modulo `escrow` com entidades `ContaEscrow`, `Wallet`, `MovimentacaoEscrow` modeladas (sem regra de negocio implementada)
- `EscrowProvider` interface declarada em `escrow.application.port.out`
- Testes de boot e ApiExceptionHandler passando com Testcontainers
- Dependencias pinadas: Spring Boot 3.5.x, JJWT 0.12.x, MapStruct 1.6.x, Resilience4j 2.x

## Cenarios de verificacao manual

Ao final desta sprint, o desenvolvedor deve executar manualmente os seguintes cenarios:

- subir o banco via Docker Compose e confirmar conexao
- subir a aplicacao com profile `dev` e observar o log do Flyway aplicando a V1
- chamar `GET /actuator/health` e confirmar resposta `{"status":"UP"}`
- verificar no banco que a tabela `flyway_schema_history` contem a V1
- verificar no banco que a tabela inicial foi criada com coluna `id` do tipo `uuid`
- derrubar o banco com `docker compose down` e subir novamente, confirmando a persistencia do volume

## Impacto nas sprints seguintes

- **Sprint 2** (Gestao de Usuarios) depende desta spec para poder criar a entidade `Usuario` (estendendo `EntidadeAuditavel`), o repositorio e os DTOs (`record`) sobre o schema preparado aqui.
- **Sprint 3** (Seguranca JWT) depende das dependencias de JWT declaradas aqui, da configuracao base de `SecurityConfig`, do `CorrelationIdFilter` e do `AuditorAware` (que ganhara comportamento real com `Authentication`).
- **Sprint 4** (Estabilizacao) **evolui** o `ApiExceptionHandler` ja criado aqui, completa documentacao OpenAPI, fecha cobertura JaCoCo no target 70% e introduz o `Webhook Receiver Pattern`.
- **Epic 15** (Pix) reusa o modulo `escrow` modelado aqui, plugando o `EscrowProvider` Celcoin.

## Restricoes e regras de execucao

- commits podem ser feitos pelo agente de IA quando solicitado
- push e PR permanecem manuais nesta fase
- ao final de cada task, a execucao deve parar para teste local manual
- TDD distribuido: cada Sprint entrega testes correspondentes (Task 1.9 cobre o boot e ApiExceptionHandler nesta Sprint)
- GitHub Actions minimo (build + test + Spotless + JaCoCo) entra ja na Sprint 0; deploy remoto fica fora de escopo (planejado para a Epic 16 - Infraestrutura AWS futura)

## Referencias

- [PRD - API SEP](../docs-sep/PRD.md), Secao 22 - Backlog Tecnico Implementavel
- [CONTEXT.md](../docs-sep/CONTEXT.md) - historia das decisoes do projeto
- [documentacao-dev.html](../docs-sep/documentacao-dev.html) - documentacao tecnica consolidada com diagramas
