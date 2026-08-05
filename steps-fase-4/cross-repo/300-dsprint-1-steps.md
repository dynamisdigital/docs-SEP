# Steps - D-Sprint 1 - Divida de dependencias no web e no mobile

**Spec de origem**: [`300-dsprint-1-divida-dependencias-web-mobile.md`](../../specs/fase-4/300-dsprint-1-divida-dependencias-web-mobile.md)

**Status**: **planejada** (criada em 2026-08-05). Nenhuma Task executada.

**Sprint irma**: nenhuma. E a **primeira** das tres sprints de divida planejadas em 2026-08-05, na
ordem `D-1` -> [`F-24`](../web/124-fsprint-24-steps.md) -> [`35`](../backend/035-sprint-35-steps.md).

**Objetivo geral**: os dois repos front param de acumular vulnerabilidade `high`/`critical` em
silencio, e a proxima regressao passa a **falhar o CI** em vez de esperar medicao manual.

**Esforco total estimado**: 1,5 a 2 dias de Dev Pleno Frontend (a faixa e larga de proposito — o custo
real so e conhecido depois que o Gate mede o que ainda existe apos o back-merge).

**Repos de destino**:

- `sep-app`: `package.json`, `package-lock.json`, `.github/workflows/ci.yml`.
- `sep-mobile`: `package.json`, `package-lock.json`, `.github/workflows/ci.yml`.
- `docs-SEP`: este step, a spec 300, `docs-sep/SEGURANCA.md`, indices e PR descriptions;
  **Git manual**.

**Branches sugeridas** (uma por repo, criadas de `develop` atualizado):

- `feature/dsprint-1-divida-dependencias` no `sep-app`;
- `feature/dsprint-1-divida-dependencias` no `sep-mobile`.

**Pre-requisito bloqueante**: **back-merge `main` -> `develop` no `sep-mobile`, feito pelo dev
humano.** Ver Gate D-1.0. Sem ele as Tasks D-1.3 e D-1.4 nao comecam.

**Skills obrigatorias durante a implementacao**: `coding-guidelines`, `clean-code`.

---

## Estado atual verificado (2026-08-05)

Levantado antes de planejar. Qualquer divergencia encontrada no Gate D-1.0 invalida o desenho abaixo.

### Ferramenta — o defeito de fundo

| Repo | script `audit` no `package.json` | step de audit no `ci.yml` |
|---|---|---|
| `sep-app` | **ausente** (17 scripts) | **ausente** |
| `sep-mobile` | **ausente** (16 scripts) | **ausente** |

`sep-app/.github/workflows/ci.yml` (`CI-APP`) tem dois jobs: `test` (`npm ci`, `format:check`,
`contract:check`, `lint`, `lint:scss`, `test:coverage`, upload de coverage) e `build` (`npm ci`,
`build`, upload).

`sep-mobile/.github/workflows/ci.yml` (`CI-MOBILE`) tem tres jobs: `test`, `build` (PWA) e `android`
(debug). **Os tres instalam com `npm ci --legacy-peer-deps`** — bump que resolva advisory mas quebre
peer range passa no install e so falha depois, no build ou no `cap sync`.

Nenhum dos dois workflows menciona `audit`. **Este e o motivo da divida**, e nao a contagem: a F-19
zerou o `sep-app` em 2026-07-16 e a regressao so foi vista em medicao manual 18 dias depois.

### Contagem medida

| Repo | Branch medida | total | critical | high | moderate | low |
|---|---|---|---|---|---|---|
| `sep-app` | `develop` (`c72b393`) | 19 | 0 | 12 | 7 | 0 |
| `sep-mobile` | `feature/msprint-17-...` | 25 | 1 | 15 | 8 | 1 |

**O numero do `sep-mobile` NAO e baseline.** Foi medido na branch de feature da M-17, que estava com
checkout ativo no repo — nao em `develop`. E `main` esta 7 commits a frente de `develop` com seis PRs
do Dependabot (`#137`, `#126`, `#129`, `#130`, `#132`, `#133`), que provavelmente ja derrubam parte da
contagem. Medir de novo, depois do back-merge, e a primeira coisa que o Gate faz.

### Restricao de baseline

- [ADR 0018](../../adr/0018-avaliacao-angular-22-no-web.md) **adiou o Angular 22**; o 20 esta em LTS
  ate 2026-11-28, com revisao do ADR marcada para 2026-09-30.
- [ADR 0019](../../adr/0019-baseline-capacitor-8-mobile.md) fixa Capacitor 8 no mobile.
- ADR **prevalece sobre spec e steps** ([`AGENT.md`](../../AGENT.md) §Ordem de leitura). Subir major
  aqui nao e opcao disponivel ao implementador.

