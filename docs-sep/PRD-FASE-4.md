# PRD - Fase 4 - Conclusao de jornadas, integracoes reais e preparacao de go-live

> Extraido de `PRD.md` para reduzir o tamanho do documento principal. As epics 10-17 e o
> mapeamento da Fase 3 estao em [`PRD-FASE-3.md`](./PRD-FASE-3.md).

Este arquivo detalha o planejamento da Fase 4. A Fase 4 parte da Fase 3 concluida tecnicamente em
2026-07-06 e nao introduz epics novos: ela **completa o escopo remanescente e avancado** dos Epics
13 (Frontend de Jornadas), 14 (Mobile SEP) e 15 (Movimentacao Pix), **planeja** o Epic 16
(Infraestrutura AWS) sem provisionar e **salda quatro dividas aceitas** herdadas da Fase 3.

O corte de entrega da Fase 4 e o ma
rco **`v1.0-local`** (§37): produto inteiro funcionando em
ambiente local com providers Fake/WireMock, "tudo menos AWS e Celcoin". Os dois gates externos que
sobram (credenciais Celcoin/BaaS e conta AWS), a integracao real fim-a-fim, a publicacao em lojas e
o go-live de producao sao o escopo da **Fase 5** ([`PRD-FASE-5.md`](./PRD-FASE-5.md)).

## 32. Ponto de partida

Ao encerrar a Fase 3 (ver [`PRD-FASE-3.md`](./PRD-FASE-3.md) §31 e
[`CONTEXT-PARTE-2.md`](./CONTEXT-PARTE-2.md) §Fechamento da Fase 3):

