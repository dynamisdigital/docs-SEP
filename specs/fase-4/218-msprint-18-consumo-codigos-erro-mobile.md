# Spec 218 - M-Sprint 18 - Consumir o codigo de erro no mobile

## Metadados

- **ID da Spec**: 218
- **Titulo**: M-Sprint 18 - Criar o helper de erro que o `sep-mobile` nunca teve, unificar os 9 casts
  inline e trocar ramificacao por status por ramificacao por codigo
- **Status**: **MERGEADA em `develop` e `main`** (2026-09-09). PR **#165** (squash `fe77544`,
  back-merge `1efc58e`) e PR **#166** (`d62dd20`); as duas pontas na mesma arvore `ed20fae`,
  conferido por conteudo. 6 commits.
  Vitest **527/70 -> 575/72**, Playwright **41 -> 45**, format/lint/SCSS/build/cap sync/APK verdes.
  **O `npm audit` foi zerado no recorte high** (commit `147508b`): 22 vulnerabilidades (1 low, 13
  moderate, 8 high) -> **10 (0 low, 10 moderate, 0 high)**, por `npm audit fix` **sem `--force`** e
  com `package.json` intacto. O gate `--audit-level=high` sai 0 e todos os criterios de aceite da
  spec estao cumpridos. Descricao em
  [`SPRINT-M-18-PR.md`](../../repos/sep-mobile/SPRINT-M-18-PR.md).
- **Fase do produto**: Fase 4 - produto novo (consome superficie de contrato nova); sem jornada, rota,
  endpoint ou contrato novo. **Sem ADR previsto**
- **Trilha**: Mobile (`sep-mobile`)
- **Origem**: recomendacao **P1** do [`DIAGNOSTICO-PRODUTO.md`](../../docs-sep/DIAGNOSTICO-PRODUTO.md),
  lado mobile
- **Depende de**: [`036`](./036-sprint-36-codigos-erro-no-fio.md) **integrada em `develop`**.
  Independente da [`126`](./126-fsprint-26-consumo-codigos-erro-web.md) — as duas consomem o mesmo
  contrato e podem correr em paralelo
- **Dependencia condicional (nova em 2026-09-01)**: a 036 publica um **subconjunto** da taxonomia, nao
  ela inteira (perimetro; ver 036 §Decisao tecnica principal). A Task 218.3 ramifica no login, cujos
  desfechos hoje sao `401` e `423`; o `AUTH-423-001` esta previsto na Task 36.4, mas o `401` **nao tem
  codigo declarado** e continua sem depois da 036 (e um dos 10 handlers sem codigo). O Gate M-18.0
  confere quais desfechos do login ganharam codigo antes de dimensionar a 218.3 — se so o `423`
  ganhou, a Task encolhe
- **Revisada em**: 2026-09-01, junto com a [`036`](./036-sprint-36-codigos-erro-no-fio.md)
- **Desbloqueia**: nada. Reduz divida de duplicacao e alinha o mobile ao padrao do web
- **Responsavel principal**: Devs Plenos Mobile

## Numeracao

Consome **218** (M-Sprint 18). A faixa vigente por fase em AGENT.md fixa a Fase 5 em **50-99**;
esta spec nao renumera a publicacao em lojas (M-50/M-51).

## Medicao da preparacao (2026-09-09)

Esta secao atualiza as estimativas historicas abaixo. Backend Sprint 36 integrado em develop;
mobile em `d82caaa`, back-merge sem conflitos e com conteudo igual a `origin/main@deb5b72`.
Baseline: **527/70 Vitest, 41 Playwright**, format/lint/SCSS/build PWA/cap sync/APK verdes;
**audit 20 (1 low, 11 moderate, 8 high)**, impeditivo para declarar baseline verde.

Os nove casts em oito arquivos continuam presentes. O ganho de discriminacao esta no TOTP:
`MFA-400-003/004` encerram a tentativa e `MFA-400-002` permite redigitar. Login ja navega no
`423`; adicionar ramo identico por `AUTH-423-001` nao agrega comportamento. O Gate pode
manter esse ramo por status, sem inventar codigo para o `401`.

**TOTP em branco** e recusado por bean validation **sem codigo**; nao e fixture valida de
`MFA-400-002`. Sao **13 de 17 handlers** sem taxonomia (medicao da Sprint 36), nao os 10 da
estimativa inicial. MSW nao tem `/auth/totp/verify`, e a cobertura browser exige fixture
explicita e isolada; ela nao equivale a smoke real. Plano executavel e resultados nos steps.

## Objetivo

O mobile esta uma camada atras do web: nao tem helper de extracao de erro, entao cada tela faz o cast
por conta propria. Publicar o codigo (036) sem consertar isso espalharia a leitura de `codigo` por
mais nove lugares.

Esta sprint faz as duas coisas na ordem certa: **primeiro o helper, depois o consumo**.

