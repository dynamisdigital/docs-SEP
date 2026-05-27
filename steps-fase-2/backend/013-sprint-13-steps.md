# Steps - Sprint 13 - Cobranca (inadimplencia e recuperacao)

**Spec de origem**: [`specs/fase-2/013-sprint-13-cobranca-inadimplencia.md`](../../specs/fase-2/013-sprint-13-cobranca-inadimplencia.md)

**Status**: a implementar.

**Objetivo geral**: estender o modulo `cobranca` para workflows de inadimplencia, notificacoes transacionais, eventos de cobranca e renegociacao basica de parcelas atrasadas.

**Esforco total estimado**: 8-12 dias de Dev Senior.

**Repo de destino**:
- `sep-api`: backend Spring Boot, unico repo de codigo alterado nesta sprint.
- `docs-SEP`: documentacao pode ser editada no working tree quando necessario, mas operacao git continua manual.

**Branch sugerida**:
- `feature/sprint-13-cobranca-inadimplencia`

**Pre-requisitos globais**:
- Sprint 12 concluida, revisada e mergeada em `develop`.
- `sep-api` em `develop` atualizado a partir de `origin/develop`.
- Modulo `cobranca` com `AgendaPagamento`, `ParcelaCobranca`, `Recebimento`, `MarcarParcelaAtrasadaJob` e `ParcelaAtrasouEvent`.
- `StatusParcela.INADIMPLENTE` ja reservado pela Sprint 12.
- Step-up authentication da Sprint 5 funcional (`@RequireStepUp` + header `X-Step-Up-Token`).
- Role `FINANCEIRO` disponivel.
- `audit_log_seguranca` funcional e extensivel.
- ADRs 0004, 0007, 0008 e 0014 vigentes.

**Nota sobre ADR gate**:
- O spec 013 referencia `ADR 0013` como estrategia de notificacoes.
- O numero `0013` ja existe em `docs-SEP/adr/0013-provedor-de-assinatura-digital.md`.
- Nao sobrescrever nem renomear a ADR 0013 atual.
- Usar [`ADR 0014 - Estrategia de Notificacoes Transacionais`](../../adr/0014-estrategia-de-notificacoes-transacionais.md) como gate da Sprint 13.

**Fora de escopo**:
- Cobranca juridica, negativacao, cessao de credito e bureau.
- Pix, boleto e conciliacao automatica.
- WhatsApp, push mobile e marketing.
- Telas web/mobile.
- Backoffice operacional completo; Sprint 14 consome eventos desta sprint.

**Protocolo obrigatorio por Task**:
- Implementar somente a Task liberada pelo usuario.
- Ao concluir implementacao e verificacao da Task, parar em checkpoint pre-commit com arquivos alterados, testes executados, riscos e sugestao de commit.
- Aguardar `commit` ou aprovacao equivalente antes de stage/commit.
- Depois do commit principal, rodar `chown -R mauricio:mauricio .git .claude` no `sep-api`.
- Fazer exatamente 1 code review automatizado da Task.
- Se houver hotfix, implementar, parar em novo checkpoint pre-commit, aguardar aprovacao e commitar; nao rodar novo review automatizado salvo pedido explicito.
- Ao final da Task, pausar para review manual do usuario. Nao iniciar a proxima Task sem ordem explicita.

---

## Ordem de execucao recomendada

```text
13.0 (prechecks)
  |
  v
13.1 (ADR 0014 gate + dependencias de notificacao)
  |
  v
13.2 (dominio + migrations inadimplencia)
  |
  +--> 13.3 (NotificationProvider + templates)
  |
  v
13.4 (workflow de cobranca + listener/job)
  |
  +--> 13.5 (marcacao INADIMPLENTE 90 dias)
  |
  v
13.6 (renegociacao)
  |
  v
13.7 (REST + DTOs + OpenAPI)
  |
  v
13.8 (auditoria reforcada)
  |
  v
13.9 (IT/E2E)
  |
  v
13.10 (documentacao + collections + validacao final)
```

- 13.1 eh gate real: nao implementar adapter real sem ADR aceita.
- 13.2 estabiliza estados, entidades, repositories e migrations.
- 13.3 pode avancar depois da ADR; `LogNotificationProvider` deve funcionar antes de Zenvia.
- 13.4 consome `ParcelaAtrasouEvent` e cria historico idempotente de notificacoes.
- 13.5 marca `INADIMPLENTE` e publica evento para Sprint 14.
- 13.6 deve fechar transicoes de renegociacao antes da borda REST.
- 13.8 deve estar pronta antes dos ITs para validar audit log.
- 13.10 so marca PRD como executado apos implementacao validada e mergeada.

