# Steps - F-Sprint 10 - Backoffice e Financeiro Web

**Spec de origem**: [`specs/fase-3/110-fsprint-10-backoffice-financeiro-web.md`](../../specs/fase-3/110-fsprint-10-backoffice-financeiro-web.md)

**Status**: planejada.

**Objetivo geral**: implementar no `sep-app` a operacao assistida web para `BACKOFFICE`, `FINANCEIRO` e `ADMIN`, consumindo os endpoints reais do modulo `backoffice` do `sep-api` (Sprint 14 e extensoes Pix das Sprints 20-21), com fila operacional, comentarios internos, resolucao/ignore com step-up, reprocessos permitidos e dashboard consolidado, sem duplicar regras de transicao, ownership, auditoria, anti-abuso ou logica de provider no frontend.

**Esforco total estimado**: 5-7 dias de Dev Pleno Frontend.

**Repo de destino**:
- `sep-app`: Angular web, repo de codigo alterado nesta sprint.
- `docs-SEP`: documentacao editada no working tree quando necessario; operacao git continua manual.

**Branch sugerida**:
- `feature/fsprint-10-backoffice-financeiro-web`

**Pre-requisitos globais**:
- `sep-app/develop` atualizado apos F-Sprint 9.
- F-Sprints 0-9 concluidas: shell autenticado Notion, guards, interceptors, MSW, Vitest, step-up, `UsuarioRole` com `FINANCEIRO`/`BACKOFFICE`, cobranca financeira e inadimplencia navegaveis.
- `sep-api/develop` ou `main` com Sprint backend 14 mergeada e, se o ambiente incluir Pix, Sprints 20-21 mergeadas para itens `DESEMBOLSO_PIX_FALHOU` e `RECEBIMENTO_PIX_DIVERGENTE`.
- Backend local disponivel em `http://localhost:8080` quando for validar smoke real.
- Docs de referencia: `repos/sep-api/BACKOFFICE.md`, `repos/sep-api/COBRANCA.md`, `repos/sep-api/PIX.md`, `docs-sep/WEB-SCREENS-PLAN.md`, `docs-sep/DESIGN-notion.md`, `docs-sep/SEGURANCA.md`.

**Contratos backend consumidos**:

Backoffice (`/api/v1/backoffice`):
- `GET /api/v1/backoffice/dashboard` -> `DashboardResponse`, `FINANCEIRO`/`BACKOFFICE`/`ADMIN`, `Cache-Control: no-store`.
- `GET /api/v1/backoffice/fila` query `tipo?`, `prioridade?`, `status?`, `data_abertura_de?`, `data_abertura_ate?`, `atribuido_a?`, `page?`, `size?`, `sort?` -> `Page<ItemFilaResponse>`, `FINANCEIRO`/`BACKOFFICE`/`ADMIN`.
- `GET /api/v1/backoffice/fila/{id}` -> `ItemFilaDetalheResponse`, com comentarios e `ObjetoOriginalResponse`.
- `POST /api/v1/backoffice/fila/{id}/assumir` body vazio -> `200 ItemFilaResponse`.
- `POST /api/v1/backoffice/fila/{id}/comentarios` body `ComentarioRequest` -> `201 ComentarioInternoResponse`.
- `PATCH /api/v1/backoffice/fila/{id}/resolver` body `ResolverRequest` -> `200 ItemFilaResponse`, exige step-up.
- `PATCH /api/v1/backoffice/fila/{id}/ignorar` body `IgnorarRequest` -> `200 ItemFilaResponse`, exige step-up.
- `POST /api/v1/backoffice/reprocessos/webhook/{webhookEventId}` body opcional `ReprocessoRequest` -> `201 ReprocessoResponse`, exige step-up, anti-abuso `429`.
- `POST /api/v1/backoffice/reprocessos/provider/{tipoChamada}/{entidadeId}` body opcional `ReprocessoRequest` -> `201 ReprocessoResponse`, exige step-up, anti-abuso `429`, `400` para tipo nao suportado.

**DTOs esperados no frontend**:
- `ItemFilaResponse`: `id`, `tipo`, `prioridade`, `status`, `tipoEntidade`, `entidadeId`, `titulo`, `atribuidoA`, `dataAbertura`, `dataResolucao`.
- `ItemFilaDetalheResponse`: campos de `ItemFilaResponse` + `descricao`, `comentarios`, `objetoOriginal`.
- `ComentarioInternoResponse`: `id`, `autorId`, `conteudo`, `dataCriacao`.
- `ComentarioRequest`: `conteudo`.
- `ResolverRequest` / `IgnorarRequest`: `justificativa` (minimo backend: 20 chars; maximo: 10000).
- `ReprocessoRequest`: `itemId` opcional.
- `ReprocessoResponse`: `id`, `itemId`, `tipo`, `tipoChamada`, `identificadorExterno`, `status`, `resultado`, `dataDisparo`, `disparadoPor`.
- `ObjetoOriginalResponse`: `tipoEntidade`, `entidadeId`, `status`, `descricaoCurta`.
- `DashboardResponse`: `contadoresPorTipo`, `contadoresPorPrioridade`, `contadoresPorStatus`, `tempoMedioResolucao30d`, `itensCriticosAbertosMais48h`, `topCincoTiposMaisFrequentes`, `recebimentosDoDia`, `inadimplenciaTotal`, `propostasPorStatus`, `geradoEm`.

