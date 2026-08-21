# Steps - F-Sprint 25 - Aviso de cookies e politica de privacidade no web

**Spec de origem**: [`125-fsprint-25-aviso-cookies-privacidade-web.md`](../../specs/fase-4/125-fsprint-25-aviso-cookies-privacidade-web.md)

**Status**: **CONCLUIDA na branch** em 2026-08-21. As 6 Tasks executadas, mais o commit isolado do
`npm audit fix` que o Gate F-25.0 exigiu. **Push e PR sao manuais e ainda nao foram feitos.**

**Divergencia em relacao ao texto planejado, registrada e nao corrigida no texto original**: o Step
125.6.2 prescrevia blindar a suite com `storageState` caso os 39 quebrassem. Eles quebraram — e a
medicao mostrou **defeito de produto, nao artefato de teste**, entao blindar teria escondido o
defeito. A Task entregou a correcao da sobreposicao e **nenhuma blindagem**. Ver §Task F-25.6 e a
[`SPRINT-F-25-PR.md`](../../repos/sep-app/SPRINT-F-25-PR.md).

**Sprint irma**: nenhuma. Esta sprint **nao consome contrato backend nenhum** e nao tem gate externo.

**Gate de ordem**: a **F-Sprint 24 precisa estar mergeada em `develop`** antes do Step 125.0.1. Ver
§Gate F-25.0.

**Objetivo geral**: o usuario passa a poder saber o que o `sep-app` grava no navegador dele, em
pagina propria e alcancavel, com um aviso que informa e sai do caminho.

**Esforco total estimado**: 2 dias de Dev Pleno Frontend.

**Repos de destino**:

- `sep-app`: `core/privacidade/` (novo), `layout/aviso-cookies/` (novo),
  `features/public/politica-privacidade/` (novo), `features/public/public.routes.ts`,
  `features/public/landing/landing.component.html`, `app.html`, `app.spec.ts`, `e2e/` (1 spec novo).
- `docs-SEP`: este step, a spec 125, indices e PR description; **Git manual**.

**Branch sugerida**: `feature/fsprint-25-aviso-cookies`, criada de `develop` **ja com a F-24 dentro**.

**Skills obrigatorias durante a implementacao**: `coding-guidelines`, `clean-code`,
`sep-web-mutation-verified-testing`.

---

## Estado atual verificado (2026-08-21)

Levantado antes de planejar. Qualquer divergencia encontrada no Gate F-25.0 invalida o desenho.

### O que nao existe

- **Zero** ocorrencia de aviso de cookie, politica de privacidade, termos de uso ou consentimento de
  cookie em `sep-app/src`. As 10 ocorrencias de `cookie` em `src/` sao **todas** sobre o refresh
  token: `auth.service.ts:17,19,69,71,91,92,135`, `client-channel.interceptor.ts:10-11`,
  `api.models.ts:40`.
- **Zero** ocorrencia em `specs/`, `steps-fase-*`, `PRD-FASE-1..5`, `STATE.md`, `SEGURANCA.md`,
  `AGENT.md`, `AI-ROADMAP.md`. Os unicos hits em `docs-SEP` estao em
  `docs-sep/Aprendizado Celcoin e SEP/` — copias de sites de Pismo/Celcoin/Visa, material de
  referencia externo, nao requisito do SEP.
- **Zero** script de terceiro: `src/index.html` tem 13 linhas e nenhum `<script>`. Sem GA, GTM,
  Hotjar, Clarity, Mixpanel ou pixel no bundle. `angular.json:7` `"analytics": false` e telemetria do
  Angular CLI, **nao** do produto — nao confundir.

### Estrutura em que o codigo novo entra

- `app.html` tem **uma linha**: `<router-outlet />`.
- `app.ts`: componente `App`, seletor `sep-root`, `imports: [RouterOutlet]`, `templateUrl`,
  `styleUrl`.
- `src/app/core/` tem **zero** componentes — so servicos (`api`, `auth`, `backoffice`, `cobranca`,
  `contratos`, `credito`, `credora`, `governanca`, `guards`, `icons`, `interceptors`, `onboarding`,
  `pix`, `theme`, `users`).
