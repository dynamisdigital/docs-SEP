# STATE.md — Design (reduzir contexto inicial de leitura obrigatoria)

> Este arquivo e o **spec de design** da mudanca, nao o STATE.md final. O STATE.md de producao
> (fusao real de `CONTEXT.md` + `CONTEXT-ESTADO-ATUAL.md`, com conteudo da fase corrente) e
> escrito na fase de implementacao, no mesmo caminho (`docs-sep/STATE.md`) — este documento e
> substituido por ele quando a Task de implementacao rodar.

## Motivacao

Toda sessao de agente no SEP le, como leitura obrigatoria (`AGENT.md` §Ordem de leitura +
`AI-ROADMAP.md` §Leitura base), 5 arquivos antes de tocar qualquer spec/step:

1. `docs-sep/PRD.md` (indice, ~26 linhas) — so pra descobrir qual `PRD-FASE-N.md` ler.
2. `docs-sep/CONTEXT.md` (indice, ~21 linhas) — so pra descobrir que deve ler `CONTEXT-ESTADO-ATUAL.md`.
3. `docs-sep/CONTEXT-ESTADO-ATUAL.md` (~72 linhas) — estado real.
4. `AGENT.md` (~227 linhas) — regras operacionais.
5. `AI-ROADMAP.md` (~181 linhas) — indice por tipo de tarefa.

~527 linhas de leitura fixa por sessao, dois dos cinco arquivos sendo puros indices de 1 hop
(apontam pra outro arquivo, sem conteudo proprio usavel). Objetivo: cortar os hops de indice e
tornar `AI-ROADMAP.md` condicional, sem perder a separacao que ja funciona bem entre
fundacao/estado/historico (`CONTEXT-PARTE-1.md` vs `CONTEXT-PARTE-2.md`).

## Escopo

**Dentro**:
- Fundir `CONTEXT.md` + `CONTEXT-ESTADO-ATUAL.md` num `STATE.md` unico.
- `STATE.md` ganha bloco "Leia agora" com o ponteiro direto pro `PRD-FASE-N.md` corrente + spec/step
  ativo, eliminando o hop por `PRD.md` no caso comum (continuar a fase corrente).
- `PRD.md` sai da leitura obrigatoria; vira referencia (lido so quando o ponteiro nao basta, ou
  planejamento de fase nova).
- `AI-ROADMAP.md` sai da leitura obrigatoria incondicional; vira condicional (tarefa de tipo novo
  ou modulo fora do que o "Leia agora" ja cobre).
- Atualizar todas as referencias cruzadas pra `CONTEXT.md`/`CONTEXT-ESTADO-ATUAL.md` no projeto.

**Fora**:
- `CONTEXT-PARTE-1.md` (fundacao) e `CONTEXT-PARTE-2.md` (historico por sprint) mantem nome e
  papel atuais — so passam a ser referenciados a partir do `STATE.md` em vez do `CONTEXT.md` antigo.
- Nenhuma mudanca em `PRD-FASE-*.md`, specs, steps, ADRs ou docs operacionais de `repos/<repo>/`.
- Nenhuma mudanca de conteudo do estado atual (Sprint 27 rejeitada, proximo passo etc.) alem de
  mover pro novo arquivo/formato.

## Estrutura do STATE.md final

```markdown
# STATE.md - Estado atual do SEP

> Fonte unica do estado. Sobrescreva ao fechar sprint (estado + proximo passo + leia-agora) e
> apende historico em CONTEXT-PARTE-2.md.

## Leia agora
- Fase corrente: PRD-FASE-N.md
- Spec/step ativo: <link>, se houver task em andamento

## Onde estamos
(igual conteudo de hoje em CONTEXT-ESTADO-ATUAL.md §Onde estamos)

## Proximo passo
(igual conteudo de hoje)

## Gates externos pendentes
(igual conteudo de hoje)

## Decisoes ativas ainda vigentes
(igual conteudo de hoje)

## Ponteiros
| Preciso de... | Leia |
|---|---|
| Fundacao (porque/como, stack, arquitetura) | CONTEXT-PARTE-1.md |
| Historico de execucao (log por sprint) | CONTEXT-PARTE-2.md (grande; sob demanda) |
| Planejamento completo das fases | PRD.md + PRD-FASE-1..5.md (referencia; nao obrigatorio) |
| Navegacao por tarefa/modulo | AI-ROADMAP.md (condicional; ver Ordem de leitura no AGENT.md) |
| Regras operacionais para agentes | AGENT.md |
```

