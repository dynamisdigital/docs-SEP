# Steps - M-Sprint 7 - Credito e Open Finance Mobile

**Spec de origem**: [`specs/fase-3/207-msprint-7-credito-mobile.md`](../../specs/fase-3/207-msprint-7-credito-mobile.md)

**Status**: planejada. A implementacao no `sep-mobile` so pode iniciar depois dos prechecks
de integracao Git da Task M-7.0.

**Objetivo geral**: permitir que o tomador autenticado crie, liste e acompanhe propostas
de credito e conclua o consentimento Open Finance no PWA mobile, consumindo os contratos
reais do `sep-api` sem duplicar motor de credito, elegibilidade, score, ownership ou
decisoes de negocio no app.

**Esforco total estimado**: 5-7 dias de Dev Mobile dedicado.

**Repo de destino**:
- `sep-mobile`: codigo Angular/Ionic, testes, MSW e smoke PWA.
- `docs-SEP`: documentacao operacional editada apenas no working tree; operacao Git manual.

**Branch sugerida**:
- `feature/msprint-7-credito-mobile`

**Design system vigente**: New Design System SEP mobile aplicado na M-Sprint 12.
Usar Ionic standalone, Ionicons, tokens e mixins `sep-mobile-*` existentes. Nao
reintroduzir Notion legado, Tailwind, shadcn/ui, Radix, React ou biblioteca nova de
icones sem ADR e aprovacao explicita.

**Estado confirmado durante o planejamento (2026-06-30)**:
- M-Sprint 6 integrada em `origin/develop` pelo PR #79.
- `origin/main` e `origin/develop` estao divergentes: a reconciliacao deve ocorrer antes
  da branch M-7, conforme `AGENT.md`.
- A branch local `feature/msprint-6-onboarding-mobile` nao e base valida para iniciar M-7.
- O mobile atual usa Angular 20, Ionic 8 e Capacitor 8; confirmar novamente no precheck,
  sem downgrade ou upgrade de stack nesta sprint.

**Contratos backend consumidos**:

Credito (`/api/v1/credito`):
- `POST /api/v1/credito/propostas`
  body `{ solicitacaoOnboardingId, tipoOperacao, valorSolicitado, prazoMeses }`
  -> `201 PropostaResponse`.
- `GET /api/v1/credito/propostas`
  query `status?`, `page?`, `size?` -> `Page<PropostaResponse>`.
  `CLIENTE` lista apenas as proprias propostas; o app nao envia `tomadorId`.
- `GET /api/v1/credito/propostas/{id}` -> `PropostaResponse`, com ownership no backend.
- `POST /propostas/{id}/parecer` e `GET /propostas/{id}/regras` ficam fora do mobile:
  mesa de credito, trilha de regras e operacao interna pertencem ao web/backoffice.

Open Finance (`/api/v1/credito/propostas/{id}/open-finance`):
- `POST /consentimento`
  body `{ cpfCnpjTomador, redirectUri }`
  -> `201 IniciarConsentimentoOpenFinanceResponse`.
- `GET /api/v1/credito/propostas/{id}/open-finance`
  -> `OpenFinanceStatusResponse`.
- O app nunca chama Celcoin/Finansystech diretamente e nao processa webhook.

**Decisoes da sprint**:
- Reutilizar `OnboardingJourneyStore` para obter `solicitacaoOnboardingId`; nao pedir UUID
  tecnico ao usuario e nao criar outro storage para o mesmo ponteiro.
- Ausencia do ponteiro de onboarding deve levar o usuario para `/app/onboarding`.
  O backend continua sendo a fonte de verdade para `APROVADO_FINAL` e responde `422`
  quando a pre-condicao nao for atendida.
- `CLIENTE` cria e acompanha somente suas propostas. Nao enviar `tomadorId`, nao criar
  bypass de ownership e nao expor controles internos.
- A UI apresenta o `status` recebido. Nao calcula score, status sugerido, juros, parcela,
  CET, IOF, elegibilidade ou decisao.
- No detalhe do tomador, nao exibir trilha de regras, `pareceristaId`, IDs internos
  desnecessarios ou formula do score. Parecer recebido pode ser apresentado como
  feedback de decisao, justificativa e data, sem reinterpretacao local.
