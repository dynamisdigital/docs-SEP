# Steps - Sprint 9 - Credito (integracao Open Finance)

**Spec de origem**: [`specs/fase-2/009-sprint-9-credito-open-finance.md`](../../specs/fase-2/009-sprint-9-credito-open-finance.md)

**Status**: a implementar.

**Objetivo geral**: enriquecer a analise de credito da Sprint 8 com consentimento Open Finance, recebimento de dados via Celcoin/Finansystech, persistencia de snapshot de movimentacao bancaria, reavaliacao automatica do score e auditoria reforcada.

**Esforco total estimado**: 7-10 dias de Dev Senior.

**Repo de destino**:
- `sep-api`: backend Spring Boot, unico repo de codigo alterado nesta sprint.
- `docs-SEP`: documentacao pode ser editada no working tree quando necessario, mas operacao git continua manual.

**Branch sugerida**:
- `feature/sprint-9-credito-open-finance`

**Pre-requisitos globais**:
- Sprint 8 concluida, revisada e mergeada em `develop`.
- `sep-api` em `develop` atualizado a partir de `origin/develop`.
- Modulo `credito` funcional com `PropostaCredito`, motor de regras, parecer manual e auditoria.
- Step-up authentication da Sprint 5 funcional.
- Provider Pattern definido pela ADR 0004.
- WireMock para adapters Celcoin definido pela ADR 0008.
- Credenciais Celcoin/Finansystech sandbox conhecidas ou fakes habilitados para dev/test.
- Confirmar formato atual da API Celcoin/Finansystech antes de fechar DTOs do adapter real.

**Fora de escopo**:
- Renovacao automatica de consentimento Open Finance.
- Outros provedores Open Finance alem de Celcoin/Finansystech.
- ML, bureau de credito externo ou score externo.
- Precificacao financeira, juros, IOF, CET ou simulacao financeira.
- Formalizacao contratual, CCB ou assinatura digital.
- Telas web/mobile.
- Desembolso, Pix ou conciliacao financeira.

---

## Ordem de execucao recomendada

```text
9.0 (prechecks)
 |
 v
9.1 (dominio + migrations Open Finance)
 |
 +--> 9.2 (OpenFinanceProvider Fake + Celcoin)
 |
 v
9.3 (use cases consentimento + consulta)
 |
 v
9.4 (regra Open Finance + reavaliacao)
 |
 v
9.5 (webhook Celcoin Open Finance)
 |
 v
9.6 (REST + DTOs + OpenAPI)
 |
 v
9.7 (auditoria reforcada)
 |
 v
9.8 (testes E2E + WireMock)
 |
 v
9.9 (documentacao + collections + validacao final)
```

- 9.1 deve estabilizar modelo e migrations antes dos use cases.
- 9.2 pode avancar em paralelo com 9.1 desde que os DTOs de dominio estejam claros.
- 9.3 depende do provider e das entidades de consentimento.
- 9.4 depende de snapshots persistidos.
- 9.5 deve reaproveitar o padrao de webhook/idempotencia/HMAC das Sprints 4, 6 e 7.
- 9.6 deve ser feita depois que o contrato dos use cases estiver fechado.
- 9.7 deve estar pronta antes dos testes E2E para validar audit log.
- 9.9 so marca PRD como executado no final da implementacao/merge.

---

## Task 9.0 - Prechecks da Sprint 9

**Objetivo**: garantir que a Sprint 9 nasce de `develop` atualizado, com Sprint 8 integrada e baseline verde.

**Esforco**: 1-2 horas.

### Step 009.0.1 - Conferir estado Git do `sep-api`

**Comandos**:
```bash
cd <sep-api-root>
git fetch --all --prune
git status --short --branch
git rev-list --left-right --count HEAD...origin/develop
```

**Verificacao**:
- Working tree limpo antes de criar branch.
- Branch local alinhada a `origin/develop`.
- Se houver mudancas locais, identificar se sao do usuario; nao reverter.

### Step 009.0.2 - Criar branch da sprint

**Comandos**:
```bash
cd <sep-api-root>
git switch develop
git pull --ff-only
git switch -c feature/sprint-9-credito-open-finance
```

**Verificacao**:
- Branch criada a partir de `develop` atualizado.
- Se `git pull --ff-only` falhar, abortar e avisar o usuario.

### Step 009.0.3 - Rodar baseline backend

**Comandos**:
```bash
cd <sep-api-root>
./gradlew clean test
./gradlew bootJar
```

**Verificacao**:
- Suite passa antes de qualquer alteracao.
- Se os testes dependem de PostgreSQL local, subir o Docker Compose conforme README do `sep-api`.

### Step 009.0.4 - Conferir pontos de extensao da Sprint 8

**Comandos**:
```bash
cd <sep-api-root>
find src/main/resources/db/migration -maxdepth 1 -type f | sort
grep -R "class PropostaAvaliacaoTransacional" -n src/main/java/com/dynamis/sep_api
grep -R "class MotorRegrasCredito" -n src/main/java/com/dynamis/sep_api/credito
grep -R "interface RegraCredito" -n src/main/java/com/dynamis/sep_api/credito
grep -R "TipoEventoSeguranca" -n src/main/java/com/dynamis/sep_api/shared/audit
grep -R "RegistrarWebhookEventUseCase" -n src/main/java/com/dynamis/sep_api
grep -R "HMAC" -n src/main/java/com/dynamis/sep_api
```

