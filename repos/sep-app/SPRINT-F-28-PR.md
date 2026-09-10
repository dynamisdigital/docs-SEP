# F-Sprint 28 — Corpo de erro no `contract:check` e typecheck dos specs

**Branch**: `feature/fsprint-28-contract-check-typecheck` (de `develop` `4baf7b1`)
**Spec**: [`128`](../../specs/fase-4/128-fsprint-28-contract-check-erro-typecheck-web.md) ·
**Steps**: [`128`](../../steps-fase-4/web/128-fsprint-28-steps.md)
**Escopo**: Fase 4, divida de tooling e contrato. Sem tela, endpoint, DTO, migration, regra nova ou
ADR.

## Summary

Dois gates que o repo acreditava ter e nao tinha.

**1. O catalogo de codigos de erro nao tinha gate.** A F-26 fez o `verify-totp` encerrar a tentativa
em `MFA-400-003`/`004`, mas a Task 126.3 ficou sem executar: o `contract-check.mjs` nao via corpo de
erro nem pertinencia de enum. Agora ha `errorResponses` (corpo de erro por status) e `enumSubset`
(pertinencia opt-in), e o `400` de `mfa.totpVerify` declara **os dois codigos que o componente
ramifica** — nao os 80 publicados, nem o `MFA-400-002`, que cai no ramo legado. Renovar o snapshot
sem eles reprova o CI; e testes contra o descriptor real impedem que a declaracao seja apagada em
silencio.

**2. Specs nao passavam por typecheck.** Erro de tipo em spec passava por `vitest`, `lint` e `build`
(medido na F-26). Os **11 erros** preexistentes foram corrigidos so em specs, com a contagem do Vitest
identica antes e depois, e o gate `typecheck:spec` entrou no CI cobrindo tambem os 13 `.ts` do
Playwright.

**Limite declarado, e importante**: o CI roda contra o snapshot versionado. Se o `sep-api` deixar de
publicar um dos dois codigos, o CI do web reprova **quando o snapshot for renovado** — nao no instante
em que o backend muda.

## Mudancas por modulo

| Modulo | Mudanca |
|---|---|
| `scripts/contract-check.mjs` | `verificarEnumSubset` (pertinencia), `verificarCorpoDeErro` (corpo por status, duas regras de consistencia), rejeicao de especificacao de campo nao reconhecida, guarda de entrada malformada; `reportarEnumNaoPublicado` extraido do `verificarEnum` |
| `scripts/contract-check.spec.ts` | **20 casos novos**, incluindo 3 contra o descriptor real e o snapshot versionado |
| `contracts/consumed-contracts.json` | tipo `ApiErrorResponse` (`message`, `codigo` com `enumSubset`), `errorResponses` no `400` de `mfa.totpVerify`, `$comment` |
| `contracts/README.md` | cobertura nova; limitacoes de obrigatoriedade e de quando o gate morde |
| `package.json`, `.github/workflows/ci.yml`, `tsconfig.e2e.json` | script `typecheck:spec` e passo no job `test` |
| 6 specs em `src/` | os 11 erros de tipo |

13 arquivos, **+374 / −30**.

## Test plan

| Gate | Baseline (Gate F-28.0) | Resultado |
|---|---|---|
| Vitest | 855 / 97 | **875 / 97**, 0 falhas |
| Playwright | 42 | **42**, 0 falhas |
| `contract:check` | 85 / 0 | **85 / 0** |
| `typecheck:spec` | nao existia — `tsc` saia **2**, 11 erros | **exit 0** (~5,4s) |
| `lint` / `lint:scss` / `format:check` / `build` | verdes | verdes |
| `npm audit` | 0 high, 4 moderate | idem |

Regressao completa re-rodada **depois dos commits** e apos `npm ci`, porque o `lint-staged` reescreve
arquivos.

**Smoke real contra `:8080`**: nao se aplica — a sprint nao toca comportamento de runtime. O
equivalente aqui e o gate rodado contra copias mutadas do snapshot, abaixo.

### Mutacao — 24 mortas, 2 sobreviventes esperados

Cada mutante conferido no diff antes de rodar, morte aceita so com teste nomeado e zero
`SyntaxError`, restauracao com MD5 igual ao backup.

| Task | Mutantes | Resultado |
|---|---|---|
| 128.1 | valor esperado das duas assercoes que o `TS2339` escondia | 2 mortos — as assercoes executam |
| 128.2 | sonda de tipo num spec de `src/` e num de `e2e/` | 2 mortos **so pelo gate novo**; `vitest` e `build` passam com a sonda |
| 128.3 | pertinencia sempre verdadeira; `enum` aceitando subconjunto; `enumSubset` ignorado; lista vazia aceita; `enumSubset` por igualdade | 5 mortos — o 2o **pelo teste de igualdade que ja existia** |
| 128.3 hotfix | sem o ramo de especificacao nao reconhecida; sem o `return` do ramo `array` | 2 mortos |
| 128.4 | sem a chamada; sem exigir o status em `erros`; status sem schema aceito; sem guarda de lista; sem `.map(String)` | 5 mortos — o ultimo so pelo caso "passa" |
| 128.4 hotfix | uma por condicao da guarda de entrada malformada | 3 mortos |
| 128.5 | em copia do snapshot: sem `codigo`; sem `MFA-400-004`; consumo declarando `CRD-403-001` | 3 mortos, **exatamente 1 falha cada** entre 304 respostas que usam o `ErrorResponseDto` |
| 128.5 hotfix | no descriptor real: sem a declaracao; sem `MFA-400-003` no `enumSubset` | 2 mortos |
| 128.5 | "obrigatorio de um lado so", no OpenAPI e no TS | **sobrevivem** a `contract:check`, `typecheck:spec` e `build` — nao verificavel, declarado |