- Open Finance e opt-in. O documento informado para consentimento fica apenas no estado
  do formulario e nao e persistido.
- `redirectUri` deve ser gerado pelo app a partir de origem controlada e rota interna de
  retorno; nunca aceitar URI digitada pelo usuario ou confiar em query params do provider
  como fonte de verdade.
- Exibir apenas agregados sanitizados de Open Finance:
  `mediaEntradasMensal`, `mediaSaidasMensal`, `saldoMedio`,
  `numeroMesesAvaliados` e `dataRecebimento`.
- Nao persistir proposta, parecer, documento ou agregados bancarios em
  `localStorage`, `sessionStorage` ou Capacitor Preferences.

**Fora de escopo**:
- Mesa de credito, parecer manual, trilha de regras e perfil FINANCEIRO.
- Backoffice, administracao e auditoria administrativa mobile.
- Calculo de score, juros, parcelas, CET, IOF ou elegibilidade no app.
- Integracao direta com provider Open Finance.
- Webhook, renovacao ou revogacao tardia de consentimento.
- Build Android/iOS, deep link nativo e plugin `Browser`; a validacao desta sprint e PWA.
- Novos endpoints ou alteracao de contrato backend.

**Protocolo obrigatorio por Task**:
1. Executar somente a Task liberada pelo usuario.
2. Antes de editar, confirmar arquivos e comportamento atual.
3. Implementar a menor mudanca coerente com os padroes do repo.
4. Rodar as verificacoes indicadas.
5. Parar em checkpoint pre-commit com status, diff, testes, riscos e mensagem sugerida.
6. Aguardar aprovacao explicita antes de `git add` e `git commit`.
7. Usar paths especificos no staging; nunca `git add -A`.

**Skills obrigatorias na implementacao**:
- `coding-guidelines`: simplicidade, mudancas cirurgicas e verificacao orientada a meta.
- `clean-code`: nomes intencionais, componentes pequenos e testes F.I.R.S.T.
- `clean-architecture`: componentes orquestram UI e chamam services; DTOs ficam na
  borda HTTP; regras e decisoes de credito permanecem no backend.

## Ordem de execucao recomendada

```text
M-7.0 (prechecks Git, contratos e baseline)
   |
   v
M-7.1 (DTOs + CreditoMobileService)
   |
   v
M-7.2 (rotas + lista de propostas + entradas da home/tab)
   |
   v
M-7.3 (criacao de proposta com ponteiro da M-6)
   |
   v
M-7.4 (detalhe + status + parecer)
   |
   v
M-7.5 (consentimento + retorno + status Open Finance)
   |
   v
M-7.6 (MSW + Vitest + Playwright PWA + docs)
```

---

## Task M-7.0 - Prechecks da M-Sprint 7

**Objetivo**: confirmar a cadeia Git, os contratos reais e a baseline antes de qualquer
alteracao no `sep-mobile`.

**Esforco**: 1-2 horas.

### Step 207.0.1 - Confirmar a cadeia de integracao

**Comandos**:
```bash
cd <sep-mobile-root>
git fetch --all --prune
git status --short --branch
git rev-list --left-right --count origin/main...origin/develop
git log --oneline --decorate -12 origin/develop
git log --oneline --decorate -8 origin/main
```

**Verificacao**:
- `origin/develop` contem a M-Sprint 6 / PR #79.
- `origin/main` foi reconciliada em `origin/develop`.
- Se houver commits exclusivos em `main` que nao estao em `develop`, nao criar a branch
  M-7 sem reconciliacao ou aprovacao explicita do usuario.
- Nao iniciar M-7 a partir da branch antiga da M-6.

### Step 207.0.2 - Atualizar base e criar a branch

**Comandos**:
```bash
cd <sep-mobile-root>
git switch develop
git pull --ff-only
git switch -c feature/msprint-7-credito-mobile
```

**Verificacao**:
- Branch criada a partir de `develop` atualizado.
- Working tree limpo ou alteracoes do usuario identificadas e preservadas.
- Se `pull --ff-only` falhar, parar e registrar o bloqueio.

### Step 207.0.3 - Confirmar stack e estrutura atual