---

## Task 13.0 - Prechecks da Sprint 13

**Objetivo**: garantir que a sprint nasce de `develop` atualizado, com Sprint 12 integrada e baseline verde.

**Esforco**: 1-2 horas.

### Step 013.0.1 - Conferir estado Git do `sep-api`

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

### Step 013.0.2 - Criar branch da sprint

**Comandos**:
```bash
cd <sep-api-root>
git switch develop
git pull --ff-only
git switch -c feature/sprint-13-cobranca-inadimplencia
```

**Verificacao**:
- Branch criada a partir de `develop` atualizado.
- Se `git pull --ff-only` falhar, abortar e avisar o usuario.

### Step 013.0.3 - Rodar baseline backend

**Comandos**:
```bash
cd <sep-api-root>
./gradlew clean test
./gradlew bootJar
```

**Verificacao**:
- Suite passa antes de qualquer alteracao.
- Se os testes dependem de PostgreSQL local, subir Docker Compose conforme README do `sep-api`.

### Step 013.0.4 - Conferir pontos de extensao

**Comandos**:
```bash
cd <sep-api-root>
find src/main/resources/db/migration -maxdepth 1 -type f | sort
grep -R "enum StatusParcela" -n src/main/java/com/dynamis/sep_api/cobranca
grep -R "ParcelaAtrasouEvent" -n src/main/java/com/dynamis/sep_api/cobranca
grep -R "MarcarParcelaAtrasadaJob" -n src/main/java/com/dynamis/sep_api/cobranca
grep -R "CobrancaAuditListener" -n src/main/java/com/dynamis/sep_api/cobranca
grep -R "RequireStepUp" -n src/main/java/com/dynamis/sep_api
grep -R "TemplateEngine" -n src/main/java/com/dynamis/sep_api
grep -R "TipoEventoSeguranca" -n src/main/java/com/dynamis/sep_api
```

**Verificacao**:
- Proximo numero livre de migration confirmado. Baseline esperada apos Sprint 12: `V29`.
- `StatusParcela.INADIMPLENTE` existe; `EM_NEGOCIACAO` e `RENEGOCIADA` ainda precisam ser adicionados.
- `ParcelaAtrasouEvent` tem payload suficiente para escalar cobranca.
- Padrao de audit log e `@RequireStepUp` identificado.
- Thymeleaf standalone identificado para reuso em templates de notificacao.

### Step 013.0.5 - Confirmar parametros de cobranca ativa

**Checklist**:
- Workflow default: dias 0, 5, 15, 30, 60 e 90.
- Dia 90 marca parcela `INADIMPLENTE`.
- Renegociacao expira em 7 dias.
- Falha de notificacao nao bloqueia transicao de dominio critica.
- `LogNotificationProvider` eh default em `dev`, `test` e `local-wiremock`.
- Provider real de SMS: Zenvia, conforme ADR 0014.

### Definicao de pronto da Task 13.0
- [ ] Branch correta criada.
- [ ] Baseline backend verde.
- [ ] Proximo numero de migration confirmado.
- [ ] Pontos de extensao de cobranca, audit, step-up e templates identificados.
- [ ] Parametros default confirmados ou risco registrado.

---

## Task 13.1 - ADR 0014 e dependencias de notificacao

**Objetivo**: validar o gate de notificacoes e preparar dependencias/properties sem ainda enviar mensagens reais.

**Pre-requisito**: Task 13.0 concluida.

**Esforco**: 0,5-1 dia.

**Arquivos principais**:
- `docs-SEP/adr/0014-estrategia-de-notificacoes-transacionais.md`
- `build.gradle`
- `src/main/resources/application.yml`
- `src/main/resources/application-dev.yml`
- `src/main/resources/application-test.yml`

### Step 013.1.1 - Validar ADR 0014

**Regras**:
- Confirmar status `Aceito`.
- Confirmar decisao: SMTP/Spring Mail para email, Zenvia para SMS, Thymeleaf para templates, Log provider para dev/test.
- Registrar que a spec citava ADR 0013, mas 0013 ja pertence a assinatura digital.

