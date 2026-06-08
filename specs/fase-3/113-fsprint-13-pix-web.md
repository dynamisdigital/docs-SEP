# Spec 113 - F-Sprint 13 - Pix Web

## Metadados

- **ID da Spec**: 113
- **Titulo**: F-Sprint 13 - Pix operacional no web
- **Status**: planejada
- **Fase do produto**: Fase 3 - Epic 13 + Epic 15
- **Trilha**: Web (`sep-app`)
- **Origem**: PRD Epic 15
- **Depende de**: F-Sprint 14; backend Sprints 19-21
- **Responsavel principal**: Devs Plenos Frontend

## Objetivo

Expor no web as operacoes Pix assistidas: desembolso, recebimentos, status e conciliacao operacional.

## Escopo

### Em escopo
- Tela financeira de desembolsos.
- Status de transferencia Pix.
- Recebimentos Pix vinculados a parcelas.
- Divergencias e conciliacao assistida.
- Reprocesso/consulta operacional quando suportado pela API.

### Fora de escopo
- Pix automatico.
- Split Pix.
- Gestao avancada de chaves.

## Tasks de implementacao

1. Criar `PixService` e modelos web.
2. Implementar desembolsos e status.
3. Implementar recebimentos Pix e vinculo com parcela.
4. Implementar conciliacao/divergencias.
5. Integrar step-up/guards e testes.

## Gates que nao contam como task

- Precheck backend Sprints 19-21.
- Smoke E2E Pix com Fake provider.
- Docs, PRD/CONTEXT e roadmap quando aplicavel.

## Definition of Done

- Financeiro opera Pix assistido pelo web.
- Divergencias ficam visiveis e rastreaveis.
- UI nao mascara falhas como sucesso.
- UI segue o design system vigente do web (New Design System SEP apos F-Sprint 14).
