# Spec 016 - Sprint 16 - Jornada Credora Foundation

## Metadados

- **ID da Spec**: 016
- **Titulo**: Sprint 16 - Credora foundation, cadastro operacional e elegibilidade
- **Status**: planejada
- **Fase do produto**: Fase 3 - Epic 10 (Jornada da empresa credora)
- **Trilha**: Backend (`sep-api`)
- **Origem**: PRD Epic 10; CONTEXT-PARTE-2
- **Depende de**: Sprint 15 concluida em `main`
- **Responsavel principal**: Dev Senior

## Objetivo

Criar a base backend da jornada da empresa credora sem duplicar onboarding/KYB. O modulo `credores` deve representar o participante que aporta recursos, sua elegibilidade operacional e os vinculos com usuarios existentes.

## Escopo

### Em escopo
- Modulo `credores` seguindo DDD + Hexagonal.
- Entidades para empresa credora, perfil operacional e elegibilidade.
- Vinculo com usuario autenticado e com onboarding KYB existente.
- Endpoints REST iniciais para cadastro, consulta e status de elegibilidade.
- Auditoria de cadastro, alteracao e decisao de elegibilidade.

### Fora de escopo
- Aportes financeiros reais.
- Carteira, oportunidades e alocacao.
- Pix ou escrow externo.
- UI web/mobile.

## Tasks de implementacao

1. Criar modelo de dominio `EmpresaCredora`, `PerfilCredora` e VOs de status/elegibilidade.
2. Criar repositories, migrations Flyway e constraints de unicidade por documento.
3. Implementar use cases de cadastro, consulta propria e consulta administrativa.
4. Integrar elegibilidade com resultado KYB/PLD ja existente sem acoplar ao repository interno de onboarding.
5. Expor endpoints REST em `/api/v1/credores` com DTOs, mapper e OpenAPI.
6. Implementar auditoria e testes unitarios/integracao focados.

## Gates que nao contam como task

- Precheck de branch e migrations.
- Smoke E2E REST do fluxo credora.
- Atualizacao de `repos/sep-api/` e collections.

## Definition of Done

- Modulo `credores` sem dependencia indevida de web/infrastructure de outros modulos.
- Endpoints protegidos por JWT, ownership e roles administrativas.
- Tests proporcionais verdes.
- Documentacao operacional publicada.
