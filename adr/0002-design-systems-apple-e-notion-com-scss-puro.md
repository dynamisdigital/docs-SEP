# ADR 0002 - Design Systems Apple e Notion com SCSS Puro

## Status

Aceito (2026-04-27). Substitui a decisao anterior de usar template administrativo Datta Able.

## Contexto

A primeira decisao de frontend foi adotar o template administrativo **Datta Able Angular** como base visual, com possibilidade de regredir o Angular para a versao suportada pelo template (`20.x`). Apos analise, ficou claro que essa abordagem deixaria o produto pouco flexivel a mudancas de identidade visual e travaria a stack em uma versao especifica.

## Decisao

Abandonaremos o template administrativo pronto e adotaremos **dois design systems oficiais proprios**:

- [`docs-sep/DESIGN-apple.md`](../docs-sep/DESIGN-apple.md) — superficies publicas (sem autenticacao): landing, login, cadastro
- [`docs-sep/DESIGN-notion.md`](../docs-sep/DESIGN-notion.md) — superficies autenticadas (dashboard frontend e todo o mobile)

A fronteira entre os dois e o estado de autenticacao: ate o login segue Apple; a partir de `/auth/me` segue Notion.

A camada de estilizacao sera **SCSS puro**, sem Bootstrap, Tailwind, Material ou similares.

Como subproduto: Angular travado em `20.x` baseline (a clausula de downgrade foi removida; upgrade para `21` pode ser avaliado na fase de implementacao mobile se Ionic e plugins Capacitor confirmarem compatibilidade).

## Alternativas consideradas

- **Manter template Datta Able**: descartado. Limita flexibilidade do produto, trava versao do Angular em `17`, mistura componentes que nao se encaixam com a marca futura.
- **Bootstrap + tema custom**: descartado. Bootstrap traz componentes que nao sao usados e seu reset/normalize CSS conflita com tokens proprios. Bundle inflado.
- **Tailwind**: descartado. Excelente DX mas espalha regras de design no markup; dificulta manter consistencia entre componentes Apple e Notion.
- **Angular Material**: descartado. Componentes opinativos demais; estilizar fora do Material design exige fight contra a biblioteca.
- **1 unico design system**: descartado. As superficies publicas e autenticadas tem expectativas visuais diferentes (marketing-grade vs operacao); 2 DS dao identidade clara em cada contexto.

## Consequencias

### Positivas
- liberdade total para evoluir a marca
- bundle menor (sem framework CSS)
- equipe ganha competencia em design system proprio
- Angular fica em versao moderna

### Negativas
- mais codigo SCSS escrito a mao
- componentes compartilhados precisam ser construidos do zero (botoes, inputs, modais, tabelas, toasts, loaders)
- Devs Plenos Frontend precisam internalizar 2 DS, nao 1

### Neutras
- biblioteca de componentes propria pode virar produto interno reutilizavel em outros projetos da Dynamis

## Implementacao

- PRD §11 (Base frontend, Diretriz de adocao dos design systems, Base mobile)
- PRD §18 (Decisoes Consolidadas)
- Spec 101 ([`specs/fase-1/101-fsprint-1-design-tokens-showcase.md`](../specs/fase-1/101-fsprint-1-design-tokens-showcase.md)) — F-Sprint 1 traduz tokens
- WEB-SCREENS-PLAN.md e MOBILE-SCREENS-PLAN.md atualizados

## Referencias

- PRD §11, §18, §27
- DESIGN-apple.md, DESIGN-notion.md
- Specs 100-104 (trilha Frontend Foundation, 1 arquivo por F-Sprint)
- ADR 0003 (stack Angular 20)
