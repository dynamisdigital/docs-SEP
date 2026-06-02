# Steps - Sprint 15 - Hardening e Bug-Hunt

**Spec de origem**: sem spec formal. Sprint operacional pos-Fase-2.

Fontes de escopo:
- PRD/CONTEXT Fase 2 (itens abertos, adiados e fechamento da fase).
- [`docs-sep/SEGURANCA.md`](../../docs-sep/SEGURANCA.md) §14 (8 itens abertos).
- [`docs-sep/METRICAS-IMPLEMENTACAO.md`](../../docs-sep/METRICAS-IMPLEMENTACAO.md) (JaCoCo aspiracional).
- [`repos/sep-api/COBRANCA.md`](../../repos/sep-api/COBRANCA.md) §Limitacoes (11 itens).
- [`repos/sep-api/CONTRATOS.md`](../../repos/sep-api/CONTRATOS.md) §Limitacoes (8 itens).
- [`repos/sep-api/CREDITO.md`](../../repos/sep-api/CREDITO.md) §Limitacoes (6 itens).
- [`repos/sep-api/ONBOARDING.md`](../../repos/sep-api/ONBOARDING.md) §Limitacoes/callback tardio.

**Status**: a implementar.

**Objetivo geral**: encerrar Fase 2 com hardening cirurgico do `sep-api`. Executar bug-hunt automatizado nos 4 modulos criticos (cobranca, contratos, credito, onboarding), estabelecer baseline JaCoCo formal por modulo, fechar debitos conhecidos onde for viavel sem novo ADR de produto, sincronizar OpenAPI e zerar marcadores de tech debt. Nao adiciona feature de negocio. Reduz risco de carregar bugs latentes para Epic 13 (Frontend de Jornadas).

**Esforco total estimado**: 6-9 dias de Dev Senior. Variavel conforme tamanho da fila de findings da Task 15.1.

**Repo de destino**:
- `sep-api`: unico repo de codigo alterado nesta sprint.
- `docs-SEP`: working tree editado quando necessario. Operacao git continua manual.

**Branch sugerida**:
- `feature/sprint-15-hardening-bughunt`

**Pre-requisitos globais**:
- Sprint 14 mergeada em `develop` (fechamento documentado em PRD/CONTEXT).
- `sep-api` em `develop` atualizado a partir de `origin/develop`.
- Suite global verde no topo de `develop` antes da branch (baseline pos-14).
- Working tree limpo nos 3 repos.
- Acesso ao Postman/collections para sync OpenAPI.
- Docker rodando para Testcontainers.

**Numeracao de migrations**:
- Ultima aplicada (pos-Sprint 14): `V35__ampliar_audit_seguranca_tipo_backoffice.sql`.
- Sprint 15 reserva `V36`+ apenas se hotfix de schema for necessario. Candidata prevista: `V36__add_audit_payload_validation.sql` (Task 15.7) caso a validacao seja imposta em camada de banco. Default e validacao em camada Java sem migration.

**Fora de escopo**:
- Revisao juridica de PLD §8 (track legal separado).
- Frontend `sep-app` e mobile `sep-mobile` (escopo restrito a backend).
- Novos ADRs de produto: biometria nativa, WebAuthn, risk-based auth, Captcha, E2E cross-repo. Apenas ADR stub para Capacitor 8.3.x (Task 15.6).
- Spec formal em `specs/fase-2/`.
- Features novas (paginacao de `/recebimentos` em 15.4 e changes de validacao em 15.5 sao closures de debito conhecido, nao feature nova).
- BI, dashboards externos, SLA automatico.

**Protocolo obrigatorio por Task**:
- Implementar somente a Task liberada pelo usuario.
- Ao concluir implementacao e verificacao, parar em checkpoint pre-commit com arquivos alterados, testes executados, riscos e sugestao de commit Conventional.
- Aguardar `commit` ou aprovacao equivalente antes de stage/commit.
- Apos commit, rodar `chown -R mauricio:mauricio .git .claude` no `sep-api`.
- Fazer exatamente 1 code review automatizado da Task via subagente `cavecrew-reviewer`.
- Hotfix de findings do review: implementar, novo checkpoint pre-commit, aprovacao, commit. Sem novo review automatizado salvo pedido explicito.
- Pausar para review manual do usuario antes de iniciar a proxima Task.
- Atualizar PRD/CONTEXT, docs operacionais e metricas quando a task alterar status, comportamento ou divida conhecida.

**Skills obrigatorias na implementacao**:
- `coding-guidelines`: pensar antes de codar, simplicidade primeiro, mudanca cirurgica, execucao orientada a meta.
- `clean-code` (Robert C. Martin): nomes intencionais, funcoes pequenas, comentarios minimos, SRP, F.I.R.S.T. em testes.
- `design-patterns-java` (GoF): aplicar somente apos triangulacao; preferir recursos Java modernos (sealed, record, enum Singleton).
- `caveman:caveman-review` via subagente `cavecrew-reviewer` apos cada Task.
- `cavecrew-investigator`: principal ferramenta da Task 15.1 (bug-hunt).
- `simplify`: opcional na Task 15.10 (coverage uplift) para evitar inflar codigo apenas por metrica.

---

## Ordem de execucao recomendada

```text
15.0 (prechecks + JaCoCo baseline)
  |
  v
15.1 (bug-hunt cavecrew-investigator x4)
  |
  v
15.2 (triagem -> backlog dinamico P0/P1/P2)
  |
  +--> 15.3 (race / transactional audit)
  +--> 15.4 (N+1 + paginacao recebimentos)
  +--> 15.5 (validation gaps)
  +--> 15.6 (security hardening subset §14)
  +--> 15.7 (audit/PII schema validation)
  +--> 15.8 (cleanup tech debt)
  |
  v
15.9 (OpenAPI / roles sync)
  |
  v
15.10 (coverage uplift por modulo)
  |
  v
15.11 (SPRINT-15-PR.md + PRD/CONTEXT + METRICAS + AGENT.md)
```

- 15.0/15.1/15.2 sao gates obrigatorios. Sem baseline + findings triagiados, fixes ficam cegos.
- 15.3-15.8 sao paths disjuntos em arquivos distintos. Paralelizaveis. Decisao paralela vs sequencial fica no executor.
- 15.9 depende de qualquer mudanca de endpoint em 15.3-15.8.
- 15.10 vem ultimo porque coverage so estabiliza apos refactors.
- 15.11 fecha docs apos suite global verde.

---

## Task 15.0 - Prechecks e JaCoCo baseline

**Objetivo**: garantir que a sprint nasce de `develop` atualizado, com baseline verde, e produzir a primeira medicao formal de JaCoCo por modulo registrada em `METRICAS-IMPLEMENTACAO.md`.

**Esforco**: 2-3 horas.

**Pre-requisito**: Sprint 14 mergeada.

### Step 015.0.1 - Conferir estado Git do `sep-api`

