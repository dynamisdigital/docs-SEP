# Steps - F-Sprint 27 - Central de notificacao no web

**Spec**: [`127`](../../specs/fase-4/127-fsprint-27-central-notificacao-web.md).
**Status**: **MERGEADA develop+main** em 2026-09-14 — PR #170 (`develop`, squash `06e5b39`) e #171 (`main`, `af9d9b1`), arvore `b8e6012` identica a da branch verificada `164d351` (12 commits, `ac0e24a..164d351`, incluindo as duas correcoes do review de fim de sprint). Resultado medido na spec [`127`](../../specs/fase-4/127-fsprint-27-central-notificacao-web.md) §Resultado medido.
**Destino**: `sep-app`; backend somente leitura; documentacao em `docs-SEP`, com Git manual.
**Branch sugerida**: `feature/fsprint-27-central-notificacao`, de `develop` atualizado e verificado.
**Dependencia**: Sprint 38 integrada; registro de merge em 2026-09-14, a reconferir por conteudo no Gate F-27.0. Independente da M-19.

## Objetivo e limites

Permitir ao usuario consultar seus avisos e marcar cada um como lido, com contador compartilhado
no shell autenticado. Central em `/app/notificacoes`, acessivel a qualquer usuario autenticado.
Usar o New Design System SEP vigente, Angular Standalone, Signals e SCSS do projeto.

Sem polling, SSE, WebSocket, push, preferencias, filtros, busca, agrupamento ou leitura em lote.
Sem alterar backend, ampliar gatilhos ou corrigir o checker de contrato de passagem. O historico de
e-mail nao aparece na central. Leitura de notificacao nao e operacao financeira nem exige step-up.

## Fontes e ancoras desta preparacao

- [`ADR 0021`](../../adr/0021-modulo-notificacao-transversal.md), especialmente central `IN_APP` e payload por allowlist.
- [`NOTIFICACOES.md`](../../repos/sep-api/NOTIFICACOES.md), secao Contrato da central.
- `sep-api/.../notificacao/web/controller/NotificacaoController.java` e DTOs em `web/dto/`.
- `sep-app/src/app/layout/shell/shell.component.ts`: shell real fica em `layout/`, nao em `features/`.
- `features/authenticated/authenticated.routes.ts`: montar a central como filha do shell, fora das guardas especificas de Pix/backoffice/credora.
- `core/api/api-error.ts` e `src/testing/estabilizar.ts`: reusar extratores e helpers existentes.
- `package.json`: `typecheck:spec`, `contract:check` e `audit` ja existem. Nao recria-los.
- `contracts/README.md`: checker nao verifica nulidade/obrigatoriedade das responses. CI usa snapshot;
  `CONTRACT-DRIFT` verifica runtime periodicamente, mas nao impede merge do backend.

Os numeros e ausencias de 2026-09-01 da spec sao historicos. Esta preparacao conferiu arquivos
locais; nao equivale a fetch, conferencia de CI ou execucao dos gates.

## Contrato a consumir

| Operacao | Request | Sucesso | Erros documentados |
|---|---|---|---|
| Listar | `GET /api/v1/notificacoes?page=0&size=20` | `200 Page<NotificacaoResponse>` | `400`, `401` |
| Contar | `GET /api/v1/notificacoes/nao-lidas/contagem` | `200 { naoLidas: number }` | `401` |
| Marcar | `POST /api/v1/notificacoes/{id}/leitura`, sem DTO de escrita | `200 NotificacaoResponse` | `400`, `401`, `404` |

Lista ordenada pelo servidor por `criadaEm DESC, id DESC`; `page >= 0`, `size` entre 1 e 100.
O dono vem do token: nenhum parametro `usuarioId`. POST idempotente, preservando a primeira
`lidaEm`; nao exige `Idempotency-Key`. `NTF-400-001` identifica paginacao invalida;
`NTF-404-001` significa aviso inexistente, alheio ou fora do canal da central, indistinguiveis.
UUID invalido no POST e outro `400`: nao inventar codigo para ele.

