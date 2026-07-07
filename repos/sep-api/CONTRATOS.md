# CONTRATOS - sep-api

Documento operacional do modulo `contratos` (Epic 7).
Sprint 10 — parte 1 (geracao + aceite), executada 2026-05-20.
Sprint 11 — parte 2 (assinatura digital + CCB), executada 2026-05-21.

> Specs: [`010-sprint-10-formalizacao-geracao-contrato.md`](../../specs/fase-2/010-sprint-10-formalizacao-geracao-contrato.md), [`011-sprint-11-formalizacao-assinatura-digital.md`](../../specs/fase-2/011-sprint-11-formalizacao-assinatura-digital.md).
> Steps: [`010-sprint-10-steps.md`](../../steps-fase-2/backend/010-sprint-10-steps.md), [`011-sprint-11-steps.md`](../../steps-fase-2/backend/011-sprint-11-steps.md).
> CCB: [`CCB.md`](./CCB.md) (estrutura, base legal, retencao do documento legal).

## Objetivo

Formalizar a proposta de credito aprovada por contrato textual versionado, com hash SHA-256 de integridade, aceite explicito do tomador (com evidencia tecnica), envio automatico para assinatura digital com provider externo (Clicksign), recebimento de callback assinado/recusado e auditoria reforcada do ciclo. Estado `ASSINADO` desbloqueia desembolso (pre-condicao da Sprint 12 Cobranca).

## Fluxo end-to-end

```text
PropostaCredito APROVADA (Sprint 8)
  -> PropostaAprovadaEvent (carrega propostaId + tomadorId + parecerId)
  -> PropostaAprovadaListener (@TransactionalEventListener(AFTER_COMMIT) + @Transactional(REQUIRES_NEW))
  -> GerarContratoUseCase
     - ConsultarPropostaUseCase.executar(propostaId)        # consome porta application do modulo credito
     - valida proposta APROVADA -> senao 422 PropostaNaoAprovadaException
     - findByPropostaId; short-circuit idempotente se vigente ja tem mesmo parecerOrigemId
     - ContextoContratoBuilder.construir(proposta)          # ids + valor formatado pt-BR + data
     - ThymeleafTemplateContratoEngine.renderizar(req)      # mode TEXT, valida vars obrigatorias
     - HashContratoService.calcular(conteudo)               # hex lowercase 64 chars
     - Contrato.adicionarVersao(texto, hash, parecerOrigemId) -> AGUARDANDO_ACEITE
     - ClausulaContratoParser extrai clausulas e popula VersaoContrato
     - publish ContratoGeradoEvent (ou ContratoNovaVersaoEvent em regeneracao)

GET /api/v1/contratos/{id} | proposta/{propostaId}            # CLIENTE dono ou FINANCEIRO/ADMIN
GET /api/v1/contratos/{id}/versoes                            # lista versoes em ordem ascendente

PATCH /api/v1/contratos/{id}/aceite                           # CLIENTE dono + @RequireStepUpEstrito (Sprint 27)
  -> RegistrarAceiteUseCase (@Transactional)
     - findByIdForUpdate (PESSIMISTIC_WRITE)                   # serializa aceite vs cancelamento
     - valida ownership -> ContratoOwnershipException 403
     - valida AGUARDANDO_ACEITE -> ContratoEstadoInvalidoException 409
     - aceiteRepository.save + flush -> race detectada vira ConflitoException 409
     - contrato.marcarAceito -> ACEITO
     - publish ContratoAceitoEvent (hash + ip + user-agent)

POST /api/v1/contratos/{id}/cancelar                          # FINANCEIRO/ADMIN + @RequireStepUpEstrito (Sprint 27)
  -> CancelarContratoUseCase (@Transactional)
     - findByIdForUpdate (PESSIMISTIC_WRITE)
     - valida GERADO/AGUARDANDO_ACEITE -> 409 se ACEITO+
     - contrato.cancelar -> CANCELADO
     - publish ContratoCanceladoEvent (justificativa truncada)

ContratoAuditListener (AFTER_COMMIT + REQUIRES_NEW)
  -> grava 4 tipos novos em audit_log_seguranca
```

## Estados (`StatusFormalizacao`)

