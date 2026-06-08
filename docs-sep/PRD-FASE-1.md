# PRD - Fase 1 - Fundacao tecnica

> Extraido de `PRD.md` para reduzir o tamanho do documento principal.

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

Para o frontend e o mobile, ja existem dois design systems definidos como base oficial, localizados em:
- [`DESIGN-apple.md`](./DESIGN-apple.md) - usado nas superficies publicas (sem autenticacao) do frontend: landing, login e cadastro
- [`DESIGN-notion.md`](./DESIGN-notion.md) - usado historicamente em todas as superficies autenticadas do frontend web e tambem como base historica do mobile nas M-Sprints 0-5

Atualizacao de Fase 3: o design system vigente para novas telas web/mobile passa a ser [`New Design System Sep.md`](<./New Design System Sep.md>) a partir do Epic 17 (`F-14` + `M-12`).

Esses dois design systems substituem qualquer referencia anterior a templates administrativos prontos. A decisao foi tomada porque um template pronto deixaria o projeto pouco flexivel a mudancas; os design systems definem tokens, tipografia, componentes e regras de uso, mantendo liberdade de implementacao e coerencia visual entre as superficies.

### 3.1 Marco regulatorio

O produto SEP opera sob a **Resolucao CMN nº 4.656/2018**, que disciplina as Sociedades de Emprestimo entre Pessoas no Brasil. Esse marco impoe ao produto, desde a primeira linha de codigo, requisitos nao-negociaveis:

- **KYC/KYB obrigatorio por lei** para qualquer parte que assuma posicao de tomadora ou credora — nao e capacidade opcional, e pre-condicao de cadastro
- **Segregacao patrimonial** dos recursos: fundos de investidores (credores) e tomadores devem ficar em **conta escrow** distinta da conta operacional da plataforma
- **Prevencao a Lavagem de Dinheiro (PLD)**: consultas obrigatorias a bases COAF, OFAC, INTERPOL e MTE durante onboarding
- **Auditoria reforcada** das operacoes financeiras e dos acessos administrativos
- **Conformidade BACEN** continua, com possibilidade de reportes periodicos

Esses requisitos justificam decisoes que parecem antecipadas no roadmap mas sao incontornaveis: a entidade `ContaEscrow` modelada desde a Sprint 1, o `Provider Pattern` para integracoes externas (especialmente Celcoin que oferece KYC/KYB e escrow como servico), e a politica de auditoria desde a fundacao.

A integracao com o ecossistema **Celcoin** (BaaS) e a estrategia escolhida para materializar essas obrigacoes regulatorias de forma economicamente viavel: Celcoin oferece KYC/KYB end-to-end (OCR, FaceMatch, Background Check), abertura de contas escrow (`POST /escrow/accounts`), conta operacional, Pix de desembolso e recebimento, conciliacao via webhooks, e Open Finance via Finansystech. Os documentos de aprendizado em `docs-sep/Aprendizado Celcoin e SEP/` consolidam o entendimento da plataforma.

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
- adotar design systems oficiais como base visual: Apple para superficies publicas web e Notion para superficies autenticadas web ate o Epic 17; apos o Epic 17, New Design System SEP para novas telas web/mobile
- usar SCSS puro como camada de estilizacao do frontend e do mobile, sem frameworks CSS prontos
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
- Amazon EC2
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
- A API deve usar `MapStruct` (substituiu ModelMapper — ver ADR 0006).
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

### Organizacao em 3 repositorios independentes (2026-05-04)

Os artefatos do produto vivem em 3 repositorios separados no GitHub:

- **`sep-api`** — backend Java + Spring Boot (package `com.dynamis.sep_api`)
- **`sep-app`** — frontend web Angular 20.x
- **`sep-mobile`** — mobile Ionic 8.4 + Angular 20.x + Capacitor 6

A documentacao consolidada (este PRD, ADRs, specs, steps, AGENT.md, templates de CI) vive no repositorio **`docs-SEP`** (4o repo). Cada repo gerencia independentemente seu CI, hooks de pre-commit e dependencias. Specs e steps usam os placeholders `<sep-api-root>`, `<sep-app-root>` e `<sep-mobile-root>` para representar a raiz de cada repo localmente clonado.

**Modelo de branches (FIXADO em 2026-05-06; checkpoint pre-commit obrigatorio adicionado em 2026-05-14)**: os tres repos de codigo (`sep-api`, `sep-app`, `sep-mobile`) operam com hierarquia `feature/* → develop → (homologacao futura) → main`. `feature/*` nasce de `develop` e PR vai sempre para `develop` via squash merge (1 commit por feature). `develop` integra em `main` via merge commit (preserva historico das features). `homologacao` sera inserida entre `develop` e `main` quando o ambiente AWS de homologacao entrar em jogo (apos Epic 16). `develop` e protegida contra delecao para sobreviver ao `delete_branch_on_merge=true`. **Regra de commits**: 1 branch por sprint = `feature/<nome-sprint>`, com numero de commits flexivel (agente decide pelo escopo logico — Task, Step, modulo, refactor); Conventional Commits obrigatorio; ao final de cada Task implementada, antes de staging/commit, o agente faz checkpoint para revisao humana (arquivos alterados, testes/build executados, riscos e sugestao de commit) e aguarda comando explicito do usuario para seguir com `git add` e `git commit`. O fluxo operacional, template de descricao de PR e demais regras estao consolidados em [`AGENT.md`](../AGENT.md). `docs-SEP` continua com operacao git 100% manual.

### Stack principal (versoes pinadas)

**Linguagem e build**
- Java `21` LTS (Standalone Components, Signals, Records, Sealed types, Pattern matching, Virtual threads habilitados)
- Gradle `8.x` com Wrapper

**Framework e persistencia**
- Spring Boot `3.5.x` (pinar minor explicitamente)
- Hibernate `6.x` (vem com Spring Boot 3.5)
- Spring Data JPA
- PostgreSQL `16`
- Flyway (migrations)

**Seguranca**
- Spring Security `6` (vem com Spring Boot 3.5)
- JJWT `0.12.x` (autenticacao JWT, sem refresh token nesta fase)
- BCrypt para hash de senha
- mTLS preparado para integracoes financeiras (Celcoin)

**Mapeamento e validacao**
- **MapStruct** (geracao de codigo, type-safe) — substitui ModelMapper
- Jakarta Bean Validation (`spring-boot-starter-validation`)

**HTTP client e resiliencia**
- **RestClient** (Spring 6, sincrono) para integracoes Celcoin REST
- WebClient reservado para streams reativos (uso futuro)
- **Resilience4j** para circuit breaker, retry, timeout em chamadas externas

