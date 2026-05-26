# PR — Sprint 14 (Backoffice operacional — fecha Fase 2)

Artefato exigido pela Task 14.10 (steps `014-sprint-14-steps.md`). Conteudo abaixo deve ser
usado ao abrir o PR manualmente (`gh pr create --base develop ...` ou via UI).

## Titulo sugerido

```
feat(backoffice): Sprint 14 — fila operacional + reprocessos + dashboard + role BACKOFFICE (Epic 9 — fecha Fase 2)
```

## Resumo

- Fecha a Fase 2: modulo `backoffice` unifica em uma unica fila todas as situacoes que exigem intervencao humana (onboarding, credito, contratos, cobranca, webhook). Operacao da SEP passa a rodar sem dev na sequencia.
- 5 listeners (sincronos em eventos de negocio) + 1 job consolidador `@Scheduled` (`VerificadorPendenciasJob`) criam `ItemFilaOperacional` automaticamente. Idempotencia via UNIQUE PARCIAL `(tipo, tipo_entidade, entidade_id) WHERE status IN ('ABERTO','EM_TRATAMENTO')` + `ItemFilaOperacionalInserter` `REQUIRES_NEW` (proxy AOP — bean separado).
- 7 use cases de fila (Listar/Consultar/Assumir/Comentario/Resolver/Ignorar) + 2 de reprocesso (Webhook/Provider) + 1 dashboard (Facade GoF). Resolver/Ignorar exigem step-up + justificativa >= 20 chars. Reprocessos exigem step-up + anti-abuso 3/24h -> 429.
- Strategy GoF aplicado 2x: `ResolvedorObjetoOriginalDispatcher` (5 strategies por `TipoEntidadeReferenciada`) + `ProviderReprocessadorDispatcher` (5 strategies por `TipoChamadaProvider`). Adicionar nova fonte vira implementar a interface.
- Nova role `BACKOFFICE` (V34) — opera fila/reprocessos/dashboard sem permissoes amplas de financeiro. `CriarUsuarioUseCase` bloqueia criacao direta de `FINANCEIRO`/`BACKOFFICE` (so via `AlterarRoleUsuarioUseCase`). Cumulatividade real fica para Epic 11.
- Auditoria reforcada: 6 tipos novos em `audit_log_seguranca` (V35) via `BackofficeAuditListener` (`AFTER_COMMIT` + `REQUIRES_NEW`). `mascararDocumentos()` regex CPF/CNPJ + `truncar(80)` em justificativa + `gravarSeguro()` wrapper try/catch (audit nunca quebra fluxo).
- 3 migrations Flyway novas (V33-V35) + 9 endpoints REST + 100+ testes (unit + repo + `@WebMvcTest` + IT `@SpringBootTest`).

## Escopo tecnico

### Dominio + persistencia

3 entidades em `backoffice/domain/model`:
- `ItemFilaOperacional` (agregado raiz `extends EntidadeAuditavel`): tipo + prioridade + status + (tipoEntidade, entidadeId) logica sem FK fisica. Factories `abrir(...)` + `assumir/resolver/ignorar`. Transicoes invalidas -> `TransicaoItemInvalidaException` (BOF-409-001).
- `ComentarioInterno`: N:1 com item, FK sem CASCADE (preserva trilha LGPD). Conteudo ate 10000 chars.
- `Reprocesso`: `itemId` nullable (reprocesso pode disparar fora de item); `tipo` WEBHOOK/PROVIDER; `tipoChamada` obrigatorio se PROVIDER (CHECK `chk_reprocesso_provider_exige_chamada`); `identificadorExterno` indexado com `data_disparo DESC` pra anti-abuso.

VO + eventos:
- `TipoItemFila` 7 valores. `PrioridadeItem` carrega `ordinalPeso` (sort numerico, nao lexicografico VARCHAR). `StatusItemFila` 4 valores. `TipoEntidadeReferenciada` 6 valores. `TipoChamadaProvider` 5 valores. `StatusReprocesso` 3 valores.
- 6 eventos: `ItemFilaCriadoEvent`, `ItemAssumidoEvent`, `ComentarioRegistradoEvent`, `ItemResolvidoEvent`, `ItemIgnoradoEvent`, `ReprocessoDisparadoEvent` (payload expandido em hotfix manual com tipoChamada/status/itemId).