Item: `id`, `tipo`, `titulo`, `mensagem`, `criadaEm`, `lidaEm`, `referencia { tipo, id }`.
Nao tem `canal`, `usuarioId`, `origemId` ou estado de entrega. `lidaEm` e `referencia` chegam
presentes e nulos quando vazios; o OpenAPI nao os marca como required por limitacao do springdoc.
Modelar nulidade e tolerar ausencia defensivamente, sem transformar resposta malformada em lista vazia.
O `codigo?` pertence a `ApiErrorResponse`, nao ao item de notificacao.

## Gate F-27.0 - Integracao, ambiente e baseline

### Step 127.0.1 - Conferir a cadeia antes de implementar

1. Reler `STATE.md`, spec 127, ADR 0021 e contrato operacional. Preservar mudancas locais.
2. No `sep-api`, fetch e conferencia por conteudo de `origin/develop`: controller, DTOs, V61,
   recorte owner-scoped e testes `CentralNotificacoesIT`. Hash de squash nao prova ausencia.
3. No `sep-app`, conferir `main` versus `develop` por ancestralidade **e conteudo**, inclusive
   dependencias/CI. Confirmar a F-28 e os follow-ups integrados; F-27 tem numero menor, mas parte
   da base atual. Se houver integracao pendente, registra-la antes de cortar branch.
4. Com working tree preservado, atualizar `develop` por `git pull --ff-only` e criar a branch.
   Remover descricoes temporarias anteriores somente se ja usadas nos PRs, conforme `AGENT.md`;
   nao apagar artefatos da M-19 nem do backend.
5. Exportar OpenAPI de runtime comprovadamente correspondente ao backend integrado. Registrar
   commit, perfil e data; API disponivel em `:8080` sem identificar a build nao comprova a fonte.

### Step 127.0.2 - Medir os gates

Em `sep-app`, executar individualmente e registrar exit code, contagens e falhas:

```bash
npm ci
npm run format:check
npm run lint
npm run lint:scss
npm run typecheck:spec
npm test
npm run e2e
npm run contract:check
npm run build
npm run audit
```

Baseline historica: Vitest 875/97, Playwright 42, contrato 85/0. **Nao usar como resultado atual**.
Falha preexistente exige diagnostico e tratamento separado; nao reduzir gate nem usar `--force`.
Registrar tambem comportamento do shell/header, landmarks existentes, logout e troca de sessao.

**Saida do Gate**: tabela de resultados, fonte do contrato, arquivos que serao tocados e pendencias.
Sem fonte de contrato ou dependencia integrada, nao iniciar consumo com payload inventado.

## Ordem e protocolo

Gate F-27.0 -> 127.1 -> 127.2 -> 127.3 -> 127.4 -> 127.5 -> 127.6 -> fechamento.
Testes unitarios acompanham cada Task; 127.6 consolida E2E e mutacoes, nao adia todos os testes.

Aplicar `coding-guidelines`, `clean-code`, `codenavi`, `code-review-skill` e a lente de produto.
Arquitetura/acoplamento: transporte no servico de API, estado compartilhado no menor escopo que
atenda shell e central, componentes cuidando de apresentacao. Nao criar barramento generico.
Em cada Task: teste observado falhar, implementacao minima, verificacao e checkpoint com status,
diff, arquivos, testes, riscos e commit sugerido. Staging/commit somente com aprovacao; push/PR
manuais. Git de `docs-SEP` manual. Este documento planeja a execucao; nao a registra como concluida.

## Task 127.1 - Tipos, servico e snapshot

### Steps

1. Acrescentar tipos em `core/api/api.models.ts`, reaproveitando `Page<T>`; conferir enums reais.
   Declarar `lidaEm?: string | null` e referencia opcional/nula conforme contrato e tolerancia acima.
2. Criar `core/api/notificacao.service.ts` com listar, contar e marcar; usar base URL/interceptors
   existentes. Testar metodo, path, paginacao, corpo e resposta do POST; sem parametro de dono.
