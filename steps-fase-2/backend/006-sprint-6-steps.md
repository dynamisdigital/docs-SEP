# Steps - Sprint 6 - Onboarding KYC Pessoa Fisica

**Spec de origem**: [`specs/fase-2/006-sprint-6-onboarding-kyc-pessoa.md`](../../specs/fase-2/006-sprint-6-onboarding-kyc-pessoa.md)

**Status**: a implementar.

**Objetivo geral**: implementar o modulo `onboarding` para KYC de pessoa fisica, com solicitacao de onboarding, upload interno de documentos, Provider Pattern para Celcoin, callback assincrono via Webhook Receiver, trilha auditavel reforcada e contratos REST documentados.

**Esforco total estimado**: 6-9 dias de Dev Senior.

**Repo de destino**:
- `sep-api`: backend Spring Boot, unico repo alterado nesta sprint.

**Branch sugerida**:
- `feature/sprint-6-onboarding-kyc-pessoa`

**Pre-requisitos globais**:
- Sprint 5 concluida e follow-ups de seguranca integrados em `develop`.
- `sep-api` em `develop` atualizado a partir de `origin/develop`.
- Webhook Receiver Pattern da Sprint 4 funcional.
- `audit_log_seguranca` da Sprint 5 funcional.
- ADRs 0004, 0007 e 0008 vigentes.
- Credenciais Celcoin sandbox disponiveis para smoke manual posterior; CI deve usar Fake/WireMock.

**Fora de escopo**:
- KYB pessoa juridica.
- Consultas PLD completas (COAF, OFAC, INTERPOL, MTE).
- Telas web/mobile.
- Storage S3/MinIO.
- Reprocessamento manual de KYC pelo backoffice.
- Mudanca do fluxo aprovado na spec para webview Celcoin. O backend mantem upload interno nesta sprint; detalhes Celcoin/webview ficam encapsulados no adapter ou follow-up.

---

## Ordem de execucao recomendada

```text
6.0 (prechecks)
 |
 v
6.1 (dominio + migration V7)
 |
 +--> 6.2 (KycProvider + Fake/Celcoin + WireMock)
 |
 v
6.3 (use cases + storage de documentos)
 |
 v
6.4 (webhook KYC Celcoin)
 |
 v
6.5 (REST + DTOs + OpenAPI)
 |
 v
6.6 (auditoria reforcada)
 |
 v
6.7 (testes integrados)
 |
 v
6.8 (documentacao + validacao final)
```

- Tasks 6.1 e 6.2 podem avancar em paralelo depois dos prechecks.
- 6.3 depende do dominio e do port `KycProvider`.
- 6.4 depende da persistencia e dos use cases.
- 6.5 deve ser feita depois dos contratos internos estabilizados.
- 6.6 deve ser fechada antes dos testes E2E finais para validar audit log.

---

## Task 6.0 - Prechecks da Sprint 6

**Objetivo**: confirmar que a sprint nasce de `develop` atualizado e que o backend esta verde antes de qualquer codigo de onboarding.

**Esforco**: 1-2 horas.

### Step 006.0.1 - Conferir estado Git do `sep-api`

**Comandos**:
```bash
cd <sep-api-root>
git fetch --all --prune
git status --short --branch
git rev-list --left-right --count HEAD...origin/develop
```

**Verificacao**:
- A branch de trabalho atual deve estar limpa.
- Se estiver em branch de follow-up da Sprint 5, trocar para `develop` somente depois de garantir que nao ha mudancas locais pendentes.
- `develop` local deve estar alinhada a `origin/develop`.

### Step 006.0.2 - Criar branch da sprint

**Comandos**:
```bash
cd <sep-api-root>
git switch develop
git pull --ff-only
git switch -c feature/sprint-6-onboarding-kyc-pessoa
```

**Verificacao**:
- A branch nasce de `develop` atualizado.
- Se `git pull --ff-only` falhar, abortar e avisar o usuario; nao resolver divergencia automaticamente.

### Step 006.0.3 - Rodar baseline backend

**Comandos**:
```bash
cd <sep-api-root>
./gradlew clean test
./gradlew bootJar
```

**Verificacao**:
- Testes passam antes de qualquer mudanca.
- Build passa.
- Se algum teste depende de PostgreSQL local, subir o Docker Compose conforme README do `sep-api`.

### Step 006.0.4 - Conferir migrations e pontos de extensao

**Comandos**:
```bash
cd <sep-api-root>
find src/main/resources/db/migration -maxdepth 1 -type f | sort
grep -R "enum TipoEventoSeguranca" -n src/main/java/com/dynamis/sep_api/shared/audit
grep -R "class WebhookController" -n src/main/java/com/dynamis/sep_api/shared
```

**Verificacao**:
- Ultima migration atual esperada: `V6__add_flags_seguranca_usuario.sql`.
- Proxima migration da Sprint 6: `V7__criar_tabelas_onboarding_kyc.sql`.
- `TipoEventoSeguranca` e `audit_log_seguranca` exigem atualizacao coordenada de enum Java + check constraint SQL.

