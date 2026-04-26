# Plano de Telas Mobile - SEP

## 1. Objetivo

Planejar as telas do app mobile SEP a partir do PRD, dos endpoints previstos e do plano de telas web, mantendo o escopo mobile menor e focado nas jornadas externas.

O mobile deve apoiar a validacao e o acompanhamento das jornadas de contratacao de emprestimo, sem substituir o backoffice web.

## 2. Diretrizes Gerais

- Stack recomendada: `Ionic v8 + Angular + Capacitor`.
- A versao Angular do mobile deve acompanhar a versao final escolhida para o frontend web.
- Se o frontend web usar Angular abaixo de `16`, a escolha por Ionic v8 deve ser reavaliada antes da implementacao.
- A primeira validacao mobile pode ser PWA/browser.
- Android/iOS via Capacitor entram depois, quando a jornada estiver mais madura.
- O mobile deve consumir a mesma API publica do web.
- O mobile nao deve ter backend proprio nesta fase.
- O mobile nao deve conter regra de negocio de dominio.
- Decisoes de credito, status, permissoes, bloqueios e elegibilidade devem vir da API.
- O mobile deve reutilizar contratos, DTOs, autenticacao JWT, guards e padroes HTTP definidos com o frontend web.
- O template Datta Able nao deve ser copiado diretamente para o mobile; devem ser aproveitados apenas identidade visual, tokens de cor, padroes de marca e conceitos de componentes.

## 3. Escopo Mobile

### Incluido

- Jornada do tomador de emprestimo.
- Jornada da empresa credora.
- Login.
- Cadastro inicial, se mantido publico pela API.
- Perfil do usuario autenticado.
- Alteracao de senha.
- Onboarding do tomador, quando a API existir.
- Onboarding da empresa credora, quando a API existir.
- Solicitacao e acompanhamento de emprestimo, quando a API existir.
- Status de analise, formalizacao, cobranca e pagamentos, quando a API existir.
- Visao simplificada de oportunidades, operacoes financiadas e carteira da empresa credora, quando a API existir.

### Excluido

- Financeiro interno.
- Backoffice operacional completo.
- Administracao do sistema.
- Governanca.
- Cadastros mestres.
- Auditoria administrativa.
- Mesa interna de analise de credito.
- Painel Pix operacional.
- Conciliacao Pix.
- Webhooks Pix.
- Reprocessos financeiros internos.

## 4. Perfis Mobile

### Visitante

Usuario nao autenticado.

Pode acessar:
- boas-vindas / landing mobile
- login
- cadastro publico, se habilitado
- recuperacao de acesso futura, se especificada

### Tomador

Usuario autenticado que solicita ou acompanha emprestimo.

Pode acessar:
- inicio do tomador
- meu perfil
- alterar senha
- onboarding
- solicitacao de emprestimo
- minhas propostas
- detalhe da proposta
- formalizacao
- parcelas
- notificacoes futuras

### Empresa Credora

Usuario autenticado vinculado a empresa que aporta recursos.

Pode acessar:
- inicio da empresa credora
- perfil da empresa
- onboarding KYB
- oportunidades
- operacoes financiadas
- carteira
- detalhe da operacao financiada
- notificacoes futuras

## 5. Mapa Inicial de Telas por Fase

### Fase Mobile 0 - Prototipo Navegavel / PWA

Objetivo:
- Validar fluxo, estrutura de navegacao e identidade visual mobile antes de todos os endpoints de negocio existirem.

Telas:
- Splash / carregamento inicial
- Boas-vindas / landing mobile
- Login
- Cadastro
- Inicio mockado do tomador
- Inicio mockado da empresa credora
- Meu perfil
- Alterar senha
- Acesso negado
- Erro generico

Dependencias:
- Pode iniciar com contratos mockados.
- Nao deve ser considerada funcional ate consumir endpoints reais ou mocks aprovados.

### Fase Mobile 1 - Base Autenticada

Objetivo:
- Entregar app autenticado consumindo endpoints reais de auth e usuarios.

Telas:
- Boas-vindas / landing mobile funcional sem API
- Login funcional
- Cadastro funcional
- Shell mobile autenticado
- Inicio do tomador (casca)
- Inicio da empresa credora (casca)
- Meu perfil
- Alterar senha
- Sessao expirada

Dependencias:
- Sprint 3 concluida.
- OpenAPI e erros padronizados preferencialmente concluidos na Sprint 4.

### Fase Mobile 2 - Jornada do Tomador

Objetivo:
- Permitir que o tomador inicie e acompanhe a contratacao de emprestimo.

