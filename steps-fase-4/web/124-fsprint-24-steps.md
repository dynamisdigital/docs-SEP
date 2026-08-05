# Steps - F-Sprint 24 - Divida tecnica do web

**Spec de origem**: [`124-fsprint-24-divida-tecnica-web.md`](../../specs/fase-4/124-fsprint-24-divida-tecnica-web.md)

**Status**: **planejada** (criada em 2026-08-05). Nenhuma Task executada.

**Sprint irma**: nenhuma. E a **segunda** das tres sprints de divida planejadas em 2026-08-05:
[`D-1`](../cross-repo/300-dsprint-1-steps.md) -> `F-24` -> [`35`](../backend/035-sprint-35-steps.md).

**Objetivo geral**: fechar os dois defeitos vivos que a F-22 e a F-23 nomearam sem corrigir, e levar o
`contract:check` a **zero lacunas** pela primeira vez desde a criacao do gate na F-19.

**Esforco total estimado**: 2 dias de Dev Pleno Frontend.

**Repos de destino**:

- `sep-app`: `core/interceptors/error.interceptor.ts`, `core/interceptors/auth.interceptor.ts`,
  `core/api/api-error.ts`, `core/api/api.models.ts`,
  `features/authenticated/backoffice/shared/backoffice-format.ts`,
  `features/public/login/login.component.ts`,
  `features/public/login/verify-totp/verify-totp.component.ts`,
  `features/public/account-locked/account-locked.component.spec.ts`,
  `contracts/consumed-contracts.json`, `src/mocks/handlers.ts`, e os `*.spec.ts` da Task F-24.6.
- `docs-SEP`: este step, a spec 124, indices e PR description; **Git manual**.

**Branch sugerida**: `feature/fsprint-24-divida-tecnica`, criada de `develop` atualizado.

**Pre-requisito**: **D-Sprint 1 mergeada em `develop`.** Nao e dependencia funcional — e para nao
disputar `package-lock.json` entre duas branches vivas.

**Skills obrigatorias durante a implementacao**: `coding-guidelines`, `clean-code`,
`sep-web-mutation-verified-testing`.

---

## Estado atual verificado (2026-08-05)

Levantado antes de planejar. Qualquer divergencia encontrada no Gate F-24.0 invalida o desenho abaixo.

### O vetor da `/account-locked` (F-24.1)

`app.config.ts:24-28` — a cadeia registrada e:

```text
clientChannelInterceptor -> authInterceptor -> stepUpInterceptor -> errorInterceptor
```

`errorInterceptor` e o **ultimo do array**, logo o mais interno: ve a resposta **antes** do
`catchError` do service.

`error.interceptor.ts`:
- `:21` — `error.status === 401 && !req.url.includes('/auth/login')` -> `clearSession()` +
  `navigateByUrl('/login')`;
- `:26` — `error.status === 403 && !req.context.get(TRATA_403_LOCALMENTE)` -> `navigateByUrl('/access-denied')`;
- `:31-34` — `423` -> `clearSession()` + `navigateByUrl('/account-locked')`;
- `:36-37` — `429` **nao e tratado** (propaga intacto).

**Nenhuma das tres navegacoes isenta `/auth/politica-lockout`.**

`politica-lockout.service.ts:39` tem `catchError(() => of(null))`, e `:24-26` documenta que ele mora
ali porque `toSignal` relanca o erro na leitura do signal. **Isso segue verdadeiro e nao e o que esta
em questao**: o `catchError` protege o *render*; o vetor e a *navegacao*, que acontece antes.

`auth.interceptor.ts:30` — `const ROTAS_SEM_AUTHORIZATION = ['/auth/login', '/auth/politica-lockout'];`
Ja existe a nocao de rota publica; falta o `errorInterceptor` conhece-la.

### `/auth/totp/verify` (F-24.2)

`auth.interceptor.ts:11-15` documenta o defeito **e prescreve a correcao**, no proprio codigo:

> A omissao de `/auth/totp/verify` e um defeito conhecido [...] `handleTokenResponse` retorna cedo no
> ramo `mfaRequired` sem limpar o token, entao a verificacao de TOTP leva um `Authorization` morto,
> toma 401 e o usuario perde o desafio. [...] Quem for fechar: acrescentar a rota e cobrir o caminho
> do challenge.

