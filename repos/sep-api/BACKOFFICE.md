# BACKOFFICE - sep-api

Documento operacional do modulo `backoffice` (Epic 9 — sprint unica que fecha a Fase 2).
Sprint 14 — implementada na branch: fila operacional unificada, comentarios internos, justificativas auditaveis, reprocessos manuais (webhook + provider) com anti-abuso, dashboard consolidado, nova role `BACKOFFICE` e auditoria reforcada.

> Spec: [`014-sprint-14-backoffice-operacional.md`](../../specs/fase-2/014-sprint-14-backoffice-operacional.md).
> Steps: [`014-sprint-14-steps.md`](../../steps-fase-2/backend/014-sprint-14-steps.md).
> Dependencias: [`ONBOARDING.md`](./ONBOARDING.md), [`CREDITO.md`](./CREDITO.md), [`CONTRATOS.md`](./CONTRATOS.md), [`COBRANCA.md`](./COBRANCA.md), [`NOTIFICACOES.md`](./NOTIFICACOES.md).

## Objetivo

Consolidar a operacao assistida da Fase 2 em um unico modulo. Toda situacao que exige intervencao humana — onboarding reprovado/pendente, proposta de credito travada, contrato sem assinatura, parcela inadimplente, webhook que falhou — vira `ItemFilaOperacional` automaticamente via listener ou job consolidador. Operadores `BACKOFFICE`/`FINANCEIRO` assumem o item, registram comentarios internos, disparam reprocesso manual quando necessario e marcam resolvido ou ignorado com justificativa obrigatoria.

Fim do agente desenvolvedor para conduzir a operacao: a partir desta sprint, o time interno opera a SEP via API REST + dashboard sem dependencia de devs. Telas web/mobile do backoffice ficam para Epic 13.

## Fluxo end-to-end implementado

```text
EVENTOS DE NEGOCIO (sprints anteriores)
  -> OnboardingFinalizadoEvent (Sprint 6)
  -> ParcelaInadimplenteEvent (Sprint 13)
  -> ContratoSemAssinaturaEvent (Sprint 11, via job)
  -> WebhookEventLog FALHOU/PENDENTE > 1h (Sprint 4, via job)
  -> Proposta EM_ANALISE > 24h (Sprint 8, via job)

LISTENERS sincronos (@TransactionalEventListener AFTER_COMMIT + REQUIRES_NEW)
  -> OnboardingFinalizadoListener (REPROVADO/PENDENCIA -> ALTA/MEDIA)
  -> ParcelaInadimplenteListener (CRITICA)
  -> CriarItemFilaOperacionalService -> ItemFilaOperacionalInserter (REQUIRES_NEW)

VerificadorPendenciasJob (@Scheduled cron default "0 */15 * * * *")
  -> PendenciaCreditoQueryPort       -> PROPOSTA EM_ANALISE > 24h
  -> PendenciaContratoQueryPort      -> CONTRATO ACEITO/EM_ASSINATURA > 48h
  -> PendenciaWebhookQueryPort       -> WebhookEventLog FALHOU/PENDENTE > 1h
  -> idempotencia via UNIQUE parcial (tipo, tipo_entidade, entidade_id) WHERE status IN ('ABERTO','EM_TRATAMENTO')
  -> catch DataIntegrityViolationException no inserter pra silenciar duplicacao

OPERADOR via REST /api/v1/backoffice
  -> GET /fila                         (filtros + paginacao + sort whitelist)
  -> GET /fila/{id}                    (detalhe + comentarios + objeto original via Strategy)
  -> POST /fila/{id}/assumir           (lock pessimista -> EM_TRATAMENTO)
  -> POST /fila/{id}/comentarios       (registra ComentarioInterno)
  -> PATCH /fila/{id}/resolver         (step-up + justificativa >= 20 chars)
  -> PATCH /fila/{id}/ignorar          (step-up + justificativa >= 20 chars)

REPROCESSOS manuais
  -> POST /reprocessos/webhook/{webhookEventId}
       -> anti-abuso 3/24h (count por identificadorExterno + janela)
       -> WebhookReprocessadorAdapter forca status PROCESSADO
       -> publica ReprocessoDisparadoEvent
  -> POST /reprocessos/provider/{tipoChamada}/{idEntidade}
       -> ProviderReprocessadorDispatcher (Strategy GoF)
       -> 5 strategies stub: KYC, KYB, PLD, OPEN_FINANCE, ASSINATURA_DIGITAL
       -> tipo nao mapeado -> 400 TipoReprocessoNaoSuportadoException

DASHBOARD
  -> GET /dashboard (Cache-Control: no-store)
  -> ConsultarVisaoConsolidadaUseCase (Facade GoF)
  -> agrega: contadores fila + tempo medio resolucao 30d + criticos > 48h + top 5 tipos
  -> recebimentos do dia (timezone-aware) + inadimplencia consolidada + propostas por status
  -> resiliente(supplier, fallback) isola falha de cada query

AUDIT REFORCADO
  -> BackofficeAuditListener (@TransactionalEventListener AFTER_COMMIT + REQUIRES_NEW)
  -> 6 tipos novos em audit_log_seguranca (V35)
  -> mascararDocumentos() regex CPF/CNPJ
  -> truncar() 80 chars guard em justificativa
  -> gravarSeguro() wrapper try/catch (audit nunca quebra fluxo de negocio)
```

