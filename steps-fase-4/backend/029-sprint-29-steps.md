# Steps - Sprint 29 - Aporte da credora + escrow

**Spec de origem**: [`029-sprint-29-credora-aporte-escrow.md`](../../specs/fase-4/029-sprint-29-credora-aporte-escrow.md)

**Status**: planejada (Epic 15; gate de produto/credenciais; ativacao real Celcoin/BaaS fica para
Fase 5).

**Objetivo geral**: modelar e expor o aporte assistido da credora em operacao financiada da sua
carteira, registrando a movimentacao no escrow via `EscrowProvider` fake default, com step-up
estrito, idempotencia e reconciliacao de status. Nenhum dinheiro real e movido nesta sprint.

**Esforco total estimado**: 2-3 dias de Dev Senior Backend.

**Repos de destino**:
- `sep-api`: dominio `AporteCredora`, migration, portas/use cases, endpoints, reconciliacao fake,
  auditoria e testes.
- `docs-SEP`: steps, OpenAPI/collection, `CREDORES.md`, `PIX.md secao escrow`,
  PRD/STATE/historico e PR description; Git manual.

**Branch sugerida**:
- `feature/sprint-29-credora-aporte-escrow`

**Pre-requisitos**:
- Sprints 16-17 (`credores`), 19 (`escrow`/`EscrowProvider`), 27 (step-up estrito) e 28 integradas
  em `develop` e promovidas conforme cadeia vigente.
- `EscrowProvider` fake segue como default; adapter Celcoin/BaaS real permanece desligado.
- Operacao financiada da credora consegue ser resolvida com ownership sem vazar existencia de
  operacao alheia.
- Contrato associado a operacao possui estado `ASSINADO` disponivel para elegibilidade do aporte.
- Mecanismo de idempotencia por `Idempotency-Key` existente ou padrao equivalente confirmado antes
  de implementar.

## Contrato aprovado

```http
POST /api/v1/credores/operacoes/{operacaoId}/aportes
GET  /api/v1/credores/operacoes/{operacaoId}/aportes
```

### Regras de autorizacao

- `POST`: `ROLE_FINANCEIRO`/`ROLE_ADMIN`, com `@RequireStepUpEstrito`.
- `GET`: financeiro/admin ou credora dona em leitura owner-scoped.
- Ownership antes de revelar existencia; operacao alheia e inexistente retornam resposta neutra.
- Elegibilidade: operacao precisa pertencer a carteira da credora e contrato precisa estar
  `ASSINADO`; caso contrario `409`.
- Erros nao expoem UUIDs, identificadores externos, dados de escrow, provider, conta ou payload
  bancario.

### Estados publicos do aporte

```text
PENDENTE -> EM_PROCESSAMENTO -> LIQUIDADO
                             -> FALHOU
```

## Decisoes tecnicas

- Criar agregado/modelo `AporteCredora` no modulo `credores`, pois o ciclo de vida pertence a
  operacao financiada da credora; a comunicacao com escrow ocorre por porta/provider.
- Persistir o estado do aporte com `operacaoId`, valor, moeda, status, idempotency key,
  identificador publico seguro, referencia escrow/provider sanitizada e timestamps auditaveis.
- Nao expor identificador externo bruto do provider nem dados internos de escrow nos DTOs.
- `POST` e assistido por financeiro/admin: credora dona da operacao e contrato assinado sao
  validados no backend; a credora em si nao inicia o aporte nesta sprint.
- Usar idempotencia por `Idempotency-Key`: mesma chave para mesma operacao deve retornar o mesmo
  aporte; chave reutilizada com payload conflitante deve falhar de forma controlada.
- Transicoes de estado ficam encapsuladas no dominio; reconciliacao fake e idempotente.
- Auditoria minima: `CREDORA_APORTE_REGISTRADO`, `CREDORA_APORTE_LIQUIDADO`,
  `CREDORA_APORTE_FALHOU`.