O docblock tambem registra que o `SecurityConfig` tem **oito** `permitAll` e que a lista **nao e** a
deles — ficam de fora `POST /usuarios`, `/auth/refresh`, `/auth/logout` e os webhooks. A Task
acrescenta **uma** rota, nao as oito.

### `message: ""` (F-24.3) — o padrao correto ja existe no repo

| Arquivo | Operador | Comportamento com `message: ""` |
|---|---|---|
| `api-error.ts:22` | `corpo?.message ?? padrao` | devolve `""` -> **alerta vazio** |
| `login.component.ts:52` | `mensagemDaApi ?? '...'` | devolve `""` -> **alerta vazio** |
| `login.component.ts:71` | `mensagemDaApi ?? '...'` | devolve `""` -> **alerta vazio** |
| `verify-totp.component.ts:53,58,70` | `mensagemDaApi \|\| '...'` | cai no padrao -> **correto** |

`??` so cai no fallback com `null`/`undefined`; `""` e um valor definido e vence. O `verify-totp` ja
foi corrigido (F-22); o `login` e o helper compartilhado nao.

### `NaNmin` no dashboard (F-24.4)

- `api.models.ts:691` — `tempoMedioResolucao30d: number`.
- `api.models.ts:685-686` — comentario afirma *"serializado pelo backend como numero de segundos
  (Jackson `WRITE_DURATIONS_AS_TIMESTAMPS`)"*. **A afirmacao e falsa**: o Spring Boot **desliga**
  `WRITE_DURATIONS_AS_TIMESTAMPS` e o fio leva ISO-8601 (`"PT2H"`). Medido na Sprint 34; o `knownGap`
  do `consumed-contracts.json` registra a medicao e o `openapiType: "string"` esta **correto**.
- `backoffice-format.ts:30-44` — `formatarDuracao(segundos: number)`. A guarda `:31`
  (`!segundos || segundos <= 0`) **nao pega** `"PT2H"`: a string e truthy e `"PT2H" <= 0` e falso.
  Segue para `:34` `Math.round("PT2H" / 60)` = `NaN` e `:43` devolve `"NaNmin"`.
- `backoffice-dashboard-page.component.html:31` —
  `{{ formatarDuracao(d.tempoMedioResolucao30d) }}`. Unico caminho de chamada.
- `handlers.ts:1683` — mock devolve `7200` (numero). **Por isso nenhum teste ve.**

### Descriptor (F-24.5)

`consumed-contracts.json:1594-1602` — `backoffice.reprocessarWebhook` declara
`"erros": [403, 429]`. O `400` que a tela ramifica **nao esta declarado**.

A regra do descriptor (F-22, registrada no `$comment` do arquivo): declarar status de erro **so** onde
a tela ramifica; operacoes que usam `apiErr?.message ?? padrao` nao discriminam e nao declaram.

### `estabilizar()` (F-24.6)

**39 definicoes byte-identicas** de
`function estabilizar(fixture: ComponentFixture<unknown>): Promise<void>` em `*.spec.ts`, espalhadas
por `features/authenticated/**` e `features/public/**`. O `STATE.md` registra "terceira copia" —
**subestimado em 36**; conferir a contagem no Gate.

### Copy da `/account-locked` e literais duplicados (F-24.7)

`account-locked.component.spec.ts` ja foi reescrito pela F-23: usa
`provideHttpClient(withInterceptors([authInterceptor]))` + MSW, e
`POLITICA_DE_TESTE = { maxAttempts: 3, windowMinutes: 10, lockoutMinutes: 45 }` — valores distintos
entre si e dos defaults **de proposito**, para que trocar `windowMinutes` por `lockoutMinutes` no
template quebre o teste.

A fragilidade esta em `CABECALHO` (`'423Conta bloqueada temporariamente'`, colado) e `RODAPE`
(quatro frases unidas por `' '`). O comentario `:22-25` explica que a colagem depende de
`preserveWhitespaces: false` e de badge/heading serem irmaos sem espaco. **Reformatacao pura de
template quebra o teste sem que a copy tenha mudado.**

Literais byte-identicos entre `login` e `verify-totp` — **tres**, confirmados:

| Literal | login | verify-totp |
|---|---|---|
| `'Nao foi possivel concluir o acesso neste navegador. Verifique se o armazenamento local esta habilitado.'` | `:29` | `:128` |
| `'Conta bloqueada temporariamente. Tente novamente em 30 minutos.'` | `:52` | `:58` |
| `'Servico indisponivel no momento. Tente de novo em instantes.'` | `:71` | `:70` |

---

## Decisoes da sprint

1. **O `errorInterceptor` ganha a mesma nocao de rota publica que o `authInterceptor`, compartilhada.**
   A justificativa de `auth.interceptor.ts:25-28` vale igual: **ser publico e propriedade do
   endpoint**, que o interceptor le da URL, e nao decisao do call site. Duas listas separadas
   divergiriam na proxima rota publica.
   *Rejeitado*: mover o `errorInterceptor` para antes do `stepUpInterceptor` — mudaria o
   comportamento de **todas** as chamadas para consertar uma, e a ordem atual e deliberada (o
   `errorInterceptor` precisa ver o erro depois do step-up).
   *Rejeitado*: `TRATA_403_LOCALMENTE` na chamada da politica — cobriria o `403` e deixaria o `401`
   aberto, que e o status mais provavel contra backend sem a Sprint 34.

2. **`message: ""` resolve no helper, e o `login` passa a usa-lo.** O `verify-totp` ja acerta com `||`,
   mas espalhar `||` por call site repete a decisao em cada ponto novo. A correcao mora em
   `mensagemDeErroDaApi` (`api-error.ts:22`), que ja e "corpo unico de verdade para os helpers de
   dominio" pelo proprio docblock.
   *Nota*: `||` tambem descartaria `0` e `false`, o que aqui **nao importa** — o campo e `string`. Usar
   `||` cru esconde essa premissa; uma checagem explicita de vazio a torna legivel.

3. **O `NaNmin` corrige no tipo, no parse e no mock — os tres.** Corrigir so o tipo deixa o
   `formatarDuracao` recebendo string; corrigir so o parse deixa o tipo mentindo; corrigir os dois sem
   o mock mantem o ponto cego que escondeu o defeito por sprints. E o comentario falso de
   `api.models.ts:685-686` **e a origem do erro** — some com ele.
   *Proibido*: anotar `@Schema(type = number)` no backend. O `followUp` do `knownGap` registra que foi
   tentado na Task 34.6 e **revertido**, porque publicaria um tipo que o servidor nunca emite e
   apagaria o unico detector do `NaNmin`.

4. **A F-24.6 vai em commit proprio e isolado.** 39 arquivos de teste num diff mecanico; o risco nao e
   regressao de produto, e mascarar as outras tasks no review.

5. **A F-24.7 preserva a intencao original do teste.** `account-locked.component.spec.ts` foi escrito
   para **quebrar** a cada mudanca de copy — o comentario diz *"Qualquer mudanca de copy DEVE quebrar
   aqui e ser reconferida contra o sep-api"*. O alvo e sobreviver a **reformatacao de template**
   mantendo a deteccao de **mudanca de texto**. Se as duas nao puderem ser separadas, a instrucao
   original vence e a task e reportada como **nao feita** — nao afrouxada.

---

## Protocolo obrigatorio por Task

1. Executar **somente** a Task liberada; nao adiantar a seguinte.
2. Toda afirmacao sobre o codigo atual conferida no arquivo, com `arquivo:linha` — nao pela memoria
   nem por este documento.
3. Teste novo **verificado por mutacao**: aplicar a mutacao nomeada, ver o teste falhar, reverter.
   Teste que sobrevive e considerado **nao entregue**.
4. Rodar a verificacao da Task antes de pedir checkpoint. Capturar `EXIT=$?` explicito; **nunca**
   validar por `| tail`, que mascara o codigo de saida.
5. **PAUSA #1** — checkpoint pre-commit: `git status --short --branch`, `git diff --stat`, arquivos
   criados/modificados/removidos, gates rodados e resultado, riscos/pendencias, mensagem sugerida.
   Aguardar aprovacao explicita antes de `git add`/`git commit`. `git add <paths>`, nunca `-A`.
6. Commit + `chown -R mauricio:mauricio .git .claude` logo apos.
7. **Um** code review por subagente. Se houver findings: hotfix -> **PAUSA #2** -> commit do hotfix,
   **sem novo review de subagente**.