## Entidades

- `ItemFilaOperacional` (agregado raiz, `extends EntidadeAuditavel`): id, `tipo` (`TipoItemFila`), `prioridade` (`PrioridadeItem`), `status` (`StatusItemFila`), `tipoEntidade` (`TipoEntidadeReferenciada`), `entidadeId` (UUID logica — sem FK fisica), `titulo`, `descricao`, `atribuidoA`, `dataAbertura`, `dataResolucao`. Factories estaticas `abrir(tipo, prioridade, tipoEntidade, entidadeId, titulo, descricao, abrirComoAlta)`; transicoes `assumir(operadorId)`, `resolver(operadorId, justificativa)`, `ignorar(operadorId, justificativa)`. Transicoes invalidas lancam `TransicaoItemInvalidaException` (409).
- `ComentarioInterno`: id, `itemId` (FK sem CASCADE — preserva trilha LGPD), `autorId`, `conteudo` (ate 10000 chars), `dataCriacao`. Factory `registrar(itemId, autorId, conteudo)`.
- `Reprocesso`: id, `itemId` (nullable — reprocesso pode ser disparado fora de item), `tipo` (`Reprocesso.Tipo` WEBHOOK/PROVIDER), `tipoChamada` (`TipoChamadaProvider` nullable; obrigatorio se PROVIDER via CHECK `chk_reprocesso_provider_exige_chamada`), `identificadorExterno` (webhookEventId ou entidadeId.toString()), `status` (`StatusReprocesso` PENDENTE/SUCESSO/FALHA), `resultado` (mensagem tecnica truncada), `dataDisparo`, `disparadoPor`. Factories `paraWebhook(...)` e `paraProvider(...)`.

## Value objects (sealed/enum)

- `TipoItemFila`: `ONBOARDING_PENDENTE`, `ONBOARDING_ERRO`, `PROPOSTA_PENDENTE`, `CONTRATO_NAO_ASSINADO`, `COBRANCA_INADIMPLENTE`, `WEBHOOK_FALHOU`, `DESEMBOLSO_PIX_FALHOU` (Sprint 20), `RECEBIMENTO_PIX_DIVERGENTE` (Sprint 21), `OUTRO`.
- `PrioridadeItem`: `BAIXA`, `MEDIA`, `ALTA`, `CRITICA`. Cada constante carrega `ordinalPeso` int pra ordenacao numerica (evita sort lexicografico VARCHAR errado).
- `StatusItemFila`: `ABERTO`, `EM_TRATAMENTO`, `RESOLVIDO`, `IGNORADO`. Helpers `permiteAssumir()`, `permiteResolverOuIgnorar()`, `isFinal()`.
- `TipoEntidadeReferenciada`: `ONBOARDING`, `PROPOSTA`, `CONTRATO`, `PARCELA_COBRANCA`, `WEBHOOK_EVENT_LOG`, `PIX_TRANSFERENCIA` (Sprint 20), `PIX_RECEBIMENTO` (Sprint 21), `OUTRO`.
- `TipoChamadaProvider`: `KYC`, `KYB`, `PLD`, `OPEN_FINANCE`, `ASSINATURA_DIGITAL`, `PIX_TRANSFERENCIA` (Sprint 20).

