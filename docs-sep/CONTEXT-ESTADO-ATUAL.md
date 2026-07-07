# Contexto do Projeto SEP - Estado atual

> **Fonte unica do estado do projeto.** Leia este arquivo para saber onde estamos, o proximo passo
> e os gates pendentes. Fundacao (porque/como) esta em [`CONTEXT-PARTE-1.md`](./CONTEXT-PARTE-1.md);
> historico completo de execucao (log por sprint) esta em [`CONTEXT-PARTE-2.md`](./CONTEXT-PARTE-2.md)
> — grande, leia so sob demanda.
>
> **Convencao de manutencao**: ao fechar uma sprint, **sobrescreva** este arquivo (estado + proximo
> passo) e **apende** uma entrada curta no historico ([`CONTEXT-PARTE-2.md`](./CONTEXT-PARTE-2.md)).
> Mantenha este arquivo pequeno; ele nao duplica historico nem PRD, so aponta.

_Atualizado em: 2026-07-07._

## Onde estamos

- **Fase 3 concluida tecnicamente em 2026-07-06**: escopo funcional entregue nos 3 repos; `develop`
  e `main` em paridade de conteudo em `sep-api`, `sep-app` e `sep-mobile` (back-merges locais feitos).
- **Fase 4 planejada** (nada implementado): 14 specs em [`specs/fase-4/`](../specs/fase-4/README.md)
  (backend `027`-`032`, web `116`-`119`, mobile `213`-`216`). Corte de entrega = marco `v1.0-local`
  (tudo sobre providers Fake/WireMock; "tudo menos AWS e Celcoin"). Detalhe em
  [`PRD-FASE-4.md`](./PRD-FASE-4.md).
- **Fase 5 planejada** (fechamento gated): integracao real Celcoin, provisionamento AWS, publicacao
  em lojas e go-live de producao. Detalhe em [`PRD-FASE-5.md`](./PRD-FASE-5.md).
- **Sprint 27** ja tem steps prontos:
  [`steps-fase-4/backend/027-sprint-27-steps.md`](../steps-fase-4/backend/027-sprint-27-steps.md).

## Proximo passo

1. **Executar a Sprint 27** (backend): step-up estrito server-side no aceite de contrato e operacoes
   legais/financeiras equivalentes — aplica `@RequireStepUpEstrito` (ja existente); fecha o follow-up
   1 (bloqueio de go-live) da Fase 3.
2. Seguir a ordem da Fase 4: backend 28 (portas cobranca) e 29-32 (Epic 15 assistido + skeleton
   adapters); web F-16-19; mobile M-13-16. Ver dependencias em
   [`specs/fase-4/README.md`](../specs/fase-4/README.md).
3. Steps sao criados **just-in-time** antes de cada sprint.

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
