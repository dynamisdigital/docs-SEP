# Plano de infraestrutura AWS do SEP (Epic 16)

> Documento de planejamento executavel do Epic 16, entregavel da Fase 4 exigido pela Definition of
> Done do marco `v1.0-local` ([`PRD-FASE-4.md`](./PRD-FASE-4.md) §35 e §37). **Nada aqui foi
> provisionado e nenhum custo foi incorrido.** A execucao e a Frente B da Fase 5
> ([`PRD-FASE-5.md`](./PRD-FASE-5.md) §45), gated por conta/ambiente AWS aprovado.
>
> Escrito em 2026-09-15 contra `sep-api` `develop` (arvore `6b3aab2`), `sep-app` `develop` (arvore
> `b8e6012`) e `sep-mobile` `develop` (arvore `f9409ea`). Onde o texto afirma o que a aplicacao faz, a
> fonte esta citada; onde recomenda, esta marcado como recomendacao; o que depende de escolha fica em
> §13 para o ADR de deploy/secrets AWS, candidato desde o `PRD-FASE-4.md` §38.

## 1. Objetivo e limites

Levar o SEP de `v1.0-local` (PostgreSQL em Docker Compose, providers Fake/WireMock) a tres ambientes
remotos na AWS, sem reescrever a aplicacao: a app roda como esta, muda o ambiente.

- **Dentro**: topologia de ambientes, rede, computacao, banco, secrets, backup, migrations, deploy e
  rollback, CI/CD de deploy, IAM, observabilidade e alarmes, e as pre-condicoes de codigo que o
  primeiro deploy exige.
- **Fora**: provisionamento (Fase 5), IaC escrito (a escolha de ferramenta e decisao de §13),
  ativacao de providers reais (Frente A da Fase 5), publicacao em lojas (Frente C), estimativa de custo
  com valores (fazer no AWS Pricing Calculator no dia do gate, porque preco muda).
- **Premissas herdadas**: monolito modular unico ([ADR 0001](../adr/0001-monolito-modular-orientado-a-ddd.md)),
  banco unico PostgreSQL 16, regiao `sa-east-1`, `aws-develop` e homologacao em EC2 compartilhada com RDS
  separados e producao com EC2/RDS proprios (`PRD-FASE-4.md` §35), observabilidade do
  [ADR 0016](../adr/0016-observabilidade-operacional-cloudwatch.md) e do [`OBSERVABILIDADE.md`](./OBSERVABILIDADE.md).

## 2. O que a aplicacao exige do ambiente (medido)

