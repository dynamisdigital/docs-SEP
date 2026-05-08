# Steps - F-Sprint 1 - Tokens SCSS + Design System Showcase

**Spec de origem**: [`specs/fase-1/101-fsprint-1-design-tokens-showcase.md`](../../specs/fase-1/101-fsprint-1-design-tokens-showcase.md)

**Objetivo geral**: traduzir os design systems oficiais Apple e Notion para tokens SCSS reutilizaveis no Angular e criar um showcase navegavel em `/design-system`, funcionando como Storybook leve sem adicionar Storybook.

**Esforco total estimado**: 2-3 dias de Dev Pleno Frontend dedicado, ou 3-4 dias dividido entre os dois Devs Plenos.

**Workspace root**: `<sep-app-root>/` (em Linux/macOS, substituir pelo equivalente local).

**Localizacao do projeto Angular**: `<sep-app-root>/`.

**Ordem de execucao recomendada**:

```text
F-1.0 (prechecks)
  |
  +---> F-1.1 (tokens Apple)
  |
  +---> F-1.2 (tokens Notion)
           |
           +---> F-1.3 (showcase /design-system)
                    |
                    +---> F-1.4 (validacao final)
```

- F-1.0 e obrigatoria antes de qualquer edicao.
- F-1.1 e F-1.2 podem rodar em paralelo se houver dois devs, pois alteram arquivos diferentes.
- F-1.3 depende de F-1.1 e F-1.2.
- F-1.4 valida a sprint inteira.

**Como usar este arquivo**:
1. Execute os prechecks da Task F-1.0.
2. Execute F-1.1 e F-1.2 antes do showcase.
3. Em cada step, rode a verificacao indicada antes de seguir.
4. Ao final, valide com a "Definicao de pronto" da sprint.
5. Comite com a mensagem sugerida.

**Pre-requisitos globais**:
- F-Sprint 0 concluida: `<sep-app-root>/` deve existir.
- Angular `20.x`, Node `>= 20.x` e npm `>= 10.x`.
- Scripts `lint`, `lint:scss`, `test` e `build` configurados na F-Sprint 0.
- Arquivos oficiais disponiveis:
  - `docs-sep/DESIGN-apple.md`
  - `docs-sep/DESIGN-notion.md`
- Nenhum framework CSS terceiro deve ser adicionado.

---

## Task F-1.0 - Prechecks da F-Sprint 1

**Objetivo**: confirmar que a F-Sprint 0 foi concluida e que o projeto Angular esta pronto para receber os tokens.

**Pre-requisito**: repo atualizado localmente.

**Esforco**: 10-15 min.

### Step 101.0.1 - Confirmar existencia do app Angular

**Comando**:
```bash
cd <sep-app-root>
test -d <sep-app-root> && echo "sep-frontend encontrado"
```

**Verificacao**:
```bash
ls -la <sep-app-root>
# Espera: package.json, angular.json, tsconfig*.json, src/
```

Se `<sep-app-root>/` nao existir, **abortar esta sprint** e executar primeiro [`steps-fase-1/web/100-fsprint-0-steps.md`](./100-fsprint-0-steps.md).

### Step 101.0.2 - Confirmar versoes e scripts

**Comando**:
```bash
cd <sep-app-root>
node -v
npm -v
npx ng version
npm run
```

**Verificacao**:
- Node retorna `v20.x.x` ou superior.
- Angular CLI e Angular retornam `20.x.x`.
- `npm run` lista pelo menos `lint`, `lint:scss`, `test` e `build`.

### Step 101.0.3 - Confirmar design systems oficiais

**Comando**:
```bash
cd <sep-app-root>
ls -la docs-sep/DESIGN-apple.md docs-sep/DESIGN-notion.md
```

**Verificacao**:
- Os dois arquivos existem.
- Nao usar fontes externas como substitutas dos design systems oficiais.