### Definicao de pronto da Task 6.0
- [ ] Branch correta criada a partir de `develop`.
- [ ] Baseline backend verde.
- [ ] Migration `V7` reservada para Sprint 6.
- [ ] Pontos de extensao de webhook e audit log identificados.

---

## Task 6.1 - Dominio, entidades e migration V7

**Objetivo**: criar o nucleo do modulo `onboarding`, persistencia e estados do KYC PF.

**Pre-requisito**: Task 6.0 concluida.

**Esforco**: 1-2 dias.

**Arquivos principais no `sep-api`**:
- `onboarding/domain/model/SolicitacaoOnboarding.java`
- `onboarding/domain/model/DocumentoCadastral.java`
- `onboarding/domain/model/ResultadoVerificacao.java`
- `onboarding/domain/vo/Cpf.java`
- `onboarding/domain/vo/TipoDocumento.java`
- `onboarding/domain/vo/StatusOnboarding.java`
- `onboarding/domain/event/OnboardingIniciadoEvent.java`
- `onboarding/domain/event/DocumentoCadastralEnviadoEvent.java`
- `onboarding/domain/event/VerificacaoKycDisparadaEvent.java`
- `onboarding/domain/event/OnboardingFinalizadoEvent.java`
- `onboarding/domain/exception/OnboardingNaoEncontradoException.java`
- `onboarding/domain/exception/StatusOnboardingInvalidoException.java`
- `onboarding/domain/exception/CpfComOnboardingAtivoException.java`
- `onboarding/infrastructure/persistence/SolicitacaoOnboardingRepository.java`
- `onboarding/infrastructure/persistence/DocumentoCadastralRepository.java`
- `onboarding/infrastructure/persistence/ResultadoVerificacaoRepository.java`
- `src/main/resources/db/migration/V7__criar_tabelas_onboarding_kyc.sql`

### Step 006.1.1 - Criar VOs e enums

**Decisoes obrigatorias**:
- `TipoDocumento` deve ser enum simples com: `RG`, `CNH`, `PASSAPORTE`, `SELFIE`.
- `StatusOnboarding` deve ser enum simples com: `INICIADO`, `DOCUMENTOS_RECEBIDOS`, `EM_VERIFICACAO`, `APROVADO`, `REPROVADO`, `PENDENCIA`.
- `Cpf` deve ser `record`, armazenar apenas 11 digitos normalizados e validar digitos verificadores.

**Regras**:
- Rejeitar CPF nulo, branco, com tamanho invalido, sequencia repetida ou digitos invalidos.
- Expor `formatado()` apenas para exibicao; persistencia usa `valor()`.

**Testes obrigatorios**:
- `CpfTest`: CPF valido com e sem mascara, CPF invalido, sequencia repetida, formatacao.

### Step 006.1.2 - Criar entidades de dominio

**Regras de modelagem**:
- `SolicitacaoOnboarding` e agregado raiz e estende `EntidadeAuditavel`.
- `SolicitacaoOnboarding` guarda `usuarioId`, `cpf`, `nomeCompleto`, `dataNascimento`, `status`, `idVerificacaoExterna` e `revisaoDocumentos`.
- `DocumentoCadastral` pertence a uma solicitacao, guarda `tipo`, `conteudo`, `mimeType`, `nomeOriginal`, `tamanhoBytes`, `sha256` e `dataEnvio`.
- `ResultadoVerificacao` e 1:1 com solicitacao, guarda `statusFinal`, `motivo`, `payloadProvider` JSONB e `dataResultado`.
- IDs usam UUID v6 com `Generators.timeBasedReorderedGenerator()`.
- Transicoes validas:
  - `INICIADO` -> `DOCUMENTOS_RECEBIDOS`
  - `DOCUMENTOS_RECEBIDOS` -> `EM_VERIFICACAO`
  - `EM_VERIFICACAO` -> `APROVADO`, `REPROVADO` ou `PENDENCIA`
- Nao permitir alteracao de documentos quando status for final.

**Testes obrigatorios**:
- `SolicitacaoOnboardingTest`: criacao, transicoes validas, transicoes invalidas, incremento de `revisaoDocumentos`, status final bloqueia novos documentos.

### Step 006.1.3 - Criar migration V7

**Arquivo**: `src/main/resources/db/migration/V7__criar_tabelas_onboarding_kyc.sql`

**Tabelas obrigatorias**:
- `solicitacao_onboarding`
- `documento_cadastral`
- `resultado_verificacao`

**Schema minimo**:
```sql
CREATE TABLE solicitacao_onboarding (
    id UUID PRIMARY KEY,
    usuario_id UUID NOT NULL,
    cpf VARCHAR(11) NOT NULL,
    nome_completo VARCHAR(255) NOT NULL,
    data_nascimento DATE NOT NULL,
    status VARCHAR(40) NOT NULL,
    id_verificacao_externa VARCHAR(120),
    revisao_documentos INTEGER NOT NULL DEFAULT 0,
    data_criacao TIMESTAMP WITH TIME ZONE NOT NULL,
    data_modificacao TIMESTAMP WITH TIME ZONE NOT NULL,
    criado_por VARCHAR(50) NOT NULL,
    modificado_por VARCHAR(50) NOT NULL,
    CONSTRAINT fk_solicitacao_onboarding_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id),
    CONSTRAINT chk_solicitacao_onboarding_status CHECK (status IN (
        'INICIADO', 'DOCUMENTOS_RECEBIDOS', 'EM_VERIFICACAO',
        'APROVADO', 'REPROVADO', 'PENDENCIA'
    ))
);
```

