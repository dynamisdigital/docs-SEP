# PR — F-Sprint 15: Aplicacao do New Design System no web (sep-app)

## Summary

Aplica com profundidade o New Design System SEP (Epic 17) nas telas que ficaram visualmente fracas
apos a F-14: **login/registro** (painel de marca), **dashboard** (header sticky + "Acesso Rapido" +
jornadas), **shell autenticado** (sidenav agrupada + header sticky) e a **landing publica** (`/`,
hero 2-col + cards de feature). Mudanca puramente visual:
nenhuma regra de negocio, contrato REST, rota, guard ou autorizacao foi alterada. A F-14 ja entregou
os tokens corretos; a F-15 adiciona os primitivos que faltavam e os aplica.

Spec `specs/fase-3/115-fsprint-15-aplicacao-design-system-web.md`,
steps `steps-fase-3/web/115-fsprint-15-steps.md`.

## Mudancas por area

- **Fundacao** (`_sep-ds-tokens.scss`, `_sep-ds-components.scss`, `core/icons/lucide-icons.ts`,
  `app.config.ts`): `lucide-angular` (set curado registrado via `LucideAngularModule.pick`); tokens
  `--sep-radius-xl`, `--gradient-foreground`, `--header-height`; mixins `sep-icon-chip`,
  `sep-quick-tile`, `sep-button-gradient`, `sep-auth-brand-panel`. Sem recriar paleta.
- **Login + registro** (`features/public/{login,register}`): layout painel de marca (gradiente
  azul->verde, wordmark SEP, tagline "Sociedade de Emprestimo entre Pessoas", selos regulatorios com
  check Lucide) + card de formulario; CTA gradiente; focus ring azul. Logica de form, validacao,
  rotas e a11y preservadas; contraste dark corrigido (`--gradient-foreground`).
- **Dashboard** (`features/authenticated/dashboard`): header sticky translucido; "Acesso rapido" com
  atalhos reais em tiles coloridos por dominio (icone Lucide + label + descricao visivel); "Proximas
  jornadas" com chip de icone + badge "Em preparacao". Sem metrica/numero fabricado; role-gating
  intacto.
- **Shell** (`layout/{sidenav,header}`): sidenav agrupada (Jornadas/Operacao/Conta) com icone por
  item, item ativo com icone azul + wash accent, marca SEP no topo e rodape de usuario
  (avatar/nome/role), sticky; header sticky translucido + blur com icones Lucide (menu/sol-lua/sair).
  Token `--header-height` compartilhado coordena os stickies (header global > sub-header do dashboard
  > sidenav).
- **Landing publica** (`features/public/landing`, rota `/`): hero 2-col (texto + CTAs gradiente + selos
  `circle-check` a esquerda; painel de marca `sep-auth-brand-panel` a direita) e secao "Como funciona"
  com grid de `sep-card` + `sep-icon-chip` (Seguranca/Tomador/Credora). Removidos os 3 SVGs legados
  (`assets/landing/sep-{escrow,credito,capital}.svg`); nav sticky translucido. Rota e copy regulatoria
  preservadas.
- **Vitrine** (`features/design-system`): nova secao demonstra tiles de acesso rapido, chips de icone,
  botao gradiente e painel de marca.
- **Limpeza de dependencias**: removidos Karma/Jasmine (7 devDeps) nao usados — o repo roda Vitest;
  target `test` (builder `@angular/build:karma`) removido do `angular.json`. `@lucide/angular`
  (experimento revertido) confirmado ausente do `package.json`/lock. Declarados como devDeps
  `@eslint/js` e `@types/node` (antes so transitivos). Removida a config `ng test` (karma) stale do
  `.vscode/launch.json`. Vitrine F-15 enxugada para ficar sob o budget de estilo (`anyComponentStyle`).

## Migrations / contratos

- Nenhuma migration. Nenhum contrato REST consumido ou alterado (mudanca visual). Nenhuma chamada de
  API nova; nenhum dado de metrica fabricado no dashboard.

## Decisoes aceitas

- F-15 nao recria tokens; reusa a base da F-14 e so adiciona os primitivos faltantes.
- Marca = texto "SEP" + gradiente da paleta; sem logo/assets de terceiro (SimpliClin/TeaAgenda
  permanecem como referencia visual, nao como marca final).
- Dashboard visual-only com conteudo real existente; proibido fabricar metricas (regra AGENT.md).
- Icones: `lucide-angular@0.544.0` (compativel com Angular 20 zone-based). `@lucide/angular@1.x`
  (reescrita zoneless/signal, API diferente) fica como divida aceita — migrar junto de futura
  migracao zoneless do app.
- Marca/usuario aparecem no header e na sidenav (redundancia aceita para honrar o step do shell).

## Test plan

- `npm run lint` — verde (inclui `e2e/`).
- `npm run lint:scss` — verde.
- `npm run test` (Vitest) — 397 testes / 69 arquivos verdes; inclui specs novos (toggle de tema e
  emit de colapso no header) e render com `<lucide-icon>` em login/registro/dashboard/sidenav/vitrine.
- `npm run build` — compila.
- `npx depcheck` — `@eslint/js` e `@types/node` (apontados como Missing, usados por
  `eslint.config.js`/`tsconfig.spec.json`) declarados explicitamente como devDeps; sem
  dependencias Missing. Unused restantes sao falsos positivos mantidos (`tslib` helper de
  runtime, `@angular/compiler-cli` build AOT, `stylelint-config-standard-scss` preset do
  stylelint). Karma/Jasmine removidos.
- Smoke Playwright — **nao executado neste ambiente**: o `ng serve` (webServer do Playwright) e os
  diretorios `test-results/`, `playwright-report/` e `.angular/cache/` estao root-owned (EACCES),
  bloqueio ambiental preexistente (mesmo caso do `dist`), nao regressao. Os selectors do e2e
  (ids/labels/textos/rotas) foram preservados. Re-rodar apos `chown`.

## Dividas / follow-ups

- **Smoke Playwright**: re-executar apos `chown` dos dirs root-owned (`.angular/cache`, `test-results`,
  `playwright-report`).
- **Migracao para `@lucide/angular`**: junto de eventual migracao zoneless do app.
- **Semantica ARIA dos grupos do sidenav**: group-labels visiveis sem `aria-labelledby` ligando ao
  `<ul>` (nit de a11y, opcional).

## Notas

- Mudanca 100% visual; a autorizacao real permanece server-side. Light/dark validados nas telas
  alteradas.

## Commits

- `1fdb680` feat(web): adicionar icones lucide e primitivos visuais do design system (F-15.0)
- `fcc95cb` feat(web): redesenhar login e registro com painel de marca (F-15.1)
- `1464d2e` fix(web): corrigir contraste dark mode e a11y do login/registro (F-15.1)
- `78ee03f` fix(web): usar icones lucide e corrigir a11y dos selos no login/registro (F-15.1)
- `23b783a` feat(web): redesenhar dashboard com acesso rapido e header sticky (F-15.2)
- `975ed82` feat(web): polir shell com sidenav agrupada e header sticky (F-15.3)
- `b0a1523` fix(web): adicionar marca e usuario na sidenav, desc visivel nos tiles e testes de header (F-15.3)
- `2617950` feat(web): demonstrar primitivos f-15 na vitrine do design system (F-15.4)
- `a6339b1` chore(web): remover karma/jasmine nao usados do web (F-15.4)
- `edbef9f` chore(web): declarar deps faltantes, limpar launch.json e enxugar vitrine (F-15.4)
- `9a0db80` feat(web): redesenhar landing publica com hero 2-col e cards de feature (F-15.5)
