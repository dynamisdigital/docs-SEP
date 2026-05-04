# ADR 0010 - MFA via TOTP + Biometria Mobile + Endurecimento de Autenticacao

## Status

Aceito (2026-04-27). Depende de [ADR 0009 - Separacao de Canal por Perfil](./0009-separacao-de-canal-por-perfil.md).

## Contexto

A autenticacao planejada nas Sprints 1-3 e single-factor (senha + JWT) com:
- Senha de exatamente 6 caracteres (PRD §7 RF-01)
- BCrypt hash
- JWT access token sem refresh token
- Logout client-side

Nenhum mecanismo MFA foi planejado nas Sprints 1-4. Para um produto financeiro regulado pela **Resolucao CMN nº 4.656/2018**, isso e inadequado em producao:

1. **Regulatorio**:
   - LGPD Art. 46: "medidas tecnicas apropriadas para protecao de dados pessoais"
   - BACEN: expectativa crescente de Strong Customer Authentication (SCA), especialmente para Open Finance (Celcoin via Finansystech, Epic 6)
   - PLD/COAF: identificacao forte do usuario e base do compliance

2. **Risco operacional**:
   - Senha de 6 chars + sem rate limiting + sem lockout = brute-force trivial (espaco de busca pequeno demais)
   - Credential stuffing via dados vazados de outros sites compromete contas SEP
   - Compromisso de conta `ROLE_ADMIN` = controle total da gestao (futura governanca da Epic 11)

3. **Industry standard (2026)**:
   - Bancos digitais brasileiros: 100% MFA obrigatorio
   - Celcoin (parceiro BaaS): exige MFA no proprio painel admin
   - SEPs concorrentes: todas tem 2FA

## Decisao

Adotar **MFA com 2 fatores adaptados por canal** (combinado com [ADR 0009 - Separacao de Canal](./0009-separacao-de-canal-por-perfil.md)):

| Canal | Primeiro fator | Segundo fator (MFA) | Backup |
|-------|---------------|---------------------|--------|
| **Mobile (Tomador)** | senha (12+ chars ou passphrase) | **Biometria nativa** (Face ID/Touch ID via Capacitor BiometricAuth) | TOTP (Google Authenticator, etc.) |
| **Web (Empresa Credora)** | senha | **TOTP** (Google Authenticator, Microsoft Authenticator, Authy — RFC 6238) | backup codes |
| **Web (Admin)** | senha | **TOTP obrigatorio** | backup codes; **WebAuthn/Passkey** opcional como upgrade |
| **Web (Financeiro/Backoffice)** | senha | **TOTP obrigatorio** | backup codes |

### Componentes da decisao

#### 1. TOTP como base (RFC 6238)
- Lib Java: `com.warrenstrange:googleauth:1.5.0` (Google Authenticator compatible)
- Secret de 32 caracteres base32 armazenado encrypted no banco (separado do hash de senha)
- Janela de 30s; aceita +/- 1 step para clock drift
- QR code gerado via `otpauth://` URL com issuer "SEP" e account name = email do usuario

#### 2. Biometria nativa no mobile
- Lib Capacitor: `@capacitor-community/biometric-auth` ou `@capgo/capacitor-native-biometric`
- Integra Face ID (iOS), Touch ID (iOS), Fingerprint (Android), Face Unlock (Android)
- Storage seguro de "trust device" via Capacitor Preferences (Keystore/Keychain)
- Fallback para senha se biometria falhar
- Fallback para TOTP se biometria for desativada pelo usuario

#### 3. Backup codes
- 10 codigos de uso unico (8 chars cada) gerados ao habilitar TOTP
- Mostrados uma unica vez para o usuario salvar (impressao/anotacao)
- Armazenados como hash no banco (uso unico — invalida apos uso)
- Cobrem cenario de perda do dispositivo TOTP

