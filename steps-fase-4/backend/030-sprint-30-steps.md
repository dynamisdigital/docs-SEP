# Steps - Sprint 30 - Matching credora <-> operacao

**Spec de origem**: [`030-sprint-30-credora-matching-operacao.md`](../../specs/fase-4/030-sprint-30-credora-matching-operacao.md)

**Status**: planejada (Epic 15; gate de produto). Matching continua **assistido**: o sistema sugere,
o operador financeiro/admin decide. Nenhum aporte, Pix ou associacao financeira e disparado
automaticamente.

**Objetivo geral**: evoluir a associacao assistida da Sprint 17 para um recorte de matching entre
credora e operacao financiada com regras explicitas de elegibilidade, sugestoes por snapshot sem
N+1, decisao assistida com step-up estrito e auditoria.

**Esforco total estimado**: 2-3 dias de Dev Senior Backend.

**Repos de destino**:
- `sep-api`: dominio `MatchingCredoraOperacao`, migration, portas/use cases, endpoints, auditoria e
  testes.
- `docs-SEP`: steps, OpenAPI/runtime docs, `CREDORES.md`, PRD/STATE/historico e PR description; Git
  manual.

**Branch sugerida**:
- `feature/sprint-30-credora-matching-operacao`

**Pre-requisitos**:
- Sprints 16-17 (`credores`/carteira), 27 (step-up estrito) e 29 (aporte + escrow fake) integradas
  em `develop`.
- Se Sprint 29 ainda nao estiver promovida a `main`, registrar a pendencia da cadeia antes de
  implementar e confirmar com o usuario se pode seguir de `develop`.
- Decisao assistida obrigatoria: nao criar motor automatico, job automatico, auto-aporte ou auto-Pix.
- Snapshot de sugestoes deve usar ports/consultas agregadas; evitar N+1.
- Erros e DTOs nao podem expor UUIDs internos, score sensivel, dados bancarios, provider, escrow,
  PII de tomador/credora ou motivo bruto.

## Contrato aprovado

```http
GET   /api/v1/credores/matching/sugestoes
POST  /api/v1/credores/matching/{sugestaoId}/decisao
GET   /api/v1/credores/matching/{sugestaoId}
```

### Regras de autorizacao

- `GET /sugestoes`: `ROLE_FINANCEIRO`/`ROLE_ADMIN`.
- `GET /{sugestaoId}`: `ROLE_FINANCEIRO`/`ROLE_ADMIN`.
- `POST /{sugestaoId}/decisao`: `ROLE_FINANCEIRO`/`ROLE_ADMIN` + `@RequireStepUpEstrito`.
- Ownership/segregacao no backend antes de retornar detalhes; inexistente/alheio deve ser neutro.

### Estados publicos da sugestao

```text
SUGERIDA -> CONFIRMADA
         -> REJEITADA
```

## Decisoes tecnicas

- Criar `MatchingCredoraOperacao` no modulo `credores`, pois o ciclo de vida pertence a carteira da
  credora e a associacao operacional entre credora e operacao.
- Sugestoes sao persistidas como snapshot: criterios usados, operacao, credora, valor elegivel e
  status ficam auditaveis sem depender de recalculo futuro.
- Geracao/listagem deve consultar elegibilidade em lote via ports/read models; nao iterar credoras x
  operacoes com queries por item.
- Confirmacao de matching nao registra aporte automaticamente. Se houver vinculo com aporte/operacao
  da Sprint 29, ele deve ser apenas referencia de decisao confirmada e sem duplicar regra de aporte.
- Transicoes de estado ficam encapsuladas no dominio; `CONFIRMADA` e `REJEITADA` sao terminais.
- Auditoria minima: `CREDORA_MATCHING_SUGERIDA`, `CREDORA_MATCHING_CONFIRMADA`,
  `CREDORA_MATCHING_REJEITADA`.
- Sem adapter real Celcoin/BaaS, sem chamada HTTP externa real, sem split Pix e sem automacao
  financeira.

## Protocolo obrigatorio por Task