Telas:
- Onboarding do tomador
- Documentos do tomador
- Solicitar emprestimo
- Minhas propostas
- Detalhe da proposta
- Status da analise de credito
- Formalizacao
- Minhas parcelas

Dependencias:
- APIs futuras de `onboarding`.
- APIs futuras de `credito`.
- APIs futuras de `contratos`.
- APIs futuras de `cobranca`.

### Fase Mobile 3 - Jornada da Empresa Credora

Objetivo:
- Permitir que a empresa credora acompanhe oportunidades, operacoes e carteira de forma simplificada.

Telas:
- Inicio da empresa credora
- Perfil da empresa
- Onboarding KYB
- Oportunidades
- Detalhe da oportunidade
- Operacoes financiadas
- Detalhe da operacao financiada
- Carteira

Dependencias:
- APIs futuras de `credores`.
- APIs futuras de `onboarding`.
- APIs futuras de operacoes financiadas.

### Fase Mobile 4 - Pagamentos e Pix Visivel ao Usuario

Objetivo:
- Exibir informacoes de pagamento ao tomador e status financeiros relevantes a credora, sem operar o painel interno de Pix.

Telas:
- Status de pagamento
- Instrucoes de pagamento
- Comprovantes futuros
- Historico de pagamentos
- Status simplificado de recebimento para credora

Dependencias:
- APIs futuras de `cobranca`.
- APIs futuras de `pix`, apenas quando Pix estiver aprovado e implementado no backend.

Observacao:
- O mobile nao deve iniciar desembolso Pix assistido nem tratar conciliacao operacional.

## 6. Telas Detalhadas - Base Mobile

### 6.1 Splash / Carregamento Inicial

Objetivo:
- Verificar estado inicial do app, existencia de token e necessidade de redirecionamento.

Perfil:
- visitante
- usuarios autenticados

Endpoints:
- `GET /api/v1/auth/me`, quando houver token local

Comportamentos:
- se nao houver token, ir para boas-vindas ou login
- se houver token valido, carregar perfil
- se token estiver invalido ou expirado, limpar sessao e ir para login

Dependencia:
- Sprint 3 para validacao real com `/auth/me`

### 6.2 Boas-vindas / Landing Mobile

Objetivo:
- Apresentar a proposta do app em formato mobile, orientar o visitante sobre as jornadas disponiveis e direcionar para login ou cadastro.

Perfil:
- visitante

Endpoints:
- nenhum obrigatorio

Elementos:
- marca SEP
- mensagem curta de valor
- entrada para tomador
- entrada para empresa credora
- chamada para login
- chamada para cadastro, se habilitado
- indicacao de seguranca/confianca em linguagem simples

Comportamentos:
- botao entrar
- botao criar conta, se cadastro publico estiver habilitado
- indicar as duas jornadas: tomador e empresa credora
- funcionar sem autenticacao
- nao depender de API na primeira versao

Dependencia:
- pode ser prototipada antes da API

Observacoes:
- Esta sera a primeira tela visual implementada apos a base tecnica do mobile.
- Deve validar linguagem, identidade visual mobile e fluxo publico antes de login/register.
- Nao deve copiar o template administrativo web; deve apenas reaproveitar identidade visual e tokens de marca.

### 6.3 Login

Objetivo:
- Autenticar usuario por e-mail e senha.

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
- armazenar token conforme estrategia mobile definida
- carregar `/auth/me`
- redirecionar conforme perfil/jornada

Dependencia:
- Sprint 3 concluida

Observacoes:
- Estrategia de armazenamento de token deve considerar PWA e Capacitor.

### 6.4 Cadastro

Objetivo:
- Permitir cadastro publico inicial, se essa regra continuar habilitada.

Perfil:
- visitante

Endpoint:
- `POST /api/v1/usuarios`

Campos:
- e-mail
- senha com exatamente 6 caracteres
- perfil, se permitido pela regra vigente

Comportamentos:
- validar e-mail
- validar senha exatamente com 6 caracteres
- exibir erro para e-mail duplicado
- apos sucesso, direcionar para login ou fluxo definido

Dependencia:
- Sprint 2 concluida

Lacuna:
- Antes de app publico real, revisar se cadastro mobile pode criar apenas cliente/tomador e nao admin.

### 6.5 Shell Mobile Autenticado

Objetivo:
- Estruturar navegacao autenticada do app.

Perfil:
- tomador
- empresa credora

Endpoint:
- `GET /api/v1/auth/me`

Elementos:
- tabs inferiores ou menu principal mobile
- header simples
- area de conteudo
- estado de sessao expirada
- logout