- Sem adapter real Celcoin, sem chamada HTTP externa real, sem split Pix, sem matching automatico e
  sem ativar automacao financeira.

## Protocolo obrigatorio por Task

1. Executar somente a Task liberada pelo usuario.
2. Confirmar codigo, contratos e migrations atuais antes de editar.
3. Escrever teste comportamental antes da mudanca quando o risco for ownership, idempotencia,
   elegibilidade ou transicao de estado.
4. Implementar a menor mudanca coerente com os padroes dos modulos `credores`, `pix` e `escrow`.
5. Rodar verificacoes proporcionais por bloco e `./gradlew spotlessCheck`.
6. Parar em checkpoint pre-commit com status, diff, testes, riscos e mensagem sugerida.
7. Aguardar aprovacao antes de `git add` e `git commit`.
8. Usar paths especificos no staging; nunca `git add -A`.

**Skills obrigatorias**:
- `coding-guidelines`: simplicidade, mudancas cirurgicas e verificacao orientada a meta.
- `clean-code`: nomes intencionais, funcoes pequenas, transicoes explicitas e testes F.I.R.S.T.
- `clean-architecture`: use cases na aplicacao; DTO restrito a web; provider/escrow via porta;
  dominio sem framework.
- `design-patterns-java`: evitar pattern-itis; usar provider/ports existentes em vez de nova
  abstracao especulativa.

## Ordem de execucao

```text
29.0 prechecks
  -> 29.1 dominio, estados e migration
  -> 29.2 porta/adaptacao para registrar aporte no escrow fake
  -> 29.3 use case assistido de registro com elegibilidade e idempotencia
  -> 29.4 endpoint POST /aportes + auditoria
  -> 29.5 reconciliacao fake de status e transicoes idempotentes
  -> 29.6 endpoint GET /aportes owner-scoped
  -> 29.7 testes de integracao, OpenAPI, docs, collection e fechamento
```

---

## Gate 29.0 - Prechecks

**Objetivo**: confirmar cadeia Git, dependencias de credora/escrow/step-up e baseline antes de
modelar o aporte.

### Step 029.0.1 - Confirmar cadeia de integracao

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
- Sprints 16-17, 19, 27 e 28 presentes na cadeia esperada.
- `develop` e `main` sem divergencia de produto nao explicada.
- Working tree limpo ou alteracoes do usuario identificadas.

### Step 029.0.2 - Criar branch

```bash
cd <sep-api-root>
git switch develop
git pull --ff-only
git switch -c feature/sprint-29-credora-aporte-escrow
```

Tratar PR descriptions residuais (`SPRINT-27-PR.md`, `SPRINT-28-PR.md`) somente depois de usadas no
processo real de PR. Nao remover documento residual sem confirmar se ja foi consumido.

### Step 029.0.3 - Reconfirmar contratos atuais de credoras e operacoes

```bash
cd <sep-api-root>
find src/main/java/com/dynamis/sep_api/credores -maxdepth 4 -type f | sort
rg -n "OperacaoFinanciada|EmpresaCredora|Carteira|ASSINADO|Contrato" \
  src/main/java/com/dynamis/sep_api/credores src/main/java/com/dynamis/sep_api/contratos
rg -n "findByIdAndEmpresaCredoraId|findByUsuarioId|operacao" \
  src/main/java/com/dynamis/sep_api/credores
```

**Verificacao**:
- Confirmar onde `OperacaoFinanciada` guarda `contratoId`, `empresaCredoraId`, valor e status.
- Confirmar padrao atual de ownership da credora e de leitura por financeiro/admin.
- Confirmar como obter o status `ASSINADO` do contrato sem acoplar application a infrastructure de
  outro modulo.

### Step 029.0.4 - Reconfirmar escrow/provider fake e step-up estrito

```bash
cd <sep-api-root>
rg -n "EscrowProvider|RegistrarMovimentacaoEscrow|escrow" src/main/java src/test/java
rg -n "RequireStepUpEstrito|aplicarEstrito|X-Step-Up-Token" src/main/java src/test/java
```

