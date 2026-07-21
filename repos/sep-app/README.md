# sep-app

Documentacao especifica do frontend web SEP.

## Orientacao

Crie aqui documentacao tecnica ou operacional que pertenca apenas ao repo `sep-app`.
Exemplos: guias de fluxo web, notas de arquitetura frontend, decisoes locais de testes,
MSW, Playwright ou convencoes especificas da aplicacao Angular.

Documentos globais de produto/processo devem continuar em `docs-SEP/docs-sep/`.

## Jornada de Onboarding (F-Sprint 6)

Jornada autenticada de onboarding PF (KYC) e PJ (KYB) dentro de `/app`, consumindo
os contratos reais de `sep-api` (modulo `onboarding`, Sprints 6-7). O frontend apenas
orquestra telas e chamadas HTTP; status e decisoes KYC/KYB/PLD pertencem ao backend.

### Rotas

| Rota | Tela |
|------|------|
| `/app/onboarding` | Home com os dois caminhos (PF e PJ) |
| `/app/onboarding/pessoa` | Formulario de inicio PF |
| `/app/onboarding/pessoa/:id` | Detalhe PF: documentos, verificacao e status |
| `/app/onboarding/empresa` | Formulario de inicio PJ |
| `/app/onboarding/empresa/:id` | Detalhe PJ: dados, representantes, documentos e status |

### Contratos consumidos

PF (`/api/v1/onboarding/pessoa`): `POST` iniciar, `POST /{id}/documentos` (multipart
`tipo`+`arquivo`), `POST /{id}/verificar`, `GET /{id}`.

PJ (`/api/v1/onboarding/empresa`): `POST` iniciar, `POST /{id}/documentos`,
`POST /{id}/verificar`, `GET /{id}`, `GET /{id}/representantes`.

Tipos de borda em `src/app/core/api/api.models.ts`; transporte em
`src/app/core/onboarding/onboarding.service.ts`.

### Decisoes

- Componentes compartilhados em `features/authenticated/onboarding/shared/`:
  `OnboardingStatusComponent` (badge semantico + resultado) e
  `OnboardingDocumentUploadComponent` (selecao de tipo + upload com limite de 10MB).
  Sao presentacionais: nao chamam a API.
- LGPD: representante exibido apenas com `cpfMascarado`; resumo PLD mostra apenas
  status/data, nunca motivo/base/severidade.
- Upload nao persiste arquivo em storage local; o arquivo vive so na memoria do form.
- Campos PJ opcionais (`nomeFantasia`, `tipoSocietario`, `porte`) sao omitidos quando
  vazios para nao enviar enum em branco ao backend.
- `409` de CPF/CNPJ ativo vira estado de conflito orientado a acao; `401/403/423` seguem
  tratados globalmente pelo `errorInterceptor`.

### Testes

- Vitest: `OnboardingService`, paginas PF/PJ e componentes compartilhados
  (`npm run test`).
- Playwright (MSW/dev-offline): `e2e/onboarding.spec.ts` cobre PF (sucesso + conflito 409)
  e PJ (representante mascarado). Habilita MSW por sessao via
  `localStorage.NG_APP_USE_MSW`; rodar com `npx playwright test onboarding`.
- MSW handlers de onboarding em `src/mocks/handlers.ts`.

## Jornada de Credito e Open Finance (F-Sprint 7)

Jornada autenticada de propostas de credito e Open Finance do tomador dentro de
`/app/credito`, consumindo os contratos reais de `sep-api` (modulo `credito`,
Sprints 8-9). O frontend cria, lista e acompanha propostas e conduz o consentimento
Open Finance; motor de credito, score, regras, parecer e decisao de consentimento
pertencem ao backend.

### Rotas

| Rota | Tela |
|------|------|
| `/app/credito` | Home com atalhos (minhas propostas, nova proposta) |
| `/app/credito/propostas` | Lista de propostas do tomador |
| `/app/credito/propostas/nova` | Formulario de solicitacao de credito |
| `/app/credito/propostas/:id` | Detalhe: proposta, score e ultimo parecer |
| `/app/credito/propostas/:id/open-finance` | Consentimento Open Finance + status/agregados |
| `/app/credito/propostas/:id/open-finance/retorno` | Retorno do provider (consulta status) |

### Contratos consumidos

Credito (`/api/v1/credito/propostas`): `POST`, `GET` (lista paginada `PageResponse<T>`),
`GET /{id}`, `GET /{id}/regras` (FINANCEIRO/ADMIN).

Open Finance (`/api/v1/credito/propostas/{id}/open-finance`): `POST /consentimento`,
`GET` (status do consentimento + ultima movimentacao consolidada).

Tipos de borda em `src/app/core/api/api.models.ts`; transporte em
`src/app/core/credito/credito.service.ts`.

### Decisoes

- Componentes reutilizaveis em `features/authenticated/credito/shared/`:
  `PropostaStatusComponent` (badge com label operacional), `ScorePanelComponent` e
  `ParecerPanelComponent`, mais helpers `credito-format` (moeda/data/id curto) e
  `credito-error`. Sao presentacionais.
- O frontend nunca calcula score, elegibilidade, parcela, juros, IOF, CET ou decisao.
- `CLIENTE` nunca envia `tomadorId`; ownership e resolvido no backend.
- Open Finance: `redirectUri` sempre gerado pela aplicacao (rota `/retorno`, http(s));
  `urlAutorizacao` tratada como handoff externo (`window.open` com `noopener`); a rota de
  retorno consulta o `GET` da API, sem confiar em query params do provider.
- LGPD: exibe apenas agregados sanitizados; nunca payload bruto, conta, agencia, titular
  ou CPF/CNPJ de terceiro; nada persistido em storage local.
- `401/403/423` tratados globalmente pelo `errorInterceptor`; paginas tratam
  `400/404/409/422`.

### Testes

- Vitest: `CreditoService`, paginas de lista/detalhe/criacao/Open Finance e componentes
  compartilhados (`npm run test`).
- MSW handlers de credito/Open Finance em `src/mocks/handlers.ts`.
- Smoke Playwright dedicado e smoke com backend real ficaram como follow-up.

## Jornada de Cobranca (F-Sprints 9 e 16)

Jornada autenticada de cobranca em `/app/cobranca`, consumindo o modulo `cobranca` de
`sep-api` (Sprints backend 12-13, 24 e 27). O frontend so apresenta: saldo, mora, multa,
status, total renegociado e transicoes pertencem ao backend.

