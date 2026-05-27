# Spec 107 - F-Sprint 7 - Credito e Open Finance Web

## Metadados

- **ID da Spec**: 107
- **Titulo**: F-Sprint 7 - Propostas, credito e Open Finance no web
- **Status**: planejada
- **Fase do produto**: Fase 3 - Epic 13
- **Trilha**: Web (`sep-app`)
- **Origem**: PRD Epic 13; APIs credito Sprints 8-9
- **Depende de**: [`106-fsprint-6-onboarding-web.md`](./106-fsprint-6-onboarding-web.md)
- **Responsavel principal**: Devs Plenos Frontend

## Objetivo

Permitir ao tomador criar e acompanhar propostas, iniciar consentimento Open Finance e visualizar status de analise/parecer.

## Escopo

### Em escopo
- Listagem e detalhe de propostas do tomador.
- Criacao de proposta com validacoes de formulario.
- Status de analise e parecer.
- Fluxo de consentimento Open Finance com redirect/status.
- Estados de reavaliacao e pendencia.

### Fora de escopo
- Motor de credito no frontend.
- Edicao de proposta apos decisao final.
- Backoffice de mesa de credito.

## Tasks de implementacao

1. Criar `CreditoService` e modelos de proposta/parecer/Open Finance.
2. Implementar lista e detalhe de propostas.
3. Implementar formulario de solicitacao de credito.
4. Implementar componente de status de analise e parecer.
5. Implementar fluxo Open Finance: iniciar consentimento, redirect e retorno.
6. Atualizar MSW, Vitest e guards de ownership/role.

## Gates que nao contam como task

- Precheck dos endpoints de credito/Open Finance.
- Smoke E2E proposta -> consentimento -> status.
- Atualizacao de docs/relatorio Fase 3.

## Definition of Done

- Tomador acompanha proposta sem acessar dados de terceiros.
- Estados do backend sao refletidos sem reinterpretacao de regra.
- Erros e pendencias sao apresentados de forma consistente.
