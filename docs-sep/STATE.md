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

_Atualizado em: 2026-08-05._

## Leia agora

- **Fase corrente**: [`PRD-FASE-4.md`](./PRD-FASE-4.md). Todas as frentes **de produto** da Fase 4
  estao executadas e mergeadas — a F-Sprint 23 fechou a ultima em 2026-08-05, em `develop` **e**
  `main`, esgotando o recorte web. A Fase 5 esta **inteiramente gated** por acesso externo (Celcoin,
  AWS, contas de loja) e nao tem frente executavel.
- **Spec/step ativo**: **tres sprints de divida planejadas em 2026-08-05**, a executar **nesta
  ordem**. Sao a unica frente executavel sem nenhuma API externa:
  1. **D-Sprint 1** — divida de dependencias (`sep-app` + `sep-mobile`). Spec
     [`300`](../specs/fase-4/300-dsprint-1-divida-dependencias-web-mobile.md), steps
     [`300`](../steps-fase-4/cross-repo/300-dsprint-1-steps.md). **Bloqueada no mobile** ate o
     back-merge do item 1 do §Proximo passo.
  2. **F-Sprint 24** — divida tecnica web. Spec
     [`124`](../specs/fase-4/124-fsprint-24-divida-tecnica-web.md), steps
     [`124`](../steps-fase-4/web/124-fsprint-24-steps.md).
  3. **Sprint 35** — divida de config/lockout/contrato no backend. Spec
     [`035`](../specs/fase-4/035-sprint-35-divida-config-lockout-contrato.md), steps
     [`035`](../steps-fase-4/backend/035-sprint-35-steps.md).

  **Comece pelo Gate D-1.0.** Cada sprint abre com um Gate que re-mede tudo e **invalida o
  planejamento se divergir** — inclusive o `npm audit` do `sep-mobile`, medido no planejamento em
  branch errada (ver §Onde estamos).
- **Aprendizado que vale carregar**: **documento nao substitui leitura do codigo.** A F-23 encontrou
  tres registros errados sobre a propria area que ia mexer — a §Autorizacao da spec 122 dizia que
  "nao ha mecanismo novo a criar" para o endpoint publico (ignorava o token velho e **presente**);
  este `STATE.md` e o `SEGURANCA.md` descreviam a consequencia como "cai de volta no texto fixo",
  quando o usuario e **arrancado da pagina** para `/login`; e a propria Decisao 7 dos steps da F-23
  justificava manter "30 minutos" no fallback com uma premissa que o teste da sprint contradizia.
  Os tres foram corrigidos na fonte. **O planejamento de 2026-08-05 repetiu a licao**: dois numeros
  deste arquivo estavam desatualizados a favor do problema (ver §Onde estamos).
- **Aprendizado que vale carregar**: **documento nao substitui leitura do codigo.** A F-23 encontrou
  tres registros errados sobre a propria area que ia mexer — a §Autorizacao da spec 122 dizia que
  "nao ha mecanismo novo a criar" para o endpoint publico (ignorava o token velho e **presente**);
  este `STATE.md` e o `SEGURANCA.md` descreviam a consequencia como "cai de volta no texto fixo",
  quando o usuario e **arrancado da pagina** para `/login`; e a propria Decisao 7 dos steps da F-23
  justificava manter "30 minutos" no fallback com uma premissa que o teste da sprint contradizia.
  Os tres foram corrigidos na fonte.
- **Segue valendo**: uma das cinco lacunas de OpenAPI estava **mal diagnosticada na spec**. O
  `Duration` do dashboard ja era documentado corretamente como `string` — o Spring Boot desliga
  `WRITE_DURATIONS_AS_TIMESTAMPS` e o fio leva ISO-8601 —, e quem diverge e o `sep-app`. Esse
  `knownGap` **permanece aberto de proposito** e fecha do lado web, fora do escopo da F-23.

## Onde estamos

