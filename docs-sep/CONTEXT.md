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
12. Frontend SEP
13. Movimentacao Pix
14. Infraestrutura futura

Foi decidido explicitamente que `Analise de credito` e mais urgente que `Pix`, e que os topicos que impactam diretamente a contratacao devem vir antes dos topicos financeiros expandidos.

Com isso, o entendimento correto do PRD passa a ser:
- entrega inicial: fundacao tecnica da API
- produto futuro priorizado: onboarding, analise de credito, formalizacao e cobranca
- capacidades operacionais e de jornada posteriores: backoffice, jornada da credora e administracao/governanca
- capacidades expandidas posteriores: frontend completo, Pix e infraestrutura remota

Tambem foi adicionada ao PRD uma secao de `Fronteiras entre epicos`, para reduzir duplicidade entre capacidades de dominio, jornadas, operacao interna, governanca e meios de movimentacao financeira.

## Stack e arquitetura definidos

As seguintes decisoes foram tomadas:

### Frontend
- Angular com versao ajustavel conforme compatibilidade do template adotado
- Standalone Components
- Signals
- Bootstrap
- existe um prototipo visual em Angular + Bootstrap que deve ser reaproveitado como base
- foi explicitamente aceito que pode haver downgrade de versao do Angular se isso facilitar a absorcao do template

### Backend
- Java 21
- Spring Boot
- Gradle
- backend em papel de BFF
- identificadores com `UUID`
- biblioteca definida para geracao de UUID:
  - `implementation 'com.fasterxml.uuid:java-uuid-generator:5.1.0'`
- migrations versionadas com `Flyway`
- documentacao OpenAPI com `Springdoc`
- senhas com hash `BCrypt`
- endpoint de healthcheck com `Spring Boot Actuator`
- configuracao de `CORS` ja prevista para integracao futura com Angular
- preferencia por `UUID v6`
- JWT sem refresh token na fase inicial
- claims minimas do JWT:
  - `sub`
  - `email`
  - `roles`
- `sub` do JWT deve carregar o UUID do usuario
- auditoria deve persistir preferencialmente o UUID do usuario autenticado
- fallback tecnico de auditoria quando nao houver autenticacao, como `system`
- tabelas e colunas devem permanecer em portugues
- sem soft delete na fase inicial
- estrutura inicial de pacotes do Spring Boot ja definida no PRD
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
- monolito modular
- sem microservicos na fase inicial

## Ambiente e infraestrutura

Foi decidido que:
- nesta fase inicial, apenas o ambiente `develop` sera implementado localmente
- futuramente o projeto tera `develop`, `homologacao` e `producao`
- cada ambiente deve ter sua propria instancia PostgreSQL
- no futuro:
  - `develop` e `homologacao` ficarao em uma VPS
  - `producao` ficara em uma VPS separada

Tambem foi definido que, na fase de infraestrutura:
- o deploy sera por branch/ambiente
- os secrets serao separados por ambiente no GitHub
- migrations serao versionadas
- seeds serao separados por ambiente

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
- ModelMapper obrigatorio
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
- CI/CD, GitHub Actions, deploy e VPS serao tratados em uma fase separada de infraestrutura

## Situacao atual

No estado atual:
- os materiais de pesquisa estao organizados em `docs-sep`
- o PRD inicial ja foi criado e revisado
- o contexto consolidado desta conversa esta neste arquivo
- o projeto ainda esta em fase de definicao documental e organizacao
- a implementacao completa ainda nao comecou
- o template visual do frontend ja foi identificado e incorporado como referencia de produto
- ficou registrado que a versao do Angular do frontend pode ser reduzida, se necessario, para aderir ao template com menor risco
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
- Pix foi reposicionado para depois dos blocos que impactam diretamente a contratacao do emprestimo

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
