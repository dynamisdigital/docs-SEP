# Spec 215 - M-Sprint 15 - Biometria nativa + hardening

## Metadados

- **ID da Spec**: 215
- **Titulo**: M-Sprint 15 - Biometria nativa (substitui stub PWA) e hardening
- **Status**: planejada
- **Fase do produto**: Fase 4 - Epic 14 (empacotamento nativo)
- **Trilha**: Mobile (`sep-mobile`)
- **Origem**: PRD-FASE-4 §35 (Epic 14 - biometria nativa); stub PWA da M-Sprint 5
- **Depende de**: M-Sprints 13-14 (builds nativos Android/iOS); Sprint 27 (step-up estrito
  server-side)
- **Responsavel principal**: Dev Mobile

## Objetivo

Substituir o **stub PWA de biometria** por biometria nativa (Face ID/Touch ID/BiometricPrompt) via
Capacitor, ligada ao fluxo de login/step-up, **sem bypass do MFA server-side** (enforcement da Sprint
27). Inclui hardening nativo best-effort.

## Escopo

### Em escopo

- Integrar plugin de biometria nativa atras da abstracao ja usada pelo stub.
- Ligar biometria ao login/step-up preservando o enforcement server-side do MFA (sem bypass).
- Fallback para senha/MFA quando biometria indisponivel; armazenamento seguro de credencial/refresh.
- Hardening nativo best-effort (secure storage, screen capture, deteccao jailbreak/root).
- Testes + smoke em Android/iOS.

### Fora de escopo

- Alterar a politica de MFA/step-up do backend (Sprint 27 e a fonte).
- Publicacao em loja (Fase 5).
- Nova jornada funcional.

## Tasks de implementacao

1. Integrar plugin de biometria nativa (Face ID/Touch ID/BiometricPrompt) atras da abstracao atual.
2. Ligar biometria ao login/step-up sem bypass do MFA server-side.
3. Implementar fallback (senha/MFA) e armazenamento seguro de credencial/refresh.
4. Aplicar hardening nativo best-effort (secure storage, screen capture, jailbreak/root).
5. Cobrir com testes de unidade/instancia + smoke em Android/iOS.
6. Atualizar docs (`README §Biometria`).

## Gates que nao contam como task

- Precheck: M-13/M-14 concluidas e Sprint 27 integrada.
- Smoke biometria (sucesso, fallback, indisponivel) em Android/iOS.
- Docs/roadmap quando aplicavel.

## Definition of Done

- Biometria nativa substitui o stub PWA e gate login/step-up sem bypass do MFA server-side.
- Fallback funciona quando biometria indisponivel; credencial/refresh em storage seguro.
- Hardening nativo best-effort aplicado.
- Testes e smokes Android/iOS verdes; docs atualizadas.