Comportamentos:
- montar navegacao conforme perfil
- nao exibir telas internas de financeiro/admin/backoffice
- bloquear rotas sem permissao

Dependencia:
- Sprint 3 concluida

### 6.6 Inicio do Tomador (Casca)

Objetivo:
- Dar ao tomador uma primeira tela autenticada em formato de casca, validando navegacao, layout mobile e atalhos principais antes das APIs completas da jornada existirem.

Perfil:
- tomador

Endpoints:
- `GET /api/v1/auth/me`
- APIs futuras de propostas, onboarding, credito, contratos e cobranca

Conteudo inicial:
- saudacao
- cards placeholder ou vazios
- status do cadastro quando existir API
- status da proposta ativa quando existir API
- atalhos para onboarding, solicitar emprestimo e acompanhar proposta

Dependencia:
- Sprint 3 para versao minima
- APIs futuras para conteudo real da jornada

Observacoes:
- A casca pode existir antes das APIs de onboarding e credito.
- Dados reais so devem aparecer quando vierem de contrato de API aprovado.

### 6.7 Inicio da Empresa Credora (Casca)

Objetivo:
- Dar a empresa credora uma primeira tela autenticada em formato de casca, validando navegacao, layout mobile e atalhos principais sem antecipar a carteira real.

Perfil:
- empresa credora

Endpoints:
- `GET /api/v1/auth/me`
- APIs futuras de credores, oportunidades e carteira

Conteudo inicial:
- saudacao
- cards placeholder ou vazios
- status do cadastro/KYB quando existir API
- resumo de oportunidades quando existir API
- resumo de operacoes financiadas quando existir API
- atalho para carteira

Dependencia:
- Sprint 3 para versao minima
- modulo `credores` para conteudo funcional

Observacoes:
- A casca da credora deve ser simples e posterior a login/register.
- Carteira, oportunidades e operacoes reais dependem dos contratos futuros do modulo `credores`.

### 6.8 Meu Perfil

Objetivo:
- Exibir dados do usuario autenticado.

Perfil:
- tomador
- empresa credora

Endpoints:
- `GET /api/v1/auth/me`
- `GET /api/v1/usuarios/{id}`

Campos exibidos:
- id
- e-mail
- perfil
- data de criacao

Comportamentos:
- permitir acesso a alterar senha
- nao permitir consultar terceiros

Dependencia:
- Sprint 3 concluida

### 6.9 Alterar Senha

Objetivo:
- Permitir que o usuario altere a propria senha.

Perfil:
- tomador
- empresa credora

Endpoint:
- `PATCH /api/v1/usuarios/{id}/senha`

Campos:
- senha atual
- nova senha
- confirmacao da nova senha

Comportamentos:
- validar nova senha com exatamente 6 caracteres
- validar confirmacao localmente
- exibir erro quando senha atual estiver incorreta
- confirmar sucesso

Dependencia:
- Sprint 3 concluida

## 7. Telas Futuras do Tomador

### 7.1 Onboarding do Tomador

Modulo backend:
- `onboarding`

Objetivo:
- Coletar e acompanhar dados cadastrais e documentais do tomador.

Telas:
- Dados pessoais ou empresariais do tomador
- Endereco
- Documentos
- Pendencias
- Status de validacao

Dependencias:
- APIs futuras de cadastro complementar
- APIs futuras de documentos
- APIs futuras de status KYC/KYB

### 7.2 Solicitar Emprestimo

Modulo backend:
- `credito`

Objetivo:
- Permitir que o tomador envie uma solicitacao de emprestimo.

Telas:
- Valor e prazo
- Dados da operacao
- Revisao da solicitacao
- Confirmacao de envio

Dependencias:
- APIs futuras de proposta
- regras de elegibilidade vindas da API

### 7.3 Minhas Propostas

Modulo backend:
- `credito`

Objetivo:
- Listar propostas do tomador.

Telas:
- Lista de propostas
- Filtros simples por status
- Estado vazio

Dependencias:
- APIs futuras de propostas do usuario autenticado

### 7.4 Detalhe da Proposta

Modulo backend:
- `credito`
- `contratos`
- `cobranca`

Objetivo:
- Exibir linha do tempo da proposta e status atual.

Conteudo:
- dados principais da proposta
- status de onboarding
- status de analise
- status de formalizacao
- status de cobranca/pagamento futuro

Dependencias:
- APIs futuras de detalhe de proposta
- APIs futuras de status consolidado

### 7.5 Status da Analise de Credito

Modulo backend:
- `credito`

Objetivo:
- Permitir que o tomador acompanhe a decisao de credito sem acesso a criterios internos sensiveis.

