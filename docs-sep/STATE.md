# STATE.md - Estado atual do SEP

> **Fonte unica do estado do projeto.** Leia este arquivo para saber onde estamos, o proximo passo,
> os gates pendentes e o bloco "Leia agora". Fundacao (porque/como) esta em
> [`CONTEXT-PARTE-1.md`](./CONTEXT-PARTE-1.md); historico completo de execucao (log por sprint) esta
> em [`CONTEXT-PARTE-2.md`](./CONTEXT-PARTE-2.md) — grande, leia so sob demanda.
>
> **Convencao de manutencao**: ao fechar uma sprint, **sobrescreva** este arquivo (estado + proximo
> passo + leia agora) e **apende** uma entrada curta no historico
> ([`CONTEXT-PARTE-2.md`](./CONTEXT-PARTE-2.md)). Mantenha este arquivo pequeno; ele nao duplica
> historico nem PRD, so aponta.

_Atualizado em: 2026-09-08 (fechamento da **Sprint 36**, mergeada em develop+main)._

## Leia agora

- **Fase corrente**: [`PRD-FASE-4.md`](./PRD-FASE-4.md). A Fase 5 segue **inteiramente gated** por
  acesso externo (Celcoin, AWS, contas de loja).
- **Mudou em 2026-09-08**: a **Sprint 36 fechou e esta mergeada** em `develop` (PR **#107**, squash
  `452a09f`, back-merge `a774aa4`) e `main` (PR **#108**, `042949b`). Conferido **por conteudo**:
  `develop` == `main` com diff vazio, e a arvore dos dois **byte-identica** a da branch que passou
  nos gates — os tres apontam para o mesmo tree `89441ab`. A conferencia foi feita **depois** do
  back-merge, que e onde a Sprint 34 quebrou. 9 commits, 12 arquivos, +1176/−10 no squash. Suite
  **2262 -> 2297**, 0 falhas, 368 classes; `contract:check` do `sep-app` em 85 operacoes / 0 lacunas,
  **sem tocar em nenhum arquivo do web**. Descricao em
  [`SPRINT-36-PR.md`](../repos/sep-api/SPRINT-36-PR.md); catalogo e perimetro em
  [`CODIGOS-DE-ERRO.md`](../repos/sep-api/CODIGOS-DE-ERRO.md).
- **Spec/step ativo**: a fila da Fase 4 continua. Ordem recomendada:
  1. ~~**Sprint 35** — divida de config/lockout/contrato.~~ **MERGEADA develop+main em 2026-09-02.**
  2. ~~**Sprint 36** — codigos de erro no fio.~~ **MERGEADA develop+main em 2026-09-08.**
  3. **Consumo dos codigos**, **desbloqueado agora**: [`126`](../specs/fase-4/126-fsprint-26-consumo-codigos-erro-web.md)
     (F-26, web) e [`218`](../specs/fase-4/218-msprint-18-consumo-codigos-erro-mobile.md) (M-18,
     mobile). A pre-condicao ("36 integrada em `develop`") **esta satisfeita**. Os tres
     `MFA-400-002/003/004` que a 126 consome estao publicados — conferido no Gate 36.0 e mantido apos
     o corte de sete codigos no code review.
  4. **[`037`](../specs/fase-4/037-sprint-37-normalizacao-taxonomia-erro.md)** normaliza o que a 036
     deixou fora do perimetro (**preve ADR**). A lista dos **53 excluidos**, codigo a codigo com
     classe dona e motivo, esta em [`CODIGOS-DE-ERRO.md`](../repos/sep-api/CODIGOS-DE-ERRO.md) — e o
     insumo que dimensiona a 037, e ela sai de estimativa para escopo medido.
  5. **Frente A de notificacao** — [`038`](../specs/fase-4/038-sprint-38-modulo-notificacao-historico.md)
     (**preve ADR**, migration `V61`), [`127`](../specs/fase-4/127-fsprint-27-central-notificacao-web.md)
     e [`219`](../specs/fase-4/219-msprint-19-central-notificacao-mobile.md). **Corre em paralelo** —
     a 038 nao toca `ApiExceptionHandler`.
  Steps das cinco restantes **nao existem** — just-in-time, ao aprovar cada uma.
- **O code review de fechamento achou 7 codigos ambiguos ja publicados**, e a licao vale mais que o
  conserto: a particao media unicidade por **classe dona**, um **proxy** para a propriedade que
  interessa (identidade de condicao). `ONB-400-004` — constante `CODIGO_TAMANHO_EXCEDIDO` — era
  lancado tambem para "conteudo do documento e obrigatorio", duas condicoes no mesmo arquivo, e o
  proxy nao via. Catalogo **87 -> 80**. **Mutacao valida implementacao, nao valida definicao**: as 24
  mutacoes passaram porque testavam o mecanismo da guarda, e nao se o criterio media a coisa certa.
- **Aprendizado da Sprint 36, o que mais se paga**: **mutacao que nao aplica produz verde falso.** A
  primeira tentativa de mutar o `build()` nao casou o padrao, porque o `spotlessApply` havia
  reflowado a chamada para uma linha; a suite ficou verde e o resultado quase foi lido como mutante
  sobrevivente. Desde entao toda mutacao imprime `git diff --numstat` ou tem `assert` no patch antes
  de rodar. Irmao do aprendizado da 35 ("mutacao que sobrevive e o achado"): aqui o risco e o
  inverso, a mutacao que **nao existiu** passando por prova.
- **Segundo aprendizado**: **mutante pode sobreviver por tautologia.** O teste "catalogo publicado ==
  fonte unica" nao mata "retirar um codigo do catalogo", porque documento e expectativa derivam da
  mesma lista. So um spot-check independente pegou. A fraqueza fechou quando o catalogo virou gate de
  **runtime**, e nao so de documento — mas foi preciso registrar a limitacao antes de conseguir
  fecha-la.
- **Regra vigente**: **faixa de numeracao por fase** — Fases 1-4 em **0-49**, Fase 5 em **50-99**,
  dentro da banda por repo. Documentada em [`../AGENT.md`](../AGENT.md) §Numeracao de sprint e de spec.
- **Aprendizado da Sprint 35, o que mais se paga**: **mutacao que sobrevive e o achado, nao o
  ruido.** Foram 46 aplicadas e **cinco sobreviveram** — e as cinco viraram trabalho que nao estava
  no plano. Duas merecem nome proprio: consolidar os call sites de MDC no Java deixava o defeito vivo
  porque o literal restante estava **fora do Java** (`logback-spring.xml`); e um bean de
  `ModelResolver` sem `openapi31` apagava **21 `description` e 17 `example`** do OpenAPI passando
  verde em 2258 testes. Nos dois casos a leitura do codigo aprovava; so a mutacao reprovou.
- **Aprendizado sobre diagnostico**: no conserto do segundo caso, a edicao apagou o bean
  `sepOpenAPI()` e derrubou o `securitySchemes`. O teste `apiDocsExpoeSchemasESecurity` **acusou
  exatamente isso**, e a causa foi atribuida a outra coisa — tres documentos gerados para "isolar"
  antes de simplesmente contar os `@Bean` do arquivo. **Teste vermelho e evidencia, nao ponto de
  partida para uma teoria.**
- **Aprendizado que a 35.2 deixou**: **prescricao escrita antes da medicao nao vale mais que a
  medicao.** Os steps escopavam a Task em `application.yml`; aplicar so a config e rodar o teste
  exigido mostrou que o bypass continuava aberto. A mudanca de codigo entrou porque o teste reprovou,
  nao porque pareceu melhor.

## Onde estamos

- **Sprint 36 (backend) MERGEADA develop+main em 2026-09-08** — publicacao da taxonomia de codigos
  de erro no fio (Fase 4, produto novo na superficie de contrato; **sem endpoint, migration, evento,
  provider, regra de negocio ou ADR**). Em `origin/develop` via PR **#107** (squash `452a09f`),
  back-merge `a774aa4`, e promovida a `main` via PR **#108** (`042949b`). **Conferido por conteudo**:
  `develop` == `main` com diff vazio, e a arvore dos dois **byte-identica** a da branch que passou nos
  gates — os tres apontam para o mesmo tree `89441ab`, e a conferencia foi feita **depois** do
  back-merge. **2262 -> 2297 testes / 0 falhas / 368 classes**, `clean build` e `spotlessCheck`
  verdes. 9 commits, 12 arquivos, +1176/−10. Nada mudou em `sep-app`/`sep-mobile`.
  O corpo de erro ganha campo **`codigo` opcional**; **80 dos 133** codigos medidos passam a ser
  contrato, publicados uma vez em `components/schemas/ErrorResponseDto` por `OpenApiCustomizer`. Ate
  aqui a taxonomia era construida no dominio e **descartada na fronteira HTTP** — `getCodigo()` tinha
  zero consumidores em `src/main`.
  **O Gate 36.0 derrubou sete numeros ou premissas da spec**, e o padrao das cinco sprints de divida
  anteriores se manteve: a taxonomia nao e ~103 e sim **133**; as colisoes nao sao 12 e sim **16**; as
  violacoes de formato nao sao 12 e sim **31**; os codigos `private` nao sao 12 e sim **26**; os
  handlers sem codigo nao sao 10 de 16 e sim **13 de 17**; os dois orfaos `BOF-*` **nao** eram
  inalcancaveis; e a §Ancora 4 caiu — **`build()` nao e o ponto unico de montagem**. Sao **cinco**
  construcoes de `ErrorResponseDto`, e as outras quatro sao filtros e entry points do Spring Security
  que escrevem direto na response. **`401`, `403` e `429` da cadeia de seguranca seguem sem codigo**,
  por decisao declarada.
  **A sprint achou um defeito nela mesma.** A matriz consolidada da Task 36.6 revelou que a Task 36.2
  vazava codigos **fora do perimetro** para o fio: `OwnershipPropostaException` carrega
  `CRD-403-001`, excluido por colisao, e o `ex.getCodigo()` o emitia — corpo com valor fora do `enum`
  publicado, ou seja, resposta violando o proprio schema. Corrigido por `somenteSePublicado` no
  `build`, o que fez o catalogo governar **documento e fio**. Efeito colateral util: os fixtures da
  matriz da 36.2 usavam tres codigos excluidos, e o filtro expos isso.
  **26 mutacoes aplicadas, 26 mortas, 0 sobreviventes**, cada uma com prova de que entrou no arquivo.
  Documento OpenAPI antes -> depois: `description` **795 -> 796**, `example` **137 -> 138**, schemas
  **152 -> 152**, `securitySchemes` intacto, 3.1 preservado — o crescimento e exatamente a
  propriedade nova, e **nada foi apagado** (o resolver **nao** foi tocado, ao contrario da 35.7).
  **Perimetro**: `80 publicados + 53 excluidos = 133`, intersecao 0, recalculado a cada
  `./gradlew build` por `ParticaoDeCodigosErroTest` — nao lido de documento. Os 53 sao **30 de
  formato** (28 do `pix`, onde o sufixo semantico e majoritario 28/31, mais
  `AUTH-403-PASSWORD_RESET_REQUIRED` e `OF-400-001`) e **23 de colisao**, sendo **16 entre classes**
  (9 de faixa compartilhada `credito` x `credores`, 2 de duplicacao com significado identico, 5 de
  colisao intra-modulo) e **7 dentro da mesma classe** — os sete que o code review de fechamento
  achou no catalogo publicado e obrigou a retirar.
  **Tres desvios dos steps, declarados**: o doc operacional foi para
  [`CODIGOS-DE-ERRO.md`](../repos/sep-api/CODIGOS-DE-ERRO.md) e nao `CONTRATOS.md` (que e o doc do
  modulo `contratos`); a verificacao de particao virou **teste** e nao script avulso; e o commit da
  36.6 e `fix` e nao `test`, porque a Task deixou de ser so teste.
  **Divida que a sprint EXPOE e nao corrige**: `AUTH-403-PASSWORD_RESET_REQUIRED` ja chega ao cliente
  hoje concatenado **dentro da `message`** em `PasswordResetEnforcementFilter:109` — contorno
  anterior a esta sprint, e a prova de que a demanda existia antes do campo. Descricao em
  [`SPRINT-36-PR.md`](../repos/sep-api/SPRINT-36-PR.md).

- **Sprint 35 (backend) MERGEADA develop+main em 2026-09-02** — divida de configuracao, lockout e
  contrato (sprint de divida; **sem tela, endpoint, DTO, migration, ADR ou regra nova**). Em
  `origin/develop` via PR **#105** (squash `23004b9`), back-merge `17bd72d`, e promovida a `main` via
  PR **#106** (`8cabf2c`). **`develop` == `main` conferido por diff de conteudo** (vazio), e a arvore
  de `origin/develop` conferida **byte-identica** a da branch que passou nos gates — a conferencia foi
  feita **depois** do back-merge, que e onde a Sprint 34 quebrou. **2262 testes / 0 falhas / 363
  classes** (partida 2220/355), `spotlessCheck` verde, `contract:check` do `sep-app` em 85 operacoes /
  0 lacunas. 16 commits.
  **A unica queda de contagem da sprint foi de −1**, na Task 35.5, e era esperada: a query
  `countByIpAndJanela` saiu com o teste que so a exercitava.
  **Os steps erraram o escopo em duas Tasks, e as duas vezes o teste mostrou antes do codigo.** Na
  35.2 a spec escopava em `application.yml`; aplicar so a config e rodar o teste exigido deixou o
  valor forjado `203.0.113.7` chegando em `login_attempt.ip`, porque o `RemoteIpValve` **ignora** o
  header do peer nao confiavel mas **nao o remove** e o `extrairIp` lia o header direto — o javadoc
  daquele metodo afirmava que fechar o bypass era "configuracao, nao codigo"; era das duas. Na 35.6 os
  steps previam 4 literais de MDC e o fenomeno era de **10**, com o comando de aceite da propria spec
  (`grep 'MDC.get("'` sair vazio) impossivel de satisfazer sem os outros seis.
  **`enumsAsRef` derrubou uma previsao minha e depois cobrou caro**: eu recomendei nao fechar os enums
  por raio de alcance, e medido o `contract:check` passa **identico** contra os dois documentos — ele
  dereferencia `$ref` antes de comparar. Mas o bean de `ModelResolver` entrou **sem `openapi31`**, e um
  resolver em modo 3.0 dentro de um documento 3.1 apagou **21 `description` e 17 `example`** em
  silencio, oito deles em propriedades que documentavam **nulidade**. Achado bloqueante do code review.
  A correcao e **nao substituir o resolver**: `enumsAsRef` e lido durante a resolucao, entao um
  `@PostConstruct` basta.
  **Segundo bloqueante**: a nota que justificava alinhar a `message` do `423` dizia que nenhum
  consumidor a exibe. Falso — o `verify-totp` do `sep-app` mostra o corpo **verbatim** e nem le o
  `Retry-After`. Alinhar **melhorou uma tela em producao**, e o registro dizia o contrario.
  **46 mutacoes**, das quais **cinco sobreviveram** e viraram trabalho. Detalhe em
  [`SPRINT-35-PR.md`](../repos/sep-api/SPRINT-35-PR.md); historico em
  [`CONTEXT-PARTE-2.md`](./CONTEXT-PARTE-2.md) §Sprint 35. Nada mudou em `sep-app`/`sep-mobile`.

- **Varredura de sincronizacao com os tres remotos em 2026-09-02** — **nenhuma sprint fechada,
  nenhum codigo de app tocado**; so `git fetch` (read-only) e medicao local. Objetivo: por o
  `STATE.md` de acordo com o que esta **na nuvem**, e nao com o que a ultima sessao registrou.
  **Limitacao declarada**: o `gh` **nao esta autenticado** (`HTTP 401`), entao PRs abertos e status
  real de CI **nao foram observados** — tudo abaixo vem de `git fetch` + gate rodado localmente.

  **`sep-api` — limpo na nuvem, podre no checkout local.** `origin/develop` (`fd4b4b1`) e
  `origin/main` (`550fed3`) sao **identicos por conteudo** (diff vazio), ambos de 2026-08-03; nenhum
  commit novo, nenhuma branch do Dependabot. O remoto bate com o registro. **O checkout local nao**:
  esta em `main` no commit `1f111e2` (**2026-07-08**, PR #92), **seis PRs / 216 arquivos / 14.579
  linhas atras** de `origin/main`, e com **34 arquivos aparecendo como untracked** — todos
  **byte-identicos** aos de `origin/main`, sobra de checkout, nenhum conteudo proprio a perder.
  **Consequencia direta para o Gate 35.0**: qualquer medicao do backend feita hoje neste checkout
  mede uma arvore de quase dois meses atras. **Sincronizar o local antes de abrir a Sprint 35.**

  **`sep-app` — `develop` divergente e com gate vermelho.** A **F-25 esta mergeada** (PR #136
  `b7cd3da` em `develop`, PR #137 `3cd6cb9` em `main`, ambos 2026-08-21). O PR **#132** (`39fe576`,
  2026-08-10) entrou em `main` com **diff de conteudo vazio** — nao-op. Mas `origin/develop` tem
  **tres commits que `main` nao tem**, de 2026-08-26, autor `Daniel Mollmann`, **push direto sem PR**:
  `bf33e45`, `63248af` e `64b7b73`. **As mensagens nao descrevem o diff** — `test(logs): add
  automated verification and integration suite` mexe **so** em `.gitignore` e no campo `version`;
  `feat(shared): add new core features and logic` mexe **so** no `version`. O conteudo real dos tres
  e: `.gitignore` **+37 linhas** de um bloco "Dynamis Control Center" com padroes **de projeto Python**
  (`__pycache__`, `.venv`, `*.egg-info`, `*.spec` de PyInstaller) num repo Angular; `version`
  `0.0.0 -> 0.1.2` em tres saltos; e **reformatacao de 6 union types** em
  `src/app/core/api/api.models.ts`.
  **Medido, nao suposto**: o `contract:check` fica **verde nas duas versoes** (85 operacoes, 0
  lacunas) — a mudanca do `api.models.ts` e semanticamente inerte. O **`format:check` nao**: verde no
  conteudo de `main`, **vermelho no de `develop`**, com `api.models.ts` como unico arquivo apontado.
  Como o `ci.yml:52` roda `npm run format:check`, **o CI-APP esta reprovando em `develop` desde
  2026-08-26**. O `.gitignore` novo tambem passaria a ignorar tres arquivos **hoje versionados**
  (`.vscode/extensions.json`, `launch.json`, `tasks.json`), por causa do `**/.vscode/`.
  O `npm audit` do `sep-app` segue **0 vulnerabilidades** e o gate verde — a correcao do Gate F-25.0
  se manteve. Ha **4 branches do Dependabot** abertas (tres de 2026-08-25).

  **`sep-mobile` — `develop` atras do `main`, e o audit subiu.** `origin/develop` (`280857e`) esta
  **quatro commits atras** de `origin/main` (`deb5b72`), os dois de 2026-08-05: o `main` recebeu dois
  PRs do Dependabot direto (**#147** angular group, **#141** `gradle/actions`) que **nunca voltaram**.
  A divergencia e material, nao cosmetica: `main` tem `@angular/{forms,platform-browser,router,
  compiler-cli,language-service}` em **`^20.3.27`** e `develop` ainda em **`^20.3.26`** — a mesma
  correcao que a D-Sprint 1 aplicou. **Uma branch cortada de `develop` hoje nasce sem o patch**, e o
  back-merge `main -> develop` esta pendente pela **segunda vez** (a D-1 ja teve de resolver um em
  2026-08-05).
  **`npm audit` medido em `develop`**: **10 vulnerabilidades — 1 low, 3 moderate, 6 high, 0
  critical** — e o gate `--audit-level=high` **sai diferente de zero, ou seja, vermelho**. Os seis
  `high` sao `@angular-devkit/build-angular`, `browserslist`, `image-size`, `js-yaml`, `less` e
  `nanoid`. Isso **derruba dois registros**: o residual da D-1 anotado como "8 moderate, **0 high**",
  e a estimativa de 2026-09-01 de "8 vulnerabilidades (3 moderate, 5 high)". Ha **10 branches do
  Dependabot** abertas, a mais nova de **2026-09-02**, e algumas (js-yaml 4.3.1, angular group) atacam
  exatamente esses `high`.

  **O padrao, que ja e o terceiro**: em 2026-08-06 a F-24 estava mergeada e o documento dizia que nao;
  em 2026-08-21 a D-1 estava na mesma situacao; agora a F-25. **Nas tres vezes o documento errou na
  mesma direcao** — declarando pendente o que ja estava feito — enquanto errava na direcao oposta
  sobre o que estava quebrado (gate vermelho dado como verde). O registro de 2026-09-01 de que "os
  tres repos de codigo estao intactos" tambem cai: o `sep-app` ja tinha os tres commits ha cinco dias.

- **Sessao de planejamento e diagnostico em 2026-09-01** — **nenhuma sprint fechada, nenhum codigo de
  app tocado**. Saiu do `docs-SEP` e do ambiente local; os tres repos de codigo estao intactos.
  **Entregas**: (a) [`DIAGNOSTICO-PRODUTO.md`](./DIAGNOSTICO-PRODUTO.md), leitura do SEP sob
  *The Product-Minded Engineer* (Hoskins), com **seis lacunas de produto medidas no codigo**;
  (b) **sete specs novas** — a cadeia P1 revisada (036/126/218), a normalizacao (037) e a frente A de
  notificacao (038/127/219); (c) **faixa de numeracao por fase**, encerrando o mecanismo de recuo;
  (d) ambiente Android montado do zero na maquina de dev (`C:\Android\Sdk`, cmdline-tools 19.0,
  `platforms;android-36`, `build-tools;36.0.0`), com **APK debug gerado e conferido** — 8,44 MB,
  `BUILD SUCCESSFUL`, 243 tasks.
  **Correcao de registro**: o `STATE.md` e a M-Sprint 17 afirmavam que a maquina de dev **tem**
  Android SDK. Nao tinha — `C:\Android` nao existia. Agora tem.
  **O que o diagnostico achou, resumido**: o `sep-api` constroi uma taxonomia de erro e a **descarta
  na fronteira HTTP** (`getCodigo()` com zero consumidores em `src/main`); **personas nao existem**,
  so papeis RBAC — e o Gate M-16.0 ja cortou escopo por causa disso; **nao ha metrica de produto**,
  so de entrega (DORA) e de sistema (Prometheus); os testes E2E espelham **modulos**, nao jornadas; e
  o `sep-api` tem **71 eventos de dominio para tres pontos de envio de notificacao**, os tres falando
  com o tomador em momento ruim.
  **Duas correcoes que a revisao das specs imps ao proprio diagnostico**: a taxonomia nao e 67
  codigos e sim **~103** (o `grep` filtrava por nome de constante, nao por formato), e ha **12
  codigos definidos duas vezes com significados diferentes** — o que derrubou a premissa "so publica
  o que existe" e fez a Spec 036 adotar **perimetro**.
  **Divida que a sessao EXPOE e nao corrige**: `npm audit` do `sep-mobile` mediu **8 vulnerabilidades
  (3 moderate, 5 high)**; o `STATE.md` registra o residual da D-1 como **8 moderate, 0 high**. Subiu,
  e o gate `--audit-level=high` do CI provavelmente esta **vermelho em `develop`** — mesmo cenario
  que o Gate F-25.0 encontrou no `sep-app`. **Medir antes da Sprint 35.**
  **MEDIDO em 2026-09-02, em `develop`**: sao **10 — 1 low, 3 moderate, 6 high, 0 critical** —, e o
  gate **esta vermelho** (exit != 0), confirmado. **Os dois numeros anteriores estavam errados**, o
  desta sessao inclusive. Ver o bloco da varredura no topo desta secao.

- **F-Sprint 25 (web) MERGEADA develop+main em 2026-08-21** — aviso de cookies e politica de
  privacidade. Em `origin/develop` via PR **#136** (squash `b7cd3da`, 7 commits absorvidos) e
  promovida a `main` via PR **#137** (`3cd6cb9`), a partir de `develop` `b821496` (com a F-24 dentro).
  O merge foi conferido **por conteudo** na varredura de 2026-09-02 (19 arquivos, +1.004 linhas, de
  `39fe576` para `3cd6cb9`). **Este registro dizia "push e PR ainda NAO foram feitos" e estava
  defasado por 12 dias.** `develop` **nao** e igual a `main` hoje, mas por outro motivo — os tres
  commits de 2026-08-26; ver o bloco da varredura acima. **Produto novo**: primeira frente de produto no web desde
  que a Fase 4 esgotou o escopo sobre fake. Nada mudou em `sep-api`/`sep-mobile`, e **nenhum contrato
  foi consumido** — `contract:check` fecha identico a abertura (85 operacoes / 0 lacunas), o que aqui
  e criterio, nao observacao.
  **Transparencia, nao consentimento**: medido, o produto emite **um** cookie (`sep-refresh`, de
  autenticacao) e nao ha script de terceiro no `index.html` nem biblioteca de rastreamento no bundle.
  Cookie necessario nao e recusavel, entao opt-in gatearia zero cookies — dai nao haver "recusar" nem
  categorias, e o botao dizer "Entendi". O aceite **nunca vai ao servidor**: persisti-lo criaria
  tratamento de dado pessoal que hoje nao existe.
  **O Gate F-25.0 derrubou a baseline do `audit`, nos dois sentidos** (spec dizia 0 high / 3 moderate;
  medido **1 high / 0 moderate**): `nanoid@3.3.17` precisa `>=3.3.18` (GHSA-2v37-7h3g-55p8),
  transitiva via `@angular/build -> postcss`. **O gate de `npm audit` que a D-1 instalou no CI estava
  vermelho em `develop` sem ninguem saber** — o cenario que a propria D-1 previu. Corrigido em commit
  isolado, antes de qualquer codigo de escopo.
  **A medicao dos e2e achou defeito de produto, nao artefato de teste**: `onboarding.spec.ts:42`
  reprovou com a `<section>` do aviso nomeada pelo Playwright como interceptadora dos ponteiros, em
  51 tentativas de clique. Sendo `position: fixed` no rodape, a faixa cobria o **ultimo elemento de
  qualquer pagina**, e como a rolagem e do `body` chegar ao fim nao resolvia. A faixa passou a
  reservar a propria altura no `body` (classe pelo signal, altura pelo `ResizeObserver`), e
  **nenhuma blindagem foi aplicada**: os 39 originais passam com a faixa viva.
  Vitest **802/94 -> 833/97**, Playwright **39/11 -> 42/12**, `lint`, `lint:scss`, `format:check`,
  `build` e `audit` verdes. **25 mutacoes distintas em 33 aplicacoes**; **tres testes reescritos por
  terem sobrevivido** e um mutante equivalente registrado como tal.
  **Gates declarados pendentes, nao simulados**: o texto **nao passou por revisao juridica** (marcador
  visivel na pagina; base legal, direitos do titular e encarregado ficam nomeados como pendentes), e a
  configuracao de producao do cookie **nao e observavel aqui** — a politica afirma `Secure`/`Strict`,
  que producao exige, mas os defaults deste ambiente sao `false`/`Lax`.
  **Divida que a sprint EXPOE e nao corrige**: `SEP_ACCESS_TOKEN` guarda JWT de acesso em
  `localStorage`, legivel por qualquer script na origem. Corrigir exige ADR e toca os tres repos.
  Descricao em [`SPRINT-F-25-PR.md`](../repos/sep-app/SPRINT-F-25-PR.md).

- **F-Sprint 24 (web) MERGEADA develop+main** — divida tecnica do web. Concluida na branch em
  2026-08-06; o merge foi conferido **por conteudo** no Gate F-25.0, em 2026-08-21
  (`src/testing/estabilizar.ts` presente, `knownGaps: 0` e `tempoMedioResolucao30d: string` nas duas
  pontas), e `develop == main` por diff vazio. **Este registro dizia "push e PR ainda NAO foram
  feitos" e estava defasado por 15 dias** — mais um caso de documento desmentido pelo codigo.
  13 commits em `feature/fsprint-24-divida-tecnica`, a partir de `develop` `d987714` (com a D-1 dentro; `develop == main` por diff de conteudo no Gate). Sprint de
  divida: nenhuma tela, endpoint, DTO, migration ou regra nova. Nada mudou em `sep-api`/`sep-mobile`.
  **`contract:check` sai de 1 lacuna para ZERO** (85 operacoes) — primeira vez desde a criacao do gate
  na F-19, em 2026-07-16 —, e ficou provado que o zero nao e vazio: mutar o tipo de volta reprova, e o
  `varrerGapsObsoletos` reprova o gap sobrevivente, entao corrigir o tipo e remover o `knownGap` sao
  obrigatoriamente o mesmo commit. Vitest **765/93 -> 802/94**, Playwright 39, `lint`, `lint:scss`,
  `format:check`, `build` e `audit` verdes (3 `moderate` residuais da D-1, inalterados).
  **36 mutacoes** aplicadas e mortas; definicoes de helper de teste **80 -> 2**.
  **Os dois defeitos vivos fecharam.** O `errorInterceptor` nao arranca mais o usuario da
  `/account-locked`: a F-23 isentara `/auth/politica-lockout` so no `authInterceptor`, o que impede o
  header de ser ENVIADO mas nao a resposta de ser TRATADA — o `errorInterceptor` e o ultimo da cadeia,
  logo o mais interno, e ve o erro antes do `catchError` do servico. E o KPI do dashboard nao renderiza
  mais `NaNmin`: o campo era `number` enquanto o backend serializa `Duration` como ISO-8601, e o mock
  devolvia `7200` — **mais correto que o servidor**, e por isso nenhum teste via.
  **Decisao que atravessa a sprint**: a lista de rotas publicas passou a ter **dois** efeitos (nao
  anexar `Authorization` E nao navegar em 401/403), entao uma rota so entra se os dois forem
  desejados — `/auth/refresh` e `/auth/logout`, ambos `permitAll`, ficam de fora porque um 401 neles
  significa sessao morta e PRECISA navegar. O `423` e assimetrico de proposito: isenta-lo mataria a
  unica navegacao que ABRE a `/account-locked`.
  **Quatro pontos cegos do `contract-check.mjs` medidos, nenhum corrigido**: sem `kind` de gap para
  status; `varrerGapsObsoletos` reprova gap nao consumido (o que tornou impossivel o fallback previsto
  nos steps); check unidirecional; e valida `declarado ⊆ documentado`, **nunca**
  `declarado = ramificado`. Sprint propria.
  **Riscos declarados, nao simulados**: smoke real contra `:8080` nao executado — o vetor da F-24.1 e
  observavel offline, mas o cenario que o motiva (backend sem a Sprint 34) fica sem prova de ponta a
  ponta; e `PT0S` esconde falha de banco, porque o `resiliente(...)` do
  `ConsultarVisaoConsolidadaUseCase` engole `RuntimeException` e devolve `Duration.ZERO`,
  indistinguivel de "sem amostra" no fio — limitacao do backend, nao do web.
  A descricao de PR temporaria foi removida no ciclo padrao ao fechar a F-25; historico em
  [`CONTEXT-PARTE-2.md`](./CONTEXT-PARTE-2.md) §F-Sprint 24.

- **D-Sprint 1 (cross-repo) MERGEADA develop+main nos DOIS repos em 2026-08-05** — divida de
  dependencias no `sep-app` e no `sep-mobile` (correcao de divida de seguranca; sem jornada, tela,
  endpoint, contrato ou regra nova). Primeira sprint da faixa `3XX`: branch e PR por repo, mas **um**
  gate de aceite. `sep-app` via PR #128 (`d987714`) e #129 (`7f232b3`); `sep-mobile` via PR #145
  (`280857e`) e #146 (`7af2a1c`). **`develop` == `main` por diff de conteudo nos dois**, e a arvore
  das quatro pontas conferida byte-identica a das branches que passaram nos gates — conferido tambem
  o conteudo material (step de audit no `ci.yml`, script no `package.json`, `@angular/core@20.3.27`
  no lock), e nao so o hash.
  **`high` + `critical` foi a ZERO nos dois repos**: `sep-app` 19 -> 3 (12 high -> 0) e `sep-mobile`
  19 -> 8 (11 high -> 0), **sem nenhum major subido** — 86 e 35 pacotes alterados no lock,
  respectivamente, nenhum cruzando fronteira de major. Ionic 8.8.11 e Capacitor 8.4.0 intactos
  (ADR 0019). Fecharam, entre outros, *Angular i18n: XSS via event-handler attributes* e
  *Cache-Key Ambiguity no `HttpTransferCache`* (reuso de resposta entre requisicoes).
  A correcao foi Angular `20.3.26 -> 20.3.27`: o range vulneravel terminava **exatamente** na versao
  instalada, e o patch ja existia dentro da baseline — nao havia decisao de major a tomar. No
  `sep-app` o `npm audit fix` **nao** deu conta sozinho (os `@angular/*` declaram peer em versao
  exata e o lock prendia a resolucao) e foi preciso subir o conjunto no manifesto; no `sep-mobile` ele
  resolveu no lock sem tocar o `package.json`.
  **Os dois repos ganharam gate de `npm audit` no CI** (`--audit-level=high`, no job `test`; no
  `CI-MOBILE` so nesse job, porque os tres instalam do mesmo lock), e **foi provado que o gate morde**:
  com `low` e com `moderate` sai 1, revertido para `high` sai 0. Era o defeito de fundo — a F-19
  zerou o `sep-app` e ninguem soube que subira de novo por 18 dias.
  **A medicao do Gate derrubou dois numeros da spec**: a baseline do `sep-mobile` (25/1 critical/15
  high, medida em branch de feature) era 19/0/11, e os "dez pacotes `@angular/*` diretos" eram nove.
  Residual: 3 `moderate` no web e 8 no mobile, **todos** corrigiveis so em major, barrados pelos
  ADR 0018/0019 e registrados item a item em [`SEGURANCA.md`](./SEGURANCA.md) §18 — insumo da revisao
  de ADR de 2026-09-30. **Gate declarado pendente**: smoke real contra `:8080` nao executado, entao
  bump que altere comportamento de runtime segue sem prova. **O `sep-api` continua sem cobertura
  equivalente** (sem plugin de scan no `build.gradle`) — follow-up nomeado, candidato a sprint
  propria. A descricao do lado web foi removida no ciclo padrao ao fechar a F-25; a do mobile
  ([`SPRINT-D-1-PR.md`](../repos/sep-mobile/SPRINT-D-1-PR.md)) **segue no repo** e esta na mesma
  situacao de defasagem. Historico em
  [`CONTEXT-PARTE-2.md`](./CONTEXT-PARTE-2.md) §D-Sprint 1. Nada mudou no `sep-api`.
  O back-merge `main` -> `develop` do `sep-mobile`, pendente desde 2026-07-31 e pre-requisito da
  sprint, foi feito aqui (`66ce65a`): 3 arquivos, nenhum de app.

- **Tres sprints de divida PLANEJADAS em 2026-08-05** — spec + steps criados para a **D-Sprint 1**
  (dependencias, cross-repo), a **F-Sprint 24** (web) e a **Sprint 35** (backend), nessa ordem de
  execucao. Nenhuma delas depende de credencial, provider real ou API externa; sao a resposta a
  "sobrou algo executavel?" depois que a Fase 4 esgotou o escopo de produto sobre fake. **Nada de
  codigo foi tocado** — o trabalho foi so de planejamento, em `docs-SEP`.
  O levantamento conferiu cada item **no codigo**, e **dois registros deste arquivo estavam
  desatualizados a favor do problema**: `estabilizar()` tem dezenas de copias em `*.spec.ts` (o
  registro dizia "terceira copia" — subestimado em mais de 30; o levantamento anotou "39 definicoes
  byte-identicas", e **o Gate F-24.0 derrubou tambem esse numero e essa premissa**: sao 38, com 3
  corpos distintos, mais 42 definicoes de um segundo helper, `flush()`), e a constante
  `CorrelationIdFilter.MDC_KEY` **ja existe** mas **quatro** call sites usam o literal
  `MDC.get("correlationId")` (o registro nomeava so o `RateLimitFilter`). Os dois foram corrigidos
  aqui e nas specs.
  Achado novo que explica a divida de dependencias: **nenhum dos dois repos front tem `npm audit`,
  nem no CI nem como script de `package.json`** — e por isso que a contagem voltou de 0 (F-19) a 19
  sem deteccao. O gate entrou como Task, nao como bonus.
  **Ressalva de medicao**: os 19 do `sep-app` foram medidos em `develop` (`c72b393`) e valem; os **25
  do `sep-mobile` (1 critical, 15 high) foram medidos na branch `feature/msprint-17-...`**, que
  estava com checkout ativo no repo, **e nao valem como baseline** — o Gate D-1.0 re-mede em
  `develop` apos o back-merge, e seis PRs do Dependabot ja em `main` provavelmente derrubam parte da
  contagem. **A numeracao consumiu o backend 35**, entao o backend da Fase 5 renumerou de 35-38 para
  **36-39** em [`PRD-FASE-5.md`](./PRD-FASE-5.md) §46/§47, no mesmo precedente que ja recuou a fase
  duas vezes.

- **F-Sprint 23 (web) MERGEADA develop+main em 2026-08-05** — politica de lockout e `Retry-After`
  (retomada da Task F-22.6 como sprint propria; correcao de divida, sem escopo de produto novo).
  Em `origin/develop` via PR #125 (squash `9fb9788`, 8 commits absorvidos, 15 arquivos) e promovida a
  `main` via PR #126 (`b2809b3`), com back-merge `c72b393`; **`develop` == `main` conferido por diff
  de conteudo** (vazio), e a arvore de `origin/develop` conferida **byte-identica** a da branch que
  passou nos gates. O back-merge veio **vazio** — sem evil merge, ao contrario do que aconteceu na
  Sprint 34. `/account-locked` deixa de anunciar "ate 30
  minutos" fixo e deriva os tres numeros efetivos de `GET /auth/politica-lockout`, continuando
  funcional se a chamada falhar — ela e destino de redirect e alcancavel por URL direta, entao nada
  ali pode depender de rede. O login usa o `Retry-After` no `423`/`429`, onde **o header ganha do
  corpo**: a `message` do sep-api e montada a partir de `lockoutMinutes` e superestima a espera por
  design. O `authInterceptor` passa a isentar o endpoint publico, fechando um caminho em que o token
  velho levava `401` e o usuario era **arrancado da pagina** (ver §Leia agora).
  **Vitest 765 / 93** (partida 745/91; este registro dizia "94" — corrigido pela medicao do Gate
  F-24.0 em 2026-08-06, que rastreou 91 + 2 arquivos novos = 93 por `git ls-tree`),
  `contract:check` **85 operacoes / 1 lacuna**, Playwright
  **39**, demais gates verdes — todos rodados **depois** dos commits, porque o `lint-staged`
  reescreve arquivos, e **reconferidos em `develop` pos-merge com `npm ci`**. **26 mutacoes**
  verificadas. O code review gerou hotfix de sete achados, tres
  deles premissa errada e nao descuido: `Number.isInteger` entregue sem teste que o cobrisse, o
  fallback com numero literal sendo o estado inicial de **toda** renderizacao, e dois comentarios que
  a propria sprint tornou falsos. **Gate declarado pendente**: smoke real contra `:8080` nao
  executado, entao o CORS do `Retry-After` e um eventual `429` na propria pagina seguem sem prova —
  o MSW nao consegue provar nenhum dos dois. Follow-ups nomeados em
  [`CONTEXT-PARTE-2.md`](./CONTEXT-PARTE-2.md) §F-Sprint 23, com destaque para o vetor ainda aberto:
  o `errorInterceptor` roda **antes** do `catchError` do servico, entao um `401`/`403` na consulta
  navega para fora sem depender de header nenhum. Historico em
  [`CONTEXT-PARTE-2.md`](./CONTEXT-PARTE-2.md) §F-Sprint 23. Nada mudou em `sep-api`/`sep-mobile`.

- **Sprint 34 (backend) MERGEADA develop+main em 2026-08-03** — follow-ups de lockout e divida de
  contrato OpenAPI (sprint de divida; sem escopo de produto novo). Em `origin/develop` via PR #103
  (squash `0d24602`) e promovida a `main` via PR #104 (`550fed3`); **`develop` == `main` conferido
  por diff de conteudo** (vazio). **2220 testes / 0 falhas** (partida 2173), migration `V60`, sem ADR.
  Tentativa contra conta bloqueada passa a **deixar rastro** — ate a 33 nenhuma deixava, porque
  `verificar()` lanca antes de `registrar(...)` — com tipo de audit proprio
  (`LOCKOUT_TENTATIVA_BARRADA`) e o `LIMITE_DE_LEITURA` derivado da config, ja que a premissa que
  tornava o teto de 100 seguro caiu junto. `detalhes` do audit serializado (era concatenado contra
  coluna `jsonb`, com `username` vindo da request). `Retry-After` no `423` com o **restante real** e
  no `429` com o periodo de refresh — e `Retry-After` acrescentado a `app.cors.exposed-headers`, sem
  o que o header nao chega ao browser. Invariante `rate-limit > max-attempts` validada no boot, lida
  pelo `Binder` para enxergar relaxed binding, **e os defaults do POJO, que a violavam (5 vs 5),
  corrigidos**. Mapa de limitadores com teto LRU de 10.000 e origem cortada em 45 chars.
  `GET /api/v1/auth/politica-lockout` publico, derivado da mesma `PoliticaLockout` que o service
  aplica. `X-Step-Up-Token` declarado nos **24** endpoints por `OperationCustomizer` (10 obrigatorio,
  14 condicional — `@RequireStepUp` tem bypass pre-MFA), enums de contrato/assinatura publicados e
  headers de resposta documentados, tudo travado por regressao na 34.7.
  **Duas premissas da spec caiam**: o `Duration` (ver §Leia agora) e os defaults do rate limit.
  Todo comportamento novo verificado por **mutacao** (13 regressoes aplicadas e revertidas); duas
  delas revelaram testes que passavam provando nada — enum comparado contra `values()` e guard de
  `permitAll` assertando so "diferente de 200".
  **Incidente de merge**: o back-merge `main` -> `develop` (`4a02fc1`) duplicou
  `falhasRecentes(int, Duration)` em `LockoutServiceTest`, quebrando `compileTestJava` no CI de
  `develop` -> `main`. **O squash da feature entrou correto** (2 definicoes); foi o back-merge que
  virou 3, num arquivo que `main` nao havia alterado desde a base comum — resolucao manual, nao
  merge automatico. Corrigido em `fd4b4b1` (-8 linhas), com a arvore de `develop` voltando a ser
  byte-identica a da branch verificada. A descricao de PR temporaria foi removida no ciclo padrao ao
  fechar a Sprint 35; historico em [`CONTEXT-PARTE-2.md`](./CONTEXT-PARTE-2.md) §Sprint 34.

- **Gate de contrato no `sep-app` MERGEADO develop+main em 2026-08-03** — unico toque da Sprint 34
  fora do `sep-api`, restrito a `contracts/`. Em `origin/develop` via PR #120 (`83681e2`) e promovido
  a `main` via PR #121 (`ed9c816`); `develop` == `main` por conteudo. Snapshot OpenAPI reexportado do
  runtime da branch da Sprint 34 em perfil `dev`; **`contract:check` sai de 29 lacunas para 1** e
  `knownGaps` de 8 para 1. Fecharam as **18** ocorrencias do `X-Step-Up-Token` (o gap usava
  `appliesTo: "*"` e silenciava todas de uma vez), os 8 enums e os 2 headers de resposta; entraram o
  `Retry-After` nos `423`/`429` e a rota `politica-lockout`, que a **F-22.6** consome. Gates verdes:
  `contract:check`, `lint`, `format:check`, `build` e **Vitest 745 / 91 arquivos**. A lacuna restante
  e a do `Duration`, com o `reason` corrigido — antes repetia a premissa falsa e mandava o backend
  anotar `@Schema(type = number)`, tentado na 34.6 e revertido. **Nenhum codigo de app mudou.**

- **F-Sprint 22 (web) MERGEADA develop+main em 2026-07-31** — contrato de erro verificavel em CI e
  follow-ups da F-21 (sprint de divida; sem endpoint, DTO, migration ou regra nova). Em `origin/main`
  via PR #116 (`63eb2b6`); `develop` fecha com o merge de volta (`346546e`) e **`develop` == `main`
  conferido por diff de conteudo remoto** (vazio). O `contract:check` deixa de ser cego a erro: campo
  `erros` validado contra o OpenAPI (**9 operacoes** declaram), `responseHeaders` vira **mapa por
  status** — o loop antigo iterava `sucesso`, o que tornava o `Retry-After` inalcancavel — e
  `knownGap` obsoleto passa a **falhar** com exit 1, mas so contra o snapshot versionado. Alem disso:
  `verify-totp` traduz erro por status (antes acusava "codigo invalido" em bloqueio, rate limit, 5xx e
  queda de rede), foco no heading de `access-denied`, landmark em `verify-totp` e `redirect-to-app`,
  `RegisterComponent` orfao removido e extracao de mensagem unificada em `core/api/`. **Vitest 745 / 91
  arquivos** (era 685/88), Playwright 38, `contract:check` **84 operacoes** (era 85 — `auth.registrar`
  saiu com o componente morto) e 29 lacunas, audit 0. **Snapshot OpenAPI nao renovado** (segue
  `a613c6c`); nenhum `knownGap` criado ou removido. **A Task F-22.6 nao foi executada aqui** — ela
  virou a **F-Sprint 23**, concluida em 2026-08-05. Dois reviews geraram hotfix, ambos por furos que
  deixavam o check verde quando deveria reprovar. Historico em
  [`CONTEXT-PARTE-2.md`](./CONTEXT-PARTE-2.md) §F-Sprint 22 (a descricao de PR temporaria foi
  removida no ciclo padrao ao abrir a F-23).

- **M-Sprint 17 (mobile) MERGEADA develop+main em 2026-07-31** — follow-ups de lockout,
  acessibilidade e smoke (sprint de divida; sem jornada, rota, endpoint ou contrato novo). Spec
  [`217`](../specs/fase-4/217-msprint-17-followups-lockout-a11y-mobile.md) + steps
  [`217`](../steps-fase-4/mobile/217-msprint-17-steps.md). Em `origin/develop` via PR #135 (squash
  `4c33367`, 13 commits absorvidos, 23 arquivos) e promovida a `main` via PR #136 (`96cd13c`), com
  back-merge `4c29d17`. **`develop` != `main` por conteudo**, mas **nao por causa desta sprint**: o
  Dependabot #133 (`fast-uri` 3.1.2 -> 3.1.5, `892a94d`) entrou em `main` as 16:26, 18 min depois do
  back-merge das 16:08. A divergencia era **so `package-lock.json`** naquela data e **cresceu desde
  entao** (seis PRs do Dependabot; ver §Proximo passo), mas segue sem nenhum arquivo de app — conteudo
  da M-17 conferido integralmente em `main` por arquivos-assinatura e marcadores de codigo. Resolve
  com um back-merge (ver §Proximo passo). As seis tasks fecharam os quatro defeitos:
  mock MSW com lockout (`/account-locked` alcancavel offline pela primeira vez); cobertura do `423`
  nas tres camadas, que era tratado desde a Sprint 5 sem nenhum teste; guarda de reentrancia nos
  **dois** componentes; `<main>` aninhado removido das 4 telas; foco no heading de `/account-locked` e
  `/access-denied`; e o `golden-path-mobile` reescrito contra MSW. **A suite e2e foi a 41 verdes, sem
  nenhuma falha** — o smoke estava vermelho desde a M-4, ha quatro meses. Vitest **527 / 70** (era
  503/68); `cap sync android` e `gradlew assembleDebug` verdes **rodados localmente** (a maquina de
  dev tem Android SDK; o registro da M-16 dizendo o contrario estava desatualizado).
  **Tres defeitos fora do escopo planejado** foram achados pelos reviews e corrigidos com teste:
  (a) o `errorInterceptor` **nao redirecionava** se `clearSession()` rejeitasse, e ainda trocava o
  `401`/`423` original pelo erro de storage; (b) `consultarAportes` (M-16) prendia o card carregando
  **para sempre** quando havia reentrada com o Pix em voo — reproduzido por probe; (c) o mock era mais
  permissivo que producao em tres pontos (politica de senha sem o piso por palavra, `PATCH` de senha
  sem `Authorization`/ownership, e sem `@RequireStepUp`), a direcao perigosa da assimetria.
  A copy de `/account-locked` teve **cada afirmacao conferida contra o `sep-api`** e tres estavam
  erradas. **Fora de escopo por decisao**: plugar o MSW no Vitest, `focusManagerPriority` global,
  portar o `contract:check` e o escopo do Gate M-16.0 (exige ADR). Detalhe em
  [`CONTEXT-PARTE-2.md`](./CONTEXT-PARTE-2.md) §M-Sprint 17; historico em
  [`CONTEXT-PARTE-2.md`](./CONTEXT-PARTE-2.md) §M-Sprint 17. Nada mudou em `sep-api`/`sep-app`.
- **F-Sprint 21 (web) MERGEADA develop+main em 2026-07-30** — jornada de conta bloqueada no login
  (correcao de defeito; lado web do par corretivo). Em `origin/develop` via PR #113 (squash
  `b3e3f90`, 8 commits absorvidos) e promovida a `main` via PR #114 (`84eb47c`); `develop` == `main`
  conferido por diff de conteudo (vazio). O login
  passa a distinguir `400`/`401`/`423`/`429`/rede em vez de acusar senha invalida em tudo, usando o
  `message` do corpo onde ele e autoritativo; a navegacao do `423` permanece exclusiva do
  `errorInterceptor`. `/account-locked` teve **cada afirmacao conferida contra o `sep-api`** — quatro
  eram falsas ou incompletas — e ganhou landmark e foco no heading. O mock MSW virou stateful, com
  uma divergencia deliberada e travada por teste (conta tambem username desconhecido, o que o backend
  nao faz; o mock e mais estrito). Snapshot OpenAPI renovado `7f40056` -> `a613c6c` (4 adicoes:
  `423`/`429` em login e TOTP verify); **nenhuma entrada de `knownGaps` criada**, conforme o Step
  121.4.2 manda quando a Sprint 33 ja esta integrada. **Vitest 685 / 88 arquivos** (era 664/87),
  **Playwright 38** (era 36), demais gates verdes. **Smoke real contra `:8080` aprovado no criterio
  final**: 5 senhas erradas mostram a mensagem de credencial e a 6a, mesmo com a senha correta, cai
  em `/account-locked`. Historico em [`CONTEXT-PARTE-2.md`](./CONTEXT-PARTE-2.md) §F-Sprint 21. Nada
  mudou em `sep-api`/`sep-mobile`.
- **Sprint 33 (backend) MERGEADA develop+main em 2026-07-29** — conformidade da politica de account
  lockout (Fase 4, par corretivo; sem escopo novo). Em `origin/develop` via PR #101 (squash
  `a613c6c`) e promovida a `main` via PR #102 (`15f7833`); `develop` == `main` conferido por diff de
  conteudo (vazio). `estaBloqueada` deixa de aproximar por contagem na janela de 30 min e passa a exigir que
  as 5 falhas mais recentes caibam em 15 min; o bloqueio de 30 min conta **do evento**, nao do
  envelhecimento das falhas. A decisao virou o value object puro `PoliticaLockout` (testavel sem
  banco/relogio); o `LoginAttemptRepository` so entrega instantes de falha. Audit `LOCKOUT` + email
  passam a ser emitidos **na transicao** (nao por `== maxAttempts`, que perdia o bloqueio no salto de
  contador 4->6); `CONTA_BLOQUEADA` sai da contagem (evita bloqueio auto-perpetuante). Rate limit de
  login/TOTP de 5 para **10** com a invariante `rate-limit > max-attempts` comentada — com ambos em 5
  o `429` mascarava o `423`. **A IT nova (`LockoutLoginIT`) revelou que nenhuma falha chegava a
  `login_attempt`**: o registro entrava na transacao do `AutenticarUsuarioUseCase` e era desfeito
  pelo `BadCredentialsException` — o account lockout **nunca bloqueou de fato desde a Sprint 5**;
  corrigido com `REQUIRES_NEW` no registro e na avaliacao. OpenAPI de login e TOTP verify passam a
  declarar `423`/`429`. **2173 testes, 0 falhas** (+22 `@Test`); `clean build`/`spotlessCheck`
  verdes. Sem migration, sem estado novo, sem ADR. Risco residual aceito (decidido pelo usuario):
  seguir a doc torna o sistema 2x mais permissivo contra brute force lento (384/dia/conta vs 192);
  controle compensatorio fica como follow-up (escopo da **Sprint 34**, exceto o controle
  compensatorio, que exige ADR). Historico em [`CONTEXT-PARTE-2.md`](./CONTEXT-PARTE-2.md)
  §Sprint 33. O lado web e a **F-Sprint 21**, concluida
  e mergeada em 2026-07-30 (PR #113/#114). Nada mudou em `sep-app`/`sep-mobile`.
- **F-Sprint 20 (web) MERGEADA em 2026-07-21** — gestao assistida das chaves Pix da conta
  operacional/escrow (Epic 15; consome o backend da Sprint 31). Em `origin/develop` via PR #107
  (squash `66b5f04`, 11 commits absorvidos) e promovida a `main` via PR #108 (`c00d8ae`);
  `develop` == `main` por conteudo. `FINANCEIRO`/`ADMIN` listam (sempre mascarado, com historico),
  cadastram e removem chaves, com **step-up estrito** nas mutacoes; **guard proprio mais restrito
  que o pai** (`/app/pix` admite `BACKOFFICE`, mas a sub-rota `chaves` exige `FINANCEIRO`/`ADMIN`,
  que tambem some do menu). **O valor bruto da chave so existe na request de cadastro** — nunca em
  leitura, erro, sucesso, log ou storage; a confirmacao usa o `valorMascarado` do backend, nao o
  que foi digitado. `ChavePixIntencaoStore` (root, so memoria) preserva
  `{ tipo, valor, Idempotency-Key }` atraves do round-trip de step-up: retry pos-`5xx` reusa a
  **mesma** key e o rascunho e reconstituido, entao corrigir uma digitacao no reenvio nao duplica a
  chave. Retorno do step-up **nunca muta** (token de uso unico); `DELETE` idempotente, sem
  `Idempotency-Key`; sem polling, consulta em voo substituida. Reviews acharam um `409` falso por
  colisao de mascara de 3 chars (corrigido por impressao nao reversivel, que tambem tirou o valor
  em claro do mapa de idempotencia do mock), a semantica de tabela quebrada nos cartoes e mensagens
  que alegavam reconsulta ja concluida. Vitest **664** (era 586), Playwright **36** (+5),
  `contract:check`/`lint`/`build`/audit verdes. Limitacoes registradas como gate, nao simuladas:
  TOTP real, negacao de rota por URL direta e layout <768px exigem smoke local/conferencia visual.
  Nada mudou no `sep-api`. Detalhe no historico ([`CONTEXT-PARTE-2.md`](./CONTEXT-PARTE-2.md)
  §F-Sprint 20; a descricao de PR temporaria foi removida no ciclo padrao ao fechar a F-21).
- **M-Sprint 16 (mobile) MERGEADA em 2026-07-20** — aportes owner-scoped da credora (Epic 14/15).
  Em `origin/develop` via PR #124 (squash `77ea01a`) e promovida a `main` via PR #125
  (`a694f2d`); `develop` == `main` conferido por conteudo. **O Gate M-16.0 cortou o escopo**: o
  precheck mediu os seis contratos das Sprints 29-31 contra a base do app e constatou que cinco
  exigem `FINANCEIRO`/`ADMIN` — role que o `sep-mobile` nao possui
  (`UsuarioRole = 'ADMIN' | 'CLIENTE'`; o `roleGuard` tipa `route.data['roles']` como
  `UsuarioRole[]`, entao `'FINANCEIRO'` nem compila) e a credora autentica como `CLIENTE`.
  Entregue somente `GET /api/v1/credores/operacoes/{operacaoId}/aportes`: `StatusAporteCredora`
  + `AporteCredoraResponse` na borda, `listarAportes` no `credora-mobile.service` e secao
  somente leitura "Aportes da operacao" no detalhe da carteira, com quatro superficies distintas
  (lista, vazia `200 []`, indisponivel `404` neutro, erro tecnico), retry por gesto, sem polling
  e **sem nenhum CTA de mutacao**. `stepUpInterceptor` inalterado (GET nao consome o token de uso
  unico; ha teste travando). Badge `aporte-status` com rotulo textual e switch exaustivo sobre o
  union. Vitest **503** (era 487), Playwright 26 passed / 1 failed (`golden-path-mobile`,
  preexistente — **da M-4, nao da M-13**; ver M-Sprint 17), audit 0, build e `cap sync android` OK;
  `gradlew assembleDebug` rodava no job CI `Build Android (debug)` (a M-17 constatou que a maquina de
  dev **tem** Android SDK, ao contrario do que este registro dizia). Escopo adiado
  (matching, aporte POST, chaves Pix) **preservado como registro** na spec 216 e nos steps 216;
  reativar exige ADR + revisao da spec ou backend que admita a credora dona. Follow-up:
  `consultarStatusPix` (M-11.4, ja em `main`) tem a mesma race condition de duplo toque corrigida
  aqui nos aportes — **quitado pela M-Sprint 17**, que achou o defeito em dois componentes, nao um. A
  descricao temporaria `SPRINT-M-16-PR.md` foi removida no ciclo padrao ao fechar a M-17; historico
  em [`CONTEXT-PARTE-2.md`](./CONTEXT-PARTE-2.md) §M-Sprint 16.

- **M-Sprint 13 (mobile) MERGEADA em 2026-07-17** — empacotamento nativo Android via
  Capacitor 8 (Epic 14; sem jornada/endpoint/contrato novo, sem regressao PWA). Em
  `origin/develop` + `origin/main` via PR #123 (`develop` == `main` conferido pelo dev).
  [ADR 0019](../adr/0019-baseline-capacitor-8-mobile.md) formaliza a baseline Capacitor 8
  (supersede ADR 0003 e ADR 0015 no recorte do Capacitor; Node >= 22 obrigatorio no CLI).
  Projeto `android/` versionado (minSdk 24, compile/target 36, Gradle 8.14.3, AGP 8.13.0;
  5 plugins oficiais major 8); runtime nativo isolado em `core/native/` (`PlatformService` +
  `NativeRuntimeService`: status bar por tema, back button, deep links por allowlist via
  guards) com fallback web (no-op); guard novo `redirectAuthenticatedGuard` (achado do smoke —
  back fisico devolvia usuario logado a tela publica). Manifest endurecido
  (`allowBackup="false"`, so INTERNET, deep link por scheme proprio
  `com.dynamis.sep.mobile://`; App Links https ficam pra Fase 5). APK debug 5,2 MB / AAB debug
  4,1 MB; smoke em emulador (AVD Pixel 5, API 36, build offline com MSW) OK; job CI
  `Build Android (debug)` novo. Vitest 487 + `gradlew test lint assembleDebug bundleDebug`
  verdes; e2e PWA 24/25 (vermelho `golden-path-mobile` preexistente). Follow-ups: arte oficial
  da marca (icone/splash = placeholder DS), `minifyEnabled`/proguard no release da Fase 5,
  dedup de `loadCurrentUser`, smoke contra backend real `:8080`. Desbloqueia M-14 (iOS) e M-15
  (biometria). A descricao temporaria `SPRINT-M-13-PR.md` foi removida no ciclo padrao ao abrir a
  M-16; historico completo em [`CONTEXT-PARTE-2.md`](./CONTEXT-PARTE-2.md).
- **F-Sprint 19 (web) MERGEADA em 2026-07-16** — hardening de tooling, contrato e collections
  (follow-up da Fase 3; sem tela/endpoint/regra nova). Em `origin/develop` por push direto
  fast-forward (tip `bb825e7`; desvio de fluxo aceito) e promovida a `main` via PR #96
  (`01ccc52`); `develop` == `main`. Entregas: `contract:check` deterministico no `sep-app`
  (snapshot OpenAPI do sep-api `7f40056` versionado em `contracts/`; 82 contratos consumidos,
  zero divergencia real; lacunas do OpenAPI em `knownGaps` como follow-up backend — header
  step-up, Duration, enums, headers de resposta do documento assinado, required/nullable de
  responses) + step no CI-APP; tooling endurecido dentro do Angular 20 (`npm audit` 9->0,
  `npm ci` sem bypass); collections Postman/Insomnia renovadas (150/150 requests, credores/
  Pix+chaves/governanca/cobranca, sem PII/secrets — vars vazias `cpfTeste`/`cnpjTeste`);
  [ADR 0018](../adr/0018-avaliacao-angular-22-no-web.md) **ADIA Angular 22** (LTS do 20 ate
  2026-11-28; revisao 2026-09-30 ou infra Fase 5). Vitest 586 + Playwright 31.
- **F-Sprint 18 (web) MERGEADA em 2026-07-16** — aporte e matching assistidos da credora
  (Epic 15/10; consome backends Sprints 29-30). Em `origin/develop` via PR #94 (squash
  `ee9d5b6`; 10 commits absorvidos) e promovida a `main` via PR #95 (`7c96b78`);
  `develop` == `main` (conferido por conteudo). Duas personas no modulo `credores`: rotas
  operacionais `/app/credora/matching[/:id[/aporte]]` com `roleGuard` FINANCEIRO/ADMIN (sem
  `credoraPresenceGuard`); jornada CLIENTE intacta + lista owner-scoped de aportes no
  detalhe da carteira (somente leitura). Decisao/aporte com MFA precheck + step-up estrito
  (retorno nunca decide/registra), reconsulta antes de decidir, `TRATA_403_LOCALMENTE` so
  nas mutacoes, refresh-on-read por gesto (sem polling) e `AporteIntencaoStore` (root, so
  memoria) preservando {operacao, valor, Idempotency-Key} entre instancias — retry pos-5xx
  reusa a MESMA key e nao duplica aporte (P1 do review manual; P2 lista substitui consulta
  em voo; P3 seed MSW sem credora inelegivel sugerida). **Gate F-18.0**: chaves Pix ficaram
  fora da F-18 — destino web dedicado pos-F-19, **entregue pela F-20 em 2026-07-21**; o item
  do `v1.0-local` no web esta fechado (PRD-FASE-4 §37). Vitest 562 + Playwright 31/31 (4 smokes novos; TOTP real e negacao de rota por URL
  direta ficam pro smoke real `:8080`). Detalhe no historico
  ([`CONTEXT-PARTE-2.md`](./CONTEXT-PARTE-2.md); a descricao de PR temporaria da F-18 foi
  removida no ciclo padrao ao abrir a F-19).
