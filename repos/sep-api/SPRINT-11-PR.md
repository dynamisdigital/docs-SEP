# PR — Sprint 11 (Formalizacao — assinatura digital + CCB)

Artefato exigido pela Task 11.10 (steps `011-sprint-11-steps.md`). Conteudo abaixo
deve ser usado ao abrir o PR manualmente (`gh pr create --base develop ...` ou via UI).

## Titulo sugerido

```
feat(contratos): Sprint 11 — Assinatura digital + CCB + auditoria reforcada (Epic 7 parte 2)
```

## Resumo

- Conclui Epic 7 (Formalizacao Contratual): ciclo completo `ACEITO -> EM_ASSINATURA -> ASSINADO`/`RECUSADO` com geracao de CCB em PDF (PDFBox), envio automatico ao provider (Clicksign), recebimento de callback via webhook HMAC e armazenamento do PDF assinado com hash de integridade.
- `AssinaturaDigitalProvider` via Provider Pattern (ADR 0013 — Clicksign): port em `application.port.out`, adapter `Fake` (dev/test) + `Clicksign` (prod/homologacao) com Resilience4j (CB + retry + timeLimiter).
- 3 endpoints REST novos (`POST /assinar`, `GET /assinatura/status`, `GET /documento-assinado`) + webhook publico (`POST /api/v1/webhooks/assinatura/{provider}`) com HMAC SHA-256 + idempotencia derivada do payload.
- Auditoria reforcada: 6 tipos novos (`CCB_GERADA`, `ASSINATURA_ENVIADA/VISUALIZADA/ASSINADA/RECUSADA`, `DOCUMENTO_ASSINADO_BAIXADO`); `DOCUMENTO_ASSINADO_BAIXADO` grava ip+user-agent (LGPD).
- 2 migrations Flyway novas (V23 + V24), `ApiExceptionHandler` shared ampliado para mapear provider HTTP em 422/503/502 + `MethodArgumentTypeMismatchException` em 400.
- Suite E2E nova (`AssinaturaIT` com 8 cenarios) + adicao defensiva contra leak de PDF/CCB no audit + WireMock IT do adapter Clicksign (Task 11.4).

## Escopo tecnico

### Dominio + persistencia

3 entidades novas (todas `extends EntidadeAuditavel`):

- `EnvelopeAssinatura` — vincula `VersaoContrato` ao provider via `idEnvelopeExterno`. Nasce em `ENVIADO` (factory `criar` exige `idEnvelopeExterno` + `dataEnvio`). `UNIQUE versao_id` (1 envelope ativo por versao). `UNIQUE idempotency_key = contratoId:vN`. `hashPdfEnviado` validado por `HashValidator`.
- `EventoAssinatura` — historico de callbacks. `UNIQUE (envelope_id, id_evento_externo)` para dedup. Payload bruto NUNCA persistido — apenas `payloadResumo` truncado em 1000 chars.
- `DocumentoAssinado` — 1:1 com envelope `ASSINADO`. `hashSha256` calculado pelo SEP sobre PDF assinado, `selo` opcional, `pathStorage` opaco. Binario isolado em `documento_assinado_blob` (BYTEA).

Mais:
- `StatusEnvelope` (RASCUNHO/ENVIADO/VISUALIZADO/ASSINADO/RECUSADO/EXPIRADO; helper `isFinal`).
- `StatusFormalizacao` ganhou `RECUSADO` (final).
- `Contrato.marcarEmAssinatura`/`marcarAssinado`/`marcarRecusado` adicionados.
- `EnvelopeAssinatura.marcarVisualizado` rejeita `RASCUNHO` explicitamente (guard defensivo).
- `VersaoContrato.criar` passa a usar `HashValidator` central em vez de Pattern local.

2 migrations:
- `V23__criar_tabelas_assinatura.sql` — 3 tabelas + `documento_assinado_blob` + indices + 3 UNIQUEs + 2 CHECKs (status enum + hash regex) + FKs sem CASCADE.
- `V24__ampliar_audit_seguranca_tipo_assinatura.sql` — DROP+ADD `chk_audit_seguranca_tipo` com 6 valores adicionais.

### Provider Pattern (ADR 0013 — Clicksign)

- Port `AssinaturaDigitalProvider` em `contratos.application.port.out`:
  - `RespostaEnvioAssinatura enviarParaAssinatura(byte[] pdf, RequisicaoEnvioAssinatura req, String correlationId)`
  - `byte[] baixarDocumentoAssinado(String idEnvelopeExterno)`
  - `StatusEnvelopeProvider consultarStatus(String idEnvelopeExterno)`
