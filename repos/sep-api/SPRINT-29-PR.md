# Sprint 29 — Aporte assistido da credora + escrow (Epic 15, Fase 4)

> Branch: `feature/sprint-29-credora-aporte-escrow` -> `develop` (squash).
> Spec: [`specs/fase-4/029-sprint-29-credora-aporte-escrow.md`](../../specs/fase-4/029-sprint-29-credora-aporte-escrow.md).
> Steps: [`steps-fase-4/backend/029-sprint-29-steps.md`](../../steps-fase-4/backend/029-sprint-29-steps.md).

## O que entrega

Aporte da credora em operacao financiada da carteira, iniciado de forma **assistida** por
`FINANCEIRO`/`ADMIN` com step-up estrito, registrado no escrow via componente **fake/local** e
reconciliado de forma idempotente. **Nenhum dinheiro real e movido**; `EscrowProvider`/adapter
Celcoin intocados — ativacao real fica na Fase 5.

```http
POST /api/v1/credores/operacoes/{operacaoId}/aportes   (FINANCEIRO/ADMIN + step-up estrito + Idempotency-Key)
GET  /api/v1/credores/operacoes/{operacaoId}/aportes   (financeiro/admin ou credora dona; read-only, sem step-up)
```

Estados: `PENDENTE -> EM_PROCESSAMENTO -> LIQUIDADO | FALHOU` (`FALHOU` tambem de `PENDENTE`).

## Commits (11)

1. `337d51e` feat(credores): modelar aporte da credora — entidade + `StatusAporteCredora` +
   repository + **V54** (UNIQUE `operacao_id,idempotency_key`; FKs sem CASCADE) + 10 testes de dominio.
2. `228011a` feat(credores): registrar aporte no escrow fake — `registrarAporte` no
   `RegistrarMovimentacaoEscrowUseCase` (movimentacao `Aporte` nasce `EM_PROCESSAMENTO`, **sem**
   creditar wallet), porta `RegistrarAporteEscrowPort` + `AporteEscrowAdapter` (chave
   `aporte:<aporteId>`, erro bruto -> `AporteEscrowException` sanitizada).
3. `c915815` feat(credores): registrar aporte assistido — `RegistrarAporteCredoraUseCase`
   (404 neutro, idempotencia antes da elegibilidade, contrato `ASSINADO` 409, replay 200 /
   conflito 409) + auditoria `CREDORA_APORTE_REGISTRADO` (evento + listener + **V55**).
4. `8fbb424` feat(credores): expor registro de aporte assistido — `POST` com
   `@RequireStepUpEstrito`, `Idempotency-Key` header, 201/200, DTO publico minimo.
5. `64ccd1a` test: pinar campos de data no response (hotfix pos-review).
6. `39a5a5d` feat(credores): reconciliar status do aporte — use case interno (sem endpoint; o
   escrow e local, sem provider externo emitindo callback — Fase 5 pluga o webhook real), replay
   no-op, conflito pos-terminal 409, auditoria terminal `CREDORA_APORTE_LIQUIDADO/FALHOU`;
   escrow liquida creditando wallet **uma unica vez**.
7. `3a705fd` fix(escrow): locks na reconciliacao (hotfix pos-review) — `SELECT FOR UPDATE` na
   movimentacao + wallet (`findByPropostaIdForUpdate`), sem credito duplo/lost update.
8. `2216203` feat(credores): consultar aportes da operacao — GET owner-scoped, 404 neutro
   indistinguivel, lista vazia valida, ordenacao criacao desc.
9. `1568422` fix(credores): serializar registro e reconciliacao concorrentes (fixes pos-review
   manual) — `FOR UPDATE` na operacao antes do check de idempotencia (replay concorrente = 200,
   nao violacao de UNIQUE) e na leitura do aporte por referencia (sem auditoria terminal dupla).
10. `a19c697` fix(credores): persistir transicao do aporte e cobrir fluxo E2E —
    `AporteCredoraIT` (5 cenarios, Postgres real) revelou mutacao pos-save em instancia
    detached (save com id atribuido faz merge): POST respondia `EM_PROCESSAMENTO` mas persistia
    `PENDENTE` sem referencia; fix usa a instancia managed retornada pelo `save`.
11. `3f67def` test(credores): reforcar asserts da IT (hotfix pos-review) — estado persistido
    pos-POST + `containsString` no 404 neutro.

## Decisoes tecnicas

- **Escrow local como "provider"**: reuso do `RegistrarMovimentacaoEscrowUseCase` (Sprint 12) em
  vez de estender o port `EscrowProvider` — port externo e adapter Celcoin intocados.
- **Idempotencia em 2 niveis**: client key dedupe no `AporteCredora` (UNIQUE V54 por
  operacao+chave, serializado por lock na operacao); escrow keyed por `aporte:<aporteId>`
  (UNIQUE global, sem overflow do VARCHAR(100)).
- **Credito de wallet somente na liquidacao** (reconciliacao); registro nao credita.
- **Atomicidade local**: falha do escrow no registro desfaz o aporte na mesma tx; anti-orphan
  2 fases (REQUIRES_NEW) so sera necessario com provider HTTP real (Fase 5).
- **409 para contrato nao assinado** (spec 029) — diverge do 422 da associacao Sprint 17, que
  permanece.
- Erros neutros sem UUID/dado de escrow/provider (`CRD-404-006/007`, `CRD-409-004/005/006`,
  `CRD-400-002..010`).

## Verificacao

- `./gradlew check` verde: **1906 testes** (baseline 1840; +66 da sprint), JaCoCo ok, spotless ok.
- `AporteCredoraIT` (E2E, Postgres `sep_test`): POST 201 -> replay 200 (auditoria 1x) ->
  reconciliacao liquida (movimentacao `LIQUIDADA`, wallet creditada, auditoria 1x) -> GET
  owner-scoped (credora dona e financeiro); falha sem credito; contrato nao assinado 409;
  sem step-up estrito 403; credora alheia 404 neutro.

## Riscos / notas

- Serializacao concorrente depende de `SELECT FOR UPDATE` (garantia do banco) — sem teste
  unitario de corrida (mesmo trade-off dos locks do escrow Sprint 12/15).
- Sem indice em `aporte_credora.referencia_escrow` (lookup de reconciliacao assistido/raro) —
  follow-up se virar fluxo quente na Fase 5.
- Collection Postman segue congelada no Sprint 14 (backlog de refresh completo); contrato
  vigente = springdoc runtime.
- Docs: `CREDORES.md`, `PIX.md` (secao aporte/escrow), estado/historico atualizados.
