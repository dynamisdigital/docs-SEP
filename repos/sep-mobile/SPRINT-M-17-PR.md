# PR — M-Sprint 17: Follow-ups de lockout, acessibilidade e smoke no mobile

> Descricao temporaria para o PR `feature/msprint-17-followups-lockout-a11y-mobile -> develop`.
> Apagar apos o uso (ciclo padrao das descricoes de sprint).

## Summary

Sprint de **divida**, nao de produto: nenhuma jornada, rota, endpoint ou contrato novo. Quita quatro
defeitos independentes que estavam registrados como follow-up desde a M-11, a M-16 e a F-21, e
recupera o smoke `golden-path-mobile`, vermelho **desde a M-Sprint 4** — quatro meses.

O resultado mais visivel: a **suite e2e vai a 41 verdes, sem nenhuma falha**, pela primeira vez desde
a M-4.

| Gate | Antes | Depois |
|------|-------|--------|
| Vitest | 503 / 68 arquivos | **527 / 70** |
| Playwright | 27 (26 passam, **1 falha**) | **41 (41 passam, 0 falhas)** |
| `format:check` / `lint` / `lint:scss` / `build` | verdes | verdes |
| `cap sync android` / `gradlew assembleDebug` | — | verdes (APK debug 5,0 MB) |

Nada mudou em `sep-api` nem em `sep-app`.

## Mudancas por Task

### M-17.1 — Mock MSW com lockout

`src/mocks/handlers.ts` passa a contar falhas por username e responder `423` a partir da 6a
tentativa, espelhando a **ordem de avaliacao** do `AutenticarUsuarioUseCase`: o lockout e verificado
antes de resolver o usuario e de avaliar a credencial. Duas consequencias preservadas de proposito —
a 5a senha errada ainda responde `401`, e a senha **correta** apos o bloqueio tambem responde `423`.
Sucesso nao zera o contador, porque `LockoutService` so le instantes de falha e o `sep-api` nao tem
caminho de reset.

Isso torna `/account-locked` alcancavel offline e em Playwright pela primeira vez.

### M-17.2 — Cobertura do `423` nas tres camadas

O `423` era tratado em `login.component`, `verify-totp.component` e `errorInterceptor` desde a
Sprint 5 e **nenhuma das tres tinha teste**; `verify-totp` e `account-locked` nao tinham spec nenhuma.
Cada teste novo falha se o ramo correspondente for removido. Inclui o **negativo do `429`** (rate
limit nao e conta bloqueada) e o `423` vindo de `/auth/login`, rota que o interceptor isenta do `401`
mas nao do `423`.

A copy de `/account-locked` foi conferida afirmacao por afirmacao contra o `sep-api`, como a F-21 fez
no web. **Tres estavam erradas ou incompletas:**

| Afirmacao anterior | Problema |
|---|---|
| "revise os dispositivos conectados" | Nao existe tela de sessoes no app nem endpoint que liste dispositivos — o `AuthController` so expoe `/logout` e `/logout-all` |
| "tente novamente em alguns minutos" | Sao **ate 30 min**, contados da ultima tentativa (`PoliticaLockout.eventoDeBloqueio`); "alguns minutos" convidava a tentar aos 5 e falhar |
| "credenciais invalidas" | `STATUSES_FALHA` conta `SENHA_INVALIDA` **e** `TOTP_INVALIDO`; quem errou o TOTP tambem cai ali |

Acrescentado que o desbloqueio e **so por expiracao** — conferido que nao ha endpoint de unlock, acao
de backoffice, job nem delete em `LoginAttemptRepository`.

### M-17.3 — Guard de reentrancia em `consultarStatusPix`

`|| this.carregandoPix()` no early-return dos **dois** componentes (`portfolio-detail` da credora e
`parcela-detail` do tomador), replicando o fix que a M-16 aplicou em `consultarAportes`. O
`[disabled]` do botao so vale a partir do proximo ciclo de change detection, entao um duplo toque no
mesmo tick disparava duas requests concorrentes com a **mesma** geracao — que o guard de geracao nao
descarta.

### M-17.4 — Landmark `main` duplicado

O `ion-content` do Ionic ja aplica `role="main"` quando nao esta dentro de
`ion-menu`/`ion-popover`/`ion-modal` — e o app nao usa nenhum dos tres. Quatro telas publicas
envolviam o conteudo num `<main>` **dentro** dele. Os wrappers viram `<div>` com a classe preservada;
o SCSS so usa seletor de classe, entao o layout nao muda.

