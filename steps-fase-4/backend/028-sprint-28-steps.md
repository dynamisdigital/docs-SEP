# Steps - Sprint 28 - Portas de persistencia do modulo cobranca

**Spec de origem**: [`028-sprint-28-cobranca-portas-persistencia.md`](../../specs/fase-4/028-sprint-28-cobranca-portas-persistencia.md)

**Status**: planejada (Fase 4; follow-up de arquitetura da Fase 3).

**Objetivo geral**: refatorar os use cases de `cobranca` para dependerem de portas de saida em
`application.port.out`, isolando Spring Data/JPA em `infrastructure`, conforme ADR 0007. Sprint
100% behavior-preserving: sem mudar contrato REST, DTO, regra de negocio, evento, auditoria,
migration ou semantica de erro.

**Esforco total estimado**: 1,5-2 dias de Dev Senior Backend.

**Repos de destino**:
- `sep-api`: portas, adapters de persistencia, refactor de use cases e testes.
- `docs-SEP`: steps, `COBRANCA.md`, PRD/STATE/historico e PR description; Git manual.

**Branch sugerida**:
- `feature/sprint-28-cobranca-portas-persistencia`

**Pre-requisitos**:
- Sprint 27 mergeada em `develop` e promovida a `main`; `develop == main`.
- Modulo `cobranca` integrado com Sprints 12-13, 23-24 e step-up estrito da Sprint 27.
- ADR 0007 vigente: `application` depende de `domain` e portas; JPA fica em `infrastructure`.

## Achado que dimensiona a sprint

`cobranca` ja usa portas para dependencias externas/cross-module
(`ContratoCobrancaQueryPort`, `PropostaCobrancaQueryPort`, `RegistrarMovimentacaoEscrowPort`,
`NotificationProvider`), mas os 14 use cases ainda importam repositories JPA do proprio modulo:

| Use case | Repository JPA direto hoje | Porta-alvo |
|----------|----------------------------|------------|
| `ConsultarRecebimentosUseCase` | `RecebimentoRepository` | `RecebimentoCobrancaPort` |
| `ConsultarAgendaPorContratoUseCase` | `AgendaPagamentoRepository` | `AgendaPagamentoCobrancaPort` |
| `ConsultarParcelasUseCase` | `ParcelaCobrancaRepository` | `ParcelaCobrancaPort` |
| `CalcularValorAtualizadoParcelaUseCase` | `ParcelaCobrancaRepository` | `ParcelaCobrancaPort` |
| `GerarAgendaPagamentoUseCase` | `AgendaPagamentoRepository` | `AgendaPagamentoCobrancaPort` |
| `RegistrarRecebimentoUseCase` | `ParcelaCobrancaRepository`, `RecebimentoRepository` | `ParcelaCobrancaPort`, `RecebimentoCobrancaPort` |
| `ConsultarRecebimentosParcelaUseCase` | `ParcelaCobrancaRepository`, `RecebimentoRepository` | `ParcelaCobrancaPort`, `RecebimentoCobrancaPort` |
| `RegistrarContatoCobrancaUseCase` | `ParcelaCobrancaRepository`, `EventoCobrancaRepository` | `ParcelaCobrancaPort`, `EventoCobrancaPort` |
| `EscalarCobrancaUseCase` | `EventoCobrancaRepository` | `EventoCobrancaPort` |
| `ListarInadimplenciaUseCase` | `ParcelaCobrancaRepository` | `ParcelaCobrancaPort` |
| `IniciarRenegociacaoUseCase` | `ParcelaCobrancaRepository`, `RenegociacaoRepository` | `ParcelaCobrancaPort`, `RenegociacaoCobrancaPort` |
| `AceitarRenegociacaoUseCase` | `RenegociacaoRepository`, `ParcelaCobrancaRepository`, `AgendaPagamentoRepository` | `RenegociacaoCobrancaPort`, `ParcelaCobrancaPort`, `AgendaPagamentoCobrancaPort` |
| `RecusarRenegociacaoUseCase` | `RenegociacaoRepository`, `ParcelaCobrancaRepository` | `RenegociacaoCobrancaPort`, `ParcelaCobrancaPort` |
| `ConsultarRenegociacaoAtivaTomadorUseCase` | `ParcelaCobrancaRepository`, `RenegociacaoRepository` | `ParcelaCobrancaPort`, `RenegociacaoCobrancaPort` |

