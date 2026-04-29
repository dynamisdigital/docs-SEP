# CLAUDE.md - Orientacao para agentes neste projeto

Este arquivo orienta agentes de IA (Claude Code, GitHub Copilot, etc.) que assumirem trabalho no projeto SEP. Leia antes de qualquer acao.

## Estado atual do projeto

Fase: **100% documental**. Zero codigo escrito. Todos os artefatos sao Markdown/HTML em `docs-sep/`, `specs/` e `adr/`.

Documento principal: [`docs-sep/PRD.md`](docs-sep/PRD.md). Sempre comece lendo o PRD antes de propor qualquer mudanca.

## Visao do produto

SEP (Sociedade de Emprestimo entre Pessoas) com foco inicial em capital de giro PJ. O produto se apoia em Banking as a Service (Celcoin) para Pix, escrow, KYC/KYB e demais movimentacoes financeiras. Quatro jornadas previstas: tomador, empresa credora, financeiro interno, administrador.

A entrega tecnica atual e a fundacao backend da API.

## Stack confirmada

### Backend
- Java `21` LTS
- Spring Boot `3.5.x` (pinar versao explicita)
- Gradle (Kotlin DSL aceitavel se preferido)
- PostgreSQL `16`
- Hibernate `6.x`
- Spring Security `6` + JWT (JJWT `0.12.x`)
- BCrypt para hash de senha
- Flyway para migrations
- Springdoc OpenAPI (Swagger UI)
- Spring Boot Actuator
- **MapStruct** (geracao de codigo, type-safe) — substituiu ModelMapper
- **RestClient** (Spring 6 sync) para integracoes Celcoin; `WebClient` reservado para streams
- **Resilience4j** para circuit breaker/retry/timeout em integracoes externas
- **Micrometer + Prometheus** para metricas
- **Testcontainers** para testes de integracao com PostgreSQL real
- **WireMock 3.x** para integration tests dos adapters HTTP do Celcoin (ver ADR 0008)
- Test slices: `@WebMvcTest`, `@DataJpaTest`, `@JsonTest`
- Records para DTOs, Sealed types para Roles/eventos, Pattern matching, Virtual threads

### Frontend
- Angular `20.x` (sem framework CSS de terceiros)
- SCSS puro
- Standalone Components + Signals
- ESLint + Prettier + Stylelint
- Vitest (unit) + Playwright (E2E)
- Husky + lint-staged

### Mobile
- Baseline: `Angular 20.x + Ionic 8.4+ + Capacitor 6`
- Avaliar upgrade para Angular 21 na fase de implementacao mobile, condicionado a release oficial Ionic + plugins
- Storage de token via `Capacitor Preferences` (PWA + Android/iOS)
- Validacao em PWA primeiro; build Android/iOS via Capacitor entra em fase posterior
- Trilha de execucao: M-Sprints 0-4 em `specs/200-204`, conduzida por Dev Mobile dedicado

### Design Systems
- [`docs-sep/DESIGN-apple.md`](docs-sep/DESIGN-apple.md) — superficies publicas (landing, login, cadastro)
- [`docs-sep/DESIGN-notion.md`](docs-sep/DESIGN-notion.md) — superficies autenticadas e todo o mobile
- Fronteira: estado de autenticacao (`/auth/me`)

### Separacao de canal por perfil (ADR 0009)
- **Tomador**: mobile-only (sem versao web apos Sprint 5 — biometria nativa, storage Keystore/Keychain)
- **Empresa Credora**: web principal (KYB, carteira, oportunidades) + mobile resumido (notificacoes, status)
- **Internos (admin, financeiro, backoffice)**: web-only
- Cadastro publico generico desativado na Sprint 5; substituido por fluxos canalizados (cadastro de tomador no mobile, convite de credora pelo admin, criacao interna de admin/financeiro/backoffice)

### Qualidade e tooling
- Spotless + Palantir Java Format
- JaCoCo target 70% por modulo
- Pre-commit hooks (Husky frontend, Git hooks backend)
- GitHub Actions para CI (build, test, lint, JaCoCo)
- Conventional Commits

## Arquitetura

- **Monolito modular orientado a DDD** (1 deploy Spring Boot, 1 banco PostgreSQL nesta fase)
- **Hexagonal/Ports & Adapters dentro de cada modulo** (`domain`, `application`, `infrastructure`, `web`)
- **Provider Pattern** obrigatorio para integracoes externas (Celcoin):
  - Interface em `<modulo>.application.port.out.<X>Provider`
  - Implementacao em `<modulo>.infrastructure.adapter.<X>.Celcoin<X>Provider`
- Sem microservicos nesta fase

Modulos previstos: `identity`, `usuarios`, `onboarding`, `credito`, `contratos`, `cobranca`, `escrow`, `backoffice`, `financeiro`, `credores`, `pix`, `shared`.

