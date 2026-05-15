# Spec 006 - Sprint 6 - Onboarding KYC Pessoa Fisica

## Metadados

- **ID da Spec**: 006
- **Titulo**: Sprint 6 - Onboarding KYC Pessoa Fisica (modulo `onboarding` + `KycProvider` Celcoin + Webhook Receiver)
- **Status**: aprovada para execucao (apos conclusao da Sprint 5)
- **Fase do produto**: Fase 2 — Epic 5 (parte 1)
- **Origem**: PRD §3.1 (Marco regulatorio CMN 4.656/2018), §11 (Modulo onboarding + Provider Pattern), §22 (Sprint 6), §25 (Epic 5); ADRs 0004, 0008
- **Depende de**: [`005-sprint-5-endurecimento-seguranca.md`](./005-sprint-5-endurecimento-seguranca.md)
- **Responsavel principal**: Dev Senior

## Objetivo

Implementar o modulo `onboarding` para verificacao de identidade de pessoa fisica (KYC), atendendo a obrigacao legal da Resolucao CMN 4.656/2018. A sprint entrega o ciclo completo de uma solicitacao de onboarding PF: criacao da solicitacao, captura e armazenamento de documentos cadastrais, integracao com provedor externo (Celcoin) para OCR + FaceMatch + Background Check via Provider Pattern, recepcao de callback assincrono via Webhook Receiver (introduzido na Sprint 4) e gravacao de trilha auditavel reforcada.

Esta sprint **nao** cobre KYB (pessoa juridica) — fica para a Sprint 7. Tambem nao integra com analise de credito ainda (Sprint 8). O resultado entregue aqui e um `ResultadoVerificacao` com status final (`APROVADO`, `REPROVADO`, `PENDENCIA`) que sera consumido pelas Sprints 8+ como pre-requisito de proposta.

## Escopo

### Em escopo (apenas backend)

- Novo modulo `onboarding` em `com.dynamis.sep_api.onboarding` (DDD + Hexagonal/Ports & Adapters)
- Entidades de dominio: `SolicitacaoOnboarding`, `DocumentoCadastral`, `ResultadoVerificacao`
- Value objects: `TipoDocumento` (sealed; `RG`, `CNH`, `PASSAPORTE`, `SELFIE`), `StatusOnboarding` (sealed; `INICIADO`, `DOCUMENTOS_RECEBIDOS`, `EM_VERIFICACAO`, `APROVADO`, `REPROVADO`, `PENDENCIA`), `Cpf` (com validacao de digitos)
- **Provider Pattern** obrigatorio (ADR 0004):
  - Port: `onboarding.application.port.out.KycProvider`
  - Adapter real: `onboarding.infrastructure.adapter.celcoin.CelcoinKycProvider` (OCR + FaceMatch + Background Check)
  - Adapter fake: `onboarding.infrastructure.adapter.celcoin.FakeKycProvider` (testes e dev sem credenciais)
  - Selecao por `@ConditionalOnProperty` ou Profile (`local-wiremock` para dev sem Celcoin)
- Use cases:
  - `IniciarOnboardingPessoaUseCase` (cria `SolicitacaoOnboarding` em status `INICIADO`)
  - `EnviarDocumentoUseCase` (anexa um `DocumentoCadastral` e armazena binario)
  - `IniciarVerificacaoKycUseCase` (chama `KycProvider.verificarPessoa(...)` e move para `EM_VERIFICACAO`)
  - `ProcessarCallbackKycUseCase` (consumido pelo Webhook Receiver; finaliza com resultado)
  - `ConsultarStatusOnboardingUseCase`
- Endpoints REST em `/api/v1/onboarding`:
  - `POST /api/v1/onboarding/pessoa` — inicia solicitacao; retorna `id` e URL para upload de documentos
  - `POST /api/v1/onboarding/pessoa/{id}/documentos` — multipart upload de documento (RG, CNH, passaporte, selfie)
  - `POST /api/v1/onboarding/pessoa/{id}/verificar` — dispara verificacao no `KycProvider` (idempotente via `Idempotency-Key`)
  - `GET /api/v1/onboarding/pessoa/{id}` — consulta status atual + historico de eventos
- Webhook Receiver (estendendo o pattern da Sprint 4):
  - `POST /api/v1/webhooks/celcoin/kyc` — recebe callback assincrono Celcoin com resultado de verificacao
  - Idempotencia por `Idempotency-Key` (Sprint 4)
  - Validacao de assinatura HMAC do header Celcoin
  - Outbox para reprocessamento em caso de falha
