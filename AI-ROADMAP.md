# AI-ROADMAP.md - Mapa operacional para agentes de IA

Este arquivo orienta agentes de IA a encontrar rapidamente os documentos corretos para
implementacoes, reviews e duvidas no projeto SEP. Ele nao substitui PRD, ADRs, specs,
steps ou documentacao operacional: funciona como indice de navegacao por tipo de tarefa.

## Regra obrigatoria de manutencao

O `AI-ROADMAP.md` deve estar sempre atualizado.

- Toda mudanca que criar, mover, remover ou alterar a finalidade de documentacao relevante
  deve atualizar este roadmap no mesmo ciclo.
- Toda sprint concluida deve revisar este roadmap antes do fechamento.
- Todo fim de fase que disparar melhoria de codigo/bug hunt deve gerar um plano Markdown
  de tasks antes de qualquer implementacao.
- Todo novo modulo, doc operacional, spec, step, ADR, collection ou template relevante deve
  ser linkado aqui.
- Se este roadmap divergir da estrutura real, o agente deve corrigir a documentacao ou
  registrar a pendencia antes de encerrar a tarefa.
- Quando houver conflito, prevalecem PRD + ADRs; depois specs; depois steps; depois docs
  operacionais em `repos/`; por fim, este roadmap.

## Como usar

1. Identifique o tipo de tarefa recebida.
2. Leia o pacote correspondente abaixo, na ordem indicada.
3. Leia somente documentos adicionais que sejam necessarios para a tarefa.
4. Ao final, verifique se a tarefa criou ou alterou caminhos documentais que exigem atualizar
   este roadmap.

Leitura base para qualquer agente:

1. [`docs-sep/PRD.md`](docs-sep/PRD.md) - indice do PRD; leia o arquivo de fase relevante (`PRD-FASE-1.md`, `PRD-FASE-2.md` ou `PRD-FASE-3.md`).
2. [`docs-sep/CONTEXT.md`](docs-sep/CONTEXT.md) - indice do contexto; leia `CONTEXT-PARTE-1.md` e/ou `CONTEXT-PARTE-2.md` conforme a tarefa.
3. [`AGENT.md`](AGENT.md)
4. Este arquivo (`AI-ROADMAP.md`)

## Pacotes de leitura por tarefa

| Tarefa | Leia nesta ordem |
|--------|------------------|
| Implementacao backend | Base -> spec da sprint em `specs/` -> step em `steps-fase-*` -> docs do modulo em `repos/sep-api/` -> ADRs relevantes |
| Implementacao web | Base -> spec/step web -> `docs-sep/WEB-SCREENS-PLAN.md` -> `docs-sep/New Design System Sep.md` (design vigente; F-14 mergeada) -> `repos/sep-app/` |
| Implementacao mobile | Base -> spec/step mobile -> `docs-sep/MOBILE-SCREENS-PLAN.md` -> `docs-sep/New Design System Sep.md` (design vigente apos M-12) -> `repos/sep-mobile/` |
| Code review | Base -> spec da sprint -> step da task -> doc operacional do modulo -> diff/codigo -> testes existentes |
| Criar nova sprint/steps | Base -> PRD secao da sprint -> spec correspondente -> steps anteriores similares -> ADRs relevantes |
| Atualizacao documental | Base -> documento alvo -> documentos que apontam para ele -> este roadmap |
| Duvida de produto/regra | `docs-sep/PRD.md` + arquivo `PRD-FASE-*` relevante -> `docs-sep/CONTEXT.md` + parte relevante -> doc operacional do modulo -> spec da sprint |
| Integracao externa | Base -> ADR 0004 -> ADR 0008 quando houver WireMock -> doc operacional do modulo -> specs/steps da integracao |
| Seguranca/auth/step-up/auditoria | Base -> `docs-sep/SEGURANCA.md` -> specs/steps da Sprint 5 -> docs do modulo afetado |
| Metricas de implementacao | Base -> [`docs-sep/METRICAS-IMPLEMENTACAO.md`](docs-sep/METRICAS-IMPLEMENTACAO.md) -> step da sprint -> testes do repo |
| Status de sprint | Base -> PRD/CONTEXT da fase -> spec/step da sprint -> doc operacional do modulo -> PR description temporaria quando aplicavel |
| Fechamento de sprint | Step da sprint -> doc operacional do modulo -> PR description temporaria, se o PR real precisar -> PRD -> collections -> este roadmap |
| Melhoria de fim de fase / bug hunt | Base -> PRD/CONTEXT da fase -> steps/specs da fase -> docs operacionais -> metricas/testes -> [`TEMPLATE-PLANO-MELHORIA-FIM-DE-FASE.md`](docs-sep/TEMPLATE-PLANO-MELHORIA-FIM-DE-FASE.md) |

