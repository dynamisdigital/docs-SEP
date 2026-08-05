# Steps - Sprint 35 - Divida de configuracao, lockout e contrato

**Spec de origem**: [`035-sprint-35-divida-config-lockout-contrato.md`](../../specs/fase-4/035-sprint-35-divida-config-lockout-contrato.md)

**Status**: **planejada** (criada em 2026-08-05). Nenhuma Task executada.

**Sprint irma**: nenhuma. E a **terceira** das tres sprints de divida planejadas em 2026-08-05:
[`D-1`](../cross-repo/300-dsprint-1-steps.md) -> [`F-24`](../web/124-fsprint-24-steps.md) -> `35`.
**Independente da F-24** — nenhuma das duas consome contrato novo da outra.

**Objetivo geral**: fechar os follow-ups tecnicos que as Sprints 33 e 34 registraram, deixando no
backlog apenas o que exige ADR.

**Esforco total estimado**: 2 dias de Dev Pleno Backend.

**Repos de destino**:

- `sep-api`: `src/main/resources/application.yml`,
  `identity/infrastructure/security/LockoutProperties.java`,
  `identity/infrastructure/security/RateLimitFilter.java`,
  `identity/application/service/LockoutService.java`,
  `identity/application/exception/ContaBloqueadaException.java`,
  `identity/infrastructure/persistence/LoginAttemptRepository.java`,
  `shared/exception/ApiExceptionHandler.java`, + testes.
- `docs-SEP`: este step, a spec 035, indices e PR description; **Git manual**.

**Branch sugerida**: `feature/sprint-35-divida-config-lockout`, criada de `develop` atualizado.

**Pre-requisitos**: nenhum externo. O repo estava em `fix/lockout-service-test-helper-duplicado`
(`fd4b4b1`), **nao** em `develop` — conferir o checkout no Gate.

**Skills obrigatorias durante a implementacao**: `coding-guidelines`, `clean-code`,
`design-patterns-java`.

---

## Estado atual verificado (2026-08-05)

Levantado antes de planejar. Qualquer divergencia encontrada no Gate 35.0 invalida o desenho abaixo.

### Configuracao

`application.yml:64-66`:

```yaml
server:
  port: 8080
  forward-headers-strategy: framework # respeita X-Forwarded-* atras de proxy
```

**Nao ha `server.tomcat.remoteip.internal-proxies` em lugar nenhum do arquivo.** Com `framework`, o
Spring usa o `ForwardedHeaderFilter`, que honra `X-Forwarded-For` de **qualquer** origem.

`application.yml:372-377`:

```yaml
  ratelimiter:
    configs:
      default:
        limitForPeriod: 5
        limitRefreshPeriod: 60s
        timeoutDuration: 0
```

Configura o registry do starter Resilience4j. O rate limit de login/TOTP e do `RateLimitFilter`
proprio, que **nao le esse registry**.

### `LockoutProperties`

`identity/infrastructure/security/LockoutProperties.java` — `@Component`,
`@ConfigurationProperties(prefix = "app.security.lockout")`, campos `maxAttempts = 5` (com
`DEFAULT_MAX_ATTEMPTS`), `windowMinutes = 15`, `lockoutMinutes = 30`, getters e setters.
**Nenhuma anotacao de validacao no arquivo inteiro.**

**Precedente ja instalado**: `identity/infrastructure/security/RateLimitLockoutValidator.java` valida
a invariante `rate-limit > max-attempts` no boot e le pelo `Binder` (`:65`) — `:52` documenta *por que*
`Binder` e nao `environment.getProperty`: so ele aplica relaxed binding. Este e o mecanismo a estender,
nao um a inventar.

**Por que importa do outro lado do fio**: `sep-app/src/app/core/auth/politica-lockout.service.ts:45-52`
(`ehUtilizavel`) exige os **tres** campos como inteiros positivos e devolve `null` se qualquer um
falhar. `APP_LOCKOUT_WINDOW_MINUTES=0` derruba os tres numeros da `/account-locked` de uma vez.