**Indices obrigatorios**:
- `idx_onboarding_usuario_data` em `(usuario_id, data_criacao DESC)`.
- `idx_onboarding_cpf_status` em `(cpf, status)`.
- `idx_onboarding_verificacao_externa` em `id_verificacao_externa`.
- Indice unico parcial para impedir CPF ativo duplicado:
```sql
CREATE UNIQUE INDEX uq_onboarding_cpf_ativo
    ON solicitacao_onboarding (cpf)
    WHERE status IN ('INICIADO', 'DOCUMENTOS_RECEBIDOS', 'EM_VERIFICACAO', 'APROVADO', 'PENDENCIA');
```

**Documento**:
- `conteudo BYTEA NOT NULL`.
- `sha256 VARCHAR(64) NOT NULL`.
- Check de `mime_type` para `image/jpeg`, `image/png`, `application/pdf`.
- Check de `tamanho_bytes <= 10485760`.

**Resultado**:
- `payload_provider JSONB`.
- FK unica por `solicitacao_id`.

### Step 006.1.4 - Atualizar audit log para eventos KYC

**Arquivos**:
- `shared/audit/TipoEventoSeguranca.java`
- `V7__criar_tabelas_onboarding_kyc.sql`

**Eventos novos**:
```text
KYC_INICIADO
KYC_DOCUMENTO_ENVIADO
KYC_VERIFICACAO_DISPARADA
KYC_FINALIZADO_APROVADO
KYC_FINALIZADO_REPROVADO
KYC_FINALIZADO_PENDENCIA
```

**Regra SQL**:
- Dropar e recriar o check constraint `chk_audit_seguranca_tipo` incluindo os 12 eventos da Sprint 5 + os 6 eventos KYC.
- Nao recriar a tabela `audit_log_seguranca`.

### Step 006.1.5 - Criar repositories e testes JPA

**Metodos obrigatorios**:
- `SolicitacaoOnboardingRepository.existsByCpfAndStatusIn(...)`
- `SolicitacaoOnboardingRepository.findByIdAndUsuarioId(...)`
- `SolicitacaoOnboardingRepository.findByIdVerificacaoExterna(...)`
- `DocumentoCadastralRepository.existsBySolicitacaoIdAndTipo(...)`
- `ResultadoVerificacaoRepository.findBySolicitacaoId(...)`

**Testes obrigatorios**:
- `SolicitacaoOnboardingRepositoryTest`
- `DocumentoCadastralRepositoryTest`
- `ResultadoVerificacaoRepositoryTest`

**Verificacao**:
```bash
cd <sep-api-root>
./gradlew test --tests "*CpfTest" --tests "*SolicitacaoOnboardingTest"
./gradlew test --tests "*Onboarding*RepositoryTest"
```

### Definicao de pronto da Task 6.1
- [ ] Dominio compila.
- [ ] Migration V7 sobe no boot.
- [ ] Check constraint de audit log aceita eventos KYC.
- [ ] Repositories cobertos por testes.

---

## Task 6.2 - KycProvider, FakeKycProvider e CelcoinKycProvider

**Objetivo**: isolar integracao Celcoin por Provider Pattern, com fake deterministico para dev/test e adapter HTTP testado por WireMock.

**Pre-requisito**: Task 6.1 iniciada ou concluida.

**Esforco**: 1-2 dias.

**Arquivos principais**:
- `onboarding/application/port/out/KycProvider.java`
- `onboarding/application/port/out/dto/RequisicaoVerificacaoKyc.java`
- `onboarding/application/port/out/dto/RespostaInicioVerificacao.java`
- `onboarding/application/port/out/dto/ResultadoKycProvider.java`
- `onboarding/infrastructure/adapter/celcoin/FakeKycProvider.java`
- `onboarding/infrastructure/adapter/celcoin/CelcoinKycProvider.java`
- `onboarding/infrastructure/adapter/celcoin/CelcoinKycProperties.java`
- `onboarding/infrastructure/adapter/celcoin/CelcoinKycMapper.java`
- `onboarding/infrastructure/adapter/celcoin/dto/CelcoinKycRequest.java`
- `onboarding/infrastructure/adapter/celcoin/dto/CelcoinKycResponse.java`

### Step 006.2.1 - Definir port e DTOs internos

**Contrato obrigatorio**:
```java
public interface KycProvider {
    RespostaInicioVerificacao iniciarVerificacao(RequisicaoVerificacaoKyc requisicao, String correlationId);

    ResultadoKycProvider consultarResultado(String idVerificacaoExterna, String correlationId);
}
```

