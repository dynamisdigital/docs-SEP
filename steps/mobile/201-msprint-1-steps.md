# Steps - M-Sprint 1 - Tokens Notion Mobile + Showcase

**Spec de origem**: [`specs/fase-1/201-msprint-1-tokens-notion-mobile.md`](../../specs/fase-1/201-msprint-1-tokens-notion-mobile.md)

**Objetivo geral**: traduzir o design system [`DESIGN-notion.md`](../../docs-sep/DESIGN-notion.md) para SCSS adaptado ao contexto mobile (touch targets >= 44pt, font sizes legiveis em tela pequena, tabs inferiores), customizar componentes Ionic via CSS variables `--ion-*` e entregar um showcase navegavel para validar fidelidade visual antes de qualquer tela funcional ser construida nas M-Sprints 2-4.

**Esforco total estimado**: 2-3 dias de Dev Mobile dedicado.

**Repo de destino**: `sep-mobile` (clonado em `<sep-mobile-root>/` na maquina do dev). Modelo de 3 repos independentes (PRD §11, AGENT.md).

**Localizacao do projeto mobile**: `<sep-mobile-root>/`.

**Lembrete sobre fronteira de design system** (PRD §11): no mobile **so se usa Notion**, nao Apple. A primeira tela publica (boas-vindas, na M-Sprint 2) ja segue Notion adaptado para mobile. Nao reaproveitar tokens da F-Sprint 1 web diretamente — as adaptacoes mobile (touch, fonts, tap highlights) tornam improdutivo compartilhar arquivos.

**Ordem de execucao recomendada**:

```text
M-1.0 (prechecks)
   |
   v
M-1.1 (tokens SCSS Notion mobile)
   |
   v
M-1.2 (mixins de componentes Ionic)
   |
   v
M-1.3 (showcase navegavel)
   |
   v
M-1.4 (validacao final)
```

- M-1.0 e raiz (prechecks).
- M-1.1, M-1.2 e M-1.3 sao sequenciais (cada uma depende da anterior).
- M-1.4 fecha a sprint validando suite local + fidelidade visual.

**Como usar este arquivo**:
1. Leia a Task que vai executar
2. Execute os steps na ordem
3. Em cada step, rode a verificacao antes de seguir
4. Ao final da Task, valide a "Definicao de pronto" da task
5. Comite com a mensagem sugerida (Conventional Commits)
6. Nao avance para a M-Sprint 2 sem a M-Sprint 1 verde localmente