### Rotas

- `/app/cobranca` — shell por perfil: financeiro/admin veem agenda financeira e
  inadimplencia; tomador (CLIENTE) acessa as parcelas a partir de um contrato assinado;
  demais perfis (ex.: BACKOFFICE) ficam sem jornada (o backend nao os autoriza).
- `/app/cobranca/contratos/:contratoId/agenda` e `/app/cobranca/parcelas/:id` — tomador.
- `/app/cobranca/parcelas/:parcelaId/renegociacao` — decisao do tomador sobre a proposta
  ativa (F-16); CTA no detalhe da parcela aparece apenas com status `EM_NEGOCIACAO`.
- `/app/cobranca/financeiro/agenda`, `/app/cobranca/financeiro/parcelas/:id` e
  `/app/cobranca/financeiro/inadimplencia` — `roleGuard` FINANCEIRO/ADMIN.

### Contratos consumidos

Cobranca (`/api/v1/cobranca`): `GET /contratos/{id}/agenda`, `GET /parcelas/{id}`
(`ValorAtualizadoParcelaResponse`), `POST /parcelas/{id}/recebimentos` (+ `Idempotency-Key`,
200), `GET /recebimentos`, `GET /inadimplencia`, `POST /parcelas/{id}/contato` (201),
`POST /parcelas/{id}/renegociacao` (step-up),
`GET /parcelas/{parcelaId}/renegociacao-ativa` (`RenegociacaoTomadorResponse`, dez campos
publicos, owner-scoped, 403 uniforme sem enumeracao / 404 sem proposta ativa — backend
Sprint 24) e `PATCH /renegociacoes/{id}/aceite|recusa` na jornada do tomador (aceite com
`@RequireStepUpEstrito` — MFA ativo + `X-Step-Up-Token` de uso unico; recusa apenas
ownership — backend Sprint 27).

### Decisoes

- Nenhum calculo financeiro no frontend; agenda mostra composicao estatica e o valor
  atualizado vem so do detalhe da parcela.
- `Idempotency-Key` gerada por tentativa de recebimento, descartada ao editar o payload ou
  apos sucesso, nunca persistida; submit desabilitado durante o envio.
- Step-up das operacoes de renegociacao via `stepUpInterceptor` (allowlist estendida para
  `POST /renegociacao` e `PATCH /renegociacoes/{id}/aceite`; recusa e GETs sem step-up).
- `UsuarioRole` passou a incluir `FINANCEIRO`/`BACKOFFICE` (role principal do backend).
- Decisao do tomador (F-16): termos consultados ao entrar e reconsultados antes de cada
  confirmacao; aceite exige MFA ativo (pre-check com orientacao), confirmacao explicita e
  step-up estrito (sem token, navega a `/app/step-up?next=...` e o retorno nunca aceita
  automaticamente); recusa exige confirmacao mas nao inicia nem consome step-up; estado
  unico de decisao bloqueia duplo submit e clique cruzado; rede/5xx marcam os termos como
  desatualizados e bloqueiam decisoes ate nova leitura; 403 do aceite autenticado oferece
  reverificacao apenas por gesto explicito (sem loop).

### Gaps

- Sem lista global de agendas (lookup por id); `GET /recebimentos` sem paginacao.

### Testes

- Vitest: `CobrancaService` (incl. `consultarRenegociacaoAtiva` com interceptor real na
  cadeia), paginas (agenda/detalhe do tomador, decisao de renegociacao com matriz
  403/404/409/rede, agenda financeira, parcela financeira, inadimplencia),
  badge/composicao e `stepUpInterceptor` (`npm run test`).
- MSW handlers de cobranca em `src/mocks/handlers.ts` (parcelas dedicadas `...0008`
  leitura, `...0009` aceite e `...000a` recusa do tomador; GET renegociacao-ativa deriva
  do estado mutavel — apos decisao o GET responde 404 como o backend).
- Smoke Playwright `e2e/cobranca.spec.ts` (offline): termos da proposta, recusa sem
  step-up e aceite navegando ao step-up sem auto-aceite no retorno. Aceite com TOTP real
  fica para o smoke real com backend :8080 (desafio MFA sem handler offline).

## Backoffice e financeiro operacional (F-Sprint 10)

Operacao assistida em `/app/backoffice` para `BACKOFFICE`, `FINANCEIRO` e `ADMIN`, consumindo
o modulo `backoffice` de `sep-api` (Sprint 14 + extensoes Pix das Sprints 20-21). O frontend
apenas apresenta e dispara acoes; transicoes de status, ownership, auditoria, anti-abuso e o
gate de step-up pertencem ao backend. `CLIENTE` nao ve o menu nem acessa as rotas (guard de
visibilidade; a autorizacao real e do backend).

### Rotas

| Rota | Tela |
|------|------|
| `/app/backoffice` | Shell com as secoes (dashboard, fila, reprocessos) |
| `/app/backoffice/dashboard` | Visao consolidada operacional/financeira |
| `/app/backoffice/fila` | Fila com filtros, paginacao e ordenacao do backend |
| `/app/backoffice/fila/:id` | Detalhe do item: dados, comentarios, objeto original e acoes |
| `/app/backoffice/reprocessos` | Painel de reprocesso de webhook e provider |

O route group e protegido por `roleGuard` (`BACKOFFICE`/`FINANCEIRO`/`ADMIN`) e o item
`Backoffice` no sidenav segue as mesmas roles.

### Contratos consumidos

Backoffice (`/api/v1/backoffice`): `GET /dashboard` (`Cache-Control: no-store`),
`GET /fila` (`Page<ItemFilaResponse>` com filtros `tipo`/`prioridade`/`status`/
`data_abertura_de`/`data_abertura_ate`/`atribuido_a`/`page`/`size`/`sort`),
`GET /fila/{id}`, `POST /fila/{id}/assumir`, `POST /fila/{id}/comentarios`,
`PATCH /fila/{id}/resolver` (step-up), `PATCH /fila/{id}/ignorar` (step-up),
`POST /reprocessos/webhook/{webhookEventId}` (step-up), `POST /reprocessos/provider/{tipoChamada}/{entidadeId}` (step-up).

Tipos de borda em `src/app/core/api/api.models.ts`; transporte em
`src/app/core/backoffice/backoffice.service.ts`.

### Decisoes

