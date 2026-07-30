# Steps - Sprint 33 - Conformidade da politica de lockout

**Spec de origem**: [`033-sprint-33-lockout-conformidade.md`](../../specs/fase-4/033-sprint-33-lockout-conformidade.md)

**Status**: **CONCLUIDA e MERGEADA develop+main (2026-07-29)** — Tasks 33.0-33.4 executadas; PR #101
(squash `a613c6c`) em `develop` + PR #102 (`15f7833`) em `main`; `develop` == `main` por conteudo.
2173 testes, 0 falhas; sem migration, sem estado novo, sem ADR. Detalhe em
[`CONTEXT-PARTE-2.md`](../../docs-sep/CONTEXT-PARTE-2.md) §Sprint 33. Os follow-ups que esta sprint
registrou sao escopo da [`034`](../../specs/fase-4/034-sprint-34-followups-lockout-contrato.md).

**Objetivo geral**: fazer o `sep-api` cumprir a politica de lockout que ele proprio documenta
("5 falhas em 15 minutos -> bloqueio de 30 minutos") e permitir que o cliente chegue a receber o
`423`, hoje mascarado pelo rate limit. Sem novo estado persistido e sem migration.

**Esforco total estimado**: 1-2 dias de Dev Senior Backend.

**Repos de destino**:

- `sep-api`: `LockoutService`, `LoginAttemptRepository`, `application.yml`, anotacoes OpenAPI em
  `AuthController`/`MfaController`, testes unitarios e de integracao.
- `docs-SEP`: este step, `SEGURANCA.md`, `AI-ROADMAP.md`, STATE/historico no fechamento e PR
  description; Git manual.

**Branch**: `feature/sprint-33-lockout-conformidade` (criada de `develop` em `7f40056`, que ja contem
a Sprint 32 `c237382` e o merge `main -> develop`).

**Pre-requisitos**:

- `develop` e `main` em paridade (conferido em 2026-07-29).
- Nenhuma dependencia de sprint anterior: o codigo alvo esta em `main` desde a Sprint 5.

## Estado atual verificado (2026-07-29)

Levantado antes de planejar; qualquer divergencia encontrada no Gate 33.0 invalida o desenho abaixo.

- **Nao existe estado de lockout persistido.** Sem tabela, sem coluna `bloqueado_ate`, sem cache, sem
  Redis. `estaBloqueada` deriva de `COUNT(*)` sobre `login_attempt`.
- `LockoutService.estaBloqueada` conta na janela de **`lockoutMinutes` (30 min)**; `avaliarPosFalha`
  conta na janela de **`windowMinutes` (15 min)**. As duas janelas divergentes sao a aproximacao que
  esta sprint remove.
- `avaliarPosFalha` dispara em **`falhasJanela == maxAttempts`** (igualdade exata): se duas falhas
  concorrentes fizerem o contador saltar de 4 para 6, o audit `LOCKOUT` e o email **nao sao emitidos**
  e o bloqueio fica sem registro.
- `LoginAttemptStatus.CONTA_BLOQUEADA` esta em `STATUSES_FALHA` mas **nenhum caminho de producao o
  escreve**: `AutenticarUsuarioUseCase` e `VerificarTotpUseCase` chamam `verificar()` antes de
  registrar, entao uma tentativa contra conta bloqueada nao gera linha alguma. O unico uso vivo do
  valor e o mapeamento morto em `RegistrarTentativaLoginUseCase` (`CONTA_BLOQUEADA -> LOCKOUT`),
  coberto por `RegistrarTentativaLoginUseCaseTest.contaBloqueadaMapeiaParaLockout` — o teste chama o
  use case direto com o status.
- `LoginAttemptRepository` tem apenas contagens; **nao ha metodo que devolva instantes de falha**.
- Indice disponivel: `idx_login_attempt_username_data (username, data_tentativa DESC)`. Nao ha indice
  incluindo `status`.