**Pre-requisitos globais**:
- M-Sprint 0 concluida (`steps/mobile/200-msprint-0-steps.md`): Ionic 8.4+ + Angular 20.x + Capacitor 6 + tooling completo + Husky + lint-staged operacional via `husky init`
- Stylelint configurado com whitelist `--ion-*` (Step 200.2.4 da M-Sprint 0)
- Vitest com `@analogjs/vite-plugin-angular` operacional
- Acesso de leitura a `docs-sep/DESIGN-notion.md`
- Familiaridade com [Ionic Theming](https://ionicframework.com/docs/theming/colors)

**Fora de escopo durante estes steps**:
- Telas reais (M-Sprint 2 em diante)
- Tokens Apple (mobile nao usa Apple — ver PRD §11)
- Reescrita de componentes Ionic (apenas customizacao via CSS variables)
- Plataformas nativas Android/iOS (continua PWA-first)

---

## Task M-1.0 — Prechecks da M-Sprint 1

**Objetivo**: confirmar que a M-Sprint 0 esta concluida e o ambiente esta pronto antes de comecar a editar SCSS. Mesmo padrao da F-Sprint 1 web (Task F-1.0).

**Pre-requisito**: M-Sprint 0 concluida.

**Esforco**: 15 min.

### Step 201.0.1 — Confirmar existencia do app Ionic e M-Sprint 0 concluida

**Comando**:
```bash
cd <sep-mobile-root>
test -d <sep-mobile-root> && echo "OK <sep-mobile-root> existe" || echo "FALTA <sep-mobile-root> (rodar M-Sprint 0)"
test -f <sep-mobile-root>/capacitor.config.ts && echo "OK capacitor.config.ts" || echo "FALTA capacitor.config.ts"
test -f <sep-mobile-root>/src/styles/index.scss && echo "OK styles/index.scss" || echo "FALTA styles/index.scss (Step 200.1.7)"
test -f <sep-mobile-root>/src/test/setup.ts && echo "OK test/setup.ts" || echo "FALTA test/setup.ts"
```

**Espera**: todos os 4 arquivos/dirs presentes.

### Step 201.0.2 — Confirmar versoes e scripts npm

**Comando**:
```bash
cd <sep-mobile-root>
node -v          # >= v20.x
npm -v           # >= 10.x
npx ng version | grep -E "@angular/core|@angular/cli"
npm ls @ionic/angular @capacitor/core @analogjs/vite-plugin-angular --depth=0
npm run lint --silent && echo "OK lint" || echo "FALHA lint"
npm run format:check --silent && echo "OK format:check" || echo "FALHA format"
```

**Espera**:
- Angular `20.x`
- Ionic Angular `8.4.x` ou superior dentro da linha 8.x
- Capacitor `6.x`
- `@analogjs/vite-plugin-angular` `^1`
- `npm run lint` e `npm run format:check` passam

### Step 201.0.3 — Confirmar acesso ao Notion design system

**Comando**:
```bash
cd <sep-mobile-root>
test -f docs-sep/DESIGN-notion.md && echo "OK DESIGN-notion.md existe" || echo "FALTA DESIGN-notion.md"
wc -l docs-sep/DESIGN-notion.md
```

**Espera**: arquivo presente, tamanho diferente de zero. Se o arquivo nao existir, parar a sprint e procurar pelo Dev Senior.

### Step 201.0.4 — Rodar baseline antes de editar

**Comando**:
```bash
cd <sep-mobile-root>
npm run build
npm run test
```

**Espera**: build e test passam (smoke test do `app.component.spec.ts` da M-Sprint 0 deve continuar verde). Se algo falhar **antes** de qualquer alteracao, e bug a corrigir antes de avancar.

### Definicao de pronto da Task M-1.0
- [ ] Estrutura `<sep-mobile-root>/` validada
- [ ] Versoes de Angular 20, Ionic 8.4+ e Capacitor 6 confirmadas
- [ ] Stylelint com suporte a `--ion-*` validado pelo `npm run lint`
- [ ] Vitest com `@analogjs/vite-plugin-angular` operacional
- [ ] `docs-sep/DESIGN-notion.md` acessivel
- [ ] Baseline `npm run build` e `npm run test` verdes antes de qualquer alteracao

### Commit Task M-1.0
Nao gera commit — e apenas validacao do ambiente.

---

## Task M-1.1 — Tokens SCSS Notion adaptados para mobile

**Objetivo**: extrair tokens de `DESIGN-notion.md` (cores warm, tipografia Inter/NotionInter, espacamento, raios, sombras multilayer) para SCSS, adaptando para contexto mobile: touch targets minimos, font sizes legiveis em tela pequena, tap highlights customizados. Configurar as CSS variables `--ion-*` em `theme/variables.scss` apontando para os tokens Notion.

**Pre-requisito**: M-Sprint 0 concluida; Task M-1.0 ok.

**Esforco**: 4-6 horas.

### Step 201.1.1 — Criar `_notion-mobile-tokens.scss`

**Arquivo**: `<sep-mobile-root>/src/styles/_notion-mobile-tokens.scss`

**Conteudo**:
```scss
// =============================================================================
// Tokens Notion adaptados para mobile (PRD §11, ADR 0002)
// =============================================================================
// Origem: docs-sep/DESIGN-notion.md
// Adaptacoes mobile: touch targets >= 44pt (Apple HIG), font sizes mobile-first,
// tap highlights translucidos para feedback de toque.
//
// Convencao:
// - Variaveis SCSS ($notion-*) para uso em mixins/calculos
// - CSS custom properties (--notion-*) para uso em componentes ao vivo
// =============================================================================

// -----------------------------------------------------------------------------
// Paleta de cores (warm Notion)
// -----------------------------------------------------------------------------

// Cores neutras (warm)
$notion-bg-primary: #ffffff;
$notion-bg-secondary: #f7f6f3;       // warm-white
$notion-bg-tertiary: #efeeec;
$notion-bg-hover: rgba(55, 53, 47, 0.06);

$notion-text-primary: rgb(55, 53, 47);
$notion-text-secondary: rgba(55, 53, 47, 0.65);
$notion-text-tertiary: rgba(55, 53, 47, 0.45);
$notion-text-inverse: #ffffff;

$notion-border: rgba(55, 53, 47, 0.16);
$notion-border-strong: rgba(55, 53, 47, 0.3);

// Cores semanticas (Notion blue-leaning)
$notion-color-primary: rgb(35, 131, 226);    // azul Notion
$notion-color-primary-shade: rgb(28, 105, 181);
$notion-color-primary-tint: rgb(60, 145, 230);

$notion-color-success: rgb(68, 131, 97);
$notion-color-warning: rgb(217, 115, 13);
$notion-color-danger: rgb(212, 76, 71);

// Tap highlight (azul Notion translucido)
$notion-tap-highlight: rgba(35, 131, 226, 0.1);

// -----------------------------------------------------------------------------
// Tipografia (mobile-first com fallback Inter)
// -----------------------------------------------------------------------------

$notion-font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
  Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
$notion-font-family-mono: 'JetBrains Mono', 'Fira Code', SFMono-Regular, Consolas,
  'Liberation Mono', Menlo, monospace;

// Font sizes mobile (corpo aumenta de 14px desktop -> 16px mobile)
$notion-font-size-xs: 12px;
$notion-font-size-sm: 14px;
$notion-font-size-base: 16px;        // corpo mobile (vs 14px desktop)
$notion-font-size-lg: 18px;
$notion-font-size-xl: 20px;
$notion-font-size-2xl: 24px;
$notion-font-size-3xl: 30px;

// Line heights (mais generosos no mobile)
$notion-line-height-tight: 1.2;
$notion-line-height-base: 1.5;
$notion-line-height-relaxed: 1.7;

// Pesos
$notion-font-weight-regular: 400;
$notion-font-weight-medium: 500;
$notion-font-weight-semibold: 600;
$notion-font-weight-bold: 700;

// -----------------------------------------------------------------------------
// Espacamento (4px base)
// -----------------------------------------------------------------------------

$notion-space-1: 4px;
$notion-space-2: 8px;
$notion-space-3: 12px;
$notion-space-4: 16px;
$notion-space-5: 20px;
$notion-space-6: 24px;
$notion-space-8: 32px;
$notion-space-10: 40px;
$notion-space-12: 48px;
$notion-space-16: 64px;

// -----------------------------------------------------------------------------
// Touch targets (PRD §11; Apple HIG)
// -----------------------------------------------------------------------------

$notion-touch-target-min: 44px;       // baseline Apple HIG
$notion-touch-target-comfortable: 48px;

// -----------------------------------------------------------------------------
// Raios (Notion usa raios discretos)
// -----------------------------------------------------------------------------

$notion-radius-sm: 4px;               // botoes, inputs
$notion-radius-md: 8px;
$notion-radius-lg: 12px;              // cards
$notion-radius-pill: 9999px;

// -----------------------------------------------------------------------------
// Sombras multilayer (Notion usa sombras sutis em camadas)
// -----------------------------------------------------------------------------

$notion-shadow-xs: 0 1px 2px rgba(15, 15, 15, 0.04);
$notion-shadow-sm: 0 1px 3px rgba(15, 15, 15, 0.06), 0 1px 2px rgba(15, 15, 15, 0.04);
$notion-shadow-md:
  0 2px 4px rgba(15, 15, 15, 0.06),
  0 4px 8px rgba(15, 15, 15, 0.04);
$notion-shadow-lg:
  0 4px 8px rgba(15, 15, 15, 0.08),
  0 8px 16px rgba(15, 15, 15, 0.04);

// -----------------------------------------------------------------------------
// Z-index escala
// -----------------------------------------------------------------------------

$notion-z-tab-bar: 100;
$notion-z-modal: 1000;
$notion-z-toast: 1100;

// -----------------------------------------------------------------------------
// Transicoes (curtas no mobile para sensacao responsiva)
// -----------------------------------------------------------------------------

$notion-transition-fast: 120ms ease-out;
$notion-transition-base: 180ms ease-out;
$notion-transition-slow: 240ms ease-out;

// -----------------------------------------------------------------------------
// CSS Custom Properties expostas para uso em runtime
// -----------------------------------------------------------------------------

:root {
  // Cores
  --notion-bg-primary: #{$notion-bg-primary};
  --notion-bg-secondary: #{$notion-bg-secondary};
  --notion-bg-tertiary: #{$notion-bg-tertiary};
  --notion-text-primary: #{$notion-text-primary};
  --notion-text-secondary: #{$notion-text-secondary};
  --notion-text-tertiary: #{$notion-text-tertiary};
  --notion-text-inverse: #{$notion-text-inverse};
  --notion-border: #{$notion-border};
  --notion-tap-highlight: #{$notion-tap-highlight};

  // Tipografia
  --notion-font-family: #{$notion-font-family};
  --notion-font-size-base: #{$notion-font-size-base};

  // Espacamento
  --notion-space-4: #{$notion-space-4};
  --notion-space-6: #{$notion-space-6};

  // Touch
  --notion-touch-target-min: #{$notion-touch-target-min};

  // Sombras
  --notion-shadow-sm: #{$notion-shadow-sm};
  --notion-shadow-md: #{$notion-shadow-md};
}
```

### Step 201.1.2 — Criar `_notion-mobile-typography.scss`

**Arquivo**: `<sep-mobile-root>/src/styles/_notion-mobile-typography.scss`

**Conteudo**:
```scss
// =============================================================================
// Mixins de tipografia Notion adaptados para mobile
// =============================================================================
// Diferencas vs web:
// - Corpo 16px (vs 14px) para legibilidade em tela pequena
// - Line-height mais generoso
// - Pesos preferenciais 500/600 (Notion usa textos densos com peso medio)
// =============================================================================

@use 'notion-mobile-tokens' as *;

@mixin notion-text-base {
  font-family: $notion-font-family;
  font-size: $notion-font-size-base;
  line-height: $notion-line-height-base;
  font-weight: $notion-font-weight-regular;
  color: $notion-text-primary;
  letter-spacing: -0.011em;            // sutil tracking negativo do Notion
}

@mixin notion-text-secondary {
  @include notion-text-base;
  font-size: $notion-font-size-sm;
  color: $notion-text-secondary;
}

@mixin notion-text-caption {
  @include notion-text-base;
  font-size: $notion-font-size-xs;
  color: $notion-text-tertiary;
  letter-spacing: 0;
}

@mixin notion-heading-1 {
  font-family: $notion-font-family;
  font-size: $notion-font-size-3xl;
  line-height: $notion-line-height-tight;
  font-weight: $notion-font-weight-bold;
  color: $notion-text-primary;
  letter-spacing: -0.022em;
}

@mixin notion-heading-2 {
  font-family: $notion-font-family;
  font-size: $notion-font-size-2xl;
  line-height: $notion-line-height-tight;
  font-weight: $notion-font-weight-semibold;
  color: $notion-text-primary;
  letter-spacing: -0.018em;
}

@mixin notion-heading-3 {
  font-family: $notion-font-family;
  font-size: $notion-font-size-xl;
  line-height: $notion-line-height-tight;
  font-weight: $notion-font-weight-semibold;
  color: $notion-text-primary;
}

@mixin notion-button-text {
  font-family: $notion-font-family;
  font-size: $notion-font-size-base;
  font-weight: $notion-font-weight-medium;
  line-height: 1;
  letter-spacing: -0.005em;
}

@mixin notion-label {
  font-family: $notion-font-family;
  font-size: $notion-font-size-sm;
  font-weight: $notion-font-weight-medium;
  color: $notion-text-secondary;
  text-transform: none;
}

@mixin notion-mono {
  font-family: $notion-font-family-mono;
  font-size: $notion-font-size-sm;
  font-weight: $notion-font-weight-regular;
}
```

### Step 201.1.3 — Configurar `theme/variables.scss` com CSS vars Ionic apontando para Notion

O arquivo `<sep-mobile-root>/src/theme/variables.scss` ja foi criado pelo scaffold da M-Sprint 0 (template default do Ionic). Agora vamos sobrescrever as `--ion-*` para apontar aos tokens Notion.

**Arquivo**: `<sep-mobile-root>/src/theme/variables.scss`

**Conteudo** (substituir o que veio do scaffold):
```scss
// =============================================================================
// CSS variables Ionic mapeadas para tokens Notion mobile (M-Sprint 1)
// =============================================================================
// Aqui mapeamos as variaveis --ion-* expostas pelos componentes Ionic para os
// tokens warm do Notion. Componentes Ionic continuam funcionando, mas agora
// "parecem" Notion sem reescreve-los.
//
// Ver: https://ionicframework.com/docs/theming/colors
// =============================================================================

@use '../styles/notion-mobile-tokens' as notion;

:root {
  // ---------------------------------------------------------------------------
  // Cor primaria (azul Notion)
  // ---------------------------------------------------------------------------
  --ion-color-primary: #{notion.$notion-color-primary};
  --ion-color-primary-rgb: 35, 131, 226;
  --ion-color-primary-contrast: #{notion.$notion-text-inverse};
  --ion-color-primary-contrast-rgb: 255, 255, 255;
  --ion-color-primary-shade: #{notion.$notion-color-primary-shade};
  --ion-color-primary-tint: #{notion.$notion-color-primary-tint};

  // ---------------------------------------------------------------------------
  // Secundaria (texto secundario do Notion)
  // ---------------------------------------------------------------------------
  --ion-color-secondary: #{notion.$notion-text-secondary};
  --ion-color-secondary-rgb: 55, 53, 47;
  --ion-color-secondary-contrast: #{notion.$notion-text-inverse};
  --ion-color-secondary-contrast-rgb: 255, 255, 255;

  // ---------------------------------------------------------------------------
  // Semanticas
  // ---------------------------------------------------------------------------
  --ion-color-success: #{notion.$notion-color-success};
  --ion-color-success-rgb: 68, 131, 97;
  --ion-color-success-contrast: #ffffff;
  --ion-color-success-contrast-rgb: 255, 255, 255;

  --ion-color-warning: #{notion.$notion-color-warning};
  --ion-color-warning-rgb: 217, 115, 13;
  --ion-color-warning-contrast: #ffffff;

  --ion-color-danger: #{notion.$notion-color-danger};
  --ion-color-danger-rgb: 212, 76, 71;
  --ion-color-danger-contrast: #ffffff;

  // ---------------------------------------------------------------------------
  // Backgrounds (warm Notion)
  // ---------------------------------------------------------------------------
  --ion-background-color: #{notion.$notion-bg-primary};
  --ion-background-color-rgb: 255, 255, 255;

  --ion-text-color: #{notion.$notion-text-primary};
  --ion-text-color-rgb: 55, 53, 47;

  --ion-color-step-50: #{notion.$notion-bg-secondary};
  --ion-color-step-100: #{notion.$notion-bg-tertiary};

  // ---------------------------------------------------------------------------
  // Toolbar (header) e Tab bar (rodape)
  // ---------------------------------------------------------------------------
  --ion-toolbar-background: #{notion.$notion-bg-primary};
  --ion-toolbar-color: #{notion.$notion-text-primary};

  --ion-tab-bar-background: #{notion.$notion-bg-primary};
  --ion-tab-bar-color: #{notion.$notion-text-secondary};
  --ion-tab-bar-color-selected: #{notion.$notion-color-primary};
  --ion-tab-bar-border-color: #{notion.$notion-border};

  // ---------------------------------------------------------------------------
  // Tipografia
  // ---------------------------------------------------------------------------
  --ion-font-family: #{notion.$notion-font-family};

  // ---------------------------------------------------------------------------
  // Tap highlight (azul Notion translucido — feedback de toque)
  // ---------------------------------------------------------------------------
  --ion-tap-highlight: #{notion.$notion-tap-highlight};
}
```

### Step 201.1.4 — Atualizar `index.scss` para incluir os novos arquivos

A M-Sprint 0 ja criou o `<sep-mobile-root>/src/styles/index.scss` com placeholders. Agora atualizamos para usar os tokens reais.

**Arquivo**: `<sep-mobile-root>/src/styles/index.scss`

**Conteudo** (substituir o placeholder da M-Sprint 0):
```scss
// =============================================================================
// Indice central de estilos do app SEP Mobile (M-Sprint 1)
// =============================================================================
// Ordem importa:
// 1. Tokens (variaveis SCSS + CSS custom properties)
// 2. Tipografia (mixins que usam tokens)
// 3. Componentes (mixins que usam tokens + tipografia)
// 4. Overrides Ionic (selector `:root` ja em theme/variables.scss)
// =============================================================================

@use 'notion-mobile-tokens' as *;
@use 'notion-mobile-typography' as *;
@use 'notion-mobile-components' as *;     // criado na Task M-1.2
@use 'mixins' as *;                       // placeholder da M-Sprint 0; opcional
```

E remover/limpar `_notion-mobile.scss` e `_ionic-overrides.scss` (placeholders da M-Sprint 0 que sao substituidos pelos arquivos reais desta sprint):

```bash
cd <sep-mobile-root>/src/styles
rm -f _notion-mobile.scss _ionic-overrides.scss
```

Atualizar tambem `app.component.scss` (vazio do scaffold) para ter um exemplo minimo:
```scss
// Ver src/styles/index.scss e mixins reusaveis
```

### Step 201.1.5 — Validar Stylelint + build

**Comando**:
```bash
cd <sep-mobile-root>
npm run lint:scss
npm run build
```

**Espera**:
- `npm run lint:scss` passa (Stylelint config standard SCSS aceita os tokens)
- `npm run build` gera `www/` sem erros

Se o Stylelint reclamar de selector pattern, lembrar que a M-Sprint 0 (Step 200.2.4) ja desabilitou `selector-class-pattern` e ajustou `custom-property-pattern` para aceitar `--ion-*`.

### Definicao de pronto da Task M-1.1
- [ ] `src/styles/_notion-mobile-tokens.scss` com paleta + tipografia + espacamento + touch + raios + sombras
- [ ] `src/styles/_notion-mobile-typography.scss` com mixins de tipografia Notion mobile
- [ ] `src/theme/variables.scss` com CSS vars `--ion-*` apontando para tokens Notion
- [ ] `src/styles/index.scss` atualizado removendo placeholders e usando arquivos reais
- [ ] Touch target minimo 44pt + corpo 16px + tap highlight azul Notion
- [ ] `npm run lint:scss` passa
- [ ] `npm run build` passa

### Commit Task M-1.1
```bash
cd <sep-mobile-root>
git add <sep-mobile-root>/src/styles/_notion-mobile-tokens.scss
git add <sep-mobile-root>/src/styles/_notion-mobile-typography.scss
git add <sep-mobile-root>/src/styles/index.scss
git add <sep-mobile-root>/src/theme/variables.scss
git rm -f <sep-mobile-root>/src/styles/_notion-mobile.scss <sep-mobile-root>/src/styles/_ionic-overrides.scss 2>/dev/null || true
git commit -m "feat(mobile): tokens SCSS Notion adaptados para mobile + CSS vars Ionic"
```

---

## Task M-1.2 — Mixins SCSS para componentes Ionic customizados

**Objetivo**: criar mixins SCSS reutilizaveis para os componentes Ionic mais usados (`ion-button`, `ion-input`, `ion-card`, `ion-tabs`, `ion-toast`, `ion-modal`), aplicando os tokens Notion. Componentes Ionic continuam sendo Ionic — apenas ganham aparencia Notion via CSS variables e selectors globais minimos.

**Pre-requisito**: Task M-1.1 concluida.

**Esforco**: 3-5 horas.

### Step 201.2.1 — Criar `_notion-mobile-components.scss`

**Arquivo**: `<sep-mobile-root>/src/styles/_notion-mobile-components.scss`

**Conteudo**:
```scss
// =============================================================================
// Mixins SCSS para componentes Ionic customizados com tokens Notion (M-Sprint 1)
// =============================================================================
// Cada mixin aplica os tokens via CSS variables `--ion-*` ou via parts (::part).
// O objetivo e usar os componentes Ionic AS-IS sem reescrever, garantindo
// fidelidade visual ao Notion mobile.
// =============================================================================

@use 'notion-mobile-tokens' as *;
@use 'notion-mobile-typography' as *;

// -----------------------------------------------------------------------------
// ion-button — variantes Notion (primary, secondary, ghost)
// -----------------------------------------------------------------------------

@mixin notion-ion-button-base {
  --border-radius: #{$notion-radius-sm};
  --padding-start: #{$notion-space-4};
  --padding-end: #{$notion-space-4};
  --padding-top: 0;
  --padding-bottom: 0;
  --min-height: #{$notion-touch-target-min};

  font-family: $notion-font-family;
  font-size: $notion-font-size-base;
  font-weight: $notion-font-weight-medium;
  letter-spacing: -0.005em;
  text-transform: none;
}

@mixin notion-ion-button-primary {
  @include notion-ion-button-base;
  --background: var(--ion-color-primary);
  --background-hover: var(--ion-color-primary-shade);
  --background-activated: var(--ion-color-primary-shade);
  --color: var(--ion-color-primary-contrast);
  --box-shadow: #{$notion-shadow-xs};
}

@mixin notion-ion-button-secondary {
  @include notion-ion-button-base;
  --background: var(--ion-background-color);
  --background-hover: var(--notion-bg-secondary, #{$notion-bg-secondary});
  --color: var(--ion-text-color);
  --border-color: #{$notion-border};
  --border-style: solid;
  --border-width: 1px;
  --box-shadow: none;
}

@mixin notion-ion-button-ghost {
  @include notion-ion-button-base;
  --background: transparent;
  --background-hover: var(--notion-bg-secondary, #{$notion-bg-secondary});
  --color: var(--ion-text-color);
  --box-shadow: none;
}

// -----------------------------------------------------------------------------
// ion-input + ion-item — borda discreta + label flutuante
// -----------------------------------------------------------------------------

@mixin notion-ion-input {
  --background: var(--ion-background-color);
  --color: var(--ion-text-color);
  --placeholder-color: #{$notion-text-tertiary};
  --placeholder-opacity: 1;
  --padding-start: #{$notion-space-3};
  --padding-end: #{$notion-space-3};
  --padding-top: #{$notion-space-3};
  --padding-bottom: #{$notion-space-3};
  --min-height: #{$notion-touch-target-min};

  font-family: $notion-font-family;
  font-size: $notion-font-size-base;
  border-radius: $notion-radius-sm;
  border: 1px solid #{$notion-border};
  transition: border-color $notion-transition-fast;

  &:focus-within,
  &.has-focus {
    border-color: var(--ion-color-primary);
  }
}

@mixin notion-ion-item {
  --background: transparent;
  --background-hover: var(--notion-bg-secondary, #{$notion-bg-secondary});
  --background-focused: var(--notion-bg-secondary, #{$notion-bg-secondary});
  --color: var(--ion-text-color);
  --inner-padding-start: #{$notion-space-4};
  --inner-padding-end: #{$notion-space-4};
  --min-height: #{$notion-touch-target-min};
  --border-color: #{$notion-border};

  font-family: $notion-font-family;
  font-size: $notion-font-size-base;
}

// -----------------------------------------------------------------------------
// ion-card — sombra multilayer + radius generoso
// -----------------------------------------------------------------------------

@mixin notion-ion-card {
  --background: var(--ion-background-color);
  --color: var(--ion-text-color);

  border-radius: $notion-radius-lg;
  box-shadow: $notion-shadow-sm;
  margin: $notion-space-4 0;
  padding: $notion-space-4;
  font-family: $notion-font-family;

  &:hover {
    box-shadow: $notion-shadow-md;
  }
}

// -----------------------------------------------------------------------------
// ion-tabs (tab bar inferior — diferencial mobile chave)
// -----------------------------------------------------------------------------

@mixin notion-ion-tab-bar {
  --background: var(--ion-tab-bar-background);
  --color: var(--ion-tab-bar-color);
  --color-selected: var(--ion-tab-bar-color-selected);
  --border: 1px solid var(--ion-tab-bar-border-color);

  height: 56px;                       // padrao mobile
  z-index: $notion-z-tab-bar;

  ion-tab-button {
    --color: var(--ion-tab-bar-color);
    --color-selected: var(--ion-tab-bar-color-selected);
    --padding-top: #{$notion-space-1};
    --padding-bottom: #{$notion-space-1};

    font-family: $notion-font-family;
    font-size: $notion-font-size-xs;
    font-weight: $notion-font-weight-medium;

    &.tab-selected {
      font-weight: $notion-font-weight-semibold;
    }
  }
}

// -----------------------------------------------------------------------------
// ion-toast — variantes semanticas
// -----------------------------------------------------------------------------

@mixin notion-ion-toast {
  --background: var(--ion-text-color);
  --color: var(--ion-text-color-step-100, var(--ion-text-color));
  --border-radius: #{$notion-radius-md};
  --box-shadow: #{$notion-shadow-md};

  font-family: $notion-font-family;
  font-size: $notion-font-size-sm;

  &.toast-success {
    --background: var(--ion-color-success);
    --color: #ffffff;
  }

  &.toast-warning {
    --background: var(--ion-color-warning);
    --color: #ffffff;
  }

  &.toast-error {
    --background: var(--ion-color-danger);
    --color: #ffffff;
  }
}

// -----------------------------------------------------------------------------
// ion-modal — sheet full-screen mobile
// -----------------------------------------------------------------------------

@mixin notion-ion-modal {
  --background: var(--ion-background-color);
  --color: var(--ion-text-color);
  --border-radius: #{$notion-radius-lg} #{$notion-radius-lg} 0 0;
  --box-shadow: #{$notion-shadow-lg};

  font-family: $notion-font-family;

  ion-toolbar {
    --background: var(--ion-background-color);
    --color: var(--ion-text-color);
    --border-color: #{$notion-border};
  }
}
```

### Step 201.2.2 — Criar `global.scss` com aplicacao global dos mixins

O Ionic CLI gera por default um `src/global.scss` (incluido pelo `angular.json` da M-Sprint 0 Step 200.1.8). Vamos populá-lo com os mixins aplicados aos selectors Ionic globais.

**Arquivo**: `<sep-mobile-root>/src/global.scss`

**Conteudo** (substituir):
```scss
// =============================================================================
// Estilos globais aplicados a componentes Ionic com mixins Notion mobile
// =============================================================================
// Estes selectors aplicam a aparencia Notion a TODOS os componentes Ionic do
// app de uma vez. Variantes especificas (primary/secondary/ghost de botao,
// success/error de toast) sao aplicadas via classes CSS no template.
// =============================================================================

@use 'styles/notion-mobile-components' as *;

// Botoes
ion-button {
  @include notion-ion-button-base;

  &[color='primary'],
  &.notion-primary {
    @include notion-ion-button-primary;
  }

  &[color='medium'],
  &.notion-secondary {
    @include notion-ion-button-secondary;
  }

  &[fill='clear'],
  &.notion-ghost {
    @include notion-ion-button-ghost;
  }
}

// Inputs
ion-input,
ion-textarea {
  @include notion-ion-input;
}

ion-item {
  @include notion-ion-item;
}

// Cards
ion-card {
  @include notion-ion-card;
}

// Tab bar inferior
ion-tab-bar {
  @include notion-ion-tab-bar;
}

// Toast
ion-toast {
  @include notion-ion-toast;
}

// Modal
ion-modal {
  @include notion-ion-modal;
}

// Body global (corpo 16px Notion mobile)
body {
  font-family: var(--ion-font-family);
  font-size: var(--notion-font-size-base, 16px);
  color: var(--ion-text-color);
  background: var(--ion-background-color);
  -webkit-tap-highlight-color: var(--notion-tap-highlight);
}
```

### Step 201.2.3 — Garantir que `angular.json` inclui `global.scss` e `styles/index.scss`

Verificar que ambos estao no array de styles do build. A M-Sprint 0 Step 200.1.8 ja deveria ter feito isso.

**Comando**:
```bash
cd <sep-mobile-root>
node -e "
  const j = require('./angular.json');
  const project = Object.values(j.projects)[0];
  console.log('Styles configurados:', project.architect.build.options.styles);
"
```

**Espera** (todos 3 presentes):
- `src/theme/variables.scss`
- `src/global.scss`
- `src/styles/index.scss`

Se algum estiver faltando, ajustar `angular.json` em `projects.<nome>.architect.build.options.styles`:
```json
"styles": [
  "src/theme/variables.scss",
  "src/global.scss",
  "src/styles/index.scss"
]
```

### Step 201.2.4 — Smoke build PWA

**Comando**:
```bash
cd <sep-mobile-root>
npm run lint
npm run lint:scss
npm run build
```

**Espera**: tudo verde. Se houver erro tipo "Cannot find @use 'notion-mobile-components'", confirmar que o arquivo `_notion-mobile-components.scss` esta em `src/styles/` (com underscore inicial).

### Definicao de pronto da Task M-1.2
- [ ] `src/styles/_notion-mobile-components.scss` com mixins para 6 componentes Ionic principais
- [ ] `src/global.scss` aplica os mixins globalmente em selectors Ionic
- [ ] `angular.json` inclui `theme/variables.scss`, `global.scss` e `styles/index.scss` no build
- [ ] Variantes de botao (`notion-primary`, `notion-secondary`, `notion-ghost`) implementadas
- [ ] Variantes de toast (`toast-success`, `toast-warning`, `toast-error`) implementadas
- [ ] `npm run lint && npm run lint:scss && npm run build` verde

### Commit Task M-1.2
```bash
cd <sep-mobile-root>
git add <sep-mobile-root>/src/styles/_notion-mobile-components.scss
git add <sep-mobile-root>/src/global.scss
git add <sep-mobile-root>/angular.json
git commit -m "feat(mobile): mixins SCSS para componentes Ionic customizados via tokens Notion"
```

---

## Task M-1.3 — Mobile Design System Showcase

**Objetivo**: criar uma rota `/design-system` (lazy) que exibe paleta, tipografia, componentes Ionic customizados, espacamento e exemplo de tabs inferiores. Funciona como Storybook leve para validar fidelidade visual antes da M-Sprint 2.

**Pre-requisito**: Tasks M-1.1 e M-1.2 concluidas.

**Esforco**: 4-6 horas.

### Step 201.3.1 — Criar rota lazy `/design-system`

**Arquivo**: `<sep-mobile-root>/src/app/app.routes.ts`

Adicionar a rota lazy do design system. Conteudo esperado (preservar rotas existentes):
```ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  // Rota raiz padrao do scaffold (substituida na M-Sprint 2)
  {
    path: '',
    loadComponent: () =>
      import('./home/home.page').then((m) => m.HomePage),
  },

  // Showcase do design system mobile (acessivel apenas em dev)
  {
    path: 'design-system',
    loadChildren: () =>
      import('./features/design-system/design-system.routes').then(
        (m) => m.DESIGN_SYSTEM_ROUTES,
      ),
  },
];
```

> Nota: o componente `home.page` e o gerado pelo template `blank` da M-Sprint 0. Na M-Sprint 2 ele sera substituido por `splash`/`boas-vindas`.

### Step 201.3.2 — Criar arquivo de rotas do showcase

**Arquivo**: `<sep-mobile-root>/src/app/features/design-system/design-system.routes.ts`

**Conteudo**:
```ts
import { Routes } from '@angular/router';

export const DESIGN_SYSTEM_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./showcase.component').then((m) => m.ShowcaseComponent),
    children: [
      {
        path: '',
        redirectTo: 'colors',
        pathMatch: 'full',
      },
      {
        path: 'colors',
        loadComponent: () =>
          import('./pages/colors.component').then((m) => m.ColorsComponent),
      },
      {
        path: 'typography',
        loadComponent: () =>
          import('./pages/typography.component').then((m) => m.TypographyComponent),
      },
      {
        path: 'components',
        loadComponent: () =>
          import('./pages/components.component').then((m) => m.ComponentsComponent),
      },
      {
        path: 'navigation',
        loadComponent: () =>
          import('./pages/navigation.component').then((m) => m.NavigationComponent),
      },
    ],
  },
];
```

### Step 201.3.3 — Criar componente `ShowcaseComponent` (shell com tabs)

**Arquivo**: `<sep-mobile-root>/src/app/features/design-system/showcase.component.ts`

**Conteudo**:
```ts
import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  colorPaletteOutline,
  cubeOutline,
  navigateOutline,
  textOutline,
} from 'ionicons/icons';

@Component({
  selector: 'sep-design-system-showcase',
  standalone: true,
  imports: [
    RouterLink,
    RouterOutlet,
    IonContent,
    IonHeader,
    IonIcon,
    IonLabel,
    IonRouterOutlet,
    IonTabBar,
    IonTabButton,
    IonTabs,
    IonTitle,
    IonToolbar,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Design System (Notion Mobile)</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="colors" routerLink="colors">
          <ion-icon name="color-palette-outline"></ion-icon>
          <ion-label>Cores</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="typography" routerLink="typography">
          <ion-icon name="text-outline"></ion-icon>
          <ion-label>Tipografia</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="components" routerLink="components">
          <ion-icon name="cube-outline"></ion-icon>
          <ion-label>Componentes</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="navigation" routerLink="navigation">
          <ion-icon name="navigate-outline"></ion-icon>
          <ion-label>Navegacao</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
})
export class ShowcaseComponent {
  constructor() {
    addIcons({ colorPaletteOutline, textOutline, cubeOutline, navigateOutline });
  }
}
```

### Step 201.3.4 — Criar 4 paginas do showcase (colors, typography, components, navigation)

**Arquivo**: `<sep-mobile-root>/src/app/features/design-system/pages/colors.component.ts`
```ts
import { Component } from '@angular/core';
import { IonContent, IonItem, IonLabel, IonList } from '@ionic/angular/standalone';

interface Cor {
  nome: string;
  variavel: string;
  hex: string;
}

@Component({
  selector: 'sep-ds-colors',
  standalone: true,
  imports: [IonContent, IonItem, IonLabel, IonList],
  template: `
    <ion-content class="ion-padding">
      <h2>Paleta Notion Mobile</h2>
      <ion-list>
        <ion-item *ngFor="let c of cores">
          <div class="swatch" [style.background]="c.hex"></div>
          <ion-label>
            <h3>{{ c.nome }}</h3>
            <p>
              <code>{{ c.variavel }}</code> - {{ c.hex }}
            </p>
          </ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
  styles: [
    `
      .swatch {
        width: 44px;
        height: 44px;
        border-radius: 4px;
        margin-right: 16px;
        border: 1px solid var(--notion-border, rgba(55, 53, 47, 0.16));
      }
    `,
  ],
})
export class ColorsComponent {
  cores: Cor[] = [
    { nome: 'Primary (Notion blue)', variavel: '--ion-color-primary', hex: '#2383E2' },
    { nome: 'Success', variavel: '--ion-color-success', hex: '#448361' },
    { nome: 'Warning', variavel: '--ion-color-warning', hex: '#D9730D' },
    { nome: 'Danger', variavel: '--ion-color-danger', hex: '#D44C47' },
    { nome: 'Background primary', variavel: '--ion-background-color', hex: '#FFFFFF' },
    { nome: 'Background secondary (warm)', variavel: '--notion-bg-secondary', hex: '#F7F6F3' },
    { nome: 'Text primary', variavel: '--ion-text-color', hex: '#37352F' },
    { nome: 'Text secondary', variavel: '--notion-text-secondary', hex: '#373d2fa6' },
  ];
}
```

**Arquivo**: `<sep-mobile-root>/src/app/features/design-system/pages/typography.component.ts`
```ts
import { Component } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'sep-ds-typography',
  standalone: true,
  imports: [IonContent],
  template: `
    <ion-content class="ion-padding">
      <h1 class="t-h1">Heading 1 - 30px / Bold</h1>
      <h2 class="t-h2">Heading 2 - 24px / SemiBold</h2>
      <h3 class="t-h3">Heading 3 - 20px / SemiBold</h3>
      <p class="t-base">Texto base - 16px / Regular. Corpo legivel em mobile.</p>
      <p class="t-secondary">Texto secundario - 14px / Regular. Cor reduzida.</p>
      <p class="t-caption">Caption - 12px / Regular. Para metadados.</p>
      <p class="t-label">LABEL - 14px / Medium</p>
      <p class="t-mono">Mono - 14px / monospace</p>
    </ion-content>
  `,
  styleUrl: './typography.component.scss',
})
export class TypographyComponent {}
```

**Arquivo**: `<sep-mobile-root>/src/app/features/design-system/pages/typography.component.scss`
```scss
@use '../../../../styles/notion-mobile-typography' as t;