```bash
cd <sep-api-root>
git fetch --all --prune
git status --short --branch
git rev-list --left-right --count HEAD...origin/develop
git log --oneline -5 origin/develop
```

**Verificacao**:
- Working tree limpo antes de criar branch.
- Branch local alinhada a `origin/develop`.
- Topo de `develop` aponta para o merge commit pos-Sprint 14.
- Se houver mudancas locais, identificar se sao do usuario. Nao reverter.

### Step 015.0.2 - Criar branch da sprint

```bash
cd <sep-api-root>
git switch develop
git pull --ff-only
git switch -c feature/sprint-15-hardening-bughunt
```

**Verificacao**:
- Branch criada a partir de `develop` atualizado.
- Se `git pull --ff-only` falhar, abortar e avisar o usuario.

### Step 015.0.3 - Rodar baseline backend

```bash
cd <sep-api-root>
./gradlew clean test
./gradlew bootJar
```

**Verificacao**:
- Suite passa antes de qualquer alteracao.
- Contagem de testes registrada no proprio step file e em `METRICAS-IMPLEMENTACAO.md`. Esperado pos-Sprint 14: contagem >= 1300 testes (extrapolacao do baseline pos-13 de 1246).
- Falha = abortar e levantar com o usuario.

### Step 015.0.4 - Gerar JaCoCo baseline

```bash
cd <sep-api-root>
./gradlew clean test jacocoTestReport
ls build/reports/jacoco/test/html/
```

**Verificacao**:
- Relatorio HTML gerado em `build/reports/jacoco/test/html/index.html`.
- Extrair % de linha e % de branch por **pacote raiz de modulo** (com.dynamis.sep_api.identity, .usuarios, .onboarding, .credito, .contratos, .cobranca, .backoffice, .escrow, .shared).
- Excluir do calculo: pacotes `config`, `dto`, `exception`, `MapperImpl` (ja excluidos no build.gradle).

### Step 015.0.5 - Registrar tabela de baseline

**Em `docs-sep/METRICAS-IMPLEMENTACAO.md`** substituido status "Em monitoramento" por tabela formal pos-Sprint 14 (2026-05-27).

### Baseline JaCoCo - sep-api - pos-Sprint 14 (2026-05-27)

Coletado em `./gradlew clean test jacocoTestReport` na branch `feature/sprint-15-hardening-bughunt`, suite 1421 testes / 0 falhas / 0 erros / 0 skipped.

| Modulo | Linhas cobertas | Linhas totais | Linha % | Branch % | Gate 70% (linhas) | Gate 70% (branches) |
|---|---:|---:|---:|---:|---|---|
| backoffice | 799 | 826 | 96,7 | 82,6 | OK | OK |
| cobranca | 1682 | 1779 | 94,5 | 77,9 | OK | OK |
| contratos | 1330 | 1416 | 93,9 | 76,2 | OK | OK |
| credito | 1073 | 1173 | 91,5 | 78,7 | OK | OK |
| escrow | 110 | 132 | 83,3 | 50,0 | OK | **GAP -20,0 pp** |
| identity | 957 | 1054 | 90,8 | 78,5 | OK | OK |
| onboarding | 1684 | 1824 | 92,3 | 74,1 | OK | OK |
| shared | 292 | 311 | 93,9 | 75,9 | OK | OK |
| usuarios | 133 | 138 | 96,4 | 90,9 | OK | OK |
| **GLOBAL** | **8060** | **8653** | **93,1** | **77,0** | OK | OK |

Notas:
- Modulos `pix`, `financeiro`, `credores` ainda stubs - fora da tabela.
- Gap real: `escrow` branches 50,0% (alvo da Task 15.10).
- Gate atual no `build.gradle` e LINE COVEREDRATIO 0.70 apenas; branches nao bloqueiam build hoje.

### Step 015.0.6 - Confirmar pontos de extensao

```bash
cd <sep-api-root>
grep -R "@SuppressWarnings\|@Deprecated\|TODO\|FIXME\|HACK" -n src/main/java
grep -R "@RequestBody" -n src/main/java | grep -v "@Valid"
grep -R "REQUIRES_NEW\|PESSIMISTIC_WRITE" -n src/main/java
grep -R "PreAuthorize\|RequireStepUp" -n src/main/java
find src/main/resources/db/migration -maxdepth 1 -type f | sort | tail -3
```

**Verificacao**:
- Lista de 5 marcadores conhecidos confirmada (3 `@Deprecated`, 1 TODO, 1 `@SuppressWarnings`).
- `@RequestBody` sem `@Valid` listados para a Task 15.5.
- Proximo numero livre de migration confirmado (`V36`).

### Definicao de pronto da Task 15.0

- [ ] Branch correta criada.
- [ ] Baseline backend verde com contagem de testes registrada.
- [ ] Relatorio JaCoCo gerado.
- [ ] Tabela de baseline JaCoCo publicada em METRICAS-IMPLEMENTACAO.md e replicada neste step file.
- [ ] Proximo numero de migration confirmado (`V36`).
- [ ] Lista de pontos de extensao para 15.3-15.8 identificada.

---

## Task 15.1 - Bug-hunt automatizado nos modulos criticos

**Objetivo**: produzir lista ranqueada de findings nos 4 modulos de maior superficie operacional (`cobranca`, `contratos`, `credito`, `onboarding`) usando o subagente `cavecrew-investigator`.

**Pre-requisito**: Task 15.0 concluida.

**Esforco**: 1 dia (8h, principalmente leitura).

### Step 015.1.1 - Investigar `cobranca`

**Acao**: spawn `cavecrew-investigator` com escopo:

- Race conditions em `RegistrarRecebimentoUseCase`, `RenegociarParcelaUseCase`, `AtualizarAgendaUseCase` e jobs.
- N+1 em queries com `Parcela`, `Agenda`, `Escrow`.
- Validation gaps em DTOs e VOs sealed do modulo.
- Exception swallow em listeners e jobs (catch generico sem rethrow ou log).
- PII leak em logs e audit.
- Idempotencia: cobertura de UNIQUE constraint + pre-lock + post-lock em todos os pontos de escrita financeira.

**Verificacao**:
- Relatorio recebido com tabela `arquivo:linha | severidade | descricao | fix proposto`.
- Esperado: 3-10 findings.

### Step 015.1.2 - Investigar `contratos`

Mesmo padrao da 15.1.1, escopo:
- Step-up bypass MFA `false` (CONTRATOS.md linha 364).
- WireMock E2E gaps (`ClicksignAssinaturaDigitalProviderIT`).
- Validacao de CPF/CNPJ placeholders.
- Webhook dedup 2-camadas (existsBy + saveAndFlush UNIQUE).
- Geracao de CCB PDFBox: leak de fonts, OOM, escopo de stream.

### Step 015.1.3 - Investigar `credito`

Escopo:
- Static limits do scoring heuristico.
- Open Finance callback tardio (`ProcessarCallbackConsentimentoUseCase:62` TODO).
- Concorrencia em decisao de proposta com 2-fase anti-orphan.
- Audit de OPEN_FINANCE_* (5 tipos).

