# Sprint 15 — Hardening + Bug-Hunt

**Branch**: `feature/sprint-15-hardening-bughunt`
**Base**: `develop`
**Repo**: `sep-api`

## Summary

Sprint operacional pos-Fase 2 dedicada a hardening cirurgico do backend. Bug-hunt automatizado nos 4 modulos criticos (cobranca, contratos, credito, onboarding) via `cavecrew-investigator`, baseline JaCoCo formal estabelecida, debitos conhecidos fechados onde viavel sem novo ADR de produto. Nenhuma feature nova de negocio.

## Test plan

- [ ] CI verde: `./gradlew check`
- [ ] Suite global verde: 1429 testes / 0 falhas / 0 erros (+6 vs pre-Sprint 15)
- [ ] Baseline JaCoCo registrada em `docs-SEP/docs-sep/METRICAS-IMPLEMENTACAO.md`
- [ ] Todos modulos com codigo de producao acima de 70% em ambos linha e branch
- [ ] Sem regressao em fluxos existentes (cobranca, contratos, credito, onboarding)

## Mudancas por modulo

### `credito`

- **15F-019**: state machine `OpenFinance` aceita transicao `AUTORIZADO -> NEGADO` via `ConsentimentoOpenFinance.revogar()`. Open Finance Brasil permite revogacao tardia pelo detentor; provider notifica callback NEGADO tardio.
  - Novo `OpenFinanceRevogadoEvent` (semantica distinta de `OpenFinanceNegadoEvent`).
  - Audit listener grava `OPEN_FINANCE_REVOGADO` (V37 amplia CHECK constraint).
  - Remove TODO em `ProcessarCallbackConsentimentoUseCase:62`.
- **15F-022**: `PropostaAvaliacaoTransacional.persistirTrilha` usa `regraRepository.saveAll(list)` em vez de loop `save()` — habilita Hibernate batch-insert.
- **15F-018**: `CriarPropostaCreditoCommand.prazoMeses` promovido a `int` primitivo; remove fallback `null->0` perigoso no use case. Controller ja exigia `@NotNull @Min(1)`.

### `cobranca`

- **15F-003**: novo `PostgresAdvisoryJobLock` em `shared/infrastructure/job` coordena execucao unica de jobs em multi-instance via `pg_try_advisory_lock`, sem nova dependencia. Aplicado em `MarcarParcelaAtrasadaJob` com `LOCK_KEY` estavel.
- **15F-002**: `ContratoCobrancaQueryPort.tomadoresPorContratoIds(Collection)` resolve em batch via `findAllById`. `ListarInadimplenciaUseCase` indexa contratoIds em `LinkedHashSet` e faz 1 query batch (antes: N queries em loop). Record interno `ParcelaElegivel` cacheia `ChronoUnit.DAYS`.
- **15F-006**: constante `DIAS_INADIMPLENCIA = 90` em `MarcarParcelaInadimplenteJob` movida pra `ParametrosCobrancaProperties.diasInadimplencia` (`@Min(1)` default 90); sobreescritura via `app.cobranca.dias-inadimplencia`.
- `AgendaPagamentoRepository`: remove `findByContratoId`/`existsByContratoId` (`@Deprecated` Sprint 13). 8 callers migrados pra `*AndAtivaTrue`.

### `onboarding`

- **15F-026**: `@Version long versao` em `SolicitacaoOnboarding` rejeita lost update em callbacks KYC/KYB/PLD concorrentes. V36 adiciona coluna `versao BIGINT NOT NULL DEFAULT 0`.
- **15F-025**: `ProcessarCallbackPldUseCase.processarAlvos` pre-indexa representantes em `Map<cpf, List<RepresentanteLegal>>`; lookup O(1) substitui scan O(n) por alvo; `saveAll` batch.
- **15F-024**: `ConsultarStatusOnboardingEmpresaUseCase.mapearRepresentante` mascara CPF na borda do application layer (defesa em profundidade; web mapper continua mascarando — idempotente).
- **15F-027**: `EnviarDocumentoUseCase` mensagem 400 generica `"Documento excede o tamanho maximo permitido"` em vez de expor constante `TAMANHO_MAXIMO_BYTES`.
- `SolicitacaoOnboardingRepository`: remove `existsByCpfAndStatusIn` (`@Deprecated` Sprint 7). Caller migrado pra `existsByDocumentoAndStatusIn` (cobre CPF + CNPJ).
- `SolicitacaoOnboarding`: remove factory `criar` (`@Deprecated` Sprint 7). 18 callers em testes migrados pra `criarPessoa`.

