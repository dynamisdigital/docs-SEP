# Contexto do Projeto SEP

## Objetivo deste arquivo

Este arquivo registra o contexto da conversa, as decisoes tomadas e a motivacao do projeto, para que outro agente de IA ou integrante do time consiga entender rapidamente:
- por que este projeto esta sendo iniciado
- qual e o escopo atual
- o que ja foi decidido
- o que ainda nao deve ser implementado
- onde estao os documentos de apoio

## Contexto de origem do projeto

O projeto nasceu a partir da necessidade de estruturar uma plataforma SEP com foco inicial em emprestimos para empresas, apoiada por uma infraestrutura de Banking as a Service, com forte referencia ao ecossistema da Celcoin.

Antes do planejamento tecnico, foram reunidos materiais de estudo sobre:
- SEP
- Celcoin
- BaaS
- operacao de credito
- contexto regulatorio e operacional

Esses materiais foram organizados na workspace em uma pasta de documentacao.

## Estrutura atual da workspace

Na workspace `C:\workspace-sep`, foi criada a pasta:
- `docs-sep`

Dentro dela, foram centralizados documentos e materiais relacionados ao projeto.

Tambem foi criado o arquivo:
- [PRD.md](C:\workspace-sep\docs-sep\PRD.md)

Este PRD representa o documento principal de produto desta fase.

## Documentos e referencias consultadas

Durante a conversa, foram utilizados ou organizados materiais como:
- proposta tecnica sobre implementacao de SEP via Celcoin BaaS
- analises sobre SEPs no Brasil
- anotacoes sobre BaaS da Celcoin
- materiais adicionais em Markdown dentro de `docs-sep`

Esses documentos foram usados como base para formular o direcionamento do produto e do planejamento inicial.

## Referencia metodologica

Foi acordado que o projeto deve ser planejado seguindo o conceito de SDD, usando como referencia os materiais do repositrio `spec-kit`, especialmente:
- `AGENTS.md`
- `README.md`
- `spec-driven.md`

O repositorio consultado foi:
- `C:\Spec-kit-development\spec-kit`

Nao foi encontrado `SKILL.md` dentro desse repositrio, entao as orientacoes principais foram lidas a partir do `AGENTS.md`.

## Marco regulatorio e BaaS Celcoin

O produto opera sob a **Resolucao CMN nº 4.656/2018**, que disciplina as Sociedades de Emprestimo entre Pessoas. Implicacoes que valem desde a Sprint 1:
- KYC/KYB obrigatorio por lei (nao opcional)
- Segregacao patrimonial via conta escrow obrigatoria
- PLD (consultas COAF, OFAC, INTERPOL, MTE)
- Auditoria reforcada de operacoes financeiras

A integracao com **Celcoin BaaS** e a estrategia escolhida para materializar essas obrigacoes (KYC/KYB end-to-end, escrow, Pix, Open Finance via Finansystech). Os documentos de aprendizado em `docs-sep/Aprendizado Celcoin e SEP/` consolidam o entendimento.

Decorrencias arquiteturais ja incorporadas:
- modulo `escrow` modelado desde Sprint 1 (mesmo sem Celcoin integrado)
- `Provider Pattern` obrigatorio para isolar Celcoin de cada modulo de dominio
- `Webhook Receiver Pattern` introduzido na Sprint 4 (preparacao para Pix)

## Direcionamento do produto

O produto alvo e uma plataforma SEP com foco em capital de giro PJ.

O escopo do produto e maior do que a entrega inicial atualmente planejada. A fase atual continua sendo a fundacao tecnica da API, mas o direcionamento consolidado do produto ja prioriza a jornada de contratacao do emprestimo como proxima grande frente funcional.

As quatro jornadas principais definidas pelo PO sao:
- jornada da pessoa ou empresa que ira pedir emprestimo (**canal mobile exclusivo apos ADR 0009**)
- jornada da empresa que ira emprestar recursos (**canal web principal + mobile resumido apos ADR 0009**)
- jornada do financeiro interno (**canal web exclusivo apos ADR 0009**)
- jornada do administrador do sistema (**canal web exclusivo apos ADR 0009**)

