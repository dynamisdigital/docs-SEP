# F-Sprint 26 — Consumir o codigo de erro no web

Spec [`126`](../../specs/fase-4/126-fsprint-26-consumo-codigos-erro-web.md) ·
steps [`126`](../../steps-fase-4/web/126-fsprint-26-steps.md) · repo `sep-app` ·
branch `feature/fsprint-26-codigos-erro` a partir de `develop` `53cc6f6`.

Lado web da recomendacao **P1** do [`DIAGNOSTICO-PRODUTO.md`](../../docs-sep/DIAGNOSTICO-PRODUTO.md).
Consome o campo `codigo` que a **Sprint 36** do `sep-api` publicou. Sem tela, endpoint, DTO,
migration, regra de negocio ou ADR novo.

## Resumo

Ate aqui o `400` do `verify-totp` era um so desfecho: erro inline com o formulario de pe. As tres
causas que o backend colapsa nesse status chegavam distinguiveis apenas pelo texto. Quem caia em
**desafio expirado** ou **conta sem TOTP ativo** redigitava codigo contra algo que nunca aceitaria —
o formulario era armadilha.

A regra da sprint: **o codigo escolhe o RAMO, o corpo continua escolhendo a FRASE.**

| Codigo | Condicao no `sep-api` | Desfecho |
|---|---|---|
| `MFA-400-002` | `TotpInvalidoException` — challenge **vivo** | erro inline, formulario de pe, CTA liberado |
| `MFA-400-003` | `MfaNaoHabilitadoException` — conta sem TOTP ativo | bloco terminal, formulario some, link de login |
| `MFA-400-004` | `MfaChallengeInvalidoException` — challenge morto | bloco terminal, formulario some, link de login |
| ausente / desconhecido | pre-36, fora do perimetro, ou Sprint 37 | tratamento legado por status |

## Commits

| Commit | Task | O que |
|---|---|---|
| `2ea65d8` | 126.1 | `codigo?: string` em `ApiErrorResponse` + snapshot OpenAPI do runtime |
| `d3c03a8` | review | tira contagem perecivel do docblock (hotfix do review da 126.1) |
| `c2a69d1` | 126.2 | `codigoDeErroDaApi()` em `core/api/api-error.ts` |
| `04c1534` | 126.4 | discriminacao do `400` do `verify-totp` |
| `41b9c34` | 126.5 | `CONTA_BLOQUEADA_FALLBACK` sem duracao fixa |

10 arquivos, **+969 / −458**. Descontado o snapshot: 8 arquivos, **+429 / −22**.

## Test plan

| Gate | Baseline | Final |
|---|---|---|
| `npm test -- --run` | 833 / 97 | **855 / 97** |
| `npm run e2e` | 42 | **42** |
| `npm run contract:check` | 85 operacoes / 0 lacunas | **85 / 0** |
| `npm run lint` / `lint:scss` / `format:check` / `build` | verdes | **verdes** |
| `npm run audit` | 0 | **0** |

Todos rodados **depois** dos commits e apos `npm ci` limpo, porque o `lint-staged` reescreve arquivos
no commit. Exit codes capturados diretamente, sem pipe.

## Contrato

Snapshot renovado do runtime de `sep-api` `develop@a774aa4`, pelo comando que o
`openapi.snapshot.meta.json` documenta (`jq -S` + `prettier` — sem o prettier a regeneracao produz
~1372 linhas de diff espurio). **Nada editado a mao.**

O diff tem **duas naturezas**, separadas no `estatisticasObs` do meta:

- **Funcional (Sprint 36)**: `ErrorResponseDto.codigo` com enum de 80 valores, `+1 description`,
  `+1 example`, **zero schemas novos** — ~87 linhas.
- **Fidelidade acumulada (Sprint 35)**: **43 schemas** de enum nomeados (`Role`,
  `StatusPixTransferencia`, `TipoChavePix`, …) que o `enumsAsRef` passou a emitir e o snapshot nao
  via desde 2026-08-03 — ~399 linhas, mais 31 `description`. Enums inline **88 → 45**, `$ref`
  **465 → 552**.

**Zero schemas perdidos**, `securitySchemes` intacto, 3.1.0 preservado, **operacoes 106 e paths 98
inalterados** — o criterio de aceite 1 da spec exige que a contagem so mude se a 36 tivesse mudado o
contrato, e ela nao mudou.

## Campanha de mutacao — 14 distintas, 12 mortas, 2 sobreviventes declaradas

