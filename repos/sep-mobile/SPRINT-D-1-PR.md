# D-Sprint 1 - Divida de dependencias (`sep-mobile`)

> Descricao temporaria do PR `feature/dsprint-1-divida-dependencias` -> `develop` no `sep-mobile`.
> Apagar apos o merge (ciclo de vida padrao). O par web tem descricao propria em
> [`repos/sep-app/SPRINT-D-1-PR.md`](../sep-app/SPRINT-D-1-PR.md).

## Summary

**Sprint de divida de seguranca, sem escopo de produto novo**: nenhuma jornada, rota, endpoint,
contrato ou regra nova.

Metade mobile da primeira sprint **cross-repo** do projeto (faixa `3XX`). Branch e PR proprios, mas
**um** gate de aceite com o `sep-app`: o defeito de fundo e nenhum dos dois repos ter gate de
`npm audit`, e corrigir num deixando o outro sem gate reproduziria a condicao que criou a divida.

Spec [`300`](../../specs/fase-4/300-dsprint-1-divida-dependencias-web-mobile.md) + steps
[`300`](../../steps-fase-4/cross-repo/300-dsprint-1-steps.md). Sem ADR.

## Numeros

| | critical | high | moderate | low | total |
|---|---|---|---|---|---|
| baseline (Gate D-1.0, 2026-08-05) | 0 | **11** | 8 | 0 | 19 |
| final | 0 | **0** | 8 | 0 | **8** |

**A baseline registrada na spec 300 nao valia** — 25 total, 1 `critical`, 15 `high` — e a propria
spec ja desconfiava dela: foi medida na branch de feature da M-17, e nao em `develop`. Os seis PRs do
Dependabot que estavam em `main` ja tinham derrubado o `critical` e quatro `high`. A linha acima e a
do Gate D-1.0, medida em `develop` **apos o back-merge**.

## Pre-requisito: back-merge `main` -> `develop`

A metade mobile dependia do back-merge, pendente desde 2026-07-31. Feito nesta sprint: merge sem
conflito, **3 arquivos** (`.github/workflows/ci.yml`, `package.json`, `package-lock.json`), **nenhum
arquivo de app**, deixando `develop` identica a `main` por conteudo antes de qualquer bump.

## Test plan

Rodados **depois** dos commits e **reconferidos em `develop` pos-merge** com
`npm ci --legacy-peer-deps`:

| Gate | Resultado |
|---|---|
| `npm ci --legacy-peer-deps`, `format:check`, `lint`, `lint:scss`, `build` | exit 0 |
| `npm run audit` (o gate novo) | exit 0 |
| `npx cap sync android` | exit 0 |
| Vitest | **527 / 70** |
| Playwright | **41** |

O `cap sync android` entra na verificacao de proposito: o repo instala com `--legacy-peer-deps` nos
tres jobs do CI, entao um bump pode resolver o advisory e **quebrar peer range sem falhar o
install**, aparecendo so no build ou no sync.

## Mudancas

**`package-lock.json`** — 35 pacotes mudaram de versao, **nenhum cruzou fronteira de major**. Angular
`20.3.26 -> 20.3.27`. **Ionic `8.8.11` e Capacitor `8.4.0` permanecem intactos**, como o ADR 0019
exige. O `package.json` **nao foi tocado** pelo bump: o `npm audit fix --legacy-peer-deps` resolveu
inteiramente no lock, e o caret `^20.3.26` ja admitia o patch.

**`.github/workflows/ci.yml`** — step `Security audit` no job `test`.

**`package.json`** — script `"audit": "npm audit --audit-level=high"` (unica linha alterada no
manifesto nesta sprint).

## Decisoes

- **O gate vai so no job `test`.** O `CI-MOBILE` tem tres jobs (`test`, `build`, `android`) e os tres
  instalam do mesmo lock: repetir triplicaria o tempo sem cobrir nada a mais.
- **Limiar `high`, nao `total`.** Aqui os `moderate` so tem correcao em major de Angular ou de
  Capacitor, barrado pelos ADR 0018 e 0019; gate cronicamente vermelho vira gate ignorado.
- **Provado que o gate morde**: `--audit-level=low` sai `1`, `moderate` sai `1`, `high` sai `0`.

## Dividas aceitas

8 `moderate`, **todos** corrigiveis apenas em major — `@angular/cli@21.0.4`,
`@angular-devkit/build-angular@22.1.3` e `@analogjs/vite-plugin-angular@2.6.4`, mais os transitivos
que dependem deles (`@hono/node-server`, `@modelcontextprotocol/sdk`, `sockjs`, `uuid`,
`webpack-dev-server`). Barrados pelos ADR 0018 e 0019.

Insumo da revisao de ADR de **2026-09-30**, nao omissao. Tabela completa em
[`SEGURANCA.md`](../../docs-sep/SEGURANCA.md) §18.

## Riscos declarados como pendencia, nao simulados

- **Smoke real nao executado.** Bump que altere comportamento de runtime nao aparece em Vitest nem em
  `npm audit`.
- **O `sep-api` nao tem cobertura equivalente** (sem plugin de scan no `build.gradle`). Follow-up
  nomeado, candidato a sprint propria.

## Notas

Uma execucao da suite Playwright deu 1 falha por timeout (`credora-mobile.spec.ts`), com
`load average` em 12. Isolado passou 8/8 e a suite com `--workers=1` fechou **41 verdes**, a mesma
baseline da M-17. E saturacao de CPU da maquina, nao regressao — padrao ja registrado no projeto.

O `npx cap sync` exige **Node >= 22** por ADR 0019; a shell padrao da maquina tem 20.19.2, e o gate
foi rodado com o Node 22 do `nvm`.

## Commits

```
5951b2e ci(mobile): adicionar gate de npm audit no CI-MOBILE
b415368 chore(deps): remediar vulnerabilidades high/critical dentro da baseline mobile
```

(Alem do commit de back-merge `66ce65a`, que entrou em `develop` antes da sprint.)

## Merge (2026-08-05)

`origin/develop` via **PR #145** (`280857e`), promovida a `main` via **PR #146** (`7af2a1c`).
`develop` == `main` por diff de conteudo (vazio), e a arvore das duas pontas conferida
**byte-identica** a da branch que passou nos gates. Conferido tambem o conteudo material: step de
audit no `ci.yml`, script no `package.json` e `@angular/core@20.3.27` no lock, presentes em `develop`
**e** em `main`.
