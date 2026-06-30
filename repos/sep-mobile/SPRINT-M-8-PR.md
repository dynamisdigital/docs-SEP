# PR — M-Sprint 8: Formalizacao e contrato no mobile (sep-mobile)

## Summary

Implementa a jornada PWA de formalizacao do tomador (Epic 14) consumindo os contratos reais do
`sep-api` (contratos Sprints 10-11): entrada por proposta aprovada, leitura da versao vigente e do
historico, aceite com step-up e acompanhamento de assinatura/CCB com download do PDF assinado. O
app apenas apresenta os snapshots e reflete o backend: **ownership, versionamento, regra
contratual, assinatura e validade juridica permanecem no `sep-api`** — o mobile nunca calcula
status, hash ou validade.

Restrito a `CLIENTE` (`roleGuard`); o aceite e a unica operacao sensivel e exige step-up de uso
unico. Nao ha endpoint global de contratos: a entrada lista propostas e resolve o contrato apenas
ao abrir.

Spec `specs/fase-3/208-msprint-8-formalizacao-mobile.md`,
steps `steps-fase-3/mobile/208-msprint-8-steps.md`.

## Mudancas por area

- **Borda de API** (`core/contratos/contratos-mobile.service.ts`, `core/api/api.models.ts`):
  `ContratosMobileService` (transporte puro) com consulta por proposta/id, versoes, aceite (PATCH
  body vazio), status de assinatura e download binario (`observe: 'response'`, `responseType:
  'blob'`, le `Content-Disposition` + `X-Document-Hash-Sha256`, sanitiza o filename, fallback
  local). DTOs de borda fieis (`StatusFormalizacao`, `StatusEnvelope`, `TipoContrato`,
  `ClausulaContratoResponse`, `VersaoContratoResponse`, `AceiteContratoResponse`,
  `ContratoResponse`, `StatusAssinaturaResponse`). Corpo `200` vazio do documento vira erro
  explicito, nunca PDF vazio.
- **Rotas e entrada** (`features/authenticated/authenticated.routes.ts`,
  `features/tomador/formalizacao/formalizacao-list.component.*`,
  `features/tomador/credito/proposta-detail.component.*`,
  `features/tomador/home/home.component.*`): rotas lazy `/app/formalizacao`,
  `/app/formalizacao/proposta/:propostaId` e `/app/formalizacao/contratos/:contratoId`
  (`roleGuard CLIENTE`, `tab propostas`); entrada lista propostas `APROVADA` sem N+1; CTA "Ver
  formalizacao" no detalhe da proposta (so `APROVADA`) e atalho "Formalizacao" na home.
- **Detalhe e leitura** (`features/tomador/formalizacao/contrato-detail.component.*`,
  `contrato-content.component.*`): detalhe orquestra carga (por proposta ou id, identidade por
  `contrato.id`), leitura, historico, aceite, status e download; o componente apresentacional
  `contrato-content` renderiza versao/hash/conteudo/clausulas **somente como texto** (interpolacao,
  nunca `innerHTML`). Historico sob demanda preserva ordem ascendente; versao historica nunca muda
  a vigente nem habilita aceite; falha no historico nao bloqueia a leitura da vigente.
- **Aceite com step-up** (`core/interceptors/step-up.interceptor.ts`, `contrato-detail.component`):
  `stepUpInterceptor` passa a anexar `X-Step-Up-Token` tambem no `PATCH /contratos/{id}/aceite`
  (path exato, uso unico). CTA so para a versao vigente em `AGUARDANDO_ACEITE`; confirmacao
  explicita (numero + hash, sem checkbox), cancelar nao chama API, duplo submit bloqueado. Sem MFA
  bloqueia com orientacao (sem bypass legado); com MFA e sem token navega ao step-up e exige novo
  toque ao voltar (sem aceite automatico). `403` step-up limpa o token, `403` ownership nao entra
  em loop, `409` recarrega, rede/`5xx` nao assume aceite.
- **Status e documento** (`contrato-detail.component`): pos-aceite exibe `statusContrato` e
  `statusEnvelope` atualizados por acao (sem polling); quando `ASSINADO`, baixa o PDF pela API
  autenticada como blob transitorio (URL de objeto criada no momento e revogada em seguida; nada
  persistido ou logado; PDF nunca entra no DOM).
- **Fix de step-up** (`features/authenticated/step-up/step-up.component.html`): o botao de
  confirmacao usava `type="submit"` num `<form (ngSubmit)>` **sem `[formGroup]` e sem
  `FormsModule`**, entao o `ngSubmit` nunca era ligado e o clique fazia um submit nativo que
  recarregava a pagina e perdia o `?next`. Trocado para `type="button"` + `(click)="submit()"`.
  Bug pre-existente (5F-FIX-05) que bloqueava qualquer conclusao de step-up — incluindo o aceite.