.t-h1 { @include t.notion-heading-1; }
.t-h2 { @include t.notion-heading-2; }
.t-h3 { @include t.notion-heading-3; }
.t-base { @include t.notion-text-base; }
.t-secondary { @include t.notion-text-secondary; }
.t-caption { @include t.notion-text-caption; }
.t-label { @include t.notion-label; }
.t-mono { @include t.notion-mono; }
```

**Arquivo**: `<sep-mobile-root>/src/app/features/design-system/pages/components.component.ts`
```ts
import { Component } from '@angular/core';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonToast,
} from '@ionic/angular/standalone';

@Component({
  selector: 'sep-ds-components',
  standalone: true,
  imports: [
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonContent,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonToast,
  ],
  template: `
    <ion-content class="ion-padding">
      <h2>Botoes</h2>
      <ion-button color="primary">Primary</ion-button>
      <ion-button color="medium" class="notion-secondary">Secondary</ion-button>
      <ion-button fill="clear">Ghost</ion-button>

      <h2>Inputs</h2>
      <ion-list>
        <ion-item>
          <ion-input label="E-mail" labelPlacement="floating" placeholder="seu@email.com" />
        </ion-item>
        <ion-item>
          <ion-input label="Senha" labelPlacement="floating" type="password" />
        </ion-item>
      </ion-list>

      <h2>Cards</h2>
      <ion-card>
        <ion-card-header>
          <ion-card-title>Titulo do Card</ion-card-title>
          <ion-card-subtitle>Subtitulo</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          Notion mobile card com sombra multilayer e radius 12px.
        </ion-card-content>
      </ion-card>

      <h2>Toasts</h2>
      <ion-button (click)="toastSuccessAberto = true">Toast success</ion-button>
      <ion-button (click)="toastErrorAberto = true">Toast error</ion-button>

      <ion-toast
        [isOpen]="toastSuccessAberto"
        message="Operacao concluida"
        duration="2000"
        cssClass="toast-success"
        (didDismiss)="toastSuccessAberto = false"
      />
      <ion-toast
        [isOpen]="toastErrorAberto"
        message="Erro ao processar"
        duration="2000"
        cssClass="toast-error"
        (didDismiss)="toastErrorAberto = false"
      />
    </ion-content>
  `,
})
export class ComponentsComponent {
  toastSuccessAberto = false;
  toastErrorAberto = false;
}
```

**Arquivo**: `<sep-mobile-root>/src/app/features/design-system/pages/navigation.component.ts`
```ts
import { Component } from '@angular/core';
import { IonContent, IonNote } from '@ionic/angular/standalone';