| Mutacao | Gate que matou |
|---|---|
| remover o campo `codigo` do tipo | `build` |
| `codigo?: number` | `build` (`api-error.ts:82`) |
| remover a guarda de `typeof` no helper | 4 casos da matriz |
| aceitar string vazia | 2 casos |
| acesso sem validar o corpo (`?.` → direto) | 2 casos |
| remover o `.trim()` | 2 casos |
| `verify-totp` volta a decidir so por status | 3 casos |
| trocar dois codigos entre ramos | 2 casos |
| frase de literal em vez do corpo | 6 casos |
| tratar codigo ausente como terminal | 3 casos |
| remover a guarda `status !== 400` | 1 caso |
| restaurar `"30 minutos"` | 3 casos, nos **dois** consumidores |

Cada mutacao imprimiu prova de que entrou no arquivo (`assert count == 1` na ancora + `git diff
--numstat`) antes de rodar o gate. A campanha final roda com `trap` de restauracao, para que
interrupcao nao deixe fonte mutada na arvore.

### Os dois sobreviventes, com causa medida

1. **Tornar `codigo` obrigatorio** — nada em `src/main` **constroi** um `ApiErrorResponse` (os tres
   leitores usam `?.` ou `Partial<>`), specs **nao sao typechecados** (`tsconfig.app.json` exclui
   `src/**/*.spec.ts` e nao ha `tsc --noEmit` em script nem no CI — provado por sonda: erro de tipo
   deliberado num spec passa por `vitest`, `lint` e `build`), e o `contract:check` nao valida corpo de
   erro. Em runtime tipos sao apagados, entao **nenhum teste de comportamento pode mata-lo**.
   Matar exige gate de typecheck; `tsc -p tsconfig.spec.json --noEmit` sai **2** hoje com **11 erros
   preexistentes** alheios a esta sprint.
2. **Retirar `codigo` do snapshot** — depende da Task 126.3, bloqueada (abaixo).

Nenhum dos dois foi contornado com teste que finge cobertura.

## Task 126.3 NAO executada — bloqueio estrutural medido

O Step 126.3.2 manda parar e reportar se o algoritmo do `contract-check.mjs` nao expressar a
verificacao. **Dois bloqueios, ambos provados:**

1. **Nao ha onde declarar corpo de erro.** `verificarCorpoDaResposta` (`scripts/contract-check.mjs:206-217`)
   itera **so `operacao.sucesso`**. As chaves aceitas numa operacao — `id, method, path, sucesso,
   erros, responseHeaders, request, response, headers, formParams, query, pageable` — nao ligam
   `$type` a resposta de erro; `erros` e so lista de status conferida por existencia (`:168-175`).
2. **`verificarEnum` exige igualdade de conjunto, nao pertinencia** (`:347-352`). Sonda: declarado
   `role` com 2 dos 4 valores publicados → `contract:check` **exit 1**, `enum divergente`, em 4
   operacoes. O Step 126.3.1 manda declarar **os tres MFA** e diz textualmente *"nao copiar todo o
   enum publicado"* — com a semantica atual isso reprova.

**Sao o quinto e o sexto pontos cegos**, alem dos quatro que a F-24 mapeou. O contorno de declarar
`400` em `sucesso` para roubar o `verificarCorpoDaResposta` foi rejeitado: corromperia a semantica
documentada no `$comment` do proprio contrato. Decisao do responsavel pelo repo: pular a Task,
registrar, e tratar os seis pontos cegos numa sprint dedicada.

**Consequencia declarada**: o catalogo de codigos fica **sem gate automatico** nesta sprint. Se o
backend deixar de publicar `MFA-400-003` ou `004`, nada no CI do web reprova — so os testes de
componente, que usam fixture proprio.

## Smoke real contra `:8080` — executado

Gate declarado pendente desde a F-21; feita a metade que nao exige browser. `sep-api` em perfil `dev`,
revisao `develop@a774aa4`:

```
POST /api/v1/auth/totp/verify  {"mfaChallengeId":"3f2504e0-…","codigo":"123456"}
→ 400 {"message":"Desafio MFA invalido ou expirado. Refaca o login.",
       "traceId":"2a93563b-…","codigo":"MFA-400-004"}
```

O `codigo` **sai no fio**, e a mensagem bate byte a byte com o fixture do spec.

**Ainda pendente, declarado e nao simulado**: os desfechos de UI dos tres codigos exigem browser
contra backend real, e `MFA-400-003`/`002` exigem semear usuario com MFA e challenge vivo.

## Desvios da spec e dos steps, medidos

