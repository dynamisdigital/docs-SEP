# Spec 127 - F-Sprint 27 - Central de notificacao no web

## Metadados

- **ID da Spec**: 127
- **Titulo**: F-Sprint 27 - Primeira superficie de notificacao do `sep-app`: contador de nao-lidas no
  shell autenticado, lista paginada, marcar como lida, e mock MSW fiel
- **Status**: **MERGEADA develop+main** (2026-09-14) — PR #170 em `develop` (squash `06e5b39`) e #171 em
  `main` (`af9d9b1`), as tres pontas na arvore `b8e6012`, conferida por conteudo; criada em 2026-09-01
- **Fase do produto**: Fase 4 - produto novo (tela e consumo de contrato novo); sem endpoint, DTO de
  escrita, migration ou regra nova. **Sem ADR previsto**
- **Trilha**: Web (`sep-app`)
- **Origem**: frente **A** do levantamento de notificacoes de 2026-09-01, lado web
- **Depende de**: [`038`](./038-sprint-38-modulo-notificacao-historico.md) **integrada em `develop`**.
  Independente da [`219`](./219-msprint-19-central-notificacao-mobile.md) — as duas consomem o mesmo
  contrato e podem correr em paralelo. Independente da cadeia P1 (035-037, F-26): nenhum arquivo em
  comum
- **Desbloqueia**: nada diretamente. E a primeira superficie de notificacao que o produto tem
- **Responsavel principal**: Devs Plenos Web

## Numeracao

Consome o numero **127**, seguindo a sequencia do web em `specs/fase-4/` (a F-26 usou o 126). A Fase 5
nao tem sprint de web ([`PRD-FASE-5.md`](../../docs-sep/PRD-FASE-5.md) §46), entao **nao provoca
recuo nenhum**.

## Objetivo

O `sep-app` nao tem **nenhuma** superficie de notificacao:

```bash
grep -rl "Notification\|notificacao" sep-app/src/app --include=*.ts | grep -v spec   # vazio
```

A [`038`](./038-sprint-38-modulo-notificacao-historico.md) cria o historico e os endpoints. Esta
sprint da a eles uma tela.

Recorte deliberadamente pequeno: **contador, lista, marcar como lida.** Nada de preferencias, filtros,
agrupamento ou acoes em lote — ver §Escopo/Fora e §Decisao tecnica principal.

## Ancoras verificadas (2026-09-01)

### 1. Zero codigo de notificacao no web

`grep` por `Notification`, `PushNotification`, `FCM`, `firebase` em `sep-app/src` devolve tres
arquivos, e **nenhum e de notificacao**: dois sao o `client-channel.interceptor` e um e a pagina de
politica de privacidade, que menciona a ausencia de rastreamento.

### 2. O padrao de lista paginada ja existe

`core/api/api.models.ts:315-318` declara o formato `Page<T>` do Spring (`totalElements`), consumido
hoje na listagem de propostas. A 038 usa o mesmo padrao nos endpoints de notificacao — sem formato
novo a introduzir.

### 3. O shell autenticado e onde o contador mora

`features/authenticated/` reune as 11 areas do produto (`dashboard`, `cobranca`, `credito`,
`credora`, `pix`, `formalizacao`, `backoffice`, `admin`, `onboarding`, `profile`, `step-up`), com
`authenticated.routes.ts` como raiz. O contador precisa ser visivel de **todas** elas, entao vive no
shell, nao numa feature.

### 4. `estabilizar.ts` e o helper de teste consolidado

A F-24 reduziu **38 definicoes de `estabilizar` e 42 de `flush`** para 2, em
`src/testing/estabilizar.ts`. Esta sprint usa esses, e nao redefine nada — o custo daquela
consolidacao foi uma sprint inteira.

### 5. `api-error.ts` e o irmao a reusar

`core/api/api-error.ts` expoe `mensagemDeErroDaApi` e `mensagemBrutaDaApi`, com a guarda de `typeof`
documentada em `:52-55` — `err.error` e `unknown` de fato, e um `message` nao-string faria `.trim()`
**lancar** dentro do callback de erro, deixando a tela carregando para sempre. A superficie nova herda
essa exigencia.

Se a [`126`](./126-fsprint-26-consumo-codigos-erro-web.md) ja estiver integrada, `codigoDeErroDaApi()`
tambem existe e deve ser usado. Se nao estiver, esta sprint **nao** o cria — sao independentes.

## Decisao tecnica principal — sem polling, e o contador nao e verdade em tempo real