@Component({
  selector: 'sep-ds-navigation',
  standalone: true,
  imports: [IonContent, IonNote],
  template: `
    <ion-content class="ion-padding">
      <h2>Padroes de navegacao</h2>
      <p>
        O app SEP Mobile usa <strong>tabs inferiores</strong> como navegacao principal
        (visivel logo abaixo deste conteudo) e <strong>navegacao em pilha</strong>
        para fluxos lineares dentro de cada tab.
      </p>

      <h3>Tabs (rodape)</h3>
      <p>Altura 56px. 4 tabs visiveis no maximo. Selecionado em azul Notion.</p>

      <h3>Pilha</h3>
      <p>
        Header com titulo + botao voltar. Transicoes nativas (slide horizontal no iOS,
        fade/slide no Android).
      </p>

      <ion-note>
        Telas reais (Tomador/Credora) sao implementadas a partir da M-Sprint 4.
      </ion-note>
    </ion-content>
  `,
})
export class NavigationComponent {}
```

### Step 201.3.5 — Adicionar smoke test do showcase

**Arquivo**: `<sep-mobile-root>/src/app/features/design-system/showcase.component.spec.ts`

**Conteudo**:
```ts
import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { ShowcaseComponent } from './showcase.component';

describe('ShowcaseComponent', () => {
  it('renderiza shell com 4 tabs do design system', async () => {
    await render(ShowcaseComponent, {
      providers: [provideRouter([])],
    });

    expect(screen.getByText('Cores')).toBeInTheDocument();
    expect(screen.getByText('Tipografia')).toBeInTheDocument();
    expect(screen.getByText('Componentes')).toBeInTheDocument();
    expect(screen.getByText('Navegacao')).toBeInTheDocument();
  });
});
```

### Step 201.3.6 — Validar showcase em PWA + DevTools mobile viewport

**Comando**:
```bash
cd <sep-mobile-root>
npm run start
```

**Verificacao**:
1. Abrir `http://localhost:8100/design-system` no browser
2. Abrir Chrome DevTools (F12) > Toggle device toolbar (Ctrl+Shift+M)
3. Selecionar um device mobile (ex.: iPhone 13)
4. Validar visualmente cada uma das 4 tabs:
   - **Cores**: 8 swatches com 44x44pt + nomes + hex
   - **Tipografia**: H1, H2, H3, base, secondary, caption, label, mono
   - **Componentes**: 3 botoes, 2 inputs, 1 card, 2 botoes que abrem toasts
   - **Navegacao**: descricao das tabs + pilha
