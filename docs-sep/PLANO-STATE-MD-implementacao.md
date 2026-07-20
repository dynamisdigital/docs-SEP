# STATE.md Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir `docs-sep/CONTEXT.md` + `docs-sep/CONTEXT-ESTADO-ATUAL.md` por um `docs-sep/STATE.md` único com ponteiro direto pra fase/spec/step corrente, tirar `PRD.md` e `AI-ROADMAP.md` da leitura obrigatória incondicional, e atualizar toda referência cruzada viva no repo `docs-SEP`.

**Architecture:** Mudança é 100% documental (sem código). `docs-sep/STATE.md` nasce da fusão de conteúdo dos dois arquivos atuais + um novo bloco "Leia agora". `CONTEXT-PARTE-1.md`/`CONTEXT-PARTE-2.md` mantêm nome e papel, só trocam a quem apontam no cabeçalho. `AGENT.md` e `AI-ROADMAP.md` mudam a ordem/condicionalidade de leitura. Demais arquivos (README.md, PRD-FASE-3.md, TEMPLATE de fim de fase, step da Sprint 27 ainda não executada) recebem só troca de link — sem reescrever conteúdo.

**Tech Stack:** N/A (Markdown puro).

## Global Constraints

- Repo `docs-SEP`: toda operação git é manual. O agente cria/edita/apaga **só no working tree**; nunca `git add`, nunca `git commit`, nunca `git push`. Cada task abaixo termina em "verificar", não em "commit".
- Não reescrever conteúdo de arquivos históricos/fechados: `adr/*`, `specs/fase-1/*`, `specs/fase-2/*`, `steps-fase-1/*`, `steps-fase-2/*`, `steps-fase-3/*` mantêm suas referências a `CONTEXT.md` como estão — são log imutável do passado (mesma lógica que já vale pra `CONTEXT-PARTE-2.md`).
- Único step ainda não executado que referencia os arquivos antigos é `steps-fase-4/backend/027-sprint-27-steps.md` — esse **entra no escopo** porque vai rodar no futuro com o nome errado se não for corrigido.
- Preservar 100% do conteúdo semântico de `CONTEXT-ESTADO-ATUAL.md` dentro do novo `STATE.md` — nenhuma seção pode ser perdida na fusão.
- Local do plano/spec de design foge do default da skill (`docs/superpowers/...`) porque o repo `docs-SEP` já tem convenção própria (`docs-sep/PLANO-*.md`, ver `TEMPLATE-PLANO-MELHORIA-FIM-DE-FASE.md`); mantido em `docs-sep/` pra não introduzir uma pasta `docs/` nova.

---

### Task 1: Escrever `docs-sep/STATE.md` final e apagar os 2 arquivos antigos

**Files:**
- Modify (sobrescrita completa): `docs-SEP/docs-sep/STATE.md` (hoje contém o spec de design — vira o arquivo de produção)
- Delete: `docs-SEP/docs-sep/CONTEXT.md`
- Delete: `docs-SEP/docs-sep/CONTEXT-ESTADO-ATUAL.md`

**Interfaces:**
- Produces: `docs-sep/STATE.md` como novo alvo de link para "estado atual" — todas as Tasks seguintes linkam pra ele.

- [ ] **Step 1: Sobrescrever `docs-SEP/docs-sep/STATE.md` com o conteúdo de produção**

Conteúdo completo (substitui 100% do arquivo, incluindo o spec de design que estava lá):

