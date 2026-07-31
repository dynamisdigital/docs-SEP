# F-Sprint 22 — Contrato de erro verificavel e follow-ups da F-21 no web (descricao de PR)

> Descricao temporaria consolidada para o PR `feature/fsprint-22-contrato-erro-followups-web` ->
> `develop` no `sep-app`. Apagar apos o merge (ciclo de vida padrao).

## Resumo

**Sprint de divida, sem escopo de produto novo.** Duas frentes independentes, ambas registradas como
follow-up por sprints anteriores. Spec `122`; steps `122`.

1. **O contrato de erro nao era verificavel.** As 85 operacoes declaravam so `sucesso`, e o
   `contract-check.mjs` so inspecionava status de sucesso. Se o backend removesse o `423` de
   `/auth/login`, o `contract:check` passaria verde e a jornada de conta bloqueada voltaria a quebrar
   em silencio — o mesmo modo de falha que originou o par corretivo Sprint 33 / F-Sprint 21.
2. **Follow-ups da F-21 nao propagados.** `verify-totp` tinha o mesmo callback de erro pelado que o
   login tinha antes da correcao; `access-denied` era destino de redirect sem mover foco; duas telas
   publicas nao tinham landmark; o `RegisterComponent` era codigo morto com 5 testes verdes.

Nao altera endpoint, DTO, migration ou regra no `sep-api`. Nao toca o `sep-mobile`.

## Commits (sep-app)

| Commit | Tipo | Conteudo |
|---|---|---|
| `0f14ab2` | feat | campo `erros` + `verificarStatusDeErro`; `responseHeaders` vira mapa por status; deteccao de `knownGap` obsoleto com exit 1 so contra o snapshot versionado |
| `6f26dc8` | fix | pos-review: `decidirCodigoDeSaida` extraida e testada; gap `field-type-mismatch` deixa de ser imune a obsolescencia; chave de status validada; `consumirGap` marca todos os matches; guarda de shape |
| `133e950` | fix | `verify-totp` traduz erro por status (400/423/429/5xx/rede) + spec nova do componente + `erros` em `mfa.totpVerify` |
| `40e98c0` | fix | foco no heading de `access-denied`; `<main>` + regiao nomeada em `verify-totp` e `redirect-to-app` |
| `cd2558e` | refactor | remove `RegisterComponent` orfao e o que ficou orfao junto; `mensagemDeErroDaApi` unica em `core/api/` com spec propria; os 7 helpers de dominio delegam |
| `f2f06f5` | fix | pos-review: `message` vazia deixa de apagar o alerta; formato do codigo validado no cliente; excecao de `applyMfaVerifyResponse` tratada; 5 lacunas de teste fechadas |
| `a21fd66` | test | dividas de teste da F-21: assert vacuo do `401`, duplo submit, `5xx` pela cadeia real de interceptors |
| `0f28d50` | feat | `erros` declarados em mais 7 operacoes que ramificam por status |

31 arquivos: 5 adicionados, 4 removidos, 22 modificados (+1230 / -609).

## O que o `contract:check` passa a cobrir

```text
antes:  status de sucesso, parametros, headers de request, campos/tipos/enums
depois: + status de erro declarados em `erros`
        + headers de resposta POR STATUS (responseHeaders vira mapa)
        + knownGap obsoleto (exit 1 contra o snapshot versionado)
```

**Regra do campo `erros`, registrada no `$comment` do descriptor e no `contracts/README.md`**:
declarar um status **so quando a tela ramifica por status**. Operacao que usa
`apiErr?.message ?? padrao` nao discrimina status; declarar ali criaria manutencao sem proteger nada.

`responseHeaders` virou mapa (`{ "200": [...] }`) porque o loop antigo iterava `operacao.sucesso`, o
que tornava **inalcancavel** qualquer header que so exista em resposta de erro — caso do `Retry-After`
que a F-22.6 vai consumir. Migracao de uma linha: so `contratos.documentoAssinado` usava o campo.

