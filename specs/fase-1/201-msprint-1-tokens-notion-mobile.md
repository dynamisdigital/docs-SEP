-0'# Spec 201 - M-Sprint 1 - Tokens Notion Adaptados para Mobile + Showcase

## Metadados

- **ID da Spec**: 201
- **Titulo**: M-Sprint 1 - Tokens Notion adaptados para mobile (touch, tabs inferiores, navegacao em pilha) + Showcase
- **Status**: concluida em 2026-05-05 (branch `feature/msprint-1-tokens-notion` em `sep-mobile`; push/PR manuais pelo dev)
- **Fase do produto**: Epic 14 - Mobile SEP
- **Trilha**: Mobile (paralela a Sprint 1 backend e F-Sprint 1 frontend web)
- **Origem**: PRD - API SEP, Secao 22 + MOBILE-SCREENS-PLAN.md
- **Depende de**: [`200-msprint-0-setup-ionic.md`](./200-msprint-0-setup-ionic.md)
- **Responsavel principal**: Dev Mobile

## Objetivo

Traduzir o design system [`DESIGN-notion.md`](../../docs-sep/DESIGN-notion.md) para SCSS adaptado ao contexto mobile: tamanhos de toque (touch targets >= 44x44pt), tabs inferiores, navegacao em pilha, mixins de componentes Ionic customizados via CSS variables, e showcase navegavel para validar fidelidade visual antes de qualquer tela ser construida nas M-Sprints 2-4.

A trilha mobile **so usa Notion** (nao Apple) — a fronteira no mobile e diferente do web: ja na primeira tela (boas-vindas/landing mobile) seguimos Notion, conforme PRD §11 ("todo o mobile (visitante e autenticado) segue o design system Notion").

## Escopo

### Em escopo
- Tokens SCSS Notion adaptados para mobile: cores warm, tipografia (NotionInter via Inter fallback), espacamento, raios, sombras multilayer
- Adaptacoes mobile: touch targets minimos, font sizes para legibilidade em tela pequena, tap highlights customizados
- Mixins SCSS para componentes Ionic customizados via CSS variables (`--ion-color-primary`, `--ion-tab-bar-background`, etc.)
- Showcase mobile em rota `/design-system` (acessivel apenas em modo dev) exibindo tokens, tipografia, componentes Ionic customizados
- Documentacao inline (comentarios SCSS) do que difere do Notion web

### Fora de escopo nesta M-Sprint
- Telas reais (M-Sprint 2)
- Customizacao de componentes Ionic alem das CSS variables expostas pela biblioteca
- Tokens Apple (mobile nao usa Apple — ver PRD §11)

## Pre-requisitos globais

