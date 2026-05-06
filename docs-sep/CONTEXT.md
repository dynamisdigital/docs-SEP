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
- jornada da pessoa ou empresa que ira pedir emprestimo
- jornada da empresa que ira emprestar recursos
- jornada do financeiro interno
- jornada do administrador do sistema

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
- a pasta `steps/` foi reorganizada em tres subpastas para isolar as trilhas de execucao por papel: `steps/backend/` (Sprints 0XX, Dev Senior), `steps/web/` (F-Sprints 1XX, Devs Plenos Frontend) e `steps/mobile/` (M-Sprints 2XX, Dev Mobile); o indice consolidado vive em `steps/README.md` e os arquivos ja existentes (`000-sprint-0-steps.md` e `100-fsprint-0-steps.md`) foram movidos para suas respectivas pastas com os caminhos relativos atualizados
- as tres Sprint 0 (backend, web e mobile) ja tem steps detalhados, revisados em conjunto e coesos entre si: `steps/backend/000-sprint-0-steps.md`, `steps/web/100-fsprint-0-steps.md` e `steps/mobile/200-msprint-0-steps.md`
- decisoes de execucao consolidadas durante a revisao das tres Sprint 0 (atualizadas em 2026-05-04 apos a separacao em 3 repos — ver item mais abaixo):
  - **pre-commit por repo independente**: `sep-api` usa `.githooks/pre-commit` minimo (Spotless), `sep-app` e `sep-mobile` usam Husky padrao via `npx husky init`. Sem agregador cross-repo (a versao monorepo anterior foi descontinuada).
  - Vitest nas duas trilhas Angular (web e mobile) usa `@analogjs/vite-plugin-angular` + `@analogjs/vitest-angular`, pois Vitest puro nao compila templates Angular
  - MSW alinhado ao PRD §21 em web (perfil `ADMIN`) e mobile (perfil `CLIENTE`), com `POST /auth/login` e `GET /auth/me`
  - cada projeto ocupa a raiz do seu repo (`sep-api`, `sep-app`, `sep-mobile`), sem subpasta `apps/`
  - GitHub Actions por repo, sem `paths-filter` (cada repo so tem um app); workflows copiados de `docs-sep/ci-pipelines/templates/`
- planejamento da Fase 2 concluido em 2026-05-04: 10 sprints (Sprint 5 ja existente como gate de hardening + 9 sprints novas para Epics 5-9), apenas backend; web/mobile da Fase 2 entrarao em planejamento separado depois que os contratos da API estabilizarem; decisoes 1B/2B/3C/4D registradas:
  - **1B**: Sprint 5 abre a Fase 2 (gate de hardening obrigatorio antes de qualquer integracao real com Celcoin)
  - **2B**: granularidade de 2 sprints por Epic 5-8 (parte 1 + parte 2), Epic 9 em sprint unica → 9 sprints novas (006-014)
  - **3C**: apenas backend nesta etapa; F-Sprints 5+ e M-Sprints 5+ NAO sao planejadas agora (decisao motivada por evitar planejar UI sobre contratos que ainda evoluem nas Epics 5-9)
  - **4D**: entregaveis = plano executivo (`/home/mauricio/.claude/plans/precisamos-agora-planejar-as-polished-pumpkin.md`) + atualizacao do PRD (§22 com Sprints 5-14, §25 com sprints alocadas por Epic, nova §29 com tabela executiva Epics × Sprints) + 9 specs novas em `docs-SEP/specs/fase-2/006` ate `docs-SEP/specs/fase-2/014`
- mapa Sprint → Epic da Fase 2 (referencia rapida):
  - Sprint 5 → Epic 4 estendida (Endurecimento de Seguranca — gate)
  - Sprints 6, 7 → Epic 5 (Onboarding KYC PF, Onboarding KYB PJ + PLD)
  - Sprints 8, 9 → Epic 6 (Credito regras + parecer, Open Finance)
  - Sprints 10, 11 → Epic 7 (Formalizacao geracao, Assinatura Digital + CCB)
  - Sprints 12, 13 → Epic 8 (Cobranca parcelas, Inadimplencia)
  - Sprint 14 → Epic 9 (Backoffice operacional — fechamento Fase 2)
- ADRs candidatos da Fase 2 (criados just-in-time durante cada sprint, nao agora):
  - ADR 0011: Motor de regras de credito interno (Sprint 8)
  - ADR 0012: Provedor de assinatura digital (Sprint 11) — gate da Sprint 11
  - ADR 0013: Estrategia de notificacoes transacionais (Sprint 13) — gate da Sprint 13
- steps continuam **just-in-time** (regra do AGENT.md): nao foram gerados em massa nesta etapa, apenas antes da execucao de cada sprint da Fase 2
- repositorios separados criados manualmente em 2026-05-04: `sep-api` (Java backend), `sep-app` (Angular frontend), `sep-mobile` (Ionic mobile). Documentacao consolidada permanece em `docs-SEP`. Decisoes do planejamento da migracao documental:
  - **(1B)** package Java renomeado de `com.dynamis.broker_app` para `com.dynamis.sep_api`; artifact ID `broker-app` → `sep-api`; classe principal `BrokerAppApplication` → `SepApiApplication`
  - **(2A)** paths nos specs/steps usam placeholders `<sep-api-root>`, `<sep-app-root>`, `<sep-mobile-root>` (substituem `apps/sep-frontend/`, `apps/sep-mobile/` e `C:/workspace-sep/`)
  - **(3A)** workflows de CI movidos de `docs-SEP/.github/workflows/` para `docs-sep/ci-pipelines/templates/` como `sep-api-ci.template.yml`, `sep-app-ci.template.yml`, `sep-mobile-pwa-ci.template.yml`; templates mobile native renomeados com prefixo `sep-mobile-`; cada template deve ser copiado para o `.github/workflows/` do repo correspondente
  - **(4A)** cada repo gerencia seu proprio pre-commit independentemente: `sep-api` com `.githooks/pre-commit` minimo (Spotless), `sep-app` e `sep-mobile` com Husky + lint-staged padrao via `npx husky init`. O agregador cross-repo foi descontinuado.