Jobs/listeners de `cobranca.application` tambem tem alguns imports diretos de repositories, mas esta
spec nomeia explicitamente os **use cases** como alvo. Nao ampliar escopo para jobs/listeners sem
confirmacao, para evitar refactor transversal maior que o planejado.

## Decisoes tecnicas

- Criar portas pequenas, em linguagem de aplicacao, espelhando somente as operacoes realmente usadas.
- Manter os nomes dos repositories JPA atuais e deixa-los em `infrastructure.persistence`.
- Implementar adapters em `cobranca.infrastructure.adapter.persistence`, delegando aos repositories.
- Nao esconder comportamento critico: metodos com lock, fetch join, entity graph, `saveAndFlush` e
  queries de idempotencia devem aparecer explicitamente nas portas quando o use case depende disso.
- Nao criar porta generica CRUD. Cada metodo precisa ter nome de intencao operacional.
- Unit tests de use case passam a mockar portas; repository tests continuam garantindo queries JPA.
- Nenhuma alteracao em controllers, DTOs, migrations ou dominio salvo import/constructor causado pelo
  refactor.

## Protocolo obrigatorio por Task

1. Executar somente a Task liberada pelo usuario.
2. Confirmar codigo e testes atuais antes de editar.
3. Fazer refactors pequenos e behavior-preserving.
4. Rodar verificacoes proporcionais por bloco.
5. Parar em checkpoint pre-commit com status, diff, testes, riscos e mensagem sugerida.
6. Aguardar aprovacao antes de `git add` e `git commit`.
7. Usar paths especificos no staging; nunca `git add -A`.

**Skills obrigatorias**:
- `coding-guidelines`: mudancas cirurgicas e verificacao orientada a meta.
- `clean-code`: nomes intencionais, portas pequenas e testes F.I.R.S.T.
- `clean-architecture`: manter dependencia apontando para dentro; application nao importa infrastructure.
- `design-patterns-java`: recusar pattern-itis; ports/adapters sao o padrao arquitetural necessario aqui.

## Ordem de execucao

```text
28.0 prechecks
  -> 28.1 auditoria e desenho das portas
  -> 28.2 portas + adapters de persistencia
  -> 28.3 refactor leitura/parcela/agenda
  -> 28.4 refactor recebimento/eventos
  -> 28.5 refactor renegociacao
  -> 28.6 testes, arquitetura e regressao
  -> 28.7 docs e fechamento
```

---

## Gate 28.0 - Prechecks

**Objetivo**: confirmar base Git, Sprint 27 integrada e baseline antes de refatorar.

### Step 028.0.1 - Confirmar cadeia de integracao

```bash
cd <sep-api-root>
git fetch --all --prune
git status --short --branch
git log --oneline --decorate -10 origin/develop
git log --oneline --decorate -10 origin/main
git diff --stat origin/main..origin/develop
git diff --stat origin/develop..origin/main
```

**Verificacao**:
- Sprint 27 presente em `origin/develop` e `origin/main`.
- `develop` e `main` sem divergencia de produto.
- Working tree limpo ou alteracoes do usuario identificadas.

### Step 028.0.2 - Criar branch

```bash
cd <sep-api-root>
git switch develop
git pull --ff-only
git switch -c feature/sprint-28-cobranca-portas-persistencia
```

### Step 028.0.3 - Reconfirmar acoplamento atual

