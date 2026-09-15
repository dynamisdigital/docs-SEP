# Spec 219 - M-Sprint 19 - Central de notificacao no mobile

## Metadados

- **ID da Spec**: 219
- **Titulo**: M-Sprint 19 - Central de notificacao no `sep-mobile`: contador no shell autenticado,
  lista paginada, marcar como lida, e o contrato do `IN_APP` nascendo compativel com push sem
  implementar push
- **Status**: **MERGEADA develop+main** (2026-09-15, PR #183 em `develop`, #184/#185 em `main`, arvore
  `f9409ea` conferida por conteudo; criada em 2026-09-01)
- **Fase do produto**: Fase 4 - produto novo (jornada e consumo de contrato novo); sem rota de
  escrita, endpoint ou migration. **Sem ADR previsto**
- **Trilha**: Mobile (`sep-mobile`)
- **Origem**: frente **A** do levantamento de notificacoes de 2026-09-01, lado mobile
- **Depende de**: [`038`](./038-sprint-38-modulo-notificacao-historico.md) **integrada em `develop`**.
  Independente da [`127`](./127-fsprint-27-central-notificacao-web.md). **Recomendavel apos a
  [`218`](./218-msprint-18-consumo-codigos-erro-mobile.md)**, que cria o `core/api/api-error.ts` que
  o mobile nunca teve — sem ela, esta sprint faz o decimo cast inline (ver §Ancora 2)
- **Desbloqueia**: o push da Fase 5, se e quando o gate de Firebase/APNs abrir
- **Responsavel principal**: Devs Plenos Mobile

## Numeracao

Consome o numero **219** (M-Sprint 19). O [`PRD-FASE-5.md`](../../docs-sep/PRD-FASE-5.md) §46
reservava **M-19 e M-20** para a Frente C (publicacao em lojas) depois do primeiro recuo do mobile,
provocado pela [`218`](./218-msprint-18-consumo-codigos-erro-mobile.md). Com esta spec, **o mobile da
Fase 5 renumera para M-20 e M-21**. E o **segundo** recuo do mobile — e o ultimo: com a faixa por fase, a Frente C passou a viver em **M-50/M-51**.

> **Encerrado em 2026-09-01**: a numeracao passou a ter **faixa reservada por fase** — Fases 1-4 em 0-49, Fase 5 em 50-99 ([`AGENT.md`](../../AGENT.md) §Numeracao de sprint e de spec). Este recuo foi um dos **oito** que o mecanismo antigo produziu, e o mecanismo **nao existe mais**: a Fase 4 cresce dentro da propria faixa sem tocar na Fase 5. O registro acima e historico.

## Objetivo

Mesmo objetivo da [`127`](./127-fsprint-27-central-notificacao-web.md), no outro canal — e com uma
diferenca que importa: **o mobile e onde notificacao faz mais sentido**, e e o unico dos dois onde
existe um caminho futuro para push.

Esta sprint entrega a central in-app. **Push continua fora**, gated por Firebase/APNs (mesmo gate das
lojas). O que ela faz e garantir que o contrato do `IN_APP` nasca compativel, para que push depois
seja acrescimo e nao reescrita.

## Ancoras verificadas (2026-09-01)

### 1. Zero notificacao, e nenhum plugin de push instalado

```bash
grep -oE '"@capacitor/[a-z-]+"' sep-mobile/package.json | sort -u
```

Devolve seis plugins: `android`, `app`, `cli`, `core`, `haptics`, `keyboard`, `preferences`,
`status-bar`. **`@capacitor/push-notifications` nao esta la**, e `grep` por notificacao em
`sep-mobile/src` devolve vazio.

### 2. O mobile ainda nao tem helper de extracao de erro

`src/app/core/api/` tem exatamente dois arquivos: `api.models.ts` e `support-reference.ts`. O
`core/api/api-error.ts` que o web tem desde a F-22 **nao existe** aqui, e ha **9 casts inline** de
`as ApiErrorResponse` espalhados por 8 arquivos.

A [`218`](./218-msprint-18-consumo-codigos-erro-mobile.md) cria o helper e unifica os 9. **Se esta
sprint rodar antes, ela faz o decimo cast** — e a Task 218.2 passa a ter 10 para unificar.

