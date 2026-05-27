# Spec 210 - M-Sprint 10 - Credora Mobile

## Metadados

- **ID da Spec**: 210
- **Titulo**: M-Sprint 10 - Jornada da empresa credora mobile
- **Status**: planejada
- **Fase do produto**: Fase 3 - Epic 14 Fase Mobile 3
- **Trilha**: Mobile (`sep-mobile`)
- **Origem**: PRD Epic 14; backend Sprints 16-17
- **Depende de**: backend Sprints 16-17; contrato de autorizacao/ownership da credora entregue na Sprint 16 ou RBAC cumulativo da Sprint 18 quando necessario
- **Responsavel principal**: Dev Mobile

## Objetivo

Implementar a experiencia mobile simplificada da empresa credora: status, oportunidades e carteira.

## Escopo

### Em escopo
- Dashboard credora mobile.
- Perfil/elegibilidade.
- Oportunidades e detalhe.
- Manifestar/cancelar interesse.
- Carteira simplificada.

### Fora de escopo
- Financeiro/backoffice/admin.
- Aporte financeiro real.
- Pix operacional interno.

## Tasks de implementacao

1. Criar `CredoraMobileService` e modelos.
2. Implementar dashboard/perfil.
3. Implementar oportunidades e detalhe.
4. Implementar interesse/cancelamento.
5. Implementar carteira simplificada.
6. Atualizar tabs/guards, MSW, Vitest e Playwright PWA.

## Gates que nao contam como task

- Precheck backend credora e contrato de autorizacao/ownership da credora.
- Smoke PWA credora -> oportunidade -> carteira.
- Docs e relatório Fase 3.

## Definition of Done

- Credora ve apenas seus dados.
- Tomador nao acessa rota credora sem permissao.
- Experiencia segue Notion mobile.
