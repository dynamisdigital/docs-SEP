# Steps - Sprint 34 - Follow-ups de lockout e divida de contrato OpenAPI

**Spec de origem**: [`034-sprint-34-followups-lockout-contrato.md`](../../specs/fase-4/034-sprint-34-followups-lockout-contrato.md)

**Status**: planejada (criada em 2026-07-30). Nenhuma Task iniciada.

**Objetivo geral**: quitar os cinco follow-ups backend que a Sprint 33 deixou registrados e fechar as
cinco lacunas de OpenAPI que o `contract:check` do `sep-app` carrega como `knownGaps` desde a
F-Sprint 19. Sem escopo de produto novo.

**Esforco total estimado**: 2-3 dias de Dev Senior Backend.

**Repos de destino**:

- `sep-api`: `LockoutService`, `RegistrarTentativaLoginUseCase`, `AutenticarUsuarioUseCase`,
  `VerificarTotpUseCase`, `ContaBloqueadaException`, `ApiExceptionHandler`, `RateLimitFilter`,
  `TipoEventoSeguranca`, `OpenApiConfig`, `AuthController`, `ContratoController`,
  `ContratoResponse`/`StatusAssinaturaResponse`/`ContratoWebMapper`, `DashboardResponse`,
  migration `V60`, testes unitarios e de integracao.
- `sep-app`: **somente** `contracts/openapi.snapshot.json`, `contracts/openapi.snapshot.meta.json` e
  `contracts/consumed-contracts.json` (remocao dos `knownGaps` fechados), no gate de fechamento.
  Nenhum codigo.
- `docs-SEP`: este step, a spec, `SEGURANCA.md`, `AI-ROADMAP.md`, STATE/historico no fechamento e PR
  description; **Git manual**.

**Branch sugerida**: `feature/sprint-34-followups-lockout-contrato`, criada de `develop` atualizado
(que ja contem a Sprint 33 `a613c6c` e o merge `main -> develop`).

**Pre-requisitos**:

