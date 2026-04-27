# Steps - Detalhamento de codigo por Task

Esta pasta contem os **steps** detalhados de cada Task das specs em `../specs/`.

## Hierarquia SDD do projeto

```
PRD → ADRs → Specs → Steps → Codigo
docs-sep/  adr/  specs/  steps/
```

## O que e um Step

Step e a camada mais granular antes do codigo. Cada step responde:
1. Que arquivo criar/modificar
2. Que conteudo escrever (snippet pronto ou pseudo-codigo)
3. Em que ordem (respeitando dependencias)
4. Como verificar antes de prosseguir

Permite codificacao manual ou assistida com fidelidade ao plano.

## Convencoes

- 1 arquivo por sprint (toda a sprint num so doc, em ordem de execucao)
- Nome: `<sprint-id>-sprint-<num>-steps.md`
- ID de cada step: `<sprint>.<task>.<step>` (ex.: `0.2.3` = Spec 0, Task 2, Step 3)
- Cada step tem: objetivo, arquivo(s) afetado(s), conteudo (snippet), verificacao, pre-requisito

## Indice

| Sprint | Arquivo | Status |
|--------|---------|--------|
| Sprint 0 - Hygiene & Foundation | [`000-sprint-0-steps.md`](./000-sprint-0-steps.md) | Pronto para executar |
| Sprint 1 - Fundacao Tecnica | `001-sprint-1-steps.md` | A criar antes da Sprint 1 |
| Sprint 2 - Gestao de Usuarios | `002-sprint-2-steps.md` | A criar antes da Sprint 2 |
| Sprint 3 - Seguranca e Auth | `003-sprint-3-steps.md` | A criar antes da Sprint 3 |
| Sprint 4 - Estabilizacao | `004-sprint-4-steps.md` | A criar antes da Sprint 4 |
| F-Sprints Frontend | `100-frontend-foundation-steps.md` | A criar antes da F-Sprint 0 |

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
| `specs/0XX-...md` | `steps/0XX-...-steps.md` |

## Referencias

- [PRD - API SEP](../docs-sep/PRD.md)
- [CONTEXT.md](../docs-sep/CONTEXT.md)
- [Specs](../specs/)
- [ADRs](../adr/)
- [CLAUDE.md](../CLAUDE.md)
