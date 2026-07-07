# COBRANCA - sep-api

Documento operacional do modulo `cobranca` (Epic 8).
Sprint 12 — implementada: parcelas, agenda, recebimento manual, escrow, job de atraso e audit reforcado.
Sprint 13 — implementada na branch: inadimplencia, workflow de cobranca, notificacoes, renegociacao basica e auditoria reforcada.
Sprint 23 — mergeada em `develop` (PR #81) e promovida a `main` (PR #82): consulta owner-scoped do historico de recebimentos do tomador (B1 da M-Sprint 9). Sprint 24 — mergeada em `develop` (PR #83, squash `2a41c51`) e promovida a `main` (PR #84, `eaaa365`): consulta owner-scoped da renegociacao ativa do tomador (B2 da M-Sprint 9).

> Specs: [`012-sprint-12-cobranca-parcelas-agenda.md`](../../specs/fase-2/012-sprint-12-cobranca-parcelas-agenda.md) e [`013-sprint-13-cobranca-inadimplencia.md`](../../specs/fase-2/013-sprint-13-cobranca-inadimplencia.md).
> Steps: [`012-sprint-12-steps.md`](../../steps-fase-2/backend/012-sprint-12-steps.md) e [`013-sprint-13-steps.md`](../../steps-fase-2/backend/013-sprint-13-steps.md).
> Dependencia: [`CONTRATOS.md`](./CONTRATOS.md), especialmente `ContratoAssinadoEvent`.

## Objetivo

Pos-formalizacao (contrato `ASSINADO`), o sistema gera agenda de pagamento, persiste parcelas planejadas, registra recebimento manual via API REST pelo financeiro, atualiza status da parcela, registra entrada segregada no `escrow` (Resolucao CMN 4.656/2018), trata atraso/inadimplencia, executa workflow de cobranca, registra contatos manuais e permite renegociacao basica com agenda substituta.

Pix, boleto e conciliacao automatica nao entram. Recebimento eh manual por API, usado pelo financeiro apos confirmacao off-band do pagamento. Comunicacoes de cobranca usam Provider Pattern com SMTP/Zenvia em ambientes reais e `LogNotificationProvider` em dev/test.

> Pix (Epic 15): a Sprint 19 criou a fundacao do modulo `pix` (ver [`PIX.md`](PIX.md)) — webhook recebe e registra `PixRecebimento` inicial, mas **ainda nao concilia** parcela de cobranca automaticamente. A transicao do recebimento manual para a baixa automatica via Pix fica para as Sprints 20/21.

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
ATRASADA          -> PARCIALMENTE_PAGA | PAGA | EM_NEGOCIACAO | INADIMPLENTE
EM_NEGOCIACAO     -> RENEGOCIADA | ATRASADA | INADIMPLENTE
PAGA              = final
INADIMPLENTE      -> EM_NEGOCIACAO
RENEGOCIADA       = final operacional da parcela substituida
```

Helpers em `StatusParcela`: `isFinal()`, `permiteRecebimento()` (PAGA, INADIMPLENTE, EM_NEGOCIACAO e RENEGOCIADA retornam false), `permiteMarcarAtrasada()` (so PENDENTE) e validacoes de renegociacao/inadimplencia nos use cases.

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

> **Baixa automatica via Pix (Sprint 21)**: o modulo `pix` baixa a parcela pelo mesmo `RegistrarRecebimentoUseCase`, via `CobrancaRecebimentoPixPort` -> `CobrancaRecebimentoPixAdapter` (o `pix` nunca toca entidades/repositorios de `cobranca`). `meioPagamento=PIX`, `registradoPor=tomadorId`, `Idempotency-Key=pix:<endToEndId>` — herdando a idempotencia em 3 camadas + a movimentacao escrow unica. Pagamento parcial/maior segue a mesma regra de status; a divergencia eh sinalizada e tratada no lado `pix`/backoffice (ver [`PIX.md`](PIX.md) §Recebimento), sem regra nova em `cobranca`.

## Inadimplencia e workflow de cobranca

Sprint 13 consome `ParcelaAtrasouEvent` publicado pelo job da Sprint 12 e aplica um workflow configuravel por `app.cobranca.workflow.dias-atraso`. Cada etapa pode emitir notificacoes por canal/template e sinalizar flags operacionais.

Fluxo operacional:

```text
MarcarParcelaAtrasadaJob
  -> PENDENTE vencida vira ATRASADA
  -> publica ParcelaAtrasouEvent
  -> ParcelaAtrasouListener chama EscalarCobrancaUseCase no dia 0

EscaladorCobrancaJob
  -> @Scheduled cron default 03:00 America/Sao_Paulo
  -> reavalia parcelas ATRASADA
  -> executa etapa exata do workflow para dias de atraso 5, 15, 30, 60, 90

MarcarParcelaInadimplenteJob
  -> @Scheduled cron default 02:30 America/Sao_Paulo
  -> ATRASADA com 90+ dias vira INADIMPLENTE
  -> publica ParcelaInadimplenteEvent e registra EventoCobranca
```

Workflow default:

| Dia | Acoes | Flags |
|-----|-------|-------|
| 0 | `email-amigavel` | - |
| 5 | `email-amigavel`, `sms-lembrete` | - |
| 15 | `email-firme`, `sms-firme` | - |
| 30 | `email-firme`, `sms-firme` | `flag-contato-manual=true` |
| 60 | `email-final` | `escalonar-backoffice=true` |
| 90 | `email-final`, `sms-firme` | `marcar-inadimplente=true` |

Idempotencia de notificacao: `EventoCobrancaRepository.existsByParcelaIdAndDiasAtrasoAndCanalAndTemplate` evita reenvio da mesma notificacao; a migration V30 adiciona unique parcial para reforco no banco. Cada tentativa gera `EventoCobranca` com `canal`, `template`, `status`, `diasAtraso` e mensagem tecnica sem corpo sensivel.

## Eventos de cobranca

`EventoCobranca` representa historico operacional, nao mensagem completa. Tipos atuais:

- `NOTIFICACAO_AUTOMATICA`: tentativa de envio por workflow.
- `CONTATO_MANUAL`: registro feito por financeiro/admin via API.
- `PARCELA_INADIMPLENTE`: marco de transicao para inadimplencia.

O endpoint `POST /api/v1/cobranca/parcelas/{id}/contato` nao altera status da parcela. Ele registra descricao operacional limitada e publica evento para auditoria.

## Renegociacao basica

Renegociacao nasce a partir de parcela `ATRASADA` ou `INADIMPLENTE`. O fluxo eh:

```text
FINANCEIRO/ADMIN + step-up
  -> POST /parcelas/{id}/renegociacao
  -> cria Renegociacao(PROPOSTA)
  -> parcela original vira EM_NEGOCIACAO
  -> notifica tomador por email/SMS

Tomador + ownership + step-up
  -> PATCH /renegociacoes/{id}/aceite
  -> Renegociacao(ACEITA)
  -> parcela original vira RENEGOCIADA
  -> cria AgendaPagamento substituta ativa
  -> agenda original fica inativa

Tomador + ownership (sem step-up — recusa nao gera obrigacao financeira)
  -> PATCH /renegociacoes/{id}/recusa
  -> Renegociacao(RECUSADA)
  -> parcela volta ao status anterior (ATRASADA ou INADIMPLENTE)

ExpirarRenegociacaoJob
  -> PROPOSTA vencida apos 7 dias vira EXPIRADA
  -> parcela volta ao status anterior
```

Aceite exige step-up porque cria nova obrigacao financeira. Recusa nao exige step-up porque apenas rejeita a proposta e reverte status. A agenda substituta usa `agenda_substituida_id` (V31) para manter a cadeia auditavel.

**Descoberta pelo tomador (Sprint 24 — B2 da M-Sprint 9)**: antes de decidir, o tomador le os termos via `GET /parcelas/{parcelaId}/renegociacao-ativa` (owner-scoped). O `ConsultarRenegociacaoAtivaTomadorUseCase` valida ownership antes de revelar a proposta (mesma `CobrancaOwnershipException` generica sem UUID do B1), retorna apenas `PROPOSTA` ainda nao expirada pelo `Clock` (proposta vencida antes do job sai como 404) e calcula `valorTotalRenegociado = novoValorParcela * numeroParcelas` com `BigDecimal`. O `RenegociacaoTomadorResponse` nao expoe `justificativa`, operador, IDs de agenda nem `statusParcelaAnterior`. GET read-only, sem step-up, sem mutacao — os PATCHes de aceite/recusa seguem inalterados.

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
| `GET` | `/api/v1/cobranca/recebimentos` | `ROLE_FINANCEIRO/ADMIN` | listagem `dataRecebimento DESC` com `@EntityGraph` (anti N+1); sem paginacao |
| `GET` | `/api/v1/cobranca/parcelas/{parcelaId}/recebimentos` | `ROLE_CLIENTE` (owner) | Sprint 23: historico owner-scoped do tomador em `CobrancaTomadorController` dedicado; `RecebimentoTomadorResponse[]` (4 campos publicos) ordenado `dataRecebimento DESC`; parcela inexistente ou de outro tomador retorna 403 uniforme sem UUID (anti-enumeracao) |
| `GET` | `/api/v1/cobranca/inadimplencia` | `ROLE_FINANCEIRO/ADMIN` | filtros `dias_atraso_min`, `dias_atraso_max`, `status`; retorna ATRASADA/INADIMPLENTE |
| `POST` | `/api/v1/cobranca/parcelas/{id}/contato` | `ROLE_FINANCEIRO/ADMIN` | registra `EventoCobranca CONTATO_MANUAL`; nao muda status |
| `POST` | `/api/v1/cobranca/parcelas/{id}/renegociacao` | `ROLE_FINANCEIRO/ADMIN` + step-up | cria proposta, parcela vira EM_NEGOCIACAO; conflito se proposta ativa |
| `PATCH` | `/api/v1/cobranca/renegociacoes/{id}/aceite` | tomador owner + step-up | aceita proposta, cria agenda substituta, parcela vira RENEGOCIADA |
| `PATCH` | `/api/v1/cobranca/renegociacoes/{id}/recusa` | tomador owner | recusa proposta, parcela volta ao status anterior |
| `GET` | `/api/v1/cobranca/parcelas/{parcelaId}/renegociacao-ativa` | `ROLE_CLIENTE` (owner) | Sprint 24: termos da renegociacao ativa (PROPOSTA nao expirada pelo Clock) em `CobrancaTomadorController`; `RenegociacaoTomadorResponse` (10 campos publicos, `valorTotalRenegociado` calculado no backend); read-only, sem step-up; 404 sem proposta ativa; 403 uniforme sem UUID para parcela inexistente/alheia |

OpenAPI/Swagger UI: tag `cobranca` atualizada para Sprints 12/13, DTOs com `@Schema` e endpoints documentados com `@Operation`/`@ApiResponses`. `ApiExceptionHandler` shared cobre header ausente, ownership, validacao, conflitos e entidades nao encontradas.

## Auditoria implementada

`CobrancaAuditListener` (`@TransactionalEventListener AFTER_COMMIT` + `@Transactional REQUIRES_NEW`) grava `audit_log_seguranca` com tipos da Sprint 12 (V29) e Sprint 13 (V32):

```text
AGENDA_GERADA                  - 1x por agenda nova (tomadorId)
PARCELA_CRIADA                 - N x por agenda (uma por parcela; tomadorId)
RECEBIMENTO_REGISTRADO         - 1x por recebimento (registradoPor)
PARCELA_PAGA                   - quando parcela transiciona pra PAGA
PARCELA_ATRASADA               - quando job marca PENDENTE -> ATRASADA
MOVIMENTACAO_ESCROW_CRIADA     - escrow registra entrada segregada
NOTIFICACAO_ENVIADA            - tentativa de notificacao entregue/registrada
EVENTO_COBRANCA_REGISTRADO     - evento operacional de cobranca
PARCELA_INADIMPLENTE           - transicao para INADIMPLENTE
RENEGOCIACAO_PROPOSTA          - financeiro/admin criou proposta
RENEGOCIACAO_ACEITA            - tomador aceitou proposta
RENEGOCIACAO_RECUSADA          - tomador recusou proposta
RENEGOCIACAO_EXPIRADA          - job expirou proposta vencida
```

Dados permitidos: IDs, valor, status, datas, meioPagamento (string controlada), canal, template, status tecnico e dias de atraso.
Dados proibidos: dados bancarios (conta, agencia), documento pessoal (CPF/CNPJ), payload bruto de provider e corpo completo de notificacao.

Retencao alinhada com contratos (10 anos — CMN 4.656/2018 + LGPD).

## Migrations Flyway

| Versao | Descricao |
|--------|-----------|
| V25 | Cria `agenda_pagamento`, `parcela_cobranca`, `recebimento`. FKs sem CASCADE. UNIQUE `contrato_id` e `idempotency_key`. CHECK `principal > 0`. |
| V26 | Adiciona `proposta_credito.taxa_juros_mensal NUMERIC(8,6) NULL` + CHECK `>= 0`. Placeholder ate sprint futura popular explicitamente. |
| V27 | Adiciona `movimentacao_escrow.external_reference_id UUID NULL` + index parcial. Correlaciona movimentacao com `recebimento.id`. |
| V28 | UNIQUE em `conta_escrow.titular` + UNIQUE PARCIAL em `wallet(proposta_id) WHERE proposta_id IS NOT NULL`. Resolve race em criacao lazy concorrente. |
| V29 | DROP+ADD `chk_audit_seguranca_tipo` com 6 tipos da cobranca Sprint 12. |
| V30 | Cria `workflow_cobranca`, `evento_cobranca`, `renegociacao`, indices e unique parcial para idempotencia de notificacoes. |
| V31 | Adiciona `agenda_pagamento.agenda_substituida_id` para agenda substituta de renegociacao. |
| V32 | Amplia `chk_audit_seguranca_tipo` com tipos de inadimplencia e renegociacao. |

## Testes

Suite de cobranca/inadimplencia:

- **Dominio**: `AgendaPagamentoTest`, `ParcelaCobrancaTest`, `RecebimentoTest`, `StatusParcelaTest`, `ComposicaoValorTest`.
- **Calculadoras**: `CalculadoraPriceTest`, `CalculadoraSACTest`, `CalculadoraJurosMoraTest`, `CalculadoraMultaTest`, `AmortizacaoDispatcherTest`.
- **Use cases Sprint 12**: `GerarAgendaPagamentoUseCaseTest`, `RegistrarRecebimentoUseCaseTest`, `CalcularValorAtualizadoParcelaUseCaseTest`, `ConsultarParcelasUseCaseTest`, `RegistrarMovimentacaoEscrowUseCaseTest`.
- **Use cases/jobs Sprint 13**: `EscalarCobrancaUseCaseTest`, `EscaladorCobrancaJobTest`, `MarcarParcelaInadimplenteJobTest`, `IniciarRenegociacaoUseCaseTest`, `AceitarRenegociacaoUseCaseTest`, `RecusarRenegociacaoUseCaseTest`, `ExpirarRenegociacaoJobTest`.
- **Listeners**: `ContratoAssinadoListenerTest`, `ParcelaAtrasouListenerTest`, `RenegociacaoPropostaListenerTest`, `CobrancaAuditListenerTest`.
- **Web**: `CobrancaControllerTest`, `CobrancaInadimplenciaControllerTest`.
- **IT**: `CobrancaIT`, `InadimplenciaIT`, `RenegociacaoIT`.
- **Consultas owner-scoped do tomador (Sprints 23/24)**: `ConsultarRecebimentosParcelaUseCaseTest`, `ConsultarRenegociacaoAtivaTomadorUseCaseTest`, `CobrancaTomadorControllerTest`, IT `CobrancaTomadorConsultaIT` e os cenarios de renegociacao ativa adicionados ao `RenegociacaoIT` (descoberta -> leitura -> aceite/recusa, expiracao por Clock, ownership e minimizacao do JSON).

Validacoes focadas usadas na Task 13.9: `./gradlew test --tests "*InadimplenciaIT" --tests "*RenegociacaoIT"` e `./gradlew test --tests "*Cobranca*"`.

## Limitacoes conhecidas / pendencias futuras

- **Historico do tomador (Sprint 23 — mergeada em `develop` PR #81 / `main` PR #82)**: `GET /api/v1/cobranca/parcelas/{parcelaId}/recebimentos` exclusivo de `CLIENTE`, com `RecebimentoTomadorResponse` (recebimentoId, valorRecebido, dataRecebimento, meioPagamento), ownership validada no use case e 403 uniforme sem UUID. `GET /recebimentos` segue interno (`FINANCEIRO/ADMIN`). Desbloqueia B1 da M-Sprint 9 (M-9.4 liberada). Sem paginacao (recorte por parcela). Ver [spec](../../specs/fase-3/023-sprint-23-cobranca-historico-tomador.md) + [steps](../../steps-fase-3/backend/023-sprint-23-steps.md).
- **Descoberta da renegociacao (Sprint 24 — mergeada em `develop`, PR #83; promovida a `main`, PR #84)**: `GET /api/v1/cobranca/parcelas/{parcelaId}/renegociacao-ativa` entrega os termos da proposta ativa/nao expirada ao tomador, resolvendo o gap de descoberta antes dos PATCHes ([spec](../../specs/fase-3/024-sprint-24-cobranca-renegociacao-tomador.md) + [steps](../../steps-fase-3/backend/024-sprint-24-steps.md)). Desbloqueou B2 da M-Sprint 9 (M-9.5 liberada).

- **Recebimento manual** apenas. Automacao por Pix fica pra Epic 15 (Celcoin).
- **Sem boleto** e sem conciliacao automatica. Cobranca ativa da Sprint 13 cobre notificacao e contato manual, mas negativacao/juridico ficam fora do escopo.
- **IOF/CET completo** + memoria juridica de encargos: precisam refinamento antes producao.
- **Overpayment**: tratamento minimo (parcela vira PAGA + observacao).
- **Taxa juros mensal** com fallback de config: PRD §22 deve registrar pendencia pra Sprint futura popular `proposta_credito.taxa_juros_mensal` explicitamente antes da assinatura.
- **`GET /recebimentos` sem paginacao**: Epic 15 adicionar `Pageable` + filtros (contratoId, intervalo).
- **Notificacoes reais dependem de credenciais**: `smtp-zenvia` deve falhar rapido sem SMTP/Zenvia configurados; default seguro permanece `log`.
- **Opt-out/LGPD**: `NOTIFICACOES.md` precisa revisao juridica antes de producao.
- **Jobs single-instance**: Epic 15 AWS multi-instance requer ShedLock ou advisory lock para atraso, escalonamento, inadimplencia e expiracao.
- **`RecebimentoResponse.movimentacaoEscrowId` null** em listagem em massa (evita N+1 join). POST recebimento preenche o id.
- **Test `payload_naoVazaDadosBancariosOuPessoais`** usa blacklist de substrings — schema validation completa em sprint de hardening.
- **Use cases injetam Spring Data repositories de `infrastructure.persistence` diretamente** (padrao de todo o modulo `cobranca` — 14/14 use cases, incluindo `ConsultarRenegociacaoAtivaTomadorUseCase` da Sprint 24 e o irmao B1 `ConsultarRecebimentosParcelaUseCase`). O ADR 0007 pediria portas em `application.port.out` para a persistencia propria do modulo; hoje so as dependencias externas/cross-modulo usam porta (`ContratoCobrancaQueryPort`, `PropostaCobrancaQueryPort`, `RegistrarMovimentacaoEscrowPort`, `NotificationProvider`). Divida aceita: a extracao de portas de persistencia deve ser feita module-wide (nao pontual, para nao divergir do padrao existente), em tarefa dedicada ou melhoria de fim-de-fase — nao na Sprint 24, que preserva consistencia com o codigo ja mergeado.

## Referencias

- [Spec 012](../../specs/fase-2/012-sprint-12-cobranca-parcelas-agenda.md)
- [Spec 013](../../specs/fase-2/013-sprint-13-cobranca-inadimplencia.md)
- [Steps Sprint 12](../../steps-fase-2/backend/012-sprint-12-steps.md)
- [Steps Sprint 13](../../steps-fase-2/backend/013-sprint-13-steps.md)
- [NOTIFICACOES.md](./NOTIFICACOES.md)
- [CONTRATOS.md](./CONTRATOS.md)
- [ADR 0001 - Monolito modular orientado a DDD](../../adr/0001-monolito-modular-orientado-a-ddd.md)
- [ADR 0005 - Segregacao patrimonial via conta escrow](../../adr/0005-segregacao-patrimonial-via-conta-escrow.md)
- [ADR 0007 - DDD com Hexagonal Ports and Adapters por modulo](../../adr/0007-ddd-com-hexagonal-ports-and-adapters-por-modulo.md)
- Resolucao CMN 4.656/2018
- CDC Lei 8.078/1990 §52