### Step 101.0.4 - Rodar baseline antes de editar

**Comando**:
```bash
cd <sep-app-root>
npm run lint
npm run lint:scss
npm run test
npm run build
```

**Verificacao**:
- Todos os comandos passam antes de iniciar a F-Sprint 1.
- Se algum comando falhar por problema herdado da F-Sprint 0, corrigir na trilha F-Sprint 0 antes de seguir.

### Definicao de pronto da Task F-1.0
- [ ] `<sep-app-root>/` existe
- [ ] Angular `20.x` confirmado
- [ ] Scripts de qualidade existem
- [ ] Design systems oficiais existem
- [ ] Baseline de lint/test/build passa

---

## Task F-1.1 - Tokens SCSS Apple

**Objetivo**: extrair os tokens do [`DESIGN-apple.md`](../../docs-sep/DESIGN-apple.md) para SCSS reutilizavel nas superficies publicas: landing, login e cadastro.

**Pre-requisito**: Task F-1.0 concluida.

**Esforco**: 4-6 horas.

**Arquivos afetados**:
- `<sep-app-root>/src/styles/_apple-tokens.scss`
- `<sep-app-root>/src/styles/_apple-typography.scss`
- `<sep-app-root>/src/styles/_apple-components.scss`

### Step 101.1.1 - Criar o arquivo base de tokens Apple

**Arquivo**: `<sep-app-root>/src/styles/_apple-tokens.scss`

**Conteudo esperado**:
```scss
// Tokens Apple - superficies publicas (landing, login, cadastro).
// Fonte oficial: docs-sep/DESIGN-apple.md.

:root {
  --apple-color-primary: #0066cc;
  --apple-color-primary-focus: #0071e3;
  --apple-color-primary-on-dark: #2997ff;
  --apple-color-ink: #1d1d1f;
  --apple-color-body: #1d1d1f;
  --apple-color-body-on-dark: #ffffff;
  --apple-color-body-muted: #cccccc;
  --apple-color-ink-muted-80: #333333;
  --apple-color-ink-muted-48: #7a7a7a;
  --apple-color-divider-soft: #f0f0f0;
  --apple-color-hairline: #e0e0e0;
  --apple-color-canvas: #ffffff;
  --apple-color-canvas-parchment: #f5f5f7;
  --apple-color-surface-pearl: #fafafc;
  --apple-color-surface-tile-1: #272729;
  --apple-color-surface-tile-2: #2a2a2c;
  --apple-color-surface-tile-3: #252527;
  --apple-color-surface-black: #000000;
  --apple-color-surface-chip-translucent: rgb(210 210 215 / 64%);
  --apple-color-on-primary: #ffffff;
  --apple-color-on-dark: #ffffff;

  --apple-radius-none: 0;
  --apple-radius-xs: 5px;
  --apple-radius-sm: 8px;
  --apple-radius-md: 11px;
  --apple-radius-lg: 18px;
  --apple-radius-pill: 9999px;
  --apple-radius-full: 9999px;

  --apple-space-xxs: 4px;
  --apple-space-xs: 8px;
  --apple-space-sm: 12px;
  --apple-space-md: 17px;
  --apple-space-lg: 24px;
  --apple-space-xl: 32px;
  --apple-space-xxl: 48px;
  --apple-space-section: 80px;

  --apple-shadow-product: rgb(0 0 0 / 22%) 3px 5px 30px 0;
}
```

**Regras**:
- Usar prefixo `--apple-` em todos os custom properties.
- Nao criar segunda cor de destaque alem dos azuis oficiais.
- Nao criar tokens de gradiente.
- Sombra Apple existe apenas como `--apple-shadow-product`.

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint:scss
```

### Step 101.1.2 - Criar mixins de tipografia Apple

**Arquivo**: `<sep-app-root>/src/styles/_apple-typography.scss`

**Conteudo esperado**:
```scss
// Tipografia Apple - SF Pro via system stack, com Inter como fallback operacional.