**Verificacao**:
- Provider fake default identificado e testavel sem mover dinheiro real.
- API atual do escrow permite registrar uma movimentacao de aporte ou exige porta de aplicacao nova
  com adapter para o provider existente.
- `@RequireStepUpEstrito` vigente e ja coberto por testes de controller/aspecto.

### Step 029.0.5 - Reconfirmar idempotencia e auditoria

```bash
cd <sep-api-root>
rg -n "Idempotency-Key|idempotency|Idempotencia|Audit|Auditoria|EventoAuditoria" \
  src/main/java src/test/java
```

**Verificacao**:
- Reusar padrao existente de idempotencia se houver.
- Reusar padrao existente de auditoria/eventos; nao criar mecanismo paralelo.
- Confirmar formato de eventos antes de nomear `CREDORA_APORTE_*`.

### Step 029.0.6 - Rodar baseline

```bash
cd <sep-api-root>
./gradlew check
```

Registrar resultado e contagem de testes antes da alteracao.

### Definicao de pronto do Gate 29.0

- [ ] Cadeia Git validada.
- [ ] Branch criada da base correta.
- [ ] Contratos de credora/operacao/contrato reconfirmados.
- [ ] Provider fake de escrow e step-up estrito reconfirmados.
- [ ] Padroes de idempotencia e auditoria reconfirmados.
- [ ] Baseline verde ou falha preexistente documentada.

---

## Task 29.1 - Dominio, estados e migration

**Objetivo**: introduzir o modelo persistido de aporte da credora com estados e transicoes
controladas.

**Esforco**: 0,5 dia.

**Arquivos esperados**:
- `credores/domain/model/AporteCredora.java`
- `credores/domain/vo/StatusAporteCredora.java`
- `credores/infrastructure/persistence/AporteCredoraRepository.java`
- migration Flyway `Vxx__cria_aporte_credora.sql`
- testes de dominio/repository correspondentes.

### Step 029.1.1 - Escrever testes de dominio

Cobrir:
- novo aporte inicia em `PENDENTE` ou estado inicial definido apos registro local, conforme codigo
  atual exigir; documentar decisao.
- transicao para `EM_PROCESSAMENTO` quando o provider fake aceita o registro.
- transicao para `LIQUIDADO` a partir de `EM_PROCESSAMENTO`.
- transicao para `FALHOU` a partir de `EM_PROCESSAMENTO`.
- transicoes invalidas falham sem alterar estado.
- dados sensiveis de provider/escrow nao entram em `toString` ou mensagens de erro.

### Step 029.1.2 - Criar entidade e enum

Regras:
- Nomear campos por intencao de negocio: `operacaoId`, `empresaCredoraId`, `valor`, `moeda`,
  `status`, `idempotencyKey`, `referenciaEscrow`, `motivoFalhaSanitizado`.
- Evitar nullable em campos obrigatorios; usar construtor/factory que garanta invariantes.
- Encapsular mudanca de estado em metodos do dominio, nao em setters abertos.

### Step 029.1.3 - Criar migration e repository

Regras:
- Indice unico para idempotencia por operacao + chave.
- Indices para leitura por `operacao_id` e `empresa_credora_id`.
- Campo para referencia provider/escrow deve ser interno e nunca publicamente documentado.
- Repository fica em `infrastructure.persistence`; use cases acessam por porta, se o modulo ja
  estiver seguindo esse padrao, ou por repository apenas se for o padrao atual de `credores`.

### Verificacao

```bash
./gradlew test --tests "*AporteCredora*"
./gradlew spotlessCheck
```

### Definicao de pronto da Task 29.1

- [ ] Entidade e enum representam todos os estados da spec.
- [ ] Transicoes invalidas protegidas por teste.
- [ ] Migration cria unicidade de idempotencia e indices de leitura.
- [ ] Nenhum campo sensivel e exposto por DTO ou mensagem.