- `RateLimitFilter` roda **antes** da autenticacao (`SecurityConfig`:
  `addFilterBefore(rateLimitFilter, JwtAuthenticationFilter.class)`), com registry em memoria por
  JVM e chaves por IP que nunca sao removidas (follow-up de infraestrutura, fora de escopo).
- `app.security.*` so aparece em `application.yml`; nenhum profile sobrescreve. ~23 ITs sobrescrevem
  `app.security.rate-limit.login-per-minute-per-ip` para `1000` via `@DynamicPropertySource`, e
  **nenhum** sobrescreve `app.security.lockout.*`.
- Nao existe teste que assere `423` fim a fim, nem teste da fronteira da janela de 15 min, nem teste
  de expiracao do bloqueio.

## Decisoes da sprint

- **Bloqueio derivado com regra exata, sem novo estado.** A condicao implementada e:

  ```text
  falhas do username nos ultimos (lockoutMinutes + windowMinutes), ordem decrescente: t[0..n-1]

  bloqueada(agora) <=> existe i tal que
        agora - t[i]                 <  lockoutMinutes
    e   t[i + maxAttempts - 1]       existe
    e   t[i] - t[i+maxAttempts-1]    <= windowMinutes
  ```

  Equivalencia exata com a regra documentada: haver `>= maxAttempts` falhas em
  `[t[i] - windowMinutes, t[i]]` e o mesmo que as `maxAttempts` falhas mais recentes ate `t[i]`
  caberem na janela. A leitura cobre 45 min porque o evento de bloqueio candidato mais antigo esta em
  `agora - 30min` e a janela de deteccao dele olha 15 min para tras.

- **Alternativa rejeitada**: persistir `bloqueado_ate` (coluna/tabela + migration `V60`). Consulta
  `O(1)` e bloqueio auditavel por si, mas cria estado que precisa ser escrito, invalidado e mantido
  coerente com `login_attempt`, alem de migration e ADR. A versao derivada entrega a mesma regra sem
  nada disso e roda inteira em unit test. Reabrir a decisao **so** com gargalo medido — ai com ADR.

- **Limite defensivo na leitura**: a query devolve no maximo os `N` instantes mais recentes
  (sugestao: 100, via `Pageable`). E seguro porque qualquer janela qualificante estara entre as
  falhas mais recentes; e evita ler uma cauda longa num cenario de ataque. Documentar o limite no
  metodo.

- **Emissao na transicao, nao por igualdade.** `avaliarPosFalha` passa a emitir audit + email quando
  o evento de bloqueio calculado **coincide com a falha recem-registrada**. Isso corrige o salto de
  4 para 6 e torna a emissao idempotente por evento, sem depender de `== maxAttempts`.

- **`CONTA_BLOQUEADA` sai de `STATUSES_FALHA`.** Hoje e inerte; se algum dia passasse a ser escrito,
  cada tentativa barrada renovaria o proprio bloqueio — bloqueio auto-perpetuante. O valor do enum e
  a constraint do banco permanecem (ha teste cobrindo o mapeamento).

- **`rate-limit` estritamente maior que `max-attempts`.** `login-per-minute-per-ip` e
  `totp-verify-per-minute-per-ip` vao de 5 para **10**. Justificativa: o rate limit por IP protege o
  **servico**; quem protege a **conta** e o lockout (5 tentativas). Com os dois em 5, a 6a requisicao
  — unica capaz de responder `423` — nunca chega ao controller, e o usuario legitimo nunca descobre
  que sua conta esta bloqueada. 10/min/IP continua restritivo e mantem o lockout como o limite real
  por conta. O TOTP sobe junto porque `VerificarTotpUseCase` tambem chama `verificar()` e sofre do
  mesmo mascaramento.

- **Sem ADR**: nao ha escolha estrutural nova; a sprint faz o codigo cumprir politica ja documentada.
  ADR passa a ser exigido se a alternativa persistida for adotada.

