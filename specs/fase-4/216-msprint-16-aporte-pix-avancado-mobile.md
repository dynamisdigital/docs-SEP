# Spec 216 - M-Sprint 16 - Aporte/matching e chaves Pix na credora mobile

## Metadados

- **ID da Spec**: 216
- **Titulo**: M-Sprint 16 - Aporte/matching assistidos e visibilidade de chaves Pix (credora mobile)
- **Status**: **CONCLUIDA** com escopo reduzido (ver "Decisao de escopo - Gate M-16.0") — mergeada
  em `develop` via PR #124 (`77ea01a`) e em `main` via PR #125 (`a694f2d`), 2026-07-20
- **Fase do produto**: Fase 4 - Epic 14 / Epic 15
- **Trilha**: Mobile (`sep-mobile`)
- **Origem**: PRD-FASE-4 §35 (Epic 14/15); Sprints backend 29-31
- **Depende de**: backend Sprints 29 (aporte), 30 (matching), 31 (chaves Pix) integradas; M-Sprint 10
  (credora mobile)
- **Responsavel principal**: Dev Mobile

## Objetivo

Levar ao app da credora as superficies de **aporte** e **matching** assistidos e a **visibilidade de
chaves Pix**, consumindo os contratos das Sprints backend 29-31. O app apresenta e opera de forma
assistida (decisao com step-up); regras, estados e totais vem do backend. Mantem o mobile restrito a
tomador e credora.

## Decisao de escopo - Gate M-16.0 (2026-07-20)

O precheck da M-16 mediu os contratos reais das Sprints 29-31 contra a base do `sep-mobile` e
encontrou uma **contradicao de persona** que invalida a maior parte do escopo original:

- O `sep-mobile` reconhece apenas duas roles: `UsuarioRole = 'ADMIN' | 'CLIENTE'`
  (`src/app/core/api/api.models.ts:1`). Nao existe `FINANCEIRO` no app, e o `roleGuard` tipa
  `route.data['roles']` como `UsuarioRole[]` (`src/app/core/guards/role.guard.ts:10`) — declarar
  `'FINANCEIRO'` nem compila.
- No backend, 5 dos 6 endpoints previstos exigem `FINANCEIRO`/`ADMIN`. A persona credora do app
  autentica como `CLIENTE`, logo receberia `403` em todos eles.
- Esta spec (Objetivo) e o step 216 (Fora de escopo) ja restringiam o mobile a **tomador e
  credora**, excluindo operacao interna de financeiro/backoffice.

Alcance real da persona credora (`CLIENTE`) sobre os contratos S29-31:

| Endpoint | Role backend | Credora alcanca? |
|----------|--------------|------------------|
| `GET /api/v1/credores/matching/sugestoes` | `FINANCEIRO`/`ADMIN` | nao |
| `GET /api/v1/credores/matching/{sugestaoId}` | `FINANCEIRO`/`ADMIN` | nao |
| `POST /api/v1/credores/matching/{sugestaoId}/decisao` | `FINANCEIRO`/`ADMIN` + step-up | nao |
| `POST /api/v1/credores/operacoes/{operacaoId}/aportes` | `FINANCEIRO`/`ADMIN` + step-up | nao |
| `GET /api/v1/credores/operacoes/{operacaoId}/aportes` | `isAuthenticated()`, owner-scoped | **sim** |
| `GET /api/v1/pix/chaves` | `FINANCEIRO`/`ADMIN` | nao |

**Decisao registrada (opcao A)**: a M-16 entrega **somente a leitura owner-scoped de aportes** na
carteira da credora. Matching assistido, aporte com step-up e visibilidade de chaves Pix **saem da
M-16** por dependerem de persona fora do recorte mobile. A spec permanece como registro; as secoes
abaixo marcam o que foi adiado.

Destino do material adiado:

- Matching + aporte com step-up: dependem de expor a persona operacional no mobile (exigiria ADR e
  revisao desta spec) ou de o backend admitir a credora dona nesses contratos (sprint backend
  propria). Nenhum dos dois foi antecipado aqui.
- Chaves Pix mobile: segue a sprint web dedicada de chaves Pix (Gate F-18.0). O item de Pix avancado
  do `v1.0-local` (PRD-FASE-4 §37) **nao** e fechado pela M-16.

## Escopo

### Em escopo (apos Gate M-16.0)

- Estender modelos de borda do mobile com os DTOs de aporte da credora (espelham DTO backend).
- Estender o service da credora com a leitura owner-scoped de aportes.
- Exibir, no detalhe da operacao da carteira, a lista de aportes em **somente leitura**, com estados
  e refresh por gesto explicito.
- MSW + Vitest + Playwright PWA + cenarios do recorte acima.

### Adiado pelo Gate M-16.0 (nao implementar nesta sprint)

- Aporte assistido da operacao (iniciar + step-up) — exige `FINANCEIRO`/`ADMIN`.
- Decisao de matching assistida (confirmar/rejeitar, step-up) — exige `FINANCEIRO`/`ADMIN`.
- Visao de chaves Pix mascaradas — `GET /api/v1/pix/chaves` exige `FINANCEIRO`/`ADMIN`.

### Fora de escopo

- Movimentacao real (backend roda sobre fake nesta fase).
- Operacao interna de financeiro/backoffice no app.
- Expor valor bruto de chave, dado bancario ou PII de outra parte.
- Split Pix ou Pix automatico.
- Introduzir a role `FINANCEIRO` no mobile sem ADR e revisao desta spec.

## Tasks de implementacao (apos Gate M-16.0)

1. Estender modelos de borda e o service da credora com a leitura owner-scoped de aportes.
2. Exibir a lista de aportes em somente leitura no detalhe da operacao da carteira, com estados,
   vazio, erro e refresh por gesto.
3. Atualizar MSW, Vitest e smoke Playwright PWA com os cenarios do recorte, e fechar docs
   (`README §Credora`, roadmap, PR temporario).

Tasks originais 2, 3 e 4 (aporte assistido, decisao de matching, chaves Pix) ficam **adiadas** pelo
Gate M-16.0 e nao devem ser implementadas silenciosamente.

## Gates que nao contam como task

- Precheck dos contratos backend 29-31 e da base mobile (executado; ver Gate M-16.0).
- Smoke PWA da leitura owner-scoped de aportes.
- Docs/roadmap quando aplicavel.

## Definition of Done (apos Gate M-16.0)

- A empresa credora dona ve, no detalhe da operacao, os aportes da propria operacao em somente
  leitura, sem qualquer CTA de mutacao.
- Estados, valores e datas refletem o backend; nenhuma regra e calculada no app.
- `404` neutro, lista vazia, erro e retry cobertos; falha da lista nao apaga o detalhe ja carregado.
- Nenhum polling; atualizacao apenas por gesto explicito.
- MSW/Vitest/smoke verdes; docs atualizadas registrando o escopo adiado.