A separacao de canal foi formalizada em [ADR 0009](../adr/0009-separacao-de-canal-por-perfil.md) por motivos de seguranca (biometria nativa, storage Keystore/Keychain, anti-phishing, certificate pinning) e UX (tarefas de credora exigem desktop).

**Sprint 5 (Endurecimento de Seguranca)** foi adicionada entre a Sprint 4 e a Epic 5 (Onboarding KYC/KYB) como **gate para producao**. Implementa MFA via TOTP (web) + biometria nativa (mobile), refresh token com rotacao, rate limiting, account lockout, password policy nova (12+ chars OU passphrase + haveibeenpwned), step-up authentication para operacoes sensiveis, audit log de seguranca, e materializa a canalizacao por perfil (ADR 0009). Detalhada em [ADR 0010](../adr/0010-mfa-totp-com-biometria-mobile.md) e [Spec 005](../specs/005-sprint-5-endurecimento-seguranca.md).

Essas jornadas devem existir formalmente na modelagem do produto, mas a execucao sera feita por ondas, em vez de tentar implementar tudo de uma vez.

## Estrategia de execucao decidida

Foi decidido que o projeto nao deve comecar tentando implementar todo o sistema SEP de ponta a ponta.

A estrategia acordada foi:
- primeiro construir uma base tecnica solida
- depois evoluir as jornadas de produto por fases

### Ordem de prioridade acordada

1. Fundacao tecnica local
2. Jornada do tomador
3. Jornada do financeiro interno
4. Jornada assistida da empresa credora
5. Infraestrutura remota, CI/CD e ambientes posteriores

Essa ordem foi refinada depois para refletir melhor a jornada de contratacao do emprestimo. A prioridade funcional consolidada passou a ser:
1. Fundacao da API
2. Gestao de usuarios
3. Seguranca e autenticacao
4. Tratamento de erros e documentacao
5. Onboarding KYC/KYB
6. Analise de credito
7. Formalizacao contratual
8. Cobranca e inadimplencia
9. Backoffice operacional
10. Jornada da empresa credora
11. Administracao e governanca
12. Fundacao Frontend
13. Frontend de Jornadas
14. Mobile SEP
15. Movimentacao Pix
16. Infraestrutura AWS futura

Foi decidido explicitamente que `Analise de credito` e mais urgente que `Pix`, e que os topicos que impactam diretamente a contratacao devem vir antes dos topicos financeiros expandidos.

Com isso, o entendimento correto do PRD passa a ser:
- entrega inicial: fundacao tecnica da API
- produto futuro priorizado: onboarding, analise de credito, formalizacao e cobranca
- capacidades operacionais e de jornada posteriores: backoffice, jornada da credora e administracao/governanca
- capacidades expandidas posteriores: frontend completo, mobile, Pix e infraestrutura remota

Tambem foi adicionada ao PRD uma secao de `Fronteiras entre epicos`, para reduzir duplicidade entre capacidades de dominio, jornadas, operacao interna, governanca e meios de movimentacao financeira.

## Stack e arquitetura definidos

As seguintes decisoes foram tomadas:

### Frontend
- Angular na versao `20.x` como baseline (Standalone Components, Signals e Zoneless estaveis, ecossistema alinhado), com opcao de upgrade para `21` na fase de implementacao mobile caso Ionic e plugins Capacitor confirmem suporte explicito; sem o template antigo (que limitava o projeto a Angular `17`), o upgrade para versoes modernas foi liberado e nao ha mais previsao de downgrade abaixo de `20`
- Standalone Components
- Signals
- SCSS puro como camada de estilizacao, sem frameworks CSS de terceiros (Bootstrap, Tailwind, Material e similares estao explicitamente fora)
- a base visual vem de dois design systems oficiais:
  - [`DESIGN-apple.md`](./DESIGN-apple.md) - superficies publicas (landing, login, cadastro)
  - [`DESIGN-notion.md`](./DESIGN-notion.md) - superficies autenticadas (dashboard e demais telas com JWT)