### M-17.5 — Foco nos destinos de redirect

`/account-locked` e `/access-denied` sao alcancados sem gesto do usuario. O Angular nao move foco na
navegacao, o app nao tem live region de rota e o `focusManagerPriority` do Ionic esta desligado por
decisao da sprint — o foco ficava em `<body>`.

O hook e **`ionViewDidEnter`, nao `ngAfterViewInit`** como no `sep-app`. Medido em Chromium: no
`ngAfterViewInit` o heading esta visivel por estilo mas **sem caixa de layout** (`offsetParent` nulo,
rect 0x0), porque os web components do Ionic ainda nao renderizaram, e `focus()` sem caixa e no-op.

### M-17.6 — `golden-path-mobile` contra MSW

Vermelho desde a M-4 por **tres** causas independentes — e o seletor era a menor delas:

1. `getByRole('link', { name: /cadastr/i })` nunca casou com o CTA "Criar conta", que tem esse texto
   desde a M-2;
2. era o **unico** dos 9 specs sem `NG_APP_USE_MSW`, entao falava com o backend real em `:8080`;
3. as senhas do fixture (`'123456'`/`'654321'`) violavam a politica e eram recusadas com `400` pelo
   proprio mock.

A **quarta** causa, que era o grosso do trabalho: o mock nao tinha o que a jornada exige.
`POST /usuarios` devolvia `201` e **esquecia** o usuario, `/auth/me` respondia sempre com o seed e
**nao existia** handler de `PATCH /usuarios/:id/senha`. Agora ha registro por username persistido em
`localStorage`, com o par fixo preservado para nao quebrar os outros 8 specs.

Uma **quinta** causa apareceu na execucao: o `ion-router-outlet` mantem a pagina anterior no DOM,
entao `getByLabel(/e-?mail/i)` casava os campos de register e login ao mesmo tempo. Resolvido com o
helper `paginaAtiva`, convencao que `pix-mobile` e `cobranca-mobile` ja usavam.

## Defeitos fora do escopo planejado, encontrados pelos reviews

Tres defeitos reais nao previstos pela spec foram corrigidos, cada um com teste que falha sem o fix:

1. **`errorInterceptor` engolia o redirect quando `clearSession()` rejeitava.** `clearSession()` chama
   `tokenStorage.clearAll()`, que em device e Capacitor Preferences e pode falhar; como
   `from(promiseRejeitada)` nunca executa o `switchMap`, o usuario **nao era redirecionado** e ainda
   recebia o erro de storage no lugar do `401`/`423` original. Afetava os dois ramos. Preexistente.

2. **`consultarAportes` (M-16) prendia o card carregando para sempre.** Reentrada na stack com o
   status Pix em voo fazia o `carregar()` obsoleto chegar em `consultarAportes` depois que o
   `carregar()` novo ja reabilitara o flag: a chamada obsoleta tomava a guarda de reentrancia, a
   geracao corrente desistia da propria leitura, e o `finally` da obsoleta pulava o reset (exige
   geracao igual). Spinner eterno e retry desabilitado. Reproduzido por probe antes de corrigir.

3. **O mock era mais permissivo que producao em tres pontos** — a direcao perigosa da assimetria,
   porque passa offline e quebra no device: `senhaAceita()` tinha perdido o `MIN_CHARS_POR_PALAVRA` da
   `PasswordPolicy` (aceitava `"a b c d"`); o `PATCH` de senha nao lia `Authorization` nem conferia
   ownership (aceitava troca sem token e para id alheio); e ignorava `@RequireStepUp`, sendo o unico
   dos tres endpoints do `stepUpInterceptor` sem a exigencia no mock.

## Test plan

- `npm test` — **527 testes / 70 arquivos**, exit 0.
- `npx playwright test` — **41 verdes, 0 falhas**; rodado 2x sem flake, e um dos reviews rodou
  `--repeat-each=3` (120/120).
- `npm run format:check`, `npm run lint`, `npm run lint:scss`, `npm run build` — verdes.
- `npx cap sync android` e `./gradlew assembleDebug` — verdes, APK debug de 5,0 MB.
  **Nota:** a maquina de dev **tem** Android SDK (`~/Android/Sdk`); o registro da M-16 dizendo que nao
  tinha esta desatualizado.

**Verificacao por mutacao em todas as Tasks**, conforme a spec exige. Alguns exemplos do que foi
provado remover/alterar e ver falhar: limiar e ordem de avaliacao do lockout; cada um dos tres ramos
`423`; as duas guardas de reentrancia (`found 2 requests` no `portfolio-detail`); o `<main>` aninhado
de volta; `focus()`, `tabindex="-1"` e o hook errado; e as quatro causas do golden path.