3. Renovar `contracts/openapi.snapshot.json` pelo procedimento de `contracts/README.md`, atualizando
   meta. Nunca editar o snapshot manualmente. Separar o diff da 038 de alteracoes acumuladas da 037.
4. Declarar as tres operacoes e DTOs consumidos em `consumed-contracts.json`. Declarar erros/codigos
   apenas quando houver ramo correspondente; ajustar ao fechar 127.4. Nao adicionar gaps para obter verde.
5. Comparar inventario antes/depois: esperado **baseline + 3 operacoes consumidas**, zero lacunas
   (88/0 se a baseline ainda for 85/0). Crescimento do enum de erros nao e operacao nova.

**Verificar**: specs do servico, `contract:check`, `typecheck:spec`, lint, format e build.
**Pronto**: contrato rastreavel ao runtime, sem campos internos inventados; testes de nulidade e
ausencia previstos para a renderizacao, pois o checker nao os prova.
**Commit**: `feat(notificacoes): consumir contrato da central no web`.

## Task 127.2 - Contador compartilhado no shell

### Steps

1. Integrar acesso textual a central no shell/header existente, visivel em todas as areas
   autenticadas e em viewport estreito. Nao copiar contador para cada feature.
2. Carregar contagem ao montar shell e ao abrir central; compartilhar a mesma fonte de estado.
   Abertura inicial nao deve disparar consultas duplicadas. Sem consulta por timer.
3. Diferenciar contagem zero, carregando e indisponivel. Falha de contagem nao bloqueia navegacao
   nem afirma zero. Copy deve dizer que a contagem atualiza ao abrir a central e apos marcar leitura.
4. Vincular estado a sessao: limpar ao logout/troca de usuario e cancelar ou ignorar respostas
   da sessao anterior. Se o store for root, destruir o componente sozinho nao limpa esse estado.
5. Testar carregamento, zero, erro, entrada na central, navegacao entre areas sem polling e troca
   A -> B com resposta tardia de A. Usar rotulo como "Notificacoes, 2 nao lidas", nao numero isolado.

**Verificar**: specs do estado e shell, typecheck, lint e build.
**Pronto**: contador unico, acesso sempre disponivel, sem vazamento entre sessoes.
**Commit**: `feat(notificacoes): exibir contador no shell autenticado`.

## Task 127.3 - Central paginada e superficies

### Steps

1. Criar feature em `features/authenticated/notificacoes/` e rota filha `notificacoes`.
2. Usar lista semantica, titulo, mensagem como texto (sem HTML), data e estado textual de leitura.
   Preservar ordem do servidor; paginar por `totalElements`, nao pela quantidade da pagina atual.
3. Tornar distintos: carregando, lista, vazio real (`200` com `content: []`) e erro com retry por
   gesto. Pagina vazia alem do fim nao deve afirmar que toda a central esta vazia se total > 0.
4. Ao trocar pagina ou repetir consulta, cancelar/ignorar resposta substituida. Testar resposta da
   pagina anterior chegando depois da nova; nao juntar itens de paginas ou sessoes distintas.
5. Reusar `mensagemDeErroDaApi`/extratores existentes; testar erro nulo, HTML/string, objeto e
   mensagem nao-string. `lidaEm`/`referencia` ausentes ou nulos nao quebram renderizacao.
6. Conferir landmark do shell antes de criar outro `main`; `h1` com foco ao abrir e paginacao
   operavel por teclado. Referencia nao deve virar URL arbitraria; nenhuma navegacao nova de
   contrato e obrigatoria no web por esta spec.

**Verificar**: specs da central, typecheck, lint/SCSS, format e build.
**Pronto**: quatro superficies testadas, paginacao correta e foco sem landmark aninhado.
**Commit**: `feat(notificacoes): criar central paginada no web`.

## Task 127.4 - Marcar como lida sem perder consistencia

### Steps

1. Acao explicita por item; abrir a central nao marca nada automaticamente. Bloquear reentrada
   do mesmo id enquanto POST esta em voo, inclusive chamada direta do handler.
