# Steps - F-Sprint 7 - Credito e Open Finance Web

**Spec de origem**: [`specs/fase-3/107-fsprint-7-credito-open-finance-web.md`](../../specs/fase-3/107-fsprint-7-credito-open-finance-web.md)

**Status**: implementada na branch `feature/fsprint-7-credito-open-finance-web` em 2026-06-03; push/PR manuais pendentes.

**Objetivo geral**: implementar no `sep-app` a jornada autenticada de propostas de credito e Open Finance para o tomador, consumindo os contratos reais de `sep-api` (`credito` Sprints 8-9), com UI Notion, sem duplicar motor de credito, parecer manual, regras de score ou decisoes de negocio no frontend.

**Esforco total estimado**: 5-7 dias de Dev Pleno Frontend.

**Repo de destino**:
- `sep-app`: Angular web, repo de codigo alterado nesta sprint.
- `docs-SEP`: documentacao editada no working tree quando necessario; operacao git continua manual.

**Branch sugerida**:
- `feature/fsprint-7-credito-open-finance-web`

**Pre-requisitos globais**:
- `sep-app/develop` atualizado apos F-Sprint 6 (`feature/fsprint-6-onboarding-web`, PR #33).
- F-Sprints 0-6 concluidas: shell autenticado Notion, guards, interceptors, MSW, Vitest, Playwright, MFA/step-up/refresh, onboarding PF/PJ navegavel.
- `sep-api/develop` ou `main` com Sprints backend 8-9 mergeadas: propostas de credito, motor de regras, parecer manual, Open Finance e webhooks Celcoin.
- Backend local disponivel em `http://localhost:8080` quando for validar smoke real.
- Docs de referencia: `repos/sep-api/CREDITO.md`, `repos/sep-api/OPEN-FINANCE.md`, `docs-sep/WEB-SCREENS-PLAN.md`, `docs-sep/DESIGN-notion.md`, `docs-sep/SEGURANCA.md`.

**Contratos backend consumidos**:

Credito (`/api/v1/credito`):
- `POST /api/v1/credito/propostas` body `{ solicitacaoOnboardingId, tipoOperacao, valorSolicitado, prazoMeses }` -> `201 PropostaResponse`.
- `GET /api/v1/credito/propostas` query `status?`, `tomadorId?`, `page?`, `size?` -> `Page<PropostaResponse>`.
- `GET /api/v1/credito/propostas/{id}` -> `PropostaResponse`.
- `GET /api/v1/credito/propostas/{id}/regras` -> `RegraAvaliadaResponse[]` somente `FINANCEIRO`/`ADMIN` quando usado.
- `POST /api/v1/credito/propostas/{id}/parecer` existe no backend, mas fica fora do escopo funcional da F-Sprint 7; backoffice/mesa de credito entra em F-Sprint 10.

Open Finance (`/api/v1/credito/propostas/{id}/open-finance`):
- `POST /api/v1/credito/propostas/{id}/open-finance/consentimento` body `{ cpfCnpjTomador, redirectUri }` -> `201 IniciarConsentimentoOpenFinanceResponse`.
- `GET /api/v1/credito/propostas/{id}/open-finance` -> `OpenFinanceStatusResponse`.

**Decisoes da sprint**:
- Frontend cria, lista e acompanha propostas; o motor de credito, score, regras, aprovacao, rejeicao e parecer pertencem ao backend.
- Nao calcular score, status sugerido, elegibilidade, parcela com juros, CET, IOF ou decisao final no web.
- `ScoreInternoResponse`, `ParecerCreditoResponse`, `RegraAvaliadaResponse` e `OpenFinanceStatusResponse` sao DTOs de apresentacao, nao entidades de dominio frontend.
- Open Finance e opt-in do tomador. O web abre a `urlAutorizacao` do backend/provider e depois consulta status; nao processa webhook nem payload bancario bruto.
- Dados Open Finance exibidos sao apenas agregados (`mediaEntradasMensal`, `mediaSaidasMensal`, `saldoMedio`, `numeroMesesAvaliados`, `dataRecebimento`). Nao criar campo/tabela para transacoes, conta, agencia, CPF/CNPJ de titular ou payload bruto.
- `CLIENTE` cria e acompanha somente suas propostas; `FINANCEIRO`/`ADMIN` podem visualizar quando backend permitir. O frontend nao cria bypass de ownership.
- Erros `400/403/404/409/422` devem virar estados de UI claros sem quebrar o shell autenticado.

**Fora de escopo da sprint**:
- Registrar parecer manual ou operar mesa de credito.
- Backoffice de propostas, fila operacional e step-up financeiro.
- Calculo financeiro real de contrato, parcelas, juros, IOF, CET ou cobranca.
- Integracao direta do frontend com Celcoin/Finansystech.
- Persistir dados bancarios ou documentos financeiros em localStorage/sessionStorage.

**Protocolo obrigatorio por Task**:
- Implementar somente a Task liberada pelo usuario.
- Ao concluir implementacao e verificacao da Task, parar em checkpoint pre-commit com arquivos alterados, testes executados, riscos e sugestao de commit.
- Aguardar `commit` ou aprovacao equivalente antes de stage/commit.
- Usar `git add <paths-especificos>`, nunca `git add -A`.
- Fazer code review da Task quando solicitado pelo usuario; se houver hotfix, implementar em novo checkpoint.
- Ao final da Task, pausar para review manual do usuario. Nao iniciar a proxima Task sem ordem explicita.

**Skills obrigatorias na implementacao**:
- `coding-guidelines`: pensar antes, simplicidade, mudancas cirurgicas, execucao orientada a meta.
- `clean-code`: nomes intencionais, componentes pequenos, sem comentarios ruidosos, testes F.I.R.S.T.
- `clean-architecture`: componentes chamam services; regra de negocio fica no backend; modelos TypeScript sao DTOs de borda, nao entidades de dominio duplicadas.

---

## Protocolo de breakpoints recomendado

```text
C1 = F-7.0 + F-7.1
Prechecks + modelos/CreditoService/MSW base

C2 = F-7.2
Rotas, menu e shell da jornada de credito

C3 = F-7.3
Lista e detalhe de propostas

C4 = F-7.4
Formulario de solicitacao de credito

C5 = F-7.5
Status de analise, score, parecer e pendencias

C6 = F-7.6
Open Finance, redirect/status, MSW/smoke/docs
```

- C1 fecha contratos antes de UI.
- C2 abre navegacao sem fluxo parcial escondido.
- C3 e C4 podem evoluir em paralelo depois de C1/C2, mas devem compartilhar service/modelos.
- C5 consolida leitura de score/parecer sem duplicar regra.
- C6 fecha Open Finance e validacao final da sprint.

---

## Task F-7.0 - Prechecks da F-Sprint 7

**Objetivo**: confirmar base Git, scripts, contratos backend e arquitetura atual do `sep-app`.

**Esforco**: 1-2 horas.

### Step 107.0.1 - Conferir estado Git do `sep-app`

**Comandos**:
```bash
cd <sep-app-root>
git fetch --all --prune
git status --short --branch
git rev-list --left-right --count HEAD...origin/develop
git log --oneline -10 origin/develop
```

**Verificacao**:
- Branch local alinhada a `origin/develop`.
- Working tree limpo ou alteracoes locais identificadas como do usuario.
- F-Sprint 6 presente no historico (`PR #33` ou commit equivalente).

### Step 107.0.2 - Criar branch da sprint

**Comandos**:
```bash
cd <sep-app-root>
git switch develop
git pull --ff-only
git switch -c feature/fsprint-7-credito-open-finance-web
```

**Verificacao**:
- Branch criada a partir de `develop` atualizado.
- Se `git pull --ff-only` falhar, abortar e avisar o usuario.

### Step 107.0.3 - Mapear estrutura atual do frontend

**Comandos**:
```bash
cd <sep-app-root>
find src/app/core -maxdepth 3 -type f | sort
find src/app/features/authenticated -maxdepth 5 -type f | sort
find src/app/layout -maxdepth 3 -type f | sort
find src/mocks -maxdepth 3 -type f | sort
sed -n '1,260p' src/app/core/api/api.models.ts
sed -n '1,220p' src/app/features/authenticated/authenticated.routes.ts
sed -n '1,220p' src/app/layout/sidenav/sidenav.component.ts
```

**Verificacao**:
- Shell Notion e rotas autenticadas existem.
- `CreditoService` ou feature `credito` ainda nao existe duplicada.
- MSW esta disponivel para `dev-offline`.
- F-Sprint 6 deixou onboarding acessivel no shell autenticado.

### Step 107.0.4 - Conferir contratos backend

**Comandos**:
```bash
cd <sep-api-root>
grep -R "class CreditoController\|class OpenFinanceController" -n src/main/java/com/dynamis/sep_api/credito/web/controller
grep -R "record .*Proposta\|record .*OpenFinance\|record .*Consentimento\|record .*RegraAvaliada\|record .*ScoreInterno" -n src/main/java/com/dynamis/sep_api/credito/web/dto
find src/main/java/com/dynamis/sep_api/credito/domain/vo -maxdepth 1 -type f -print
```

**Verificacao**:
- Endpoints de propostas confirmados.
- Endpoints de Open Finance confirmados.
- Enums `StatusProposta`, `TipoOperacao`, `StatusConsentimento`, `DecisaoParecer` e `ResultadoRegra` confirmados antes de criar modelos TypeScript.

### Step 107.0.5 - Rodar baseline web

**Comandos**:
```bash
cd <sep-app-root>
npm run lint
npm run lint:scss
npm run test -- --run
npm run build
```

**Verificacao**:
- Suite passa antes de editar.
- Se falha for ambiental ou herdada, registrar evidencia antes de implementar.

### Definicao de pronto da Task F-7.0
- [ ] Branch correta criada.
- [ ] Contratos backend credito/Open Finance confirmados.
- [ ] Estrutura atual do `sep-app` mapeada.
- [ ] Baseline lint/scss/test/build executado e registrado.

---

## Task F-7.1 - Contratos TypeScript, CreditoService e MSW base

**Objetivo**: criar a camada de contrato HTTP de credito/Open Finance, com tipos alinhados ao backend e MSW cobrindo cenarios basicos.

**Pre-requisito**: Task F-7.0 concluida.

**Esforco**: 0.5-1 dia.

**Arquivos principais esperados**:
- `src/app/core/api/api.models.ts`
- `src/app/core/credito/credito.service.ts`
- `src/app/core/credito/credito.service.spec.ts`
- `src/mocks/handlers.ts`
- `src/mocks/data/credito.mock.ts` ou equivalente, se o padrao local aceitar dados separados.

### Step 107.1.1 - Adicionar modelos TypeScript

**Modelos minimos**:
```ts
export type StatusProposta = 'EM_ANALISE' | 'PRE_APROVADA' | 'APROVADA' | 'REJEITADA' | 'PENDENCIA';
export type TipoOperacao = 'CAPITAL_GIRO' | 'OUTROS';
export type StatusConsentimento = 'PENDENTE' | 'AUTORIZADO' | 'NEGADO' | 'EXPIRADO';
export type DecisaoParecer = 'APROVAR' | 'REJEITAR' | 'PENDENCIA';
export type ResultadoRegra = 'PASSOU' | 'FALHOU' | 'PENDENTE';
```

**DTOs esperados**:
- `CriarPropostaRequest`
- `PropostaResponse`
- `ScoreInternoResponse`
- `ParecerCreditoResponse`
- `RegraAvaliadaResponse`
- `IniciarConsentimentoOpenFinanceRequest`
- `IniciarConsentimentoOpenFinanceResponse`
- `OpenFinanceStatusResponse`
- `MovimentacaoConsolidadaResponse`
- `PageResponse<T>` para listar propostas.

**Regras**:
- Datas como `string` ISO no frontend.
- Valores monetarios como `number` ou `string` de DTO, conforme padrao local; evitar `double` sem formatacao na UI.
- Nao criar entidade de dominio frontend para score/proposta; manter DTOs de borda.

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint
```

### Step 107.1.2 - Criar `CreditoService`

**Contrato do service**:
- `criarProposta(request)`
- `listarPropostas(params?)`
- `consultarProposta(id)`
- `listarRegras(id)` quando a UI interna precisar.
- `iniciarConsentimentoOpenFinance(id, request)`
- `consultarOpenFinance(id)`

**Regras**:
- Usar `HttpClient`.
- Query params devem omitir valores vazios.
- Nao interpretar status de proposta ou consentimento como decisao de negocio.
- Nao armazenar snapshot Open Finance localmente fora do estado de componente.
- Nao chamar provider externo diretamente; apenas API SEP.

**Verificacao**:
```bash
cd <sep-app-root>
npm run test -- --run src/app/core/credito/credito.service.spec.ts
```

### Step 107.1.3 - Atualizar MSW

**Cenarios minimos**:
- Listagem de propostas do tomador com `EM_ANALISE`, `PRE_APROVADA`, `APROVADA` e `PENDENCIA`.
- Detalhe de proposta com score e parecer.
- Criacao de proposta sucesso -> `201`.
- Criacao com onboarding nao aprovado -> `422`.
- Consulta de proposta de outro dono -> `403`.
- Open Finance: iniciar consentimento -> `201` com `urlAutorizacao`.
- Open Finance: consentimento pendente existente -> `409`.
- Open Finance: status `AUTORIZADO` com agregados sanitizados.

**Verificacao**:
```bash
cd <sep-app-root>
npm run test -- --run
```

### Definicao de pronto da Task F-7.1
- [ ] Modelos TypeScript alinhados ao backend.
- [ ] `CreditoService` criado e testado.
- [ ] `PageResponse<T>` cobre o formato Spring Page.
- [ ] MSW cobre proposta/Open Finance sucesso e erros principais.
- [ ] Nenhum status/score vira regra local no service.

---

## Task F-7.2 - Rotas, menu e shell da jornada de credito

**Objetivo**: abrir a area autenticada de credito no shell Notion, com navegacao para propostas, nova solicitacao e detalhes.

**Pre-requisito**: Task F-7.1 concluida.

**Esforco**: 0.5 dia.

**Arquivos principais esperados**:
- `src/app/features/authenticated/authenticated.routes.ts`
- `src/app/layout/sidenav/sidenav.component.ts`
- `src/app/layout/sidenav/sidenav.component.html`
- `src/app/features/authenticated/credito/credito.routes.ts`
- `src/app/features/authenticated/credito/credito-home.component.ts`
- `src/app/features/authenticated/credito/credito-home.component.html`
- `src/app/features/authenticated/credito/credito-home.component.scss`
- testes correspondentes.

### Step 107.2.1 - Criar rotas lazy de credito

**Rotas sugeridas**:
```text
/app/credito
/app/credito/propostas
/app/credito/propostas/nova
/app/credito/propostas/:id
/app/credito/propostas/:id/open-finance
/app/credito/propostas/:id/open-finance/retorno
```

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint
npm run test -- --run
```

### Step 107.2.2 - Adicionar entrada no sidenav

**Regras**:
- Entrada "Credito" visivel para `CLIENTE`, `FINANCEIRO` e `ADMIN` quando o role existir no modelo web.
- Se o modelo web ainda aceitar apenas `ADMIN | CLIENTE`, expandir `UsuarioRole` para incluir `FINANCEIRO` somente se backend/web ja retornam esse role.
- Nao criar menu separado para motor, parecer ou Open Finance.
- Nao bloquear `CLIENTE` no frontend se backend ainda e a fonte de ownership.

### Step 107.2.3 - Implementar home da jornada

**Conteudo esperado**:
- Visao compacta com atalhos: "Minhas propostas", "Nova proposta" e "Open Finance" quando houver proposta selecionada/param.
- Sem texto explicativo longo; UI operacional, escaneavel e consistente com Notion.
- Cards ou linhas devem usar dimensoes estaveis e responsivas.

### Definicao de pronto da Task F-7.2
- [ ] Rotas lazy criadas.
- [ ] Menu "Credito" aparece no shell autenticado.
- [ ] Home navegavel para lista, criacao e detalhe.
- [ ] Guards existentes continuam protegendo `/app`.
- [ ] Testes de rota/menu atualizados.

---

## Task F-7.3 - Lista e detalhe de propostas

**Objetivo**: implementar consulta de propostas do tomador e detalhe consolidado de proposta, score e ultimo parecer.

**Pre-requisito**: Tasks F-7.1 e F-7.2 concluidas.

**Esforco**: 1 dia.

**Arquivos principais esperados**:
- `src/app/features/authenticated/credito/propostas/propostas-list-page.component.ts`
- `src/app/features/authenticated/credito/propostas/propostas-list-page.component.html`
- `src/app/features/authenticated/credito/propostas/propostas-list-page.component.scss`
- `src/app/features/authenticated/credito/propostas/propostas-list-page.component.spec.ts`
- `src/app/features/authenticated/credito/propostas/proposta-detail-page.component.ts`
- `src/app/features/authenticated/credito/propostas/proposta-detail-page.component.html`
- `src/app/features/authenticated/credito/propostas/proposta-detail-page.component.scss`
- `src/app/features/authenticated/credito/propostas/proposta-detail-page.component.spec.ts`

### Step 107.3.1 - Implementar listagem

**Campos minimos por item**:
- `id` curto ou fim do UUID.
- `tipoOperacao`.
- `valorSolicitado` + `moeda`.
- `prazoMeses`.
- `status`.
- `dataCriacao`.

**Regras**:
- Usar `GET /api/v1/credito/propostas`.
- `CLIENTE` nao envia `tomadorId`; backend resolve ownership.
- Filtros por `status`, `page` e `size` podem existir.
- Nao mostrar acoes de parecer manual.

### Step 107.3.2 - Implementar detalhe

**Campos minimos**:
- Dados da proposta.
- `score.valor`, `statusSugerido`, `falhas`, `pendencias`, `dataCalculo` quando `score` existir.
- Ultimo `parecer` quando existir: decisao, justificativa, data e versao.
- Link/atalho para Open Finance quando status permitir e o usuario for tomador.

**Regras**:
- Usar `GET /api/v1/credito/propostas/{id}`.
- Nao exibir controles de decisao manual nesta sprint.
- `404/403` devem renderizar estado de erro e link para lista.

### Step 107.3.3 - Estados de carregamento e erro

**Estados minimos**:
- carregando.
- vazio.
- erro `403`.
- erro `404`.
- erro generico.

**Verificacao**:
```bash
cd <sep-app-root>
npm run test -- --run src/app/features/authenticated/credito/propostas
```

### Definicao de pronto da Task F-7.3
- [ ] Lista propostas do tomador.
- [ ] Detalhe exibe proposta, score e parecer.
- [ ] Estados vazio/carregando/erro cobertos.
- [ ] Testes cobrem listagem, detalhe e ownership `403`.
- [ ] Nenhum status e reinterpretado como regra local.

---

## Task F-7.4 - Formulario de solicitacao de credito

**Objetivo**: permitir ao tomador criar proposta a partir de onboarding aprovado, com validacoes basicas de digitacao e tratamento dos erros de pre-condicao do backend.

**Pre-requisito**: Tasks F-7.1 e F-7.2 concluidas.

**Esforco**: 1 dia.

**Arquivos principais esperados**:
- `src/app/features/authenticated/credito/propostas/proposta-create-page.component.ts`
- `src/app/features/authenticated/credito/propostas/proposta-create-page.component.html`
- `src/app/features/authenticated/credito/propostas/proposta-create-page.component.scss`
- `src/app/features/authenticated/credito/propostas/proposta-create-page.component.spec.ts`

### Step 107.4.1 - Formulario de criacao

**Campos**:
- `solicitacaoOnboardingId`.
- `tipoOperacao` (`CAPITAL_GIRO` ou `OUTROS`).
- `valorSolicitado`.
- `prazoMeses`.

**Regras de UI**:
- Validar obrigatoriedade.
- `valorSolicitado > 0`.
- `prazoMeses >= 1`.
- Usar `select` para `tipoOperacao`.
- Nao verificar elegibilidade de onboarding localmente; backend e fonte de verdade.

### Step 107.4.2 - Fluxo apos criacao

**Fluxo**:
- `POST /api/v1/credito/propostas`.
- Ao `201`, navegar para `/app/credito/propostas/{id}`.
- Atualizar MSW para retornar proposta em `EM_ANALISE` ou `PRE_APROVADA` conforme mock.

### Step 107.4.3 - Tratamento de erros

**Erros esperados**:
- `400`: payload invalido.
- `403`: onboarding pertence a outro usuario ou usuario sem role.
- `404`: onboarding inexistente.
- `422`: onboarding nao esta `APROVADO_FINAL`.

**Regra**:
- `422` deve aparecer como pre-condicao de onboarding pendente, sem tentar "corrigir" status no frontend.

**Verificacao**:
```bash
cd <sep-app-root>
npm run test -- --run src/app/features/authenticated/credito/propostas/proposta-create-page.component.spec.ts
```

### Definicao de pronto da Task F-7.4
- [ ] Tomador cria proposta.
- [ ] Form usa enums reais de contrato.
- [ ] `201` navega para detalhe.
- [ ] `422` onboarding nao aprovado tratado de forma clara.
- [ ] Testes cobrem sucesso e pre-condicao backend.

---

## Task F-7.5 - Status de analise, score, parecer e pendencias

**Objetivo**: consolidar componentes/trechos reutilizaveis para apresentar status de proposta, score interno, parecer e pendencias sem duplicar regra de negocio.

**Pre-requisito**: Tasks F-7.3 e F-7.4 concluidas.

**Esforco**: 0.5-1 dia.

**Arquivos principais esperados**:
- `src/app/features/authenticated/credito/shared/proposta-status.component.ts` ou equivalente.
- `src/app/features/authenticated/credito/shared/score-panel.component.ts` ou equivalente.
- `src/app/features/authenticated/credito/shared/parecer-panel.component.ts` ou equivalente.
- testes correspondentes.

### Step 107.5.1 - Componente de status

**Status exibidos**:
- `EM_ANALISE`.
- `PRE_APROVADA`.
- `PENDENCIA`.
- `APROVADA`.
- `REJEITADA`.

**Regras**:
- Status muda visualmente, mas nao habilita transicao de dominio local.
- Usar labels operacionais curtos.
- Nao mostrar "aprovado final" de credito se backend ainda esta em `PRE_APROVADA`.

### Step 107.5.2 - Painel de score

**Campos**:
- `valor`.
- `statusSugerido`.
- `falhas`.
- `pendencias`.
- `dataCalculo`.

**Regras**:
- Score e sugestao sao informativos.
- Nao explicar formula inteira do motor na UI.
- Nao calcular ou recalcular score no web.

### Step 107.5.3 - Painel de parecer

**Campos**:
- `decisao`.
- `justificativa`.
- `scoreMotorSnapshot`.
- `versao`.
- `dataParecer`.

**Regras**:
- Exibir apenas parecer recebido da API.
- Nao criar formulario de parecer.
- Justificativa longa deve quebrar linha sem estourar layout.

### Step 107.5.4 - Regras avaliadas para perfil interno

**Opcional desta sprint**:
- Se a UI autenticar `FINANCEIRO`/`ADMIN`, pode exibir `GET /propostas/{id}/regras`.
- Para `CLIENTE`, nao exibir trilha de regras salvo decisao documental futura.

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint
npm run test -- --run src/app/features/authenticated/credito
```

### Definicao de pronto da Task F-7.5
- [ ] Status exibido sem reinterpretacao de regra.
- [ ] Score apresentado como informativo.
- [ ] Parecer apresentado quando existir.
- [ ] Layout responsivo nao sobrepoe textos longos.
- [ ] Testes cobrem status, score ausente e parecer ausente/presente.

---

## Task F-7.6 - Fluxo Open Finance, redirect/status, MSW, smoke e documentacao

**Objetivo**: implementar o ciclo Open Finance opt-in no web: iniciar consentimento, abrir URL de autorizacao, tratar retorno visual e consultar status/agregados.

**Pre-requisito**: Tasks F-7.1-F-7.5 concluidas.

**Esforco**: 1-1.5 dia.

**Arquivos principais esperados**:
- `src/app/features/authenticated/credito/open-finance/open-finance-page.component.ts`
- `src/app/features/authenticated/credito/open-finance/open-finance-page.component.html`
- `src/app/features/authenticated/credito/open-finance/open-finance-page.component.scss`
- `src/app/features/authenticated/credito/open-finance/open-finance-page.component.spec.ts`
- `src/mocks/handlers.ts`
- `e2e/` smoke quando aplicavel.
- `docs-SEP/repos/sep-app/` doc operacional se o fluxo precisar ser registrado.

### Step 107.6.1 - Iniciar consentimento

**Campos**:
- `cpfCnpjTomador` com 11 ou 14 digitos puros.
- `redirectUri` gerado pela aplicacao para rota de retorno do web.

**Regras**:
- Validar formato basico no form.
- `redirectUri` deve ser `http(s)` e controlado pela aplicacao.
- Usar `POST /api/v1/credito/propostas/{id}/open-finance/consentimento`.
- Ao `201`, abrir `urlAutorizacao` em nova aba ou navegar explicitamente conforme decisao UX da sprint.

### Step 107.6.2 - Rota de retorno

**Comportamento esperado**:
- Rota `/app/credito/propostas/:id/open-finance/retorno` mostra estado de retorno e orienta consulta de status.
- Nao consumir query params do provider como fonte de verdade.
- Refresh chama `GET /api/v1/credito/propostas/{id}/open-finance`.

### Step 107.6.3 - Consultar status Open Finance

**Status exibidos**:
- `PENDENTE`.
- `AUTORIZADO`.
- `NEGADO`.
- `EXPIRADO`.

**Agregados exibidos quando existirem**:
- `mediaEntradasMensal`.
- `mediaSaidasMensal`.
- `saldoMedio`.
- `numeroMesesAvaliados`.
- `dataRecebimento`.

**Cuidados LGPD**:
- Nao exibir payload bruto.
- Nao exibir transacoes, conta, agencia, titular, CPF/CNPJ ou identificadores bancarios.
- Nao persistir agregados em storage local.

### Step 107.6.4 - Erros e estados

**Erros esperados**:
- `400`: CPF/CNPJ ou redirect invalido.
- `403`: proposta de outro tomador.
- `404`: proposta ou consentimento nao encontrado.
- `409`: ja existe consentimento pendente.
- `422`: proposta final/incompativel.

**Regra**:
- `409` deve virar estado "consentimento pendente" com acao de consultar status.

### Step 107.6.5 - Smoke e validacao final

**Comandos**:
```bash
cd <sep-app-root>
npm run lint
npm run lint:scss
npm run test -- --run
npm run build
```

**Smoke manual com MSW/dev-offline**:
- Login.
- Abrir `/app/credito`.
- Listar propostas.
- Criar proposta fake.
- Abrir detalhe.
- Iniciar Open Finance.
- Voltar para status e ver agregados autorizados no mock.

**Smoke com backend real quando disponivel**:
- Usar proposta existente de tomador autenticado.
- Criar consentimento Open Finance com provider `fake`.
- Consultar status apos webhook/listener quando o ambiente estiver preparado.

### Step 107.6.6 - Atualizacao documental

**Docs a revisar**:
- `docs-SEP/docs-sep/PRD-FASE-3.md`.
- `docs-SEP/docs-sep/CONTEXT-PARTE-2.md`.
- `docs-SEP/AI-ROADMAP.md`.
- `docs-SEP/repos/sep-app/README.md` ou doc operacional dedicado se houver padrao local para fluxo web.

**Regras**:
- Atualizar docs somente quando a sprint for concluida/mergeada ou quando houver mudanca de contrato/escopo.
- Nao criar `docs/` dentro de `sep-app`.
- Nao manter arquivo temporario `SPRINT-*-PR.md` como referencia permanente.

### Definicao de pronto da Task F-7.6
- [x] Open Finance inicia consentimento.
- [x] `urlAutorizacao` e tratada como handoff externo.
- [x] Retorno visual consulta status pela API SEP.
- [x] Agregados exibidos sem PII bancario.
- [x] MSW cobre `PENDENTE`, `AUTORIZADO`, `409`, `403` e `404`.
- [x] Lint/scss/test/build verdes ou falhas registradas.
- [x] Docs revisadas quando a sprint for concluida.

---

## Definition of Done da F-Sprint 7

- [x] Jornada de credito navegavel no web autenticado.
- [x] Tomador lista, cria e consulta suas propostas.
- [x] Detalhe exibe status, score e parecer sem regra de decisao local.
- [x] Open Finance inicia consentimento e consulta status/agregados via API SEP.
- [x] Nenhum dado bancario bruto ou PII de Open Finance e exibido/persistido no frontend.
- [x] MSW cobre fluxos felizes e erros principais.
- [x] Testes unitarios/componentes proporcionais verdes.
- [x] `npm run lint`, `npm run lint:scss`, `npm run test -- --run` e `npm run build` executados no fechamento.
- [x] PRD/CONTEXT/AI-ROADMAP/docs operacionais revisados no fechamento da sprint.
- [x] PR description temporaria criada em `docs-SEP/repos/sep-app/SPRINT-F-7-PR.md` somente no fim da sprint se o PR real precisar.

## Checklist de code review da F-Sprint 7

- [x] `CreditoService` nao calcula regra, score, elegibilidade ou decisao.
- [x] Componentes nao inferem aprovacao/rejeicao alem do status retornado.
- [x] Open Finance usa apenas API SEP e nao provider direto.
- [x] `redirectUri` nao aceita scheme inseguro.
- [x] Dados Open Finance sao apenas agregados sanitizados.
- [x] `CLIENTE` nao consegue enviar `tomadorId` para listar terceiros.
- [x] Erros `403/404/409/422` tem estados de UI claros.
- [x] Tests cobrem sucesso, ownership e pre-condicoes.
- [x] Layout Notion responsivo sem cards aninhados e sem textos estourando.
- [x] Docs/roadmap atualizados quando comportamento ou caminhos documentais mudarem.