- Sprint 33 mergeada em `develop` **e** `main` (feito em 2026-07-29, PR #101/#102).
- F-Sprint 21 mergeada (feito em 2026-07-30, PR #113/#114) — nao bloqueia a implementacao, mas o
  snapshot OpenAPI que ela deixou (`a613c6c`) e a base a partir da qual esta sprint reexporta.

## Estado atual verificado (2026-07-30)

Levantado antes de planejar; qualquer divergencia encontrada no Gate 34.0 invalida o desenho abaixo.

- **Nenhuma tentativa contra conta bloqueada deixa rastro.** `lockoutService.verificar()` lanca antes
  de qualquer `registrar(...)`: `AutenticarUsuarioUseCase` linha 76 (registro nas 80/87) e
  `VerificarTotpUseCase` linha 88 (registro na 109). O `switch` de `RegistrarTentativaLoginUseCase`
  (linha 54) ja mapeia `CONTA_BLOQUEADA -> LOCKOUT`, mas o ramo e **inalcancavel**.
- `LoginAttemptStatus.CONTA_BLOQUEADA` esta **fora** de `STATUSES_FALHA` desde a Sprint 33, com teste
  de guarda (`LockoutServiceTest.contagemDeFalhasIgnoraTentativasBarradasPorBloqueio`). O check
  constraint de `login_attempt` **ja aceita** o valor (`V4`, linhas 107-110).
- `audit_log_seguranca.tipo` tem `chk_audit_seguranca_tipo`, ampliado por V13, V15, V22, V41, V55,
  V57 e V59 no padrao forward-only `ampliar_audit_seguranca_tipo_*`. **Um valor novo em
  `TipoEventoSeguranca` exige migration.** Ultima migration: `V59`.
- `LockoutService.LIMITE_DE_LEITURA = 100` e constante, e o javadoc do campo (linhas 50-58) declara
  que a seguranca do teto **depende** de tentativas bloqueadas nao serem registradas: *"Se algum dia
  tentativas bloqueadas passarem a ser registradas, esta premissa cai e o limite precisa ser derivado
  da configuracao."*
- O campo `detalhes` do audit e montado por **concatenacao de string** em `LockoutService` (linha 138)
  e em `RegistrarTentativaLoginUseCase` (linha 47), contra coluna `jsonb`
  (`@JdbcTypeCode(SqlTypes.JSON)`). O `username` vem do corpo da request.
- `PoliticaLockout.eventoDeBloqueio` devolve `Optional<OffsetDateTime>` com o instante do evento, mas
  `LockoutService.estaBloqueada` (linhas 85-90) retorna `boolean` e descarta o valor.
  `ContaBloqueadaException` recebe `int lockoutMinutes` — a **duracao configurada**, nao o restante.
  Call sites: `LockoutService:81` e `AutenticarUsuarioUseCaseTest:184`.
- **Nao existe `Retry-After` em lugar nenhum do projeto.** `ApiExceptionHandler.build` (linhas
  214-219) nao emite header customizado; o `RateLimitFilter` serializa o `ErrorResponseDto` direto no
  output stream (linhas 100-110).
- `ErrorResponseDto` e record de 6 campos usado por todo o `ApiExceptionHandler` **e** pelo
  `RateLimitFilter`.
- A invariante `rate-limit > max-attempts` esta documentada em comentario no `application.yml`
  (linhas 242-252) e testada **apenas** por `LockoutLoginIT.rateLimitDeLoginEhMaiorQueOLimiteDeLockout`
  (linhas 99-107), que le os valores efetivos do profile `test`. As 5 env vars podem quebra-la em
  silencio. Nota: os defaults do POJO `RateLimitProperties` sao **5**, enquanto o YAML e **10**.
- `RateLimitFilter` cria `RateLimiterRegistry.ofDefaults()` no **construtor** (linha 42) — registry
  proprio da instancia, nao o bean do starter. `registry.rateLimiter(key, config)` (linha 79) e
  get-or-create por IP, **sem TTL, cap ou remocao**. `extrairIp` (linhas 91-98) confia em
  `X-Forwarded-For` sem allowlist de proxy.
- `LockoutLoginIT` **nao injeta** `AuditLogSegurancaRepository`; nao ha assert do audit `LOCKOUT`. O
  `usuarioId` do `saveAndFlush` (linha 72) e descartado. `limpar()` (80-85) nao apaga
  `login_attempt` nem `audit_log_seguranca`. A jornada esta em **um unico** `@Test` porque o registry
  do filtro nao reinicia entre metodos (javadoc 31-38).
- **Nao existe endpoint de config publica** no projeto (25 base-paths levantados).
  `/api/v1/governanca/parametros` e `hasRole('ADMIN')` e o catalogo semeado (`V43`) so tem parametros
  de credito/backoffice. `LockoutProperties` ja e `@Component @ConfigurationProperties` injetavel.
- **OpenAPI — as cinco lacunas**:
  - `X-Step-Up-Token` e lido pelo `StepUpEnforcementAspect` via `RequestContextHolder`, **nunca**
    aparece como `@RequestHeader` na assinatura — por isso o springdoc nao o infere. **24 endpoints**
    anotados (14 `@RequireStepUp` + 10 `@RequireStepUpEstrito`); o frontend consome 18.
  - `DashboardResponse.tempoMedioResolucao30d` e `java.time.Duration`.
    `WRITE_DURATIONS_AS_TIMESTAMPS` **nao** e configurado em lugar nenhum (fica no default habilitado
    do Jackson), entao o runtime emite numero e o springdoc documenta `type: string`.
  - `ContratoResponse.tipo`/`status` e `StatusAssinaturaResponse.statusContrato`/`statusEnvelope` sao
    `String` no DTO, com `.name()` no `ContratoWebMapper` (linhas 33-34, 75-77) — por isso sem `enum`
    no schema.
  - `ContratoController.baixarDocumentoAssinado` (linhas 360-403) seta `X-Document-Hash-Sha256` e
    `Content-Disposition` via `ResponseEntity.header(...)`, invisiveis ao springdoc.
    `@ApiResponse(headers = ...)` tem **zero ocorrencias** no projeto.
  - `OpenApiConfig` existe (bean `OpenAPI` + security scheme + redirect do swagger-ui) e **nao tem**
    nenhum `OperationCustomizer`.
- `OpenApiConfigTest` faz ~90 asserts, **todos `jsonPath(...).exists()`** sobre paths e schemas. Nao
  verifica tipo de campo, enum, header de request nem header de resposta: **nenhuma das lacunas seria
  detectada por ele**, e fecha-las nao o quebra. Cobertura parada na Sprint ~24.
- O snapshot OpenAPI **nao existe no `sep-api`** (sem plugin Gradle, sem `.json` versionado); vive em
  `sep-app/contracts/`, exportado a mao do runtime em perfil `dev`.
- Os helpers `existeGap*` do `contract-check.mjs` casam por `kind` + chave, e **nao detectam gap
  obsoleto**: enquanto a entrada existir, o check segue silenciando o que ja foi documentado. O
  `knownGaps[0]` usa `appliesTo: "*"` — silencia o `X-Step-Up-Token` em **18 endpoints**.

## Decisoes da sprint

- **`Retry-After` em vez de campo no `ErrorResponseDto`.** O DTO e record de 6 campos usado por todo
  o `ApiExceptionHandler` e serializado a mao pelo `RateLimitFilter`; acrescentar campo e mudanca
  transversal numa sprint de divida. O header e padrao RFC 9110, entrega o mesmo dado e serve ao
  `429` de graca. **Alternativa rejeitada**: `retryAfterSeconds` no corpo.

- **Tipo de audit novo em vez de discriminar pelo JSON.** Registrar `CONTA_BLOQUEADA` cria dois
  eventos com significados distintos — "bloqueou agora" (transicao, emitido por
  `LockoutService.avaliarPosFalha`) e "tentou durante o bloqueio". Com o mesmo `TipoEventoSeguranca`,
  distingui-los exigiria parsear `jsonb`. Um valor novo mantem
  `findByUsuarioIdAndTipoOrderByDataEventoDesc` util. **Custo**: migration `V60`, no padrao
  forward-only ja usado sete vezes.

- **O `LIMITE_DE_LEITURA` deixa de ser constante.** Nao e polimento: a Task 34.1 remove exatamente a
  premissa que o javadoc do campo declara como condicao de seguranca do teto. As duas mudancas andam
  juntas ou o limite passa a poder truncar a janela de deteccao.

- **`CONTA_BLOQUEADA` continua fora de `STATUSES_FALHA`.** Registrar o status **nao** o torna
  contavel. Se entrar na contagem, cada tentativa barrada renova o proprio bloqueio — bloqueio
  auto-perpetuante. O teste de guarda da Sprint 33 permanece e e o que trava isso.

- **Endpoint publico para a politica de lockout.** `Retry-After` resolve o login, mas **nao** a
  pagina `/account-locked`, que renderiza sem ter recebido resposta de API (o `errorInterceptor` do
  web navega e descarta o erro). O incremento de exposicao e proximo de zero: a `message` do `423` ja
  publica o `lockoutMinutes`. **Alternativa rejeitada**: migrar `lockout-minutes` ao catalogo de
  `parametro_operacional` — mistura config de seguranca com config de negocio e exige ADR.

- **`OperationCustomizer` em vez de 24 `@Parameter` manuais.** Um bean lendo
  `handlerMethod.getMethodAnnotation(RequireStepUp.class)` fecha os 24 de uma vez e **nunca
  dessincroniza do aspect**; usar `StepUpEnforcementAspect.HEADER` como fonte unica do nome. A forma
  manual duplicaria a declaracao em 24 pontos e ja nasceria sujeita a drift — e o proprio motivo de a
  lacuna existir. Note que em `CobrancaController` e em parte de `UsuarioController`/`MfaController` a
  anotacao esta **FQN inline**, nao importada.

- **Enum tipado no DTO em vez de `allowableValues`.** Trocar `String` por `TipoContrato` /
  `StatusFormalizacao` / `StatusEnvelope` e remover os `.name()` do mapper segue o padrao dominante do
  projeto (`OnboardingResponse`, `EmpresaResponse`, `UsuarioResponseDto`) e nunca dessincroniza.
  `allowableValues` (precedente unico: `PixOperacaoCredoraResponse`) e o menor diff mas duplica a
  lista em quatro pontos — e `StatusFormalizacao` ja cresceu uma vez, na Sprint 11.

- **`@Schema(type = "number")` no Duration, sem mexer no Jackson.** Desligar
  `write-durations-as-timestamps` faria o campo virar ISO-8601 e casaria com o `type: string` ja
  documentado — mas **quebra o frontend**, que declara `frontendType: number`. O caminho nao-breaking
  e corrigir a documentacao. Sera o primeiro `@Schema(type = ...)` do projeto: registrar como
  convencao nova no PR.

- **Sem ADR**: nenhuma escolha estrutural nova. ADR passa a ser exigido para o controle compensatorio
  contra brute force lento e para levar `lockout-minutes` ao catalogo governado.

## Fora de escopo

- Controle compensatorio contra brute force lento — **exige ADR**; risco residual aceito em
  2026-07-29 e registrado em [`SEGURANCA.md`](../../docs-sep/SEGURANCA.md) §5.
- Persistir estado de lockout; endpoint de desbloqueio; zerar contador em login bem-sucedido.
- Campo novo no `ErrorResponseDto`.
- Os 4 contratos ausentes da F-Sprint 17 — feature, nao divida de anotacao.
- `ContaBloqueadaException.CODIGO` morto; `countByIpAndJanela` sem consumidor; `MDC.get` literal no
  `RateLimitFilter`; `Clock` injetavel no `LockoutService`.
- Codigo em `sep-app`/`sep-mobile`. O unico toque no `sep-app` e em `contracts/`, no gate de
  fechamento.
- Estender o `contract-check.mjs` para inspecionar status de erro — escopo web.

## Protocolo obrigatorio por Task

1. Executar somente a Task liberada pelo usuario.
2. Confirmar codigo e contrato atuais antes de editar.
3. Implementar a menor mudanca coerente com a spec e este step.
4. Escrever/ajustar teste observavel para o comportamento alterado.
5. Rodar verificacoes proporcionais por bloco e `./gradlew spotlessCheck`.
6. Parar em checkpoint pre-commit com arquivos, testes, riscos e mensagem sugerida.
7. Aguardar aprovacao antes de `git add`/`git commit`; usar somente paths especificos.
8. Nao iniciar a Task seguinte sem ordem explicita.

**Skills obrigatorias durante a implementacao**: `coding-guidelines`, `clean-code`,
`design-patterns-java`, `clean-architecture` (o tempo restante e calculo de dominio — `PoliticaLockout`
decide, o service orquestra e o handler traduz para transporte).

## Rastreabilidade spec 034 -> steps

| Task da spec 034 | Steps |
|------------------|-------|
| 1. Observabilidade do bloqueio (+ migration `V60`) | 34.1 |
| 2. `detalhes` do audit serializado | 34.2 |
| 3. `Retry-After` no `423` e no `429` | 34.3 |
| 4. Validador de invariante + evicção do registry | 34.4 |
| 5. `GET /api/v1/auth/politica-lockout` | 34.5 |
| 6. OpenAPI: step-up, Duration, enums, headers de resposta | 34.6 |
| 7. Regressao de contrato no `OpenApiConfigTest` | 34.7 |
| Gates de cadeia, baseline, reconfirmacao e fechamento do snapshot | 34.0 e fechamento |

## Ordem de execucao

```text
34.0 prechecks + baseline + reconfirmacao do estado levantado
  -> 34.1 registrar CONTA_BLOQUEADA + tipo de audit novo + V60 + limite derivado + assert na IT
  -> 34.2 detalhes do audit como JSON serializado
  -> 34.3 Retry-After no 423 (restante real) e no 429
  -> 34.4 validador de startup da invariante + evicção do RateLimiterRegistry
  -> 34.5 GET /api/v1/auth/politica-lockout publico
  -> 34.6 OpenAPI: X-Step-Up-Token, Duration, enums, headers de resposta
  -> 34.7 OpenApiConfigTest trava as quatro declaracoes
  -> fechamento: snapshot no sep-app, knownGaps, SEGURANCA.md, docs e PR
```

34.1 e 34.2 tocam os mesmos dois arquivos e estao separadas de proposito: 34.2 e correcao de defeito
independente e deve poder ser revertida sozinha.

---

## Gate 34.0 - Prechecks, baseline e reconfirmacao

**Objetivo**: confirmar que o estado levantado em 2026-07-30 continua valendo antes de mexer em
auditoria de seguranca e em contrato publicado.

### Step 034.0.1 - Confirmar cadeia Git

```bash
cd <sep-api-root>
git fetch --all --prune
git status --short --branch
git rev-list --left-right --count origin/main...origin/develop
```

Sprint 33 (`a613c6c`) presente em `origin/develop`; `main` integrada. Criar
`feature/sprint-34-followups-lockout-contrato` de `develop` atualizado.

### Step 034.0.2 - Rodar baseline completa

```bash
./gradlew clean build
./gradlew test
```

Partida esperada: **2173 testes, 0 falhas**. Registrar o numero real. Anotar qualquer vermelho
preexistente **antes** de editar; nunca corrigir de carona.

### Step 034.0.3 - Reconfirmar o estado levantado

Conferir em codigo, um a um, os itens de §Estado atual verificado. Em especial:

- (a) nenhum caminho de producao escreve `CONTA_BLOQUEADA`, e o `switch` de
  `RegistrarTentativaLoginUseCase` segue inalcancavel;
- (b) `CONTA_BLOQUEADA` continua fora de `STATUSES_FALHA`;
- (c) `chk_audit_seguranca_tipo` existe e `V59` e a ultima migration;
- (d) `X-Step-Up-Token` nao aparece como `@RequestHeader` em nenhuma assinatura;
- (e) `OpenApiConfig` nao tem `OperationCustomizer`.

**Por que e gate e nao task**: se algum caminho passou a escrever `CONTA_BLOQUEADA`, a premissa do
`LIMITE_DE_LEITURA` ja caiu e o desenho da Task 34.1 muda. Se surgiu migration nova depois da `V59`,
o numero da migration da 34.1 muda.

### Step 034.0.4 - Mapear o raio de impacto

- Contar os endpoints com `@RequireStepUp` / `@RequireStepUpEstrito` (esperado: **24**). Se divergir,
  o `OperationCustomizer` da 34.6 precisa cobrir a variante nova.
- `AutenticarUsuarioUseCaseTest` (linha ~184) passa `30` ao construtor de `ContaBloqueadaException`:
  a Task 34.3 muda a assinatura e este teste vai junto.
- `LockoutLoginIT` **nao** sobrescreve `app.security.rate-limit.*` de proposito (ao contrario de ~23
  outros ITs, que usam `1000`): qualquer request nova adicionada la consome o bucket de 10/min.
- `ContratoWebMapper` e MapStruct: trocar `String` por enum no DTO afeta o codigo gerado — rodar
  build completo, nao so o teste do mapper.
- `DashboardBackofficeTest` e `BackofficeIT:320` tocam o campo `Duration` mas **nao** travam o tipo;
  nenhum teste hoje comprova que a serializacao e numerica.

### Definicao de pronto do Gate 34.0

- [ ] Cadeia Git conferida e branch criada de `develop` atualizado.
- [ ] Baseline verde com numero de testes registrado.
- [ ] Estado levantado reconfirmado em codigo (ou desenho revisto).
- [ ] Contagem de endpoints de step-up conferida e raio de impacto mapeado.

---

## Task 34.1 - Observabilidade do bloqueio

**Objetivo**: uma tentativa contra conta bloqueada passa a deixar rastro, sem tornar o bloqueio
auto-perpetuante e sem invalidar o teto de leitura.

**Pre-requisito**: Gate 34.0 concluido.

**Esforco**: 0,75 dia.

**Arquivos esperados**:

- `identity/application/usecase/AutenticarUsuarioUseCase.java`,
  `identity/application/usecase/VerificarTotpUseCase.java`.
- `identity/application/usecase/RegistrarTentativaLoginUseCase.java`.
- `identity/application/service/LockoutService.java` (o `LIMITE_DE_LEITURA` e seu javadoc).
- `shared/audit/TipoEventoSeguranca.java`.
- `src/main/resources/db/migration/V60__ampliar_audit_seguranca_tipo_lockout_tentativa.sql`.
- Testes: `LockoutServiceTest`, `RegistrarTentativaLoginUseCaseTest`, `LockoutLoginIT`.

### Step 034.1.1 - Registrar a tentativa barrada

Capturar `ContaBloqueadaException` nos dois use cases (ou registrar dentro de `verificar()`) e gravar
`LoginAttemptStatus.CONTA_BLOQUEADA` antes de repropagar. O registro precisa de `REQUIRES_NEW` pelo
mesmo motivo da Sprint 33 — o caminho termina em excecao e a transacao do use case e desfeita.

Sem migration para `login_attempt`: o check constraint de `V4` (linhas 107-110) ja aceita o valor.

### Step 034.1.2 - Tipo de audit distinto + migration V60

Valor novo em `TipoEventoSeguranca` para "tentou durante o bloqueio", e ajustar o `switch` de
`RegistrarTentativaLoginUseCase` (linha 54), que hoje mapeia `CONTA_BLOQUEADA -> LOCKOUT` num ramo
inalcancavel. `LOCKOUT` fica reservado para a transicao emitida por `avaliarPosFalha`.

Migration `V60`, forward-only, no padrao de `V59`: `DROP CONSTRAINT` + `ADD CONSTRAINT` repetindo a
lista inteira com o valor novo ao fim. Cabecalho comentado citando a sprint e a task.

**Diferenca semantica a preservar**: o caminho de `RegistrarTentativaLoginUseCase` **propaga** ip e
user-agent; o de `LockoutService.avaliarPosFalha` os passa como `null` (o service nao os recebe).

### Step 034.1.3 - Derivar o limite de leitura

`LIMITE_DE_LEITURA = 100` deixa de ser constante. O javadoc do campo (linhas 50-58) declara que o
teto so e seguro porque tentativas bloqueadas nao sao registradas — o Step 034.1.1 remove essa
premissa. Derivar da configuracao e **reescrever o javadoc**, que hoje descreve um mundo que deixou
de existir.

Teste que falha se o limite voltar a ser constante.

### Step 034.1.4 - Assert do audit na `LockoutLoginIT`

Capturar o `usuarioId` do `saveAndFlush` (hoje descartado, linha 72) e assertar **os dois** eventos:
o `LOCKOUT` de transicao e o tipo novo da tentativa barrada. Copiar o helper `pollUntilAsserted` de
`CarteiraCredoraIT` (linhas 251-266) — e o padrao do repo, replicado em 7 ITs.

**Restricao**: o `RateLimiterRegistry` do filtro nao reinicia entre metodos e a classe nao sobrescreve
`rate-limit` de proposito. O assert cabe **dentro** do teste existente ou num metodo que nao faca
HTTP. `limpar()` nao apaga `audit_log_seguranca`: filtrar por `usuarioId`, nao por tipo.

### Verificacao da Task 34.1

```bash
./gradlew test --tests "*LockoutServiceTest" --tests "*RegistrarTentativaLoginUseCaseTest" \
               --tests "*LockoutLoginIT" --tests "*AutenticarUsuarioUseCaseTest"
./gradlew spotlessCheck
```

### Definicao de pronto da Task 34.1

- [ ] Tentativa contra conta bloqueada gera linha em `login_attempt` com status `CONTA_BLOQUEADA`.
- [ ] Evento de audit da tentativa barrada e **distinto** do `LOCKOUT` de transicao, com teste dos dois.
- [ ] Migration `V60` aplicada, forward-only, mantendo todos os tipos anteriores.
- [ ] `CONTA_BLOQUEADA` continua fora de `STATUSES_FALHA` (teste de guarda da Sprint 33 verde).
- [ ] `LIMITE_DE_LEITURA` derivado da config, com teste, e javadoc reescrito.
- [ ] `LockoutLoginIT` assere os dois eventos de audit.

### Commit sugerido

```text
feat(identity): registrar tentativas contra conta bloqueada com audit proprio
```

---

## Task 34.2 - `detalhes` do audit como JSON serializado

**Objetivo**: fechar um defeito real — `username` vem da request e e concatenado direto num campo
`jsonb`.

**Pre-requisito**: Task 34.1 concluida e aprovada.

**Esforco**: 0,25 dia.

**Arquivos esperados**:

- `identity/application/service/LockoutService.java` (linha ~138).
- `identity/application/usecase/RegistrarTentativaLoginUseCase.java` (linha ~47).
- Testes correspondentes.

### Step 034.2.1 - Trocar concatenacao por serializacao

Hoje:

```java
"{\"username\":\"" + username + "\",\"lockoutMinutes\":" + properties.getLockoutMinutes() + "}"
```

Serializar com `ObjectMapper` (ou `Map` + `writeValueAsString`). A coluna e
`@JdbcTypeCode(SqlTypes.JSON)`; um username com aspas produz JSON invalido.

### Step 034.2.2 - Teste com username hostil

Teste com username contendo `"` e `\` provando que o `detalhes` gravado e JSON valido e que o valor
sobrevive ao round-trip. Sem esse teste a correcao nao e verificavel.

### Verificacao da Task 34.2

```bash
./gradlew test --tests "*LockoutServiceTest" --tests "*RegistrarTentativaLoginUseCaseTest"
./gradlew spotlessCheck
```

### Definicao de pronto da Task 34.2

- [ ] Nenhum dos dois pontos monta JSON por concatenacao.
- [ ] Teste com username contendo aspas passa e falha se a concatenacao voltar.

### Commit sugerido

```text
fix(identity): serializar detalhes do audit em vez de concatenar json
```

---

## Task 34.3 - `Retry-After` no `423` e no `429`

**Objetivo**: o cliente recebe o tempo **restante** do bloqueio, nao a duracao configurada.

**Pre-requisito**: Task 34.2 concluida e aprovada.

**Esforco**: 0,5 dia.

**Arquivos esperados**:

- `identity/application/service/LockoutService.java` (expor o instante do evento).
- `identity/application/exception/ContaBloqueadaException.java`.
- `shared/exception/ApiExceptionHandler.java` (linha ~123).
- `identity/infrastructure/security/RateLimitFilter.java` (linhas ~100-110).
- Testes: `LockoutServiceTest`, `AutenticarUsuarioUseCaseTest`, `RateLimitFilterTest`,
  `LockoutLoginIT`.

### Step 034.3.1 - Expor o restante

`PoliticaLockout.eventoDeBloqueio` ja devolve o instante; `estaBloqueada` o descarta ao retornar
`boolean`. Restante = `evento + duracaoBloqueio - agora`. Manter o calculo em dominio — o service
orquestra, nao decide.

`ContaBloqueadaException` passa a carregar segundos restantes. Call sites a ajustar:
`LockoutService:81` e `AutenticarUsuarioUseCaseTest:184`.

### Step 034.3.2 - Emitir o header

`ApiExceptionHandler.handleLocked` acrescenta `Retry-After`. O helper `build` (linhas 214-219) e
compartilhado por todos os handlers: **nao** alterar a assinatura dele de forma que afete os demais —
acrescentar o header no ponto do `423`.

`RateLimitFilter` emite `Retry-After` no `429` (o `limitRefreshPeriod` e de 1 minuto).

**`ErrorResponseDto` nao muda.**

### Step 034.3.3 - Teste que distingue restante de duracao

Um bloqueio que ja correu parte do tempo deve devolver **menos** que `lockout-minutes`. Sem esse
caso, trocar o restante pela duracao fixa sobrevive ao teste — que e exatamente o defeito.

### Verificacao da Task 34.3

```bash
./gradlew test --tests "*Lockout*" --tests "*RateLimitFilterTest" --tests "*AutenticarUsuarioUseCase*"
./gradlew spotlessCheck
```

### Definicao de pronto da Task 34.3

- [ ] `423` responde `Retry-After` com o restante real, com teste que distingue restante de duracao.
- [ ] `429` responde `Retry-After`.
- [ ] `ErrorResponseDto` inalterado.

### Commit sugerido

```text
feat(identity): informar tempo restante do bloqueio via retry-after
```

---

## Task 34.4 - Invariante de config e evicção do registry

**Objetivo**: a invariante deixa de poder ser quebrada em silencio por env var, e o registry deixa de
crescer sem limite.

**Pre-requisito**: Task 34.3 concluida e aprovada.

**Esforco**: 0,5 dia.

**Arquivos esperados**:

- Validador novo em `identity/infrastructure/security/` (ou `shared/`, conforme o padrao seguido).
- `identity/infrastructure/security/RateLimitFilter.java`.
- Testes espelhando `ProviderFlagsValidatorTest`.

### Step 034.4.1 - Validador de startup

Molde exato: `shared/integration/ProviderFlagsValidator.java` — `@Component` implementando
`BeanFactoryPostProcessor, EnvironmentAware`, delegando para um metodo **`static` package-private**
`validar(Environment)`, que e o que torna o teste possivel sem contexto Spring. Falhar com
`IllegalStateException` citando property, valor recebido e a regra.

**Armadilha**: `BeanFactoryPostProcessor` roda **antes** do bind de `@ConfigurationProperties`. Ler
via `environment.getProperty(key, Integer.class, default)` — nao injetar `RateLimitProperties`. E
atencao ao default: o POJO `RateLimitProperties` tem **5**, o YAML tem **10**; replicar o default
errado faz o validador aprovar config que o runtime rejeita.

Teste com `MockEnvironment`, no padrao de `ProviderFlagsValidatorTest` (4 casos: defaults passam,
valores validos passam, valor que quebra a invariante falha citando as properties).

### Step 034.4.2 - Evicção do registry

`RateLimitFilter` cria `RateLimiterRegistry.ofDefaults()` no construtor e faz get-or-create por IP,
sem TTL nem cap. Escolher **um** mecanismo e documentar o porque no javadoc da classe. Agravante a
registrar: `extrairIp` confia em `X-Forwarded-For` sem allowlist de proxy, entao a cardinalidade de
chaves e controlavel pelo cliente.

Teste observavel do mecanismo escolhido — nao basta comentario.

### Verificacao da Task 34.4

```bash
./gradlew test --tests "*RateLimit*" --tests "*Validator*" --tests "*LockoutLoginIT"
./gradlew spotlessCheck
```

### Definicao de pronto da Task 34.4

- [ ] Aplicacao nao sobe com `rate-limit <= max-attempts`; mensagem cita properties e valores.
- [ ] Teste do validador roda sem contexto Spring.
- [ ] Registry deixa de crescer sem limite, com teste observavel.

### Commit sugerido

```text
feat(identity): validar invariante de rate limit no startup e limitar o registry
```

---

## Task 34.5 - `GET /api/v1/auth/politica-lockout`

**Objetivo**: a pagina de conta bloqueada do web pode ler a politica em vez de fixar "30 minutos".

**Pre-requisito**: Task 34.4 concluida e aprovada.

**Esforco**: 0,25 dia.

**Arquivos esperados**:

- `identity/web/controller/AuthController.java` (ou controller proprio) + DTO de resposta.
- `identity/infrastructure/config/SecurityConfig.java` (entrada em `permitAll`).
- Teste de integracao.

### Step 034.5.1 - Endpoint e autorizacao

Somente leitura, sem parametros, derivando de `LockoutProperties` (ja injetavel). `permitAll` junto
de `/auth/login` — quem precisa do valor nao tem sessao por definicao.

Documentar no OpenAPI ja nesta task (`@Operation` + `@ApiResponse`), no padrao do commit `43f5d89`
da Task 33.4.

### Step 034.5.2 - Teste

IT provando `200` **sem** Authorization e que a resposta reflete override de env var (nao so os
defaults) — senao o teste passa com os valores hardcoded.

### Verificacao da Task 34.5

```bash
./gradlew test --tests "*PoliticaLockout*" --tests "*AuthControllerIT" --tests "*SecurityConfig*"
./gradlew spotlessCheck
```

### Definicao de pronto da Task 34.5

- [ ] `200` sem autenticacao, com teste.
- [ ] Resposta reflete override de env var, com teste.
- [ ] Endpoint documentado no OpenAPI.

### Commit sugerido

```text
feat(identity): expor politica de lockout em endpoint publico
```

---

## Task 34.6 - OpenAPI: as cinco lacunas

**Objetivo**: zerar as entradas de `knownGaps` que o `contract:check` carrega desde 2026-07-16.

**Pre-requisito**: Task 34.5 concluida e aprovada.

**Esforco**: 0,75 dia.

**Arquivos esperados**:

- `shared/config/OpenApiConfig.java` (`OperationCustomizer` novo).
- `backoffice/web/dto/DashboardResponse.java`.
- `contratos/web/dto/ContratoResponse.java`, `contratos/web/dto/StatusAssinaturaResponse.java`,
  `contratos/web/mapper/ContratoWebMapper.java`.
- `contratos/web/controller/ContratoController.java` (linhas ~360-403).

### Step 034.6.1 - `X-Step-Up-Token` por customizer

`OperationCustomizer` lendo `handlerMethod.getMethodAnnotation(...)` para as duas anotacoes e
injetando o `HeaderParameter`, com `StepUpEnforcementAspect.HEADER` como **fonte unica** do nome.
Cobre os 24 de uma vez e nao dessincroniza do aspect.

Nota: parte das anotacoes esta **FQN inline** (`CobrancaController`, partes de
`UsuarioController`/`MfaController`) — irrelevante para `getMethodAnnotation`, mas relevante se
alguem tentar a rota manual.

### Step 034.6.2 - Duration, enums e headers de resposta

- `DashboardResponse.tempoMedioResolucao30d`: `@Schema(type = "number")`. **Nao** mexer na config do
  Jackson — viraria breaking change contra o frontend.
- `ContratoResponse` e `StatusAssinaturaResponse`: trocar `String` pelos enums de dominio e remover
  os `.name()` do `ContratoWebMapper` (linhas 33-34, 75-77). MapStruct: rodar build completo.
- `ContratoController.baixarDocumentoAssinado`: `@ApiResponse(headers = {@Header(...)})` para
  `X-Document-Hash-Sha256` e `Content-Disposition`. Padrao novo no projeto.

### Verificacao da Task 34.6

```bash
./gradlew clean build
./gradlew test --tests "*Contrato*" --tests "*Backoffice*" --tests "*OpenApiConfigTest"
./gradlew spotlessCheck
```

### Definicao de pronto da Task 34.6

- [ ] `X-Step-Up-Token` declarado em todos os endpoints anotados, sem duplicacao manual.
- [ ] `tempoMedioResolucao30d` documentado como number; serializacao inalterada.
- [ ] `enum` publicado em `ContratoResponse.tipo`/`status` e
      `StatusAssinaturaResponse.statusContrato`/`statusEnvelope`.
- [ ] Headers documentados na resposta `200` do documento assinado.

### Commit sugerido

```text
docs(api): documentar step-up, enums, duration e headers no contrato openapi
```

---

## Task 34.7 - Regressao de contrato

**Objetivo**: transformar as quatro declaracoes novas em regressao — hoje nada no `sep-api` as
protege.

**Pre-requisito**: Task 34.6 concluida e aprovada.

**Esforco**: 0,25 dia.

**Arquivos esperados**: `src/test/java/com/dynamis/sep_api/shared/config/OpenApiConfigTest.java`.

### Step 034.7.1 - Assert por propriedade, nao por existencia

O teste hoje so faz `jsonPath(...).exists()` sobre paths e schemas — **nenhuma das lacunas seria
detectada por ele**. Acrescentar asserts sobre: parametro de header nos endpoints de step-up, `enum`
nos schemas de contrato e assinatura, `headers` na resposta `200` do documento assinado, e `type` do
`tempoMedioResolucao30d`.

Verificar por mutacao: remover cada declaracao da Task 34.6, uma por vez, e confirmar que o teste
fica vermelho. Declaracao que sobrevive a remocao nao esta protegida.

### Verificacao da Task 34.7

```bash
./gradlew test --tests "*OpenApiConfigTest"
./gradlew clean build spotlessCheck
```

### Definicao de pronto da Task 34.7

- [ ] Cada uma das quatro declaracoes tem assert proprio.
- [ ] Verificacao por mutacao registrada: as quatro remocoes deixam o teste vermelho.

### Commit sugerido

```text
test(api): travar por regressao as declaracoes de contrato da sprint 34
```

---

## Fechamento (nao e task)

### Snapshot e `knownGaps` no `sep-app`

Unico ponto fora do `sep-api`. Com o `sep-api` no `:8080` em perfil `dev`:

```bash
cd <sep-app-root>
curl --fail --silent http://localhost:8080/v3/api-docs | jq -S . > contracts/openapi.snapshot.json \
  && npx prettier --write contracts/openapi.snapshot.json
npm run contract:check
```

O passo do prettier **nao e opcional**: o `lint-staged` roda prettier em `*.json` no commit e sem ele
a regeneracao produz ~1372 linhas de diff espurio.

Atualizar `contracts/openapi.snapshot.meta.json` (`commit`, `runtimeRef`, `exportadoEm`,
`sha256ExportBruto`, `sha256Snapshot`) e **apagar as entradas de `knownGaps` fechadas**. O
`contract-check.mjs` nao detecta gap obsoleto: enquanto a entrada existir, ele segue silenciando o
que ja foi documentado — e o `knownGaps[0]` usa `appliesTo: "*"`, cobrindo 18 endpoints.

Conferir que a saida do `contract:check` deixa de citar as lacunas fechadas.

### Documentacao

- `SEGURANCA.md` §5: conferir contra o comportamento implementado; registrar o `Retry-After`, o
  evento de audit novo e o endpoint publico da politica.
- Criar `repos/sep-api/SPRINT-34-PR.md` e remover a descricao de PR da sprint anterior, se existir.
- Atualizar `AI-ROADMAP.md`, `docs-sep/STATE.md` e apender entrada em `docs-sep/CONTEXT-PARTE-2.md`.
- Atualizar o status desta sprint em `specs/fase-4/README.md` e no §36 do `PRD-FASE-4.md`.
- Registrar os follow-ups que **permanecem** abertos: controle compensatorio contra brute force lento
  (com ADR), `CODIGO` morto de `ContaBloqueadaException`, `countByIpAndJanela` sem consumidor, `MDC`
  literal no `RateLimitFilter`, `Clock` injetavel, os 4 contratos da F-17, deteccao de `knownGap`
  obsoleto no `contract-check.mjs` e a declaracao de status de erro em `consumed-contracts.json`.
