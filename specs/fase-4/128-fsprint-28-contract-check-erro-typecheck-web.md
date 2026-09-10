# Spec 128 - F-Sprint 28 - Gatear o corpo de erro no `contract:check` e por os specs sob typecheck

## Metadados

- **ID da Spec**: 128
- **Titulo**: F-Sprint 28 - Fechar os dois pontos cegos do `contract-check.mjs` que impedem gatear o
  catalogo de codigos de erro, executar a Task 126.3 que a F-26 deixou pendente, e instalar o
  typecheck dos specs como gate de CI
- **Status**: **MERGEADA develop+main** em 2026-09-10 (PR #151 squash `15ed341`, #152 `49f568a`;
  conferido por conteudo). Resultado medido no fim deste arquivo
- **Fase do produto**: Fase 4 - divida de tooling e de contrato; sem tela, endpoint, DTO, migration
  ou regra nova. **Sem ADR previsto**
- **Trilha**: Web (`sep-app`)
- **Origem**: [`STATE.md`](../../docs-sep/STATE.md) §Proximo passo itens 2 e 3; follow-ups **(m)** e
  **(n)** abertos pela F-26; [`126`](./126-fsprint-26-consumo-codigos-erro-web.md) §Resultado medido,
  itens 2 e 4
- **Depende de**: PR da branch `feature/fix-duplicatas-login-spec` do `sep-app` (commits `d509c1a` e
  `4da0504`, 2026-09-10) **integrado em `develop`**. Sem ele o `npm audit` de `develop` sai 1
  (`js-yaml` 4.3.1, high) e a baseline do Gate nao fecha. Nada do backend
- **Desbloqueia**: gate automatico do catalogo de codigos de erro no web. A
  [`127`](./127-fsprint-27-central-notificacao-web.md) passa a nascer com specs typechecados
- **Responsavel principal**: Devs Plenos Web

## Numeracao

Consome o numero **128** (F-Sprint 28). A [`127`](./127-fsprint-27-central-notificacao-web.md) ja
reservou o 127 e ainda nao executou. A faixa da Fase 4 no web vai ate F-49, e a Fase 5 nao tem sprint
de web, entao **nao provoca recuo nenhum**.

## Objetivo

Dois gates que o repo acredita ter e nao tem:

1. **O catalogo de codigos de erro nao tem gate.** Se o backend deixar de publicar `MFA-400-003` ou
   `MFA-400-004`, nada no CI do web reprova. O efeito para o usuario e concreto: o `verify-totp`
   perde o desfecho terminal e volta a oferecer o formulario para um desafio que nunca aceitara — o
   defeito que a F-26 existiu para fechar, reaberto em silencio.
2. **Specs nao passam por typecheck.** Uma sonda com erro de tipo deliberado num spec passou por
   `vitest`, `lint` e `build` na F-26. Fixture tipado nao gateia nada, e 11 erros de tipo ja vivem
   nos specs sem ninguem saber.

O usuario desta sprint e quem mantem o `sep-app` e o `sep-api`: o valor e o CI reprovar antes do
merge o que hoje so apareceria em producao.

## Ancoras verificadas (2026-09-10)

Medidas em `develop` `11bd729` do `sep-app`, com `npm ci` recem-rodado.

### 1. O corpo de erro nao e verificado, e o snapshot ja suporta a verificacao

`scripts/contract-check.mjs:206-216` (`verificarCorpoDaResposta`) itera **so `operacao.sucesso`**.
O campo `erros` (`:165-174`) e lista de status conferida por existencia; nao ha chave que ligue um
`$type` a uma resposta de erro.

O snapshot versionado ja tem o que a verificacao precisa:

- **304** respostas `4xx`/`5xx` com schema JSON, **37** sem;
- `POST /api/v1/auth/totp/verify` `400` aponta para `#/components/schemas/ErrorResponseDto`;
- `ErrorResponseDto.codigo` e enum **inline** com **80** valores; `MFA-400-002`, `MFA-400-003` e
  `MFA-400-004` publicados; `CRD-403-001` (excluido por colisao, `CODIGOS-DE-ERRO.md:159`) fora.

### 2. O enum exige igualdade de conjunto, e isso e proposital

`verificarEnum` (`:313-329`) ordena e compara os dois conjuntos. O teste
`contract-check.spec.ts:139` (`'falha quando o enum diverge em qualquer direcao'`) trava essa
semantica, e ela protege **70 campos enum** em 90 tipos do descriptor: o web tipa esses campos como
union fechada, entao valor novo no backend e divergencia real.

Para o catalogo de erro a semantica certa e outra — **pertinencia**: o web ramifica em poucos codigos
e precisa tolerar os outros 78. Trocar a semantica de `enum` afrouxaria os 70 campos em silencio.

