# Steps - F-Sprint 14 - New Design System Web

**Spec de origem**: [`specs/fase-3/114-fsprint-14-new-design-system-web.md`](../../specs/fase-3/114-fsprint-14-new-design-system-web.md)

**Objetivo geral**: migrar o `sep-app` dos design systems Apple/Notion para o New Design System SEP descrito em [`docs-sep/New Design System Sep.md`](<../../docs-sep/New Design System Sep.md>), mantendo Angular/SCSS, preservando contratos de API e sem introduzir regra de negocio no frontend.

**Esforco total estimado**: 5-7 dias.

**Repo de destino**: `sep-app`.

**Localizacao do projeto web**: `<sep-app-root>/`.

**Nota de numeracao**:
- `F-14` e o proximo ID web livre.
- A sprint deve ser executada logo apos a F-Sprint 10 e antes da F-Sprint 11.
- F-Sprints 11-13 continuam planejadas, mas dependem desta migracao para evitar retrabalho visual.

**Decisao de arquitetura da sprint**:
- O design de origem foi extraido de React + Tailwind + shadcn/ui.
- O `sep-app` continua em Angular + SCSS.
- Esta sprint traduz tokens, padroes visuais e componentes para SCSS/componentes Angular.
- Nao instalar Tailwind, shadcn/ui, Radix, React, `next-themes` ou `framer-motion` sem ADR aprovada e ordem explicita do usuario.

**Lembrete de marca**:
- `SimpliClin` no documento de origem e referencia do produto de onde o design foi extraido.
- O app continua sendo SEP; nao trocar nome, marca, copy institucional ou assets finais para SimpliClin.
- Se for necessario um icone novo, criar/adaptar um `SepWebIcon` ou `SepLogo` inspirado no padrao de linhas/nos, sem reutilizar marca de terceiro como identidade final.

**Ordem de execucao recomendada**:

```text
F-14.0 (prechecks)
   |
   v
F-14.1 (auditoria visual e plano de migracao)
   |
   v
F-14.2 (tokens HSL + globals)
   |
   v
F-14.3 (componentes base)
   |
   v
F-14.4 (shell e telas existentes)
   |
   v
F-14.5 (dashboards/listas/graficos + showcase)
   |
   v
F-14.6 (testes, docs e fechamento)
```

**Como usar este arquivo**:
1. Execute as tasks na ordem.
2. Ao fim de cada task de implementacao, pare em checkpoint pre-commit.
3. Informe arquivos alterados, verificacoes executadas, riscos e mensagem de commit sugerida.
4. Aguarde o usuario mandar `commit` antes de commitar.
5. Em `docs-SEP`, nao fazer commit automatico; o git da documentacao e manual.

**Pre-requisitos globais**:
- F-Sprint 10 concluida ou em fechamento.
- `sep-app` com F-Sprints 0-10 entregues.
- Node/npm do repo web funcionando.
- Acesso ao documento [`docs-sep/New Design System Sep.md`](<../../docs-sep/New Design System Sep.md>).
- Conhecimento dos arquivos atuais de design Apple/Notion (`src/styles/*`, `src/app/layout/*`, showcase).

**Fora de escopo durante estes steps**:
- Telas funcionais novas de credora, governanca ou Pix.
- Backend, contratos REST, MSW de regra de negocio e autorizacao.
- Mudanca de stack para Tailwind/shadcn/React.
- Rebranding final fora do necessario para adaptar a identidade SEP ao novo visual.

---

## Task F-14.0 - Prechecks da F-Sprint 14

**Objetivo**: confirmar estado do repo, baseline e fontes documentais antes de mexer em design.

**Esforco**: 30-45 min.

### Step 114.0.1 - Conferir branch e status Git

**Comandos**:
```bash
cd <sep-app-root>
git status --short --branch
git rev-parse --abbrev-ref HEAD
git log --oneline -10
```