**Enums esperados**:
- `TipoItemFila`: `ONBOARDING_PENDENTE`, `ONBOARDING_ERRO`, `PROPOSTA_PENDENTE`, `CONTRATO_NAO_ASSINADO`, `COBRANCA_INADIMPLENTE`, `WEBHOOK_FALHOU`, `DESEMBOLSO_PIX_FALHOU`, `RECEBIMENTO_PIX_DIVERGENTE`, `OUTRO`.
- `PrioridadeItem`: `BAIXA`, `MEDIA`, `ALTA`, `CRITICA`.
- `StatusItemFila`: `ABERTO`, `EM_TRATAMENTO`, `RESOLVIDO`, `IGNORADO`.
- `TipoEntidadeReferenciada`: `ONBOARDING`, `PROPOSTA`, `CONTRATO`, `PARCELA_COBRANCA`, `WEBHOOK_EVENT_LOG`, `PIX_TRANSFERENCIA`, `PIX_RECEBIMENTO`, `OUTRO`.
- `TipoChamadaProvider`: `KYC`, `KYB`, `PLD`, `OPEN_FINANCE`, `ASSINATURA_DIGITAL`, `PIX_TRANSFERENCIA`.
- `StatusReprocesso`: `PENDENTE`, `SUCESSO`, `FALHA`.
- `TipoReprocesso`: `WEBHOOK`, `PROVIDER`.

**Decisoes da sprint**:
- Frontend apresenta fila, dashboard, comentarios, justificativas e resultado de reprocesso; transicoes de status, validacao de estado, audit trail, anti-abuso e autorizacao real pertencem ao backend.
- `BACKOFFICE`, `FINANCEIRO` e `ADMIN` acessam a feature; `CLIENTE` nao ve menu nem acessa rotas por guard. A seguranca real segue no backend.
- `resolver`, `ignorar`, `reprocessar webhook` e `reprocessar provider` exigem step-up. O token deve ser anexado pelo `stepUpInterceptor`; nao enviar manualmente em componente/service.
- Reprocesso de provider deve respeitar o que o backend suporta. `PIX_TRANSFERENCIA` tem handler real e seguro de reconsulta de status; `KYC`, `KYB`, `PLD`, `OPEN_FINANCE` e `ASSINATURA_DIGITAL` podem ser stubs controlados no backend. A UI deve sinalizar isso sem prometer retentativa real quando o backend nao garante.
- `RECEBIMENTO_PIX_DIVERGENTE` nao tem reprocesso de provider. O tratamento e assistido: assumir, comentar, resolver ou ignorar.
- Lista de fila usa pagina backend. Nao criar cache local para simular paginacao, ordenacao ou contadores.
- Conteudo de comentario e justificativa pode conter dado operacional sensivel. Nao persistir em `localStorage`/`sessionStorage`; manter apenas estado de formulario em memoria.

**Fora de escopo da sprint**:
- Backoffice mobile.
- BI externo, export CSV/PDF, graficos avancados ou alertas SLA proativos.
- Atribuicao automatica/round-robin.
- Criar handlers de reprocesso no frontend ou compensar stubs do backend.
- Editar parametros operacionais do backend.
- Expor payload bruto de webhook/provider, dados bancarios, documento completo, chave Pix ou segredo operacional.

**Protocolo obrigatorio por Task**:
- Implementar somente a Task liberada pelo usuario.
- Ao concluir implementacao e verificacao da Task, parar em checkpoint pre-commit com arquivos alterados, testes executados, riscos e sugestao de commit.
- Aguardar `commit` ou aprovacao equivalente antes de stage/commit.
- Usar `git add <paths-especificos>`, nunca `git add -A`.
- Fazer um code review da Task quando solicitado pelo usuario; se houver hotfix, implementar em novo checkpoint.
- Ao final da Task, pausar para review manual do usuario. Nao iniciar a proxima Task sem ordem explicita.

**Skills obrigatorias na implementacao**:
- `coding-guidelines`: pensar antes, simplicidade, mudancas cirurgicas, execucao orientada a meta.
- `clean-code`: nomes intencionais, componentes pequenos, sem comentarios ruidosos, testes F.I.R.S.T.
- `clean-architecture`: componentes chamam services; regra operacional fica no backend; modelos TypeScript sao DTOs de borda, nao entidades de dominio duplicadas.

