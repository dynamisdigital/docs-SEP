# Steps - Sprint 11 - Formalizacao (assinatura digital + CCB)

**Spec de origem**: [`specs/fase-2/011-sprint-11-formalizacao-assinatura-digital.md`](../../specs/fase-2/011-sprint-11-formalizacao-assinatura-digital.md)

**Status**: a implementar.

**Objetivo geral**: concluir a formalizacao contratual com geracao de CCB em PDF, envio para assinatura digital via provider externo, processamento de callback, armazenamento do documento assinado com hash e desbloqueio do contrato `ASSINADO` para a Sprint 12.

**Esforco total estimado**: 8-12 dias de Dev Senior.

**Repo de destino**:
- `sep-api`: backend Spring Boot, unico repo de codigo alterado nesta sprint.
- `docs-SEP`: documentacao pode ser editada no working tree quando necessario, mas operacao git continua manual.

**Branch sugerida**:
- `feature/sprint-11-formalizacao-assinatura-digital`

**Pre-requisitos globais**:
- Sprint 10 concluida, revisada e mergeada em `develop`.
- `sep-api` em `develop` atualizado a partir de `origin/develop`.
- Modulo `contratos` funcional com geracao, versionamento, aceite e cancelamento pre-aceite.
- `ContratoAceitoEvent` publicado apos aceite do tomador.
- Step-up authentication da Sprint 5 funcional.
- Provider Pattern definido pela ADR 0004.
- WireMock para adapters externos definido pela ADR 0008.
- Credenciais sandbox do provedor de assinatura escolhido disponiveis, ou fake habilitado para dev/test.
- Contrato juridico minimo da CCB validado com PO/juridico antes de considerar a sprint pronta.

**Nota sobre ADR gate**:
- O spec 011 referencia `ADR 0012` como provedor de assinatura digital.
- O numero `0012` ja existe em `docs-SEP/adr/0012-motor-de-regras-de-credito-interno.md`.
- Nao sobrescrever nem renomear a ADR 0012 atual.
- Criar a proxima ADR livre para assinatura digital, por exemplo `adr/0013-provedor-de-assinatura-digital.md`, e registrar a divergencia no proprio ADR/steps se o spec ainda estiver desatualizado.

**Fora de escopo**:
- Multiplos signatarios, avalistas ou garantidores.
- Validacao avancada de certificado ICP-Brasil dentro do SEP; a responsabilidade e do provider escolhido.
- Renegociacao, aditivos ou segunda assinatura pos-contrato assinado.
- Telas web/mobile.
- Desembolso, Pix, conciliacao financeira e agenda de cobranca.
- Calculo financeiro definitivo fora do que ja estiver aprovado no contrato/parecer.

---

## Ordem de execucao recomendada

```text
11.0 (prechecks)
  |
  v
11.1 (ADR gate do provider de assinatura)
  |
  v
11.2 (dominio + migrations assinatura)
  |
  +--> 11.3 (geracao CCB PDF)
  +--> 11.4 (AssinaturaDigitalProvider Fake + Real)
  |
  v
11.5 (use cases envio + callback + listener)
  |
  v
11.6 (webhook assinatura)
  |
  v
11.7 (REST + DTOs + OpenAPI)
  |
  v
11.8 (auditoria reforcada)
  |
  v
11.9 (IT/E2E + WireMock)
  |
  v
11.10 (documentacao + collections + validacao final)
```

- 11.1 e gate real: nao implementar provider real sem ADR aceito.
- 11.2 deve estabilizar estados, entidades e migrations antes dos use cases.
- 11.3 e 11.4 podem avancar em paralelo depois da definicao do provider e das entidades.
- 11.5 depende de CCB, provider e repositories.
- 11.6 deve reaproveitar o padrao de webhook/idempotencia/HMAC existente.
- 11.7 so deve expor endpoints depois que os use cases estiverem fechados.
- 11.8 deve estar pronta antes do IT para validar audit log.
- 11.10 so marca PRD como executado no final da implementacao/merge.

---

## Task 11.0 - Prechecks da Sprint 11

**Objetivo**: garantir que a Sprint 11 nasce de `develop` atualizado, com Sprint 10 integrada e baseline verde.

**Esforco**: 1-2 horas.

### Step 011.0.1 - Conferir estado Git do `sep-api`

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

### Step 011.0.2 - Criar branch da sprint

**Comandos**:
```bash
cd <sep-api-root>
git switch develop
git pull --ff-only
git switch -c feature/sprint-11-formalizacao-assinatura-digital
```