8. **PAUSA #3** — fim da Task. Aguardar o review manual do usuario e ordem explicita para a proxima.
9. Push e PR **manuais** (dev humano). Em `docs-SEP` o git e 100% manual.

---

## Rastreabilidade spec 124 -> steps

| Item da spec | Steps |
|---|---|
| Rotas publicas isentas no `errorInterceptor` | F-24.1 |
| `/auth/totp/verify` no `authInterceptor` | F-24.2 |
| `message: ""` | F-24.3 |
| `tempoMedioResolucao30d` + `NaNmin` + mock + comentario | F-24.4 |
| `reprocessarWebhook` `400` + inventario | F-24.5 |
| Helper `estabilizar()` | F-24.6 |
| Copy robusta + literais duplicados | F-24.7 |
| Baseline, gates e limitacoes | Gate F-24.0 e Fechamento |

---

## Ordem de execucao

```text
Gate F-24.0 (precheck + baseline)
  -> F-24.1  errorInterceptor       [defeito vivo; primeiro por severidade]
  -> F-24.2  authInterceptor        [DEPOIS da F-24.1: as duas mexem na nocao de rota publica,
                                     e a lista compartilhada nasce na F-24.1]
  -> F-24.3  message vazia          [independente]
  -> F-24.4  NaNmin + tipo + mock   [independente; fecha o ultimo knownGap]
  -> F-24.5  descriptor             [independente]
  -> F-24.6  estabilizar()          [POR ULTIMO entre as de codigo: toca 39 arquivos e
                                     conflitaria com qualquer task anterior nao commitada]
  -> F-24.7  copy + literais        [depois da F-24.6: mexe em specs que ela acabou de tocar]
Fechamento (gates completos + docs + PR description)
```

A posicao da F-24.6 **nao e preferencia**: ela edita 39 `*.spec.ts`, entre eles os de `login`,
`verify-totp` e `account-locked`, que as Tasks F-24.1, F-24.2 e F-24.7 tambem tocam.

---

## Gate F-24.0 - Precheck e baseline

### Step 124.0.1 - Branch a partir de `develop` atualizado

```bash
cd /home/mauricio/workspaces/workspace-sep/sep-app
git fetch origin
git checkout develop && git pull --ff-only
git diff --stat origin/main origin/develop   # esperado: vazio
git log --oneline -1                          # deve conter a D-Sprint 1
git checkout -b feature/fsprint-24-divida-tecnica
```

Se a D-Sprint 1 **nao** estiver em `develop`, parar e reportar (ver §Pre-requisito).

### Step 124.0.2 - Baseline medida

```bash
npm ci
npm test                     # partida esperada: 765 / 94 arquivos
npm run contract:check       # partida esperada: 85 operacoes / 1 lacuna / exit 0
npm run lint && npm run format:check
npm run build
npx playwright test          # partida esperada: 39
```

**Por que e gate e nao task**: numero nao medido aqui nao pode ser citado no fechamento.

### Step 124.0.3 - Reconferir os 8 pontos que o desenho assume

Conferir no arquivo, e nao neste documento: `app.config.ts:24-28` (ordem da cadeia);
`error.interceptor.ts:21,26,31` (as tres navegacoes, nenhuma isentando a politica);
`auth.interceptor.ts:11-15,30` (docblock do defeito + a lista); `api-error.ts:22` (`??`);
`login.component.ts:52,71` (`??`) contra `verify-totp.component.ts:53,58,70` (`||`);
`api.models.ts:685-691` (comentario falso + tipo); `backoffice-format.ts:31` (a guarda que nao pega
string); `consumed-contracts.json:1594-1602`.

E **recontar** as definicoes de `estabilizar`:

```bash
grep -rc "function estabilizar" src --include=*.spec.ts | grep -v ":0" | wc -l   # esperado: 39
```

### Definicao de pronto do Gate F-24.0

- [ ] Branch criada de `develop` atualizado com a D-1 dentro; `develop == main` por conteudo.
- [ ] Baseline anotada (Vitest, `contract:check`, lint, format, build, Playwright).
- [ ] Os 8 pontos conferidos e a contagem de `estabilizar` recontada, ou a divergencia reportada
      antes de qualquer codigo.

---

## Task F-24.1 - Rotas publicas isentas da navegacao global

