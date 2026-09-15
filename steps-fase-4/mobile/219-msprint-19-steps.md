# Steps - M-Sprint 19 - Central de notificacao no mobile

**Spec**: [`219`](../../specs/fase-4/219-msprint-19-central-notificacao-mobile.md).
**Status**: planejada; steps criados em 2026-09-14. Nenhuma Task implementada ou baseline executada nesta preparacao.
**Destino**: `sep-mobile`; backend/web somente leitura; documentacao em `docs-SEP`, com Git manual.
**Branch sugerida**: `feature/msprint-19-central-notificacao`, de `develop` atualizado e verificado.
**Dependencia**: Sprint 38 integrada (registro de 2026-09-14), a reconferir por conteudo no Gate.
M-18 ja registrada como integrada; helper presente no checkout. Independente da F-27.

## Objetivo e limites

Central in-app em `/app/notificacoes`: lista paginada, contador no shell e leitura por gesto,
compartilhando identidade e estado de leitura do servidor com o web. Usar Ionic/Angular e New
Design System SEP vigentes. A navegacao de referencia usa rota interna, nunca callback persistido.

Sem push, plugin de push, registro de token, permissao, badge no icone do sistema ou novo service
worker. Sem preferencias, filtros, agrupamento, leitura em lote, polling ou tempo real. Sem portar
`contract:check`, integrar MSW ao Vitest, alterar backend ou reabrir escopo financeiro do Gate M-16.0.
O e-mail de lockout nao aparece na central, conforme ADR 0021.

## Fontes e ancoras desta preparacao

- [`ADR 0021`](../../adr/0021-modulo-notificacao-transversal.md) e [`NOTIFICACOES.md`](../../repos/sep-api/NOTIFICACOES.md).
- [`ADR 0019`](../../adr/0019-baseline-capacitor-8-mobile.md): Capacitor 8; nao copiar Capacitor 6 de docs antigas.
- `src/app/layout/shell/shell.component.{ts,html}` usa `IonTabs` e `IonRouterOutlet`.
- `layout/tabs/tabs.component.ts` ja mantem ate cinco abas para CLIENTE com credora. Nao acrescentar
  uma sexta aba automaticamente; prever acesso compartilhado no shell preservando as abas atuais.
- `features/authenticated/authenticated.routes.ts`: central fora das guardas especificas de tomador
  e credora. Rota existente de contrato: `/app/formalizacao/contratos/:contratoId`, guardada por CLIENTE.
- `core/api/api-error.ts` ja expoe `mensagemDaApi` e `codigoDeErroDaApi`; `codigo?` ja pertence ao erro.
  A ausencia do helper na spec e historica: nao criar decimo cast nem nova copia.
- `package.json` tem `audit`, `cap:sync`, Vitest e Playwright, mas nao `typecheck:spec` nem `contract:check`.
- Foco Ionic segue `ionViewDidEnter`, inclusive reentrada de pagina em cache. Happy-dom nao prova
  hidratacao/foco nativo; usar Playwright conforme padrao da M-17.

Esta preparacao leu o codigo local e os registros; integracao remota, baseline e smoke nao foram
executados. A condicao de credora nao e uma persona nem impede o mesmo usuario de ser tomador.

## Contrato a consumir

| Operacao | Request | Sucesso | Erros documentados |
|---|---|---|---|
| Listar | `GET /api/v1/notificacoes?page=0&size=20` | `200 Page<NotificacaoResponse>` | `400`, `401` |
| Contar | `GET /api/v1/notificacoes/nao-lidas/contagem` | `200 { naoLidas: number }` | `401` |
| Marcar | `POST /api/v1/notificacoes/{id}/leitura`, sem DTO de escrita | `200 NotificacaoResponse` | `400`, `401`, `404` |