- **Risco residual aceito** (achado do code review da Task 33.1, 2026-07-29): cumprir a regra
  documentada torna o sistema **2x mais permissivo contra brute force lento**. Antes, para nunca
  bloquear, o atacante estava limitado a 4 falhas por 30 min (192/dia/conta); agora sao 4 falhas por
  15 min (**384/dia/conta**). O rate limit e por IP, entao nao restringe atacante distribuido por
  conta. Nao e defeito de implementacao — e a consequencia direta de "seguir a doc", decidida pelo
  usuario em 2026-07-29. Registrar em `SEGURANCA.md` §5 no Step 033.4.2; controle compensatorio
  (backoff exponencial ou rate limit por conta) fica como **follow-up**, fora do escopo desta sprint.

## Fora de escopo

- Migration, tabela ou coluna de lockout.
- Endpoint de desbloqueio administrativo ou self-service.
- Registrar tentativas `CONTA_BLOQUEADA` para observabilidade (follow-up).
- Mudar a assinatura de `ContaBloqueadaException(int lockoutMinutes)` para tempo restante
  (follow-up; quebra testes e o front nao ecoa a `message`).
- Zerar contador em login bem-sucedido — e mudanca de politica, nao de conformidade.
- Evicção do `RateLimiterRegistry` (chaves por IP acumulam; follow-up de infraestrutura).
- Alterar `sep-app`/`sep-mobile`: o recorte web e a
  [`121`](../../specs/fase-4/121-fsprint-21-lockout-login-web.md).

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
`design-patterns-java`, `clean-architecture` (a regra de bloqueio e politica de dominio; o repository
so entrega instantes, nao decide).

## Rastreabilidade spec 033 -> steps

| Task da spec 033 | Steps |
|------------------|-------|
| 1. Politica exata de bloqueio (15/30) | 33.1 |
| 2. Transicao de bloqueio + limpeza de `CONTA_BLOQUEADA` | 33.2 |
| 3. Rate limit alcancavel + IT do `423` | 33.3 |
| 4. OpenAPI, docs e fechamento | 33.4 |
| Gates de cadeia, baseline e reconfirmacao do estado | 33.0 |

## Ordem de execucao

```text
33.0 prechecks + baseline + reconfirmacao do estado levantado
  -> 33.1 politica exata de bloqueio (janela de 15 min, expiracao de 30 min)
  -> 33.2 emissao na transicao + CONTA_BLOQUEADA fora da contagem
  -> 33.3 rate limit > max-attempts + IT que prova 423 fim a fim
  -> 33.4 OpenAPI 423/429, SEGURANCA.md, docs e fechamento
```

---

## Gate 33.0 - Prechecks, baseline e reconfirmacao

**Objetivo**: confirmar que o estado levantado em 2026-07-29 continua valendo antes de reescrever
politica de seguranca.

### Step 033.0.1 - Confirmar cadeia Git

```bash
cd <sep-api-root>
git fetch --all --prune
git status --short --branch
git rev-list --left-right --count origin/main...origin/develop
```

Sprint 32 (`c237382`) presente em `origin/develop`; `main` integrada. Branch
`feature/sprint-33-lockout-conformidade` criada de `develop`. **Ja executado em 2026-07-29** (base
`7f40056`).

### Step 033.0.2 - Rodar baseline completa

```bash
./gradlew clean build
./gradlew test
```

Registrar o numero de testes de partida. Anotar qualquer vermelho preexistente **antes** de editar;
nunca corrigir de carona.

### Step 033.0.3 - Reconfirmar o estado levantado

Conferir em codigo, um a um, os itens de §Estado atual verificado — em especial: (a) nenhum caminho
de producao escreve `CONTA_BLOQUEADA`; (b) `LoginAttemptRepository` nao tem metodo de instantes;
(c) nenhum profile sobrescreve `app.security.lockout.*`.

