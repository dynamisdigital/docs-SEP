# Steps - F-Sprint 28 - Gatear corpo de erro no contrato e typecheck dos specs

**Spec de origem**:
[`128-fsprint-28-contract-check-erro-typecheck-web.md`](../../specs/fase-4/128-fsprint-28-contract-check-erro-typecheck-web.md)

**Status**: planejada; steps criados em 2026-09-10. Execucao bloqueada ate o PR do fix de 2026-09-10
(`feature/fix-duplicatas-login-spec`) estar em `develop`.

**Objetivo geral**: fazer o `contract:check` enxergar corpo de erro e pertinencia de enum, gatear os
dois codigos MFA que o `verify-totp` ramifica, e colocar os specs sob `tsc` no CI.

**Natureza da sprint**: divida de tooling e contrato. Sem tela, endpoint, DTO, migration, regra de
negocio ou ADR.

**Repo de implementacao**: `sep-app`. **Somente leitura**: nenhum outro.

**Branch sugerida**: `feature/fsprint-28-contract-check-typecheck`, criada de `develop` atualizado e
verde.

**Skills obrigatorias**: `coding-guidelines` e `clean-code`; `sep-web-mutation-verified-testing` para
os testes do checker e do typecheck.

---

## Decisoes da sprint

1. **Opt-in, nunca afrouxar.** `enum` continua exigindo igualdade; pertinencia so por `enumSubset`.
   Nenhum teste existente do `contract-check.spec.ts` pode ser reescrito para passar.
2. **`errorResponses` espelha `responseHeaders`**: mapa por status. Todo status nele precisa estar em
   `erros` e ter schema JSON no OpenAPI.
3. **Declarar o que e ramificado.** `codigo` com `enumSubset` de `MFA-400-003` e `MFA-400-004`. O
   `MFA-400-002` fica fora — nao ha ramo para ele (spec §Ancora 3).
4. **Typecheck corrige antes de gatear**, so em `**/*.spec.ts`, com contagem do Vitest identica.
5. **Mutacao de contrato em copia**, nunca no `openapi.snapshot.json` versionado.
6. **Pontos cegos (i)-(iv) nao se corrigem de passagem.** Se uma Task esbarrar neles, parar e
   reportar.

---

## Protocolo obrigatorio por Task

1. Executar somente a Task liberada.
2. Reconferir cada ancora no codigo atual com `arquivo:linha`; os numeros da spec sao de 2026-09-10.
3. Teste primeiro, visto falhar pelo motivo esperado.
4. Mutacao nomeada aplicada, **conferida no diff**, vista reprovar e revertida com o arquivo voltando
   byte a byte. Mutacao que nao aplicou nao prova nada.
5. Gates da Task com exit code capturado um a um (`cmd; echo "EXIT=$?"`), nunca por pipe.
6. Checkpoint pre-commit: status, diff, arquivos, testes, mutacoes, riscos, mensagem sugerida.
   Aguardar aprovacao; `git add` com paths especificos.
7. Um code review depois do commit. Finding confirmado vira hotfix com novo checkpoint, sem novo
   review.
8. Aguardar autorizacao antes da Task seguinte. Push e PR sao manuais; git do `docs-SEP` tambem.

---

## Rastreabilidade spec 128 -> steps

| Item da spec | Steps |
|---|---|
| Corrigir os 11 erros de tipo | 128.1 |
| Gate `typecheck:spec` | 128.2 |
| `enumSubset` | 128.3 |
| `errorResponses` | 128.4 |
| Task 126.3 executada | 128.5 |
| README, `$comment`, regressao | 128.6 |
| Baseline e conferencia do fix | Gate F-28.0 e Fechamento |

---

## Ordem de execucao

```text
Gate F-28.0  conferir o fix em develop por conteudo, medir baseline, reconferir ancoras
  -> 128.1   corrigir os 11 erros de tipo (so specs)
  -> 128.2   instalar typecheck:spec no script e no CI
  -> 128.3   enumSubset no checker
  -> 128.4   errorResponses no checker
  -> 128.5   declarar e gatear o catalogo consumido (Task 126.3)
  -> 128.6   README, $comment e regressao completa
Fechamento   gates, documentacao, SPRINT-F-28-PR.md
```