**Verificacao**:
- Proximo numero livre de migration confirmado.
- Service transacional de avaliacao identificado.
- Padrao de regra do motor identificado.
- Padrao de auditoria e check constraint identificado.
- Padrao de webhook/idempotencia/HMAC identificado.

### Step 009.0.5 - Confirmar contrato Celcoin/Finansystech

**Checklist**:
- Base URL sandbox.
- Fluxo para criar consentimento e URL de autorizacao.
- Payload de callback de autorizacao.
- Payload de dados de movimentacao.
- Headers obrigatorios: Authorization, Idempotency-Key, correlation id, assinatura/HMAC.
- Semantica de erro 4xx/5xx e retry.

**Verificacao**:
- Se o contrato real estiver incerto, implementar fake + port primeiro e manter adapter Celcoin atras de WireMock/fixtures revisaveis.

### Definicao de pronto da Task 9.0
- [ ] Branch correta criada.
- [ ] Baseline backend verde.
- [ ] Proximo numero de migration confirmado.
- [ ] Pontos de extensao de credito, audit log e webhooks identificados.
- [ ] Contrato Celcoin/Finansystech mapeado ou risco documentado.

---

## Task 9.1 - Dominio, entidades e migrations Open Finance

**Objetivo**: criar o nucleo persistente do consentimento Open Finance e do snapshot de movimentacao.

**Pre-requisito**: Task 9.0 concluida.

**Esforco**: 1 dia.

**Arquivos principais**:
- `credito/domain/model/ConsentimentoOpenFinance.java`
- `credito/domain/model/MovimentacaoOpenFinance.java`
- `credito/domain/vo/StatusConsentimento.java`
- `credito/infrastructure/persistence/ConsentimentoOpenFinanceRepository.java`
- `credito/infrastructure/persistence/MovimentacaoOpenFinanceRepository.java`
- `src/main/resources/db/migration/V<n>__criar_tabelas_open_finance.sql`

### Step 009.1.1 - Modelar `StatusConsentimento`

**Valores**:
```text
PENDENTE
AUTORIZADO
NEGADO
EXPIRADO
```

**Regras**:
- `PENDENTE` nasce quando o link de consentimento e gerado.
- `AUTORIZADO` permite buscar movimentacao.
- `NEGADO` impede busca de movimentacao.
- `EXPIRADO` impede reuso do link antigo.

**Verificacao**:
- Testar helpers como `permiteConsulta()` se forem criados.

### Step 009.1.2 - Modelar `ConsentimentoOpenFinance`

**Campos minimos**:
- `id`
- `propostaId`
- `tomadorId`
- `status`
- `urlAutorizacao`
- `idExternoCelcoin`
- `dataInicio`
- `dataAutorizacao`
- `dataExpiracao`

**Regras de dominio**:
- Factory cria em `PENDENTE`.
- `autorizar()` so transiciona de `PENDENTE` para `AUTORIZADO`.
- `negar()` so transiciona de `PENDENTE` para `NEGADO`.
- `expirar()` so transiciona se ainda nao finalizado.
- Nao armazenar tokens bancarios sensiveis.

### Step 009.1.3 - Modelar `MovimentacaoOpenFinance`

**Campos minimos**:
- `id`
- `consentimentoId`
- `propostaId`
- `payloadConsolidado` (`JSONB`)
- `mediaEntradasMensal`
- `mediaSaidasMensal`
- `saldoMedio`
- `numeroMesesAvaliados`
- `dataRecebimento`

**Regras**:
- Snapshot consolidado, nao extrato bruto transacional completo.
- Payload deve ser minimizado para dados necessarios ao score.
- Dinheiro com `BigDecimal` escala 2.

### Step 009.1.4 - Criar migration Flyway

**Tabela `consentimento_open_finance`**:
- PK UUID.
- FK para `proposta_credito(id)` sem cascade.
- `tomador_id` redundante para consultas/auditoria.
- `status` com check constraint.
- `id_externo_celcoin` indexado.
- Indice unico parcial para consentimento ativo por proposta:
  - recomendacao: `UNIQUE (proposta_id) WHERE status = 'PENDENTE'`
  - evitar `UNIQUE (proposta_id, status)` se for necessario preservar historico de negacoes/expiracoes.

**Tabela `movimentacao_open_finance`**:
- PK UUID.
- FK para `consentimento_open_finance(id)` sem cascade.
- FK opcional ou coluna `proposta_id` indexada para leitura por proposta.
- `payload_consolidado JSONB NOT NULL`.
- colunas numericas consolidadas.

**Retencao**:
- Incluir `retencao_ate` ou documentar explicitamente a politica no `OPEN-FINANCE.md` antes do fechamento.

### Step 009.1.5 - Criar repositories e testes

**Testes obrigatorios**:
- `ConsentimentoOpenFinanceTest`
- `MovimentacaoOpenFinanceTest`
- `ConsentimentoOpenFinanceRepositoryTest`
- `MovimentacaoOpenFinanceRepositoryTest`

