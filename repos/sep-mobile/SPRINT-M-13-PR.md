# PR — M-Sprint 13: Empacotamento nativo Android (Capacitor 8)

> Descricao temporaria para o PR `feature/msprint-13-android-capacitor -> develop`.
> Apagar apos o uso (ciclo padrao das descricoes de sprint).

## Summary

Empacota o `sep-mobile` como app nativo Android via Capacitor 8.4, sem trocar a stack
(Angular 20.x + Ionic 8.4+), sem jornada/endpoint/contrato novo e sem regressao do PWA.
Fecha a M-Sprint 13 (spec 213, PRD-FASE-4 §35 / Epic 14) e desbloqueia M-14 (iOS) e M-15
(biometria nativa).

- **ADR 0019** formaliza a baseline Capacitor 8 (supersede ADR 0003 no recorte do Capacitor e o
  ADR 0015 Proposto). Node >= 22 obrigatorio para o CLI (verificado: fatal com Node 20).
- **Projeto `android/` versionado** (minSdk 24, compile/target 36, Gradle 8.14.3, AGP 8.13.0),
  gerado por `npx cap add android` com 5 plugins oficiais major 8.
- **Runtime nativo** isolado em `core/native/` com fallback web explicito (no web tudo e no-op).
- **Guard novo** `redirectAuthenticatedGuard` (achado do smoke — ver Decisoes de seguranca).

## Commits

| Commit | Tipo | Conteudo |
|---|---|---|
| `d7d3f53` | feat | projeto nativo Android: `android/`, manifest endurecido, icone/splash de fonte SVG versionada, `@capacitor/android@8.4.0`, `.gitignore` |
| `d6d33df` | fix | `colors.xml` (styles.xml referenciava cores inexistentes — build quebrava) + testes template no package correto (hotfix do review) |
| `1217ca5` | feat | runtime nativo: `PlatformService` + `NativeRuntimeService` (status bar por tema, back button, deep links por allowlist via guards), `BiometricService` refatorado, init no `AppComponent`; 16 testes |
| `e5869c6` | fix | deep links rejeitam dot segments — path opaco `scheme:app/../..` escapava da normalizacao WHATWG (hotfix do review) |
| `4f15e95` | fix | `replace(/%2e/g)` no lugar de `replaceAll` — quebrava build AOT (lib < es2021; Vitest JIT nao acusa) |
| `305f42e` | fix | pos-smoke: `redirectAuthenticatedGuard` em welcome/login/register + back fallback `Location.back()` + `/` nas rotas de saida |
| `0b5dd67` | fix | fallback do voltar com historico vazio (cold start via deep link) volta a `/` em vez de no-op (hotfix do review) |

## Configuracao Android

- `capacitor.config.ts` inalterado (`com.dynamis.sep.mobile` / `SEP` / `www`); sem `server.url`.
- Manifest: `allowBackup="false"` (tokens em SharedPreferences fora do auto-backup); somente
  permissao INTERNET no manifest do app (VIBRATE entra pelo merge do plugin haptics); deep link por
  scheme proprio `com.dynamis.sep.mobile://` (sem dominio inventado; App Links https = Fase 5);
  `MainActivity` exported so com launcher/VIEW filters; FileProvider nao exportado.
- `values/colors.xml` com tokens do DS (`#2E67AD` primary, `#275691` shade, `#40BF75` secondary).
- Icone adaptativo/legacy/round + splash claro (`#2E67AD`) e escuro (`#14181F`) gerados de
  `resources/logo.svg` via `@capacitor/assets` (fonte versionada; comando no README).
  **Placeholder do DS** — nao existe arte oficial da marca em nenhum repo (follow-up abaixo).
- `.gitignore`: `android/` versionado; keystore/`local.properties`/build cobertos por
  `android/.gitignore`; `ios/` segue ignorado ate a M-14.

## Decisoes de seguranca

- **Deep links**: allowlist de prefixos (`/welcome`, `/login`, `/register`, `/app`); navegacao
  sempre via `router.navigateByUrl` (guards executam); URL desconhecida/malformada descartada em
  silencio e **nunca logada** (pode conter token/PII); qualquer `..` (literal, `%2e`, path opaco)
  derruba o link inteiro.
- **`redirectAuthenticatedGuard`** em `/welcome`, `/login`, `/register`: o botao voltar fisico faz
  pop do historico do WebView e, sem o guard, devolvia usuario **logado** para `/login` (achado do
  smoke). Destino identico ao do splash (`/app/inicio`). Vale tambem para o PWA.