---

## Decisoes da sprint

1. **O gate mede `critical`+`high`, nao `total`.** `npm audit --audit-level=high` sai diferente de
   zero so com `high`/`critical`; `moderate`/`low` seguem visiveis na saida e entram no registro da
   D-1.5 sem bloquear merge.
   *Por que*: `moderate`/`low` frequentemente nao tem correcao dentro da baseline, e um gate vermelho
   por construcao e um gate que o time aprende a ignorar.
   *Rejeitado*: `--audit-level=critical` (deixaria passar os dez `@angular/*` que sao o problema);
   gate em `total` (vermelho permanente); `npm audit fix --force` no CI (`--force` sobe major sem
   review, o que contraria o ADR 0018).

2. **Uma sprint, dois repos, dois PRs.** A contabilidade do projeto e por repo — 1 branch = 1 PR = 1
   `SPRINT-*-PR.md` —, mas o gate de aceite, a decisao sobre o irremediavel e o registro de divida sao
   **unicos**. Corrigir num repo e deixar o outro sem gate reproduz a condicao que criou a divida.

3. **O gate e provado falhando.** Uma execucao deliberada com limiar rebaixado, vista vermelha,
   revertida em seguida. Gate nunca visto vermelho e gate nao verificado — mesma logica da mutacao nos
   testes.

4. **Bump que exija mudanca de codigo leva a mudanca minima, no mesmo commit.** Nao e oportunidade de
   refactor. Se a mudanca minima nao for obvia, a Task para e reporta em vez de improvisar.

5. **Nada e silenciado sem registro.** `overrides`, `resolutions` ou exclusao de advisory so com linha
   propria na D-1.5 dizendo qual advisory, qual versao corrige e por que nao foi aplicada.

---

## Protocolo obrigatorio por Task

1. Executar **somente** a Task liberada; nao adiantar a seguinte.
2. Toda afirmacao sobre o estado atual conferida no arquivo/comando, com `arquivo:linha` ou saida
   capturada — nao pela memoria nem por este documento.
3. Rodar a verificacao da Task antes de pedir checkpoint. Capturar `EXIT=$?` explicito; **nunca**
   validar por `| tail`, que mascara o codigo de saida.
4. **PAUSA #1** — checkpoint pre-commit: `git status --short --branch`, `git diff --stat`, arquivos
   criados/modificados/removidos, gates rodados e resultado, riscos/pendencias, mensagem sugerida.
   Aguardar aprovacao explicita antes de `git add`/`git commit`. `git add <paths>`, nunca `-A`.
5. Commit + `chown -R mauricio:mauricio .git .claude` logo apos.
6. **Um** code review por subagente. Se houver findings: hotfix -> **PAUSA #2** (mesmo formato) ->
   commit do hotfix, **sem novo review de subagente**.
7. **PAUSA #3** — fim da Task. Aguardar o review manual do usuario e ordem explicita para a proxima.
8. Push e PR **manuais** (dev humano). Em `docs-SEP` o git e 100% manual: o agente so edita a working
   tree.

---

## Rastreabilidade spec 300 -> steps

| Item da spec | Steps |
|---|---|
| Remediar `sep-app` | D-1.1 |
| Gate de CI no `sep-app` | D-1.2 |
| Remediar `sep-mobile` | D-1.3 |
| Gate de CI no `sep-mobile` | D-1.4 |
| Registro da divida residual + `SEGURANCA.md` | D-1.5 |
| Baseline, back-merge e limitacoes | Gate D-1.0 e Fechamento |

---

## Ordem de execucao

```text
Gate D-1.0 (back-merge mobile + baseline nos dois repos)
  -> D-1.1  remediar sep-app       [independente]
  -> D-1.2  gate CI sep-app        [DEPOIS da D-1.1: senao o CI nasce vermelho
                                    e o proprio PR da sprint nao passa]
  -> D-1.3  remediar sep-mobile    [independente da D-1.1; BLOQUEADA ate o back-merge]
  -> D-1.4  gate CI sep-mobile     [DEPOIS da D-1.3, mesma razao]
  -> D-1.5  registro da divida     [depende de D-1.1 e D-1.3: so da para registrar
                                    o residual depois de saber qual e]
Fechamento (gates completos + docs + PR descriptions)
```

A ordem D-1.1 -> D-1.2 **nao e preferencia**: instalar o gate antes de remediar faz o job nascer
vermelho, e o primeiro PR a ser reprovado seria o desta sprint.