**Comandos**:
```bash
cd <sep-api-root>
./gradlew test --tests "*OpenFinance*Test" --tests "*OpenFinance*RepositoryTest"
```

### Definicao de pronto da Task 9.1
- [ ] Entidades modeladas sem dados bancarios brutos desnecessarios.
- [ ] Migration preserva historico e evita cascade destrutivo.
- [ ] Repositories criados.
- [ ] Testes de dominio/repository verdes.

### Checkpoint pre-commit obrigatorio
Sugestao de commit: `feat(credito): modelar consentimento open finance`.

---

## Task 9.2 - `OpenFinanceProvider` port + Fake + Celcoin

**Objetivo**: isolar a integracao Celcoin/Finansystech atras de Provider Pattern.

**Pre-requisito**: Task 9.1 concluida ou modelo estabilizado.

**Esforco**: 1-1.5 dia.

**Arquivos principais**:
- `credito/application/port/out/OpenFinanceProvider.java`
- `credito/application/port/out/dto/RequisicaoConsentimento.java`
- `credito/application/port/out/dto/RespostaConsentimento.java`
- `credito/application/port/out/dto/MovimentacaoConsolidada.java`
- `credito/infrastructure/adapter/celcoin/FakeOpenFinanceProvider.java`
- `credito/infrastructure/adapter/celcoin/CelcoinOpenFinanceProvider.java`
- `credito/infrastructure/adapter/celcoin/CelcoinOpenFinanceMapper.java`
- `credito/infrastructure/config/OpenFinanceProviderConfig.java` ou equivalente.
- update de properties em `application.yml`.

### Step 009.2.1 - Definir port de aplicacao

**Contrato sugerido**:
```java
public interface OpenFinanceProvider {
    RespostaConsentimento iniciarConsentimento(RequisicaoConsentimento requisicao);
    MovimentacaoConsolidada consultarMovimentacao(String idExternoConsentimento);
}
```

**Regras**:
- DTOs do port usam linguagem de dominio, nao nomes Celcoin.
- Nao vazar DTO externo para use cases.
- Exceptions tecnicas devem ser convertidas para exceptions de aplicacao/infra mapeaveis.

### Step 009.2.2 - Implementar `FakeOpenFinanceProvider`

**Regras**:
- Default para `dev`/test quando `app.open-finance.provider=fake`.
- Retorna URL fake e id externo deterministicos.
- Permite configurar cenarios em teste: autorizado, negado, movimentacao alta, movimentacao baixa, saldo medio negativo.

### Step 009.2.3 - Implementar properties

**Sugestao**:
```yaml
app:
  open-finance:
    provider: ${APP_OPEN_FINANCE_PROVIDER:fake}
  celcoin:
    open-finance:
      base-url: ${APP_CELCOIN_OPEN_FINANCE_BASE_URL:}
      client-id: ${APP_CELCOIN_OPEN_FINANCE_CLIENT_ID:}
      client-secret: ${APP_CELCOIN_OPEN_FINANCE_CLIENT_SECRET:}
      webhook-secret: ${APP_WEBHOOK_SECRET_CELCOIN_OPEN_FINANCE:dev-open-finance-webhook-secret-change-me}
```

**Verificacao**:
- Properties sem segredo hardcoded real.
- Fake como default local.

### Step 009.2.4 - Implementar adapter Celcoin

**Regras**:
- Reusar padrao OAuth/cache ja existente nos adapters Celcoin das Sprints 6-7.
- Enviar idempotency/correlation quando aplicavel.
- Aplicar Resilience4j (`celcoin-open-finance`) com retry/circuit breaker.
- Mapper MapStruct ou parser estruturado.
- Tratar 4xx como erro de negocio/contrato e 5xx/IO como erro tecnico retryable.

### Step 009.2.5 - Testar com WireMock

**Testes obrigatorios**:
- `FakeOpenFinanceProviderTest`
- `CelcoinOpenFinanceProviderIT`

**Cenarios WireMock**:
- consentimento criado com URL.
- autorizacao/movimentacao parseada.
- header Authorization presente.
- retry em 5xx.
- erro 4xx nao faz retry indevido.

**Comandos**:
```bash
cd <sep-api-root>
./gradlew test --tests "*OpenFinanceProvider*"
```

### Definicao de pronto da Task 9.2
- [ ] Port nao vaza Celcoin para aplicacao.
- [ ] Fake cobre cenarios de dev/test.
- [ ] Adapter Celcoin tem WireMock IT.
- [ ] Resilience4j configurado.

### Checkpoint pre-commit obrigatorio
Sugestao de commit: `feat(credito): adicionar provider open finance`.

---

## Task 9.3 - Use cases de consentimento e consulta

**Objetivo**: orquestrar criacao de consentimento, callback e consulta de movimentacao.

**Pre-requisitos**: Tasks 9.1 e 9.2.

**Esforco**: 1-1.5 dia.

**Arquivos principais**:
- `credito/application/usecase/IniciarConsentimentoOpenFinanceUseCase.java`
- `credito/application/usecase/ProcessarCallbackConsentimentoUseCase.java`
- `credito/application/usecase/ConsultarMovimentacaoOpenFinanceUseCase.java`
- commands/dtos de aplicacao correspondentes.