> **Sprint 20 (desembolso Pix)**: falha de desembolso gera item `DESEMBOLSO_PIX_FALHOU` via `DesembolsoPixFalhouListener` (AFTER_COMMIT). Reprocesso `PIX_TRANSFERENCIA` (`PixTransferenciaRetentativaStrategy`) eh handler **real e seguro**: so reconsulta o status via `ConsultarStatusDesembolsoPixUseCase` (nunca reenvia — chave Pix nao persistida); provider indisponivel -> `falha` (sem falso sucesso). Detalhe do item via `PixTransferenciaObjetoOriginalAdapter` (status + mascara, nunca chave). `BACKOFFICE` nao inicia desembolso novo. CHECKs ampliados em `V48`.

> **Sprint 21 (recebimento Pix)**: divergencia de recebimento (referencia desconhecida/nao-ATIVA, `endToEndId` ausente, valor parcial/maior, falha de baixa) gera item `RECEBIMENTO_PIX_DIVERGENTE`/`PIX_RECEBIMENTO` via `RecebimentoPixDivergenteListener` (AFTER_COMMIT, idempotente). **Sem reprocesso de provider** (`reprocesso.tipo_chamada` inalterado): o Pix ja foi recebido — o tratamento eh operacao assistida (assumir/comentar/resolver/ignorar). Detalhe do item via `PixRecebimentoObjetoOriginalAdapter` (status/valor/parcela, nunca payload/chave). CHECKs ampliados em `V52`.
- `StatusReprocesso`: `PENDENTE`, `SUCESSO`, `FALHA`.

## Estados da fila

```text
ABERTO          -> EM_TRATAMENTO | IGNORADO
EM_TRATAMENTO   -> RESOLVIDO | IGNORADO | ABERTO (liberacao excepcional via admin — fora desta sprint)
RESOLVIDO       = final
IGNORADO        = final
```

Apos `RESOLVIDO/IGNORADO` o `UNIQUE PARCIAL` `uq_item_ativo_por_entidade` libera novo item para a mesma `(tipo, tipo_entidade, entidade_id)` — operacao real pode reabrir caso pendencia ressurja.

## Listeners + job consolidador

**Sincronos (eventos de negocio):**

- `OnboardingFinalizadoListener`: escuta `OnboardingFinalizadoEvent`. `REPROVADO` -> `ONBOARDING_ERRO` `ALTA`. `PENDENCIA` -> `ONBOARDING_PENDENTE` `MEDIA`.
- `ParcelaInadimplenteListener`: escuta `ParcelaInadimplenteEvent` (Sprint 13). `COBRANCA_INADIMPLENTE` `CRITICA`.

**Job consolidador** `VerificadorPendenciasJob` (`@Scheduled cron "${app.backoffice.verificador-pendencias-cron:0 */15 * * * *}" zone="America/Sao_Paulo"`):

- `PropostaPendenciaListener`: `PROPOSTA EM_ANALISE` ha > `propostaEmAnaliseHoras` (default 24h) -> `PROPOSTA_PENDENTE` `MEDIA`.
- `ContratoSemAssinaturaListener`: `CONTRATO` em `ACEITO`/`EM_ASSINATURA` ha > `contratoSemAssinaturaHoras` (default 48h) -> `CONTRATO_NAO_ASSINADO` `ALTA`. Renomeado de `ContratoAceitoListener` pra evitar conflito de bean com listener homonimo do modulo `contratos`.
- `WebhookFalhouListener`: `WebhookEventLog` em `FALHOU`/`PENDENTE` ha > `webhookFalhouMinutos` (default 60m) -> `WEBHOOK_FALHOU` `ALTA`.

Cada listener delega ao `CriarItemFilaOperacionalService`, que isola o insert em `ItemFilaOperacionalInserter.inserirComIdempotencia(item)` anotado `@Transactional(propagation = REQUIRES_NEW)`. Self-invocation nao funciona em proxy AOP do Spring, entao o inserter eh um bean separado. `DataIntegrityViolationException` no UNIQUE parcial eh capturada e silenciada — log debug + retorno do existente via re-busca. Garante que duplicacao concorrente nao quebra o listener nem propaga rollback para a tx do evento original.

