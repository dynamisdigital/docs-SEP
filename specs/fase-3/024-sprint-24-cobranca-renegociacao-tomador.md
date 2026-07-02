# Spec 024 - Sprint 24 - Consulta de Renegociacao Ativa do Tomador

## Metadados

- **ID da Spec**: 024
- **Titulo**: Sprint 24 - Descoberta e leitura owner-scoped de renegociacao ativa
- **Status**: mergeada em `develop` via PR #83 (squash `2a41c51`); ainda nao promovida a `main`
- **Fase do produto**: Fase 3 - Epic 8/14, desbloqueio backend B2 da M-Sprint 9
- **Trilha**: Backend (`sep-api`)
- **Origem**: M-Sprint 9, Task M-9.5; renegociacao da Sprint 13
- **Depende de**: [`023-sprint-23-cobranca-historico-tomador.md`](./023-sprint-23-cobranca-historico-tomador.md)
- **Desbloqueia**: M-Sprint 9, Task M-9.5
- **Responsavel principal**: Dev Senior Backend

## Objetivo

Permitir que o tomador descubra e leia os termos financeiros de uma renegociacao ativa
antes de aceitar ou recusar, sem expor IDs operacionais, dados do operador ou
justificativa interna.

## Contrato REST

```http
GET /api/v1/cobranca/parcelas/{parcelaId}/renegociacao-ativa
```

### Autorizacao

- Apenas usuario autenticado com `ROLE_CLIENTE`.
- Parcela propria com proposta ativa e nao expirada: `200`.
- Parcela propria sem proposta ativa: `404`.
- Parcela inexistente ou pertencente a outro tomador: `403` uniforme.
- Codigo/mensagem de erro nao incluem UUID de parcela, contrato, tomador ou renegociacao.
- O GET nao exige step-up e nao altera estado.

### Resposta

```text
RenegociacaoTomadorResponse
  renegociacaoId: UUID
  parcelaId: UUID
  status: PROPOSTA
  novoValorParcela: BigDecimal
  numeroParcelas: int
  valorTotalRenegociado: BigDecimal
  novoVencimento: LocalDate
  desconto: BigDecimal
  dataProposta: OffsetDateTime
  dataExpiracao: OffsetDateTime
```

- `valorTotalRenegociado` e calculado no backend como
  `novoValorParcela * numeroParcelas`.
- Apenas `PROPOSTA` ainda nao expirada pelo `Clock` e retornada.
- Proposta `ACEITA`, `RECUSADA`, `EXPIRADA` ou vencida antes da execucao do job nao e ativa.

### Campos proibidos

- `tomadorId`.
- `propostaPor`.
- `agendaOriginalId`.
- `agendaSubstitutaId`.
- `statusParcelaAnterior`.
- `justificativa` operacional.
- payload de notificacao, auditoria ou provider.

## Escopo

### Em escopo

- Criar consulta read-only por parcela e `StatusRenegociacao.PROPOSTA`.
- Validar ownership antes de revelar se existe proposta.
- Usar `Clock` para impedir leitura como ativa depois de `dataExpiracao`.
- Criar result de aplicacao e DTO REST dedicados ao tomador.
- Calcular o valor total no backend.
- Reutilizar o controller de consultas do tomador criado na Sprint 23.
- Cobrir ownership, estados finais, expiracao e minimizacao do JSON.
- Atualizar OpenAPI, `COBRANCA.md`, collection e docs da M-Sprint 9.

### Fora de escopo

- Alterar os PATCHes de aceite/recusa.
- Alterar regra, prazo ou job de expiracao.
- Criar proposta de renegociacao pelo tomador.
- Expor justificativa ou dados do operador.
- Executar step-up no GET.
- Alterar agenda, parcela, notificacao ou auditoria.
- Criar migration ou novo status.

## Tasks de implementacao

1. Criar query owner-scoped de renegociacao ativa com `Clock`.
2. Criar result/DTO publico com total calculado no backend.
3. Expor endpoint REST e cobrir seguranca, expiracao e estados.
4. Atualizar OpenAPI, collection e documentacao de cobranca/M-9.

## Gates que nao contam como task

- Confirmar Sprint 23 integrada em `develop`.
- Rodar baseline `./gradlew check`.
- Confirmar que ownership e validada antes da busca/revelacao da proposta.
- Smoke autenticado owner -> termos -> PATCH existente.
- Checkpoint e PR description da Sprint 24.

## Definition of Done

- Tomador descobre proposta ativa apenas para parcela propria.
- Termos financeiros completos chegam antes da decisao.
- Valor total e calculado no backend, nunca pelo mobile.
- Proposta vencida pelo `Clock` nao e retornada como ativa.
- Parcela inexistente e alheia nao podem ser distinguidas por status ou corpo da resposta.
- JSON nao contem IDs internos, operador ou justificativa.
- GET permanece read-only e sem step-up.
- Testes focados e `./gradlew check` passam.
- Task M-9.5 fica documentalmente desbloqueada apos merge em `develop`.