Owner vem do token; sem parametro de usuario, `Idempotency-Key` ou step-up. Lista somente `IN_APP`,
ordenada por `criadaEm DESC, id DESC`; `page >= 0`, `size` 1..100. Marcar novamente conserva a primeira
`lidaEm`. `NTF-400-001`: paginacao invalida; `NTF-404-001`: inexistente, alheia ou EMAIL. UUID invalido
no POST nao implica `NTF-400-001`; nao inventar codigo.

Item publico: `id`, `tipo`, `titulo`, `mensagem`, `criadaEm`, `lidaEm`, `referencia { tipo, id }`.
`lidaEm` e `referencia` sao presentes e nulos quando vazios no runtime; OpenAPI omite required por
limitacao de nulidade do springdoc. Tipar null e tolerar ausencia defensivamente. Nao acrescentar
`codigo`, owner, canal, origem, link externo ou estado de entrega ao DTO de notificacao.

## Gate M-19.0 - Cadeia, ambiente e baseline

### Step 219.0.1 - Conferir antes de implementar

1. Reler estado/spec/ADRs. Preservar working trees e identificar checkouts ativos.
2. No backend, conferir `origin/develop` apos fetch por conteudo: controller/DTOs da notificacao,
   V61, testes owner-scoped e contrato da 038. Identificar commit do runtime usado para consulta.
3. No mobile, conferir `main` versus `develop` por ancestralidade e conteudo, M-18, helpers de erro,
   dependencias/CI e pendencias de back-merge. Nao interpretar squash como perda sem olhar o diff.
4. Atualizar `develop` com `git pull --ff-only`, criar branch com working tree preservado. Limpar
   apenas descricoes anteriores ja usadas em PR do mobile, conforme `AGENT.md`, no inicio da execucao.
5. Conferir Node >=22, JDK 21, SDK Android e `local.properties`. Caminho registrado neste host:
   `/home/mauricio/Android/Sdk`; confirmar existencia antes de usar. Nao copiar caminho Windows.
6. Mapear superficies Pix reais: hoje nao existe rota raiz `/app/pix` no arquivo de rotas autenticadas;
   verificar os componentes Pix embutidos nas jornadas. O acesso global precisa funcionar nelas tambem.

### Step 219.0.2 - Medir os gates

Em `sep-mobile`, executar um comando por vez com exit code e contagens registrados:

```bash
npm ci --legacy-peer-deps
npm run format:check
npm run lint
npm run lint:scss
npm run test:coverage
npm run e2e -- --workers=2
npm run build
npm run audit
npm run cap:sync -- android
```

Em `sep-mobile/android`, apos conferir SDK e JDK:

```bash
ANDROID_HOME=/home/mauricio/Android/Sdk ./gradlew assembleDebug --console=plain
```

Instalacao segue a baseline registrada na M-18; nao atualizar majors nem usar `audit fix --force`.
Ultimo registro funcional: Vitest 575/72 e Playwright 45, **nao** 527/70 e 41 da spec antiga.
Recontar; nao herdar gates verdes de outra sprint. Falhas preexistentes exigem tratamento separado.
Registrar permissoes/plugin list/manifest de partida e ausencia de gate de contrato/typecheck de specs.

**Saida**: tabela com resultados, ambiente, fonte do contrato e pendencias de integracao. Sem backend
integrado/fonte confirmada, nao implementar contra contrato suposto.

## Ordem e protocolo

Gate M-19.0 -> 219.1 -> 219.2 -> 219.3 -> 219.4 -> 219.5 -> 219.6 -> fechamento.
Testes acompanham cada Task; a ultima consolida E2E, acessibilidade e campanha de mutacao.

Aplicar `coding-guidelines`, `clean-code`, `codenavi`, `code-review-skill` e lente de produto.
Manter transporte no servico e estado compartilhado no menor escopo que atenda o shell/central;
nao criar infraestrutura generica de notificacoes/push. Cada Task termina com checkpoint de status,
diff, arquivos, testes, riscos e commit sugerido. Staging/commit com aprovacao, push/PR manuais.
Git de `docs-SEP` manual; criar estes steps nao significa executar as Tasks.

