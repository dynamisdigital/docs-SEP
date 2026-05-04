# Steps - Sprint 1 - Fundacao Tecnica

**Spec de origem**: [`specs/fase-1/001-sprint-1-fundacao-tecnica.md`](../../specs/fase-1/001-sprint-1-fundacao-tecnica.md)

**Objetivo geral**: entregar a fundacao tecnica do backend SEP. Ao final, a aplicacao Spring Boot deve subir localmente, com PostgreSQL em Docker, Flyway aplicando migrations no boot, configuracao regional do Brasil, CORS previsto para Angular, healthcheck via Actuator, base de auditoria JPA, base de tratamento de erros, infraestrutura para Provider Pattern e modulo `escrow` modelado.

**Esforco total estimado**: 4-6 dias de Dev Senior dedicado, com possibilidade de paralelismo apos a Task 1.1c (Tasks 1.2, 1.3, 1.5, 1.6, 1.7 podem rodar em paralelo).

**Workspace root**: `C:/workspace-sep/` (mantendo convencao do `steps/backend/000-sprint-0-steps.md`; em Linux/macOS, usar o equivalente local).

**Ordem de execucao recomendada** (dependencias entre tasks):

```
Task 1.1a (Gradle + estrutura DDD)
   |
   v
Task 1.1b (Dependencias) ------> Task 1.1c (application.yml)
                                          |
                              +-----------+-----------+-----------+-----------+
                              |           |           |           |           |
                          Task 1.2   Task 1.3    Task 1.5    Task 1.6    Task 1.7
                          (Postgres) (Locale)    (ApiExc)    (Auditoria) (Adapter)
                              |
                              v
                          Task 1.4 (Flyway V1)
                              |
                              +--> Task 1.8 (Escrow) (depende tambem de 1.6)
                              |
                              v
                          Task 1.9 (Testes de boot — fecha a sprint)
```

- Task 1.1a e raiz; 1.1b e 1.1c sequenciais.
- Apos 1.1c: 1.2, 1.3, 1.5, 1.6, 1.7 podem rodar em paralelo.
- Task 1.4 depende do banco (1.2).
- Task 1.8 depende de 1.4 e 1.6.
- Task 1.9 consolida e fecha a sprint.

**Como usar este arquivo**:
1. Leia a Task que vai executar
2. Execute step a step na ordem
3. Em cada step, rode a verificacao antes de seguir
4. Ao final da Task, valide com a "Definicao de pronto" da task
5. Comite com a mensagem sugerida (Conventional Commits — definido na Sprint 0 Task 0.7)
6. Marque a task como concluida no checklist final

**Pre-requisitos globais**:
- Sprint 0 concluida (`steps/backend/000-sprint-0-steps.md`): tooling, branch protection, CI minimo, ADRs iniciais, estrutura raiz de pacotes
- Java 21 LTS instalado (`java -version` retorna `openjdk version "21.x.x"`)
- Docker e Docker Compose funcionais (`docker --version`, `docker compose version`)
- Gradle Wrapper sera gerado na Task 1.1a
- PRD aprovado, ADRs 0001-0010 vigentes

---

## Task 1.1a — Projeto Gradle e estrutura inicial de pacotes DDD

**Objetivo**: inicializar o projeto Spring Boot com Gradle, gerar o Wrapper na versao 8.x, criar `build.gradle`/`settings.gradle` esqueleto e materializar a estrutura de pacotes do monolito modular DDD com `package-info.java` por modulo.

**Pre-requisito**: Sprint 0 com Spotless e CI prontos. Java 21 disponivel.

**Esforco**: 1-2 horas (a Sprint 0 Task 0.9 ja criou os 48 `package-info.java`; aqui apenas confirmamos + adicionamos sub-pacotes do padrao Hexagonal).

### Step 1.1a.1 — Inicializar projeto via Spring Initializr

**Comando** (gerar projeto base via Spring Initializr CLI ou web):
```bash
cd C:/workspace-sep
curl https://start.spring.io/starter.zip \
  -d type=gradle-project \
  -d language=java \
  -d bootVersion=3.5.5 \
  -d baseDir=. \
  -d groupId=com.dynamis \
  -d artifactId=broker-app \
  -d name=broker-app \
  -d packageName=com.dynamis.broker_app \
  -d javaVersion=21 \
  -d dependencies=web,security,data-jpa,validation,actuator,flyway,postgresql \
  -o starter.zip
unzip -o starter.zip
rm starter.zip
```

**Alternativa via web**: acessar `https://start.spring.io/`, configurar:
- Project: Gradle - Groovy
- Language: Java
- Spring Boot: 3.5.5 (ou minor mais recente disponivel da linha 3.5.x)
- Group: `com.dynamis`
- Artifact: `broker-app`
- Package name: `com.dynamis.broker_app`
- Java: 21
- Dependencies: Web, Security, Data JPA, Validation, Actuator, Flyway, PostgreSQL

Baixar o ZIP, extrair na raiz do workspace.

**Verificacao**:
```bash
ls -la C:/workspace-sep
# Esperado: build.gradle, settings.gradle, gradlew, gradlew.bat, gradle/, src/
cat build.gradle | head -10
# Esperado: ver plugin `org.springframework.boot` e `java`
```

### Step 1.1a.2 — Confirmar Gradle Wrapper 8.x

**Verificacao**:
```bash
cd C:/workspace-sep
./gradlew --version
# Esperado: Gradle 8.x (qualquer minor da linha 8)
cat gradle/wrapper/gradle-wrapper.properties | grep distributionUrl
# Esperado: gradle-8.X.X-bin.zip
```

Se a versao for inferior a 8, atualizar:
```bash
./gradlew wrapper --gradle-version=8.10
```

### Step 1.1a.3 — Confirmar estrutura inicial gerada pelo Spring Initializr

**Verificacao**:
```bash
ls -la C:/workspace-sep/src/main/java/com/dynamis/broker_app
# Esperado: BrokerAppApplication.java
cat src/main/java/com/dynamis/broker_app/BrokerAppApplication.java
# Esperado: classe @SpringBootApplication
```

**Renomear classe principal** (opcional, mas alinhado ao naming do PRD):
- O Spring Initializr gera `BrokerAppApplication`. Manter.

### Step 1.1a.4 — Criar/confirmar estrutura DDD por modulo (12 modulos × 4 layers + sub-pacotes Hexagonal)

A Sprint 0 Task 0.9 ja criou 48 `package-info.java` (12 modulos × 4 layers `domain`/`application`/`infrastructure`/`web`). A Sprint 1 estende com sub-pacotes do padrao Hexagonal/Ports & Adapters.

**Comando**: criar sub-pacotes esperados em cada modulo. Script utilitario:
```bash
cd C:/workspace-sep/src/main/java/com/dynamis/broker_app
for modulo in identity usuarios onboarding credito contratos cobranca escrow backoffice financeiro credores pix shared; do
  mkdir -p "$modulo/domain/model" "$modulo/domain/event" "$modulo/domain/exception" "$modulo/domain/vo"
  mkdir -p "$modulo/application/usecase" "$modulo/application/port/out" "$modulo/application/service"
  mkdir -p "$modulo/infrastructure/persistence" "$modulo/infrastructure/adapter" "$modulo/infrastructure/config"
  mkdir -p "$modulo/web/controller" "$modulo/web/dto" "$modulo/web/mapper"
done
```

**Verificacao**:
```bash
find src/main/java/com/dynamis/broker_app -type d -name "model" | wc -l
# Esperado: 12 (um para cada modulo)
find src/main/java/com/dynamis/broker_app -type d -name "port" | wc -l
# Esperado: 12 (cada port contem subpasta out/)
```

### Step 1.1a.5 — Smoke build vazio

**Comando**:
```bash
cd C:/workspace-sep
./gradlew compileJava --no-daemon
```

**Esperado**: `BUILD SUCCESSFUL`. Se falhar, investigar antes de seguir.

### Definicao de pronto da Task 1.1a
- [ ] Spring Initializr executado, projeto raiz com `build.gradle`, `settings.gradle`, `gradle/wrapper/`, `gradlew`/`gradlew.bat`
- [ ] Gradle Wrapper na versao 8.x confirmado
- [ ] `src/main/java/com/dynamis/broker_app/BrokerAppApplication.java` presente
- [ ] 12 modulos com sub-pacotes Hexagonal criados (`domain/{model,event,exception,vo}`, `application/{usecase,port/out,service}`, `infrastructure/{persistence,adapter,config}`, `web/{controller,dto,mapper}`)
- [ ] `./gradlew compileJava` passa

### Commit Task 1.1a
```bash
cd C:/workspace-sep
git add build.gradle settings.gradle gradle/ gradlew gradlew.bat src/main/
git commit -m "feat(backend): scaffold inicial Spring Boot 3.5 + estrutura DDD por modulo"
```

---

## Task 1.1b — Dependencias do Gradle (versoes pinadas)

**Objetivo**: declarar todas as dependencias necessarias para sustentar Sprints 1-4 e a arquitetura definida no PRD §11, com versoes pinadas explicitas (alinhado as decisoes consolidadas em PRD §18 e ADRs 0006/0008).

**Pre-requisito**: Task 1.1a concluida.

**Esforco**: 1 hora.

### Step 1.1b.1 — Reescrever `build.gradle` completo

**Arquivo**: `C:/workspace-sep/build.gradle`

