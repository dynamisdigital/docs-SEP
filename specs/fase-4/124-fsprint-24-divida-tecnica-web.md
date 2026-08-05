# Spec 124 - F-Sprint 24 - Divida tecnica do web

## Metadados

- **ID da Spec**: 124
- **Titulo**: F-Sprint 24 - Fechar os follow-ups abertos pela F-22 e pela F-23, o ultimo `knownGap` do
  `contract:check` e o vetor que ainda arranca o usuario da `/account-locked`
- **Status**: **planejada** (criada em 2026-08-05)
- **Fase do produto**: Fase 4 - correcao de divida; sem tela, endpoint, DTO, migration ou regra nova
- **Trilha**: Web (`sep-app`)
- **Origem**: follow-ups nomeados pela [`122`](./122-fsprint-22-contrato-erro-followups-web.md) e pela
  [`123`](./123-fsprint-23-politica-lockout-web.md), consolidados no item 6 do §Proximo passo do
  [`STATE.md`](../../docs-sep/STATE.md)
- **Depende de**: **D-Sprint 1** ([`300`](./300-dsprint-1-divida-dependencias-web-mobile.md)) mergeada,
  para nao disputar `package-lock.json`. Nao consome contrato novo do `sep-api` — **e por isso nao
  depende da Sprint 35**, que roda depois e e independente
- **Desbloqueia**: leva o `contract:check` de 1 lacuna para **0**, a primeira vez desde a criacao do
  gate na F-19
- **Responsavel principal**: Devs Plenos Frontend

## Objetivo

Duas frentes, ambas de divida:

1. **Dois defeitos vivos em producao.** A `/account-locked` ainda pode se autodestruir por um vetor que
   a F-23 nomeou mas nao fechou; e o KPI do dashboard de backoffice renderiza `NaNmin` desde sempre,
   escondido pelo proprio mock.
2. **Divida de contrato e de teste** que a F-22 e a F-23 registraram: `message: ""` apagando alerta,
   ramificacao por status nao declarada, e duplicacao de helper de teste que cresceu sem ninguem medir.

## Os dois defeitos vivos

### 1. A `/account-locked` continua alcancavel por um `401`/`403` que navega para fora

A F-23 fechou o caminho do **token velho** isentando `/auth/politica-lockout` no `authInterceptor`
(`auth.interceptor.ts:30`, `ROTAS_SEM_AUTHORIZATION`). Mas a isencao so impede que o header
`Authorization` seja **enviado** — ela nao impede que a resposta seja tratada.

A cadeia registrada em `app.config.ts:24-28` e:

```text
clientChannelInterceptor -> authInterceptor -> stepUpInterceptor -> errorInterceptor
```

`errorInterceptor` e o **ultimo do array**, logo o mais interno: ele ve a resposta **antes** do
`catchError` do `PoliticaLockoutService` (`politica-lockout.service.ts:39`). E ele navega
incondicionalmente:

- `error.interceptor.ts:21` — `401` fora de `/auth/login` -> `clearSession()` + `navigateByUrl('/login')`;
- `error.interceptor.ts:26` — `403` sem `TRATA_403_LOCALMENTE` -> `navigateByUrl('/access-denied')`.

Nenhum dos dois isenta `/auth/politica-lockout`. Um web novo contra um backend **sem a Sprint 34** ja
basta: o endpoint nao existe, o Spring responde `401` ou `403` conforme a config de seguranca, e o
usuario e arrancado da pagina que o `423` acabou de abrir. O `catchError` do service nunca chega a
rodar — ele so evita que o erro **derrube o render**, nao que o interceptor **navegue**.

O comentario em `politica-lockout.service.ts:24-26` afirma que o `catchError` mora ali porque
"`toSignal` relanca o erro na leitura do signal". Isso continua verdadeiro e **nao** e o que esta em
questao: o `catchError` protege o render, o vetor e a navegacao.

### 2. `NaNmin` no KPI do dashboard de backoffice

- `api.models.ts:691` declara `tempoMedioResolucao30d: number`.
- O backend serializa `Duration` como **ISO-8601** (`"PT2H"`): o Spring Boot desliga
  `WRITE_DURATIONS_AS_TIMESTAMPS`. **Medido na Sprint 34**, com o `knownGap` do
  `consumed-contracts.json` registrando a medicao.
- `backoffice-format.ts:30-44`, `formatarDuracao(segundos: number)`: a guarda `:31`
  (`!segundos || segundos <= 0`) **nao pega** `"PT2H"` — a string e truthy e `"PT2H" <= 0` e falso.
  Passa direto para `Math.round("PT2H" / 60)` = `NaN`, e `:43` devolve `"NaNmin"`.
- `backoffice-dashboard-page.component.html:31` chama exatamente esse caminho.
- **Nenhum teste ve**, porque `handlers.ts:1683` devolve `7200` — o mock e mais correto que o backend.

O comentario de `api.models.ts:685-686` ainda afirma *"serializado pelo backend como numero de segundos
(Jackson `WRITE_DURATIONS_AS_TIMESTAMPS`)"*. **A afirmacao e falsa** e e a origem do defeito; corrigi-la
faz parte da entrega.

## Decisao tecnica principal — o `errorInterceptor` ganha a mesma nocao de rota publica que o `authInterceptor`

O `authInterceptor` ja resolveu esse problema uma vez, e a justificativa dele (`auth.interceptor.ts:25-28`)
vale igual aqui: **ser publico e propriedade do endpoint**, que o interceptor le da URL, e nao decisao
do call site. Um `HttpContextToken` como `TRATA_403_LOCALMENTE` faria cada chamador ter de lembrar, e
esquecer voltaria ao bug em silencio.