## Task 219.1 - Tipos e servico de notificacao

### Steps

1. Reusar `PageResponse<T>` existente e acrescentar DTOs em `core/api/api.models.ts`, conferindo enums
   no backend. `lidaEm?: string | null` e referencia opcional/nula; identidade sempre do servidor.
2. Criar servico em `core/api/` com listar, contar e marcar. Reusar URL/interceptors existentes.
   Testar paths, verbos, query, corpo, pagina e item retornado; sem owner enviado na request.
3. Reusar `mensagemDaApi`, `codigoDeErroDaApi` quando houver ramo, e `support-reference.ts` quando
   couber. Nao adicionar casts inline ou copiar helper web.
4. Registrar conferencia manual dos tres endpoints/DTOs contra runtime da 038 com commit/data,
   incluindo nulidade e erros. Sem snapshot/gate novo no mobile. Fixture tipado nao prova runtime
   nem typecheck dos specs; testes devem exercitar consumidores reais.

**Verificar**: specs do servico/helper, lint, format e build.
**Pronto**: tres operacoes corretas, erro seguro, contrato rastreavel sem campos inventados.
**Commit**: `feat(notificacoes): consumir contrato da central no mobile`.

## Task 219.2 - Contador e acesso global

### Steps

1. Integrar controle compartilhado de acesso a central no shell, sem sexta aba, overlay sobre
   conteudo ou copia por jornada. Verificar safe areas e que o novo controle participa do layout.
2. Contador tem rotulo textual e fonte unica para shell/central. Atualiza ao carregar shell,
   entrar/reentrar na central e confirmar leitura; sem timers, background refresh ou polling.
   Evitar consulta duplicada entre inicializacao e entrada da pagina.
3. Exibir carregamento/indisponibilidade separadamente de zero, mantendo central acessivel.
   Copy informa atualizacao ao abrir e apos leitura, sem promessa de tempo real ou entrega garantida.
4. Limpar estado na saida/troca de conta e ignorar respostas antigas, inclusive paginas mantidas
   pelo `ion-router-outlet`. `providedIn: root` exige limpeza explicita; cache Ionic exige teste de reentrada.
5. Testar contagem, zero, erro, ausencia de polling e resposta de A apos login de B. Conferir acesso
   nas jornadas tomador, credora e componentes Pix existentes, sem ampliar roles.

**Verificar**: specs de estado/shell, lint/SCSS e build; conferir layout no browser na Task 219.6.
**Pronto**: contador global sem sacrificar abas, conteudo ou isolamento de sessao.
**Commit**: `feat(notificacoes): mostrar contador no shell mobile`.

## Task 219.3 - Central, paginacao e referencia por rota

### Steps

1. Criar `features/authenticated/notificacoes/` e rota `/app/notificacoes` filha do shell.
   Nenhuma guarda exclusiva de tomador/credora na central; autenticacao continua obrigatoria.
2. Quatro superficies: carregando, itens, vazio de `200 content: []` e erro tecnico com retry.
   Usar `totalElements` e preservar ordenacao. Pagina vazia alem do fim com total > 0 nao e ausencia
   global de avisos; oferecer retorno para pagina valida sem loop automatico.
3. Troca de pagina/retry substitui consulta em voo. Resposta tardia da pagina anterior nao sobrescreve
   a atual. Texto do servidor renderizado como texto; nulos/ausencia opcionais nao quebram template.
4. Mostrar "Lida"/"Nao lida" sem depender so de cor. `h1` e foco em `ionViewDidEnter`, inclusive
   retorno pelo back; reutilizar landmark do `ion-content` sem `<main>` aninhado.
5. Referencia `CONTRATO` com id valido pode oferecer link interno para
   `/app/formalizacao/contratos/:contratoId`, quando a rota e permitida ao usuario. Guardas e
   ownership do destino continuam valendo; nao converter id do contrato em id de proposta.
   Referencia nula, ausente, tipo desconhecido ou destino nao permitido: manter aviso legivel sem
   CTA quebrado. Nao navegar URL recebida do backend, nao criar callback por item, nao pedir push.
