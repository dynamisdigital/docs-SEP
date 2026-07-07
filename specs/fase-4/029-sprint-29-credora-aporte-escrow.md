# Spec 029 - Sprint 29 - Aporte da credora + escrow (foundation, assistido)

## Metadados

- **ID da Spec**: 029
- **Titulo**: Sprint 29 - Aporte assistido da credora na operacao financiada
- **Status**: planejada (gate de produto/credenciais; ativacao real -> Fase 5)
- **Fase do produto**: Fase 4 - Epic 15 (peca diferida do Epic 10)
- **Trilha**: Backend (`sep-api`)
- **Origem**: PRD-FASE-4 §35 (Epic 15); Epic 10 (movimentacao financeira real diferida)
- **Depende de**: `credores` (Sprints 16-17), `escrow` (`EscrowProvider`, Sprint 19), Sprint 27
  (step-up estrito)
- **Desbloqueia**: F-Sprint 18 (aporte web), M-Sprint 16 (aporte mobile)
- **Responsavel principal**: Dev Senior Backend

## Objetivo

Modelar e expor o **aporte da credora** para a operacao financiada da sua carteira, iniciado de forma
**assistida** pelo financeiro/admin e registrado na conta escrow via `EscrowProvider`. Nesta fase a
movimentacao roda sobre **provider fake** (nao move dinheiro real); a ativacao Celcoin fica na Fase 5.

## Contrato REST

```http
POST   /api/v1/credores/operacoes/{operacaoId}/aportes
GET    /api/v1/credores/operacoes/{operacaoId}/aportes
```

### Autorizacao

- `POST`: `ROLE_FINANCEIRO`/`ROLE_ADMIN` (operacao assistida), com **step-up** estrito.
- `GET`: usuario autorizado a operacao (financeiro/admin; credora dona em leitura owner-scoped).
- Idempotencia por `Idempotency-Key` no `POST`.
- Elegibilidade: operacao pertence a carteira da credora e contrato `ASSINADO`; caso contrario `409`.
- Erros nao vazam UUID nem dados de escrow/provider.

### Estados de `AporteCredora`

```text
PENDENTE -> EM_PROCESSAMENTO -> LIQUIDADO
                             -> FALHOU
```

## Escopo

### Em escopo

- Modelar dominio `AporteCredora` (estados acima), VOs e migration.
- Registrar a movimentacao de aporte na conta escrow via `EscrowProvider` (fake default),
  idempotente.
- Use case assistido: valida elegibilidade (carteira + contrato ASSINADO), ownership e step-up.
- Endpoints `POST/GET` + DTOs dedicados.
- Reconciliacao de status do aporte via webhook/callback do provider fake, idempotente.
- Auditoria `CREDORA_APORTE_REGISTRADO`/`LIQUIDADO`/`FALHOU`.
- Cobrir elegibilidade, ownership, idempotencia, transicoes de estado e 403/409.

### Fora de escopo

- Ativar adapter Celcoin real ou mover dinheiro real (Fase 5).
- Matching automatico (Sprint 30, assistido).
- Split Pix, gestao de chaves ou Pix automatico.
- Expor payload bancario, dados de escrow internos ou identificador externo.

## Tasks de implementacao

1. Modelar `AporteCredora` (estados/VOs) + migration.
2. Integrar `EscrowProvider` (fake) para registrar a movimentacao de aporte, idempotente.
3. Use case assistido de registro de aporte (elegibilidade carteira + contrato ASSINADO, ownership,
   step-up).
4. Endpoint `POST /aportes` + DTOs + `Idempotency-Key` + auditoria de registro.
5. Reconciliacao de status via webhook do provider fake (transicoes EM_PROCESSAMENTO/LIQUIDADO/FALHOU)
   idempotente + auditoria.
6. Endpoint `GET /aportes` (status owner-scoped) + DTO minimo.
7. Cobrir com testes: elegibilidade, ownership, idempotencia, estados, 403/409; atualizar OpenAPI,
   `CREDORES.md`/`PIX.md §escrow` e collection.

## Gates que nao contam como task

- Confirmar Sprints 16-17, 19 e 27 integradas em `develop`.
- Baseline `./gradlew check`; WireMock quando houver adapter HTTP.
- Confirmar que operacao alheia e inexistente retornam status uniforme.
- Checkpoint e PR description da Sprint 29.

## Definition of Done

- Financeiro/admin registra aporte assistido apenas para operacao elegivel da carteira, com step-up.
- Aporte e registrado no escrow (fake) de forma idempotente e reconciliado por webhook.
- Estados e auditoria refletem o ciclo PENDENTE -> EM_PROCESSAMENTO -> LIQUIDADO/FALHOU.
- Nenhum dinheiro real e movido; adapter Celcoin nao e ligado nesta fase.
- Erros nao permitem enumeracao; JSON expoe somente campos publicos definidos.
- Testes e `./gradlew check` passam.