**Decisoes**:
- `RequisicaoVerificacaoKyc` inclui `solicitacaoId`, `usuarioId`, CPF, nome, data nascimento e metadados dos documentos, nunca binario cru em log.
- `RespostaInicioVerificacao` inclui `idVerificacaoExterna` e `statusInicial`.
- `ResultadoKycProvider` inclui status final, motivo e payload bruto em `String`.

### Step 006.2.2 - Implementar FakeKycProvider

**Regra**:
- Deve retornar `idVerificacaoExterna = "fake-" + solicitacaoId`.
- Deve retornar `APROVADO` para consulta, com payload JSON minimo.
- Ativar por propriedade `app.kyc.provider=fake` ou profile `local-wiremock`.

**Teste**:
- `FakeKycProviderTest`.

### Step 006.2.3 - Implementar CelcoinKycProvider

**Regras**:
- Usar `RestClientFactory.forProvider("celcoin-kyc", baseUrl)`.
- Ler propriedades em `app.celcoin.kyc.*`.
- Enviar `Idempotency-Key` e `X-Correlation-Id` quando disponiveis.
- Encapsular URLs e payloads nos DTOs do adapter.
- Mapear resposta Celcoin para `RespostaInicioVerificacao`/`ResultadoKycProvider`.
- Nunca vazar credenciais, payload de documento ou token em logs.

**Propriedades em `application.yml`**:
```yaml
app:
  kyc:
    provider: ${APP_KYC_PROVIDER:fake}
  celcoin:
    kyc:
      base-url: ${APP_CELCOIN_KYC_BASE_URL:https://sandbox.openfinance.celcoin.dev/onboarding/v1}
      client-id: ${APP_CELCOIN_CLIENT_ID:}
      client-secret: ${APP_CELCOIN_CLIENT_SECRET:}
      webhook-secret: ${APP_CELCOIN_KYC_WEBHOOK_SECRET:dev-kyc-webhook-secret-change-me}
```

**Resilience4j**:
- Instance name: `celcoin-kyc`.
- Retry: 3 tentativas.
- Timeout: 30s.
- Circuit breaker com defaults do projeto, override por `application.yml` se necessario.

### Step 006.2.4 - Criar WireMock integration test

**Arquivo**:
- `onboarding/infrastructure/adapter/celcoin/CelcoinKycProviderIT.java`

**Validar**:
- URL chamada conforme propriedades.
- Headers `Authorization`, `Idempotency-Key`, `X-Correlation-Id`.
- Parsing de sucesso.
- Erro 4xx vira excecao de integracao controlada.
- Erro 5xx aciona retry.

**Verificacao**:
```bash
cd <sep-api-root>
./gradlew test --tests "*FakeKycProviderTest" --tests "*CelcoinKycProviderIT"
```

### Definicao de pronto da Task 6.2
- [ ] Port nao depende de Celcoin.
- [ ] Fake e Celcoin selecionaveis por configuracao.
- [ ] Adapter HTTP coberto por WireMock.
- [ ] Nenhum segredo/documento sensivel e logado.

---

## Task 6.3 - Use cases e storage de documentos

**Objetivo**: implementar o ciclo de vida da solicitacao: iniciar, anexar documentos, disparar verificacao e consultar status.

**Pre-requisitos**: Tasks 6.1 e 6.2.

**Esforco**: 1-2 dias.

**Arquivos principais**:
- `onboarding/application/usecase/IniciarOnboardingPessoaUseCase.java`
- `onboarding/application/usecase/EnviarDocumentoUseCase.java`
- `onboarding/application/usecase/IniciarVerificacaoKycUseCase.java`
- `onboarding/application/usecase/ConsultarStatusOnboardingUseCase.java`
- `onboarding/application/port/out/DocumentoStorage.java` (port — `application/port/out/` segue convencao do `KycProvider` e ADR 0007; nao usar `application/service/`)
- `onboarding/infrastructure/persistence/JpaDocumentoStorage.java`
- `onboarding/application/dto/DocumentoUploadCommand.java`
- `onboarding/application/dto/StatusOnboardingView.java`

### Step 006.3.1 - Iniciar onboarding PF

**Regras**:
- Usuario autenticado e obrigatorio.
- `usuarioId` vem do principal autenticado.
- CPF duplicado com status ativo gera `CpfComOnboardingAtivoException` -> 409.
- Criar status `INICIADO`.
- Publicar `OnboardingIniciadoEvent`.

**Teste**:
- `IniciarOnboardingPessoaUseCaseTest`: sucesso, CPF duplicado, CPF invalido.

### Step 006.3.2 - Enviar documento

**Regras**:
- Aceitar apenas status `INICIADO` e `DOCUMENTOS_RECEBIDOS`.
- Validar MIME type: `image/jpeg`, `image/png`, `application/pdf`.
- Validar tamanho maximo: 10MB.
- Calcular SHA-256 do conteudo.
- Persistir binario em `documento_cadastral.conteudo`.
- Incrementar `revisaoDocumentos`.
- Ao primeiro documento, transicionar para `DOCUMENTOS_RECEBIDOS`.
- Publicar `DocumentoCadastralEnviadoEvent`.

**Teste**:
- `EnviarDocumentoUseCaseTest`: sucesso, MIME invalido, tamanho excedido, status invalido.