- DTOs do port falam linguagem de dominio (`RequisicaoEnvioAssinatura`, `RespostaEnvioAssinatura`, `StatusEnvelopeProvider`).
- Adapters:
  - `FakeAssinaturaDigitalProvider` (`@ConditionalOnProperty app.assinatura.provider=fake|<missing>`) — sem rede, deterministico, usado em dev/test/IT.
  - `ClicksignAssinaturaDigitalProvider` (`app.assinatura.provider=clicksign`) — RestClient com `Bearer Token` + `Idempotency-Key` + Resilience4j (`clicksign-assinatura` CB+retry+timeLimiter).
- Hierarquia de excecoes: `AssinaturaProviderException` (base RuntimeException) + `AssinaturaProviderHttpException` (carrega statusCode + isClientError/isServerError) + `EnvelopeNaoEncontradoException`. Mapeadas em `ApiExceptionHandler`: server -> 503, client -> 422, outros -> 502.

### Geracao de CCB (Apache PDFBox)

- Dependencia: `org.apache.pdfbox:pdfbox:3.0.3`.
- `CcbGenerator` + `CcbTemplate` em `contratos.application.service.ccb`.
- PDF texto pesquisavel + deterministico (metadata zerada: `documentId=0L`, datas em epoch). Mesmo input -> mesmo binario -> mesmo hash.
- `CcbGeracaoException extends OperacaoNaoProcessavelException` (CTR-422-CCB-001) — falha no PDFBox aborta envio.
- Limitacoes documentadas em `CCB.md` (dados cadastrais incompletos, encargos placeholder, foro fixo SP, sem garantias).

### Use cases

- `EnviarParaAssinaturaUseCase` (`@Transactional`) — gera PDF + hash + chama provider + cria envelope + transiciona contrato. Publica `CcbGeradaEvent` + `AssinaturaEnviadaEvent`. Idempotente por `idempotency_key`.
- `ProcessarCallbackAssinaturaUseCase` (`@Transactional`) — lock global ordering (contrato ANTES de envelope). Dedup 2 camadas (existsBy + saveAndFlush com catch DataIntegrityViolation). Mapeia `StatusEnvelope`: ASSINADO -> baixa PDF + cria `DocumentoAssinado` + publica `ContratoAssinadoEvent`; RECUSADO -> publica `ContratoRecusadoEvent`; VISUALIZADO -> publica `AssinaturaVisualizadaEvent`; default -> warn defensivo.
- `BaixarDocumentoAssinadoUseCase` (`@Transactional(readOnly=true)`) — exige contrato `ASSINADO`. Recebe `baixadoPorId` + ip + user-agent; publica `DocumentoAssinadoBaixadoEvent`. Distingue `blob nao localizado` (UUID valido — purge/LGPD) de `pathStorage corrompido` (formato invalido).
- `ConsultarStatusAssinaturaUseCase` (`@Transactional(readOnly=true)`) — snapshot local.
- `ProcessarWebhookAssinaturaUseCase` (`@Transactional`) — reusa `RegistrarWebhookEventUseCase` (outbox Sprint 4). Mapeia `event.name` Clicksign -> `StatusEnvelope` (view->VISUALIZADO; sign/auto_close->ASSINADO; refuse->RECUSADO; deadline/cancel->EXPIRADO; upload/add_signer->ENVIADO). Marca outbox PROCESSADO/FALHOU.

### Listener

- `ContratoAceitoListener` (`@TransactionalEventListener(AFTER_COMMIT)` + `@Transactional(REQUIRES_NEW)`) — escuta `ContratoAceitoEvent` e dispara `EnviarParaAssinaturaUseCase`. Falha NAO desfaz aceite; logada como warn. Desligavel via `app.assinatura.auto-envio-pos-aceite=false` (default true). Runbook de reprocessamento em [`CONTRATOS.md` §Runbook](./CONTRATOS.md).

### Web

- `ContratoController` ganhou 3 endpoints:
  - `POST /api/v1/contratos/{id}/assinar` — FINANCEIRO/ADMIN + `@RequireStepUp`. Idempotente. 202 + `StatusAssinaturaResponse`.
  - `GET /api/v1/contratos/{id}/assinatura/status` — ownership ou FINANCEIRO/ADMIN.
  - `GET /api/v1/contratos/{id}/documento-assinado` — ownership ou FINANCEIRO/ADMIN. Retorna `application/pdf` + `Content-Disposition` + `X-Document-Hash-Sha256`.