- **F-Sprint 17 (web) MERGEADA em 2026-07-15** — aprofundamento financeiro/conciliacao
  (Epic 13). PR #92 develop (squash `2dfa0fd`) + #93 main. Gap analysis: 2 gaps fechados
  nas divergencias Pix (recorte de status no backend + `totalElements`); 4 contratos
  ausentes registrados como follow-up backend, nada simulado. Vitest 491, Playwright 27.
- **F-Sprint 16 (web) MERGEADA em 2026-07-15** — decisao de renegociacao do tomador
  (Epic 13; fecha o gap da F-9). PR #87/#88 + follow-up #89/#90. Aceite com MFA precheck +
  reconsulta + step-up estrito (retorno nunca aceita); recusa sem step-up;
  `TRATA_403_LOCALMENTE` criado aqui; dialogo acessivel padrao da fase. Vitest 487.
- **Sprint 32 (backend) MERGEADA em 2026-07-15** — consolidacao dos adapters externos
  skeleton (Epic 15/integracao). Em `origin/develop` via PR #99 e promovida a `main` via
  PR #100; `develop` == `main`. **Fecha o recorte backend da Fase 4.** ADR 0017 (flags por
  ambiente) + `ProviderFlagsValidator` + `ProviderRetryConfig` (fecha follow-ups de
  retry-em-4xx das Sprints 11/19); fake segue default; nada real ativado. Doc operacional
  [`INTEGRACOES-PROVIDERS.md`](../repos/sep-api/INTEGRACOES-PROVIDERS.md) com procedimento
  de ativacao gated da Fase 5.
