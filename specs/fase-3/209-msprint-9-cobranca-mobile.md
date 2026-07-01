# Spec 209 - M-Sprint 9 - Cobranca Mobile

## Metadados

- **ID da Spec**: 209
- **Titulo**: M-Sprint 9 - Parcelas e cobranca do tomador mobile
- **Status**: planejada
- **Fase do produto**: Fase 3 - Epic 14 Fase Mobile 2+
- **Trilha**: Mobile (`sep-mobile`)
- **Origem**: PRD Epic 14; APIs de cobranca das Sprints 12-13 e desbloqueios backend 23-24
- **Depende de**: [`212-msprint-12-new-design-system-mobile.md`](./212-msprint-12-new-design-system-mobile.md) + [`208-msprint-8-formalizacao-mobile.md`](./208-msprint-8-formalizacao-mobile.md) + B1 [`023-sprint-23-cobranca-historico-tomador.md`](./023-sprint-23-cobranca-historico-tomador.md) + B2 [`024-sprint-24-cobranca-renegociacao-tomador.md`](./024-sprint-24-cobranca-renegociacao-tomador.md)
- **Responsavel principal**: Dev Mobile

## Objetivo

Dar ao tomador visibilidade mobile das parcelas, vencimentos, historico e renegociacoes.

## Escopo

### Em escopo
- Lista de parcelas.
- Detalhe de parcela e vencimento.
- Historico de recebimentos.
- Status de atraso/inadimplencia.
- Aceite/recusa de renegociacao quando existir.

### Fora de escopo
- Operacao financeira interna.
- Registro manual de recebimento.
- Backoffice mobile.

## Dependencias backend bloqueantes

- **B1 / Sprint 23**: `GET /api/v1/cobranca/parcelas/{parcelaId}/recebimentos`, exclusivo de `CLIENTE`, com `RecebimentoTomadorResponse[]`. **Mergeado em `develop` (PR #81) e `main` (PR #82)** — M-9.4 liberada.
- **B2 / Sprint 24**: `GET /api/v1/cobranca/parcelas/{parcelaId}/renegociacao-ativa`, exclusivo de `CLIENTE`, com `RenegociacaoTomadorResponse`. Desbloqueia M-9.5 apos merge em `develop`.
- Nenhuma das Tasks pode reutilizar endpoints/DTOs internos para contornar o gate.

## Tasks de implementacao

1. Criar `CobrancaMobileService` e modelos.
2. Implementar lista de parcelas.
3. Implementar detalhe e status de parcela.
4. Implementar historico de recebimentos apos merge da Sprint 23.
5. Implementar renegociacao para tomador apos merge da Sprint 24.
6. Atualizar MSW, Vitest e Playwright PWA.

## Gates que nao contam como task

- Precheck contratos cobranca.
- Smoke PWA parcelas -> renegociacao.
- Docs, PRD/CONTEXT e roadmap quando aplicavel.

## Definition of Done

- Tomador ve apenas suas obrigacoes.
- Fluxo nao permite operacao interna indevida.
- Estados de atraso/inadimplencia sao claros.

## Status de execucao (2026-07-01)

Recorte **M-9.1 → M-9.3 implementado e pausado** na branch
`feature/msprint-9-cobranca-mobile` do `sep-mobile` (base `origin/develop`). A branch foi
**pushada para `origin` (`1937cfe`, em sync com o local)**, mas **nao mergeada**. Ao retomar,
M-9.4/M-9.5/M-9.6 continuam na **mesma branch** — nao criar branch nova (sprint viva = mesma
branch).

- **Gate M-9.0**: cadeia Git validada (M-8 em `develop`/`main`, conteudo igual), baseline
  verde (lint/scss/format, Vitest 274, build AOT), gates B1/B2 classificados como
  **bloqueados** (endpoints owner-scoped inexistentes no `sep-api`).
- **M-9.1** (`71c6acf`): DTOs de borda + `CobrancaMobileService`
  (`consultarAgenda`/`consultarParcela`); endpoints internos e metodos B1/B2 nao expostos.
- **M-9.2** (`393d927`): rotas lazy `roleGuard CLIENTE`, `ParcelasEntryComponent` (sem N+1)
  e `AgendaDetailComponent` (contrato→agenda sob demanda; agenda so com `ASSINADO`; `404`
  indisponivel, `403` neutro); CTA "Ver parcelas" no detalhe do contrato so em `ASSINADO`.
- **M-9.3** (`1937cfe`): `ParcelaStatusComponent` (mapa exaustivo dos 7 status) e
  `ParcelaDetailComponent` (valor atualizado sem recalculo; `403`/`404`/`409`/rede tratados;
  token de geracao; sem polling); rota de detalhe da parcela registrada.

**Bloqueio e sequenciamento**: M-9.4 depende da Sprint 23 (B1 — `GET
/parcelas/{id}/recebimentos`, `RecebimentoTomadorResponse[]`) e M-9.5 da Sprint 24 (B2 —
`GET /parcelas/{id}/renegociacao-ativa`, `RenegociacaoTomadorResponse`). Decisao de
2026-07-01: executar Sprint 23 → Sprint 24 no `sep-api` antes de retomar M-9.4/M-9.5/M-9.6,
em vez de fechar a M-9 parcial (evita retrabalho no M-9.6 e respeita o DoD). A sprint nao
esta concluida enquanto B1 ou B2 permanecer bloqueado.

**Divergencia de contrato a aplicar na M-9.4/M-9.5**: os DTOs mobile devem espelhar
`RecebimentoTomadorResponse` (Sprint 23) e `RenegociacaoTomadorResponse` (Sprint 24), nao os
DTOs internos `RecebimentoResponse`/`RenegociacaoResponse`.