```markdown
# STATE.md - Estado atual do SEP

> **Fonte unica do estado do projeto.** Leia este arquivo para saber onde estamos, o proximo passo
> e os gates pendentes. Fundacao (porque/como) esta em [`CONTEXT-PARTE-1.md`](./CONTEXT-PARTE-1.md);
> historico completo de execucao (log por sprint) esta em [`CONTEXT-PARTE-2.md`](./CONTEXT-PARTE-2.md)
> — grande, leia so sob demanda.
>
> **Convencao de manutencao**: ao fechar uma sprint, **sobrescreva** este arquivo (estado + proximo
> passo + leia agora) e **apende** uma entrada curta no historico ([`CONTEXT-PARTE-2.md`](./CONTEXT-PARTE-2.md)).
> Mantenha este arquivo pequeno; ele nao duplica historico nem PRD, so aponta.

_Atualizado em: 2026-07-07._

## Leia agora

- **Fase corrente**: [`PRD-FASE-4.md`](./PRD-FASE-4.md).
- **Spec/step ativo**: nenhuma task em andamento; proxima e a Sprint 27 (steps prontos em
  [`steps-fase-4/backend/027-sprint-27-steps.md`](../steps-fase-4/backend/027-sprint-27-steps.md)).

## Onde estamos

- **Fase 3 concluida tecnicamente em 2026-07-06**: escopo funcional entregue nos 3 repos; `develop`
  e `main` em paridade de conteudo em `sep-api`, `sep-app` e `sep-mobile` (back-merges locais feitos).
- **Fase 4 planejada** (nada implementado): 14 specs em [`specs/fase-4/`](../specs/fase-4/README.md)
  (backend `027`-`032`, web `116`-`119`, mobile `213`-`216`). Corte de entrega = marco `v1.0-local`
  (tudo sobre providers Fake/WireMock; "tudo menos AWS e Celcoin"). Detalhe em
  [`PRD-FASE-4.md`](./PRD-FASE-4.md).
- **Fase 5 planejada** (fechamento gated): integracao real Celcoin, provisionamento AWS, publicacao
  em lojas e go-live de producao. Detalhe em [`PRD-FASE-5.md`](./PRD-FASE-5.md).
- **Sprint 27** ja tem steps prontos:
  [`steps-fase-4/backend/027-sprint-27-steps.md`](../steps-fase-4/backend/027-sprint-27-steps.md).

## Proximo passo

1. **Executar a Sprint 27** (backend): step-up estrito server-side no aceite de contrato e operacoes
   legais/financeiras equivalentes — aplica `@RequireStepUpEstrito` (ja existente); fecha o follow-up
   1 (bloqueio de go-live) da Fase 3.
2. Seguir a ordem da Fase 4: backend 28 (portas cobranca) e 29-32 (Epic 15 assistido + skeleton
   adapters); web F-16-19; mobile M-13-16. Ver dependencias em
   [`specs/fase-4/README.md`](../specs/fase-4/README.md).
3. Steps sao criados **just-in-time** antes de cada sprint.

## Gates externos pendentes (nao bloqueiam a Fase 4 sobre fake)

- **Credenciais Celcoin/BaaS** (sandbox e producao) — ativacao de adapters reais; escopo Fase 5.
- **Conta/ambiente AWS** — provisionamento e deploy remoto; escopo Fase 5.
- **Contas de loja** (Google Play, Apple Developer) — publicacao mobile; escopo Fase 5.

Ate os acessos existirem: banco PostgreSQL local via Docker Compose; providers em Fake + WireMock.

## Decisoes ativas ainda vigentes

- **Stack**: backend Java 21 + Spring Boot 3.5.x + Gradle + PostgreSQL 16; web Angular 20.x
  (Standalone + Signals + SCSS); mobile Ionic 8.4+ + Angular 20.x + Capacitor 8. Upgrade de major so
  com ADR.
- **Arquitetura backend**: monolito modular DDD + Hexagonal/Ports & Adapters por modulo; integracoes
  externas por Provider Pattern (Fake default + WireMock; adapter real gated por credenciais).
- **Design system vigente**: [`New Design System Sep.md`](<./New Design System Sep.md>) no web e no
  mobile (Epic 17; substituiu Apple/Notion).
- **Git**: branch por sprint a partir de `develop` (`feature/<tema>`); `feature -> develop -> main`;
  commits pelo agente com aprovacao em checkpoint; **push e PR manuais**. Em `docs-SEP` a operacao git
  e 100% manual (agente so edita working tree). Detalhe em [`../AGENT.md`](../AGENT.md).
- **Marco regulatorio**: CMN 4.656/2018 (KYC/KYB, escrow, PLD auditavel, auditoria reforcada).

## Ponteiros

| Preciso de... | Leia |
|---------------|------|
| Fundacao (porque/como, stack, arquitetura) | [`CONTEXT-PARTE-1.md`](./CONTEXT-PARTE-1.md) |
| Historico de execucao (log por sprint) | [`CONTEXT-PARTE-2.md`](./CONTEXT-PARTE-2.md) (grande; sob demanda) |
| Planejamento completo das fases | [`PRD.md`](./PRD.md) + `PRD-FASE-1..5.md` (referencia; nao obrigatorio se o "Leia agora" acima ja basta) |
| Navegacao por tarefa/modulo | [`../AI-ROADMAP.md`](../AI-ROADMAP.md) (condicional — ver `../AGENT.md` §Ordem de leitura) |
| Regras operacionais para agentes | [`../AGENT.md`](../AGENT.md) |
```

