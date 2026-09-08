# Spec 126 - F-Sprint 26 - Consumir o codigo de erro no web

## Metadados

- **ID da Spec**: 126
- **Titulo**: F-Sprint 26 - Trocar ramificacao por status por ramificacao por codigo no `sep-app`,
  comecando pelo `400` colapsado do `verify-totp`, e gatear o catalogo no `contract:check`
- **Status**: **CONCLUIDA na branch** em 2026-09-08 (`feature/fsprint-26-codigos-erro`, 5 commits;
  push e PR manuais pendentes). Resultado medido no fim deste arquivo
- **Fase do produto**: Fase 4 - produto novo (consome superficie de contrato nova); sem tela,
  endpoint, DTO, migration ou regra nova. **Sem ADR previsto**
- **Trilha**: Web (`sep-app`)
- **Origem**: recomendacao **P1** do [`DIAGNOSTICO-PRODUTO.md`](../../docs-sep/DIAGNOSTICO-PRODUTO.md),
  lado web
- **Depende de**: [`036`](./036-sprint-36-codigos-erro-no-fio.md) **integrada em `develop`** — sem o
  campo `codigo` no fio nao ha o que consumir. Depende tambem da
  [`125`](./125-fsprint-25-aviso-cookies-privacidade-web.md) (F-25) em `develop`, que na criacao desta
  spec estava concluida na branch com push e PR manuais pendentes
- **Dependencia condicional (nova em 2026-09-01)**: a 036 passou a publicar **um subconjunto** da
  taxonomia, nao ela inteira (perimetro; ver 036 §Decisao tecnica principal). Esta sprint depende de
  que os tres codigos que ela consome estejam **dentro** do subconjunto publicado. Conferido em
  2026-09-01: `MFA-400-002/003/004` nao colidem e estao no formato canonico — passam. O Gate F-26.0
  reconfere contra o catalogo que a 036 efetivamente publicou, e nao contra esta afirmacao
- **Revisada em**: 2026-09-01, junto com a [`036`](./036-sprint-36-codigos-erro-no-fio.md)
- **Desbloqueia**: nada diretamente. Reduz a divida de discriminacao por status que a F-22 e a F-24
  mapearam
- **Responsavel principal**: Devs Plenos Web

## Numeracao

Consome o numero **126**, seguindo a sequencia do web em `specs/fase-4/` (a F-25 usou o 125). A Fase 5
nao tem sprint de web ([`PRD-FASE-5.md`](../../docs-sep/PRD-FASE-5.md) §46), entao **este numero nao
provoca recuo nenhum**.

## Objetivo

O web hoje discrimina erro por status HTTP porque e a unica coisa estruturada que chega. A
[`036`](./036-sprint-36-codigos-erro-no-fio.md) poe o codigo no fio; esta sprint faz o web ler.

Nao e varredura. E o primeiro consumo, escolhido onde o ganho e demonstravel e o risco e contido.

## Ancoras verificadas (2026-09-01)

### 1. O que a F-24 JA fechou — e o que ela deixou nomeado

O `STATE.md` e o diagnostico citam "3 literais byte-identicos entre `login` e `verify-totp`". Medido:
**estao fechados**. A F-24 criou
[`features/public/login/copy-de-erro.ts`](../../../sep-app/src/app/features/public/login/copy-de-erro.ts),
e `login.component.ts:9` e `verify-totp.component.ts:8` importam de la.

O docblock desse arquivo (`:6-10`) e o que interessa aqui, porque delimita o que sobrou:

> **Isto extrai a FRASE, nao o RAMO.** [...] quais status caem no corpo da API e quais usam copia
> local difere entre as duas telas de proposito — o `400` do `verify-totp`, por exemplo, precisa do
> corpo, porque o backend colapsa tres causas nesse status e so o `message` as discrimina.

A frase foi deduplicada; **o ramo continua por status**. E o `400` do `verify-totp` e o caso que a
propria F-24 declarou indiscriminavel — com a 036 ele deixa de ser.

### 2. As tres causas do `400` colapsado ja tem codigo

`VerificarTotpUseCase.java` lanca tres excecoes distintas que viram o mesmo `400`:

