# Steps - Sprint 35 - Divida de configuracao, lockout e contrato

**Spec de origem**: [`035-sprint-35-divida-config-lockout-contrato.md`](../../specs/fase-4/035-sprint-35-divida-config-lockout-contrato.md)

**Status**: **CONCLUIDA e MERGEADA develop+main em 2026-09-02** (PR #105 squash `23004b9` / #106
`8cabf2c`). As 8 Tasks executadas; 2262 testes / 0 falhas / 363 classes; 46 mutacoes, **cinco
sobreviveram**. Descricao em [`SPRINT-35-PR.md`](../../repos/sep-api/SPRINT-35-PR.md); historico em
[`CONTEXT-PARTE-2.md`](../../docs-sep/CONTEXT-PARTE-2.md) §Sprint 35.

**O que este documento errou, para o proximo planejamento** — as duas vezes o teste mostrou antes do
codigo:

1. **Task 35.2 escopada em `application.yml` + teste.** Nao bastava: o `RemoteIpValve` **ignora** o
   `X-Forwarded-For` do peer nao confiavel mas **nao o remove**, e o `RateLimitFilter.extrairIp` lia o
   header direto. A config sozinha deixava o valor forjado chegar em `login_attempt.ip`.
2. **Step 035.6.3 previa 4 literais de MDC e mandava o `grep 'MDC.get("'` sair vazio.** Eram **10** —
   os outros seis sao `idempotencyKey` —, entao o proprio comando de aceite era impossivel de
   satisfazer fechando so os 4 nomeados. E nem os 10 bastavam: o literal restante estava **fora do
   Java**, no `logback-spring.xml`.

Alem disso, a **contagem de `@ExceptionHandler` estava errada** (dizia 17, eram 16; a Task 35.3 fez
17) e a Task **35.8** nao existia nesta spec — veio do `STATE.md`, aberta pela F-Sprint 24.

**Revisao de 2026-09-02** — tres pontos envelheceram entre a criacao e hoje, todos medidos antes de
alterar este arquivo:

1. **Pre-requisito**: o checkout do `sep-api` foi conferido e **ja esta sincronizado**; o texto
   anterior descrevia um estado que nao existe mais. Ver §Pre-requisitos.
2. **Task 35.5 perdeu metade**: a Spec [`036`](../../specs/fase-4/036-sprint-36-codigos-erro-no-fio.md)
   §Conflito **cancelou** a remocao de `ContaBloqueadaException.CODIGO` — a 36 lhe da consumidor. Resta
   a metade do `countByIpAndJanela`.
3. **Task 35.8 nova**: o `400` alcancavel por `@PathVariable UUID` malformado nao esta declarado no
   `@ApiResponses` do endpoint de webhook, o que impede a F-24.5 de declarar o status. A medicao
   mostrou que **nao e um endpoint so** — ver a Task.

**Sprint irma**: nenhuma. E a **terceira** das tres sprints de divida planejadas em 2026-08-05:
[`D-1`](../cross-repo/300-dsprint-1-steps.md) -> [`F-24`](../web/124-fsprint-24-steps.md) -> `35`.
**Independente da F-24** — nenhuma das duas consome contrato novo da outra.

**Objetivo geral**: fechar os follow-ups tecnicos que as Sprints 33 e 34 registraram, deixando no
backlog apenas o que exige ADR.

**Esforco total estimado**: 2 dias de Dev Pleno Backend. A revisao de 2026-09-02 mexe pouco no total —
a 35.5 caiu de 0,2 para 0,1 dia e a 35.8 nova pede 0,2 —, **desde que o perimetro do `400` continue
minimo**. Se o Step 035.0.5 achar perimetro grande, e a 35.8 que se recorta, nao o prazo que estica.

**Repos de destino**:

- `sep-api`: `src/main/resources/application.yml`,
  `identity/infrastructure/security/LockoutProperties.java`,
  `identity/infrastructure/security/RateLimitFilter.java`,
  `identity/application/service/LockoutService.java`,
  `identity/application/exception/ContaBloqueadaException.java` (**so a 35.7**; a 35.5 nao toca mais —
  ver Step 035.5.1),
  `identity/infrastructure/persistence/LoginAttemptRepository.java`,
  `identity/infrastructure/security/JwtTokenProvider.java` e
  `cobranca/application/listener/ParcelaAtrasouListener.java` (**35.6**; estavam ausentes desta lista e
  nomeados na Task),
  `backoffice/web/controller/BackofficeReprocessoController.java` (**35.8**),
  `shared/exception/ApiExceptionHandler.java`, + testes.
