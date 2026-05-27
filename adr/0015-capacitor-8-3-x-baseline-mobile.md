# ADR 0015 - Capacitor 8.3.x como Baseline Mobile

## Status

**Proposto** (2026-05-27). Sprint 15 — Hardening + Bug-Hunt (Task 15.6).

Sera promovido a **Aceito** quando a Sprint Mobile reabrir e a stack for re-validada com Ionic 8.4+ e plugins nativos (biometria, secure storage, push notifications) plugados.

## Contexto

A M-Sprint 0 (Fundacao Mobile) fixou o stack `sep-mobile` em **Ionic 8.4+ + Angular 20.x + Capacitor 6** seguindo ADR 0003 (Stack Angular 20 + Ionic 8 + Capacitor 6).

Entre a M-Sprint 0 e o presente:

- Capacitor evoluiu pra **8.3.x** estavel. As versoes 7.x foram puladas (numeracao alinhada com Angular 20 / Ionic 8 majors).
- O `package.json` do `sep-mobile` ja usa `@capacitor/core@^8.3.1` e plugins `@capacitor/app`, `@capacitor/preferences`, `@capacitor/status-bar`, `@capacitor/keyboard`, `@capacitor/haptics` na linha 8.x.
- A versao **6** mencionada no ADR 0003 ja nao corresponde ao estado real do repo — divergencia documental documentada em SEGURANCA.md §14 ("ADR de update reformalizando baseline mobile com Capacitor 8.3.x").
- Plugins nativos pendentes (biometria via `@capacitor-community/biometric-auth`, WebAuthn, push notifications) precisam confirmar compatibilidade com Capacitor 8.3.x antes da Sprint Mobile reabrir.

Esta ADR fecha o item §14 SEGURANCA "ADR de update reformalizando baseline mobile com Capacitor 8.3.x" como decisao registrada — **nao** como migracao tecnica (codigo ja roda em 8.3.x).

## Decisao

**Baseline mobile**: `Capacitor 8.3.x` pareado com `Ionic 8.4+` e `Angular 20.x` (LTS).

Implicacoes:

- **Bloqueio de upgrade prematuro**: nao bumpar Capacitor para 9+ sem re-validar Ionic + plugins.
- **Compatibilidade de plugins**: cada novo plugin que entrar em sprint mobile deve confirmar suporte explicito a Capacitor 8.3.x — incluindo:
  - `@capacitor-community/biometric-auth` (planejado para autenticacao biometrica).
  - `@capacitor-community/keep-awake` (se necessario).
  - Push notifications (FCM/APNs) — provider a definir.
- **Status do ADR 0003**: nao revogado, apenas **complementado**. A intencao original (Angular 20 + Ionic 8 + Capacitor major moderna) permanece; o numero major do Capacitor foi atualizado pra refletir o estado do repo.

## Consequencias

### Positivas

- **Convergencia documental**: estado do repo (`package.json` em Capacitor 8.x) bate com ADR.
- **Decisao explicita** ao inves de "default do template" — facilita auditoria de seguranca e compliance.
- **Reduz risco de downgrade acidental** quando outros devs herdarem o projeto.

### Negativas

- ADR fica em status **Proposto** ate a Sprint Mobile (sem prazo confirmado) — gap documental temporario.
- Decisao depende de re-validacao quando plugins nativos forem instalados; comportamento de PWA atual nao exercita full stack.
- Capacitor 8.x exige Node >= 18 e Android SDK alvo recente — pode requerer ajuste no CI mobile quando ele entrar em jogo.

### Neutras

- Versoes precisam ser revisitadas a cada 6 meses ou quando Ionic 9 / Capacitor 9 forem GA.

## Alternativas consideradas

1. **Manter ADR 0003 sem update** — rejeitada: divergencia documental ja acusada em SEGURANCA.md §14; deixar sem registro formal piora rastreabilidade.
2. **Promover a Aceito imediatamente** — rejeitada: implementacao mobile esta em pausa; aceite formal exige re-validar plugins nativos, build em devices reais e suite E2E mobile rodando.
3. **Bumpar pra Capacitor 9.x** (se disponivel) — rejeitada: Ionic 8.4 nao tem suporte oficial Capacitor 9; risco de quebra de plugins comunitarios.

## Acao subsequente

- Sprint Mobile (futura): re-validar plugins, instalar biometria nativa, rodar suite E2E em devices Android/iOS, promover esta ADR a **Aceito**.
- Atualizar [`AI-ROADMAP.md`](../AI-ROADMAP.md) listando ADR 0015 nas referencias mobile.
- Atualizar [`docs-sep/SEGURANCA.md`](../docs-sep/SEGURANCA.md) §14 — marcar item Capacitor como fechado por ADR 0015.

## Referencias

- [ADR 0003 — Stack Angular 20 + Ionic 8 + Capacitor 6](./0003-stack-angular-20-ionic-8-capacitor-6.md)
- [ADR 0010 — MFA TOTP + Biometria Mobile](./0010-mfa-totp-com-biometria-mobile.md)
- [SEGURANCA.md §14 — Pendencias e follow-ups](../docs-sep/SEGURANCA.md)
- Capacitor 8.x release notes: <https://capacitorjs.com/blog>
- Ionic 8.4 release notes: <https://ionicframework.com/docs/changelog>
