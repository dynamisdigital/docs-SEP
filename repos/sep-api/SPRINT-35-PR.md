# Sprint 35 — Divida de configuracao, lockout e contrato

Fecha os follow-ups tecnicos que as Sprints 33 e 34 registraram, deixando no backlog
apenas o que exige ADR. **Sprint de divida: sem tela, endpoint, DTO, migration ou regra
de negocio nova.**

- Spec: [`035`](../../specs/fase-4/035-sprint-35-divida-config-lockout-contrato.md)
- Steps: [`035`](../../steps-fase-4/backend/035-sprint-35-steps.md)
- Base: `fd4b4b1` (Sprint 34) · Sem migration · Sem ADR · Sem estado novo

## Resultado

**MERGEADA develop+main em 2026-09-02** — PR **#105** (squash `23004b9`) em `develop`,
back-merge `17bd72d`, e PR **#106** (`8cabf2c`) em `main`. Conferido **por conteudo**, e nao
por titulo: `develop` == `main` com diff vazio, e a arvore de `origin/develop` **byte-identica**
a da branch que passou nos gates — inclusive **depois** do back-merge, que e onde a Sprint 34
quebrou (`4a02fc1` duplicou um helper e derrubou o `compileTestJava` com o squash correto).

| Gate | Resultado |
|---|---|
| `./gradlew clean build` | 2262 testes / 0 falhas / 363 classes |
| `./gradlew spotlessCheck` | verde |
| `contract:check` do `sep-app` | 85 operacoes / 0 lacunas |

Partida do Gate 35.0: **2220 / 355**. Delta **+42 testes / +8 classes**, com **uma queda de −1**
na Task 35.5, esperada e registrada. 16 commits.

**46 mutacoes** aplicadas e revertidas. **Cinco sobreviveram** — e sao o resultado que importa,
porque cada uma virou trabalho que nao estava no plano.

## O que entrou

### Validacao de `LockoutProperties` no boot (35.1)

`@Validated` + `@Min(1)` nos tres campos. Declarativo, e nao um segundo validador imperativo:
`@Validated` roda **depois** do bind, entao ja enxerga o relaxed binding — o problema que forcou o
`Binder` no `RateLimitLockoutValidator` nao existe aqui.

O motivo de os tres serem positivos **nao esta neste repo**: e o `ehUtilizavel` do `sep-app`
(`politica-lockout.service.ts`), que trata a politica como tudo-ou-nada. Registrado no javadoc.

### Allowlist de proxy (35.2) — a Task que saiu do escopo previsto

`forward-headers-strategy` de `framework` para `native`, com `server.tomcat.remoteip.internal-proxies`
na **mesma** mudanca e default que **nao confia em ninguem** (`${APP_TRUSTED_PROXIES:}`).

**Os steps escopavam esta Task em `application.yml` + teste. Nao bastava.** Apliquei so a config,
rodei os dois testes exigidos, e o de fora do allowlist reprovou com o valor forjado
`203.0.113.7` chegando em `login_attempt.ip`. Causa: o `RemoteIpValve` **ignora** o header para peer
nao confiavel mas **nao o remove**, e o `RateLimitFilter.extrairIp` lia o header direto. O javadoc
daquele metodo afirmava que fechar o bypass era "mudanca de configuracao, nao de codigo"; era das
duas.

O corte de tamanho saiu para `shared/web/OrigemDaRequest` ao ganhar segundo consumidor — o
`ContratoController`, cujo valor termina em `audit_log_seguranca.ip` (`VARCHAR(45)`) por listener
`AFTER_COMMIT`. `ProxyAllowlistValidator` derruba o boot em `prod` com allowlist vazio, porque atras
de balanceador o app subiria normalmente e degradaria em silencio: rate limit por IP colapsando no IP
do balanceador, HSTS deixando de ser emitido e o OpenAPI anunciando a origem interna.

### `405` para metodo nao suportado (35.3)

Verbo errado caia no `@ExceptionHandler(Exception.class)` e virava **500** — servidor anunciando
falha propria para erro de cliente, com "Consulte o suporte com o traceId" para quem so precisava
trocar o verbo. Medido na mutacao: sem o handler a resposta e 500 e sem `Allow`.

Emite `Allow` (RFC 9110 §15.5.6). **Nao** entra em `app.cors.exposed-headers`, pelo motivo que nao
envelhece: o corpo ja carrega a mesma lista em `message`.

