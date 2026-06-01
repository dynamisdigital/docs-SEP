# PRD - Fase 2 - Jornada de contratacao

> Extraido de `PRD.md` para reduzir o tamanho do documento principal.

## 22. Backlog Tecnico Implementavel - Fase 2

### Trilha Fase 2 (Sprints 5-14)

Esta trilha agrupa as sprints que abrem e executam a Fase 2 do produto (jornada de contratacao do emprestimo, alinhada ao marco regulatorio CMN 4.656/2018). A Sprint 5 foi executada como gate **cross-stack** de seguranca (`sep-api`, `sep-app`, `sep-mobile`) e foi concluida em 2026-05-11. As Sprints 6-14 tambem foram concluidas no backend, estabilizando onboarding PF/PJ, PLD, credito interno, Open Finance, formalizacao contratual, cobranca, inadimplencia e backoffice operacional. A Fase 2 backend foi concluida em 2026-05-26 com a Sprint 14 (`backoffice`) mergeada em `develop` via PR #63. Em 2026-05-27, a Sprint 15 de hardening/bug-hunt pos-Fase-2 foi concluida e os repos `sep-api`, `sep-app` e `sep-mobile` tiveram `develop` promovida para `main` manualmente, com conteudo equivalente entre as branches remotas. Web e Mobile de jornadas da Fase 2 entrarao em planejamento separado depois da estabilizacao dos contratos da API (decisao tomada em 2026-05-04).

Mapeamento Sprint → Epic:

| Sprint | Epic | Tema |
|--------|------|------|
| 5 | Epic 4 estendida | Endurecimento de Seguranca (gate de Fase 2) |
| 6 | Epic 5 (parte 1) | Onboarding KYC Pessoa Fisica |
| 7 | Epic 5 (parte 2) | Onboarding KYB Empresa + PLD |
| 8 | Epic 6 (parte 1) | Credito — regras internas + parecer |
| 9 | Epic 6 (parte 2) | Credito — integracao Open Finance |
| 10 | Epic 7 (parte 1) | Formalizacao — geracao de contrato |
| 11 | Epic 7 (parte 2) | Formalizacao — assinatura digital + CCB |
| 12 | Epic 8 (parte 1) | Cobranca — parcelas e agenda |
| 13 | Epic 8 (parte 2) | Cobranca — inadimplencia e recuperacao |
| 14 | Epic 9 | Backoffice operacional |

### Sprint 5

Status:
- concluida em 2026-05-11; gate de Fase 2, producao e integracao Celcoin sandbox real liberado

Objetivo de planejamento:
- endurecer a camada de autenticacao antes de qualquer ambiente de producao ou integracao real com Celcoin: MFA via TOTP (com biometria nativa no mobile), refresh token com rotacao, rate limiting, account lockout, password policy revisada, step-up authentication e audit log de seguranca

Tema:
- Endurecimento de Seguranca (gate Fase 2)

Pre-requisitos de entrada:
- Sprint 4, F-Sprint 4 e M-Sprint 4 concluidas (Sprint 5 e gate cross-stack: aplica mudancas em `sep-api`, `sep-app` e `sep-mobile`)
- ADR 0009 (Separacao de Canal) e ADR 0010 (MFA) aceitos

Dependencias externas:
- depende da conclusao da Sprint 4

Responsavel principal:
- Dev Senior (com participacao do Dev Pleno Frontend 2 e Dev Mobile para as Tasks 5.8 e 5.9)

Detalhamento das tasks:
- consultar: [`specs/fase-2/005-sprint-5-endurecimento-seguranca.md`](../specs/fase-2/005-sprint-5-endurecimento-seguranca.md)
- o PRD mantem apenas o planejamento de alto nivel desta sprint; a execucao e governada pelo spec correspondente
- referencia operacional pos-sprint: [`docs-sep/SEGURANCA.md`](./SEGURANCA.md)

### Sprint 6 (executada — 2026-05-13)

Objetivo de planejamento:
- entregar onboarding de pessoa fisica (KYC): modelar o modulo `onboarding`, criar entidades `SolicitacaoOnboarding`, `DocumentoCadastral` e `ResultadoVerificacao`, expor `KycProvider` (port) com `CelcoinKycProvider` (OCR + FaceMatch + Background Check) e `FakeKycProvider` (testes), receber callbacks Celcoin via Webhook Receiver e gravar trilha de auditoria reforcada

Tema:
- Onboarding KYC Pessoa Fisica (Epic 5 parte 1)

Pre-requisitos de entrada:
- Sprint 5 concluida (gate de seguranca)
- ADRs 0001, 0004, 0007, 0008 vigentes
- credenciais Celcoin sandbox disponiveis

Dependencias externas:
- depende da conclusao da Sprint 5

Responsavel principal:
- Dev Senior

Detalhamento das tasks:
- consultar: [`specs/fase-2/006-sprint-6-onboarding-kyc-pessoa.md`](../specs/fase-2/006-sprint-6-onboarding-kyc-pessoa.md)
- o PRD mantem apenas o planejamento de alto nivel desta sprint; a execucao e governada pelo spec correspondente

