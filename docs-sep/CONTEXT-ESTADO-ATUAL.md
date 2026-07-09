# Contexto do Projeto SEP - Estado atual

> **Fonte unica do estado do projeto.** Leia este arquivo para saber onde estamos, o proximo passo
> e os gates pendentes. Fundacao (porque/como) esta em [`CONTEXT-PARTE-1.md`](./CONTEXT-PARTE-1.md);
> historico completo de execucao (log por sprint) esta em [`CONTEXT-PARTE-2.md`](./CONTEXT-PARTE-2.md)
> — grande, leia so sob demanda.
>
> **Convencao de manutencao**: ao fechar uma sprint, **sobrescreva** este arquivo (estado + proximo
> passo) e **apende** uma entrada curta no historico ([`CONTEXT-PARTE-2.md`](./CONTEXT-PARTE-2.md)).
> Mantenha este arquivo pequeno; ele nao duplica historico nem PRD, so aponta.

_Atualizado em: 2026-07-09._

## Onde estamos

- **Sprint 29 (backend) MERGEADA em 2026-07-09** — aporte assistido da credora + escrow fake
  (Epic 15). Em `origin/develop` via PR #93 (squash `3d10968`; 11 commits absorvidos); **NAO
  promovida a `main`** (main segue `1f111e2`/#92). `POST/GET
  /api/v1/credores/operacoes/{id}/aportes` (POST `FINANCEIRO`/`ADMIN` + `@RequireStepUpEstrito` +
  `Idempotency-Key`, 201/200 idempotente; GET owner-scoped sem step-up, 404 neutro), estados
  `PENDENTE -> EM_PROCESSAMENTO -> LIQUIDADO|FALHOU`, reconciliacao por use case interno (sem
  endpoint — escrow local; Fase 5 pluga webhook real), wallet creditada so na liquidacao,
  auditoria `CREDORA_APORTE_*` (V54/V55), concorrencia por `SELECT FOR UPDATE`. Nenhum dinheiro
  real; `EscrowProvider`/Celcoin intocados. 1906 testes verdes (`check`). PR description em
  [`repos/sep-api/SPRINT-29-PR.md`](../repos/sep-api/SPRINT-29-PR.md). Desbloqueia F-Sprint 18
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

1. **Sprint 30** (backend): matching assistido credora-operacao — spec
   [`030`](../specs/fase-4/030-sprint-30-credora-matching-operacao.md); steps just-in-time.
   Promocao da Sprint 29 a `main` fica a criterio da cadeia (hoje `develop` a frente de `main`).
2. Seguir a ordem da Fase 4: backend 30-32; web F-16-19; mobile M-13-16. Ver dependencias em
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
| Planejamento das fases | [`PRD.md`](./PRD.md) + `PRD-FASE-1..5.md` |
| Navegacao por tarefa/modulo | [`../AI-ROADMAP.md`](../AI-ROADMAP.md) |
| Regras operacionais para agentes | [`../AGENT.md`](../AGENT.md) |