---

## Protocolo de breakpoints recomendado

```text
C1 = F-10.0 + F-10.1
Prechecks + modelos/BackofficeService/MSW base

C2 = F-10.2
Rotas, menu e shell operacional

C3 = F-10.3
Dashboard operacional/financeiro

C4 = F-10.4
Fila operacional com filtros e detalhe

C5 = F-10.5
Acoes de fila: assumir, comentar, resolver e ignorar

C6 = F-10.6
Reprocessos com step-up

C7 = F-10.7
Smoke, docs e fechamento
```

- C1 fecha contrato antes de UI.
- C2 abre navegacao sem fluxo parcial escondido.
- C3 entrega visao de acompanhamento sem acao sensivel.
- C4 entrega leitura e triagem da fila.
- C5 isola transicoes auditaveis com step-up.
- C6 isola reprocessos e anti-abuso.
- C7 fecha validacao final e documentacao.

---

## Task F-10.0 - Prechecks da F-Sprint 10

**Objetivo**: confirmar base Git, scripts, contratos backend e arquitetura atual do `sep-app`.

**Esforco**: 1-2 horas.

### Step 110.0.1 - Conferir estado Git do `sep-app`

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
- F-Sprint 9 presente no historico.

### Step 110.0.2 - Criar branch da sprint

**Comandos**:
```bash
cd <sep-app-root>
git switch develop
git pull --ff-only
git switch -c feature/fsprint-10-backoffice-financeiro-web
```

**Verificacao**:
- Branch criada a partir de `develop` atualizado.
- Se `git pull --ff-only` falhar, abortar e avisar o usuario.

### Step 110.0.3 - Mapear estrutura atual do frontend

**Comandos**:
```bash
cd <sep-app-root>
find src/app/core -maxdepth 3 -type f | sort
find src/app/features/authenticated -maxdepth 5 -type f | sort
find src/app/layout -maxdepth 3 -type f | sort
find src/mocks -maxdepth 3 -type f | sort
sed -n '1,420p' src/app/core/api/api.models.ts
sed -n '1,260p' src/app/features/authenticated/authenticated.routes.ts
sed -n '1,220p' src/app/layout/sidenav/sidenav.component.ts
grep -R "UsuarioRole\\|BACKOFFICE\\|FINANCEIRO\\|roleGuard" -n src/app src/mocks
grep -R "step-up\\|StepUp\\|X-Step-Up-Token" -n src/app src/mocks
```

**Verificacao**:
- `UsuarioRole` inclui `FINANCEIRO` e `BACKOFFICE`.
- `roleGuard` aceita `data.roles: ['FINANCEIRO', 'BACKOFFICE', 'ADMIN']` sem cast ou `any`.
- Shell autenticado Notion e sidenav localizados.
- Fluxo step-up existente localizado antes de qualquer Task sensivel.
- MSW disponivel para `dev-offline`.

### Step 110.0.4 - Confirmar contratos reais do backend

**Comandos**:
```bash
cd <sep-api-root>
grep -R "class BackofficeController\\|class BackofficeReprocessoController\\|class BackofficeDashboardController" -n src/main/java
find src/main/java/com/dynamis/sep_api/backoffice/web/dto -type f | sort
sed -n '1,260p' src/main/java/com/dynamis/sep_api/backoffice/web/controller/BackofficeController.java
sed -n '1,220p' src/main/java/com/dynamis/sep_api/backoffice/web/controller/BackofficeReprocessoController.java
sed -n '1,160p' src/main/java/com/dynamis/sep_api/backoffice/web/controller/BackofficeDashboardController.java
sed -n '1,120p' src/main/java/com/dynamis/sep_api/backoffice/domain/vo/TipoChamadaProvider.java
```

**Verificacao**:
- Endpoints, metodos, status HTTP e DTOs batem com a secao "Contratos backend consumidos".
- `resolver`, `ignorar`, `reprocessos/webhook` e `reprocessos/provider` usam `@RequireStepUp`.
- `GET /dashboard` retorna `Cache-Control: no-store`.
- `TipoChamadaProvider` confirma se `PIX_TRANSFERENCIA` esta disponivel no backend alvo.

### Step 110.0.5 - Rodar baseline web

**Comandos**:
```bash
cd <sep-app-root>
npm run test -- --run
npm run lint -- --quiet
npm run lint:scss
npm run build
```

**Verificacao**:
- Suite passa antes de alteracao funcional.
- Warnings preexistentes registrados sem tratar como falha se ja eram conhecidos.

### Definicao de pronto da Task F-10.0
- [ ] Branch correta criada.
- [ ] Baseline web verde com contagem registrada.
- [ ] Contratos backend confirmados.
- [ ] Gaps reais registrados antes de iniciar UI.

---

## Task F-10.1 - BackofficeService, modelos e MSW base