## Roteiro de Sprints

- **Sprint 0** — Hygiene & Foundation (tooling, repo setup, CLAUDE.md, ADRs, CI minimo)
- **Sprint 1** — Fundacao Tecnica (projeto Spring Boot, Postgres, Flyway, ApiExceptionHandler stub, Auditoria base, adapter pattern stub)
- **Sprint 2** — Gestao de Usuarios (entidade Usuario com Records, MapStruct, criacao publica, BCrypt, testes)
- **Sprint 3** — Seguranca/Auth (JWT, login, autorizacao por perfil/ownership, mTLS prep, correlationId)
- **Sprint 4** — Erros, Documentacao, Testes, Webhook Receiver (Pix prep)
- **Sprint 5** — Endurecimento de Seguranca (MFA TOTP + biometria mobile, refresh token rotativo, rate limit, lockout, password policy nova, step-up auth, audit log de seguranca, canalizacao por perfil) — **gate para producao e Epic 5**

Specs em `specs/000` a `specs/005` para backend; `specs/100` a `specs/104` para frontend web (1 arquivo por F-Sprint); `specs/200` a `specs/204` para mobile (1 arquivo por M-Sprint).

## Roadmap (16 Epics)

Ver [`docs-sep/PRD.md`](docs-sep/PRD.md) §25. Resumo:
1-4: Sprints 1-4 (backend foundation)
5: Onboarding KYC/KYB
6: Analise de Credito
7: Formalizacao Contratual
8: Cobranca e Inadimplencia
9: Backoffice Operacional
10: Jornada da Empresa Credora
11: Administracao e Governanca
12: Fundacao Frontend
13: Frontend de Jornadas
14: Mobile SEP
15: Movimentacao Pix
16: Infraestrutura AWS Futura

## Marco regulatorio

SEPs sao reguladas pela **Resolucao CMN nº 4.656/2018**. Implicacoes:
- KYC/KYB e obrigatorio por lei (nao opcional)
- Segregacao patrimonial via conta escrow e obrigatoria
- Consultas a COAF, OFAC, INTERPOL, MTE para PLD
- Auditoria reforcada de operacoes financeiras

## Convencoes do projeto

- Tabelas e colunas em portugues
- Identificadores: UUID v6 (lib `com.fasterxml.uuid:java-uuid-generator:5.1.0`)
- UUID nativo no PostgreSQL, `java.util.UUID` no Java
- Sem soft delete nesta fase
- Datas serializadas em ISO-8601 com offset
- Senhas: BCrypt; politica de 6 caracteres e valida apenas Sprints 1-4; Sprint 5 (Endurecimento) substitui por minimo 12 chars OU passphrase + haveibeenpwned (ADR 0010)
- MFA obrigatorio a partir da Sprint 5: TOTP (web) + biometria nativa (mobile); refresh token rotativo; rate limit; account lockout; step-up auth — **gate para producao** (ADR 0010)
- Locale `pt-BR`, timezone `America/Sao_Paulo`
- Logout: tratado no cliente (sem refresh token nesta fase)

## Como iniciar uma nova conversa

1. Leia [`docs-sep/PRD.md`](docs-sep/PRD.md)
2. Leia [`docs-sep/CONTEXT.md`](docs-sep/CONTEXT.md) para historico de decisoes
3. Leia o spec relevante em `specs/`
4. Leia o steps correspondente em `steps/` (detalhamento por task antes de codificar)
5. Leia ADRs em `adr/` para racional de decisoes arquiteturais
6. Antes de propor mudanca grande, considere abrir um ADR novo

## Hierarquia SDD do projeto

```
PRD → ADRs → Specs → Steps → Codigo
docs-sep/  adr/  specs/  steps/
```

- **PRD** = visao do produto (alto nivel)
- **ADRs** = decisoes arquiteturais imutaveis
- **Specs** = o que fazer por sprint (medio nivel, com tasks numeradas)
- **Steps** = como fazer (granular, com snippets prontos para codificar)
- **Codigo** = a verdade final apos execucao

Steps devem ser criados **just-in-time** antes de executar cada sprint, nao todos de uma vez.

## O que NAO fazer

- Nao reintroduzir Bootstrap, Tailwind, Material ou template administrativo pronto
- Nao acoplar modulos a Celcoin diretamente — sempre via Provider Pattern
- Nao criar microservicos nesta fase
- Nao adicionar soft delete
- Nao usar ModelMapper (foi substituido por MapStruct)
- Nao regredir Angular abaixo de `20`
- Nao gerar specs/plans automaticamente sem confirmacao do usuario
- Nao iniciar implementacao remota AWS antes da Sprint 3 / Epic 3 concluida

## Comunicacao

- Idioma: portugues (pt-BR) para conversa, codigo em ingles tecnico
- Commits podem ser feitos por agente quando solicitado; push e PR sao manuais
