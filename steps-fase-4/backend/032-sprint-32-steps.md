# Steps - Sprint 32 - Consolidacao dos adapters externos skeleton

**Spec de origem**: [`032-sprint-32-adapters-celcoin-skeleton.md`](../../specs/fase-4/032-sprint-32-adapters-celcoin-skeleton.md)

**Status**: planejada (Fase 4, Epic 15; preparacao gated para a Frente A da Fase 5). Nenhum
adapter externo sera ativado contra rede real nesta sprint.

**Objetivo geral**: consolidar e endurecer os adapters HTTP skeleton ja existentes para KYC/KYB,
PLD, assinatura, Pix e escrow; uniformizar a selecao por provider/ambiente; completar a cobertura
WireMock de sucesso, erro de negocio, timeout e resiliencia; registrar a estrategia em ADR e
documentar a ativacao gated da Fase 5.

**Esforco total estimado**: 3-4 dias de Dev Senior Backend.

**Repos de destino**:
- `sep-api`: apenas hardening de adapters/configuracao/testes; sem dominio, REST ou migration nova.
- `docs-SEP`: ADR 0017, documento operacional de integracoes/providers, docs dos modulos,
  `AI-ROADMAP.md`, PRD/STATE/historico no fechamento e PR description; Git manual.

**Branch sugerida**: `feature/sprint-32-adapters-externos-skeleton`.

## Baseline real

A Sprint 32 nao parte do zero:

| Capacidade | Port | Fake default | Adapter HTTP | Teste WireMock |
|---|---|---|---|---|
| KYC | `KycProvider` | `FakeKycProvider` | `CelcoinKycProvider` | `CelcoinKycProviderIT` |
| KYB | `KybProvider` | `FakeKybProvider` | `CelcoinKybProvider` | `CelcoinKybProviderIT` |
| PLD | `BackgroundCheckProvider` | `FakeBackgroundCheckProvider` | `CelcoinBackgroundCheckProvider` | `CelcoinBackgroundCheckProviderIT` |
| Assinatura | `AssinaturaDigitalProvider` | `FakeAssinaturaDigitalProvider` | `ClicksignAssinaturaDigitalProvider` | `ClicksignAssinaturaDigitalProviderIT` |
| Pix | `PixProvider` | `FakePixProvider` | `CelcoinPixProvider` | `CelcoinPixProviderIT` |
| Escrow | `EscrowProvider` | `FakeEscrowProvider` | `CelcoinEscrowProvider` | `CelcoinEscrowProviderIT` |

Implementar somente gaps comprovados no inventario da Task 32.1. Nao recriar ports, adapters,
OAuth clients ou testes que ja cumprem o contrato.

## Decisao vinculante sobre assinatura

O ADR [`0013`](../../adr/0013-provedor-de-assinatura-digital.md) escolheu **Clicksign** como
provedor primario de assinatura e prevalece sobre a mencao generica a "assinatura Celcoin" na spec.

- Consolidar o skeleton Clicksign existente e manter `app.assinatura.provider=fake|clicksign`.
- Nao criar `CelcoinAssinaturaDigitalProvider`, DTO Celcoin de assinatura ou valor `celcoin` na
  property.
- Se produto decidir adicionar/trocar para Celcoin, criar primeiro ADR que substitua/estenda o 0013
  e obter aprovacao explicita.

## Escopo consolidado

### Em escopo

- Inventario verificavel de ports, adapters, flags, OAuth, resiliencia e testes atuais.
- Hardening cirurgico apenas onde houver gap.
- Feature flags por capacidade/ambiente usando as properties existentes.
- Fake default em dev/test e fail-fast quando adapter HTTP for selecionado sem configuracao.
- WireMock para sucesso, 4xx de negocio, 5xx, timeout, malformed response e headers relevantes.
- Retry somente para falhas transientes; 4xx nao reentra.
- Fixtures WireMock reutilizaveis e profile `local-wiremock` sem credenciais reais.
- ADR 0017 e procedimento de ativacao gated da Fase 5.

