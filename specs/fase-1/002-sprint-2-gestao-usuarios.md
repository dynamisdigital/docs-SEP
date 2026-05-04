# Spec 002 - Sprint 2 - Gestao de Usuarios

## Metadados

- **ID da Spec**: 002
- **Titulo**: Sprint 2 - Gestao de Usuarios
- **Status**: aprovada para execucao (apos conclusao da Spec 001)
- **Fase do produto**: Epic 2 - Gestao de Usuarios
- **Origem**: PRD - API SEP, Secao 22 (Backlog Tecnico Implementavel)
- **Depende de**: [`001-sprint-1-fundacao-tecnica.md`](./001-sprint-1-fundacao-tecnica.md)
- **Responsavel principal**: Dev Senior

## Objetivo

Entregar a base de dominio da API: modelagem da entidade `Usuario`, contratos de DTO, mapeamento e a primeira operacao publica de negocio (criacao de usuario sem autenticacao). Ao final desta sprint, a API deve permitir cadastrar usuarios com validacao de e-mail e senha, persistindo corretamente identificador `UUID`, hash de senha e campos de auditoria.

## Escopo

### Em escopo
- entidade JPA `Usuario` estendendo `EntidadeAuditavel` (criada na Sprint 1) com `UUID` v6 e repositorio Spring Data
- DTOs obrigatorios como `record`: `UsuarioCreateDto`, `UsuarioResponseDto`, `UsuarioSenhaUpdateDto`
- `UsuarioMapper` via **MapStruct** (substituiu ModelMapper)
- endpoint publico `POST /api/v1/usuarios` para criacao de admin e cliente
- validacao declarativa dos DTOs com Jakarta Bean Validation (`@Email`, `@Size(min=6, max=6)`, `@NotNull`, `role in {ADMIN, CLIENTE}`)
- persistencia de senha com hash `BCrypt`
- garantia de que a senha nunca aparece em respostas da API
- testes da Sprint 2 distribuidos por task (TDD), incluindo unit tests do service e tests de slice (`@WebMvcTest` para controller, `@DataJpaTest` para repository)

### Fora de escopo nesta spec
- login, emissao de JWT e filtros de seguranca (Sprint 3)
- consulta de usuario por id com autorizacao por ownership (Sprint 3)
- listagem de usuarios restrita a admin (Sprint 3)
- alteracao da propria senha autenticada (Sprint 3)
- evolucao do `ApiExceptionHandler` (stub ja existe da Sprint 1, evolui na Sprint 4)
- Swagger UI detalhada (Sprint 4)

## Pre-requisitos globais

- Spec 001 concluida e validada
- migrations V1 (schema base) e V2 (escrow) aplicadas e `flyway_schema_history` populado
- banco PostgreSQL local funcional via Docker Compose
- `EntidadeAuditavel` + `AuditorAware` funcionais (criados na Sprint 1)
- `ApiExceptionHandler` stub funcional (criado na Sprint 1) — usuario de validacao deve passar pelo handler
- dependencias de JPA, validacao, MapStruct e UUID ja declaradas no `build.gradle` da Sprint 1

## Tasks

### Task 2.1 - Entidade Usuario e repositorio (estende EntidadeAuditavel)

**Descricao**
Modelar a entidade JPA `Usuario` no modulo `usuarios.domain.model`, **estendendo `EntidadeAuditavel`** (criada na Sprint 1) para herdar os 4 campos de auditoria automaticamente. Criar o repositorio Spring Data e a migration V3.

**Arquivos esperados**
- `usuarios/domain/model/Usuario.java`
- `usuarios/domain/model/Role.java` (enum nesta Sprint; futura migracao para sealed type fica como follow-up)
- `usuarios/infrastructure/persistence/UsuarioRepository.java`
- `src/main/resources/db/migration/V3__criar_tabela_usuario.sql`
- `src/test/java/com/dynamis/sep_api/usuarios/infrastructure/persistence/UsuarioRepositoryTest.java` (`@DataJpaTest` com Testcontainers)

