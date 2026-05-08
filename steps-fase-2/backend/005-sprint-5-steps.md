# Steps - Sprint 5 - Endurecimento de Seguranca

**Spec de origem**: [`specs/fase-2/005-sprint-5-endurecimento-seguranca.md`](../../specs/fase-2/005-sprint-5-endurecimento-seguranca.md)

**Status**: planejada para execucao nos repos `sep-api`, `sep-app` e `sep-mobile`, com ownership principal do backend.

**Objetivo geral**: endurecer autenticacao e sessao antes de qualquer producao, integracao real com Celcoin ou Epic 5. A sprint adiciona MFA TOTP, biometria mobile, refresh token rotativo, rate limit, lockout, nova politica de senha, step-up authentication, audit log de seguranca e canalizacao de cadastro por perfil.

**Esforco total estimado**: 8-12 dias de Dev Senior com apoio de Dev Frontend e Dev Mobile nas tasks 5.8 e 5.9.

**Repos de destino**:
- `sep-api`: backend Spring Boot, owner principal da sprint.
- `sep-app`: frontend web Angular para TOTP, sessao, senha e cadastro web redirecionado.
- `sep-mobile`: Ionic/Angular para biometria e fallback TOTP.

**Branch sugerida por repo**:
- `feature/sprint-5-endurecimento-seguranca`

**Pre-requisitos globais**:
- Sprint 4 backend concluida e verde.
- F-Sprint 4 web concluida.
- M-Sprint 4 mobile concluida.
- ADR 0009 e ADR 0010 aceitos.
- SMTP local ou fake SMTP definido para notificacoes de lockout, refresh reuse e migracao de senha.

**Fora de escopo**:
- WebAuthn/Passkeys.
- Hardware tokens.
- Risk-based authentication avancado.
- Captcha.
- Integracao real com Celcoin.
- Push notification mobile.

---

## Ordem de execucao recomendada

```text
5.0 (prechecks)
 |
 v
5.1 (modelo + migrations + repositories)
 |
 +--> 5.2 (TOTP + backup codes)
 +--> 5.3 (refresh token rotativo)
 +--> 5.4 (rate limit + lockout)
 +--> 5.5 (password policy + HIBP)
 +--> 5.7 (audit log service)
        |
        v
5.6 (step-up auth)
 |
 +--> 5.8 (web MFA + senha + sessao)
 +--> 5.9 (mobile biometria + fallback)
        |
        v
5.10 (migracao usuarios)
 |
 v
5.11 (testes integrados seguranca)
 |
 v
5.12 (documentacao + comunicacao)
 |
 v
5.13 (validacao final)
```

- Tasks 5.2, 5.3, 5.4, 5.5 e 5.7 podem ser paralelizadas depois de 5.1.
- 5.6 depende de TOTP e audit log.
- 5.8 e 5.9 so comecam depois de contratos backend das tasks 5.2, 5.3, 5.5 e 5.6 estabilizados.
- 5.10 deve ficar depois dos fluxos de senha/MFA estarem testados.

---

## Task 5.0 - Prechecks da Sprint 5

**Objetivo**: confirmar que os tres repos estao no estado correto e que os contratos atuais de auth/usuarios estao verdes antes do endurecimento.

**Esforco**: 1-2 horas.

### Step 005.0.1 - Conferir branches e working trees

**Comandos**:
```bash
cd <sep-api-root>
git status --short --branch

cd <sep-app-root>
git status --short --branch

cd <sep-mobile-root>
git status --short --branch
```

**Verificacao**:
- Cada repo esta em branch criada a partir de `develop` atualizado.
- Alteracoes pendentes nao relacionadas devem ser revisadas antes da sprint.
- Nao usar `git add -A`; commits devem ser por paths especificos.

### Step 005.0.2 - Rodar baseline backend

**Comandos**:
```bash
cd <sep-api-root>
./gradlew clean test
./gradlew bootJar
```

**Verificacao**:
- Testes passam.
- Build passa.
- Se Testcontainers/Docker falhar por ambiente, registrar o motivo antes de editar.

### Step 005.0.3 - Rodar baseline web e mobile

**Comandos**:
```bash
cd <sep-app-root>
npm run lint
npm run lint:scss
npm run test
npm run build

cd <sep-mobile-root>
npm run lint
npm run lint:scss
npm run test
npm run build
```

**Verificacao**:
- Suites atuais passam.
- Warnings herdados podem ser registrados, mas erro bloqueia a sprint.

### Step 005.0.4 - Conferir contratos atuais de auth

**Comandos**:
```bash
curl -i http://localhost:8080/actuator/health

curl -i -X POST http://localhost:8080/api/v1/usuarios \
  -H "Content-Type: application/json" \
  -d '{"username":"sprint5-admin@empresa.com","password":"123456","role":"ADMIN"}'

curl -i -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"sprint5-admin@empresa.com","password":"123456"}'
```

**Verificacao**:
- Health retorna `200 OK`.
- Criacao retorna `201 Created` ou `409 Conflict`.
- Login retorna access token com contrato antigo; esse contrato sera evoluido na Task 5.3.

### Definicao de pronto da Task 5.0
- [ ] Tres repos em branches corretas
- [ ] Baseline backend verde
- [ ] Baseline web verde
- [ ] Baseline mobile verde
- [ ] Auth atual validado antes da mudanca

---

## Task 5.1 - Modelagem MFA, refresh e audit log