> **CORRIGIDO em 2026-09-08 pelo smoke real da propria sprint.** A primeira linha da tabela estava
> errada: **codigo em branco NAO produz `MFA-400-002`**. Medido contra `:8080`, ele volta
> `{"message":"codigo não deve estar em branco"}` **sem campo `codigo`** — e bean validation
> (`@NotBlank`) na fronteira do controller, que nunca chega ao `VerificarTotpUseCase:87-88` e cai num
> dos **13 handlers sem taxonomia**. `MFA-400-002` so e alcancavel com challenge **valido** e codigo
> errado. Ordem real de avaliacao: bean validation -> challenge (`004`) -> usuario/secret (`003`) ->
> codigo (`002`). Nao muda a implementacao — `MFA-400-002` e o `400` sem codigo tem o mesmo desfecho,
> e ha teste para os dois —, mas **vale para a [`218`](./218-msprint-18-consumo-codigos-erro-mobile.md)**,
> que consome os mesmos tres codigos.

| Causa | Excecao | Codigo | Linha |
|---|---|---|---|
| Codigo **errado**, com challenge valido | `TotpInvalidoException` | `MFA-400-002` | `:88`, `:117` |
| MFA nao habilitado para o usuario | `MfaNaoHabilitadoException` | `MFA-400-003` | `:98` |
| Challenge invalido ou expirado | `MfaChallengeInvalidoException` | `MFA-400-004` | — |

Hoje as tres chegam ao web como `400` + texto livre. Depois da 036, chegam como `400` + codigo
estavel. **A discriminacao passa a ser estrutural em vez de textual** — que e exatamente o defeito que
a F-22 corrigiu de forma paliativa quando `verify-totp` acusava "codigo invalido" em bloqueio, rate
limit, `5xx` e queda de rede.

### 3. `CONTA_BLOQUEADA_FALLBACK` segue com "30 minutos" fixo

`copy-de-erro.ts:30-31`, e o docblock `:24-28` ja registra como follow-up conhecido, com a observacao
que vale citar: *"centralizado, consertar ficou barato: as duas telas consomem esta constante."*

### 4. `api-error.ts` tem o irmao certo para o novo helper

`core/api/api-error.ts` expoe `mensagemDeErroDaApi` (`:43`) e `mensagemBrutaDaApi` (`:57`). O
docblock `:52-55` explica por que a checagem de `typeof` nao e cerimonia: `err.error` e `unknown` de
fato, e um `message` nao-string faria `.trim()` **lancar** dentro do callback de erro, deixando a tela
carregando para sempre. **O helper novo herda essa exigencia**, pelo mesmo motivo.

### 5. `ApiErrorResponse` esta limpo

`core/api/api.models.ts:84-90` nao tem `codigo`, e `contracts/consumed-contracts.json` nao declara
nada relacionado. (As ocorrencias de `codigo` no contrato sao o campo do TOTP — `TotpConfirmRequest`,
`TotpVerifyRequest`, `StepUpCompleteRequest` — sem relacao com erro.) Sem trabalho parcial a
reconciliar.

## Decisao tecnica principal — codigo escolhe o RAMO, corpo continua escolhendo a FRASE

A tentacao obvia e trocar o texto do backend por um dicionario de copy no front, indexado por codigo.
Esta sprint **nao faz isso**, e a razao esta no `copy-de-erro.ts:6-10`: onde o corpo da API e
autoritativo, ele continua sendo — a F-21 ja decidiu isso para o login, medindo cada afirmacao contra
o `sep-api`.

A regra desta sprint: **o codigo decide qual ramo executar; o `message` continua fornecendo o texto
quando e autoritativo, e o literal local so entra como fallback.** Trocar a origem do texto e P4 do
diagnostico, depende de personas (P2), e nao entra aqui.

Consequencia pratica: um mutante que troque a fonte do texto tem de reprovar tanto quanto um que
troque a fonte do ramo.

## Escopo

### Dentro