Nao e bloqueio, e ordem preferida. A M-17 pagou essa conta no `errorInterceptor` e a F-24 pagou no
`estabilizar()`, que o Gate mediu como **38 definicoes de um helper e 42 de outro**.

### 3. `support-reference.ts` e o padrao a espelhar

Ele **narra o campo antes de usar**: le `error.error.traceId`, valida com `VALID_TRACE_ID`, e so
entao monta a referencia de suporte. A superficie nova segue esse padrao — validar antes de usar —, e
nao o dos 9 casts, que confiam no shape.

### 4. A estrutura de features ja separa persona

`src/app/features/` tem `tomador/`, `credora/`, `authenticated/`, `pix/`, `public/`,
`design-system/`, `error/`. O contador precisa ser visivel de todas as areas autenticadas, entao vive
no shell, nao dentro de `tomador/` nem de `credora/`.

Isto importa mais no mobile que no web: com **um** gatilho ativo na 038
(`PixTransferenciaConcluidaEvent` -> tomador), a credora vera a central **sempre vazia**. A superficie
de vazio nao e caso de borda aqui; e o caso comum de metade das personas.

### 5. A build PWA e a nativa compartilham o codigo

O que esta sprint entrega vale para as duas. O APK `dev-offline` com MSW e o caminho de conferencia
manual, ja usado no smoke da M-13 e disponivel desde que o ambiente Android foi montado
(2026-09-01).

## Decisao tecnica principal — contrato compativel com push, sem construir push

Alcapao real: se a notificacao in-app for modelada como "linha numa lista", push depois vira
superficie paralela, com outro payload, outra deduplicacao e outro conceito de lida. Dois sistemas
para a mesma coisa.

O perimetro que evita isso, **sem construir nada de push**:

1. A notificacao ja tem **identidade estavel** vinda do backend (a 038 entrega), entao push depois
   referencia a mesma entidade em vez de carregar conteudo proprio.
2. O estado de lida ja e **do servidor**, nao do dispositivo — logo, ler no celular e ver lido no web.
3. A navegacao a partir de uma notificacao ja e resolvida por **rota**, e nao por callback local.

Os tres sao gratuitos agora e caros depois. Nada alem disso e antecipado: **sem** plugin, **sem**
registro de token, **sem** permissao de notificacao pedida ao usuario, **sem** service worker.

Pedir permissao de push antes de ter push seria o pior desfecho possivel — queima a permissao uma vez
so, e o usuario que nega nao e perguntado de novo.

## Escopo

### Dentro

1. `codigo?`/tipos da notificacao em `core/api/api.models.ts` e servico de consumo dos tres endpoints
   da 038.
2. Contador de nao-lidas no shell autenticado, visivel de `tomador/`, `credora/` e `pix/`.
3. Central de notificacao com as quatro superficies (lista, vazio, erro tecnico, carregando).
4. Marcar como lida por gesto, com o contador caindo na hora.
5. Mock MSW emitindo o formato do `sep-api`, **incluindo vazio e owner-scope**.
6. Testes e mutacao.

### Fora

- **Push**, em qualquer forma — plugin, token, permissao, service worker (§Decisao tecnica principal).
- **Preferencias e opt-out.** Frente **C**, com revisao juridica pendente pelo
  [ADR 0014](../../adr/0014-estrategia-de-notificacoes-transacionais.md).
- **Filtros, agrupamento, acoes em lote.** Um gatilho ativo nao justifica.
- **Badge no icone do app.** E push por outro nome no Android, e depende do mesmo gate.
- **Portar o `contract:check`** para o mobile. Follow-up ja nomeado no
  [`STATE.md`](../../docs-sep/STATE.md). Sem ele esta sprint segue verificavel por teste e mutacao; o
  que ela **nao** tem e gate automatico contra divergencia de contrato, e isso fica declarado.
- **Plugar o MSW no Vitest.** Tambem follow-up aberto. A Task 219.5 mexe no mock para o Playwright,
  que e onde ele ja roda.

## Criterios de aceite

