# PR — Sprint 10 (Formalizacao — geracao + aceite)

Artefato exigido pela Task 10.9 (steps `010-sprint-10-steps.md`). Conteudo abaixo
deve ser usado ao abrir o PR manualmente (`gh pr create --base develop ...` ou via UI).

## Titulo sugerido

```
feat(contratos): Sprint 10 — Formalizacao contratual (geracao + aceite + cancelamento + audit)
```

## Resumo

- Inicia a formalizacao contratual (Epic 7 parte 1): cria o modulo `contratos` em
  DDD + Hexagonal e materializa o fluxo `PropostaCredito APROVADA -> contrato gerado
  -> aceite do tomador` ate o estado `ACEITO`. Assinatura digital, CCB
  juridicamente completa e desembolso ficam para a Sprint 11+.
- Provider Pattern adaptado (ADR 0004): port `TemplateContratoEngine` em
  `application.port.out` + adapter `ThymeleafTemplateContratoEngine` (Thymeleaf
  standalone, sem starter — evita view resolver MVC).
- Idempotencia por `parecerOrigemId` no `VersaoContrato` (V21) — replay do
  `PropostaAprovadaEvent` faz short-circuit sem nova versao/render/save/evento.
- 5 endpoints REST + 4 eventos de dominio + 4 tipos novos de audit + 3 migrations
  Flyway (V20/V21/V22) + 16 commits squashaveis.

## Escopo tecnico

### Dominio + persistencia

- `Contrato` agregado raiz (`extends EntidadeAuditavel`), 1:1 com proposta.
- `VersaoContrato` imutavel com `parecerOrigemId` opcional (V21 idempotencia).
- `ClausulaContratual` (ordem unica por versao).
- `AceiteContrato` 1:1 com versao via UNIQUE (`ipOrigem` truncado em 45, `userAgent`
  em 500 pela entidade).
- `StatusFormalizacao` (GERADO/AGUARDANDO_ACEITE/ACEITO/EM_ASSINATURA/ASSINADO/
  CANCELADO) com helpers `permiteNovaVersao`/`permiteAceite`/`permiteCancelamento`/
  `isFinal`. `EM_ASSINATURA`/`ASSINADO` reservados pra Sprint 11.
- `TipoContrato` (MUTUO/CCB/OUTROS) — OUTROS lanca `TipoContratoSemTemplateException`
  (422 CTR-422-002).

3 migrations:

- `V20__criar_tabelas_contratos.sql` — 4 tabelas + 6 indices + 4 checks (incluindo
  `chk_versao_hash_hex` regex `^[a-f0-9]{64}$`) + FKs sem CASCADE.
- `V21__adicionar_parecer_origem_versao_contrato.sql` — `versao_contrato.parecer_
  origem_id UUID NULL` + index parcial.
- `V22__ampliar_audit_seguranca_tipo_contratos.sql` — DROP+RECREATE de
  `chk_audit_seguranca_tipo` com 4 valores `CONTRATO_*`.

### Template engine (Thymeleaf standalone)

- Port `TemplateContratoEngine` com DTOs `TemplateContratoRequest` (valida 8 vars
  obrigatorias no construtor), `TemplateContratoResponse`, `ClausulaRenderizada`.
- `TemplateContratoException` extends `OperacaoNaoProcessavelException` (422
  CTR-422-001).
- `ThymeleafTemplateContratoEngine` (`TemplateMode.TEXT`,
  `ClassLoaderTemplateResolver`, cache habilitado); rejeita clausulas vazias e
  template inexistente.
- `ContextoContratoBuilder` monta variaveis (`propostaId`, `tomadorId`,
  `tipoOperacao`, `valorSolicitado` formatado pt-BR, `prazoMeses`, `dataGeracao`,
  `clausulasPadrao` carregado do classpath). **NAO inventa dados cadastrais** —
  usa UUIDs como placeholder enquanto modulo `onboarding` nao expor nome/endereco/
  doc.
- `ClausulaContratoParser` extrai via regex `^CLAUSULA N - TITULO` (MULTILINE).
- Templates: `mutuo.txt` (Sprint 10), `ccb.txt` (esqueleto Sprint 11), `clausulas-
  padrao.txt` (6 clausulas).

### Use cases

- `GerarContratoUseCase` (`@Transactional`): consome `ConsultarPropostaUseCase` do
  modulo `credito` (porta application, sem cross-import com infrastructure), valida
  APROVADA (senao 422), short-circuit idempotente por `parecerOrigemId`, renderiza
  template (fail-fast antes de validar estado do contrato), calcula hash, persiste
  e publica `ContratoGeradoEvent` ou `ContratoNovaVersaoEvent`.