### Step 015.1.4 - Investigar `onboarding`

Escopo:
- Representante PLD: mascara CPF em PII mas full CPF em audit (ONBOARDING.md linha 136-138).
- Webhook delays e replay.
- Race na criacao de `SolicitacaoOnboarding` com 2 documentos simultaneos.
- PLD 4 bases: tratamento de falha parcial.

### Step 015.1.5 - Consolidar tabela de findings

#### Findings consolidados (apos 4 cavecrew-investigator + validacao manual)

Severidades:
- **P0**: bug confirmado em fluxo critico (financeiro, seguranca, regulatorio). Bloqueia merge.
- **P1**: bug latente / risco real. Corrigir se viavel nesta sprint.
- **P2**: code smell acionavel. Candidato natural a follow-up.

Validacao manual aplicada: 2 candidatos P0 cobranca (`V25` agenda_pagamento.ativa) foram descartados — `V31__suportar_agenda_substituta.sql` ja adicionou a coluna e o UNIQUE parcial `WHERE ativa=TRUE`. 1 candidato P0 onboarding (CPF leak em `StatusOnboardingEmpresaView`) foi rebaixado para P1 — `OnboardingEmpresaWebMapper:60,69` aplica `mascararCpf()` antes da resposta REST; risco residual e layered masking falhar em consumer futuro.

| ID | Modulo | Arquivo:Linha | Sev. | Descricao | Fix proposto | Destino |
|---|---|---|---|---|---|---|
| 15F-001 | cobranca | RegistrarRecebimentoUseCase.java:78-116 | P1 | Pre-check sem lock; T1/T2 mesma `Idempotency-Key` podem passar pre-check antes de qualquer lock. DB UNIQUE constraint atua como defesa final. | Pos-validacao Sprint 15: lock pessimista em `findByIdForUpdate` + UNIQUE em `recebimento.idempotency_key` (V25 linha 86) ja serializam. Race remanescente apenas em parcelas distintas com mesma key (cliente bugado) — UNIQUE pega. | followup IT concorrente |
| 15F-002 | cobranca | ListarInadimplenciaUseCase.java:66-75 | P1 | N+1: loop de parcelas chama `contratoQuery.tomadorIdDoContrato(contratoId)` por iteracao. 100 parcelas = 101 queries. | JOIN com contrato ou query batch. | 15.4 |
| 15F-003 | cobranca | MarcarParcelaAtrasadaJob.java:29-33 | P1 | Cron sincronizado em 2+ instancias duplica `ParcelaAtrasouEvent`. Mitigacao "planejada" sem ShedLock/advisory lock. | ShedLock ou PostgreSQL advisory lock pre-job. | 15.3 |
| 15F-004 | cobranca | EscalarCobrancaUseCase.java:139-155 | P2 | `catch RuntimeException` provider, persiste FALHA sem retry/backoff. Email perdido ate proxima execucao. | Retry com backoff exponencial ou queue assincrona. | followup |
| 15F-005 | cobranca | ContratoAssinadoListener.java:81-93 | P2 | Assinatura ja commitada; falha de geracao de agenda silenciosa, "reprocessing futuro" nao existe. | Endpoint `/agenda/{contratoId}/reprocessar` ou webhook retry. | followup |
| 15F-006 | cobranca | MarcarParcelaInadimplenteJob.java:63 | P2 | `DIAS_INADIMPLENCIA = 90` hardcoded. Deveria estar em `ParametrosCobrancaProperties`. | Mover para properties com override em `application.yml`. | 15.8 |
| 15F-007 | cobranca | IniciarRenegociacaoUseCase.java:53 | P2 | `JANELA_RENEGOCIACAO = Duration.ofDays(7)` hardcoded (spec OK). | Property opcional se spec mudar. Manter por enquanto. | descartado (spec atual) |
| 15F-008 | cobranca | EscaladorCobrancaJob.java:120 + MarcarParcelaInadimplenteJob.java:227 | P2 | Valor monetario "R$ X" em map de notificacao. Audit log seguro (so IDs), mas template vars expoem em logs de provider. | Mascarar valor ou omitir de vars se nao usado em template. | 15.7 |
| 15F-009 | contratos | VersaoContratoResponse.java:18 | P1 | `List<ClausulaContratoResponse>` sem `@Valid` propagation em nested collection. | Adicionar `@Valid` no campo lista. | 15.5 |
| 15F-010 | contratos | AssinaturaIT.java:75-78 | P1 | Gap documentado: WireMock E2E com `provider=clicksign` ficou para sprint hardening. Hoje so via Fake provider. | Implementar IT WireMock cobrindo OAuth + envio + callback + erros HTTP. | 15.6 |
| 15F-011 | contratos | ProcessarWebhookAssinaturaUseCase.java:118-129 | P1 | `ContratoEstadoInvalidoException` capturada genericamente; callback falha silenciosa em REQUIRES_NEW sem retry. | Pos-validacao Sprint 15: catch e especifico de excecao de dominio (ContratoEstadoInvalidoException), marca outbox FALHOU e log.warn. Outras runtime exceptions sobem -> rollback automatico + outbox marcado FALHOU em retry. Design adequado. | followup (codigo correto, sem mudanca) |
| 15F-012 | contratos | ProcessarCallbackAssinaturaUseCase.java:85-97 | P1 | Lock ordering documentado em Fix C2 (contrato BEFORE envelope) mas sem `@Lock` explicito. Depende de padrao `carregarComLock` fragil. | Pos-validacao Sprint 15: `contratoLoader.carregarComLock` e `envelopeRepository.findByProviderAndIdEnvelopeExternoForUpdate` ja usam PESSIMISTIC_WRITE explicito. Pattern validado em code review C2 Sprint 11. | followup (codigo correto, sem mudanca) |
| 15F-013 | contratos | ContratoAceitoListener.java:42-51 | P2 | `RuntimeException` catch genérico sem DLQ ou retry exponencial; apenas warn log. | DLQ ou retry com backoff. | followup |
| 15F-014 | contratos | ProcessarCallbackAssinaturaUseCase.java:99-124 | P2 | TOCTOU entre `existsBy` e `saveAndFlush`; UNIQUE constraint cobre, mas janela de race detectavel. | Pos-validacao Sprint 15: dedup 2 camadas e intencional (Fix M2 review Task 11.5): existsBy = fast path; saveAndFlush + catch DataIntegrityViolationException = defesa de race. UNIQUE (envelope_id, id_evento_externo) V23 final guard. Design correto. | descartado (codigo correto) |
| 15F-015 | contratos | ContratoController.java:62-69 | P2 | Step-up bypass quando MFA=false documentado (CONTRATOS.md linha 364) sem mitigacao tecnica. | Implementar `@RequireStepUpEstrita` ou exigir MFA ativo em endpoints de contrato. | followup (decisao arquitetural) |
| 15F-016 | contratos | CcbGenerator.java:138,147,158,168 | P2 | `PDType1Font(Standard14Fonts.FontName.HELVETICA)` deprecated em PDFBox 3.1+. | Migrar para AFM fonts antes do upgrade PDFBox 3.1. | followup |
| 15F-017 | contratos | ProcessarWebhookAssinaturaUseCase.java:158-164 | P2 | Payload truncado em 1000 chars sem flag de truncation. Audit perde info se callback > 1KB. | Flag `payloadTruncado=true` + hash do payload original. | 15.7 |
| 15F-018 | credito | CriarPropostaCreditoUseCase.java:69 | P1 | DTO `@Min(1)` em `prazoMeses Integer` (nullable). Jakarta ignora `@Min` em null; use case converte null->0; factory rejeita com `PropostaInvalidaException` apenas em runtime. | `@NotNull @Min(1)` no DTO ou tipo primitivo `int`. | 15.5 |
| 15F-019 | credito | ProcessarCallbackConsentimentoUseCase.java:62 | P1 | TODO Sprint futura: NEGADO chegando apos AUTORIZADO so loga WARN. Estado fica AUTORIZADO incorretamente. | State machine no dominio + reverter para NEGADO quando callback chega tarde (provider source-of-truth). | 15.3 |
| 15F-020 | credito | OpenFinanceAutorizadoListener.java:35 | P1 | `catch RuntimeException` silencia falha de `ConsultarMovimentacaoOpenFinanceUseCase`. Autorizacao fica pendente sem retry. | Pos-validacao Sprint 15: provider Celcoin ja faz retry via Resilience4j antes de subir. Falha apos exhaust = log.error. Visibilidade operacional exige escalar para fila do backoffice (Sprint 14) — observabilidade dedicada vai em sprint futura. | followup |
| 15F-021 | credito | MotorRegrasCredito.java:78-79 | P2 | Thresholds (scorePreAprovacao/scoreAnalise) configuraveis via properties, mas sem auditoria de mudanca. | Log de startup com valores + commit hash; audit table opcional. | followup |
| 15F-022 | credito | PropostaAvaliacaoTransacional.java:140-141 | P2 | `deleteByPropostaId()` 2x sem bulk; 10 regras = 10 deletes + 10 inserts. Reavaliacao batch 100+ propostas = 1000+ deletes. | `deleteAllByPropostaIdIn(...)` ou batch JPQL. | 15.4 |
| 15F-023 | credito | OpenFinanceDadosRecebidosListener.java:35 | P2 | Mesmo padrao de swallow do 15F-020; reavaliacao com OF falha sem retry. | Pos-validacao Sprint 15: idem 15F-020. Escalar para Backoffice em sprint futura de observabilidade. | followup |
| 15F-024 | onboarding | StatusOnboardingEmpresaView.java:32 + ConsultarStatusOnboardingEmpresaUseCase.java:98 | P1 | CPF full em view de aplicacao. Web mapper ja mascara antes da resposta REST, mas qualquer consumer adicional (cache, job, novo controller) vaza CPF. Layered masking fragil. | Mascarar CPF no use case antes de criar view, ou separar `RepresentanteView` em variantes mascarada/full. | 15.7 |
| 15F-025 | onboarding | ProcessarCallbackPldUseCase.java:323-331 | P1 | Loop O(n·m) matching CPF de callback vs lista de representantes; `representanteRepository.save()` por match dentro do loop. | `Map<cpf, RepresentanteLegal>` antes do loop + batch save apos. | 15.4 |
| 15F-026 | onboarding | SolicitacaoOnboarding.java:66 (sem @Version) | P1 | Sem optimistic locking. Webhooks KYC+KYB+PLD concorrentes em ordem invertida podem causar lost update no `finalizar()`. | `@Version Long versao` + `LockModeType.PESSIMISTIC_WRITE` em queries de callback. | 15.3 |
| 15F-027 | onboarding | EnviarDocumentoUseCase.java:60 | P2 | Mensagem de erro expoe constante `TAMANHO_MAXIMO_BYTES` (10485760). | Mensagem generica "tamanho excede limite". | 15.7 |