- **Sprint 31 (backend) MERGEADA em 2026-07-14** — gestao assistida de chaves Pix da conta
  operacional/escrow (Epic 15). PR #97 develop (squash `7231a52`) + #98 main; 2102 testes.
  Minimizacao total (hash SHA-256 + mascara; valor bruto nunca exposto); advisory lock
  anti-chave-orfa; DV de CPF/CNPJ. Desbloqueou o recorte Pix da M-Sprint 16.
- **Sprint 30 (backend) MERGEADA em 2026-07-13** — matching assistido credora-operacao
  (Epic 15). PR #95 develop + #96 main; 1975 testes. Com a Sprint 29 (aporte, PR #93/#94),
  desbloqueia F-Sprint 18 (web) e M-Sprint 16 (mobile).
- **Fase 3 concluida tecnicamente em 2026-07-06**; **Fase 4 em execucao** (**32 specs** em
  [`specs/fase-4/`](../specs/fase-4/README.md) apos 2026-09-01: backend `027`-`038`, web `116`-`127`,
  mobile `213`-`219`, cross-repo `300`; marco `v1.0-local`); **Fase 5 planejada** e fixa na faixa
  **50-99** (Celcoin real, AWS, lojas) — [`PRD-FASE-5.md`](./PRD-FASE-5.md).