**Objetivo**: criar as entidades, repositories e migration base que sustentam MFA, refresh token, lockout e audit log.

**Pre-requisito**: Task 5.0 concluida.

**Esforco**: 1-2 dias.

**Arquivos principais no `sep-api`**:
- `identity/domain/model/UsuarioTotpSecret.java`
- `identity/domain/model/UsuarioBackupCode.java`
- `identity/domain/model/RefreshToken.java`
- `identity/domain/model/LoginAttempt.java`
- `identity/domain/model/StepUpToken.java`
- `shared/audit/AuditLogSeguranca.java`
- repositories JPA correspondentes em `infrastructure/persistence`
- migration Flyway `V<n>__criar_tabelas_mfa_seguranca.sql`

### Step 005.1.1 - Adicionar dependencias backend

**Arquivo**: `<sep-api-root>/build.gradle`

**Adicionar**:
```gradle
implementation 'com.warrenstrange:googleauth:1.5.0'
implementation 'com.google.zxing:javase:3.5.3'
implementation 'io.github.resilience4j:resilience4j-spring-boot3'
```

**Verificacao**:
```bash
cd <sep-api-root>
./gradlew dependencies --configuration runtimeClasspath
./gradlew compileJava
```

### Step 005.1.2 - Criar migration Flyway

**Arquivo**: `<sep-api-root>/src/main/resources/db/migration/V<n>__criar_tabelas_mfa_seguranca.sql`

**Tabelas obrigatorias**:
- `usuario_totp_secret`
- `usuario_backup_code`
- `refresh_token`
- `login_attempt`
- `step_up_token`
- `audit_log_seguranca`

**Regras de schema**:
- IDs `uuid`.
- FKs para `usuario(id)` quando aplicavel.
- `RefreshToken.family_id` obrigatorio.
- Backup code deve armazenar hash, nunca codigo em claro.
- TOTP secret deve armazenar valor criptografado, nunca secret em claro.
- `audit_log_seguranca.detalhes` usa `jsonb`.
- Indexes por `usuario_id`, `data_evento`, `tipo`, `family_id`, token hash e expiracao.

**Verificacao**:
```bash
cd <sep-api-root>
./gradlew test --tests "*SmokeBootTest"
```

### Step 005.1.3 - Criar enums e entidades

**Arquivos esperados**:
- `identity/domain/model/MfaStatus.java`
- `identity/domain/model/RefreshTokenStatus.java`
- `identity/domain/model/LoginAttemptStatus.java`
- `shared/audit/TipoEventoSeguranca.java`

**Tipos obrigatorios de audit log**:
```text
LOGIN_OK
LOGIN_FAIL
TOTP_OK
TOTP_FAIL
BACKUP_CODE_USED
LOCKOUT
PASSWORD_CHANGED
MFA_ENABLED
MFA_DISABLED
REFRESH_REUSE_DETECTED
STEP_UP_OK
STEP_UP_FAIL
```

**Regras**:
- Entidades persistidas estendem `EntidadeAuditavel` quando fizer sentido operacional.
- `AuditLogSeguranca` pode usar `dataEvento` proprio, separado da auditoria JPA generica.
- Nome de tabelas e colunas em portugues, seguindo PRD.

**Verificacao**:
```bash
cd <sep-api-root>
./gradlew compileJava
```

### Step 005.1.4 - Criar repositories e testes JPA

**Arquivos esperados**:
- `UsuarioTotpSecretRepository`
- `UsuarioBackupCodeRepository`
- `RefreshTokenRepository`
- `LoginAttemptRepository`
- `StepUpTokenRepository`
- `AuditLogSegurancaRepository`

**Testes obrigatorios**:
- `UsuarioTotpSecretRepositoryTest`
- `RefreshTokenRepositoryTest`
- `LoginAttemptRepositoryTest`
- `AuditLogSegurancaRepositoryTest`

**Cenarios minimos**:
- Persistir e buscar TOTP por usuario.
- Buscar refresh token por hash.
- Buscar refresh tokens por `familyId`.
- Contar tentativas falhas por usuario/IP e janela.
- Buscar audit log por usuario e tipo.

**Verificacao**:
```bash
cd <sep-api-root>
./gradlew test --tests "*RepositoryTest"
```

### Definicao de pronto da Task 5.1
- [ ] Migration cria todas as tabelas
- [ ] Entidades e enums compilam
- [ ] Repositories existem
- [ ] Testes JPA passam
- [ ] Nenhum secret/codigo/token e persistido em claro

### Commit Task 5.1
```text
feat(identity): modelar mfa refresh e audit log
```

---

## Task 5.2 - TOTP setup, confirm, verify e backup codes

**Objetivo**: implementar MFA TOTP server-side com setup autenticado, confirmacao, verificacao durante login, backup codes e disable protegido.

**Pre-requisito**: Task 5.1 concluida.

**Esforco**: 1-2 dias.

### Step 005.2.1 - Criar adapter TOTP

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/identity/infrastructure/totp/GoogleAuthAdapter.java`

**Comportamento esperado**:
- Gerar secret Base32.
- Gerar `otpauth://totp/SEP:<email>?secret=<secret>&issuer=SEP`.
- Validar codigo TOTP com janela de tolerancia definida.
- Gerar QR code como data URL PNG ou payload base64.

