# F-Sprint 21 — Jornada de conta bloqueada no login web (descricao de PR)

> Descricao temporaria consolidada para o PR `feature/fsprint-21-lockout-login-web` -> `develop` no
> `sep-app`. Apagar apos o merge (ciclo de vida padrao).

## Resumo

**Correcao de defeito, sem escopo novo.** Lado web do par corretivo aberto em 2026-07-29, cujo lado
backend e a Sprint 33 (ja mergeada em `develop`+`main`). O login passa a dizer a verdade em cada
resposta de erro, `/account-locked` passa a informar o prazo e o mecanismo reais de desbloqueio, e a
jornada vira verificavel em dev-offline, Vitest e Playwright. Spec `121`; steps `121`.

Limiar, janela e desbloqueio permanecem autoritativos no `sep-api`. Nao altera endpoint, DTO,
migration ou regra no backend.

## Commits (sep-app)

| Commit | Tipo | Conteudo |
|---|---|---|
| `145c366` | test | mock MSW de login stateful (contador por usuario, `423` da 6a, `resetLoginMockState`) |
| `a068275` | fix | pos-review: cobertura do "sucesso nao zera o contador", controle positivo do escopo por usuario, reset tambem de `currentMockUser`, `Record` -> `Map` |
| `b88d7a8` | fix | mapeamento de status para mensagem no login + `423` no `errorInterceptor` + rewire do spec com interceptors reais |
| `2a5a20e` | fix | pos-review: usar `err.error.message` (423 e 5xx), guarda `instanceof HttpErrorResponse`, teste negativo do `429` no interceptor |
| `83ade8a` | fix | copy de `/account-locked` (30 minutos, desbloqueio automatico) + spec nova do componente |
| `8d8acfd` | fix | pos-review: afirmacoes falsas da copy corrigidas, copy travada integralmente, `<main>` + landmark + foco no heading |
| `775df81` | test | smoke Playwright da jornada + snapshot OpenAPI renovado + docs |
| _(este)_ | test | pos-review: controle positivo da senha do fixture; `comandoRegeneracao` do snapshot reproduzivel |

## Contrato consumido (`POST /api/v1/auth/login`)

```http
200 -> TokenResponse
400 -> ErrorResponseDto   validacao de payload
401 -> ErrorResponseDto   "Autenticacao requerida"  (senha errada OU usuario inexistente)
423 -> ErrorResponseDto   "Conta bloqueada temporariamente. Tente novamente em {lockout-minutes} minutos."  (30 no default)
429 -> ErrorResponseDto   "Limite de requisicoes excedido. Aguarde antes de tentar novamente."
```

**O HTTP status e o unico discriminador de categoria no fio**: o `ErrorResponseDto` nao tem campo de
codigo e o `ContaBloqueadaException.CODIGO = "AUTH-423-001"` existe so em Java, nunca serializado. Ja
o `message` do corpo existe e e mais autoritativo que qualquer literal do frontend nos casos de `423`
(a duracao vem de `app.security.lockout.lockout-minutes`, sobrescrevivel por ambiente) e de `5xx` (o
`withSupportReference` injeta o codigo de suporte ali).

**Snapshot OpenAPI renovado** (`7f40056` -> `a613c6c`, exportado do `:8080` com profile `dev`).
Diferenca semantica: exatamente 4 adicoes — `423` e `429` em `/auth/login` e `/auth/totp/verify`,
entregues pela Task 33.4. **Nenhuma entrada de `knownGaps` foi criada**: o Step 121.4.2 manda pular o
registro quando a Sprint 33 ja esta integrada, e ela estava. `contract:check` produz saida identica
ao baseline.

## Decisoes da sprint

- **A navegacao do `423` fica exclusivamente no `errorInterceptor`.** Sete arquivos do `sep-app` ja
  afirmam esse contrato textualmente; o `423` tambem vem de `/auth/totp/verify`; e o interceptor faz
  `clearSession()` junto. A mensagem de `423` no componente e **fallback defensivo** para o caso de a
  navegacao ser cancelada por um guard futuro — ha teste provando que o componente **nao** navega.
- **O `429` nunca e tratado como bloqueio.** Rate limit por IP nao tranca conta nenhuma; mandar o
  usuario para `/account-locked` e apagar a sessao dele informaria um bloqueio inexistente. Ha teste
  negativo no interceptor travando isso.
- **`/account-locked` usa copy estatica**, mas cada afirmacao dela foi conferida contra o `sep-api`
  (ver §Achados). O interceptor navega e descarta o `HttpErrorResponse`, entao a `message` do servidor
  nao chega ate a pagina; ela tambem e alcancavel por URL direta e por `423` de qualquer endpoint.