### Commit sugerido

```text
feat(credores): modelar aporte da credora
```

---

## Task 29.2 - Porta/adaptacao para registrar aporte no escrow fake

**Objetivo**: integrar o registro do aporte ao escrow sem acoplar o use case a detalhes do provider
fake ou de infraestrutura.

**Esforco**: 0,5 dia.

**Arquivos esperados**:
- porta de aplicacao em `credores/application/port/out` ou reuso de porta existente de escrow.
- adapter em `credores/infrastructure/adapter` ou modulo escrow equivalente.
- DTO/result interno para retorno do registro de aporte no escrow.
- testes de adapter/use case fake conforme padrao existente.

### Step 029.2.1 - Definir contrato da porta

O contrato deve expressar a intencao de negocio, por exemplo:

```text
registrarAporte(operacaoId, empresaCredoraId, valor, idempotencyKey)
```

Regras:
- Retornar somente dados necessarios para persistir/reconciliar status.
- Nao retornar payload bancario, conta, segredo, chave provider ou erro bruto.
- Preservar idempotencia tambem no provider fake quando a mesma chave for recebida.

### Step 029.2.2 - Implementar adapter fake/escrow

Regras:
- Delegar ao `EscrowProvider` fake ou componente equivalente existente.
- Mapear erro bruto para motivo sanitizado.
- Nao ativar profile/bean real Celcoin.
- Nao introduzir chamada HTTP externa nesta sprint.

### Step 029.2.3 - Testar integracao fake

Cobrir:
- registro aceito retorna referencia interna e status processavel.
- mesma chave idempotente retorna o mesmo resultado.
- falha fake e mapeada para erro/motivo sanitizado.
- nenhuma configuracao liga adapter real.

### Verificacao

```bash
./gradlew test --tests "*Escrow*" --tests "*Aporte*"
./gradlew spotlessCheck
```

### Definicao de pronto da Task 29.2

- [ ] Use case nao conhece detalhes do provider fake.
- [ ] Provider fake registra aporte de forma idempotente.
- [ ] Erros brutos sao sanitizados.
- [ ] Adapter real continua desligado/inexistente nesta fase.

### Commit sugerido

```text
feat(credores): registrar aporte no escrow fake
```

---

## Task 29.3 - Use case assistido de registro com elegibilidade e idempotencia

**Objetivo**: orquestrar o registro assistido do aporte, validando permissao, carteira, contrato
assinado e idempotencia antes de chamar o escrow.

**Esforco**: 0,5-1 dia.

**Arquivos esperados**:
- `credores/application/usecase/RegistrarAporteCredoraUseCase.java`
- DTO/result de aplicacao para aporte.
- portas auxiliares para consulta de contrato/operacao, se necessarias.
- testes unitarios do use case.

### Step 029.3.1 - Escrever testes do use case

Cobrir:
- financeiro/admin registra aporte para operacao elegivel com contrato `ASSINADO`.
- operacao inexistente ou alheia retorna erro neutro antes de revelar estado.
- operacao fora da carteira da credora nao registra aporte.
- contrato diferente de `ASSINADO` retorna `409`.
- mesma `Idempotency-Key` na mesma operacao retorna o mesmo aporte sem duplicar chamada efetiva.
- mesma chave com payload conflitante falha de forma controlada.
- erro do provider fake marca aporte como `FALHOU` ou propaga erro conforme decisao registrada.
- auditoria de registro e disparada uma unica vez por aporte novo.

### Step 029.3.2 - Implementar fluxo principal

Fluxo esperado:
1. Validar entrada e presenca de `Idempotency-Key`.
2. Resolver operacao com ownership/escopo autorizado sem vazar existencia.
3. Validar contrato `ASSINADO`.
4. Verificar idempotencia local por operacao + chave.
5. Criar aporte e registrar tentativa.
6. Chamar porta de escrow fake.
7. Atualizar status para `EM_PROCESSAMENTO` ou falha sanitizada.
8. Registrar auditoria `CREDORA_APORTE_REGISTRADO` quando aplicavel.
9. Retornar result publico minimo.