**Objetivo**: criar a borda de API da feature backoffice sem UI complexa, com modelos TypeScript fieis aos DTOs backend e mocks suficientes para desenvolvimento offline.

**Pre-requisito**: Task F-10.0 concluida.

**Esforco**: 1 dia.

### Step 110.1.1 - Criar modelos de backoffice

**Arquivos provaveis**:
- `src/app/core/api/api.models.ts`
- ou arquivo local seguindo padrao existente, se o projeto separar modelos por feature.

**Implementacao**:
- Adicionar unions para `TipoItemFila`, `PrioridadeItem`, `StatusItemFila`, `TipoEntidadeReferenciada`, `TipoChamadaProvider`, `StatusReprocesso` e `TipoReprocesso`.
- Adicionar interfaces para `ItemFilaResponse`, `ItemFilaDetalheResponse`, `ComentarioInternoResponse`, `ComentarioRequest`, `ResolverRequest`, `IgnorarRequest`, `ReprocessoRequest`, `ReprocessoResponse`, `ObjetoOriginalResponse` e `DashboardResponse`.
- Modelar `Page<T>` ou reusar tipo paginado existente, preservando campos do Spring (`content`, `totalElements`, `totalPages`, `number`, `size`, etc.) conforme resposta real usada pelo app.
- Datas ficam como `string` ISO na borda de API; formatacao pertence a componente/helper de apresentacao.
- Valores monetarios ficam como `number` apenas para exibicao.

**Verificacao**:
- Nenhum modelo cria metodo calculado para SLA, prioridade, status ou permissao de transicao.
- Campos opcionais refletem nullable real do backend (`atribuidoA`, `dataResolucao`, `objetoOriginal`, `itemId`, `tipoChamada`), nao conveniencia visual.

### Step 110.1.2 - Criar `BackofficeService`

**Arquivos provaveis**:
- `src/app/core/backoffice/backoffice.service.ts`
- `src/app/core/backoffice/backoffice.service.spec.ts`

**Metodos minimos**:
- `consultarDashboard()`.
- `listarFila(filtros, page)`.
- `consultarItem(id)`.
- `assumirItem(id)`.
- `registrarComentario(itemId, request)`.
- `resolverItem(itemId, request)`.
- `ignorarItem(itemId, request)`.
- `reprocessarWebhook(webhookEventId, request?)`.
- `reprocessarProvider(tipoChamada, entidadeId, request?)`.

**Regras de implementacao**:
- Usar `HttpClient` e configuracao de base URL ja existente.
- Operacoes com step-up devem seguir o padrao existente do `StepUpTokenStore` + `stepUpInterceptor`; o service nao recebe token como parametro.
- Nao chamar endpoint backoffice diretamente a partir de componente.
- Query params de fila devem usar nomes reais: `data_abertura_de`, `data_abertura_ate`, `atribuido_a`.
- Omitir filtros vazios para nao enviar parametros em branco.

**Verificacao**:
- Specs validam URL, metodo HTTP, query params e body esperado.
- Specs validam que chamadas sensiveis falham com `403` no MSW sem `X-Step-Up-Token`.
- Nenhum service calcula contadores do dashboard.

### Step 110.1.3 - Adicionar fixtures MSW de backoffice

**Arquivos provaveis**:
- `src/mocks/handlers.ts`
- `src/mocks/data/backoffice.mock.ts` ou padrao equivalente.

**Cenarios minimos**:
- Usuario `backoffice@empresa.com` com role `BACKOFFICE` no login mock (`senha 123456`).
- `GET /backoffice/dashboard` com contadores por tipo/prioridade/status, recebimentos do dia, inadimplencia consolidada e propostas por status.
- `GET /backoffice/fila` com itens `ABERTO`, `EM_TRATAMENTO`, `RESOLVIDO` e `IGNORADO`, prioridades variadas e filtros basicos.
- `GET /backoffice/fila/{id}` com comentarios e `objetoOriginal`.
- `POST /fila/{id}/assumir` transiciona item `ABERTO` para `EM_TRATAMENTO`; `409` para final ou ja assumido.
- `POST /fila/{id}/comentarios` retorna `201`; `400` para conteudo vazio.
- `PATCH /fila/{id}/resolver` e `/ignorar` exigem `X-Step-Up-Token`, justificativa >= 20 chars e retornam `409` em transicao invalida.
- `POST /reprocessos/webhook/{id}` e `/provider/{tipo}/{id}` exigem `X-Step-Up-Token`, retornam `201` e simulam `429` no 4o reprocesso para a mesma entidade.
- `CLIENTE` recebe `403` em rotas backoffice quando o mock depender de usuario atual.

**Verificacao**:
- MSW nao mascara exigencia de step-up.
- Fixture nao armazena payload bruto de webhook/provider, CPF/CNPJ completo, chave Pix, dados bancarios ou tokens.

