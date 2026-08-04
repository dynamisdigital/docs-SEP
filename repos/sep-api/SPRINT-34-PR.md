# Sprint 34 — Follow-ups de lockout e divida de contrato OpenAPI

Quita os cinco follow-ups backend que a Sprint 33 registrou e fecha as lacunas de
OpenAPI que o `contract:check` do `sep-app` carrega como `knownGaps` desde a
F-Sprint 19. **Sprint de divida: sem escopo de produto novo.**

- Spec: [`034`](../../specs/fase-4/034-sprint-34-followups-lockout-contrato.md)
- Steps: [`034`](../../steps-fase-4/backend/034-sprint-34-steps.md)
- Base: `a613c6c` (Sprint 33) · Migration: `V60` · Sem ADR · Sem estado novo

## Resultado

**MERGEADA develop+main em 2026-08-03** — PR #103 (squash `0d24602`) em `develop` e PR #104
(`550fed3`) em `main`; `develop` == `main` conferido por diff de conteudo (vazio). Gate de contrato
no `sep-app` junto: PR #120 (`83681e2`) / #121 (`ed9c816`).

**2220 testes, 0 falhas** (partida: 2173). `clean build` e `spotlessCheck` verdes.
13 commits: 7 de task, 6 de hotfix de code review.

## O que entrou

### Observabilidade do bloqueio (34.1)

Ate a Sprint 33 **nenhuma tentativa contra conta bloqueada deixava rastro**:
`lockoutService.verificar()` lanca antes de qualquer `registrar(...)`, entao uma
conta sob ataque durante o bloqueio ficava invisivel. Os dois use cases passam a
capturar a excecao, gravar `LoginAttemptStatus.CONTA_BLOQUEADA` e repropagar. O
registro roda em `REQUIRES_NEW` pelo mesmo motivo da Sprint 33 — o caminho termina
em excecao e a transacao do use case e desfeita.

Tipo de audit proprio (`LOCKOUT_TENTATIVA_BARRADA`, migration `V60` forward-only)
em vez de discriminar pelo JSON: "bloqueou agora" e "tentou durante o bloqueio" sao
fatos distintos, e com o mesmo tipo separa-los exigiria parsear `jsonb`.
`CONTA_BLOQUEADA` continua **fora** da contagem de falhas — se entrasse, cada
tentativa barrada renovaria o proprio bloqueio.

O `LIMITE_DE_LEITURA` deixou de ser constante: o javadoc do campo declarava que o
teto de 100 so era seguro **porque** tentativas bloqueadas nao eram registradas, e
esta task removeu exatamente essa premissa. Agora deriva da politica.

### `detalhes` do audit serializado (34.2)

O campo e `jsonb` e o `username` vem do corpo da request, mas o documento era
montado por concatenacao de string. Um username com aspas produz JSON invalido, que
o Postgres rejeita na conversao — derrubando a gravacao inteira do rastro, dentro
de um `REQUIRES_NEW`. O `@Email` do DTO nao protege: a RFC admite local-part entre
aspas.

### `Retry-After` no `423` e no `429` (34.3)

`PoliticaLockout` ja calculava o instante do evento, mas `estaBloqueada` devolvia
`boolean` e o descartava — uma conta bloqueada ha 29 minutos mandava o cliente
esperar 30. O metodo vira `tempoRestanteDeBloqueio` (`Optional<Duration>`) e o
`423` publica os segundos restantes; a `message` continua enunciando a politica.
O `429` publica o periodo de refresh do limitador. `ErrorResponseDto` inalterado.

**Achado do review**: `Retry-After` nao e safelisted pelo CORS e
`app.cors.exposed-headers` so listava `X-Correlation-Id`. A feature nascia **inerte**
para seus unicos consumidores — `headers.get('Retry-After')` devolvia `null` no
browser — e `LockoutLoginIT` nao via nada porque RestAssured nao aplica CORS.

### Invariante de rate limit e evicção do registry (34.4)

A invariante `rate-limit > max-attempts` vivia num comentario do `application.yml`
e num assert de teste; as cinco env vars podiam quebra-la em silencio, e a
consequencia e muda (o `429` mascara o `423`). `RateLimitLockoutValidator` derruba
o boot citando property, valor e regra. Le pelo `Binder`, e nao por `getProperty`,
para enxergar o mesmo relaxed binding do `@ConfigurationProperties` — senao um
override em camelCase ficaria invisivel ao validador e visivel ao runtime.

**Nesse caminho apareceu que os proprios defaults violavam a invariante**:
`RateLimitProperties` valia 5, igual a `max-attempts`, e so o `application.yml` (10)
segurava. Corrigido para 10, com teste travando o par contra deriva.