**Verificacao**:
- Branch criada a partir de `develop` atualizado.
- Se `git pull --ff-only` falhar, abortar e avisar o usuario.

### Step 011.0.3 - Rodar baseline backend

**Comandos**:
```bash
cd <sep-api-root>
./gradlew clean test
./gradlew bootJar
```

**Verificacao**:
- Suite passa antes de qualquer alteracao.
- Se os testes dependem de PostgreSQL local, subir Docker Compose conforme README do `sep-api`.

### Step 011.0.4 - Conferir pontos de extensao

**Comandos**:
```bash
cd <sep-api-root>
find src/main/resources/db/migration -maxdepth 1 -type f | sort
grep -R "enum StatusFormalizacao" -n src/main/java/com/dynamis/sep_api/contratos
grep -R "ContratoAceitoEvent" -n src/main/java/com/dynamis/sep_api/contratos
grep -R "ContratoAuditListener" -n src/main/java/com/dynamis/sep_api/contratos
grep -R "RegistrarWebhookEventUseCase" -n src/main/java/com/dynamis/sep_api
grep -R "WebhookSignatureValidator\|HmacSignatureValidator" -n src/main/java/com/dynamis/sep_api
grep -R "RestClientFactory" -n src/main/java/com/dynamis/sep_api
grep -R "DocumentoStorage" -n src/main/java/com/dynamis/sep_api
```

**Verificacao**:
- Proximo numero livre de migration confirmado.
- Estados `EM_ASSINATURA` e `ASSINADO` ja existem ou precisam de ajuste controlado.
- Evento `ContratoAceitoEvent` tem payload suficiente para envio automatico.
- Padroes de audit log, webhook HMAC, outbox e RestClient identificados.
- Confirmar se `DocumentoStorage` da Sprint 6 pode ser reusado diretamente ou se precisa de port equivalente no modulo `contratos`.

### Step 011.0.5 - Confirmar provider de assinatura e contrato tecnico

**Checklist**:
- Provedor escolhido e ADR aceita.
- Base URL sandbox.
- Autenticacao da API.
- Endpoint para criar envelope/documento.
- Endpoint para baixar documento assinado.
- Payload de webhook para `visualizado`, `assinado`, `recusado` e `expirado`.
- Algoritmo e header de HMAC.
- Semantica de idempotencia e retry.

**Verificacao**:
- Se o contrato real estiver incerto, implementar port + fake primeiro e manter adapter real atras de WireMock/fixtures revisaveis.

### Definicao de pronto da Task 11.0
- [ ] Branch correta criada.
- [ ] Baseline backend verde.
- [ ] Proximo numero de migration confirmado.
- [ ] Pontos de extensao de contratos, audit log, webhook e storage identificados.
- [ ] Provider de assinatura escolhido por ADR ou risco documentado como bloqueador.

---

## Task 11.1 - ADR do provedor de assinatura digital (GATE)

**Objetivo**: decidir formalmente o provedor de assinatura digital antes de qualquer adapter real.

**Pre-requisito**: Task 11.0 concluida.

**Esforco**: 0,5-1 dia, incluindo validacao PO/juridico/comercial.

**Arquivo esperado**:
- `docs-SEP/adr/<proximo-numero>-provedor-de-assinatura-digital.md`

### Step 011.1.1 - Criar ADR com numeracao livre

**Regras**:
- Nao usar `0012` se ja existir.
- Usar proximo numero livre em `docs-SEP/adr/`.
- Registrar no ADR que o spec 011 citava `ADR 0012`, mas a numeracao foi ajustada para preservar a ADR existente.

### Step 011.1.2 - Avaliar alternativas

**Alternativas minimas**:
- Clicksign.
- D4Sign.
- DocuSign Brasil.
- ZapSign.

**Criterios**:
- Validade juridica para assinatura eletronica avancada ou ICP-Brasil opcional.
- Qualidade da API REST.
- Suporte a webhook e HMAC.
- Download do PDF assinado com evidencia.
- Idempotencia/retry.
- Custo por assinatura.
- Facilidade de sandbox e WireMock.

### Step 011.1.3 - Fechar decisao e consequencias

**Conteudo obrigatorio**:
- Provedor escolhido.
- Justificativa tecnica e comercial.
- Consequencias para Provider Pattern.
- Propriedades de configuracao esperadas.
- Riscos conhecidos e plano de mitigacao.

### Definicao de pronto da Task 11.1
- [ ] ADR criada com numero livre.
- [ ] Provedor escolhido explicitamente.
- [ ] Configuracoes e riscos documentados.
- [ ] Sprint liberada para codigo.