### `ApiExceptionHandler`

`shared/exception/ApiExceptionHandler.java` — **17** `@ExceptionHandler`: `:46`
`MethodArgumentNotValidException`, `:56` `HttpMessageNotReadableException`, `:62`
`MissingRequestHeaderException`, `:69` `MethodArgumentTypeMismatchException`, `:77`
`DataIntegrityViolationException`, `:93` `NoHandlerFoundException`, `:98` `NoResourceFoundException`,
`:103` `DomainException`, `:116` `AccessDeniedException`, `:121` `AuthenticationException`, `:138`
`ContaBloqueadaException`, `:164` `AssinaturaProviderException`, `:202` `PixProviderException`, `:225`
`LimiteReprocessoExcedidoException`, `:232` `TipoReprocessoNaoSuportadoException`, `:239`
`Exception`.

**Nenhum de `HttpRequestMethodNotSupportedException`** — um `PUT` numa rota so-`POST` cai no
`Exception.class` de `:239` e vira `500`.

### Codigo morto

- `ContaBloqueadaException.java:13` — `public static final String CODIGO = "AUTH-423-001"`;
  `:36-38` — `getCodigo()`. **Nenhum consumidor**: a unica outra ocorrencia de `getCodigo()` em
  `src/main` e `DomainException:30`, classe diferente.
- `LoginAttemptRepository.java:41` — `countByIpAndJanela(...)`. Unico chamador:
  `LoginAttemptRepositoryTest:58`.

### `Clock` e `MDC`

- `LockoutService.java:100` e `:144` — `OffsetDateTime.now()` direto. O `PoliticaLockout` extraido pela
  Sprint 33 e puro e testavel; o service nao.
- `shared/integration/CorrelationIdFilter.java:31` — **`public static final String MDC_KEY = "correlationId"` JA EXISTE**.
  Mas **4 call sites usam o literal**: `RateLimitFilter.java:188`, `JwtTokenProvider.java:76` e `:100`,
  `cobranca/application/listener/ParcelaAtrasouListener.java:76`. O `STATE.md` nomeava so o
  `RateLimitFilter` — **sao quatro**.

### Contrato

- Enums saem inline no schema em vez de `$ref`. **Registrado pela Sprint 34, NAO verificado neste
  levantamento** — o Gate 35.0 confere antes de a Task 35.7 desenhar qualquer coisa.
- `ContaBloqueadaException.java:28` — a mensagem e montada com `lockoutMinutes` (duracao
  **configurada**), enquanto `getTempoRestante()` (`:32-34`) carrega o restante real que o
  `Retry-After` emite. O docblock `:18-26` documenta a divergencia como **deliberada**, com o
  raciocinio de tipo (`Duration` e nao `int`) para evitar `"Tente novamente em 1800 minutos"`.

---

## Decisoes da sprint

1. **A 35.2 e a unica com risco de ambiente; as outras seis sao verificaveis em memoria.** Um
   `internal-proxies` errado quebra o rate limit por IP de **duas formas opostas**: CIDR largo demais
   mantem o bypass; CIDR estreito demais faz todo mundo compartilhar o IP do balanceador e o limite
   vira global. Por isso ela exige teste dos **dois** lados.

2. **`native` e `internal-proxies` andam juntos, nunca separados.** `internal-proxies` e propriedade do
   `RemoteIpValve` do Tomcat e so tem efeito com a estrategia `native`. Trocar so a estrategia
   **piora**: passa a confiar no header sem nem o tratamento do Spring.

