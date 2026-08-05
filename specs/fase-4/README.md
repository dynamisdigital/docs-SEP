# Specs - Fase 4

Fase 4 completa o escopo remanescente dos Epics 13/14/15, planeja o Epic 16 (documento) e salda os
follow-ups de go-live da Fase 3. O corte de entrega e o marco `v1.0-local` (tudo menos AWS e Celcoin,
sobre providers Fake/WireMock). Escopo detalhado em [`../../docs-sep/PRD-FASE-4.md`](../../docs-sep/PRD-FASE-4.md).

As tabelas usam a ordem recomendada de execucao.

## Regras de planejamento

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
| 35 | [`035-sprint-35-divida-config-lockout-contrato.md`](./035-sprint-35-divida-config-lockout-contrato.md) | Allowlist de proxy (`forward-headers-strategy`), validacao de `LockoutProperties` no boot, `405` faltante, config e codigo morto, `Clock` injetavel e itens de contrato — **correcao de divida**; **planejada** (2026-08-05). Consome o numero 35, e o backend da Fase 5 renumerou para 36-39 | 7 |

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
| F-24 | [`124-fsprint-24-divida-tecnica-web.md`](./124-fsprint-24-divida-tecnica-web.md) | Vetor do `errorInterceptor` na `/account-locked`, `/auth/totp/verify` com `Authorization` morto, `message: ""` apagando alerta, `NaNmin` no KPI do dashboard, descriptor e duplicacoes de teste — **correcao de divida**; **planejada** (2026-08-05). Leva o `contract:check` de 1 lacuna para **0** | 7 |

## Mobile (`sep-mobile`)

| Sprint | Arquivo | Tema | Impl tasks |
|--------|---------|------|------------|
| M-13 | [`213-msprint-13-empacotamento-nativo-android.md`](./213-msprint-13-empacotamento-nativo-android.md) | Empacotamento nativo Android (Capacitor 8) + ADR baseline | 5 |
| M-14 | [`214-msprint-14-empacotamento-nativo-ios.md`](./214-msprint-14-empacotamento-nativo-ios.md) | Empacotamento nativo iOS (Capacitor 8) | 4 |
| M-15 | [`215-msprint-15-biometria-nativa.md`](./215-msprint-15-biometria-nativa.md) | Biometria nativa (substitui stub PWA) + hardening | 6 |
| M-16 | [`216-msprint-16-aporte-pix-avancado-mobile.md`](./216-msprint-16-aporte-pix-avancado-mobile.md) | Aporte/matching e chaves Pix na credora mobile — **concluida com escopo reduzido** (Gate M-16.0: so aportes owner-scoped; matching/aporte POST/chaves Pix adiados por exigirem `FINANCEIRO`) | 6 -> 3 |
| M-17 | [`217-msprint-17-followups-lockout-a11y-mobile.md`](./217-msprint-17-followups-lockout-a11y-mobile.md) | Jornada de conta bloqueada alcancavel e testada, race de duplo toque em `consultarStatusPix` (2 componentes), landmark `main` duplicado dentro do `ion-content` e recuperacao do smoke `golden-path-mobile` — **correcao de divida**; **concluida** (PR #135 develop / #136 main, 2026-07-31; suite e2e a 41 verdes / 0 falhas, o smoke estava vermelho desde a M-4; Vitest 527/70) | 6 |

## Cross-repo (`sep-app` + `sep-mobile`)

| Sprint | Arquivo | Tema | Impl tasks |
|--------|---------|------|------------|
| D-1 | [`300-dsprint-1-divida-dependencias-web-mobile.md`](./300-dsprint-1-divida-dependencias-web-mobile.md) | Remediar vulnerabilidades de dependencia `high`/`critical` nos dois repos front e instalar o gate de `npm audit` no CI, que hoje **nao existe em nenhum dos dois** — **correcao de divida de seguranca**; **planejada** (2026-08-05). Metade mobile bloqueada ate o back-merge `main` -> `develop` no `sep-mobile` | 5 |

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
- Gates externos (credenciais Celcoin, conta AWS, contas de loja) nao bloqueiam a implementacao
  destas sprints sobre fake; a ativacao real e a publicacao sao escopo da Fase 5
  ([`../../docs-sep/PRD-FASE-5.md`](../../docs-sep/PRD-FASE-5.md)).