**Objetivo**: um `401`/`403` numa rota publica deixa de arrancar o usuario da pagina.
**Pre-requisito**: Gate F-24.0 aprovado.
**Esforco**: 0,4 dia.
**Arquivos esperados**: `core/interceptors/error.interceptor.ts`,
`core/interceptors/auth.interceptor.ts` (extrair a lista), + spec de cada um.

### Step 124.1.1 - Extrair a lista para modulo compartilhado

`ROTAS_SEM_AUTHORIZATION` (`auth.interceptor.ts:30`) sai do interceptor e vira constante compartilhada
em `core/interceptors/` (ou `core/api/`, conforme o padrao do repo — conferir no Gate). O nome deve
dizer o **conceito** (rota publica), nao o efeito num dos dois interceptors.

O docblock atual de `auth.interceptor.ts:6-29` explica *por que lista e nao `HttpContextToken`* e *por
que nao e a lista dos oito `permitAll`* — esse texto acompanha a constante para onde ela for. Perder
essa justificativa e como perder a decisao.

### Step 124.1.2 - `errorInterceptor` consulta a lista

As tres navegacoes de `error.interceptor.ts:21,26,31` passam a isentar rota publica. Cuidado no `423`
(`:31`): ele **deve continuar navegando** para `/account-locked` a partir do `/auth/login` — e o
caminho que a F-21 construiu. A isencao vale para `401`/`403`; o `423` mantem o comportamento atual.

Registrar no codigo **por que** o `423` e diferente, senao a proxima leitura "corrige" a assimetria.

### Step 124.1.3 - Testes

- Um teste que **reproduz o defeito**: `401` em `/auth/politica-lockout` **nao** navega para `/login`.
- Idem para `403` -> nao navega para `/access-denied`.
- Um teste que **trava o `423`**: `423` em `/auth/login` **continua** navegando para
  `/account-locked`.

**Mutacoes obrigatorias**: (a) remover a isencao do `401` — o primeiro teste deve falhar; (b)
acrescentar a isencao ao ramo do `423` — o terceiro deve falhar. Teste que sobrevive a sua mutacao
nao foi entregue.

### Verificacao da Task F-24.1

```bash
npm test; echo "EXIT=$?"
npm run lint; echo "EXIT=$?"
```

### Definicao de pronto da Task F-24.1

- [ ] Os tres testes existem e passam; as duas mutacoes foram aplicadas, viram falhar e foram revertidas.
- [ ] Uma unica lista de rotas publicas no repo (`grep` prova que nao sobrou copia).
- [ ] A justificativa do `423` diferente esta no codigo.

### Commit sugerido

```text
fix(core): isentar rotas publicas da navegacao global do errorInterceptor
```

---

## Task F-24.2 - `/auth/totp/verify` sem `Authorization` morto

**Objetivo**: o desafio de MFA para de ser perdido por token velho no storage.
**Pre-requisito**: Task F-24.1 concluida e aprovada (a lista compartilhada nasce la).
**Esforco**: 0,2 dia.
**Arquivos esperados**: a constante compartilhada da F-24.1 + spec.

### Step 124.2.1 - Acrescentar a rota

Uma linha na lista. **So essa rota**: o docblock de `auth.interceptor.ts:7-9` registra que o
`SecurityConfig` tem oito `permitAll` e que a lista **nao e a deles** — `POST /usuarios`,
`/auth/refresh`, `/auth/logout` e os webhooks ficam de fora por decisao, nao por esquecimento.
Preservar esse texto.

### Step 124.2.2 - Cobrir o caminho do challenge

O docblock descreve a cadeia: `handleTokenResponse` retorna cedo no ramo `mfaRequired` **sem limpar o
token**, entao `/auth/totp/verify` leva `Authorization` morto -> `401` -> usuario perde o desafio.

Teste do caminho inteiro, e nao so da isencao no interceptor: com token velho no storage, o fluxo de
MFA chega ao `verify` **sem** `Authorization`.

**Mutacao obrigatoria**: remover a rota da lista — o teste deve falhar.

### Verificacao da Task F-24.2

```bash
npm test; echo "EXIT=$?"
```

### Definicao de pronto da Task F-24.2

- [ ] Teste do caminho do challenge existe, passa e falha sob a mutacao.
- [ ] O docblock sobre os oito `permitAll` foi preservado e o comentario que descrevia o defeito como
      **aberto** foi atualizado — comentario que virou falso e o que a F-23 pegou no review.

