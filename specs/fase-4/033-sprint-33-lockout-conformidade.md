# Spec 033 - Sprint 33 - Conformidade da politica de lockout

## Metadados

- **ID da Spec**: 033
- **Titulo**: Sprint 33 - Alinhar a implementacao do account lockout a politica documentada e tornar
  o `423` alcancavel
- **Status**: CONCLUIDA — MERGEADA develop+main (PR #101/#102, 2026-07-29)
- **Fase do produto**: Fase 4 - correcao de requisito da Sprint 5 (Fase 2)
- **Trilha**: Backend (`sep-api`)
- **Origem**: bug reportado em 2026-07-29 (front nao chega em `/account-locked`) + divergencia
  doc x codigo encontrada na investigacao. Requisito original:
  [`005`](../fase-2/005-sprint-5-endurecimento-seguranca.md) Task 5.4 e
  [`SEGURANCA.md`](../../docs-sep/SEGURANCA.md) §5
- **Depende de**: nada; opera sobre codigo ja em `main` desde a Sprint 5
- **Desbloqueia**: o smoke real da [`121`](./121-fsprint-21-lockout-login-web.md) (F-Sprint 21 web) —
  sem esta sprint o `423` continua inalcancavel em tentativas rapidas
- **Responsavel principal**: Devs Plenos Backend

## Objetivo

Fazer o `sep-api` **cumprir a politica de lockout que ele documenta** e permitir que o cliente chegue
a ver o `423`. Sao tres defeitos independentes, todos na mesma superficie:

1. **A regra implementada nao e a documentada.** A doc e o javadoc de `LockoutProperties` dizem
   "5 falhas em **15 minutos** -> bloqueio de **30 minutos**". `LockoutService.estaBloqueada` conta
   falhas nos ultimos **30 minutos** e compara com 5. Sao regras diferentes:
   - 5 falhas espalhadas em 25 minutos **bloqueiam hoje**, e nao deveriam (nunca houve 5 em 15 min);
   - o desbloqueio ocorre quando as falhas antigas saem da janela de 30 min, e nao 30 minutos apos o
     bloqueio.
2. **O `423` e inalcancavel em uso normal.** `RateLimitFilter` permite 5 POSTs/min/IP em
   `/auth/login` e o lockout dispara com 5 falhas. Como `verificar()` roda antes de registrar a
   tentativa, a 5a senha errada ainda responde `401` (e tranca a conta) e a 6a requisicao — a
   primeira que responderia `423` — e barrada pelo filtro com `429`, sem chegar ao controller.
3. **`423` e `429` nao existem no OpenAPI** de `/auth/login` nem de `/auth/totp/verify`, embora
   ambos os endpoints os produzam em runtime.

## Decisao tecnica principal — bloqueio derivado, sem novo estado

Nao existe hoje **nenhum** estado de lockout persistido: nem tabela, nem coluna `bloqueado_ate`, nem
cache, nem Redis. O bloqueio e 100% derivado de contagem sobre `login_attempt`.

**Decisao: manter derivado, trocando a contagem por uma regra exata.** A politica documentada e
equivalente a esta condicao sobre os instantes das falhas (`t0` = mais recente, ordem decrescente):

```text
A conta esta bloqueada em `agora` se existe indice i tal que:
    agora - t[i]              <  lockoutMinutes   (o evento de bloqueio ainda esta valendo)
  e t[i + maxAttempts - 1]    existe
  e t[i] - t[i+maxAttempts-1] <= windowMinutes    (as 5 falhas terminando em t[i] cabem na janela)

bloqueadoAte = t[i] + lockoutMinutes, para o menor i que satisfaz a condicao.
```

A equivalencia e exata: haver `>= 5` falhas em `[t[i] - 15min, t[i]]` e o mesmo que as 5 falhas mais
recentes ate `t[i]` caberem em 15 minutos. Basta ler as falhas dos ultimos
`lockoutMinutes + windowMinutes` (45 min) — o evento de bloqueio candidato mais antigo esta em
`agora - 30min` e a janela de deteccao dele olha 15 min para tras.

**Alternativa rejeitada — persistir `bloqueado_ate`** (nova coluna ou tabela + migration `V60`):
consulta `O(1)` e bloqueio auditavel por si, mas introduz estado novo que precisa ser escrito,
invalidado e mantido consistente com `login_attempt`, alem de migration e ADR. A versao derivada
resolve a mesma regra sem estado novo, sem migration, e fica inteiramente testavel em unit test.
**Se a leitura de instantes virar gargalo medido**, a decisao se reabre — e ai vale ADR.

**Sem ADR nesta sprint**: nao ha escolha estrutural nova; a sprint faz o codigo cumprir a politica ja
documentada em `SEGURANCA.md` §5. Um ADR passa a ser exigido se a alternativa persistida for adotada.

## Escopo

### Em escopo

- Substituir a contagem aproximada por leitura dos instantes das falhas e pela regra exata acima
  (`LockoutService` + um metodo novo em `LoginAttemptRepository`).
- Corrigir a emissao de audit `LOCKOUT` + email: hoje dispara em `falhasJanela == maxAttempts`
  (igualdade exata), entao duas falhas concorrentes podem pular o `== 5` e **perder o registro do
  bloqueio**. Passa a disparar na **transicao** — quando a falha recem-registrada e o proprio evento
  de bloqueio.
- Remover `CONTA_BLOQUEADA` de `STATUSES_FALHA`: o status **nunca e escrito** por nenhum caminho de
  producao (ambos os use cases lancam antes de registrar), e se algum dia passasse a ser escrito
  tornaria o bloqueio auto-perpetuante — cada tentativa barrada renovaria o proprio bloqueio.
- Tornar o `423` alcancavel: `rate-limit.login-per-minute-per-ip` e
  `rate-limit.totp-verify-per-minute-per-ip` passam a **10**, estritamente maiores que
  `lockout.max-attempts` (5).
- Documentar `423` e `429` no OpenAPI de `POST /auth/login` (`AuthController`) e
  `POST /auth/totp/verify` (`MfaController`).
- Teste de integracao provando `423` fim a fim (nao existe nenhum hoje) e testes da janela de 15 min
  e da expiracao de 30 min.

### Fora de escopo

- Persistir estado de lockout (tabela/coluna `bloqueado_ate`) — alternativa avaliada e rejeitada
  acima; **nao ha migration nesta sprint**.
- Endpoint de desbloqueio administrativo ou self-service. Continua nao existindo; o desbloqueio e
  por expiracao. Se o produto quiser desbloqueio assistido, e sprint propria com ADR.
- Registrar tentativas `CONTA_BLOQUEADA` para observabilidade — util, mas exige excluir o status da
  contagem com cuidado e nao e necessario para a correcao. **Follow-up**.
- Trocar a assinatura de `ContaBloqueadaException(int lockoutMinutes)` para carregar tempo restante:
  melhoraria a mensagem, mas quebra testes e o front nao ecoa a `message` do servidor. **Follow-up**.
- Alterar `sep-app` ou `sep-mobile` — o recorte web e a [`121`](./121-fsprint-21-lockout-login-web.md).
- Zerar o contador em login bem-sucedido. Hoje nao zera e continua nao zerando: com a janela de 15
  min a permanencia deixa de ser problema pratico, e zerar e mudanca de politica, nao de conformidade.
- Evicção do `RateLimiterRegistry` do `RateLimitFilter` (as chaves por IP acumulam sem limpeza).
  **Follow-up de infraestrutura**, independente deste defeito.

## Tasks de implementacao

1. Politica exata de bloqueio: metodo de leitura de instantes no `LoginAttemptRepository` +
   `LockoutService.estaBloqueada` pela regra documentada, com testes de janela e de expiracao.
2. Transicao de bloqueio: audit `LOCKOUT` + email na transicao (nao em `== maxAttempts`) e remocao
   de `CONTA_BLOQUEADA` de `STATUSES_FALHA`.
3. Tornar o `423` alcancavel: `rate-limit` de login e TOTP para 10 + teste de integracao que dirige
   5 falhas reais e assere `423` na 6a.
4. OpenAPI (`423`/`429` em login e TOTP verify), docs e fechamento.

## Gates que nao contam como task

- Precheck de cadeia Git e baseline verde da suite completa (inclui os ~23 ITs que sobrescrevem
  `rate-limit` mas **nao** sobrescrevem `lockout` — a mudanca de politica pode aflorar flakiness la).
- Reconfirmar que nenhum caminho de producao escreve `CONTA_BLOQUEADA` antes de remove-lo da
  contagem.
- Conferir que `SEGURANCA.md` §5 continua descrevendo exatamente o que o codigo passa a fazer.
- PR description.

## Definition of Done

- 5 falhas em ate 15 minutos bloqueiam; 5 falhas espalhadas por mais de 15 minutos **nao** bloqueiam
  — com teste para os dois lados da fronteira.
- O bloqueio expira 30 minutos **apos o evento de bloqueio**, nao conforme falhas envelhecem, com
  teste.
- Audit `LOCKOUT` e email sao emitidos uma vez na transicao e nao se perdem quando o contador salta
  de 4 para 6.
- `CONTA_BLOQUEADA` fora de `STATUSES_FALHA`; nenhum caminho de producao o escreve.
- Existe teste de integracao que dirige 5 logins falhos reais e recebe **HTTP 423** na 6a requisicao,
  sem esbarrar em `429`.
- `423` e `429` documentados no OpenAPI de `/auth/login` e `/auth/totp/verify`.
- Suite completa verde (unit + IT), `./gradlew build` verde, sem migration nova.
- `SEGURANCA.md` §5 conferido contra o comportamento implementado; divergencia fechada.