**Documentacao e observabilidade**
- Springdoc OpenAPI (Swagger UI) `2.x`
- Spring Boot Actuator
- **Micrometer + Prometheus** (metricas) — preparacao para observabilidade remota
- Logs estruturados via Logback (com MDC para `correlationId` e `traceId`)

**Testes**
- JUnit 5 + AssertJ
- Test slices: `@WebMvcTest`, `@DataJpaTest`, `@JsonTest`
- **Testcontainers** com PostgreSQL real (sem H2)
- Mockito para isolamento de provider externo na camada `application`
- **WireMock 3.x** para testes de integracao dos adapters HTTP do Celcoin (testa o `Celcoin<X>Provider` sem precisar do Celcoin real); ver [ADR 0008](../adr/0008-wiremock-para-testes-integracao-celcoin.md)
- RestAssured (opcional para testes de contrato e smoke E2E)

**Containers**
- Docker Compose para desenvolvimento local (PostgreSQL)
- Dockerfile multi-stage para o app (preparado para AWS futura)

### Diretriz arquitetural do backend
- o backend sera um unico deploy Spring Boot nesta fase
- a arquitetura sera um `monolito modular orientado a DDD`, com `Hexagonal/Ports & Adapters` aplicado dentro de cada modulo
- nao serao criados microservicos na fase inicial
- o backend deve ser organizado por modulos de dominio, nao por camadas globais como `model`, `repository`, `service` e `controller`
- o banco sera unico nesta fase, com PostgreSQL e migrations Flyway em um unico backend
- frontend web e mobile devem consumir a mesma API publica, sem backends separados neste momento
- microservicos so devem ser reavaliados se houver necessidade real de escala independente, deploy independente, isolamento regulatorio, banco separado ou ownership por equipe

### Padrao de Provider Externo (obrigatorio para integracoes)

Toda integracao com sistema externo (Celcoin BaaS, futuras pasarelas de pagamento, servicos de KYC, gateways de assinatura digital) **deve** seguir este padrao para isolar a logica de dominio das dependencias de infraestrutura:

- **Interface (port)** declarada em `<modulo>.application.port.out.<X>Provider` — descreve a capacidade em termos de dominio (ex.: `KycProvider.validar(documento)`, `PixProvider.iniciarDesembolso(...)`)
- **Implementacao (adapter)** em `<modulo>.infrastructure.adapter.<X>.Celcoin<X>Provider` — traduz a chamada para a API externa (Celcoin), trata erros tecnicos, aplica idempotencia, retry e circuit breaker via Resilience4j
- **Stub/fake** em `<modulo>.infrastructure.adapter.<X>.Fake<X>Provider` para testes da camada `application` e ambiente local sem credenciais reais
- **Integration test do adapter HTTP** em `<modulo>.infrastructure.adapter.<X>.Celcoin<X>ProviderIT.java` usando **WireMock 3.x** (`@WireMockTest`) — testa o wiring HTTP real (URL, headers OAuth, `Idempotency-Key`, parsing de respostas, retry/circuit breaker) sem precisar do Celcoin real. Ver [ADR 0008](../adr/0008-wiremock-para-testes-integracao-celcoin.md).
- A escolha do adapter por ambiente acontece via `@ConditionalOnProperty` ou Profile do Spring (incluindo profile `local-wiremock` para dev sem credenciais Celcoin)

Beneficios:
- Trocar provedor (ex.: Celcoin → outro BaaS) afeta so a camada de adapter
- Testes de dominio nao dependem de rede ou credenciais
- Versionamento da API externa fica encapsulado no adapter
- Permite rodar local sem Celcoin (com `Fake<X>Provider`)

Modulos que nascem com Provider Pattern previsto:
- `onboarding` → `KycProvider`, `KybProvider`, `BackgroundCheckProvider`
- `credito` → `OpenFinanceProvider` (Celcoin Finansystech), `CreditoBureauProvider` (futuro)
- `contratos` → `AssinaturaDigitalProvider`, `CcbProvider`
- `escrow` → `EscrowProvider` (Celcoin escrow accounts)
- `pix` → `PixProvider` (desembolso, recebimento, webhooks)
- `cobranca` → `BoletoProvider` (futuro)

ADR de referencia: [`adr/0004-provider-pattern-para-integracoes-externas.md`](../adr/0004-provider-pattern-para-integracoes-externas.md).

### Modulo escrow (obrigatorio por marco regulatorio)

A Resolucao CMN 4.656/2018 obriga segregacao patrimonial entre fundos de tomadores, credores e a operacao da plataforma. O modulo `escrow` materializa essa obrigacao no dominio:

- Entidades centrais: `ContaEscrow`, `Wallet` (sub-conta por proposta/operacao), `MovimentacaoEscrow`
- Capacidade transversal usada por `credito`, `contratos`, `cobranca` e `pix`
- Implementacao concreta apoia-se na API Celcoin de escrow (`POST /escrow/accounts`, `POST /escrow/wallets`, `GET /escrow/accounts/balance`, `GET /escrow/accounts/statement`) via `EscrowProvider`
- A entidade `ContaEscrow` deve ser modelada na **Sprint 1** (mesmo sem integracao Celcoin ainda), evitando retrabalho arquitetural quando o provider for plugado

ADR de referencia: [`adr/0005-segregacao-patrimonial-via-conta-escrow.md`](../adr/0005-segregacao-patrimonial-via-conta-escrow.md).

### Base definida para o frontend futuro
- Angular na versao `20.x` (baseline atual: Standalone Components, Signals e Zoneless estaveis, com ecossistema alinhado), pareada com Ionic `8.4+` e Capacitor `6` para o mobile; na fase de implementacao mobile, avaliar upgrade para Angular `21` apenas se houver release oficial do Ionic com suporte explicito a `21` e os plugins Capacitor relevantes ja estiverem alinhados; caso contrario, manter `20`
- Standalone Components
- Signals
- SCSS puro como camada de estilizacao, sem frameworks CSS prontos (Bootstrap, Tailwind, Material e similares estao explicitamente fora)
- design systems oficiais do produto:
  - [`DESIGN-apple.md`](./DESIGN-apple.md) - base historica das superficies publicas web: landing, login e cadastro
  - [`DESIGN-notion.md`](./DESIGN-notion.md) - base historica do dashboard e das telas autenticadas web
  - [`New Design System Sep.md`](<./New Design System Sep.md>) - design vigente para novas telas web/mobile apos o Epic 17