1. Executar somente a Task liberada pelo usuario.
2. Confirmar codigo, contratos e migrations atuais antes de editar.
3. Escrever teste comportamental antes da mudanca quando o risco for elegibilidade, ownership,
   decisao, auditoria ou transicao de estado.
4. Implementar a menor mudanca coerente com os padroes dos modulos `credores`, `contratos`, `pix` e
   `escrow`.
5. Rodar verificacoes proporcionais por bloco e `./gradlew spotlessCheck`.
6. Parar em checkpoint pre-commit com status, diff, testes, riscos e mensagem sugerida.
7. Aguardar aprovacao antes de `git add` e `git commit`.
8. Usar paths especificos no staging; nunca `git add -A`.

**Skills obrigatorias**:
- `coding-guidelines`: simplicidade, mudancas cirurgicas e verificacao orientada a meta.
- `clean-code`: nomes intencionais, funcoes pequenas, transicoes explicitas e testes F.I.R.S.T.
- `clean-architecture`: use cases na aplicacao; DTO restrito a web; snapshots/queries via ports;
  dominio sem framework.
- `design-patterns-java`: evitar pattern-itis; usar ports/read models existentes em vez de nova
  abstracao especulativa.

## Ordem de execucao

```text
30.0 prechecks
  -> 30.1 regras de elegibilidade e contrato de snapshot
  -> 30.2 dominio, estados, migration e auditoria
  -> 30.3 ports/read models e geracao de sugestoes sem N+1
  -> 30.4 decisao assistida com step-up e vinculo operacional
  -> 30.5 endpoints GET/POST + DTOs publicos
  -> 30.6 integracao, OpenAPI, docs, collection e fechamento
```

---

## Gate 30.0 - Prechecks

**Objetivo**: confirmar cadeia Git, dependencias do modulo `credores`, baseline e regras de produto
antes de modelar matching.

### Step 030.0.1 - Confirmar cadeia de integracao

```bash
cd <sep-api-root>
git fetch --all --prune
git status --short --branch
git log --oneline --decorate -12 origin/develop
git log --oneline --decorate -12 origin/main
git diff --stat origin/main..origin/develop
git diff --stat origin/develop..origin/main
```

**Verificacao**:
- Sprints 16-17, 27 e 29 presentes em `origin/develop`.
- Divergencia `develop` -> `main` explicada; se for apenas Sprint 29 pendente de promocao,
  registrar explicitamente no checkpoint antes de iniciar a implementacao.
- Working tree limpo ou alteracoes do usuario identificadas.

### Step 030.0.2 - Criar branch

```bash
cd <sep-api-root>
git switch develop
git pull --ff-only
git switch -c feature/sprint-30-credora-matching-operacao
```

Tratar PR descriptions residuais (`SPRINT-29-PR.md`) somente depois de usadas no processo real de PR.
Nao remover documento residual sem confirmar se ja foi consumido.

### Step 030.0.3 - Reconfirmar modelo atual de credoras, oportunidades, carteira e aportes

```bash
cd <sep-api-root>
find src/main/java/com/dynamis/sep_api/credores -maxdepth 5 -type f | sort
rg -n "EmpresaCredora|PerfilCredora|OportunidadeInvestimento|InteresseCredora|OperacaoFinanciada|AporteCredora"   src/main/java/com/dynamis/sep_api/credores src/test/java/com/dynamis/sep_api/credores
rg -n "ASSOCIADA|ELEGIVEL|ATIVA|APROVADA|ASSINADO|capacidade_aporte|valor"   src/main/java/com/dynamis/sep_api/credores src/main/java/com/dynamis/sep_api/contratos
```

**Verificacao**:
- Confirmar como identificar credora `ATIVA`/`ELEGIVEL` e capacidade de aporte.
- Confirmar estados de oportunidade/operacao que podem entrar no matching.
- Confirmar se `AporteCredora` possui referencia adequada para vinculo posterior ou se o matching
  deve apenas referenciar `operacaoId`/`empresaCredoraId`.

### Step 030.0.4 - Reconfirmar step-up, auditoria e padroes web