| Exigencia | Fonte | Consequencia para a infra |
|---|---|---|
| Java 21, Spring Boot 3.5, artefato `bootJar` | `sep-api/build.gradle` | JRE 21 na EC2; sem container obrigatorio |
| HTTP em `8080`; management (`health`, `info`, `prometheus`) em `127.0.0.1:8081` no perfil `prod` | `application.yml`, `application-prod.yml` | balanceador aponta para `8080`; `8081` nunca sai da instancia |
| `/actuator/health` publico na API | `SecurityConfig` | health check do balanceador |
| Perfil `prod` obrigatorio: datasource por `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD`, pool `DB_MAX_POOL_SIZE` (20) | `application-prod.yml` | secrets do banco por ambiente; dimensionar `max_connections` do RDS |
| Flyway roda **no boot**, `validate-on-migrate: true`, sem baseline; 61 migrations (`V1`..`V61`) | `application.yml`, `db/migration` | migration acontece no deploy da app; e forward-only (§6) |
| Timezone `America/Sao_Paulo` no JDBC, no Jackson e nos crons | `application.yml`, jobs de `cobranca` | parameter group do RDS com `timezone` coerente; crons dependem do fuso |
| Logs JSON Lines em `/var/log/sep-api/application.json`, rotacao diaria/50 MB, teto 2 GB | `logback-spring.xml`, ADR 0016 | CloudWatch Agent ja modelado (`ci-pipelines/templates/cloudwatch-agent-*.json`); volume de log com folga |
| Documentos KYC/KYB e contrato assinado gravados **no banco** (`JpaDocumentoStorage`, `InlineDocumentoAssinadoStorage`); upload ate 12 MB | `onboarding`, `contratos`, `application.yml` | sem S3 para documento hoje; storage e backup do RDS crescem com documentos |
| **Desafio MFA e desafio de step-up em memoria** (`ConcurrentHashMap` em `MfaChallengeService` e `StepUpChallengeService`) | `identity/application/service` | com duas instancias, o login com MFA pode falhar; restart descarta desafios em curso (§4) |
| **Rate limit de login/TOTP por instancia** (mapa LRU no `RateLimitFilter`) | `shared` | com N instancias o limite efetivo multiplica por N |
| Rate limit por IP depende de `APP_TRUSTED_PROXIES` (regex do `RemoteIpValve`); vazio = nao confia em nenhum proxy | `application.yml` (Sprint 35) | sem configurar, todo cliente aparece com o IP do balanceador e o limite vira global |
| Cinco jobs agendados; **so `MarcarParcelaAtrasadaJob` usa `PostgresAdvisoryJobLock`** | `cobranca/application/job`, `backoffice/application/job` | com duas instancias, quatro jobs duplicariam notificacoes, eventos e audit (§4) |
| Cookie `sep-refresh` com `secure`/`same-site`/`domain` por env var (defaults `false`/`Lax`/vazio) | `application.yml` | producao exige `APP_REFRESH_COOKIE_SECURE=true` e `SAME_SITE=Strict` |
| CORS por `APP_CORS_ORIGINS`, com `allow-credentials` e `Retry-After` exposto | `application.yml` | listar as origens https do web e as do app nativo (§11) |
| Webhooks Celcoin/Clicksign com HMAC por provider (`APP_WEBHOOK_SECRET_*`) | `application.yml` | endpoint publico de webhook + secrets por ambiente |
| Providers selecionados por env var (`APP_*_PROVIDER`, default `fake`), validados no boot | `application.yml`, [ADR 0017](../adr/0017-feature-flags-de-providers-por-ambiente.md) | ambientes sobem com Fake ate a Frente A ligar os reais |
| Listener `REQUIRES_NEW` em `AFTER_COMMIT` segura **duas** conexoes por requisicao | `NOTIFICACOES.md` (Sprint 38) | pool >= 2x as requisicoes concorrentes desse caminho |
| **Swagger UI e `/v3/api-docs` publicos e ativos em `prod`** | `SecurityConfig`, `application.yml` | decisao de exposicao antes de producao (§12) |
| **Datasource de `prod` sem `sslmode`** | `application-prod.yml` | TLS ate o RDS nao e exigido pela app hoje (§12) |
| Web (`sep-app`) e PWA/app (`sep-mobile`): SPA estatica; **`apiBaseUrl` fixo em `http://localhost:8080/api/v1` em todos os environments** | `src/environments/*.ts` dos dois repos | nao ha build por ambiente hoje (§12) |
| App Android: WebView com origem `https://localhost` (Capacitor 8, scheme padrao) | conferencia no emulador, M-Sprint 19 | essa origem precisa estar no CORS de todo ambiente que o app acessa |

## 3. Ambientes

| Ambiente | Proposito | Computacao | Banco | Branch/artefato | Providers |
|---|---|---|---|---|---|
| `aws-develop` | integracao remota continua, primeiro deploy manual | EC2 compartilhada com homologacao | RDS proprio (`sep_develop`) | `develop` | Fake/WireMock |
| `homologacao` | validacao funcional antes de producao; sandbox dos providers reais na Frente A | mesma EC2 do `aws-develop`, processo separado | RDS proprio (`sep_hml`) | release candidata promovida do `aws-develop` | sandbox Celcoin/Clicksign quando liberado |
| `producao` | go-live | EC2 propria | RDS proprio, Multi-AZ recomendado (§13) | release aprovada | producao |