---

## Gate D-1.0 - Back-merge, baseline e precheck

**Objetivo**: confirmar que o desenho acima ainda descreve os repos, destravar o mobile, e medir os
numeros que o fechamento vai citar.

### Step 300.0.1 - Confirmar o back-merge no `sep-mobile` (dev humano)

O back-merge `main` -> `develop` no `sep-mobile` e **manual** e **pre-requisito**. Conferir:

```bash
cd /home/mauricio/workspaces/workspace-sep/sep-mobile
git fetch origin
git diff --stat origin/main origin/develop   # esperado: vazio
```

Se **nao** vier vazio, **parar** e reportar. As Tasks D-1.3/D-1.4 nao comecam: o Gate da proxima
sprint mobile confere a invariante `develop == main`, e entregar por cima da divergencia a agrava.

As Tasks D-1.1 e D-1.2 (`sep-app`) **nao dependem disso** e podem seguir.

### Step 300.0.2 - Branches a partir de `develop` atualizado

```bash
# em cada repo
git checkout develop && git pull --ff-only
git diff --stat origin/main origin/develop   # esperado: vazio nos dois
git checkout -b feature/dsprint-1-divida-dependencias
```

O `sep-app` estava em `develop` (`c72b393`); o `sep-mobile` estava em
`feature/msprint-17-followups-lockout-a11y-mobile`. Conferir o checkout, nao assumir.

### Step 300.0.3 - Baseline medida (esta e a baseline; a da spec nao vale)

```bash
# em cada repo
npm ci                        # sep-mobile: npm ci --legacy-peer-deps
npm audit --json > /tmp/audit-baseline-<repo>.json; echo "EXIT=$?"
npm audit                     # saida legivel, para o registro
npm test                      # anotar total e nº de arquivos
npm run build
```

No `sep-app`, tambem `npm run contract:check` e `npx playwright test`.
No `sep-mobile`, tambem `npx cap sync android`.

Anotar por repo: `critical`, `high`, `moderate`, `low`, `total`, **e a lista de pacotes diretos em
`high`/`critical`** — e ela que decide se a correcao cabe na baseline.

**Por que e gate e nao task**: numero nao medido aqui nao pode ser citado no fechamento. A F-22
registrou baselines herdadas erradas mais de uma vez, e a contagem do `sep-mobile` desta spec ja
nasce sabidamente errada (branch de feature).

### Step 300.0.4 - Reconferir os pontos que o desenho assume

Conferir no arquivo: ausencia de script `audit` nos dois `package.json`; ausencia de step de audit nos
dois `ci.yml`; `--legacy-peer-deps` nos tres jobs do `CI-MOBILE`; e que o ADR 0018 e o 0019 seguem
vigentes.

### Definicao de pronto do Gate D-1.0

- [ ] Back-merge do `sep-mobile` confirmado, ou a pendencia reportada e o escopo mobile suspenso.
- [ ] Branches criadas de `develop` atualizado; `develop == main` por conteudo nos dois repos.
- [ ] Baseline anotada nos dois repos, com a lista de pacotes diretos em `high`/`critical`.
- [ ] Os 4 pontos do 300.0.4 conferidos, ou a divergencia reportada antes de qualquer bump.

---

## Task D-1.1 - Remediar `critical`+`high` no `sep-app`

**Objetivo**: a contagem de `high`/`critical` cai, sem sair da baseline do ADR 0018.
**Pre-requisito**: Gate D-1.0 aprovado.
**Esforco**: 0,5 dia.
**Arquivos esperados**: `package.json`, `package-lock.json` (+ codigo de app **so** se um bump exigir).

### Step 300.1.1 - Aplicar o que cabe na baseline

```bash
npm audit fix          # SEM --force: --force sobe major e contraria o ADR 0018
npm audit
```

Para o que sobrar, avaliar item a item se ha versao **patch/minor** dentro do Angular 20.x que
corrija. Aplicar por bump explicito no `package.json`, nao por edicao manual do lock.

### Step 300.1.2 - Classificar o residual

Para cada `high`/`critical` que **nao** foi corrigido, anotar: pacote, se e dependencia direta ou
transitiva, advisory, versao que corrige, e por que nao foi aplicada (tipicamente: exige major).
Isso e o insumo da D-1.5 — anotar **agora**, enquanto o contexto esta fresco.

### Step 300.1.3 - Provar que nada regrediu

Bump de dependencia nao aparece no `npm audit`; aparece em teste e em build.

### Verificacao da Task D-1.1