```bash
cd <sep-api-root>
rg -n "import com\\.dynamis\\.sep_api\\.cobranca\\.infrastructure\\.persistence" \
  src/main/java/com/dynamis/sep_api/cobranca/application/usecase
find src/main/java/com/dynamis/sep_api/cobranca/infrastructure/persistence -maxdepth 1 -type f | sort
find src/test/java/com/dynamis/sep_api/cobranca/application/usecase -maxdepth 1 -type f | sort
```

**Verificacao**:
- Lista atual bate com a matriz do cabecalho ou divergencia e registrada antes de implementar.
- Nao ha necessidade de migration nem de mudanca REST.

### Step 028.0.4 - Rodar baseline

```bash
cd <sep-api-root>
./gradlew check
```

Registrar resultado e contagem de testes antes da alteracao.

### Definicao de pronto do Gate 28.0

- [ ] Cadeia Git validada.
- [ ] Branch criada da base correta.
- [ ] Acoplamento atual mapeado.
- [ ] Baseline verde ou falha preexistente documentada.

---

## Task 28.1 - Auditoria e desenho das portas

**Objetivo**: fixar a API das portas antes de mover dependencias, evitando portas genericas ou
acopladas a Spring Data.

**Esforco**: 0,25 dia.

### Step 028.1.1 - Mapear metodos usados

Para cada repository JPA de `cobranca`, listar somente metodos consumidos pelos use cases:

```bash
cd <sep-api-root>
rg -n "parcelaRepository\\.|agendaRepository\\.|recebimentoRepository\\.|renegociacaoRepository\\.|eventoRepository\\." \
  src/main/java/com/dynamis/sep_api/cobranca/application/usecase
```

### Step 028.1.2 - Definir portas-alvo

Criar desenho de portas com estes nomes, salvo divergencia justificada pelo codigo:

- `ParcelaCobrancaPort`
- `AgendaPagamentoCobrancaPort`
- `RecebimentoCobrancaPort`
- `RenegociacaoCobrancaPort`
- `EventoCobrancaPort`

Cada metodo deve preservar a intencao operacional atual, por exemplo:

- lock: `buscarPorIdComLock(UUID id)`;
- flush: `salvarEFlush(ParcelaCobranca parcela)`;
- fetch/consulta especifica: `listarPorContratoOrdenadoPorNumero(UUID contratoId)`;
- idempotencia: `buscarPorIdempotencyKey(String key)`;
- agregacao/dashboard: manter projection ou criar view de aplicacao se o use case ja consome o dado.

### Step 028.1.3 - Registrar decisao

Registrar no checkpoint da Task 28.1:
- portas criadas;
- metodos por porta;
- use cases atendidos por cada porta;
- qualquer metodo JPA que ficou fora por nao ser usado por use case.

### Definicao de pronto da Task 28.1

- [ ] Todas as dependencias JPA dos 14 use cases foram mapeadas.
- [ ] Portas pequenas e nomeadas por intencao foram definidas.
- [ ] Nenhuma porta generica CRUD foi introduzida.
- [ ] Jobs/listeners foram tratados como fora de escopo ou levados ao usuario se houver bloqueio.

---

## Task 28.2 - Criar portas e adapters de persistencia

**Objetivo**: introduzir as portas e adapters sem ainda refatorar todos os use cases de uma vez.

**Esforco**: 0,5 dia.

**Arquivos esperados**:
- `cobranca/application/port/out/ParcelaCobrancaPort.java`
- `cobranca/application/port/out/AgendaPagamentoCobrancaPort.java`
- `cobranca/application/port/out/RecebimentoCobrancaPort.java`
- `cobranca/application/port/out/RenegociacaoCobrancaPort.java`
- `cobranca/application/port/out/EventoCobrancaPort.java`
- `cobranca/infrastructure/adapter/persistence/*Adapter.java`

### Step 028.2.1 - Criar interfaces de porta

Regras:
- Interfaces ficam em `application.port.out`.
- Tipos de dominio podem aparecer nas assinaturas.
- Nao importar `org.springframework.data.*`, `jakarta.persistence.*` ou classes de repository.
- Se uma projection JPA precisar atravessar a porta, preferir record/view de aplicacao.

