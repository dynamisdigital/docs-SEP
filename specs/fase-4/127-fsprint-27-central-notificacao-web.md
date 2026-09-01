# Spec 127 - F-Sprint 27 - Central de notificacao no web

## Metadados

- **ID da Spec**: 127
- **Titulo**: F-Sprint 27 - Primeira superficie de notificacao do `sep-app`: contador de nao-lidas no
  shell autenticado, lista paginada, marcar como lida, e mock MSW fiel
- **Status**: **planejada** (criada em 2026-09-01)
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

Steps criados just-in-time em `steps-fase-4/web/127-fsprint-27-steps.md` quando a sprint for aprovada
para execucao.
