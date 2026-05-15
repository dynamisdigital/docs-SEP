# Steps - Sprint 7 - Onboarding KYB Empresa + PLD

**Spec de origem**: [`specs/fase-2/007-sprint-7-onboarding-kyb-empresa.md`](../../specs/fase-2/007-sprint-7-onboarding-kyb-empresa.md)

**Status**: a implementar.

**Objetivo geral**: estender o modulo `onboarding` para Pessoa Juridica (KYB), adicionar PLD obrigatorio para PF/PJ e representantes legais, com Provider Pattern, Webhooks Celcoin, auditoria reforcada e contratos REST documentados.

**Esforco total estimado**: 7-11 dias de Dev Senior.

**Repo de destino**:
- `sep-api`: backend Spring Boot, unico repo de codigo alterado nesta sprint.
- `docs-SEP`: documentacao pode ser editada no working tree quando necessario, mas operacao git continua manual.

**Branch sugerida**:
- `feature/sprint-7-onboarding-kyb-empresa`

**Pre-requisitos globais**:
- Sprint 6 concluida e mergeada em `develop`.
- `sep-api` em `develop` atualizado a partir de `origin/develop`.
- Modulo `onboarding` PF funcional.
- Webhook Receiver Pattern da Sprint 4 funcional.
- `audit_log_seguranca` da Sprint 5 e eventos KYC da Sprint 6 funcionais.
- ADRs 0004, 0007 e 0008 vigentes.
- Credenciais Celcoin sandbox para KYB e Background Check disponiveis para smoke manual posterior; CI deve usar Fake/WireMock.
- Confirmar com a area juridica se as bases COAF, OFAC, INTERPOL e MTE cobrem a obrigacao PLD do produto SEP.

**Fora de escopo**:
- Reprocessamento manual de KYB/PLD pelo backoffice.
- Job de purge/retencao automatica de PLD.
- Telas web/mobile.
- Watchlist proprietaria.
- Renovacao periodica de KYC/KYB.
- Exposicao publica dos detalhes de hits PLD.

---

## Ordem de execucao recomendada

```text
7.0 (prechecks)
 |
 v
7.1 (refactor SolicitacaoOnboarding + migration)
 |
 v
7.2 (entidades KYB + repositories)
 |
 +--> 7.3 (KybProvider + Fake/Celcoin + WireMock)
 |
 +--> 7.4 (BackgroundCheckProvider PLD + WireMock)
 |
 v
7.5 (use cases KYB + PLD + orquestracao)
 |
 v
7.6 (webhooks KYB + PLD)
 |
 v
7.7 (REST + DTOs + OpenAPI)
 |
 v
7.8 (auditoria reforcada KYB + PLD)
 |
 v
7.9 (testes integrados)
 |
 v
7.10 (documentacao + validacao final)
```

- Tasks 7.3 e 7.4 podem avancar em paralelo depois da 7.2.
- 7.5 depende dos providers e do modelo de KYB.
- 7.6 depende da orquestracao de dominio estar fechada.
- 7.7 deve ser feita depois dos contratos internos estabilizados.
- 7.8 deve fechar antes dos testes integrados finais para validar audit log.

---

## Task 7.0 - Prechecks da Sprint 7

**Objetivo**: garantir que a Sprint 7 nasce de `develop` atualizado, com Sprint 6 integrada e baseline verde.

**Esforco**: 1-2 horas.

### Step 007.0.1 - Conferir estado Git do `sep-api`

**Comandos**:
```bash
cd <sep-api-root>
git fetch --all --prune
git status --short --branch
git rev-list --left-right --count HEAD...origin/develop
```

**Verificacao**:
- Working tree limpo.
- Branch local alinhada a `origin/develop`.
- Se houver mudancas locais, nao trocar de branch antes de entender se sao do usuario.

### Step 007.0.2 - Criar branch da sprint

**Comandos**:
```bash
cd <sep-api-root>
git switch develop
git pull --ff-only
git switch -c feature/sprint-7-onboarding-kyb-empresa
```

**Verificacao**:
- Branch criada a partir de `develop` atualizado.
- Se `git pull --ff-only` falhar, abortar e avisar o usuario.

### Step 007.0.3 - Rodar baseline backend

**Comandos**:
```bash
cd <sep-api-root>
./gradlew clean test
./gradlew bootJar
```

**Verificacao**:
- Suite passa antes de qualquer alteracao.
- Se os testes dependem de PostgreSQL local, subir o Docker Compose conforme README do `sep-api`.

### Step 007.0.4 - Conferir migrations e pontos de extensao

**Comandos**:
```bash
cd <sep-api-root>
find src/main/resources/db/migration -maxdepth 1 -type f | sort
grep -R "enum TipoEventoSeguranca" -n src/main/java/com/dynamis/sep_api
grep -R "enum StatusOnboarding" -n src/main/java/com/dynamis/sep_api/onboarding
grep -R "class CelcoinKycWebhookController" -n src/main/java/com/dynamis/sep_api/onboarding
```

**Verificacao**:
- Ultima migration atual esperada apos Sprint 6: `V9`.
- Proxima migration da Sprint 7 deve ser `V10` ou o proximo numero livre real.
- Identificar onde atualizar status, audit log, webhooks e properties Celcoin.

### Definicao de pronto da Task 7.0
- [ ] Branch correta criada.
- [ ] Baseline backend verde.
- [ ] Proximo numero de migration confirmado.
- [ ] Pontos de extensao da Sprint 6 identificados.

---

## Task 7.1 - Refactor de `SolicitacaoOnboarding` para PF/PJ

