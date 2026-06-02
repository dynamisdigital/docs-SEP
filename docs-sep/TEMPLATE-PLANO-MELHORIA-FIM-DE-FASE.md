# Template - Plano de melhoria de fim de fase

Use este template quando uma fase for encerrada e o usuario solicitar a rotina de
melhoria de codigo e busca de bugs. O agente deve trabalhar em modo plano: primeiro
diagnostica, depois registra o plano em arquivo Markdown, e so implementa quando o
usuario aprovar explicitamente.

## Identificacao

| Campo | Valor |
|-------|-------|
| Fase avaliada | Fase X - nome |
| Data do plano | YYYY-MM-DD |
| Repos avaliados | `sep-api`, `sep-app`, `sep-mobile`, `docs-SEP` |
| Branches base | `develop`/`main` conforme repo |
| Responsavel pelo plano | Agente/Dev |
| Status | Planejado |

## Objetivo

- Encontrar bugs, regressoes, inconsistencias documentais e dividas tecnicas acumuladas na fase.
- Propor melhorias de baixo risco antes de iniciar a proxima fase.
- Separar o que deve ser corrigido agora do que deve virar backlog futuro.

## Fontes obrigatorias

- PRD da fase e secoes de status.
- CONTEXT.md.
- Steps e specs da fase encerrada.
- Docs operacionais em `repos/<repo>/`.
- Metricas de implementacao quando aplicavel.
- Diffs entre branches relevantes (`develop`, `main`, feature branches ainda abertas).
- Testes, CI e logs disponiveis localmente ou no GitHub quando o usuario solicitar consulta externa.

## Diagnostico

| Area | Evidencia | Risco | Decisao |
|------|-----------|-------|---------|
| Codigo backend | TBD | TBD | TBD |
| Codigo web | TBD | TBD | TBD |
| Codigo mobile | TBD | TBD | TBD |
| Testes/CI | TBD | TBD | TBD |
| Migrations/dados | TBD | TBD | TBD |
| Seguranca/autorizacao | TBD | TBD | TBD |
| Observabilidade/jobs | TBD | TBD | TBD |
| Documentacao/collections | TBD | TBD | TBD |

## Tasks propostas

| Task | Titulo | Repo | Tipo | Prioridade | Criterio de aceite | Status |
|------|--------|------|------|------------|--------------------|--------|
| FMF-X.1 | Revisar gaps criticos de teste | `sep-api` | Bug hunt | Alta | Lista de gaps validada e P0/P1 encaminhados | Planejado |
| FMF-X.2 | Corrigir inconsistencias documentais | `docs-SEP` | Docs | Media | Links e status batem com repos atuais | Planejado |
| FMF-X.3 | Avaliar dividas tecnicas aceitas | todos | Planejamento | Media | Itens classificados entre agora/backlog | Planejado |

## Bugs encontrados

| ID | Descricao | Repo | Evidencia | Severidade | Acao |
|----|-----------|------|-----------|------------|------|
| BUG-X.1 | TBD | TBD | TBD | TBD | TBD |

## Melhorias candidatas

| ID | Descricao | Repo | Beneficio | Risco | Decisao |
|----|-----------|------|-----------|-------|---------|
| MEL-X.1 | TBD | TBD | TBD | TBD | TBD |

## Backlog adiado

| Item | Motivo do adiamento | Quando reavaliar |
|------|---------------------|------------------|
| TBD | TBD | TBD |

## Validacao planejada

- Comandos de teste/build/lint por repo.
- Checks documentais (`git diff --check`, JSON/YAML parsers, links quando aplicavel).
- Smoke manual quando a melhoria tocar fluxo de usuario ou integracao externa.

## Saida esperada

- Plano aprovado pelo usuario antes de qualquer implementacao.
- Tasks priorizadas com escopo claro.
- Bugs P0/P1 destacados primeiro.
- Melhorias pequenas agrupadas por repo.
- Itens fora de escopo registrados como backlog futuro.