6. Testar erro com corpo nulo, string/HTML, campo numerico e mensagem em branco usando helper real.
   Conta credora sem desembolso ve vazio; usuario credor que tambem e tomador pode ter avisos.

**Verificar**: specs de central/rota, lint/SCSS, format e build; foco real fica no Playwright.
**Pronto**: quatro superficies, paginacao e referencia segura, sem extrapolar central para nova jornada.
**Commit**: `feat(notificacoes): criar central paginada e referencia interna`.

## Task 219.4 - Leitura confirmada e contador consistente

### Steps

1. Marcar somente por gesto explicito; nao ao renderizar, paginar ou navegar pela referencia.
   Guarda por id impede duplo toque e chamada direta enquanto POST esta em voo.
2. No `200`, usar id e `lidaEm` retornados. Aplicar leitura e baixar contador conhecido uma unica vez
   por transicao local nao-lida -> lida, nunca negativo. Reconsultar contagem para reconciliar outras
   leituras/canais. Se desconhecida, nao fabricar contagem; reconsulta determina valor.
3. Cancelar/ignorar consultas anteriores a mutacao e respostas de outra sessao. Nem lista atrasada
   nem contagem antiga podem desfazer leitura confirmada. Falha da recontagem sinaliza desatualizacao,
   mas nao reverte o sucesso do POST. Nova marcacao do mesmo id nao duplica baixa.
4. Em erro de POST, manter estado sem confirmar leitura, liberar retry e mostrar erro inline.
   Timeout pode ocorrer apos commit: retry do mesmo id e idempotente. `404` neutro nao revela dono;
   oferecer reconsulta por gesto. `401` segue interceptor, sem tratamento global novo.
5. Regiao `aria-live` anuncia desfecho; preservar foco se acao some/desabilita. Testar duplo toque,
   leitura repetida, POST falho, contagem falha, resposta tardia e retorno a pagina em cache.

**Verificar**: specs de estado/central, lint e build.
**Pronto**: estado de leitura do servidor, reflexo imediato e reconciliacao sem dupla baixa.
**Commit**: `feat(notificacoes): marcar leitura e atualizar contador mobile`.

## Task 219.5 - MSW com owner-scope e vazio comum

### Steps

1. Adicionar handlers dos tres endpoints em `src/mocks/handlers.ts`, reutilizando autenticacao do
   mock. Filtro por dono autenticado e canal IN_APP antes de pagina/total/contagem. Nao confiar em
   parametro de dono nem devolver metadados internos da fixture no DTO publico.
2. Semear A com varias paginas/lidos/nao-lidos, B com itens proprios e conta credora sem desembolso
   vazia. Incluir EMAIL interno para provar exclusao, sem gerar notificacoes por role.
3. Reproduzir POST idempotente com primeira `lidaEm`, `404` indistinguivel para alheia/inexistente/EMAIL,
   `400` de paginacao e `401` sem token. `200` vazio e contagem zero sao sucesso.
4. Reset por teste, preservando leitura entre requests do mesmo cenario. Testar pelo Playwright
   carregando handlers reais: A lista/conta/marca, B nao ve/marca item de A, logout/relogin limpo.
   Sobrescrever respostas com `page.route` em todos os cenarios nao prova os handlers.
5. Manter MSW fora do Vitest, como definido na spec. Specs unitarios provam consumidor; a
   fidelidade do mock e provada no Playwright e na conferencia manual com backend.

**Verificar**: Playwright dirigido, lint e format.
**Pronto**: owner-scope, vazio, paginacao e idempotencia testados contra MSW real.
**Commit**: `test(notificacoes): reproduzir central owner-scoped no MSW mobile`.

## Task 219.6 - Acessibilidade, mutacao e Android

