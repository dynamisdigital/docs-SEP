# sep-mobile

Documentacao especifica do mobile SEP.

## Orientacao

Crie aqui documentacao tecnica ou operacional que pertenca apenas ao repo `sep-mobile`.
Exemplos: guias PWA/Capacitor, notas de build mobile, jornadas especificas de mobile,
testes E2E em viewport mobile ou convencoes locais do Ionic.

Documentos globais de produto/processo devem continuar em `docs-SEP/docs-sep/`.

## Design system vigente

A partir do Epic 17 / M-Sprint 12, o design system vigente do app mobile passa a ser
[`New Design System Sep.md`](<../../docs-sep/New Design System Sep.md>).

Esta sprint foi revisada para seguir a F-Sprint 15 do `sep-app`: o foco nao e apenas migrar
tokens, mas aplicar melhor o design system nas superficies existentes do mobile. O Notion mobile
das M-Sprints 0-5 permanece como historico/legado. Novas telas mobile devem seguir a traducao do
New Design System SEP para Ionic/Angular/SCSS, mantendo a stack atual do `sep-mobile` salvo ADR e
aprovacao explicita em contrario.

Preferir `ion-icon`/Ionicons, ja presente na stack mobile. Nao adicionar Tailwind, shadcn/ui,
Radix, React ou biblioteca nova de icones sem ADR/aprovacao.

### Implementacao (M-Sprint 12 concluida)

Tokens e primitivos vivem em:
- `src/styles/_sep-mobile-ds-tokens.scss` — paleta HSL (light `:root` + dark `.dark`/`.ion-palette-dark`),
  raio, gradiente, sombra, espacamento e variaveis Sass `$sep-*`.
- `src/theme/variables.scss` — mapeia `--ion-*` a partir da paleta DS (shade/tint/rgb via `sass:color`), light + dark.
- `src/styles/_sep-mobile-ds-components.scss` — mixins dos primitivos.
- `src/global.scss` — estados globais dos componentes Ionic (botao/input/item/card/tab-bar/toast/modal/focus) em tokens DS.

Primitivos disponiveis (mixins SCSS):
- `sep-mobile-icon-chip($tone)` — chip de icone colorido (tom via `--chip-tone` quando dinamico);
- `sep-mobile-quick-tile($tone)` — tile de acesso rapido;
- `sep-mobile-button-gradient` — CTA gradiente (aplicado em `ion-button`);
- `sep-mobile-auth-brand-panel` — painel de marca de splash/welcome/login/registro;
- `sep-mobile-surface-card` — superficie de card;
- `sep-mobile-touch-state` — feedback de toque.

Tema claro/escuro: `src/app/core/theme/theme.service.ts` alterna `dark`/`ion-palette-dark` no
`documentElement`, persiste em `localStorage` (`SEP_THEME`) e respeita `prefers-color-scheme`;
instanciado no `AppComponent`, com toggle (sun/moon) no header mobile.

Os arquivos `_notion-mobile-*` das M-Sprints 0-5 foram removidos (paleta/mixins Notion substituidos);
o legado `jasmine`/`karma` foi removido do `package.json` (runner de testes e o Vitest).

Spec e steps:
- [`specs/fase-3/212-msprint-12-new-design-system-mobile.md`](../../specs/fase-3/212-msprint-12-new-design-system-mobile.md)
- [`steps-fase-3/mobile/212-msprint-12-steps.md`](../../steps-fase-3/mobile/212-msprint-12-steps.md)

## Onboarding do tomador (M-Sprint 6)

Jornada PWA de onboarding (KYC PF / KYB PJ) que consome as APIs existentes de
`sep-api` (onboarding Sprints 6-7). O app apenas coleta dados, envia documentos e
apresenta o status; **decisoes KYC/KYB/PLD permanecem no backend**.

Rota e entrada:
- `/app/onboarding` — rota lazy protegida pelo `authGuard` herdado do shell autenticado.
- Entrada pela home do tomador (`features/tomador/home`), atalho "Onboarding".

Telas/componentes (`src/app/features/tomador/onboarding/`):
- `onboarding-shell.component` — orquestrador: selecao PF/PJ, progresso por etapas
  (dados -> documentos -> status), inicio, envio de documentos, disparo de verificacao,
  reload/retry e tratamento de erro.
- `pessoa-fisica-form.component` / `pessoa-juridica-form.component` — formularios
  apresentacionais (validacao local apenas de formato basico).
- `document-upload.component` — selecao de tipo + arquivo, limite local de 10 MB.
- `onboarding-status.component` — badge de status + resultado.

Servico e persistencia (`src/app/core/onboarding/`):
- `onboarding-mobile.service` — transporte HTTP de `/api/v1/onboarding/pessoa|empresa`
  (iniciar, documentos via `FormData`, verificar, consultar status, representantes PJ).
- `onboarding-journey.store` — persiste o ponteiro `{tipo, onboardingId}` via Capacitor
  Preferences. Necessario porque o backend nao expoe consulta do onboarding corrente por
  usuario (apenas por id); sem o ponteiro, recarregar o app perderia a jornada e um novo
  `POST` do mesmo CPF/CNPJ retornaria 409. Nao persiste PII.

MSW (`src/mocks/handlers.ts`): cenarios de onboarding selecionados pelo documento de
entrada — documento so com zeros => erro (409 ao iniciar); so com uns => pendencia
(verificar resulta em `PENDENCIA`); demais => caminho feliz.

Testes:
- Vitest: componentes com `ion-input`/`ion-select` sao testados por instancia
  (`runInInjectionContext`), pois o happy-dom nao monta esses web components Ionic — mesma
  convencao de `login`/`register`.
