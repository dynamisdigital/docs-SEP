# F-Sprint 23 - Politica de lockout e Retry-After no web

## Summary

A jornada de conta bloqueada parava de anunciar numeros fixos no codigo e passa a dizer os valores
efetivos do ambiente.

`/account-locked` dizia `"por ate 30 minutos"` em texto fixo (`account-locked.component.ts:43`), com
o valor real vindo de `app.security.lockout.lockout-minutes`, sobrescrivel por ambiente — um override
em ops fazia a tela mentir sem nada quebrar. O login dizia `"cerca de 1 minuto"` no `429`. A Sprint 34
do backend entregou as duas fontes de verdade (`GET /auth/politica-lockout` publico e `Retry-After`
nos `423`/`429`); esta sprint as consome.

Era a **Task F-22.6**, unica sobra da F-Sprint 22, que fechou sem ela por gate duplo. Virou sprint
propria porque a F-22 ja esta mergeada e registrada — retomar a task exigiria reabrir tres registros
historicos para caber uma entrega feita seis dias depois.

Spec [`123`](../../specs/fase-4/123-fsprint-23-politica-lockout-web.md) + steps
[`123`](../../steps-fase-4/web/123-fsprint-23-steps.md). Sem ADR, sem migration, sem endpoint novo.
Nada mudou em `sep-api` nem em `sep-mobile`.

## Test plan

| Gate | Baseline | Final |
|---|---|---|
| Vitest | 745 / 91 arquivos | **765 / 94** |
| `contract:check` | 84 ops / 1 lacuna | **85 ops / 1 lacuna** |
| Playwright | 38 | **39** |
| `format:check` / `lint` / `lint:scss` / `build` | verdes | verdes |

Todos rodados **depois** dos commits — o `lint-staged` reescreve arquivos, entao verde de antes nao
valia.

**26 mutacoes aplicadas, cada uma derrubando o teste que alegava cobrir, e revertidas**: 2 no
descriptor, 5 no service, 8 no `retry-after`, 2 no `authInterceptor`, 7 no `account-locked`, 2 no
login e 1 no e2e.

## Mudancas por modulo

