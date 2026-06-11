# Design System do sep-app

## Design system vigente

A partir do Epic 17 / F-Sprint 14, o design system vigente do web e o
[`New Design System Sep.md`](<../../docs-sep/New Design System Sep.md>).

A migracao foi concluida na F-Sprint 14: os antigos design systems Apple (superficies
publicas) e Notion (superficies autenticadas) foram removidos do `sep-app` e permanecem
apenas como historico documental das F-Sprints 0-10. Novas telas web devem seguir a
traducao do New Design System SEP para Angular/SCSS, mantendo a stack atual do `sep-app`
salvo ADR e aprovacao explicita em contrario.

A F-Sprint 15 aplicou esse design system com profundidade nas telas de login/registro
(painel de marca com gradiente), no dashboard (header sticky + "Acesso Rapido" em tiles
coloridos + jornadas com chips), no shell (sidenav agrupada com icones e header sticky
translucido) e na landing publica (`/`: hero 2-col com painel de marca + grid de cards de
feature com icon-chip). Adicionou os primitivos visuais que faltavam e a biblioteca de icones
`lucide-angular` (set curado, registrado no bootstrap). Nao recriou tokens; reusou a base da
F-14.

## Onde fica

- **Tokens**: `src/styles/_sep-ds-tokens.scss` — cores HSL (`:root` + `.dark`), raio base
  `0.75rem` e derivados (inclui `--sep-radius-xl` para tiles), sombras, gradientes
  (`--gradient-primary/-hero` + `--gradient-foreground` para texto sobre gradiente),
  transicao, tokens de sidebar, escala neutra `--sep-space-*` e `--header-height`.
- **Tipografia**: `src/styles/_sep-ds-typography.scss` — pilha de fonte de sistema e mixins
  `sep-type-*`.
- **Componentes base (mixins)**: `src/styles/_sep-ds-components.scss` — botoes (inclui
  `sep-button-gradient`), cards, inputs, badges, navegacao, tabelas, overlays,
  loaders/skeletons, `sep-icon-chip`, `sep-quick-tile`, `sep-auth-brand-panel` + keyframes.
- **Icones**: `lucide-angular` (set curado em `src/app/core/icons/lucide-icons.ts`,
  registrado via `LucideAngularModule.pick` no `app.config`); consumidos por
  `<lucide-icon name="...">` com `aria-hidden` quando decorativos.
- **Globais**: `src/styles/index.scss` — `body` com `bg`/`fg`, transicoes de tema, cor de
  borda padrao e foco visivel via `ring`.
- **Tema claro/escuro**: `src/app/core/theme/theme.service.ts` — alterna a classe `.dark`
  no documento, persiste em `localStorage` (`SEP_THEME`) e respeita `prefers-color-scheme`.
  Alternador no header (`src/app/layout/header`).
- **Vitrine**: `src/app/features/design-system/` — rota `/design-system` demonstra paleta
  light/dark, tipografia, botoes, inputs, badges, cards, tabela, overlays, loaders,
  navegacao e (F-15) tiles de acesso rapido, chips de icone, botao gradiente e painel de marca.

## Referencias

- Spec: [`114-fsprint-14-new-design-system-web.md`](../../specs/fase-3/114-fsprint-14-new-design-system-web.md)
- Steps: [`114-fsprint-14-steps.md`](../../steps-fase-3/web/114-fsprint-14-steps.md)
- Aplicacao (F-15): [`115-fsprint-15-aplicacao-design-system-web.md`](../../specs/fase-3/115-fsprint-15-aplicacao-design-system-web.md) + [`115-fsprint-15-steps.md`](../../steps-fase-3/web/115-fsprint-15-steps.md)
- Fonte visual: [`New Design System Sep.md`](<../../docs-sep/New Design System Sep.md>)

## Regras

- Nao instalar Tailwind, shadcn/ui, Radix, React, `next-themes` ou `framer-motion` sem ADR aprovada.
- Nao usar `SimpliClin` como marca final do SEP; o nome no documento de origem e apenas referencia visual.
- Nao alterar contratos REST, regras de negocio, roles ou guards por causa de redesign.
- Migrar tokens e componentes para SCSS/Angular, preservando a arquitetura do `sep-app`.
- Consumir cores sempre via `hsl(var(--token))`; novos tokens nao usam prefixo `apple`/`notion`.
- Icones via `lucide-angular` (set curado, registrado no bootstrap); migracao para `@lucide/angular` (reescrita zoneless/signal) e divida aceita — ver spec 115.
