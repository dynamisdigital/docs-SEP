# Steps - Sprint 14 - Backoffice operacional

**Spec de origem**: [`specs/fase-2/014-sprint-14-backoffice-operacional.md`](../../specs/fase-2/014-sprint-14-backoffice-operacional.md)

**Status**: a implementar.

**Objetivo geral**: consolidar a operacao assistida da Fase 2 entregando o modulo `backoffice`. Unifica em uma fila operacional unica todas as situacoes que exigem intervencao humana (propostas pendentes, KYC/KYB com erro, contratos sem assinatura, cobrancas problematicas, parcelas inadimplentes, webhooks que falharam) e expoe comentarios internos, justificativas auditaveis, reprocessos manuais e visao consolidada. Fecha a Fase 2 do PRD: a partir do merge, a SEP pode ser operada pelo time interno sem developers.

**Esforco total estimado**: 7-10 dias de Dev Senior.

**Repo de destino**:
- `sep-api`: backend Spring Boot, unico repo de codigo alterado nesta sprint.
- `docs-SEP`: documentacao editada no working tree quando necessario; operacao git continua manual.

**Branch sugerida**:
- `feature/sprint-14-backoffice-operacional`

**Pre-requisitos globais**:
- Sprint 13 concluida e mergeada em `develop` (merge commit `3bac857`, 2026-05-26).
- `sep-api` em `develop` atualizado a partir de `origin/develop`.
- Modulos `identity`, `onboarding`, `credito`, `contratos`, `cobranca` e `escrow` funcionais.
- Webhook Receiver com Outbox da Sprint 4 funcional.
- Step-up authentication da Sprint 5 funcional (`@RequireStepUp` + header `X-Step-Up-Token`).
- Role `FINANCEIRO` disponivel (Sprint 8).
- `AlterarRoleUsuarioUseCase` disponivel (Sprint 8) e extensivel.
- `audit_log_seguranca` funcional e extensivel (`TipoEventoSeguranca` ou enum equivalente).
- ADRs 0001 (monolito modular DDD) e 0007 (DDD + Hexagonal) vigentes.

**Nota sobre numeracao de migrations**:
- Ultima migration aplicada (apos prechecks 14.0): `V32__ampliar_audit_seguranca_tipo_inadimplencia.sql` (Sprint 13 Task 13.8).
- Sprint 14 reserva `V33` (tabelas backoffice), `V34` (role BACKOFFICE) e, se necessario por check constraint em `audit_log_seguranca`, `V35` (ampliar tipos de audit).

**Fora de escopo**:
- Telas web/mobile do backoffice (Frontend de Jornadas - Epic 13, fase futura).
- SLA + alertas automaticos para itens em atraso.
- Atribuicao automatica round-robin (manual nesta sprint).
- Relatorios exportaveis (CSV/PDF).
- BI / dashboards externos.
- Backoffice mobile - decisao do PRD §11 sobre Mobile SEP exclui permanentemente.

**Protocolo obrigatorio por Task**:
- Implementar somente a Task liberada pelo usuario.
- Ao concluir implementacao e verificacao da Task, parar em checkpoint pre-commit com arquivos alterados, testes executados, riscos e sugestao de commit.
- Aguardar `commit` ou aprovacao equivalente antes de stage/commit.
- Depois do commit principal, rodar `chown -R mauricio:mauricio .git .claude` no `sep-api`.
- Fazer exatamente 1 code review automatizado da Task (subagente `cavecrew-reviewer`).
- Se houver hotfix, implementar, parar em novo checkpoint pre-commit, aguardar aprovacao e commitar; nao rodar novo review automatizado salvo pedido explicito.
- Ao final da Task, pausar para review manual do usuario. Nao iniciar a proxima Task sem ordem explicita.

**Skills obrigatorias na implementacao**:
- `coding-guidelines`: 4 regras - pensar antes, simplicidade, cirurgico, goal-driven.
- `clean-code` (Robert C. Martin): nomes intencionais, funcoes pequenas, comentarios minimos, SRP.
- `design-patterns-java` (GoF): Repository, Value Object sealed, Observer (`@EventListener`), Command (use cases), Strategy (dispatch de reprocesso por tipo), Facade (dashboard agregador), Adapter (web mapper).
- `caveman:caveman-review` via subagente `cavecrew-reviewer` apos cada Task.

---

## Ordem de execucao recomendada

```text
14.0 (prechecks)
  |
  v
14.1 (entidades + VOs sealed + migration V33)
  |
  +--> 14.2 (5 listeners + VerificadorPendenciasJob)
  |
  +--> 14.3 (use cases fila: Listar/Assumir/Comentario/Resolver/Ignorar)
  |
  +--> 14.4 (use cases reprocesso webhook + provider + anti-abuso 3/24h)
  |
  +--> 14.5 (Dashboard / visao consolidada)
  |
  +--> 14.6 (Role BACKOFFICE + migration V34)
                              |
                              v
                        14.7 (REST controllers + DTOs + mapper + OpenAPI)
                              |
                              v
                        14.8 (auditoria reforcada - 6 novos TipoEventoSeguranca)
                              |
                              v
                        14.9 (BackofficeIT + ReprocessoIT - 8 cenarios E2E)
                              |
                              v
                        14.10 (BACKOFFICE.md + PRD §22/§29 + CONTEXT + AI-ROADMAP + collections)
```

- 14.1 estabiliza dominio, VOs sealed, repositories, eventos e migration V33.
- 14.2 / 14.3 / 14.4 / 14.5 / 14.6 sao paralelizaveis em codigo (paths disjuntos); decisao paralelo vs sequencial fica no executor.
- 14.7 consolida camada web apos use cases prontos.
- 14.8 pode rodar paralelo com 14.7 (toca enum em `identity` + listener em `backoffice`; sem overlap com controllers).
- 14.9 exige todas anteriores prontas.
- 14.10 marca PRD §22/§29 (Fase 2 concluida) apenas apos PR mergeado em `develop`.

---

## Task 14.0 - Prechecks da Sprint 14

**Objetivo**: garantir que a sprint nasce de `develop` atualizado, com Sprint 13 integrada e baseline verde.

**Esforco**: 1-2 horas.

### Step 014.0.1 - Conferir estado Git do `sep-api`

**Comandos**:
```bash
cd <sep-api-root>
git fetch --all --prune
git status --short --branch
git rev-list --left-right --count HEAD...origin/develop
git log --oneline -5 origin/develop
```

**Verificacao**:
- Working tree limpo antes de criar branch.
- Branch local alinhada a `origin/develop`.
- Topo de `develop` aponta para merge commit `3bac857` (Sprint 13) ou commit posterior.
- Se houver mudancas locais, identificar se sao do usuario; nao reverter.

### Step 014.0.2 - Criar branch da sprint

**Comandos**:
```bash
cd <sep-api-root>
git switch develop
git pull --ff-only
git switch -c feature/sprint-14-backoffice-operacional
```

**Verificacao**:
- Branch criada a partir de `develop` atualizado.
- Se `git pull --ff-only` falhar, abortar e avisar o usuario.

### Step 014.0.3 - Rodar baseline backend

**Comandos**:
```bash
cd <sep-api-root>
./gradlew clean test
./gradlew bootJar
```

**Verificacao**:
- Suite passa antes de qualquer alteracao.
- Contagem de testes registrada. Baseline efetiva pos-merge Sprint 13: **1246 testes / 0 falhas / 0 erros / 0 skipped** (`./gradlew clean test`, 2026-05-26, 3m54s).
- Se os testes dependem de PostgreSQL local, subir Docker Compose conforme README do `sep-api`.

### Step 014.0.4 - Conferir pontos de extensao

**Comandos**:
```bash
cd <sep-api-root>
find src/main/resources/db/migration -maxdepth 1 -type f | sort | tail
grep -R "OnboardingFinalizadoEvent" -n src/main/java/com/dynamis/sep_api/onboarding
grep -R "ParcelaInadimplenteEvent" -n src/main/java/com/dynamis/sep_api/cobranca
grep -R "WebhookEvent" -n src/main/java/com/dynamis/sep_api
grep -R "enum.*Role" -n src/main/java/com/dynamis/sep_api/usuarios
grep -R "AlterarRoleUsuarioUseCase" -n src/main/java/com/dynamis/sep_api
grep -R "RequireStepUp" -n src/main/java/com/dynamis/sep_api
grep -R "TipoEventoSeguranca\|TipoEventoSeguranca" -n src/main/java/com/dynamis/sep_api
grep -R "Outbox" -n src/main/java/com/dynamis/sep_api
```