**Contrato** — `consumed-contracts.json`: tipo `PoliticaLockoutResponse`, operacao
`auth.politicaLockout` e `responseHeaders` por status em `auth.login`. Snapshot, `.meta.json` e
`knownGaps` **intocados** — entregues em `ff7bc7d` (PR #120).

**Borda** — `PoliticaLockoutService` novo, com `catchError` no servico e validacao do corpo.

**Interceptor** — `authInterceptor` isenta `/auth/politica-lockout`.

**Tela** — `/account-locked` deriva a copy via `toSignal` + `computed`; so a interpolacao do primeiro
`<p>` muda no template.

**Login** — `retry-after.ts` novo; `423` e `429` usam o header quando presente.

**Mock** — handler da politica com tripwire de `Authorization`, constante da janela, `Retry-After` no
`423`, `errorResponse` com parametro opcional de headers.

## Decisoes

- **Servico proprio, nao metodo no `AuthService`.** O endpoint existe para a tela que nao tem sessao;
  acoplar faria a pagina do `423` depender do objeto que o `423` invalidou.
- **`catchError` no servico.** Poe "esta chamada nunca erra" no tipo, e e load-bearing: `toSignal`
  relanca o erro na leitura do signal.
- **`toSignal` + `computed`**, nao `resource()` (experimental, sem uso no repo) nem resolver de rota
  (faria a pagina esperar a rede).
- **Lista de rotas no interceptor, nao `HttpContextToken`.** Ser publico e propriedade do endpoint,
  que o interceptor le da URL — nao decisao do call site, ao contrario de `TRATA_403_LOCALMENTE`.
- **A copy revela `maxAttempts` e `windowMinutes`.** Os tres numeros ja sao publicos e `SEGURANCA.md`
  §5 registra a exposicao como aceita; a janela era o que faltava para o usuario entender por que
  esta bloqueado. O texto substitui "varias tentativas" em vez de acrescentar frase.
- **O fallback nao cita numero.** Corrigido no code review: a justificativa original ("so alcancavel
  com o endpoint fora do ar") era falsa — o fallback e o estado inicial de toda renderizacao.
- **Preposicoes diferentes entre telas.** `/account-locked` diz "por ate X" (duracao nominal); o login
  diz "tente novamente em Y" (restante real). Numeros diferentes na mesma incidencia estao corretos.
- **`responseHeaders` so em `auth.login`**, apesar de o step 122.6.2 pedir tambem `mfa.totpVerify`: o
  descriptor e de contratos consumidos, e o `verify-totp` ficou fora do escopo.

## Correcoes vindas do code review

1. `Number.isInteger` no servico estava **sem cobertura** — removia-lo mantinha a spec verde, e um
   `windowMinutes: 15.5` renderizaria "em 15.5 minutos". Teste acrescentado.
2. **Dois comentarios ficaram falsos** com esta sprint: o docblock do array sugeria enumerar os
   `permitAll` (sao oito, a lista tem dois) e `verify-totp.component.ts:26` afirmava que o
   interceptor isenta apenas `/auth/login`. Ambos reescritos.
3. **O fallback com "30 minutos"** era exibido em toda renderizacao, nao so com o endpoint fora do
   ar. Sob override e rede lenta, leitor de tela le o valor errado apos o `focus()` e nunca ouve a
   correcao. Trocado por texto nao-falsificavel.
4. `esperaDoRetryAfter` aceitava fracionario e exponencial: `1e21` rendia
   `"1.6666666666666666e+19 minutos"`. `Number.isInteger` + teto de 24h.
5. O docblock do helper afirmava que "as duas telas que consomem usam a mesma frase" — so o login
   consome, e seus dois ramos usam frases diferentes.
6. No e2e, o comentario descrevia o mecanismo errado e o assert de URL era **sincrono sem retry**
   (`page.url()`), deixando passar um redirect tardio. Virou `toHaveURL`.

## Dividas aceitas e follow-ups

**Nomeados pelo code review, nao corrigidos aqui:**

- **A pagina ainda pode se autodestruir por outro vetor.** A cadeia e `clientChannel -> auth ->
  stepUp -> error`, entao o `errorInterceptor` e o mais interno e roda **antes** do `catchError` do
  servico: um `401`/`403` na consulta navega para fora antes de o servico engolir o erro. O vetor
  fechado nesta sprint foi so o do token — e o `401` aqui nao depende de header nenhum (web novo
  contra backend sem a Sprint 34 cai em `anyRequest().authenticated()`). A §Fora de escopo descartou
  a guarda como especulativa com a premissa "nenhum `Authorization` sai": a premissa e verdadeira e
  ainda assim insuficiente. Fecha isentando `/auth/politica-lockout` do redirect no
  `errorInterceptor`, ou usando `HttpContext` para marcar a chamada como silenciosa.
- **As asserçoes de copy colada quebram com reformatacao pura de template.** As strings de
  `account-locked.component.spec.ts` codificam qual `<p>` esta inline e qual esta quebrado; reescrever
  `<p>{{ … }}</p>` em tres linhas derruba 4 dos 9 testes sem mudanca de comportamento (o Prettier
  reembrulha ao renomear o metodo). Fecha normalizando por no em vez de por `textContent` do card.
- **`/auth/totp/verify` recebe `Authorization` morto** e o usuario perde o desafio de MFA. Defeito
  anterior a esta sprint; fecha com uma linha no array e um teste.
- **`ehUtilizavel` e tudo-ou-nada**: `LockoutProperties` nao tem `@Min`, entao `windowMinutes = 0` e
  config valida e derruba os tres numeros de uma vez.
- **No mock, `Retry-After: 1800` coincide byte a byte com a `message`**, entao "o header ganha do
  corpo" e inobservavel offline e apagar a linha nao derruba teste — divergencia nao travada, ao
  contrario da regra do arquivo.
- **`estabilizar()` e a terceira copia do helper** no repo, e o loop de 5 microtasks e folga (passa
  com 0).
- Pluralizacao duplicada entre `retry-after.ts` e `account-locked.component.ts` — duplicacao
  consciente, no criterio ja registrado do projeto.

**Herdados, seguem abertos:** `Retry-After` no `verify-totp` (e o `responseHeaders` de
`mfa.totpVerify` que vem junto); `knownGap` do `Duration` e o `NaNmin` no dashboard backoffice;
Playwright fora do CI-APP.

## Gate declarado pendente — smoke real contra `:8080`

**Decidido nao executar.** Dois fatos ficam sem prova:

1. **A exposicao do `Retry-After` via CORS.** O MSW monta a resposta localmente e nao emula a
   filtragem de headers nao-safelisted que o browser aplica em XHR cross-origin — Vitest **e**
   Playwright veriam o header mesmo com `app.cors.exposed-headers` quebrado. Foi assim que a Sprint 34
   quase entregou a feature inerte: a `LockoutLoginIT` nao viu porque RestAssured nao aplica CORS.
2. **Se a propria `/account-locked` toma `429`** logo apos as 6 tentativas de login. Em leitura de
   codigo o `RateLimitFilter` so cobre `POST` de `/auth/login` e `/auth/totp/verify`, mas isso e por
   IP e depende de config.

Roteiro em [`123-fsprint-23-steps.md`](../../steps-fase-4/web/123-fsprint-23-steps.md) §Fechamento.

## Notas

- `pix-chaves.spec.ts:45` falhou **uma vez** sob paralelismo e passou nas execucoes seguintes,
  inclusive isolado (5/5). Nao confirmado contra a base; o diff em `handlers.ts` e aditivo e nao toca
  Pix.
- O teste de copy falhou de primeira por motivo legitimo: com `<p>{{ … }}</p>` o Angular descarta o
  no de whitespace entre elementos e `temporariamente`/`Detectamos` colam no `textContent`. A
  constante foi ajustada ao DOM real, nao o codigo ao teste.

## Commits

```
d99bc47 fix(web): endurecer a leitura de politica e Retry-After apos code review
cc948d4 test(web): cobrir a jornada de conta bloqueada com politica e token velho
5d48152 feat(web): usar o Retry-After do backend nas mensagens de bloqueio do login
3cd4ea0 feat(web): converter o header Retry-After em espera legivel
fd2ac2e feat(web): derivar a copy de conta bloqueada da politica do backend
5522815 fix(web): nao enviar Authorization ao endpoint publico de politica de lockout
907dd4c feat(web): ler a politica de lockout do backend na borda
b0ebf9d chore(contracts): declarar auth.politicaLockout e os Retry-After do login
```

## Merge (2026-08-05)

`origin/develop` via **PR #125** (squash `9fb9788`, 8 commits absorvidos, 15 arquivos), promovida a
`main` via **PR #126** (`b2809b3`), back-merge `c72b393`.

Conferido por conteudo, nao por titulo de PR: `develop` vs `main` com diff **vazio**; a arvore de
`origin/develop` **byte-identica** a da branch que passou nos gates; e o back-merge **vazio** — sem
evil merge, ao contrario do que aconteceu na Sprint 34, onde ele duplicou um metodo e quebrou o
`compileTestJava` so no CI.

Gates reconferidos em `develop` pos-merge com `npm ci` (nao `npm install`, que mascara lock
quebrado): Vitest **765**, Playwright **39**, `contract:check` **85/1**, `lint`, `lint:scss`,
`format:check` e `build` verdes.