## Proximo passo

1. **F-Sprint 26 (web) e M-Sprint 18 (mobile)**, que consomem os codigos publicados pela Sprint 36 —
   [`126`](../specs/fase-4/126-fsprint-26-consumo-codigos-erro-web.md) e
   [`218`](../specs/fase-4/218-msprint-18-consumo-codigos-erro-mobile.md). A dependencia
   ("36 integrada em `develop`") **esta satisfeita desde 2026-09-08**. Os steps das duas **nao
   existem** — criados just-in-time ao aprovar cada uma.
   **Entrada medida para as duas**: o `contract:check` do `sep-app` fica **verde e cego** ao campo
   novo — ele valida `declarado ⊆ documentado`, e o web nao declara nada sobre `codigo`. As tres
   ocorrencias de `"codigo"` em `consumed-contracts.json` sao o **codigo TOTP de seis digitos**,
   coisa diferente. Declarar o campo e trabalho da F-26, e o `contract:check` so passa a proteger
   depois disso.
   **Segunda entrada**: o snapshot `contracts/openapi.snapshot.json` do `sep-app` **nao foi
   renovado** pela 36 — renovar produz diff de ~43 schemas por conta do follow-up antigo, e misturar
   esconderia a mudanca. Quem fizer a F-26 renova e paga o diff de uma vez.

