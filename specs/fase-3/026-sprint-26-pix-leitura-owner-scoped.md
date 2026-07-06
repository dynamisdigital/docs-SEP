# Spec 026 - Sprint 26 - Leitura Pix owner-scoped (Gates P1-P3 da M-Sprint 11)

## Metadados

- **ID da Spec**: 026
- **Titulo**: Sprint 26 - Leitura Pix owner-scoped para tomador e credora
- **Status**: planejada
- **Fase do produto**: Fase 3 - Epic 14/15, desbloqueio backend dos Gates P1-P3 da M-Sprint 11
- **Trilha**: Backend (`sep-api`)
- **Origem**: M-Sprint 11 (Pix mobile), secao "Gates backend obrigatorios" do
  [`step 211`](../../steps-fase-3/mobile/211-msprint-11-steps.md)
- **Depende de**: Sprints 19-21 (Pix backend), Sprint 17 (carteira credora), Sprint 25 (credora)
- **Desbloqueia**: M-Sprint 11, Tasks M-11.1 a M-11.5
- **Responsavel principal**: Dev Senior Backend

## Objetivo

Expor tres leituras Pix owner-scoped que hoje nao existem, para que o mobile mostre estado Pix
ao tomador (desembolso do contrato, pagamento da parcela) e a credora (operacao da carteira),
sem liberar nenhuma rota operacional a `CLIENTE`, sem provider, sem conciliacao e sem revelar
dados internos ou de outra parte.

## Contexto e bloqueio

Os endpoints Pix das Sprints 19-21 sao restritos a `FINANCEIRO`, `ADMIN` e `BACKOFFICE` e
carregam payload operacional (`txid`, `endToEndId`, chave, IDs internos, motivo tecnico).
Liberar `CLIENTE` neles ampliaria capacidades internas e nao e aceitavel. A M-Sprint 11 mobile
esta bloqueada ate estes tres contratos publicos existirem e estarem integrados em
`origin/develop`. Esta sprint entrega apenas leituras dedicadas e minimas.

## Contratos REST

### P1 - Status de desembolso do tomador por contrato

```http
GET /api/v1/pix/contratos/{contratoId}/desembolso
```

#### Autorizacao

- Apenas usuario autenticado com `ROLE_CLIENTE`.
- Contrato proprio com desembolso Pix existente: `200`.
- Contrato inexistente, contrato de outro tomador, ou sem desembolso Pix: `404` neutro.
- `FINANCEIRO`/`ADMIN`/`BACKOFFICE` neste endpoint: `403` (endpoint e exclusivo de cliente).
- Codigo/mensagem de erro nunca incluem UUID e nao diferenciam recurso alheio de inexistente.
- O GET nao exige step-up e nao altera estado.

#### Resposta

```text
PixDesembolsoTomadorResponse
  status: StatusPixPublico
  valor: BigDecimal
  atualizadoEm: OffsetDateTime
```

#### Mapa de status (interno -> publico)

Fonte: `StatusPixTransferencia` da transferencia mais recente do contrato (ultima por
`dataCriacao`, sem filtro de status — inclui `FALHOU`/`CANCELADA`). `atualizadoEm` deriva de
`dataModificacao` (auditoria).

```text
CRIADA | SOLICITADA | PROCESSANDO -> EM_PROCESSAMENTO
CONCLUIDA                          -> LIQUIDADO
FALHOU                             -> FALHOU
CANCELADA                          -> CANCELADO
```

### P2 - Status Pix da parcela do tomador

```http
GET /api/v1/pix/parcelas/{parcelaId}/status
```

#### Autorizacao

- Apenas usuario autenticado com `ROLE_CLIENTE`.
- Parcela propria com estado Pix (referencia/recebimento) existente: `200`.
- Parcela inexistente, parcela de outro tomador, ou sem estado Pix: `404` neutro.
- `FINANCEIRO`/`ADMIN`/`BACKOFFICE` neste endpoint: `403`.
- Erro nunca inclui UUID e nao diferencia alheio de inexistente.
- O GET nao gera referencia, nao concilia, nao reprocessa, nao usa step-up e nao altera estado.

