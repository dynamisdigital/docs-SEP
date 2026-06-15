# sep-mobile

Documentacao especifica do mobile SEP.

## Orientacao

Crie aqui documentacao tecnica ou operacional que pertenca apenas ao repo `sep-mobile`.
Exemplos: guias PWA/Capacitor, notas de build mobile, jornadas especificas de mobile,
testes E2E em viewport mobile ou convencoes locais do Ionic.

Documentos globais de produto/processo devem continuar em `docs-SEP/docs-sep/`.

## Design system vigente

A partir do Epic 17 / M-Sprint 12, o design system vigente do app mobile passa a ser
[`New Design System Sep.md`](<../../docs-sep/New Design System Sep.md>).

Esta sprint foi revisada para seguir a F-Sprint 15 do `sep-app`: o foco nao e apenas migrar
tokens, mas aplicar melhor o design system nas superficies existentes do mobile. O Notion mobile
das M-Sprints 0-5 permanece como historico/legado. Novas telas mobile devem seguir a traducao do
New Design System SEP para Ionic/Angular/SCSS, mantendo a stack atual do `sep-mobile` salvo ADR e
aprovacao explicita em contrario.

Preferir `ion-icon`/Ionicons, ja presente na stack mobile. Nao adicionar Tailwind, shadcn/ui,
Radix, React ou biblioteca nova de icones sem ADR/aprovacao.

### Implementacao (M-Sprint 12 concluida)

Tokens e primitivos vivem em:
- `src/styles/_sep-mobile-ds-tokens.scss` — paleta HSL (light `:root` + dark `.dark`/`.ion-palette-dark`),
  raio, gradiente, sombra, espacamento e variaveis Sass `$sep-*`.
- `src/theme/variables.scss` — mapeia `--ion-*` a partir da paleta DS (shade/tint/rgb via `sass:color`), light + dark.
- `src/styles/_sep-mobile-ds-components.scss` — mixins dos primitivos.
- `src/global.scss` — estados globais dos componentes Ionic (botao/input/item/card/tab-bar/toast/modal/focus) em tokens DS.

Primitivos disponiveis (mixins SCSS):
- `sep-mobile-icon-chip($tone)` — chip de icone colorido (tom via `--chip-tone` quando dinamico);
- `sep-mobile-quick-tile($tone)` — tile de acesso rapido;
- `sep-mobile-button-gradient` — CTA gradiente (aplicado em `ion-button`);
- `sep-mobile-auth-brand-panel` — painel de marca de splash/welcome/login/registro;
- `sep-mobile-surface-card` — superficie de card;
- `sep-mobile-touch-state` — feedback de toque.

Tema claro/escuro: `src/app/core/theme/theme.service.ts` alterna `dark`/`ion-palette-dark` no
`documentElement`, persiste em `localStorage` (`SEP_THEME`) e respeita `prefers-color-scheme`;
instanciado no `AppComponent`, com toggle (sun/moon) no header mobile.

Os arquivos `_notion-mobile-*` das M-Sprints 0-5 foram removidos (paleta/mixins Notion substituidos);
o legado `jasmine`/`karma` foi removido do `package.json` (runner de testes e o Vitest).

Spec e steps:
- [`specs/fase-3/212-msprint-12-new-design-system-mobile.md`](../../specs/fase-3/212-msprint-12-new-design-system-mobile.md)
- [`steps-fase-3/mobile/212-msprint-12-steps.md`](../../steps-fase-3/mobile/212-msprint-12-steps.md)