### Fora de escopo

- Credenciais, sandbox ou rede real Celcoin/Clicksign.
- Ativar adapter HTTP por default em qualquer ambiente.
- Alterar dominio, use case consumidor, REST, webhook publico ou regra de negocio.
- Criar provider Celcoin de assinatura contrariando o ADR 0013.
- Open Finance, CCB provider novo, aporte real, provisionamento escrow ou conciliacao real.
- Certificar os contratos skeleton contra APIs reais; isso pertence a Fase 5.

## Decisoes tecnicas

- Manter o Provider Pattern do ADR 0004; DTO externo fica restrito a `infrastructure`.
- Manter flags independentes: `app.kyc.provider`, `app.kyb.provider`, `app.pld.provider`,
  `app.assinatura.provider`, `app.pix.provider` e `app.escrow.provider`.
- `matchIfMissing=true` somente no fake. Adapter HTTP exige selecao explicita.
- Ambientes: dev/test=`fake`; `local-wiremock`=adapter HTTP apontando para localhost;
  aws-develop/homolog/prod=real apenas quando a Fase 5 liberar gate e secrets.
- Reusar `RestClientFactory`, OAuth/token cache, correlation id, idempotency key e Resilience4j.
- Retry apenas em timeout/I/O e 5xx; 4xx e parsing invalido falham uma vez.
- Nenhuma migration e esperada. Se surgir necessidade de schema, interromper e pedir aprovacao.

## Protocolo obrigatorio por Task

1. Executar somente a Task liberada.
2. Confirmar o gap antes de editar; ausencia de gap significa manter o codigo.
3. Escrever/ajustar teste de adapter antes do hardening.
4. Nao refatorar use cases ou dominio consumidores.
5. Rodar testes do adapter e `./gradlew spotlessCheck` por task.
6. Confirmar fake default e zero rede real em toda task.
7. Parar em checkpoint pre-commit; aguardar aprovacao antes de staging/commit.
8. Usar paths especificos no staging; nunca `git add -A`.

**Skills/guidelines da implementacao**:
- `coding-guidelines`: inventario antes de codigo, simplicidade e mudancas cirurgicas.
- `clean-code`: nomes intencionais, erros sanitizados e testes F.I.R.S.T.
- clean architecture: dominio/application dependem apenas do port.
- `design-patterns-java`: evoluir o Adapter/Provider existente; rejeitar pattern-itis.

## Ordem de execucao

```text
32.0 prechecks e conflito ADR/spec
  -> 32.1 inventario e matriz de gaps
  -> 32.2 ADR 0017 + feature flags/fail-fast
  -> 32.3 hardening KYC/KYB/PLD
  -> 32.4 hardening assinatura Clicksign
  -> 32.5 hardening Pix/escrow
  -> 32.6 fixtures WireMock + local-wiremock + guard sem rede
  -> 32.7 regressao, docs e fechamento
```

---

## Gate 32.0 - Prechecks e alinhamento arquitetural

### Step 032.0.1 - Confirmar cadeia Git

```bash
cd <sep-api-root>
git fetch --all --prune
git status --short --branch
git log --oneline --decorate -15 origin/develop
git log --oneline --decorate -15 origin/main
git diff --stat origin/main..origin/develop
git diff --stat origin/develop..origin/main
```

**Verificacao**:
- Sprint 31 presente em `origin/develop`.
- Se ainda nao estiver em `main`, registrar pendencia e nao iniciar codigo sem aprovacao explicita.
- Findings do review da Sprint 31 (corrida/orfao, retencao da chave no fake e CPF/CNPJ) corrigidos
  na baseline ou registrados como bloqueio.
- Working tree limpo ou mudancas do usuario identificadas e preservadas.

### Step 032.0.2 - Criar branch

