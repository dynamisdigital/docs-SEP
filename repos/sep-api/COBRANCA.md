# COBRANCA - sep-api

Documento operacional do modulo `cobranca` (Epic 8 parte 1).
Sprint 12 — implementada: parcelas, agenda, recebimento manual, escrow, job de atraso e audit reforcado.

> Spec: [`012-sprint-12-cobranca-parcelas-agenda.md`](../../specs/fase-2/012-sprint-12-cobranca-parcelas-agenda.md).
> Steps: [`012-sprint-12-steps.md`](../../steps-fase-2/backend/012-sprint-12-steps.md).
> Dependencia: [`CONTRATOS.md`](./CONTRATOS.md), especialmente `ContratoAssinadoEvent`.

## Objetivo

Pos-formalizacao (contrato `ASSINADO`), o sistema gera uma agenda de pagamento, persiste parcelas planejadas, registra recebimento manual via API REST pelo financeiro, atualiza status da parcela, registra entrada segregada no `escrow` (Resolucao CMN 4.656/2018), publica eventos consumidos pelo audit log e expoe a base que Sprint 13 (inadimplencia) consumira.

Pix, boleto e conciliacao automatica nao entram. Recebimento eh manual por API, usado pelo financeiro apos confirmacao off-band do pagamento.

## Fluxo end-to-end implementado

```text
ContratoAssinadoEvent (Sprint 11)
  -> ContratoAssinadoListener do modulo cobranca
     (@TransactionalEventListener AFTER_COMMIT + @Transactional REQUIRES_NEW)
  -> GerarAgendaPagamentoUseCase
     - resolve dados estruturados via PropostaCobrancaQueryPort
       (taxa preferida da proposta; fallback config com log warn)
     - AmortizacaoDispatcher seleciona Price (default Sprint 12) ou SAC
     - cria AgendaPagamento 1:1 com contrato + N parcelas
     - idempotencia dupla: findByContratoId pre-save + DataIntegrityViolation
       em corrida concorrente (UNIQUE contrato_id)
     - publica AgendaGeradaEvent apenas pra agenda nova
     - TransactionTemplate isolado: tx de write separada da tx de retry
       (evita "current transaction is aborted" no PostgreSQL)

GET /api/v1/cobranca/contratos/{contratoId}/agenda
  -> owner ou FINANCEIRO/ADMIN
  -> ConsultarAgendaPorContratoUseCase

GET /api/v1/cobranca/parcelas/{id}
  -> owner ou FINANCEIRO/ADMIN
  -> CalcularValorAtualizadoParcelaUseCase
     - cliente nao-owner recebe 403 unificado (sem enumerar 404 vs 403)
     - composicao original + mora pro-rata + multa one-shot
     - usa Clock injetado (testes deterministicos)

POST /api/v1/cobranca/parcelas/{id}/recebimentos
  -> FINANCEIRO/ADMIN + Idempotency-Key obrigatoria (pattern [A-Za-z0-9._-]{1,100})
  -> RegistrarRecebimentoUseCase
     - idempotencia em 3 camadas: pre-lock + pos-lock + UNIQUE DB
     - valida consistencia da key (parcelaId + valorRecebido)
     - lock pessimista em ParcelaCobranca (findByIdForUpdate)
     - calcula valorDevidoAtualizado contra parcela lockada
     - persiste Recebimento e atualiza status (PAGA / PARCIALMENTE_PAGA)
     - RegistrarMovimentacaoEscrowPort -> escrow use case publico
     - publica RecebimentoRegistradoEvent + ParcelaPagaEvent (se transicionou)

MarcarParcelaAtrasadaJob
  -> @Scheduled cron default 02:00 America/Sao_Paulo
  -> PENDENTE vencida vira ATRASADA
  -> publica ParcelaAtrasouEvent (consumido por CobrancaAuditListener
     e pela Sprint 13 - inadimplencia)
```

## Entidades