- Componentes compartilhados em `features/authenticated/backoffice/shared/`:
  `BackofficeChipComponent` (chip de prioridade/status), `ReprocessoResultadoComponent`
  (resultado do reprocesso) e `backoffice-format` (moeda/data/duracao + labels). Sao
  presentacionais.
- A tela nunca recalcula contadores, medias, somatorios, SLA, prioridade ou permissao de
  transicao; apresenta os agregados do backend (dashboard com `no-store`, sem persistir).
- `resolver`, `ignorar` e os reprocessos exigem step-up: o token e anexado pelo
  `stepUpInterceptor` (allowlist estendida) — o service nao envia token. Sem token, o `403`
  redireciona para `/app/step-up?next=<rota>`; `409` recarrega o estado real.
- Reprocesso respeita o backend: `PIX_TRANSFERENCIA` tem reconsulta real; `KYC`/`KYB`/`PLD`/
  `OPEN_FINANCE`/`ASSINATURA_DIGITAL` podem ser stubs — a UI exibe o `resultado` como veio e
  nao promete retentativa. `RECEBIMENTO_PIX_DIVERGENTE` nao tem reprocesso de provider (so
  tratamento manual). Anti-abuso `429` mostra mensagem especifica, sem retry automatico.
- LGPD: filtros, fila e detalhe nao expoem payload bruto de webhook/provider, CPF/CNPJ
  completo, chave Pix, dados bancarios ou tokens; comentario/justificativa ficam so na memoria
  do form (nada em storage).
- `tempoMedioResolucao30d` chega como numero de segundos (Duration); a apresentacao formata.

### Testes

- Vitest: `BackofficeService`, paginas (dashboard, fila, detalhe, reprocessos), shell,
  chip/resultado, `stepUpInterceptor` e sidenav (`npm run test`).
- MSW handlers de backoffice em `src/mocks/handlers.ts` (fila, dashboard, reprocessos, step-up
  e anti-abuso `429`).
- Smoke Playwright `e2e/backoffice.spec.ts` (offline): dashboard, fila, detalhe, assumir e
  comentar. `resolver`/`ignorar` e reprocessos exigem step-up (MFA) e ficam para o smoke real.

## New Design System Web (F-Sprint 14)

Migracao visual do `sep-app` dos design systems Apple/Notion para o
[`New Design System Sep.md`](<../../docs-sep/New Design System Sep.md>), mantendo a stack
Angular + SCSS. Mudanca puramente visual: sem alteracao de contrato REST, regra de negocio,
role, guard ou escopo funcional. Detalhes em
[`DESIGN-SYSTEM.md`](DESIGN-SYSTEM.md).

A **F-Sprint 15** aplicou esse design system com profundidade em login/registro (painel de
marca), dashboard (header sticky + "Acesso Rapido" + jornadas), shell (sidenav agrupada +
header sticky) e na landing publica (`/`: hero 2-col + cards de feature), adicionando os
primitivos `sep-icon-chip`/`sep-quick-tile`/`sep-button-gradient`/
`sep-auth-brand-panel`, os tokens `--sep-radius-xl`/`--gradient-foreground`/`--header-height` e a
biblioteca de icones `lucide-angular`. Spec/steps `115-fsprint-15-*`. Sem recriar tokens.

### O que mudou

- **Camada de estilo nova** em `src/styles/`: `_sep-ds-tokens.scss` (tokens HSL light/dark,
  raio `0.75rem`, sombras, gradientes, espacamento neutro `--sep-space-*`),
  `_sep-ds-typography.scss` (mixins `sep-type-*`, fonte de sistema) e
  `_sep-ds-components.scss` (mixins de botoes, cards, inputs, badges, navegacao, tabelas,
  overlays, loaders/skeletons).
- **Tema claro/escuro** novo: `ThemeService` (`src/app/core/theme/`) aplica a classe `.dark`
  no documento, persiste em `localStorage` (`SEP_THEME`) e respeita `prefers-color-scheme`;
  alternador no header.
- **Todas as telas existentes** (publicas e autenticadas ate F-10, shell, navegacao,
  dashboards e vitrine `/design-system`) migradas para os novos tokens/mixins.
- **Legado removido**: os partials `_apple-*`/`_notion-*` foram excluidos de `src/styles/`.
  Apple/Notion permanecem apenas como historico documental.

### Decisoes

- Cores consumidas via `hsl(var(--token))`; cores semanticas mapeadas (azul->primary,
  verde->success, laranja->warning, vermelho/critico->destructive).
- `sep-card` (estilo shadcn) nao embute padding; telas que usavam o antigo `notion-card`
  recebem `padding: var(--sep-space-24)` explicito.
- Botoes secundarios neutros usam `sep-button-outline` (o token `--secondary` e verde, de
  suporte). A vitrine usa base + modifier para nao duplicar a base no CSS final.
- Landing publica: tiles escuros estilo Apple convertidos para superficies claras do novo DS
  (gradient-hero, card, muted, accent). Marca segue sendo SEP (sem `SimpliClin`).

### Testes

- Vitest: 285 testes verdes, incluindo `ThemeService` (`npm run test`).
- `npm run lint`, `npm run lint:scss` e `npm run build` verdes (sem aviso de budget — a
  vitrine voltou a caber no orcamento de estilo).
- Smoke Playwright: cenarios publicos/autenticados passam. Falha **preexistente** (anterior
  a F-14): os specs `golden-path`, `admin-flow` e `cobranca` dependem do formulario de
  cadastro em `/register`, que desde a Sprint 5 redireciona para a tela de canalizacao por
  perfil (`RedirectToAppComponent`); o `RegisterComponent` nao esta mais roteado. Recomendado
  atualizar esses specs em follow-up.

## Administracao e governanca (F-Sprint 12)

Telas administrativas de governanca (Epic 11 + Epic 13) consumindo o modulo `governanca` do
`sep-api` (Sprint 18 - RBAC cumulativo e parametros operacionais). Toda a area e **ADMIN-only**:
os endpoints de governanca usam `hasRole('ADMIN')` (inclusive leitura), e a area web aninha na
`Administracao` ja existente (`/app/admin`, `roleGuard ['ADMIN']`). Precedencia de role,
validacao de tipo, versionamento e auditoria permanecem no backend; o frontend so apresenta e
dispara acoes. Spec: [`112`](../../specs/fase-3/112-fsprint-12-governanca-web.md);
steps: [`112-fsprint-12-steps.md`](../../steps-fase-3/web/112-fsprint-12-steps.md).