#### Resumo de severidades pos-validacao

- **P0**: 0
- **P1**: 11 (15F-001, 002, 003, 009, 010, 011, 012, 018, 019, 020, 024, 025, 026)
- **P2**: 14 (restantes)
- **Descartado**: 1 (15F-007 spec atual)
- **Total real**: 27 findings reportaveis (alocados em 15.3-15.8 ou followup)

#### Alocacao final (re-confirmada apos execucao da Task 15.3)

Findings re-categorizados apos auditoria detalhada do codigo. Varios "P1" do bug-hunt automatizado foram validados como **codigo correto** com design defensivo ja implementado em sprints anteriores:

- **15.3 (race/transactional)** — implementados nesta sprint:
  - 15F-003: ShedLock alternativo via `PostgresAdvisoryJobLock` em `MarcarParcelaAtrasadaJob`.
  - 15F-019: state machine OF `revogar()` + `OpenFinanceRevogadoEvent` + audit `OPEN_FINANCE_REVOGADO` + V37 CHECK constraint.
  - 15F-026: `@Version` em `SolicitacaoOnboarding` + V36 coluna `versao`.
- **15.4 (N+1/perf)**: 15F-002, 022, 025 (3 findings).
- **15.5 (validation)**: 15F-009, 018 (2 findings).
- **15.6 (security §14)**: 15F-010 WireMock E2E + 3 itens conhecidos §14.
- **15.7 (audit/PII)**: 15F-008, 017, 024, 027 (4 findings).
- **15.8 (cleanup tech debt)**: 15F-006 + 5 marcadores conhecidos.
- **followup PRD/CONTEXT/docs operacionais** (P1 rebaixados pos-validacao + P2):
  - 15F-001: pos-validacao — UNIQUE em recebimento.idempotency_key + lock pessimista parcela ja serializam. IT concorrente fica em followup.
  - 15F-011, 012: pos-validacao — codigo atual ja eh defensivo (Fix C2/M2 review Sprint 11).
  - 15F-020, 023: provider ja faz retry Resilience4j. Visibilidade operacional via Backoffice fica em sprint futura.
  - 15F-004, 005, 013, 015, 016, 021.
- **descartado**: 15F-007 (spec atual), 15F-014 (codigo correto).

### Definicao de pronto da Task 15.1

- [ ] 4 relatorios `cavecrew-investigator` recebidos e arquivados (em `<sep-api-root>/.tmp/bughunt/` ou inline).
- [ ] Tabela consolidada presente neste step file com no minimo 1 finding por modulo.
- [ ] Cada finding com severidade atribuida.
- [ ] Coluna "Destino" preenchida na proxima Task (15.2).

---

## Task 15.2 - Triagem e backlog dinamico

**Objetivo**: classificar cada finding em corrigir-na-sprint, follow-up documentado em fonte permanente ou descartado-com-justificativa. Estabelece o plano real das Tasks 15.3-15.8.

