# F-Sprint 16 — Renegociacao do tomador no web

> **Concluida em 2026-07-15**: feature via PR #87 -> `develop` (squash `908c353`) e PR
> #88 -> `main`; follow-up (secao ao final) via PR #89 -> `develop` (squash `d9f9733`) e
> PR #90 -> `main` (`develop` == `main`). Sprint fechada.

**Branch**: `feature/fsprint-16-renegociacao-tomador-web` -> `develop`
**Spec**: `docs-SEP/specs/fase-4/116-fsprint-16-renegociacao-tomador-web.md`
**Steps**: `docs-SEP/steps-fase-4/web/116-fsprint-16-steps.md`
**Backends consumidos**: Sprint 24 (`GET /parcelas/{id}/renegociacao-ativa`) e Sprint 27
(step-up estrito no aceite) — ambos em `develop`/`main`.

## Summary

Fecha o gap adiado na F-Sprint 9: o tomador consulta os termos autoritativos da
renegociacao ativa de uma parcela e decide por aceite (com MFA + step-up estrito) ou
recusa (sem step-up), espelhando o comportamento do mobile (M-9.5). O frontend so
apresenta: total, desconto, expiracao, status e elegibilidade vem sempre do backend.

- `RenegociacaoTomadorResponse` (10 campos exatos do contrato publico) +
  `consultarRenegociacaoAtiva(parcelaId)` no `CobrancaService`.
- Rota lazy `/app/cobranca/parcelas/:parcelaId/renegociacao` + CTA "Ver proposta de
  renegociacao" no detalhe da parcela apenas com status `EM_NEGOCIACAO` (condicao de UX;
  o GET owner-scoped decide a disponibilidade real).
- Tela de termos com New Design System SEP (tokens/mixins, light/dark, responsiva) e
  estados acessiveis: loading `role="status"`, erro com retry, proposta indisponivel,
  acesso negado neutro. Nenhum ID tecnico/campo interno no DOM.
- Aceite: pre-check de MFA (orienta `/app/profile/setup-totp`, sem tentar bypass do
  backend estrito), reconsulta dos termos, confirmacao explicita (`role="alertdialog"`),
  sem token navega `/app/step-up?next=<rota conhecida>`; o retorno do step-up NUNCA
  aceita automaticamente; PATCH unico com o `renegociacaoId` do snapshot recem lido;
  token anexado/consumido apenas pelo `stepUpInterceptor` nesse PATCH.
- Recusa: reconsulta + confirmacao explicita, sem MFA e sem step-up (token eventual
  permanece no store); estado unico de decisao bloqueia duplo submit e clique cruzado.
- Matriz de falhas: rede/5xx mantem os termos como visualizacao "desatualizada" e
  bloqueia decisoes ate nova leitura (retry explicito); 404/409 de decisao invalidam o
  snapshot e reconsultam (404 encerra como indisponivel); 403 do aceite autenticado
  oferece "Verificar novamente" apenas por gesto (sem loop); 403 da recusa e neutro.
  Nenhuma falha vira sucesso presumido.

## Mudancas

- `src/app/core/api/api.models.ts` — `RenegociacaoTomadorResponse` (distinto do
  `RenegociacaoResponse` interno das mutacoes, que permanece intacto).
- `src/app/core/cobranca/cobranca.service.ts` — consulta owner-scoped; so transporte.
- `src/app/features/authenticated/cobranca/cobranca.routes.ts` — rota lazy de decisao.
- `src/app/features/authenticated/cobranca/pages/parcela-detail-page.component.*` — CTA
  condicionado a `EM_NEGOCIACAO`.
- `src/app/features/authenticated/cobranca/pages/renegociacao-tomador-page.component.*`
  — tela de termos + decisao (novo).
- `src/app/features/authenticated/cobranca/shared/cobranca-format.ts` —
  `STATUS_RENEGOCIACAO_LABEL`.
- `src/mocks/handlers.ts` — handler `GET /cobranca/parcelas/:parcelaId/renegociacao-ativa`
  (403 uniforme sem enumeracao; 404 sem proposta; total precomputado no mock; deriva do
  estado mutavel de `renegociacoes` — apos decisao o GET responde 404). Parcelas
  dedicadas por fluxo: `...0008` (leitura, `EM_NEGOCIACAO` fiel ao backend Sprint 13),
  `...0009` (aceite) e `...000a` (recusa).
- `src/app/core/interceptors/step-up.interceptor.spec.ts` — +2 provas de allowlist (GET
  renegociacao-ativa nao recebe/consome token; PATCH de aceite sem token segue sem header).
- `e2e/cobranca.spec.ts` — +3 smokes offline; comentario obsoleto de endpoint ausente
  removido. **Nota**: esta mudanca ficou fora do squash #87 e segue no follow-up abaixo.

## Decisoes