### Rotas

- `/app/admin` -> landing `Administracao` com cards (`Usuarios`, `Parametros operacionais`).
- `/app/admin/users`, `/app/admin/users/:id` -> lista e detalhe de usuario; o detalhe ganhou a
  **secao de roles cumulativas** (consulta + edicao do conjunto).
- `/app/admin/parametros` -> lista de parametros operacionais.
- `/app/admin/parametros/:chave` -> detalhe + historico de versoes + alteracao de valor.

### Contratos consumidos

- `GET/PUT /usuarios/{id}/roles`, `POST/DELETE /usuarios/{id}/roles/{role}` (roles cumulativas).
- `GET /governanca/parametros`, `GET /governanca/parametros/{chave}`,
  `PATCH /governanca/parametros/{chave}` (`novoValor` + `justificativa`).
- Mutacoes exigem step-up: o `stepUpInterceptor` anexa `X-Step-Up-Token` nas mutacoes de roles
  (PUT/POST/DELETE) e no `PATCH` de parametro; os GET de leitura nunca consomem token.

### Decisoes

- Governanca aninhada em `/app/admin` (sem grupo `/app/governanca` paralelo). Roles cumulativas
  reusam o detalhe de usuario; nao ha pagina de roles separada nem campo de `id`/busca.
- Edicao de roles via `PUT` (conjunto inteiro). Auto-protecao: edicao desabilitada quando o alvo
  e o proprio admin (backend retorna `403`); `403` de mutacao redireciona para `/app/step-up`.
- Valor de parametro trafega como `string`; input unico de texto com dica do tipo. A validacao
  por tipo/faixa fica no backend (`400`/`422` tratados); a UI nao recalcula.
- Justificativa de alteracao fica apenas em estado de formulario (nunca em `localStorage`).

### Gaps

- **Auditoria de roles na web**: a Sprint 18 nao expoe endpoint de leitura da trilha de
  alteracao de roles. A UI explicita que a alteracao e auditada no backend, mas a trilha
  detalhada nao e exibida nesta versao (sem simular trilha). Follow-up: novo endpoint backend.
  O historico de **parametros** (`GET /governanca/parametros/{chave}`) e a trilha auditavel
  disponivel.

### Testes

- Vitest: suite verde (`npm run test`), incluindo `GovernancaService`, gestao de roles no
  detalhe de usuario, lista/detalhe/alteracao de parametros e o `stepUpInterceptor` (URLs
  sensiveis de roles e parametro; GETs nao consomem token).
- `npm run lint`, `npm run lint:scss` e `npm run build` verdes.
- Smoke Playwright offline `e2e/governanca.spec.ts` (landing, parametros + historico, secao de
  roles). As mutacoes exigem step-up (MFA) e ficam para smoke real com backend em `:8080`.

## Jornada Pix operacional (F-Sprint 13)

Operacao Pix assistida (Epic 15 + superficies operacionais do Epic 13) consumindo o modulo `pix`
do `sep-api` (Sprints backend 19-21): desembolso assistido, status de transferencia, referencias e
recebimentos de parcela, e divergencias. Area interna, visivel para `FINANCEIRO`, `ADMIN` e
`BACKOFFICE` (grupo `/app/pix` com `roleGuard`; `CLIENTE` bloqueado). O frontend apresenta estado,
dispara comandos autorizados e conduz step-up; elegibilidade, idempotencia, conciliacao, escrow e
provider ficam no backend. Spec: [`113`](../../specs/fase-3/113-fsprint-13-pix-web.md);
steps: [`113-fsprint-13-steps.md`](../../steps-fase-3/web/113-fsprint-13-steps.md).

### Rotas

- `/app/pix` -> landing com cards (`Desembolsos`, `Recebimentos`, `Divergencias`).
- `/app/pix/desembolsos` -> form de novo desembolso (`FINANCEIRO`/`ADMIN`) + consulta por id.
- `/app/pix/desembolsos/:id` -> status local + reconsulta no provider (step-up).
- `/app/pix/recebimentos` -> gerar referencia de parcela (`FINANCEIRO`/`ADMIN`) + consultas por id.
- `/app/pix/recebimentos/referencias/:id` -> referencia (txid, copia-cola, vinculo de parcela).
- `/app/pix/recebimentos/:id` -> recebimento conciliado/divergente, com vinculos quando houver.
- `/app/pix/divergencias` -> painel que reusa a fila do backoffice filtrada pelos tipos Pix.
  F-17.2: recorte por status enviado ao backend (default `ABERTO`; "Todos" omite o parametro) e
  contagens sempre do `PageResponse.totalElements`, com aviso explicito de pagina parcial.

### Contratos consumidos

- Desembolso: `POST /pix/desembolsos` (`FINANCEIRO`/`ADMIN`, step-up estrito + `Idempotency-Key`,
  `201`/`200`), `GET /pix/desembolsos/{id}` (leitura local) e `POST /pix/desembolsos/{id}/status`
  (reconsulta no provider, step-up). Roles de leitura/reconsulta: `FINANCEIRO`/`ADMIN`/`BACKOFFICE`.
- Recebimento: `POST /pix/recebimentos/referencias` (`FINANCEIRO`/`ADMIN`, **sem step-up**,
  `201`/`200`), `GET /pix/recebimentos/referencias/{id}` e `GET /pix/recebimentos/{id}`
  (`FINANCEIRO`/`ADMIN`/`BACKOFFICE`).
- Divergencias: reusa `GET /backoffice/fila?tipo=...` (`RECEBIMENTO_PIX_DIVERGENTE`,
  `DESEMBOLSO_PIX_FALHOU`); o tratamento (assumir/comentar/resolver/ignorar) permanece no backoffice.
- Step-up: o `stepUpInterceptor` anexa `X-Step-Up-Token` em `POST /pix/desembolsos` e
  `POST /pix/desembolsos/{id}/status`; leituras e geracao de referencia nunca consomem token.

### Decisoes

- `Idempotency-Key` do desembolso e gerada por tentativa (`crypto.randomUUID`), descartada ao mudar
  o payload ou apos a resposta final; nunca persistida em storage.
- Chave Pix do destinatario trafega apenas no request de desembolso; o backend so devolve a mascara.
  A UI nunca loga, persiste nem reexibe a chave em claro.
