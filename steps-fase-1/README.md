# Steps - Detalhamento de codigo por Task

Esta pasta contem os **steps** detalhados de cada Task das specs em `../specs/`.

## Hierarquia SDD do projeto

```
PRD → ADRs → Specs → Steps → Codigo
docs-sep/  adr/  specs/  steps-fase-1/
```

## O que e um Step

Step e a camada mais granular antes do codigo. Cada step responde:
1. Que arquivo criar/modificar
2. Que conteudo escrever (snippet pronto ou pseudo-codigo)
3. Em que ordem (respeitando dependencias)
4. Como verificar antes de prosseguir

Permite codificacao manual ou assistida com fidelidade ao plano.

## Organizacao por trilha

Os steps sao agrupados por trilha de execucao em subpastas:

```
steps-fase-1/
+-- backend/   # Sprints 0XX (specs/fase-1/000-004)
+-- web/       # F-Sprints 1XX (specs/fase-1/100-104)
+-- mobile/    # M-Sprints 2XX (specs/fase-1/200-204)
```

## Convencoes

- 1 arquivo por sprint (toda a sprint num so doc, em ordem de execucao)
- Nome: `<sprint-id>-sprint-<num>-steps.md`
- ID de cada step: `<sprint>.<task>.<step>` (ex.: `0.2.3` = Spec 0, Task 2, Step 3)
- Cada step tem: objetivo, arquivo(s) afetado(s), conteudo (snippet), verificacao, pre-requisito

## Modelo de branches e commits (2026-05-06)

Regras vivem em [`AGENT.md`](../AGENT.md). Resumo:

- **1 branch por sprint** = `feature/<nome-sprint>`, nascida de `develop` apos `git pull --ff-only`. PR vai sempre para `develop`, nunca direto para `main`. Squash merge em `develop`; merge commit em `main` (preserva historico das features).
- **Commits**: numero flexivel — agente decide pelo escopo logico (Task, Step, modulo, refactor). Conventional Commits obrigatorio.
- **Push e PR sao manuais**. Agente nao roda `git push` nem `gh pr create`.
- `homologacao` sera inserida entre `develop` e `main` quando AWS/homologacao remoto entrar em jogo.

## Indice

### Backend (`backend/`)

| Sprint | Arquivo | Status |
|--------|---------|--------|
| Sprint 0 - Hygiene & Foundation | [`backend/000-sprint-0-steps.md`](./backend/000-sprint-0-steps.md) | Concluida (2026-05-04) |
| Sprint 1 - Fundacao Tecnica | [`backend/001-sprint-1-steps.md`](./backend/001-sprint-1-steps.md) | Concluida (2026-05-05) |
| Sprint 2 - Gestao de Usuarios | [`backend/002-sprint-2-steps.md`](./backend/002-sprint-2-steps.md) | Concluida (2026-05-05) |
| Sprint 3 - Seguranca e Auth | [`backend/003-sprint-3-steps.md`](./backend/003-sprint-3-steps.md) | Concluida (2026-05-05) |
| Sprint 4 - Estabilizacao | [`backend/004-sprint-4-steps.md`](./backend/004-sprint-4-steps.md) | Concluida (2026-05-06) |

### Web (`web/`)

| Sprint | Arquivo | Status |
|--------|---------|--------|
| F-Sprint 0 - Setup Angular | [`web/100-fsprint-0-steps.md`](./web/100-fsprint-0-steps.md) | Concluida (2026-05-04) |
| F-Sprint 1 - Tokens + Showcase | [`web/101-fsprint-1-steps.md`](./web/101-fsprint-1-steps.md) | Concluida (2026-05-06) |
| F-Sprint 2 - Telas Apple | [`web/102-fsprint-2-steps.md`](./web/102-fsprint-2-steps.md) | Concluida (2026-05-07) |
| F-Sprint 3 - Shell Notion + Auth | [`web/103-fsprint-3-steps.md`](./web/103-fsprint-3-steps.md) | Concluida (2026-05-07, push/PR pendente) |
| F-Sprint 4 - Telas Autenticadas | [`web/104-fsprint-4-steps.md`](./web/104-fsprint-4-steps.md) | Planejada para execucao |

### Mobile (`mobile/`)

| Sprint | Arquivo | Status |
|--------|---------|--------|
| M-Sprint 0 - Setup Ionic | [`mobile/200-msprint-0-steps.md`](./mobile/200-msprint-0-steps.md) | Concluida (2026-05-04) |
| M-Sprint 1 - Tokens Notion Mobile | [`mobile/201-msprint-1-steps.md`](./mobile/201-msprint-1-steps.md) | Concluida (2026-05-05/06, push/PR pendente) |
| M-Sprint 2 - Telas Publicas | [`mobile/202-msprint-2-steps.md`](./mobile/202-msprint-2-steps.md) | Concluida (2026-05-07) |
| M-Sprint 3 - Shell + Auth | [`mobile/203-msprint-3-steps.md`](./mobile/203-msprint-3-steps.md) | Planejada para execucao |
| M-Sprint 4 - Telas Autenticadas | [`mobile/204-msprint-4-steps.md`](./mobile/204-msprint-4-steps.md) | Planejada para execucao |

## Quando criar steps

**Just-in-time**: criamos os steps de uma sprint logo antes de executa-la, nao todos de uma vez. Isso evita que steps fiquem stale por causa de mudancas no spec correspondente.

## Atualizando steps

Steps podem ficar stale. Antes de executar uma task:
1. Confirme que o spec correspondente nao mudou
2. Confirme que o ADR correspondente esta vigente
3. Se precisar ajustar, edite o step ANTES de codificar

Apos a task ser executada, o **codigo e a verdade**. Os steps ficam como historico de decisoes de implementacao.

## Diferenca entre Spec e Step

| Spec | Step |
|------|------|
| O que fazer (alto nivel) | Como fazer (granular) |
| Lista tasks com criterios de pronto | Decompoe cada task em sub-passos sequenciais |
| Estavel | Pode evoluir conforme experiencia |
| Aprovado pelo PO/Senior | Detalhado pelo Senior antes da execucao |
| `specs/fase-1/0XX-...md` | `steps-fase-1/{backend,web,mobile}/0XX-...-steps.md` |

## Referencias

- [PRD - API SEP](../docs-sep/PRD.md)
- [CONTEXT.md](../docs-sep/CONTEXT.md)
- [Specs](../specs/)
- [ADRs](../adr/)
- [AGENT.md](../AGENT.md)
