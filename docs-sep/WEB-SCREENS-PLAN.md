# Plano de Telas Web - SEP

## 1. Objetivo

Planejar as telas do app web SEP a partir das funcionalidades previstas no PRD e dos endpoints da API. O objetivo e evitar telas desconectadas dos contratos reais do backend, permitindo que frontend e backend evoluam de forma coordenada.

Este documento nao substitui o PRD. Ele detalha a camada de experiencia web e deve ser revisado sempre que novos endpoints forem especificados.

## 2. Diretrizes Gerais

- O app web sera a interface principal para todas as jornadas da SEP.
- O app web deve cobrir tomador, empresa credora, financeiro interno, backoffice operacional e administracao.
- O mobile tera escopo menor e nao deve incluir financeiro interno, backoffice completo nem administracao.
- O web deve consumir a mesma API publica usada pelo mobile, sem backend separado nesta fase.
- O web nao deve conter regra de negocio de dominio; decisoes, status e permissoes devem vir da API.
- As telas devem ser planejadas por modulo funcional, alinhadas ao monolito modular DDD do backend.
- O template Datta Able Angular sera a base visual inicial do app web.
- As telas devem prever estados de carregamento, erro, vazio, sucesso e acesso negado.

## 3. Perfis de Acesso

### Visitante

Usuario nao autenticado.

Pode acessar:
- landing publica
- login
- cadastro publico de usuario
- paginas publicas futuras, se existirem

### Cliente / Tomador

Usuario autenticado que solicita emprestimo.

Pode acessar:
- dashboard do tomador
- meu perfil
- alteracao de senha
- onboarding de pessoa/tomador
- solicitacao de emprestimo
- acompanhamento de proposta
- status de analise de credito
- formalizacao
- parcelas e cobranca
- comprovantes e historico futuro

### Empresa Credora

Usuario autenticado vinculado a empresa que aporta recursos.

Pode acessar:
- dashboard da empresa credora
- perfil da empresa
- onboarding KYB
- oportunidades futuras
- operacoes financiadas
- carteira e status das operacoes

### Financeiro Interno

Usuario interno responsavel por operacao financeira e acompanhamento.

Pode acessar:
- dashboard financeiro
- fila operacional financeira
- analise de pendencias
- acompanhamento de cobranca
- conciliacao futura
- Pix futuro assistido
- excecoes e reprocessos

### Administrador

Usuario com permissao administrativa.

Pode acessar:
- dashboard administrativo
- gestao de usuarios
- detalhe de usuario
- perfis e acessos futuros
- parametros do sistema
- auditoria administrativa futura

## 4. Mapa Inicial de Telas por Fase

### Fase 1 - Fundacao Web Minima

Baseada na fundacao visual do web e nos endpoints iniciais de autenticacao e usuarios.

Telas:
- Landing page
- Login
- Cadastro de usuario
- Shell autenticado
- Dashboard administrativa inicial (casca)
- Meu perfil
- Alterar senha
- Administracao de usuarios
- Detalhe de usuario
- Acesso negado
- Pagina nao encontrada

### Fase 2 - Jornada do Tomador

Baseada nos modulos futuros de onboarding, credito, contratos e cobranca.

Telas:
- Onboarding do tomador
- Upload e acompanhamento de documentos
- Solicitacao de emprestimo
- Acompanhamento da proposta
- Status da analise de credito
- Formalizacao e aceite
- Minhas parcelas
- Historico da operacao

### Fase 3 - Backoffice, Financeiro e Administracao

Baseada nos modulos de backoffice, financeiro e administracao.

Telas:
- Dashboard operacional
- Fila de propostas
- Detalhe operacional da proposta
- Mesa de analise de credito
- Painel de formalizacao
- Painel de cobranca
- Painel financeiro
- Gestao de usuarios avancada
- Parametros e cadastros mestres
- Auditoria e trilha de eventos

### Fase 4 - Empresa Credora

Baseada no modulo futuro de credores.

Telas:
- Dashboard da empresa credora
- Onboarding KYB da credora
- Perfil da empresa
- Oportunidades
- Operacoes financiadas
- Carteira
- Detalhe da operacao financiada

