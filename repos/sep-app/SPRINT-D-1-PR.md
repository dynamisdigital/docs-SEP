# D-Sprint 1 - Divida de dependencias (`sep-app`)

> Descricao temporaria do PR `feature/dsprint-1-divida-dependencias` -> `develop` no `sep-app`.
> Apagar apos o merge (ciclo de vida padrao). O par mobile tem descricao propria em
> [`repos/sep-mobile/SPRINT-D-1-PR.md`](../sep-mobile/SPRINT-D-1-PR.md).

## Summary

**Sprint de divida de seguranca, sem escopo de produto novo**: nenhuma jornada, tela, endpoint,
contrato, migration ou regra de negocio.

Primeira sprint **cross-repo** do projeto (faixa `3XX`): `sep-app` e `sep-mobile` tem branch e PR
separados, mas **um** gate de aceite e **um** registro de divida. O defeito de fundo e um so e nao e
o numero de vulnerabilidades — e nenhum dos dois repos ter gate de `npm audit`. A F-Sprint 19 zerou
este repo em 2026-07-16 e ninguem soube que o numero voltara a subir ate a medicao manual de
2026-08-03, **18 dias depois**.

Spec [`300`](../../specs/fase-4/300-dsprint-1-divida-dependencias-web-mobile.md) + steps
[`300`](../../steps-fase-4/cross-repo/300-dsprint-1-steps.md). Sem ADR.

## Numeros

| | critical | high | moderate | low | total |
|---|---|---|---|---|---|
| baseline (Gate D-1.0, 2026-08-05) | 0 | **12** | 7 | 0 | 19 |
| final | 0 | **0** | 3 | 0 | **3** |

**`high` a zero, sem nenhum major subido**: 86 pacotes mudaram de versao no lock e nenhum cruzou
fronteira de major — o que o ADR 0018 exige enquanto o Angular 22 estiver adiado.

Advisories `high` fechados incluem *Angular i18n: XSS via event-handler attributes* e *Cache-Key
Ambiguity no `HttpTransferCache`*, este ultimo um reuso de resposta entre requisicoes distintas.

## Test plan

Rodados **depois** dos commits (o `lint-staged` reescreve arquivos) e **reconferidos em `develop`
pos-merge com `npm ci`**:

| Gate | Resultado |
|---|---|
| `npm ci`, `format:check`, `lint`, `lint:scss`, `build` | exit 0 |
| `npm run audit` (o gate novo) | exit 0 |
| `contract:check` | 85 operacoes / 1 lacuna |
| Vitest | **765 / 94** |
| Playwright | **39** |

## Mudancas

**`package.json` / `package-lock.json`** — Angular `20.3.26 -> 20.3.27`; `@angular/build` e
`@angular/cli` `20.3.32 -> 20.3.33`.

**`.github/workflows/ci.yml`** — step `Security audit` no job `test`, junto dos demais gates de
qualidade.

**`package.json`** — script `"audit": "npm audit --audit-level=high"`, com o limiar **explicito no
comando** e nao escondido em config.

## Decisoes

- **O limiar e `high`, nao `total`.** `moderate`/`low` frequentemente so tem correcao em major, o que
  o ADR 0018 barra; um gate cronicamente vermelho e um gate que o time aprende a ignorar. `moderate`
  segue visivel na saida e entra no registro de divida.
- **Provado que o gate morde**, e nao apenas instalado: com `--audit-level=low` sai `1`, com
  `moderate` sai `1`, revertido para `high` sai `0`. Gate nunca visto vermelho e gate nao verificado —
  mesmo raciocinio da verificacao por mutacao nos testes.
- **Sem `npm audit fix --force`**: `--force` sobe major e exigiria ADR novo.

## Nota tecnica — por que `npm audit fix` nao bastou

O range vulneravel terminava **exatamente** em `20.3.26`, a versao instalada, e o patch `20.3.27` ja
estava publicado dentro da baseline — nao havia decisao de major a tomar. Mesmo assim o `audit fix`
parou em 9 `high`:

1. os pacotes `@angular/*` declaram peer em **versao exata**
   (`@angular/core@"20.3.27"` from `@angular/animations@20.3.27`), entao subir parcialmente conflita;
2. o `package-lock.json` antigo mantinha a raiz em `^20.3.26` e prendia a resolucao
   (`Found: @angular/animations@20.3.26`), mesmo com o manifesto ja editado.

Resolvido subindo o conjunto inteiro no manifesto e deixando o npm resolver o grafo de uma vez.

## Dividas aceitas

3 `moderate`, **todos** corrigiveis apenas em `@angular/cli@21.0.4` — major, barrado pelo ADR 0018:
`@angular/cli` (direto), `@hono/node-server` e `@modelcontextprotocol/sdk` (transitivos do CLI).

Sao insumo da revisao de ADR marcada para **2026-09-30**, nao omissao. Tabela completa com os cinco
campos por item em [`SEGURANCA.md`](../../docs-sep/SEGURANCA.md) §18.

## Riscos declarados como pendencia, nao simulados

- **Smoke real contra `:8080` nao executado.** Bump que altere comportamento de runtime nao aparece em
  Vitest nem em `npm audit`. Declarado no padrao da F-23.
- **O `sep-api` nao tem cobertura equivalente.** O `build.gradle` nao tem plugin de scan nenhum —
  medir exigiria adicionar tooling, o que e escopo de instalar ferramenta e nao de remediar divida.
  Follow-up nomeado, candidato a sprint propria. Enquanto isso o backend nao tem deteccao de
  vulnerabilidade de dependencia, nem manual nem em CI.

## Notas

O e2e falhou **39/39** na primeira execucao pos-bump. Nao era regressao de aplicacao: o lock subiu
`@playwright/test` `1.61.1 -> 1.62.1` e o binario do browser correspondente nao estava baixado
(`Executable doesn't exist at .../chrome-headless-shell`). `npx playwright install chromium` resolveu.
Fica o registro: **bump de Playwright exige reinstalar o browser** — o CI-APP nao roda Playwright
hoje, entao isso afeta so execucao local.

## Commits

```
cacd905 ci(app): adicionar gate de npm audit no CI-APP
0a32391 chore(deps): remediar vulnerabilidades high/critical dentro do Angular 20.x
```

## Merge (2026-08-05)

`origin/develop` via **PR #128** (`d987714`), promovida a `main` via **PR #129** (`7f232b3`).
`develop` == `main` por diff de conteudo (vazio), e a arvore das duas pontas conferida
**byte-identica** a da branch que passou nos gates. Conferido tambem o conteudo material, e nao so o
hash: o step de audit no `ci.yml`, o script no `package.json` e o `@angular/core@20.3.27` no lock
estao presentes em `develop` **e** em `main`.