- agente de IA realiza apenas **commits** (com descricao) e **criacao de branches por sprint**; push e PR continuam **manuais**, executados pelo desenvolvedor humano
- **Sprint 0 (Hygiene & Foundation) concluida em 2026-05-04** no repo `sep-api`, branch `sprint-0/hygiene-foundation`, build CI no GitHub verde. Entregaveis materializados:
  - meta-arquivos (`.gitignore`, `.editorconfig`, `.gitattributes`)
  - Gradle wrapper 8.10.2 + `build.gradle` minimo (Spotless 6.25.0 + Palantir 2.50.0; JaCoCo 0.8.12 com `jacocoTestCoverageVerification` DESLIGADO ate a Sprint 4); plugin `org.springframework.boot` e dependencias da aplicacao ficaram para a Sprint 1 Task 1.1b para evitar exigencia prematura de main class
  - `.githooks/pre-commit` rodando `./gradlew spotlessCheck`; cada dev configura `git config core.hooksPath .githooks`
  - `.github/PULL_REQUEST_TEMPLATE.md`, `ISSUE_TEMPLATE/{bug_report,feature_request}.md` e `CODEOWNERS` com `@mauriciofcjr`
  - `.github/workflows/ci.yml` (renomeado para `name: CI-API` para diferenciar dos CIs de `sep-app` e `sep-mobile`) executando build + test + Spotless + JaCoCo com Postgres 16 service container; `.github/workflows/docs.yml` para markdownlint (continue-on-error)
  - `CONTRIBUTING.md` com Conventional Commits + `README.md` expandido (setup, code style, cobertura, hooks, CI, stack, arquitetura, marco regulatorio, sprints)
  - 12 modulos x 4 layers = 48 `package-info.java` em `src/main/java/com/dynamis/sep_api/{identity,usuarios,onboarding,credito,contratos,cobranca,escrow,backoffice,financeiro,credores,pix,shared}/{domain,application,infrastructure,web}` + `scripts/create-package-structure.sh` + `SepApiApplication` stub (final class privada, ganhara `@SpringBootApplication` e `main` real na Sprint 1 Task 1.1b)
  - ADRs nao foram duplicados no `sep-api`: vivem em `docs-SEP/adr/` (0001-0011) e o `sep-api/README.md` referencia via `../docs-SEP/adr/`
- **Branch protection no GitHub** ativa na `main` do `sep-api` apos a Sprint 0; substituicao do placeholder `@MAURICIO_GITHUB_USERNAME` no `CODEOWNERS` ja foi feita pelo desenvolvedor para `@mauriciofcjr`
- **F-Sprint 0 (Setup Angular + Tooling) concluida em 2026-05-04** no repo `sep-app`, branch `fsprint-0/setup-angular`, build CI-APP no GitHub verde. Entregaveis materializados:
  - scaffold Angular 20.3.19 (Standalone Components, Signals, strict, SCSS) com `--directory=.` (raiz do repo, sem subpasta `apps/`)
  - prefixo Angular `sep` em `angular.json`; selector raiz renomeado para `sep-root`; `index.html` com title `SEP Frontend` e lang `pt-BR`
  - estrutura DDD em `src/app/{core/{auth,http,config,guards,interceptors},shared/{components,directives,pipes,models,utils},layout/{public-shell,authenticated-shell},features/{public,authenticated}}`
  - `src/styles/{_tokens,_apple,_notion,_mixins,index}.scss` como placeholders (populados na F-Sprint 1); plugado em `angular.json:architect.build.options.styles`
  - ESLint 9 (flat config) + angular-eslint 21 + `eslint-config-prettier`; Prettier 3 + `.prettierrc.json` + `.prettierignore`; Stylelint 16 + `stylelint-config-standard-scss` + `.stylelintrc.json`; Husky 9 + lint-staged 15 (`prepare: husky` instala automaticamente)
  - Vitest 2.1 via `@analogjs/vitest-angular@^1` (Vitest puro nao compila templates Angular); `vitest.config.mts` (extensao `.mts` necessaria porque `@analogjs/vite-plugin-angular` e ESM-only); `environment: 'happy-dom'` (substituiu jsdom porque `TransformStream` ausente em jsdom 25); JIT mode no plugin Angular
  - `tsconfig.spec.json` refeito para Vitest (types `vitest/globals` e `node`); `src/test-setup.ts` faz `import @angular/compiler` primeiro e init do TestBed via `BrowserDynamicTestingModule`/`platformBrowserDynamicTesting`
  - Playwright 1.59 (Chromium) com webServer auto em `:4200`; smoke `e2e/smoke.spec.ts` valida title `SEP`
  - MSW 2.14: handlers em `src/mocks/handlers.ts` para `POST /auth/login` e `GET /auth/me` alinhados ao PRD §21 (UUID v6, ISO-8601, perfil `ADMIN`); worker (browser) em `src/mocks/browser.ts`; server (Node) em `src/mocks/server.ts` pronto. **Wiring do server em `test-setup.ts` deferido para F-Sprint 2/3**, quando primeiro teste dependente da API entrar; happy-dom nao tem `BroadcastChannel`, polyfills Web Streams + `BroadcastChannel` stub ja prontos em `src/test-polyfills.ts` para ativacao futura
  - `src/main.ts` com gate runtime `localStorage.NG_APP_USE_MSW === 'true'` para ativar worker MSW em dev; substituiu o `import.meta.env.NG_APP_USE_MSW` proposto no step porque Angular CLI nao injeta env vars `NG_APP_*` em build
  - smoke `src/app/app.spec.ts` (Vitest 2 + happy-dom + JIT) valida classe `App` definida; cobertura v8 100% no escopo
  - `.github/workflows/ci.yml` (`name: CI-APP` — diferencia de `CI-API` e do futuro `CI-MOBILE`) com `format:check`, `lint`, `lint:scss`, `test:coverage`, `build` em Node 20 + ubuntu-24.04; concurrency cancel-in-progress; artifact `web-coverage` retention 14 dias; `npm ci --legacy-peer-deps` (vitest@^2 vs peer optional vitest@^3.1.1 do `@angular/build`)
  - `package.json`/`package-lock.json` versionados ja com todas as devDependencies das 4 Tasks no commit unico de F-0.1, evitando checkpoints intermediarios
