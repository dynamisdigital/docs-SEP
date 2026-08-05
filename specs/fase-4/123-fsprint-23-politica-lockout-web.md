# Spec 123 - F-Sprint 23 - Politica de lockout e Retry-After no web

## Metadados

- **ID da Spec**: 123
- **Titulo**: F-Sprint 23 - Consumir `GET /auth/politica-lockout` e o header `Retry-After` para que a
  jornada de conta bloqueada pare de anunciar numeros fixos no codigo
- **Status**: **MERGEADA develop+main** em 2026-08-05 (PR #125/#126)
- **Fase do produto**: Fase 4 - correcao de divida registrada; sem jornada de produto nova
- **Trilha**: Web (`sep-app`)
- **Origem**: **Task F-22.6**, unica sobra da F-Sprint 22
  ([`122`](./122-fsprint-22-contrato-erro-followups-web.md) §Task 6), que fechou sem ela por gate
  duplo — a Sprint 34 nao estava mergeada e o snapshot OpenAPI nao tinha o endpoint. Os dois
  bloqueios cairam em 2026-08-03
- **Depende de**: Sprint 34 ([`034`](./034-sprint-34-followups-lockout-contrato.md)) mergeada em
  `develop` **e** `main` (feito, PR #103/#104) e o snapshot OpenAPI do `sep-app` regenerado (feito,
  PR #120/#121). **Ambos ja satisfeitos** — esta sprint nao tem gate externo
- **Desbloqueia**: nada. Fecha o item 2 do "Proximo passo" do
  [`STATE.md`](../../docs-sep/STATE.md) e a ultima frente executavel do recorte web da Fase 4
- **Responsavel principal**: Devs Plenos Frontend

## Por que uma sprint propria e nao a retomada da F-22

A F-Sprint 22 esta fechada: mergeada em `develop`+`main` (PR #116), com historico em
[`CONTEXT-PARTE-2.md`](../../docs-sep/CONTEXT-PARTE-2.md) §F-Sprint 22 e
[`PRD-FASE-4.md`](../../docs-sep/PRD-FASE-4.md) §36 registrando o resultado (a descricao de PR
temporaria dela foi removida no ciclo padrao ao abrir esta sprint). Retomar a task exige
branch e PR novos de qualquer forma, e a contabilidade do projeto e por sprint: 1 sprint = 1 branch =
1 PR = 1 `SPRINT-*-PR.md` = 1 entrada em `STATE.md` e em `CONTEXT-PARTE-2.md`. Enfiar a task na
sprint fechada obrigaria a reabrir tres registros historicos para caber uma entrega que aconteceu
seis dias depois.

O texto original dos steps da F-22.6
([`122`](../../steps-fase-4/web/122-fsprint-22-steps.md) §Task F-22.6) permanece **valido como
registro do que foi planejado** e nao deve ser editado. Onde ele envelheceu, a
[`123-fsprint-23-steps.md`](../../steps-fase-4/web/123-fsprint-23-steps.md) corrige — ver §Divergencias.

## Objetivo

Uma frente so, de divida: **a jornada de conta bloqueada anuncia numeros que o backend pode ter
mudado.**

1. `account-locked.component.ts:43` diz `"por ate 30 minutos"` em texto fixo. O valor real e
   `app.security.lockout.lockout-minutes`, sobrescrivel por ambiente
   (`${APP_LOCKOUT_LOCKOUT_MINUTES:30}`). Um override em ops faz a tela mentir, sem nada quebrar. Os
   outros dois numeros da politica — quantas falhas bloqueiam e em que janela — **nao aparecem em
   lugar nenhum da tela**, e sao justamente o que explica ao usuario por que ele esta ali: quem errou
   3 vezes ontem e 2 hoje nao tem como saber.
2. `login.component.ts:48` diz `"Aguarde cerca de 1 minuto"` no `429`, e `:44` cai em
   `"Tente novamente em 30 minutos."` quando o `423` vem sem corpo. Desde a Sprint 34 o backend manda
   `Retry-After` nos dois status, com o tempo que realmente falta.

A Sprint 34 entregou as duas fontes de verdade. Falta consumi-las.

## Decisao tecnica principal — a politica alimenta a pagina, o header alimenta o login

Sao duas fontes com semantica diferente, e a confusao entre elas e o erro mais facil de cometer aqui:

| | `politica-lockout` | `Retry-After` |
|---|---|---|
| O que e | duracao **nominal** da politica | tempo **restante** real |
| Unidade | **minutos** | **segundos** |
| Onde e legivel | qualquer momento, sem sessao | so na resposta `423`/`429` |
| Quem usa | `/account-locked` | `login` |

`/account-locked` **nao pode** usar o header: ela renderiza depois do redirect, e o
`errorInterceptor` descarta o `HttpErrorResponse` (`error.interceptor.ts:31-34`); alem disso ela e
alcancavel por URL direta, cenario em que nunca houve resposta de API alguma. Propagar o header ate
la exigiria uma store — **rejeitado**, ver §Fora de escopo.

Por isso as duas telas usam **preposicoes diferentes**, e isso e proposital: a pagina diz
`"bloqueada por ate 30 minutos"` (duracao nominal) e o login diz `"Tente novamente em 12 minutos"`
(restante real). Numeros diferentes na mesma incidencia estao **corretos**, e as preposicoes dizem
por que.

**Sem ADR**: nao ha escolha estrutural nova. Endpoint publico ja existente, service Angular no padrao
do `MfaService`, e leitura de header com um precedente no repo
(`contrato-detail.component.ts:140-141`).

## Contratos backend consumidos

Verificado no codigo do `sep-api`, nao na spec de origem:

```http
GET  /api/v1/auth/politica-lockout   200 -> PoliticaLockoutResponseDto   (publico, GET-only)
POST /api/v1/auth/login              423 -> Retry-After: <segundos restantes reais>
POST /api/v1/auth/login              429 -> Retry-After: 60 (constante)
```

```json
{ "maxAttempts": 5, "windowMinutes": 15, "lockoutMinutes": 30 }
```

Pontos de atencao verificados:

- **Os dois ultimos campos sao MINUTOS; o `Retry-After` e SEGUNDOS.** Fator 60 entre as duas fontes,
  e nenhum nome de campo avisa. `PoliticaLockoutResponseDto.java:24-38`;
  `ApiExceptionHandler.java:143` e `RateLimitFilter.java:181`.
- **O schema nao declara `required`** (limitacao conhecida do springdoc, registrada em
  `contracts/README.md:51-53`). O contrato, portanto, **nao garante** os tres campos: um corpo `{}`
  renderizaria `"por ate undefined minutos"`. Validar na borda.
- **A `message` do `423` mente por design.** `ContaBloqueadaException.java:27-30` monta
  `"...Tente novamente em " + lockoutMinutes + " minutos."` a partir da **duracao configurada**, nao
  do relogio. O javadoc de `ApiExceptionHandler.java:131-132` grava a intencao: *"a `message`
  continua anunciando a duracao configurada — ela enuncia a politica, o header diz quando voltar"*.
  **Onde o header existir, ele ganha do corpo.**
- **O `Retry-After` do `429` e limite superior, nao espera exata**: `RateLimitFilter.java:68` fixa
  `PERIODO_DE_REFRESH = 1 min` e o javadoc `:170-178` explica que o tempo exato so existe em API
  `internal` do resilience4j. Dai a copy do `429` manter o `"cerca de"` e a do `423` nao.
- **`Retry-After` nao e CORS-safelisted.** Ja esta em `app.cors.exposed-headers`
  (`application.yml:87`) desde a Sprint 34, mas **isso nao e testavel no `sep-app`** — ver
  §Riscos nao verificaveis.
- **O corpo de erro nao tem `codigo` nem `erros`.** `ErrorResponseDto` tem seis campos;
  `ContaBloqueadaException.CODIGO = "AUTH-423-001"` existe mas nunca e serializado (follow-up backend
  aberto). O status HTTP segue sendo o unico discriminador de categoria no fio.

### Autorizacao

`GET /auth/politica-lockout` e publico (`SecurityConfig.java:74-77`, `permitAll` **por metodo** — um
`POST` no mesmo path responde `401`). Nao exige token e **nao deve receber um**.

A premissa registrada na spec 122 §Autorizacao — *"nao ha mecanismo novo a criar"* — **esta errada** e
esta e a correcao mais importante desta spec. O `authInterceptor` isenta apenas `/auth/login`
(`auth.interceptor.ts:9`), entao um token velho ainda no `localStorage` viaja para o endpoint publico,
o `JwtAuthenticationFilter` responde `401` — e o `errorInterceptor` isenta do redirect de `401`
somente `/auth/login` (`error.interceptor.ts:21`), de modo que o `401` dispara `clearSession()` +
`navigateByUrl('/login')`.

**Consequencia: o usuario e arrancado de `/account-locked` e jogado no login.** Os registros
existentes ([`STATE.md`](../../docs-sep/STATE.md):284-289 e
[`SEGURANCA.md`](../../docs-sep/SEGURANCA.md):260-264) descrevem o efeito como "cai de volta no texto
fixo"; e pior que isso. Corrigir os dois no fechamento.

O cenario e realista, nao teorico: `/account-locked` e alcancavel por URL direta e por reload, e o
`clearSession()` do `errorInterceptor` so roda quando o `423` veio de uma chamada — quem chega pela
URL nunca teve o token limpo.

## Escopo

### Em escopo

- `PoliticaLockoutResponse` na borda (`core/api/api.models.ts`) e service proprio
  `core/auth/politica-lockout.service.ts`, que **falha em silencio** e valida o corpo.
- `/account-locked` deriva a copy da politica, com fallback estatico. A pagina **continua funcional
  sem a chamada** — requisito, nao detalhe.
- `authInterceptor` isenta `/auth/politica-lockout` de `Authorization`.
- `login` usa o `Retry-After` no `423` e no `429`, com fallback aos literais atuais.
- `consumed-contracts.json`: operacao `auth.politicaLockout`, tipo novo e `responseHeaders` por status
  em `auth.login`.
- Handler MSW do endpoint, coerente com o limiar que o mock ja aplica, e `Retry-After` no `423` do
  login do mock.
- Cobertura por mutacao de tudo acima, incluindo o e2e do cenario "URL direta com token velho".

### Fora de escopo

- **`Retry-After` no `verify-totp`.** `verify-totp.component.ts:57` e `:61` tem os mesmos literais e o
  backend manda o header nesse endpoint tambem — e divida real, registrada como follow-up. Fica de
  fora por decisao de recorte: esta sprint entrega a jornada de conta bloqueada ponta a ponta, e o
  TOTP e uma segunda jornada. **Consequencia coerente**: nao declarar `responseHeaders` em
  `mfa.totpVerify` no descriptor, apesar de o step 122.6.2 pedir — ver §Divergencias.
- **`knownGap` do `Duration`** (`api.models.ts` declara `tempoMedioResolucao30d: number` onde o fio
  leva ISO-8601 `"PT2H"`, e `backoffice-format.ts` renderiza `NaNmin`). Segue aberto de proposito; o
  `contract:check` fecha esta sprint com 1 lacuna.
- **Store para propagar o `Retry-After` ate `/account-locked`.** Ja rejeitado pela F-21 como
  "abstracao especulativa para um caso", e o argumento nao mudou: a pagina e alcancavel por URL
  direta, onde nao existe header nenhum. Ela usa o endpoint, que e o caminho que atende os dois casos.
- **`aria-live` na troca de copy.** A politica chega logo depois do foco no heading; uma live region
  faria o leitor de tela anunciar o paragrafo duas vezes num desfecho de evento de seguranca.
- **Endurecer o `errorInterceptor` com uma segunda isencao de `401`.** Com a isencao no
  `authInterceptor` nenhum `Authorization` sai, entao a guarda seria especulativa. O acoplamento entre
  os dois interceptors fica documentado e coberto por teste.
- **Smoke real contra `:8080`.** Decisao do usuario em 2026-08-05 — ver §Riscos nao verificaveis.
- Qualquer mudanca no `sep-api`, no `sep-mobile` ou no snapshot OpenAPI.

## Divergencias em relacao ao texto original da F-22.6

Registradas para que a diferenca seja rastreavel, e nao lida como esquecimento:

1. **O Step 122.6.3 (snapshot + `knownGaps`) ja foi entregue** pelo PR #120/#121 (`ff7bc7d`), num PR
   proprio restrito a `contracts/`. O snapshot ja contem o path, o schema e os quatro `Retry-After`;
   os `knownGaps` cairam de 8 para 1. **Nao re-rodar a regeneracao**: sairia de um runtime diferente e
   produziria diff espurio. Resta apenas declarar o consumo.
2. **`responseHeaders` so em `auth.login`.** O step pedia tambem `mfa.totpVerify`; o descriptor e de
   contratos **consumidos**, e declarar um header que nenhuma tela le seria declaracao falsa.
3. **Isencao no `authInterceptor`** — nao existia no texto original, que herdou a premissa errada da
   spec 122 §Autorizacao.
4. **A copy passa a revelar `maxAttempts` e `windowMinutes`**, que o texto original nao previa. Os
   tres numeros ja sao publicos (endpoint `permitAll`, schema no `/v3/api-docs`, `lockoutMinutes` na
   `message` do `423`) e `SEGURANCA.md` §5 registra a exposicao como decisao aceita. A janela e a peca
   que hoje falta para o usuario entender o que aconteceu, e o texto **substitui** "varias tentativas"
   em vez de acrescentar frase.

## Riscos nao verificaveis nesta sprint

Sem smoke contra `:8080` (decidido), dois fatos ficam **nao provados**. Registrar como gate explicito
na DoD, nao como pendencia difusa:

1. **A exposicao do `Retry-After` via CORS.** O MSW monta a resposta localmente e nao emula a
   filtragem de headers nao-safelisted que o browser aplica em XHR cross-origin. Vitest **e** o e2e
   (que roda sobre MSW) enxergariam o header mesmo com `app.cors.exposed-headers` quebrado. Foi
   exatamente assim que a Sprint 34 quase entregou a feature inerte — a `LockoutLoginIT` nao viu
   porque RestAssured nao aplica CORS. So browser real contra `:8080` prova.
2. **A propria `/account-locked` pode tomar `429`.** O usuario chega ali logo depois de queimar 6
   requisicoes de login. O `RateLimitFilter` hoje so age em `POST` de `/auth/login` e
   `/auth/totp/verify` (`RateLimitFilter.java:55-56`, `:99-116`), entao **em leitura de codigo o
   endpoint esta fora do filtro** — mas isso e por IP e depende de config, e o efeito seria a pagina
   cair no fallback justo no caminho feliz. Se acontecer, o remedio e do backend.

## Definicao de pronto

- [ ] `/account-locked` exibe os tres numeros vindos do endpoint e **continua funcional se a chamada
      falhar**, com teste dos dois caminhos e do caminho "antes da resposta".
- [ ] Token velho no `localStorage` nao viaja para `/auth/politica-lockout`, com teste, e a pagina nao
      e perdida para `/login` — provado tambem no e2e, na cadeia real de interceptors.
- [ ] `423` e `429` do login usam o `Retry-After` quando presente e caem nos literais atuais quando
      ausente ou invalido.
- [ ] `contract:check` verde com **85 operacoes e 1 lacuna** (a do `Duration`, intencional).
- [ ] Todo teste novo verificado por mutacao: a mutacao aplicada, o teste falhando, a mutacao
      revertida. Teste que sobrevive a mutacao do codigo que alega cobrir e **nao entregue**.
- [ ] Gates verdes: `format:check`, `contract:check`, `lint`, `lint:scss`, `test`, `build`, e o
      Playwright do arquivo tocado.
- [ ] **Gate declarado como pendente, nao como feito**: smoke real contra `:8080`, com os dois riscos
      acima nomeados no `SPRINT-F-23-PR.md`.

## Gates que nao contam como task

- Precheck e baseline medida (Gate F-23.0): numero nao medido no gate nao pode ser citado no
  fechamento.
- PR description ao fim, e atualizacao dos indices documentais.

## Skills obrigatorias

`coding-guidelines`, `clean-code` e `sep-web-mutation-verified-testing`, conforme
[`AGENT.md`](../../AGENT.md) §Skills e o precedente da F-22.