- os tres repos (`sep-api`, `sep-app`, `sep-mobile`) entregaram o escopo funcional planejado; a
  M-Sprint 11 foi promovida a `main` (PR #112) e os back-merges `main -> develop` foram feitos
  localmente;
- **Epic 13 (web)** teve primeira entrega: onboarding, credito/Open Finance, formalizacao, cobranca,
  backoffice/financeiro, credora, governanca e Pix web (F-Sprints 6-15);
- **Epic 14 (mobile)** teve primeira entrega para tomador e credora, validada em **PWA/browser**
  (M-Sprints 6-12); empacotamento nativo Android/iOS e biometria nativa nao foram feitos;
- **Epic 15 (Pix)** teve o backend concluido (desembolso, recebimento, conciliacao — Sprints 19-21)
  e a visibilidade owner-scoped no web e no mobile (F-13, Sprint 26, M-11); provedores rodam com
  **Fake + WireMock**, sem adapter real; aporte real da credora, matching e capacidades avancadas de
  Pix ficaram explicitamente posteriores;
- **Epic 16 (AWS)** recebeu apenas o incremento de Observabilidade MVP (Sprint 22); nao existe conta
  ou ambiente AWS provisionado.

**Gate de ambiente**: nao ha conta AWS aprovada nem credenciais Celcoin/BaaS de producao liberadas.
Por isso, nesta Fase 4, integracoes externas reais e infraestrutura remota permanecem **planejadas e
condicionadas (gated)**; nao ha provisionamento nem integracao real fim-a-fim ate aprovacao
explicita. O banco oficial continua PostgreSQL local via Docker Compose.

## 33. Objetivos da Fase 4

1. Fechar as pendencias de jornada que bloqueiam a completude funcional do produto (Epic 13/14).
2. Avancar o Epic 15 para as capacidades financeiras posteriores (aporte real da credora, matching e
   recorte inicial de Pix avancado), preparando a substituicao dos fakes por adapters reais quando
   houver credenciais.
3. Levar o Epic 14 do estagio PWA para **empacotamento nativo** (Android/iOS via Capacitor) com
   biometria nativa.
4. Produzir o **planejamento de infraestrutura AWS** (Epic 16) pronto para execucao assim que a
   conta for aprovada, sem provisionar recursos agora.
5. Saldar as quatro dividas aceitas da Fase 3, incluindo o **bloqueio de go-live** de step-up
   estrito server-side.

## 34. Fora de escopo

- provisionamento real de AWS (EC2, RDS, IAM, SNS, alarmes) e deploy remoto de producao — dependem
  de conta aprovada e entram em execucao em fase/gate posterior;
- integracao real fim-a-fim com Celcoin/BaaS em producao — depende de credenciais aprovadas;
- novas jornadas mobile alem de tomador e empresa credora (financeiro interno, backoffice,
  administracao completa e auditoria continuam fora do app);
- automacao ampla de Pix com minima intervencao humana; o recorte avancado desta fase permanece
  assistido/controlado;
- troca de stack (Tailwind, shadcn, Radix, React) ou upgrade de major (ex.: Angular 22) sem ADR e
  aprovacao explicita;
- microservicos: o backend continua monolito modular DDD nesta fase.

## 35. Frentes da Fase 4

### Epic 13 (continuacao) - Conclusao das jornadas web

**Status de partida**: primeira entrega concluida na Fase 3 (F-Sprints 6-15).

- fechar a **renegociacao do tomador no web** (`sep-app`), gap deixado na F-Sprint 9 por dependencia
  de backend; o backend ja expoe a leitura owner-scoped de renegociacao ativa (Sprint 24, `GET
  /parcelas/{id}/renegociacao-ativa`) e a decisao com step-up, replicando o padrao ja entregue no
  mobile (M-9.5);
- aprofundar a jornada financeira/conciliacao no web quando houver gap identificado contra os
  contratos das Sprints backend 12-14, 20-21;
- fechar pendencias residuais de UI das jornadas ja entregues.

**Exclusoes**: nao reabre regra de negocio (permanece no backend); nao expande o escopo de perfis
mobile.

**Dependencias/gates**: backend das Sprints 23-26 ja mergeado; sem gate externo.

### Epic 14 (continuacao) - Empacotamento nativo mobile

**Status de partida**: jornadas de tomador e credora entregues e validadas em PWA/browser
(M-Sprints 6-12).

- gerar builds **nativos Android e iOS** via Capacitor 8 a partir do app PWA existente, sem trocar a
  stack (`Angular 20.x + Ionic 8.4+ + Capacitor 8`);
- substituir o **stub PWA de biometria** por biometria nativa (Capacitor), preservando o fluxo de
  MFA/step-up ja implementado;
- hardening mobile especifico de plataforma nativa (permissoes, deep links, armazenamento seguro).

**Exclusoes**: sem novas jornadas funcionais; sem publicacao em lojas (App Store/Play) nesta fase,
salvo decisao explicita.

**Dependencias/gates**: **ADR reformalizando a baseline Capacitor 8** (substitui o ADR 0003 nominal
Capacitor 6) antes da fase nativa; ambientes de build nativo (Android SDK / Xcode).

### Epic 15 (continuacao) - Aporte real, matching e Pix avancado

**Status de partida**: backend de desembolso/recebimento/conciliacao concluido; provedores em Fake +
WireMock; aporte, matching e Pix avancado posteriores.

- **aporte real da credora + escrow**: modelar e expor a movimentacao financeira real da credora
  para a operacao financiada, consumindo o modulo `escrow` (peca diferida do Epic 10, que dependia
  do Epic 15 e de decisao de produto);
- **matching credora <-> operacao**: evoluir a associacao hoje assistida por admin para um recorte
  de matching com regras explicitas, mantendo controle operacional;
- **recorte inicial de Pix avancado**: priorizar entre split Pix, gestao avancada de chaves e Pix
  automatico apenas o recorte aprovado por produto; automacao ampla continua fora de escopo;
- **adapters Celcoin/BaaS — skeleton apenas**: escrever o esqueleto dos adapters reais (KYC/PLD,
  assinatura, Pix, escrow) cobertos por WireMock, mantendo o Provider Pattern e o Fake como default;
  a **ativacao e a validacao E2E real ficam na Fase 5** (dependem de credenciais de producao). Nesta
  fase nenhum adapter real e ligado.

**Exclusoes**: sem automacao ampla sem intervencao humana; sem ativar adapter real sem credencial
aprovada (ativacao vai para a Fase 5); movimentacao financeira real (dinheiro de verdade) so e
validada na Fase 5 — nesta fase aporte/matching/Pix avancado rodam sobre provider fake.

**Dependencias/gates**: **decisao de produto** sobre o recorte de aporte/matching e de Pix avancado;
**credenciais Celcoin/BaaS** para qualquer integracao real; ADRs candidatos de aporte/escrow real e
de estrategia de Pix avancado.

### Epic 16 - Infraestrutura AWS (documento de planejamento; execucao na Fase 5)

**Status de partida**: apenas Observabilidade MVP (Sprint 22); sem conta/ambiente AWS.

Nesta Fase 4 o Epic 16 entrega **apenas o documento de planejamento executavel** (sem provisionar);
o provisionamento e o deploy remoto sao a Fase 5 (ver [`PRD-FASE-5.md`](./PRD-FASE-5.md)). Entregar:

- arquitetura de ambientes remotos: EC2 para aplicacao, RDS for PostgreSQL fora da EC2, regiao
  recomendada `sa-east-1`; `aws-develop`/homologacao em EC2 compartilhada com RDS separados e
  producao com EC2/RDS proprios;
- estrategia de **secrets, rollback, backup, migrations Flyway e controle de acesso** para deploy
  remoto;
- **CI/CD de deploy** (GitHub Actions) partindo dos templates em `docs-sep/ci-pipelines/`, com deploy
  manual documentado em ambiente nao produtivo como primeiro passo;
- IAM, SNS e alarmes desenhados, prontos para materializacao quando a conta existir.

**Exclusoes**: nenhum recurso AWS criado; nenhum custo incorrido; deploy remoto de producao continua
gated por estrategia aprovada.

**Dependencias/gates**: **conta/ambiente AWS aprovado** para qualquer execucao; ADR de deploy/secrets
AWS.

### Follow-ups da Fase 3 (dividas aceitas)

1. **Step-up estrito server-side no aceite de contrato** (`sep-api`) — **FECHADO na Sprint 27**:
   `@RequireStepUpEstrito` aplicado ao aceite/cancelamento/assinatura de contrato e a proposta/aceite
   de renegociacao (sem bypass pre-MFA); 403 generico distinto do 409 de estado; ownership antes do
   estado na renegociacao. O bloqueio de go-live deixou de existir.
2. **Renegociacao do tomador no web** — ja detalhada no Epic 13 acima (rastreada aqui como divida
   aceita da F-Sprint 9).
3. **Extracao de portas de persistencia do modulo `cobranca`** (ADR 0007) — **FECHADO na Sprint
   28**: 14/14 use cases dependem de portas em `application.port.out` com adapters de delegacao
   pura em `infrastructure.adapter.persistence`; refactor 100% behavior-preserving (suite identica,
   1840 testes). Jobs/listeners seguem com repositories direto (fora do escopo da spec 028).
4. **Refresh da collection Postman + hardening de tooling** — atualizar a collection para `credores`
   e leituras Pix (congelada desde a Sprint 14) e reavaliar o hardening de tooling que exige
   Angular 22 (dez ocorrencias de audit exclusivas de tooling), condicionado a ADR de major.

## 36. Mapeamento Fase 4: Projetos x Sprints

Planejamento de alto nivel. Todas as sprints estao **planejadas** (nada implementado). Cada sprint
mantem no maximo 7 tasks de implementacao; precheck, E2E/smoke, documentacao e collections nao entram
na contagem. As **specs ja existem** em [`specs/fase-4/`](../specs/fase-4/README.md) (14 arquivos); os
**steps** continuam **just-in-time** em `steps-fase-4/{backend,web,mobile}/`, criados antes de cada
execucao. A numeracao continua a sequencia da Fase 3 (backend ate 26, web ate F-15, mobile ate M-12).

### Backend (`sep-api`)

| Sprint | Epic/frente | Tema | Spec | Status |
|--------|-------------|------|------|--------|
| 27 | Follow-up / go-live | Step-up estrito server-side no aceite de contrato (enforcement, remove bypass) | [`027`](../specs/fase-4/027-sprint-27-step-up-server-side-aceite.md) | concluida (PR #89 develop / #90 main, 2026-07-08) |
| 28 | Follow-up / refactor | Extracao de portas de persistencia do modulo `cobranca` (ADR 0007) | [`028`](../specs/fase-4/028-sprint-28-cobranca-portas-persistencia.md) | concluida (PR #91 develop / #92 main, 2026-07-08) |
| 29 | Epic 15 | Aporte da credora + escrow (foundation, assistido) | [`029`](../specs/fase-4/029-sprint-29-credora-aporte-escrow.md) | concluida (PR #93 develop, 2026-07-09 / #94 main, 2026-07-13) |
| 30 | Epic 15 | Matching credora <-> operacao (assistido) | [`030`](../specs/fase-4/030-sprint-30-credora-matching-operacao.md) | concluida (PR #95 develop / #96 main, 2026-07-13) |
| 31 | Epic 15 | Pix avancado — recorte inicial: gestao de chaves Pix (assistido) | [`031`](../specs/fase-4/031-sprint-31-pix-gestao-chaves.md) | concluida (PR #97 develop / #98 main, 2026-07-14) |
| 32 | Epic 15 / integracao | Skeleton dos adapters Celcoin/BaaS + WireMock (sem ativar; Fake segue default) | [`032`](../specs/fase-4/032-sprint-32-adapters-celcoin-skeleton.md) | concluida (PR #99 develop / #100 main, 2026-07-15; fecha o backend da Fase 4; ativacao real -> Fase 5) |

### Web (`sep-app`)

| Sprint | Epic/frente | Tema | Spec | Status |
|--------|-------------|------|------|--------|
| F-16 | Epic 13 | Renegociacao do tomador no web (fecha gap F-9) | [`116`](../specs/fase-4/116-fsprint-16-renegociacao-tomador-web.md) | concluida (PR #87/#88 + follow-up #89/#90, 2026-07-15) |
| F-17 | Epic 13 | Aprofundamento financeiro/conciliacao web (se houver gap) | [`117`](../specs/fase-4/117-fsprint-17-financeiro-conciliacao-web.md) | concluida (PR #92/#93, 2026-07-15; gap analysis: 2 gaps fechados nas divergencias Pix, 4 contratos ausentes registrados como follow-up backend) |
| F-18 | Epic 15/10 | Aporte e matching da credora no web (quando backend existir) | [`118`](../specs/fase-4/118-fsprint-18-aporte-matching-credora-web.md) | concluida (PR #94/#95, 2026-07-16; matching assistido + aporte idempotente com step-up estrito + leitura owner-scoped na carteira; Gate F-18.0: chaves Pix fora — destino web dedicado pos-F-19) |
| F-19 | Follow-up | Hardening de tooling + validacao de contrato (Postman/OpenAPI); avaliar Angular 22 via ADR | [`119`](../specs/fase-4/119-fsprint-19-hardening-tooling-contrato-web.md) | concluida (2026-07-16; em `develop` por push direto fast-forward — desvio aceito — e `main` via PR #96; `contract:check` + snapshot OpenAPI, audit 9->0 dentro do Angular 20, collections Postman/Insomnia renovadas sem PII/secrets, [ADR 0018](../adr/0018-avaliacao-angular-22-no-web.md) ADIA Angular 22 com revisao em 2026-09-30) |

### Mobile (`sep-mobile`)

| Sprint | Epic/frente | Tema | Spec | Status |
|--------|-------------|------|------|--------|
| M-13 | Epic 14 | Empacotamento nativo Android (Capacitor 8) + ADR baseline Cap 8 | [`213`](../specs/fase-4/213-msprint-13-empacotamento-nativo-android.md) | planejada |
| M-14 | Epic 14 | Empacotamento nativo iOS (Capacitor 8) | [`214`](../specs/fase-4/214-msprint-14-empacotamento-nativo-ios.md) | planejada |
| M-15 | Epic 14 | Biometria nativa (substitui stub PWA) + hardening nativo | [`215`](../specs/fase-4/215-msprint-15-biometria-nativa.md) | planejada |
| M-16 | Epic 14/15 | Aporte/matching e Pix avancado visiveis ao usuario (quando backend existir) | [`216`](../specs/fase-4/216-msprint-16-aporte-pix-avancado-mobile.md) | planejada (dep. backend 29-31 concluidas) |

**Decisoes de planejamento**:

- **Ordem por gate**: as sprints de follow-up de go-live (27) e refactor (28) precedem a evolucao do
  Epic 15, que depende de decisao de produto e credenciais.
- **Infra AWS (Epic 16)**: nesta fase e **apenas entregavel documental** (arquitetura + CI/CD de
  deploy); o provisionamento e o deploy remoto viram sprints executaveis na **Fase 5** apos a conta
  ser aprovada.
- **Adapters reais (Sprint 32)**: entrega so o skeleton + WireMock; a ativacao e a validacao real
  ficam na **Fase 5**.
- **Dependencias web/mobile -> backend**: as sprints de aporte/matching/Pix avancado no web e no
  mobile so executam apos os contratos backend correspondentes existirem em `develop`.
- **Mobile restrito**: mobile segue cobrindo apenas tomador e empresa credora; publicacao em lojas
  (Play/App Store) e Fase 5.
- **Steps just-in-time**: esta tabela cria o mapa; os steps sao criados antes de cada execucao.

## 37. Marco v1.0-local (feature-complete)

A Fase 4 fecha uma versao **`v1.0-local`**: o produto inteiro navegavel e testavel em ambiente local
(PostgreSQL em Docker Compose + providers Fake/WireMock), com todas as jornadas e capacidades
implementadas, restando **apenas dois gates** que dependem de acessos externos ainda nao liberados.
Este e o corte que permite "implementar tudo menos AWS e Celcoin".

### Definition of Done da v1.0-local

- Epic 13 web completo: renegociacao do tomador entregue; gaps de jornada financeira/conciliacao
  fechados.
- Epic 14 mobile empacotado nativo (Android/iOS) com biometria nativa; ADR Capacitor 8 aceito.
- Epic 15 completo **sobre provider fake**: aporte da credora + escrow, matching e recorte de Pix
  avancado implementados, testados e visiveis no web e no mobile; skeleton dos adapters reais
  Celcoin/BaaS escrito e coberto por WireMock, com Fake como default. **Pendencia rastreada
  (Gate F-18.0, 2026-07-16)**: aporte+matching visiveis no web desde a F-18; a visibilidade web do
  recorte de chaves Pix (Sprint 31) ficou fora da F-18 por decisao formal e exige sprint web
  dedicada pos-F-19 — este item NAO esta concluido.
- Epic 16 entregue como **documento de planejamento** (arquitetura AWS + CI/CD de deploy).
- Follow-ups da Fase 3 saldados: step-up estrito server-side no aceite (**fechado na Sprint 27** —
  bloqueio de go-live que **nao** depende de acesso externo eliminado), renegociacao web, portas de
  persistencia de `cobranca`, refresh da collection Postman + hardening de tooling (**fechado na
  F-19, 2026-07-16** — contract:check contra OpenAPI runtime, audit 0, collections alinhadas;
  Angular 22 adiado por ADR 0018).
- Suite verde nos tres repos (lint/scss/format, testes, build; smokes E2E/PWA); `main` e `develop`
  em paridade; audit de producao limpo.

### Gates residuais (unicos bloqueios de go-live que sobram)

1. **Credenciais Celcoin/BaaS** — sem elas, os adapters reais nao sao ligados e a movimentacao
   financeira real (KYC/PLD/assinatura/Pix/escrow/aporte) nao e validada fim-a-fim.
2. **Conta/ambiente AWS** — sem ela, nao ha provisionamento nem deploy remoto; a aplicacao roda so
   local.

Ambos os gates, mais a publicacao em lojas e a validacao de producao, sao o escopo da **Fase 5**
([`PRD-FASE-5.md`](./PRD-FASE-5.md)). A v1.0-local esta "pronta para go-live pendente apenas destes
acessos".

## 38. Gates e pre-requisitos

- **Credenciais Celcoin/BaaS de producao** — pre-requisito para qualquer integracao real (ativacao
  de adapters, na Fase 5); ate la, Fake + WireMock permanecem o padrao.
- **Conta/ambiente AWS aprovado** — pre-requisito para materializar o Epic 16; sem ele, apenas
  planejamento.
- **Decisao de produto** — recorte de aporte real, matching e de Pix avancado (split/chaves/
  automatico) antes das Sprints 29-31.
- **ADRs candidatos** (criados just-in-time na sprint que os exige):
  - reformalizacao da baseline **Capacitor 8** (substitui ADR 0003) — gate da fase nativa mobile;
  - **deploy/secrets AWS** — gate da execucao do Epic 16;
  - **aporte/escrow real e estrategia de Pix avancado** — gate das Sprints 29-31;
  - **major de tooling (ex.: Angular 22)** — gate do hardening da F-19, se adotado.

## 39. Regras de execucao

Herdadas do [`AGENT.md`](../AGENT.md) e do PRD-FASE-3 §26:

- implementacao em tarefas pequenas; ao final de cada task, parar em checkpoint pre-commit para
  revisao humana e testes locais;
- o agente informa no checkpoint: arquivos alterados, testes/build/lint executados e resultado,
  riscos/pendencias e mensagem de commit sugerida; aguarda comando explicito antes de `git add` e
  `git commit`;
- push e PR sao manuais; commits seguem Conventional Commits;
- revisao arquitetural a cada frente para confirmar fronteiras DDD e Provider Pattern;
- integracoes externas continuam isoladas por Provider Pattern, com Fake + WireMock ate credencial
  real aprovada;
- toda implementacao/refactor/review aplica as skills obrigatorias (`coding-guidelines`,
  `clean-code`, `design-patterns-java`) conforme AGENT.md.

## 40. Premissas

- o banco oficial continua PostgreSQL local em Docker Compose ate o marco AWS aprovado;
- o backend continua um unico Spring Boot (monolito modular DDD), banco unico;
- a baseline de stack permanece `Angular 20.x` (web e mobile), `Ionic 8.4+` e `Capacitor 8` no
  mobile; upgrade de major depende de ADR;
- o design system vigente e o [`New Design System Sep.md`](<./New Design System Sep.md>) no web e no
  mobile;
- integracao real e infraestrutura remota so avancam com credenciais/conta aprovadas; ate la, a Fase
  4 entrega jornadas, refactors, planejamento e recortes gated;
- este PRD e documento vivo: specs e steps da Fase 4 evoluem em `specs/fase-4/` e
  `steps-fase-4/` junto com a execucao.

## 41. Encerramento da Fase 4

_A preencher quando a fase for concluida (status, PRs, back-merges, itens adiados e dividas
aceitas), seguindo o padrao do PRD-FASE-3 §31. Ao fechar, confirmar que o marco `v1.0-local` (§37)
esta atingido e que restam apenas os dois gates externos, escopo da Fase 5._
