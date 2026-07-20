# Specs - Fase 4

Fase 4 completa o escopo remanescente dos Epics 13/14/15, planeja o Epic 16 (documento) e salda os
follow-ups de go-live da Fase 3. O corte de entrega e o marco `v1.0-local` (tudo menos AWS e Celcoin,
sobre providers Fake/WireMock). Escopo detalhado em [`../../docs-sep/PRD-FASE-4.md`](../../docs-sep/PRD-FASE-4.md).

As tabelas usam a ordem recomendada de execucao.

## Regras de planejamento

- Specs separados por projeto: backend (`0XX`), web (`1XX`) e mobile (`2XX`).
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

## Web (`sep-app`)

| Sprint | Arquivo | Tema | Impl tasks |
|--------|---------|------|------------|
| F-16 | [`116-fsprint-16-renegociacao-tomador-web.md`](./116-fsprint-16-renegociacao-tomador-web.md) | Renegociacao do tomador no web (fecha gap F-9) | 6 |
| F-17 | [`117-fsprint-17-financeiro-conciliacao-web.md`](./117-fsprint-17-financeiro-conciliacao-web.md) | Aprofundamento financeiro/conciliacao web | 6 |
| F-18 | [`118-fsprint-18-aporte-matching-credora-web.md`](./118-fsprint-18-aporte-matching-credora-web.md) | Aporte e matching da credora no web | 6 |
| F-19 | [`119-fsprint-19-hardening-tooling-contrato-web.md`](./119-fsprint-19-hardening-tooling-contrato-web.md) | Hardening de tooling + refresh contrato/collection | 5 |

## Mobile (`sep-mobile`)

| Sprint | Arquivo | Tema | Impl tasks |
|--------|---------|------|------------|
| M-13 | [`213-msprint-13-empacotamento-nativo-android.md`](./213-msprint-13-empacotamento-nativo-android.md) | Empacotamento nativo Android (Capacitor 8) + ADR baseline | 5 |
| M-14 | [`214-msprint-14-empacotamento-nativo-ios.md`](./214-msprint-14-empacotamento-nativo-ios.md) | Empacotamento nativo iOS (Capacitor 8) | 4 |
| M-15 | [`215-msprint-15-biometria-nativa.md`](./215-msprint-15-biometria-nativa.md) | Biometria nativa (substitui stub PWA) + hardening | 6 |
| M-16 | [`216-msprint-16-aporte-pix-avancado-mobile.md`](./216-msprint-16-aporte-pix-avancado-mobile.md) | Aporte/matching e chaves Pix na credora mobile — **concluida com escopo reduzido** (Gate M-16.0: so aportes owner-scoped; matching/aporte POST/chaves Pix adiados por exigirem `FINANCEIRO`) | 6 -> 3 |

## Dependencias gerais

- Backend 27 (gate go-live) e 28 (refactor) sao independentes; 29 -> 30 -> 31 sao a sequencia do
  Epic 15 (assistido, sobre fake); 32 (skeleton) e independente e sua ativacao real e Fase 5.
- Web F-16 depende da Sprint backend 24 (ja mergeada); F-17 e gap-closing (escopo confirmado no
  precheck); F-18 depende das Sprints backend 29-30; F-19 depende do OpenAPI vigente.
- Mobile M-13 -> M-14 (nativo); M-15 depende da base nativa (M-13/M-14) e da Sprint 27; M-16 depende
  das Sprints backend 29-31 e da M-Sprint 10.
- **Dependencia de persona (Gate M-16.0, 2026-07-20)**: contratos backend que exigem
  `FINANCEIRO`/`ADMIN` sao inalcancaveis pelo `sep-mobile`, que so conhece
  `UsuarioRole = 'ADMIN' | 'CLIENTE'`. Antes de planejar sprint mobile sobre contrato novo,
  conferir a role exigida no backend — foi o que reduziu a M-16 a um unico endpoint.
- Gates externos (credenciais Celcoin, conta AWS, contas de loja) nao bloqueiam a implementacao
  destas sprints sobre fake; a ativacao real e a publicacao sao escopo da Fase 5
  ([`../../docs-sep/PRD-FASE-5.md`](../../docs-sep/PRD-FASE-5.md)).