**Verificacao**:
- Proximo numero livre de migration confirmado. Baseline aplicada apos Sprint 13: `V32` (ampliar audit inadimplencia). Sprint 14 reserva `V33` (tabelas backoffice) e `V34` (role BACKOFFICE).
- `OnboardingFinalizadoEvent` com payload suficiente para detectar `REPROVADO`/`PENDENCIA`.
- `ParcelaInadimplenteEvent` da Sprint 13 disponivel.
- Outbox/WebhookEvent localizado para o listener `WebhookFalhouListener`.
- Enum/sealed `Role` identificado e ponto de update mapeado.
- `AlterarRoleUsuarioUseCase` (Sprint 8) localizado e extensivel.
- Padrao de `@RequireStepUp` e audit log identificado.

### Step 014.0.5 - Confirmar parametros operacionais

**Checklist**:
- Limite anti-abuso de reprocessos: 3 por entidade em 24h.
- Justificativa minima de resolucao/ignorar: 20 caracteres.
- Cron `VerificadorPendenciasJob`: `0 */15 * * * *` (a cada 15 minutos).
- Threshold `PropostaPendenciaListener`: proposta em `EM_ANALISE` > 24h.
- Threshold `ContratoAceitoListener`: contrato `ACEITO` > 48h sem progredir.
- Threshold `WebhookFalhouListener`: Outbox sem processamento > 1h.
- Role `BACKOFFICE` cumulativa com `FINANCEIRO` (nao excludente).
- Step-up obrigatorio em `resolver`, `ignorar`, `reprocessar webhook` e `reprocessar provider`.

### Definicao de pronto da Task 14.0
- [ ] Branch correta criada.
- [ ] Baseline backend verde com contagem registrada.
- [ ] Proximo numero de migration confirmado (`V33`/`V34`).
- [ ] Pontos de extensao de eventos, audit, step-up, role e Outbox identificados.
- [ ] Parametros operacionais confirmados ou risco registrado.

---

## Task 14.1 - Modulo `backoffice`, entidades e migration V33

**Objetivo**: criar o nucleo persistente do modulo `backoffice` com entidades, value objects sealed, eventos, repositories e migration.

**Pre-requisito**: Task 14.0 concluida.

**Esforco**: 1-2 dias.

**Arquivos principais**:
- `backoffice/domain/model/ItemFilaOperacional.java`
- `backoffice/domain/model/ComentarioInterno.java`
- `backoffice/domain/model/Reprocesso.java`
- `backoffice/domain/vo/TipoItemFila.java` (sealed)
- `backoffice/domain/vo/PrioridadeItem.java` (sealed)
- `backoffice/domain/vo/StatusItemFila.java` (sealed)
- `backoffice/domain/vo/TipoEntidadeReferenciada.java` (sealed)
- `backoffice/domain/vo/TipoChamadaProvider.java` (sealed)
- `backoffice/domain/vo/StatusReprocesso.java` (sealed)
- `backoffice/domain/event/ItemFilaCriadoEvent.java`
- `backoffice/domain/event/ItemAssumidoEvent.java`
- `backoffice/domain/event/ComentarioRegistradoEvent.java`
- `backoffice/domain/event/ItemResolvidoEvent.java`
- `backoffice/domain/event/ItemIgnoradoEvent.java`
- `backoffice/domain/event/ReprocessoDisparadoEvent.java`
- `backoffice/infrastructure/persistence/ItemFilaOperacionalRepository.java`
- `backoffice/infrastructure/persistence/ComentarioInternoRepository.java`
- `backoffice/infrastructure/persistence/ReprocessoRepository.java`
- `src/main/resources/db/migration/V33__criar_tabelas_backoffice.sql`

### Step 014.1.1 - Estruturar pacote do modulo

**Estrutura esperada**:
```text
backoffice/
  domain/
    model/
    vo/
    event/
  application/
    usecase/
    listener/
    job/
    dto/
    port/out/
  infrastructure/
    persistence/
  web/
    controller/
    dto/
    mapper/
```

**Regras**:
- Seguir convencao de DDD + Hexagonal ja usada nos modulos `cobranca`, `contratos`, `credito`.
- Sem dependencia direta de outros modulos no nivel de dominio; comunicacao via eventos e portas.

### Step 014.1.2 - Modelar value objects sealed

**`TipoItemFila`**:
```text
ONBOARDING_PENDENTE
ONBOARDING_ERRO
PROPOSTA_PENDENTE
CONTRATO_NAO_ASSINADO
COBRANCA_INADIMPLENTE
WEBHOOK_FALHOU
OUTRO
```

**`PrioridadeItem`**:
```text
BAIXA
MEDIA
ALTA
CRITICA
```

**`StatusItemFila`**:
```text
ABERTO
EM_TRATAMENTO
RESOLVIDO
IGNORADO
```

**`TipoEntidadeReferenciada`**: referencia logica para o objeto original (`ONBOARDING`, `PROPOSTA`, `CONTRATO`, `PARCELA_COBRANCA`, `WEBHOOK_EVENT`, etc).

**`TipoChamadaProvider`**: `KYC`, `KYB`, `PLD`, `OPEN_FINANCE`, `ASSINATURA_DIGITAL`.

**`StatusReprocesso`**: `PENDENTE`, `SUCESSO`, `FALHA`.

**Regras**:
- Todos os VOs implementados como `enum` ou `sealed interface` conforme padrao Sprint 8 em diante.
- Helpers `isFinal()`/`isAtivo()` em `StatusItemFila` (ABERTO/EM_TRATAMENTO sao ativos; RESOLVIDO/IGNORADO sao finais).
- `PrioridadeItem` com helper `ordinalPeso()` para queries `ORDER BY`.

### Step 014.1.3 - Modelar `ItemFilaOperacional`

**Campos minimos**:
- `id` (UUID), `tipo`, `prioridade`, `status`, `tipoEntidade`, `entidadeId`, `titulo`, `descricao`, `atribuidoA` (UUID nullable), `dataAbertura`, `dataResolucao` (nullable), `dataCriacao`, `dataModificacao`, `criadoPor`, `modificadoPor`.

**Regras**:
- `titulo` <= 255 caracteres; `descricao` em `TEXT`.
- `dataAbertura` setada pelo factory; nao pode ser modificada.
- `atribuidoA` so pode ser setado em transicao `ABERTO -> EM_TRATAMENTO`.
- Transicao `EM_TRATAMENTO -> RESOLVIDO` exige justificativa via `ComentarioInterno` separado (regra reforcada na Task 14.3).
- Transicoes invalidas (ex.: `RESOLVIDO -> ABERTO`) lancam `ConflictException` (409).
- Helper `pertenceA(entidadeId, tipoEntidade)` para idempotencia.

### Step 014.1.4 - Modelar `ComentarioInterno`

**Campos minimos**:
- `id` (UUID), `itemId` (FK -> `item_fila_operacional`), `autorId` (UUID), `conteudo` (TEXT), `dataCriacao`.

**Regras**:
- `conteudo` minimo de 1 caractere; quando usado como justificativa de resolucao/ignorar, exige >= 20 caracteres (validacao no use case).
- Sem update; comentario imutavel apos persistencia.
- N:1 com `ItemFilaOperacional`.

### Step 014.1.5 - Modelar `Reprocesso`

**Campos minimos**:
- `id` (UUID), `itemId` (FK nullable -> `item_fila_operacional`), `tipo` (`WEBHOOK` ou `PROVIDER`), `tipoChamada` (`TipoChamadaProvider` nullable), `identificadorExterno` (VARCHAR(255) - webhookEventId ou entidadeId), `status`, `resultado` (TEXT - mensagem tecnica do retorno), `dataDisparo`, `disparadoPor` (UUID).

**Regras**:
- `itemId` opcional - reprocesso pode ser disparado sem item explicito (ex.: webhook que nunca chegou a virar item).
- Imutavel apos `SUCESSO` ou `FALHA`.
- Anti-abuso (Task 14.4): conta apenas reprocessos com mesma `entidadeId` em janela de 24h.

### Step 014.1.6 - Modelar eventos de dominio

**Lista**:
- `ItemFilaCriadoEvent(itemId, tipo, prioridade, entidadeId, tipoEntidade)`
- `ItemAssumidoEvent(itemId, atribuidoA, atribuidoEm)`
- `ComentarioRegistradoEvent(itemId, comentarioId, autorId)`
- `ItemResolvidoEvent(itemId, resolvidoPor, justificativaResumida)`
- `ItemIgnoradoEvent(itemId, ignoradoPor, justificativaResumida)`
- `ReprocessoDisparadoEvent(reprocessoId, tipo, identificadorExterno, disparadoPor)`