**Configuracoes**:
```yaml
app:
  security:
    totp:
      issuer: SEP
      window-size: 1
      encryption-key: ${SEP_TOTP_ENCRYPTION_KEY}
```

**Verificacao**:
```bash
cd <sep-api-root>
./gradlew test --tests "*GoogleAuthAdapterTest"
```

### Step 005.2.2 - Criar servicos de secret e backup codes

**Arquivos esperados**:
- `identity/application/service/TotpSecretService.java`
- `identity/application/service/BackupCodeService.java`

**Regras**:
- Secret TOTP criptografado antes de persistir.
- Backup codes gerados em 10 unidades de 8 caracteres.
- Backup codes retornados em claro apenas no setup/confirmacao inicial.
- Persistir apenas hash BCrypt dos backup codes.
- Backup code usado vira `usado = true` e nao pode ser reutilizado.

**Verificacao**:
```bash
cd <sep-api-root>
./gradlew test --tests "*BackupCodeServiceTest" --tests "*TotpSecretServiceTest"
```

### Step 005.2.3 - Criar use cases TOTP

**Arquivos esperados**:
- `HabilitarTotpUseCase.java`
- `ConfirmarTotpUseCase.java`
- `VerificarTotpUseCase.java`
- `DesabilitarTotpUseCase.java`

**Regras**:
- `setup`: gera secret pendente, QR e backup codes.
- `confirm`: valida primeiro codigo TOTP e marca MFA habilitado.
- `verify`: aceita codigo TOTP ou backup code durante login.
- `disable`: exige senha valida e step-up token valido quando Task 5.6 estiver pronta.
- Eventos de sucesso/falha gravam audit log via Task 5.7; ate la, deixar chamada preparada.

**Verificacao**:
```bash
cd <sep-api-root>
./gradlew test --tests "*TotpUseCaseTest" --tests "*VerificarTotpUseCaseTest"
```

### Step 005.2.4 - Criar MfaController

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/identity/web/controller/MfaController.java`

**Endpoints**:
- `POST /api/v1/auth/totp/setup`
- `POST /api/v1/auth/totp/confirm`
- `POST /api/v1/auth/totp/verify`
- `POST /api/v1/auth/totp/disable`

**DTOs esperados**:
- `TotpSetupResponseDto`
- `TotpConfirmRequestDto`
- `TotpVerifyRequestDto`
- `TotpVerifyResponseDto`
- `TotpDisableRequestDto`

**Regras de seguranca**:
- `setup`, `confirm`, `disable`: autenticados.
- `verify`: publico, mas exige `mfaChallengeId` emitido apos senha correta no login.

**Verificacao**:
```bash
cd <sep-api-root>
./gradlew test --tests "*MfaControllerTest"
```

### Definicao de pronto da Task 5.2
- [ ] TOTP gera secret, QR e otpauth URL
- [ ] Backup codes sao gerados e usados uma unica vez
- [ ] Setup/confirm/verify/disable existem
- [ ] Secrets/codes nao vazam em logs
- [ ] Testes de use case e controller passam

### Commit Task 5.2
```text
feat(identity): adicionar mfa totp
```

---

## Task 5.3 - Refresh token com rotacao

**Objetivo**: substituir sessao somente com access token por access token curto + refresh token rotativo com deteccao de reuso.

**Pre-requisito**: Task 5.1 concluida.

**Esforco**: 1-2 dias.

### Step 005.3.1 - Atualizar propriedades JWT

**Arquivos**:
- `<sep-api-root>/src/main/resources/application.yml`
- config de propriedades JWT existente

**Valores esperados**:
```yaml
app:
  jwt:
    access-expiration-seconds: 900
    refresh-expiration-seconds: 2592000
```

**Regra**:
- Manter compatibilidade de nome antigo apenas se necessario, com deprecation no README.
- Access token deve continuar incluindo `sub`, `email`, `roles` e nova claim `channel` quando Task 5.10 estiver pronta.

### Step 005.3.2 - Criar use cases de refresh/logout

**Arquivos esperados**:
- `RefreshTokenUseCase.java`
- `LogoutUseCase.java`
- `LogoutAllUseCase.java`
- `RefreshTokenService.java`

**Regras**:
- Refresh token armazenado como hash no banco.
- Login cria refresh token com `familyId`.
- Refresh valido marca token anterior como usado/revogado e emite novo refresh na mesma familia.
- Reuso de refresh token usado revoga toda a familia e grava `REFRESH_REUSE_DETECTED`.
- Logout revoga refresh atual.
- Logout all revoga toda a familia/todos tokens do usuario.

**Verificacao**:
```bash
cd <sep-api-root>
./gradlew test --tests "*RefreshTokenUseCaseTest" --tests "*LogoutAllUseCaseTest"
```

### Step 005.3.3 - Atualizar AuthController e DTOs

**Arquivos esperados**:
- update em `AuthController.java`
- update em `TokenResponseDto.java`
- novos DTOs `RefreshTokenRequestDto`, `LogoutRequestDto`

**Endpoints**:
- `POST /api/v1/auth/login`: retorna `accessToken`, `refreshToken`, `tokenType`, `expiresIn`, `usuario`, `mfaRequired`, `mfaChallengeId`.
- `POST /api/v1/auth/refresh`: recebe refresh token e retorna novo access + refresh.
- `POST /api/v1/auth/logout`: revoga refresh token atual.
- `POST /api/v1/auth/logout-all`: revoga todos os refresh tokens do usuario.

**Regra de MFA**:
- Se usuario tiver MFA habilitado, login com senha correta nao retorna access token final; retorna `mfaRequired=true` e `mfaChallengeId`.
- `totp/verify` conclui o login e retorna tokens.

**Verificacao**:
```bash
cd <sep-api-root>
./gradlew test --tests "*AuthControllerTest"
```

### Definicao de pronto da Task 5.3
- [ ] Access token expira em 15 min
- [ ] Login/verify retornam refresh token quando aplicavel
- [ ] Refresh rotaciona token
- [ ] Reuso revoga familia
- [ ] Logout e logout-all funcionam
- [ ] Testes passam

### Commit Task 5.3
```text
feat(identity): implementar refresh token rotativo
```

---

## Task 5.4 - Rate limiting e account lockout

**Objetivo**: reduzir brute-force e credential stuffing com rate limit por IP/usuario e bloqueio temporario de conta.

**Pre-requisito**: Task 5.1 concluida.

**Esforco**: 1 dia.

### Step 005.4.1 - Configurar rate limit

**Arquivos esperados**:
- `identity/infrastructure/security/RateLimitConfig.java`
- propriedades em `application.yml`

**Configuracao esperada**:
```yaml
app:
  security:
    rate-limit:
      login-per-minute-per-ip: 5
      totp-verify-per-minute-per-user: 5