## Idempotencia da fila

`UNIQUE INDEX uq_item_ativo_por_entidade ON item_fila_operacional (tipo, tipo_entidade, entidade_id) WHERE status IN ('ABERTO', 'EM_TRATAMENTO')`.

Estrategia:

1. Pre-insert: query `findAtivoByTipoTipoEntidadeEntidadeId` evita roundtrip ao banco em cenarios obvios.
2. Insert: caso passe no pre-check mas perca race, `DataIntegrityViolationException` no UNIQUE eh capturada.
3. Pos-catch: re-fetch retorna o vencedor; chamador recebe o item canonico.

Apos resolucao/ignore o registro permanece (sem soft-delete), mas o predicate parcial libera novo item ativo para a mesma entidade.

## Use cases — fila

- `ListarFilaOperacionalUseCase`: filtros `FiltrosFilaOperacional` (`tipo`, `prioridade`, `status`, `dataAberturaDe/Ate`, `atribuidoA`); paginacao Spring `Pageable`. Clamp em 100 elementos. Sort default `prioridade DESC, dataAbertura ASC` traduzido pelo controller para `CASE prioridade` (evita lexicografico VARCHAR). Sort whitelist no controller faz `sanitizarSort` strippando campos nao permitidos.
- `ConsultarItemFilaUseCase`: detalhe + comentarios paginados + `ObjetoOriginalResumo` resolvido via `ResolvedorObjetoOriginalDispatcher` (Strategy GoF).
- `AssumirItemFilaUseCase`: `findByIdForUpdate` (lock pessimista) + `assumir(operadorId)`; publica `ItemAssumidoEvent`.
- `RegistrarComentarioUseCase`: cria `ComentarioInterno`; publica `ComentarioRegistradoEvent`.
- `MarcarItemResolvidoUseCase`: `findByIdForUpdate` + `resolver(operadorId, justificativa)`. Justificativa obrigatoria via `JustificativaInvalidaException` (>= 20 chars). Tambem registra a justificativa como `ComentarioInterno` (rastreabilidade). Publica `ItemResolvidoEvent` (justificativa truncada em 80 chars no payload).
- `MarcarItemIgnoradoUseCase`: identico ao resolver mas status final `IGNORADO`.

## Use cases — reprocesso

- `ReprocessarWebhookUseCase`:
  1. valida `webhookEventId` existe e nao esta em estado terminal nao reprocessavel.
  2. `AntiAbusoReprocessoService.verificarLimite(identificadorExterno)`: COUNT > 3 nas ultimas 24h -> `LimiteReprocessoExcedidoException` (429).
  3. `WebhookReprocessadorAdapter`: forca `WebhookEventLog.status = PROCESSADO`. Re-trigger do consumidor fica para Sprint futura (stub atual marca processado para reabrir Outbox manualmente).
  4. persiste `Reprocesso.paraWebhook(itemId, identificadorExterno, status, resultado, disparadoPor)` final.
  5. publica `ReprocessoDisparadoEvent` com `(reprocessoId, tipo=WEBHOOK, tipoChamada=null, identificadorExterno, status, itemId, disparadoPor)`.
- `ReprocessarChamadaProviderUseCase`:
  1. valida `TipoChamadaProvider` reconhecido (sealed enum); desconhecido -> `TipoReprocessoNaoSuportadoException` (400).
  2. anti-abuso identico ao webhook.
  3. `ProviderReprocessadorDispatcher` (`EnumMap<TipoChamadaProvider, ProviderRetentativaStrategy>`) roteia.
  4. Strategies stub (entregam stub controlado nesta sprint; integracao real fica para sprint futura): `KycRetentativaStrategy`, `KybRetentativaStrategy`, `PldRetentativaStrategy`, `OpenFinanceRetentativaStrategy`, `AssinaturaDigitalRetentativaStrategy`. Cada uma retorna `ResultadoReprocesso(status, mensagem)`.
  5. persiste `Reprocesso.paraProvider(itemId, tipoChamada, identificadorExterno, status, resultado, disparadoPor)` ao final (rollback unificado).
  6. publica `ReprocessoDisparadoEvent`.