1. Vitest e Playwright **>= baseline medida no Gate M-19.0**, 0 falhas. Ultimo registro: **527/70** e
   **41** e2e — a M-17 levou o smoke a 41 verdes depois de quatro meses vermelho, entao regressao ali
   e perda de terreno conquistado.
2. `lint`, `lint:scss`, `format:check`, `build`, `audit` verdes; `cap sync android` e
   `gradlew assembleDebug` OK.
3. **Acessibilidade**: contador com rotulo textual, central com `h1`, foco movido ao abrir, e
   `aria-live` no desfecho de marcar como lida. A M-17 teve de corrigir `<main>` aninhado em 4 telas e
   foco ausente em 2 — nao repetir.
4. **A superficie de vazio e testada como caso comum, nao de borda** (§Ancora 4): a credora ve a
   central vazia enquanto a frente **B** nao ampliar a cobertura.
5. **Mutacao obrigatoria**: quebrar o decremento do contador tem de reprovar; trocar a superficie de
   vazio pela de erro tem de reprovar; remover a validacao de shape do helper tem de reprovar.
6. **Nenhuma permissao de notificacao e solicitada** — conferido por `grep` no checkpoint e por
   inspecao do `AndroidManifest.xml`, que a M-13 endureceu para declarar **so** `INTERNET`.
7. O mock **nao** devolve notificacao de outro usuario. Owner-scope e responsabilidade do backend, e o
   mock que a ignora esconde o defeito mais grave possivel neste modulo.

## Riscos e limitacoes

- **Bloqueada por um merge manual**: a 038, conferida **por conteudo** no Gate M-19.0.
- **Sem `contract:check`, nada impede o mock de divergir do backend** a nao ser a conferencia manual
  do criterio 7. Risco estrutural do repo, nao introduzido aqui.
- **Metade das personas ve central vazia.** Com um gatilho so, e ele do tomador, a credora nao tem o
  que ver. Esperado, e precisa estar no PR — senao o review cobra conteudo que a sprint nao tem.
- **Ordem preferida com a 218.** Rodar antes dela custa um decimo cast inline a unificar depois.
- **Smoke contra backend real `:8080` segue nao executado**, como em todas as sprints mobile desde a
  M-13. Declarar, nao simular.
- **`@capacitor/push-notifications` ausente e escolha, nao esquecimento.** Registrar no doc para que a
  proxima sprint nao o instale "de passagem" e acabe pedindo permissao sem ter push.

## Rastreabilidade

| Item da spec | Task |
|---|---|
| Tipos + servico de notificacao em `core/api/` | 219.1 |
| Contador de nao-lidas no shell autenticado | 219.2 |
| Central com as quatro superficies | 219.3 |
| Marcar como lida, contador caindo na hora | 219.4 |
| Mock MSW fiel: vazio, owner-scope, formato | 219.5 |
| Testes, acessibilidade e mutacao | 219.6 |
| Baseline, conferencia da 038, ausencia de permissao de push | Gate M-19.0 e Fechamento |

Abre a frente **A** do levantamento de notificacoes, ao lado da
[`038`](./038-sprint-38-modulo-notificacao-historico.md) e da
[`127`](./127-fsprint-27-central-notificacao-web.md).

Steps de execucao criados em 2026-09-14:
[`219-msprint-19-steps.md`](../../steps-fase-4/mobile/219-msprint-19-steps.md).
Planejamento preparado contra o contrato entregue pela 038/ADR 0021; baseline e Tasks ainda nao
executadas. O helper da M-18 ja existe; os steps o reutilizam. Contagens antigas acima sao historicas:
a referencia da M-18 e 575 testes/72 arquivos e 45 E2E, a remedir no Gate M-19.0.

## O que a F-27 (web) aprendeu e vale para esta sprint (registrado em 2026-09-14)

