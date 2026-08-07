# Steps - F-Sprint 24 - Divida tecnica do web

**Spec de origem**: [`124-fsprint-24-divida-tecnica-web.md`](../../specs/fase-4/124-fsprint-24-divida-tecnica-web.md)

**Status**: **em execucao**. Criada em 2026-08-05. **Gate F-24.0 concluido em 2026-08-06** — baseline
medida, 8 ancoras conferidas byte a byte, cinco correcoes aplicadas a este documento e a spec 124
(ver §Estado atual verificado e §Correcoes do Gate F-24.0 da spec). Nenhuma Task de codigo executada.

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
  `contracts/consumed-contracts.json`, `src/mocks/handlers.ts`, o helper novo de teste
  (`src/testing/`, a criar) e os ~44 `*.spec.ts` da Task F-24.6.
- `docs-SEP`: este step, a spec 124, indices e PR description; **Git manual**.

**Branch sugerida**: `feature/fsprint-24-divida-tecnica`, criada de `develop` atualizado.

**Pre-requisito**: **D-Sprint 1 mergeada em `develop`.** Nao e dependencia funcional — e para nao
disputar `package-lock.json` entre duas branches vivas.

**Skills obrigatorias durante a implementacao**: `coding-guidelines`, `clean-code`,
`sep-web-mutation-verified-testing`.

---

## Estado atual verificado (2026-08-05; **re-medido no Gate F-24.0 em 2026-08-06**)

Levantado antes de planejar. Qualquer divergencia encontrada no Gate F-24.0 invalida o desenho abaixo.

**Resultado do Gate**: as 8 ancoras de `arquivo:linha` conferiram **byte a byte**. Cairam dois numeros
(Vitest `94` -> `93`, `estabilizar` `39` -> `38`) e uma premissa (`byte-identicas`), e apareceram dois
achados que ampliam Tasks (`trim` na F-24.3, tres comentarios falsos na F-24.4). As secoes abaixo ja
estao corrigidas; o registro completo, com a evidencia de cada medicao, esta em
[`spec 124`](../../specs/fase-4/124-fsprint-24-divida-tecnica-web.md) §Correcoes do Gate F-24.0.

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

### `message: ""` (F-24.3) — o padrao correto ja existe no repo, e tem **duas** partes

| Arquivo | Extracao | Operador | `message: ""` | `message: "   "` |
|---|---|---|---|---|
| `api-error.ts:21-22` | `?.message` (sem `trim`) | `?? padrao` | `""` -> **alerta vazio** | **alerta em branco** |
| `login.component.ts:32,52` | `?.message` (sem `trim`) | `?? '...'` | `""` -> **alerta vazio** | **alerta em branco** |
| `login.component.ts:32,71` | `?.message` (sem `trim`) | `?? '...'` | `""` -> **alerta vazio** | **alerta em branco** |
| `verify-totp.component.ts:48,53,58,70` | `?.message?.trim()` | `\|\| '...'` | cai no padrao -> **correto** | cai no padrao -> **correto** |

`??` so cai no fallback com `null`/`undefined`; `""` e um valor definido e vence. O `verify-totp` ja
foi corrigido (F-22); o `login` e o helper compartilhado nao.

**Achado do Gate F-24.0**: o acerto do `verify-totp` sao **duas** decisoes, nao uma — o `trim` em
`:48` e o `||` nos tres pontos. Corrigir so o operador nos outros dois arquivos deixa
`message: "   "` (whitespace puro do backend ou de um proxy) apagando o alerta exatamente como hoje.
A Task F-24.3 fecha os dois.

**Execucao (2026-08-06)** — a tabela acima descreve o estado ANTES da Task; as ancoras de linha nao
resolvem mais. O que foi entregue divergiu do planejado em tres pontos, todos registrados no commit:

1. **O `grep` achou 13 pontos, nao 3.** Alem do helper e do `login`, dez pontos em cinco componentes
   de `admin`/`profile` repetiam o corpo do helper em vez de chama-lo. Todos passaram a delegar.
2. **A extracao virou funcao propria** (`mensagemBrutaDaApi`, em `core/api/api-error.ts`), usada por
   `login` e `verify-totp`. Com branco normalizado para `undefined`, os call sites voltam a usar
   `??`, que e o operador correto — a preferencia por "checagem explicita" do Step 124.3.1 fica
   satisfeita sem `||` cru.
