# PR — Sprint 12 (Cobranca — parcelas, agenda e recebimentos)

Artefato exigido pela Task 12.9 (steps `012-sprint-12-steps.md`). Conteudo abaixo deve ser
usado ao abrir o PR manualmente (`gh pr create --base develop ...` ou via UI).

## Titulo sugerido

```
feat(cobranca): Sprint 12 — Cobranca parcelas + agenda + escrow + audit (Epic 8 parte 1)
```

## Resumo

- Inicia Epic 8 (Cobranca): apos `ContratoAssinadoEvent` da Sprint 11, gera agenda 1:1 com contrato, persiste parcelas planejadas via Price/SAC, expoe REST pra owner + FINANCEIRO, registra recebimento manual idempotente com Idempotency-Key e dispara movimentacao segregada no escrow.
- Calculadoras financeiras: `CalculadoraPrice` (default) + `CalculadoraSAC` via Strategy GoF + `CalculadoraJurosMora` pro-rata die + `CalculadoraMulta` one-shot. `AmortizacaoDispatcher` (EnumMap) roteia por `SistemaAmortizacao`.
- Idempotencia em 3 camadas no recebimento: pre-lock + pos-lock + UNIQUE DB; validacao de consistencia da `Idempotency-Key` (`parcelaId` + `valorRecebido`) com `ChaveIdempotenciaConflitanteException`.
- Job diario `@Scheduled` marca parcelas `PENDENTE` vencidas como `ATRASADA` e publica `ParcelaAtrasouEvent` (consumido pela Sprint 13 inadimplencia).
- Audit reforcado: `CobrancaAuditListener` grava 6 tipos novos (`AGENDA_GERADA`, `PARCELA_CRIADA`, `RECEBIMENTO_REGISTRADO`, `PARCELA_PAGA`, `PARCELA_ATRASADA`, `MOVIMENTACAO_ESCROW_CRIADA`) em `audit_log_seguranca` apos commit. Dados bancarios e documento pessoal NUNCA entram no audit.
- Segregacao patrimonial: `RegistrarMovimentacaoEscrowUseCase` no modulo `escrow` (publico via porta `RegistrarMovimentacaoEscrowPort`). `ContaEscrow` tecnica `SEP-COBRANCA` + `Wallet` por proposta criadas lazy via `TransactionTemplate REQUIRES_NEW` (corrida resolvida por UNIQUE V28).
- 5 migrations Flyway novas (V25-V29) + 100+ testes (`@WebMvcTest` + `@DataJpaTest` + IT `@SpringBootTest`).

## Escopo tecnico

### Dominio + persistencia

3 entidades em `cobranca/domain/model`:
- `AgendaPagamento` (agregado raiz `extends EntidadeAuditavel`): 1:1 com contrato (`UNIQUE contrato_id`); factory `criar(contratoId, List<ParcelaPlanejada>)` valida nao vazia + numeros unicos + total derivado.
- `ParcelaCobranca`: sub-entidade da agenda (sem audit fields proprios — padrao do projeto). Composicao em 4 BigDecimal colunas; total derivado. `registrarRecebimento(valor, valorDevidoAtualizado, ...)` recebe o devido bruto pra decidir status.
- `Recebimento`: registro manual; `Idempotency-Key UNIQUE` global; `valorRecebido > 0`; `registradoPor UUID` referencia operador (padrao `parecerista_id` da V14).

VO + eventos:
- `StatusParcela` enum (`PENDENTE/PARCIALMENTE_PAGA/PAGA/ATRASADA/INADIMPLENTE`) com helpers `isFinal/permiteRecebimento/permiteMarcarAtrasada`. `INADIMPLENTE` reservado pra Sprint 13.
- `ComposicaoValor` record com `total()` derivado HALF_UP escala 2.
- 4 eventos de dominio (`AgendaGeradaEvent`, `RecebimentoRegistradoEvent`, `ParcelaPagaEvent`, `ParcelaAtrasouEvent`) + `MovimentacaoEscrowCriadaEvent` no `escrow/domain/event`.

Excecoes tipadas:
- `AgendaPagamentoNaoEncontradaException` (COB-404-001)
- `ParcelaCobrancaNaoEncontradaException` (COB-404-002)
- `ParcelaEstadoInvalidoException` (COB-409-001)
- `ChaveIdempotenciaConflitanteException` (COB-409-002)
- `CobrancaOwnershipException` (COB-403-001)