**Nenhum `knownGap` foi criado ou removido**; o snapshot OpenAPI **nao** foi renovado (continua em
`a613c6c`). As 29 lacunas conhecidas seguem identicas.

## Operacoes com `erros` declarados (9)

| Operacao | `erros` | Onde a tela ramifica |
|---|---|---|
| `auth.login` | `400, 401, 423, 429` | `login.component.ts:33-48` (`switch`) |
| `mfa.totpVerify` | `400, 423, 429` | `verify-totp.component.ts` (`switch`, novo nesta sprint) |
| `mfa.totpSetup` | `409` | `setup-totp.component.ts:43` |
| `mfa.stepUpInitiate` | `400` | `step-up.component.ts:163` |
| `pix.cadastrarChave` | `400, 403, 409, 422` | `chaves-pix-page.component.ts:400` (`tratarErroCadastro`) |
| `pix.removerChave` | `403, 404` | `chaves-pix-page.component.ts:453` (`tratarErroRemocao`) |
| `backoffice.reprocessarWebhook` | `403, 429` | `reprocessos-page.component.ts` (handler compartilhado) |
| `backoffice.reprocessarProvider` | `400, 403, 429` | idem |
| `usuarios.alterarSenha` | `403` | `change-password.component.ts:77` |

Cada uma foi rastreada do call site ao handler de erro e conferida contra o snapshot **antes** de
declarar. Verificado por mutacao do OpenAPI: remover qualquer um dos status declarados faz o
`contract:check` reprovar com exit 1 (7/7 nas operacoes novas).

## Decisoes da sprint