- `RegistrarAceiteUseCase` (`@Transactional`): `findByIdForUpdate` (PESSIMISTIC_
  WRITE) serializa aceite vs cancelamento concorrentes. Valida ownership (403),
  estado (409) e race no save com `catch DataIntegrityViolationException ->
  ConflitoException` (CTR-409-002). Ordem: persist aceite -> marcar contrato ACEITO
  -> publish event.
- `CancelarContratoUseCase` (`@Transactional`): mesma estrategia de lock. Permite
  apenas em GERADO/AGUARDANDO_ACEITE; justificativa 10-500 chars validada pelo
  record com `ValidacaoException` (CTR-400-001).
- `ConsultarContratoUseCase` (`@Transactional(readOnly=true)`): `porId`/
  `porPropostaId`/`listarVersoes`/`buscarAceiteDaVersaoVigente`. `inicializarLazy`
  toca `versoes` + `clausulas` dentro da tx — endpoints nao dependem de Open
  Session in View.
- `HashContratoService`: SHA-256 hex lowercase (64 chars).

### Listeners

- `PropostaAprovadaListener` (`@TransactionalEventListener(AFTER_COMMIT)` +
  `@Transactional(REQUIRES_NEW)`): escuta evento do modulo `credito`, passa
  `event.parecerId()` como `parecerOrigemId`. Try cobre tudo (inclusive
  construcao do command e guard `event/propostaId null`); falhas apenas logadas.
- `ContratoAuditListener`: 4 handlers `AFTER_COMMIT + REQUIRES_NEW` (mesmo padrao
  Sprints 7/8/9). Conteudo integral do contrato NUNCA entra no audit (teste
  defensivo). Fallback minimo `{"contratoId":"...","erroSerializacao":true}` em
  caso de `JsonProcessingException`.

### Web

- `ContratoController` com 5 endpoints `@PreAuthorize` + `@RequireStepUp`:
  - `GET /api/v1/contratos/{id}` (ownership ou FINANCEIRO/ADMIN);
  - `GET /api/v1/contratos/proposta/{propostaId}` (idem);
  - `GET /api/v1/contratos/{id}/versoes` (idem);
  - `PATCH /api/v1/contratos/{id}/aceite` (CLIENTE dono + step-up);
  - `POST /api/v1/contratos/{id}/cancelar` (FINANCEIRO/ADMIN + step-up).
- DTOs `record` com `@Schema`: `ContratoResponse`, `VersaoContratoResponse`,
  `ClausulaContratoResponse`, `AceiteContratoResponse`, `RegistrarAceiteRequest`
  (vazio, reservado pra evolucao), `CancelarContratoRequest` (`@NotBlank
  @Size(10,500)`).
- `ContratoWebMapper` MapStruct (`componentModel=spring`) com default methods
  para transformacoes nao-triviais (`versaoVigente`, listar clausulas).
- `extrairIp` usa `request.getRemoteAddr()` — `X-Forwarded-For` so quando reverse
  proxy AWS confiavel entrar (Epic 16).

### Excecoes do modulo

- `ContratoNaoEncontradoException` (CTR-404-001, extends
  `RecursoNaoEncontradoException`).
- `ContratoEstadoInvalidoException` (CTR-409-001, extends `ConflitoException`).
- `ContratoOwnershipException` (CTR-403-001, extends `AcessoNegadoException`).
- `PropostaNaoAprovadaException` (CTR-422-003, extends
  `OperacaoNaoProcessavelException`).
- `TipoContratoSemTemplateException` (CTR-422-002, extends
  `OperacaoNaoProcessavelException`).
- `TemplateContratoException` (CTR-422-001).
- `ValidacaoException` (CTR-400-001) — para justificativa invalida.

### Auditoria (4 tipos novos)

- `CONTRATO_GERADO`
- `CONTRATO_NOVA_VERSAO`
- `CONTRATO_ACEITO` (grava ip + user-agent nas colunas dedicadas)
- `CONTRATO_CANCELADO` (justificativa truncada em 200 chars)

### CONTRATO_* dados PROIBIDOS no audit log

- Conteudo integral do contrato.
- Clausulas completas.
- Dados cadastrais alem dos identificadores.

## Endpoints novos

