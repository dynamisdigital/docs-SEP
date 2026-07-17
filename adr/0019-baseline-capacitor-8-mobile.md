# ADR 0019 - Baseline Capacitor 8 no mobile

## Status

Aceito (2026-07-17). M-Sprint 13 — Empacotamento nativo Android
([spec 213](../specs/fase-4/213-msprint-13-empacotamento-nativo-android.md)).

Supersede o [ADR 0003](./0003-stack-angular-20-ionic-8-capacitor-6.md) **somente no recorte do
Capacitor** (major 6 → 8); as demais decisoes do ADR 0003 (Angular 20.x + Ionic 8.4+) permanecem
vigentes. Supersede tambem o [ADR 0015](./0015-capacitor-8-3-x-baseline-mobile.md) (Proposto,
Capacitor 8.3.x): este ADR concretiza a promocao que o 0015 previa para a reabertura da trilha
mobile, com a baseline re-validada no estado real do repositorio.

## Contexto

O ADR 0003 fixou a stack mobile em Angular 20.x + Ionic 8.4+ + **Capacitor 6**. O `sep-mobile`,
porem, ja opera na **linha 8** do Capacitor desde a fundacao mobile (M-Sprint 0), divergencia
documental registrada em SEGURANCA.md §14 e parcialmente tratada pelo ADR 0015 (status Proposto,
nominal 8.3.x, aguardando re-validacao).

A M-Sprint 13 reabre a trilha nativa (empacotamento Android) e exige a baseline formalizada antes
de gerar o projeto `android/`. Estado real do repositorio na abertura da sprint:

- `@capacitor/core` **8.4.0** e `@capacitor/cli` **8.4.0**.
- Plugins oficiais, todos no major 8: `@capacitor/app` 8.1.0, `@capacitor/haptics` 8.0.2,
  `@capacitor/keyboard` 8.0.5, `@capacitor/preferences` 8.0.1, `@capacitor/status-bar` 8.0.2.
- `capacitor.config.ts` presente (`appId com.dynamis.sep.mobile`, `appName SEP`, `webDir www`),
  sem plataforma nativa gerada ate esta sprint.

Pontos de integracao Capacitor existentes no codigo (inventario 213.0.2):

- `core/auth/token-storage.service.ts` — tokens de acesso/refresh, trust de device e desafio MFA
  pendente via `Preferences`.
- `core/onboarding/onboarding-journey.store.ts` — estado da jornada de onboarding via
  `Preferences`.
- `core/auth/biometric.service.ts` — deteccao de plataforma (`Capacitor.getPlatform()`), fake de
  biometria ate a M-Sprint 15.
- `core/auth/step-up-token.store.ts` — token de step-up **deliberadamente em memoria** (fora de
  `Preferences`/localStorage).

## Decisao

**Baseline mobile: Capacitor 8.x (linha 8.4)** pareado com Angular 20.x + Ionic 8.4+, com plugins
oficiais `@capacitor/*` no major 8.

Compatibilidade de toolchain adotada na M-Sprint 13:

- **Node >= 22** — exigencia fatal do Capacitor CLI 8 (verificado: CLI aborta com Node 20). O
  ambiente de build usa Node 22.x via nvm, sem alterar o Node 20 do sistema usado pelo restante
  do workspace.
- **JDK 21** — ja padrao do workspace (alinhado ao backend).
- **Android SDK**: Platform **36** + build-tools **36.0.0** + platform-tools; emulador com system
  image `android-36;google_apis;x86_64`.
- **Gradle/AGP**: versoes fixadas pelo template do Capacitor 8.4 na geracao do projeto `android/`
  (M-13.1); registradas no fechamento da sprint junto ao projeto versionado.

Regras decorrentes:

1. **Nenhum upgrade de major** (Capacitor 9+, Ionic 9, Angular 21+) sem ADR proprio com
   re-validacao de plugins, build nativo e suites.
2. **Plugin novo** (oficial ou comunitario) exige necessidade concreta na sprint, suporte
   explicito ao Capacitor 8.x e revisao de seguranca antes de entrar (ex.: biometria na M-15).
3. `Preferences` **nao** e armazenamento seguro para segredo; qualquer endurecimento de storage
   de sessao e tratado na M-Sprint 13/15 sem reduzir a seguranca atual (step-up permanece em
   memoria).

## Consequencias

### Positivas

- Convergencia documental definitiva: repo (8.4.x), ADR e sprint nativa apontam para a mesma
  baseline; fecha o gap que o ADR 0015 deixou em aberto como Proposto.
- Projeto `android/` nasce na linha suportada dos plugins ja instalados, sem migracao previa.
- Trilha M-14 (iOS) e M-15 (biometria) herdam baseline unica e validada.

### Negativas

- CI mobile atual roda Node 20; o job de build Android (M-13.4) precisa de Node 22, criando dois
  runtimes de Node no pipeline ate o repo migrar por inteiro (avaliacao futura, fora desta
  sprint).
- Baseline nominal 8.4 exige disciplina de patch/minor via dependabot (ja vigente) para nao
  reabrir divergencia documental.

### Neutras

- ADR 0003 permanece a referencia para Angular/Ionic; este ADR so muda o recorte Capacitor.
- Revisao da baseline quando Capacitor 9 / Ionic 9 forem GA ou na infra da Fase 5.

## Alternativas consideradas

1. **Promover o ADR 0015 a Aceito sem novo ADR** — rejeitada: o 0015 e nominal 8.3.x e anterior a
   toolchain real (Node 22, SDK 36); a spec 213 pede ADR proprio da sprint com o estado
   re-validado.
2. **Migrar para Capacitor 9 antes do empacotamento** — rejeitada: sem suporte oficial do Ionic
   8.4 e dos plugins comunitarios planejados; fora do escopo da spec 213 ("upgrade alem da
   baseline aprovada").
3. **Manter ADR 0003 nominal Capacitor 6** — rejeitada: divergencia documental ja apontada em
   SEGURANCA.md §14; empacotar nativo com ADR defasado quebraria rastreabilidade de auditoria.

## Referencias

- [ADR 0003 — Stack Angular 20 + Ionic 8.4+ + Capacitor 6](./0003-stack-angular-20-ionic-8-capacitor-6.md)
- [ADR 0015 — Capacitor 8.3.x como Baseline Mobile](./0015-capacitor-8-3-x-baseline-mobile.md)
- [Spec 213 — M-Sprint 13 — Empacotamento nativo Android](../specs/fase-4/213-msprint-13-empacotamento-nativo-android.md)
- [Steps 213 — M-Sprint 13](../steps-fase-4/mobile/213-msprint-13-steps.md)
- Capacitor 8 — requisitos de ambiente: <https://capacitorjs.com/docs/getting-started/environment-setup>