```

**Regras**:
- `/auth/login`: limite por IP.
- `/auth/totp/verify`: limite por usuario/challenge.
- Ao exceder, retornar `429 Too Many Requests` no `ApiExceptionHandler`.

### Step 005.4.2 - Implementar LockoutService

**Arquivos esperados**:
- `RegistrarTentativaLoginUseCase.java`
- `LockoutService.java`
- update em `AutenticarUsuarioUseCase.java`

**Regras**:
- 5 tentativas falhas em janela de 15 min bloqueiam por 30 min.
- Tentativa durante lockout retorna erro especifico `Conta bloqueada temporariamente`.
- Login com sucesso limpa/encerra contagem ativa.
- Lockout grava audit log e solicita envio de email.

**Configuracao**:
```yaml
app:
  security:
    lockout:
      max-attempts: 5
      window-minutes: 15
      lockout-minutes: 30
```

### Step 005.4.3 - Criar EmailService minimo

**Arquivo esperado**:
- `shared/email/EmailService.java`

**Regras**:
- Interface de aplicacao simples para envio.
- Implementacao inicial pode ser log/fake em `dev-local`.
- Nao bloquear login por falha de envio; registrar erro operacional.

### Step 005.4.4 - Testar rate limit e lockout

**Testes obrigatorios**:
- `LockoutServiceTest`
- `RateLimitTest`
- testes de `AutenticarUsuarioUseCase` atualizados

**Verificacao**:
```bash
cd <sep-api-root>
./gradlew test --tests "*LockoutServiceTest" --tests "*RateLimitTest" --tests "*AutenticarUsuarioUseCaseTest"
```

### Definicao de pronto da Task 5.4
- [ ] Login tem rate limit por IP
- [ ] TOTP verify tem rate limit por usuario/challenge
- [ ] Conta bloqueia apos 5 falhas em 15 min
- [ ] Lockout expira em 30 min
- [ ] Evento e email de lockout sao disparados
- [ ] Testes passam

### Commit Task 5.4
```text
feat(identity): adicionar rate limit e lockout
```

---

## Task 5.5 - Password policy revisada

**Objetivo**: substituir senha de 6 caracteres por politica NIST-friendly: 12+ caracteres ou passphrase de 4+ palavras, com verificacao haveibeenpwned.

**Pre-requisito**: Task 5.1 concluida.

**Esforco**: 1-2 dias.

### Step 005.5.1 - Criar PasswordPolicy

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/identity/domain/vo/PasswordPolicy.java`

**Regras**:
- Aceita senha com minimo 12 caracteres.
- Aceita passphrase com 4 ou mais palavras separadas por espaco.
- Rejeita senha vazada quando HIBP estiver habilitado.
- Sem regra artificial de maiuscula/numero/simbolo.

**Testes**:
- 12 chars OK.
- 11 chars rejeitado.
- Passphrase 4 palavras OK.
- Passphrase 3 palavras rejeitada.

### Step 005.5.2 - Criar HaveIBeenPwnedClient

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/identity/infrastructure/adapter/HaveIBeenPwnedClient.java`

**Regras**:
- Usar k-anonymity: enviar apenas os 5 primeiros caracteres do SHA-1.
- Comparar sufixos localmente.
- Timeout curto e configuravel.
- Em `dev-local`, permitir fake/desabilitado por propriedade.
- Se API externa falhar, decisao default da Sprint 5: falhar fechado em producao e falhar aberto em `dev-local`.

**Configuracao**:
```yaml
app:
  security:
    password:
      hibp-enabled: true
      hibp-fail-closed: true