### Step 009.3.1 - Implementar inicio de consentimento

**Regras**:
- Proposta deve existir.
- Usuario autenticado deve ser o tomador da proposta; operador interno nao inicia consentimento pelo tomador nesta sprint, salvo decisao explicita.
- Proposta deve estar em `EM_ANALISE`, `PRE_APROVADA` ou `PENDENCIA`.
- Nao iniciar para `APROVADA`/`REJEITADA`.
- Se ja houver consentimento `PENDENTE`, retornar/reusar o link existente ou rejeitar com 409; escolher uma regra e documentar.
- Persistir `ConsentimentoOpenFinance` em `PENDENTE`.
- Publicar evento `OpenFinanceConsentimentoIniciadoEvent`.

### Step 009.3.2 - Implementar callback de consentimento

**Regras**:
- Encontrar consentimento por `idExternoCelcoin`.
- Callback idempotente: mesmo status repetido nao deve duplicar efeitos.
- `AUTORIZADO`:
  - marcar `AUTORIZADO`.
  - publicar `OpenFinanceAutorizadoEvent`.
  - disparar consulta de movimentacao.
- `NEGADO`:
  - marcar `NEGADO`.
  - publicar `OpenFinanceNegadoEvent`.
  - nao alterar score.
- Eventos tardios para proposta finalizada devem ser gravados como recebidos, mas nao reavaliar a proposta.

### Step 009.3.3 - Implementar consulta de movimentacao

**Regras**:
- Consentimento deve estar `AUTORIZADO`.
- Chamar `OpenFinanceProvider.consultarMovimentacao`.
- Calcular medias consolidadas:
  - media entradas mensal.
  - media saidas mensal.
  - saldo medio.
  - numero de meses avaliados.
- Persistir `MovimentacaoOpenFinance`.
- Publicar `OpenFinanceDadosRecebidosEvent`.
- Disparar `ReavaliarPropostaComOpenFinanceUseCase`.

### Step 009.3.4 - Testes de use case

**Testes obrigatorios**:
- `IniciarConsentimentoOpenFinanceUseCaseTest`
- `ProcessarCallbackConsentimentoUseCaseTest`
- `ConsultarMovimentacaoOpenFinanceUseCaseTest`

**Cenarios minimos**:
- cliente inicia consentimento da propria proposta.
- proposta final rejeita inicio.
- proposta alheia retorna 403.
- callback autorizado dispara consulta.
- callback negado nao altera score.
- callback duplicado idempotente.
- calculos de media corretos com meses vazios/ausentes.

### Definicao de pronto da Task 9.3
- [ ] Consentimento iniciado com ownership.
- [ ] Callback autorizado/negado idempotente.
- [ ] Snapshot consolidado persistido.
- [ ] Eventos publicados.

### Checkpoint pre-commit obrigatorio
Sugestao de commit: `feat(credito): orquestrar consentimento open finance`.

---

## Task 9.4 - Nova regra no motor + reavaliacao

**Objetivo**: adicionar dados Open Finance ao score interno e permitir reavaliacao automatica.

**Pre-requisitos**: Tasks 9.1 e 9.3.

**Esforco**: 1 dia.

**Arquivos principais**:
- `credito/application/service/regras/RegraOpenFinanceMovimentacao.java`
- update em `ContextoAvaliacaoCredito` ou view equivalente.
- update em `PropostaAvaliacaoTransacional` se o motor precisar carregar movimentacao.
- `credito/application/usecase/ReavaliarPropostaComOpenFinanceUseCase.java`

### Step 009.4.1 - Decidir modelagem de bonus no motor

**Ponto critico**:
O motor da Sprint 8 calcula score subtraindo penalidades de falhas/pendencias. A Sprint 9 pede bonus de ate +200 pontos. Antes de implementar, escolher uma destas opcoes e documentar no checkpoint:

- **Opcao A (recomendada)**: estender `RegraResultado` para carregar `ajusteScore` positivo/negativo.
- **Opcao B**: criar regra que retorna `PASSOU` com metadado e o motor aplica bonus especial por nome de regra.
- **Opcao C**: calcular bonus fora do motor na reavaliacao, mantendo motor Sprint 8 intacto.

**Verificacao**:
- Evitar regra especial acoplada a string se houver caminho simples estruturado.
- Garantir que score final continua entre 0 e 1000.

### Step 009.4.2 - Implementar `RegraOpenFinanceMovimentacao`

**Cenarios**:
- Sem movimentacao para proposta -> `PENDENTE`, impacto neutro.
- `mediaEntradasMensal >= 3x parcela estimada` -> bonus forte (ate +200).
- `mediaEntradasMensal >= 1x parcela estimada` -> bonus parcial (ate +100).
- Abaixo de 1x parcela -> falha leve.
- `saldoMedio < 0` recorrente -> falha/alerta forte.

**Observacao**:
- Parcela estimada nesta sprint usa `valorSolicitado / prazoMeses`, sem juros.
- Documentar que calculo financeiro real fica fora de escopo ate Sprint 10+.

### Step 009.4.3 - Implementar reavaliacao