- `AgendaPagamento` (agregado raiz, `extends EntidadeAuditavel`): 1:1 com `Contrato` (`UNIQUE contrato_id`). Campos: `id`, `contratoId`, `numeroParcelas`, `valorTotal`, `dataGeracao`, `parcelas`. Factory `criar(contratoId, List<ParcelaPlanejada>)` valida lista nao vazia + numeros unicos + total derivado HALF_UP escala 2.
- `ParcelaCobranca`: sub-entidade da agenda, sem audit fields proprios (alinhado a `VersaoContrato`/`ParecerCredito` do projeto). Composicao persistida em 4 colunas BigDecimal (`principal`, `juros`, `multa`, `encargos`); total derivado em runtime via `valorTotal()`. `registrarRecebimento(valor, valorDevidoAtualizado, ...)` exige o total devido bruto pra decidir status. Status decide contra `totalRecebido >= valorDevidoAtualizado`.
- `Recebimento`: registro de pagamento manual, `Idempotency-Key UNIQUE global`, `valorRecebido > 0`. `registradoPor` referencia operador FINANCEIRO (UUID, padrao `parecerista_id` da V14).

## Status de parcela

```text
PENDENTE          -> PARCIALMENTE_PAGA | PAGA | ATRASADA
PARCIALMENTE_PAGA -> PARCIALMENTE_PAGA | PAGA
ATRASADA          -> PARCIALMENTE_PAGA | PAGA | INADIMPLENTE (Sprint 13)
PAGA              = final
INADIMPLENTE      = reservado Sprint 13 — nao permite recebimento nesta sprint
```

Helpers em `StatusParcela`: `isFinal()`, `permiteRecebimento()` (PAGA e INADIMPLENTE retornam false), `permiteMarcarAtrasada()` (so PENDENTE).

## Calculadoras e parametros

Strategy GoF aplicado (2 exemplares — ADR design-patterns aceita):

- `CalculadoraPrice` (default Sprint 12): formula PV*i/(1-(1+i)^-n); taxa zero distribui PV/n; juros decrescentes, amortizacao crescente; residual no principal da ultima parcela.
- `CalculadoraSAC`: amortizacao constante = PV/n; juros + parcela total decrescentes; residual na ultima.
- `CalculadoraJurosMora`: pro rata die `valorBase * taxaMensal * diasAtraso / 30`. Zero quando `dataReferencia <= dataVencimento`.
- `CalculadoraMulta`: one-shot `valorBase * percentual`. Zero sem atraso.
- `AmortizacaoDispatcher`: EnumMap roteia pelo `SistemaAmortizacao` em `ParametrosCalculo`; detecta duplicatas no construtor.

Parametros (`ParametrosCobrancaProperties` `@ConfigurationProperties("app.cobranca")` + `@Validated`):

```yaml
app:
  cobranca:
    amortizacao-default: PRICE
    primeira-parcela-dias: 30
    periodicidade-dias: 30
    juros-mora-mensal: 0.01
    multa-atraso: 0.02
    taxa-juros-mensal-default: 0.02   # fallback quando proposta sem taxa
    job-atraso-cron: "0 0 2 * * *"
    auto-geracao-pos-assinatura: true # @ConditionalOnProperty matchIfMissing
    scheduling-habilitado: true       # @ConditionalOnProperty matchIfMissing
```

Regras monetarias:

- `BigDecimal` em todos os calculos; `MathContext.DECIMAL128` intermediario; HALF_UP escala 2 final.
- Residual no principal da ultima parcela fecha soma com `valorFinanciado`.
- `valorDevidoAtualizado` no result eh **total bruto** (`composicao + mora + multa`); `valorEmAberto` eh saldo apos `totalRecebido`, clampado em zero.

## Recebimento manual

Endpoint `POST /api/v1/cobranca/parcelas/{id}/recebimentos`:

- `ROLE_FINANCEIRO/ADMIN`.
- Header `Idempotency-Key` obrigatorio, pattern `[A-Za-z0-9._-]{1,100}`. Ausente -> 400 (handler shared); invalido -> 400 (`ValidacaoException` COB-400-001).
- Body validado por Bean Validation: `valorRecebido >= 0.01`, `dataRecebimento` `OffsetDateTime` obrigatorio, `meioPagamento` NotBlank ate 40 chars, `identificadorExterno`/`observacao` opcionais.
- Idempotencia em 3 camadas:
  1. **Pre-lock**: `findByIdempotencyKey` antes do lock. Reapresentacao retorna o recebimento existente sem criar novo.
  2. **Pos-lock**: re-check apos `findByIdForUpdate` cobre corrida entre threads concorrentes com a mesma key.
  3. **UNIQUE constraint**: `recebimento.idempotency_key UNIQUE` global eh defesa final.