**Conteudo**:
```gradle
plugins {
    id 'org.springframework.boot' version '3.5.5'
    id 'io.spring.dependency-management' version '1.1.7'
    id 'com.diffplug.spotless' version '6.25.0'
    id 'jacoco'
    id 'java'
}

group = 'com.dynamis'
version = '0.1.0-SNAPSHOT'

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

ext {
    set('mapstructVersion', '1.6.3')
    set('jjwtVersion', '0.12.6')
    set('springdocVersion', '2.6.0')
    set('javaUuidGeneratorVersion', '5.1.0')
    set('resilience4jVersion', '2.2.0')
    set('logstashEncoderVersion', '8.0')
    set('testcontainersVersion', '1.20.4')
    set('restAssuredVersion', '5.5.0')
    set('wiremockVersion', '3.9.2')
    set('wiremockSpringBootVersion', '3.1.0')
}

dependencies {
    // Spring Boot starters
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-security'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    implementation 'org.springframework.boot:spring-boot-starter-actuator'

    // Persistencia (Postgres + Flyway)
    implementation 'org.flywaydb:flyway-core'
    implementation 'org.flywaydb:flyway-database-postgresql'
    runtimeOnly 'org.postgresql:postgresql'

    // JWT (preparado para Sprint 3)
    implementation "io.jsonwebtoken:jjwt-api:${jjwtVersion}"
    runtimeOnly "io.jsonwebtoken:jjwt-impl:${jjwtVersion}"
    runtimeOnly "io.jsonwebtoken:jjwt-jackson:${jjwtVersion}"

    // Documentacao OpenAPI (configurada em detalhe na Sprint 4)
    implementation "org.springdoc:springdoc-openapi-starter-webmvc-ui:${springdocVersion}"

    // Mapeamento type-safe (substitui ModelMapper — ADR 0006)
    implementation "org.mapstruct:mapstruct:${mapstructVersion}"
    annotationProcessor "org.mapstruct:mapstruct-processor:${mapstructVersion}"

    // UUID v6 (PRD §11)
    implementation "com.fasterxml.uuid:java-uuid-generator:${javaUuidGeneratorVersion}"

    // Resilience4j (preparacao Celcoin via Provider Pattern — ADR 0004)
    implementation "io.github.resilience4j:resilience4j-spring-boot3:${resilience4jVersion}"

    // Observabilidade (Micrometer + Prometheus)
    implementation 'io.micrometer:micrometer-registry-prometheus'

    // Logs estruturados com MDC (correlationId/traceId)
    implementation "net.logstash.logback:logstash-logback-encoder:${logstashEncoderVersion}"

    // Testes
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'org.springframework.security:spring-security-test'
    testImplementation "org.testcontainers:junit-jupiter:${testcontainersVersion}"
    testImplementation "org.testcontainers:postgresql:${testcontainersVersion}"
    testImplementation "io.rest-assured:rest-assured:${restAssuredVersion}"

    // WireMock para integration tests dos adapters HTTP do Celcoin (ADR 0008; uso real entra em Epic 5)
    testImplementation "org.wiremock:wiremock-standalone:${wiremockVersion}"
    testImplementation "org.wiremock.integrations:wiremock-spring-boot:${wiremockSpringBootVersion}"
}

tasks.named('test') {
    useJUnitPlatform()
    finalizedBy jacocoTestReport
}

jacocoTestReport {
    dependsOn test
    reports {
        xml.required = true
        html.required = true
    }
}

// Spotless ja configurado em build.gradle root pela Sprint 0 — confirmar que continua aplicavel
spotless {
    java {
        target 'src/**/*.java'
        palantirJavaFormat('2.50.0')
        removeUnusedImports()
        endWithNewline()
    }
}

// Compilation hints
compileJava {
    options.compilerArgs += [
        '-parameters',  // necessario para Spring Boot bind de @ConfigurationProperties
        '-Amapstruct.defaultComponentModel=spring',  // injecao Spring nos mappers
        '-Amapstruct.unmappedTargetPolicy=ERROR'
    ]
}
```

### Step 1.1b.2 — Resolver dependencias

**Comando**:
```bash
cd C:/workspace-sep
./gradlew dependencies --configuration runtimeClasspath > /tmp/deps-runtime.txt
./gradlew dependencies --configuration testRuntimeClasspath > /tmp/deps-test.txt
```

**Verificacao**:
```bash
grep "mapstruct" /tmp/deps-runtime.txt | head
grep "wiremock" /tmp/deps-test.txt | head
grep "resilience4j" /tmp/deps-runtime.txt | head
# Esperado: cada uma deve aparecer com a versao pinada
```

Se houver conflitos de versao, ler a saida e ajustar. Para a maioria dos casos, o `dependency-management` do Spring Boot resolve.

### Step 1.1b.3 — Smoke build com todas as dependencias

**Comando**:
```bash
cd C:/workspace-sep
./gradlew clean build --no-daemon -x test
```

**Esperado**: `BUILD SUCCESSFUL`. Erros tipicos:
- "Annotation processor not found" → confirmar `annotationProcessor 'org.mapstruct:mapstruct-processor'`
- "Cannot find Starter postgres" → confirmar starter de jpa + driver postgres
- "Conflict between flyway-core and flyway-database-postgresql" → o Spring Boot 3.5 ja gerencia isso

### Step 1.1b.4 — Spotless check

**Comando**:
```bash
./gradlew spotlessCheck
```

Se falhar, rodar:
```bash
./gradlew spotlessApply
```

### Definicao de pronto da Task 1.1b
- [ ] `build.gradle` reescrito com versoes pinadas
- [ ] `./gradlew dependencies` resolve tudo sem conflito
- [ ] MapStruct annotation processor declarado e ativo
- [ ] WireMock 3.9.2 + WireMock Spring Boot 3.1.0 declarados (ADR 0008)
- [ ] Resilience4j 2.x declarado
- [ ] Micrometer + Prometheus declarado
- [ ] Logstash encoder declarado (para logs MDC futuros)
- [ ] `./gradlew clean build -x test` passa

### Commit Task 1.1b
```bash
cd C:/workspace-sep
git add build.gradle
git commit -m "build(backend): pinar dependencias da Sprint 1 (Spring Boot 3.5, MapStruct, WireMock, Resilience4j)"
```

---

## Task 1.1c — `application.yml` e profiles

**Objetivo**: configurar o `application.yml` (defaults), `application-dev.yml` (desenvolvimento) e `application-test.yml` (Testcontainers), incluindo conexao com Postgres, Flyway, Actuator, Jackson timezone/ISO-8601, Springdoc e propriedades JWT em placeholders.

**Pre-requisito**: Task 1.1b concluida.

**Esforco**: 1 hora.

### Step 1.1c.1 — Criar `application.yml` (defaults)

**Arquivo**: `C:/workspace-sep/src/main/resources/application.yml`

**Conteudo**:
```yaml
spring:
  profiles:
    default: dev
  application:
    name: broker-app

  jpa:
    hibernate:
      ddl-auto: validate    # Flyway gerencia o schema; Hibernate apenas valida
    properties:
      hibernate:
        jdbc:
          time_zone: America/Sao_Paulo
        format_sql: false

  jackson:
    time-zone: America/Sao_Paulo
    serialization:
      write-dates-with-zone-id: true
      write-dates-as-timestamps: false
    deserialization:
      fail-on-unknown-properties: false

  flyway:
    enabled: true
    baseline-on-migrate: false
    locations: classpath:db/migration
    validate-on-migrate: true

management:
  endpoints:
    web:
      exposure:
        include: health, info, metrics, prometheus
  endpoint:
    health:
      show-details: never  # nao expor detalhes em prod; dev sobrescreve
  metrics:
    tags:
      application: ${spring.application.name}

springdoc:
  api-docs:
    enabled: true
    path: /v3/api-docs
  swagger-ui:
    enabled: true
    path: /swagger-ui.html
    operations-sorter: method
    tags-sorter: alpha

server:
  port: 8080
  forward-headers-strategy: framework  # respeita X-Forwarded-* atras de proxy

# Propriedades de aplicacao (placeholders; valores reais via env vars)
app:
  jwt:
    secret: ${APP_JWT_SECRET:placeholder-dev-only-min-256-bits-key-replace-in-prod-please}
    expiration-seconds: ${APP_JWT_EXPIRATION:3600}
  cors:
    allowed-origins: ${APP_CORS_ORIGINS:http://localhost:4200,http://localhost:8100}
    allowed-methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
    allowed-headers: Authorization,Content-Type,Idempotency-Key,X-Correlation-Id
    exposed-headers: X-Correlation-Id
    allow-credentials: true
    max-age: 3600

logging:
  level:
    root: INFO
    com.dynamis.broker_app: DEBUG
    org.hibernate.SQL: WARN
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] [%X{correlationId:-}] %-5level %logger{36} - %msg%n"
```

### Step 1.1c.2 — Criar `application-dev.yml`

**Arquivo**: `C:/workspace-sep/src/main/resources/application-dev.yml`

**Conteudo**:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:sep_dev}
    username: ${DB_USER:sep}
    password: ${DB_PASSWORD:sep}
    hikari:
      maximum-pool-size: 10
      minimum-idle: 2
      connection-timeout: 30000

  jpa:
    show-sql: false
    properties:
      hibernate:
        format_sql: true

management:
  endpoint:
    health:
      show-details: always   # em dev, expor detalhes do healthcheck
  endpoints:
    web:
      exposure:
        include: '*'         # em dev, expor todos para facilitar debug

logging:
  level:
    org.springframework.security: DEBUG
    org.springframework.web: DEBUG
    com.dynamis.broker_app: TRACE
```

### Step 1.1c.3 — Criar `application-test.yml`

**Arquivo**: `C:/workspace-sep/src/test/resources/application-test.yml`

**Conteudo**:
```yaml
spring:
  datasource:
    # Configurado dinamicamente pelos Testcontainers em cada teste @SpringBootTest
    # Aqui apenas defaults para test slices que nao precisam de container
    url: jdbc:tc:postgresql:16:///sep_test?TC_DAEMON=true
    driver-class-name: org.testcontainers.jdbc.ContainerDatabaseDriver
    username: test
    password: test

  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false

  flyway:
    clean-on-validation-error: false
    clean-disabled: false

logging:
  level:
    com.dynamis.broker_app: DEBUG
    org.testcontainers: INFO
    org.flywaydb: INFO

app:
  jwt:
    secret: test-secret-key-for-unit-tests-only-32-chars-minimum-padding-padding
    expiration-seconds: 3600
```

### Step 1.1c.4 — Smoke boot (sem banco real ainda)

Esta verificacao falhara em conectar no banco (esperado — Task 1.2 vai prover). O importante e confirmar que o application.yml e parseado sem erros.

**Comando**:
```bash
cd C:/workspace-sep
./gradlew bootRun --args='--spring.profiles.active=dev' &
SERVER_PID=$!
sleep 10
# Esperado: log do Spring tentando conectar no banco (pode falhar, ok)
kill $SERVER_PID 2>/dev/null || true
```

Se aparecer "Failed to bind properties" → erro no YAML; investigar.

### Step 1.1c.5 — Validar sintaxe dos YAMLs

**Comando**:
```bash
cd C:/workspace-sep
python3 -c "import yaml; yaml.safe_load(open('src/main/resources/application.yml'))" && echo "OK application.yml"
python3 -c "import yaml; yaml.safe_load(open('src/main/resources/application-dev.yml'))" && echo "OK application-dev.yml"
python3 -c "import yaml; yaml.safe_load(open('src/test/resources/application-test.yml'))" && echo "OK application-test.yml"
```

### Definicao de pronto da Task 1.1c
- [ ] `application.yml` (defaults), `application-dev.yml`, `application-test.yml` criados
- [ ] YAMLs validos sintaticamente
- [ ] Profile default = `dev`
- [ ] Datasource configurado por env vars com defaults locais
- [ ] Jackson configurado com timezone `America/Sao_Paulo` + ISO-8601 com offset
- [ ] Flyway habilitado em `classpath:db/migration`
- [ ] Actuator expoe `health, info, metrics, prometheus`
- [ ] Springdoc Swagger UI em `/swagger-ui.html`
- [ ] Propriedades `app.jwt.*` e `app.cors.*` declaradas (com placeholders)
- [ ] Logging com `correlationId` no MDC pattern do console

### Commit Task 1.1c
```bash
git add src/main/resources/application.yml src/main/resources/application-dev.yml src/test/resources/application-test.yml
git commit -m "feat(backend): configurar application.yml com profiles dev e test (Postgres + Flyway + Actuator + Jackson timezone)"
```

---

## Task 1.2 — PostgreSQL local com Docker Compose

**Objetivo**: prover o banco PostgreSQL 16 localmente via Docker Compose, garantindo que a aplicacao em profile `dev` conecta com sucesso.

**Pre-requisito**: Task 1.1c concluida; Docker Compose funcional.

**Esforco**: 30 min.

### Step 1.2.1 — Criar `docker-compose.yml`

**Arquivo**: `C:/workspace-sep/docker-compose.yml`

**Conteudo**:
```yaml
version: "3.9"