**Detalhes de implementacao**
- entidade anotada com `@Entity`, `@Table(name = "usuario")`
- estende `EntidadeAuditavel` (auditoria herdada — sem reconfiguracao)
- `id` do tipo `java.util.UUID`, mapeado para coluna `uuid` nativa do PostgreSQL
- geracao do UUID v6 em construtor estatico ou factory usando `com.fasterxml.uuid:java-uuid-generator`
- `username` (e-mail) unico e obrigatorio
- `password` obrigatorio (armazenado como hash BCrypt na Task 2.3)
- `role` do tipo enum `Role` persistido como `String`, valores `ADMIN` e `CLIENTE`
- repositorio expoe ao menos: `findByUsername(String)`, `existsByUsername(String)`, `findById(UUID)`

**Testes obrigatorios (Task 2.1)**
- `UsuarioRepositoryTest`:
  - persiste e recupera `Usuario`
  - `findByUsername` retorna `Optional` com usuario existente
  - `existsByUsername` retorna `true`/`false` corretamente
  - audit fields sao preenchidos automaticamente apos persist

**Criterios de verificacao**
- migration V3 aplica tabela `usuario` com tipo `uuid` nativo
- entidade compila e roda no Testcontainer
- audit fields preenchidos sem configuracao adicional (ja vem do `EntidadeAuditavel`)

**Pre-requisitos**
- Spec 001 concluida (em particular Tasks 1.4, 1.6 e 1.9)

**Dependencias**
- depende das Tasks 1.4 (Flyway) e 1.6 (auditoria base)

**Responsavel sugerido**
- Dev Senior

---

### Task 2.2 - DTOs (records) e Mapper MapStruct

**Descricao**
Definir os contratos de entrada e saida da API para usuario como **records Java 21**, e configurar o `UsuarioMapper` via **MapStruct** (geracao de codigo, type-safe, substitui ModelMapper). Garantir que a senha jamais seja exposta em respostas.

**Arquivos esperados**
- `usuarios/web/dto/UsuarioCreateDto.java` (`record`)
- `usuarios/web/dto/UsuarioResponseDto.java` (`record`)
- `usuarios/web/dto/UsuarioSenhaUpdateDto.java` (`record`)
- `usuarios/web/mapper/UsuarioMapper.java` (interface anotada com `@Mapper(componentModel = "spring")`)
- `src/test/java/com/dynamis/sep_api/usuarios/web/mapper/UsuarioMapperTest.java`

**Regras de validacao declarativa (Jakarta Bean Validation)**
- `UsuarioCreateDto.username`: `@NotBlank`, `@Email`
- `UsuarioCreateDto.password`: `@NotBlank`, `@Size(min = 6, max = 6)`
- `UsuarioCreateDto.role`: `@NotNull`, valores aceitos apenas `ADMIN` e `CLIENTE`
- `UsuarioSenhaUpdateDto.passwordAtual`: `@NotBlank`
- `UsuarioSenhaUpdateDto.novaSenha`: `@NotBlank`, `@Size(min = 6, max = 6)`

**Regras do mapper MapStruct**
- `Usuario -> UsuarioResponseDto`: NUNCA mapeia o campo `password` (use `@Mapping(target = "password", ignore = true)` ou simplesmente nao declare o campo no record de resposta)
- `UsuarioCreateDto -> Usuario`: ignora `id` (gerado), `password` precisa ser hashada antes de chamar o mapper
- datas serializadas em ISO-8601 com offset via configuracao Jackson global

**Testes obrigatorios (Task 2.2)**
- `UsuarioMapperTest`:
  - mapper converte `Usuario` para `UsuarioResponseDto` sem expor senha
  - record tem todos os campos esperados (id, username, role, dataCriacao, dataModificacao, criadoPor, modificadoPor)
  - mapper aceita `UsuarioCreateDto` para `Usuario` parcial (sem id e password)

