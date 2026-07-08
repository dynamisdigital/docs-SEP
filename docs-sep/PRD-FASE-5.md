# PRD - Fase 5 - Integracao real, infraestrutura AWS e go-live de producao

> Extraido de `PRD.md` para reduzir o tamanho do documento principal. O planejamento da Fase 4 e o
> marco `v1.0-local` estao em [`PRD-FASE-4.md`](./PRD-FASE-4.md).

Este arquivo detalha a Fase 5: a fase de **fechamento** que retira os gates externos deixados pela
Fase 4 e leva o SEP de `v1.0-local` (produto completo rodando local com providers Fake/WireMock) a
**producao real**. A Fase 5 nao cria jornada funcional nova: ela **liga o que ja existe** a
provedores reais e a ambientes remotos, valida fim-a-fim e conclui o go-live.

## 42. Ponto de partida

Ao iniciar a Fase 5, a Fase 4 entregou o marco `v1.0-local` (ver [`PRD-FASE-4.md`](./PRD-FASE-4.md)
§37):

- Epics 13/14/15 completos e testados sobre **provider fake**; skeleton dos adapters Celcoin/BaaS
  escrito e coberto por WireMock, com Fake como default;
- Epic 14 empacotado nativo (Android/iOS) com biometria nativa, **sem publicacao em lojas**;
- Epic 16 entregue como **documento de planejamento** (arquitetura AWS + CI/CD de deploy), sem
  provisionar;
- follow-ups de go-live saldados (incluindo step-up estrito server-side no aceite);
- restam **dois gates externos**: credenciais Celcoin/BaaS e conta/ambiente AWS.

A Fase 5 so pode **executar** cada frente apos o acesso correspondente ser liberado; ate la, cada
frente permanece planejada.

## 43. Objetivos da Fase 5

1. **Ativar as integracoes reais** Celcoin/BaaS (KYC/PLD, assinatura digital, Pix, escrow, aporte)
   substituindo os fakes pelos adapters reais, com validacao em sandbox e depois producao.
2. **Provisionar a infraestrutura AWS** (Epic 16) e materializar o CI/CD de deploy remoto
   (`aws-develop` -> homologacao -> producao).
3. **Publicar o app mobile** nas lojas (Google Play / App Store) a partir dos builds nativos da
   Fase 4.
4. **Concluir o go-live de producao**: gates finais de seguranca, conformidade regulatoria
   (CMN 4.656/2018) e LGPD, retencao legal, observabilidade e alarmes ativos, backup/rollback
   testados.
5. Validar a **movimentacao financeira real** fim-a-fim (dinheiro de verdade em sandbox controlado e
   depois producao).

## 44. Fora de escopo

- novas jornadas funcionais ou novos perfis mobile (o escopo funcional foi fechado na Fase 4);
- expansao do produto para capacidades nao previstas nos Epics 10-16;
- migracao para microservicos: o backend segue monolito modular DDD (reavaliacao apenas pelos
  criterios do PRD-FASE-3 §"Criterios para reavaliar microservicos");
- troca de stack sem ADR.

## 45. Frentes da Fase 5

### Frente A - Integracao real Celcoin/BaaS

**Gate**: credenciais Celcoin/BaaS (sandbox e producao).

- ativar os adapters reais sobre o skeleton entregue na Fase 4 (Sprint 32), por Provider Pattern,
  com feature flag por ambiente (Fake em dev/test, real em `aws-develop`/homolog/prod);
- validar em **sandbox Celcoin** cada capacidade: KYC/PLD (onboarding), assinatura digital + CCB
  (formalizacao), Pix desembolso/recebimento/conciliacao, escrow e aporte real da credora;
- reconciliar webhooks reais (HMAC, idempotencia, Outbox) contra o comportamento validado com
  WireMock;
- promover de sandbox para producao apos criterios de aceite e trilha de auditoria reforcada.

**Exclusoes**: automacao ampla de Pix sem intervencao humana permanece fora; recorte assistido
mantido ate decisao de produto.

### Frente B - Infraestrutura AWS e deploy remoto (Epic 16 execucao)