### Commit sugerido

```text
fix(core): isentar /auth/totp/verify do Authorization no authInterceptor
```

---

## Task F-24.3 - `message: ""` deixa de apagar o alerta

**Objetivo**: corpo de erro com `message` vazio cai no texto padrao em vez de mostrar nada.
**Pre-requisito**: Task F-24.2 concluida e aprovada.
**Esforco**: 0,2 dia.
**Arquivos esperados**: `core/api/api-error.ts`, `features/public/login/login.component.ts`, + specs.

### Step 124.3.1 - Corrigir o helper

`api-error.ts:22` — `corpo?.message ?? padrao` passa a tratar string vazia como ausente. Preferir
checagem explicita de vazio a `||` cru: `||` tambem descartaria `0` e `false`, o que aqui nao importa
(o campo e `string`), mas esconder essa premissa e o que faz a proxima leitura hesitar.

### Step 124.3.2 - `login.component.ts` usa a mesma semantica

`:52` e `:71` usam `??`. O `verify-totp` (`:53,58,70`) ja usa `||` e **acerta** — o alvo e uma
semantica unica, nao espalhar `||` por call site.

### Step 124.3.3 - Testes

Um teste por ponto corrigido, com corpo `{ message: '' }`, assertando o **texto padrao**.

**Mutacao obrigatoria**: reverter para `??` em cada ponto — cada teste deve falhar. Um teste que passa
com as duas versoes esta assertando outra coisa.

### Verificacao da Task F-24.3

```bash
npm test; echo "EXIT=$?"
```

### Definicao de pronto da Task F-24.3

- [ ] Nenhum ponto do repo devolve `""` como mensagem de erro (`grep` por `message ??` prova).
- [ ] Um teste por ponto, cada um falhando sob sua mutacao.

### Commit sugerido

```text
fix(core): tratar message vazio como ausente na extracao de erro da API
```

---

## Task F-24.4 - `tempoMedioResolucao30d`, o `NaNmin` e o ultimo `knownGap`

**Objetivo**: o KPI do dashboard mostra a duracao real, e o `contract:check` vai a **zero lacunas**.
**Pre-requisito**: Task F-24.3 concluida e aprovada.
**Esforco**: 0,4 dia.
**Arquivos esperados**: `core/api/api.models.ts`,
`features/authenticated/backoffice/shared/backoffice-format.ts`, `src/mocks/handlers.ts`,
`contracts/consumed-contracts.json`, + specs.

### Step 124.4.1 - Tipo e comentario

`api.models.ts:691` — `tempoMedioResolucao30d: string`.

`api.models.ts:685-686` — o comentario afirma *"numero de segundos (Jackson
`WRITE_DURATIONS_AS_TIMESTAMPS`)"*. **E falso e e a origem do defeito.** Substituir pelo que a Sprint
34 mediu: o Spring Boot **desliga** essa feature, o fio leva ISO-8601 (`"PT2H"`), e o `openapiType:
"string"` do snapshot esta correto.

### Step 124.4.2 - Parse

`formatarDuracao` passa a receber a duracao ISO-8601. Duas mudancas, nao uma:

- interpretar `"PT2H"`, `"PT30M"`, `"PT1H30M"`, `"PT0S"`;
- a guarda de `:31` passa a rejeitar entrada **nao parseavel** devolvendo `'—'`. A guarda atual
  (`!segundos || segundos <= 0`) e exatamente o que **deixou** `"PT2H"` passar: string truthy,
  comparacao com `NaN` falsa.

Sem biblioteca nova. Formato fechado e pequeno; dependencia nova aqui seria complexidade
desnecessaria.

### Step 124.4.3 - Mock alinhado ao backend

`handlers.ts:1683` — trocar `7200` por `"PT2H"`. **Esta e a linha que escondeu o defeito**: enquanto o
mock for mais correto que o backend, nenhum teste ve.

### Step 124.4.4 - Fechar o `knownGap`

Remover a entrada de `consumed-contracts.json` §`knownGaps`. O `contract:check` deve sair de **1
lacuna para 0**.

**Nao tocar** `openapi.snapshot.json` nem `.meta.json`.

### Step 124.4.5 - Testes