### Step 013.1.2 - Adicionar dependencia de email

**Mudanca esperada**:
- Incluir `org.springframework.boot:spring-boot-starter-mail` no `build.gradle`.
- Nao remover Thymeleaf standalone usado por contratos.

### Step 013.1.3 - Criar properties de notificacoes

**Configuracao planejada**:
```yaml
app:
  notificacoes:
    provider: log
    remetente-email: ${APP_NOTIFICACOES_REMETENTE_EMAIL:no-reply@sep.local}
    zenvia:
      base-url: ${ZENVIA_BASE_URL:https://api.zenvia.com}
      api-token: ${ZENVIA_API_TOKEN:}
      from: ${ZENVIA_SMS_FROM:SEP}
      timeout-ms: 5000
```

**Regras**:
- `application-test.yml` deve forcar provider `log`.
- Credenciais reais ficam sempre em env vars.
- Nao colocar token real em arquivo versionado.

### Definicao de pronto da Task 13.1
- [ ] ADR 0014 aceita e referenciada.
- [ ] Dependencia de mail adicionada.
- [ ] Properties default seguras criadas.
- [ ] `./gradlew test` passa.

---

## Task 13.2 - Dominio, entidades e migrations de inadimplencia

**Objetivo**: criar o nucleo persistente de workflow, eventos e renegociacao.

**Pre-requisito**: Task 13.1 concluida.

**Esforco**: 1-2 dias.

**Arquivos principais**:
- `cobranca/domain/model/WorkflowCobranca.java`
- `cobranca/domain/model/EventoCobranca.java`
- `cobranca/domain/model/Renegociacao.java`
- `cobranca/domain/vo/StatusParcela.java`
- `cobranca/domain/vo/StatusRenegociacao.java`
- `cobranca/domain/event/EventoCobrancaRegistradoEvent.java`
- `cobranca/domain/event/ParcelaInadimplenteEvent.java`
- `cobranca/domain/event/RenegociacaoPropostaEvent.java`
- `cobranca/domain/event/RenegociacaoAceitaEvent.java`
- `cobranca/domain/event/RenegociacaoRecusadaEvent.java`
- `cobranca/infrastructure/persistence/WorkflowCobrancaRepository.java`
- `cobranca/infrastructure/persistence/EventoCobrancaRepository.java`
- `cobranca/infrastructure/persistence/RenegociacaoRepository.java`
- `src/main/resources/db/migration/V<n>__criar_tabelas_inadimplencia.sql`

### Step 013.2.1 - Evoluir `StatusParcela`

**Estados esperados**:
```text
PENDENTE
PARCIALMENTE_PAGA
PAGA
ATRASADA
INADIMPLENTE
EM_NEGOCIACAO
RENEGOCIADA
```

**Regras**:
- `EM_NEGOCIACAO` nao permite recebimento manual comum.
- `RENEGOCIADA` eh final para a parcela antiga substituida.
- `INADIMPLENTE` nao permite recebimento comum nesta sprint; renegociacao deve ser o caminho operacional.
- Atualizar helpers `isFinal()` e `permiteRecebimento()`.

### Step 013.2.2 - Modelar `WorkflowCobranca`

**Campos minimos**:
- `id`, `nome`, `ativo`, `diaAtraso`, `notificacoes`, `flagContatoManual`, `escalonarParaBackoffice`, `marcarInadimplente`.

**Regras**:
- Workflow default vem de YAML e fica persistido para auditoria operacional.
- Apenas um workflow ativo por nome/etapa quando aplicavel.
- `diaAtraso` nao pode ser negativo.

### Step 013.2.3 - Modelar `EventoCobranca`

**Campos minimos**:
- `id`, `parcelaId`, `tipo`, `canal`, `template`, `status`, `diasAtraso`, `descricao`, `registradoPor`, `dataEvento`, auditoria quando aplicavel.

**Regras**:
- Deve registrar acao automatica e contato manual.
- Deve suportar idempotencia por parcela, dia de atraso, canal e template.
- Nao persistir corpo completo da mensagem com dados sensiveis.

### Step 013.2.4 - Modelar `Renegociacao`

**Campos minimos**:
- `id`, `parcelaOriginalId`, `agendaOriginalId`, `tomadorId`, `status`, `novoValor`, `novoVencimento`, `numeroParcelas`, `desconto`, `propostaPor`, `dataProposta`, `dataExpiracao`, `dataDecisao`, `justificativa`.