$apple-font-display: "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Inter", sans-serif;
$apple-font-text: "SF Pro Text", system-ui, -apple-system, BlinkMacSystemFont, "Inter", sans-serif;

@mixin apple-type-hero-display {
  font-family: $apple-font-display;
  font-size: 56px;
  font-weight: 600;
  line-height: 1.07;
  letter-spacing: -0.28px;
}

@mixin apple-type-display-lg {
  font-family: $apple-font-display;
  font-size: 40px;
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: 0;
}

@mixin apple-type-display-md {
  font-family: $apple-font-text;
  font-size: 34px;
  font-weight: 600;
  line-height: 1.47;
  letter-spacing: -0.374px;
}

@mixin apple-type-lead {
  font-family: $apple-font-display;
  font-size: 28px;
  font-weight: 400;
  line-height: 1.14;
  letter-spacing: 0.196px;
}

@mixin apple-type-body {
  font-family: $apple-font-text;
  font-size: 17px;
  font-weight: 400;
  line-height: 1.47;
  letter-spacing: -0.374px;
}

@mixin apple-type-caption {
  font-family: $apple-font-text;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.43;
  letter-spacing: -0.224px;
}

@mixin apple-type-button-utility {
  font-family: $apple-font-text;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.29;
  letter-spacing: -0.224px;
}

@mixin apple-type-fine-print {
  font-family: $apple-font-text;
  font-size: 12px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.12px;
}
```

**Completar no mesmo arquivo**:
- `apple-type-lead-airy`
- `apple-type-tagline`
- `apple-type-body-strong`
- `apple-type-dense-link`
- `apple-type-caption-strong`
- `apple-type-button-large`
- `apple-type-micro-legal`
- `apple-type-nav-link`

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint:scss
```

### Step 101.1.3 - Criar mixins de componentes Apple

**Arquivo**: `<sep-app-root>/src/styles/_apple-components.scss`

**Conteudo esperado**:
```scss
@use "apple-typography" as appleType;

// Componentes Apple devem ser usados apenas em superficies publicas.

@mixin apple-button-primary {
  @include appleType.apple-type-body;

  min-height: 44px;
  padding: 11px 22px;
  color: var(--apple-color-on-primary);
  background: var(--apple-color-primary);
  border: 1px solid transparent;
  border-radius: var(--apple-radius-pill);
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--apple-color-primary-focus);
    outline-offset: 2px;
  }

  &:active {
    transform: scale(0.95);
  }
}

@mixin apple-button-secondary-pill {
  @include appleType.apple-type-body;

  min-height: 44px;
  padding: 11px 22px;
  color: var(--apple-color-primary);
  background: transparent;
  border: 1px solid var(--apple-color-primary);
  border-radius: var(--apple-radius-pill);
  cursor: pointer;
}

@mixin apple-product-tile-light {
  padding: var(--apple-space-section);
  color: var(--apple-color-ink);
  background: var(--apple-color-canvas);
  border-radius: var(--apple-radius-none);
}

@mixin apple-product-tile-dark {
  padding: var(--apple-space-section);
  color: var(--apple-color-on-dark);
  background: var(--apple-color-surface-tile-1);
  border-radius: var(--apple-radius-none);
}
```

**Completar no mesmo arquivo**:
- `apple-button-dark-utility`
- `apple-button-pearl-capsule`
- `apple-button-store-hero`
- `apple-button-icon-circular`
- `apple-text-link`
- `apple-text-link-on-dark`
- `apple-global-nav`
- `apple-sub-nav-frosted`
- `apple-product-tile-parchment`
- `apple-store-utility-card`
- `apple-configurator-option-chip`
- `apple-configurator-option-chip-selected`
- `apple-search-input`
- `apple-floating-sticky-bar`
- `apple-footer`

