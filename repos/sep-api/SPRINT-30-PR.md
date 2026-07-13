# Sprint 30 — Matching assistido credora-operacao (Epic 15, Fase 4)

> Branch: `feature/sprint-30-credora-matching-operacao` -> `develop` (squash).
> Spec: [`specs/fase-4/030-sprint-30-credora-matching-operacao.md`](../../specs/fase-4/030-sprint-30-credora-matching-operacao.md).
> Steps: [`steps-fase-4/backend/030-sprint-30-steps.md`](../../steps-fase-4/backend/030-sprint-30-steps.md).

## O que entrega

Evolui a associacao assistida da Sprint 17 para um recorte de **matching** entre a credora dona e
operacao financiada da propria carteira pronta para receber aporte: o sistema **sugere** por regras
explicitas de elegibilidade (snapshot em lote, sem N+1); a **decisao e sempre assistida** por
`FINANCEIRO`/`ADMIN` com **step-up estrito**. **Nenhum matching e confirmado automaticamente; a
confirmacao nao cria aporte, nao chama escrow/provider e nao dispara Pix** — o aporte segue o fluxo
separado da Sprint 29. Sem job automatico, sem dinheiro real.

```http
GET  /api/v1/credores/matching/sugestoes          (FINANCEIRO/ADMIN; refresh-on-read idempotente, sem step-up)
GET  /api/v1/credores/matching/{sugestaoId}       (FINANCEIRO/ADMIN; sem step-up; 404 neutro)
POST /api/v1/credores/matching/{sugestaoId}/decisao  (FINANCEIRO/ADMIN + step-up estrito; CONFIRMAR|REJEITAR)
```

Estados: `SUGERIDA -> CONFIRMADA | REJEITADA` (terminais; replay de decisao = `409`).

## Commits (11)

1. `56056fa` feat(credores): definir elegibilidade de matching — validador puro com 7 criterios
   (credora ATIVA+ELEGIVEL, operacao ASSOCIADA, contrato ASSINADO, valor disponivel, capacidade
   quando declarada, par sem matching previo — **REJEITADA tambem bloqueia**) + 12 testes.
2. `d958497` fix(credores): validar candidato nulo no matching (hotfix pos-review).
3. `22f8c86` feat(credores): modelar matching da credora — `MatchingCredoraOperacao` +
   `StatusMatchingCredoraOperacao` + **V56** (UNIQUE parcial de par ativo; FKs sem CASCADE) +
   **V57** (3 tipos `CREDORA_MATCHING_*`) + 11 testes de dominio (terminal sem mutacao, sem
   vazamento em excecao/toString).
4. `03e038d` feat(credores): gerar sugestoes de matching — refresh assistido por snapshot em lote
   (6 consultas fixas; candidatas com `SELECT FOR UPDATE` deterministico — refreshes concorrentes
   serializam sem violar o UNIQUE parcial), porta batch `consultarPorIds` de contratos, limite
   conservador de 200 candidatas, listagem `SUGERIDA` (valor desc, criacao asc), auditoria
   `CREDORA_MATCHING_SUGERIDA` 1x por sugestao nova (listener AFTER_COMMIT).
5. `2a7136d` fix(credores): filtrar pares decididos da janela de matching (hotfix pos-review) —
   `NOT EXISTS` na query de candidatas: sem ele, 200+ pares decididos monopolizariam o limite
   (starvation) e o lock disputaria com o registro de aporte sem necessidade.
6. `35ed554` feat(credores): decidir matching assistido — `findByIdForUpdate` (decisao concorrente
   -> 409), 404 neutro sem UUID, motivo sanitizado no dominio, auditoria terminal unica
   `CREDORA_MATCHING_CONFIRMADA/REJEITADA`; **nao cria aporte nem chama escrow** (o use case nem
   depende dessas portas — garantia fixada por teste).
7. `f5cf28a` feat(credores): expor matching assistido — controller + DTOs dedicados minimos
   (nunca motivo/decisor/snapshot bruto), step-up estrito **so** no POST, 400 acao invalida,
   404 neutro, 409 terminal; 15 testes de borda + 3 de consulta.
8. `2632733` docs(credores): precisar semantica do GET de sugestoes (hotfix pos-review) —
   OpenAPI dizia read-only; refresh-on-read persiste sugestao + auditoria.
9. `4c53513` test(credores): cobrir matching fim a fim — `MatchingCredoraIT` (6 cenarios,
   auth + step-up + Postgres reais): refresh gera e nao duplica, consulta, confirma/rejeita,
   401/403 reais, 409 replay, confirmacao sem criar aporte, par decidido sai do refresh.
10. `323fca3` test(cobranca): usar vencimento dinamico na renegociacao — desarma a bomba de data
    PRE-EXISTENTE que derrubava a CI em qualquer branch (hardcode `2026-07-10` vs
    `@FutureOrPresent`; quebrou a partir de 2026-07-11, arquivo sem toque desde a Sprint 27).
11. `f497f19` style(credores): aplicar spotless no `MatchingCredoraIT` — o commit 9 entrou com
    1 violacao de formato (verificacao local com exit mascarado por pipe); o step
    `spotlessCheck` da CI falhava junto.

## Decisoes tecnicas

- **Par do matching** = (credora dona, operacao da propria carteira): criterios da spec espelham a
  elegibilidade de aporte da Sprint 29 (ASSOCIADA + ASSINADO); snapshot referencia `operacaoId`.
  Nao ha matching cross-credora nesta sprint.
- **Refresh-on-read**: o contrato aprovado nao tem endpoint de refresh — o `GET /sugestoes` gera
  (idempotente) e lista. Documentado no OpenAPI e no `CREDORES.md` (nao e read-only puro; evitar
  polling agressivo).
- **REJEITADA bloqueia re-sugestao** (regra de geracao); o UNIQUE parcial do banco protege apenas
  duplicidade ativa (`SUGERIDA`/`CONFIRMADA`), mantendo flexibilidade se o produto mudar.
- **`valorElegivel` = valor da `OportunidadeInvestimento`** da operacao; sem oportunidade/valor =
  dados insuficientes (nao sugere). `capacidadeAporte` nula = criterio nao aplicado.
- **Concorrencia por lock**: candidatas e decisao com `SELECT FOR UPDATE` (padrao Sprint 29);
  trade-off local documentado — refresh compartilha o lock da operacao com o registro de aporte.
- Erros neutros sem UUID/dado interno: `CRD-404-008`, `CRD-409-007`, `CRD-400-011..015`.
- Collection Postman **nao retrofitada** (congelada no Sprint 14; contrato vigente = springdoc
  runtime `/v3/api-docs`).

## Verificacao

- `./gradlew check` **verde: 1975 testes, 0 falhas** (baseline 1906 + 69 da sprint), JaCoCo ok,
  spotless ok — exit code confirmado.
- Nota: entre os commits 9 e 10 a CI ficou vermelha por causa PRE-EXISTENTE — bomba de data em
  `CobrancaInadimplenciaControllerTest.proporRenegociacao_*` (hardcode `"novoVencimento":
  "2026-07-10"` vs `@FutureOrPresent` no DTO; quebrou em qualquer branch a partir de 2026-07-11;
  arquivo sem toque desde a Sprint 27, diff da branch em `cobranca/` vazio). Desarmada no commit
  10 com vencimento dinamico. O commit 11 corrige 1 violacao de spotless do proprio commit 9.
- `./gradlew test --tests "*Matching*"`: 63 unit/web + 6 E2E, verdes.
- Confirmado: nenhum aporte/Pix/escrow/provider acionado automaticamente em nenhum caminho.