---

## Task 11.2 - Entidades e migrations de assinatura

**Objetivo**: persistir envelopes, eventos e documentos assinados, e completar a maquina de estados de `Contrato`.

**Pre-requisito**: Task 11.1 concluida.

**Esforco**: 1-2 dias.

**Arquivos principais**:
- `contratos/domain/model/EnvelopeAssinatura.java`
- `contratos/domain/model/EventoAssinatura.java`
- `contratos/domain/model/DocumentoAssinado.java`
- `contratos/domain/vo/StatusEnvelope.java`
- `contratos/domain/vo/StatusFormalizacao.java`
- `contratos/infrastructure/persistence/EnvelopeAssinaturaRepository.java`
- `contratos/infrastructure/persistence/EventoAssinaturaRepository.java`
- `contratos/infrastructure/persistence/DocumentoAssinadoRepository.java`
- `src/main/resources/db/migration/V<n>__criar_tabelas_assinatura.sql`

### Step 011.2.1 - Completar `StatusFormalizacao`

**Estados esperados**:
```text
GERADO
AGUARDANDO_ACEITE
ACEITO
EM_ASSINATURA
ASSINADO
RECUSADO
CANCELADO
```

**Regras**:
- `ACEITO -> EM_ASSINATURA` quando envelope for enviado.
- `EM_ASSINATURA -> ASSINADO` quando provider confirmar assinatura.
- `EM_ASSINATURA -> RECUSADO` quando provider confirmar recusa.
- `ASSINADO`, `RECUSADO` e `CANCELADO` sao finais.
- Nao permitir nova versao, aceite ou cancelamento administrativo em `ASSINADO`.

### Step 011.2.2 - Modelar `StatusEnvelope`

**Valores esperados**:
```text
RASCUNHO
ENVIADO
VISUALIZADO
ASSINADO
RECUSADO
EXPIRADO
```

**Regras**:
- `ENVIADO` nasce apos provider aceitar o documento.
- `VISUALIZADO` e historico/auditoria; nao finaliza o contrato.
- `ASSINADO`, `RECUSADO` e `EXPIRADO` sao finais para o envelope.

### Step 011.2.3 - Criar `EnvelopeAssinatura`

**Campos minimos**:
- `id`
- `contratoId`
- `versaoId`
- `provider`
- `idEnvelopeExterno`
- `idempotencyKey`
- `status`
- `dataEnvio`
- `dataAtualizacaoProvider`
- campos de auditoria herdados de `EntidadeAuditavel`, se o padrao do modulo permitir.

**Regras**:
- Um envelope ativo por contrato nesta sprint.
- `(provider, idEnvelopeExterno)` unico.
- `idempotencyKey` unico.
- Envelope referencia a versao vigente aceita.

### Step 011.2.4 - Criar `EventoAssinatura`

**Campos minimos**:
- `id`
- `envelopeId`
- `idEventoExterno`
- `status`
- `payloadResumo`
- `dataEvento`

**Regras**:
- `(envelopeId, idEventoExterno)` unico para idempotencia.
- Payload bruto completo nao deve ser salvo se contiver PII desnecessaria; persistir resumo sanitizado.

### Step 011.2.5 - Criar `DocumentoAssinado`

**Campos minimos**:
- `id`
- `envelopeId`
- `hashSha256`
- `pathStorage`
- `dataAssinatura`
- `selo` opcional

**Regras**:
- 1:1 com envelope finalizado como `ASSINADO`.
- PDF assinado deve ser recuperavel pelo storage escolhido.
- Hash SHA-256 deve ser hex lowercase de 64 caracteres.
- Retencao minima de 10 anos.

### Step 011.2.6 - Criar migrations

**Tabelas esperadas**:
- `envelope_assinatura`
- `evento_assinatura`
- `documento_assinado`

**Constraints minimas**:
- FKs sem `ON DELETE CASCADE`.
- Unique de contrato/envelope conforme regra adotada.
- Check de status do envelope.
- Check de hash SHA-256.
- Indices por `contrato_id`, `provider + id_envelope_externo` e status.

### Definicao de pronto da Task 11.2
- [ ] Estados do contrato completos.
- [ ] Entidades persistiveis criadas.
- [ ] Repositories criados.
- [ ] Migration valida e sem cascade destrutivo.
- [ ] Testes de dominio/repository cobrindo transicoes e constraints principais.

---

## Task 11.3 - Geracao de CCB em PDF

**Objetivo**: gerar PDF estruturado da CCB a partir do contrato aceito usando Apache PDFBox.