```

### Step 005.5.3 - Aplicar policy em cadastro e alteracao de senha

**Arquivos afetados**:
- `CriarUsuarioUseCase.java`
- `AlterarSenhaUseCase.java`
- DTO validations de usuario/senha

**Regras**:
- Cadastro publico/canalizado usa nova policy.
- Alterar senha usa nova policy.
- Mensagens de erro devem ir pelo `ApiExceptionHandler`.
- Remover validacao hardcoded de exatamente 6 caracteres do backend.

### Step 005.5.4 - Preparar flag de reset obrigatorio

**Arquivos afetados**:
- entidade `Usuario`
- migration Flyway
- `MigrarSenhaForcarResetUseCase.java`

**Regras**:
- Adicionar `precisa_redefinir_senha BOOLEAN DEFAULT FALSE`.
- Migration marca usuarios existentes como `TRUE`.
- Login com flag `TRUE` retorna estado que front/mobile usam para forcar redefinicao.
- Apos redefinicao, flag vira `FALSE`.

### Step 005.5.5 - Testar password policy

**Testes obrigatorios**:
- `PasswordPolicyTest`
- `HaveIBeenPwnedClientTest` com mock HTTP/WireMock
- `MigrarSenhaForcarResetUseCaseTest`
- testes de cadastro/alteracao de senha atualizados

**Verificacao**:
```bash
cd <sep-api-root>
./gradlew test --tests "*PasswordPolicyTest" --tests "*MigrarSenhaForcarResetUseCaseTest"
```

### Definicao de pronto da Task 5.5
- [ ] Senha de 6 chars nao e aceita para novas senhas
- [ ] 12+ chars ou passphrase 4+ palavras aceitas
- [ ] HIBP k-anonymity implementado
- [ ] Usuarios existentes sao marcados para reset
- [ ] Testes passam

### Commit Task 5.5
```text
feat(identity): revisar politica de senha
```

---

## Task 5.6 - Step-up authentication

**Objetivo**: exigir segundo desafio fresco para operacoes sensiveis, com token efemero de 5 minutos.

**Pre-requisito**: Tasks 5.1, 5.2 e 5.7 concluidas.

**Esforco**: 1 dia.

### Step 005.6.1 - Criar use cases de step-up

**Arquivos esperados**:
- `IniciarStepUpUseCase.java`
- `CompletarStepUpUseCase.java`

**Regras**:
- `initiate` gera challenge associado ao usuario autenticado.
- `complete` valida TOTP, backup code ou assertiva biometrica do mobile.
- Sucesso emite `stepUpToken` com validade de 5 min.
- Falha grava audit log.

### Step 005.6.2 - Adicionar endpoints no MfaController

**Endpoints**:
- `POST /api/v1/auth/step-up/initiate`
- `POST /api/v1/auth/step-up/complete`

**DTOs**:
- `StepUpInitiateResponseDto`
- `StepUpCompleteRequestDto`
- `StepUpCompleteResponseDto`

### Step 005.6.3 - Criar `@RequireStepUp`

**Arquivos esperados**:
- `identity/infrastructure/security/RequireStepUp.java`
- aspect/interceptor para validar token

**Endpoints sensiveis nesta sprint**:
- `PATCH /api/v1/usuarios/{id}/senha`
- `POST /api/v1/auth/totp/disable`

**Regra**:
- Token pode ir em header `X-Step-Up-Token`.
- Token expirado ou ausente retorna `403`.

### Step 005.6.4 - Testar step-up

**Testes obrigatorios**:
- `IniciarStepUpUseCaseTest`
- `CompletarStepUpUseCaseTest`
- teste de annotation: sem step-up retorna 403; com token valido permite.

**Verificacao**:
```bash
cd <sep-api-root>
./gradlew test --tests "*StepUp*Test" --tests "*RequireStepUp*Test"
```

### Definicao de pronto da Task 5.6
- [ ] Step-up challenge pode ser iniciado
- [ ] Segundo fator valida e emite token efemero
- [ ] Endpoints sensiveis exigem step-up
- [ ] Token expira em 5 min
- [ ] Testes passam

### Commit Task 5.6
```text
feat(identity): exigir step-up em operacoes sensiveis
```

---

## Task 5.7 - Audit log de seguranca

**Objetivo**: centralizar gravacao de eventos de seguranca em tabela dedicada.

**Pre-requisito**: Task 5.1 concluida.

**Esforco**: 4-6 horas.

### Step 005.7.1 - Criar AuditLogSegurancaService

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/shared/audit/AuditLogSegurancaService.java`

**Comportamento esperado**:
- Metodo para registrar evento com tipo, usuario opcional, IP, user-agent e detalhes JSON.
- Nao deve vazar senha, TOTP, backup code, access token ou refresh token.
- Falha ao gravar audit log deve ser logada e, para eventos criticos, propagada conforme politica definida no service.

### Step 005.7.2 - Integrar audit log nos fluxos de seguranca

**Use cases afetados**:
- `AutenticarUsuarioUseCase`
- `VerificarTotpUseCase`
- `RefreshTokenUseCase`
- `LogoutUseCase`
- `LockoutService`
- `AlterarSenhaUseCase`
- `DesabilitarTotpUseCase`
- `CompletarStepUpUseCase`

**Eventos obrigatorios**:
- Login OK/fail.
- TOTP OK/fail.
- Backup code usado.
- Lockout.
- Password changed.
- MFA enabled/disabled.
- Refresh reuse detected.
- Step-up OK/fail.

### Step 005.7.3 - Testar audit log

**Testes obrigatorios**:
- `AuditLogSegurancaServiceTest`
- asserts de eventos nos testes dos use cases criticos.

**Verificacao**:
```bash
cd <sep-api-root>
./gradlew test --tests "*AuditLogSegurancaServiceTest"
```