- **Versoes finais resolvidas no `sep-app`** (vs versoes pinadas no spec/steps): Angular 20.3.19, ESLint 9.39, Prettier 3.8, Stylelint 16.26, Husky 9.1, lint-staged 15.5, Vitest 2.1, `@analogjs/vitest-angular` 1.22, Playwright 1.59, MSW 2.14, `@testing-library/angular` 18.1.1 (substituiu `^17` que puxava `@angular/animations@21` transitivamente, conflitando com Angular 20), `@angular/animations` 20.3, `@angular/platform-browser-dynamic` 20.3 (instalado explicitamente — Angular 20 nao traz por default), happy-dom (substituiu jsdom)
- **M-Sprint 0 (Setup Ionic + Angular + Capacitor + Tooling) concluida em 2026-05-04** no repo `sep-mobile`, branch `msprint-0/setup-ionic` (originada de `develop` apos `pull --ff-only`), build CI-MOBILE no GitHub verde. Entregaveis materializados:
  - scaffold Ionic 8 + Angular 20.3.19 + **Capacitor 8.3.1** via `npx @ionic/cli@latest start blank --type=angular-standalone --capacitor --package-id=com.dynamis.sep.mobile` (template `angular-standalone` exigiu flag explicita; default do CLI ainda gera template legacy NgModule)
  - **Capacitor 8.3.1 substitui Capacitor 6 do ADR 0003**: Ionic CLI gera Cap 8 por default e o PRD §11 estabelece direcao de atualizar Ionic em vez de regredir Capacitor para combinar versoes. Pendencia: criar ADR de update (proximo numero livre apos 0013 reservado para notificacoes Sprint 13) reformalizando a baseline antes da fase Android/iOS
  - prefixo Angular `sep` em `angular.json`; selector raiz renomeado para `sep-root`; `home.page.ts` ajustado para `sep-home`; `index.html` com title `SEP Mobile` e lang `pt-BR`
  - estrutura DDD em `src/app/{core/{auth,http,config,guards,interceptors,storage},shared/{components,directives,pipes,models,utils},layout/{public-shell,mobile-tabs,stack-shell},features/{public,tomador,credora}}` (escopo reduzido tomador+credora conforme PRD §22)
  - `src/styles/{_tokens,_notion-mobile,_ionic-overrides,_mixins,index}.scss` como placeholders (substituidos na M-Sprint 1 — ver entrada abaixo); plugado em `angular.json:architect.build.options.styles` preservando `theme/variables.scss` e `global.scss`
  - `capacitor.config.ts` com `appId: com.dynamis.sep.mobile`, `appName: SEP`, `webDir: www`
  - files legacy karma removidos do scaffold (`test.ts`, `polyfills.ts`, `zone-flags.ts`, `karma.conf.js`, target `test` Karma do `angular.json`) — substituidos por Vitest na M-0.3
  - ESLint 9 (flat config) + angular-eslint 20 + typescript-eslint 8 + `eslint-config-prettier`; Prettier 3 + `.prettierrc.json` + `.prettierignore` (incluindo android/ios/.capacitor); Stylelint 16 + `stylelint-config-standard-scss` + `.stylelintrc.json` com `custom-property-pattern` permitindo `--ion-*`; Husky 9 + lint-staged 15 (`prepare: husky` instala automaticamente)
  - Vitest 2 + `@analogjs/vitest-angular@^1` (Vitest puro nao compila templates Angular/Ionic); `vitest.config.mts` (`.mts` por causa ESM-only do `@analogjs/vite-plugin-angular`); `environment: 'happy-dom'` (substituiu jsdom porque `TransformStream` ausente em jsdom 25); JIT mode + inline deps `@angular/@analogjs/@testing-library/@ionic/ionicons`
  - `tsconfig.spec.json` refeito para Vitest (types `vitest/globals` e `node`); `src/test-setup.ts` faz `import @angular/compiler` primeiro e init do TestBed via `BrowserDynamicTestingModule`/`platformBrowserDynamicTesting`
  - Playwright 1.59 com **devices Pixel 5 (Chromium)** ao inves de iPhone 13 (WebKit) do step — viewport mobile real sem precisar instalar webkit no CI; webServer auto em `:8100`; smoke `e2e/smoke.spec.ts` valida `ion-app` visivel
  - MSW 2.14: handlers em `src/mocks/handlers.ts` para `POST /auth/login` e `GET /auth/me` alinhados ao PRD §21 (UUID v6, ISO-8601, **perfil `CLIENTE`** — escopo tomador/credora, vs perfil `ADMIN` do `sep-app`); worker (browser) em `src/mocks/browser.ts`; server (Node) em `src/mocks/server.ts` pronto. **Wiring do server em `test-setup.ts` deferido para M-Sprint 2/3**; polyfills Web Streams + `BroadcastChannel` stub ja prontos em `src/test-polyfills.ts`
  - `public/mockServiceWorker.js` gerado por `npx msw init` + assets do `public/` adicionados em `angular.json:architect.build.options.assets` para o build copiar para `www/`
  - `src/main.ts` com gate runtime `localStorage.NG_APP_USE_MSW === 'true'` (substituiu `isDevMode()` proposto no step) — consistencia com sep-app e desacoplamento de build env vars
  - `tsconfig.app.json` exclui `test-setup.ts`, `test-polyfills.ts` e `mocks/server.ts` do build da app (test-polyfills importa `node:stream/web` e `node:util`, que precisariam types Node ausentes em `types: []`)
  - smoke `src/app/app.component.spec.ts` (Vitest 2 + happy-dom + JIT) valida classe `AppComponent` definida
  - `.github/workflows/ci.yml` (`name: CI-MOBILE` — diferencia de `CI-API` e `CI-APP`) com `format:check`, `lint`, `lint:scss`, `test:coverage`, `build` PWA (`test -d www`) em Node 20 + ubuntu-24.04; concurrency cancel-in-progress; artifacts `mobile-coverage` (relatorio v8) e `mobile-pwa-www` (output `www/`) com retention 14 dias; `npm ci --legacy-peer-deps`
  - `package.json`/`package-lock.json` versionados ja com todas as devDependencies das 4 Tasks no commit unico de M-0.1, evitando checkpoints intermediarios
- **Branches `develop` criadas em 2026-05-04** nos 3 repos (`sep-api`, `sep-app`, `sep-mobile`) como base unificada de trabalho. Toda branch de sprint/feature/fix nasce de `develop` apos `pull --ff-only`. `main` permanece protegida (squash merge, branch protection, CODEOWNERS); `develop` recebe PRs de branches de trabalho, depois e mergeada em `main` em entregas.
- **Pendencias documentais apos M-Sprint 0**:
  - ADR de update reformalizando a baseline mobile com **Capacitor 8.3.x** (substitui ADR 0003 que dizia Cap 6) — criar antes da fase Android/iOS (Epic 14 Fase Mobile 2+); ADR 0011 ja reavaliou stack mas manteve Cap 6 nominal, entao nova ADR cobre so o salto de versao
  - Branch protection no `main` e `develop` dos 3 repos no GitHub apos primeiro PR/CI rodar (passo-a-passo registrado para o usuario)