| Status              | Significado                                                                |
| ------------------- | -------------------------------------------------------------------------- |
| `GERADO`            | Contrato criado, antes da primeira versao publicada (estado transiente).   |
| `AGUARDANDO_ACEITE` | Versao vigente disponivel; aceita re-geracao manual e cancelamento.        |
| `ACEITO`            | Tomador aceitou com step-up + evidencia tecnica. Dispara envio automatico para assinatura.|
| `EM_ASSINATURA`     | Envelope criado no provider (Sprint 11). Aguarda callback de assinatura ou recusa.        |
| `ASSINADO`          | Provider confirmou assinatura. Pre-condicao para Sprint 12 (Cobranca) gerar parcelas.     |
| `RECUSADO`          | Provider/signatario recusou assinatura. Estado final. Reformalizacao exige nova proposta. |
| `CANCELADO`         | Cancelamento pre-aceite por financeiro/admin. Estado final.                               |

Transicoes permitidas hoje:

```text
GERADO            -> AGUARDANDO_ACEITE | CANCELADO
AGUARDANDO_ACEITE -> AGUARDANDO_ACEITE (regeneracao) | ACEITO | CANCELADO
ACEITO            -> EM_ASSINATURA (listener auto-envio AFTER_COMMIT)
EM_ASSINATURA     -> ASSINADO | RECUSADO (callback webhook do provider)
ASSINADO / RECUSADO / CANCELADO = finais
```

## Entidades

- `Contrato` (agregado raiz, `extends EntidadeAuditavel`): 1:1 com `PropostaCredito`, mantem `versoes` em ordem ascendente.
- `VersaoContrato` (imutavel): `numero`, `conteudoTexto`, `hashSha256` (hex 64), `dataGeracao`, `parecerOrigemId` (Sprint 10.3 fix), `clausulas` (LIST OneToMany cascade).
- `ClausulaContratual`: `ordem` unica por versao, `titulo`, `texto`.
- `AceiteContrato`: 1:1 com versao via UNIQUE; trunca `ipOrigem` (45) e `userAgentOrigem` (500) na entidade.

Regras de integridade (V20 + V21):
- `contrato.proposta_id` UNIQUE.
- `versao_contrato (contrato_id, numero)` UNIQUE.
- `versao_contrato.hash_sha256` CHECK `~ '^[a-f0-9]{64}$'`.
- `versao_contrato.parecer_origem_id` (V21) NULLABLE + index parcial.
- `clausula_contratual (versao_id, ordem)` UNIQUE + `chk_clausula_ordem_positiva`.
- `aceite_contrato.versao_id` UNIQUE.
- FKs sem `ON DELETE CASCADE` (preserva historico legal).

## Migrations Flyway

- `V20__criar_tabelas_contratos.sql` — 4 tabelas + 6 indices + 4 checks + FKs sem CASCADE.
- `V21__adicionar_parecer_origem_versao_contrato.sql` — ADD COLUMN + index parcial (idempotencia replay).
- `V22__ampliar_audit_seguranca_tipo_contratos.sql` — amplia `chk_audit_seguranca_tipo` com 4 valores `CONTRATO_*`.
- `V23__criar_tabelas_assinatura.sql` (Sprint 11) — 3 tabelas (`envelope_assinatura`, `evento_assinatura`, `documento_assinado`) + `documento_assinado_blob` (BYTEA inline isolado) + indices + uniques + FKs sem CASCADE.
- `V24__ampliar_audit_seguranca_tipo_assinatura.sql` (Sprint 11) — amplia `chk_audit_seguranca_tipo` com 6 valores `CCB_GERADA` + `ASSINATURA_*` + `DOCUMENTO_ASSINADO_BAIXADO`.

## Templates Thymeleaf

`org.thymeleaf:thymeleaf` standalone (sem starter — evita view resolver MVC). `TemplateMode.TEXT`, `ClassLoaderTemplateResolver` com prefix `templates/` e suffix `.txt`, cache habilitado.

- `templates/contratos/mutuo.txt` — template principal Sprint 10.
- `templates/contratos/ccb.txt` — esqueleto pra Sprint 11.
- `templates/contratos/clausulas-padrao.txt` — 6 clausulas (OBJETO, VALOR/PRAZO, PAGAMENTO, JUROS, INADIMPLEMENTO, FORO).

Variaveis obrigatorias (validadas no construtor do `TemplateContratoRequest`):

```
propostaId, tomadorId, tipoOperacao, valorSolicitado, moeda, prazoMeses,
dataGeracao, clausulasPadrao
```

Falha de validacao -> `IllegalArgumentException` com lista das chaves ausentes/em branco.

### Dados cadastrais — limitacao

Nome, endereco e CPF/CNPJ completos do tomador NAO entram no template nesta sprint — usamos UUIDs como placeholder tecnico. Sprint 11 (assinatura digital) ou ajuste juridico futuro deve consumir o modulo `onboarding` para preencher o documento contratual. Nao inventamos dados cadastrais.

### Tipos sem template