A tentacao obvia num contador de nao-lidas e atualizar sozinho. Esta sprint **nao faz polling**, pelo
mesmo motivo que a F-18, a F-20 e a M-16 nao fizeram: cada intervalo e uma requisicao por usuario
logado por ciclo, para um dado que muda raramente.

O contador atualiza em tres momentos: ao carregar o shell, ao abrir a central, e ao marcar algo como
lido. Entre eles, ele pode estar desatualizado — **e isso e aceitavel e precisa estar dito na copy**,
nao escondido.

Enquadrando pela otica de consistencia centrada no usuario: a garantia que esta sprint oferece e
**"read your writes"** — quem marca como lida ve o contador cair na hora. A garantia que ela **nao**
oferece e "read others' writes": notificacao criada pelo backend enquanto a aba esta aberta so
aparece no proximo carregamento.

Isso e escolha, nao limitacao acidental. Tempo real aqui exigiria SSE ou WebSocket — superficie nova,
com reconexao, autenticacao de canal e custo por conexao. Regra de tres: hoje ha **um** cenario que
pediria (o desembolso chegando com a aba aberta), e um cenario nao autoriza construir.

## Escopo

### Dentro

1. `core/api/notificacao.service.ts` consumindo os tres endpoints da 038.
2. Contador de nao-lidas no shell autenticado, visivel das 11 areas.
3. Central de notificacao: lista paginada, estado de lida/nao-lida, vazio e erro como superficies
   distintas.
4. Marcar como lida por gesto, com `read your writes` no contador.
5. Snapshot OpenAPI reexportado da branch da 038 e `contract:check` cobrindo as operacoes novas.
6. Mock MSW emitindo o mesmo formato do `sep-api`, **incluindo o caso vazio**.
7. Testes e mutacao.

### Fora

- **Preferencias e opt-out.** Frente **C**, e depende da revisao juridica que o
  [ADR 0014](../../adr/0014-estrategia-de-notificacoes-transacionais.md) declarou pendente.
- **Filtros, busca, agrupamento por tipo, acoes em lote.** Com **um** gatilho ativo na 038, a lista
  tem no maximo uma entrada por desembolso. Construir filtro para isso e a definicao de feature sem
  cenario — regra de tres reprova.
- **Tempo real** (§Decisao tecnica principal).
- **Push web.** Fora por decisao de fase, junto com o push mobile.
- **Notificacao dentro de cada jornada** (badge no card de contrato, aviso na tela de parcela). E
  superficie nova por tela, com decisao propria, e depende da cobertura da frente **B**.

## Criterios de aceite

1. `contract:check` fecha em **0 lacunas**; o numero de operacoes so muda pelo que a 038 acrescentou.
   Qualquer outra variacao e regressao. (Ultimo registro: 85 operacoes / 0 lacunas.)
2. Vitest e Playwright **>= baseline medida no Gate F-27.0**, 0 falhas.
3. `lint`, `lint:scss`, `format:check`, `build` e `audit` verdes. O `audit` e criterio, nao
   observacao — o Gate F-25.0 achou o gate do CI **vermelho em `develop` sem ninguem saber**.
4. **Acessibilidade**: o contador tem rotulo textual, nao so numero; a central tem landmark e move
   foco ao abrir; a lista anuncia mudanca de estado. As tres coisas que a F-22, a F-23 e a M-17
   tiveram de corrigir depois, uma sprint cada.
5. **As quatro superficies sao distintas e testadas**: lista com itens, vazio (`200` com lista vazia),
   erro tecnico, e carregando. Confundir vazio com erro foi defeito real na M-16.
6. **Mutacao obrigatoria**: quebrar o decremento do contador ao marcar como lida tem de reprovar;
   trocar a superficie de vazio pela de erro tem de reprovar.
7. Teste provando que a lista **nao** quebra com campo opcional ausente no corpo — mesma guarda de
   `api-error.ts:52-55`, pelo mesmo motivo.

## Riscos e limitacoes

- **Bloqueada por um merge manual**: a 038. O Gate F-27.0 confere **por conteudo**, nao por hash —
  foi conferindo por conteudo que o Gate F-25.0 descobriu que o registro da F-24 estava defasado por
  15 dias.
- **A central nasce quase vazia.** Com um gatilho ativo, so tomador com desembolso concluido tem o
  que ver. O mock MSW **precisa** cobrir o caso vazio, senao a superficie mais comum em producao e a
  unica sem teste.
- **O mock nao pode ser mais generoso que producao.** A M-17 achou exatamente essa assimetria em tres
  pontos e teve de corrigir. Aqui o risco especifico e o mock devolver notificacao de outro usuario
  sem o filtro de owner-scope que a 038 aplica — o que faria a tela parecer certa e esconder o
  defeito mais grave possivel neste modulo.