**Pre-requisito**: Task 15.1 concluida.

**Esforco**: 2-3 horas.

### Step 015.2.1 - Ranquear findings

**Regras**:
- 100% dos P0 obrigatoriamente alocados em 15.3-15.8. Nao admite follow-up.
- P1: alocar conforme capacidade da sprint. Estimar esforco unitario antes de aceitar.
- P2: candidato natural a follow-up em PRD/CONTEXT ou doc operacional.

### Step 015.2.2 - Atribuir destino

Para cada finding, preencher coluna "Destino" na tabela 15.1.5:
- `15.3` = race / transactional.
- `15.4` = N+1 / performance.
- `15.5` = validation.
- `15.6` = security hardening.
- `15.7` = audit/PII.
- `15.8` = cleanup tech debt.
- `followup` = PRD/CONTEXT ou doc operacional com status Aberto/Adiado.
- `descartado` = justificativa textual obrigatoria.

### Step 015.2.3 - Atualizar Definicao de Pronto das Tasks 15.3-15.8

Para cada Task afetada, listar os IDs de findings alocados no rodape de DoD.

### Definicao de pronto da Task 15.2

- [ ] Toda linha da tabela 15.1.5 com coluna Destino preenchida.
- [ ] Nenhum P0 com destino `followup`.
- [ ] Descartados com justificativa textual.
- [ ] DoD das Tasks 15.3-15.8 atualizado.

---

## Task 15.3 - Race-condition e transactional boundary audit

**Objetivo**: fechar findings P0/P1 de concorrencia da 15.1 e auditar todos os `@Transactional(REQUIRES_NEW)`, `@Lock(PESSIMISTIC_WRITE)`, idempotency triple-layer.

**Pre-requisito**: Task 15.2 concluida.

**Esforco**: 1 dia.

**Arquivos provaveis**:
- `cobranca/application/usecase/RegistrarRecebimentoUseCase.java`
- `cobranca/application/usecase/RenegociarParcelaUseCase.java`
- `credito/application/usecase/DecidirPropostaUseCase.java`
- `backoffice/application/usecase/ReprocessarWebhookUseCase.java`
- Listeners com `REQUIRES_NEW` (cobranca, contratos, credito, escrow).

### Step 015.3.1 - Inventario de pontos transacionais

```bash
grep -R "REQUIRES_NEW\|PESSIMISTIC_WRITE\|@Lock\|saveAndFlush" -n src/main/java
```

**Verificacao**:
- Tabela: arquivo, metodo, propagation, lock, motivo. Salvar inline na Task.

### Step 015.3.2 - Validar UNIQUE constraints

- Para cada `saveAndFlush` em fluxo idempotente, confirmar UNIQUE no banco.
- Conferir migration de origem.

### Step 015.3.3 - Corrigir findings P0/P1 da 15.1

- Implementar fixes individualmente. Cada fix com teste especifico.
- Aplicar `clean-code`: funcoes pequenas, nomes claros, SRP.
- Aplicar `design-patterns-java` quando ja houver pattern instalado (Strategy de dispatch, Observer via `@EventListener`); nao introduzir pattern novo apenas porque foi mencionado.

### Step 015.3.4 - Teste concorrente em pontos criticos

- IT com 2 threads em `RegistrarRecebimentoUseCase` (cenario: 2 chamadas simultaneas com mesma `Idempotency-Key`).
- IT em `ReprocessarWebhookUseCase` para race anti-abuso 3/24h (item Aberto: "race anti-abuso best-effort").
- Asserts: 1 sucesso, 1 rejeicao com 409 ou no-op idempotente conforme contrato.

### Step 015.3.5 - Rodar suite

```bash
./gradlew test --tests "*IdempotencyIT*" --tests "*ConcorrenciaIT*"
./gradlew test
```

### Definicao de pronto da Task 15.3

- [ ] Inventario de pontos transacionais publicado.
- [ ] UNIQUE constraints confirmadas por ponto idempotente.
- [ ] Findings alocados fechados: **15F-001** (race pre-check recebimento), **15F-003** (multi-instance job ShedLock), **15F-011** (webhook swallow contratos), **15F-012** (lock ordering explicito), **15F-014** (TOCTOU dedup contratos), **15F-019** (state machine OF consentimento), **15F-020** (retry listener OF autorizado), **15F-023** (retry listener OF dados), **15F-026** (`@Version` em SolicitacaoOnboarding).
- [ ] ITs concorrentes verdes (2 threads em RegistrarRecebimentoUseCase + ReprocessarWebhookUseCase + callbacks Onboarding).
- [ ] Suite global verde.

---

## Task 15.4 - N+1 e performance de queries

**Objetivo**: fechar o item COBRANCA.md linha 301 (escrow join mascarado), auditar `credito`/`contratos`/`backoffice` com Hibernate statistics e adicionar paginacao em `GET /recebimentos`.

**Pre-requisito**: Task 15.2 concluida.

**Esforco**: 1 dia.

**Arquivos provaveis**:
- `cobranca/web/controller/RecebimentoController.java`
- `cobranca/application/usecase/ListarRecebimentosUseCase.java`
- `backoffice/application/usecase/ConsultarVisaoConsolidadaUseCase.java`
- `cobranca/infrastructure/persistence/EscrowJoinRepository.java` (ou equivalente)
- `src/test/.../application.properties` (test profile)

### Step 015.4.1 - Ativar Hibernate statistics em test profile

Em `src/test/resources/application.properties` (ou `application-test.yaml`):

```properties
spring.jpa.properties.hibernate.generate_statistics=true
logging.level.org.hibernate.stat=DEBUG
```

### Step 015.4.2 - IT com assert de query count

Helper `QueryCountAssertions` em `shared/testsupport/`:

```java
public final class QueryCountAssertions {
    private QueryCountAssertions() {}

    public static void assertQueryCountAtMost(EntityManager em, int max, Runnable action) {
        SessionFactory sf = em.getEntityManagerFactory().unwrap(SessionFactory.class);
        Statistics stats = sf.getStatistics();
        stats.clear();
        action.run();
        long count = stats.getPrepareStatementCount();
        if (count > max) {
            throw new AssertionError("Query count " + count + " > " + max);
        }
    }
}
```

ITs:
- `ListarRecebimentosUseCaseIT.deveListar_semNPlusOne` - max 3 queries para 10 recebimentos.
- `ConsultarVisaoConsolidadaUseCaseIT.deveConsolidar_semNPlusOne` - max 5 queries.

### Step 015.4.3 - Substituir join mascarado por fetch join ou `@EntityGraph`

- Identificar a query atual de escrow.
- Aplicar `@EntityGraph` no repository ou JPQL `JOIN FETCH`.
- Re-rodar IT da 15.4.2.

### Step 015.4.4 - Paginacao em `GET /recebimentos`