## Ancoras verificadas (2026-09-01)

### 1. O mobile nao tem `api-error.ts`

`src/app/core/api/` contem exatamente dois arquivos: `api.models.ts` e `support-reference.ts`. O web
tem `core/api/api-error.ts` desde a F-22, com dois helpers e um docblock de 30 linhas explicando por
que a extracao precisa de guarda. **Nada disso existe no mobile.**

### 2. Sao NOVE casts inline, nao seis

```bash
grep -rn "as ApiErrorResponse" sep-mobile/src/app --include=*.ts | grep -v "\.spec\.ts"
```

| Arquivo | Linha |
|---|---|
| `features/authenticated/profile/change-password/change-password.component.ts` | `:104`, `:115` |
| `features/authenticated/step-up/step-up.component.ts` | `:91` |
| `features/tomador/cobranca/renegociacao-detail.component.ts` | `:257` |
| `features/tomador/credito/open-finance.component.ts` | `:162` |
| `features/tomador/credito/proposta-create.component.ts` | `:138` |
| `features/tomador/credito/proposta-detail.component.ts` | `:109` |
| `features/tomador/formalizacao/contrato-detail.component.ts` | `:485` |
| `features/tomador/onboarding/onboarding-error.ts` | `:11` |

**Correcao de premissa**: o levantamento inicial deste plano contou **6**, usando padrao de busca mais
estreito. O numero medido e **9**, em 8 arquivos. Duas assinaturas de tipo distintas convivem
(`| null | undefined` e `| undefined`), o que ja e sintoma de copia sem fonte unica.

### 3. `ApiErrorResponse` esta limpo

`core/api/api.models.ts:70-77` tem `timestamp, status, error, message, path, traceId?`. Sem `codigo`.

### 4. O login ramifica por status

`features/public/login/login.component.ts:67-69` faz `if (status === 401) ... else if (status === 423)`.
Mesmo padrao que o web tinha antes da F-21, e mesma limitacao: o status e tudo o que ha.

### 5. `support-reference.ts` e o irmao a espelhar

Ele ja narra o campo antes de usar: le `error.error.traceId`, valida com `VALID_TRACE_ID` e so entao
monta `"Codigo de suporte: ..."`. O helper novo segue esse padrao — **validar antes de usar** —, e nao
o dos 9 casts, que confiam no shape.

Vale notar o encaixe de produto: hoje o usuario reporta so o `traceId`. Com o codigo publicado, o par
`codigo + traceId` vira a referencia de suporte completa, que e o ganho colateral que o diagnostico
nomeia no P1.

## Decisao tecnica principal — o helper vem antes do consumo, e substitui os 9

A ordem inversa e a armadilha: ler `codigo` direto nos 9 call sites entrega a feature e **dobra** a
duplicacao, deixando 9 lugares que leem dois campos sem guarda em vez de um.

A M-17 ja pagou essa conta no `errorInterceptor`, e a F-24 pagou no `estabilizar()` — que o Gate mediu
como **38 definicoes de um helper e 42 de outro**, contra o registro anterior que dizia "terceira
copia". Duplicacao de helper de teste custou uma sprint inteira para desfazer. Nove casts de producao
custam mais.

Por isso a Task 218.2 e pre-requisito das seguintes, e a definicao de pronto dela e **zero** ocorrencia
de `as ApiErrorResponse` fora do helper — verificada por `grep` no checkpoint, nao por memoria.

## Escopo

### Dentro

1. `codigo?` em `ApiErrorResponse`.
2. `core/api/api-error.ts` novo, substituindo os 9 casts.
3. Ramificacao por codigo no login e nos desfechos de erro que hoje so tem status.
4. Mock MSW emitindo `codigo`.
5. Testes e mutacao.

### Fora

- **Portar o `contract:check` para o mobile.** Follow-up ja nomeado no
  [`STATE.md`](../../docs-sep/STATE.md), com custo proprio (o script, o snapshot, o
  `consumed-contracts.json` e o step de CI). Sem ele esta sprint segue verificavel por teste e
  mutacao — o que ela **nao** tem e gate automatico contra divergencia de contrato, e isso fica
  declarado, nao disfarcado.
- **Plugar o MSW no Vitest.** Tambem follow-up aberto. A Task 218.4 mexe no mock para o Playwright,
  que e onde ele ja roda.
- **Dicionario de copy por codigo.** Mesma decisao da [`126`](./126-fsprint-26-consumo-codigos-erro-web.md):
  o codigo escolhe o ramo, o corpo continua fornecendo o texto onde e autoritativo.
- Escopo adiado pelo Gate M-16.0 (matching, aporte `POST`, chaves Pix). Continua exigindo persona
  `FINANCEIRO`, que o mobile nao tem.

## Criterios de aceite