### `backoffice`

- **OpenAPI**: 7 endpoints ganham mencao explicita de role aceita (`FINANCEIRO/BACKOFFICE/ADMIN`) em `@Operation.description` e `@ApiResponse 403`. Fecha item RELATORIO "OpenAPI role docs outdated".
- `ConsultarVisaoConsolidadaUseCase`: novo overload `resilienteLista` type-safe substitui cast com `@SuppressWarnings("unchecked")` do helper generico.

### `escrow`

- **Task 15.10**: novo `EscrowDomainValidationTest` (6 testes) cobre branches negativos de `ContaEscrow.criar`, `Wallet.creditar` e `MovimentacaoEscrow.criarRecebimento`. Eleva branch coverage do modulo de **50,0% → 100,0%**.

### `shared`

- Novo `PostgresAdvisoryJobLock` em `infrastructure/job/` (helper de coordenacao multi-instance).
- `TipoEventoSeguranca`: adicionado `OPEN_FINANCE_REVOGADO` (V37 amplia CHECK constraint).

### `identity`

- `AuthController.refresh/logout`: `@Valid` revertido pos-review (`@RequestBody(required=false)` com DTOs `@NotBlank` quebraria fallback cookie quando body `{}` enviado).

## Migrations

- `V36__add_versao_solicitacao_onboarding.sql` — coluna `versao BIGINT NOT NULL DEFAULT 0` (15F-026).
- `V37__ampliar_audit_seguranca_tipo_open_finance_revogado.sql` — amplia `chk_audit_seguranca_tipo` com `OPEN_FINANCE_REVOGADO` (15F-019).

## Baseline JaCoCo (pos-Sprint 15)

| Modulo | Linha % | Branch % |
|---|---:|---:|
| backoffice | 96,5 | 82,4 |
| cobranca | 94,4 | 77,7 |
| contratos | 93,9 | 76,2 |
| credito | 91,1 | 78,5 |
| escrow | 86,4 | **100,0** |
| identity | 90,8 | 78,5 |
| onboarding | 92,2 | 73,9 |
| shared | 93,3 | 75,3 |
| usuarios | 96,4 | 90,9 |

Modulos `pix`, `financeiro` e `credores` permanecem stubs (4 arquivos cada).

## Findings (resumo)

- **P0**: 0
- **P1**: 11 — todos endereçados (3 fechados com fix + 8 re-categorizados pos-validacao como codigo correto ou followup com justificativa).
- **P2**: 14 — 4 fechados com fix; 10 distribuidos entre followup, descartado e codigo correto.
- **Followups**: 13 itens documentados em `docs-sep/RELATORIO-ACOMPANHAMENTO-ENTREGAS.md` §"Riscos e pendencias".

Tabela completa em `docs-SEP/steps-fase-2/backend/015-sprint-15-hardening-steps.md` §15.1.5.

## Decisoes pos-validacao

- **15F-001, 011, 012, 020, 023**: codigo atual ja eh defensivo (lock pessimista, UNIQUE, dedup 2 camadas, retry Resilience4j). Movidos pra followup.
- **15F-014**: dedup intencional (Fix M2 review Sprint 11). Descartado.
- **15F-009**: response DTO; `@Valid` so se aplica a request body. Descartado.
- **15F-008**: logs nao expoem `vars` (validado em providers). Descartado.
- **15F-017**: solucao com sufixo `[TRUNCATED:N]` quebrava coluna `payload_resumo VARCHAR(1000)` (review). Reverso aplicado; movido pra followup.
- **samstevens/Testcontainers/WireMock E2E**: escopo desproporcional ao Sprint cirurgico; followup com justificativa em SEGURANCA.md §14.

## ADRs

- **ADR 0015 (Proposto)**: baseline mobile Capacitor 8.3.x. Sera Aceito quando Sprint Mobile reabrir.

## Notas operacionais

- Sprint executou 11 Tasks com **6 ciclos hotfix de cavecrew-reviewer** + **0 ciclos hotfix manual do usuario** ate este checkpoint.
- Subagente `cavecrew-investigator` introduzido na Task 15.1 — recomendado pra sprints de hardening em sprints futuras.
- Protocolo Task → checkpoint pre-commit → commit → cavecrew-reviewer → hotfix (se findings) → pausa review manual mantido em todas as 11 Tasks.

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
