# Sprint 33 — Conformidade da politica de lockout (Fase 4 / correcao)

> Branch: `feature/sprint-33-lockout-conformidade` -> `develop` -> `main`.
> **MERGEADA em 2026-07-29**: `develop` via PR #101 (squash `a613c6c`), `main` via PR #102
> (`15f7833`); `develop` == `main` conferido por diff de conteudo (vazio).
> Spec: [`specs/fase-4/033-sprint-33-lockout-conformidade.md`](../../specs/fase-4/033-sprint-33-lockout-conformidade.md) · Steps: [`steps-fase-4/backend/033-sprint-33-steps.md`](../../steps-fase-4/backend/033-sprint-33-steps.md).
> Par corretivo do lado backend; o lado web e a **F-Sprint 21** ([`121`](../../specs/fase-4/121-fsprint-21-lockout-login-web.md)).

## O que entrega

Faz o `sep-api` **cumprir** a politica de lockout que ele proprio documenta em `SEGURANCA.md` §5
("5 falhas em 15 min -> bloqueio de 30 min") e faz o cliente chegar a receber o `423`, hoje mascarado
pelo rate limit. **Sem novo estado persistido, sem migration, sem ADR** (nao ha escolha estrutural
nova; o codigo passa a seguir politica ja publicada).

- **Regra exata de bloqueio (Task 33.1)**: `estaBloqueada` deixa de aproximar por contagem na janela
  de 30 min e passa a exigir que as `maxAttempts` falhas mais recentes caibam na janela de 15 min; o
  bloqueio de 30 min conta **do evento** (a falha que fechou a janela), nao do envelhecimento das
  falhas. A decisao virou um value object puro **`PoliticaLockout`** (`eventoDeBloqueio(instantes,
  agora)`), testavel sem banco e sem relogio real. O repository (`LoginAttemptRepository`) so entrega
  os instantes de falha (ordem decrescente, filtro por status de falha, limite defensivo via
  `Pageable`) — nao conta, nao decide, nao conhece `maxAttempts` (clean-architecture: politica no
  dominio, tradutor na infraestrutura).
- **Transicao + saneamento (Task 33.2)**: `avaliarPosFalha` emite audit `LOCKOUT` + email **na
  transicao** (quando a falha recem-registrada e a que trancou a conta), nao mais por
  `falhasJanela == maxAttempts` — corrige o salto de contador de 4 para 6 que deixava o bloqueio sem
  registro nenhum. `CONTA_BLOQUEADA` sai de `STATUSES_FALHA` (nenhum caminho de producao o escreve;
  se escrevesse, cada tentativa barrada renovaria o proprio bloqueio). Enum e constraint do banco
  intactos; `RegistrarTentativaLoginUseCaseTest.contaBloqueadaMapeiaParaLockout` segue verde.
- **`423` alcancavel (Task 33.3)**: `login-per-minute-per-ip` e `totp-verify-per-minute-per-ip` de
  **5 para 10**, com a **invariante** comentada no `application.yml` — o rate limit por IP precisa
  ser estritamente maior que `lockout.max-attempts`, senao a 6a tentativa (a unica capaz de responder
  `423`) e barrada com `429`. A IT nova (`LockoutLoginIT`) dirige 5 logins falhos reais e prova
  `401` x5 -> `423` na 6a; **nao** sobrescreve o rate limit (o default e o que se quer exercitar).
- **Bug descoberto pela IT (Task 33.3)**: nenhuma falha chegava a `login_attempt` — o registro
  entrava na transacao do `AutenticarUsuarioUseCase` e era desfeito pelo `BadCredentialsException`
  lancado logo em seguida. **O account lockout nunca bloqueou de fato desde a Sprint 5.** Correcao:
  `RegistrarTentativaLoginUseCase.registrar` e `LockoutService.avaliarPosFalha` passam a
  `REQUIRES_NEW`, para que registro + audit sobrevivam ao rollback do chamador.