- M-Sprint 0 concluida (projeto Ionic + tooling completo)
- Stylelint configurado com whitelist de CSS variables Ionic
- Acesso ao [`DESIGN-notion.md`](../../docs-sep/DESIGN-notion.md)
- Familiaridade com [Ionic Theming](https://ionicframework.com/docs/theming/colors) e CSS variables `--ion-*`

## Tasks

### Task M-1.1 - Tokens SCSS Notion adaptados para mobile

**Descricao**
Extrair tokens de `DESIGN-notion.md` para SCSS, adaptando para o contexto mobile: tamanhos minimos de toque (44x44pt), font sizes legiveis em tela pequena, breakpoints mobile-first.

**Arquivos esperados**
- `src/styles/_notion-mobile-tokens.scss` (variaveis CSS + SCSS)
- `src/styles/_notion-mobile-typography.scss` (mixins de tipografia adaptados)
- `src/theme/variables.scss` (CSS variables Ionic — `--ion-color-primary`, `--ion-color-secondary`, etc., apontando para tokens Notion)

**Adaptacoes mobile**
- Touch targets minimos `44x44pt` (Apple HIG) e `48x48dp` (Material) — escolher 44pt como baseline (Apple HIG e mais conservador)
- Font sizes ajustados: corpo `16px` (em vez de 14px do desktop) para legibilidade
- Espacamento adicional em formularios para acomodar teclado virtual
- Tap highlights customizados: `--ion-tap-highlight: rgba(0, 117, 222, 0.1)` (azul Notion translucido)
- Breakpoints: usar Ionic defaults (`xs`, `sm`, `md`) mas com foco em mobile-first

**Criterios de verificacao**
- Tokens listados em `DESIGN-notion.md` mapeados em SCSS
- CSS variables Ionic (`--ion-color-primary`, etc.) configuradas em `theme/variables.scss`
- Codigo SCSS valida no Stylelint
- Documentacao inline explica adaptacoes mobile

**Pre-requisitos**
- M-Sprint 0 concluida

**Dependencias**
- nenhuma

**Responsavel sugerido**
- Dev Mobile

---

### Task M-1.2 - Mixins SCSS para componentes Ionic customizados

**Descricao**
Criar mixins SCSS reutilizaveis para os componentes Ionic mais usados (`ion-button`, `ion-card`, `ion-tabs`, `ion-input`, `ion-toast`, `ion-modal`), aplicando os tokens Notion. Garantir que `<ion-button>` parecera Notion sem reescrever o componente.

**Arquivos esperados**
- `src/styles/_notion-mobile-components.scss` (mixins por tipo de componente)

**Componentes cobertos**
- `ion-button`: variantes Notion (primary, secondary, ghost) com radius 4px (Notion), peso 500/600
- `ion-input` / `ion-item`: borders sutis, label flutuante adaptada
- `ion-card`: shadow multilayer Notion, radius 12px
- `ion-tabs` (tab bar inferior): background warm-white, ativo destacado, peso 600
- `ion-toast`: variantes success/error/warning com cores semanticas Notion
- `ion-modal`: full-screen sheet em mobile, com header

**Criterios de verificacao**
- Mixins aplicados funcionam visualmente como esperado quando inspecionado em browser/device
- Sem violacao de Stylelint
- CSS variables sao `--ion-*` (nao reinventa)

**Pre-requisitos**
- Task M-1.1 concluida

**Dependencias**
- depende de M-1.1

**Responsavel sugerido**
- Dev Mobile

---

### Task M-1.3 - Mobile Design System Showcase

**Descricao**
Criar uma rota `/design-system` (acessivel apenas em modo dev) que exibe paleta, tipografia, componentes Ionic customizados, padroes de espacamento e exemplos de tabs inferiores. Funciona como Storybook mobile leve.

**Arquivos esperados**
- `src/app/features/design-system/design-system.routes.ts`
- `src/app/features/design-system/showcase.component.ts`
- subrotas `/design-system/colors`, `/design-system/typography`, `/design-system/components`, `/design-system/navigation`

**Criterios de verificacao**
- Abre em `http://localhost:8100/design-system` em PWA
- Mostra paleta de cores, tipografia e componentes Ionic customizados (botoes, inputs, cards, tabs, toasts, modais)
- Validavel em viewport mobile (Chrome DevTools device toolbar) e em PWA real instalado
- Documentacao inline explica padroes mobile

**Pre-requisitos**
- Tasks M-1.1, M-1.2 concluidas

**Dependencias**
- depende de M-1.1 e M-1.2

**Responsavel sugerido**
- Dev Mobile

---

## Grafo de dependencias entre as tasks

```
M-1.1 (tokens SCSS Notion mobile)
       |
       v
M-1.2 (mixins de componentes Ionic)
       |
       v
M-1.3 (showcase navegavel)
```

## Definicao de pronto da M-Sprint 1

- Tokens Notion adaptados para mobile implementados em SCSS
- CSS variables Ionic (`--ion-*`) configuradas em `theme/variables.scss`
- Mixins SCSS para componentes Ionic customizados prontos
- Rota `/design-system` mostra showcase navegavel
- Tap highlights, touch targets, font sizes mobile validados em DevTools mobile viewport
- Stylelint passa em todo o SCSS

## Impacto na M-Sprint seguinte

A M-Sprint 2 (`specs/202-msprint-2-telas-publicas-mobile.md`) consome:
- Tokens Notion mobile para implementar splash, boas-vindas, login, register
- Mixins de componentes Ionic customizados para botoes, inputs, cards
- CSS variables Ionic ja configuradas

## Diferenca vs F-Sprint 1 (frontend web)

A F-Sprint 1 web traduz **dois** design systems (Apple para publico, Notion para autenticado). A M-Sprint 1 mobile so tem Notion — entao ha apenas 3 tasks (vs 3 da F-Sprint 1, mas coincidentemente) cobrindo o mesmo escopo, sem o trabalho de Apple.

## Restricoes e regras de execucao

- M-Sprint 1 pode rodar em paralelo a Sprint 1 backend e F-Sprint 1 frontend (sem dependencia)
- Reutilizar a logica de tokens da F-Sprint 1 web e tentador, mas as adaptacoes mobile (touch targets, font sizes) tornam improdutivo compartilhar arquivos diretamente — preferir copia adaptada
- Code review por Dev Senior antes de seguir para M-Sprint 2 (validar fidelidade ao Notion + adaptacoes mobile)

## Referencias

- [PRD - API SEP §11, §22](../../docs-sep/PRD.md)
- [DESIGN-notion.md](../../docs-sep/DESIGN-notion.md)
- [MOBILE-SCREENS-PLAN.md](../../docs-sep/MOBILE-SCREENS-PLAN.md)
- [ADR 0002 - Design Systems Apple e Notion](../../adr/0002-design-systems-apple-e-notion-com-scss-puro.md)
- [Ionic Theming](https://ionicframework.com/docs/theming/colors)
- [Spec 200 - M-Sprint 0 (anterior)](./200-msprint-0-setup-ionic.md)
- [Spec 202 - M-Sprint 2 (proxima)](./202-msprint-2-telas-publicas-mobile.md)
- [Spec 101 - F-Sprint 1 frontend web (paralela)](./101-fsprint-1-design-tokens-showcase.md)