5. Confirmar que tabs inferiores (`ion-tab-bar`) aparecem na parte de baixo da viewport mobile
6. Tocar (clicar) em cada tab e confirmar feedback de tap (highlight azul Notion translucido)

Encerrar com `Ctrl+C` apos validacao.

### Definicao de pronto da Task M-1.3
- [ ] Rota lazy `/design-system` configurada em `app.routes.ts`
- [ ] `design-system.routes.ts` com 4 sub-rotas (`colors`, `typography`, `components`, `navigation`)
- [ ] `ShowcaseComponent` com `ion-tabs` + 4 `ion-tab-button`
- [ ] 4 paginas standalone (`ColorsComponent`, `TypographyComponent`, `ComponentsComponent`, `NavigationComponent`)
- [ ] `typography.component.scss` usa mixins `notion-*`
- [ ] Smoke test Vitest do `ShowcaseComponent` passando
- [ ] `/design-system` carrega em `http://localhost:8100/design-system` em PWA
- [ ] Validacao visual em Chrome DevTools mobile viewport (iPhone 13) confirma fidelidade

### Commit Task M-1.3
```bash
cd <sep-mobile-root>
git add <sep-mobile-root>/src/app/app.routes.ts
git add <sep-mobile-root>/src/app/features/design-system/
git commit -m "feat(mobile): showcase navegavel do design system Notion mobile (rota /design-system)"
```