Anti-abuso: query nativa `SELECT COUNT(*) FROM reprocesso WHERE identificador_externo = ? AND data_disparo > now() - interval '24 hours'`. Race best-effort (sem lock distribuido) — pendencia documentada em "Limitacoes".

## Use case — dashboard

`ConsultarVisaoConsolidadaUseCase` (Facade GoF) compoe `DashboardBackoffice` agregando:

- Contadores por `TipoItemFila`, `PrioridadeItem`, `StatusItemFila` (queries diretas no `ItemFilaOperacionalRepository`).
- Top N tipos por volume (`topTiposLimit` default 5).
- Tempo medio de resolucao nos ultimos `tempoMedioJanelaDias` dias (default 30). Query nativa Postgres `extract(epoch from interval)` calcula segundos entre `data_abertura` e `data_resolucao`; retorna `Duration`.
- Itens criticos abertos ha mais de `criticosThresholdHoras` (default 48h).
- Recebimentos do dia (`DashboardCobrancaQueryPort.recebimentosNoIntervalo(startUtc, endUtc)` — janela timezone-aware em `America/Sao_Paulo`).
- Inadimplencia consolidada (`InadimplenciaConsolidada` via interface projection `ResumoInadimplenciaView` no `ParcelaCobrancaRepository`).
- Propostas por status (`DashboardCreditoQueryPort.contadoresPorStatusProposta()`).
- `geradoEm` Instant (UTC) pra cache control no cliente.

Helper `resiliente(supplier, fallback)` isola cada agregacao em try/catch: falha em uma metrica nao derruba o dashboard inteiro. `BackofficeDashboardProperties` `@ConfigurationProperties("app.backoffice.dashboard")` configura `timezone`, `tempoMedioJanelaDias`, `criticosThresholdHoras`, `topTiposLimit`.

## Endpoints implementados

Base path `/api/v1/backoffice`. Todos exigem auth `ROLE_FINANCEIRO/BACKOFFICE/ADMIN` (dashboard tambem aceita os tres; demais variam por operacao).

| Metodo | Path | Auth | Notas |
|--------|------|------|-------|
| `GET` | `/fila` | `FINANCEIRO`/`BACKOFFICE`/`ADMIN` | filtros + paginacao + sort whitelist (`prioridade`, `dataAbertura`); clamp 100 |
| `GET` | `/fila/{id}` | `FINANCEIRO`/`BACKOFFICE`/`ADMIN` | detalhe + comentarios + objeto original (Strategy) |
| `POST` | `/fila/{id}/assumir` | `FINANCEIRO`/`BACKOFFICE`/`ADMIN` | lock pessimista; 409 se ja `EM_TRATAMENTO`/final |
| `POST` | `/fila/{id}/comentarios` | `FINANCEIRO`/`BACKOFFICE`/`ADMIN` | Bean Validation conteudo NotBlank ate 10000 chars |
| `PATCH` | `/fila/{id}/resolver` | `FINANCEIRO`/`BACKOFFICE`/`ADMIN` + step-up | justificativa >= 20 chars; 409 transicao invalida |
| `PATCH` | `/fila/{id}/ignorar` | `FINANCEIRO`/`BACKOFFICE`/`ADMIN` + step-up | identico ao resolver |
| `POST` | `/reprocessos/webhook/{webhookEventId}` | `FINANCEIRO`/`BACKOFFICE`/`ADMIN` + step-up | anti-abuso 3/24h -> 429 `BOF-429-001` |
| `POST` | `/reprocessos/provider/{tipoChamada}/{idEntidade}` | `FINANCEIRO`/`BACKOFFICE`/`ADMIN` + step-up | tipo desconhecido -> 400 `BOF-400-002` |
| `GET` | `/dashboard` | `FINANCEIRO`/`BACKOFFICE`/`ADMIN` | `Cache-Control: no-store`; resiliente a falha parcial |