**Pre-requisito**: Task 11.2 concluida.

**Esforco**: 1 dia.

**Arquivos principais**:
- `contratos/application/service/ccb/CcbGenerator.java`
- `contratos/application/service/ccb/CcbTemplate.java`
- `build.gradle`
- `src/main/resources/templates/ccb/ccb-base.pdf` se template fixo for adotado.

### Step 011.3.1 - Adicionar dependencia PDFBox

**Dependencia**:
```gradle
implementation 'org.apache.pdfbox:pdfbox:3.0.x'
```

**Verificacao**:
- Build resolve dependencia.
- Versao pinada explicitamente.

### Step 011.3.2 - Criar modelo logico da CCB

**Conteudo minimo**:
- Cabecalho, numero e data de emissao.
- Identificacao das partes.
- Valor principal, prazo e numero de parcelas.
- Taxa de juros, IOF e CET quando disponiveis.
- Forma de pagamento e referencia a conta escrow.
- Garantias, mesmo que texto inicial vazio/controlado.
- Foro e clausulas finais.
- Area/reserva para assinatura digital.

**Regra importante**:
- Nao inventar dados cadastrais ausentes. Se onboarding ainda nao expuser nome/endereco/CPF-CNPJ completos, usar apenas dados disponiveis e registrar limitacao em `CCB.md`.

### Step 011.3.3 - Implementar `CcbGenerator`

**Regras**:
- Entrada deve ser contrato aceito + versao vigente aceita.
- Saida deve ser `byte[]` PDF.
- Falha de geracao deve quebrar envio para assinatura; nao enviar documento parcial.
- PDF gerado deve ter texto pesquisavel, nao imagem pura.

### Step 011.3.4 - Testar PDF gerado

**Teste obrigatorio**:
- `CcbGeneratorTest`.

**Cenarios**:
- PDF nao vazio.
- Texto extraido contem titulo CCB, contratoId, propostaId, tomadorId, hash da versao e clausulas principais.
- Falha quando contrato nao tem versao vigente, se o use case nao validar antes.

### Definicao de pronto da Task 11.3
- [ ] PDFBox adicionado.
- [ ] CCB gerada em PDF pesquisavel.
- [ ] Teste valida conteudo minimo.
- [ ] Limitacoes juridicas/dados ausentes documentadas para Task 11.10.

---

## Task 11.4 - AssinaturaDigitalProvider Fake + Real

**Objetivo**: isolar integracao externa de assinatura digital via Provider Pattern.

**Pre-requisitos**: Tasks 11.1 e 11.2 concluidas.

**Esforco**: 1-2 dias.

**Arquivos principais**:
- `contratos/application/port/out/AssinaturaDigitalProvider.java`
- `contratos/application/port/out/dto/RequisicaoEnvioAssinatura.java`
- `contratos/application/port/out/dto/RespostaEnvioAssinatura.java`
- `contratos/application/port/out/dto/StatusEnvelopeProvider.java`
- `contratos/infrastructure/adapter/assinatura/FakeAssinaturaDigitalProvider.java`
- `contratos/infrastructure/adapter/assinatura/<Provedor>AssinaturaDigitalProvider.java`
- `contratos/infrastructure/adapter/assinatura/<Provedor>HttpClient.java`
- `contratos/infrastructure/config/AssinaturaResilienceConfig.java`

### Step 011.4.1 - Definir port de assinatura

**Contrato minimo**:
```java
public interface AssinaturaDigitalProvider {
  RespostaEnvioAssinatura enviarParaAssinatura(byte[] pdf, RequisicaoEnvioAssinatura req, String correlationId);
  byte[] baixarDocumentoAssinado(String idEnvelopeExterno);
  StatusEnvelopeProvider consultarStatus(String idEnvelopeExterno);
}
```

**Regras**:
- DTOs do port devem falar linguagem do dominio, nao DTO bruto do provider.
- `idEnvelopeExterno` deve ser obrigatorio na resposta de envio.
- `Idempotency-Key` deve ser carregado no request ou aplicado no adapter.

### Step 011.4.2 - Implementar fake provider

**Regras**:
- Ativo por property/profile local/test.
- Retorna `idEnvelopeExterno` deterministico o suficiente para testes.
- Permite simular status `ENVIADO`, `VISUALIZADO`, `ASSINADO` e `RECUSADO`.
- Nao usa rede.

### Step 011.4.3 - Implementar adapter real do provider escolhido

