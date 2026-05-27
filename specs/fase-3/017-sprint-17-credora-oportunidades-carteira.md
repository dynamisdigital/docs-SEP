# Spec 017 - Sprint 17 - Oportunidades e Carteira da Credora

## Metadados

- **ID da Spec**: 017
- **Titulo**: Sprint 17 - Oportunidades, interesse e carteira da empresa credora
- **Status**: planejada
- **Fase do produto**: Fase 3 - Epic 10 (Jornada da empresa credora)
- **Trilha**: Backend (`sep-api`)
- **Origem**: PRD Epic 10; Sprint 16
- **Depende de**: [`016-sprint-16-credora-foundation.md`](./016-sprint-16-credora-foundation.md)
- **Responsavel principal**: Dev Senior

## Objetivo

Permitir que a empresa credora visualize oportunidades elegiveis e acompanhe uma carteira inicial de operacoes financiadas, ainda sem movimentacao financeira automatica.

## Escopo

### Em escopo
- Consulta de oportunidades a partir de propostas aprovadas/formalizadas.
- Manifestacao de interesse ou reserva operacional.
- Carteira da credora com status das operacoes.
- Leitura de parcelas/recebimentos associados a operacoes financiadas.
- Auditoria de interesse, cancelamento e associacao a operacao.

### Fora de escopo
- Matching financeiro automatico.
- Aporte real via Pix/escrow.
- Marketplace publico.
- Precificacao secundaria.

## Tasks de implementacao

1. Modelar `OportunidadeInvestimento`, `InteresseCredora` e `OperacaoFinanciada`.
2. Criar migrations, repositories e indices para consulta por credora/status.
3. Criar ports de leitura para propostas, contratos e cobranca sem acessar repositories internos diretamente.
4. Implementar use cases de listar oportunidades, registrar/cancelar interesse e consultar carteira.
5. Expor endpoints REST em `/api/v1/credores/oportunidades` e `/api/v1/credores/carteira`.
6. Cobrir regras de elegibilidade, ownership e auditoria com testes.

## Gates que nao contam como task

- Precheck de massa da Sprint 16.
- Smoke REST de oportunidade -> interesse -> carteira.
- Atualizacao de docs/collections.

## Definition of Done

- Credora elegivel consegue ver oportunidades e carteira inicial.
- Cliente comum nao acessa carteira de outra credora.
- Backoffice/admin consegue consultar para suporte operacional.