**Criterios de verificacao**
- `UsuarioResponseDto` (record) nao tem campo `password`
- datas retornadas respeitam ISO-8601 com offset
- annotation processor MapStruct gera classe `UsuarioMapperImpl` em `build/generated/`
- testes do mapper passam

**Pre-requisitos**
- modelo da entidade `Usuario` estabilizado (Task 2.1)
- MapStruct annotation processor declarado no `build.gradle` (Task 1.1b)

**Dependencias**
- depende parcialmente da Task 2.1

**Responsavel sugerido**
- Dev Senior (com revisao opcional dos devs frontend para validar aderencia dos contratos)

---

### Task 2.3a - CriarUsuarioUseCase com BCrypt

**Descricao**
Implementar o caso de uso `CriarUsuarioUseCase` no modulo `usuarios.application.usecase`, que recebe `UsuarioCreateDto`, valida o hash de senha via `BCryptPasswordEncoder` e delega ao repositorio.

**Arquivos esperados**
- `usuarios/application/usecase/CriarUsuarioUseCase.java`
- `usuarios/application/exception/UsernameJaExisteException.java` (estende `DomainException` da Sprint 1)
- `src/test/java/com/dynamis/sep_api/usuarios/application/usecase/CriarUsuarioUseCaseTest.java` (`@MockitoExtension`, sem Spring)

**Contrato do use case**
- recebe `UsuarioCreateDto`, retorna `Usuario` persistido
- verifica `existsByUsername` antes do insert; se existir, lanca `UsernameJaExisteException` (mapeada para 409 pelo `ApiExceptionHandler`)
- aplica `BCryptPasswordEncoder.encode()` na senha antes de persistir
- transacional (`@Transactional`)

**Testes obrigatorios (Task 2.3a)**
- `CriarUsuarioUseCaseTest`:
  - cria `ADMIN` valido
  - cria `CLIENTE` valido
  - lanca `UsernameJaExisteException` quando username ja existe
  - senha persistida com hash BCrypt (verifica que `passwordEncoder.encode()` foi chamado)
  - chama `repository.save()` apenas uma vez

**Criterios de verificacao**
- testes passam isoladamente sem Spring context
- `UsernameJaExisteException` herda de `DomainException`
- senha nunca persiste em texto claro

**Pre-requisitos**
- Tasks 2.1, 2.2 concluidas

**Dependencias**
- depende de Tasks 2.1 e 2.2

**Responsavel sugerido**
- Dev Senior

---

### Task 2.3b - UsuarioController POST + SecurityConfig publico

**Descricao**
Expor `POST /api/v1/usuarios` como endpoint publico no `UsuarioController`, delegando ao `CriarUsuarioUseCase`. Liberar a rota no `SecurityConfig`.

**Arquivos esperados**
- `usuarios/web/controller/UsuarioController.java`
- update em `shared/config/SecurityConfig.java` (ou `identity/infrastructure/config/SecurityConfig.java` se ja existir) liberando `POST /api/v1/usuarios`
- `src/test/java/com/dynamis/sep_api/usuarios/web/controller/UsuarioControllerTest.java` (`@WebMvcTest` com `MockMvc`)

**Contrato do endpoint**
- request: `UsuarioCreateDto`
- response: `UsuarioResponseDto` com status `201 Created`
- header `Location: /api/v1/usuarios/{id}`
- conflito de `username` retorna `409` com `ErrorResponseDto` (handler ja existente desde Sprint 1)
- validacao falhada retorna `400` com `ErrorResponseDto`

**Testes obrigatorios (Task 2.3b)**
- `UsuarioControllerTest`:
  - `POST` valido retorna `201` e body `UsuarioResponseDto` sem `password`
  - `POST` com username invalido retorna `400`
  - `POST` com senha de tamanho diferente de 6 retorna `400`
  - `POST` com role nao aceito retorna `400`
  - conflito de username retorna `409`