**Objetivo**: generalizar o agregado raiz para suportar solicitacoes de pessoa fisica e juridica sem perda de dados da Sprint 6.

**Pre-requisito**: Task 7.0 concluida.

**Esforco**: 1 dia.

**Arquivos principais**:
- `onboarding/domain/model/SolicitacaoOnboarding.java`
- `onboarding/domain/vo/TipoSolicitante.java`
- `onboarding/domain/vo/StatusOnboarding.java`
- `onboarding/infrastructure/persistence/SolicitacaoOnboardingRepository.java`
- `src/main/resources/db/migration/V<n>__alterar_solicitacao_onboarding_tipo.sql`

### Step 007.1.1 - Criar `TipoSolicitante`

**Contrato**:
```java
public enum TipoSolicitante {
    PESSOA,
    EMPRESA
}
```

**Regras**:
- Nao usar sealed type aqui se o codigo existente usa enums para VOs simples.
- Persistir como `VARCHAR`.
- Toda solicitacao existente deve receber `PESSOA` no backfill.

### Step 007.1.2 - Evoluir `StatusOnboarding`

**Status novos**:
```text
APROVADO_FINAL
REPROVADO_PLD
```

**Regras**:
- `APROVADO`, `REPROVADO`, `PENDENCIA`, `APROVADO_FINAL` e `REPROVADO_PLD` devem ser finais para bloqueio de alteracoes.
- `APROVADO` passa a representar aprovacao do KYC/KYB antes do PLD.
- `APROVADO_FINAL` representa onboarding apto para consumo pela Sprint 8.

### Step 007.1.3 - Refatorar documento identificador

**Decisao**:
- Se a Sprint 6 criou coluna `cpf`, manter compatibilidade via migration aditiva:
  - adicionar `tipo`
  - adicionar `documento`
  - backfill `documento = cpf` para PF
  - manter `cpf` temporariamente apenas se a remocao causar risco alto
- Indice unico ativo deve passar a usar `(documento)` filtrado por status ativo e, se necessario, por `tipo`.

**Regra SQL**:
- Dropar `uq_onboarding_cpf_ativo`.
- Criar `uq_onboarding_documento_ativo`.
- Atualizar check de status com os novos valores.

### Step 007.1.4 - Atualizar testes de dominio e repository

**Testes obrigatorios**:
- `SolicitacaoOnboardingTest`: PF existente, PJ nova, transicoes para `APROVADO_FINAL` e `REPROVADO_PLD`.
- Repository/migration test garantindo backfill de PF.

**Verificacao**:
```bash
cd <sep-api-root>
./gradlew test --tests "*SolicitacaoOnboardingTest" --tests "*SolicitacaoOnboardingRepositoryTest"
```

### Definicao de pronto da Task 7.1
- [ ] Solicitacoes PF existentes seguem validas.
- [ ] Solicitacoes PJ podem ser representadas.
- [ ] Constraint de unicidade ativa suporta CPF/CNPJ.
- [ ] Status finais bloqueiam alteracoes indevidas.

---

## Task 7.2 - Entidades KYB e migrations

**Objetivo**: modelar os dados de pessoa juridica, consulta CNPJ e representantes legais.

**Pre-requisito**: Task 7.1 concluida.

**Esforco**: 1-2 dias.

**Arquivos principais**:
- `onboarding/domain/model/KybEmpresa.java`
- `onboarding/domain/model/ConsultaCNPJ.java`
- `onboarding/domain/model/RepresentanteLegal.java`
- `onboarding/domain/model/ConsultaPld.java`
- `onboarding/domain/vo/Cnpj.java`
- `onboarding/domain/vo/TipoSocietario.java`
- `onboarding/domain/vo/PorteEmpresa.java`
- `onboarding/domain/vo/BasePld.java`
- `onboarding/domain/vo/SeveridadePld.java`
- `onboarding/infrastructure/persistence/KybEmpresaRepository.java`
- `onboarding/infrastructure/persistence/ConsultaCNPJRepository.java`
- `onboarding/infrastructure/persistence/RepresentanteLegalRepository.java`
- `onboarding/infrastructure/persistence/ConsultaPldRepository.java`
- `src/main/resources/db/migration/V<n>__criar_tabelas_kyb_pld.sql`

### Step 007.2.1 - Criar VOs PJ

**Regras**:
- `Cnpj` deve ser `record`, armazenar 14 digitos normalizados e validar digitos verificadores.
- `TipoSocietario` deve aceitar `LTDA`, `SA`, `EIRELI`, `MEI`, `OUTROS`.
- `PorteEmpresa` deve aceitar `MEI`, `ME`, `EPP`, `MEDIO`, `GRANDE`.
- `BasePld` deve aceitar `COAF`, `OFAC`, `INTERPOL`, `MTE`.

**Testes obrigatorios**:
- `CnpjTest`: valido com e sem mascara, invalido, sequencia repetida, formatacao.

### Step 007.2.2 - Criar entidades KYB

**Regras de modelagem**:
- `KybEmpresa` e 1:1 com `SolicitacaoOnboarding` do tipo `EMPRESA`.
- `ConsultaCNPJ` guarda situacao cadastral, razao social, nome fantasia, CNAE/atividades, capital social e data de abertura.
- `RepresentanteLegal` pertence a `KybEmpresa`, guarda nome, CPF normalizado, cargo e status PLD consolidado.
- `ConsultaPld` deve suportar PF, PJ e representante legal; guardar base, hit, motivo, severidade, payload provider e retencao prevista.
- IDs usam UUID v6.
- Dados sensiveis completos ficam no banco, mas nao em logs nem audit details publicos.

