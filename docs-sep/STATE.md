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

_Atualizado em: 2026-07-15._

## Leia agora

- **Fase corrente**: [`PRD-FASE-4.md`](./PRD-FASE-4.md). Backend da Fase 4 **fechado**
  (Sprints 27-32 mergeadas); web F-16 mergeada; seguem web F-17-19 e mobile M-13-16.
- **Spec/step ativo**: F-Sprint 17 (web) **MERGEADA** (PR #92 `develop`, squash `2dfa0fd` +
  PR #93 `main`, `8cae8f7`; `develop` == `main`) — spec
  [`117`](../specs/fase-4/117-fsprint-17-financeiro-conciliacao-web.md) + steps
  [`117`](../steps-fase-4/web/117-fsprint-17-steps.md). Proxima sprint web: **F-18**
  (spec [`118`](../specs/fase-4/118-fsprint-18-aporte-matching-credora-web.md);
  steps a criar; backends 29-31 ja mergeados).

## Onde estamos

- **F-Sprint 17 (web) MERGEADA em 2026-07-15** — aprofundamento financeiro/conciliacao
  (Epic 13). Em `origin/develop` via PR #92 (squash `2dfa0fd`; 3 commits absorvidos) e
  promovida a `main` via PR #93 (`8cae8f7`); `develop` == `main` (conferido por conteudo).
  Sprint dirigida por **gap analysis aprovado** (F-17.1):
  IMPLEMENTAR = painel de divergencias Pix com recorte de status enviado ao backend (default
  ABERTO) e contagens via `PageResponse.totalElements` com aviso de pagina parcial;
  JA_COBERTO = recebimentos manuais (F-9), jornada Pix (F-13), reprocessos/dashboard (F-10) —
  F-17.4 sem codigo; CONTRATO_AUSENTE (4 follow-ups backend registrados, nada simulado):
  paginacao/filtros em `GET /cobranca/recebimentos`, recebimentos por parcela p/ financeiro,
  listagem Pix por operacao/contrato, DTO consolidado server-side — F-17.3 sem codigo.
  Vitest 491 + Playwright 27/27 (novo smoke do filtro). Detalhe em
  [`SPRINT-F-17-PR.md`](../repos/sep-app/SPRINT-F-17-PR.md).
- **F-Sprint 16 (web) MERGEADA em 2026-07-15** — decisao de renegociacao do tomador
  (Epic 13; fecha o gap adiado na F-Sprint 9). Em `origin/develop` via PR #87 (squash
  `908c353`; 7 commits absorvidos) e promovida a `main` via PR #88 (`66ce8a7`);
  `develop` == `main`. `RenegociacaoTomadorResponse` (10 campos) +
  `consultarRenegociacaoAtiva` no `CobrancaService`; rota
  `/app/cobranca/parcelas/:parcelaId/renegociacao` + CTA so em `EM_NEGOCIACAO`; aceite com
  MFA pre-check + reconsulta + confirmacao explicita + step-up estrito (retorno nunca
  aceita automaticamente); recusa confirmada sem step-up (token preservado); matriz
  403/404/409/rede sem sucesso presumido (termos "desatualizados" bloqueiam decisoes ate
  nova leitura; reverificacao 403 so por gesto explicito). **Follow-up MERGEADO** via
  PR #89 (squash `d9f9733`) + #90: `57bcea6` reaplica o smoke Playwright (3 -> 6
  cenarios, F-16.6, que ficou fora do squash #87), `c90640e` fecha os 3 findings do
  review manual pos-merge (P1 supressao do redirect global de 403 via `HttpContextToken`
  `TRATA_403_LOCALMENTE` nos endpoints da decisao; P2 dialogo acessivel com
  foco/Escape/trap; P2 persona CLIENTE+MFA `tomador@empresa.com` nos smokes) e `5db67ad`
  alinha o comentario da tela. Gate: Vitest 487, lint, build, cobranca e2e 6/6. Aceite
  com TOTP real fica para o smoke real com backend :8080.
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

1. **Manual (dev humano)**: commit das mudancas de `docs-SEP` (fechamento da F-17).
2. Seguir a ordem da Fase 4 web/mobile: F-18 (aporte+matching credora, spec
   [`118`](../specs/fase-4/118-fsprint-18-aporte-matching-credora-web.md); steps a criar;
   liberada pelos backends 29-30 e avalia visibilidade de chaves Pix da Sprint 31), F-19;
   mobile M-13-16 (aporte+matching+Pix liberados pelas Sprints 29-31). Ver dependencias em
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