DTOs records com `static from(domain)`: `ItemFilaResponse`, `ItemFilaDetalheResponse`, `ComentarioInternoResponse`, `ComentarioRequest`, `ResolverRequest`, `IgnorarRequest`, `ReprocessoRequest`, `ReprocessoResponse`, `ObjetoOriginalResponse`, `DashboardResponse`. OpenAPI completo (`@Tag/@Operation/@ApiResponses`).

## Codigos de excecao (ApiExceptionHandler shared)

- `BOF-404-001` — `ItemFilaNaoEncontradoException` (404).
- `BOF-409-001` — `TransicaoItemInvalidaException` (409).
- `BOF-400-001` — `JustificativaInvalidaException` (400).
- `BOF-400-002` — `TipoReprocessoNaoSuportadoException` (400). Dedicada; nao mapeia `UnsupportedOperationException` generico (evita mascarar bug).
- `BOF-429-001` — `LimiteReprocessoExcedidoException` (`@ResponseStatus(TOO_MANY_REQUESTS)`).

## Auditoria reforcada

`BackofficeAuditListener` (`@TransactionalEventListener AFTER_COMMIT` + `@Transactional REQUIRES_NEW`) grava 6 tipos novos em `audit_log_seguranca` (V35):

```text
ITEM_FILA_CRIADO        - listener/job cria item; criadoPor = atorId
ITEM_ASSUMIDO           - operador assume; entidadeId = itemId; payload com tipo + entidadeOriginal
COMENTARIO_REGISTRADO   - autorId, itemId, sem corpo do comentario
ITEM_RESOLVIDO          - operadorId, itemId, justificativa truncada 80 chars
ITEM_IGNORADO           - operadorId, itemId, justificativa truncada 80 chars
REPROCESSO_DISPARADO    - reprocessoId, tipo, tipoChamada, status, itemId, identificadorExterno
```

Sanitizacao obrigatoria via `mascararDocumentos(payload)`: regex CPF -> `***.***.***-**`, CNPJ -> `**.***.***/****-**`. Wrapper `gravarSeguro(supplier)` em cada handler captura `Exception` e loga warn — audit nunca derruba o fluxo de negocio. `truncar(texto, 80)` aplicado a justificativa antes do JSON.

Conteudo completo de comentario permanece em `comentario_interno`; audit guarda apenas IDs + metadados. Retencao alinhada com cobranca/contratos (10 anos — CMN 4.656/2018 + LGPD).

## Role `BACKOFFICE`

Migration `V34__adicionar_role_backoffice.sql` amplia o CHECK `chk_usuario_role` com a constante `BACKOFFICE` (forward-only; nao idempotente — registrada nas "Limitacoes"). Enum `Role.java` adiciona a constante.

`CriarUsuarioUseCase` bloqueia criacao direta de `FINANCEIRO` e `BACKOFFICE` via 400 — promocao deve passar por `AlterarRoleUsuarioUseCase` (Sprint 8) com auditoria `ROLE_ALTERADO`. Cumulatividade real (operador possuir simultaneamente `FINANCEIRO + BACKOFFICE`) fica para Epic 11 (multi-role) — documentado no risk register.

Permissoes:

- `BACKOFFICE`: opera fila + reprocessos + dashboard. NAO pode registrar parecer de credito (Sprint 8), confirmar recebimento (Sprint 12) ou alterar agenda de pagamento. IT cobre 403 em `POST /api/v1/credito/.../parecer` e `POST /api/v1/cobranca/parcelas/{id}/recebimentos`.
- `FINANCEIRO`: mantem permissoes da Sprint 8/12/13 + ganha acesso a fila/reprocessos/dashboard.
- `ADMIN`: superset de tudo.

## Hexagonal — ports + adapters

`backoffice/application/port/out`:

- `PendenciaCreditoQueryPort` + `PropostaPendenciaView` (record).
- `PendenciaContratoQueryPort` + `ContratoPendenciaView`.
- `PendenciaWebhookQueryPort` + `WebhookPendenciaView`.
- `ObjetoOriginalQueryPort` — interface stratega pra cada `TipoEntidadeReferenciada`.
- `WebhookReprocessadorPort` + `ProviderReprocessadorPort` + `ProviderRetentativaStrategy` (interface Strategy GoF).
- `DashboardCobrancaQueryPort` + `DashboardCreditoQueryPort`.

