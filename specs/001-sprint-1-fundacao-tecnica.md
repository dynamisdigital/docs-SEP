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
- dependencias principais resolvidas: web, security, data-jpa, actuator, validation, flyway, springdoc, modelmapper, java-uuid-generator
- PostgreSQL local via Docker Compose
- configuracao de locale `pt-BR` e timezone `America/Sao_Paulo`
- CORS basico configurado no `SecurityConfig`
- Actuator exposto com endpoint de healthcheck
- Flyway ativo com migration inicial versionada

### Fora de escopo nesta spec
- entidade `Usuario`, DTOs e controllers (Sprint 2)
- seguranca JWT, BCrypt e login (Sprint 3)
- `ApiExceptionHandler`, Springdoc documentado e testes automatizados (Sprint 4)
- qualquer regra de negocio de dominio
- deploy remoto, GitHub Actions, CI/CD

## Pre-requisitos globais

- PRD aprovado para a stack backend
- Java 21 instalado localmente
- Docker e Docker Compose funcionais na maquina do desenvolvedor
- Gradle Wrapper definido ou planejado para o projeto
- acesso ao repositorio backend

## Tasks

### Task 1.1 - Projeto backend base com Gradle, profiles e dependencias

**Descricao**
Configurar o projeto backend base com Gradle, definir profiles e declarar as dependencias principais necessarias para sustentar as sprints 2, 3 e 4.

**Arquivos esperados**
- `build.gradle`
- `settings.gradle`
- `src/main/resources/application.yml`
- `src/main/resources/application-dev.yml`

**Dependencias obrigatorias declaradas no Gradle**
- `spring-boot-starter-web`
- `spring-boot-starter-security`
- `spring-boot-starter-data-jpa`
- `spring-boot-starter-validation`
- `spring-boot-starter-actuator`
- `org.flywaydb:flyway-core` + driver compativel
- `org.postgresql:postgresql`
- `io.jsonwebtoken:jjwt-*` (ou biblioteca equivalente de JWT para uso na Sprint 3)
- `org.springdoc:springdoc-openapi-starter-webmvc-ui`
- `org.modelmapper:modelmapper`
- `com.fasterxml.uuid:java-uuid-generator:5.1.0`

**Criterios de verificacao**
- projeto sobe localmente com `./gradlew bootRun`
- profile `dev` funciona quando ativado por variavel de ambiente ou property
- dependencias principais resolvidas no build
- starter de validacao disponivel para uso em DTOs das sprints seguintes

**Pre-requisitos**
- PRD aprovado para stack backend
- Java 21 disponivel
- Gradle Wrapper definido ou planejado

**Dependencias**
- nenhuma task tecnica anterior

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

## Grafo de dependencias entre as tasks

```
Task 1.1
  |
  +---> Task 1.2 --+
  |                |
  +---> Task 1.3   |
                   v
                Task 1.4
```

- Task 1.1 e a raiz.
- Task 1.2 e Task 1.3 podem ocorrer em paralelo apos Task 1.1.
- Task 1.4 depende do banco (Task 1.2) e idealmente consome as configuracoes de Task 1.3.

## Definicao de pronto (Sprint 1)

A Sprint 1 e considerada concluida quando todos os itens abaixo forem atendidos:

- projeto sobe com `./gradlew bootRun` sem erro em profile `dev`
- PostgreSQL sobe via `docker compose up -d` e a aplicacao conecta
- `/actuator/health` responde com status `UP`
- locale default e `pt-BR`
- timezone default e `America/Sao_Paulo`
- CORS basico configurado para a origem do frontend de desenvolvimento
- Flyway aplica a migration inicial no boot
- `flyway_schema_history` contem o registro da V1
- tabela inicial existe com identificador `uuid` nativo
- dependencias de JWT, validacao, OpenAPI e UUID ja declaradas no Gradle, mesmo que ainda nao utilizadas pelas sprints seguintes

## Cenarios de verificacao manual

Ao final desta sprint, o desenvolvedor deve executar manualmente os seguintes cenarios:

- subir o banco via Docker Compose e confirmar conexao
- subir a aplicacao com profile `dev` e observar o log do Flyway aplicando a V1
- chamar `GET /actuator/health` e confirmar resposta `{"status":"UP"}`
- verificar no banco que a tabela `flyway_schema_history` contem a V1
- verificar no banco que a tabela inicial foi criada com coluna `id` do tipo `uuid`
- derrubar o banco com `docker compose down` e subir novamente, confirmando a persistencia do volume

## Impacto nas sprints seguintes

- **Sprint 2** (Gestao de Usuarios) depende desta spec para poder criar a entidade `Usuario`, o repositorio e os DTOs sobre o schema preparado aqui.
- **Sprint 3** (Seguranca JWT) depende das dependencias de JWT declaradas aqui no Gradle e da configuracao base de `SecurityConfig`.
- **Sprint 4** (Erros e Documentacao) depende do Actuator e do serializador de datas configurados aqui, alem do Springdoc declarado.

## Restricoes e regras de execucao

- commits podem ser feitos pelo agente de IA quando solicitado
- push e PR permanecem manuais nesta fase
- ao final de cada task, a execucao deve parar para teste local manual
- testes automatizados da sprint ficam concentrados na Sprint 4, mas nada impede verificacoes rapidas locais durante a Sprint 1
- GitHub Actions, deploy remoto e CI/CD ficam fora de escopo (planejados para o Epic 14 - Infraestrutura futura)

## Referencias

- [PRD - API SEP](../docs-sep/PRD.md), Secao 22 - Backlog Tecnico Implementavel
- [CONTEXT.md](../docs-sep/CONTEXT.md) - historia das decisoes do projeto
- [documentacao-dev.html](../docs-sep/documentacao-dev.html) - documentacao tecnica consolidada com diagramas
