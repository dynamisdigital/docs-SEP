# Spec 208 - M-Sprint 8 - Formalizacao Mobile

## Metadados

- **ID da Spec**: 208
- **Titulo**: M-Sprint 8 - Formalizacao e contrato mobile
- **Status**: planejada
- **Fase do produto**: Fase 3 - Epic 14 Fase Mobile 2+
- **Trilha**: Mobile (`sep-mobile`)
- **Origem**: PRD Epic 14; APIs contratos Sprints 10-11
- **Depende de**: [`207-msprint-7-credito-mobile.md`](./207-msprint-7-credito-mobile.md)
- **Responsavel principal**: Dev Mobile

## Objetivo

Permitir ao tomador visualizar contrato, aceitar formalizacao com step-up e acompanhar assinatura/CCB no mobile.

## Escopo

### Em escopo
- Lista/detalhe de contrato.
- Visualizacao mobile do contrato.
- Aceite com step-up.
- Status de assinatura.
- Acesso a documento/CCB quando disponivel.

### Fora de escopo
- Assinatura nativa fora do provider.
- Editor contratual.
- Aditivos.

## Tasks de implementacao

1. Criar `ContratosMobileService` e modelos.
2. Implementar lista/detalhe de contrato.
3. Implementar visualizacao responsiva de contrato.
4. Implementar aceite com step-up.
5. Implementar status de assinatura e acesso a CCB/documento.

## Gates que nao contam como task

- Precheck step-up mobile.
- Smoke PWA contrato -> aceite.
- Docs, PRD/CONTEXT e roadmap quando aplicavel.

## Definition of Done

- Aceite sensivel usa step-up.
- Documento nao vaza sem auth.
- UI funciona em viewport mobile.