**Comandos**:
```bash
cd <sep-mobile-root>
node --version
npm --version
npm ls @angular/core @ionic/angular @capacitor/core
find src/app/core -maxdepth 3 -type f | sort
find src/app/features/tomador -maxdepth 4 -type f | sort
sed -n '1,240p' src/app/features/authenticated/authenticated.routes.ts
sed -n '1,240p' src/app/features/tomador/home/home.component.ts
```

**Verificacao**:
- Angular 20, Ionic 8 e Capacitor 8 continuam sendo a stack instalada.
- M-Sprint 12 e M-Sprint 6 estao presentes.
- `/app/propostas` ainda e placeholder ou foi alterada conscientemente.
- `OnboardingJourneyStore`, MSW, Vitest e Playwright PWA existem.

### Step 207.0.4 - Reconfirmar contratos backend

**Comandos**:
```bash
cd <sep-api-root>
sed -n '1,300p' src/main/java/com/dynamis/sep_api/credito/web/controller/CreditoController.java
sed -n '1,260p' src/main/java/com/dynamis/sep_api/credito/web/controller/OpenFinanceController.java
find src/main/java/com/dynamis/sep_api/credito/web/dto -maxdepth 1 -type f | sort
```

**Verificacao**:
- Payloads, enums, campos nullable e codigos HTTP continuam iguais aos documentados.
- `CLIENTE` lista as proprias propostas sem `tomadorId`.
- `POST /propostas` exige onboarding aprovado e pertencente ao usuario.
- Open Finance exige documento com 11 ou 14 digitos e URI `http(s)`.
- Divergencia deve ser registrada antes de criar DTO mobile.

### Step 207.0.5 - Rodar baseline

**Comandos**:
```bash
cd <sep-mobile-root>
npm run lint
npm run lint:scss
npm run format:check
npm run test
npm run build
```

**Verificacao**:
- Todos os comandos passam antes da implementacao.
- Falhas preexistentes ou ambientais ficam registradas no checkpoint.

### Definicao de pronto da Task M-7.0
- [ ] M-6 presente em `origin/develop`.
- [ ] Cadeia `main -> develop` reconciliada ou excecao aprovada.
- [ ] Branch M-7 criada da base correta.
- [ ] Contratos backend reconfirmados.
- [ ] Stack e estrutura mobile confirmadas.
- [ ] Baseline registrada.

**Commit sugerido**: nenhum; prechecks nao geram commit.

---

## Task M-7.1 - DTOs e CreditoMobileService

**Objetivo**: criar a borda HTTP tipada de credito/Open Finance sem espalhar URLs,
query params ou interpretacao de status pelos componentes.

**Pre-requisito**: Task M-7.0 concluida.

**Esforco**: 0,5-1 dia.

**Arquivos esperados**:
- `src/app/core/api/api.models.ts`
- `src/app/core/credito/credito-mobile.service.ts`
- `src/app/core/credito/credito-mobile.service.spec.ts`

### Step 207.1.1 - Adicionar DTOs de borda

**Tipos e DTOs minimos**:
- `StatusProposta`: `EM_ANALISE | PRE_APROVADA | APROVADA | REJEITADA | PENDENCIA`.
- `TipoOperacao`: `CAPITAL_GIRO | OUTROS`.
- `StatusConsentimento`: `PENDENTE | AUTORIZADO | NEGADO | EXPIRADO`.
- `CriarPropostaRequest`.
- `PropostaResponse`.
- `ScoreInternoResponse` e `ParecerCreditoResponse`, apenas para espelhar a resposta.
- `PageResponse<T>` conforme Spring Page.
- `IniciarConsentimentoOpenFinanceRequest/Response`.
- `MovimentacaoConsolidadaResponse`.
- `OpenFinanceStatusResponse`.

**Regras**:
- Datas como `string` ISO.
- Campos nullable do backend como `T | null`.
- Valores monetarios seguem o JSON real; formatacao pertence a UI.
- Nao criar entidade de dominio, enum paralelo ou estado calculado.

### Step 207.1.2 - Criar CreditoMobileService

**Metodos esperados**:
- `listarPropostas(params?)`.
- `consultarProposta(id)`.
- `criarProposta(request)`.
- `iniciarConsentimentoOpenFinance(propostaId, request)`.
- `consultarOpenFinance(propostaId)`.