```bash
cd <sep-api-root>
git switch develop
git pull --ff-only
git switch -c feature/sprint-32-adapters-externos-skeleton
```

Depois de confirmar que `SPRINT-31-PR.md` foi consumido, remove-lo de `docs-SEP`. Nao remover antes.

### Step 032.0.3 - Reconfirmar ADRs e zero rede

Ler ADRs 0004, 0008 e 0013, spec 032 e PRD-FASE-5 Frente A. Seguir Clicksign; qualquer adapter
Celcoin de assinatura exige novo ADR aprovado.

```bash
cd <sep-api-root>
grep -R -n "https://" src/test src/main/resources/application*.yml
grep -R -n "DynamicPropertySource\|WireMockExtension\|base-url" \
  src/test/java/com/dynamis/sep_api/{onboarding,contratos,pix,escrow}
```

Confirmar que ITs sobrescrevem base URL para localhost e que nao ha credencial real versionada.

### Step 032.0.4 - Baseline

```bash
./gradlew check
./gradlew bootJar
```

### Definicao de pronto do Gate 32.0

- [ ] Sprint 31 integrada e findings fechados ou bloqueio registrado.
- [ ] Divergencia develop/main ausente ou aprovada.
- [ ] ADR 0013 preservado.
- [ ] Zero rede/credencial real confirmado.
- [ ] Baseline verde ou falha preexistente documentada.

---

## Task 32.1 - Inventario e matriz de gaps

**Objetivo**: produzir uma lista fechada de gaps antes de codigo.

**Esforco**: 0,5 dia.

### Step 032.1.1 - Inventariar

```bash
grep -R -n -E "interface .*Provider|class (Fake|Celcoin|Clicksign).*Provider" \
  src/main/java/com/dynamis/sep_api/{onboarding,contratos,pix,escrow}
grep -R -n -E "ConditionalOnProperty|app\..*provider" \
  src/main/java/com/dynamis/sep_api/{onboarding,contratos,pix,escrow} src/main/resources
find src/test/java/com/dynamis/sep_api/{onboarding,contratos,pix,escrow} \
  -type f -name "*ProviderIT.java" | sort
```

Por capacidade, registrar port/metodos, fake, adapter, property, credenciais/fail-fast, endpoints,
DTOs, OAuth, correlation/idempotencia, retry/CB/timeout e testes existentes.

### Step 032.1.2 - Criar matriz

```text
capacidade x [sucesso, 4xx, 5xx, timeout, malformed, retry count,
              circuit breaker, auth, correlation, idempotency,
              sanitizacao, fake default, fail-fast]
```

Marcar `COBERTO`, `GAP` ou `NAO_APLICAVEL`, sempre com arquivo/teste como evidencia. A matriz vira
secao de `INTEGRACOES-PROVIDERS.md`.

### Definicao de pronto da Task 32.1

- [ ] Seis capacidades inventariadas.
- [ ] Gaps separados de comportamento ja coberto.
- [ ] Clicksign registrado como decisao vinculante.
- [ ] Open Finance e capacidades adjacentes fora do escopo.

### Commit sugerido

```text
docs(integracoes): mapear skeletons de providers
```

---

## Task 32.2 - ADR 0017 e feature flags por ambiente

**Objetivo**: formalizar selecao/ativacao sem trocar properties nem ligar adapter acidentalmente.

**Esforco**: 0,5-1 dia.

### Step 032.2.1 - Escrever ADR 0017

Criar `adr/0017-feature-flags-de-providers-por-ambiente.md` com:
- flags independentes, valores aceitos e defaults.
- matriz dev/test, local-wiremock, aws-develop, homologacao e producao.
- precedencia do ADR 0013 (`assinatura=fake|clicksign`).
- fail-fast para valor desconhecido/configuracao ausente.
- rollback gated e proibicao de fallback silencioso em producao.
- rejeicao de flag global `celcoin.enabled`.