**Regras**:
- Eventos como `record` imutaveis.
- `justificativaResumida`: primeiros 80 caracteres do comentario, sem dados sensiveis.
- Publicacao via `ApplicationEventPublisher`.

### Step 014.1.7 - Migration V33

**Esquema esperado** (resumo - consultar spec linha 92-132 para detalhes):

```sql
CREATE TABLE item_fila_operacional (
  id UUID PRIMARY KEY,
  tipo VARCHAR(40) NOT NULL,
  prioridade VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  tipo_entidade VARCHAR(40) NOT NULL,
  entidade_id UUID NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  atribuido_a UUID,
  data_abertura TIMESTAMP WITH TIME ZONE NOT NULL,
  data_resolucao TIMESTAMP WITH TIME ZONE,
  data_criacao TIMESTAMP WITH TIME ZONE NOT NULL,
  data_modificacao TIMESTAMP WITH TIME ZONE NOT NULL,
  criado_por VARCHAR(50) NOT NULL,
  modificado_por VARCHAR(50) NOT NULL,
  CONSTRAINT chk_status_item CHECK (status IN ('ABERTO','EM_TRATAMENTO','RESOLVIDO','IGNORADO')),
  CONSTRAINT chk_prioridade_item CHECK (prioridade IN ('BAIXA','MEDIA','ALTA','CRITICA'))
);

CREATE UNIQUE INDEX uq_item_ativo_por_entidade
  ON item_fila_operacional (tipo, tipo_entidade, entidade_id)
  WHERE status IN ('ABERTO','EM_TRATAMENTO');

CREATE INDEX idx_fila_status_prioridade
  ON item_fila_operacional (status, prioridade, data_abertura);

CREATE INDEX idx_fila_atribuido
  ON item_fila_operacional (atribuido_a) WHERE atribuido_a IS NOT NULL;

CREATE TABLE comentario_interno (
  id UUID PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES item_fila_operacional(id),
  autor_id UUID NOT NULL,
  conteudo TEXT NOT NULL,
  data_criacao TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_comentario_item ON comentario_interno(item_id);

CREATE TABLE reprocesso (
  id UUID PRIMARY KEY,
  item_id UUID REFERENCES item_fila_operacional(id),
  tipo VARCHAR(40) NOT NULL,
  tipo_chamada VARCHAR(40),
  identificador_externo VARCHAR(255),
  status VARCHAR(20) NOT NULL,
  resultado TEXT,
  data_disparo TIMESTAMP WITH TIME ZONE NOT NULL,
  disparado_por UUID NOT NULL,
  CONSTRAINT chk_status_reprocesso CHECK (status IN ('PENDENTE','SUCESSO','FALHA'))
);

CREATE INDEX idx_reprocesso_entidade_data ON reprocesso(identificador_externo, data_disparo DESC);
```

**Constraints minimas**:
- FKs sem `ON DELETE CASCADE` (preservar trilha LGPD).
- UNIQUE parcial em `(tipo, tipo_entidade, entidade_id)` apenas para itens ativos garante idempotencia sem bloquear reabertura legitima.
- Indice em `(identificador_externo, data_disparo DESC)` suporta query de anti-abuso 3/24h da Task 14.4.

### Step 014.1.8 - Implementar repositories

**Contratos minimos**:
- `ItemFilaOperacionalRepository`: `findAll(Specification, Pageable)`, `findByIdWithComentarios(id)` (JOIN FETCH para evitar LazyInit), `existsAtivoPorEntidade(tipo, tipoEntidade, entidadeId)`.
- `ComentarioInternoRepository`: `findByItemIdOrderByDataCriacaoAsc`.
- `ReprocessoRepository`: `countByIdentificadorExternoAndDataDisparoAfter(id, since)`, save padrao.

**Regras**:
- Specifications dinamicas (Spring Data) para filtros do `ListarFilaOperacionalUseCase`.
- Queries com `@QueryHints(@QueryHint(name = HINT_FETCH_SIZE, value = "100"))` em listagens grandes.

### Testes obrigatorios
- `ItemFilaOperacionalTest` (dominio: transicoes validas/invalidas, helpers).
- `ComentarioInternoTest` (validacao minima conteudo).
- `ReprocessoTest` (estados finais).
- `TipoItemFilaTest`, `PrioridadeItemTest`, `StatusItemFilaTest` (enums/sealed).
- `ItemFilaOperacionalRepositoryTest` (UNIQUE parcial impede duplicacao ativa; permite reabertura apos `RESOLVIDO`).
- `ReprocessoRepositoryTest` (query anti-abuso retorna count correto por janela).

### Definicao de pronto da Task 14.1
- [ ] Estrutura de pacote criada.
- [ ] 3 entidades + 6 VOs sealed + 6 eventos modelados.
- [ ] Migration V33 aplica em banco limpo (`sep_dev` e `sep_test`).
- [ ] Constraints impedem duplicidades ativas.
- [ ] Repositories com Specification, JOIN FETCH e query anti-abuso.
- [ ] Testes de dominio e persistencia verdes.
- [ ] `./gradlew test` passa.

---

## Task 14.2 - Listeners de eventos + job consolidador

**Objetivo**: alimentar a fila operacional a partir de eventos publicados pelas sprints anteriores e de verificacoes baseadas em tempo via job agendado.

**Pre-requisito**: Task 14.1 concluida.

**Esforco**: 1-2 dias.

**Arquivos principais**:
- `backoffice/application/listener/OnboardingFinalizadoListener.java`
- `backoffice/application/listener/ParcelaInadimplenteListener.java`
- `backoffice/application/listener/PropostaPendenciaListener.java`
- `backoffice/application/listener/ContratoAceitoListener.java`
- `backoffice/application/listener/WebhookFalhouListener.java`
- `backoffice/application/job/VerificadorPendenciasJob.java`
- `backoffice/application/service/CriarItemFilaOperacionalService.java` (servico interno reutilizado pelos listeners)

### Step 014.2.1 - Servico interno `CriarItemFilaOperacionalService`

**Contrato**:
```java
record CriarItemCommand(
    TipoItemFila tipo,
    PrioridadeItem prioridade,
    TipoEntidadeReferenciada tipoEntidade,
    UUID entidadeId,
    String titulo,
    String descricao
) {}

Optional<UUID> criarSeAusente(CriarItemCommand cmd);
```

**Regras**:
- Encapsula a regra de idempotencia: consulta `existsAtivoPorEntidade(...)`; se ja existe ativo, retorna `Optional.empty()`.
- Catch defensivo de `DataIntegrityViolationException` (race entre check e insert) - log `INFO` e retorna `empty()`.
- Em sucesso, publica `ItemFilaCriadoEvent`.
- Usa `Clock` injetado para `dataAbertura`.

### Step 014.2.2 - `OnboardingFinalizadoListener`

**Comportamento**:
- Escuta `OnboardingFinalizadoEvent` (Sprint 6/7).
- Cria item se status final for `REPROVADO` ou `PENDENCIA`.
- `prioridade`:
  - `ALTA` para `REPROVADO`.
  - `MEDIA` para `PENDENCIA`.
- `titulo`: `"Onboarding {REPROVADO|PENDENTE} - {tipoPessoa}"`.

**Regras**:
- `@TransactionalEventListener(AFTER_COMMIT)` + `@Transactional(REQUIRES_NEW)`.
- Falha na criacao nao deve afetar o fluxo de onboarding.

### Step 014.2.3 - `ParcelaInadimplenteListener`

**Comportamento**:
- Escuta `ParcelaInadimplenteEvent` (Sprint 13).
- Sempre cria item com `tipo = COBRANCA_INADIMPLENTE`, `prioridade = ALTA`.
- `entidadeId` aponta para `parcelaId`; `tipoEntidade = PARCELA_COBRANCA`.

**Regras**:
- `@TransactionalEventListener(AFTER_COMMIT)` + `@Transactional(REQUIRES_NEW)`.
- Nao bloquear job de inadimplencia da Sprint 13 em caso de falha.

### Step 014.2.4 - `PropostaPendenciaListener` (job-driven)

**Comportamento**:
- Nao escuta evento; eh invocado pelo `VerificadorPendenciasJob`.
- Consulta `proposta` (modulo `credito`) com `status = EM_ANALISE` e `dataModificacao < now() - 24h`.
- Para cada uma, dispara `criarSeAusente(...)` com tipo `PROPOSTA_PENDENTE`, prioridade `MEDIA`.