2. **Sprint 37 — normalizacao da taxonomia** ([`037`](../specs/fase-4/037-sprint-37-normalizacao-taxonomia-erro.md),
   **preve ADR**). Ela sai de estimativa para **escopo medido**: a lista dos 53 excluidos, codigo a
   codigo com classe dona, modulo e motivo, esta em
   [`CODIGOS-DE-ERRO.md`](../repos/sep-api/CODIGOS-DE-ERRO.md). Sao **30 de formato** e **23 de
   colisao**, e as 16 se decompoem em 9 de faixa compartilhada, 2 de deduplicacao e 5 de colisao
   intra-modulo — **decomposicao medida, nao a da §Ancora 7 da spec 036**, que dizia 8/2/6.
   **Cuidado que a 36 comprou**: renomear codigo **ja publicado** agora e mudanca de contrato. Os 46
   excluidos nao estao publicados, entao a 037 ainda os renumera de graca — essa janela fecha se
   alguem os publicar antes.

3. **Frente A de notificacao**, em paralelo — [`038`](../specs/fase-4/038-sprint-38-modulo-notificacao-historico.md)
   (**preve ADR**, migration `V61`), [`127`](../specs/fase-4/127-fsprint-27-central-notificacao-web.md)
   e [`219`](../specs/fase-4/219-msprint-19-central-notificacao-mobile.md). Nao toca
   `ApiExceptionHandler`, entao nao colide com a cadeia P1.

