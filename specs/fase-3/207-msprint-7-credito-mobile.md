# Spec 207 - M-Sprint 7 - Credito Mobile

## Metadados

- **ID da Spec**: 207
- **Titulo**: M-Sprint 7 - Proposta, credito e Open Finance mobile
- **Status**: planejada
- **Fase do produto**: Fase 3 - Epic 14 Fase Mobile 2+
- **Trilha**: Mobile (`sep-mobile`)
- **Origem**: PRD Epic 14; APIs credito Sprints 8-9
- **Depende de**: [`206-msprint-6-onboarding-mobile.md`](./206-msprint-6-onboarding-mobile.md)
- **Responsavel principal**: Dev Mobile

## Objetivo

Permitir ao tomador solicitar credito e acompanhar status de analise/Open Finance pelo app.

## Escopo

### Em escopo
- Lista e detalhe de propostas.
- Criacao de proposta mobile.
- Status de analise/parecer.
- Fluxo Open Finance mobile/PWA.
- Feedback de pendencia ou reprovacao.

### Fora de escopo
- Mesa de credito.
- Financeiro/backoffice.
- Regra de score no app.

## Tasks de implementacao

1. Criar `CreditoMobileService` e modelos.
2. Implementar lista/detalhe de propostas.
3. Implementar formulario mobile de proposta.
4. Implementar status de analise e parecer.
5. Implementar consentimento Open Finance e retorno.
6. Atualizar MSW, Vitest e Playwright PWA.

## Gates que nao contam como task

- Precheck contratos credito/Open Finance.
- Smoke PWA proposta -> status.
- Docs e relatório Fase 3.

## Definition of Done

- Tomador acompanha sua proposta no app.
- Estados do backend sao exibidos sem decisao local.
- Fluxo funciona em PWA.