**Verificacao**:
- Branch criada a partir de `develop` atualizado.
- Working tree limpo ou alteracoes locais identificadas como do usuario.
- Nenhuma alteracao de sprint anterior sem owner claro.

### Step 114.0.2 - Criar branch da sprint

**Comandos**:
```bash
cd <sep-app-root>
git switch develop
git pull --ff-only
git switch -c feature/fsprint-14-new-design-system-web
```

**Verificacao**:
- Branch `feature/fsprint-14-new-design-system-web` ativa.
- Se `git pull --ff-only` falhar, parar e avisar o usuario.

### Step 114.0.3 - Confirmar baseline do projeto

**Comandos**:
```bash
cd <sep-app-root>
npm run lint -- --quiet
npm run lint:scss
npm run test -- --run
npm run build
```

**Verificacao**:
- Baseline verde antes das alteracoes.
- Qualquer falha preexistente deve ser registrada antes de mudar SCSS/componentes.

### Step 114.0.4 - Confirmar fontes de design

**Comandos**:
```bash
cd <docs-sep-root>
test -f "docs-sep/New Design System Sep.md"
test -f "specs/fase-3/114-fsprint-14-new-design-system-web.md"
test -f "steps-fase-3/web/114-fsprint-14-steps.md"
```

**Verificacao**:
- Documento novo de design localizado.
- Spec e steps da F-Sprint 14 localizados.

### Definicao de pronto da Task F-14.0
- [x] Branch correta.
- [x] Baseline registrada.
- [x] Fonte de design confirmada.
- [x] Escopo sem troca de stack confirmado.

### Commit Task F-14.0
Nao gera commit; apenas validacao.

---

## Task F-14.1 - Auditoria visual e plano de migracao

**Objetivo**: mapear onde Apple/Notion aparecem no `sep-app` e definir estrategia de substituicao sem quebrar telas existentes.

**Pre-requisito**: Task F-14.0 concluida.

**Esforco**: 0,5-1 dia.

### Step 114.1.1 - Inventariar tokens e estilos atuais

**Comandos**:
```bash
cd <sep-app-root>
find src/styles -maxdepth 3 -type f | sort
find src/app -maxdepth 6 -type f | sort
grep -R "apple\\|Apple\\|notion\\|Notion\\|--apple\\|--notion\\|theme-transition\\|dark" -n src
```

**Verificacao**:
- Lista de tokens, mixins, globals, layout e componentes afetados.
- Separar Apple publico, Notion autenticado e estilos locais de feature.

### Step 114.1.2 - Mapear superficies existentes

**Superficies minimas**:
- Publicas: landing/welcome, login, register e access-denied se existir fora do shell.
- Autenticadas: shell, header, sidenav, breadcrumbs, dashboard, profile, change-password, admin users, onboarding, credito, formalizacao, cobranca e backoffice F-10.
- Shared: botoes, inputs, badges, cards, tabelas, modais, toasts, loading/error/empty.
- Showcase/design-system.

**Verificacao**:
- Nenhuma area funcional relevante fica fora do plano.
- Telas futuras F-11 a F-13 ficam anotadas para usar o novo DS quando forem implementadas.

### Step 114.1.3 - Comparar design novo contra Apple/Notion atuais

**Pontos obrigatorios da comparacao**:
- Paleta HSL nova (`--background`, `--primary`, `--secondary`, `--success`, `--warning`, `--destructive`, `--devolutiva`).
- Light/dark mode novo.
- Raios `0.75rem` e derivacoes.
- Sombras `--shadow-sm/md/lg/card/elegant/glow`.
- Shell administrativo: header `h-14`, sidebar, footer de usuario e conteudo `p-4 lg:p-6`.
- Dashboard: quick actions, cards de metricas, rankings, atividades recentes, graficos.
- Componentes: botoes, badges, inputs, tabs, tabelas/listas, dialogs/dropdowns, skeleton/loading.

### Step 114.1.4 - Definir nomes e estrategia de compatibilidade