**Regras**:
- Usar `HttpClient`, `environment.apiBaseUrl`, interceptors existentes e
  `firstValueFrom`, seguindo `OnboardingMobileService`.
- Omitir query params vazios.
- Para `CLIENTE`, nunca enviar `tomadorId`.
- Propagar DTO e erro HTTP; nao converter status em decisao local.
- Nao guardar respostas em storage persistente.

### Step 207.1.3 - Testar o service

**Cenarios obrigatorios**:
- Listagem monta endpoint e filtros `status/page/size`.
- Listagem nao envia `tomadorId`.
- Detalhe usa o ID no path.
- Criacao envia os quatro campos exatos.
- Consentimento envia documento e URI exatos.
- Consulta Open Finance usa o endpoint correto.
- Erros HTTP sao propagados para a UI.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
npm run test -- src/app/core/credito/credito-mobile.service.spec.ts
```

### Definicao de pronto da Task M-7.1
- [ ] DTOs refletem os contratos reais.
- [ ] Service centraliza todas as chamadas da sprint.
- [ ] Nenhum componente conhece URL de credito/Open Finance.
- [ ] Nenhuma regra de decisao foi adicionada ao mobile.
- [ ] Specs do service passam.

### Commit sugerido
```text
feat(mobile): adicionar contratos e servico de credito
```

---

## Task M-7.2 - Rotas, lista de propostas e entradas do tomador

**Objetivo**: substituir o placeholder de propostas por uma jornada autenticada e
navegavel, com lista paginada e entradas na tab/home do tomador.

**Pre-requisito**: Task M-7.1 concluida.

**Esforco**: 1 dia.

**Arquivos esperados**:
- `src/app/features/authenticated/authenticated.routes.ts`
- `src/app/features/tomador/home/home.component.*`
- `src/app/features/tomador/credito/propostas-list.component.*`
- Specs correspondentes.

### Step 207.2.1 - Criar rotas lazy

**Rotas**:
```text
/app/propostas
/app/propostas/nova
/app/propostas/:id
/app/propostas/:id/open-finance
/app/propostas/:id/open-finance/retorno
```

**Regras**:
- Manter o `authGuard` herdado do shell.
- Manter `data.tab = 'propostas'` em todas as rotas da jornada.
- Nao duplicar header, shell ou tab bar.
- Remover somente o placeholder correspondente a `/app/propostas`.

### Step 207.2.2 - Conectar home e tab

**Comportamento esperado**:
- A tab "Propostas" abre a lista real.
- "Solicitar emprestimo" navega para `/app/propostas/nova`.
- "Acompanhar proposta" navega para `/app/propostas`.
- Remover o badge "Em breve" somente desses atalhos agora funcionais.
- Nao transformar o card "Proposta ativa" em dashboard de dados nesta task.

### Step 207.2.3 - Implementar lista mobile

**Conteudo por item**:
- tipo da operacao.
- valor solicitado e moeda.
- prazo em meses.
- status recebido.
- data de criacao.

**Comportamento esperado**:
- Chamar `GET /credito/propostas` sem `tomadorId`.
- Filtro simples por status, se mantido pequeno e coerente com Ionic.
- Paginar com `page/size`; nao carregar lista ilimitada.
- Toque no item navega para o detalhe.
- Prever loading, vazio, erro, retry e refresh.

**UI**:
- Usar `ion-content`, controles Ionic e primitivos `sep-mobile-*`.
- Itens escaneaveis, sem cards aninhados.
- Touch targets de pelo menos 44px.
- Textos quebram em 320px sem overflow.

### Step 207.2.4 - Testar rotas e lista

**Cenarios obrigatorios**:
- Placeholder foi substituido pela lista.
- Home e tab apontam para as rotas corretas.
- Lista renderiza propostas e estado vazio.
- Loading e erro com retry aparecem.
- Filtro/paginacao enviam params esperados.
- Toque navega ao detalhe.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
npm run lint:scss
npm run test -- src/app/features/tomador/credito src/app/features/tomador/home src/app/layout/tabs
npm run build
```