- E2E PWA (`e2e/onboarding-mobile.spec.ts`): jornada feliz servida por MSW
  (`NG_APP_USE_MSW` via `localStorage`), sem backend real, em viewport mobile (Pixel 5).

Spec e steps:
- [`specs/fase-3/206-msprint-6-onboarding-mobile.md`](../../specs/fase-3/206-msprint-6-onboarding-mobile.md)
- [`steps-fase-3/mobile/206-msprint-6-steps.md`](../../steps-fase-3/mobile/206-msprint-6-steps.md)

## Credito e Open Finance do tomador (M-Sprint 7)

Jornada PWA de credito que consome as APIs reais de `sep-api` (credito Sprints 8-9). O app
permite ao tomador criar, listar e acompanhar propostas e concluir o consentimento Open
Finance; **motor de credito, score, elegibilidade, juros e decisoes permanecem no backend** —
o app apenas apresenta os estados recebidos.

Rotas (lazy, sob o shell autenticado, `roleGuard` com `roles: ['CLIENTE']`, `data.tab = 'propostas'`):
- `/app/propostas` — lista paginada das propostas do tomador.
- `/app/propostas/nova` — criacao de proposta.
- `/app/propostas/:id` — detalhe e status.
- `/app/propostas/:id/open-finance` — consentimento.
- `/app/propostas/:id/open-finance/retorno` — retorno do handoff (mesmo componente, `data.retorno`).

Entradas: atalhos da home do tomador "Solicitar emprestimo" (`/app/propostas/nova`) e
"Acompanhar proposta" (`/app/propostas`), alem da tab "Propostas".

Telas/componentes (`src/app/features/tomador/credito/`):
- `propostas-list.component` — lista paginada (`page/size`), filtro por status, estados
  loading/vazio/erro+retry, pull-to-refresh; toque abre o detalhe. Token de geracao descarta
  respostas concorrentes obsoletas. Nunca envia `tomadorId`.
- `proposta-create.component` — formulario (`tipoOperacao`, `valorSolicitado`, `prazoMeses`)
  reutilizando o ponteiro do `OnboardingJourneyStore` (M-6) como `solicitacaoOnboardingId`,
  sem expor UUID. Trata `400/403/404/422`; `422` oferece CTA para revisar o onboarding.
- `proposta-detail.component` — detalhe + status; quando ha parecer, exibe apenas decisao,
  justificativa e data. Nao exibe score, `pareceristaId`, IDs internos nem trilha de regras.
- `proposta-status.component` — badge de status compartilhado por lista e detalhe;
  `PRE_APROVADA` nunca e apresentada como aprovacao final.
- `open-finance.component` — fluxo opt-in (consentimento + retorno na mesma tela via
  `data.retorno`): `redirectUri` sempre gerada pelo app, handoff so para `http(s)`, retorno
  consulta a API SEP (query params do provider sao ignorados), `409` consulta o status em vez
  de criar outro consentimento. Exibe apenas agregados sanitizados.

Servico (`src/app/core/credito/credito-mobile.service.ts`): transporte HTTP de
`/api/v1/credito/propostas` e `/open-finance/consentimento`; centraliza URLs e omite query
params vazios. Os DTOs de borda ficam em `src/app/core/api/api.models.ts`.

Limites LGPD / seguranca: documento (CPF/CNPJ) fica apenas no estado do formulario e e limpo
apos o handoff — nunca persistido. Agregados Open Finance exibidos apenas como
`mediaEntradasMensal`, `mediaSaidasMensal`, `saldoMedio`, `numeroMesesAvaliados` e
`dataRecebimento`; nunca payload bruto, transacoes, conta, agencia, titular ou documento.

MSW (`src/mocks/handlers.ts`): estado de credito/Open Finance persistido em `localStorage`
(sobrevive ao reload do handoff no e2e; node cai para memoria via guarda). Gatilhos por
`solicitacaoOnboardingId`: so zeros => `422`, `inexistente` => `404`, demais => `201`. O
consentimento simula autorizacao instantanea (status `AUTORIZADO` com agregados ficticios).

Testes:
- Vitest: componentes com `ion-input`/`ion-select` testados por instancia
  (`runInInjectionContext`); `proposta-status` (so `<span>`) testado com render real.
- E2E PWA (`e2e/credito-mobile.spec.ts`): jornada completa por MSW (login -> lista vazia ->
  criar -> detalhe -> Open Finance -> handoff -> retorno `AUTORIZADO`), em Pixel 5 e em 320px,
  com assercoes negativas (sem `parecerista`, agencia ou documento apos o handoff).

Spec e steps:
- [`specs/fase-3/207-msprint-7-credito-mobile.md`](../../specs/fase-3/207-msprint-7-credito-mobile.md)
- [`steps-fase-3/mobile/207-msprint-7-steps.md`](../../steps-fase-3/mobile/207-msprint-7-steps.md)

## Formalizacao e contrato do tomador (M-Sprint 8)

Jornada PWA de formalizacao que consome os contratos reais de `sep-api` (contratos Sprints
10-11). O tomador localiza o contrato a partir de uma proposta propria, le a versao vigente,
registra o aceite com step-up e acompanha assinatura/CCB. **Ownership, versionamento, regra
contratual, assinatura e validade juridica permanecem no backend** — o app apenas apresenta os
snapshots recebidos e nunca calcula status, hash ou validade.