### Step 007.2.3 - Criar migration KYB/PLD

**Tabelas obrigatorias**:
- `kyb_empresa`
- `consulta_cnpj`
- `representante_legal`
- `consulta_pld`

**Checks obrigatorios**:
- `situacao_cadastral` com valores conhecidos pelo provider (`ATIVA`, `SUSPENSA`, `INAPTA`, `BAIXADA`, `DESCONHECIDA`).
- `tipo_societario`, `porte_empresa`, `base_pld` e `severidade` sincronizados com os enums Java.
- FK para `solicitacao_onboarding`.

### Step 007.2.4 - Repositories e testes JPA

**Metodos esperados**:
- `KybEmpresaRepository.findBySolicitacaoId(...)`
- `KybEmpresaRepository.existsByCnpjAndSolicitacaoStatusIn(...)` ou equivalente usando `documento`.
- `RepresentanteLegalRepository.findByKybEmpresaId(...)`
- `ConsultaPldRepository.findBySolicitacaoId(...)`

**Testes obrigatorios**:
- `KybEmpresaRepositoryTest`
- `RepresentanteLegalRepositoryTest`
- `ConsultaPldRepositoryTest`

**Verificacao**:
```bash
cd <sep-api-root>
./gradlew test --tests "*CnpjTest" --tests "*Kyb*RepositoryTest" --tests "*RepresentanteLegalRepositoryTest" --tests "*ConsultaPldRepositoryTest"
```

### Definicao de pronto da Task 7.2
- [ ] Entidades KYB/PLD persistem corretamente.
- [ ] Migration sobe no boot.
- [ ] CNPJ validado por VO.
- [ ] Repositories cobertos por testes.

---

## Task 7.3 - `KybProvider`, Fake e Celcoin

**Objetivo**: isolar consulta KYB por Provider Pattern, com fake deterministico e adapter HTTP testado por WireMock.

**Pre-requisito**: Task 7.2 concluida.

**Esforco**: 1-2 dias.

**Arquivos principais**:
- `onboarding/application/port/out/KybProvider.java`
- `onboarding/application/port/out/dto/RequisicaoKyb.java`
- `onboarding/application/port/out/dto/RespostaKyb.java`
- `onboarding/application/port/out/dto/RepresentanteLegalProviderDto.java`
- `onboarding/infrastructure/adapter/celcoin/FakeKybProvider.java`
- `onboarding/infrastructure/adapter/celcoin/CelcoinKybProvider.java`
- `onboarding/infrastructure/adapter/celcoin/CelcoinKybProperties.java`
- `onboarding/infrastructure/adapter/celcoin/CelcoinKybMapper.java`
- `onboarding/infrastructure/adapter/celcoin/dto/*Kyb*.java`

### Step 007.3.1 - Definir port e DTOs internos

**Contrato base**:
```java
public interface KybProvider {
    RespostaKyb consultarCnpj(RequisicaoKyb requisicao, String correlationId);
}
```

**Regras**:
- Port nao conhece Celcoin.
- `RequisicaoKyb` inclui `solicitacaoId`, `usuarioId`, CNPJ, razao social informada e metadados de documentos.
- `RespostaKyb` inclui situacao cadastral, dados cadastrais, representantes legais e payload bruto sanitizavel.

### Step 007.3.2 - Implementar `FakeKybProvider`

**Regra**:
- Deve retornar CNPJ `ATIVA`, dados cadastrais minimos e ao menos um representante legal.
- Permitir override em teste para situacao `SUSPENSA`/`INAPTA` quando necessario.
- Ativar por propriedade `app.kyb.provider=fake`.

**Teste**:
- `FakeKybProviderTest`.

### Step 007.3.3 - Implementar `CelcoinKybProvider`

**Regras**:
- Usar `RestClientFactory.forProvider("celcoin-kyb", baseUrl)`.
- Reusar `CelcoinOAuthTokenProvider` se a Sprint 6 ja centralizou OAuth.
- Enviar `Authorization`, `Idempotency-Key` e `X-Correlation-Id`.
- Mapear respostas e erros para excecoes controladas.
- Nunca logar payload bruto com dados sensiveis.

**Propriedades em `application.yml`**:
```yaml
app:
  kyb:
    provider: ${APP_KYB_PROVIDER:fake}
  celcoin:
    kyb:
      base-url: ${APP_CELCOIN_KYB_BASE_URL:https://sandbox.openfinance.celcoin.dev/onboarding/v1}
      client-id: ${APP_CELCOIN_CLIENT_ID:}
      client-secret: ${APP_CELCOIN_CLIENT_SECRET:}
```

**Resilience4j**:
- Instance name: `celcoin-kyb`.
- Retry: 3 tentativas para 5xx/IO/transiente.
- Timeout: 30s.
- Circuit breaker com defaults do projeto.

### Step 007.3.4 - WireMock integration test

**Arquivo**:
- `onboarding/infrastructure/adapter/celcoin/CelcoinKybProviderIT.java`

**Validar**:
- OAuth Bearer.
- Headers de idempotencia/correlation.
- Parsing de situacao `ATIVA`.
- Parsing de representantes legais.
- 4xx controlado.
- 5xx com retry.

**Verificacao**:
```bash
cd <sep-api-root>
./gradlew test --tests "*FakeKybProviderTest" --tests "*CelcoinKybMapperTest" --tests "*CelcoinKybProviderIT"
```