- `src/app/layout/` tem 4 componentes de chrome, todos no formato de 4 arquivos
  (`.ts`/`.html`/`.scss`/`.spec.ts`): `breadcrumbs`, `header`, `shell`, `sidenav`.
- **Nao existe `src/app/shared/`.**
- `public.routes.ts`: `''` (`:5`), `login` (`:9`), `login/verify-totp` (`:13`), `account-locked`
  (`:18`), `register` (`:23`).
- `landing.component.html:83-95`: `<footer class="landing-footer" aria-label="Rodape">` com copy
  (`:84-86`), dois links em `.landing-footer-links` (`:87-90`) e letra miuda regulatoria da
  CMN 4.656 (`:91-94`).
- `theme.service.ts` e o molde: `providedIn: 'root'` (`:16`), `DOCUMENT` injetado (`:18`), signal
  privado (`:19`) + `asReadonly()` (`:21`), leitura (`:54-57`, `getItem` em `:55`) e escrita
  (`:59-61`, `setItem` em `:60`) por `document.defaultView?.localStorage`.

### Acessibilidade e testes

- **Zero** `aria-live` em todo o `src/app` (`.html`).
- 4 templates usam `role="dialog"`/`aria-modal`: `matching-aporte-page`,
  `renegociacao-tomador-page`, `matching-detail-page`, `chaves-pix-page`. Todos modais com captura de
  foco — **o aviso de cookies nao segue esse padrao**.
- `test-setup.ts:21` usa `onUnhandledRequest: 'error'`. **Nao e hazard nesta sprint**: nenhum
  artefato novo faz request. Se algum teste novo disparar request, o desenho esta errado.
- `playwright.config.ts` **nao tem `globalSetup` nem `storageState`** (27 linhas; `use` em `:10-14`,
  `projects` em `:15-20`, `webServer` em `:21-26`).
- `e2e/fixtures/users.ts` e **dado**, nao fixture do Playwright. Os specs importam `test` direto de
  `@playwright/test`; **nao ha hook compartilhado** para cegar a suite.

### Baseline a medir no Gate F-25.0

| Metrica | Planejado | **Medido no Gate** | |
|---|---|---|---|
| Vitest testes / arquivos | 802 / 94 | **802 / 94** | confere |
| Playwright testes / arquivos | 39 / 11 | **39 / 11** | confere |
| `contract:check` | 85 operacoes / 0 lacunas | **85 / 0** | confere |
| `npm run audit` | 0 high/critical, 3 `moderate` | **1 high, 0 moderate** | **DIVERGE** |

**O Gate derrubou a linha do audit, nos dois sentidos** — precedente mantido: quatro sprints
seguidas, quatro vezes um numero ou premissa caindo.

`nanoid@3.3.17` precisa `>=3.3.18` (`GHSA-2v37-7h3g-55p8`: gerador custom entra em loop infinito
quando `size` e zero). **Transitiva**, fora do `package.json`:
`sep-app -> @angular/build@20.3.33 -> postcss@8.5.25 -> nanoid@3.3.17`. Patch dentro do mesmo major,
resolvivel so no lockfile. E dependencia de **build**: nao integra o bundle, entao o vetor nao e
alcancavel em runtime da aplicacao.

Os 3 `moderate` residuais que a D-1 registrou **nao existem mais**.

**Consequencia operacional**: o gate `npm audit --audit-level=high` que a D-Sprint 1 instalou no CI
estava **vermelho em `develop`**, e ninguem soube — exatamente o cenario que a D-1 previu ao anotar
que a F-19 zerou o `sep-app` e a contagem voltou a 19 em 18 dias sem deteccao. Corrigido nesta
sprint em **commit isolado, antes de qualquer codigo de escopo**, por decisao do usuario em
2026-08-21 (`cc5cbe9`).

Os 802/94 vinham do registro da F-24 e sobreviveram a medicao.

---

## Contratos backend consumidos

**Nenhum.** A sprint nao chama endpoint, nao declara operacao no `consumed-contracts.json`, nao toca
o snapshot OpenAPI e nao cria `knownGap`.

Consequencia que e criterio, nao observacao: `contract:check` tem de fechar em **85 operacoes / 0
lacunas**, identico a abertura. Movimento nesse numero e regressao.

---

## Decisoes da sprint

