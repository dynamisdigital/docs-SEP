# Steps - M-Sprint 17 - Follow-ups de lockout, acessibilidade e smoke no mobile

**Spec de origem**: [`217-msprint-17-followups-lockout-a11y-mobile.md`](../../specs/fase-4/217-msprint-17-followups-lockout-a11y-mobile.md)

**Status**: planejada (criada em 2026-07-30). Nenhuma Task iniciada.

**Objetivo geral**: tornar a jornada de conta bloqueada alcancavel e testada no `sep-mobile`, fechar a
race condition de duplo toque que existe em dois componentes, corrigir o landmark duplicado que o
Ionic ja provê, e recuperar o smoke `golden-path-mobile`, vermelho desde a M-Sprint 4.

**Esforco total estimado**: 1,5-2 dias de Dev Mobile.

**Repos de destino**:

- `sep-mobile`: `src/mocks/handlers.ts`, `login.component` (+ spec), `verify-totp.component`
  (+ spec **nova**), `account-locked.component` (+ spec **nova**), `error.interceptor.spec.ts`,
  `portfolio-detail.component`, `parcela-detail.component` (+ specs), 4 templates publicos,
  `access-denied.component`, `e2e/golden-path-mobile.spec.ts`, `e2e/fixtures/users.ts`.
- `docs-SEP`: este step, a spec, indices e PR description; **Git manual**.

**Branch sugerida**: `feature/msprint-17-followups-lockout-a11y-mobile`, criada de `develop`
atualizado.

**Pre-requisitos**:

- M-Sprint 16 mergeada em `develop` e `main` (feito em 2026-07-20, PR #124/#125).
- Nenhuma dependencia de sprint backend: o `423` de `/auth/login` existe desde a Sprint 5.

## Estado atual verificado (2026-07-30)

Levantado antes de planejar; qualquer divergencia encontrada no Gate M-17.0 invalida o desenho abaixo.

### Lockout

- `handlers.ts:46-62` — o handler de login aceita **um par fixo**
  (`cliente@empresa.com` / `senha-passphrase-segura`) e responde `401` para qualquer outra coisa.
  **Nao ha contador, nao ha `423`, nao ha reset.** `grep -rn "423"` em `src` e `e2e`: nenhuma
  ocorrencia **produzida**, so consumida.
- A rota `/account-locked` existe (`public.routes.ts:26-29`) e o componente existe — **nada leva ate
  la** offline.
- **O mobile ja trata `423` em tres camadas**, ao contrario do web pre-F-21:
  - `login.component.ts:64-79` — `catch` com `status` discriminado; `423` navega para
    `/account-locked` e retorna; ha guard de duplo submit no topo (`:48`).
  - `verify-totp.component.ts:85-88` — mesmo padrao. **O mobile nao tem o gap de callback pelado que a
    F-21 registrou para o `verify-totp` do web.**
  - `error.interceptor.ts:33-40` — `clearSession()` + `navigateByUrl('/account-locked')` +
    `throwError`.
- **Nenhuma das tres tem teste**: `login.component.spec.ts` sem `423`/`account-locked`;
  `error.interceptor.spec.ts` tem 5 testes (`:31`, `:46`, `:60`, `:74`, `:92`) — `401` protegido,
  `401` login, `403`, outros erros, `4xx` sem codigo de suporte — **nenhum `423`**; `verify-totp` e
  `account-locked` **sem spec**.
- `test-setup.ts` — o MSW server **nunca foi plugado no Vitest** ("sera plugado na M-Sprint 2/3").
  `grep -rln "mocks/server\|mocks/handlers"` nos 68 specs: **zero**. Todos usam
  `HttpTestingController`/`vi.fn()`. **Mexer no `handlers.ts` nao afeta o Vitest** — so o browser
  (dev serve e Playwright).

### Race condition

- **Dois componentes**, nao um:
  - `portfolio-detail.component.ts:130-131` (credora) — `if (!this.id) { return; }`
  - `parcela-detail.component.ts:138-139` (tomador) — `if (!this.parcelaId) { return; }`
- Ambos confiam so em `[disabled]="carregandoPix()"`
  (`portfolio-detail.component.html:143-150`, `parcela-detail.component.html:108-115`), que so vale a
  partir do proximo ciclo de change detection. Duplo toque no mesmo tick: as duas chamadas passam o
  early-return, ambas fazem `carregandoPix.set(true)` e disparam requests concorrentes com a **mesma**
  `geracao` — o guard `if (geracao !== this.geracao) return` **nao descarta nenhuma**. A ultima a
  responder vence; e o `finally` da primeira reabilita o botao com request ainda em voo.
- **Molde pronto no mesmo arquivo**: `portfolio-detail.component.ts:173-179` (`consultarAportes`, fix
  da M-16, commit `078d6f9`) — a correcao e literalmente `|| this.carregandoAportes()` na condicao ja
  existente.
- **Teste-molde**: `portfolio-detail.component.spec.ts:387-401`, duas chamadas no mesmo tick +
  `httpMock.expectOne`. Validado por mutacao pela M-16.
- **Atrito de replicacao**: `parcela-detail.component.spec.ts` mocka o service com `vi.fn()`
  (`:340-353`), nao usa `HttpTestingController` — o teste equivalente ali precisa contar chamadas do
  `vi.fn()` com promise nao resolvida.

### Acessibilidade

- O `ion-content` do Ionic aplica `role="main"` sozinho quando nao esta dentro de
  `ion-menu`/`ion-popover`/`ion-modal` — sempre o caso aqui, porque o app usa `ion-tabs`.
- **Quatro telas envolvem o conteudo num `<main>` dentro desse `ion-content`**: `welcome`, `login`,
  `register`, `login/verify-totp`. Resultado observado no snapshot de acessibilidade do Playwright:
  `- main [ref=e5]` (ion-content) contendo `- main [ref=e8]` (o `<main>` do template). Dois landmarks
  `main` aninhados, sem `aria-label`. As outras ~28 paginas estao corretas.
- `provideIonicAngular()` em `main.ts:33` e chamado **sem config**, entao o `focusManagerPriority`
  embutido do Ionic esta desativado e o foco nao e movido em troca de rota.
- `grep` por `skip-link|skipLink|focus()|setFocus|aria-live|announce` em `src` (fora de specs):
  **zero**. `account-locked.component.ts` e `access-denied.component.html` sao estaticos, sem foco.

### Smoke `golden-path-mobile`

- **Vermelho desde a M-Sprint 4**, nao desde a M-13. `e2e/golden-path-mobile.spec.ts` tem **um unico
  commit** (`9e4bd1c`, M-4) e nunca foi tocado; `welcome.component.html` diz "Criar conta" desde a M-2
  (`c1225a5`); `git log -S "Cadastrar"` no arquivo: **zero**. A M-Sprint 10 (2026-07-03) ja o
  registrava vermelho e os steps da M-12 (`212-msprint-12-steps.md:538`) ja identificavam a causa.
- **Tres causas independentes** — corrigir so o seletor **nao** deixa verde:
  1. **Seletor**: o spec procura `getByRole('link', { name: /cadastr/i })` (`:14-17`); o CTA e "Criar
     conta". O `smoke.spec.ts:29` contorna usando a classe CSS.
  2. **MSW nao e ativado**: e o **unico** dos 9 specs e2e sem `NG_APP_USE_MSW`. O
     `playwright.config.ts:27` sobe `npm run start` (configuracao `development`, `useMsw: false`), e o
     spec foi escrito para backend real `:8080` (spec 204/M-4).
  3. **Senha viola a politica**: `e2e/fixtures/users.ts:1-2` usa `'123456'`/`'654321'`; a politica e
     12+ chars ou passphrase, e o proprio mock recusa (`length < 12` -> `400`). E o handler de login so
     aceita o par fixo, incompativel com o `uniqueEmail()` do spec.
- **O `CI-MOBILE` nao roda Playwright** (`grep "playwright\|e2e"` no workflow: zero). Por isso ficou 4
  meses vermelho sem ninguem tropecar.

### Gate M-16.0 — reconferido, continua valendo

`api.models.ts:1` -> `export type UsuarioRole = 'ADMIN' | 'CLIENTE';`. `role.guard.ts:10` tipa
`route.data?.['roles']` como `UsuarioRole[]`, entao `data: { roles: ['FINANCEIRO'] }` **nao compila**.
`grep -rn "FINANCEIRO"` em `src`: so comentarios de gate, nenhum codigo. No backend, os seis endpoints
seguem `hasAnyRole('FINANCEIRO','ADMIN')`. A spec 216 proibe introduzir a role sem ADR.

### Baseline medida

- Vitest **503 / 68 arquivos**, exit 0 (medido em 2026-07-30; a contagem estatica de `it(` da ~483 e
  subestima).
- Playwright **27 testes / 9 arquivos** — 26 passam, `golden-path-mobile` falha.
- `CI-MOBILE`: tres jobs verdes no ultimo run em `main` (`Test, Lint, Coverage`, `Build PWA`,
  `Build Android (debug)` com `cap sync android` + `gradlew assembleDebug`).
- **`node_modules/.vite-temp` fica root-owned** apos execucao em container e faz o Vitest abortar com
  `EACCES` antes de rodar qualquer teste. Foi preciso remover para medir a baseline.
- Nao existe `contract:check` no `sep-mobile`; nao existe script de audit.

## Decisoes da sprint

- **O mock espelha a ordem de avaliacao do backend, nao a conveniencia do teste.** `verificar()` roda
  antes de resolver o usuario e de avaliar a credencial: a 5a senha errada ainda e `401`, o `423` so
  aparece na 6a, senha correta apos o bloqueio tambem e `423`, e sucesso **nao** zera o contador.
  Escrever "5 toques -> redirect" exigiria o mock mentir sobre o `sep-api`. Molde em
  `sep-app/src/mocks/handlers.ts`.

- **MSW continua fora do Vitest.** Plugar mudaria a infra dos 68 specs de uma vez, com risco de
  interferir em quem usa `HttpTestingController`. A cobertura do `423` nas tres camadas usa o que o
  repo ja tem e sabe verificar por mutacao. **Alternativa rejeitada**: plugar agora "de carona" —
  seria mudanca de infra dentro de sprint de divida.

- **Foco pontual, nao `focusManagerPriority` global.** Ligar o gerenciador do Ionic e uma linha, mas
  passa a mover foco em ~30 rotas de uma vez e exige smoke visual, que so roda manualmente. A sprint
  faz foco nos dois destinos de redirect (`account-locked`, `access-denied`), que e o caso com dano
  real: o usuario de leitor de tela cai em `<body>` no desfecho de um evento de seguranca.

- **O `<main>` sai dos templates, o `ion-content` fica.** O landmark correto ja e provido pelo Ionic;
  o `<main>` do template e que esta sobrando. **Cuidado**: specs desses quatro componentes podem
  depender do seletor `main` — conferir antes de remover.

- **O `golden-path-mobile` e reescrito contra MSW, nao remendado.** Corrigir so o seletor deixaria as
  outras duas causas de pe. O trabalho real nao e o seletor: e **ensinar o mock a registrar e
  autenticar um usuario criado dinamicamente**, porque hoje o seed e um par fixo e o spec usa
  `uniqueEmail()`. Alternativas rejeitadas: `test.fixme()` (deixaria a jornada sem cobertura) e
  deletar o spec (perderia a intencao registrada desde a M-4).

- **Sem ADR**: nenhuma escolha estrutural nova. ADR passa a ser exigido para plugar o MSW no Vitest,
  para o `focusManagerPriority` global, para portar o `contract:check` e para introduzir a role
  `FINANCEIRO`.

## Fora de escopo

- Plugar o MSW server no Vitest; ligar `focusManagerPriority` global; portar o `contract:check`.
- Escopo adiado pelo Gate M-16.0 (matching, aporte POST, chaves Pix) — exige ADR + revisao da spec 216.
- M-Sprint 14 (iOS) e M-Sprint 15 (biometria) — gate externo de hardware macOS 13+.
- Rodar Playwright no `CI-MOBILE`.
- Alterar `sep-api` ou `sep-app`.

## Protocolo obrigatorio por Task

1. Executar somente a Task liberada pelo usuario.
2. Confirmar codigo e contrato atuais antes de editar.
3. Implementar a menor mudanca coerente com a spec e este step.
4. Escrever/ajustar teste observavel para o comportamento alterado.
5. Rodar verificacoes proporcionais por bloco (`npm test`, `lint`, `lint:scss`, `format:check`).
6. Parar em checkpoint pre-commit com arquivos, testes, riscos e mensagem sugerida.
7. Aguardar aprovacao antes de `git add`/`git commit`; usar somente paths especificos.
8. Nao iniciar a Task seguinte sem ordem explicita.

**Skills obrigatorias durante a implementacao**: `coding-guidelines`, `clean-code`. A verificacao por
mutacao e obrigatoria e tem precedente direto na M-16: o teste de duplo toque falha com
`Expected one matching request ... found 2 requests` quando a guarda sai.

## Rastreabilidade spec 217 -> steps

| Task da spec 217 | Steps |
|------------------|-------|
| 1. Mock MSW com lockout | M-17.1 |
| 2. Cobertura do `423` nas tres camadas + specs novas | M-17.2 |
| 3. Guard de reentrancia nos dois componentes | M-17.3 |
| 4. Remover `<main>` aninhado | M-17.4 |
| 5. Foco nos destinos de redirect | M-17.5 |
| 6. `golden-path-mobile` contra MSW | M-17.6 |
| Gates de cadeia, baseline, destrave do Vitest e reconferencia do Gate M-16.0 | M-17.0 |

## Ordem de execucao

```text
M-17.0 prechecks + baseline + destrave do Vitest + reconferencia do Gate M-16.0
  -> M-17.1 mock MSW com lockout (destrava a jornada offline e o e2e)
  -> M-17.2 cobertura do 423 nas tres camadas + specs de verify-totp e account-locked
  -> M-17.3 guard de reentrancia em consultarStatusPix (2 componentes)
  -> M-17.4 remover <main> aninhado das 4 telas
  -> M-17.5 foco em account-locked e access-denied
  -> M-17.6 golden-path-mobile reescrito contra MSW
```

M-17.1 vem antes da M-17.6 porque o cadastro dinamico no mock e pre-requisito do golden path. M-17.4 e
M-17.5 vem antes da M-17.6 para o smoke ja rodar sobre as telas corrigidas.

---

## Gate M-17.0 - Prechecks, baseline e reconferencias

**Objetivo**: confirmar cadeia Git, baseline verde e o estado levantado antes de mexer em mock de
autenticacao.

### Step 217.0.1 - Confirmar cadeia Git

```bash
cd <sep-mobile-root>
git fetch --all --prune
git status --short --branch
git rev-list --left-right --count origin/main...origin/develop
```

M-Sprint 16 (`77ea01a`) presente em `origin/develop`; `main` integrada. Criar
`feature/msprint-17-followups-lockout-a11y-mobile` de `develop` atualizado.

### Step 217.0.2 - Destravar o Vitest

`node_modules/.vite-temp` fica root-owned apos execucao em container e o Vitest aborta com `EACCES`
**antes de rodar qualquer teste** — falha que nao parece de teste e custa tempo a diagnosticar.

```bash
rmdir node_modules/.vite-temp    # o diretorio fica vazio; se nao estiver, sudo rm -rf
```

### Step 217.0.3 - Rodar baseline

```bash
npm ci --legacy-peer-deps
npm run format:check && npm run lint && npm run lint:scss
npm test && npm run build
npx playwright test
```

Partida: Vitest **503 / 68**, Playwright **27 (26 passam, 1 falha)**. O vermelho do
`golden-path-mobile` e **preexistente e esperado** — registrar e **nao** corrigir de carona; ele e a
Task M-17.6.

### Step 217.0.4 - Reconfirmar a ordem de avaliacao no `sep-api` (somente leitura)

Confirmar em `identity/application/usecase/AutenticarUsuarioUseCase.java` que
`lockoutService.verificar()` roda **antes** do `findByUsername` e do registro da tentativa, e os
valores de `LockoutProperties` (5 falhas / 15 min / 30 min).

**Por que e gate e nao task**: o mock da M-17.1 so pode espelhar o que o backend faz. Se a ordem mudou,
o desenho do mock e dos testes muda junto.

### Step 217.0.5 - Reconferir o Gate M-16.0

Confirmar que `UsuarioRole` segue `'ADMIN' | 'CLIENTE'` e que os endpoints da credora seguem exigindo
`FINANCEIRO`/`ADMIN`. **Por que e gate**: as Tasks M-17.3 e M-17.4 tocam telas da credora; se a role
mudou, a spec 216 precisa ser revista antes de qualquer edicao.

### Definicao de pronto do Gate M-17.0

- [ ] Cadeia Git conferida e branch criada de `develop` atualizado.
- [ ] Vitest roda localmente.
- [ ] Baseline registrada, com o vermelho preexistente anotado.
- [ ] Ordem de avaliacao do backend e Gate M-16.0 reconferidos.

---

## Task M-17.1 - Mock MSW com lockout

**Objetivo**: `/account-locked` passa a ser alcancavel offline e em Playwright.

**Pre-requisito**: Gate M-17.0 concluido.

**Esforco**: 0,25 dia.

**Arquivos esperados**: `src/mocks/handlers.ts`.

### Step 217.1.1 - Contador por usuario e `423`

Espelhar `sep-app/src/mocks/handlers.ts`: `Map` de falhas por username, verificacao **antes** de
resolver o usuario, `423` a partir da 6a tentativa, e funcao de reset exportada. Documentar no proprio
arquivo o que **nao** e simulado (janela de 15 min e duracao de 30 min — o mock nao tem relogio) e a
consequencia: o bloqueio dura ate o reset ou ate o reload da pagina.

Registrar tambem qualquer divergencia deliberada em relacao ao backend (ex.: contar username
desconhecido, que o `sep-api` nao conta), com o motivo — a assimetria so e aceitavel no sentido "falha
offline, passa em producao".

### Verificacao da Task M-17.1

```bash
npm test && npm run lint
npm run start   # 6 tentativas erradas -> /account-locked
```

Como o MSW nao esta plugado no Vitest, a verificacao desta Task e **manual no browser**; a cobertura
automatizada vem na M-17.2 (unit) e na M-17.6 (e2e).

### Definicao de pronto da Task M-17.1

- [ ] 6a tentativa devolve `423`; a 5a ainda devolve `401`.
- [ ] Senha correta apos o bloqueio devolve `423`.
- [ ] Sucesso nao zera o contador.
- [ ] Reset exportado, com o que nao e simulado documentado no arquivo.

### Commit sugerido

```text
test(mobile): simular lockout de conta no mock de login
```

---

## Task M-17.2 - Cobertura do `423` nas tres camadas

**Objetivo**: o tratamento de `423` que ja existe passa a ser regressao.

**Pre-requisito**: Task M-17.1 concluida e aprovada.

**Esforco**: 0,5 dia.

**Arquivos esperados**: `src/app/core/interceptors/error.interceptor.spec.ts`,
`src/app/features/public/login/login.component.spec.ts`,
`verify-totp.component.spec.ts` (**nova**), `account-locked.component.spec.ts` (**nova**).

### Step 217.2.1 - `423` no interceptor e no login

`HttpTestingController`, no padrao dos 68 specs. No interceptor: `423` limpa sessao **e** navega —
semear o usuario antes, senao o assert de "limpou a sessao" passa com o `clearSession()` removido
(mesma armadilha que a F-21 encontrou no `sep-app`). Incluir **teste negativo do `429`**: rate limit
nao e conta bloqueada e nao pode navegar nem apagar sessao.

### Step 217.2.2 - Specs novas de `verify-totp` e `account-locked`

Nenhum dos dois tem spec. Cobrir: o `423` do `verify-totp` navega para `/account-locked`; e a copy de
`account-locked` — conferindo **cada afirmacao contra o `sep-api`** antes de travar, como a F-21 fez
(la quatro afirmacoes da copy do web eram falsas).

### Verificacao da Task M-17.2

```bash
npx vitest run src/app/core/interceptors src/app/features/public
```

Mutacao: remover o ramo `423` de cada camada, um por vez; trocar `423` por `423 || 429` no interceptor.

### Definicao de pronto da Task M-17.2

- [ ] `423` coberto nas tres camadas, cada teste falhando se o ramo sair.
- [ ] Teste negativo do `429` no interceptor.
- [ ] `verify-totp` e `account-locked` com spec propria.

### Commit sugerido

```text
test(mobile): cobrir a jornada de conta bloqueada nas tres camadas
```

---

## Task M-17.3 - Guard de reentrancia em `consultarStatusPix`

**Objetivo**: duplo toque para de disparar duas leituras concorrentes — nos **dois** componentes.

**Pre-requisito**: Task M-17.2 concluida e aprovada.

**Esforco**: 0,25 dia.

**Arquivos esperados**: `portfolio-detail.component.ts` + spec, `parcela-detail.component.ts` + spec.

### Step 217.3.1 - A guarda

Acrescentar `|| this.carregandoPix()` a condicao de early-return ja existente em ambos, replicando
`consultarAportes` (`portfolio-detail.component.ts:177`). Copiar tambem o comentario que explica **por
que** o `[disabled]` nao basta — sem ele a linha parece redundante e some na proxima revisao.

### Step 217.3.2 - Testes de duplo toque

Molde: `portfolio-detail.component.spec.ts:387-401` (duas chamadas no mesmo tick +
`httpMock.expectOne`). Em `parcela-detail.component.spec.ts` o service e mockado com `vi.fn()`, entao o
assert precisa contar chamadas com a promise ainda pendente.

### Verificacao da Task M-17.3

```bash
npx vitest run src/app/features/credora src/app/features/tomador
```

Mutacao: remover a guarda de cada um — deve falhar com duas requests.

### Definicao de pronto da Task M-17.3

- [ ] Guarda nos dois componentes, com o comentario do porque.
- [ ] Teste de duplo toque em cada um, falhando sem a guarda.

### Commit sugerido

```text
fix(mobile): impedir leituras concorrentes de status pix no duplo toque
```

---

## Task M-17.4 - Remover o `<main>` aninhado

**Objetivo**: uma pagina, um landmark `main`.

**Pre-requisito**: Task M-17.3 concluida e aprovada.

**Esforco**: 0,25 dia.

**Arquivos esperados**: templates de `welcome`, `login`, `register` e `login/verify-totp`.

### Step 217.4.1 - Tirar o `<main>` dos templates

O `ion-content` ja e `role="main"`. Trocar o `<main>` por `<div>` (ou remover o wrapper, se ele so
existe para o landmark), preservando classes e SCSS.

**Conferir antes**: os specs desses componentes podem usar `getByRole('main')` ou seletor `main` —
ajustar junto, nao depois.

### Step 217.4.2 - Provar que o aninhamento sumiu

Teste que assere **um unico** landmark `main` por pagina nas quatro telas.

### Verificacao da Task M-17.4

```bash
npx vitest run src/app/features/public && npm run lint:scss && npm run build
```

### Definicao de pronto da Task M-17.4

- [ ] Nenhuma das quatro telas tem `<main>` dentro do `ion-content`.
- [ ] Teste de landmark unico nas quatro.
- [ ] SCSS e layout inalterados.

### Commit sugerido

```text
fix(mobile): remover landmark main duplicado dentro do ion-content
```

---

## Task M-17.5 - Foco nos destinos de redirect

**Objetivo**: quem cai em `/account-locked` ou `/access-denied` por redirect nao fica em silencio.

**Pre-requisito**: Task M-17.4 concluida e aprovada.

**Esforco**: 0,25 dia.

**Arquivos esperados**: `account-locked.component`, `access-denied.component` + specs.

### Step 217.5.1 - Foco no heading

Padrao do `sep-app` (`account-locked.component.ts:110-118`): referencia ao heading, `tabindex="-1"` e
`focus()` em `ngAfterViewInit`. **Nao** ligar o `focusManagerPriority` global — decisao da sprint.

Comentar no codigo o motivo (destino de redirect automatico, Angular nao move foco na navegacao, o app
nao tem live region de rota), para nao ser "limpado" numa revisao futura.

### Verificacao da Task M-17.5

```bash
npx vitest run src/app/features/public src/app/features/error
```

Mutacao: remover o `focus()` de cada um.

### Definicao de pronto da Task M-17.5

- [ ] Os dois movem foco para o heading, com teste que falha sem o `focus()`.
- [ ] Motivo comentado no codigo.

### Commit sugerido

```text
fix(mobile): mover foco ao heading nos destinos de redirect
```

---

## Task M-17.6 - `golden-path-mobile` contra MSW

**Objetivo**: o smoke passa a provar a jornada, em vez de estar vermelho ha quatro meses.

**Pre-requisito**: Task M-17.5 concluida e aprovada.

**Esforco**: 0,5 dia.

**Arquivos esperados**: `e2e/golden-path-mobile.spec.ts`, `e2e/fixtures/users.ts`,
`src/mocks/handlers.ts`.

### Step 217.6.1 - Cadastro dinamico no mock

**E o grosso da Task, nao o seletor.** O handler de `POST /usuarios` precisa registrar o usuario criado
e o de `/auth/login` precisa aceita-lo depois — hoje o seed e um par fixo e o spec usa
`uniqueEmail()`. Reaproveitar o `Map` introduzido na M-17.1 e manter o par fixo funcionando, para nao
quebrar os outros 8 specs e2e.

### Step 217.6.2 - Corrigir as outras duas causas

- Ligar `NG_APP_USE_MSW` no `beforeEach`, como os outros 8 specs fazem.
- Trocar `/cadastr/i` pelo nome real do CTA ("Criar conta") — ou pela classe, como o `smoke.spec.ts:29`.
- Trocar `defaultPassword`/`changedPassword` em `e2e/fixtures/users.ts` por senhas compativeis com a
  politica (12+ chars ou passphrase); hoje `'123456'` e recusada com `400` pelo proprio mock.
  **Conferir quem mais usa o fixture** antes de trocar.

### Step 217.6.3 - Controle positivo

Assert de que a senha do fixture **realmente autentica**, no padrao que a F-21 adotou no `sep-app`.
Sem ele, uma derivacao futura no fixture degrada o smoke em silencio.

### Verificacao da Task M-17.6

```bash
npx playwright test e2e/golden-path-mobile.spec.ts
npx playwright test        # suite completa: 27 verdes
```

### Definicao de pronto da Task M-17.6

- [ ] `golden-path-mobile` passa com MSW ligado.
- [ ] Suite e2e em **27 verdes**.
- [ ] Controle positivo da senha do fixture presente.
- [ ] Os outros 8 specs e2e seguem verdes (o par fixo do mock continua funcionando).

### Commit sugerido

```text
test(mobile): recuperar o smoke golden path contra o mock
```

---

## Fechamento (nao e task)

- Criar `repos/sep-mobile/SPRINT-M-17-PR.md` e **remover `repos/sep-mobile/SPRINT-M-16-PR.md`**, que
  segue no repo desde 2026-07-20 (ciclo padrao).
- Atualizar `AI-ROADMAP.md`, `docs-sep/STATE.md` e apender entrada em `docs-sep/CONTEXT-PARTE-2.md`.
- **Corrigir a atribuicao do `golden-path-mobile`** onde ainda estiver errada: vermelho desde a
  **M-Sprint 4**, nao desde a M-13.
- Atualizar o status em `specs/fase-4/README.md` e no §36 do `PRD-FASE-4.md`.
- Registrar os follow-ups que **permanecem**: plugar o MSW no Vitest; `focusManagerPriority` global;
  portar o `contract:check` para o `sep-mobile`; rodar Playwright no `CI-MOBILE`; escopo adiado pelo
  Gate M-16.0 (exige ADR); `README.md` do `sep-mobile` dizendo "Vitest 2" quando o repo usa Vitest 3.