### Definicao de pronto da Task M-7.2
- [ ] Rotas da jornada existem sob o shell autenticado.
- [ ] Tab e atalhos deixam de ser placeholder.
- [ ] Lista usa ownership e paginacao do backend.
- [ ] Estados mobile obrigatorios foram tratados.
- [ ] Testes de navegacao/lista passam.

### Commit sugerido
```text
feat(mobile): listar propostas do tomador
```

---

## Task M-7.3 - Criacao de proposta

**Objetivo**: permitir que o tomador crie uma proposta usando o ponteiro de onboarding
entregue pela M-Sprint 6, sem expor UUID tecnico no formulario.

**Pre-requisito**: Tasks M-7.1 e M-7.2 concluidas.

**Esforco**: 0,5-1 dia.

**Arquivos esperados**:
- `src/app/features/tomador/credito/proposta-create.component.*`
- Specs correspondentes.
- Ajustes pontuais na home/lista, se necessarios.

### Step 207.3.1 - Resolver o onboarding da proposta

**Comportamento esperado**:
- Carregar `OnboardingJourneyStore.carregar()` ao abrir.
- Usar `journey.onboardingId` como `solicitacaoOnboardingId`.
- Se nao houver ponteiro valido, exibir estado claro com CTA para `/app/onboarding`.
- Nao pedir UUID ao usuario.
- Nao duplicar nem alterar o formato persistido pela M-6.

### Step 207.3.2 - Implementar formulario

**Campos visiveis**:
- `tipoOperacao`: `CAPITAL_GIRO` ou `OUTROS`.
- `valorSolicitado`.
- `prazoMeses`.

**Validacao local**:
- obrigatoriedade.
- valor maior que zero.
- prazo inteiro maior ou igual a 1.

**Regras**:
- Limites maximos, elegibilidade e onboarding aprovado pertencem ao backend.
- Desabilitar duplo submit durante loading.
- Ao `201`, navegar para `/app/propostas/{id}`.

### Step 207.3.3 - Tratar erros de pre-condicao

**Estados esperados**:
- `400`: dados invalidos.
- `403`: ownership/role negado.
- `404`: onboarding nao encontrado.
- `422`: onboarding ainda nao esta `APROVADO_FINAL`.
- erro de rede: retry sem perder valores nao sensiveis do formulario em memoria.

**Regra**:
- `422` oferece CTA para revisar `/app/onboarding`; nao altera status localmente.

### Step 207.3.4 - Testar criacao

**Cenarios obrigatorios**:
- Ponteiro ausente bloqueia submit e oferece onboarding.
- Ponteiro valido entra no payload sem aparecer no formulario.
- Validacoes basicas impedem payload invalido.
- `201` navega ao detalhe.
- `403/404/422` geram feedback apropriado.
- Clique duplo nao cria duas chamadas enquanto loading.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
npm run lint:scss
npm run test -- src/app/features/tomador/credito/proposta-create.component.spec.ts
```

### Definicao de pronto da Task M-7.3
- [ ] Tomador cria proposta sem digitar UUID.
- [ ] Ponteiro M-6 e reutilizado sem novo storage.
- [ ] Backend continua fonte de elegibilidade.
- [ ] Sucesso navega para detalhe.
- [ ] Erros e duplo submit estao cobertos.

### Commit sugerido
```text
feat(mobile): permitir criacao de proposta
```

---

## Task M-7.4 - Detalhe, status e parecer

**Objetivo**: permitir que o tomador acompanhe a proposta e receba feedback de analise
sem acesso a controles ou criterios internos da mesa de credito.

**Pre-requisito**: Tasks M-7.1-M-7.3 concluidas.

**Esforco**: 0,5-1 dia.

**Arquivos esperados**:
- `src/app/features/tomador/credito/proposta-detail.component.*`
- `src/app/features/tomador/credito/proposta-status.component.*`, somente se remover
  duplicacao real.
- Specs correspondentes.

### Step 207.4.1 - Implementar detalhe

**Campos exibidos**:
- tipo da operacao.
- valor e moeda.
- prazo.
- status atual.
- datas de criacao/atualizacao.
- feedback do ultimo parecer quando existir: decisao, justificativa e data.

**Nao exibir**:
- `tomadorId`, `pareceristaId` e IDs tecnicos sem valor ao usuario.
- endpoint/trilha de regras.
- formula ou explicacao interna do score.
- acao de registrar parecer.

### Step 207.4.2 - Apresentar estados sem inferencia

**Status**:
- `EM_ANALISE`.
- `PRE_APROVADA`.
- `PENDENCIA`.
- `APROVADA`.
- `REJEITADA`.

**Regras**:
- Labels e tons podem variar, mas nenhuma transicao e calculada no app.
- `PRE_APROVADA` nao pode ser apresentada como aprovacao final.
- Parecer ausente e score ausente sao estados normais.
- Justificativa longa quebra linha sem sobrepor acoes.

### Step 207.4.3 - Integrar entrada Open Finance

**Comportamento esperado**:
- Disponibilizar CTA para Open Finance somente na experiencia do tomador.
- O backend decide se a proposta aceita consentimento; o app deve tratar `422`.
- Estado final nao deve ser inferido como bloqueio definitivo apenas no frontend.

### Step 207.4.4 - Testar detalhe

**Cenarios obrigatorios**:
- Detalhe com cada status relevante.
- Parecer ausente e presente.
- `PRE_APROVADA` rotulada sem aprovacao final.
- `403`, `404`, loading, erro generico e retry.
- CTA Open Finance navega para a proposta correta.
- Nenhum controle interno ou trilha de regras e renderizado.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
npm run lint:scss
npm run test -- src/app/features/tomador/credito/proposta-detail.component.spec.ts
```