**Regras**:
- Usar `RestClient` via padrao existente.
- Usar Resilience4j para retry/circuit breaker/timeout.
- Headers obrigatorios: Authorization, Idempotency-Key e correlation id.
- Traduzir erros 4xx/5xx para excecoes de dominio/aplicacao adequadas.
- Nao vazar DTOs do provider para domain/application.

### Step 011.4.4 - Criar WireMock IT

**Teste obrigatorio**:
- `<Provedor>AssinaturaDigitalProviderIT`.

**Cenarios**:
- Envio com sucesso envia headers corretos.
- Download de PDF assinado retorna bytes.
- Status externo e mapeado para `StatusEnvelope` interno.
- Erro 5xx aciona politica configurada de retry/circuit breaker quando aplicavel.

### Definicao de pronto da Task 11.4
- [ ] Port definido.
- [ ] Fake provider funcional.
- [ ] Adapter real encapsulado.
- [ ] WireMock IT cobrindo wiring HTTP.
- [ ] Configuracoes documentadas em `application.yml`.

---

## Task 11.5 - Use cases de envio e callback

**Objetivo**: orquestrar CCB, provider, envelope, documento assinado e transicoes do contrato.

**Pre-requisitos**: Tasks 11.3 e 11.4 concluidas.

**Esforco**: 1-2 dias.

**Arquivos principais**:
- `contratos/application/usecase/EnviarParaAssinaturaUseCase.java`
- `contratos/application/usecase/ProcessarCallbackAssinaturaUseCase.java`
- `contratos/application/usecase/BaixarDocumentoAssinadoUseCase.java`
- `contratos/application/usecase/ConsultarStatusAssinaturaUseCase.java`
- `contratos/application/listener/ContratoAceitoListener.java`
- `contratos/domain/event/ContratoAssinadoEvent.java`

### Step 011.5.1 - Implementar envio para assinatura

**Regras**:
- Entrada: `contratoId`.
- Contrato deve estar `ACEITO`.
- Usar versao vigente aceita.
- Gerar CCB PDF.
- Calcular hash do PDF gerado.
- Enviar ao provider com idempotency key baseada em `contratoId + numeroVersao`.
- Criar `EnvelopeAssinatura` em `ENVIADO`.
- Transicionar contrato para `EM_ASSINATURA`.
- Publicar eventos para auditoria `CCB_GERADA` e `ASSINATURA_ENVIADA`.
- Reenvio idempotente deve devolver envelope existente, sem criar novo envelope.

### Step 011.5.2 - Implementar listener de aceite

**Regras**:
- Escutar `ContratoAceitoEvent` com `AFTER_COMMIT`.
- Usar `REQUIRES_NEW`, seguindo padrao dos listeners de auditoria/contratos.
- Falha de envio nao deve desfazer o aceite ja commitado; deve ser logada e ficar como pendencia operacional.

### Step 011.5.3 - Implementar processamento de callback

**Regras**:
- Localizar envelope por `provider + idEnvelopeExterno` com lock pessimista.
- Rejeitar/ignorar evento duplicado por `idEventoExterno`.
- Gravar `EventoAssinatura` sanitizado.
- `VISUALIZADO`: atualizar envelope e auditar.
- `ASSINADO`: baixar PDF assinado, calcular hash, criar `DocumentoAssinado`, marcar envelope `ASSINADO`, marcar contrato `ASSINADO`, publicar `ContratoAssinadoEvent`.
- `RECUSADO`: marcar envelope `RECUSADO`, marcar contrato `RECUSADO`, auditar.
- `EXPIRADO`: marcar envelope `EXPIRADO`; comportamento do contrato deve ser definido no ADR/spec ou registrado como pendencia se nao houver regra.

### Step 011.5.4 - Implementar consulta de status

**Regras**:
- Retornar status local do envelope.
- Opcionalmente consultar provider real apenas se isso estiver previsto no ADR; caso contrario, webhook e fonte de verdade operacional.

### Step 011.5.5 - Implementar download do documento assinado

**Regras**:
- Disponivel apenas quando contrato estiver `ASSINADO` e documento existir.
- Retornar bytes do PDF assinado e metadados minimos.
- Publicar `DOCUMENTO_ASSINADO_BAIXADO` com usuario e IP.

### Definicao de pronto da Task 11.5
- [ ] Envio idempotente implementado.
- [ ] Listener automatico implementado.
- [ ] Callback processa visualizacao, assinatura e recusa.
- [ ] Documento assinado armazenado com hash.
- [ ] Eventos de dominio publicados para auditoria e Sprint 12.
- [ ] Unit tests dos use cases principais passando.

---