#### Resposta

```text
PixPagamentoParcelaResponse
  status: StatusPixParcelaPublico
  valor: BigDecimal | null
  atualizadoEm: OffsetDateTime | null
  mensagemPublica: String | null
```

- `valor` deriva do `valorEsperado` da referencia atual; ausencia vira `null`, nunca zero.
- `atualizadoEm` = `dataModificacao` da fonte que determinou o status vencedor (referencia ou
  recebimento), nunca `dataCriacao`.
- `mensagemPublica` e copy publica fixa e sanitizada pelo backend, apenas para `DIVERGENTE` e
  `FALHOU`; demais estados retornam `null`. Nunca expor `motivoDivergencia` bruto.
- O historico liquidado continua vindo de
  `GET /api/v1/cobranca/parcelas/{parcelaId}/recebimentos` (contrato B1 da M-9), nao e duplicado
  aqui.

#### Mapa de status (interno -> publico)

Fontes: referencia mais recente da parcela (`StatusPixReferenciaRecebimento`, ultima por
`dataCriacao`) e, quando houver, o recebimento mais recente DAQUELA referencia
(`StatusPixRecebimento` buscado por `referenciaId`, nunca o recebimento mais recente da parcela de
forma independente). Precedencia (primeira regra que casar vence):

```text
referencia CANCELADA                                  -> CANCELADO
referencia EXPIRADA                                   -> EXPIRADO
referencia DIVERGENTE | recebimento NAO_IDENTIFICADO  -> DIVERGENTE
recebimento FALHOU                                    -> FALHOU
referencia PAGA | recebimento CONCILIADO              -> LIQUIDADO
recebimento RECEBIDO | EM_PROCESSAMENTO               -> EM_PROCESSAMENTO
referencia ATIVA (default)                            -> AGUARDANDO
```

### P3 - Status Pix da operacao financiada da credora

```http
GET /api/v1/credores/carteira/{operacaoId}/pix
```

#### Autorizacao

- Usuario autenticado com credora presente (`isAuthenticated()` + presenca em
  `EmpresaCredoraRepository.findByUsuarioId`); nao criar role `CREDORA`.
- Operacao da propria carteira com desembolso Pix existente: `200`.
- Usuario sem credora, operacao de outra credora, operacao inexistente, ou sem desembolso Pix:
  `404` neutro.
- Erro nunca inclui UUID e nao diferencia alheio de inexistente.
- O GET nao usa provider, conciliacao, step-up e nao altera estado.

#### Resposta

```text
PixOperacaoCredoraResponse
  status: StatusPixPublico
  valor: BigDecimal
  atualizadoEm: OffsetDateTime
```

- Mesmo mapa de status do P1 (transferencia `StatusPixTransferencia` -> `StatusPixPublico`),
  resolvido pela operacao -> `contratoId` -> transferencia mais recente (ultima por `dataCriacao`,
  sem filtro de status); `atualizadoEm` = `dataModificacao`.

## Enums publicos

Novos value objects publicos no modulo `pix`, nunca reutilizando enums/DTOs operacionais:

```text
StatusPixPublico
  EM_PROCESSAMENTO | LIQUIDADO | FALHOU | CANCELADO

StatusPixParcelaPublico
  AGUARDANDO | EM_PROCESSAMENTO | LIQUIDADO | DIVERGENTE | FALHOU | EXPIRADO | CANCELADO
```

O P3 vive no modulo `credores` e consome o status Pix por porta consumer-driven; o valor publico
cruza a fronteira como `String` (nome do enum), para credores nao importar o dominio de `pix`.

## Campos e capacidades proibidos

Em qualquer das tres respostas:

- chave Pix (completa ou mascarada), `txid`, `endToEndId`, `externalId`.
- IDs internos de transferencia, referencia, recebimento ou movimentacao escrow.
- `providerIndisponivel`, correlation id, motivo tecnico bruto ou payload de provider/webhook.
- dados cadastrais ou identificadores do tomador na jornada da credora.
- justificativa/observacao operacional.
- qualquer comando: iniciar, cancelar, reprocessar, conciliar, gerar referencia, baixar parcela.

## Escopo

### Em escopo

- Tres GETs read-only owner-scoped (P1, P2, P3) com ownership validada antes de qualquer revelacao.
- Dois enums publicos e DTOs REST dedicados; mappers explicitos interno -> publico.
- Portas de leitura minimas: parcela -> tomador (P2) e status Pix por contrato para credora (P3).
- Metodos de consulta derivados por `contratoId`/`parcelaId` no repositorio quando faltarem.
- Testes de ownership, nao-enumeracao, cada estado publico, ausencia de Pix e ausencia de side
  effect.
- Atualizar OpenAPI, `PIX.md`, collection e a secao de Gates do step 211.

### Fora de escopo

- Liberar qualquer rota operacional das Sprints 19-21 a `CLIENTE`.
- Gerar referencia, Pix copia-cola, iniciar/cancelar/reprocessar desembolso, conciliar ou baixar
  parcela.
- Consultar provider sob demanda; qualquer chamada Celcoin.
- Novo status, evento de dominio, auditoria, step-up, lock ou migration.
- Painel financeiro/backoffice, webhook ou gestao de chaves.
- Qualquer mudanca no mobile (fica na M-11) ou nova role.

## Tasks de implementacao

1. P1: enum `StatusPixPublico`, mapper, finder sem filtro por contrato, use case owner-scoped, DTO
   e endpoint.
2. P2: enum `StatusPixParcelaPublico`, porta parcela -> tomador, finder de referencia por parcela +
   recebimento por `referenciaId`, mapper de precedencia, use case, DTO e endpoint.
3. P3: porta consumer-driven de status Pix por contrato, use case credora owner-scoped, DTO e
   endpoint na carteira.
4. Testes de integracao reais (auth, ownership, roles internas, ordenacao, payload minimo,
   fronteiras entre modulos) e regressao dos endpoints operacionais.
5. OpenAPI, `PIX.md`, collection, atualizacao dos Gates do step 211 e fechamento.

## Gates que nao contam como task

- Confirmar Sprints 19-21, 17 e 25 integradas em `develop`.
- Confirmar que os endpoints operacionais permanecem restritos e intocados.
- Rodar baseline `./gradlew check`.
- Confirmar ownership antes de qualquer leitura Pix nos tres contratos.
- Checkpoint e PR description da Sprint 26.

## Definition of Done

- Tomador le apenas desembolso do proprio contrato e Pix da propria parcela.
- Credora le apenas Pix de operacao da propria carteira.
- Nenhuma rota operacional foi liberada a `CLIENTE`; endpoints internos intocados.
- Nenhum DTO/enum operacional foi reutilizado.
- `404` neutro nao diferencia recurso alheio de inexistente e nao vaza UUID.
- Nenhum campo proibido aparece em resposta, log ou OpenAPI.
- GETs permanecem read-only, sem step-up, evento, auditoria ou mutacao.
- Cada estado publico e coberto por teste; ownership e ausencia de side effect comprovadas.
- Testes de integracao cobrem auth real, owner/nao-owner, roles internas, ordenacao e payload.
- OpenAPI, `PIX.md`, collection e a secao de Gates do step 211 atualizados com paths, DTOs, enums
  e status HTTP finais.
- `./gradlew check` e `bootJar` verdes.
- Apos merge em `develop`, os Gates P1-P3 da M-Sprint 11 ficam documentalmente fechados.