### Step 110.1.4 - Testar service e mocks

**Comandos**:
```bash
cd <sep-app-root>
npm run test -- --run backoffice
npm run lint -- --quiet
npm run lint:scss
```

**Verificacao**:
- `BackofficeService` coberto.
- Tipos compilaram sem `any` desnecessario.

### Step 110.1.5 - Checkpoint C1

**Entregaveis**:
- Modelos de backoffice.
- `BackofficeService`.
- MSW base.
- Specs do service.

**Pausa obrigatoria**:
- Review da Task F-10.1 antes de criar telas.

---

## Task F-10.2 - Rotas, menu e shell operacional

**Objetivo**: tornar backoffice acessivel no shell autenticado para `BACKOFFICE`, `FINANCEIRO` e `ADMIN`, sem expor a feature a `CLIENTE`.

**Pre-requisito**: Task F-10.1 concluida.

**Esforco**: 0,5-1 dia.

### Step 110.2.1 - Criar feature e rotas de backoffice

**Arquivos provaveis**:
- `src/app/features/authenticated/backoffice/backoffice.routes.ts`
- `src/app/features/authenticated/backoffice/backoffice-shell.component.ts`
- `.html` e `.scss` correspondentes.
- `src/app/features/authenticated/authenticated.routes.ts`

**Rotas sugeridas**:
- `/app/backoffice`
- `/app/backoffice/dashboard`
- `/app/backoffice/fila`
- `/app/backoffice/fila/:id`
- `/app/backoffice/reprocessos`

**Implementacao**:
- Criar route group `backoffice` com `canActivate: [roleGuard]` e `data.roles: ['BACKOFFICE', 'FINANCEIRO', 'ADMIN']`.
- Rota default redireciona para `dashboard` ou shell com cards navegaveis.
- Adicionar breadcrumbs coerentes.
- Usar lazy loading de componentes.

**Verificacao**:
- `CLIENTE` recebe `/access-denied`.
- `BACKOFFICE`, `FINANCEIRO` e `ADMIN` acessam rotas.
- Nenhuma rota backoffice fica fora do guard.

### Step 110.2.2 - Adicionar menu no sidenav

**Arquivos provaveis**:
- `src/app/layout/sidenav/sidenav.component.ts`
- `src/app/layout/sidenav/sidenav.component.spec.ts`

**Implementacao**:
- Adicionar item `Backoffice` apontando para `/app/backoffice`.
- Exibir apenas para roles `BACKOFFICE`, `FINANCEIRO` e `ADMIN`.
- Manter `Administracao` restrito a `ADMIN`.

**Verificacao**:
- `BACKOFFICE` ve `Backoffice`, mas nao ve `Administracao`.
- `FINANCEIRO` ve `Backoffice` e fluxos financeiros ja autorizados.
- `CLIENTE` nao ve `Backoffice`.

### Step 110.2.3 - Criar shell operacional

**Implementacao**:
- Shell com entradas para Dashboard, Fila e Reprocessos.
- Cards/links devem ser navegaveis; nao usar placeholder sem rota quando o fluxo ja esta nesta sprint.
- Conteudo deve ser denso, operacional e coerente com design Notion autenticado.

**Verificacao**:
- Todos os links apontam para rotas existentes.
- Shell nao mostra texto educativo longo; deve ser ferramenta operacional.

### Step 110.2.4 - Checkpoint C2

**Entregaveis**:
- Rotas protegidas.
- Sidenav atualizado.
- Shell navegavel.
- Specs de guard/menu/shell.

**Pausa obrigatoria**:
- Review da Task F-10.2 antes de implementar dashboard.

---

## Task F-10.3 - Dashboard operacional e financeiro

**Objetivo**: exibir a visao consolidada do backoffice sem cache local inseguro e sem recalcular metricas do backend.

**Pre-requisito**: Task F-10.2 concluida.

**Esforco**: 1 dia.

### Step 110.3.1 - Criar pagina de dashboard

**Arquivos provaveis**:
- `src/app/features/authenticated/backoffice/pages/backoffice-dashboard-page.component.ts`
- `.html`, `.scss` e `.spec.ts`.
- Helpers de formatacao locais, se necessario.

**Implementacao**:
- Carregar `GET /backoffice/dashboard`.
- Exibir:
  - contadores por status, prioridade e tipo;
  - tempo medio de resolucao 30d;
  - itens criticos abertos ha mais de 48h;
  - top cinco tipos mais frequentes;
  - recebimentos do dia;
  - inadimplencia consolidada;
  - propostas por status;
  - `geradoEm`.
- Tratar `401/403` via interceptors/guards existentes; `5xx` vira estado de erro com retry.
- Nao persistir resposta em storage. O backend envia `no-store`.

**Verificacao**:
- UI nao soma contadores para substituir resposta backend; apenas apresenta.
- Falha no endpoint nao quebra o shell autenticado.
- `BACKOFFICE` acessa dashboard.