- Nomenclatura herdada: `dev-local` e o Docker Compose da maquina; `aws-develop` e o remoto
  (`CONTEXT-PARTE-2.md`, decisoes de 2026-05). O branch `homologacao`, previsto entre `develop` e `main`
  no modelo de branches de 2026-05-06 (`CONTEXT-PARTE-2.md`), so passa a existir quando este ambiente existir.
- Log groups ja definidos pelo ADR 0016: `/sep/dev/sep-api` (30 dias), `/sep/hml/sep-api` (30 dias),
  `/sep/prod/sep-api` (90 dias).
- `APP_ENVIRONMENT` = `dev`, `hml`, `prod` e `APP_VERSION` = tag ou SHA do release, que o JSON de log ja
  carrega.

## 4. Topologia e limite de escala

```text
                 Internet
                    |
          Route 53 (dominios)  ACM (certificados)
                    |
        +-----------+------------+
        |                        |
  CloudFront + S3          ALB https :443   <-- WAF opcional (§13)
  (sep-app, PWA)                 |
                          EC2 sep-api :8080 (subnet privada)
                          CloudWatch Agent, SSM Agent
                          management 127.0.0.1:8081
                                 |
                          RDS PostgreSQL 16 :5432 (subnet privada, sem IP publico)
```

- **VPC por ambiente de producao e VPC compartilhada para `aws-develop`/homologacao** (recomendacao):
  duas AZs de `sa-east-1`, subnets publicas so para ALB e NAT, subnets privadas para EC2 e RDS.
- **NAT**: a app faz chamadas de saida (providers, e-mail, SMS). Um NAT Gateway por VPC e o custo fixo
  mais relevante dos ambientes nao produtivos; alternativa em §13.
- **Uma instancia `sep-api` por ambiente.** Nao e escolha de custo, e limite medido da aplicacao
  (§2): desafios de MFA/step-up em memoria, rate limit por instancia e quatro jobs sem lock distribuido.
  Autoscaling e blue/green com duas instancias vivas **nao** entram ate as pre-condicoes de §12 (itens
  P5 a P7) estarem feitas.
- **Consequencia de uma instancia so**: deploy tem janela curta de indisponibilidade (restart), e um
  login com MFA iniciado antes do restart precisa ser refeito. Declarar na janela de manutencao.
- **EC2 compartilhada (`aws-develop` + homologacao)**: dois servicos `systemd` (`sep-api-dev` em
  `8080`, `sep-api-hml` em `8090`), cada um com seu target group no ALB (host-based routing), seu
  `LOG_PATH` (`/var/log/sep-api-dev`, `/var/log/sep-api-hml`), seu arquivo de agent e seus secrets. Os
  templates `cloudwatch-agent-*.json` hoje apontam para `/var/log/sep-api/application.json` e precisam
  do caminho por servico nessa instancia.

## 5. Configuracao e secrets

**Regra**: nenhum secret em AMI, user-data, repositorio, variavel de workflow em texto ou arquivo
versionado. Valores vivem num servico de secrets por ambiente; a instancia le no start do servico pelo
proprio papel IAM.