- `formatarDuracao` para cada formato do 124.4.2 e para entrada invalida.
- Um teste **na tela**, passando `"PT2H"` pelo caminho de `backoffice-dashboard-page.component.html:31`
  e assertando `"2h"` — nao `NaNmin`.

**Mutacao obrigatoria**: devolver o mock para `7200` — o teste de tela deve falhar. Se ele passar com
os dois, esta assertando o mock e nao o comportamento.

### Verificacao da Task F-24.4

```bash
npm test; echo "EXIT=$?"
npm run contract:check; echo "EXIT=$?"    # esperado: 85 operacoes / 0 lacunas / exit 0
npm run build; echo "EXIT=$?"
```

### Definicao de pronto da Task F-24.4

- [ ] `contract:check` **0 lacunas**, exit 0.
- [ ] Teste de tela com `"PT2H"` passa e falha sob a mutacao do mock.
- [ ] O comentario falso de `api.models.ts` foi substituido pelo resultado medido.
- [ ] `openapi.snapshot.json` e `.meta.json` intocados (`git diff --stat` prova).

### Commit sugerido

```text
fix(backoffice): tratar tempoMedioResolucao30d como Duration ISO-8601
```

---

## Task F-24.5 - `reprocessarWebhook` declara o `400`

**Objetivo**: o `contract:check` passa a ter opiniao sobre o `400` que a tela ramifica.
**Pre-requisito**: Task F-24.4 concluida e aprovada.
**Esforco**: 0,2 dia.
**Arquivos esperados**: `contracts/consumed-contracts.json`.

### Step 124.5.1 - Confirmar que a tela ramifica

Antes de declarar: conferir no componente que ha ramo por `400`. A regra do descriptor e declarar
status **so onde ha ramo** — declarar por precaucao e declaracao falsa, e o `verificarStatusDeErro`
exige que o status exista no OpenAPI. Se o snapshot **nao** documentar o `400` nesse path, a
declaracao **quebra o check**: nesse caso o item vira `knownGap` com o motivo, e nao declaracao.

### Step 124.5.2 - Declarar

`consumed-contracts.json:1598` — `"erros": [400, 403, 429]`.

### Step 124.5.3 - Inventariar o resto

Contar e listar os pontos de ramificacao por status ainda sem `erros`. **So inventario**, com numero e
lista no PR description — varrer os ~20 e sprint propria e estouraria o teto de 7 tasks.

### Verificacao da Task F-24.5

```bash
npm run contract:check; echo "EXIT=$?"
```

### Definicao de pronto da Task F-24.5

- [ ] `400` declarado **ou** registrado como `knownGap` com o motivo (se o OpenAPI nao o documentar).
- [ ] `contract:check` segue com **0 lacunas** ou com exatamente a lacuna criada aqui, justificada.
- [ ] Inventario com numero, no PR description.

### Commit sugerido

```text
chore(contracts): declarar o 400 de backoffice.reprocessarWebhook
```

---

## Task F-24.6 - Helper unico para `estabilizar()`

**Objetivo**: uma definicao em vez de 39.
**Pre-requisito**: Task F-24.5 concluida e aprovada.
**Esforco**: 0,3 dia.
**Arquivos esperados**: helper novo em `src/testing/` (ou o diretorio que o repo ja usar — conferir no
Gate) + os 39 `*.spec.ts`.

### Step 124.6.1 - Criar o helper

Assinatura identica a das copias:
`estabilizar(fixture: ComponentFixture<unknown>): Promise<void>`. Copia byte-identica, sem
"melhorias" — mudar o comportamento aqui muda 39 suites de uma vez.

### Step 124.6.2 - Substituir

Remover a definicao local e importar, em cada arquivo. Preferir `Edit` a `sed`: o
[`AGENT.md`](../../AGENT.md) §Como trabalhar registra que `sed` com `/` ou escape ja esvaziou arquivo
neste repo.

### Step 124.6.3 - Provar equivalencia

A contagem de testes **nao pode mudar** — a Task nao acrescenta nem remove teste. Numero diferente do
da baseline significa que algo quebrou em silencio.

### Verificacao da Task F-24.6

```bash
npm test; echo "EXIT=$?"        # contagem IDENTICA a da Task anterior
npm run lint; echo "EXIT=$?"
npm run format:check; echo "EXIT=$?"
grep -rc "function estabilizar" src --include=*.spec.ts | grep -v ":0"   # esperado: nenhuma saida
```