- **Tres sprints de divida PLANEJADAS em 2026-08-05** — spec + steps criados para a **D-Sprint 1**
  (dependencias, cross-repo), a **F-Sprint 24** (web) e a **Sprint 35** (backend), nessa ordem de
  execucao. Nenhuma delas depende de credencial, provider real ou API externa; sao a resposta a
  "sobrou algo executavel?" depois que a Fase 4 esgotou o escopo de produto sobre fake. **Nada de
  codigo foi tocado** — o trabalho foi so de planejamento, em `docs-SEP`.
  O levantamento conferiu cada item **no codigo**, e **dois registros deste arquivo estavam
  desatualizados a favor do problema**: `estabilizar()` tem **39 definicoes byte-identicas** em
  `*.spec.ts` (o registro dizia "terceira copia" — subestimado em 36), e a constante
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
  **Vitest 765 / 94** (partida 745/91), `contract:check` **85 operacoes / 1 lacuna**, Playwright
  **39**, demais gates verdes — todos rodados **depois** dos commits, porque o `lint-staged`
  reescreve arquivos, e **reconferidos em `develop` pos-merge com `npm ci`**. **26 mutacoes**
  verificadas. O code review gerou hotfix de sete achados, tres
  deles premissa errada e nao descuido: `Number.isInteger` entregue sem teste que o cobrisse, o
  fallback com numero literal sendo o estado inicial de **toda** renderizacao, e dois comentarios que
  a propria sprint tornou falsos. **Gate declarado pendente**: smoke real contra `:8080` nao
  executado, entao o CORS do `Retry-After` e um eventual `429` na propria pagina seguem sem prova —
  o MSW nao consegue provar nenhum dos dois. Follow-ups nomeados em
  [`SPRINT-F-23-PR.md`](../repos/sep-app/SPRINT-F-23-PR.md), com destaque para o vetor ainda aberto:
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
  byte-identica a da branch verificada. Detalhe em
  [`SPRINT-34-PR.md`](../repos/sep-api/SPRINT-34-PR.md); historico em
  [`CONTEXT-PARTE-2.md`](./CONTEXT-PARTE-2.md) §Sprint 34.

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
  [`SPRINT-M-17-PR.md`](../repos/sep-mobile/SPRINT-M-17-PR.md); historico em
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
- **Fase 3 concluida tecnicamente em 2026-07-06**; **Fase 4 em execucao** (14 specs em
  [`specs/fase-4/`](../specs/fase-4/README.md); marco `v1.0-local`); **Fase 5 planejada**
  (Celcoin real, AWS, lojas) — [`PRD-FASE-5.md`](./PRD-FASE-5.md).

## Proximo passo