- `docs-SEP`: este step, a spec 035, indices e PR description; **Git manual**.

**Branch sugerida**: `feature/sprint-35-divida-config-lockout`, criada de `develop` atualizado.

**Pre-requisitos**: nenhum externo.

**Checkout medido em 2026-09-02** (o registro anterior, de 2026-08-05, dizia que o repo estava em
`fix/lockout-service-test-helper-duplicado` e que o checkout local estava seis PRs atras — **as duas
coisas deixaram de valer**):

```text
HEAD          = 550fed3   (== origin/main; ahead/behind 0 0)
origin/develop = fd4b4b1
git diff --stat origin/develop origin/main  -> vazio  (develop == main por conteudo)
git status --porcelain                      -> vazio  (0 untracked, 0 modificado)
```

O checkout ativo esta em `main`. Falta apenas `git switch develop` antes de cortar a branch — e isso
e o Step 035.0.1, nao um pre-requisito. **Ainda assim, o Gate re-mede**: este bloco e um registro
datado, nao dispensa a conferencia.

**Skills obrigatorias durante a implementacao**: `coding-guidelines`, `clean-code`,
`design-patterns-java`.

---

## Estado atual verificado (2026-08-05; revisto em 2026-09-02)

Levantado antes de planejar. Qualquer divergencia encontrada no Gate 35.0 invalida o desenho abaixo.

Os blocos abaixo sao de **2026-08-05**, salvo onde a data estiver dita. A revisao de 2026-09-02
reconferiu na fonte apenas os pontos que mudou (`ContaBloqueadaException`, o `ApiExceptionHandler` e o
`BackofficeReprocessoController`) — **os demais nao foram re-medidos**, e continuam sendo o que o Step
035.0.3 confere antes de qualquer codigo.

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

- ~~`ContaBloqueadaException.java:13` — `public static final String CODIGO = "AUTH-423-001"`;
  `:36-38` — `getCodigo()`.~~ **CANCELADO em 2026-09-02 pela Spec 036** (ver §Conflito da 036, e a
  Task 35.5 abaixo). O levantamento estava correto no fato — nao havia consumidor em 2026-08-05, e
  reconferido em 2026-09-02 as ancoras `:13` e `:36-38` seguem exatas — mas a conclusao "remover"
  caducou: a Sprint 36 publica `AUTH-423-001` no corpo do `423` e **precisa** da constante e do getter.
  Codigo sem consumidor **hoje** nao e o mesmo que codigo morto, quando ha spec publicada que lhe da
  consumidor.
- `LoginAttemptRepository.java:41` — `countByIpAndJanela(...)`. Unico chamador:
  `LoginAttemptRepositoryTest:58`. **Segue valendo** — nenhuma spec publicada lhe da consumidor.

### Contrato: o `400` nao declarado (medido em 2026-09-02, item novo)

`ApiExceptionHandler.java:69-75` mapeia `MethodArgumentTypeMismatchException` para
`HttpStatus.BAD_REQUEST`. Consequencia: **todo** `@PathVariable UUID` alcancavel devolve `400` quando o
valor nao parseia — status real, produzido pelo handler, e nao hipotese.

`BackofficeReprocessoController.java:56-61` (endpoint de webhook) declara `201`/`401`/`403`/`429` e
**nao** declara o `400`. O endpoint **irmao, no mesmo arquivo**, declara: `:78-84` traz
`@ApiResponse(responseCode = "400", description = "tipoChamada nao suportado.")`. A assimetria esta
dentro de uma classe de 2 endpoints.

**O perimetro real e maior que o STATE registra.** Varredura de `src/main/java/**/*Controller.java`:
**19 arquivos** contem `@PathVariable UUID`, e tres nao declaram `400` em lugar nenhum do arquivo —
`EmpresaCredoraOportunidadeController` (4 path vars / 0), `PixRecebimentoController` (2 / 0),
`EmpresaCredoraController` (1 / 0).

> **A contagem acima e por ARQUIVO, nao por operacao** — um `400` declarado numa operacao nao cobre a
> vizinha. O numero de **operacoes** com `400` alcancavel e nao declarado **nao foi medido**, e o Step
> 035.0.5 existe para medi-lo. Repetir aqui o erro que o `grep -rh 'CODIGO = "'` cometeu na Spec 036 —
> medir o nome e nao o fenomeno — custaria a mesma revisao.

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

