# Spec 106 - F-Sprint 6 - Onboarding Web

## Metadados

- **ID da Spec**: 106
- **Titulo**: F-Sprint 6 - Jornada onboarding PF/PJ no web
- **Status**: planejada
- **Fase do produto**: Fase 3 - Epic 13
- **Trilha**: Web (`sep-app`)
- **Origem**: PRD Epic 13; APIs onboarding Sprints 6-7
- **Depende de**: F-Sprint 5 + backend Fase 2 em `main`
- **Responsavel principal**: Devs Plenos Frontend

## Objetivo

Implementar as telas autenticadas de onboarding PF/PJ consumindo as APIs de KYC/KYB/PLD, com design Notion e sem regra de negocio no frontend.

## Escopo

### Em escopo
- Dashboard de onboarding do usuario autenticado.
- Fluxo PF: iniciar onboarding, upload de documentos, status.
- Fluxo PJ/KYB: dados da empresa, representantes, documentos e status.
- Estados de pendencia, aprovado e reprovado.
- MSW/dev-offline atualizado para contratos de onboarding.

### Fora de escopo
- Captura OCR nativa.
- Edicao documental apos aprovacao.
- Mobile.

## Tasks de implementacao

1. Criar `OnboardingService` e modelos TypeScript alinhados aos DTOs backend.
2. Implementar rota e shell de onboarding no dashboard autenticado.
3. Implementar fluxo PF com upload e status.
4. Implementar fluxo PJ/KYB com representantes e documentos.
5. Implementar componentes de status/pendencia/reprovacao reutilizaveis.
6. Atualizar MSW, Vitest e tratamento de erros 400/403/409.

## Gates que nao contam como task

- Precheck de contratos Swagger.
- Smoke E2E onboarding feliz com backend real ou MSW.
- Docs de uso web, PRD/CONTEXT e roadmap quando houver mudanca de status.

## Definition of Done

- Jornada onboarding navegavel no web autenticado.
- Nenhuma regra de decisao KYC/KYB implementada no frontend.
- Testes unitarios e smoke proporcional verdes.