### Fase 5 - Pix Futuro

Baseada na epic futura de movimentacao Pix.

Telas:
- Painel Pix operacional
- Desembolso Pix assistido
- Recebimentos Pix
- Conciliacao Pix
- Eventos e webhooks Pix
- Excecoes Pix

## 5. Telas Detalhadas - Fase 1

### 5.1 Landing Page

Objetivo:
- Apresentar publicamente a SEP, comunicar proposta de valor e direcionar visitantes para login ou cadastro.

Perfil:
- visitante

Endpoints:
- nenhum obrigatorio na primeira versao

Elementos:
- hero institucional
- resumo da proposta SEP
- chamada para tomador de emprestimo
- chamada para empresa credora
- beneficios principais
- secao de seguranca/confianca
- links para login e cadastro

Comportamentos:
- permitir navegacao sem autenticacao
- direcionar para login
- direcionar para cadastro publico, se habilitado
- manter estrutura visual alinhada ao template/base de marca do projeto

Dependencia:
- base do web criada
- estrutura inicial de rotas e pacotes do frontend

Observacoes:
- Esta sera a primeira tela visual implementada apos a base tecnica do web.
- Pode ser implementada antes dos endpoints de autenticacao, pois nao depende da API.
- Deve ser tratada como landing inicial de produto, nao como dashboard nem area logada.

### 5.2 Login

Objetivo:
- Autenticar o usuario por e-mail e senha.

Perfil:
- visitante

Endpoint:
- `POST /api/v1/auth/login`

Campos:
- e-mail
- senha

Comportamentos:
- validar campos obrigatorios
- exibir erro de credenciais invalidas
- armazenar token JWT conforme estrategia do frontend
- redirecionar para dashboard conforme perfil

Dependencia:
- Sprint 3 concluida

Observacoes:
- A tela pode ser desenhada antes da Sprint 3, mas so sera funcional apos o endpoint de login estar pronto.

### 5.3 Cadastro de Usuario

Objetivo:
- Permitir cadastro publico de usuario na fase inicial.

Perfil:
- visitante

Endpoint:
- `POST /api/v1/usuarios`

Campos:
- e-mail
- senha com exatamente 6 caracteres
- perfil, se permitido nesta fase

Comportamentos:
- validar formato de e-mail
- validar senha com exatamente 6 caracteres
- exibir erro para e-mail duplicado
- apos sucesso, direcionar para login ou entrar no fluxo definido pelo produto

Dependencia:
- Sprint 2 concluida

Observacoes:
- Como cadastro publico de admin pode representar risco em producao, essa regra deve ser revisada antes de ambientes remotos reais.

### 5.4 Shell Autenticado

Objetivo:
- Fornecer a estrutura base da aplicacao logada.

Perfil:
- todos os perfis autenticados

Endpoint:
- `GET /api/v1/auth/me`

Elementos:
- menu lateral
- topo com usuario logado
- area de conteudo
- logout local
- controle de rotas por perfil

Comportamentos:
- carregar usuario autenticado
- montar menu conforme perfil
- esconder itens sem permissao
- redirecionar token ausente ou invalido para login

Dependencia:
- Sprint 3 concluida

Observacoes:
- Deve reaproveitar shell, navegacao e componentes do template Datta Able Angular.

### 5.5 Dashboard Administrativa Inicial (Casca)

Objetivo:
- Exibir a primeira tela logada do administrador em formato de casca, validando layout, menu, cards e navegacao base sem depender ainda de todas as regras de negocio.

Perfil:
- administrador

Endpoints:
- `GET /api/v1/auth/me`

Conteudo inicial:
- saudacao
- perfil atual
- atalhos principais
- cards visuais placeholder
- area de indicadores mockados ou vazios
- menu administrativo base

Dependencia:
- Sprint 3 concluida para versao minima
- base visual web, landing, login e cadastro implementados

Observacoes:
- Esta dashboard nao deve tentar implementar o backoffice real ainda.
- Indicadores reais entram apenas quando os endpoints correspondentes existirem.
- Depois desta casca administrativa, dashboards especificos de tomador, credora e financeiro podem evoluir conforme as jornadas forem especificadas.