**Regras**:
- Nasce `PROPOSTA`.
- `ACEITA`, `RECUSADA` e `EXPIRADA` sao finais.
- Uma parcela nao pode ter duas renegociacoes abertas.
- Expiracao default: 7 dias.

### Step 013.2.5 - Criar migration de inadimplencia

**Tabelas esperadas**:
- `workflow_cobranca`
- `evento_cobranca`
- `renegociacao`

**Alteracoes esperadas**:
- Ampliar check constraint de `parcela_cobranca.status` com `EM_NEGOCIACAO` e `RENEGOCIADA`.

**Constraints minimas**:
- FKs sem CASCADE.
- UNIQUE parcial para nome/etapa ativa de workflow quando aplicavel.
- UNIQUE parcial para renegociacao aberta por parcela.
- UNIQUE parcial para notificacao automatica por parcela/dia/canal/template quando aplicavel.

### Testes obrigatorios
- `StatusParcelaTest`
- `WorkflowCobrancaTest`
- `EventoCobrancaTest`
- `RenegociacaoTest`
- Repository tests para constraints principais.

### Definicao de pronto da Task 13.2
- [ ] Estados e transicoes modelados.
- [ ] Migrations aplicam em banco limpo.
- [ ] Constraints impedem duplicidades criticas.
- [ ] Testes de dominio e persistencia passam.

---

## Task 13.3 - NotificationProvider, adapters e templates

**Objetivo**: implementar a porta de notificacao e os adapters de email, SMS Zenvia e log.

**Pre-requisito**: Task 13.2 concluida.

**Esforco**: 1-2 dias.

**Arquivos principais**:
- `cobranca/application/port/out/NotificationProvider.java`
- `cobranca/application/port/out/dto/Notificacao.java`
- `cobranca/application/port/out/dto/CanalNotificacao.java`
- `cobranca/application/port/out/dto/ResultadoNotificacao.java`
- `cobranca/infrastructure/adapter/notification/LogNotificationProvider.java`
- `cobranca/infrastructure/adapter/notification/SmtpNotificationProvider.java`
- `cobranca/infrastructure/adapter/notification/ZenviaSmsNotificationProvider.java`
- `cobranca/infrastructure/adapter/notification/TemplateNotificacaoEngine.java`
- `cobranca/infrastructure/adapter/notification/NotificacaoProperties.java`
- `src/main/resources/templates/notificacoes/*.html`
- `src/main/resources/templates/notificacoes/*.txt`

### Step 013.3.1 - Criar contrato do provider

**Contrato minimo**:
- Entrada: `Notificacao(canal, destinatario, template, variaveis, correlationId)`.
- Saida: `ResultadoNotificacao(status, provider, idExterno, mensagemTecnica)`.

**Regras**:
- O port fala linguagem de dominio, nao DTO da Zenvia.
- Falhas tecnicas retornam resultado falho ou excecao de infraestrutura controlada; use case decide se bloqueia ou registra evento.

### Step 013.3.2 - Implementar `LogNotificationProvider`

**Regras**:
- Default em `dev`, `test` e `local-wiremock`.
- Loga metadados sem vazar corpo sensivel.
- Retorna sucesso tecnico deterministicamente para testes.

### Step 013.3.3 - Implementar email SMTP

**Regras**:
- Usar `JavaMailSender`.
- Renderizar template HTML via `TemplateNotificacaoEngine`.
- Remetente vem de property.
- Nao enviar email se destinatario estiver vazio ou invalido; retornar falha validavel.

### Step 013.3.4 - Implementar SMS Zenvia

**Regras**:
- Adapter com `RestClientFactory` existente quando possivel.
- Autenticacao por token via property.
- Resilience4j instance `zenvia-sms`.
- WireMock IT cobre URL, headers, payload, retry em 5xx e parsing de resposta.

### Step 013.3.5 - Criar templates iniciais

**Templates**:
- `cobranca-amigavel-email.html`
- `cobranca-firme-email.html`
- `cobranca-final-email.html`
- `cobranca-lembrete-sms.txt`
- `cobranca-firme-sms.txt`

**Regras**:
- Sem CPF/CNPJ, dados bancarios ou segredo.
- SMS curto e sem detalhes sensiveis.
- Linguagem respeitosa conforme `NOTIFICACOES.md`.