- Backend nao expoe listagem global de desembolsos -> navegacao por id / apos criar (sem lista local).
- `FALHOU`/`CANCELADA` (transferencia) e `NAO_IDENTIFICADO`/divergente (recebimento) aparecem como
  estado claro; provider indisponivel na reconsulta vira alerta rastreavel, nunca sucesso falso.
- Divergencias reusam o backoffice: a area Pix nao duplica a fila nem oferece "reenviar Pix" ou
  "reprocessar provider" para recebimento; desembolso falho so oferece reconsulta de status.

### Gaps

- **Sem endpoint dedicado de divergencias Pix**: o painel reusa a fila do backoffice filtrada por
  tipo (`listarFila`). Follow-up: endpoint/contadores dedicados se o volume justificar.
- **Contratos ausentes registrados no gap analysis da F-17** (follow-ups backend; nada simulado no
  front): paginacao/filtros em `GET /cobranca/recebimentos` (Javadoc do proprio controller ja
  prometia); recebimentos por parcela para o perfil financeiro (o da Sprint 23 e CLIENTE-only);
  listagem Pix por operacao/contrato (hoje so consulta por id); DTO consolidado server-side de
  recebimentos+desembolsos por operacao (consolidacao local por N+1/correlacao e proibida).
- **Parcela para `BACKOFFICE`**: a rota de parcela na cobranca (`/app/cobranca/financeiro/parcelas/:id`)
  e `FINANCEIRO`/`ADMIN`; nos detalhes de referencia/recebimento o id da parcela aparece como texto
  para `BACKOFFICE` (sem link), que trata divergencias pelo proprio fluxo.

### Testes

- Vitest: suite verde (`npm run test`), incluindo `PixService` (URLs/headers/idempotencia/step-up),
  area/shell + sidenav (roles), desembolso (idempotencia, step-up, `403`/`409`/`422`, provider
  indisponivel), recebimentos (referencia nova/reaproveitada, conciliado, `NAO_IDENTIFICADO`),
  divergencias (reuso do backoffice, sem acao perigosa; filtro de status server-side, totais do
  backend, pagina parcial sinalizada e rede sem resultado presumido — F-17) e o
  `stepUpInterceptor` (rotas Pix).
- `npm run lint`, `npm run lint:scss` e `npm run build` verdes.
- Smoke Playwright offline `e2e/pix.spec.ts` (area, desembolso por role + status, referencia com
  copia-cola, recebimento conciliado, divergencias -> backoffice, filtro de status das
  divergencias). A solicitacao de desembolso exige step-up (MFA) e fica para o smoke real com
  backend em `:8080`.

## Jornada da empresa credora (F-Sprint 11)

Jornada web da empresa credora (Epic 10 + Epic 13) consumindo o modulo `credores` do `sep-api`
(Sprints backend 16-17): cadastro a partir de onboarding PJ aprovado, perfil/elegibilidade derivada,
oportunidades, manifestacao/cancelamento de interesse e carteira de operacoes financiadas. O
frontend apenas apresenta os DTOs e reflete os retornos do backend; elegibilidade, ownership, regras
de interesse, associacao de carteira e auditoria ficam no backend. Spec:
[`111`](../../specs/fase-3/111-fsprint-11-credora-web.md);
steps: [`111-fsprint-11-steps.md`](../../steps-fase-3/web/111-fsprint-11-steps.md).

### Modelo de acesso

- **Nao existe role `CREDORA`.** O acesso e governado por usuario autenticado (`authGuard` herdado do
  shell) + **presenca de credora**. O item `Credora` no sidenav aparece para `CLIENTE` (persona da
  credora); o gating real de conteudo e por presenca de credora no backend.
- `credoraPresenceGuard` consulta `GET /credores/me`: `404` (sem credora) -> roteia ao cadastro;
  `200` libera perfil/oportunidades/carteira; erro nao-404 libera para a propria pagina surfacar a
  falha. Os endpoints da persona credora usam `isAuthenticated()`; **nenhuma operacao desta jornada
  usa step-up**.

### Rotas

- `/app/credora` -> landing que resolve presenca de credora (cadastro vs. perfil/oportunidades/carteira).
- `/app/credora/cadastro` -> cadastro a partir de onboarding PJ aprovado.
- `/app/credora/perfil` -> perfil e elegibilidade derivada.
- `/app/credora/oportunidades` -> lista de oportunidades disponiveis.
- `/app/credora/oportunidades/:id` -> detalhe + manifestar/cancelar interesse.
- `/app/credora/carteira` -> carteira de operacoes financiadas.
- `/app/credora/carteira/:id` -> detalhe da operacao com resumo agregado de cobranca.

### Contratos consumidos

- Foundation: `POST /credores` (`201`; erros `404` onboarding ausente, `422 CRD-422-001` KYB
  incompleto/nao-PJ, `403 CRD-403-001` ownership, `409 CRD-409-001` credora ja existente ->
  perfil), `GET /credores/me` (`200`/`404`) e `GET /credores/me/elegibilidade` (`200`/`404`).
- Oportunidades: `GET /credores/oportunidades` (so `DISPONIVEL`), `GET /credores/oportunidades/{id}`.
- Interesse: `POST /credores/oportunidades/{id}/interesses` (`201`; `422` inelegivel, `409`
  duplicado) e `DELETE /credores/oportunidades/{id}/interesses/me` (`204`; **nao idempotente**: `404`
  sem interesse ativo, tratado na UI como "sem interesse ativo").
- Carteira: `GET /credores/carteira` e `GET /credores/carteira/{id}` (`200`/`404` por ownership).

### Decisoes

- A tela nunca recalcula elegibilidade nem deriva estado de interesse. O perfil carrega `/me` +
  `/me/elegibilidade`; a CTA de oportunidades so aparece quando `ATIVA` + `ELEGIVEL`, espelhando o
  gate do backend (que ainda valida). O cadastro trata cada erro de dominio com mensagem clara e
  conduz ao perfil no `409`.
- **Backend nao expoe estado de interesse por item**: o estado de interesse e local e corrigido pelos
  retornos do backend (`201`/`409` -> ativo; `204`/`404` -> inativo). O botao desabilita durante o
  envio (anti duplo-clique). A UI deixa explicito que manifestar interesse **nao gera** aporte,
  alocacao nem operacao de carteira.