#### 4. Rate limiting + Account lockout
- Rate limit em `/auth/login`: 5 tentativas/min/IP (Resilience4j RateLimiter)
- Rate limit em `/auth/totp/verify`: 5 tentativas/min/usuario
- Account lockout: 5 tentativas falhas em 15 min → conta bloqueada por 30 min (com email de notificacao)
- Lockout permanente apos N bloqueios temporarios sequenciais (configuracao operacional)

#### 5. Refresh token com rotacao
- Access token: 15 min de duracao (em vez de 1h atual)
- Refresh token: 30 dias, com rotacao a cada uso (refresh emite novo refresh + invalida o anterior)
- Refresh token armazenado em cookie httpOnly + sameSite=strict (web) ou Capacitor Preferences (mobile)
- Detection de reuso de refresh token: se token antigo for usado, todos os tokens da familia sao revogados (sinal de comprometimento)

#### 6. Password policy revisada
- Substituir "exatamente 6 caracteres" por:
  - Minimo 12 caracteres OU passphrase de 4+ palavras
  - Sem requisito de complexidade artificial (NIST SP 800-63B desencoraja regras tipo "1 maiuscula, 1 numero")
  - Verificar contra haveibeenpwned.com (k-anonymity API) para senhas vazadas
  - Opcional: zxcvbn para feedback de forca
- Migracao gradual: usuarios existentes com senha de 6 chars sao forcados a redefinir no proximo login

#### 7. Step-up authentication
- Operacoes sensiveis exigem segundo desafio (mesmo se ja autenticado):
  - Alterar senha
  - Alterar email
  - Habilitar/desabilitar MFA
  - Iniciar transferencia Pix (Epic 15)
  - Aceitar formalizacao de contrato (Epic 7)
- Mecanismo: re-prompt de TOTP ou biometria com freshness window de 5 min

#### 8. Audit log de seguranca
- Log dedicado para eventos:
  - Login bem-sucedido / falho
  - MFA bem-sucedido / falho
  - Backup code usado
  - Lockout
  - Senha alterada
  - MFA habilitado/desabilitado
  - Refresh token reuso detectado
- Armazenado em tabela `audit_log_seguranca` separada de auditoria JPA generica
- Retencao minima 90 dias (alinhar com LGPD ainda)

## Alternativas consideradas

- **Continuar sem MFA ate "depois"**: descartado. Risco crescente; produto financeiro sem MFA em 2026 e inaceitavel. Adicionar MFA apos producao e mais caro (mudancas de UX, suporte, retreinamento).
- **SMS OTP em vez de TOTP**: descartado como primario. SIM swap e ataque conhecido; SMS pode ser interceptado. TOTP e gratuito, offline, padrao de mercado.
- **Email OTP**: descartado. Email e canal compartilhado com a senha (recuperacao); compromisso de email = compromisso de conta.
- **Push notifications via 3rd party (Auth0, Cognito)**: descartado. Adiciona dependencia externa, custo recorrente, complexidade. TOTP e suficiente.
- **WebAuthn/Passkeys como primario**: descartado para MVP. Suporte ainda misto em 2026; melhor como upgrade path opcional. TOTP cobre 95%+ dos usuarios.
- **Hardware tokens (YubiKey) obrigatorios**: descartado para usuarios externos. Custo + UX. Aceitavel como opcional para admin.

## Consequencias

### Positivas
- Conformidade com expectativas regulatorias (LGPD, BACEN SCA)
- Resistencia a credential stuffing e brute-force
- Reducao drastica do impact de senha vazada
- Audit trail de eventos de seguranca para forensics
- Refresh token com rotacao mitiga roubo de token via XSS (mesmo que o access token seja roubado, expira em 15 min)
- Step-up auth previne abuso quando sessao comprometida
- Biometria mobile melhora UX (uma autenticacao por sessao via Face ID e mais rapida que digitar senha)