3. **A causa registrada estava errada, e o code review derrubou.** A premissa de que o Boot emite
   `"message": ""` quando `include-message` e `never` e **falsa**: medido no bytecode do
   `spring-boot-3.5.5.jar`, `ErrorAttributeOptions.retainIncluded` faz `Map.remove` da chave, entao
   aquele caminho nunca produziu branco e o `??` ja o tratava certo. O produtor estruturalmente
   capaz e o proprio `ErrorResponseDto` (o `DomainException` nao valida a mensagem; o
   `@JsonInclude(NON_NULL)` suprime so `null`). **A correcao segue certa — como guarda defensiva, e
   nao como conserto de bug observado.** A explicacao autoritativa mora no docblock de
   `api-error.ts`; os registros da F-22 que diziam o contrario foram corrigidos na fonte
   ([`CONTEXT-PARTE-2.md`](../../docs-sep/CONTEXT-PARTE-2.md) §F-Sprint 22).

### `NaNmin` no dashboard (F-24.4)

- `api.models.ts:691` — `tempoMedioResolucao30d: number`.
- `api.models.ts:685-686` — comentario afirma *"serializado pelo backend como numero de segundos
  (Jackson `WRITE_DURATIONS_AS_TIMESTAMPS`)"*. **A afirmacao e falsa**: o Spring Boot **desliga**
  `WRITE_DURATIONS_AS_TIMESTAMPS` e o fio leva ISO-8601 (`"PT2H"`). Medido na Sprint 34; o `knownGap`
  do `consumed-contracts.json` registra a medicao e o `openapiType: "string"` esta **correto**.
- **Achado do Gate F-24.0: os comentarios falsos sao tres, nao um.** Alem do acima, tambem
  `backoffice-format.ts:14-16` (*"a duracao como numero de segundos (Duration do backend)"*) e
  `backoffice-format.ts:29` (*"O Duration do backend chega como numero de segundos"*) — os dois no
  arquivo que a Task edita. Corrigir so o de `api.models.ts` deixaria dois vivos a centimetros da
  correcao, que e como este defeito sobreviveu ate aqui.
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

### `estabilizar()` **e `flush()`** (F-24.6) — re-medido no Gate

**38** definicoes de `function estabilizar(fixture: ComponentFixture<unknown>): Promise<void>` em
`*.spec.ts`, espalhadas por `features/authenticated/**` e `features/public/**`. O `STATE.md` registrava
"terceira copia" e a spec registrava "39 byte-identicas"; **os dois estavam errados**.

As **assinaturas** sao identicas. Os **corpos** sao tres, e a identidade textual esconde um split
semantico, porque o corpo "padrao" chama um segundo helper local que tambem esta duplicado:

```ts
// 36x — corpo "padrao"                    // 42x — flush, com DOIS defaults
async function estabilizar(fixture) {      async function flush(times = 5) {   // 31 arquivos
  await fixture.whenStable();              async function flush(times = 6) {   // 11 arquivos
  await flush();                             for (let i = 0; i < times; i += 1) {
  fixture.detectChanges();                     await Promise.resolve();
}                                            }
                                           }
```

| Grupo | Arquivos | Drenagem real |
|---|---|---|
| corpo padrao + `flush(5)` | 25 | 5 microtasks |
| corpo padrao + `flush(6)` | 11 | **6** microtasks |
| `account-locked.component.spec.ts` (laco inline `i < 5`) | 1 | 5 — e `flush(5)` nao fatorado, nao uma decisao |
| `aportes-list.component.spec.ts` (sem drenagem) | 1 | 0 |

`flush` tem **42** definicoes (36 convivem com `estabilizar`; 6 arquivos so tem `flush`). Nao e import:
e local em cada arquivo.