| Metodo  | Path                                         | Auth                          |
| ------- | -------------------------------------------- | ----------------------------- |
| `GET`   | `/api/v1/contratos/{id}`                     | ownership ou FINANCEIRO/ADMIN |
| `GET`   | `/api/v1/contratos/proposta/{propostaId}`    | ownership ou FINANCEIRO/ADMIN |
| `GET`   | `/api/v1/contratos/{id}/versoes`             | ownership ou FINANCEIRO/ADMIN |
| `PATCH` | `/api/v1/contratos/{id}/aceite`              | CLIENTE dono + step-up        |
| `POST`  | `/api/v1/contratos/{id}/cancelar`            | FINANCEIRO/ADMIN + step-up    |

## Como validar

```bash
cd <sep-api-root>
docker compose up -d sep-postgres
createdb -h localhost -U sep sep_test  # se ainda nao criado

./gradlew test --tests "*Contrato*"   # unit + IT
./gradlew check                        # suite completa + JaCoCo 70% + Spotless
./gradlew bootRun                      # smoke manual via Swagger/Postman
```

Cenarios cobertos no `ContratoIT` (11 testes E2E em `sep_test`):

- Fluxo feliz: proposta APROVADA -> contrato gerado -> aceite com step-up -> ACEITO
  + audit `CONTRATO_GERADO` + `CONTRATO_ACEITO`.
- Tomador alheio aceita -> 403.
- Financeiro cancela em AGUARDANDO_ACEITE -> CANCELADO + audit.
- Financeiro tenta cancelar ACEITO -> 409.
- Listar versoes -> 1 elemento.
- Consulta por proposta FINANCEIRO -> 200; cliente alheio -> 403.
- Cancelamento como cliente -> 403.
- Justificativa curta -> 400.
- Regeneracao em AGUARDANDO_ACEITE -> v2 + audit `CONTRATO_NOVA_VERSAO`.
- Geracao com proposta nao aprovada (PRE_APROVADA) -> `PropostaNaoAprovadaException`
  (422).

## Riscos / breaking changes

- **Nenhum breaking change** em API publica — apenas adicoes.
- `CreditoIT` e `OpenFinanceIT` ganharam `contratoRepository.deleteAll()` no
  `limpar()` porque o `PropostaAprovadaListener` agora gera contrato automatico
  quando esses ITs aprovam proposta; FK sem CASCADE bloqueava o cleanup.
- Migrations `V20`/`V21`/`V22` aditivas — preservam dados anteriores.
- `Contrato.adicionarVersao` ganhou overload com `parecerOrigemId` (3 args); a
  versao sem parecer (2 args) continua funcionando.

## Pendencias / TODO sprints futuras

- **Sprint 11** — assinatura digital + CCB juridicamente completa + transicoes
  EM_ASSINATURA/ASSINADO; ADR 0013 (provedor de assinatura digital) precede.
- **Sprint 11 ou Hardening identity** — `@RequireStepUpEstrita` (sem bypass
  quando `mfaHabilitado=false`). Mitigacao operacional ate la: todo usuario com
  role CLIENTE/FINANCEIRO/ADMIN em producao DEVE ter MFA habilitado antes de
  liberar formalizacao.
- **Sprint 11+** — preencher template com dados cadastrais reais do modulo
  `onboarding` (nome, endereco, documento) em vez de placeholders UUID.
- **Sprint backoffice/notificacoes** — `PropostaAprovadaListener` engole excecoes
  apenas logando; gerar pendencia operacional pra retry manual.
- **Sprint 12 (Cobranca)** — calculo financeiro real (juros, IOF, CET, agenda).
- **Sprint web/mobile (pos contratos da API estabilizar)** — UI de formalizacao.

## Referencias

- Spec: [`specs/fase-2/010-sprint-10-formalizacao-geracao-contrato.md`](../../specs/fase-2/010-sprint-10-formalizacao-geracao-contrato.md)
- Steps: [`steps-fase-2/backend/010-sprint-10-steps.md`](../../steps-fase-2/backend/010-sprint-10-steps.md)
- Docs: [`CONTRATOS.md`](./CONTRATOS.md), [`CREDITO.md`](./CREDITO.md) (link cruzado em §Eventos)
- ADRs: 0001 (monolito modular DDD), 0004 (Provider Pattern), 0006 (MapStruct),
  0007 (Hexagonal), 0012 (motor regras de credito)
- Resolucao CMN 4.656/2018 — Art. 11 (formalizacao); LGPD (retencao + minimizacao
  no audit log)
