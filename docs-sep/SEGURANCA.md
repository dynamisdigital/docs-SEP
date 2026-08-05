# Seguranca da Plataforma SEP

Documento consolidado de seguranca apos a Sprint 5. Reune as decisoes, fluxos e
componentes que implementam o endurecimento de autenticacao do produto SEP em
conformidade com a Resolucao CMN 4.656/2018, NIST SP 800-63B e OWASP
Authentication Cheat Sheet.

Origem: `docs-sep/PRD.md` §14, `specs/fase-2/005-sprint-5-endurecimento-seguranca.md`,
`steps-fase-2/backend/005-sprint-5-steps.md`,
`steps-fase-2/backend/005-sprint-5-followups-seguranca-steps.md`,
ADR 0009 e ADR 0010.

> **Atualizacao 2026-05-12**: incorporados os follow-ups
> 5F-FIX-01/02/03/04/05/06 (code review pos-merge da Sprint 5). Veja §16 para
> a mudanca de contrato no cadastro publico, refresh via cookie HttpOnly,
> enforcement server-side de redefinicao de senha, transicao atomica de
> refresh, CORS para step-up e fallback TOTP mobile.

## 1. Camadas de autenticacao

| Camada | Tecnologia | Onde vive |
|---|---|---|
| Senha | BCrypt + `PasswordPolicy` (12+ chars OU passphrase) + HIBP | `identity.domain.vo.PasswordPolicy` |
| MFA TOTP | RFC 6238 via `googleauth:1.5.0` | `identity.infrastructure.totp.GoogleAuthAdapter` |
| Backup codes | 10 codigos uso unico, hash BCrypt | `identity.application.service.BackupCodeService` |
| Biometria mobile | `@capacitor-community/biometric-auth` (planejado) | `sep-mobile/.../biometric.service.ts` (stub PWA) |
| Step-up | TOTP/backup code -> token efemero 5 min | `identity.application.usecase.{Iniciar,Completar}StepUpUseCase` |
| Sessao | Access JWT 15 min + Refresh rotativo 30 dias (cookie WEB / body MOBILE) | `JwtTokenProvider` + `RefreshTokenService` + `RefreshCookieService` (5F-FIX-02) |
| Reset obrigatorio | Claim `password_reset_required` + filter server-side | `PasswordResetEnforcementFilter` (5F-FIX-04) |

## 2. Politica de senha

Regras avaliadas em `PasswordPolicy`:

- **Comprimento**: minimo 12 caracteres; OU
- **Passphrase**: minimo 4 palavras separadas por espaco, cada palavra com 3+ caracteres
- Senha vazia/null: rejeitada com `SenhaFracaException` (`AUTH-400-101`)
- Senha presente em vazamentos publicos (HIBP k-anonymity API): rejeitada com
  `SenhaComprometidaException` (`AUTH-400-102`)

