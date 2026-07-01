# Spec 023 - Sprint 23 - Historico de Recebimentos do Tomador

## Metadados

- **ID da Spec**: 023
- **Titulo**: Sprint 23 - Consulta owner-scoped do historico de recebimentos
- **Status**: mergeada em `develop` (PR #81) e promovida a `main` (PR #82)
- **Fase do produto**: Fase 3 - Epic 8/14, desbloqueio backend B1 da M-Sprint 9
- **Trilha**: Backend (`sep-api`)
- **Origem**: M-Sprint 9, Task M-9.4; APIs de cobranca das Sprints 12-13
- **Depende de**: Sprint 22 integrada em `develop`; modulo `cobranca` das Sprints 12-13
- **Desbloqueia**: M-Sprint 9, Task M-9.4
- **Responsavel principal**: Dev Senior Backend

## Objetivo

Permitir que o tomador consulte os recebimentos de uma parcela propria por um contrato
REST minimo e seguro, sem reutilizar a listagem operacional de `FINANCEIRO/ADMIN` nem
expor dados de escrow, operador, idempotencia ou integracao externa.

## Contrato REST

```http
GET /api/v1/cobranca/parcelas/{parcelaId}/recebimentos
```

### Autorizacao

- Apenas usuario autenticado com `ROLE_CLIENTE`.
- Parcela propria: `200`.
- Parcela inexistente ou pertencente a outro tomador: `403` uniforme.
- Codigo/mensagem de erro nao incluem UUID de parcela, contrato ou tomador.
- A ownership continua baseada no contrato da agenda e validada no backend.

### Resposta

```text
RecebimentoTomadorResponse[]
  recebimentoId: UUID
  valorRecebido: BigDecimal
  dataRecebimento: OffsetDateTime
  meioPagamento: String
```

- Ordenacao: `dataRecebimento DESC`.
- Nenhum recebimento: `200 []`.
- Sem paginacao nesta entrega; o recorte e por parcela.

### Campos proibidos

- `movimentacaoEscrowId`.
- `identificadorExterno`.
- `idempotencyKey`.
- `observacao`.
- `registradoPor`.
- status tecnico `novo`.
- payload bancario, de provider ou auditoria.

## Escopo

### Em escopo

- Criar consulta read-only owner-scoped por parcela.
- Reutilizar `ParcelaCobrancaRepository`, `ContratoCobrancaQueryPort` e
  `RecebimentoRepository`.
- Ordenar recebimentos no repository, sem ordenacao no cliente.
- Criar result de aplicacao e DTO REST dedicados ao tomador.
- Expor o endpoint em controller de consultas do tomador.
- Cobrir ownership, nao enumeracao, lista vazia, ordenacao e minimizacao do JSON.
- Atualizar OpenAPI, `COBRANCA.md`, collection e docs da M-Sprint 9.

### Fora de escopo

- Alterar `GET /api/v1/cobranca/recebimentos` operacional.
- Registrar, editar, excluir ou estornar recebimentos.
- Expor comprovante, identificador externo, escrow ou operador.
- Recalcular saldo, mora, multa ou status da parcela.
- Paginar historico por parcela.
- Criar migration, tabela, evento ou auditoria de leitura.
- Alterar contratos Pix ou conciliacao.

## Tasks de implementacao

1. Criar query owner-scoped e result publico de recebimento.
2. Criar DTO, mapper e endpoint REST exclusivo de `CLIENTE`.
3. Cobrir repository, use case, controller e integracao.
4. Atualizar OpenAPI, collection e documentacao de cobranca/M-9.

## Gates que nao contam como task

- Confirmar Sprint 22 e `main` integradas em `develop`.
- Rodar baseline `./gradlew check`.
- Confirmar que parcela inexistente e parcela alheia retornam o mesmo status.
- Smoke autenticado owner -> historico.
- Checkpoint e PR description da Sprint 23.

## Definition of Done

- Tomador lista apenas recebimentos de parcela propria.
- Endpoint interno global continua bloqueado para `CLIENTE`.
- Parcela inexistente e alheia nao podem ser distinguidas por status ou corpo da resposta.
- JSON contem somente os quatro campos publicos definidos.
- Lista vazia e valida e a ordenacao e decrescente.
- Nenhuma regra financeira ou mutacao foi adicionada.
- Testes focados e `./gradlew check` passam.
- Task M-9.4 fica documentalmente desbloqueada apos merge em `develop`.
