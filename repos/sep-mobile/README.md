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

Primitivos esperados na M-Sprint 12 revisada:
- chip de icone colorido mobile;
- tile de acesso rapido;
- botao gradiente;
- painel de marca para splash/welcome/login/registro;
- header/tabs/cards com estados ativos mais claros.

Preferir `ion-icon`/Ionicons, ja presente na stack mobile. Nao adicionar Tailwind, shadcn/ui,
Radix, React ou biblioteca nova de icones sem ADR/aprovacao.

Spec e steps:
- [`specs/fase-3/212-msprint-12-new-design-system-mobile.md`](../../specs/fase-3/212-msprint-12-new-design-system-mobile.md)
- [`steps-fase-3/mobile/212-msprint-12-steps.md`](../../steps-fase-3/mobile/212-msprint-12-steps.md)