`backoffice/infrastructure/adapter`:

- `onboarding/OnboardingObjetoOriginalAdapter`.
- `credito/{PendenciaCreditoQueryAdapter, PropostaObjetoOriginalAdapter, DashboardCreditoQueryAdapter}`.
- `contratos/{PendenciaContratoQueryAdapter, ContratoObjetoOriginalAdapter}`.
- `cobranca/{DashboardCobrancaQueryAdapter, ParcelaCobrancaObjetoOriginalAdapter}`.
- `webhook/{PendenciaWebhookQueryAdapter, WebhookEventLogObjetoOriginalAdapter}`.
- `reprocesso/WebhookReprocessadorAdapter` + 5 strategies em `reprocesso/strategy/`.

`ResolvedorObjetoOriginalDispatcher` injeta `List<ObjetoOriginalQueryPort>` e roteia por `TipoEntidadeReferenciada` em `EnumMap` (Strategy + Dispatcher). `ProviderReprocessadorDispatcher` faz o mesmo para `TipoChamadaProvider`. Adicionar nova entidade/provider eh apenas implementar a interface — nenhum codigo do `backoffice` core muda.

## Configuracao

`BackofficeVerificadorProperties` `@ConfigurationProperties("app.backoffice.verificador-pendencias")` + `@Validated`:

```yaml
app:
  backoffice:
    verificador-pendencias:
      proposta-em-analise-horas: 24
      contrato-sem-assinatura-horas: 48
      webhook-falhou-minutos: 60
      batch-size: 200
    dashboard:
      timezone: America/Sao_Paulo
      tempo-medio-janela-dias: 30
      criticos-threshold-horas: 48
      top-tipos-limit: 5
```

`BackofficeSchedulingConfig` `@EnableScheduling` + `@ConditionalOnProperty(scheduling-habilitado, matchIfMissing=true)`. Job desabilitado em profile `test` para evitar interferencia com IT.

## Migrations Flyway

| Versao | Descricao |
|--------|-----------|
| V33 | Cria `item_fila_operacional`, `comentario_interno`, `reprocesso`. UNIQUE PARCIAL `uq_item_ativo_por_entidade`. FK comentario sem CASCADE. CHECK por tipo/prioridade/status. Index `(identificador_externo, data_disparo DESC)` pra anti-abuso. |
| V34 | Amplia `chk_usuario_role` com `BACKOFFICE`. Forward-only; **nao idempotente** — re-run em base com `BACKOFFICE` ja presente falha (risk register). |
| V35 | DROP+ADD `chk_audit_seguranca_tipo` com 6 tipos novos do backoffice. |

## Testes

Suite Sprint 14:

- **Dominio**: `ItemFilaOperacionalTest`, `ComentarioInternoTest`, `ReprocessoTest`, `PrioridadeItemTest` (`ordinalPeso`), `StatusItemFilaTest` (transicoes).
- **Use cases**: `ListarFilaOperacionalUseCaseTest`, `ConsultarItemFilaUseCaseTest`, `AssumirItemFilaUseCaseTest`, `RegistrarComentarioUseCaseTest`, `MarcarItemResolvidoUseCaseTest`, `MarcarItemIgnoradoUseCaseTest`, `ReprocessarWebhookUseCaseTest`, `ReprocessarChamadaProviderUseCaseTest`, `ConsultarVisaoConsolidadaUseCaseTest`.
- **Services/dispatchers**: `CriarItemFilaOperacionalServiceTest`, `AntiAbusoReprocessoServiceTest`, `ProviderReprocessadorDispatcherTest`, `ResolvedorObjetoOriginalDispatcherTest`.
- **Listeners + job**: `OnboardingFinalizadoListenerTest`, `ParcelaInadimplenteListenerTest`, `PropostaPendenciaListenerTest`, `ContratoSemAssinaturaListenerTest`, `WebhookFalhouListenerTest`, `VerificadorPendenciasJobTest`, `BackofficeAuditListenerTest`.
- **Web**: `BackofficeControllerTest`, `BackofficeReprocessoControllerTest`, `BackofficeDashboardControllerTest` (5 cenarios: 200 BACKOFFICE/FINANCEIRO/ADMIN, 403 CLIENTE, 401 sem auth).
- **Persistencia**: `ItemFilaOperacionalRepositoryTest` (UNIQUE parcial + reabertura pos-resolucao), `ReprocessoRepositoryTest` (anti-abuso query).
- **IT**: `BackofficeIT` (7 cenarios — onboarding REPROVADO -> fila ALTA, happy path com audit 4 tipos, sem step-up 403, BACKOFFICE -> credito/cobranca 403, dashboard com massa, idempotencia), `ReprocessoIT` (2 cenarios — webhook reprocessado com `WebhookEventLog PROCESSADO`, 4o reprocesso 429).