- Validacao de consistencia (`ChaveIdempotenciaConflitanteException` COB-409-002): reapresentacao com `parcelaId` ou `valorRecebido` divergente lanca conflito em vez de retornar o antigo.
- Transicao: `totalRecebido >= valorDevidoAtualizado` -> `PAGA`; `> 0 < valorDevido` -> `PARCIALMENTE_PAGA`.
- Overpayment: parcela vira `PAGA`; excedente fica no `observacao`; tratamento financeiro detalhado fica pra Sprint futura.
- Nova key em parcela `PAGA` -> 409 (`ParcelaEstadoInvalidoException` COB-409-001).

## Integracao com escrow

Sprint 12 entrega versao local da segregacao patrimonial (CMN 4.656/2018 + ADR 0005). Sprint Epic 15 substituira por Celcoin via `EscrowProvider`.

Arquitetura (ADR 0007):

- `cobranca/application/port/out/RegistrarMovimentacaoEscrowPort` (interface).
- `cobranca/infrastructure/adapter/escrow/EscrowMovimentacaoAdapter` (impl) delega ao use case publico do escrow.
- `escrow/application/usecase/RegistrarMovimentacaoEscrowUseCase` (`@Transactional`):
  - lazy create de `ContaEscrow` tecnica `titular="SEP-COBRANCA"` (UNIQUE V28).
  - lazy create de `Wallet` por proposta (UNIQUE PARCIAL `wallet(proposta_id) WHERE proposta_id IS NOT NULL` V28).
  - Race em UNIQUE: sub-tx `TransactionTemplate REQUIRES_NEW` aborta isoladamente; tx principal re-busca o vencedor.
  - `MovimentacaoEscrow` nasce `LIQUIDADA` (sem Pix); `external_reference_id` correlaciona com `recebimento.id` (V27).
  - Publica `MovimentacaoEscrowCriadaEvent` (consumido por `CobrancaAuditListener`).

## Endpoints implementados

| Metodo | Path | Auth | Notas |
|--------|------|------|-------|
| `GET` | `/api/v1/cobranca/contratos/{contratoId}/agenda` | owner ou `ROLE_FINANCEIRO/ADMIN` | resolve tomadorId via `ContratoCobrancaQueryPort` |
| `GET` | `/api/v1/cobranca/parcelas/{id}` | owner ou `ROLE_FINANCEIRO/ADMIN` | retorna valor atualizado com mora/multa pro-rata contra Clock; CLIENTE alheio 403 unificado mesmo se parcela inexistir |
| `POST` | `/api/v1/cobranca/parcelas/{id}/recebimentos` | `ROLE_FINANCEIRO/ADMIN` | `Idempotency-Key` pattern obrigatorio |
| `GET` | `/api/v1/cobranca/recebimentos` | `ROLE_FINANCEIRO/ADMIN` | listagem `dataRecebimento DESC` com `@EntityGraph` (anti N+1); sem paginacao na Sprint 12 |

OpenAPI completo: `@Tag(cobranca)` + `@Operation`/`@ApiResponses`/`@Schema` em todos. `ApiExceptionHandler` shared estendido com `MissingRequestHeaderException` -> 400.

## Auditoria implementada

`CobrancaAuditListener` (`@TransactionalEventListener AFTER_COMMIT + @Transactional REQUIRES_NEW`) grava `audit_log_seguranca` com 6 tipos (V29):

```text
AGENDA_GERADA              — 1x por agenda nova (tomadorId)
PARCELA_CRIADA             — N x por agenda (uma por parcela; tomadorId)
RECEBIMENTO_REGISTRADO     — 1x por recebimento (registradoPor)
PARCELA_PAGA               — quando parcela transiciona pra PAGA
PARCELA_ATRASADA           — quando job marca PENDENTE -> ATRASADA
MOVIMENTACAO_ESCROW_CRIADA — escrow registra entrada segregada
```

Dados permitidos: IDs, valor, status, datas, meioPagamento (string controlada).
Dados proibidos: dados bancarios (conta, agencia), documento pessoal (CPF/CNPJ), payload bruto de provider futuro.

Retencao alinhada com contratos (10 anos — CMN 4.656/2018 + LGPD).