Excecoes tipadas:
- `ItemFilaNaoEncontradoException` (BOF-404-001)
- `TransicaoItemInvalidaException` (BOF-409-001)
- `JustificativaInvalidaException` (BOF-400-001)
- `TipoReprocessoNaoSuportadoException` (BOF-400-002) — dedicada, nao mapeia `UnsupportedOperationException` generico
- `LimiteReprocessoExcedidoException` (BOF-429-001) `@ResponseStatus(TOO_MANY_REQUESTS)`

3 migrations:
- `V33__criar_tabelas_backoffice.sql` — 3 tabelas + UNIQUE PARCIAL `uq_item_ativo_por_entidade` + FK comentario sem CASCADE + index reprocesso (identificador_externo, data_disparo DESC) + CHECKs por tipo/prioridade/status/tipoChamada.
- `V34__adicionar_role_backoffice.sql` — DROP+ADD `chk_usuario_role` com `BACKOFFICE`. Forward-only; nao idempotente.
- `V35__ampliar_audit_seguranca_tipo_backoffice.sql` — DROP+ADD `chk_audit_seguranca_tipo` com 6 tipos do backoffice (preserva todos anteriores).

### Use cases + services (camada application)

7 use cases de fila:
- `ListarFilaOperacionalUseCase` — filtros `FiltrosFilaOperacional` (tipo/prioridade/status/dataAbertura/atribuidoA); `Pageable` Spring; sort default `CASE prioridade DESC, dataAbertura ASC` (whitelist no controller via `sanitizarSort`).
- `ConsultarItemFilaUseCase` — detalhe + comentarios paginados + `ObjetoOriginalResumo` via `ResolvedorObjetoOriginalDispatcher` (Strategy GoF).
- `AssumirItemFilaUseCase` — `findByIdForUpdate` (lock pessimista) + transicao ABERTO -> EM_TRATAMENTO.
- `RegistrarComentarioUseCase` — cria `ComentarioInterno` + evento.
- `MarcarItemResolvidoUseCase` / `MarcarItemIgnoradoUseCase` — step-up obrigatorio na camada web; justificativa >= 20 chars; tambem registra justificativa como `ComentarioInterno` (rastreabilidade); justificativa truncada 80 chars no payload do evento.

2 use cases de reprocesso:
- `ReprocessarWebhookUseCase` — anti-abuso + `WebhookReprocessadorAdapter` forca `WebhookEventLog PROCESSADO` + persiste `Reprocesso.paraWebhook(...)` final + evento.
- `ReprocessarChamadaProviderUseCase` — anti-abuso + `ProviderReprocessadorDispatcher` (EnumMap) roteia para 5 strategies stub (KYC/KYB/PLD/OpenFinance/AssinaturaDigital). Reordenado adapter -> persist final (rollback unificado).

1 use case dashboard:
- `ConsultarVisaoConsolidadaUseCase` (Facade GoF) — `resiliente(supplier, fallback)` isola falha por agregacao. Tempo medio via query nativa Postgres `extract(epoch from interval)`. Recebimentos timezone-aware via `DashboardCobrancaQueryPort.recebimentosNoIntervalo(startUtc, endUtc)`. Inadimplencia via interface projection `ResumoInadimplenciaView`.

Services + dispatchers:
- `CriarItemFilaOperacionalService` + `ItemFilaOperacionalInserter` (bean separado `@Transactional(REQUIRES_NEW)` — proxy AOP nao funciona em self-invocation).
- `AntiAbusoReprocessoService` — query nativa COUNT por `identificador_externo` em janela 24h; limite 3.
- `ProviderReprocessadorDispatcher` + `ResolvedorObjetoOriginalDispatcher` — EnumMap injetada com `List<Strategy>`.

5 listeners + 1 job:
- `OnboardingFinalizadoListener` (REPROVADO -> ALTA, PENDENCIA -> MEDIA).
- `ParcelaInadimplenteListener` (CRITICA).
- `VerificadorPendenciasJob` `@Scheduled("${app.backoffice.verificador-pendencias-cron:0 */15 * * * *}")` -> `PropostaPendenciaListener` (> 24h) + `ContratoSemAssinaturaListener` (> 48h, renomeado pra evitar bean clash com modulo contratos) + `WebhookFalhouListener` (> 60min).
- `BackofficeAuditListener` (`AFTER_COMMIT` + `REQUIRES_NEW`) 6 handlers + `mascararDocumentos()` + `gravarSeguro()`.

