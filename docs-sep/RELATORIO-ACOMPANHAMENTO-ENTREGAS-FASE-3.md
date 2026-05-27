# Relatorio de Acompanhamento de Entregas - Fase 3

## Objetivo

Este documento acompanha exclusivamente a Fase 3 do SEP. Ele consolida o que ficou pronto nas Fases 1 e 2, o que foi adiado para depois delas e os candidatos de escopo para as proximas sprints.

Este relatorio nao substitui o PRD, specs, steps, ADRs ou docs operacionais. Ele serve como painel executivo da Fase 3 e deve ser atualizado quando specs/steps forem criados, sprints forem iniciadas/concluidas ou pendencias forem reclassificadas.

## Status geral

| Campo | Valor atual |
|-------|-------------|
| Produto | SEP |
| Fase | Fase 3 - Jornadas e capacidades pos-Fase-2 |
| Status | Specs planejados; steps ainda just-in-time |
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
| 3 | Epic 10 - Jornada da empresa credora | Modelar e expor capacidades especificas da empresa que aporta recursos | Pode exigir backend novo antes ou em paralelo a web/mobile |
| 4 | Epic 11 - Administracao e governanca | Evoluir RBAC, parametros, cadastros mestres e auditoria administrativa | Carrega pendencia de multi-role `FINANCEIRO + BACKOFFICE` |
| 5 | Epic 15 - Pix | Automatizar desembolso, recebimento e conciliacao via Pix/Celcoin, consumindo `escrow` | Deve iniciar por recorte assistido de desembolso + recebimento |
| Paralela | Epic 16 - Infraestrutura AWS | Planejar ambientes remotos, RDS, EC2, deploy e observabilidade | Trilha tecnica habilitadora; nao precisa bloquear jornadas locais |

## Itens adiados das Fases 1 e 2

### Produto e jornadas

| Item | Origem | Acao recomendada na Fase 3 | Status |
|------|--------|-----------------------------|--------|
| Web das jornadas funcionais | Decisao Fase 2 backend-only | Planejar F-Sprints da Epic 13 a partir dos contratos estabilizados | Candidato |
| Mobile das jornadas funcionais | Epic 14 Fase Mobile 2+ | Planejar M-Sprints para tomador e credora, sem backoffice/admin mobile | Candidato |
| Jornada da empresa credora | Epic 10 | Definir contratos de oportunidades, carteira, aportes e operacoes financiadas | Candidato |
| Governanca avancada | Epic 11 | Definir RBAC evoluido, parametros e auditoria administrativa | Candidato |
| Pix assistido | Epic 15 | Detalhar providers, entidades, endpoints e webhooks antes da implementacao | Candidato |
| Infraestrutura AWS | Epic 16 | Planejar separadamente se houver necessidade de ambiente remoto | Candidato paralelo |

### Backend e integracoes

| Item | Origem | Acao recomendada na Fase 3 | Status |
|------|--------|-----------------------------|--------|
| Strategies reais de reprocesso de provider | Sprint 14 | Conectar strategies aos use cases reais dos modulos donos | Aberto/adiado |
| Handler real por provider/event no reprocesso webhook | Sprint 14 | Substituir processamento generico por roteamento real dos eventos suportados | Aberto/adiado |
| Race residual no anti-abuso de reprocesso | Sprint 14 | Avaliar `pg_advisory_xact_lock` se houver concorrencia operacional real | Aceito/documentado |
| Multi-role `FINANCEIRO + BACKOFFICE` | Sprint 14 / Epic 11 | Refatorar modelo de roles/permissoes antes de governanca avancada | Aberto/adiado |
| V34 nao idempotente | Sprint 14 | Criar hotfix de migration defensiva apenas se houver necessidade operacional | Aceito/adiado |
| OpenAPI/JavaDoc dos DTOs de role | Sprint 14 | Atualizar DTOs de role quando a governanca avancada entrar | Aberto/adiado |
| IT concorrente de recebimento | Sprint 15 | Criar teste explicito de concorrencia para `RegistrarRecebimentoUseCase` | Aberto/adiado |
| Retry/DLQ tecnico em listeners | Sprint 15 | Escalar falhas para backoffice ou fila tecnica em sprint de observabilidade | Aberto/adiado |
| Step-up estrito sem bypass MFA | Sprint 15 | Decidir ADR ou annotation `@RequireStepUpEstrita` antes de operacoes mais sensiveis | Aberto/adiado |
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

## Proximos passos

1. Escolher qual sprint da Fase 3 sera executada primeiro.
2. Criar o step just-in-time da primeira sprint aprovada.
3. Reclassificar os itens adiados acima como `entra na Fase 3`, `continua adiado`, `descartado` ou `dependencia externa`.
4. Atualizar este relatorio quando a primeira sprint entrar em execucao.

## Template para atualizacao

```md
### Atualizacao YYYY-MM-DD - Sprint/Task

- Status anterior:
- Acao realizada:
- Evidencia:
- Pendencias:
- Proximo passo:
```