- a fronteira historica Apple/Notion no web era o estado de autenticacao: tudo que e acessivel sem JWT seguia Apple; tudo a partir de `/auth/me` seguia Notion. Apos o Epic 17, novas superficies web usam o New Design System SEP
- tokens, tipografia, escala de espacamento, raios e componentes devem ser implementados em SCSS a partir das definicoes desses arquivos, sem depender de bibliotecas de UI prontas
- plano oficial de telas web:
  - [`WEB-SCREENS-PLAN.md`](./WEB-SCREENS-PLAN.md)
  - este artefato define ordem de implementacao visual, telas por perfil, matriz tela x endpoint e lacunas antes da implementacao completa do web

### Diretriz de adocao dos design systems
- o frontend nao deve adotar templates administrativos prontos; toda a base visual vem dos design systems oficiais
- superficies publicas (landing, login, cadastro) devem seguir [`DESIGN-apple.md`](./DESIGN-apple.md) literalmente: tokens de cor, tipografia, raios, espacamento, regras de uso e do/dont
- superficies autenticadas historicas (dashboard e demais telas com JWT) seguiram [`DESIGN-notion.md`](./DESIGN-notion.md); apos o Epic 17, novas superficies autenticadas seguem [`New Design System Sep.md`](<./New Design System Sep.md>)
- a transicao visual historica entre Apple e Notion acontecia exatamente no login; apos o Epic 17, o web passa a ter design system unificado
- componentes devem ser implementados como componentes Angular standalone proprios, em SCSS, com tokens extraidos dos design systems
- nao devem ser introduzidos frameworks CSS de terceiros (Bootstrap, Tailwind, Material, etc.) como camada de estilizacao
- bibliotecas externas que nao envolvem chrome visual (datepickers, mascaras, formularios reativos, utilidades) podem ser usadas, desde que estilizadas em SCSS para respeitar os tokens
- a versao do Angular esta definida em `20.x` como baseline; o upgrade para `21` pode ser avaliado na fase de implementacao mobile, condicionado a haver release oficial do Ionic e dos plugins Capacitor com suporte explicito a Angular `21`; nao ha previsao de downgrade abaixo de `20`

### Base definida para o mobile futuro
- o projeto mobile deve ser planejado como `Mobile SEP`
- stack recomendada: `Ionic v8 + Angular + Capacitor`
- a versao Angular do mobile acompanha a do frontend web (`20.x` baseline; opcionalmente `21` se a checagem de compatibilidade Ionic + plugins Capacitor passar na fase de implementacao)
- o mobile deve reutilizar contratos, DTOs, autenticacao JWT, guards e padroes de integracao HTTP definidos para o frontend web
- a base historica do mobile (M-Sprints 0-5) seguiu [`DESIGN-notion.md`](./DESIGN-notion.md), adaptado as restricoes de viewport e ergonomia mobile
- apos o Epic 17 / M-Sprint 12, novas telas mobile devem seguir [`New Design System Sep.md`](<./New Design System Sep.md>), traduzido para Ionic/Angular/SCSS
- a estilizacao deve ser feita em SCSS puro, sem frameworks CSS adicionais; quando componentes Ionic forem usados, devem ser customizados via CSS variables/SCSS para respeitar os tokens do design system mobile vigente
- Flutter e React Native nao sao recomendados nesta fase por adicionarem nova stack, curva de aprendizado e duplicacao tecnica para uma equipe ja orientada a Angular
- plano oficial de telas mobile:
  - [`MOBILE-SCREENS-PLAN.md`](./MOBILE-SCREENS-PLAN.md)
  - este artefato define ordem de implementacao visual mobile, telas por jornada, matriz tela x endpoint, escopo reduzido do app e lacunas antes da implementacao completa do mobile

### Convencoes obrigatorias
- uso de DTOs
- uso de MapStruct (substituiu ModelMapper — ver ADR 0006)
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
- cada modulo de dominio deve encapsular suas entidades, repositories, DTOs, mappers, casos de uso e controllers
- regras de negocio devem permanecer no backend e dentro do modulo dono da regra
- soft delete nao sera adotado nesta fase inicial

### Dependencias tecnicas ja definidas
- geracao de UUID:
  - `implementation 'com.fasterxml.uuid:java-uuid-generator:5.1.0'`

## 12. Ambiente e Evolucao de Infraestrutura

### Nesta fase
- apenas `dev-local` sera implementado localmente nesta etapa
- banco PostgreSQL em Docker Compose
- ate a conclusao completa do sistema de login, autenticacao e autorizacao, o banco oficial do projeto sera apenas PostgreSQL local via Docker Compose
- a implantacao AWS, incluindo EC2 e RDS, nao deve iniciar antes da conclusao da Sprint 3 / Epic 3
- recomendacao operacional: iniciar a fase AWS preferencialmente apos a Sprint 4, quando erros, documentacao e testes criticos tambem estiverem estabilizados

### Nomenclatura de ambientes
- `dev-local`: ambiente de desenvolvimento local, com PostgreSQL em Docker Compose
- `aws-develop`: futuro ambiente remoto de desenvolvimento na AWS, com EC2 e RDS proprios ou compartilhados conforme custo
- `homologacao`: futuro ambiente remoto de validacao funcional e tecnica, separado de `dev-local`
- `producao`: futuro ambiente remoto produtivo, isolado de desenvolvimento e homologacao

### Planejamento futuro ja definido
- a infraestrutura remota sera baseada em AWS
- a fase AWS depende, no minimo, da conclusao completa do login, autenticacao e autorizacao
- servidores da aplicacao devem usar `Amazon EC2`
- o banco remoto deve usar `Amazon RDS for PostgreSQL`
- o banco de dados nao deve ficar hospedado dentro da EC2/VPS da aplicacao
- `aws-develop`, `homologacao` e `producao` devem ter bancos separados
- cada ambiente deve ter sua propria instancia RDS PostgreSQL
- `aws-develop` e `homologacao` podem compartilhar uma EC2, separando containers, portas, variaveis e bancos
- `producao` deve usar EC2 separada
- `producao` deve usar RDS PostgreSQL separado, com backups automaticos, encryption at rest, acesso privado, logs e monitoramento
- a regiao AWS recomendada e `sa-east-1` (Sao Paulo)
- migrations versionadas
- seeds por ambiente
- deploy por branch e ambiente

### Decisao AWS recomendada
- `Amazon EC2` sera o equivalente AWS da VPS para hospedar os servidores da aplicacao
- `Amazon RDS for PostgreSQL` sera usado como banco gerenciado
- `Amazon Lightsail` fica registrado apenas como alternativa de baixo custo, nao como recomendacao principal deste projeto
- Docker ou Docker Compose podem continuar sendo usados nas EC2 nas primeiras fases remotas apenas para aplicacao, frontend, proxy e servicos auxiliares
- PostgreSQL remoto nao deve rodar em container na EC2; o banco remoto oficial sera RDS
- a escolha final de tamanho das instancias EC2 e RDS deve ser definida na fase de orcamento

