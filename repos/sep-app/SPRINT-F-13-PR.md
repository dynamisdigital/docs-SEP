# PR — F-Sprint 13: Pix operacional no web (sep-app)

## Summary

Implementa a operacao Pix assistida no `sep-app` (Epic 15 + superficies operacionais do Epic 13)
consumindo o modulo `pix` do `sep-api` (Sprints backend 19-21): **desembolso assistido** + status de
transferencia, **referencias e recebimentos** de parcela, e **divergencias** ligadas ao backoffice.

Area interna nova (`/app/pix`, `roleGuard ['FINANCEIRO','ADMIN','BACKOFFICE']`; `CLIENTE` bloqueado).
O frontend apresenta estado, dispara comandos autorizados e conduz step-up; elegibilidade,
idempotencia, conciliacao, escrow e provider permanecem no backend. A UI nunca calcula baixa nem
mascara falha como sucesso, e nao oferece acao perigosa (reenviar Pix / reprocessar provider).

Spec `specs/fase-3/113-fsprint-13-pix-web.md`,
steps `steps-fase-3/web/113-fsprint-13-steps.md`.

## Mudancas por area

- **Borda de API** (`PixService` + modelos em `api.models.ts` + MSW `pixHandlers`/`resetPixState`):
  modelos fieis aos DTOs reais (`transferenciaId`/`referenciaId`/`recebimentoId`; `DesembolsoResponse`
  com `novo` vs `StatusDesembolsoResponse` com `providerIndisponivel`; `valorEsperado`+`codigoCopiaCola`;
  campos de vinculo/divergencia `| null`). Service nunca toca `X-Step-Up-Token` nem envia
  `Idempotency-Key` em leitura.
- **Area + shell** (`/app/pix`): grupo com `roleGuard`, item no sidenav (roles internas) e landing
  `pix-shell` com cards data-driven (padrao da landing `Administracao`).
- **Desembolso assistido** (`/app/pix/desembolsos` + `/:id`): form `FINANCEIRO`/`ADMIN` com
  `Idempotency-Key` por tentativa e step-up estrito; detalhe com status local e reconsulta
  (`POST /status`, step-up) sem sucesso falso quando o provider esta indisponivel.
- **Recebimentos** (`/app/pix/recebimentos` + `referencias/:id` + `/:id`): gerar/reaproveitar
  referencia (sem step-up), detalhe de referencia (txid, copia-cola, vinculo de parcela) e detalhe de
  recebimento (conciliado ou `NAO_IDENTIFICADO`/divergente, com vinculos quando houver).
- **Divergencias** (`/app/pix/divergencias`): reusa `GET /backoffice/fila?tipo=...`
  (`RECEBIMENTO_PIX_DIVERGENTE`, `DESEMBOLSO_PIX_FALHOU`), read-only, com link para o detalhe do
  backoffice (tratamento) + contexto Pix (ver recebimento / reconsultar desembolso).
- **Step-up**: `stepUpInterceptor` estendido para `POST /pix/desembolsos` e
  `POST /pix/desembolsos/{id}/status`; leituras e geracao de referencia nunca consomem token.
- **MSW**: fakes Pix reseedaveis (`resetPixState`) + 1 item `RECEBIMENTO_PIX_DIVERGENTE` no seed da
  fila do backoffice (dev-offline; sem alterar contrato).

## Migrations / contratos

- Nenhuma migration. Contratos consumidos (Sprints 19-21): `POST/GET /pix/desembolsos[/{id}][/status]`,
  `POST/GET /pix/recebimentos/referencias[/{id}]`, `GET /pix/recebimentos/{id}`, e reuso de
  `GET /backoffice/fila?tipo=...`.

## Decisoes aceitas

- `Idempotency-Key` por tentativa (`crypto.randomUUID`), descartada ao mudar payload ou apos resposta
  final; nunca persistida. Chave Pix em claro so no request de desembolso; backend so devolve mascara
  (UI nunca loga/persiste/reexibe).
- Sem listagem global de desembolsos no backend -> navegacao por id / apos criar.
- Divergencias reusam o backoffice (sem fila paralela; sem duplicar resolver/ignorar/comentar; sem
  reprocesso de provider para recebimento). Desembolso falho so reconsulta status.
- Badges nunca apresentam `FALHOU`/`CANCELADA`/`NAO_IDENTIFICADO` como sucesso; `providerIndisponivel`
  vira alerta rastreavel.

## Test plan

- `npm run lint` — verde (inclui `e2e/`).
- `npm run lint:scss` — verde.
- `npm run test` — suite verde (PixService, area/shell + sidenav, desembolso, recebimentos,
  divergencias e `stepUpInterceptor` das rotas Pix).
- `npm run build` — compila (o cleanup do `dist` falha por diretorio root-owned preexistente no
  ambiente — nao e regressao; `dist` e git-ignored).
- Smoke Playwright offline `e2e/pix.spec.ts` (7 cenarios) — verde.

## Dividas / follow-ups

- **Smoke real com backend em `:8080`** (`app.pix.provider=fake`, `app.escrow.provider=fake`): validar
  step-up (MFA) no desembolso e os codigos `403/409/422`/provider indisponivel reais — pendente.
- **Endpoint dedicado de divergencias Pix**: hoje reusa a fila do backoffice filtrada por tipo;
  contadores/endpoint dedicados ficam follow-up se o volume justificar.
- **Parcela para `BACKOFFICE`**: sem rota de parcela acessivel na cobranca; o id aparece como texto
  (sem link) para `BACKOFFICE`, que trata divergencias pelo proprio fluxo.

## Notas

- A autorizacao real e sempre server-side; o `roleGuard` e o gating de CTA por role sao
  UX/defesa-em-profundidade. A reconsulta de status (`POST /status`) e suportada para
  `FINANCEIRO`/`ADMIN`/`BACKOFFICE`.

## Commits

- `2cc1ef2` feat(web): adicionar borda de api pix operacional (F-13.1)
- `4f19195` feat(web): criar area operacional pix (F-13.2)
- `2da6625` feat(web): implementar desembolso pix assistido (F-13.3)
- `a1d411c` fix(web): nao navegar com id de desembolso vazio na consulta (F-13.3)
- `ac75e31` feat(web): implementar recebimentos pix operacionais (F-13.4)
- `0aa1e42` feat(web): expor divergencias pix operacionais (F-13.5)
- `9c31a9f` refactor(web): remover idCurto nao usado na tela de divergencias pix (F-13.5)
- `77e148f` test(web): smoke e2e offline da jornada pix (F-13.6)