1. **Manual (dev humano) — back-merge `main` -> `develop` no `sep-mobile`.** E o **primeiro** item:
   destrava a metade mobile da D-Sprint 1 e e pre-requisito do Gate D-1.0. A divergencia **cresceu**
   desde 2026-07-31 e nao e mais so o `fast-uri`: `main` esta **7 commits a frente**, com seis PRs do
   Dependabot (#137 `@modelcontextprotocol/sdk`+`@angular/cli`, #126 `gradle/actions` 4->6, #129
   `@hono/node-server`+`@angular/cli`, #130 `immutable`, #132 `tar`, #133 `fast-uri`) alem da
   promocao da M-17 (#136). Diferenca em **3 arquivos** — `package-lock.json`, `package.json` e
   `.github/workflows/ci.yml` —, **nenhum arquivo de app**, mas quebra a invariante
   `develop` == `main` que o Gate da proxima sprint mobile confere. Ao fazer, rodar `npm ci` +
   `npm run format:check` local antes do push.
2. **Executar as tres sprints de divida, nesta ordem** — D-Sprint 1 -> F-Sprint 24 -> Sprint 35. Sao
   a unica frente executavel sem API externa; ver §Leia agora para os ponteiros de spec e steps.
   Cada uma comeca por um Gate que re-mede a baseline e **invalida o planejamento se divergir**.
   - **D-Sprint 1** (`sep-app` + `sep-mobile`): o `npm audit` do `sep-app` regrediu de 0 (F-Sprint 19)
     para **19 — 12 high e 7 moderate**, **identico em `develop` intocada**, entao e deriva por
     advisories novos contra deps existentes e nao regressao de codigo. Dez pacotes `@angular/*`
     diretos em high, incluindo *i18n XSS via event-handler attributes* e *Cache-Key Ambiguity no
     HttpTransferCache* (cross-request leak), mais `brace-expansion` DoS e `fast-uri` host confusion.
     Angular 20 em LTS ate 2026-11-28 (ADR 0018 adiou o 22), entao deve resolver com patch dentro do
     20.x — **subir major exige ADR novo**. O `sep-mobile` **nao tem baseline valida** (ver §Onde
     estamos). Alem de remediar, a sprint **instala o gate de `npm audit` no CI dos dois**, que hoje
     nao existe.
   - **F-Sprint 24** (`sep-app`): dois defeitos vivos — o `errorInterceptor` ainda arranca o usuario
     da `/account-locked` num `401`/`403` da consulta de politica, e o KPI do dashboard de backoffice
     renderiza `NaNmin` (o mock devolve `7200` e esconde). Leva o `contract:check` de **1 lacuna para
     0**, a primeira vez desde a F-19.
   - **Sprint 35** (`sep-api`): allowlist de proxy (hoje a origem do rate limit e escolhida pelo
     cliente), validacao de `LockoutProperties` no boot, `405` faltante, e codigo/config morto.
   - **`sep-api` fora do escopo de dependencias por decisao**: `build.gradle` nao tem plugin de scan
     nenhum, entao medir exigiria adicionar tooling. Follow-up nomeado, candidato a sprint propria.
3. **Decisao de rumo, depois das tres.** Fechar a Fase 4 preenchendo o §41 do
   [`PRD-FASE-4.md`](./PRD-FASE-4.md) (hoje em branco) com status, PRs, back-merges e as dividas
   aceitas — o recorte mobile do Epic 15 (Gate M-16.0) e o iOS do Epic 14 (M-14/M-15) entram como
   **adiados**, nao como pendencias em aberto. A Fase 5 so abre com acesso externo liberado.
4. **M-14 (iOS) e M-15 (biometria iOS)** aguardam gate externo de hardware macOS 13+ (ver
   §Gates externos). Enquanto ele nao abre, avaliar o fallback por runner CI macOS (spec 214.3.4)
   para validar o build iOS parcialmente sem hardware local; o smoke local segue obrigatorio pela
   spec e permanece preso ao gate.
5. **Opcional — `openapi.snapshot.meta.json` do `sep-app` referencia `f37ffc8`**, o tip da branch da
   Sprint 34, que deixa de resolver quando a branch for apagada. As arvores de `f37ffc8`, do squash
   `0d24602` e de `origin/develop` foram **conferidas identicas**, entao o snapshot continua fiel; e
   so a referencia que envelhece. Trocar por `0d24602` num commit de documentacao, se valer o ciclo
   de PR — o campo e documental e nenhum script o le.
6. **Follow-ups tecnicos abertos** (nao bloqueiam). **Boa parte desta lista ja esta recortada nas
   tres sprints do item 2** — o `NaNmin`/`tempoMedioResolucao30d`, o `forward-headers-strategy`, o
   `resilience4j` morto, o `ApiExceptionHandler` sem `405`, os enums inline, a `message` do `423`, o
   `ContaBloqueadaException.CODIGO`, o `countByIpAndJanela`, o `MDC.get` literal, o `Clock`
   injetavel, o `message: ""`, os 3 literais `login`/`verify-totp`, o `reprocessarWebhook`, o vetor
   do `errorInterceptor` na `/account-locked`, o `/auth/totp/verify` e o `estabilizar()` duplicado.
   **Seguem fora de qualquer sprint planejada**: controle compensatorio contra brute force lento
   (exige ADR), os 4 contratos ausentes da F-17, deteccao de `knownGap` obsoleto no
   `contract-check.mjs`, o rotulo "Criar conta", `idCurto`/`formatarMoeda` duplicados, Playwright
   fora do CI, e **todo o bloco mobile**. **Abertos pela Sprint 34**: `NaNmin` no KPI do
   dashboard backoffice do `sep-app` (`backoffice-format.ts` faz `Math.round` sobre `"PT2H"`; o mock
   MSW devolve `7200`, entao nenhum teste do front ve) e o `api.models.ts` declarando
   `tempoMedioResolucao30d: number` onde deveria ser `string`; `forward-headers-strategy: native`
   com `server.tomcat.remoteip.internal-proxies` no CIDR do balanceador (o allowlist de proxy que
   falta — hoje a origem e escolhida pelo cliente nos dois caminhos);
   `resilience4j.ratelimiter.configs.default` morto no `application.yml` (configura o registry do
   starter, que nada usa); `ApiExceptionHandler` sem handler de
   `HttpRequestMethodNotSupportedException`; enums saem inline no schema em vez de `$ref`; a
   `message` do `423` anuncia "30 minutos" enquanto o `Retry-After` traz o restante.
   **FECHADOS pela Sprint 34**: registrar tentativas `CONTA_BLOQUEADA`, tempo restante no `423`,
   evicção do mapa de limitadores, validador de startup da invariante, assert do audit na
   `LockoutLoginIT`, expor `lockout-minutes` no contrato e `X-Step-Up-Token` fora do OpenAPI.
   **Seguem abertos**: controle compensatorio contra brute force lento (exige ADR);
   `ContaBloqueadaException.CODIGO` morto; `countByIpAndJanela` sem consumidor; `MDC.get` literal no
   `RateLimitFilter`; `Clock` injetavel no `LockoutService`; os 4 contratos ausentes da F-17;
   deteccao de `knownGap` obsoleto no `contract-check.mjs`; rotulo "Criar conta" prometendo
   formulario e entregando pagina informativa; `idCurto` e `formatarMoeda` duplicados em 6 arquivos
   cada; Playwright fora do CI-APP. **Abertos pela F-Sprint 22** (web): `message: ""` apaga o alerta
   em `login.component.ts` e em `core/api/api-error.ts`; 3 literais byte-identicos entre `login` e
   `verify-totp`; `backoffice.reprocessarWebhook` ramifica `400` que o OpenAPI nao documenta; ~20
   pontos de ramificacao por status ainda sem `erros`. **Abertos pela F-Sprint 23** (web): a `/account-locked` **ainda pode se autodestruir por outro
   vetor** — a cadeia e `clientChannel -> auth -> stepUp -> error`, entao o `errorInterceptor` roda
   antes do `catchError` do servico e um `401`/`403` na consulta da politica navega para fora **sem
   depender de header nenhum** (web novo contra backend sem a Sprint 34 ja basta); as assercoes de
   copy colada em `account-locked.component.spec.ts` quebram com reformatacao pura de template;
   `/auth/totp/verify` e `permitAll` e **nao** esta isento no `authInterceptor`, entao leva
   `Authorization` morto e o usuario perde o desafio de MFA; `ehUtilizavel` e tudo-ou-nada
   (`windowMinutes = 0` derruba os tres numeros, e `LockoutProperties` nao tem `@Min`); no mock o
   `Retry-After` coincide byte a byte com a `message`, entao "o header ganha do corpo" e inobservavel
   offline; `estabilizar()` e a terceira copia do helper no repo. **Abertos pela M-Sprint 17** (mobile):
   `/session-expired` nao move foco; `onboarding-shell.iniciar()` sem guarda de reentrancia (e e
   MUTACAO); `setup-biometric` sem `h1`; `home.page.html` orfa com `ion-header` dentro do
   `ion-content`; `paginaAtiva`/`enableMsw` duplicados; nenhuma tela de desfecho tem `aria-live`;
   `verify-totp` sem teste de `precisaRedefinirSenha` nem de duplo-submit; `resetAuthMockState()`
   sem chamador. **Seguem abertos no mobile**: plugar o MSW no Vitest; `focusManagerPriority` global
   (exige ADR); ausencia de `contract:check`; Playwright fora do `CI-MOBILE`; `README.md` dizendo
   "Vitest 2" com o repo em Vitest 3; escopo adiado pelo Gate M-16.0.

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