`TipoContrato.OUTROS` lanca `TipoContratoSemTemplateException` (422, codigo `CTR-422-002`). Sprint 10 trata todos os tipos de operacao como `MUTUO`; CCB completa entra na Sprint 11.

### Engine rejeita clausulas vazias

Se o template renderizar sem encontrar marcadores `CLAUSULA N - TITULO`, a engine lanca `TemplateContratoException` — documento legal sem clausulas e erro.

## Hash SHA-256

Cada `VersaoContrato` recebe `hashSha256` hex lowercase calculado pelo `HashContratoService` sobre o texto final renderizado. O hash:

- e gravado em `versao_contrato.hash_sha256` (CHECK regex valida formato);
- aparece no audit log (`hashSha256` em `CONTRATO_GERADO`/`NOVA_VERSAO`/`ACEITO`) como evidencia de integridade;
- NUNCA e recalculado a partir de texto modificado — qualquer alteracao da versao gera nova versao com novo hash.

Sprint 11 acrescenta dois hashes adicionais:

- `envelope_assinatura.hash_pdf_enviado` — SHA-256 do PDF da CCB gerado pelo `CcbGenerator` e enviado ao provider (prova local de qual binario foi submetido).
- `documento_assinado.hash_sha256` — SHA-256 calculado pelo SEP sobre o PDF assinado retornado pelo provider, garantindo integridade independente do carimbo externo.

Ambos validados pelo `HashValidator` (regex `^[a-f0-9]{64}$`) e refletidos em audit (`CCB_GERADA.hashPdfGerado`, `ASSINATURA_ENVIADA.hashPdfEnviado`, `ASSINATURA_ASSINADA.hashPdfAssinado`).

## Sprint 11 — Assinatura digital + CCB

### Fluxo end-to-end estendido

```text
ContratoAceitoEvent (Sprint 10)
  -> ContratoAceitoListener (@TransactionalEventListener(AFTER_COMMIT) + @Transactional(REQUIRES_NEW))
     # desligavel via app.assinatura.auto-envio-pos-aceite=false (default true)
  -> EnviarParaAssinaturaUseCase (@Transactional)
     - carregarComLock(contratoId) (PESSIMISTIC_WRITE)
     - valida ACEITO ou EM_ASSINATURA (idempotente) -> senao 409
     - findByIdempotencyKey(contratoId:vN); short-circuit se envelope ja existe
     - propostaRepository + usuarioRepository (signatario = email + placeholder do nome)
     - CcbGenerator.gerar(CcbTemplate.de(...)) -> bytes do PDF (PDFBox 3.0.x, deterministico)
     - HashContratoService.calcular(pdf) -> hashPdfEnviado
     - publish CcbGeradaEvent (audit CCB_GERADA)
     - provider.enviarParaAssinatura(pdf, request, correlationId) -> idEnvelopeExterno
     - EnvelopeAssinatura.criar(...) nasce em ENVIADO -> envelopeRepository.save
     - contrato.marcarEmAssinatura -> EM_ASSINATURA
     - publish AssinaturaEnviadaEvent (audit ASSINATURA_ENVIADA)

POST /api/v1/webhooks/assinatura/{provider}
  -> AssinaturaWebhookController
     - valida payload nao vazio + tamanho <= 64KB
     - extrai signature (Content-Hmac: sha256=<hex> ou X-Webhook-Signature em hex)
     - WebhookSignatureValidator.isValid(provider+"-assinatura", payload, signature) -> 401 se invalido
     - Idempotency-Key ausente -> derivado de SHA-256(provider + ":" + payload)
     - idEventoExterno = SHA-256(payload)
  -> ProcessarWebhookAssinaturaUseCase (@Transactional)
     - RegistrarWebhookEventUseCase (outbox Sprint 4) -> duplicado retorna idempotente
     - mapeia event.name -> StatusEnvelope (view -> VISUALIZADO; sign/auto_close -> ASSINADO;
       refuse -> RECUSADO; deadline/cancel -> EXPIRADO; upload/add_signer -> ENVIADO)
  -> ProcessarCallbackAssinaturaUseCase (@Transactional)
     - findByProviderAndIdEnvelopeExterno (lock global ordering: contrato ANTES de envelope)
     - dedup 2 camadas: existsBy + saveAndFlush com catch DataIntegrityViolationException
     - case ASSINADO -> baixa PDF assinado (provider.baixar) -> hash -> storage.salvar
       -> DocumentoAssinado.criar -> envelope.marcarAssinado -> contrato.marcarAssinado
       -> publish ContratoAssinadoEvent (audit ASSINATURA_ASSINADA)
     - case RECUSADO -> envelope.marcarRecusado -> contrato.marcarRecusado
       -> publish ContratoRecusadoEvent (audit ASSINATURA_RECUSADA)
     - case VISUALIZADO -> envelope.marcarVisualizado -> publish AssinaturaVisualizadaEvent
     - default -> log.warn (defensivo contra novos StatusEnvelope futuros)

POST /api/v1/contratos/{id}/assinar                   # FINANCEIRO/ADMIN + @RequireStepUpEstrito (Sprint 27)
  -> Reprocessamento operacional idempotente do envio (envelope ja existente eh devolvido)

GET /api/v1/contratos/{id}/assinatura/status          # ownership ou FINANCEIRO/ADMIN
  -> Snapshot local do envelope (webhook eh fonte de verdade operacional)

GET /api/v1/contratos/{id}/documento-assinado         # ownership ou FINANCEIRO/ADMIN
  -> application/pdf + Content-Disposition + X-Document-Hash-Sha256
  -> publish DocumentoAssinadoBaixadoEvent (audit DOCUMENTO_ASSINADO_BAIXADO com ip + user-agent)
```