7. **"Sem consumidor hoje" nao e "morto"** (decisao de 2026-09-02). A Spec 036 cancelou metade da
   35.5: `ContaBloqueadaException.CODIGO` nao tinha consumidor, e a 36 lhe da um. O `grep` do item 6
   mede o presente; **antes de remover, conferir tambem as specs publicadas** — hoje, as sete abertas
   pelo diagnostico de 2026-09-01. Esta e a unica adicao ao criterio de remocao, e vale para a 35.5 e
   para a 35.4.

8. **A 35.8 entra com perimetro declarado, nao com a promessa de fechar tudo.** O `400` nao declarado
   e sistemico (19 controllers com `@PathVariable UUID`), e a sprint e de divida com 2 dias de
   esforco. Fecha-se o que desbloqueia a **F-24.5** e o que o Gate provar barato; o resto sai como
   inventario numerado. **Perimetro e o mesmo instrumento que a Spec 036 adotou** quando a taxonomia
   se revelou maior que o medido — e pelo mesmo motivo.

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
| ~~`ContaBloqueadaException.CODIGO`~~ + `countByIpAndJanela` | 35.5 (**metade cancelada** pela Spec 036) |
| `Clock` injetavel + `MDC` por constante | 35.6 |
| Enums por `$ref` + `message` do `423` | 35.7 |
| **(fora da spec 035)** `400` nao declarado no `@ApiResponses` — desbloqueia a F-24.5 | 35.8 (**nova**, 2026-09-02) |
| Baseline, gates e limitacoes | Gate 35.0 e Fechamento |

