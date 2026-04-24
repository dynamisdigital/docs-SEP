# PRD - API SEP

## 1. Resumo Executivo

### Produto
API SEP

### Objetivo desta fase
Construir a fundacao backend do produto SEP como uma API REST em `Java 21 + Spring Boot`, com autenticacao via `JWT`, auditoria JPA, configuracao regional do Brasil, documentacao OpenAPI e banco `PostgreSQL` em `Docker Compose` para o ambiente de desenvolvimento.

### Resultado esperado
Ao final desta fase, o projeto deve possuir uma base backend funcional para:
- cadastro e gestao de usuarios
- autenticacao e autorizacao
- auditoria automatica
- documentacao da API
- ambiente local padronizado para desenvolvimento

Esta fase prepara o terreno para as jornadas completas do produto SEP, mas ainda nao implementa o fluxo de credito, o portal das empresas credoras nem a infraestrutura remota.

## 2. Problema

O produto SEP precisa de uma base backend segura, auditavel e padronizada antes da implementacao das jornadas de negocio. Sem essa base:
- o frontend nao tem contratos estaveis para integracao
- nao existe controle confiavel de autenticacao e acesso
- nao ha trilha de auditoria para operacoes sensiveis
- o ambiente local fica inconsistente entre desenvolvedores
- o projeto corre risco de crescer sem padroes minimos de seguranca e governanca

## 3. Contexto do Produto

O sistema faz parte de uma plataforma SEP com quatro jornadas de negocio previstas:
- jornada da pessoa ou empresa tomadora de emprestimo
- jornada da empresa credora que empresta recursos
- jornada do financeiro interno
- jornada do administrador do sistema

A estrategia do projeto e construir essas capacidades por ondas. A primeira entrega sera exclusivamente a base da API, focada em usuarios, autenticacao, seguranca, auditoria e ambiente local.

Embora a primeira entrega seja tecnica, o direcionamento do produto foi refinado para priorizar o que fecha a jornada de contratacao do emprestimo. Isso significa que, depois da fundacao da API, as proximas ondas prioritarias do produto devem ser:
- onboarding KYC/KYB
- analise de credito
- formalizacao contratual
- cobranca e inadimplencia

Capacidades financeiras expandidas, como Pix, devem entrar apenas depois da estabilizacao desses blocos.

Para o frontend, ja existe uma base visual definida, localizada em:
`C:\Users\Mauricio\Documents\datta-able-free-angular-admin-template-master\datta-able-free-angular-admin-template-master`

Essa base devera ser usada como referencia oficial de layout e componentes na fase de implementacao do frontend.

## 4. Objetivos

### Objetivos de negocio
- reduzir risco tecnico antes da entrada das jornadas completas do produto
- criar uma base confiavel para integracao posterior com o frontend Angular
- garantir seguranca, rastreabilidade e padronizacao desde o inicio
- priorizar a construcao da jornada de contratacao do emprestimo antes das funcionalidades financeiras expandidas

### Objetivos de produto
- permitir cadastro publico de usuario na fase inicial
- permitir autenticacao por e-mail e senha com JWT
- permitir autorizacao por perfil e ownership
- expor recursos documentados para apoio ao frontend
- preparar a evolucao do produto para suportar onboarding, analise de credito, formalizacao e cobranca como nucleo da jornada SEP

### Objetivos tecnicos
- padronizar o ambiente `develop` com PostgreSQL em Docker Compose
- configurar locale e timezone do Brasil
- implementar auditoria automatica de criacao e alteracao
- criar tratamento consistente de erros
- garantir testes para autenticacao e autorizacao
- reaproveitar o template Angular existente como base visual do produto, evitando redesenho desnecessario
- definir padroes tecnicos obrigatorios para persistencia, seguranca, documentacao e observabilidade

## 5. Escopo

### Em escopo
- API REST em Spring Boot
- autenticacao com JWT
- cadastro publico de usuario
- consulta de usuario por id com controle de acesso
- listagem de usuarios apenas para administrador
- alteracao de senha apenas pelo proprio usuario autenticado
- auditoria automatica de criacao e modificacao
- configuracao de locale `pt-BR`
- configuracao de timezone `America/Sao_Paulo`
- documentacao dos recursos de usuarios e autenticacao
- testes do sistema de autenticacao e autorizacao
- PostgreSQL em Docker Compose para `develop`

### Em escopo do produto, mas fora da implementacao inicial
- onboarding KYC/KYB
- analise de credito
- formalizacao contratual
- cobranca e inadimplencia
- frontend SEP
- movimentacao Pix

### Fora de escopo
- portal completo da empresa credora nesta etapa inicial
- automacao financeira avancada nesta etapa inicial
- deploy remoto
- GitHub Actions
- VPS
- homologacao e producao
- pipelines CI/CD

Observacao:
Embora a implementacao do frontend esteja fora de escopo desta fase, o projeto ja possui uma base de design definida e aprovada, que deve orientar as proximas etapas.
Da mesma forma, onboarding, analise de credito, formalizacao contratual, cobranca e Pix fazem parte do roadmap do produto, mas nao da entrega tecnica inicial da API.

## 6. Usuarios e Perfis

