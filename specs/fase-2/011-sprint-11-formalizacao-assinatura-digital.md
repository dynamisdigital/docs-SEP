# Spec 011 - Sprint 11 - Formalizacao (assinatura digital + CCB)

## Metadados

- **ID da Spec**: 011
- **Titulo**: Sprint 11 - Assinatura Digital + Cedula de Credito Bancario (CCB)
- **Status**: aprovada para execucao (apos conclusao da Sprint 10 e ADR 0012 aceito)
- **Fase do produto**: Fase 2 — Epic 7 (parte 2)
- **Origem**: PRD §11 (Modulo contratos + Provider Pattern), §22 (Sprint 11), §25 (Epic 7); ADRs 0004, 0008
- **Depende de**: [`010-sprint-10-formalizacao-geracao-contrato.md`](./010-sprint-10-formalizacao-geracao-contrato.md), ADR 0012 (escolha do provedor de assinatura digital — gate da sprint)
- **Responsavel principal**: Dev Senior

## Objetivo

Concluir a formalizacao com assinatura digital efetiva e geracao de CCB (Cedula de Credito Bancario) automatizada. A sprint introduz o `AssinaturaDigitalProvider` (Provider Pattern com adapter para o provedor escolhido em ADR 0012 — Clicksign, D4Sign ou similar) e estende o modulo `contratos` para o ciclo completo de assinatura: envio para assinatura → callback de assinado → atualizacao de estado → desbloqueio do desembolso.

A CCB e o instrumento legal padrao de operacoes de credito bancario no Brasil. Esta sprint gera a CCB completa em PDF estruturado a partir do contrato aceito (Sprint 10), envia para assinatura via provider, e processa o callback de confirmacao com armazenamento do PDF assinado (com hash + carimbo de tempo).

## Escopo

### Em escopo (apenas backend)

- **ADR 0012** — escolha do provedor de assinatura digital (gate da sprint; criado antes da Task 11.1)
- **Provider Pattern** (ADR 0004):
  - `AssinaturaDigitalProvider` (port em `contratos.application.port.out`)
  - Adapter real: `<Provedor>AssinaturaDigitalProvider` (Clicksign ou D4Sign — definido pelo ADR 0012)
  - `FakeAssinaturaDigitalProvider` (testes; simula fluxo de assinatura com callback simulado em loop)
- Geracao de CCB:
  - `CcbGenerator` (service em `contratos/application/service/ccb/`) — usa Apache PDFBox para gerar PDF estruturado
  - Template CCB conforme padrao BACEN (Lei 10.931/2004): partes, valor, prazo, taxa, IOF, garantias, foro
  - PDF assinado armazenado em storage abstrato (port `DocumentoStorage` da Sprint 6, reusado)
- Entidades novas:
  - `EnvelopeAssinatura` (vincula `Contrato` + provider externo + status do envelope)
  - `EventoAssinatura` (historico de eventos do envelope: enviado, visualizado, assinado, recusado)
  - `DocumentoAssinado` (1:1 com envelope quando finalizado; carrega `hashSha256`, `pathStorage`, `dataAssinatura`, `selo` opcional)
- Use cases:
  - `EnviarParaAssinaturaUseCase` (consome `ContratoAceitoEvent` da Sprint 10; gera CCB + envia para provider)
  - `ProcessarCallbackAssinaturaUseCase` (recebe webhook de eventos do provider)
  - `BaixarDocumentoAssinadoUseCase`
  - `ConsultarStatusAssinaturaUseCase`
- Endpoints REST:
  - `POST /api/v1/contratos/{id}/assinar` — dispara envio para assinatura (financeiro ou automatico via listener; idempotente)
  - `GET /api/v1/contratos/{id}/assinatura/status`
  - `GET /api/v1/contratos/{id}/documento-assinado` — download do PDF assinado (autorizacao: tomador, financeiro)