2. Apos `200`, aplicar o item retornado, incluindo `lidaEm` do servidor. Nao gerar timestamp local.
   Atualizar o contador conhecido uma unica vez na transicao local nao-lida -> lida, sem negativos;
   reconsultar contagem para reconciliar leitura feita em outro canal ou contagem ja desatualizada.
3. Invalidar leituras de lista/contador iniciadas antes da mutacao: resposta atrasada nao pode
   ressuscitar item nao lido nem aumentar contador antigo. Se a contagem era desconhecida, mantem-se
   desconhecida ate reconsulta; nao inventar numero. Reconsulta falha nao desfaz leitura confirmada.
4. Em POST falho, nao confirmar leitura/decrementar; liberar retry. `404` oferece mensagem neutra
   e reconsulta por gesto, sem revelar se existe para outro dono. `401` segue interceptor existente.
   Timeout pode ter comitado: retry usa mesmo id e a idempotencia do servidor, sem segunda baixa local.
5. Anunciar sucesso/falha com regiao de status acessivel; preservar foco quando o botao mudar.
   Testar duplo clique, leitura repetida, erro, resposta tardia e falha apenas na recontagem.

**Verificar**: specs de estado/central, typecheck, contrato (incluindo ramos declarados), lint e build.
**Pronto**: leitura confirmada visivel imediatamente, reconciliacao sem dupla baixa, erro recuperavel.
**Commit**: `feat(notificacoes): marcar leitura e reconciliar contador`.

## Task 127.5 - MSW fiel ao usuario e ao contrato

### Steps

1. Implementar tres handlers em `src/mocks/handlers.ts`, conforme autenticacao ja usada no mock.
   Nao criar bypass de token nem aceitar parametro de dono. Fixture interna pode ter owner/canal;
   resposta publica tem somente DTO. Filtrar owner e `IN_APP` antes de paginar e contar.
2. Semear usuario com mais de uma pagina, itens lidos/nao-lidos, outro usuario e conta sem avisos.
   Conta credora sem desembolso tem vazio; nao impor vazio por role, pois o dono pode ser tomador tambem.
3. POST preserva primeira `lidaEm`; id alheio, inexistente ou EMAIL devolve mesmo `404`. Pagina/size
   invalidos reproduzem `400`; sem autenticacao reproduz `401`. Total e contagem sao do recorte inteiro.
4. Reset deterministico entre testes, preservando leitura entre requests do mesmo cenario. Reusar
   helpers E2E existentes, inclusive reset de login quando necessario.
5. Provar com Playwright os handlers reais: A lista/conta/marca, B nao ve nem marca item de A;
   nao substituir os tres handlers por mocks do teste e afirmar que MSW foi exercitado.

**Verificar**: Playwright dirigido, typecheck, format e lint.
**Pronto**: vazio comum, paginacao, ownership e idempotencia reproduzidos no caminho offline.
**Commit**: `test(notificacoes): modelar central owner-scoped no MSW`.

## Task 127.6 - Regressao, acessibilidade e mutacao

Usar `src/testing/estabilizar.ts`, sem novas copias de helpers. Executar campanha em copia/backup
dos arquivos, conferindo diff antes de testar e restauracao byte a byte depois. Cada mutacao deve
reprovar por comportamento, nao por erro de sintaxe; sobrevivente exige analise, nao remocao do teste.

| Mutacao | Prova exigida |
|---|---|
| Remover baixa do contador apos POST confirmado | Teste de comportamento falha antes da recontagem responder |
| Renderizar vazio como erro | Teste de `200 content: []` falha |
| Acessar referencia/lidaEm sem tolerar ausencia | Teste de renderizacao com opcionais ausentes falha |
| Remover bloqueio de reentrada ou ignorar versao de consulta | Teste de duplo gesto/resposta atrasada falha |
| Remover owner-scope ou recorte IN_APP do MSW | Playwright contra handlers reais falha |
| Apagar uma rota/campo consumido do snapshot em copia | `SEP_OPENAPI_SCHEMA=<copia> npm run contract:check` falha |
| Remover operacao nova do descriptor | Teste que prende o inventario consumido falha; checker sozinho nao prova completude |

