# Spec 213 - M-Sprint 13 - Empacotamento nativo Android (Capacitor 8)

## Metadados

- **ID da Spec**: 213
- **Titulo**: M-Sprint 13 - Build nativo Android via Capacitor 8
- **Status**: concluida (mergeada em `develop` e `main` via PR #123, 2026-07-17; `develop` == `main` conferido pelo dev)
- **Fase do produto**: Fase 4 - Epic 14 (empacotamento nativo)
- **Trilha**: Mobile (`sep-mobile`)
- **Origem**: PRD-FASE-4 §35 (Epic 14 - nativo); pendencia documental de baseline Capacitor 8
- **Depende de**: app PWA da Fase 3 (M-Sprints 6-12) estavel; ADR baseline Capacitor 8
- **Desbloqueia**: M-Sprint 14 (iOS), M-Sprint 15 (biometria nativa)
- **Responsavel principal**: Dev Mobile

## Objetivo

Gerar o build **nativo Android** a partir do PWA existente via Capacitor 8, sem trocar a stack
(`Angular 20.x + Ionic 8.4+ + Capacitor 8`) e sem regressao das jornadas ja entregues. Inclui o ADR
que reformaliza a baseline Capacitor 8 (substitui o ADR 0003 nominal Capacitor 6).

## Escopo

### Em escopo

- ADR de baseline Capacitor 8 (substitui ADR 0003) + `npx cap add android` e configuracao.
- Configurar `capacitor.config`, permissoes, splash/icones e deep links Android.
- Ajustar o app para runtime nativo (armazenamento seguro, status bar, botao voltar) sem regressao
  PWA.
- Build APK/AAB debug + smoke em emulador/device (login -> jornada basica).
- CI/job de build Android (ou build local documentado) + docs.

### Fora de escopo

- Publicacao em loja (Fase 5).
- Biometria nativa (M-Sprint 15).
- Nova jornada funcional ou mudanca de contrato.
- iOS (M-Sprint 14).

## Tasks de implementacao

1. Escrever ADR baseline Capacitor 8 (substitui ADR 0003) e rodar `npx cap add android`.
2. Configurar `capacitor.config`, permissoes, splash/icones e deep links Android.
3. Ajustar runtime nativo (storage seguro, status bar, back button) preservando o PWA.
4. Gerar build APK/AAB debug e smoke em emulador/device (login -> jornada basica).
5. Adicionar job de build Android na CI (ou documentar build local) + docs (`README §Android`).

## Gates que nao contam como task

- Precheck: baseline mobile verde (lint/scss/format, Vitest, build PWA).
- Smoke nativo Android (login -> jornada basica).
- Docs/roadmap e ADR quando aplicavel.

## Definition of Done

- App roda nativo no Android sem regressao das jornadas PWA.
- ADR baseline Capacitor 8 aceito, substituindo o ADR 0003 nominal Cap 6.
- Build Android reproduzivel (CI ou local documentado).
- Nenhuma jornada nova nem mudanca de contrato; docs atualizadas.
