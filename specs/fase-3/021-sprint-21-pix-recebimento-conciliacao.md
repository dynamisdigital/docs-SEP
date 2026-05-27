# Spec 021 - Sprint 21 - Pix Recebimento e Conciliacao

## Metadados

- **ID da Spec**: 021
- **Titulo**: Sprint 21 - Recebimento Pix, baixa de parcelas e conciliacao
- **Status**: planejada
- **Fase do produto**: Fase 3 - Epic 15
- **Trilha**: Backend (`sep-api`)
- **Origem**: PRD Epic 15; modulo `cobranca`
- **Depende de**: [`019-sprint-19-pix-foundation-escrow-provider.md`](./019-sprint-19-pix-foundation-escrow-provider.md)
- **Responsavel principal**: Dev Senior

## Objetivo

Automatizar recebimentos Pix de parcelas e conciliacao inicial com cobranca/escrow, mantendo operacao assistida para divergencias.

## Escopo

### Em escopo
- Gerar referencia Pix para parcela/obrigacao.
- Processar webhook de pagamento recebido.
- Baixar parcela em `cobranca` via port de aplicacao.
- Registrar movimentacao escrow vinculada.
- Tratar divergencias em fila de backoffice.

### Fora de escopo
- Pix automatico.
- Boleto.
- Conciliacao bancaria ampla.
- Split Pix.

## Tasks de implementacao

1. Modelar referencia de recebimento Pix e vinculo com parcela.
2. Criar use case de gerar cobrança Pix para parcela elegivel.
3. Processar webhook de pagamento recebido com idempotencia.
4. Integrar baixa de parcela e movimentacao escrow por ports.
5. Implementar conciliacao operacional e divergencias para backoffice.
6. Cobrir cenarios de duplicidade, pagamento parcial/maior e falha provider.

## Gates que nao contam como task

- Precheck de parcelas pendentes.
- Smoke E2E Fake provider de recebimento -> baixa.
- Documentacao `PIX.md`, `COBRANCA.md` e collections.

## Definition of Done

- Pagamento recebido baixa parcela uma unica vez.
- Divergencias nao somem; entram na operacao assistida.
- Auditoria registra correlacao parcela/recebimento/escrow.