- **Smoke real contra `:8080` segue gate declarado pendente**, como nas F-21/F-23/F-24/F-25.
  Declarar, nao simular.
- **Copy sem persona.** As personas (P2) ainda nao existem; o vocabulario sai do que ja esta no
  `sep-api` e nas telas atuais. Nao inventar termo novo aqui.

## Rastreabilidade

| Item da spec | Task |
|---|---|
| `notificacao.service.ts` + snapshot OpenAPI | 127.1 |
| Contador de nao-lidas no shell autenticado | 127.2 |
| Central: lista paginada e as quatro superficies | 127.3 |
| Marcar como lida com `read your writes` | 127.4 |
| Mock MSW fiel, incluindo caso vazio e owner-scope | 127.5 |
| Testes, acessibilidade e mutacao | 127.6 |
| Baseline, conferencia da 038 por conteudo, gates declarados | Gate F-27.0 e Fechamento |

Abre a frente **A** do levantamento de notificacoes, ao lado da
[`038`](./038-sprint-38-modulo-notificacao-historico.md) e da
[`219`](./219-msprint-19-central-notificacao-mobile.md).

Steps de execucao criados em 2026-09-14:
[`127-fsprint-27-steps.md`](../../steps-fase-4/web/127-fsprint-27-steps.md).
Planejamento preparado contra o contrato entregue pela 038/ADR 0021; baseline e Tasks ainda nao
executadas. Os steps atualizam as ancoras de preparacao: shell em `layout/`, helper de erro existente
e `typecheck:spec` integrado pela F-28.

## Resultado medido (2026-09-14)

Branch `feature/fsprint-27-central-notificacao` do `sep-app`, de `develop` `ac0e24a` (arvore `7692e3b`,
identica a `main`), **12 commits** (`ac0e24a..164d351`), 21 arquivos, +3046/-21. **Mergeada** via PR **#170** em `develop` (squash `06e5b39`) e **#171** em `main` (squash `af9d9b1`), conferidos por conteudo: a branch verificada `164d351`, `develop` e `main` na mesma arvore `b8e6012`. Detalhe por Task no checklist dos steps.

**Gate F-27.0**: a 038 conferida por conteudo em `sep-api` `origin/develop` `98d427c` e `origin/main`
`57b770b`, as duas na arvore `6b3aab2`; baseline em `develop` com os dez gates exit 0.

| Aceite | Evidencia |
|---|---|
| 1. `contract:check` 0 lacunas, operacoes so pelo que a 038 acrescentou | **85 -> 88 / 0**; snapshot renovado do runtime `develop@98d427c` com o diff separado por natureza: da 038 (+3 operacoes, +6 schemas, 2 codigos) e da 037 acumulada (+63 codigos) |
| 2. Vitest e Playwright >= baseline, 0 falhas | Vitest **875/97 -> 951/100**; Playwright **42 -> 48**; re-rodados depois dos commits e de `npm ci` limpo |
| 3. `lint`, `lint:scss`, `format:check`, `build`, `audit` verdes | exit 0; audit 0 high (4 moderate, iguais a baseline) |
| 4. Acessibilidade | sino com rotulo textual ("Notificacoes, 3 nao lidas") e `aria-current` na central; foco no `h1` ao abrir e apos gesto; lista com `role="list"`; regiao de status permanente anuncia leitura e pagina nova; alvo de toque >= 24px a 390px; jornada inteira por teclado no Playwright |
| 5. Quatro superficies distintas e testadas | carregando, lista, vazio (`200` com `content: []`) e erro com retry; pagina alem do fim nao afirma central vazia; resposta sem `content` e erro, nunca vazio |
| 6. Mutacao obrigatoria | tirar a baixa do contador e trocar vazio por erro reprovam; **67 mutantes distintos** em oito campanhas (uma por Task e uma por correcao do review). Dois sobreviventes viraram remocao de guarda redundante, um revelou teste de foco vazio (corrigido) e um so morre no Vitest (`aria-disabled`) |
| 7. Opcional ausente nao quebra a lista | `lidaEm`/`referencia` ausentes e nulos testados; mutante que acessa sem tolerar reprova |

**Decisoes e desvios declarados**:

- Servico em `core/notificacoes/`, e nao `core/api/` como a spec escrevia: e a convencao do repo
  (`core/pix/`, `core/credora/`).
- **Handlers MSW adiantados da 127.5 para a 127.2**: o Vitest roda o MSW com `onUnhandledRequest:
  'error'`, e o contador geraria requisicao nao tratada em todo spec que renderiza o header. A 127.5
  ficou com a prova Playwright contra os handlers reais.