**Regras**:
- Nao adicionar shadow em cards, botoes ou textos.
- Aplicar `--apple-shadow-product` somente em helper/mixin para imagem de produto, se criado.
- Usar `min-height: 44px` em controles clicaveis.

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint:scss
npm run build
```

### Definicao de pronto da Task F-1.1
- [ ] Tokens de cor Apple mapeados
- [ ] Tipografia Apple mapeada
- [ ] Spacing, radius e sombra de produto mapeados
- [ ] Mixins dos componentes Apple criados
- [ ] `npm run lint:scss` passa
- [ ] `npm run build` passa

### Commit Task F-1.1
```bash
git add <sep-app-root>/src/styles/_apple-*.scss
git commit -m "feat(web): add apple design tokens"
```

---

## Task F-1.2 - Tokens SCSS Notion

**Objetivo**: extrair os tokens do [`DESIGN-notion.md`](../../docs-sep/DESIGN-notion.md) para SCSS reutilizavel nas superficies autenticadas e nos componentes compartilhados futuros.

**Pre-requisito**: Task F-1.0 concluida.

**Esforco**: 4-6 horas.

**Arquivos afetados**:
- `<sep-app-root>/src/styles/_notion-tokens.scss`
- `<sep-app-root>/src/styles/_notion-typography.scss`
- `<sep-app-root>/src/styles/_notion-components.scss`

### Step 101.2.1 - Criar o arquivo base de tokens Notion

**Arquivo**: `<sep-app-root>/src/styles/_notion-tokens.scss`

**Conteudo esperado**:
```scss
// Tokens Notion - superficies autenticadas.
// Fonte oficial: docs-sep/DESIGN-notion.md.

:root {
  --notion-color-text: rgb(0 0 0 / 95%);
  --notion-color-text-strong: #000000;
  --notion-color-text-muted: #615d59;
  --notion-color-text-subtle: #a39e98;
  --notion-color-canvas: #ffffff;
  --notion-color-warm-white: #f6f5f4;
  --notion-color-warm-dark: #31302e;
  --notion-color-blue: #0075de;
  --notion-color-blue-active: #005bab;
  --notion-color-blue-focus: #097fe8;
  --notion-color-link-light: #62aef0;
  --notion-color-badge-blue-bg: #f2f9ff;
  --notion-color-badge-blue-text: #097fe8;
  --notion-color-teal: #2a9d99;
  --notion-color-green: #1aae39;
  --notion-color-orange: #dd5b00;
  --notion-color-pink: #ff64c8;
  --notion-color-purple: #391c57;
  --notion-color-brown: #523410;
  --notion-border-whisper: 1px solid rgb(0 0 0 / 10%);
  --notion-border-input: 1px solid #dddddd;

  --notion-radius-micro: 4px;
  --notion-radius-subtle: 5px;
  --notion-radius-standard: 8px;
  --notion-radius-card: 12px;
  --notion-radius-large: 16px;
  --notion-radius-pill: 9999px;
  --notion-radius-circle: 100%;

  --notion-space-2: 2px;
  --notion-space-3: 3px;
  --notion-space-4: 4px;
  --notion-space-5: 5px;
  --notion-space-6: 6px;
  --notion-space-7: 7px;
  --notion-space-8: 8px;
  --notion-space-11: 11px;
  --notion-space-12: 12px;
  --notion-space-14: 14px;
  --notion-space-16: 16px;
  --notion-space-24: 24px;
  --notion-space-32: 32px;
  --notion-space-section: 80px;

  --notion-shadow-card: rgb(0 0 0 / 4%) 0 4px 18px,
    rgb(0 0 0 / 2.7%) 0 2.025px 7.84688px,
    rgb(0 0 0 / 2%) 0 0.8px 2.925px,
    rgb(0 0 0 / 1%) 0 0.175px 1.04062px;
  --notion-shadow-deep: rgb(0 0 0 / 1%) 0 1px 3px,
    rgb(0 0 0 / 2%) 0 3px 7px,
    rgb(0 0 0 / 2%) 0 7px 15px,
    rgb(0 0 0 / 4%) 0 14px 28px,
    rgb(0 0 0 / 5%) 0 23px 52px;
}
```

**Regras**:
- Usar prefixo `--notion-` em todos os custom properties.
- Usar warm neutrals oficiais, nao blue-gray.
- Notion Blue e o unico accent saturado do chrome principal.

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint:scss
```