- Webhook:
  - `POST /api/v1/webhooks/assinatura/{provider}` — recebe eventos do provider (envelope visualizado, assinado, recusado)
  - HMAC validation + idempotencia + Outbox
- Migrations Flyway: `envelope_assinatura`, `evento_assinatura`, `documento_assinado`
- Auditoria reforcada: novos tipos no `audit_log_seguranca`: `CCB_GERADA`, `ASSINATURA_ENVIADA`, `ASSINATURA_VISUALIZADA`, `ASSINATURA_ASSINADA`, `ASSINATURA_RECUSADA`, `DOCUMENTO_ASSINADO_BAIXADO`
- Atualizacao de estados de `Contrato`: `ACEITO` → `EM_ASSINATURA` → `ASSINADO` (final) | `RECUSADO`
- Bloqueio de desembolso liberado: `Contrato` em `ASSINADO` e pre-requisito para Sprint 12 (Cobranca) gerar parcelas

### Fora de escopo nesta Sprint
- Multiplos signatarios (avalistas, garantidores) — sprint futura
- Validacao avancada de certificado ICP-Brasil — provider escolhido fica responsavel
- Renegociacao contratual pos-assinatura — sprint futura (Epic 8 estendida)
- Telas frontend/mobile — apenas backend (decisao 2026-05-04)

## Pre-requisitos globais

- Sprint 10 concluida (modulo `contratos` com geracao + aceite funcionais)
- **ADR 0012 aceito antes do inicio da sprint** — define qual provedor sera integrado (Clicksign, D4Sign ou outro)
- Credenciais sandbox do provedor escolhido disponiveis
- Step-up authentication da Sprint 5 funcional (envio para assinatura exige)

## Tasks

### Task 11.1 — ADR 0012: escolha do provedor de assinatura digital (GATE)

**Descricao**
Antes de qualquer codigo, decidir formalmente qual provedor sera integrado. Esta task e bloqueadora — sem ADR aceito, a sprint nao avanca.

**Arquivos esperados**
- `adr/0012-provedor-de-assinatura-digital.md`

**Conteudo do ADR**
- Contexto: necessidade de assinatura digital com validade juridica (ICP-Brasil ou eletronica avancada)
- Alternativas avaliadas: Clicksign, D4Sign, DocuSign (BR), ZapSign
- Criterios: validade juridica, custo por assinatura, qualidade de API REST, suporte a webhook, suporte a CCB, suporte a ICP-Brasil opcional
- Decisao: <provedor escolhido com justificativa>
- Consequencias: integracao via Provider Pattern, contrato negociado, custo previsto

**Pre-requisitos**: avaliacao tecnica + comercial concluida.
**Responsavel**: Dev Senior + PO (decisao comercial).

---

### Task 11.2 — Entidades + migrations

**Arquivos esperados**
- `contratos/domain/model/EnvelopeAssinatura.java`
- `contratos/domain/model/EventoAssinatura.java`
- `contratos/domain/model/DocumentoAssinado.java`
- `contratos/domain/vo/StatusEnvelope.java` (sealed: `RASCUNHO`, `ENVIADO`, `VISUALIZADO`, `ASSINADO`, `RECUSADO`, `EXPIRADO`)
- update `Contrato.status` para incluir `EM_ASSINATURA`, `ASSINADO`, `RECUSADO` — refactor controlado (estados ja previstos no enum desde a Sprint 10)
- `src/main/resources/db/migration/V<n>__criar_tabelas_assinatura.sql`

**Pre-requisitos**: ADR 0012 aceito.
**Responsavel**: Dev Senior.

---

### Task 11.3 — Geracao de CCB em PDF (Apache PDFBox)

**Descricao**
Gerar PDF estruturado da CCB a partir do contrato aceito (Sprint 10) usando Apache PDFBox.

