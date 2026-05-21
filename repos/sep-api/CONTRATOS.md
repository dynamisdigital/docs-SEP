# CONTRATOS - sep-api

Documento operacional do modulo `contratos` (Sprint 10 — Epic 7 parte 1, executada 2026-05-20).

> Spec: [`specs/fase-2/010-sprint-10-formalizacao-geracao-contrato.md`](../../specs/fase-2/010-sprint-10-formalizacao-geracao-contrato.md).
> Steps: [`steps-fase-2/backend/010-sprint-10-steps.md`](../../steps-fase-2/backend/010-sprint-10-steps.md).
> PR: [`SPRINT-10-PR.md`](./SPRINT-10-PR.md).

## Objetivo

Formalizar a proposta de credito aprovada por contrato textual versionado, com hash SHA-256 de integridade, aceite explicito do tomador (com evidencia tecnica) e auditoria reforcada. A Sprint 10 entrega ate o estado `ACEITO`; assinatura digital, CCB juridicamente completa e desembolso ficam para a Sprint 11+.

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

PATCH /api/v1/contratos/{id}/aceite                           # CLIENTE dono + @RequireStepUp
  -> RegistrarAceiteUseCase (@Transactional)
     - findByIdForUpdate (PESSIMISTIC_WRITE)                   # serializa aceite vs cancelamento
     - valida ownership -> ContratoOwnershipException 403
     - valida AGUARDANDO_ACEITE -> ContratoEstadoInvalidoException 409
     - aceiteRepository.save + flush -> race detectada vira ConflitoException 409
     - contrato.marcarAceito -> ACEITO
     - publish ContratoAceitoEvent (hash + ip + user-agent)

POST /api/v1/contratos/{id}/cancelar                          # FINANCEIRO/ADMIN + @RequireStepUp
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
| `ACEITO`            | Tomador aceitou com step-up + evidencia tecnica. Estado final na Sprint 10.|
| `EM_ASSINATURA`     | **Reservado Sprint 11** — provedor de assinatura digital integrado.        |
| `ASSINADO`          | **Reservado Sprint 11** — pre-condicao futura para desembolso (Pix).        |
| `CANCELADO`         | Cancelamento pre-aceite por financeiro/admin. Estado final.                |

Transicoes permitidas hoje:

```text
GERADO            -> AGUARDANDO_ACEITE | CANCELADO
AGUARDANDO_ACEITE -> AGUARDANDO_ACEITE (regeneracao) | ACEITO | CANCELADO
ACEITO            -> EM_ASSINATURA (Sprint 11)
EM_ASSINATURA     -> ASSINADO (Sprint 11)
ASSINADO / CANCELADO = finais
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

## Endpoints REST

| Metodo  | Path                                              | Auth                              | OpenAPI Tag |
| ------- | ------------------------------------------------- | --------------------------------- | ----------- |
| `GET`   | `/api/v1/contratos/{id}`                          | ownership ou FINANCEIRO/ADMIN     | `contratos` |
| `GET`   | `/api/v1/contratos/proposta/{propostaId}`         | ownership ou FINANCEIRO/ADMIN     | `contratos` |
| `GET`   | `/api/v1/contratos/{id}/versoes`                  | ownership ou FINANCEIRO/ADMIN     | `contratos` |
| `PATCH` | `/api/v1/contratos/{id}/aceite`                   | CLIENTE dono + step-up            | `contratos` |
| `POST`  | `/api/v1/contratos/{id}/cancelar`                 | FINANCEIRO/ADMIN + step-up        | `contratos` |

DTOs (records imutaveis com `@Schema`):

- `ContratoResponse` (id, propostaId, tomadorId, tipo, status, versaoVigente, aceite, dataCriacao, dataModificacao)
- `VersaoContratoResponse` (id, numero, conteudoTexto, hashSha256, dataGeracao, parecerOrigemId, clausulas)
- `ClausulaContratoResponse` (id, ordem, titulo, texto)
- `AceiteContratoResponse` (id, versaoId, tomadorId, dataAceite, ipOrigem, userAgentOrigem)
- `RegistrarAceiteRequest` (corpo vazio — reservado para evolucao)
- `CancelarContratoRequest` (`justificativa` `@NotBlank @Size(min=10, max=500)`)

### Step-up — limitacao conhecida

`StepUpEnforcementAspect` (Sprint 5 Task 5.6) libera operacoes `@RequireStepUp` quando o usuario tem `mfaHabilitado=false`. Como aceite/cancelamento sao operacoes legais, esse bypass enfraquece a garantia.

**Mitigacao operacional:** em producao, todo usuario com role `CLIENTE`, `FINANCEIRO` ou `ADMIN` DEVE ter MFA habilitado antes de liberar formalizacao.

**Fix arquitetural** via `@RequireStepUpEstrita` (sem bypass) fica em sprint futura de hardening do modulo `identity`.

## Auditoria reforcada

Tipos em `audit_log_seguranca` (V22):

| Tipo                    | Detalhes (JSONB)                                                                         | Coluna ip + user-agent |
| ----------------------- | ---------------------------------------------------------------------------------------- | ---------------------- |
| `CONTRATO_GERADO`       | contratoId, propostaId, versaoId, numeroVersao, hashSha256                               | nao                    |
| `CONTRATO_NOVA_VERSAO`  | contratoId, propostaId, versaoId, numeroVersao, hashSha256                               | nao                    |
| `CONTRATO_ACEITO`       | contratoId, propostaId, versaoId, numeroVersao, hashSha256                               | **sim**                |
| `CONTRATO_CANCELADO`    | contratoId, propostaId, tomadorId, justificativa (truncada em 200)                       | nao                    |

`ContratoAuditListener` usa `@TransactionalEventListener(AFTER_COMMIT)` + `@Transactional(REQUIRES_NEW)` (mesmo padrao Sprints 7/8/9). Falha de serializacao JSON cai em fallback minimo `{"contratoId":"...","erroSerializacao":true}` — preserva rastreabilidade sem mascarar como payload vazio.

### Dados proibidos no audit log

- Conteudo integral do contrato.
- Clausulas completas.
- Dados cadastrais alem dos identificadores.
- Payload bruto de qualquer outra entidade do modulo.

Teste defensivo em `ContratoAuditListenerTest.aoAceitar_conteudoIntegralDoContratoNaoVazaParaAudit` valida que `conteudoTexto` e `clausulas` nunca aparecem no payload.

## Retencao

Contratos, versoes, clausulas, aceites e audit log relacionado sao documentos legais. **Retencao minima de 10 anos** (CMN 4.656/2018 Art. 11 + LGPD compatibilidade). Exclusao fisica nao deve ser usada como mecanismo operacional nesta fase. FKs sem CASCADE protegem contra remocao indevida de proposta/usuario.

## Concorrencia e idempotencia

- **Race aceite vs cancelamento**: `findByIdForUpdate` (PESSIMISTIC_WRITE) no Contrato serializa as duas operacoes — segunda thread espera o commit da primeira, le estado atualizado e falha na validacao (`permiteAceite`/`permiteCancelamento`).
- **Race no aceite**: `aceiteRepository.save + flush()` envolto em `catch (DataIntegrityViolationException)` traduz violacao UNIQUE `versao_id` em `ConflitoException` (codigo `CTR-409-002`).
- **Replay do evento `PropostaAprovadaEvent`**: idempotencia por `parecerOrigemId` no `VersaoContrato` — versao vigente com mesmo parecer faz short-circuit no use case, sem nova versao/render/save/evento.
- **Listener falha**: `PropostaAprovadaListener` envolve TODO o metodo em try/catch (incluindo construcao do command e guard `event == null`). Falha apenas e logada — proposta ja aprovada nao pode ser revertida; pendencia operacional fica para sprint futura de backoffice.

## Limitacoes da Sprint 10

- Sem assinatura digital (Sprint 11 introduz `AssinaturaDigitalProvider`).
- Sem CCB juridicamente completa.
- Sem PDF/HTML rico (apenas texto plano).
- Sem desembolso/Pix.
- Sem calculo financeiro definitivo (parcelas, IOF, CET).
- Sem telas web/mobile (decisao 2026-05-04 — Web/Mobile da Fase 2 entram apos contratos da API estabilizarem).
- Sem renegociacao/aditivos contratuais.
- Step-up bypassa quando MFA nao habilitado (mitigacao operacional, fix em sprint de hardening).

## Validacao

```bash
cd <sep-api-root>
./gradlew test --tests "*Contrato*"
./gradlew check
```

Smoke manual (Postman/Insomnia ja contem os requests):

1. Aprovar proposta de credito (via parecer FINANCEIRO + step-up).
2. Aguardar listener AFTER_COMMIT gerar contrato (poll ate `findByPropostaId` retornar).
3. `GET /api/v1/contratos/proposta/{propostaId}` — confirma `status=AGUARDANDO_ACEITE`.
4. `PATCH /api/v1/contratos/{id}/aceite` (CLIENTE dono + `X-Step-Up-Token`) — espera 200 com `status=ACEITO`.
5. Validar hash em `versao_contrato.hash_sha256`, evidencia em `aceite_contrato` e 2 entries em `audit_log_seguranca` (`CONTRATO_GERADO` + `CONTRATO_ACEITO`).
6. Cancelar contrato pre-aceite via `POST /api/v1/contratos/{id}/cancelar` (FINANCEIRO + step-up + justificativa 10-500 chars).