### Definicao de pronto da Task F-24.6

- [ ] Zero definicoes locais restantes.
- [ ] Contagem de testes **identica** a da Task F-24.5.
- [ ] Commit **isolado**, sem nenhuma outra mudanca junto (Decisao 4).

### Commit sugerido

```text
refactor(test): extrair estabilizar() para helper unico
```

---

## Task F-24.7 - Copy robusta e literais compartilhados

**Objetivo**: o teste da `/account-locked` para de quebrar por reformatacao **sem** parar de detectar
mudanca de copy; e as tres frases identicas passam a ter uma origem.
**Pre-requisito**: Task F-24.6 concluida e aprovada.
**Esforco**: 0,3 dia.
**Arquivos esperados**: `features/public/account-locked/account-locked.component.spec.ts`,
`features/public/login/login.component.ts`,
`features/public/login/verify-totp/verify-totp.component.ts`, + specs.

### Step 124.7.1 - Copy robusta a reformatacao

`CABECALHO` (`'423Conta bloqueada temporariamente'`) e `RODAPE` dependem de badge/heading serem irmaos
sem espaco e de `preserveWhitespaces: false`. Normalizar whitespace na **comparacao** em vez de
codificar a colagem na **expectativa**.

**A intencao original nao muda** (Decisao 5): mudanca de texto continua tendo de quebrar. Provar por
mutacao dupla:
- trocar uma palavra da copy -> o teste **deve** falhar;
- reformatar o template (quebra de linha, indentacao) sem mudar texto -> o teste **deve** passar.

Se as duas nao puderem coexistir, **parar e reportar**: a instrucao de `:14` vence.

### Step 124.7.2 - Literais compartilhados

As tres frases da tabela §Estado atual passam a ter uma origem so. Manter a diferenca de **operador**
ja resolvida na F-24.3 — extrair a frase nao e extrair o ramo.

O literal `'Conta bloqueada temporariamente. Tente novamente em 30 minutos.'` embute `30 minutos`
fixo, mesmo problema que a F-23 corrigiu na `/account-locked`. **Nao e escopo desta task** consertar
isso — mas registrar como follow-up ao extrair, porque depois de centralizado fica barato.

### Verificacao da Task F-24.7

```bash
npm test; echo "EXIT=$?"
npm run lint; echo "EXIT=$?"
npx playwright test; echo "EXIT=$?"
```

### Definicao de pronto da Task F-24.7

- [ ] Mutacao dupla do 124.7.1 demonstrada (texto quebra, reformatacao nao).
- [ ] Uma origem por frase (`grep` prova).
- [ ] Follow-up do `30 minutos` fixo registrado.

### Commit sugerido

```text
refactor(public): unificar literais de erro e tornar a copy robusta a reformatacao
```

---

## Fechamento

### Gates completos

Rodar **depois** dos commits (o `lint-staged` reescreve arquivos), capturando `EXIT=$?`:

```bash
npm ci
npm run format:check; npm run lint; npm run lint:scss
npm run contract:check     # esperado: 0 lacunas
npm test
npm run build
npx playwright test
npm run audit              # gate instalado pela D-Sprint 1
```

### Documentacao

- `repos/sep-app/SPRINT-F-24-PR.md`, no formato dos anteriores (regra fixa do
  [`AGENT.md`](../../AGENT.md) §Git e checkpoints). Apagar o(s) `SPRINT-*-PR.md` da sprint anterior
  ao **iniciar** esta.
- `STATE.md` sobrescrito e entrada apendada em `CONTEXT-PARTE-2.md`.
- Linha de status em [`specs/fase-4/README.md`](../../specs/fase-4/README.md).

### Riscos a declarar como pendencia, nao simular

- **Smoke real contra `:8080` nao executado.** O vetor da F-24.1 e observavel offline (o MSW devolve
  `401` na rota da politica), mas o comportamento contra backend real sem a Sprint 34 fica declarado.
- Os ~20 pontos de ramificacao sem `erros`: inventariados, nao fechados (F-24.5).
- `idCurto`/`formatarMoeda` duplicados em 6 arquivos cada: mesma familia da F-24.6, mas codigo de
  producao — follow-up separado, risco diferente.
