# Spec 119 - F-Sprint 19 - Hardening de tooling + refresh de contrato/collection

## Metadados

- **ID da Spec**: 119
- **Titulo**: F-Sprint 19 - Hardening de tooling, validacao de contrato e refresh da collection
- **Status**: planejada
- **Fase do produto**: Fase 4 - follow-up de tooling (divida aceita da Fase 3)
- **Trilha**: Web (`sep-app`) + collection (`sep-api`)
- **Origem**: PRD-FASE-4 §35 (follow-up 4); fechamento da Fase 3 (audit de tooling)
- **Depende de**: contratos vigentes (springdoc/OpenAPI) das Sprints ate a 32
- **Responsavel principal**: Devs Plenos Frontend (com apoio backend na collection)

## Objetivo

Saldar a divida de tooling/contrato da Fase 3: atualizar a collection Postman/Insomnia (congelada
desde a Sprint 14), validar o contrato consumido pelo frontend contra o OpenAPI runtime, e endurecer
o tooling; avaliar por ADR a adocao ou o adiamento do Angular 22 (dez ocorrencias de audit exclusivas
de tooling).

## Escopo

### Em escopo

- Refresh da collection Postman/Insomnia para `credores` (aporte/matching), chaves Pix e leituras
  owner-scoped, alinhada ao OpenAPI runtime.
- Validacao dos tipos de borda do frontend contra o springdoc/OpenAPI (contrato front <-> API).
- Revisao de `npm audit` e atualizacao de tooling segura sem quebrar a baseline Angular 20.
- ADR avaliando aceitar/adiar Angular 22, documentando as ocorrencias de audit exclusivas de tooling.

### Fora de escopo

- Upgrade efetivo para Angular 22 sem ADR aprovada.
- Mudar contrato REST, regra de negocio ou telas funcionais.
- Alterar CI de deploy (Fase 5).

## Tasks de implementacao

1. Refresh da collection para `credores`/chaves Pix/leituras owner-scoped, alinhada ao OpenAPI.
2. Validar tipos de borda do frontend contra o springdoc/OpenAPI e corrigir divergencias.
3. Revisar `npm audit` e atualizar tooling seguro sem quebrar a baseline Angular 20.
4. Escrever ADR de avaliacao Angular 22 (aceitar/adiar) com as ocorrencias de tooling.
5. Ajustar CI/lint/testes conforme as atualizacoes; suite verde.

## Gates que nao contam como task

- Precheck do OpenAPI runtime e da collection atual.
- Smoke de regressao web apos atualizacao de tooling.
- Docs/roadmap quando aplicavel.

## Definition of Done

- Collection atualizada cobre `credores`/chaves Pix/leituras owner-scoped e bate com o OpenAPI.
- Divergencias de contrato front <-> API corrigidas.
- Tooling atualizado sem quebrar baseline Angular 20; suite verde.
- ADR Angular 22 registrado (decisao de aceitar ou adiar).