### Step 110.3.2 - Testar dashboard

**Cenarios minimos**:
- Renderiza contadores e valores monetarios vindos do MSW.
- Estado de erro com retry.
- Role `CLIENTE` nao acessa a rota.

**Comandos**:
```bash
cd <sep-app-root>
npm run test -- --run backoffice-dashboard role.guard sidenav
```

### Step 110.3.3 - Checkpoint C3

**Entregaveis**:
- Dashboard operacional/financeiro.
- Specs principais.

**Pausa obrigatoria**:
- Review da Task F-10.3 antes de implementar fila.

---

## Task F-10.4 - Fila operacional com filtros e detalhe

**Objetivo**: permitir triagem dos itens de backoffice com filtros, paginacao e leitura do objeto original resumido.

**Pre-requisito**: Task F-10.3 concluida.

**Esforco**: 1-1,5 dia.

### Step 110.4.1 - Criar lista da fila

**Arquivos provaveis**:
- `src/app/features/authenticated/backoffice/pages/fila-operacional-page.component.ts`
- `.html`, `.scss` e `.spec.ts`.

**Implementacao**:
- Consumir `GET /backoffice/fila`.
- Filtros:
  - `tipo`;
  - `prioridade`;
  - `status`;
  - `data_abertura_de`;
  - `data_abertura_ate`;
  - `atribuido_a`.
- Paginacao baseada no `Page<ItemFilaResponse>` do backend.
- Sort somente quando suportado pelo backend. Evitar sort manual local para prioridade.
- Lista deve destacar prioridade, status, data de abertura, titulo e atribuicao.
- Link para detalhe `/app/backoffice/fila/:id`.

**Verificacao**:
- Filtros vazios nao viram query param vazio.
- Mudanca de filtro reseta para a primeira pagina.
- `409` nao ocorre em leitura; `400` de query invalida vira mensagem clara.

### Step 110.4.2 - Criar detalhe do item

**Arquivos provaveis**:
- `src/app/features/authenticated/backoffice/pages/item-fila-detail-page.component.ts`
- `.html`, `.scss` e `.spec.ts`.

**Implementacao**:
- Consumir `GET /backoffice/fila/{id}`.
- Exibir campos do item, descricao, comentarios e `objetoOriginal`.
- Apresentar apenas resumo do objeto original (`status`, `descricaoCurta`), sem tentar buscar payload bruto em modulo de origem.
- Mostrar acoes disponiveis por status:
  - `ABERTO`: assumir, comentar, ignorar;
  - `EM_TRATAMENTO`: comentar, resolver, ignorar;
  - `RESOLVIDO`/`IGNORADO`: leitura e comentario, se backend permitir comentario final.
- A visibilidade das acoes e UX; transicao real segue no backend e pode retornar `409`.

**Verificacao**:
- `404` vira estado "item nao encontrado".
- Nao expor CPF/CNPJ completo, chave Pix, payload provider ou conteudo bruto de webhook.

### Step 110.4.3 - Testar fila e detalhe

**Cenarios minimos**:
- Lista carregada com filtros e paginacao.
- Link da lista abre detalhe.
- Detalhe mostra comentarios e objeto original.
- Estados finais nao mostram acoes indevidas de resolver/ignorar.
- `404` tratado.

### Step 110.4.4 - Checkpoint C4

**Entregaveis**:
- Lista/filtros/paginacao.
- Detalhe do item.
- Specs principais.

**Pausa obrigatoria**:
- Review da Task F-10.4 antes de implementar acoes.

---

## Task F-10.5 - Acoes da fila: assumir, comentar, resolver e ignorar

**Objetivo**: permitir que operador conduza o fluxo assistido com comentarios e justificativas auditaveis.

**Pre-requisito**: Task F-10.4 concluida.

**Esforco**: 1-1,5 dia.

### Step 110.5.1 - Implementar assumir item

**Implementacao**:
- Botao `Assumir` chama `POST /backoffice/fila/{id}/assumir`.
- Desabilitar botao durante envio.
- Apos sucesso, recarregar detalhe e lista quando aplicavel.
- Tratar `409` como "item ja foi assumido ou nao esta mais aberto" e recarregar detalhe.

**Verificacao**:
- Duplo clique nao dispara duas tentativas simultaneas.
- `BACKOFFICE` consegue assumir no MSW.

### Step 110.5.2 - Implementar comentario interno

**Implementacao**:
- Form curto com `conteudo`, max visual 10000 chars.
- Chamar `POST /backoffice/fila/{id}/comentarios`.
- Apos sucesso, limpar form e recarregar comentarios.
- Nao salvar rascunho em storage.

**Verificacao**:
- Conteudo vazio bloqueado no frontend e `400` tratado se backend rejeitar.
- Comentario aparece na lista apos sucesso.