**Regras**:
- Nao reavaliar proposta final (`APROVADA`/`REJEITADA`).
- Carregar score anterior.
- Reexecutar motor com contexto enriquecido.
- Persistir novo `ScoreInterno` e novas `RegraCreditoAvaliada`.
- Se score cruzar threshold de `PRE_APROVADA`, atualizar status.
- Se resultado piorar para `REJEITADA`, avaliar se motor pode rejeitar automaticamente apos Open Finance ou se deve manter `EM_ANALISE`; registrar decisao no checkpoint.
- Publicar `OpenFinanceReavaliacaoEvent` com score antes/depois.

### Step 009.4.4 - Testes

**Testes obrigatorios**:
- `RegraOpenFinanceMovimentacaoTest`
- `ReavaliarPropostaComOpenFinanceUseCaseTest`
- ajustes em `MotorRegrasCreditoTest`

**Comandos**:
```bash
cd <sep-api-root>
./gradlew test --tests "*RegraOpenFinanceMovimentacaoTest" --tests "*ReavaliarPropostaComOpenFinanceUseCaseTest" --tests "*MotorRegrasCreditoTest"
```

### Definicao de pronto da Task 9.4
- [ ] Bonus/penalidade Open Finance modelado sem hack frágil.
- [ ] Reavaliacao nao altera propostas finais.
- [ ] Score antes/depois auditavel.
- [ ] Testes de regra e reavaliacao verdes.

### Checkpoint pre-commit obrigatorio
Sugestao de commit: `feat(credito): reavaliar score com open finance`.

---

## Task 9.5 - Webhook Celcoin Open Finance

**Objetivo**: receber callbacks Celcoin/Finansystech com autorizacao e dados de movimentacao.

**Pre-requisitos**: Tasks 9.3 e 9.4.

**Esforco**: 1 dia.

**Arquivos principais**:
- `credito/web/controller/CelcoinOpenFinanceWebhookController.java`
- `credito/web/dto/CelcoinOpenFinanceCallback.java`
- DTOs especificos para callback de autorizacao e movimentacao, se necessario.
- update de config de HMAC/secret.

### Step 009.5.1 - Criar DTOs de callback

**Regras**:
- Discriminar tipo de callback de forma explicita.
- Aceitar payload desconhecido sem quebrar parsing se o campo `tipo` e ids essenciais existirem.
- Nao persistir payload bruto inteiro no audit log.
- Payload bruto pode ficar no outbox/webhook event log conforme padrao existente.

### Step 009.5.2 - Implementar controller

**Endpoint**:
```text
POST /api/v1/webhooks/celcoin/open-finance
```

**Regras**:
- Exigir `Idempotency-Key`.
- Validar HMAC com secret proprio (`APP_WEBHOOK_SECRET_CELCOIN_OPEN_FINANCE`).
- Registrar no outbox/webhook event log.
- Roteamento:
  - callback de autorizacao -> `ProcessarCallbackConsentimentoUseCase`.
  - callback de movimentacao -> processar/persistir snapshot ou disparar consulta via provider, conforme contrato Celcoin real.
- Responder `202 Accepted` em processamento aceito.
- Duplicata idempotente retorna `202` sem duplicar efeitos.

### Step 009.5.3 - Testes

**Testes obrigatorios**:
- `CelcoinOpenFinanceWebhookControllerTest`

**Cenarios**:
- HMAC invalido -> 401.
- Sem `Idempotency-Key` -> 400.
- Callback autorizado -> 202.
- Callback negado -> 202.
- Callback duplicado -> 202 sem duplicar use case.
- Tipo desconhecido -> 400 ou 202 com falha registrada; escolher e documentar.

### Definicao de pronto da Task 9.5
- [ ] Webhook com HMAC e idempotencia.
- [ ] Outbox/webhook log reaproveitado.
- [ ] Roteamento de tipos claro.
- [ ] Testes web verdes.

### Checkpoint pre-commit obrigatorio
Sugestao de commit: `feat(credito): receber callbacks open finance`.

---

## Task 9.6 - Endpoints REST + DTOs + OpenAPI

**Objetivo**: expor contratos REST para inicio e consulta do Open Finance por proposta.

**Pre-requisitos**: Tasks 9.3, 9.4 e 9.5.

**Esforco**: 0.5-1 dia.

**Arquivos principais**:
- update em `CreditoController` ou novo `OpenFinanceController`.
- `credito/web/dto/IniciarConsentimentoOpenFinanceResponse.java`
- `credito/web/dto/OpenFinanceStatusResponse.java`
- mapper web correspondente.
- update `OpenApiConfigTest`.

### Step 009.6.1 - Criar endpoint de inicio de consentimento

**Endpoint**:
```text
POST /api/v1/credito/propostas/{id}/open-finance/consentimento
```

**Autorizacao**:
- `CLIENTE` dono da proposta.
- `ADMIN`/`FINANCEIRO` nao iniciam consentimento em nome do tomador nesta sprint, salvo decisao explicita.

**Resposta sugerida**:
```json
{
  "consentimentoId": "uuid",
  "status": "PENDENTE",
  "urlAutorizacao": "https://...",
  "dataExpiracao": "2026-05-18T12:00:00-03:00"
}
```

### Step 009.6.2 - Criar endpoint de consulta