Conteudo:
- em analise
- aprovada
- recusada
- pendente de informacao

Dependencias:
- APIs futuras de status publico da analise

Observacao:
- O mobile nao deve mostrar parecer interno, score tecnico ou justificativas operacionais sensiveis.

### 7.6 Formalizacao

Modulo backend:
- `contratos`

Objetivo:
- Permitir ao tomador acompanhar e executar aceite/assinatura quando disponivel.

Telas:
- Resumo do contrato
- Visualizacao de documentos
- Aceite
- Status de assinatura

Dependencias:
- APIs futuras de contrato
- APIs futuras de aceite
- integracao futura com assinatura eletronica, se aprovada

### 7.7 Minhas Parcelas

Modulo backend:
- `cobranca`

Objetivo:
- Permitir que o tomador acompanhe parcelas e status de pagamento.

Telas:
- Lista de parcelas
- Detalhe da parcela
- Status de pagamento
- Historico de pagamentos

Dependencias:
- APIs futuras de parcelas
- APIs futuras de status de cobranca

### 7.8 Pagamento Futuro

Modulo backend:
- `cobranca`
- `pix`, em fase posterior

Objetivo:
- Mostrar instrucoes e status de pagamento, sem operar conciliacao interna.

Telas:
- Instrucoes de pagamento
- Copia e cola Pix futuro, se aprovado
- Status de pagamento
- Comprovante futuro

Dependencias:
- Pix somente depois da estabilizacao de onboarding, credito, formalizacao e cobranca inicial.

## 8. Telas Futuras da Empresa Credora

### 8.1 Perfil da Empresa

Modulo backend:
- `credores`

Objetivo:
- Exibir dados principais da empresa credora.

Conteudo:
- razao social
- documento
- responsaveis
- status cadastral

Dependencias:
- APIs futuras de empresa credora

### 8.2 Onboarding KYB

Modulo backend:
- `onboarding`
- `credores`

Objetivo:
- Permitir que a empresa credora complete dados e documentos necessarios.

Telas:
- Dados da empresa
- Responsaveis
- Documentos
- Pendencias
- Status de validacao

Dependencias:
- APIs futuras de KYB
- APIs futuras de documentos

### 8.3 Oportunidades

Modulo backend:
- `credores`
- `credito`

Objetivo:
- Exibir oportunidades disponiveis para a empresa credora, quando essa funcionalidade existir.

Telas:
- Lista de oportunidades
- Detalhe da oportunidade
- Interesse ou acompanhamento futuro

Dependencias:
- APIs futuras de oportunidades
- regras de elegibilidade vindas da API

### 8.4 Operacoes Financiadas

Modulo backend:
- `credores`

Objetivo:
- Exibir operacoes em que a empresa credora participa.

Telas:
- Lista de operacoes
- Status da operacao
- Detalhe da operacao

Dependencias:
- APIs futuras de operacoes financiadas

### 8.5 Carteira

Modulo backend:
- `credores`
- `financeiro`, apenas como fonte interna exposta via contrato publico adequado

Objetivo:
- Exibir resumo simplificado da carteira da empresa credora.

Conteudo:
- total aportado futuro
- operacoes ativas
- status agregado
- indicadores simplificados

Dependencias:
- APIs futuras de carteira

Observacao:
- O mobile nao deve expor telas financeiras internas nem conciliacao operacional.

## 9. Navegacao Mobile Sugerida

### Visitante

- Boas-vindas
- Login
- Cadastro

### Tomador

Tabs ou menu principal:
- Inicio
- Propostas
- Parcelas
- Perfil

Rotas secundarias:
- Onboarding
- Solicitar emprestimo
- Detalhe da proposta
- Formalizacao
- Alterar senha

### Empresa Credora

Tabs ou menu principal:
- Inicio
- Oportunidades
- Operacoes
- Carteira
- Perfil

Rotas secundarias:
- Onboarding da empresa
- Detalhe da oportunidade
- Detalhe da operacao
- Alterar senha

## 10. Ordem Recomendada de Implementacao Mobile

1. Definir versao Angular/Ionic compativel com o frontend web
2. Criar estrutura base mobile, pacotes, rotas e shell Ionic minimo
3. Criar boas-vindas / landing mobile
4. Criar login
5. Criar cadastro / register
6. Implementar controle de sessao com `/auth/me`
7. Criar inicio do tomador (casca)
8. Criar inicio da empresa credora (casca)
9. Criar shell mobile autenticado completo
10. Criar meu perfil
11. Criar alterar senha
12. Criar placeholders navegaveis para jornadas futuras
13. Implementar onboarding do tomador quando API existir
14. Implementar solicitacao e acompanhamento de emprestimo
15. Implementar formalizacao
16. Implementar parcelas
17. Implementar onboarding da empresa credora
18. Implementar oportunidades e operacoes financiadas
19. Implementar carteira simplificada
20. Implementar pagamento/Pix visivel ao usuario somente em fase futura