services:
  postgres:
    image: postgres:16-alpine
    container_name: sep-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME:-sep_dev}
      POSTGRES_USER: ${DB_USER:-sep}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-sep}
      TZ: America/Sao_Paulo
      PGTZ: America/Sao_Paulo
    ports:
      - "${DB_PORT:-5432}:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-sep} -d ${DB_NAME:-sep_dev}"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres-data:
    name: sep-postgres-data
```

### Step 1.2.2 — Criar `.env.example` (para devs copiarem)

**Arquivo**: `C:/workspace-sep/.env.example`

**Conteudo**:
```bash
# Copie para .env e ajuste se necessario
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sep_dev
DB_USER=sep
DB_PASSWORD=sep

APP_JWT_SECRET=replace-this-in-production-with-32-chars-min-secure-random-key
APP_JWT_EXPIRATION=3600

APP_CORS_ORIGINS=http://localhost:4200,http://localhost:8100
```

**Confirmar** que `.env` esta no `.gitignore` (Sprint 0 Task 0.1 deve ter coberto):
```bash
grep -E "^\.env$|^\.env\." C:/workspace-sep/.gitignore
# Esperado: .env (e variantes)
```

Se nao estiver, adicionar:
```bash
echo "" >> C:/workspace-sep/.gitignore
echo "# variaveis de ambiente locais" >> C:/workspace-sep/.gitignore
echo ".env" >> C:/workspace-sep/.gitignore
echo ".env.local" >> C:/workspace-sep/.gitignore
```

### Step 1.2.3 — Subir o banco

**Comando**:
```bash
cd C:/workspace-sep
docker compose up -d postgres
```

**Esperado**:
```
[+] Running 2/2
 ✔ Network workspace-sep_default      Created
 ✔ Container sep-postgres             Started
```

### Step 1.2.4 — Validar conexao

**Comando**:
```bash
# Esperar health check passar (~10s)
docker compose ps postgres
# Esperado: STATUS = healthy

# Testar conexao via psql client (opcional, se psql instalado)
PGPASSWORD=sep psql -h localhost -U sep -d sep_dev -c "SELECT version(), current_setting('TimeZone');"
# Esperado: PostgreSQL 16.x + TimeZone = America/Sao_Paulo
```

Alternativa via Docker:
```bash
docker exec -it sep-postgres psql -U sep -d sep_dev -c "SELECT version();"
```

### Step 1.2.5 — Boot da aplicacao conectando no banco

**Comando**:
```bash
cd C:/workspace-sep
./gradlew bootRun --args='--spring.profiles.active=dev' &
SERVER_PID=$!
sleep 30
curl -s http://localhost:8080/actuator/health
# Esperado: {"status":"UP","components":{"db":{"status":"UP","details":{...}},...}}
kill $SERVER_PID 2>/dev/null || true
```

Se falhar com "Connection refused" → o banco nao subiu; revisar `docker compose ps`.

### Definicao de pronto da Task 1.2
- [ ] `docker-compose.yml` criado com Postgres 16-alpine
- [ ] `.env.example` criado para orientar devs
- [ ] `.env` confirmado no `.gitignore`
- [ ] `docker compose up -d postgres` sobe banco com healthcheck = healthy
- [ ] Volume nomeado `sep-postgres-data` persiste dados entre `up`/`down`
- [ ] Aplicacao Spring Boot em profile `dev` conecta no banco com sucesso
- [ ] `/actuator/health` responde `UP` incluindo componente `db`

### Commit Task 1.2
```bash
git add docker-compose.yml .env.example .gitignore
git commit -m "feat(infra): adicionar docker-compose com PostgreSQL 16 para ambiente dev"
```

---

## Task 1.3 — Locale, Timezone, CORS e Actuator

**Objetivo**: configurar locale `pt-BR`, timezone `America/Sao_Paulo` no contexto da JVM e Jackson, CORS basico no `SecurityConfig` (apenas o bloco de CORS — JWT entra na Sprint 3) e expor Actuator.

**Pre-requisito**: Task 1.1c concluida (yamls com configs base).

**Esforco**: 1 hora.

### Step 1.3.1 — Criar `LocaleConfig.java`

**Arquivo**: `C:/workspace-sep/src/main/java/com/dynamis/broker_app/shared/config/LocaleConfig.java`

**Conteudo**:
```java
package com.dynamis.broker_app.shared.config;

import jakarta.annotation.PostConstruct;
import java.time.ZoneId;
import java.util.Locale;
import java.util.TimeZone;
import org.springframework.context.annotation.Configuration;

/**
 * Configura locale `pt-BR` e timezone `America/Sao_Paulo` no contexto JVM.
 * Atende PRD §RNF-01 (Configuracao Regional).
 *
 * <p>O Jackson e configurado via {@code application.yml}
 * ({@code spring.jackson.time-zone}); este bean garante que o restante da JVM
 * (logs, formatadores legados, etc.) tambem opere no timezone correto.
 */
@Configuration
public class LocaleConfig {

    @PostConstruct
    public void configure() {
        Locale ptBr = Locale.forLanguageTag("pt-BR");
        Locale.setDefault(ptBr);
        TimeZone.setDefault(TimeZone.getTimeZone(ZoneId.of("America/Sao_Paulo")));
    }
}
```

### Step 1.3.2 — Criar `CorsConfig.java`

**Arquivo**: `C:/workspace-sep/src/main/java/com/dynamis/broker_app/shared/config/CorsConfig.java`

**Conteudo**:
```java
package com.dynamis.broker_app.shared.config;

import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Configura CORS para integracao futura com frontend Angular e mobile Ionic.
 * Origens, metodos, headers e credenciais vem de propriedades em
 * {@code application.yml} (chave {@code app.cors.*}).
 */
@Configuration
public class CorsConfig {

    @Value("${app.cors.allowed-origins}")
    private List<String> allowedOrigins;

    @Value("${app.cors.allowed-methods}")
    private List<String> allowedMethods;

    @Value("${app.cors.allowed-headers}")
    private List<String> allowedHeaders;

    @Value("${app.cors.exposed-headers}")
    private List<String> exposedHeaders;

    @Value("${app.cors.allow-credentials}")
    private boolean allowCredentials;

    @Value("${app.cors.max-age}")
    private long maxAge;

    @Bean
    public UrlBasedCorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(allowedOrigins);
        config.setAllowedMethods(allowedMethods);
        config.setAllowedHeaders(allowedHeaders);
        config.setExposedHeaders(exposedHeaders);
        config.setAllowCredentials(allowCredentials);
        config.setMaxAge(maxAge);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
```

### Step 1.3.3 — Criar `SecurityConfig.java` (esqueleto, apenas CORS + endpoints publicos basicos)

**Arquivo**: `C:/workspace-sep/src/main/java/com/dynamis/broker_app/identity/infrastructure/config/SecurityConfig.java`

**Conteudo**:
```java
package com.dynamis.broker_app.identity.infrastructure.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Configuracao base de seguranca para a Sprint 1.
 *
 * <p>Nesta sprint apenas CORS e a politica de sessao stateless sao definidas.
 * O filtro JWT, autorizacao por perfil/ownership e demais regras entram na
 * Sprint 3.
 *
 * @see com.dynamis.broker_app.shared.config.CorsConfig
 */
@Configuration
public class SecurityConfig {

    private final UrlBasedCorsConfigurationSource corsConfigurationSource;

    public SecurityConfig(UrlBasedCorsConfigurationSource corsConfigurationSource) {
        this.corsConfigurationSource = corsConfigurationSource;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // endpoints publicos basicos da Sprint 1 (Sprint 3 trara o cadastro de usuario e login)
                .requestMatchers(
                    "/actuator/health",
                    "/actuator/info",
                    "/actuator/prometheus",
                    "/v3/api-docs/**",
                    "/swagger-ui.html",
                    "/swagger-ui/**"
                ).permitAll()
                // qualquer outra rota fica restrita ate Sprint 3 plugar JWT
                .anyRequest().authenticated()
            )
            // basic auth temporario apenas para nao bloquear /actuator durante dev;
            // sera removido na Sprint 3 quando JWT entrar
            .httpBasic(httpBasic -> {});

        return http.build();
    }
}
```

### Step 1.3.4 — Boot e validacao manual

**Comando**:
```bash
cd C:/workspace-sep
docker compose up -d postgres
./gradlew bootRun --args='--spring.profiles.active=dev' &
SERVER_PID=$!
sleep 30

# Locale e timezone configurados (verificar via log do Spring no startup)
# Esperado nos logs: ver linha similar a "Setting locale to pt-BR"

# Healthcheck
curl -s http://localhost:8080/actuator/health
# Esperado: {"status":"UP","components":{"db":{"status":"UP",...}}}

# CORS preflight
curl -i -X OPTIONS http://localhost:8080/actuator/health \
  -H "Origin: http://localhost:4200" \
  -H "Access-Control-Request-Method: GET"
# Esperado: HTTP 200 com headers Access-Control-Allow-Origin: http://localhost:4200

kill $SERVER_PID 2>/dev/null || true
```

### Definicao de pronto da Task 1.3
- [ ] `LocaleConfig` configurando `Locale.setDefault(pt-BR)` + `TimeZone.setDefault(America/Sao_Paulo)`
- [ ] `CorsConfig` lendo propriedades de `app.cors.*`
- [ ] `SecurityConfig` esqueleto com CORS + sessao stateless + endpoints publicos basicos
- [ ] `/actuator/health` responde 200 sem auth
- [ ] CORS preflight `OPTIONS` retorna headers `Access-Control-Allow-Origin` corretos
- [ ] Datas serializadas em ISO-8601 com offset (validar quando Sprint 2 entregar primeiro endpoint)

### Commit Task 1.3
```bash
git add src/main/java/com/dynamis/broker_app/shared/config/LocaleConfig.java
git add src/main/java/com/dynamis/broker_app/shared/config/CorsConfig.java
git add src/main/java/com/dynamis/broker_app/identity/infrastructure/config/SecurityConfig.java
git commit -m "feat(backend): configurar locale pt-BR, timezone America/Sao_Paulo, CORS e SecurityConfig stub"
```

---

## Task 1.4 — Flyway e migration inicial (V1)

**Objetivo**: ativar Flyway com a primeira migration versionada V1 que cria o esqueleto da tabela `usuario` (populada na Sprint 2). Valida o ciclo `boot → Flyway aplica V1 → Hibernate valida schema`.

**Pre-requisito**: Tasks 1.1c (Flyway no application.yml) e 1.2 (Postgres rodando) concluidas.

**Esforco**: 1-2 horas.

### Step 1.4.1 — Criar pasta de migrations e V1

**Arquivo**: `C:/workspace-sep/src/main/resources/db/migration/V1__init.sql`

**Conteudo**:
```sql
-- =============================================================================
-- Migration V1 - Sprint 1 - Esqueleto inicial do schema SEP
-- =============================================================================
-- Cria a tabela `usuario` com campos minimos e auditoria JPA.
-- A Sprint 2 (Gestao de Usuarios) populara o codigo Java + DTOs sobre este
-- schema. A coluna `id` usa o tipo `uuid` nativo do PostgreSQL conforme
-- PRD §16 (Convencoes de Persistencia).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE usuario (
  id UUID PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(40) NOT NULL,
  data_criacao TIMESTAMP WITH TIME ZONE NOT NULL,
  data_modificacao TIMESTAMP WITH TIME ZONE NOT NULL,
  criado_por VARCHAR(50) NOT NULL DEFAULT 'system',
  modificado_por VARCHAR(50) NOT NULL DEFAULT 'system',

  CONSTRAINT uq_usuario_username UNIQUE (username),
  CONSTRAINT chk_usuario_role CHECK (role IN ('ADMIN', 'CLIENTE'))
);