### 5.6 Meu Perfil

Objetivo:
- Mostrar os dados do usuario autenticado.

Perfil:
- usuarios autenticados

Endpoints:
- `GET /api/v1/auth/me`
- `GET /api/v1/usuarios/{id}`

Campos exibidos:
- id
- e-mail
- perfil
- data de criacao
- data de modificacao

Comportamentos:
- cliente ve apenas o proprio perfil
- admin pode navegar para detalhe de outros usuarios pela area administrativa

Dependencia:
- Sprint 3 concluida

### 5.7 Alterar Senha

Objetivo:
- Permitir que o usuario autenticado altere sua propria senha.

Perfil:
- usuarios autenticados

Endpoint:
- `PATCH /api/v1/usuarios/{id}/senha`

Campos:
- senha atual
- nova senha com exatamente 6 caracteres
- confirmacao da nova senha no frontend

Comportamentos:
- validar nova senha com exatamente 6 caracteres
- validar confirmacao localmente
- exibir erro se senha atual estiver incorreta
- apos sucesso, exibir confirmacao

Dependencia:
- Sprint 3 concluida

Observacoes:
- A confirmacao de senha e validacao de UX; a regra real continua no backend.

### 5.8 Administracao de Usuarios

Objetivo:
- Permitir que o administrador liste usuarios.

Perfil:
- administrador

Endpoint:
- `GET /api/v1/usuarios`

Elementos:
- tabela de usuarios
- filtro local simples por e-mail, se viavel
- acesso ao detalhe

Campos exibidos:
- id
- e-mail
- perfil
- data de criacao
- data de modificacao

Comportamentos:
- bloquear acesso para cliente
- exibir estado vazio quando nao houver registros
- exibir erro padronizado quando API retornar falha

Dependencia:
- Sprint 3 concluida

Observacoes:
- Paginacao e filtros server-side devem entrar apenas quando endpoints suportarem.

### 5.9 Detalhe de Usuario

Objetivo:
- Exibir detalhes de um usuario respeitando permissoes.

Perfil:
- administrador
- cliente somente para o proprio usuario

Endpoint:
- `GET /api/v1/usuarios/{id}`

Campos exibidos:
- id
- e-mail
- perfil
- auditoria basica

Comportamentos:
- admin consulta qualquer usuario
- cliente consulta apenas o proprio
- acesso indevido deve exibir erro de permissao

Dependencia:
- Sprint 3 concluida

## 6. Telas Futuras por Modulo

### 6.1 Onboarding

Modulo backend:
- `onboarding`

Telas web previstas:
- Onboarding do tomador
- Onboarding da empresa credora
- Documentos enviados
- Pendencias cadastrais
- Revisao operacional de KYC/KYB

Perfis:
- tomador
- empresa credora
- financeiro interno
- backoffice

Dependencias:
- APIs de cadastro complementar
- APIs de documentos
- status de validacao cadastral

Observacoes:
- Deve ser uma das primeiras jornadas apos a fundacao da API, pois impacta diretamente a contratacao.

### 6.2 Credito

Modulo backend:
- `credito`

Telas web previstas:
- Solicitar emprestimo
- Simular ou informar proposta
- Acompanhamento da proposta
- Mesa de analise de credito
- Parecer de credito
- Historico de decisoes

Perfis:
- tomador
- financeiro interno
- backoffice

Dependencias:
- APIs de proposta
- APIs de analise
- status de elegibilidade
- regras de decisao e auditoria

Observacoes:
- Analise de credito tem prioridade maior que Pix porque impacta diretamente a jornada de contratacao.

### 6.3 Contratos

Modulo backend:
- `contratos`

Telas web previstas:
- Formalizacao da proposta
- Visualizacao de contrato
- Aceite do tomador
- Status de assinatura
- Pendencias de formalizacao

Perfis:
- tomador
- financeiro interno
- backoffice

Dependencias:
- APIs de contrato
- APIs de aceite
- status de formalizacao