- Query params opcionais: `?page=0&size=20`. Default 0/20. Max size 100.
- Retornar `Page<RecebimentoDTO>` no controller (preservar shape ou usar `PagedModel`).
- Backward compat: sem params -> primeira pagina com 20 itens. Documentar em OpenAPI (Task 15.9).
- Audit log inalterado.

### Step 015.4.5 - Rodar suite + ITs

```bash
./gradlew test --tests "*NPlusOne*" --tests "*PaginacaoIT*"
./gradlew test
```

### Definicao de pronto da Task 15.4

- [ ] Hibernate statistics ativo em test profile.
- [ ] Helper `QueryCountAssertions` em `shared/testsupport/`.
- [ ] ITs de query count verdes para `ListarRecebimentos`, `ConsultarVisaoConsolidada` e `ListarInadimplencia`.
- [ ] Escrow join mascarado substituido por fetch join ou `@EntityGraph`.
- [ ] Paginacao `/recebimentos` operacional com backward compat.
- [ ] Findings alocados fechados: **15F-002** (N+1 ListarInadimplenciaUseCase), **15F-022** (deleteByPropostaId bulk credito), **15F-025** (Map de representantes PLD).
- [ ] OpenAPI atualizado (consolidado em 15.9).
- [ ] COBRANCA.md linha 301 marcada como resolvida.

---

## Task 15.5 - Validation gap audit

**Objetivo**: garantir `@Valid` em todos os `@RequestBody` e Bean Validation em VOs sealed; fechar gaps identificados em 15.1.

**Pre-requisito**: Task 15.2 concluida.

**Esforco**: 0.5-1 dia.

### Step 015.5.1 - Inventario de gaps

```bash
grep -R "@RequestBody" -n src/main/java | grep -v "@Valid"
```

Saida: lista de endpoints sem `@Valid`. Alimenta o checklist da 15.5.3.

### Step 015.5.2 - Auditoria de VOs sealed

- Para cada VO sealed (`StatusXXX`, `TipoXXX`, etc), confirmar factory que rejeita `null`/`blank`.
- Aplicar `clean-code`: factory com nome de intencao (`of`, `from`), excecao de dominio (nao `IllegalArgumentException` cru).

### Step 015.5.3 - Corrigir lacunas

Cada endpoint sem `@Valid`:
- Adicionar `@Valid` no parametro.
- Confirmar anotacoes em campos do DTO (`@NotBlank`, `@Size`, `@Pattern`, etc).
- Garantir tratamento via `ApiExceptionHandler` para `MethodArgumentNotValidException` -> ProblemDetail 400.

### Step 015.5.4 - Testes de validacao

- Para cada endpoint corrigido, criar/ampliar `@WebMvcTest` com payload invalido esperando 400.
- Asserts em codigo + mensagem + campo no ProblemDetail.

### Definicao de pronto da Task 15.5

- [ ] 100% dos `@RequestBody` com `@Valid` (excecao: webhooks raw `String payload` validam HMAC manual — documentar).
- [ ] VOs sealed com factory que rejeita null/blank.
- [ ] Testes 400 cobrindo cada endpoint corrigido.
- [ ] Findings alocados fechados: **15F-009** (`@Valid` em `List<ClausulaContratoResponse>`), **15F-018** (`prazoMeses` `@NotNull @Min(1)` ou `int` primitivo).
- [ ] 4 candidatos prioritarios de DTO real corrigidos: `BackofficeReprocessoController:62,85`, `AuthController:131,161`.
- [ ] Suite global verde.

---

## Task 15.6 - Security hardening (subset de §14 SEGURANCA)

**Objetivo**: fechar 3 itens de §14 que nao exigem novo ADR de produto:
1. Migrar `googleauth:1.5.0` para `dev.samstevens.totp` (Snyk httpclient 4.5.14 pin).
2. Upgrade Testcontainers para suportar Docker 28+.
3. ADR stub para Capacitor 8.3.x (decisao + contexto; implementacao em sprint mobile).

**Pre-requisito**: Task 15.2 concluida.

**Esforco**: 1-1.5 dia.

### Step 015.6.1 - Migrar lib TOTP

- Substituir dependencia em `build.gradle`:
  ```groovy
  // remover:
  // implementation 'com.warrenstrange:googleauth:1.5.0'
  // adicionar:
  implementation 'dev.samstevens.totp:totp:1.7.1'
  ```
- Adaptar `TotpProvider` (porta) e adapter atual em `identity/infrastructure/adapter/totp/`.
- Conferir ausencia de httpclient 4.5.13 (Snyk) na arvore: `./gradlew dependencies | grep httpclient`.
- Pinar httpclient 4.5.14 se ainda aparecer.

**Verificacao**:
- Testes de Sprint 5 (`TotpServiceTest`, `MfaLoginIT`, `TotpVerifyIT`) verdes apos troca.
- Mesma URI otpauth gerada. Documentar QR code shape em CONTEXT da seguranca.

### Step 015.6.2 - Upgrade Testcontainers

- Atualizar versao em `build.gradle` para >= 1.20.x (compativel Docker 28).
- Rodar `./gradlew test` localmente e verificar ITs com Postgres Testcontainers.

### Step 015.6.3 - ADR stub Capacitor 8.3.x

- Criar `docs-SEP/adr/0015-capacitor-8-3-x-stub.md`:
  - Status: **Proposto** (sera Aceito na sprint mobile).
  - Contexto: alinhar versao Capacitor com Ionic 8.4 + Angular 20.x.
  - Decisao: registrar 8.3.x como baseline; revalidar quando sprint mobile reabrir.
  - Consequencias: bloqueia upgrade prematuro de Capacitor 9+ sem nova revisao.

### Step 015.6.4 - Atualizar `SEGURANCA.md` §14

Marcar 3 itens como `[FECHADO Sprint 15]` no item correspondente:
- googleauth -> samstevens.
- Testcontainers Docker 28+.
- Capacitor ADR stub.

Os 5 itens restantes (biometria native, WebAuthn, risk-based, Captcha, E2E cross-repo) ficam em `Aberto` com nota "follow-up sprint mobile / sprint dedicada".

### Definicao de pronto da Task 15.6

- [ ] Dependencia samstevens substituindo googleauth.
- [ ] httpclient 4.5.14 confirmado.
- [ ] Testcontainers em versao compativel Docker 28+.
- [ ] ADR 0015 stub criado.
- [ ] SEGURANCA.md §14 atualizado com 3 itens fechados.
- [ ] Findings alocados fechados: **15F-010** (`AssinaturaIT` WireMock E2E com `provider=clicksign`).
- [ ] Suite global verde com novas libs.

---

## Task 15.7 - Audit payload schema validation e PII review

**Objetivo**: (a) substituir blacklist de `payload` em `audit_log_seguranca` por schema validation por `TipoEventoSeguranca`. (b) corrigir leak de CPF do representante PLD em audit.

**Pre-requisito**: Task 15.2 concluida.

**Esforco**: 1 dia.

### Step 015.7.1 - Schema validation por tipo de evento

