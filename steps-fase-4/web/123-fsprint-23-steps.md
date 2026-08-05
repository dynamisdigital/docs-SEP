# Steps - F-Sprint 23 - Politica de lockout e Retry-After no web

**Spec de origem**: [`123-fsprint-23-politica-lockout-web.md`](../../specs/fase-4/123-fsprint-23-politica-lockout-web.md)

**Status**: **MERGEADA develop+main** em 2026-08-05 (PR #125 develop, squash `9fb9788`; PR #126
main, `b2809b3`; back-merge `c72b393` vazio). Todas as Tasks executadas, mais um hotfix pos-review.

**Sprint irma**: nenhuma. Esta sprint **consome** a [`034`](../backend/034-sprint-34-steps.md)
(Sprint backend 34), ja mergeada em `develop`+`main` em 2026-08-03. **Nao ha gate externo**: os dois
bloqueios que fecharam a F-22 sem a Task 6 cairam.

**Origem**: Task F-22.6 dos steps [`122`](./122-fsprint-22-steps.md). Aquele texto **nao deve ser
editado** — vale como registro do que foi planejado. Onde ele envelheceu, este arquivo corrige; ver
§Divergencias da spec 123.

**Objetivo geral**: a jornada de conta bloqueada para de anunciar numeros fixos no codigo e passa a
dizer os valores efetivos do ambiente, sem nunca depender da chamada para funcionar.

**Esforco total estimado**: 1,5 dia de Dev Pleno Frontend.

**Repos de destino**:

- `sep-app`: `core/api/api.models.ts`, `core/api/retry-after.ts` (novo),
  `core/auth/politica-lockout.service.ts` (novo), `core/interceptors/auth.interceptor.ts`,
  `features/public/account-locked/`, `features/public/login/login.component.ts`, `src/mocks/handlers.ts`,
  `contracts/consumed-contracts.json`, `e2e/account-locked.spec.ts`.
- `docs-SEP`: este step, a spec 123, indices e PR description; **Git manual**.

**Branch sugerida**: `feature/fsprint-23-politica-lockout`, criada de `develop` atualizado.