| Classe | Variaveis | Onde |
|---|---|---|
| Banco | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | secret por ambiente; senha rotacionavel |
| Tokens e chaves da app | `APP_JWT_SECRET` (>= 256 bits), `APP_TOTP_ENCRYPTION_KEY` (>= 32 bytes) | secret por ambiente; **trocar invalida sessoes e segredos TOTP cifrados** — rotacao exige procedimento proprio |
| Webhooks | `APP_WEBHOOK_SECRET_CELCOIN*`, `APP_WEBHOOK_SECRET_CLICKSIGN` | secret por ambiente e por provider |
| Providers | `APP_CELCOIN_*_CLIENT_ID/SECRET`, `APP_CLICKSIGN_ACCESS_TOKEN`, `APP_NOTIFICACOES_ZENVIA_API_TOKEN` | secret por ambiente; vazio ate a Frente A |
| Seguranca de borda | `APP_TRUSTED_PROXIES`, `APP_CORS_ORIGINS`, `APP_REFRESH_COOKIE_SECURE`, `APP_REFRESH_COOKIE_SAME_SITE`, `APP_REFRESH_COOKIE_DOMAIN` | parametro nao secreto por ambiente |
| Operacao | `SPRING_PROFILES_ACTIVE=prod`, `APP_ENVIRONMENT`, `APP_VERSION`, `LOG_PATH`, `MANAGEMENT_ADDRESS`, `MANAGEMENT_PORT`, `DB_MAX_POOL_SIZE`, `APP_*_PROVIDER` | parametro nao secreto por ambiente |

- **Todo ambiente remoto roda com `SPRING_PROFILES_ACTIVE=prod`**, inclusive `aws-develop`: e o unico
  perfil com datasource sem default local, log JSON e management fechado. O `APP_ENVIRONMENT` diferencia.
- Os defaults de `application.yml` (`placeholder-dev-only...`, `dev-webhook-secret-change-me`) **nao
  podem chegar a nenhum ambiente remoto**. Verificacao no runbook de deploy: o processo sobe sem nenhum
  valor `change-me`/`placeholder` (§7, passo 5).
- Entrega na instancia (recomendacao): script de start do `systemd` que busca os valores por prefixo do
  ambiente (`/sep/<env>/...`) e exporta no ambiente do processo, sem gravar arquivo em disco.
- Parameter Store (SecureString) ou Secrets Manager: decisao de §13.

## 6. Banco, backup e migrations

**RDS PostgreSQL 16**, um por ambiente, sem acesso publico, criptografia em repouso com KMS.

- **Parameter group**: `timezone` alinhado a `America/Sao_Paulo` (a app ja fixa no JDBC, mas consultas
  manuais e `now()` do banco precisam do mesmo fuso para os procedimentos de `NOTIFICACOES.md`);
  `rds.force_ssl = 1` depois de P2 (§12).
- **Conexoes**: `DB_MAX_POOL_SIZE` default 20 por instancia; o caminho de listener `REQUIRES_NEW` usa
  duas conexoes por requisicao. Escolher classe de instancia cujo `max_connections` cubra pool + folga
  para manutencao; medir no `aws-develop` antes de fixar producao.
- **Crescimento**: documentos (ate 12 MB por upload) ficam em tabela. Alarme de espaco livre (§10) e
  autoscaling de storage do RDS ligados desde o inicio.

**Backup e retencao**

| Ambiente | Backup automatico / PITR | Snapshot manual | Observacao |
|---|---|---|---|
| `aws-develop` | 7 dias | antes de migration destrutiva | dados descartaveis |
| homologacao | 7 dias | antes de cada promocao | dados sinteticos ou anonimizados, nunca copia de producao com dado pessoal |
| producao | 35 dias (maximo do RDS) com PITR | antes de **todo** deploy com migration, retido ate o release seguinte estar estavel | restauracao testada antes do go-live (Fase 5 §43 item 4) |

- **Backup nao e retencao legal.** A retencao de 5 anos declarada para notificacoes, PLD, onboarding e
  Open Finance ([`NOTIFICACOES.md`](../repos/sep-api/NOTIFICACOES.md), [`PLD.md`](../repos/sep-api/PLD.md),
  [`ONBOARDING.md`](../repos/sep-api/ONBOARDING.md), [`OPEN-FINANCE.md`](../repos/sep-api/OPEN-FINANCE.md))
  e politica dos dados vivos no banco, com revisao juridica pendente.
  Arquivamento de longo prazo (ex.: export para S3 com object lock) e decisao da Fase 5 ligada a essa
  revisao, nao deste plano.