### Testes obrigatorios
- `LogNotificationProviderTest`
- `TemplateNotificacaoEngineTest`
- `SmtpNotificationProviderTest`
- `ZenviaSmsNotificationProviderIT`

### Definicao de pronto da Task 13.3
- [ ] Port e adapters implementados.
- [ ] Templates renderizam com variaveis minimas.
- [ ] Dev/test usam provider log.
- [ ] WireMock cobre Zenvia.
- [ ] Testes passam sem credenciais reais.

---

## Task 13.4 - Workflow de cobranca, listener e escalador diario

**Objetivo**: escalar cobranca conforme workflow ativo persistido, inicializado por YAML e executado de forma idempotente.

**Pre-requisito**: Tasks 13.2 e 13.3 concluidas.

**Esforco**: 1-2 dias.

**Arquivos principais**:
- `cobranca/application/usecase/EscalarCobrancaUseCase.java`
- `cobranca/application/listener/ParcelaAtrasouListener.java`
- `cobranca/application/job/EscaladorCobrancaJob.java`
- `cobranca/application/service/workflow/WorkflowCobrancaProperties.java`
- `cobranca/application/service/workflow/WorkflowCobrancaResolver.java`

### Step 013.4.1 - Criar properties do workflow

**Default YAML para seed/config de boot**:
```yaml
app:
  cobranca:
    workflow:
      dias-atraso:
        - dia: 0
          notificacoes: [email-amigavel]
        - dia: 5
          notificacoes: [email-amigavel, sms-lembrete]
        - dia: 15
          notificacoes: [email-firme, sms-firme]
        - dia: 30
          notificacoes: [email-firme, sms-firme]
          flag-contato-manual: true
        - dia: 60
          notificacoes: [email-final]
          escalonar-para-backoffice: true
        - dia: 90
          marcar-inadimplente: true
```

### Step 013.4.2 - Resolver workflow ativo

**Regras**:
- Carregar definicao ativa de `workflow_cobranca`.
- Em ambiente novo, seed inicial vem de `app.cobranca.workflow.dias-atraso`.
- Nao depender de alteracao manual em banco para rodar dev/test.

### Step 013.4.3 - Implementar `EscalarCobrancaUseCase`

**Regras**:
- Calcula dias de atraso com `Clock` injetado.
- Resolve etapa exata ou etapas vencidas ainda nao executadas, conforme desenho mais simples validado em teste.
- Nao envia mesma notificacao duas vezes para mesma parcela/dia/canal/template.
- Cada acao gera `EventoCobranca`.
- Falha de notificacao registra evento falho e nao duplica em retry do mesmo dia sem regra explicita.

### Step 013.4.4 - Implementar listener de `ParcelaAtrasouEvent`

**Regras**:
- `@TransactionalEventListener(AFTER_COMMIT)` + `@Transactional(REQUIRES_NEW)`.
- Dispara etapa dia 0.
- Nao falha o job da Sprint 12 se notificacao falhar; registra evento.

### Step 013.4.5 - Implementar `EscaladorCobrancaJob`

**Regras**:
- Job diario reavalia parcelas `ATRASADA`, `EM_NEGOCIACAO` quando fizer sentido, e futuramente `INADIMPLENTE` apenas para eventos.
- `@Scheduled` configuravel.
- Usar `Clock` injetado.
- Reexecucao no mesmo dia nao duplica eventos.

### Testes obrigatorios
- `EscalarCobrancaUseCaseTest`
- `ParcelaAtrasouListenerTest`
- `EscaladorCobrancaJobTest`

### Definicao de pronto da Task 13.4
- [ ] Workflow default configurado.
- [ ] Listener do dia 0 operacional.
- [ ] Job diario idempotente.
- [ ] Falhas de notificacao viram eventos, nao rollback indevido.

---

## Task 13.5 - Marcacao de parcela inadimplente

**Objetivo**: marcar parcelas com 90 dias de atraso como `INADIMPLENTE` e publicar evento para Sprint 14.

**Pre-requisito**: Tasks 13.2, 13.3 e 13.4 concluidas.

**Esforco**: 0,5-1 dia.

**Arquivos principais**:
- `cobranca/application/job/MarcarParcelaInadimplenteJob.java`
- `cobranca/domain/event/ParcelaInadimplenteEvent.java`

