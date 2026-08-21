# F-Sprint 25 - Aviso de cookies e politica de privacidade (`sep-app`)

> Descricao temporaria do PR `feature/fsprint-25-aviso-cookies` -> `develop` no `sep-app`.
> Apagar apos o merge (ciclo de vida padrao).

## Summary

**Produto novo** — primeira frente de produto no web desde que a Fase 4 esgotou o escopo sobre fake.
O `sep-app` grava dados no navegador do usuario desde a Sprint 5 e **nunca disse isso a ele**: nao
havia aviso, pagina de politica, termos ou qualquer mencao a tratamento de dados fora do rodape
regulatorio da landing.

**Transparencia, nao consentimento.** Medido: o produto emite **um** cookie, `sep-refresh`, de
autenticacao; nao ha script de terceiro no `index.html` nem biblioteca de rastreamento no bundle. Um
cookie estritamente necessario nao e recusavel, entao banner de opt-in gatearia **zero** cookies.
Por isso nao ha "recusar" nem categorias, e o botao diz "Entendi", nao "Aceitar".

Spec [`125`](../../specs/fase-4/125-fsprint-25-aviso-cookies-privacidade-web.md) + steps
[`125`](../../steps-fase-4/web/125-fsprint-25-steps.md). Sem ADR. **Nada mudou em
`sep-api`/`sep-mobile`**, e nenhum contrato foi consumido.

## Numeros

| Gate | Partida (Gate F-25.0) | Fim |
|---|---|---|
| Vitest | 802 / 94 arquivos | **833 / 97** |
| Playwright | 39 / 11 arquivos | **42 / 12** |
| `contract:check` | 85 operacoes / 0 lacunas | **85 / 0** (inalterado, por desenho) |
| `npm run audit` | **1 high** (pre-existente) | **0** |
| Bundle inicial | 307.01 kB / 89.80 kB | 310.54 kB / 90.98 kB |

`contract:check` inalterado e **criterio, nao observacao**: a sprint nao consome contrato nenhum,
entao qualquer movimento nesse numero seria regressao.

## O que o Gate F-25.0 derrubou

Quarta sprint seguida em que o Gate mata um numero ou uma premissa da spec.