Os reviews acharam **nove assercoes evadiveis** por reescrita parcial (copy que casava pedacos soltos,
`toHaveBeenCalledWith` aceitando navegacao dupla, `expect.poll` mascarando foco perdido, landmark
invisivel no shell do app). Todas foram endurecidas e reverificadas.

## Limitacoes e follow-ups

**Nao entregue de proposito** (decisao da sprint, registrada na spec 217):

- **MSW continua fora do Vitest.** Plugar mudaria a infra dos 68 specs de uma vez. Consequencia
  assumida: a cobertura do `423` usa `HttpTestingController`, e a do mock vive no e2e.
- **`focusManagerPriority` global nao foi ligado.** Um dos reviews leu a implementacao do Ionic e
  trouxe evidencia nova a favor: ele faz `tabIndex=-1; focus()` em `main` -> `h1` -> `header` e ainda
  **restaura o foco no back** via `[ion-last-focus]`, fechando os **13** destinos de redirect de uma
  vez. Exige ADR; vale reabrir a decisao.
- Portar o `contract:check` para o `sep-mobile`; rodar Playwright no `CI-MOBILE`; escopo adiado pelo
  Gate M-16.0.

**Follow-ups novos, levantados pelos reviews:**

- **`/session-expired` nao move foco** — irmao de arquivo do `access-denied`, mesma pasta e mesma
  estrutura, alcancado por `401` sem gesto. Ficou de fora porque o step nomeia so dois destinos.
- **`onboarding-shell.iniciar()` nao tem guarda de reentrancia, e e uma MUTACAO** (POST que cria
  onboarding). Duplo toque no mesmo tick dispara dois POSTs. E o item de maior valor da lista, por ser
  escrita e nao leitura.
- **`setup-biometric` e tela roteada sem `h1`** (o `ion-title` nao e exposto como heading).
- **`src/app/home/home.page.html` e orfa** e tem `ion-header` dentro do `ion-content` — `banner`
  dentro de `main`. Inalcancavel hoje, armadilha se alguem a rotear.
- `paginaAtiva` esta duplicado literalmente em 4 specs e `enableMsw` nos 9 — candidatos a
  `e2e/fixtures/`.
- `resetAuthMockState()` segue sem chamador; so fica viva plugando o MSW no Vitest.
- Nenhuma das telas de desfecho tem `aria-live`/`role="alert"`. O que foi medido e **foco no DOM em
  Chromium**; em VoiceOver iOS, `focus()` programatico em elemento nao interativo frequentemente nao
  move o cursor do leitor.
- `verify-totp` nao tem teste do ramo `precisaRedefinirSenha`, nem do duplo-submit; o `login` tem a
  mesma lacuna do primeiro.

## Commits

```text
b52c9dc test(mobile): simular lockout de conta no mock de login
d5e597a fix(mobile): corrigir a direcao do risco do mock e travar o lockout por e2e
ba31fac test(mobile): cobrir a jornada de conta bloqueada nas tres camadas
0d26282 test(mobile): endurecer as assercoes do 423 e corrigir o comentario do prazo
940afa0 fix(mobile): redirecionar mesmo quando a limpeza de sessao falha
464298a fix(mobile): impedir leituras concorrentes de status pix no duplo toque
94eb936 fix(mobile): descartar leitura de geracao vencida antes da guarda
0fbfb40 fix(mobile): remover landmark main duplicado dentro do ion-content
1f34545 test(mobile): fechar dois pontos cegos do teste de landmark
39b56c8 fix(mobile): mover foco ao heading nos destinos de redirect
3ab1e57 fix(mobile): corrigir o porque do hook, o heading e o que o e2e prova
6194b35 test(mobile): recuperar o smoke golden path contra o mock
fab7901 fix(mobile): alinhar o mock de senha e sessao ao backend
```

## Referencias

- Spec [`217`](../../specs/fase-4/217-msprint-17-followups-lockout-a11y-mobile.md)
- Steps [`217`](../../steps-fase-4/mobile/217-msprint-17-steps.md)
- Origem dos follow-ups: M-Sprint 11 (race), spec [`216`](../../specs/fase-4/216-msprint-16-aporte-pix-avancado-mobile.md) (M-16),
  spec [`121`](../../specs/fase-4/121-fsprint-21-lockout-login-web.md) (F-21, que apontou o mock sem `423`)