- **Mocks** (`mocks/handlers.ts`): handlers de step-up (`initiate`/`complete`) e de formalizacao
  respondendo apenas para a proposta/contrato semeados pelo smoke; o envelope avanca a cada consulta
  ate `ASSINADO`; usuario mock passa a ter `mfaHabilitado` (apenas change-password e o aceite
  consomem a flag, ambos na submissao). Dados e PDF integralmente ficticios.

## Migrations / contratos

- Nenhuma migration (frontend). Nenhum contrato REST alterado: a sprint apenas consome endpoints ja
  entregues nas Sprints backend 10-11. Operacoes `FINANCEIRO`/`ADMIN` (cancelar, reenviar,
  reprocessar) e o webhook/provider Clicksign nao sao consumidos.

## Decisoes aceitas

- Sem `GET /api/v1/contratos` global: a entrada lista propostas `APROVADA` e resolve o contrato so
  ao abrir; `404` por proposta = "contrato ainda indisponivel" com retry (o app nunca gera
  contrato).
- Campos sensiveis (`tomadorId`, `parecerOrigemId`, `ipOrigem`, `userAgentOrigem`,
  `idEnvelopeExterno`) chegam nos DTOs por fidelidade ao backend, mas nunca sao exibidos.
- `contrato-content` extraido como componente apresentacional para clareza e para aliviar o budget
  de SCSS do detalhe (que recebeu aceite, status e documento).
- Status de assinatura atualizado por acao do usuario, sem polling nem background timer.

## Test plan

- `npm run lint`, `npm run lint:scss`, `npm run format:check`: verdes.
- `npm run test` (Vitest): 274 testes verdes — service, rotas/entrada/CTA, detalhe/conteudo/
  historico, interceptor de step-up, aceite (MFA/token/concorrencia/erros), status e
  blob/headers/revogacao.
- `npm run build` (AOT): verde; warnings de budget SCSS — novos da M-8
  `contrato-detail.component.scss` (3,62 kB) e `formalizacao-list.component.scss` (2,20 kB), alem
  dos preexistentes; todos abaixo do limite de erro de 4 kB.
- `npm run e2e` (`smoke`, `onboarding`, `credito`, `formalizacao`): 8 testes verdes. O smoke de
  formalizacao percorre entrada -> leitura -> historico -> aceite com step-up -> retorno sem aceite
  automatico -> aceite efetivo -> status ate `ASSINADO` -> download, em Pixel 5 e 320px, com
  assercoes negativas (sem envelope externo, sem operacoes internas, sem token em storage).

## Riscos / dividas aceitas

- **Go-live blocker**: o controller de contratos usa `@RequireStepUp` legado, com bypass
  server-side para usuario sem MFA. O mobile exige MFA antes do aceite, mas isso nao substitui
  enforcement server-side; o go-live exige confirmar a politica operacional de MFA ou aprovar
  hardening backend para step-up estrito.
- O step-up token e efemero e some no reload da app (em memoria, uso unico); apos reload o aceite
  exige nova verificacao — comportamento esperado.

## Follow-ups

- Hardening backend para step-up estrito no aceite (remover bypass legado) antes do go-live.
- Avaliar setup TOTP autenticado no mobile (fora desta sprint): hoje, sem MFA, o aceite e bloqueado
  com orientacao, sem setup improvisado.

## Commits

- `eb5ee4c` feat(mobile): adicionar contratos e servico de formalizacao
- `382ba96` feat(mobile): adicionar jornada de formalizacao
- `13701b7` feat(mobile): exibir contrato e historico de versoes
- `0837bcd` fix(mobile): tratar falha da clipboard ao copiar hash do contrato
- `349b9d9` refactor(mobile): extrair contrato-content e aliviar budget scss
- `6a6470a` fix(mobile): falhar download de documento assinado vazio
- `4587bf7` feat(mobile): tornar formalizacao descobrivel via atalho na home
- `ec54586` feat(mobile): proteger aceite contratual com step-up
- `4345651` fix(mobile): corrigir submit do step-up que recarregava a pagina
- `e5aa543` feat(mobile): status de assinatura, documento assinado e smoke de formalizacao
- `4d674fb` test(mobile): cobrir documento vazio rejeitado no detalhe do contrato
- `17642fe` fix(mobile): corrigir step-up Enter/inputmode, fase de assinatura e feedback de status
