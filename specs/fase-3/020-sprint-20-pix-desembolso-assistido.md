# Spec 020 - Sprint 20 - Pix Desembolso Assistido

## Metadados

- **ID da Spec**: 020
- **Titulo**: Sprint 20 - Desembolso Pix assistido pelo financeiro
- **Status**: planejada
- **Fase do produto**: Fase 3 - Epic 15
- **Trilha**: Backend (`sep-api`)
- **Origem**: PRD Epic 15
- **Depende de**: [`019-sprint-19-pix-foundation-escrow-provider.md`](./019-sprint-19-pix-foundation-escrow-provider.md) + decisao de step-up estrito sem bypass MFA resolvida na Sprint 18 ou em precheck bloqueante
- **Responsavel principal**: Dev Senior

## Objetivo

Permitir desembolso Pix assistido apos contrato assinado e validacoes operacionais, com step-up, idempotencia, auditoria e rastreabilidade ponta a ponta.

## Escopo

### Em escopo
- Solicitar desembolso para contrato/proposta elegivel.
- Validar contrato assinado, agenda criada e ausencia de desembolso duplicado.
- Enviar transferencia via `PixProvider`.
- Consultar status e registrar eventos de liquidacao/falha.
- Reprocesso operacional via backoffice, apenas se os handlers reais de provider/event estiverem disponiveis.

### Fora de escopo
- Desembolso automatico sem operador.
- Split Pix.
- Pix recebimento.

## Tasks de implementacao

1. Implementar use case de solicitar desembolso assistido com step-up.
2. Implementar validadores de elegibilidade cruzando credito, contrato, cobranca e escrow por ports.
3. Integrar envio via `PixProvider` com idempotency-key estavel.
4. Implementar consulta/status de desembolso e transicoes.
5. Integrar eventos de falha/liquidacao ao backoffice e auditoria.

## Gates que nao contam como task

- Precheck de dados de contrato assinado e decisao de step-up estrito sem bypass MFA.
- Smoke REST desembolso pendente -> liquidado/falhou via Fake.
- Documentacao e collections.

## Definition of Done

- Desembolso exige operador autorizado e step-up.
- Duplicidade e replay sao bloqueados.
- Falhas ficam rastreaveis e reprocessaveis.
