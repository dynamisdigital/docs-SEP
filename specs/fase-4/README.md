# Specs - Fase 4

Fase 4 completa o escopo remanescente dos Epics 13/14/15, planeja o Epic 16 (documento) e salda os
follow-ups de go-live da Fase 3. O corte de entrega e o marco `v1.0-local` (tudo menos AWS e Celcoin,
sobre providers Fake/WireMock). Escopo detalhado em [`../../docs-sep/PRD-FASE-4.md`](../../docs-sep/PRD-FASE-4.md).

As tabelas usam a ordem recomendada de execucao.

## Regras de planejamento

- **Faixa por fase (desde 2026-09-01)**: dentro de cada banda, as Fases 1-4 ocupam **0-49** e a
  Fase 5 ocupa **50-99**. A Fase 4 cresce de `039` a `049` no backend, de `128` a `149` no web e de
  `220` a `249` no mobile **sem tocar na Fase 5**. Regra completa em
  [`../../AGENT.md`](../../AGENT.md) §Numeracao de sprint e de spec.
  Antes disso a numeracao era sequencia unica atravessando as fases, e **toda sprint nova de Fase 4
  renumerava sprints de Fase 5 que ninguem havia escrito** — oito recuos em quatro meses, cinco deles
  num unico dia. As mencoes a "Nº recuo" nas linhas abaixo sao **historico**, nao regra viva.
- Specs separados por projeto: backend (`0XX`), web (`1XX`), mobile (`2XX`) e **cross-repo (`3XX`)**.
  A faixa `3XX` nasceu em 2026-08-05 com a D-Sprint 1 e vale para sprint que entrega em mais de um
  repo com **um** criterio de aceite; os steps dela vivem em `steps-fase-4/cross-repo/`. Uma sprint
  cross-repo continua tendo **uma branch e um PR por repo** — o que ela unifica e o gate e o registro
  de divida, nao a operacao git.
- Cada sprint tem no maximo **7 tasks de implementacao**.
- Precheck, E2E/smoke, documentacao, collections e fechamento nao contam no limite de tasks.
- Steps continuam just-in-time, criados apenas quando a sprint for aprovada para execucao.
- Backend segue monolito modular DDD + Hexagonal/Ports & Adapters + Provider Pattern.
- Web e mobile nao concentram regra de negocio; consomem contratos da API.
- Nada nesta fase move dinheiro real nem ativa provider Celcoin/AWS: aporte/matching/Pix avancado
  rodam sobre fake; adapters reais ficam skeleton (ativacao = Fase 5).

## Backend (`sep-api`)