**Migrations (Flyway)**

- Rodam no boot do `sep-api`; o deploy e a migration sao o mesmo evento. Nao ha job separado.
- **Forward-only**: Flyway Community nao desfaz migration. Rollback de versao da app so e seguro se a
  migration do release for compativel com a versao anterior.
- Regra para migrations a partir do primeiro deploy remoto (recomendacao, formalizar no ADR):
  **expand/contract** — adicionar coluna/tabela num release, passar a usar no seguinte, remover no
  terceiro. Migration que remove ou renomeia objeto usado pela versao anterior exige snapshot e janela
  de manutencao declarada no PR.
- Ensaio obrigatorio: a migration do release roda primeiro no `aws-develop`, depois na homologacao com
  volume representativo, e so entao em producao. A licao de `feedback` do projeto vale remota: ensaio de
  migration precisa provar que rodou (`flyway_schema_history`), nao so que o processo subiu.

## 7. Deploy e rollback

**Artefato**: `sep-api-<versao>.jar` gerado pelo CI a partir de tag, com checksum, guardado em bucket S3
de artefatos por conta (versionado, privado). Web e PWA: `dist`/`www` por ambiente (depende de P1),
publicados no bucket do CloudFront.

**Primeiro deploy (manual, `aws-develop`, documentado passo a passo antes de automatizar)**:

1. Conferir o release: tag, SHA, CI verde, lista de migrations novas.
2. Snapshot manual do RDS se houver migration.
3. Enviar o jar ao bucket e registrar o checksum.
4. Na instancia (via SSM Session Manager, sem SSH): baixar o jar, conferir checksum, trocar o link
   `current` e reiniciar o servico `systemd`.
5. Esperar `GET /actuator/health` = `UP` pelo ALB; conferir no log `Started SepApiApplication`, a versao
   em `APP_VERSION`, `Successfully applied N migrations` ou `Schema "public" is up to date`, e ausencia de
   valor `placeholder`/`change-me` carregado.
6. Smoke do ambiente: login sem MFA e com MFA, uma leitura owner-scoped, um `404` neutro, CORS de uma
   origem web e da origem `https://localhost` do app.
7. Registrar no log do release: versao, horario, migrations aplicadas, resultado do smoke.

**Rollback**

| Situacao | Acao |
|---|---|
| Release sem migration nova | voltar o link `current` para o jar anterior e reiniciar; conferir health |
| Release com migration compativel (expand) | igual ao anterior; a coluna/tabela nova fica sem uso |
| Release com migration incompativel | restaurar o snapshot tirado no passo 2 (perde escrita desde o snapshot) **ou** corrigir para frente; decisao de quem responde pelo ambiente, registrada |
| Falha no boot por migration | o Flyway nao aplica parcialmente dentro de uma migration transacional; conferir `flyway_schema_history`, corrigir e redeployar, ou restaurar snapshot |

- Tempo alvo de rollback de app: minutos (troca de link + restart). Tempo de restauracao de snapshot
  depende do tamanho do banco: **medir no ensaio de homologacao** antes de prometer RTO.

## 8. CI/CD de deploy

Parte dos templates ja versionados em [`ci-pipelines/templates/`](./ci-pipelines/templates/):
`aws-deploy-develop.yml`, `aws-deploy-homologacao.yml` e `aws-deploy-producao.yml`, hoje com
`workflow_dispatch`, `permissions: id-token: write` e `role-to-assume` (OIDC), e com o passo de deploy
propositalmente falhando ate este plano existir.

- **Autenticacao**: GitHub OIDC -> um papel IAM de deploy por ambiente, com trust restrito ao repo, ao
  environment do GitHub e ao ref (`develop` para `aws-develop`, tag de release para homologacao e
  producao). Nenhuma chave de acesso de longa duracao em secret do GitHub.
