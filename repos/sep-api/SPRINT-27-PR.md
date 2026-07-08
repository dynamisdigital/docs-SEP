# Sprint 27 - Step-up estrito server-side no aceite de contrato

> Descricao de PR da Sprint 27 (`feature/sprint-27-step-up-server-side-aceite` -> `develop`).
> **Mergeada**: PR #89 (develop, squash `774c6ca`) + PR #90 (main, `fd66fdf`), 2026-07-08.

**Spec**: [`027-sprint-27-step-up-server-side-aceite.md`](../../specs/fase-4/027-sprint-27-step-up-server-side-aceite.md)
**Steps**: [`027-sprint-27-steps.md`](../../steps-fase-4/backend/027-sprint-27-steps.md)

## Summary

Remove o bypass server-side de step-up (migracao pre-MFA) das operacoes legais/financeiras,
aplicando a annotation estrita ja existente `@RequireStepUpEstrito` (Sprint 20 — exige MFA ativo +
`X-Step-Up-Token` valido de uso unico, sem bypass). Fecha o follow-up 1 (bloqueio de go-live) da
Fase 3. Sem novo aspecto, migration, DTO ou regra de negocio.

## Task 27.1 - Auditoria e classificacao do gate (evidencia)

Baseline auditada: branch `feature/sprint-27-step-up-server-side-aceite` criada de `develop`
(`b2200c0`); `./gradlew check` verde com 1832 testes antes de qualquer alteracao. Levantamento por
`grep -rn "RequireStepUp" src/main/java` (inclui uso com FQN no `CobrancaController`, que grep por
`@RequireStepUp\b` simples nao captura).

### Viram `@RequireStepUpEstrito` (atos legais/financeiros) — 5 endpoints

| Endpoint | Local (pre-mudanca) | Role | Motivo |
|---|---|---|---|
| `PATCH /api/v1/contratos/{id}/aceite` | `ContratoController.registrarAceite` | CLIENTE | Ato legal sobre documento contratual (CMN 4.656/2018 Art. 11); bloqueio de go-live nomeado |
| `POST /api/v1/contratos/{id}/cancelar` | `ContratoController.cancelar` | FIN/ADMIN | Ato legal sobre documento contratual |
| `POST /api/v1/contratos/{id}/assinar` | `ContratoController.enviarParaAssinatura` | FIN/ADMIN | Dispara assinatura digital (ato legal); consistencia com desembolso Pix |
| `POST /api/v1/cobranca/parcelas/{id}/renegociacao` | `CobrancaController.proporRenegociacao` | FIN/ADMIN | Muta acordo financeiro vigente |
| `PATCH /api/v1/cobranca/renegociacoes/{id}/aceite` | `CobrancaController.aceitarRenegociacao` | CLIENTE | Equivalente ao aceite de contrato |

### Mantem `@RequireStepUp` (bypass de migracao pre-MFA) — 10 ocorrencias

| Local | Operacao | Justificativa |
|---|---|---|
| `CreditoController` (`POST /credito/propostas/{id}/parecer`) | Parecer manual | Decisao operacional interna pre-contrato; nao e ato de comprometimento legal |
| `EmpresaCredoraCarteiraController` (`POST /credores/me/carteira/operacoes`) | Associar operacao a carteira (ADMIN) | Registro administrativo assistido; ato legal ja ocorreu na assinatura do contrato (pre-condicao ASSINADO). Borderline validado com o usuario em 2026-07-08: mantem bypass |
| `BackofficeReprocessoController` (2x: webhook, provider) | Reprocessos | Recuperacao operacional idempotente |
| `BackofficeController` (2x: resolver, ignorar) | Triagem de fila | Operacional com justificativa auditada |
| `UsuarioController` (3x: PUT/POST/DELETE roles) | Gestao de roles | Governanca admin; caso citado nos steps como fora de escopo |
| `GovernancaParametroController` (`PATCH /governanca/parametros/{chave}`) | Parametro operacional | Governanca versionada/auditavel |
| `PixDesembolsoController` (`POST /pix/desembolsos/{id}/status`) | Reconciliar status | Sync idempotente; o desembolso em si ja e estrito desde a Sprint 20 |

`recusarRenegociacao` segue **sem** step-up (recusa nao e ato de comprometimento) — inalterado.

Divergencia vs tabela dos steps: nenhuma. Classificacao confirmada pelo usuario antes da
implementacao (breakpoint da Task 27.1).

## Endpoints alterados

Ver Task 27.1 acima (5 endpoints estritos). Contrato REST inalterado fora do enforcement:
`403` agora tambem cobre "MFA inativo"; corpo de erro sem UUID/estado sensivel (Task 27.4).

## Testes

Suite: **1832 (baseline) -> 1840, 0 falhas**; `./gradlew check` + `bootJar` verdes.