Validacoes focadas usadas na Task 14.9: `./gradlew test --tests "*BackofficeIT" --tests "*ReprocessoIT"` e `./gradlew test --tests "*backoffice*"`.

## Limitacoes conhecidas / pendencias futuras

- **Telas web/mobile**: Epic 13 entregara UI (atualmente operacao via API REST + Swagger).
- **SLA + alertas automaticos**: itens em atraso nao geram alerta proativo; dashboard mostra contadores. Sprint futura adiciona watcher.
- **Atribuicao automatica round-robin**: nesta sprint eh manual via `POST /fila/{id}/assumir`. Sprint futura pode atribuir por load.
- **Relatorios exportaveis (CSV/PDF)**: fora de escopo; sprint futura.
- **BI / dashboards externos**: fora de escopo; integracao com Looker/Metabase fica para Epic 15.
- **Cumulatividade `BACKOFFICE` + `FINANCEIRO`**: implementacao atual eh single-role por usuario (Sprint 8). Epic 11 entrega multi-role.
- **Strategies de provider reprocesso sao stubs**: KYC/KYB/PLD/OpenFinance/AssinaturaDigital atualmente registram tentativa controlada. Integracao real depende de SDK + idempotencia por provider (Sprint futura por dominio).
- **WebhookReprocessadorAdapter forca status PROCESSADO**: nao re-aciona consumidor Outbox automaticamente. Sprint futura conecta `OutboxRedispatcher`.
- **Anti-abuso 3/24h sem lock distribuido**: race em rajadas concorrentes pode permitir 4o reprocesso. Best-effort aceitavel nesta sprint; Epic 15 multi-instance exige advisory lock ou Redis counter.
- **V34 nao idempotente**: re-run da migration em base ja com `BACKOFFICE` falha. Padrao do projeto (migrations forward-only); ambientes novos sempre aplicam V1->V35 sequencial.
- **`UNIQUE PARCIAL` libera reabertura sem soft-delete**: itens resolvidos/ignorados permanecem visiveis na consulta historica via `status` filter, sem registro de "quantas vezes reabriu".
- **Job single-instance**: `VerificadorPendenciasJob` exige ShedLock ou advisory lock em ambientes multi-replica (Epic 15 AWS).
- **OpenAPI dos DTOs de role**: documentacao Swagger nao reflete bloqueio de criacao direta de `BACKOFFICE`/`FINANCEIRO` em `POST /usuarios`. Pendencia menor — endpoint retorna 400 com codigo identificavel.
- **Dashboard sem cache backend**: `Cache-Control: no-store` no client. Consultas read-only diretas; Epic 15 pode adicionar Caffeine + TTL curto.

## Referencias

- [Spec 014](../../specs/fase-2/014-sprint-14-backoffice-operacional.md)
- [Steps Sprint 14](../../steps-fase-2/backend/014-sprint-14-steps.md)
- [ONBOARDING.md](./ONBOARDING.md)
- [CREDITO.md](./CREDITO.md)
- [CONTRATOS.md](./CONTRATOS.md)
- [COBRANCA.md](./COBRANCA.md)
- [NOTIFICACOES.md](./NOTIFICACOES.md)
- [ADR 0001 - Monolito modular orientado a DDD](../../adr/0001-monolito-modular-orientado-a-ddd.md)
- [ADR 0007 - DDD com Hexagonal Ports and Adapters por modulo](../../adr/0007-ddd-com-hexagonal-ports-and-adapters-por-modulo.md)
- Resolucao CMN 4.656/2018
- LGPD Lei 13.709/2018