Alcance medido: os `permitAll` de `/api/v1/**` fixam o metodo, entao verbo errado em rota publica
para em **401** antes do dispatcher — o `405` so e observavel nos matchers que nao fixam metodo.

### Configuracao e codigo morto (35.4, 35.5)

`resilience4j.ratelimiter.configs.default` removido: zero `@RateLimiter`, zero `RateLimiterRegistry`
injetado (a unica ocorrencia do nome esta **dentro de um javadoc**). O `RateLimitFilter` usa
`RateLimiter.of`, a fabrica estatica, sem registry.

`countByIpAndJanela` removida com o teste que so a exercitava. **A outra metade da Task foi
CANCELADA**: a Spec 036 §Conflito preserva `ContaBloqueadaException.CODIGO`, porque a Sprint 36 lhe
da consumidor. A constante ganhou nota explicando por que existe sem consumidor, e um teste que lhe
da um de verdade — comentario persuade, teste reprova o build.

**Criterio de remocao que fica**: sem consumidor **e** sem spec publicada que lhe de um. So o
primeiro nao basta.

### `Clock` injetavel e MDC por constante (35.6)

`Clock` do `ClockConfig` ja existente (`America/Sao_Paulo`, nao UTC). O teste novo faz o **mesmo**
historico de falhas atravessar o fim do bloqueio movendo so o relogio — antes so havia esperar 30
minutos ou reescrever o historico, que testa a aritmetica do teste e nao a do service. Dois testes
que cercavam `now()` com `isBetween` viraram igualdade exata.

**Os steps previam 4 literais de MDC; o fenomeno era de 10** — os outros seis sao `idempotencyKey`,
mais duas constantes privadas duplicando a canonica. E `idempotencyKey` **nao e campo de log**: e o
valor do header `Idempotency-Key` de saida. Deriva ali desativa idempotencia em chamada de dinheiro
na Celcoin, sem lacuna de log e sem erro.

**E isso ainda nao bastava.** A mutacao mostrou que trocar o valor de `MDC_KEY` passava a suite
inteira, porque o literal restante estava **fora do Java**: `logback-spring.xml`, em dois lugares.
Renomear apagaria o campo do log estruturado em silencio. Dois testes novos pinam a constante contra
o que o Logback consome.

### Contrato: enums por `$ref` e a `message` do `423` (35.7)

88 ocorrencias inline viram **43 schemas nomeados**, 1 inline residual. `contract:check` do `sep-app`
passa **identico** contra os dois documentos — ele dereferencia `$ref` antes de comparar, entao forma
de enum e invisivel ao gate. **Isso contradisse minha propria recomendacao**, que era nao fechar por
raio de alcance.

A `message` do `423` passa a anunciar o tempo **restante**. A frase nao enuncia politica, ela manda
esperar: "Tente novamente em 30 minutos" com 2 restantes pede espera 15x maior. Com um numero so,
`lockoutMinutes` saiu do construtor e o risco de tipo que motivava o par deixou de existir.

### `400` de path variable no contrato (35.8)

`OperationCustomizer`, e nao 31 anotacoes: a regra deriva do **handler**, entao endpoint novo com
identificador tipado no path nasce declarado. Anotar uma a uma deixaria o contrato certo hoje e
errado no proximo endpoint — que e como as 31 apareceram.

**Perimetro: 31 operacoes sem `400` antes, ZERO depois.** Declaracao escrita a mao nao e
sobrescrita. Desbloqueia a **F-24.5** no `sep-app`.

## Dois achados BLOQUEANTES do code review, e um erro no conserto

O review da 35.7 achou que o bean de `ModelResolver` entrou **sem `openapi31`**. O springdoc emite o
documento em 3.1 e substitui o resolver dele pelo nosso; um resolver em modo 3.0 dentro de um
documento 3.1 **apaga em silencio** tudo que o 3.0 proibe como irmao de `$ref`. Medido: **21
`description` e 17 `example` perdidos**, e **oito deles em propriedades que documentavam nulidade**
e nada tinham a ver com enum.

A correcao nao e configurar melhor o resolver — e **nao substitui-lo**. `enumsAsRef` e lido em
`shouldResolveEnumAsRef`, durante a resolucao e nao na construcao, entao um `@PostConstruct` basta.