- [ ] **Step 2: Apagar os 2 arquivos antigos**

```bash
cd docs-SEP
rm docs-sep/CONTEXT.md docs-sep/CONTEXT-ESTADO-ATUAL.md
```

- [ ] **Step 3: Verificar**

```bash
test -f docs-sep/STATE.md && echo "STATE.md OK"
test -f docs-sep/CONTEXT.md && echo "FALHOU: CONTEXT.md ainda existe" || echo "CONTEXT.md removido OK"
test -f docs-sep/CONTEXT-ESTADO-ATUAL.md && echo "FALHOU: CONTEXT-ESTADO-ATUAL.md ainda existe" || echo "CONTEXT-ESTADO-ATUAL.md removido OK"
```

Esperado: as 3 linhas de sucesso, nenhuma linha "FALHOU".

---

### Task 2: Atualizar cabeçalho de `docs-sep/CONTEXT-PARTE-1.md`

**Files:**
- Modify: `docs-SEP/docs-sep/CONTEXT-PARTE-1.md:3`

- [ ] **Step 1: Trocar a auto-referência**

Old:
```
> Extraido de `CONTEXT.md` para reduzir o tamanho do documento principal.
```

New:
```
> Extraido do antigo `CONTEXT.md` (hoje `STATE.md`) para reduzir o tamanho do documento principal.
```

- [ ] **Step 2: Verificar**

```bash
grep -n "CONTEXT.md\|STATE.md" docs-sep/CONTEXT-PARTE-1.md
```

Esperado: só a linha 3, agora citando `STATE.md`.

---

### Task 3: Atualizar `docs-sep/CONTEXT-PARTE-2.md` (cabeçalho + seção histórica)

**Files:**
- Modify: `docs-SEP/docs-sep/CONTEXT-PARTE-2.md:1-6`
- Modify: `docs-SEP/docs-sep/CONTEXT-PARTE-2.md:525-528` (seção "Proximo passo (historico)")

- [ ] **Step 1: Trocar o link do cabeçalho**

Old:
```
# Contexto do Projeto SEP - Parte 2 - Historico de execucao

> **Arquivo historico (log de execucao por sprint). Grande — leia so sob demanda, para detalhe
> historico.** O **estado atual, o proximo passo e os gates pendentes** vivem em
> [`CONTEXT-ESTADO-ATUAL.md`](./CONTEXT-ESTADO-ATUAL.md). A fundacao esta em
> [`CONTEXT-PARTE-1.md`](./CONTEXT-PARTE-1.md).
```

New:
```
# Contexto do Projeto SEP - Parte 2 - Historico de execucao

> **Arquivo historico (log de execucao por sprint). Grande — leia so sob demanda, para detalhe
> historico.** O **estado atual, o proximo passo e os gates pendentes** vivem em
> [`STATE.md`](./STATE.md). A fundacao esta em
> [`CONTEXT-PARTE-1.md`](./CONTEXT-PARTE-1.md).
```

- [ ] **Step 2: Ler as linhas 520-530 pra confirmar o texto exato antes de editar**