1. **Transparencia, nao consentimento.** Nao ha cookie recusavel (o unico, `sep-refresh`, e
   autenticacao). Banner de opt-in gatearia zero cookies. Ver spec 125 §Decisao tecnica principal.
2. **Botao "Entendi", nao "Aceitar".** O texto nao pode alegar consentimento que nao esta sendo
   colhido e que, para cookie necessario, nao seria a base legal aplicavel.
3. **Sem botao "Recusar".** Recusa que nao recusa nada e pior que ausencia: alega escolha
   inexistente.
4. **Servico em `core/privacidade/`, componente em `layout/aviso-cookies/`.** `core/` nao hospeda
   componente no repo; `layout/` hospeda chrome global. Nao criar `shared/`.
5. **Valor persistido e a versao do aviso, nao booleano.** O texto muda quando o juridico revisar —
   evento certo. Bump reexibe. Uma constante.
6. **`role="region"`, nunca `role="dialog"`, nunca captura de foco.**
7. **Banner depois do `<router-outlet />` no DOM.** As publicas movem foco para o heading; o banner
   por ultimo nao disputa isso.
8. **Persistencia local, nunca no servidor.** Gravar o aceite no `sep-api` criaria tratamento de dado
   pessoal que hoje nao existe, para resolver problema que nao existe.
9. **Fail-open no erro de storage**: falha significa aviso visivel, nunca aviso suprimido.
10. **Playwright: medir antes de blindar.** Se os 39 passarem com o banner, nao ha nada a fazer. Se
    quebrarem, `storageState` em **um** lugar — nunca editar os 11 arquivos.

---

## Fora de escopo

Ver spec 125 §Fora de escopo. Em resumo, **nao entra**: opt-in/categorias/bloqueio de script; botao
de recusa; `sep-mobile`; tirar `SEP_ACCESS_TOKEN` do `localStorage` (exige ADR); termos de uso;
endpoint de consentimento no `sep-api`; `aria-live`; smoke real contra `:8080`.

---

## Protocolo obrigatorio por Task

1. Executar **somente** a Task liberada; nao adiantar a seguinte.
2. Toda afirmacao sobre o codigo atual conferida no arquivo, com `arquivo:linha` — nao pela memoria
   nem por este documento.
3. Teste novo **verificado por mutacao**: aplicar a mutacao nomeada, ver o teste falhar, reverter.
   Teste que sobrevive e considerado **nao entregue**.
4. Rodar a verificacao da Task antes de pedir checkpoint. Capturar `EXIT=$?` explicito; **nunca**
   validar por `| tail`, que mascara o codigo de saida.
5. Checkpoint antes de cada commit: `git status --short --branch`, `git diff --stat`, arquivos
   criados/modificados/removidos, gates rodados e resultado, riscos/pendencias, mensagem sugerida.
6. **Aguardar aprovacao explicita** antes de `git add`/`git commit`. `git add <paths>`, nunca `-A`.
7. Push e PR **manuais** (dev humano). Em `docs-SEP` o git e 100% manual: o agente so edita a
   working tree.
8. `chown -R mauricio:mauricio .git .claude` apos operacoes git nos repos de codigo.

---

## Rastreabilidade spec 125 -> steps

| Item da spec | Steps |
|---|---|
| Pagina de politica + rota publica | F-25.1 |
| `AvisoCookiesService` (estado, versao, fail-open) | F-25.2 |
| `AvisoCookiesComponent` (region, sem foco preso) | F-25.3 |
| Montagem em `app.html` | F-25.4 |
| Link no rodape da landing | F-25.5 |
| Medicao e cobertura Playwright | F-25.6 |
| Riscos nao verificaveis / gates pendentes | Fechamento |

---

## Ordem de execucao

```text
Gate F-25.0 (F-24 em develop + precheck + baseline)
  -> F-25.1  pagina + rota           [independente; alvo do link das duas Tasks seguintes]
  -> F-25.2  service                 [independente]
  -> F-25.3  componente do aviso     [depende da F-25.1 (routerLink real) e da F-25.2 (service)]
  -> F-25.4  montagem no app.html    [depende da F-25.3]
  -> F-25.5  link no rodape          [depende da F-25.1]
  -> F-25.6  e2e + medicao dos 39    [depende da F-25.4]
Fechamento (gates completos + docs + PR description)
```