### Entidades de assinatura (Sprint 11)

- `EnvelopeAssinatura` (`extends EntidadeAuditavel`): vincula `VersaoContrato` ao provider externo via `idEnvelopeExterno`. Nasce em `ENVIADO` (factory `criar` exige `idEnvelopeExterno` + `dataEnvio` — `RASCUNHO` so existe no enum como reserva pra fluxos futuros, nao alcancavel via API publica). 1 envelope ativo por versao (`UNIQUE versao_id`). Idempotencia de envio via `UNIQUE idempotency_key`.
- `EventoAssinatura` (`extends EntidadeAuditavel`): historico de callbacks recebidos. `UNIQUE (envelope_id, id_evento_externo)` garante dedup. Payload bruto NUNCA persistido — apenas `payloadResumo` truncado em 1000 chars.
- `DocumentoAssinado` (`extends EntidadeAuditavel`, 1:1 com envelope em `ASSINADO`): metadados do PDF assinado. `hashSha256` (calculado pelo SEP sobre o binario recebido), `dataAssinatura`, `selo` opcional, `pathStorage`. Binario vive em `documento_assinado_blob` (BYTEA isolado) acessado via port `DocumentoAssinadoStorage` (impl atual `InlineDocumentoAssinadoStorage`; Epic 16 troca por S3/MinIO sem alterar dominio).

### Status do envelope

```text
RASCUNHO     -> reserva pra fluxos futuros (envio em duas fases); inalcancavel pela API publica
ENVIADO      -> nasce assim apos provider aceitar; aceita VISUALIZADO/ASSINADO/RECUSADO/EXPIRADO
VISUALIZADO  -> tomador abriu link; informativo (contrato preserva EM_ASSINATURA)
ASSINADO     -> final; transiciona Contrato.ASSINADO + cria DocumentoAssinado
RECUSADO     -> final; transiciona Contrato.RECUSADO
EXPIRADO     -> final; nao transiciona contrato hoje (registrado como pendencia operacional)
```

`marcarVisualizado` rejeita `RASCUNHO` explicitamente (callback de visualizacao pressupoe envio previo); guard defensivo pra fluxo futuro de duas fases.

### Provider Pattern de assinatura (ADR 0013 — Clicksign)

- Port: `AssinaturaDigitalProvider` em `contratos.application.port.out` (3 metodos: `enviarParaAssinatura`, `baixarDocumentoAssinado`, `consultarStatus`).
- DTOs do port em linguagem de dominio: `RequisicaoEnvioAssinatura`, `RespostaEnvioAssinatura`, `StatusEnvelopeProvider`. Sem acoplamento com `RestClientResponseException`.
- Adapters:
  - `FakeAssinaturaDigitalProvider` (`@ConditionalOnProperty app.assinatura.provider=fake` ou ausente) — sem rede, retorna `idEnvelopeExterno=fake-env-<idempotencyKey>`, PDF stub `%PDF-1.4 fake-assinado`. Usado em dev/test/IT.
  - `ClicksignAssinaturaDigitalProvider` (`app.assinatura.provider=clicksign`) — RestClient com Bearer Token + Resilience4j (`clicksign-assinatura`: CB + retry + timeLimiter) + `Idempotency-Key` por envio. Traduz HTTP via `RestClientResponseException` -> `AssinaturaProviderHttpException` (carrega statusCode + isClientError/isServerError) ou `EnvelopeNaoEncontradoException` em 404.