**Por que e gate e nao task**: remover `CONTA_BLOQUEADA` da contagem so e seguro se ele continuar
sem ser escrito. Se algum caminho passou a escreve-lo desde o levantamento, o desenho da Task 33.2
muda.

### Step 033.0.4 - Mapear o raio de impacto nos testes

Listar o que depende da regra antiga, para nao descobrir no meio da implementacao:

- `LockoutServiceTest.verificarLancaQuandoFalhasAcimaDoLimite` — encoda "count >= 5 na janela de 30"
  e sera reescrito.
- `LockoutServiceTest.verificarPassaQuandoFalhasAbaixoDoLimite` — o stub de `count` fica sem uso
  (`UnnecessaryStubbingException` com Mockito estrito); sera reescrito.
- `LockoutServiceTest.avaliarPosFalhaUsaJanelaCurta` — **captura o timestamp e nunca o asserta**;
  o nome promete o que o teste nao verifica. Corrigir enquanto se mexe nele.
- `AutenticarUsuarioUseCaseTest.contaBloqueadaLancaAntesDeValidarSenha` — passa `30` ao construtor de
  `ContaBloqueadaException`; sobrevive porque a assinatura nao muda (decisao da sprint).
- ~23 ITs sobrescrevem `rate-limit` mas nao `lockout`: rodar a suite completa e observar flakiness.

### Definicao de pronto do Gate 33.0

- [ ] Cadeia Git conferida e branch criada de `develop` atualizado.
- [ ] Baseline verde com numero de testes registrado.
- [ ] Estado levantado reconfirmado em codigo (ou desenho revisto).
- [ ] Raio de impacto nos testes mapeado.

---

## Task 33.1 - Politica exata de bloqueio

**Objetivo**: `estaBloqueada` passa a implementar a regra documentada, nao uma aproximacao.

**Pre-requisito**: Gate 33.0 concluido.

**Esforco**: 0,5 dia.

**Arquivos esperados**:

- `identity/infrastructure/persistence/LoginAttemptRepository.java`.
- `identity/application/service/LockoutService.java` (inclui o javadoc, que hoje **admite** a
  aproximacao e precisa passar a descrever a regra real).
- `identity/application/service/LockoutServiceTest.java`.
- `identity/infrastructure/persistence/LoginAttemptRepositoryTest.java`.

### Step 033.1.1 - Ler instantes de falha

Metodo novo no repository devolvendo os instantes (`OffsetDateTime`) das falhas de um `username` a
partir de um inicio de janela, **ordem decrescente**, com limite defensivo via `Pageable`.

O repository **so entrega dados** — nao conta, nao decide, nao conhece `maxAttempts`. A regra fica no
service (`clean-architecture`: politica no dominio, tradutor na infraestrutura).

Cobrir no `LoginAttemptRepositoryTest`: ordem decrescente, filtro por status de falha, respeito ao
inicio da janela e ao limite.

### Step 033.1.2 - Implementar a regra documentada

`estaBloqueada` passa a ler os instantes dos ultimos `lockoutMinutes + windowMinutes` e aplicar a
condicao da §Decisoes. Extrair a decisao para um metodo/objeto **puro e testavel sem mock**, que
receba a lista de instantes e o `agora` e devolva o instante do evento de bloqueio (ou vazio) — isso
permite testar fronteiras sem banco e sem relogio real.

Atualizar o javadoc de `LockoutService`: hoje ele documenta a aproximacao.

### Step 033.1.3 - Testar as duas fronteiras

Casos minimos (unitarios, sem banco):

- 4 falhas em 5 min -> **nao** bloqueia.
- 5 falhas em 10 min -> bloqueia.
- 5 falhas exatamente na fronteira de 15 min -> bloqueia (documentar o lado escolhido: `<=`).
- **5 falhas espalhadas por 20 min -> NAO bloqueia.** Este e o caso que hoje bloqueia; e a prova da
  correcao.
