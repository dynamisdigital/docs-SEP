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

_Atualizado em: 2026-07-14._

## Leia agora

- **Fase corrente**: [`PRD-FASE-4.md`](./PRD-FASE-4.md).
- **Spec/step ativo**: Sprint 32 (backend) **implementada** na branch
  `feature/sprint-32-adapters-externos-skeleton` (8 commits) — spec
  [`032`](../specs/fase-4/032-sprint-32-adapters-celcoin-skeleton.md) + steps
  [`032`](../steps-fase-4/backend/032-sprint-32-steps.md). **Push, PR e merge sao manuais e estao
  pendentes.** Apos o merge, o recorte backend da Fase 4 fecha; seguem web F-16-19 e mobile
  M-13-16.

## Onde estamos

- **Sprint 32 (backend) IMPLEMENTADA em 2026-07-14** — consolidacao dos adapters externos
  skeleton (Epic 15 / integracao; fecha o recorte backend da Fase 4). Na branch
  `feature/sprint-32-adapters-externos-skeleton` (base `develop` == `main`, `7231a52`);
  push/PR/merge manuais pendentes. Hardening cirurgico dos 6 skeletons existentes (KYC/KYB/PLD,
  Clicksign — ADR 0013 preservado, Pix, escrow) **sem adapter novo, sem dominio/REST/migration e
  sem ativar nada real** (fake segue default). ADR 0017 (flags por ambiente) +
  `ProviderFlagsValidator` (fail-fast de flag antes dos singletons) + `ProviderRetryConfig`
  (retry so em falha transiente nas 6 instances — **fecha os follow-ups de retry-em-4xx das
  Sprints 11/19**) + correcoes de compliance (PLD malformado nao vira mais "sem hits") + fixtures
  WireMock reutilizaveis + profile opt-in `local-wiremock` + guards permanentes (fake default,
  fixtures sem host/segredo real, 1 bean por port). Doc operacional novo
  [`INTEGRACOES-PROVIDERS.md`](../repos/sep-api/INTEGRACOES-PROVIDERS.md) com matriz e
  **procedimento de ativacao gated da Fase 5**. PR description em
  [`repos/sep-api/SPRINT-32-PR.md`](../repos/sep-api/SPRINT-32-PR.md).
- **Sprint 31 (backend) MERGEADA em 2026-07-14** — gestao assistida de chaves Pix da conta
  operacional/escrow (Epic 15, recorte inicial de Pix avancado da Fase 4). Em `origin/develop`
  via PR #97 (squash `7231a52`; 11 commits absorvidos) e promovida a `main` via PR #98
  (`76aa3b6`); `develop` == `main`. `check` verde: **2102 testes** (baseline 1975).
  `POST/GET/DELETE /api/v1/pix/chaves` (`FINANCEIRO`/`ADMIN`; mutacoes com
  `@RequireStepUpEstrito` + `Idempotency-Key` no cadastro; GET read-only local sem step-up).
  Minimizacao total: persiste apenas hash SHA-256 + mascara (V58 — UNIQUEs de idempotencia e de
  chave ativa por valor + CHECK de coerencia); valor bruto nunca em resposta/erro/evento/audit/log.
  `PixProvider` evoluido (`cadastrarChave`/`removerChave`): fake default idempotente; skeleton
  Celcoin `POST/DELETE /pix/keys` coberto por WireMock (contrato local; validar na Fase 5).
  Cadastro serializado por advisory lock (corrida nao gera chave orfa no provider) e provider
  antes de persistir (falha externa nao cria estado); CPF/CNPJ com digito verificador; remocao
  logica `ATIVA -> INATIVA` serializada por `FOR UPDATE`. Auditoria
  `PIX_CHAVE_CADASTRADA`/`REMOVIDA` (V59) 1x por transicao, operador como sujeito. **Nenhum
  dinheiro movido; Sprints 19-21 intocadas.** Review manual pre-merge fechou 3 findings (P1
  chave orfa; P2 retencao no fake; P2 DV de CPF/CNPJ). PR description em
  [`repos/sep-api/SPRINT-31-PR.md`](../repos/sep-api/SPRINT-31-PR.md). **Desbloqueia o recorte
  Pix da M-Sprint 16 (mobile)**; visibilidade de chaves no web/mobile quando aplicavel (F-18/M-16).
- **Sprint 30 (backend) MERGEADA em 2026-07-13** — matching assistido credora-operacao (Epic
  15). Em `origin/develop` via PR #95 (squash `7bff870`; 11 commits absorvidos) e promovida a
  `main` via PR #96 (`07f0347`); back-merge `main -> develop` (`a173e5c`); `develop` == `main`.
  `check` verde: 1975 testes (inclui desarme de bomba de data pre-existente em cobranca que
  derrubava a CI em qualquer branch desde 2026-07-11). `GET /api/v1/credores/matching/sugestoes`
  (refresh-on-read idempotente, `FINANCEIRO`/`ADMIN`, sem step-up), `GET /{sugestaoId}` e
  `POST /{sugestaoId}/decisao` (`@RequireStepUpEstrito`; `CONFIRMAR|REJEITAR`). Estados
  `SUGERIDA -> CONFIRMADA|REJEITADA` (terminais; replay 409); elegibilidade explicita por
  validador puro (credora ATIVA+ELEGIVEL, operacao ASSOCIADA, contrato ASSINADO, valor da
  oportunidade, capacidade quando declarada, par sem matching previo — REJEITADA bloqueia
  re-sugestao); geracao por snapshot em lote (6 consultas fixas, `FOR UPDATE` deterministico,
  limite 200) sem N+1; V56 (UNIQUE parcial de par ativo) + V57; auditoria `CREDORA_MATCHING_*`
  1x por evento. **Nada e confirmado automaticamente; confirmacao nao cria aporte/Pix/escrow**
  (aporte segue Sprint 29). PR description em
  [`repos/sep-api/SPRINT-30-PR.md`](../repos/sep-api/SPRINT-30-PR.md). **Desbloqueia F-Sprint 18
  (web) e M-Sprint 16 (mobile) no recorte aporte+matching** (M-16 ainda depende da Sprint 31
  para o recorte Pix).