### Gate e ordem da fase AWS
- a fase AWS e uma trilha tecnica habilitadora, nao uma funcionalidade de negocio da jornada de emprestimo
- gate minimo: somente pode iniciar apos Sprint 3 / Epic 3 concluida, com login, autenticacao e autorizacao funcionando
- gate recomendado: iniciar apos Sprint 4, com erros padronizados, documentacao OpenAPI e testes criticos estabilizados
- a execucao AWS pode ser antecipada antes de Pix e das capacidades financeiras expandidas se o time precisar de ambiente remoto para validacao, homologacao ou integracao
- CI/CD com GitHub Actions nao e pre-requisito obrigatorio para o primeiro ambiente AWS, mas deve ser planejado na mesma fase de infraestrutura
- enquanto CI/CD nao estiver pronto, qualquer deploy remoto inicial deve ser manual, documentado e restrito a ambiente nao produtivo

### Arquitetura remota por ambiente
- `aws-develop`
  - EC2 compartilhada com homologacao ou EC2 pequena dedicada, conforme custo
  - RDS PostgreSQL proprio
  - sem Multi-AZ inicialmente
- `homologacao`
  - EC2 compartilhada com aws-develop, com isolamento por containers, portas e variaveis
  - RDS PostgreSQL proprio
  - dados sinteticos ou anonimizados
- `producao`
  - EC2 propria
  - RDS PostgreSQL proprio
  - Security Groups restritivos
  - backups automaticos
  - encryption habilitada
  - acesso privado ao banco
  - avaliar Multi-AZ quando houver trafego real ou necessidade formal de alta disponibilidade

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

### Estrategia inicial (Sprints 1-4)
- autenticacao baseada em `access token` JWT
- sem `refresh token`
- expiracao 1h configuravel por propriedade

### Estrategia consolidada (Sprint 5 em diante)
- `access token` JWT com expiracao curta de 15 min (`app.jwt.access-expiration-seconds=900`)
- `refresh token` rotativo de 30 dias (`app.jwt.refresh-expiration-seconds=2592000`) com:
  - persistencia somente do hash SHA-256 hex em `refresh_token`
  - `familyId` mantido entre rotacoes
  - reuse detection: token marcado `USADO` reapresentado -> revoga toda a familia + grava `REFRESH_REUSE_DETECTED` em `audit_log_seguranca`
- MFA TOTP obrigatorio antes de producao (RFC 6238 via `googleauth:1.5.0`): senha valida com MFA ATIVO emite apenas `mfaChallengeId`; `/auth/totp/verify` conclui o login emitindo o par access+refresh
- step-up authentication para operacoes sensiveis: token efemero de 5 min apresentado em header `X-Step-Up-Token` (annotation `@RequireStepUp`)

### Claims minimas obrigatorias
- `sub`: identificador do usuario autenticado
- `email`: e-mail do usuario
- `roles`: papeis de acesso

### Diretrizes de implementacao
- o `sub` deve carregar o `UUID` do usuario
- o backend deve validar expiracao, assinatura e integridade do token em todas as rotas protegidas
- as autorizacoes devem usar os papeis do token e, quando necessario, confirmacao de ownership no backend
- detalhes operacionais (politica de senha, MFA, rate limit, lockout, audit log, step-up) consolidados em [`docs-sep/SEGURANCA.md`](./SEGURANCA.md)

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

### Backend - linguagem e framework
- Build e dependencias com `Gradle 8.x` + Wrapper
- Java `21` LTS, com Records para DTOs, Sealed types para Roles/eventos, Pattern matching e Virtual threads habilitados
- Spring Boot `3.5.x` (versao minor pinada explicitamente)
- Hibernate `6.x` (vem com Spring Boot 3.5)
- PostgreSQL `16` (sem H2 mesmo em testes)
- Flyway para migrations versionadas

### Backend - mapeamento, validacao e seguranca
- **MapStruct** (geracao de codigo, type-safe) — substitui ModelMapper em todo o projeto
- Jakarta Bean Validation (`spring-boot-starter-validation`)
- Spring Security `6` + JJWT `0.12.x`
- BCrypt para hash de senha (politica de 6 caracteres revisada antes de producao)
- mTLS preparado para integracoes financeiras (Celcoin)

### Backend - identificadores e dominio
- IDs com `UUID`, geracao via `com.fasterxml.uuid:java-uuid-generator:5.1.0`
- preferencia por `UUID v6`
- UUID persistido como tipo nativo `uuid` no PostgreSQL
- UUID modelado como `java.util.UUID` no backend
- tabelas e colunas em portugues
- sem soft delete nesta fase
- datas serializadas em ISO-8601 com offset
- arquitetura: monolito modular DDD com `Hexagonal/Ports & Adapters` por modulo
- modulo `escrow` obrigatorio desde Sprint 1 (Resolucao CMN 4.656/2018)

### Backend - integracoes externas
- **Provider Pattern** obrigatorio: porta de saida em `application.port.out`, adapter em `infrastructure.adapter`
- **RestClient** (Spring 6, sincrono) como HTTP client default; `WebClient` reservado para streams
- **Resilience4j** para circuit breaker, retry e timeout em chamadas externas
- idempotencia por `Idempotency-Key` em operacoes financeiras
- `correlationId`/`traceId` propagados via MDC

### Backend - JWT e auditoria
- JWT como mecanismo de autenticacao
- sem refresh token nesta fase
- `sub` do JWT com `UUID` do usuario
- claims minimas: `sub`, `email`, `roles`
- auditoria persistindo preferencialmente o `UUID` do usuario
- logout tratado no cliente nesta fase

### Backend - documentacao e observabilidade
- documentacao com `Springdoc OpenAPI 2.x`
- `CORS` ja previsto para integracao com Angular
- `Actuator` para healthcheck
- **Micrometer + Prometheus** para metricas
- logs estruturados via Logback com MDC

### Backend - testes
- JUnit 5 + AssertJ
- Test slices: `@WebMvcTest`, `@DataJpaTest`, `@JsonTest`
- **Testcontainers** com PostgreSQL real (sem H2)
- Mockito para unit tests da camada `application` (com `Fake<X>Provider` injetado)
- **WireMock 3.x** para integration tests dos adapters HTTP de Celcoin (`Celcoin<X>ProviderIT`) — ver ADR 0008
- TDD desde Sprint 1: cada Sprint entrega testes correspondentes ao escopo
- JaCoCo target 70% por modulo (validado em CI)