Nesta fase inicial da API, os perfis detalhados sao apenas os necessarios para autenticacao, administracao e controle de acesso. No produto completo, as jornadas de tomador, credor e financeiro serao expandidas nas epics futuras ja previstas no roadmap.

### Visitante
Pode criar usuario sem autenticacao e nao pode acessar recursos protegidos.

### Cliente
Pode autenticar, consultar apenas o proprio usuario e alterar apenas a propria senha.

### Administrador
Pode autenticar, consultar qualquer usuario por id e listar todos os usuarios.

## 7. Requisitos Funcionais

### RF-01 Cadastro de usuario
- O sistema deve permitir criar usuario sem autenticacao.
- O usuario deve possuir e-mail unico, usado como username.
- O usuario deve possuir senha com exatamente `6 caracteres` nesta fase.
- O usuario deve possuir perfil `ROLE_ADMIN` ou `ROLE_CLIENTE`.

### RF-02 Consulta de usuario por id
- O sistema deve permitir localizar usuario pelo identificador gerado.
- O administrador autenticado deve poder recuperar qualquer usuario pelo id.
- O cliente autenticado deve poder recuperar apenas os proprios dados.

### RF-03 Listagem de usuarios
- O administrador autenticado deve poder listar todos os usuarios.

### RF-04 Alteracao de senha
- O usuario autenticado deve poder alterar apenas a propria senha.

### RF-05 Autenticacao
- O sistema deve implementar autenticacao via JWT.
- O login deve autenticar por e-mail e senha.
- O sistema deve expor recurso para obter os dados do usuario autenticado.

### RF-06 Auditoria
- O sistema deve registrar data de criacao e ultima modificacao dos registros.
- O sistema deve registrar usuario que criou e usuario que realizou a ultima modificacao.
- O sistema deve utilizar `CreatedDate`, `LastModifiedDate`, `CreatedBy` e `LastModifiedBy`.

### RF-07 Documentacao
- Todos os recursos criados nesta fase devem ser documentados.
- Os recursos de autenticacao tambem devem ser documentados.

## 8. Requisitos Nao Funcionais

### RNF-01 Configuracao regional
- A API deve operar com locale `pt-BR`.
- A API deve operar com timezone `America/Sao_Paulo`.

### RNF-02 Seguranca
- Recursos protegidos devem exigir JWT valido.
- A autorizacao deve respeitar perfil e ownership.
- As senhas devem ser armazenadas com hash `BCrypt`.
- O token JWT deve carregar pelo menos o identificador do usuario e seus papeis de acesso.
- Nesta fase inicial, o projeto nao usara refresh token.

### RNF-03 Qualidade tecnica
- A API deve usar DTOs.
- A API deve usar ModelMapper.
- A API deve possuir `ApiExceptionHandler`.
- A API deve seguir versionamento em `/api/v1`.
- A API deve usar `Flyway` para migrations versionadas desde o inicio.
- A documentacao OpenAPI deve ser exposta com `Springdoc OpenAPI`.
- A API deve expor endpoint de saude para uso futuro em deploy e monitoramento.
- A API deve usar `spring-boot-starter-validation` para validacao declarativa dos DTOs.

### RNF-04 Ambiente de desenvolvimento
- O ambiente `develop` deve usar PostgreSQL em Docker Compose.
- A conexao da aplicacao deve ser configurada por propriedades e variaveis de ambiente.
- O backend deve prever configuracao de `CORS` para futura integracao com o frontend Angular.

## 9. APIs Previstas

### Usuarios
- `POST /api/v1/usuarios`
  - cria usuario sem autenticacao
- `GET /api/v1/usuarios/{id}`
  - admin consulta qualquer usuario
  - cliente consulta apenas o proprio
- `GET /api/v1/usuarios`
  - apenas admin lista todos
- `PATCH /api/v1/usuarios/{id}/senha`
  - apenas o proprio usuario autenticado altera a senha

### Autenticacao
- `POST /api/v1/auth/login`
  - autentica e retorna JWT
- `GET /api/v1/auth/me`
  - retorna o usuario autenticado

## 10. Modelo Inicial de Dominio

### Entidade principal
`Usuario`

### Campos principais
- `id`
- `username`
- `password`
- `role`
- `dataCriacao`
- `dataModificacao`
- `criadoPor`
- `modificadoPor`

### DTOs minimos
- `UsuarioCreateDto`
- `UsuarioResponseDto`
- `UsuarioSenhaUpdateDto`
- `LoginRequestDto`
- `TokenResponseDto`
- `ErrorResponseDto`

### Estrategia de identificadores
- os identificadores das entidades devem usar `UUID`
- a geracao de UUID deve usar a dependencia Gradle:
  - `implementation 'com.fasterxml.uuid:java-uuid-generator:5.1.0'`
- o uso de UUID deve ser considerado desde a modelagem inicial da entidade `Usuario` e das demais entidades futuras do dominio
- a estrategia preferencial de geracao sera `UUID v6`, usando a biblioteca definida

## 11. Arquitetura e Tecnologia

### Stack principal
- Java 21
- Spring Boot
- Gradle
- Spring Security
- Spring Data JPA
- Flyway
- JWT
- ModelMapper
- PostgreSQL
- Docker Compose
- Springdoc OpenAPI / Swagger
- Spring Boot Actuator

