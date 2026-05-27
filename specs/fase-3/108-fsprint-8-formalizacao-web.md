# Spec 108 - F-Sprint 8 - Formalizacao Web

## Metadados

- **ID da Spec**: 108
- **Titulo**: F-Sprint 8 - Formalizacao, assinatura e CCB no web
- **Status**: planejada
- **Fase do produto**: Fase 3 - Epic 13
- **Trilha**: Web (`sep-app`)
- **Origem**: PRD Epic 13; APIs contratos Sprints 10-11
- **Depende de**: [`107-fsprint-7-credito-open-finance-web.md`](./107-fsprint-7-credito-open-finance-web.md)
- **Responsavel principal**: Devs Plenos Frontend

## Objetivo

Implementar a experiencia web de formalizacao contratual: contrato, aceite, assinatura digital e download/visualizacao da CCB.

## Escopo

### Em escopo
- Lista/detalhe de contratos do tomador.
- Visualizacao de contrato gerado e status de formalizacao.
- Aceite com step-up.
- Envio/retorno de assinatura digital.
- Download ou link de documento assinado/CCB.

### Fora de escopo
- Editor de template contratual.
- Assinatura offline.
- Renegociacao/aditivos.

## Tasks de implementacao

1. Criar `ContratosService` e modelos de contrato/assinatura/CCB.
2. Implementar lista e detalhe de contrato.
3. Implementar visualizacao de conteudo/versao contratual.
4. Implementar aceite com fluxo step-up.
5. Implementar status de assinatura e acesso a documento assinado.

## Gates que nao contam como task

- Precheck de step-up web.
- Smoke E2E contrato aprovado -> aceite -> assinatura fake/status.
- Docs e relatório Fase 3.

## Definition of Done

- Operacoes sensiveis usam step-up real.
- Documento/CCB nao é exposto sem autorizacao.
- UI segue Notion autenticado.