### Definicao de pronto da Task M-7.4
- [ ] Tomador acompanha o status real.
- [ ] Parecer e apresentado sem IDs internos.
- [ ] Nenhuma regra/score e recalculado ou explicado pelo app.
- [ ] Erros de ownership/not-found sao claros.
- [ ] Testes do detalhe passam.

### Commit sugerido
```text
feat(mobile): exibir detalhe e status da proposta
```

---

## Task M-7.5 - Consentimento e status Open Finance

**Objetivo**: implementar o fluxo opt-in PWA para iniciar consentimento, entregar o
usuario ao provider e consultar o status real pela API SEP apos o retorno.

**Pre-requisito**: Tasks M-7.1-M-7.4 concluidas.

**Esforco**: 1-1,5 dia.

**Arquivos esperados**:
- `src/app/features/tomador/credito/open-finance.component.*`
- `src/app/features/tomador/credito/open-finance-return.component.*`, se a rota de retorno
  nao puder reutilizar o mesmo componente.
- Specs correspondentes.

### Step 207.5.1 - Criar consentimento

**Campo visivel**:
- CPF com 11 digitos ou CNPJ com 14 digitos, somente numeros.

**Comportamento esperado**:
- Gerar `redirectUri` a partir da origem atual e da rota
  `/app/propostas/{id}/open-finance/retorno`.
- Nao permitir edicao da URI.
- Chamar `POST .../consentimento`.
- Manter CPF/CNPJ apenas no estado do formulario; limpar apos handoff/saida.
- Validar `urlAutorizacao` recebida como `http:` ou `https:` antes de navegar.
- Fazer handoff na mesma aba no PWA para preservar fluxo de retorno simples.

### Step 207.5.2 - Implementar retorno confiavel

**Comportamento esperado**:
- A rota de retorno usa somente `:id` interno para consultar a API SEP.
- Query params do provider podem ser ignorados; nunca definem status.
- Exibir estado "consultando autorizacao" e permitir atualizar/retry.
- Chamar `GET .../open-finance` como fonte de verdade.

### Step 207.5.3 - Exibir status e agregados

**Status**:
- `PENDENTE`.
- `AUTORIZADO`.
- `NEGADO`.
- `EXPIRADO`.

**Agregados permitidos quando presentes**:
- media mensal de entradas.
- media mensal de saidas.
- saldo medio.
- meses avaliados.
- data de recebimento.

**Proibido**:
- payload bruto.
- transacoes.
- conta, agencia ou identificadores bancarios.
- titular, CPF/CNPJ ou documento.
- persistencia local dos agregados.

### Step 207.5.4 - Tratar erros