### Base definida para o frontend futuro
- Angular com versao alinhada ao template adotado
- Bootstrap 5
- template visual de referencia: `C:\Users\Mauricio\Documents\datta-able-free-angular-admin-template-master\datta-able-free-angular-admin-template-master`
- template local identificado com:
  - dependencias Angular `20.0.x` no `package.json`
  - estrutura principal em `src/app/theme`, `src/app/demo` e `src/assets`
  - componentes de layout e compartilhados reaproveitaveis em `theme/layout` e `theme/shared`

### Diretriz de reaproveitamento do frontend
- o template existente sera a base visual inicial do sistema
- componentes de layout, navegacao, shell administrativo e assets devem ser reaproveitados sempre que fizer sentido
- paginas de demonstracao devem servir como referencia, nao como copia cega
- a implementacao do frontend deve adaptar o template ao dominio SEP, em vez de redesenhar a interface do zero
- a versao do Angular do frontend pode ser ajustada para coincidir com a versao suportada pelo template, incluindo downgrade se isso reduzir risco de integracao
- a decisao de versao final do frontend deve priorizar compatibilidade com o template e velocidade de adocao na fase inicial

### Convencoes obrigatorias
- uso de DTOs
- uso de ModelMapper
- criacao de `ApiExceptionHandler`
- auditoria com JPA Auditing
- gerenciamento de build e dependencias com Gradle
- armazenamento de senha com `BCryptPasswordEncoder`
- migrations versionadas com `Flyway`
- endpoint de healthcheck com Actuator

### Padroes tecnicos obrigatorios
- o identificador principal das entidades deve ser `UUID`
- o backend deve usar `BCrypt` para persistencia de senha
- a documentacao da API deve usar `Springdoc OpenAPI`
- a persistencia deve ser evoluida apenas por migrations `Flyway`
- a resposta de erro deve seguir formato padronizado
- o backend deve possuir configuracao explicita de `CORS`
- o backend deve possuir ao menos um endpoint de saude para monitoramento
- o padrao de auditoria deve priorizar o `UUID` do usuario autenticado, com fallback seguro
- a persistencia deve seguir convencoes consistentes de nomes de tabelas e colunas
- soft delete nao sera adotado nesta fase inicial

### Dependencias tecnicas ja definidas
- geracao de UUID:
  - `implementation 'com.fasterxml.uuid:java-uuid-generator:5.1.0'`

## 12. Ambiente e Evolucao de Infraestrutura

### Nesta fase
- apenas `develop` sera implementado localmente
- banco PostgreSQL em Docker Compose

### Planejamento futuro ja definido
- `develop`, `homologacao` e `producao`
- 1 instancia PostgreSQL por ambiente
- VPS compartilhada para `develop + homologacao`
- VPS isolada para `producao`
- migrations versionadas
- seeds por ambiente
- deploy por branch e ambiente

## 13. Padrao de Erros da API

O `ApiExceptionHandler` deve produzir um payload padronizado, contendo no minimo:
- `timestamp`
- `status`
- `error`
- `message`
- `path`

Campo opcional recomendado para evolucao futura:
- `traceId`

## 14. Padrao de JWT

### Estrategia inicial
- autenticacao baseada em `access token` JWT
- sem `refresh token` nesta fase
- expiracao curta e configuravel por propriedade

### Claims minimas obrigatorias
- `sub`: identificador do usuario autenticado
- `email`: e-mail do usuario
- `roles`: papeis de acesso

### Diretrizes de implementacao
- o `sub` deve carregar o `UUID` do usuario
- o backend deve validar expiracao, assinatura e integridade do token em todas as rotas protegidas
- as autorizacoes devem usar os papeis do token e, quando necessario, confirmacao de ownership no backend

## 15. Padrao de Auditoria

### Estrategia inicial
- auditoria automatica com JPA Auditing
- os campos de auditoria devem existir nas entidades persistidas relevantes

### Campos obrigatorios
- `dataCriacao`
- `dataModificacao`
- `criadoPor`
- `modificadoPor`

### Regra de preenchimento
- `criadoPor` e `modificadoPor` devem priorizar o `UUID` do usuario autenticado
- caso nao exista autenticacao no contexto, deve ser usado um fallback tecnico seguro, como `system`
- o e-mail do usuario pode ser exposto em logs ou DTOs quando necessario, mas o auditor principal persistido deve ser o identificador estavel do usuario

## 16. Convencoes de Persistencia

### Identificadores
- todas as entidades devem usar `UUID`
- a geracao inicial deve usar `UUID v6`
- no PostgreSQL, os identificadores devem usar o tipo nativo `uuid`
- no Java, os identificadores devem usar o tipo `java.util.UUID`

### Nomenclatura
- classes e propriedades Java devem seguir convencao em portugues, conforme o dominio e os exemplos ja aprovados
- tabelas e colunas do banco tambem devem permanecer em portugues, para manter consistencia com o modelo atual
- nomes devem ser explicitos e semanticamente alinhados ao dominio
- termos tecnicos padronizados de autenticacao e integracao podem permanecer em ingles na borda da API quando isso reduzir ambiguidade

### Exclusao logica
- `soft delete` nao sera utilizado nesta fase inicial
- exclusoes, se necessarias nesta etapa, serao tratadas como exclusoes fisicas ou evitadas por regra de negocio