Playwright: entrada pelo shell e URL direta, paginacao, vazio, erro/retry, leitura e contador,
troca de conta, teclado, foco e anuncio de leitura. Conferir viewport estreito e desktop.
Rodar a bateria do Gate F-27.0 novamente; contagens >= baseline, zero falhas, contrato baseline + 3/0.

**Smoke real da central**: tentar em ambiente controlado, identificando backend e usuarios de teste.
Listar/contar/marcar/reabrir, conferir `404` de outro dono sem alterar seu item e recontar. Reusar
procedimento da 038 sem provocar bloqueio de conta compartilhada. Se indisponivel, registrar motivo
e passos pendentes: smoke backend 20/20 da 038 nao prova esta UI.

**Commit**: `test(notificacoes): verificar jornada e acessibilidade da central web`.

## Fechamento e rastreabilidade

- [x] Gate F-27.0: 038 conferida por arvore (`6b3aab2`) em `sep-api` `develop`/`main`; `sep-app` `develop`
      == `main` (`7692e3b`); baseline com os dez gates exit 0 (Vitest 875/97, Playwright 42, contrato 85/0).
- [x] 127.1 (`50a8b43`, hotfix `9fc7b08`): tipos, servico em `core/notificacoes/`, snapshot do runtime
      `develop@98d427c` com diff separado por natureza, tres operacoes consumidas, 88/0; testes contra o
      descriptor real prendem inventario, rota e `lidaEm`.
- [x] 127.2 (`b847b37`, hotfix `48cb4c5`): contador root vinculado a sessao, sem polling, sino com rotulo
      textual; handlers MSW owner-scoped **adiantados da 127.5** (Vitest com `onUnhandledRequest: 'error'`).
      Duas guardas redundantes removidas por sobreviverem a mutacao.
- [x] 127.3 (`4b1f995`, hotfix `fd9eca3`): quatro superficies, pagina por `totalElements`, cancelamento da
      consulta anterior, opcionais seguros, foco no `h1`, sem `main` aninhado, `role="list"`.
- [x] 127.4 (`317bd6b`, hotfix `87ae2b7`): leitura por gesto com reentrada bloqueada, `lidaEm` do servidor,
      baixa unica sobre numero conhecido, leituras confirmadas sobrepostas a listas antigas, `404` neutro,
      retry com o mesmo id; `erros: [404]` no descriptor.
- [x] 127.5 (`96e6b0c`): Playwright contra os handlers reais, sem override; oito mutacoes do mock mortas.
- [x] 127.6 (`cb0450e`): anuncio de pagina, `aria-current` no sino, e2e de teclado/URL direta/390px;
      smoke real contra `:8080` **19/19** com dados apagados ao fim.
- [x] Review humano de fim de sprint, dois P2 corrigidos com checkpoint e commit proprios: contador que
      descontava leitura ja refletida na recontagem (`b7b0072`) e transbordo horizontal do header/sidenav
      em tela estreita (`164d351`), ambos reproduzidos antes da correcao e provados por mutacao.
- [x] Revalidado depois dos commits e de `npm ci` limpo: Vitest 951/100, Playwright 48, contrato 88/0,
      audit 0 high, demais gates verdes.
- [x] Spec com resultados/desvios, `repos/sep-app/README.md`, `STATE.md`, historico, indice de specs e
      `AI-ROADMAP.md`. `contracts/README.md` **nao precisou mudar**: o checker nao ganhou cobertura nova.
- [x] `repos/sep-app/SPRINT-F-27-PR.md` criado com resultados, commits e limitacoes.
- [x] Checkpoint antes de cada commit; push e PR manuais pelo responsavel. Merge conferido por arvore
      depois de acontecer: `164d351`, `origin/develop` `06e5b39` e `origin/main` `af9d9b1` em `b8e6012`.