Typecheck vem primeiro de proposito: os testes novos das Tasks 128.3 e 128.4 entram em
`scripts/contract-check.spec.ts`, que o `tsconfig.spec.json` ja inclui — nascem typechecados.

---

## Gate F-28.0 - Baseline e integracao

### Step 128.0.1 - Conferir o fix em `develop` por conteudo

```bash
git fetch origin
git show origin/develop:package-lock.json | grep -A2 '"node_modules/js-yaml"'   # 4.3.2
git show origin/develop:src/app/features/public/login/login.component.spec.ts \
  | grep -c "423 com message vazia: cai no literal local"                       # 1
git diff --stat origin/main origin/develop
```

Se `js-yaml` ainda estiver em 4.3.1 ou o titulo aparecer duas vezes, parar: o fix nao entrou.

### Step 128.0.2 - Sincronizar, criar a branch e limpar a descricao anterior

```bash
git switch develop && git pull --ff-only
git status --short --branch
git switch -c feature/fsprint-28-contract-check-typecheck
```

Apagar `docs-SEP/repos/sep-app/SPRINT-F-26-PR.md` (working tree apenas; a F-26 ja foi usada no PR
#145). Regra do `AGENT.md` §Arquivos de PR description.

### Step 128.0.3 - Medir todos os gates

```bash
npm ci; echo "EXIT=$?"
npm test; echo "EXIT=$?"
npm run e2e; echo "EXIT=$?"
npm run lint; echo "EXIT=$?"
npm run lint:scss; echo "EXIT=$?"
npm run format:check; echo "EXIT=$?"
npm run build; echo "EXIT=$?"
npm run audit; echo "EXIT=$?"
npm run contract:check; echo "EXIT=$?"
npx tsc -p tsconfig.spec.json --noEmit; echo "EXIT=$?"
```

Registrar: testes/arquivos do Vitest, testes do Playwright, operacoes/lacunas do contrato, contagem do
audit e **numero e codigo de cada erro do `tsc`**. Referencia de 2026-09-10: Vitest 855/97,
`contract:check` 85/0, audit 0 high / 4 moderate, `tsc` exit 2 com 11 erros. Nenhum gate vermelho alem
do `tsc` e baseline aceitavel.

### Step 128.0.4 - Reconferir as ancoras

- `verificarCorpoDaResposta`, `verificarStatusDeErro`, `verificarEnum`, `verificarCampo` e o teste
  `'falha quando o enum diverge em qualquer direcao'`: linhas atuais;
- `CODIGOS_DE_DESFECHO_TERMINAL` no `verify-totp`: exatamente os dois codigos;
- `ErrorResponseDto.codigo` no snapshot: enum inline, contagem, os dois MFA presentes, `CRD-403-001`
  ausente, `required` ausente;
- job `test` do `.github/workflows/ci.yml`: ordem atual dos passos.

### Definicao de pronto do Gate F-28.0

- [ ] Fix de 2026-09-10 presente em `origin/develop` por conteudo.
- [ ] Branch criada de baseline verde; `SPRINT-F-26-PR.md` removido do working tree do `docs-SEP`.
- [ ] Gates medidos e contagens registradas, incluindo a lista do `tsc`.
- [ ] Ancoras reconferidas antes de qualquer codigo.

---

## Task 128.1 - Corrigir os 11 erros de tipo dos specs

**Objetivo**: `tsc -p tsconfig.spec.json --noEmit` sair 0 sem mudar comportamento de teste nenhum.

**Pre-requisito**: Gate F-28.0 aprovado.

**Arquivos esperados**: somente `**/*.spec.ts` da lista do Gate. Qualquer outro arquivo e parada.

### Step 128.1.1 - Corrigir por familia, na ordem de menor risco

1. `TS2314` (`chaves-pix-page.component.spec.ts`): dar o argumento generico ao `HttpResponse` do MSW,
   conferindo o tipo real do corpo devolvido pelo stub.
2. `TS2345` (dashboard, change-password, profile): corrigir a assinatura de `logarAdmin` para aceitar
   o `RenderResult` que os call sites ja passam. Preferir tipar o parametro a fazer cast no call site.
3. `TS2339` (`error.interceptor.spec.ts`): a variavel e atribuida dentro do callback de `subscribe` e
   o compilador a estreita para `never`. Antes de corrigir, **provar que a assercao executa**: mutar o
   valor esperado e ver o teste reprovar. Se nao reprovar, e teste que prova nada — reportar.
4. `TS2322` (`credora-presence.guard.spec.ts`): medir antes se ha duas copias de `@angular/router` no
   `node_modules` (`npm ls @angular/router`). Se for ambiente, registrar e corrigir o tipo no spec
   sem tocar dependencia.

### Step 128.1.2 - Provar que nada mudou em comportamento

- Vitest com a **mesma** contagem de testes e arquivos do Gate;
- `git diff --stat` so com arquivos `*.spec.ts`;
- `tsc -p tsconfig.spec.json --noEmit` exit 0.

### Verificacao da Task 128.1

```bash
npx tsc -p tsconfig.spec.json --noEmit; echo "EXIT=$?"
npm test; echo "EXIT=$?"
npm run lint; echo "EXIT=$?"
npm run format:check; echo "EXIT=$?"
```

### Definicao de pronto da Task 128.1

- [ ] `tsc` dos specs sai 0.
- [ ] Contagem do Vitest identica ao Gate.
- [ ] Nenhum arquivo fora de `**/*.spec.ts` alterado.
- [ ] Assercao do `error.interceptor.spec.ts` provada viva por mutacao.

### Commit sugerido

```text
test: corrigir os 11 erros de tipo dos specs
```

---

## Task 128.2 - Instalar o gate `typecheck:spec`

**Objetivo**: erro de tipo em spec reprovar no CI.

**Pre-requisito**: Task 128.1 concluida e aprovada.

**Arquivos esperados**: `package.json`, `.github/workflows/ci.yml`.

### Step 128.2.1 - Script e passo de CI

- `package.json`: `"typecheck:spec": "tsc -p tsconfig.spec.json --noEmit"`.
- `ci.yml`, job `test`: passo `Typecheck specs` rodando `npm run typecheck:spec`, junto do `lint`.
  Nao mexer nos demais passos.

### Step 128.2.2 - Provar que o gate morde

1. Introduzir um erro de tipo deliberado num spec (ex.: `const x: number = 'a';`), conferir no diff.
2. `npm run typecheck:spec` tem de sair diferente de zero; `npm test` e `npm run build` **passam** —
   e isso que prova que so o gate novo pega.
3. Reverter e conferir o arquivo byte a byte; o gate volta a sair 0.

### Step 128.2.3 - Medir o custo

Registrar o tempo do `typecheck:spec` local. Entra no fechamento como custo de CI.

### Verificacao da Task 128.2

```bash
npm run typecheck:spec; echo "EXIT=$?"
npm run format:check; echo "EXIT=$?"
```

### Definicao de pronto da Task 128.2

- [ ] Script existe e sai 0.
- [ ] Passo no job `test` do CI.
- [ ] Sonda vista reprovar so no gate novo, e revertida.
- [ ] Tempo medido.

### Commit sugerido

```text
ci: gatear typecheck dos specs
```

---

## Task 128.3 - `enumSubset`: pertinencia opt-in

**Objetivo**: poder declarar "estes valores precisam existir no enum documentado", sem afrouxar
`enum`.

**Pre-requisito**: Task 128.2 concluida e aprovada.

**Arquivos esperados**: `scripts/contract-check.mjs`, `scripts/contract-check.spec.ts`.

### Step 128.3.1 - Testes primeiro

Em `contract-check.spec.ts`, novos casos:

- subconjunto declarado contido no documentado: passa;
- valor declarado ausente do documentado: falha, nomeando o valor;
- OpenAPI sem enum no campo: falha (catalogo sumiu), a nao ser que haja gap `enum-undocumented`;
- `enum` (legado) com subconjunto: **continua falhando** — o teste existente cobre; nao alterar.

### Step 128.3.2 - Implementar

Em `verificarCampo`, despachar `especificacao.enumSubset` para uma verificacao propria, irma de
`verificarEnum`, no mesmo nivel de abstracao. Reusar `consumirGapDeEnum` para o caso sem enum.

### Mutacoes obrigatorias

- verificacao de pertinencia sempre verdadeira: o caso "valor ausente" reprova;
- `verificarEnum` aceitando subconjunto: o teste `'falha quando o enum diverge em qualquer direcao'`
  reprova;
- ignorar `enumSubset` no despacho: o caso "valor ausente" reprova.

### Verificacao da Task 128.3

```bash
npm test; echo "EXIT=$?"
npm run contract:check; echo "EXIT=$?"
npm run typecheck:spec; echo "EXIT=$?"
npm run lint; echo "EXIT=$?"
npm run format:check; echo "EXIT=$?"
```

### Definicao de pronto da Task 128.3

- [ ] `enumSubset` verificado por pertinencia; `enum` intacto.
- [ ] Nenhum teste existente alterado.
- [ ] Tres mutacoes vistas reprovar e revertidas.
- [ ] `contract:check` segue 85/0.

### Commit sugerido

```text
feat(contracts): verificar enum por pertinencia com enumSubset
```

---

## Task 128.4 - `errorResponses`: corpo de erro por status

**Objetivo**: o descriptor poder ligar um `$type` a uma resposta de erro, e o check verifica-lo.

**Pre-requisito**: Task 128.3 concluida e aprovada.

**Arquivos esperados**: `scripts/contract-check.mjs`, `scripts/contract-check.spec.ts`.

### Step 128.4.1 - Testes primeiro

- `errorResponses` com status em `erros`, schema presente e campos batendo: passa;
- campo declarado ausente do schema de erro: falha;
- status em `errorResponses` e fora de `erros`: falha, dizendo por que;
- status sem schema JSON no OpenAPI: falha;
- `errorResponses` em formato de lista (nao mapa): falha com mensagem que diz o formato certo — mesma
  guarda do `responseHeaders` (`:124-129`);
- operacao sem `errorResponses`: comportamento identico ao atual.

### Step 128.4.2 - Implementar

Funcao nova `verificarCorpoDeErro`, chamada em `verificarOperacao` ao lado de
`verificarCorpoDaResposta`, reusando `extrairConteudoJson` e `verificarExpectativa`. Nao alterar
`verificarCorpoDaResposta`.

### Mutacoes obrigatorias

- nao chamar `verificarCorpoDeErro`: o caso "campo ausente" reprova;
- remover a exigencia de pertinencia a `erros`: o caso correspondente reprova;
- aceitar status sem schema: o caso correspondente reprova.

### Verificacao da Task 128.4

Mesma bateria da Task 128.3.

### Definicao de pronto da Task 128.4

- [ ] `errorResponses` verificado com as duas regras de consistencia.
- [ ] Operacoes sem a chave inalteradas; `contract:check` segue 85/0.
- [ ] Tres mutacoes vistas reprovar e revertidas.

### Commit sugerido

```text
feat(contracts): verificar corpo de erro declarado por status
```

---

## Task 128.5 - Declarar e gatear o catalogo consumido (Task 126.3)

**Objetivo**: o CI reprovar se o backend deixar de publicar um dos codigos que o `verify-totp`
ramifica.

**Pre-requisito**: Task 128.4 concluida e aprovada.

**Arquivos esperados**: `contracts/consumed-contracts.json`.

### Step 128.5.1 - Declarar so o ramificado

- Tipo `ApiErrorResponse` com `message: "string"` e `codigo: { "enumSubset": ["MFA-400-003",
  "MFA-400-004"] }`.
- `mfa.totpVerify`: `errorResponses: { "400": { "$type": "ApiErrorResponse" } }`. O `400` ja esta em
  `erros`.
- Nao declarar `MFA-400-002` (sem ramo) nem os outros 78 publicados.

### Step 128.5.2 - Provar que o gate morde, em copia

Copiar o snapshot para o scratchpad e rodar com `SEP_OPENAPI_SCHEMA=<copia>`:

| Mutacao na copia ou no consumo | Esperado |
|---|---|
| remover a propriedade `codigo` do `ErrorResponseDto` | exit 1 |
| retirar `MFA-400-004` do enum de `codigo` | exit 1 |
| declarar `CRD-403-001` no `enumSubset` (consumo; reverter depois) | exit 1 |
| tornar `codigo` obrigatorio de um lado so | **nao verificavel** — registrar a causa (spec §Ancora 4) |

Conferir cada mutacao no diff antes de rodar. Registrar comando, saida e exit code.

### Verificacao da Task 128.5

```bash
npm run contract:check; echo "EXIT=$?"
npm test; echo "EXIT=$?"
npm run format:check; echo "EXIT=$?"
```

### Definicao de pronto da Task 128.5

- [ ] Declarados so os dois codigos ramificados.
- [ ] `contract:check` 85/0 contra o snapshot versionado.
- [ ] Tres mutacoes reprovam; a quarta registrada como nao verificavel, com causa.
- [ ] Snapshot versionado intocado.

### Commit sugerido

```text
test(contracts): gatear codigos de erro consumidos
```

---

## Task 128.6 - Documentacao do contrato e regressao final

**Objetivo**: o README e o descriptor dizerem o que o check faz agora, e nada que ele deixou de
fazer.

**Pre-requisito**: Task 128.5 concluida e aprovada.

**Arquivos esperados**: `contracts/README.md`, `$comment` de `contracts/consumed-contracts.json`.

### Step 128.6.1 - Atualizar o que a sprint mudou

- §O que o check cobre: `enumSubset` e `errorResponses`, com as duas regras de consistencia.
- §Limitacoes conhecidas: "obrigatorio de um lado so" nao verificavel, com a causa.
- `$comment`: as duas chaves novas, em uma frase cada.
- Afirmacao do README que a sprint tornar falsa: corrigir no mesmo commit. Afirmacao ja falsa que a
  sprint nao toca: **listar no checkpoint**, nao corrigir de passagem.

### Step 128.6.2 - Regressao completa

```bash
npm test; echo "EXIT=$?"
npm run e2e; echo "EXIT=$?"
npm run contract:check; echo "EXIT=$?"
npm run typecheck:spec; echo "EXIT=$?"
npm run lint; echo "EXIT=$?"
npm run lint:scss; echo "EXIT=$?"
npm run format:check; echo "EXIT=$?"
npm run build; echo "EXIT=$?"
npm run audit; echo "EXIT=$?"
```

### Definicao de pronto da Task 128.6

- [ ] README e `$comment` descrevem as duas chaves e o limite declarado.
- [ ] Todos os gates verdes, contagens >= baseline.

### Commit sugerido

```text
docs(contracts): documentar enumSubset e errorResponses
```

---

## Fechamento da F-Sprint 28

### Gate funcional

- [ ] `enumSubset` e `errorResponses` verificados e testados; `enum` com semantica intacta.
- [ ] Os dois codigos MFA ramificados estao gateados; remover qualquer um do OpenAPI reprova.
- [ ] Specs typechecados no CI.

### Gates tecnicos

- [ ] Bateria do Step 128.6.2 verde, depois de todos os commits e apos `npm ci`.
- [ ] Campanha de mutacao registrada por Task, sem sobrevivente nao analisado.

### Documentacao e entrega

- [ ] Spec 128 com §Resultado medido e desvios.
- [ ] `STATE.md` (fechar itens 2 e 3 do §Proximo passo e os follow-ups (m)/(n)), `CONTEXT-PARTE-2.md`,
      `specs/fase-4/README.md` e `AI-ROADMAP.md` atualizados.
- [ ] `repos/sep-app/SPRINT-F-28-PR.md` criado.
- [ ] Checkpoint final antes de qualquer commit.

### Mensagem sugerida para o commit final de documentacao

```text
docs(contracts): fechar gate de corpo de erro e typecheck dos specs
```
