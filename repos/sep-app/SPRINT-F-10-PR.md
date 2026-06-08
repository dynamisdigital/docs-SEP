# F-Sprint 10 - Backoffice e Financeiro Operacional Web

## Summary

Implementa no `sep-app` a operacao assistida web em `/app/backoffice` para `BACKOFFICE`,
`FINANCEIRO` e `ADMIN`, consumindo o modulo `backoffice` de `sep-api` (Sprint 14 + extensoes
Pix das Sprints 20-21): dashboard consolidado, fila operacional com filtros/paginacao,
detalhe do item com comentarios e objeto original, acoes assistidas (assumir, comentar,
resolver, ignorar) e reprocessos de webhook/provider. Transicoes de status, ownership,
auditoria, anti-abuso e o gate de step-up permanecem no backend; o frontend so apresenta e
dispara acoes. UI no design system Notion. `CLIENTE` nao ve o menu nem acessa as rotas.

Escopo: modelos TS + `BackofficeService` + MSW; rotas/menu/shell; dashboard; fila + detalhe;
acoes com step-up; reprocessos com step-up e anti-abuso.

## Test plan

- `npm run lint` / `npm run lint:scss` — verdes.
- `npm run test -- --run` — 281 testes (Vitest), incluindo `BackofficeService`,
  `stepUpInterceptor` (resolver/ignorar/reprocessos), paginas (dashboard, fila, detalhe,
  reprocessos), shell, `BackofficeChipComponent`/`ReprocessoResultadoComponent` e sidenav.
- `npm run build` — verde (chunks lazy de backoffice gerados).
- Smoke E2E offline `e2e/backoffice.spec.ts` (dashboard, fila, detalhe, assumir, comentar).
  `resolver`/`ignorar` e reprocessos exigem step-up (MFA) e smoke com backend real ficam
  recomendados manualmente (step-up indisponivel no dev-offline).

## Mudancas por area

- `core/api/api.models.ts`: tipos de borda de backoffice (`TipoItemFila`, `PrioridadeItem`,
  `StatusItemFila`, `TipoEntidadeReferenciada`, `TipoChamadaProvider`, `StatusReprocesso`,
  `TipoReprocesso`, `ItemFilaResponse`, `ItemFilaDetalheResponse`, `ComentarioInternoResponse`,
  `ComentarioRequest`, `ResolverRequest`, `IgnorarRequest`, `ReprocessoRequest`,
  `ReprocessoResponse`, `ObjetoOriginalResponse`, `DashboardResponse` + contadores). Reusa
  `PageResponse<T>`.
- `core/backoffice/backoffice.service.ts`: transporte HTTP puro (dashboard, fila com filtros
  snake_case + paginacao, detalhe, assumir, comentario, resolver, ignorar, reprocessos
  webhook/provider). Nenhum recalculo de agregado.
- `core/interceptors/step-up.interceptor.ts`: allowlist estendida para
  `PATCH /backoffice/fila/{id}/resolver|ignorar` e `POST /backoffice/reprocessos/**`, com guard
  de metodo (comentario/GET nao consomem token).
- `features/authenticated/backoffice/`: feature lazy, shell de landing, dashboard, fila
  (filtros + paginacao), detalhe (acoes + reprocesso) e painel de reprocessos; `shared/` com
  `BackofficeChipComponent`, `ReprocessoResultadoComponent` e `backoffice-format`
  (moeda/data/duracao + labels + helpers de filtro de data).
- `layout/sidenav`: item "Backoffice" para `BACKOFFICE`/`FINANCEIRO`/`ADMIN`.
- `features/authenticated/authenticated.routes.ts`: route group `backoffice` com `roleGuard`.
- `mocks/handlers.ts`: cenarios de backoffice (dashboard, fila com filtros/paginacao/ordenacao,
  detalhe, assumir 409, comentario 400, resolver/ignorar com step-up + justificativa,
  reprocessos com step-up + anti-abuso `429` + `400` de tipo) com mutacao persistida; usuario
  `backoffice@empresa.com`.

## Decisoes

- A tela nunca recalcula contadores/medias/somatorios/SLA/prioridade/permissao de transicao;
  apresenta os agregados do backend (dashboard `no-store`, sem persistir resposta).
- Step-up (`resolver`/`ignorar`/reprocessos) centralizado no `stepUpInterceptor`, nao no
  service; `403` redireciona para `/app/step-up?next=<rota>` quando ha MFA; `409` recarrega o
  estado real; duplo clique bloqueado por `acaoEmAndamento`.
- Reprocesso respeita o backend: `PIX_TRANSFERENCIA` tem reconsulta real; demais tipos podem
  ser stubs — a UI exibe o `resultado` como veio e nao promete retentativa.
  `RECEBIMENTO_PIX_DIVERGENTE` nao oferece reprocesso de provider (so manual). `429` mostra
  mensagem especifica, sem retry automatico.
- LGPD: filtros/fila/detalhe nao expoem payload bruto, CPF/CNPJ completo, chave Pix, dados
  bancarios ou tokens; comentario/justificativa ficam so na memoria do form.
- `tempoMedioResolucao30d` (Duration) chega como numero de segundos; a apresentacao formata.
- Staging do shell: cards habilitados na Task que entrega cada tela (dashboard F-10.3, fila
  F-10.4, reprocessos F-10.6) para nao apontar para rota inexistente; ao fim da sprint os tres
  cards estao navegaveis.

## Divergencias e notas vs contrato

- `data_abertura_de`/`data_abertura_ate` sao `OffsetDateTime` no backend; o input `date`
  (yyyy-MM-dd) e convertido para inicio/fim de dia com offset `-03:00` antes do envio.
- Reprocesso de provider stub: a confirmar campos reais e comportamento das strategies no
  smoke com backend real.

## Follow-ups

- Smoke com backend real (`http://localhost:8080`): validar DTOs reais vs modelos TS, step-up
  em resolver/ignorar/reprocessos e os codigos `400/403/404/409/429`.
- Atribuicao automatica/round-robin, export, BI e graficos avancados seguem fora de escopo.

## Commits

- `4fd2911` feat(backoffice): adiciona BackofficeService, modelos e MSW base (F-10.1)
- `a59d8f6` feat(backoffice): adiciona rotas, menu e shell operacional (F-10.2)
- `2a27e58` feat(backoffice): adiciona dashboard operacional e financeiro (F-10.3)
- `18ac1f8` fix(backoffice): persiste mutacoes e aplica filtros no MSW (review F-10.1/F-10.2)
- `958fc10` feat(backoffice): adiciona fila operacional com filtros e detalhe (F-10.4)
- `569772d` feat(backoffice): adiciona acoes da fila com step-up (F-10.5)
- `9765d87` feat(backoffice): adiciona reprocessos com step-up (F-10.6)
- `286375f` test(backoffice): cobre redirect step-up do atalho de reprocesso (review F-10.6)
- _(F-10.7)_ test/docs: smoke E2E `e2e/backoffice.spec.ts` + documentacao operacional
