# Spec 206 - M-Sprint 6 - Onboarding Mobile

## Metadados

- **ID da Spec**: 206
- **Titulo**: M-Sprint 6 - Onboarding do tomador no mobile
- **Status**: planejada
- **Fase do produto**: Fase 3 - Epic 14 Fase Mobile 2+
- **Trilha**: Mobile (`sep-mobile`)
- **Origem**: PRD Epic 14; APIs onboarding Sprints 6-7
- **Depende de**: [`212-msprint-12-new-design-system-mobile.md`](./212-msprint-12-new-design-system-mobile.md) concluida + M-Sprint 5 + backend Fase 2 em `main`
- **Responsavel principal**: Dev Mobile

## Objetivo

Implementar o onboarding mobile do tomador em PWA/Ionic, consumindo APIs existentes e mantendo a regra de negocio no backend.

> **Ordem obrigatoria**: esta M-Sprint 6 (`206`) so deve iniciar depois da M-Sprint 12 (`212`) estar implementada e validada. A 212 estabiliza o design system mobile, splash/login/homes/shell/tabs e evita retrabalho visual nas jornadas funcionais.

## Escopo

### Em escopo
- Inicio do onboarding no app.
- Formulario PF/PJ reduzido para mobile.
- Upload de documentos.
- Status de verificacao e pendencias.
- UX touch com New Design System SEP mobile.

### Fora de escopo
- Backoffice/admin mobile.
- OCR nativo.
- Build Android/iOS.

## Tasks de implementacao

1. Criar `OnboardingMobileService` e modelos.
2. Implementar rota e entrypoint na tab do tomador.
3. Implementar formularios PF/PJ mobile.
4. Implementar upload de documentos em Ionic.
5. Implementar status/pendencia/aprovacao/reprovacao.
6. Atualizar MSW, Vitest e Playwright PWA.

## Gates que nao contam como task

- Precheck de contratos onboarding.
- Smoke PWA onboarding feliz.
- Docs, PRD/CONTEXT e roadmap quando aplicavel.

## Definition of Done

- Tomador consegue iniciar e acompanhar onboarding no mobile.
- App nao replica regra KYC/KYB.
- PWA validado em viewport mobile.
