# ADR 0018 - Avaliacao do Angular 22 no web (adiar upgrade major)

## Status

Aceito (F-Sprint 19 — Fase 4)

## Contexto

O `sep-app` roda Angular **20.3.x** (baseline por ADR 0003, majors so com ADR) sobre Node 20 e
TypeScript 5.9. No fechamento da Fase 3 ficou registrada uma divida de tooling: ocorrencias de
`npm audit` exclusivas de dev tooling (contagem historica: dez), collection congelada e tipos de
borda sem validacao automatizada. A F-Sprint 19 saldou essa divida dentro da serie 20 e esta ADR
decide, com evidencia, se o Angular 22 deve ser adotado em trabalho posterior ou adiado.

### Evidencia local (F-19, 2026-07-16, branch `feature/fsprint-19-hardening-tooling-contrato-web`)

- **Audit antes do hardening** (baseline Gate F-19.0): 9 ocorrencias — 0 critical, 5 high,
  1 moderate, 3 low — **todas em dev tooling** (`piscina`, `vite`, `esbuild`, `ws`, `sigstore`,
  `brace-expansion`, `@babel/core`, via `@angular/build`/`@angular/cli`/`happy-dom`/`jsdom`).
  `npm audit --omit=dev`: **zero** — nenhuma vulnerabilidade alcanca o bundle de runtime.
- **Audit depois do hardening** (Task F-19.2, Angular 20.3.26 + build/CLI 20.3.32 + lockfile
  regenerado): **0 ocorrencias totais**. Nao restou advisory nem residuo de tooling.
- Suite pos-hardening: Vitest 580/580, Playwright 31/31, lint/format/build verdes, `npm ci`
  sem `--force`/`--legacy-peer-deps`.

Conclusao da evidencia: **nao existe hoje pressao de seguranca** que justifique sair da serie 20.
As ocorrencias historicas foram corrigidas por patch/minor dentro da propria serie.

### Compatibilidade oficial (angular.dev, consultado em 2026-07-16)

| Angular | Node.js | TypeScript | RxJS | Suporte |
|---|---|---|---|---|
| 20.0.x-20.3.x | `^20.19.0 \|\| ^22.12.0 \|\| ^24.0.0` | `>=5.8 <6.0` | `^6.5.3 \|\| ^7.4.0` | **LTS ate 2026-11-28** |
| 21.x | `^20.19.0 \|\| ^22.12.0 \|\| ^24.0.0` | `>=5.9 <6.0` | idem | LTS (active ate 2026-06-03) |
| 22.0.x | `^22.22.3 \|\| ^24.15.0 \|\| ^26.0.0` | `>=6.0 <6.1` | idem | Active (release 2026-06-03) |

Implicacoes do Angular 22 para a stack atual:

- **Node 20 sai do range suportado** — exige Node 22+ no CI (`ci.yml` roda Node 20) e nas
  maquinas locais. Node 20 ja saiu de maintenance upstream (2026-04), o que por si so e um
  gatilho de infraestrutura independente do Angular.
- **TypeScript 6.0 obrigatorio** — major do TS com impacto em `typescript-eslint`,
  `@analogjs/*` e nos proprios fontes.
- **Cadeia de teste inteira em major**: `@analogjs/vite-plugin-angular`/`vitest-angular` 2.6.x
  exigem Angular 21+ e pareiam com **Vitest 4**; hoje o repo usa @analogjs 1.22.x + Vitest 3.2.x
  (pinados pelo Dependabot exatamente por isso).
- **`angular-eslint` 22.x** e **`@testing-library/angular` 19.x** acompanham a major.
- **Playwright** e independente (1.61.x ja instalado); **MSW/happy-dom/jsdom** sem acoplamento
  direto ao Angular, sem bloqueio.
- **CI**: alem do bump de Node, cache/actions e baseline de coverage precisam de revalidacao.

### Efeito sobre o mobile (nao acopla esta decisao)