**Regras**:
- Acesso ao modulo `credito` via use case publico de listagem ou repository read-only; nao importar dominio direto.
- Idempotencia garantida pelo servico interno.

### Step 014.2.5 - `ContratoAceitoListener` (job-driven)

**Comportamento**:
- Nao escuta evento; invocado pelo `VerificadorPendenciasJob`.
- Consulta `contrato` (modulo `contratos`) com `status = ACEITO` e `dataModificacao < now() - 48h` sem transicao para `EM_ASSINATURA`.
- Cria item `CONTRATO_NAO_ASSINADO`, prioridade `MEDIA`.

### Step 014.2.6 - `WebhookFalhouListener` (job-driven)

**Comportamento**:
- Nao escuta evento; invocado pelo `VerificadorPendenciasJob`.
- Consulta `webhook_event_log` (Sprint 4 - entidade `WebhookEventLog`, repository `WebhookEventLogRepository`, status `WebhookEventStatus`) com `status = FALHOU` (ou `PENDENTE` + `dataCriacao < now() - 1h` enquanto consumers assincronos das Epics 5/15 nao estiverem totalmente operacionais).
- Cria item `WEBHOOK_FALHOU`, prioridade `MEDIA` (eleva para `ALTA` se houver coluna de tentativas e `tentativas > 5`).
- Confirmar shape exato do `WebhookEventLog` em prechecks 14.0.4 (campos disponiveis: id, provider, event, idempotencyKey, signature, status, payload, dataCriacao).

### Step 014.2.7 - `VerificadorPendenciasJob`

**Cron default**:
```text
0 */15 * * * *
```

**Regras**:
- `@Scheduled` configuravel via property `app.backoffice.verificador.cron`.
- Respeita property global de scheduling (`app.scheduling-habilitado`).
- Usa `Clock` injetado.
- Invoca os 3 listeners job-driven em sequencia; falha de um nao para os outros.
- Property em `application-test.yml`: `scheduling-habilitado: false` (consistente com Sprint 13).

### Properties planejadas

```yaml
app:
  backoffice:
    verificador:
      cron: ${APP_BACKOFFICE_VERIFICADOR_CRON:0 */15 * * * *}
      proposta-pendencia-horas: 24
      contrato-aceito-horas: 48
      webhook-falhou-horas: 1
```

### Testes obrigatorios
- `OnboardingFinalizadoListenerTest`
- `ParcelaInadimplenteListenerTest`
- `PropostaPendenciaListenerTest`
- `ContratoAceitoListenerTest`
- `WebhookFalhouListenerTest`
- `VerificadorPendenciasJobTest` (com `Clock` fixo + verificacao de invocacao dos 3 listeners)
- `CriarItemFilaOperacionalServiceTest` (idempotencia happy + race simulada com mock lancando `DataIntegrityViolationException`).

### Definicao de pronto da Task 14.2
- [ ] 5 listeners + 1 job implementados.
- [ ] Idempotencia validada (mesmo evento 2x -> 1 item).
- [ ] Job invoca listeners job-driven sem falha em cascata.
- [ ] Falha em listener nao quebra fluxo do publisher.
- [ ] Testes unitarios verdes.

---

## Task 14.3 - Use cases de fila, comentarios, resolucao e ignorar

**Objetivo**: implementar os casos de uso que o operador exerce sobre a fila operacional.

**Pre-requisito**: Task 14.1 concluida.

**Esforco**: 1-2 dias.

**Arquivos principais**:
- `backoffice/application/usecase/ListarFilaOperacionalUseCase.java`
- `backoffice/application/usecase/ConsultarItemFilaUseCase.java`
- `backoffice/application/usecase/AssumirItemFilaUseCase.java`
- `backoffice/application/usecase/RegistrarComentarioUseCase.java`
- `backoffice/application/usecase/MarcarItemResolvidoUseCase.java`
- `backoffice/application/usecase/MarcarItemIgnoradoUseCase.java`
- `backoffice/application/dto/FiltrosFilaOperacional.java`
- `backoffice/application/dto/ItemFilaSummary.java`

### Step 014.3.1 - `ListarFilaOperacionalUseCase`

**Comportamento**:
- Aceita `FiltrosFilaOperacional` (`tipo`, `prioridade`, `status`, `dataAberturaDe`, `dataAberturaAte`, `atribuidoA`) e `Pageable`.
- Usa Spring Data Specification combinada (`Specifications.where(...)`).
- Retorna `Page<ItemFilaSummary>` (record com campos minimos para listagem; sem comentarios).

**Regras**:
- Default `Sort`: `prioridade DESC, dataAbertura ASC`.
- Limite de page size: 100 (forcado).

### Step 014.3.2 - `ConsultarItemFilaUseCase`

**Comportamento**:
- Recebe `itemId` e retorna `ItemFilaDetalhe` com lista de comentarios e referencia ao objeto original.
- Resolucao do objeto original via dispatcher (Strategy GoF) por `TipoEntidadeReferenciada`.

**Regras**:
- Dispatcher consulta use cases publicos dos modulos referenciados (`onboarding`, `credito`, `contratos`, `cobranca`).
- Falha na resolucao do objeto original nao quebra: retorna detalhe com `objetoOriginal = null` e log warning.

### Step 014.3.3 - `AssumirItemFilaUseCase`

**Comportamento**:
- Atribui item a um operador. Transiciona `ABERTO -> EM_TRATAMENTO`.
- Registra `atribuidoA` e `dataModificacao`.
- Publica `ItemAssumidoEvent`.

**Regras**:
- Transicao invalida lanca `ConflictException` (409).
- Reatribuicao (de operador A para B) nao permitida nesta sprint; exige resolver/ignorar antes ou reabertura.
- Operacao auditada (Task 14.8).

### Step 014.3.4 - `RegistrarComentarioUseCase`

**Comportamento**:
- Cria `ComentarioInterno` vinculado ao item.
- Permite comentario em qualquer status (inclusive `RESOLVIDO`/`IGNORADO`).
- Publica `ComentarioRegistradoEvent`.

**Regras**:
- `conteudo` minimo 1 caractere, maximo 10000.
- Validar autor != null (vem de `SecurityContext`).

### Step 014.3.5 - `MarcarItemResolvidoUseCase`

**Comportamento**:
- Transiciona `EM_TRATAMENTO -> RESOLVIDO`.
- Justificativa obrigatoria (`>= 20 caracteres`).
- Cria `ComentarioInterno` com a justificativa antes da transicao.
- Setta `dataResolucao = now()`.
- Publica `ItemResolvidoEvent`.

**Regras**:
- Step-up reforcado na borda REST (Task 14.7); use case nao valida step-up diretamente.
- Transicoes diferentes de `EM_TRATAMENTO` -> 409.
- Justificativa curta -> `ValidationException` (400).

### Step 014.3.6 - `MarcarItemIgnoradoUseCase`

**Comportamento**:
- Identico a `MarcarItemResolvido` mas transiciona para `IGNORADO`.
- Justificativa obrigatoria.
- Publica `ItemIgnoradoEvent`.

**Regras**:
- Permitido a partir de `ABERTO` ou `EM_TRATAMENTO`.

### Testes obrigatorios
- `ListarFilaOperacionalUseCaseTest` (filtros, paginacao, ordenacao).
- `ConsultarItemFilaUseCaseTest` (resolucao do objeto original; falha controlada).
- `AssumirItemFilaUseCaseTest` (happy + 409).
- `RegistrarComentarioUseCaseTest` (happy + validacao).
- `MarcarItemResolvidoUseCaseTest` (happy + justificativa curta + transicao invalida).
- `MarcarItemIgnoradoUseCaseTest` (happy + a partir de ABERTO + transicao invalida).

### Definicao de pronto da Task 14.3
- [ ] 6 use cases implementados.
- [ ] Specifications cobrindo todos os filtros.
- [ ] Transicoes invalidas viram 409.
- [ ] Justificativas curtas viram 400.
- [ ] Eventos publicados para audit.
- [ ] Cobertura JaCoCo dos use cases >= 80%.

---

## Task 14.4 - Use cases de reprocessamento + anti-abuso

**Objetivo**: permitir re-disparo manual de webhooks da Outbox e re-tentativa de chamadas a providers externos, com controle anti-abuso.

**Pre-requisito**: Task 14.1 concluida.

**Esforco**: 1 dia.

