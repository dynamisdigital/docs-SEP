# Spec 125 - F-Sprint 25 - Aviso de cookies e politica de privacidade no web

## Metadados

- **ID da Spec**: 125
- **Titulo**: F-Sprint 25 - Aviso de cookies dispensavel e pagina publica de politica de
  privacidade, descrevendo o armazenamento que o `sep-app` de fato usa
- **Status**: **CONCLUIDA na branch** `feature/fsprint-25-aviso-cookies` em 2026-08-21, 7 commits.
  **Push e PR sao manuais e ainda nao foram feitos**
- **Fase do produto**: Fase 4 - transparencia LGPD; primeira frente de **produto novo** no web desde
  que a Fase 4 esgotou o escopo sobre fake
- **Trilha**: Web (`sep-app`)
- **Origem**: levantamento de 2026-08-21. O web **nao tem** aviso de cookies, pagina de politica de
  privacidade, termos de uso, nem qualquer mencao a tratamento de dados fora do rodape regulatorio
  da landing. Nenhuma spec, step ou PRD de fase jamais previu o item
- **Depende de**: **F-Sprint 24 mergeada em `develop`**. Ver §Dependencia de ordem
- **Desbloqueia**: nada. Nao e pre-requisito de nenhuma sprint planejada
- **Responsavel principal**: Devs Plenos Frontend

## Por que esta sprint existe

O `sep-app` grava dados no navegador do usuario desde a Sprint 5 e **nunca disse isso a ele**. Nao ha
aviso, nao ha pagina de politica, nao ha link. O rodape da landing
(`landing.component.html:83-95`) traz letra miuda regulatoria da CMN 4.656 e **nada** sobre dados
pessoais ou armazenamento local.

Isso e uma lacuna de transparencia, nao de consentimento — e a diferenca decide o escopo inteiro
desta sprint. Ver §Decisao tecnica principal.

## Decisao tecnica principal — transparencia, nao consentimento

A pergunta que define a sprint: **existe cookie que o usuario possa recusar?** Medido em
2026-08-21: **nao**.

| | Medido | Fonte |
|---|---|---|
| Cookies gravados pelo produto | **1**, `sep-refresh` | `RefreshCookieService.java:62-68` |
| Finalidade | autenticacao (refresh token) | `RefreshCookieProperties.java:7` |
| Cookies de analytics/marketing | **0** | `index.html` sem script de terceiro |
| Scripts de terceiro no `index.html` | **0** | `src/index.html` (13 linhas, zero `<script>`) |
| Bibliotecas de rastreamento no bundle | **0** | sem GA/GTM/Hotjar/Clarity/Mixpanel/pixel |

Um cookie estritamente necessario **nao e recusavel**: recusa-lo e desligar o login. Construir banner
de opt-in, categorias de consentimento e gate programatico de carregamento produziria, hoje, um
mecanismo que gateia **zero** cookies — abstracao especulativa para consumidor inexistente, contra
`coding-guidelines` §2 e `clean-code` §"Complexidade Desnecessaria".

**Decisao confirmada pelo usuario em 2026-08-21**: nao ha plano de entrada de analytics, marketing ou
rastreamento de terceiro no web. Entao a sprint entrega **aviso + transparencia**, e o opt-in entra
no dia em que existir algo para gatear — junto com esse algo, que e quando ele passa a ter funcao.

### O que isso muda no desenho

- O banner **informa e e dispensavel**. Nao bloqueia, nao tem "recusar", nao tem categorias.
- O botao nao e "Aceitar", e "Entendi" — o texto do botao nao pode alegar consentimento que nao
  esta sendo colhido nem seria valido para cookie necessario.
- A politica **diz explicitamente por que nao ha opcao de recusa**, em vez de omitir a ausencia.

## Inventario medido — o que a politica vai afirmar

Cada linha conferida na fonte em 2026-08-21. Numero ou premissa que divergir no Gate F-25.0
**invalida o texto**, nao so o desenho.

### Cookie (unico)