- Interceptor real (`stepUpInterceptor`) na cadeia HTTP dos specs do `CobrancaService` e
  da tela: as provas de "GET nao envia/consome token" e "retorno sem auto-aceite" rodam
  contra o pipeline de producao.
- Ids de fixture dedicados por fluxo mutavel (aceite/recusa) preservam o isolamento dos
  testes sem reset global do estado do mock.
- `403` da leitura cai no tratamento neutro local e, em runtime, no redirect global de
  `/access-denied` do `errorInterceptor` (mesmo padrao do detalhe da parcela).
- Handler MSW mantem `path` no corpo de erro (mesma forma do `ErrorResponseDto` real);
  a nao-enumeracao esta no 403 uniforme (alheia == inexistente), como no backend.

## Test plan

- `npm run lint` / `npm run lint:scss` — verdes.
- `npm run test` — 484 testes (78 arquivos); novos: service 5, interceptor 2, detalhe 2,
  tela de decisao 16 (fluxos + matriz 403/404/409/rede via `server.use`).
- `npm run build` — AOT verde.
- `npm run e2e` — 26/26 (6 de cobranca): termos da proposta, recusa sem step-up, aceite
  navegando ao step-up sem auto-aceite no retorno.

## Dividas e follow-ups

- Aceite com TOTP real: validado apenas no smoke real com backend `:8080` (o desafio MFA
  de step-up nao tem handler no MSW; mesmo criterio das demais jornadas sensiveis).
  Roteiro no step 116.6.4.
- Proposta expirada no mock: representada apenas via status (sem relogio); o backend
  continua sendo a autoridade de expiracao.
- Collection Postman: sem mudanca (a F-16 nao cria contrato backend; o GET ja consta da
  Sprint 24; backlog de refresh completo segue registrado).

## Commits (absorvidos no squash `908c353` do PR #87)

1. `34bc085` feat(web): adicionar consulta de renegociacao ativa do tomador
2. `21f2c20` feat(web): exibir termos da renegociacao do tomador
3. `59a4cbf` fix(web): cancelar consulta de renegociacao no destroy da tela
4. `8baefc1` feat(web): implementar aceite de renegociacao com step-up
5. `3111772` feat(web): implementar recusa segura de renegociacao
6. `94ee548` fix(web): desabilitar decisoes com confirmacao de renegociacao aberta
7. `cd2be45` test(web): cobrir falhas da decisao de renegociacao

## Follow-up pos-merge — smoke Playwright (F-16.6) + findings do review manual

**Branch**: `feature/fix-fsprint-16-e2e-smoke` -> `develop` (base: `develop` pos-merge
`908c353`).

**Commit 1 — `57bcea6` test(web): estender smoke de cobranca a decisao do tomador.** O
commit final do smoke nao havia sido aprovado quando o PR #87 foi aberto e ficou fora do
squash; reaplica exatamente aquele conteudo: comentario obsoleto removido e +3 cenarios
offline (termos completos via CTA `EM_NEGOCIACAO`; recusa sem step-up; aceite sem token
navegando a `/app/step-up?next=` e retorno sem aceite automatico).

**Commit 2 — `c90640e` fix(web): aplicar findings do review manual da f-sprint 16.**

- **P1**: o `errorInterceptor` redirecionava todo 403 para `/access-denied`, impedindo o
  tratamento local da matriz 116.5 (estado neutro na leitura, "Verificar novamente" no
  aceite, mensagem neutra na recusa). Novo `HttpContextToken` `TRATA_403_LOCALMENTE`
  (exportado do `error.interceptor.ts`) suprime o redirect apenas nos 3 endpoints da
  decisao do tomador (`CobrancaService`). Specs da tela agora registram o
  `errorInterceptor` real na cadeia (teste integrado) e provam a supressao; spec do
  interceptor cobre o novo token.
- **P2**: confirmacoes de aceite/recusa com comportamento real de dialogo acessivel:
  `aria-modal="true"`, foco programatico no container ao abrir (`viewChild` + `effect`),
  restauracao do foco no botao gatilho ao fechar, Escape cancela (guardado durante
  request em voo), trap de Tab/Shift+Tab entre os botoes e foco visivel no padrao DS.
- **P2**: smokes F-16 deixam de autenticar como ADMIN — nova persona
  `tomador@empresa.com` (CLIENTE, MFA ativo) no mock de login.

**Commit 3 — `5db67ad` docs(web): atualizar comentario do 403 na tela de renegociacao.**
Comentario de classe alinhado ao P1 (403 tratado localmente, sem redirect global).

**Gate do follow-up**: lint, lint:scss, Vitest **487** (484 + 3 dos fixes), build AOT e
`e2e/cobranca.spec.ts` 6/6 verdes. Aceite com TOTP real continua no smoke real com
backend `:8080` (sem handler MFA offline).