Rotas (lazy, sob o shell autenticado, `roleGuard` com `roles: ['CLIENTE']`, `data.tab = 'propostas'`):
- `/app/formalizacao` — entrada: lista as propostas `APROVADA` do tomador (fonte
  `CreditoMobileService`), sem N+1 e sem inventar lista global de contratos.
- `/app/formalizacao/proposta/:propostaId` — detalhe resolvido por proposta.
- `/app/formalizacao/contratos/:contratoId` — detalhe resolvido por contrato (usado tambem como
  `next` do step-up).

Entradas: atalho "Formalizacao" na home do tomador (`/app/formalizacao`) e CTA "Ver
formalizacao" no detalhe da proposta, exibido apenas para proposta `APROVADA` (a existencia do
contrato e confirmada pelo backend; nao e inferida pelo status).

Nao existe `GET /api/v1/contratos` global: a entrada lista propostas e o contrato so e
consultado ao abrir uma proposta. Proposta aprovada ainda sem contrato retorna `404` (mensagem
"contrato ainda indisponivel" com retry; o app nunca gera contrato).

Telas/componentes (`src/app/features/tomador/formalizacao/`):
- `formalizacao-list.component` — entrada paginada (filtro fixo `APROVADA`), estados
  loading/vazio/erro+retry, pull-to-refresh; token de geracao descarta respostas obsoletas.
- `contrato-detail.component` — orquestra carga (por proposta ou id, usando `contrato.id` como
  identidade), leitura, historico, aceite com step-up, status de assinatura e download. Trata
  `403` (ownership, mensagem neutra), `404` (indisponivel) e rede com retry.
- `contrato-content.component` — apresentacional: renderiza a versao (cabecalho, hash SHA-256
  com quebra/copia, `conteudoTexto` e clausulas) **somente como texto** (interpolacao, nunca
  `innerHTML`); o hash nao e recalculado nem validado.

Leitura e historico: a versao vigente e exibida por padrao; o historico
(`GET /contratos/{id}/versoes`) e carregado sob demanda preservando a ordem ascendente.
Selecionar uma versao historica muda apenas a leitura, nunca a vigente, e nunca habilita aceite.
Falha no historico nao impede a leitura da versao vigente embutida no contrato.

Aceite com step-up: o CTA "Aceitar contrato" so aparece para a versao vigente em
`AGUARDANDO_ACEITE` e ao titular `CLIENTE`. A confirmacao mostra numero da versao e hash, sem
checkbox pre-marcado; cancelar nao chama API e o duplo submit e bloqueado. Sem MFA o aceite e
bloqueado com orientacao (o mobile **nao** usa o bypass legado do backend). Com MFA e sem token,
o app navega para `/app/step-up?next=/app/formalizacao/contratos/{id}` e, ao voltar, exige novo
toque explicito (nenhum aceite automatico). O `stepUpInterceptor` anexa `X-Step-Up-Token` apenas
no `PATCH /contratos/{id}/aceite` (uso unico). Concorrencia/erros: `403` de step-up limpa o token
e reabre a verificacao, `403` de ownership nao entra em loop, `409` recarrega e exige nova
leitura, rede/`5xx` nao assume aceite.

Status e documento: pos-aceite, a fase de assinatura exibe `statusContrato` e, quando presente,
o `statusEnvelope` (`RASCUNHO`/`ENVIADO`/`VISUALIZADO`/`ASSINADO`/`RECUSADO`/`EXPIRADO`),
atualizados por acao do usuario (sem polling). Quando `ASSINADO`, o CTA baixa o PDF assinado pela
API autenticada do SEP como blob transitorio: a URL de objeto e criada no momento do download e
revogada em seguida; nada (blob, hash, token) e persistido ou logado, e o conteudo do PDF nunca
entra no DOM. Corpo `200` vazio e tratado como erro explicito, nunca como download bem-sucedido.

Servico (`src/app/core/contratos/contratos-mobile.service.ts`): transporte HTTP de
`/api/v1/contratos` (consulta por proposta/id, versoes, aceite, status de assinatura e download
binario). Os DTOs de borda ficam em `src/app/core/api/api.models.ts`.

Limites de seguranca: `idEnvelopeExterno`, `tomadorId`, `parecerOrigemId`, IP e User-Agent do
aceite chegam nos DTOs por fidelidade ao backend, mas nunca sao exibidos. O step-up token fica
apenas em memoria (`StepUpTokenStore`, uso unico) — nunca em `localStorage`, `sessionStorage` ou
Capacitor Preferences. Operacoes `FINANCEIRO`/`ADMIN` (cancelar, reenviar, reprocessar) e o
webhook/provider Clicksign ficam fora do app.

MSW (`src/mocks/handlers.ts`): handlers de step-up (`initiate`/`complete`) e de formalizacao
respondem apenas para a proposta/contrato semeados pelo smoke (demais ids => `404`, sem afetar os
outros smokes). O estado avanca o envelope a cada consulta ate `ASSINADO`; dados e PDF
integralmente ficticios, sem token/PII persistidos. O usuario mock passa a ter `mfaHabilitado`
para exercitar o step-up.

Testes:
- Vitest: `ContratosMobileService`, rotas, entrada, CTA da proposta, detalhe, conteudo,
  historico, interceptor de step-up, aceite (MFA/token/concorrencia/erros), status e
  blob/headers/revogacao da URL — componentes Ionic testados por instancia.
- E2E PWA (`e2e/formalizacao-mobile.spec.ts`): jornada completa por MSW (entrada -> leitura ->
  historico -> aceite com step-up -> retorno sem aceite automatico -> aceite efetivo -> status ->
  download), em Pixel 5 e 320px, com assercoes negativas (sem envelope externo, sem operacoes
  internas, sem token em storage).