- a fronteira entre os dois design systems e o estado de autenticacao: ate o login, Apple; a partir de `/auth/me`, Notion
- componentes devem ser implementados como Angular standalone components proprios, com tokens (cores, tipografia, raios, espacamento, sombras) extraidos diretamente dos design systems para variaveis SCSS
- a decisao de abandonar o template administrativo pronto foi tomada para preservar flexibilidade do projeto a mudancas de produto ao longo do tempo

### Mobile
- o projeto tera um marco futuro chamado `Mobile SEP`
- stack recomendada: `Ionic v8 + Angular + Capacitor`
- stack mobile baseline: `Angular 20.x + Ionic 8.4+ + Capacitor 6` (combinacao com integracao validada e ecossistema alinhado); na fase de implementacao mobile, avaliar upgrade para Angular `21` apenas se Ionic e plugins Capacitor confirmarem suporte explicito; caso contrario, manter `20.x`. Sem previsao de downgrade do Angular abaixo de `20`
- todo o mobile (visitante e autenticado) segue o design system [`DESIGN-notion.md`](./DESIGN-notion.md), adaptado para toque, tabs inferiores e navegacao em pilha; a estilizacao deve ser feita em SCSS puro, com componentes Ionic customizados via CSS variables/SCSS para respeitar os tokens
- o mobile sera iniciado junto com a fundacao do frontend, como trilha paralela dependente dos mesmos contratos da API
- o primeiro recorte mobile cobre somente tomador de emprestimo e empresa credora
- o mobile nao tera visao do financeiro interno, backoffice operacional, administracao completa, governanca, cadastros mestres ou telas de auditoria nesta fase
- a primeira validacao mobile pode ser PWA/browser, evoluindo depois para Android/iOS via Capacitor
- Flutter e React Native nao foram recomendados nesta fase para evitar nova stack e duplicacao tecnica
- o mobile nao deve concentrar regra de negocio; decisoes, status, permissoes e dados operacionais devem vir da API

### Backend
- Java `21` LTS (Records para DTOs, Sealed types para Roles/eventos, Pattern matching, Virtual threads)
- Spring Boot `3.5.x` (versao minor pinada)
- Hibernate `6.x`
- PostgreSQL `16`
- Gradle `8.x` + Wrapper
- backend em papel de BFF
- identificadores com `UUID`
- biblioteca definida para geracao de UUID:
  - `implementation 'com.fasterxml.uuid:java-uuid-generator:5.1.0'`
- migrations versionadas com `Flyway`
- documentacao OpenAPI com `Springdoc 2.x`
- senhas com hash `BCrypt`
- endpoint de healthcheck com `Spring Boot Actuator`
- metricas com `Micrometer + Prometheus`
- configuracao de `CORS` ja prevista para integracao futura com Angular
- preferencia por `UUID v6`
- JWT sem refresh token na fase inicial
- mapeamento com `MapStruct` (substituiu ModelMapper, type-safe e sem reflexao)
- HTTP client `RestClient` (Spring 6) para integracoes Celcoin; `WebClient` reservado para streams
- resiliencia com `Resilience4j` (circuit breaker, retry, timeout)
- testes com `JUnit 5 + AssertJ + Testcontainers` (PostgreSQL real, sem H2) e test slices `@WebMvcTest`/`@DataJpaTest`/`@JsonTest`
- `Mockito` para unit tests da camada `application` (com `Fake<X>Provider` injetado)
- `WireMock 3.x` para integration tests dos adapters HTTP do Celcoin (`Celcoin<X>ProviderIT`) — testa wiring HTTP real sem precisar do Celcoin; ver ADR 0008
- qualidade com `Spotless + Palantir Java Format`, `JaCoCo target 70%`, pre-commit hooks
- arquitetura: monolito modular DDD com `Hexagonal/Ports & Adapters` por modulo
- `Provider Pattern` obrigatorio para integracoes externas (Celcoin)
- modulo `escrow` modelado desde Sprint 1 (Resolucao CMN 4.656/2018 obriga segregacao patrimonial)
- claims minimas do JWT:
  - `sub`
  - `email`
  - `roles`
