# Spec 214 - M-Sprint 14 - Empacotamento nativo iOS (Capacitor 8)

## Metadados

- **ID da Spec**: 214
- **Titulo**: M-Sprint 14 - Build nativo iOS via Capacitor 8
- **Status**: planejada
- **Fase do produto**: Fase 4 - Epic 14 (empacotamento nativo)
- **Trilha**: Mobile (`sep-mobile`)
- **Origem**: PRD-FASE-4 §35 (Epic 14 - nativo)
- **Depende de**: M-Sprint 13 (baseline Capacitor 8 e ajustes nativos comuns); ambiente macOS/Xcode
- **Desbloqueia**: M-Sprint 15 (biometria nativa iOS)
- **Responsavel principal**: Dev Mobile

## Objetivo

Gerar o build **nativo iOS** a partir do PWA existente via Capacitor 8, reaproveitando a baseline e os
ajustes nativos da M-Sprint 13, sem trocar a stack e sem regressao das jornadas.

## Escopo

### Em escopo

- `npx cap add ios` + configuracao Xcode, provisioning basico, splash/icones.
- Ajustes especificos iOS (safe area, status bar, teclado, armazenamento seguro) sem regressao.
- Build IPA debug + smoke em simulador/device.
- Documentar setup Xcode.

### Fora de escopo

- Publicacao na App Store (Fase 5).
- Biometria nativa (M-Sprint 15).
- Nova jornada funcional ou mudanca de contrato.

## Tasks de implementacao

1. Rodar `npx cap add ios` + configurar Xcode, provisioning basico, splash/icones.
2. Aplicar ajustes iOS (safe area, status bar, teclado, storage seguro) sem regressao.
3. Gerar build IPA debug + smoke em simulador/device (login -> jornada basica).
4. Documentar setup Xcode + docs (`README §iOS`).

## Gates que nao contam como task

- Precheck: baseline mobile verde e M-13 concluida.
- Smoke nativo iOS (login -> jornada basica).
- Docs/roadmap quando aplicavel.

## Definition of Done

- App roda nativo no iOS sem regressao das jornadas PWA.
- Build iOS reproduzivel com setup Xcode documentado.
- Nenhuma jornada nova nem mudanca de contrato; docs atualizadas.
