# Spec 114 - F-Sprint 14 - New Design System Web

## Metadados

- **ID da Spec**: 114
- **Titulo**: F-Sprint 14 - Migracao do web para o New Design System SEP
- **Status**: mergeada (PR #48 -> develop, 2026-06-09; promovida a main via PR #52)
- **Fase do produto**: Fase 3 - Epic 17
- **Trilha**: Web (`sep-app`)
- **Origem**: PRD Epic 17; [`New Design System Sep.md`](<../../docs-sep/New Design System Sep.md>)
- **Depende de**: F-Sprint 10 concluida; base tecnica F-Sprints 0-5; decisao de manter `sep-app` em Angular/SCSS salvo ADR explicita em contrario
- **Responsavel principal**: Devs Plenos Frontend

## Objetivo

Substituir a base visual Apple/Notion do `sep-app` por uma adaptacao fiel do [`New Design System Sep.md`](<../../docs-sep/New Design System Sep.md>), preservando a stack atual (`Angular + SCSS`) e sem alterar contratos de API, regras de negocio, autenticacao, autorizacao ou escopo funcional.

A numeracao `F-14` e o proximo ID web livre. A ordem de execucao planejada e logo apos a F-Sprint 10, antes da F-Sprint 11, para evitar retrabalho visual nas jornadas credora, governanca e Pix.

## Decisoes de design

- O app continua sendo produto SEP. Textos, marca e assets `SimpliClin` citados no design de origem sao referencia visual, nao devem substituir a identidade SEP.
- A linguagem visual nova usa fundo frio claro, superficies brancas, azul como cor de comando, verde como suporte/sucesso, estados semanticos marcados, sombras suaves e raio base `0.75rem`.
- O documento de origem usa React/Tailwind/shadcn, mas o `sep-app` continua em Angular + SCSS. Tailwind, shadcn/ui, Radix e React nao entram sem ADR e aprovacao explicita.
- Apos esta sprint, o New Design System SEP vira a fonte visual vigente para superficies publicas e autenticadas do `sep-app`.
- Apple e Notion permanecem apenas como historico das F-Sprints 0-10 e como referencia de migracao, nao como fonte para novas telas.

## Escopo

### Em escopo

- Criar camada de tokens `new-design-system` para web, com light/dark mode.
- Migrar estilos globais, shell, sidenav/header, breadcrumbs, cards, botoes, inputs, badges, tabs, dialogs, dropdowns, loaders, skeletons, tabelas/listas e estados.
- Atualizar telas publicas e autenticadas existentes ate F-Sprint 10.
- Atualizar showcase/design-system web.
- Atualizar Vitest, Playwright, MSW visual quando necessario e smoke em desktop/mobile viewport.
- Atualizar documentacao operacional do `sep-app` e referencias de design system.

### Fora de escopo

- Trocar a stack para React, Tailwind, shadcn/ui ou Radix.
- Reimplementar regras de negocio ou alterar contratos REST.
- Criar novas telas funcionais de credora, governanca ou Pix que pertencem a F-Sprints 11-13.
- Renomear o produto para `SimpliClin` ou importar assets de outra marca como produto final.
- Redesenhar marca institucional definitiva alem da adaptacao visual necessaria para o shell.

## Tasks de implementacao

1. Auditar Apple/Notion atuais no `sep-app` e mapear pontos de migracao visual.
2. Implementar tokens HSL, dark mode e estilos globais do New Design System SEP.
3. Migrar componentes base e estados globais.
4. Migrar shell, navegacao, telas publicas e telas autenticadas existentes.
5. Migrar padroes densos de dashboard, tabelas/listas, cards operacionais e graficos quando existirem.
6. Atualizar showcase, testes, smoke E2E e documentacao operacional.

## Gates que nao contam como task

- Precheck de branch, status Git e baseline.
- Decisao arquitetural se alguem propuser Tailwind/shadcn no web.
- Revisao manual de fidelidade visual em desktop e mobile viewport.
- Checkpoint pre-commit e fechamento documental.

## Definition of Done

- `sep-app` usa o New Design System SEP como fonte visual vigente.
- Apple/Notion deixam de ser referencia ativa para novas telas web.
- Light/dark mode funcionam sem contraste insuficiente nos componentes base.
- Telas existentes continuam navegaveis e sem mudanca funcional.
- `npm run lint`, `npm run lint:scss`, `npm run test`, `npm run build` e smoke Playwright passam ou tem falha preexistente documentada.
- Documentacao e indices apontam para a nova sprint e para [`New Design System Sep.md`](<../../docs-sep/New Design System Sep.md>).