### Step 006.3.3 - Disparar verificacao KYC

**Regras**:
- Exigir ao menos 1 documento de identidade (`RG`, `CNH` ou `PASSAPORTE`) e 1 `SELFIE`.
- Aceitar apenas status `DOCUMENTOS_RECEBIDOS`.
- Gerar chave idempotente deterministica para provider: `solicitacaoId + ":" + revisaoDocumentos`.
- Chamar `KycProvider.iniciarVerificacao`.
- Persistir `idVerificacaoExterna`.
- Transicionar para `EM_VERIFICACAO`.
- Publicar `VerificacaoKycDisparadaEvent`.

**Teste**:
- `IniciarVerificacaoKycUseCaseTest`: sucesso com fake, sem selfie, sem documento identidade, status invalido, idempotencia.

### Step 006.3.4 - Consultar status

**Regras**:
- Cliente consulta apenas solicitacao propria.
- Admin pode consultar qualquer solicitacao.
- Retornar status, documentos enviados por tipo, datas e resultado quando existir.

**Teste**:
- `ConsultarStatusOnboardingUseCaseTest`: owner, admin, usuario alheio, nao encontrado.

### Definicao de pronto da Task 6.3
- [ ] Use cases transacionais implementados.
- [ ] Storage BYTEA isolado atras de `DocumentoStorage`.
- [ ] Regras de documento minimo e ownership cobertas.

---

## Task 6.4 - Webhook KYC Celcoin

**Objetivo**: processar callback assincrono de KYC, reaproveitando idempotencia e validacao HMAC do pattern da Sprint 4.

**Pre-requisitos**: Tasks 6.1-6.3.

**Esforco**: 1 dia.

**Arquivos principais**:
- `onboarding/web/controller/CelcoinKycWebhookController.java`
- `onboarding/web/dto/CelcoinKycCallbackRequest.java`
- `onboarding/application/usecase/ProcessarCallbackKycUseCase.java`
- `onboarding/infrastructure/adapter/celcoin/CelcoinWebhookHeaderNormalizer.java` (opcional — so se for preciso aceitar header alias `X-Celcoin-Signature`; caso contrario, usar `WebhookSignatureValidator` direto sem wrapper)

**Componentes reusados da Sprint 4 (NAO duplicar)**:
- `shared/application/port/out/WebhookSignatureValidator` — port HMAC.
- `shared/infrastructure/adapter/HmacSignatureValidator` — adapter HMAC SHA-256.
- `shared/application/usecase/RegistrarWebhookEventUseCase` — outbox + idempotencia.
- `shared/infrastructure/persistence/WebhookEventLogRepository` — repositorio outbox.
- `shared/domain/model/WebhookEventLog` — entidade outbox.

### Step 006.4.1 - Implementar endpoint KYC dedicado

**Endpoint**:
- `POST /api/v1/webhooks/celcoin/kyc`

**Resolucao de rota vs `WebhookController` generico (Sprint 4)**:
- Ja existe `shared/web/controller/WebhookController.java` mapeado em `POST /api/v1/webhooks/{provider}/{event}`. O endpoint dedicado `/celcoin/kyc` casa com esse pattern, mas o Spring `RequestMappingHandlerMapping` resolve por especificidade: segmento literal vence `PathVariable`. Logo, `CelcoinKycWebhookController` com `@PostMapping("/celcoin/kyc")` tem precedencia sobre o handler generico — sem `AmbiguousHandlerMappingException`.
- Validar essa resolucao no `OnboardingPessoaIT` (Task 6.7): enviar request a `/celcoin/kyc` e confirmar que o handler dedicado processou (e nao o generico que apenas registra no outbox).
- **Reusar componentes da Sprint 4** ao inves de duplicar:
  - `WebhookSignatureValidator` (`shared/application/port/out/`) — port para HMAC; injetar diretamente.
  - `HmacSignatureValidator` (`shared/infrastructure/adapter/`) — adapter ja registra `app.webhooks.secrets.<provider>`. Adicionar `app.webhooks.secrets.celcoin-kyc` em `application.yml` (chave HMAC dedicada Celcoin KYC, distinta da chave generica `celcoin`).
  - `WebhookEventLogRepository` (`shared/infrastructure/persistence/`) — outbox; injetar via `RegistrarWebhookEventUseCase` (`shared/application/usecase/`) que ja faz `existsByIdempotencyKey` + `save`.
- A classe `CelcoinWebhookHeaderNormalizer` (listada nos arquivos da Task 6.4) so deve existir se a sandbox Celcoin exigir o header `X-Celcoin-Signature` em vez de `X-Webhook-Signature`. Funcao: normalizar o nome do header e delegar ao `WebhookSignatureValidator`. Se Celcoin aceitar `X-Webhook-Signature` direto, omitir essa classe.

**Headers**:
- `Idempotency-Key` obrigatorio.
- `X-Webhook-Signature` obrigatorio, mantendo compatibilidade com `WebhookController`.
- Aceitar alias `X-Celcoin-Signature` se Celcoin sandbox exigir esse nome; normalizar internamente para uma assinatura antes de chamar o `WebhookSignatureValidator`.