**Endpoint**:
```text
GET /api/v1/credito/propostas/{id}/open-finance
```

**Autorizacao**:
- `CLIENTE` dono da proposta.
- `FINANCEIRO` e `ADMIN` podem consultar qualquer proposta.

**Resposta sugerida**:
```json
{
  "statusConsentimento": "AUTORIZADO",
  "dataAutorizacao": "2026-05-18T12:00:00-03:00",
  "ultimaMovimentacao": {
    "mediaEntradasMensal": 10000.00,
    "mediaSaidasMensal": 7000.00,
    "saldoMedio": 3000.00,
    "numeroMesesAvaliados": 6,
    "dataRecebimento": "2026-05-18T12:10:00-03:00"
  }
}
```

### Step 009.6.3 - OpenAPI

**Obrigatorio**:
- `@Operation` nos dois endpoints.
- `@ApiResponses` com 200/201 ou 202, 400, 401, 403, 404, 409, 422 quando aplicavel.
- Schemas dos DTOs com exemplos.
- `ErrorResponseDto` nos erros.
- Atualizar `OpenApiConfigTest` com:
  - `/api/v1/credito/propostas/{id}/open-finance/consentimento`
  - `/api/v1/credito/propostas/{id}/open-finance`
  - `/api/v1/webhooks/celcoin/open-finance`

### Step 009.6.4 - Testes web

**Testes obrigatorios**:
- `OpenFinanceControllerTest`

**Cenarios**:
- cliente dono inicia consentimento -> 200/201.
- cliente alheio -> 403.
- proposta final -> 400/422.
- financeiro consulta status -> 200.
- sem auth -> 401.

### Definicao de pronto da Task 9.6
- [ ] 2 endpoints REST expostos.
- [ ] DTOs records com validacao declarativa.
- [ ] OpenAPI atualizado.
- [ ] Autorizacao/ownership cobertos em teste.

### Checkpoint pre-commit obrigatorio
Sugestao de commit: `feat(credito): expor contratos open finance`.

---

## Task 9.7 - Auditoria reforcada Open Finance

**Objetivo**: registrar eventos sensiveis do ciclo Open Finance no `audit_log_seguranca`.

**Pre-requisitos**: Tasks 9.3 e 9.5.

**Esforco**: 0.5-1 dia.

**Eventos obrigatorios**:
```text
OPEN_FINANCE_CONSENTIMENTO_INICIADO
OPEN_FINANCE_AUTORIZADO
OPEN_FINANCE_NEGADO
OPEN_FINANCE_DADOS_RECEBIDOS
OPEN_FINANCE_REAVALIACAO
```

### Step 009.7.1 - Atualizar enum e migration

**Arquivos**:
- `shared/audit/TipoEventoSeguranca.java`
- `src/main/resources/db/migration/V<n>__ampliar_audit_seguranca_tipo_open_finance.sql`

**Regras**:
- Preservar todos os eventos das Sprints 5-8.
- Atualizar check constraint `chk_audit_seguranca_tipo`.
- Migration deve ser aditiva.

### Step 009.7.2 - Criar eventos de dominio/aplicacao

**Eventos sugeridos**:
- `OpenFinanceConsentimentoIniciadoEvent`
- `OpenFinanceAutorizadoEvent`
- `OpenFinanceNegadoEvent`
- `OpenFinanceDadosRecebidosEvent`
- `OpenFinanceReavaliacaoEvent`

**Dados permitidos**:
- `propostaId`
- `tomadorId`
- `consentimentoId`
- `status`
- `scoreAnterior`
- `scoreNovo`
- `numeroMesesAvaliados`
- `dataRecebimento`

**Dados proibidos**:
- Extrato bruto completo.
- Dados identificaveis de contas bancarias.
- Payload completo da Celcoin no audit log.

### Step 009.7.3 - Atualizar listener

**Padrao obrigatorio**:
- Seguir `CreditoAuditListener`/`OnboardingAuditListener`.
- `@TransactionalEventListener(phase = AFTER_COMMIT)`.
- `@Transactional(propagation = REQUIRES_NEW)`.
- `ObjectMapper` para serializar detalhes.
- Truncar campos livres.

### Step 009.7.4 - Testes de auditoria

**Testes obrigatorios**:
- `CreditoAuditListenerTest` atualizado ou `OpenFinanceAuditListenerTest`.
- Cenario de JSON escapado.
- Cenario de reavaliacao contendo score antes/depois.
- Cenario garantindo que payload bruto nao entra no audit log.

### Definicao de pronto da Task 9.7
- [ ] Eventos novos no enum Java e check SQL.
- [ ] Listener grava audit log apos commit.
- [ ] Dados sensiveis nao vazam no audit log.
- [ ] Testes cobrem eventos principais.

### Checkpoint pre-commit obrigatorio
Sugestao de commit: `feat(credito): auditar ciclo open finance`.

---

## Task 9.8 - Testes de integracao end-to-end

**Objetivo**: validar o ciclo completo proposta -> consentimento -> callback -> dados -> reavaliacao -> auditoria.

**Pre-requisitos**: Tasks 9.1 a 9.7 concluidas.

**Esforco**: 1-2 dias.

