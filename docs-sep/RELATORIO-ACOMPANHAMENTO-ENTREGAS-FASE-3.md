# Relatorio de Acompanhamento de Entregas - Fase 3

## Objetivo

Este documento acompanha exclusivamente a Fase 3 do SEP. Ele consolida o que ficou pronto nas Fases 1 e 2, o que foi adiado para depois delas e os candidatos de escopo para as proximas sprints.

Este relatorio nao substitui o PRD, specs, steps, ADRs ou docs operacionais. Ele serve como painel executivo da Fase 3 e deve ser atualizado quando specs/steps forem criados, sprints forem iniciadas/concluidas ou pendencias forem reclassificadas.

## Status geral

| Campo | Valor atual |
|-------|-------------|
| Produto | SEP |
| Fase | Fase 3 - Jornadas e capacidades pos-Fase-2 |
| Status | Epics 10 e 11 no backend concluidos em `develop` (Sprints 16-18); Sprint 19 (Epic 15 — Pix foundation) mergeada em `develop` via PR #73 (`12ca083`); Sprint 20 (Pix desembolso assistido) mergeada em `develop` via PR #75 (`d40768a`); **Sprint 21 (Pix recebimento/conciliacao) em andamento** na branch `feature/sprint-21-pix-recebimento-conciliacao` (Tasks 21.1-21.2 commitadas, nao mergeadas) |
| Data de abertura | 2026-05-27 |
| Base de entrada | Fase 2 concluida em `main` nos repos `sep-api`, `sep-app` e `sep-mobile` |
| Fonte de fechamento anterior | [`RELATORIO-ACOMPANHAMENTO-ENTREGAS.md`](./RELATORIO-ACOMPANHAMENTO-ENTREGAS.md) |
| Responsavel por atualizacao | Agente/Dev responsavel pela task |

## Baseline de entrada

| Frente | Estado ao entrar na Fase 3 | Evidencia |
|--------|-----------------------------|-----------|
| Backend Fase 2 | Concluido em `main`; APIs de onboarding, credito, Open Finance, contratos, CCB, cobranca, inadimplencia e backoffice estabilizadas | PRD §29, CONTEXT, relatorio geral |
| Sprint 15 hardening | Concluida; 27 findings triagiados, 11 P1/P2 corrigidos, baseline JaCoCo formal, `escrow` branch coverage 50% -> 100% | `steps-fase-2/backend/015-sprint-15-hardening-steps.md` |
| Web foundation | F-Sprints 0-5 concluidas; shell autenticado Notion, auth real, MFA/refresh/step-up e telas iniciais prontas | PRD Epic 12, specs 100-104, CONTEXT |
| Mobile foundation | M-Sprints 0-5 concluidas; shell mobile, auth real, MFA/refresh e cascas tomador/credora prontas | PRD Epic 14, specs 200-204, CONTEXT |
| Repos de codigo | `develop` promovida para `main`; diff vazio entre `origin/main` e `origin/develop` nos tres repos de codigo | Verificacao 2026-05-27 apos `git fetch --all --prune` |

## Escopo candidato da Fase 3