CREATE INDEX idx_usuario_username ON usuario(username);

COMMENT ON TABLE usuario IS 'Usuario do sistema SEP. Sprint 1 cria o schema; Sprint 2 popula com entidade JPA + DTOs.';
COMMENT ON COLUMN usuario.id IS 'UUID v6 gerado pela aplicacao (PRD §16).';
COMMENT ON COLUMN usuario.username IS 'E-mail unico do usuario (PRD §RF-01).';
COMMENT ON COLUMN usuario.password IS 'Hash BCrypt da senha (Sprint 3).';
COMMENT ON COLUMN usuario.role IS 'Perfil do usuario: ADMIN ou CLIENTE.';
```

### Step 1.4.2 — Boot e confirmar aplicacao da V1

**Comando**:
```bash
cd C:/workspace-sep
docker compose up -d postgres
./gradlew bootRun --args='--spring.profiles.active=dev' &
SERVER_PID=$!
sleep 30
```

**Verificacao no banco**:
```bash
docker exec -it sep-postgres psql -U sep -d sep_dev -c "\dt"
# Esperado: ver tabelas usuario + flyway_schema_history

docker exec -it sep-postgres psql -U sep -d sep_dev -c "SELECT version, description, success FROM flyway_schema_history;"
# Esperado: linha com version=1, description='init', success=t

docker exec -it sep-postgres psql -U sep -d sep_dev -c "\d usuario"
# Esperado: ver colunas id (uuid), username, password, role, data_criacao (timestamp), etc.
```

```bash
kill $SERVER_PID 2>/dev/null || true
```

### Step 1.4.3 — Validar idempotencia (re-boot nao re-aplica)

**Comando**:
```bash
./gradlew bootRun --args='--spring.profiles.active=dev' &
SERVER_PID=$!
sleep 30

docker exec -it sep-postgres psql -U sep -d sep_dev -c "SELECT count(*) FROM flyway_schema_history;"
# Esperado: 1 (V1 nao re-aplicada)

kill $SERVER_PID 2>/dev/null || true
```

### Definicao de pronto da Task 1.4
- [ ] `src/main/resources/db/migration/V1__init.sql` criado
- [ ] Boot da aplicacao aplica V1 automaticamente
- [ ] Tabela `usuario` criada com colunas em portugues e `id` tipo `uuid` nativo
- [ ] `flyway_schema_history` registra V1 com sucesso
- [ ] Re-boot nao re-aplica V1 (idempotencia)
- [ ] Constraints `uq_usuario_username` e `chk_usuario_role` ativas

### Commit Task 1.4
```bash
git add src/main/resources/db/migration/V1__init.sql
git commit -m "feat(backend): migration V1 com esqueleto da tabela usuario (Flyway)"
```

---

## Task 1.5 — `ApiExceptionHandler` stub e `ErrorResponseDto`

**Objetivo**: criar a base do tratamento centralizado de erros desde a Sprint 1. Stub mapeia 3 excecoes basicas; Sprint 4 evolui com mapeamento completo.

**Pre-requisito**: Task 1.1c concluida.

**Esforco**: 1-2 horas.

### Step 1.5.1 — Criar `ErrorResponseDto`

**Arquivo**: `C:/workspace-sep/src/main/java/com/dynamis/broker_app/shared/exception/ErrorResponseDto.java`

**Conteudo**:
```java
package com.dynamis.broker_app.shared.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.OffsetDateTime;

/**
 * Payload padrao de erro da API SEP.
 * Atende PRD §13 (Padrao de Erros da API).
 *
 * <p>Campo {@code traceId} e opcional e propagado do MDC quando presente
 * (via {@link com.dynamis.broker_app.shared.integration.CorrelationIdFilter}).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponseDto(
    OffsetDateTime timestamp,
    int status,
    String error,
    String message,
    String path,
    String traceId
) {

    public static ErrorResponseDto of(int status, String error, String message, String path, String traceId) {
        return new ErrorResponseDto(OffsetDateTime.now(), status, error, message, path, traceId);
    }
}
```

### Step 1.5.2 — Criar `DomainException` (sealed type)

**Arquivo**: `C:/workspace-sep/src/main/java/com/dynamis/broker_app/shared/exception/DomainException.java`

**Conteudo**:
```java
package com.dynamis.broker_app.shared.exception;

/**
 * Tipo base (sealed) das excecoes de dominio do SEP.
 *
 * <p>Sprints futuras criam subtipos especificos (ex.: {@code UsuarioNaoEncontrado},
 * {@code SenhaInvalida}, {@code OnboardingPendenteException}). Esta sealed hierarchy
 * forca que o {@link ApiExceptionHandler} mapeie todos os casos via
 * {@code switch} exhaustivo a partir da Sprint 4.
 */
public abstract sealed class DomainException extends RuntimeException
    permits ValidacaoException, RecursoNaoEncontradoException, ConflitoException {

    private final String codigo;

    protected DomainException(String codigo, String mensagem) {
        super(mensagem);
        this.codigo = codigo;
    }

    protected DomainException(String codigo, String mensagem, Throwable causa) {
        super(mensagem, causa);
        this.codigo = codigo;
    }

    public String getCodigo() {
        return codigo;
    }
}
```

E os 3 subtipos basicos (preparacao para Sprints 2-4):

**Arquivo**: `C:/workspace-sep/src/main/java/com/dynamis/broker_app/shared/exception/ValidacaoException.java`
```java
package com.dynamis.broker_app.shared.exception;

public final class ValidacaoException extends DomainException {
    public ValidacaoException(String codigo, String mensagem) {
        super(codigo, mensagem);
    }
}
```

**Arquivo**: `C:/workspace-sep/src/main/java/com/dynamis/broker_app/shared/exception/RecursoNaoEncontradoException.java`
```java
package com.dynamis.broker_app.shared.exception;

public final class RecursoNaoEncontradoException extends DomainException {
    public RecursoNaoEncontradoException(String codigo, String mensagem) {
        super(codigo, mensagem);
    }
}
```

**Arquivo**: `C:/workspace-sep/src/main/java/com/dynamis/broker_app/shared/exception/ConflitoException.java`
```java
package com.dynamis.broker_app.shared.exception;

public final class ConflitoException extends DomainException {
    public ConflitoException(String codigo, String mensagem) {
        super(codigo, mensagem);
    }
}
```

### Step 1.5.3 — Criar `ApiExceptionHandler` (stub)

**Arquivo**: `C:/workspace-sep/src/main/java/com/dynamis/broker_app/shared/exception/ApiExceptionHandler.java`

**Conteudo**:
```java
package com.dynamis.broker_app.shared.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.NoHandlerFoundException;

/**
 * Tratamento centralizado de erros da API SEP — stub da Sprint 1.
 *
 * <p>Atende PRD §13 (Padrao de Erros da API). Esta versao mapeia apenas as
 * excecoes basicas necessarias para nao expor stack traces. A Sprint 4 evolui
 * com mapeamento completo de validacao, autenticacao, autorizacao,
 * {@link DomainException} e fallback generico.
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponseDto> handleValidation(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        String mensagem = ex.getBindingResult().getFieldErrors().stream()
            .map(fe -> fe.getField() + " " + fe.getDefaultMessage())
            .findFirst()
            .orElse("Requisicao invalida");
        return build(HttpStatus.BAD_REQUEST, "Bad Request", mensagem, request);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponseDto> handleDataIntegrity(
            DataIntegrityViolationException ex, HttpServletRequest request) {
        log.warn("Violacao de integridade: {}", ex.getMostSpecificCause().getMessage());
        return build(HttpStatus.CONFLICT, "Conflict", "Operacao viola constraint do banco", request);
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ErrorResponseDto> handleNotFound(
            NoHandlerFoundException ex, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, "Not Found", "Recurso nao encontrado", request);
    }

    @ExceptionHandler(DomainException.class)
    public ResponseEntity<ErrorResponseDto> handleDomain(
            DomainException ex, HttpServletRequest request) {
        // mapping rudimentar — Sprint 4 fara switch exhaustivo na sealed hierarchy
        HttpStatus status = switch (ex) {
            case ValidacaoException ignored -> HttpStatus.BAD_REQUEST;
            case RecursoNaoEncontradoException ignored -> HttpStatus.NOT_FOUND;
            case ConflitoException ignored -> HttpStatus.CONFLICT;
        };
        return build(status, status.getReasonPhrase(), ex.getMessage(), request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponseDto> handleGeneric(Exception ex, HttpServletRequest request) {
        log.error("Erro nao tratado", ex);
        return build(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "Internal Server Error",
            "Erro interno. Consulte o suporte com o traceId.",
            request);
    }

    private ResponseEntity<ErrorResponseDto> build(
            HttpStatus status, String error, String message, HttpServletRequest request) {
        ErrorResponseDto body = ErrorResponseDto.of(
            status.value(),
            error,
            message,
            request.getRequestURI(),
            MDC.get("correlationId"));
        return ResponseEntity.status(status).body(body);
    }
}
```

### Step 1.5.4 — Configurar `throw-exception-if-no-handler-found` no application.yml

Para que `NoHandlerFoundException` seja capturado, precisa habilitar via propriedade.

**Arquivo**: `C:/workspace-sep/src/main/resources/application.yml`

**Adicionar** (ou confirmar) na chave `spring.mvc`:
```yaml
spring:
  mvc:
    throw-exception-if-no-handler-found: true
  web:
    resources:
      add-mappings: false  # nao tentar servir static resources para 404 paths
```

### Step 1.5.5 — Verificacao manual do stub

**Comando**:
```bash
cd C:/workspace-sep
docker compose up -d postgres
./gradlew bootRun --args='--spring.profiles.active=dev' &
SERVER_PID=$!
sleep 30

# 404 — endpoint inexistente
curl -i http://localhost:8080/api/v1/nao-existe
# Esperado: HTTP/1.1 401 (porque SecurityConfig bloqueia rota nao listada como permitAll)
# Para validar 404 puro, criar usuario http via httpBasic temporario:
curl -i -u user:senha http://localhost:8080/api/v1/nao-existe
# Esperado: 404 com payload {"timestamp":"...","status":404,"error":"Not Found",...}

kill $SERVER_PID 2>/dev/null || true
```

Se a resposta for HTML do Whitelabel Error Page, a propriedade `throw-exception-if-no-handler-found` nao foi aplicada ou esta antes do filter chain.

### Definicao de pronto da Task 1.5
- [ ] `ErrorResponseDto` criado como `record`
- [ ] `DomainException` sealed type + 3 subtypes (`ValidacaoException`, `RecursoNaoEncontradoException`, `ConflitoException`)
- [ ] `ApiExceptionHandler` com `@RestControllerAdvice` mapeando `MethodArgumentNotValid`, `DataIntegrityViolation`, `NoHandlerFound`, `DomainException` e fallback `Exception`
- [ ] Payload em `ErrorResponseDto` para qualquer 4xx/5xx tratado
- [ ] Propagacao de `traceId` (correlationId) do MDC quando presente
- [ ] Endpoint inexistente retorna 404 com `ErrorResponseDto`
- [ ] Body invalido retorna 400 com `ErrorResponseDto`

### Commit Task 1.5
```bash
git add src/main/java/com/dynamis/broker_app/shared/exception/
git add src/main/resources/application.yml
git commit -m "feat(backend): ApiExceptionHandler stub + ErrorResponseDto + DomainException sealed (Sprint 1; Sprint 4 evolui)"
```

---

## Task 1.6 — Auditoria JPA base (`EntidadeAuditavel` + `AuditorAware`)

**Objetivo**: materializar a auditoria conforme PRD §15. Criar `EntidadeAuditavel` (mapped superclass com 4 campos), `AuditorAwareImpl` com fallback `system` e habilitar `@EnableJpaAuditing`.

**Pre-requisito**: Task 1.1c concluida.

**Esforco**: 1 hora.

### Step 1.6.1 — Criar `EntidadeAuditavel`

**Arquivo**: `C:/workspace-sep/src/main/java/com/dynamis/broker_app/shared/audit/EntidadeAuditavel.java`

**Conteudo**:
```java
package com.dynamis.broker_app.shared.audit;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import java.time.OffsetDateTime;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/**
 * Mapped superclass com os 4 campos de auditoria obrigatorios do PRD §15:
 * {@code dataCriacao}, {@code dataModificacao}, {@code criadoPor}, {@code modificadoPor}.
 *
 * <p>Toda entidade persistida do dominio SEP deve estender esta classe. O
 * {@link AuditorAwareImpl} e responsavel por preencher {@code criadoPor} e
 * {@code modificadoPor} com o UUID do usuario autenticado (Sprint 3) ou
 * fallback {@code "system"} quando nao houver autenticacao.
 */
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class EntidadeAuditavel {

    @CreatedDate
    @Column(name = "data_criacao", nullable = false, updatable = false)
    protected OffsetDateTime dataCriacao;

    @LastModifiedDate
    @Column(name = "data_modificacao", nullable = false)
    protected OffsetDateTime dataModificacao;

    @CreatedBy
    @Column(name = "criado_por", nullable = false, updatable = false, length = 50)
    protected String criadoPor;

    @LastModifiedBy
    @Column(name = "modificado_por", nullable = false, length = 50)
    protected String modificadoPor;

    public OffsetDateTime getDataCriacao() {
        return dataCriacao;
    }

    public OffsetDateTime getDataModificacao() {
        return dataModificacao;
    }

    public String getCriadoPor() {
        return criadoPor;
    }

    public String getModificadoPor() {
        return modificadoPor;
    }
}
```

### Step 1.6.2 — Criar `AuditorAwareImpl`

**Arquivo**: `C:/workspace-sep/src/main/java/com/dynamis/broker_app/shared/audit/AuditorAwareImpl.java`

**Conteudo**:
```java
package com.dynamis.broker_app.shared.audit;