---

## Task M-1.4 — Validacao final da M-Sprint 1

**Objetivo**: rodar a suite local completa, validar fidelidade visual minima e ausencia de dependencias visuais proibidas (Bootstrap, Tailwind, Material), confirmar git status limpo. Espelha o padrao da F-Sprint 1 web (Task F-1.4).

**Pre-requisito**: Tasks M-1.0, M-1.1, M-1.2 e M-1.3 concluidas.

**Esforco**: 30-45 min.

### Step 201.4.1 — Rodar suite local completa

**Comando**:
```bash
cd <sep-mobile-root>
npm run lint
npm run lint:scss
npm run format:check
npm run test:coverage
npm run build
npm run e2e
```

**Espera**: tudo verde. O `e2e` da M-Sprint 0 ainda valida apenas `ion-app` carregando — esta sprint nao precisa adicionar novos cenarios E2E (M-Sprint 4 fechara isso).

### Step 201.4.2 — Validar fidelidade visual minima (checklist manual)

Subir o app:
```bash
npm run start
```

Abrir `http://localhost:8100/design-system` em Chrome DevTools mobile viewport e verificar:

| Validacao | Resultado esperado |
|-----------|-------------------|
| Cor primaria | Azul Notion `#2383E2` em botoes primary, tab selecionada, focus de input |
| Background | Branco puro `#FFFFFF` no body; warm `#F7F6F3` em superficies secundarias |
| Cor de texto | `#37352F` (warm dark) no corpo |
| Tipografia | Inter (ou fallback do sistema) em todo o app |
| Corpo | 16px legivel em mobile viewport |
| Tap highlight | Azul Notion translucido ao tocar em areas interativas |
| Touch targets | Botoes e itens com altura >= 44px |
| Tab bar | Inferior, altura 56px, selecionada em azul + peso 600 |
| Card | Radius 12px + sombra multilayer Notion |
| Botao primary | Fundo azul, padding generoso, sem text-transform |
| Input com foco | Borda azul Notion |