- **Environments do GitHub**: `aws-develop` (sem aprovacao), `homologacao` (1 aprovador), `producao`
  (2 aprovadores, espera configurada, so a partir de tag).
- **Fluxo do `sep-api`**: job de build (reutiliza o CI existente, gera o jar com a versao) -> upload S3 ->
  `aws ssm send-command` para a instancia do ambiente (script do §7, passos 3 a 5) -> espera health ->
  smoke automatizado minimo (health, versao, um endpoint publico) -> resumo no job.
- **Fluxo do `sep-app` e do PWA**: build com a configuracao do ambiente (P1) -> `aws s3 sync` -> invalidacao
  do CloudFront -> checagem do `index.html` servido.
- **Promocao**: o mesmo artefato (jar e build estatico) sobe de `aws-develop` para homologacao e producao;
  nao se rebuilda por ambiente o que nao depende de ambiente. O build estatico depende (P1), entao para
  os fronts a promocao e do SHA, nao do arquivo.
- **Ordem de ativacao**: `aws-develop` manual -> workflow `aws-develop` -> homologacao manual assistida ->
  workflow homologacao -> producao so apos checklist de go-live da Fase 5.

## 9. Controle de acesso e IAM

**Papeis**

| Papel | Quem assume | Permissoes (minimo) |
|---|---|---|
| `sep-<env>-ec2` (instance profile) | EC2 do ambiente | ler secrets/parametros do prefixo `/sep/<env>/`; ler o bucket de artefatos; escrever nos log groups `/sep/<env>/*`; SSM Agent (Session Manager e Run Command) |
| `sep-<env>-deploy` | GitHub Actions por OIDC | gravar no prefixo do bucket de artefatos; `ssm:SendCommand` so para instancias com tag `sep-env=<env>`; `s3 sync` e invalidacao so do bucket/distribuicao do ambiente |
| `sep-operacao` | pessoas do time, via IAM Identity Center | leitura de logs, metricas e alarmes; Session Manager em `aws-develop`/homologacao |
| `sep-break-glass` | uso excepcional, com MFA e alerta | administrativo, auditado por CloudTrail com alarme em cada uso |

- **Sem SSH e sem porta 22 aberta**: acesso a instancia so por Session Manager, com log de sessao.
- **CloudTrail** em todas as regioes, com bucket de log protegido; **MFA** obrigatorio para humanos;
  conta raiz sem chave de acesso e com alarme de uso.
- Acesso humano a banco de producao: por Session Manager com port forwarding a partir da instancia, com
  usuario de leitura separado do usuario da app. Escrita manual em producao so por procedimento
  documentado (os SQL de recuperacao do `NOTIFICACOES.md` ja sao somente leitura).

**Security groups**

| SG | Entrada | Saida |
|---|---|---|
| ALB | `443` da internet (e `80` so para redirecionar para `443`) | `8080`/`8090` para o SG da app |
| App (EC2) | `8080`/`8090` somente do SG do ALB | `5432` para o SG do RDS; `443` para providers, e-mail, SSM e CloudWatch |
| RDS | `5432` somente do SG da app | nenhuma |

`8081` (management) nao aparece em regra nenhuma: fica em `127.0.0.1` pelo `application-prod.yml`, e o
CloudWatch Agent le arquivo, nao a porta.

## 10. Observabilidade, SNS e alarmes

Base ja decidida no ADR 0016 e descrita no `OBSERVABILIDADE.md`: JSON com `correlationId`, CloudWatch
Agent por ambiente, metric filters `UnhandledException`, `JobFailed` e `Http5xx`, alarmes para topico SNS.
Este plano acrescenta o que so existe com a infra:

| Alarme | Regra inicial | Topico |
|---|---|---|
| `UnhandledException`, `JobFailed`, `Http5xx` | os do `OBSERVABILIDADE.md` | `sep-<env>-alertas` |
| ALB `UnHealthyHostCount` | `>= 1` por 2 minutos | `sep-<env>-alertas` |
| ALB `HTTPCode_ELB_5XX_Count` | `>= 5` em 5 minutos | `sep-<env>-alertas` |
| EC2 `StatusCheckFailed` | `>= 1` | `sep-<env>-alertas` |
| Disco da instancia (metrica do agent) | `> 80%` | `sep-<env>-alertas` |
| RDS `FreeStorageSpace` | `< 20%` do alocado | `sep-<env>-alertas` |
| RDS `CPUUtilization` | `> 80%` por 15 minutos | `sep-<env>-alertas` |
| RDS `DatabaseConnections` | `> 80%` do `max_connections` | `sep-<env>-alertas` |
| AWS Budgets | 80% e 100% do orcamento mensal aprovado | `sep-conta-custos` |
| CloudTrail: uso da conta raiz ou do `sep-break-glass` | qualquer evento | `sep-conta-seguranca` |

- Em `aws-develop` e homologacao, os alarmes notificam por e-mail; em producao, tambem pelo canal de
  plantao definido no go-live.
- SLOs de latencia e disponibilidade continuam pendentes (`OBSERVABILIDADE.md` §Pendencias): **nao criar
  alarme de latencia antes de medir** no `aws-develop`.

## 11. Web, PWA e app nativo

- **Web (`sep-app`) e PWA (`sep-mobile` `www`)**: S3 privado + CloudFront com OAC, HTTPS, fallback de rota
  SPA para `index.html`, cache longo nos assets com hash e curto no `index.html` (recomendacao; alternativa
  em §13).
- **Dominios** (exemplo de forma, nomes a decidir): `app.<dominio>` (web), `m.<dominio>` (PWA),
  `api.<dominio>` (ALB), com o mesmo dominio registravel para o cookie `sep-refresh` com `SameSite=Strict`.
- **CORS por ambiente** (`APP_CORS_ORIGINS`): as origens https do web e da PWA do ambiente, mais
  `https://localhost` (app Android, Capacitor 8) e, quando o iOS existir, `capacitor://localhost`.
- **App nativo**: o `apiBaseUrl` do build Android/iOS aponta para o `api.<dominio>` do ambiente alvo; App
  Links https e publicacao sao a Frente C da Fase 5.

## 12. Pre-condicoes de codigo antes do primeiro deploy remoto

Achados deste plano que precisam de sprint (backend, web ou mobile) **antes** ou **durante** a Frente B.
Nenhum foi corrigido aqui.

| # | Pre-condicao | Por que | Repo | Antes de |
|---|---|---|---|---|
| P1 | `apiBaseUrl` por ambiente no build (ou configuracao em runtime) | os dois fronts apontam para `http://localhost:8080` em todos os environments; o `sep-app` nao tem environment de producao | `sep-app`, `sep-mobile` | primeiro deploy dos fronts |
| P2 | TLS obrigatorio ate o banco (`sslmode=require` ou `verify-full` no datasource de `prod`) | `application-prod.yml` nao exige TLS | `sep-api` | homologacao com dado real |
| P3 | Decidir exposicao do Swagger UI e do `/v3/api-docs` em producao | hoje publicos e ativos em `prod` (`SecurityConfig`) | `sep-api` | producao |
| P4 | Conferir que nenhum default `placeholder`/`change-me` sobe fora de `dev`/`test` (falha no boot) | defaults de `APP_JWT_SECRET`, `APP_TOTP_ENCRYPTION_KEY` e webhooks existem para dev | `sep-api` | homologacao |
| P5 | Lock distribuido (`PostgresAdvisoryJobLock`) nos quatro jobs que nao o usam | duplicacao de efeitos com mais de uma instancia | `sep-api` | qualquer topologia com 2 instancias |
| P6 | Desafios de MFA e step-up fora da memoria (banco) | login com MFA quebra entre instancias e morre no restart | `sep-api` | 2 instancias ou deploy sem janela |
| P7 | Rate limit compartilhado entre instancias, ou limite dividido por instancia documentado | limite efetivo multiplica por N | `sep-api` | 2 instancias |
| P8 | Scan de dependencias no `sep-api` (equivalente ao `npm audit` dos fronts) | follow-up aberto desde a D-Sprint 1 | `sep-api` | producao |
| P9 | `APP_TRUSTED_PROXIES` com a regex das subnets do ALB, provado por teste no `aws-develop` | vazio faz o rate limit enxergar so o IP do ALB | configuracao | `aws-develop` |

