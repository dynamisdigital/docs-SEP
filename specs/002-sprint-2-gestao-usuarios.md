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
- entidade JPA `Usuario` com `UUID` v6, auditoria JPA e repositorio Spring Data
- configuracao do Spring JPA Auditing com `AuditorAware` priorizando o UUID do usuario autenticado e fallback `system`
- DTOs obrigatorios: `UsuarioCreateDto`, `UsuarioResponseDto`, `UsuarioSenhaUpdateDto`
- `UsuarioMapper` via ModelMapper
- endpoint publico `POST /api/v1/usuarios` para criacao de admin e cliente
- validacao declarativa dos DTOs (`@Email`, `@Size(min=6, max=6)`, `@NotNull`, `role in {ADMIN, CLIENTE}`)
- persistencia de senha com hash `BCrypt`
- garantia de que a senha nunca aparece em respostas da API

### Fora de escopo nesta spec
- login, emissao de JWT e filtros de seguranca (Sprint 3)
- consulta de usuario por id com autorizacao por ownership (Sprint 3)
- listagem de usuarios restrita a admin (Sprint 3)
- alteracao da propria senha autenticada (Sprint 3)
- `ApiExceptionHandler` e payload padrao de erro (Sprint 4)
- Swagger UI detalhada (Sprint 4)
- testes automatizados (Sprint 4)

## Pre-requisitos globais

- Spec 001 concluida e validada
- migration inicial aplicada e `flyway_schema_history` populado
- banco PostgreSQL local funcional via Docker Compose
- dependencias de JPA, validacao, ModelMapper e UUID ja declaradas no `build.gradle`

## Tasks

### Task 2.1 - Entidade Usuario com UUID v6, auditoria e repositorio

**Descricao**
Modelar a entidade JPA `Usuario`, habilitar auditoria JPA via `AuditingEntityListener` e criar o repositorio Spring Data com as assinaturas minimas necessarias para as tasks desta sprint e das sprints seguintes.

**Arquivos esperados**
- `model/Usuario.java`
- `repository/UsuarioRepository.java`
- `config/SpringJpaAuditingConfig.java`

**Detalhes de implementacao**
- entidade anotada com `@Entity`, `@Table(name = "usuario")`, `@EntityListeners(AuditingEntityListener.class)`
- `id` do tipo `java.util.UUID`, mapeado para coluna `uuid` nativa do PostgreSQL
- `username` (e-mail) unico e obrigatorio
- `password` obrigatorio (armazenado como hash BCrypt na Task 2.3)
- `role` do tipo enum `Role` persistido como `String`, valores `ADMIN` e `CLIENTE`
- campos de auditoria: `dataCriacao`, `dataModificacao`, `criadoPor`, `modificadoPor`
- `SpringJpaAuditingConfig` habilita `@EnableJpaAuditing` e expoe um `AuditorAware<String>` que retorna o UUID do usuario autenticado ou `system` quando nao houver autenticacao no contexto
- geracao do UUID v6 usando a biblioteca `com.fasterxml.uuid:java-uuid-generator` (ja declarada na Sprint 1)

**Criterios de verificacao**
- criacao de usuario persiste `id` como `uuid` nativo no PostgreSQL
- campos de auditoria sao preenchidos automaticamente no insert e no update
- `AuditorAware` aplica corretamente o fallback `system` quando nao ha autenticacao (necessario para a criacao publica desta sprint)

**Pre-requisitos**
- Spec 001 concluida
- migration inicial funcionando

**Dependencias**
- depende da Task 1.4

**Responsavel sugerido**
- Dev Senior

---

### Task 2.2 - DTOs e Mapper de usuario

**Descricao**
Definir os contratos de entrada e saida da API para usuario e configurar o `UsuarioMapper` via ModelMapper, garantindo que a senha jamais seja exposta em respostas.

**Arquivos esperados**
- `web/dto/UsuarioCreateDto.java`
- `web/dto/UsuarioResponseDto.java`
- `web/dto/UsuarioSenhaUpdateDto.java`
- `web/dto/mapper/UsuarioMapper.java`

**Regras de validacao declarativa**
- `UsuarioCreateDto.username`: `@NotBlank`, `@Email`
- `UsuarioCreateDto.password`: `@NotBlank`, `@Size(min = 6, max = 6)`
- `UsuarioCreateDto.role`: `@NotNull`, valores aceitos apenas `ADMIN` e `CLIENTE`
- `UsuarioSenhaUpdateDto.passwordAtual`: `@NotBlank`
- `UsuarioSenhaUpdateDto.novaSenha`: `@NotBlank`, `@Size(min = 6, max = 6)`

