# Spec 019 - Sprint 19 - Pix Foundation + EscrowProvider

## Metadados

- **ID da Spec**: 019
- **Titulo**: Sprint 19 - Fundacao Pix, provider pattern e EscrowProvider
- **Status**: planejada
- **Fase do produto**: Fase 3 - Epic 15
- **Trilha**: Backend (`sep-api`)
- **Origem**: PRD Epic 15; ADR 0004; ADR 0005
- **Depende de**: Sprint 15 concluida em `main`
- **Responsavel principal**: Dev Senior

## Objetivo

Preparar o modulo `pix` e evoluir o `EscrowProvider` ja existente no modulo `escrow` com adapter Celcoin, mantendo Celcoin isolado por ports/adapters e Fake provider para ambiente local.

## Escopo

### Em escopo
- Modulo `pix` com entidades base e estados operacionais.
- Port `PixProvider` e adapters Fake/Celcoin skeleton.
- Adapter Celcoin para o `EscrowProvider` existente no modulo `escrow`, funcional para criar/consultar conta e wallet.
- Webhook receiver dedicado para eventos Pix/Celcoin.
- Idempotencia e auditoria reforcada.

### Fora de escopo
- Desembolso real.
- Recebimento/conciliacao de parcelas.
- Split Pix, Pix automatico e gestao avancada de chaves.

## Tasks de implementacao

1. Modelar `PixTransferencia`, `PixRecebimento`, `PixWebhookEvent` e estados.
2. Criar migrations, repositories e constraints de idempotencia.
3. Definir port `PixProvider` orientado ao dominio e revisar o contrato existente de `EscrowProvider`.
4. Implementar adapters Fake/Celcoin para Pix e adapter Celcoin do `EscrowProvider` com RestClient/Resilience4j/WireMock.
5. Criar processamento inicial de webhook Pix com HMAC e outbox/idempotencia.
6. Criar OpenAPI, auditoria e testes de provider/webhook.

## Gates que nao contam como task

- Precheck de secrets/properties.
- Smoke com Fake provider.
- Documentacao `PIX.md` e collections.

## Definition of Done

- Dominio Pix nasce isolado de detalhes Celcoin.
- Ambiente local funciona com Fake provider.
- Adapters Celcoin de Pix e Escrow tem testes WireMock para contrato HTTP basico.
