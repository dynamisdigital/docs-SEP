# PR — F-Sprint 14: New Design System Web (sep-app)

## Summary

Migra o `sep-app` dos design systems Apple (superficies publicas) e Notion (superficies
autenticadas) para o **New Design System SEP** (`docs-sep/New Design System Sep.md`),
mantendo a stack Angular + SCSS. Sem Tailwind/React/shadcn. Mudanca **puramente visual**:
nenhuma alteracao de contrato REST, regra de negocio, role, guard ou escopo funcional.

Inclui suporte a **tema claro/escuro** novo (nao existia antes) e a vitrine
`/design-system` reescrita como referencia do novo sistema. Os partials legados
Apple/Notion foram removidos do repo.

Epic 17. Spec `specs/fase-3/114-fsprint-14-new-design-system-web.md`,
steps `steps-fase-3/web/114-fsprint-14-steps.md`.

## Mudancas por area

- **Fundacao (`src/styles/`)**: `_sep-ds-tokens.scss` (HSL `:root` + `.dark`, raio
  `0.75rem` + derivados, sombras, gradientes, transicao, sidebar, escala neutra
  `--sep-space-*`); `_sep-ds-typography.scss` (fonte de sistema + mixins `sep-type-*`);
  `_sep-ds-components.scss` (mixins base + keyframes); `index.scss` (globais: body, foco
  ring, cor de borda, transicoes de tema).
- **Tema**: `src/app/core/theme/theme.service.ts` (signal; classe `.dark` no documento;
  `localStorage SEP_THEME`; respeita `prefers-color-scheme`) + alternador no header.
- **Componentes compartilhados** (9): badges/chips/paineis de backoffice, cobranca,
  credito e onboarding.
- **Shell e navegacao**: shell, sidenav, breadcrumbs, header (com alternador de tema).
- **Telas publicas**: landing (tiles escuros -> superficies claras), login, registro,
  verify-totp, access-denied, account-locked, redirect-to-app, step-up.
- **Telas autenticadas** (admin, profile, onboarding, credito, formalizacao, cobranca,
  backoffice) e **dashboards** (dashboard do cliente + dashboard de backoffice).
- **Vitrine** `/design-system`: reescrita para demonstrar o novo DS (paleta light/dark,
  tipografia, botoes, inputs, badges, cards, tabela, overlays, loaders, navegacao).
- **Remocao do legado**: excluidos `_apple-tokens/_apple-typography/_apple-components` e
  `_notion-tokens/_notion-typography/_notion-components`.

## Migrations / contratos

- Nenhuma. Sem mudanca de backend, contrato REST, evento ou collection.

## Decisoes aceitas

- Cores consumidas via `hsl(var(--token))`. Mapeamento semantico: azul->primary,
  verde->success, laranja->warning, vermelho/critico->destructive.
- `sep-card` (padrao shadcn) nao embute padding; telas que usavam o antigo `notion-card`
  recebem `padding: var(--sep-space-24)` explicito.
- Botoes secundarios neutros usam `sep-button-outline` (o token `--secondary` e verde, de
  suporte, e nao deve virar botao padrao).
- Escala de espacamento mantida em valores estruturais atuais sob nomes neutros
  (`--sep-space-*`), pois o documento de origem (Tailwind) nao define escala propria.
- Vitrine usa base + modifier (`.ds-btn`/`.ds-badge`) para nao duplicar a base no CSS final
  — com isso o componente volta a caber no budget de estilo (o aviso preexistente some).
- Tokens Apple inexistentes que estavam quebrados em telas inline
  (`--apple-color-canvas-light`, `--apple-color-ink-muted-30`) foram corrigidos na migracao.

## Test plan

- `npm run lint` — verde.
- `npm run lint:scss` — verde.
- `npm run test` — **285 testes verdes** (inclui `ThemeService`).
- `npm run build` — verde, **sem avisos** (incl. budget de estilo da vitrine).
- `npm run e2e` (smoke Playwright): cenarios publicos/autenticados passam.

## Dividas / follow-ups

- **Smoke Playwright (preexistente, anterior a F-14)**: os specs `golden-path`,
  `admin-flow` e `cobranca` dependem do formulario de cadastro em `/register`. Desde a
  Sprint 5 essa rota redireciona para a tela de canalizacao por perfil
  (`RedirectToAppComponent`) e o `RegisterComponent` nao esta mais roteado, logo o passo de
  cadastro desses specs falha. Nao e regressao desta sprint. Recomendado atualizar os specs
  (criar usuario via outro caminho) em follow-up.
- Revisao manual de fidelidade visual em desktop e mobile viewport (claro/escuro).
- F-Sprints 11-13 (credora, governanca, Pix web) ja nascem no novo DS.

## Notas

- Marca permanece SEP; `SimpliClin` do documento de origem e apenas referencia visual.
- Apple/Notion permanecem como historico documental das F-Sprints 0-10.

## Commits

- `195da17` feat(web): adicionar fundacao do new design system (tokens, tipografia, dark mode)
- `5648b95` feat(web): migrar componentes compartilhados para new design system
- `c655244` feat(web): aplicar new design system no shell, navegacao e telas existentes
- `7968801` feat(web): migrar dashboards e reescrever showcase para o new design system
- `a273de7` chore(web): remover design systems apple/notion legados