## 11. Matriz Tela x Endpoint

| Tela Mobile | Endpoint atual/futuro | Status |
| --- | --- | --- |
| Splash / sessao | `GET /api/v1/auth/me` | planejado Sprint 3 |
| Boas-vindas / landing mobile | nenhum obrigatorio | primeira tela visual apos base mobile |
| Login | `POST /api/v1/auth/login` | planejado Sprint 3 |
| Cadastro | `POST /api/v1/usuarios` | planejado Sprint 2 |
| Inicio do tomador (casca) | `GET /api/v1/auth/me` + APIs futuras | minimo Sprint 3, completo futuro |
| Inicio da empresa credora (casca) | `GET /api/v1/auth/me` + APIs futuras de `credores` | minimo Sprint 3, completo futuro |
| Meu perfil | `GET /api/v1/auth/me`, `GET /api/v1/usuarios/{id}` | planejado Sprint 3 |
| Alterar senha | `PATCH /api/v1/usuarios/{id}/senha` | planejado Sprint 3 |
| Onboarding tomador | APIs futuras de `onboarding` | futuro |
| Documentos tomador | APIs futuras de `onboarding` | futuro |
| Solicitar emprestimo | APIs futuras de `credito` | futuro |
| Minhas propostas | APIs futuras de `credito` | futuro |
| Detalhe da proposta | APIs futuras de `credito`, `contratos`, `cobranca` | futuro |
| Status da analise | APIs futuras de `credito` | futuro |
| Formalizacao | APIs futuras de `contratos` | futuro |
| Minhas parcelas | APIs futuras de `cobranca` | futuro |
| Perfil da empresa credora | APIs futuras de `credores` | futuro |
| Onboarding KYB | APIs futuras de `onboarding` e `credores` | futuro |
| Oportunidades | APIs futuras de `credores` e `credito` | futuro |
| Operacoes financiadas | APIs futuras de `credores` | futuro |
| Carteira | APIs futuras de `credores` | futuro |
| Status de pagamento / Pix visivel | APIs futuras de `cobranca` e `pix` | futuro posterior |

## 12. Estados Mobile Obrigatorios

Cada tela funcional deve prever:

- carregando
- vazio
- erro de validacao
- erro de rede
- sessao expirada
- acesso negado
- recurso nao encontrado
- sucesso
- reenvio ou tentar novamente, quando aplicavel

## 13. Criterios de Pronto para Tela Mobile

Antes de considerar uma tela mobile pronta, deve existir:

- objetivo claro
- perfil autorizado
- endpoint real ou contrato mockado aprovado
- comportamento offline/de erro de rede definido, mesmo que simples
- estado de loading
- estado vazio
- erro padronizado exibido de forma amigavel
- criterio de aceite manual
- comportamento em PWA/browser validado
- decisao se sera mantida apenas no mobile ou tambem existira no web

## 14. Lacunas a Resolver Antes da Implementacao Mobile Completa

- Definir versao final do Angular do frontend web para confirmar compatibilidade com Ionic v8.
- Definir estrategia segura de armazenamento do JWT no mobile/PWA/Capacitor.
- Definir se o cadastro mobile podera criar apenas usuarios tomadores/clientes.
- Definir nomenclatura futura de perfis para diferenciar tomador e empresa credora, pois hoje a base inicial possui apenas `ROLE_ADMIN` e `ROLE_CLIENTE`.
- Criar contratos futuros de onboarding, credito, contratos, cobranca e credores antes de telas funcionais dessas jornadas.
- Definir estrategia de notificacoes push somente em fase posterior.
- Definir criterios de publicacao em lojas Android/iOS somente depois da validacao PWA.

## 15. Assumptions

- O mobile sera iniciado junto com a fundacao do frontend, mas so tera funcionalidade real apos autenticao e contratos de API estaveis.
- O primeiro recorte funcional do mobile sera login, sessao, perfil e alteracao de senha.
- A jornada do tomador tem prioridade sobre a jornada completa da empresa credora, porque fecha a contratacao de emprestimo.
- A empresa credora tera uma experiencia simplificada no mobile.
- Financeiro interno, backoffice e administracao permanecem exclusivamente no web.
- Pix no mobile sera primeiro visivel como status/instrucao para usuarios externos, nao como ferramenta operacional.