### Step 029.3.3 - Padronizar erros

Regras:
- `404` neutro para operacao inexistente/alheia quando aplicavel.
- `409` para contrato nao assinado ou aporte incompativel com estado da operacao.
- `400` para valor invalido ou ausencia de idempotency key.
- `403` fica para autorizacao/step-up na borda web/aspecto.
- Mensagens nao incluem UUIDs, provider reference, dados de conta ou payload interno.

### Verificacao

```bash
./gradlew test --tests "*RegistrarAporteCredoraUseCaseTest"
./gradlew spotlessCheck
```

### Definicao de pronto da Task 29.3

- [ ] Elegibilidade carteira + contrato `ASSINADO` coberta por teste.
- [ ] Idempotencia local impede aporte duplicado.
- [ ] Erros neutros nao permitem enumeracao.
- [ ] Auditoria de registro nao duplica em replay idempotente.

### Commit sugerido

```text
feat(credores): registrar aporte assistido da credora
```

---

## Task 29.4 - Endpoint POST /aportes + auditoria

**Objetivo**: publicar o contrato REST de criacao assistida do aporte com step-up estrito e DTO
publico minimo.

**Esforco**: 0,5 dia.

**Arquivos esperados**:
- controller de credoras/operacoes existente ou novo controller especifico.
- request/response DTOs de aporte.
- mapper web.
- testes de controller/web slice.

### Step 029.4.1 - Criar DTOs publicos

Request minimo esperado:

```text
valor
```

Response minimo esperado:

```text
id
operacaoId
status
valor
dataCriacao
dataAtualizacao
```

Regras:
- `Idempotency-Key` vem de header, nao do corpo.
- Nao expor `idempotencyKey`, `referenciaEscrow`, identificador externo, conta, chave Pix, provider
  ou motivo tecnico bruto.

### Step 029.4.2 - Criar endpoint

```http
POST /api/v1/credores/operacoes/{operacaoId}/aportes
```

Regras:
- `@PreAuthorize("hasAnyRole('FINANCEIRO','ADMIN')")` ou padrao equivalente existente.
- `@RequireStepUpEstrito`.
- Header `Idempotency-Key` obrigatorio.
- Documentar `201/200` conforme semantica idempotente adotada, alem de `400`, `401`, `403`, `404`,
  `409`.
- Nao alterar endpoints existentes de oportunidades, interesses ou carteira.

### Step 029.4.3 - Testar borda web

Cobrir:
- sem autenticacao -> `401`.
- papel sem permissao -> `403`.
- sem step-up estrito -> `403`.
- sem `Idempotency-Key` -> `400`.
- contrato nao assinado -> `409`.
- sucesso retorna DTO minimo.
- replay idempotente retorna o mesmo aporte sem duplicar auditoria.

### Verificacao

```bash
./gradlew test --tests "*AporteCredoraControllerTest" --tests "*RegistrarAporteCredoraUseCaseTest"
./gradlew spotlessCheck
```

### Definicao de pronto da Task 29.4

- [ ] Endpoint `POST` publicado no caminho da spec.
- [ ] Step-up estrito aplicado.
- [ ] Header `Idempotency-Key` obrigatorio.
- [ ] DTO nao vaza campos internos.
- [ ] Testes de autorizacao, step-up e contrato passam.

### Commit sugerido

```text
feat(credores): expor registro de aporte assistido
```

---

## Task 29.5 - Reconciliacao fake de status

**Objetivo**: permitir que o provider fake confirme liquidacao ou falha do aporte de forma
idempotente, atualizando estado e auditoria.

**Esforco**: 0,5 dia.