3. **A 35.1 estende o `RateLimitLockoutValidator`, nao cria mecanismo novo.** Ele ja existe, ja le pelo
   `Binder` e ja documenta o porque (`:52`). Um segundo validador com a mesma responsabilidade seria
   complexidade desnecessaria.
   *Aberto para os steps*: se `@Min` nos campos + `@Validated` bastarem, e melhor — anotacao declarativa
   ganha de validador imperativo. O criterio de decisao e se o relaxed binding continua enxergado.

4. **A 35.6 corrige os quatro call sites de `MDC.get`, nao so o do `RateLimitFilter`.** A constante ja
   existe; deixar tres literais e deixar o defeito com contagem menor.

5. **A 35.7 pode terminar em "manter a divergencia".** O docblock de `ContaBloqueadaException:18-26`
   argumenta que a mensagem enuncia a **politica** e o header traz o **restante** — dois numeros
   diferentes, corretos, com semantica diferente. E a F-23 ja resolveu isso no web fazendo o **header
   ganhar do corpo**. Desfecho legitimo: registrar como definitiva. O que nao vale e sair sem decisao.

6. **Codigo morto sai com prova, nao com memoria.** Cada remocao acompanhada de `grep` no checkpoint
   mostrando ausencia de consumidor.

---

## Protocolo obrigatorio por Task

1. Executar **somente** a Task liberada; nao adiantar a seguinte.
2. Toda afirmacao sobre o codigo atual conferida no arquivo, com `arquivo:linha` — nao pela memoria
   nem por este documento.
3. Teste novo **verificado por mutacao**: aplicar a mutacao nomeada, ver o teste falhar, reverter.
   Teste que sobrevive e considerado **nao entregue**. A Sprint 34 aplicou 13 regressoes assim e
   **duas** revelaram testes que passavam provando nada.
4. Rodar a verificacao da Task antes de pedir checkpoint. Capturar `EXIT=$?` explicito; **nunca**
   validar por `| tail`.
5. **PAUSA #1** — checkpoint pre-commit: `git status --short --branch`, `git diff --stat`, arquivos
   criados/modificados/removidos, gates rodados e resultado, riscos/pendencias, mensagem sugerida.
   Aguardar aprovacao explicita antes de `git add`/`git commit`. `git add <paths>`, nunca `-A`.
6. Commit + `chown -R mauricio:mauricio .git .claude` logo apos.
7. **Um** code review por subagente. Se houver findings: hotfix -> **PAUSA #2** -> commit do hotfix,
   **sem novo review de subagente**.
8. **PAUSA #3** — fim da Task. Aguardar o review manual do usuario e ordem explicita para a proxima.
9. Push e PR **manuais** (dev humano). Em `docs-SEP` o git e 100% manual.

---

## Rastreabilidade spec 035 -> steps

| Item da spec | Steps |
|---|---|
| Validacao de `LockoutProperties` no boot | 35.1 |
| `forward-headers-strategy: native` + `internal-proxies` | 35.2 |
| `HttpRequestMethodNotSupportedException` | 35.3 |
| `resilience4j.ratelimiter.configs.default` morto | 35.4 |
| `ContaBloqueadaException.CODIGO` + `countByIpAndJanela` | 35.5 |
| `Clock` injetavel + `MDC` por constante | 35.6 |
| Enums por `$ref` + `message` do `423` | 35.7 |
| Baseline, gates e limitacoes | Gate 35.0 e Fechamento |

---

## Ordem de execucao

```text
Gate 35.0 (precheck + baseline)
  -> 35.1  validacao de LockoutProperties   [independente]
  -> 35.2  forward-headers + internal-proxies [independente; MAIOR RISCO — cedo, para o
                                               review manual ter margem]
  -> 35.3  HttpRequestMethodNotSupported     [independente]
  -> 35.4  remover resilience4j morto        [independente]
  -> 35.5  remover codigo morto              [independente]
  -> 35.6  Clock + MDC por constante         [DEPOIS da 35.1: as duas tocam a familia
                                              LockoutProperties/LockoutService]
  -> 35.7  contrato (enums + message do 423) [POR ULTIMO: depende do que o Gate apurar
                                              sobre os enums e da decisao da 35.6 sobre o Clock]
Fechamento (gates completos + docs + PR description)
```