**Gate**: conta/ambiente AWS aprovado.

- provisionar a arquitetura desenhada na Fase 4: VPC, EC2 (aplicacao), RDS for PostgreSQL, IAM, SNS,
  alarmes; regiao `sa-east-1`;
- materializar `aws-develop` e homologacao em EC2 compartilhada com RDS separados; producao com
  EC2/RDS proprios;
- ligar o **CI/CD de deploy** (GitHub Actions) a partir dos templates em `docs-sep/ci-pipelines/`;
  primeiro deploy manual documentado em ambiente nao produtivo, depois automatizado;
- migrar o banco oficial de Docker Compose local para RDS gerenciado, com **secrets, rollback,
  backup e migrations Flyway** testados;
- observabilidade viva: CloudWatch (logs JSON correlacionaveis ja produzidos desde a Sprint 22),
  metricas Prometheus/Micrometer, alarmes SNS.

**Exclusoes**: nenhuma reescrita de aplicacao; a app roda como esta, so muda o ambiente.

### Frente C - Publicacao mobile em lojas

**Gate**: contas de desenvolvedor (Google Play / Apple Developer).

- gerar builds assinados de producao (Android AAB / iOS IPA) a partir do empacotamento nativo da
  Fase 4;
- configurar assinatura, provisioning profiles, metadados de loja, politica de privacidade e revisao;
- publicar em canal interno/beta antes de producao.

**Exclusoes**: nenhuma mudanca de jornada; apenas empacotamento, assinatura e submissao.

### Frente D - Go-live de producao e conformidade

**Gate**: Frentes A e B concluidas.

- checklist de go-live: gates de seguranca (step-up estrito server-side fechado na Sprint 27, MFA,
  rate limiting, account lockout), conformidade CMN 4.656/2018 (KYC/KYB, segregacao patrimonial via
  escrow, PLD com trilha auditavel), LGPD e retencao legal de documentos;
- teste de recuperacao (backup/restore, rollback de deploy, failover de RDS);
- validacao de movimentacao financeira real fim-a-fim em ambiente controlado;
- corte de producao (cutover) com plano de rollback e comunicacao.

**Exclusoes**: operacao continua e suporte pos-go-live sao rotina operacional, fora do escopo de
implementacao desta fase.

## 46. Mapeamento Fase 5: frentes x sprints

Planejamento de alto nivel; todas as sprints **planejadas** e **gated** pelo acesso da sua frente.
Specs e steps sao criados **just-in-time** em `specs/fase-5/` e `steps-fase-5/`. A numeracao continua
a sequencia (backend a partir de 33; mobile a partir de M-17). Frentes de infra usam prefixo
`I-Sprint` (infraestrutura) por nao serem sprints de codigo de aplicacao.

### Backend / integracao (`sep-api`)

| Sprint | Frente | Tema | Gate | Status |
|--------|--------|------|------|--------|
| 33 | A | Ativacao adapter real KYC/PLD (Celcoin) + validacao sandbox | credenciais Celcoin | planejada |
| 34 | A | Ativacao adapter real assinatura/CCB + validacao sandbox | credenciais Celcoin | planejada |
| 35 | A | Ativacao adapter real Pix + escrow + aporte + conciliacao (sandbox) | credenciais Celcoin | planejada |
| 36 | A | Promocao das integracoes de sandbox para producao + trilha de auditoria | credenciais prod | planejada |

### Infraestrutura (`sep-api` + `docs-SEP/ci-pipelines`)

| Sprint | Frente | Tema | Gate | Status |
|--------|--------|------|------|--------|
| I-1 | B | Provisionamento AWS base (VPC/EC2/RDS/IAM/SNS) `aws-develop` | conta AWS | planejada |
| I-2 | B | CI/CD de deploy remoto + secrets/rollback/backup/migrations | conta AWS | planejada |
| I-3 | B | Homologacao + producao (EC2/RDS proprios) + observabilidade/alarmes vivos | conta AWS | planejada |

### Mobile (`sep-mobile`)