Gap conhecido: o controller de contratos ainda usa `@RequireStepUp` legado, que tem bypass
server-side para usuario sem MFA. O mobile exige MFA antes do aceite, mas isso **nao** substitui
enforcement server-side; o go-live da jornada exige confirmar a politica operacional de MFA ou
aprovar hardening backend para step-up estrito.

Spec e steps:
- [`specs/fase-3/208-msprint-8-formalizacao-mobile.md`](../../specs/fase-3/208-msprint-8-formalizacao-mobile.md)
- [`steps-fase-3/mobile/208-msprint-8-steps.md`](../../steps-fase-3/mobile/208-msprint-8-steps.md)

## Parcelas e cobranca do tomador (M-Sprint 9)

Jornada PWA de parcelas que consome os contratos reais de cobranca de `sep-api` (Sprints
12-13 + desbloqueios 23/B1 e 24/B2). O tomador parte de uma proposta propria; o app resolve o
contrato e a agenda sob demanda e apresenta parcelas, vencimentos, valores atualizados,
historico de recebimentos e a decisao de renegociacao. **Ownership, calculo de
saldo/juros/mora/multa, dias de atraso, status, total renegociado e transicoes permanecem no
backend** — o app apenas apresenta os snapshots e nunca recalcula valor monetario nem deriva
status por data.