**Direcao recomendada**:
- Criar novos arquivos com prefixo `_sep-ds-*` ou `_new-design-system-*`.
- Evitar novos tokens com prefixo `apple` ou `notion`.
- Remover imports antigos somente depois de a nova camada compilar.
- Criar aliases temporarios apenas quando reduzirem risco de migracao.

**Verificacao**:
- Plano nao exige alterar fluxo funcional.
- Plano nao exige instalar Tailwind/shadcn.
- Plano permite rollback por commit.

### Definicao de pronto da Task F-14.1
- [x] Superficies impactadas mapeadas.
- [x] Decisao de nomes dos novos tokens definida.
- [x] Riscos registrados no checkpoint.
- [x] Nenhuma alteracao funcional feita.

### Commit sugerido
```text
chore(web): mapear migracao para new design system
```

---

## Task F-14.2 - Tokens HSL, dark mode e estilos globais

**Objetivo**: criar a base visual global do New Design System SEP no web.

**Pre-requisito**: Task F-14.1 concluida.

**Esforco**: 1 dia.

### Step 114.2.1 - Criar tokens do New Design System SEP

**Arquivos provaveis**:
- `<sep-app-root>/src/styles/_sep-design-system-tokens.scss`
- `<sep-app-root>/src/styles/index.scss`

**Implementacao**:
- Transcrever tokens `:root` do documento de origem como CSS custom properties.
- Transcrever bloco `.dark`.
- Preservar HSL no formato `--primary: 213 58% 43%`.
- Adicionar tokens de sombra, gradientes e transicao.
- Expor helpers SCSS apenas se o padrao atual do repo usar mixins para isso.

**Verificacao**:
- Nenhum token novo usa prefixo `apple` ou `notion`.
- Light e dark mode existem no mesmo arquivo.
- Stylelint passa.

### Step 114.2.2 - Atualizar globals e reset visual

**Arquivos provaveis**:
- `<sep-app-root>/src/styles/index.scss`
- `<sep-app-root>/src/styles/_mixins.scss`, se existir.

**Implementacao**:
- Body usa `hsl(var(--background))` e `hsl(var(--foreground))`.
- Aplicar transicoes globais de tema para superficies, texto, borda, svg, inputs e botoes.
- Definir foco visivel via `ring`.
- Remover dependencia ativa de Apple/Notion quando substituida.
- Evitar seletor global que quebre componentes de terceiros.

**Verificacao**:
- App carrega sem flash visual quebrado.
- Scroll e layout base continuam estaveis.
- Sem cor antiga dominante.

### Step 114.2.3 - Definir dark mode

**Implementacao**:
- Confirmar mecanismo atual de tema do `sep-app`.
- Se nao existir, introduzir suporte minimo controlado por classe `.dark` sem persistencia complexa.
- Nao criar regra de negocio ou preferencia de usuario fora de escopo.

**Verificacao**:
- Tokens `.dark` aplicam em shell e componentes base.
- Contraste de texto, bordas e botoes continua legivel.

### Step 114.2.4 - Isolar legado Apple/Notion

**Implementacao**:
- Remover imports antigos substituidos.
- Se algum arquivo antigo permanecer por compatibilidade, comentar como legado historico.
- Atualizar referencias no showcase para New Design System SEP.

**Verificacao**:
- `grep -R "apple\\|Apple\\|notion\\|Notion\\|--apple\\|--notion" -n src` mostra apenas legado justificado ou historico.
- `npm run lint:scss` passa.

### Definicao de pronto da Task F-14.2
- [x] Tokens light/dark implementados.
- [x] Globals migrados.
- [x] Legado Apple/Notion isolado.
- [x] `npm run lint:scss` passa.

### Commit sugerido
```text
feat(web): adicionar tokens do new design system
```

---

## Task F-14.3 - Componentes base e estados globais

**Objetivo**: migrar componentes e estados compartilhados para o novo visual.

