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

1. [`docs-sep/PRD.md`](docs-sep/PRD.md)
2. [`docs-sep/CONTEXT.md`](docs-sep/CONTEXT.md)
3. [`AGENT.md`](AGENT.md)
4. Este arquivo (`AI-ROADMAP.md`)

## Pacotes de leitura por tarefa

| Tarefa | Leia nesta ordem |
|--------|------------------|
| Implementacao backend | Base -> spec da sprint em `specs/` -> step em `steps-fase-*` -> docs do modulo em `repos/sep-api/` -> ADRs relevantes |
| Implementacao web | Base -> spec/step web -> `docs-sep/WEB-SCREENS-PLAN.md` -> `docs-sep/DESIGN-apple.md` ou `docs-sep/DESIGN-notion.md` -> `repos/sep-app/` |
| Implementacao mobile | Base -> spec/step mobile -> `docs-sep/MOBILE-SCREENS-PLAN.md` -> `docs-sep/DESIGN-notion.md` -> `repos/sep-mobile/` |
| Code review | Base -> spec da sprint -> step da task -> doc operacional do modulo -> diff/codigo -> testes existentes |
| Criar nova sprint/steps | Base -> PRD secao da sprint -> spec correspondente -> steps anteriores similares -> ADRs relevantes |
| Atualizacao documental | Base -> documento alvo -> documentos que apontam para ele -> este roadmap |
| Duvida de produto/regra | `docs-sep/PRD.md` -> `docs-sep/CONTEXT.md` -> doc operacional do modulo -> spec da sprint |
| Integracao externa | Base -> ADR 0004 -> ADR 0008 quando houver WireMock -> doc operacional do modulo -> specs/steps da integracao |
| Seguranca/auth/step-up/auditoria | Base -> `docs-sep/SEGURANCA.md` -> specs/steps da Sprint 5 -> docs do modulo afetado |
| Metricas de implementacao | Base -> [`docs-sep/METRICAS-IMPLEMENTACAO.md`](docs-sep/METRICAS-IMPLEMENTACAO.md) -> step da sprint -> relatorios/testes do repo |
| Acompanhamento de entregas | Base -> [`docs-sep/RELATORIO-ACOMPANHAMENTO-ENTREGAS.md`](docs-sep/RELATORIO-ACOMPANHAMENTO-ENTREGAS.md) -> [`HTML`](docs-sep/RELATORIO-ACOMPANHAMENTO-ENTREGAS.html) -> step da sprint |
| Fechamento de sprint | Step da sprint -> doc operacional do modulo -> PR description temporaria, se o PR real precisar -> PRD -> collections -> este roadmap |
| Melhoria de fim de fase / bug hunt | Base -> PRD/CONTEXT da fase -> relatorio de acompanhamento -> steps/specs da fase -> docs operacionais -> [`TEMPLATE-PLANO-MELHORIA-FIM-DE-FASE.md`](docs-sep/TEMPLATE-PLANO-MELHORIA-FIM-DE-FASE.md) |

## Mapa por modulo

| Modulo/tema | Documentacao principal | Specs/steps principais | ADRs comuns |
|-------------|------------------------|------------------------|-------------|
| `identity` / seguranca | [`docs-sep/SEGURANCA.md`](docs-sep/SEGURANCA.md) | Sprint 5 em `specs/fase-2/` e `steps-fase-2/backend/` | 0001, 0007, 0009, 0010 |
| `usuarios` | PRD + specs das Sprints 2, 5 e 8 | `specs/fase-1/002-*`, `specs/fase-2/005-*`, `008-*` | 0001, 0007 |
| `onboarding` KYC/KYB | [`repos/sep-api/ONBOARDING.md`](repos/sep-api/ONBOARDING.md) | Sprints 6 e 7 | 0004, 0007, 0008 |
| PLD | [`repos/sep-api/PLD.md`](repos/sep-api/PLD.md) | Sprint 7 | 0004, 0007, 0008 |
| `credito` | [`repos/sep-api/CREDITO.md`](repos/sep-api/CREDITO.md) | Sprints 8 e 9 | 0007, 0012 |
| Open Finance | [`repos/sep-api/OPEN-FINANCE.md`](repos/sep-api/OPEN-FINANCE.md) | Sprint 9 | 0004, 0008 |
| `contratos` | [`repos/sep-api/CONTRATOS.md`](repos/sep-api/CONTRATOS.md) + [`CCB.md`](repos/sep-api/CCB.md) | [`010`](steps-fase-2/backend/010-sprint-10-steps.md), [`011`](steps-fase-2/backend/011-sprint-11-steps.md) | 0004, 0006, 0007, 0013 |
| `cobranca` | [`repos/sep-api/COBRANCA.md`](repos/sep-api/COBRANCA.md) + [`NOTIFICACOES.md`](repos/sep-api/NOTIFICACOES.md) | [`012`](steps-fase-2/backend/012-sprint-12-steps.md) (implementada) + [`013`](steps-fase-2/backend/013-sprint-13-steps.md) | 0001, 0005, 0007, 0014 |
| `backoffice` | [`repos/sep-api/BACKOFFICE.md`](repos/sep-api/BACKOFFICE.md) | [`014`](steps-fase-2/backend/014-sprint-14-steps.md) | 0001, 0007 |
| `escrow` | [`repos/sep-api/COBRANCA.md` §escrow](repos/sep-api/COBRANCA.md) (use case publico Sprint 12) + specs futuras | Sprint 12 (parte local) e Epic 15 (Celcoin) | 0005, 0007 |
| `financeiro` / Pix | PRD + specs futuras | Sprints futuras | 0005, 0007 |
| Web | [`repos/sep-app/README.md`](repos/sep-app/README.md) | `specs/fase-1/100-*` a `104-*`; `steps-fase-1/web/` | 0002, 0003, 0011 |
| Mobile | [`repos/sep-mobile/README.md`](repos/sep-mobile/README.md) | `specs/fase-1/200-*` a `204-*`; `steps-fase-1/mobile/` | 0003, 0009, 0010, 0011 |