**Nota de rastreabilidade**: a Task 35.8 **nao tem item correspondente na spec 035**, que e de
2026-08-05. Ela vem do §Proximo passo do [`STATE.md`](../../docs-sep/STATE.md) ("Entrada nova para a
35"), aberto pela **F-Sprint 24**. Ou a spec 035 ganha o item no mesmo ciclo desta sprint, ou a 35.8
sai daqui e vira follow-up — **decisao do Gate 35.0**, nao deste documento.

---

## Ordem de execucao

```text
Gate 35.0 (precheck + baseline)
  -> 35.1  validacao de LockoutProperties   [independente]
  -> 35.2  forward-headers + internal-proxies [independente; MAIOR RISCO — cedo, para o
                                               review manual ter margem]
  -> 35.3  HttpRequestMethodNotSupported     [independente]
  -> 35.4  remover resilience4j morto        [independente]
  -> 35.5  remover countByIpAndJanela        [independente; metade CANCELADA pela Spec 036]
  -> 35.6  Clock + MDC por constante         [DEPOIS da 35.1: as duas tocam a familia
                                              LockoutProperties/LockoutService]
  -> 35.7  contrato (enums + message do 423) [depende do que o Gate apurar sobre os enums
                                              e da decisao da 35.6 sobre o Clock]
  -> 35.8  400 no @ApiResponses              [POR ULTIMO: depende do perimetro medido no
                                              Step 035.0.5 e da 35.3, que muda quais status
                                              o handler produz]
Fechamento (gates completos + docs + PR description)
```

A 35.2 vem cedo **por risco, nao por dependencia**: e a unica que muda como o servidor enxerga a
origem de toda request, e review manual precoce vale mais que ordem tematica.

A 35.8 vem por ultimo por **dois** motivos, e nenhum e tematico: ela consome o perimetro que o Step
035.0.5 mede, e a **35.3 muda o conjunto de status que o handler produz** — declarar contrato antes
de o handler estar estavel e declarar contrato duas vezes.

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

Em **2026-09-02** o checkout foi medido limpo e sincronizado, em `main` (`550fed3` == `origin/main`),
com `develop` (`fd4b4b1`) **identico a `main` por conteudo** e zero untracked — ver §Pre-requisitos.
**Conferir mesmo assim, nao assumir**: esse registro tem data, e o STATE.md ja descreveu este mesmo
checkout como "seis PRs atras, 34 untracked" quando ele nao estava. Se `develop != main` por conteudo,
parar e reportar: a Sprint 34 teve incidente de back-merge (`4a02fc1` duplicou um helper e quebrou
`compileTestJava` no CI), e a invariante existe por causa disso.

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

### Step 035.0.5 - Medir o perimetro do `400` nao declarado (Task 35.8)

O levantamento de 2026-09-02 mediu **por arquivo**, o que **nao** responde a pergunta da Task. Medir
**por operacao**, contra o OpenAPI gerado no 035.0.4 — nao por `grep` no fonte:

1. No documento OpenAPI, listar as operacoes cujo `path` contem parametro tipado como UUID.
2. Dessas, listar as que **nao** declaram resposta `400`.
3. Confrontar com o handler: `ApiExceptionHandler.java:69-75`
   (`MethodArgumentTypeMismatchException` -> `BAD_REQUEST`) e conferir se o handler ainda esta la e
   ainda devolve 400 — a 35.3 mexe neste arquivo.

Sair com **tres numeros**: operacoes com UUID no path, quantas ja declaram `400`, quantas nao. O
numero de "nao declaram" e o **perimetro** que a 35.8 recorta; ele nao precisa ser fechado inteiro,
precisa ser **conhecido**.

> **Por que por operacao e nao por arquivo**: um `400` declarado numa operacao nao cobre a vizinha, e
> um arquivo pode ter `400` declarado em operacao **sem** path variable. Contar arquivos mede o nome
> do fenomeno, nao o fenomeno — foi assim que o `grep -rh 'CODIGO = "'` errou por 36 codigos e o erro
> atravessou o diagnostico e tres specs **porque vinha com comando anexo**.

**Confirmar tambem a assimetria interna**, que e o caso mais barato de provar: no mesmo
`BackofficeReprocessoController.java`, o endpoint de webhook (`:56-61`) nao declara `400` e o de
provider (`:78-84`) declara.

### Definicao de pronto do Gate 35.0

- [ ] Branch criada de `develop` atualizado; `develop == main` por conteudo.
- [ ] Baseline anotada (total de testes, `clean build`, `spotlessCheck`).
- [ ] Os pontos do 035.0.3 conferidos, ou a divergencia reportada antes de qualquer codigo.
- [ ] Item de enums apurado com numero, ou a Task 35.7 reduzida ao item da `message`.
- [ ] Perimetro do `400` medido **por operacao**, com os tres numeros do 035.0.5.
- [ ] Cancelamento da metade `CODIGO` da 35.5 reconferido contra a Spec 036 §Conflito — se a 036
      tiver mudado de encaminhamento, e a 35.5 que muda, nao a 036.
- [ ] Decidido se a **35.8 fica nesta sprint** ou vira follow-up, e se a spec 035 ganha o item
      (ver §Nota de rastreabilidade).

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

## Task 35.5 - Remover `countByIpAndJanela` (metade da Task original)

**Objetivo**: menos superficie que parece contrato e nao e.
**Pre-requisito**: Task 35.4 concluida e aprovada.
**Esforco**: 0,1 dia (era 0,2; a metade cancelada levou metade do esforco).
**Arquivos esperados**: `LoginAttemptRepository.java`, `LoginAttemptRepositoryTest.java`.
**`ContaBloqueadaException.java` saiu da lista** — ver o Step 035.5.1.

### Step 035.5.1 - ~~`ContaBloqueadaException.CODIGO` e `getCodigo()`~~ — CANCELADO, registrar

**Nao remover.** A Spec [`036`](../../specs/fase-4/036-sprint-36-codigos-erro-no-fio.md) §Conflito
cancela esta metade explicitamente: a Sprint 36 publica `AUTH-423-001` no corpo do `423` (item 4 dos
criterios de aceite da 036, Task **36.4**), e sem o getter o `build()` do handler nao teria de onde
ler o codigo. Constante e getter **ficam**.

O trabalho desta Task passa a ser **registrar o cancelamento**, nao remover:

1. Confirmar no Gate que a Spec 036 mantem o encaminhamento (Step 035.0.5, ultimo item da definicao
   de pronto). Se a 036 tiver mudado, e **esta** Task que muda.
2. Anotar no `ContaBloqueadaException.java`, junto de `CODIGO`, **por que a constante existe sem
   consumidor em `src/main`** — que a Sprint 36 e quem a consome. Sem essa nota o proximo
   levantamento a classifica como morta de novo, que e exatamente o que aconteceu aqui.
3. Registrar no PR description que a metade caiu, com o motivo. Nao deixar a spec 035 §5 dizendo
   "remover" sem contraparte.

**Licao que fica** (§Decisoes item 7): "sem consumidor hoje" nao e "morto" quando ha spec publicada
que lhe da consumidor. O levantamento de 2026-08-05 estava **certo no fato** e errado na conclusao.

### Step 035.5.2 - `countByIpAndJanela` — esta sim, remover

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

- [ ] `grep` no checkpoint provando ausencia de consumidor de `countByIpAndJanela` em `src/main` e
      `src/test`, alem do teste que sai junto.
- [ ] Queda de contagem de testes registrada com numero e razao.
- [ ] `ContaBloqueadaException.CODIGO` e `getCodigo()` **intactos**, com a nota do 035.5.1 no arquivo.
- [ ] Cancelamento da metade registrado no PR description, com o ponteiro para a Spec 036 §Conflito.

### Commit sugerido

```text
chore(identity): remover query de login attempt sem consumidor
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

## Task 35.8 - Declarar o `400` alcancavel no `@ApiResponses` (nova, 2026-09-02)

**Objetivo**: o contrato publica um status que o servico ja devolve, para que o consumidor possa
ramificar por ele. Desbloqueia a **F-24.5**, que hoje nao pode declarar o status porque o OpenAPI nao
o traz.
**Pre-requisito**: Task 35.7 concluida e aprovada, **e** o Step 035.0.5 medido.
**Esforco**: 0,2 dia dentro do perimetro minimo; **reavaliar** se o Gate achar perimetro grande.
**Arquivos esperados**: `backoffice/web/controller/BackofficeReprocessoController.java`, mais os
controllers que o perimetro do Gate incluir, + teste.
**Origem**: nao esta na spec 035 — vem do §Proximo passo do `STATE.md`, aberto pela F-Sprint 24. Ver
§Nota de rastreabilidade.

> **Esta Task nao inventa comportamento: ela documenta o que ja existe.** `ApiExceptionHandler.java:69-75`
> ja devolve `400` para `@PathVariable` que nao parseia. Nenhum status novo, nenhum handler novo,
> nenhuma mudanca de runtime. Se algum step aqui exigir mudar comportamento, ele saiu do escopo —
> parar e reportar.

### Step 035.8.1 - Recortar o perimetro com o numero do Gate

Do resultado do Step 035.0.5, escolher **nesta ordem**:

1. **Obrigatorio** — `BackofficeReprocessoController.java:56-61` (endpoint de webhook). E o unico item
   que **desbloqueia outra sprint**; sem ele a Task cai por nao entregar o que a motivou.
2. **Barato e provado** — as operacoes que o Gate mediu sem `400` **e** cujo path tem parametro UUID,
   ate onde o esforco de 0,2 dia alcancar.
3. **Fora** — o resto, como **inventario numerado** no PR description.

O criterio de corte e explicito: **fechar tudo nao e objetivo desta Task**. O que nao vale e sair sem
saber o tamanho do que ficou.

### Step 035.8.2 - Declarar, copiando o vizinho que ja acerta

`BackofficeReprocessoController.java:78-84` (endpoint de provider) **ja declara** o `400`. Usar a mesma
forma e o mesmo lugar na lista de `@ApiResponse` — consistencia dentro do arquivo antes de
consistencia global.

A `description` descreve o que o usuario fez, nao o tipo Java: o `400` sai quando o identificador do
path nao e um UUID valido. `ApiExceptionHandler:73` monta
`"Path/query param '<nome>' invalido: nao eh <Tipo>"` — a descricao do contrato deve ser coerente com
essa mensagem, senao o consumidor le duas historias diferentes do mesmo status.

### Step 035.8.3 - Teste

Request ao endpoint de webhook com `webhookEventId` que nao parseia como UUID -> `400`, com corpo de
erro padronizado.

**Mutacao obrigatoria**: **duas**, porque sao duas afirmacoes distintas e uma so nao cobre a outra.

1. Remover o `@ApiResponse(responseCode = "400", ...)` recem-adicionado — a **verificacao de contrato**
   deve reprovar. Se nao houver verificacao que reprove, a declaracao nao esta coberta por nada e o
   teste do item 2 **nao a cobre**; registrar isso como limitacao em vez de fingir cobertura.
2. Remover o handler de `MethodArgumentTypeMismatchException` (`ApiExceptionHandler:69-75`) — o teste
   de runtime deve falhar. Reverter as duas.

> **Por que a mutacao 1 importa mais que a 2**: o defeito desta Task e de **contrato**, nao de runtime.
> Um teste que so exercita o `400` passa **hoje**, sem a Task, porque o `400` ja acontece — ele prova
> o handler, nao a declaracao. A Sprint 34 pegou dois testes exatamente assim, e a F-25 reescreveu
> tres pelo mesmo motivo.

### Step 035.8.4 - Registrar o efeito no `sep-app`

Acrescentar `400` ao OpenAPI **muda o snapshot que o `contract:check` do `sep-app` valida**. Mesma
mecanica do Step 035.7.1: medir antes, registrar o resultado mesmo que nulo, e se reabrir lacuna la, o
gate de contrato do `sep-app` entra no fechamento desta sprint, no padrao dos PRs #120/#121 da
Sprint 34.

Aqui ha um ganho, nao so um custo: a **F-24.5** esta bloqueada esperando este status. Nomear no PR
description que ela destrava.

### Verificacao da Task 35.8

```bash
./gradlew test; echo "EXIT=$?"
./gradlew clean build; echo "EXIT=$?"
./gradlew spotlessCheck; echo "EXIT=$?"
```

Regenerar o snapshot OpenAPI em perfil `dev` e rodar `contract:check` no `sep-app` contra ele.

### Definicao de pronto da Task 35.8

- [ ] `BackofficeReprocessoController.java:56-61` declara o `400`.
- [ ] Perimetro recortado com o numero do Gate, e o que ficou de fora esta **numerado** no PR
      description — nao descrito como "alguns casos".
- [ ] As **duas** mutacoes aplicadas, vistas falhar, revertidas — ou a limitacao da mutacao 1
      registrada, se nao houver verificacao de contrato que reprove.
- [ ] Impacto no snapshot do `sep-app` medido e registrado, mesmo que nulo.
- [ ] Nenhuma mudanca de comportamento de runtime no diff (`git diff` prova).

### Commit sugerido

```text
docs(api): declarar o 400 de path variable invalido no contrato de reprocesso
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
- `STATE.md` sobrescrito e entrada apendada em `CONTEXT-PARTE-2.md`. **Corrigir tambem o item 1 do
  §Proximo passo**, que manda sincronizar o checkout do `sep-api` — ele ja estava sincronizado em
  2026-09-02, e esse registro foi o quinto caso seguido de documento desmentido pelo repo.
- Linha de status em [`specs/fase-4/README.md`](../../specs/fase-4/README.md).
- **Spec 035**: o §5 ainda manda remover `ContaBloqueadaException.CODIGO`, e a 35.8 nao tem item la.
  Alinhar a spec ao que a sprint fez — ou registrar por que nao. Documento que sai da sprint dizendo o
  contrario do codigo e o defeito que esta revisao existiu para corrigir.
- Se a 35.7 **ou a 35.8** mudou o OpenAPI: gate de contrato no `sep-app`, no padrao dos PRs #120/#121
  da Sprint 34.

### Riscos a declarar como pendencia, nao simular

- **A 35.2 nao e validavel contra balanceador real** — o CIDR nao existe ate a Fase 5 (Frente B, conta
  AWS). Default seguro + parametrizacao, com a validacao real declarada.
- **Back-merge**: a Sprint 34 teve incidente (`4a02fc1` duplicou `falhasRecentes(int, Duration)` em
  `LockoutServiceTest` e quebrou `compileTestJava`). O squash entrou correto; foi o back-merge, por
  resolucao manual. Conferir a arvore de `develop` byte-identica a da branch verificada, e nao so o
  CI verde.
- Controle compensatorio contra brute force lento: **exige ADR**, segue aberto por decisao.
- **Perimetro do `400` (35.8)**: o que ficou fora sai como **inventario numerado**, com os tres numeros
  do Step 035.0.5. "Alguns endpoints ainda nao declaram" nao e registro — e a forma de o proximo
  levantamento ter de medir tudo de novo.
- **`ContaBloqueadaException.CODIGO` segue sem consumidor em `src/main` ate a Sprint 36 executar.**
  Isso e estado conhecido e aceito, nao pendencia — a nota do Step 035.5.1 no proprio arquivo existe
  para que a proxima varredura nao o classifique como morto pela terceira vez.

### O que esta revisao mudou, para o review manual conferir

| # | Onde | Antes | Depois |
|---|---|---|---|
| 1 | §Pre-requisitos, Step 035.0.1 | repo em `fix/lockout-service-test-helper-duplicado`, checkout atras | medido em 2026-09-02: `main` `550fed3`, limpo, `develop == main` |
| 2 | Task 35.5 | remove `CODIGO` **e** `countByIpAndJanela` | so `countByIpAndJanela`; `CODIGO` preservado e anotado (Spec 036 §Conflito) |
| 3 | Task 35.8, Step 035.0.5 | nao existiam | `400` declarado no contrato, com perimetro medido por operacao |

Nenhuma outra Task teve escopo alterado. As Tasks 35.1, 35.2, 35.3, 35.4, 35.6 e 35.7 estao como
foram escritas em 2026-08-05.