5 migrations:
- `V25__criar_tabelas_cobranca.sql` — 3 tabelas + FKs sem CASCADE + UNIQUE contrato_id + UNIQUE idempotency_key + CHECK `principal > 0`.
- `V26__adicionar_taxa_juros_proposta_credito.sql` — coluna `taxa_juros_mensal NUMERIC(8,6) NULL` na proposta (placeholder ate sprint futura).
- `V27__adicionar_external_reference_movimentacao_escrow.sql` — `movimentacao_escrow.external_reference_id` UUID nullable + index parcial.
- `V28__unique_constraints_escrow.sql` — UNIQUE `conta_escrow.titular` + UNIQUE PARCIAL `wallet(proposta_id) WHERE NOT NULL`. Resolve race em criacao lazy.
- `V29__ampliar_audit_seguranca_tipo_cobranca.sql` — DROP+ADD `chk_audit_seguranca_tipo` com 6 tipos novos.

### Use cases (camada application)

- `GerarAgendaPagamentoUseCase` — disparado por listener AFTER_COMMIT. `TransactionTemplate` write + readOnly isolados (corrige PG "transaction is aborted" em retry). Idempotencia dupla. Consome `PropostaCobrancaQueryPort` (taxa preferida da proposta; fallback `taxaJurosMensalDefault` com log warn).
- `RegistrarRecebimentoUseCase` — `@Transactional` + lock pessimista + idempotencia 3 camadas + validacao consistencia key. Fail-fast em `permiteRecebimento` antes do calculo. Integra escrow via `RegistrarMovimentacaoEscrowPort`.
- `CalcularValorAtualizadoParcelaUseCase` — `@Transactional(readOnly)`, expoe `executar(id)` e `calcular(parcela)` (pra callers com parcela lockada). `resolverContratoId(id)` resolve ownership cedo (evita enumeracao 404 vs 403).
- `ConsultarParcelasUseCase` — filtro stream (contratoId/status/intervalo data); ordenacao default (data ASC + numero ASC).
- `ConsultarAgendaPorContratoUseCase`, `ConsultarRecebimentosUseCase` (com `@EntityGraph(parcela)` anti N+1).

### Ports + adapters (Hexagonal — ADR 0007)

Ports em `cobranca/application/port/out`:
- `PropostaCobrancaQueryPort` + `PropostaCobrancaView` (record).
- `ContratoCobrancaQueryPort` (`propostaIdDoContrato` + `tomadorIdDoContrato`).
- `RegistrarMovimentacaoEscrowPort` (DTO `MovimentacaoEscrowResult`).

Adapters em `cobranca/infrastructure/adapter`:
- `credito/PropostaCobrancaQueryAdapter` delega `PropostaCreditoRepository`.
- `contratos/ContratoCobrancaQueryAdapter` delega `ContratoRepository` + log warn quando contrato inexiste.
- `escrow/EscrowMovimentacaoAdapter` delega `RegistrarMovimentacaoEscrowUseCase` do modulo escrow.

### Escrow

- `RegistrarMovimentacaoEscrowUseCase` no modulo escrow (publico). Lazy create de `ContaEscrow` tecnica + `Wallet` por proposta. `TransactionTemplate REQUIRES_NEW` em sub-tx de create — se UNIQUE V28 disparar `DataIntegrityViolationException`, a tx principal segue viva e re-busca o registro vencedor.
- `MovimentacaoEscrow` nasce `LIQUIDADA` (sem Pix). `external_reference_id` aponta pra `recebimento.id`.
- Factories adicionadas em `ContaEscrow.criar`, `Wallet.criar`, `MovimentacaoEscrow.criarRecebimento`. `Wallet.creditar(valor)` encapsula saldo >= 0.

### Job de atraso

`MarcarParcelaAtrasadaJob` `@Scheduled(cron = "${app.cobranca.job-atraso-cron:0 0 2 * * *}", zone = "America/Sao_Paulo")` + `@Transactional`. Marca PENDENTE vencidas como ATRASADA e publica eventos. Reexecucao nao duplica (filtro PENDENTE).

`CobrancaSchedulingConfig` `@EnableScheduling` + `@ConditionalOnProperty(scheduling-habilitado, matchIfMissing=true)`. `shared/config/ClockConfig` injeta `Clock.system(America/Sao_Paulo)` compartilhado.

Limitacao registrada: single-instance apenas (Epic 15 AWS multi-instance requer ShedLock ou advisory lock PG).

### REST + DTOs + OpenAPI

`CobrancaController` (`/api/v1/cobranca`) com 4 endpoints:
- `GET /contratos/{contratoId}/agenda` — owner ou FIN/ADM.
- `GET /parcelas/{id}` — owner ou FIN/ADM. CLIENTE alheio 403 unificado mesmo se parcela inexistir (anti-enumeracao).
- `POST /parcelas/{id}/recebimentos` — FIN/ADM + `Idempotency-Key` `[A-Za-z0-9._-]{1,100}` (handler shared mapeia `MissingRequestHeaderException` -> 400).
- `GET /recebimentos` — FIN/ADM (listagem `dataRecebimento DESC` com `@EntityGraph(parcela)`).