### Definicao de pronto da Task 7.3
- [ ] Port nao depende da Celcoin.
- [ ] Fake e Celcoin selecionaveis por configuracao.
- [ ] Adapter HTTP coberto por WireMock.
- [ ] Dados sensiveis nao aparecem em logs.

---

## Task 7.4 - `BackgroundCheckProvider` para PLD

**Objetivo**: implementar provider para consultas PLD nas bases COAF, OFAC, INTERPOL e MTE.

**Pre-requisito**: Task 7.2 concluida.

**Esforco**: 1-2 dias.

**Arquivos principais**:
- `onboarding/application/port/out/BackgroundCheckProvider.java`
- `onboarding/application/port/out/dto/RequisicaoPld.java`
- `onboarding/application/port/out/dto/RespostaPld.java`
- `onboarding/application/port/out/dto/HitPld.java`
- `onboarding/infrastructure/adapter/celcoin/FakeBackgroundCheckProvider.java`
- `onboarding/infrastructure/adapter/celcoin/CelcoinBackgroundCheckProvider.java`
- `onboarding/infrastructure/adapter/celcoin/CelcoinBackgroundCheckProperties.java`
- `onboarding/infrastructure/adapter/celcoin/CelcoinBackgroundCheckMapper.java`
- `onboarding/infrastructure/adapter/celcoin/dto/*BackgroundCheck*.java`

### Step 007.4.1 - Definir port e DTOs internos

**Contrato base**:
```java
public interface BackgroundCheckProvider {
    RespostaPld consultarPessoa(RequisicaoPld requisicao, String correlationId);

    RespostaPld consultarEmpresa(RequisicaoPld requisicao, String correlationId);
}
```

**Regras**:
- `RequisicaoPld` inclui nome/razao social, documento, tipo (`PESSOA`, `EMPRESA`, `REPRESENTANTE`) e bases obrigatorias.
- `RespostaPld` consolida hits por base.
- `HitPld` inclui base, motivo, severidade, dataInclusao e payload provider.

### Step 007.4.2 - Implementar Fake

**Regra**:
- Default: resultado limpo.
- Em testes, permitir simular hit em qualquer base.
- Ativar por propriedade `app.pld.provider=fake`.

**Teste**:
- `FakeBackgroundCheckProviderTest`.

### Step 007.4.3 - Implementar Celcoin Background Check

**Regras**:
- Usar `RestClientFactory.forProvider("celcoin-background-check", baseUrl)`.
- Consultar as quatro bases obrigatorias.
- Se o provider Celcoin expuser endpoint consolidado, mapear para as quatro bases internamente.
- Se houver endpoints separados, executar em paralelo com `CompletableFuture` usando executor controlado; nao criar threads soltas.
- Qualquer hit e bloqueador.
- Detalhes de hit ficam restritos a persistencia/auditoria interna.

**Propriedades em `application.yml`**:
```yaml
app:
  pld:
    provider: ${APP_PLD_PROVIDER:fake}
  celcoin:
    background-check:
      base-url: ${APP_CELCOIN_BACKGROUND_CHECK_BASE_URL:https://sandbox.openfinance.celcoin.dev/onboarding/v1}
      client-id: ${APP_CELCOIN_CLIENT_ID:}
      client-secret: ${APP_CELCOIN_CLIENT_SECRET:}
```

### Step 007.4.4 - WireMock integration test

**Arquivo**:
- `onboarding/infrastructure/adapter/celcoin/CelcoinBackgroundCheckProviderIT.java`

**Validar**:
- Consulta limpa nas quatro bases.
- Hit em uma base bloqueia resposta consolidada.
- Falha transiente aciona retry.
- Payload bruto nao e logado.

**Verificacao**:
```bash
cd <sep-api-root>
./gradlew test --tests "*FakeBackgroundCheckProviderTest" --tests "*CelcoinBackgroundCheckProviderIT"
```

### Definicao de pronto da Task 7.4
- [ ] PLD consulta COAF, OFAC, INTERPOL e MTE.
- [ ] Hit em qualquer base vira resultado bloqueador.
- [ ] Fake cobre cenarios limpo e com hit.
- [ ] Adapter HTTP coberto por WireMock.

---

## Task 7.5 - Use cases KYB e PLD

**Objetivo**: implementar a orquestracao do onboarding PJ e o disparo automatico de PLD para PF/PJ.

**Pre-requisitos**: Tasks 7.3 e 7.4.

**Esforco**: 1-2 dias.

**Arquivos principais**:
- `onboarding/application/usecase/IniciarOnboardingEmpresaUseCase.java`
- `onboarding/application/usecase/IniciarVerificacaoKybUseCase.java`
- `onboarding/application/usecase/IniciarPldPessoaUseCase.java`
- `onboarding/application/usecase/IniciarPldEmpresaUseCase.java`
- `onboarding/application/usecase/ConsultarRepresentantesLegaisUseCase.java`
- `onboarding/application/listener/PldOrchestrationListener.java`
- `onboarding/domain/event/KybIniciadoEvent.java`
- `onboarding/domain/event/KybFinalizadoEvent.java`
- `onboarding/domain/event/PldIniciadoEvent.java`
- `onboarding/domain/event/PldFinalizadoEvent.java`
- `onboarding/domain/event/PldHitDetectadoEvent.java`

### Step 007.5.1 - Iniciar onboarding PJ

**Regras**:
- Usuario autenticado obrigatorio.
- CNPJ duplicado com status ativo gera 409.
- Criar `SolicitacaoOnboarding` tipo `EMPRESA`.
- Criar `KybEmpresa`.
- Publicar evento `KybIniciadoEvent` ou evento equivalente de onboarding PJ iniciado.