4. **Regularizar as duas pontas que a varredura de 2026-09-02 achou e a Sprint 35 nao tocou** (ela e
   de `sep-api`):
   1. **`sep-mobile`: back-merge `main -> develop`.** O `develop` esta sem o patch
      `@angular/* 20.3.27` que ja esta em `main`, e o `npm audit` ali da **6 high** com o gate
      **vermelho**. Depois do back-merge, **re-medir**.
   2. **`sep-app`: decidir o que fazer com os tres commits de 2026-08-26** (`bf33e45`, `63248af`,
      `64b7b73`), que entraram em `develop` **sem PR**, com mensagens que nao descrevem o diff, e
      **deixaram o `format:check` vermelho**. **Decisao de quem manda no repo**, nao do agente.

5. **Correcao de documento com o maior peso da lista**: o
   [`ADR 0010`](../adr/0010-mfa-totp-com-biometria-mobile.md) §65-66 afirma "5 tentativas/min/IP" no
   login e "5 tentativas/min/**usuario**" no TOTP. **Sao 10, e por IP nos dois**, desde a Sprint 33
   (`APP_RATE_LIMIT_LOGIN:10`, `APP_RATE_LIMIT_TOTP_VERIFY:10`; `RateLimitFilter` chaveia por IP nos
   dois casos). O `AGENT.md` poe **ADR acima de spec e steps**, entao um ADR errado propaga com peso
   maior que qualquer outro documento defasado.