### Step 032.2.2 - Testar wiring

Com `ApplicationContextRunner` ou teste de boot pequeno, cobrir:
- property ausente seleciona exatamente um fake.
- valor externo seleciona exatamente o adapter.
- valor desconhecido falha de forma clara.
- adapter sem credenciais falha sem expor segredo.
- fake nao instancia OAuth nem exige credencial.
- Clicksign fica separado de Celcoin.

### Step 032.2.3 - Ajustar somente gaps

Manter nomes atuais. Se valor desconhecido hoje apenas deixa port sem bean, adicionar validacao de
configuracao com mensagem clara; nao criar factory especulativa.

### Verificacao

```bash
./gradlew test --tests "*Provider*Config*Test" --tests "*Provider*Wiring*Test" --tests "*SmokeBootTest"
./gradlew spotlessCheck
```

### Definicao de pronto da Task 32.2

- [ ] ADR 0017 registra flags, gates e rollback.
- [ ] Fake default comprovado.
- [ ] Selecao externa explicita e fail-fast.
- [ ] Dev/test nao ativam adapter externo.

### Commit sugerido

```text
feat(integracoes): endurecer selecao de providers
```

---

## Task 32.3 - Hardening KYC, KYB e PLD

**Objetivo**: fechar somente gaps dos adapters Celcoin de onboarding/PLD.

**Esforco**: 0,5-1 dia.

### Step 032.3.1 - Completar testes primeiro

Por adapter, cobrir gaps entre:
- sucesso e mapeamento de estados/campos.
- 4xx sem retry; 5xx/I/O/timeout com tentativas exatas.
- resposta vazia/malformada/status desconhecido.
- Bearer, correlation e idempotencia quando aplicavel.
- erro/log sem CPF, CNPJ, nome, documento ou payload bruto.
- circuit breaker sem compartilhar estado indevido entre capacidades.

### Step 032.3.2 - Hardening minimo

- Excluir 4xx e parsing do retry.
- Reusar excecoes, mappers e OAuth/token provider atuais.
- Validar resposta no adapter; nao ampliar payload restrito/REST/audit.
- Nao alterar ports/use cases.

### Verificacao

```bash
./gradlew test \
  --tests "*CelcoinKycProviderIT" \
  --tests "*CelcoinKybProviderIT" \
  --tests "*CelcoinBackgroundCheckProviderIT" \
  --tests "*CelcoinOAuthTokenProviderIT" \
  --tests "*CelcoinOAuthCrossProviderIT"
./gradlew spotlessCheck
```

### Definicao de pronto da Task 32.3

- [ ] Gaps fechados sem alterar consumidor.
- [ ] 4xx nao reentra; timeout/5xx seguem politica testada.
- [ ] OAuth e dados sensiveis isolados.
- [ ] Fakes continuam default.

### Commit sugerido

```text
test(onboarding): consolidar skeletons Celcoin
```

---

## Task 32.4 - Hardening da assinatura Clicksign

**Objetivo**: consolidar assinatura externa respeitando o ADR 0013.

**Esforco**: 0,5 dia.

### Step 032.4.1 - Completar cobertura

Reconfirmar port/fake/adapter/webhook e cobrir gaps de:
- envio com Bearer e `Idempotency-Key`.
- estados suportados e desconhecidos.
- download, 404 e corpo vazio.
- 4xx sem retry; 5xx/timeout com retry.
- malformed response e erro sem PDF, token, signatario ou body cru.
- fail-fast de `provider=clicksign` sem configuracao.

### Step 032.4.2 - Hardening minimo

Reusar `clicksign-assinatura`, excecoes e mappers existentes. Nao criar adapter Celcoin, factory ou
segundo webhook.

### Verificacao

```bash
./gradlew test --tests "*ClicksignAssinaturaDigitalProviderIT" \
  --tests "*FakeAssinaturaDigitalProviderTest" \
  --tests "*AssinaturaWebhookControllerTest"
./gradlew spotlessCheck
```