**A drenagem e peso morto.** Quatro medicoes sobre a suite inteira: `6 -> 5` nos 11 (142 verdes),
`times = 1` (765/93), `times = 0` (765/93) e — a decisiva — **`await flush()` removido dos 36**
(765/93). O `times = 0` sozinho nao provaria nada: aguardar a promise de uma `async` ja custa um tick.
**Controle de vacuo**: com a drenagem removida, mutar `chaves-pix-page.component.ts:145`
(`this.chaves.set(chaves)` -> `set([])`) derrubou **20 testes** (exit 1) — os specs seguem detectando
defeito real, entao a drenagem nao era o que os sustentava.

**Logo a unificacao total e segura**, e nao ha motivo para deixar os dois divergentes locais.

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

4. **A F-24.6 vai em commit proprio e isolado.** ~44 arquivos de teste; o risco nao e regressao de
   produto, e mascarar as outras tasks no review.
   **O helper compartilhado MANTEM a drenagem (`flush(5)`).** Efeito exato: 25 arquivos ficam
   identicos, `account-locked` vai de 5 inline para 5 compartilhado, `aportes-list` de 0 para 5, e
   **11 vao de 6 para 5 — uma drenagem A MENOS**. Esses 11 foram medidos verdes com `5` (142 testes)
   **e tambem com `times = 0`**, entao a margem e o laco inteiro, nao um tick.
   *(Correcao do code review da F-24.6, 2026-08-06: a redacao anterior afirmava que nenhum arquivo
   recebia menos settle e listava, em seguida, os 11 que recebem.)*
   Manter custou quatro linhas, e o objetivo da Task era equivalencia e nao otimizacao. **Nao e
   protecao contra carga**: `await Promise.resolve()` so avanca cadeias ja resolvidas dentro de um
   checkpoint de microtasks e nao espera macrotask nenhuma — quem absorve variacao de maquina e o
   `fixture.whenStable()`. Se `5` basta numa maquina ociosa, basta numa saturada.

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
| Helper `estabilizar()` + `flush()` | F-24.6 |
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
  -> F-24.6  estabilizar()+flush()  [POR ULTIMO entre as de codigo: toca ~44 arquivos e
                                     conflitaria com qualquer task anterior nao commitada]
  -> F-24.7  copy + literais        [depois da F-24.6: mexe em specs que ela acabou de tocar]
Fechamento (gates completos + docs + PR description)
```

A posicao da F-24.6 **nao e preferencia**: ela edita ~44 `*.spec.ts`, entre eles os de `login`,
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
npm test                     # MEDIDO 2026-08-06: 765 testes / 93 arquivos (a spec dizia 94)
npm run contract:check       # MEDIDO: 85 operacoes / 1 lacuna / exit 0
npm run lint && npm run format:check
npm run build
npx playwright test          # MEDIDO: 39
```

Baseline do Gate, medida em `feature/fsprint-24-divida-tecnica` (de `develop` `d987714`):

| Gate | Registrado na spec | Medido | |
|---|---|---|---|
| `npm ci` | — | exit 0, 3 `moderate` | bate o residual da D-1 |
| Vitest | 765 / **94** | 765 / **93** | testes OK, arquivos **nao** |
| `contract:check` | 85 ops / 1 lacuna / exit 0 | identico | OK |
| `lint`, `format:check`, `build` | verdes | exit 0 | OK |
| Playwright | 39 | 39 | OK |

**Por que e gate e nao task**: numero nao medido aqui nao pode ser citado no fechamento.

### Step 124.0.3 - Reconferir os 8 pontos que o desenho assume

Conferir no arquivo, e nao neste documento: `app.config.ts:24-28` (ordem da cadeia);
`error.interceptor.ts:21,26,31` (as tres navegacoes, nenhuma isentando a politica);
`auth.interceptor.ts:11-15,30` (docblock do defeito + a lista); `api-error.ts:22` (`??`);
`login.component.ts:52,71` (`??`) contra `verify-totp.component.ts:53,58,70` (`||`);
`api.models.ts:685-691` (comentario falso + tipo); `backoffice-format.ts:31` (a guarda que nao pega
string); `consumed-contracts.json:1594-1602`.

E **recontar** as definicoes dos helpers de teste — contando **corpos**, nao so arquivos, porque
assinatura identica nao implica corpo identico:

```bash
grep -rc "function estabilizar" src --include=*.spec.ts | grep -v ":0" | wc -l   # MEDIDO: 38
grep -rc "function flush" src --include=*.spec.ts | grep -v ":0" | wc -l         # MEDIDO: 42
grep -rh "function flush(times" src --include=*.spec.ts | sort | uniq -c         # MEDIDO: 31x(5), 11x(6)

# corpos distintos de estabilizar — MEDIDO: 3 (36 + 1 + 1)
for f in $(grep -rl "function estabilizar" src --include=*.spec.ts); do
  awk '/function estabilizar/{f=1} f{print} f&&/^}/{exit}' "$f" | md5sum
done | sort | uniq -c
```

### Definicao de pronto do Gate F-24.0 — **CONCLUIDO 2026-08-06**

- [x] Branch criada de `develop` atualizado com a D-1 dentro (`d987714`, PR #128);
      `develop == main` por conteudo (`git diff --stat` vazio); `main` em `7f232b3` (PR #129).
- [x] Baseline anotada (Vitest, `contract:check`, lint, format, build, Playwright) — ver 124.0.2.
- [x] Os 8 pontos conferidos **byte a byte** e as contagens re-medidas; **as divergencias foram
      reportadas e corrigidas na fonte antes de qualquer codigo**. Working tree limpa ao fim do Gate.

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

`api-error.ts:21-22` — `corpo?.message ?? padrao` passa a tratar string vazia **e whitespace puro**
como ausente. Sao as duas metades do acerto do `verify-totp`: o `trim` de `:48` e a queda no padrao.
Preferir checagem explicita de vazio a `||` cru: `||` tambem descartaria `0` e `false`, o que aqui nao
importa (o campo e `string`), mas esconder essa premissa e o que faz a proxima leitura hesitar.

### Step 124.3.2 - `login.component.ts` usa a mesma semantica

`:52` e `:71` usam `??`, e a extracao de `:32` nao faz `trim`. O `verify-totp` (`:48,53,58,70`) ja
acerta nos dois — o alvo e uma semantica unica, nao espalhar `||` por call site.

### Step 124.3.3 - Testes

Um teste por ponto corrigido, com corpo `{ message: '' }` **e outro com `{ message: '   ' }`**,
assertando o **texto padrao** nos dois.

**Mutacao obrigatoria**, uma por metade: (a) reverter para `??` em cada ponto — o teste de `''` deve
falhar; (b) remover o `trim` — o teste de `'   '` deve falhar. Um teste que passa com as duas versoes
esta assertando outra coisa. A mutacao (b) e o que impede a Task de fechar so metade do defeito, que
foi como ele chegou ate aqui.

### Verificacao da Task F-24.3

```bash
npm test; echo "EXIT=$?"
```

### Definicao de pronto da Task F-24.3

- [ ] Nenhum ponto do repo devolve `""` **nem `"   "`** como mensagem de erro (`grep` por `message ??`
      e por `?.message` sem `trim` prova).
- [ ] Um teste por ponto e por metade (vazio e whitespace), cada um falhando sob sua mutacao.

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

**Sao tres comentarios, nao um** (achado do Gate F-24.0): tambem `backoffice-format.ts:14-16` e
`backoffice-format.ts:29` repetem "numero de segundos", no proprio arquivo que o Step 124.4.2 edita.
Os tres caem na mesma Task.

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
- [ ] **Os tres** comentarios falsos (`api.models.ts:685-686`, `backoffice-format.ts:14-16` e `:29`)
      foram substituidos pelo resultado medido. **Eram cinco, nao tres** — o code review achou o
      quarto em [`README.md`](../../repos/sep-app/README.md) do `sep-app` e o quinto no registro da
      F-10 em [`CONTEXT-PARTE-2.md`](../../docs-sep/CONTEXT-PARTE-2.md); os dois estavam fora do
      `grep` original, que so varria `sep-app/src`. Criterio de pronto: nenhum comentario de codigo
      **afirma** "numero de segundos"; as ocorrencias que sobram descrevem o defeito no passado.
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

- [x] `400` **nao** declarado e **nao** registrado como `knownGap`: as duas saidas previstas aqui sao
      impossiveis, medido. Declarar o `400` produz falha dura (`verificarStatusDeErro` empurra
      `falhas`, sem consultar `knownGaps`), e o fallback de gap tampouco funciona — nao ha `kind` para
      status, e desde a F-22 o `varrerGapsObsoletos` reprova **qualquer** gap que nenhuma operacao
      consuma, entao a entrada quebraria o check mesmo com um `kind` novo. Virou follow-up (abaixo).
- [x] `contract:check` segue com **0 lacunas**, exit 0.
- [x] Inventario com numero — abaixo, ja com o rotulo corrigido pelo code review.

### Inventario de ramificacao por status (medido em 2026-08-06)

O numero citado no commit da F-24.5 ("65 pontos") esta aritmeticamente certo e **mal rotulado**: conta
so `if (<x>.status === NNN)` em `src/app/features/**`, fora de specs. Nao alcanca outras duas formas de
discriminar por status que existem no codigo:

| Forma | Onde | Pontos |
|---|---|---|
| `if (<x>.status === NNN)` | 30 arquivos em `features/**` | **65** |
| `switch (erro.status)` | `login.component.ts:37`, `verify-totp.component.ts:62` | **10** (5 + 5 `case`) |
| `Record<number, string>` indexado por status | `credora-cadastro-page.component.ts:14-18` | **3** |
| | **Total** | **78** |

Operacoes que declaram `erros`: **9 antes da Task -> 13 depois** (de 85). Ressalva de leitura: os 78
sao pontos de discriminacao, **nao** o backlog — parte deles esta em operacoes que ja declaram. Medir
o backlog real exige antes decidir a regra para **handlers compartilhados entre operacoes**
(um `tratarErro` serve `assumir`/`comentar`/`resolver`/`ignorar`/`reprocesso`), e distinguir
*ramo real com OpenAPI incompleto* de *ramo inalcancavel* — o `429` daquele handler, por exemplo, so
existe nos dois reprocessos (`RateLimitFilter` limita apenas login e TOTP), entao nas quatro operacoes
de fila ele e codigo morto, que e divida de frontend e nao lacuna de contrato.

### Follow-ups abertos pela F-24.5

1. **Frontend, mais barato e sob nosso controle** — `reprocessos-page.component.ts:45` valida
   `webhookEventId` so com `Validators.required`, e `:50-51` tem o mesmo buraco no `entidadeId`. Um
   `Validators.pattern` de UUID elimina o `400` na origem: hoje o usuario digita `abc`, faz o
   round-trip **com step-up** e recebe `"Path/query param 'webhookEventId' invalido: nao eh UUID"`.
   **Se este for feito primeiro, o item 2 deixa de ser pre-requisito de qualquer declaracao.**
2. **Backend** — `BackofficeReprocessoController.java:56-61` deve publicar `400` no endpoint de
   webhook, como o irmao de provider (`:78-84`) ja publica. O `400` e alcancavel por
   `@PathVariable UUID` malformado (`MethodArgumentTypeMismatchException` -> `ApiExceptionHandler:69-75`),
   e a conversao acontece **antes** do `@RequireStepUp` e do `@PreAuthorize`. Candidato a Sprint 35.
3. **`contract-check.mjs`** — tres pontos cegos ja medidos: nao tem `kind` de gap para status;
   e unidirecional (valida o que o front declara contra o OpenAPI, nunca o contrario); e cego a campo
   **removido** do descriptor. Soma-se: valida `declarado ⊆ documentado`, nunca
   `declarado = ramificado` — declarar `403` em `backoffice.assumir`, cuja guarda `exigeStepUp` exclui
   a acao, passa verde. Sprint propria.

### Commit sugerido

```text
chore(contracts): declarar o 400 de backoffice.reprocessarWebhook
```

---

## Task F-24.6 - Helper unico para `estabilizar()` e `flush()`

**Objetivo**: uma definicao de cada, em vez de 38 + 42.
**Pre-requisito**: Task F-24.5 concluida e aprovada.
**Esforco**: 0,4 dia (era 0,3; o Gate achou o `flush`).
**Arquivos esperados**: helper novo em `src/testing/` (ou o diretorio que o repo ja usar — conferir
antes) + ~44 `*.spec.ts`.

### Step 124.6.1 - Criar o helper

Assinatura identica a das copias:
`estabilizar(fixture: ComponentFixture<unknown>): Promise<void>`, com o corpo padrao **e a drenagem
preservada** (`flush(5)`). Exportar `flush` tambem, para os 6 arquivos que so tem ele.

O default unico e **`5`**, nao `6`: os 11 arquivos com `times = 6` foram medidos verdes com `5`
(142 testes) no Gate. Registrar no helper **por que** a drenagem fica, senao a proxima leitura
"otimiza" e reabre o risco (ver Decisao 4).

### Step 124.6.2 - Substituir

Remover a definicao local e importar, em cada arquivo. Preferir `Edit` a `sed`: o
[`AGENT.md`](../../AGENT.md) §Como trabalhar registra que `sed` com `/` ou escape ja esvaziou arquivo
neste repo.

Dois arquivos **nao** sao substituicao cega — o Gate mediu os dois e ambos convergem para o helper:

- `account-locked.component.spec.ts`: o laco inline de 5 iteracoes **e** `flush(5)`; trocar pelo
  helper e semanticamente identico;
- `aportes-list.component.spec.ts`: hoje nao drena; passa a drenar 5, ou seja, ganha tempo de settle.
  Nenhum arquivo perde.

### Step 124.6.3 - Provar equivalencia

A contagem de testes **nao pode mudar** — a Task nao acrescenta nem remove teste. Numero diferente do
da baseline significa que algo quebrou em silencio.

### Verificacao da Task F-24.6

```bash
npm test; echo "EXIT=$?"        # contagem IDENTICA a da Task anterior
npm run lint; echo "EXIT=$?"
npm run format:check; echo "EXIT=$?"
grep -rc "function estabilizar" src --include=*.spec.ts | grep -v ":0"   # esperado: nenhuma saida
grep -rc "function flush" src --include=*.spec.ts | grep -v ":0"         # esperado: nenhuma saida
```

### Definicao de pronto da Task F-24.6

- [ ] Zero definicoes locais restantes, **dos dois helpers**.
- [ ] Contagem de testes **identica** a da Task F-24.5.
- [ ] O helper registra por que a drenagem fica, e por que o default e `5`.
- [ ] Commit **isolado**, sem nenhuma outra mudanca junto (Decisao 4).

### Commit sugerido

```text
refactor(test): extrair estabilizar() e flush() para helper unico
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

- [x] Mutacao dupla do 124.7.1 demonstrada: reformatar (quebra de linha dentro do `<span>` do badge)
      **passa** — antes derrubava 3 testes —, e trocar uma palavra da copy **derruba 4**.
- [x] Uma origem por frase (`grep` prova: 0 arquivos fora de `copy-de-erro.ts`).
- [x] Follow-up do `30 minutos` fixo registrado (abaixo e no docblock da constante).

### Medicao que refinou o 124.7.1

A premissa "reformatacao quebra o teste" e verdadeira, mas **nao pelo motivo registrado**. Medido
antes de mexer:

- **reindentar, ou juntar badge e heading na mesma linha: PASSAVA.** O `preserveWhitespaces: false`
  descarta whitespace ENTRE elementos, entao a colagem sobrevive a esse tipo de reformatacao.
- **quebrar linha DENTRO do `<span>` do badge: derrubava 3 testes**, sem uma letra de copy mudar. E
  o whitespace vira parte do proprio text node, e a normalizacao do teste o colapsa para um espaco,
  quebrando a expectativa `'423Conta bloqueada temporariamente'`.

A correcao foi comparar **elemento a elemento** (`textosDoCard`), e nao o `textContent` concatenado
do card: assim a fronteira entre nos deixa de existir na expectativa, e a deteccao de mudanca de
texto fica intacta — que e o que a Decisao 5 exige.

### Follow-up aberto pela F-24.7

- **`CONTA_BLOQUEADA_FALLBACK` embute "30 minutos" fixo**, enquanto
  `app.security.lockout.lockout-minutes` e sobrescrivel por ambiente — mesmo defeito que a F-23
  corrigiu na `/account-locked`, onde a pagina passou a derivar os numeros de
  `GET /auth/politica-lockout`. O risco e menor que la, porque o literal so aparece quando corpo **e**
  `Retry-After` faltam. Agora que as duas telas consomem uma constante so, consertar ficou barato.

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