```bash
cd <sep-api-root>
rg -n "RequireStepUpEstrito|PreAuthorize|hasAnyRole|Audit|Auditoria|EventoAuditoria"   src/main/java/com/dynamis/sep_api/credores src/main/java/com/dynamis/sep_api/security src/test/java
rg -n "ControllerTest|WebMvcTest|Credores.*Controller" src/test/java/com/dynamis/sep_api/credores
```

**Verificacao**:
- `@RequireStepUpEstrito` aplicado apenas no `POST /decisao`.
- Auditoria segue o listener/padrao atual do modulo `credores`.
- Testes de controller usam o mesmo arranjo das Sprints 27/29.

### Step 030.0.5 - Rodar baseline

```bash
cd <sep-api-root>
./gradlew check
```

Registrar resultado e contagem de testes antes da alteracao.

### Definicao de pronto do Gate 30.0

- [ ] Cadeia Git validada.
- [ ] Branch criada da base correta.
- [ ] Dependencias das Sprints 16-17, 27 e 29 confirmadas em `develop`.
- [ ] Divergencia `develop`/`main` registrada ou ausente.
- [ ] Padroes de step-up, auditoria e web reconfirmados.
- [ ] Baseline verde ou falha preexistente documentada.

---

## Task 30.1 - Regras de elegibilidade e contrato de snapshot

**Objetivo**: tornar explicitas as regras de matching antes de criar persistencia ou endpoint.

**Esforco**: 0,5 dia.

**Arquivos esperados**:
- testes de regra/elegibilidade em `credores`.
- classe de politica/regra de elegibilidade, se o codigo atual comportar.
- doc operacional atualizado em `CREDORES.md` ao final da sprint, nao necessariamente nesta task.

### Step 030.1.1 - Definir criterios iniciais

Criterios minimos esperados, ajustando ao codigo real:
- credora precisa estar `ATIVA` e `ELEGIVEL`.
- perfil/capacidade da credora precisa comportar o valor da operacao, quando `capacidade_aporte`
  existir.
- operacao/proposta precisa estar em estado elegivel para associacao financeira assistida.
- contrato associado precisa estar `ASSINADO` quando essa informacao for requisito ja usado pela
  Sprint 29.
- nao sugerir duplicata para par `empresaCredoraId + operacaoId` ja `SUGERIDA` pendente ou
  `CONFIRMADA`.
- nao sugerir operacao encerrada, liquidada, cancelada, alheia ao escopo ou com dados insuficientes.

Se algum criterio nao existir no codigo atual, registrar a decisao no step/checkpoint e implementar a
menor regra verificavel sem inventar campo novo fora da spec.

### Step 030.1.2 - Escrever testes de elegibilidade

Cobrir:
- credora elegivel + operacao elegivel gera candidato.
- credora inativa/inelegivel nao gera candidato.
- capacidade insuficiente nao gera candidato quando o campo existir.
- operacao em estado invalido nao gera candidato.
- par ja sugerido ou confirmado nao gera candidato duplicado.
- regra nao depende de dados sensiveis no DTO publico.

### Step 030.1.3 - Documentar contrato de snapshot interno

Definir os campos internos que a sugestao precisa persistir, por exemplo:
- `empresaCredoraId`.
- `operacaoId`.
- `valorOperacao` ou `valorElegivel`.
- `criteriosSnapshot` sanitizado.
- `status`.
- `dataSugestao`, `dataDecisao`, `decididoPorUsuarioId`.

Regras:
- `criteriosSnapshot` nao deve conter PII, score sensivel, payload provider ou dados bancarios.
- DTO publico pode expor apenas motivos/codigos funcionais sanitizados, se necessario.

### Verificacao

```bash
./gradlew test --tests "*Matching*Elegibilidade*" --tests "*MatchingCredoraOperacao*"
./gradlew spotlessCheck
```

### Definicao de pronto da Task 30.1

- [ ] Regras de elegibilidade estao descritas e cobertas por teste.
- [ ] Snapshot interno definido sem dados sensiveis.
- [ ] Duplicidade de sugestao foi considerada.
- [ ] Nenhum motor automatico ou job foi introduzido.

### Commit sugerido

```text
feat(credores): definir elegibilidade de matching
```

---

## Task 30.2 - Dominio, estados, migration e auditoria