- Hierarquia de excecoes do provider: `AssinaturaProviderException` (base) + `AssinaturaProviderHttpException` + `EnvelopeNaoEncontradoException`. Mapeadas em `ApiExceptionHandler`: `isServerError` -> 503; `isClientError` -> 422; outros -> 502.
- `CcbGeracaoException` (PDFBox falhou) estende `OperacaoNaoProcessavelException` -> 422 com codigo `CTR-422-CCB-001`.

### Configuracao (application.yml)

```yaml
app:
  assinatura:
    provider: ${APP_ASSINATURA_PROVIDER:fake}                 # fake | clicksign
    auto-envio-pos-aceite: ${APP_ASSINATURA_AUTO_ENVIO_POS_ACEITE:true}
    clicksign:
      base-url: ${APP_CLICKSIGN_BASE_URL:https://sandbox.clicksign.com}
      access-token: ${APP_CLICKSIGN_ACCESS_TOKEN:}            # blank em fake; obrigatorio em clicksign
      webhook:
        hmac-secret: ${APP_WEBHOOK_SECRET_CLICKSIGN:dev-...}
  webhooks:
    secrets:
      clicksign-assinatura: ${APP_WEBHOOK_SECRET_CLICKSIGN:dev-...}  # reusa env var acima
```

### Webhook — formato Clicksign

Header HMAC: `Content-Hmac: sha256=<hex>` (Clicksign). Alias aceito: `X-Webhook-Signature: <hex>` (formato generico do projeto). Idempotency-Key ausente eh derivado pelo controller via `SHA-256(provider:payload)`.

Payload minimo esperado:

```json
{
  "event": { "name": "sign", "occurred_at": "2026-05-21T15:00:00Z" },
  "document": { "key": "<idEnvelopeExterno>" }
}
```

Campos desconhecidos sao ignorados (`@JsonIgnoreProperties(ignoreUnknown=true)`).

### Storage do PDF assinado

Port `DocumentoAssinadoStorage` (`salvar(byte[])`, `carregar(pathStorage)`, `deletar(pathStorage)`).
Impl atual `InlineDocumentoAssinadoStorage` persiste em `documento_assinado_blob` (tabela isolada com BYTEA). Epic 16 troca por adapter S3/MinIO sem alterar `DocumentoAssinado` nem `BaixarDocumentoAssinadoUseCase`.

Em caso de falha persistindo `DocumentoAssinado` apos storage salvar, o use case faz `storage.deletar(pathStorage)` em bloco `finally` (compensa blob orfao). Falha do delete eh logada como warn — discrepancia identificavel via job de reconciliacao futuro.

## Endpoints REST

| Metodo  | Path                                              | Auth                              | OpenAPI Tag |
| ------- | ------------------------------------------------- | --------------------------------- | ----------- |
| `GET`   | `/api/v1/contratos/{id}`                          | ownership ou FINANCEIRO/ADMIN     | `contratos` |
| `GET`   | `/api/v1/contratos/proposta/{propostaId}`         | ownership ou FINANCEIRO/ADMIN     | `contratos` |
| `GET`   | `/api/v1/contratos/{id}/versoes`                  | ownership ou FINANCEIRO/ADMIN     | `contratos` |
| `PATCH` | `/api/v1/contratos/{id}/aceite`                   | CLIENTE dono + step-up            | `contratos` |
| `POST`  | `/api/v1/contratos/{id}/cancelar`                 | FINANCEIRO/ADMIN + step-up        | `contratos` |
| `POST`  | `/api/v1/contratos/{id}/assinar` (Sprint 11)      | FINANCEIRO/ADMIN + step-up        | `contratos` |
| `GET`   | `/api/v1/contratos/{id}/assinatura/status`        | ownership ou FINANCEIRO/ADMIN     | `contratos` |
| `GET`   | `/api/v1/contratos/{id}/documento-assinado`       | ownership ou FINANCEIRO/ADMIN     | `contratos` |
| `POST`  | `/api/v1/webhooks/assinatura/{provider}`          | publico + HMAC (sem JWT)          | `webhooks`  |

DTOs (records imutaveis com `@Schema`):

- `ContratoResponse` (id, propostaId, tomadorId, tipo, status, versaoVigente, aceite, dataCriacao, dataModificacao)
- `VersaoContratoResponse` (id, numero, conteudoTexto, hashSha256, dataGeracao, parecerOrigemId, clausulas)
- `ClausulaContratoResponse` (id, ordem, titulo, texto)
- `AceiteContratoResponse` (id, versaoId, tomadorId, dataAceite, ipOrigem, userAgentOrigem)
- `RegistrarAceiteRequest` (corpo vazio — reservado para evolucao)
- `CancelarContratoRequest` (`justificativa` `@NotBlank @Size(min=10, max=500)`)
- `EnviarAssinaturaRequest` (corpo vazio — reservado para evolucao Sprint 11)
- `StatusAssinaturaResponse` (statusContrato, statusEnvelope, idEnvelopeExterno, dataAtualizacaoProvider)
- `AssinaturaCallbackClicksign` (event{name, occurredAt} + document{key} — ignora campos extras)

