# Spec 005 - Sprint 5 - Endurecimento de Seguranca

## Metadados

- **ID da Spec**: 005
- **Titulo**: Sprint 5 - Endurecimento de Seguranca (MFA + Refresh Token + Rate Limit + Lockout + Password Policy)
- **Status**: concluida em 2026-05-11 (backend PR #27 + fix CVE em PR separado; web PR #22; mobile PR #21)
- **Fase do produto**: Epic 4 estendida (Estabilizacao + Endurecimento) — gate para producao e para Epic 5
- **Origem**: PRD §7 RF-01/RF-05, §14, §18; ADRs 0009 e 0010
- **Depende de**: [`004-sprint-4-erros-docs-testes.md`](../fase-1/004-sprint-4-erros-docs-testes.md)
- **Responsavel principal**: Dev Senior

## Objetivo

Endurecer a camada de autenticacao do produto SEP antes de qualquer ambiente de producao ou integracao real com Celcoin. Implementa MFA via TOTP (com biometria nativa no mobile), refresh token com rotacao, rate limiting, account lockout, password policy revisada, step-up authentication e audit log de seguranca. Concretiza a separacao de canal por perfil (ADR 0009) e a politica de MFA (ADR 0010).

Esta Sprint e **gate** para:
- Qualquer ambiente de producao
- Integracao real com Celcoin sandbox
- Epic 5 (Onboarding KYC/KYB)
- Epic 14 Fase Mobile 2+ (jornadas funcionais do tomador)

**Resultado pos-execucao**: gate liberado. A sprint entregou MFA TOTP, refresh token rotativo, lockout, rate limit, password policy revisada, step-up authentication, audit log de seguranca, migracao de usuarios legados, telas web de MFA/step-up e preparacao mobile para biometria/fallback TOTP. A referencia consolidada de operacao e [`docs-sep/SEGURANCA.md`](../../docs-sep/SEGURANCA.md).

## Escopo

### Em escopo

**Backend (foco principal):**
- TOTP server-side com `googleauth` (RFC 6238): setup, verify, disable
- Backup codes (10 codigos de uso unico ao habilitar TOTP)
- Refresh token com rotacao (15min access + 30dias refresh, deteccao de reuso)
- Rate limiting via Resilience4j em `/auth/login`, `/auth/totp/verify`
- Account lockout (5 tentativas/15min → 30min de lockout; notificacao por email)
- Password policy nova (12+ chars OU passphrase; integracao haveibeenpwned k-anonymity)
- Step-up authentication para operacoes sensiveis
- Audit log de seguranca em tabela dedicada (`audit_log_seguranca`)
- Migracao de usuarios existentes (forcar reset de senha no proximo login)
- Validacao de canal de origem das requests (canalizacao por User-Agent + JWT claim `channel`)
- Desativacao do cadastro publico generico; novos endpoints canalizados (tomador via mobile, credora por convite, internos via admin)

**Frontend Web:**
- Tela de setup TOTP (QR code + backup codes para impressao)
- Tela de verify TOTP no login
- Tela de alterar senha com policy nova
- Tela de "sessao expirada" / "conta bloqueada"
- Step-up modal para operacoes sensiveis
- Desativacao da tela de register publico (substituida por mensagem de redirecionamento ao app mobile)

**Mobile:**
- Setup biometria nativa (Face ID, Touch ID, Fingerprint) via `@capacitor-community/biometric-auth`
- Fallback TOTP se biometria desativada
- Tela de re-autenticacao biometrica para step-up
- Storage de "trust device" via Capacitor Preferences

### Fora de escopo nesta Sprint
- WebAuthn/Passkeys (futuro upgrade — ADR 0010 lista como Nivel 3)
- Hardware tokens (YubiKey) (futuro)
- Risk-based authentication (geo, device fingerprint avancado) (futuro)
- Captcha (avaliar na operacao apos primeiros incidentes)
- Suspicious activity detection (futuro)

## Pre-requisitos globais

- Sprint 4 backend concluida (`ApiExceptionHandler` evoluido, OpenAPI completo, JaCoCo target 70%, Webhook Receiver)
- F-Sprint 4 frontend concluida (telas autenticadas iniciais)
- M-Sprint 4 mobile concluida (telas autenticadas iniciais com Capacitor Preferences)
- ADR 0009 (Separacao de Canal) e ADR 0010 (MFA Politica) aceitos
- Smtp configurado para envio de emails (notificacao de lockout, reset de senha)

## Tasks

### Task 5.1 - Modelagem de entidades MFA

**Descricao**
Criar as 4 entidades JPA no modulo `identity.domain.model`, todas estendendo `EntidadeAuditavel` (Sprint 1 Task 1.6). Migrar via Flyway V<n>.

**Arquivos esperados**
- `identity/domain/model/UsuarioTotpSecret.java` (1:1 com `Usuario`, secret encrypted)
- `identity/domain/model/UsuarioBackupCode.java` (N:1 com `Usuario`, hash + usado boolean)
- `identity/domain/model/RefreshToken.java` (N:1 com `Usuario`, family_id para rotacao + reuse detection)
- `identity/domain/model/LoginAttempt.java` (registra cada tentativa de login com IP, status, timestamp)
- `shared/audit/AuditLogSeguranca.java` (eventos de seguranca; separado de auditoria JPA generica)
- `src/main/resources/db/migration/V<n>__criar_tabelas_mfa_seguranca.sql`

**Detalhes**
- `UsuarioTotpSecret.secret`: encrypted-at-rest com chave por ambiente (Spring Cloud Config ou `app.security.totp.encryption-key`)
- `RefreshToken.family_id`: UUID; rotacao mantem mesma familia; reuse detection revoga toda a familia
- `AuditLogSeguranca.tipo`: enum sealed (`LOGIN_OK`, `LOGIN_FAIL`, `TOTP_OK`, `TOTP_FAIL`, `BACKUP_CODE_USED`, `LOCKOUT`, `PASSWORD_CHANGED`, `MFA_ENABLED`, `MFA_DISABLED`, `REFRESH_REUSE_DETECTED`)

**Testes obrigatorios**
- `UsuarioTotpSecretRepositoryTest`, `RefreshTokenRepositoryTest`, `LoginAttemptRepositoryTest`, `AuditLogSegurancaRepositoryTest` (`@DataJpaTest` com Testcontainers)

**Pre-requisitos**: Sprint 4 concluida.

**Responsavel**: Dev Senior.

---

### Task 5.2 - TOTP setup e verify

**Descricao**
Endpoints para habilitar TOTP, verificar codigo no login, e desabilitar TOTP (com re-confirmacao via senha).

**Arquivos esperados**
- `identity/application/usecase/HabilitarTotpUseCase.java` (gera secret, retorna QR code URL + backup codes)
- `identity/application/usecase/VerificarTotpUseCase.java` (validacao de codigo TOTP ou backup code)
- `identity/application/usecase/DesabilitarTotpUseCase.java` (exige senha)
- `identity/web/controller/MfaController.java` com endpoints:
  - `POST /api/v1/auth/totp/setup` (autenticado; gera e retorna QR + backup codes — mostrados uma unica vez)
  - `POST /api/v1/auth/totp/confirm` (autenticado; usuario submete primeiro codigo gerado para confirmar setup)
  - `POST /api/v1/auth/totp/verify` (publico; usado durante login apos validar senha)
  - `POST /api/v1/auth/totp/disable` (autenticado + senha + step-up)
- `identity/infrastructure/totp/GoogleAuthAdapter.java` (wrapper sobre `com.warrenstrange:googleauth`)

**Dependencia Gradle**
```gradle
implementation 'com.warrenstrange:googleauth:1.5.0'
implementation 'com.google.zxing:javase:3.5.3' // para gerar QR code
```

**Testes obrigatorios**
- `HabilitarTotpUseCaseTest` (gera secret diferente para cada usuario)
- `VerificarTotpUseCaseTest` (codigo valido, codigo invalido, codigo expirado, backup code unico, backup code ja usado)
- `MfaControllerTest` (`@WebMvcTest` cobrindo todos os endpoints)

**Pre-requisitos**: Task 5.1.

**Responsavel**: Dev Senior.

---

### Task 5.3 - Refresh token com rotacao

**Descricao**
Implementar refresh token com rotacao automatica e deteccao de reuso. Access token reduz para 15 min.

**Arquivos esperados**
- `identity/application/usecase/RefreshTokenUseCase.java` (valida, rotaciona, detecta reuse)
- `identity/application/usecase/LogoutUseCase.java` (revoga refresh token atual)
- `identity/application/usecase/LogoutAllUseCase.java` (revoga toda a familia)
- update em `JwtTokenProvider`: access token expiration agora 15 min (`app.jwt.access-expiration-seconds: 900`); novo `app.jwt.refresh-expiration-seconds: 2592000` (30 dias)
- `identity/web/controller/AuthController.java` ganha:
  - `POST /api/v1/auth/refresh` (recebe refresh token, retorna novo access + novo refresh)
  - `POST /api/v1/auth/logout` (revoga refresh token atual)
  - `POST /api/v1/auth/logout-all` (revoga todos os refresh tokens do usuario — util em compromisso)

**Comportamento**
- Login retorna `{accessToken, refreshToken, expiresIn}`
- Refresh: valida refresh token; se valido, gera novo access + novo refresh (mesma familia, novo ID); marca o anterior como `usado`
- Reuse detection: se refresh token marcado como `usado` for re-apresentado → revoga TODA a familia + grava `REFRESH_REUSE_DETECTED` em audit log + envia email ao usuario
- Mobile: refresh token armazenado em Capacitor Preferences (Keystore/Keychain)
- Web: refresh token armazenado em cookie httpOnly + sameSite=strict + secure

**Testes obrigatorios**
- `RefreshTokenUseCaseTest` (rotacao funciona; reuse detection revoga familia; expirado e rejeitado)
- `LogoutAllUseCaseTest`
- `AuthControllerTest` (`@WebMvcTest`)

**Pre-requisitos**: Task 5.1.

**Responsavel**: Dev Senior.

---

### Task 5.4 - Rate limiting + Account lockout

**Descricao**
Rate limit em endpoints sensiveis via Resilience4j. Account lockout via entidade `LoginAttempt`.

**Arquivos esperados**
- `identity/infrastructure/security/RateLimitConfig.java` (Resilience4j config)
- `identity/application/usecase/RegistrarTentativaLoginUseCase.java`
- `identity/application/service/LockoutService.java` (verifica se conta esta bloqueada; bloqueia/desbloqueia)
- update em `AutenticarUsuarioUseCase` (Sprint 3): chama `LockoutService.verificar` antes de validar senha; chama `RegistrarTentativaLoginUseCase` apos
- `shared/email/EmailService.java` para notificacao de lockout

**Configuracao**
```yaml
app:
  security:
    rate-limit:
      login: 5 per minute per ip
      totp-verify: 5 per minute per user
    lockout:
      max-attempts: 5
      window-minutes: 15
      lockout-minutes: 30
```

**Testes obrigatorios**
- `LockoutServiceTest` (5 tentativas falhas em 15 min → bloqueia; tempo expira → desbloqueia)
- `RateLimitTest` (`@SpringBootTest` com chamadas em loop, valida bloqueio apos N requests)

**Pre-requisitos**: Task 5.1.

**Responsavel**: Dev Senior.

---

### Task 5.5 - Password policy revisada

**Descricao**
Substituir validacao "exatamente 6 chars" por "minimo 12 chars OU passphrase 4+ palavras" + verificacao haveibeenpwned (k-anonymity API).

**Arquivos esperados**
- `identity/domain/vo/PasswordPolicy.java` (regra de validacao)
- `identity/infrastructure/adapter/HaveIBeenPwnedClient.java` (consulta k-anonymity API; usa primeiros 5 chars do SHA-1 hash)
- update em `CriarUsuarioUseCase`, `AlterarSenhaUseCase` (validacao)
- `identity/application/usecase/MigrarSenhaForcarResetUseCase.java` — flag em `Usuario.precisa_redefinir_senha` ativada para todos os usuarios existentes

**Regras**
- Minimo 12 caracteres OU passphrase de 4+ palavras separadas por espaco
- Sem requisito de complexidade artificial (NIST SP 800-63B)
- Rejeita senhas presentes em haveibeenpwned (>= 1 ocorrencia)
- Feedback visual de forca (zxcvbn opcional)

**Migracao**
- Migration Flyway adiciona coluna `precisa_redefinir_senha BOOLEAN DEFAULT FALSE`
- Script set `TRUE` para todos os usuarios existentes (que tem senha de 6 chars)
- Login com `precisa_redefinir_senha = TRUE` redireciona para forcar tela de redefinicao
- Apos redefinicao, flag vai para `FALSE`

**Testes obrigatorios**
- `PasswordPolicyTest` (12 chars OK, 11 chars rejeitado, passphrase OK, senha vazada rejeitada)
- `MigrarSenhaForcarResetUseCaseTest`

**Pre-requisitos**: Task 5.1.

**Responsavel**: Dev Senior.

---

### Task 5.6 - Step-up authentication

**Descricao**
Operacoes sensiveis exigem segundo desafio (TOTP ou biometria) mesmo com sessao ativa.

**Arquivos esperados**
- `identity/domain/model/StepUpToken.java` (token efemero de 5 min validando que step-up foi feito)
- `identity/application/usecase/IniciarStepUpUseCase.java`
- `identity/application/usecase/CompletarStepUpUseCase.java`
- `identity/web/controller/MfaController.java` ganha:
  - `POST /api/v1/auth/step-up/initiate` (gera challenge)
  - `POST /api/v1/auth/step-up/complete` (valida codigo TOTP ou biometria; emite step-up token)
- Annotation custom `@RequireStepUp` para marcar endpoints sensiveis
- Aspect/interceptor que valida presenca de step-up token valido em endpoints anotados

**Endpoints sensiveis (futuros)**
- `PATCH /api/v1/usuarios/{id}/senha` (alterar senha — agora exige step-up)
- `POST /api/v1/auth/totp/disable` (desabilitar MFA)
- `POST /api/v1/pix/desembolso` (Epic 15 — futuro)
- `POST /api/v1/contratos/{id}/aceitar` (Epic 7 — futuro)

**Testes obrigatorios**
- `IniciarStepUpUseCaseTest`, `CompletarStepUpUseCaseTest`
- Test de annotation: chamada sem step-up → 403; chamada com step-up valido → 200

**Pre-requisitos**: Tasks 5.1, 5.2.

**Responsavel**: Dev Senior.

---

### Task 5.7 - Audit log de seguranca

**Descricao**
Tabela dedicada para eventos de seguranca, separada de auditoria JPA generica.

**Arquivos esperados**
- `shared/audit/AuditLogSeguranca.java` (entidade — ja criada em Task 5.1)
- `shared/audit/AuditLogSegurancaService.java` (helper para gravar eventos)
- Hooks em todos os use cases relevantes (`AutenticarUsuarioUseCase`, `VerificarTotpUseCase`, `RefreshTokenUseCase`, etc.) para gravar eventos

**Esquema**
```sql
CREATE TABLE audit_log_seguranca (
    id UUID PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    usuario_id UUID,
    ip VARCHAR(45),
    user_agent VARCHAR(500),
    detalhes JSONB,
    data_evento TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_seguranca_usuario_data ON audit_log_seguranca(usuario_id, data_evento DESC);
CREATE INDEX idx_audit_seguranca_tipo_data ON audit_log_seguranca(tipo, data_evento DESC);
```

**Retencao**: 90 dias minimo (alinhado com LGPD Art. 16). Job futuro de purge.

**Testes obrigatorios**
- `AuditLogSegurancaServiceTest`

**Pre-requisitos**: Task 5.1.

**Responsavel**: Dev Senior.

---

### Task 5.8 - Frontend Web — Telas de MFA + Password novo

**Descricao**
Implementar no frontend (Spec 104 ja entregue) as 4 novas telas e atualizar tela de alterar senha.

**Arquivos esperados**
- `src/app/features/authenticated/profile/setup-totp/setup-totp.component.ts` (mostra QR code, captura codigo de confirmacao, mostra backup codes)
- `src/app/features/public/login/verify-totp/verify-totp.component.ts` (apos senha, pede codigo TOTP)
- update em `change-password/change-password.component.ts` para nova policy + step-up
- `src/app/features/public/account-locked/account-locked.component.ts`
- `src/app/features/public/redirect-to-app/redirect-to-app.component.ts` (substitui register publico — mostra link para baixar app, instrucoes para credora)
- update em `auth.service.ts` (suporte a refresh token rotativo)

**Testes**
- Vitest cobrindo cada componente
- Playwright E2E: setup TOTP + login com TOTP + alterar senha com step-up

**Pre-requisitos**: Tasks 5.2, 5.3, 5.4, 5.5, 5.6.

**Responsavel**: Dev Pleno Frontend 2 + Dev Senior (revisao).

---

### Task 5.9 - Mobile — Biometria nativa

**Descricao**
Implementar biometria nativa via Capacitor + fallback TOTP.

**Arquivos esperados**
- `<sep-mobile-root>/src/app/core/auth/biometric.service.ts` (wrapper sobre `@capacitor-community/biometric-auth`)
- update em `auth.service.ts` mobile: apos login com senha, oferecer "habilitar biometria neste dispositivo" via biometria + storage de "trust device" em Preferences
- `src/app/features/authenticated/profile/setup-biometric/setup-biometric.component.ts`
- `src/app/features/public/login/verify-biometric/verify-biometric.component.ts` (apos senha, oferece biometria; fallback TOTP se biometria nao disponivel/desativada)
- Para sessoes futuras: app abre → splash → biometria sem senha (se "trust device" + biometria habilitada) → shell

**Pacote**
```json
"@capacitor-community/biometric-auth": "^7.0.0"
```

**Testes**
- Vitest cobrindo `biometric.service.ts`
- Playwright (PWA) — biometria web simulada via WebAuthn (nao testa biometria nativa real, mas cobre o fluxo do componente)
- Validacao manual em device fisico (iOS Face ID + Android Fingerprint) — obrigatorio antes do close da Sprint

**Pre-requisitos**: Tasks 5.1, 5.2, 5.3 backend + M-Sprint 4 entregue.

**Responsavel**: Dev Mobile.

---

### Task 5.10 - Migracao de usuarios existentes

**Descricao**
Forcar reset de senha + setup MFA para todos os usuarios existentes apos a Sprint 5.

**Comportamento**
- Migration Flyway adiciona coluna `precisa_redefinir_senha BOOLEAN DEFAULT FALSE` e `mfa_habilitado BOOLEAN DEFAULT FALSE`
- Script SQL marca `precisa_redefinir_senha = TRUE` para todos usuarios existentes
- Apos login (senha velha aceita), redireciona para forcar redefinicao + setup MFA
- Comunicacao por email avisando os usuarios sobre a mudanca (24-48h antes do deploy)

**Pre-requisitos**: Task 5.5.

**Responsavel**: Dev Senior + comunicacao com PO sobre email aos usuarios.

---

### Task 5.11 - Testes integrados de seguranca

**Descricao**
Suite de testes E2E cobrindo cenarios de seguranca completos.

**Cenarios obrigatorios**
- Setup MFA: login → ir para perfil → habilitar TOTP → escanear QR (mock) → confirmar codigo → ver backup codes
- Login com MFA: senha → TOTP → /me com sucesso
- Login com backup code: senha → backup code → /me com sucesso → backup code marcado como usado
- Lockout: 5 senhas erradas em 15 min → conta bloqueada → 6a tentativa rejeitada → tempo expira → desbloqueada
- Rate limit: 6 requests/min em /auth/login → 6a recebe 429
- Refresh token: usar refresh → novo access + novo refresh; reusar refresh antigo → toda familia revogada + email
- Step-up: alterar senha → exige TOTP → modal de TOTP → senha alterada com sucesso
- Password policy: 11 chars rejeitado; 12 chars OK; senha vazada rejeitada
- Migracao: usuario com senha 6 chars + `precisa_redefinir = TRUE` → forcar tela de redefinicao no login

**Pre-requisitos**: Tasks 5.1-5.10.

**Responsavel**: Dev Senior + Dev Pleno Frontend 2 + Dev Mobile (cada um cobre seu canal).

---

### Task 5.12 - Documentacao + Comunicacao

**Descricao**
Atualizar documentacao do projeto + preparar comunicacao com usuarios existentes (se houver, dependendo do estado em produd).

**Arquivos esperados**
- update `CONTRIBUTING.md`: secao sobre como testar MFA localmente
- novo `docs-sep/SEGURANCA.md`: visao consolidada de seguranca (MFA, refresh token, lockout, audit log, step-up)
- update `README.md`: comandos para subir backend com TOTP test fixture
- email template em `templates/email/seguranca/migracao-senha-mfa.html`

**Responsavel**: Dev Senior.

---

## Grafo de dependencias entre as tasks

```
Sprint 4 concluida
        |
        v
Task 5.1 (entidades MFA + audit)
        |
        +---> Task 5.2 (TOTP) ---+
        +---> Task 5.3 (Refresh) +
        +---> Task 5.4 (Rate + Lockout) +
        +---> Task 5.5 (Password Policy) +
        +---> Task 5.7 (Audit Log) +
                                  |
                                  v
                            Task 5.6 (Step-up) — depende de 5.1, 5.2
                                  |
                                  v
        +---> Task 5.8 (Frontend) -----+
        +---> Task 5.9 (Mobile) --------+
                                  |
                                  v
                            Task 5.10 (Migracao)
                                  |
                                  v
                            Task 5.11 (Testes E2E)
                                  |
                                  v
                            Task 5.12 (Documentacao)
```

## Definicao de pronto da Sprint 5

- TOTP funcional para todos os usuarios (web + mobile + admin)
- Biometria nativa funcional no mobile (validada em iOS + Android fisicos)
- Refresh token com rotacao + reuse detection operacional
- Rate limiting em /auth/login e /auth/totp/verify
- Account lockout funcional (5/15min → 30min)
- Password policy 12+ chars OU passphrase + integracao haveibeenpwned
- Step-up authentication para alterar senha + desabilitar MFA
- Audit log de seguranca registrando todos os eventos relevantes
- Migracao de usuarios existentes forca reset de senha + setup MFA
- Cadastro publico generico desativado; novos endpoints canalizados (tomador via mobile, credora por convite, internos via admin) operacionais
- Suite de testes E2E de seguranca passando (Task 5.11)
- Documentacao atualizada (CONTRIBUTING + SEGURANCA.md + README)
- Cobertura JaCoCo do modulo `identity` >= 80% (mais alto que outros modulos por ser critico)

## Impacto na fase seguinte (Epic 5)

- Onboarding KYC/KYB pode comecar com base segura
- Integracao real com Celcoin sandbox liberada (MFA atende SCA do Open Finance)
- Epic 14 Fase Mobile 2 pode usar biometria nas operacoes do tomador
- Producao fica viavel (apenas pendente Epic 16 - Infraestrutura AWS)

## Restricoes e regras de execucao

- **Nenhum ambiente de producao deve subir antes da Sprint 5 concluida**
- **Nenhuma integracao real com Celcoin (alem de testes WireMock) antes da Sprint 5 concluida**
- Smoke E2E manual em device fisico iOS + Android antes de fechar Task 5.9
- Code review obrigatorio em todas as tasks (Dev Senior + 1 reviewer adicional para tasks de seguranca)
- Tests obrigatorios em cada PR; cobertura nao pode regredir

## Referencias

- [PRD §7 RF-01, RF-05 (Cadastro, Autenticacao)](../../docs-sep/PRD.md)
- [PRD §14 (Padrao JWT — atualizado para refresh token)](../../docs-sep/PRD.md)
- [PRD §18 (Decisoes Consolidadas — atualizado com MFA)](../../docs-sep/PRD.md)
- [PRD §22 (Sprint 5 entre Sprint 4 e Epic 5)](../../docs-sep/PRD.md)
- [PRD §27 (Premissas — atualizadas)](../../docs-sep/PRD.md)
- [ADR 0009 - Separacao de Canal por Perfil](../../adr/0009-separacao-de-canal-por-perfil.md)
- [ADR 0010 - MFA TOTP + Biometria Mobile](../../adr/0010-mfa-totp-com-biometria-mobile.md)
- [Spec 003 - Sprint 3 backend (auth basica)](../fase-1/003-sprint-3-seguranca-autenticacao.md)
- [Spec 004 - Sprint 4 backend (estabilizacao)](../fase-1/004-sprint-4-erros-docs-testes.md)
- RFC 6238 (TOTP)
- NIST SP 800-63B (Digital Identity Guidelines)
- OWASP Authentication Cheat Sheet
- haveibeenpwned API: https://haveibeenpwned.com/API/v3
- googleauth lib: https://github.com/wstrange/GoogleAuth
- @capacitor-community/biometric-auth: https://github.com/capacitor-community/biometric-auth