### Step 101.2.2 - Criar mixins de tipografia Notion

**Arquivo**: `<sep-app-root>/src/styles/_notion-typography.scss`

**Conteudo esperado**:
```scss
// Tipografia Notion - NotionInter com fallback Inter/system.

$notion-font-primary: "NotionInter", "Inter", -apple-system, system-ui, "Segoe UI", Helvetica, Arial, sans-serif;

@mixin notion-type-display-hero {
  font-family: $notion-font-primary;
  font-size: 64px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -2.125px;
  font-feature-settings: "lnum", "locl";
}

@mixin notion-type-display-secondary {
  font-family: $notion-font-primary;
  font-size: 54px;
  font-weight: 700;
  line-height: 1.04;
  letter-spacing: -1.875px;
  font-feature-settings: "lnum", "locl";
}

@mixin notion-type-section-heading {
  font-family: $notion-font-primary;
  font-size: 48px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -1.5px;
  font-feature-settings: "lnum", "locl";
}

@mixin notion-type-body {
  font-family: $notion-font-primary;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
  letter-spacing: normal;
}

@mixin notion-type-nav-button {
  font-family: $notion-font-primary;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.33;
  letter-spacing: normal;
}
```

**Completar no mesmo arquivo**:
- `notion-type-subheading-large`
- `notion-type-subheading`
- `notion-type-card-title`
- `notion-type-body-large`
- `notion-type-body-medium`
- `notion-type-body-semibold`
- `notion-type-body-bold`
- `notion-type-caption`
- `notion-type-caption-light`
- `notion-type-badge`
- `notion-type-micro-label`

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint:scss
```

### Step 101.2.3 - Criar mixins de componentes Notion

**Arquivo**: `<sep-app-root>/src/styles/_notion-components.scss`

**Conteudo esperado**:
```scss
@use "notion-typography" as notionType;

// Componentes Notion devem ser usados em superficies autenticadas.

@mixin notion-button-primary {
  @include notionType.notion-type-nav-button;

  min-height: 40px;
  padding: 8px 16px;
  color: var(--notion-color-canvas);
  background: var(--notion-color-blue);
  border: 1px solid transparent;
  border-radius: var(--notion-radius-micro);
  cursor: pointer;

  &:hover {
    background: var(--notion-color-blue-active);
  }

  &:focus-visible {
    outline: 2px solid var(--notion-color-blue-focus);
    outline-offset: 2px;
    box-shadow: var(--notion-shadow-card);
  }

  &:active {
    transform: scale(0.9);
  }
}

@mixin notion-card {
  color: var(--notion-color-text);
  background: var(--notion-color-canvas);
  border: var(--notion-border-whisper);
  border-radius: var(--notion-radius-card);
  box-shadow: var(--notion-shadow-card);
}

@mixin notion-input {
  @include notionType.notion-type-body;

  min-height: 40px;
  padding: 6px;
  color: rgb(0 0 0 / 90%);
  background: var(--notion-color-canvas);
  border: var(--notion-border-input);
  border-radius: var(--notion-radius-micro);

  &::placeholder {
    color: var(--notion-color-text-subtle);
  }

  &:focus-visible {
    outline: 2px solid var(--notion-color-blue-focus);
    outline-offset: 2px;
  }
}
```

**Completar no mesmo arquivo**:
- `notion-button-secondary`
- `notion-button-ghost`
- `notion-pill-badge`
- `notion-feature-card`
- `notion-metric-card`
- `notion-nav-link`
- `notion-section`
- `notion-warm-section`
- `notion-whisper-divider`
- `notion-focus-ring`

**Regras**:
- Bordas devem usar `--notion-border-whisper` quando forem divisorias estruturais.
- Sombras devem usar stacks multilayer oficiais.
- Botoes funcionais usam raio `4px`; badges usam pill.

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint:scss
npm run build
```

