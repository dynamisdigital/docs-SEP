# Spec 115 - F-Sprint 15 - Aplicacao do New Design System Web

## Metadados

- **ID da Spec**: 115
- **Titulo**: F-Sprint 15 - Aplicacao visual do New Design System SEP (login, registro, dashboard, shell)
- **Status**: concluida (mergeada em `develop` via PR #55; promocao para `main` pendente)
- **Fase do produto**: Fase 3 - Epic 17
- **Trilha**: Web (`sep-app`)
- **Origem**: PRD Epic 17; [`New Design System Sep.md`](<../../docs-sep/New Design System Sep.md>); bundle de handoff `SimpliClin Design System` (claude.ai/design); feedback do usuario sobre o resultado visual da F-Sprint 14
- **Depende de**: F-Sprint 14 concluida (PR #48 -> develop); tokens `_sep-ds-*` vigentes em `src/styles/`
- **Responsavel principal**: Devs Plenos Frontend

## Objetivo

A F-Sprint 14 migrou o `sep-app` para o New Design System SEP, mas a aplicacao ficou visualmente fraca: telas sem destaque, botoes percebidos como "sem cor" e login/registro com cores que nao combinam. A auditoria do codigo confirma que **os tokens, gradientes e sombras corretos ja existem** (`_sep-ds-tokens.scss`); o que falta e a **aplicacao** desses recursos.

Esta sprint **nao recria tokens**. Ela adiciona os primitivos visuais que faltam (chip de icone colorido, tile de acesso rapido, botao gradiente, painel de marca) e os aplica nas telas de login, registro e dashboard e no shell autenticado que as emoldura. A stack permanece Angular + SCSS; nenhuma regra de negocio, contrato REST, autenticacao, autorizacao ou rota e alterada.

A numeracao `F-15` e o proximo ID web livre apos a F-Sprint 14.

## Decisoes de design

- A F-14 ja entregou paleta (azul `#2B6CB0`, verde `#48BB78`, fundo `#F7FAFC`), `--gradient-primary/-hero`, escala de sombra azul-tingida e mixins de botao coloridos. A F-15 **nao duplica nem refaz** esses tokens; apenas consome e estende.
- **Icones**: adicionar `lucide-angular` (mesma familia Lucide do design de origem). E biblioteca de icone, nao troca de stack; Tailwind, shadcn/ui, Radix e React continuam fora sem ADR.
- **Versao do pacote de icones (divida aceita)**: usa-se `lucide-angular@0.544.0`, compativel com Angular 20 zone-based (`provideZoneChangeDetection`) e com API simples (`LucideAngularModule.pick` + `<lucide-icon name="...">`). O pacote esta deprecado em favor de `@lucide/angular@1.x`, porem este e uma reescrita zoneless/signal-based com API diferente (`provideLucideIcons` + diretiva `svg[lucideIcon]`); migrar agora propagaria mudanca de API por todas as telas numa sprint apenas cosmetica. Migracao para `@lucide/angular` fica registrada como divida, ideal junto de uma futura migracao zoneless do app.
- **Dashboard**: tratamento visual-only sobre o **conteudo real existente** (atalhos e jornadas). Proibido fabricar metricas/numeros sem fonte de dados (regra AGENT.md: nao assumir regra de negocio sem fonte).
- **Login/registro**: layout painel de marca + formulario. Marca textual `SEP` + gradiente da propria paleta; sem importar logo/assets de terceiro.
- **Shell**: incluir polimento de sidenav e header, pois o "ar profissional" do dashboard depende do frame ao redor.
- `SimpliClin`/`TeaAgenda` no design de origem sao referencia visual de outro produto; o app continua SEP.

## Escopo

### Em escopo

- Adicionar token `--sep-radius-xl` e novos mixins SCSS: `sep-icon-chip`, `sep-quick-tile`, `sep-button-gradient`, `sep-auth-brand-panel`.
- Adicionar `lucide-angular` e um set curado de icones para atalhos, jornadas e navegacao.
- Redesenhar login e registro com painel de marca + formulario, preservando logica de formulario.
- Redesenhar dashboard com grid de "Acesso Rapido" colorido, cards de jornada com chips e header sticky translucido.
- Polir shell autenticado: sidenav agrupada com item ativo destacado e header sticky com toggle de tema.
- Atualizar showcase/design-system, testes (Vitest/Playwright) e documentacao operacional do `sep-app`.
- Auditar e remover dependencias npm nao usadas apos as atualizacoes de pacote da sprint.
- Redesenhar a landing publica (`/`): hero 2-col com painel de marca, CTA gradiente e grid de cards de feature com icon-chip; remover ilustracoes SVG legadas.

### Fora de escopo

- Recriar tokens, paleta, sombras ou gradientes (entregues na F-14).
- Introduzir Tailwind, shadcn/ui, Radix ou React.
- Exibir metricas numericas no dashboard sem fonte de dados (nao inventar dados).
- Criar telas funcionais novas de credora, governanca ou Pix (F-Sprints 11-13).
- Usar logo/branding de terceiro como identidade final do SEP.
- Alterar backend, contratos REST, autenticacao ou autorizacao.

## Tasks de implementacao

0. Fundacao: instalar `lucide-angular`, token `--sep-radius-xl` e mixins base (icon-chip, quick-tile, button-gradient, auth-brand-panel).
1. Login + registro: layout painel de marca + formulario, CTA gradiente, select de perfil consistente.
2. Dashboard: header sticky, "Acesso Rapido" como tiles coloridos, jornadas com chips, sem dados fabricados.
3. Shell: sidenav agrupada e header sticky translucido com toggle de tema.
4. Showcase, testes, varredura de dependencias nao usadas e documentacao operacional.
5. Landing publica (`/`): hero 2-col com painel de marca + grid de cards de feature com icon-chip; remover SVGs legados.

## Gates que nao contam como task

- Precheck de branch (a partir de `develop` atualizado), status Git e baseline (`lint`/`lint:scss`/`test`/`build`).
- Decisao arquitetural se alguem propuser Tailwind/shadcn/React no web.
- Revisao manual de fidelidade visual em desktop e mobile viewport, light e dark.
- Checkpoint pre-commit por task e fechamento documental.

## Definition of Done

- `sep-app` aplica o New Design System SEP de forma rica em login, registro, dashboard e shell.
- Botoes de destaque usam cor/gradiente; atalhos e jornadas usam chips de icone coloridos.
- Login/registro usam painel de marca SEP, sem logo de terceiro.
- Dashboard nao exibe metrica/numero fabricado; usa conteudo real existente.
- Light/dark mode funcionam sem contraste insuficiente nas telas alteradas.
- Nenhuma mudanca funcional: formularios, validacoes, rotas, guards e contratos preservados.
- `npm run lint`, `npm run lint:scss`, `npm run test`, `npm run build` e smoke Playwright passam ou tem falha preexistente documentada.
- Documentacao e indices apontam para a F-Sprint 15 e para os novos primitivos.