O `sep-mobile` (Ionic 8 + Angular 20 + Capacitor 8, ADR 0015; Node 22 ja adotado no repo) tem a
propria cadeia de compatibilidade (Ionic/Capacitor x Angular). Esta ADR cobre **somente o web**;
qualquer major no mobile exigira avaliacao propria.

## Decisao

**ADIAR** o upgrade para Angular 22. A baseline do web permanece **Angular 20.3.x endurecida**
(F-19.2): audit zerado, `npm ci` limpo, contrato validado por `contract:check`.

Justificativa:

1. Zero advisory apos o hardening — o argumento de seguranca que motivava a avaliacao caiu.
2. Angular 20 esta em **LTS ate 2026-11-28**: ha janela segura para uma migracao planejada.
3. Angular 22 nao e um bump isolado: arrasta Node 22, TypeScript 6 e majors de toda a cadeia de
   teste (@analogjs 2.x, Vitest 4, angular-eslint 22, Testing Library 19). Custo estimado de
   sprint dedicada, com risco de regressao em 85 arquivos de teste e na pipeline.
4. A prioridade da Fase 4/5 e o marco `v1.0-local` e o go-live (Celcoin real, AWS, lojas);
   uma major de framework agora competiria com o caminho critico sem beneficio funcional.

### Alternativas consideradas

- **Adotar Angular 22 em sprint dedicada agora** — rejeitada: sem driver de seguranca ou
  funcionalidade; consome janela do go-live.
- **Migrar para Angular 21 como passo intermediario** — rejeitada como acao imediata (mesma
  ausencia de driver; Node 20 continua suportado na 21, mas a janela active da 21 ja fechou);
  permanece como **rota recomendada** na migracao futura (`ng update` 20→21→22).
- **Substituir tooling incompativel pontualmente** (ex.: trocar Analog/Vitest) — rejeitada:
  reescreveria a base de testes sem eliminar a major do framework.
- **Manter Angular 20 endurecido** — **aceita**.

## Consequencias

- Dependabot continua com ignore de majors (`@angular/*`, `@analogjs/*`, `vitest`,
  `angular-eslint`), estritamente alinhado a esta justificativa (`.github/dependabot.yml`).
- Advisories residuais aceitos: **nenhum** (audit total = 0 em 2026-07-16). Se surgir advisory
  de dev tooling sem correcao na serie 20, registrar aqui e reavaliar; advisory de **runtime**
  high/critical sem correcao na serie 20 reabre esta ADR imediatamente.
- O `contract:check` (F-19.1) e a suite continuam como gate de regressao para qualquer
  atualizacao de dependencia.

### Gatilhos de reabertura (o que ocorrer primeiro)

1. **Planejamento da Fase 5 de infraestrutura/CI** — o bump de Node 20→22 da esteira e o momento
   natural de agendar a sprint de migracao.
2. **2026-09-30** — data de revisao programada: distancia confortavel do fim do LTS do Angular 20
   (2026-11-28) para executar a migracao dentro da janela suportada.
3. Advisory de runtime high/critical sem correcao na serie 20 (imediato).
4. Dependencia nova necessaria ao produto exigindo Angular 21+.

### Pre-condicoes objetivas da futura sprint de migracao

- Node 22 LTS no CI e nas maquinas de dev (web); TypeScript 6.0.
- Rota `ng update` 20→21→22 com suite verde em cada degrau.
- @analogjs 2.6+, Vitest 4, angular-eslint 22, @testing-library/angular 19 atualizados em grupo.
- `contract:check`, Vitest, Playwright, lint/format/build e `npm audit` verdes na instalacao
  limpa (`npm ci`, sem bypass de peers).
- Responsavel tecnico: Devs Plenos Frontend, com follow-up explicito no planejamento da fase.

## Referencias

- [angular.dev/reference/versions](https://angular.dev/reference/versions) e
  [angular.dev/reference/releases](https://angular.dev/reference/releases) (2026-07-16).
- ADR 0003 (stack Angular 20), ADR 0015 (baseline mobile).
- Evidencias locais: Gate F-19.0 (audit before) e Task F-19.2 (audit after) na branch
  `feature/fsprint-19-hardening-tooling-contrato-web` do `sep-app`.