**Resposta**:
- `202 Accepted` para evento aceito.
- `202 Accepted` para duplicado idempotente.
- `400` para headers/body ausentes.
- `401` para assinatura invalida.

### Step 006.4.2 - Persistir callback e aplicar resultado

**Regras**:
- Persistir o callback no outbox via `RegistrarWebhookEventUseCase.executar("celcoin-kyc", "callback", idempotencyKey, signature, payload)`. O use case da Sprint 4 ja insere `WebhookEventLog` em status `PENDENTE`, trata idempotencia via `WebhookEventLogRepository.existsByIdempotencyKey(...)` e corridas concorrentes via `DataIntegrityViolationException`. Retorno `false` indica duplicado idempotente — interromper processamento e responder `202`.
- Apos `executar` retornar `true` (novo evento), continuar para processamento de dominio:
  - Localizar solicitacao por `idVerificacaoExterna` via `SolicitacaoOnboardingRepository.findByIdVerificacaoExterna(...)`.
  - Criar ou atualizar `ResultadoVerificacao` (`ResultadoVerificacaoRepository`).
  - Transicionar solicitacao para `APROVADO`, `REPROVADO` ou `PENDENCIA`.
  - Persistir `payloadProvider` cru como JSONB no `resultado_verificacao` (NUNCA no `webhook_event_log` — outbox so guarda payload bruto raw HTTP).
  - Publicar `OnboardingFinalizadoEvent`.
- Atualizar status do `WebhookEventLog` correspondente para `PROCESSADO` ao final via `WebhookEventLogRepository.findByIdempotencyKey(...)` + setter de status — fechar o ciclo do outbox.

### Step 006.4.3 - Falhas e outbox

**Regras**:
- Se payload for valido mas solicitacao nao existir, manter evento no outbox como `PENDENTE` ou `FALHOU` conforme mecanismo existente; nao descartar silenciosamente.
- Erros de assinatura nao entram no outbox.
- Nao expor payload sensivel no response.

**Testes obrigatorios**:
- `CelcoinKycWebhookControllerTest` (cobre rota dedicada, HMAC valido/invalido, idempotencia via `RegistrarWebhookEventUseCase`).
- `ProcessarCallbackKycUseCaseTest`.
- `CelcoinWebhookHeaderNormalizerTest` (somente se a classe foi criada na Task 6.4).
- **Nao reescrever** `HmacSignatureValidatorTest` da Sprint 4; ele cobre a logica HMAC. Bastam smokes de wiring do controller dedicado.

### Definicao de pronto da Task 6.4
- [ ] Callback KYC idempotente.
- [ ] HMAC obrigatorio.
- [ ] Resultado final persiste payload bruto.
- [ ] Evento de finalizacao publicado.

---

## Task 6.5 - Endpoints REST, DTOs e OpenAPI

**Objetivo**: expor API publica versionada do onboarding PF, com DTOs, MapStruct e documentacao Springdoc.

**Pre-requisitos**: Tasks 6.3 e 6.4.

**Esforco**: 1 dia.

**Arquivos principais**:
- `onboarding/web/controller/OnboardingPessoaController.java`
- `onboarding/web/dto/IniciarOnboardingRequest.java`
- `onboarding/web/dto/OnboardingResponse.java`
- `onboarding/web/dto/StatusOnboardingResponse.java`
- `onboarding/web/dto/DocumentoEnviadoResponse.java`
- `onboarding/web/mapper/OnboardingWebMapper.java`

### Step 006.5.1 - Criar DTOs

**Contratos**:
- `IniciarOnboardingRequest`: `cpf`, `nomeCompleto`, `dataNascimento`.
- `OnboardingResponse`: `id`, `status`, `dataCriacao`, `dataModificacao`.
- `StatusOnboardingResponse`: `id`, `status`, `documentosEnviados`, `resultado`, `dataCriacao`, `dataModificacao`.
- Upload de documento usa multipart com partes `tipo` e `arquivo`.

**Validacoes**:
- `cpf`, `nomeCompleto`, `dataNascimento` obrigatorios.
- CPF pode vir com ou sem mascara.
- `dataNascimento` deve ser data passada.

### Step 006.5.2 - Criar controller

**Endpoints**:
- `POST /api/v1/onboarding/pessoa` -> `201 Created`.
- `POST /api/v1/onboarding/pessoa/{id}/documentos` -> `204 No Content`.
- `POST /api/v1/onboarding/pessoa/{id}/verificar` -> `202 Accepted`.
- `GET /api/v1/onboarding/pessoa/{id}` -> `200 OK`.

**Seguranca**:
- Todos exigem JWT.
- `POST /pessoa`: `CLIENTE` ou `ADMIN`.
- Upload/verificar: owner da solicitacao ou `ADMIN`.
- Consulta: owner ou `ADMIN`.
- Nao exigir step-up nesta sprint; KYC e sensivel, mas a spec 006 nao definiu step-up para estes endpoints.

### Step 006.5.3 - OpenAPI