### Step 110.5.3 - Implementar resolver e ignorar com step-up

**Implementacao**:
- Formularios/modais com `justificativa` e minimo visual de 20 chars.
- `Resolver` chama `PATCH /backoffice/fila/{id}/resolver`.
- `Ignorar` chama `PATCH /backoffice/fila/{id}/ignorar`.
- Sem token step-up, `403` deve redirecionar para `/app/step-up?next=<rota-atual>` pelo padrao existente.
- Com step-up valido, `stepUpInterceptor` anexa `X-Step-Up-Token`.
- Apos sucesso, recarregar item e lista.

**Verificacao**:
- `step-up.interceptor.ts` deve incluir:
  - `PATCH /backoffice/fila/{id}/resolver`;
  - `PATCH /backoffice/fila/{id}/ignorar`.
- `step-up.interceptor.spec.ts` cobre as duas URLs.
- `409` de transicao invalida mostra mensagem e recarrega estado real.

### Step 110.5.4 - Testar acoes sensiveis

**Cenarios minimos**:
- Assumir item com sucesso.
- Comentario retorna `201` e aparece no detalhe.
- Resolver sem step-up redireciona para confirmacao adicional.
- Resolver com step-up envia header e atualiza status.
- Ignorar com step-up envia header e atualiza status.
- Justificativa curta mostra erro claro.
- `409` recarrega item.

### Step 110.5.5 - Checkpoint C5

**Entregaveis**:
- Acoes de fila.
- Step-up interceptor estendido.
- Specs das operacoes sensiveis.

**Pausa obrigatoria**:
- Review da Task F-10.5 antes de implementar reprocessos.

---

## Task F-10.6 - Reprocessos com step-up

**Objetivo**: permitir disparo de reprocessos suportados pelo backend, com step-up e anti-abuso tratados pela UI.

**Pre-requisito**: Task F-10.5 concluida.

**Esforco**: 1 dia.

### Step 110.6.1 - Criar painel/form de reprocessos

**Arquivos provaveis**:
- `src/app/features/authenticated/backoffice/pages/reprocessos-page.component.ts`
- `.html`, `.scss` e `.spec.ts`.

**Implementacao**:
- Criar abas ou segmented control para:
  - webhook: `webhookEventId` + `itemId` opcional;
  - provider: `tipoChamada`, `entidadeId` + `itemId` opcional.
- Opcoes de `tipoChamada` devem vir de union local alinhada ao backend. Incluir `PIX_TRANSFERENCIA` se backend alvo tiver esse enum.
- Para `RECEBIMENTO_PIX_DIVERGENTE`, orientar fluxo para item da fila; nao oferecer provider reprocesso.
- Mostrar resultado retornado por `ReprocessoResponse`: status, resultado, tipo, data, operador e identificador externo.

**Verificacao**:
- UI nao promete reprocesso real para strategies stub; texto deve ser operacional e neutro.
- `itemId` e opcional; quando informado, vai no body `{ itemId }`.

### Step 110.6.2 - Integrar reprocesso ao detalhe do item

**Implementacao**:
- Em item `WEBHOOK_FALHOU`, oferecer atalho para reprocessar webhook com `webhookEventId = entidadeId` e `itemId = item.id`.
- Em item `DESEMBOLSO_PIX_FALHOU`/`PIX_TRANSFERENCIA`, oferecer atalho para reprocessar provider `PIX_TRANSFERENCIA` com `entidadeId = entidadeId` e `itemId = item.id`.
- Para tipos sem handler real ou sem suporte no backend alvo, mostrar estado "tratamento manual" e manter comentario/resolver/ignorar.

**Verificacao**:
- Atalhos so aparecem quando `tipoEntidade`/`tipo` permitem.
- `RECEBIMENTO_PIX_DIVERGENTE` nao mostra reprocesso provider.

### Step 110.6.3 - Estender step-up para reprocessos

**Arquivos provaveis**:
- `src/app/core/interceptors/step-up.interceptor.ts`
- `src/app/core/interceptors/step-up.interceptor.spec.ts`

**Implementacao**:
- Anexar token em:
  - `POST /backoffice/reprocessos/webhook/{webhookEventId}`;
  - `POST /backoffice/reprocessos/provider/{tipoChamada}/{entidadeId}`.
- Consumir token apenas quando a URL e metodo exigirem step-up.

**Verificacao**:
- GETs e comentarios nao consomem token.
- Reprocessos com token recebem `X-Step-Up-Token`.

### Step 110.6.4 - Tratar erros de reprocesso

**Implementacao**:
- `400`: tipo nao suportado ou payload invalido.
- `403`: sem role ou sem step-up; deixar interceptor global redirecionar quando aplicavel.
- `404`: entidade/item nao encontrado, quando backend retornar.
- `429`: limite anti-abuso 3/24h; mostrar mensagem especifica e nao repetir automaticamente.
- `5xx`: erro generico com retry manual.