1. Vitest e Playwright **>= baseline medida no Gate M-18.0**, 0 falhas. Ultimo registro: **527/70** e
   **41** e2e — a M-17 levou o smoke a 41 verdes depois de quatro meses vermelho, entao regressao ali
   e perda de terreno conquistado.
2. `lint`, `lint:scss`, `format:check`, `build`, `audit` verdes; `cap sync android` e
   `gradlew assembleDebug` OK.
3. `grep -rn "as ApiErrorResponse" src/app --include=*.ts | grep -v spec` devolve **vazio** fora de
   `core/api/api-error.ts`.
4. **Mutacao obrigatoria**: remover a guarda de `typeof` do helper tem de reprovar; reverter a
   ramificacao por codigo para status tem de reprovar.
5. Teste provando que corpo **sem** `codigo` continua funcionando (backend antigo) e que `codigo`
   nao-string nao lanca.
6. O mock emite `codigo` **igual ao que o `sep-api` emite**, conferido contra o catalogo da 036. Mock
   mais permissivo que producao e a direcao perigosa da assimetria — a M-17 achou exatamente isso em
   tres pontos e teve de corrigir.
   **Isto inclui a ausencia**: onde a 036 deixou o codigo fora do perimetro, o mock tem de emitir
   corpo **sem** `codigo`. Mock que inventa codigo para um desfecho que producao entrega sem codigo e
   a mesma assimetria perigosa, na direcao mais dificil de notar — o teste passa, e o comportamento
   real e outro.

## Riscos e limitacoes

- **Sem `contract:check`, nada impede o mock de divergir do backend** a nao ser a conferencia manual
  do criterio 6. Esse e o risco central desta sprint, e e estrutural do repo, nao introduzido aqui.
- **Nove call sites em 8 arquivos, com duas assinaturas de tipo diferentes.** O Gate M-18.0 remede
  antes de comecar; se o numero mudou, a Task 218.2 muda de tamanho, nao de natureza.
- **Smoke contra backend real `:8080` segue nao executado**, como em todas as sprints mobile desde a
  M-13. Declarar, nao simular.
- **A build PWA e a nativa compartilham o codigo**, entao a mudanca vale para as duas; o APK
  `dev-offline` com MSW e o caminho de conferencia manual, ja usado no smoke da M-13.

## Rastreabilidade

| Item da spec | Task |
|---|---|
| `codigo?` em `ApiErrorResponse` | 218.1 |
| `core/api/api-error.ts` novo, os 9 casts unificados | 218.2 |
| Ramificacao por codigo no login e desfechos de erro | 218.3 |
| Mock MSW emitindo `codigo` fiel ao catalogo | 218.4 |
| Testes e mutacao | 218.5 |
| Baseline, recontagem dos casts, gates declarados | Gate M-18.0 e Fechamento |

Fecha, ao lado da [`036`](./036-sprint-36-codigos-erro-no-fio.md) e da
[`126`](./126-fsprint-26-consumo-codigos-erro-web.md), a recomendacao **P1** do
[`DIAGNOSTICO-PRODUTO.md`](../../docs-sep/DIAGNOSTICO-PRODUTO.md).

Steps criados em 2026-09-09: [`218-msprint-18-steps.md`](../../steps-fase-4/mobile/218-msprint-18-steps.md).
As cinco Tasks foram executadas em 2026-09-09.

## Execucao — o que a sprint mediu e a spec nao previa

1. **Os nove casts eram nove mesmo** (8 arquivos), confirmando a §Ancora 2 contra a estimativa
   inicial de seis.
2. **O smoke real contra `:8080` FOI executado** — primeira vez numa sprint mobile desde a M-13,
   contrariando o risco declarado na spec. Confirmou `MFA-400-004` no fio e, sobretudo, que **codigo
   em branco volta SEM campo `codigo`** (bean validation `@NotBlank`), como a §Medicao ja corrigia.
   O `401` de credencial tambem volta sem codigo, o que validou o mock.
3. **O ramo do login ficou por status**, conforme a §Dependencia condicional previa: o `423` ja
   navega e `AUTH-423-001` nao mudaria acao. A Task 218.3 encolheu, como o Gate autorizava.
4. **Achado fora do plano**: a normalizacao de mensagem em branco no helper fecha um defeito latente
   de UI — `erro.set('')` com template `@if (erro(); as msg)` deixava a **tela muda** depois de um
   erro. Nao era o objetivo da sprint; caiu junto.
5. **Duas descobertas de ambiente**: `ion-button` com `routerLink` renderiza como **link**, nao
   button; e nenhum spec deste repo renderizava `ion-input`, cujo `connectedCallback` quebra no
   happy-dom por falta de `observe` em `MutationObserver`/`IntersectionObserver`.
6. **10 mutacoes, 10 mortas**, sendo **duas mortas somente pelo Playwright** — a prova concreta de
   que, sem MSW no Vitest, nenhum teste unitario cobre `handlers.ts`.
