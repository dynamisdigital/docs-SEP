# M-Sprint 9 — Parcelas e cobrança do tomador mobile (Epic 14)

**Branch**: `feature/msprint-9-cobranca-mobile` (base `origin/develop` pós M-8)
**Epic/frente**: Epic 14 — jornada mobile do tomador; consome cobrança backend (Sprints 12-13) + desbloqueios B1 (Sprint 23, PR #81) e B2 (Sprint 24, PR #83)
**Spec**: [`209`](../../specs/fase-3/209-msprint-9-cobranca-mobile.md) · **Steps**: [`209`](../../steps-fase-3/mobile/209-msprint-9-steps.md)

## Summary

Dá ao tomador (CLIENTE) visibilidade mobile das parcelas — agenda, vencimentos, valores atualizados, estados de atraso —, o histórico de recebimentos da própria parcela e a decisão consciente de renegociação (termos completos + aceite com step-up / recusa explícita). **Ownership, cálculos financeiros, status e transições permanecem no backend**: o app apresenta snapshots, nunca recalcula valor nem deriva status.

## Rotas (lazy, `roleGuard ['CLIENTE']`, tab `parcelas`)

- `/app/parcelas` — entrada: propostas `APROVADA` do tomador (sem N+1, sem lista global).
- `/app/parcelas/proposta/:propostaId` e `/app/parcelas/contratos/:contratoId` — agenda (só com contrato `ASSINADO`).
- `.../parcelas/:parcelaId` — detalhe com valor atualizado + histórico de recebimentos (B1).
- `.../parcelas/:parcelaId/renegociacao` — termos e decisão da renegociação ativa (B2).

## Mudanças por task

**M-9.1 (`71c6acf`)** — borda HTTP: DTOs de cobrança (`StatusParcela`, `ParcelaResponse`, `AgendaPagamentoResponse`, `ValorAtualizadoParcelaResponse`) + `CobrancaMobileService` (`consultarAgenda`/`consultarParcela`). Endpoints internos FINANCEIRO/ADMIN não expostos.

**M-9.2 (`393d927`)** — rotas lazy + `ParcelasEntryComponent` (paginada, filtro `APROVADA`, pull-to-refresh, token de geração) + `AgendaDetailComponent` (contrato→agenda sob demanda; 404 = indisponível com retry, nunca lista vazia; 403 neutro) + CTA "Ver parcelas" no contrato `ASSINADO`.

**M-9.3 (`1937cfe`)** — `ParcelaStatusComponent` (mapa exaustivo 7 status → texto+tom; texto sempre acompanha cor) + `ParcelaDetailComponent` (valor atualizado sem recálculo; 403/404/409/rede; token de geração; sem polling).

**M-9.4 (`1751d2a`)** — histórico de recebimentos (B1): `RecebimentoTomadorResponse` (4 campos), `consultarRecebimentos` no service (endpoint owner-scoped; nunca o `GET /recebimentos` interno), seção recolhida por padrão com carga sob demanda e refresh explícito; ordem DESC do backend preservada; `totalRecebido` do detalhe autoritativo (sem soma local); falha isolada com retry sem bloquear o detalhe.

**M-9.5 (`ef4f0f2`)** — decisão de renegociação (B2): `RenegociacaoTomadorResponse` (10 campos; `valorTotalRenegociado` do backend, nunca `valor x quantidade` local; corpo dos PATCHes internos não modelado), `consultarRenegociacaoAtiva` + `aceitarRenegociacao`/`recusarRenegociacao`, rota dedicada + CTA na parcela `EM_NEGOCIACAO`, `RenegociacaoDetailComponent` (termos reconsultados ao entrar e antes de cada confirmação; aceite = confirmação explícita + MFA obrigatório sem bypass + step-up de uso único; retorno do step-up nunca aceita automaticamente; recusa explícita sem step-up; 403 step-up limpa token e re-verifica vs 403 ownership neutro; 404/409 recarregam termos; rede nunca vira sucesso; duplo submit bloqueado). `stepUpInterceptor` com matching exato de `PATCH /cobranca/renegociacoes/{id}/aceite` (recusa/GETs fora).

**M-9.6 (commit de fechamento)** — MSW de cobrança (agenda com os 7 status; histórico vazio/com recebimentos; renegociação ativa; aceite exige `X-Step-Up-Token` e substitui a agenda de forma observável; recusa restaura o status anterior; estado `mock.cobranca` reseedável por teste) + smoke Playwright `e2e/cobranca-mobile.spec.ts` (jornada completa + recusa + 320 px + asserções negativas) + **fix de UX achado pelo smoke**: páginas reutilizadas pela stack do `ion-router-outlet` não rodam `ngOnInit` — `parcela-detail` e `renegociacao-detail` ganharam `ionViewWillEnter` reconsultando na reentrada (pós-recusa o detalhe mostrava status obsoleto) + docs.

## Test plan

- **Vitest 355 verdes (54 files)**: service (agenda/parcela/histórico/renegociação/PATCHes; fidelidade de borda; 403/404 propagados), interceptor (aceite anexa e consome 1x; recusa não anexa nem consome; GET renegociação-ativa não; URL parecida não; sem token segue sem header), `parcela-detail` (17: valor sem recálculo, concorrência, histórico lazy/isolado/ordenado/vazio, CTA renegociação, `ionViewWillEnter`), `renegociacao-detail` (18: termos completos, 10 chaves sem IDs internos, MFA bloqueia, step-up com next correto, retorno sem auto-aceite, aceite 1x + navegação, duplo submit, recusa sem step-up, 403/404/409/rede, cancelar sem API, `ionViewWillEnter`), demais suites sem regressão.
- **Smoke Playwright** `cobranca-mobile.spec.ts` 3/3: aceite com step-up (retorno sem aceite automático; agenda substituta com 3 parcelas), recusa sem step-up (parcela volta a `ATRASADA`; CTA some), 320 px sem overflow. Asserções negativas: sem `tomadorId`/`propostaPor`/escrow/justificativa/operações internas no DOM; token nunca em storage.
- **Regressão smokes** M-2/6/7/8: 8/8 verdes.
- **Estática/build**: lint, lint:scss, format:check e build AOT verdes.

## Segurança

- Ownership no backend; 403 neutro sem enumeração; endpoints internos jamais chamados.
- Step-up token em memória, uso único, matching exato; recusa não consome.
- Aceite exige MFA habilitado (bloqueio local sem bypass do legado backend).
- Nenhum dado financeiro, token ou PII persistido em storage/Preferences.
- JSON público sem `tomadorId`, `propostaPor`, IDs de agenda, escrow, operador ou justificativa.

## Decisões

- DTOs mobile espelham os contratos owner-scoped B1/B2 (`RecebimentoTomadorResponse`/`RenegociacaoTomadorResponse`), nunca os DTOs internos.
- Corpo das respostas dos PATCHes (DTO interno) descartado: o app usa o status HTTP e reconsulta agenda/parcela.
- Pós-aceite navega para a agenda ativa (substituta); pós-recusa volta ao detalhe da parcela — ambos recarregam via `ionViewWillEnter`.
- Smoke de cobrança reutiliza o contrato da formalização (`contrato-mock-1`) semeado `ASSINADO` via localStorage por contexto, sem afetar os demais smokes.

## Gaps / follow-ups

- Smoke contra backend real (`:8080`) segue como follow-up geral das jornadas mobile.
- `agenda-detail` não recarrega na reentrada da stack (fora do fluxo de decisão); avaliar `ionViewWillEnter` também lá se surgir caso real.

## Commits

```
71c6acf feat(mobile): adicionar borda HTTP de cobranca
393d927 feat(mobile): implementar lista de parcelas do tomador
1937cfe feat(mobile): adicionar detalhe e estados de parcela
1751d2a feat(mobile): exibir historico de recebimentos da parcela
ef4f0f2 feat(mobile): implementar decisao de renegociacao
c771a95 test(mobile): consolidar cobranca e smoke PWA
```