**Arquivos esperados**
- `contratos/application/service/ccb/CcbGenerator.java`
- `contratos/application/service/ccb/CcbTemplate.java` (estrutura logica do PDF)
- `src/main/resources/templates/ccb/ccb-base.pdf` (template PDF com placeholders, opcional)
- dependencia Gradle:
  ```gradle
  implementation 'org.apache.pdfbox:pdfbox:3.0.x'
  ```

**Conteudo da CCB**
- Cabecalho (numero, data emissao)
- Identificacao das partes (emitente = tomador; favorecida = SEP)
- Valor principal + prazo + numero de parcelas
- Taxa de juros + IOF + custo efetivo total (CET)
- Forma de pagamento + conta escrow
- Garantias (texto inicial vazio; expandido em sprint futura quando garantias entrarem)
- Foro + clausulas finais
- Assinatura (espaco reservado; preenchido pelo provider)

**Testes obrigatorios**
- `CcbGeneratorTest` (valida PDF gerado tem campos esperados)

**Pre-requisitos**: Task 11.2.
**Responsavel**: Dev Senior.

---

### Task 11.4 — `AssinaturaDigitalProvider` (port + Fake + Real)

**Arquivos esperados**
- `contratos/application/port/out/AssinaturaDigitalProvider.java`
- `contratos/application/port/out/dto/RequisicaoEnvioAssinatura.java`
- `contratos/application/port/out/dto/RespostaEnvioAssinatura.java` (carrega `idEnvelopeExterno`)
- `contratos/application/port/out/dto/StatusEnvelopeProvider.java`
- `contratos/infrastructure/adapter/assinatura/FakeAssinaturaDigitalProvider.java`
- `contratos/infrastructure/adapter/assinatura/<Provedor>AssinaturaDigitalProvider.java` (definido pelo ADR 0012)
- `contratos/infrastructure/adapter/assinatura/<Provedor>HttpClient.java` (RestClient + Resilience4j)
- `contratos/infrastructure/config/AssinaturaResilienceConfig.java`

**Contrato do port (resumo)**
```java
public interface AssinaturaDigitalProvider {
  RespostaEnvioAssinatura enviarParaAssinatura(byte[] pdf, RequisicaoEnvioAssinatura req, String correlationId);
  byte[] baixarDocumentoAssinado(String idEnvelopeExterno);
  StatusEnvelopeProvider consultarStatus(String idEnvelopeExterno);
}
```

**Testes obrigatorios**
- `FakeAssinaturaDigitalProviderTest`
- `<Provedor>AssinaturaDigitalProviderIT` (WireMock)

**Pre-requisitos**: Tasks 11.1, 11.2.
**Responsavel**: Dev Senior.

---

### Task 11.5 — Use cases de envio + processamento de callback

**Arquivos esperados**
- `contratos/application/usecase/EnviarParaAssinaturaUseCase.java`
- `contratos/application/usecase/ProcessarCallbackAssinaturaUseCase.java`
- `contratos/application/usecase/BaixarDocumentoAssinadoUseCase.java`
- `contratos/application/usecase/ConsultarStatusAssinaturaUseCase.java`
- `contratos/application/listener/ContratoAceitoListener.java` — escuta `ContratoAceitoEvent` (Sprint 10) e dispara `EnviarParaAssinaturaUseCase`

**Regras**
- `EnviarParaAssinaturaUseCase`: gera CCB + envia para provider + cria `EnvelopeAssinatura` em `ENVIADO` + transiciona `Contrato` para `EM_ASSINATURA`
- Idempotencia: header `Idempotency-Key` baseado em `contratoId + numeroVersao`
- `ProcessarCallbackAssinaturaUseCase`: traduz evento do provider para `EventoAssinatura` + atualiza `EnvelopeAssinatura.status`; quando `ASSINADO`, baixa PDF assinado + cria `DocumentoAssinado` + transiciona `Contrato` para `ASSINADO` + dispara `ContratoAssinadoEvent` (consumido pela Sprint 12)
- Recusa: transiciona `Contrato` para `RECUSADO`; financeiro pode regenerar/cancelar (use cases da Sprint 10)