**Regras do mapper**
- `Usuario -> UsuarioResponseDto` nunca deve expor o campo `password`
- datas serializadas em ISO-8601 com offset (ex.: `2026-04-24T18:30:00-03:00`)
- `criadoPor` e `modificadoPor` retornam o UUID do auditor ou `system`

**Criterios de verificacao**
- `UsuarioResponseDto` nao expoe o campo `password` em nenhum cenario
- datas retornadas respeitam ISO-8601 com offset
- `UsuarioMapper` converte entidade para DTO e DTO de criacao para entidade corretamente

**Pre-requisitos**
- modelo da entidade `Usuario` estabilizado (Task 2.1)

**Dependencias**
- depende parcialmente da Task 2.1

**Responsavel sugerido**
- Dev Senior (com revisao opcional dos devs frontend para validar aderencia dos contratos)

---

### Task 2.3 - Criacao publica de usuario

**Descricao**
Expor `POST /api/v1/usuarios` como endpoint publico de criacao de usuario, com validacao declarativa dos DTOs, hash da senha via `BCryptPasswordEncoder`, persistencia com auditoria preenchida via fallback `system` e retorno de `UsuarioResponseDto` com status `201 Created`.

**Arquivos esperados**
- `service/UsuarioService.java`
- `web/controller/UsuarioController.java`

**Contrato do endpoint**
- request: `UsuarioCreateDto`
- response: `UsuarioResponseDto` com status `201 Created`
- senha persistida com hash BCrypt antes do insert
- conflito de `username` ja existente deve ser detectado e tratado (formalizacao do payload padrao de erro fica na Sprint 4; por ora e aceitavel lancar excecao de conflito)
- endpoint liberado no `SecurityConfig` para acesso publico nesta fase

**Criterios de verificacao**
- `POST /api/v1/usuarios` cria corretamente usuarios `ADMIN` e `CLIENTE`
- validacoes de e-mail e senha rejeitam payloads invalidos
- senha e armazenada com hash BCrypt e nunca em texto claro
- resposta nunca contem o campo `password`
- campos de auditoria preenchidos com `criadoPor = system` e `modificadoPor = system` (por ser criacao publica sem autenticacao)

**Pre-requisitos**
- Task 2.1 concluida
- Task 2.2 concluida

**Dependencias**
- depende da Task 2.1
- depende da Task 2.2

**Responsavel sugerido**
- Dev Senior

## Grafo de dependencias entre as tasks

```
Task 2.1
  |
  +---> Task 2.2
  |       |
  +-------+--> Task 2.3
```

- Task 2.1 (entidade e repositorio) e a raiz.
- Task 2.2 (DTOs e mapper) depende parcialmente da entidade estabilizada.
- Task 2.3 (endpoint de criacao) depende de 2.1 e 2.2.

## Definicao de pronto (Sprint 2)

- entidade `Usuario` persistida com `UUID` nativo
- auditoria preenchida automaticamente, inclusive com fallback `system`
- DTOs validados por `spring-boot-starter-validation`
- `UsuarioMapper` configurado e testado manualmente
- `POST /api/v1/usuarios` funcional, criando `ADMIN` e `CLIENTE`
- senha nunca exposta em resposta
- senha persistida com hash BCrypt

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

- **Sprint 3** consome a entidade `Usuario`, os DTOs e o `UsuarioService` para implementar login, JWT, filtros de seguranca e autorizacao por perfil e ownership.
- **Sprint 4** formaliza o `ApiExceptionHandler` com payload padrao e a documentacao Swagger, consumindo os contratos definidos nesta sprint.

## Restricoes e regras de execucao

- commits podem ser feitos pelo agente de IA quando solicitado
- push e PR permanecem manuais
- ao final de cada task, a execucao deve parar para teste local manual
- testes automatizados desta sprint ficam concentrados na Sprint 4

## Referencias

- [PRD - API SEP](../docs-sep/PRD.md), Secoes 7, 9, 10, 15, 20 e 22
- [CONTEXT.md](../docs-sep/CONTEXT.md)
- [Spec 001](./001-sprint-1-fundacao-tecnica.md)
