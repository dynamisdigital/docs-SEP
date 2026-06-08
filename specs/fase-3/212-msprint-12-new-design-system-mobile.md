# Spec 212 - M-Sprint 12 - New Design System Mobile

## Metadados

- **ID da Spec**: 212
- **Titulo**: M-Sprint 12 - Migracao do app mobile para o New Design System SEP
- **Status**: planejada
- **Fase do produto**: Fase 3 - Epic 17
- **Trilha**: Mobile (`sep-mobile`)
- **Origem**: PRD Epic 17; [`New Design System Sep.md`](<../../docs-sep/New Design System Sep.md>)
- **Sprint pareada**: [`114-fsprint-14-new-design-system-web.md`](./114-fsprint-14-new-design-system-web.md)
- **Depende de**: F-Sprint 10 concluida; M-Sprints 0-5 como base tecnica mobile; alinhamento visual com F-Sprint 14; decisao de manter `sep-mobile` em Ionic/Angular salvo ADR explicita em contrario
- **Responsavel principal**: Dev Mobile

## Objetivo

Substituir a base visual Notion mobile do `sep-mobile` por uma adaptacao fiel do [`New Design System Sep.md`](<../../docs-sep/New Design System Sep.md>), preservando a stack mobile atual (`Angular + Ionic + Capacitor`) e sem alterar contratos de API, regras de negocio, autenticacao ou escopo funcional.

Esta sprint e o recorte mobile do Epic 17. O recorte web fica na F-Sprint 14 (`sep-app`).

Apesar do ID `M-12`, a ordem de execucao planejada e antes da M-Sprint 6, logo apos a base mobile M-Sprints 0-5, para evitar retrabalho nas jornadas funcionais mobile.

O documento de origem foi extraido de um frontend React/Tailwind/shadcn. Nesta sprint, ele deve ser traduzido para tokens CSS/SCSS e componentes Ionic/Angular. Tailwind, shadcn/ui, Radix e React nao entram no `sep-mobile` sem ADR e aprovacao explicita.

## Decisoes de design

- O app continua sendo produto SEP. Textos, marca e assets `SimpliClin` citados no design de origem sao referencia visual, nao devem substituir a identidade SEP.
- A linguagem visual nova usa fundo frio claro, cards brancos, azul como cor de comando, verde como suporte/sucesso, estados semanticos marcados, sombras suaves e raio base `0.75rem`.
- Os tokens HSL de `:root` e `.dark` do design de origem passam a ser a fonte principal da UI mobile.
- O shell mobile deve adaptar os padroes de header, navegacao, cards, quick actions, tabs, formularios, badges, estados e animacoes para toque e viewport mobile.
- O app continua restrito a tomador e empresa credora. Financeiro interno, backoffice, administracao e auditoria seguem fora do mobile.

## Escopo

### Em escopo

- Criar camada de tokens `new-design-system` para mobile, com light/dark mode e mapeamento para variaveis Ionic (`--ion-*`).
- Migrar estilos globais, shell, tabs, header, cards, botoes, inputs, badges, dialogs, toasts, loaders e skeletons.
- Atualizar telas publicas e autenticadas existentes para o novo visual.
- Criar ou atualizar showcase visual mobile para validar tokens/componentes.
- Atualizar testes unitarios, snapshots/queries relevantes e smoke PWA em viewport mobile.
- Atualizar documentacao operacional do `sep-mobile` e referencias de design system.

### Fora de escopo

- Trocar a stack para React, Tailwind, shadcn/ui ou Radix.
- Reimplementar regras de negocio ou alterar contratos REST.
- Criar telas novas de jornada funcional que pertencem a M-Sprints 6-11.
- Renomear o produto para `SimpliClin` ou importar assets de outra marca como produto final.
- Build nativo Android/iOS, publicacao em loja ou trabalho de assets de loja.

## Tasks de implementacao

1. Auditar o design atual do `sep-mobile` e mapear pontos de migracao visual.
2. Implementar tokens HSL, dark mode e mapeamento Ionic do New Design System SEP.
3. Migrar componentes base e estados globais.
4. Migrar shell, navegacao, telas publicas e telas autenticadas existentes.
5. Atualizar showcase, testes visuais/unitarios e smoke PWA.
6. Atualizar docs operacionais e registrar divergencias/remocoes do Notion mobile.

## Gates que nao contam como task

- Precheck de branch, status Git e baseline.
- Decisao arquitetural se alguem propuser Tailwind/shadcn no mobile.
- Revisao manual de fidelidade visual em viewport mobile.
- Checkpoint pre-commit e fechamento documental.

## Definition of Done

- `sep-mobile` usa o New Design System SEP como fonte visual vigente.
- Tokens Notion mobile deixam de ser referencia ativa para novas telas mobile.
- Light/dark mode funcionam sem contraste insuficiente nos componentes base.
- Telas existentes continuam navegaveis e sem mudanca funcional.
- `npm run lint`, `npm run lint:scss`, `npm run test`, `npm run build` e smoke PWA passam ou tem falha preexistente documentada.
- Documentacao e indices apontam para a nova sprint e para [`New Design System Sep.md`](<../../docs-sep/New Design System Sep.md>).
