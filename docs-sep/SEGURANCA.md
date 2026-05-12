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

- Em `POST /api/v1/auth/login`: 5 requests por minuto por IP.
- Em `POST /api/v1/auth/totp/verify`: 5 requests por minuto por IP.
- Backend: Resilience4j `RateLimiterRegistry` com chave dinamica `login:<ip>` /
  `totp-verify:<ip>`.
- Excedido: `429 Too Many Requests` com `ErrorResponseDto` JSON e header
  Retry-After (futuro).

### Account lockout (`LockoutService`)

- Janela de detecao: 15 minutos. Apos 5 tentativas falhas (senha invalida ou
  TOTP invalido), a conta entra em lockout por 30 minutos.
- HTTP 423 Locked (`ContaBloqueadaException`, codigo `AUTH-423-001`).
- Cada lockout grava `LOCKOUT` em `audit_log_seguranca` e dispara email via
  `EmailService` (dev-local: `LogEmailService` apenas registra; em ambientes
  reais, integrar SES/SMTP).

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

## 7. Audit log de seguranca

Tabela dedicada `audit_log_seguranca` (separada da auditoria JPA generica) com
retencao minima 90 dias (LGPD Art. 16).

### Tipos de evento

| Tipo | Gravado em | Origem |
|---|---|---|
| `LOGIN_OK`, `LOGIN_FAIL` | `RegistrarTentativaLoginUseCase` | Senha valida/invalida |
| `TOTP_OK`, `TOTP_FAIL` | `RegistrarTentativaLoginUseCase` / `VerificarTotpUseCase` | MFA verify |
| `BACKUP_CODE_USED` | `VerificarTotpUseCase` | Login via backup code |
| `LOCKOUT` | `LockoutService` | Conta entra em lockout |
| `PASSWORD_CHANGED` | `AlterarSenhaUseCase` | Redefinicao de senha |
| `MFA_ENABLED`, `MFA_DISABLED` | `ConfirmarTotpUseCase` / `DesabilitarTotpUseCase` | Toggle MFA |
| `REFRESH_REUSE_DETECTED` | `RefreshTokenUseCase` | Reuse de refresh marcado USADO |
| `STEP_UP_OK`, `STEP_UP_FAIL` | `CompletarStepUpUseCase` | Step-up TOTP |

Helper centralizado: `AuditLogSegurancaService` (3 overloads de
`gravar(tipo, usuarioId, [ip], [userAgent], [detalhesJson])`).

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
    rate-limit:
      login-per-minute-per-ip: ${APP_RATE_LIMIT_LOGIN:5}
      totp-verify-per-minute-per-ip: ${APP_RATE_LIMIT_TOTP_VERIFY:5}
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

**Em aberto**:

- ADR de update reformalizando baseline mobile com Capacitor 8.3.x (herdada
  da M-Sprint 0).
- Migracao TOTP lib: avaliar substituir `googleauth:1.5.0` por
  `dev.samstevens.totp:totp` para eliminar dep transitiva de
  `org.apache.httpcomponents:httpclient` (Snyk follow-up; constraint atual
  pinada em 4.5.14 ate la).
- Plugin nativo biometria: instalar
  `@capacitor-community/biometric-auth@^7.0.0` na fase Android/iOS e trocar
  stub do `BiometricService`.
- WebAuthn/Passkeys (Nivel 3 do ADR 0010) — futuro.
- Risk-based authentication (geo, device fingerprint avancado) — futuro.
- Captcha — avaliar apos primeiros incidentes em producao.
- Migrar testes do backend de Postgres local via Docker Compose para
  Testcontainers (issue Docker Engine 28+ ainda pendente).
- E2E cross-repo (web + mobile + API) — cada repo mantem suites locais ate
  pipeline orquestrado existir.

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