6. **Decisao de rumo, depois da cadeia P1 e da frente de notificacao.** Fechar a Fase 4 preenchendo o
   §41 do [`PRD-FASE-4.md`](./PRD-FASE-4.md) (hoje em branco) com status, PRs, back-merges e as
   dividas aceitas — o recorte mobile do Epic 15 (Gate M-16.0) e o iOS do Epic 14 (M-14/M-15) entram
   como **adiados**, nao como pendencias em aberto.

7. **M-14 (iOS) e M-15 (biometria iOS)** aguardam gate externo de hardware macOS 13+ (ver
   §Gates externos).

8. **Follow-ups tecnicos abertos** (nao bloqueiam).
   **ABERTOS pela Sprint 36** (2026-09-08): (i) **os quatro corpos de erro fora do handler** —
   `ApiAccessDeniedHandler`, `ApiAuthenticationEntryPoint`, `RateLimitFilter` e
   `PasswordResetEnforcementFilter` montam `ErrorResponseDto` direto na response e nunca passam pelo
   `@RestControllerAdvice`, entao `401`/`403`/`429` da cadeia de seguranca **nunca terao `codigo`**
   enquanto isso valer; (j) **`AUTH-403-PASSWORD_RESET_REQUIRED` embutido na `message`**
   (`PasswordResetEnforcementFilter:109`) — contorno que agora tem alternativa, mas o codigo e nao
   canonico e depende da 037; (k) **13 dos 17 handlers seguem sem taxonomia**, medido e listado em
   [`CODIGOS-DE-ERRO.md`](../repos/sep-api/CODIGOS-DE-ERRO.md); criar codigo para eles e decisao de
   produto e depende das personas, que nao existem; (l) **o catalogo e lista literal** — 46 dos 133
   codigos so existem como literal inline e 19 publicados sao `private`, entao a ligacao com o
   codigo-fonte e garantida por `ParticaoDeCodigosErroTest` e nao pelo compilador.
   **FECHADO pela Sprint 36**: a recomendacao **P1** do
   [`DIAGNOSTICO-PRODUTO.md`](./DIAGNOSTICO-PRODUTO.md) no lado backend — **`getCodigo()` com zero
   consumidores em `src/main`**, a taxonomia write-only. Fecha de vez quando a F-26 e a M-18
   consumirem. O item **(f)** da lista da 35 (snapshot OpenAPI do `sep-app` a renovar) **segue
   aberto** e passou a ter dono natural: a F-26 (ver §Proximo passo item 1).
   **ABERTOS pela Sprint 35** (2026-09-02): (a) **`415`/`406` caem em 500 em rota publica** —
   `POST /auth/login` com `Content-Type: text/plain` devolve 500 e loga `ERROR unhandled_exception`;
   e a mesma classe do defeito que a 35.3 fechou para o `405`, e e alcancavel **sem autenticacao**;
   (b) **a suite backend nao e hermetica** — usa o `sep_dev` compartilhado
   (`@AutoConfigureTestDatabase(replace = NONE)` + perfil `dev`), e residuo de uso manual produz
   **~90 falsos vermelhos**, medido no Gate 35.0; (c) **relogio do lado da escrita** —
   `LoginAttempt.registrar` e `AuditLogSeguranca.de` ainda carimbam `OffsetDateTime.now()` do sistema
   (1 e 6 call sites), e enquanto nao unificar **um IT de expiracao de lockout e impossivel**;
   (d) **`idx_login_attempt_ip_data` sem leitor** desde a remocao de `countByIpAndJanela` — schema
   ficou fora do escopo por decisao da spec, e ha argumento legitimo para mante-lo (forense por IP);
   (e) **`DEFAULT NOW()` morto** em `login_attempt.data_tentativa`, inalcancavel porque a coluna e
   `nullable = false` e a factory sempre popula; (f) **snapshot OpenAPI do `sep-app` a renovar** — o
   `contract:check` fica verde contra o documento novo, entao **e fidelidade e nao gate**, mas quem
   regenerar depois vai produzir um diff de ~43 schemas junto com as proprias mudancas;
   (g) **`CONTA_BLOQUEADA_FALLBACK`** (`sep-app/copy-de-erro.ts`) embute "30 minutos" fixo e agora
   diverge mais, porque o backend passou a anunciar o restante; (h) **`login.component.ts:50-56`** do
   `sep-app` justifica header-sobre-corpo com uma razao que deixou de valer.
   **FECHADOS pela Sprint 35**: `forward-headers-strategy` sem allowlist; validacao de
   `LockoutProperties` no boot; `ApiExceptionHandler` sem `405`; `resilience4j.ratelimiter` morto;
   `countByIpAndJanela` sem consumidor; `MDC.get` literal (os **10**, nao os 4 registrados);
   `Clock` injetavel no `LockoutService`; enums inline no schema; a `message` do `423` divergindo do
   `Retry-After`; e o `400` de path variable ausente do contrato — que **desbloqueia a F-24.5**.
   **Lacuna deliberada, nao pendencia**: o `405` que a 35.3 tornou real **nao** e publicado em
   operacao nenhuma. Vale para todas as 106, e nenhum consumidor ramifica por ele.
   **Segue aberto e exige ADR**: controle compensatorio contra brute force lento; expor `Retry-After`
   e demais itens que cruzam os tres repos.
   **Seguem abertos no web**: os 4 pontos cegos do `contract-check.mjs`; os 4 contratos ausentes da
   F-17; o rotulo "Criar conta"; `idCurto`/`formatarMoeda` duplicados; Playwright fora do CI-APP.
   **Seguem abertos no mobile**: plugar o MSW no Vitest; `focusManagerPriority` global (exige ADR);
   ausencia de `contract:check`; Playwright fora do `CI-MOBILE`; escopo adiado pelo Gate M-16.0.

