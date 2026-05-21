# AI-ROADMAP.md - Mapa operacional para agentes de IA

Este arquivo orienta agentes de IA a encontrar rapidamente os documentos corretos para
implementacoes, reviews e duvidas no projeto SEP. Ele nao substitui PRD, ADRs, specs,
steps ou documentacao operacional: funciona como indice de navegacao por tipo de tarefa.

## Regra obrigatoria de manutencao

O `AI-ROADMAP.md` deve estar sempre atualizado.

- Toda mudanca que criar, mover, remover ou alterar a finalidade de documentacao relevante
  deve atualizar este roadmap no mesmo ciclo.
- Toda sprint concluida deve revisar este roadmap antes do fechamento.
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
4. [`AI-SESSION-PROMPT.md`](AI-SESSION-PROMPT.md)
5. Este arquivo (`AI-ROADMAP.md`)

## Pacotes de leitura por tarefa

| Tarefa | Leia nesta ordem |
|--------|------------------|
| Implementacao backend | Base -> spec da sprint em `specs/` -> step em `steps-fase-*` -> docs do modulo em `repos/sep-api/` -> ADRs relevantes |
| Implementacao web | Base -> spec/step web -> `docs-sep/WEB-SCREENS-PLAN.md` -> `docs-sep/DESIGN-apple.md` ou `docs-sep/DESIGN-notion.md` -> `repos/sep-app/` |
| Implementacao mobile | Base -> spec/step mobile -> `docs-sep/MOBILE-SCREENS-PLAN.md` -> `docs-sep/DESIGN-notion.md` -> `repos/sep-mobile/` |
| Code review | Base -> spec da sprint -> step da task -> doc operacional do modulo -> diff/codigo -> testes existentes |
| Criar nova sprint/steps | Base -> PRD secao da sprint -> spec correspondente -> steps anteriores similares -> ADRs relevantes |
| Atualizacao documental | Base -> documento alvo -> documentos que apontam para ele -> este roadmap; se for orientacao de agentes, atualizar tambem `AI-SESSION-PROMPT.md` quando necessario |
| Duvida de produto/regra | `docs-sep/PRD.md` -> `docs-sep/CONTEXT.md` -> doc operacional do modulo -> spec da sprint |
| Integracao externa | Base -> ADR 0004 -> ADR 0008 quando houver WireMock -> doc operacional do modulo -> specs/steps da integracao |
| Seguranca/auth/step-up/auditoria | Base -> `docs-sep/SEGURANCA.md` -> specs/steps da Sprint 5 -> docs do modulo afetado |
| Fechamento de sprint | Step da sprint -> doc operacional do modulo -> PR description em `repos/<repo>/SPRINT-*-PR.md` -> PRD -> collections -> este roadmap |

## Mapa por modulo

| Modulo/tema | Documentacao principal | Specs/steps principais | ADRs comuns |
|-------------|------------------------|------------------------|-------------|
| `identity` / seguranca | [`docs-sep/SEGURANCA.md`](docs-sep/SEGURANCA.md) | Sprint 5 em `specs/fase-2/` e `steps-fase-2/backend/` | 0001, 0007, 0009, 0010 |
| `usuarios` | PRD + specs das Sprints 2, 5 e 8 | `specs/fase-1/002-*`, `specs/fase-2/005-*`, `008-*` | 0001, 0007 |
| `onboarding` KYC/KYB | [`repos/sep-api/ONBOARDING.md`](repos/sep-api/ONBOARDING.md) | Sprints 6 e 7 | 0004, 0007, 0008 |
| PLD | [`repos/sep-api/PLD.md`](repos/sep-api/PLD.md) | Sprint 7 | 0004, 0007, 0008 |
| `credito` | [`repos/sep-api/CREDITO.md`](repos/sep-api/CREDITO.md) | Sprints 8 e 9 | 0007, 0012 |
| Open Finance | [`repos/sep-api/OPEN-FINANCE.md`](repos/sep-api/OPEN-FINANCE.md) | Sprint 9 | 0004, 0008 |
| `contratos` | [`repos/sep-api/CONTRATOS.md`](repos/sep-api/CONTRATOS.md) | Sprints 10 e 11 | 0004, 0006, 0007 |
| `cobranca` | Futuro `repos/sep-api/COBRANCA.md` | Sprints 12 e 13 | 0001, 0007 |
| `backoffice` | Futuro `repos/sep-api/BACKOFFICE.md` | Sprint 14 | 0001, 0007 |
| `escrow` / financeiro / Pix | PRD + specs futuras | Sprints futuras | 0005, 0007 |
| Web | [`repos/sep-app/README.md`](repos/sep-app/README.md) | `specs/fase-1/100-*` a `104-*`; `steps-fase-1/web/` | 0002, 0003, 0011 |
| Mobile | [`repos/sep-mobile/README.md`](repos/sep-mobile/README.md) | `specs/fase-1/200-*` a `204-*`; `steps-fase-1/mobile/` | 0003, 0009, 0010, 0011 |

## Se a tarefa menciona...

| Termo na tarefa | Comece por |
|-----------------|------------|
| contrato, aceite, formalizacao, CCB | [`repos/sep-api/CONTRATOS.md`](repos/sep-api/CONTRATOS.md) |
| proposta, parecer, score, motor de credito | [`repos/sep-api/CREDITO.md`](repos/sep-api/CREDITO.md) |
| Open Finance, consentimento, movimentacao | [`repos/sep-api/OPEN-FINANCE.md`](repos/sep-api/OPEN-FINANCE.md) |
| KYC, KYB, documentos, Celcoin onboarding | [`repos/sep-api/ONBOARDING.md`](repos/sep-api/ONBOARDING.md) |
| PLD, COAF, OFAC, background check | [`repos/sep-api/PLD.md`](repos/sep-api/PLD.md) |
| MFA, TOTP, refresh, step-up, auditoria de seguranca | [`docs-sep/SEGURANCA.md`](docs-sep/SEGURANCA.md) |
| tela web, Angular, design Apple/Notion | [`docs-sep/WEB-SCREENS-PLAN.md`](docs-sep/WEB-SCREENS-PLAN.md) |
| mobile, Ionic, Capacitor, biometria | [`docs-sep/MOBILE-SCREENS-PLAN.md`](docs-sep/MOBILE-SCREENS-PLAN.md) |
| pipeline, CI, deploy | [`docs-sep/ci-pipelines/README.md`](docs-sep/ci-pipelines/README.md) |

## Checklists rapidos

### Antes de implementar

- Confirmar spec e step da sprint/task.
- Confirmar ADRs que governam a decisao tecnica.
- Confirmar doc operacional do modulo, se existir.
- Verificar se a mudanca altera contrato REST, migration, evento, provider, collection ou regra de seguranca.
- Planejar atualizacao documental junto da implementacao quando houver mudanca de comportamento.

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
- Criar ou atualizar `SPRINT-*-PR.md` quando aplicavel.
- Atualizar PRD quando a sprint for concluida.
- Atualizar collections Postman/Insomnia se endpoints mudaram.
- Revisar este roadmap.

## Nao faca

- Nao crie pastas `docs/` dentro de `sep-api`, `sep-app` ou `sep-mobile`.
- Nao duplique conteudo longo do PRD, specs ou docs operacionais neste roadmap.
- Nao use o PRD para detalhe operacional que pertence a `repos/<repo>/`.
- Nao assuma regra de negocio sem fonte documental ou codigo atual.
- Nao deixe este arquivo apontando para documento removido, renomeado ou obsoleto.