- **Back button** (prioridade -1, depois dos handlers do Ionic): raizes (`/`, `/welcome`, `/login`,
  `/app/inicio`, `/app/credora/inicio`) encerram o app de forma previsivel; fora delas
  `Location.back()`; historico vazio volta ao ponto de entrada. Falha de plugin isolada em
  try/catch — nunca derruba sessao/navegacao.
- **Sessao**: nenhuma mudanca de storage nesta sprint. `Preferences` segue para tokens (nao e
  storage seguro — endurecimento na M-15 com plugin dedicado + revisao, regra do ADR 0019);
  step-up token permanece somente em memoria.
- **Logcat**: varredura pos-smoke — 0 ocorrencias de senha ou valor de token; 21 hits sao apenas o
  *nome* da chave em log verbose `V Capacitor` de build debug (release nao emite nivel V).

## Smoke Android (emulador)

Ambiente: AVD `sep-pixel` (Pixel 5, `system-images;android-36;google_apis;x86_64`, API 36, KVM),
APK debug de build `dev-offline` (MSW embutido — mesmo seed dos e2e). Backend real `:8080` estava
indisponivel; smoke contra backend real permanece **validacao manual** (mesmo criterio do
golden-path historico). Evidencias: screenshots em `~/smoke-m13/` (nao versionados).

| Passo | Resultado |
|---|---|
| Instalar/abrir; icone, splash, primeira tela | OK (welcome no DS) |
| Login `cliente@empresa.com` (MSW) | OK -> `/app/inicio`; MFA nao exigido pelo usuario de teste (step-up e por fluxo — aceites) |
| Jornada basica (tabs Perfil, Parcelas) | OK (empty state correto) |
| Voltar intermediario | OK — volta pelo historico, sem cair logado em tela publica |
| Voltar na raiz | OK — app encerra (foco no launcher) |
| Deep link valido `://app/parcelas` | OK — navega via guards |
| Deep link invalido `://design-system` | OK — ignorado, permanece na tela |
| Encerrar/reabrir | OK — sessao restaurada; pos-logout reabre em welcome |
| Logout | OK — sessao limpa |
| Rotacao landscape | OK |
| Logcat | OK — sem segredo/PII (ver Decisoes de seguranca) |

## Test plan

- Vitest **487** (68 arquivos; +23 da sprint: platform 3, native-runtime 16, guard 4) — verde.
- `lint`, `lint:scss`, `format:check` — verdes.
- Build AOT prod (`npm run build`) — verde (guard exigiu correcao do `replaceAll`; validado com
  exit code explicito, sem pipe).
- `./gradlew test lint assembleDebug bundleDebug` — verdes; APK debug 5,2 MB / AAB debug 4,1 MB.
- e2e Playwright: regressao PWA 24/25 — o vermelho e o `golden-path-mobile` **preexistente**
  (seletor `/cadastr/i` + backend real; registrado no historico das M-Sprints 9-12).
- CI: job novo `Build Android (debug)` (Node 22 + JDK 21 + cache Gradle; artifact
  `mobile-android-apk-debug`; sem keystore).

## Limitacoes e follow-ups

1. **Arte oficial da marca**: icone/splash sao placeholder do DS gerados de `resources/logo.svg`.
   Substituir quando a marca existir (mesmo comando `@capacitor/assets`).
2. **`minifyEnabled false`** no build release do template — release nao e escopo desta sprint
   (sem assinatura); ligar minify + proguard na sprint de release da Fase 5 (achado do review).
3. **Dupla chamada `loadCurrentUser`** (splash + guard) num edge de corrida de 1,5 s — idempotente
   (mesmo signal), custo de 1 request extra; dedup no `AuthService` se incomodar (achado do review).
4. **Smoke contra backend real `:8080`** (login+MFA TOTP reais) — validacao manual pendente, como
   nas sprints anteriores.
5. **`golden-path-mobile` e2e** segue vermelho preexistente (seletor `/cadastr/i` vs CTA
   "Criar conta" + exigencia de backend real) — corrigir o spec e follow-up antigo do repo.
6. **Splash nativo Android 12+** usa o icone via androidx SplashScreen (comportamento padrao do
   sistema); o splash de marca full-screen aparece no runtime web/WebView.

## Fora de escopo (conferido)

Sem Play Store/assinatura/keystore; sem iOS (M-14); sem biometria nativa (M-15); sem jornada,
endpoint, regra de negocio ou contrato novo; sem upgrade de major alem da baseline do ADR 0019.