**Testes obrigatorios**
- `EnviarParaAssinaturaUseCaseTest`
- `ProcessarCallbackAssinaturaUseCaseTest` (cada estado: visualizado, assinado, recusado)
- `ContratoAceitoListenerTest`

**Pre-requisitos**: Tasks 11.3, 11.4.
**Responsavel**: Dev Senior.

---

### Task 11.6 — Webhook de assinatura

**Arquivos esperados**
- `contratos/web/controller/AssinaturaWebhookController.java` — `POST /api/v1/webhooks/assinatura/{provider}`
- `contratos/web/dto/AssinaturaCallback<Provedor>.java`
- `contratos/infrastructure/adapter/assinatura/<Provedor>WebhookValidator.java` (HMAC SHA-256)

**Regras**
- Path param `{provider}` para suportar futuros providers paralelos (extensibilidade do Provider Pattern)
- HMAC validation por provider; chaves em `app.assinatura.<provider>.webhook.hmac-secret`
- Idempotencia + Outbox

**Testes obrigatorios**
- `AssinaturaWebhookControllerTest`

**Pre-requisitos**: Tasks 11.4, 11.5.
**Responsavel**: Dev Senior.

---

### Task 11.7 — Endpoints REST + DTOs

**Arquivos esperados**
- update `ContratoController` (Sprint 10) com novos endpoints
- DTOs: `EnviarAssinaturaRequest` (vazio), `StatusAssinaturaResponse`, `DocumentoAssinadoMetadataResponse`

**Endpoints**
- `POST /api/v1/contratos/{id}/assinar` — `ROLE_FINANCEIRO` (manual) ou disparado automaticamente por listener; step-up obrigatorio na variante manual
- `GET /api/v1/contratos/{id}/assinatura/status` — ownership ou `ROLE_FINANCEIRO`
- `GET /api/v1/contratos/{id}/documento-assinado` — retorna PDF (`application/pdf`); ownership ou `ROLE_FINANCEIRO`

**OpenAPI** completa.

**Testes obrigatorios**
- `ContratoAssinaturaControllerTest`

**Pre-requisitos**: Tasks 11.5, 11.6.
**Responsavel**: Dev Senior.

---

### Task 11.8 — Auditoria reforcada

**Arquivos esperados**
- update enum `AuditLogSegurancaTipo`: `CCB_GERADA`, `ASSINATURA_ENVIADA`, `ASSINATURA_VISUALIZADA`, `ASSINATURA_ASSINADA`, `ASSINATURA_RECUSADA`, `DOCUMENTO_ASSINADO_BAIXADO`
- update `ContratoAuditListener` (Sprint 10) com novos eventos

**Regras**
- `ASSINATURA_ASSINADA` grava: hash do PDF assinado, id do envelope externo, timestamp do provider
- `DOCUMENTO_ASSINADO_BAIXADO` grava: quem baixou, ip — relevante para LGPD

**Testes obrigatorios**
- `ContratoAuditListenerTest` (novos eventos)

**Pre-requisitos**: Tasks 11.5, 11.6.
**Responsavel**: Dev Senior.

---

### Task 11.9 — Testes E2E

**Cenarios obrigatorios**
- Contrato aceito (Sprint 10) → listener dispara → CCB gerada → envio para provider (`Fake`) → callback `ASSINADO` → `Contrato` em `ASSINADO` + PDF armazenado
- Mesmo cenario com provider real via WireMock
- Callback `RECUSADO` → `Contrato` em `RECUSADO`
- Webhook idempotente
- Webhook com HMAC invalido → 401
- Tentativa de baixar documento por nao-tomador / nao-financeiro → 403
- Reenvio (idempotente) nao gera novo envelope

**Arquivos esperados**
- `contratos/web/AssinaturaIT.java`