- **Sprint 1 (Fundacao Tecnica) concluida em 2026-05-05** no repo `sep-api`, branch `feature/sprint-1-fundacao-tecnica` (originada de `develop` apos `pull --ff-only`). Mergeada em `main` via PR #3/#4. Entregaveis materializados:
  - scaffold Spring Boot 3.5.5 + Gradle 8 + Java 21 + estrutura DDD por modulo (12 modulos × 4 layers + sub-pacotes Hexagonal `domain/{model,event,exception,vo}`, `application/{usecase,port/out,service}`, `infrastructure/{persistence,adapter,config}`, `web/{controller,dto,mapper}`)
  - dependencias pinadas: MapStruct 1.6.3 (annotation processor `-Amapstruct.unmappedTargetPolicy=ERROR`), JJWT 0.12.6, springdoc 2.8.13 (corrigido apos bump erroneo para 2.6.0; ver Sprint 2), `java-uuid-generator` 5.1.0, Resilience4j 2.2, WireMock 3.9.2, Testcontainers 1.21.3 (declarado mas nao usado nos testes — ver desvio abaixo)
  - `application.yml` defaults + `application-dev.yml` (Postgres local) + `application-test.yml`; Jackson `time-zone: America/Sao_Paulo` + `write-dates-as-timestamps: false`; `ddl-auto: validate` (Flyway gerencia schema); Springdoc + Actuator (`health`, `info`, `metrics`, `prometheus`)
  - Docker Compose com `sep-postgres` (postgres:16-alpine, healthy, volume persistente, porta 5432)
  - `LocaleConfig` (`pt-BR`/`America/Sao_Paulo`) + `CorsConfig` lendo `app.cors.*` + `SecurityConfig` esqueleto em `identity/infrastructure/config/` com CORS + sessao stateless + `permitAll` para Actuator/Swagger; restante `anyRequest().authenticated()` ate Sprint 3 plugar JWT
  - Flyway: `V1__init.sql` cria tabela `usuario` completa (id `uuid` nativo, `username` unique, role check `ADMIN`/`CLIENTE`, 4 colunas de auditoria). Sprint 2 nao precisou criar V3 — schema absorvido por V1
  - `ApiExceptionHandler` stub em `shared/exception/` mapeando `MethodArgumentNotValidException`, `DataIntegrityViolationException`, `NoHandlerFoundException`, `DomainException` (switch sealed) e fallback `Exception`; `ErrorResponseDto` record; `DomainException` `sealed` com 3 subtypes (`ValidacaoException`, `RecursoNaoEncontradoException`, `ConflitoException`)
  - `EntidadeAuditavel` mapped superclass com `OffsetDateTime dataCriacao`/`dataModificacao` + `String criadoPor`/`modificadoPor` (length 50); `AuditorAwareImpl` com fallback `system`; `JpaAuditingConfig` com `@EnableJpaAuditing(auditorAwareRef = "auditorAware")`. **Lacuna descoberta na Sprint 2**: provider default do Spring Data nao gera `OffsetDateTime`, exigiu adicionar `DateTimeProvider` customizado retornando `OffsetDateTime.now()` em `JpaAuditingConfig` (Sprint 2 fechou esse gap)
  - infraestrutura para Provider Pattern em `shared/integration/`: `RestClientFactory`, `Resilience4jConfig`, `IdempotencyKeyInterceptor`, `CorrelationIdFilter` (MDC `correlationId`)
  - modulo `escrow` modelado (V2 migration + `ContaEscrow`, `Wallet`, `MovimentacaoEscrow` + sealed `TipoMovimentacao` + VOs + porta `EscrowProvider` em `application/port/out/`)
  - smoke tests: `SmokeBootTest` (`@SpringBootTest` + Postgres local via `@ActiveProfiles("dev")`), `ApiExceptionHandlerTest` (4 cenarios), `EntidadeAuditavelTest` (renomeado para `AuditorAwareImplTest`, 3 cenarios). **Desvio de Testcontainers**: spec exigia `@Testcontainers + @Container PostgreSQLContainer<>`, mas issue conhecido com Docker Engine 28+ na versao atual de TC levou a usar Postgres local via Docker Compose. Documentado no Javadoc do `SmokeBootTest`. Migracao para Testcontainers ficou como follow-up cross-sprint.
  - **Incidente operacional 2026-05-05**: setting `Automatically delete head branches` do repo `sep-api` apagou `feature/sprint-1-fundacao-tecnica` E `develop` apos merge dos PRs #3/#4. Branches restauradas via push manual local; `develop` reconstruida com `git merge --ff-only feature/sprint-1-fundacao-tecnica`. Setting deve ser desligado: `gh api -X PATCH repos/dynamisdigital/sep-api -f delete_branch_on_merge=false`
- **Sprint 2 (Gestao de Usuarios) concluida em 2026-05-05** no repo `sep-api`, branch `feature/sprint-2-gestao-usuarios` (originada de `develop` apos `pull --ff-only`). 2 commits: `87ae142` (sprint 2 completa) + `1fe6ab0` (fix springdoc). 18 arquivos, 619 insercoes, 24 testes verdes. Entregaveis:
  - modulo `usuarios` com layout DDD: `domain/model/{Usuario, Role}`, `application/{exception/UsernameJaExisteException, usecase/CriarUsuarioUseCase}`, `infrastructure/persistence/UsuarioRepository`, `web/{controller/UsuarioController, dto/{UsuarioCreateDto, UsuarioResponseDto, UsuarioSenhaUpdateDto}, mapper/UsuarioMapper}`
  - entidade `Usuario` extends `EntidadeAuditavel` com UUID v6 via factory `Usuario.criar(...)` usando `Generators.timeBasedReorderedGenerator()` do `java-uuid-generator`. Construtor `protected` por design DDD encapsula geracao do id
  - DTOs como records Java 21 com Bean Validation (`@Email`, `@Size(min=6, max=6)`, `@NotBlank`, `@NotNull Role`); `UsuarioResponseDto` SEM campo `password` (record garante estruturalmente que senha nao vaza)
  - `UsuarioMapper` MapStruct apenas com `toResponse(Usuario) -> UsuarioResponseDto`. **Decisao**: NAO declara `toEntity` porque `Usuario` tem construtor `protected` (factory Pattern); MapStruct nao consegue instanciar via construtor publico. Use case usa a factory diretamente
  - `CriarUsuarioUseCase` `@Service @Transactional`: `existsByUsername` -> throw `UsernameJaExisteException` -> `passwordEncoder.encode` -> `Usuario.criar` -> `repository.save`
  - `UsuarioController` POST `/api/v1/usuarios` retornando `201 Created` + header `Location: /api/v1/usuarios/{id}`; rota liberada com `permitAll()` em `SecurityConfig` (antes de `anyRequest().authenticated()`)
  - `@Bean PasswordEncoder` (BCrypt strength 10) adicionado ao `SecurityConfig` existente em vez de criar bean separado em `shared/config/` — seguranca centralizada, Sprint 3 ja vai mexer no mesmo arquivo para JWT
  - 4 ajustes minimos em arquivos da Sprint 1:
    - `ConflitoException` `final` -> `non-sealed` para permitir subtypes por modulo (sealed hierarchy de `DomainException` continua exhaustiva)
    - `JpaAuditingConfig` ganhou `@Bean DateTimeProvider offsetDateTimeProvider() -> Optional.of(OffsetDateTime.now())` + `@EnableJpaAuditing(..., dateTimeProviderRef = "offsetDateTimeProvider")`. Fix latente Sprint 1 (provider default do Spring Data nao gera `OffsetDateTime`)
    - `ApiExceptionHandler` ganhou `@ExceptionHandler(HttpMessageNotReadableException.class) -> 400`. Necessario porque enum binding falho (role `"FOO"`) lanca `HttpMessageNotReadableException`, nao `MethodArgumentNotValidException`
    - `springdoc` 2.6.0 -> 2.8.13. Bump foi inicialmente revertido em code review como "drift sem justificativa", mas `GET /v3/api-docs` falhou em runtime com `NoSuchMethodError: ControllerAdviceBean.<init>(Object)` (removido em Spring Framework 6.2 = Spring Boot 3.5). Re-bump comitado em `1fe6ab0` apos smoke test
  - testes: `UsuarioRepositoryTest` (4 cenarios, `@DataJpaTest` contra Postgres local — segue desvio Sprint 1), `UsuarioMapperTest` (1 cenario validando estruturalmente que record nao tem `password`), `CriarUsuarioUseCaseTest` (5 cenarios Mockito puro, sem Spring), `UsuarioControllerTest` (5 cenarios `@WebMvcTest` + `@AutoConfigureMockMvc(addFilters = false)` + `@Import(ApiExceptionHandler.class)`)
  - **Erratum spec 002**: Task 2.1 listava criacao de `V3__criar_tabela_usuario.sql`, mas `V1__init.sql` da Sprint 1 ja entregou o schema completo. Sprint 2 nao criou nova migration — entidade JPA materializada sobre schema existente. Erratum registrado no cabecalho da spec
  - **Lessons learned**: dependency bumps de bibliotecas core (springdoc, Spring Framework, Hibernate) precisam de smoke test `bootRun` + `curl /v3/api-docs` e `/actuator/health` antes de assumir scope creep e reverter. Memoria de agente ganhou registro `feedback_springdoc_compat.md`