- Migrations Flyway: novas tabelas `solicitacao_onboarding`, `documento_cadastral`, `resultado_verificacao`
- Auditoria reforcada: alem da `EntidadeAuditavel` padrao (Sprint 1), gravar evento em `audit_log_seguranca` (Sprint 5) para acoes de KYC
- Storage de documentos: para esta sprint, salvar binario na propria tabela (BYTEA limitado a 10MB) via `LobStorage` simples; abstracao `DocumentoStorage` (port) preparada para migrar para S3/MinIO em sprint futura
- Resilience4j: circuit breaker + retry + timeout em `CelcoinKycProvider` (max 3 retries com backoff exponencial; timeout 30s)
- `correlationId` propagado em todas as chamadas externas

### Fora de escopo nesta Sprint
- KYB (pessoa juridica) — Sprint 7
- Consulta a bases PLD (COAF, OFAC, INTERPOL, MTE) — Sprint 7 (faz parte do KYB legalmente, mas tambem cobrira PF na Sprint 7 como follow-up)
- Reprocessamento manual de KYC com erro — Sprint 14 (Backoffice)
- Telas frontend/mobile — entram quando contratos estabilizarem (decisao 2026-05-04 — apenas backend na Fase 2)
- Storage S3/MinIO — sprint futura (provavelmente Epic 16 — Infraestrutura AWS)
- ML / score de fraude proprio — fora do escopo do produto (delegado a Celcoin)

## Pre-requisitos globais

- Sprint 5 concluida (MFA + refresh token + lockout + audit log de seguranca operacionais)
- Webhook Receiver Pattern da Sprint 4 funcional
- ADRs 0004 (Provider Pattern), 0007 (DDD + Hexagonal), 0008 (WireMock para integration tests) vigentes
- Credenciais Celcoin sandbox disponiveis (OAuth + URL base + secret HMAC do webhook)
- Decisao operacional: tomador faz upload de documentos via app mobile (decisao 2026-05-04 sobre canalizacao); endpoint REST do backend e o destino direto e nao depende do canal

## Tasks

### Task 6.1 — Criacao do modulo `onboarding` e entidades de dominio

**Descricao**
Criar a estrutura de pacotes do modulo `onboarding` seguindo o padrao DDD + Hexagonal definido na Sprint 1. Modelar as entidades de dominio + value objects.

**Arquivos esperados**
- `onboarding/domain/model/SolicitacaoOnboarding.java` (agregado raiz; estende `EntidadeAuditavel`)
- `onboarding/domain/model/DocumentoCadastral.java` (entidade filha; N:1 com `SolicitacaoOnboarding`)
- `onboarding/domain/model/ResultadoVerificacao.java` (1:1 com `SolicitacaoOnboarding`; carrega `payloadProvider` JSONB com resposta crua do KycProvider para auditoria)
- `onboarding/domain/vo/TipoDocumento.java` (sealed enum)
- `onboarding/domain/vo/StatusOnboarding.java` (sealed enum)
- `onboarding/domain/vo/Cpf.java` (record com validacao de digitos e formatacao)
- `onboarding/domain/event/OnboardingIniciadoEvent.java`
- `onboarding/domain/event/OnboardingFinalizadoEvent.java`
- `onboarding/domain/exception/OnboardingNaoEncontradoException.java`
- `onboarding/domain/exception/StatusOnboardingInvalidoException.java`
- `onboarding/infrastructure/persistence/SolicitacaoOnboardingRepository.java`
- `src/main/resources/db/migration/V<n>__criar_tabelas_onboarding.sql`

**Esquema SQL (resumo)**
```sql
CREATE TABLE solicitacao_onboarding (
  id UUID PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuario(id),
  cpf VARCHAR(11) NOT NULL,
  nome_completo VARCHAR(255) NOT NULL,
  data_nascimento DATE NOT NULL,
  status VARCHAR(40) NOT NULL,
  data_criacao TIMESTAMP WITH TIME ZONE NOT NULL,
  data_modificacao TIMESTAMP WITH TIME ZONE NOT NULL,
  criado_por VARCHAR(50) NOT NULL,
  modificado_por VARCHAR(50) NOT NULL,
  CONSTRAINT uq_onboarding_cpf_ativo UNIQUE (cpf, status) DEFERRABLE
);

CREATE TABLE documento_cadastral (
  id UUID PRIMARY KEY,
  solicitacao_id UUID NOT NULL REFERENCES solicitacao_onboarding(id),
  tipo VARCHAR(20) NOT NULL,
  conteudo BYTEA NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  data_envio TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE resultado_verificacao (
  id UUID PRIMARY KEY,
  solicitacao_id UUID NOT NULL UNIQUE REFERENCES solicitacao_onboarding(id),
  status_final VARCHAR(40) NOT NULL,
  motivo TEXT,
  payload_provider JSONB,
  data_resultado TIMESTAMP WITH TIME ZONE NOT NULL
);
```