A 35.2 vem cedo **por risco, nao por dependencia**: e a unica que muda como o servidor enxerga a
origem de toda request, e review manual precoce vale mais que ordem tematica.

---

## Gate 35.0 - Precheck e baseline

### Step 035.0.1 - Branch a partir de `develop` atualizado

```bash
cd /home/mauricio/workspaces/workspace-sep/sep-api
git fetch origin
git checkout develop && git pull --ff-only
git diff --stat origin/main origin/develop   # esperado: vazio
git checkout -b feature/sprint-35-divida-config-lockout
```

O repo estava em `fix/lockout-service-test-helper-duplicado` (`fd4b4b1`) — **conferir o checkout, nao
assumir**. Se `develop != main` por conteudo, parar e reportar: a Sprint 34 teve incidente de
back-merge (`4a02fc1` duplicou um helper e quebrou `compileTestJava` no CI), e a invariante existe por
causa disso.

### Step 035.0.2 - Baseline medida

```bash
./gradlew clean build; echo "EXIT=$?"      # partida esperada: 2220 testes / 0 falhas
./gradlew spotlessCheck; echo "EXIT=$?"
```

Anotar o total de testes. **Numero nao medido aqui nao pode ser citado no fechamento.**

### Step 035.0.3 - Reconferir os pontos que o desenho assume

Conferir no arquivo: `application.yml:66` (estrategia) e ausencia de `internal-proxies`;
`application.yml:372-377`; `LockoutProperties.java` sem validacao;
`RateLimitLockoutValidator.java:52,65` (o precedente do `Binder`); os 17 `@ExceptionHandler` sem
`HttpRequestMethodNotSupportedException`; `ContaBloqueadaException.java:13,36`;
`LoginAttemptRepository.java:41`; `LockoutService.java:100,144`; e os **4** call sites de
`MDC.get("correlationId")` contra `CorrelationIdFilter.java:31`.

### Step 035.0.4 - Apurar o item de enums (nao verificado no levantamento)

Gerar o OpenAPI do runtime em perfil `dev` e conferir se os enums saem inline ou por `$ref`, e
**quantos** sao. A spec registra esse item como *registrado pela Sprint 34, nao verificado* — a Task
35.7 nao desenha nada antes desta medicao.

### Definicao de pronto do Gate 35.0

- [ ] Branch criada de `develop` atualizado; `develop == main` por conteudo.
- [ ] Baseline anotada (total de testes, `clean build`, `spotlessCheck`).
- [ ] Os pontos do 035.0.3 conferidos, ou a divergencia reportada antes de qualquer codigo.
- [ ] Item de enums apurado com numero, ou a Task 35.7 reduzida ao item da `message`.

---

## Task 35.1 - Validar `LockoutProperties` no boot

**Objetivo**: configuracao invalida derruba o boot em vez de degradar a jornada de conta bloqueada em
silencio.
**Pre-requisito**: Gate 35.0 aprovado.
**Esforco**: 0,3 dia.
**Arquivos esperados**: `LockoutProperties.java`, `RateLimitLockoutValidator.java` (ou anotacoes), +
teste.

### Step 035.1.1 - Escolher o mecanismo

Duas opcoes, decidir com criterio e registrar o porque:

- **Declarativa**: `@Validated` + `@Min(1)` nos tres campos. Mais simples, e a preferida **se** o
  relaxed binding continuar enxergado (`APP_LOCKOUT_WINDOW_MINUTES` -> `windowMinutes`).
- **Imperativa**: estender o `RateLimitLockoutValidator`, que ja le pelo `Binder` e ja documenta em
  `:52` por que `Binder` e nao `environment.getProperty`.

Nao criar um **terceiro** mecanismo.