**Criterios de verificacao**
- `MockMvc` verifica os 5 cenarios
- response body confere com `UsuarioResponseDto` (sem campo `password`)
- header `Location` presente em sucesso

**Pre-requisitos**
- Task 2.3a concluida

**Dependencias**
- depende de Task 2.3a

**Responsavel sugerido**
- Dev Senior

## Grafo de dependencias entre as tasks

```
Task 2.1 (entidade + repository + V3 + tests)
  |
  +---> Task 2.2 (records + MapStruct + tests)
  |       |
  +-------+--> Task 2.3a (CriarUsuarioUseCase + tests)
                |
                v
            Task 2.3b (Controller + SecurityConfig + tests)
```

- Task 2.1 e a raiz.
- Task 2.2 depende parcialmente da entidade estabilizada — pode comecar em paralelo apos 2.1 ter o esqueleto.
- Task 2.3a depende de 2.1 e 2.2.
- Task 2.3b depende de 2.3a.

## Definicao de pronto (Sprint 2)

- entidade `Usuario` persistida com `UUID` nativo, estendendo `EntidadeAuditavel`
- auditoria preenchida automaticamente, inclusive com fallback `system`
- DTOs (records) validados por Jakarta Bean Validation
- `UsuarioMapper` (MapStruct) gera codigo, sem usar ModelMapper
- `POST /api/v1/usuarios` funcional, criando `ADMIN` e `CLIENTE`, com header `Location`
- senha nunca exposta em resposta (record `UsuarioResponseDto` nao tem campo `password`)
- senha persistida com hash BCrypt
- conflito de username retorna `409` com `ErrorResponseDto` (via `ApiExceptionHandler` da Sprint 1)
- ao menos 8 testes automatizados passando: `UsuarioRepositoryTest`, `UsuarioMapperTest`, `CriarUsuarioUseCaseTest` (5 cenarios), `UsuarioControllerTest` (5 cenarios)
- JaCoCo nao regride (target 70% por modulo)

## Cenarios de verificacao manual

- criar `ADMIN` com `username` valido e `password` de 6 caracteres -> `201 Created`
- criar `CLIENTE` com dados validos -> `201 Created`
- tentar criar com `username` invalido -> recusa por validacao
- tentar criar com senha de tamanho diferente de 6 -> recusa por validacao
- tentar criar com `role` nao aceito -> recusa por validacao
- inspecionar a resposta do `201` e confirmar que `password` nao aparece
- inspecionar o registro persistido e confirmar `password` em hash BCrypt
- inspecionar o registro persistido e confirmar `criadoPor = system`, `modificadoPor = system`
- tentar criar um segundo usuario com mesmo `username` -> conflito esperado

## Impacto nas sprints seguintes

- **Sprint 3** consome a entidade `Usuario`, os records DTO e o `CriarUsuarioUseCase` para implementar login, JWT, filtros de seguranca e autorizacao por perfil e ownership. O `AuditorAware` (ja preparado na Sprint 1) ganha comportamento real com `Authentication` na Sprint 3.
- **Sprint 4** evolui o `ApiExceptionHandler` (stub da Sprint 1) com payload padrao completo, completa documentacao Swagger e introduz `Webhook Receiver Pattern`.

## Restricoes e regras de execucao

- commits podem ser feitos pelo agente de IA quando solicitado
- push e PR permanecem manuais
- ao final de cada task, a execucao deve parar para teste local manual
- TDD distribuido: cada task tem testes obrigatorios entregues junto com o codigo

## Referencias

- [PRD - API SEP](../../docs-sep/PRD.md), Secoes 7, 9, 10, 15, 20 e 22
- [CONTEXT.md](../../docs-sep/CONTEXT.md)
- [Spec 001](./001-sprint-1-fundacao-tecnica.md)