Se algum item falhar, voltar para a Task correspondente e ajustar.

### Step 201.4.3 — Validar ausencia de dependencias visuais proibidas

**Comando**:
```bash
cd <sep-mobile-root>
npm ls --depth=0 2>&1 | grep -iE "bootstrap|tailwind|@angular/material|primeng|ng-bootstrap" && \
  echo "FALHOU: dependencia proibida detectada" || \
  echo "OK: nenhuma dependencia visual proibida instalada"
```

**Espera**: `OK: nenhuma dependencia visual proibida instalada`. Se aparecer alguma das proibidas, remover via `npm uninstall <pkg>` e reverter qualquer codigo que dependia dela.

Lembrete (CLAUDE/AGENT.md): nao reintroduzir Bootstrap, Tailwind, Material ou template administrativo pronto. Componentes Ionic customizados via SCSS sao a unica camada visual permitida.

### Step 201.4.4 — Conferir status do Git

**Comando**:
```bash
cd <sep-mobile-root>
git status <sep-mobile-root>/
git diff --stat <sep-mobile-root>/ | tail -5
```

**Espera**:
- Apenas arquivos esperados desta sprint listados
- Nenhum arquivo `.env`, `node_modules/`, `www/`, `coverage/` ou `playwright-report/` aparecendo (confirmar `.gitignore`)
- Numero de arquivos modificados/adicionados consistente com o que voce comitou nas Tasks anteriores