## Impacto em AGENT.md

`§Ordem de leitura` muda de:

```
1. docs-sep/PRD.md (indice)
2. docs-sep/CONTEXT.md (indice) -> CONTEXT-ESTADO-ATUAL.md (sempre)
3. AGENT.md
4. AI-ROADMAP.md (sempre)
5. Spec relevante
...
```

para:

```
1. docs-sep/STATE.md (sempre; contem o ponteiro pra fase/spec/step corrente)
2. AGENT.md
3. AI-ROADMAP.md (condicional — so se a tarefa for de tipo/modulo nao coberto pelo
   "Leia agora" do STATE.md)
4. Spec apontado pelo STATE.md (ou PRD.md + PRD-FASE-N.md se precisar do quadro completo)
5. Step correspondente
6. Docs operacionais em repos/<repo>/ e ADRs relevantes
```

`§Manutencao documental` (convencao de fechamento de sprint) muda de "sobrescreva
CONTEXT-ESTADO-ATUAL.md ... apende historico em CONTEXT-PARTE-2.md" para "sobrescreva STATE.md
(estado + proximo passo + leia-agora) ... apende historico em CONTEXT-PARTE-2.md" — mesma
mecanica, novo arquivo.

`§Referencias principais` remove `CONTEXT.md` e `CONTEXT-ESTADO-ATUAL.md`, adiciona `STATE.md`.

## Impacto em AI-ROADMAP.md

`§Leitura base` remove o item incondicional de si mesmo (`AI-ROADMAP.md`) da lista de "sempre
ler" — o proprio arquivo passa a se descrever como condicional (lido a partir do `AGENT.md`,
nao da leitura base fixa). Tabelas que citam `CONTEXT.md`/`CONTEXT-ESTADO-ATUAL.md`
("Como usar", "Pacotes de leitura por tarefa", "Se a tarefa menciona...") trocam a referencia
para `STATE.md`.

## Arquivos com referencia a atualizar (varredura necessaria na implementacao)

Levantamento inicial via grep por `CONTEXT.md` / `CONTEXT-ESTADO-ATUAL.md`:

- `AGENT.md` — ordem de leitura, manutencao documental, referencias principais.
- `AI-ROADMAP.md` — leitura base, tabelas de navegacao.
- `docs-sep/CONTEXT-PARTE-1.md` — cabecalho auto-referencia o indice antigo.
- `docs-sep/CONTEXT-PARTE-2.md` — cabecalho auto-referencia o indice antigo.
- `docs-sep/PRD.md` / `PRD-FASE-*.md` — checar links soltos pro CONTEXT.md.
- specs/steps — varredura grep por `CONTEXT-ESTADO-ATUAL` / `CONTEXT\.md` antes de fechar a task.

`docs-sep/CONTEXT.md` e `docs-sep/CONTEXT-ESTADO-ATUAL.md` sao apagados (conteudo migrado pro
`STATE.md`). Tudo working-tree only em `docs-SEP` — sem commit (regra de git 100% manual do
repo).

## Verificacao (mudanca e so doc, sem codigo)

- Grep final por `CONTEXT.md` e `CONTEXT-ESTADO-ATUAL.md` em todo `docs-SEP` apos a migracao —
  zero referencia solta (exceto historico dentro de `CONTEXT-PARTE-2.md`, que e log imutavel do
  passado e nao precisa mudar).
- Conferir que `STATE.md` cobre 100% do conteudo hoje em `CONTEXT-ESTADO-ATUAL.md` (nenhuma secao
  perdida na fusao).
- Conferir que a ordem de leitura em `AGENT.md` e `AI-ROADMAP.md` fica mutuamente consistente
  (nao duplicada, nao contraditoria).

## Fora de escopo / follow-ups nao incluidos aqui

- Renomear `CONTEXT-PARTE-1.md`/`CONTEXT-PARTE-2.md` pra prefixo `STATE-` — nao pedido; mantem
  nome atual.
- Reduzir o tamanho de `AGENT.md`/`AI-ROADMAP.md` em si (conteudo, nao so condicional de leitura)
  — fora do pedido original.
