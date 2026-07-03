# M-Sprint 10 — Jornada da empresa credora mobile

**Status**: mergeada em `origin/develop` via PR #109 (`f51e6be`), 2026-07-03; não promovida a `main`.
**Branch**: `feature/msprint-10-credora-mobile` (base `origin/develop`)
**Epic/frente**: Epic 14 — Fase Mobile 3 (jornada da empresa credora)
**Spec**: [`210`](../../specs/fase-3/210-msprint-10-credora-mobile.md) · **Steps**: [`210`](../../steps-fase-3/mobile/210-msprint-10-steps.md)
**Depende de**: modulo `credores` backend (Sprints 16-17) + Sprint 25 (Gate I1, `GET .../interesses/me`, PR #85 já em `origin/develop`)

## Summary

Substitui a casca da empresa credora por uma jornada mobile completa que consome os contratos reais de `/api/v1/credores`, **sem duplicar ownership, elegibilidade, regras de interesse, associação de carteira, auditoria ou cálculos financeiros no app**. **Não existe role `CREDORA`**: o acesso é governado por autenticação + presença confirmada por `GET /credores/me`. Backend é a autoridade final em tudo (o app apenas apresenta snapshots e formata na borda com `Intl`).

## Mudanças por camada (`sep-mobile`)

**core/credores (M-10.1)**
- `credora-mobile.service` — transporte HTTP de 9 endpoints permitidos (perfil/elegibilidade, oportunidades, interesse GET/POST/DELETE, carteira). Sem cadastro/sync/associação admin. `POST` interesses sem corpo; `DELETE` 204 sem DTO; propaga 404/409/422.
- `credora-context.store` — presença efêmera **em memória** (sem storage): estados desconhecido/carregando/presente/ausente/erro, dedup de chamadas concorrentes, distinção 404 vs rede/5xx, escopo por usuário autenticado (troca/logout invalidam) e descarte de resposta de usuário trocado durante a requisição.
- DTOs de `/credores` em `api.models.ts` espelhando a nullability real.

**features/credora**
- `home` (M-10.2) — dashboard: razão social, tipo, status/elegibilidade (pills), atalhos e contagens tolerantes a falha parcial (sem total aportado/rentabilidade).
- `perfil` (M-10.2) — snapshot do `/me`; sem `usuarioId`/`onboardingId`, sem edição/KYB/PLD.
- `oportunidades/opportunity-list` e `opportunity-detail` (M-10.3) — lista (ordem do backend, sem paginação) + detalhe read-only (`ionViewWillEnter`, token de geração, 404 neutro, sem `propostaId`/`contratoId`).
- interesse no detalhe (M-10.4) — estado autoritativo `GET .../interesses/me` (Sprint 25); confirmação explícita, duplo submit bloqueado, reconsulta pós-mutação; 201/204 reconsultam; 409/404 reconsultam sem presumir; 422 informa sem alterar; rede/5xx nunca vira sucesso; **sem step-up**; copy deixa claro que interesse não gera aporte/carteira.
- `carteira/portfolio-list` e `portfolio-detail` (M-10.5) — nullable → "Não informado"; agregados de cobrança diretos, sem recálculo; sem `justificativa`/IDs; lista vazia explica que interesse não gera carteira.
- `shared` — pills `credora-status`/`oportunidade-status`/`operacao-status` + `credora-format` (taxa como fração via `Intl percent`, igual ao web).

**Integração (M-10.6)**
- Rotas lazy `/app/credora/{inicio,perfil,oportunidades[/:id],carteira[/:id]}` sob `credoraPresenceGuard` (200 libera / 404 → `/app/inicio` / rede-5xx → tela com retry), `data.tab='credora'`.
- Tab única "Credora" antes de "Perfil", exibida só após presença confirmada (a tab dispara `store.carregar()` no shell).
- MSW `credoresHandlers` (estado `mock.credora`, default `presente:false` para não afetar outros smokes).

## Bug corrigido (M-10.6)

Navegação da tab Credora: por ser adicionada após a presença async, o `ion-tab-button` não é registrado pelo `ion-tabs` no init e caía no comportamento de âncora do `[href]` → **reload de página inteira que destruía o app** (o clique não navegava). Fix: navegação das tabs via `router.navigateByUrl` (removidos `[tab]`/`[href]`), com destaque da tab ativa por `estaAtiva` (compara `router.url`). Aplicado a todas as tabs; regressão e2e verde.

## Test plan

- Vitest **423** verdes (62 files): service/store/guard/tab, dashboard/perfil, oportunidades/detalhe, interesse (201/409/422/404/rede, cancelamento, duplo submit, sem step-up, inelegível/encerrada desabilitam), carteira (nullable, agregados sem recálculo, sem justificativa/IDs).
- Smoke Playwright `e2e/credora-mobile.spec.ts` **6/6**: jornada dashboard→perfil→oportunidades→interesse→carteira; tomador sem credora (guard + sem tab); inelegível não manifesta; carteira vazia; 320px; tema escuro; assertivas negativas + storage sem persistência.
- Regressão e2e verde (18 passed); `golden-path-mobile` preexistente red (cadastro, alheio a esta sprint).
- `npm run lint` / `lint:scss` / `format:check` / `build` (AOT) verdes.

## Segurança / regulatório

- Sem role inventada; ownership/elegibilidade/interesse/carteira no backend.
- Nada persistido em `localStorage`/`sessionStorage`/Preferences.
- `404` de detalhe neutro (não enumera recurso alheio).
- Sem dados do tomador, `justificativa`, IDs internos, escrow ou payload de provider no DOM.
- Endpoints ADMIN (`POST /credores`, `.../sync`, `.../carteira/operacoes`) nunca chamados/expostos.

## Decisões

- Interesse ativo lido do backend (Sprint 25) — nunca inferido/persistido; `GET .../interesses/me` incluído já na M-10.1 para evitar rework.
- Confirmação in-template via signal (padrão `renegociacao-detail` do tomador), não `AlertController` (o projeto não usa em lugar nenhum).
- Elegibilidade só como dica de UX; o backend decide via 422.
- Fixes do review manual da M-10.2: perfil reusa `credora-format`; contagem de oportunidades com rótulo neutro.

## Dívidas aceitas / follow-ups

- **Collection**: módulo `credores` não está na collection (gap sistêmico desde Sprint 14) — backlog de refresh dedicado.
- Destaque da tab ativa por `estaAtiva` usa `startsWith(tab.href)`; sub-rotas da credora não realçam a tab (cosmético).
- `golden-path-mobile` e2e preexistente red (cadastro) — fora do escopo.

## Commits

```
2294786 feat(mobile): adicionar borda da jornada credora
41e3dc2 fix(mobile): descartar presenca de credora de usuario trocado
7d06fc7 feat(mobile): implementar dashboard e perfil da credora
735992c feat(mobile): exibir oportunidades da credora
49cc784 feat(mobile): implementar interesse em oportunidades
ba300ec feat(mobile): implementar carteira simplificada da credora
76cc56a refactor(mobile): reusar formatadores e neutralizar contagem da credora
(+ commit de fechamento M-10.6: rotas/guard/tab/MSW/smoke/docs)
```