- Criar `AuditPayloadSchema` (enum ou record por tipo de evento):
  - `LOGIN_OK` -> campos permitidos: `usuarioId`, `ip`, `userAgent`.
  - `REFRESH_REUSE_DETECTED` -> `familyId`, `tokenIdHash`.
  - `OPEN_FINANCE_CONSENTIMENTO_CONCLUIDO` -> `consentId`, `propostaId`.
  - etc.
- Em `RegistrarAuditUseCase`, validar payload com schema do tipo. Fail-fast em dev/test. Em prod: log + drop do campo invalido (decidir no review qual estrategia adotar).

**Aplicar `design-patterns-java`**: Strategy por tipo de evento ou Template Method. Recusar pattern se um simples `Map<TipoEvento, Set<String>>` resolve (regra de triangulacao).

### Step 015.7.2 - Migration opcional `V36`

Se a validacao for em camada Java apenas, **nao gerar migration**. Se exigir constraint de banco:

```sql
-- V36__add_audit_payload_validation.sql
-- Adicionar CHECK constraint em payload JSON conforme schema oficial.
```

Default: validacao Java sem migration.

### Step 015.7.3 - Fix CPF representante PLD em audit

- Localizar `ProcessarRepresentantePldUseCase` (ou equivalente Sprint 7).
- Aplicar mesma mascara CPF do PII no audit (`***.***.***-XX`).
- Confirmar com IT que dois campos (PII e audit) tem CPF mascarado consistentemente.

### Step 015.7.4 - Testes

- IT que tenta gravar audit com campo nao permitido -> rejeicao (dev) ou drop (prod).
- IT do fluxo PLD onde representante chega ao audit -> CPF mascarado.

### Definicao de pronto da Task 15.7

- [ ] `AuditPayloadSchema` operacional.
- [ ] Estrategia dev/prod definida e documentada.
- [ ] CPF representante mascarado em PII e audit.
- [ ] ITs verdes.
- [ ] Findings alocados fechados: **15F-008** (mascarar valor monetario em notification vars cobranca), **15F-017** (flag de truncation + hash em audit payload contratos), **15F-024** (mascarar CPF em `StatusOnboardingEmpresaView` ou variant), **15F-027** (mensagem generica sem expor constant em `EnviarDocumentoUseCase`).
- [ ] COBRANCA.md linha 302 (audit payload blacklist) marcada como resolvida.
- [ ] ONBOARDING.md (leak CPF representante) marcada como resolvida.

---

## Task 15.8 - Cleanup de tech debt

**Objetivo**: zerar os 5 marcadores conhecidos no codigo.

**Pre-requisito**: Task 15.2 concluida.

**Esforco**: 0.5 dia.

### Step 015.8.1 - `@Deprecated` em repositorios

- `AgendaPagamentoRepository.java:18,25` - 2 metodos.
- `SolicitacaoOnboardingRepository.java:19` - 1 metodo.
- `SolicitacaoOnboarding.java:109` - 1 metodo.

Para cada:
1. `grep -R "<nomeMetodo>" -n src/main src/test` para identificar callers.
2. Se sem callers: remover.
3. Se com callers: migrar callers para metodo substituto, depois remover. Aplicar `clean-code` Regra do Escoteiro - deixar callers mais limpos quando viavel sem aumentar escopo.

### Step 015.8.2 - TODO Open Finance revogacao tardia

- `ProcessarCallbackConsentimentoUseCase:62`.
- Opcoes:
  - **A**: implementar handler real de revogacao tardia (consentimento revogado fora da janela esperada).
  - **B**: converter em metodo `tratarRevogacaoTardia` com decisao explicita (log + audit + no-op) - documentar como deliberadamente passivo.
- Default: opcao B. Reabrir A em sprint dedicada se finding P0 da 15.1.3 exigir.

### Step 015.8.3 - `@SuppressWarnings("unchecked")` em backoffice

- `ConsultarVisaoConsolidadaUseCase:135`.
- Substituir cast nao-checado por:
  - DTO dedicado com generics resolvidos, ou
  - `TypeReference` (Jackson) se a origem for JSON, ou
  - record com campos tipados.
- Aplicar `clean-code`: nome do tipo deve revelar intencao.

### Step 015.8.4 - Verificacao

```bash
cd <sep-api-root>
grep -R "@Deprecated\|@SuppressWarnings\|TODO\|FIXME\|HACK\|XXX" -n src/main/java
```

Esperado: zero nos 5 pontos listados. Outros pontos novos sao avaliados caso a caso.

### Definicao de pronto da Task 15.8

- [ ] 3 `@Deprecated` removidos com callers migrados (`AgendaPagamentoRepository:18,25`, `SolicitacaoOnboardingRepository:19`, `SolicitacaoOnboarding:109`).
- [ ] TODO Open Finance: nota: o fix real do estado AUTORIZADO->NEGADO foi movido para 15.3 (15F-019). Nesta Task, apenas remover o comentario `TODO` apos 15.3 implementar o fluxo, ou converter em comentario de invariante de dominio explicativo.
- [ ] `@SuppressWarnings("unchecked")` substituido por tipo seguro em `ConsultarVisaoConsolidadaUseCase:135`.
- [ ] Findings alocados fechados: **15F-006** (`DIAS_INADIMPLENCIA` em properties).
- [ ] Grep final retorna zero matches nos 5 pontos esperados.
- [ ] Suite global verde.

---

## Task 15.9 - OpenAPI e role docs sync

**Objetivo**: fechar item "OpenAPI role docs outdated". Cross-check de cada endpoint vs role real do `@PreAuthorize`.

**Pre-requisito**: Tasks 15.3-15.8 concluidas.

**Esforco**: 0.5 dia.

### Step 015.9.1 - Gerar OpenAPI atual

```bash
cd <sep-api-root>
./gradlew bootRun &
curl -o /tmp/openapi-current.json http://localhost:8080/v3/api-docs
kill %1
```

### Step 015.9.2 - Cross-check role real

- Listar controllers + `@PreAuthorize` valor.
- Comparar com `@Operation` / `@SecurityRequirement` no mesmo metodo.
- Corrigir divergencias.

### Step 015.9.3 - Documentar mudancas das Tasks 15.4 e 15.5

- Paginacao `/recebimentos`: parametros `page`, `size`, exemplo de response.
- Endpoints corrigidos em 15.5: incluir cenarios 400.

### Step 015.9.4 - Atualizar collections

- Postman/Insomnia em `docs-SEP/repos/sep-api/collections/`.
- Garantir mesma role e payload.

### Definicao de pronto da Task 15.9

- [ ] OpenAPI alinhado com `@PreAuthorize` real.
- [ ] Paginacao `/recebimentos` documentada.
- [ ] Cenarios 400 documentados nos endpoints alterados.
- [ ] Collections sincronizadas.

---

## Task 15.10 - Coverage uplift por modulo

**Objetivo**: trazer todos os modulos ao gate 70% (linhas) partindo do baseline de 15.0.