**Teste**:
- `IniciarOnboardingEmpresaUseCaseTest`: sucesso, CNPJ duplicado, CNPJ invalido.

### Step 007.5.2 - Disparar verificacao KYB

**Regras**:
- Aceitar apenas solicitacao tipo `EMPRESA`.
- Reusar fluxo de upload de documentos da Sprint 6 quando possivel; tipos PJ esperados devem incluir contrato social, CCMEI e comprovante de endereco.
- Gerar `Idempotency-Key` deterministica: `solicitacaoId + ":kyb:" + revisaoDocumentos`.
- Chamar `KybProvider.consultarCnpj`.
- Persistir `ConsultaCNPJ` e representantes legais.
- Situacao diferente de `ATIVA` reprova KYB e nao dispara PLD.
- Situacao `ATIVA` deixa KYB apto para PLD.

**Teste**:
- `IniciarVerificacaoKybUseCaseTest`: sucesso, situacao suspensa, sem documentos minimos, status invalido.

### Step 007.5.3 - PLD automatico para PF

**Regra**:
- `PldOrchestrationListener` escuta `OnboardingFinalizadoEvent` da Sprint 6.
- Quando PF finalizar com `APROVADO`, disparar `IniciarPldPessoaUseCase`.
- Resultado limpo move para `APROVADO_FINAL`.
- Hit move para `REPROVADO_PLD`.
- Se status final nao for `APROVADO`, nao disparar PLD.

**Teste**:
- `PldOrchestrationListenerTest`: KYC aprovado dispara PLD; KYC reprovado nao dispara; hit reprova.

### Step 007.5.4 - PLD automatico para PJ e representantes

**Regras**:
- Ao KYB aprovado, disparar PLD para empresa e para cada representante legal.
- Qualquer hit em empresa ou representante bloqueia onboarding completo (`REPROVADO_PLD`).
- Todos limpos movem para `APROVADO_FINAL`.
- Persistir `ConsultaPld` para cada alvo consultado.
- Idempotencia por alvo: `solicitacaoId + ":pld:" + alvoDocumento + ":" + revisao`.

**Teste**:
- `IniciarPldEmpresaUseCaseTest`: empresa limpa + representantes limpos, hit na empresa, hit em representante, reexecucao idempotente.

### Step 007.5.5 - Consultar representantes legais

**Regras**:
- Owner ou ADMIN.
- Retornar apenas dados permitidos para a borda REST.
- Nao retornar payload PLD bruto nem motivo detalhado de hit para cliente final.

**Teste**:
- `ConsultarRepresentantesLegaisUseCaseTest`: owner, admin, usuario alheio, nao encontrado.

### Definicao de pronto da Task 7.5
- [ ] Onboarding PJ cria solicitacao e KYB.
- [ ] KYB aprovado dispara PLD.
- [ ] KYC PF aprovado dispara PLD.
- [ ] Hit PLD bloqueia onboarding.
- [ ] Use cases cobertos por testes unitarios.

---

## Task 7.6 - Webhooks KYB e PLD

**Objetivo**: processar callbacks assincronos da Celcoin para KYB e PLD com HMAC, idempotencia e outbox.

**Pre-requisitos**: Tasks 7.3-7.5.

**Esforco**: 1 dia.

**Arquivos principais**:
- `onboarding/web/controller/CelcoinKybWebhookController.java`
- `onboarding/web/controller/CelcoinPldWebhookController.java`
- `onboarding/web/dto/CelcoinKybCallbackRequest.java`
- `onboarding/web/dto/CelcoinPldCallbackRequest.java`
- `onboarding/application/usecase/ProcessarCallbackKybUseCase.java`
- `onboarding/application/usecase/ProcessarCallbackPldUseCase.java`

**Componentes reusados da Sprint 4/6**:
- `WebhookSignatureValidator`
- `RegistrarWebhookEventUseCase`
- `WebhookEventLogRepository`
- `WebhookEventLog`

### Step 007.6.1 - Implementar endpoint KYB

**Endpoint**:
- `POST /api/v1/webhooks/celcoin/kyb`

**Regras**:
- Headers `Idempotency-Key` e assinatura HMAC obrigatorios.
- Provider no outbox: `celcoin-kyb`.
- Evento no outbox: `callback`.
- Duplicado idempotente retorna `202` sem reprocessar.
- Situacao cadastral diferente de `ATIVA` finaliza como `REPROVADO`.
- Situacao `ATIVA` persiste representantes e dispara PLD.

**Teste**:
- `CelcoinKybWebhookControllerTest`: aprovado, reprovado, idempotencia, HMAC invalido.
- `ProcessarCallbackKybUseCaseTest`.

### Step 007.6.2 - Implementar endpoint PLD

**Endpoint**:
- `POST /api/v1/webhooks/celcoin/pld`

**Regras**:
- Headers `Idempotency-Key` e assinatura HMAC obrigatorios.
- Provider no outbox: `celcoin-pld`.
- Evento no outbox: `callback`.
- Hit em qualquer base finaliza como `REPROVADO_PLD`.
- Resultado limpo consolida alvo consultado; se todos os alvos estiverem limpos, mover solicitacao para `APROVADO_FINAL`.
- Payload bruto fica em `consulta_pld.payload_provider`.

**Teste**:
- `CelcoinPldWebhookControllerTest`: limpo, hit, idempotencia, HMAC invalido.
- `ProcessarCallbackPldUseCaseTest`.

### Step 007.6.3 - Properties HMAC