**Objetivo**: introduzir o modelo persistido de sugestao/decisao de matching com transicoes
controladas e eventos auditaveis.

**Esforco**: 0,5 dia.

**Arquivos esperados**:
- `credores/domain/model/MatchingCredoraOperacao.java`
- `credores/domain/vo/StatusMatchingCredoraOperacao.java`
- porta/repository de persistencia conforme padrao atual do modulo.
- migration Flyway `Vxx__criar_matching_credora_operacao.sql`.
- migration Flyway `Vxx__ampliar_audit_seguranca_tipo_matching_credora.sql`.
- testes de dominio/repository correspondentes.

### Step 030.2.1 - Escrever testes de dominio

Cobrir:
- nova sugestao inicia em `SUGERIDA`.
- `SUGERIDA -> CONFIRMADA` valido.
- `SUGERIDA -> REJEITADA` valido.
- qualquer transicao a partir de terminal falha sem alterar estado.
- decisao registra ator, data e motivo sanitizado quando aplicavel.
- `toString`, excecoes e eventos nao vazam PII, provider, escrow ou UUIDs alheios.

### Step 030.2.2 - Criar entidade e enum

Regras:
- Nomear campos por intencao de negocio: `empresaCredoraId`, `operacaoId`, `status`,
  `valorElegivel`, `criteriosSnapshot`, `decididoPorUsuarioId`, `motivoDecisaoSanitizado`.
- Evitar setters abertos para status; usar metodos de dominio `confirmar(...)` e `rejeitar(...)`.
- `CONFIRMADA` e `REJEITADA` sao terminais.
- Se houver identificador publico, gerar valor seguro e nao sequencial conforme padrao do repo.

### Step 030.2.3 - Criar migration e constraints

Regras:
- FKs para credora/operacao sem `ON DELETE CASCADE`.
- Indice para `empresa_credora_id`, `operacao_id` e `status`.
- Constraint que evita duplicidade ativa do mesmo par, por exemplo UNIQUE parcial para
  `(empresa_credora_id, operacao_id)` quando `status in ('SUGERIDA','CONFIRMADA')`, se suportado
  pelo PostgreSQL e coerente com o padrao do repo.
- CHECK de status.
- Migration separada para tipos de auditoria `CREDORA_MATCHING_*` se o padrao atual exigir CHECK
  forward-only.

### Verificacao

```bash
./gradlew test --tests "*MatchingCredoraOperacao*"
./gradlew spotlessCheck
```

### Definicao de pronto da Task 30.2

- [ ] Entidade e enum representam os estados da spec.
- [ ] Transicoes invalidas protegidas por teste.
- [ ] Migration cria constraints e indices de leitura.
- [ ] Auditoria `CREDORA_MATCHING_*` suportada pela base.
- [ ] Nenhum campo sensivel e exposto por DTO ou mensagem.

### Commit sugerido

```text
feat(credores): modelar matching da credora
```

---

## Task 30.3 - Ports/read models e geracao de sugestoes sem N+1

**Objetivo**: gerar/listar sugestoes de matching por snapshot, consultando dados elegiveis em lote e
sem acoplamento a repositories de outros modulos na camada de aplicacao.

**Esforco**: 0,5-1 dia.

**Arquivos esperados**:
- `credores/application/usecase/GerarSugestoesMatchingCredoraUseCase.java` ou nome equivalente.
- ports em `credores/application/port/out` para snapshots de credoras/operacoes elegiveis, quando
  necessario.
- adapters em infrastructure usando queries agregadas/read models.
- testes unitarios do use case e testes de adapter/query quando aplicavel.

### Step 030.3.1 - Definir ports de snapshot

Contratos sugeridos, ajustando ao codigo real:

```text
listarCredorasElegiveisParaMatching()
listarOperacoesElegiveisParaMatching()
listarMatchingExistentePorPares(...)
salvarSugestoesNovas(...)
```

Regras:
- Porta retorna somente campos necessarios para regra de elegibilidade.
- Dados sensiveis ficam fora do snapshot ou entram apenas como sinal booleano/codigo sanitizado.
- Nao retornar entidades JPA de outros agregados para o use case.

### Step 030.3.2 - Escrever testes do use case de geracao