**Pre-requisitos**: Tasks 11.1-11.8.
**Responsavel**: Dev Senior.

---

### Task 11.10 — Documentacao

**Arquivos esperados**
- update `docs-sep/PRD.md` §22 Sprint 11 — marcar como executada (apos merge)
- update `docs-SEP/repos/sep-api/CONTRATOS.md` — adicionar secao de assinatura + CCB + estados completos
- novo `docs-SEP/repos/sep-api/CCB.md` — estrutura da CCB, validade juridica, retencao
- update Swagger UI

**Pre-requisitos**: Tasks 11.1-11.9.
**Responsavel**: Dev Senior + revisao juridica do `CCB.md`.

---

## Grafo de dependencias

```
Sprint 10 concluida
        |
        v
Task 11.1 (ADR 0012 — gate)
        |
        v
Task 11.2 (entidades + migrations)
        |
        +---> Task 11.3 (CCB generator) ----+
        +---> Task 11.4 (AssinaturaDigitalProvider Fake + Real) -+
                                                                  |
                                                                  v
                                                        Task 11.5 (use cases envio + callback)
                                                                  |
                                                                  v
                                                        Task 11.6 (webhook)
                                                                  |
                                                                  v
                                                        Task 11.7 (endpoints REST)
                                                                  |
                                                                  v
                                                        Task 11.8 (auditoria)
                                                                  |
                                                                  v
                                                        Task 11.9 (testes E2E)
                                                                  |
                                                                  v
                                                        Task 11.10 (documentacao)
```

## Definicao de pronto da Sprint 11

- ADR 0012 aceito (provedor escolhido)
- Modulo `contratos` estendido com entidades de assinatura
- CCB gerada em PDF estruturado (Apache PDFBox)
- `AssinaturaDigitalProvider` com Fake + Real adapters
- Listener `ContratoAceitoListener` dispara envio automaticamente
- Webhook funcional com HMAC + idempotencia
- 3 endpoints REST documentados
- Auditoria reforcada
- Suite E2E passando
- WireMock test do provider real passando
- Cobertura JaCoCo do modulo `contratos` consolidada >= 70%
- `CCB.md` revisado pela area juridica e publicado

## Impacto na Sprint seguinte (Sprint 12 — Cobranca)

- `Contrato` em `ASSINADO` desbloqueia geracao de parcelas pela Sprint 12
- `ContratoAssinadoEvent` sera consumido pelo modulo `cobranca` para criar `AgendaPagamento`

## Restricoes e regras de execucao

- **CCB e instrumento legal** — qualquer alteracao em estrutura exige revisao juridica
- **PDF assinado e prova juridica** — armazenamento integro obrigatorio (hash + retencao 10 anos)
- ADR 0012 e gate **inviolavel** — sem ADR aceito, sprint nao comeca
- Provider Pattern obrigatorio
- Sem F-Sprint 11 / M-Sprint 11 — apenas backend (decisao 2026-05-04)

## Referencias

- [PRD §11](../../docs-sep/PRD.md)
- [PRD §22 (Sprint 11)](../../docs-sep/PRD.md)
- [PRD §25 (Epic 7)](../../docs-sep/PRD.md)
- [PRD §29](../../docs-sep/PRD.md)
- [ADR 0004](../../adr/0004-provider-pattern-para-integracoes-externas.md)
- [ADR 0008](../../adr/0008-wiremock-para-testes-integracao-celcoin.md)
- ADR 0012 (criado nesta sprint, gate)
- [Spec 010 - Sprint 10 (dependencia)](./010-sprint-10-formalizacao-geracao-contrato.md)
- [Spec 012 - Sprint 12 (proxima — Cobranca)](./012-sprint-12-cobranca-parcelas-agenda.md)
- Lei 10.931/2004 (CCB)
- Lei 14.063/2020 (assinatura eletronica)
- Apache PDFBox: https://pdfbox.apache.org/