## 17. Observabilidade Minima

Mesmo nesta fase inicial, a API deve nascer preparada para operacao futura com:
- `Spring Boot Actuator`
- endpoint de healthcheck
- logs suficientes para diagnostico de autenticacao, autorizacao e erros de aplicacao

## 18. Decisoes Tecnicas Consolidadas

- Build e dependencias com `Gradle`
- IDs com `UUID`
- geracao de UUID com `com.fasterxml.uuid:java-uuid-generator:5.1.0`
- preferencia por `UUID v6`
- UUID persistido como tipo nativo `uuid` no PostgreSQL
- UUID modelado como `java.util.UUID` no backend
- migrations com `Flyway`
- hash de senha com `BCrypt`
- documentacao com `Springdoc OpenAPI`
- validacao com `spring-boot-starter-validation`
- JWT como mecanismo de autenticacao
- sem refresh token nesta fase
- `sub` do JWT com `UUID` do usuario
- claims minimas: `sub`, `email`, `roles`
- auditoria persistindo preferencialmente o `UUID` do usuario
- `CORS` ja previsto para integracao com Angular
- `Actuator` para healthcheck
- tabelas e colunas em portugues
- sem soft delete nesta fase
- datas serializadas em ISO-8601 com offset
- logout tratado no cliente nesta fase

## 19. Estrutura Inicial de Pacotes

O backend deve nascer com separacao clara por responsabilidade, evitando concentrar tudo em poucos pacotes.

### Estrutura base sugerida
- `com.dynamis.broker_app`
- `com.dynamis.broker_app.config`
- `com.dynamis.broker_app.security`
- `com.dynamis.broker_app.exception`
- `com.dynamis.broker_app.model`
- `com.dynamis.broker_app.repository`
- `com.dynamis.broker_app.service`
- `com.dynamis.broker_app.web.controller`
- `com.dynamis.broker_app.web.dto`
- `com.dynamis.broker_app.web.dto.mapper`

### Subdivisoes recomendadas quando o dominio crescer
- `service.auth`
- `service.usuario`
- `repository.usuario`
- `web.controller.auth`
- `web.controller.usuario`

### Regras de organizacao
- controladores apenas recebem request e devolvem response
- regras de negocio ficam em `service`
- acesso ao banco fica em `repository`
- entidades JPA ficam em `model`
- DTOs nao devem ser reutilizados como entidades
- classes de seguranca nao devem conter regra de negocio de dominio

## 20. Contratos Iniciais de DTO

### UsuarioCreateDto
Finalidade:
criar usuario sem autenticacao.

Campos:
- `username: String`
  - obrigatorio
  - formato de e-mail valido
- `password: String`
  - obrigatorio
  - exatamente 6 caracteres
- `role: String`
  - obrigatorio
  - valores aceitos: `ADMIN`, `CLIENTE`

### UsuarioResponseDto
Finalidade:
retornar dados publicos do usuario sem expor senha.

Campos:
- `id: UUID`
- `username: String`
- `role: String`
- `dataCriacao: OffsetDateTime` ou tipo equivalente serializado
- `dataModificacao: OffsetDateTime` ou tipo equivalente serializado
- `criadoPor: String`
  - representa o UUID serializado do auditor, ou `system`
- `modificadoPor: String`
  - representa o UUID serializado do auditor, ou `system`

### UsuarioSenhaUpdateDto
Finalidade:
alterar a senha do proprio usuario autenticado.

Campos:
- `passwordAtual: String`
  - obrigatorio
- `novaSenha: String`
  - obrigatorio
  - exatamente 6 caracteres

### LoginRequestDto
Finalidade:
autenticar usuario.

Campos:
- `username: String`
  - obrigatorio
  - e-mail do usuario
- `password: String`
  - obrigatorio

### TokenResponseDto
Finalidade:
retornar o token gerado no login.

Campos:
- `accessToken: String`
- `tokenType: String`
  - valor esperado: `Bearer`
- `expiresIn: Long`
- `usuario: UsuarioResponseDto`

### ErrorResponseDto
Finalidade:
padronizar erros da API.

Campos:
- `timestamp: String`
- `status: Integer`
- `error: String`
- `message: String`
- `path: String`
- `traceId: String`
  - opcional

## 21. Contratos Iniciais dos Endpoints

### Convencoes gerais dos contratos
- datas da API devem ser serializadas em formato ISO-8601 com offset, por exemplo `2026-04-24T18:30:00-03:00`
- a nomenclatura da API pode manter termos tecnicos consolidados como `username`, `role`, `accessToken` e `tokenType`
- a nomenclatura do dominio Java e do banco deve permanecer em portugues
- listas simples podem ser retornadas como array nesta fase, mas o plano deve considerar evolucao futura para paginacao sem quebra abrupta de contrato

### POST `/api/v1/usuarios`
Finalidade:
criar usuario sem autenticacao.

Request:
```json
{
  "username": "admin@empresa.com",
  "password": "123456",
  "role": "ADMIN"
}
```

Response `201 Created`:
```json
{
  "id": "1f0799c0-98b9-6d9d-bc4a-7d6f5b771001",
  "username": "admin@empresa.com",
  "role": "ADMIN",
  "dataCriacao": "2026-04-24T18:30:00-03:00",
  "dataModificacao": "2026-04-24T18:30:00-03:00",
  "criadoPor": "system",
  "modificadoPor": "system"
}
```