- **Contador root vinculado a sessao sem guardas redundantes**: a guarda por usuario na chegada da
  resposta e o contador de versao sobreviveram a mutacao (o `computed` por dono e o `unsubscribe` ja
  cobrem) e foram removidos. Guarda que nao morre por mutacao nao guarda.
- **Leituras confirmadas sobrepostas as listas**: uma lista pedida antes da confirmacao nao ressuscita
  aviso lido, sem depender de cancelar requisicao.
- A tela ramifica o `404` da leitura por **status**, e nao pelo `codigo`: nesta rota ha uma condicao so,
  e ler `NTF-404-001` seria consumidor decorativo. `erros: [404]` declarado; o `codigo` nao.
- `tipo` nao e lido nem declarado no descriptor; a referencia nao vira link.

**Achados fora do plano**:

- O mutante de foco apos troca de pagina sobreviveu na primeira rodada: o happy-dom nao move foco no
  clique, e o `h1` seguia focado desde a abertura. O teste foi corrigido, nao o mutante ignorado.
- `disabled` no lugar de `aria-disabled` so morre pela assercao do atributo: o happy-dom nao tira foco de
  botao desabilitado, e no Playwright o caminho de falha nao e provocavel sem override do mock.
- Horario na lista depende do fuso (CI em UTC, dev em -03); os testes afirmam so a data.
- **Header a 390px**: o documento ja tinha 455px sem o sino (o `Sair` ficava fora da tela), e a navegacao
  SPA do login mantem `scrollY=160` com o header `sticky` em `top=-160`. O segundo defeito segue aberto e
  registrado no teste estreito; o transbordo foi corrigido pelo review (abaixo).
- O `lidaEm` real chega com microssegundos e o `Date` do browser formata certo.

**Smoke real contra `:8080`** (perfil `dev`, `sep-api` na arvore `6b3aab2`, web sem MSW, dados controlados
e apagados ao fim): dois usuarios de teste cadastrados; dois avisos `IN_APP` e um `EMAIL` semeados por SQL
para A — a origem por evento ja foi provada no smoke da 038; este prova a UI no fio. Contador e lista de A
sem o e-mail; `referencia`/`lidaEm` presentes e nulos; ordem `criadaEm` desc; leitura na tela, contador
reconciliado e persistencia apos reload; remarcar preserva o `lidaEm`; e-mail do proprio A `404`; sem
token `401`; `size=101` `400 NTF-400-001`; B com contador zero e central vazia, e `404 NTF-404-001` ao
marcar o aviso de A, que seguiu nao lido no banco; nenhum erro de CORS. **19 de 19 verificacoes.** Base
de volta a 0 usuarios, 0 notificacoes e 8335 registros de auditoria, o numero de partida.

**Review humano de fim de sprint — dois P2, corrigidos na branch**:

- **Contador zerava com aviso nao lido** (`b7b0072`): com duas leituras em voo, a recontagem pedida pela
  primeira confirmacao podia ja incluir a segunda, e a segunda confirmacao descontava de novo; o mesmo no
  retry depois de timeout que gravou. Reproduzido antes da correcao (`0` onde era `1`, `1` onde era `2`).
  O store avanca um marco a cada contagem recebida, cada leitura guarda o marco do primeiro envio, e so ha
  baixa local quando nenhuma contagem chegou depois dele. Na duvida o contador fica alto, nunca baixo.
  Cinco mutantes mortos.
- **Sino agravava o transbordo horizontal** (`164d351`): 455 -> 513px a 390px. Duas causas somadas: sem
  reset global de `box-sizing`, header e sidenav empilhada usavam `width: 100%` + padding em `content-box`
  (48px e 32px alem da viewport, o header tambem no desktop, 1328px a 1280) e o conteudo do header nao
  cabia. `border-box` nos dois e, ate 600px, header sem nome/papel (a sidenav empilhada mostra o usuario).
  Documento medido sem rolagem horizontal em 360, 390, 700 e 1280px; o e2e estreito exige
  `scrollWidth <= 390`, e as tres mutacoes reprovam com a largura da propria causa (513, 422, 422).

Depois das correcoes: bateria completa a partir de `npm ci` com Vitest 951/100, Playwright 48, contrato 88/0,
audit 0 high e demais gates verdes.

**Limites que seguem**: central so `IN_APP` e um gatilho ativo; contador nao e tempo real; nulidade de
resposta fora do checker; **o Playwright nao roda no CI-APP**, entao a prova de owner-scope do mock so roda
localmente.

