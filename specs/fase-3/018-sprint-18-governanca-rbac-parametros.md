# Spec 018 - Sprint 18 - Governanca, RBAC e Parametros

## Metadados

- **ID da Spec**: 018
- **Titulo**: Sprint 18 - Administracao e governanca avancada
- **Status**: planejada
- **Fase do produto**: Fase 3 - Epic 11
- **Trilha**: Backend (`sep-api`)
- **Origem**: PRD Epic 11; pendencias Sprint 14/15
- **Depende de**: Sprint 15 concluida em `main`
- **Responsavel principal**: Dev Senior

## Objetivo

Evoluir a administracao interna para suportar multiplas roles por usuario, parametros operacionais auditaveis e trilha administrativa mais forte.

## Escopo

### Em escopo
- Refactor de single-role para permissoes/roles cumulativas.
- Suporte a `FINANCEIRO + BACKOFFICE`.
- Parametros operacionais versionados e auditaveis.
- Auditoria de alteracao de roles e parametros.
- Endpoints administrativos protegidos por step-up.

### Fora de escopo
- Tela web de governanca.
- SSO corporativo.
- ABAC completo.
- WebAuthn/Passkeys.

## Tasks de implementacao

1. Modelar roles cumulativas preservando compatibilidade com claims atuais.
2. Criar migrations para tabela de associacao usuario-role e migracao dos dados existentes.
3. Atualizar autorizacao, JWT claims e guards backend para multiplas roles.
4. Implementar parametros operacionais versionados para limites configuraveis criticos.
5. Expor endpoints administrativos de roles e parametros com step-up.
6. Atualizar auditoria, OpenAPI e testes de regressao de seguranca.

## Gates que nao contam como task

- Precheck de compatibilidade dos tokens atuais.
- Smoke de login e rotas protegidas.
- Documentacao em `SEGURANCA.md` e docs operacionais.

## Definition of Done

- Usuarios podem acumular roles sem perder permissoes existentes.
- Alteracoes administrativas exigem step-up.
- Mudancas de parametros deixam trilha auditavel.