### Step 013.5.1 - Implementar transicao para `INADIMPLENTE`

**Regras**:
- Apenas `ATRASADA` com `dataVencimento <= hoje - 90 dias`.
- Transicao publica `ParcelaInadimplenteEvent`.
- Reexecucao nao republica evento para parcela ja `INADIMPLENTE`.

### Step 013.5.2 - Implementar job agendado

**Cron default**:
```text
0 30 2 * * *
```

**Regras**:
- Roda 30 minutos apos `MarcarParcelaAtrasadaJob`.
- Respeita property global de scheduling da cobranca.
- Notifica tomador e financeiro uma ultima vez, sem bloquear transicao se provider falhar.

### Testes obrigatorios
- `MarcarParcelaInadimplenteJobTest`

### Definicao de pronto da Task 13.5
- [ ] Parcelas 90+ dias viram `INADIMPLENTE`.
- [ ] Evento publicado uma unica vez.
- [ ] Notificacao final registrada em `EventoCobranca`.
- [ ] Teste controla `Clock`.

---

## Task 13.6 - Use cases de renegociacao

**Objetivo**: permitir proposta, aceite e recusa de renegociacao basica.

**Pre-requisito**: Tasks 13.2 e 13.3 concluidas.

**Esforco**: 1-2 dias.

**Arquivos principais**:
- `cobranca/application/usecase/IniciarRenegociacaoUseCase.java`
- `cobranca/application/usecase/AceitarRenegociacaoUseCase.java`
- `cobranca/application/usecase/RecusarRenegociacaoUseCase.java`
- `cobranca/application/job/ExpirarRenegociacaoJob.java` (se o escopo da Task permitir)

### Step 013.6.1 - Iniciar renegociacao

**Regras**:
- Endpoint futuro exige `ROLE_FINANCEIRO` + `@RequireStepUp`.
- Use case cria `Renegociacao` em `PROPOSTA`.
- Parcela envolvida muda para `EM_NEGOCIACAO`.
- Notifica tomador por email e SMS.
- Nao permite nova renegociacao aberta para a mesma parcela.

### Step 013.6.2 - Aceitar renegociacao

**Regras**:
- Tomador precisa ser owner e apresentar step-up na borda REST.
- Renegociacao precisa estar `PROPOSTA` e nao expirada.
- Parcela antiga muda para `RENEGOCIADA`.
- Nova `AgendaPagamento` substituta eh gerada para as novas condicoes.
- Publica `RenegociacaoAceitaEvent`.

### Step 013.6.3 - Recusar renegociacao

**Regras**:
- Tomador precisa ser owner.
- Renegociacao precisa estar `PROPOSTA`.
- Parcela volta ao status anterior: `ATRASADA` ou `INADIMPLENTE`.
- Publica `RenegociacaoRecusadaEvent`.

### Step 013.6.4 - Expirar renegociacao

**Regras**:
- Expira apos 7 dias sem decisao.
- Parcela volta ao status anterior.
- Job usa `Clock` injetado.

### Testes obrigatorios
- `IniciarRenegociacaoUseCaseTest`
- `AceitarRenegociacaoUseCaseTest`
- `RecusarRenegociacaoUseCaseTest`
- `ExpirarRenegociacaoJobTest` se o job for implementado nesta Task.

### Definicao de pronto da Task 13.6
- [ ] Proposta, aceite, recusa e expiracao modelados.
- [ ] Ownership validavel pelo controller/use case sem enumeracao indevida.
- [ ] Nova agenda substituta gerada no aceite.
- [ ] Eventos publicados para audit/backoffice.

---

## Task 13.7 - Endpoints REST, DTOs e OpenAPI

**Objetivo**: expor inadimplencia, contato manual e renegociacao via API.

**Pre-requisito**: Tasks 13.4, 13.5 e 13.6 concluidas.

**Esforco**: 1 dia.

**Arquivos principais**:
- `cobranca/web/controller/CobrancaController.java`
- `cobranca/web/dto/InadimplenciaResponse.java`
- `cobranca/web/dto/RegistrarContatoRequest.java`
- `cobranca/web/dto/IniciarRenegociacaoRequest.java`
- `cobranca/web/dto/RenegociacaoResponse.java`
- `cobranca/web/mapper/CobrancaWebMapper.java`

### Step 013.7.1 - Listar inadimplencia

