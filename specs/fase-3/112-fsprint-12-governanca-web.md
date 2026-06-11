# Spec 112 - F-Sprint 12 - Governanca Web

## Metadados

- **ID da Spec**: 112
- **Titulo**: F-Sprint 12 - Administracao e governanca avancada no web
- **Status**: mergeada (PR #51 -> develop, 2026-06-10; promovida a main via PR #52)
- **Fase do produto**: Fase 3 - Epic 13 + Epic 11
- **Trilha**: Web (`sep-app`)
- **Origem**: PRD Epics 11 e 13
- **Depende de**: F-Sprint 14; backend Sprint 18
- **Responsavel principal**: Devs Plenos Frontend

## Objetivo

Implementar telas administrativas para roles cumulativas, parametros operacionais e auditoria administrativa.

## Escopo

### Em escopo
- Gestao de roles/permissoes.
- Parametros operacionais versionados.
- Historico/auditoria administrativa.
- Fluxos sensiveis com step-up.
- Guards para `ADMIN` e roles internas.

### Fora de escopo
- SSO.
- ABAC completo.
- BI externo.

## Tasks de implementacao

1. Criar `GovernancaService` e modelos de roles/parametros/auditoria.
2. Implementar gestao de roles cumulativas.
3. Implementar parametros operacionais.
4. Implementar historico/auditoria administrativa.
5. Integrar step-up e testes de autorizacao.

## Gates que nao contam como task

- Precheck backend Sprint 18.
- Smoke E2E alterar role/parametro.
- Docs, PRD/CONTEXT e roadmap quando aplicavel.

## Definition of Done

- Alteracoes sensiveis usam step-up.
- UI nao permite operacao sem role adequada.
- Historico fica legivel para auditoria.
- UI segue o design system vigente do web (New Design System SEP apos F-Sprint 14).