**Pre-requisitos**: Sprint 34 em `develop`+`main` (feito) e snapshot OpenAPI regenerado (feito,
`ff7bc7d` via PR #120/#121).

**Skills obrigatorias durante a implementacao**: `coding-guidelines`, `clean-code`,
`sep-web-mutation-verified-testing`.

---

## Estado atual verificado (2026-08-05)

Levantado antes de planejar; qualquer divergencia encontrada no Gate F-23.0 invalida o desenho abaixo.

### Contrato

- `contracts/openapi.snapshot.json` **ja contem tudo**: path `/api/v1/auth/politica-lockout` (`:3374`,
  `operationId: "politicaLockout"`), schema `PoliticaLockoutResponseDto` (`:1814-1836`, tres
  `integer/int32`, **sem `required`**) e os quatro `Retry-After` — login `423` (`:3228`) e `429`
  (`:3247`), totp/verify `423` (`:3733`) e `429` (`:3752`).
- `contracts/consumed-contracts.json`: **1 unico `knownGap`** (`:3-13`, o `Duration` de
  `tempoMedioResolucao30d`). `npm run contract:check` reporta **84 operacoes / 1 lacuna**, exit 0.
- `auth.login` (`:968-975`) ja declara `"erros": [400, 401, 423, 429]`; **nao tem `responseHeaders`**.
- `responseHeaders` e usado por **uma unica operacao**: `contratos.documentoAssinado` (`:1210`).
  `verificarHeadersDaResposta` (`contract-check.mjs:120-155`) exige mapa por status, rejeita lista
  plana (`:126-129`) e exige que o status exista no OpenAPI (`:137-140`).
- `verificarStatusDeErro` (`:163-174`) falha se um status declarado em `erros` nao existir no OpenAPI —
  por isso `auth.politicaLockout` **nao pode** declarar `[401]`: o snapshot so documenta `200` nesse path.
- **Nao ha nenhuma ocorrencia de `politica-lockout` em `sep-app/src/`** nem no descriptor.

### Telas e borda

- `account-locked.component.ts` (119 linhas, template e styles **inline**, sem `.html`/`.scss`).
  Nao injeta nada alem de `viewChild.required` do heading; `ngAfterViewInit` faz `focus()` (F-21).
  O literal alvo esta em `:43`: `"por ate 30 minutos, contados a partir da ultima tentativa"`. Nem
  `maxAttempts` nem `windowMinutes` aparecem na tela. Docblock de 25 linhas justifica cada afirmacao
  da copy contra o `sep-api` e ja registra `"(follow-up: expor o valor no contrato)"`.
- `account-locked.component.spec.ts:16-25` trava a copy **integral** com `toBe()` sobre
  `textContent` normalizado de `.sep-account-locked-card`. Comentario `:14`: *"Qualquer mudanca de
  copy DEVE quebrar aqui e ser reconferida contra o sep-api"* — **quebrar isso e o desenho**.
  `renderPagina()` (`:27-30`) provê **so `provideRouter([])`**; sem `provideHttpClient` os 5 testes
  caem em `NullInjectorError` assim que o componente injetar HTTP.
- `auth.interceptor.ts:9` — a isencao e uma booleana unica: `req.url.includes('/auth/login')`.
  **Nao ha lista de rotas publicas.** Spec com 3 testes, padrao `captureNext` + `TestBed.runInInjectionContext`.
- `error.interceptor.ts:21` — `error.status === 401 && !req.url.includes('/auth/login')` →
  `clearSession()` + `navigateByUrl('/login')`. `:31-34` — o `423` navega para `/account-locked` **sem
  isentar `/auth/login`** e propaga o erro. `:36-37` — o `429` **nao e tratado**, entao o
  `HttpErrorResponse` chega intacto ao `error:` do componente. `support-reference.ts:28` preserva
  `error.headers` ao reconstruir o erro.
- `login.component.ts:23-59` — `mensagemDeErroDeLogin(erro: unknown): string` e **funcao pura de
  modulo** e ja recebe o `HttpErrorResponse`; da para ler o header ali dentro sem tocar a classe.
  `:44` `423` → `mensagemDaApi ?? 'Conta bloqueada temporariamente. Tente novamente em 30 minutos.'`;
  `:48` `429` → `'Muitas tentativas seguidas. Aguarde cerca de 1 minuto e tente de novo.'`.
- `core/auth/`: `auth.service.ts` (140), `mfa.service.ts` (55), `step-up-token.store.ts` (28).
  Padrao de GET simples: `mfa.service.ts:26-32`. Padrao de falha-em-silencio: `auth.service.ts:76-79`
  (`catchError(() => { ...; return of(null); })`).
- **Leitura de header de resposta tem um unico precedente**: `contratos.service.ts:50-57`
  (`observe: 'response'`) + `contrato-detail.component.ts:140-141` (`resposta.headers.get(...)`),
  declarado em `consumed-contracts.json:1210`. **Nenhum lugar le header de resposta de erro**;
  `HttpErrorResponse.headers` nunca e acessado no repo.
- `toSignal` tem **2 usos** (`users-list.component.ts:32`, `breadcrumbs.component.ts:22`), ambos sobre
  observables que **nunca completam** (`valueChanges`, router events). Este seria o **primeiro sobre
  HTTP** — observable que completa. Consequencia pratica: `initialValue` deixa de ser conveniencia e
  vira o que garante que a tela nasce completa.

### Mock e testes

- `handlers.ts:145-172` — estado de lockout: `LOCKOUT_MAX_TENTATIVAS = 5` (`:152`),
  `LOCKOUT_MINUTOS = 30` (`:153`), `falhasDeLoginPorUsuario: Map`, `resetLoginMockState()`.
  **Nao existe constante de janela (15 min).**
- `handlers.ts:174-185` — `errorResponse(status, error, message, path)`; **nao aceita headers**.
- `handlers.ts:3299-3334` — handler do login; devolve `423` sem `Retry-After`. **Nao ha handler de
  `/auth/politica-lockout`, nao ha `Retry-After` em lugar nenhum do mock, nao ha `429` no login.**
- `test-setup.ts:21-23` — `server.listen({ onUnhandledRequest: 'error' })`. **Uma request sem handler
  derruba a spec.** Isso torna a ordem das Tasks um requisito, nao uma preferencia.
- `login.component.spec.ts:65-70` — `erroDaApi(status, error, message)`, 3 parametros.
  `:304` substitui `auth.login` por `() => throwError(...)`, mas lancando **`DOMException`**, nao
  `HttpErrorResponse` — o padrao de substituicao serve, o objeto lancado precisa ser adaptado.
- `e2e/account-locked.spec.ts` — 2 testes, MSW por `addInitScript` (`:7-10`). `:59` afirma
  `/30 minutos/i`; `:56-58` comenta *"Trocar o valor no backend nao quebra estas duas linhas — a copy
  da pagina e estatica por construcao"*, frase que **deixa de ser verdade** nesta sprint.

### Baseline medida no Gate F-23.0 (2026-08-05)

Vitest **745 / 91 arquivos**, `contract:check` **84 operacoes / 1 lacuna** (exit 0), `build` verde,
Playwright **2 passed** em `e2e/account-locked.spec.ts`.

---

## Contratos backend consumidos

```http
GET  /api/v1/auth/politica-lockout   200 -> { maxAttempts, windowMinutes, lockoutMinutes }  (publico, GET-only)
POST /api/v1/auth/login              423 -> Retry-After: <segundos restantes reais, ceil, 1..lockoutMinutes*60>
POST /api/v1/auth/login              429 -> Retry-After: 60 (constante, limite superior)
```

**Unidades**: os dois ultimos campos do corpo estao em **minutos**; o `Retry-After` esta em
**segundos**. Fator 60, e nenhum nome de campo avisa.

**A `message` do `423` mente por design** (`ContaBloqueadaException.java:27-30`): ela enuncia a
duracao configurada, nao o restante. Onde o header existir, ele ganha do corpo.

Detalhe completo e citacoes na spec 123 §Contratos backend consumidos.

---

## Decisoes da sprint

1. **Service proprio (`politica-lockout.service.ts`), nao metodo em `AuthService`.**
   `AuthService` e o detentor de sessao (token, `currentUser`, challenge MFA, `localStorage` lido no
   field initializer). Este endpoint existe justamente para a tela que **nao tem** sessao — acoplar os
   dois faria a pagina do `423` depender do objeto que o `423` acabou de invalidar.
   *Rejeitado*: metodo em `AuthService`, por acoplamento; e service generico de "config publica", que
   nao tem segundo consumidor.

2. **`catchError` no service, nao no componente.** Poe o contrato "esta chamada nunca erra" no **tipo**
   (`Observable<PoliticaLockoutResponse | null>`) em vez de num comentario, e evita que o proximo
   consumidor precise lembrar. E **load-bearing**: `toSignal` relanca o erro na leitura do signal,
   entao mover o `catchError` "para o service ficar puro" quebra o render da pagina inteira.

3. **`toSignal` + `computed`, nao `resource()` nem resolver de rota.** `resource()`/`httpResource()` e
   experimental no Angular 20, sem uso no repo, e traria `status`/`error`/`reload` que ninguem
   consome — abstracao especulativa pelo criterio da propria F-21. Resolver de rota transformaria uma
   pagina que pinta na hora numa que espera a rede, o oposto do requisito.

4. **Validar o corpo na borda.** O springdoc nao emite `required`
   (`contracts/README.md:51-53`), entao o contrato **nao garante** os tres campos. Sem validacao, um
   corpo `{}` renderiza `"por ate undefined minutos"` na cara do usuario.

5. **Array de rotas publicas no `authInterceptor`, nao `HttpContextToken`.** O token
   `TRATA_403_LOCALMENTE` existe porque o interceptor **nao pode inferir** se a tela trata `403`
   localmente — e decisao do call site. Ser publico e propriedade do **endpoint**, que o interceptor le
   da URL. Um token faria cada chamador ter de lembrar, e esquecer voltaria ao bug em silencio.
   Com dois itens, o `||` obrigaria a manter duas booleanas ou uma expressao sem nome
   (`isLoginRequest` viraria mentira); o array nomeia o conceito e torna o terceiro caso uma mudanca
   de dado.

6. **A copy revela `maxAttempts` e `windowMinutes`.** Os tres numeros ja sao publicos e `SEGURANCA.md`
   §5 registra a exposicao como aceita; a janela e o que hoje falta para o usuario entender por que
   esta bloqueado. O texto **substitui** "varias tentativas" em vez de acrescentar frase.
   *Contra-argumento considerado*: mais texto numa tela lida durante um incidente — mitigado pela
   substituicao. *Sigilo*: um atacante mede o limiar com ~6 tentativas na conta dele, e o lockout e
   por conta, entao spraying nem o dispara.

7. **O fallback nao cita numero nenhum.**
   ~~Mantem o `30` literal, porque so e alcancavel com o endpoint fora do ar.~~ **Premissa falsa,
   corrigida no code review da sprint**: o fallback e o estado inicial de **toda** renderizacao, e o
   proprio teste "nasce completa com a copy de fallback, antes de qualquer resposta" prova isso. Sob
   `APP_LOCKOUT_LOCKOUT_MINUTES=60` e rede lenta, quem usa leitor de tela le "30 minutos" logo apos o
   `focus()` e **nunca ouve a correcao** — a troca e um text node sem live region. Entre vago e
   verdadeiro ou preciso e falso, numa tela de desfecho de evento de seguranca, vago vence:
   *"bloqueada por um periodo limitado"*.
   Nao confundir com o que a F-21 rejeitou: la o defeito era o **teste** (asserts de ausencia que
   deixavam passar copy inventada), nao a vaguidao. A trava por texto integral continua.

8. **Preposicoes diferentes entre telas, de proposito.** `/account-locked` diz `"bloqueada por ate X
   minutos"` (duracao nominal); o login diz `"Tente novamente em Y minutos"` (restante real). Numeros
   diferentes na mesma incidencia estao corretos.

9. **`"cerca de"` fica so no `429`.** La o header e limite superior constante
   (`RateLimitFilter.java:68`); no `423` e o restante real, e hedge seria ruido.

---

## Fora de escopo

Lista completa e justificada na spec 123 §Fora de escopo. Resumo: `Retry-After` no `verify-totp`
(e a consequente ausencia de `responseHeaders` em `mfa.totpVerify`), `knownGap` do `Duration`, store
para propagar o header, `aria-live`, segunda isencao de `401` no `errorInterceptor`, e o smoke real
contra `:8080`.

---

## Protocolo obrigatorio por Task

1. Executar **somente** a Task liberada; nao adiantar a seguinte.
2. Toda afirmacao sobre o codigo atual conferida no arquivo, com `arquivo:linha` — nao pela memoria
   nem por este documento.
3. Teste novo **verificado por mutacao**: aplicar a mutacao nomeada, ver o teste falhar, reverter.
   Teste que sobrevive e considerado **nao entregue**.
4. Rodar a verificacao da Task antes de pedir checkpoint. Capturar `EXIT=$?` explicito; **nunca**
   validar por `| tail`, que mascara o codigo de saida.
5. Checkpoint antes de cada commit: `git status --short --branch`, `git diff --stat`, arquivos
   criados/modificados/removidos, gates rodados e resultado, riscos/pendencias, mensagem sugerida.
6. **Aguardar aprovacao explicita** antes de `git add`/`git commit`. `git add <paths>`, nunca `-A`.
7. Push e PR **manuais** (dev humano). Em `docs-SEP` o git e 100% manual: o agente so edita a
   working tree.
8. `chown -R mauricio:mauricio .git .claude` apos operacoes git nos repos de codigo.

---

## Rastreabilidade spec 123 -> steps

| Item da spec | Steps |
|---|---|
| Declarar o consumo no descriptor | F-23.1 |
| `PoliticaLockoutResponse` + service + handler MSW | F-23.2 |
| Isencao no `authInterceptor` | F-23.3 |
| `/account-locked` deriva a copy | F-23.4 |
| Helper de `Retry-After` | F-23.5 |
| `Retry-After` no login | F-23.6 |
| e2e do cenario de URL direta | F-23.7 |
| Riscos nao verificaveis / gate do smoke | Fechamento |

---

## Ordem de execucao

```text
Gate F-23.0 (precheck + baseline)
  -> F-23.1  descriptor            [independente]
  -> F-23.2  borda + mock          [OBRIGATORIO antes da F-23.4: onUnhandledRequest:'error']
  -> F-23.3  authInterceptor       [OBRIGATORIO antes da F-23.4: senao o teste da pagina
                                    dependeria de uma isencao quebrada]
  -> F-23.4  /account-locked
  -> F-23.5  retry-after.ts        [independente das anteriores]
  -> F-23.6  login                 [depende da F-23.5]
  -> F-23.7  e2e                   [depende da F-23.3 e F-23.4]
Fechamento (gates completos + docs + PR description)
```

A ordem F-23.2 → F-23.4 **nao e preferencia**: `test-setup.ts:21` usa
`onUnhandledRequest: 'error'`, entao sem o handler os 5 testes da pagina morrem com erro de request
nao tratada, mascarando os erros reais de injecao.

---

## Gate F-23.0 - Precheck e baseline

**Objetivo**: confirmar que o desenho acima ainda descreve o repo, e medir os numeros que o
fechamento vai citar.

### Step 123.0.1 - Branch a partir de `develop` atualizado

```bash
cd /home/mauricio/workspaces/workspace-sep/sep-app
git fetch origin
git checkout develop && git pull --ff-only
git diff --stat origin/main origin/develop   # esperado: vazio (develop == main por conteudo)
git checkout -b feature/fsprint-23-politica-lockout
```

Se o diff **nao** vier vazio, parar e reportar: a invariante `develop == main` e conferida pelo gate
da proxima sprint.

### Step 123.0.2 - Baseline medida

```bash
npm ci
npm test                     # anotar total e nº de arquivos
npm run contract:check       # esperado: 84 operacoes / 1 lacuna / exit 0
npm run build
npx playwright test e2e/account-locked.spec.ts   # esperado: 2 passed
```

**Por que e gate e nao task**: numero nao medido aqui nao pode ser citado no fechamento. A F-22
registrou baselines erradas herdadas de sprints anteriores mais de uma vez.

### Step 123.0.3 - Reconferir os 6 pontos que o desenho assume

Conferir no arquivo, e nao neste documento: `auth.interceptor.ts:9` (booleana unica),
`error.interceptor.ts:21` (isencao de `401` so em `/auth/login`), `handlers.ts:152-153` (constantes) e
`:174-185` (`errorResponse` sem headers), `account-locked.component.spec.ts:16-25` (copy travada),
`consumed-contracts.json:968-975` (`auth.login` sem `responseHeaders`), e a presenca do path no
`openapi.snapshot.json`.

### Definicao de pronto do Gate F-23.0

- [ ] Branch criada de `develop` atualizado; `develop == main` por conteudo.
- [ ] Baseline anotada (Vitest, `contract:check`, build, Playwright).
- [ ] Os 6 pontos conferidos, ou a divergencia reportada antes de qualquer codigo.

---

## Task F-23.1 - Declarar o consumo no descriptor

**Objetivo**: o `contract:check` passa a saber que o app consome o endpoint e os headers de erro.
**Pre-requisito**: Gate F-23.0 aprovado.
**Esforco**: 0,1 dia.
**Arquivos esperados**: `contracts/consumed-contracts.json`.

### Step 123.1.1 - Tipo e operacao

No bloco de tipos auth, `PoliticaLockoutResponse` com os tres campos `number` (`number` casa com
`integer` via `TIPOS_COMPATIVEIS`, `contract-check.mjs:20-24`).

Operacao, apos `auth.logoutAll`:

```json
{
  "id": "auth.politicaLockout",
  "method": "get",
  "path": "/api/v1/auth/politica-lockout",
  "sucesso": [200],
  "response": { "$type": "PoliticaLockoutResponse" }
}
```

**Sem `erros`**: a tela nao ramifica por status (qualquer falha cai no fallback), e a regra do
descriptor e declarar erro so onde ha ramo (spec 122 §Decisao tecnica principal). Alem disso
declarar `[401]` **quebraria o check** — `verificarStatusDeErro` (`:163-174`) exige que o status
exista no OpenAPI, e o snapshot so documenta `200` nesse path.

### Step 123.1.2 - `responseHeaders` em `auth.login`

```json
"responseHeaders": { "423": ["Retry-After"], "429": ["Retry-After"] }
```

**So em `auth.login`.** Nao declarar em `mfa.totpVerify`: o descriptor e de contratos **consumidos** e
o `verify-totp` esta fora de escopo — declarar um header que nenhuma tela le e declaracao falsa. Ver
spec 123 §Divergencias, item 2.

**Nao tocar** `openapi.snapshot.json`, `.meta.json` nem `knownGaps` — entregues em `ff7bc7d`.
Re-rodar a regeneracao sairia de um runtime diferente e produziria diff espurio.

### Verificacao da Task F-23.1

```bash
npm run contract:check; echo "EXIT=$?"
```
Esperado: **85 operacoes verificadas / 1 lacuna / exit 0**.

### Definicao de pronto da Task F-23.1

- [ ] `contract:check` sai de 84 para 85 operacoes, mantendo 1 lacuna e exit 0.
- [ ] `openapi.snapshot.json`, `.meta.json` e `knownGaps` intocados (`git diff --stat` prova).

### Commit sugerido

```text
chore(contracts): declarar auth.politicaLockout e os Retry-After do login
```

---

## Task F-23.2 - Borda da politica: modelo, service e mock

**Objetivo**: existe um caminho tipado e testado para ler a politica, que **nunca** propaga erro.
**Pre-requisito**: Task F-23.1 concluida e aprovada.
**Esforco**: 0,4 dia.
**Arquivos esperados**: `core/api/api.models.ts`, `core/auth/politica-lockout.service.ts` (novo) +
spec nova, `src/mocks/handlers.ts`.

### Step 123.2.1 - Tipo na borda

`PoliticaLockoutResponse` no bloco auth de `api.models.ts`, com comentario **fixando a unidade**:
`windowMinutes` e `lockoutMinutes` estao em minutos, nao segundos, nao millis. O comentario nao e
decorativo — o `Retry-After` da mesma feature esta em segundos.

### Step 123.2.2 - Service

`core/auth/politica-lockout.service.ts`, no padrao de `mfa.service.ts:26-32`
(`@Injectable({providedIn:'root'})`, `inject(HttpClient)`, `environment.apiBaseUrl`).

`consultar(): Observable<PoliticaLockoutResponse | null>`, com:
- `map(...)` que devolve `null` quando o corpo nao traz os tres campos como inteiros positivos —
  o schema nao tem `required` (Decisao 4);
- `catchError(() => of(null))` no padrao de `auth.service.ts:76-79` (Decisao 2).

Docblock obrigatorio: por que falha em silencio, por que o `catchError` mora aqui e **nao** pode ser
movido para o componente, e a limitacao do springdoc que motiva a validacao.

### Step 123.2.3 - Handler MSW e `Retry-After` no mock

- Constante `LOCKOUT_JANELA_MINUTOS = 15` junto de `handlers.ts:152-153`. Sem ela o mock se
  contradiz: o handler da politica anunciaria uma janela que o handler de login nao aplica.
  Comentar que, como as outras duas, ela **nao e simulada** — o mock nao tem relogio.
- Handler `GET /auth/politica-lockout` devolvendo as tres constantes.
- **Tripwire**: se a request trouxer `Authorization`, o handler responde `401`. Enquanto a isencao da
  F-23.3 existir esse ramo e **inalcancavel**; ele existe para que remove-la apareca como falha em vez
  de degradar em silencio. Espelha o `JwtAuthenticationFilter`, que rejeita bearer invalido mesmo em
  rota `permitAll` — os tokens deste mock nunca sao JWTs reais. Divergencia na direcao segura (falha
  offline, passa em producao), como a do contador de lockout ja documentada em `:154-160`.
- `errorResponse` (`:174-185`) ganha **5º parametro opcional** `headers?: Record<string, string>`;
  `HttpResponse.json` aceita `headers: undefined`, entao **zero call sites mudam**.
- O `423` do login (`:3311-3316`) passa a mandar `Retry-After: String(LOCKOUT_MINUTOS * 60)`.
  Comentar por que e a duracao inteira e nao o restante: o mock nao tem relogio, entao os segundos que
  faltam sao sempre todos eles.

Nao adicionar `429` ao mock: nada o dispararia, e as specs o produzem por `server.use`.

### Step 123.2.4 - Spec do service

`politica-lockout.service.spec.ts`, padrao `auth.service.spec.ts` (`TestBed` + `provideHttpClient()` +
MSW global). Quatro testes, com a mutacao de cada um:

| Teste | Mutacao que deve mata-lo |
|---|---|
| devolve os tres numeros do endpoint | trocar a URL do service por `/auth/politica` → `onUnhandledRequest:'error'` → `catchError` → `null` |
| `server.use` com `500` → devolve `null` | remover o `catchError` |
| corpo `{}` → devolve `null` | remover o `map` de validacao |
| `lockoutMinutes: 0` → devolve `null` | trocar `valor > 0` por `valor >= 0` |

**Armadilha do teste 2**: escrever com `subscribe({ next, error })` e assertar sobre a **variavel
capturada**. Escrever `error: () => resolve()` faria o mutante sobreviver — sem o `catchError` o
observable erra, `next` nunca dispara, e um teste que aceita o ramo de erro passa dos dois jeitos.

### Verificacao da Task F-23.2

```bash
npx vitest run src/app/core/auth/politica-lockout.service.spec.ts; echo "EXIT=$?"
npm test; echo "EXIT=$?"        # o handler novo nao pode derrubar nenhuma spec existente
```

### Definicao de pronto da Task F-23.2

- [ ] `consultar()` devolve `null` em erro, corpo incompleto e valor nao-positivo — 4 testes verdes.
- [ ] As 4 mutacoes aplicadas, cada uma derrubando o teste correspondente, e revertidas.
- [ ] Suite completa verde: o `errorResponse` com 5º parametro nao alterou nenhum call site.

### Commit sugerido

```text
feat(web): ler a politica de lockout do backend na borda
```

---

## Task F-23.3 - Isentar `/auth/politica-lockout` no `authInterceptor`

**Objetivo**: token velho no storage nunca viaja para o endpoint publico.
**Pre-requisito**: Task F-23.2 concluida e aprovada.
**Esforco**: 0,15 dia.
**Arquivos esperados**: `core/interceptors/auth.interceptor.ts` + spec.

### Step 123.3.1 - Array de rotas publicas

Trocar a booleana `isLoginRequest` (`:9`) por
`const ROTAS_SEM_AUTHORIZATION = ['/auth/login', '/auth/politica-lockout']` + `.some(...)`
(Decisao 5).

Comentario obrigatorio explicando a **consequencia real**, que e maior do que os docs registram:
mandar `Authorization` com token velho faz o `JwtAuthenticationFilter` responder `401` **antes** da
autorizacao, e `error.interceptor.ts:21` isenta do redirect de `401` apenas `/auth/login` — logo o
`401` dispara `clearSession()` + `navigateByUrl('/login')` e **arranca o usuario de
`/account-locked`**. Nao e degradacao de copy.

**Nao** endurecer tambem o `errorInterceptor`: com a isencao nenhum `Authorization` sai, e a guarda
extra seria especulativa. O acoplamento fica documentado aqui e coberto pelos testes da F-23.4 e F-23.7.

### Step 123.3.2 - Teste

Quarto teste no padrao existente (`captureNext` + `TestBed.runInInjectionContext`): com token no
`localStorage`, um `GET` em `/api/v1/auth/politica-lockout` sai **sem** `Authorization`.

**Mutacao**: remover `'/auth/politica-lockout'` do array → o teste passa a ver `Bearer abc-token`.
Segunda mutacao, ja coberta pelos testes existentes: trocar o `.some(...)` por `true` → o teste
`:27` ("anexa Authorization quando ha token") falha.

### Verificacao da Task F-23.3

```bash
npx vitest run src/app/core/interceptors/auth.interceptor.spec.ts; echo "EXIT=$?"
```
Esperado: 4 passed.

### Definicao de pronto da Task F-23.3

- [ ] Teste novo verde; mutacao "remover a rota do array" o derruba; revertida.
- [ ] Mutacao `.some(...) → true` derruba o teste `:27` preexistente.
- [ ] `errorInterceptor` intocado.

### Commit sugerido

```text
fix(web): nao enviar Authorization ao endpoint publico de politica de lockout
```

---

## Task F-23.4 - `/account-locked` deriva a copy da politica

**Objetivo**: a tela diz os numeros do ambiente, e continua completa se a chamada falhar.
**Pre-requisito**: Tasks F-23.2 e F-23.3 concluidas e aprovadas.
**Esforco**: 0,4 dia.
**Arquivos esperados**: `account-locked.component.ts` + spec.

### Step 123.4.1 - Componente

`toSignal(politicaLockoutService.consultar(), { initialValue: null })` + `computed()` escolhendo entre
duas frases (Decisao 3).

**No template muda apenas a interpolacao do primeiro `<p>`.** O `<h1 #titulo>` continua estatico e
**fora de qualquer `@if`** — a chegada da politica troca um text node, nenhum no e destruido, e o foco
do `ngAfterViewInit` sobrevive. Registrar essa regra no docblock: nunca poe o heading (nem o card)
dentro de bloco condicional guiado pelo signal.

Copy — **fallback, sem numero** (Decisao 7; o texto anterior citava "ate 30 minutos" e foi corrigido
no code review):

```text
Detectamos varias tentativas de acesso malsucedidas — senha ou codigo de verificacao. Por seguranca,
sua conta fica bloqueada por um periodo limitado, contado a partir da ultima tentativa.
```

Copy — **com politica** (renderizada aqui com os defaults 5/15/30):

```text
Detectamos 5 ou mais tentativas de acesso malsucedidas em 15 minutos — senha ou codigo de
verificacao. Por seguranca, sua conta fica bloqueada por ate 30 minutos, contados a partir da ultima
tentativa.
```

- `"N ou mais"` e literalmente verdade: o backend bloqueia em `falhas >= maxAttempts` e o `423` so
  aparece na requisicao **seguinte**, entao quem chega aqui pode ter mais que `maxAttempts`.
  `"Foram 5 tentativas"` seria mentira nesse caso.
- **Pluralizacao obrigatoria** (`minuto`/`minutos`): a config admite `1`. `"1 ou mais tentativas"`
  funciona em PT-BR sem caso especial.
- `lockoutMinutes` ja e minutos — **nao dividir por 60** aqui. A divisao existe so no helper do
  `Retry-After` (F-23.5).

Atualizar o docblock de 25 linhas: reconferir cada afirmacao contra o `sep-api` e remover o
`"(follow-up: expor o valor no contrato)"`, que esta sendo fechado agora. O que passa a ser contrato e
o **molde da frase**, nao a string unica — os numeros vem do ambiente.

### Step 123.4.2 - Spec

Setup ganha `provideHttpClient()` (sem ele, `NullInjectorError` nos 5 testes) e o par
`estabilizar()`/flush do padrao da casa, hoje inexistente neste arquivo.

Fixture da politica: **3 / 10 / 45** — tres valores distintos entre si e diferentes de 5/15/30. E o
que faz `windowMinutes` e `lockoutMinutes` trocados no template falharem.

Dos 5 testes atuais: heading (`:37`), landmark (`:53`) e link (`:74`) mudam **so o setup**; a copy
(`:45`) vira duas constantes travadas por `toBe()` (`COPY_COM_POLITICA` e `COPY_SEM_POLITICA`); o foco
(`:66`) passa a assertar **depois** de estabilizar, provando que a troca de copy nao o rouba.

Testes novos, com a mutacao de cada um:

| Teste | Mutacao que deve mata-lo |
|---|---|
| copy com politica 3/10/45 | usar sempre o fallback; ou trocar `windowMinutes` por `lockoutMinutes` no template |
| copy de fallback **antes** da resposta (assert antes de estabilizar) | envolver o card em `@if (politica())` |
| chamada `500` → fallback + heading + link + foco intactos | remover o `catchError` do service; ou trocar `initialValue: null` por politica fixa |
| foco sobrevive a chegada da politica | mover o `<h1 #titulo>` para dentro de um `@if` guiado pelo signal |
| politica `1/1/1` → singular em todos | remover o ternario de pluralizacao |
| **token velho no storage nao vai para o endpoint** | remover `'/auth/politica-lockout'` de `ROTAS_SEM_AUTHORIZATION` |

**Armadilha do ultimo teste**: a request sai na **construcao** do componente, entao um espiao de
`navigateByUrl` instalado depois do `render()` chega tarde. Capturar o header **dentro do handler
MSW** (`server.use` com leitura de `request.headers.get('Authorization')`) e assertar dois fatos: o
header ausente (o quê) e a copy derivada presente (e daí). Renderizar com
`provideHttpClient(withInterceptors([authInterceptor]))`.

**Armadilha de assert**: `getByText` com regex casa ancestrais (`<p>`, `<section>`, `<main>`) e explode
com "found multiple elements". Usar `textoNormalizado(container.querySelector('.sep-account-locked-card'))`
com `toBe`, como o arquivo ja faz (`:32-34`, `:48`).

### Verificacao da Task F-23.4

```bash
npx vitest run src/app/features/public/account-locked/account-locked.component.spec.ts; echo "EXIT=$?"
```

### Definicao de pronto da Task F-23.4

- [ ] Copy derivada e copy de fallback, ambas travadas por `toBe()`.
- [ ] A pagina renderiza completa **antes** da resposta e **quando a chamada falha**.
- [ ] Foco no heading preservado depois da troca de copy.
- [ ] Token velho nao vaza para o endpoint publico.
- [ ] As 6 mutacoes aplicadas, cada uma derrubando o teste correspondente, e revertidas.

### Commit sugerido

```text
feat(web): derivar a copy de conta bloqueada da politica do backend
```

---

## Task F-23.5 - Helper de `Retry-After`

**Objetivo**: uma funcao pura converte o header em texto, ou diz `null`.
**Pre-requisito**: Task F-23.4 concluida e aprovada.
**Esforco**: 0,2 dia.
**Arquivos esperados**: `core/api/retry-after.ts` (novo) + spec nova.

### Step 123.5.1 - `esperaDoRetryAfter(erro: HttpErrorResponse): string | null`

Arquivo proprio ao lado de `api-error.ts` e `support-reference.ts`. Sao 6 casos de borda de aritmetica
e parsing; cobri-los por spec de componente custaria 6 renders + 6 stubs MSW.

Regras:
- `Number(erro.headers.get('Retry-After'))`; qualquer coisa fora de "finito e `> 0`" devolve `null` e
  o call site volta ao literal. `Number(null) === 0` e HTTP-date vira `NaN`, entao os dois caem no
  mesmo guard.
- **A forma HTTP-date do RFC 9110 nao e implementada de proposito**: o `sep-api` emite `integer`
  (`ApiExceptionHandler.java:143`, `RateLimitFilter.java:181`), entao um parser de data seria codigo
  sem chamador. Documentar no docblock, para que a ausencia nao seja lida como esquecimento.
- `Math.ceil(segundos / 60)`: arredondar para baixo prometeria a liberacao antes da hora e mandaria o
  usuario tentar de novo e falhar. Sub-minuto colapsa em `"1 minuto"`.
- Devolve **texto**, nao numero, porque a pluralizacao anda junto da conversao.

### Step 123.5.2 - Spec

| Teste | Mutacao |
|---|---|
| `1743` → `"30 minutos"` | `Math.ceil` → `Math.floor` (da `"29 minutos"`) |
| `1` → `"1 minuto"` | `Math.ceil` → `Math.round` (da `"0 minutos"`) |
| `60` → `"1 minuto"` | remover o ternario de plural (da `"1 minutos"`) |
| sem header → `null` | remover o guard (`Number(null)` → `"0 minutos"`) |
| HTTP-date → `null` | remover `Number.isFinite` (`"NaN minutos"`) |
| `"-30"` → `null` | `<= 0` → `=== 0` |

### Verificacao da Task F-23.5

```bash
npx vitest run src/app/core/api/retry-after.spec.ts; echo "EXIT=$?"
```
Esperado: 6 passed.

### Definicao de pronto da Task F-23.5

- [ ] 6 testes verdes; 6 mutacoes aplicadas, cada uma derrubando o seu, e revertidas.
- [ ] Docblock registra por que HTTP-date nao e suportado e por que arredonda para cima.

### Commit sugerido

```text
feat(web): converter o header Retry-After em espera legivel
```

---

## Task F-23.6 - `Retry-After` no login

**Objetivo**: `423` e `429` do login dizem o tempo real quando o backend informa.
**Pre-requisito**: Task F-23.5 concluida e aprovada.
**Esforco**: 0,2 dia.
**Arquivos esperados**: `login.component.ts` + spec.

### Step 123.6.1 - Consumo

Em `mensagemDeErroDeLogin` (`:23-59`), que ja recebe o `HttpErrorResponse`:

- `case 423`: com header, `"Conta bloqueada temporariamente. Tente novamente em ${espera}."`;
  **o header ganha do corpo**, porque a `message` do backend enuncia a duracao nominal e superestima o
  restante por design. Sem header, o `mensagemDaApi ?? literal` atual, intacto.
- `case 429`: `"Muitas tentativas seguidas. Aguarde cerca de ${espera ?? '1 minuto'} e tente de novo."`
  O `"cerca de"` fica so aqui (Decisao 9).

Comentar a assimetria nos dois `case` — e o ponto que um leitor futuro mais provavelmente inverteria.

### Step 123.6.2 - Testes

`erroDaApi` (`:65-70`) ganha 4º parametro opcional `headers`.

| Teste | Mutacao |
|---|---|
| `429` com `Retry-After: 120` → `"Aguarde cerca de 2 minutos"` | remover `esperaDoRetryAfter` do `case 429` (volta a "1 minuto") |
| `423` sem interceptor, `message` "em 30 minutos" **+ `Retry-After: 300`** → exibe "em 5 minutos" e **nao** `/30 minutos/` | inverter a precedencia (`mensagemDaApi ?? espera`) |

Valores **120** e **300** de proposito: com 60 ou 30 a resposta certa seria alcancavel sem ler o
header, e o teste passaria por acidente. Os testes existentes `:187`, `:193-202` e `:204-221` seguem
verdes sem edicao (nenhum stub emite o header) — vale renomear o `:204` para dizer que ele e o caso
"sem header".

**Risco a checar aqui, nao no gate final**: se o interceptor XHR do MSW sob happy-dom nao propagar
headers ao `HttpErrorResponse`, os dois testes falham **por motivo errado**. Mitigacao: substituir o
stub por `auth.login = () => throwError(() => new HttpErrorResponse({ status, headers }))`. O padrao
de substituicao existe em `:304`, mas la o objeto lancado e uma `DOMException` — adaptar.

### Verificacao da Task F-23.6

```bash
npx vitest run src/app/features/public/login/login.component.spec.ts; echo "EXIT=$?"
```

### Definicao de pronto da Task F-23.6

- [ ] Com header, `423` e `429` exibem o tempo real; sem header, os literais atuais.
- [ ] As 2 mutacoes aplicadas, derrubando os testes novos, e revertidas.
- [ ] Testes preexistentes do `423`/`429` verdes sem alteracao de assercao.

### Commit sugerido

```text
feat(web): usar o Retry-After do backend nas mensagens de bloqueio do login
```

---

## Task F-23.7 - e2e da jornada

**Objetivo**: provar na cadeia real de interceptors o que as specs provam em unidade.
**Pre-requisito**: Task F-23.6 concluida e aprovada.
**Esforco**: 0,15 dia.
**Arquivos esperados**: `e2e/account-locked.spec.ts`.

### Step 123.7.1 - Corrigir o que envelheceu

- Reescrever o comentario `:56-58`: *"a copy da pagina e estatica por construcao"* deixa de ser
  verdade, e o comentario passa a dizer o oposto — a pagina deriva do endpoint, e a linha abaixo e o
  que prova isso ponta a ponta.
- Trocar o assert `:59` (`/30 minutos/i`) por uma assercao sobre a clausula que **so existe com a
  politica**, do tipo `/5 ou mais tentativas .*em 15 minutos/i`. O `30` continuaria passando por
  acidente (o mock devolve 30); o `15` nao existe em nenhum lugar do codigo de producao, entao so pode
  ter vindo do endpoint.

### Step 123.7.2 - Teste novo: URL direta com token velho

`addInitScript` semeando `SEP_ACCESS_TOKEN` com um token expirado, `goto('/account-locked')`, e tres
asserts: heading visivel, clausula da politica visivel, e **`pathname === '/account-locked'`**.

O terceiro assert e o unico do repo que pega o redirect para `/login` descrito na F-23.3, e este e o
unico lugar que exercita a cadeia real do `app.config.ts` (`clientChannel → auth → stepUp → error`),
o bootstrap e a rota lazy — a spec Vitest monta a cadeia a mao.

Depende do tripwire do Step 123.2.3: sem ele o teste passaria mesmo com a isencao removida.

### Verificacao da Task F-23.7

```bash
npx playwright test e2e/account-locked.spec.ts; echo "EXIT=$?"
```
Esperado: 3 passed.

### Definicao de pronto da Task F-23.7

- [ ] 3 testes verdes.
- [ ] Mutacao: remover a rota de `ROTAS_SEM_AUTHORIZATION` → o teste novo falha no assert de
      `pathname`. Revertida.
- [ ] Comentario `:56-58` reescrito; nenhuma afirmacao falsa sobre estaticidade da copy.

### Commit sugerido

```text
test(web): cobrir a jornada de conta bloqueada com politica e token velho
```

---

## Fechamento (nao e task)

### Gates completos

```bash
npm run format:check && npm run contract:check && npm run lint && npm run lint:scss \
  && npm test && npm run build; echo "EXIT=$?"
npx playwright test e2e/account-locked.spec.ts; echo "EXIT=$?"
```
Esperado: `contract:check` **85 operacoes / 1 lacuna / exit 0**; Vitest = baseline + ~15; Playwright 3.

### Gate declarado pendente — smoke real contra `:8080`

Decidido em 2026-08-05 **nao** executar. Registrar no `SPRINT-F-23-PR.md` como pendencia nomeada, com
os dois fatos que ficam sem prova (detalhe na spec 123 §Riscos nao verificaveis):

1. A exposicao do `Retry-After` via CORS — o MSW nao emula a filtragem de headers nao-safelisted, entao
   Vitest **e** Playwright veriam o header mesmo com `app.cors.exposed-headers` quebrado. Foi assim
   que a Sprint 34 quase entregou a feature inerte.
2. Se a propria `/account-locked` toma `429` logo apos as 6 tentativas de login. Em leitura de codigo
   o `RateLimitFilter` so cobre `POST` de `/auth/login` e `/auth/totp/verify`, mas isso e por IP e
   depende de config.

Roteiro para quando o smoke rodar:

```bash
curl -i http://localhost:8080/api/v1/auth/politica-lockout          # 200 com os tres campos
curl -i -X POST http://localhost:8080/api/v1/auth/politica-lockout  # 401 (permitAll e por metodo)
```
No browser: 5 senhas erradas → a 6ª cai em `/account-locked`; conferir (a) o paragrafo com os tres
numeros do ambiente, (b) DevTools → Network: a request da politica sai **sem** `Authorization` e
responde `200`, (c) `Retry-After` presente em `response.headers` do `423`.

### Documentacao (`docs-SEP`, git manual)

- [`SEGURANCA.md`](../../docs-sep/SEGURANCA.md) §5 — marcar a armadilha como resolvida e **corrigir a
  consequencia descrita**: o token velho arranca o usuario para `/login`, nao apenas degrada a copy.
- [`STATE.md`](../../docs-sep/STATE.md) — sobrescrever: entrada da F-Sprint 23; item 2 do
  "Proximo passo" fechado.
- [`CONTEXT-PARTE-2.md`](../../docs-sep/CONTEXT-PARTE-2.md) — apender entrada curta.
- [`PRD-FASE-4.md`](../../docs-sep/PRD-FASE-4.md) §36, [`AI-ROADMAP.md`](../../AI-ROADMAP.md),
  [`specs/fase-4/README.md`](../../specs/fase-4/README.md).
- Criar `repos/sep-app/SPRINT-F-23-PR.md`; remover `SPRINT-F-22-PR.md` no ciclo padrao. **Feito.**

### Follow-ups a registrar

- `Retry-After` no `verify-totp` (`:57`, `:61`) e o `responseHeaders` de `mfa.totpVerify` que vem junto.
- `knownGap` do `Duration`: `tempoMedioResolucao30d: number` e o `NaNmin` do dashboard backoffice.
- Smoke real pendente, com os dois riscos nomeados acima.
