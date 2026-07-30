# Spec 034 - Sprint 34 - Follow-ups de lockout e divida de contrato OpenAPI

## Metadados

- **ID da Spec**: 034
- **Titulo**: Sprint 34 - Quitar os follow-ups backend do par corretivo de lockout e fechar as
  lacunas de OpenAPI que o `contract:check` do `sep-app` carrega como `knownGaps`
- **Status**: planejada (criada em 2026-07-30)
- **Fase do produto**: Fase 4 - correcao de divida tecnica registrada; sem escopo de produto novo
- **Trilha**: Backend (`sep-api`)
- **Origem**: follow-ups registrados por tres sprintes anteriores — a Sprint 33
  ([`033`](./033-sprint-33-lockout-conformidade.md); historico em
  [`CONTEXT-PARTE-2.md`](../../docs-sep/CONTEXT-PARTE-2.md) §Sprint 33),
  a F-Sprint 21 ([`121`](./121-fsprint-21-lockout-login-web.md), lado web do par corretivo) e a
  F-Sprint 19 ([`119`](./119-fsprint-19-hardening-tooling-contrato-web.md), que criou o
  `contract:check` e registrou as lacunas do OpenAPI em `knownGaps`
- **Depende de**: Sprint 33 ([`033`](./033-sprint-33-lockout-conformidade.md)), mergeada em
  `develop`+`main` em 2026-07-29 — esta sprint opera sobre o codigo que ela deixou
- **Desbloqueia**: o `contract:check` do `sep-app` passa a ter opiniao real sobre o `X-Step-Up-Token`
  (hoje silenciado em 18 endpoints por um `knownGap` com `appliesTo: "*"`); e a pagina
  `/account-locked` do web passa a poder ler a politica em vez de fixar "30 minutos"
- **Responsavel principal**: Devs Plenos Backend

## Objetivo

Quitar a divida tecnica que o par corretivo 33 + F-21 deixou registrada e nao paga. Sao duas frentes
independentes, ambas de correcao:

1. **Follow-ups do lockout.** A Sprint 33 corrigiu a politica, mas deixou cinco arestas: nenhuma
   tentativa contra conta bloqueada deixa rastro; o `423` informa a duracao configurada em vez do
   tempo restante; a invariante `rate-limit > max-attempts` so e verificada nos defaults; o
   `RateLimiterRegistry` acumula chaves por IP sem limpeza; e o audit `LOCKOUT` de transicao nao tem
   cobertura observavel fim a fim.
2. **Divida de contrato OpenAPI.** Cinco lacunas registradas desde a F-Sprint 19 (2026-07-16) em
   `knownGaps` do `consumed-contracts.json` do `sep-app`, **todas com `followUp: backend:`**. Enquanto
   existirem, o `contract:check` reporta e nao falha.

O efeito da lacuna 2 e concreto, nao cosmetico: o `knownGaps[0]` do `X-Step-Up-Token` usa
`appliesTo: "*"`, entao **o check silencia o header em 18 endpoints consumidos**. Se o backend
deixasse de exigir step-up, o `contract:check` passaria verde. E o mesmo modo de falha que produziu o
par corretivo 33/F-21 — regressao silenciosa de contrato, descoberta so em producao.

## Decisao tecnica principal — o header, nao o corpo

Tres dos follow-ups convergem para "o cliente precisa saber quanto tempo falta". A escolha e
**emitir `Retry-After` (RFC 9110) no `423` e no `429`**, e nao acrescentar campo ao
`ErrorResponseDto`.

`ErrorResponseDto` e um record de 6 campos (`timestamp`, `status`, `error`, `message`, `path`,
`traceId`) usado por **todo** o `ApiExceptionHandler` e serializado a mao pelo `RateLimitFilter`.
Acrescentar `retryAfterSeconds` mudaria o schema compartilhado por toda a API e todos os call sites de
`ErrorResponseDto.of(...)` — mudanca transversal dentro de uma sprint de divida. O header entrega o
mesmo dado, e um padrao HTTP que qualquer cliente ja entende, e serve ao `429` de graca.

O dado ja existe: `PoliticaLockout.eventoDeBloqueio` **devolve o instante** do evento, mas
`LockoutService.estaBloqueada` o descarta ao retornar `boolean`. O restante e
`evento + duracaoBloqueio - agora`.

**`Retry-After` nao resolve a pagina `/account-locked`**, que renderiza sem ter recebido resposta de
API (o `errorInterceptor` do web navega e descarta o `HttpErrorResponse`). Por isso a sprint tambem
expoe `GET /api/v1/auth/politica-lockout` publico — o unico caminho que atende uma tela
pre-autenticacao. O incremento de exposicao e proximo de zero: a `message` do `423` ja publica o
`lockoutMinutes` hoje.

**Sem ADR nesta sprint**: nao ha escolha estrutural nova; a sprint quita divida ja registrada e
segue padroes existentes (`ProviderFlagsValidator` para o validador de startup, o `@ApiResponse` da
Task 33.4 para OpenAPI). Um ADR passa a ser exigido para o controle compensatorio contra brute force
lento (adiado) e para migrar `lockout-minutes` ao catalogo de `parametro_operacional`.

**Com migration**: `TipoEventoSeguranca` ganha um valor novo e `audit_log_seguranca.tipo` tem
`chk_audit_seguranca_tipo`. A migration `V60` segue o padrao forward-only ja usado por
V13/V15/V22/V41/V55/V57/V59 (`ampliar_audit_seguranca_tipo_*`). Nao ha estado novo nem tabela nova.

## Contrato REST

Um endpoint novo, somente leitura:

```http
GET /api/v1/auth/politica-lockout
200 -> PoliticaLockoutResponse
```

```json
{
  "maxAttempts": 5,
  "windowMinutes": 15,
  "lockoutMinutes": 30
}
```

Valores derivados de `LockoutProperties` (`app.security.lockout.*`), que ja e bean injetavel. Sem
parametros, sem corpo de request, sem efeito colateral.

Headers novos em respostas ja existentes:

```http
POST /api/v1/auth/login        423 -> Retry-After: <segundos restantes do bloqueio>
POST /api/v1/auth/totp/verify  423 -> Retry-After: <segundos restantes do bloqueio>
POST /api/v1/auth/login        429 -> Retry-After: <segundos ate o refresh do rate limit>
POST /api/v1/auth/totp/verify  429 -> Retry-After: <segundos ate o refresh do rate limit>
```

### Autorizacao

`GET /api/v1/auth/politica-lockout` e **publico** (`permitAll` no `SecurityConfig`, junto de
`/auth/login`, `/auth/refresh` e `/auth/totp/verify`). Tem de ser: quem precisa do valor e a tela de
conta bloqueada, que por definicao nao tem sessao.

Nada mais muda de autorizacao. As anotacoes de OpenAPI da Task 34.6 **documentam** o step-up ja
exigido pelo `StepUpEnforcementAspect`; nenhum endpoint passa a exigir ou a dispensar o header.

## Escopo

### Em escopo

- Registrar tentativa com status `CONTA_BLOQUEADA` (hoje nenhuma tentativa contra conta bloqueada
  gera linha em `login_attempt`, porque `verificar()` lanca antes de `registrar(...)`), com valor novo
  em `TipoEventoSeguranca` para distinguir "tentou durante o bloqueio" do `LOCKOUT` de transicao +
  migration `V60` ampliando `chk_audit_seguranca_tipo`.
- Derivar `LockoutService.LIMITE_DE_LEITURA` da configuracao: o valor fixo de 100 e seguro **apenas**
  porque tentativas bloqueadas nao sao registradas — premissa que o proprio javadoc do campo declara e
  que esta sprint remove.
- Serializar o campo `detalhes` do audit com `ObjectMapper` em vez de concatenacao de string
  (`LockoutService` e `RegistrarTentativaLoginUseCase`), contra coluna `jsonb`.
- `Retry-After` no `423` (tempo restante real, derivado do evento de bloqueio) e no `429`.
- Validador de startup da invariante `rate-limit > max-attempts`, no padrao do
  `ProviderFlagsValidator`.
- Evicção do `RateLimiterRegistry` do `RateLimitFilter`.
- `GET /api/v1/auth/politica-lockout` publico.
- Documentar no OpenAPI: `X-Step-Up-Token` (24 endpoints anotados com `@RequireStepUp` /
  `@RequireStepUpEstrito`), `Duration` do dashboard como number, enums de `TipoContrato` /
  `StatusFormalizacao` / `StatusEnvelope`, e os headers de resposta do documento assinado.
- Estender o `OpenApiConfigTest` para travar por regressao cada lacuna fechada — hoje ele so verifica
  existencia de path e schema, entao **nenhuma das lacunas seria detectada por ele**.
- Assert do audit `LOCKOUT` na `LockoutLoginIT` (o `REQUIRES_NEW` de `avaliarPosFalha` nao tem
  cobertura observavel).

### Fora de escopo

- **Controle compensatorio contra brute force lento** (backoff exponencial ou rate limit por conta).
  E controle de seguranca novo, nao follow-up: exige decisao de politica e **ADR**. O risco residual
  foi explicitamente aceito pelo usuario em 2026-07-29 e esta registrado em
  [`SEGURANCA.md`](../../docs-sep/SEGURANCA.md) §5. **Follow-up**.
- Persistir estado de lockout (`bloqueado_ate`). Continua derivado, como decidido na Sprint 33.
- Endpoint de desbloqueio administrativo ou self-service. Continua nao existindo.
- Zerar o contador em login bem-sucedido — mudanca de politica, nao de conformidade.
- Migrar `lockout-minutes` para o catalogo de `parametro_operacional`: coerente com a governanca da
  Sprint 18, mas mistura config de seguranca com config de negocio e exige migration de catalogo +
  ADR. **Follow-up**.
- Acrescentar campo ao `ErrorResponseDto` — alternativa avaliada e rejeitada acima.
- Os 4 contratos ausentes registrados pela F-Sprint 17 (paginacao/filtros em
  `GET /cobranca/recebimentos`, recebimentos por parcela para o perfil financeiro, listagem Pix por
  operacao/contrato, DTO consolidado server-side): sao endpoints e capacidades **novas**, feature e
  nao divida de anotacao. **Follow-up**.
- `ContaBloqueadaException.CODIGO = "AUTH-423-001"` esta morto — a classe estende `RuntimeException`
  direto, fora da hierarquia sealed `DomainException` que carrega `codigo`, e nenhum consumidor le o
  valor. Decidir entre publicar no payload ou remover e refactor de contrato de erro, transversal.
  **Follow-up**.
- `LoginAttemptRepository.countByIpAndJanela` aparentemente sem consumidor em `src/main/java`
  (sobrevivente da limpeza da Sprint 33). Confirmar e remover. **Follow-up**.
- `RateLimitFilter` usa `MDC.get("correlationId")` literal em vez de `CorrelationIdFilter.MDC_KEY`.
  **Follow-up**.
- Injetar `Clock` em `LockoutService` (hoje `OffsetDateTime.now()` direto). **Follow-up**.
- Alterar `sep-app` ou `sep-mobile` **exceto** `sep-app/contracts/` no gate de fechamento (reexportar
  o snapshot e apagar as entradas de `knownGaps` fechadas). Declarar os status de erro em
  `consumed-contracts.json` e estender o `contract-check.mjs` para inspeciona-los e escopo web.
  **Follow-up**.

## Tasks de implementacao

1. Observabilidade do bloqueio: registrar `CONTA_BLOQUEADA`, tipo de audit novo + migration `V60`,
   `LIMITE_DE_LEITURA` derivado da config e assert do audit `LOCKOUT` na `LockoutLoginIT`.
2. `detalhes` do audit serializado com `ObjectMapper` em vez de concatenacao (defeito: username vem
   da request e a coluna e `jsonb`).
3. `Retry-After` no `423` e no `429`, com tempo restante real derivado do evento de bloqueio.
4. Validador de startup da invariante `rate-limit > max-attempts` + evicção do `RateLimiterRegistry`.
5. `GET /api/v1/auth/politica-lockout` publico.
6. OpenAPI: `X-Step-Up-Token` nos 24 endpoints de step-up, `Duration` como number, enums de contrato
   e assinatura, headers de resposta do documento assinado.
7. Regressao de contrato: estender o `OpenApiConfigTest` para travar as quatro lacunas fechadas.

## Gates que nao contam como task

- Precheck de cadeia Git (`main` em `develop`, Sprint 33 presente) e baseline verde da suite completa
  (**2173 testes** de partida).
- Reconfirmar, antes da Task 34.1, que nenhum caminho de producao escreve `CONTA_BLOQUEADA` hoje e
  que o `switch` de `RegistrarTentativaLoginUseCase` e realmente inalcancavel.
- Confirmar que `CONTA_BLOQUEADA` permanece **fora** de `STATUSES_FALHA` depois da Task 34.1 — se
  entrar, cada tentativa barrada renova o proprio bloqueio (bloqueio auto-perpetuante). Ha teste de
  guarda em `LockoutServiceTest`.
- Conferir que `SEGURANCA.md` §5 continua descrevendo o que o codigo faz.
- **Fechamento no `sep-app`** (unico ponto fora do `sep-api`): subir o `sep-api` em perfil `dev`,
  reexportar `contracts/openapi.snapshot.json` **com o passo do prettier**, atualizar
  `openapi.snapshot.meta.json` e apagar as entradas de `knownGaps` fechadas. Sem isso a divida nao
  fecha: um `knownGap` obsoleto continua silenciando o que ja foi documentado.
- PR description (`SPRINT-34-PR.md`).

## Definition of Done

- Uma tentativa de login contra conta bloqueada gera linha em `login_attempt` com status
  `CONTA_BLOQUEADA` e um evento de audit **distinto** do `LOCKOUT` de transicao, com teste para os
  dois eventos.
- `CONTA_BLOQUEADA` continua fora de `STATUSES_FALHA` e o `LIMITE_DE_LEITURA` deixa de depender da
  premissa removida, com teste que falha se o limite voltar a ser constante.
- O campo `detalhes` do audit e JSON valido para username contendo aspas, com teste.
- `423` e `429` respondem `Retry-After`; no `423` o valor e o **restante** do bloqueio, nao a duracao
  configurada — com teste que distingue os dois (um bloqueio antigo devolve menos que
  `lockout-minutes`).
- A aplicacao **nao sobe** com `rate-limit <= max-attempts`, com mensagem citando as properties e os
  valores recebidos; teste sem contexto Spring, no padrao do `ProviderFlagsValidatorTest`.
- O `RateLimiterRegistry` deixa de crescer sem limite, com teste observavel do mecanismo escolhido.
- `GET /api/v1/auth/politica-lockout` responde `200` sem autenticacao e reflete override de env var,
  com teste.
- OpenAPI declara: `X-Step-Up-Token` em todos os endpoints anotados com `@RequireStepUp` /
  `@RequireStepUpEstrito`, `enum` em `ContratoResponse.tipo`/`status` e
  `StatusAssinaturaResponse.statusContrato`/`statusEnvelope`, `X-Document-Hash-Sha256` e
  `Content-Disposition` na resposta `200` do documento assinado, e `tempoMedioResolucao30d` como
  number.
- O `OpenApiConfigTest` falha se qualquer uma dessas quatro declaracoes for removida.
- Suite completa verde (unit + IT), `./gradlew clean build spotlessCheck` verde, migration `V60`
  aplicada e forward-only.
- No `sep-app`: snapshot reexportado, `meta.json` atualizado e as entradas de `knownGaps` fechadas
  removidas; `npm run contract:check` verde e **sem** as lacunas na saida.
