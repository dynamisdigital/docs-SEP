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

_Atualizado em: 2026-07-16._

## Leia agora

- **Fase corrente**: [`PRD-FASE-4.md`](./PRD-FASE-4.md). Backend da Fase 4 **fechado**
  (Sprints 27-32 mergeadas); web F-16-19 mergeadas; seguem mobile M-13-16 e a sprint web
  dedicada de chaves Pix (Gate F-18.0).
- **Spec/step ativo**: F-Sprint 19 (web) **MERGEADA** (em `develop` por push direto
  fast-forward, tip `bb825e7` — 6 commits, sem PR/squash, desvio aceito pelo dev; promovida a
  `main` via PR #96, `01ccc52`; `develop` == `main` conferido por conteudo) — spec
  [`119`](../specs/fase-4/119-fsprint-19-hardening-tooling-contrato-web.md) + steps
  [`119`](../steps-fase-4/web/119-fsprint-19-steps.md); detalhe em
  [`SPRINT-F-19-PR.md`](../repos/sep-app/SPRINT-F-19-PR.md).
  Mobile M-13-16 liberadas pelos backends 29-31.

## Onde estamos

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
  em voo; P3 seed MSW sem credora inelegivel sugerida). **Gate F-18.0**: chaves Pix fora da
  F-18 — destino web dedicado pos-F-19; item do `v1.0-local` segue pendente (PRD-FASE-4
  §37). Vitest 562 + Playwright 31/31 (4 smokes novos; TOTP real e negacao de rota por URL
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

1. **Manual (dev humano)**: revisar e commitar as mudancas de `docs-SEP` (fechamentos F-18 e
   F-19: collections, ADR 0018, PRD/STATE/historico, docs).
2. Seguir a ordem da Fase 4 web/mobile: mobile M-13-16 (empacotamento nativo, biometria,
   aporte/matching/Pix — liberados pelas Sprints 29-31) e a sprint web dedicada de
   visibilidade de chaves Pix (decisao do Gate F-18.0; pendencia do `v1.0-local` no
   PRD-FASE-4 §37). Ver dependencias em [`specs/fase-4/README.md`](../specs/fase-4/README.md).

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