### Backend - qualidade e tooling (Sprint 0)
- Spotless + Palantir Java Format
- JaCoCo + verification rule
- Pre-commit hook bloqueando codigo desformatado
- GitHub Actions CI: build + test + Spotless + JaCoCo
- Conventional Commits

### Frontend e mobile
- SCSS puro como camada de estilizacao do frontend e do mobile
- design systems oficiais: [`DESIGN-apple.md`](./DESIGN-apple.md) para superficies publicas web historicas; [`DESIGN-notion.md`](./DESIGN-notion.md) para superficies autenticadas web historicas; [`New Design System Sep.md`](<./New Design System Sep.md>) para novas telas web/mobile apos o Epic 17
- sem framework CSS de terceiros (Bootstrap, Tailwind, Material e similares estao explicitamente fora) nem template administrativo pronto
- stack frontend: `Angular 20.x` + SCSS puro + Standalone Components + Signals
- stack mobile baseline: `Angular 20.x + Ionic 8.4+ + Capacitor 6`, com avaliacao opcional de upgrade para `Angular 21` na fase de implementacao mobile, condicionada a haver release oficial do Ionic e dos plugins Capacitor com suporte explicito
- sem clausula de downgrade do Angular abaixo de `20`
- frontend tooling: ESLint + Prettier + Stylelint, Vitest (unit), Playwright (E2E), Husky + lint-staged

### Decisoes registradas em ADR
ADRs vivem em [`adr/`](../adr/) e devem ser atualizados quando uma decisao tecnica mudar. ADRs iniciais:
- `0001-monolito-modular-orientado-a-ddd.md`
- `0002-design-systems-apple-e-notion-com-scss-puro.md`
- `0003-stack-angular-20-ionic-8-capacitor-6.md`
- `0004-provider-pattern-para-integracoes-externas.md`
- `0005-segregacao-patrimonial-via-conta-escrow.md`
- `0006-mapstruct-substitui-modelmapper.md`
- `0007-ddd-com-hexagonal-ports-and-adapters-por-modulo.md`
- `0008-wiremock-para-testes-integracao-celcoin.md`

## 19. Estrutura Inicial de Pacotes

O backend deve nascer como monolito modular orientado a DDD. A separacao principal deve ser por modulo de dominio, nao por camada global.

### Estrutura base recomendada
- `com.dynamis.sep_api`
- `com.dynamis.sep_api.identity`
- `com.dynamis.sep_api.usuarios`
- `com.dynamis.sep_api.onboarding`
- `com.dynamis.sep_api.credito`
- `com.dynamis.sep_api.contratos`
- `com.dynamis.sep_api.cobranca`
- `com.dynamis.sep_api.escrow`
- `com.dynamis.sep_api.backoffice`
- `com.dynamis.sep_api.financeiro`
- `com.dynamis.sep_api.credores`
- `com.dynamis.sep_api.pix`
- `com.dynamis.sep_api.shared`

### Responsabilidade dos modulos
- `identity`: autenticacao, JWT, senha, roles, permissoes e usuario autenticado
- `usuarios`: cadastro de usuario, perfil inicial, ownership e dados basicos
- `onboarding`: KYC/KYB, documentos e validacoes cadastrais (consome `KycProvider`/`KybProvider`)
- `credito`: proposta, analise de credito, parecer e decisao (pode consumir `OpenFinanceProvider`)
- `contratos`: formalizacao, aceite, assinatura e status contratual (consome `AssinaturaDigitalProvider`)
- `cobranca`: parcelas, vencimentos, cobranca e inadimplencia (consome `escrow` para registrar recebimentos)
- `escrow`: contas escrow, wallets por proposta/operacao, movimentacoes e segregacao patrimonial obrigatoria por Resolucao CMN 4.656/2018 (consome `EscrowProvider`)
- `backoffice`: filas, pendencias, excecoes, comentarios e reprocessos
- `financeiro`: conciliacao, controles internos e visao operacional financeira
- `credores`: jornada da empresa credora, carteira, aportes e operacoes financiadas (consome `escrow` para acompanhar carteira)
- `pix`: movimentacao Pix, webhooks, conciliacao e status (consome `PixProvider` e `escrow`)
- `shared`: excecoes, auditoria, configuracoes transversais, `ApiExceptionHandler`, `ErrorResponseDto`, base de adapters HTTP (RestClient + Resilience4j), Webhook Receiver pattern, utilitarios e tipos comuns realmente compartilhados

### Padrao interno de cada modulo (Hexagonal / Ports & Adapters)
- `domain`: entidades, value objects, enums, sealed types, eventos de dominio e regras centrais (puro, sem dependencia de framework)
- `application`: casos de uso, servicos de aplicacao, **portas de saida** (`port.out.<X>Provider`) que descrevem dependencias externas em termos de dominio
- `infrastructure`: repositories JPA, **adapters** que implementam as portas de saida (ex.: `Celcoin<X>Provider`, `Fake<X>Provider` para testes), integracoes externas e persistencia
- `web`: controllers REST, DTOs (preferencialmente `record`), MapStruct mappers daquele modulo

Estrutura de pacotes detalhada por modulo:
- `<modulo>.domain.{model,event,exception,vo}`
- `<modulo>.application.{usecase,port.out,service}`
- `<modulo>.infrastructure.{persistence,adapter.<provider>,config}`
- `<modulo>.web.{controller,dto,mapper}`

Exemplo conceitual:
- `com.dynamis.sep_api.identity.domain`
- `com.dynamis.sep_api.identity.application`
- `com.dynamis.sep_api.identity.infrastructure`
- `com.dynamis.sep_api.identity.web`

### Regras de organizacao
- controladores apenas recebem request e devolvem response
- controllers nao acessam repositories diretamente
- um modulo nao deve acessar repository interno de outro modulo
- comunicacao entre modulos deve ocorrer por servicos publicos internos, interfaces de aplicacao ou eventos de dominio
- DTOs de API ficam na borda `web` do modulo correspondente
- entidades JPA devem permanecer encapsuladas no modulo dono do dominio
- classes de seguranca nao devem conter regra de negocio de dominio
- seguranca e JWT ficam em `identity`, mas autorizacao por regra de negocio continua no modulo dono da regra
- `shared` deve permanecer pequeno e nao deve virar deposito generico de dominio

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
- 2 devs plenos com foco em frontend (web)
- 1 dev mobile dedicado (Ionic + Angular + Capacitor)