Observacoes:
- A tela deve bloquear avancos quando a API indicar que a formalizacao nao esta concluida.

### 6.4 Cobranca

Modulo backend:
- `cobranca`

Telas web previstas:
- Minhas parcelas
- Detalhe da parcela
- Status de pagamento
- Painel de cobranca operacional
- Inadimplencia
- Historico de recebimentos

Perfis:
- tomador
- financeiro interno
- backoffice

Dependencias:
- APIs de parcelas
- APIs de agenda de cobranca
- APIs de status de pagamento

Observacoes:
- Meio de pagamento e conciliacao Pix nao devem ser confundidos com a regra de cobranca.

### 6.5 Backoffice

Modulo backend:
- `backoffice`

Telas web previstas:
- Dashboard operacional
- Fila de propostas
- Fila de pendencias
- Detalhe operacional da proposta
- Comentarios internos
- Reprocessos e excecoes

Perfis:
- financeiro interno
- administrador
- usuarios internos autorizados

Dependencias:
- APIs de fila
- APIs de comentarios
- APIs de pendencias
- APIs de status operacional

Observacoes:
- Backoffice organiza operacao assistida, mas nao deve duplicar regras de onboarding, credito, contratos ou cobranca.

### 6.6 Financeiro

Modulo backend:
- `financeiro`

Telas web previstas:
- Dashboard financeiro
- Conciliacao operacional
- Pendencias financeiras
- Visao de recebimentos
- Visao de desembolsos
- Relatorios operacionais futuros

Perfis:
- financeiro interno
- administrador

Dependencias:
- APIs financeiras internas
- APIs de conciliacao
- APIs de eventos financeiros

Observacoes:
- O financeiro interno existe apenas no app web nesta fase.

### 6.7 Credores

Modulo backend:
- `credores`

Telas web previstas:
- Dashboard da empresa credora
- Perfil da empresa
- Onboarding KYB da empresa
- Oportunidades
- Operacoes financiadas
- Carteira
- Detalhe da operacao financiada

Perfis:
- empresa credora
- backoffice
- administrador

Dependencias:
- APIs de empresa credora
- APIs de carteira
- APIs de oportunidades
- APIs de operacoes financiadas

Observacoes:
- A experiencia da empresa credora tambem existira no mobile, mas de forma simplificada.

### 6.8 Administracao e Governanca

Modulo backend:
- `identity`
- `usuarios`
- `backoffice`
- `shared`

Telas web previstas:
- Gestao de usuarios
- Perfis e permissoes futuras
- Parametros do sistema
- Cadastros mestres
- Auditoria administrativa
- Logs e eventos operacionais futuros

Perfis:
- administrador

Dependencias:
- RBAC evoluido
- APIs administrativas
- APIs de auditoria

Observacoes:
- A fase inicial tera apenas administracao basica de usuarios.

### 6.9 Pix Futuro

Modulo backend:
- `pix`

Telas web previstas:
- Painel Pix operacional
- Iniciar desembolso Pix assistido
- Consultar status de transacao Pix
- Recebimentos Pix
- Conciliacao Pix
- Eventos webhook
- Excecoes e reprocessos Pix

Perfis:
- financeiro interno
- administrador

Dependencias:
- API de desembolso Pix
- API de recebimento Pix
- API de webhooks
- API de conciliacao
- idempotencia
- auditoria reforcada

Observacoes:
- Pix deve ficar depois de onboarding, credito, formalizacao e cobranca inicial.

## 7. Navegacao Inicial Sugerida

### Menu para Cliente / Tomador

- Inicio
- Meu perfil
- Alterar senha
- Onboarding
- Solicitar emprestimo
- Minhas propostas
- Contratos
- Parcelas

### Menu para Empresa Credora

- Inicio
- Perfil da empresa
- Onboarding da empresa
- Oportunidades
- Operacoes financiadas
- Carteira

### Menu para Financeiro Interno

- Inicio financeiro
- Fila operacional
- Propostas
- Analise de credito
- Formalizacao
- Cobranca
- Conciliacao
- Pix futuro

### Menu para Administrador