5 DTOs records com `@Schema` + Bean Validation no request. `CobrancaWebMapper` manual (records simples; sem MapStruct). OpenAPI completo (`@Tag/@Operation/@ApiResponses`).

### Audit reforcado

`CobrancaAuditListener` (`@TransactionalEventListener AFTER_COMMIT + @Transactional REQUIRES_NEW`). Mesma arquitetura do `ContratoAuditListener`/`CreditoAuditListener`. Payload JSON via `ObjectMapper` thread-safe (Spring bean). Test `payload_naoVazaDadosBancariosOuPessoais` valida blacklist de substrings.

`MovimentacaoEscrowCriadaEvent` publicado pelo escrow use case eh consumido pelo listener da cobranca (cross-module via `@TransactionalEventListener`).

### Profile test

`application-test.yml`:
- `app.cobranca.auto-geracao-pos-assinatura: false` (ITs alheios — Contrato/Assinatura/Credito/OpenFinance — nao geram agenda no teardown e evitam FK leak).
- `app.cobranca.scheduling-habilitado: false` (job nao dispara em janela aleatoria).
- `CobrancaIT` reativa ambos via `@DynamicPropertySource`.

## Tests

- Dominio: 5 arquivos / ~22 testes.
- Calculadoras: 5 arquivos / 26 testes.
- Use cases: 5 arquivos / 26 testes (incluindo escrow).
- Listeners: 2 arquivos / 10 testes.
- Job: 1 arquivo / 3 testes.
- Web `@WebMvcTest`: 1 arquivo / 14 testes.
- IT `@SpringBootTest`: 1 arquivo / 10 testes.

**Total cobranca: 100+ testes verdes**. `./gradlew check` BUILD SUCCESSFUL. JaCoCo gate respeitado.

## Como validar

```bash
cd <sep-api-root>
./gradlew check
./gradlew test --tests "*Cobranca*"
./gradlew test --tests "com.dynamis.sep_api.cobranca.web.CobrancaIT"
```

REST manual via Postman/Insomnia collections (atualizadas em `docs-SEP/docs-sep/`):
- `POST /api/v1/usuarios` + `POST /api/v1/auth/login` pra obter token FINANCEIRO.
- Disparar contrato ASSINADO (Sprint 11 fluxo) -> agenda criada automaticamente.
- `GET /api/v1/cobranca/contratos/{contratoId}/agenda` — owner OK; alheio 403.
- `POST /api/v1/cobranca/parcelas/{id}/recebimentos` com `Idempotency-Key: key-1` -> 200 + PAGA.
- Repetir mesma key -> 200 + `novo: false`.
- Nova key na mesma parcela paga -> 409.
- `GET /api/v1/cobranca/parcelas/{id}` — retorna valor atualizado.

## Riscos / breaking changes

- `RegistrarRecebimentoResult` ganhou 3 campos (`dataRecebimento`, `meioPagamento`, `identificadorExterno`); records sao binarios-incompativeis mas codigo interno; sem consumidor externo.
- `ParcelaAtualizadaResult` ganhou `contratoId`. Sem consumidor externo.
- `ApiExceptionHandler` shared agora trata `MissingRequestHeaderException` — comportamento novo desejavel (400 em vez de 500).
- `PropostaCredito` ganhou coluna `taxa_juros_mensal` nullable. Registros legados continuam validos.
- `MovimentacaoEscrow` ganhou `external_reference_id` nullable. Registros legados continuam validos.
- `RegistrarMovimentacaoEscrowUseCase` ganhou param `ApplicationEventPublisher` + `PlatformTransactionManager` no construtor.

## Pendencias pos-merge

- PRD §22 marcar Sprint 12 executada (working tree docs-SEP, commit manual).
- Sprint futura precisa popular `proposta_credito.taxa_juros_mensal` explicitamente antes da assinatura — eliminar fallback de config.
- Epic 15 AWS multi-instance: introduzir ShedLock ou advisory lock no `MarcarParcelaAtrasadaJob`.
- Sprint 13 inadimplencia: consumir `ParcelaAtrasouEvent`; definir transicao `ATRASADA -> INADIMPLENTE`.

## Referencia

- Spec: `docs-SEP/specs/fase-2/012-sprint-12-cobranca-parcelas-agenda.md`
- Steps: `docs-SEP/steps-fase-2/backend/012-sprint-12-steps.md`
- Doc operacional: `docs-SEP/repos/sep-api/COBRANCA.md`
- ADRs: 0001, 0005, 0007