**Adicionar em `application.yml`**:
```yaml
app:
  webhooks:
    secrets:
      celcoin-kyb: ${APP_WEBHOOK_SECRET_CELCOIN_KYB:dev-kyb-webhook-secret-change-me}
      celcoin-pld: ${APP_WEBHOOK_SECRET_CELCOIN_PLD:dev-pld-webhook-secret-change-me}
```

**Verificacao**:
```bash
cd <sep-api-root>
./gradlew test --tests "*CelcoinKybWebhookControllerTest" --tests "*CelcoinPldWebhookControllerTest" --tests "*ProcessarCallback*Kyb*Test" --tests "*ProcessarCallback*Pld*Test"
```

### Definicao de pronto da Task 7.6
- [ ] Webhooks dedicados resolvem antes do controller generico.
- [ ] HMAC obrigatorio.
- [ ] Idempotencia preservada.
- [ ] Outbox marca eventos processados/falhos corretamente.

---

## Task 7.7 - Endpoints REST, DTOs e OpenAPI PJ

**Objetivo**: expor contratos REST para onboarding de empresa, seguindo o padrao da Sprint 6.

**Pre-requisitos**: Tasks 7.5 e 7.6.

**Esforco**: 1 dia.

**Arquivos principais**:
- `onboarding/web/controller/OnboardingEmpresaController.java`
- `onboarding/web/dto/IniciarOnboardingEmpresaRequest.java`
- `onboarding/web/dto/EmpresaResponse.java`
- `onboarding/web/dto/RepresentanteLegalResponse.java`
- `onboarding/web/dto/StatusOnboardingEmpresaResponse.java`
- `onboarding/web/dto/ConsultaPldResumoResponse.java`
- `onboarding/web/mapper/OnboardingEmpresaWebMapper.java`

### Step 007.7.1 - Criar DTOs

**Contratos**:
- `IniciarOnboardingEmpresaRequest`: `cnpj`, `razaoSocial`, `nomeFantasia`, `tipoSocietario`, `porte`.
- `EmpresaResponse`: `id`, `status`, dados cadastrais basicos, datas.
- `StatusOnboardingEmpresaResponse`: status consolidado, dados KYB permitidos, representantes, resultado publico.
- `RepresentanteLegalResponse`: nome, CPF mascarado, cargo, status PLD publico.

**Validacoes**:
- CNPJ obrigatorio e validado pelo VO.
- Razao social obrigatoria.
- Nao aceitar PLD details no request.

### Step 007.7.2 - Criar controller

**Endpoints**:
- `POST /api/v1/onboarding/empresa` -> `201 Created`.
- `POST /api/v1/onboarding/empresa/{id}/documentos` -> `204 No Content`.
- `POST /api/v1/onboarding/empresa/{id}/verificar` -> `202 Accepted`.
- `GET /api/v1/onboarding/empresa/{id}` -> `200 OK`.
- `GET /api/v1/onboarding/empresa/{id}/representantes` -> `200 OK`.

**Seguranca**:
- Todos exigem JWT.
- Owner ou ADMIN para upload, verificar, status e representantes.
- Cliente nao acessa empresa de outro usuario.
- ADMIN pode operar assistidamente.

### Step 007.7.3 - OpenAPI

**Obrigatorio**:
- `@Tag(name = "onboarding")`.
- `@Operation` em todos endpoints.
- `@ApiResponses` cobrindo 200/201/202/204/400/401/403/404/409.
- `@Schema` nos DTOs com exemplos.
- Webhooks KYB/PLD documentados em tag `webhooks`.
- Atualizar `OpenApiConfigTest` com paths e schemas novos.

**Testes obrigatorios**:
- `OnboardingEmpresaControllerTest`.
- Atualizacao de `OpenApiConfigTest`.

### Definicao de pronto da Task 7.7
- [ ] 5 endpoints PJ funcionais.
- [ ] Ownership e ADMIN bypass cobertos.
- [ ] Erros seguem `ErrorResponseDto`.
- [ ] Swagger lista endpoints e schemas.

---

## Task 7.8 - Auditoria reforcada KYB + PLD

**Objetivo**: gravar eventos KYB e PLD em `audit_log_seguranca` com detalhes suficientes para auditoria BACEN/PLD, sem expor dados sensiveis desnecessarios.

**Pre-requisitos**: Tasks 7.5 e 7.6.

**Esforco**: meio dia.

**Arquivos principais**:
- `shared/audit/TipoEventoSeguranca.java`
- `onboarding/application/listener/OnboardingAuditListener.java`
- migration da Sprint 7 que atualiza `chk_audit_seguranca_tipo`

### Step 007.8.1 - Atualizar eventos de seguranca

**Eventos novos**:
```text
KYB_INICIADO
KYB_FINALIZADO_APROVADO
KYB_FINALIZADO_REPROVADO
PLD_INICIADO
PLD_HIT_DETECTADO
PLD_LIMPO
PLD_FINALIZADO
```

**Regra SQL**:
- Dropar e recriar `chk_audit_seguranca_tipo` incluindo eventos Sprint 5, Sprint 6 e Sprint 7.
- Nao recriar tabela `audit_log_seguranca`.

### Step 007.8.2 - Atualizar listener

**Eventos de dominio -> audit log**:
- `KybIniciadoEvent` -> `KYB_INICIADO`
- KYB aprovado -> `KYB_FINALIZADO_APROVADO`
- KYB reprovado -> `KYB_FINALIZADO_REPROVADO`
- `PldIniciadoEvent` -> `PLD_INICIADO`
- `PldHitDetectadoEvent` -> `PLD_HIT_DETECTADO`
- PLD limpo por alvo -> `PLD_LIMPO`
- PLD consolidado -> `PLD_FINALIZADO`