O mapa de limitadores deixou de crescer sem limite (era get-or-create por IP sem
TTL nem teto, com a origem escolhida pelo cliente): LRU por ordem de acesso, teto de
10.000. A origem tambem passou a ser limitada a 45 chars — um token de 8 KB inflava
a memoria em mais de 20x e estourava `login_attempt.ip VARCHAR(45)`, abortando o
rastro e devolvendo 500 sem registro.

### `GET /api/v1/auth/politica-lockout` (34.5)

O `Retry-After` resolve o login, mas nao `/account-locked`, que renderiza sem ter
recebido resposta de API — o `errorInterceptor` navega e descarta o erro — e por
isso fixava "30 minutos" no texto. Endpoint publico, somente leitura, derivado da
**mesma** `PoliticaLockout` que o `LockoutService` aplica, entao o que se anuncia e
o que se impoe. `permitAll` **por metodo**: escrita no mesmo path segue exigindo
autenticacao, com teste travando.

### Contrato OpenAPI (34.6) e regressao (34.7)

- **`X-Step-Up-Token`**: `OperationCustomizer` lendo a propria anotacao declara os
  **24** endpoints de uma vez, com o nome vindo de `StepUpEnforcementAspect.HEADER`,
  entao nao dessincroniza do aspect. `required` distingue as duas anotacoes, que
  **nao** sao equivalentes: `@RequireStepUpEstrito` (10) nao admite bypass;
  `@RequireStepUp` (14) libera usuario sem MFA habilitado. Marcar os 24 como
  obrigatorio faria o contrato rejeitar um cliente legitimo.
- **Enums**: `ContratoResponse.tipo`/`status` e
  `StatusAssinaturaResponse.statusContrato`/`statusEnvelope` trocam `String` pelos
  enums de dominio; o mapper perde tres `.name()`. Wire byte-identico (Jackson
  serializa enum por `name()`), sem breaking change — sao DTOs de resposta apenas.
- **Headers de resposta**: `X-Document-Hash-Sha256` e `Content-Disposition` no `200`
  do documento assinado, mais `Retry-After` nos `423`/`429`.
- **Regressao (34.7)**: o `OpenApiConfigTest` so fazia `.exists()`, entao apagar as
  quatro declaracoes deixava a suite verde. Cinco testes novos assertam propriedade,
  e dois vao alem de assert fixo — a contagem de handler methods anotados contra
  operacoes documentadas filtra por **prefixo do nome da anotacao**, pegando uma
  terceira anotacao de step-up futura; e as listas de enum sao **literais**, porque
  deriva-las de `values()` faria os dois lados andarem juntos e o crescimento passar
  verde (medido).

## Duas premissas da spec estavam erradas

Registrado porque muda o criterio de fechamento, nao so o codigo.

**1. `Duration` — a lacuna nao e do backend.** A spec afirmava que
`WRITE_DURATIONS_AS_TIMESTAMPS` ficava no default habilitado do Jackson e mandava
anotar o campo como `number`. O `JacksonAutoConfiguration` do Spring Boot **desliga**
a flag: o fio leva ISO-8601 (`"PT2H"`, medido). Ou seja, o `type: string` que o
springdoc infere **ja estava certo**, e quem diverge e o `sep-app`, que declara
`frontendType: number`.

Consequencia hoje: `backoffice-format.ts` faz `Math.round(segundos / 60)` sobre
`"PT2H"` e o KPI do dashboard renderiza **`NaNmin`** — o mock MSW devolve `7200`,
entao nenhum teste do front ve. Anotar o schema como `number` teria apagado o unico
detector disso, deixando o `contract:check` verde por acordo entre contrato errado e
cliente errado.

> **O `knownGap` de `field-type-mismatch` do `Duration` NAO pode ser apagado no
> fechamento desta sprint.** Ele fecha do lado web.

A suite nao pegou porque `DashboardBackofficeTest` usa um `ObjectMapper` cru, sem a
auto-configuracao do Boot, onde a flag segue ligada e o campo sai numero. A forma
real ficou fixada na `BackofficeIT`.

**2. Defaults de `RateLimitProperties`** — ver 34.4 acima.

## Verificacao por mutacao

Toda declaracao e todo comportamento novo foi verificado aplicando a regressao
correspondente e confirmando o teste vermelho, com reversao registrada:

| Mutacao | Teste que morreu |
|---|---|
| restante trocado pela duracao configurada | `LockoutServiceTest` |
| `Retry-After` fora de `exposed-headers` | `CorsConfigTest` |
| `removeEldestEntry` -> `false` | `RateLimitFilterTest` (2) |
| `<=` -> `<` na invariante | `RateLimitLockoutValidatorTest` |
| `@Component` removido do validador | `eDescobertoPeloComponentScan` |
| sem corte de tamanho da origem | `origemMaiorQueOLimiteViraBaldeUnico` |
| `permitAll` sem metodo (POST vira 500) | `naoAbreOutrosMetodosNoMesmoPath` |
| `politica()` ignorando a config | `PoliticaLockoutIT` |
| customizer removido / pulando 1 endpoint | `OpenApiConfigTest` (2) |
| headers do documento / `Retry-After` removidos | `headersDeRespostaDeclarados` |
| enums de volta a `String` | `enumsDeContratoEAssinaturaPublicadosNoSchema` |
| **crescer `StatusFormalizacao`** | idem (so **depois** do endurecimento; antes passava) |
| mapper nulificado | `ContratoWebMapperTest` |

## Fora de escopo

- Controle compensatorio contra brute force lento — exige ADR; risco aceito em
  2026-07-29.
- Persistir estado de lockout; endpoint de desbloqueio; zerar contador em login OK.
- Campo novo no `ErrorResponseDto`.
- Os 4 contratos ausentes da F-Sprint 17 — feature, nao divida de anotacao.
- Codigo em `sep-app`/`sep-mobile`. O unico toque no `sep-app` e em `contracts/`, no
  gate de fechamento.

## Follow-ups abertos

**Web** — `NaNmin` no dashboard backoffice; `api.models.ts` declara
`tempoMedioResolucao30d: number` e deveria ser `string`; `authInterceptor` precisa
isentar `/auth/politica-lockout` (senao reload de `/account-locked` com token velho
leva 401 e volta ao texto fixo); consumir o endpoint de politica (**F-22.6**).

**Backend** — `forward-headers-strategy: native` com `internal-proxies` no CIDR do
balanceador (o allowlist de proxy que falta); `resilience4j.ratelimiter.configs.default`
morto no `application.yml` (configura o registry do starter, que nada usa);
`ApiExceptionHandler` sem handler de `HttpRequestMethodNotSupportedException`;
enums saem inline no schema em vez de `$ref`; `message` do `423` diz "30 minutos"
enquanto o `Retry-After` traz o restante; controle compensatorio (ADR).

**Ja registrados antes e mantidos** — `ContaBloqueadaException.CODIGO` morto;
`countByIpAndJanela` sem consumidor; `MDC.get` literal no `RateLimitFilter`;
`Clock` injetavel no `LockoutService`; deteccao de `knownGap` obsoleto no
`contract-check.mjs`.

## Gate de fechamento (nao e task)

1. `sep-app/contracts/` — **feito** em 2026-08-03 (branch `feature/sprint-34-contrato-snapshot`,
   commit `ff7bc7d`): snapshot reexportado do runtime desta branch (`f37ffc8`, perfil `dev`),
   `knownGaps` de **8 para 1** e `contract:check` de **29 lacunas para 1**; gates do `sep-app`
   verdes (`contract:check`, `lint`, `format:check`, `build`, Vitest 745). A lacuna restante e a do
   `Duration`, com o `reason` corrigido. **Se esta sprint for mergeada com squash, atualizar
   `commit`/`runtimeRef` no `openapi.snapshot.meta.json`** — o snapshot saiu da branch, antes do
   merge.
2. `SEGURANCA.md` §5 e §7 — feito.
3. `AI-ROADMAP.md`, `STATE.md`, `CONTEXT-PARTE-2.md`, `specs/fase-4/README.md`,
   `PRD-FASE-4.md` §36 — feito.

## Incidente no merge (resolvido)

O back-merge `main` -> `develop` (`4a02fc1`) duplicou `falhasRecentes(int, Duration)` em
`LockoutServiceTest`, quebrando `compileTestJava` no CI de `develop` -> `main`. **Nao foi o squash da
feature**, que entrou correto com 2 definicoes; foi o back-merge que virou 3, adicionando 8 linhas num
arquivo que `main` nao havia alterado desde a base comum — o 3-way do git manteria `develop` intacto,
entao foi resolucao manual. Corrigido em `fd4b4b1` (-8 linhas), e depois disso a arvore de `develop`
voltou a ser byte-identica a da branch verificada.

Raio medido, nao presumido: a branch estava 13 commits a frente e 0 atras de `origin/develop`, entao
um merge limpo obriga diff vazio; o diff real era de 8 linhas em 1 arquivo, e `main` ainda nao tinha
recebido a sprint.

Terceira ocorrencia de evil merge no projeto e primeira no `sep-api`, com variante nova: antes foram
injecao de texto estranho (F-10, F-14) e reversao silenciosa (M-7), agora **duplicacao**. **Nao e
pego por `format:check` nem por teste** — o bloco duplicado esta bem formatado e a suite nem chega a
rodar. So a compilacao pega, o que espelha o M-7, onde o `vitest` passava e so o `build` AOT pegou.
O risco mora no back-merge que fecha toda sprint, nao no squash da feature.