- Bloqueio expira **30 min apos o evento**, nao conforme falhas envelhecem: 5 falhas em 10 min,
  `agora` = evento + 29 min -> bloqueada; evento + 31 min -> livre.
- 5 falhas antigas + 1 recente sem formar janela -> nao bloqueia.

```bash
./gradlew test --tests "*LockoutServiceTest" --tests "*LoginAttemptRepositoryTest"
./gradlew spotlessCheck
```

### Definicao de pronto da Task 33.1

- [ ] Regra implementada e a documentada; javadoc atualizado.
- [ ] Decisao isolada em codigo puro, testavel sem banco e sem relogio real.
- [ ] Fronteiras de 15 e de 30 minutos cobertas, incluindo o caso "5 em 20 min nao bloqueia".
- [ ] Sem migration, sem estado novo.

### Commit sugerido

```text
fix(identity): aplicar a janela documentada de 15 min no account lockout
```

---

## Task 33.2 - Transicao de bloqueio e limpeza da contagem

**Objetivo**: o registro do bloqueio para de se perder e a contagem para de admitir um status que
tornaria o bloqueio perpetuo.

**Pre-requisito**: Task 33.1 concluida e aprovada.

**Esforco**: 0,25 dia.

**Arquivos esperados**:

- `identity/application/service/LockoutService.java` e seu teste.

### Step 033.2.1 - Emitir na transicao

`avaliarPosFalha` passa a emitir audit `LOCKOUT` + email quando o evento de bloqueio calculado
coincide com a falha recem-registrada — ou seja, quando **esta** falha foi a que trancou a conta.
Remove a dependencia de `falhasJanela == maxAttempts`.

Cobrir: contador saltando de 4 para 6 ainda emite **uma** vez; falha subsequente com a conta ja
bloqueada nao emite de novo; falha abaixo do limite nao emite.

### Step 033.2.2 - Remover `CONTA_BLOQUEADA` de `STATUSES_FALHA`

Justificar em comentario: nenhum caminho de producao o escreve e, se escrevesse, cada tentativa
barrada renovaria o bloqueio. O valor do enum, a constraint do banco e
`RegistrarTentativaLoginUseCaseTest.contaBloqueadaMapeiaParaLockout` permanecem intactos.

```bash
./gradlew test --tests "*LockoutServiceTest" --tests "*RegistrarTentativaLoginUseCaseTest"
./gradlew spotlessCheck
```

### Definicao de pronto da Task 33.2

- [ ] Audit + email emitidos exatamente uma vez por evento de bloqueio, inclusive com salto de
      contador.
- [ ] `CONTA_BLOQUEADA` fora da contagem, com o motivo registrado em comentario.
- [ ] Nenhum teste existente quebrado sem substituto melhor.

### Commit sugerido

```text
fix(identity): registrar lockout na transicao e sanear a contagem de falhas
```

---

## Task 33.3 - Tornar o `423` alcancavel

**Objetivo**: o cliente passa a receber `423` em uso normal, em vez de `429`.

**Pre-requisito**: Task 33.2 concluida e aprovada.

**Esforco**: 0,25-0,5 dia.

**Arquivos esperados**:

- `src/main/resources/application.yml`.
- Novo teste de integracao em `identity` (nao existe nenhum que assere `423`).

### Step 033.3.1 - Elevar o rate limit

`login-per-minute-per-ip` e `totp-verify-per-minute-per-ip` de `5` para `10`, mantendo os env vars
(`APP_RATE_LIMIT_LOGIN`, `APP_RATE_LIMIT_TOTP_VERIFY`). Comentar no yml a **invariante**: o rate
limit por IP precisa ser estritamente maior que `lockout.max-attempts`, senao o `423` fica
inalcancavel.

### Step 033.3.2 - Teste de integracao do `423`