- **Sprint 3 (Seguranca e Autenticacao JWT) concluida em 2026-05-05** no repo `sep-api`, branch `feature/sprint-3-seguranca-autenticacao` (originada de `develop` apos `pull --ff-only`). Commit unico `242b2a0`, mergeada via PR para `develop`/`main`. 29 arquivos, 1466 insercoes, 57 testes verdes. Entregaveis:
  - modulo `identity` ganha submodulos `infrastructure.security` e `application.usecase`/`web.controller`/`web.dto`
  - **`UsuarioAutenticado`** record (`UserDetails`) carrega `UUID id`, `String username`, `Role role` — usado como principal pelo filtro JWT e reconhecido pelo `AuditorAwareImpl` para extrair UUID em auditoria autenticada
  - **`JwtTokenProvider`** HS256 (JJWT 0.12.x via `Jwts.builder()` / `Jwts.parser().verifyWith(key)`); secret de `app.jwt.secret` interpretado como Base64 com fallback UTF-8 (compat placeholder dev `placeholder-dev-only-min-256-bits-key-replace-in-prod-please`); minimo 256 bits validado no construtor; claims `sub` (UUID v6 canonico), `email`, `roles`, `iat`, `exp`; expiracao via `app.jwt.expiration-seconds`
  - **`JwtAuthenticationFilter`** (`OncePerRequestFilter`) le `Authorization: Bearer <token>`, valida via provider, popula `SecurityContextHolder` com `UsernamePasswordAuthenticationToken(UsuarioAutenticado, null, authorities)`. Token presente e invalido → `response.sendError(401)` e chain interrompida; sem header → segue chain sem autenticar
  - **`CustomUserDetailsService`** retorna `User.withUsername().password().authorities("ROLE_" + role)` — usado por `BadCredentialsException` flow do `AuthenticationManager`
  - **`AutenticarUsuarioUseCase`** `@Service @Transactional(readOnly = true)`: `findByUsername` → `passwordEncoder.matches` → `gerarToken` → retorna `TokenResponseDto(token, "Bearer", expirationSeconds, mapper.toResponse(usuario))`. Falha em qualquer ponto → `BadCredentialsException` (mapeada para 401 pelo handler)
  - **`AuthController`** expoe `POST /api/v1/auth/login` (publico) e `GET /api/v1/auth/me` (`@PreAuthorize("isAuthenticated()")`, `@AuthenticationPrincipal UsuarioAutenticado`). `/me` injeta `UsuarioRepository` direto em vez de criar use case (decisao tatica para evitar circular dep — refactor para `ConsultarUsuarioUseCase` fica como follow-up Sprint 4)
  - **`SecurityConfig`** ganha `@EnableMethodSecurity(prePostEnabled = true)` e `addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)`; `POST /api/v1/auth/login` em `permitAll`
  - modulo `usuarios` ganha:
    - **`UsuarioNaoEncontradoException`** (`USR-404-001`, extends `RecursoNaoEncontradoException`)
    - **`SenhaAtualIncorretaException`** (`USR-400-001`, extends `ValidacaoException`)
    - **`ConsultarUsuarioUseCase`** com regra ownership (`ADMIN` qualquer; `CLIENTE` apenas o proprio — comparacao `principal.id().equals(id)`); violacao lanca `AccessDeniedException`
    - **`ListarUsuariosUseCase`** simples (autorizacao `ROLE_ADMIN` no controller via `@PreAuthorize("hasRole('ADMIN')")`)
    - **`AlterarSenhaUseCase`** `@Transactional`: ownership check + `passwordEncoder.matches(passwordAtual)` → `passwordEncoder.encode(novaSenha)` → `usuario.alterarSenha(hash)` (dirty checking persiste)
    - **`Usuario.alterarSenha(String hash)`**: metodo de instancia recebendo apenas hash (nunca texto claro)
  - **`UsuarioController`** ganha `GET /{id}` (`@PreAuthorize("isAuthenticated()")`), `GET /` (`@PreAuthorize("hasRole('ADMIN')")`), `PATCH /{id}/senha` (`@PreAuthorize("isAuthenticated()")`); `POST` continua publico
  - **`AuditorAwareImpl`** reconhece `UsuarioAutenticado` no `Authentication.getPrincipal()` e extrai UUID via `principal.id().toString()` — auditoria persiste UUID em operacoes autenticadas e mantem `system` em publicas
  - **Hierarquia de excecoes**: `RecursoNaoEncontradoException` e `ValidacaoException` viram `non-sealed` (mesma estrategia da `ConflitoException` na Sprint 2). Sealed hierarchy de `DomainException` continua exhaustiva no switch do handler
  - **`ApiExceptionHandler` (scope-creep minimo Sprint 3, Sprint 4 evolui)**: handlers explicitos para `AccessDeniedException` → 403 e `AuthenticationException` → 401 (este ultimo cobre `BadCredentialsException` automaticamente). Sem token retorna 403 (default Spring Security 6 — Sprint 4 padroniza para 401 com `AuthenticationEntryPoint` customizado)
  - testes (18 novos + 1 ajustado): `JwtTokenProviderTest` (4: claims, principal, expirado, secret errado), `JwtAuthenticationFilterTest` (3: sem header, valido, invalido), `AutenticarUsuarioUseCaseTest` (3: ok, senha invalida, usuario inexistente), `AuthControllerTest` (3: login OK, login 401, /me OK), `ConsultarUsuarioUseCaseTest` (4: admin alheio, cliente proprio, cliente alheio 403, 404), `UsuarioControllerSecurityTest` (6 cenarios role+ownership), `AlterarSenhaUseCaseTest` (5), `UsuarioControllerSenhaTest` (5). Pattern adotado para testes de `@PreAuthorize`: `@WebMvcTest` + `@TestConfiguration static class @EnableMethodSecurity` + `@AutoConfigureMockMvc(addFilters = false)` + `SecurityContextHolder.getContext().setAuthentication(...)` em cada teste
  - **`UsuarioControllerTest` da Sprint 2** atualizado com `@MockBean` para `ConsultarUsuarioUseCase`/`ListarUsuariosUseCase`/`AlterarSenhaUseCase` (controller passou de 2 para 4 deps)
  - **Insomnia collection** atualizada (`/tmp/sep-api-insomnia.json` no ambiente local do dev): 6 folders, 35 requests cobrindo Sprint 1+2+3 com env vars `adminToken`/`clienteToken`/`adminId`/`clienteId` para reuso
  - **Auto-delete de branches**: ainda ligado no `sep-api` (`feature/sprint-2-gestao-usuarios` foi apagada apos PR #5/#6; recuperada local). Pendencia: `gh api -X PATCH repos/dynamisdigital/sep-api -f delete_branch_on_merge=false`

- **M-Sprint 1 (Tokens Notion Mobile + Showcase) concluida em 2026-05-05** no repo `sep-mobile`, branch `feature/msprint-1-tokens-notion` (originada de `develop` apos `pull --ff-only`). 4 commits locais; push/PR manuais a cargo do dev (regra de operacao git mobile). Suite local verde: `lint`, `lint:scss`, `format:check`, `test:coverage` (2 specs), `build` PWA, `e2e` (chromium mobile Pixel 5). Entregaveis materializados:
  - `src/styles/_notion-mobile-tokens.scss` (NOVO): paleta warm Notion (bg/text/border/primary/success/warning/danger), tipografia Inter (com fallback `-apple-system, BlinkMacSystemFont, ...`), font sizes mobile-first (`base: 16px` vs 14px web), espacamento 4px-base (1..16), touch targets `$notion-touch-target-min: 44px` (Apple HIG), raios discretos (sm/md/lg/pill), sombras multilayer (xs..lg), z-index, transitions curtas (120/180/240 ms), tap highlight `rgb(35 131 226 / 10%)`. Re-exporta subset como CSS custom properties `--notion-*` em `:root` para uso runtime
  - `src/styles/_notion-mobile-typography.scss` (NOVO): mixins `notion-text-base` / `notion-text-secondary` / `notion-text-caption` / `notion-heading-1..3` / `notion-button-text` / `notion-label` / `notion-mono` com `letter-spacing` Notion (-0.005 a -0.022 em)
  - `src/styles/_notion-mobile-components.scss` (NOVO): mixins para `ion-button` (variantes `primary`/`secondary`/`ghost` com `text-transform: none` e `min-height: 44px`), `ion-input`/`ion-textarea` com borda discreta + transition no focus, `ion-item`, `ion-card` (radius 12px + sombra multilayer + hover step), `ion-tab-bar` (altura 56px, peso 600 quando selecionado), `ion-toast` (variantes `toast-success`/`toast-warning`/`toast-error`), `ion-modal` (sheet 12px top corners)
  - `src/theme/variables.scss` (substitui placeholder do scaffold): `--ion-color-primary` -> azul Notion `rgb(35 131 226)`; mapeamento completo `--ion-color-secondary/success/warning/danger`, `--ion-background-color`, `--ion-text-color`, `--ion-color-step-50/100`, `--ion-toolbar-*`, `--ion-tab-bar-*`, `--ion-font-family`, `--ion-tap-highlight`. Componentes Ionic AS-IS herdam aparencia Notion sem reescrita
  - `src/global.scss` (reescrito): mantem imports padrao Ionic (core/normalize/structure/typography/display + utils + dark.system) via `@use`; aplica mixins notion-* em selectors globais (`ion-button`, `ion-input`, `ion-card`, `ion-tab-bar`, `ion-toast`, `ion-modal`); body usa `font-family/tap-highlight/background` Notion. Variantes `notion-primary`/`notion-secondary`/`notion-ghost` ativaveis por classe ou pelos atributos Ionic existentes (`color="primary"`, `color="medium"`, `fill="clear"`)
  - `src/styles/index.scss` (atualizado): `@use notion-mobile-tokens / notion-mobile-typography / notion-mobile-components / mixins`. Placeholders `_tokens.scss`, `_notion-mobile.scss`, `_ionic-overrides.scss` da M-Sprint 0 removidos
  - rota lazy `/design-system` em `app.routes.ts` apontando para `features/design-system/design-system.routes.ts` (`DESIGN_SYSTEM_ROUTES`); shell `ShowcaseComponent` com `ion-tabs` + 4 `ion-tab-button` (cores/tipografia/componentes/navegacao); paginas standalone `ColorsComponent` (8 swatches 44x44pt), `TypographyComponent` (consome mixins via `typography.component.scss`), `ComponentsComponent` (botoes 3-variantes + inputs floating + card + 2 toasts), `NavigationComponent` (descricao tabs/pilha)
  - **Capacitor 8 confirmado** (M-Sprint 0 ja havia subido de 6 para 8.3.1; step file 201 mencionava 6 — texto desatualizado, sem impacto pratico)
  - **Desvio: smoke test do `ShowcaseComponent` simplificado** para `expect(ShowcaseComponent).toBeDefined()`. Step file 201.3.5 propunha `render(ShowcaseComponent, ...)` via `@testing-library/angular`, mas Ionic web components disparam `connectedCallback` no DOM montado e `CSSStyleSheet.replaceSync` quebra em happy-dom (`TypeError: Cannot read properties of undefined (reading 'replace')` em `node_modules/@ionic/core/components/p-BJoMtgfR.js`). Padrao adotado e o mesmo do `app.component.spec.ts` (M-Sprint 0): valida classe definida sem montar template. Cobertura visual fica com `npm run start` + DevTools mobile viewport
  - **Conflito Prettier <-> Stylelint** em `$notion-font-family-mono`: lista longa wrappa em multilinha pelo Prettier, e `scss/dollar-variable-colon-space-after` espera valor single-line. Resolvido encurtando para 4 entradas (`'JetBrains Mono', 'Fira Code', sfmono-regular, monospace`). `$notion-font-family` mantida com lista mais longa (cabe em multilinha + colon na propria linha). Sem `// stylelint-disable`
  - warning de budget Angular (2.36 kB vs 2 kB) em `pages/typography.component.scss` — apenas warning, build verde. Erro so em > 4 kB
  - playwright-chromium baixado uma vez (`npx playwright install chromium`) — cache fica em `~/.cache/ms-playwright/chromium_headless_shell-1217`
  - `chore(mobile): desabilitar analytics do Angular CLI` adiciona `cli.analytics: false` em `angular.json` (commit separado dos 3 commits da sprint, evita prompts do CLI em CI/automatizacao)

- **Sprint 4 (Estabilizacao + Docs + Cobertura + Webhook Receiver) implementada em 2026-05-06** no repo `sep-api`, branch `feature/sprint-4-erros-docs-testes` (originada de `develop` apos `pull --ff-only`). Working tree pronto, **push/PR manuais a cargo do dev**; aguardando merge em `develop`/`main`. Suite local verde: `./gradlew clean test jacocoTestReport jacocoTestCoverageVerification` + `./gradlew check` (Spotless + JaCoCo gate 70%). Postgres local via Docker Compose. Entregaveis materializados:
  - **Task 4.1 — `ApiExceptionHandler` consolidado + security handlers JSON**:
    - `ApiExceptionHandler` reescrito (sem stub Sprint 1): traceId via `CorrelationIdFilter.MDC_KEY` (constante centralizada, nao mais string magica `"correlationId"`); mensagem amigavel para `username` duplicado em `DataIntegrityViolationException` quando causa contem `usuario_username_key` ou `username`; switch exhaustivo na sealed `DomainException` (BAD_REQUEST/NOT_FOUND/CONFLICT); fallback `Exception` -> 500 com `"Erro interno. Consulte o suporte com o traceId."` + log completo no servidor (sem stacktrace no response)
    - `ApiAuthenticationEntryPoint` em `identity/infrastructure/security/`: serializa `ErrorResponseDto` JSON com 401 quando rota protegida e acessada sem token; substitui o 403 default do Spring Security 6
    - `ApiAccessDeniedHandler` em `identity/infrastructure/security/`: serializa `ErrorResponseDto` JSON com 403 quando autenticado mas sem permissao
    - `SecurityConfig` recebe ambos via `.exceptionHandling(...)` + libera `POST /api/v1/webhooks/**` em `permitAll()` (autenticacao por HMAC, nao JWT)
    - Testes: `ApiExceptionHandlerCompletoTest` (8 cenarios), `ApiAuthenticationEntryPointTest` (1 cenario com `MockHttpServletRequest`/`MockHttpServletResponse`), `ApiAccessDeniedHandlerTest` (1 cenario)
  - **Task 4.2 — Springdoc OpenAPI + Swagger UI**:
    - `OpenApiConfig` em `shared/config/`: bean `OpenAPI` com `Info(title="SEP API", version="0.0.1")`, `SecurityScheme bearerAuth` (HTTP/bearer/JWT) + `SecurityRequirement` global (botao "Authorize" na Swagger UI; rotas publicas continuam liberadas no `SecurityConfig`)
    - `AuthController` ganha `@Tag(name="auth")` + `@Operation` + `@ApiResponses` em `/login` (200/400/401) e `/me` (200/401)
    - `UsuarioController` ganha `@Tag(name="usuarios")` + `@Operation` + `@ApiResponses` em criar (201/400/409), buscar (200/401/403/404), listar (200/401/403), alterar senha (204/400/401/403/404)
    - `@Schema` em todos DTOs (`UsuarioCreateDto`, `UsuarioResponseDto`, `UsuarioSenhaUpdateDto`, `LoginRequestDto`, `TokenResponseDto`, `ErrorResponseDto`) com exemplos coerentes ao PRD §21 (UUID v6 canonico, ISO-8601 com offset, roles `ADMIN`/`CLIENTE`)
    - Springdoc 2.8.13 mantido (compat Spring Boot 3.5; ver feedback memoria); `application.yml` ja tinha `springdoc.api-docs.enabled` + `swagger-ui.path` + sorters
    - Teste: `OpenApiConfigTest` `@SpringBootTest @ActiveProfiles("dev")` — `GET /v3/api-docs` 200, valida `bearerAuth.scheme=bearer/bearerFormat=JWT`, todos os 5 paths e 5 schemas
  - **Task 4.3 — JaCoCo gate + smoke E2E**:
    - `build.gradle`: `jacocoTestCoverageVerification` `enabled = true`, regra `LINE COVEREDRATIO >= 0.70`, `check.dependsOn 'jacocoTestCoverageVerification'`. Exclusoes mantidas (`SepApiApplication`, `config/`, `dto/`, `*MapperImpl`, `package-info`, `exception/*Exception`)
    - `SmokeE2ETest` em `src/test/java/com/dynamis/sep_api/`: `@SpringBootTest(webEnvironment=RANDOM_PORT) @ActiveProfiles("dev")` + RestAssured; usernames unicos com `UUID.randomUUID().substring(0,8)` no local-part; cobre fluxo completo: criar admin/cliente -> 201 / login admin/cliente -> 200 / `/auth/me` admin -> 200 / GET `/usuarios` admin -> 200 / GET `/usuarios` cliente -> 403 / PATCH senha proprio cliente -> 204 / PATCH senha admin com cliente -> 403
    - **Erratum spec 004**: spec original pede smoke E2E com Testcontainers; mantido Postgres local via Docker Compose pelo mesmo motivo da Sprint 1 (Docker Engine 28+ vs `docker-java` em TC 1.21). Migracao Testcontainers continua follow-up cross-sprint
    - Cobertura medida: ~81% LINE no escopo apos exclusoes — gate 70% passa sem necessidade de complementar testes
  - **Task 4.4 — Webhook Receiver Pattern**:
    - Migration `V3__criar_webhook_event_log.sql`: tabela `webhook_event_log` (id uuid PK, provider, event, idempotency_key UNIQUE, signature, payload jsonb NOT NULL, status com check `PENDENTE|PROCESSADO|FALHOU`, erro, data_recebimento, data_processamento + 4 colunas auditoria); indices `(provider, event)` e `(status, data_recebimento DESC)`
    - `WebhookEventLog` (entity em `shared/domain/model/`): `extends EntidadeAuditavel`, UUID v6 via `Generators.timeBasedReorderedGenerator()`, factory `registrar(...)` cria evento `PENDENTE`, payload mapeado com `@JdbcTypeCode(SqlTypes.JSON)` + `columnDefinition="jsonb"`
    - `WebhookEventStatus` enum (PENDENTE/PROCESSADO/FALHOU); Sprint 4 grava apenas PENDENTE
    - `WebhookEventLogRepository` (`JpaRepository`) com `existsByIdempotencyKey` + `findByIdempotencyKey`
    - `WebhookEnvelopeDto` (record com `provider`, `event`, `idempotencyKey`, `payload`) — uso documental
    - Porta `WebhookSignatureValidator` em `shared/application/port/out/`
    - Adapter `HmacSignatureValidator` em `shared/infrastructure/adapter/`: `@Component @ConfigurationProperties(prefix="app.webhooks")`, mapa `secrets` por provider, algoritmo HmacSHA256, hex hexadecimal lowercase, `MessageDigest.isEqual` para comparacao constant-time, provider sem secret -> false + log warn (sem expor secret), hex malformado -> false
    - `application.yml` adiciona `app.webhooks.secrets.celcoin: ${APP_WEBHOOK_SECRET_CELCOIN:dev-webhook-secret-change-me}`
    - `RegistrarWebhookEventUseCase` `@Service @Transactional`: valida obrigatorios -> `ValidacaoException(WHK-400-001)`, `existsByIdempotencyKey` -> `false`, `WebhookEventLog.registrar(...)` -> `repository.save`; `DataIntegrityViolationException` por corrida concorrente tratada como duplicado (`return false`); contrato boolean (`true` evento gravado, `false` duplicado idempotente)
    - `WebhookController` em `shared/web/controller/`: `POST /api/v1/webhooks/{provider}/{event}` consumes `application/json`, body bruto como `String`, headers obrigatorios `Idempotency-Key` + `X-Webhook-Signature` (`required=false` no @RequestHeader + check manual -> `ValidacaoException(WHK-400-002)` para mensagem amigavel em vez de `MissingRequestHeaderException`); assinatura invalida -> `BadCredentialsException` -> 401; sucesso -> 202 Accepted (novo OU duplicado idempotente); anotado com `@Tag(name="webhooks")` + `@Operation` + `@ApiResponses(202/400/401)`
    - Testes: `HmacSignatureValidatorTest` (5 cenarios: HMAC valido, invalido, provider sem secret, hex malformado, nulls); `RegistrarWebhookEventUseCaseTest` (4 cenarios: novo, duplicado, corrida concorrente, validacoes obrigatorias); `WebhookControllerTest` (5 cenarios: novo 202, duplicado 202, sem Idempotency-Key 400, sem signature 400, assinatura invalida 401) com `@WebMvcTest` + `@AutoConfigureMockMvc(addFilters=false)` + `@Import(ApiExceptionHandler.class)` + `@MockBean` de `JwtAuthenticationFilter`/`JwtTokenProvider`/`ApiAuthenticationEntryPoint`/`ApiAccessDeniedHandler` para evitar carga de `SecurityConfig` real
  - **Pendencia documental Sprint 4**: refactor de `AuthController.me()` consumindo `ConsultarUsuarioUseCase` (ao inves de injetar `UsuarioRepository` direto) ainda nao foi feito — pode entrar em commit pequeno antes do PR ou ficar como follow-up Epic 4 estendida (Sprint 5 hardening). Decisao do dev no momento do push.

- **Incidente operacional 2026-05-06 — Sprint 4 perdida no merge dos PRs #10/#11**: ao revisar o repo recem-clonado, descobrimos que os PRs `#10` (em `main`) e `#11` (em `develop`) foram squash-mergeados com titulo `Feature/sprint 4 erros docs testes` mas **conteudo somente da Sprint 2** (provavelmente squash do conteudo errado durante o merge GitHub UI, ou branch source resetada antes do merge). A branch remota `origin/feature/sprint-4-erros-docs-testes` continha apenas dois commits de tweak de CI (`ci(backend): rodar workflow em push de feature`, `ci(backend): separar testes e build no workflow`) + merge de `main`, sem nenhum dos arquivos Sprint 4. Diagnostico via `git ls-tree -r origin/main --name-only | grep -E "(WebhookController|OpenApiConfig|ApiAuthenticationEntryPoint|V3__criar_webhook)"` retornou vazio. **Acao corretiva**: Sprint 4 foi reimplementada localmente em 2026-05-06 sobre a propria branch `feature/sprint-4-erros-docs-testes` (mantendo os tweaks de CI ja existentes). `./gradlew check` verde apos reimplementacao. **Push e novo PR pendentes a cargo do dev** — para nao repetir o incidente: (1) verificar diff do PR no GitHub ANTES do merge, conferindo presenca dos arquivos Sprint 4; (2) apos merge, validar `git ls-tree -r origin/main` ou `git log --stat origin/main -1`; (3) desligar `delete_branch_on_merge` do `sep-api` via `gh api -X PATCH repos/dynamisdigital/sep-api -f delete_branch_on_merge=false` (a branch source apagada apos squash merge dificulta forensics quando o merge sai errado).

## Proximo passo mais natural

Com Sprint 0/F-Sprint 0/M-Sprint 0 (2026-05-04), Sprints 1, 2, 3 e 4 backend + M-Sprint 1 mobile (2026-05-05/2026-05-06) concluidas, os proximos passos provaveis sao:
- desligar setting `delete_branch_on_merge` do `sep-api` (e checar/desligar `sep-app`/`sep-mobile`) para evitar repeticao do incidente de branches apagadas
- usuario abrir o PR da branch `feature/sprint-4-erros-docs-testes` no `sep-api` apos revisao local; merge fecha Epic 4 e a fundacao backend
- usuario abrir o PR da branch `feature/msprint-1-tokens-notion` no `sep-mobile` (push e PR sao manuais por design); apos merge em `develop`, branch local permanece como historico ate decisao manual
- iniciar F-Sprint 2 (telas Apple publicas) consumindo contratos reais de `POST /api/v1/usuarios` (MSW so para erros): spec [`specs/fase-1/102-fsprint-2-telas-apple-publicas.md`](../specs/fase-1/102-fsprint-2-telas-apple-publicas.md), steps a criar
- iniciar M-Sprint 2 (telas publicas mobile) consumindo os tokens/mixins/CSS vars Notion ja entregues pela M-Sprint 1: spec [`specs/fase-1/202-msprint-2-telas-publicas-mobile.md`](../specs/fase-1/202-msprint-2-telas-publicas-mobile.md), steps a criar
- iniciar F-Sprint 3 (shell Notion + auth web) consumindo `POST /auth/login` + `GET /auth/me` ja entregues: spec [`specs/fase-1/103-fsprint-3-shell-notion-auth.md`](../specs/fase-1/103-fsprint-3-shell-notion-auth.md), steps a criar
- iniciar M-Sprint 3 (shell + auth mobile) com Capacitor Preferences guardando token: spec [`specs/fase-1/203-msprint-3-shell-mobile-auth.md`](../specs/fase-1/203-msprint-3-shell-mobile-auth.md), steps a criar
- com Sprint 4 mergeada, gate minimo da fase AWS (Sprint 3 / Epic 3) ja esta vencido; usuario pode optar por iniciar trilha AWS em paralelo as F-Sprints/M-Sprints, dado que erros, OpenAPI e cobertura ja estao estabilizados (ver PRD §12 "gate recomendado: iniciar apos Sprint 4")
- planejamento da Fase 2 (Sprints 5-14) ja existe em specs/fase-2 e pode comecar pela Sprint 5 (Endurecimento de Seguranca / gate Fase 2) assim que as F-Sprints/M-Sprints 2-4 estabilizem o consumo dos contratos atuais
- migracao para Testcontainers continua como follow-up cross-sprint (issue Docker Engine 28+ precisa estabilizar) — agora atinge `SmokeBootTest`, `UsuarioRepositoryTest`, `OpenApiConfigTest` e `SmokeE2ETest`
- refactor de `AuthController.me()` consumindo `ConsultarUsuarioUseCase` (atualmente injeta `UsuarioRepository` direto) — pode entrar como ajuste pequeno ou follow-up Sprint 5
- detalhar a epic de Pix em artefatos proprios agora que a fundacao backend esta concluida (Sprint 4 entregou Webhook Receiver Pattern + Outbox stub)

## Observacao importante para outro agente

Se outro agente assumir este trabalho, ele deve:
- ler primeiro o [PRD.md](C:\workspace-sep\docs-sep\PRD.md)
- usar este `CONTEXT.md` para entender a historia das decisoes
- respeitar que a implementacao ainda nao foi autorizada por completo nesta etapa documental
- evitar gerar automaticamente todos os specs/plans sem confirmacao do usuario