A ordem F-25.1 → F-25.3 **nao e preferencia**: o teste do banner assere navegacao para a politica, e
com a rota inexistente ele passaria contra um `routerLink` morto — teste verde provando nada, o
defeito que a Sprint 34 achou duas vezes.

---

## Gate F-25.0 - Precheck e baseline

**Objetivo**: confirmar que o desenho ainda descreve o repo, e medir os numeros que o fechamento vai
citar.

### Step 125.0.1 - F-24 em `develop`, e branch a partir dai

- Confirmar que a F-Sprint 24 esta mergeada em `origin/develop` **por diff de conteudo**, nao por
  titulo de PR nem por hash.
- **Se nao estiver, parar.** A sprint nao comeca. Ver spec 125 §Dependencia de ordem: os specs novos
  importam `src/testing/estabilizar.ts`, que so existe consolidado depois da F-24.
- Criar `feature/fsprint-25-aviso-cookies` de `develop` atualizado.

### Step 125.0.2 - Baseline medida

Rodar e **anotar o numero real**, sem truncar saida (`head`/`tail` mascaram e ja transformaram 14 em
8 num relatorio da F-24):

- `npm test` → testes / arquivos
- `npx playwright test --list` → testes / arquivos
- `npm run contract:check` → operacoes / lacunas
- `npm run audit` → high/critical

### Step 125.0.3 - Reconferir os 9 pontos que o desenho assume

Cada um com `arquivo:linha`. Divergencia em qualquer um **redesenha a Task**, nao so o numero:

1. `app.html` continua com so `<router-outlet />`.
2. `core/` continua sem nenhum `*.component.ts`.
3. Nao existe `src/app/shared/`.
4. `theme.service.ts` continua com o padrao de `DOCUMENT` + `defaultView?.localStorage`.
5. As 3 chaves `SEP_*` continuam sendo as unicas de producao, e `sessionStorage` segue sem uso.
6. O rodape da landing continua em `landing.component.html:83-95`.
7. `playwright.config.ts` continua sem `globalSetup` e sem `storageState`.
8. `test-setup.ts` continua com `onUnhandledRequest: 'error'`.
9. **No `sep-api`**: `sep-refresh`, `HttpOnly` fixo, path `/api/v1/auth`, e
   `refresh-expiration-seconds` = `2592000`. Se qualquer um mudou, **o texto da politica muda junto**.

### Definicao de pronto do Gate F-25.0

- [ ] F-24 confirmada em `develop` por conteudo; branch criada dali.
- [ ] Os 4 numeros de baseline medidos e anotados, sem truncamento.
- [ ] Os 9 pontos reconferidos com `arquivo:linha`; divergencias registradas **antes** de codar.

---

## Task F-25.1 - Pagina de politica e rota publica

### Step 125.1.1 - Componente da pagina

- Criar `features/public/politica-privacidade/politica-privacidade-page.component.{ts,html,scss}`.
- Standalone, seletor no padrao `sep-*`, sem dependencia de servico e **sem nenhuma chamada HTTP**.
- Estrutura semantica no padrao das demais publicas: landmark, `h1` focavel, secoes com heading.
- Conteudo, derivado do §Inventario medido da spec 125:
  - **o que gravamos e por que**: o cookie `sep-refresh` (autenticacao; `HttpOnly`; escopo
    `/api/v1/auth`; 30 dias; removido no logout);
  - **o que fica no `localStorage`**: `SEP_ACCESS_TOKEN`, `SEP_PENDING_MFA_CHALLENGE` (ambos
    removidos no logout) e `SEP_THEME`;
  - **o que nao usamos**: `sessionStorage`, analytics, marketing, rastreamento de terceiro;
  - **por que nao ha opcao de recusa**: o unico cookie e necessario ao login;
  - **secoes pendentes de revisao juridica**, nomeadas e nao preenchidas: base legal, direitos do
    titular, contato do encarregado.
- **Marcador de revisao juridica pendente visivel na pagina**, nao so comentario no fonte.
- `NG_APP_USE_MSW` **nao entra** — nao existe em build de producao.

### Step 125.1.2 - Rota

- `public.routes.ts`: `path: 'politica-de-privacidade'`, lazy no padrao das irmas.
- Sem guard. A pagina e alcancavel sem sessao **e** por URL direta — requisito, nao detalhe.