- A carteira mostra apenas o agregado de cobranca (parcelas pagas/total, em atraso, valor total,
  total recebido, proximo vencimento); nunca busca parcelas individuais nem dado sensivel do tomador.
  O CNPJ aparece como o backend devolve (mascarado). Campos nullable aparecem como tracinho.
- Sem paginacao/cache local artificial: as listas de oportunidades e carteira sao consumidas como o
  backend retorna.

### Gaps

- **Estado de interesse nao persiste entre cargas**: como o backend nao expoe interesse por item, ao
  recarregar o detalhe da oportunidade o "interesse registrado" so reaparece quando o usuario tenta
  manifestar de novo e recebe `409` (tratado graciosamente). Follow-up: expor estado de interesse por
  oportunidade no backend.
- **Operacao admin fora de escopo**: sincronizar oportunidades, associar carteira (`POST
  /credores/carteira/operacoes`, com step-up) e consulta administrativa `GET /credores/{id}` nao
  pertencem a esta jornada.

### Testes

- Vitest: suite verde (`npm run test`), incluindo `CredoraService` (URLs/metodos/sem step-up,
  `404` de `/me` e `DELETE` nao idempotente), guard de presenca, shell, sidenav, cadastro
  (`404`/`422`/`403`/`409` + payload), perfil/elegibilidade (estados exaustivos), oportunidades
  (lista/detalhe), interesse (manifestar `201`/`409`/`422`, cancelar `204`/`404`) e carteira
  (lista/detalhe agregado, campos nulos, `404` por ownership).
- `npm run lint`, `npm run lint:scss` e `npm run build` verdes.
- Smoke manual dev-offline com `credora@empresa.com` / `123456` (credora elegivel),
  `credora-inelegivel@empresa.com` (inelegivel) e `credora-novo@empresa.com` (sem credora -> cadastro).
  O smoke real com backend em `:8080` fica como follow-up.

## Aporte e matching da credora (F-Sprint 18)

Superficies operacionais de **matching assistido** (backend Sprint 30) e **aporte assistido**
(backend Sprint 29) no modulo `credora` do web, consumindo os contratos reais do `sep-api`. Spec
[`118`](../../specs/fase-4/118-fsprint-18-aporte-matching-credora-web.md); steps
[`118`](../../steps-fase-4/web/118-fsprint-18-steps.md).

### Personas e acesso

- **Duas personas no mesmo modulo `credores`**: as rotas operacionais de matching/aporte sao de
  `FINANCEIRO`/`ADMIN` (`roleGuard`, sem `credoraPresenceGuard` — operador nao possui credora); as
  rotas da persona `CLIENTE` (cadastro/perfil/oportunidades/carteira) permanecem intactas.
- Item de navegacao `Matching de credoras` (grupo Operacao) somente para `FINANCEIRO`/`ADMIN`;
  `CLIENTE` e `BACKOFFICE` nao o veem. O menu `Credora` da persona `CLIENTE` continua separado.

### Rotas

- `/app/credora/matching` -> fila de sugestoes pendentes (refresh-on-read por gesto explicito).
- `/app/credora/matching/:sugestaoId` -> detalhe autoritativo + decisao assistida (step-up estrito).
- `/app/credora/matching/:sugestaoId/aporte` -> aporte assistido da operacao do matching confirmado.
- `/app/credora/carteira/:id` -> detalhe da operacao ganhou a lista owner-scoped de aportes
  (somente leitura, sem CTA de mutacao).

### Contratos consumidos

- Matching: `GET /credores/matching/sugestoes` (**refresh-on-read**: pode persistir e auditar
  sugestoes novas antes de listar as `SUGERIDA`; sem polling), `GET /credores/matching/{id}`
  (`404` neutro) e `POST /credores/matching/{id}/decisao` (step-up estrito; body
  `{ acao: CONFIRMAR|REJEITAR, motivo? <=255 }`; `409` decisao terminal/repetida; confirmar apenas
  registra a decisao — **nunca cria aporte nem chama escrow/Pix/provider**).
- Aporte: `POST /credores/operacoes/{operacaoId}/aportes` (step-up estrito + `Idempotency-Key`
  obrigatoria; `201` novo, `200` replay idempotente, `409` key conflitante/inelegivel, `404`
  neutro) e `GET` da mesma URL (autenticado, sem step-up; financeiro/admin qualquer operacao,
  credora dona somente a propria; `404` neutro indistinguivel).

### Decisoes

- **Decisao sempre sobre o estado atual**: cada gesto reconsulta o detalhe antes de abrir o dialogo
  de confirmacao (que so abre em `SUGERIDA`); falha na reconsulta nunca chama o POST. `409`/`404`
  reconsultam sem sucesso presumido; rede/`5xx` marca o snapshot como desatualizado e bloqueia
  decisoes ate nova leitura.
- **MFA + step-up estrito nas duas mutacoes**: MFA inativo bloqueia com orientacao (o backend
  estrito rejeita bypass e a UI nao tenta); sem token a tela navega a `/app/step-up?next=<rota>` e,
  no retorno, exige novo clique — **retornar do step-up nunca confirma, rejeita ou registra**. O
  `403` dos POSTs e tratado localmente (`TRATA_403_LOCALMENTE`) com reverificacao por gesto
  explicito; GETs e guard de role seguem no fluxo global de acesso negado.
- **Idempotencia por intencao**: uma intencao de aporte = um valor confirmado + uma
  `Idempotency-Key` (`crypto.randomUUID()`) somente em memoria. Retry de rede/`5xx` com o mesmo
  valor reusa a key (replay idempotente no backend); mudar o valor cria nova intencao/key; reload
  perde o rascunho. A key nunca aparece na UI nem persiste em `localStorage`/`sessionStorage`.
- **Nenhuma regra financeira no frontend**: valor inicial do aporte = `valorElegivel` do backend
  (revisao livre; validacao local apenas de formato — obrigatorio, positivo, ate 2 casas); CTA de
  aporte em `CONFIRMADA` e regra de UX, a autoridade de elegibilidade e o POST. `201` e `200` sao
  ambos sucesso real; erro de rede nunca vira sucesso presumido.
- Status de aporte (`PENDENTE -> EM_PROCESSAMENTO -> LIQUIDADO | FALHOU`) vem apenas do backend;
  atualizacao por botao `Atualizar status` (sem polling; **nao existe endpoint de reconciliacao na
  Fase 4**). Mensagens por estado deixam claro o provider fake/local — nenhum dinheiro real.
