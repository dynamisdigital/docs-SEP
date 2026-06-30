# PR — M-Sprint 7: Credito e Open Finance no mobile (sep-mobile)

## Summary

Segunda jornada funcional do Epic 14 (tomador) no `sep-mobile`: criar, listar e acompanhar
propostas de credito e concluir o consentimento Open Finance no PWA, consumindo as APIs reais
de `sep-api` (credito Sprints 8-9). O app apenas apresenta os estados do backend —
**motor de credito, score, elegibilidade, juros, CET, IOF e decisoes permanecem no backend**.
Sem alteracao de contrato REST, regra de negocio, roles ou escopo das jornadas.

Branch: `feature/msprint-7-credito-mobile` (a partir de `origin/develop` reconciliada). Design
system vigente: New Design System SEP mobile (M-Sprint 12), Ionic standalone + SCSS.

## Mudancas por area

- **Borda HTTP** (`src/app/core/`):
  - `api/api.models.ts` — DTOs de credito/Open Finance espelhando o backend (`StatusProposta`,
    `TipoOperacao`, `StatusConsentimento`, `DecisaoParecer`, `PropostaResponse`,
    `ScoreInternoResponse` com `valor`, `ParecerCreditoResponse`, `PageResponse<T>`,
    `Iniciar/OpenFinanceStatus/MovimentacaoConsolidada`).
  - `credito/credito-mobile.service.ts` — transporte HTTP (lista/detalhe/criacao/consentimento/
    status), centraliza URLs, omite query params vazios, nunca envia `tomadorId`.
- **Jornada do tomador** (`src/app/features/tomador/credito/`):
  - `propostas-list.component` — lista paginada, filtro por status, estados loading/vazio/erro+
    retry, pull-to-refresh, token de geracao anti-resposta-obsoleta.
  - `proposta-create.component` — criacao reutilizando o ponteiro do `OnboardingJourneyStore`
    (M-6) como `solicitacaoOnboardingId` (sem UUID no form); erros `400/403/404/422`.
  - `proposta-detail.component` — detalhe + status + parecer (decisao/justificativa/data), sem
    score/`pareceristaId`/IDs internos/trilha de regras.
  - `proposta-status.component` — badge de status compartilhado (lista + detalhe).
  - `open-finance.component` — consentimento + retorno na mesma tela (`data.retorno`).
- **Rotas** (`features/authenticated/authenticated.routes.ts`): `propostas`, `propostas/nova`,
  `propostas/:id`, `propostas/:id/open-finance`, `.../retorno` — todas `roleGuard ['CLIENTE']`.
- **Home do tomador**: atalhos "Solicitar emprestimo" e "Acompanhar proposta" ligados.
- **MSW** (`src/mocks/handlers.ts`): handlers de credito/Open Finance, estado em `localStorage`.
- **E2E** (`e2e/credito-mobile.spec.ts`): smoke PWA da jornada completa (Pixel 5 + 320px).

## Migrations / contratos

- Nenhuma migration. Nenhum endpoint novo nem alteracao de contrato backend — apenas consumo.

## Decisoes aceitas

- Componentes Ionic (`ion-select`/`ion-input`) testados por instancia (`runInInjectionContext`);
  happy-dom nao monta esses web components. `proposta-status` (so `<span>`) com render real.
- Uma unica tela de Open Finance atende consentimento e retorno via `data.retorno` (reuso).
- `redirectUri` sempre gerada pelo app; handoff so para `http(s)`; retorno consulta a API SEP
  (query params do provider ignorados); `409` consulta status em vez de criar outro.
- Documento (CPF/CNPJ) e agregados nunca persistidos; agregados exibidos apenas sanitizados.
- MSW de credito persistido em `localStorage` para sobreviver ao reload do handoff no e2e
  (node cai para memoria via guarda); consentimento simula autorizacao instantanea.
- `support-reference.ts` + wiring no `error.interceptor` (codigo de suporte em erros 5xx) vieram
  da automacao do usuario e foram commitados em commit proprio, separados dos commits do M-7.

## Test plan

- `npm run lint`, `npm run lint:scss`, `npm run format:check` — verdes.
- `npm run test` — 212 testes Vitest verdes (service, lista, criacao, detalhe, status,
  Open Finance, rotas).
- `npm run build` — AOT verde.
- `npm run e2e -- e2e/smoke.spec.ts e2e/onboarding-mobile.spec.ts e2e/credito-mobile.spec.ts` —
  6 verdes. `credito-mobile` cobre login -> lista vazia -> criar -> detalhe -> Open Finance ->
  handoff -> retorno AUTORIZADO, em Pixel 5 e 320px, com assercoes negativas (sem `parecerista`,
  agencia ou documento apos o handoff).

## Dividas / follow-ups

- `golden-path-mobile`/`profile-actions` seguem vermelhos por exigirem backend real `:8080`
  (preexistente, nao regressao desta sprint).
- Re-consentimento Open Finance apos `NEGADO`/`EXPIRADO` nao tem botao dedicado (form so em
  `404`/sem-consentimento) — follow-up se necessario.
- Budget de SCSS: `propostas-list.component.scss` em ~2,9 kB (warning, < 4 kB de erro),
  consistente com componentes irmaos.
- Smoke com backend real `:8080` (step-up/MFA e codigos reais) recomendado manualmente.

## Notas

- Reconciliacao `main -> develop` (apenas bumps Dependabot) feita antes do codigo, via PR #92
  da automacao do usuario (titulo enganoso "Feature/msprint 7 credito mobile"; conteudo = deps).
- Colisao de nome: a branch remota `feature/msprint-7-credito-mobile` ja existia (deps, via #92);
  decidir no push (force-update, ja que o conteudo esta em develop, ou nome novo).

## Commits

- `e822608` feat(mobile): adicionar contratos e servico de credito
- `165b53f` feat(mobile): listar propostas do tomador
- `9d747c4` fix(mobile): restringir propostas a CLIENTE e endurecer a lista
- `33391e5` feat(mobile): permitir criacao de proposta
- `003af8b` feat(mobile): exibir detalhe e status da proposta
- `5edee9c` test(mobile): cobrir 403 no detalhe da proposta
- `3cda599` feat(mobile): anexar codigo de suporte a erros 5xx (automacao do usuario)
- `6101400` feat(mobile): implementar consentimento open finance
- `test(mobile): cobrir jornada de credito e open finance` (MSW + e2e + docs — M-7.6)