### Step 125.1.3 - Spec da pagina

- Assercoes por **papel semantico e identificador** (`sep-refresh`, `SEP_ACCESS_TOKEN`, `SEP_THEME`),
  **nunca por prosa colada**. Precedente do defeito: `account-locked.component.spec.ts`.
- Cobrir: landmark presente; `h1` recebe foco; marcador de pendencia juridica presente; as 3 chaves e
  o cookie citados; `NG_APP_USE_MSW` **ausente**.

### Verificacao da Task F-25.1

- `npm test` verde. **Mutacoes**: (a) remover a mencao a `SEP_ACCESS_TOKEN` do template — a spec tem
  de falhar; (b) remover o marcador de pendencia juridica — tem de falhar; (c) acrescentar
  `NG_APP_USE_MSW` ao template — tem de falhar.
- `npm run lint`, `lint:scss`, `format:check` verdes.

### Definicao de pronto da Task F-25.1

- [ ] `/politica-de-privacidade` renderiza sem sessao e por URL direta.
- [ ] Cada item do inventario citado; `NG_APP_USE_MSW` fora.
- [ ] Marcador de revisao juridica visivel.
- [ ] As 3 mutacoes aplicadas, vistas falhar e revertidas.

### Commit sugerido

`feat(privacidade): pagina publica de politica de privacidade e cookies`

---

## Task F-25.2 - `AvisoCookiesService`

### Step 125.2.1 - Servico

- Criar `core/privacidade/aviso-cookies.service.ts`.
- Molde do `ThemeService`: `@Injectable({ providedIn: 'root' })`, `DOCUMENT` injetado, signal privado
  + `asReadonly()` exposto.
- Constantes: chave `SEP_AVISO_COOKIES` e `VERSAO_AVISO` (comeca em `'1'`).
- API minima: `avisoVisivel` (signal readonly) e `marcarComoVisto()`. Nada alem disso — sem
  `reset()`, sem categorias, sem `preferencias`.
- **Divergencia deliberada em relacao ao `ThemeService`**: leitura e escrita **envolvidas**, porque
  optional chaining cobre "sem `window`" mas nao cobre `setItem` lancando. Cicatriz documentada em
  `login.component.ts:31`, `verify-totp.component.ts:146` e `copy-de-erro.ts:14`.
- **Fail-open**: qualquer falha de storage resulta em `avisoVisivel === true`. Nunca o contrario.

### Step 125.2.2 - Spec do servico

Cobrir, cada um isolado:

- storage vazio → visivel;
- valor igual a `VERSAO_AVISO` → invisivel;
- valor de versao **anterior** → visivel de novo;
- `getItem` lancando → visivel, sem excecao vazando;
- `setItem` lancando em `marcarComoVisto()` → **nao lanca**, e o estado em memoria ainda esconde o
  aviso na sessao corrente;
- `defaultView` ausente → visivel, sem excecao.

### Verificacao da Task F-25.2

- `npm test` verde. **Mutacoes**: (a) trocar o fail-open por fail-closed no `catch` do `getItem` — a
  spec tem de falhar; (b) comparar so a presenca da chave em vez do valor da versao — o teste de
  versao anterior tem de falhar; (c) remover o `try` do `setItem` — o teste tem de falhar com a
  excecao.

### Definicao de pronto da Task F-25.2

- [ ] Os 6 casos cobertos e verdes.
- [ ] As 3 mutacoes aplicadas, vistas falhar e revertidas.
- [ ] Nenhum metodo publico alem de `avisoVisivel` e `marcarComoVisto()`.

### Commit sugerido

`feat(privacidade): servico de estado do aviso de cookies`

---

## Task F-25.3 - `AvisoCookiesComponent`

### Step 125.3.1 - Componente

- Criar `layout/aviso-cookies/aviso-cookies.component.{ts,html,scss}`, 4 arquivos com o `.spec.ts` do
  step seguinte — formato de `breadcrumbs`/`header`/`shell`/`sidenav`.
- Standalone; injeta `AvisoCookiesService`; renderiza so quando `avisoVisivel()`.
- Template: `role="region"` + `aria-label`; texto curto; `routerLink` para
  `/politica-de-privacidade`; um botao **"Entendi"**.