### Step 028.2.2 - Criar adapters Spring

Regras:
- Adapters ficam em `infrastructure.adapter.persistence`.
- Cada adapter injeta somente o repository JPA correspondente.
- Cada metodo delega sem alterar regra de negocio.
- Nao mover queries dos repositories nesta sprint; preservar repository tests existentes.

### Step 028.2.3 - Smoke de compilacao

```bash
./gradlew compileJava
```

### Definicao de pronto da Task 28.2

- [ ] Portas criadas sem dependencia de Spring Data/JPA.
- [ ] Adapters compilam e delegam aos repositories atuais.
- [ ] Nenhum use case teve comportamento alterado.
- [ ] `compileJava` verde.

### Commit sugerido

```text
refactor(cobranca): introduzir portas de persistencia
```

---

## Task 28.3 - Refatorar leitura, parcela e agenda

**Objetivo**: migrar os use cases de leitura/parcela/agenda para as portas, mantendo os testes focados
verdes.

**Esforco**: 0,5 dia.

**Use cases esperados**:
- `ConsultarAgendaPorContratoUseCase`
- `ConsultarParcelasUseCase`
- `CalcularValorAtualizadoParcelaUseCase`
- `GerarAgendaPagamentoUseCase`
- `ListarInadimplenciaUseCase`

### Step 028.3.1 - Trocar imports e construtores

Substituir repositories por:
- `AgendaPagamentoCobrancaPort` em agenda/geracao;
- `ParcelaCobrancaPort` em parcelas, calculo e inadimplencia.

Preservar:
- `TransactionTemplate` e transacoes existentes no `GerarAgendaPagamentoUseCase`;
- idempotencia por agenda ativa;
- `DataIntegrityViolationException` se ela ainda for parte do tratamento de race no use case. Se o
  use case captura excecao Spring especifica, avaliar se a porta deve expor operacao suficiente para
  manter a traducao sem vazar repository.

### Step 028.3.2 - Atualizar unit tests

Trocar mocks de repositories por mocks das portas. Nao enfraquecer assercoes de comportamento.

### Verificacao

```bash
./gradlew test --tests "*ConsultarAgendaPorContratoUseCaseTest" \
  --tests "*ConsultarParcelasUseCaseTest" \
  --tests "*CalcularValorAtualizadoParcelaUseCaseTest" \
  --tests "*GerarAgendaPagamentoUseCaseTest" \
  --tests "*ListarInadimplenciaUseCaseTest"
```

### Definicao de pronto da Task 28.3

- [ ] Use cases acima nao importam `cobranca.infrastructure.persistence`.
- [ ] Testes unit mockam portas.
- [ ] Comportamento de agenda, ownership, filtros e calculo monetario preservado.

---

## Task 28.4 - Refatorar recebimento e eventos de cobranca

**Objetivo**: migrar recebimentos e eventos operacionais para portas, preservando idempotencia,
locks, auditoria e historico owner-scoped.

**Esforco**: 0,5 dia.

**Use cases esperados**:
- `ConsultarRecebimentosUseCase`
- `ConsultarRecebimentosParcelaUseCase`
- `RegistrarRecebimentoUseCase`
- `RegistrarContatoCobrancaUseCase`
- `EscalarCobrancaUseCase`

### Step 028.4.1 - Refatorar recebimento

Usar `RecebimentoCobrancaPort` para:
- busca por idempotency key;
- listagem por parcela em ordem asc/desc;
- listagem interna com parcela carregada, preservando anti N+1;
- persistencia de recebimento;
- soma por intervalo, se consumida por use case.

Manter as tres camadas de idempotencia do `RegistrarRecebimentoUseCase` intactas.

### Step 028.4.2 - Refatorar eventos

Usar `EventoCobrancaPort` para:
- historico por parcela;
- guard de idempotencia de notificacao;
- persistencia de `EventoCobranca`.

