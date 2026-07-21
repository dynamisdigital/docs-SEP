# Arquitetura do SEP

## Finalidade

Este documento descreve a arquitetura implementada do SEP e serve de guia de leitura para o
diagrama interativo [`ARQUITETURA-SEP.html`](./ARQUITETURA-SEP.html).

O conteudo reflete o codigo em `sep-api`, `sep-app` e `sep-mobile` na data de geracao, nao o
planejamento. Quando codigo e PRD divergem, este documento registra a diferenca na secao
[Divergencias entre PRD e codigo](#divergencias-entre-prd-e-codigo). Para requisitos e escopo por
fase, leia o [`PRD.md`](./PRD.md). As ADRs prevalecem sobre este documento conforme o
[`AGENT.md`](../AGENT.md).

Data de geracao: 21 de julho de 2026.

## Como ler o diagrama

Abra `ARQUITETURA-SEP.html` em qualquer navegador. O arquivo e autocontido e nao depende de rede.

O diagrama tem cinco capitulos guiados que isolam uma leitura de cada vez:

1. **Entrada autenticada** mostra como web e mobile atravessam o perimetro de seguranca.
2. **Jornada do tomador** segue onboarding, credito, formalizacao e cobranca.
3. **Credora, Pix e escrow** cobre aporte, movimentacao financeira e segregacao patrimonial.
4. **Integracoes externas** detalha o Provider Pattern e os provedores reais.
5. **Operacao e dados** mostra jobs, fila operacional, persistencia e observabilidade.

Atalhos uteis dentro do diagrama:

| Tecla | Acao |
|---|---|
| `?` | Abre o guia com todas as acoes disponiveis |
| `/` | Busca um componente por nome, responsabilidade ou tag |
| `R` | Traca a rota mais curta entre dois componentes |
| `L` | Compara categorias de componente e conta as relacoes |
| `M` | Abre o mapa geral para navegar um diagrama grande |
| `F` | Entra em modo de apresentacao |

O menu de exportacao gera PNG, JPEG, WebP e SVG. O SVG exportado carrega os dois temas.

## Visao geral

O SEP e um monolito modular orientado a DDD, com Hexagonal aplicado dentro de cada modulo
(ADR [0001](../adr/0001-monolito-modular-orientado-a-ddd.md) e
[0007](../adr/0007-ddd-com-hexagonal-ports-and-adapters-por-modulo.md)). Um unico deploy e um
unico banco atendem todos os modulos.

O produto ocupa quatro repositorios independentes:

| Repositorio | Papel | Stack verificada |
|---|---|---|
| `sep-api` | Backend, regra de negocio e integracoes | Java 21, Spring Boot 3.5.5, Gradle |
| `sep-app` | Console web para todas as personas | Angular 20.3, SCSS puro |
| `sep-mobile` | App do tomador e da credora | Angular 20.3, Ionic 8.8, Capacitor 8.4 |
| `docs-SEP` | PRD, ADRs, specs e steps | Markdown |

Nenhum modulo do backend contem cache dedicado ou message broker. O trabalho assincrono usa
eventos de dominio do Spring no proprio processo.

## Camadas do backend

Cada modulo repete a mesma convencao de quatro pastas:

| Pasta | Conteudo |
|---|---|
| `domain` | Entidades, value objects, eventos e excecoes, sem dependencia de framework |
| `application` | Use cases, services, listeners, jobs e as portas de saida em `port/out` |
| `infrastructure` | Adapters de provedor, repositorios JPA e configuracao |
| `web` | Controllers REST, DTOs e mappers MapStruct |

O lado de entrada nao usa portas. Os controllers dependem das classes `*UseCase` diretamente, o
que significa que a inversao de dependencia vale para a saida, nao para a entrada.

### Adapters de entrada

| Adapter | Escala atual | Observacao |
|---|---|---|
| REST `/api/v1` | 32 controllers | Versionamento fixo no path |
| Webhook Receiver | `/api/v1/webhooks/{provider}/{event}` | HMAC-SHA256, idempotencia e outbox |
| Jobs agendados | 5 jobs `@Scheduled` | Lock distribuido por advisory lock do PostgreSQL |
| Eventos de dominio | 28 listeners | `AFTER_COMMIT` com `REQUIRES_NEW` |

Todos os jobs rodam no fuso `America/Sao_Paulo`.

## Modulos de dominio

O backend tem 12 modulos de dominio e um kernel `shared`.

| Modulo | Responsabilidade | Use cases |
|---|---|---|
| `identity` | Autenticacao, JWT, MFA TOTP e step-up | 11 |
| `usuarios` | Cadastro, perfil e atribuicao de roles | 6 |
| `governanca` | Parametros operacionais versionados e auditaveis | 3 |
| `onboarding` | KYC de pessoa fisica, KYB de pessoa juridica e PLD | 13 |
| `credito` | Proposta, motor de regras e enriquecimento por Open Finance | 12 |
| `contratos` | Geracao da CCB, aceite e assinatura digital | 9 |
| `cobranca` | Parcelas, atraso, recuperacao e renegociacao | 14 |
| `credores` | Oportunidades, interesse, aporte, matching e carteira | 20 |
| `pix` | Chaves, desembolso, recebimento e conciliacao | 13 |
| `escrow` | Conta escrow, wallets e movimentacoes | 2 |
| `backoffice` | Fila operacional, pendencias, excecoes e reprocessos | 9 |
| `financeiro` | Conciliacao e controles internos | 0 |

Dois modulos fogem do padrao de exposicao:

- `escrow` nao tem camada `web`. Outros modulos o alcancam por adapters internos em
  `cobranca`, `credores` e `pix`.
- `financeiro` existe apenas como estrutura de pacotes. Veja
  [Divergencias entre PRD e codigo](#divergencias-entre-prd-e-codigo).

Os modulos nao acessam repositorios uns dos outros. A comunicacao entre modulos passa por adapters
de anticorrupcao em `infrastructure/adapter/<modulo>` ou por eventos de dominio.

## Integracoes externas

Toda saida externa segue o Provider Pattern
(ADR [0004](../adr/0004-provider-pattern-para-integracoes-externas.md)): uma porta em
`application/port/out`, uma implementacao fake e um adapter real. A escolha acontece por
propriedade de ambiente, nunca por mudanca de codigo em runtime
(ADR [0017](../adr/0017-feature-flags-de-providers-por-ambiente.md)).

| Capacidade | Porta | Provedor real | Flag |
|---|---|---|---|
| KYC pessoa fisica | `KycProvider` | Celcoin | `APP_KYC_PROVIDER` |
| KYB pessoa juridica | `KybProvider` | Celcoin | `APP_KYB_PROVIDER` |
| PLD e background check | `BackgroundCheckProvider` | Celcoin | `APP_PLD_PROVIDER` |
| Open Finance | `OpenFinanceProvider` | Celcoin | `APP_OPEN_FINANCE_PROVIDER` |
| Pix | `PixProvider` | Celcoin | `APP_PIX_PROVIDER` |
| Escrow | `EscrowProvider` | Celcoin | `APP_ESCROW_PROVIDER` |
| Assinatura digital | `AssinaturaDigitalProvider` | Clicksign | `APP_ASSINATURA_PROVIDER` |
| Notificacoes | `NotificationProvider` | Zenvia e SMTP | `APP_NOTIFICACOES_PROVIDER` |
| Senha vazada | `PasswordBreachChecker` | Have I Been Pwned | — |

A Celcoin responde por seis APIs distintas, cada uma com seu proprio provedor de token OAuth2 e
suas proprias propriedades. A assinatura digital fica com a Clicksign
(ADR [0013](../adr/0013-provedor-de-assinatura-digital.md)) e as notificacoes seguem a
ADR [0014](../adr/0014-estrategia-de-notificacoes-transacionais.md).

Toda chamada de saida passa por `RestClient` com Resilience4j configurado para retry, circuit
breaker e timeout. Os testes de integracao dos adapters usam WireMock
(ADR [0008](../adr/0008-wiremock-para-testes-integracao-celcoin.md)).

Os callbacks chegam pelo Webhook Receiver, que valida assinatura HMAC-SHA256 e registra o evento
em outbox antes de processar.

## Persistencia

O sistema usa um unico PostgreSQL 16, com 54 repositories Spring Data e 59 migrations Flyway
versionadas de `V1` a `V59`. Nao ha migrations repetiveis nem Liquibase.

Convencoes em vigor:

- Identificadores UUID v6 no tipo nativo `uuid`.
- Snapshots de Open Finance em colunas JSONB.
- Nomes de tabelas e colunas em portugues.
- Sem exclusao fisica de registros nesta fase.

## Seguranca transversal

A cadeia de filtros roda sem sessao e na ordem `RateLimitFilter`, `JwtAuthenticationFilter` e
`PasswordResetEnforcementFilter`.

| Mecanismo | Implementacao |
|---|---|
| Access token | JWT de 15 minutos com claims `sub`, `email` e `roles` |
| Refresh token | Rotativo, 30 dias, hash SHA-256, com deteccao de reuso por familia |
| MFA | TOTP conforme RFC 6238, com codigos de backup |
| Step-up | `@RequireStepUp` e `@RequireStepUpEstrito` aplicados por aspect |
| Bloqueio | Lockout por tentativas e rate limiting por origem |

As roles sao cumulativas. O enum tem exatamente quatro valores: `ADMIN`, `FINANCEIRO`,
`BACKOFFICE` e `CLIENTE`, nessa ordem de precedencia para a role principal. `BACKOFFICE` nao
implica `FINANCEIRO`.

A autorizacao combina role e verificacao de posse do recurso no modulo dono do dado.

## Conformidade

A Resolucao CMN 4.656/2018 e a LGPD tem efeito direto no desenho:

- A segregacao patrimonial obrigatoria justifica a existencia do modulo `escrow`
  (ADR [0005](../adr/0005-segregacao-patrimonial-via-conta-escrow.md)).
- O PLD consulta COAF, OFAC, INTERPOL e MTE durante o onboarding.
- A tabela `audit_log_seguranca` registra cerca de 88 tipos de evento e cresce por migration.
- O sanitizer de Open Finance opera em modo fail-closed e o CPF de representante legal aparece
  sempre mascarado nas respostas.

A auditoria regulatoria e a observabilidade operacional sao mecanismos separados, com retencao e
acesso proprios. Veja [`OBSERVABILIDADE.md`](./OBSERVABILIDADE.md) e
[`SEGURANCA.md`](./SEGURANCA.md).

## Observabilidade

O backend expoe apenas `health`, `info` e `prometheus` no Actuator, protegidos por configuracao
propria. Os logs saem em JSON com `correlationId` propagado por MDC e ecoado no header
`X-Correlation-Id`. Nao ha tracing distribuido implementado
(ADR [0016](../adr/0016-observabilidade-operacional-cloudwatch.md)).

## Clientes

Web e mobile compartilham a mesma forma de shell: rotas publicas, uma area autenticada em `/app` e
um showcase de design system. Os dois usam o mesmo conjunto de interceptors, com os headers
`Authorization`, `Idempotency-Key`, `X-Correlation-Id`, `X-Step-Up-Token` e `X-Client-Channel`.

O web atende as cinco personas e protege `/app/pix`, `/app/backoffice` e `/app/admin` por role. O
mobile atende apenas tomador e credora, e organiza as features por persona em vez de dominio. A
credora autentica como `CLIENTE` no mobile, o que exclui do app qualquer contrato que exija
`FINANCEIRO` ou `ADMIN`.

O empacotamento nativo cobre Android
(ADR [0019](../adr/0019-baseline-capacitor-8-mobile.md)). O iOS depende de hardware macOS e
continua pendente.

## Divergencias entre PRD e codigo

Estas diferencas valem follow-up. O diagrama tambem as registra em um card dedicado.

| Item | PRD descreve | Codigo tem |
|---|---|---|
| Modulo `financeiro` | Contexto delimitado de conciliacao | Apenas `package-info.java` nas quatro camadas |
| Open Finance | Celcoin via Finansystech | Nenhum adapter Finansystech; so Celcoin |
| Providers externos | Ativacao por ambiente | Todos com default `fake` ou `log` em `application.yml` |
| `escrow` | Modulo transversal consumido por varios | Sem superficie REST, so por adapters internos |
| Hexagonal | Ports and adapters nos dois lados | Sem `port/in`; controllers usam `*UseCase` concreto |
| Ambiente de producao dos clientes | Backend remoto | `environment.prod.ts` aponta `localhost:8080` nos dois apps |

Os dois ultimos itens tem impacto operacional. Um build de producao de web ou mobile hoje aponta
para `localhost` e falha em dispositivo real.

## Como regenerar o diagrama

O arquivo `ARQUITETURA-SEP.architecture.json` e a fonte. O HTML e artefato derivado.

1. Edite `ARQUITETURA-SEP.architecture.json`.
2. Renderize o HTML:

   ```bash
   node ~/.claude/skills/archify/bin/archify.mjs render architecture \
     docs-sep/ARQUITETURA-SEP.architecture.json \
     docs-sep/ARQUITETURA-SEP.html
   ```

3. Valide a composicao antes de publicar:

   ```bash
   node ~/.claude/skills/archify/bin/archify.mjs check docs-sep/ARQUITETURA-SEP.html
   ```

O comando de validacao deve terminar com `"ok": true`. Um aviso de `proper-crossing` e aceitavel
no perfil `standard` e indica apenas duas linhas que se cruzam.

## Referencias

- [`PRD.md`](./PRD.md) — indice do PRD por fase
- [`CONTEXT-PARTE-1.md`](./CONTEXT-PARTE-1.md) e [`CONTEXT-PARTE-2.md`](./CONTEXT-PARTE-2.md) —
  contexto tecnico detalhado
- [`SEGURANCA.md`](./SEGURANCA.md) — controles de seguranca e follow-ups
- [`OBSERVABILIDADE.md`](./OBSERVABILIDADE.md) — logging, correlacao e incidentes
- [`PAPEL-DA-CELCOIN-NO-SEP.md`](./PAPEL-DA-CELCOIN-NO-SEP.md) — matriz de capacidade por provedor
- [`AGENT.md`](../AGENT.md) — precedencia entre ADRs, specs e docs operacionais
- [`adr/`](../adr/) — decisoes arquiteturais
