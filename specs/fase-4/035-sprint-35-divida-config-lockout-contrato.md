# Spec 035 - Sprint 35 - Divida de configuracao, lockout e contrato

## Metadados

- **ID da Spec**: 035
- **Titulo**: Sprint 35 - Fechar os follow-ups tecnicos que as Sprints 33 e 34 deixaram registrados:
  allowlist de proxy, validacao de configuracao de lockout, handler de erro faltante e codigo morto
- **Status**: **planejada** (criada em 2026-08-05)
- **Fase do produto**: Fase 4 - correcao de divida; sem endpoint, DTO, evento, provider ou regra de
  negocio nova. **Sem migration prevista, sem ADR**
- **Trilha**: Backend (`sep-api`)
- **Origem**: follow-ups nomeados pelas Sprints [`033`](./033-sprint-33-lockout-conformidade.md) e
  [`034`](./034-sprint-34-followups-lockout-contrato.md), consolidados no item 6 do §Proximo passo do
  [`STATE.md`](../../docs-sep/STATE.md)
- **Depende de**: nada. Opera sobre codigo ja em `develop`+`main`. **Independente da
  F-Sprint 24** ([`124`](./124-fsprint-24-divida-tecnica-web.md)) — nenhuma das duas consome contrato
  novo da outra; a ordem D-1 -> F-24 -> 35 e de conveniencia, nao de dependencia
- **Desbloqueia**: nada. Reduz o backlog de follow-ups a itens que exigem ADR
- **Responsavel principal**: Devs Plenos Backend

## Numeracao

Esta sprint consome o numero **35**, seguindo o precedente ja aplicado duas vezes: a 33 foi consumida
pela correcao de lockout e a 34 pelos follow-ups dela, ambas na Fase 4, com a Fase 5 recuando a cada
vez ([`PRD-FASE-5.md`](../../docs-sep/PRD-FASE-5.md) §46 registra as duas). Em consequencia, **o
backend da Fase 5 renumera de 35-38 para 36-39** no mesmo ciclo desta spec.

## Objetivo

Uma frente de divida, com um item de seguranca real no meio:

1. **Seguranca**: hoje a origem usada pelo rate limit e **escolhida pelo cliente** nos dois caminhos.
2. **Robustez de configuracao**: `LockoutProperties` aceita valores que quebram a jornada de conta
   bloqueada no web, sem falhar no boot.
3. **Higiene**: handler de erro faltante, configuracao morta, codigo morto e um `Clock` nao injetavel
   que trava teste de tempo.

## Os itens, com ancora verificada (2026-08-05)

### 1. `forward-headers-strategy` sem allowlist de proxy — seguranca

`application.yml:66`:

```yaml
server:
  port: 8080
  forward-headers-strategy: framework # respeita X-Forwarded-* atras de proxy
```

Com `framework`, o Spring usa o `ForwardedHeaderFilter`, que honra `X-Forwarded-For` **de qualquer
origem**. Nao ha `server.tomcat.remoteip.internal-proxies` em lugar nenhum do arquivo. Consequencia
pratica: o `RateLimitFilter` limita por uma origem que o proprio cliente informa, entao trocar o
header a cada request contorna o limite.

A correcao registrada e `forward-headers-strategy: native` **com** `internal-proxies` no CIDR do
balanceador. O par importa: `internal-proxies` e propriedade do `RemoteIpValve` do Tomcat e so tem
efeito com a estrategia `native`. Trocar so a estrategia, sem o allowlist, **piora** — passa a confiar
no header sem nem o tratamento do Spring.

### 2. `LockoutProperties` sem validacao

O arquivo declara `maxAttempts = 5`, `windowMinutes = 15`, `lockoutMinutes = 30` com getters/setters e
**nenhuma anotacao de validacao**. Todos sao sobrescriviis por env var.

O acoplamento que torna isso relevante e do outro lado do fio: o web trata a politica como
tudo-ou-nada. `politica-lockout.service.ts:45-52` (`ehUtilizavel`) exige os **tres** campos como
inteiros positivos e devolve `null` se qualquer um falhar — entao `APP_LOCKOUT_WINDOW_MINUTES=0`
derruba os tres numeros da `/account-locked` de uma vez, e a pagina cai no texto vago do fallback.
Nada no backend avisa.

A Sprint 34 ja instalou o precedente: a invariante `rate-limit > max-attempts` e validada no boot,
lida pelo `Binder` para enxergar relaxed binding. Este item estende o mesmo mecanismo aos tres campos.

### 3. `ApiExceptionHandler` sem `HttpRequestMethodNotSupportedException`

17 `@ExceptionHandler` no arquivo (`MethodArgumentNotValidException`, `HttpMessageNotReadableException`,
`MissingRequestHeaderException`, `NoHandlerFoundException`, `NoResourceFoundException`, ...) e
**nenhum** de `HttpRequestMethodNotSupportedException`. Um `PUT` numa rota que so aceita `POST` cai no
`@ExceptionHandler(Exception.class)` de `:239` — resposta `500` para o que e `405`, e o corpo de erro
padronizado perde a informacao util.

### 4. `resilience4j.ratelimiter.configs.default` morto

`application.yml:372-377` configura o registry de rate limiter do starter Resilience4j. O rate limit
de login/TOTP e implementado pelo `RateLimitFilter` proprio, que nao le esse registry. Configuracao
que nao afeta nada e pior que ausente: sugere um controle que nao existe.

### 5. Codigo morto