Nao mover regra de template/canal para adapter.

### Step 028.4.3 - Atualizar unit tests

Trocar mocks e verifies para portas. Assercoes de:
- idempotencia pre-lock e pos-lock;
- recebimento parcial/total;
- escrow;
- contato manual;
- notificacao idempotente;
devem permanecer.

### Verificacao

```bash
./gradlew test --tests "*ConsultarRecebimentosUseCaseTest" \
  --tests "*ConsultarRecebimentosParcelaUseCaseTest" \
  --tests "*RegistrarRecebimentoUseCaseTest" \
  --tests "*RegistrarContatoCobrancaUseCaseTest" \
  --tests "*EscalarCobrancaUseCaseTest"
```

### Definicao de pronto da Task 28.4

- [ ] Use cases acima nao importam repositories JPA.
- [ ] Idempotencia de recebimento e notificacao preservada.
- [ ] Historico owner-scoped do tomador preservado.
- [ ] Testes focados verdes.

---

## Task 28.5 - Refatorar renegociacao

**Objetivo**: migrar proposta, aceite, recusa e consulta ativa de renegociacao para portas,
preservando step-up/ownership/estado da Sprint 27.

**Esforco**: 0,5 dia.

**Use cases esperados**:
- `IniciarRenegociacaoUseCase`
- `AceitarRenegociacaoUseCase`
- `RecusarRenegociacaoUseCase`
- `ConsultarRenegociacaoAtivaTomadorUseCase`

### Step 028.5.1 - Refatorar proposta e consulta ativa

Usar `ParcelaCobrancaPort` e `RenegociacaoCobrancaPort` para:
- busca de parcela;
- busca de proposta ativa por parcela/status;
- existencia de proposta ativa;
- persistencia da renegociacao e da parcela.

Preservar:
- ownership antes de revelar estado;
- `Clock` na expiracao;
- `valorTotalRenegociado` calculado com `BigDecimal`;
- 404 para ausencia de proposta ativa.

### Step 028.5.2 - Refatorar aceite/recusa

Usar:
- `RenegociacaoCobrancaPort.buscarPorIdComLock`;
- `ParcelaCobrancaPort.buscarPorIdComLock`;
- `AgendaPagamentoCobrancaPort` para agenda substituta/inativacao/persistencia.

Preservar:
- serializacao de aceitar/recusar/expirar por lock;
- ownership antes de estado;
- aceite com agenda substituta ativa e original inativa;
- recusa sem step-up no controller e sem nova obrigacao financeira;
- eventos `RenegociacaoAceitaEvent` e `RenegociacaoRecusadaEvent`.

### Step 028.5.3 - Atualizar unit tests

Trocar mocks de repositories por portas e manter assercoes de:
- nao-dono recebe 403 generico;
- estado invalido segue 409;
- proposta expirada nao e ativa;
- aceite cria agenda substituta;
- recusa restaura status anterior.

### Verificacao

```bash
./gradlew test --tests "*IniciarRenegociacaoUseCaseTest" \
  --tests "*AceitarRenegociacaoUseCaseTest" \
  --tests "*RecusarRenegociacaoUseCaseTest" \
  --tests "*ConsultarRenegociacaoAtivaTomadorUseCaseTest"
```

### Definicao de pronto da Task 28.5

- [ ] Use cases de renegociacao nao importam repositories JPA.
- [ ] Sem regressao em step-up/ownership/estado da Sprint 27.
- [ ] Testes focados verdes.

### Commit sugerido

```text
refactor(cobranca): usar portas nos use cases de persistencia
```

---

## Task 28.6 - Testes, arquitetura e regressao

**Objetivo**: provar que o refactor nao mudou comportamento e que o acoplamento proibido saiu dos use
cases.

**Esforco**: 0,25-0,5 dia.

### Step 028.6.1 - Verificar imports proibidos

