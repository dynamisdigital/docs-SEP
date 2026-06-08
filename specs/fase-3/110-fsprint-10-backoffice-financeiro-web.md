# Spec 110 - F-Sprint 10 - Backoffice e Financeiro Web

## Metadados

- **ID da Spec**: 110
- **Titulo**: F-Sprint 10 - Backoffice e financeiro operacional no web
- **Status**: implementada (2026-06-08)
- **Fase do produto**: Fase 3 - Epic 13
- **Trilha**: Web (`sep-app`)
- **Origem**: PRD Epic 13; APIs backoffice Sprint 14
- **Depende de**: F-Sprint 5 + backend Sprint 14
- **Responsavel principal**: Devs Plenos Frontend

## Objetivo

Implementar a operacao assistida web: fila operacional, comentarios, resolucao, reprocessos disponiveis pela API e dashboard financeiro/backoffice.

## Escopo

### Em escopo
- Dashboard operacional.
- Fila com filtros, prioridade e detalhe.
- Assumir item, comentar, resolver e ignorar.
- Reprocessar webhook/provider com step-up somente quando o backend expuser handler real para o evento.
- Visao consolidada financeira.

### Fora de escopo
- Backoffice mobile.
- BI externo.
- Atribuicao automatica de fila.

## Tasks de implementacao

1. Criar `BackofficeService` e modelos da fila/dashboard/reprocesso.
2. Implementar dashboard operacional e financeiro.
3. Implementar lista/filtros/detalhe da fila.
4. Implementar comentarios, assumir, resolver e ignorar com validacoes.
5. Implementar reprocessos com step-up para handlers reais suportados pela API.
6. Cobrir roles `FINANCEIRO`, `BACKOFFICE` e `ADMIN` em guards/testes.

## Gates que nao contam como task

- Precheck de role/step-up e contratos backend de reprocesso real.
- Smoke E2E fila -> comentario -> resolver/reprocessar.
- Docs, PRD/CONTEXT e roadmap quando aplicavel.

## Definition of Done

- Operador consegue conduzir fluxo assistido pelo web.
- Acoes sensiveis exigem step-up.
- Cliente comum nao acessa backoffice.
