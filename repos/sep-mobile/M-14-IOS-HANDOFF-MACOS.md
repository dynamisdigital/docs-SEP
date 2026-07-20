# Handoff M-Sprint 14 (iOS) — ambiente macOS

> **Documento temporario de handoff.** Serve para retomar a M-Sprint 14 num host macOS, ja que o
> ambiente de desenvolvimento Linux nao possui a toolchain Apple (sem `xcodebuild`, `pod` ou
> simulador iOS). Remover ao fechar a sprint (o fechamento gera o `SPRINT-M-14-PR.md` proprio, por
> steps 214.3.6).
>
> **Fontes que mandam**: [spec 214](../../specs/fase-4/214-msprint-14-empacotamento-nativo-ios.md),
> [steps 214](../../steps-fase-4/mobile/214-msprint-14-steps.md) e
> [ADR 0019](../../adr/0019-baseline-capacitor-8-mobile.md). Este arquivo **nao substitui** os steps;
> so consolida o setup de ambiente e o ponto de retomada.

## Por que este handoff existe

A M-14 empacota o `sep-mobile` para **iOS** via Capacitor 8. Diferente da M-13 (Android, cujo SDK +
Gradle rodam em Linux), o iOS exige toolchain **exclusiva de macOS**. No ambiente Linux atual os
gates `xcodebuild` (build/archive) e `pod` (CocoaPods) e o smoke em simulador **nao executam**. Por
decisao do dev (2026-07-20), a M-14 sera implementada por inteiro num Macbook.

## Pre-requisitos macOS

Conferir/instalar antes do precheck 214.P.3:

```bash
# 1. Xcode (App Store) + Command Line Tools + aceite de licenca
xcode-select --install          # se ainda nao instalado
sudo xcodebuild -license accept  # aceitar a licenca do Xcode
xcode-select -p                  # deve apontar para .../Xcode.app/Contents/Developer

# 2. Runtime de simulador iOS instalado (Xcode > Settings > Platforms) e ao menos um device criado
xcrun simctl list devices        # confirmar um simulador iOS disponivel

# 3. CocoaPods (necessario para `cap sync ios` / pod install)
sudo gem install cocoapods       # ou: brew install cocoapods
pod --version

# 4. Node >= 22 via nvm (exigencia fatal do Capacitor CLI 8; ver ADR 0019)
nvm install 22 && nvm use 22
node -v                          # deve imprimir v22.x
npx cap --version
```

Notas:

- **Node 22 e obrigatorio** — o CLI do Capacitor 8 aborta com Node 20. Usar `nvm use 22` na sessao
  de build; nao e preciso mexer no Node do sistema.
- **Nunca versionar**: Apple ID, Team pessoal, certificado, perfil de provisioning, token,
  `xcuserdata`, `ExportOptions.plist` com identificador pessoal, `DerivedData`, `Pods/`, `.app`,
  archive ou IPA. O `ios/.gitignore` gerado pelo `cap add ios` cobre a maior parte; conferir.

## Estado do repositorio ao iniciar (referencia)

- **Branch**: local ainda em `feature/msprint-13-android-capacitor`. O precheck 214.P.2 cria
  `feature/msprint-14-ios-capacitor` a partir de `develop`.
- **Integracao git**: `develop` == `main` por conteudo (M-13 promovida via PR #123). O unico commit
  "a mais" em `main` e o merge node da promocao; nao ha divergencia real.
- **`ios/` esta ignorado**: `.gitignore` do `sep-mobile` tem a regra `ios/` (linha ~69). O step
  214.0.2 remove **somente** essa regra ao versionar o projeto; preservar os ignores de
  `DerivedData`/build/`Pods`.
- **`capacitor.config.ts`** ja existe: `appId = com.dynamis.sep.mobile`, `appName = SEP`,
  `webDir = www`. Manter.
- **Baseline (ADR 0019)**: `@capacitor/core`/`cli` na linha **8.4**, plugins oficiais no major 8. A
  M-14.0 adiciona `@capacitor/ios@8.4.0` (`--save-exact`), mesma linha 8.4; nao mexer nas
  dependencias adjacentes.
- **Runtime nativo comum** ja existe em `src/app/core/native/` (`PlatformService` +
  `NativeRuntimeService`: status bar por tema, back button, deep links por allowlist via guards,
  `redirectAuthenticatedGuard`). A M-14.2 estende os ramos **iOS reais** com fallback web preservado.
- **Deep link**: scheme proprio `com.dynamis.sep.mobile://` (App Links HTTPS ficam para a Fase 5).

## Ponto de retomada

Seguir os [steps 214](../../steps-fase-4/mobile/214-msprint-14-steps.md) na ordem, com o protocolo
de sprint (checkpoint pre-commit ao fim de cada task; git do `sep-mobile` commitado pelo dev/agente
com aprovacao; push/PR manuais):

```text
Precheck 214.P.1..P.4  (git + toolchain iOS + baseline PWA/Android verde)
  -> M-14.0  dependencia @capacitor/ios + `cap add ios` + build de simulador sem assinatura
  -> M-14.1  identidade/target/deployment, permissoes minimas, icone/splash, auditoria de storage
  -> M-14.2  runtime iOS (safe area, status bar, teclado, ciclo de vida, deep links) + testes
  -> M-14.3  build simulador + smoke (login -> jornada basica) + CI macOS/fallback + docs + PR desc
```

Gates que so o macOS destrava (nao rodaram em Linux):

- `xcodebuild ... CODE_SIGNING_ALLOWED=NO build` para simulador (gate obrigatorio, sem conta Apple).
- `npx cap sync ios` (roda `pod install`).
- Smoke em simulador/device.
- Archive/IPA debug: **so** com provisioning local; sem isso, manter o build de simulador verde e
  registrar o gate — nao fabricar certificado, Team ou IPA falso.

## Seguranca (nao esquecer)

- Step-up permanece **somente em memoria** e de uso unico (nao vai para `Preferences`/
  `UserDefaults`/`localStorage`).
- Se access/refresh token continuarem persistidos fora do Keychain, a M-14.1 exige porta
  Keychain-backed compativel com Capacitor 8 (fallback web explicito + migracao/limpeza + testes).
- Confirmar que logout, expiracao e troca de usuario removem segredos nativos.

## Fora de escopo (manter)

App Store/TestFlight/notarizacao, biometria nativa (M-15), jornada/endpoint/contrato novo, upgrade
de major alem da baseline, App Links HTTPS.