### GET `/api/v1/usuarios/{id}`
Finalidade:
retornar usuario por id, respeitando perfil e ownership.

Response `200 OK`:
```json
{
  "id": "1f0799c0-98b9-6d9d-bc4a-7d6f5b771001",
  "username": "cliente@empresa.com",
  "role": "CLIENTE",
  "dataCriacao": "2026-04-24T18:30:00-03:00",
  "dataModificacao": "2026-04-24T18:45:00-03:00",
  "criadoPor": "system",
  "modificadoPor": "1f0799c0-98b9-6d9d-bc4a-7d6f5b771099"
}
```

### GET `/api/v1/usuarios`
Finalidade:
listar usuarios, apenas para admin.

Response `200 OK`:
```json
[
  {
    "id": "1f0799c0-98b9-6d9d-bc4a-7d6f5b771001",
    "username": "admin@empresa.com",
    "role": "ADMIN",
    "dataCriacao": "2026-04-24T18:30:00-03:00",
    "dataModificacao": "2026-04-24T18:30:00-03:00",
    "criadoPor": "system",
    "modificadoPor": "system"
  }
]
```

### PATCH `/api/v1/usuarios/{id}/senha`
Finalidade:
alterar a senha do proprio usuario autenticado.

Request:
```json
{
  "passwordAtual": "123456",
  "novaSenha": "654321"
}
```

Response `204 No Content`

### POST `/api/v1/auth/login`
Finalidade:
autenticar usuario e retornar JWT.

Request:
```json
{
  "username": "admin@empresa.com",
  "password": "123456"
}
```

Response `200 OK`:
```json
{
  "accessToken": "jwt-token-aqui",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "usuario": {
    "id": "1f0799c0-98b9-6d9d-bc4a-7d6f5b771001",
    "username": "admin@empresa.com",
    "role": "ADMIN",
    "dataCriacao": "2026-04-24T18:30:00-03:00",
    "dataModificacao": "2026-04-24T18:30:00-03:00",
    "criadoPor": "system",
    "modificadoPor": "system"
  }
}
```

### GET `/api/v1/auth/me`
Finalidade:
retornar o usuario autenticado.

Response `200 OK`:
```json
{
  "id": "1f0799c0-98b9-6d9d-bc4a-7d6f5b771001",
  "username": "admin@empresa.com",
  "role": "ADMIN",
  "dataCriacao": "2026-04-24T18:30:00-03:00",
  "dataModificacao": "2026-04-24T18:30:00-03:00",
  "criadoPor": "system",
  "modificadoPor": "system"
}
```

### Resposta padrao de erro
Exemplo:
```json
{
  "timestamp": "2026-04-24T18:35:00-03:00",
  "status": 400,
  "error": "Bad Request",
  "message": "password deve conter exatamente 6 caracteres",
  "path": "/api/v1/usuarios"
}
```

### Estrategia de logout nesta fase
- nao havera endpoint especifico de invalidacao de token
- o logout sera tratado inicialmente no cliente, descartando o `accessToken`
- blacklist de token ou refresh token ficam fora de escopo desta fase

## 22. Backlog Tecnico Implementavel

### Composicao da equipe
- 1 dev senior com atuacao em backend e frontend
- 2 devs plenos com foco em frontend

### Distribuicao inicial sugerida
- Dev Senior:
  - ownership do backend
  - definicao de contratos da API
  - seguranca, persistencia, auditoria, migrations e documentacao tecnica
  - suporte de integracao para o frontend
- Dev Pleno Frontend 1:
  - estudo e futura adaptacao do template Angular
  - shell, layout, navegacao, componentes compartilhados
  - revisao dos contratos expostos no Swagger
- Dev Pleno Frontend 2:
  - futura integracao HTTP com a API
  - preparacao das telas funcionais
  - validacao de usabilidade dos contratos de auth e usuario

### Entregaveis paralelos sugeridos para os devs frontend nesta fase
- Dev Pleno Frontend 1:
  - mapear componentes reaproveitaveis do template
  - identificar shell, menu lateral, header, breadcrumbs e layout base
  - preparar documento tecnico curto de reaproveitamento do frontend
- Dev Pleno Frontend 2:
  - revisar contratos da API e exemplos de payload
  - preparar mocks de consumo para login, `/auth/me` e usuarios
  - revisar usabilidade tecnica dos endpoints junto ao Dev Senior

### Dependencias entre sprints
- Sprint 1:
  - depende da aprovacao do PRD
  - depende de ambiente local com Java 21 e Docker
- Sprint 2:
  - depende da conclusao da Sprint 1
  - depende do banco local, Flyway e auditoria base estarem funcionando
- Sprint 3:
  - depende da conclusao da Sprint 2
  - depende da entidade `Usuario`, DTOs e criacao publica de usuario estarem funcionais
- Sprint 4:
  - depende da conclusao da Sprint 3
  - depende dos endpoints principais e das regras de seguranca estarem estabilizados

### Sprint 1

Objetivo de planejamento:
- entregar a fundacao tecnica do backend SEP (projeto Gradle, PostgreSQL local, configuracao regional, CORS, Actuator e Flyway com migration inicial)