**Arquivos principais**:
- `backoffice/application/usecase/ReprocessarWebhookUseCase.java`
- `backoffice/application/usecase/ReprocessarChamadaProviderUseCase.java`
- `backoffice/application/port/out/WebhookReprocessadorPort.java`
- `backoffice/application/port/out/ProviderReprocessadorPort.java`
- `backoffice/application/service/AntiAbusoReprocessoService.java`
- `backoffice/infrastructure/adapter/reprocesso/WebhookReprocessadorAdapter.java`
- `backoffice/infrastructure/adapter/reprocesso/ProviderReprocessadorDispatcher.java`

### Step 014.4.1 - Contratos das portas de saida

**`WebhookReprocessadorPort`**:
```java
ResultadoReprocesso reprocessar(UUID webhookEventId);
```

**`ProviderReprocessadorPort`**:
```java
ResultadoReprocesso reprocessar(TipoChamadaProvider tipo, UUID entidadeId);
```

**Regras**:
- `ResultadoReprocesso(status, mensagemTecnica)` - status `SUCESSO` ou `FALHA`.
- Adapters concretos vivem em `infrastructure/adapter/reprocesso/`.

### Step 014.4.2 - `WebhookReprocessadorAdapter`

**Comportamento**:
- Recebe `webhookEventId`, busca evento na Outbox da Sprint 4.
- Reinjeta via processador existente (mesmo path do consumer original).
- Atualiza `tentativas` e `processado` conforme retorno.

**Regras**:
- Operacao transacional (`REQUIRES_NEW`).
- Falha tecnica retorna `FALHA` sem propagar.
- Nao cria novo `WebhookEvent`; reutiliza o existente.

### Step 014.4.3 - `ProviderReprocessadorDispatcher` (Strategy GoF)

**Comportamento**:
- Receive `TipoChamadaProvider` e dispatcha para o use case/adapter especifico:
  - `KYC` -> use case publico de re-tentativa KYC (Sprint 6).
  - `KYB` -> idem KYB (Sprint 7).
  - `PLD` -> idem PLD (Sprint 7).
  - `OPEN_FINANCE` -> idem OF (Sprint 9).
  - `ASSINATURA_DIGITAL` -> idem Clicksign (Sprint 11).

**Regras**:
- Mapa interno `Map<TipoChamadaProvider, ProviderRetentativaStrategy>` populado via Spring `@Component` + `@Qualifier`.
- Tipo nao mapeado -> `UnsupportedOperationException` -> 400 na borda REST.

### Step 014.4.4 - `AntiAbusoReprocessoService`

**Comportamento**:
- Conta reprocessos com `identificadorExterno = ?` em `now() - 24h`.
- Se >= 3, lanca `LimiteReprocessoExcedidoException` (mapeada para 429 na borda).

**Regras**:
- Query usa indice `idx_reprocesso_entidade_data` (Task 14.1.7).
- Janela contada com `Clock` injetado.

### Step 014.4.5 - `ReprocessarWebhookUseCase`

**Comportamento**:
- Valida step-up na borda REST (Task 14.7).
- Invoca `AntiAbusoReprocessoService.validarLimite(webhookEventId)`.
- Cria `Reprocesso(tipo=WEBHOOK, identificadorExterno=webhookEventId, status=PENDENTE)`.
- Chama `WebhookReprocessadorPort.reprocessar(webhookEventId)`.
- Atualiza `status` e `resultado` do `Reprocesso`.
- Publica `ReprocessoDisparadoEvent`.
- Se o reprocesso foi disparado a partir de um item da fila (`itemId` no command), referencia o item no `Reprocesso`.

### Step 014.4.6 - `ReprocessarChamadaProviderUseCase`

**Comportamento**:
- Mesmo fluxo de `ReprocessarWebhookUseCase` mas usa `ProviderReprocessadorDispatcher`.
- `identificadorExterno = entidadeId`.

**Regras**:
- Step-up obrigatorio.
- Anti-abuso: 3 reprocessos por `entidadeId` em 24h.

### Testes obrigatorios
- `WebhookReprocessadorAdapterTest` (mock da Outbox).
- `ProviderReprocessadorDispatcherTest` (mapeamento por tipo; tipo desconhecido).
- `AntiAbusoReprocessoServiceTest` (0/1/2/3/4 reprocessos na janela).
- `ReprocessarWebhookUseCaseTest` (happy + 429 + falha tecnica).
- `ReprocessarChamadaProviderUseCaseTest` (happy + 429 + tipo desconhecido).

### Definicao de pronto da Task 14.4
- [ ] 2 use cases implementados.
- [ ] Anti-abuso validado em 4 cenarios (incluindo limite exato).
- [ ] Strategy de dispatch funcional para 5 tipos.
- [ ] Falha tecnica registrada sem rollback indevido.
- [ ] Eventos `ReprocessoDisparadoEvent` publicados.

---

## Task 14.5 - Visao consolidada / dashboard

**Objetivo**: entregar a visao consolidada que o financeiro consome em uma unica chamada (Facade GoF de leitura).

**Pre-requisito**: Task 14.1 concluida.

**Esforco**: 1 dia.

**Arquivos principais**:
- `backoffice/application/usecase/ConsultarVisaoConsolidadaUseCase.java`
- `backoffice/application/dto/DashboardBackoffice.java` (record)
- `backoffice/application/dto/ContadorPorTipo.java`
- `backoffice/application/dto/ContadorPorPrioridade.java`
- `backoffice/application/dto/ContadorPorStatus.java`
- `backoffice/application/dto/MetricaItemCritico.java`

### Step 014.5.1 - Modelar `DashboardBackoffice`

**Conteudo**:
```java
record DashboardBackoffice(
    List<ContadorPorTipo> contadoresPorTipo,
    List<ContadorPorPrioridade> contadoresPorPrioridade,
    List<ContadorPorStatus> contadoresPorStatus,
    Duration tempoMedioResolucao30d,
    long itensCriticosAbertosMais48h,
    List<ContadorPorTipo> topCincoTiposMaisFrequentes,
    BigDecimal recebimentosDoDia,
    InadimplenciaConsolidada inadimplenciaTotal,
    List<ContadorPorStatusProposta> propostasPorStatus,
    Instant geradoEm
) {}
```

**Regras**:
- Record imutavel.
- Sem dados sensiveis (sem CPF/CNPJ; agregados apenas).

### Step 014.5.2 - Implementar `ConsultarVisaoConsolidadaUseCase` (Facade GoF)

**Comportamento**:
- Agrega leituras de:
  - `ItemFilaOperacionalRepository` (contadores e top 5).
  - Use cases publicos de `cobranca` (`recebimentosDoDia`, `inadimplenciaTotal`).
  - Use cases publicos de `credito` (`propostasPorStatus`).
- Calcula `tempoMedioResolucao30d` via query nativa ou agregada (`AVG(dataResolucao - dataAbertura) WHERE status='RESOLVIDO' AND dataResolucao > now() - 30d`).

**Regras**:
- Use case publico **read-only** (nao escreve estado).
- Tempo de resposta alvo: < 500ms em ambiente de teste com massa razoavel.
- Sem N+1: queries agregadas via `SELECT count(*) GROUP BY ...` em uma unica chamada por aspecto.
- Reuso de repositories existentes; nao importar dominio cruzado.
- Falha em uma query parcial nao quebra dashboard inteiro: log + null/`Collections.emptyList()` no campo afetado.

### Step 014.5.3 - Properties planejadas

```yaml
app:
  backoffice:
    dashboard:
      tempo-medio-janela-dias: 30
      itens-criticos-threshold-horas: 48
      top-tipos-limit: 5
```

### Testes obrigatorios
- `ConsultarVisaoConsolidadaUseCaseTest` (mocks de todos os repositorios consumidos).
- Cenario: dashboard com dados; dashboard vazio; falha parcial em uma query (dashboard ainda retorna).
- `DashboardBackofficeTest` (record vazio nao quebra serializacao JSON).

### Definicao de pronto da Task 14.5
- [ ] Record `DashboardBackoffice` modelado.
- [ ] Use case Facade implementado.
- [ ] Agregacoes via query nativa onde aplicavel (sem N+1).
- [ ] Falha parcial nao quebra dashboard.
- [ ] Tempo de resposta < 500ms em massa de teste.

---

## Task 14.6 - Nova role `BACKOFFICE`

**Objetivo**: introduzir a role `BACKOFFICE` que permite operar a fila + reprocessos sem dar acessos amplos de financeiro.

**Pre-requisito**: Task 14.1 concluida.

**Esforco**: 0,5 dia.

