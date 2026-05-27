# Specs - Fase 3

Fase 3 cobre as jornadas e capacidades posteriores ao fechamento da Fase 2 em `main`.

## Regras de planejamento

- Specs separados por projeto: backend (`0XX`), web (`1XX`) e mobile (`2XX`).
- Cada sprint tem no maximo 6 tasks de implementacao.
- Precheck, E2E/smoke, documentacao, collections e fechamento nao contam no limite de tasks de implementacao.
- Steps continuam just-in-time, criados apenas quando a sprint for aprovada para execucao.
- Backend segue monolito modular DDD + Hexagonal/Ports & Adapters.
- Web e mobile nao concentram regra de negocio; consomem contratos da API.

## Backend (`sep-api`)

| Sprint | Arquivo | Tema | Impl tasks |
|--------|---------|------|------------|
| 16 | [`016-sprint-16-credora-foundation.md`](./016-sprint-16-credora-foundation.md) | Jornada credora foundation | 6 |
| 17 | [`017-sprint-17-credora-oportunidades-carteira.md`](./017-sprint-17-credora-oportunidades-carteira.md) | Oportunidades e carteira da credora | 6 |
| 18 | [`018-sprint-18-governanca-rbac-parametros.md`](./018-sprint-18-governanca-rbac-parametros.md) | Administracao e governanca avancada | 6 |
| 19 | [`019-sprint-19-pix-foundation-escrow-provider.md`](./019-sprint-19-pix-foundation-escrow-provider.md) | Pix foundation + EscrowProvider | 6 |
| 20 | [`020-sprint-20-pix-desembolso-assistido.md`](./020-sprint-20-pix-desembolso-assistido.md) | Pix desembolso assistido | 5 |
| 21 | [`021-sprint-21-pix-recebimento-conciliacao.md`](./021-sprint-21-pix-recebimento-conciliacao.md) | Pix recebimento e conciliacao | 6 |

## Web (`sep-app`)

| Sprint | Arquivo | Tema | Impl tasks |
|--------|---------|------|------------|
| F-6 | [`106-fsprint-6-onboarding-web.md`](./106-fsprint-6-onboarding-web.md) | Jornada onboarding PF/PJ | 6 |
| F-7 | [`107-fsprint-7-credito-open-finance-web.md`](./107-fsprint-7-credito-open-finance-web.md) | Propostas, credito e Open Finance | 6 |
| F-8 | [`108-fsprint-8-formalizacao-web.md`](./108-fsprint-8-formalizacao-web.md) | Formalizacao, assinatura e CCB | 5 |
| F-9 | [`109-fsprint-9-cobranca-web.md`](./109-fsprint-9-cobranca-web.md) | Cobranca, parcelas e inadimplencia | 6 |
| F-10 | [`110-fsprint-10-backoffice-financeiro-web.md`](./110-fsprint-10-backoffice-financeiro-web.md) | Backoffice e financeiro operacional | 6 |
| F-11 | [`111-fsprint-11-credora-web.md`](./111-fsprint-11-credora-web.md) | Jornada empresa credora | 6 |
| F-12 | [`112-fsprint-12-governanca-web.md`](./112-fsprint-12-governanca-web.md) | Administracao e governanca avancada | 5 |
| F-13 | [`113-fsprint-13-pix-web.md`](./113-fsprint-13-pix-web.md) | Pix operacional no web | 5 |

## Mobile (`sep-mobile`)

| Sprint | Arquivo | Tema | Impl tasks |
|--------|---------|------|------------|
| M-6 | [`206-msprint-6-onboarding-mobile.md`](./206-msprint-6-onboarding-mobile.md) | Tomador: onboarding mobile | 6 |
| M-7 | [`207-msprint-7-credito-mobile.md`](./207-msprint-7-credito-mobile.md) | Tomador: proposta, credito e Open Finance | 6 |
| M-8 | [`208-msprint-8-formalizacao-mobile.md`](./208-msprint-8-formalizacao-mobile.md) | Tomador: formalizacao e contrato | 5 |
| M-9 | [`209-msprint-9-cobranca-mobile.md`](./209-msprint-9-cobranca-mobile.md) | Tomador: parcelas e cobranca | 6 |
| M-10 | [`210-msprint-10-credora-mobile.md`](./210-msprint-10-credora-mobile.md) | Empresa credora mobile | 6 |
| M-11 | [`211-msprint-11-pix-mobile.md`](./211-msprint-11-pix-mobile.md) | Pix visivel ao usuario | 5 |

## Dependencias gerais

- Web F-6 a F-10 dependem das APIs backend da Fase 2; reprocessos da F-10 exigem handler real backend por provider/event.
- Web F-11 depende das Sprints backend 16-17 e do contrato de autorizacao/ownership da credora, entregue na Sprint 16 ou complementado pela Sprint 18.
- Web F-12 depende da Sprint backend 18.
- Web F-13 depende das Sprints backend 19-21.
- Mobile M-6 a M-9 dependem das APIs backend da Fase 2.
- Mobile M-10 depende das Sprints backend 16-17 e do contrato de autorizacao/ownership da credora, entregue na Sprint 16 ou complementado pela Sprint 18.
- Mobile M-11 depende das Sprints backend 19-21.
- Backend Sprint 20 depende da decisao de step-up estrito sem bypass MFA antes de qualquer desembolso assistido.