- Erros nunca ecoam UUID, key, escrow, provider ou motivo tecnico; IDs aparecem como sufixo curto.
- Dialogos acessiveis no padrao da F-16 (`alertdialog`, `aria-modal`, foco inicial, trap de Tab,
  `Escape`, restauracao de foco; rejeitar = acao destrutiva distinta).

### Testes

- Vitest: suite verde (`npm run test`, 556), incluindo contratos HTTP do `CredoraService`
  (5 operacoes novas + `Idempotency-Key`), `stepUpInterceptor` (2 POSTs novos, GETs protegidos,
  paths parecidos), sugestoes (1 chamada inicial, refresh por gesto, sem polling), detalhe/decisao
  (reconsulta, MFA, step-up sem auto-decisao, matriz `400/403/404/409/rede`, duplo submit, foco),
  aporte (prefill, formato, key por intencao/retry, replay `200`, matriz) e carteira owner-scoped
  (read-only, erro localizado sem apagar o detalhe).
- Playwright dev-offline: `e2e/credora-matching.spec.ts` (4 smokes — decisao ate o step-up sem
  auto-decisao no retorno, CTA separado de aporte com prefill, carteira owner somente leitura,
  menu oculto para roles indevidas). Decisao/aporte com TOTP real e a negacao de rota por role via
  URL direta ficam para o smoke real com backend `:8080` (o full reload do modo offline reinicia a
  sessao mock).

### Limitacoes da fase

- Provider fake/local (Sprint 29): nenhum dinheiro real; sem endpoint REST de reconciliacao — a UI
  apenas reconsulta o `GET` de aportes.
- Gestao de chaves Pix ficou **fora da F-18** (decisao do Gate F-18.0, 2026-07-16): destino web
  posterior explicito em sprint dedicada, apos a F-19; o item de Pix avancado do `v1.0-local` nao
  foi marcado como concluido por esta sprint.

## Hardening de tooling, contrato e collections (F-Sprint 19)

Sprint de tooling (sem tela, endpoint ou regra nova) que saldou a divida aceita no fechamento da
Fase 3. Spec [`119`](../../specs/fase-4/119-fsprint-19-hardening-tooling-contrato-web.md); steps
[`119`](../../steps-fase-4/web/119-fsprint-19-steps.md); decisao de major registrada na
[ADR 0018](../../adr/0018-avaliacao-angular-22-no-web.md).

### Validacao de contrato (`contract:check`)

- `contracts/openapi.snapshot.json`: export do OpenAPI runtime do `sep-api` (develop `7f40056`,
  export bruto sha256 `e2b7a041...`), com chaves ordenadas; **gerado, nao editar** — fonte, hash e
  comando de regeneracao em `contracts/openapi.snapshot.meta.json` e `contracts/README.md`.
- `contracts/consumed-contracts.json`: os 82 contratos que o frontend consome (espelha
  `api.models.ts` + services), incluindo headers sensiveis, status de sucesso e enums.
- `scripts/contract-check.mjs` (`npm run contract:check`): verificador zero-dependencia; falha
  (exit != 0) em divergencia de path/metodo/parametro/header/status/campo/tipo/enum; le o snapshot
  por default ou `SEP_OPENAPI_SCHEMA=<path|url>` para validar contra um runtime exportado.
  Lacunas conhecidas do OpenAPI ficam em `knownGaps` (reportadas sem falhar): `X-Step-Up-Token`
  nao documentado nas operacoes sensiveis, `DashboardResponse.tempoMedioResolucao30d` documentado
  como `string` (runtime = number), enums nao publicados de contratos/assinatura e headers de
  resposta do documento assinado (`X-Document-Hash-Sha256`/`Content-Disposition`) — todos
  follow-ups backend. springdoc nao publica `required`/`nullable` nas responses (limitacao
  registrada); `required` de request bodies E validado (campo obrigatorio novo no backend que o
  frontend nao envia falha o check), assim como parametros de path e tipos ausentes/quebrados.
- Resultado da F-19: **zero divergencia real** — nenhum tipo de borda precisou mudar.
- CI (`CI-APP`): step `contract:check` entre `format:check` e `lint`, offline e deterministico.

### Tooling (Angular 20 endurecido)

- Angular `20.3.26` + build/CLI `20.3.32`; lockfile regenerado sem bypass de peers
  (`npm ci` limpo). `npm audit`: 9 ocorrencias (5 high, todas dev tooling) -> **0 total**;
  `--omit=dev` sempre zero.
- Transitivos corrigidos: piscina, vite, esbuild, ws, sigstore, brace-expansion, @babel/core.
  In-range acompanharam: prettier 3.9, playwright 1.61, msw 2.15, happy-dom 20.10, eslint 9.39.5.
- **Angular 22 ADIADO** (ADR 0018): exige Node 22+ + TypeScript 6 + majors de toda a cadeia de
  teste; Angular 20 em LTS ate 2026-11-28; revisao programada 2026-09-30 ou no planejamento de
  infra/CI da Fase 5.

### Collections Postman/Insomnia

- `docs-sep/sep-api.postman_collection.json` e `sep-api.insomnia_collection.json` alinhadas ao
  mesmo OpenAPI (150 requests cada; cobertura metodo+path identica — 115 operacoes unicas;
  rotulos de requests pre-Sprint 14 divergem em estilo entre as duas, mesmas operacoes):
  folders novos de Credores (19 ops + negativos de replay/validacao/step-up/ownership), Pix
  (11 ops incl. chaves) e Governanca (7 ops); Cobranca ganhou
  inadimplencia/contato/renegociacao/aceite/recusa.
- Convencoes: `Idempotency-Key` por intencao; exemplos de chave Pix inequivocamente ficticios
  (resposta so mascara+hash); leituras owner-scoped com exemplo de `404` neutro; **zero
  segredo/PII versionado** — CPF/CNPJ sinteticos e secrets de webhook viraram variaveis vazias
  (`cpfTeste`/`cnpjTeste`/secrets), preenchidas localmente a partir do `application-dev.yml`.
- Exclusoes justificadas de paridade com o OpenAPI: `roles/{role}` e `provider/{tipoChamada}`
  cobertos por exemplares literais; webhooks genericos cobertos pelas variantes concretas.

### Testes

- Baseline pos-sprint: Vitest **580** (85 arquivos; +18 do verificador de contrato),
  Playwright **31**, lint/format/scss/build verdes em instalacao limpa.