**Arquivos principais**:
- `usuarios/domain/Role.java` (ou enum/sealed equivalente da Sprint 8)
- `usuarios/application/AlterarRoleUsuarioUseCase.java`
- `src/main/resources/db/migration/V34__adicionar_role_backoffice.sql`

### Step 014.6.1 - Atualizar enum `Role`

**Mudanca esperada**:
- Adicionar valor `BACKOFFICE` ao enum/sealed `Role`.
- Atualizar helper `isOperacional()` se existir (BACKOFFICE eh operacional).
- Atualizar helper `excedePermissoesDe(...)` se existir (BACKOFFICE nao concede permissoes amplas).

**Regras**:
- Nao alterar valores existentes.
- Posicao no enum: ao final (preservar ordinal de roles antigas em queries que dependam).

### Step 014.6.2 - Migration V34

**Esquema esperado**:

```sql
-- Se houver tabela 'role' com seed:
INSERT INTO role (codigo, descricao) VALUES ('BACKOFFICE', 'Operador de backoffice operacional')
ON CONFLICT (codigo) DO NOTHING;

-- Se houver check constraint em usuario_role.role:
ALTER TABLE usuario_role
  DROP CONSTRAINT IF EXISTS chk_usuario_role_role;
ALTER TABLE usuario_role
  ADD CONSTRAINT chk_usuario_role_role
  CHECK (role IN ('ADMIN','FINANCEIRO','TOMADOR','BACKOFFICE','...'));
```

**Regras**:
- Confirmar shape exato durante Task 14.0.4 (`grep -R "enum.*Role"`).
- Migration deve ser idempotente (`ON CONFLICT DO NOTHING` ou `IF NOT EXISTS`).

### Step 014.6.3 - Atualizar `AlterarRoleUsuarioUseCase`

**Comportamento**:
- Aceitar `BACKOFFICE` como role valida.
- Auditar promocao em `audit_log_seguranca` (reusar fluxo da Sprint 8).
- Roles cumulativas: usuario pode ter `FINANCEIRO + BACKOFFICE` simultaneamente.

**Regras**:
- Apenas `ADMIN` pode promover (regra existente).
- Step-up reforcado na borda REST (regra existente Sprint 8).

### Step 014.6.4 - Documentar matriz de permissoes

**Matriz minima** (a ser refletida no `BACKOFFICE.md` na Task 14.10):

| Acao | FINANCEIRO | BACKOFFICE | ADMIN |
|------|------------|------------|-------|
| Listar fila | sim | sim | sim |
| Assumir item | sim | sim | sim |
| Resolver/Ignorar | sim | sim | sim |
| Reprocessar | sim | sim | sim |
| Ver dashboard | sim | sim | sim |
| Registrar parecer credito | sim | **nao** | sim |
| Registrar recebimento | sim | **nao** | sim |
| Promover usuario | nao | nao | sim |

### Testes obrigatorios
- `RoleTest` (novo valor presente; helpers consistentes).
- `AlterarRoleUsuarioUseCaseTest` (promocao para BACKOFFICE; cumulatividade com FINANCEIRO; auditoria).
- Teste de seguranca: usuario BACKOFFICE tenta `POST /api/v1/credito/.../parecer` -> 403 (sera coberto na Task 14.9 IT, mas teste unitario do `@PreAuthorize` aqui se aplicavel).

### Definicao de pronto da Task 14.6
- [ ] Role `BACKOFFICE` adicionada ao enum.
- [ ] Migration V34 idempotente aplica em banco com dados.
- [ ] `AlterarRoleUsuarioUseCase` aceita nova role.
- [ ] Cumulatividade com FINANCEIRO validada em teste.
- [ ] Auditoria de promocao verificada.

---

## Task 14.7 - Endpoints REST, DTOs e OpenAPI

**Objetivo**: expor fila operacional, reprocessos e dashboard via API com step-up nos pontos sensiveis.

**Pre-requisito**: Tasks 14.3, 14.4, 14.5 e 14.6 concluidas.

**Esforco**: 1-2 dias.

**Arquivos principais**:
- `backoffice/web/controller/BackofficeController.java` (fila + comentarios + transicoes)
- `backoffice/web/controller/BackofficeReprocessoController.java`
- `backoffice/web/controller/BackofficeDashboardController.java`
- `backoffice/web/dto/ItemFilaResponse.java`
- `backoffice/web/dto/ItemFilaDetalheResponse.java`
- `backoffice/web/dto/ComentarioRequest.java`
- `backoffice/web/dto/ComentarioResponse.java`
- `backoffice/web/dto/ResolverRequest.java`
- `backoffice/web/dto/IgnorarRequest.java`
- `backoffice/web/dto/ReprocessoResponse.java`
- `backoffice/web/dto/DashboardResponse.java`
- `backoffice/web/mapper/BackofficeWebMapper.java`

### Step 014.7.1 - `BackofficeController` (fila + comentarios + transicoes)

**Endpoints**:
```text
GET    /api/v1/backoffice/fila
GET    /api/v1/backoffice/fila/{id}
POST   /api/v1/backoffice/fila/{id}/assumir
POST   /api/v1/backoffice/fila/{id}/comentarios
PATCH  /api/v1/backoffice/fila/{id}/resolver
PATCH  /api/v1/backoffice/fila/{id}/ignorar
```

**Auth**:
- `@PreAuthorize("hasAnyRole('FINANCEIRO','BACKOFFICE','ADMIN')")` em todos.
- `@RequireStepUp` em `resolver` e `ignorar`.

**Filtros do `GET /fila`**:
- `tipo`, `prioridade`, `status`, `data_abertura_de`, `data_abertura_ate`, `atribuido_a`.
- Paginacao via `Pageable` (Spring Data padrao).

**Regras**:
- Tamanho maximo de page: 100 (forcar via `@Max`).
- `GET /fila/{id}` carrega comentarios via `findByIdWithComentarios` (Task 14.1.8).

### Step 014.7.2 - `BackofficeReprocessoController`

**Endpoints**:
```text
POST /api/v1/backoffice/reprocessos/webhook/{webhookEventId}
POST /api/v1/backoffice/reprocessos/provider/{tipoChamada}/{idEntidade}
```

**Auth**:
- `@PreAuthorize("hasAnyRole('FINANCEIRO','BACKOFFICE','ADMIN')")`.
- `@RequireStepUp` em ambos.

**Body opcional** (em ambos):
```json
{
  "itemId": "uuid-opcional-pra-referenciar-item-da-fila"
}
```

**Regras**:
- `tipoChamada` validado contra `TipoChamadaProvider` (sealed); valor invalido -> 400.
- Limite 429 retorna mensagem `"Limite de 3 reprocessos por entidade em 24h excedido"`.

### Step 014.7.3 - `BackofficeDashboardController`

**Endpoint**:
```text
GET /api/v1/backoffice/dashboard
```

**Auth**:
- `@PreAuthorize("hasAnyRole('FINANCEIRO','BACKOFFICE','ADMIN')")`.

**Regras**:
- Sem cache de resposta nesta sprint (consumo direto do use case).
- Header `Cache-Control: no-store` para evitar cache de proxy/CDN com dados operacionais.

### Step 014.7.4 - DTOs e validacoes

**`ComentarioRequest`**:
```java
record ComentarioRequest(
    @NotBlank @Size(min = 1, max = 10000) String conteudo
) {}
```

**`ResolverRequest`** / **`IgnorarRequest`**:
```java
record ResolverRequest(
    @NotBlank @Size(min = 20, max = 10000) String justificativa
) {}
```

**Regras**:
- Bean Validation aplicada via `@Valid` no controller.
- Mapeamento DTO <-> dominio via `BackofficeWebMapper` (Adapter GoF, MapStruct opcional ou mapper manual).

### Step 014.7.5 - Documentar OpenAPI

**Regras**:
- `@Operation`, `@ApiResponses` e `@Schema` em todos os endpoints novos.
- Erros documentados: 400 (validation), 401 (sem auth), 403 (sem role / sem step-up), 404 (item inexistente), 409 (transicao invalida), 429 (anti-abuso reprocesso).
- Exemplos em `@Schema(example = ...)` para body e responses.

### Step 014.7.6 - Mapeamento de excecoes

**Regras**:
- `ConflictException` -> 409.
- `ValidationException` / Bean Validation -> 400.
- `LimiteReprocessoExcedidoException` -> 429.
- `UnsupportedOperationException` em dispatcher de provider -> 400.
- Reuso de `GlobalExceptionHandler` existente quando possivel.