### Distribuicao inicial sugerida
- Dev Senior:
  - ownership do backend
  - definicao de contratos da API
  - seguranca, persistencia, auditoria, migrations e documentacao tecnica
  - suporte de integracao para o frontend e mobile
  - revisao de PRs cruzados (backend, frontend, mobile) onde houver impacto em contrato
- Dev Pleno Frontend 1:
  - estudo dos dois design systems oficiais (`DESIGN-apple.md` e `DESIGN-notion.md`) e definicao da camada de tokens SCSS
  - shell autenticado, layout, navegacao e componentes compartilhados implementados em Angular standalone + SCSS, seguindo Notion
  - revisao dos contratos expostos no Swagger
- Dev Pleno Frontend 2:
  - futura integracao HTTP com a API
  - preparacao das telas funcionais
  - validacao de usabilidade dos contratos de auth e usuario
- Dev Mobile:
  - ownership do projeto Mobile SEP (Ionic 8.4+ + Angular 20.x + Capacitor 6)
  - adaptacao do design system Notion para mobile (touch targets, tabs inferiores, navegacao em pilha)
  - implementacao das M-Sprints 0-4 (trilha mobile foundation paralela a backend e frontend web)
  - reuso de contratos da API publicados pelo backend (sem reinventar DTOs)
  - validacao em PWA primeiro; build Android/iOS via Capacitor entra em fase posterior

### Entregaveis paralelos sugeridos para os devs frontend nesta fase
- Dev Pleno Frontend 1:
  - traduzir os tokens (cores, tipografia, espacamento, raios, sombras) dos dois design systems para variaveis SCSS reutilizaveis
  - desenhar shell, menu lateral, header, breadcrumbs e layout base do dashboard a partir do Notion design system
  - preparar documento tecnico curto descrevendo a fronteira Apple/Notion e a estrutura de tokens SCSS adotada
- Dev Pleno Frontend 2:
  - revisar contratos da API e exemplos de payload
  - preparar mocks de consumo para login, `/auth/me` e usuarios
  - revisar usabilidade tecnica dos endpoints junto ao Dev Senior

### Dependencias entre sprints
- Sprint 0 (Hygiene & Foundation):
  - depende da aprovacao do PRD e do AGENT.md criado
  - estabelece tooling (Spotless, JaCoCo, pre-commit, CI minimo, ADRs iniciais, conventional commits)
  - pode rodar em paralelo aos primeiros dias da Sprint 1, com a condicao de Spotless e CI estarem prontos antes do primeiro PR de codigo
  - spec: [`specs/fase-1/000-sprint-0-hygiene-foundation.md`](../specs/fase-1/000-sprint-0-hygiene-foundation.md)
- Sprint 1:
  - depende da aprovacao do PRD
  - depende de ambiente local com Java 21 e Docker
  - depende de Sprint 0 ter Spotless e CI prontos antes do primeiro PR
  - deve criar a base do monolito modular e os pacotes raiz dos modulos DDD
  - deve incluir `ApiExceptionHandler` stub, `ErrorResponseDto`, auditoria JPA base, estrutura de adapter para integracoes externas em `shared.integration`, modulo `escrow` modelado, e teste de boot
- Sprint 2:
  - depende da conclusao da Sprint 1
  - depende do banco local, Flyway e auditoria base estarem funcionando
  - deve implementar `identity` e `usuarios` como primeiros modulos reais do monolito modular usando Records para DTOs e MapStruct para mappers
  - testes da Sprint 2: criacao, validacao, conflito de e-mail, hash BCrypt
- Sprint 3:
  - depende da conclusao da Sprint 2
  - depende da entidade `Usuario`, DTOs e criacao publica de usuario estarem funcionais
  - deve consolidar autenticacao e autorizacao dentro de `identity`, sem transformar auth em microservico
  - introduz `correlationId`/`traceId` via MDC e prepara mTLS para integracoes futuras
  - testes da Sprint 3: login valido/invalido, JWT emissao/parse, autorizacao por perfil, ownership
- Sprint 4:
  - depende da conclusao da Sprint 3
  - depende dos endpoints principais e das regras de seguranca estarem estabilizados
  - **evolui** o `ApiExceptionHandler` ja criado na Sprint 1 (mapeamento completo de excecoes)
  - completa documentacao OpenAPI, smoke tests E2E e cobertura JaCoCo no target 70%
  - introduz `Webhook Receiver Pattern` (`/api/v1/webhooks/{provider}/{event}`) com idempotencia e Outbox stub, preparando Epic 15 (Pix)

### Trilha paralela Frontend (Specs 1XX)

Os 2 Devs Plenos Frontend tem trabalho concreto desde a Sprint 0, em paralelo ao backend. Sem isso, ficam ociosos durante as Sprints 1-4 que sao predominantemente backend.

Cada F-Sprint tem seu proprio spec (1 arquivo por F-Sprint, paralelo ao padrao do backend `000-004`):
- F-Sprint 0: [`specs/fase-1/100-fsprint-0-setup-angular.md`](../specs/fase-1/100-fsprint-0-setup-angular.md) — setup Angular 20.x (project scaffold, ESLint + Prettier + Stylelint, Husky + lint-staged, Vitest, Playwright, MSW, Frontend CI)
- F-Sprint 1: [`specs/fase-1/101-fsprint-1-design-tokens-showcase.md`](../specs/fase-1/101-fsprint-1-design-tokens-showcase.md) — traducao dos tokens Apple+Notion para SCSS, design system showcase em rota `/design-system`
- F-Sprint 2: [`specs/fase-1/102-fsprint-2-telas-apple-publicas.md`](../specs/fase-1/102-fsprint-2-telas-apple-publicas.md) — telas Apple (landing, login, register) com MSW (Mock Service Worker) consumindo mocks JSON dos contratos da Sprint 2 backend
- F-Sprint 3: [`specs/fase-1/103-fsprint-3-shell-notion-auth.md`](../specs/fase-1/103-fsprint-3-shell-notion-auth.md) — integracao com auth real, shell Notion, guards funcionais, interceptors HTTP
- F-Sprint 4: [`specs/fase-1/104-fsprint-4-telas-autenticadas.md`](../specs/fase-1/104-fsprint-4-telas-autenticadas.md) — telas autenticadas (perfil, alterar senha, admin de usuarios, dashboard casca) + smoke E2E Playwright

Cada F-Sprint tem Definition of Done explicita no seu spec correspondente.

### Trilha paralela Mobile (Specs 2XX)

O Dev Mobile dedicado tem trabalho concreto desde a Sprint 0, em paralelo ao backend e ao frontend web. Cada M-Sprint tem seu proprio spec (1 arquivo por M-Sprint, paralelo aos padroes 0XX backend e 1XX frontend):

