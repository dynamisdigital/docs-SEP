# Steps - Sprint 19 - Pix Foundation e EscrowProvider

**Spec de origem**: [`specs/fase-3/019-sprint-19-pix-foundation-escrow-provider.md`](../../specs/fase-3/019-sprint-19-pix-foundation-escrow-provider.md)

**Status**: a implementar.

**Objetivo geral**: criar a fundacao backend do modulo `pix`, preparar o processamento inicial de webhooks Pix/Celcoin, definir o `PixProvider` por Provider Pattern e evoluir o `EscrowProvider` ja existente no modulo `escrow` com adapter Celcoin, mantendo dominio isolado de detalhes Celcoin.

**Esforco total estimado**: 8-11 dias de Dev Senior.

**Repo de destino**:
- `sep-api`: backend Spring Boot, unico repo de codigo alterado nesta sprint.
- `docs-SEP`: documentacao editada no working tree quando necessario; operacao git continua manual.

**Branch sugerida**:
- `feature/sprint-19-pix-foundation-escrow-provider`

**Pre-requisitos globais**:
- `sep-api/develop` atualizado apos merge da Sprint 18 (`ab2c39a`, PR #71).
- Sprint 12 conhecida: `escrow` local, `ContaEscrow`, `Wallet`, `MovimentacaoEscrow`, `RegistrarMovimentacaoEscrowUseCase` e `WebhookEventLog`.
- Sprint 14/18 conhecidas: `BACKOFFICE`, `FINANCEIRO`, step-up, multi-role e auditoria reforcada.
- ADRs 0004 (Provider Pattern), 0005 (Escrow), 0007 (DDD + Hexagonal) e 0008 (WireMock) vigentes.
- Docs de referencia: `repos/sep-api/COBRANCA.md`, `docs-sep/SEGURANCA.md`, spec 020 e spec 021 para nao invadir desembolso/conciliacao.

**Nota sobre numeracao de migrations**:
- Confirmar sempre o proximo numero livre em `src/main/resources/db/migration`.
- Apos Sprint 18 mergeada, a Sprint 19 deve provavelmente iniciar em `V45`.
- Se houver hotfix paralelo em `develop`, reservar o numero real da branch e registrar risco de conflito de migration.

**Fora de escopo**:
- Desembolso Pix real para tomador ou credora.
- Recebimento/conciliacao automatica de parcelas.
- Split Pix, Pix automatico, devolucao Pix, disputa/estorno e gestao avancada de chaves.
- Aporte automatico da credora ou matching financeiro.
- Tela web/mobile de Pix.
- Hardening completo de antifraude/limites transacionais; usar parametros governados apenas quando ja houver consumo simples e seguro.

**Protocolo obrigatorio por Task**:
- Implementar somente a Task liberada pelo usuario.
- Ao concluir implementacao e verificacao da Task, parar em checkpoint pre-commit com arquivos alterados, testes executados, riscos e sugestao de commit.
- Aguardar `commit` ou aprovacao equivalente antes de stage/commit.
- Usar `git add <paths-especificos>`, nunca `git add -A`.
- Fazer code review da Task quando solicitado pelo usuario; se houver hotfix, implementar em novo checkpoint.
- Ao final da Task, pausar para review manual do usuario. Nao iniciar a proxima Task sem ordem explicita.

**Skills obrigatorias na implementacao**:
- `coding-guidelines`: pensar antes, simplicidade, mudancas cirurgicas, execucao orientada a meta.
- `clean-code`: nomes intencionais, funcoes pequenas, sem ruido, testes F.I.R.S.T.
- `clean-architecture`: dominio `pix` e `escrow` protegidos de HTTP/JPA/Celcoin; ports em application; adapters Celcoin/Fake na infrastructure; DTOs Celcoin nunca entram no dominio.

---

## Decisoes tecnicas da Sprint 19

- **Modulo `pix` novo**: criar `com.dynamis.sep_api.pix` com `domain`, `application`, `application.port.out`, `infrastructure` e `web`, seguindo o monolito modular.
- **`EscrowProvider` evolui no modulo `escrow`**: nao criar outro modulo de Celcoin nem mover escrow para `pix`; Pix consome escrow por portas/use cases, e escrow continua capacidade transversal.
- **Provider Pattern estrito**: `PixProvider` e `EscrowProvider` falam em termos de dominio SEP. Request/response Celcoin ficam apenas nos adapters.
- **Fake provider primeiro**: ambiente local/test deve funcionar sem credenciais Celcoin. Celcoin fica ativado por property/profile.
- **Webhook idempotente**: todo evento recebido deve gerar registro idempotente antes do processamento, sem persistir payload bruto com dados sensiveis desnecessarios.
- **HMAC/replay**: validar assinatura no receiver; se o contrato Celcoin real ainda nao estiver fechado, manter adapter/validator configuravel e registrar o gap no checkpoint.
- **Sem Pix financeiro real nesta sprint**: estados e provider skeleton podem existir, mas comandos de desembolso/recebimento reais ficam para Sprints 20/21.

---

## Protocolo de breakpoints recomendado

```text
C1 = 19.0 + 19.1 + 19.2
Dominio Pix + migrations + repositories/idempotencia

C2 = 19.3
Ports PixProvider/EscrowProvider e contratos de dominio

C3 = 19.4
Adapters Fake/Celcoin + RestClient/Resilience4j/WireMock

C4 = 19.5 + 19.6
Webhook Pix + auditoria + OpenAPI + regressao

C5 = 19.7
Docs, collections e fechamento
```

- C2 fica isolado porque define a fronteira de provider; erro aqui contamina todas as tasks seguintes.
- C3 fica isolado porque integra HTTP externo e deve ter WireMock sem depender de credenciais reais.
- C4 fecha a parte operacional de webhook e auditoria.
- 19.7 e gate documental; nao conta como task de implementacao.

---

## Task 19.0 - Prechecks da Sprint 19

**Objetivo**: garantir base Git correta, mapear `escrow`, webhook receiver, provider pattern e propriedades existentes antes de modelar Pix.

**Esforco**: 1-2 horas.

### Step 019.0.1 - Conferir estado Git do `sep-api`

**Comandos**:
```bash
cd <sep-api-root>
git fetch --all --prune
git status --short --branch
git rev-list --left-right --count HEAD...origin/develop
git log --oneline -10 origin/develop
```

**Verificacao**:
- Working tree limpo antes de criar branch.
- Branch local alinhada a `origin/develop`.
- Sprint 18 presente em `develop` (`ab2c39a` ou commit equivalente do PR #71).
- Se houver mudancas locais, identificar se sao do usuario; nao reverter.

### Step 019.0.2 - Criar branch da sprint

**Comandos**:
```bash
cd <sep-api-root>
git switch develop
git pull --ff-only
git switch -c feature/sprint-19-pix-foundation-escrow-provider
```

**Verificacao**:
- Branch criada a partir de `develop` atualizado.
- Se `git pull --ff-only` falhar, abortar e avisar o usuario.

### Step 019.0.3 - Rodar baseline backend

**Comandos**:
```bash
cd <sep-api-root>
./gradlew clean test
./gradlew bootJar
```

**Verificacao**:
- Suite passa antes de qualquer alteracao.
- Contagem de testes registrada no checkpoint.
- Se a falha for ambiental conhecida, registrar evidencia antes de implementar.

### Step 019.0.4 - Mapear pontos existentes de escrow/webhook/provider

**Comandos**:
```bash
cd <sep-api-root>
find src/main/java/com/dynamis/sep_api/escrow -type f | sort
grep -R "interface .*Provider\|Provider" -n src/main/java/com/dynamis/sep_api/escrow src/main/java/com/dynamis/sep_api/*/application/port/out
grep -R "WebhookEventLog\|RegistrarWebhookEventUseCase\|WebhookSignatureValidator\|HmacSignatureValidator" -n src/main/java/com/dynamis/sep_api
grep -R "RestClient\|Resilience4j\|CircuitBreaker\|Retry" -n src/main/java/com/dynamis/sep_api
find src/main/resources/db/migration -maxdepth 1 -type f | sort | tail
```

**Verificacao**:
- Contrato atual de `EscrowProvider` confirmado.
- Fluxo atual de `RegistrarMovimentacaoEscrowUseCase` entendido.
- Reuso possivel de `WebhookEventLog` e HMAC identificado.
- Proximo numero de migration confirmado.

### Step 019.0.5 - Definir propriedades e modo provider

**Checklist**:
- Prefixos sugeridos:
  - `app.pix.provider=fake|celcoin`
  - `app.pix.webhook.secret`
  - `app.celcoin.pix.base-url`
  - `app.celcoin.pix.client-id`
  - `app.celcoin.pix.client-secret`
  - `app.celcoin.escrow.base-url`
  - `app.celcoin.escrow.client-id`
  - `app.celcoin.escrow.client-secret`
- Confirmar se OAuth Celcoin pode reutilizar padrao de onboarding/open-finance ou se precisa token provider dedicado.
- Confirmar headers de idempotencia e assinatura esperados pelo contrato Celcoin disponivel no projeto.
- Sem credenciais reais obrigatorias para dev/test.

### Definicao de pronto da Task 19.0
- [ ] Branch correta criada.
- [ ] Baseline backend executado e registrado.
- [ ] Pontos existentes de escrow/webhook/provider mapeados.
- [ ] Proximo numero de migration confirmado.
- [ ] Properties/provider mode definidos.

---

## Task 19.1 - Dominio Pix e estados operacionais

**Objetivo**: criar o modelo de dominio base do modulo `pix`, sem acoplar Celcoin e sem iniciar movimentacao financeira real.

**Pre-requisito**: Task 19.0 concluida.

**Esforco**: 1-1.5 dia.

**Arquivos principais**:
- `pix/domain/model/PixTransferencia.java`
- `pix/domain/model/PixRecebimento.java`
- `pix/domain/model/PixWebhookEvent.java`
- `pix/domain/vo/StatusPixTransferencia.java`
- `pix/domain/vo/StatusPixRecebimento.java`
- `pix/domain/vo/TipoPixWebhookEvent.java`
- `pix/domain/event/*`
- testes de dominio em `src/test/java/.../pix/domain`

**Regras esperadas**:
- `PixTransferencia` representa uma intencao/operacao de saida, mas nao executa desembolso real nesta sprint.
- `PixRecebimento` representa uma entrada Pix identificada por evento/provider, mas nao concilia parcela nesta sprint.
- `PixWebhookEvent` representa snapshot operacional do evento recebido, vinculado a idempotencia e status de processamento.
- Estados devem ser explicitos e restritivos:
  - transferencia: `CRIADA`, `SOLICITADA`, `PROCESSANDO`, `CONCLUIDA`, `FALHOU`, `CANCELADA`
  - recebimento: `RECEBIDO`, `EM_PROCESSAMENTO`, `CONCILIADO`, `NAO_IDENTIFICADO`, `FALHOU`
  - webhook: `RECEBIDO`, `PROCESSADO`, `IGNORADO`, `FALHOU`
- Entidades usam UUID v6 e timestamps/auditoria conforme padrao local.
- Dados sensiveis bancarios devem ser minimizados; payload bruto de provider nao entra no dominio.

**Clean Architecture**:
- Dominio nao importa Spring, JPA provider DTO, RestClient, HTTP request ou classes Celcoin.
- Transicoes de estado ficam em metodos de dominio com nomes de negocio.
- Regras futuras de desembolso/conciliacao devem ficar preparadas, mas nao implementadas.

### Definicao de pronto da Task 19.1
- [ ] Entidades e VOs do modulo `pix` criados.
- [ ] Transicoes basicas de estado modeladas.
- [ ] Invariantes de idempotencia/correlacao representadas no dominio.
- [ ] Testes unitarios de dominio cobrindo estados validos/invalidos.

---

## Task 19.2 - Migrations, repositories e constraints de idempotencia

**Objetivo**: persistir o dominio Pix com constraints que impeçam duplicidade de operacoes/eventos e preparem consultas operacionais.

**Pre-requisito**: Task 19.1 concluida.

**Esforco**: 1 dia.

**Arquivos principais**:
- `src/main/resources/db/migration/Vxx__criar_tabelas_pix_foundation.sql`
- `pix/infrastructure/persistence/PixTransferenciaRepository.java`
- `pix/infrastructure/persistence/PixRecebimentoRepository.java`
- `pix/infrastructure/persistence/PixWebhookEventRepository.java`
- testes de repository/IT proporcionais.

**Schema esperado**:
- `pix_transferencia`:
  - `id UUID PRIMARY KEY`
  - `idempotency_key VARCHAR(...) NOT NULL UNIQUE`
  - `status`, `valor`, `descricao`, `external_id`, `correlation_id`
  - referencias opcionais para contrato/operacao/carteira apenas se aprovadas no checkpoint
- `pix_recebimento`:
  - `id UUID PRIMARY KEY`
  - `external_id` ou `end_to_end_id` com UNIQUE parcial quando presente
  - `valor`, `status`, `recebido_em`, `correlation_id`
- `pix_webhook_event`:
  - `id UUID PRIMARY KEY`
  - `provider`, `event_id`, `event_type`, `status`, `payload_hash`, `received_at`
  - UNIQUE `(provider, event_id)` ou idempotency key equivalente.

**Constraints obrigatorias**:
- CHECKs para status/tipo.
- Valores monetarios positivos quando aplicavel.
- UNIQUE de idempotencia para transferencia e webhook.
- Indices por status e data para fila operacional futura.
- Sem cascade destrutivo.

**Verificacao**:
```bash
cd <sep-api-root>
./gradlew test --tests "*Pix*Repository*"
./gradlew test --tests "*Pix*Domain*"
```

### Definicao de pronto da Task 19.2
- [ ] Migration forward-only criada com numero correto.
- [ ] Tabelas Pix criadas com checks e uniques.
- [ ] Repositories criados.
- [ ] Testes de persistencia/idempotencia verdes.

---

## Task 19.3 - Ports PixProvider e EscrowProvider

**Objetivo**: definir os contratos de application layer para Pix e evoluir o contrato de `EscrowProvider` existente sem vazar Celcoin.

**Pre-requisito**: Task 19.2 concluida.

**Esforco**: 1 dia.

**Arquivos principais**:
- `pix/application/port/out/PixProvider.java`
- DTOs internos do port em `pix/application/port/out/dto/*`
- `escrow/application/port/out/EscrowProvider.java` ou contrato existente equivalente.
- DTOs internos do port escrow, se necessario.
- Use cases/service de orquestracao inicial, se o contrato exigir.

**Contrato PixProvider esperado**:
- Operacoes orientadas ao dominio, por exemplo:
  - `solicitarTransferencia(...)`
  - `consultarTransferencia(...)`
  - `consultarRecebimento(...)`
  - `normalizarWebhook(...)` se a traducao do evento precisar ficar no adapter.
- Inputs/outputs sem DTO Celcoin, sem JSON bruto e sem tipos HTTP.
- Idempotency key explicita nas operacoes que podem criar efeito externo.

**Contrato EscrowProvider esperado**:
- Evoluir a porta para capacidades Celcoin basicas:
  - criar/consultar conta escrow
  - criar/consultar wallet
  - consultar saldo/extrato basico quando necessario para Sprint 19
- Preservar `RegistrarMovimentacaoEscrowUseCase` e comportamento local da Sprint 12.
- Nao mover regra de dominio de `escrow` para `pix`.

**Clean Architecture**:
- Ports vivem em `application.port.out`.
- Adapters implementam ports; use cases dependem das interfaces.
- Provider DTOs sao records internos do port, nomeados pelo negocio SEP.

### Definicao de pronto da Task 19.3
- [ ] `PixProvider` definido com DTOs de application.
- [ ] `EscrowProvider` revisado/evoluido no modulo `escrow`.
- [ ] Use cases dependem de ports, nao de adapters.
- [ ] Testes unitarios com fake/mock do port cobrem contrato basico.

---

## Task 19.4 - Adapters Fake/Celcoin para Pix e Escrow

**Objetivo**: implementar adapters locais e skeleton Celcoin testavel por WireMock para Pix e EscrowProvider.

**Pre-requisito**: Task 19.3 concluida.

**Esforco**: 2-2.5 dias.

**Arquivos principais**:
- `pix/infrastructure/adapter/fake/FakePixProvider.java`
- `pix/infrastructure/adapter/celcoin/CelcoinPixProvider.java`
- `pix/infrastructure/adapter/celcoin/CelcoinPixProperties.java`
- `escrow/infrastructure/adapter/fake/FakeEscrowProvider.java`, se ainda nao existir.
- `escrow/infrastructure/adapter/celcoin/CelcoinEscrowProvider.java`
- `escrow/infrastructure/adapter/celcoin/CelcoinEscrowProperties.java`
- config `@ConditionalOnProperty`.
- WireMock ITs dos adapters Celcoin.

**Regras esperadas**:
- `fake` e default seguro em dev/test.
- `celcoin` so ativa com property explicita e deve falhar rapido se credenciais obrigatorias estiverem ausentes.
- RestClient com timeout, retry/circuit breaker conforme padrao local.
- Logs sem secrets, dados bancarios sensiveis ou payload bruto.
- Idempotency key enviada em chamadas com efeito externo.
- Erros Celcoin mapeados para exceptions tecnicas/application sem vazar response cru.

**WireMock minimo**:
- Pix:
  - solicitar transferencia retorna external id/status.
  - consultar transferencia retorna status.
  - erro 5xx aciona retry/circuit breaker conforme configurado.
- Escrow:
  - criar/consultar conta.
  - criar/consultar wallet.
  - consultar saldo basico se implementado no contrato.

**Verificacao**:
```bash
cd <sep-api-root>
./gradlew test --tests "*PixProvider*"
./gradlew test --tests "*EscrowProvider*"
./gradlew test --tests "*Celcoin*Pix*"
./gradlew test --tests "*Celcoin*Escrow*"
```

### Definicao de pronto da Task 19.4
- [ ] Fake Pix provider funcional em dev/test.
- [ ] Celcoin Pix provider skeleton implementado e coberto por WireMock.
- [ ] Celcoin EscrowProvider implementado para criar/consultar conta e wallet.
- [ ] Properties e selecao de provider documentadas no checkpoint.
- [ ] Nenhum DTO Celcoin vazando para dominio/application.

---

## Task 19.5 - Webhook Pix com HMAC, idempotencia e processamento inicial

**Objetivo**: criar receiver dedicado de webhook Pix/Celcoin, com assinatura, registro idempotente e processamento inicial sem conciliar parcela ainda.

**Pre-requisito**: Task 19.4 concluida.

**Esforco**: 1.5-2 dias.

**Arquivos principais**:
- `pix/web/controller/PixWebhookController.java`
- `pix/web/dto/PixWebhookRequest.java` ou envelope minimo.
- `pix/application/usecase/ProcessarWebhookPixUseCase.java`
- `pix/application/service/PixWebhookPayloadSanitizer.java`, se necessario.
- `shared/application/usecase/RegistrarWebhookEventUseCase` reutilizado quando fizer sentido.
- `pix/infrastructure/persistence/PixWebhookEventRepository.java`

**Regras esperadas**:
- Endpoint dedicado, exemplo: `POST /api/v1/webhooks/celcoin/pix`.
- Validacao HMAC obrigatoria quando secret configurado.
- Evento duplicado retorna sucesso idempotente e nao reprocessa.
- Payload bruto nao deve ser persistido se contiver dados sensiveis; persistir hash, ids, tipo e resumo sanitizado.
- Evento reconhecido atualiza/cria `PixWebhookEvent` e, se aplicavel, `PixRecebimento` inicial.
- Evento desconhecido vira `IGNORADO` com motivo tecnico.
- Falha de processamento fica registrada como `FALHOU` para reprocesso futuro.

**Fora de escopo nesta task**:
- Baixar parcela automaticamente.
- Gerar agenda/recebimento de cobranca automaticamente.
- Disparar desembolso.

**Verificacao**:
```bash
cd <sep-api-root>
./gradlew test --tests "*PixWebhook*"
./gradlew test --tests "*Webhook*"
```

### Definicao de pronto da Task 19.5
- [ ] Endpoint webhook Pix criado.
- [ ] HMAC validado ou gap documentado com fallback seguro.
- [ ] Idempotencia de evento duplicado coberta por teste.
- [ ] Evento cria/atualiza registros Pix sem conciliar cobranca.
- [ ] Payload sensivel nao e persistido em claro.

---

## Task 19.6 - Auditoria, OpenAPI e regressao de provider/webhook

**Objetivo**: fechar trilha auditavel da foundation Pix, contratos OpenAPI e regressao dos fluxos de provider/webhook.

**Pre-requisito**: Task 19.5 concluida.

**Esforco**: 1-1.5 dia.

**Arquivos principais**:
- `shared/audit/TipoEventoSeguranca.java`
- migration para ampliar CHECK de `audit_log_seguranca`.
- listeners de auditoria em `pix/application/listener` e/ou `escrow/application/listener`.
- controllers/DTOs OpenAPI.
- collections Postman/Insomnia quando endpoint novo existir.

**Eventos de auditoria esperados**:
- `PIX_WEBHOOK_RECEBIDO`
- `PIX_WEBHOOK_PROCESSADO`
- `PIX_WEBHOOK_FALHOU`
- `PIX_TRANSFERENCIA_SOLICITADA` se houver use case que solicite ao provider nesta sprint.
- `ESCROW_CONTA_PROVIDER_CRIADA`
- `ESCROW_WALLET_PROVIDER_CRIADA`

**Cenarios minimos de regressao**:
- Fake provider sobe por default em `test`.
- Adapter Celcoin coberto por WireMock sem credenciais reais.
- Webhook com assinatura valida grava evento.
- Webhook duplicado nao duplica processamento.
- Webhook com assinatura invalida retorna 401/403 conforme padrao local.
- Payload sensivel nao aparece em auditoria.
- Migrations aplicam em banco limpo.

**Comandos sugeridos**:
```bash
cd <sep-api-root>
./gradlew test --tests "*Pix*"
./gradlew test --tests "*Escrow*"
./gradlew test --tests "*Webhook*"
./gradlew test
```

### Definicao de pronto da Task 19.6
- [ ] Eventos de auditoria criados e persistidos apos commit.
- [ ] OpenAPI atualizado para webhook Pix e endpoints internos expostos.
- [ ] Collections atualizadas quando houver endpoint novo.
- [ ] Regressao provider/webhook verde.
- [ ] Full test executado ou bloqueio ambiental registrado.

---

## Task 19.7 - Docs, collections e fechamento

**Objetivo**: atualizar documentacao e artefatos operacionais apos a implementacao estar validada.

**Pre-requisito**: Tasks 19.1-19.6 concluidas e revisadas.

**Esforco**: 0.5 dia.

**Arquivos esperados**:
- `docs-SEP/repos/sep-api/PIX.md` (novo doc operacional).
- `docs-SEP/repos/sep-api/COBRANCA.md` (referenciar transicao de recebimento manual para Pix futuro, sem marcar conciliacao entregue).
- `docs-SEP/docs-sep/SEGURANCA.md` (webhook/HMAC/auditoria quando aplicavel).
- `docs-SEP/docs-sep/PRD.md`
- `docs-SEP/docs-sep/CONTEXT.md`
- `docs-SEP/AI-ROADMAP.md`
- Collections Postman/Insomnia de webhook Pix/provider smoke.
- `docs-SEP/repos/sep-api/SPRINT-19-PR.md` ao final da sprint.

**Checklist**:
- Documentar providers (`fake`/`celcoin`) e properties.
- Documentar endpoints de webhook, HMAC e idempotencia.
- Documentar quais capacidades Pix ainda sao foundation e quais ficam para Sprints 20/21.
- Registrar migrations e eventos de auditoria.
- Atualizar PRD/CONTEXT com status real da Sprint 19 apenas apos fechamento/merge confirmado.
- Remover `SPRINT-18-PR.md` temporario se ele ja tiver sido usado e o usuario aprovar a limpeza.

### Definicao de pronto da Task 19.7
- [ ] `PIX.md` criado.
- [ ] Docs de seguranca/COBRANCA atualizadas quando comportamento mudar.
- [ ] PRD/CONTEXT atualizados com status real.
- [ ] AI-ROADMAP revisado.
- [ ] Collections atualizadas quando aplicavel.
- [ ] PR description temporaria criada para Sprint 19.
- [ ] Checkpoint final pronto para commit/PR.

---

## Definition of Done da Sprint 19

- [ ] Modulo `pix` criado com dominio isolado de Celcoin.
- [ ] Tabelas Pix criadas com constraints de idempotencia.
- [ ] `PixProvider` definido por porta de application.
- [ ] `EscrowProvider` existente evoluido sem mover responsabilidade para `pix`.
- [ ] Fake provider funcional em dev/test.
- [ ] Celcoin Pix/Escrow adapters cobertos por WireMock basico.
- [ ] Webhook Pix/Celcoin recebe eventos com HMAC e idempotencia.
- [ ] Auditoria reforcada cobre provider/webhook sem payload sensivel.
- [ ] OpenAPI/collections/docs refletem contratos novos.
- [ ] Testes proporcionais verdes.
- [ ] Migrations aplicam em banco limpo e banco existente.