**Pre-requisito**: Task F-14.2 concluida.

**Esforco**: 1-1,5 dia.

### Step 114.3.1 - Migrar botoes e acoes iconicas

**Implementacao**:
- Base flex center, gap, raio `md`, foco visivel com `ring`.
- Variantes: primary/default, secondary, outline, ghost, destructive, link e icon.
- Tamanhos: default, sm, lg e icon.
- Usar lucide icons quando ja houver padrao local.

**Verificacao**:
- Botoes nao mudam layout ao carregar icone/texto.
- Texto nao estoura em mobile/desktop.
- Disabled e foco por teclado estao claros.

### Step 114.3.2 - Migrar formularios, inputs e filtros

**Implementacao**:
- Inputs com `border/input`, `bg-background`, placeholder muted e foco em ring.
- Labels `text-sm font-medium text-muted-foreground` equivalente.
- Mensagens de erro em destructive.
- Filtros segmentados com fundo `muted/30`, borda e botoes compactos.

**Verificacao**:
- Reactive Forms existentes continuam funcionando.
- Erros e disabled continuam legiveis.
- Nada persiste dado sensivel em storage por causa da migracao visual.

### Step 114.3.3 - Migrar cards, badges, listas e tabelas

**Implementacao**:
- Card base: `rounded-lg border bg-card text-card-foreground shadow-sm`.
- Cards operacionais com shadow-md e hover/tap sutil quando clicaveis.
- Badges pill com variantes semanticas.
- Tabelas: wrapper com overflow, header muted, linhas hover `muted/50`.
- Listas densas com grid/flex e hover `muted/20`.

**Verificacao**:
- Nao criar cards aninhados.
- Tabelas continuam responsivas.
- Badges nao quebram status longos.

### Step 114.3.4 - Migrar dialogs, dropdowns, toasts, loaders e skeletons

**Implementacao**:
- Dialog/popover/dropdown com `bg-background`/`popover`, borda, sombra e animacao curta.
- Toasts com semantic colors.
- Loader `animate-spin` equivalente em SCSS.
- Skeleton `animate-pulse` equivalente.

**Verificacao**:
- Overlays respeitam z-index existente.
- Toast nao cobre comandos essenciais.
- Loading/skeleton nao causa layout shift relevante.

### Definicao de pronto da Task F-14.3
- [x] Componentes base migrados.
- [x] Estados globais migrados.
- [x] `npm run lint`, `npm run lint:scss` e `npm run test -- --run` passam.

### Commit sugerido
```text
feat(web): migrar componentes base para new design system
```

---

## Task F-14.4 - Shell, navegacao e telas existentes

**Objetivo**: aplicar o novo design nas superficies reais existentes do `sep-app`.

**Pre-requisito**: Task F-14.3 concluida.

**Esforco**: 1,5-2 dias.

### Step 114.4.1 - Migrar shell autenticado

**Arquivos provaveis**:
- `<sep-app-root>/src/app/layout/shell/*`
- `<sep-app-root>/src/app/layout/sidenav/*`
- `<sep-app-root>/src/app/layout/breadcrumbs/*`, se existir.

**Implementacao**:
- Header com altura proxima de `h-14`, borda inferior e `bg-background`.
- Sidebar com borda, grupos, item ativo e footer de usuario no novo padrao.
- Conteudo com `p-4 lg:p-6`, fundo `accent/5` ou equivalente e painel `bg-card`.
- Breadcrumbs discretos e operacionais.

**Verificacao**:
- Navegacao por role continua funcionando.
- Sidenav colapsavel, se existir, nao quebra.
- Shell nao mostra texto educativo longo.

### Step 114.4.2 - Migrar telas publicas

**Arquivos provaveis**:
- `<sep-app-root>/src/app/features/public/**`

**Implementacao**:
- Landing/welcome, login e register deixam de usar Apple como fonte ativa.
- Usar fundo frio claro, superficies brancas, botoes primary/outline e formularios novos.
- Nao criar marketing page nova se a tela atual ja cumpre o fluxo.
- Nao usar copy `SimpliClin`.