### Step 035.1.2 - Registrar o acoplamento no codigo

O motivo de os tres campos precisarem ser positivos **nao esta neste repo**: e o `ehUtilizavel` do
`sep-app` (`politica-lockout.service.ts:45-52`), que trata a politica como tudo-ou-nada. Sem essa nota
o proximo leitor relaxa a validacao por parecer excessiva.

### Step 035.1.3 - Testes

- Boot **falha** com `windowMinutes = 0`; idem para os outros dois campos.
- Boot **passa** com os defaults.
- Se o mecanismo for imperativo: um teste com env var em formato relaxed, provando que o `Binder`
  enxerga — a Sprint 34 fixou isso porque a leitura ingenua nao ve.

**Mutacao obrigatoria**: relaxar o limite de `1` para `0` — o primeiro teste deve falhar.

### Verificacao da Task 35.1

```bash
./gradlew test; echo "EXIT=$?"
./gradlew spotlessCheck; echo "EXIT=$?"
```

### Definicao de pronto da Task 35.1

- [ ] Boot falha para cada um dos tres campos invalidos, com teste por campo.
- [ ] Relaxed binding coberto (se imperativo).
- [ ] Mutacao aplicada, vista falhar, revertida.
- [ ] O acoplamento com o web registrado no codigo.

### Commit sugerido

```text
feat(identity): validar a politica de lockout no boot
```

---

## Task 35.2 - `forward-headers-strategy: native` com allowlist de proxy

**Objetivo**: a origem usada pelo rate limit deixa de ser escolhida pelo cliente.
**Pre-requisito**: Task 35.1 concluida e aprovada.
**Esforco**: 0,5 dia.
**Arquivos esperados**: `application.yml`, + teste.

> **Atencao — mudanca de comportamento de borda.** Esta Task altera como o servidor enxerga a origem
> de **toda** request. Um `internal-proxies` largo demais mantem o bypass do rate limit; estreito
> demais faz todos compartilharem o IP do balanceador e o limite vira global. Os dois lados precisam
> de teste antes do checkpoint.

### Step 035.2.1 - Trocar a estrategia **e** declarar o allowlist

`application.yml:66` — `forward-headers-strategy: native`, **junto** com
`server.tomcat.remoteip.internal-proxies`. Os dois na mesma mudanca: `internal-proxies` e do
`RemoteIpValve` do Tomcat e so tem efeito com `native`; trocar so a estrategia piora.

O valor entra **parametrizado por ambiente** com default seguro — o CIDR do balanceador real nao existe
ate a Fase 5 (Frente B, gated por conta AWS).

### Step 035.2.2 - Testes dos dois lados

- `X-Forwarded-For` vindo de origem **dentro** do allowlist: e respeitado.
- `X-Forwarded-For` vindo de origem **fora**: e **ignorado**, e o rate limit usa a origem real.

Um teste so do caminho feliz **nao verifica nada** — foi exatamente o padrao que a Sprint 34 pegou em
dois testes que passavam provando nada.

**Mutacao obrigatoria**: remover o `internal-proxies` mantendo `native` — o segundo teste deve falhar.

### Step 035.2.3 - Registrar o gate pendente

A validacao contra balanceador real e **impossivel aqui**. Declarar como pendencia no PR description,
no padrao da F-23 — nao simular.

### Verificacao da Task 35.2

```bash
./gradlew test; echo "EXIT=$?"
./gradlew clean build; echo "EXIT=$?"
```

### Definicao de pronto da Task 35.2

- [ ] Os dois testes existem e passam; a mutacao derruba o de fora do allowlist.
- [ ] `native` e `internal-proxies` mudaram **juntos** (`git diff` prova).
- [ ] Valor parametrizado por ambiente, com default seguro.
- [ ] Gate pendente do balanceador real declarado.

### Commit sugerido