Logo: a lista de rotas isentas de navegacao global vira compartilhada entre os dois interceptors, em
vez de duplicada. `/auth/login` ja e isento do `401` por expressao literal em `error.interceptor.ts:21`
— entra na mesma lista.

*Rejeitado*: mover o `errorInterceptor` para antes do `stepUpInterceptor` no array. Resolveria a ordem
mas mudaria o comportamento de **todas** as chamadas do app para consertar uma; e a ordem atual e
deliberada — o `errorInterceptor` precisa ver o erro depois do `stepUpInterceptor` para o fluxo de
step-up funcionar.

*Rejeitado*: `TRATA_403_LOCALMENTE` na chamada da politica. Cobriria o `403` e deixaria o `401` aberto,
que e o status mais provavel.

## Escopo

### Dentro

| # | Item | Ancora verificada (2026-08-05) |
|---|---|---|
| 1 | Isentar rotas publicas da navegacao global do `errorInterceptor` | `error.interceptor.ts:21,26`; `app.config.ts:24-28` |
| 2 | Isentar `/auth/totp/verify` no `authInterceptor` e cobrir o caminho do challenge | `auth.interceptor.ts:11-15` — defeito e correcao ja **prescritos no proprio codigo** |
| 3 | `message: ""` deixar de apagar o alerta | `api-error.ts:22` (`corpo?.message ?? padrao`) |
| 4 | `tempoMedioResolucao30d` para `string`, parse ISO-8601, mock corrigido, comentario falso corrigido | `api.models.ts:685-691`; `backoffice-format.ts:30-44`; `handlers.ts:1683` |
| 5 | `backoffice.reprocessarWebhook` declarar o `400` que ramifica | `consumed-contracts.json:1594-1602` (`erros: [403, 429]`) |
| 6 | Helper unico para `estabilizar()` | **39 definicoes byte-identicas** em `*.spec.ts` |
| 7 | Asserçoes de copy robustas a reformatacao; literais duplicados `login`/`verify-totp` | `account-locked.component.spec.ts` |

### Fora

- **Nao anotar `@Schema(type = number)` no backend.** O `followUp` do `knownGap` proibe
  explicitamente: foi tentado na Task 34.6 e **revertido**, porque publicaria um tipo que o servidor
  nunca emite e apagaria o unico detector do `NaNmin`. A correcao e **so web**.
- Reordenar a cadeia de interceptors (ver §Decisao tecnica principal).
- Os ~20 pontos de ramificacao por status sem `erros`: a Task 5 fecha o caso **medido**
  (`reprocessarWebhook`) e **inventaria** o resto com numero, sem varrer. Varrer 20 pontos e sprint
  propria e estouraria o teto de 7 tasks.
- `idCurto`/`formatarMoeda` duplicados em 6 arquivos cada: mesma familia da Task 6, mas sao codigo de
  producao e nao de teste — risco diferente, follow-up separado.

## Criterios de aceite

1. **`contract:check` sai de 1 lacuna para 0**, mantendo exit 0. Fecha o ultimo `knownGap`, aberto
   desde a F-Sprint 19 (2026-07-16).
2. Vitest acima da baseline do Gate (partida esperada: 765 / 94 arquivos), Playwright verde, `lint`,
   `format:check` e `build` verdes.
3. **Todo teste novo verificado por mutacao** — aplicar a mutacao nomeada, ver o teste falhar,
   reverter. Teste que sobrevive conta como **nao entregue** (skill
   `sep-web-mutation-verified-testing`).
4. O defeito do item 1 tem teste que **reproduz a navegacao indevida** antes da correcao. Sem esse
   teste, a correcao nao e verificavel — foi assim que ele sobreviveu a F-23.
5. O `NaNmin` tem teste que passa um `"PT2H"` de verdade pelo caminho da tela. Corrigir o mock sem
   corrigir o teste apenas move o ponto cego.

## Riscos e limitacoes

- **A Task 6 toca 39 arquivos de teste.** Diff grande e mecanico; o risco nao e regressao de produto e
  sim mascarar as outras tasks no review. Vai em **commit proprio e isolado**, e o `git diff --stat`
  do checkpoint precisa mostrar isso separado.
- A Task 7 muda asserçoes que a F-21 criou **de proposito** para quebrar a cada mudanca de copy
  (`account-locked.component.spec.ts:44`: *"Qualquer mudanca de copy DEVE quebrar aqui"*). O objetivo e
  torna-las robustas a **reformatacao de template** sem perder a deteccao de **mudanca de texto** — se
  as duas nao puderem ser separadas, a instrucao original vence e a task e reportada como nao feita.
- Smoke real contra `:8080` continua nao executavel; o vetor do item 1 e observavel offline (o MSW
  consegue devolver `401` na rota da politica), mas o comportamento contra backend real fica declarado
  como pendencia.

## Rastreabilidade

| Item da spec | Task |
|---|---|
| Rotas publicas isentas no `errorInterceptor` | F-24.1 |
| `/auth/totp/verify` no `authInterceptor` | F-24.2 |
| `message: ""` | F-24.3 |
| `tempoMedioResolucao30d` + `NaNmin` + mock + comentario | F-24.4 |
| `reprocessarWebhook` `400` + inventario | F-24.5 |
| Helper `estabilizar()` | F-24.6 |
| Copy robusta + literais duplicados | F-24.7 |
| Baseline, gates e limitacoes | Gate F-24.0 e Fechamento |

Steps em [`124-fsprint-24-steps.md`](../../steps-fase-4/web/124-fsprint-24-steps.md).
