# Spec 111 - F-Sprint 11 - Jornada Credora Web

## Metadados

- **ID da Spec**: 111
- **Titulo**: F-Sprint 11 - Jornada da empresa credora no web
- **Status**: planejada
- **Fase do produto**: Fase 3 - Epic 13 + Epic 10
- **Trilha**: Web (`sep-app`)
- **Origem**: PRD Epics 10 e 13
- **Depende de**: backend Sprints 16-17; contrato de autorizacao/ownership da credora entregue na Sprint 16 ou RBAC cumulativo da Sprint 18 quando necessario
- **Responsavel principal**: Devs Plenos Frontend

## Objetivo

Implementar a experiencia web da empresa credora: perfil, elegibilidade, oportunidades, interesses e carteira.

## Escopo

### Em escopo
- Dashboard credora.
- Perfil/elegibilidade.
- Lista e detalhe de oportunidades.
- Manifestar/cancelar interesse.
- Carteira e detalhe de operacao financiada.

### Fora de escopo
- Aporte financeiro real.
- Pix e escrow externos.
- Mobile credora.

## Tasks de implementacao

1. Criar `CredoraService` e modelos web.
2. Implementar dashboard/perfil/elegibilidade.
3. Implementar oportunidades e detalhe.
4. Implementar interesse/cancelamento.
5. Implementar carteira e detalhe de operacao.
6. Atualizar MSW, Vitest, guards e E2E focado.

## Gates que nao contam como task

- Precheck dos contratos backend 16-17 e do contrato de autorizacao/ownership da credora.
- Smoke E2E credora -> oportunidade -> interesse -> carteira.
- Docs e relatório Fase 3.

## Definition of Done

- Credora acessa apenas sua jornada.
- UI segue Notion autenticado.
- Estados sem backend correspondente nao sao simulados como regra de negocio.