- M-Sprint 0: [`specs/fase-1/200-msprint-0-setup-ionic.md`](../specs/fase-1/200-msprint-0-setup-ionic.md) — setup Ionic 8.4+ + Angular 20.x + Capacitor 6 + tooling completo (lint, test, hooks, MSW, Mobile CI)
- M-Sprint 1: [`specs/fase-1/201-msprint-1-tokens-notion-mobile.md`](../specs/fase-1/201-msprint-1-tokens-notion-mobile.md) — adaptacao dos tokens Notion para mobile (touch, tabs inferiores), customizacao de componentes Ionic, design system showcase
- M-Sprint 2: [`specs/fase-1/202-msprint-2-telas-publicas-mobile.md`](../specs/fase-1/202-msprint-2-telas-publicas-mobile.md) — splash, boas-vindas, login, register com MSW; token storage via Capacitor Preferences (**concluida em 2026-05-07**)
- M-Sprint 3: [`specs/fase-1/203-msprint-3-shell-mobile-auth.md`](../specs/fase-1/203-msprint-3-shell-mobile-auth.md) — auth real, shell mobile (tabs inferiores), guards funcionais, interceptors HTTP (**concluida em 2026-05-08**)
- M-Sprint 4: [`specs/fase-1/204-msprint-4-telas-autenticadas-mobile.md`](../specs/fase-1/204-msprint-4-telas-autenticadas-mobile.md) — perfil, alterar senha, casca tomador, casca empresa credora + smoke E2E PWA (**concluida em 2026-05-08**)

Cada M-Sprint tem Definition of Done explicita no seu spec correspondente.

**Diferencas vs trilha frontend web (1XX):**
- Mobile **so usa Notion** (nao Apple) — fronteira diferente: ja na primeira tela publica (boas-vindas) seguimos Notion adaptado
- Storage de token via **Capacitor Preferences** (mais seguro que localStorage e funciona em PWA + Android/iOS)
- Validacao em **PWA primeiro** (browser); Android/iOS via Capacitor entra na Epic 14 Fase Mobile 2+
- Escopo reduzido: **apenas tomador e empresa credora**, sem financeiro interno, backoffice ou administracao completa
- Nao recria contratos: reusa DTOs e endpoints definidos pelo backend e validados pelo frontend web

### Organizacao das pastas de steps

Os steps (detalhamento granular por task, criados just-in-time antes de cada sprint) agora sao separados por fase:

```
steps-fase-1/
+-- backend/   # Sprints 0XX (specs/fase-1/000-004)
+-- web/       # F-Sprints 1XX (specs/fase-1/100-104)
+-- mobile/    # M-Sprints 2XX (specs/fase-1/200-204)

steps-fase-2/
+-- backend/   # Sprints backend 005-014 + hardening operacional 015
+-- web/       # Steps web futuros da Fase 2, quando planejados
+-- mobile/    # Steps mobile futuros da Fase 2, quando planejados
```

- `steps-fase-1/backend/` recebe `000-sprint-0-steps.md` ate `004-sprint-4-steps.md`
- `steps-fase-1/web/` recebe `100-fsprint-0-steps.md` ate `104-fsprint-4-steps.md`
- `steps-fase-1/mobile/` recebe `200-msprint-0-steps.md` ate `204-msprint-4-steps.md`
- `steps-fase-2/backend/` recebe os steps backend da Fase 2, com Sprint 5 ja detalhada em [`steps-fase-2/backend/005-sprint-5-steps.md`](../steps-fase-2/backend/005-sprint-5-steps.md)
- Os indices vivem em [`steps-fase-1/README.md`](../steps-fase-1/README.md) e [`steps-fase-2/README.md`](../steps-fase-2/README.md)

Esta separacao isola o trabalho dos tres papeis (Dev Senior backend, Devs Plenos Frontend, Dev Mobile) e mantem a fronteira de cada trilha visivel desde a estrutura de arquivos.

#### Estado das Sprint 0 das tres trilhas

As tres Sprint 0 ja tem steps detalhados, revisados e coesos entre si:

- [`steps-fase-1/backend/000-sprint-0-steps.md`](../steps-fase-1/backend/000-sprint-0-steps.md) — Hygiene & Foundation backend
- [`steps-fase-1/web/100-fsprint-0-steps.md`](../steps-fase-1/web/100-fsprint-0-steps.md) — Setup Angular 20.x + tooling
- [`steps-fase-1/mobile/200-msprint-0-steps.md`](../steps-fase-1/mobile/200-msprint-0-steps.md) — Setup Ionic 8.4+ + Capacitor 6 + tooling

Pontos de coesao entre as tres Sprint 0 (decisoes ja alinhadas no detalhamento):

- **Pre-commit por repo independente** (modelo de 3 repos, ver §11): `sep-api` usa `.githooks/pre-commit` minimo rodando `./gradlew spotlessCheck`; `sep-app` e `sep-mobile` usam Husky + lint-staged padrao via `npx husky init`. Sem agregador cross-repo.
- **Vitest com `@analogjs/vite-plugin-angular` + `@analogjs/vitest-angular`** nas duas trilhas Angular (web e mobile), pois Vitest puro nao compila templates Angular.
- **MSW alinhado ao PRD §21** em web e mobile (`POST /auth/login`, `GET /auth/me`), com payloads ISO-8601 e UUID v6 do exemplo do PRD; web cobre perfil `ADMIN` (escopo de gestao de usuarios), mobile cobre `CLIENTE` (escopo tomador/credora).
- **Localizacao dos projetos**: cada repo (`sep-api`, `sep-app`, `sep-mobile`) hospeda o respectivo projeto na propria raiz, sem subpastas `apps/`.
- **GitHub Actions por repo** sem `paths-filter` (cada repo so tem um app); workflows sao copiados de templates versionados em `docs-sep/ci-pipelines/templates/`. Node 20 + cache npm, Conventional Commits.

### Definition of Done (DoD) por tipo de task

- **Task de codigo backend**: codigo + testes unitarios + JavaDoc onde apropriado + Spotless verde + JaCoCo nao regride + PR com 1 review aprovado + CI verde
- **Task de codigo frontend**: codigo + testes Vitest + ESLint/Prettier verde + componente documentado em Storybook se for compartilhado + PR com 1 review aprovado + CI verde
- **Task de design (tokens, layout)**: SCSS extraido fielmente do design system + showcase atualizado + revisao do Dev Senior
- **Task de documentacao**: arquivo gerado/atualizado + cross-refs validadas + revisao do Dev Senior