### Testes obrigatorios
- `BackofficeControllerTest` (6 endpoints, happy + 403 sem step-up + 409 transicao + 400 validation).
- `BackofficeReprocessoControllerTest` (2 endpoints, happy + 403 sem step-up + 429 anti-abuso + 400 tipo invalido).
- `BackofficeDashboardControllerTest` (happy + 403 sem role).
- Testes de seguranca cobrindo:
  - `FINANCEIRO` consegue todas as acoes.
  - `BACKOFFICE` consegue todas as acoes da fila/reprocessos/dashboard.
  - `BACKOFFICE` recebe 403 em endpoints fora do escopo (parecer credito, recebimento) - cobertura no IT da Task 14.9.

### Definicao de pronto da Task 14.7
- [ ] 9 endpoints expostos.
- [ ] Step-up validado em 4 endpoints.
- [ ] DTOs com Bean Validation.
- [ ] OpenAPI completo (responses 200/400/403/404/409/429).
- [ ] Controller tests verdes.

---

## Task 14.8 - Auditoria reforcada

**Objetivo**: registrar eventos sensiveis de operacao de backoffice no `audit_log_seguranca`.

**Pre-requisito**: Tasks 14.3, 14.4 concluidas.

**Esforco**: 0,5 dia.

**Arquivos principais**:
- `shared/audit/TipoEventoSeguranca.java` (enum existente, ampliar)
- `backoffice/application/listener/BackofficeAuditListener.java`
- `src/main/resources/db/migration/V35__ampliar_audit_seguranca_tipo_backoffice.sql` (se houver check constraint em `audit_log_seguranca.tipo`)

### Step 014.8.1 - Ampliar tipos de audit

**Tipos novos**:
```text
ITEM_FILA_CRIADO
ITEM_ASSUMIDO
COMENTARIO_REGISTRADO
ITEM_RESOLVIDO
ITEM_IGNORADO
REPROCESSO_DISPARADO
```

**Regras**:
- Enum confirmado em `shared/audit/TipoEventoSeguranca.java` (Sprint 5 Task 5.7); cada sprint amplia + check constraint na migration correspondente (padrao V7/V13/V15/V16/V19/V22/V24/V29/V32).
- Migration `V35__ampliar_audit_seguranca_tipo_backoffice.sql` segue o mesmo template: `ALTER TABLE audit_log_seguranca DROP CONSTRAINT chk_audit_log_tipo; ALTER TABLE audit_log_seguranca ADD CONSTRAINT chk_audit_log_tipo CHECK (tipo IN (..., 'ITEM_FILA_CRIADO', 'ITEM_ASSUMIDO', 'COMENTARIO_REGISTRADO', 'ITEM_RESOLVIDO', 'ITEM_IGNORADO', 'REPROCESSO_DISPARADO'));`. Confirmar nome real da constraint nos prechecks (V32 e padroes anteriores).

### Step 014.8.2 - `BackofficeAuditListener`

**Comportamento**:
- `@TransactionalEventListener(AFTER_COMMIT)` + `@Transactional(REQUIRES_NEW)`.
- Escuta os 6 eventos publicados pelos use cases das Tasks 14.2, 14.3 e 14.4.
- Persiste registro em `audit_log_seguranca` via repository existente.

**Regras**:
- Payload JSON via `ObjectMapper`.
- Nao vazar:
  - CPF/CNPJ (qualquer campo de pessoa).
  - Conteudo completo de comentario (apenas primeiros 80 caracteres).
  - Token de step-up.
  - Payload bruto de webhook ou provider.
- Logar `entidadeId`, `tipo`, `status`, `autor`, `itemId`, `reprocessoId` quando aplicavel.

### Step 014.8.3 - Sanitizacao de payload

**Helper**:
```java
String resumirJustificativa(String justificativa) {
  return justificativa == null ? null
    : justificativa.length() <= 80 ? justificativa
    : justificativa.substring(0, 80) + "...";
}
```

**Regras**:
- Aplicar em `justificativa` de `ItemResolvidoEvent` e `ItemIgnoradoEvent`.
- Aplicar em `conteudo` de `ComentarioRegistradoEvent`.

### Testes obrigatorios
- `BackofficeAuditListenerTest` (6 eventos -> 6 registros; payload correto).
- Teste especifico de sanitizacao: comentario longo nao aparece inteiro no audit.
- Teste de privacidade: nenhum CPF/CNPJ aparece no payload mesmo se presente no evento original (caso eventos carreguem por engano).

### Definicao de pronto da Task 14.8
- [ ] 6 tipos novos aceitos.
- [ ] Listener cobre todos os eventos da Sprint 14.
- [ ] Falha de audit nao quebra fluxo principal.
- [ ] Testes de sanitizacao passam.

---

## Task 14.9 - Testes E2E (IT)

**Objetivo**: validar o fluxo completo do backoffice ponta-a-ponta, incluindo step-up, anti-abuso e cumulatividade de roles.

**Pre-requisito**: Tasks 14.1 a 14.8 concluidas.

**Esforco**: 1-2 dias.

**Arquivos principais**:
- `src/test/java/com/dynamis/sep_api/backoffice/web/BackofficeIT.java`
- `src/test/java/com/dynamis/sep_api/backoffice/web/ReprocessoIT.java`

### Cenarios obrigatorios - `BackofficeIT`

1. **Onboarding REPROVADO cria item**:
   - Disparar `OnboardingFinalizadoEvent(status=REPROVADO)` -> listener cria item com `tipo=ONBOARDING_ERRO`, `prioridade=ALTA`.
2. **Fluxo operador happy path**:
   - Operador `BACKOFFICE` lista fila -> assume item -> registra comentario -> resolve com justificativa >= 20 chars.
   - Validar transicoes em DB: `ABERTO -> EM_TRATAMENTO -> RESOLVIDO`.
   - Validar 4 entradas em `audit_log_seguranca`.
3. **403 sem step-up**:
   - Operador autenticado mas sem header `X-Step-Up-Token` tenta `PATCH /resolver` -> 403.
4. **BACKOFFICE recebe 403 em credito/cobranca sensiveis**:
   - Operador `BACKOFFICE` (sem `FINANCEIRO`) tenta `POST /api/v1/credito/.../parecer` -> 403.
   - Operador `BACKOFFICE` tenta `POST /api/v1/cobranca/.../recebimentos` -> 403.
5. **Dashboard retorna metricas**:
   - Popular massa minima e chamar `GET /dashboard` -> validar estrutura completa.
6. **Idempotencia**:
   - Disparar 2x o mesmo `ParcelaInadimplenteEvent` -> apenas 1 item ativo em `item_fila_operacional`.

### Cenarios obrigatorios - `ReprocessoIT`

1. **Reprocessar webhook**:
   - Outbox com `WebhookEvent` em estado falho -> operador chama `POST /reprocessos/webhook/{id}` com step-up -> reprocesso registrado e Outbox atualizada.
2. **Anti-abuso 429**:
   - Disparar 3 reprocessos no mesmo `webhookEventId` em janela -> 4o reprocesso retorna 429.

### Step 014.9.1 - Setup do IT

**Regras**:
- Usar perfil `@ActiveProfiles("test")` consistente com `sep_test`.
- `application-test.yml` com `scheduling-habilitado=false`, `app.backoffice.verificador.cron` desabilitado.
- `Clock` controlado via bean de teste (`Clock.fixed`).

### Step 014.9.2 - Cleanup ampliado

**Tabelas a truncar entre testes**:
- `item_fila_operacional`
- `comentario_interno`
- `reprocesso`
- `audit_log_seguranca` (cleanup parcial por tipo, conforme padrao Sprint 13).
- `webhook_event` (limpar somente os criados pelo teste).

### Comandos de validacao

```bash
cd <sep-api-root>
./gradlew test --tests "*BackofficeIT"
./gradlew test --tests "*ReprocessoIT"
./gradlew test --tests "*Backoffice*"
./gradlew check
```

### Definicao de pronto da Task 14.9
- [ ] `BackofficeIT` com 6 cenarios verdes.
- [ ] `ReprocessoIT` com 2 cenarios verdes.
- [ ] Regressao geral verde (`./gradlew check`).
- [ ] JaCoCo do modulo `backoffice` >= 70%.
- [ ] Cleanup nao deixa lixo entre suites.

---

## Task 14.10 - Documentacao, collection e fechamento Fase 2

**Objetivo**: fechar a sprint com documentacao operacional do modulo, atualizar PRD/CONTEXT marcando a Fase 2 como concluida (apos merge em `develop`), atualizar collections e AI-ROADMAP.