**Verificacao**:
- Nao fazer retry automatico de reprocesso.
- Nao persistir token, resultado tecnico completo em storage ou payload sensivel.

### Step 110.6.5 - Testar reprocessos

**Cenarios minimos**:
- Webhook sem step-up redireciona para confirmacao adicional.
- Webhook com step-up retorna `201 ReprocessoResponse`.
- Provider `PIX_TRANSFERENCIA` com step-up retorna `201` quando MSW suportar.
- Tipo nao suportado retorna `400`.
- 4o reprocesso retorna `429`.
- Atalho do detalhe preenche `itemId`.

### Step 110.6.6 - Checkpoint C6

**Entregaveis**:
- Painel de reprocessos.
- Atalhos no detalhe.
- Step-up interceptor atualizado.
- Specs de reprocesso e anti-abuso.

**Pausa obrigatoria**:
- Review da Task F-10.6 antes de fechamento.

---

## Task F-10.7 - Smoke, docs e fechamento

**Objetivo**: consolidar validacao da sprint, atualizar documentacao operacional e preparar fechamento.

**Pre-requisito**: Tasks F-10.1 a F-10.6 concluidas.

**Esforco**: 0,5-1 dia.

### Step 110.7.1 - Rodar validacoes finais

**Comandos**:
```bash
cd <sep-app-root>
npm run test -- --run
npm run lint -- --quiet
npm run lint:scss
npm run build
```

**Verificacao**:
- Suite completa verde.
- Warnings conhecidos registrados.

### Step 110.7.2 - Smoke manual dev-offline

**Roteiro**:
1. Login `backoffice@empresa.com` / `123456`.
2. Abrir `/app/backoffice`.
3. Ver dashboard.
4. Abrir fila com filtro `status=ABERTO`.
5. Abrir detalhe.
6. Assumir item.
7. Registrar comentario.
8. Resolver com step-up valido.
9. Reprocessar webhook/provider em fixture suportada.
10. Confirmar `CLIENTE` sem menu e sem acesso direto.

**Verificacao**:
- Fluxo nao quebra shell.
- Step-up consome token apenas uma vez.
- Estados de erro aparecem em UI.

### Step 110.7.3 - Smoke contra backend real

**Pre-requisitos**:
- `sep-api` rodando em `http://localhost:8080`.
- Usuario com role `BACKOFFICE`, `FINANCEIRO` ou `ADMIN`.
- Massa real ou seed que gere ao menos um item de fila.

**Roteiro minimo**:
- `GET /backoffice/dashboard`.
- `GET /backoffice/fila`.
- `GET /backoffice/fila/{id}`.
- `POST /fila/{id}/comentarios`.
- Se item estiver em estado adequado, `POST /fila/{id}/assumir`.
- Resolver/ignorar somente em ambiente apropriado e com step-up, evitando alterar massa compartilhada sem aprovacao.

**Verificacao**:
- DTOs reais batem com modelos TypeScript.
- Erros `400/403/404/409/429` sao tratados.

### Step 110.7.4 - Atualizar docs operacionais

**Arquivos provaveis**:
- `docs-SEP/repos/sep-app/README.md`
- `docs-SEP/docs-sep/WEB-SCREENS-PLAN.md`, se a tela nova precisar constar no mapa.
- `docs-SEP/AI-ROADMAP.md`, se novos docs/rotas documentais forem criados.
- `docs-SEP/repos/sep-app/SPRINT-10-PR.md` no fim da sprint, conforme regra fixa do `AGENT.md`.

**Implementacao**:
- Registrar telas backoffice, roles, comandos de validacao e gaps aceitos.
- Se criar `SPRINT-10-PR.md`, manter como artefato temporario e nao linkar permanentemente em PRD/CONTEXT/roadmap.

### Step 110.7.5 - Definition of Done da sprint

**Checklist**:
- [ ] `BackofficeService` e modelos alinhados ao backend.
- [ ] Rotas/menu protegidos por role.
- [ ] Dashboard operacional/financeiro funcional.
- [ ] Fila com filtros, paginacao e detalhe.
- [ ] Assumir/comentar/resolver/ignorar funcionando.
- [ ] Step-up em resolver, ignorar e reprocessos.
- [ ] Reprocessos suportados pelo backend funcionando.
- [ ] `CLIENTE` sem acesso.
- [ ] MSW e specs cobrem principais fluxos e erros.
- [ ] Suite completa, lint, SCSS e build verdes.
- [ ] Docs atualizados.

### Step 110.7.6 - Checkpoint C7

**Entregaveis**:
- Sprint validada.
- Docs atualizados.
- PR description temporaria, se aplicavel.

**Pausa obrigatoria**:
- Review final manual antes de iniciar F-Sprint 11.