### Definicao de pronto da Task F-1.2
- [ ] Tokens de cor Notion mapeados
- [ ] Tipografia Notion mapeada
- [ ] Radius, spacing, borders e shadows mapeados
- [ ] Mixins dos componentes Notion criados
- [ ] `npm run lint:scss` passa
- [ ] `npm run build` passa

### Commit Task F-1.2
```bash
git add <sep-app-root>/src/styles/_notion-*.scss
git commit -m "feat(web): add notion design tokens"
```

---

## Task F-1.3 - Design System Showcase

**Objetivo**: criar a rota `/design-system` com exemplos navegaveis dos tokens Apple e Notion para validacao visual por devs, PO e stakeholders.

**Pre-requisito**: Tasks F-1.1 e F-1.2 concluidas.

**Esforco**: 6-8 horas.

**Arquivos afetados**:
- `<sep-app-root>/src/styles/index.scss`
- `<sep-app-root>/src/app/app.routes.ts`
- `<sep-app-root>/src/app/features/design-system/design-system.routes.ts`
- `<sep-app-root>/src/app/features/design-system/showcase.component.ts`
- `<sep-app-root>/src/app/features/design-system/showcase.component.scss`

### Step 101.3.1 - Exportar os novos arquivos no indice SCSS

**Arquivo**: `<sep-app-root>/src/styles/index.scss`

**Conteudo esperado**:
```scss
// Indice central de estilos globais.
// Apple: superficies publicas. Notion: superficies autenticadas.

@use "apple-tokens";
@use "apple-typography";
@use "apple-components";
@use "notion-tokens";
@use "notion-typography";
@use "notion-components";
```

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint:scss
npm run build
```

### Step 101.3.2 - Criar rota lazy de design system

**Arquivo**: `<sep-app-root>/src/app/app.routes.ts`

**Ajuste esperado**:
```ts
export const routes: Routes = [
  {
    path: 'design-system',
    loadChildren: () =>
      import('./features/design-system/design-system.routes').then((m) => m.DESIGN_SYSTEM_ROUTES),
  },
];
```

Se `app.routes.ts` ja possuir rotas, adicionar esta entrada sem remover as existentes.

**Arquivo**: `<sep-app-root>/src/app/features/design-system/design-system.routes.ts`

**Conteudo esperado**:
```ts
import { Routes } from '@angular/router';

import { ShowcaseComponent } from './showcase.component';

export const DESIGN_SYSTEM_ROUTES: Routes = [
  {
    path: '',
    component: ShowcaseComponent,
  },
  {
    path: ':system',
    component: ShowcaseComponent,
  },
];
```

**Regra dev-only**:
- Nesta F-Sprint, manter a rota fora da navegacao principal.
- Antes de producao, a rota deve ser bloqueada/removida por configuracao de ambiente.
- Nao instalar Storybook nesta sprint.

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint
npm run build
```

### Step 101.3.3 - Criar componente standalone do showcase

**Arquivo**: `<sep-app-root>/src/app/features/design-system/showcase.component.ts`