**Pre-requisito**: Task 14.9 concluida.

**Esforco**: 0,5-1 dia.

**Arquivos principais (working tree de docs-SEP)**:
- `docs-SEP/repos/sep-api/BACKOFFICE.md` (novo)
- PR description temporaria da Sprint 14 (novo)
- `docs-SEP/docs-sep/PRD.md` (§22 Sprint 14, §29 Fase 2 concluida)
- `docs-SEP/docs-sep/CONTEXT.md` (registrar conclusao Fase 2)
- `docs-SEP/AI-ROADMAP.md` (atualizar mapa por modulo)
- `docs-SEP/docs-sep/sep-api.postman_collection.json` (9 endpoints)
- `docs-SEP/docs-sep/collections/*` se aplicavel

### Step 014.10.1 - Criar `BACKOFFICE.md`

**Conteudo minimo**:
- Visao geral do modulo (objetivo, motivacao).
- Estrutura do modulo (`domain`, `application`, `infrastructure`, `web`).
- Fila operacional: tipos, prioridades, status, transicoes (com diagrama ASCII).
- Listeners e job consolidador (cron, thresholds).
- Use cases (fila, comentarios, resolucao, ignorar, reprocessos, dashboard).
- Endpoints REST (9) com exemplo curl.
- Role `BACKOFFICE` e matriz de permissoes (copiar Task 14.6.4).
- Step-up obrigatorio nos 4 endpoints sensiveis.
- Anti-abuso 3/24h em reprocessos.
- Auditoria reforcada (6 novos tipos).
- Integracao com modulos anteriores (onboarding, credito, contratos, cobranca, Outbox).
- Limitacoes e pendencias (SLA automatico, round-robin, exportacao - fora de escopo).

### Step 014.10.2 - Criar PR description temporaria da Sprint 14

**Conteudo**:
- Resumo tecnico (1-2 paragrafos).
- Migrations: V33 (tabelas backoffice), V34 (role BACKOFFICE), V35 (ampliar audit) se necessario.
- Endpoints (9 novos).
- Eventos novos (6 + 1 enum estendido).
- Testes (`BackofficeIT` 6 + `ReprocessoIT` 2 + unit tests).
- Riscos/breaking changes (nenhum breaking esperado).
- Pendencias pos-merge (PRD §22/§29 atualizado apenas apos merge).

### Step 014.10.3 - Atualizar PRD

**Regras**:
- PRD §22 (Sprint 14): marcar como **executada** apenas apos PR mergeado em `develop`.
- PRD §29 (Mapeamento Fase 2): marcar Fase 2 como **concluida**.
- Antes do merge, deixar working tree pronto mas NAO comitar.

### Step 014.10.4 - Atualizar `CONTEXT.md`

**Regras**:
- Registrar conclusao da Fase 2.
- Indicar transicao para Fase 3 (Frontend Web/Mobile da Fase 2, Epic 10, Epic 11, Epic 15 - conforme PRD).

### Step 014.10.5 - Atualizar `AI-ROADMAP.md`

**Mudancas**:
- Linha "Mapa por modulo" (atual linha 63): substituir `Futuro repos/sep-api/BACKOFFICE.md` por link real `[BACKOFFICE.md](repos/sep-api/BACKOFFICE.md)`.
- Adicionar nova linha em "Se a tarefa menciona...":
  - `fila operacional, backoffice, reprocesso, dashboard interno` -> `[BACKOFFICE.md](repos/sep-api/BACKOFFICE.md)`.
- Confirmar que todas as referencias a Sprint 14 apontam para spec + step + doc operacional.

### Step 014.10.6 - Atualizar Postman/Insomnia collection

**Requests minimos a adicionar**:
- `GET /api/v1/backoffice/fila`
- `GET /api/v1/backoffice/fila/{id}`
- `POST /api/v1/backoffice/fila/{id}/assumir`
- `POST /api/v1/backoffice/fila/{id}/comentarios`
- `PATCH /api/v1/backoffice/fila/{id}/resolver`
- `PATCH /api/v1/backoffice/fila/{id}/ignorar`
- `POST /api/v1/backoffice/reprocessos/webhook/{webhookEventId}`
- `POST /api/v1/backoffice/reprocessos/provider/{tipoChamada}/{idEntidade}`
- `GET /api/v1/backoffice/dashboard`

**Regras**:
- Reutilizar variables existentes (`{{baseUrl}}`, `{{accessToken}}`).
- Documentar header `X-Step-Up-Token` nos 4 endpoints sensiveis.
- JSON da collection valido (validar com `jq .` ou ferramenta equivalente).

### Step 014.10.7 - Validacao final

**Checklist**:
- [x] `BACKOFFICE.md` publicado e linkado no AI-ROADMAP.
- [x] PR description temporaria da Sprint 14 pronto para servir de description do PR.
- [x] Postman atualizado e JSON valido.
- [x] PRD §22/§29 atualizado apenas apos merge.
- [x] CONTEXT.md reflete conclusao Fase 2.
- [x] Nenhum commit em `docs-SEP` pelo agente (working tree apenas; commits manuais pelo dev).

### Definicao de pronto da Task 14.10
- [x] `BACKOFFICE.md` cobre dominio, endpoints, papeis e integracoes.
- [x] PR description temporaria da Sprint 14 criado.
- [x] Collection atualizada com 9 endpoints, JSON valido.
- [x] AI-ROADMAP revisado e consistente.
- [x] PRD/CONTEXT atualizados no momento correto (pos-merge).
- [x] Nada comitado em `docs-SEP` pelo agente.

---

## Definition of Done da Sprint 14

- [x] Modulo `backoffice` criado seguindo DDD + Hexagonal.
- [x] 3 entidades + 6 VOs sealed + 6 eventos de dominio.
- [x] Migration V33 (tabelas) e V34 (role) aplicadas.
- [x] 5 listeners + 1 job alimentando a fila operacional.
- [x] 9 use cases implementados (listar, consultar, assumir, comentario, resolver, ignorar, reprocessar webhook, reprocessar provider, dashboard).
- [x] Role `BACKOFFICE` adicionada; cumulatividade com `FINANCEIRO` foi aceita/adiada por decisao de escopo (modelo atual single-role).
- [x] 9 endpoints REST documentados em OpenAPI.
- [x] Step-up obrigatorio em 4 endpoints sensiveis (resolver, ignorar, reprocessar webhook, reprocessar provider).
- [x] Anti-abuso de reprocessos (3 por entidade/24h) operacional e testado; race residual best-effort aceita.
- [x] Auditoria reforcada com 6 novos tipos.
- [x] `BackofficeIT` com 7 cenarios + `ReprocessoIT` com 2 cenarios verdes.
- [x] Suite global verde registrada no fechamento da sprint.
- [x] JaCoCo/gate do repo sem regressao registrada no fechamento da sprint.
- [x] `BACKOFFICE.md` publicado.
- [x] PRD §29 marca **Fase 2 concluida** apos merge em `develop`.
- [x] CONTEXT.md e AI-ROADMAP atualizados.

## Riscos e pendencias conhecidas

- **Race na criacao concorrente de item da fila**: UNIQUE parcial + catch defensivo de `DataIntegrityViolationException` evita corrida; testar com 2 threads em integration.
- **Anti-abuso race**: contagem nao usa lock pessimista; em pico extremo um reprocesso extra pode passar. Mitigacao opcional: `SELECT FOR UPDATE` na contagem ou advisory lock por `entidadeId`. Decidir no review da Task 14.4.
- **Dashboard cross-module N+1**: queries agregadas via `GROUP BY` reduzem N+1, mas validar tempo de resposta com massa razoavel (>= 10k itens) em ambiente de homologacao.
- **Step-up MFA em 4 endpoints**: cenarios de token expirado, ausente e invalido cobertos no IT.
- **Resolucao do objeto original no `ConsultarItemFila`**: dispatcher Strategy precisa cobrir todos os `TipoEntidadeReferenciada`; tipo novo no futuro exige extensao explicita.
- **PRD §29 marca Fase 2 concluida**: texto critico; revisar diff antes do commit manual.
- **Reprocesso de provider depende de use cases existentes**: confirmar nas Sprints 6/7/9/11 que ha entrypoint publico de re-tentativa; se nao houver, criar wrapper minimo (sem regredir comportamento original).
- **Frontend de backoffice fora desta sprint**: Epic 13 entregara consumo das APIs futuramente; manter contratos REST estaveis ao final desta sprint.
- **Backoffice mobile permanentemente fora de escopo** (PRD §11): nao criar M-Sprint 14.
