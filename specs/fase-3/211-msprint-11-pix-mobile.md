# Spec 211 - M-Sprint 11 - Pix Mobile

## Metadados

- **ID da Spec**: 211
- **Titulo**: M-Sprint 11 - Pix visivel ao usuario mobile
- **Status**: planejada
- **Fase do produto**: Fase 3 - Epic 14 + Epic 15
- **Trilha**: Mobile (`sep-mobile`)
- **Origem**: PRD Epics 14 e 15
- **Depende de**: backend Sprints 19-21
- **Responsavel principal**: Dev Mobile

## Objetivo

Exibir ao tomador e a credora informacoes Pix relevantes, sem transformar o app em ferramenta operacional financeira interna.

## Escopo

### Em escopo
- Status de desembolso Pix do tomador.
- Recebimentos/pagamentos de parcelas quando expostos pela API.
- Status Pix da operacao financiada para credora.
- Estados de falha, liquidado e em processamento.
- Historico simplificado.

### Fora de escopo
- Operacao interna de conciliação.
- Reprocesso financeiro.
- Gestao de chaves Pix.

## Tasks de implementacao

1. Criar `PixMobileService` e modelos.
2. Implementar status de desembolso do tomador.
3. Implementar status de pagamento/recebimento de parcelas.
4. Implementar status Pix para credora.
5. Atualizar MSW, Vitest e Playwright PWA.

## Gates que nao contam como task

- Precheck backend Pix.
- Smoke PWA status Pix.
- Docs, PRD/CONTEXT e roadmap quando aplicavel.

## Definition of Done

- App mostra status financeiro sem permitir operacao interna.
- Falhas Pix sao visiveis e compreensiveis.
- Nenhum dado de outra parte e exposto indevidamente.