- **Contrato (Task 33.4)**: `@ApiResponse` `423` e `429` (ambos `ErrorResponseDto`) em
  `POST /api/v1/auth/login` e `POST /api/v1/auth/totp/verify`. Fecha o `knownGaps` que a F-Sprint 21
  registra no `consumed-contracts.json` do `sep-app` (coordenar: renovar o snapshot OpenAPI apos o
  merge).

## Fronteiras cobertas (`PoliticaLockoutTest`, `LockoutServiceTest`, unit, sem banco)

- 4 falhas em 5 min -> nao bloqueia.
- 5 falhas em 10 min -> bloqueia.
- 5 falhas na fronteira exata de 15 min -> bloqueia (`<=`, lado documentado).
- **5 falhas espalhadas por 20 min -> NAO bloqueia** (o caso que a regra antiga bloqueava; prova da correcao).
- Bloqueio expira 30 min apos o evento: evento + 29 min -> bloqueada; evento + 31 min -> livre.
- 5 falhas antigas + 1 recente sem formar janela -> nao bloqueia.
- Config negativa (janela/duracao via env var) derruba o boot em vez de fail-open silencioso (review 33.1).
- `Pageable` e limite defensivo, nao paginacao: assert impede `PageRequest.of(1, ...)` desligar o lockout com a suite verde (review 33.1).

## Invariantes / verificacao

- `./gradlew clean build` + `./gradlew test` + `./gradlew spotlessCheck` verdes.
- **2173 testes, 0 falhas** (branch adiciona +22 `@Test`, remove 0).
- Sem migration; sem estado novo; `git diff` da branch nao toca `db/migration`.
- IT prova a jornada fim a fim (`401` x5 -> `423` na 6a; senha correta durante bloqueio tambem `423`,
  pois o lockout e verificado antes da credencial) sem sobrescrever o rate limit default.

## Risco residual aceito (decidido pelo usuario em 2026-07-29)

Cumprir a regra documentada torna o sistema **2x mais permissivo contra brute force lento**: para
nunca bloquear, o atacante passa de 4 falhas/30 min (192/dia/conta) para 4 falhas/15 min
(384/dia/conta); o rate limit e por IP e nao restringe ataque distribuido por conta. Nao e defeito de
implementacao — e a consequencia direta de "seguir a doc". Registrado em `SEGURANCA.md` §5. Controle
compensatorio (backoff exponencial ou rate limit por conta) fica como follow-up.

## Follow-ups registrados (fora do escopo)

1. Registrar tentativas `CONTA_BLOQUEADA` para observabilidade.
2. `ContaBloqueadaException` com tempo restante em vez de duracao fixa (quebra testes; o front nao ecoa a `message`).
3. Evicção do `RateLimiterRegistry` (chaves por IP acumulam na JVM; infraestrutura).
4. Renovar o snapshot OpenAPI no `sep-app` e remover a entrada de `knownGaps` do `423`/`429`.
5. Validador de startup da invariante `rate-limit > max-attempts` (hoje so os defaults sao cobertos por teste; env var pode quebra-la em silencio) — achado do code review 33.3.
6. Assert do audit `LOCKOUT` na `LockoutLoginIT` (o `REQUIRES_NEW` de `avaliarPosFalha` nao tem cobertura observavel) — achado do code review 33.3.
7. Controle compensatorio contra brute force lento (ver risco residual).

## Commits

1. `fix(identity): aplicar a janela documentada de 15 min no account lockout` (Task 33.1)
2. `fix(identity): endurecer a politica de lockout contra config e uso indevido` (code review 33.1)
3. `fix(identity): registrar lockout na transicao e sanear a contagem de falhas` (Task 33.2)
4. `fix(identity): permitir que o lockout responda 423 antes do rate limit` (Task 33.3)
5. `docs(identity): declarar 423 e 429 no contrato de autenticacao` (Task 33.4)