- **`400` do `verify-totp` usa o `message` do corpo, e nao um literal local.** O
  `MfaController.verify` colapsa **tres causas** no mesmo status ("Codigo invalido, challenge expirado
  ou MFA nao habilitado") e o backend as discrimina apenas pelo `message`
  (`TotpInvalidoException` / `MfaChallengeInvalidoException` / `MfaNaoHabilitadoException`), porque o
  `ErrorResponseDto` **nao serializa** o codigo `MFA-400-00x`. Um literal mandaria quem teve o desafio
  expirado redigitar codigo para sempre, em vez de refazer o login.
- **`429` usa literal local; `423` usa o corpo.** Assimetria deliberada: a janela do rate limit e
  `Duration.ofMinutes(1)` fixa no `RateLimitFilter`, entao "cerca de 1 minuto" nao pode mentir; ja o
  `lockout-minutes` do `423` e sobrescrevivel por ambiente, e fixar 30 na tela mentiria apos override.
- **Nao ha ramo de `401` no `verify-totp`.** O handler nunca o responde
  (`MfaChallengeInvalidoException extends ValidacaoException` -> 400). Um `401` ali so pode vir do
  `JwtAuthenticationFilter` com token expirado, e nesse caminho o `errorInterceptor` ja fez
  `clearSession()` e navegou para `/login` antes de qualquer mensagem ser lida. O Step 122.2.3 pedia
  declarar `401`; seguir o step reprovaria o `contract:check`, contradizendo a propria DoD.
- **`||` e nao `??` na extracao de mensagem do `verify-totp`.** `message` vazia e produzivel — o
  `JwtAuthenticationFilter` usa `response.sendError(...)` e `server.error.include-message` nao esta
  configurado, entao o Spring Boot emite `"message": ""`. Com `??` a string vazia passava e o `@if` do
  template, que a trata como falsy, **nao criava o no `role="alert"`**: tela muda depois do erro.
- **Gap obsoleto bloqueia so contra o snapshot versionado.** Quem roda com `SEP_OPENAPI_SCHEMA`
  aponta para um ambiente mais novo, onde o gap pode ja ter sido fechado sem o snapshot saber; ali o
  aviso sai sem bloquear.
- **A varredura de obsoletos e pulada inteira quando alguma operacao nao resolve.** Nesse estado
  "ninguem consumiu" deixa de ser leitura confiavel, e gap sem `appliesTo` (tipo/enum — **5 dos 8
  reais**) nem da para atribuir a uma operacao. A falha do path ja bloqueia.
- **Os 7 helpers de dominio delegam preservando nome e comentario**, com 0 call sites alterados. Cada
  comentario documenta quais status aquele dominio trata localmente — informacao do call site, que nao
  se generaliza. **Nao fundidos** com `mensagemDeErroDeLogin`/`mensagemDeErroDeTotp`, que fazem switch
  por status e resolvem outro problema.
- **`access-denied` move foco; `redirect-to-app` nao.** O primeiro e destino de redirect automatico
  por dois caminhos (`error.interceptor.ts` no 403 e `role.guard.ts`); o segundo e alcancado por
  `routerLink`, e roubar o foco de quem clicou atrapalha. Ha teste travando os dois lados.
- **A rota `/register` e os 3 links "Criar conta" ficam.** Levam ao `RedirectToAppComponent` por
  decisao da Sprint 5, travados por `landing.component.spec.ts` e pelo e2e `golden-path.spec.ts`. O
  codigo morto era o **componente**, nao a rota nem os links.

## Achados corrigidos apos code review

Um review automatizado por Task, mais o review manual no fim. Dois geraram hotfix.

**F-22.1** (`6f26dc8`) — tres furos que deixavam o check **verde quando deveria reprovar**:

- o gap `field-type-mismatch` era consumido **antes** de a divergencia ser verificada, o que o tornava
  imune a deteccao de obsolescencia: bastava o par tipo+campo ser percorrido para contar como usado,
  mesmo com o backend ja tendo alinhado o tipo (objetivo 3 falhava em 1 dos 4 tipos de gap);
- a chave de status de `responseHeaders` nao era validada — um status errado silenciava tanto a
  verificacao do header quanto a deteccao de obsoleto;
- `consumirGap` usava `findIndex` e marcava so o primeiro match, o que faria um `knownGap` **em uso**
  ser acusado de obsoleto ao estreitar um `appliesTo: "*"` — exatamente o caminho que a Sprint 34 vai
  tomar ao fechar o `X-Step-Up-Token` por partes.

Alem disso, a politica de exit code **nao tinha teste**: tres mutacoes da regra (nunca bloquear,
sempre bloquear, remover o `exit`) deixavam a suite inteira verde, porque `main()` nao era exportado.
Extraida para `decidirCodigoDeSaida`, agora testada.

**F-22.2** (`f2f06f5`) — `message` vazia apagando o alerta; `Validators.required` aceitando so espacos
(o `@NotBlank` do backend reprovava e a tela exibia **`codigo must not be blank`** cru); e a excecao de
`applyMfaVerifyResponse`, que roda no callback `next` — onde o RxJS **nao** a encaminha para o callback
de erro — deixando a tela muda com o desafio ja consumido, num retry impossivel.

## Verificacao

| Gate | Entrada (Gate F-22.0) | Saida |
|---|---|---|
| Vitest | 685 / 88 arquivos | **745 / 91** |
| Playwright | 38 / 11 arquivos | **38** |
| `contract:check` | 85 operacoes, 29 lacunas | **84 operacoes, 29 lacunas** |
| Operacoes com `erros` | 0 | **9** |
| `npm audit --omit=dev` | 0 | **0** |
| format / lint / lint:scss / build | verdes | **verdes** |

84 operacoes (nao 85) porque `auth.registrar` saiu junto com o `RegisterComponent`: o app deixou de
consumir `POST /api/v1/usuarios`.

Baseline de entrada **sem vermelho preexistente** — diferente do `sep-mobile`, cujo
`golden-path-mobile` esta vermelho desde a M-4.

**Verificacao por mutacao** (skill `sep-web-mutation-verified-testing`) em todas as Tasks: 9 mutantes
na F-22.1, 11 na F-22.2, 9 na F-22.3, 9 na F-22.4, 3 na F-22.5, 7 no snapshot na F-22.7. Os 5
mutantes que sobreviveram ao review da F-22.2 morrem apos o hotfix.

## Fora de escopo / follow-ups

**Task F-22.6 nao executada** — bloqueio duplo, verificado em 2026-07-31:

1. a **Sprint 34 nao existe como codigo em lugar nenhum** do `sep-api` (sem branch local ou remota,
   sem stash, sem worktree, working tree limpa, zero ocorrencia de `V60`, `politica-lockout` ou
   `Retry-After`; `origin/develop` segue em `a613c6c`);
2. mesmo apos o merge, exige o `sep-api` **rodando local** (Docker Postgres + `bootRun`) para
   reexportar o snapshot OpenAPI.

A DoD da spec 122 sanciona: *"Se a Sprint 34 nao estiver mergeada: a sprint fecha sem a Task 6,
registrando o motivo."* **Cuidado ao retomar**: `PoliticaLockout` (classe, CamelCase) e da Sprint 33 e
ja esta em `main` (`15f7833`); `politica-lockout` (rota, kebab-case) e da Sprint 34 e nao existe.

**A ordem F-22 antes da 34 foi deliberada**: a deteccao de `knownGap` obsoleto entregue aqui e a
ferramenta que o gate de fechamento da Sprint 34 precisa para limpar as 5 lacunas de OpenAPI sem
fazer no escuro. A dependencia real aponta F-22 -> 34.

**Follow-ups abertos:**

- `message: ""` ainda apaga o alerta em `login.component.ts` (423 e default) e em
  `core/api/api-error.ts`. No helper o `??` foi mantido **de proposito** e travado com teste: trocar
  por `||` mudaria o comportamento dos 56 call sites de uma vez, o que nao e extracao.
- `authInterceptor` isenta apenas `/auth/login`, entao um token expirado viaja para
  `/auth/totp/verify` e derruba o usuario no meio do MFA. Corrigir limpando `SEP_ACCESS_TOKEN` no ramo
  `mfaRequired` de `handleTokenResponse`: um login em andamento nao deveria carregar credencial de
  sessao anterior.
- 3 literais byte-identicos entre `login.component.ts` e `verify-totp.component.ts` (423, 429, 5xx)
  descrevem estado do servidor, nao a acao do usuario, e hoje precisam ser editados em dois arquivos.
  **Nao** extrair a funcao de traducao: os `switch` divergem no que importa.
- `backoffice.reprocessarWebhook` ramifica `400` que o OpenAPI **nao** documenta (handler
  compartilhado com `reprocessarProvider`, que documenta). Declarar reprovaria o check corretamente,
  mas exigiria uma categoria nova de `knownGap`. Ou e lacuna real de OpenAPI (escopo Sprint 34), ou o
  ramo e morto para webhook.
- **~20 pontos de ramificacao por status ainda sem `erros`** (`credora`, `cobranca`, `formalizacao`,
  `admin`, `onboarding`, `credito`). Nao foram inferidos: esses componentes chamam 2-4 services, e
  mapear cada `if (err.status === X)` a operacao certa exige leitura individual. A premissa da spec
  122 ("83 operacoes usam `apiErr?.message ?? padrao`") **nao se confirma** — uma varredura acha ~30
  pontos em 29 componentes.
- A maioria dos ramos de `403` e o precheck de step-up (`err.status === 403 && mfaHabilitado`), que e
  guarda de fluxo e nao mensagem. Vale decidir se a regra do `$comment` deve distinguir os dois casos.
- Playwright segue fora do `CI-APP`: os 38 e2e sao locais/manuais, entao um e2e novo nao e gate de
  merge.