**Detalhes permitidos**:
- `solicitacaoId`
- `usuarioId`
- `tipoSolicitante`
- `cnpjMascarado` ou `documentoMascarado`
- `base`
- `severidade`
- `statusFinal`

**Proibido**:
- CPF/CNPJ completo em detalhes.
- Payload bruto provider no audit log.
- Conteudo de documentos.
- Dados completos de representante legal.

### Step 007.8.3 - Testar audit listener

**Teste**:
- `OnboardingAuditListenerTest`: todos os novos eventos e sanitizacao.

**Verificacao**:
```bash
cd <sep-api-root>
./gradlew test --tests "*OnboardingAuditListenerTest"
```

### Definicao de pronto da Task 7.8
- [ ] Eventos Java e constraint SQL sincronizados.
- [ ] KYB e PLD gravam audit log.
- [ ] Hits PLD registram base/motivo/severidade de forma sanitizada.
- [ ] Detalhes nao vazam documentos completos.

---

## Task 7.9 - Testes integrados e cobertura

**Objetivo**: validar fluxo completo PJ + PLD e follow-up automatico de PLD para PF.

**Pre-requisitos**: Tasks 7.1-7.8.

**Esforco**: 1 dia.

### Step 007.9.1 - Criar suite E2E PJ

**Arquivo**:
- `onboarding/web/OnboardingEmpresaIT.java`

**Cenarios obrigatorios**:
- Empresa cadastra -> KYB OK + PLD limpo para empresa e representantes -> `APROVADO_FINAL`.
- Empresa cadastra -> KYB OK + PLD com hit em representante -> `REPROVADO_PLD`.
- Empresa cadastra -> KYB com situacao `SUSPENSA` -> `REPROVADO` e PLD nao dispara.
- CNPJ duplicado em solicitacao ativa -> 409.
- Cliente A tenta acessar empresa do Cliente B -> 403.
- Token ausente -> 401.

### Step 007.9.2 - Criar suite de follow-up PLD para PF

**Arquivo**:
- `onboarding/web/PldFollowupIT.java`

**Cenarios obrigatorios**:
- PF passa KYC `APROVADO` -> PLD dispara automaticamente -> PLD limpo -> `APROVADO_FINAL`.
- PF passa KYC `APROVADO` -> PLD com hit -> `REPROVADO_PLD`.
- PF KYC `REPROVADO` -> PLD nao dispara.

### Step 007.9.3 - Cobrir webhooks e providers

**Cenarios obrigatorios**:
- Webhook KYB com HMAC invalido -> 401.
- Webhook PLD idempotente -> 202 e processamento unico.
- `CelcoinKybProviderIT` e `CelcoinBackgroundCheckProviderIT` passam com WireMock.

### Step 007.9.4 - Rodar cobertura

**Comandos**:
```bash
cd <sep-api-root>
./gradlew clean test jacocoTestReport jacocoTestCoverageVerification
./gradlew check
```

**Verificacao**:
- JaCoCo geral >= 70%.
- Modulo `onboarding` consolidado com cobertura >= 70%.
- Spotless verde.

### Definicao de pronto da Task 7.9
- [ ] E2E PJ feliz passa.
- [ ] Hit PLD em representante reprova onboarding.
- [ ] Follow-up PLD PF passa.
- [ ] Webhooks idempotentes passam.
- [ ] `./gradlew check` verde.

---

## Task 7.10 - Documentacao e fechamento

**Objetivo**: documentar KYB/PLD, preparar smoke manual e consolidar descricao de PR.

**Pre-requisitos**: Tasks 7.1-7.9.

**Esforco**: meio dia.

### Step 007.10.1 - Atualizar documentacao de onboarding

**Arquivo**:
- `<docs-SEP-root>/repos/sep-api/ONBOARDING.md`

**Adicionar**:
- Fluxo PJ.
- Diagrama textual consolidado PF/PJ:
  - `INICIADO`
  - `DOCUMENTOS_RECEBIDOS`
  - `EM_VERIFICACAO`
  - `APROVADO`
  - `APROVADO_FINAL`
  - `REPROVADO`
  - `REPROVADO_PLD`
  - `PENDENCIA`
- Endpoints PJ.
- Webhooks KYB/PLD.
- Como rodar com providers fake.
- Como rodar com `local-wiremock`.

### Step 007.10.2 - Criar `PLD.md`

**Arquivo**:
- `<docs-SEP-root>/repos/sep-api/PLD.md`

**Conteudo minimo**:
- Bases consultadas: COAF, OFAC, INTERPOL, MTE.
- Criterio de bloqueio: qualquer hit.
- Como os hits sao armazenados.
- O que nunca e exposto publicamente.
- Retencao minima de 5 anos (LGPD Art. 16).
- Fluxo de excecao/manual futuro na Sprint 14.
- Checklist para revisao juridica.

### Step 007.10.3 - Atualizar README do `sep-api`

**Adicionar**:
- Como rodar KYB/PLD local com providers fake.
- Env vars Celcoin sandbox.
- Env vars de webhooks `APP_WEBHOOK_SECRET_CELCOIN_KYB` e `APP_WEBHOOK_SECRET_CELCOIN_PLD`.
- Comandos de testes WireMock.

### Step 007.10.4 - Atualizar Postman/colecao se existir

**Arquivo esperado**:
- `docs-SEP/docs-sep/sep-api.postman_collection.json`

