# Spec 209 - M-Sprint 9 - Cobranca Mobile

## Metadados

- **ID da Spec**: 209
- **Titulo**: M-Sprint 9 - Parcelas e cobranca do tomador mobile
- **Status**: planejada
- **Fase do produto**: Fase 3 - Epic 14 Fase Mobile 2+
- **Trilha**: Mobile (`sep-mobile`)
- **Origem**: PRD Epic 14; APIs cobranca Sprints 12-13
- **Depende de**: [`208-msprint-8-formalizacao-mobile.md`](./208-msprint-8-formalizacao-mobile.md)
- **Responsavel principal**: Dev Mobile

## Objetivo

Dar ao tomador visibilidade mobile das parcelas, vencimentos, historico e renegociacoes.

## Escopo

### Em escopo
- Lista de parcelas.
- Detalhe de parcela e vencimento.
- Historico de recebimentos.
- Status de atraso/inadimplencia.
- Aceite/recusa de renegociacao quando existir.

### Fora de escopo
- Operacao financeira interna.
- Registro manual de recebimento.
- Backoffice mobile.

## Tasks de implementacao

1. Criar `CobrancaMobileService` e modelos.
2. Implementar lista de parcelas.
3. Implementar detalhe e status de parcela.
4. Implementar historico de recebimentos.
5. Implementar renegociacao para tomador.
6. Atualizar MSW, Vitest e Playwright PWA.

## Gates que nao contam como task

- Precheck contratos cobranca.
- Smoke PWA parcelas -> renegociacao.
- Docs e relatório Fase 3.

## Definition of Done

- Tomador ve apenas suas obrigacoes.
- Fluxo nao permite operacao interna indevida.
- Estados de atraso/inadimplencia sao claros.