### Ports + adapters (Hexagonal — ADR 0007)

`backoffice/application/port/out`:
- `PendenciaCreditoQueryPort` + `PropostaPendenciaView`.
- `PendenciaContratoQueryPort` + `ContratoPendenciaView`.
- `PendenciaWebhookQueryPort` + `WebhookPendenciaView`.
- `ObjetoOriginalQueryPort` (Strategy interface).
- `WebhookReprocessadorPort` + `ProviderReprocessadorPort` + `ProviderRetentativaStrategy`.
- `DashboardCobrancaQueryPort` + `DashboardCreditoQueryPort`.

`backoffice/infrastructure/adapter`:
- `onboarding/OnboardingObjetoOriginalAdapter`.
- `credito/{PendenciaCreditoQueryAdapter, PropostaObjetoOriginalAdapter, DashboardCreditoQueryAdapter}`.
- `contratos/{PendenciaContratoQueryAdapter, ContratoObjetoOriginalAdapter}`.
- `cobranca/{DashboardCobrancaQueryAdapter, ParcelaCobrancaObjetoOriginalAdapter}`.
- `webhook/{PendenciaWebhookQueryAdapter, WebhookEventLogObjetoOriginalAdapter}`.
- `reprocesso/WebhookReprocessadorAdapter` + 5 strategies stub em `reprocesso/strategy/`.

### REST + DTOs + OpenAPI

3 controllers, 9 endpoints em `/api/v1/backoffice`:
- `BackofficeController` (`/fila`) — 6 endpoints; `@PreAuthorize hasAnyRole('FINANCEIRO','BACKOFFICE','ADMIN')`; `@RequireStepUp` em resolver/ignorar; `sanitizarSort` strippa campos fora da whitelist.
- `BackofficeReprocessoController` (`/reprocessos`) — 2 endpoints; step-up obrigatorio.
- `BackofficeDashboardController` (`/dashboard`) — 1 endpoint; `Cache-Control: no-store`.

10 DTOs records com `static from(domain)` + Bean Validation no request + `@Schema` OpenAPI. `ApiExceptionHandler` shared extendido com `TipoReprocessoNaoSuportadoException` (400) e `LimiteReprocessoExcedidoException` (429).

### Role BACKOFFICE

`Role.java` enum + V34. `CriarUsuarioUseCase` bloqueia `FINANCEIRO`/`BACKOFFICE` em criacao direta (200 -> 400) — promocao via `AlterarRoleUsuarioUseCase` (Sprint 8). Cumulatividade adiada para Epic 11.

### Audit reforcado

`BackofficeAuditListener` `@TransactionalEventListener(AFTER_COMMIT)` + `@Transactional(REQUIRES_NEW)`. 6 tipos: `ITEM_FILA_CRIADO`, `ITEM_ASSUMIDO`, `COMENTARIO_REGISTRADO`, `ITEM_RESOLVIDO`, `ITEM_IGNORADO`, `REPROCESSO_DISPARADO`. Sanitizacao: `mascararDocumentos()` regex CPF `***.***.***-**` / CNPJ `**.***.***/****-**`. `truncar(80)` em justificativa. `gravarSeguro(supplier)` wrapper try/catch — audit warn-log em falha, nunca rollback do fluxo principal.

## Profile test

`application-test.yml`:
- `app.backoffice.scheduling-habilitado: false` (job nao dispara em janela aleatoria).
- `BackofficeIT` injeta itens manualmente + dispara eventos via `TransactionTemplate.execute(...)` + `ApplicationEventPublisher.publishEvent(...)` dentro de tx ativa.
- `ReprocessoIT` semeia 3 reprocessos previos no setup pra forcar 429 no 4o disparo.

## Tests

- Dominio: 5 arquivos / ~20 testes.
- Use cases (fila + reprocesso + dashboard): 9 arquivos / ~40 testes.
- Services/dispatchers: 4 arquivos / ~15 testes.
- Listeners + job + audit: 7 arquivos / ~25 testes.
- Web `@WebMvcTest`: 3 arquivos / ~25 testes.
- Persistencia: 2 arquivos / ~8 testes.
- IT `@SpringBootTest`: 2 arquivos / 9 testes (7 BackofficeIT + 2 ReprocessoIT).

**Total backoffice: 100+ testes verdes**. `./gradlew check` BUILD SUCCESSFUL. JaCoCo gate respeitado (modulo `backoffice` >= 70%).