IT novo que dirige **5 logins falhos reais** contra `/api/v1/auth/login` e assere:

- as 5 primeiras respostas sao `401`;
- a **6a** e `423` com corpo `ErrorResponseDto` (`status: 423`, `error: "Locked"`);
- a 6a **nao** e `429` — e a regressao que trava a invariante do Step 033.3.1.

Nao sobrescrever `app.security.lockout.*` no IT: o objetivo e exercitar a politica default.
Sobrescrever `rate-limit` **apenas** se a infraestrutura de teste exigir, e nesse caso mantendo o
valor acima de `max-attempts` — caso contrario o teste deixa de provar a invariante.

```bash
./gradlew test --tests "*Lockout*IT" --tests "*RateLimitFilterTest"
./gradlew spotlessCheck
```

### Definicao de pronto da Task 33.3

- [ ] `rate-limit` > `max-attempts` no yml, com a invariante comentada.
- [ ] IT prova `401` x5 e `423` na 6a, sem `429`.
- [ ] `RateLimitFilterTest` segue verde (usa props proprias, nao deve ser afetado).

### Commit sugerido

```text
fix(identity): permitir que o lockout responda 423 antes do rate limit
```

---

## Task 33.4 - OpenAPI, docs e fechamento

**Objetivo**: o contrato publicado passa a declarar o que a API realmente responde.

**Pre-requisito**: Task 33.3 concluida e aprovada.

**Esforco**: 0,25 dia.

**Arquivos esperados**:

- `identity/web/controller/AuthController.java` (login) e `identity/web/controller/MfaController.java`
  (`/auth/totp/verify`).
- `docs-SEP`: `docs-sep/SEGURANCA.md`, `AI-ROADMAP.md`, `repos/sep-api/SPRINT-33-PR.md`,
  `docs-sep/STATE.md`, `docs-sep/CONTEXT-PARTE-2.md`.

### Step 033.4.1 - Documentar `423` e `429`

Acrescentar `@ApiResponse` `423` (conta bloqueada) e `429` (rate limit) nos dois endpoints, ambos com
`ErrorResponseDto`. Hoje login declara `200/400/401` e TOTP verify declara `200/400`, embora os dois
produzam `423` e `429` em runtime.

Fecha o `knownGaps` que a F-Sprint 21 web registra no `consumed-contracts.json`. Coordenar: apos o
merge desta sprint, o snapshot OpenAPI do `sep-app` deve ser renovado e a entrada de `knownGaps`
removida.

### Step 033.4.2 - Conferir `SEGURANCA.md`

§5 ja descreve a regra correta (15 min de deteccao, 30 min de bloqueio). Conferir frase a frase
contra o comportamento implementado e ajustar o que divergir — inclusive registrar explicitamente que
o desbloqueio e por expiracao e que **nao existe** desbloqueio manual.

### Step 033.4.3 - Fechamento

```bash
./gradlew clean build
./gradlew test
./gradlew spotlessCheck
```

Criar `repos/sep-api/SPRINT-33-PR.md` (e remover a descricao de PR da sprint anterior, se ainda
existir). Atualizar `AI-ROADMAP.md`, `docs-sep/STATE.md` e apender entrada em
`docs-sep/CONTEXT-PARTE-2.md`. Registrar os follow-ups: registrar tentativas `CONTA_BLOQUEADA`;
`ContaBloqueadaException` com tempo restante; evicção do `RateLimiterRegistry`; renovacao do snapshot
OpenAPI no `sep-app`.

### Definicao de pronto da Task 33.4

- [ ] `423` e `429` no OpenAPI de login e TOTP verify.
- [ ] `SEGURANCA.md` conferido contra o comportamento real.
- [ ] Build e suite completos verdes; sem migration nova.
- [ ] Docs, roadmap, STATE e historico atualizados; follow-ups registrados.

### Commit sugerido

```text
docs(identity): declarar 423 e 429 no contrato de autenticacao
```
