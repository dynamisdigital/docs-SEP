# M-Sprint 11 — Pix visivel ao usuario (Epic 14/15)

Branch: `feature/msprint-11-pix-mobile` → `develop` (squash).
Depende da **Sprint 26 backend** (Gates P1-P3, mergeada `develop`/`main`, PR #87/#88).

## Objetivo

Exibir ao tomador e a empresa credora o estado Pix das operacoes que lhes pertencem, integrado as
telas existentes de contrato, parcela e carteira, **sem** operar o painel interno de Pix. Leituras
owner-scoped, read-only, sem step-up, sem persistencia; ownership, status e valor vem do backend.

## O que entra

- **Borda (`core/`)**: `StatusPixPublico` (P1/P3), `StatusPixParcelaPublico` (P2) e as respostas
  `PixDesembolsoTomadorResponse`/`PixPagamentoParcelaResponse`/`PixOperacaoCredoraResponse`;
  `PixMobileService` com 3 GET read-only (desembolso do contrato, status da parcela, status da
  operacao da credora). Sem step-up/`Idempotency-Key`/header financeiro; nenhum endpoint operacional
  Pix exposto.
- **Chips (`features/pix/`)**: `pix-status-publico` (reusado por P1 e P3) e `pix-status-parcela` (P2,
  7 estados; DIVERGENTE orienta verificacao, FALHOU nunca vira pago).
- **P1 — desembolso do tomador** (`contrato-detail`): card apos contrato ASSINADO; consulta pos-render
  + reconsulta em `ionViewWillEnter`/refresh; `404` = "ainda nao disponivel"; rede/5xx = erro isolado
  com retry; falha nao bloqueia o contrato.
- **P2 — parcela do tomador** (`parcela-detail`): card "Pagamento Pix" que **complementa, nao
  substitui** o status de cobranca; historico da M-9 reutilizado com destaque `meioPagamento=PIX`
  (sem nova chamada).
- **P3 — operacao da credora** (`portfolio-detail`): card "Status Pix da operacao" (so status/valor/
  data); acesso por presenca de credora (sem role `CREDORA`).
- **MSW**: `pixHandlers` (P1/P2/P3) **reseedaveis** via `mock.pix` (status do desembolso, `AUSENTE`
  para 404, `falhar` para 5xx-uma-vez), para dev + e2e.

## Padroes aplicados

- Consulta Pix **apos** liberar o spinner da tela (nao bloqueia o render).
- **Token de geracao** compartilhado com a tela: descarta resposta Pix obsoleta em reentrada/
  concorrencia.
- `404` neutro (ausencia) distinto de erro (rede/5xx com retry). `pixIndisponivel` e limpo no inicio
  de cada consulta, para a ausencia de um `404` anterior nao mascarar um erro tecnico no retry.
- Sem `txid`/copia-cola/`endToEndId`/chave/escrow/provider/ID interno no DOM ou em storage; nenhuma
  rota M-11 no allowlist do `stepUpInterceptor`.

## Verificacao

- Vitest: **464** verdes (65 arquivos).
- `lint`, `lint:scss`, `format:check`, `build` (AOT): verdes.
- Smoke Playwright: **23/23** — `e2e/pix-mobile.spec.ts` **6/6** (tomador desembolso+parcela+
  historico+ausencia, credora operacao, 5xx com retry, `404` neutro, tema escuro, 320 px, assercoes
  negativas + interceptacao provando ausencia de rota operacional Pix) + regressao (formalizacao/
  cobranca/credora/smoke/onboarding/credito). `golden-path` preexistente red (alheio a esta sprint).

## Fora de escopo

- Iniciar desembolso, conciliacao, copia-cola Pix, comprovantes: dependem de contrato backend
  aprovado (fase futura).

## Commits

1. `7c317c1` feat(mobile): adicionar borda publica de status pix
2. `2de7a41` feat(mobile): exibir desembolso pix do tomador
3. `b1abf76` fix(mobile): nao bloquear o render do contrato com a consulta do desembolso pix
4. `31ee073` feat(mobile): integrar status pix nas parcelas
5. `1ee0900` feat(mobile): exibir status pix da carteira credora
6. `48b194e` test(mobile): mockar e cobrir com smoke as leituras pix (M-11.5)
7. hotfix do code review: limpa `pixIndisponivel` no inicio da consulta (404 -> 5xx); `pixHandlers`
   reseedaveis (`mock.pix`); smoke 404/5xx/tema escuro + interceptacao de rota operacional