- `AssinaturaWebhookController` (publico, sem JWT) — `POST /api/v1/webhooks/assinatura/{provider}`:
  - Whitelist `{"clicksign"}` (extensivel; D4Sign etc adicionados via string + adapter).
  - Header `Content-Hmac: sha256=<hex>` (Clicksign) ou alias `X-Webhook-Signature: <hex>`.
  - Idempotency-Key opcional; derivado de `SHA-256(provider:payload)` quando ausente.
  - `idEventoExterno = SHA-256(payload)` (dedup natural em UNIQUE `(envelope_id, id_evento_externo)`).
  - Body max 64KB (defesa DoS).
- DTOs novos: `EnviarAssinaturaRequest` (vazio), `StatusAssinaturaResponse`, `AssinaturaCallbackClicksign`.
- `ContratoWebMapper.toStatusAssinaturaResponse` adicionado (MapStruct default method).

### Storage do PDF assinado

- Port `DocumentoAssinadoStorage`: `salvar(byte[])` -> `pathStorage` opaco; `carregar(pathStorage)` -> `Optional<byte[]>`; `deletar(pathStorage)`.
- Impl `InlineDocumentoAssinadoStorage` em tabela `documento_assinado_blob` (BYTEA). Epic 16 troca por adapter S3/MinIO sem alterar dominio.
- Compensacao de orphan em `ProcessarCallbackAssinaturaUseCase.finalizarComoAssinado`: `storage.deletar(pathStorage)` no `finally` se persistencia do `DocumentoAssinado` falhar.

### Auditoria (6 tipos novos)

- `CCB_GERADA` — hashPdfGerado + numeroVersao.
- `ASSINATURA_ENVIADA` — envelopeId + idEnvelopeExterno + provider + hashPdfEnviado.
- `ASSINATURA_VISUALIZADA` — envelopeId + provider + dataEvento (informativo).
- `ASSINATURA_ASSINADA` — provider + idEnvelopeExterno + hashPdfAssinado + dataAssinatura (timestamp do provider) + documentoAssinadoId.
- `ASSINATURA_RECUSADA` — envelopeId.
- `DOCUMENTO_ASSINADO_BAIXADO` — documentoAssinadoId + ip + user-agent (colunas dedicadas, fora do JSONB).

Dados PROIBIDOS no audit (alem dos da Sprint 10):
- Bytes do PDF da CCB ou do documento assinado (apenas hashes).
- Payload bruto do webhook (apenas resumo truncado em 1000 chars em `evento_assinatura.payload_resumo`).

Testes defensivos: `assinaturaEventos_naoVazamConteudoIntegralOuPdf` bloqueia `conteudoTexto`, `clausulas`, `pdf`, `PDF`, `%PDF`, `JVByR`.

### Cross-cutting (shared)

- `ApiExceptionHandler`:
  - `@ExceptionHandler MethodArgumentTypeMismatchException` -> 400 (UUID invalido em `@PathVariable` virava 500).
  - `@ExceptionHandler AssinaturaProviderException` -> 422/502/503 conforme subtipo.
- `ContratoAssinaturaIndisponivelException` passou a `extends ConflitoException` -> 409 via `ApiExceptionHandler` (era 500 default).
- `application.yml`:
  - `app.assinatura.provider`, `app.assinatura.auto-envio-pos-aceite`, `app.assinatura.clicksign.*`.
  - `app.webhooks.secrets.clicksign-assinatura` (reusa env var `APP_WEBHOOK_SECRET_CLICKSIGN`).
  - Resilience4j `clicksign-assinatura` (4xx tambem retenta por limitacao YAML; follow-up usar Java predicate).

### Excecoes novas

- `CcbGeracaoException` (CTR-422-CCB-001, extends `OperacaoNaoProcessavelException`).
- `ContratoAssinaturaIndisponivelException` (CTR-409-003, extends `ConflitoException`).
- `AssinaturaProviderException` / `AssinaturaProviderHttpException` / `EnvelopeNaoEncontradoException` (port out).

## Endpoints novos

| Metodo  | Path                                              | Auth                            |
| ------- | ------------------------------------------------- | ------------------------------- |
| `POST`  | `/api/v1/contratos/{id}/assinar`                  | FINANCEIRO/ADMIN + step-up      |
| `GET`   | `/api/v1/contratos/{id}/assinatura/status`        | ownership ou FINANCEIRO/ADMIN   |
| `GET`   | `/api/v1/contratos/{id}/documento-assinado`       | ownership ou FINANCEIRO/ADMIN   |
| `POST`  | `/api/v1/webhooks/assinatura/{provider}`          | publico + HMAC SHA-256          |

## Como validar

```bash
cd <sep-api-root>
docker compose up -d sep-postgres
createdb -h localhost -U sep sep_test  # se ainda nao criado

./gradlew test --tests "*Contrato*" --tests "*Assinatura*"
./gradlew check                                                   # suite completa + JaCoCo + Spotless
./gradlew bootRun                                                  # smoke manual via Swagger/Postman
```