Cobrir:
- gera sugestao para par elegivel.
- nao duplica sugestao existente `SUGERIDA` ou `CONFIRMADA`.
- permite nova sugestao quando o par anterior foi `REJEITADA`, se essa for a decisao de produto;
  caso contrario, documentar que rejeicao tambem bloqueia nova sugestao.
- processa listas em lote sem chamada por item ao adapter mockado.
- registra auditoria `CREDORA_MATCHING_SUGERIDA` apenas para sugestoes novas.

### Step 030.3.3 - Implementar adapters/read models

Regras:
- Usar query em lote, projection ou repository especifico; evitar loop com query por credora ou por
  operacao.
- Ordenacao padrao: maior aderencia/valor primeiro, ou criterio simples e deterministico se nao
  houver score. Registrar a decisao no doc operacional.
- Paginacao ou limite: se o volume puder crescer, aceitar parametros de pagina/limite no use case e
  endpoint; se a spec atual nao exigir, aplicar limite conservador interno e documentar.

### Step 030.3.4 - Expor listagem de sugestoes para consulta operacional

Regras:
- `GET /sugestoes` deve ler sugestoes persistidas e/ou disparar refresh manual conforme decisao
  implementada. Nao criar job automatico.
- Se a geracao for acionada pelo GET, garantir idempotencia e registrar isso no `CREDORES.md`.
- Preferir separacao clara: use case de gerar/refresh e use case de listar.

### Verificacao

```bash
./gradlew test --tests "*GerarSugestoesMatching*" --tests "*ListarSugestoesMatching*"
./gradlew spotlessCheck
```

### Definicao de pronto da Task 30.3

- [ ] Sugestoes sao geradas por snapshot em lote.
- [ ] Nao ha N+1 evidente em credoras x operacoes.
- [ ] Duplicidade de sugestao bloqueada por regra e constraint.
- [ ] Auditoria de sugestao emitida uma vez por sugestao nova.
- [ ] Nenhum job automatico foi criado.

### Commit sugerido

```text
feat(credores): gerar sugestoes de matching
```

---

## Task 30.4 - Decisao assistida com step-up e vinculo operacional

**Objetivo**: permitir que financeiro/admin confirme ou rejeite uma sugestao com step-up estrito,
sem disparar aporte automatico.

**Esforco**: 0,5-1 dia.

**Arquivos esperados**:
- `credores/application/usecase/DecidirMatchingCredoraOperacaoUseCase.java`
- request/result de aplicacao para decisao.
- portas auxiliares para vinculo operacional com carteira/aporte, se necessarias.
- testes unitarios do use case.

### Step 030.4.1 - Escrever testes do use case de decisao

Cobrir:
- confirmar sugestao `SUGERIDA` altera status para `CONFIRMADA` e registra auditoria.
- rejeitar sugestao `SUGERIDA` altera status para `REJEITADA` e registra auditoria.
- confirmar/rejeitar sugestao inexistente retorna erro neutro.
- decisao sobre status terminal retorna `409` ou erro de dominio equivalente.
- decisao nao cria aporte automaticamente e nao chama provider/escrow.
- motivo de rejeicao/confirmacao e sanitizado.

### Step 030.4.2 - Implementar comando de decisao

Request interno minimo:

```text
acao = CONFIRMAR | REJEITAR
motivo opcional
```

Fluxo esperado:
1. Validar entrada.
2. Buscar sugestao com lock quando houver risco de decisao concorrente.
3. Validar status `SUGERIDA`.
4. Aplicar `confirmar` ou `rejeitar` no dominio.
5. Persistir decisao.
6. Registrar auditoria terminal correspondente.
7. Retornar result publico minimo.

### Step 030.4.3 - Vincular matching confirmado sem duplicar aporte

Regras:
- Se o codigo exigir marcar a operacao/carteira como associada ao matching, fazer por porta/use case
  explicito e idempotente.
- Nao criar `AporteCredora` nesta task.
- Nao chamar `RegistrarAporteCredoraUseCase`.
- Nao alterar regra de idempotencia da Sprint 29.
- Se a confirmacao apenas persiste `matching.confirmado`, documentar que o aporte continua fluxo
  separado da Sprint 29.