**A baseline do `audit` estava errada nos dois sentidos**: a spec dizia "0 high, 3 moderate"; a
medicao deu **1 high, 0 moderate**. `nanoid@3.3.17` precisa `>=3.3.18`
([GHSA-2v37-7h3g-55p8](https://github.com/advisories/GHSA-2v37-7h3g-55p8)), transitiva via
`@angular/build -> postcss`, fora do `package.json`.

Consequencia que ninguem tinha visto: o gate `npm audit --audit-level=high` que a **D-Sprint 1**
instalou no CI estava **vermelho em `develop`** — exatamente o cenario que a D-1 previu ao registrar
que a F-19 zerou o `sep-app` e a contagem voltou a 19 em 18 dias sem deteccao. Corrigido aqui em
commit isolado, antes de qualquer codigo de escopo.

## O defeito que a medicao dos e2e encontrou

O Step 125.6.1 manda rodar os 39 Playwright **antes** de blindar qualquer coisa. Rodou, e
`onboarding.spec.ts:42` reprovou com o culpado nomeado pelo proprio relatorio:

```
<section role="region" class="sep-aviso-cookies" ...> subtree intercepts pointer events
```

51 tentativas de clique interceptadas no botao "Iniciar onboarding". **Nao era artefato de teste**:
sendo `position: fixed` no rodape, a faixa cobria o ULTIMO elemento de qualquer pagina, e como a
rolagem e do `body`, chegar ao fim nao resolvia. Um usuario de primeira visita tambem nao
conseguiria submeter o onboarding.

**Os steps prescreviam blindar a suite com `storageState`. Teria escondido o defeito e entregado a
faixa quebrada.** A prescricao foi escrita antes de existir a medicao; a correcao foi decidida com o
usuario em 2026-08-21.

Correcao: enquanto a faixa existe, o `body` reserva a altura dela. Classe dirigida pelo signal (logo
testavel em unidade), altura exata pelo `ResizeObserver` — a faixa quebra em duas linhas em tela
estreita, e numero fixo mentiria em algum viewport. Mesmo precedente do `ThemeService`, que alterna
classe no `documentElement`. **Nenhuma blindagem foi aplicada**: os 39 originais passam com a faixa
viva.

## Inventario medido — o que a politica afirma

Cada linha conferida na fonte. Mudanca em qualquer uma **obriga a reconferir o texto**.

| Item | Fato | Fonte |
|---|---|---|
| Cookie | `sep-refresh`, unico do produto | `RefreshCookieService.java:62-68` |
| | `HttpOnly` **fixo em codigo** | `RefreshCookieService.java:64` |
| | escopo `/api/v1/auth` | `RefreshCookieProperties.java:21` |
| | 30 dias (`2592000s`), `Max-Age=0` no logout | `application.yml:77`, `RefreshCookieService.java:57-60` |
| `localStorage` | `SEP_ACCESS_TOKEN`, `SEP_PENDING_MFA_CHALLENGE` | `auth.service.ts:9-10` (limpas em `:84-85`) |
| | `SEP_THEME` | `theme.service.ts:6` |
| | `SEP_AVISO_COOKIES` | criada por esta sprint |
| `sessionStorage` | **sem uso** | `chave-pix-intencao.store.ts:15` |
| Rastreamento | **nenhum** | `index.html`, 13 linhas, zero `<script>` |

`NG_APP_USE_MSW` (`main.ts:9`) fica **fora** da politica de proposito — nao existe em build de
producao, e cita-la descreveria ao usuario um artefato que ele nunca tera. Ha teste travando a
ausencia.

`angular.json:7` `"analytics": false` e telemetria do Angular CLI, **nao** do produto — nao confundir.

## Mudancas por Task

| Task | Entrega |
|---|---|
| Gate F-25.0 | F-24 confirmada em `develop` por conteudo; baseline medida; 9 pontos reconferidos |
| — | `npm audit fix` do `nanoid`, commit isolado antes do escopo |
| F-25.1 | Pagina publica `/politica-de-privacidade` + rota |
| F-25.2 | `AvisoCookiesService` (`core/privacidade/`) |
| F-25.3 | `AvisoCookiesComponent` (`layout/aviso-cookies/`) |
| F-25.4 | Montagem no `app.html`, depois do `<router-outlet />` |
| F-25.5 | Link no rodape da landing |
| F-25.6 | Medicao dos 39, correcao da sobreposicao, e2e da primeira visita |

## Decisoes

1. **Transparencia, nao consentimento.** Nao ha cookie recusavel; opt-in gatearia zero cookies.
2. **Botao "Entendi", nao "Aceitar"**, e **sem "Recusar"**: recusa que nao recusa nada alega escolha
   inexistente.
3. **O aceite nunca vai ao servidor.** Persisti-lo criaria tratamento de dado pessoal que hoje nao
   existe, para resolver problema que nao existe. E preferencia de exibicao.
4. **Valor persistido e a VERSAO do texto, nao booleano.** A revisao juridica vai reescrever a copy;
   booleano trataria texto novo como ja visto por quem so leu o antigo.
5. **`role="region"`, nunca `role="dialog"`, sem captura de foco, sem `aria-live`.** Os quatro modais
   do repo prendem foco; um aviso de cookie que prende foco vira obstaculo.
6. **Aviso DEPOIS do `<router-outlet />` no DOM**, travado por `compareDocumentPosition`: as telas
   publicas de desfecho focam o proprio `<h1>` (F-21/F-23), e o aviso antes precederia o conteudo na
   ordem de tabulacao.
7. **Fail-open no erro de storage**: falha significa aviso visivel, nunca aviso suprimido — a
   direcao segura da assimetria.
8. **Divergencia deliberada do `ThemeService`**: la o storage usa so optional chaining, que nao cobre
   `getItem`/`setItem` lancando. O modo de falha e documentado no repo (`login.component.ts:31`,
   `verify-totp.component.ts:146`, `copy-de-erro.ts:14`).

## Nota tecnica — tres testes meus que provavam nada

Todos pegos por mutacao, nenhum por revisao de leitura.

1. **Falha de storage via `vi.spyOn(Storage.prototype, ...)`.** No happy-dom o `localStorage` e um
   **Proxy**: `Object.getPrototypeOf(ls) === Storage.prototype` da `true` e `getItem` nao e own
   property, mas o spy de prototipo **nao intercepta**. O `catch` do servico nunca rodava. Duas
   mutacoes sobreviveram (fail-closed no `catch`, remover o `try` do `setItem`). Corrigido injetando
   `DOCUMENT` falso, que nao depende de interno do runtime de teste. Registrado na skill
   `sep-web-mutation-verified-testing`.
2. **Guarda dos links do rodape com busca global.** `getAllByRole('link', {name: /entrar/i})`
   encontrava o "Entrar" do hero, entao apagar o do rodape passava verde. Reescopado com `within()`
   no `.landing-footer` e nomes ancorados.
3. **Regressao da sobreposicao clicando num link do rodape da landing.** Sobreviveu a mutacao que
   apagava a regra CSS — o link nao estava coberto. Substituida por medicao direta do mecanismo:
   `padding-bottom` do `body` >= altura da faixa com ela visivel, e zero apos dispensar.

**Mutante equivalente registrado, nao contornado**: trocar `defaultView?.` por `defaultView!.`
sobrevive porque o `TypeError` cai no proprio `try/catch` e o metodo devolve o mesmo valor. E
equivalencia real de comportamento, nao teste fraco.

## Riscos declarados como pendencia, nao simulados

1. **O texto NAO passou por revisao juridica.** A pagina traz marcador visivel (`role="note"`), e as
   secoes que nao derivam de medicao — base legal, direitos do titular, contato do encarregado —
   entram **nomeadas como pendentes**, nunca preenchidas com texto inventado. Precedente:
   [`PLD.md`](../sep-api/PLD.md), mergeado com checklist juridico pendente.
2. **A configuracao de producao do cookie nao e observavel aqui.** A politica afirma `Secure` e
   `SameSite=Strict`, que sao o que producao exige (`RefreshCookieProperties.java:9-11`), mas os
   defaults deste ambiente sao `false` e `Lax` (`application.yml:95-96`). Nenhum teste local prova o
   que ops configurou. Mesma familia do defeito que a F-23 corrigiu na `/account-locked` — texto
   afirmando valor que o ambiente sobrescreve —, com o agravante de que aqui o texto e juridico.
3. **Layout <768px conferido so por `flex-wrap`.** A reserva de espaco se auto-ajusta pelo
   `ResizeObserver`, mas a aparencia da faixa quebrada em duas linhas nao teve conferencia visual.
4. **`offsetHeight` e sempre 0 no happy-dom**, entao o unit test prova a fiacao da reserva, nao a
   altura. Quem prova o efeito real e o e2e.

## Divida que a sprint EXPOE e nao corrige

**`SEP_ACCESS_TOKEN` guarda um JWT de acesso em `localStorage`** (`auth.service.ts:9`), legivel por
qualquer script na origem — exposicao a XSS. Escrever a politica honestamente torna isso publico.

Corrigir muda o contrato de autenticacao dos tres repos e **exige ADR**. A politica descreve o que
existe; nao promete o que nao existe.

## Follow-ups abertos por esta sprint

- **`SEP_ACCESS_TOKEN` fora do `localStorage`** (exige ADR; toca os 3 repos). Candidato a sprint
  propria.
- **Revisao juridica** do texto e preenchimento das tres secoes pendentes.
- **Termos de uso** — documento distinto, nao deriva de medicao do codigo.
- **`sep-mobile` sem equivalente**: o nativo nao usa cookie, mas a build PWA tem a mesma lacuna.
- **`sep-api` sem deteccao de vulnerabilidade de dependencia** — `build.gradle` nao tem plugin de
  scan. Ja nomeado no `STATE.md`; esta sprint reforca a urgencia, porque provou que o gate do front
  fica vermelho sem ninguem notar.
- **Rotulo "Criar conta"** no mesmo rodape (promete formulario, entrega pagina informativa) —
  deliberadamente nao corrigido aqui.

## Commits

```
cc5cbe9 chore(deps): corrigir vulnerabilidade high do nanoid no lockfile
60ddc0d feat(privacidade): pagina publica de politica de privacidade e cookies
d1a8214 feat(privacidade): servico de estado do aviso de cookies
50219a6 feat(privacidade): aviso de cookies dispensavel e nao modal
6c77015 feat(privacidade): montar aviso de cookies no root
b4bf128 feat(privacidade): link da politica no rodape da landing
08eeda5 fix(privacidade): aviso de cookies reserva o proprio espaco no documento
```

19 arquivos, +1004 / -6.

## Test plan

Todos rodados **depois** do ultimo commit, porque o `lint-staged` reescreve arquivo, com `EXIT`
capturado explicitamente (nunca por `| tail`, que mascara o codigo de saida):

- `npm run format:check` — 0
- `npm run lint` — 0
- `npm run lint:scss` — 0
- `npm run contract:check` — 0 (**85 operacoes / 0 lacunas**, inalterado)
- `npm run audit` — 0 (**1 high -> 0**)
- `npm test` — 0 (**833 / 97**)
- `npm run build` — 0 (AOT, initial total 310.54 kB)
- `npx playwright test` — 0 (**42 / 12**)

**25 mutacoes distintas**, em **33 aplicacoes** (oito repetidas depois de reescrever o teste que
elas haviam sobrevivido), ao longo das 6 Tasks: F-25.1 quatro, F-25.2 cinco, F-25.3 seis, F-25.4
duas, F-25.5 quatro, F-25.6 quatro. **Tres testes reescritos por terem sobrevivido**, e um mutante
equivalente registrado como equivalente em vez de contornado. Reversao conferida byte-identica em
cada rodada.
