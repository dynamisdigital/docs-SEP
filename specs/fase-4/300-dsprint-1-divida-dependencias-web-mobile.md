# Spec 300 - D-Sprint 1 - Divida de dependencias no web e no mobile

## Metadados

- **ID da Spec**: 300
- **Titulo**: D-Sprint 1 - Remediar as vulnerabilidades de dependencia do `sep-app` e do `sep-mobile`
  e instalar o gate de CI que impede a regressao silenciosa
- **Status**: **planejada** (criada em 2026-08-05)
- **Fase do produto**: Fase 4 - correcao de divida de seguranca; sem jornada, tela, endpoint,
  contrato, migration ou regra de negocio nova
- **Trilha**: **Cross-repo** (`sep-app` + `sep-mobile`) - primeira spec da faixa `3XX`
- **Origem**: item 3 do §Proximo passo do [`STATE.md`](../../docs-sep/STATE.md), aberto em 2026-08-03
- **Depende de**: back-merge `main` -> `develop` no `sep-mobile` (**manual do dev humano**; item 2 do
  mesmo §Proximo passo). Nao depende de nenhum gate externo, credencial ou API de terceiro
- **Desbloqueia**: nada tecnicamente. Restaura a invariante de seguranca de supply chain que a
  F-Sprint 19 deixou em zero e que se perdeu sem deteccao
- **Responsavel principal**: Devs Plenos Frontend

## Por que uma sprint cross-repo e nao duas

O defeito de fundo e **um so, e nao e o numero de vulnerabilidades**: nenhum dos dois repos tem gate
de `npm audit`, nem no CI nem como script de `package.json`. A F-Sprint 19 zerou o `sep-app` em
2026-07-16 e ninguem soube que o numero tinha voltado a subir ate a medicao manual de 2026-08-03, 18
dias depois. Corrigir num repo e deixar o outro sem gate reproduz exatamente a condicao que criou a
divida.

Os dois repos compartilham a baseline (`Angular 20.x`), a restricao ([ADR 0018](../../adr/0018-avaliacao-angular-22-no-web.md)
adiou o Angular 22) e a natureza do trabalho. Sao branches e PRs separados — a contabilidade do
projeto e por repo —, mas **um** gate de aceite, **uma** decisao sobre o que e irremediavel e **um**
registro de divida.

## Objetivo

1. Reduzir `critical` + `high` nos dois repos, medido antes e depois.
2. Instalar o gate que faz a proxima regressao **falhar o CI** em vez de esperar medicao manual.
3. Registrar o que nao for remediavel dentro da baseline com o *porque* por pacote, para que a
   proxima sprint nao redescubra a mesma restricao.

## Estado medido (2026-08-05)

| Repo | Branch medida | total | critical | high | moderate | low |
|---|---|---|---|---|---|---|
| `sep-app` | `develop` (`c72b393`) | 19 | 0 | 12 | 7 | 0 |
| `sep-mobile` | `feature/msprint-17-...` | 25 | 1 | 15 | 8 | 1 |

**O numero do `sep-mobile` nao vale como baseline.** Foi medido na branch de feature da M-17, que
estava com checkout ativo no repo, e nao em `develop`. Alem disso `main` esta **7 commits a frente**
de `develop` com **seis PRs do Dependabot** (`#137`, `#126`, `#129`, `#130`, `#132`, `#133`), que
provavelmente ja derrubam parte da contagem. **O Gate D-1.0 re-mede os dois repos em `develop`, apos o
back-merge, e a baseline e o numero dele** — nao esta.

O `sep-app` foi medido em `develop` e o numero e utilizavel, mas o Gate re-mede assim mesmo: baseline
nao medida no Gate nao pode ser citada no fechamento (regra que a F-22 aprendeu por registrar
baselines herdadas erradas mais de uma vez).

### O que ja se sabe sobre a composicao

Do registro do `STATE.md`, a conferir no Gate: dez pacotes `@angular/*` **diretos** em `high`,
incluindo *i18n XSS via event-handler attributes* e *Cache-Key Ambiguity no `HttpTransferCache`*
(cross-request leak), mais `brace-expansion` (DoS) e `fast-uri` (host confusion). A medicao de
2026-08-03 saiu **identica em `develop` intocada**, o que caracteriza deriva por advisory novo contra
dependencia existente, e nao regressao introduzida por codigo.

## Estado da ferramenta (verificado 2026-08-05)

| Repo | script `audit` no `package.json` | step de audit no CI |
|---|---|---|
| `sep-app` | **ausente** (17 scripts, nenhum) | **ausente** (`ci.yml`: `format:check`, `contract:check`, `lint`, `lint:scss`, `test:coverage`, `build`) |
| `sep-mobile` | **ausente** (16 scripts, nenhum) | **ausente** (`ci.yml`: `format:check`, `lint`, `lint:scss`, `test:coverage`, build PWA, build Android) |

O `sep-mobile` instala com `npm ci --legacy-peer-deps` nos tres jobs. Isso importa: bump que resolva
advisory mas quebre peer range passa despercebido no install e falha depois, no build.