**Testes obrigatorios**
- `SolicitacaoOnboardingTest` (transicoes de estado validas/invalidas)
- `CpfTest` (digitos validos/invalidos, formatacao)
- `SolicitacaoOnboardingRepositoryTest` (`@DataJpaTest` com Testcontainers PostgreSQL real)

**Pre-requisitos**: Sprint 5 concluida.
**Responsavel**: Dev Senior.

---

### Task 6.2 — Port `KycProvider` + adapter `Fake` + adapter `Celcoin`

**Descricao**
Definir o contrato do `KycProvider` no dominio (`application.port.out`) e implementar dois adapters: o `FakeKycProvider` (sempre retorna `APROVADO`, util para dev local sem credenciais) e o `CelcoinKycProvider` (chamadas HTTP reais para Celcoin sandbox via `RestClient` + Resilience4j).

**Arquivos esperados**
- `onboarding/application/port/out/KycProvider.java`
- `onboarding/application/port/out/dto/RequisicaoVerificacaoKyc.java` (record com cpf, nome, data nascimento, links/refs para documentos)
- `onboarding/application/port/out/dto/RespostaInicioVerificacao.java` (record com `idVerificacaoExterna`, `statusInicial`)
- `onboarding/infrastructure/adapter/celcoin/FakeKycProvider.java` (anotado com `@Profile("local-wiremock")` ou `@ConditionalOnProperty`)
- `onboarding/infrastructure/adapter/celcoin/CelcoinKycProvider.java` (anotado para perfis `dev`, `homologacao`, `producao`)
- `onboarding/infrastructure/adapter/celcoin/CelcoinKycHttpClient.java` (config do `RestClient` Spring 6 + autenticacao OAuth Celcoin)
- `onboarding/infrastructure/adapter/celcoin/CelcoinKycMapper.java` (MapStruct: dominio ↔ DTOs do payload Celcoin)
- `onboarding/infrastructure/adapter/celcoin/dto/CelcoinKycRequest.java`
- `onboarding/infrastructure/adapter/celcoin/dto/CelcoinKycResponse.java`
- `onboarding/infrastructure/config/CelcoinResilienceConfig.java` (Resilience4j: circuit breaker `celcoin-kyc`, retry 3x backoff exponencial, timeout 30s)

**Contrato do port (resumo)**
```java
public interface KycProvider {
  RespostaInicioVerificacao iniciarVerificacao(RequisicaoVerificacaoKyc req, String correlationId);
  ResultadoVerificacao consultarResultado(String idVerificacaoExterna);
}
```

**Testes obrigatorios**
- `FakeKycProviderTest` (smoke; sempre `APROVADO`)
- `CelcoinKycMapperTest` (mapeamento bidirecional)
- `CelcoinKycProviderIT` — **integration test com WireMock 3.x** (`@WireMockTest`, ADR 0008): valida URL, headers OAuth, `Idempotency-Key`, parsing de resposta, comportamento de retry/circuit breaker

**Pre-requisitos**: Task 6.1.
**Responsavel**: Dev Senior.

---

### Task 6.3 — Use cases de iniciacao, upload e verificacao

**Descricao**
Implementar os use cases que orquestram o ciclo de vida da solicitacao: criar, anexar documentos, disparar verificacao.

**Arquivos esperados**
- `onboarding/application/usecase/IniciarOnboardingPessoaUseCase.java`
- `onboarding/application/usecase/EnviarDocumentoUseCase.java`
- `onboarding/application/usecase/IniciarVerificacaoKycUseCase.java`
- `onboarding/application/usecase/ConsultarStatusOnboardingUseCase.java`
- `onboarding/application/service/DocumentoStorage.java` (port — apenas interface; impl in-memory + JPA-LOB nesta sprint)
- `onboarding/infrastructure/persistence/JpaDocumentoStorage.java` (implementa storage via BYTEA na tabela)