1. `codigo?` em `ApiErrorResponse` + snapshot OpenAPI reexportado do runtime da branch da 036.
2. `codigoDeErroDaApi()` em `core/api/api-error.ts`.
3. Catalogo declarado no `consumed-contracts.json` e validado pelo `contract:check`. **Declarar so o
   que a 036 publicou** — declarar codigo que ela deixou fora do perimetro cria lacuna artificial e
   reprova o `contract:check` por motivo errado.
4. `verify-totp` discrimina o `400` colapsado pelos tres codigos `MFA-400-002/003/004`.
5. `CONTA_BLOQUEADA_FALLBACK` deixa de embutir "30 minutos".
6. Mutacao sobre os pontos trocados.

### Fora

- **Os 78 pontos de ramificacao por status** (65 `if`, 10 `case`, 3 entradas de tabela). O `STATE.md`
  ja avisa que varrer o resto exige antes decidir a regra para handlers compartilhados entre
  operacoes. Sprint propria, depois desta provar o padrao em um caso.
- **Os quatro pontos cegos do `contract-check.mjs`** medidos pela F-24 (sem `kind` de gap para status,
  `varrerGapsObsoletos` reprovando gap nao consumido, check unidirecional, e
  `declarado ⊆ documentado` em vez de `declarado = ramificado`). Se a Task 126.3 esbarrar em algum
  deles, ela **para e reporta** em vez de corrigir de passagem — foi assim que a F-22 e a F-24
  acumularam hotfix por furo de check.
- **Dicionario de copy por codigo** no front (ver §Decisao tecnica principal).
- Os 3 literais duplicados: **ja fechados pela F-24**, nao ha o que fazer.

## Criterios de aceite

1. `contract:check` fecha em **0 lacunas**, e o numero de operacoes so muda se a 036 tiver mudado o
   contrato — qualquer outra variacao e regressao. (Ultimo registro: 85 operacoes / 0 lacunas.)
2. Vitest e Playwright **>= baseline medida no Gate F-26.0**, 0 falhas. Ultimo registro na branch da
   F-25: 833/97 e 42/12; em `develop` sem a F-25: 802/94 e 39.
3. `lint`, `lint:scss`, `format:check`, `build` e `audit` verdes. O `audit` e criterio, nao
   observacao: o Gate F-25.0 achou o gate do CI **vermelho em `develop` sem ninguem saber**.
4. **Mutacao obrigatoria** em cada ponto trocado. No minimo: trocar a ramificacao por codigo de volta
   para status tem de reprovar; e trocar a origem do texto (corpo -> literal) tem de reprovar
   separadamente, provando que ramo e frase sao independentes.
5. Teste provando que corpo **sem** `codigo` continua funcionando — o campo e opcional e o web nao
   pode quebrar contra backend antigo. Este e o teste que a Task 126.2 existe para sustentar.
6. Teste provando que `codigo` nao-string (proxy que devolve JSON com numero) **nao lanca** — mesma
   guarda que `mensagemBrutaDaApi` ja tem, pelo mesmo motivo documentado em `api-error.ts:52-55`.

## Riscos e limitacoes

- **Bloqueada por dois merges manuais**: a 036 e a F-25. O Gate F-26.0 confere as duas por **conteudo**,
  nao por hash — foi conferindo por conteudo que o Gate F-25.0 descobriu que o registro da F-24 estava
  defasado por 15 dias.
- **O mock MSW precisa emitir `codigo`**, senao a ramificacao nova e inobservavel offline. A F-23
  registrou o precedente exato: no mock o `Retry-After` coincidia byte a byte com a `message`, e por
  isso "o header ganha do corpo" era inobservavel. Repetir o padrao aqui produziria teste que passa
  provando nada.
- **Smoke real contra `:8080` continua sendo gate declarado pendente**, como nas F-21/F-23/F-24. O MSW
  nao prova CORS nem o comportamento do backend real; se o smoke nao rodar, declarar, nao simular.
- A Task 126.4 muda a copy que o usuario ve em tres desfechos de MFA. Se as personas (P2) ainda nao
  existirem, o vocabulario sai do que ja esta no `sep-api` — nao inventar termo novo aqui.

## Rastreabilidade

