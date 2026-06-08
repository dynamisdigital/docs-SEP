# Specs - Indice por Fase

Os specs do projeto SEP estao organizados em subpastas por fase do produto:

```
specs/
├── fase-1/   # Fundacao tecnica (Sprints 0-4 backend, F-Sprints 0-4 web, M-Sprints 0-4 mobile)
├── fase-2/   # Jornada de contratacao do emprestimo (Sprints 5-14, apenas backend)
└── fase-3/   # Jornadas e capacidades pos-Fase-2 (backend, web e mobile)
```

## Fase 1 — Fundacao Tecnica (15 specs)

Trilha completa nas 3 stacks (backend + web + mobile). Ja entregue/planejada na primeira onda.

### Backend (5 specs)
| Sprint | Arquivo | Tema |
|--------|---------|------|
| 0 | [`fase-1/000-sprint-0-hygiene-foundation.md`](./fase-1/000-sprint-0-hygiene-foundation.md) | Hygiene & Foundation (tooling, ADRs, CI minimo) |
| 1 | [`fase-1/001-sprint-1-fundacao-tecnica.md`](./fase-1/001-sprint-1-fundacao-tecnica.md) | Fundacao Tecnica (projeto + Postgres + Flyway) |
| 2 | [`fase-1/002-sprint-2-gestao-usuarios.md`](./fase-1/002-sprint-2-gestao-usuarios.md) | Gestao de Usuarios |
| 3 | [`fase-1/003-sprint-3-seguranca-autenticacao.md`](./fase-1/003-sprint-3-seguranca-autenticacao.md) | Seguranca e Autenticacao JWT |
| 4 | [`fase-1/004-sprint-4-erros-docs-testes.md`](./fase-1/004-sprint-4-erros-docs-testes.md) | Erros + Documentacao + Testes + Webhook Receiver |

### Web (5 specs — F-Sprints 0-4)
| Sprint | Arquivo | Tema |
|--------|---------|------|
| F-0 | [`fase-1/100-fsprint-0-setup-angular.md`](./fase-1/100-fsprint-0-setup-angular.md) | Setup Angular + Tooling |
| F-1 | [`fase-1/101-fsprint-1-design-tokens-showcase.md`](./fase-1/101-fsprint-1-design-tokens-showcase.md) | Tokens Apple+Notion + Showcase |
| F-2 | [`fase-1/102-fsprint-2-telas-apple-publicas.md`](./fase-1/102-fsprint-2-telas-apple-publicas.md) | Telas Apple Publicas |
| F-3 | [`fase-1/103-fsprint-3-shell-notion-auth.md`](./fase-1/103-fsprint-3-shell-notion-auth.md) | Shell Notion + Auth |
| F-4 | [`fase-1/104-fsprint-4-telas-autenticadas.md`](./fase-1/104-fsprint-4-telas-autenticadas.md) | Telas Autenticadas |

### Mobile (5 specs — M-Sprints 0-4)
| Sprint | Arquivo | Tema |
|--------|---------|------|
| M-0 | [`fase-1/200-msprint-0-setup-ionic.md`](./fase-1/200-msprint-0-setup-ionic.md) | Setup Ionic + Tooling |
| M-1 | [`fase-1/201-msprint-1-tokens-notion-mobile.md`](./fase-1/201-msprint-1-tokens-notion-mobile.md) | Tokens Notion Mobile |
| M-2 | [`fase-1/202-msprint-2-telas-publicas-mobile.md`](./fase-1/202-msprint-2-telas-publicas-mobile.md) | Telas Publicas Mobile |
| M-3 | [`fase-1/203-msprint-3-shell-mobile-auth.md`](./fase-1/203-msprint-3-shell-mobile-auth.md) | Shell Mobile + Auth |
| M-4 | [`fase-1/204-msprint-4-telas-autenticadas-mobile.md`](./fase-1/204-msprint-4-telas-autenticadas-mobile.md) | Telas Autenticadas Mobile |

## Fase 2 — Jornada de Contratacao do Emprestimo (10 specs, apenas backend)