**Regras de negocio**
- `IniciarOnboardingPessoaUseCase` rejeita se ja existe solicitacao ativa para o mesmo CPF (status `!= REPROVADO`)
- `EnviarDocumentoUseCase` aceita documentos apenas em `INICIADO` ou `DOCUMENTOS_RECEBIDOS`; transiciona para `DOCUMENTOS_RECEBIDOS` apos primeiro upload; valida MIME type (apenas `image/jpeg`, `image/png`, `application/pdf`); tamanho maximo 10MB
- `IniciarVerificacaoKycUseCase` exige no minimo 1 documento de identidade + 1 selfie; gera `Idempotency-Key` deterministico baseado em `solicitacaoId + revisaoDocumentos` para evitar disparos duplicados; chama `KycProvider.iniciarVerificacao` e transiciona para `EM_VERIFICACAO`

**Testes obrigatorios**
- `IniciarOnboardingPessoaUseCaseTest` (criacao OK; CPF duplicado rejeitado)
- `EnviarDocumentoUseCaseTest` (transicoes validas, MIME invalido rejeitado, tamanho > 10MB rejeitado)
- `IniciarVerificacaoKycUseCaseTest` (com `FakeKycProvider` injetado via Mockito; valida idempotencia)
- `ConsultarStatusOnboardingUseCaseTest`

**Pre-requisitos**: Tasks 6.1, 6.2.
**Responsavel**: Dev Senior.

---

### Task 6.4 — Webhook Receiver para callback Celcoin KYC

**Descricao**
Implementar o handler do webhook que recebe o resultado assincrono da verificacao Celcoin. Reusa o pattern introduzido na Sprint 4.

**Arquivos esperados**
- `onboarding/web/controller/CelcoinKycWebhookController.java` — endpoint `POST /api/v1/webhooks/celcoin/kyc`
- `onboarding/application/usecase/ProcessarCallbackKycUseCase.java`
- `onboarding/infrastructure/adapter/celcoin/CelcoinWebhookValidator.java` (valida assinatura HMAC SHA-256 do header `X-Celcoin-Signature`)
- `onboarding/web/dto/CelcoinKycCallbackRequest.java`

**Regras**
- Validar assinatura HMAC obrigatoriamente (chave em `app.celcoin.webhook.hmac-secret`); rejeitar com 401 se invalida
- Idempotencia por `Idempotency-Key` (header obrigatorio); requests duplicadas retornam o resultado anterior sem reprocessar
- Salvar `payloadProvider` cru na tabela `resultado_verificacao` para trilha auditavel
- Disparar `OnboardingFinalizadoEvent` (Spring ApplicationEvent) ao finalizar — consumido por listeners futuros (Sprint 8 vai escutar)
- Gravar evento `KYC_FINALIZADO` no `audit_log_seguranca` (Sprint 5)
- Em caso de falha de processamento, gravar na Outbox (Sprint 4) para reprocessamento

**Testes obrigatorios**
- `CelcoinKycWebhookControllerTest` (`@WebMvcTest`): assinatura valida → 200; assinatura invalida → 401; idempotencia (2 requests com mesma key → 1 processamento)
- `ProcessarCallbackKycUseCaseTest`
- `CelcoinWebhookValidatorTest` (HMAC valido vs invalido)

**Pre-requisitos**: Tasks 6.1, 6.2, 6.3.
**Responsavel**: Dev Senior.

---

### Task 6.5 — Endpoints REST + DTOs + OpenAPI

**Descricao**
Expor os endpoints REST do modulo `onboarding`, seguindo as convencoes do projeto (DTOs como records, MapStruct, padronizacao de erro via `ApiExceptionHandler`).

**Arquivos esperados**
- `onboarding/web/controller/OnboardingPessoaController.java`
- `onboarding/web/dto/IniciarOnboardingRequest.java` (record: `cpf`, `nomeCompleto`, `dataNascimento`)
- `onboarding/web/dto/OnboardingResponse.java` (record: `id`, `status`, `dataCriacao`, `dataModificacao`)
- `onboarding/web/dto/EnviarDocumentoRequest.java` (multipart; `tipo`, `arquivo`)
- `onboarding/web/dto/StatusOnboardingResponse.java` (record: `id`, `status`, `documentosEnviados`, `resultado` opcional)
- `onboarding/web/mapper/OnboardingWebMapper.java` (MapStruct: dominio ↔ DTOs web)