### Definicao de pronto da Task 32.4

- [ ] Sucesso, negocio, timeout e malformed cobertos.
- [ ] Politica 4xx/5xx uniforme.
- [ ] Fake default.
- [ ] ADR 0013 atendido sem adapter Celcoin de assinatura.

### Commit sugerido

```text
test(contratos): consolidar skeleton Clicksign
```

---

## Task 32.5 - Hardening Pix e escrow

**Objetivo**: fechar gaps financeiros sem ativar dinheiro real ou alterar Sprints 19-21/29/31.

**Esforco**: 0,5-1 dia.

### Step 032.5.1 - Matriz Pix

Para transferencia, consulta, cobranca e chaves, cobrir:
- request/response e headers OAuth/correlation/idempotencia.
- 4xx sem retry; 5xx/timeout com retry exato.
- resposta vazia, id ausente e status desconhecido.
- DELETE de chave 404 idempotente sem retry.
- chave/payload/body nunca em log, exception, audit ou DTO de application.

### Step 032.5.2 - Matriz escrow

Para conta/wallet, cobrir criacao/consulta, status/moeda/valor, 4xx, 5xx, timeout, malformed,
OAuth, correlation/idempotencia e sanitizacao.

### Step 032.5.3 - Hardening minimo

- Fechar follow-up de retry predicate em `celcoin-pix`/`celcoin-escrow` (4xx nao reentra).
- Manter ports/DTOs SEP salvo bug comprovado.
- Nao provisionar `externalId`, executar aporte real ou criar use case.
- Nao tocar REST/webhook/dominio financeiro.

### Verificacao

```bash
./gradlew test --tests "*CelcoinPixProviderIT" --tests "*CelcoinEscrowProviderIT" \
  --tests "*FakePixProviderTest" --tests "*FakeEscrowProviderTest"
./gradlew spotlessCheck
```

### Definicao de pronto da Task 32.5

- [ ] Sucesso, 4xx, 5xx, timeout e malformed cobertos.
- [ ] Retry apenas transiente.
- [ ] Zero vazamento financeiro.
- [ ] Nenhuma movimentacao real/regra nova.

### Commit sugerido

```text
test(financeiro): consolidar skeletons Pix e escrow
```

---

## Task 32.6 - Fixtures WireMock, profile local e guard sem rede

**Objetivo**: tornar stubs reutilizaveis e garantir operacao local sem rede/credenciais.

**Esforco**: 0,5-1 dia.

### Step 032.6.1 - Fixtures

```text
src/test/resources/wiremock/
  onboarding/{mappings,__files}/
  assinatura/{mappings,__files}/
  pix/{mappings,__files}/
  escrow/{mappings,__files}/
```

- Sem CPF/CNPJ/nome/chave/token real; ids claramente ficticios.
- Fixtures de sucesso/negocio/timeout; retry dinamico pode ficar inline se mais claro.
- Declarar que sao skeletons locais, nao capturas certificadas.

### Step 032.6.2 - Profile `local-wiremock`

Criar/ajustar `application-local-wiremock.yml` somente se nao houver equivalente:
- base URLs em localhost.
- credenciais ficticias aceitas pelo stub OAuth.
- adapters HTTP selecionados explicitamente.
- nunca herdado automaticamente por dev/test/prod.

Documentar WireMock standalone e smoke local por capacidade.

### Step 032.6.3 - Guard automatizado

Falhar se IT externo nao aponta para localhost/WireMock, fixture contem host/segredo real, profile
test deixa de usar fake ou contexto cria mais de um bean por port. Preferir teste de wiring a busca
fragil de strings.

### Verificacao

```bash
./gradlew test --tests "*Provider*IT" --tests "*NoExternalNetwork*" --tests "*SmokeBootTest"
./gradlew spotlessCheck
```