**Arquivo principal**:
- `credito/web/OpenFinanceIT.java`

### Step 009.8.1 - Preparar fixtures

**Fixtures necessarias**:
- Usuario `CLIENTE` com onboarding aprovado e proposta em `EM_ANALISE`.
- Usuario `CLIENTE` com proposta finalizada.
- Usuario `FINANCEIRO`.
- Usuario `ADMIN`.
- Webhook secret Open Finance.
- Payload de callback autorizado.
- Payload de callback negado.
- Payload de movimentacao alta e baixa.

**Regras**:
- Usar profile `test` com banco dedicado `sep_test`, como `CreditoIT`.
- Nunca rodar IT destrutivo contra `sep_dev`.
- Evitar rede real; usar fake/provider interno ou WireMock.

### Step 009.8.2 - Cobrir fluxo feliz

**Cenario**:
```text
Tomador com proposta EM_ANALISE
 -> inicia consentimento
 -> recebe URL
 -> callback Celcoin AUTORIZADO chega
 -> dados de movimentacao recebidos/persistidos
 -> reavaliacao automatica
 -> score sobe
 -> status cruza para PRE_APROVADA
 -> audit log contem CONSENTIMENTO_INICIADO, AUTORIZADO, DADOS_RECEBIDOS, REAVALIACAO
```

### Step 009.8.3 - Cobrir negativos obrigatorios

**Cenarios**:
- Tomador A tenta iniciar consentimento em proposta de B -> 403.
- Callback de negacao -> status `NEGADO` e score nao muda.
- Webhook com HMAC invalido -> 401.
- Webhook sem `Idempotency-Key` -> 400.
- Webhook idempotente -> 202 sem duplicar snapshot/audit.
- Reavaliacao nao executa em proposta `APROVADA`.
- Reavaliacao nao executa em proposta `REJEITADA`.

### Step 009.8.4 - Rodar suite relevante

**Comandos**:
```bash
cd <sep-api-root>
./gradlew test --tests "*OpenFinance*"
./gradlew test --tests "*Credito*"
./gradlew check
```

**Verificacao**:
- Testes de Open Finance verdes.
- Testes de credito existentes continuam verdes.
- JaCoCo geral nao regride.
- Cobertura do modulo `credito` >= 70%.
- Spotless verde.

### Definicao de pronto da Task 9.8
- [ ] Fluxo feliz E2E coberto.
- [ ] Negativos principais cobertos.
- [ ] Audit log validado em integracao.
- [ ] WireMock IT do provider passa.
- [ ] `./gradlew check` verde.

### Checkpoint pre-commit obrigatorio
Sugestao de commit: `test(credito): cobrir ciclo open finance em IT`.

---

## Task 9.9 - Documentacao, collections e validacao final

**Objetivo**: consolidar documentacao operacional do Open Finance e preparar handoff da Sprint 9.

**Pre-requisitos**: Tasks 9.1 a 9.8 concluidas.

**Esforco**: 0.5-1 dia.

**Decisao sobre PR description temporaria da Sprint 9**:
- Nao criar PR description temporaria da Sprint 9 no inicio da Sprint 9.
- Criar este arquivo somente no final da implementacao, dentro da Task 9.9, depois que migrations, endpoints, webhook, testes, auditoria e documentacao estiverem estabilizados.
- Motivo: PR description temporaria da Sprint 9 e uma descricao consolidada do PR real, nao um plano preliminar.
- Quando criado, atualizar tambem `docs-SEP/repos/sep-api/README.md` para incluir o link do novo arquivo.

**Arquivos esperados**:
- `docs-SEP/repos/sep-api/OPEN-FINANCE.md`
- update `docs-SEP/repos/sep-api/CREDITO.md`
- PR description temporaria da Sprint 9 somente no final.
- `docs-SEP/docs-sep/sep-api.postman_collection.json`
- `docs-SEP/docs-sep/sep-api.insomnia_collection.json`
- `sep-api/README.md` se houver novas instrucoes locais.
- `docs-SEP/docs-sep/PRD.md` somente apos conclusao/merge, para marcar Sprint 9 como executada.

### Step 009.9.1 - Atualizar documentacao operacional

**Conteudo minimo de `OPEN-FINANCE.md`**:
- Objetivo do Open Finance no modulo credito.
- Fluxo de consentimento.
- Estados do consentimento.
- Payloads esperados.
- Como funciona reavaliacao.
- Nova regra do motor.
- Eventos de auditoria.
- Variaveis de ambiente.
- Como rodar WireMock/IT/smoke local.
- Limitacoes: sem renovacao automatica, sem multiplos providers, sem UI.

**Atualizar `CREDITO.md`**:
- Adicionar secao "Open Finance (Sprint 9)".
- Linkar `OPEN-FINANCE.md`.
- Atualizar tabela de regras do motor.
- Atualizar endpoints REST.
- Atualizar auditoria.

### Step 009.9.2 - Atualizar collections

**Endpoints a adicionar**:
```text
POST /api/v1/credito/propostas/{id}/open-finance/consentimento
GET /api/v1/credito/propostas/{id}/open-finance
POST /api/v1/webhooks/celcoin/open-finance
```