## Gates externos pendentes (nao bloqueiam a Fase 4 sobre fake)

- **Credenciais Celcoin/BaaS** (sandbox e producao) — ativacao de adapters reais; escopo Fase 5.
- **Conta/ambiente AWS** — provisionamento e deploy remoto; escopo Fase 5.
- **Contas de loja** (Google Play, Apple Developer) — publicacao mobile; escopo Fase 5.
- **Host macOS compativel com Xcode 15+ (macOS 13+ Ventura)** — pre-requisito da **M-Sprint 14**
  (empacotamento nativo iOS via Capacitor 8). Host atual do dev e macOS 12.7.6 Monterey em hardware
  sem upgrade possivel; Xcode.app, CocoaPods e simulador iOS ausentes. Enquanto o acesso nao
  existir (Mac com macOS 13+, cloud Mac tipo MacinCloud/MacStadium/AWS mac1, ou runner CI macOS
  15), a M-Sprint 14 permanece bloqueada. **Nao bloqueia** M-15/M-16 sobre PWA/Android nem o
  restante da Fase 4; impacta apenas o fechamento do Epic 14 iOS no marco `v1.0-local`
  (PRD-FASE-4 §37).

Ate os acessos existirem: banco PostgreSQL local via Docker Compose; providers em Fake + WireMock;
empacotamento iOS adiado ate hardware/cloud Mac disponivel.

**Gate de Android FECHADO em 2026-09-01**: a maquina de dev nao tinha Android SDK (`C:\Android` nao
existia), ao contrario do que este arquivo e a M-Sprint 17 registravam. Foi montado do zero —
cmdline-tools 19.0, `platform-tools`, `platforms;android-36`, `build-tools;36.0.0`, licencas aceitas,
`local.properties` criado (ja em `.gitignore`) — e o APK debug foi gerado e conferido: **8,44 MB**,
`BUILD SUCCESSFUL` em 1m16s, 243 tasks, os 5 plugins Capacitor compilados. `ANDROID_HOME` **nao**
persiste no ambiente do usuario; setar por sessao ou fixar com
`[Environment]::SetEnvironmentVariable("ANDROID_HOME", "C:\Android\Sdk", "User")`.

## Decisoes ativas ainda vigentes

- **Stack**: backend Java 21 + Spring Boot 3.5.x + Gradle + PostgreSQL 16; web Angular 20.x
  (Standalone + Signals + SCSS); mobile Ionic 8.4+ + Angular 20.x + Capacitor 8. Upgrade de major so
  com ADR.
- **Arquitetura backend**: monolito modular DDD + Hexagonal/Ports & Adapters por modulo; integracoes
  externas por Provider Pattern (Fake default + WireMock; adapter real gated por credenciais).
- **Design system vigente**: [`New Design System Sep.md`](<./New Design System Sep.md>) no web e no
  mobile (Epic 17; substituiu Apple/Notion).
- **Git**: branch por sprint a partir de `develop` (`feature/<tema>`); `feature -> develop -> main`;
  commits pelo agente com aprovacao em checkpoint; **push e PR manuais**. Em `docs-SEP` a operacao git
  e 100% manual (agente so edita working tree). Detalhe em [`../AGENT.md`](../AGENT.md).
- **Marco regulatorio**: CMN 4.656/2018 (KYC/KYB, escrow, PLD auditavel, auditoria reforcada).

## Ponteiros

| Preciso de... | Leia |
|---------------|------|
| Fundacao (porque/como, stack, arquitetura) | [`CONTEXT-PARTE-1.md`](./CONTEXT-PARTE-1.md) |
| Historico de execucao (log por sprint) | [`CONTEXT-PARTE-2.md`](./CONTEXT-PARTE-2.md) (grande; sob demanda) |
| Planejamento completo das fases | [`PRD.md`](./PRD.md) + `PRD-FASE-1..5.md` (referencia; nao obrigatorio se o "Leia agora" acima ja basta) |
| Navegacao por tarefa/modulo | [`../AI-ROADMAP.md`](../AI-ROADMAP.md) (condicional — ver `../AGENT.md` §Ordem de leitura) |
| Regras operacionais para agentes | [`../AGENT.md`](../AGENT.md) |
| **Lacunas de produto medidas** (erros, personas, metricas, cenarios, docs, NFR) | [`DIAGNOSTICO-PRODUTO.md`](./DIAGNOSTICO-PRODUTO.md) (2026-09-01) |
| **Que numero usar numa spec nova** | [`../AGENT.md`](../AGENT.md) §Numeracao de sprint e de spec — banda por repo **e** faixa por fase |