**Endpoints**
- `POST /api/v1/onboarding/pessoa` — body `IniciarOnboardingRequest`; resposta `201 Created` com `OnboardingResponse`; exige autenticacao (`ROLE_CLIENTE` ou superior)
- `POST /api/v1/onboarding/pessoa/{id}/documentos` — multipart; resposta `204 No Content`; ownership obrigatorio (so o proprio usuario pode anexar documentos a propria solicitacao)
- `POST /api/v1/onboarding/pessoa/{id}/verificar` — body vazio + header `Idempotency-Key`; resposta `202 Accepted`; ownership obrigatorio
- `GET /api/v1/onboarding/pessoa/{id}` — resposta `200 OK` com `StatusOnboardingResponse`; ownership ou `ROLE_ADMIN`

**OpenAPI**
- Anotacoes Springdoc completas (Operation, ApiResponse, Schema, exemplos)
- Schemas de erro reutilizados do `ErrorResponseDto` (Sprint 4)

**Testes obrigatorios**
- `OnboardingPessoaControllerTest` (`@WebMvcTest`): cobertura de cada endpoint, ownership, validacao de input, respostas de erro padronizadas

**Pre-requisitos**: Tasks 6.3, 6.4.
**Responsavel**: Dev Senior.

---

### Task 6.6 — Auditoria reforcada KYC

**Descricao**
Conectar os hooks de auditoria do Sprint 5 (`audit_log_seguranca`) aos eventos do modulo `onboarding`. Operacoes de KYC sao consideradas eventos de seguranca e exigem trilha separada da auditoria JPA generica.

**Arquivos esperados**
- `onboarding/application/listener/OnboardingAuditListener.java` (escuta `OnboardingIniciadoEvent`, `OnboardingFinalizadoEvent` e grava em `audit_log_seguranca`)
- novos tipos em `AuditLogSegurancaTipo` (sealed enum da Sprint 5): `KYC_INICIADO`, `KYC_DOCUMENTO_ENVIADO`, `KYC_VERIFICACAO_DISPARADA`, `KYC_FINALIZADO_APROVADO`, `KYC_FINALIZADO_REPROVADO`, `KYC_FINALIZADO_PENDENCIA`

**Testes obrigatorios**
- `OnboardingAuditListenerTest` (cada evento gera o registro correto em `audit_log_seguranca`)

**Pre-requisitos**: Tasks 6.1, 6.3, 6.4.
**Responsavel**: Dev Senior.

---

### Task 6.7 — Testes de integracao end-to-end

**Descricao**
Suite que cobre o ciclo completo do KYC PF, do `POST /onboarding/pessoa` ate o callback do webhook.

**Cenarios obrigatorios**
- Cliente autenticado cria solicitacao → upload de RG + selfie → dispara verificacao → callback chega via webhook → status final `APROVADO` (com `FakeKycProvider`)
- Mesmo cenario, mas com `WireMock` simulando Celcoin (perfil `local-wiremock`)
- CPF duplicado em solicitacao ativa → 409
- Documento com MIME invalido → 400
- Verificacao disparada sem documentos minimos → 400
- Webhook com assinatura invalida → 401
- Webhook idempotente (mesma key → 1 processamento)
- Cliente A tenta anexar documento na solicitacao de Cliente B → 403

**Arquivos esperados**
- `onboarding/web/OnboardingPessoaIT.java` (`@SpringBootTest` + Testcontainers + WireMock)

**Pre-requisitos**: Tasks 6.1-6.6.
**Responsavel**: Dev Senior.

---

### Task 6.8 — Documentacao e PR final

**Descricao**
Atualizar documentacao e fechar a sprint.

**Arquivos esperados**
- update `docs-sep/PRD.md` §22 Sprint 6 — marcar como executada (apos merge)
- novo `docs-SEP/repos/sep-api/ONBOARDING.md` (visao consolidada do modulo, com diagrama de estados, contratos REST, contratos do `KycProvider`, exemplos de payload)
- update `README.md`: secao "Como rodar onboarding localmente" (perfil `local-wiremock` com `FakeKycProvider`)
- atualizar Swagger UI — todos os endpoints `/onboarding/pessoa` e `/webhooks/celcoin/kyc` documentados

**Pre-requisitos**: Tasks 6.1-6.7.
**Responsavel**: Dev Senior.