### 3. O web ramifica em DOIS codigos, nao em tres

`verify-totp.component.ts:75`:
`const CODIGOS_DE_DESFECHO_TERMINAL = new Set(['MFA-400-003', 'MFA-400-004']);`

`MFA-400-002` **nao** e ramificado: cai no caminho legado de proposito, porque ali o desafio segue
vivo (`VerificarTotpUseCase` chama `challengeService.devolver(...)`). O Step 126.3.1 mandava declarar
"os tres MFA"; declarar o terceiro seria exatamente o ponto cego (iv) — declarado sem ramo. **Esta
spec declara os dois.**

Nenhum outro arquivo de producao le `codigo`: `grep` por `codigoDeErroDaApi` fora de spec devolve so
`api-error.ts:80` (definicao) e `verify-totp.component.ts`.

### 4. "Obrigatorio de um lado so" nao e verificavel, por nenhum gate

A mutacao 4 do Step 126.3.2 pedia que tornar `codigo` obrigatorio de um lado reprovasse. Medido, nao
ha mecanismo que a mate:

- `ErrorResponseDto` nao tem `required` no snapshot (so **32 de 152** schemas publicam `required`; o
  `contracts/README.md` ja registra que o springdoc nao publica obrigatoriedade de response);
- o descriptor nao tem nocao de campo opcional (`fields` so carrega tipo);
- nada no repo **constroi** um `ApiErrorResponse`: os tres leitores fazem cast com `?.`
  (`api-error.ts:58`, `api-error.ts:81`, `support-reference.ts:36-40`) e nenhum spec tipa o objeto,
  entao nem o typecheck desta sprint o pega.

Declarado como limite com causa medida, nao simulado.

### 5. Specs nao sao typechecados: 11 erros em 6 arquivos, 4 familias

`tsconfig.app.json:9-10` exclui `src/**/*.spec.ts`; `package.json` nao tem script de typecheck; o
job `test` do `ci.yml` (`:51-70`) roda format, audit, contract, lint, lint:scss e coverage, sem
`tsc`. `npx tsc -p tsconfig.spec.json --noEmit` sai **2**:

| Familia | Erros | Arquivos | Causa |
|---|---|---|---|
| `TS2345` | 6 | `dashboard.component.spec.ts:51,114`, `change-password.component.spec.ts:67,88`, `profile.component.spec.ts:41,54` | helper local `logarAdmin(result)` tipa o parametro mais estreito que `RenderResult` |
| `TS2339` | 2 | `error.interceptor.spec.ts:277,303` | variavel atribuida dentro de callback; o controle de fluxo a estreita para `never` |
| `TS2314` | 2 | `chaves-pix-page.component.spec.ts:116,134` | `HttpResponse` do MSW sem o argumento generico |
| `TS2322` | 1 | `credora-presence.guard.spec.ts:26` | `GuardResult` resolvido por dois caminhos de declaracao do `@angular/router` |

Os 11 sao exatamente os que o `STATE.md` registrou na F-26 — nenhum novo desde entao.

### 6. Os quatro pontos cegos da F-24, remedidos

| # | Ponto | Estado em 2026-09-10 |
|---|---|---|
| (i) | Sem `kind` de gap para status de erro | Confirmado: `consumirGap` conhece 4 `kind`, nenhum de status. **0 `knownGaps`** hoje |
| (ii) | `varrerGapsObsoletos` reprova gap nao consumido | Defesa **proposital** da F-22 (`:404-414`), com 11 testes. O custo e nao registrar gap prospectivo |
| (iii) | Check unidirecional | Confirmado. Status/campo novo no OpenAPI que o web nao trata nao e acusado; so o `required` de request body e |
| (iv) | `declarado ⊆ documentado`, nunca `= ramificado` | O mecanismo segue; **o exemplo registrado nao reproduz mais** — `backoffice.assumir` declara so `[409]` |

## Decisao tecnica principal — opt-in, nunca afrouxar

### Pertinencia entra como chave nova, nao como semantica nova de `enum`

O descriptor ganha `{ "enumSubset": [...] }`: todo valor declarado precisa pertencer ao enum
documentado; o documentado pode ter mais. `{ "enum": [...] }` continua exigindo igualdade.

A alternativa — relaxar `enum` para pertinencia — e mais curta e errada: afrouxa os 70 campos de
uniao fechada sem que nenhum teste de tela perceba, e o teste `:139` teria de ser reescrito para
aceitar o que ele existe para recusar.

### Corpo de erro por status, com o mesmo formato do `responseHeaders`

A operacao ganha `errorResponses`, mapa por status (`{ "400": { "$type": "ApiErrorResponse" } }`),
espelho de `responseHeaders` desde a F-22. Duas regras de consistencia:

1. **Todo status em `errorResponses` precisa estar em `erros`.** Declarar corpo para um status que a
   tela nao ramifica contradiz a regra do campo `erros` (F-22) e e o ponto cego (iv) por outra porta.
2. **O status precisa ter schema JSON no OpenAPI.** Sem schema, falha — nao pula.

A verificacao do corpo reusa `verificarExpectativa`, entao campo ausente, tipo divergente e enum
passam a valer para erro do mesmo jeito que ja valem para sucesso.

### Declarar o que o web ramifica — nem o catalogo inteiro, nem o terceiro MFA

`ApiErrorResponse` entra no descriptor com os campos que o `verify-totp` le no `400`: `message`
(via `mensagemBrutaDaApi`) e `codigo` com `enumSubset` de **dois** valores (§Ancora 3). Copiar os 80
seria manutencao sem assercao; declarar o `MFA-400-002` seria declarado sem ramo.

### Typecheck: corrigir antes de gatear, e sem tocar producao

Os 11 erros sao corrigidos **antes** do gate existir, com contagem de testes do Vitest identica antes
e depois — a correcao e de tipo, nao de comportamento. O gate entra como script `typecheck:spec`
(`tsc -p tsconfig.spec.json --noEmit`) e como passo no job `test` do CI. **Nao** incluir specs no
`tsconfig.app.json`: levaria tipos de teste para o build de producao.

### Os pontos (i) a (iv) ficam fora, cada um com motivo

(ii) e defesa, nao defeito. (i), (iii) e (iv) nao tem cenario que os exija hoje — zero `knownGaps`,
e (iv) exigiria analise estatica do TypeScript para cruzar declaracao com ramo. Regra de tres: nenhum
chegou a um cenario, entao nenhum se constroi.

## Escopo

### Dentro

1. Corrigir os 11 erros de tipo dos specs, so em arquivos de spec.
2. Script `typecheck:spec` e passo no CI, com prova de que o gate morde.
3. `enumSubset` no `contract-check.mjs`, com testes.
4. `errorResponses` no `contract-check.mjs`, com testes.
5. **Task 126.3 executada**: `ApiErrorResponse` e `mfa.totpVerify.errorResponses["400"]` no
   descriptor, com as mutacoes do Step 126.3.2.
6. `contracts/README.md` e `$comment` do descriptor atualizados para as duas chaves novas e para as
   afirmacoes que a sprint torna falsas.

### Fora

- **Pontos cegos (i) a (iv)** (§Decisao tecnica principal).
- **Declarar outros codigos ou outras operacoes.** So o `verify-totp` ramifica por codigo hoje.
- **Regra `vitest/no-identical-title`** (`@vitest/eslint-plugin`), sugerida pelo review do
  `d509c1a`: devDependency nova, decisao propria. Follow-up.
- **Portar o `contract:check` para o `sep-mobile`** (follow-up **(q)** da M-18).
- **Publicar `required`/`nullable` nos responses** — e mudanca de backend (springdoc), fora do web.

## Criterios de aceite

1. `contract:check` fecha com **85 operacoes / 0 lacunas**. Nenhuma operacao nova entra; o numero so
   muda se o snapshot mudar, e esta sprint nao renova o snapshot.
2. Vitest **>= baseline medida no Gate F-28.0**, 0 falhas; Playwright **>= baseline**, 0 falhas.
3. `lint`, `lint:scss`, `format:check`, `build`, `audit` e **`typecheck:spec`** com exit 0.
4. **Na Task 128.1 a contagem do Vitest e identica antes e depois**, e nenhum arquivo fora de
   `**/*.spec.ts` muda. Se algum erro exigir mudanca de producao, a Task **para e reporta**.
5. **O gate de typecheck morde**: sonda com erro de tipo deliberado num spec faz `typecheck:spec` sair
   diferente de zero; revertida, sai zero.
6. **Mutacao no checker**: `enumSubset` sempre verdadeiro reprova; `enum` aceitando subconjunto
   reprova (teste `:139`); `errorResponses` nao iterado reprova; checagem de pertinencia a `erros`
   removida reprova; status sem schema aceito reprova.
7. **Mutacoes da Task 126.3**, aplicadas numa **copia temporaria** do snapshot via
   `SEP_OPENAPI_SCHEMA`, nunca no arquivo versionado: remover `codigo` do `ErrorResponseDto` sai 1;
   retirar `MFA-400-004` do enum sai 1; declarar `CRD-403-001` no `enumSubset` sai 1. A quarta
   ("obrigatorio de um lado so") fica registrada como **nao verificavel**, com a causa da §Ancora 4.

## Riscos e limitacoes

- **Bloqueada por um merge manual**: o PR do fix de 2026-09-10. O Gate F-28.0 confere por
  **conteudo** — `js-yaml` 4.3.2 no lock de `origin/develop` —, nao por hash.