```text
fix(security): restringir X-Forwarded-For ao allowlist de proxy
```

---

## Task 35.3 - `HttpRequestMethodNotSupportedException`

**Objetivo**: metodo nao suportado devolve `405` com o corpo de erro padronizado, e nao `500`.
**Pre-requisito**: Task 35.2 concluida e aprovada.
**Esforco**: 0,2 dia.
**Arquivos esperados**: `shared/exception/ApiExceptionHandler.java`, + teste.

### Step 035.3.1 - Handler

Acrescentar no arquivo, seguindo o padrao dos vizinhos (`:93` `NoHandlerFoundException`, `:98`
`NoResourceFoundException`), que sao os mais proximos em natureza. Mesma forma de `ErrorResponseDto`,
mesmo tratamento de `path` e `correlationId`.

Posicao no arquivo: junto dos handlers de roteamento, **nao** no fim — vale a metafora do jornal
(`clean-code`), conceitos afins ficam proximos verticalmente.

### Step 035.3.2 - Teste

`PUT` numa rota que so aceita `POST` -> `405`, com corpo padronizado.

**Mutacao obrigatoria**: remover o handler — o teste deve voltar a ver `500`.

### Verificacao da Task 35.3

```bash
./gradlew test; echo "EXIT=$?"
```

### Definicao de pronto da Task 35.3

- [ ] `405` com corpo padronizado, coberto por teste.
- [ ] Mutacao aplicada, vista falhar, revertida.
- [ ] Handler posicionado junto dos de roteamento.

### Commit sugerido

```text
fix(shared): mapear HttpRequestMethodNotSupportedException para 405
```

---

## Task 35.4 - Remover o rate limiter morto

**Objetivo**: a configuracao para de sugerir um controle que nao existe.
**Pre-requisito**: Task 35.3 concluida e aprovada.
**Esforco**: 0,1 dia.
**Arquivos esperados**: `application.yml`.

### Step 035.4.1 - Provar que esta morto antes de remover

`grep` por `RateLimiter`, `@RateLimiter` e `RateLimiterRegistry` em `src/main`. Se houver **qualquer**
consumidor, a Task cai e o item volta ao backlog com a evidencia.

### Step 035.4.2 - Remover

`application.yml:372-377`. Conferir se o bloco `resilience4j` pai continua tendo outros filhos
(circuit breaker, retry, timeout) — remover o pai junto seria remover configuracao viva.

### Verificacao da Task 35.4

```bash
./gradlew clean build; echo "EXIT=$?"       # contagem de testes INALTERADA
```

### Definicao de pronto da Task 35.4

- [ ] `grep` no checkpoint provando ausencia de consumidor.
- [ ] Bloco pai `resilience4j` preservado com os filhos vivos.
- [ ] Contagem de testes inalterada.

### Commit sugerido

```text
chore(config): remover configuracao de rate limiter sem consumidor
```

---

## Task 35.5 - Remover codigo morto

**Objetivo**: menos superficie que parece contrato e nao e.
**Pre-requisito**: Task 35.4 concluida e aprovada.
**Esforco**: 0,2 dia.
**Arquivos esperados**: `ContaBloqueadaException.java`, `LoginAttemptRepository.java`,
`LoginAttemptRepositoryTest.java`.

### Step 035.5.1 - `ContaBloqueadaException.CODIGO` e `getCodigo()`

Remover `:13` e `:36-38`. **Antes**, `grep` por `CODIGO` e `getCodigo` em `src/main` **e** `src/test`.
Se o `ApiExceptionHandler` usar o codigo no corpo do `423`, o item cai — ai nao e morto.

### Step 035.5.2 - `countByIpAndJanela`

Remover `LoginAttemptRepository.java:41` e o teste que so a exercita (`LoginAttemptRepositoryTest:58`).
Remover a query e manter o teste nao compila; manter os dois e manter uma query viva por um teste que
so a testa.