- `sub` do JWT deve carregar o UUID do usuario
- auditoria deve persistir preferencialmente o UUID do usuario autenticado
- fallback tecnico de auditoria quando nao houver autenticacao, como `system`
- tabelas e colunas devem permanecer em portugues
- sem soft delete na fase inicial
- estrutura inicial de pacotes do Spring Boot foi replanejada para monolito modular DDD
- contratos iniciais de DTO tambem ja definidos no PRD
- contratos JSON iniciais dos endpoints tambem ja definidos no PRD
- backlog tecnico implementavel por sprints e tasks tambem ja foi preparado no PRD
- backlog tecnico agora tambem inclui composicao da equipe, pre-requisitos e dependencias por sprint e task
- o PRD agora tambem fecha consistencia de UUID nativo no PostgreSQL, validacao declarativa, convencoes de datas da API e estrategia inicial de logout no cliente
- os devs frontend tambem passam a ter entregaveis paralelos de apoio ja nesta fase documental e de preparacao tecnica

### Banco de dados
- PostgreSQL
- no ambiente local, usando imagem Docker
- orquestracao com Docker Compose

### Arquitetura inicial
- monolito modular orientado a DDD
- sem microservicos na fase inicial
- backend em unico deploy Spring Boot
- banco unico PostgreSQL nesta fase
- web e mobile consomem a mesma API publica, sem backends separados neste momento
- separacao por modulos de dominio, nao por camadas globais `model`, `repository`, `service` e `controller`
- modulos planejados:
  - `identity`
  - `usuarios`
  - `onboarding`
  - `credito`
  - `contratos`
  - `cobranca`
  - `escrow` (modulo transversal obrigatorio por Resolucao CMN 4.656/2018; modelado desde Sprint 1)
  - `backoffice`
  - `financeiro`
  - `credores`
  - `pix`
  - `shared`
- cada modulo deve conter suas proprias camadas internas `domain`, `application` (com `port.out` para Provider Pattern), `infrastructure` (com `adapter` para implementar portas) e `web`
- microservicos so devem ser reavaliados quando houver escala independente, deploy independente, isolamento regulatorio, banco separado, integracoes criticas ou ownership por equipe

## Ambiente e infraestrutura

Foi decidido que:
- nesta fase inicial, apenas o ambiente `dev-local` sera implementado localmente
- ate a conclusao completa do sistema de login, autenticacao e autorizacao, o banco oficial sera PostgreSQL local via Docker Compose
- a implantacao AWS, incluindo EC2 e RDS, nao deve iniciar antes da conclusao da Sprint 3 / Epic 3
- a recomendacao operacional e iniciar AWS preferencialmente apos a Sprint 4, caso a equipe queira chegar ao ambiente remoto com tratamento de erros, documentacao e testes criticos estabilizados
- futuramente o projeto tera `aws-develop`, `homologacao` e `producao`
- a infraestrutura remota sera baseada em AWS
- os servidores da aplicacao usarao `Amazon EC2`
- o banco remoto usara `Amazon RDS for PostgreSQL`
- o banco de dados nao ficara hospedado na EC2/VPS da aplicacao
- cada ambiente deve ter sua propria instancia RDS PostgreSQL
- `aws-develop` e `homologacao` poderao compartilhar uma EC2, com isolamento por containers, portas, variaveis e bancos
- `producao` tera EC2 propria e RDS proprio

Tambem foi definido que, na fase de infraestrutura:
- AWS e uma trilha tecnica habilitadora, nao uma funcionalidade de negocio concorrente com Pix, credito ou formalizacao
- a fase AWS pode ser antecipada antes de Pix se houver necessidade de ambiente remoto para validacao, homologacao ou integracao, desde que respeite o gate minimo da Sprint 3
- Docker ou Docker Compose nas EC2 poderao ser usados apenas para aplicacao, frontend, proxy e servicos auxiliares; PostgreSQL remoto deve ficar no RDS
- CI/CD com GitHub Actions nao e pre-requisito obrigatorio para o primeiro ambiente AWS nao produtivo, mas deve ser planejado na mesma fase
- enquanto CI/CD nao estiver pronto, qualquer deploy remoto inicial deve ser manual, documentado e restrito a ambiente nao produtivo
- o deploy sera por branch/ambiente
- os secrets serao separados por ambiente no GitHub
- migrations serao versionadas
- seeds serao separados por ambiente
- a regiao AWS recomendada sera `sa-east-1` (Sao Paulo)
- `Amazon Lightsail` fica apenas como alternativa de baixo custo, nao como recomendacao principal
- producao deve usar Security Groups restritivos, backups automaticos, encryption habilitada, acesso privado ao banco, logs e monitoramento
- Multi-AZ no RDS de producao deve ser avaliado quando houver trafego real ou necessidade formal de alta disponibilidade