## Se a tarefa menciona...

| Termo na tarefa | Comece por |
|-----------------|------------|
| contrato, aceite, formalizacao | [`repos/sep-api/CONTRATOS.md`](repos/sep-api/CONTRATOS.md) |
| CCB, assinatura digital, Clicksign, PDF assinado | [`repos/sep-api/CCB.md`](repos/sep-api/CCB.md) + [`CONTRATOS.md` §Sprint 11](repos/sep-api/CONTRATOS.md) |
| proposta, parecer, score, motor de credito | [`repos/sep-api/CREDITO.md`](repos/sep-api/CREDITO.md) |
| Open Finance, consentimento, movimentacao | [`repos/sep-api/OPEN-FINANCE.md`](repos/sep-api/OPEN-FINANCE.md) |
| cobranca, parcelas, agenda, recebimento, idempotency-key, escrow movimentacao | [`repos/sep-api/COBRANCA.md`](repos/sep-api/COBRANCA.md) + [`012-sprint-12-steps.md`](steps-fase-2/backend/012-sprint-12-steps.md) |
| inadimplencia, renegociacao, notificacao de cobranca, Zenvia, SMS | [`repos/sep-api/COBRANCA.md`](repos/sep-api/COBRANCA.md) + [`repos/sep-api/NOTIFICACOES.md`](repos/sep-api/NOTIFICACOES.md) + [`013-sprint-13-steps.md`](steps-fase-2/backend/013-sprint-13-steps.md) |
| fila operacional, backoffice, reprocesso, dashboard interno | [`repos/sep-api/BACKOFFICE.md`](repos/sep-api/BACKOFFICE.md) + [`014-sprint-14-steps.md`](steps-fase-2/backend/014-sprint-14-steps.md) |
| KYC, KYB, documentos, Celcoin onboarding | [`repos/sep-api/ONBOARDING.md`](repos/sep-api/ONBOARDING.md) |
| PLD, COAF, OFAC, background check | [`repos/sep-api/PLD.md`](repos/sep-api/PLD.md) |
| MFA, TOTP, refresh, step-up, auditoria de seguranca | [`docs-sep/SEGURANCA.md`](docs-sep/SEGURANCA.md) |
| tela web, Angular, design Apple/Notion | [`docs-sep/WEB-SCREENS-PLAN.md`](docs-sep/WEB-SCREENS-PLAN.md) |
| mobile, Ionic, Capacitor, biometria | [`docs-sep/MOBILE-SCREENS-PLAN.md`](docs-sep/MOBILE-SCREENS-PLAN.md) |
| pipeline, CI, deploy | [`docs-sep/ci-pipelines/README.md`](docs-sep/ci-pipelines/README.md) |
| metricas, produtividade, progresso, DORA, SPACE, dashboard da sprint | [`docs-sep/METRICAS-IMPLEMENTACAO.md`](docs-sep/METRICAS-IMPLEMENTACAO.md) |
| relatorio de entregas, acompanhamento, status report, indicadores para stakeholders | [`docs-sep/RELATORIO-ACOMPANHAMENTO-ENTREGAS.md`](docs-sep/RELATORIO-ACOMPANHAMENTO-ENTREGAS.md) + [`HTML`](docs-sep/RELATORIO-ACOMPANHAMENTO-ENTREGAS.html) |

## Checklists rapidos

### Antes de implementar

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
- Atualizar doc operacional do modulo em `repos/<repo>/`.
- Criar PR description temporaria quando aplicavel; se materializada como `repos/<repo>/SPRINT-*-PR.md`, apagar esse arquivo ao iniciar a sprint seguinte.
- Atualizar PRD quando a sprint for concluida.
- Atualizar collections Postman/Insomnia se endpoints mudaram.
- Revisar este roadmap.

### Antes de iniciar nova fase

- Verificar se a fase anterior foi marcada como concluida no PRD/CONTEXT e no relatorio de acompanhamento.
- Se o usuario solicitar melhoria de fim de fase, trabalhar em modo plano e criar um arquivo `docs-sep/PLANO-MELHORIA-FIM-FASE-<N>.md` baseado no template.
- Classificar achados em bugs P0/P1, melhorias pequenas, dividas aceitas e backlog adiado.
- Aguardar aprovacao explicita antes de implementar qualquer task do plano.

## Nao faca

- Nao crie pastas `docs/` dentro de `sep-api`, `sep-app` ou `sep-mobile`.
- Nao duplique conteudo longo do PRD, specs ou docs operacionais neste roadmap.
- Nao use o PRD para detalhe operacional que pertence a `repos/<repo>/`.
- Nao assuma regra de negocio sem fonte documental ou codigo atual.
- Nao deixe este arquivo apontando para documento removido, renomeado ou obsoleto.