### Definicao de pronto da Task M-1.4
- [ ] Suite completa local verde: lint, lint:scss, format:check, test:coverage, build, e2e
- [ ] Checklist de fidelidade visual passou em todos os 11 itens (Step 201.4.2)
- [ ] Nenhuma dependencia visual proibida instalada
- [ ] `git status` apenas com arquivos esperados desta sprint

### Commit Task M-1.4
Tipicamente esta task nao gera commit propria — apenas valida. Se descobrir ajustes finais (ex.: corrigir uma cor que ficou errada), comitar com:
```bash
git commit -am "fix(mobile): ajustes finais de fidelidade visual da M-Sprint 1"
```

---

## Definicao de Pronto da M-Sprint 1 (consolidada)

A M-Sprint 1 esta concluida quando todas as 5 tasks tiverem checklist completo:

- [ ] **Task M-1.0** — Prechecks validaram ambiente e M-Sprint 0
- [ ] **Task M-1.1** — Tokens SCSS Notion adaptados + CSS vars `--ion-*` em `theme/variables.scss`
- [ ] **Task M-1.2** — Mixins de componentes Ionic + aplicacao global em `global.scss`
- [ ] **Task M-1.3** — Showcase em `/design-system` com 4 paginas + smoke test Vitest
- [ ] **Task M-1.4** — Suite local verde + checklist de fidelidade visual + sem deps proibidas

## Estado esperado do repositorio apos M-Sprint 1

```
<sep-mobile-root>/
├── angular.json                              # ATUALIZADO Step 201.2.3 (3 styles)
├── src/
│   ├── app/
│   │   ├── app.routes.ts                     # ATUALIZADO Step 201.3.1 (rota lazy)
│   │   ├── features/
│   │   │   └── design-system/                # NOVO Sprint M-1.3
│   │   │       ├── design-system.routes.ts
│   │   │       ├── showcase.component.ts
│   │   │       ├── showcase.component.spec.ts
│   │   │       └── pages/
│   │   │           ├── colors.component.ts
│   │   │           ├── typography.component.ts
│   │   │           ├── typography.component.scss
│   │   │           ├── components.component.ts
│   │   │           └── navigation.component.ts
│   ├── global.scss                           # ATUALIZADO Step 201.2.2 (aplica mixins)
│   ├── styles/
│   │   ├── _notion-mobile-tokens.scss        # NOVO Sprint M-1.1
│   │   ├── _notion-mobile-typography.scss    # NOVO Sprint M-1.1
│   │   ├── _notion-mobile-components.scss    # NOVO Sprint M-1.2
│   │   ├── _mixins.scss                      # da M-Sprint 0 (mantido)
│   │   ├── _tokens.scss                      # da M-Sprint 0 (mantido vazio ou removido)
│   │   └── index.scss                        # ATUALIZADO Step 201.1.4
│   └── theme/
│       └── variables.scss                    # ATUALIZADO Step 201.1.3 (CSS vars Notion)
└── (demais artefatos da M-Sprint 0)
```

Arquivos placeholders da M-Sprint 0 que podem ser **removidos** (foram substituidos):
- `src/styles/_notion-mobile.scss` (substituido por `_notion-mobile-components.scss` + tokens)
- `src/styles/_ionic-overrides.scss` (substituido por `theme/variables.scss` + `global.scss`)

## Impacto na M-Sprint seguinte (M-Sprint 2)

A M-Sprint 2 (`specs/fase-1/202-msprint-2-telas-publicas-mobile.md`) consome:
- Tokens Notion mobile para implementar splash, boas-vindas, login, register
- Mixins de componentes Ionic prontos (`ion-button`, `ion-input`, `ion-card`)
- CSS variables Ionic ja apontando para Notion warm — basta usar `<ion-button color="primary">`
- Padrao de feature lazy demonstrado pela rota `/design-system`

## Restricoes e regras de execucao

- M-Sprint 1 pode rodar em paralelo a Sprint 1 backend e F-Sprint 1 frontend (sem dependencia)
- **Nao** reaproveitar tokens da F-Sprint 1 web diretamente — adaptacoes mobile (touch, fonts, tap highlights) tornam improdutivo compartilhar arquivos
- Code review por Dev Senior antes de seguir para M-Sprint 2 (validar fidelidade ao Notion + adaptacoes mobile)
- Showcase `/design-system` NAO deve ir para producao na Epic 14 — sera removido ou colocado atras de feature flag em sprint posterior

## Referencias

- [Spec 201 - M-Sprint 1](../../specs/fase-1/201-msprint-1-tokens-notion-mobile.md) — descricao alta das tasks
- [DESIGN-notion.md](../../docs-sep/DESIGN-notion.md) — design system fonte
- [PRD §11, §22](../../docs-sep/PRD.md) — stack mobile + composicao da equipe
- [MOBILE-SCREENS-PLAN.md](../../docs-sep/MOBILE-SCREENS-PLAN.md) — plano de telas mobile
- [AGENT.md](../../AGENT.md) — orientacao para agentes de IA
- [Steps M-Sprint 0 mobile](./200-msprint-0-steps.md) — predecessor (setup Ionic + tooling)
- [Steps F-Sprint 1 web](../web/101-fsprint-1-steps.md) — paralela (tokens Apple+Notion no web)
- ADRs [0002 - Design Systems Apple e Notion](../../adr/0002-design-systems-apple-e-notion-com-scss-puro.md), [0003 - Stack Angular 20 + Ionic 8 + Capacitor 6](../../adr/0003-stack-angular-20-ionic-8-capacitor-6.md)
- [Ionic Theming](https://ionicframework.com/docs/theming/colors)
- [Ionic CSS Custom Properties](https://ionicframework.com/docs/theming/css-variables)
