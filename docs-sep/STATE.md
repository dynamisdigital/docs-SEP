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

_Atualizado em: 2026-07-30._

## Leia agora

- **Fase corrente**: [`PRD-FASE-4.md`](./PRD-FASE-4.md). Backend (Sprints 27-33) e web (F-16 a F-21)
  fechados e mergeados; mobile **M-13 e M-16 mergeadas**; **M-14 (iOS) e M-15 (biometria iOS) bloqueadas por gate
  externo de hardware macOS** (ver §Gates externos). O **par corretivo de lockout** aberto em
  2026-07-29 esta **fechado nos dois lados e mergeado**: Sprint 33 backend (PR #101/#102) e
  F-Sprint 21 web (PR #113/#114). A divida acumulada virou **tres sprints planejadas em 2026-07-30 e
  ainda nao iniciadas**: **Sprint 34 (backend)**, **F-Sprint 22 (web)** e **M-Sprint 17 (mobile)** — as
  frentes executaveis restantes da Fase 4. A M-17 **nao depende de nenhuma das outras duas**. Depois
  delas, a decisao e de rumo: fechar a Fase 4 (§41 do PRD-FASE-4, ainda em branco) ou abrir a Fase 5.
- **Spec/step ativo**: **Sprint 34 (backend) — planejada, nao iniciada**. Spec
  [`034`](../specs/fase-4/034-sprint-34-followups-lockout-contrato.md) + steps
  [`034`](../steps-fase-4/backend/034-sprint-34-steps.md); branch sugerida
  `feature/sprint-34-followups-lockout-contrato`. Quita os cinco follow-ups backend da Sprint 33 e as
  cinco lacunas de OpenAPI que o `contract:check` do `sep-app` carrega como `knownGaps` desde a
  F-Sprint 19 (2026-07-16). **Com migration** (`V60`, amplia `chk_audit_seguranca_tipo`); sem estado
  novo, sem ADR. Sem escopo de produto novo. O par web e a **F-Sprint 22**, spec
  [`122`](../specs/fase-4/122-fsprint-22-contrato-erro-followups-web.md) + steps
  [`122`](../steps-fase-4/web/122-fsprint-22-steps.md), tambem planejada e nao iniciada; **suas Tasks 1
  a 5 nao dependem da 34** e podem rodar em paralelo.

## Onde estamos

- **M-Sprint 17 (mobile) PLANEJADA em 2026-07-30 — nao iniciada, e sem dependencia nenhuma.** Spec
  [`217`](../specs/fase-4/217-msprint-17-followups-lockout-a11y-mobile.md) + steps
  [`217`](../steps-fase-4/mobile/217-msprint-17-steps.md). Seis tasks, quatro defeitos independentes:
  (a) **a jornada de conta bloqueada e inalcancavel e nao testada** — o mock nunca produz `423`
  (`handlers.ts:46-62`), e embora o mobile **ja trate `423` em tres camadas** (login, verify-totp,
  `errorInterceptor`), **nenhuma tem teste**; `verify-totp` e `account-locked` nao tem spec;
  (b) a race de duplo toque em `consultarStatusPix` existe em **dois** componentes
  (`portfolio-detail:130` e `parcela-detail:138`), nao um — o molde do fix e o teste por mutacao ja
  vieram prontos da M-16; (c) **landmark `main` duplicado**: o `ion-content` do Ionic ja e
  `role="main"` e 4 telas aninham um `<main>` dentro dele — problema **inverso** ao do web, onde
  faltava landmark; (d) o smoke `golden-path-mobile` esta vermelho **desde a M-4** (nao desde a M-13,
  como este arquivo registrava): sao 3 causas — seletor `/cadastr/i` que nunca casou com o CTA "Criar
  conta", MSW nao ativado e senha do fixture violando a politica. **Fora de escopo**: plugar o MSW no
  Vitest, `focusManagerPriority` global, portar o `contract:check` e o escopo do Gate M-16.0 (exige
  ADR) — todos registrados como follow-up. Baseline medida: Vitest **503 / 68 arquivos**, Playwright
  **27 (26 passam, 1 falha)**.
- **F-Sprint 22 (web) PLANEJADA em 2026-07-30 — nao iniciada.** Par web da Sprint 34, tambem de
  divida. Seis tasks. O item de maior valor nao e de tela: **`consumed-contracts.json` declara as 85
  operacoes com `sucesso: [200]` e nenhum status de erro, e o `contract-check.mjs` so inspeciona
  sucesso** — se o backend removesse o `423`, o `contract:check` passaria verde e a jornada de conta
  bloqueada voltaria a quebrar em silencio. O checker tambem **nao detecta `knownGap` obsoleto**: os
  quatro predicados `existeGap*` sao `.some()` puros, e o `knownGaps[0]` (`X-Step-Up-Token`,
  `appliesTo: "*"`) produz sozinho 18 das 29 lacunas do output. As outras frentes sao os follow-ups da
  F-21: `verify-totp` com o mesmo callback de erro pelado que o login tinha (**e sem nenhuma cobertura
  — sem spec, sem e2e, sem handler MSW de TOTP**), foco em `access-denied` (que ja tem landmark; o gap
  e so foco), landmark em `verify-totp` e `redirect-to-app`, remocao dos 4 arquivos orfaos do
  `RegisterComponent` e consolidacao da extracao de mensagem de erro, hoje duplicada em **7 helpers /
  56 chamadas** mais 9 sites inline. **Os 3 links "Criar conta" ficam** — levam ao
  `RedirectToAppComponent` por decisao da Sprint 5 e sao travados por spec e e2e; o codigo morto e o
  componente, nao a rota. A **Task 6 tem gate na Sprint 34** (mergeada + snapshot regenerado): consome
  `politica-lockout` e `Retry-After`. Baseline de partida: Vitest 685/88, Playwright 38/11.
- **Sprint 34 (backend) PLANEJADA em 2026-07-30 — nao iniciada.** Sprint de divida,
  nao de produto: consome os follow-ups que a 33 e a F-21 registraram e as lacunas de OpenAPI abertas
  pela F-19. Sete tasks: observabilidade da tentativa barrada (hoje **nenhuma tentativa contra conta
  bloqueada deixa rastro**, porque `verificar()` lanca antes de `registrar(...)`) com tipo de audit
  proprio e migration `V60`; `detalhes` do audit serializado em vez de concatenado (defeito — o
  `username` vem da request e a coluna e `jsonb`); `Retry-After` no `423` com o tempo **restante**, ja
  disponivel em `PoliticaLockout.eventoDeBloqueio` e hoje descartado; validador de startup da
  invariante `rate-limit > max-attempts` (so os defaults sao cobertos hoje) e evicção do
  `RateLimiterRegistry`; `GET /api/v1/auth/politica-lockout` publico, para `/account-locked` parar de
  fixar "30 minutos"; e as cinco lacunas de OpenAPI (`X-Step-Up-Token` em 24 endpoints via
  `OperationCustomizer`, `Duration` como number, enums de contrato/assinatura, headers de resposta do
  documento assinado), travadas por regressao no `OpenApiConfigTest`. **Fora de escopo**: controle
  compensatorio contra brute force lento (exige ADR; risco aceito em 2026-07-29) e os 4 contratos
  ausentes da F-17 (feature, nao divida). O gate de fechamento toca o `sep-app` apenas em
  `contracts/`: reexportar o snapshot e apagar os `knownGaps` fechados — sem isso a divida nao fecha,
  porque o `knownGaps[0]` usa `appliesTo: "*"` e silencia o `X-Step-Up-Token` em **18 endpoints**.
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
  preexistente da M-13), audit 0, build e `cap sync android` OK; `gradlew assembleDebug` roda no
  job CI `Build Android (debug)` (a maquina de dev nao tem Android SDK). Escopo adiado
  (matching, aporte POST, chaves Pix) **preservado como registro** na spec 216 e nos steps 216;
  reativar exige ADR + revisao da spec ou backend que admita a credora dona. Follow-up:
  `consultarStatusPix` (M-11.4, ja em `main`) tem a mesma race condition de duplo toque corrigida
  aqui nos aportes. Detalhe em
  [`SPRINT-M-16-PR.md`](../repos/sep-mobile/SPRINT-M-16-PR.md).

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

1. **Sprint 34 (backend)** (planejada em 2026-07-30, **nao iniciada**): spec
   [`034`](../specs/fase-4/034-sprint-34-followups-lockout-contrato.md) + steps
   [`034`](../steps-fase-4/backend/034-sprint-34-steps.md). Comecar pelo **Gate 34.0** (cadeia Git,
   baseline de **2173 testes** e reconfirmacao do estado levantado) antes de qualquer Task. Sete
   tasks, uma migration (`V60`), sem ADR.
2. **F-Sprint 22 (web)** (planejada em 2026-07-30, **nao iniciada**): spec
   [`122`](../specs/fase-4/122-fsprint-22-contrato-erro-followups-web.md) + steps
   [`122`](../steps-fase-4/web/122-fsprint-22-steps.md). **Independente da 34 nas Tasks 1 a 5** — pode
   rodar em paralelo ou antes. O **Gate F-22.0 exige destravar o Playwright na maquina de dev**
   (`chromium_headless_shell-1228` ausente; `test-results/`, `playwright-report/` e
   `node_modules/.vite-temp` root-owned), senao a baseline de 38 e2e nao e verificavel — e o CI **nao**
   roda Playwright.
3. **M-Sprint 17 (mobile)** (planejada em 2026-07-30, **nao iniciada**): spec
   [`217`](../specs/fase-4/217-msprint-17-followups-lockout-a11y-mobile.md) + steps
   [`217`](../steps-fase-4/mobile/217-msprint-17-steps.md). **Sem dependencia** — pode rodar a qualquer
   momento, em paralelo com a 34 e a F-22. O **Gate M-17.0 exige remover
   `node_modules/.vite-temp`** (root-owned apos execucao em container; o Vitest aborta com `EACCES`
   antes de rodar qualquer teste) e **anotar sem corrigir** o vermelho preexistente do
   `golden-path-mobile`, que e a Task M-17.6.
4. **Manual (dev humano) — commitar `docs-SEP`**: criacao das specs/steps 034, 122 e 217 e as
   atualizacoes de indice deste ciclo (`specs/fase-4/README.md`, `PRD-FASE-4.md` §36 — que **tambem ganhou a linha
   da Sprint 33, ausente ate agora** —, `AI-ROADMAP.md` e este arquivo). As descricoes de PR
   `SPRINT-33-PR.md` e `SPRINT-F-21-PR.md` foram removidas no ciclo padrao de abertura de sprint,
   junto com as referencias a elas. `repos/sep-mobile/SPRINT-M-16-PR.md` segue pendente de remocao
   (M-16 mergeada em 2026-07-20).
5. **Decisao de rumo** (depois das tres sprints de divida — 34, F-22 e M-17; fora delas so restam os
   gates externos). Duas opcoes, ambas legitimas:
   - **fechar a Fase 4** preenchendo o §41 do PRD-FASE-4 (hoje em branco) com status, PRs,
     back-merges e as dividas aceitas — o recorte mobile do Epic 15 (Gate M-16.0) e o iOS do
     Epic 14 (M-14/M-15) entram como adiados, nao como pendencias em aberto; ou
   - **abrir a Fase 5** ([`PRD-FASE-5.md`](./PRD-FASE-5.md)) nas frentes que nao dependem de
     credencial Celcoin, conta AWS ou conta de loja.
6. **M-14 (iOS) e M-15 (biometria iOS)** aguardam gate externo de hardware macOS 13+ (ver
   §Gates externos). Enquanto ele nao abre, avaliar o fallback por runner CI macOS (spec 214.3.4)
   para validar o build iOS parcialmente sem hardware local; o smoke local segue obrigatorio pela
   spec e permanece preso ao gate.
7. **Follow-ups tecnicos abertos** (nao bloqueiam). **Absorvidos pela Sprint 34** (backend, ainda nao
   executada): registrar tentativas `CONTA_BLOQUEADA`, tempo restante no `423`, evicção do
   `RateLimiterRegistry`, validador de startup da invariante `rate-limit > max-attempts`, assert do
   audit `LOCKOUT` na `LockoutLoginIT`, expor `lockout-minutes` no contrato e `X-Step-Up-Token` fora
   do OpenAPI (`knownGaps[0]`). **Absorvidos pela F-Sprint 22** (web, ainda nao executada):
   `verify-totp.component.ts` com o mesmo callback de erro pelado que o login tinha, gap de foco em
   `access-denied.component.ts` (que **ja tem landmark** — a redacao anterior deste item estava
   errada), landmark ausente em `verify-totp` e `redirect-to-app`, `RegisterComponent` como codigo
   morto e `contract:check` sem opiniao sobre status de erro. **Seguem abertos**: controle
   compensatorio contra brute force lento (exige ADR); rotulo "Criar conta" prometendo formulario e
   entregando pagina informativa (UX, nao defeito); auto-cadastro web descontinuado na Sprint 5;
   `idCurto` e `formatarMoeda` duplicados em 6 arquivos cada (o segundo com **duas assinaturas**);
   Playwright fora do CI-APP. **Absorvidos pela M-Sprint 17** (mobile, ainda nao executada): mock do
   `sep-mobile` sem `423` e as tres camadas de `423` sem teste; race condition de duplo toque em
   `consultarStatusPix` nos **dois** componentes; `<main>` aninhado dentro do `ion-content`; foco nos
   destinos de redirect; smoke `golden-path-mobile`. **Seguem abertos no mobile**: plugar o MSW no
   Vitest; `focusManagerPriority` global no `provideIonicAngular()`; ausencia de `contract:check` no
   `sep-mobile`; Playwright fora do `CI-MOBILE`; `README.md` do `sep-mobile` dizendo "Vitest 2" com o
   repo em Vitest 3;
   escopo mobile adiado pelo Gate M-16.0 (matching, aporte POST, chaves Pix) registrado na spec 216.

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