Por enquanto, tudo isso permanece apenas como planejamento, nao implementacao.

## Escopo da primeira grande entrega

Foi definido que a primeira entrega concreta do projeto sera a API base, antes da integracao completa com o frontend.

Essa API inicial deve cobrir:
- usuarios
- autenticacao
- autorizacao
- auditoria
- documentacao de API
- ambiente local com PostgreSQL

## Requisitos principais da API inicial

As regras fechadas para a API sao:
- API REST
- Spring Boot
- Gradle
- JWT para autenticacao
- DTOs obrigatorios
- MapStruct obrigatorio (substituiu ModelMapper)
- `ApiExceptionHandler` obrigatorio
- `Flyway` para migrations
- `Springdoc OpenAPI` para documentacao
- `BCrypt` para hash de senha
- `Actuator` para healthcheck
- documentacao dos endpoints obrigatoria
- locale `pt-BR`
- timezone `America/Sao_Paulo`
- auditoria JPA com:
  - `CreatedDate`
  - `LastModifiedDate`
  - `CreatedBy`
  - `LastModifiedBy`

### Requisitos de usuario
- usuario deve ter e-mail unico como username
- senha deve ter exatamente 6 caracteres nesta fase
- a senha deve ser armazenada com hash seguro no backend
- perfis previstos:
  - `ROLE_ADMIN`
  - `ROLE_CLIENTE`
- cadastro de usuario sera publico nesta fase
- admin autenticado podera consultar qualquer usuario
- cliente autenticado podera consultar apenas os proprios dados
- admin autenticado podera listar todos os usuarios
- usuario autenticado podera alterar apenas a propria senha

### Endpoints definidos para a fase inicial
- `POST /api/v1/usuarios`
- `GET /api/v1/usuarios/{id}`
- `GET /api/v1/usuarios`
- `PATCH /api/v1/usuarios/{id}/senha`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

## Documento ja criado

Foi criado e revisado um PRD mais estruturado, em formato classico, no arquivo:
- [PRD.md](C:\workspace-sep\docs-sep\PRD.md)

Esse PRD contem:
- resumo executivo
- problema
- contexto
- objetivos
- escopo
- usuarios e perfis
- requisitos funcionais e nao funcionais
- APIs previstas
- arquitetura
- criterios de sucesso
- roadmap inicial

## O que ainda nao deve ser gerado

Foi pedido explicitamente para nao gerar ainda:
- todos os arquivos de specs
- todos os arquivos de plans derivados
- implementacao completa da API

Ou seja, neste momento o foco esta em preparar a documentacao-base do projeto, e nao sair produzindo todos os artefatos ou codigo final.

## Regras operacionais combinadas

Algumas regras importantes foram definidas durante a conversa:
- seguir a logica de SDD no planejamento
- usar os materiais do `spec-kit` como referencia metodologica
- a parte de GitHub sera manual
- commits podem ser feitos pelo agente quando solicitado
- push e PR serao manuais
- testes locais devem acontecer ao final de cada task quando a implementacao comecar
- CI/CD, GitHub Actions, AWS, EC2, RDS e deploy remoto serao tratados em uma fase separada de infraestrutura
- a fase de infraestrutura AWS so podera iniciar, no minimo, apos a conclusao completa do login, autenticacao e autorizacao

## Situacao atual