A contagem de testes **cai** aqui, e e o unico ponto da sprint onde isso e esperado. Registrar quanto,
para o fechamento nao parecer regressao.

### Verificacao da Task 35.5

```bash
./gradlew clean build; echo "EXIT=$?"
```

### Definicao de pronto da Task 35.5

- [ ] `grep` no checkpoint provando ausencia de consumidor para cada item removido.
- [ ] Queda de contagem de testes registrada com numero e razao.
- [ ] Se algum item tiver consumidor, ele **nao** foi removido e a evidencia esta no checkpoint.

### Commit sugerido

```text
chore(identity): remover codigo sem consumidor do lockout
```

---

## Task 35.6 - `Clock` injetavel e `MDC` por constante

**Objetivo**: transicao de bloqueio testavel sem relogio real; chave de MDC com uma origem.
**Pre-requisito**: Tasks 35.1 e 35.5 concluidas e aprovadas.
**Esforco**: 0,4 dia.
**Arquivos esperados**: `LockoutService.java`, `RateLimitFilter.java`, `JwtTokenProvider.java`,
`ParcelaAtrasouListener.java`, + testes.

### Step 035.6.1 - `Clock` no `LockoutService`

`:100` e `:144` usam `OffsetDateTime.now()`. Injetar `Clock` e usar `OffsetDateTime.now(clock)`, com
bean default de `Clock.systemUTC()` (ou o fuso que o repo ja adotar — conferir).

A Sprint 33 extraiu `PoliticaLockout` como value object puro justamente para testar decisao sem
relogio; esta Task fecha o outro lado.

### Step 035.6.2 - Teste que so o `Clock` viabiliza

Um teste que **nao era possivel antes**: transicao de bloqueio ao longo do tempo com relogio fixo.
Injetar `Clock` sem escrever esse teste e trocar acoplamento por cerimonia — o `coding-guidelines`
proibe abstracao sem uso.

### Step 035.6.3 - Os quatro `MDC.get`

`CorrelationIdFilter.java:31` ja expoe `MDC_KEY`. Trocar o literal nos **quatro** call sites:
`RateLimitFilter.java:188`, `JwtTokenProvider.java:76` e `:100`, `ParcelaAtrasouListener.java:76`.

`grep` final por `MDC.get("` deve sair vazio em `src/main`.

### Verificacao da Task 35.6

```bash
./gradlew test; echo "EXIT=$?"
./gradlew clean build; echo "EXIT=$?"
grep -rn 'MDC.get("' src/main/java   # esperado: nenhuma saida
```

### Definicao de pronto da Task 35.6

- [ ] `Clock` injetado e **usado por um teste novo** que antes era impossivel.
- [ ] Zero literais `"correlationId"` em `src/main` (o `grep` prova).
- [ ] Mutacao no teste de relogio aplicada, vista falhar, revertida.

### Commit sugerido

```text
refactor(identity): injetar Clock no LockoutService e usar MDC_KEY nos call sites
```

---

## Task 35.7 - Contrato: enums e a `message` do `423`

**Objetivo**: fechar os dois itens de contrato, ou registrar a decisao de nao fechar.
**Pre-requisito**: Task 35.6 concluida e aprovada, e o Step 035.0.4 apurado.
**Esforco**: 0,3 dia.
**Arquivos esperados**: conforme o apurado no Gate; possivelmente
`ContaBloqueadaException.java` e configuracao do springdoc.

### Step 035.7.1 - Enums por `$ref`

**Só se o Gate confirmou o problema e mediu quantos sao.** O item entrou como *registrado pela Sprint
34, nao verificado*; nao desenhar solucao antes da medicao.

Se confirmado, a mudanca e de configuracao do springdoc, nao de modelo de dominio. Verificacao: o
snapshot OpenAPI regenerado tem o enum uma vez em `components/schemas` e `$ref` nos usos.