### Sprint 0

Objetivo de planejamento:
- estabelecer o terreno tecnico minimo (tooling, repo settings, ADRs, CI minimo) para que as Sprints 1-4 e a trilha Frontend nao produzam divida tecnica desde o primeiro PR

Tema:
- Hygiene & Foundation

Pre-requisitos de entrada:
- PRD aprovado
- AGENT.md criado
- repositorio Git inicializado
- acesso a GitHub para configurar branch protection

Dependencias externas:
- nenhuma

Responsavel principal:
- Dev Senior (com apoio dos Devs Plenos Frontend para o tooling no repo `sep-app`)

Detalhamento das tasks:
- consultar: [`specs/fase-1/000-sprint-0-hygiene-foundation.md`](../specs/fase-1/000-sprint-0-hygiene-foundation.md)
- entregaveis principais: `.gitignore`, `.editorconfig`, `.gitattributes`, Spotless + Palantir Format, JaCoCo target 70%, pre-commit hooks, GitHub branch protection + PR template, GitHub Actions CI minimo, Conventional Commits, ADRs iniciais (5-7 ADRs migrados do PRD)

### Sprint 1

Objetivo de planejamento:
- entregar a fundacao tecnica do backend SEP como monolito modular DDD com Hexagonal/Ports & Adapters por modulo: projeto Gradle, modulos raiz incluindo `escrow`, PostgreSQL local, configuracao regional, CORS, Actuator, Flyway com migration inicial, **`ApiExceptionHandler` stub e `ErrorResponseDto`**, **auditoria JPA base (`EntidadeAuditavel` + `AuditorAware` com fallback `system`)**, **estrutura de adapter para integracoes externas em `shared.integration`**, e teste de boot

Tema:
- Fundacao Tecnica

Pre-requisitos de entrada:
- PRD aprovado
- ambiente local com Java 21 e Docker funcionais
- Sprint 0 com Spotless e CI prontos antes do primeiro PR

Dependencias externas:
- depende da Sprint 0 (tooling)

Responsavel principal:
- Dev Senior

Status de execucao:
- concluida em 2026-05-26; branch `feature/sprint-13-cobranca-inadimplencia` mergeada em `develop` via PR #61, commit `3bac857`
- 3 migrations Flyway: `V30__criar_tabelas_inadimplencia` (`workflow_cobranca`, `evento_cobranca`, `renegociacao`, unique parcial de idempotencia de notificacao), `V31__suportar_agenda_substituta` (self-FK `agenda_substituida_id`), `V32__ampliar_audit_seguranca_tipo_inadimplencia`
- modulo `cobranca` estendido com workflow configuravel por yaml, providers SMTP/Zenvia/Log, listeners de atraso/auditoria/renegociacao, jobs de escalonamento, inadimplencia e expiracao de renegociacao
- endpoints REST novos: `GET /api/v1/cobranca/inadimplencia`, `POST /api/v1/cobranca/parcelas/{id}/contato`, `POST /api/v1/cobranca/parcelas/{id}/renegociacao`, `PATCH /api/v1/cobranca/renegociacoes/{id}/aceite`, `PATCH /api/v1/cobranca/renegociacoes/{id}/recusa`
- auditoria reforcada com `NOTIFICACAO_ENVIADA`, `EVENTO_COBRANCA_REGISTRADO`, `PARCELA_INADIMPLENTE`, `RENEGOCIACAO_PROPOSTA`, `RENEGOCIACAO_ACEITA`, `RENEGOCIACAO_RECUSADA`, `RENEGOCIACAO_EXPIRADA`
- documentacao consolidada em [`repos/sep-api/COBRANCA.md`](../repos/sep-api/COBRANCA.md) e [`repos/sep-api/NOTIFICACOES.md`](../repos/sep-api/NOTIFICACOES.md); revisao juridica de `NOTIFICACOES.md` segue pendente antes de producao

Detalhamento das tasks:
- o detalhamento de tasks, arquivos esperados, verificacao, dependencias internas e criterios de pronto foi extraido do PRD e passa a ser tratado como artefato de especificacao proprio
- consultar: [`specs/fase-1/001-sprint-1-fundacao-tecnica.md`](../specs/fase-1/001-sprint-1-fundacao-tecnica.md)
- o PRD mantem apenas o planejamento de alto nivel desta sprint; a execucao e governada pelo spec correspondente

### Sprint 2

Objetivo de planejamento:
- entregar a base dos modulos `identity` e `usuarios`: entidade `Usuario` com UUID v6 e auditoria, DTOs e mapper obrigatorios, criacao publica de usuario com validacao e hash de senha via BCrypt

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
- consultar: [`specs/fase-1/002-sprint-2-gestao-usuarios.md`](../specs/fase-1/002-sprint-2-gestao-usuarios.md)
- o PRD mantem apenas o planejamento de alto nivel desta sprint; a execucao e governada pelo spec correspondente

### Sprint 3

Objetivo de planejamento:
- entregar o mecanismo completo de autenticacao e autorizacao dentro do modulo `identity`: login com emissao de JWT, filtro de validacao, recurso `/auth/me`, autorizacao por perfil e ownership nos endpoints de usuario, e alteracao da propria senha pelo usuario autenticado

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
- consultar: [`specs/fase-1/003-sprint-3-seguranca-autenticacao.md`](../specs/fase-1/003-sprint-3-seguranca-autenticacao.md)
- o PRD mantem apenas o planejamento de alto nivel desta sprint; a execucao e governada pelo spec correspondente

### Sprint 4

Objetivo de planejamento:
- consolidar a qualidade da API fechando quatro frentes: **evolucao** do `ApiExceptionHandler` ja criado na Sprint 1 (mapeamento completo de excecoes), documentacao OpenAPI com Swagger UI, cobertura JaCoCo no target 70% para cenarios criticos, e introducao do **Webhook Receiver Pattern** (`/api/v1/webhooks/{provider}/{event}`) com idempotencia via `Idempotency-Key` e Outbox stub, preparando Epic 15 (Pix)

Tema:
- Estabilizacao, Documentacao, Cobertura e Webhook Receiver

Pre-requisitos de entrada:
- Sprint 3 concluida
- endpoints principais e regras de seguranca estabilizados

Dependencias externas:
- depende da conclusao da Sprint 3

Responsavel principal:
- Dev Senior (com revisao funcional dos devs frontend na parte de documentacao)

Detalhamento das tasks:
- consultar: [`specs/fase-1/004-sprint-4-erros-docs-testes.md`](../specs/fase-1/004-sprint-4-erros-docs-testes.md)
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