### Negativas
- Setup inicial mais complexo para usuario (ler QR code, salvar backup codes)
- Suporte: usuarios que perdem acesso ao TOTP precisam de processo de recuperacao
- Codigo: ~3-4 endpoints novos (`/auth/totp/setup`, `/auth/totp/verify`, `/auth/refresh`, `/auth/logout-all`), tabelas novas (`usuario_totp_secret`, `usuario_backup_code`, `audit_log_seguranca`, `refresh_token`)
- Migracao de senhas existentes (Sprint 5) exige forcar reset
- 4 frentes de teste adicionais (TOTP, biometria, refresh, lockout)

### Neutras
- Integracao com Open Finance (Celcoin) ja exigia SCA — MFA agora e habilitador

## Implementacao

### Sprint 5 - Endurecimento de Seguranca
Detalhada em [`specs/fase-2/005-sprint-5-endurecimento-seguranca.md`](../specs/fase-2/005-sprint-5-endurecimento-seguranca.md). Tasks principais:

1. **Task 5.1**: Modelagem de entidades MFA (`UsuarioTotpSecret`, `UsuarioBackupCode`, `RefreshToken`, `AuditLogSeguranca`)
2. **Task 5.2**: Endpoints de TOTP (`/auth/totp/setup`, `/auth/totp/verify`, `/auth/totp/disable`)
3. **Task 5.3**: Refresh token com rotacao (`/auth/refresh`, `/auth/logout`, `/auth/logout-all`)
4. **Task 5.4**: Rate limiting (Resilience4j) + Account lockout (entidade `LoginAttempt`)
5. **Task 5.5**: Password policy nova (12+ chars OU passphrase, integracao haveibeenpwned)
6. **Task 5.6**: Step-up authentication para operacoes sensiveis
7. **Task 5.7**: Audit log de seguranca (`AuditLogSeguranca`)
8. **Task 5.8**: Frontend web — telas de setup TOTP, verify TOTP, alterar senha (com policy nova)
9. **Task 5.9**: Mobile — biometria nativa via Capacitor + fallback TOTP
10. **Task 5.10**: Migracao de usuarios existentes (forcar reset de senha)
11. **Task 5.11**: Testes (TOTP, biometria, refresh, lockout, rate limit, step-up)
12. **Task 5.12**: Documentacao (CONTRIBUTING.md atualizado, guia de operacao)

### Cronologia
- Sprint 5 entra **entre Sprint 4 e Epic 5 (Onboarding KYC/KYB)**
- Sprint 5 e **gate** para qualquer ambiente de producao
- Sprint 5 e **gate** para integracao real com Celcoin sandbox
- Sprint 5 e **gate** para Epic 14 Fase Mobile 2+ (jornadas funcionais — biometria nas operacoes do tomador exige MFA pronto)

### Versoes
- `com.warrenstrange:googleauth:1.5.0` (TOTP server-side)
- `@capacitor-community/biometric-auth:^7.x` (mobile biometria)
- Resilience4j ja declarado (ADR 0008 / spec 001 Task 1.7)

## Referencias

- [PRD §7 RF-01 (Cadastro), RF-05 (Autenticacao)](../docs-sep/PRD.md)
- [PRD §14 (Padrao JWT)](../docs-sep/PRD.md)
- [PRD §18 (Decisoes Consolidadas)](../docs-sep/PRD.md)
- [PRD §27 (Premissas)](../docs-sep/PRD.md)
- [Spec 005 - Sprint 5 Endurecimento de Seguranca](../specs/fase-2/005-sprint-5-endurecimento-seguranca.md)
- [ADR 0009 - Separacao de Canal por Perfil](./0009-separacao-de-canal-por-perfil.md)
- RFC 6238 (TOTP)
- NIST SP 800-63B (Digital Identity Guidelines)
- OWASP Authentication Cheat Sheet
- Resolucao CMN nº 4.656/2018
- LGPD Art. 46
