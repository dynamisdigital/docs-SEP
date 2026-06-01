# Steps - Sprint 20 - Pix Desembolso Assistido

**Spec de origem**: [`specs/fase-3/020-sprint-20-pix-desembolso-assistido.md`](../../specs/fase-3/020-sprint-20-pix-desembolso-assistido.md)

**Status**: a implementar.

**Objetivo geral**: permitir desembolso Pix assistido pelo financeiro apos contrato assinado e agenda de cobranca criada, com autorizacao, step-up, idempotencia, auditoria, rastreabilidade e integracao via `PixProvider`, sem transformar o fluxo em desembolso automatico.

**Esforco total estimado**: 6-9 dias de Dev Senior.

**Repo de destino**:
- `sep-api`: backend Spring Boot, unico repo de codigo alterado nesta sprint.
- `docs-SEP`: documentacao editada no working tree quando necessario; operacao git continua manual.

**Branch sugerida**:
- `feature/sprint-20-pix-desembolso-assistido`

**Pre-requisitos globais**:
- `sep-api/develop` atualizado apos merge da Sprint 19 (`12ca083`, PR #73, ou commit equivalente).
- Sprint 19 conhecida: modulo `pix`, `PixTransferencia`, `PixProvider`, Fake/Celcoin provider skeleton, webhook Pix e `EscrowProvider`.
- Sprints 10-12 conhecidas: contratos assinados, agenda de cobranca por contrato e wallet/conta escrow locais.
- Sprints 14/18 conhecidas: backoffice, reprocesso provider, multi-role, step-up e auditoria reforcada.
- ADRs 0004 (Provider Pattern), 0005 (Escrow), 0007 (DDD + Hexagonal) e 0008 (WireMock) vigentes.
- Docs de referencia: `repos/sep-api/PIX.md`, `CONTRATOS.md`, `COBRANCA.md`, `BACKOFFICE.md` e `docs-sep/SEGURANCA.md`.

**Nota sobre numeracao de migrations**:
- Confirmar sempre o proximo numero livre em `src/main/resources/db/migration`.
- Apos Sprint 19 mergeada, a Sprint 20 deve provavelmente iniciar em `V47`.
- Se houver hotfix paralelo em `develop`, reservar o numero real da branch e registrar risco de conflito de migration.

**Fora de escopo**:
- Desembolso automatico sem operador.
- Split Pix, devolucao Pix, disputa/estorno ou gestao avancada de chaves.
- Pix recebimento e conciliacao automatica de parcela (Sprint 21).
- Tela web/mobile de Pix.
- Validacao real contra sandbox Celcoin sem credenciais fornecidas.
- Persistir payload bruto, chave Pix em claro ou dados bancarios sensiveis desnecessarios.

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
- `clean-architecture`: dominio `pix` protegido de HTTP/JPA/Celcoin; cross-module access via ports; adapters na infrastructure; DTOs Celcoin nunca entram no dominio.

---

## Decisoes tecnicas da Sprint 20

- **Desembolso assistido**: apenas operador `FINANCEIRO` ou `ADMIN` dispara desembolso; `BACKOFFICE` pode acompanhar/reprocessar quando autorizado pelo fluxo de reprocesso, mas nao deve iniciar desembolso novo por conta propria.
- **Step-up estrito**: endpoint de solicitacao exige `X-Step-Up-Token`. Nao criar bypass para MFA ausente; se a base atual permitir bypass, tratar como precheck bloqueante antes da Task 20.2.
- **Idempotencia de comando**: `Idempotency-Key` obrigatoria no endpoint de solicitacao. Reapresentacao com mesmo contrato/valor/destino retorna a transferencia existente; reapresentacao conflitando payload deve retornar 409.
- **Contrato como gate de negocio**: desembolso so e permitido para contrato `ASSINADO`, com agenda de cobranca existente e sem transferencia Pix ativa/concluida para o mesmo contrato.
- **Ports de leitura cruzada**: `pix.application` define ports de elegibilidade; adapters ficam em `pix.infrastructure.adapter.<modulo>` e leem repositorios/use cases existentes sem expor entidades internas ao dominio Pix.
- **Provider Pattern estrito**: `PixProvider` recebe `ComandoTransferenciaPix` e `idempotencyKey`; adapter Celcoin traduz para o contrato externo.
- **Minimizacao de dados**: chave Pix pode trafegar no DTO web e no comando do provider, mas nao deve ser persistida em claro. Persistir, no maximo, tipo/mascara/hash se necessario para auditoria/idempotencia.
- **Status provider e webhook convergem no dominio**: consulta manual/status e webhook `STATUS_TRANSFERENCIA` devem atualizar a mesma `PixTransferencia` com transicoes idempotentes.
- **Backoffice por excecao**: falhas tecnicas ou status falho geram item operacional e trilha de auditoria; sucesso nao deve criar ruído operacional.

---

## Protocolo de breakpoints recomendado

```text
C1 = 20.0 + 20.1
Prechecks + contrato de elegibilidade por ports

C2 = 20.2
Persistencia complementar + use case de solicitar desembolso assistido

C3 = 20.3
Provider call + status/transicoes + webhook STATUS_TRANSFERENCIA

C4 = 20.4
Backoffice + auditoria + reprocesso provider

C5 = 20.5 + 20.6
REST/OpenAPI/tests integrados + docs/collections/PR description
```

- C1 evita contaminar o modulo `pix` com acesso direto a repositorios de outros modulos.
- C2 isola a regra mais sensivel: contrato elegivel + idempotencia + step-up.
- C3 isola o contato externo com PixProvider e atualizacao por status.
- C4 isola operacao assistida, auditoria e reprocesso.
- 20.6 e gate documental; nao conta como task de implementacao.

---

## Task 20.0 - Prechecks da Sprint 20

**Objetivo**: garantir base Git correta, confirmar contratos reais existentes e validar que step-up esta pronto para operacoes sensiveis antes de implementar desembolso.

**Esforco**: 1-2 horas.

### Step 020.0.1 - Conferir estado Git do `sep-api`

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
- Sprint 19 presente em `develop` (`12ca083` ou commit equivalente do PR #73).
- Se houver mudancas locais, identificar se sao do usuario; nao reverter.

### Step 020.0.2 - Criar branch da sprint

**Comandos**:
```bash
cd <sep-api-root>
git switch develop
git pull --ff-only
git switch -c feature/sprint-20-pix-desembolso-assistido
```

**Verificacao**:
- Branch criada a partir de `develop` atualizado.
- Se `git pull --ff-only` falhar, abortar e avisar o usuario.

### Step 020.0.3 - Rodar baseline backend

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

### Step 020.0.4 - Mapear contratos e pontos de integracao

**Comandos**:
```bash
cd <sep-api-root>
find src/main/java/com/dynamis/sep_api/pix -type f | sort
find src/main/java/com/dynamis/sep_api/contratos -type f | sort
find src/main/java/com/dynamis/sep_api/cobranca -type f | sort
find src/main/java/com/dynamis/sep_api/escrow -type f | sort
grep -R "RequireStepUp\|X-Step-Up-Token\|StepUp" -n src/main/java src/test/java
grep -R "ASSINADO\|AgendaPagamento\|PixTransferencia\|TipoChamadaProvider" -n src/main/java src/test/java
find src/main/resources/db/migration -maxdepth 1 -type f | sort | tail
```

**Verificacao**:
- Estado `ASSINADO` de contrato confirmado.
- Repositorios/ports para agenda de cobranca e contrato identificados.
- `PixTransferencia` e `PixProvider` da Sprint 19 confirmados.
- Proximo numero de migration confirmado.
- Enforcement de step-up server-side confirmado.

### Step 020.0.5 - Gate de step-up estrito

**Checklist bloqueante**:
- Endpoint sensivel novo deve usar o mesmo mecanismo server-side de step-up usado por senha, contrato/cobranca/backoffice sensiveis.
- Sem `permitAll`, sem bypass por profile e sem fallback que aceite operador sem MFA/step-up.
- Teste deve provar:
  - sem `X-Step-Up-Token` -> 403;
  - token valido + role autorizada -> segue para use case;
  - role nao autorizada -> 403 mesmo com step-up.

### Definicao de pronto da Task 20.0
- [ ] Branch correta criada.
- [ ] Baseline backend executado e registrado.
- [ ] Pontos de contrato/cobranca/escrow/pix mapeados.
- [ ] Step-up estrito confirmado ou bloqueio registrado.
- [ ] Proximo numero de migration confirmado.

---

## Task 20.1 - Ports e validadores de elegibilidade de desembolso

**Objetivo**: criar a fronteira de leitura que permite ao modulo `pix` validar elegibilidade de desembolso sem acessar diretamente entidades internas de `contratos`, `cobranca`, `credito` ou `escrow`.

**Pre-requisito**: Task 20.0 concluida.

**Esforco**: 1-1.5 dia.

**Arquivos principais esperados**:
- `pix/application/port/out/ContratoDesembolsoQueryPort.java`
- `pix/application/port/out/CobrancaDesembolsoQueryPort.java`
- `pix/application/port/out/EscrowDesembolsoQueryPort.java`
- DTOs de leitura em `pix/application/port/out/dto/*DesembolsoView.java`
- adapters em:
  - `pix/infrastructure/adapter/contratos/*`
  - `pix/infrastructure/adapter/cobranca/*`
  - `pix/infrastructure/adapter/escrow/*`
- testes unitarios dos validadores.

**Contrato de elegibilidade minimo**:
- Contrato existe.
- Contrato esta `ASSINADO`.
- Contrato referencia proposta/tomador/valor financiado suficientes para desembolso.
- Agenda de cobranca existe para o contrato.
- Nao existe transferencia Pix ativa ou concluida para o mesmo contrato.
- Escrow/wallet necessaria para a operacao existe e esta em estado operacional aceitavel; se a base atual nao tiver external id suficiente, documentar gap e bloquear Celcoin real.

**Sugestao de DTOs internos**:
```java
public record ContratoDesembolsoView(
        UUID contratoId,
        UUID propostaId,
        UUID tomadorId,
        BigDecimal valorDesembolso,
        boolean assinado) {}

public record AgendaDesembolsoView(UUID contratoId, UUID agendaId, int numeroParcelas) {}

public record EscrowDesembolsoView(
        UUID propostaId,
        UUID walletId,
        String walletExternalId,
        boolean operacional) {}
```

**Regras de arquitetura**:
- `pix.application` depende apenas das ports.
- `pix.infrastructure.adapter.<modulo>` pode traduzir consultas usando repositories/use cases do modulo alvo.
- O dominio `pix` nao importa `Contrato`, `AgendaPagamento`, `Wallet` ou entities de outros modulos.
- Se um modulo ja expuser port publico apropriado, reutilizar; se nao, criar adapter de leitura local no modulo `pix.infrastructure`.

### Definicao de pronto da Task 20.1
- [ ] Ports de elegibilidade criadas em `pix.application.port.out`.
- [ ] Adapters de leitura implementados sem vazar entidades para application/domain.
- [ ] Validador de elegibilidade cobre contrato assinado, agenda existente, ausencia de duplicidade e escrow operacional.
- [ ] Testes unitarios cobrem elegivel e negacoes principais.

---

## Task 20.2 - Solicitar desembolso assistido com idempotencia

**Objetivo**: implementar o use case que cria/retorna a transferencia Pix de desembolso para um contrato elegivel, exigindo operador autorizado, step-up e `Idempotency-Key`.

**Pre-requisito**: Task 20.1 concluida.

**Esforco**: 1.5-2 dias.

**Arquivos principais esperados**:
- `pix/application/usecase/SolicitarDesembolsoPixUseCase.java`
- command/response de application em `pix/application/dto/*`
- evolucao de `PixTransferencia` para carregar referencias de desembolso.
- migration `Vxx__evoluir_pix_transferencia_desembolso.sql`
- `PixTransferenciaRepository` com consultas por contrato/status/idempotency key.
- testes de dominio, use case e repository.

**Schema esperado na evolucao de `pix_transferencia`**:
- `contrato_id UUID`
- `proposta_id UUID`
- `tomador_id UUID`
- `tipo_transferencia VARCHAR(40)` ou equivalente (`DESEMBOLSO_CONTRATO`)
- `chave_destino_hash VARCHAR(64)` opcional, se usado para consistencia idempotente.
- `chave_destino_mascara VARCHAR(80)` opcional, se necessario para resposta/auditoria.
- indice por `(contrato_id, status)`.
- unique parcial para impedir mais de uma transferencia ativa/concluida por contrato.

**Regras de idempotencia**:
- Header `Idempotency-Key` obrigatorio.
- Mesmo key + mesmo payload retorna a transferencia existente.
- Mesmo key + payload divergente retorna 409.
- Contrato com transferencia `CRIADA`, `SOLICITADA`, `PROCESSANDO` ou `CONCLUIDA` nao aceita nova solicitacao.
- Nova tentativa para transferencia `FALHOU` deve exigir nova `Idempotency-Key`, salvo se houver retentativa via backoffice explicitamente implementada.

**Minimizacao de dados**:
- Nao persistir chave Pix destino em claro.
- Se a consistencia idempotente exigir comparar destino, persistir hash SHA-256 normalizado.
- Resposta pode exibir apenas mascara, nunca chave completa.

**Comando de use case sugerido**:
```java
public record SolicitarDesembolsoPixCommand(
        UUID contratoId,
        BigDecimal valor,
        String chavePixDestino,
        String idempotencyKey,
        UUID operadorId,
        String correlationId) {}
```

### Definicao de pronto da Task 20.2
- [ ] Use case de solicitacao criado.
- [ ] Migration forward-only criada com numero correto.
- [ ] `PixTransferencia` evoluida sem persistir chave Pix em claro.
- [ ] Duplicidade por contrato e idempotency key coberta por constraints/testes.
- [ ] Testes cobrem sucesso, contrato nao assinado, sem agenda, duplicado e payload conflitante.

---

## Task 20.3 - Integrar envio e consulta via `PixProvider`

**Objetivo**: conectar o use case de desembolso ao `PixProvider`, propagar idempotency key/correlation id e atualizar status da transferencia por resposta do provider ou consulta posterior.

**Pre-requisito**: Task 20.2 concluida.

**Esforco**: 1.5-2 dias.

**Arquivos principais esperados**:
- `pix/application/usecase/ConsultarStatusDesembolsoPixUseCase.java`
- evolucao de `SolicitarDesembolsoPixUseCase`.
- evolucao de `FakePixProvider` para cenarios de desembolso.
- evolucao de `CelcoinPixProvider` e WireMock ITs quando necessario.
- eventos de dominio:
  - `PixTransferenciaSolicitadaEvent`
  - `PixTransferenciaConcluidaEvent`
  - `PixTransferenciaFalhouEvent`

**Fluxo esperado de solicitacao**:
```text
REST controller
  -> valida role + step-up + Idempotency-Key
  -> SolicitarDesembolsoPixUseCase
       -> valida elegibilidade por ports
       -> cria PixTransferencia CRIADA em tx local
       -> chama PixProvider.solicitarTransferencia(...)
       -> marca SOLICITADA / PROCESSANDO / CONCLUIDA / FALHOU conforme resposta
       -> publica evento de dominio
       -> retorna response sem dados sensiveis
```

**Tratamento de falhas**:
- Timeout/5xx/provider exception marca transferencia `FALHOU` ou mantem estado recuperavel conforme semantica atual; registrar decisao no checkpoint.
- Se o provider retorna id externo antes de status final, persistir `externalId`.
- Nunca apagar transferencia criada por falha externa; rastreabilidade prevalece.
- Retentativa automatica fora de Resilience4j nao entra nesta sprint.

**Consulta/status**:
- Endpoint/use case consulta `PixProvider.consultarTransferencia(externalId, correlationId)` quando houver `externalId`.
- Status provider atualiza `PixTransferencia` idempotentemente.
- Status terminal repetido nao deve falhar.

**Verificacao sugerida**:
```bash
cd <sep-api-root>
./gradlew test --tests "*SolicitarDesembolsoPix*"
./gradlew test --tests "*ConsultarStatusDesembolsoPix*"
./gradlew test --tests "*FakePixProvider*"
./gradlew test --tests "*CelcoinPixProvider*"
```

### Definicao de pronto da Task 20.3
- [ ] `PixProvider.solicitarTransferencia` usado pelo use case.
- [ ] Idempotency-Key propagada ate o provider.
- [ ] Status de resposta e consulta atualizam `PixTransferencia`.
- [ ] Falhas de provider deixam trilha rastreavel.
- [ ] Fake e WireMock cobrem sucesso, processamento, falha e erro transitorio.

---

## Task 20.4 - Webhook de status, backoffice e reprocesso provider

**Objetivo**: fazer eventos de status Pix e falhas de desembolso alimentarem operacao assistida, com reprocesso seguro quando houver handler real.

**Pre-requisito**: Task 20.3 concluida.

**Esforco**: 1-1.5 dia.

**Arquivos principais esperados**:
- evolucao de `ProcessarWebhookPixUseCase` para `STATUS_TRANSFERENCIA`.
- listener de falha/conclusao para backoffice.
- `PixTransferenciaObjetoOriginalAdapter` ou equivalente, se necessario.
- `PixProviderRetentativaStrategy` em `backoffice/infrastructure/adapter/reprocesso/strategy`.
- evolucao de `TipoChamadaProvider` com `PIX_TRANSFERENCIA`, se o reprocesso real for implementado.
- testes de webhook/status/backoffice/reprocesso.

**Regras de webhook de status**:
- Evento `STATUS_TRANSFERENCIA` com `externalId` conhecido atualiza a transferencia correspondente.
- Evento duplicado segue idempotente.
- Evento para `externalId` desconhecido vira `IGNORADO` ou `FALHOU` com motivo documentado; nao deve gerar 500.
- Payload bruto continua fora da persistencia.

**Backoffice**:
- Falha de transferencia gera item de fila operacional com tipo adequado.
- Se nao houver enum especifico, usar `OUTRO` apenas como fallback documentado; preferir evoluir `TipoItemFila` se fizer sentido.
- Item deve referenciar `PixTransferencia` como objeto original se houver adapter.
- Conclusao de transferencia pode resolver/evitar item, mas nao deve criar item novo.

**Reprocesso provider**:
- Se houver `externalId`, strategy pode consultar status novamente via `PixProvider`.
- Reenviar transferencia ao provider so e permitido se houver dados suficientes sem violar minimizacao de chave Pix. Se a chave completa nao for persistida, nao reenviar; orientar nova solicitacao assistida com nova chave/idempotency key.
- Anti-abuso 3/24h do backoffice deve continuar valendo.

### Definicao de pronto da Task 20.4
- [ ] Webhook `STATUS_TRANSFERENCIA` atualiza `PixTransferencia`.
- [ ] Falhas geram item operacional rastreavel.
- [ ] Reprocesso provider Pix implementado apenas para operacao segura.
- [ ] `BACKOFFICE` nao ganha permissao para iniciar desembolso novo.
- [ ] Testes cobrem webhook conhecido/desconhecido, item de fila e reprocesso.

---

## Task 20.5 - REST, OpenAPI, auditoria e regressao E2E

**Objetivo**: expor endpoints de desembolso assistido, documentar contratos OpenAPI, registrar auditoria reforcada e validar smoke ponta a ponta com provider fake.

**Pre-requisito**: Task 20.4 concluida.

**Esforco**: 1-1.5 dia.

**Endpoints sugeridos**:
- `POST /api/v1/pix/desembolsos`
  - roles: `FINANCEIRO` ou `ADMIN`
  - exige `Idempotency-Key`
  - exige `X-Step-Up-Token`
  - request: `contratoId`, `valor`, `chavePixDestino`
  - response: dados da transferencia sem chave Pix completa.
- `GET /api/v1/pix/desembolsos/{id}`
  - roles: `FINANCEIRO`, `ADMIN` ou `BACKOFFICE` para consulta operacional.
- `POST /api/v1/pix/desembolsos/{id}/status`
  - roles: `FINANCEIRO`, `ADMIN` ou `BACKOFFICE` + step-up se chamar provider externo; se apenas leitura local, documentar decisao.

**Arquivos principais esperados**:
- `pix/web/controller/PixDesembolsoController.java`
- DTOs em `pix/web/dto/*`
- mapper web, se houver padrao local no modulo.
- `PixDesembolsoAuditListener`.
- migration para ampliar `audit_log_seguranca` se novos tipos forem adicionados.
- `OpenApiConfigTest` atualizado quando necessario.
- IT/smoke REST com RestAssured/MockMvc conforme padrao local.

**Eventos de auditoria esperados**:
- `PIX_TRANSFERENCIA_SOLICITADA`
- `PIX_TRANSFERENCIA_CONCLUIDA`
- `PIX_TRANSFERENCIA_FALHOU`
- `PIX_TRANSFERENCIA_STATUS_CONSULTADO` se consulta externa for endpoint sensivel.

**Smoke E2E minimo com Fake provider**:
```text
criar/obter usuario FINANCEIRO ou ADMIN
  -> obter step-up token
  -> garantir contrato ASSINADO + agenda existente no setup de teste
  -> POST /api/v1/pix/desembolsos com Idempotency-Key
  -> 201/200 com status SOLICITADA/PROCESSANDO/CONCLUIDA conforme fake
  -> repetir mesmo request/key -> retorno idempotente
  -> repetir key com payload divergente -> 409
  -> GET /api/v1/pix/desembolsos/{id}
  -> validar audit sem chave Pix em claro
```

**Comandos sugeridos**:
```bash
cd <sep-api-root>
./gradlew test --tests "*PixDesembolso*"
./gradlew test --tests "*Pix*IT"
./gradlew test --tests "*OpenApiConfigTest"
./gradlew test
```

### Definicao de pronto da Task 20.5
- [ ] Endpoints REST criados e protegidos por role/step-up.
- [ ] OpenAPI atualizado.
- [ ] Auditoria reforcada sem dados sensiveis.
- [ ] Smoke com Fake provider cobre solicitacao, replay idempotente e conflito.
- [ ] Regressao Pix/Backoffice/Contratos/Cobranca executada ou bloqueio registrado.

---

## Task 20.6 - Docs, collections e fechamento

**Objetivo**: atualizar documentacao e artefatos operacionais apos a implementacao estar validada.

**Pre-requisito**: Tasks 20.1-20.5 concluidas e revisadas.

**Esforco**: 0.5 dia.

**Arquivos esperados**:
- `docs-SEP/repos/sep-api/PIX.md`
- `docs-SEP/repos/sep-api/CONTRATOS.md` se a pre-condicao de desembolso mudar.
- `docs-SEP/repos/sep-api/COBRANCA.md` se a relacao agenda/desembolso mudar.
- `docs-SEP/repos/sep-api/BACKOFFICE.md` se novo tipo/strategy de reprocesso for entregue.
- `docs-SEP/docs-sep/SEGURANCA.md` se houver novo endpoint/step-up documentavel.
- `docs-SEP/docs-sep/PRD-FASE-3.md`
- `docs-SEP/docs-sep/CONTEXT-PARTE-2.md`
- `docs-SEP/docs-sep/RELATORIO-ACOMPANHAMENTO-ENTREGAS-FASE-3.md`
- `docs-SEP/docs-sep/RELATORIO-ACOMPANHAMENTO-ENTREGAS-FASE-3.html`
- `docs-SEP/AI-ROADMAP.md`
- Collections Postman/Insomnia para desembolso Pix.
- `docs-SEP/repos/sep-api/SPRINT-20-PR.md` ao final da sprint.

**Checklist**:
- Documentar endpoints de desembolso, headers obrigatorios, roles e step-up.
- Documentar idempotencia e politica de replay/conflito.
- Documentar quais dados Pix sao persistidos e quais sao apenas trafegados ao provider.
- Documentar status/transicoes e relacionamento com webhook `STATUS_TRANSFERENCIA`.
- Documentar backoffice/reprocesso apenas se handler real foi implementado.
- Atualizar relatorio Fase 3 com status real da Sprint 20 apenas apos fechamento/merge confirmado.
- Remover `SPRINT-19-PR.md` temporario se ele ja tiver sido usado e o usuario aprovar a limpeza.

### Definicao de pronto da Task 20.6
- [ ] `PIX.md` atualizado com desembolso assistido.
- [ ] Docs afetadas atualizadas quando comportamento mudar.
- [ ] PRD/CONTEXT/relatorio Fase 3 atualizados com status real.
- [ ] AI-ROADMAP revisado.
- [ ] Collections atualizadas quando aplicavel.
- [ ] PR description temporaria criada para Sprint 20.
- [ ] Checkpoint final pronto para commit/PR.

---

## Definition of Done da Sprint 20

- [ ] Desembolso Pix assistido implementado para contrato elegivel.
- [ ] Endpoint de solicitacao exige operador autorizado, step-up e `Idempotency-Key`.
- [ ] Elegibilidade valida contrato `ASSINADO`, agenda existente, escrow operacional e ausencia de transferencia duplicada.
- [ ] `PixProvider` e usado para solicitar/consultar transferencia.
- [ ] Replays idempotentes e conflitos de payload sao tratados.
- [ ] Status de provider/webhook atualiza `PixTransferencia`.
- [ ] Falhas ficam rastreaveis em auditoria e backoffice.
- [ ] Nenhuma chave Pix ou payload sensivel e persistido em claro.
- [ ] OpenAPI, collections e docs refletem os contratos novos.
- [ ] Testes proporcionais verdes; bloqueios ambientais registrados.
- [ ] Migrations aplicam em banco limpo e banco existente.