**Verificacao**:
- Login/cadastro continuam chamando os mesmos services.
- MSW/dev-offline continua funcionando.
- Mobile viewport nao estoura.

### Step 114.4.3 - Migrar telas autenticadas existentes

**Arquivos provaveis**:
- `<sep-app-root>/src/app/features/authenticated/**`

**Implementacao**:
- Dashboard, perfil, alterar senha, admin users, onboarding, credito, formalizacao, cobranca e backoffice passam para o novo visual.
- Remover estilos locais duplicados quando componente global cobrir.
- Manter feature-specific SCSS apenas para layout e densidade de tela.

**Verificacao**:
- Nenhuma permissao/role muda.
- Nenhum endpoint novo e chamado.
- Estados loading/error/empty continuam funcionais.

### Step 114.4.4 - Ajustar responsividade e densidade

**Implementacao**:
- Validar desktop largo, laptop e mobile viewport.
- Estabilizar dimensoes de toolbars, cards, tabelas e botoes.
- Corrigir overflow horizontal e texto estourado.

**Verificacao**:
- Sem sobreposicao incoerente.
- Tabelas/listas tem scroll ou layout responsivo.
- Botoes compactos continuam legiveis.

### Definicao de pronto da Task F-14.4
- [x] Shell migrado.
- [x] Telas publicas migradas.
- [x] Telas autenticadas existentes migradas.
- [x] Nenhuma mudanca funcional indevida.
- [x] `npm run test -- --run` passa.

### Commit sugerido
```text
feat(web): aplicar new design system nas telas existentes
```

---

## Task F-14.5 - Dashboards, listas, graficos e showcase

**Objetivo**: validar os padroes densos do design novo em superficies operacionais do web.

**Pre-requisito**: Task F-14.4 concluida.

**Esforco**: 1 dia.

### Step 114.5.1 - Migrar dashboards e quick actions

**Implementacao**:
- Cards de metricas com `shadow-md`, icone em bloco colorido e numero em destaque.
- Quick actions em grid responsivo.
- Header sticky apenas onde fizer sentido operacional.
- Evitar cards dentro de cards.

**Verificacao**:
- Dashboard administrativo/backoffice continua escaneavel.
- Nao recalcular metricas no frontend.

### Step 114.5.2 - Migrar padroes de tabela/lista operacional

**Implementacao**:
- Tabelas com header muted, hover, overflow controlado e celulas compactas.
- Listas densas com grid responsivo.
- Filtros e paginacao seguem botoes/inputs novos.

**Verificacao**:
- Fila/backoffice/cobranca continuam legiveis.
- Texto de status nao quebra layout.

### Step 114.5.3 - Definir padrao de graficos

**Implementacao**:
- Se o app ja usa grafico, migrar wrapper visual para tokens novos.
- Se ainda nao usa, documentar no showcase o padrao esperado para grafico futuro sem adicionar biblioteca nova.
- Nao introduzir `recharts` sem demanda funcional real e ADR/decisao local.

**Verificacao**:
- Nenhum bundle novo pesado entra sem justificativa.
- Padrao futuro esta claro para F-11/F-13.

### Step 114.5.4 - Atualizar showcase/design-system

**Arquivos provaveis**:
- `<sep-app-root>/src/app/features/design-system/**`

**Implementacao**:
- Showcase deve cobrir:
  - paleta light/dark;
  - tipografia;
  - botoes;
  - inputs/formularios;
  - badges/status;
  - cards/listas/tabelas;
  - dialogs/toasts;
  - loaders/skeletons;
  - shell/sidebar/header;
  - graficos como padrao documentado, se aplicavel.

**Verificacao**:
- Showcase renderiza em desktop e mobile viewport.
- Sem dependencia de dados reais.