```bash
sed -n '520,530p' docs-sep/CONTEXT-PARTE-2.md
```

- [ ] **Step 3: Trocar as referências a `CONTEXT-ESTADO-ATUAL.md` nessa seção pelo `STATE.md`**

Old (trecho conhecido; usar o texto exato lido no Step 2 como base, so a referencia ao arquivo muda):
```
## Proximo passo (historico — superado por CONTEXT-ESTADO-ATUAL.md)
```
```
> superada**. O proximo passo vigente vive em [`CONTEXT-ESTADO-ATUAL.md`](./CONTEXT-ESTADO-ATUAL.md).
```

New:
```
## Proximo passo (historico — superado por STATE.md)
```
```
> superada**. O proximo passo vigente vive em [`STATE.md`](./STATE.md).
```

- [ ] **Step 4: Verificar**

```bash
grep -n "CONTEXT-ESTADO-ATUAL\|CONTEXT\.md" docs-sep/CONTEXT-PARTE-2.md
```

Esperado: nenhum resultado.

---

### Task 4: Atualizar `AGENT.md` (ordem de leitura, manutenção documental, referências)

**Files:**
- Modify: `docs-SEP/AGENT.md:9-15` (ordem de leitura)
- Modify: `docs-SEP/AGENT.md:177` (manutenção documental)
- Modify: `docs-SEP/AGENT.md:214-226` (referências principais)

- [ ] **Step 1: Substituir a lista de ordem de leitura**

Old:
```
1. [`docs-sep/PRD.md`](docs-sep/PRD.md) - indice do PRD por fase. Conteudo detalhado em [`PRD-FASE-1.md`](docs-sep/PRD-FASE-1.md), [`PRD-FASE-2.md`](docs-sep/PRD-FASE-2.md) e [`PRD-FASE-3.md`](docs-sep/PRD-FASE-3.md).
2. [`docs-sep/CONTEXT.md`](docs-sep/CONTEXT.md) - indice do contexto. Para **estado atual, proximo passo e gates**, leia [`CONTEXT-ESTADO-ATUAL.md`](docs-sep/CONTEXT-ESTADO-ATUAL.md) (pequeno; sempre). Fundacao em [`CONTEXT-PARTE-1.md`](docs-sep/CONTEXT-PARTE-1.md); historico de execucao por sprint em [`CONTEXT-PARTE-2.md`](docs-sep/CONTEXT-PARTE-2.md) (grande; so sob demanda).
3. Este arquivo (`AGENT.md`) - regras operacionais para agentes.
4. [`AI-ROADMAP.md`](AI-ROADMAP.md) - indice por tipo de tarefa.
5. Spec relevante em `specs/`.
6. Step correspondente em `steps-fase-1/` a `steps-fase-5/`, quando existir.
7. Docs operacionais em `repos/<repo>/` e ADRs relevantes em `adr/`.
```

New:
```
1. [`docs-sep/STATE.md`](docs-sep/STATE.md) - fonte unica do estado (sempre). Contem o bloco "Leia
   agora" com o ponteiro direto pra fase/spec/step corrente, alem de onde estamos, proximo passo,
   gates pendentes e decisoes ativas. Fundacao (porque/como) em
   [`CONTEXT-PARTE-1.md`](docs-sep/CONTEXT-PARTE-1.md); historico de execucao por sprint em
   [`CONTEXT-PARTE-2.md`](docs-sep/CONTEXT-PARTE-2.md) (grande; so sob demanda); planejamento
   completo das fases em [`PRD.md`](docs-sep/PRD.md) + `PRD-FASE-1..5.md` (referencia; nao
   obrigatorio se o "Leia agora" do STATE.md ja basta).
2. Este arquivo (`AGENT.md`) - regras operacionais para agentes.
3. [`AI-ROADMAP.md`](AI-ROADMAP.md) - indice por tipo de tarefa. **Condicional**: leia so se a
   tarefa for de tipo/modulo nao coberto pelo "Leia agora" do `STATE.md`.
4. Spec relevante em `specs/` (apontado pelo `STATE.md`, ou via `AI-ROADMAP.md` se tarefa nova).
5. Step correspondente em `steps-fase-1/` a `steps-fase-5/`, quando existir.
6. Docs operacionais em `repos/<repo>/` e ADRs relevantes em `adr/`.
```