import java.util.Optional;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Provedor do auditor (criadoPor/modificadoPor) para o JPA Auditing.
 *
 * <p>Atende PRD §15: prioriza o UUID do usuario autenticado (preenchido pela
 * Sprint 3), com fallback {@code "system"} quando nao ha autenticacao no
 * contexto. Nunca retorna {@link Optional#empty()} para garantir que os
 * campos {@code criado_por} e {@code modificado_por} fiquem sempre populados.
 */
@Component("auditorAware")
public class AuditorAwareImpl implements AuditorAware<String> {

    public static final String SYSTEM = "system";

    @Override
    public Optional<String> getCurrentAuditor() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return Optional.of(SYSTEM);
        }
        // Sprint 3 vai colocar o UUID do usuario no Authentication.getName().
        // Por ora, qualquer principal autenticado retorna o nome (placeholder).
        String name = auth.getName();
        return Optional.of(name == null || name.isBlank() ? SYSTEM : name);
    }
}
```

### Step 1.6.3 — Habilitar JPA Auditing

**Arquivo**: `C:/workspace-sep/src/main/java/com/dynamis/broker_app/shared/audit/JpaAuditingConfig.java`

**Conteudo**:
```java
package com.dynamis.broker_app.shared.audit;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Habilita o JPA Auditing apontando para o {@link AuditorAwareImpl}
 * (bean qualificado como {@code auditorAware}).
 */
@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorAware")
public class JpaAuditingConfig {
}
```

### Step 1.6.4 — Smoke test da auditoria

A validacao real acontece na Task 1.9 quando criarmos uma entidade de teste e persistirmos. Aqui apenas confirmar que o contexto Spring sobe sem erros relacionados ao Auditing.

**Comando**:
```bash
cd C:/workspace-sep
docker compose up -d postgres
./gradlew bootRun --args='--spring.profiles.active=dev' &
SERVER_PID=$!
sleep 30

# Procurar logs de inicializacao do JPA Auditing
# Esperado: nenhum erro tipo "Could not resolve AuditorAware"

kill $SERVER_PID 2>/dev/null || true
```

### Definicao de pronto da Task 1.6
- [ ] `EntidadeAuditavel` mapped superclass com 4 campos (`dataCriacao`, `dataModificacao`, `criadoPor`, `modificadoPor`)
- [ ] `AuditorAwareImpl` com fallback `"system"` quando nao ha autenticacao
- [ ] `JpaAuditingConfig` com `@EnableJpaAuditing(auditorAwareRef = "auditorAware")`
- [ ] Aplicacao sobe sem erros relacionados ao Auditing
- [ ] Comportamento real validado na Task 1.9 (testes)

### Commit Task 1.6
```bash
git add src/main/java/com/dynamis/broker_app/shared/audit/
git commit -m "feat(backend): auditoria JPA base com EntidadeAuditavel + AuditorAware fallback system"
```

---

## Task 1.7 — Estrutura de adapter para integracoes externas (`shared.integration`)

**Objetivo**: preparar a infraestrutura comum para o Provider Pattern (PRD §11, ADR 0004): factory de `RestClient`, configuracao Resilience4j, interceptor de `Idempotency-Key`, filter de `correlationId` no MDC.

**Pre-requisito**: Task 1.1c concluida.

**Esforco**: 2-3 horas.

### Step 1.7.1 — Criar `CorrelationIdFilter`

**Arquivo**: `C:/workspace-sep/src/main/java/com/dynamis/broker_app/shared/integration/CorrelationIdFilter.java`

**Conteudo**:
```java
package com.dynamis.broker_app.shared.integration;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Servlet filter que injeta um {@code correlationId} (UUID) no MDC para cada
 * request. Se o header {@code X-Correlation-Id} estiver presente, ele e
 * propagado; caso contrario, um novo UUID e gerado.
 *
 * <p>O ID e exposto na resposta no mesmo header e e usado em logs estruturados
 * (Logback pattern do {@code application.yml}) e propagado para chamadas a
 * providers externos (ver {@link RestClientFactory}).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorrelationIdFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-Correlation-Id";
    public static final String MDC_KEY = "correlationId";

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String correlationId = request.getHeader(HEADER);
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = UUID.randomUUID().toString();
        }
        MDC.put(MDC_KEY, correlationId);
        response.setHeader(HEADER, correlationId);
        try {
            chain.doFilter(request, response);
        } finally {
            MDC.remove(MDC_KEY);
        }
    }
}
```

### Step 1.7.2 — Criar `IdempotencyKeyInterceptor`

**Arquivo**: `C:/workspace-sep/src/main/java/com/dynamis/broker_app/shared/integration/IdempotencyKeyInterceptor.java`

**Conteudo**:
```java
package com.dynamis.broker_app.shared.integration;

import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;

/**
 * Interceptor que adiciona o header {@code Idempotency-Key} a chamadas HTTP
 * outbound a providers externos. A chave e lida do MDC (chave
 * {@code idempotencyKey}); o caller e responsavel por colocar o valor antes
 * da chamada.
 *
 * <p>Tambem propaga {@link CorrelationIdFilter#HEADER} para o provider, util
 * para correlacionar logs ponta a ponta com a Celcoin.
 */
public class IdempotencyKeyInterceptor implements ClientHttpRequestInterceptor {

    private static final Logger log = LoggerFactory.getLogger(IdempotencyKeyInterceptor.class);

    public static final String MDC_IDEMPOTENCY_KEY = "idempotencyKey";
    public static final String HEADER_IDEMPOTENCY = "Idempotency-Key";

    @Override
    public ClientHttpResponse intercept(
            HttpRequest request, byte[] body, ClientHttpRequestExecution execution) throws IOException {
        String idempotencyKey = MDC.get(MDC_IDEMPOTENCY_KEY);
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            request.getHeaders().add(HEADER_IDEMPOTENCY, idempotencyKey);
        }
        String correlationId = MDC.get(CorrelationIdFilter.MDC_KEY);
        if (correlationId != null && !correlationId.isBlank()) {
            request.getHeaders().add(CorrelationIdFilter.HEADER, correlationId);
        }
        log.debug("Outbound HTTP {} {} (correlationId={}, idempotency={})",
            request.getMethod(), request.getURI(), correlationId, idempotencyKey);
        return execution.execute(request, body);
    }
}
```

### Step 1.7.3 — Criar `RestClientFactory`

**Arquivo**: `C:/workspace-sep/src/main/java/com/dynamis/broker_app/shared/integration/RestClientFactory.java`

**Conteudo**:
```java
package com.dynamis.broker_app.shared.integration;

import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestClientCustomizer;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * Factory de {@link RestClient} para chamadas a providers externos.
 *
 * <p>Cada provider e configurado por nome (ex.: {@code forProvider("celcoin")});
 * timeouts e base URL sao lidos de propriedades em
 * {@code app.integration.<provider>.*}. O {@link IdempotencyKeyInterceptor}
 * e adicionado por padrao.
 *
 * <p>O Resilience4j (circuit breaker, retry, timeout) e aplicado de forma
 * declarativa nos beans dos providers via {@code @CircuitBreaker},
 * {@code @Retry} e {@code @TimeLimiter} configurados em {@link Resilience4jConfig}.
 */
@Component
public class RestClientFactory {

    @Value("${app.integration.connect-timeout-seconds:10}")
    private long connectTimeoutSeconds;

    @Value("${app.integration.read-timeout-seconds:30}")
    private long readTimeoutSeconds;

    public RestClient forProvider(String providerName, String baseUrl) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(connectTimeoutSeconds));
        factory.setReadTimeout(Duration.ofSeconds(readTimeoutSeconds));

        return RestClient.builder()
            .baseUrl(baseUrl)
            .requestFactory(factory)
            .requestInterceptor(new IdempotencyKeyInterceptor())
            .defaultHeader("User-Agent", "broker-app/" + providerName)
            .build();
    }
}
```

### Step 1.7.4 — Criar `Resilience4jConfig`

**Arquivo**: `C:/workspace-sep/src/main/java/com/dynamis/broker_app/shared/integration/Resilience4jConfig.java`

**Conteudo**:
```java
package com.dynamis.broker_app.shared.integration;

