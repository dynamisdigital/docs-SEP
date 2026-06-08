# Design System do sep-app

## Design system vigente

A partir do Epic 17 / F-Sprint 14, o design system vigente do web passa a ser
[`New Design System Sep.md`](<../../docs-sep/New Design System Sep.md>).

Apple e Notion permanecem como historico das F-Sprints anteriores. Novas telas web devem
seguir a traducao do New Design System SEP para Angular/SCSS, mantendo a stack atual do
`sep-app` salvo ADR e aprovacao explicita em contrario.

## Referencias

- Spec: [`114-fsprint-14-new-design-system-web.md`](../../specs/fase-3/114-fsprint-14-new-design-system-web.md)
- Steps: [`114-fsprint-14-steps.md`](../../steps-fase-3/web/114-fsprint-14-steps.md)
- Fonte visual: [`New Design System Sep.md`](<../../docs-sep/New Design System Sep.md>)

## Regras

- Nao instalar Tailwind, shadcn/ui, Radix, React, `next-themes` ou `framer-motion` sem ADR aprovada.
- Nao usar `SimpliClin` como marca final do SEP; o nome no documento de origem e apenas referencia visual.
- Nao alterar contratos REST, regras de negocio, roles ou guards por causa de redesign.
- Migrar tokens e componentes para SCSS/Angular, preservando a arquitetura do `sep-app`.