Tema:
- Fundacao Tecnica

Pre-requisitos de entrada:
- PRD aprovado
- ambiente local com Java 21 e Docker funcionais

Dependencias externas:
- nenhuma task anterior no projeto

Responsavel principal:
- Dev Senior

Detalhamento das tasks:
- o detalhamento de tasks, arquivos esperados, verificacao, dependencias internas e criterios de pronto foi extraido do PRD e passa a ser tratado como artefato de especificacao proprio
- consultar: [`specs/001-sprint-1-fundacao-tecnica.md`](../specs/001-sprint-1-fundacao-tecnica.md)
- o PRD mantem apenas o planejamento de alto nivel desta sprint; a execucao e governada pelo spec correspondente

### Sprint 2

Objetivo de planejamento:
- entregar a base de dominio da API: entidade `Usuario` com UUID v6 e auditoria, DTOs e mapper obrigatorios, criacao publica de usuario com validacao e hash de senha via BCrypt

Tema:
- Gestao de Usuarios

Pre-requisitos de entrada:
- Sprint 1 concluida
- banco local, Flyway e auditoria base funcionais

Dependencias externas:
- depende da conclusao da Sprint 1

Responsavel principal:
- Dev Senior (com revisao opcional dos devs frontend para aderencia dos contratos)

Detalhamento das tasks:
- consultar: [`specs/002-sprint-2-gestao-usuarios.md`](../specs/002-sprint-2-gestao-usuarios.md)
- o PRD mantem apenas o planejamento de alto nivel desta sprint; a execucao e governada pelo spec correspondente

### Sprint 3

Objetivo de planejamento:
- entregar o mecanismo completo de autenticacao e autorizacao: login com emissao de JWT, filtro de validacao, recurso `/auth/me`, autorizacao por perfil e ownership nos endpoints de usuario, e alteracao da propria senha pelo usuario autenticado

Tema:
- Seguranca e Autenticacao JWT

Pre-requisitos de entrada:
- Sprint 2 concluida
- entidade `Usuario`, DTOs e criacao publica funcionais

Dependencias externas:
- depende da conclusao da Sprint 2

Responsavel principal:
- Dev Senior

Detalhamento das tasks:
- consultar: [`specs/003-sprint-3-seguranca-autenticacao.md`](../specs/003-sprint-3-seguranca-autenticacao.md)
- o PRD mantem apenas o planejamento de alto nivel desta sprint; a execucao e governada pelo spec correspondente

### Sprint 4

Objetivo de planejamento:
- consolidar a qualidade da API fechando tres frentes: tratamento centralizado de erros com payload padronizado, documentacao OpenAPI com Swagger UI, e cobertura minima de testes automatizados para os cenarios criticos de autenticacao e autorizacao

Tema:
- Tratamento de Erros, Documentacao e Testes

Pre-requisitos de entrada:
- Sprint 3 concluida
- endpoints principais e regras de seguranca estabilizados

Dependencias externas:
- depende da conclusao da Sprint 3

Responsavel principal:
- Dev Senior (com revisao funcional dos devs frontend na parte de documentacao)

Detalhamento das tasks:
- consultar: [`specs/004-sprint-4-erros-docs-testes.md`](../specs/004-sprint-4-erros-docs-testes.md)
- o PRD mantem apenas o planejamento de alto nivel desta sprint; a execucao e governada pelo spec correspondente

## 23. Criterios de Sucesso

Esta fase sera considerada bem-sucedida quando:
- usuarios puderem ser criados com validacao correta
- autenticacao com JWT estiver funcionando
- autorizacao por perfil e ownership estiver aplicada
- auditoria preencher criacao e modificacao corretamente
- a API estiver documentada para usuarios e autenticacao
- o ambiente local puder ser iniciado com PostgreSQL em Docker Compose
- os testes de autenticacao e autorizacao estiverem implementados e passando
- as migrations forem aplicadas com `Flyway`
- as senhas estiverem persistidas com `BCrypt`
- houver endpoint de healthcheck funcional
- o JWT estiver respeitando o padrao de claims definido
- a auditoria persistir corretamente o identificador do usuario ou fallback tecnico

## 24. Cenarios de Teste Obrigatorios

- criar usuario com e-mail valido
- rejeitar e-mail invalido
- rejeitar e-mail duplicado
- rejeitar senha com tamanho diferente de 6
- autenticar com credenciais validas
- falhar autenticacao com senha invalida
- admin consultar qualquer usuario
- cliente consultar apenas o proprio usuario
- cliente nao listar usuarios
- admin listar usuarios
- usuario alterar a propria senha
- usuario nao alterar senha de terceiro
- auditoria preencher criacao e modificacao
- documentacao expor rotas de auth e usuarios
- migrations subirem corretamente no boot da aplicacao
- healthcheck responder com sucesso
- respostas de erro seguirem payload padronizado
- token expirado ser rejeitado
- token invalido ser rejeitado
- claims `sub`, `email` e `roles` estarem presentes no JWT emitido
- auditoria usar o identificador do usuario autenticado
- auditoria usar fallback tecnico quando nao houver autenticacao

## 25. Roadmap Inicial