Sem requisito artificial de complexidade (sem regra de "letra maiuscula +
digito + simbolo"), seguindo NIST SP 800-63B §5.1.1.2.

### Adapter HIBP

- Porta: `identity.application.port.out.PasswordBreachChecker`
- Default em dev-local: `NoopPasswordBreachChecker` (sempre retorna `false`)
- Real: `HaveIBeenPwnedClient` ativado por `app.security.hibp.enabled=true`
- Envia apenas os 5 primeiros caracteres do SHA-1 hex; nenhuma senha em claro
  vai pra rede.

## 3. MFA TOTP

### Setup (usuario autenticado)

1. `POST /api/v1/auth/totp/setup` -> retorna `secretBase32`, QR code data URL,
   10 backup codes. Backup codes sao exibidos uma unica vez.
2. Usuario configura no app autenticador (Google Authenticator, Authy, 1Password).
3. `POST /api/v1/auth/totp/confirm` com o primeiro codigo gerado ->
   `MfaStatus.PENDENTE` vira `ATIVO`; `Usuario.mfaHabilitado=true`.

### Verificacao no login

1. `POST /api/v1/auth/login` com senha -> se MFA ATIVO, response devolve
   `mfaRequired=true` e `mfaChallengeId` (UUID v6, TTL 5 min, in-memory store
   `MfaChallengeService`).
2. Cliente apresenta TOTP ou backup code em `POST /api/v1/auth/totp/verify`
   com `mfaChallengeId`. Em sucesso, conclui o login e emite access + refresh.

### Persistencia de secret

- Secret TOTP guardado em `usuario_totp_secret.secret_cifrado` (AES-256/GCM com
  chave derivada de `app.security.totp.encryption-key`).
- Backup codes guardados em `usuario_backup_code.codigo_hash` (BCrypt). Cada
  codigo usado vira `usado=true` e nao reaceita.

### Desabilitar

- `POST /api/v1/auth/totp/disable` exige senha atual + step-up token.
- Apaga backup codes e marca `Usuario.mfaHabilitado=false`.

## 4. Refresh token rotativo

- Access JWT vive 15 min (`app.jwt.access-expiration-seconds`).
- Refresh token vive 30 dias (`app.jwt.refresh-expiration-seconds`).
- Cada login emite refresh `familia` nova; cada `/auth/refresh` rotaciona o
  token (mesma familia, novo `tokenHash`) e marca o anterior como `USADO`.
- Persistencia: somente `tokenHash` SHA-256 hex; o cru e devolvido uma unica
  vez ao cliente.

### Canal de entrega (5F-FIX-02)

A entrega do refresh diferencia o canal cliente via header
`X-Client-Channel: WEB|MOBILE` (default `MOBILE` para compat com clientes
antigos):

- **WEB**: refresh viaja em `Set-Cookie sep-refresh` (HttpOnly, SameSite,
  Secure-configuravel, Path `/api/v1/auth`); body de `TokenResponse` omite o
  campo `refreshToken`. Refresh e logout aceitam o token via cookie ou body
  (cookie tem prioridade quando body vier vazio); logout WEB devolve
  `Set-Cookie Max-Age=0` para limpeza.
- **MOBILE**: refresh continua no body (`TokenResponse.refreshToken`), porque
  apps nativos persistem via Capacitor Preferences; cookie nao se aplica.

Implementacao backend: `ClientChannel` + `RefreshCookieService` em
`identity.application`/`identity.infrastructure.security`. Propriedades em
`app.refresh-cookie.*` (`name`, `path`, `secure`, `same-site`, `domain`).

### Reuse detection

Se um refresh token marcado como `USADO` for reapresentado:
1. Toda a familia (`familyId`) e marcada `REVOGADO`.
2. Evento `REFRESH_REUSE_DETECTED` gravado em `audit_log_seguranca`.
3. Cliente recebe 401; pre-requisito para re-login.

Politica aceita: o usuario podera ter sido alvo de roubo do refresh; melhor
forcar re-autenticacao.

### Concurrency-safe (5F-FIX-06)

A transicao `ATIVO -> USADO` no banco e feita por UPDATE condicional
(`RefreshTokenRepository.marcarUsadoSeAtivo`):

```sql
UPDATE refresh_token SET status = 'USADO', usado_em = :agora
WHERE token_hash = :hash AND status = 'ATIVO'
```

Apenas a primeira transacao concorrente recebe `rows=1` e emite o novo par;
a segunda recebe `rows=0` e cai no caminho de reuse detection (revoga a
familia + audita). Impede que duas chamadas simultaneas com o mesmo refresh
recebam dois pares validos.

### Logout

- `POST /api/v1/auth/logout` revoga o refresh token atual (idempotente).
- `POST /api/v1/auth/logout-all` revoga toda a frota do usuario.

## 5. Rate limit e lockout

### Rate limit (`RateLimitFilter`)

- Em `POST /api/v1/auth/login`: 10 requests por minuto por IP (Sprint 33; era 5).
- Em `POST /api/v1/auth/totp/verify`: 10 requests por minuto por IP (Sprint 33; era 5).
- **Invariante (Sprint 33)**: os limites por IP devem ser estritamente
  **maiores** que `lockout.max-attempts`. O filtro roda antes do controller;
  com os dois valores em 5, a 6a tentativa — a unica capaz de responder `423`
  — era barrada com `429` e o cliente nunca via o bloqueio. O rate limit
  protege o servico; quem protege a conta e o lockout.
- **Validada no boot desde a Sprint 34** (`RateLimitLockoutValidator`,
  `BeanFactoryPostProcessor`): a aplicacao nao sobe com `rate-limit <=
  max-attempts`, citando property, valor e regra. Ate entao a invariante vivia
  num comentario do `application.yml` e num assert de teste, e as cinco env vars
  podiam quebra-la em silencio em qualquer ambiente. Le pelo `Binder`, e nao por
  `getProperty`, para enxergar o mesmo relaxed binding que o
  `@ConfigurationProperties` usa — senao um override em camelCase ficaria
  invisivel ao validador e visivel ao runtime.
- Os **defaults do POJO** `RateLimitProperties` eram `5`, iguais a
  `max-attempts`: os proprios defaults violavam a invariante e so o
  `application.yml` (10) segurava. Corrigidos para 10 na Sprint 34.
- Backend: um `RateLimiter` do Resilience4j por chave `login:<ip>` /
  `totp-verify:<ip>`. Desde a Sprint 34 vivem num mapa **LRU por ordem de
  acesso com teto de 10.000**; antes era get-or-create sem TTL nem teto, e como
  a origem e escolhida pelo cliente (ver abaixo) a heap crescia sem limite. A
  entrada mais antiga em acesso e a que tem mais chance de ja estar cheia, e
  limitador cheio e indistinguivel de recem-criado, entao a evicção nao devolve
  orcamento a ninguem.
- **A origem nao e confiavel.** Com `server.forward-headers-strategy: framework`
  o `ForwardedHeaderFilter` consome o `X-Forwarded-For` e copia o primeiro token
  — sem allowlist de proxy — para o `getRemoteAddr()`. Quem escolhe o valor e o
  cliente, nos dois caminhos. Fechar isso e mudanca de configuracao
  (`forward-headers-strategy: native` com `server.tomcat.remoteip.internal-proxies`
  restrito ao CIDR do balanceador) e segue como follow-up. A Sprint 34 limitou o
  **tamanho** a 45 chars (o mesmo de `login_attempt.ip`), porque um token de 8 KB
  inflava a memoria do mapa em mais de 20x e estourava a coluna, abortando o
  rastro dentro do `REQUIRES_NEW` e devolvendo 500 sem registro.
- Excedido: `429 Too Many Requests` com `ErrorResponseDto` JSON e header
  **`Retry-After`** (Sprint 34) com o **periodo de refresh** do limitador (60s).
  E limite superior deliberado, nao o tempo exato ate a proxima permissao: esse
  valor so existe em `AtomicRateLimiter.getDetailedMetrics().getNanosToWait()`,
  do pacote `internal`, e o `RateLimiter.Metrics` publico nao o expoe.

### Account lockout (`LockoutService`)

- Regra exata (conformidade na Sprint 33): a conta bloqueia quando as 5
  tentativas falhas mais recentes (senha invalida ou TOTP invalido) cabem numa
  janela de 15 minutos. O bloqueio dura 30 minutos **contados da falha que
  fechou a janela** (o evento de bloqueio), nao do envelhecimento das falhas.
  Ate a Sprint 33 a implementacao aproximava por contagem na janela de 30 min
  — bloqueava 5 falhas espalhadas por 25 min e estendia o bloqueio conforme
  falhas antigas saiam da janela.
- Desbloqueio **somente por expiracao** dos 30 minutos. Nao existe desbloqueio
  manual (administrativo ou self-service); senha correta durante o bloqueio
  tambem recebe `423` (o lockout e verificado antes da credencial).
- Sem estado persistido: o bloqueio e derivado de `login_attempt` na leitura.
  `CONTA_BLOQUEADA` **passou a ser escrito na Sprint 34** — ate a 33 nenhuma
  tentativa contra conta bloqueada deixava rastro, porque `verificar()` lanca
  antes de qualquer registro, e uma conta sob ataque durante o bloqueio ficava
  invisivel. Continua **fora** da contagem de falhas: se contasse, cada tentativa
  barrada renovaria o proprio bloqueio (bloqueio auto-perpetuante), e ha teste de
  guarda travando isso.
- HTTP 423 Locked (`ContaBloqueadaException`, codigo `AUTH-423-001`), com header
  **`Retry-After`** (Sprint 34) trazendo os segundos **restantes deste** bloqueio,
  arredondados para cima. Nao se confunde com a `message`, que enuncia a politica
  (30 minutos): um bloqueio que ja correu metade do tempo anuncia a mesma politica
  e uma espera menor. Ate a Sprint 33 o instante do evento existia em
  `PoliticaLockout` mas era descartado, e o `423` anunciava a duracao configurada
  como se fosse a espera restante.
  > `Retry-After` **nao e safelisted pelo CORS**. Para o browser conseguir le-lo,
  > ele precisa constar em `app.cors.exposed-headers` — sem isso o
  > `headers.get('Retry-After')` devolve `null` no `sep-app`/`sep-mobile`, que sao
  > origens distintas da API, e nenhum IT percebe (RestAssured nao aplica CORS).
- Audit `LOCKOUT` + email sao emitidos **na transicao** (quando a falha
  recem-registrada e a que trancou a conta), uma vez por evento de bloqueio,
  em transacao propria (`REQUIRES_NEW`) — o registro da tentativa e o audit
  sobrevivem ao rollback do `BadCredentialsException` do chamador (dev-local:
  `LogEmailService` apenas registra; em ambientes reais, integrar SES/SMTP).
- **Risco residual aceito (Sprint 33)**: cumprir a regra documentada torna o
  sistema 2x mais permissivo contra brute force lento — para nunca bloquear,
  o atacante passa de 4 falhas/30 min (192/dia/conta) para 4 falhas/15 min
  (384/dia/conta), e o rate limit por IP nao restringe ataque distribuido.
  Controle compensatorio (backoff exponencial ou rate limit por conta)
  **segue aberto**: ficou fora da Sprint 33 e tambem da 34, por exigir ADR.
  A Sprint 34 nao mudou a exposicao — o atacante otimo nunca dispara o `423`,
  entao o `Retry-After` e o endpoint de politica nao lhe acrescentam capacidade.

### O que o usuario ve (web, F-Sprint 21)

O backend so protege a conta; quem informa o usuario e o front. Registrado aqui
porque o defeito corrigido em 2026-07-30 passou 28 sprints despercebido — a
politica estava documentada e implementada, mas a jornada nunca chegava ao fim.

- **O HTTP status segue sendo o unico discriminador de _categoria_ no fio**, e e
  nele que o cliente deve ramificar. O `ErrorResponseDto` nao tem campo de codigo
  e o `AUTH-423-001` nunca e serializado. O login mapeia
  `400`/`401`/`423`/`429`/rede para mensagens distintas; antes tratava todos como
  senha invalida, entao um usuario com a conta trancada era informado de que
  errou a senha. Desde a Sprint 34 o fio carrega tambem `Retry-After` no `423` e
  no `429` — informacao de _tempo_, nao de categoria.
- **`429` nunca e apresentado como bloqueio.** Rate limit por IP nao tranca
  conta nenhuma; confundir os dois informa um bloqueio inexistente e apaga a
  sessao de quem so tentou rapido demais.
- **O redirect de `423` para `/account-locked` vive so no `errorInterceptor`**
  do `sep-app`, junto com `clearSession()`, e cobre tambem o `423` de
  `/auth/totp/verify`. Nenhum componente duplica essa navegacao.
- **`/account-locked` nao pode prometer o que o backend nao faz**: informa o
  numero de tentativas, a janela e a duracao **vindos do endpoint de politica**
  (F-Sprint 23), contados da ultima tentativa, mais o desbloqueio automatico e a
  inexistencia de liberacao manual. Nao cita suporte, reenvio nem revisao de
  dispositivos — nao existe endpoint de unlock, nem recuperacao de senha para
  usuario nao autenticado, nem tela de sessoes.
  O texto de **fallback** — usado entre o primeiro paint e a resposta, e sempre
  que a consulta falha — diz "por um periodo limitado" e **nao cita numero**: ele
  e o estado inicial de toda renderizacao, e um literal mentiria sob override de
  ambiente para quem le a tela antes da resposta chegar, inclusive leitor de
  tela, que nao ouve a correcao (a troca e um text node sem live region).
- **O valor de `lockout-minutes` e sobrescrevivel por ambiente.** O login ecoa o
  `message` do backend, entao acompanha um override; `/account-locked` nao — o
  interceptor descarta o erro ao navegar — e por isso fixava 30 no texto.
  **Entregue na Sprint 34**: `GET /api/v1/auth/politica-lockout`, publico e
  somente leitura, devolve `maxAttempts`/`windowMinutes`/`lockoutMinutes`
  **efetivos** do ambiente, derivados da mesma `PoliticaLockout` que o
  `LockoutService` aplica. `permitAll` **por metodo** (`GET`): escrita no mesmo
  path continua exigindo autenticacao. **Consumido pela F-Sprint 23** (era a Task
  F-22.6), que fecha o texto fixo em `/account-locked`.
  > **Armadilha, resolvida na F-Sprint 23**: o `authInterceptor` isentava apenas
  > `/auth/login`. Reload ou navegacao direta a `/account-locked` com token velho
  > no storage mandava o token e levava `401` do `JwtAuthenticationFilter`.
  > **A consequencia registrada aqui antes estava subestimada**: nao era "cair de
  > volta no texto fixo". O `errorInterceptor` isenta do redirect de `401` so
  > `/auth/login`, entao o `401` dispara `clearSession()` + `navigateByUrl`
  > (`/login`) e o usuario e **arrancado da pagina** que o `423` acabou de abrir.
  > Corrigido isentando `/auth/politica-lockout`, com teste unitario e e2e.
  >
  > **Segue aberto**: `/auth/totp/verify` tambem e `permitAll` e tambem **nao**
  > esta isento. `handleTokenResponse` retorna cedo no ramo `mfaRequired` sem
  > limpar o token, entao a verificacao de TOTP leva `Authorization` morto, toma
  > `401` e o usuario perde o desafio. Defeito anterior a F-23 e fora do escopo
  > dela; fecha com uma linha no array e um teste.
- **Exposicao aceita.** Dos tres numeros, so `lockoutMinutes` ja saia na
  `message` do `423`. Os outros dois eram legiveis no `/v3/api-docs` — que e
  `permitAll` e fica habilitado em producao —, la com os **defaults fixos no
  codigo**. O incremento real do endpoint e refletir o valor efetivo. Aceito: os
  numeros sao de baixa entropia, o lockout e por conta (spraying nao o dispara),
  um atacante os mede com ~6 tentativas numa conta propria (`POST /api/v1/usuarios`
  e publico), e a alternativa e o cliente adivinhar. Nao ha enumeracao: username
  inexistente grava `USUARIO_INEXISTENTE`, que esta fora de `STATUSES_FALHA`, entao
  **nunca** produz `423`.
- O `sep-mobile` trata o `423` no proprio componente, porque la nao existe esse
  redirect no interceptor; o mock de la ainda nao produz `423` (follow-up).

## 6. Step-up authentication

Operacoes sensiveis (alterar senha, desabilitar MFA, futuras transacoes Pix /
aceitar contrato) exigem segundo desafio TOTP mesmo com sessao ativa.

### Fluxo

1. Cliente chama `POST /api/v1/auth/step-up/initiate` (autenticado) -> recebe
   `stepUpChallengeId` (UUID v6, TTL 5 min, in-memory).
2. Cliente apresenta codigo TOTP/backup em
   `POST /api/v1/auth/step-up/complete` com `stepUpChallengeId`.
3. Backend emite step-up token (32 bytes Base64URL, persistido como SHA-256
   hex em `step_up_token`, TTL 5 min, uso unico).
4. Cliente envia `X-Step-Up-Token: <token>` na proxima request sensivel.
5. `StepUpEnforcementAspect` valida o header, marca token como usado e libera.
   Bypass automatico se usuario ainda nao tem MFA habilitado (compatibilidade
   com migracao de usuarios legados).

### Annotation

```java
@RequireStepUp
@PatchMapping("/{id}/senha")
public ResponseEntity<Void> alterarSenha(...) { ... }
```

Aplicada em:
- `PATCH /api/v1/usuarios/{id}/senha`
- `POST /api/v1/auth/totp/disable`

### Step-up estrito (`@RequireStepUpEstrito`, Sprint 20; ampliado na Sprint 27)

Variante **sem bypass de MFA** de `@RequireStepUp`, para operacoes financeiras de alto risco. O `StepUpEnforcementAspect` ganhou o ramo `aplicarEstrito`: carrega o usuario autenticado e **nega (403) se MFA nao estiver habilitado** antes de validar o token — fecha a janela de emitir step-up, desabilitar MFA dentro do TTL (5 min) e reusar o token. Na pratica, exige MFA ativo do usuario (CLIENTE no aceite; `FINANCEIRO`/`ADMIN` nas operacoes de operador).

Aplicada em:
- `POST /api/v1/pix/desembolsos` (Sprint 20 — desembolso Pix assistido, CMN 4.656/2018);
- `PATCH /api/v1/contratos/{id}/aceite` (Sprint 27 — aceite de contrato pelo tomador);
- `POST /api/v1/contratos/{id}/cancelar` (Sprint 27);
- `POST /api/v1/contratos/{id}/assinar` (Sprint 27 — envio para assinatura digital);
- `POST /api/v1/cobranca/parcelas/{id}/renegociacao` (Sprint 27 — propor renegociacao);
- `PATCH /api/v1/cobranca/renegociacoes/{id}/aceite` (Sprint 27 — aceite de renegociacao).

A Sprint 27 fechou o bloqueio de go-live da Fase 3: os atos legais/financeiros acima **nao tem mais bypass server-side pre-MFA**. O `403` de step-up/MFA usa corpo generico ("Acesso negado", sem UUID nem detalhe interno) e e distinto do `409` de estado dos use cases. `recusarRenegociacao` segue sem step-up (recusa nao gera obrigacao nova).

O `@RequireStepUp` legado mantem o bypass de migracao pre-MFA para operacoes **nao-legais** (parecer de credito, reprocessos backoffice, resolver/ignorar fila, gestao de roles, parametros de governanca, associacao de carteira de credora, reconciliacao de status Pix). Enforcement estrito provado por `PixDesembolsoControllerTest`, `ContratoControllerTest` e `CobrancaInadimplenciaControllerTest` (`@WebMvcTest` com o aspect real: usuario sem MFA -> 403 sem tocar o use case) + `ContratoIT`/`AssinaturaIT`/`RenegociacaoIT` com token real de uso unico.

## 7. Audit log de seguranca

Tabela dedicada `audit_log_seguranca` (separada da auditoria JPA generica) com
retencao minima 90 dias (LGPD Art. 16).

### Tipos de evento

| Tipo | Gravado em | Origem |
|---|---|---|
| `LOGIN_OK`, `LOGIN_FAIL` | `RegistrarTentativaLoginUseCase` | Senha valida/invalida |
| `TOTP_OK`, `TOTP_FAIL` | `RegistrarTentativaLoginUseCase` / `VerificarTotpUseCase` | MFA verify |
| `BACKUP_CODE_USED` | `VerificarTotpUseCase` | Login via backup code |
| `LOCKOUT` | `LockoutService` | Conta entra em lockout (**transicao**, uma vez por evento) |
| `LOCKOUT_TENTATIVA_BARRADA` | `RegistrarTentativaLoginUseCase` (Sprint 34) | Tentativa recusada **durante** o bloqueio, a cada recusa |
| `PASSWORD_CHANGED` | `AlterarSenhaUseCase` | Redefinicao de senha |
| `MFA_ENABLED`, `MFA_DISABLED` | `ConfirmarTotpUseCase` / `DesabilitarTotpUseCase` | Toggle MFA |
| `REFRESH_REUSE_DETECTED` | `RefreshTokenUseCase` | Reuse de refresh marcado USADO |
| `STEP_UP_OK`, `STEP_UP_FAIL` | `CompletarStepUpUseCase` | Step-up TOTP |
| `PIX_WEBHOOK_RECEBIDO`, `PIX_WEBHOOK_PROCESSADO`, `PIX_WEBHOOK_FALHOU` | `PixWebhookAuditListener` (Sprint 19) | Webhook Pix/Celcoin |

Helper centralizado: `AuditLogSegurancaService` (3 overloads de
`gravar(tipo, usuarioId, [ip], [userAgent], [detalhesJson])`).

> `LOCKOUT` e `LOCKOUT_TENTATIVA_BARRADA` sao **fatos distintos** e por isso tipos
> distintos (migration `V60`): "bloqueou agora" e "tentou durante o bloqueio".
> Com o mesmo tipo, separa-los exigiria parsear o `jsonb`, e
> `findByUsuarioIdAndTipoOrderByDataEventoDesc` deixaria de ser util. O caminho de
> `RegistrarTentativaLoginUseCase` **propaga** ip e user-agent; o de
> `LockoutService.avaliarPosFalha` os passa como `null` (o service nao os recebe).
>
> O campo `detalhes` e **serializado** com `ObjectMapper` desde a Sprint 34. Era
> montado por concatenacao de string contra uma coluna `jsonb`, e o `username` vem
> do corpo da request: um username com aspas produzia JSON invalido, que o Postgres
> rejeita na conversao — derrubando a gravacao inteira do rastro, dentro de um
> `REQUIRES_NEW`. O `@Email` do DTO nao protege: a RFC admite local-part entre aspas.

> Webhook Pix (`POST /api/v1/webhooks/celcoin/pix`, Sprint 19): autenticacao por
> HMAC SHA-256 (`WebhookSignatureValidator`, secret `app.webhooks.secrets.celcoin-pix`),
> assinatura invalida -> 401. Idempotencia por `event_id` do payload. A trilha de
> auditoria tem `usuario_id` nulo (sem usuario autenticado) e detalhes JSON apenas
> com `eventId`/`tipo`/`provider` — o payload bruto **nunca** e persistido (so o hash
> SHA-256 em `pix_webhook_event`). Detalhes operacionais em [`repos/sep-api/PIX.md`](../repos/sep-api/PIX.md).

### Esquema (`audit_log_seguranca`)

```sql
id UUID PRIMARY KEY,
tipo VARCHAR(50) NOT NULL,
usuario_id UUID,
ip VARCHAR(45),
user_agent VARCHAR(500),
detalhes JSONB,
data_evento TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
```

Indexes: `(usuario_id, data_evento DESC)` e `(tipo, data_evento DESC)`.

## 8. Migracao de usuarios pre-Sprint 5

- Migration V6 adicionou `precisa_redefinir_senha BOOLEAN DEFAULT FALSE` e
  `mfa_habilitado BOOLEAN DEFAULT FALSE` em `usuario`.
- Script SQL marcou `precisa_redefinir_senha=TRUE` para todos os usuarios
  existentes (que tinham senha de 6 chars sob a politica antiga).
- `UsuarioResponseDto` expoe a flag; frontend redireciona para a tela de
  redefinicao de senha apos login pos-deploy.
- `Usuario.alterarSenha()` zera a flag automaticamente.

### Comunicacao

Template HTML em `src/main/resources/templates/email/seguranca/migracao-senha-mfa.html`.
Recomendado disparar 24-48h antes do deploy avisando:
- Nova politica de senha (12+ chars OU passphrase 4+ palavras)
- Necessidade de habilitar MFA TOTP no primeiro login pos-deploy
- 10 backup codes para imprimir e guardar

## 9. Codigos de erro novos

| Codigo | HTTP | Significado |
|---|---|---|
| `MFA-400-001` | 400 | Setup TOTP nao iniciado |
| `MFA-400-002` | 400 | Codigo TOTP invalido/expirado |
| `MFA-400-003` | 400 | MFA nao habilitado para este usuario |
| `MFA-400-004` | 400 | Desafio MFA invalido ou expirado |
| `MFA-409-001` | 409 | MFA ja habilitado |
| `AUTH-400-101` | 400 | Senha nao atende politica |
| `AUTH-400-102` | 400 | Senha presente em vazamentos publicos |
| `AUTH-401-001` | 401 | Refresh token invalido (via `BadCredentialsException`) |
| `AUTH-403-PASSWORD_RESET_REQUIRED` | 403 | Redefinicao de senha obrigatoria antes de continuar (5F-FIX-04) |
| `AUTH-423-001` | 423 | Conta bloqueada temporariamente |

## 10. Configuracao por ambiente

```yaml
app:
  jwt:
    access-expiration-seconds: ${APP_JWT_ACCESS_EXPIRATION:900}
    refresh-expiration-seconds: ${APP_JWT_REFRESH_EXPIRATION:2592000}
    secret: ${APP_JWT_SECRET:placeholder-dev-only-min-256-bits-key-replace-in-prod-please}
  security:
    totp:
      issuer: ${APP_TOTP_ISSUER:SEP}
      window-size: ${APP_TOTP_WINDOW_SIZE:1}
      encryption-key: ${APP_TOTP_ENCRYPTION_KEY:dev-totp-encryption-key-min-32-bytes-please-change}
    # Invariante Sprint 33: rate limit por IP estritamente > lockout.max-attempts,
    # senao o 423 fica inalcancavel (o filtro barra a 6a tentativa com 429).
    rate-limit:
      login-per-minute-per-ip: ${APP_RATE_LIMIT_LOGIN:10}
      totp-verify-per-minute-per-ip: ${APP_RATE_LIMIT_TOTP_VERIFY:10}
    lockout:
      max-attempts: ${APP_LOCKOUT_MAX_ATTEMPTS:5}
      window-minutes: ${APP_LOCKOUT_WINDOW_MINUTES:15}
      lockout-minutes: ${APP_LOCKOUT_LOCKOUT_MINUTES:30}
    hibp:
      enabled: ${APP_SECURITY_HIBP_ENABLED:false}
      base-url: ${APP_SECURITY_HIBP_BASE_URL:https://api.pwnedpasswords.com}
  # Cookie HttpOnly de refresh token para canal WEB (5F-FIX-02).
  refresh-cookie:
    name: ${APP_REFRESH_COOKIE_NAME:sep-refresh}
    path: ${APP_REFRESH_COOKIE_PATH:/api/v1/auth}
    secure: ${APP_REFRESH_COOKIE_SECURE:false}
    same-site: ${APP_REFRESH_COOKIE_SAME_SITE:Lax}
    domain: ${APP_REFRESH_COOKIE_DOMAIN:}
  cors:
    # 5F-FIX-03: X-Step-Up-Token liberado no preflight; X-Client-Channel
    # adicionado para 5F-FIX-02.
    allowed-headers: Authorization,Content-Type,Idempotency-Key,X-Correlation-Id,X-Step-Up-Token,X-Client-Channel
```

Variaveis obrigatorias em producao (sem default seguro):
- `APP_JWT_SECRET` (>= 32 bytes; Base64 ou UTF-8)
- `APP_TOTP_ENCRYPTION_KEY` (>= 32 bytes; usada como base para AES-256)
- `APP_SECURITY_HIBP_ENABLED=true`
- `APP_REFRESH_COOKIE_SECURE=true` (HTTPS obrigatorio em prod)
- `APP_REFRESH_COOKIE_SAME_SITE=Strict` (ou `Lax` se houver fluxo cross-site
  controlado; nunca `None` sem `Secure=true`)
- `APP_CORS_ORIGINS` sem wildcard quando cookie estiver habilitado

## 11. Tabelas Sprint 5

| Tabela | Origem | Conteudo |
|---|---|---|
| `usuario_totp_secret` | V4 | Secret TOTP cifrado por usuario |
| `usuario_backup_code` | V4 | Backup codes hash BCrypt |
| `refresh_token` | V4 | Refresh tokens com `family_id` |
| `login_attempt` | V4 | Tentativas de login para lockout |
| `step_up_token` | V4 | Tokens efemeros de step-up |
| `audit_log_seguranca` | V4 | Eventos de seguranca (JSONB detalhes) |
| `usuario` (cols novas) | V6 | `precisa_redefinir_senha`, `mfa_habilitado` |

V5 ajustou FKs de V4 para `ON DELETE CASCADE` em tokens MFA e
`ON DELETE SET NULL` em `login_attempt` (preserva historico).

## 12. Componentes web (sep-app)

- `clientChannelInterceptor` (5F-FIX-02): anexa `X-Client-Channel: WEB` e
  `withCredentials: true` em chamadas a `environment.apiBaseUrl`; ignora URLs
  fora da API (anti-vazamento de cookie para CDNs/analytics).
- `AuthService` (refresh via cookie HttpOnly; refresh NUNCA persistido em
  `localStorage`; `pendingMfaChallenge` signal; `applyMfaVerifyResponse`).
- `MfaService` (wrappers HTTP).
- `StepUpTokenStore` + `stepUpInterceptor` (anexa `X-Step-Up-Token`).
- `errorInterceptor` (423 -> `/account-locked`).
- Telas:
  - `/login/verify-totp` — codigo TOTP no login
  - `/account-locked` — 423
  - `/app/profile/setup-totp` — QR code + backup codes
  - `/app/step-up?next=...` — wizard para step-up
  - `/register` -> `RedirectToAppComponent` (canalizacao por perfil)

> 5F-FIX-02 web: `RefreshTokenRequest` e `LogoutRequest` removidos do
> `api.models.ts`; refresh e logout postam com body vazio e cookie
> `sep-refresh` viaja automaticamente via `withCredentials`. Acess token
> continua em `localStorage` por decisao do projeto.

> 5F-FIX-01 web: `UsuarioCreateRequest.role` ficou opcional; cadastro publico
> em `POST /api/v1/usuarios` cria sempre `CLIENTE`. Promocao para ADMIN so
> via `POST /api/v1/admin/usuarios` autenticado.

## 13. Componentes mobile (sep-mobile)

- `clientChannelInterceptor` (5F-FIX-02): anexa `X-Client-Channel: MOBILE` em
  chamadas a `environment.apiBaseUrl`; sem `withCredentials` (cookie nao se
  aplica em app nativo).
- `TokenStorageService` com Capacitor Preferences (access/refresh/trust
  device/pending MFA — refresh continua no body, persistido localmente).
- `AuthService` analogo ao web (refresh + MFA verify + logout HTTP
  fire-and-forget).
- `MfaService` para `/auth/totp/verify`.
- `BiometricService` (stub PWA; plugin nativo `@capacitor-community/biometric-auth`
  entra na fase Android/iOS).
- `StepUpTokenStore` (signal in-memory, uso unico) + `stepUpInterceptor`
  (5F-FIX-05): anexa `X-Step-Up-Token` apenas em `PATCH /usuarios/:id/senha`.
- `StepUpService` envolve `POST /auth/step-up/initiate` e `/complete`.
- `ChangePasswordComponent`: se `currentUser().mfaHabilitado` e
  `StepUpTokenStore` sem token, redireciona para `/app/step-up?next=...`
  antes do PATCH; fallback adicional ao receber 403 com mensagem de step-up.
- Telas:
  - `/login/verify-totp` — codigo TOTP no login + botao biometria
  - `/account-locked` — 423
  - `/app/perfil/biometria` — toggle "confiar neste dispositivo"
  - `/app/step-up?next=...` — fallback TOTP para operacoes sensiveis (5F-FIX-05)

## 14. Pendencias e follow-ups

**Resolvidos em 2026-05-12 (5F-FIX-01..06)**: bloqueio de criacao publica de
ADMIN, refresh em cookie HttpOnly WEB, CORS para `X-Step-Up-Token`,
enforcement server-side de `precisaRedefinirSenha`, step-up TOTP fallback
mobile, transicao atomica concurrency-safe do refresh. Detalhes em §16.

**Fechados em 2026-05-27 (Sprint 15 — Hardening + Bug-Hunt):**

- **Baseline mobile Capacitor 8.3.x** documentado em [ADR 0015](../adr/0015-capacitor-8-3-x-baseline-mobile.md) — status Proposto, sera Aceito quando a Sprint Mobile reabrir e plugins nativos forem re-validados.

**Em aberto (follow-up de hardening / sprint dedicada):**

- Migracao TOTP lib: avaliar substituir `googleauth:1.5.0` por
  `dev.samstevens.totp:totp` para eliminar dep transitiva de
  `org.apache.httpcomponents:httpclient` (Snyk follow-up; constraint atual
  pinada em 4.5.14 ate la). **Sprint 15 nao migrou** — escopo de refactor
  da camada MFA fica em sprint dedicada (impacta `GoogleAuthAdapter`, suite
  de testes MFA Sprint 5).
- Plugin nativo biometria: instalar
  `@capacitor-community/biometric-auth@^7.0.0` na fase Android/iOS e trocar
  stub do `BiometricService`.
- WebAuthn/Passkeys (Nivel 3 do ADR 0010) — futuro.
- Risk-based authentication (geo, device fingerprint avancado) — futuro.
- Captcha — avaliar apos primeiros incidentes em producao.
- Migrar testes do backend de Postgres local via Docker Compose para
  Testcontainers (issue `docker-java` em Testcontainers 1.21.3 com Docker
  Engine 28+ ainda pendente). **Sprint 15 manteve workaround** — necessita
  upgrade `docker-java` >= 3.5.x ou Testcontainers >= 1.22.x (sem release
  estavel checada nesta data).
- E2E cross-repo (web + mobile + API) — cada repo mantem suites locais ate
  pipeline orquestrado existir. **Sprint 15 nao implementou** — exige setup
  cross-repo (Playwright + WireMock + Postgres compartilhado) fora do escopo
  cirurgico de hardening.
- WireMock E2E com `provider=clicksign` (15F-010): gap documentado em
  `AssinaturaIT:75-78`. Sprint 15 mantem cobertura via `FakeAssinaturaDigitalProvider`;
  WireMock integration test fica em sprint dedicada de cobertura adapter HTTP.

## 15. Referencias

- `docs-sep/PRD.md` §14 (Padrao JWT) e §18 (Decisoes Tecnicas Consolidadas)
- `specs/fase-2/005-sprint-5-endurecimento-seguranca.md`
- `steps-fase-2/backend/005-sprint-5-steps.md`
- `steps-fase-2/backend/005-sprint-5-followups-seguranca-steps.md`
- ADR 0009 - Separacao de Canal por Perfil
- ADR 0010 - MFA TOTP + Biometria Mobile
- NIST SP 800-63B - Digital Identity Guidelines
- OWASP Authentication Cheat Sheet
- RFC 6238 (TOTP)
- Resolucao CMN nº 4.656/2018

## 16. Follow-ups 5F (2026-05-12)

Origem: code review pos-merge da Sprint 5; plano executivo em
`steps-fase-2/backend/005-sprint-5-followups-seguranca-steps.md`. Distribuidos
em 4 branches (uma por repo de codigo). Pull-request e push manuais; abaixo,
o estado pos-merge esperado de cada FIX.

### 5F-FIX-01 — Bloquear criacao publica de ADMIN (Critico)

Repo: `sep-api`. Branch: `feature/fix-sprint-5-seguranca` (commit `11fd5e1`,
mergeada em `develop`/`main`).

- `UsuarioCreateDto` perde o campo `role`; `POST /api/v1/usuarios` publico
  cria sempre `Role.CLIENTE` (5F-FIX-01 + Jackson `fail-on-unknown=false` na
  config base, entao payload com `role=ADMIN` e ignorado sem erro).
- Novo endpoint `POST /api/v1/admin/usuarios` (`AdminUsuarioController`) com
  `@PreAuthorize("hasRole('ADMIN')")`; aceita `UsuarioInternoCreateDto`
  (username/password/role) e gera ADMIN ou CLIENTE explicitamente.
- `CriarUsuarioUseCase` ganha `executarInterno`; smoke E2E cobre escalada
  publica negada + endpoint admin protegido.

Cliente web/mobile sao compativeis sem mudanca (continuam enviando
`role=CLIENTE`; backend ignora). `UsuarioCreateRequest.role` ficou opcional
nos tipos TS para sinalizar a mudanca.

### 5F-FIX-02 — Refresh token via cookie HttpOnly no canal WEB (Alto)

Repos: `sep-api` (`feature/fix-sprint-5-seguranca-cookie`, commit `b9da65a`),
`sep-app` (`feature/fix-fsprint-5-seguranca-cookie`, commit `12b6630`),
`sep-mobile` (`feature/fix-msprint-5-seguranca`, commit `d66cd53`).

Backend:

- `ClientChannel` enum (`WEB|MOBILE`) com `fromHeader(...)` default MOBILE.
- `RefreshCookieProperties` + `RefreshCookieService.emitir(canal, body)`:
  WEB recebe `Set-Cookie sep-refresh` (HttpOnly, Path `/api/v1/auth`,
  SameSite configuravel, Secure configuravel) e `body.refreshToken = null`;
  MOBILE recebe body inalterado.
- `AuthController.login/refresh/logout/logout-all` e `MfaController.verify`
  injetam o servico e leem `X-Client-Channel`. `/auth/refresh` e
  `/auth/logout` aceitam o token via cookie OU body (cookie usado quando
  body vier vazio). Logout WEB devolve `Set-Cookie sep-refresh; Max-Age=0`.

Cliente WEB (`sep-app`):

- `clientChannelInterceptor` anexa `X-Client-Channel: WEB` e
  `withCredentials: true` em chamadas `environment.apiBaseUrl` (ignora URLs
  fora pra nao vazar cookie a CDNs/analytics).
- `AuthService` deixa de persistir `SEP_REFRESH_TOKEN`. `refresh()` e
  `logout()` postam corpo vazio; cookie viaja via `withCredentials`.
- Tipos `RefreshTokenRequest` e `LogoutRequest` removidos.

Cliente MOBILE (`sep-mobile`):

- `clientChannelInterceptor` anexa `X-Client-Channel: MOBILE` (sem cookie).
- `TokenStorageService` continua persistindo refresh via Capacitor
  Preferences; nenhuma mudanca de contrato visivel.

### 5F-FIX-03 — CORS para `X-Step-Up-Token` (Alto)

Repo: `sep-api`. `application.yml`: `app.cors.allowed-headers` inclui
`X-Step-Up-Token` (e `X-Client-Channel` para 5F-FIX-02). `CorsConfigTest`
cobre o preflight `PATCH /api/v1/usuarios/{id}/senha`.

### 5F-FIX-04 — Reset obrigatorio server-side (Alto)

Repo: `sep-api`. Decisao: token JWT limitado com claim
`password_reset_required=true`.

- `JwtTokenProvider.gerarToken` adiciona a claim quando
  `Usuario.precisaRedefinirSenha=true`.
- `UsuarioAutenticado` ganha 4o campo `passwordResetRequired` (com construtor
  de conveniencia 3-arg pra preservar callsites legados).
- `PasswordResetEnforcementFilter` (`@Component`, registrado *after*
  `JwtAuthenticationFilter`) responde `403 Forbidden` +
  `AUTH-403-PASSWORD_RESET_REQUIRED` quando o flag esta ativo, exceto para:
  - `GET /api/v1/auth/me`
  - `PATCH /api/v1/usuarios/{id}/senha`
  - `POST /api/v1/auth/logout`
- `Usuario.alterarSenha()` ja zerava o flag; SmokeE2E cobre confinamento +
  libertacao apos PATCH senha.

Codigo de erro novo: `AUTH-403-PASSWORD_RESET_REQUIRED`.

### 5F-FIX-05 — Step-up TOTP fallback mobile (Medio)

Repo: `sep-mobile`. Plug nativo de biometria continua follow-up Android/iOS;
PWA + dev-local usam fallback TOTP.

- `StepUpTokenStore`: signal in-memory, uso unico (`set/consume/clear/hasToken`).
- `stepUpInterceptor`: anexa `X-Step-Up-Token` apenas em
  `PATCH /usuarios/:id/senha`.
- `StepUpService`: `initiate()` + `complete(...)` consomem
  `/auth/step-up/initiate` e `/complete`; em sucesso, persistem token no
  store.
- `StepUpComponent` em `/app/step-up?next=...` (form TOTP/backup code,
  tratamento de erro, redirect anti open-redirect).
- `ChangePasswordComponent`: se `currentUser().mfaHabilitado` e store sem
  token, navega para `/app/step-up?next=/app/perfil/alterar-senha`; fallback
  adicional em 403 com mensagem contendo "step-up".

### 5F-FIX-06 — Refresh token concurrency-safe (Medio)

Repo: `sep-api`. Estrategia: UPDATE condicional no banco.

- `RefreshTokenRepository.marcarUsadoSeAtivo(hash, agora)`:
  `UPDATE refresh_token SET status='USADO', usado_em=:agora WHERE token_hash=:hash AND status='ATIVO'`;
  retorna `rows` (0 ou 1).
- `RefreshTokenUseCase` reescrito: rows=1 → emite novo par; rows=0 →
  recarrega entidade pra classificar (`USADO`=reuse → revoga familia +
  audita; outros estados → 401 silencioso sem revogar).
- Testes deterministicos no `RefreshTokenRepositoryTest` (apenas 1 vencedor
  + REVOGADO/USADO nao afetados) e cenario de corrida no
  `RefreshTokenUseCaseTest`.

### Smoke validacao pos-merge

| Cenario | Resultado esperado |
|---|---|
| `POST /api/v1/usuarios {"role":"ADMIN"}` anonimo | 201 + `role: CLIENTE` |
| `POST /api/v1/admin/usuarios` sem token | 401 |
| `POST /api/v1/admin/usuarios` com CLIENTE | 403 |
| `POST /api/v1/admin/usuarios` com ADMIN | 201 ADMIN |
| Login WEB (`X-Client-Channel: WEB`) | 200 + `Set-Cookie sep-refresh; HttpOnly` + body sem `refreshToken` |
| Login MOBILE | 200 + `refreshToken` no body (sem cookie) |
| `OPTIONS /usuarios/{id}/senha` com `Access-Control-Request-Headers: x-step-up-token` | 200 + header echoa `X-Step-Up-Token` |
| Login com `precisaRedefinirSenha=true` + GET `/api/v1/usuarios` | 403 + `AUTH-403-PASSWORD_RESET_REQUIRED` |
| Mesmo usuario apos PATCH senha + novo login + GET `/api/v1/usuarios` | 200 |
| Refresh concorrente (mesmo cru): 2 chamadas simultaneas | 1 vence (200), 1 perde (401) + familia revogada |
| Mobile alterar senha com MFA ativo | redireciona `/app/step-up?next=/app/perfil/alterar-senha`; pos-step-up, PATCH 204 |

## 17. RBAC cumulativo e governanca de parametros (Sprint 18 — Epic 11)

### Roles cumulativas

Usuario passa a possuir um **conjunto** de roles (`Set<Role>`), resolvendo a pendencia
`FINANCEIRO + BACKOFFICE`. Modelagem:

- Fonte autoritativa: tabela `usuario_role` (`@ElementCollection`, V42 com backfill da role atual).
- `usuario.role` e mantida como **role principal denormalizada**, sincronizada por precedencia
  (`ADMIN > FINANCEIRO > BACKOFFICE > CLIENTE`, via `Role.principalDe`), preservando `getRole()`
  e consumidores legados.
- Compatibilidade JWT: a claim `roles` continua uma **lista de strings** `ROLE_*`, agora com TODAS
  as roles. Tokens legados single-role continuam validos (parsing aceita 1+). `UsuarioAutenticado`
  carrega o conjunto e expoe `temRole(Role)`; emite uma `GrantedAuthority` por role.
- Guards: `@PreAuthorize("hasRole(...)"/"hasAnyRole(...)")` inalterados; checagens em codigo
  migradas de `principal.role()` para `principal.temRole(...)`.

Regras: cadastro publico continua criando apenas `CLIENTE`; criacao interna controlada por ADMIN;
um admin **nao** pode alterar as proprias roles (403); a **ultima** role nao pode ser removida (400).

Endpoints (todos `hasRole('ADMIN')`; mutacoes com `@RequireStepUp`):

| Metodo | Path | Descricao |
|--------|------|-----------|
| GET | `/api/v1/usuarios/{id}/roles` | Consulta o conjunto + principal |
| PUT | `/api/v1/usuarios/{id}/roles` | Substitui o conjunto (nao vazio) |
| POST | `/api/v1/usuarios/{id}/roles/{role}` | Adiciona role |
| DELETE | `/api/v1/usuarios/{id}/roles/{role}` | Remove role (nunca a ultima) |

Endpoint legado `POST /api/v1/usuarios/{id}/role` mantido (substitui o conjunto pela role unica).

Auditoria: `USUARIO_ROLES_ALTERADAS` (payload: alvo + roles anteriores/novas, sem dado sensivel).

### Parametros operacionais governados (modulo `governanca`)

Catalogo versionado e auditavel de limites operacionais criticos. `ParametroOperacional` guarda
valor textual tipado (`INTEGER`/`DECIMAL`/`BOOLEAN`/`STRING`), chave unica e versao; cada alteracao
incrementa a versao e grava `VersaoParametroOperacional` (valor anterior/novo, ator, justificativa).
Concorrencia: lock pessimista na chave + `UNIQUE(parametro_id, versao)`.

Seed inicial (V43, 11 parametros, defaults atuais de `application.yml`): `credito.valor.maximo.pf|pj`,
`credito.prazo.maximo.pf|pj.meses`, `credito.score.pre-aprovacao`, `credito.open-finance.bonus.entradas.altas|minimas`,
`credito.open-finance.penalidade.saldo.negativo`, `backoffice.proposta.pendente.horas`,
`backoffice.contrato.aceito.horas`, `backoffice.webhook.pendente.horas`.

Endpoints (`hasRole('ADMIN')`; `PATCH` com `@RequireStepUp`):

| Metodo | Path | Descricao |
|--------|------|-----------|
| GET | `/api/v1/governanca/parametros` | Lista parametros |
| GET | `/api/v1/governanca/parametros/{chave}` | Detalhe + historico |
| PATCH | `/api/v1/governanca/parametros/{chave}` | Altera valor (validado pelo tipo) |

Auditoria: `PARAMETRO_OPERACIONAL_ALTERADO` (V44). Consumo em regras de negocio: **adocao
incremental** — `credito`/`backoffice` ainda leem properties; a porta `ParametroOperacionalReader`
(com fallback ao default) habilita migracao gradual sem quebrar regras existentes.

## 18. Supply chain de dependencias (D-Sprint 1 — 2026-08-05)

### Numeros antes/depois

Medidos com `npm audit` em `develop`, na branch da sprint. A medicao registrada na spec 300 para o
`sep-mobile` (25 total / 1 critical / 15 high) **nao vale**: foi tirada da branch de feature da M-17,
antes do back-merge. A linha abaixo e a do Gate D-1.0.

| Repo | Momento | critical | high | moderate | low | total |
|---|---|---|---|---|---|---|
| `sep-app` | baseline (Gate, 2026-08-05) | 0 | **12** | 7 | 0 | 19 |
| `sep-app` | final (2026-08-05) | 0 | **0** | 3 | 0 | 3 |
| `sep-mobile` | baseline (Gate, 2026-08-05) | 0 | **11** | 8 | 0 | 19 |
| `sep-mobile` | final (2026-08-05) | 0 | **0** | 8 | 0 | 8 |

**`high` + `critical` foi a zero nos dois repos**, inteiramente dentro da baseline: nenhum major
subido. No `sep-app` a correcao foi o Angular `20.3.26 -> 20.3.27` (o range vulneravel terminava
exatamente em `20.3.26`) mais `@angular/build`/`@angular/cli` `20.3.32 -> 20.3.33`; no `sep-mobile`,
o `npm audit fix` resolveu sozinho, sem tocar o `package.json`. Ionic 8.8.11 e Capacitor 8.4.0
permanecem intactos, conforme [ADR 0019](../adr/0019-baseline-capacitor-8-mobile.md).

Os advisories `high` fechados incluiam *Angular i18n: XSS via event-handler attributes* e
*Cache-Key Ambiguity no `HttpTransferCache`* (reuso de resposta entre requisicoes).

### Divida residual — nenhuma e `high`/`critical`

Todos os itens remanescentes sao `moderate` e **so tem correcao em major**, o que contraria o
[ADR 0018](../adr/0018-avaliacao-angular-22-no-web.md) (Angular 22 adiado, revisao em **2026-09-30**)
ou o ADR 0019. Sao insumo dessa revisao, nao omissao.

| Repo | Pacote | Direto? | Corrige em | Por que nao foi aplicado |
|---|---|---|---|---|
| ambos | `@angular/cli` | sim | `@angular/cli@21.0.4` | major; ADR 0018 |
| ambos | `@hono/node-server` | nao | via `@angular/cli@21.0.4` | transitivo do CLI; major |
| ambos | `@modelcontextprotocol/sdk` | nao | via `@angular/cli@21.0.4` | transitivo do CLI; major |
| `sep-mobile` | `@angular-devkit/build-angular` | sim | `@22.1.3` | major; ADR 0018 |
| `sep-mobile` | `@analogjs/vite-plugin-angular` | sim | `@2.6.4` | major |
| `sep-mobile` | `sockjs`, `uuid`, `webpack-dev-server` | nao | via `@angular-devkit/build-angular@22.1.3` | transitivos; major |

### Gate de CI

Os dois repos passaram a ter gate de `npm audit` no CI, com **limiar explicito no comando**:

```json
"audit": "npm audit --audit-level=high"
```

Roda no job `test` de `CI-APP` e de `CI-MOBILE`. No `CI-MOBILE` fica **so** nesse job: `build` e
`android` instalam do mesmo lock, entao repetir triplicaria o tempo sem cobrir nada a mais.

O limiar e `high`, e nao `total`: `moderate`/`low` frequentemente so tem correcao em major, e um gate
cronicamente vermelho e um gate que o time aprende a ignorar. `moderate` continua visivel na saida.

**Provado que morde**, e nao so instalado: com `--audit-level=low` e com `moderate` o comando sai `1`
nos dois repos; revertido para `high`, sai `0`. Gate nunca visto vermelho e gate nao verificado.

> **O `sep-api` NAO tem cobertura equivalente.** O `build.gradle` nao tem plugin de scan nenhum — so
> `java`, `org.springframework.boot`, `io.spring.dependency-management`, `com.diffplug.spotless` e
> `jacoco`. Medir exigiria **adicionar tooling** (OWASP dependency-check ou equivalente) e configurar
> supressao de falso-positivo, o que e escopo de instalar ferramenta, nao de remediar divida.
> Follow-up nomeado, candidato a sprint propria. Enquanto isso, o backend nao tem deteccao de
> vulnerabilidade de dependencia — nem manual, nem em CI.

### Por que a divida existiu

A F-Sprint 19 zerou o `sep-app` em 2026-07-16 e **ninguem soube que o numero voltara a subir** ate a
medicao manual de 2026-08-03, 18 dias depois. Nao houve regressao de codigo: a contagem saiu identica
em `develop` intocada, entao foi deriva por advisory novo publicado contra dependencia existente.
E exatamente contra isso que o gate acima existe — remediar sem instalar o gate reproduziria a mesma
condicao.