1. **A §Ancora 2 da spec esta errada.** Ela diz que *"codigo ausente/em branco"* produz
   `TotpInvalidoException` → `MFA-400-002`. Medido no smoke, codigo em branco devolve
   `{"message":"codigo não deve estar em branco"}` **sem `codigo`**: e bean validation (`@NotBlank`) na
   fronteira do controller, que nunca chega ao `VerificarTotpUseCase:87-88` e cai num dos **13
   handlers sem taxonomia**. `MFA-400-002` so e alcancavel com challenge **valido** e codigo errado.
   Ordem real medida: bean validation → challenge (`004`) → usuario/secret (`003`) → codigo (`002`).
   **Nao muda a implementacao** — `MFA-400-002` e o `400` sem codigo produzem o mesmo desfecho, e ha
   teste para os dois —, mas **vale para a M-18**, que consome os mesmos tres codigos.
2. **Cenarios no spec, nao em `mocks/handlers.ts`.** O proprio arquivo documenta em `:82-84` por que
   nao tem rotas de `/auth/totp/*`: adicionar uma la mudaria o comportamento de specs distantes.
   Consequencia declarada: no **dev-offline o `verify-totp` segue inalcancavel**, como ja era antes
   desta sprint.
3. **Mapa de ramo 3 → 2.** A definicao de pronto pede tres desfechos distintos; os tres desfechos
   *observaveis* sao distintos (002 inline + frase A; 003 terminal + frase B; 004 terminal + frase C),
   mas `003` e `004` compartilham o ramo porque a proxima acao do usuario e identica: voltar ao login.
   Inventar um terceiro ramo seria copy sem verdade por tras. Efeito: a mutacao "trocar dois codigos"
   mata para qualquer par que envolva `002`; o par `003`↔`004` seria **equivalente**.
4. **As tres mutacoes prescritas para a 126.1 sobrevivem naquela Task**, porque nao ha leitor ainda.
   Duas passam a morrer na 126.2, quando o helper de producao consome o campo.

## Baseline: dois gates vermelhos corrigidos antes de abrir a sprint

O Gate F-26.0 achou `develop` reprovando **dois** gates, e o Step 126.0.3 proibe absorve-los. Foram
para PR proprio (**#143**, `53cc6f6`), fora desta branch:

- **`format:check` vermelho desde 2026-08-26**, portanto **CI-APP reprovando**, por causa dos tres
  commits diretos sem PR: expandiram 6 union types contra o `printWidth: 100`. A correcao devolve o
  arquivo **byte-identico ao de `origin/main`**.
- **`npm audit` vermelho** — `fast-uri` (**high**, 4 CVEs de SSRF/host confusion) e `qs` (moderate).
  Divida **nova**, nao a residual registrada. **Quarta vez** que o audit do `sep-app` volta de zero
  (F-19, D-1, F-25, agora).
- Removida a linha `**/.vscode/` do bloco da automacao, que sobrescrevia as negacoes do `.gitignore`
  e passava a casar com tres arquivos versionados.

## Divida que a sprint EXPOE e nao corrige

- **Os seis pontos cegos do `contract-check.mjs`** — os quatro da F-24 mais os dois medidos aqui.
- **Specs nao sao typechecados.** `tsconfig.app.json` os exclui e nao ha `tsc --noEmit` em nenhum
  gate; `tsc -p tsconfig.spec.json --noEmit` acusa **11 erros preexistentes**. Enquanto isso valer,
  nenhum fixture tipado gateia nada.
- **Os 78 pontos de ramificacao por status** seguem intactos (65 `if`, 10 `case`, 3 de tabela) —
  fora de escopo declarado na spec.
- **Dev-offline sem `/auth/totp/*`**, portanto sem a jornada de MFA.

## Comentarios que esta sprint tornou falsos — os tres corrigidos

Familia de defeito que a F-23 ja pagou em hotfix:

1. `verify-totp.component.ts` — o docblock de `mensagemDeErroDeTotp` afirmava que o
   `ErrorResponseDto` **nao serializa o codigo**.
2. `verify-totp.component.spec.ts:202` — mesma afirmacao no comentario do teste do `400`.
3. `copy-de-erro.ts` — o topo dizia que no `400` do `verify-totp` *"so o `message` as discrimina"*.

E um quarto, preventivo: o docblock novo de `api.models.ts` chegou a cravar "80 dos 133" codigos —
numero que a **Sprint 37** invalida. Trocado por ponteiro para a fonte de verdade
(`CODIGOS-DE-ERRO.md`, recalculado a cada build por `ParticaoDeCodigosErroTest`) no hotfix `d3c03a8`.