## Decisao tecnica principal — o gate mede `critical`+`high`, nao `total`

`npm audit` conta `moderate` e `low` que frequentemente nao tem correcao dentro da baseline e nao
representam risco proporcional ao custo de subir major. Um gate em `total` seria vermelho por
construcao, e gate cronicamente vermelho e gate desligado na pratica — o time aprende a ignorar.

O gate usa `npm audit --audit-level=high`, que sai diferente de zero **so** com `high` ou `critical`.
`moderate`/`low` continuam visiveis na saida e entram no registro de divida da Task D-1.5, sem
bloquear merge.

*Rejeitado*: `--audit-level=critical` (deixaria passar os dez `@angular/*` que sao o problema real);
gate em `total` (vermelho permanente); `npm audit fix --force` no CI (muda `package-lock.json` sem
review, e `--force` sobe major, o que **exige ADR** por [ADR 0018](../../adr/0018-avaliacao-angular-22-no-web.md)).

## Restricao de baseline — o que esta sprint nao pode fazer

- **Nao subir major do Angular.** O [ADR 0018](../../adr/0018-avaliacao-angular-22-no-web.md) adiou o
  Angular 22 com revisao marcada para 2026-09-30; o 20 esta em LTS ate 2026-11-28. Subir major aqui
  contraria ADR vigente, e ADR prevalece sobre spec ([`AGENT.md`](../../AGENT.md) §Ordem de leitura).
- **Nao subir major do Capacitor/Ionic** no `sep-mobile`: baseline fixada pelo
  [ADR 0019](../../adr/0019-baseline-capacitor-8-mobile.md).
- Se a **unica** correcao publicada para um advisory `high` exigir major, o item **nao e remediado
  nesta sprint**: entra no registro da D-1.5 com o advisory, a versao que corrige e a razao, e vira
  insumo da revisao de ADR de 2026-09-30. Silenciar com `overrides` sem registro esta explicitamente
  fora.

## Escopo

### Dentro

- `sep-app`: remediacao de `critical`+`high` por patch/minor dentro do Angular 20.x; script `audit` e
  step no `ci.yml`.
- `sep-mobile`: idem, dentro de Angular 20.x / Ionic 8.4+ / Capacitor 8.
- Registro da divida residual e atualizacao de [`SEGURANCA.md`](../../docs-sep/SEGURANCA.md).

### Fora

- **`sep-api`**: nao tem ferramenta de scan nenhuma (`build.gradle` tem `java`,
  `org.springframework.boot`, `io.spring.dependency-management`, `com.diffplug.spotless`, `jacoco` —
  e so). Medir exigiria **adicionar tooling** (OWASP dependency-check ou equivalente) e configurar
  supressao de falso-positivo, o que e escopo de instalar ferramenta, nao de remediar divida. Fica
  como follow-up nomeado, candidato a sprint propria.
- Qualquer upgrade de major (ver §Restricao de baseline).
- Refactor de codigo de aplicacao. Se um bump exigir mudanca de codigo, a mudanca e **a minima** para
  compilar e passar, e vai no commit do bump.

## Criterios de aceite

1. `critical` + `high` reduzidos nos dois repos, com numero **medido no Gate** e numero final citados
   lado a lado.
2. Suite completa verde **depois** dos bumps nos dois repos. Regressao de dependencia aparece em teste
   e em build, nunca no proprio `npm audit`.
3. O gate de CI existe nos dois `ci.yml` e **foi provado que morde**: uma execucao deliberada com
   limiar rebaixado falhando o job, revertida em seguida. Gate nunca visto vermelho e gate nao
   verificado.
4. Todo item `high`/`critical` restante tem linha propria no registro, com advisory, versao que
   corrige, e por que nao foi aplicado.

## Riscos e limitacoes

- **Bump que altera comportamento de runtime** so aparece em smoke real contra `:8080`, nao executavel
  aqui. Fica declarado como gate pendente, no padrao da F-23 — **nao simulado**.
- O `sep-mobile` instala com `--legacy-peer-deps`; conflito de peer range pode passar no install e
  quebrar no `build` ou no `cap sync`. Por isso o criterio 2 exige build **e** `cap sync android`.
- A contagem pode **mudar entre o Gate e o fechamento** sem que ninguem toque em nada: advisories sao
  publicados continuamente. Se isso ocorrer, registrar as duas medicoes com data e hora, e nao
  reescrever a baseline.

## Rastreabilidade

| Item da spec | Task |
|---|---|
| Remediar `sep-app` | D-1.1 |
| Gate de CI no `sep-app` | D-1.2 |
| Remediar `sep-mobile` | D-1.3 |
| Gate de CI no `sep-mobile` | D-1.4 |
| Registro da divida residual + `SEGURANCA.md` | D-1.5 |
| Baseline, back-merge e limitacoes | Gate D-1.0 e Fechamento |

Steps em [`300-dsprint-1-steps.md`](../../steps-fase-4/cross-repo/300-dsprint-1-steps.md).