Segundo bloqueante: a nota que justificava alinhar a mensagem do `423` dizia que **nenhum consumidor
a exibe**. Falso — `verify-totp.component.ts:81` mostra o corpo verbatim e nem le o `Retry-After`.
Alinhar **melhorou uma tela em producao**, e o registro dizia o contrario.

**Erro proprio no conserto, registrado porque a licao vale mais que o defeito**: a edicao que
corrigia o B1 **apagou o bean `sepOpenAPI()`**, e o `components.securitySchemes` sumiu junto com o
botao Authorize da Swagger UI. O teste `apiDocsExpoeSchemasESecurity` acusou exatamente isso, e a
causa foi atribuida ao `openapi31` — tres documentos gerados para "isolar" antes de contar os
`@Bean` do arquivo. Teste vermelho e evidencia, nao ponto de partida para uma teoria.

## Verificacao por mutacao

46 aplicadas e revertidas. As cinco que **sobreviveram** e viraram trabalho:

| Mutacao | O que revelou |
|---|---|
| `@Column(nullable = false)` em `usuario_id` | inerte com `ddl-auto: validate` — quem morde e `@NotNull`; o javadoc do teste passou a dizer qual mutacao mata |
| `MDC_KEY` trocado | suite inteira verde: o literal restante estava no `logback-spring.xml` |
| `enumsAsRef` sem `openapi31` | 21 descriptions perdidas passavam verde; o pino novo ancora em `$ref` de **objeto**, nao de enum |
| `@Column(nullable=false)` (2a via) | idem acima |
| `contains("%X{" + MDC_KEY)` | casava `%X{correlationId:-}` por **prefixo**; fechado com o `:-}` inteiro |

## Fora de escopo, por decisao

- **`405` nao declarado em operacao nenhuma** — lacuna **deliberada**. Vale para todas as 106
  operacoes, e nenhum consumidor ramifica por 405: e defeito de integracao, nao fluxo.
- **Literais de MDC em `src/test`** ficam. Sao eles que fazem a mudanca da constante ser detectada;
  converte-los tornaria a asserção tautologica.
- **Relogio do lado da escrita** (`LoginAttempt.registrar`, `AuditLogSeguranca.de`) — 1 e 6 call
  sites. Enquanto nao unificar, **IT de expiracao de lockout e impossivel**.

## Follow-ups abertos

1. **`415`/`406` caem em 500 em rota publica** — `POST /auth/login` com `Content-Type: text/plain`
   devolve 500 e loga `ERROR unhandled_exception`. Mesma classe do defeito que a 35.3 fechou.
2. **Suite backend nao e hermetica** — usa o `sep_dev` compartilhado; residuo produz ~90 falsos
   vermelhos, medido no Gate 35.0.
3. **`idx_login_attempt_ip_data` sem leitor** desde a remocao de `countByIpAndJanela`. Schema ficou
   fora do escopo da sprint por decisao da spec.
4. **`DEFAULT NOW()` morto** em `login_attempt.data_tentativa`: inalcancavel porque a coluna e
   `nullable = false` e a factory sempre popula.
5. **Snapshot OpenAPI do `sep-app` a renovar** — `contract:check` verde contra o documento novo, e
   fidelidade e nao gate. Padrao dos PRs #120/#121.
6. **`CONTA_BLOQUEADA_FALLBACK`** (`sep-app/copy-de-erro.ts`) embute "30 minutos" fixo, agora
   divergindo mais.
7. **ADR 0010 §65-66 esta errado** — diz "5 tentativas/min/IP" no login e "5/min/**usuario**" no
   TOTP; sao **10** e por **IP** desde a Sprint 33. ADR prevalece sobre spec e steps, entao este
   erra com o maior peso.

## Riscos declarados, nao simulados

- **A 35.2 nao e validavel contra balanceador real** — o CIDR nao existe ate a Fase 5 (Frente B,
  conta AWS). Default seguro + parametrizacao entregues; o casamento com o CIDR real segue sem prova.
- **Mudanca de borda alem do rate limit**: `native` + allowlist vazio tambem faz `X-Forwarded-Proto`
  deixar de ser honrado. Inerte sem balanceador; na Fase 5, `APP_TRUSTED_PROXIES` precisa ser setado
  **junto** com o LB — e o `ProxyAllowlistValidator` passa a exigir isso no boot de `prod`.
