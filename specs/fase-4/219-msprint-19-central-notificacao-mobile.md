# Spec 219 - M-Sprint 19 - Central de notificacao no mobile

## Metadados

- **ID da Spec**: 219
- **Titulo**: M-Sprint 19 - Central de notificacao no `sep-mobile`: contador no shell autenticado,
  lista paginada, marcar como lida, e o contrato do `IN_APP` nascendo compativel com push sem
  implementar push
- **Status**: **planejada** (criada em 2026-09-01)
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