- `ContaBloqueadaException.java:13` — `public static final String CODIGO = "AUTH-423-001"`, e
  `:36-38` `getCodigo()`. Nenhum consumidor: a unica outra ocorrencia de `getCodigo()` no `src/main` e
  a de `DomainException:30`, classe diferente.
- `LoginAttemptRepository.java:41` — `countByIpAndJanela(...)`. Unico chamador e
  `LoginAttemptRepositoryTest:58`. Query mantida viva por um teste que so testa a query.

### 6. `Clock` nao injetavel e `MDC` literal

- `LockoutService.java:100` e `:144` chamam `OffsetDateTime.now()` direto. Testar transicao de
  bloqueio no tempo exige relogio real; a Sprint 33 extraiu o `PoliticaLockout` como value object puro
  justamente para contornar isso, mas o service continua preso.
- `RateLimitFilter.java:188` — `MDC.get("correlationId")` com a chave literal, enquanto o resto do repo
  usa a chave por constante (ex.: `CelcoinOpenFinanceProvider` gerencia MDC por `MDCBridge`).

### 7. Contrato: enums inline e a `message` do `423`

- Enums saem **inline** no schema OpenAPI em vez de `$ref`, o que duplica a definicao a cada uso.
  Registrado pela Sprint 34; **a conferir no Gate 35.0** — este item nao foi remedido nesta spec.
- `ContaBloqueadaException.java:28` monta a mensagem a partir de `lockoutMinutes`, a duracao
  **configurada**, enquanto `getTempoRestante()` (`:32-34`) carrega o restante real que a Sprint 34
  passou a emitir no `Retry-After`. O docblock `:18-26` documenta a divergencia como **deliberada**.
  O item aqui e **alinhar a mensagem**, ou registrar a divergencia como definitiva — nao e obvio qual,
  e a decisao pertence aos steps.

## Decisao tecnica principal — a 35.2 e a unica com risco de ambiente

Cinco dos sete itens sao remocao ou anotacao, verificaveis por teste em memoria. A 35.2 muda como o
servidor **enxerga a origem de toda request**, e um `internal-proxies` errado quebra o rate limit por
IP em producao de duas formas opostas: CIDR largo demais mantem o bypass, CIDR estreito demais faz
todo mundo compartilhar o IP do balanceador e o limite passa a ser global.

Por isso ela exige teste que prove **os dois lados**: `X-Forwarded-For` vindo de dentro do allowlist e
respeitado, e vindo de fora e **ignorado**. Um teste so do caminho feliz nao verifica nada — foi
exatamente o padrao de falha que a Sprint 34 encontrou em dois testes que passavam provando nada.

## Escopo

### Dentro

Os sete itens acima, um por Task.

### Fora

- **Controle compensatorio contra brute force lento.** Registrado desde a Sprint 33, com risco
  residual **aceito pelo usuario** (seguir a doc torna o sistema 2x mais permissivo: 384/dia/conta vs
  192). **Exige ADR** e nao entra aqui.
- Os 4 contratos ausentes da F-17 e a deteccao de `knownGap` obsoleto no `contract-check.mjs`: sao do
  `sep-app`, nao deste repo.
- Migration. Nenhum item toca schema; se algum exigir, a Task para e reporta.

## Criterios de aceite

1. Contagem de testes **>= 2220 com 0 falhas** (baseline da Sprint 34, a re-medir no Gate 35.0).
2. `clean build` e `spotlessCheck` verdes.
3. **Todo comportamento novo verificado por mutacao** — 13 regressoes aplicadas e revertidas foi o
   padrao da Sprint 34, e duas delas revelaram testes que passavam provando nada.
4. A 35.2 prova os dois lados do allowlist (ver §Decisao tecnica principal).
5. A 35.1 prova que o boot **falha** com valor invalido, lido pelo `Binder` para enxergar relaxed
   binding, no padrao que a Sprint 34 instalou.
6. Remocao de codigo morto acompanhada de `grep` no checkpoint provando ausencia de consumidor — nao
   pela memoria.

## Riscos e limitacoes

- A 35.2 nao e verificavel contra infraestrutura real aqui: o CIDR do balanceador **nao existe** ate a
  Fase 5 (Frente B, gated por conta AWS). O valor entra parametrizado por ambiente, com default seguro,
  e a validacao contra balanceador real fica declarada como gate pendente — **nao simulada**.
- A 35.7 pode terminar em "registrar a divergencia como definitiva" em vez de mudar a mensagem. Isso e
  desfecho legitimo, desde que registrado com o porque; o que nao vale e sair sem decisao.
- Remover `countByIpAndJanela` remove tambem o teste que so a exercita. Se o Gate achar consumidor que
  este levantamento nao viu, a Task cai e o item volta ao backlog.

## Rastreabilidade

| Item da spec | Task |
|---|---|
| Validacao de `LockoutProperties` no boot | 35.1 |
| `forward-headers-strategy: native` + `internal-proxies` | 35.2 |
| `HttpRequestMethodNotSupportedException` | 35.3 |
| `resilience4j.ratelimiter.configs.default` morto | 35.4 |
| `ContaBloqueadaException.CODIGO` + `countByIpAndJanela` | 35.5 |
| `Clock` injetavel + `MDC` por constante | 35.6 |
| Enums por `$ref` + `message` do `423` | 35.7 |
| Baseline, gates e limitacoes | Gate 35.0 e Fechamento |

Steps em [`035-sprint-35-steps.md`](../../steps-fase-4/backend/035-sprint-35-steps.md).