**Erros esperados**:
- `400`: documento ou URI invalida.
- `403`: proposta de outro tomador.
- `404`: proposta/consentimento nao encontrado.
- `409`: ja existe consentimento pendente; consultar status em vez de criar outro.
- `422`: proposta final ou incompativel.
- URL de autorizacao com scheme invalido: bloquear handoff e exibir erro seguro.

### Step 207.5.5 - Testar Open Finance

**Cenarios obrigatorios**:
- Documento invalido nao chama API.
- URI de retorno e controlada pelo app.
- URL externa `http(s)` e aceita; outros schemes sao bloqueados.
- `409` muda para consulta de status.
- Retorno ignora query param de status.
- `PENDENTE`, `AUTORIZADO` com/sem snapshot, `NEGADO` e `EXPIRADO`.
- Nenhuma PII bancaria proibida aparece ou e persistida.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
npm run lint:scss
npm run test -- src/app/features/tomador/credito
npm run build
```

### Definicao de pronto da Task M-7.5
- [ ] Consentimento e iniciado via API SEP.
- [ ] Documento nao e persistido.
- [ ] Handoff aceita apenas `http(s)`.
- [ ] Retorno consulta a API em vez de confiar no provider.
- [ ] Somente agregados sanitizados sao exibidos.
- [ ] Testes cobrem status, erros e seguranca da URL.

### Commit sugerido
```text
feat(mobile): implementar consentimento open finance
```

---

## Task M-7.6 - MSW, testes PWA e fechamento documental

**Objetivo**: fechar a jornada com mocks deterministas, cobertura proporcional, smoke
mobile e documentacao operacional.

**Pre-requisito**: Tasks M-7.1-M-7.5 concluidas.

**Esforco**: 0,5-1 dia.

**Arquivos esperados**:
- `src/mocks/handlers.ts`
- dados mock separados somente se o arquivo atual justificar.
- `e2e/credito-mobile.spec.ts`
- specs dos componentes/services alterados.
- `docs-SEP/repos/sep-mobile/README.md`
- `docs-SEP/docs-sep/PRD-FASE-3.md`
- `docs-SEP/docs-sep/CONTEXT-PARTE-2.md`
- `docs-SEP/AI-ROADMAP.md`
- `docs-SEP/repos/sep-mobile/SPRINT-M-7-PR.md`

### Step 207.6.1 - Atualizar MSW

**Cenarios minimos**:
- lista vazia e lista paginada.
- proposta em `EM_ANALISE`, `PRE_APROVADA`, `PENDENCIA`, `APROVADA` e `REJEITADA`.
- detalhe com parecer ausente/presente.
- criacao `201`.
- criacao `403`, `404` e `422`.
- Open Finance `PENDENTE`, `AUTORIZADO` com agregados e `NEGADO`.
- consentimento `409`, ownership `403` e not found `404`.

**Regras**:
- Mocks usam somente dados ficticios.
- Nao incluir payload bancario bruto ou PII real.
- Handler respeita paths e status HTTP do backend.

### Step 207.6.2 - Completar Vitest

**Cobertura minima**:
- `CreditoMobileService`.
- rotas e entradas da home/tab.
- lista, criacao e detalhe.
- estados loading/vazio/erro/retry.
- consentimento, URL segura, retorno e agregados.
- ausencia de persistencia de documento/agregados.

**Nota Ionic/happy-dom**:
- Para `ion-input`/`ion-select`, seguir a convencao atual do repo por instancia quando o
  happy-dom nao montar o web component. Nao criar workaround global desnecessario.

### Step 207.6.3 - Criar smoke Playwright PWA

**Fluxo minimo com MSW**:
1. Login como `CLIENTE`.
2. Abrir tab Propostas.
3. Ver lista/estado vazio.
4. Criar proposta usando o ponteiro de onboarding preparado no teste.
5. Abrir detalhe e validar status.
6. Iniciar Open Finance.
7. Simular retorno.
8. Consultar `AUTORIZADO` e validar apenas agregados permitidos.

**Viewports**:
- Pixel 5 ou viewport mobile equivalente.
- Repetir ao menos o fluxo critico em largura 320px para detectar overflow.

**Assercoes negativas obrigatorias**:
- nenhuma trilha de regras/controle financeiro.
- nenhum `pareceristaId`.
- nenhuma conta, agencia, transacao ou CPF/CNPJ exibido apos handoff.

### Step 207.6.4 - Rodar suite final

**Comandos**:
```bash
cd <sep-mobile-root>
npm run lint
npm run lint:scss
npm run format:check
npm run test
npm run build
npm run e2e -- e2e/smoke.spec.ts e2e/onboarding-mobile.spec.ts e2e/credito-mobile.spec.ts
```

**Verificacao**:
- Suite verde ou falhas ambientais/preexistentes registradas com evidencia.
- Smoke publico e onboarding continuam verdes.
- Nenhum budget novo acima do limite de erro.

### Step 207.6.5 - Atualizar documentacao e PR temporario

**Atualizacoes**:
- Marcar M-7 como implementada somente depois da conclusao real.
- Documentar rotas, service, estados e limites LGPD em `repos/sep-mobile/README.md`.
- Atualizar PRD, CONTEXT e AI Roadmap no mesmo ciclo.
- Criar `repos/sep-mobile/SPRINT-M-7-PR.md` com summary, test plan, mudancas,
  contratos, decisoes, dividas, follow-ups e commits.
- Nao criar docs dentro de `sep-mobile`.

### Definicao de pronto da Task M-7.6
- [ ] MSW cobre sucesso e erros principais.
- [ ] Vitest cobre services/componentes e estados.
- [ ] Smoke PWA percorre proposta e Open Finance.
- [ ] Suite final executada.
- [ ] Docs e indices revisados.
- [ ] PR temporario M-7 criado no fim da sprint.

### Commit sugerido
```text
test(mobile): cobrir jornada de credito e open finance
```

---

## Definition of Done da M-Sprint 7

- [ ] Cadeia Git validada antes da implementacao.
- [ ] Tomador lista e consulta somente suas propostas.
- [ ] Tomador cria proposta usando o ponteiro de onboarding da M-6.
- [ ] Status e parecer sao apresentados sem regra de decisao local.
- [ ] Mobile nao expoe mesa de credito, trilha de regras ou IDs internos.
- [ ] Open Finance inicia consentimento e consulta status via API SEP.
- [ ] Retorno nao confia em query params do provider.
- [ ] Documento e dados bancarios nao sao persistidos localmente.
- [ ] Somente agregados sanitizados sao exibidos.
- [ ] Loading, vazio, sucesso, validacao, rede, `403`, `404`, `409` e `422`
  possuem estados de UI.
- [ ] PWA funciona em viewport mobile sem overflow.
- [ ] `npm run lint`, `lint:scss`, `format:check`, `test`, `build` e smoke PWA
  passam ou possuem falha preexistente documentada.
- [ ] README mobile, PRD, CONTEXT e AI Roadmap revisados no fechamento.
- [ ] `SPRINT-M-7-PR.md` criado no fim da sprint.

## Checklist de code review da M-Sprint 7

- [ ] Componentes chamam `CreditoMobileService`; URLs nao vazam para a UI.
- [ ] DTOs refletem o backend e nao viram entidades/regra de dominio.
- [ ] Listagem de `CLIENTE` nao envia `tomadorId`.
- [ ] `OnboardingJourneyStore` e reutilizado; nenhum UUID e pedido ao usuario.
- [ ] App nao calcula score, elegibilidade, juros, CET, IOF ou transicao.
- [ ] `PRE_APROVADA` nao aparece como aprovacao final.
- [ ] Trilha de regras, mesa de credito e `pareceristaId` nao aparecem.
- [ ] `redirectUri` e controlada pelo app.
- [ ] `urlAutorizacao` aceita apenas `http(s)`.
- [ ] Retorno consulta a API SEP e ignora status informado pelo provider.
- [ ] CPF/CNPJ e agregados Open Finance nao sao persistidos.
- [ ] Nenhuma PII bancaria proibida aparece em UI, logs, mocks ou storage.
- [ ] Erros `403/404/409/422` e retry estao cobertos.
- [ ] Layout usa Ionic/New Design System SEP, touch targets estaveis e sem overflow.
- [ ] Testes e docs acompanham o comportamento entregue.