import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.retry.RetryConfig;
import io.github.resilience4j.timelimiter.TimeLimiterConfig;
import java.time.Duration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuracao default de Resilience4j para chamadas externas.
 *
 * <p>Beans aqui criados sao defaults; cada provider pode declarar overrides
 * em {@code application.yml} (chave {@code resilience4j.circuitbreaker.instances.<nome>.*}).
 */
@Configuration
public class Resilience4jConfig {

    @Bean("defaultCircuitBreakerConfig")
    public CircuitBreakerConfig defaultCircuitBreakerConfig() {
        return CircuitBreakerConfig.custom()
            .failureRateThreshold(50.0f)
            .waitDurationInOpenState(Duration.ofSeconds(30))
            .slidingWindowSize(10)
            .minimumNumberOfCalls(5)
            .permittedNumberOfCallsInHalfOpenState(3)
            .build();
    }

    @Bean("defaultRetryConfig")
    public RetryConfig defaultRetryConfig() {
        return RetryConfig.custom()
            .maxAttempts(3)
            .waitDuration(Duration.ofMillis(500))
            .retryExceptions(java.io.IOException.class)
            .build();
    }

    @Bean("defaultTimeLimiterConfig")
    public TimeLimiterConfig defaultTimeLimiterConfig() {
        return TimeLimiterConfig.custom()
            .timeoutDuration(Duration.ofSeconds(30))
            .cancelRunningFuture(true)
            .build();
    }
}
```

### Step 1.7.5 — Adicionar propriedades default em `application.yml`

**Arquivo**: `C:/workspace-sep/src/main/resources/application.yml` — adicionar:
```yaml
app:
  integration:
    connect-timeout-seconds: 10
    read-timeout-seconds: 30

# Defaults Resilience4j (overrides por instance vem nas Sprints 6+)
resilience4j:
  circuitbreaker:
    configs:
      default:
        failureRateThreshold: 50
        waitDurationInOpenState: 30s
        slidingWindowSize: 10
        minimumNumberOfCalls: 5
        permittedNumberOfCallsInHalfOpenState: 3
  retry:
    configs:
      default:
        maxAttempts: 3
        waitDuration: 500ms
  timelimiter:
    configs:
      default:
        timeoutDuration: 30s
```

### Definicao de pronto da Task 1.7
- [ ] `CorrelationIdFilter` injeta UUID no MDC + propaga via header `X-Correlation-Id`
- [ ] `IdempotencyKeyInterceptor` adiciona `Idempotency-Key` quando presente no MDC + propaga `X-Correlation-Id` para chamadas outbound
- [ ] `RestClientFactory.forProvider(name, baseUrl)` cria RestClient com timeouts e interceptor
- [ ] `Resilience4jConfig` com defaults para circuit breaker, retry e time limiter
- [ ] Propriedades em `application.yml` para `app.integration.*` e `resilience4j.*`
- [ ] Aplicacao sobe sem erros
- [ ] Uso real fica para Task 4.4 (Webhook Receiver) e Sprint 6+ (KYC Provider)

### Commit Task 1.7
```bash
git add src/main/java/com/dynamis/broker_app/shared/integration/
git add src/main/resources/application.yml
git commit -m "feat(backend): infraestrutura para Provider Pattern (RestClientFactory + Resilience4j + CorrelationIdFilter + IdempotencyKeyInterceptor)"
```

---

## Task 1.8 — Modelagem inicial do modulo `escrow`

**Objetivo**: modelar entidades transversais do modulo `escrow` (PRD §11, ADR 0005) desde a Sprint 1, evitando retrabalho arquitetural quando o `EscrowProvider` (Celcoin) for plugado na Epic 15. Sem regra de negocio nesta sprint — so estrutura.

**Pre-requisito**: Tasks 1.4 (Flyway funcional) e 1.6 (auditoria base) concluidas.

**Esforco**: 2-3 horas.

### Step 1.8.1 — Criar enums do dominio escrow

**Arquivo**: `C:/workspace-sep/src/main/java/com/dynamis/broker_app/escrow/domain/vo/StatusContaEscrow.java`
```java
package com.dynamis.broker_app.escrow.domain.vo;

public enum StatusContaEscrow {
    EM_ABERTURA, ATIVA, BLOQUEADA, ENCERRADA
}
```

**Arquivo**: `C:/workspace-sep/src/main/java/com/dynamis/broker_app/escrow/domain/vo/TipoWallet.java`
```java
package com.dynamis.broker_app.escrow.domain.vo;

public enum TipoWallet {
    PROPOSTA, OPERACAO, RESERVA_OPERACIONAL
}
```

**Arquivo**: `C:/workspace-sep/src/main/java/com/dynamis/broker_app/escrow/domain/vo/TipoMovimentacao.java`
```java
package com.dynamis.broker_app.escrow.domain.vo;

/**
 * Tipos de movimentacao na conta escrow segregada (PRD §11, ADR 0005).
 *
 * <p>Sealed para forcar que todo handler trate todos os casos via
 * {@code switch} exhaustivo.
 */
public sealed interface TipoMovimentacao
    permits TipoMovimentacao.Aporte,
            TipoMovimentacao.Desembolso,
            TipoMovimentacao.Recebimento,
            TipoMovimentacao.Retirada {

    record Aporte() implements TipoMovimentacao {}
    record Desembolso() implements TipoMovimentacao {}
    record Recebimento() implements TipoMovimentacao {}
    record Retirada() implements TipoMovimentacao {}
}
```

**Arquivo**: `C:/workspace-sep/src/main/java/com/dynamis/broker_app/escrow/domain/vo/StatusMovimentacao.java`
```java
package com.dynamis.broker_app.escrow.domain.vo;

public enum StatusMovimentacao {
    INICIADA, EM_PROCESSAMENTO, LIQUIDADA, FALHOU, REVERTIDA
}
```

### Step 1.8.2 — Criar entidade `ContaEscrow`

**Arquivo**: `C:/workspace-sep/src/main/java/com/dynamis/broker_app/escrow/domain/model/ContaEscrow.java`

**Conteudo**:
```java
package com.dynamis.broker_app.escrow.domain.model;

import com.dynamis.broker_app.escrow.domain.vo.StatusContaEscrow;
import com.dynamis.broker_app.shared.audit.EntidadeAuditavel;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

/**
 * Conta escrow segregada conforme Resolucao CMN 4.656/2018 e ADR 0005.
 *
 * <p>Modelagem inicial da Sprint 1 — regra de negocio (abertura concreta via
 * Celcoin, movimentacoes reais) entra na Epic 15. Sprint 1 apenas garante que
 * o schema e a estrutura JPA estao prontos.
 */
@Entity
@Table(name = "conta_escrow")
public class ContaEscrow extends EntidadeAuditavel {

    @Id
    @Column(name = "id")
    private UUID id;

    @Column(name = "external_id", length = 100)
    private String externalId;

    @Column(name = "titular", nullable = false, length = 255)
    private String titular;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 40)
    private StatusContaEscrow status;

    protected ContaEscrow() {
        // JPA
    }

    // getters/setters omitidos por brevidade; gerados pelo IDE ou Lombok no codigo final
    public UUID getId() { return id; }
    public String getExternalId() { return externalId; }
    public String getTitular() { return titular; }
    public StatusContaEscrow getStatus() { return status; }
}
```

### Step 1.8.3 — Criar entidades `Wallet` e `MovimentacaoEscrow`

**Arquivo**: `C:/workspace-sep/src/main/java/com/dynamis/broker_app/escrow/domain/model/Wallet.java`
```java
package com.dynamis.broker_app.escrow.domain.model;

import com.dynamis.broker_app.escrow.domain.vo.TipoWallet;
import com.dynamis.broker_app.shared.audit.EntidadeAuditavel;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "wallet")
public class Wallet extends EntidadeAuditavel {

    @Id
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conta_escrow_id", nullable = false)
    private ContaEscrow contaEscrow;

    @Column(name = "proposta_id")
    private UUID propostaId;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_wallet", nullable = false, length = 40)
    private TipoWallet tipoWallet;

    @Column(name = "saldo", nullable = false, precision = 19, scale = 2)
    private BigDecimal saldo;

    protected Wallet() {}

    public UUID getId() { return id; }
    public ContaEscrow getContaEscrow() { return contaEscrow; }
    public UUID getPropostaId() { return propostaId; }
    public TipoWallet getTipoWallet() { return tipoWallet; }
    public BigDecimal getSaldo() { return saldo; }
}
```

**Arquivo**: `C:/workspace-sep/src/main/java/com/dynamis/broker_app/escrow/domain/model/MovimentacaoEscrow.java`
```java
package com.dynamis.broker_app.escrow.domain.model;

import com.dynamis.broker_app.escrow.domain.vo.StatusMovimentacao;
import com.dynamis.broker_app.shared.audit.EntidadeAuditavel;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "movimentacao_escrow")
public class MovimentacaoEscrow extends EntidadeAuditavel {

    @Id
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wallet_id", nullable = false)
    private Wallet wallet;

    @Column(name = "tipo", nullable = false, length = 40)
    private String tipo;  // serializa o sealed type pelo nome do permits (Aporte, Desembolso, Recebimento, Retirada)

    @Column(name = "valor", nullable = false, precision = 19, scale = 2)
    private BigDecimal valor;

    @Column(name = "idempotency_key", nullable = false, unique = true, length = 100)
    private String idempotencyKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 40)
    private StatusMovimentacao status;

    @Column(name = "data_movimentacao", nullable = false)
    private OffsetDateTime dataMovimentacao;

    protected MovimentacaoEscrow() {}

    public UUID getId() { return id; }
    public Wallet getWallet() { return wallet; }
    public String getTipo() { return tipo; }
    public BigDecimal getValor() { return valor; }
    public String getIdempotencyKey() { return idempotencyKey; }
    public StatusMovimentacao getStatus() { return status; }
    public OffsetDateTime getDataMovimentacao() { return dataMovimentacao; }
}
```

### Step 1.8.4 — Criar `EscrowProvider` interface (vazia)

**Arquivo**: `C:/workspace-sep/src/main/java/com/dynamis/broker_app/escrow/application/port/out/EscrowProvider.java`

**Conteudo**:
```java
package com.dynamis.broker_app.escrow.application.port.out;

/**
 * Port de saida para integracao com BaaS de escrow (Celcoin, conforme ADR 0005).
 *
 * <p>Sprint 1: interface vazia, modelagem apenas. A implementacao concreta
 * ({@code CelcoinEscrowProvider}) entra na Epic 15 (Pix), quando o ciclo de
 * abertura de conta escrow real for necessario.
 *
 * <p>Os metodos esperados (ainda nao declarados) cobrirao:
 * abertura de conta, criacao de wallet por proposta/operacao, registro de
 * movimentacao com {@code Idempotency-Key}, consulta de saldo, consulta de
 * extrato.
 */
public interface EscrowProvider {
    // Vazio na Sprint 1 — Epic 15 declarara os metodos.
}
```

### Step 1.8.5 — Criar migration V2 com tabelas escrow

**Arquivo**: `C:/workspace-sep/src/main/resources/db/migration/V2__criar_estrutura_escrow.sql`

**Conteudo**:
```sql
-- =============================================================================
-- Migration V2 - Sprint 1 - Estrutura inicial do modulo escrow (CMN 4.656/2018, ADR 0005)
-- =============================================================================
-- Modela conta_escrow, wallet e movimentacao_escrow. Entidades da Sprint 1;
-- regras concretas de movimentacao (Pix, abertura via Celcoin) entram na Epic 15.
-- =============================================================================