---

## Grafo de dependencias entre as tasks

```
Sprint 5 concluida
        |
        v
Task 6.1 (entidades dominio + migrations)
        |
        +---> Task 6.2 (KycProvider port + adapters Fake/Celcoin) --+
        |                                                            |
        +---> Task 6.3 (use cases iniciar/upload/verificar) ---------+
                                                                    |
                                                                    v
                                                          Task 6.4 (Webhook Receiver)
                                                                    |
                                                                    v
                                                          Task 6.5 (Endpoints REST + DTOs)
                                                                    |
                                                                    v
                                                          Task 6.6 (Auditoria reforcada)
                                                                    |
                                                                    v
                                                          Task 6.7 (Testes E2E)
                                                                    |
                                                                    v
                                                          Task 6.8 (Documentacao)
```

## Definicao de pronto da Sprint 6

- Modulo `onboarding` criado com estrutura DDD + Hexagonal completa (`domain`, `application`, `infrastructure`, `web`)
- Entidades + migrations Flyway funcionais; tabelas criadas no boot
- `KycProvider` (port) com `FakeKycProvider` e `CelcoinKycProvider` (adapter HTTP via `RestClient` + Resilience4j)
- 4 endpoints REST funcionais e documentados via Springdoc OpenAPI
- Webhook `POST /api/v1/webhooks/celcoin/kyc` recebendo callback com validacao HMAC + idempotencia
- Auditoria reforcada gravando eventos KYC em `audit_log_seguranca`
- Suite de integration tests E2E passando (cenarios da Task 6.7)
- WireMock test do `CelcoinKycProviderIT` passando (sem precisar do Celcoin real)
- Cobertura JaCoCo do modulo `onboarding` >= 70%
- `ONBOARDING.md` publicado em `docs-SEP/repos/sep-api/`
- README atualizado com instrucao de profile `local-wiremock`

## Impacto na Sprint seguinte (Sprint 7)

- Estrutura do modulo `onboarding` reutilizada para KYB (PJ); `SolicitacaoOnboarding` evolui para abrigar tambem PJ
- Pattern de Provider + Webhook + auditoria estabelecido — Sprint 7 reusa
- Bases PLD (COAF, OFAC, INTERPOL, MTE) entram via `BackgroundCheckProvider` na Sprint 7

## Restricoes e regras de execucao

- **Nao acoplar dominio diretamente a Celcoin** — toda chamada externa passa pelo `KycProvider` (Provider Pattern obrigatorio, ADR 0004)
- Documentos sao **dados sensiveis (LGPD)** — nao logar conteudo binario; logar apenas metadados (tipo, tamanho, mime, hash SHA-256)
- Trilha auditavel reforcada em `audit_log_seguranca` (alem da `EntidadeAuditavel` padrao) — exigencia regulatoria CMN 4.656/2018
- Testes obrigatorios em cada PR; cobertura nao pode regredir
- Sem F-Sprint 6 / M-Sprint 6 nesta etapa — apenas backend (decisao 2026-05-04)

## Referencias

- [PRD §3.1 (Marco regulatorio)](../../docs-sep/PRD.md)
- [PRD §11 (Modulo onboarding + Provider Pattern)](../../docs-sep/PRD.md)
- [PRD §22 (Sprint 6)](../../docs-sep/PRD.md)
- [PRD §25 (Epic 5)](../../docs-sep/PRD.md)
- [PRD §29 (Mapeamento Fase 2)](../../docs-sep/PRD.md)
- [ADR 0004 - Provider Pattern para integracoes externas](../../adr/0004-provider-pattern-para-integracoes-externas.md)
- [ADR 0007 - DDD com Hexagonal Ports & Adapters por modulo](../../adr/0007-ddd-com-hexagonal-ports-and-adapters-por-modulo.md)
- [ADR 0008 - WireMock para testes integracao Celcoin](../../adr/0008-wiremock-para-testes-integracao-celcoin.md)
- [Spec 005 - Sprint 5 (gate de seguranca, dependencia)](./005-sprint-5-endurecimento-seguranca.md)
- [Spec 007 - Sprint 7 (proxima — KYB Empresa + PLD)](./007-sprint-7-onboarding-kyb-empresa.md)
- Resolucao CMN 4.656/2018 — Art. 8 (KYC obrigatorio)
- Documentos de aprendizado: `docs-sep/Aprendizado Celcoin e SEP/` (KYC Celcoin)