**Adicionar**:
- Pasta "Onboarding KYB PJ + PLD (Sprint 7)".
- Requests dos 5 endpoints PJ.
- Requests de webhook KYB e PLD.
- Variaveis `onboardingEmpresaId`, `kybWebhookSecret`, `pldWebhookSecret`.

### Step 007.10.5 - Atualizar PRD apos execucao

**Arquivo**:
- `docs-SEP/docs-sep/PRD.md`

**Regra**:
- Marcar Sprint 7 como executada apenas apos merge real da sprint.
- Durante implementacao, nao antecipar status concluido.

### Step 007.10.6 - Gerar descricao de PR

**Template**:
- Titulo sugerido: `feat(onboarding): implementar KYB de empresa e PLD`
- Resumo: onboarding PJ, KYB provider, PLD PF/PJ/representantes, webhooks e auditoria.
- Escopo tecnico: migrations, providers, endpoints, audit log, WireMock, docs.
- Como validar: comandos Gradle e smoke REST.
- Riscos: contratos reais Celcoin sandbox podem divergir dos stubs; politica PLD precisa revisao juridica.
- Referencia: spec 007 e este steps.

### Step 007.10.7 - Validacao final de working tree

**Comandos**:
```bash
cd <sep-api-root>
git status --short
git ls-files --others --exclude-standard
```

**Verificacao**:
- Nada untracked relevante ficou fora do commit.
- Commits usam Conventional Commits.
- Push e PR continuam manuais.
- `docs-SEP` editado, se houver, fica sem commit pelo agente.

### Definicao de pronto da Task 7.10
- [ ] `ONBOARDING.md` atualizado.
- [ ] `PLD.md` criado e pendente/aprovado por revisao juridica.
- [ ] README atualizado.
- [ ] Postman atualizado se aplicavel.
- [ ] Descricao de PR pronta.
- [ ] Working tree revisada.

---

## Definicao de pronto da Sprint 7

- `SolicitacaoOnboarding` suporta PF e PJ com migration aditiva.
- Entidades `KybEmpresa`, `ConsultaCNPJ`, `RepresentanteLegal` e `ConsultaPld` modeladas e migradas.
- `KybProvider` com Fake e Celcoin.
- `BackgroundCheckProvider` com Fake e Celcoin.
- 5 endpoints PJ funcionais e documentados.
- Webhooks `/api/v1/webhooks/celcoin/kyb` e `/api/v1/webhooks/celcoin/pld` com HMAC, idempotencia e outbox.
- PLD dispara automaticamente apos KYC PF aprovado.
- PLD dispara automaticamente apos KYB PJ aprovado para empresa e representantes.
- Hit PLD bloqueia onboarding com `REPROVADO_PLD`.
- Resultado limpo consolida `APROVADO_FINAL`.
- Auditoria reforcada cobre KYB e PLD.
- WireMock IT dos dois providers passa.
- Suite E2E PJ + PLD passa.
- `./gradlew check` verde.
- `PLD.md` criado e enviado para revisao juridica.
- PR description pronta; push e PR manuais.

---

## Impacto na Sprint 8

- Sprint 8 deve aceitar apenas solicitacoes com status `APROVADO_FINAL` como elegiveis para proposta de credito.
- `REPROVADO_PLD` deve bloquear criacao de proposta.
- Se KYB/PLD for reprocessado no futuro, a elegibilidade de credito deve ser reavaliada.
- `onboarding` passa a emitir eventos suficientes para `credito` reagir sem acessar repositories internos do modulo.

---

## Restricoes e regras de execucao

- PLD e obrigatorio por lei e nao pode ser desativado em producao.
- Bypass/fake de PLD apenas em `dev`, testes e `local-wiremock`.
- Hits PLD nunca sao expostos publicamente.
- Nao logar CPF/CNPJ completo, payload bruto, conteudo de documento ou detalhes sensiveis de hit.
- Nao acoplar dominio diretamente a Celcoin.
- Nao criar telas web/mobile nesta sprint.
- Nao quebrar contratos da Sprint 6 sem compatibilidade.
- Nao usar `git add -A`; adicionar paths especificos.
- `docs-SEP` nao recebe commit pelo agente.

---

## Referencias

- [PRD secao 3.1 - Marco regulatorio](../../docs-sep/PRD.md)
- [PRD secao 11 - Modulo onboarding + Provider Pattern](../../docs-sep/PRD.md)
- [PRD secao 22 - Sprint 7](../../docs-sep/PRD.md)
- [PRD secao 25 - Epic 5](../../docs-sep/PRD.md)
- [PRD secao 29 - Mapeamento Fase 2](../../docs-sep/PRD.md)
- [Spec 007 - Sprint 7](../../specs/fase-2/007-sprint-7-onboarding-kyb-empresa.md)
- [Spec 006 - Sprint 6](../../specs/fase-2/006-sprint-6-onboarding-kyc-pessoa.md)
- [Spec 008 - Sprint 8](../../specs/fase-2/008-sprint-8-credito-regras-parecer.md)
- [ADR 0004 - Provider Pattern para integracoes externas](../../adr/0004-provider-pattern-para-integracoes-externas.md)
- [ADR 0007 - DDD com Hexagonal Ports & Adapters por modulo](../../adr/0007-ddd-com-hexagonal-ports-and-adapters-por-modulo.md)
- [ADR 0008 - WireMock para testes integracao Celcoin](../../adr/0008-wiremock-para-testes-integracao-celcoin.md)
- Resolucao CMN 4.656/2018.
- Lei 9.613/1998.
- COAF.
- OFAC.
- INTERPOL Notices.
- MTE - Lista de Trabalho Escravo.