- Inicio administrativo
- Usuarios
- Perfis e acessos
- Parametros
- Cadastros mestres
- Auditoria

## 8. Ordem Recomendada de Implementacao Web

1. Estrutura base do web, pacotes, rotas e absorcao inicial do template Datta Able
2. Landing page publica
3. Login
4. Cadastro de usuario / register
5. Guardas de rota e carregamento de `/auth/me`
6. Dashboard administrativa inicial (casca)
7. Shell autenticado completo
8. Meu perfil
9. Alterar senha
10. Administracao de usuarios
11. Detalhe de usuario
12. Telas placeholder controladas para jornadas futuras
13. Onboarding do tomador
14. Solicitacao e acompanhamento de emprestimo
15. Analise de credito interna
16. Formalizacao
17. Cobranca
18. Backoffice operacional
19. Empresa credora
20. Financeiro expandido
21. Pix futuro

## 9. Matriz Tela x Endpoint

| Tela | Endpoint atual/futuro | Status |
| --- | --- | --- |
| Landing page | nenhum obrigatorio | primeira tela visual apos base web |
| Login | `POST /api/v1/auth/login` | planejado Sprint 3 |
| Cadastro de usuario | `POST /api/v1/usuarios` | planejado Sprint 2 |
| Shell autenticado | `GET /api/v1/auth/me` | planejado Sprint 3 |
| Dashboard administrativa inicial (casca) | `GET /api/v1/auth/me` | planejado Sprint 3 |
| Meu perfil | `GET /api/v1/auth/me`, `GET /api/v1/usuarios/{id}` | planejado Sprint 3 |
| Alterar senha | `PATCH /api/v1/usuarios/{id}/senha` | planejado Sprint 3 |
| Administracao de usuarios | `GET /api/v1/usuarios` | planejado Sprint 3 |
| Detalhe de usuario | `GET /api/v1/usuarios/{id}` | planejado Sprint 3 |
| Onboarding tomador | APIs futuras de `onboarding` | futuro |
| Solicitar emprestimo | APIs futuras de `credito` | futuro |
| Acompanhar proposta | APIs futuras de `credito` | futuro |
| Analise de credito interna | APIs futuras de `credito` e `backoffice` | futuro |
| Formalizacao | APIs futuras de `contratos` | futuro |
| Parcelas e cobranca | APIs futuras de `cobranca` | futuro |
| Dashboard financeiro | APIs futuras de `financeiro` | futuro |
| Empresa credora | APIs futuras de `credores` | futuro |
| Pix operacional | APIs futuras de `pix` | futuro |

## 10. Criterios de Pronto para Planejamento de uma Tela

Antes de implementar uma tela funcional, deve existir:

- objetivo claro da tela
- perfil autorizado
- endpoint ou contrato de API definido
- estados de tela definidos
- payloads principais conhecidos
- comportamento para `401`, `403`, `404`, `409` e erros de validacao
- decisao se a tela tambem tera equivalente mobile
- criterio de aceite manual

## 11. Lacunas a Resolver Antes da Implementacao Web Completa

- Definir se o cadastro publico podera criar `ADMIN` ou apenas `CLIENTE` antes de ambiente remoto.
- Definir estrategia final de armazenamento do JWT no frontend.
- Definir padrao de rotas Angular conforme versao final adotada.
- Definir se o app web tera um unico projeto Angular ou workspace com apps separados no futuro.
- Revisar specs antigas para alinhar estrutura backend DDD antes de iniciar implementacao.
- Criar contratos futuros de onboarding, credito, contratos e cobranca antes de telas funcionais dessas jornadas.

## 12. Assumptions

- A primeira entrega web funcional deve comecar apenas quando autenticacao e endpoints basicos estiverem estaveis.
- Algumas telas podem ser prototipadas antes dos endpoints, mas nao devem ser tratadas como concluidas ate consumirem API real ou contrato mockado aprovado.
- O web sera a interface mais completa do produto SEP.
- O mobile sera planejado em paralelo, mas com escopo reduzido.
- Backoffice, financeiro e administracao ficarao no web.