### Definicao de pronto da Task F-14.5
- [x] Dashboards/listas densas migrados.
- [x] Padrao de graficos decidido.
- [x] Showcase atualizado.
- [x] Sem biblioteca visual nova sem ADR.

### Commit sugerido
```text
feat(web): atualizar showcase do new design system
```

---

## Task F-14.6 - Testes, docs e fechamento

**Objetivo**: fechar a sprint com verificacao automatizada e documentacao atualizada.

**Pre-requisito**: Task F-14.5 concluida.

**Esforco**: 0,5-1 dia.

### Step 114.6.1 - Atualizar testes unitarios

**Comandos**:
```bash
cd <sep-app-root>
npm run test -- --run
```

**Implementacao**:
- Ajustar queries que dependiam de textos/classes removidas.
- Cobrir render de shell, login/register, dashboard e showcase.
- Evitar snapshots grandes e frageis.

### Step 114.6.2 - Atualizar smoke Playwright

**Comandos**:
```bash
cd <sep-app-root>
npm run e2e
```

**Cenarios minimos**:
- Publico abre sem tela em branco.
- Login/dev-offline abre shell autenticado.
- Showcase abre.
- Uma rota operacional existente abre em desktop e mobile viewport quando MSW suportar.

**Verificacao visual manual**:
- Sem texto sobreposto.
- Sem overflow horizontal.
- Cards/botoes com dimensao estavel.
- Dark mode, se disponivel, sem contraste quebrado.

### Step 114.6.3 - Rodar suite final

**Comandos**:
```bash
cd <sep-app-root>
npm run lint -- --quiet
npm run lint:scss
npm run test -- --run
npm run build
```

**Verificacao**:
- Suite verde.
- Warnings preexistentes registrados.
- Build gera output esperado.

### Step 114.6.4 - Atualizar docs operacionais

**Arquivos provaveis**:
- `<docs-sep-root>/repos/sep-app/README.md`
- `<docs-sep-root>/docs-sep/WEB-SCREENS-PLAN.md`
- `<docs-sep-root>/AI-ROADMAP.md`

**Implementacao**:
- Registrar que o design vigente do web passa a ser [`New Design System Sep.md`](<../../docs-sep/New Design System Sep.md>).
- Registrar que Apple/Notion viraram legado historico para o web.
- Registrar onde ficam tokens, componentes base e showcase.
- Atualizar status da F-Sprint 14 conforme realidade.

### Step 114.6.5 - Checkpoint final da sprint

**Comandos**:
```bash
cd <sep-app-root>
git status --short
git log --oneline -5
```

**Pausa obrigatoria**:
- Aguardar revisao manual do usuario.
- Nao iniciar F-Sprint seguinte sem ordem explicita.

### Definicao de pronto da Task F-14.6
- [x] Testes e build executados.
- [x] Docs atualizados.
- [x] Resumo de fechamento preparado.
- [x] Usuario liberou proxima sprint explicitamente.

### Commit sugerido
```text
docs(web): registrar new design system web
```

---

## Checklist final da F-Sprint 14

- [x] New Design System SEP e fonte visual vigente do `sep-app`.
- [x] Tokens HSL light/dark implementados.
- [x] Componentes base migrados.
- [x] Shell e telas existentes migrados.
- [x] Showcase atualizado.
- [x] Sem strings/branding `SimpliClin` como produto final.
- [x] Sem Tailwind/shadcn/React adicionados sem ADR.
- [x] Sem regra de negocio nova no frontend.
- [x] `npm run lint -- --quiet` verde.
- [x] `npm run lint:scss` verde.
- [x] `npm run test -- --run` verde.
- [x] `npm run build` verde.
- [x] Smoke Playwright validado (9 cenarios verdes; `golden-path`/`admin-flow`/`cobranca` falham por dependerem do cadastro em `/register`, quebra preexistente desde a Sprint 5 — nao e regressao da F-14, follow-up para atualizar os specs).
- [x] Docs e indices atualizados.