`GET /documento-assinado` retorna `application/pdf` puro com headers:
- `Content-Disposition: attachment; filename="contrato-<id>-assinado.pdf"`
- `X-Document-Hash-Sha256: <hex>` (integridade local conferida pelo cliente)

### Step-up estrito (Sprint 27)

`PATCH /aceite`, `POST /cancelar` e `POST /assinar` usam `@RequireStepUpEstrito` (sem bypass de migracao pre-MFA): exigem `mfaHabilitado=true` + token `X-Step-Up-Token` valido. Usuario sem MFA ativo recebe `403` sem possibilidade de bypass. Divida de go-live de step-up fechada.

## Auditoria reforcada

Tipos em `audit_log_seguranca` (V22 + V24):

| Tipo                          | Detalhes (JSONB)                                                                                   | Coluna ip + user-agent |
| ----------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------- |
| `CONTRATO_GERADO`             | contratoId, propostaId, versaoId, numeroVersao, hashSha256                                         | nao                    |
| `CONTRATO_NOVA_VERSAO`        | contratoId, propostaId, versaoId, numeroVersao, hashSha256                                         | nao                    |
| `CONTRATO_ACEITO`             | contratoId, propostaId, versaoId, numeroVersao, hashSha256                                         | **sim**                |
| `CONTRATO_CANCELADO`          | contratoId, propostaId, tomadorId, justificativa (truncada em 200)                                 | nao                    |
| `CCB_GERADA` (Sprint 11)      | contratoId, propostaId, versaoId, numeroVersao, hashPdfGerado                                      | nao                    |
| `ASSINATURA_ENVIADA`          | contratoId, propostaId, versaoId, envelopeId, idEnvelopeExterno, provider, hashPdfEnviado          | nao                    |
| `ASSINATURA_VISUALIZADA`      | contratoId, envelopeId, provider, dataEvento                                                       | nao                    |
| `ASSINATURA_ASSINADA`         | contratoId, propostaId, versaoId, envelopeId, documentoAssinadoId, provider, idEnvelopeExterno, hashPdfAssinado, dataAssinatura | nao   |
| `ASSINATURA_RECUSADA`         | contratoId, propostaId, versaoId, envelopeId                                                       | nao                    |
| `DOCUMENTO_ASSINADO_BAIXADO`  | contratoId, envelopeId, documentoAssinadoId                                                        | **sim**                |

`ContratoAuditListener` usa `@TransactionalEventListener(AFTER_COMMIT)` + `@Transactional(REQUIRES_NEW)` (mesmo padrao Sprints 7/8/9/10). Falha de serializacao JSON cai em fallback minimo `{"contratoId":"...","erroSerializacao":true}` — preserva rastreabilidade sem mascarar como payload vazio.

Eventos publicados em `EnviarParaAssinaturaUseCase` (`CcbGeradaEvent` + `AssinaturaEnviadaEvent`), `ProcessarCallbackAssinaturaUseCase` (`AssinaturaVisualizadaEvent` + `ContratoAssinadoEvent` + `ContratoRecusadoEvent`) e `BaixarDocumentoAssinadoUseCase` (`DocumentoAssinadoBaixadoEvent`).

### Dados proibidos no audit log

- Conteudo integral do contrato.
- Clausulas completas.
- Dados cadastrais alem dos identificadores.
- Payload bruto de qualquer outra entidade do modulo.
- Bytes do PDF da CCB ou do documento assinado (apenas hashes).
- Payload bruto do webhook do provider (apenas resumo truncado em 1000 chars em `evento_assinatura.payload_resumo`).

Testes defensivos em `ContratoAuditListenerTest`:
- `aoAceitar_conteudoIntegralDoContratoNaoVazaParaAudit` valida que `conteudoTexto` e `clausulas` nunca aparecem no payload.
- `assinaturaEventos_naoVazamConteudoIntegralOuPdf` valida que os payloads de `CCB_GERADA`/`ASSINATURA_ENVIADA`/`ASSINATURA_ASSINADA` nao contem `conteudoTexto`, `clausulas`, `pdf`, `PDF`, `%PDF` (header binario) nem `JVByR` (base64 prefix de `%PDF`).

## Retencao