## Migrations Flyway

| Versao | Descricao |
|--------|-----------|
| V25 | Cria `agenda_pagamento`, `parcela_cobranca`, `recebimento`. FKs sem CASCADE. UNIQUE `contrato_id` e `idempotency_key`. CHECK `principal > 0`. |
| V26 | Adiciona `proposta_credito.taxa_juros_mensal NUMERIC(8,6) NULL` + CHECK `>= 0`. Placeholder ate sprint futura popular explicitamente. |
| V27 | Adiciona `movimentacao_escrow.external_reference_id UUID NULL` + index parcial. Correlaciona movimentacao com `recebimento.id`. |
| V28 | UNIQUE em `conta_escrow.titular` + UNIQUE PARCIAL em `wallet(proposta_id) WHERE proposta_id IS NOT NULL`. Resolve race em criacao lazy concorrente. |
| V29 | DROP+ADD `chk_audit_seguranca_tipo` com 6 tipos da cobranca. |

## Testes

100+ testes na sprint:

- **Dominio**: `AgendaPagamentoTest`, `ParcelaCobrancaTest`, `RecebimentoTest`, `StatusParcelaTest`, `ComposicaoValorTest`.
- **Calculadoras**: `CalculadoraPriceTest` (7), `CalculadoraSACTest` (6), `CalculadoraJurosMoraTest` (6), `CalculadoraMultaTest` (4), `AmortizacaoDispatcherTest` (3).
- **Use cases**: `GerarAgendaPagamentoUseCaseTest` (4), `RegistrarRecebimentoUseCaseTest` (10), `CalcularValorAtualizadoParcelaUseCaseTest` (5), `ConsultarParcelasUseCaseTest` (4), `RegistrarMovimentacaoEscrowUseCaseTest` (3 — escrow).
- **Listeners**: `ContratoAssinadoListenerTest` (4), `CobrancaAuditListenerTest` (6).
- **Job**: `MarcarParcelaAtrasadaJobTest` (3).
- **Web**: `CobrancaControllerTest` `@WebMvcTest` (14 cenarios).
- **IT**: `CobrancaIT` `@SpringBootTest` RANDOM_PORT (10 cenarios E2E incluindo audit log).

## Limitacoes conhecidas / pendencias futuras

- **Recebimento manual** apenas. Automacao por Pix fica pra Epic 15 (Celcoin).
- **Sem boleto**, sem renegociacao, sem cobranca ativa. Sprint 13 consome `ParcelaAtrasouEvent` pra inadimplencia.
- **IOF/CET completo** + memoria juridica de encargos: precisam refinamento antes producao.
- **Overpayment**: tratamento minimo (parcela vira PAGA + observacao).
- **Taxa juros mensal** com fallback de config: PRD §22 deve registrar pendencia pra Sprint futura popular `proposta_credito.taxa_juros_mensal` explicitamente antes da assinatura.
- **`MarcarParcelaAtrasadaJob` single-instance**: Epic 15 AWS multi-instance requer ShedLock ou advisory lock PostgreSQL.
- **`GET /recebimentos` sem paginacao**: Sprint 13 ou Epic 15 adicionar `Pageable` + filtros (contratoId, intervalo).
- **`RecebimentoResponse.movimentacaoEscrowId` null** em listagem em massa (evita N+1 join). POST recebimento preenche o id.
- **Test `payload_naoVazaDadosBancariosOuPessoais`** usa blacklist de substrings — schema validation completa em sprint de hardening.

## Referencias

- [Spec 012](../../specs/fase-2/012-sprint-12-cobranca-parcelas-agenda.md)
- [Steps Sprint 12](../../steps-fase-2/backend/012-sprint-12-steps.md)
- [CONTRATOS.md](./CONTRATOS.md)
- [ADR 0001 - Monolito modular orientado a DDD](../../adr/0001-monolito-modular-orientado-a-ddd.md)
- [ADR 0005 - Segregacao patrimonial via conta escrow](../../adr/0005-segregacao-patrimonial-via-conta-escrow.md)
- [ADR 0007 - DDD com Hexagonal Ports and Adapters por modulo](../../adr/0007-ddd-com-hexagonal-ports-and-adapters-por-modulo.md)
- Resolucao CMN 4.656/2018
- CDC Lei 8.078/1990 §52