### Step 030.4.4 - Padronizar erros

Regras:
- `404` neutro para sugestao inexistente/alheia.
- `409` para decisao em status terminal ou conflito de concorrencia.
- `400` para acao/motivo invalido.
- `403` fica para autorizacao/step-up na borda web/aspecto.
- Mensagens nao incluem UUIDs, score, provider reference, dados de conta ou payload interno.

### Verificacao

```bash
./gradlew test --tests "*DecidirMatchingCredoraOperacaoUseCaseTest"
./gradlew spotlessCheck
```

### Definicao de pronto da Task 30.4

- [ ] Decisao assistida confirma/rejeita somente sugestoes `SUGERIDA`.
- [ ] Estados terminais protegidos contra replay/conflito.
- [ ] Auditoria terminal emitida uma unica vez.
- [ ] Confirmacao nao dispara aporte, Pix, escrow ou adapter real.
- [ ] Erros neutros nao permitem enumeracao.

### Commit sugerido

```text
feat(credores): decidir matching assistido
```

---

## Task 30.5 - Endpoints GET/POST + DTOs publicos

**Objetivo**: publicar o contrato REST da Sprint 30 com DTOs minimos, autorizacao correta e step-up
estrito apenas na decisao.

**Esforco**: 0,5 dia.

**Arquivos esperados**:
- controller de matching em `credores/web`.
- request/response DTOs dedicados.
- mapper web.
- testes de controller/web slice.

### Step 030.5.1 - Criar DTOs publicos

Response minimo de sugestao:

```text
id
operacaoId
empresaCredoraId
status
valorElegivel
criterios
criadaEm
decididaEm
```

Request de decisao:

```text
acao
motivo
```

Regras:
- Nao expor `criteriosSnapshot` bruto se ele tiver estrutura interna; mapear para codigos ou texto
  funcional sanitizado.
- Nao expor score sensivel, dados bancarios, documento, provider, escrow, idempotency key ou payload
  tecnico.
- Evitar DTO reaproveitado de dominio/JPA.

### Step 030.5.2 - Criar endpoints

```http
GET  /api/v1/credores/matching/sugestoes
GET  /api/v1/credores/matching/{sugestaoId}
POST /api/v1/credores/matching/{sugestaoId}/decisao
```

Regras:
- `GET`s com `hasAnyRole('FINANCEIRO','ADMIN')` ou padrao equivalente.
- `POST` com `hasAnyRole('FINANCEIRO','ADMIN')` + `@RequireStepUpEstrito`.
- Documentar `200`, `400`, `401`, `403`, `404`, `409`.
- Nao alterar endpoints existentes de oportunidades, interesses, carteira ou aportes.

### Step 030.5.3 - Testar borda web

Cobrir:
- sem autenticacao -> `401`.
- papel sem permissao -> `403`.
- `GET /sugestoes` permitido para financeiro/admin sem step-up.
- `GET /{id}` permitido para financeiro/admin sem step-up.
- `POST /decisao` sem step-up estrito -> `403`.
- acao invalida -> `400`.
- sugestao inexistente -> `404` neutro.
- decisao em terminal -> `409`.
- sucesso retorna DTO minimo e nao contem campos proibidos.

### Verificacao

```bash
./gradlew test --tests "*MatchingCredoraControllerTest" --tests "*DecidirMatchingCredoraOperacaoUseCaseTest"
./gradlew spotlessCheck
```

### Definicao de pronto da Task 30.5

- [ ] Endpoints publicados nos caminhos da spec.
- [ ] Step-up estrito aplicado somente ao `POST /decisao`.
- [ ] DTOs nao vazam campos internos ou dados sensiveis.
- [ ] Testes de autorizacao, step-up e erros passam.

### Commit sugerido

```text
feat(credores): expor matching assistido
```

---

## Task 30.6 - Integracao, OpenAPI, docs, collection e fechamento

**Objetivo**: validar o fluxo fim a fim e atualizar documentacao operacional sem ativar automacao
financeira.

**Esforco**: 0,5 dia.

### Step 030.6.1 - Testes de integracao e regressao