CREATE TABLE conta_escrow (
  id UUID PRIMARY KEY,
  external_id VARCHAR(100),
  titular VARCHAR(255) NOT NULL,
  status VARCHAR(40) NOT NULL,

  data_criacao TIMESTAMP WITH TIME ZONE NOT NULL,
  data_modificacao TIMESTAMP WITH TIME ZONE NOT NULL,
  criado_por VARCHAR(50) NOT NULL DEFAULT 'system',
  modificado_por VARCHAR(50) NOT NULL DEFAULT 'system',

  CONSTRAINT chk_conta_escrow_status CHECK (status IN ('EM_ABERTURA', 'ATIVA', 'BLOQUEADA', 'ENCERRADA'))
);
CREATE UNIQUE INDEX idx_conta_escrow_external_id ON conta_escrow(external_id) WHERE external_id IS NOT NULL;
COMMENT ON TABLE conta_escrow IS 'Conta escrow segregada (Resolucao CMN 4.656/2018, ADR 0005). Sprint 1: schema; Epic 15: regra de negocio.';

CREATE TABLE wallet (
  id UUID PRIMARY KEY,
  conta_escrow_id UUID NOT NULL REFERENCES conta_escrow(id),
  proposta_id UUID,
  tipo_wallet VARCHAR(40) NOT NULL,
  saldo NUMERIC(19,2) NOT NULL DEFAULT 0,

  data_criacao TIMESTAMP WITH TIME ZONE NOT NULL,
  data_modificacao TIMESTAMP WITH TIME ZONE NOT NULL,
  criado_por VARCHAR(50) NOT NULL DEFAULT 'system',
  modificado_por VARCHAR(50) NOT NULL DEFAULT 'system',

  CONSTRAINT chk_wallet_tipo CHECK (tipo_wallet IN ('PROPOSTA', 'OPERACAO', 'RESERVA_OPERACIONAL')),
  CONSTRAINT chk_wallet_saldo_nao_negativo CHECK (saldo >= 0)
);
CREATE INDEX idx_wallet_conta_escrow ON wallet(conta_escrow_id);
CREATE INDEX idx_wallet_proposta ON wallet(proposta_id) WHERE proposta_id IS NOT NULL;

CREATE TABLE movimentacao_escrow (
  id UUID PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES wallet(id),
  tipo VARCHAR(40) NOT NULL,
  valor NUMERIC(19,2) NOT NULL,
  idempotency_key VARCHAR(100) NOT NULL,
  status VARCHAR(40) NOT NULL,
  data_movimentacao TIMESTAMP WITH TIME ZONE NOT NULL,

  data_criacao TIMESTAMP WITH TIME ZONE NOT NULL,
  data_modificacao TIMESTAMP WITH TIME ZONE NOT NULL,
  criado_por VARCHAR(50) NOT NULL DEFAULT 'system',
  modificado_por VARCHAR(50) NOT NULL DEFAULT 'system',

  CONSTRAINT uq_movimentacao_idempotency UNIQUE (idempotency_key),
  CONSTRAINT chk_movimentacao_tipo CHECK (tipo IN ('Aporte', 'Desembolso', 'Recebimento', 'Retirada')),
  CONSTRAINT chk_movimentacao_status CHECK (status IN ('INICIADA', 'EM_PROCESSAMENTO', 'LIQUIDADA', 'FALHOU', 'REVERTIDA')),
  CONSTRAINT chk_movimentacao_valor_positivo CHECK (valor > 0)
);
CREATE INDEX idx_movimentacao_wallet ON movimentacao_escrow(wallet_id);
CREATE INDEX idx_movimentacao_status_data ON movimentacao_escrow(status, data_movimentacao DESC);
COMMENT ON COLUMN movimentacao_escrow.idempotency_key IS 'Chave unica de idempotencia para evitar movimentacoes duplicadas (Header Idempotency-Key).';
```

### Step 1.8.6 — Validar migrations

**Comando**:
```bash
cd C:/workspace-sep
docker compose down -v   # limpar volume para re-aplicar do zero
docker compose up -d postgres
sleep 10
./gradlew bootRun --args='--spring.profiles.active=dev' &
SERVER_PID=$!
sleep 30

docker exec -it sep-postgres psql -U sep -d sep_dev -c "\dt"
# Esperado: usuario, conta_escrow, wallet, movimentacao_escrow, flyway_schema_history

docker exec -it sep-postgres psql -U sep -d sep_dev \
  -c "SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank;"
# Esperado: V1 init OK, V2 criar_estrutura_escrow OK

kill $SERVER_PID 2>/dev/null || true
```

### Definicao de pronto da Task 1.8
- [ ] Enums `StatusContaEscrow`, `TipoWallet`, `TipoMovimentacao` (sealed), `StatusMovimentacao` criados
- [ ] Entidades `ContaEscrow`, `Wallet`, `MovimentacaoEscrow` extendendo `EntidadeAuditavel`
- [ ] Interface `EscrowProvider` em `escrow.application.port.out` (vazia, com Javadoc explicando)
- [ ] Migration `V2__criar_estrutura_escrow.sql` com 3 tabelas + constraints + indexes
- [ ] Boot aplica V1 e V2 com sucesso
- [ ] `flyway_schema_history` registra V2

### Commit Task 1.8
```bash
git add src/main/java/com/dynamis/broker_app/escrow/
git add src/main/resources/db/migration/V2__criar_estrutura_escrow.sql
git commit -m "feat(escrow): modelagem inicial do modulo escrow (ContaEscrow + Wallet + MovimentacaoEscrow + EscrowProvider port)"
```

---

## Task 1.9 — Teste de boot e healthcheck

**Objetivo**: garantir que o contexto Spring carrega, o healthcheck responde e o `ApiExceptionHandler` funciona, com test slice apropriado e Testcontainers para a parte de banco. Inicia a cultura de TDD do projeto.

**Pre-requisito**: Tasks 1.5 e 1.6 concluidas.

**Esforco**: 2-3 horas.

### Step 1.9.1 — Configurar Testcontainers no `application-test.yml`

Ja feito na Task 1.1c. Confirmar que o arquivo `src/test/resources/application-test.yml` existe e usa o JDBC URL do Testcontainers (`jdbc:tc:postgresql:16:///sep_test`).

### Step 1.9.2 — Criar `SmokeBootTest`

**Arquivo**: `C:/workspace-sep/src/test/java/com/dynamis/broker_app/SmokeBootTest.java`

**Conteudo**:
```java
package com.dynamis.broker_app;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.client.AutoConfigureWebClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Smoke test que confirma:
 * - contexto Spring carrega com Testcontainers Postgres real
 * - {@code GET /actuator/health} responde 200 + status UP
 * - Flyway aplica V1 e V2 no boot do teste
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebClient
@ActiveProfiles("test")
@Testcontainers
class SmokeBootTest {

    @Container
    @SuppressWarnings("resource") // gerenciado pelo @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
        .withDatabaseName("sep_test")
        .withUsername("test")
        .withPassword("test");

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate rest;

    @Test
    void contextLoads() {
        // se o teste chega aqui, o contexto carregou OK (com migrations aplicadas)
        assertThat(postgres.isRunning()).isTrue();
    }

    @Test
    void healthCheckReturnsUp() {
        ResponseEntity<JsonNode> response = rest.getForEntity(
            "http://localhost:" + port + "/actuator/health", JsonNode.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("status").asText()).isEqualTo("UP");
        assertThat(response.getBody().get("components").get("db").get("status").asText())
            .isEqualTo("UP");
    }
}
```

### Step 1.9.3 — Criar `ApiExceptionHandlerTest`

**Arquivo**: `C:/workspace-sep/src/test/java/com/dynamis/broker_app/shared/exception/ApiExceptionHandlerTest.java`

**Conteudo**:
```java
package com.dynamis.broker_app.shared.exception;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * Cobertura unitaria do {@link ApiExceptionHandler} stub. Sprint 4 vai
 * estender com cenarios completos.
 */
class ApiExceptionHandlerTest {

    private final ApiExceptionHandler handler = new ApiExceptionHandler();
    private final HttpServletRequest request = Mockito.mock(HttpServletRequest.class);

    @Test
    void domainValidacaoMapeiaPara400() {
        Mockito.when(request.getRequestURI()).thenReturn("/api/v1/test");
        ValidacaoException ex = new ValidacaoException("VAL_001", "campo invalido");

        ResponseEntity<ErrorResponseDto> response = handler.handleDomain(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(400);
        assertThat(response.getBody().message()).isEqualTo("campo invalido");
        assertThat(response.getBody().path()).isEqualTo("/api/v1/test");
    }

    @Test
    void domainNaoEncontradoMapeiaPara404() {
        Mockito.when(request.getRequestURI()).thenReturn("/api/v1/test");
        RecursoNaoEncontradoException ex = new RecursoNaoEncontradoException("REC_001", "nao existe");

        ResponseEntity<ErrorResponseDto> response = handler.handleDomain(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody().status()).isEqualTo(404);
    }

    @Test
    void domainConflitoMapeiaPara409() {
        Mockito.when(request.getRequestURI()).thenReturn("/api/v1/test");
        ConflitoException ex = new ConflitoException("CON_001", "duplicado");

        ResponseEntity<ErrorResponseDto> response = handler.handleDomain(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().status()).isEqualTo(409);
    }

    @Test
    void excecaoGenericaMapeiaPara500SemStackTrace() {
        Mockito.when(request.getRequestURI()).thenReturn("/api/v1/test");
        Exception ex = new RuntimeException("erro interno qualquer");

        ResponseEntity<ErrorResponseDto> response = handler.handleGeneric(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody().message()).doesNotContain("RuntimeException");
        assertThat(response.getBody().message()).doesNotContain("at com.dynamis");
    }
}
```

### Step 1.9.4 — Criar `EntidadeAuditavelTest` (validacao de auditoria via entidade fictícia)

**Arquivo**: `C:/workspace-sep/src/test/java/com/dynamis/broker_app/shared/audit/EntidadeAuditavelTest.java`