- **Corrigir tipo pode revelar teste que prova nada.** O `TS2339` por `never` e o sintoma classico de
  variavel que o compilador acha que nunca e atribuida; se a correcao mostrar que a assercao nao
  roda, e achado, nao ruido — reportar antes de seguir.
- **O `TS2322` pode ser de ambiente, nao de codigo.** Dois caminhos de declaracao do `GuardResult`
  sugerem copia aninhada no `node_modules`. Medir antes de mexer no spec.
- **Mutacao contra fonte externa muda uma regra do check**: com `SEP_OPENAPI_SCHEMA`, gap obsoleto
  nao bloqueia. Hoje ha 0 gaps, entao nao afeta — mas o registro precisa dizer que a prova foi contra
  copia e por que.
- **O `lint-staged` reescreve arquivos no commit.** Gates re-rodados depois de cada commit, nao antes.
- **Custo de CI**: `tsc` no job `test` acrescenta tempo. Medir e registrar no fechamento.

## Rastreabilidade

| Item da spec | Task |
|---|---|
| Corrigir os 11 erros de tipo dos specs | 128.1 |
| Gate `typecheck:spec` no script e no CI, provado que morde | 128.2 |
| `enumSubset` (pertinencia opt-in) | 128.3 |
| `errorResponses` (corpo de erro por status) | 128.4 |
| Task 126.3: catalogo consumido declarado e gateado | 128.5 |
| README do contrato, `$comment`, regressao final | 128.6 |
| Baseline, conferencia do fix por conteudo, ancoras | Gate F-28.0 e Fechamento |

Fecha os follow-ups **(m)** e **(n)** da F-26 e o item 3 da §Resultado medido da
[`126`](./126-fsprint-26-consumo-codigos-erro-web.md).

Steps em [`steps-fase-4/web/128-fsprint-28-steps.md`](../../steps-fase-4/web/128-fsprint-28-steps.md),
criados em 2026-09-10.

## Resultado medido (2026-09-10)

**Entregue**: 128.1 a 128.6, mais quatro hotfixes. Branch `feature/fsprint-28-contract-check-typecheck`
de `develop` `4baf7b1`, **10 commits, 13 arquivos, +374/−30**. Vitest **855/97 -> 875/97**,
Playwright **42**, `contract:check` **85 operacoes / 0 lacunas**, `typecheck:spec` novo e verde
(~5,4s), `lint`, `lint:scss`, `format:check`, `build` e `audit` verdes (0 high, 4 moderate).
**24 mutacoes mortas, 2 sobreviventes esperados** — os dois de "obrigatorio de um lado so".

### O que a medicao derrubou desta spec

1. **§Riscos, "o `TS2322` pode ser de ambiente"** — nao era. A mensagem completa diz
   `RedirectCommand is not assignable to GuardResult`: o spec declarava um alias local
   `boolean | UrlTree`, mais estreito que o tipo do router. Nenhuma copia aninhada no `node_modules`.
2. **§Objetivo, item 1, e a leitura natural do criterio 7** — o gate do catalogo **nao** reprova no
   instante em que o backend deixa de publicar um codigo. O CI roda contra o snapshot versionado; o
   gate morde **na renovacao do snapshot** (ou com `SEP_OPENAPI_SCHEMA` contra o runtime). E uma
   garantia real, e mais estreita que a anunciada. Registrada no `contracts/README.md`.
3. **§Escopo/Dentro** — a sprint cresceu por quatro hotfixes, todos vindos do review e todos fechando
   caminho de gate silencioso: specs do Playwright fora de qualquer tsconfig (`23e45e6`); chave
   desconhecida no descriptor ignorada (`82396eb`); `null` em `errorResponses` lancando `TypeError`
   (`a42ac85`); e a declaracao do catalogo apagavel com o CI verde (`c91bda1`).
4. **§Ancora 4 confirmada por execucao, nao so por leitura**: `required: ["codigo"]` no OpenAPI e
   `codigo` obrigatorio no `ApiErrorResponse` do TS sobrevivem a `contract:check`, `typecheck:spec` e
   `build`.

### Desvios declarados

- **Controle acrescentado a Task 128.5**: sem a declaracao, retirar `MFA-400-004` do snapshot sai
  exit 0 — o estado pre-sprint, medido na mesma sonda que prova o gate.
- **README do contrato**: o bullet de `required` foi reescrito (dizia "`required: []` em todos"; sao
  32 de 152), porque a limitacao medida pela sprint mora nele. O bullet do `X-Step-Up-Token`, tambem
  desatualizado, ficou **listado e nao corrigido**, por decisao do responsavel pelo repo.

Descricao completa em [`SPRINT-F-28-PR.md`](../../repos/sep-app/SPRINT-F-28-PR.md).
