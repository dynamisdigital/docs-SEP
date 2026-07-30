# Steps - F-Sprint 22 - Contrato de erro verificavel e follow-ups da F-21 no web

**Spec de origem**: [`122-fsprint-22-contrato-erro-followups-web.md`](../../specs/fase-4/122-fsprint-22-contrato-erro-followups-web.md)

**Status**: planejada (criada em 2026-07-30). Nenhuma Task iniciada.

**Sprint irma**: [`034`](../backend/034-sprint-34-steps.md) (Sprint backend 34). **As Tasks F-22.1 a
F-22.5 sao independentes dela**; a **F-22.6 exige a 34 mergeada em `develop`** e o `sep-api` no ar
para regenerar o snapshot OpenAPI. Isso difere do par 33/F-21, onde o mock bastava: aqui o
`contract:check` valida contra o snapshot versionado, que so tera o endpoint novo depois da 34.

**Objetivo geral**: tornar o contrato de erro verificavel em CI (hoje o `423` pode sumir do backend
sem falhar nada) e propagar para as telas publicas restantes a correcao que a F-21 fez no login.

**Esforco total estimado**: 2-2,5 dias de Dev Pleno Frontend.

**Repos de destino**:

- `sep-app`: `scripts/contract-check.mjs` + spec, `contracts/consumed-contracts.json`, componente
  `verify-totp` (+ spec nova), `access-denied`, `redirect-to-app`, remocao do `RegisterComponent`,
  helper novo em `core/api/`, specs do interceptor e do login. Na F-22.6: `contracts/openapi.snapshot.json`
  e `.meta.json`, `account-locked`, `login`.
- `docs-SEP`: este step, a spec, indices e PR description; **Git manual**.

**Branch sugerida**: `feature/fsprint-22-contrato-erro-followups-web`, criada de `develop` atualizado
(que ja contem a F-Sprint 21 `b3e3f90` e o merge `main -> develop`).

**Pre-requisitos**:

- F-Sprint 21 mergeada em `develop` e `main` (feito em 2026-07-30, PR #113/#114).
- Para a F-22.6 apenas: Sprint 34 mergeada em `develop`.

## Estado atual verificado (2026-07-30)

Levantado antes de planejar; qualquer divergencia encontrada no Gate F-22.0 invalida o desenho abaixo.

### Contrato

- `consumed-contracts.json`: **85 operacoes**, 90 tipos, **8 `knownGaps`**. `npm run contract:check`
  reporta **29 lacunas conhecidas**, exit 0.
- **Todas as operacoes declaram so `sucesso`**; nenhuma declara status de erro. `verificarStatusDeSucesso`
  (`contract-check.mjs:125-131`) valida presenca de `op.sucesso` e nada mais.
- **`Retry-After` e inalcancavel pelo checker**: `verificarHeadersDaResposta` (`:107-123`) itera
  `operacao.sucesso` no loop externo (`:108`), e o header so existe em `423`/`429`. Nao ha sintaxe no
  descriptor para declarar header por status de erro.
- `responseHeaders` e lista plana e e usada por **uma unica operacao**: `contratos.documentoAssinado`
  (`X-Document-Hash-Sha256`, `Content-Disposition`). Migrar para mapa por status custa uma linha.
- **Stale gap nao e detectado**: `existeGapDeHeader` (`:301-308`), `existeGapDeHeaderDeResposta`
  (`:310-317`), `existeGapDeTipoDeCampo` (`:319-323`) e `existeGapDeEnum` (`:325-329`) sao `.some()`
  puros, sem registro de consumo. O caminho feliz nem os consulta.
- O `knownGaps[0]` (`X-Step-Up-Token`, `appliesTo: "*"`) produz **18 das 29 lacunas**.
- `contract-check.spec.ts`: **21 testes** sobre a funcao pura `verificarContratos`, com fixtures
  minimas (`openapiComSchema`, `descriptorBase`), sem I/O. Roda no Vitest
  (`vitest.config.mts` inclui `scripts/**/*.spec.ts`). **Zero testes de status de erro; zero de stale
  gap.**
- Snapshot atual gerado de `sep-api@a613c6c`: **nao contem `Retry-After`** nem
  `/api/v1/auth/politica-lockout`; `423`/`429` ja documentados em `/auth/login`.

### Telas

- `verify-totp.component.ts:53-56` — callback pelado, literal:
  `error: () => { this.loading.set(false); this.errorMessage.set('Codigo TOTP invalido ou expirado.'); }`.
  **Sem parametro, sem `instanceof`, sem ler o corpo.** `400`, `423`, `429`, rede e `5xx` exibem todos
  a mesma frase.
- **`verify-totp` nao tem cobertura nenhuma**: sem Vitest spec, sem e2e, e **`src/mocks/handlers.ts`
  nao tem nenhum handler de `/auth/totp/*`**. Escrever a spec exige `server.use(...)` por teste (padrao
  da F-21) e stub de `AuthService.pendingMfaChallenge`, que o componente le **no construtor** — sem o
  stub todo teste cai no ramo `challengeAusente`.
- `access-denied.component.ts:8-9` — **ja tem** `<main>` + `<section aria-labelledby>`. **O gap e so
  de foco**: `export class AccessDeniedComponent {}`, corpo vazio, `<h1>` sem `tabindex="-1"`. E
  destino de redirect por dois caminhos: `error.interceptor.ts:26-28` (`403`) e `role.guard.ts:21`.
  Sua spec tem **1 teste**, que nao cobre landmark nem foco.
- `redirect-to-app.component.ts:13` — `<section>` sem `<main>`, `<h1>` sem `id`, classe vazia. **Nao e
  destino de redirect automatico** (e alcancado por `routerLink` de 3 lugares), entao o gap aqui e o
  landmark, nao o foco. Nao tem spec.
- `verify-totp.component.html:1` — `<section>` solto, sem `<main>`.
- Estas duas sao exatamente as paginas que a F-21 registrou em
  `account-locked.component.spec.ts:56-59` como follow-up.
- `step-up.component.ts:17` tambem abre com `<section>`, mas e filha do `ShellComponent`, que provê o
  `<main>` — **nao e gap**.

### `RegisterComponent`

- **Codigo morto confirmado**: `public.routes.ts:22-27` faz `/register` carregar o
  `RedirectToAppComponent`, com o comentario *"Sprint 5: register publico substituido pela tela de
  redirect (canalizacao por perfil)"*. Nenhuma rota carrega o `RegisterComponent`.
- 4 arquivos orfaos (`.ts`, `.html`, `.scss`, `.spec.ts`), com **5 testes verdes** provando
  comportamento de uma tela que ninguem consegue abrir.
- `AuthService.register()` (`auth.service.ts:60-62`) **nao tem outro chamador**; a operacao
  `auth.registrar` esta declarada no descriptor.
- **Os 3 links para `/register` funcionam como projetado** e nao sao codigo morto:
  `login.component.html:94` e `landing.component.html:22,89`. Travados por
  `landing.component.spec.ts:20` e pelo e2e `golden-path.spec.ts:10-14`, que afirma o heading "Como
  cadastrar sua conta". **Nao remover.**

### Duplicacao de extracao de mensagem

- **7 helpers** com o corpo identico de duas linhas
  (`const apiErr = err.error as ApiErrorResponse | undefined; return apiErr?.message ?? padrao;`):
  `onboarding-error.ts:9`, `credito-error.ts:8`, `backoffice-format.ts:126`, `cobranca-format.ts:58`,
  `credora-format.ts:41`, `formalizacao-format.ts:51`, `pix-format.ts:79`. **56 chamadas, 35
  componentes.**
- Os nomes e comentarios **diferem** — o follow-up dizia "byte-identicos", o que e impreciso: cada
  comentario documenta *quais status aquele dominio trata localmente*, informacao do call site.
- Mais **9 sites inline** em 6 componentes (`admin/parametros` ×3, `admin/users` ×4, `profile/change-password`,
  e o `login.component.ts:31`). O feature admin/governanca nao tem `*-error.ts`/`*-format.ts`.
- **Nenhum spec chama os helpers diretamente**: `grep "mensagem.*Erro(" --include=*.spec.ts` -> 0. Sao
  exercitados so via componentes.
- `login.component.ts` e caso a parte: e o unico que faz **switch por status**, nao
  `apiErr?.message ?? padrao`. **Nao fundir os dois problemas.**

### Baseline medida

- Vitest **685 / 88 arquivos**, exit 0.
- Playwright **38 testes / 11 arquivos** (`--list`).
- `contract:check` exit 0, 85 operacoes, 29 lacunas.
- **`npm run e2e` NAO roda no CI** (`CI-APP` faz format/contract/lint/scss/coverage + build). Um e2e
  novo nao e gate de merge.
- `vitest.config.mts` usa `pool: 'threads'` de proposito — o pool `forks` default segfalta acima de
  ~24 specs por vazamento do happy-dom. **Nao mudar.**

## Decisoes da sprint

- **`erros` so onde ha ramo por status.** Preencher as 85 operacoes seria cerimonia sem assercao: 83
  usam `apiErr?.message ?? padrao`, que nao discrimina. Declarar `erros` nelas cria manutencao sem
  proteger nada. A regra registrada no descriptor: *se a tela ramifica por status, o status entra em
  `erros`*. Hoje isso e `auth.login` e, apos a F-22.2, `mfa.totpVerify`.

- **`responseHeaders` vira mapa por status.** E o unico jeito de o `Retry-After` ser alcancavel — hoje
  o loop e sobre `operacao.sucesso`. Migracao de uma linha (so `contratos.documentoAssinado` usa).
  **Alternativa rejeitada**: campo paralelo `errorResponseHeaders`, que criaria duas semanticas de
  header no mesmo descriptor.

- **Stale gap vai para categoria propria, com exit 1 so contra o snapshot versionado.** Um gap
  obsoleto e afirmacao falsa sobre o backend e o custo de remover e uma linha de JSON — merece
  bloquear. Mas quem roda `SEP_OPENAPI_SCHEMA=<url>` contra um ambiente mais novo veria vermelho por
  um gap que ainda e real no snapshot. Entao: `obsoletos[]` separado de `falhas[]`/`lacunas[]`, com
  exit 1 apenas quando a fonte e o snapshot padrao. **Cuidado**: `verificarOperacao` retorna cedo
  quando o path nao existe, entao os gaps de uma operacao ja falhada apareceriam como stale —
  suprimir, para nao reportar dois erros pela mesma causa.

- **Consolidacao do helper por alias, nao por churn.** Os 7 helpers de dominio passam a delegar a
  `core/api/`, **preservando nome e comentario** — 0 call sites alterados. Substituir as 56 chamadas
  por um nome unico apagaria 7 comentarios especificos e mexeria em 65 pontos sem nenhuma assercao
  direta protegendo (nenhum spec chama os helpers). O helper novo ganha spec propria, que hoje nao
  existe para nenhum deles.

- **Os links "Criar conta" ficam.** Levam a `/register` -> `RedirectToAppComponent` ("Como cadastrar
  sua conta"), comportamento desejado desde a Sprint 5 e travado por spec e e2e. O codigo morto e o
  componente, nao a rota nem os links. O rotulo prometer formulario e entregar pagina informativa e
  **follow-up de UX**, nao defeito tecnico — e mexer nele quebraria `landing.component.spec.ts:20`.

- **`Retry-After` no `429` e o item mais barato do lado web.** O `errorInterceptor` **nao navega** no
  `429` (`error.interceptor.ts:36-37`), entao o `HttpErrorResponse` — com headers — ja chega intacto ao
  `error:` do login. E uma linha em `mensagemDeErroDeLogin` lendo `erro.headers.get('Retry-After')`
  para substituir o literal "cerca de 1 minuto". Ja o `423` navega e descarta.

- **`/account-locked` usa a politica, nao o header.** A pagina renderiza depois do redirect e e
  alcancavel por URL direta — nao ha header nenhum nesse caso. A chamada ao `politica-lockout` deve
  falhar em silencio (`catchError(() => of(null))`, padrao de `auth.service.ts:85-88`) e cair na copy
  estatica: **jamais** deixar uma pagina de erro depender de uma chamada que pode falhar.

- **Sem ADR**: mudanca de cobertura do checker, nao de arquitetura.

## Fora de escopo

- Remover os links "Criar conta" (3 ocorrencias) — funcionam como projetado.
- Reativar auto-cadastro no web (exige decisao de produto com KYC/onboarding).
- Declarar `erros` nas 83 operacoes sem ramo por status.
- Unificar `idCurto` (6 arquivos) e `formatarMoeda` (6 arquivos, **duas assinaturas**).
- Estrategia "C" de consolidacao (65 pontos de churn).
- Store para propagar `Retry-After` ate `/account-locked`.
- `sep-mobile` — os follow-ups de la sao **M-Sprint 17**.
- Rodar Playwright no CI.

## Protocolo obrigatorio por Task

1. Executar somente a Task liberada pelo usuario.
2. Confirmar codigo e contrato atuais antes de editar.
3. Implementar a menor mudanca coerente com a spec e este step.
4. Escrever/ajustar teste observavel para o comportamento alterado.
5. Rodar verificacoes proporcionais por bloco (`npm test`, `lint`, `contract:check` conforme a Task).
6. Parar em checkpoint pre-commit com arquivos, testes, riscos e mensagem sugerida.
7. Aguardar aprovacao antes de `git add`/`git commit`; usar somente paths especificos.
8. Nao iniciar a Task seguinte sem ordem explicita.

**Skills obrigatorias durante a implementacao**: `coding-guidelines`, `clean-code`,
`sep-web-mutation-verified-testing` (varios testes deste repo ja passaram provando nada; a F-21 matou
30 mutantes).

## Rastreabilidade spec 122 -> steps

| Task da spec 122 | Steps |
|------------------|-------|
| 1. Checker com status de erro + stale gap | F-22.1 |
| 2. `verify-totp` por status + spec nova | F-22.2 |
| 3. Foco e landmarks | F-22.3 |
| 4. Remover `RegisterComponent` + consolidar helper | F-22.4 |
| 5. Dividas de teste da F-21 | F-22.5 |
| 6. Consumo da Sprint 34 | F-22.6 |
| Gates de cadeia, baseline e destrave do Playwright | F-22.0 |

## Ordem de execucao

```text
F-22.0 prechecks + baseline + destrave do Playwright
  -> F-22.1 checker verifica status de erro e reporta gap obsoleto
  -> F-22.2 verify-totp traduz erro por status (+ spec nova, que nao existe)
  -> F-22.3 foco em access-denied + landmark em verify-totp e redirect-to-app
  -> F-22.4 remove RegisterComponent orfao + helper unico em core/api/
  -> F-22.5 dividas de teste da F-21
  -> F-22.6 [GATE: Sprint 34 em develop] politica-lockout + Retry-After + snapshot + knownGaps
```

F-22.1 vem primeiro porque a F-22.2 declara `mfa.totpVerify` em `erros`, o que so faz sentido com o
checker ja sabendo ler o campo.

---

## Gate F-22.0 - Prechecks, baseline e destrave do Playwright

**Objetivo**: confirmar cadeia Git, baseline verde e ambiente capaz de rodar e2e antes de tocar em
contrato.

### Step 122.0.1 - Confirmar cadeia Git do `sep-app`

```bash
cd <sep-app-root>
git fetch --all --prune
git status --short --branch
git rev-list --left-right --count origin/main...origin/develop
```

F-Sprint 21 (`b3e3f90`) presente em `origin/develop`; `main` integrada. Criar
`feature/fsprint-22-contrato-erro-followups-web` de `develop` atualizado.

### Step 122.0.2 - Destravar o Playwright

A maquina de dev nao consegue rodar e2e como `mauricio`: o pacote exige
`chromium_headless_shell-1228` e o cache do usuario tem `1217`; alem disso `test-results/`,
`playwright-report/` e `node_modules/.vite-temp` estao root-owned de execucao anterior em container.

```bash
sudo rm -rf test-results playwright-report node_modules/.vite-temp
npx playwright install chromium
```

**Por que e gate e nao task**: sem isso a baseline de 38 e2e nao e verificavel, e a sprint nao teria
como provar que nao regrediu. Como o CI nao roda Playwright, a verificacao local e a **unica**.

### Step 122.0.3 - Rodar baseline

```bash
npm ci
npm run format:check && npm run lint && npm run lint:scss
npm run contract:check && npm test && npm run build
npm audit --omit=dev
npx playwright test
```

Numeros de partida: Vitest **685 / 88**, Playwright **38 / 11**, `contract:check` 85 operacoes e **29
lacunas**, audit 0. Anotar vermelho preexistente antes de editar; nunca corrigir de carona.

### Step 122.0.4 - Reconfirmar o que a Sprint 34 fechou

Conferir se a Sprint 34 ja foi mergeada e, se sim, quais `knownGaps` deixaram de ser reais. Isso muda
o que a F-22.1 precisa declarar e determina se a F-22.6 e executavel nesta sprint.

**Por que e gate**: o desenho da F-22.6 depende disso, e a F-22.1 nao deve declarar `erros` para algo
que o snapshot ainda nao documenta.

### Definicao de pronto do Gate F-22.0

- [ ] Cadeia Git conferida e branch criada de `develop` atualizado.
- [ ] Playwright roda localmente; artefatos root-owned removidos.
- [ ] Baseline verde com todos os numeros registrados.
- [ ] Estado da Sprint 34 confirmado e a executabilidade da F-22.6 decidida.

---

## Task F-22.1 - Checker com opiniao sobre erro

**Objetivo**: um status de erro que o frontend trata e some do OpenAPI passa a **falhar** o
`contract:check`; e um `knownGap` ja fechado passa a ser reportado.

**Pre-requisito**: Gate F-22.0 concluido.

**Esforco**: 0,75 dia.

**Arquivos esperados**: `scripts/contract-check.mjs`, `scripts/contract-check.spec.ts`,
`contracts/consumed-contracts.json`.

### Step 122.1.1 - `erros` e `verificarStatusDeErro`

Campo `erros` no descriptor, lido com `operacao.erros ?? []` para nao quebrar as 85 operacoes atuais.
Funcao gemea de `verificarStatusDeSucesso`, chamada de `verificarOperacao`. Declarar `erros` **so** em
`auth.login` (`400`, `401`, `423`, `429`) nesta Task.

### Step 122.1.2 - `responseHeaders` por status

Migrar de lista plana para mapa `{ "<status>": [...] }`. Uma linha do JSON
(`contratos.documentoAssinado`). `verificarHeadersDaResposta` passa a iterar as chaves do mapa em vez
de `operacao.sucesso`. Teste explicito de que header declarado em status de erro **nao** e exigido nos
status de sucesso.

### Step 122.1.3 - Gap obsoleto

Trocar os quatro `.some()` por `.find()` com registro de consumo (indice do gap num `Set`), varrer os
gaps nao consumidos ao fim de `verificarContratos` e reportar em `obsoletos[]`. Exit 1 so quando a
fonte e o snapshot padrao (`origem === SNAPSHOT_PADRAO`, disponivel em `main()`). Suprimir o relatorio
para gaps cujo `appliesTo` aponta a operacao ja falhada.

### Step 122.1.4 - Testes do checker

No idioma do arquivo (fixtures minimas + assert sobre `falhas`/`lacunas`), incluindo os **controles
positivos**, sem os quais uma verificacao que nunca roda passa verde:

1. `erros:[423]` com `423` ausente -> falha; 2. com `423` presente -> verde;
3. `Retry-After` em `429` nao documentado sem gap -> falha; 4. com gap -> lacuna; 5. documentado ->
nem falha nem lacuna; 6. header de erro nao exigido no sucesso; 7. gap `enum-undocumented` de campo ja
publicado -> `obsoletos`; 8. gap `appliesTo:'*'` consumido -> **nao** e stale; 9. consumido por uma
operacao e nao por outra -> nao e stale; 10. descriptor sem `erros` -> inalterado.

### Verificacao da Task F-22.1

```bash
npx vitest run scripts/contract-check.spec.ts
npm run contract:check
```

### Definicao de pronto da Task F-22.1

- [ ] Status de erro declarado e ausente do OpenAPI falha, com controle positivo.
- [ ] `responseHeaders` por status; header de erro nao exigido no sucesso, com teste.
- [ ] Gap obsoleto reportado; `appliesTo:'*'` consumido nao vira falso positivo, com teste.
- [ ] As 85 operacoes sem `erros` seguem verdes.

### Commit sugerido

```text
feat(web): verificar status de erro e gap obsoleto no contract-check
```

---

## Task F-22.2 - `verify-totp` traduz erro por status

**Objetivo**: a tela de TOTP para de dizer "codigo invalido" para conta bloqueada, rate limit e falha
de rede.

**Pre-requisito**: Task F-22.1 concluida e aprovada.

**Esforco**: 0,5 dia.

**Arquivos esperados**: `src/app/features/public/login/verify-totp/verify-totp.component.ts`,
`verify-totp.component.spec.ts` (**nova**), `contracts/consumed-contracts.json`.

### Step 122.2.1 - Traducao por status

Padrao do `login.component.ts`: funcao pura de modulo, guarda `instanceof HttpErrorResponse`, `message`
do corpo onde e autoritativo (`423` e `5xx`), literais locais onde a copy do backend orienta menos
(`401`), ramo proprio para `0` (rede). **Nao e copia verbatim** — `400` e `401` divergem
semanticamente do login (formato do codigo vs e-mail/senha).

Manter `errorMessage.set(null)` antes do submit: e o que faz a live region reanunciar erro repetido.

**A navegacao do `423` permanece exclusiva do `errorInterceptor`** — a mensagem no componente e
fallback defensivo, como no login.

### Step 122.2.2 - Spec nova

O componente nao tem nenhuma cobertura. Usar `server.use(http.post(...))` por teste (padrao do
`login.component.spec.ts`), **nao** adicionar handlers TOTP permanentes ao mock. Stubar
`AuthService.pendingMfaChallenge` — o componente le no construtor e sem isso todo teste cai no ramo
`challengeAusente`.

Cobrir `400`, `401`, `423`, `429`, `5xx` e rede, com assert de ausencia por regex (string compara o
texto do no inteiro e deixa passar mensagem que apenas *contenha* a copy de codigo invalido).

### Step 122.2.3 - Declarar `mfa.totpVerify` em `erros`

Agora que a tela ramifica por status, o contrato passa a declarar `400`/`401`/`423`/`429`.

### Verificacao da Task F-22.2

```bash
npx vitest run src/app/features/public/login/verify-totp
npm run contract:check
```

Mutacao: trocar cada ramo pela copy de codigo invalido, um por vez — todos devem ficar vermelhos.

### Definicao de pronto da Task F-22.2

- [ ] Mensagem distinta e correta para `400`, `401`, `423`, `429`, `5xx` e rede.
- [ ] Spec nova cobre os seis casos, com assert de ausencia por regex.
- [ ] O componente **nao** navega no `423`, com teste.
- [ ] `mfa.totpVerify` declara `erros` e o `contract:check` segue verde.

### Commit sugerido

```text
fix(web): distinguir bloqueio, rate limit e rede na verificacao de totp
```

---

## Task F-22.3 - Foco e landmarks nas telas publicas restantes

**Objetivo**: fechar os dois gaps de acessibilidade que a F-21 registrou.

**Pre-requisito**: Task F-22.2 concluida e aprovada.

**Esforco**: 0,25 dia.

**Arquivos esperados**: `src/app/features/error/access-denied.component.ts` + spec,
`src/app/features/public/redirect-to-app/redirect-to-app.component.ts` (+ spec nova),
`src/app/features/public/login/verify-totp/verify-totp.component.html`.

### Step 122.3.1 - Foco em `access-denied`

Ja tem `<main>` + `<section aria-labelledby>`; falta so o foco. Aplicar o padrao de
`account-locked.component.ts:110-118`: `viewChild.required<ElementRef<HTMLHeadingElement>>`,
`tabindex="-1"` no `<h1>`, `focus()` em `ngAfterViewInit`. E destino de redirect por dois caminhos
(`error.interceptor.ts:26-28` e `role.guard.ts:21`), entao o argumento da F-21 vale integralmente.

Estender a spec (hoje 1 teste) para cobrir landmark **e** foco.

### Step 122.3.2 - Landmark em `verify-totp` e `redirect-to-app`

`<main>` + `<section aria-labelledby>` + `id` no heading. `redirect-to-app` **nao** e destino de
redirect automatico — nao precisa de foco, so do landmark. Spec nova para ele (nao tem nenhuma).

### Verificacao da Task F-22.3

```bash
npx vitest run src/app/features/error src/app/features/public
```

Mutacao: remover o `focus()` e cada `<main>`, um por vez.

### Definicao de pronto da Task F-22.3

- [ ] `access-denied` move foco para o heading, com teste.
- [ ] `verify-totp` e `redirect-to-app` tem `<main>` com regiao nomeada, com teste.
- [ ] Nenhuma pagina publica fica sem landmark.

### Commit sugerido

```text
fix(web): mover foco no acesso negado e nomear regioes das telas publicas
```

---

## Task F-22.4 - Remover o registro orfao e consolidar o helper de erro

**Objetivo**: tirar do repo uma tela que ninguem alcanca e a duplicacao de 7 corpos identicos.

**Pre-requisito**: Task F-22.3 concluida e aprovada.

**Esforco**: 0,5 dia.

**Arquivos esperados**: remocao de `src/app/features/public/register/` (4 arquivos),
`src/app/core/auth/auth.service.ts`, `contracts/consumed-contracts.json`,
`src/app/core/api/api-error.ts` (**novo**) + spec, os 7 helpers de dominio.

### Step 122.4.1 - Remover o `RegisterComponent`

Apagar os 4 arquivos, `AuthService.register()` (sem outro chamador) e a operacao `auth.registrar` do
descriptor — o app deixa de consumir o endpoint.

**Nao tocar** na rota `/register` nem nos 3 links "Criar conta": levam ao `RedirectToAppComponent` por
decisao da Sprint 5 e sao travados por `landing.component.spec.ts:20` e pelo e2e `golden-path.spec.ts`.
Conferir que o handler `POST /usuarios` do mock nao ficou sem uso antes de mexer nele.

### Step 122.4.2 - Helper unico em `core/api/`

`mensagemDeErroDaApi(err, padrao)` em `core/api/api-error.ts`, com spec propria (corpo com `message`,
corpo ausente, corpo nao-objeto). E o primeiro teste unitario desse comportamento no repo.

Os 7 helpers de dominio passam a delegar **preservando nome e comentario** — 0 call sites alterados.
Os comentarios nao sao redundantes: documentam quais status cada dominio trata localmente.

**Nao fundir com `mensagemDeErroDeLogin`**, que faz switch por status e resolve outro problema.

### Verificacao da Task F-22.4

```bash
npm test && npm run lint && npm run contract:check && npm run build
```

### Definicao de pronto da Task F-22.4

- [ ] `RegisterComponent` e orfaos removidos; suite verde; nenhum link quebrado.
- [ ] Helper unico em `core/api/` com spec propria.
- [ ] Os 7 helpers delegam sem alterar nenhum dos 56 call sites.

### Commit sugerido

```text
refactor(web): remover tela de registro orfa e unificar extracao de erro da api
```

---

## Task F-22.5 - Dividas de teste da F-21

**Objetivo**: transformar em regressao tres pontos que a F-21 registrou como nao cobertos.

**Pre-requisito**: Task F-22.4 concluida e aprovada.

**Esforco**: 0,25 dia.

**Arquivos esperados**: `src/app/core/interceptors/error.interceptor.spec.ts`,
`src/app/features/public/login/login.component.spec.ts`.

### Step 122.5.1 - Assert vacuo do `401`

O caso de `401` assere `currentUser()` nulo, mas ele **ja nasce nulo** — passa com o `clearSession()`
removido. A F-21 criou o helper `semearUsuario` para os casos novos; estender ao `401`.

### Step 122.5.2 - Duplo submit e `5xx` na cadeia real

- Teste de duplo submit provando que `errorMessage.set(null)` recria o no do `@if` — sem ele, dois
  erros de texto identico nao mudam o DOM e o `role="alert"` nao anuncia o segundo.
- Cobrir o `5xx` com `comInterceptors: true`, para o `withSupportReference` real injetar o codigo de
  suporte. Hoje a spec do `500` roda sem interceptor e escreve o texto a mao, entao passaria mesmo se
  a injecao fosse removida.

### Verificacao da Task F-22.5

```bash
npx vitest run src/app/core/interceptors src/app/features/public/login
```

Mutacao: remover `clearSession()` do `401`, remover `errorMessage.set(null)`, remover
`withSupportReference` do interceptor.

### Definicao de pronto da Task F-22.5

- [ ] O `401` falha se o `clearSession()` sair.
- [ ] Duplo submit coberto.
- [ ] `5xx` coberto pela cadeia real, falhando se o `withSupportReference` sair.

### Commit sugerido

```text
test(web): fechar as lacunas de cobertura registradas pela fsprint 21
```

---

## Task F-22.6 - Consumo da Sprint 34

> **GATE**: so executar com a Sprint 34 mergeada em `origin/develop` **e** o `sep-api` disponivel em
> `:8080` no perfil `dev`. Sem isso nao ha como regenerar o snapshot, e o `contract:check` falharia ao
> declarar uma operacao que o OpenAPI versionado nao conhece. **Se o gate nao abrir, fechar a sprint
> sem esta Task e registrar o motivo** — as outras cinco nao dependem dela.

**Pre-requisito**: Task F-22.5 concluida e aprovada; gate acima aberto.

**Esforco**: 0,5 dia.

**Arquivos esperados**: `src/app/core/auth/` (service novo), `src/app/core/api/api.models.ts`,
`src/mocks/handlers.ts`, `account-locked.component.ts` + spec, `login.component.ts` + spec,
`contracts/openapi.snapshot.json` + `.meta.json`, `contracts/consumed-contracts.json`,
`e2e/account-locked.spec.ts`.

### Step 122.6.1 - `politica-lockout` na borda

Tipo `PoliticaLockoutResponse` em `api.models.ts`, operacao `auth.politicaLockout` no descriptor,
handler no mock com valores **coerentes** com `LOCKOUT_MAX_TENTATIVAS = 5` / `LOCKOUT_MINUTOS = 30`
(`handlers.ts:152-153`), senao o mock fica auto-inconsistente.

A chamada em `/account-locked` **falha em silencio** e cai na copy estatica — a pagina e alcancavel por
URL direta e jamais pode depender de uma request.

**A copy integral esta travada** em `account-locked.component.spec.ts:16-25` com `toBe()`, de proposito
(*"Qualquer mudanca de copy DEVE quebrar aqui"*). Quebrar esse teste **e o desenho**, nao acidente:
reconferir cada afirmacao contra o `sep-api` ao reescrever.

### Step 122.6.2 - `Retry-After` no login

No `429` o header **ja chega intacto** (o interceptor nao navega) — uma linha lendo
`erro.headers.get('Retry-After')` substitui o literal "cerca de 1 minuto". No `423` idem, como fallback
quando a navegacao nao ocorre. Ajustar `login.component.spec.ts:204-221`, que afirma `/1 minuto/i`.

Declarar `Retry-After` no `responseHeaders` por status de `auth.login` e `mfa.totpVerify` — a Task
F-22.1 tornou isso expressavel.

### Step 122.6.3 - Snapshot e `knownGaps`

```bash
curl --fail --silent http://localhost:8080/v3/api-docs | jq -S . > contracts/openapi.snapshot.json \
  && npx prettier --write contracts/openapi.snapshot.json
npm run contract:check
```

O prettier **nao e opcional** (sem ele, ~1372 linhas de diff espurio). Atualizar `commit`,
`runtimeRef`, `exportadoEm` e os `sha256*` no `.meta.json`. Apagar os `knownGaps` que a Sprint 34
fechou — o relatorio de gap obsoleto da F-22.1 aponta exatamente quais.

### Verificacao da Task F-22.6

```bash
npm test && npm run contract:check && npm run build
npx playwright test e2e/account-locked.spec.ts
curl -i http://localhost:8080/api/v1/auth/politica-lockout
```

Smoke manual: 5 senhas erradas -> 6a cai em `/account-locked`, exibindo o prazo vindo do endpoint.

### Definicao de pronto da Task F-22.6

- [ ] `/account-locked` le a politica e continua funcional se a chamada falhar, com teste dos dois.
- [ ] `423`/`429` do login usam `Retry-After` quando presente.
- [ ] Snapshot renovado; `knownGaps` fechados removidos; relatorio de obsoletos vazio.
- [ ] Smoke real aprovado.

### Commit sugerido

```text
feat(web): consumir politica de lockout e retry-after do backend
```

---

## Fechamento (nao e task)

- `SEGURANCA.md` §5: atualizar a subsecao "O que o usuario ve (web)" se a Task F-22.6 rodar.
- Criar `repos/sep-app/SPRINT-F-22-PR.md`; remover a descricao de PR da sprint anterior, se existir.
- Atualizar `AI-ROADMAP.md`, `docs-sep/STATE.md` e apender entrada em `docs-sep/CONTEXT-PARTE-2.md`.
- Atualizar o status em `specs/fase-4/README.md` e no §36 do `PRD-FASE-4.md`.
- Registrar os follow-ups que **permanecem**: rotulo "Criar conta" prometendo formulario; auto-cadastro
  web descontinuado; `idCurto`/`formatarMoeda` duplicados; Playwright fora do CI; e a **M-Sprint 17**
  (mock mobile sem `423`, race de duplo toque em `consultarStatusPix` nos **dois** componentes, smoke
  `golden-path-mobile`, `<main>` aninhado dentro do `ion-content` em 4 telas, `focusManagerPriority`
  desativado).