- **Proibido**: `role="dialog"`, `aria-modal`, captura de foco, `autofocus`, foco programatico,
  `aria-live`.
- SCSS com tokens de `_sep-ds-tokens.scss` (`--card`, `--border`, `--foreground`, `--sep-radius-*`),
  claro e escuro. **Nenhuma cor literal.**

### Step 125.3.2 - Spec do componente

- primeira visita renderiza a region;
- clique em "Entendi" some com o aviso e chama `marcarComoVisto()`;
- o link aponta para a rota **que existe** (F-25.1);
- **nao** ha `role="dialog"` nem `aria-modal` no DOM;
- o componente **nao move foco** ao montar.

### Verificacao da Task F-25.3

- `npm test` verde. **Mutacoes**: (a) trocar `role="region"` por `role="dialog"` — a spec tem de
  falhar; (b) acrescentar foco programatico no `ngOnInit` — tem de falhar; (c) apontar o
  `routerLink` para rota inexistente — tem de falhar.
- `npm run lint:scss` verde; nenhuma cor literal introduzida.

### Definicao de pronto da Task F-25.3

- [ ] Os 5 casos cobertos.
- [ ] As 3 mutacoes aplicadas, vistas falhar e revertidas.
- [ ] Zero cor literal; tokens do DS em claro e escuro.

### Commit sugerido

`feat(privacidade): aviso de cookies dispensavel e nao modal`

---

## Task F-25.4 - Montagem no root

### Step 125.4.1 - `app.html` e `app.ts`

- `app.html` passa a ter `<router-outlet />` **e depois** `<sep-aviso-cookies />`. A ordem e
  requisito de acessibilidade, nao estetica.
- `app.ts`: acrescentar o componente ao `imports`.

### Step 125.4.2 - `app.spec.ts`

- o aviso renderiza junto do outlet;
- **a ordem no DOM** e outlet antes, aviso depois — assercao explicita, senao a decisao vira
  comentario que ninguem faz cumprir.

### Verificacao da Task F-25.4

- `npm test` verde. **Mutacoes**: (a) inverter a ordem no `app.html` — a spec de ordem tem de falhar;
  (b) remover `<sep-aviso-cookies />` — tem de falhar.
- `npm run build` verde (AOT; JIT do Vitest nao pega erro de template).

### Definicao de pronto da Task F-25.4

- [ ] Aviso presente em qualquer rota, publica ou autenticada.
- [ ] Ordem no DOM travada por teste.
- [ ] As 2 mutacoes aplicadas, vistas falhar e revertidas.
- [ ] `npm run build` verde.

### Commit sugerido

`feat(privacidade): montar aviso de cookies no root`

---

## Task F-25.5 - Link no rodape da landing

### Step 125.5.1 - Rodape

- `landing.component.html`: acrescentar o link em `.landing-footer-links` (`:87-90`), ao lado de
  "Entrar" e "Criar conta".
- **Nao** mexer na letra miuda da CMN 4.656 (`:91-94`) — e conteudo regulatorio de outra natureza.
- **Nao** corrigir o rotulo "Criar conta" aqui: e follow-up aberto e registrado no `STATE.md`, e
  arrastar correcao alheia para dentro da sprint viola o recorte.

### Step 125.5.2 - Spec

- o link existe no rodape e aponta para `/politica-de-privacidade`;
- os links preexistentes continuam la — guarda contra remocao acidental.

### Verificacao da Task F-25.5

- `npm test` verde. **Mutacao**: remover o link novo — a spec tem de falhar.

### Definicao de pronto da Task F-25.5

- [ ] Link presente, apontando para a rota real.
- [ ] Links preexistentes intactos, com teste.
- [ ] Mutacao aplicada, vista falhar e revertida.

### Commit sugerido

`feat(privacidade): link da politica no rodape da landing`

---

## Task F-25.6 - Playwright: medir, so depois blindar

### Step 125.6.1 - Medir o estrago antes de qualquer conserto

- Rodar **a suite inteira** com o banner ja montado: `npx playwright test`.
- Capturar `EXIT=$?` explicito. **Nao** validar por `| tail`.
- Anotar quantos dos **39** passam e **quais** falham, com o motivo real (sobreposicao de clique?
  seletor ambiguo? nada?).