| Sprint | Arquivo | Tema | Impl tasks |
|--------|---------|------|------------|
| 27 | [`027-sprint-27-step-up-server-side-aceite.md`](./027-sprint-27-step-up-server-side-aceite.md) | Step-up estrito server-side no aceite de contrato (gate go-live) | 6 |
| 28 | [`028-sprint-28-cobranca-portas-persistencia.md`](./028-sprint-28-cobranca-portas-persistencia.md) | Portas de persistencia de `cobranca` (ADR 0007) | 7 |
| 29 | [`029-sprint-29-credora-aporte-escrow.md`](./029-sprint-29-credora-aporte-escrow.md) | Aporte da credora + escrow (foundation, assistido) | 7 |
| 30 | [`030-sprint-30-credora-matching-operacao.md`](./030-sprint-30-credora-matching-operacao.md) | Matching credora<->operacao (assistido) | 7 |
| 31 | [`031-sprint-31-pix-gestao-chaves.md`](./031-sprint-31-pix-gestao-chaves.md) | Gestao de chaves Pix (assistido, Provider Pattern) | 6 |
| 32 | [`032-sprint-32-adapters-celcoin-skeleton.md`](./032-sprint-32-adapters-celcoin-skeleton.md) | Skeleton dos adapters Celcoin/BaaS + WireMock (sem ativar) | 5 |
| 33 | [`033-sprint-33-lockout-conformidade.md`](./033-sprint-33-lockout-conformidade.md) | Conformidade da politica de lockout (15/30 min) + `423` alcancavel — **correcao de defeito**; **MERGEADA develop+main** (PR #101/#102, 2026-07-29) | 4 |
| 34 | [`034-sprint-34-followups-lockout-contrato.md`](./034-sprint-34-followups-lockout-contrato.md) | Follow-ups do lockout (observabilidade, `Retry-After`, invariante de config, evicção do registry) + divida de contrato OpenAPI (`knownGaps` da F-19) — **correcao de divida**; **concluida** (PR #103 develop / #104 main, 2026-08-03; 13 commits, 2220 testes, migration `V60`; gate de contrato no `sep-app` via PR #120/#121, `contract:check` de 29 lacunas para 1) | 7 |
| 35 | [`035-sprint-35-divida-config-lockout-contrato.md`](./035-sprint-35-divida-config-lockout-contrato.md) | Allowlist de proxy (`forward-headers-strategy`), validacao de `LockoutProperties` no boot, `405` faltante, config e codigo morto, `Clock` injetavel e itens de contrato — **correcao de divida**; **MERGEADA develop+main em 2026-09-02** (PR #105 squash `23004b9` / #106 `8cabf2c`; 2262 testes / 0 falhas; 46 mutacoes, cinco sobreviveram). Entregou 8 Tasks: os steps erraram o escopo em duas delas (35.2 e 35.6) e o teste mostrou antes do codigo. Consome o numero 35, e o backend da Fase 5 renumerou para 36-39 — depois para 37-40 com a Sprint 36, depois para 38-41 com a Sprint 37 e 39-42 com a Sprint 38 — cadeia encerrada em 2026-09-01 pela faixa por fase, que fixa a Fase 5 em **50-99** | 8 |
| 36 | [`036-sprint-36-codigos-erro-no-fio.md`](./036-sprint-36-codigos-erro-no-fio.md) | Publicar a taxonomia de codigos de erro no fio: campo `codigo` opcional no `ErrorResponseDto`, propagacao pelo handler e catalogo do **subconjunto apto** no OpenAPI, com **perimetro** sobre o que nao pode ser publicado — **produto novo** (superficie de contrato nova); **MERGEADA develop+main em 2026-09-08** (PR #107/#108). Fecha o lado backend da recomendacao **P1** do [`DIAGNOSTICO-PRODUTO.md`](../../docs-sep/DIAGNOSTICO-PRODUTO.md): a taxonomia era construida no dominio e **descartada na fronteira HTTP**. **O Gate 36.0 derrubou sete numeros ou premissas**, entre elas a §Ancora 4 — `build()` **nao** e o ponto unico de montagem, sao cinco construcoes. Medido: **133 codigos** em 13 prefixos, **16 colisoes**, **31 violacoes de formato**, **26 `private`**, **13 de 17 handlers sem codigo**. Particao final **80 publicados + 53 excluidos**, verificada a cada build. A secao §Medicao do Gate 36.0 da spec substitui as contagens das Ancoras | 7 |
| 37 | [`037-sprint-37-normalizacao-taxonomia-erro.md`](./037-sprint-37-normalizacao-taxonomia-erro.md) | Normalizar a taxonomia: decidir **o que o prefixo significa** e **qual e a convencao de sufixo**, resolver as colisoes e re-prefixar `credores` — **correcao de divida**; **planejada** (2026-09-01). **Preve ADR**, ao contrario da 036: define convencao que vincula sprints futuras e atravessa os tres repos. Nao e sprint de rename — e sprint de decisao. Achados que a dimensionam: o prefixo **nao e identificador de modulo** (um modulo com dois prefixos, um prefixo em dois modulos, e nenhum registro em lugar nenhum); `credores` ocupa a faixa `CRD` com **35 codigos contra 10** do `credito`, que lhe da nome; das 12 colisoes, **2 nao sao colisao** (constante duplicada com mesmo significado, corrige por deduplicacao); e o `PIX` tem **28 sufixos semanticos contra 3 numericos**, entao e convencao paralela com dono, nao desvio. Consome o numero 37 e provoca o **5o recuo** do backend da Fase 5, para 38-41 | 8 |
| 38 | [`038-sprint-38-modulo-notificacao-historico.md`](./038-sprint-38-modulo-notificacao-historico.md) | Modulo `notificacao` transversal, historico persistido (`V61`), canal `IN_APP` e **um** gatilho real (`PixTransferenciaConcluidaEvent` -> tomador) — **produto novo**; **planejada** (2026-09-01). **Preve ADR** (supersede parcial do 0014). Frente **A** do levantamento de notificacoes: medido, o `sep-api` tem **71 eventos de dominio e tres pontos de envio**, e os tres falam com o tomador em momento ruim (regua de cobranca, renegociacao, conta bloqueada) — o produto **so fala com o tomador para cobrar**. Ha **duas infra paralelas**: a completa presa dentro de `cobranca`, e a rasa (`shared.email.EmailService`, 1 consumidor) que e absorvida aqui. **Nao ha historico nem opt-out.** Consome o numero 38 e provoca o **6o recuo** do backend da Fase 5, para 39-42 | 8 |

## Web (`sep-app`)

| Sprint | Arquivo | Tema | Impl tasks |
|--------|---------|------|------------|
| F-16 | [`116-fsprint-16-renegociacao-tomador-web.md`](./116-fsprint-16-renegociacao-tomador-web.md) | Renegociacao do tomador no web (fecha gap F-9) | 6 |
| F-17 | [`117-fsprint-17-financeiro-conciliacao-web.md`](./117-fsprint-17-financeiro-conciliacao-web.md) | Aprofundamento financeiro/conciliacao web | 6 |
| F-18 | [`118-fsprint-18-aporte-matching-credora-web.md`](./118-fsprint-18-aporte-matching-credora-web.md) | Aporte e matching da credora no web | 6 |
| F-19 | [`119-fsprint-19-hardening-tooling-contrato-web.md`](./119-fsprint-19-hardening-tooling-contrato-web.md) | Hardening de tooling + refresh contrato/collection | 5 |
| F-20 | [`120-fsprint-20-chaves-pix-web.md`](./120-fsprint-20-chaves-pix-web.md) | Gestao de chaves Pix no web — **concluida** (PR #107/#108, 2026-07-21; fecha a pendencia do Gate F-18.0 e o recorte web do `v1.0-local`) | 7 |
| F-21 | [`121-fsprint-21-lockout-login-web.md`](./121-fsprint-21-lockout-login-web.md) | Jornada de conta bloqueada no login web — **correcao de defeito**; **MERGEADA develop+main** (PR #113/#114, 2026-07-30; fecha o par corretivo com a Sprint 33; smoke real contra `:8080` aprovado) | 4 |
| F-22 | [`122-fsprint-22-contrato-erro-followups-web.md`](./122-fsprint-22-contrato-erro-followups-web.md) | Contrato de erro verificavel no `contract:check` (status de erro + gap obsoleto) e follow-ups da F-21 (`verify-totp`, foco/landmarks, registro orfao, helper de erro) — **correcao de divida**; **MERGEADA develop+main** (PR #116, 2026-07-31) **exceto a Task 6**, que dependia da Sprint 34 e da regeneracao do snapshot OpenAPI — **ambos feitos em 2026-08-03; a Task 6 foi executada pela F-23** | 6 |
| F-23 | [`123-fsprint-23-politica-lockout-web.md`](./123-fsprint-23-politica-lockout-web.md) | Consumir `GET /auth/politica-lockout` e o `Retry-After` — retomada da Task F-22.6 como sprint propria, **correcao de divida**; **MERGEADA develop+main** (PR #125/#126, 2026-08-05). Fecha o texto fixo de `/account-locked` e um caminho em que o token velho arrancava o usuario da pagina. **Esgota o recorte web da Fase 4**; smoke real contra `:8080` fica como gate declarado pendente | 7 |
| F-24 | [`124-fsprint-24-divida-tecnica-web.md`](./124-fsprint-24-divida-tecnica-web.md) | Vetor do `errorInterceptor` na `/account-locked`, `/auth/totp/verify` com `Authorization` morto, `message: ""` apagando alerta, `NaNmin` no KPI do dashboard, descriptor e duplicacoes de teste — **correcao de divida**; **CONCLUIDA na branch** (2026-08-06), push e PR manuais pendentes. `contract:check` **1 lacuna -> 0** (primeira vez desde a F-19); Vitest 765/93 -> **802/94**; 36 mutacoes; helpers de teste **80 -> 2** definicoes | 7 |
| F-25 | [`125-fsprint-25-aviso-cookies-privacidade-web.md`](./125-fsprint-25-aviso-cookies-privacidade-web.md) | Aviso de cookies dispensavel e pagina publica de politica de privacidade descrevendo o armazenamento que o web de fato usa — **produto novo**, primeira frente de produto no web desde que a Fase 4 esgotou o escopo sobre fake; **PLANEJADA** (2026-08-21). **Transparencia, nao consentimento**: o unico cookie (`sep-refresh`) e de autenticacao e nao ha rastreamento de terceiro, entao opt-in gatearia zero cookies. Texto entra marcado **PENDENTE revisao juridica** (precedente do `PLD.md`). Nao toca `sep-api` nem contrato: `contract:check` tem de fechar identico (85 operacoes / 0 lacunas) | 6 |
| F-26 | [`126-fsprint-26-consumo-codigos-erro-web.md`](./126-fsprint-26-consumo-codigos-erro-web.md) | Consumir o `codigo` de erro publicado pela Sprint 36: helper `codigoDeErroDaApi()`, catalogo gateado no `contract:check` e discriminacao do `400` **colapsado** do `verify-totp` pelos codigos `MFA-400-002/003/004` — **produto novo**; **planejada** (2026-09-01). Lado web da recomendacao **P1**. **Depende da 036 em `develop`.** Os 3 literais duplicados que o `STATE.md` cita **ja foram fechados pela F-24** (viraram `copy-de-erro.ts`); o que sobrou e o **ramo**, nao a frase | 6 |
| F-27 | [`127-fsprint-27-central-notificacao-web.md`](./127-fsprint-27-central-notificacao-web.md) | Primeira superficie de notificacao do `sep-app`: contador de nao-lidas no shell autenticado, lista paginada, marcar como lida e mock MSW fiel — **produto novo**; **planejada** (2026-09-01). Lado web da frente **A**. **Depende da 038 em `develop`**; independente da M-19 e da cadeia P1. **Sem polling e sem tempo real** por decisao: oferece `read your writes` no contador, nao `read others writes`. Nao provoca recuo (a Fase 5 nao tem sprint de web) | 6 |

## Mobile (`sep-mobile`)

| Sprint | Arquivo | Tema | Impl tasks |
|--------|---------|------|------------|
| M-13 | [`213-msprint-13-empacotamento-nativo-android.md`](./213-msprint-13-empacotamento-nativo-android.md) | Empacotamento nativo Android (Capacitor 8) + ADR baseline | 5 |
| M-14 | [`214-msprint-14-empacotamento-nativo-ios.md`](./214-msprint-14-empacotamento-nativo-ios.md) | Empacotamento nativo iOS (Capacitor 8) | 4 |
| M-15 | [`215-msprint-15-biometria-nativa.md`](./215-msprint-15-biometria-nativa.md) | Biometria nativa (substitui stub PWA) + hardening | 6 |
| M-16 | [`216-msprint-16-aporte-pix-avancado-mobile.md`](./216-msprint-16-aporte-pix-avancado-mobile.md) | Aporte/matching e chaves Pix na credora mobile — **concluida com escopo reduzido** (Gate M-16.0: so aportes owner-scoped; matching/aporte POST/chaves Pix adiados por exigirem `FINANCEIRO`) | 6 -> 3 |
| M-17 | [`217-msprint-17-followups-lockout-a11y-mobile.md`](./217-msprint-17-followups-lockout-a11y-mobile.md) | Jornada de conta bloqueada alcancavel e testada, race de duplo toque em `consultarStatusPix` (2 componentes), landmark `main` duplicado dentro do `ion-content` e recuperacao do smoke `golden-path-mobile` — **correcao de divida**; **concluida** (PR #135 develop / #136 main, 2026-07-31; suite e2e a 41 verdes / 0 falhas, o smoke estava vermelho desde a M-4; Vitest 527/70) | 6 |
| M-18 | [`218-msprint-18-consumo-codigos-erro-mobile.md`](./218-msprint-18-consumo-codigos-erro-mobile.md) | Criar o `core/api/api-error.ts` que o `sep-mobile` **nunca teve**, unificar os **9** casts inline de `as ApiErrorResponse` espalhados por 8 arquivos e trocar ramificacao por status por ramificacao por codigo — **produto novo**; **planejada** (2026-09-01). Lado mobile da recomendacao **P1**. **Depende da 036 em `develop`**; independente da F-26. Consome o numero M-18 e renumera o mobile da Fase 5 para **M-19/M-20** | 5 |
| M-19 | [`219-msprint-19-central-notificacao-mobile.md`](./219-msprint-19-central-notificacao-mobile.md) | Central de notificacao no `sep-mobile`, com o contrato do `IN_APP` nascendo compativel com push **sem implementar push** — **produto novo**; **planejada** (2026-09-01). Lado mobile da frente **A**. **Depende da 038**; ordem preferida **apos a M-18**, que cria o `api-error.ts` (rodar antes faz o decimo cast inline). Nenhuma permissao de notificacao e solicitada — pedir antes de ter push queima a permissao uma vez so. Consome M-19 e provoca o **2o recuo** do mobile da Fase 5, para M-20/M-21 | 6 |

## Cross-repo (`sep-app` + `sep-mobile`)

| Sprint | Arquivo | Tema | Impl tasks |
|--------|---------|------|------------|
| D-1 | [`300-dsprint-1-divida-dependencias-web-mobile.md`](./300-dsprint-1-divida-dependencias-web-mobile.md) | Remediar vulnerabilidades de dependencia `high`/`critical` nos dois repos front e instalar o gate de `npm audit` no CI, que hoje **nao existe em nenhum dos dois** — **correcao de divida de seguranca**; **MERGEADA develop+main nos dois repos** (`sep-app` PR #128/#129, `sep-mobile` PR #145/#146, 2026-08-05). `high`+`critical` a **zero** nos dois (19->3 e 19->8), sem nenhum major subido, e gate de `npm audit --audit-level=high` instalado nos dois CIs e **provado que morde**. O back-merge que bloqueava a metade mobile foi feito na propria sprint. Residual so `moderate`, todo corrigivel apenas em major | 5 |

## Dependencias gerais

- Backend 27 (gate go-live) e 28 (refactor) sao independentes; 29 -> 30 -> 31 sao a sequencia do
  Epic 15 (assistido, sobre fake); 32 (skeleton) e independente e sua ativacao real e Fase 5.
- Web F-16 depende da Sprint backend 24 (ja mergeada); F-17 e gap-closing (escopo confirmado no
  precheck); F-18 depende das Sprints backend 29-30; F-19 depende do OpenAPI vigente; F-20 depende da Sprint
  backend 31 (chaves Pix) e fecha a pendencia de visibilidade web do Gate F-18.0.
- **Par corretivo 33 + F-21 (2026-07-29)**: dois lados do mesmo defeito (a jornada de conta bloqueada
  nao chega em `/account-locked`). Sao **independentes para implementar** — a 33 nao depende da F-21
  e a F-21 usa mock — mas o **smoke real** contra `:8080` so fecha com as duas integradas. Nenhuma
  das duas entrega escopo novo: corrigem no backend e no web um requisito ja entregue pela Sprint 5
  (Fase 2). A Task 33.4 tambem quita o `knownGaps` de `423`/`429` que a F-21 registra.
- **F-Sprint 22 (2026-07-30)**: par web da Sprint 34, tambem de divida. **As Tasks F-22.1 a F-22.5 sao
  independentes** e podem rodar antes da 34; a **F-22.6 exige a 34 mergeada** e o `sep-api` no ar para
  regenerar o snapshot OpenAPI — diferente do par 33/F-21, onde o mock bastava, porque aqui o
  `contract:check` valida contra o snapshot versionado. O que ela entrega e o `423` deixar de poder
  sumir do backend sem falhar nada em CI.
- **Sprint 34 (2026-07-30)**: sprint de divida, nao de produto. Consome os follow-ups que a 33 e a
  F-21 registraram e as lacunas de OpenAPI abertas pela F-19 desde 2026-07-16. Depende da 33 (opera
  sobre o codigo que ela deixou) e nao desbloqueia frente nova — o que ela entrega e o
  `contract:check` passar a ter opiniao real sobre o `X-Step-Up-Token`, ate entao silenciado em 18
  endpoints por um `knownGap` com `appliesTo: "*"`. Toca o `sep-app` apenas em `contracts/`, no gate
  de fechamento. **Achado da execucao**: uma das cinco lacunas estava mal diagnosticada — o
  `Duration` do dashboard ja era documentado corretamente como `string` (o Spring Boot desliga
  `WRITE_DURATIONS_AS_TIMESTAMPS`), e quem diverge e o `sep-app`. Esse `knownGap` **nao fecha nesta
  sprint**; fecha do lado web.
- Mobile M-13 -> M-14 (nativo); M-15 depende da base nativa (M-13/M-14) e da Sprint 27; M-16 depende
  das Sprints backend 29-31 e da M-Sprint 10.
- **M-Sprint 17 (2026-07-30)**: terceira sprint de divida da fase, junto com a 34 e a F-22, e a
  **unica das tres sem dependencia nenhuma** — nao consome contrato novo do `sep-api` (o `423` existe
  desde a Sprint 5; a Sprint 33 apenas o tornou alcancavel). Pode rodar a qualquer momento, em
  paralelo com as outras duas. **Nao** reabre o escopo do Gate M-16.0, que segue exigindo ADR.
- **Dependencia de persona (Gate M-16.0, 2026-07-20)**: contratos backend que exigem
  `FINANCEIRO`/`ADMIN` sao inalcancaveis pelo `sep-mobile`, que so conhece
  `UsuarioRole = 'ADMIN' | 'CLIENTE'`. Antes de planejar sprint mobile sobre contrato novo,
  conferir a role exigida no backend — foi o que reduziu a M-16 a um unico endpoint.
- **Trio de divida planejado em 2026-08-05 (D-1 -> F-24 -> 35)**: a quarta, quinta e sexta sprints de
  divida da fase, e as unicas frentes executaveis depois que o escopo de produto sobre fake se
  esgotou. **Nenhuma depende de API externa, credencial ou provider real.**
  - **D-1 -> F-24**: dependencia de **conveniencia, nao funcional**. A D-1 mexe em
    `package-lock.json` do `sep-app`; rodar a F-24 antes forcaria rebase sobre o mesmo arquivo.
  - **F-24 e 35 sao independentes entre si**: nenhuma consome contrato novo da outra. A ordem e de
    severidade — a F-24 carrega dois defeitos vivos em producao.
  - **A D-1 tem pre-requisito manual**: back-merge `main` -> `develop` no `sep-mobile` (`main` esta 7
    commits a frente). Sem ele, as Tasks D-1.3/D-1.4 nao comecam; as do `sep-app` seguem.
  - **Atencao na Sprint 35**: se a Task 35.7 mudar a forma dos enums no OpenAPI, ela **muda o
    snapshot que o `contract:check` do `sep-app` valida** e pode reabrir uma lacuna que a F-24 acabou
    de fechar. O Gate 35.0 mede isso antes de a task desenhar qualquer coisa.
- **Cadeia P1 planejada em 2026-09-01 (36 -> F-26 / M-18)**: primeira frente aberta a partir do
  [`DIAGNOSTICO-PRODUTO.md`](../../docs-sep/DIAGNOSTICO-PRODUTO.md). Publica no fio os 67 codigos de
  erro que o dominio ja constroi e descarta na fronteira HTTP. **Nenhuma depende de API externa.**
  - **36 depois da 35, obrigatoriamente**: as duas mexem em `ApiExceptionHandler.java`, e a 35
    acrescenta o handler de `405`. A dependencia e de arquivo, nao de contrato.
  - **Conflito a resolver antes de executar**: a **Task 35.5** planeja remover
    `ContaBloqueadaException.CODIGO` como codigo morto; a **Task 36.4** lhe da consumidor. A 35.5 deve
    manter apenas a metade do `countByIpAndJanela`. Se a 35 ja tiver removido, a 36.4 recria.
  - **F-26 e M-18 exigem a 36 em `develop`** e sao independentes entre si — podem correr em paralelo.
    E o mesmo par corretivo que a fase ja rodou tres vezes (33 -> F-21, 34 -> F-23, 31 -> M-16).
  - **A F-26 exige tambem a F-25 em `develop`**, que na criacao destas specs seguia com push e PR
    manuais pendentes.
  - **Janela que fecha**: `CTR-422-CCB-001` e o unico dos 67 fora do padrao `MOD-STATUS-NNN`. Enquanto
    nada consome, renomear e uma linha; depois de publicado vira mudanca de contrato. A Task 36.3
    normaliza **antes** da exposicao por isso.
- Gates externos (credenciais Celcoin, conta AWS, contas de loja) nao bloqueiam a implementacao
  destas sprints sobre fake; a ativacao real e a publicacao sao escopo da Fase 5
  ([`../../docs-sep/PRD-FASE-5.md`](../../docs-sep/PRD-FASE-5.md)).