**Endpoint**:
```text
GET /api/v1/cobranca/inadimplencia
```

**Auth**:
- `ROLE_FINANCEIRO` ou `ROLE_ADMIN`.

**Filtros**:
- `dias_atraso_min`
- `dias_atraso_max`
- `status`

### Step 013.7.2 - Registrar contato manual

**Endpoint**:
```text
POST /api/v1/cobranca/parcelas/{id}/contato
```

**Auth**:
- `ROLE_FINANCEIRO` ou `ROLE_ADMIN`.

**Regras**:
- Registra `EventoCobranca`.
- Nao altera status da parcela.

### Step 013.7.3 - Propor renegociacao

**Endpoint**:
```text
POST /api/v1/cobranca/parcelas/{id}/renegociacao
```

**Auth**:
- `ROLE_FINANCEIRO` ou `ROLE_ADMIN`.
- `@RequireStepUp`.

### Step 013.7.4 - Aceitar ou recusar renegociacao

**Endpoints**:
```text
PATCH /api/v1/cobranca/renegociacoes/{id}/aceite
PATCH /api/v1/cobranca/renegociacoes/{id}/recusa
```

**Auth**:
- Tomador owner.
- Aceite exige `@RequireStepUp`.
- Recusa nao exige step-up, salvo decisao futura.

### Step 013.7.5 - Documentar OpenAPI

**Regras**:
- `@Operation`, `@ApiResponses` e `@Schema` em todos os endpoints novos.
- Erros 400, 401, 403, 404 e 409 documentados onde aplicavel.

### Testes obrigatorios
- `CobrancaInadimplenciaControllerTest`
- Cenarios de auth, validation, step-up ausente, ownership e happy paths.

### Definicao de pronto da Task 13.7
- [ ] 5 endpoints expostos.
- [ ] DTOs com Bean Validation.
- [ ] OpenAPI completo.
- [ ] Controller tests verdes.

---

## Task 13.8 - Auditoria reforcada

**Objetivo**: registrar eventos sensiveis de inadimplencia, notificacao e renegociacao.

**Pre-requisito**: Tasks 13.4, 13.5 e 13.6 concluidas.

**Esforco**: 0,5-1 dia.

**Arquivos principais**:
- `identity/domain/vo/TipoEventoSeguranca.java` ou enum equivalente atual.
- `cobranca/application/listener/CobrancaAuditListener.java`
- `src/main/resources/db/migration/V<n>__ampliar_audit_seguranca_tipo_inadimplencia.sql`

### Step 013.8.1 - Ampliar tipos de audit

**Tipos novos**:
```text
NOTIFICACAO_ENVIADA
EVENTO_COBRANCA_REGISTRADO
PARCELA_INADIMPLENTE
RENEGOCIACAO_PROPOSTA
RENEGOCIACAO_ACEITA
RENEGOCIACAO_RECUSADA
```

### Step 013.8.2 - Atualizar listener

**Regras**:
- `@TransactionalEventListener(AFTER_COMMIT)` + `@Transactional(REQUIRES_NEW)`.
- Payload JSON via `ObjectMapper`.
- Nao vazar CPF/CNPJ, telefone completo, dados bancarios, token ou payload bruto da Zenvia.

### Testes obrigatorios
- `CobrancaAuditListenerTest`
- Teste especifico de payload sem dados proibidos.

### Definicao de pronto da Task 13.8
- [ ] Tipos novos aceitos por migration.
- [ ] Listener cobre eventos da Sprint 13.
- [ ] Falha de audit segue padrao ja existente do projeto.
- [ ] Testes de sanitizacao passam.

---

## Task 13.9 - Testes E2E e regressao

**Objetivo**: validar o fluxo completo de inadimplencia e renegociacao.

**Pre-requisito**: Tasks 13.1 a 13.8 concluidas.

**Esforco**: 1-2 dias.

**Arquivos principais**:
- `src/test/java/com/dynamis/sep_api/cobranca/web/InadimplenciaIT.java`
- `src/test/java/com/dynamis/sep_api/cobranca/web/RenegociacaoIT.java`

### Cenarios obrigatorios