### Epic 1 - Fundacao da API
- configurar Docker Compose e banco dev
- configurar locale e timezone
- implementar auditoria JPA
- padronizar campos auditaveis
- configurar Flyway
- configurar Actuator
- configurar CORS basico
- definir convencoes de persistencia e identificadores UUID

### Epic 2 - Gestao de usuarios (escopo da Sprint 2)
- modelar entidade `Usuario` com `UUID v6`, repositorio e auditoria JPA
- configurar `AuditorAware` com fallback `system`
- criar DTOs de usuario (`UsuarioCreateDto`, `UsuarioResponseDto`, `UsuarioSenhaUpdateDto`) e `UsuarioMapper`
- implementar criacao publica de usuario em `POST /api/v1/usuarios`
- armazenar senha com hash `BCrypt` desde a criacao
- garantir que a senha nunca seja exposta em respostas da API

### Epic 3 - Seguranca, autenticacao e autorizacao (escopo da Sprint 3)
- configurar propriedades JWT (`app.jwt.secret`, `app.jwt.expiration-seconds`)
- implementar `JwtTokenProvider`, `JwtAuthenticationFilter` e `CustomUserDetailsService`
- criar `LoginRequestDto` e `TokenResponseDto`
- implementar login em `POST /api/v1/auth/login` e recurso autenticado `GET /api/v1/auth/me`
- aplicar claims minimas obrigatorias (`sub`, `email`, `roles`, `iat`, `exp`) com `sub = UUID do usuario`
- implementar consulta de usuario por id com autorizacao por perfil e ownership
- implementar listagem de usuarios restrita a `ROLE_ADMIN`
- implementar alteracao da propria senha pelo usuario autenticado
- consolidar `SecurityConfig` com CORS, filtro JWT e liberacao publica apenas do cadastro e do login
- persistir na auditoria o UUID do usuario autenticado em operacoes autenticadas

### Epic 4 - Tratamento de erros, documentacao e testes (escopo da Sprint 4)
- criar `ApiExceptionHandler` com `@RestControllerAdvice`
- padronizar payload de erro via `ErrorResponseDto` (`timestamp`, `status`, `error`, `message`, `path`, `traceId`)
- mapear validacao, conflito, autenticacao, autorizacao, excecoes de dominio e fallback generico
- configurar `Springdoc OpenAPI` com `SecurityScheme` HTTP Bearer para JWT
- expor Swagger UI no profile `dev`
- documentar todos os endpoints e schemas dos DTOs com exemplos coerentes com o PRD
- cobrir com testes automatizados os cenarios criticos de autenticacao, autorizacao, validacao e auditoria

### Epic 5 - Infraestrutura futura
- manter apenas como planejamento nesta fase

### Epic 6 - Onboarding KYC/KYB
- implementar onboarding documental de pessoa e empresa
- preparar coleta e validacao de documentos obrigatorios
- estruturar verificacoes de identidade e dados cadastrais
- preparar o sistema para integracoes futuras de OCR, biometria e background check
- registrar trilha operacional de aprovacao, rejeicao e pendencias cadastrais

### Epic 7 - Analise de credito
- implementar esteira inicial de analise de credito para o tomador
- modelar parecer operacional, score interno e decisao de aprovacao ou rejeicao
- permitir analise assistida pelo time interno
- registrar fundamentos da decisao e historico de alteracoes
- integrar a analise ao fluxo da proposta e da elegibilidade para contratacao

### Epic 8 - Formalizacao contratual
- preparar geracao de contrato e artefatos formais da operacao
- modelar etapa de aceite e assinatura
- registrar status de formalizacao da proposta
- bloquear desembolso sem formalizacao concluida
- preparar integracao futura com assinatura eletronica e CCB

### Epic 9 - Cobranca e inadimplencia
- estruturar cobranca basica das parcelas apos contratacao
- registrar agenda, status e historico de recebimentos
- permitir acompanhamento de atraso e inadimplencia
- preparar reprocessos operacionais e a futura integracao com meios de cobranca
- dar suporte ao financeiro na conciliacao pos-contratacao

### Epic 10 - Backoffice operacional
- estruturar fila operacional para propostas, pendencias e excecoes
- dar visibilidade consolidada para o financeiro interno acompanhar onboarding, analise, formalizacao e cobranca
- permitir tratamento manual de inconsistencias, reprocessos e bloqueios operacionais
- registrar comentarios, justificativas e trilha operacional das decisoes internas
- organizar a operacao assistida da SEP antes da automacao ampla

### Epic 11 - Jornada da empresa credora
- estruturar a jornada futura da empresa que aporta recursos na SEP
- preparar onboarding, elegibilidade e governanca da empresa credora
- modelar aportes, alocacoes e visao de carteira em fases futuras
- permitir acompanhamento das operacoes financiadas e seu status
- manter a entrada desta jornada posterior ao nucleo de contratacao do emprestimo

### Epic 12 - Administracao e governanca
- expandir a administracao de usuarios para governanca operacional mais ampla
- preparar RBAC evoluido, perfis internos e parametrizacoes futuras
- registrar auditoria administrativa e controles de acesso mais detalhados
- permitir cadastros mestres e configuracoes operacionais do produto
- sustentar seguranca e segregacao de responsabilidades conforme o produto crescer