**Arquivos esperados**:
- use case/handler de reconciliacao de aporte.
- endpoint interno/webhook fake se o padrao do provider exigir.
- testes de reconciliacao e transicoes.

### Step 029.5.1 - Confirmar padrao de webhook/callback existente

```bash
cd <sep-api-root>
rg -n "webhook|callback|conciliacao|reconciliacao|Fake" \
  src/main/java/com/dynamis/sep_api/pix src/main/java/com/dynamis/sep_api/**/web
```

**Verificacao**:
- Reusar o mesmo estilo das sprints Pix/escrow existentes.
- Se nao houver endpoint fake, preferir handler/use case interno testavel e documentar como o fake o
  aciona.

### Step 029.5.2 - Implementar reconciliacao

Regras:
- Buscar aporte pela referencia interna segura ou chave definida na Task 29.2.
- Reconciliar `EM_PROCESSAMENTO -> LIQUIDADO` ou `EM_PROCESSAMENTO -> FALHOU`.
- Replay do mesmo evento nao altera novamente nem duplica auditoria.
- Evento conflitante apos terminal (`LIQUIDADO`/`FALHOU`) e ignorado ou rejeitado conforme padrao
  atual, sempre sem expor dado sensivel.

### Step 029.5.3 - Auditoria de terminal

Registrar:
- `CREDORA_APORTE_LIQUIDADO` na primeira liquidacao.
- `CREDORA_APORTE_FALHOU` na primeira falha terminal.

Nao registrar auditoria em replay identico.

### Verificacao

```bash
./gradlew test --tests "*ReconciliarAporteCredora*"
./gradlew spotlessCheck
```

### Definicao de pronto da Task 29.5

- [ ] Reconciliacao fake e idempotente.
- [ ] Estados terminais protegidos contra replay/conflito.
- [ ] Auditoria terminal emitida uma unica vez.
- [ ] Nenhum webhook real externo foi ativado.

### Commit sugerido

```text
feat(credores): reconciliar status do aporte
```

---

## Task 29.6 - Endpoint GET /aportes owner-scoped

**Objetivo**: expor a leitura dos aportes da operacao para usuarios autorizados, sem revelar dados
internos ou permitir enumeracao.

**Esforco**: 0,5 dia.

**Arquivos esperados**:
- `ConsultarAportesOperacaoUseCase.java`
- endpoint `GET /api/v1/credores/operacoes/{operacaoId}/aportes`
- DTO/mapper de resposta.
- testes de use case e controller.

### Step 029.6.1 - Escrever testes do use case

Cobrir:
- financeiro/admin autorizado lista aportes da operacao.
- credora dona lista aportes da propria operacao.
- credora alheia recebe resposta neutra.
- operacao inexistente e alheia sao indistinguiveis.
- lista vazia e permitida quando a operacao existe e pertence ao escopo autorizado.
- resposta nao contem campos internos de escrow/provider.

### Step 029.6.2 - Implementar consulta owner-scoped

Regras:
- Resolver autorizacao/ownership antes de buscar aportes.
- Ordenar por criacao decrescente ou padrao ja usado no modulo; registrar a decisao.
- Retornar DTO minimo com `id`, `operacaoId`, `status`, `valor`, `dataCriacao`,
  `dataAtualizacao`.
- Sem step-up no `GET`; leitura e read-only.

### Step 029.6.3 - Criar endpoint GET

```http
GET /api/v1/credores/operacoes/{operacaoId}/aportes
```

Documentar `200`, `401`, `403`, `404`.

### Verificacao

```bash
./gradlew test --tests "*ConsultarAportesOperacaoUseCaseTest" --tests "*AporteCredoraControllerTest"
./gradlew spotlessCheck
```

### Definicao de pronto da Task 29.6

- [ ] Leitura owner-scoped implementada.
- [ ] `GET` read-only e sem step-up.
- [ ] Operacao alheia/inexistente nao permite enumeracao.
- [ ] DTO nao expoe campos internos.

### Commit sugerido