**Conteudo esperado**:
```ts
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

type DesignSystemFilter = 'all' | 'apple' | 'notion';

@Component({
  selector: 'app-design-system-showcase',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './showcase.component.html',
  styleUrl: './showcase.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowcaseComponent {
  private readonly route = inject(ActivatedRoute);

  private readonly systemParam = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('system'))),
    { initialValue: null },
  );

  protected readonly activeSystem = computed<DesignSystemFilter>(() => {
    const value = this.systemParam();
    return value === 'apple' || value === 'notion' ? value : 'all';
  });

  protected readonly showApple = computed(() => this.activeSystem() === 'all' || this.activeSystem() === 'apple');
  protected readonly showNotion = computed(() => this.activeSystem() === 'all' || this.activeSystem() === 'notion');
}
```

**Arquivo adicional**: `<sep-app-root>/src/app/features/design-system/showcase.component.html`

**Estrutura minima esperada**:
```html
<main class="showcase">
  <nav class="showcase__nav" aria-label="Design systems">
    <a routerLink="/design-system">Todos</a>
    <a routerLink="/design-system/apple">Apple</a>
    <a routerLink="/design-system/notion">Notion</a>
  </nav>

  @if (showApple()) {
    <section class="apple-showcase" aria-labelledby="apple-title">
      <h1 id="apple-title">Apple</h1>
      <!-- Paleta, tipografia, botoes, inputs, tiles e footer Apple. -->
    </section>
  }

  @if (showNotion()) {
    <section class="notion-showcase" aria-labelledby="notion-title">
      <h1 id="notion-title">Notion</h1>
      <!-- Paleta, tipografia, botoes, badges, inputs, cards e secoes Notion. -->
    </section>
  }
</main>
```

**Regras**:
- Usar standalone component e control flow Angular moderno (`@if`).
- Nao usar framework CSS terceiro.
- Nao colocar texto explicativo longo na tela; o showcase deve demonstrar visualmente os tokens.

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint
npm run build
```

### Step 101.3.4 - Estilizar o showcase com os mixins

**Arquivo**: `<sep-app-root>/src/app/features/design-system/showcase.component.scss`

**Conteudo esperado**:
```scss
@use "../../../styles/apple-typography" as appleType;
@use "../../../styles/apple-components" as apple;
@use "../../../styles/notion-typography" as notionType;
@use "../../../styles/notion-components" as notion;

.showcase {
  min-height: 100vh;
  background: var(--notion-color-canvas);
}

.showcase__nav {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  gap: 16px;
  align-items: center;
  min-height: 56px;
  padding: 0 24px;
  background: var(--notion-color-canvas);
  border-bottom: var(--notion-border-whisper);
}

.apple-showcase {
  @include apple.apple-product-tile-light;
}

.apple-showcase h1 {
  @include appleType.apple-type-hero-display;
}

.notion-showcase {
  padding: var(--notion-space-section) var(--notion-space-24);
  color: var(--notion-color-text);
  background: var(--notion-color-warm-white);
}

.notion-showcase h1 {
  @include notionType.notion-type-display-hero;
}
```

**Completar no mesmo arquivo** com secoes visuais para:
- paleta Apple e paleta Notion
- escala tipografica Apple e Notion
- botoes principais, secundarios e links
- inputs
- cards/tiles
- estados de foco visiveis

**Verificacao manual**:
```bash
cd <sep-app-root>
npm run start
```

Abrir:
- `http://localhost:4200/design-system`
- `http://localhost:4200/design-system/apple`
- `http://localhost:4200/design-system/notion`

### Step 101.3.5 - Adicionar smoke test do showcase

**Arquivo esperado**: ajustar ou criar teste conforme padrao da F-Sprint 0.

**Cenarios minimos**:
- renderiza a rota `/design-system`
- exibe secao Apple na rota base
- exibe secao Notion na rota base
- filtra Apple em `/design-system/apple`
- filtra Notion em `/design-system/notion`

**Verificacao**:
```bash
cd <sep-app-root>
npm run test
```