- **O mock MSW nao simula o `429`.** Um limitador fiel seria um token bucket por wall-clock, o que
  tornaria Vitest e Playwright sensiveis a tempo e — pior — **reproduziria o proprio bug**, escondendo
  `/account-locked` de todo teste. O `429` e coberto por override pontual no spec do login.
- **Divergencia deliberada do mock (decisao do dono do repo, 2026-07-30)**: o mock incrementa o
  contador tambem para username desconhecido, vazio ou fora do formato e-mail. O `sep-api` nao — so
  `SENHA_INVALIDA` e `TOTP_INVALIDO` contam (`LockoutService.STATUSES_FALHA`), e um username
  inexistente responde `401` para sempre (verificado contra `:8080`: 6 falhas, 6x `401`, 6 linhas
  `USUARIO_INEXISTENTE` gravadas e nenhuma contada). O mock e portanto **mais estrito** que a
  producao; a assimetria e segura (falha offline, passa em producao — nunca o contrario). Ha teste
  travando a escolha, para que ela nao seja revertida em silencio. **O step 121.1.2 afirma o
  contrario e precisa de correcao textual** — ja aplicada nos steps.
- **Segunda divergencia do mock, pre-existente e inofensiva**: o `401` do mock diz
  `"Credenciais invalidas"` e o `sep-api` diz `"Autenticacao requerida"`. Sem efeito observavel — o
  componente usa copia local no `401` —, mas listada aqui para que a lista de divergencias esteja
  completa e ninguem "corrija" a errada.

## Achados dos code reviews (corrigidos na sprint)

| Severidade | Achado | Correcao |
|---|---|---|
| Alta | Mutante `423 \|\| 429` no `errorInterceptor` **sobreviveu a suite inteira** (676 testes): usuario apenas rate-limitado teria a sessao apagada e cairia em `/account-locked` | teste negativo do `429` no interceptor (`2a5a20e`) |
| Alta | A spec de `/account-locked` era uma **denylist de tres frases**; um mutante que revertia a intencao inteira do commit ("acione o atendimento e peca a reativacao") passava verde | assercao da copy integral (`8d8acfd`) |
| Alta | Invariante "sucesso nao zera o contador" so existia em comentario; o mutante sobrevivia | teste dedicado (`a068275`) |
| Media | `mensagemDeErroDeLogin` recebia `status: number` e descartava `err.error.message`, divergindo dos sete helpers compartilhados de erro do repo (`*-error.ts` e `*-format.ts`), que leem `err.error.message` | passa a receber o erro (`2a5a20e`) |
| Media | `30 minutos` fixo no login: `lockout-minutes` e sobrescrevivel por env e a tela mentiria apos override | ecoa o `message` do backend; literal so como fallback (`2a5a20e`) |
| Media | `5xx` caia no ramo de conexao e descartava o codigo de suporte do `withSupportReference` | ramo proprio (`2a5a20e`) |
| Media | `erro: HttpErrorResponse` era anotacao falsa: o `tap` de `AuthService.login` roda **depois** do `200`, fora do alcance do interceptor, e um `DOMException` de `localStorage` cheio chegava sem `status` — login aceito pelo servidor, tela culpando a conexao | guarda `instanceof` (`2a5a20e`) |
| Media | Copy dizia "por 30 minutos": `PoliticaLockout` mede o prazo a partir da falha que fecha a janela, nao de quando a tela abre, entao quem chega depois tem menos tempo restante | "por ate 30 minutos, contados a partir da ultima tentativa" (`8d8acfd`) |
| Media | Copy dizia "credenciais invalidas": `TOTP_INVALIDO` tambem conta e `VerificarTotpUseCase` lanca o mesmo `423`, entao quem errou o codigo caia ali sendo mandado trocar a senha | "senha ou codigo de verificacao" (`8d8acfd`) |
| Media | "nao e preciso acionar o suporte" fechava a porta de quem esqueceu a senha — nao existe recuperacao para nao autenticado no `sep-api` | "nao existe liberacao manual" (`8d8acfd`) |
| Media | "revise os dispositivos conectados" apontava para capacidade inexistente: nao ha tela de sessoes e `AuthService.logoutAll()` nao tem nenhum chamador | clausula removida (`8d8acfd`) |
| Media | `/account-locked` era uma das **tres paginas publicas sem landmark** e, sendo destino de redirect automatico, deixava o usuario de leitor de tela em `<body>` sem anuncio | `<main>` + `<section aria-labelledby>` + foco no heading (`8d8acfd`); `verify-totp` e `redirect-to-app` seguem sem landmark, como follow-up |
| Media | Assert de ausencia com string deixava passar a copy de credencial **embutida** noutra mensagem | regex `ACUSA_CREDENCIAL` (`2a5a20e`) |
| Media | Remover `loading.set(false)` do callback de erro sobrevivia: usuario ficaria preso em "Entrando..." ate recarregar | assert do CTA liberado (`2a5a20e`) |