## Task 11.6 - Webhook de assinatura

**Objetivo**: receber eventos do provider de assinatura com HMAC, idempotencia e outbox.

**Pre-requisitos**: Tasks 11.4 e 11.5 concluidas.

**Esforco**: 0,5-1 dia.

**Arquivos principais**:
- `contratos/web/controller/AssinaturaWebhookController.java`
- `contratos/web/dto/AssinaturaCallback<Provedor>.java`
- `contratos/infrastructure/adapter/assinatura/<Provedor>WebhookValidator.java`, se o validador generico nao atender.

### Step 011.6.1 - Definir endpoint de webhook

**Endpoint**:
```text
POST /api/v1/webhooks/assinatura/{provider}
```

**Headers esperados**:
- `Idempotency-Key` ou equivalente derivado do payload quando provider nao enviar header.
- Header de assinatura HMAC definido pelo ADR/provider.

### Step 011.6.2 - Validar HMAC

**Regras**:
- Usar validator generico existente se compativel.
- Se provider exigir formato proprio, criar adapter especifico no modulo `contratos`.
- Secret via property `app.assinatura.<provider>.webhook.hmac-secret` ou formato consolidado no ADR.
- HMAC invalido retorna 401.

### Step 011.6.3 - Registrar outbox/idempotencia

**Regras**:
- Reaproveitar `RegistrarWebhookEventUseCase` quando possivel.
- Evento duplicado deve retornar sucesso idempotente sem reprocessar efeito de negocio.
- Payload salvo deve ser sanitizado se houver PII desnecessaria.

### Step 011.6.4 - Traduzir callback para command

**Regras**:
- Mapear evento externo para `StatusEnvelope`.
- Extrair `idEnvelopeExterno`, `idEventoExterno`, data do evento e selo/evidencia quando existir.
- Invocar `ProcessarCallbackAssinaturaUseCase`.

### Definicao de pronto da Task 11.6
- [ ] Endpoint recebe callback por provider.
- [ ] HMAC invalido retorna 401.
- [ ] Idempotencia evita efeitos duplicados.
- [ ] Callback dispara use case de processamento.
- [ ] `AssinaturaWebhookControllerTest` cobre sucesso, duplicado e assinatura invalida.

---

## Task 11.7 - Endpoints REST e DTOs

**Objetivo**: expor operacoes de assinatura e documento assinado no modulo `contratos`.

**Pre-requisito**: Task 11.6 concluida.

**Esforco**: 0,5-1 dia.

**Arquivos principais**:
- `contratos/web/controller/ContratoController.java`
- `contratos/web/dto/EnviarAssinaturaRequest.java`
- `contratos/web/dto/StatusAssinaturaResponse.java`
- `contratos/web/dto/DocumentoAssinadoMetadataResponse.java`

### Step 011.7.1 - Adicionar envio manual para assinatura

**Endpoint**:
```text
POST /api/v1/contratos/{id}/assinar
```

**Autorizacao**:
- `ROLE_FINANCEIRO` ou `ROLE_ADMIN`, conforme padrao de operacao interna.
- `@RequireStepUp` obrigatorio.

**Regras**:
- Idempotente.
- Retorna status/envelope atual.
- Nao substitui listener automatico; serve para reprocessamento operacional.

### Step 011.7.2 - Adicionar consulta de status

**Endpoint**:
```text
GET /api/v1/contratos/{id}/assinatura/status
```

**Autorizacao**:
- Tomador dono do contrato.
- `ROLE_FINANCEIRO` ou `ROLE_ADMIN`.

### Step 011.7.3 - Adicionar download do PDF assinado

**Endpoint**:
```text
GET /api/v1/contratos/{id}/documento-assinado
```

**Autorizacao**:
- Tomador dono do contrato.
- `ROLE_FINANCEIRO` ou `ROLE_ADMIN`.

**Resposta**:
- `application/pdf`.
- Headers `Content-Disposition` e, se util, `X-Document-Hash-Sha256`.

### Step 011.7.4 - Completar OpenAPI

**Regras**:
- Documentar 200/202, 400, 401, 403, 404, 409 e 422 quando aplicavel.
- Nao expor payload bruto do provider.

### Definicao de pronto da Task 11.7
- [ ] 3 endpoints expostos.
- [ ] Autorizacao e ownership coerentes com Sprint 10.
- [ ] Download retorna PDF com content type correto.
- [ ] OpenAPI completa.
- [ ] Controller tests cobrindo permissoes principais.

---

## Task 11.8 - Auditoria reforcada