Contratos, versoes, clausulas, aceites e audit log relacionado sao documentos legais. **Retencao minima de 10 anos** (CMN 4.656/2018 Art. 11 + LGPD compatibilidade). Exclusao fisica nao deve ser usada como mecanismo operacional nesta fase. FKs sem CASCADE protegem contra remocao indevida de proposta/usuario.

## Concorrencia e idempotencia

- **Race aceite vs cancelamento**: `findByIdForUpdate` (PESSIMISTIC_WRITE) no Contrato serializa as duas operacoes — segunda thread espera o commit da primeira, le estado atualizado e falha na validacao (`permiteAceite`/`permiteCancelamento`).
- **Race no aceite**: `aceiteRepository.save + flush()` envolto em `catch (DataIntegrityViolationException)` traduz violacao UNIQUE `versao_id` em `ConflitoException` (codigo `CTR-409-002`).
- **Replay do evento `PropostaAprovadaEvent`**: idempotencia por `parecerOrigemId` no `VersaoContrato` — versao vigente com mesmo parecer faz short-circuit no use case, sem nova versao/render/save/evento.
- **Listener falha**: `PropostaAprovadaListener` envolve TODO o metodo em try/catch (incluindo construcao do command e guard `event == null`). Falha apenas e logada — proposta ja aprovada nao pode ser revertida; pendencia operacional fica para sprint futura de backoffice.
- **Sprint 11 — Race callbacks concorrentes do mesmo envelope**: `ProcessarCallbackAssinaturaUseCase` aplica lock global ordering (contrato ANTES de envelope via `carregarComLock` -> `findByProviderAndIdEnvelopeExternoForUpdate`) pra evitar deadlock cross-resource.
- **Sprint 11 — Dedup de evento de webhook**: 2 camadas. (a) fast path: `eventoRepository.existsByEnvelopeIdAndIdEventoExterno`. (b) defesa em profundidade: `saveAndFlush` envolto em `catch DataIntegrityViolationException` (UNIQUE `(envelope_id, id_evento_externo)` na V23). Mesmo padrao do `RegistrarWebhookEventUseCase` (Sprint 4) e `RegistrarAceiteUseCase` (Sprint 10).
- **Sprint 11 — Idempotencia de envio**: `EnvelopeAssinatura.idempotency_key = <contratoId>:v<numeroVersao>` (UNIQUE). Reenvio via `POST /assinar` ou re-execucao do listener com mesmo aceite devolve envelope existente sem chamar provider novamente.
- **Sprint 11 — Listener auto-envio falha silenciosa**: `ContratoAceitoListener` em `REQUIRES_NEW` apos `AFTER_COMMIT`. Falha de envio (provider 5xx, CCB gerada com erro) eh logada como `warn`; aceite ja commitado nao reverte. Reprocessamento manual via `POST /api/v1/contratos/{id}/assinar` (runbook abaixo).

## Limitacoes (Sprints 10 + 11)

- Sprint 10: sem PDF/HTML rico no contrato textual (Sprint 11 ja gera CCB em PDF estruturado via PDFBox para o documento assinado).
- Sem desembolso/Pix (Sprint 12+).
- Sem calculo financeiro definitivo (parcelas, IOF, CET) — Sprint 12 (Cobranca).
- Sem telas web/mobile (decisao 2026-05-04 — Web/Mobile da Fase 2 entram apos contratos da API estabilizarem).
- Sem renegociacao/aditivos contratuais (Epic 8 estendida).
- Sem multiplos signatarios (avalistas, garantidores) — Sprint futura.
- Validacao avancada de certificado ICP-Brasil eh responsabilidade do provider (Clicksign suporta como opcional).
- Dados cadastrais reais do tomador (nome, endereco, CPF/CNPJ) ainda nao entram no template — placeholders UUID enquanto modulo `onboarding` (Epic 5) nao expor (ver `CCB.md` §Limitacoes).
- Dados cadastrais reais do tomador (nome, CPF/CNPJ) ainda nao entram no template — placeholders UUID enquanto modulo `onboarding` nao expor (ver `CCB.md`).
- WireMock E2E completo (provider=clicksign + stubs HTTP do ciclo aceite->callback) ficou como follow-up — coberturas atuais: `ClicksignAssinaturaDigitalProviderIT` (HTTP wiring isolado, Task 11.4) + `AssinaturaIT` (E2E via Fake, Task 11.9).

## Runbook: reprocessamento de envio para assinatura (Sprint 11)

`ContratoAceitoListener` (Sprint 11 Task 11.5) escuta `ContratoAceitoEvent` e dispara `EnviarParaAssinaturaUseCase` em transacao separada (`AFTER_COMMIT + REQUIRES_NEW`). Falha de envio (provider indisponivel, 5xx, erro de geracao de CCB) **nao desfaz o aceite ja commitado** — eh apenas logada como `warn` no listener:

```
Falha ao enviar contrato {contratoId} para assinatura apos aceite — operador deve reprocessar: {mensagem}
```

### Detectar contratos pendentes de envio

Contrato em estado `ACEITO` sem envelope persistido = pendencia de envio:

```sql
SELECT c.id, c.proposta_id, c.tomador_id, c.data_modificacao
FROM contrato c
LEFT JOIN envelope_assinatura e ON e.contrato_id = c.id
WHERE c.status = 'ACEITO'
  AND e.id IS NULL
ORDER BY c.data_modificacao;
```

Alarme operacional sugerido: query acima rodando a cada 5 min; qualquer linha com idade > 10 min dispara incidente para o oncall do backend.

### Reprocessar manualmente

Endpoint operacional `POST /api/v1/contratos/{id}/assinar` (Task 11.7) eh **idempotente** — chave `Idempotency-Key = aceite:{contratoId}` reusa envelope existente se ja criado:

```bash
curl -X POST https://api.sep/v1/contratos/{contratoId}/assinar \
  -H "Authorization: Bearer ${TOKEN_FINANCEIRO}" \
  -H "X-Step-Up-Token: ${STEP_UP}"
```

Autorizacao exigida: `ROLE_FINANCEIRO` ou `ROLE_ADMIN` + step-up. Falha repetida — investigar:

1. Status do provider Clicksign (sandbox/producao).
2. Credenciais (`CLICKSIGN_ACCESS_TOKEN`, `CLICKSIGN_WEBHOOK_HMAC_SECRET`).
3. Logs de `EnviarParaAssinaturaUseCase` filtrando por `correlationId = aceite:{contratoId}`.
4. Geracao de CCB (`CcbGenerator`) — PDFBox pode falhar se template ausente ou dados cadastrais invalidos.

### Hardening futuro

- Sprint 11 Task 11.8 ampliara `audit_log_seguranca` com `ASSINATURA_ENVIADA`; ausencia do tipo apos `CONTRATO_ACEITO` (consulta cross-tabela) indica silent failure do listener — substituira parcialmente a query SQL acima.
- Contador Micrometer `sep_contratos_auto_envio_falhas_total` (sprint futura de observabilidade) substituira o polling.
- Status `PENDING_REPROCESS` no enum `StatusEnvelope` ficou explicitamente **fora** desta sprint — poluiria o enum por falha transitoria; reprocessamento manual via endpoint eh suficiente enquanto volume operacional permitir.

## Validacao

```bash
cd <sep-api-root>
./gradlew test --tests "*Contrato*" --tests "*Assinatura*"
./gradlew check
```

Smoke manual (Postman/Insomnia):

1. Aprovar proposta de credito (via parecer FINANCEIRO + step-up).
2. Aguardar `PropostaAprovadaListener` AFTER_COMMIT gerar contrato (poll ate `findByPropostaId` retornar).
3. `GET /api/v1/contratos/proposta/{propostaId}` — confirma `status=AGUARDANDO_ACEITE`.
4. `PATCH /api/v1/contratos/{id}/aceite` (CLIENTE dono + `X-Step-Up-Token`) — espera 200 com `status=ACEITO`.
5. Aguardar `ContratoAceitoListener` AFTER_COMMIT criar envelope. `GET /api/v1/contratos/{id}/assinatura/status` retorna `statusContrato=EM_ASSINATURA + statusEnvelope=ENVIADO`.
6. Simular webhook ASSINADO (dev/fake): `POST /api/v1/webhooks/assinatura/clicksign` com `Content-Hmac: sha256=<hex>` + payload `{"event":{"name":"sign","occurred_at":"..."},"document":{"key":"<idEnvelopeExterno>"}}`. Espera 202.
7. `GET /api/v1/contratos/{id}/assinatura/status` retorna `statusContrato=ASSINADO + statusEnvelope=ASSINADO`.
8. `GET /api/v1/contratos/{id}/documento-assinado` (ownership ou FINANCEIRO/ADMIN) retorna `application/pdf` + headers `Content-Disposition` + `X-Document-Hash-Sha256`.
9. Validar audit `CCB_GERADA`, `ASSINATURA_ENVIADA`, `ASSINATURA_ASSINADA`, `DOCUMENTO_ASSINADO_BAIXADO` em `audit_log_seguranca`.
10. Cancelar contrato pre-aceite via `POST /api/v1/contratos/{id}/cancelar` (FINANCEIRO + step-up + justificativa 10-500 chars) — apenas para contratos antes de `ACEITO`.
