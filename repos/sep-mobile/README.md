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

## Parcelas e cobranca do tomador (M-Sprint 9 — recorte M-9.1 a M-9.3)

Jornada PWA de parcelas que consome os contratos reais de cobranca de `sep-api` (Sprints
12-13). O tomador parte de uma proposta propria; o app resolve o contrato e a agenda sob
demanda e apresenta parcelas, vencimentos, valores atualizados e estados. **Ownership, calculo
de saldo/juros/mora/multa, dias de atraso, status e transicoes permanecem no backend** — o app
apenas apresenta os snapshots e nunca recalcula valor monetario nem deriva status por data.

**Status**: M-9.1 a M-9.3 implementadas na branch `feature/msprint-9-cobranca-mobile` (nao
mergeada). M-9.4 (historico de recebimentos) e M-9.5 (renegociacao) dependem das Sprints 23
(B1) e 24 (B2) do `sep-api`; M-9.6 (MSW/smoke/docs) fecha a sprint. A sprint nao esta concluida
enquanto B1/B2 permanecerem bloqueados.

Rotas (lazy, shell autenticado, `roleGuard` com `roles: ['CLIENTE']`, `data.tab = 'parcelas'`):
- `/app/parcelas` — entrada: lista as propostas `APROVADA` do tomador, sem N+1.
- `/app/parcelas/proposta/:propostaId` — agenda resolvida por proposta.
- `/app/parcelas/contratos/:contratoId` — agenda resolvida por contrato.
- `/app/parcelas/contratos/:contratoId/parcelas/:parcelaId` — detalhe da parcela.
- (`.../parcelas/:parcelaId/renegociacao` fica para a M-9.5, apos a Sprint 24.)

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
  desatualizado. `RENEGOCIADA` oferece voltar a agenda; `EM_NEGOCIACAO` sinaliza a negociacao
  (o CTA de termos fica para a M-9.5).
- `parcela-status.component` — badge reutilizado por lista e detalhe; mapeia os 7
  `StatusParcela` para texto + tom acessivel (o texto sempre acompanha a cor).

Servico (`src/app/core/cobranca/cobranca-mobile.service.ts`): transporte HTTP de
`/api/v1/cobranca` — `consultarAgenda(contratoId)` e `consultarParcela(parcelaId)`. Os metodos
de historico e renegociacao (B1/B2) so serao adicionados apos as Sprints 23/24. Os DTOs de
borda ficam em `src/app/core/api/api.models.ts`.

Limites de seguranca: endpoints internos `FINANCEIRO/ADMIN` (recebimento manual, listagem de
recebimentos, inadimplencia, contato, proposta de renegociacao) nao sao chamados nem expostos.
Nenhum dado financeiro e persistido em `localStorage`, `sessionStorage` ou Capacitor
Preferences. `403` de ownership usa mensagem neutra, sem enumerar existencia.

Testes: Vitest cobre o service, as rotas (`roleGuard CLIENTE`), a entrada (sem N+1), a agenda
(descoberta, gate `ASSINADO`, `403`/`404`/rede), o detalhe (valor sem recalculo, erros,
concorrencia) e o `ParcelaStatusComponent` (mapa exaustivo) — componentes Ionic testados por
instancia. MSW, smoke PWA e regressao entram na M-9.6.

Spec e steps:
- [`specs/fase-3/209-msprint-9-cobranca-mobile.md`](../../specs/fase-3/209-msprint-9-cobranca-mobile.md)
- [`steps-fase-3/mobile/209-msprint-9-steps.md`](../../steps-fase-3/mobile/209-msprint-9-steps.md)
- backend desbloqueio: [`023`](../../specs/fase-3/023-sprint-23-cobranca-historico-tomador.md) (B1) e [`024`](../../specs/fase-3/024-sprint-24-cobranca-renegociacao-tomador.md) (B2).