A [`127`](./127-fsprint-27-central-notificacao-web.md) foi mergeada em `develop` e `main` (PR #170/#171)
consumindo o mesmo contrato. Nada do codigo do web e reaproveitavel no mobile, mas estes pontos custaram
investigacao e valem como criterio no Gate M-19.0 e nas Tasks:

- **Desconto duplo no contador** (achado P2 do review humano, depois de 59 mutacoes verdes): com duas
  leituras em voo, a recontagem pedida pela primeira confirmacao pode ja incluir a segunda, e a segunda
  confirmacao desconta de novo — o contador zera com aviso nao lido se a recontagem seguinte falhar. O
  mesmo acontece no retry apos timeout que gravou. A regra que fechou: so ha baixa local quando nenhuma
  contagem chegou depois do primeiro envio daquela leitura; na duvida o contador fica alto, nunca baixo.
  Testar **duas leituras concorrentes com recontagem**, nao so cada guarda isolada.
- **`404` neutro se prova comparando com o `404` de aviso inexistente**: o `path` do corpo repete a URL
  da propria requisicao, no backend e em qualquer mock fiel.
- **`lidaEm` chega com micro ou nanossegundos**; conferir o texto renderizado, nao so a presenca do rotulo.
- **Mock fiel filtra dono e canal antes de paginar e contar**; o `404` de aviso de e-mail do proprio dono e
  o mesmo de aviso alheio.
- **Largura da tela e propriedade global**: a F-27 verificava o sino visivel e deixou passar 58px de
  transbordo horizontal. Em mobile, medir `scrollWidth` da pagina, nao so o elemento novo.
- **Smoke real contra `:8080`**: procedimento, dados semeados e limpeza transacional na skill de projeto
  `sep-web-smoke-real-8080`, adaptavel ao `ionic serve`.

## Resultado medido (2026-09-15)

Branch `feature/msprint-19-central-notificacao` do `sep-mobile`, de `develop` `60a0540`, **7 commits**
(`60a0540..9cc2907`), 25 arquivos, **+3222/-8**, arvore `c3400eb`. Mergeada depois do fechamento (abaixo).
Detalhe por Task no checklist dos steps.

**Merge (2026-09-15)**: PR **#183** em `develop` (squash `b993c22`, arvore identica a da branch verificada `c3400eb`) e **#184**/**#185** em `main` (`7a25afa`/`8703076`, squash), back-merge `f79007d` limpo (`--cc` vazio). `develop` e `main` na arvore `f9409ea`, que difere da branch so
pelos PRs do Dependabot #180/#181 (`ci.yml`, `package.json`, lock); `src/`, `e2e/` e `android/` identicos. Gates
re-rodados na ponta `f79007d` apos `npm ci`: Vitest 673/76, Playwright 62, demais exit 0; audit **11 moderate**
/ 0 high (o `express` do `webpack-dev-server` passou a contar por uma advisory nova do `qs`).

**Gate M-19.0**: a 038 conferida por arvore (`6b3aab2`) em `sep-api` `origin/develop` `98d427c` e
`origin/main` `57b770b`, com controller, DTOs, enums e excecoes lidos na fonte. No mobile, `develop` e `main`
iguais por conteudo exceto o `eslint-plugin-jsdoc` 63 -> 64 do Dependabot #163, que entrou so em `develop`
(nao registrado no `STATE.md`; nao e pendencia de back-merge). Baseline em `develop`, todos exit 0:
Vitest **575/72**, Playwright **45**, audit 10 moderate / 0 high, `cap sync` e `assembleDebug` verdes.

| Aceite | Evidencia |
|---|---|
| 1. Vitest e Playwright >= baseline, 0 falhas | Vitest **575/72 -> 673/76** (cobertura 87,3% -> 88,2%); Playwright **45 -> 62**; bateria inteira re-rodada sobre a arvore final depois de `npm ci` limpo |
| 2. `lint`, `lint:scss`, `format:check`, `build`, `audit`; `cap sync` e `assembleDebug` | todos exit 0; audit 10 moderate / 0 high, igual a baseline; APK debug 5.323.397 bytes (o da baseline era artefato `UP-TO-DATE` de 2026-09-11, tamanhos nao comparaveis) |
| 3. Acessibilidade | sino com rotulo textual ("Notificacoes, 3 nao lidas", "contagem indisponivel", "pode estar desatualizado"); central com `h1` focado em `ionViewDidEnter`, inclusive no back; `role="status"` anuncia leitura e pagina nova; um unico `main` na pagina visivel (sem `<main>` aninhado); "Nao lida"/"Lida em" em texto, nao so cor; `aria-disabled` durante a leitura; foco no `h2` do aviso depois de marcar. Provado no Playwright (teclado, URL direta, reentrada) e no WebView do APK |
| 4. Vazio como caso comum | credora sem aviso in-app ve a superficie de vazio no Playwright contra o MSW e no smoke real; `200` com `content: []` nunca vira erro, e pagina fora do contrato nunca vira vazio |
| 5. Mutacao obrigatoria | baixa do contador (S2), vazio trocado por erro (template e TS) e guarda de tipo do `mensagemDaApi` (morre em "message numerica cai na mensagem padrao" da central) reprovam |
| 6. Nenhuma permissao de notificacao | plugins `@capacitor/*` iguais (8, sem `push-notifications`); manifest-fonte so `INTERNET`; mesclado `INTERNET`, `VIBRATE` e a permissao interna do AndroidX, igual a baseline; busca por `push-notifications`, `PushNotifications`, `POST_NOTIFICATIONS`, `FirebaseMessaging`, `requestPermissions` e `serviceWorker.register` so acha um comentario do `android/.gitignore`; nada mudou em `android/`, `package.json` ou lock |
| 7. Mock nao devolve aviso de outro dono | handlers filtram dono e canal `IN_APP` antes de paginar e contar; tirar qualquer um dos filtros (lista ou leitura) reprova o Playwright contra os handlers reais |

**Mutacao**: **83 mutantes distintos** em seis campanhas, cada um com prova de que entrou no arquivo e
restauracao conferida por md5/`cmp`: **80 mortos por teste nomeado**, **2 equivalentes** declarados e **1**
que perdeu o alvo porque a guarda saiu. Os sobreviventes viraram trabalho:

- `catch` sem geracao (219.2) sobreviveu: faltava teste de falha tardia de A com a consulta de B em voo.
- Desconto sobre contagem `desatualizada` e limpeza de falhas na busca (219.4): faltavam testes.
- Guarda de dono em `registrarLeitura` (219.4): redundante, **removida** junto com a comparacao de dono
  do registro — o `contagem` computado e o `carregar` seguinte ja cobrem.
- Equivalentes: `clear()` dos marcos no logout (o marco so avanca; entrada velha nunca autoriza baixa) e
  `--padding-bottom` da central (no `ion-tabs` a tab bar entra no fluxo, nao sobrepoe o conteudo).
- Item mais largo que a tela (219.6) sobreviveu a primeira medicao de largura — ver achados.

**Decisoes e desvios declarados**:

- Servico em `core/notificacoes/`, e nao `core/api/` como os steps escreviam: convencao do repo
  (`core/pix/`, `core/credores/`), igual a F-27.
- **O sino vive no `HeaderMobileComponent`**, componente de `layout/` presente nas 22 paginas autenticadas
  (tomador, credora e as tres telas com Pix embutido); a unica sem header e `perfil/biometria`. O
  `ShellComponent` pede a contagem uma vez ao montar e os headers so leem o store — no Ionic cada pagina tem
  o proprio `ion-header`, e um controle no template do `ion-tabs` seria overlay.
- **Store com quarta situacao, `desatualizada`**: numero recebido cuja reconsulta seguinte falhou continua
  na tela e o rotulo avisa (219.4.3). Baixa local coordenada por marco de contagem, como a correcao do P2
  da F-27, com o teste de duas leituras concorrentes com recontagem desde a primeira versao.
- **Referencia vira CTA "Ver contrato"** (diferente da F-27): rota montada no app,
  `/app/formalizacao/contratos/:id`, so para `CONTRATO`, id no formato de segmento seguro e role `CLIENTE`
  da rota de destino; referencia nula, ausente, de tipo desconhecido ou fora do formato fica sem CTA.
- **200 da leitura so confirma com o mesmo `id` e `lidaEm` preenchido**; corpo diferente e falha, e o retry
  idempotente resolve.
- `404` da leitura ramifica por status, nao por `codigo` (uma condicao so nesta rota).
- Tamanho de pagina 10, igual ao web.
- **Mock**: duas contas semeadas a mais (`tomadora.b@empresa.com` com avisos proprios e
  `credora@empresa.com` so com e-mail); divergencias deliberadas registradas no arquivo (volume de doze
  desembolsos para duas paginas, referencia ao `contrato-mock-1`, `lidaEm` gravado em UTC).
- **Falha no e2e vem de flag do mock** (`mock.notificacoes.falhar`), e nao de `page.route` — ver achados.

**Achados fora do plano**:

- **`page.route` nao intercepta requisicao atendida pelo service worker do MSW**: o teste de erro/retry
  nunca via a falha.
- **No Ionic, largura do documento nao mede transbordo do conteudo**: o `ion-content` recorta, e um item de
  420px deixou `document.documentElement.scrollWidth` igual a tela. A medida passou a olhar tambem o scroll
  element do `ion-content`.
- **`toBe` entre elementos DOM estoura a memoria do worker quando falha** (serializa a arvore do Ionic): a
  primeira sonda de foco "morreu" por OOM, sem teste reprovando. Assercao reescrita como comparacao
  booleana e mutante rodado de novo.
- **`chromium.connectOverCDP` nao conecta no WebView** (`Browser context management is not supported`); a
  conferencia no APK usou CDP cru e `adb input tap`. Procedimento na skill de projeto
  `sep-mobile-apk-conferencia-emulador`.
- CORS do perfil `dev` aceita `http://localhost:8100`, nao `127.0.0.1:8100` (a origem padrao do
  Playwright do repo): o smoke real rodou com `localhost`.

**Conferencia no APK dev-offline** (emulador `sep-pixel`, API 36, 1080x2340, headless, MSW ativo no
WebView): toque real por `adb input tap`, back fisico por `keyevent 4`, DOM e foco pelo CDP do WebView.
Login e sino "3 nao lidas"; header dentro da safe area; toque no sino abre a central com foco no `h1`;
rolagem horizontal 0 e paginacao acima da tab bar ao rolar ate o fim; "Marcar como lida" baixa para 2 com
anuncio; "Ver contrato" abre o detalhe; back fisico volta a central (foco no `h1`, aviso lido) e um segundo
back vai ao inicio sem sair do app. **15 de 15**, com screenshots conferidos. Nao houve aparelho fisico.

**Smoke real contra `:8080`** (perfil `dev`, `sep-api` na arvore `6b3aab2`, mobile sem MSW, dados
controlados e apagados ao fim): tres usuarios de teste cadastrados pela API; onze avisos `IN_APP` e um
`EMAIL` para A, um `IN_APP` para B e um `EMAIL` para C, semeados por SQL. Contador e lista de A sem o
e-mail; datas com microssegundos formatadas; referencia nula sem CTA e `CONTRATO` com CTA interno; duas
paginas; leitura na tela gravada no banco e remarcacao com o mesmo `lida_em`; `404 NTF-404-001` para aviso
de B igual ao de inexistente, com o aviso de B seguindo nao lido no banco; e-mail do proprio A `404`; `401`
sem token e sem codigo; `400 NTF-400-001` na faixa; `400` de UUID invalido sem codigo; troca A -> B -> C
sem heranca e vazio de C; nenhum erro de CORS. **27 de 27.** Base de volta a 0 usuarios, 0 notificacoes,
8335 registros de auditoria e 1963 `login_attempt`, os numeros de partida.

**Follow-ups para o review humano de fim de sprint**: marcador `?` e ausencia de marca visual para
`desatualizada` (decisao de produto); copy do vazio e do subtitulo; role `CLIENTE` repetida entre a central
e a rota do contrato; foco volta ao `h1`, e nao ao "Ver contrato", no retorno do contrato; duas contagens na
primeira entrada quando a primeira falha rapido; alvo de toque de 40px no sino e no tema; contador nao
reconsulta apos `404` + "Atualizar lista" (mesma decisao aberta no web); anuncio de leitura pode sair com
outra pagina na tela; `mock.auth` antigo esconde as contas novas no dev-offline; back fisico provado so no
emulador, sem teste versionado; Playwright fora do `CI-MOBILE` (anterior a sprint).