## Como validar

```bash
cd <sep-api-root>
./gradlew check
./gradlew test --tests "*backoffice*"
./gradlew test --tests "com.dynamis.sep_api.backoffice.web.BackofficeIT"
./gradlew test --tests "com.dynamis.sep_api.backoffice.web.ReprocessoIT"
```

REST manual via Postman/Insomnia collections (atualizadas em `docs-SEP/docs-sep/`):
- `POST /api/v1/usuarios` + promover via `PATCH /api/v1/usuarios/{id}/role` para `BACKOFFICE` (ADMIN + step-up).
- `POST /api/v1/auth/login` -> token BACKOFFICE.
- `GET /api/v1/backoffice/fila` — lista paginada.
- `POST /api/v1/backoffice/fila/{id}/assumir` -> 200; repetir -> 409 (ja `EM_TRATAMENTO`).
- `PATCH /api/v1/backoffice/fila/{id}/resolver` com `{"justificativa": "..."}` (>=20 chars) + step-up valido -> 200; sem step-up -> 403.
- `POST /api/v1/backoffice/reprocessos/webhook/{webhookEventId}` -> 200 + `Reprocesso PENDENTE`; 4x na mesma `identificadorExterno` em 24h -> 429.
- `GET /api/v1/backoffice/dashboard` — `Cache-Control: no-store` + agregados.

## Riscos / breaking changes

- `Role` enum ganhou constante `BACKOFFICE`. Consumidores que faziam `switch` exhaustive precisam atualizar (pre-existente; `default` ja cobre).
- V34 nao idempotente: re-run em base com `BACKOFFICE` ja presente falha (padrao Flyway forward-only do projeto).
- `CriarUsuarioUseCase` agora retorna 400 para `FINANCEIRO`/`BACKOFFICE` em criacao direta (antes aceitava). Quebra contrato somente em chamada direta da API; nenhum cliente conhecido cria FINANCEIRO direto.
- `ContratoSemAssinaturaListener` renomeado de `ContratoAceitoListener` (bean clash com modulo contratos). Wire por classe — nao afeta clientes.
- `WebhookEventLog.status = PROCESSADO` agora pode ser forcado externamente pelo `WebhookReprocessadorAdapter` — re-aciona consumidor Outbox fica para sprint futura (atualmente marca processado para liberar manual).
- `ApplicationEventPublisher` em 4 use cases (fila + reprocesso) — bean ja registrado pelo Spring.
- `audit_log_seguranca.tipo` ganhou 6 valores via V35 — consumidor read-only nao quebra; consumer com enum sealed Java fora do `sep-api` precisa adicionar.

## Pendencias pos-merge

- PRD §22 marcar Sprint 14 executada (working tree docs-SEP, commit manual).
- PRD §29 marcar Fase 2 concluida (working tree docs-SEP, commit manual).
- CONTEXT.md registrar conclusao Fase 2 (working tree docs-SEP, commit manual).
- AI-ROADMAP.md linha 63 substituir placeholder pelo link real para `BACKOFFICE.md`.
- Atualizar `sep-api.postman_collection.json` + `sep-api.insomnia_collection.json` com 9 endpoints `/api/v1/backoffice/...` (working tree docs-SEP).
- Epic 11 (multi-role): entregar cumulatividade real `BACKOFFICE` + `FINANCEIRO` por usuario.
- Sprint dedicada por provider: substituir strategies stub de reprocesso por integracao real (KYC/KYB/PLD/OpenFinance/AssinaturaDigital).
- Sprint futura: `OutboxRedispatcher` re-acionando consumidor automaticamente apos `WebhookReprocessadorAdapter`.
- Epic 15 AWS multi-instance: introduzir ShedLock ou advisory lock no `VerificadorPendenciasJob` + Redis counter para anti-abuso 3/24h.
- Epic 13: telas web/mobile do backoffice.
- Sprint futura: SLA + alertas automaticos, atribuicao round-robin, relatorios CSV/PDF, integracao BI externo.

## Referencia

- Spec: `docs-SEP/specs/fase-2/014-sprint-14-backoffice-operacional.md`
- Steps: `docs-SEP/steps-fase-2/backend/014-sprint-14-steps.md`
- Doc operacional: `docs-SEP/repos/sep-api/BACKOFFICE.md`
- ADRs: 0001, 0007