- [ ] **Step 2: Substituir o parágrafo de manutenção documental**

Old:
```
Contexto (regra fixa para nao inchar o arquivo de estado): o **estado atual, o proximo passo e os gates** vivem em `docs-sep/CONTEXT-ESTADO-ATUAL.md` (pequeno; fonte unica; sempre lido). Ao **fechar uma sprint**, sobrescreva esse arquivo (estado + proximo passo) e apende uma entrada curta ao historico em `docs-sep/CONTEXT-PARTE-2.md` (log por sprint; grande; lido so sob demanda). Nao trate `CONTEXT-PARTE-2.md` como fonte de estado; `CONTEXT-PARTE-1.md` e a fundacao estavel.
```

New:
```
Contexto (regra fixa para nao inchar o arquivo de estado): o **estado atual, o proximo passo, os gates e o ponteiro "leia agora"** vivem em `docs-sep/STATE.md` (pequeno; fonte unica; sempre lido). Ao **fechar uma sprint**, sobrescreva esse arquivo (estado + proximo passo + leia agora) e apende uma entrada curta ao historico em `docs-sep/CONTEXT-PARTE-2.md` (log por sprint; grande; lido so sob demanda). Nao trate `CONTEXT-PARTE-2.md` como fonte de estado; `CONTEXT-PARTE-1.md` e a fundacao estavel.
```

- [ ] **Step 3: Substituir a lista de referências principais**

Old:
```
- [`docs-sep/PRD.md`](docs-sep/PRD.md)
- [`docs-sep/PRD-FASE-1.md`](docs-sep/PRD-FASE-1.md)
- [`docs-sep/PRD-FASE-2.md`](docs-sep/PRD-FASE-2.md)
- [`docs-sep/PRD-FASE-3.md`](docs-sep/PRD-FASE-3.md)
- [`docs-sep/CONTEXT.md`](docs-sep/CONTEXT.md)
- [`docs-sep/CONTEXT-PARTE-1.md`](docs-sep/CONTEXT-PARTE-1.md)
- [`docs-sep/CONTEXT-PARTE-2.md`](docs-sep/CONTEXT-PARTE-2.md)
- [`AI-ROADMAP.md`](AI-ROADMAP.md)
- [`adr/`](adr/)
- [`specs/`](specs/)
- [`steps-fase-1/`](steps-fase-1/)
- [`steps-fase-2/`](steps-fase-2/)
- [`repos/`](repos/)
```

New:
```
- [`docs-sep/STATE.md`](docs-sep/STATE.md)
- [`docs-sep/PRD.md`](docs-sep/PRD.md)
- [`docs-sep/PRD-FASE-1.md`](docs-sep/PRD-FASE-1.md)
- [`docs-sep/PRD-FASE-2.md`](docs-sep/PRD-FASE-2.md)
- [`docs-sep/PRD-FASE-3.md`](docs-sep/PRD-FASE-3.md)
- [`docs-sep/CONTEXT-PARTE-1.md`](docs-sep/CONTEXT-PARTE-1.md)
- [`docs-sep/CONTEXT-PARTE-2.md`](docs-sep/CONTEXT-PARTE-2.md)
- [`AI-ROADMAP.md`](AI-ROADMAP.md)
- [`adr/`](adr/)
- [`specs/`](specs/)
- [`steps-fase-1/`](steps-fase-1/)
- [`steps-fase-2/`](steps-fase-2/)
- [`repos/`](repos/)
```

- [ ] **Step 4: Verificar**

```bash
grep -n "CONTEXT-ESTADO-ATUAL\|CONTEXT\.md" AGENT.md
grep -n "STATE.md" AGENT.md
```

