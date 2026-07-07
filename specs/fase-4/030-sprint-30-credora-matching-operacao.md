# Spec 030 - Sprint 30 - Matching credora <-> operacao (assistido)

## Metadados

- **ID da Spec**: 030
- **Titulo**: Sprint 30 - Matching assistido entre credora e operacao financiada
- **Status**: planejada (gate de produto)
- **Fase do produto**: Fase 4 - Epic 15 (peca diferida do Epic 10)
- **Trilha**: Backend (`sep-api`)
- **Origem**: PRD-FASE-4 §35 (Epic 15); Epic 10 (matching diferido)
- **Depende de**: `credores` (Sprints 16-17), Sprint 29 (aporte + escrow), Sprint 27 (step-up)
- **Desbloqueia**: F-Sprint 18 (matching web), M-Sprint 16 (matching mobile)
- **Responsavel principal**: Dev Senior Backend

## Objetivo

Evoluir a associacao hoje assistida por admin (Sprint 17) para um recorte de **matching
credora <-> operacao** com regras de elegibilidade explicitas, mantendo a decisao **assistida** pelo
financeiro/admin (sem motor automatico). O sistema sugere; o operador decide.

## Contrato REST

```http
GET   /api/v1/credores/matching/sugestoes
POST  /api/v1/credores/matching/{sugestaoId}/decisao
GET   /api/v1/credores/matching/{sugestaoId}
```

### Autorizacao

- `ROLE_FINANCEIRO`/`ROLE_ADMIN`; decisao (`POST`) com **step-up**.
- Sugestoes por snapshot via ports (sem N+1), sem expor dados sensiveis da credora/tomador.
- Segregacao/ownership validada no backend; erros sem UUID.

### Estados de decisao

```text
SUGERIDA -> CONFIRMADA
         -> REJEITADA
```

## Escopo

### Em escopo

- Definir regras de elegibilidade de matching (credora elegivel <-> proposta/operacao elegivel).
- Modelar `MatchingCredoraOperacao` (sugestao + decisao), estados e migration.
- Use case de geracao de sugestoes por snapshot via ports (sem N+1).
- Use case de decisao assistida (confirmar/rejeitar) com step-up.
- Endpoints listar sugestoes, decidir e consultar.
- Auditoria `CREDORA_MATCHING_SUGERIDA`/`CONFIRMADA`/`REJEITADA`.
- Cobrir regras de elegibilidade, decisao, ownership/segregacao e estados.

### Fora de escopo

- Motor de matching automatico ou disparo automatico de aporte.
- Alterar o aporte (Sprint 29) alem do vinculo com a operacao confirmada.
- Split Pix, gestao de chaves ou Pix automatico.
- Expor score, dados bancarios ou PII de outra parte.

## Tasks de implementacao

1. Definir e documentar as regras de elegibilidade do matching (credora <-> operacao).
2. Modelar `MatchingCredoraOperacao` (sugestao/decisao/estados) + migration.
3. Use case de geracao de sugestoes por snapshot via ports (sem N+1).
4. Use case de decisao assistida (confirmar/rejeitar) com step-up + auditoria.
5. Endpoints `GET /sugestoes`, `POST /{id}/decisao`, `GET /{id}` + DTOs dedicados.
6. Vincular matching confirmado a operacao/aporte da carteira sem duplicar regra da Sprint 29.
7. Cobrir com testes: elegibilidade, decisao, ownership, estados; atualizar OpenAPI, `CREDORES.md` e
   collection.

## Gates que nao contam como task

- Confirmar Sprints 16-17, 27 e 29 integradas em `develop`.
- Baseline `./gradlew check`.
- Confirmar decisao assistida obrigatoria (nenhum caminho automatico).
- Checkpoint e PR description da Sprint 30.

## Definition of Done

- Sistema gera sugestoes de matching por regras explicitas; a decisao e sempre assistida com step-up.
- Nenhum matching e confirmado automaticamente; segregacao/ownership garantidas.
- Estados e auditoria refletem SUGERIDA -> CONFIRMADA/REJEITADA.
- Matching confirmado vincula credora e operacao sem duplicar a regra de aporte.
- Testes e `./gradlew check` passam.