Apenas backend. Web e Mobile da Fase 2 entram em planejamento separado depois que os contratos da API estabilizarem.

| Sprint | Arquivo | Tema | Epic |
|--------|---------|------|------|
| 5 | [`fase-2/005-sprint-5-endurecimento-seguranca.md`](./fase-2/005-sprint-5-endurecimento-seguranca.md) | Endurecimento de Seguranca (gate Fase 2) | Epic 4 estendida |
| 6 | [`fase-2/006-sprint-6-onboarding-kyc-pessoa.md`](./fase-2/006-sprint-6-onboarding-kyc-pessoa.md) | Onboarding KYC Pessoa Fisica | Epic 5 (parte 1) |
| 7 | [`fase-2/007-sprint-7-onboarding-kyb-empresa.md`](./fase-2/007-sprint-7-onboarding-kyb-empresa.md) | Onboarding KYB Empresa + PLD | Epic 5 (parte 2) |
| 8 | [`fase-2/008-sprint-8-credito-regras-parecer.md`](./fase-2/008-sprint-8-credito-regras-parecer.md) | Credito — regras + parecer | Epic 6 (parte 1) |
| 9 | [`fase-2/009-sprint-9-credito-open-finance.md`](./fase-2/009-sprint-9-credito-open-finance.md) | Credito — Open Finance | Epic 6 (parte 2) |
| 10 | [`fase-2/010-sprint-10-formalizacao-geracao-contrato.md`](./fase-2/010-sprint-10-formalizacao-geracao-contrato.md) | Formalizacao — geracao de contrato | Epic 7 (parte 1) |
| 11 | [`fase-2/011-sprint-11-formalizacao-assinatura-digital.md`](./fase-2/011-sprint-11-formalizacao-assinatura-digital.md) | Formalizacao — assinatura digital + CCB | Epic 7 (parte 2) |
| 12 | [`fase-2/012-sprint-12-cobranca-parcelas-agenda.md`](./fase-2/012-sprint-12-cobranca-parcelas-agenda.md) | Cobranca — parcelas e agenda | Epic 8 (parte 1) |
| 13 | [`fase-2/013-sprint-13-cobranca-inadimplencia.md`](./fase-2/013-sprint-13-cobranca-inadimplencia.md) | Cobranca — inadimplencia | Epic 8 (parte 2) |
| 14 | [`fase-2/014-sprint-14-backoffice-operacional.md`](./fase-2/014-sprint-14-backoffice-operacional.md) | Backoffice operacional | Epic 9 |

Ver tambem: [PRD §22 (Backlog Tecnico)](../docs-sep/PRD.md), [PRD §29 (Mapeamento Fase 2)](../docs-sep/PRD.md).

## Fase 3 — Jornadas e capacidades pos-Fase-2 (22 specs)

Specs separados por projeto, com ate 6 tasks de implementacao por sprint. Precheck, E2E/smoke e docs nao contam no limite.

As tabelas da Fase 3 abaixo seguem a ordem recomendada de execucao, nao a ordenacao numerica estrita. Isso antecipa o Epic 17 (`F-14` e `M-12`) para reduzir retrabalho visual.

Ver indice completo em [`fase-3/README.md`](./fase-3/README.md).

### Backend (6 specs)
| Sprint | Arquivo | Tema |
|--------|---------|------|
| 16 | [`fase-3/016-sprint-16-credora-foundation.md`](./fase-3/016-sprint-16-credora-foundation.md) | Jornada credora foundation |
| 17 | [`fase-3/017-sprint-17-credora-oportunidades-carteira.md`](./fase-3/017-sprint-17-credora-oportunidades-carteira.md) | Oportunidades e carteira da credora |
| 18 | [`fase-3/018-sprint-18-governanca-rbac-parametros.md`](./fase-3/018-sprint-18-governanca-rbac-parametros.md) | Administracao e governanca avancada |
| 19 | [`fase-3/019-sprint-19-pix-foundation-escrow-provider.md`](./fase-3/019-sprint-19-pix-foundation-escrow-provider.md) | Pix foundation + EscrowProvider |
| 20 | [`fase-3/020-sprint-20-pix-desembolso-assistido.md`](./fase-3/020-sprint-20-pix-desembolso-assistido.md) | Pix desembolso assistido |
| 21 | [`fase-3/021-sprint-21-pix-recebimento-conciliacao.md`](./fase-3/021-sprint-21-pix-recebimento-conciliacao.md) | Pix recebimento e conciliacao |