**Objetivo**: registrar trilha auditavel do ciclo CCB + assinatura digital.

**Pre-requisito**: Tasks 11.5 e 11.6 concluidas.

**Esforco**: 0,5-1 dia.

**Arquivos principais**:
- `shared/audit/TipoEventoSeguranca.java`
- `contratos/application/listener/ContratoAuditListener.java`
- `src/main/resources/db/migration/V<n>__ampliar_audit_seguranca_tipo_assinatura.sql`

### Step 011.8.1 - Ampliar tipos de auditoria

**Tipos novos**:
```text
CCB_GERADA
ASSINATURA_ENVIADA
ASSINATURA_VISUALIZADA
ASSINATURA_ASSINADA
ASSINATURA_RECUSADA
DOCUMENTO_ASSINADO_BAIXADO
```

### Step 011.8.2 - Atualizar migration do check constraint

**Regras**:
- Preservar todos os valores anteriores.
- Adicionar apenas os novos tipos.
- Migration deve ser forward-only.

### Step 011.8.3 - Atualizar `ContratoAuditListener`

**Payload permitido**:
- IDs tecnicos: contrato, proposta, envelope, documento, versao.
- Provider e id externo do envelope.
- Hash SHA-256 do PDF gerado/assinado.
- Timestamp do provider.
- Usuario/IP no download.

**Dados proibidos**:
- PDF completo.
- Conteudo integral da CCB/contrato.
- Payload bruto do provider se contiver PII.
- Dados cadastrais completos desnecessarios.

### Step 011.8.4 - Testar auditoria

**Cenarios**:
- CCB gerada.
- Assinatura enviada.
- Assinatura visualizada.
- Assinatura assinada com hash.
- Assinatura recusada.
- Documento baixado com usuario/IP.
- Payload nao contem conteudo integral do contrato/CCB.

### Definicao de pronto da Task 11.8
- [ ] Enum e constraint atualizados.
- [ ] Listener cobre todos os novos eventos.
- [ ] Testes defensivos evitam vazamento de documento/payload sensivel.

---

## Task 11.9 - Testes E2E e WireMock

**Objetivo**: validar a jornada completa de assinatura e os cenarios de erro/idempotencia.

**Pre-requisito**: Tasks 11.1 a 11.8 concluidas.

**Esforco**: 1-2 dias.

**Arquivos principais**:
- `contratos/web/AssinaturaIT.java`
- `<Provedor>AssinaturaDigitalProviderIT.java`
- fixtures WireMock em `src/test/resources/wiremock/<provider>/`

### Step 011.9.1 - Testar fluxo feliz com fake

**Cenario**:
```text
Contrato ACEITO
  -> listener dispara envio
  -> CCB gerada
  -> envelope ENVIADO
  -> callback ASSINADO
  -> PDF assinado armazenado
  -> Contrato ASSINADO
```

**Verificacao**:
- Status final `ASSINADO`.
- Documento assinado existe com hash valido.
- Audit log contem eventos esperados.

### Step 011.9.2 - Testar provider real com WireMock

**Cenarios**:
- Envio para assinatura.
- Consulta de status.
- Download de documento assinado.
- Headers obrigatorios.
- Erro 5xx/retry, quando aplicavel.

### Step 011.9.3 - Testar callback recusado

**Cenario**:
- Callback `RECUSADO` transiciona envelope e contrato para `RECUSADO`.
- Audit log registra `ASSINATURA_RECUSADA`.

### Step 011.9.4 - Testar webhook idempotente

**Cenario**:
- Mesmo evento recebido duas vezes.
- Apenas um `EventoAssinatura` e um efeito de negocio.
- Segunda chamada retorna sucesso idempotente.

### Step 011.9.5 - Testar seguranca de download

**Cenarios**:
- Tomador dono consegue baixar.
- `FINANCEIRO`/`ADMIN` consegue baixar.
- Cliente nao dono recebe 403.
- Documento inexistente recebe 404 ou 409 conforme decisao do use case.

### Step 011.9.6 - Rodar suite consolidada

**Comandos**:
```bash
cd <sep-api-root>
./gradlew test --tests "*Assinatura*"
./gradlew test --tests "*Contrato*"
./gradlew check
```

### Definicao de pronto da Task 11.9
- [ ] Fluxo feliz E2E passa.
- [ ] WireMock do provider real passa.
- [ ] Recusa e idempotencia cobertas.
- [ ] Autorizacao do download coberta.
- [ ] `./gradlew check` verde.

---

## Task 11.10 - Documentacao, collections e fechamento