Esperado: primeiro grep sem resultado; segundo grep com 3+ ocorrências.

---

### Task 5: Atualizar `AI-ROADMAP.md` (leitura base, tabela, checklist)

**Files:**
- Modify: `docs-SEP/AI-ROADMAP.md:31-36` (leitura base)
- Modify: `docs-SEP/AI-ROADMAP.md:63` (tabela "Se a tarefa menciona")
- Modify: `docs-SEP/AI-ROADMAP.md:162` (checklist "Antes de fechar sprint")

- [ ] **Step 1: Substituir a lista de leitura base**

Old:
```
Leitura base para qualquer agente:

1. [`docs-sep/PRD.md`](docs-sep/PRD.md) - indice do PRD; leia o arquivo de fase relevante (`PRD-FASE-1.md`, `PRD-FASE-2.md`, `PRD-FASE-3.md`, `PRD-FASE-4.md` ou `PRD-FASE-5.md`).
2. [`docs-sep/CONTEXT.md`](docs-sep/CONTEXT.md) - indice do contexto. Para **estado atual/proximo passo/gates**, leia [`CONTEXT-ESTADO-ATUAL.md`](docs-sep/CONTEXT-ESTADO-ATUAL.md) (pequeno; sempre). Fundacao em `CONTEXT-PARTE-1.md`; historico por sprint em `CONTEXT-PARTE-2.md` (grande; so sob demanda).
3. [`AGENT.md`](AGENT.md)
4. Este arquivo (`AI-ROADMAP.md`)
```

New:
```
Leitura base para qualquer agente:

1. [`docs-sep/STATE.md`](docs-sep/STATE.md) - fonte unica do estado (sempre). Bloco "Leia agora"
   aponta pra fase/spec/step corrente. Fundacao em `CONTEXT-PARTE-1.md`; historico por sprint em
   `CONTEXT-PARTE-2.md` (grande; so sob demanda); planejamento completo das fases em
   [`docs-sep/PRD.md`](docs-sep/PRD.md) + `PRD-FASE-1..5.md` (referencia; nao obrigatorio se o
   "Leia agora" ja basta).
2. [`AGENT.md`](AGENT.md)
3. Este arquivo (`AI-ROADMAP.md`) — **condicional**: leia so se a tarefa for de tipo/modulo nao
   coberto pelo "Leia agora" do `STATE.md`.
```

- [ ] **Step 2: Substituir a linha da tabela "Se a tarefa menciona..."**

Old:
```
| Duvida de produto/regra | `docs-sep/PRD.md` + arquivo `PRD-FASE-*` relevante -> `docs-sep/CONTEXT.md` + parte relevante -> doc operacional do modulo -> spec da sprint |
```

New:
```
| Duvida de produto/regra | `docs-sep/STATE.md` -> `docs-sep/PRD.md` + arquivo `PRD-FASE-*` relevante -> parte relevante do contexto -> doc operacional do modulo -> spec da sprint |
```

- [ ] **Step 3: Substituir o item do checklist "Antes de fechar sprint"**

Old:
```
- **Atualizar o estado**: sobrescrever [`docs-sep/CONTEXT-ESTADO-ATUAL.md`](docs-sep/CONTEXT-ESTADO-ATUAL.md) (estado + proximo passo + gates) e apendar uma entrada curta ao historico em `docs-sep/CONTEXT-PARTE-2.md`. Nao inchar o log; nao duplicar detalhe do PRD.
```

New:
```
- **Atualizar o estado**: sobrescrever [`docs-sep/STATE.md`](docs-sep/STATE.md) (estado + proximo passo + gates + leia agora) e apendar uma entrada curta ao historico em `docs-sep/CONTEXT-PARTE-2.md`. Nao inchar o log; nao duplicar detalhe do PRD.
```

- [ ] **Step 4: Verificar**

```bash
grep -n "CONTEXT-ESTADO-ATUAL\|CONTEXT\.md" AI-ROADMAP.md
grep -n "STATE.md" AI-ROADMAP.md
```