**Variaveis sugeridas**:
- `openFinanceConsentimentoId`
- `openFinanceExternalId`
- `openFinanceWebhookSecret`
- `openFinanceIdempotencyKey`

**Verificacao**:
```bash
cd <docs-SEP-root>
jq empty docs-sep/sep-api.postman_collection.json
jq empty docs-sep/sep-api.insomnia_collection.json
```

### Step 009.9.3 - Criar descricao de PR no final

**Arquivo sugerido**:
- PR description temporaria da Sprint 9

**Conteudo minimo**:
- Titulo sugerido.
- Resumo.
- Escopo tecnico.
- Endpoints novos.
- Webhook novo.
- Migrations novas.
- Auditoria.
- Testes executados.
- Riscos e pendencias.
- Referencias ao spec e ao steps.

### Step 009.9.4 - Validacao final da sprint

**Comandos**:
```bash
cd <sep-api-root>
./gradlew clean check
./gradlew bootJar
```

**Opcional smoke local**:
```bash
cd <sep-api-root>
./gradlew bootRun
```

Validar via Swagger/collection:
- Criar cliente e proposta elegivel.
- Iniciar consentimento.
- Simular callback autorizado.
- Validar snapshot.
- Validar reavaliacao.
- Validar audit log.

### Definicao de pronto da Task 9.9
- [ ] `OPEN-FINANCE.md` atualizado com implementacao real.
- [ ] `CREDITO.md` atualizado.
- [ ] Collections atualizadas.
- [ ] PR description criada apenas no final.
- [ ] Build/test final verde.
- [ ] PRD atualizado apenas quando a sprint estiver concluida/mergeada, nao antes.

### Checkpoint pre-commit obrigatorio
No fim da sprint, apresentar checkpoint consolidado antes de qualquer staging:
- arquivos criados/modificados/removidos.
- testes/build/lint executados e resultado.
- migrations criadas.
- riscos/pendencias.
- sugestao de commits ou mensagem final.

---

## Definition of Done da Sprint 9

- [ ] `OpenFinanceProvider` com Fake + Celcoin adapters.
- [ ] Consentimento Open Finance persistido e auditado.
- [ ] Callback Celcoin Open Finance com HMAC + idempotencia.
- [ ] Snapshot de movimentacao consolidado persistido.
- [ ] Nova regra `RegraOpenFinanceMovimentacao` integrada ao motor.
- [ ] Reavaliacao automatica funcional.
- [ ] Endpoints REST documentados no Swagger.
- [ ] Auditoria reforcada com eventos Open Finance.
- [ ] WireMock IT do adapter Celcoin passando.
- [ ] Suite E2E Open Finance passando.
- [ ] Cobertura JaCoCo do modulo `credito` >= 70%.
- [ ] `OPEN-FINANCE.md` criado/atualizado em `docs-SEP/repos/sep-api/`.
- [ ] Collections Postman/Insomnia atualizadas.

---

## Comandos finais recomendados

```bash
cd <sep-api-root>
./gradlew clean check
./gradlew bootJar
git status --short --branch
git diff --stat
```

Se documentos em `docs-SEP` forem alterados:
```bash
cd <docs-SEP-root>
jq empty docs-sep/sep-api.postman_collection.json
jq empty docs-sep/sep-api.insomnia_collection.json
git status --short
```

---

## Riscos e pontos de atencao

- Open Finance exige consentimento explicito; nunca iniciar em nome do tomador sem decisao documentada.
- Nao armazenar extrato bruto completo se snapshot consolidado for suficiente.
- Retencao LGPD de dados Open Finance precisa estar documentada antes de merge.
- Callback Celcoin pode chegar fora de ordem; use cases devem ser idempotentes.
- Proposta final (`APROVADA`/`REJEITADA`) nao deve ser reavaliada automaticamente.
- Mudanca de score com bonus pode exigir ajuste estruturado no motor da Sprint 8; evitar hack por nome de regra.
- HMAC de Open Finance deve ter secret proprio, nao reusar secret KYC/KYB/PLD.
- Adapter Celcoin nao deve vazar DTO externo para dominio/use cases.
- WireMock stubs podem divergir da Celcoin real; smoke sandbox manual recomendado antes de release.
- PR description temporaria da Sprint 9 so deve ser criado no final da implementacao, nao no inicio.

---

## Referencias

- [Spec 009 - Sprint 9 - Credito Open Finance](../../specs/fase-2/009-sprint-9-credito-open-finance.md)
- [Spec 008 - Sprint 8 - Credito](../../specs/fase-2/008-sprint-8-credito-regras-parecer.md)
- [PRD](../../docs-sep/PRD.md)
- [ADR 0004 - Provider Pattern para Integracoes Externas](../../adr/0004-provider-pattern-para-integracoes-externas.md)
- [ADR 0008 - WireMock para Testes de Integracao com Celcoin](../../adr/0008-wiremock-para-testes-integracao-celcoin.md)
- [ADR 0012 - Motor de Regras de Credito Interno](../../adr/0012-motor-de-regras-de-credito-interno.md)
- [CREDITO.md](../../repos/sep-api/CREDITO.md)
- [OPEN-FINANCE.md](../../repos/sep-api/OPEN-FINANCE.md)