**Status**: M-Sprint 9 concluida — mergeada em `origin/develop` via PR #107 (`7162b67`) e
promovida a `origin/main` via PR #108 (`1454818`), 2026-07-02 (develop==main; pos-merge
`npm ci` + `format:check` + Vitest 355 verdes). B1 (Sprint 23, PR #81) e B2 (Sprint 24,
PR #83) mergeados no `sep-api`.

Rotas (lazy, shell autenticado, `roleGuard` com `roles: ['CLIENTE']`, `data.tab = 'parcelas'`):
- `/app/parcelas` — entrada: lista as propostas `APROVADA` do tomador, sem N+1.
- `/app/parcelas/proposta/:propostaId` — agenda resolvida por proposta.
- `/app/parcelas/contratos/:contratoId` — agenda resolvida por contrato.
- `/app/parcelas/contratos/:contratoId/parcelas/:parcelaId` — detalhe da parcela.
- `/app/parcelas/contratos/:contratoId/parcelas/:parcelaId/renegociacao` — termos e decisao
  da renegociacao ativa (M-9.5).

Entrada: a tab "Parcelas" aponta para `/app/parcelas`; o detalhe do contrato exibe o CTA "Ver
parcelas" apenas quando o contrato esta `ASSINADO`. Nao existe lista global de
contratos/agendas: a agenda so e consultada ao abrir uma proposta e apenas quando o contrato
esta `ASSINADO` (o backend so gera agenda pos-assinatura); contrato nao assinado nao dispara
chamada de agenda.

Telas/componentes (`src/app/features/tomador/cobranca/`):
- `parcelas-entry.component` — entrada paginada (filtro fixo `APROVADA`), estados
  loading/vazio/erro+retry, pull-to-refresh; token de geracao descarta respostas obsoletas.
  Lista vazia significa ausencia de proposta elegivel, nunca divida quitada.
- `agenda-detail.component` — resolve contrato→agenda (por proposta ou id, usando `contrato.id`
  como identidade) e lista as parcelas (numero, vencimento, valor da agenda, status). `404` =
  "parcelas ainda indisponiveis" com retry (nunca lista vazia); `403` neutro; rede com retry.
- `parcela-detail.component` — valor atualizado (`ValorAtualizadoParcelaResponse`): principal,
  juros, mora, multa, valor devido, total recebido e valor em aberto, sem recalculo local.
  Atualizacao sob demanda (sem polling); token de geracao descarta resposta obsoleta. `403`
  neutro, `404` com retorno a agenda, `409`/rede mantem o ultimo snapshot marcado como
  desatualizado. `RENEGOCIADA` oferece voltar a agenda; `EM_NEGOCIACAO` exibe o CTA "Ver
  termos da renegociacao". Secao "Historico de recebimentos" (M-9.4, contrato B1) recolhida
  por padrao e carregada sob demanda: ordem DESC do backend preservada, `totalRecebido` do
  detalhe segue autoritativo (o app nao soma o historico) e falha do historico e isolada
  (erro proprio + retry, sem bloquear o detalhe). Reentrada via stack do `ion-router-outlet`
  reconsulta a parcela (`ionViewWillEnter`) para nunca exibir snapshot obsoleto.
- `renegociacao-detail.component` — termos da renegociacao ativa (M-9.5, contrato B2): valor
  por parcela, quantidade, **total calculado no backend** (nunca `valor x quantidade` local),
  primeiro vencimento, desconto, proposta/expiracao. Termos reconsultados ao entrar, na
  reentrada da stack e imediatamente antes de cada confirmacao. Aceite exige confirmacao
  explicita + MFA habilitado (bloqueia sem MFA, sem bypass) + step-up de uso unico; o retorno
  do step-up nunca aceita automaticamente. Recusa explicita nao inicia nem consome step-up.
  `403` de step-up limpa o token e reinicia a verificacao; `403` de ownership e neutro;
  `404`/`409` recarregam os termos; rede/5xx nunca vira sucesso presumido; duplo submit
  bloqueado. Pos-aceite navega para a agenda ativa (substituta); pos-recusa volta ao detalhe
  da parcela.
- `parcela-status.component` — badge reutilizado por lista e detalhe; mapeia os 7
  `StatusParcela` para texto + tom acessivel (o texto sempre acompanha a cor).

Servico (`src/app/core/cobranca/cobranca-mobile.service.ts`): transporte HTTP de
`/api/v1/cobranca` — `consultarAgenda(contratoId)`, `consultarParcela(parcelaId)`,
`consultarRecebimentos(parcelaId)` (B1), `consultarRenegociacaoAtiva(parcelaId)` (B2) e
`aceitarRenegociacao`/`recusarRenegociacao` (PATCHes da Sprint 13; corpo interno descartado —
o app usa o status HTTP e reconsulta). Os DTOs de borda (`RecebimentoTomadorResponse`,
`RenegociacaoTomadorResponse`, `StatusRenegociacao`) ficam em
`src/app/core/api/api.models.ts` e espelham os contratos owner-scoped — nunca os DTOs
internos `RecebimentoResponse`/`RenegociacaoResponse`.

Step-up: o `stepUpInterceptor` anexa `X-Step-Up-Token` por matching exato tambem em
`PATCH /api/v1/cobranca/renegociacoes/{id}/aceite`; a recusa e os GETs de
agenda/parcela/historico/renegociacao nunca recebem nem consomem o token (uso unico, apenas
em memoria).

Limites de seguranca: endpoints internos `FINANCEIRO/ADMIN` (recebimento manual, listagem de
recebimentos, inadimplencia, contato, proposta de renegociacao) nao sao chamados nem expostos.
Nenhum dado financeiro e persistido em `localStorage`, `sessionStorage` ou Capacitor
Preferences. `403` de ownership usa mensagem neutra, sem enumerar existencia. O JSON publico
nao contem `tomadorId`, `propostaPor`, IDs de agenda, escrow, operador ou justificativa.

Testes: Vitest (355) cobre o service (incl. B1/B2 e PATCHes), as rotas (`roleGuard CLIENTE`),
a entrada (sem N+1), a agenda, o detalhe (valor sem recalculo, historico lazy/isolado, erros,
concorrencia, `ionViewWillEnter`), a renegociacao (termos completos, MFA/step-up/retorno sem
auto-aceite, recusa, 403/404/409/rede, duplo submit) e o `stepUpInterceptor` (aceite anexa e
consome; recusa/GET/URL parecida nao) — componentes Ionic testados por instancia. MSW cobre a
agenda com os 7 status, historico vazio/com recebimentos, renegociacao ativa e os PATCHes com
estado observavel (aceite exige `X-Step-Up-Token` e substitui a agenda; recusa restaura o
status anterior). Smoke Playwright `e2e/cobranca-mobile.spec.ts`: jornada completa
login → parcelas → agenda → detalhe/historico → termos → step-up → retorno sem aceite
automatico → aceite → agenda substituta; recusa sem step-up; viewport Pixel 5 e 320 px; sem
token em storage e sem campos proibidos no DOM.

Spec e steps:
- [`specs/fase-3/209-msprint-9-cobranca-mobile.md`](../../specs/fase-3/209-msprint-9-cobranca-mobile.md)
- [`steps-fase-3/mobile/209-msprint-9-steps.md`](../../steps-fase-3/mobile/209-msprint-9-steps.md)
- backend desbloqueio: [`023`](../../specs/fase-3/023-sprint-23-cobranca-historico-tomador.md) (B1, mergeada PR #81) e [`024`](../../specs/fase-3/024-sprint-24-cobranca-renegociacao-tomador.md) (B2, mergeada PR #83).

## Jornada da empresa credora (M-Sprint 10)

Jornada PWA da empresa credora que consome os contratos reais do modulo `credores` de `sep-api`
(Sprints 16-17 + Sprint 25, que fecha o Gate I1 com a leitura autoritativa do interesse ativo).
**Nao existe role `CREDORA`**: o acesso e governado por autenticacao + presenca de credora
confirmada por `GET /api/v1/credores/me`. **Ownership, elegibilidade, regras de interesse,
associacao de carteira, auditoria e calculos financeiros permanecem no backend** — o app apenas
apresenta snapshots, formata na borda (`Intl`) e nunca recalcula valor/taxa/saldo.

**Status**: concluída — mergeada em `origin/develop` via PR #109 (`f51e6be`), 2026-07-03; não
promovida a `main` (develop ⊃ main). Depende da Sprint 25 backend (Gate I1), mergeada em
`origin/develop` e `main` (PR #85).

Modelo de acesso (sem role): `GET /credores/me` → 200 libera; 404 = usuario sem credora (nao
libera); rede/5xx = estado tecnico com retry, nunca conclui "nao e credora". O `credoraPresenceGuard`
governa as rotas e a tab Credora aparece apenas apos a presenca confirmada.

Rotas (lazy, shell autenticado, `credoraPresenceGuard`, `data.tab = 'credora'`):
- `/app/credora/inicio` — dashboard.
- `/app/credora/perfil` — perfil/elegibilidade.
- `/app/credora/oportunidades` e `/app/credora/oportunidades/:oportunidadeId`.
- `/app/credora/carteira` e `/app/credora/carteira/:operacaoId`.

Entrada: uma unica tab "Credora" (inserida antes de "Perfil", mantendo no maximo 5 tabs para um
`CLIENTE` que tambem possui credora), exibida somente com presenca confirmada. A navegacao das tabs
passa pelo `router` (o `ion-tab-button` nao usa mais `[tab]`/`[href]`): a tab Credora e adicionada
apos a presenca async e nao seria registrada pelo `ion-tabs` no init, o que fazia o clique cair no
comportamento de ancora do `[href]` (reload de pagina inteira). O destaque da tab ativa vem de
`estaAtiva` (compara o `router.url`).

Telas/componentes (`src/app/features/credora/`):
- `home/home.component` — dashboard: razao social, tipo, status/elegibilidade (pills semanticas) e
  atalhos para perfil/oportunidades/carteira. Contagens sao apenas o tamanho das listas (carga
  paralela tolerante a falha parcial); nao calcula total aportado/rentabilidade/exposicao.
- `perfil/credora-profile.component` — snapshot do `/me`: razao, CNPJ (formatado pelo backend),
  tipo, capacidade de aporte (quando presente), status/elegibilidade, motivo de inelegibilidade
  (quando retornado) e datas. Nao edita, nao reexecuta KYB/PLD, nao exibe `usuarioId`/`onboardingId`.
- `oportunidades/opportunity-list.component` e `opportunity-detail.component` — lista (ordem do
  backend, sem paginacao) e detalhe read-only; `ionViewWillEnter` reconsulta na reentrada; token de
  geracao descarta resposta obsoleta; `404` neutro + retorno; nao expoe `propostaId`/`contratoId`.
  O detalhe manifesta/cancela interesse com **estado autoritativo** (`GET .../interesses/me`, Sprint
  25): confirmacao explicita, duplo submit bloqueado, reconsulta pos-mutacao, `201`/`204` reconsultam,
  `409`/`404` reconsultam sem presumir, `422` informa sem alterar, rede/5xx nunca vira sucesso. **Sem
  step-up.** Copy deixa claro que interesse nao gera aporte/reserva/matching/alocacao/carteira.
- `carteira/portfolio-list.component` e `portfolio-detail.component` — carteira simplificada: campos
  nullable viram "Nao informado" (sem zero inventado); agregados de cobranca (parcelas pagas/atrasadas,
  total recebido, proximo vencimento) exibidos diretamente, sem recalculo; nao soma "total aportado";
  nao exibe `justificativa` operacional nem IDs de contrato/oportunidade; lista vazia explica que
  interesse nao gera carteira automaticamente (associacao assistida, fora do app).
- `shared/` — `credora-status`/`oportunidade-status`/`operacao-status` (pills semanticas) e
  `credora-format` (moeda/taxa/data; taxa como fracao via `Intl percent`, igual ao consumidor web).

Borda (`src/app/core/credores/`): `credora-mobile.service` (9 endpoints permitidos aqui; a M-Sprint 16
acrescenta `listarAportes` como decimo — ver secao propria; sem cadastro/sync/associacao admin;
`POST` interesses sem corpo; `DELETE` 204 sem DTO; propaga 404/409/422)
e `credora-context.store` — presenca **efemera em memoria** (sem storage), deduplica chamadas
concorrentes, distingue 404 de rede/5xx, escopa presenca/credora ao usuario autenticado (troca de
usuario/logout invalidam) e descarta resposta de usuario trocado durante a requisicao.

Limites de seguranca/regulatorio: endpoints ADMIN (`POST /credores`, `.../sync`,
`.../carteira/operacoes`) nao sao chamados nem expostos. Nada de credora/interesse e persistido em
`localStorage`/`sessionStorage`/Preferences. `404` de detalhe e neutro (nao enumera recurso alheio).
Nenhum dado do tomador, `justificativa`, ID interno, escrow ou payload de provider aparece no DOM.

Testes: Vitest cobre o service (URLs/metodos, 204, propagacao 404/409/422, ausencia de admin), o
store (presente/ausente/erro, dedup, troca de usuario/logout, descarte de resposta trocada), o guard
(presente/ausente/erro), a tab condicional, dashboard/perfil, oportunidades/detalhe (formatacao,
`404`, obsoleta, IDs ausentes, encerrada) e o interesse (201/409/422/404/rede, cancelamento, duplo
submit, sem step-up, inelegivel/encerrada desabilitam) e a carteira (nullable, agregados sem
recalculo, sem justificativa/IDs). Smoke Playwright `e2e/credora-mobile.spec.ts`: jornada dashboard
→ perfil → oportunidades → interesse → carteira; tomador sem credora (guard + sem tab); inelegivel
nao manifesta; carteira vazia; 320 px; tema escuro; assercoes negativas (sem admin/aporte/escrow/
tomador/IDs/justificativa) e storage sem dados persistidos.

Spec e steps:
- [`specs/fase-3/210-msprint-10-credora-mobile.md`](../../specs/fase-3/210-msprint-10-credora-mobile.md)
- [`steps-fase-3/mobile/210-msprint-10-steps.md`](../../steps-fase-3/mobile/210-msprint-10-steps.md)
- backend Gate I1: [`025`](../../steps-fase-3/backend/025-sprint-25-steps.md) (Sprint 25, `GET .../interesses/me`, mergeada PR #85).

## Pix visivel ao usuario (M-Sprint 11)

Exibe ao tomador e a credora o estado Pix das operacoes que lhes pertencem, integrado as telas
existentes de contrato, parcela e carteira, **sem** expor comandos financeiros internos, conciliacao,
provider, escrow ou dados de outra parte. Consome os tres contratos backend owner-scoped da **Sprint
26** (Gates P1-P3): desembolso do tomador, status Pix da parcela e status Pix da operacao da credora.
Leituras read-only, sem step-up, sem persistencia; ownership, status e valor vem do backend e o app
apenas apresenta.

**Status**: mergeada em `origin/develop` via PR #111 (squash `34f4f0f`, 2026-07-06) e promovida a
`origin/main` via PR #112 (`ec74f5e`). Tasks M-11.1-M-11.5 + hotfix do code review. Depende da Sprint 26 backend (Gates
P1-P3), mergeada em `origin/develop` e `main` (PR #87/#88).

Borda (`src/app/core/`):
- `api/api.models` — `StatusPixPublico` (P1/P3), `StatusPixParcelaPublico` (P2) e as respostas
  `PixDesembolsoTomadorResponse`/`PixPagamentoParcelaResponse`/`PixOperacaoCredoraResponse` (espelham
  o JSON real; so `mensagemPublica` nullable).
- `pix/pix-mobile.service` — tres GET read-only (`consultarDesembolsoDoContrato`,
  `consultarStatusPixDaParcela`, `consultarStatusPixDaOperacao`). Sem step-up, `Idempotency-Key` ou
  header financeiro; `403`/`404`/`5xx` propagam para a UI. Nenhum endpoint operacional Pix e exposto.

Componentes (`src/app/features/pix/`):
- `pix-status-publico.component` — badge de `StatusPixPublico` (reusado por P1 e P3).
- `pix-status-parcela.component` — badge de `StatusPixParcelaPublico` (P2). DIVERGENTE orienta
  verificacao; FALHOU nunca vira pago.

Integracao nas telas existentes:
- **P1 — desembolso do tomador** (`features/tomador/formalizacao/contrato-detail`): card "Desembolso
  Pix" apos o contrato ASSINADO (o desembolso so existe pos-assinatura). Consulta apos o contrato
  carregar e reconsulta em `ionViewWillEnter` + refresh; `404` = "ainda nao disponivel"; rede/5xx =
  erro isolado com retry; a consulta ocorre apos liberar o spinner do contrato (falha do card nao
  bloqueia a tela).
- **P2 — parcela do tomador** (`features/tomador/cobranca/parcela-detail`): card "Pagamento Pix" que
  **complementa, nao substitui** o status autoritativo de cobranca. Estado derivado no backend por
  precedencia; `mensagemPublica` sanitizada so em DIVERGENTE/FALHOU. O historico liquidado da M-9 e
  reutilizado com destaque visual para `meioPagamento=PIX` (sem nova chamada). Token de geracao
  descarta resposta obsoleta.
- **P3 — operacao da credora** (`features/credora/carteira/portfolio-detail`): card "Status Pix da
  operacao" (so status/valor/data). Acesso por presenca de credora (sem role `CREDORA`).

Limites de seguranca: nenhuma rota operacional Pix (desembolsos, referencias, recebimentos internos)
e chamada; nenhum `txid`, copia-cola, `endToEndId`, chave, escrow, provider ou ID interno aparece no
DOM ou em storage; nenhuma rota M-11 entra no allowlist do `stepUpInterceptor`; nada de estado Pix e
persistido.

Testes: Vitest cobre os mappers (rotulo/tom exaustivos), o service (URLs/metodos, ausencia de
step-up/Idempotency, 403/404) e a integracao nas tres telas (estados, 404 neutro vs erro+retry,
reentrada, concorrencia por token de geracao, falha isolada, ausencia de campos proibidos). Smoke
Playwright `e2e/pix-mobile.spec.ts`: tomador ve desembolso no contrato + status Pix na parcela +
destaque PIX no historico + ausencia neutra; credora ve status Pix da operacao; 5xx com retry; `404`
neutro; tema escuro; 320 px; assercoes negativas (sem txid/copia-cola/endToEndId/escrow, storage sem
estado Pix) e interceptacao provando que nenhuma rota operacional Pix e chamada. Handlers MSW
`pixHandlers` reseedaveis por `mock.pix`.

Spec e steps:
- [`specs/fase-3/211-msprint-11-pix-mobile.md`](../../specs/fase-3/211-msprint-11-pix-mobile.md)
- [`steps-fase-3/mobile/211-msprint-11-steps.md`](../../steps-fase-3/mobile/211-msprint-11-steps.md)
- backend Gates P1-P3: [`026`](../../steps-fase-3/backend/026-sprint-26-steps.md) (Sprint 26, mergeada PR #87/#88).

## Aportes owner-scoped da credora (M-Sprint 16)

Exibe a empresa credora dona os **aportes da propria operacao**, em somente leitura, dentro do
detalhe da carteira ja existente. Consome um unico contrato da **Sprint 29**:

```http
GET /api/v1/credores/operacoes/{operacaoId}/aportes
```

Autenticado (`isAuthenticated()`), **sem step-up e sem `Idempotency-Key`**: ownership, ordem, valores
e estados sao resolvidos no backend, que devolve `404` neutro para operacao alheia ou inexistente.

**Escopo reduzido pelo Gate M-16.0.** O recorte original da spec 216 previa tambem matching
assistido, registro de aporte e visibilidade de chaves Pix. Os cinco outros endpoints exigem
`FINANCEIRO`/`ADMIN`, e o `sep-mobile` so conhece `UsuarioRole = 'ADMIN' | 'CLIENTE'`
(`src/app/core/api/api.models.ts`) — a credora autentica como `CLIENTE` e receberia `403`. Esse
escopo foi **adiado**, nao implementado silenciosamente; a decisao e a tabela de alcance por endpoint
estao na spec 216. O item de Pix avancado do `v1.0-local` (PRD-FASE-4 §37) **nao** e fechado por esta
sprint.

Borda: `AporteCredoraResponse` + `StatusAporteCredora`
(`PENDENTE | EM_PROCESSAMENTO | LIQUIDADO | FALHOU`) em `core/api/api.models.ts`, e
`listarAportes(operacaoId)` em `core/credores/credora-mobile.service` (decimo endpoint permitido).
O `stepUpInterceptor` **nao** foi alterado: o token e de uso unico e consumi-lo num GET inutilizaria
a proxima mutacao legitima do usuario — ha teste travando isso.

Tela (`features/credora/carteira/portfolio-detail.component`): secao "Aportes da operacao" espelhando
o padrao ja usado pelo card de status Pix — leitura secundaria que **nao bloqueia** o detalhe
principal, com token de geracao descartando resposta obsoleta e retry proprio. Quatro superficies
mutuamente exclusivas: carregando, lista, **vazia** (`200 []`), **indisponivel** (`404` neutro) e erro
tecnico (rede/5xx). Um `404` seguido de retry com 5xx mostra o erro tecnico, nao a ausencia neutra.
Falha da lista nunca derruba o detalhe da carteira ja carregado. Sem polling e sem refresh invisivel:
atualizacao so por gesto, com guarda de request em voo que impede duas leituras concorrentes no duplo
toque (o `[disabled]` do `ion-button` so vale a partir do proximo ciclo de change detection).

`shared/aporte-status.component` — badge dos quatro estados com **rotulo textual** (a cor nunca e a
unica informacao) e switch exaustivo sobre o union: novo status sem tom quebra a compilacao.

Limites: **nenhum CTA de mutacao** para a persona credora (registrar/decidir/matching); ordem vem do
backend e o app nao reordena nem agrega; nada de escrow, provider, `Idempotency-Key`, motivo tecnico
de falha ou ID interno no DOM; nada persistido em storage.

Testes: Vitest cobre o service (URL/metodo, ordem preservada, lista vazia, `404`, ausencia de
step-up/`Idempotency-Key`, ausencia de metodos de mutacao) e a tela (quatro estados com rotulo e tom,
vazio ≠ `404` ≠ erro tecnico, retry `404`→5xx, duplo toque com request unica, ausencia de CTA de
mutacao, ausencia de escrow/provider/IDs). Smoke Playwright em `e2e/credora-mobile.spec.ts`: credora
ve os quatro aportes em somente leitura com um unico botao no card, e operacao sem aportes mostra o
estado vazio. Handlers MSW em `credoresHandlers`, reseedaveis por `mock.credora` (`aportes:
'LISTA' | 'VAZIA'`), sem endpoint de mutacao mockado.

Spec e steps:
- [`specs/fase-4/216-msprint-16-aporte-pix-avancado-mobile.md`](../../specs/fase-4/216-msprint-16-aporte-pix-avancado-mobile.md)
- [`steps-fase-4/mobile/216-msprint-16-steps.md`](../../steps-fase-4/mobile/216-msprint-16-steps.md)
- backend: Sprint 29 (aporte, PR #93/#94). Sprints 30 (matching) e 31 (chaves Pix) ficaram sem
  consumo mobile pelo Gate M-16.0.

## Empacotamento nativo Android (M-Sprint 13)

Empacota o PWA como app **nativo Android** via Capacitor 8.4 ([ADR 0019](../../adr/0019-baseline-capacitor-8-mobile.md)
formaliza a baseline e supersede o ADR 0003 no recorte do Capacitor e o ADR 0015). Sem jornada,
endpoint ou contrato novo; PWA permanece intacto (fallback web explicito em todo runtime nativo).

**Status**: implementada em `feature/msprint-13-android-capacitor` (branch da sprint; ver
`SPRINT-M-13-PR.md` enquanto o PR nao e aberto).

Entregas principais:

- `android/` versionado (minSdk 24, compile/target SDK 36, Gradle 8.14.3, AGP 8.13.0); manifest
  endurecido (`allowBackup=false`, somente INTERNET, deep link por scheme `com.dynamis.sep.mobile://`
  — App Links https na Fase 5); `values/colors.xml` com tokens do DS.
- Icone adaptativo + splash claro/escuro gerados de `resources/logo.svg` (fonte versionada;
  **placeholder do DS** — arte oficial da marca e follow-up).
- Runtime nativo em `src/app/core/native/`: `PlatformService` (deteccao unica de plataforma) e
  `NativeRuntimeService` (status bar segue o tema; back button com saida previsivel nas raizes e
  `Location.back()` fora delas; deep links por allowlist com rejeicao de dot segments, navegando
  pelo Router e portanto pelos guards; falha de plugin isolada; no-op no web).
- `redirectAuthenticatedGuard` em `/welcome`, `/login` e `/register` (achado do smoke: pop do
  historico do WebView devolvia usuario logado a tela publica).
- Sessao: sem mudanca de storage (`Preferences` para tokens; step-up so em memoria); storage
  endurecido fica para a M-Sprint 15 (regra do ADR 0019).
- CI `CI-MOBILE` ganhou o job `Build Android (debug)` (Node 22 + JDK 21; `gradlew test lint
  assembleDebug`; artifact `mobile-android-apk-debug`; sem keystore).
- Smoke em emulador API 36 (build `dev-offline` com MSW; backend real e validacao manual): login ->
  home -> tabs, back button (raiz sai; intermediario volta), deep link valido/invalido, kill/reopen
  com sessao, logout, landscape, Logcat sem segredo/PII.

Spec e steps:
- [`specs/fase-4/213-msprint-13-empacotamento-nativo-android.md`](../../specs/fase-4/213-msprint-13-empacotamento-nativo-android.md)
- [`steps-fase-4/mobile/213-msprint-13-steps.md`](../../steps-fase-4/mobile/213-msprint-13-steps.md)
- [`adr/0019-baseline-capacitor-8-mobile.md`](../../adr/0019-baseline-capacitor-8-mobile.md)
