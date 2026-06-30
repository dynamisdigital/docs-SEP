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