- Parcela vence -> job da Sprint 12 marca `ATRASADA` -> listener envia notificacao via `LogNotificationProvider`.
- Dia 5 -> email + SMS; dia 15 -> notificacao firme; dia 30 -> flag contato manual.
- Dia 90 -> parcela marcada `INADIMPLENTE` e `ParcelaInadimplenteEvent` publicado.
- Notificacao nao duplica no mesmo dia.
- Financeiro propoe renegociacao -> tomador aceita -> nova agenda substituta.
- Financeiro propoe renegociacao -> tomador recusa -> parcela volta ao status original.
- Tomador tenta aceitar renegociacao sem step-up -> 403.
- Cliente nao-owner nao consegue aceitar/recusar renegociacao.

### Comandos de validacao

```bash
cd <sep-api-root>
./gradlew test --tests "*InadimplenciaIT"
./gradlew test --tests "*RenegociacaoIT"
./gradlew test --tests "*Cobranca*"
./gradlew check
```

### Definicao de pronto da Task 13.9
- [ ] ITs novos verdes.
- [ ] Regressao de cobranca verde.
- [ ] `./gradlew check` verde.
- [ ] JaCoCo do modulo `cobranca` nao fica abaixo de 70%.

---

## Task 13.10 - Documentacao, collection e validacao final

**Objetivo**: fechar a sprint com documentacao operacional, collection e referencias atualizadas.

**Pre-requisito**: Task 13.9 concluida.

**Esforco**: 0,5-1 dia.

**Arquivos principais**:
- `docs-SEP/repos/sep-api/COBRANCA.md`
- `docs-SEP/repos/sep-api/NOTIFICACOES.md`
- PR description temporaria da Sprint 13
- `docs-SEP/docs-sep/sep-api.postman_collection.json`
- `docs-SEP/docs-sep/PRD.md`
- `docs-SEP/AI-ROADMAP.md`

### Step 013.10.1 - Atualizar `COBRANCA.md`

**Conteudo minimo**:
- Workflow de atraso.
- Eventos de cobranca.
- Renegociacao.
- Endpoints novos.
- Status novos de parcela.
- Limitacoes e pendencias.

### Step 013.10.2 - Atualizar `NOTIFICACOES.md`

**Conteudo minimo**:
- Providers efetivamente implementados.
- Properties finais.
- Templates finais.
- Regras LGPD/CDC.
- Pendencias juridicas antes de producao.

### Step 013.10.3 - Atualizar Postman

**Requests minimos**:
- Listar inadimplencia.
- Registrar contato.
- Propor renegociacao.
- Aceitar renegociacao.
- Recusar renegociacao.

### Step 013.10.4 - Criar PR description

**Arquivo**:
- PR description temporaria da Sprint 13

**Conteudo**:
- Resumo tecnico.
- Migrations.
- Endpoints.
- Testes.
- Riscos/breaking changes.
- Pendencias pos-merge.

### Step 013.10.5 - Atualizar PRD e roadmap

**Regras**:
- PRD secao 22 so deve marcar Sprint 13 como executada apos implementacao validada e mergeada.
- `AI-ROADMAP.md` deve apontar para `NOTIFICACOES.md`, ADR 0014 e steps 013.

### Definicao de pronto da Task 13.10
- [ ] Docs operacionais atualizados.
- [ ] Collection atualizada e JSON valido.
- [ ] PR description criada.
- [ ] PRD atualizado somente no momento correto.
- [ ] Roadmap revisado.

---

## Definition of Done da Sprint 13

- [ ] ADR 0014 aceita e usada como gate.
- [ ] Modulo `cobranca` estendido com inadimplencia, eventos e renegociacao.
- [ ] `NotificationProvider` com Log, SMTP e Zenvia.
- [ ] Workflow configuravel por YAML.
- [ ] Job de inadimplencia 90 dias operacional.
- [ ] Renegociacao basica funcional.
- [ ] 5 endpoints REST documentados.
- [ ] Auditoria reforcada.
- [ ] ITs E2E verdes.
- [ ] `./gradlew check` verde.
- [ ] `NOTIFICACOES.md` revisado e pendencias juridicas registradas.

## Riscos e pendencias conhecidas

- Revisao juridica LGPD/CDC dos templates eh obrigatoria antes de producao.
- Multi-instance scheduling ainda exige ShedLock ou advisory lock PostgreSQL em ambiente AWS.
- Entrega SMS nao comprova leitura pelo tomador.
- Reprocesso manual de notificacoes falhas fica para Sprint 14.
- Negativacao e cobranca juridica continuam fora de escopo.