### Definicao de pronto da Task 5.7
- [ ] Service dedicado existe
- [ ] Eventos obrigatorios sao gravados
- [ ] Secrets nunca sao gravados em detalhes/logs
- [ ] Testes passam

### Commit Task 5.7
```text
feat(shared): registrar audit log de seguranca
```

---

## Task 5.8 - Web MFA, refresh e nova politica de senha

**Objetivo**: atualizar `sep-app` para suportar o novo fluxo web: TOTP, refresh token, step-up, nova senha e register publico redirecionado.

**Pre-requisito**: Tasks backend 5.2, 5.3, 5.5 e 5.6 com contratos estabilizados.

**Esforco**: 1-2 dias.

### Step 005.8.1 - Atualizar contratos e AuthService web

**Arquivos afetados**:
- `<sep-app-root>/src/app/core/api/api.models.ts`
- `<sep-app-root>/src/app/core/auth/auth.service.ts`
- interceptors de auth/error

**Contratos novos**:
- `refreshToken`
- `mfaRequired`
- `mfaChallengeId`
- `stepUpToken`
- DTOs de TOTP setup/confirm/verify.

**Regras web**:
- Refresh token deve ser preferencialmente cookie httpOnly definido pelo backend.
- Se o contrato ainda retornar refresh token no body para dev-local, nao persistir em localStorage em producao.
- 401 tenta refresh uma vez; se falhar, limpa sessao.

### Step 005.8.2 - Criar telas TOTP web

**Arquivos esperados**:
- `features/authenticated/profile/setup-totp/setup-totp.component.*`
- `features/public/login/verify-totp/verify-totp.component.*`

**Comportamento**:
- Setup mostra QR code e backup codes uma unica vez.
- Confirm exige codigo TOTP.
- Verify TOTP completa login apos senha.
- Backup codes devem ter acao de impressao/download local sem reenviar ao backend.

### Step 005.8.3 - Atualizar alterar senha e step-up web

**Arquivos afetados**:
- `features/authenticated/profile/change-password/*`
- componente/modal de step-up

**Regras**:
- Nova policy: 12+ chars ou passphrase.
- Alterar senha inicia step-up se backend retornar exigencia.
- Enviar `X-Step-Up-Token` no PATCH de senha.

### Step 005.8.4 - Desativar register publico web

**Arquivos afetados**:
- `features/public/register/*`
- `features/public/redirect-to-app/*`
- rotas publicas

**Comportamento**:
- `/register` web exibe mensagem direcionando tomador para app mobile.
- Credora deve ver orientacao de convite.
- Nao chamar mais `POST /usuarios` publico pelo web.