- **Se todos passarem, o Step 125.6.2 nao acontece.** Registrar "sem blindagem necessaria" no
  fechamento e seguir. Nao construir defesa contra problema que a medicao nao encontrou.

### Step 125.6.2 - Blindagem, **so se** a medicao exigir

- Correcao em **um** lugar: `storageState` no `playwright.config.ts`, semeando
  `SEP_AVISO_COOKIES` com a versao corrente na origem `http://localhost:4200`.
- **Proibido editar os 11 arquivos de spec** para contornar o banner.
- Registrar no fechamento que a suite passa a rodar com o aviso pre-dispensado — e uma divergencia
  deliberada entre e2e e primeira visita real, e o Step seguinte e quem cobre o buraco.

### Step 125.6.3 - Spec e2e do aviso

- Arquivo novo `e2e/aviso-cookies.spec.ts`, **sem** o `storageState` da blindagem (se ela existir):
  primeira visita mostra o aviso, "Entendi" o remove, recarga nao reexibe, e o link chega na
  politica.
- E a unica prova de que a jornada de primeira visita funciona; sem ela a blindagem esconderia
  justamente o caminho que a sprint entrega.

### Verificacao da Task F-25.6

- Suite completa verde, com o numero final citado e comparado a baseline do Gate.
- O spec novo falha se o aviso for removido do `app.html` — conferir aplicando a mutacao.

### Definicao de pronto da Task F-25.6

- [ ] Os 39 rodados **antes** de blindar, resultado anotado com `EXIT` explicito.
- [ ] Blindagem aplicada **so se** a medicao exigiu, e em um unico lugar.
- [ ] Spec e2e da primeira visita, fora da blindagem.
- [ ] Mutacao aplicada, vista falhar e revertida.

### Commit sugerido

`test(privacidade): e2e do aviso de cookies na primeira visita`

---

## Fechamento (nao e task)

### Gates completos

Rodar **depois** do ultimo commit, porque `lint-staged` reescreve arquivo:

- `npm run format:check`
- `npm run lint`
- `npm run lint:scss`
- `npm test`
- `npm run build`
- `npm run audit`
- `npm run contract:check` → **tem de sair identico a abertura: 85 operacoes / 0 lacunas**
- `npx playwright test`

Capturar `EXIT=$?` de cada um. Numero citado no fechamento so vale se foi medido aqui.

### Gates declarados pendentes

1. **Revisao juridica do texto.** A pagina entra marcada. Precedente: `PLD.md`, mergeado com
   checklist juridico explicitamente pendente. Nomear no `SPRINT-F-25-PR.md`.
2. **Configuracao real do cookie em producao.** A politica afirma `Secure` + `SameSite=Strict`, que
   sao o que producao exige, mas os defaults deste ambiente sao `false`/`Lax`
   (`application.yml:95-96`) e nenhum teste local prova o que ops configurou. Mesma familia do
   defeito que a F-23 corrigiu na `/account-locked` — texto afirmando valor que o ambiente
   sobrescreve — com o agravante de que aqui o texto e juridico.

**Nao simular nenhum dos dois.** Declarar.

### Documentacao (`docs-SEP`, git manual)

- `SPRINT-F-25-PR.md` em `repos/sep-app/`, e **remover o `SPRINT-F-24-PR.md`** no ciclo padrao.
- `STATE.md`: sobrescrever §Leia agora, §Onde estamos e §Proximo passo.
- `CONTEXT-PARTE-2.md`: apender §F-Sprint 25.
- `PRD-FASE-4.md`: registrar a entrega.
- Marcar spec 125 e estes steps como mergeados, com PR e hash.

### Follow-ups a registrar

- **`SEP_ACCESS_TOKEN` e JWT em `localStorage`**, legivel por qualquer script na origem. A politica
  torna a exposicao publica; corrigir exige ADR e toca os tres repos. **Candidato a sprint propria.**
- **Termos de uso** ausentes.
- **`sep-mobile` sem equivalente** — a build PWA tem a mesma lacuna.
- **Rotulo "Criar conta"** no mesmo rodape, prometendo formulario e entregando pagina informativa —
  ja aberto, deliberadamente nao corrigido aqui.