**Controle**: sem a declaracao, retirar `MFA-400-004` do snapshot sai **exit 0**. E o estado anterior a
sprint, e a comparacao antes/depois do valor dela.

## Decisoes

1. **Opt-in, nunca afrouxar.** Pertinencia so por `enumSubset`; `enum` segue exigindo igualdade, que
   protege 71 campos tipados como uniao fechada. Nenhum teste existente foi reescrito.
2. **`errorResponses` espelha `responseHeaders`**: mapa por status; o status precisa estar em `erros`
   (regra da F-22) e ter schema JSON.
3. **Declarar o que e ramificado**: dois codigos, nao tres. E o ponto cego (iv) aplicado a mao.
4. **Typecheck corrige antes de gatear**, so em specs. `tsconfig.e2e.json` separado do
   `tsconfig.spec.json`: o `vitest/globals` mascararia import esquecido do `@playwright/test`.
5. **Pontos cegos (i)-(iv) da F-24 remedidos e mantidos fora**: (ii) e defesa, nao defeito; os
   outros nao tem cenario hoje.

## Achados fora do plano

- **Chave desconhecida no descriptor era ignorada em silencio** — `enumsubset` digitado errado
  desligaria o gate do catalogo. Hotfix `82396eb`; as 494 especificacoes atuais sao reconhecidas.
- **`null` em `errorResponses` lancava `TypeError`** dentro do check. Hotfix `a42ac85`.
- **A declaracao do catalogo podia ser apagada com o CI verde.** Hotfix `c91bda1`, testes contra o
  descriptor real.
- **Os specs do Playwright nao entravam em tsconfig nenhum.** Hotfix `23e45e6`; 0 erros hoje.
- **O risco "TS2322 de ambiente" nao se confirmou**: era alias local `GuardResult` mais estreito que o
  do router, sem `RedirectCommand`.
- **Tres armadilhas de mutacao**: `grep -cF` conta ancora multi-linha errado (a guarda abortou em vez
  de mutar); exit 1 por `SyntaxError` nao e morte; e um mutante que so a integracao matava revelou
  lacuna de teste de unidade.

## Dividas aceitas e follow-ups

- 🟡 **O gate do catalogo morde na renovacao do snapshot.** Follow-up: job agendado, ou do lado do
  `sep-api`, rodando o `contract:check` do web contra o OpenAPI de `develop`.
- 🟢 `contracts/README.md`: bullet do `X-Step-Up-Token` desatualizado desde a Sprint 34 (24
  operacoes o documentam; `knownGaps` vazio). Listado, nao corrigido.
- 🟢 `typecheck:spec` no `.husky/pre-push` (~5,4s por push).
- 🟢 `logarAdmin` em **3 copias byte-identicas** (dashboard, profile, change-password) —
  consolidar em `src/testing/`.
- 🟢 `vitest/no-identical-title` (`@vitest/eslint-plugin`) pegaria o evil merge `11bd729`.
- 🟢 `scripts/*.mjs` nunca passou por prettier (215 linhas de diferenca no `contract-check.mjs`).
- 🟢 Pontos cegos (i), (iii) e (iv) seguem abertos; `sep-mobile` segue sem `contract:check`.

## Commits

- `e8bbb04` test: corrigir os 11 erros de tipo dos specs
- `b50fe4c` ci: gatear typecheck dos specs
- `23e45e6` ci: estender typecheck:spec aos specs do Playwright
- `980513c` feat(contracts): verificar enum por pertinencia com enumSubset
- `82396eb` fix(contracts): reprovar especificacao de campo nao reconhecida
- `837a72b` feat(contracts): verificar corpo de erro declarado por status
- `a42ac85` fix(contracts): rejeitar entrada malformada em errorResponses
- `2207b6c` test(contracts): gatear codigos de erro consumidos
- `c91bda1` test(contracts): prender declaracao do catalogo ao snapshot real
- `f00fb4c` docs(contracts): documentar enumSubset e errorResponses

## Notas

Nada mudou em `sep-api` nem em `sep-mobile`. Push e PR sao **manuais**. Conferir o merge **por
conteudo**, nao por hash, e rodar `git diff-tree --cc` no back-merge — foi uma resolucao manual de
back-merge que duplicou os testes corrigidos pelo PR #149.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01YRcEjyW8RtSU6YXXuHZRKM