```bash
rg -n "import com\\.dynamis\\.sep_api\\.cobranca\\.infrastructure\\.persistence" \
  src/main/java/com/dynamis/sep_api/cobranca/application/usecase
```

**Esperado**: zero ocorrencias.

Tambem conferir que as portas nao importam Spring Data/JPA:

```bash
rg -n "org\\.springframework\\.data|jakarta\\.persistence|infrastructure\\.persistence" \
  src/main/java/com/dynamis/sep_api/cobranca/application/port/out
```

### Step 028.6.2 - Rodar suite focada de cobranca

```bash
./gradlew test --tests "com.dynamis.sep_api.cobranca.*"
```

Se o filtro nao capturar todos os testes por padrao Gradle, usar explicitamente:

```bash
./gradlew test --tests "*Cobranca*" --tests "*Renegociacao*" --tests "*Recebimento*" \
  --tests "*AgendaPagamento*" --tests "*Parcela*" --tests "*Inadimplencia*"
```

### Step 028.6.3 - Rodar gate amplo

```bash
./gradlew spotlessCheck
./gradlew check
```

### Definicao de pronto da Task 28.6

- [ ] Zero imports de `cobranca.infrastructure.persistence` nos use cases.
- [ ] Portas sem Spring Data/JPA.
- [ ] Suite focada de cobranca verde.
- [ ] `spotlessCheck` e `check` verdes.
- [ ] Diff nao contem mudanca de endpoint, DTO, migration ou regra de negocio.

---

## Task 28.7 - Docs e fechamento

**Objetivo**: atualizar documentacao operacional e fechar a divida arquitetural no estado do projeto.

**Esforco**: 0,25 dia.

### Step 028.7.1 - Atualizar documentacao

Atualizar:
- `docs-sep/STATE.md`
  da execucao: Sprint 28 fechada -> proxima Sprint 29.
- `docs-sep/CONTEXT-PARTE-2.md`: apendar historico curto da Sprint 28.
- `docs-sep/PRD-FASE-4.md`: marcar Sprint 28 concluida apos merge.
- `repos/sep-api/COBRANCA.md`: remover a limitacao de repositories diretos nos use cases e registrar
  as portas/adapters de persistencia do modulo.
- `AI-ROADMAP.md`, se citar a divida ou status da Sprint 28.

Nao editar docs de contrato REST/collection se nenhum contrato mudou.

### Step 028.7.2 - Criar PR description

Criar `repos/sep-api/SPRINT-28-PR.md` com:
- summary;
- matriz de use cases refatorados;
- portas/adapters criados;
- garantias de nao mudanca comportamental;
- testes executados;
- riscos/follow-ups;
- commits.

### Step 028.7.3 - Gate final

```bash
cd <sep-api-root>
./gradlew check
./gradlew bootJar
```

### Definicao de pronto da Task 28.7

- [ ] `COBRANCA.md` nao lista mais a divida de repositories diretos nos 14 use cases.
- [ ] PRD/estado/historico atualizados conforme fechamento real.
- [ ] `SPRINT-28-PR.md` criado.
- [ ] `check` e `bootJar` verdes.
- [ ] Checkpoint final apresentado; push e PR continuam manuais.

### Commit sugerido

```text
docs(cobranca): documentar portas de persistencia da sprint 28
```

## Definition of Done da Sprint 28

- [ ] Todos os 14 use cases de `cobranca` dependem de portas `application.port.out`, nao de
      repositories JPA diretos.
- [ ] Adapters em `infrastructure` isolam Spring Data/JPA.
- [ ] Nenhum endpoint, DTO, evento, auditoria, migration ou regra de negocio foi alterado.
- [ ] Unit tests mockam portas; repository tests continuam cobrindo queries JPA.
- [ ] Suite focada de cobranca, `spotlessCheck`, `check` e `bootJar` verdes.
- [ ] Divida de portas de persistencia removida do `COBRANCA.md` e do backlog da Fase 4.
- [ ] Merge em `develop` registrado antes de iniciar a Sprint 29.