**Efeito colateral obrigatorio de conferir**: mudar a forma dos enums no OpenAPI **muda o snapshot que
o `contract:check` do `sep-app` valida**. Se a F-Sprint 24 ja fechou as lacunas la, esta Task pode
reabrir uma. Medir antes e registrar; se reabrir, o gate de contrato do `sep-app` entra no fechamento
desta sprint, como a Sprint 34 fez com os PRs #120/#121.

### Step 035.7.2 - A `message` do `423`

Decidir e registrar. Os dados:

- `ContaBloqueadaException.java:28` monta a mensagem com `lockoutMinutes` (politica **configurada**);
- `:32-34` `getTempoRestante()` carrega o **restante real**, que o `Retry-After` emite desde a 34;
- `:18-26` documenta a divergencia como **deliberada**, com o raciocinio de tipo que evita
  `"Tente novamente em 1800 minutos"`;
- a **F-23 ja resolveu isso no web**: o header ganha do corpo.

Dois desfechos legitimos: alinhar a mensagem ao restante real, ou **registrar a divergencia como
definitiva** com o porque, atualizando o docblock. O que nao vale e sair sem decisao.

Se alinhar: o web ja prefere o header, entao mudar a mensagem **nao muda a tela** — o valor esta em
consumidores que so leem o corpo (mobile, integracoes). Registrar isso, senao a mudanca parece
inconsequente e sera revertida no proximo review.

### Verificacao da Task 35.7

```bash
./gradlew clean build; echo "EXIT=$?"
./gradlew spotlessCheck; echo "EXIT=$?"
```

Se houve mudanca de OpenAPI: regenerar o snapshot em perfil `dev` e rodar `contract:check` no
`sep-app` contra ele.

### Definicao de pronto da Task 35.7

- [ ] Enums: fechados **ou** registrados com a medicao do Gate e o motivo de nao fechar.
- [ ] `message` do `423`: decidida, com o porque no docblock.
- [ ] Impacto no snapshot do `sep-app` medido e registrado (mesmo que nulo).

### Commit sugerido

```text
chore(contracts): publicar enums por $ref e alinhar a mensagem do 423
```

---

## Fechamento

### Gates completos

Rodar **depois** dos commits, capturando `EXIT=$?`:

```bash
./gradlew clean build       # esperado: >= 2220 testes menos a queda registrada na 35.5, 0 falhas
./gradlew spotlessCheck
```

Citar: contagem final vs baseline do Gate, com a queda da 35.5 explicada; numero de mutacoes aplicadas
e revertidas.

### Documentacao

- `repos/sep-api/SPRINT-35-PR.md`, no formato dos anteriores (regra fixa do
  [`AGENT.md`](../../AGENT.md) §Git e checkpoints). Apagar o(s) `SPRINT-*-PR.md` da sprint anterior ao
  **iniciar** esta.
- `STATE.md` sobrescrito e entrada apendada em `CONTEXT-PARTE-2.md`.
- Linha de status em [`specs/fase-4/README.md`](../../specs/fase-4/README.md).
- Se a 35.7 mudou o OpenAPI: gate de contrato no `sep-app`, no padrao dos PRs #120/#121 da Sprint 34.

### Riscos a declarar como pendencia, nao simular

- **A 35.2 nao e validavel contra balanceador real** — o CIDR nao existe ate a Fase 5 (Frente B, conta
  AWS). Default seguro + parametrizacao, com a validacao real declarada.
- **Back-merge**: a Sprint 34 teve incidente (`4a02fc1` duplicou `falhasRecentes(int, Duration)` em
  `LockoutServiceTest` e quebrou `compileTestJava`). O squash entrou correto; foi o back-merge, por
  resolucao manual. Conferir a arvore de `develop` byte-identica a da branch verificada, e nao so o
  CI verde.
- Controle compensatorio contra brute force lento: **exige ADR**, segue aberto por decisao.