## Mapa por modulo

| Modulo/tema | Documentacao principal | Specs/steps principais | ADRs comuns |
|-------------|------------------------|------------------------|-------------|
| `identity` / seguranca | [`docs-sep/SEGURANCA.md`](docs-sep/SEGURANCA.md) | Sprint 5 em `specs/fase-2/`; multi-role na Sprint 18 (`specs/fase-3/018-*`) | 0001, 0007, 0009, 0010 |
| `usuarios` | PRD + specs das Sprints 2, 5, 8 e 18 (RBAC cumulativo) | `specs/fase-1/002-*`, `specs/fase-2/005-*`, `008-*`, `specs/fase-3/018-*` | 0001, 0007 |
| `governanca` (RBAC + parametros) | [`docs-sep/SEGURANCA.md`](docs-sep/SEGURANCA.md) §multi-role | [`018`](specs/fase-3/018-sprint-18-governanca-rbac-parametros.md) (mergeada, PR #71) | 0001, 0007 |
| `onboarding` KYC/KYB | [`repos/sep-api/ONBOARDING.md`](repos/sep-api/ONBOARDING.md) | Sprints 6 e 7 | 0004, 0007, 0008 |
| PLD | [`repos/sep-api/PLD.md`](repos/sep-api/PLD.md) | Sprint 7 | 0004, 0007, 0008 |
| `credito` | [`repos/sep-api/CREDITO.md`](repos/sep-api/CREDITO.md) | Sprints 8 e 9 | 0007, 0012 |
| Open Finance | [`repos/sep-api/OPEN-FINANCE.md`](repos/sep-api/OPEN-FINANCE.md) | Sprint 9 | 0004, 0008 |
| `contratos` | [`repos/sep-api/CONTRATOS.md`](repos/sep-api/CONTRATOS.md) + [`CCB.md`](repos/sep-api/CCB.md) | [`010`](steps-fase-2/backend/010-sprint-10-steps.md), [`011`](steps-fase-2/backend/011-sprint-11-steps.md) | 0004, 0006, 0007, 0013 |
| `cobranca` | [`repos/sep-api/COBRANCA.md`](repos/sep-api/COBRANCA.md) + [`NOTIFICACOES.md`](repos/sep-api/NOTIFICACOES.md) | [`012`](steps-fase-2/backend/012-sprint-12-steps.md) + [`013`](steps-fase-2/backend/013-sprint-13-steps.md) + [`023`](specs/fase-3/023-sprint-23-cobranca-historico-tomador.md)/[`steps`](steps-fase-3/backend/023-sprint-23-steps.md) (mergeada, PR #81) + [`024`](specs/fase-3/024-sprint-24-cobranca-renegociacao-tomador.md)/[`steps`](steps-fase-3/backend/024-sprint-24-steps.md) (mergeada, PR #83) + mobile [`209`](specs/fase-3/209-msprint-9-cobranca-mobile.md)/[`steps`](steps-fase-3/mobile/209-msprint-9-steps.md) | 0001, 0005, 0007, 0014 |
| `backoffice` | [`repos/sep-api/BACKOFFICE.md`](repos/sep-api/BACKOFFICE.md) | [`014`](steps-fase-2/backend/014-sprint-14-steps.md) + [`110`](steps-fase-3/web/110-fsprint-10-steps.md) | 0001, 0007 |
| Hardening pos-Fase-2 | [`docs-sep/METRICAS-IMPLEMENTACAO.md`](docs-sep/METRICAS-IMPLEMENTACAO.md) + PRD/CONTEXT Fase 2 | [`015`](steps-fase-2/backend/015-sprint-15-hardening-steps.md) | 0001, 0007, 0015 |
| `credores` | [`repos/sep-api/CREDORES.md`](repos/sep-api/CREDORES.md) + PRD Epic 10 | [`016`](specs/fase-3/016-sprint-16-credora-foundation.md) (implementada), [`017`](specs/fase-3/017-sprint-17-credora-oportunidades-carteira.md) (implementada), backend [`025`](steps-fase-3/backend/025-sprint-25-steps.md) (Gate I1 — `GET .../interesses/me`, mergeada em `develop` e `main` via PR #85), mobile [`210`](specs/fase-3/210-msprint-10-credora-mobile.md)/[`steps`](steps-fase-3/mobile/210-msprint-10-steps.md) (mergeada em `develop` PR #109 e `main` PR #110) | 0001, 0004, 0007 |
| `escrow` | [`repos/sep-api/PIX.md` §provider](repos/sep-api/PIX.md) (`EscrowProvider`, Sprint 19) + [`COBRANCA.md` §escrow](repos/sep-api/COBRANCA.md) (use case local Sprint 12) | Sprint 12 (parte local), [`019`](specs/fase-3/019-sprint-19-pix-foundation-escrow-provider.md) (implementada), [`021`](specs/fase-3/021-sprint-21-pix-recebimento-conciliacao.md) (implementada) | 0005, 0007 |
| `pix` / `financeiro` | [`repos/sep-api/PIX.md`](repos/sep-api/PIX.md) (Sprint 19 foundation + Sprint 20 desembolso + Sprint 21 recebimento) + [`repos/sep-app/README.md` §Pix](repos/sep-app/README.md) (web) + PRD Epic 15 | [`019`](specs/fase-3/019-sprint-19-pix-foundation-escrow-provider.md) (implementada), [`020`](specs/fase-3/020-sprint-20-pix-desembolso-assistido.md) + [`step 020`](steps-fase-3/backend/020-sprint-20-steps.md) (implementada), [`021`](specs/fase-3/021-sprint-21-pix-recebimento-conciliacao.md) + [`step 021`](steps-fase-3/backend/021-sprint-21-steps.md) (implementada), [`113`](specs/fase-3/113-fsprint-13-pix-web.md) + [`step 113`](steps-fase-3/web/113-fsprint-13-steps.md) (web, mergeada PR #53 -> develop), backend [`026`](specs/fase-3/026-sprint-26-pix-leitura-owner-scoped.md) + [`step 026`](steps-fase-3/backend/026-sprint-26-steps.md) (leitura owner-scoped P1-P3; mergeada `develop` PR #87 + `main` PR #88), mobile [`211`](specs/fase-3/211-msprint-11-pix-mobile.md) + [`step 211`](steps-fase-3/mobile/211-msprint-11-steps.md) (implementada na branch `feature/msprint-11-pix-mobile`, pendente de merge; Gates P1-P3 fechados pela Sprint 26 backend, mergeada) | 0004, 0005, 0007, 0008 |
| Observabilidade / logs / CloudWatch | [`docs-sep/OBSERVABILIDADE.md`](docs-sep/OBSERVABILIDADE.md) | [`022`](specs/fase-3/022-sprint-22-observabilidade-operacional.md) + [`step 022`](steps-fase-3/backend/022-sprint-22-steps.md) | 0016 |
| Web | [`repos/sep-app/README.md`](repos/sep-app/README.md) + [`repos/sep-app/DESIGN-SYSTEM.md`](repos/sep-app/DESIGN-SYSTEM.md) + [`docs-sep/New Design System Sep.md`](<docs-sep/New Design System Sep.md>) | `specs/fase-1/100-*` a `104-*`; `specs/fase-3/106-*` a `115-*`; `steps-fase-1/web/`; `steps-fase-3/web/` | 0002, 0003, 0011 |
| Mobile | [`repos/sep-mobile/README.md`](repos/sep-mobile/README.md) + [`docs-sep/MOBILE-SCREENS-PLAN.md`](docs-sep/MOBILE-SCREENS-PLAN.md) + [`docs-sep/New Design System Sep.md`](<docs-sep/New Design System Sep.md>) | `specs/fase-1/200-*` a `204-*`; `specs/fase-3/206-*` a `212-*`; `steps-fase-1/mobile/`; `steps-fase-3/mobile/206-*`, `207-*`, `208-*`, `209-*`, `210-*`, `211-*`, `212-*` | 0003, 0009, 0010, 0011, 0015 |

## Se a tarefa menciona...

| Termo na tarefa | Comece por |
|-----------------|------------|
| contrato, aceite, formalizacao | [`repos/sep-api/CONTRATOS.md`](repos/sep-api/CONTRATOS.md) + [`108`](specs/fase-3/108-fsprint-8-formalizacao-web.md) + [`step 108`](steps-fase-3/web/108-fsprint-8-steps.md) |
| CCB, assinatura digital, Clicksign, PDF assinado | [`repos/sep-api/CCB.md`](repos/sep-api/CCB.md) + [`CONTRATOS.md` §Sprint 11](repos/sep-api/CONTRATOS.md) + [`108`](specs/fase-3/108-fsprint-8-formalizacao-web.md) + [`step 108`](steps-fase-3/web/108-fsprint-8-steps.md) |
| proposta, parecer, score, motor de credito | [`repos/sep-api/CREDITO.md`](repos/sep-api/CREDITO.md) + [`107`](specs/fase-3/107-fsprint-7-credito-open-finance-web.md) + [`step 107`](steps-fase-3/web/107-fsprint-7-steps.md) |
| Open Finance, consentimento, movimentacao | [`repos/sep-api/OPEN-FINANCE.md`](repos/sep-api/OPEN-FINANCE.md) + [`107`](specs/fase-3/107-fsprint-7-credito-open-finance-web.md) + [`step 107`](steps-fase-3/web/107-fsprint-7-steps.md) |
| cobranca, parcelas, agenda, recebimento, idempotency-key, escrow movimentacao | [`repos/sep-api/COBRANCA.md`](repos/sep-api/COBRANCA.md) + [`012-sprint-12-steps.md`](steps-fase-2/backend/012-sprint-12-steps.md) + [`109-fsprint-9-steps.md`](steps-fase-3/web/109-fsprint-9-steps.md) |
| inadimplencia, renegociacao, notificacao de cobranca, Zenvia, SMS | [`repos/sep-api/COBRANCA.md`](repos/sep-api/COBRANCA.md) + [`repos/sep-api/NOTIFICACOES.md`](repos/sep-api/NOTIFICACOES.md) + [`013-sprint-13-steps.md`](steps-fase-2/backend/013-sprint-13-steps.md) + [`109-fsprint-9-steps.md`](steps-fase-3/web/109-fsprint-9-steps.md) |
| fila operacional, backoffice, reprocesso, dashboard interno | [`repos/sep-api/BACKOFFICE.md`](repos/sep-api/BACKOFFICE.md) + [`014-sprint-14-steps.md`](steps-fase-2/backend/014-sprint-14-steps.md) + [`110-fsprint-10-steps.md`](steps-fase-3/web/110-fsprint-10-steps.md) |
| empresa credora, cadastro credora, elegibilidade credora | [`repos/sep-api/CREDORES.md`](repos/sep-api/CREDORES.md) + [`016`](specs/fase-3/016-sprint-16-credora-foundation.md) (backend implementado) + web [`111`](specs/fase-3/111-fsprint-11-credora-web.md) + [`step 111`](steps-fase-3/web/111-fsprint-11-steps.md) + [`repos/sep-app/README.md` §credora](repos/sep-app/README.md) (jornada web implementada — branch local `feature/fsprint-11-credora-web`; cadastro/perfil/oportunidades/interesse/carteira) |
| oportunidades, carteira, interesse, operacao financiada da credora | [`repos/sep-api/CREDORES.md`](repos/sep-api/CREDORES.md) + [`017`](specs/fase-3/017-sprint-17-credora-oportunidades-carteira.md) + web [`111`](specs/fase-3/111-fsprint-11-credora-web.md) + [`repos/sep-app/README.md` §credora](repos/sep-app/README.md) |
| Pix, desembolso, recebimento Pix, conciliacao Pix, leitura owner-scoped (backend) | [`repos/sep-api/PIX.md`](repos/sep-api/PIX.md) + [`019`](specs/fase-3/019-sprint-19-pix-foundation-escrow-provider.md) + [`020`](specs/fase-3/020-sprint-20-pix-desembolso-assistido.md) + [`021`](specs/fase-3/021-sprint-21-pix-recebimento-conciliacao.md) + [`026`](specs/fase-3/026-sprint-26-pix-leitura-owner-scoped.md) (P1-P3 tomador/credora) |
| Pix web, desembolso/recebimento/divergencia no app | [`repos/sep-app/README.md` §Pix](repos/sep-app/README.md) + [`113`](specs/fase-3/113-fsprint-13-pix-web.md) + [`step 113`](steps-fase-3/web/113-fsprint-13-steps.md) |
| Pix mobile, status de desembolso/pagamento da parcela/operacao credora, M-Sprint 11 | [`211`](specs/fase-3/211-msprint-11-pix-mobile.md) + [`step 211`](steps-fase-3/mobile/211-msprint-11-steps.md); Gates backend P1-P3 fechados pela Sprint 26 ([`026`](specs/fase-3/026-sprint-26-pix-leitura-owner-scoped.md), mergeada `develop` PR #87 + `main` PR #88); M-11 mobile implementada na branch `feature/msprint-11-pix-mobile` (P1 contrato + P2 parcela + P3 carteira), pendente de merge |
| KYC, KYB, documentos, Celcoin onboarding | [`repos/sep-api/ONBOARDING.md`](repos/sep-api/ONBOARDING.md) |
| PLD, COAF, OFAC, background check | [`repos/sep-api/PLD.md`](repos/sep-api/PLD.md) |
| MFA, TOTP, refresh, step-up, auditoria de seguranca | [`docs-sep/SEGURANCA.md`](docs-sep/SEGURANCA.md) |
| multi-role, roles cumulativas, FINANCEIRO+BACKOFFICE, parametros operacionais, governanca | [`docs-sep/SEGURANCA.md`](docs-sep/SEGURANCA.md) §multi-role + [`018`](specs/fase-3/018-sprint-18-governanca-rbac-parametros.md) |
| governanca web, roles na UI, parametros operacionais web, /app/admin | [`112`](specs/fase-3/112-fsprint-12-governanca-web.md) (mergeada PR #51 -> develop) + [`step 112`](steps-fase-3/web/112-fsprint-12-steps.md) + [`repos/sep-app/README.md`](repos/sep-app/README.md) §Administracao e governanca |
| tela web, Angular, design Apple/Notion | [`docs-sep/WEB-SCREENS-PLAN.md`](docs-sep/WEB-SCREENS-PLAN.md) + [`docs-sep/New Design System Sep.md`](<docs-sep/New Design System Sep.md>) quando envolver UI/design atual |
| New Design System Web, F-Sprint 14, redesign web | [`114`](specs/fase-3/114-fsprint-14-new-design-system-web.md) (mergeada, PR #48 -> develop) + [`step 114`](steps-fase-3/web/114-fsprint-14-steps.md) + [`repos/sep-app/DESIGN-SYSTEM.md`](repos/sep-app/DESIGN-SYSTEM.md) |
| Aplicacao do design system web, F-Sprint 15, login/registro/dashboard/shell, tiles/chips/gradiente | [`115`](specs/fase-3/115-fsprint-15-aplicacao-design-system-web.md) (mergeada, PR #55 -> develop) + [`step 115`](steps-fase-3/web/115-fsprint-15-steps.md) + [`repos/sep-app/DESIGN-SYSTEM.md`](repos/sep-app/DESIGN-SYSTEM.md) |
| mobile, Ionic, Capacitor, biometria | [`docs-sep/MOBILE-SCREENS-PLAN.md`](docs-sep/MOBILE-SCREENS-PLAN.md) + [`docs-sep/New Design System Sep.md`](<docs-sep/New Design System Sep.md>) quando envolver UI/design |
| Aplicacao do design system mobile, M-Sprint 12 (implementada), splash/login/homes/shell/tabs, dark mode | [`212`](specs/fase-3/212-msprint-12-new-design-system-mobile.md) + [`step 212`](steps-fase-3/mobile/212-msprint-12-steps.md) + [`115`](specs/fase-3/115-fsprint-15-aplicacao-design-system-web.md) + [`docs-sep/New Design System Sep.md`](<docs-sep/New Design System Sep.md>) + [`repos/sep-mobile/README.md`](repos/sep-mobile/README.md) §Implementacao |
| credito mobile, propostas mobile, Open Finance mobile, M-Sprint 7 | [`207`](specs/fase-3/207-msprint-7-credito-mobile.md) + [`step 207`](steps-fase-3/mobile/207-msprint-7-steps.md) + [`repos/sep-api/CREDITO.md`](repos/sep-api/CREDITO.md) + [`repos/sep-api/OPEN-FINANCE.md`](repos/sep-api/OPEN-FINANCE.md) + [`repos/sep-mobile/README.md`](repos/sep-mobile/README.md) |
| formalizacao mobile, contrato mobile, aceite mobile, CCB mobile, M-Sprint 8 | [`208`](specs/fase-3/208-msprint-8-formalizacao-mobile.md) + [`step 208`](steps-fase-3/mobile/208-msprint-8-steps.md) + [`repos/sep-api/CONTRATOS.md`](repos/sep-api/CONTRATOS.md) + [`repos/sep-api/CCB.md`](repos/sep-api/CCB.md) + [`repos/sep-mobile/README.md`](repos/sep-mobile/README.md) (mergeada em `develop` pela PR #105 e promovida a `main` pela PR #106) |
| cobranca mobile, parcelas mobile, recebimentos mobile, renegociacao mobile, M-Sprint 9 | [`209`](specs/fase-3/209-msprint-9-cobranca-mobile.md) (mergeada, PR #107 develop / #108 main) + [`step 209`](steps-fase-3/mobile/209-msprint-9-steps.md) + backend B1 [`023`](specs/fase-3/023-sprint-23-cobranca-historico-tomador.md)/[`steps`](steps-fase-3/backend/023-sprint-23-steps.md) (mergeada PR #81) + B2 [`024`](specs/fase-3/024-sprint-24-cobranca-renegociacao-tomador.md)/[`steps`](steps-fase-3/backend/024-sprint-24-steps.md) (mergeada PR #83) + [`COBRANCA.md`](repos/sep-api/COBRANCA.md) + [`repos/sep-mobile/README.md` §M-9](repos/sep-mobile/README.md) |
| credora mobile, empresa credora mobile, oportunidades mobile, interesse mobile, carteira mobile, M-Sprint 10 | [`210`](specs/fase-3/210-msprint-10-credora-mobile.md) + [`step 210`](steps-fase-3/mobile/210-msprint-10-steps.md) + [`repos/sep-api/CREDORES.md`](repos/sep-api/CREDORES.md) + [`docs-sep/MOBILE-SCREENS-PLAN.md`](docs-sep/MOBILE-SCREENS-PLAN.md) §8; acesso por autenticacao + presenca em `/credores/me`, sem role `CREDORA`; **mergeada em `develop` via PR #109 (`f51e6be`) e em `main` via PR #110 (`4f88c6b`)**; Gate I1 fechado pela Sprint 25 backend ([`025`](steps-fase-3/backend/025-sprint-25-steps.md), `GET .../interesses/me`, PR #85); tab por presença via `router` (não `ion-tab-button` href) |
| pipeline, CI, deploy | [`docs-sep/ci-pipelines/README.md`](docs-sep/ci-pipelines/README.md) |
| logs, observabilidade, correlationId, traceId, CloudWatch, Actuator | [`docs-sep/OBSERVABILIDADE.md`](docs-sep/OBSERVABILIDADE.md) + [`022`](specs/fase-3/022-sprint-22-observabilidade-operacional.md) + [`step 022`](steps-fase-3/backend/022-sprint-22-steps.md) + ADR 0016 |
| metricas, produtividade, progresso, DORA, SPACE, dashboard da sprint | [`docs-sep/METRICAS-IMPLEMENTACAO.md`](docs-sep/METRICAS-IMPLEMENTACAO.md) |
| acompanhamento, status de sprint, indicadores para stakeholders | PRD/CONTEXT da fase + step da sprint + doc operacional do modulo + [`docs-sep/METRICAS-IMPLEMENTACAO.md`](docs-sep/METRICAS-IMPLEMENTACAO.md) |

## Checklists rapidos

### Antes de implementar

- Verificar cadeia Git antes de iniciar a nova task: `main` mergeada em `develop` e `develop` contendo a task/sprint finalizada anterior; se houver pendencia, registrar e aguardar aprovacao antes de implementar.
- Confirmar spec e step da sprint/task.
- Confirmar ADRs que governam a decisao tecnica.
- Confirmar doc operacional do modulo, se existir.
- Verificar se a mudanca altera contrato REST, migration, evento, provider, collection ou regra de seguranca.
- Planejar atualizacao documental junto da implementacao quando houver mudanca de comportamento.
- Se a tarefa vier de melhoria de fim de fase, confirmar que existe plano Markdown aprovado pelo usuario.

### Antes de fazer code review

- Ler spec, step e doc operacional do modulo.
- Comparar diff contra regras de arquitetura, seguranca, ownership, transacoes e testes esperados.
- Priorizar bugs, regressao comportamental, falta de testes e divergencia documental.
- Verificar se migrations, collections, PR description e docs foram atualizados quando necessario.

### Antes de responder duvida

- Identificar se a pergunta e sobre produto, arquitetura, codigo atual ou processo.
- Para produto: PRD + CONTEXT.
- Para arquitetura: ADRs + AGENT.
- Para comportamento implementado: doc operacional + codigo atual.
- Sinalizar quando houver divergencia entre documentacao e codigo.

### Antes de fechar sprint

- Marcar DoD no step da sprint.
- Confirmar que a task/sprint concluida foi integrada em `develop` antes de iniciar a proxima task; se ainda nao foi, registrar pendencia no checkpoint/PR.
- Atualizar doc operacional do modulo em `repos/<repo>/`.
- Criar PR description temporaria quando aplicavel; se materializada como `repos/<repo>/SPRINT-*-PR.md`, apagar esse arquivo ao iniciar a sprint seguinte.
- Atualizar PRD quando a sprint for concluida.
- Atualizar collections Postman/Insomnia se endpoints mudaram.
- Revisar este roadmap.

### Antes de iniciar nova fase

- Verificar se a fase anterior foi marcada como concluida no PRD/CONTEXT e nos docs operacionais afetados.
- Se o usuario solicitar melhoria de fim de fase, trabalhar em modo plano e criar um arquivo `docs-sep/PLANO-MELHORIA-FIM-FASE-<N>.md` baseado no template.
- Classificar achados em bugs P0/P1, melhorias pequenas, dividas aceitas e backlog adiado.
- Aguardar aprovacao explicita antes de implementar qualquer task do plano.

## Nao faca

- Nao crie pastas `docs/` dentro de `sep-api`, `sep-app` ou `sep-mobile`.
- Nao duplique conteudo longo do PRD, specs ou docs operacionais neste roadmap.
- Nao use o PRD para detalhe operacional que pertence a `repos/<repo>/`.
- Nao assuma regra de negocio sem fonte documental ou codigo atual.
- Nao deixe este arquivo apontando para documento removido, renomeado ou obsoleto.
