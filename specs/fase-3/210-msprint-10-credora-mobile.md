# Spec 210 - M-Sprint 10 - Credora Mobile

## Metadados

- **ID da Spec**: 210
- **Titulo**: M-Sprint 10 - Jornada da empresa credora mobile
- **Status**: **concluída — mergeada em `origin/develop` via PR #109 (`f51e6be`), 2026-07-03**; não promovida a `main` (develop ⊃ main). Gate I1 fechado pela Sprint 25 backend (Opcao A, `GET .../interesses/me`, em `develop` e `main`). Vitest 423 + smoke `credora-mobile` 6/6 verdes; regressão e2e verde (golden-path preexistente red, alheio).
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

- **I1 - descoberta do interesse ativo**: originalmente o backend permitia registrar e cancelar interesse, mas nao expunha `GET /oportunidades/{id}/interesses/me` nem estado equivalente em `OportunidadeResponse`. Sem leitura autoritativa, o mobile nao distinguia manifestar/cancelar apos reload ou novo login.
- **Resolucao (Opcao A)**: a Sprint 25 backend (steps `steps-fase-3/backend/025-sprint-25-steps.md`) adiciona `GET /api/v1/credores/oportunidades/{id}/interesses/me` -> `200 InteresseResponse` (`ATIVO`) | `404`. Implementada na branch `feature/sprint-25-credora-interesse-ativo`; **o Gate fecha ao mergear em `develop`**.
- M-10.1, M-10.2, M-10.3 e M-10.5 podem avancar; M-10.4 so fecha o DoD apos o merge da Sprint 25.
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