**Objetivo**: atualizar documentacao operacional e artefatos de apoio para refletir assinatura digital + CCB.

**Pre-requisito**: Task 11.9 concluida.

**Esforco**: 0,5-1 dia.

**Arquivos principais**:
- `docs-SEP/repos/sep-api/CONTRATOS.md`
- `docs-SEP/repos/sep-api/CCB.md`
- `docs-SEP/repos/sep-api/SPRINT-11-PR.md`
- `docs-SEP/docs-sep/PRD.md`, apenas apos sprint concluida/mergeada.
- Collections Postman/Insomnia, se existirem endpoints novos nelas.
- `docs-SEP/AI-ROADMAP.md`, se novos docs/caminhos precisarem ser indexados.

### Step 011.10.1 - Atualizar `CONTRATOS.md`

**Conteudo minimo**:
- Novo fluxo `ACEITO -> EM_ASSINATURA -> ASSINADO/RECUSADO`.
- Entidades `EnvelopeAssinatura`, `EventoAssinatura`, `DocumentoAssinado`.
- Provider Pattern de assinatura.
- Webhook e idempotencia.
- Endpoints REST novos.
- Auditoria reforcada.
- Retencao e dados proibidos no audit log.

### Step 011.10.2 - Criar `CCB.md`

**Conteudo minimo**:
- Estrutura da CCB gerada.
- Base legal: Lei 10.931/2004 e assinatura eletronica aplicavel.
- Dados usados e limitacoes de dados cadastrais.
- Hash, storage, selo/evidencia e retencao.
- Pontos que exigem revisao juridica.

### Step 011.10.3 - Atualizar collections

**Requests minimos**:
- Enviar contrato para assinatura.
- Consultar status de assinatura.
- Baixar documento assinado.
- Webhook de assinatura com HMAC valido.
- Webhook com HMAC invalido.

### Step 011.10.4 - Criar descricao de PR

**Arquivo sugerido**:
- `docs-SEP/repos/sep-api/SPRINT-11-PR.md`

**Conteudo**:
- Titulo sugerido.
- Resumo.
- Escopo tecnico.
- Como validar.
- Riscos/breaking changes.
- Referencias ao spec e steps.

### Step 011.10.5 - Revisar roadmap e PRD

**Regras**:
- Atualizar `AI-ROADMAP.md` se `CCB.md`, ADR nova ou collections novas precisarem de link explicito.
- Atualizar PRD marcando Sprint 11 como executada somente apos implementacao validada/mergeada, seguindo padrao das sprints anteriores.

### Definicao de pronto da Task 11.10
- [ ] `CONTRATOS.md` atualizado.
- [ ] `CCB.md` criado e marcado para revisao juridica.
- [ ] Collections atualizadas quando aplicavel.
- [ ] `SPRINT-11-PR.md` criado.
- [ ] `AI-ROADMAP.md` revisado/atualizado se necessario.
- [ ] PRD atualizado somente no fechamento real da sprint.

---

## Checklist final da Sprint 11

- [ ] ADR do provider de assinatura digital aceita com numeracao livre.
- [ ] Migrations de assinatura e audit log aplicam em banco limpo.
- [ ] CCB PDF gerada com conteudo minimo esperado.
- [ ] Provider fake e adapter real implementados via Provider Pattern.
- [ ] WireMock cobre adapter real.
- [ ] Listener automatico envia contrato aceito para assinatura.
- [ ] Webhook valida HMAC e e idempotente.
- [ ] Contrato transiciona `ACEITO -> EM_ASSINATURA -> ASSINADO`.
- [ ] Recusa transiciona para `RECUSADO`.
- [ ] PDF assinado e armazenado com hash SHA-256.
- [ ] Download respeita ownership/roles e audita acesso.
- [ ] Audit log nao vaza PDF, CCB completa, contrato completo ou payload bruto sensivel.
- [ ] `./gradlew check` verde.
- [ ] Documentacao operacional e PR description prontas.

## Checkpoint obrigatorio antes de commit

Antes de qualquer staging/commit no `sep-api`, parar e apresentar ao usuario:

```bash
cd <sep-api-root>
git status --short --branch
git diff --stat
git ls-files --others --exclude-standard
./gradlew test --tests "*Assinatura*"
./gradlew test --tests "*Contrato*"
./gradlew check
```

O checkpoint deve listar:
- arquivos criados/modificados/removidos;
- testes/build executados e resultado;
- riscos e pendencias;
- sugestao de mensagem Conventional Commit.

Aguardar aprovacao explicita do usuario antes de `git add` e `git commit`.