### Epic futura - Frontend SEP
- reaproveitar o template Datta Able Angular como base visual
- importar layout, shell, navegacao e assets necessarios
- adaptar componentes existentes para as jornadas de tomador, credor, financeiro e administrador
- alinhar a versao do Angular do projeto com a versao mais adequada para absorver o template com menor retrabalho

### Epic futura - Movimentacao Pix
- tratar Pix como fase posterior a fundacao atual da API e a estabilizacao das jornadas que impactam a contratacao
- posicionar Pix depois de onboarding, analise de credito, formalizacao contratual e cobranca inicial
- iniciar pelo recorte de `desembolso + recebimento`, evitando comecar por automacao ampla
- operar inicialmente em modo assistido pelo financeiro interno
- usar `conta operacional/escrow` como base conceitual da movimentacao

#### Blocos funcionais futuros
- `Pix de desembolso`
  - enviar valor aprovado ao tomador apos validacoes operacionais e financeiras
- `Pix de recebimento`
  - registrar e conciliar pagamento de parcelas e obrigacoes via Pix
- `Conciliação e webhooks`
  - processar eventos assincronos de liquidacao, falha, devolucao e atualizacao de status

#### Dominios internos esperados
- `PixTransferencia`
- `PixRecebimento`
- `PixWebhookEvent`
- `PixConciliacao`

#### Estados operacionais esperados
- `PENDENTE`
- `EM_PROCESSAMENTO`
- `LIQUIDADO`
- `FALHOU`
- `DEVOLVIDO`
- `EM_ANALISE`

#### Interfaces futuras em alto nivel
- endpoint interno para iniciar desembolso Pix
- endpoint interno para consultar status de transacao Pix
- endpoint webhook para eventos da provedora
- endpoint interno para conciliacao e consulta operacional

#### Requisitos transversais obrigatorios
- idempotencia por transacao
- auditoria reforcada
- rastreabilidade ponta a ponta
- associacao da transacao Pix a proposta, desembolso ou cobranca correspondente
- tratamento explicito de falhas, divergencias e reprocessamento

#### Capacidades explicitamente posteriores
- `split Pix`
- gestao avancada de chaves
- `Pix automatico`
- automacao ampla com minima intervencao humana

### Ordem de prioridade funcional consolidada
1. Fundacao da API
2. Gestao de usuarios
3. Seguranca e autenticacao JWT
4. Tratamento de erros e documentacao
5. Onboarding KYC/KYB
6. Analise de credito
7. Formalizacao contratual
8. Cobranca e inadimplencia
9. Backoffice operacional
10. Jornada da empresa credora
11. Administracao e governanca
12. Frontend SEP
13. Movimentacao Pix
14. Infraestrutura futura

### Fronteiras entre epicos
- `Onboarding KYC/KYB`
  - capacidade transversal de validacao cadastral e documental
  - nao substitui a jornada especifica da empresa credora
- `Analise de credito`
  - responsavel pela decisao de risco, parecer e elegibilidade da proposta
  - nao substitui a fila e a operacao transversal do backoffice
- `Formalizacao contratual`
  - responsavel por contrato, aceite, assinatura e condicao de prontidao para desembolso
  - nao substitui a analise de credito nem a cobranca
- `Cobranca e inadimplencia`
  - responsavel pela regra de negocio de parcelas, atraso e recuperacao
  - nao substitui o meio de pagamento ou liquidacao
- `Backoffice operacional`
  - responsavel por fila, pendencias, excecoes, comentarios e reprocessos
  - nao substitui os modulos de dominio como onboarding, credito ou cobranca
- `Jornada da empresa credora`
  - responsavel pela experiencia e pelas regras do participante que aporta recursos
  - pode reutilizar capacidades de onboarding e governanca, mas nao deve duplicar esses modulos
- `Administracao e governanca`
  - responsavel por RBAC evoluido, parametros, cadastros mestres e controles administrativos
  - nao substitui a gestao operacional do backoffice
- `Frontend SEP`
  - camada de experiencia e interface
  - nao deve concentrar regra de negocio de dominio
- `Movimentacao Pix`
  - responsavel pelo meio de movimentacao e liquidacao financeira via Pix
  - nao substitui cobranca, analise de credito ou formalizacao

### Regra de priorizacao
- funcionalidades que impactam diretamente a jornada de contratacao do emprestimo devem ser implementadas antes das capacidades financeiras expandidas
- funcionalidades operacionais posteriores, como Pix e automacoes avancadas, so entram apos estabilizacao do fluxo de contratacao
- as quatro jornadas do PO devem estar explicitamente refletidas em epics do roadmap, mesmo quando forem implementadas em fases diferentes

## 26. Regras de Execucao

- a implementacao deve acontecer em tarefas pequenas
- ao final de cada task concluida, a execucao deve parar para testes locais manuais
- commits podem ser feitos pelo agente de IA
- push e PR serao manuais
- testes, build e deploy no GitHub Actions ficarao para fase separada

## 27. Premissas

- esta API sera a primeira entrega do projeto antes da integracao completa com Angular
- a politica de senha de 6 caracteres sera seguida exatamente como solicitado nesta fase
- o cadastro publico de usuarios e valido apenas para a etapa inicial
- este arquivo representa apenas o PRD inicial
- specs, plans e demais artefatos derivados ainda nao serao gerados
- o frontend consumira esta API a partir de um template Angular reaproveitado