Status de execucao (concluida em 2026-05-13, PR #41 -> `develop`, PR #42 -> `main`):
- Modulo `onboarding` completo em DDD + Hexagonal: dominio (`SolicitacaoOnboarding`, `DocumentoCadastral`, `ResultadoVerificacao`, VOs `Cpf`/`TipoDocumento`/`StatusOnboarding`, 4 eventos), 4 use cases (Iniciar/EnviarDocumento/IniciarVerificacao/ConsultarStatus), controller REST `/api/v1/onboarding/pessoa`, webhook dedicado `/api/v1/webhooks/celcoin/kyc`, audit listener `@TransactionalEventListener(AFTER_COMMIT) + @Transactional(REQUIRES_NEW)`.
- Provider Pattern: port `KycProvider` + `ResultadoKycProvider` sealed (`EmAndamento`/`Finalizado` com guard de status final); `FakeKycProvider` (default `app.kyc.provider=fake`); `CelcoinKycProvider` com OAuth2 client-credentials (`CelcoinOAuthTokenProvider` com cache + refresh) + Resilience4j (instance `celcoin-kyc`, retry 3x em 5xx/IOException, circuit breaker, timeout 30s); `CelcoinKycMapper` MapStruct mapeando APPROVED/REJECTED/PENDING para `Finalizado`, PROCESSING/desconhecido para `EmAndamento` (safe default).
- Migrations V7 (3 tabelas + indice unico parcial `uq_onboarding_cpf_ativo` para CPF ativo + extensao `chk_audit_seguranca_tipo` com 6 eventos `KYC_*`), V8 reverteu CASCADE da FK via V9 (risco LGPD — producao nao deleta usuario fisicamente, isolamento de testes via `@AfterEach`).
- Idempotencia: `Idempotency-Key` deterministica `solicitacaoId:revisaoDocumentos` propagada via MDC; webhook outbox reusa `RegistrarWebhookEventUseCase` da Sprint 4; `ProcessarCallbackKycUseCase` trata callback tardio com chave diferente (mesmo status -> evento PROCESSADO sem reescrita; status divergente -> evento FALHOU sem erro 500).
- Seguranca: ADMIN tem ownership-bypass nos 4 endpoints (operacao em nome do cliente); eventos de dominio preservam dono real; HMAC `app.webhooks.secrets.celcoin-kyc` como fonte unica (campo `webhookSecret` removido de `CelcoinKycProperties`); audit listener com guard de status nao-final + `ObjectMapper` para escape JSON seguro.
- Testes: 346 verdes no total (83 novos Sprint 6) incluindo E2E `OnboardingPessoaIT` (RestAssured + Postgres local) cobrindo fluxo feliz + 8 negativos, WireMock IT `CelcoinKycProviderIT`/`CelcoinOAuthTokenProviderIT` (Bearer OAuth + retry 5xx + cache token + idempotencia preservada no MDC). `./gradlew check` verde com JaCoCo gate 70% + Spotless.
- Documentacao: `docs-SEP/repos/sep-api/ONBOARDING.md` (fluxo, smoke manual, profile `local-wiremock`), descricao consolidada do PR real, README atualizado com 4 caminhos de setup (Fake, Celcoin sandbox, local-wiremock, IT WireMock). Postman `docs-SEP/docs-sep/sep-api.postman_collection.json` ganhou pasta "Onboarding KYC PF (Sprint 6)" com 7 requests.

### Sprint 7 (executada — 2026-05-15)

Objetivo de planejamento:
- estender o modulo `onboarding` para pessoa juridica (KYB): modelar `KybEmpresa`, `ConsultaCNPJ` e `RepresentanteLegal`, expor `KybProvider` e `BackgroundCheckProvider` (consulta COAF, OFAC, INTERPOL, MTE conforme exigido pela CMN 4.656/2018) e reusar a infraestrutura de Provider e Webhook da Sprint 6

Tema:
- Onboarding KYB Empresa + PLD (Epic 5 parte 2)

Pre-requisitos de entrada:
- Sprint 6 concluida
- infraestrutura de Provider Pattern e Webhook Receiver da Sprint 6 funcional

Dependencias externas:
- depende da conclusao da Sprint 6

Responsavel principal:
- Dev Senior

Detalhamento das tasks:
- consultar: [`specs/fase-2/007-sprint-7-onboarding-kyb-empresa.md`](../specs/fase-2/007-sprint-7-onboarding-kyb-empresa.md)
- o PRD mantem apenas o planejamento de alto nivel desta sprint; a execucao e governada pelo spec correspondente

Status de execucao (concluida em 2026-05-15, PR #43 -> `develop`, merge `main` -> `develop` propagado via PR #42):
- `SolicitacaoOnboarding` generalizada para PF/PJ com factories `criarPessoa`/`criarEmpresa`, status finais consolidados `APROVADO_FINAL`/`REPROVADO_PLD`; 4 entidades novas (`KybEmpresa`, `ConsultaCNPJ`, `RepresentanteLegal`, `ConsultaPld`) + 8 VOs PJ (`Cnpj`, `AlvoPld`, `BasePld`, `SituacaoCadastral`, `SeveridadePld`, `StatusPldRepresentante`, `TipoSocietario`, `PorteEmpresa`, `TipoSolicitante`). Migrations `V10` (refactor solicitacao), `V11` (KYB+PLD sem CASCADE em `consulta_pld.solicitacao_id` — retencao LGPD 5 anos via `retencao_ate`), `V12` (tipos documento PJ), `V13` (chk_audit_seguranca_tipo += 7 valores `KYB_*`/`PLD_*`).
- 2 novos providers: `KybProvider` (sincrono — retorno carrega situacao + representantes) e `BackgroundCheckProvider` (PLD nas 4 bases obrigatorias). Fakes em dev (`FakeKybProvider.marcarCnpjComoSituacao(...)` + `FakeBackgroundCheckProvider.marcarDocumentoComoHit(...)` para testes); adapters Celcoin com OAuth isolado por `(clientId@baseUrl)` (validado por `CelcoinOAuthCrossProviderIT`) + Resilience4j (`celcoin-kyb`/`celcoin-background-check`). 5 endpoints REST PJ em `/api/v1/onboarding/empresa/...` (CPF de representante SEMPRE mascarado nas respostas; tipos PJ aceitos: `CONTRATO_SOCIAL`, `CCMEI`, `COMPROVANTE_ENDERECO`).
- Webhooks dedicados `POST /api/v1/webhooks/celcoin/kyb` e `/celcoin/pld` com HMAC obrigatorio (`APP_WEBHOOK_SECRET_CELCOIN_KYB`/`APP_WEBHOOK_SECRET_CELCOIN_PLD`) e validacao de payload PLD consolidado exigindo TODOS os alvos x 4 bases. `PldOrchestrationListener` dispara PLD automatico apos KYC/KYB `APROVADO` com `@TransactionalEventListener(AFTER_COMMIT) + @Transactional(REQUIRES_NEW)` (REQUIRES_NEW obrigatorio — `REQUIRED` se junta a tx fantasma do AFTER_COMMIT e perde saves silenciosamente). Auditoria reforcada com 7 handlers KYB/PLD novos em `OnboardingAuditListener`; detalhes sanitizados (CPF/CNPJ mascarado, motivo truncado em 200 chars com sentinel `NAO_INFORMADO`, severidade nula -> `NAO_INFORMADA`).
- Testes: `OnboardingEmpresaIT` (E2E PJ feliz com 8 consultas PLD validadas + hit em representante + KYB SUSPENSA + 409/403/401), `PldFollowupIT` (PF KYC -> PLD orquestrado com 3 cenarios), `CelcoinKybProviderIT`/`CelcoinBackgroundCheckProviderIT` (WireMock — OAuth, retry 5xx, 4 bases obrigatorias, headers), `*UseCaseTest` mockito puro com idempotencia tardia, `OnboardingAuditListenerTest` com sanitizacao, `Celcoin*WebhookControllerTest` com HMAC invalido + idempotente. `./gradlew check` verde com JaCoCo gate 70% + Spotless.
- Documentacao: `docs-SEP/repos/sep-api/ONBOARDING.md` consolidado PF + PJ + PLD (state machine ampliada, endpoints PJ, webhooks KYB/PLD, smoke PJ), `docs-SEP/repos/sep-api/PLD.md` novo (politica regulatoria — 4 bases, bloqueio em qualquer hit, retencao 5 anos LGPD, checklist juridico marcado como **PENDENTE revisao formal antes de producao**), descricao consolidada do PR real, README atualizado com env vars dos 3 providers e WireMock IT estendido. Postman `docs-SEP/docs-sep/sep-api.postman_collection.json` ganhou pasta "Onboarding KYB PJ + PLD (Sprint 7)" com 10 requests + 3 vars novas (`onboardingEmpresaId`, `kybWebhookSecret`, `pldWebhookSecret`).

### Sprint 8 (executada — 2026-05-18)

Objetivo de planejamento:
- entregar o nucleo de analise de credito interno: criar modulo `credito`, modelar `PropostaCredito`, `ParecerCredito`, `ScoreInterno` e `DecisaoCredito`, implementar motor de regras simples (heuristicas declarativas, sem ML) e esteira de aprovacao manual a ser consumida pelo backoffice na Sprint 14

Tema:
- Credito — regras internas + parecer (Epic 6 parte 1)

Pre-requisitos de entrada:
- Sprint 7 concluida
- modulo `onboarding` funcional para validar pre-requisitos cadastrais da proposta

Dependencias externas:
- depende da conclusao da Sprint 7

Responsavel principal:
- Dev Senior

Detalhamento das tasks:
- consultar: [`specs/fase-2/008-sprint-8-credito-regras-parecer.md`](../specs/fase-2/008-sprint-8-credito-regras-parecer.md)
- o PRD mantem apenas o planejamento de alto nivel desta sprint; a execucao e governada pelo spec correspondente

Status de execucao (concluida em 2026-05-18):
- Modulo `credito` criado em DDD + Hexagonal: dominio (`PropostaCredito`, `ScoreInterno`, `RegraCreditoAvaliada`, `ParecerCredito`, `DecisaoCredito`), VOs (`StatusProposta`, `TipoOperacao`, `Money`, `ResultadoRegra`, `DecisaoParecer`, `OrigemDecisao`) e migrations `V14` a `V16`.
- Motor de regras interno em Java puro (ADR 0012) com 5 regras (`onboarding aprovado`, idade minima PF, tempo minimo PJ, valor maximo e prazo maximo), thresholds em `app.credito.motor.*` e trilha persistida por score + regras avaliadas.
- Use cases de criacao, avaliacao, consulta/listagem e parecer manual. Criacao exige onboarding `APROVADO_FINAL`; cliente opera apenas suas propostas; `FINANCEIRO`/`ADMIN` consultam qualquer proposta conforme contrato; parecer manual usa lock pessimista para serializar versoes concorrentes.
- Role `FINANCEIRO` adicionada com promocao apenas por `POST /api/v1/usuarios/{id}/role` (`ADMIN + step-up`), bloqueando criacao direta por cadastro publico/admin. `ROLE_ALTERADO` auditado por listener `AFTER_COMMIT + REQUIRES_NEW`.
- 5 endpoints REST em `/api/v1/credito`: criar proposta, consultar por id, listar, registrar parecer e listar regras avaliadas. OpenAPI e testes web cobrem autorizacao, ownership, role `FINANCEIRO` e step-up.
- Auditoria reforcada em `audit_log_seguranca`: `PROPOSTA_CRIADA`, `PROPOSTA_AVALIADA_MOTOR`, `PARECER_REGISTRADO`, `PROPOSTA_APROVADA`, `PROPOSTA_REJEITADA` e `ROLE_ALTERADO`. `PROPOSTA_AVALIADA_MOTOR` e gravado de forma sincrona dentro da transacao do motor; falha de auditoria move a proposta para `PENDENCIA` pelo fallback transacional.
- Testes: unitarios de dominio, regras, use cases, repositories, listeners, controller e `CreditoIT` com banco `sep_test`, cobrindo fluxo feliz proposta -> motor -> parecer -> auditoria, negativos de onboarding/ownership/step-up/role e rejeicao manual. `./gradlew check` verde com JaCoCo e Spotless.
- Documentacao: `docs-SEP/repos/sep-api/CREDITO.md`, ADR 0012, descricao consolidada do PR real, Postman e Insomnia com endpoints de credito + promocao de role.

### Sprint 9 (executada — 2026-05-19)

Objetivo de planejamento:
- enriquecer a analise de credito com dados de Open Finance: expor `OpenFinanceProvider` com `CelcoinOpenFinanceProvider` (via Finansystech), consumir movimentacao bancaria do tomador para enriquecer o `ScoreInterno` e processar respostas assincronas via Webhook

Tema:
- Credito — integracao Open Finance (Epic 6 parte 2)

Pre-requisitos de entrada:
- Sprint 8 concluida
- credenciais Finansystech/Celcoin Open Finance sandbox disponiveis

Dependencias externas:
- depende da conclusao da Sprint 8

Responsavel principal:
- Dev Senior

Detalhamento das tasks:
- consultar: [`specs/fase-2/009-sprint-9-credito-open-finance.md`](../specs/fase-2/009-sprint-9-credito-open-finance.md)
- o PRD mantem apenas o planejamento de alto nivel desta sprint; a execucao e governada pelo spec correspondente

Status de execucao (concluida em 2026-05-19, PR #51 -> `develop`, squash `faec439`):
- Dominio Open Finance no modulo `credito`: `ConsentimentoOpenFinance` (factories `iniciarLocal` + `vincularExterno` — pattern anti-orphan 2-fase: save local PENDENTE antes da chamada ao provider), `MovimentacaoOpenFinance` (snapshot consolidado JSONB 1:1 por consentimento) e `StatusConsentimento` (`PENDENTE`/`AUTORIZADO`/`NEGADO`/`EXPIRADO`) com transicoes unidirecionais. Migrations `V17` (tabelas + unique parcial `WHERE status='PENDENTE'` + FKs sem CASCADE), `V18` (UNIQUE `consentimento_id` em movimentacao) e `V19` (`chk_audit_seguranca_tipo` += 5 valores `OPEN_FINANCE_*`).
- `OpenFinanceProvider` (porta) com `FakeOpenFinanceProvider` (default `app.open-finance.provider=fake`; idExterno UUID v6 por chamada preserva historico NEGADO/EXPIRADO no unique parcial) e `CelcoinOpenFinanceProvider` (adapter HTTP) + `CelcoinOpenFinanceOAuthTokenProvider` proprio do modulo `credito` (sem cross-import com `onboarding` — preserva DDD). Resilience4j `celcoin-open-finance` (retry 3x em 5xx/IO + circuit breaker + timeout 30s) + WireMock IT cobrindo OAuth, idempotencia e parsing.
- 5 use cases: `IniciarConsentimentoOpenFinanceUseCase` (Idempotency-Key estavel `open-finance:consent:<id>` + 409 race), `ProcessarCallbackConsentimentoUseCase`, `ConsultarMovimentacaoOpenFinanceUseCase` (`@Transactional(REQUIRES_NEW)`; race via `DataIntegrityViolation` -> fallback `findByConsentimentoId`), `ReavaliarPropostaComOpenFinanceUseCase` (`REQUIRES_NEW`; `scoreRepository.flush()` antes do save evita unique violation no delete+insert) e `ProcessarWebhookOpenFinanceUseCase` (outbox idempotente). Listeners `OpenFinanceAutorizadoListener` e `OpenFinanceDadosRecebidosListener` em `AFTER_COMMIT + REQUIRES_NEW` (REQUIRED se junta a tx fantasma e perde saves silenciosamente, conforme licao da Sprint 7).
- Reavaliacao **conservadora**: motor pode promover `EM_ANALISE -> PRE_APROVADA`, mas **nao rejeita automaticamente** — parecer manual preserva discricionariedade quando Open Finance piora score. `RegraResultado` ganhou `ajusteScore` (factories `passouComBonus` + `falhouComPenalidadeExtra`); `MotorRegrasCredito.calcularScore` soma `ajusteTotal` e clampa `[0, 1000]`. `RegraOpenFinanceMovimentacao`: bonus +200 (entradas >= 3x parcela), +100 (>= 1x); penalidade -150 saldo medio negativo; `PASSOU` neutro sem snapshot (opt-in).
- LGPD defesa em profundidade: `OpenFinancePayloadSanitizer` filtra recursivamente 13 campos sensiveis (`account_id`/`number`, `agency_number`, `branch_code`, `transactions`, `raw_transactions`, `transaction_list`, `extrato`, `cpf`, `cnpj`, `document_number`, `holder_name`, `holder_document`); fail-closed devolve placeholder `{"_sanitizer_error":"non-json","_size":N}` em vez do bruto. Audit log carrega APENAS IDs + agregados, NUNCA payload bruto.
- 2 endpoints REST em `/api/v1/credito/propostas/{id}/open-finance` (consentimento + consulta) + webhook `POST /api/v1/webhooks/celcoin/open-finance` (HMAC + `Idempotency-Key` obrigatorios). Validacao defensiva `@Pattern` no DTO (CPF/CNPJ 11/14 digitos puros; `redirectUri` regex `^https?://[^\s]+$` bloqueia SSRF/open-redirect).
- 5 tipos novos de audit em `OpenFinanceAuditListener` (`AFTER_COMMIT + REQUIRES_NEW`): `OPEN_FINANCE_CONSENTIMENTO_INICIADO`, `OPEN_FINANCE_AUTORIZADO`, `OPEN_FINANCE_NEGADO`, `OPEN_FINANCE_DADOS_RECEBIDOS`, `OPEN_FINANCE_REAVALIACAO`.
- Testes: `OpenFinanceIT` E2E (`sep_test`) — fluxo feliz `PRE_APROVADA -> consentimento -> webhook AUTORIZADO -> snapshot -> reavaliacao -> 4 eventos audit`; cenarios `NEGADO` (score nao muda), cliente alheio 403, HMAC invalido 401, sem `Idempotency-Key` 400, idempotencia 2x mesma key, proposta `APROVADA` nao reavalia. WireMock IT para adapter + sanitizer unit tests. `./gradlew check` verde com JaCoCo gate 70% + Spotless.
- Documentacao: `docs-SEP/repos/sep-api/OPEN-FINANCE.md` (novo), `docs-SEP/repos/sep-api/CREDITO.md` atualizado com secao Sprint 9, descricao consolidada do PR real, README sep-api atualizado, Postman + Insomnia ganharam pasta "Open Finance (Sprint 9)".
- Pendencias para sprints futuras: revogacao tardia (`consent.denied` apos `authorized` hoje apenas WARN); thresholds bonus/penalidade hardcoded -> migrar pra `CreditoMotorProperties`; multiplos provedores Open Finance; renovacao automatica de consentimento; UI web/mobile (Sprint 9 backend-only).

### Sprint 10 (executada - 2026-05-20)

Objetivo de planejamento:
- iniciar a formalizacao contratual: criar modulo `contratos`, modelar `Contrato`, `ClausulaContratual`, `VersaoContrato` e `StatusFormalizacao`, gerar contrato a partir de templates por tipo de operacao (texto inicial; PDF/HTML estruturado em sprint posterior), implementar fluxo de aceite e bloquear desembolso sem formalizacao concluida

Tema:
- Formalizacao — geracao de contrato (Epic 7 parte 1)

Pre-requisitos de entrada:
- Sprint 9 concluida
- proposta de credito aprovada (estado `APROVADA`) disponivel como entrada do fluxo

Dependencias externas:
- depende da conclusao da Sprint 9

Responsavel principal:
- Dev Senior

Detalhamento das tasks:
- consultar: [`specs/fase-2/010-sprint-10-formalizacao-geracao-contrato.md`](../specs/fase-2/010-sprint-10-formalizacao-geracao-contrato.md)
- o PRD mantem apenas o planejamento de alto nivel desta sprint; a execucao e governada pelo spec correspondente

Status de execucao (concluida em 2026-05-20):
- Modulo `contratos` criado em DDD + Hexagonal com `Contrato`, `VersaoContrato`, `ClausulaContratual`, `AceiteContrato`, estados de formalizacao e migrations V20-V22.
- Geracao automatica a partir de `PropostaAprovadaEvent`, template Thymeleaf texto, versionamento por hash SHA-256 e idempotencia por `parecerOrigemId`.
- Aceite do tomador com ownership, evidencia tecnica e step-up; cancelamento pre-aceite por `FINANCEIRO`/`ADMIN`; 5 endpoints REST em `/api/v1/contratos`.
- Auditoria reforcada com eventos `CONTRATO_GERADO`, `CONTRATO_NOVA_VERSAO`, `CONTRATO_ACEITO` e `CONTRATO_CANCELADO`, sem gravar conteudo integral do contrato no audit log.
- Documentacao operacional: [`docs-SEP/repos/sep-api/CONTRATOS.md`](../repos/sep-api/CONTRATOS.md), descricao consolidada do PR real, Postman e Insomnia atualizados.
- Pendencias futuras: assinatura digital, CCB juridicamente completa, PDF/HTML rico e hardening de step-up estrito para operacoes legais.

### Sprint 11 (executada - 2026-05-21)

Objetivo de planejamento:
- completar a formalizacao com assinatura digital: expor `AssinaturaDigitalProvider` (provedor a definir via ADR), gerar `CCB` (Cedula de Credito Bancario) automaticamente, processar webhook de confirmacao de assinatura e registrar trilha auditavel reforcada do ato

Tema:
- Formalizacao — assinatura digital + CCB (Epic 7 parte 2)

Pre-requisitos de entrada:
- Sprint 10 concluida
- ADR de provedor de assinatura digital aceito antes do inicio da sprint
- credenciais sandbox do provedor de assinatura disponiveis

Dependencias externas:
- depende da conclusao da Sprint 10

Responsavel principal:
- Dev Senior

Detalhamento das tasks:
- consultar: [`specs/fase-2/011-sprint-11-formalizacao-assinatura-digital.md`](../specs/fase-2/011-sprint-11-formalizacao-assinatura-digital.md)
- o PRD mantem apenas o planejamento de alto nivel desta sprint; a execucao e governada pelo spec correspondente

Status de execucao (concluida em 2026-05-21):
- [ADR 0013](../adr/0013-provedor-de-assinatura-digital.md) aceito — provedor Clicksign via Provider Pattern (spec 011 citava `ADR 0012` ja ocupado por motor de credito; numeracao ajustada).
- 3 entidades novas (`EnvelopeAssinatura`, `EventoAssinatura`, `DocumentoAssinado`) + storage isolado `documento_assinado_blob` (BYTEA) via port `DocumentoAssinadoStorage`; Epic 16 troca por S3/MinIO sem mexer no dominio. Migrations V23 + V24.
- `AssinaturaDigitalProvider` (port em `application.port.out`) com `FakeAssinaturaDigitalProvider` (dev/test) + `ClicksignAssinaturaDigitalProvider` (RestClient + Resilience4j `clicksign-assinatura` CB+retry+timeLimiter); hierarquia `AssinaturaProviderException`/`AssinaturaProviderHttpException`/`EnvelopeNaoEncontradoException` mapeada em `ApiExceptionHandler` -> 503/422/502.
- `CcbGenerator` com Apache PDFBox 3.0.x deterministico (metadata zerada); `CcbGeracaoException extends OperacaoNaoProcessavelException` (CTR-422-CCB-001).
- `ContratoAceitoListener` AFTER_COMMIT + REQUIRES_NEW dispara `EnviarParaAssinaturaUseCase` automaticamente (desligavel via `app.assinatura.auto-envio-pos-aceite=false`); idempotencia por `contratoId:vN`; runbook documentado em `CONTRATOS.md` para reprocessamento manual em silent failure.
- Webhook `POST /api/v1/webhooks/assinatura/{provider}` (Clicksign): HMAC SHA-256 via `Content-Hmac: sha256=<hex>` + outbox compartilhado da Sprint 4; idempotency-key derivado de `SHA-256(payload)` quando ausente; body max 64KB.
- 3 endpoints REST novos em `/api/v1/contratos/{id}/`: `POST assinar` (FINANCEIRO/ADMIN + step-up), `GET assinatura/status` (ownership ou FINANCEIRO/ADMIN), `GET documento-assinado` (application/pdf + `Content-Disposition` + `X-Document-Hash-Sha256`).
- Auditoria reforcada com 6 tipos novos em `audit_log_seguranca` (V24): `CCB_GERADA`, `ASSINATURA_ENVIADA`, `ASSINATURA_VISUALIZADA`, `ASSINATURA_ASSINADA`, `ASSINATURA_RECUSADA`, `DOCUMENTO_ASSINADO_BAIXADO` (este ultimo grava ip + user-agent em colunas dedicadas). Payload JSON apenas com IDs tecnicos + hash + timestamp do provider; conteudo integral do PDF/CCB jamais entra no audit (teste defensivo bloqueia `%PDF`/`JVByR` base64).
- `ApiExceptionHandler` ampliado: `MethodArgumentTypeMismatchException` -> 400 (UUID invalido em path param); `ContratoAssinaturaIndisponivelException extends ConflitoException` -> 409.
- Suite E2E `AssinaturaIT` com 8 cenarios (fluxo feliz, recusado, idempotencia webhook, HMAC invalido, ownership download, FINANCEIRO download, reenvio idempotente) alem de `ClicksignAssinaturaDigitalProviderIT` (WireMock HTTP wiring isolado, Task 11.4).
- Documentacao operacional: [`docs-SEP/repos/sep-api/CONTRATOS.md`](../repos/sep-api/CONTRATOS.md) ampliado, [`CCB.md`](../repos/sep-api/CCB.md) novo (estrutura + base legal Lei 10.931/2004 + Lei 14.063/2020 + retencao 10 anos + revisao juridica pendente), descricao consolidada do PR real, Postman e Insomnia atualizados com 7 requests Sprint 11 + secao `Webhook Assinatura Digital`, [`AGENT.md`](../AGENT.md) ganhou §Skills obrigatorias (`coding-guidelines` + `clean-code` + `design-patterns-java`).
- Pendencias futuras: revisao juridica do `CCB.md` antes do go-live; modulo `onboarding` (Epic 5) expor dados cadastrais reais do tomador (hoje placeholder UUID+email); WireMock E2E completo com `app.assinatura.provider=clicksign` + stubs HTTP (hoje split entre IT do adapter + AssinaturaIT via Fake); Resilience4j 4xx via Java predicate (hoje retenta tambem por limitacao YAML); contador Micrometer `sep_contratos_auto_envio_falhas_total`; hardening `@RequireStepUpEstrita` sem bypass MFA; renegociacao/aditivos contratuais; multiplos signatarios (avalistas/garantidores); storage S3/MinIO (Epic 16); Sprint 12 (Cobranca) consome `ContratoAssinadoEvent` para gerar `AgendaPagamento`.

### Sprint 12 (executada - 2026-05-22)

Objetivo de planejamento:
- entregar a estrutura inicial de cobranca pos-formalizacao: criar modulo `cobranca`, modelar `ParcelaCobranca`, `AgendaPagamento` e `Recebimento`, gerar parcelas automaticamente apos formalizacao, calcular juros/multas/encargos e consumir o modulo `escrow` (modelado desde Sprint 1) para registrar recebimentos na conta segregada

Tema:
- Cobranca — parcelas e agenda (Epic 8 parte 1)

Pre-requisitos de entrada:
- Sprint 11 concluida
- modulo `escrow` funcional (entidades modeladas desde Sprint 1, ainda sem `EscrowProvider` real — Sprint 12 consome apenas a modelagem)

Dependencias externas:
- depende da conclusao da Sprint 11

Responsavel principal:
- Dev Senior

Status de execucao:
- mergeada em `origin/develop` via PR #59 (squash `d9e3a59`, 2026-05-22)
- 18 commits no sep-api absorvidos pelo squash; ~5500 linhas adicionadas
- 5 migrations Flyway: `V25__criar_tabelas_cobranca` (agenda + parcelas + recebimentos com FKs sem CASCADE, UNIQUE contrato/idempotency, CHECK principal > 0), `V26__adicionar_taxa_juros_proposta_credito` (coluna nullable como placeholder), `V27__adicionar_external_reference_movimentacao_escrow` (correlaciona movimentacao com recebimento.id), `V28__unique_constraints_escrow` (UNIQUE conta_escrow.titular + UNIQUE PARCIAL wallet(proposta_id)), `V29__ampliar_audit_seguranca_tipo_cobranca` (6 tipos novos)
- modulo `cobranca` completo: dominio (`AgendaPagamento`, `ParcelaCobranca`, `Recebimento`, `StatusParcela`, `ComposicaoValor`), 5 use cases (`GerarAgendaPagamentoUseCase`, `RegistrarRecebimentoUseCase`, `CalcularValorAtualizadoParcelaUseCase`, `ConsultarParcelasUseCase`, `ConsultarAgendaPorContratoUseCase`), 4 calculadoras (Price/SAC/JurosMora/Multa com `AmortizacaoDispatcher` Strategy), 4 endpoints REST + DTOs + OpenAPI, 2 listeners (`ContratoAssinadoListener` AFTER_COMMIT + `CobrancaAuditListener` 5 handlers), `MarcarParcelaAtrasadaJob` @Scheduled, integracao via porta com `escrow.RegistrarMovimentacaoEscrowUseCase` (lazy create conta+wallet com sub-tx REQUIRES_NEW pra resolver corrida UNIQUE)
- idempotencia em 3 camadas no recebimento (pre-lock + pos-lock + UNIQUE DB) + validacao consistencia (parcelaId + valor) com `ChaveIdempotenciaConflitanteException`
- 5 audit types: `AGENDA_GERADA`/`PARCELA_CRIADA`/`RECEBIMENTO_REGISTRADO`/`PARCELA_PAGA`/`PARCELA_ATRASADA`/`MOVIMENTACAO_ESCROW_CRIADA` (V29)
- 100+ testes (dominio + calculadoras + use cases + listeners + job + `CobrancaControllerTest` @WebMvcTest + `CobrancaIT` @SpringBootTest com 10 cenarios E2E incluindo audit log)
- pendencias registradas em `repos/sep-api/COBRANCA.md`: taxa_juros_mensal proposta precisa ser populada explicitamente em sprint futura (hoje usa fallback config); job single-instance (Epic 15 AWS multi-instance requer ShedLock); `GET /recebimentos` sem paginacao (Sprint 13 ou Epic 15)
- documentacao consolidada em [`repos/sep-api/COBRANCA.md`](../repos/sep-api/COBRANCA.md) + descricao consolidada do PR real

Detalhamento das tasks:
- consultar: [`specs/fase-2/012-sprint-12-cobranca-parcelas-agenda.md`](../specs/fase-2/012-sprint-12-cobranca-parcelas-agenda.md)
- o PRD mantem apenas o planejamento de alto nivel desta sprint; a execucao e governada pelo spec correspondente

### Sprint 13

Objetivo de planejamento:
- tratar inadimplencia e recuperacao: deteccao automatica de atraso, estados `ATRASADA`/`EM_NEGOCIACAO`/`INADIMPLENTE`/`RENEGOCIADA`, workflows de cobranca com escalonamento, renegociacao basica, `NotificationProvider` (email/SMS via SMTP + Zenvia; `log` em dev/test) e historico auditavel de tentativas

Tema:
- Cobranca — inadimplencia e recuperacao (Epic 8 parte 2)

Pre-requisitos de entrada:
- Sprint 12 concluida
- ADR 0014 (estrategia de notificacoes transacionais) aceito antes do inicio da sprint

Dependencias externas:
- depende da conclusao da Sprint 12

Responsavel principal:
- Dev Senior

Status de execucao:
- concluida em 2026-05-26; branch `feature/sprint-13-cobranca-inadimplencia` mergeada em `develop` via PR #61, commit `3bac857`
- 3 migrations Flyway: `V30__criar_tabelas_inadimplencia`, `V31__suportar_agenda_substituta`, `V32__ampliar_audit_seguranca_tipo_inadimplencia`
- modulo `cobranca` estendido com workflow configuravel por yaml, providers SMTP/Zenvia/Log, listeners de atraso/auditoria/renegociacao, jobs de escalonamento, inadimplencia e expiracao de renegociacao
- endpoints REST novos: `GET /api/v1/cobranca/inadimplencia`, `POST /api/v1/cobranca/parcelas/{id}/contato`, `POST /api/v1/cobranca/parcelas/{id}/renegociacao`, `PATCH /api/v1/cobranca/renegociacoes/{id}/aceite`, `PATCH /api/v1/cobranca/renegociacoes/{id}/recusa`
- auditoria reforcada com `NOTIFICACAO_ENVIADA`, `EVENTO_COBRANCA_REGISTRADO`, `PARCELA_INADIMPLENTE`, `RENEGOCIACAO_PROPOSTA`, `RENEGOCIACAO_ACEITA`, `RENEGOCIACAO_RECUSADA`, `RENEGOCIACAO_EXPIRADA`
- documentacao consolidada em [`repos/sep-api/COBRANCA.md`](../repos/sep-api/COBRANCA.md) e [`repos/sep-api/NOTIFICACOES.md`](../repos/sep-api/NOTIFICACOES.md); revisao juridica segue pendente antes de producao

Detalhamento das tasks:
- consultar: [`specs/fase-2/013-sprint-13-cobranca-inadimplencia.md`](../specs/fase-2/013-sprint-13-cobranca-inadimplencia.md)
- o PRD mantem apenas o planejamento de alto nivel desta sprint; a execucao e governada pelo spec correspondente

### Sprint 14

Objetivo de planejamento:
- consolidar a operacao assistida da Fase 2 entregando o modulo `backoffice`: fila operacional unificada (propostas pendentes, KYC com erro, contratos sem assinatura, cobrancas problematicas), comentarios internos, justificativas, reprocessos manuais (re-disparo de webhook, re-tentativa de provider) e visao consolidada para o financeiro interno

Tema:
- Backoffice operacional (Epic 9)

Status de execucao:
- concluida em 2026-05-26; branch `feature/sprint-14-backoffice-operacional` mergeada em `develop` via PR #63, commit `30def6a`
- modulo `backoffice` criado para operacao assistida da Fase 2 com fila operacional, comentarios internos, resolucao/ignore, reprocessos manuais e dashboard consolidado
- 9 endpoints REST em `/api/v1/backoffice`, role `BACKOFFICE`, step-up obrigatorio nos 4 endpoints sensiveis, anti-abuso 3/24h e auditoria reforcada com 6 novos tipos
- documentacao operacional consolidada em [`repos/sep-api/BACKOFFICE.md`](../repos/sep-api/BACKOFFICE.md), descricao consolidada do PR real e collections Postman/Insomnia atualizadas
- pendencias aceitas/adiadas: strategies reais de reprocesso provider, handler real por provider/evento no reprocesso webhook, race residual best-effort no anti-abuso, multi-role `FINANCEIRO + BACKOFFICE`, V34 idempotente e JavaDoc/OpenAPI dos DTOs de role

Pre-requisitos de entrada:
- Sprint 13 concluida
- modulos `onboarding`, `credito`, `contratos` e `cobranca` funcionais (consumidos pela fila operacional)

Dependencias externas:
- depende da conclusao da Sprint 13

Responsavel principal:
- Dev Senior

Detalhamento das tasks:
- consultar: [`specs/fase-2/014-sprint-14-backoffice-operacional.md`](../specs/fase-2/014-sprint-14-backoffice-operacional.md)
- o PRD mantem apenas o planejamento de alto nivel desta sprint; a execucao e governada pelo spec correspondente

### Epic 5 - Onboarding KYC/KYB
- **Sprints alocadas**: Sprint 6 (KYC Pessoa Fisica) e Sprint 7 (KYB Empresa + PLD)
- implementar onboarding documental de pessoa e empresa
- preparar coleta e validacao de documentos obrigatorios
- estruturar verificacoes de identidade e dados cadastrais
- preparar o sistema para integracoes futuras de OCR, biometria e background check
- registrar trilha operacional de aprovacao, rejeicao e pendencias cadastrais

### Epic 6 - Analise de credito
- **Sprints alocadas**: Sprint 8 (regras internas + parecer) e Sprint 9 (integracao Open Finance)
- implementar esteira inicial de analise de credito para o tomador
- modelar parecer operacional, score interno e decisao de aprovacao ou rejeicao
- permitir analise assistida pelo time interno
- registrar fundamentos da decisao e historico de alteracoes
- integrar a analise ao fluxo da proposta e da elegibilidade para contratacao

### Epic 7 - Formalizacao contratual
- **Sprints alocadas**: Sprint 10 (geracao de contrato) e Sprint 11 (assinatura digital + CCB)
- preparar geracao de contrato e artefatos formais da operacao
- modelar etapa de aceite e assinatura
- registrar status de formalizacao da proposta
- bloquear desembolso sem formalizacao concluida
- preparar integracao futura com assinatura eletronica e CCB

### Epic 8 - Cobranca e inadimplencia
- **Sprints alocadas**: Sprint 12 (parcelas e agenda) e Sprint 13 (inadimplencia e recuperacao)
- estruturar cobranca basica das parcelas apos contratacao
- registrar agenda, status e historico de recebimentos
- permitir acompanhamento de atraso e inadimplencia
- preparar reprocessos operacionais e a futura integracao com meios de cobranca
- dar suporte ao financeiro na conciliacao pos-contratacao
- consumir o modulo `escrow` para registrar recebimentos e movimentacoes na conta segregada (segregacao patrimonial obrigatoria por Resolucao CMN 4.656/2018)

### Epic 9 - Backoffice operacional
- **Sprints alocadas**: Sprint 14 (sprint unica que consolida a operacao assistida da Fase 2)
- estruturar fila operacional para propostas, pendencias e excecoes
- dar visibilidade consolidada para o financeiro interno acompanhar onboarding, analise, formalizacao e cobranca
- permitir tratamento manual de inconsistencias, reprocessos e bloqueios operacionais
- registrar comentarios, justificativas e trilha operacional das decisoes internas
## 29. Mapeamento Fase 2: Epics × Sprints

Tabela executiva consolidando o planejamento e execucao da Fase 2 (Epics 5-9, Sprints 5-14). Util para PO/PM acompanhar a Fase 2 sem precisar ler a §22 inteira. Sprint 5 foi concluida como gate cross-stack; Sprints 6-14 foram concluidas como trilha backend-only ate a estabilizacao dos contratos da API.

| Sprint | Epic | Tema | Spec | Modulo dominio |
|--------|------|------|------|----------------|
| 5 | Epic 4 estendida | Endurecimento de Seguranca (gate Fase 2) | [`005`](../specs/fase-2/005-sprint-5-endurecimento-seguranca.md) | `identity` |
| 6 | Epic 5 (parte 1) | Onboarding KYC Pessoa Fisica | [`006`](../specs/fase-2/006-sprint-6-onboarding-kyc-pessoa.md) | `onboarding` |
| 7 | Epic 5 (parte 2) | Onboarding KYB Empresa + PLD | [`007`](../specs/fase-2/007-sprint-7-onboarding-kyb-empresa.md) | `onboarding` |
| 8 | Epic 6 (parte 1) | Credito — regras internas + parecer | [`008`](../specs/fase-2/008-sprint-8-credito-regras-parecer.md) | `credito` |
| 9 | Epic 6 (parte 2) | Credito — integracao Open Finance | [`009`](../specs/fase-2/009-sprint-9-credito-open-finance.md) | `credito` |
| 10 | Epic 7 (parte 1) | Formalizacao — geracao de contrato | [`010`](../specs/fase-2/010-sprint-10-formalizacao-geracao-contrato.md) | `contratos` |
| 11 | Epic 7 (parte 2) | Formalizacao — assinatura digital + CCB | [`011`](../specs/fase-2/011-sprint-11-formalizacao-assinatura-digital.md) | `contratos` |
| 12 | Epic 8 (parte 1) | Cobranca — parcelas e agenda | [`012`](../specs/fase-2/012-sprint-12-cobranca-parcelas-agenda.md) | `cobranca` + `escrow` |
| 13 | Epic 8 (parte 2) | Cobranca — inadimplencia e recuperacao | [`013`](../specs/fase-2/013-sprint-13-cobranca-inadimplencia.md) | `cobranca` |
| 14 | Epic 9 | Backoffice operacional | [`014`](../specs/fase-2/014-sprint-14-backoffice-operacional.md) | `backoffice` |

**Resumo**: 10 sprints na Fase 2 (Sprint 5 ja existia como gate de hardening e foi concluida em 2026-05-11; Sprints 6-14 foram concluidas no backend, encerrando a Fase 2 backend em 2026-05-26 com a Sprint 14). A Sprint 15 foi executada depois do fechamento funcional como hardening/bug-hunt pos-Fase-2, concluida em 2026-05-27. Na mesma data, `develop` foi promovida manualmente para `main` nos repos `sep-api`, `sep-app` e `sep-mobile`; a verificacao posterior mostrou diff vazio entre `origin/main` e `origin/develop` nos tres repos. Dependencia linear mantida (cada sprint exigiu a anterior pronta). A partir da Sprint 6, a trilha foi exclusivamente backend nesta etapa; Web e Mobile da Fase 2 entrarao em planejamento separado depois que os contratos da API estabilizarem (decisao tomada em 2026-05-04).

**Decisoes de planejamento**:
- **Granularidade**: cada Epic 5-8 foi dividida em 2 sprints (parte 1 + parte 2) para reduzir risco de entrega; Epic 9 ficou em 1 sprint unica.
- **Trilhas Web/Mobile**: nao planejadas nesta etapa. Decisao motivada por dois fatores: (1) os contratos da API sao definidos pelo backend e ainda podem evoluir durante as Epics 5-9; (2) o frontend de jornadas (Epic 13) e o mobile (Epic 14 fase 2+) so podem comecar de forma estavel quando esses contratos estiverem fechados.
- **Sprint 5**: concluida em 2026-05-11; foi reposicionada como gate de abertura da Fase 2 (e nao mais fechamento da Fase 1) por exigir MFA/refresh token/lockout antes de qualquer integracao real com Celcoin.
- **Sprint 8**: concluida em 2026-05-18; entregou o primeiro nucleo de credito interno, sem Open Finance, sem precificacao financeira e sem formalizacao/desembolso.
- **Sprint 9**: concluida em 2026-05-19; entregou integracao Open Finance Brasil via Celcoin/Finansystech (consentimento + reavaliacao + auditoria). Pattern anti-orphan 2-fase no consentimento, listeners `AFTER_COMMIT + REQUIRES_NEW` reaproveitando licao da Sprint 7, motor de credito ganhou `ajusteScore` (bonus/penalidade Open Finance), 5 tipos novos de audit `OPEN_FINANCE_*` (V19) e sanitizer LGPD fail-closed. Reavaliacao **conservadora**: promove apenas `EM_ANALISE -> PRE_APROVADA`; nao rejeita automaticamente. Sem ADR proprio — decisao arquitetural coberta por ADR 0004 (Provider Pattern) + ADR 0008 (WireMock).
- **Sprint 10**: concluida em 2026-05-20; entregou formalizacao contratual ate `ACEITO`: modulo `contratos`, templates texto, versionamento com SHA-256, aceite/cancelamento com step-up, 5 endpoints REST, migrations V20-V22 e auditoria `CONTRATO_*`. Assinatura digital, CCB completa e artefatos ricos ficam para Sprint 11.
- **Sprint 14**: concluida em 2026-05-26; entregou `backoffice` operacional com fila unificada, comentarios, resolucao/ignore, reprocessos manuais, dashboard, role `BACKOFFICE`, step-up em operacoes sensiveis e auditoria reforcada. Encerramento backend da Fase 2 registrado em `BACKOFFICE.md`, PRD, CONTEXT, relatorio de acompanhamento e collections.

**ADRs candidatos durante a Fase 2** (criados just-in-time quando cada decisao for tomada):
- ADR 0012 — Motor de regras de credito interno (Sprint 8, aceito em 2026-05-18; 0011 ja estava ocupado)
- ADR 0013 — Provedor de assinatura digital (Sprint 11; Clicksign; aceito em 2026-05-21)
- ADR 0014 — Estrategia de notificacoes transacionais (Sprint 13) — gate da Sprint 13

**Steps**: continuam sendo gerados just-in-time, antes da execucao de cada sprint (regra do `AGENT.md`). A Fase 2 nao gera steps em massa.
