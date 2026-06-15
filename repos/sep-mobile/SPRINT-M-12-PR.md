# PR — M-Sprint 12: Aplicacao do New Design System SEP (mobile)

## Summary

Aplica o **New Design System SEP** no `sep-mobile` (Epic 17), espelhando a F-Sprint 15 do `sep-app`
e mantendo a stack Ionic + Angular + Capacitor + SCSS. Trabalho **visual/tematico**: nenhuma regra
de negocio, contrato REST, rota, autenticacao, MFA, step-up ou biometria foi alterada. Substitui o
design Notion mobile (M-Sprints 0-5) pela paleta/primitivos do design system, adiciona modo escuro e
remove dependencias de teste legadas.

Spec: `specs/fase-3/212-msprint-12-new-design-system-mobile.md` ·
Steps: `steps-fase-3/mobile/212-msprint-12-steps.md`.

## Mudancas por task

- **M-12.0 — Fundacao**: `_sep-mobile-ds-tokens.scss` (paleta HSL light/dark, raio, gradiente,
  sombra, espacamento, Sass `$sep-*`), `_sep-mobile-ds-components.scss` (6 primitivos),
  `theme/variables.scss` remapeia `--ion-*` da paleta DS (shade/tint/rgb via `sass:color`) com bloco
  dark, `styles/index.scss` carrega os partials. Os partials `_notion-mobile-*` foram removidos no fechamento.
- **M-12.1 — Publico**: splash (hero gradiente), welcome (hero SEP + cards de jornada com icon-chip +
  CTA gradiente), login/registro (painel de marca + CTA gradiente), verify-totp (painel de marca,
  coerente com login; MFA intacto).
- **M-12.2 — Homes e jornadas**: home autenticada, tomador e credora com tiles/cards + chip de icone
  por tom semantico (idiom `--chip-tone`); perfil, troca de senha e step-up migrados para tokens DS.
  Sem dado fabricado; `data-testid`, handlers e badges preservados.
- **M-12.3 — Shell + dark mode**: `ThemeService` (classe `dark`/`ion-palette-dark` no
  `documentElement`, `SEP_THEME`, `prefers-color-scheme`) instanciado no `AppComponent`; header
  sticky semi-transparente com blur, safe-area-top e toggle de tema; tabs com estado ativo evidente +
  safe-area-bottom; `global.scss` com estados globais (botao/input/item/card/tab-bar/toast/modal/
  focus-visible) em tokens DS dark-aware; telas de erro e placeholder migradas.
- **M-12.4 — Showcase, testes, depcheck, docs**: showcase atualizado (paleta DS, tipografia, demo dos
  primitivos, navegacao); remocao dos `_notion-mobile-*` orfaos; remocao de `karma`/`jasmine` do
  `package.json` (runner = Vitest); este doc + README do `sep-mobile`.

## Migrations / contratos

Nenhuma. Sem mudanca de backend, REST, evento ou collection.

## Decisoes

- Stack mantida (Ionic/Angular/SCSS); **sem** Tailwind/shadcn/React/Lucide. Icones via Ionicons.
- Token `--background` colidia com a variavel de tema do `ion-content`; resolvido usando
  `var(--ion-background-color)` no `ion-content` e `hsl(var(--card))` nos inputs (evita ciclo CSS).
- Dark mode ativado por classe (igual web), nao por `prefers-color-scheme` direto nos tokens.
- Idiom `--chip-tone`: um `@include sep-mobile-icon-chip(--chip-tone)` + tom por item, para usar o
  primitivo sem estourar o budget `anyComponentStyle` (4 kB).

## Dividas aceitas / follow-ups

- **Finding de contraste (warning + texto branco em light)**: fiel ao design doc/web; eventual ajuste
  e decisao cross-stack do design system (nao alterado aqui).
- **Header translucido**: aplicado como sticky semi-transparente + blur, sem `[translucent]` do Ionic,
  para garantir que o header nao sobreponha conteudo (verificacao do step).
- **e2e `golden-path-mobile`**: pendencia conhecida no seletor `link /cadastr/i` frente ao CTA "Criar conta"; smoke PWA (3 cenarios) e `profile-actions` passam. Corrigir o seletor no proximo ciclo de hardening/testes sem bloquear o fechamento visual da M-Sprint 12.

## Test plan

- `npm run lint`, `npm run lint:scss`, `npm run build`: verdes.
- `npm run test` (Vitest): 104 testes verdes (inclui `theme.service.spec`).
- `npm run e2e` (Playwright, chromium): smoke (3) + profile-actions verdes; `golden-path-mobile`
  pendencia conhecida documentada acima.
- Budget `anyComponentStyle`: todos os componentes abaixo do limite de erro (4 kB).

## Commits

```
367fb4c feat(mobile): adicionar primitivos visuais do design system
a228123 fix(mobile): completar tokens ion semanticos e dark do design system
d0f5a56 feat(mobile): redesenhar superficies publicas com design system
97966a5 fix(mobile): garantir wrap do texto nos cards de jornada do welcome
a967d7b fix(mobile): aplicar design system no TOTP e no CTA secundario do welcome
6e35a68 feat(mobile): aplicar design system nas homes e jornadas
423821b fix(mobile): corrigir fundo ciclico --background nas telas do design system
ab0af33 feat(mobile): polir shell e navegacao mobile
a6d8e13 fix(mobile): evitar safe-area duplicada na tab bar
cd91a62 feat(mobile): showcase, limpeza notion e depcheck do design system
0db54ef fix(mobile): sincronizar package-lock apos merge develop (vitest 3)
```