### Definicao de pronto da Task 32.6

- [ ] Fixtures por capacidade.
- [ ] local-wiremock opt-in e somente localhost.
- [ ] Guard impede rede/credencial real.
- [ ] Dev/test sobem com fakes.

### Commit sugerido

```text
test(integracoes): consolidar fixtures WireMock
```

---

## Task 32.7 - Regressao, documentacao e fechamento

**Objetivo**: provar zero mudanca de produto e preparar a ativacao gated da Fase 5.

**Esforco**: 0,5 dia.

### Step 032.7.1 - Suite final

```bash
./gradlew test --tests "*Celcoin*ProviderIT" --tests "*Clicksign*ProviderIT"
./gradlew test --tests "*Fake*ProviderTest"
./gradlew spotlessCheck
./gradlew check
./gradlew bootJar
```

Confirmar zero internet, credencial real ou WireMock standalone externo ao processo de teste.

### Step 032.7.2 - Invariantes

- Zero mudanca REST/OpenAPI funcional, migration ou dominio/regra.
- Fake default em dev/test.
- Zero secret, PII, chave Pix, PDF ou payload bruto em log/erro/fixture.
- Clicksign permanece assinatura decidida.

### Step 032.7.3 - Atualizar docs

- Criar `repos/sep-api/INTEGRACOES-PROVIDERS.md`: matriz, flags, fixtures, smoke local, ativacao e
  rollback gated.
- Linkar em `repos/sep-api/README.md`; ajustar `ONBOARDING.md`, `PLD.md`, `CONTRATOS.md` e `PIX.md`
  sem duplicar a matriz.
- Criar ADR 0017 e atualizar `AI-ROADMAP.md`.
- Criar `repos/sep-api/SPRINT-32-PR.md`.
- Atualizar `STATE.md`, `CONTEXT-PARTE-2.md` e `PRD-FASE-4.md` no fechamento/merge.

Procedimento Fase 5 por capacidade:
1. credencial sandbox liberada;
2. skeleton confrontado com documentacao real;
3. smoke sandbox controlado;
4. observabilidade/auditoria verificadas;
5. promocao e rollback documentados.

### Step 032.7.4 - Checkpoint final

Registrar matriz antes/depois, adapters mantidos, gaps fechados, testes/fixtures, fake default,
zero rede real, decisao Clicksign, riscos de drift e commits. Parar antes do staging.

### Definicao de pronto da Task 32.7

- [ ] Suite, formatacao e boot verdes.
- [ ] Nenhum contrato/dominio mudou.
- [ ] ADR 0017 e doc operacional publicados.
- [ ] PR description criada.
- [ ] Fase 5 recebe procedimento gated.
- [ ] Nenhum adapter real ativado.

### Commit sugerido

```text
docs(integracoes): preparar ativacao gated dos providers
```

---

## Definition of Done da Sprint 32

- [ ] Seis providers inventariados antes de codigo.
- [ ] Apenas gaps comprovados alterados; zero duplicacao de adapter.
- [ ] KYC/KYB/PLD, Clicksign, Pix e escrow cobrem sucesso, 4xx, 5xx, timeout e malformed.
- [ ] Retry somente em falha transiente.
- [ ] DTO externo restrito a infrastructure.
- [ ] Fake default comprovado por wiring.
- [ ] Selecao externa explicita e fail-fast.
- [ ] ADR 0013 respeitado; zero adapter Celcoin de assinatura.
- [ ] ADR 0017 registra flags, ambientes, gates e rollback.
- [ ] Fixtures sem dados/hosts/secrets reais; local-wiremock somente localhost.
- [ ] Nenhum teste toca rede/sandbox real.
- [ ] Zero migration, REST ou regra de negocio alterada.
- [ ] Docs, roadmap e `SPRINT-32-PR.md` atualizados.
- [ ] `./gradlew check` e `bootJar` verdes ou falha preexistente documentada.