| Atributo | Valor | Fonte |
|---|---|---|
| Nome | `sep-refresh` | `RefreshCookieProperties.java:18` (`APP_REFRESH_COOKIE_NAME`) |
| Finalidade | refresh token da sessao | `RefreshCookieProperties.java:7` |
| `HttpOnly` | **sempre** `true`, fixo em codigo | `RefreshCookieService.java:64` |
| `Path` | `/api/v1/auth` | `RefreshCookieProperties.java:21` |
| `Secure` | `false` **default**, `true` obrigatorio em producao | `RefreshCookieProperties.java:24`, `application.yml:95` |
| `SameSite` | `Lax` **default**, `Strict` obrigatorio em producao | `RefreshCookieProperties.java:27`, `application.yml:96` |
| `Domain` | vazio por default (limita ao host) | `RefreshCookieProperties.java:33` |
| Vida | `2592000s` = **30 dias** | `application.yml:77` (`APP_JWT_REFRESH_EXPIRATION`) |
| Remocao | `Max-Age=0` no logout | `RefreshCookieService.java:57-60` |

**Tudo, menos `HttpOnly`, e sobrescrivivel por ambiente** (`application.yml:77`, `:93-97`);
`HttpOnly` e o unico fixo em codigo (`RefreshCookieService.java:64`). A politica descreve a
configuracao de **producao**, que nao e observavel neste ambiente — ver §Riscos nao verificaveis.

### `localStorage`

| Chave | Conteudo | Fonte |
|---|---|---|
| `SEP_ACCESS_TOKEN` | JWT de acesso | `auth.service.ts:9` |
| `SEP_PENDING_MFA_CHALLENGE` | id do desafio MFA em curso | `auth.service.ts:10` |
| `SEP_THEME` | preferencia claro/escuro | `theme.service.ts:6` |
| `NG_APP_USE_MSW` | **so desenvolvimento**, override de mock | `main.ts:9` |

`SEP_ACCESS_TOKEN` e `SEP_PENDING_MFA_CHALLENGE` sao removidos no logout
(`auth.service.ts:84-85`). `NG_APP_USE_MSW` **nao entra na politica**: nao existe em build de
producao e cita-lo confundiria o leitor.

### `sessionStorage`

**Nenhum uso.** `chave-pix-intencao.store.ts:15` declara em comentario que a store vive so em
memoria, "nunca em localStorage/sessionStorage". As outras quatro ocorrencias de `localStorage` em
`src/` fora dos dois services sao **comentario**, nao uso — conferidas linha a linha
(`login.component.ts:31`, `verify-totp.component.ts:146`, `copy-de-erro.ts:14`, `main.ts:9`).

### Divida que o texto expoe e nao corrige

`SEP_ACCESS_TOKEN` guarda um **JWT de acesso em `localStorage`**, legivel por qualquer script na
origem — exposicao a XSS. Escrever a politica honestamente torna isso publico.

**Nao e escopo desta sprint corrigir.** Mover o token para memoria ou para cookie `HttpOnly` muda o
contrato de autenticacao dos tres repos e exige ADR. Fica como follow-up nomeado. A politica
descreve o que existe; nao promete o que nao existe.

## Escopo

### Em escopo

- `core/privacidade/aviso-cookies.service.ts` (novo): estado do aviso em signal readonly,
  persistencia versionada em `localStorage`, no molde do `ThemeService`.
- `layout/aviso-cookies/aviso-cookies.component.{ts,html,scss,spec.ts}` (novo): a faixa. `region`
  rotulada, **nao** `dialog`, **nao** modal, sem captura de foco.
- Montagem em `app.html`, **depois** do `<router-outlet />`.
- `features/public/politica-privacidade/` (novo): pagina publica com o inventario acima, rota
  `politica-de-privacidade` em `public.routes.ts`.
- Link no `<footer>` que ja existe em `landing.component.html:87-90`.
- Cobertura por mutacao de tudo acima, e medicao do efeito nos 39 testes Playwright.

### Fora de escopo

- **Opt-in, categorias de consentimento e bloqueio de script.** Ver §Decisao tecnica principal. Nao
  ha script de terceiro para bloquear nem cookie recusavel para gatear.
- **Banner de "recusar" ou "gerenciar preferencias".** Mesma razao. Um botao de recusa que nao
  recusa nada e pior que a ausencia dele: alega escolha inexistente.
- **`sep-mobile`.** O app nativo nao usa cookie (`client-channel.interceptor.ts:10` registra que
  "cookie nao se aplica"; persistencia via Capacitor Preferences). A build PWA teria a mesma lacuna,
  mas o recorte e outro repo, outra suite e outro gate. Sprint propria se for feita.
- **Tirar `SEP_ACCESS_TOKEN` do `localStorage`.** Divida de seguranca real; exige ADR e toca os tres
  repos. Follow-up nomeado.