Campanha com backup e diff conferido antes de rodar; restaurar byte a byte ao fim. Cada mutante
precisa ser aplicado de fato e morto por comportamento, nao sintaxe. Analisar sobreviventes.

| Mutacao | Prova exigida |
|---|---|
| Remover baixa do contador | Teste observa ausencia da baixa antes da recontagem responder |
| Mostrar erro em `200 content: []` | Teste do vazio comum falha |
| Remover guarda de shape do helper existente | Teste com corpo/campo inesperado falha; restaurar helper apos sonda |
| Desproteger referencia nula/ausente ou mapear contrato como proposta | Teste de renderizacao/navegacao falha |
| Remover guarda de duplo toque ou protecao contra resposta antiga | Teste de concorrencia de UI falha |
| Remover filtro owner/IN_APP no MSW | Playwright contra handlers reais falha |

Playwright deve cobrir entrada pelo shell/URL, reentrada Ionic, paginas, vazio, erro/retry, leitura,
contador, referencia, troca de conta e foco/landmark/anuncio. Nao usar happy-dom como prova de
hidratacao Ionic. Polyfill de `ion-input` da M-18 nao se promove globalmente para servir esta tela.

Reexecutar bateria do Gate M-19.0, com contagens >= baseline e zero falhas, cobertura e audit verdes,
build PWA, sync e APK debug. Conferir permissao em `android/app/src/main/AndroidManifest.xml` e no
manifest mesclado do build; comparar com baseline. Busca dirigida em `package.json`, `src/` e
`android/` por `push-notifications`, `PushNotifications`, `POST_NOTIFICATIONS`, `FirebaseMessaging`
e chamadas de permissao: examinar resultados, nao exigir ausencia de toda palavra "notificacao".
Nenhum plugin, token ou pedido de permissao de push introduzido.

Conferencia manual no APK dev-offline: acesso global, safe areas, rolagem ate ultimo item,
paginacao, leitura, back fisico e reentrada. Registrar dispositivo/emulador e artefato; APK compilado
nao significa smoke aprovado. iOS permanece gate externo e nao e pre-requisito desta entrega Android/PWA.

**Smoke real da central**: tentar em ambiente controlado contra runtime identificado da 038. Listar,
contar, marcar, reabrir e conferir outro dono; se ambos os fronts estiverem disponiveis, leitura em
um aparece no outro **apos nova consulta**, sem promessa de sincronizacao em tempo real. A F-27 nao
bloqueia a M-19: conferir estado pela API quando necessario. Registrar limites se nao executado;
smokes anteriores de MFA/Pix nao provam a central mobile.

**Commit**: `test(notificacoes): verificar central mobile e ausencia de push`.

## Fechamento e rastreabilidade

- [ ] 219.1: tipos, servico e conferencia do contrato; helper existente reutilizado.
- [ ] 219.2: contador/acesso global, sessao isolada e abas preservadas.
- [ ] 219.3: quatro superficies, pagina, foco e referencia interna segura.
- [ ] 219.4: leitura no servidor, reflexo imediato, retry e reconciliacao sem dupla baixa.
- [ ] 219.5: MSW owner-scoped e vazio provados no Playwright.
- [ ] 219.6: gates, campanha restaurada, acessibilidade, APK e permissoes conferidos.
- [ ] Revalidar apos commits que reescrevam arquivos via lint-staged e instalacao limpa.
- [ ] Atualizar spec com resultados/desvios, `repos/sep-mobile/README.md`, `STATE.md`, historico,
      indice de specs e `AI-ROADMAP.md`; Git documental manual.
- [ ] Criar `repos/sep-mobile/SPRINT-M-19-PR.md`: commits, resultados, central IN_APP com um gatilho,
      ausencia deliberada de push/contract:check/MSW no Vitest e smokes executados ou pendentes.
- [ ] Checkpoint final antes de staging/commit; push/PR manuais, sem declarar merge antecipadamente.