```bash
npm ci; echo "EXIT=$?"
npm run format:check; echo "EXIT=$?"
npm run lint; echo "EXIT=$?"
npm run contract:check; echo "EXIT=$?"
npm test; echo "EXIT=$?"
npm run build; echo "EXIT=$?"
npx playwright test; echo "EXIT=$?"
npm audit
```

### Definicao de pronto da Task D-1.1

- [ ] `high`+`critical` menor que a baseline do Gate, com os dois numeros citados.
- [ ] Todos os gates acima verdes, com `EXIT=0` capturado.
- [ ] Residual classificado (300.1.2), pronto para a D-1.5.
- [ ] Nenhum major subido; `git diff package.json` prova.

### Commit sugerido

```text
chore(deps): remediar vulnerabilidades high/critical dentro do Angular 20.x
```

---

## Task D-1.2 - Gate de `npm audit` no CI do `sep-app`

**Objetivo**: a proxima regressao falha o CI em vez de esperar medicao manual.
**Pre-requisito**: Task D-1.1 concluida e aprovada.
**Esforco**: 0,2 dia.
**Arquivos esperados**: `package.json`, `.github/workflows/ci.yml`.

### Step 300.2.1 - Script

Script `audit` no `package.json`, com o limiar **explicito no comando** e nao escondido em config:

```json
"audit": "npm audit --audit-level=high"
```

### Step 300.2.2 - Step no `ci.yml`

No job `test` do `CI-APP`, apos `Install dependencies` e junto dos demais gates de qualidade
(`Format check`, `Contract check`, `Lint`). Nomear o step de forma que a falha seja auto-explicativa
no log do GitHub.

### Step 300.2.3 - Provar que o gate morde

Rebaixar o limiar deliberadamente (`--audit-level=low`), rodar, **ver falhar**, reverter. Registrar a
saida no checkpoint.

Gate nunca visto vermelho e gate nao verificado — e o mesmo raciocinio da verificacao por mutacao nos
testes.

### Verificacao da Task D-1.2

```bash
npm run audit; echo "EXIT=$?"          # esperado: EXIT=0
npm audit --audit-level=low; echo "EXIT=$?"   # esperado: EXIT!=0 (prova do 300.2.3)
```

### Definicao de pronto da Task D-1.2

- [ ] `npm run audit` existe e sai 0.
- [ ] Step presente no job `test` do `CI-APP`.
- [ ] Falha deliberada demonstrada e revertida, com a saida no checkpoint.

### Commit sugerido

```text
ci(app): adicionar gate de npm audit no CI-APP
```

---

## Task D-1.3 - Remediar `critical`+`high` no `sep-mobile`

**Objetivo**: mesmo da D-1.1, no mobile, dentro dos ADRs 0018 e 0019.
**Pre-requisito**: Gate D-1.0 aprovado **com o back-merge confirmado**. Independente da D-1.1.
**Esforco**: 0,5 dia.
**Arquivos esperados**: `package.json`, `package-lock.json`.

Mesma sequencia da D-1.1 (aplicar o que cabe -> classificar o residual -> provar que nada regrediu),
com duas diferencas que importam:

- **Instalar sempre com `--legacy-peer-deps`**, como os tres jobs do `CI-MOBILE` fazem. Um bump pode
  resolver o advisory e quebrar peer range **sem falhar o install** — por isso a verificacao inclui
  build e `cap sync`.
- **Capacitor/Ionic seguem a baseline do [ADR 0019](../../adr/0019-baseline-capacitor-8-mobile.md)**:
  major so com ADR novo.

### Verificacao da Task D-1.3

```bash
npm ci --legacy-peer-deps; echo "EXIT=$?"
npm run format:check; echo "EXIT=$?"
npm run lint; echo "EXIT=$?"
npm test; echo "EXIT=$?"
npm run build; echo "EXIT=$?"
npx cap sync android; echo "EXIT=$?"
npx playwright test; echo "EXIT=$?"
npm audit
```

### Definicao de pronto da Task D-1.3

- [ ] `high`+`critical` menor que a baseline do Gate, com os dois numeros citados.
- [ ] Gates acima verdes, **incluindo `cap sync android`** — e o que pega quebra de peer range.
- [ ] Residual classificado, pronto para a D-1.5.
- [ ] Nenhum major de Angular, Ionic ou Capacitor subido.

### Commit sugerido

```text
chore(deps): remediar vulnerabilidades high/critical dentro da baseline mobile
```

---

## Task D-1.4 - Gate de `npm audit` no CI do `sep-mobile`