Esperado: primeiro grep sem resultado; segundo com 3+ ocorrências.

---

### Task 6: Atualizar `README.md` (raiz do docs-SEP)

**Files:**
- Modify: `docs-SEP/README.md:8`
- Modify: `docs-SEP/README.md:22`

- [ ] **Step 1: Trocar a linha 8**

Old:
```
- **CONTEXT.md**: Índice do contexto. O **estado atual** vive em `docs-sep/CONTEXT-ESTADO-ATUAL.md` (pequeno; leia sempre para saber onde estamos); a fundação em `docs-sep/CONTEXT-PARTE-1.md`; o histórico de execução por sprint em `docs-sep/CONTEXT-PARTE-2.md` (grande; sob demanda).
```

New:
```
- **STATE.md**: Fonte única do estado (pequeno; leia sempre para saber onde estamos, o próximo passo e o "leia agora"). A fundação está em `docs-sep/CONTEXT-PARTE-1.md`; o histórico de execução por sprint em `docs-sep/CONTEXT-PARTE-2.md` (grande; sob demanda).
```

- [ ] **Step 2: Trocar a linha 22**

Old:
```
- Consulte o **CONTEXT.md** para navegar pelo contexto: estado atual (`CONTEXT-ESTADO-ATUAL.md`), fundação (`CONTEXT-PARTE-1.md`) e histórico (`CONTEXT-PARTE-2.md`).
```

New:
```
- Consulte o **STATE.md** para saber onde estamos: estado atual, próximo passo, fundação (`CONTEXT-PARTE-1.md`) e histórico (`CONTEXT-PARTE-2.md`).
```

- [ ] **Step 3: Verificar**

```bash
grep -n "CONTEXT-ESTADO-ATUAL\|CONTEXT\.md" README.md
```

Esperado: nenhum resultado.

---

### Task 7: Corrigir links vivos em `PRD-FASE-3.md` e no template de fim de fase

**Files:**
- Modify: `docs-SEP/docs-sep/PRD-FASE-3.md:43`
- Modify: `docs-SEP/docs-sep/PRD-FASE-3.md:337`
- Modify: `docs-SEP/docs-sep/TEMPLATE-PLANO-MELHORIA-FIM-DE-FASE.md:28`

- [ ] **Step 1: PRD-FASE-3.md linha 43 — postmortem vive no histórico, não no estado**

Old:
```
**Status: Concluida em 2026-05-06** (Sprint 4, branch `feature/sprint-4-erros-docs-testes` reimplementada apos incidente squash merge dos PRs #10/#11 que perderam o conteudo da sprint; mergeada em `main` via PR #16, commit `c5158de`; ver `CONTEXT.md` para o postmortem completo)
```

New:
```
**Status: Concluida em 2026-05-06** (Sprint 4, branch `feature/sprint-4-erros-docs-testes` reimplementada apos incidente squash merge dos PRs #10/#11 que perderam o conteudo da sprint; mergeada em `main` via PR #16, commit `c5158de`; ver `CONTEXT-PARTE-2.md` para o postmortem completo)
```

- [ ] **Step 2: PRD-FASE-3.md linha 337 — item 2 do pré-requisito de leitura**

Old:
```
2. [`docs-sep/CONTEXT.md`](./CONTEXT.md) — historico de decisoes
```

New:
```
2. [`docs-sep/STATE.md`](./STATE.md) — estado atual e ponteiros pro contexto
```

- [ ] **Step 3: TEMPLATE-PLANO-MELHORIA-FIM-DE-FASE.md linha 28**

Old:
```
- CONTEXT.md.
```

New:
```
- STATE.md.
```

- [ ] **Step 4: Verificar**

```bash
grep -n "CONTEXT-ESTADO-ATUAL\|CONTEXT\.md" docs-sep/PRD-FASE-3.md docs-sep/TEMPLATE-PLANO-MELHORIA-FIM-DE-FASE.md
```

Esperado: nenhum resultado.

---

### Task 8: Corrigir `steps-fase-4/backend/027-sprint-27-steps.md` (Task 27.6, ainda não executada)