| Prioridade candidata | Epic/frente | Objetivo | Observacao |
|----------------------|-------------|----------|------------|
| 1 | Epic 13 - Frontend de Jornadas | Implementar jornadas web consumindo APIs da Fase 2: tomador, financeiro, backoffice e governanca operacional | Candidata natural apos estabilizacao dos contratos backend |
| 2 | Epic 14 - Mobile SEP Fase 2+ | Implementar jornadas mobile do tomador e empresa credora | Mobile exclui financeiro interno, backoffice, administracao completa e auditoria |
| 3 | Epic 10 - Jornada da empresa credora | Modelar e expor capacidades especificas da empresa que aporta recursos | **Concluido no backend**: Sprint 16 (foundation) + Sprint 17 (oportunidades/carteira) em `develop` |
| 4 | Epic 11 - Administracao e governanca | Evoluir RBAC, parametros, cadastros mestres e auditoria administrativa | **Concluido no backend** (Sprint 18 mergeada, PR #71): RBAC cumulativo + parametros governados |
| 5 | Epic 15 - Pix | Automatizar desembolso, recebimento e conciliacao via Pix/Celcoin, consumindo `escrow` | **Foundation mergeada** (Sprint 19, PR #73 `12ca083`); **desembolso assistido mergeado** (Sprint 20, PR #75 `d40768a`: REST + step-up estrito + elegibilidade + idempotencia + provider/status + webhook + backoffice + auditoria, V47-V50). **Sprint 21 (recebimento/conciliacao) em andamento**: modelo de referencia Pix (Task 21.1, V51) + geracao de referencia para parcela elegivel (Task 21.2) commitados na branch |
| Paralela | Epic 16 - Infraestrutura AWS | Planejar ambientes remotos, RDS, EC2, deploy e observabilidade | Trilha tecnica habilitadora; nao precisa bloquear jornadas locais |

## Itens adiados das Fases 1 e 2

### Produto e jornadas

| Item | Origem | Acao recomendada na Fase 3 | Status |
|------|--------|-----------------------------|--------|
| Web das jornadas funcionais | Decisao Fase 2 backend-only | Planejar F-Sprints da Epic 13 a partir dos contratos estabilizados | Candidato |
| Mobile das jornadas funcionais | Epic 14 Fase Mobile 2+ | Planejar M-Sprints para tomador e credora, sem backoffice/admin mobile | Candidato |
| Jornada da empresa credora | Epic 10 | Definir contratos de oportunidades, carteira, aportes e operacoes financiadas | Concluido no backend (Sprints 16 e 17 em `develop`); UI web/mobile e movimentacao financeira real seguem fora do Epic 10 |
| Governanca avancada | Epic 11 | Definir RBAC evoluido, parametros e auditoria administrativa | **Concluido no backend** (Sprint 18 mergeada, PR #71) |
| Pix assistido | Epic 15 | Detalhar providers, entidades, endpoints e webhooks antes da implementacao | Candidato |
| Infraestrutura AWS | Epic 16 | Planejar separadamente se houver necessidade de ambiente remoto | Candidato paralelo |

### Backend e integracoes

| Item | Origem | Acao recomendada na Fase 3 | Status |
|------|--------|-----------------------------|--------|
| Strategies reais de reprocesso de provider | Sprint 14 | Conectar strategies aos use cases reais dos modulos donos antes de expor acao de reprocesso no web | Entra como precheck da F-Sprint 10 quando houver reprocesso |
| Handler real por provider/event no reprocesso webhook | Sprint 14 | Substituir processamento generico por roteamento real dos eventos suportados antes de liberar reprocesso operacional | Entra como precheck da F-Sprint 10 quando houver reprocesso |
| Race residual no anti-abuso de reprocesso | Sprint 14 | Avaliar `pg_advisory_xact_lock` se houver concorrencia operacional real | Aceito/documentado |
| Multi-role `FINANCEIRO + BACKOFFICE` | Sprint 14 / Epic 11 | Refatorar modelo de roles/permissoes antes de governanca avancada | **Resolvido na Sprint 18** (roles cumulativas) |
| V34 nao idempotente | Sprint 14 | Criar hotfix de migration defensiva apenas se houver necessidade operacional | Aceito/adiado |
| OpenAPI/JavaDoc dos DTOs de role | Sprint 14 | Atualizar DTOs de role quando a governanca avancada entrar | Aberto/adiado |
| IT concorrente de recebimento | Sprint 15 | Criar teste explicito de concorrencia para `RegistrarRecebimentoUseCase` | Aberto/adiado |
| Retry/DLQ tecnico em listeners | Sprint 15 | Escalar falhas para backoffice ou fila tecnica em sprint de observabilidade | Aberto/adiado |
| Step-up estrito sem bypass MFA | Sprint 15 | Decidir ADR ou annotation `@RequireStepUpEstrita` antes do desembolso Pix assistido | **Resolvido na Sprint 20**: criada `@RequireStepUpEstrito` (sem bypass; exige MFA ativo + token) e aplicada no `POST /api/v1/pix/desembolsos` |
| PDFBox `Standard14Fonts` deprecated | Sprint 15 | Migrar antes de upgrade PDFBox 3.1+ | Aberto/adiado |
| Truncamento auditavel de payload de assinatura | Sprint 15 | Refatorar `EventoAssinatura.truncar()` ou ampliar coluna com migration | Aberto/adiado |
| Retry de listeners Open Finance | Sprint 15 | Escalar falha pos-Resilience4j para fila/backoffice | Aberto/adiado |
| Auditoria de thresholds do motor de credito | Sprint 15 | Criar trilha de mudanca para parametros de score/risco | Aberto/adiado |
| Schema validation de `audit_log_seguranca.payload` | Sprint 15 | Criar `AuditPayloadSchema` e migration futura se necessario | Aberto/adiado |
| Refactor `AuthController.me()` | CONTEXT | Trocar acesso direto a repository por `ConsultarUsuarioUseCase` | Aberto/adiado |

### Qualidade, testes e operacao

| Item | Origem | Acao recomendada na Fase 3 | Status |
|------|--------|-----------------------------|--------|
| OOM em `PldFollowupIT` no full run | Sprint 14 | Ajustar `org.gradle.jvmargs=-Xmx2g` ou isolar suite pesada | Aberto/pre-existente |
| Testcontainers + Docker Engine 28+ | Fases 1/2 | Aguardar Testcontainers/docker-java compatível ou fixar estrategia alternativa | Aberto/adiado |
| WireMock E2E com provider Clicksign | Sprint 15 | Criar cobertura adapter/fake mais completa quando assinatura evoluir | Aberto/adiado |
| E2E cross-repo web + mobile + API | Sprint 15 | Planejar pipeline orquestrado em infra/observabilidade | Aberto/adiado |
| Refresh de collections Postman/Insomnia nao-backoffice | Sprint 15 | Fazer auditoria dedicada quando endpoints da Fase 3 forem planejados | Aberto/adiado |
| Branch protection nos tres repos | CONTEXT | Proteger `develop`, exigir PR/status checks e alinhar estrategia de merge em `main` | Aberto/operacional |
| Smoke real Celcoin sandbox | CONTEXT | Executar quando houver credenciais e alinhamento com contratos reais | Aberto/dependencia externa |

### Seguranca e mobile

| Item | Origem | Acao recomendada na Fase 3 | Status |
|------|--------|-----------------------------|--------|
| Migrar lib TOTP `samstevens` | Sprint 15 | Eliminar dependencia transitiva `httpclient` quando houver sprint de seguranca | Aberto/adiado |
| Plugin de biometria nativo | Sprint 5 / Mobile futuro | Instalar e validar na fase Android/iOS, nao no PWA | Aberto/adiado |
| WebAuthn/Passkeys | ADR 0010 / futuro | Manter como evolucao posterior de autenticacao forte | Futuro |
| ADR 0015 Capacitor 8.3.x | Sprint 15 | Aceitar/formalizar quando a trilha mobile reabrir | Proposto |

## Decisoes de entrada da Fase 3

| Data | Decisao | Fonte |
|------|---------|-------|
| 2026-05-27 | Planejamento da Fase 3 foi pausado para confirmar fechamento da Fase 2 | Conversa operacional |
| 2026-05-27 | Fase 2 foi considerada concluida em `main` apos merge manual e diff vazio entre `origin/main` e `origin/develop` nos tres repos de codigo | Verificacao local |
| 2026-05-27 | Este relatorio passa a ser o painel exclusivo de acompanhamento da Fase 3 | Solicitacao do usuario |
| 2026-05-27 | Specs da Fase 3 criados por projeto: 6 backend, 8 web e 6 mobile, todos com ate 6 tasks de implementacao | `specs/fase-3/README.md` |
| 2026-05-27 | Revisao documental da Fase 3 incorporada: step-up estrito virou precheck da Sprint 20, reprocessos web dependem de handlers reais, jornada credora explicita contrato de autorizacao e Sprint 19 evolui `EscrowProvider` existente | Revisao com subagent |
| 2026-05-28 | Step just-in-time da Sprint 17 criado para oportunidades, interesse e carteira da empresa credora | `steps-fase-3/backend/017-sprint-17-steps.md` |
| 2026-05-28 | Sprint 16 (Epic 10 foundation) concluida e mergeada em `develop` via PR #67 (squash `fec263e`); confirma a base da Sprint 17 | `repos/sep-api/CREDORES.md`, PR #67 |
| 2026-05-28 | Sprint 17 (Epic 10 oportunidades e carteira) concluida e mergeada em `develop` via PR #69 (merge `415c82a`); fecha o Epic 10 no backend | `repos/sep-api/CREDORES.md`, PR #69 |
| 2026-05-28 | Carteira nasce por associacao operacional assistida e explicita (admin, contrato `ASSINADO`); interesse nao vira carteira automaticamente; sem matching/aporte/Pix | Decisao com o usuario |
| 2026-05-28 | Divida tecnica aceita: use cases de `credores` dependem de repositories diretamente (padrao S16 + cobranca); refator de ports de persistencia adiado p/ hardening | Review manual Sprint 17 |
| 2026-05-28 | RBAC cumulativo: `roles` autoritativo + `usuario.role` principal denormalizada; claim JWT continua lista; consumo de parametros governados segue por properties (adocao incremental) | Sprint 18 |
| 2026-05-28 | use case -> repository direto confirmado como padrao do projeto (nao divida) tambem no modulo `governanca` | Review manual Sprint 18 |
| 2026-05-29 | Sprint 19 (Epic 15 — Pix foundation + EscrowProvider) mergeada em `develop` via PR #73 (`12ca083`): modulo `pix` (V45), webhook HMAC + idempotencia, auditoria (V46), providers Fake/Celcoin com WireMock | `repos/sep-api/PIX.md`, PR #73 |
| 2026-05-29 | Decisoes Sprint 19: `PixWebhookEvent` so hash do payload (minimizacao); idempotencia por `(provider,event_id)`; erros Celcoin traduzidos para excecoes de provider; OAuth fail-fast no boot; retry por tipo no YAML faz 4xx tambem reentrar (tradeoff de skeleton). Eventos de auditoria de transferencia/escrow de provider adiados p/ Sprints 20/21 | Review manual Sprint 19 |
| 2026-06-01 | Sprint 20 (Epic 15 — Pix desembolso assistido) mergeada em `develop` via PR #75 (`d40768a`): REST `/api/v1/pix/desembolsos` + step-up estrito (`@RequireStepUpEstrito`, sem bypass MFA) + elegibilidade por ports + idempotencia + provider/status + webhook de reconciliacao + backoffice (item + reprocesso seguro) + auditoria `PIX_TRANSFERENCIA_*` (V47-V50). Chave Pix nunca persistida em claro | `repos/sep-api/PIX.md`, PR #75 |
| 2026-06-01 | Decisoes/code review Sprint 20: anti-orphan real via `DesembolsoTransacaoService` (REQUIRES_NEW comita CRIADA antes do provider); reprocesso so reporta sucesso quando o provider foi de fato consultado; POST `/status` exige step-up (chama provider); reprocesso Pix nunca reenvia (chave nao persistida). Gate "step-up estrito sem bypass MFA" (precheck Sprint 20) resolvido | Review subagente + 2 reviews manuais |
| 2026-06-01 | Follow-ups Sprint 20: smoke E2E RestAssured full-chain (contrato ASSINADO + agenda + escrow + step-up token); gap escrow `external_id` para Celcoin real; collections Postman/Insomnia de desembolso; conciliacao automatica de recebimento (Sprint 21) | `repos/sep-api/PIX.md` §Pendencias |
| 2026-06-01 | Sprint 21 (Epic 15 — Pix recebimento/conciliacao) iniciada na branch `feature/sprint-21-pix-recebimento-conciliacao`. Task 21.1: `PixReferenciaRecebimento` (txid deterministico do SEP -> parcela; V51; status ATIVA/PAGA/EXPIRADA/CANCELADA/DIVERGENTE com transicoes guardadas; guarda so ids, sem entidades de `cobranca`) + evolucao de `PixRecebimento` (conciliar/registrarDivergencia/marcarFalhou) | commit `7ef9e4d` |
| 2026-06-01 | Sprint 21 Task 21.2: `GerarReferenciaRecebimentoPixUseCase` — txid controlado pelo SEP enviado ao `PixProvider.criarCobrancaRecebimento` (Fake sucesso/falha + Celcoin skeleton `POST /pix/charges` via WireMock); parcela lida por `CobrancaRecebimentoPixQueryPort` (valor em aberto calculado por `cobranca`, `pix` nao recalcula mora); idempotencia por parcela (1 ATIVA); anti-orphan (flush antes do provider -> corrida vira 409 sem cobranca orfa; falha do provider faz rollback); `ApiExceptionHandler` traduz `PixProviderException` (5xx->503/4xx->422/else->502). Suite 1669/0. Code review (`cavecrew-reviewer`): 1 hardening aplicado (`@Transactional(readOnly)` no adapter), demais findings FP/by-design | commits `f159510`/`02d20b0` |

## Sprints concluidas na Fase 3

### Atualizacao 2026-05-28 - Sprint 16 (Backend, Epic 10 - Jornada Credora Foundation)

- Status anterior: spec 016 planejada; modulo `credores` stub.
- Acao realizada: modulo `credores` (DDD + Hexagonal) implementado em 3 ciclos — dominio+persistencia (`EmpresaCredora`, `PerfilCredora`, VOs, V38), use cases de cadastro/consulta + elegibilidade derivada do onboarding PJ sem reexecutar KYB/PLD (porta read-only aditiva `ConsultarEmpresaParaCredoraQuery`), REST `/api/v1/credores` + auditoria (`CredoresAuditListener`, tipos `CREDORA_*`, V39). Mergeada em `develop` via PR #67 (squash `fec263e`).
- Evidencia: `repos/sep-api/CREDORES.md`; `EmpresaCredoraIT` 10 cenarios verdes; commits `81f31c2`/`95c48fa`/`d56822d`; PRD §Epic 10 e §30.
- Pendencias: auditoria de alteracao cadastral (sem use case de alteracao na foundation); aportes/oportunidades/carteira na Sprint 17.
- Proximo passo: Sprint 17 (oportunidades e carteira da credora, spec 017) — base confirmada em `develop`.

### Atualizacao 2026-05-28 - Sprint 17 (Backend, Epic 10 - Oportunidades e Carteira)

- Status anterior: spec 017 planejada; carteira/oportunidades inexistentes.
- Acao realizada: 3 ciclos — dominio (`OportunidadeInvestimento`/`InteresseCredora`/`OperacaoFinanciada`, V40), ports de leitura consumer-driven + adapters para `credito`/`contratos`/`cobranca` (sem alterar esses modulos), use cases (sync admin, interesse, carteira, associacao assistida com contrato `ASSINADO`), REST `/oportunidades` e `/carteira` + auditoria (`CredoresAuditListener`, V41). Mergeada em `develop` via PR #69 (merge `415c82a`).
- Evidencia: `repos/sep-api/CREDORES.md`; `CarteiraCredoraIT` + `CarteiraCredoraUseCaseTest` + `CarteiraCredoraDomainTest` (33 testes credores verdes); commits `2929fe8`/`5b8aab2`/`01b3837`/`681ba42`/`bfad652`; PRD §Epic 10 e §30.
- Pendencias: divida tecnica de ports de persistencia (hardening); followups N+1 carteira e sync sem paginacao; movimentacao financeira real fora do Epic 10.
- Proximo passo: Sprint 18 (Epic 11 — Administracao e governanca avancada / RBAC + parametros, spec 018).

### Atualizacao 2026-05-28 - Sprint 18 (Backend, Epic 11 - RBAC cumulativo + parametros)

- Status anterior: usuario single-role; pendencia `FINANCEIRO + BACKOFFICE`; sem catalogo de parametros governado.
- Acao realizada: 4 ciclos — (C1) `Usuario` multi-role (`Set<Role>` + tabela `usuario_role`, V42, principal denormalizada por precedencia); (C2) JWT/authorities/guards multi-role com compatibilidade + 12 consumidores migrados para `temRole`; (C3) novo modulo `governanca` com `ParametroOperacional` versionado/auditavel (V43, seed 11 params, lock pessimista + UNIQUE versao); (C4) endpoints admin de roles e parametros com step-up + auditoria (`USUARIO_ROLES_ALTERADAS`, `PARAMETRO_OPERACIONAL_ALTERADO`, V44). Implementada na branch `feature/sprint-18-governanca-rbac-parametros`, **pendente merge**.
- Evidencia: `docs-sep/SEGURANCA.md` §17; suite completa 1493/0 (`MultiRoleAuthorizationIT`, `GovernancaRbacIT`, `UsuarioRolesTest`, `GovernancaParametroIT` etc.); commits `65c6726`..`da267a4`; **mergeada em `develop` via PR #71 (merge `ab2c39a`)**.
- Pendencias: trocar consumo de properties por `ParametroOperacionalReader` nas regras (incremental); drop futuro da coluna `usuario.role`; ports de persistencia cross-codebase (divida aceita).
- Proximo passo: Sprint 19 (Epic 15 — Pix foundation + EscrowProvider, spec 019).

## Proximos passos

1. Concluir Sprint 21 (Epic 15 — Pix recebimento/conciliacao, spec/steps 021): Task 21.3 (webhook `RECEBIMENTO_PIX` com correlacao por txid + idempotencia), 21.4 (baixa de parcela + escrow via ports), 21.5 (backoffice de divergencias/reprocesso) e 21.6 (REST/OpenAPI + smoke E2E Fake + docs/collections). Tasks 21.1-21.2 ja commitadas na branch.
2. Tratar dividas tecnicas e followups acumulados (ports de persistencia, consumo de parametros governados, N+1) em sprint de hardening.

## Template para atualizacao

```md
### Atualizacao YYYY-MM-DD - Sprint/Task

- Status anterior:
- Acao realizada:
- Evidencia:
- Pendencias:
- Proximo passo:
```