Cobrir pelo menos:
- refresh/listagem gera ou retorna sugestao para par elegivel.
- sugestao duplicada nao e criada em novo refresh/listagem.
- `GET /sugestoes` lista sugestoes para financeiro/admin.
- `GET /{id}` consulta sugestao existente.
- `POST /decisao` confirma com step-up.
- `POST /decisao` rejeita com step-up.
- decisao sem step-up retorna `403`.
- decisao repetida/terminal retorna `409`.
- confirmacao nao cria aporte automaticamente.
- resposta nao expoe campos proibidos.

### Step 030.6.2 - Rodar suite de verificacao

```bash
cd <sep-api-root>
./gradlew test --tests "*MatchingCredora*"
./gradlew spotlessCheck
./gradlew check
```

Se `check` falhar por causa preexistente, registrar comando, trecho relevante e evidencia de que a
falha nao foi introduzida pela sprint.

### Step 030.6.3 - Atualizar contratos e docs

Arquivos esperados:
- OpenAPI/Swagger do `sep-api`.
- collection Postman/HTTP usada no projeto, se existir e ainda estiver vigente.
- `docs-SEP/repos/sep-api/CREDORES.md`.
- `docs-SEP/repos/sep-api/SPRINT-30-PR.md`.
- `docs-SEP/docs-sep/STATE.md` e `CONTEXT-PARTE-2.md` no fechamento da sprint.
- `docs-SEP/docs-sep/PRD-FASE-4.md` quando a sprint for concluida/mergeada.

Conteudo minimo:
- endpoints `GET /api/v1/credores/matching/sugestoes`, `GET /api/v1/credores/matching/{id}` e
  `POST /api/v1/credores/matching/{id}/decisao`.
- roles e step-up estrito apenas na decisao.
- regras de elegibilidade implementadas.
- estados `SUGERIDA`, `CONFIRMADA`, `REJEITADA`.
- aviso explicito: decisao assistida, sem matching automatico, sem aporte automatico, sem Pix
  automatico e sem dinheiro real.

### Step 030.6.4 - Checkpoint final

Registrar:
- resumo do fluxo implementado.
- arquivos alterados.
- migrations criadas.
- testes rodados e resultado.
- riscos/remanescentes.
- confirmacao de que nenhum aporte/Pix/provider real foi acionado automaticamente.
- mensagem de PR/commit sugerida.

### Definicao de pronto da Task 30.6

- [ ] Fluxo de sugestao -> consulta -> decisao validado.
- [ ] `./gradlew check` verde ou falha preexistente documentada.
- [ ] OpenAPI/collection/docs operacionais atualizados.
- [ ] `SPRINT-30-PR.md` criado com evidencias.
- [ ] `STATE.md` e historico atualizados no fechamento.
- [ ] F-Sprint 18 e M-Sprint 16 permanecem desbloqueadas apenas por contrato backend em `develop`.

### Commit sugerido

```text
docs: documentar fechamento da sprint 30
```

---

## Definition of Done da Sprint 30

- [ ] Sistema gera ou lista sugestoes de matching por regras explicitas e testadas.
- [ ] Sugestoes sao persistidas como snapshot sem dados sensiveis.
- [ ] Geracao usa ports/read models em lote, sem N+1 evidente.
- [ ] Estados `SUGERIDA`, `CONFIRMADA` e `REJEITADA` estao modelados e testados.
- [ ] Decisao e sempre assistida por financeiro/admin com step-up estrito no `POST`.
- [ ] Nenhum matching e confirmado automaticamente.
- [ ] Confirmacao nao cria aporte, Pix, escrow ou chamada externa automaticamente.
- [ ] Auditoria registra `CREDORA_MATCHING_SUGERIDA`, `CREDORA_MATCHING_CONFIRMADA` e
  `CREDORA_MATCHING_REJEITADA`.
- [ ] Erros nao permitem enumeracao nem vazam UUID, PII, score sensivel, dados de escrow/provider ou
  payload bancario.
- [ ] OpenAPI, collection vigente, `CREDORES.md` e `SPRINT-30-PR.md` atualizados.
- [ ] `./gradlew check` passa ou falha preexistente fica documentada com evidencia.
