# Spec 210 - M-Sprint 10 - Credora Mobile

## Metadados

- **ID da Spec**: 210
- **Titulo**: M-Sprint 10 - Jornada da empresa credora mobile
- **Status**: planejada; steps de implementacao criados (Gate I1 aberto)
- **Fase do produto**: Fase 3 - Epic 14 Fase Mobile 3
- **Trilha**: Mobile (`sep-mobile`)
- **Origem**: PRD Epic 14; backend Sprints 16-17
- **Depende de**: [`212-msprint-12-new-design-system-mobile.md`](./212-msprint-12-new-design-system-mobile.md) + backend Sprints 16-17; contrato de autorizacao/ownership da credora entregue na Sprint 16 ou RBAC cumulativo da Sprint 18 quando necessario
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

## Gate backend bloqueante

- **I1 - descoberta do interesse ativo**: o backend atual permite registrar e cancelar interesse, mas nao expoe `GET /oportunidades/{id}/interesses/me` nem estado equivalente em `OportunidadeResponse`. Sem leitura autoritativa, o mobile nao distingue corretamente manifestar/cancelar apos reload ou novo login.
- M-10.1, M-10.2, M-10.3 e M-10.5 podem avancar; M-10.4 nao fecha o DoD antes de I1 possuir contrato aprovado e integrado.
- Nao persistir nem inferir interesse localmente para contornar o gate. Detalhamento em [`210-msprint-10-steps.md`](../../steps-fase-3/mobile/210-msprint-10-steps.md).

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
- Docs, PRD/CONTEXT e roadmap quando aplicavel.

## Definition of Done

- Credora ve apenas seus dados.
- Tomador nao acessa rota credora sem permissao.
- Experiencia segue New Design System SEP mobile.
