# Spec 211 - M-Sprint 11 - Pix Mobile

## Metadados

- **ID da Spec**: 211
- **Titulo**: M-Sprint 11 - Pix visivel ao usuario mobile
- **Status**: mergeada em `origin/develop` via PR #111 (squash `34f4f0f`, 2026-07-06) e promovida
  a `origin/main` via PR #112 (`ec74f5e`). Tasks M-11.1-M-11.5 + hotfix do code review entregues.
  Gates P1-P3 entregues pela Sprint 26 backend (mergeada `develop`/`main`, PR #87/#88)
- **Fase do produto**: Fase 3 - Epic 14 + Epic 15
- **Trilha**: Mobile (`sep-mobile`)
- **Origem**: PRD Epics 14 e 15
- **Depende de**: [`212-msprint-12-new-design-system-mobile.md`](./212-msprint-12-new-design-system-mobile.md)
  + backend Sprints 19-21 + contratos owner-scoped P1-P3 do
  [`step 211`](../../steps-fase-3/mobile/211-msprint-11-steps.md)
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