**Files:**
- Modify: `docs-SEP/steps-fase-4/backend/027-sprint-27-steps.md:368-371`

- [ ] **Step 1: Trocar os dois itens do checklist de documentação da Task 27.6**

Old:
```
- `docs-sep/CONTEXT-ESTADO-ATUAL.md`: sobrescrever estado + proximo passo (Sprint 27 fechada ->
  proxima sprint da Fase 4); apendar entrada curta ao historico em `docs-sep/CONTEXT-PARTE-2.md`.
- `AI-ROADMAP.md`.
```

New:
```
- `docs-sep/STATE.md`: sobrescrever estado + proximo passo + leia agora (Sprint 27 fechada ->
  proxima sprint da Fase 4); apendar entrada curta ao historico em `docs-sep/CONTEXT-PARTE-2.md`.
- `AI-ROADMAP.md`, se a tarefa mudar o mapa de navegacao por modulo.
```

- [ ] **Step 2: Verificar**

```bash
grep -n "CONTEXT-ESTADO-ATUAL\|CONTEXT\.md" steps-fase-4/backend/027-sprint-27-steps.md
```

Esperado: nenhum resultado.

---

### Task 9: Varredura final e checkpoint

**Files:** nenhum (só leitura/verificação)

- [ ] **Step 1: Grep total no repo por referências soltas**

```bash
cd docs-SEP
grep -rln "CONTEXT-ESTADO-ATUAL\|CONTEXT\.md" --include="*.md" . \
  | grep -v -E "^\./(adr|specs/fase-1|specs/fase-2|steps-fase-1|steps-fase-2|steps-fase-3)/" \
  | grep -v "^\./docs-sep/CONTEXT-PARTE-2.md"
```

Esperado: nenhuma linha (tudo que sobrar deve estar só dentro das pastas excluídas — histórico
imutável — ou não existir mais).

- [ ] **Step 2: Confirmar que `CONTEXT-PARTE-2.md` não ganhou nova referência solta além do que a Task 3 já tratou**

```bash
grep -n "CONTEXT-ESTADO-ATUAL\|CONTEXT\.md" docs-sep/CONTEXT-PARTE-2.md
```

Esperado: nenhum resultado (Task 3 já cobriu os 2 pontos existentes).

- [ ] **Step 3: Diff-check de conteúdo — nenhuma seção da antiga CONTEXT-ESTADO-ATUAL.md foi perdida**

Ler `docs-sep/STATE.md` e conferir visualmente as 5 seções: Onde estamos, Proximo passo, Gates
externos pendentes, Decisoes ativas ainda vigentes, Ponteiros — todas presentes, mais a seção nova
"Leia agora".

- [ ] **Step 4: `git status` para o checkpoint (sem stage, sem commit — regra manual do repo)**

```bash
git status --short
```

- [ ] **Step 5: Apresentar ao usuário**

Resumo do diff (arquivos criados/apagados/modificados), resultado das varreduras grep do Step 1 e
2, e confirmação de que o Step 3 não achou seção perdida. Aguardar o usuário revisar e commitar
manualmente — nenhum `git add`/`git commit` é executado pelo agente neste repo.

---

## Verificação de cobertura do spec

- Fusão CONTEXT.md + CONTEXT-ESTADO-ATUAL.md → STATE.md: Task 1.
- Bloco "Leia agora": Task 1.
- PRD.md sai da leitura obrigatória incondicional: Task 4 (AGENT.md), Task 5 (AI-ROADMAP.md).
- AI-ROADMAP.md vira condicional: Task 4, Task 5.
- CONTEXT-PARTE-1.md/PARTE-2.md mantêm nome, só repointam: Task 2, Task 3.
- Varredura de referências soltas: Task 6, 7, 8 (achadas na varredura inicial) + Task 9 (confirmação final).
- Nenhuma mudança em arquivos históricos fechados (ADRs, specs/steps fase 1-3): respeitado — não
  aparecem em nenhuma Task.
