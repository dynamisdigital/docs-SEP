# Spec 117 - F-Sprint 17 - Aprofundamento financeiro/conciliacao web

## Metadados

- **ID da Spec**: 117
- **Titulo**: F-Sprint 17 - Conciliacao e visao financeira consolidada no web
- **Status**: planejada (escopo confirmado por gap analysis no precheck)
- **Fase do produto**: Fase 4 - Epic 13
- **Trilha**: Web (`sep-app`)
- **Origem**: PRD-FASE-4 §35 (Epic 13 - gaps financeiro/conciliacao)
- **Depende de**: backend das Sprints 12-14 e 20-21 integrado; F-Sprint 10 (backoffice/financeiro)
- **Responsavel principal**: Devs Plenos Frontend

## Objetivo

Fechar gaps da jornada financeira/conciliacao no web contra os contratos backend ja disponiveis
(cobranca 12-14, Pix 20-21), sem introduzir regra de negocio no frontend. O escopo concreto e
confirmado por gap analysis no precheck; as tasks abaixo cobrem os gaps representativos.

## Escopo

### Em escopo

- Visao de conciliacao/divergencias pendentes (leitura), consumindo os contratos existentes.
- Visao consolidada de recebimentos/desembolsos por operacao.
- Itens de reprocesso/backoffice financeiro (quando houver handler backend por provider/event), com
  step-up.
- Estados e labels consistentes com a API; frontend nunca reinterpreta regra.

### Fora de escopo

- Criar endpoint backend ou regra de conciliacao no front.
- Pix automatico, boleto ou BI externo.
- Jornadas de tomador/credora (cobertas em outras sprints).

## Tasks de implementacao

1. Auditar gaps entre as telas financeiras web atuais e os endpoints backend disponiveis
   (conciliacao, recebimentos, desembolsos).
2. Implementar visao de conciliacao/divergencias pendentes (leitura).
3. Implementar visao consolidada de recebimentos/desembolsos por operacao.
4. Implementar reprocesso/itens de backoffice financeiro com step-up (quando handler backend
   existir).
5. Atualizar MSW, Vitest e cenarios de erro/autorizacao.
6. Smoke Playwright + docs (`README §Financeiro`).

## Gates que nao contam como task

- Precheck/gap analysis dos endpoints financeiros e de conciliacao.
- Smoke E2E das telas de conciliacao/consolidacao.
- Docs/roadmap quando aplicavel.

## Definition of Done

- Gaps identificados no precheck sao fechados com leitura fiel dos contratos backend.
- Nenhuma regra de conciliacao e calculada no frontend.
- Reprocessos exigem autorizacao/step-up corretos quando aplicavel.
- MSW/Vitest/smoke verdes; docs atualizadas.