- **Sprint 29 (backend) MERGEADA em 2026-07-09 e promovida a `main`** — aporte assistido da
  credora + escrow fake (Epic 15). Em `origin/develop` via PR #93 (squash `3d10968`) e em
  `origin/main` via PR #94 (`d1f5f49`); `develop` == `main` na abertura da Sprint 30. `POST/GET
  /api/v1/credores/operacoes/{id}/aportes` (POST `FINANCEIRO`/`ADMIN` + `@RequireStepUpEstrito` +
  `Idempotency-Key`, 201/200 idempotente; GET owner-scoped sem step-up, 404 neutro), estados
  `PENDENTE -> EM_PROCESSAMENTO -> LIQUIDADO|FALHOU`, reconciliacao por use case interno (sem
  endpoint — escrow local; Fase 5 pluga webhook real), wallet creditada so na liquidacao,
  auditoria `CREDORA_APORTE_*` (V54/V55), concorrencia por `SELECT FOR UPDATE`. Nenhum dinheiro
  real; `EscrowProvider`/Celcoin intocados. 1906 testes verdes (`check`). Desbloqueia F-Sprint 18
  (aporte web) e M-Sprint 16 (aporte mobile).
- **Sprint 28 (backend) MERGEADA em 2026-07-08** — portas de persistencia do modulo `cobranca`
  (ADR 0007). Os 14 use cases dependem de portas em `application.port.out` (parcela, agenda,
  recebimento, renegociacao, evento) com adapters de delegacao pura em
  `infrastructure.adapter.persistence`; refactor 100% behavior-preserving (1840 testes, contagem
  identica a baseline; zero mudanca de endpoint/DTO/migration/regra). Jobs/listeners seguem com
  repositories direto (fora do escopo da spec 028). **Fecha o follow-up 3 da Fase 3.** Em
  `origin/develop` via PR #91 (`6a4f5d6`) e promovida a `main` via PR #92 (`1f111e2`);
  `develop` == `main`. PR description em [`repos/sep-api/SPRINT-28-PR.md`](../repos/sep-api/SPRINT-28-PR.md).
- **Sprint 27 (backend) MERGEADA em 2026-07-08** — abre a Fase 4. Step-up estrito server-side
  (`@RequireStepUpEstrito`, sem bypass pre-MFA) aplicado ao aceite/cancelamento/assinatura de
  contrato e a proposta/aceite de renegociacao; 403 generico distinto do 409 de estado; ownership
  antes do estado na renegociacao (sem vazar status/UUID a nao-dono). **Fecha o follow-up 1
  (bloqueio de go-live) da Fase 3.** Em `origin/develop` via PR #89 (squash `774c6ca`) e promovida
  a `main` via PR #90 (`fd66fdf`); `develop` == `main`. 1840 testes verdes, `check` + `bootJar` ok.
  PR description em [`repos/sep-api/SPRINT-27-PR.md`](../repos/sep-api/SPRINT-27-PR.md).
- **Fase 3 concluida tecnicamente em 2026-07-06**: escopo funcional entregue nos 3 repos; `develop`
  e `main` em paridade de conteudo em `sep-api`, `sep-app` e `sep-mobile` (back-merges locais feitos).
- **Fase 4 em execucao**: 14 specs em [`specs/fase-4/`](../specs/fase-4/README.md) (backend
  `027`-`032`, web `116`-`119`, mobile `213`-`216`). Corte de entrega = marco `v1.0-local` (tudo
  sobre providers Fake/WireMock; "tudo menos AWS e Celcoin"). Detalhe em
  [`PRD-FASE-4.md`](./PRD-FASE-4.md).
- **Fase 5 planejada** (fechamento gated): integracao real Celcoin, provisionamento AWS, publicacao
  em lojas e go-live de producao. Detalhe em [`PRD-FASE-5.md`](./PRD-FASE-5.md).

## Proximo passo

1. **Manual (dev humano)**: push da branch `feature/sprint-32-adapters-externos-skeleton`, abrir
   PR para `develop` (descricao em [`SPRINT-32-PR.md`](../repos/sep-api/SPRINT-32-PR.md)), merge
   e promocao a `main`; commit manual das mudancas de `docs-SEP`; apos o merge, atualizar este
   STATE ("IMPLEMENTADA" -> "MERGEADA") e o PRD-FASE-4 (Sprint 32 concluida — backend da Fase 4
   fechado).
2. Seguir a ordem da Fase 4: web F-16-19 (F-18 liberada pelo backend 29-30); mobile M-13-16
   (recortes aporte+matching+Pix liberados pelas Sprints 29-31). Ver dependencias em
   [`specs/fase-4/README.md`](../specs/fase-4/README.md).

## Gates externos pendentes (nao bloqueiam a Fase 4 sobre fake)

- **Credenciais Celcoin/BaaS** (sandbox e producao) — ativacao de adapters reais; escopo Fase 5.
- **Conta/ambiente AWS** — provisionamento e deploy remoto; escopo Fase 5.
- **Contas de loja** (Google Play, Apple Developer) — publicacao mobile; escopo Fase 5.

Ate os acessos existirem: banco PostgreSQL local via Docker Compose; providers em Fake + WireMock.

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