**Conteudo**:
```java
package com.dynamis.broker_app.shared.audit;

import static org.assertj.core.api.Assertions.assertThat;

import com.dynamis.broker_app.escrow.domain.model.ContaEscrow;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Valida que entidades estendendo {@link EntidadeAuditavel} ganham
 * automaticamente os 4 campos de auditoria preenchidos no flush, com
 * fallback {@code "system"} quando nao ha autenticacao.
 *
 * <p>Usa {@link ContaEscrow} (Task 1.8) como entidade alvo, evitando criar
 * uma entidade de teste extra apenas para este caso.
 */
@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
class EntidadeAuditavelTest {

    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void overrideProps(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private EntityManager em;

    @Test
    @Transactional
    void auditoriaPreenchidaComSystemQuandoSemAutenticacao() {
        // Reflection mininal para criar uma ContaEscrow valida; em codigo real,
        // a Sprint 8 ou Epic 15 traz factories proprias.
        ContaEscrow conta = newContaEscrow();
        em.persist(conta);
        em.flush();

        ContaEscrow recarregada = em.find(ContaEscrow.class, conta.getId());
        assertThat(recarregada.getDataCriacao()).isNotNull();
        assertThat(recarregada.getDataModificacao()).isNotNull();
        assertThat(recarregada.getCriadoPor()).isEqualTo(AuditorAwareImpl.SYSTEM);
        assertThat(recarregada.getModificadoPor()).isEqualTo(AuditorAwareImpl.SYSTEM);
    }

    private ContaEscrow newContaEscrow() {
        // Helper minimo via reflection (em codigo real, factory na Sprint 8/Epic 15).
        try {
            ContaEscrow c = ContaEscrow.class.getDeclaredConstructor().newInstance();
            java.lang.reflect.Field id = ContaEscrow.class.getDeclaredField("id");
            id.setAccessible(true);
            id.set(c, java.util.UUID.randomUUID());
            java.lang.reflect.Field titular = ContaEscrow.class.getDeclaredField("titular");
            titular.setAccessible(true);
            titular.set(c, "Conta de Teste");
            java.lang.reflect.Field status = ContaEscrow.class.getDeclaredField("status");
            status.setAccessible(true);
            status.set(c, com.dynamis.broker_app.escrow.domain.vo.StatusContaEscrow.EM_ABERTURA);
            return c;
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
```

### Step 1.9.5 — Rodar todos os testes

**Comando**:
```bash
cd C:/workspace-sep
./gradlew clean test
```

**Esperado**: `BUILD SUCCESSFUL` com todos os testes passando.

**Conferir relatorio JaCoCo**:
```bash
./gradlew jacocoTestReport
ls build/reports/jacoco/test/html/index.html
# Abrir no browser para ver cobertura. Sprint 1 nao verifica target ainda
# (verificacao 70% liga a partir da Sprint 4).
```

### Definicao de pronto da Task 1.9
- [ ] `SmokeBootTest` passa: contexto carrega + `/actuator/health` retorna `UP`
- [ ] `ApiExceptionHandlerTest` passa com 4 cenarios (validacao, nao encontrado, conflito, generico)
- [ ] `EntidadeAuditavelTest` passa: entidade ganha `criadoPor = "system"` automaticamente
- [ ] Testcontainers Postgres real usado (sem H2)
- [ ] `./gradlew test` verde
- [ ] Relatorio JaCoCo gerado em `build/reports/jacoco/test/html/`

### Commit Task 1.9
```bash
git add src/test/
git commit -m "test(backend): smoke tests da fundacao (boot + healthcheck + ApiExceptionHandler + auditoria)"
```

---

## Definicao de Pronto da Sprint 1 (consolidada)

A Sprint 1 esta concluida quando todas as 11 tasks tiverem checklist completo:

- [ ] **Task 1.1a** — Spring Initializr + Gradle Wrapper 8.x + estrutura de pacotes Hexagonal por modulo
- [ ] **Task 1.1b** — Dependencias pinadas (`build.gradle` com Spring Boot 3.5.5, MapStruct 1.6, JJWT 0.12.6, WireMock 3.9.2, Resilience4j 2.x)
- [ ] **Task 1.1c** — `application.yml` + `application-dev.yml` + `application-test.yml`
- [ ] **Task 1.2** — Docker Compose com Postgres 16-alpine subindo healthy
- [ ] **Task 1.3** — `LocaleConfig` + `CorsConfig` + `SecurityConfig` (esqueleto)
- [ ] **Task 1.4** — Flyway + V1 (esqueleto da tabela `usuario`)
- [ ] **Task 1.5** — `ApiExceptionHandler` stub + `ErrorResponseDto` + `DomainException` sealed
- [ ] **Task 1.6** — `EntidadeAuditavel` + `AuditorAwareImpl` + `JpaAuditingConfig`
- [ ] **Task 1.7** — `RestClientFactory` + `Resilience4jConfig` + `IdempotencyKeyInterceptor` + `CorrelationIdFilter`
- [ ] **Task 1.8** — Modulo `escrow` modelado (entidades + V2 + `EscrowProvider` port)
- [ ] **Task 1.9** — Smoke tests passando (`SmokeBootTest`, `ApiExceptionHandlerTest`, `EntidadeAuditavelTest`)

## Cenarios de verificacao manual (fim de sprint)

1. Subir banco: `docker compose up -d postgres` → `docker compose ps` mostra `healthy`
2. Subir aplicacao: `./gradlew bootRun --args='--spring.profiles.active=dev'`
3. Healthcheck: `curl http://localhost:8080/actuator/health` → `{"status":"UP","components":{"db":{"status":"UP",...},"diskSpace":...,"ping":...}}`
4. Prometheus: `curl http://localhost:8080/actuator/prometheus | head -20` → metricas exibidas
5. Swagger UI: abrir `http://localhost:8080/swagger-ui.html` → pagina carrega (vazia, Sprint 4 popula)
6. CORS preflight: `curl -i -X OPTIONS http://localhost:8080/actuator/health -H "Origin: http://localhost:4200" -H "Access-Control-Request-Method: GET"` → headers `Access-Control-Allow-Origin: http://localhost:4200`
7. 404 padronizado: `curl -i -u user:senha http://localhost:8080/api/v1/nao-existe` → `ErrorResponseDto` 404
8. Tabelas no banco: `docker exec -it sep-postgres psql -U sep -d sep_dev -c "\dt"` → `usuario`, `conta_escrow`, `wallet`, `movimentacao_escrow`, `flyway_schema_history`
9. Migrations: `docker exec -it sep-postgres psql -U sep -d sep_dev -c "SELECT version, success FROM flyway_schema_history;"` → V1 e V2 com `success = true`
10. Persistencia do volume: `docker compose down && docker compose up -d postgres` → tabelas continuam la

## Estado esperado do repositorio apos Sprint 1

```
C:/workspace-sep/
├── .editorconfig
├── .env.example
├── .gitattributes
├── .gitignore
├── .githooks/                              # da Sprint 0
├── .github/                                # da Sprint 0
├── adr/                                    # ja existe (Sprint 0)
├── build.gradle                            # ATUALIZADO Sprint 1.1b
├── docker-compose.yml                      # NOVO Sprint 1.2
├── docs-sep/                               # ja existe
├── gradle/wrapper/                         # NOVO Sprint 1.1a
├── gradlew, gradlew.bat                    # NOVO Sprint 1.1a
├── settings.gradle                         # NOVO Sprint 1.1a
├── src/
│   ├── main/
│   │   ├── java/com/dynamis/broker_app/
│   │   │   ├── BrokerAppApplication.java   # NOVO Sprint 1.1a
│   │   │   ├── escrow/                     # POPULADO Sprint 1.8
│   │   │   │   ├── application/port/out/EscrowProvider.java
│   │   │   │   └── domain/{model,vo}/...
│   │   │   ├── identity/infrastructure/config/SecurityConfig.java   # Sprint 1.3
│   │   │   ├── shared/
│   │   │   │   ├── audit/                  # Sprint 1.6
│   │   │   │   │   ├── AuditorAwareImpl.java
│   │   │   │   │   ├── EntidadeAuditavel.java
│   │   │   │   │   └── JpaAuditingConfig.java
│   │   │   │   ├── config/                 # Sprint 1.3
│   │   │   │   │   ├── CorsConfig.java
│   │   │   │   │   └── LocaleConfig.java
│   │   │   │   ├── exception/              # Sprint 1.5
│   │   │   │   │   ├── ApiExceptionHandler.java
│   │   │   │   │   ├── ConflitoException.java
│   │   │   │   │   ├── DomainException.java
│   │   │   │   │   ├── ErrorResponseDto.java
│   │   │   │   │   ├── RecursoNaoEncontradoException.java
│   │   │   │   │   └── ValidacaoException.java
│   │   │   │   └── integration/            # Sprint 1.7
│   │   │   │       ├── CorrelationIdFilter.java
│   │   │   │       ├── IdempotencyKeyInterceptor.java
│   │   │   │       ├── Resilience4jConfig.java
│   │   │   │       └── RestClientFactory.java
│   │   │   └── (demais 11 modulos com package-info.java + sub-pacotes vazios)
│   │   └── resources/
│   │       ├── application.yml             # Sprint 1.1c
│   │       ├── application-dev.yml         # Sprint 1.1c
│   │       └── db/migration/
│   │           ├── V1__init.sql            # Sprint 1.4
│   │           └── V2__criar_estrutura_escrow.sql  # Sprint 1.8
│   └── test/
│       ├── java/com/dynamis/broker_app/
│       │   ├── SmokeBootTest.java                              # Sprint 1.9
│       │   ├── shared/audit/EntidadeAuditavelTest.java         # Sprint 1.9
│       │   └── shared/exception/ApiExceptionHandlerTest.java   # Sprint 1.9
│       └── resources/
│           └── application-test.yml        # Sprint 1.1c
```

## Proximos passos apos Sprint 1

1. **Sprint 2** — comeca com [`specs/fase-1/002-sprint-2-gestao-usuarios.md`](../../specs/fase-1/002-sprint-2-gestao-usuarios.md). Antes, gerar `steps/backend/002-sprint-2-steps.md` seguindo o mesmo padrao deste arquivo (just-in-time, conforme regra do AGENT.md).
2. **F-Sprint 2 Web** — em paralelo, ja deve estar consumindo MSW e preparada para receber contratos reais quando a Sprint 2 entregar `POST /api/v1/usuarios`.

## Restricoes e regras de execucao

- Commits podem ser feitos pelo agente de IA quando solicitado; push e PR sao manuais (regra do AGENT.md)
- Ao final de cada task, parar para teste local manual antes de seguir
- Spotless deve passar em cada PR (configurado na Sprint 0)
- JaCoCo nao verifica target ainda nesta sprint (target 70% entra em Sprint 4); apenas gera relatorio
- Nenhum modulo de dominio (alem de `escrow` schema-only) e implementado nesta sprint — Sprint 2 traz `usuarios`

## Referencias

- [Spec 001 - Sprint 1 Fundacao Tecnica](../../specs/fase-1/001-sprint-1-fundacao-tecnica.md) — descricao alta das tasks
- [PRD §11, §13, §15, §16, §22](../../docs-sep/PRD.md) — stack, padroes, convencoes
- [CONTEXT.md](../../docs-sep/CONTEXT.md) — historico de decisoes
- [AGENT.md](../../AGENT.md) — orientacao para agentes de IA neste projeto
- [Steps Sprint 0 backend](./000-sprint-0-steps.md) — predecessor (tooling + estrutura)
- ADRs [0001 - Monolito modular DDD](../../adr/0001-monolito-modular-orientado-a-ddd.md), [0004 - Provider Pattern](../../adr/0004-provider-pattern-para-integracoes-externas.md), [0005 - Escrow](../../adr/0005-segregacao-patrimonial-via-conta-escrow.md), [0006 - MapStruct](../../adr/0006-mapstruct-substitui-modelmapper.md), [0007 - Hexagonal](../../adr/0007-ddd-com-hexagonal-ports-and-adapters-por-modulo.md), [0008 - WireMock](../../adr/0008-wiremock-para-testes-integracao-celcoin.md)
