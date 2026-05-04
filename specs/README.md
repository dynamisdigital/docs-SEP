# Specs - Indice por Fase

Os specs do projeto SEP estao organizados em subpastas por fase do produto:

```
specs/
├── fase-1/   # Fundacao tecnica (Sprints 0-4 backend, F-Sprints 0-4 web, M-Sprints 0-4 mobile)
└── fase-2/   # Jornada de contratacao do emprestimo (Sprints 5-14, apenas backend)
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

## Convencoes de numeracao

- `0XX-` → backend
- `1XX-` → frontend web (F-Sprint)
- `2XX-` → mobile (M-Sprint)
- A subpasta indica a fase, nao a stack — uma mesma fase pode ter specs das 3 stacks (caso da Fase 1)

## Fases futuras

Quando uma Fase 3 ou superior for planejada, criar nova subpasta `fase-3/` (e assim por diante) seguindo o mesmo padrao.
