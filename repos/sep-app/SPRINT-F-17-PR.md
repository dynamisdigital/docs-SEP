# F-Sprint 17 — Aprofundamento financeiro/conciliacao web

> **Concluida em 2026-07-15**: PR #92 -> `develop` (squash `2dfa0fd`) e PR #93 -> `main`
> (`develop` == `main`). Sprint fechada.

**Branch**: `feature/fsprint-17-financeiro-conciliacao-web` -> `develop`
**Spec**: `docs-SEP/specs/fase-4/117-fsprint-17-financeiro-conciliacao-web.md`
**Steps**: `docs-SEP/steps-fase-4/web/117-fsprint-17-steps.md`

## Summary

Sprint dirigida por gap analysis (Task F-17.1, matriz aprovada pelo usuario): auditoria das
superficies financeiras web (F-9 cobranca, F-10 backoffice, F-13 Pix) contra os contratos
backend reais (cobranca 12-14, Pix 19-21, backoffice 14). Resultado: **2 gaps reais fechados**
no painel de divergencias Pix; o restante ja estava coberto ou depende de contrato backend
inexistente (registrado como follow-up, sem simulacao no frontend).

## Matriz resumida (classificacoes finais)

| Capacidade | Classificacao | Destino |
|---|---|---|
| Divergencias: contagem com `totalElements` do backend | IMPLEMENTAR | F-17.2 (`cfcfa52`) |
| Divergencias: recorte por status enviado ao backend | IMPLEMENTAR | F-17.2 (`cfcfa52`) |
| Recebimentos manuais (lista), jornada Pix, reprocessos com step-up, dashboard | JA_COBERTO | F-9/F-10/F-13; F-17.4 encerrada sem codigo |
| Paginacao/filtros em `GET /cobranca/recebimentos` | CONTRATO_AUSENTE | follow-up backend (Javadoc do controller ja prometia) |
| Recebimentos por parcela para perfil financeiro | CONTRATO_AUSENTE | follow-up backend (Sprint 23 e CLIENTE-only) |
| Listagem Pix por operacao/contrato | CONTRATO_AUSENTE | follow-up backend |
| DTO consolidado server-side (recebimentos+desembolsos por operacao) | CONTRATO_AUSENTE | follow-up backend; F-17.3 encerrada sem codigo (consolidacao local por N+1/correlacao e proibida) |
| Chaves Pix (Sprint 31), tomador/credora, BI, boleto, Pix automatico | FORA_DE_ESCOPO | F-18 / outras sprints |

## Mudancas

- `src/app/features/authenticated/pix/pages/divergencias-page.component.{ts,html,scss,spec.ts}` —
  filtro de status com label acessivel (Aberto default | Em tratamento | Resolvido | Ignorado |
  Todos), um status por request como o contrato aceita ("Todos" omite o parametro); titulos com
  `PageResponse.totalElements` (nunca `.length` de pagina parcial) + aviso "Mostrando os N
  primeiros de M"; labels/chips reusados do backoffice; `takeUntilDestroyed`; select desabilitado
  durante carga (sem consultas sobrepostas). Nenhuma acao de mutacao nova — tratamento segue
  exclusivo da fila do backoffice; `RECEBIMENTO_PIX_DIVERGENTE` continua sem reprocesso de
  provider.
- `src/mocks/handlers.ts` — fixture `c...0007` (`DESEMBOLSO_PIX_FALHOU` **RESOLVIDO**) para
  exercitar o recorte de status no dev-offline.
- `e2e/pix.spec.ts` — +1 smoke: filtro por status no backend (item reconciliado so aparece em
  RESOLVIDO; default ABERTO o esconde).

## Test plan

- `npm run lint` / `npm run lint:scss` — verdes.
- `npm run test` — **491** testes (487 -> 491): divergencias 9 specs (default `status=ABERTO`
  + `size=50`, totais do backend com pagina parcial, troca de recorte, "Todos" sem param,
  vazio/erro/rede, recorte RESOLVIDO via fixture real).
- `npm run build` — AOT verde.
- `npm run e2e` — **27/27** (novo smoke do filtro).

## Dividas e follow-ups

- 4 contratos ausentes registrados na matriz acima (backend).
- Collection Postman intocada (nenhum contrato backend mudou).

## Commits

1. `cfcfa52` feat(web): fechar gaps de divergencias financeiras
2. `80e1c29` test(web): cobrir gaps financeiros da f-sprint 17
3. `ea85438` test(web): cobrir filtro de divergencias no smoke pix
