# Spec 101 - F-Sprint 1 - Tokens SCSS + Design System Showcase

## Metadados

- **ID da Spec**: 101
- **Titulo**: F-Sprint 1 - Tokens SCSS dos design systems Apple e Notion + Showcase navegavel
- **Status**: aprovada para execucao (apos conclusao da F-Sprint 0)
- **Fase do produto**: Epic 12 - Fundacao Frontend
- **Trilha**: Frontend (paralela a Sprint 1 backend)
- **Origem**: PRD - API SEP, Secao 22 (Trilha paralela Frontend) + Plano de melhorias R7
- **Depende de**: [`100-fsprint-0-setup-angular.md`](./100-fsprint-0-setup-angular.md)
- **Responsavel principal**: Dev Pleno Frontend 1 (lider) + Dev Pleno Frontend 2

## Objetivo

Traduzir literalmente os tokens dos dois design systems oficiais ([`DESIGN-apple.md`](../docs-sep/DESIGN-apple.md) e [`DESIGN-notion.md`](../docs-sep/DESIGN-notion.md)) para SCSS reutilizavel no projeto Angular, e expor um showcase navegavel em `/design-system` que serve como Storybook leve. Sem essa fundacao, qualquer tela construida nas F-Sprints 2-4 ficaria desalinhada do design system.

## Escopo

### Em escopo
- Tokens SCSS Apple: cores, tipografia, espacamento, raios, sombras, mixins de componentes
- Tokens SCSS Notion: mesmo escopo, com warm neutrals, NotionInter (Inter fallback), sombras multilayer
- Mixins reutilizaveis para componentes (button-primary, search-input, card, etc.)
- Showcase em rota `/design-system` (acessivel apenas em modo dev) exibindo paleta, tipografia, componentes lado a lado para os 2 DS
- Documentacao inline (comentarios SCSS) explicando quando usar cada DS

### Fora de escopo nesta F-Sprint
- Telas reais (F-Sprint 2)
- Componentes reutilizaveis prontos para producao (vao surgir a partir da F-Sprint 2 conforme demanda)
- Shell autenticado (F-Sprint 3)

## Pre-requisitos globais

- F-Sprint 0 concluida (projeto Angular 20.x + tooling completo)
- Stylelint configurado (vai validar SCSS dos tokens)
- Acesso aos arquivos de design system: `docs-sep/DESIGN-apple.md` e `docs-sep/DESIGN-notion.md`

## Tasks

### Task F-1.1 - Tokens SCSS Apple (publico)

**Descricao**
Extrair literalmente todos os tokens de `docs-sep/DESIGN-apple.md` para SCSS. Cobre: cores, tipografia (com importacao SF Pro Display/Text via fallback Inter), espacamento, raios, sombras, regras do/dont.

**Arquivos esperados**
- `src/styles/_apple-tokens.scss` (variaveis CSS + SCSS)
- `src/styles/_apple-typography.scss` (mixins por nivel: hero-display, display-lg, body, etc.)
- `src/styles/_apple-components.scss` (mixins reutilizaveis: button-primary, search-input, etc.)

**Criterios de verificacao**
- todos os tokens listados em `DESIGN-apple.md` mapeados em SCSS
- codigo SCSS valida no Stylelint
- documentacao breve em comentarios de cada bloco

**Pre-requisitos**
- F-Sprint 0 concluida

**Dependencias**
- nenhuma dentro desta F-Sprint

**Responsavel sugerido**
- Dev Pleno Frontend 1

---

### Task F-1.2 - Tokens SCSS Notion (autenticado)

**Descricao**
Mesmo que F-1.1 mas para `docs-sep/DESIGN-notion.md`. Cobre: cores warm, NotionInter via Inter fallback, espacamento, raios, sombras multilayer.

**Arquivos esperados**
- `src/styles/_notion-tokens.scss`
- `src/styles/_notion-typography.scss`
- `src/styles/_notion-components.scss`

**Criterios de verificacao**
- todos os tokens listados em `DESIGN-notion.md` mapeados em SCSS
- codigo SCSS valida no Stylelint
- documentacao breve em comentarios de cada bloco

**Pre-requisitos**
- F-Sprint 0 concluida

**Dependencias**
- pode rodar em paralelo com Task F-1.1

**Responsavel sugerido**
- Dev Pleno Frontend 1

---

### Task F-1.3 - Design System Showcase (rota `/design-system`)

**Descricao**
Criar uma rota `/design-system` (acessivel apenas em modo dev) que exibe todos os tokens, tipografia, componentes em ambos os DS lado a lado. Funciona como Storybook leve sem instalar Storybook.

**Arquivos esperados**
- `src/app/features/design-system/design-system.routes.ts`
- `src/app/features/design-system/showcase.component.ts`
- subrotas `/design-system/apple` e `/design-system/notion`

**Criterios de verificacao**
- abre em `http://localhost:4200/design-system`
- mostra paleta de cores, tipografia, todos os componentes nos 2 DS
- documentacao inline explica quando usar cada um

**Pre-requisitos**
- Tasks F-1.1 e F-1.2 concluidas

**Dependencias**
- depende de F-1.1 e F-1.2

**Responsavel sugerido**
- Dev Pleno Frontend 2

---

## Grafo de dependencias entre as tasks

```
F-1.1 (tokens Apple) --+
                       |
F-1.2 (tokens Notion) -+--> F-1.3 (showcase)
```

- F-1.1 e F-1.2 podem rodar em paralelo (ownerships diferentes nao colidem)
- F-1.3 depende das 2 anteriores

## Definicao de pronto da F-Sprint 1

- Tokens Apple e Notion implementados em SCSS, validados pelo Stylelint
- Mixins de tipografia e componentes prontos para reuso
- Rota `/design-system` mostra showcase navegavel dos 2 DS
- Comentarios explicam quando usar cada token
- Showcase serve de referencia visual para PO e stakeholders aprovarem identidade

## Impacto na F-Sprint seguinte

A F-Sprint 2 (`specs/102-fsprint-2-telas-apple-publicas.md`) consome:
- Tokens Apple para implementar landing, login e register
- Mixins de Apple para botoes pill, search input, etc.

A F-Sprint 3 (`specs/103-fsprint-3-shell-notion-auth.md`) consome:
- Tokens Notion para implementar shell autenticado
- Mixins de Notion para header, sidenav, breadcrumbs

## Restricoes e regras de execucao

- F-Sprint 1 pode rodar em paralelo a Sprint 1 backend (sem dependencia)
- Comentarios em portugues; nomes de tokens em ingles tecnico (alinhado com convencao do projeto)
- Code review por Dev Senior antes de seguir para F-Sprint 2 (validar fidelidade ao DS)

## Referencias

- [PRD - API SEP §11, §22](../docs-sep/PRD.md)
- [DESIGN-apple.md](../docs-sep/DESIGN-apple.md)
- [DESIGN-notion.md](../docs-sep/DESIGN-notion.md)
- [WEB-SCREENS-PLAN.md](../docs-sep/WEB-SCREENS-PLAN.md)
- [ADR 0002 - Design Systems Apple e Notion](../adr/0002-design-systems-apple-e-notion-com-scss-puro.md)
- [Spec 100 - F-Sprint 0 (anterior)](./100-fsprint-0-setup-angular.md)
- [Spec 102 - F-Sprint 2 (proxima)](./102-fsprint-2-telas-apple-publicas.md)