No estado atual:
- os materiais de pesquisa estao organizados em `docs-sep`
- o PRD inicial ja foi criado e revisado
- o contexto consolidado desta conversa esta neste arquivo
- o projeto ainda esta em fase de definicao documental e organizacao
- a implementacao completa ainda nao comecou
- o uso de template administrativo pronto foi descartado em favor de dois design systems oficiais: Apple para superficies publicas (landing, login, cadastro) e Notion para superficies autenticadas (dashboard frontend e todo o mobile), com SCSS puro como camada de estilizacao
- ficou registrado que a versao do Angular do frontend e do mobile esta definida em `20.x` como baseline, com opcao de upgrade para `21` condicionada a checagem de compatibilidade Ionic + plugins Capacitor na fase de implementacao mobile; a clausula anterior de downgrade foi removida junto com a saida do template, e a stack mobile baseline ficou consolidada como `Angular 20.x + Ionic 8.4+ + Capacitor 6`
- a revisao tecnica do backend ja consolidou Flyway, BCrypt, Springdoc, Actuator, CORS e UUID como padroes da implementacao
- a revisao tecnica tambem consolidou o padrao inicial de JWT, auditoria e convencoes de persistencia
- a fase futura de `Movimentacao Pix` foi aprovada conceitualmente e incorporada ao PRD como epic posterior
- o primeiro recorte aprovado para Pix foi `desembolso + recebimento`
- a operacao inicial de Pix foi assumida como assistida pelo financeiro interno
- a base conceitual de movimentacao futura sera `conta operacional/escrow`
- o roadmap foi replanejado para incluir explicitamente:
  - `Onboarding KYC/KYB`
  - `Analise de credito`
  - `Formalizacao contratual`
  - `Cobranca e inadimplencia`
- o PRD tambem passou a cobrir melhor as quatro jornadas do PO com epics explicitas para:
  - `Backoffice operacional`
  - `Jornada da empresa credora`
  - `Administracao e governanca`
- foi adicionado o marco e epic futura `Mobile SEP`, iniciado junto com a fundacao do frontend, usando Ionic v8 + Angular + Capacitor
- o mobile ficou limitado inicialmente a tomador e empresa credora, sem financeiro interno, backoffice ou administracao completa
- Mobile SEP foi posicionado antes de Pix para ajudar a validar a jornada de contratacao com usuarios reais
- a arquitetura do backend foi replanejada para monolito modular DDD, mantendo um unico Spring Boot e banco unico nesta fase
- a estrutura antiga por camadas globais foi substituida por modulos de dominio com fronteiras internas claras
- `identity` e `usuarios` serao os primeiros modulos reais; autenticacao permanece dentro do monolito, sem virar microservico nesta fase
- Pix foi reposicionado para depois dos blocos que impactam diretamente a contratacao do emprestimo
- a infraestrutura futura foi refinada para AWS, com Amazon EC2 para servidores e Amazon RDS for PostgreSQL para banco gerenciado fora da EC2
- foi definido que AWS/EC2/RDS so entram, no minimo, apos a conclusao completa da Sprint 3 / Epic 3 de login, autenticacao e autorizacao; ate la, o banco permanece local em Docker Compose
- a nomenclatura foi refinada para evitar ambiguidade: `dev-local` representa o desenvolvimento local com Docker Compose, enquanto `aws-develop` representa o futuro ambiente remoto de desenvolvimento na AWS
- a infraestrutura AWS ficou registrada como trilha tecnica habilitadora, podendo ocorrer antes de Pix se o time precisar de ambiente remoto, mas sem quebrar a prioridade funcional da jornada de contratacao

## Proximo passo mais natural

Os proximos passos provaveis, dependendo da orientacao do usuario, sao:
- criar artefatos de especificacao derivados do PRD
- quebrar o backlog em specs/plans/tasks
- iniciar a implementacao da API em etapas pequenas
- estruturar o repositorio backend real, caso ainda nao exista na workspace
- detalhar no futuro a epic de Pix em artefatos proprios quando a fundacao atual estiver concluida

## Observacao importante para outro agente

Se outro agente assumir este trabalho, ele deve:
- ler primeiro o [PRD.md](C:\workspace-sep\docs-sep\PRD.md)
- usar este `CONTEXT.md` para entender a historia das decisoes
- respeitar que a implementacao ainda nao foi autorizada por completo nesta etapa documental
- evitar gerar automaticamente todos os specs/plans sem confirmacao do usuario