**Objetivo**: mesmo da D-1.2, no `CI-MOBILE`.
**Pre-requisito**: Task D-1.3 concluida e aprovada.
**Esforco**: 0,2 dia.
**Arquivos esperados**: `package.json`, `.github/workflows/ci.yml`.

Mesmo desenho da D-1.2: script `audit` com limiar explicito, step no job `test` do `CI-MOBILE` junto
dos demais gates de qualidade, e prova de que o gate morde (rebaixar limiar, ver falhar, reverter).

O `CI-MOBILE` tem **tres** jobs (`test`, `build`, `android`). O gate vai **so no `test`**: repetir nos
tres triplicaria o tempo sem cobrir nada a mais, ja que os tres instalam do mesmo lock.

### Verificacao da Task D-1.4

```bash
npm run audit; echo "EXIT=$?"                 # esperado: EXIT=0
npm audit --audit-level=low; echo "EXIT=$?"   # esperado: EXIT!=0
```

### Definicao de pronto da Task D-1.4

- [ ] `npm run audit` existe e sai 0.
- [ ] Step presente **apenas** no job `test` do `CI-MOBILE`, com a razao registrada.
- [ ] Falha deliberada demonstrada e revertida.

### Commit sugerido

```text
ci(mobile): adicionar gate de npm audit no CI-MOBILE
```

---

## Task D-1.5 - Registrar a divida residual

**Objetivo**: o que nao foi remediado fica registrado com o porque, para a proxima sprint nao
redescobrir a mesma restricao.
**Pre-requisito**: Tasks D-1.1 e D-1.3 concluidas (so da para registrar o residual depois de conhece-lo).
**Esforco**: 0,2 dia.
**Arquivos esperados**: `docs-SEP/docs-sep/SEGURANCA.md` (**working tree apenas — git manual**).

### Step 300.5.1 - Tabela do residual

Uma linha por item `high`/`critical` remanescente, nos dois repos: pacote, direto ou transitivo,
advisory, versao que corrige, razao de nao ter sido aplicado, e se e insumo da revisao do ADR 0018
marcada para **2026-09-30**.

### Step 300.5.2 - Registrar o gate

Documentar em `SEGURANCA.md` que os dois repos passaram a ter gate de `npm audit` no CI com limiar
`high`, **e que o `sep-api` nao tem cobertura equivalente** — `build.gradle` nao tem plugin de scan
(`java`, `org.springframework.boot`, `io.spring.dependency-management`, `com.diffplug.spotless`,
`jacoco`, e so). Follow-up nomeado, candidato a sprint propria.

### Step 300.5.3 - Numeros antes/depois

Registrar as duas medicoes com data. Se a contagem tiver mudado entre o Gate e o fechamento sem
ninguem tocar em nada — advisories sao publicados continuamente —, registrar **as duas**, e nao
reescrever a baseline.

### Definicao de pronto da Task D-1.5

- [ ] Todo `high`/`critical` remanescente tem linha propria com os cinco campos.
- [ ] A ausencia de cobertura no `sep-api` esta registrada como follow-up, nao como omissao.
- [ ] Numeros antes/depois com data, por repo.

### Commit sugerido

Nenhum. `docs-SEP` e **100% manual no git**: o agente edita a working tree e para.

---

## Fechamento

### Gates completos

Rodar **depois** dos commits (o `lint-staged` reescreve arquivos), capturando `EXIT=$?`:

- `sep-app`: `npm ci`, `format:check`, `lint`, `lint:scss`, `contract:check`, `test`, `build`,
  `playwright test`, `npm run audit`.
- `sep-mobile`: `npm ci --legacy-peer-deps`, `format:check`, `lint`, `lint:scss`, `test`, `build`,
  `cap sync android`, `playwright test`, `npm run audit`.

### Documentacao

- `SPRINT-D-1-PR.md` em `repos/sep-app/` e em `repos/sep-mobile/` (um por PR), no formato dos
  anteriores. Regra fixa do [`AGENT.md`](../../AGENT.md) §Git e checkpoints.
- `STATE.md` sobrescrito e entrada apendada em `CONTEXT-PARTE-2.md`.
- Linha de status atualizada em [`specs/fase-4/README.md`](../../specs/fase-4/README.md).

### Riscos a declarar como pendencia, nao simular

- **Smoke real contra `:8080` nao executado.** Bump que altere comportamento de runtime nao aparece em
  Vitest nem em `npm audit`. Declarar explicitamente, no padrao da F-23.
- Contagem residual de `moderate`/`low` — fora do limiar do gate por decisao, nao por esquecimento.
- `sep-api` sem cobertura de scan.