### Step 005.8.5 - Testar web

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint
npm run lint:scss
npm run test
npm run build
npm run e2e
```

### Definicao de pronto da Task 5.8
- [ ] Web suporta login com TOTP
- [ ] Web suporta setup TOTP e backup codes
- [ ] Web usa nova policy de senha
- [ ] Step-up funciona para alterar senha
- [ ] Register publico web foi redirecionado
- [ ] Suites web passam

### Commit Task 5.8
```text
feat(web): adicionar mfa e step-up
```

---

## Task 5.9 - Mobile biometria nativa + fallback TOTP

**Objetivo**: atualizar `sep-mobile` para biometria nativa, trust device em Preferences e fallback TOTP.

**Pre-requisito**: Tasks backend 5.2, 5.3, 5.6 e M-Sprint 4 concluida.

**Esforco**: 1-2 dias.

### Step 005.9.1 - Instalar plugin biometric auth

**Comandos**:
```bash
cd <sep-mobile-root>
npm install @capacitor-community/biometric-auth@^7.0.0
npx cap sync
```

**Verificacao**:
```bash
cd <sep-mobile-root>
npm ls @capacitor-community/biometric-auth --depth=0
npm run build
```

### Step 005.9.2 - Criar BiometricService

**Arquivo**: `<sep-mobile-root>/src/app/core/auth/biometric.service.ts`

**Comportamento esperado**:
- Verificar disponibilidade.
- Solicitar autenticacao biometrica.
- Armazenar/remover trust device em Capacitor Preferences.
- Expor fallback para TOTP quando biometria indisponivel ou recusada.

### Step 005.9.3 - Atualizar login e splash mobile

**Arquivos afetados**:
- `core/auth/auth.service.ts`
- `features/public/login/*`
- `features/public/login/verify-biometric/*`
- `features/public/splash/*`

**Regras**:
- Apos senha correta, se backend exigir MFA, mobile tenta biometria quando trust device estiver habilitado.
- Se biometria nao estiver habilitada, ir para TOTP fallback.
- Splash pode reabrir sessao com biometria se houver refresh token/trust device valido.
- Refresh token continua em Preferences.

### Step 005.9.4 - Criar setup biometric no perfil

**Arquivos esperados**:
- `features/authenticated/profile/setup-biometric/setup-biometric.component.*`

**Comportamento**:
- Usuario habilita biometria neste dispositivo.
- UI informa fallback TOTP.
- Validacao manual em device fisico e obrigatoria antes de fechar.

### Step 005.9.5 - Testar mobile

**Verificacao local**:
```bash
cd <sep-mobile-root>
npm run lint
npm run lint:scss
npm run test
npm run build
npm run e2e
```

**Validacao manual obrigatoria**:
- iOS com Face ID/Touch ID.
- Android com Fingerprint.
- PWA fallback TOTP.

### Definicao de pronto da Task 5.9
- [ ] Plugin biometric instalado
- [ ] BiometricService testado
- [ ] Login usa biometria quando disponivel
- [ ] Fallback TOTP funciona
- [ ] Trust device usa Preferences
- [ ] Validacao fisica iOS e Android feita

### Commit Task 5.9
```text
feat(mobile): adicionar biometria mfa
```

---

## Task 5.10 - Migracao e canalizacao de usuarios

**Objetivo**: forcar reset de senha/MFA para usuarios existentes e desativar cadastro publico generico em favor dos canais definidos pela ADR 0009.

**Pre-requisito**: Tasks 5.3, 5.5, 5.8 e 5.9 concluidas.

**Esforco**: 1 dia.

### Step 005.10.1 - Aplicar migracao de flags em Usuario

**Campos obrigatorios**:
- `precisa_redefinir_senha`
- `mfa_habilitado`
- `canal_origem`

**Regras**:
- Usuarios existentes: `precisa_redefinir_senha = TRUE`.
- Usuarios novos: usar nova password policy desde a criacao.
- Usuario so sai de reset obrigatorio apos redefinir senha e iniciar setup MFA.

### Step 005.10.2 - Canalizar cadastro

**Endpoints esperados**:
- `POST /api/v1/usuarios/tomador` publico, validado para canal mobile.
- `POST /api/v1/usuarios/credora/convite` autenticado por admin.
- `POST /api/v1/usuarios/credora/completar-cadastro` publico com token de convite.
- `POST /api/v1/usuarios/interno` autenticado por admin.

**Regra**:
- `POST /api/v1/usuarios` generico deve ficar deprecated ou bloqueado conforme decisao do spec.
- Web register publico deixa de chamar cadastro generico.
- Mobile continua sendo canal do tomador.

### Step 005.10.3 - Validar claim `channel`

**Arquivos afetados**:
- `JwtTokenProvider`
- filtro de seguranca/canal
- DTOs de login/refresh

**Regras**:
- JWT inclui `channel`.
- Backend valida canal em endpoints canalizados.
- `User-Agent`/header customizado pode ser usado como reforco, mas nao como unica fonte de autorizacao.

### Step 005.10.4 - Preparar comunicacao de migracao

**Arquivo esperado**:
- template email de migracao senha/MFA.

**Conteudo minimo**:
- Motivo da mudanca.
- Prazo.
- Instrucoes de redefinicao.
- Orientacao para MFA/backup codes.

### Definicao de pronto da Task 5.10
- [ ] Usuarios existentes forcados a redefinir senha
- [ ] Cadastro generico desativado/deprecated
- [ ] Endpoints canalizados existem
- [ ] JWT carrega `channel`
- [ ] Comunicacao de migracao pronta

### Commit Task 5.10
```text
feat(identity): canalizar usuarios e migrar senha
```

---

## Task 5.11 - Testes integrados de seguranca

**Objetivo**: cobrir os fluxos completos de seguranca no backend, web e mobile.

**Pre-requisito**: Tasks 5.1 a 5.10 concluidas.

**Esforco**: 1-2 dias.

### Step 005.11.1 - Criar suite backend de seguranca

**Cenarios obrigatorios**:
- Setup MFA completo.
- Login com MFA.
- Login com backup code e reuso bloqueado.
- Lockout apos 5 senhas erradas.
- Rate limit em `/auth/login`.
- Refresh token rotaciona.
- Reuso de refresh token revoga familia.
- Step-up exigido para alterar senha.
- Password policy rejeita 11 chars e senha vazada.
- Usuario migrado com senha antiga e forcado a redefinir.

**Verificacao**:
```bash
cd <sep-api-root>
./gradlew test
```

### Step 005.11.2 - Criar E2E web

**Cenarios obrigatorios**:
- Setup TOTP.
- Login senha + TOTP.
- Alterar senha com step-up.
- Register web redirecionado para app.
- Conta bloqueada exibe tela adequada.

**Verificacao**:
```bash
cd <sep-app-root>
npm run e2e
```

### Step 005.11.3 - Criar E2E mobile

**Cenarios obrigatorios**:
- Login mobile com MFA.
- Habilitar biometria.
- Fallback TOTP em PWA.
- Alterar senha com step-up.
- Splash revalida sessao/trust device.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run e2e
```

### Definicao de pronto da Task 5.11
- [ ] Suite backend cobre fluxos criticos
- [ ] E2E web cobre TOTP e step-up
- [ ] E2E mobile cobre biometria/fallback
- [ ] Regressao de auth Sprints 1-4 continua verde
- [ ] Cobertura `identity` >= 80%

### Commit Task 5.11
```text
test(security): cobrir fluxos mfa e refresh
```

---

## Task 5.12 - Documentacao e comunicacao

**Objetivo**: atualizar documentacao tecnica e preparar comunicacao operacional da migracao de seguranca.

**Pre-requisito**: Tasks 5.1 a 5.11 concluidas.

**Esforco**: 4-6 horas.

### Step 005.12.1 - Atualizar docs no sep-api

**Arquivos esperados**:
- `<sep-api-root>/README.md`
- `<sep-api-root>/CONTRIBUTING.md`
- `<sep-api-root>/docs-sep/SEGURANCA.md` se existir pasta local de docs, ou documentar no `docs-SEP/docs-sep/SEGURANCA.md`.

**Conteudo minimo**:
- Como configurar `SEP_TOTP_ENCRYPTION_KEY`.
- Como testar TOTP localmente.
- Como testar refresh token.
- Como simular lockout.
- Como ativar/desativar HIBP em dev-local.

### Step 005.12.2 - Criar template de email

**Arquivo esperado**:
- `<sep-api-root>/src/main/resources/templates/email/seguranca/migracao-senha-mfa.html`

**Conteudo minimo**:
- Aviso de redefinicao de senha.
- Aviso de MFA obrigatorio.
- Prazo e canal de suporte.
- Nao incluir link inseguro sem token de convite/reset.

### Step 005.12.3 - Atualizar docs consolidadas

**Arquivos em `docs-SEP`**:
- `docs-sep/SEGURANCA.md`
- `docs-sep/CONTEXT.md`, apenas se houver decisao nova relevante.
- ADR novo somente se a implementacao divergir da ADR 0010.

**Regra**:
- No repo `docs-SEP`, operacao git e manual. Agente edita, mas nao comita.

### Definicao de pronto da Task 5.12
- [ ] README/CONTRIBUTING atualizados
- [ ] SEGURANCA.md criado
- [ ] Template de email criado
- [ ] Decisoes novas documentadas

### Commit Task 5.12
Nos repos de codigo, mensagem sugerida:
```text
docs(security): documentar mfa e migracao de senha
```

No repo `docs-SEP`, nao commitar automaticamente.

---

## Task 5.13 - Validacao final da Sprint 5

**Objetivo**: fechar o gate de seguranca cross-stack antes da Epic 5.

**Pre-requisito**: Tasks 5.1 a 5.12 concluidas.

**Esforco**: 2-4 horas.

### Step 005.13.1 - Rodar validacao backend completa

**Comandos**:
```bash
cd <sep-api-root>
./gradlew clean test
./gradlew bootJar
```

**Verificacao**:
- Testes verdes.
- JaCoCo `identity` >= 80%.
- OpenAPI sobe com endpoints novos.

### Step 005.13.2 - Rodar validacao web completa

**Comandos**:
```bash
cd <sep-app-root>
npm run lint
npm run lint:scss
npm run test
npm run build
npm run e2e
```

**Verificacao**:
- TOTP e step-up passam.
- Register publico web redireciona.

### Step 005.13.3 - Rodar validacao mobile completa

**Comandos**:
```bash
cd <sep-mobile-root>
npm run lint
npm run lint:scss
npm run test
npm run build
npm run e2e
```

**Verificacao**:
- Biometria/fallback TOTP passam em PWA.
- Validacao fisica iOS e Android registrada manualmente.

### Step 005.13.4 - Revisar arquivos e untracked

**Comandos**:
```bash
cd <sep-api-root>
git status --short
git ls-files --others --exclude-standard

cd <sep-app-root>
git status --short
git ls-files --others --exclude-standard

cd <sep-mobile-root>
git status --short
git ls-files --others --exclude-standard
```

**Verificacao**:
- Nenhum `.env`, coverage, build output, screenshot ou trace entra em commit.
- `git add` sempre com paths especificos.

### Definicao de pronto da Task 5.13
- [ ] Backend verde
- [ ] Web verde
- [ ] Mobile verde
- [ ] E2E seguranca verde
- [ ] Validacao fisica mobile feita
- [ ] Documentacao pronta
- [ ] Gate para Epic 5 liberado

---

## Definicao de pronto da Sprint 5

- [ ] TOTP funcional para web/admin/credora e como fallback mobile
- [ ] Biometria nativa mobile validada em iOS e Android fisicos
- [ ] Backup codes de uso unico
- [ ] Refresh token com rotacao e reuse detection
- [ ] Rate limiting em `/auth/login` e `/auth/totp/verify`
- [ ] Account lockout 5 falhas/15 min com lock de 30 min
- [ ] Nova password policy: 12+ chars ou passphrase 4+ palavras
- [ ] HIBP k-anonymity integrado
- [ ] Step-up authentication em alterar senha e desabilitar MFA
- [ ] Audit log de seguranca cobrindo eventos relevantes
- [ ] Usuarios existentes forcados a redefinir senha e configurar MFA
- [ ] Cadastro publico generico desativado/deprecated e canais separados
- [ ] Web, mobile e backend verdes
- [ ] Cobertura `identity` >= 80%
- [ ] Documentacao e comunicacao de migracao prontas

## Impacto na Sprint 6 / Epic 5

- Onboarding KYC/KYB pode comecar com autenticacao forte.
- Integracao real com Celcoin sandbox fica desbloqueada.
- Open Finance futuro ja tem base de SCA.
- Mobile pode usar biometria em operacoes sensiveis do tomador.

## Referencias

- [Spec 005 - Sprint 5](../../specs/fase-2/005-sprint-5-endurecimento-seguranca.md)
- [ADR 0009 - Separacao de Canal por Perfil](../../adr/0009-separacao-de-canal-por-perfil.md)
- [ADR 0010 - MFA TOTP + Biometria Mobile](../../adr/0010-mfa-totp-com-biometria-mobile.md)
- [Spec 004 - Sprint 4](../../specs/fase-1/004-sprint-4-erros-docs-testes.md)
- [PRD - API SEP](../../docs-sep/PRD.md)
- RFC 6238
- NIST SP 800-63B
- OWASP Authentication Cheat Sheet
- haveibeenpwned API