P1 a P4 e P8/P9 cabem na propria Fase 5. P5 a P7 so sao exigidas se a decisao de §13 for sair de uma
instancia por ambiente.

## 13. Decisoes para o ADR de deploy/secrets AWS

Candidato desde o `PRD-FASE-4.md` §38. Cada decisao abaixo tem a recomendacao deste plano e o que a
mudaria.

| Decisao | Recomendacao | Alternativa e quando preferir |
|---|---|---|
| Artefato e runtime do `sep-api` | jar + `systemd` na EC2 | imagem de container (ECR + Docker/ECS) se houver mais de um processo por ambiente ou necessidade de imagem imutavel auditavel |
| Hospedagem web/PWA | S3 + CloudFront | nginx na propria EC2 se o custo fixo do CloudFront nao se justificar em `aws-develop`/homologacao |
| Secrets | Parameter Store SecureString | Secrets Manager se a rotacao automatica da senha do RDS for requisito |
| RDS de producao | Multi-AZ | Single-AZ apenas se o RTO aceito cobrir a restauracao medida no ensaio |
| Instancias por ambiente | uma (limite atual da app, §4) | duas ou mais so depois de P5 a P7 |
| NAT nos nao produtivos | NAT Gateway | NAT instance se o custo fixo pesar, aceitando a manutencao |
| WAF no ALB | ligado em producao com regras gerenciadas | desligado em `aws-develop` |
| IaC | escolher uma ferramenta antes do primeiro recurso (ex.: Terraform ou CloudFormation/CDK) | nao provisionar pelo console alem de ensaio descartavel |
| Janela de deploy em producao | janela declarada, por causa da instancia unica | deploy sem janela so com P6 |

## 14. Ordem de execucao na Fase 5 (Frente B)

1. **Gate**: conta AWS aprovada; ADR de deploy/secrets aceito (§13); orcamento mensal definido.
2. Fundacao da conta: Identity Center, MFA, CloudTrail, Budgets, alarmes de conta, bucket de artefatos.
3. IaC da rede e do `aws-develop` (VPC, ALB, EC2, RDS, SGs, papeis, log groups, SNS).
4. Sprint de pre-condicoes P1, P2, P4 e P9, com smoke local.
5. Primeiro deploy **manual** no `aws-develop` pelo runbook do §7, com o CloudWatch Agent validado (pendencia
   do `OBSERVABILIDADE.md`).
6. Workflow `aws-deploy-develop.yml` promovido e verde.
7. Homologacao: RDS proprio, ensaio de restauracao de snapshot com tempo medido, deploy manual assistido,
   depois workflow.
8. Frente A (providers reais em sandbox) sobre homologacao.
9. P3 e P8 fechados; checklist de go-live (Fase 5 §43 item 4) com backup/rollback testados; producao.

## 15. Rastreabilidade

| Exigencia do Epic 16 (`PRD-FASE-4.md` §35) | Secao |
|---|---|
| Arquitetura de ambientes remotos (EC2, RDS fora da EC2, `sa-east-1`, `aws-develop`/homologacao compartilhados, producao propria) | §3, §4 |
| Secrets, rollback, backup, migrations Flyway e controle de acesso | §5, §6, §7, §9 |
| CI/CD de deploy a partir dos templates, com deploy manual documentado primeiro | §7, §8, §14 |
| IAM, SNS e alarmes desenhados | §9, §10 |