**Pre-requisito**: Tasks 15.3-15.9 concluidas.

**Esforco**: 1-2 dias. Variavel conforme gap.

### Step 015.10.1 - Listar modulos abaixo de 70%

Pela tabela de 15.0.5, ordenar por gap absoluto descendente.

### Step 015.10.2 - Plano por modulo

Para cada modulo abaixo do gate:
- Identificar classes nao cobertas via JaCoCo HTML.
- Priorizar use cases > listeners > mappers > exceptions.
- Aplicar `clean-code` em testes (F.I.R.S.T.): Fast, Independent, Repeatable, Self-validating, Timely.
- Aplicar `simplify` para nao inflar codigo apenas por metrica.

### Step 015.10.3 - Escrever testes

- Preferir unit (`@DataJpaTest`, Mockito) a IT.
- Cobrir branches negativos primeiro (excecoes, validacoes).
- Cada teste com nome `deveX_quandoY`.

### Step 015.10.4 - Verificar gate

```bash
./gradlew test jacocoTestCoverageVerification
```

### Step 015.10.5 - Tratar gaps irrecuperaveis na sprint

Se um modulo ficar > 15pp do gate:
- Documentar em PRD/CONTEXT ou doc operacional com plano.
- Elevar gate gradualmente em vez de forcar (atualizar `build.gradle` se preciso, com motivo no commit).

### Step 015.10.6 - Atualizar METRICAS-IMPLEMENTACAO.md

- Substituir tabela baseline da 15.0 por tabela final pos-uplift.
- Indicar deltas por modulo.

### Definicao de pronto da Task 15.10

- [ ] Todos os modulos >= 70% OU excecao documentada em `METRICAS-IMPLEMENTACAO.md`.
- [ ] `jacocoTestCoverageVerification` verde.
- [ ] METRICAS-IMPLEMENTACAO.md atualizado com tabela final.
- [ ] Sem teste duplicado ou flaky introduzido.

---

## Task 15.11 - Empacotamento de docs e PR

**Objetivo**: fechar a sprint com docs sincronizados e PR description pronta.

**Pre-requisito**: Tasks 15.0-15.10 concluidas.

**Esforco**: 0.5 dia.

### Step 015.11.1 - Criar `SPRINT-15-PR.md`

Arquivo em `docs-SEP/repos/sep-api/SPRINT-15-PR.md`:

```markdown
# Sprint 15 - Hardening + Bug-Hunt

## Resumo
Bug-hunt cirurgico, fechamento de debitos conhecidos, baseline JaCoCo, sem nova feature.

## Tasks entregues
- 15.0 prechecks + JaCoCo baseline
- 15.1 bug-hunt em cobranca/contratos/credito/onboarding
- 15.2 triagem de findings
- 15.3 race / transactional audit
- 15.4 N+1 + paginacao /recebimentos
- 15.5 validation gap audit
- 15.6 security hardening §14 subset (TOTP samstevens, Testcontainers, ADR Capacitor stub)
- 15.7 audit payload schema validation + CPF representante mascarado
- 15.8 cleanup tech debt (5 marcadores zerados)
- 15.9 OpenAPI / roles sync
- 15.10 coverage uplift por modulo
- 15.11 empacotamento de docs

## Findings (resumo)
- P0: <n>, todos corrigidos.
- P1: <n>, <m> corrigidos, <k> em follow-up.
- P2: <n>, todos em follow-up.

## Baseline JaCoCo
- Pre-sprint: <preencher>
- Pos-sprint: <preencher>

## Migration
- <V36 ou nenhuma>

## Risco residual
- Itens P1/P2 em follow-up listados em PRD/CONTEXT ou no doc operacional afetado.

## Verificacao
- `./gradlew check` verde.
- Suite global verde.
```

### Step 015.11.2 - Atualizar PRD/CONTEXT e docs operacionais

- Fechar itens resolvidos (cobranca N+1, audit blacklist, race anti-abuso, OpenAPI roles, etc).
- Mover P2 e P1 nao resolvidos para Aberto/Adiado com IDs (15F-XXX).

### Step 015.11.3 - Atualizar `METRICAS-IMPLEMENTACAO.md`

- Tabela JaCoCo final.
- 3 itens §14 SEGURANCA fechados.
- Contagem de testes pre e pos sprint.

### Step 015.11.4 - Notas em `AGENT.md`

Adicionar nota operacional:
- Subagente `cavecrew-investigator` recomendado para sprints de hardening.
- Aplicar `clean-code` em testes (F.I.R.S.T.).
- Triangulacao GoF em refactor de coverage uplift.

### Step 015.11.5 - Confirmar working tree only em `docs-SEP`

```bash
cd <docs-SEP-root>
git status --short
```

Verificacao:
- Apenas arquivos modificados, sem commit nem push pelo agente.
- Reportar ao usuario lista de arquivos para commit manual.

### Definicao de pronto da Task 15.11

- [ ] `SPRINT-15-PR.md` criado e preenchido.
- [ ] PRD/CONTEXT e docs operacionais atualizados.
- [ ] METRICAS-IMPLEMENTACAO.md atualizado.
- [ ] AGENT.md com notas operacionais.
- [ ] Working tree `docs-SEP` reportado ao usuario, sem commit/push do agente.

---

## Definition of Done da Sprint 15

- [ ] Baseline JaCoCo formal registrado em METRICAS-IMPLEMENTACAO.md.
- [ ] Tabela de findings 15.1 publicada com triagem completa.
- [ ] P0 corrigidos; P1 corrigidos ou justificados; P2 em follow-up.
- [ ] 5 marcadores de tech debt removidos.
- [ ] 3 itens de §14 SEGURANCA fechados; restantes em follow-up explicito.
- [ ] Schema validation de audit payload operacional.
- [ ] CPF representante PLD mascarado em PII e audit.
- [ ] Paginacao `/recebimentos` documentada com backward compat.
- [ ] OpenAPI sincronizado com roles reais.
- [ ] Todos modulos >= 70% JaCoCo OU excecao registrada em `METRICAS-IMPLEMENTACAO.md`.
- [ ] PRD/CONTEXT + METRICAS + SPRINT-15-PR.md atualizados.
- [ ] Suite global verde com contagem registrada.
- [ ] Branch `feature/sprint-15-hardening-bughunt` pronta para PR para `develop`.

---

## Notas finais

- Push e PR sao manuais do desenvolvedor humano. O agente nao executa `git push` nem abre PR.
- Conventional Commits obrigatorio. Sugestao de prefixos: `fix(<modulo>)`, `perf(<modulo>)`, `chore(deps)`, `test(<modulo>)`, `docs(metricas)`, `refactor(<modulo>)`.
- Skills `coding-guidelines`, `clean-code` e `design-patterns-java` aplicadas em toda Task de codigo. `design-patterns-java` recusado em codigo trivial conforme regra de triangulacao.
- Em `docs-SEP`, agente edita working tree e nada mais.
