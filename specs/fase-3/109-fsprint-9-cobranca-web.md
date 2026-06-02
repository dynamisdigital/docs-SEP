# Spec 109 - F-Sprint 9 - Cobranca Web

## Metadados

- **ID da Spec**: 109
- **Titulo**: F-Sprint 9 - Parcelas, cobranca e inadimplencia no web
- **Status**: planejada
- **Fase do produto**: Fase 3 - Epic 13
- **Trilha**: Web (`sep-app`)
- **Origem**: PRD Epic 13; APIs cobranca Sprints 12-13
- **Depende de**: [`108-fsprint-8-formalizacao-web.md`](./108-fsprint-8-formalizacao-web.md)
- **Responsavel principal**: Devs Plenos Frontend

## Objetivo

Dar visibilidade web ao tomador e ao financeiro sobre parcelas, agenda, recebimentos manuais, inadimplencia e renegociacao.

## Escopo

### Em escopo
- Tela do tomador para parcelas e historico.
- Tela financeira para agenda e recebimentos manuais.
- Visao de inadimplencia e contatos.
- Fluxo de proposta/aceite/recusa de renegociacao.
- Estados de atraso, pago, inadimplente e renegociado.

### Fora de escopo
- Pix automatico.
- Boleto.
- BI externo.

## Tasks de implementacao

1. Criar `CobrancaService` e modelos de agenda/parcela/recebimento/renegociacao.
2. Implementar parcelas do tomador.
3. Implementar agenda financeira e detalhe de parcela.
4. Implementar registro de recebimento manual com step-up quando aplicavel.
5. Implementar inadimplencia, contato e renegociacao.
6. Atualizar MSW, Vitest e cenarios de erro.

## Gates que nao contam como task

- Precheck dos endpoints de cobranca.
- Smoke E2E parcelas -> recebimento/renegociacao.
- Docs, PRD/CONTEXT e roadmap quando aplicavel.

## Definition of Done

- Tomador ve apenas suas parcelas.
- Financeiro opera recebimento/renegociacao com autorizacao correta.
- Estados financeiros sao consistentes com a API.