```text
feat(credores): consultar aportes da operacao
```

---

## Task 29.7 - Integracao, OpenAPI, docs, collection e fechamento

**Objetivo**: validar o fluxo fim a fim fake/local e atualizar documentacao operacional sem ativar
dinheiro real.

**Esforco**: 0,5 dia.

### Step 029.7.1 - Testes de integracao e regressao

Cobrir pelo menos:
- `POST` cria aporte em operacao elegivel e retorna status processavel.
- replay com mesma `Idempotency-Key` retorna mesmo aporte.
- reconciliacao fake liquida o aporte.
- reconciliacao fake falha o aporte.
- `GET` lista aportes owner-scoped.
- contrato nao assinado retorna `409`.
- sem step-up estrito no `POST` retorna `403`.

### Step 029.7.2 - Rodar suite de verificacao

```bash
cd <sep-api-root>
./gradlew test --tests "*AporteCredora*"
./gradlew spotlessCheck
./gradlew check
```

Se `check` falhar por causa preexistente, registrar comando, trecho relevante e evidencia de que a
falha nao foi introduzida pela sprint.

### Step 029.7.3 - Atualizar contratos e docs

Arquivos esperados:
- OpenAPI/Swagger do `sep-api`.
- collection Postman/HTTP usada no projeto, se existir.
- `docs-SEP/repos/sep-api/CREDORES.md`.
- `docs-SEP/repos/sep-api/PIX.md` na secao de escrow/provider.
- `docs-SEP/repos/sep-api/SPRINT-29-PR.md`.

Conteudo minimo:
- endpoints `POST/GET /api/v1/credores/operacoes/{operacaoId}/aportes`;
- roles, step-up estrito no `POST` e ausencia de step-up no `GET`;
- idempotencia por `Idempotency-Key`;
- estados publicos;
- aviso explicito: provider fake/local, sem dinheiro real, Celcoin/BaaS real so na Fase 5.

### Step 029.7.4 - Checkpoint final

Registrar:
- resumo do fluxo implementado;
- arquivos alterados;
- migrations criadas;
- testes rodados e resultado;
- riscos/remanescentes;
- confirmacao de que adapter real nao foi ativado;
- mensagem de PR/commit sugerida.

### Definicao de pronto da Task 29.7

- [ ] Fluxo `POST -> provider fake -> reconciliacao -> GET` validado.
- [ ] `./gradlew check` verde ou falha preexistente documentada.
- [ ] OpenAPI/collection/docs operacionais atualizados.
- [ ] `SPRINT-29-PR.md` criado com evidencias.
- [ ] Fase 5 continua dona da ativacao real Celcoin/BaaS.

### Commit sugerido

```text
docs: documentar fechamento da sprint 29
```

---

## Definition of Done da Sprint 29

- [ ] Financeiro/admin registra aporte assistido apenas para operacao elegivel da carteira, com
  step-up estrito.
- [ ] Aporte e registrado no escrow fake de forma idempotente.
- [ ] Estados `PENDENTE`, `EM_PROCESSAMENTO`, `LIQUIDADO` e `FALHOU` estao modelados e testados.
- [ ] Reconciliacao fake atualiza status terminal sem duplicar efeitos em replay.
- [ ] `GET /aportes` retorna leitura owner-scoped minima.
- [ ] Auditoria registra `CREDORA_APORTE_REGISTRADO`, `CREDORA_APORTE_LIQUIDADO` e
  `CREDORA_APORTE_FALHOU`.
- [ ] Erros nao permitem enumeracao nem vazam UUID, dados de escrow/provider ou payload bancario.
- [ ] Nenhum adapter real Celcoin/BaaS foi ligado; nenhum dinheiro real e movido.
- [ ] OpenAPI, collection, `CREDORES.md`, `PIX.md secao escrow` e `SPRINT-29-PR.md` atualizados.
- [ ] `./gradlew check` passa ou falha preexistente fica documentada com evidencia.