Cenarios cobertos no `AssinaturaIT` (8 testes E2E em `sep_test`, profile `test` com Fake provider + auto-envio ativo):

1. Fluxo feliz: aceite -> listener -> envelope ENVIADO -> webhook ASSINADO -> contrato ASSINADO + PDF + audit completo.
2. Callback RECUSADO -> contrato RECUSADO + audit.
3. Webhook idempotente: 2x mesmo payload -> 1 evento + 1 audit ASSINATURA_ASSINADA.
4. HMAC invalido -> 401; contrato preserva EM_ASSINATURA.
5. Download por nao-owner -> 403.
6. Download por tomador owner -> 200 + headers + bytes startsWith `%PDF` + audit.
7. Download por FINANCEIRO em contrato de outro cliente -> 200 + audit no usuario financeiro.
8. Reenvio POST /assinar idempotente -> 202; envelope id inalterado.

Adapter Clicksign HTTP wiring isolado em `ClicksignAssinaturaDigitalProviderIT` (WireMock, Task 11.4).

## Riscos / breaking changes

- **Nenhum breaking change** em API publica — apenas adicoes; `Contrato` ganhou novos estados (`RECUSADO`) sem remover existentes.
- `ContratoAssinaturaIndisponivelException` mudou de `RuntimeException` -> `ConflitoException` (HTTP 500 -> 409); nenhum caller esperava 500 (verificado via grep + tests).
- `ContratoAssinadoEvent` (criado na Task 11.5) ganhou campos `provider`, `idEnvelopeExterno`, `dataAssinatura` durante a sprint — todos os call sites internos atualizados; consumidores externos nao existem ainda (Sprint 12 sera o primeiro).
- `BaixarDocumentoAssinadoUseCase.executar(UUID)` -> `executar(UUID, UUID, String, String)` para receber `baixadoPorId`+ip+user-agent. Controller adaptado.
- Migrations `V23`/`V24` aditivas — preservam dados anteriores. Banco local precisa `flyway migrate`.
- `app.assinatura.provider=fake` default — producao deve setar `clicksign` + credenciais (`APP_CLICKSIGN_ACCESS_TOKEN`, `APP_WEBHOOK_SECRET_CLICKSIGN`).
- Step-up bypass via `mfaHabilitado=false` segue valendo (limitacao Sprint 5 documentada). Producao exige MFA para `CLIENTE`/`FINANCEIRO`/`ADMIN` antes de liberar formalizacao.

## Pendencias / TODO sprints futuras

- **Revisao juridica do CCB.md** antes do go-live (template, clausulas, retencao, ICP-Brasil opcional, foro).
- **Onboarding (Epic 5)** — expor nome/CPF/CNPJ/endereco do tomador para preencher template real em vez de placeholders UUID.
- **Sprint 12 (Cobranca)** — motor financeiro real (juros, IOF, CET, parcelas) + `ContratoAssinadoEvent` consumer.
- **Hardening identity** — `@RequireStepUpEstrita` sem bypass.
- **WireMock E2E completo** — combinar provider=clicksign + stubs HTTP + ciclo completo (hoje split entre `ClicksignAssinaturaDigitalProviderIT` HTTP isolado + `AssinaturaIT` E2E via Fake).
- **Sprint backoffice/observabilidade** — Counter Micrometer `sep_contratos_auto_envio_falhas_total` + alerta operacional (substituir runbook SQL).
- **Resilience4j 4xx via Java predicate** — hoje retenta tambem em 4xx por limitacao do YAML.
- **Epic 16** — storage S3/MinIO substituindo `InlineDocumentoAssinadoStorage`.
- **Multiplos signatarios (avalistas/garantidores)** — Sprint futura.
- **Renegociacao/aditivos contratuais** — Epic 8 estendida.

## Referencias

- Spec: [`specs/fase-2/011-sprint-11-formalizacao-assinatura-digital.md`](../../specs/fase-2/011-sprint-11-formalizacao-assinatura-digital.md)
- Steps: [`steps-fase-2/backend/011-sprint-11-steps.md`](../../steps-fase-2/backend/011-sprint-11-steps.md)
- Docs: [`CONTRATOS.md`](./CONTRATOS.md), [`CCB.md`](./CCB.md)
- ADRs: 0004 (Provider Pattern), 0008 (WireMock), 0013 (Clicksign)
- Lei 10.931/2004 (CCB), Lei 14.063/2020 (assinatura eletronica), CMN 4.656/2018 (SEP), LGPD
- [Clicksign API](https://developers.clicksign.com/), [Apache PDFBox 3.0.x](https://pdfbox.apache.org/)