**Obrigatorio**:
- `@Tag(name = "onboarding")`.
- `@Operation` em todos endpoints.
- `@ApiResponses` cobrindo 200/201/202/204/400/401/403/404/409.
- `@Schema` nos DTOs com exemplos.
- Webhook KYC tambem documentado em tag `webhooks`.

**Testes obrigatorios**:
- `OnboardingPessoaControllerTest`.
- Atualizar `OpenApiConfigTest` para verificar paths novos.

### Definicao de pronto da Task 6.5
- [ ] Endpoints REST funcionais.
- [ ] Erros seguem `ErrorResponseDto`.
- [ ] Swagger lista endpoints e schemas.

---

## Task 6.6 - Auditoria reforcada KYC

**Objetivo**: gravar eventos KYC em `audit_log_seguranca`, alem da auditoria JPA generica.

**Pre-requisitos**: Tasks 6.1, 6.3 e 6.4.

**Esforco**: meio dia.

**Arquivos principais**:
- `onboarding/application/listener/OnboardingAuditListener.java`
- `shared/audit/TipoEventoSeguranca.java`

### Step 006.6.1 - Implementar listener de eventos

**Mecanismo de gravacao**:
- `OnboardingAuditListener` injeta `AuditLogSegurancaService` (Sprint 5, `shared/audit/AuditLogSegurancaService.java`) e chama `gravar(TipoEventoSeguranca tipo, UUID usuarioId, String detalhesJson)` para cada evento. Nao acessar `AuditLogSegurancaRepository` direto — passar sempre pelo service para manter consistencia com Sprint 5.
- Listener usa `@EventListener` Spring (sincrono dentro da mesma transacao do use case); avaliar `@TransactionalEventListener(phase = AFTER_COMMIT)` se houver risco de gravar audit log para evento de dominio que foi revertido por rollback.

**Eventos de dominio -> audit log**:
- `OnboardingIniciadoEvent` -> `TipoEventoSeguranca.KYC_INICIADO`
- `DocumentoCadastralEnviadoEvent` -> `TipoEventoSeguranca.KYC_DOCUMENTO_ENVIADO`
- `VerificacaoKycDisparadaEvent` -> `TipoEventoSeguranca.KYC_VERIFICACAO_DISPARADA`
- `OnboardingFinalizadoEvent` com `APROVADO` -> `TipoEventoSeguranca.KYC_FINALIZADO_APROVADO`
- `OnboardingFinalizadoEvent` com `REPROVADO` -> `TipoEventoSeguranca.KYC_FINALIZADO_REPROVADO`
- `OnboardingFinalizadoEvent` com `PENDENCIA` -> `TipoEventoSeguranca.KYC_FINALIZADO_PENDENCIA`

**Detalhes JSON permitidos**:
- `solicitacaoId`
- `usuarioId`
- `tipoDocumento`
- `sha256`
- `idVerificacaoExterna`
- `statusFinal`

**Proibido**:
- CPF completo em detalhes.
- Nome completo em detalhes.
- Conteudo de documento.
- Payload bruto Celcoin no audit log de seguranca. Payload bruto fica em `resultado_verificacao.payload_provider`.

### Step 006.6.2 - Testar audit listener

**Teste**:
- `OnboardingAuditListenerTest`.

**Verificacao**:
```bash
cd <sep-api-root>
./gradlew test --tests "*OnboardingAuditListenerTest"
```

### Definicao de pronto da Task 6.6
- [ ] Cada evento KYC gera exatamente um audit log esperado.
- [ ] Detalhes nao contem dados sensiveis em claro.
- [ ] Enum Java e check constraint SQL estao sincronizados.

---

## Task 6.7 - Testes integrados e cobertura

**Objetivo**: cobrir o fluxo completo de KYC PF e cenarios negativos antes do fechamento da sprint.

**Pre-requisitos**: Tasks 6.1-6.6.

**Esforco**: 1 dia.

### Step 006.7.1 - Criar suite E2E backend

**Arquivo**:
- `onboarding/web/OnboardingPessoaIT.java`

**Cenario feliz**:
- Criar usuario cliente.
- Login.
- `POST /api/v1/onboarding/pessoa`.
- Upload documento de identidade.
- Upload selfie.
- `POST /api/v1/onboarding/pessoa/{id}/verificar`.
- Enviar callback `/api/v1/webhooks/celcoin/kyc`.
- `GET /api/v1/onboarding/pessoa/{id}` retorna `APROVADO`.

### Step 006.7.2 - Cobrir negativos obrigatorios

**Cenarios**:
- CPF duplicado em solicitacao ativa -> 409.
- MIME invalido -> 400.
- Arquivo > 10MB -> 400.
- Verificacao sem documentos minimos -> 400.
- Webhook assinatura invalida -> 401.
- Webhook duplicado mesma `Idempotency-Key` -> 202 e um unico processamento.
- Cliente A tenta anexar documento em solicitacao do Cliente B -> 403.
- Token ausente -> 401.

### Step 006.7.3 - Rodar cobertura

**Comandos**:
```bash
cd <sep-api-root>
./gradlew clean test jacocoTestReport jacocoTestCoverageVerification
./gradlew check
```