| Item da spec | Task |
|---|---|
| `codigo?` em `ApiErrorResponse` + snapshot | 126.1 |
| `codigoDeErroDaApi()` em `api-error.ts` | 126.2 |
| Catalogo no `consumed-contracts.json` + `contract:check` | 126.3 |
| `400` colapsado do `verify-totp` discriminado por codigo | 126.4 |
| `CONTA_BLOQUEADA_FALLBACK` sem "30 minutos" fixo | 126.5 |
| Mutacao dos pontos trocados | 126.6 |
| Baseline, mock MSW, gates declarados | Gate F-26.0 e Fechamento |

Fecha, ao lado da [`036`](./036-sprint-36-codigos-erro-no-fio.md) e da
[`218`](./218-msprint-18-consumo-codigos-erro-mobile.md), a recomendacao **P1** do
[`DIAGNOSTICO-PRODUTO.md`](../../docs-sep/DIAGNOSTICO-PRODUTO.md).

Steps em [`steps-fase-4/web/126-fsprint-26-steps.md`](../../steps-fase-4/web/126-fsprint-26-steps.md),
criados em 2026-09-08.

## Resultado medido (2026-09-08)

**Entregue**: 126.1, 126.2, 126.4, 126.5 e 126.6. **126.3 NAO executada** — ver abaixo.
Vitest **833 -> 855 / 97**, Playwright **42**, `contract:check` **85 operacoes / 0 lacunas**, `lint`,
`lint:scss`, `format:check`, `build` e `audit` verdes. **14 mutacoes distintas, 12 mortas.**

### O que a medicao derrubou desta spec

1. **§Ancora 2, primeira linha** — codigo em branco nao produz `MFA-400-002`. Ver o bloco corrigido
   acima; achado pelo smoke real, nao por leitura.
2. **§Escopo item 3 (catalogo no `contract:check`) e inexequivel hoje.** Dois bloqueios provados no
   `scripts/contract-check.mjs`: `verificarCorpoDaResposta` (`:206-217`) itera **so
   `operacao.sucesso`**, e nao ha chave de operacao que ligue um `$type` a resposta de erro (`erros`
   e lista de status conferida por existencia, `:168-175`); e `verificarEnum` (`:347-352`) exige
   **igualdade de conjunto**, nao pertinencia — sonda declarando 2 dos 4 valores de `role` reprovou
   em 4 operacoes, enquanto o Step 126.3.1 manda declarar **so os tres MFA**. Sao o **quinto e o
   sexto pontos cegos** do check, alem dos quatro que a §Fora ja listava. Decisao do responsavel pelo
   repo: pular a Task. **O catalogo fica sem gate automatico**, declarado.
3. **O criterio de aceite 4 nao se aplica a 126.1.** As tres mutacoes previstas ali sobrevivem porque
   nao ha leitor ainda; duas passam a morrer na 126.2, e a terceira depende da 126.3.
4. **Fixture tipado nao gateia nada neste repo.** `tsconfig.app.json` exclui `src/**/*.spec.ts` e nao
   ha `tsc --noEmit` em script nem no CI — sonda com erro de tipo deliberado num spec passou por
   `vitest`, `lint` e `build`. Quem mata mutacao de tipo e **leitor de producao** mais `npm run
   build`. `tsc -p tsconfig.spec.json --noEmit` acusa **11 erros preexistentes**.

### Desvios declarados

- **Mapa de ramo 3 -> 2**: `MFA-400-003` e `MFA-400-004` compartilham desfecho porque a proxima acao
  do usuario e identica (voltar ao login). Os tres desfechos **observaveis** seguem distintos, ja que
  a frase vem do corpo. Inventar um terceiro ramo seria copy sem verdade por tras.
- **Cenarios no spec via `server.use`**, nao em `mocks/handlers.ts`, que documenta em `:82-84` por que
  nao tem rotas de `/auth/totp/*`. O dev-offline segue sem a jornada de MFA, como ja era.
- **Baseline exigiu PR proprio** (#143): `format:check` e `npm audit` estavam vermelhos em `develop`.

Descricao completa em [`SPRINT-F-26-PR.md`](../../repos/sep-app/SPRINT-F-26-PR.md).