### Definicao de pronto da Task F-1.3
- [ ] `src/styles/index.scss` exporta os tokens novos
- [ ] Rota `/design-system` existe
- [ ] Subrotas `/design-system/apple` e `/design-system/notion` existem
- [ ] Showcase usa mixins Apple e Notion
- [ ] Smoke test cobre a rota
- [ ] `npm run lint` passa
- [ ] `npm run lint:scss` passa
- [ ] `npm run test` passa
- [ ] `npm run build` passa

### Commit Task F-1.3
```bash
git add <sep-app-root>/src/styles <sep-app-root>/src/app
git commit -m "feat(web): add design system showcase"
```

---

## Task F-1.4 - Validacao final da F-Sprint 1

**Objetivo**: garantir que os tokens e o showcase estao prontos para consumo pelas F-Sprints 2 e 3.

**Pre-requisito**: Tasks F-1.1, F-1.2 e F-1.3 concluidas.

**Esforco**: 30-45 min.

### Step 101.4.1 - Rodar suite local completa

**Comando**:
```bash
cd <sep-app-root>
npm run lint
npm run lint:scss
npm run test
npm run build
```

**Verificacao**:
- Todos os comandos passam.
- Nao ha warnings novos relevantes de SCSS ou Angular strict.

### Step 101.4.2 - Validar fidelidade visual minima

**Checklist Apple**:
- [ ] Action Blue e `#0066cc`
- [ ] Sky Link Blue so aparece em superficie escura
- [ ] Body usa 17px
- [ ] Headlines usam pesos 600 e tracking Apple
- [ ] Tiles full-bleed nao tem radius
- [ ] Cards/botoes nao recebem shadow
- [ ] Produto/imagem demonstrativa, se houver, usa apenas `--apple-shadow-product`

**Checklist Notion**:
- [ ] Notion Blue e `#0075de`
- [ ] Warm White e `#f6f5f4`
- [ ] Texto principal usa near-black `rgb(0 0 0 / 95%)`
- [ ] Bordas usam whisper border `1px solid rgb(0 0 0 / 10%)`
- [ ] Shadows usam stack multilayer
- [ ] Botoes funcionais usam raio `4px`
- [ ] Badges usam pill

### Step 101.4.3 - Validar ausencia de dependencias visuais proibidas

**Comando**:
```bash
cd <sep-app-root>
npm ls bootstrap tailwindcss @angular/material || true
```

**Verificacao**:
- O comando deve indicar que as dependencias nao estao instaladas.
- Se alguma aparecer, remover antes de concluir a sprint.

### Step 101.4.4 - Conferir status do Git

**Comando**:
```bash
cd <sep-app-root>
git status --short
```

**Verificacao**:
- Alteracoes esperadas ficam restritas ao app frontend.
- Nao devem aparecer mudancas em specs, PRD ou ADRs sem motivo explicito.

### Definicao de pronto da F-Sprint 1
- [ ] Tokens Apple implementados em SCSS
- [ ] Tokens Notion implementados em SCSS
- [ ] Mixins de tipografia e componentes prontos para reuso
- [ ] `/design-system` navegavel
- [ ] `/design-system/apple` e `/design-system/notion` navegaveis
- [ ] Showcase validado visualmente
- [ ] `npm run lint` passa
- [ ] `npm run lint:scss` passa
- [ ] `npm run test` passa
- [ ] `npm run build` passa
- [ ] Nenhum framework CSS terceiro introduzido

### Commit final da F-Sprint 1
Se as tasks foram commitadas separadamente, nao e necessario commit final. Se ainda houver ajustes pequenos:

```bash
git add <sep-app-root>
git commit -m "chore(web): finalize design tokens showcase"
```

## Impacto na F-Sprint 2 e F-Sprint 3

- F-Sprint 2 deve consumir os tokens e mixins Apple para landing, login e cadastro.
- F-Sprint 3 deve consumir os tokens e mixins Notion para shell autenticado, header, sidenav e breadcrumbs.
- Alteracoes futuras nos tokens devem preservar compatibilidade com os mixins criados aqui, exceto quando houver revisao explicita do design system.