| Sprint | Frente | Tema | Gate | Status |
|--------|--------|------|------|--------|
| M-17 | C | Build assinado de producao + publicacao Google Play (interno/beta -> prod) | conta Play | planejada |
| M-18 | C | Build assinado de producao + publicacao App Store (TestFlight -> prod) | conta Apple | planejada |

### Go-live (cross-repo)

| Sprint | Frente | Tema | Gate | Status |
|--------|--------|------|------|--------|
| G-1 | D | Checklist go-live: seguranca + conformidade CMN 4.656/LGPD + retencao | Frentes A/B | planejada |
| G-2 | D | Teste de recuperacao (backup/rollback/failover) + validacao financeira real | Frentes A/B | planejada |
| G-3 | D | Cutover de producao + plano de rollback | Frentes A/B/C | planejada |

**Decisoes de planejamento**:

- **Sequencia por gate**: cada frente so inicia quando seu acesso e liberado; A (Celcoin) e B (AWS)
  podem correr em paralelo; D depende de A e B; C depende das contas de loja.
- **Sem retrabalho de aplicacao**: a Fase 5 nao altera regra de negocio nem contrato REST; muda
  provider (fake -> real) e ambiente (local -> AWS).
- **Validacao antes de promover**: cada integracao passa por sandbox com criterios de aceite antes de
  producao.
- **Steps just-in-time**: esta tabela cria o mapa; specs/steps sao criados antes de cada execucao.

## 47. Gates e pre-requisitos

- **Credenciais Celcoin/BaaS** (sandbox e producao) — Frente A e Sprints 33-36.
- **Conta/ambiente AWS aprovado** — Frente B e I-Sprints 1-3.
- **Contas de desenvolvedor de loja** (Google Play, Apple Developer) — Frente C e M-17/M-18.
- **Aprovacao regulatoria/juridica** para operar movimentacao financeira real (conformidade
  CMN 4.656/2018) — Frente D.
- **ADRs candidatos** (just-in-time): estrategia de deploy/secrets AWS; feature flag de provider por
  ambiente; politica de retencao/backup; publicacao e assinatura mobile.

## 48. Regras de execucao

Herdadas do [`AGENT.md`](../AGENT.md) e do PRD-FASE-3 §26:

- implementacao em tarefas pequenas; checkpoint pre-commit antes de qualquer `git add`/`git commit`;
- push e PR manuais; Conventional Commits;
- integracoes externas isoladas por Provider Pattern; ativacao real por feature flag de ambiente,
  nunca por mudanca de codigo em runtime de dev/test (que seguem Fake);
- **deploy remoto de producao depende de estrategia explicita de secrets, rollback, backup,
  migrations e controle de acesso** (regra fixa do PRD-FASE-3 §26);
- nenhum recurso AWS provisionado nem credencial real usada sem aprovacao explicita do usuario;
- toda implementacao/refactor/review aplica as skills obrigatorias (`coding-guidelines`,
  `clean-code`, `design-patterns-java`) conforme AGENT.md.

## 49. Premissas

- a Fase 5 so avanca por frente conforme os acessos sao liberados; e valido concluir a fase
  parcialmente (ex.: AWS antes de Celcoin) e registrar o restante como pendente de acesso;
- a aplicacao entra em producao **sem reescrita**: o codigo validado na `v1.0-local` e o mesmo, com
  providers reais e ambiente AWS;
- o banco migra de PostgreSQL local (Docker Compose) para RDS gerenciado; a paridade de schema e
  garantida por Flyway;
- a baseline de stack permanece a da Fase 4 (`Angular 20.x`, `Ionic 8.4+`, `Capacitor 8`, Java 21 +
  Spring Boot 3.5.x); mudanca de major depende de ADR;
- este PRD e documento vivo: specs e steps da Fase 5 evoluem em `specs/fase-5/` e `steps-fase-5/`.

## 50. Encerramento da Fase 5

_A preencher quando a fase for concluida (status por frente, ambientes provisionados, integracoes
ativas em producao, apps publicados, resultado do go-live, itens adiados e dividas aceitas),
seguindo o padrao do PRD-FASE-3 §31._