## Gestao de chaves Pix da conta operacional (F-Sprint 20)

Superficie web para **gestao assistida das chaves Pix da conta operacional/escrow** (backend
Sprint 31), fechando a pendencia de visibilidade web registrada no Gate F-18.0. Spec
[`120`](../../specs/fase-4/120-fsprint-20-chaves-pix-web.md); steps
[`120`](../../steps-fase-4/web/120-fsprint-20-steps.md).

### Personas e acesso

- As tres operacoes sao de `FINANCEIRO`/`ADMIN` no backend. A sub-rota `chaves` tem `roleGuard`
  **proprio, mais restrito que o pai** `/app/pix` (que inclui `BACKOFFICE`): `BACKOFFICE` entra no
  Pix operacional mas nao ve o item de menu nem acessa a rota.
- Item de navegacao `Chaves Pix` (grupo Operacao) somente para `FINANCEIRO`/`ADMIN`.

### Rotas

- `/app/pix/chaves` -> listagem mascarada (com historico `INATIVA`), cadastro assistido e remocao
  assistida, na mesma tela.

### Contratos consumidos

- `GET /pix/chaves` — sem step-up. `200` com array (pode ser vazio), mais recentes primeiro,
  incluindo `INATIVA`. **Nunca `404`**: sem conta operacional devolve `[]`. Por isso a listagem tem
  tres superficies (lista / vazia / erro tecnico) e o `404` neutro pertence a remocao.
- `POST /pix/chaves` — step-up estrito + `Idempotency-Key` obrigatoria; body `{ tipo, valor }`.
  `201` novo, `200` replay idempotente, `400` (key ausente/invalida, tipo nulo, valor invalido),
  `409` (key reusada com payload diferente ou chave equivalente ja ativa), `422` (conta
  operacional indisponivel).
- `DELETE /pix/chaves/{chaveId}` — step-up estrito. Inativacao logica `ATIVA -> INATIVA`,
  **idempotente** (`204` mesmo se ja `INATIVA`); `404` **neutro** (nao distingue inexistente, fora
  do escopo da conta operacional ou conta ausente).
- `ChavePixResponse`: `id`, `tipo`, `valorMascarado`, `status`, `criadaEm`, `removidaEm` (nulo
  enquanto `ATIVA`). **O valor bruto da chave nunca e retornado.**
- Nota de contrato: o header `X-Step-Up-Token` nao e documentado no OpenAPI (`knownGaps[0]`); o
  frontend o registra manualmente em `consumed-contracts.json` para `POST` e `DELETE`.

### Decisoes

- **Valor em claro so na request de cadastro.** Nunca aparece em leitura, mensagem de erro,
  mensagem de sucesso, log ou storage. A confirmacao de sucesso usa o `valorMascarado` devolvido
  pelo backend, nao o que foi digitado.
- **Validacao apenas de formato minimo** no browser (campo preenchido, inclusive para `EVP`).
  Tipo, digito verificador, unicidade e idempotencia sao autoritativos no backend — o frontend
  nunca os reinterpreta.
- **Idempotencia por intencao** (`ChavePixIntencaoStore`, root e so memoria): preserva
  `{ tipo, valor, Idempotency-Key }` atraves da navegacao ao step-up. Retry apos rede/`5xx` reusa a
  **mesma** key; mudar `tipo`/`valor` cria intencao e key novas. O rascunho e reconstituido no
  retorno — sem isso, um erro de digitacao no reenvio geraria key nova e reabriria o risco de
  duplicar a chave. Reload perde o rascunho; nada e persistido em `localStorage`/`sessionStorage`.
- **Retornar do step-up nunca muta**: cadastro e remocao exigem novo clique. O token e de uso unico
  (o interceptor o consome ao anexar), entao cada tentativa exige verificacao nova.
- **`TRATA_403_LOCALMENTE` so nas mutacoes**; a leitura sem role segue no fluxo global de acesso
  negado.
- **Refresh so por gesto**, sem polling e sem recarga ao recuperar foco. Consulta em voo e
  substituida: resposta tardia da anterior nao sobrescreve a lista mais nova.
- **Cadastro e remocao se bloqueiam mutuamente** — os dois dialogos nunca se sobrepoem.
- Remocao **sem `Idempotency-Key`**: o `DELETE` e idempotente por contrato, entao nao ha intencao a
  preservar.

### Estados e acessibilidade

- Tres superficies da listagem (lista / vazia `200 []` / erro tecnico com retry), badge de status
  **textual** (a cor nao e o unico portador), `caption` na tabela e regiao nomeada por
  `aria-labelledby`.
- Dialogos com `aria-modal`, foco de entrada e retorno ao gatilho, `Escape` e trap de `Tab`.
- Abaixo de 768px a tabela vira cartoes empilhados: o `display: flex` sobre `tr`/`td` desfaz os
  papeis nativos `row`/`cell`, entao o `thead` sai da arvore de acessibilidade (`display: none`) e
  o rotulo de cada coluna passa a vir do `data-label`. **Nenhuma coluna, estado ou acao e ocultada.**

### Testes

- Vitest **664** (87 arquivos), Playwright **36** (+5 desta sprint), lint/scss/build e
  `contract:check` verdes.
- MSW stateful (`chavesPixHandlers`, `seedChavesPix`, `resetChavesPixState`) cobre lista com
  `ATIVA`+`INATIVA`, `201`/`200`/`400`/`409`/`422` no cadastro e `204`/`404` na remocao, validando
  step-up e `Idempotency-Key`. O mock **nao reimplementa a regra do backend** (DV, formato por
  tipo): reconhece valores sentinela para produzir `400` e `422`.

### Limitacoes da fase

- Provider **fake/local**: nenhuma chave real e criada ou removida no DICT.
- Cadastro e remocao concluidos com token TOTP real exigem o desafio MFA (sem handler offline) e
  ficam para o smoke local com backend `:8080`. O smoke offline prova o redirecionamento ao step-up
  e a **ausencia de auto-submit** no retorno.
- A superficie de lista vazia so seria alcancavel offline removendo as duas chaves do seed, o que
  depende do step-up acima; e coberta no Vitest da pagina.
- A negacao da **rota** para role indevida nao e demonstravel no smoke offline (um `page.goto`
  reinicia o MSW e a sessao volta ao usuario default); e coberta nos testes de `roleGuard` e da
  configuracao de rotas no Vitest. O smoke cobre a ausencia do item de menu.