### Web (9 specs)
| Sprint | Arquivo | Tema |
|--------|---------|------|
| F-6 | [`fase-3/106-fsprint-6-onboarding-web.md`](./fase-3/106-fsprint-6-onboarding-web.md) | Jornada onboarding PF/PJ |
| F-7 | [`fase-3/107-fsprint-7-credito-open-finance-web.md`](./fase-3/107-fsprint-7-credito-open-finance-web.md) | Propostas, credito e Open Finance |
| F-8 | [`fase-3/108-fsprint-8-formalizacao-web.md`](./fase-3/108-fsprint-8-formalizacao-web.md) | Formalizacao, assinatura e CCB |
| F-9 | [`fase-3/109-fsprint-9-cobranca-web.md`](./fase-3/109-fsprint-9-cobranca-web.md) | Cobranca, parcelas e inadimplencia |
| F-10 | [`fase-3/110-fsprint-10-backoffice-financeiro-web.md`](./fase-3/110-fsprint-10-backoffice-financeiro-web.md) | Backoffice e financeiro operacional |
| F-14 | [`fase-3/114-fsprint-14-new-design-system-web.md`](./fase-3/114-fsprint-14-new-design-system-web.md) | New Design System Web |
| F-11 | [`fase-3/111-fsprint-11-credora-web.md`](./fase-3/111-fsprint-11-credora-web.md) | Jornada empresa credora |
| F-12 | [`fase-3/112-fsprint-12-governanca-web.md`](./fase-3/112-fsprint-12-governanca-web.md) | Administracao e governanca avancada |
| F-13 | [`fase-3/113-fsprint-13-pix-web.md`](./fase-3/113-fsprint-13-pix-web.md) | Pix operacional no web |

### Mobile (7 specs)
| Sprint | Arquivo | Tema |
|--------|---------|------|
| M-12 | [`fase-3/212-msprint-12-new-design-system-mobile.md`](./fase-3/212-msprint-12-new-design-system-mobile.md) | New Design System Mobile |
| M-6 | [`fase-3/206-msprint-6-onboarding-mobile.md`](./fase-3/206-msprint-6-onboarding-mobile.md) | Tomador: onboarding mobile |
| M-7 | [`fase-3/207-msprint-7-credito-mobile.md`](./fase-3/207-msprint-7-credito-mobile.md) | Tomador: proposta, credito e Open Finance |
| M-8 | [`fase-3/208-msprint-8-formalizacao-mobile.md`](./fase-3/208-msprint-8-formalizacao-mobile.md) | Tomador: formalizacao e contrato |
| M-9 | [`fase-3/209-msprint-9-cobranca-mobile.md`](./fase-3/209-msprint-9-cobranca-mobile.md) | Tomador: parcelas e cobranca |
| M-10 | [`fase-3/210-msprint-10-credora-mobile.md`](./fase-3/210-msprint-10-credora-mobile.md) | Empresa credora mobile |
| M-11 | [`fase-3/211-msprint-11-pix-mobile.md`](./fase-3/211-msprint-11-pix-mobile.md) | Pix visivel ao usuario |

## Convencoes de numeracao

- `0XX-` → backend
- `1XX-` → frontend web (F-Sprint)
- `2XX-` → mobile (M-Sprint)
- A subpasta indica a fase, nao a stack — uma mesma fase pode ter specs das 3 stacks (caso da Fase 1)

## Fases futuras

Quando uma Fase 4 ou superior for planejada, criar nova subpasta `fase-4/` (e assim por diante) seguindo o mesmo padrao.