**Verificacao por mutacao** foi aplicada a cada teste novo — manual, aplicando e revertendo a quebra
na producao correspondente. **Nao ha Stryker nem tooling de mutacao no repo**, entao nao ha relatorio
a procurar; o registro sao os exit codes de cada rodada. **30 mutantes executados no total, 30
mortos** apos as correcoes. Sete deles sobreviveram na primeira rodada de review e foram o que
motivou os commits de pos-review.

## Verificacao

| Gate | Resultado |
|---|---|
| `npm run format:check` | 0 |
| `npm run lint` | 0 |
| `npm run lint:scss` | 0 |
| `npm run test` (Vitest) | **685** / 88 arquivos (baseline 664 / 87) |
| `npm run build` | OK |
| `npm run e2e` (Playwright) | **38** (+2 desta sprint) |
| `npm run contract:check` | OK, saida identica ao baseline |
| `npm audit --omit=dev` | 0 |

**Smoke real contra `:8080` executado e aprovado** (2026-07-30), com o `sep-api` servindo conteudo
identico a `origin/develop` (Sprint 33 incluida) e o front em `ng serve` com `useMsw: false`:
5 senhas erradas exibem a mensagem de credencial e a **6a tentativa, com a senha correta,
redireciona para `/account-locked`**. E o criterio de aceite final do Step 121.4.3 — o cenario
parcial ("sem a Sprint 33", em que a 6a responde `429`) nao se aplica.

## Riscos e limitacoes

- **O e2e e mais verde que a producao, de proposito**: o mock omite o `429`, entao a jornada offline
  nunca esbarra no rate limit. O comportamento real com rate limit foi coberto pelo smoke em `:8080`.
- O mock nao simula a janela de 15 min nem a duracao de 30 min (nao tem relogio): o bloqueio dura ate
  `resetLoginMockState()` nas specs, ou ate o reload da pagina no dev-offline.
- O `30` de `/account-locked` continua literal e **desalinha se `APP_LOCKOUT_LOCKOUT_MINUTES` for
  sobrescrito** — a `message` do servidor nao chega a essa pagina. O login nao tem esse problema
  (ecoa o backend). Follow-up: expor o valor no contrato.
- `X-Step-Up-Token` segue fora do OpenAPI (`knownGaps[0]`, follow-up backend anterior).

## Follow-ups registrados

- `verify-totp.component.ts` tem o **mesmo** callback de erro pelado (`400`/`423`/`429`/rede -> "Codigo
  TOTP invalido ou expirado."). Fora de escopo por decisao dos steps.
- `sep-mobile`: o mock de la tem a mesma lacuna de `423` (nao produz o status).
- `access-denied.component.ts` tem o mesmo gap de foco em destino de redirect.
- `error.interceptor.spec.ts` tem um assert vacuo pre-existente no caso de `401` (`currentUser()` ja
  nasce nulo).
- `errorMessage.set(null)` no submit e load-bearing para o anuncio do `role="alert"` e nao tem teste
  de duplo submit.
- Backend: expor `lockout-minutes` no contrato, para `/account-locked` parar de fixar o numero.
- `verify-totp.component.html` e `redirect-to-app.component.ts` seguem **sem landmark** (`<main>`); o
  segundo tambem e destino de redirect, entao tem o mesmo gap de foco do `access-denied`.
- `RegisterComponent` **nao esta roteado em lugar nenhum** (`/register` carrega
  `RedirectToAppComponent`): e codigo morto, nao apenas uma tela em desuso.
- **A renovacao do snapshot nao trava contrato nenhum hoje**: `consumed-contracts.json` declara
  `auth.login` e `mfa.totpVerify` com `"sucesso": [200]` e nenhum status de erro, e o
  `contract-check.mjs` so inspeciona os status de sucesso. Se o backend removesse o `423`, o check
  passaria verde. Declarar os status de erro consumidos e o passo que falta — ficou fora de escopo
  por decisao dos steps ("estender o checker e feature, nao correcao de defeito").

## Checklist pos-merge (`develop` + `main`)

- [ ] PRD-FASE-4 §36 (tabela web): adicionar a linha F-21 com o resultado.
- [ ] `STATE.md`: sobrescrever estado + proximo passo; apendar historico curto em
      `CONTEXT-PARTE-2.md`.
- [ ] `specs/fase-4/README.md`: status da linha F-21 para `concluida`.
- [ ] Apagar este arquivo (ciclo de vida padrao) **e remover as referencias a ele** em
      `AI-ROADMAP.md` e `docs-sep/STATE.md`, senao viram links mortos.