**Verificacao**:
- JaCoCo geral >= 70%.
- Modulo `onboarding` com cobertura suficiente para regras centrais.
- Spotless verde.

### Definicao de pronto da Task 6.7
- [ ] E2E feliz passa.
- [ ] Negativos obrigatorios passam.
- [ ] WireMock IT passa.
- [ ] `./gradlew check` verde.

---

## Task 6.8 - Documentacao e fechamento

**Objetivo**: consolidar como rodar e validar onboarding localmente e preparar a descricao de PR.

**Pre-requisitos**: Tasks 6.1-6.7.

**Esforco**: meio dia.

### Step 006.8.1 - Criar documentacao de onboarding

**Arquivo**:
- `<docs-SEP-root>/repos/sep-api/ONBOARDING.md`.

**Conteudo minimo**:
- Visao do modulo.
- Diagrama textual de estados.
- Endpoints REST.
- Contrato `KycProvider`.
- Como usar `app.kyc.provider=fake`.
- Como usar profile `local-wiremock`.
- Eventos de webhook Celcoin suportados.
- Cuidados LGPD: nao logar documento, CPF completo ou payload sensivel.

### Step 006.8.2 - Atualizar README do `sep-api`

**Adicionar**:
- Como rodar onboarding local com provider fake.
- Como configurar Celcoin sandbox por env vars.
- Como executar testes WireMock.

### Step 006.8.3 - Gerar descricao de PR

**Template**:
- Titulo sugerido: `feat(onboarding): implementar KYC de pessoa fisica`
- Resumo: modulo onboarding PF, provider Celcoin/Fake, webhook KYC, auditoria reforcada.
- Escopo tecnico: migrations, endpoints, audit log, WireMock.
- Como validar: comandos Gradle e smoke REST.
- Riscos: dados sensiveis em BYTEA temporario; Celcoin real depende de credenciais sandbox.
- Referencia: spec 006 e este steps.

### Step 006.8.4 - Validacao final de working tree

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

### Definicao de pronto da Task 6.8
- [ ] Documentacao de onboarding criada.
- [ ] README atualizado.
- [ ] Descricao de PR pronta.
- [ ] Working tree revisada.

---

## Definicao de pronto da Sprint 6

- Modulo `onboarding` criado com DDD + Hexagonal.
- Migration V7 cria tabelas KYC e atualiza eventos de audit log.
- KYC PF com solicitacao, upload de documento, disparo de verificacao e consulta de status.
- `KycProvider` com Fake e Celcoin.
- Adapter Celcoin coberto por WireMock.
- Webhook KYC idempotente com HMAC.
- Auditoria reforcada em `audit_log_seguranca`.
- OpenAPI documenta endpoints `/api/v1/onboarding/pessoa` e `/api/v1/webhooks/celcoin/kyc`.
- Suite E2E backend cobre fluxo feliz e negativos obrigatorios.
- `./gradlew check` verde.
- PR description pronta; push e PR manuais.

---

## Impacto na Sprint 7

- Sprint 7 reutiliza o modulo `onboarding` para KYB PJ.
- `SolicitacaoOnboarding` pode evoluir para tipo de pessoa (`PF`/`PJ`) se o spec 007 exigir.
- `BackgroundCheckProvider` e consultas PLD entram na Sprint 7.
- Webhook + audit log + Provider Pattern ficam estabelecidos para KYB.

---

## Restricoes e regras de execucao

- Nao acoplar dominio diretamente a Celcoin.
- Nao logar conteudo binario, CPF completo ou payload sensivel.
- Nao criar telas web/mobile nesta sprint.
- Nao criar storage S3/MinIO agora.
- Nao quebrar contratos de auth/refresh/step-up da Sprint 5.
- Nao usar `git add -A`; adicionar paths especificos.
- `docs-SEP` nao recebe commit pelo agente.

---

## Referencias

- [PRD secao 3.1 - Marco regulatorio](../../docs-sep/PRD.md)
- [PRD secao 11 - Modulo onboarding + Provider Pattern](../../docs-sep/PRD.md)
- [PRD secao 22 - Sprint 6](../../docs-sep/PRD.md)
- [PRD secao 25 - Epic 5](../../docs-sep/PRD.md)
- [PRD secao 29 - Mapeamento Fase 2](../../docs-sep/PRD.md)
- [Spec 006 - Sprint 6](../../specs/fase-2/006-sprint-6-onboarding-kyc-pessoa.md)
- [ADR 0004 - Provider Pattern para integracoes externas](../../adr/0004-provider-pattern-para-integracoes-externas.md)
- [ADR 0007 - DDD com Hexagonal Ports & Adapters por modulo](../../adr/0007-ddd-com-hexagonal-ports-and-adapters-por-modulo.md)
- [ADR 0008 - WireMock para testes integracao Celcoin](../../adr/0008-wiremock-para-testes-integracao-celcoin.md)
- [Celcoin - Criacao de Contas Onboarding KYC](https://developers.celcoin.com.br/docs/utilizacao-do-onboarding-celcoin)
- [Celcoin - Webhooks Onboarding](https://developers.celcoin.com.br/docs/webhooks-onboarding)