- Matriz dos 4 cenarios nas 2 operacoes criticas, com aspect REAL no slice e `verify` de use case
  nunca invocado nos negativos:
  - Aceite de contrato (`ContratoControllerTest`): MFA+token 200; sem MFA 403 **sem bypass** (nega
    antes de validar token — `verify(validarEConsumir, never())`); sem token 403; token invalido
    403; token de outro usuario 403; estado invalido 409 distinto do 403.
  - Aceite de renegociacao (`CobrancaInadimplenciaControllerTest`): mesmos cenarios (sem MFA, sem
    token, token invalido, token alheio, ja-decidida 409).
- Unit `StepUpEnforcementAspectTest`: matriz completa do `aplicarEstrito()` (sem MFA, usuario
  ausente, token valido, invalido, de outro usuario).
- `ContratoIT`/`AssinaturaIT`/`RenegociacaoIT`: e2e com MFA habilitado + `X-Step-Up-Token` real de
  uso unico por chamada mutante (aceite, cancelar, assinar, parecer) — sem dependencia do bypass;
  ownership com token valido do alheio segue 403 de ownership.

## Seguranca

- Sem bypass server-side pre-MFA em atos legais/financeiros.
- Token de step-up: uso unico, TTL curto, hash em banco (Sprint 5/20 — inalterado).
- `403` (step-up/MFA) distinto de `409` (estado); sem vazamento de UUID (Task 27.4 confirma).

## Task 27.4 - Padronizacao 403 vs 409 (evidencia)

**Sem mudanca no handler**: `AccessDeniedException` (aspecto estrito) ja mapeia pra `403` com corpo
generico fixo ("Acesso negado") no `ApiExceptionHandler` — mensagens internas do aspecto (MFA
inativo, token ausente/invalido/alheio) nao chegam ao corpo; sem UUID. `409` segue vindo de
`ConflitoException` dos use cases, distinguivel do `403`.

**Vazamentos encontrados e corrigidos** (autorizado pelo step 027.4.2) em
`AceitarRenegociacaoUseCase`/`RecusarRenegociacaoUseCase`:

1. Estado era validado **antes** de ownership: nao-dono sondando `renegociacaoId` existente ja
   decidido recebia `409` com o status da renegociacao alheia. Ordem invertida (ownership primeiro),
   espelhando `RegistrarAceiteUseCase` (contratos), que ja estava correto.
2. `CobrancaOwnershipException(agendaOriginalId)`: o `403` de ownership vazava UUID interno da
   agenda alheia (nunca fornecido pelo chamador; ainda rotulado "contrato" na mensagem). Trocado
   pela variante neutra sem identificador (introduzida na Sprint 23 exatamente pra isso).

## Decisoes

- Reuso integral de `@RequireStepUpEstrito` + `StepUpEnforcementAspect.aplicarEstrito()`; nenhum
  aspecto/annotation novo (anti pattern-itis).
- Ajuste de fixtures dos ITs antecipado da 27.5 para a 27.2 para nao commitar suite vermelha
  (11 falhas em `ContratoIT`/`AssinaturaIT` dependiam do bypass).

## Follow-ups

- Enumeracao de `renegociacaoId` por nao-dono ainda possivel via `403` (existe) vs `404` (nao
  existe) no aceite/recusa; alinhar ao padrao 404-neutro das Sprints 23-25 muda o contrato OpenAPI
  (403 documentado) — fora do escopo da 27.4, decidir em sprint de hardening.
- Lista de endpoints do Javadoc do `ContratoController` nao cita os GETs da Sprint 11
  (`/assinatura/status`, `/documento-assinado`) — cosmetico, fora do escopo desta sprint.

## Docs atualizadas (docs-SEP, git manual)

- `docs-sep/SEGURANCA.md` §6 (step-up estrito ampliado, lista de endpoints, prova por testes).
- `repos/sep-api/CONTRATOS.md` (limitacao removida -> secao "Step-up estrito (Sprint 27)").
- `repos/sep-api/COBRANCA.md` (fluxo/tabela estritos + ownership antes do estado).
- `docs-sep/PRD-FASE-4.md` (follow-up 1 FECHADO; §36 status; §37 marco).
- `docs-sep/PRD-FASE-5.md` (Frente D: step-up fechado na Sprint 27).
- `docs-sep/CONTEXT-ESTADO-ATUAL.md` (estado + proximo passo) + `CONTEXT-PARTE-2.md` (historico).
- `AI-ROADMAP.md` ja apontava os steps 027 — sem mudanca.

## Commits

1. `349526b` feat(contratos): exigir step-up estrito no aceite, cancelamento e assinatura
2. `1bf86c7` docs(contratos): alinhar Javadoc e OpenAPI do envio para assinatura ao step-up estrito
   (fix pos-review manual da 27.2)
3. `dd2bf10` feat(cobranca): exigir step-up estrito na proposta e aceite de renegociacao
4. `9162d9f` fix(cobranca): validar ownership antes do estado na renegociacao sem vazar UUID
5. `3beab5f` test(identity): cobrir step-up estrito no aceite de contrato e renegociacao
6. `d0dfa62` test(cobranca): fechar matriz de step-up estrito pos-review da 27.5