- **Termos de uso.** Documento juridico distinto de politica de privacidade, com conteudo que nao
  deriva de medicao nenhuma do codigo. Nao entra por tabela.
- **Consentimento de cookie no `sep-api`.** Zero endpoint, DTO, migration ou contrato novo. O aceite
  e preferencia local de exibicao, nao dado pessoal a persistir no servidor — persisti-lo criaria
  tratamento de dado que hoje nao existe, para resolver um problema que nao existe.
- **`aria-live` no aparecimento do banner.** O aviso ja esta no DOM na primeira renderizacao; nao ha
  troca dinamica a anunciar, e uma live region competiria com o foco no heading que a F-21/F-23
  travaram nas telas publicas.
- **Smoke real contra `:8080`.** Ver §Riscos nao verificaveis.
- Qualquer mudanca no `sep-api`, no `sep-mobile` ou no snapshot OpenAPI.

## Arquitetura

Segue o repo, nao um padrao importado:

- **Servico em `core/`, componente em `layout/`**: `core/` tem **zero** componentes (conferido:
  `find src/app/core -name "*.component.ts"` vazio); os componentes de chrome global moram em
  `layout/`, no formato de 4 arquivos que `breadcrumbs`, `header`, `shell` e `sidenav` ja usam.
- **Nao ha `src/app/shared/`.** Nao criar um so para este componente.
- **`ThemeService` e o molde** (`theme.service.ts`): `providedIn: 'root'`, `DOCUMENT` injetado,
  `signal` privado + `asReadonly()` exposto, acesso a `localStorage` por
  `document.defaultView?.localStorage`. Copiar o padrao, com **uma** divergencia deliberada — §Erro.
- **Valor persistido e a versao do aviso**, nao booleano. O texto **vai** mudar quando a revisao
  juridica acontecer; e evento certo, nao hipotese. Bump da constante reexibe o aviso. Uma
  constante, sem maquinario de versionamento.
- **Ordem no DOM**: `<router-outlet />` primeiro, `<sep-aviso-cookies />` depois. As telas publicas
  movem foco para o heading programaticamente (F-21/F-23, travado por teste); o banner vindo por
  ultimo nao entra na frente disso e cai no fim da ordem de tabulacao.
- **`role="region"` + `aria-label`, nunca `role="dialog"`.** Os 4 dialogos do repo
  (`matching-aporte`, `renegociacao-tomador`, `matching-detail`, `chaves-pix`) sao modais e prendem
  foco. Aviso de cookie que prende foco e defeito de acessibilidade, nao recurso.

## Erro — onde o desenho se afasta do `ThemeService`

`ThemeService` protege apenas contra ausencia de `window`, via optional chaining
(`theme.service.ts:55`, `:60`). Ele **nao** protege contra `setItem` lancando — quota estourada,
modo privado, storage desabilitado por politica.

O repo tem cicatriz documentada desse exato modo de falha: `login.component.ts:31`,
`verify-totp.component.ts:146` e `copy-de-erro.ts:14` descrevem "o `tap` estourou ao persistir o
token, localStorage cheio". A copy de erro existe porque isso aconteceu.

Entao leitura e escrita do aviso vao **envolvidas**, e a falha e **fail-open para exibir**: storage
quebrado significa banner visivel de novo, nunca app quebrado, nunca aviso suprimido por acidente.
Suprimir por falha seria a direcao perigosa da assimetria.

## Conteudo da politica

Cada afirmacao deriva do §Inventario medido. Nenhuma frase de template generico da internet.

Cobre: o cookie `sep-refresh` (finalidade, flags, path, 30 dias, remocao no logout), as tres chaves
`SEP_*` de `localStorage`, a ausencia de `sessionStorage`, a ausencia de rastreamento de terceiro, e
**por que nao ha opcao de recusa**.

**Marcada PENDENTE revisao juridica formal**, no precedente do
[`PLD.md`](../../repos/sep-api/PLD.md), que foi mergeado com checklist juridico explicitamente
pendente. As secoes que nao derivam de medicao — base legal do tratamento, direitos do titular,
identificacao e contato do encarregado — entram **nomeadas como pendencia**, nao preenchidas com
texto inventado. Marcador visivel na pagina, nao so comentario no fonte.

## Riscos nao verificaveis nesta sprint

Registrar como gate explicito na DoD, nao como pendencia difusa:

1. **A configuracao de producao do cookie nao e observavel aqui.** A politica vai afirmar `Secure` e
   `SameSite=Strict`, que sao o que producao **exige** (`RefreshCookieProperties.java:9-11`), mas os
   defaults deste ambiente sao `false` e `Lax` (`application.yml:95-96`). Nenhum teste local prova o
   que ops configurou. E a mesma familia do defeito que a F-23 corrigiu na `/account-locked`: texto
   fixo afirmando valor que o ambiente sobrescreve — com o agravante de que aqui o texto e juridico.
   **Mitigacao no proprio texto**: descrever a configuracao como politica de producao, sem alegar
   medicao do ambiente do leitor.
2. **O texto juridico nao foi revisado por advogado.** Declarado na pagina e no
   `SPRINT-F-25-PR.md`, nao escondido.
3. **Efeito do banner nos 39 testes Playwright e desconhecido ate a medicao.** Ver §Dependencia de
   ordem e a Task F-25.6.

## Dependencia de ordem

**F-Sprint 24 precisa estar mergeada em `develop` antes desta sprint comecar.** Ela esta concluida na
branch `feature/fsprint-24-divida-tecnica` com 13 commits, e o push e o PR sao manuais e ainda nao
foram feitos (ver [`STATE.md`](../../docs-sep/STATE.md) §Onde estamos).

Sair de `develop` antes disso significa conflito garantido: a F-24 tocou `app.html` indiretamente via
interceptors e reescreveu 80 definicoes de helper de teste para 2, em
`src/testing/estabilizar.ts` — que e exatamente o helper que os specs novos desta sprint vao importar.

## Definicao de pronto

- [ ] Primeira visita exibe o aviso; "Entendi" o remove; recarga nao reexibe; bump da constante de
      versao reexibe. Os quatro caminhos com teste.
- [ ] `localStorage` indisponivel **ou lancando em `setItem`** nao quebra a renderizacao e mantem o
      aviso visivel. Teste dos dois modos de falha, separados.
- [ ] O aviso **nao rouba o foco** do heading em `/login` e `/account-locked`, com teste — e nao usa
      `role="dialog"` nem captura de foco.
- [ ] `/politica-de-privacidade` alcancavel sem sessao, com landmark e heading focavel no padrao das
      demais publicas.
- [ ] A pagina cita **cada** item do §Inventario medido, e as assercoes de teste sao por **papel
      semantico e identificador** (`sep-refresh`, `SEP_ACCESS_TOKEN`, `SEP_THEME`), **nunca por prosa
      colada** — o defeito esta registrado em `account-locked.component.spec.ts`, cujas assercoes de
      copy quebram com reformatacao pura de template.
- [ ] Marcador de revisao juridica pendente visivel na pagina.
- [ ] Os **39** testes Playwright rodados **antes** de qualquer blindagem, e o resultado citado no
      fechamento. Se quebrarem, correcao em **um** lugar (`storageState` no
      `playwright.config.ts`), **nunca** editando os 11 arquivos de spec.
- [ ] Todo teste novo verificado por mutacao: mutacao aplicada, teste falhando, mutacao revertida.
      Teste que sobrevive a mutacao do codigo que alega cobrir e **nao entregue**.
- [ ] Gates verdes: `format:check`, `lint`, `lint:scss`, `test`, `build`, `audit`, `contract:check`.
      **O `audit` entrou vermelho**: o Gate F-25.0 mediu 1 `high` pre-existente em `develop`
      (`nanoid`), corrigido em commit isolado antes do escopo — ver §Gate.
- [ ] `contract:check` **inalterado em 85 operacoes / 0 lacunas** — a sprint nao consome contrato
      nenhum, entao qualquer movimento nesse numero e regressao, nao progresso.
- [ ] **Gates declarados como pendentes, nao como feitos**: revisao juridica do texto e conferencia
      da configuracao real do cookie em producao, ambos nomeados no `SPRINT-F-25-PR.md`.

## Gates que nao contam como task

- Precheck e baseline medida (Gate F-25.0): numero nao medido no gate nao pode ser citado no
  fechamento.
- PR description ao fim, e atualizacao dos indices documentais.

## Skills obrigatorias

`coding-guidelines`, `clean-code` e `sep-web-mutation-verified-testing`, conforme
[`AGENT.md`](../../AGENT.md) §Skills e o precedente da F-22/F-23/F-24.
