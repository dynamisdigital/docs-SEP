# Steps - M-Sprint 12 - New Design System Mobile

**Spec de origem**: [`specs/fase-3/212-msprint-12-new-design-system-mobile.md`](../../specs/fase-3/212-msprint-12-new-design-system-mobile.md)

**Objetivo geral**: migrar o `sep-mobile` do design Notion mobile para o New Design System SEP descrito em [`docs-sep/New Design System Sep.md`](<../../docs-sep/New Design System Sep.md>), mantendo a stack Ionic/Angular/Capacitor, preservando contratos de API e sem introduzir regra de negocio no app.

**Sprint pareada**: [`steps-fase-3/web/114-fsprint-14-steps.md`](../web/114-fsprint-14-steps.md). A F-Sprint 14 cobre `sep-app`; esta M-Sprint 12 cobre `sep-mobile`.

**Nota de ordem**: apesar do ID `M-12`, esta sprint deve ser executada antes da M-Sprint 6. O objetivo e estabilizar o design system antes de onboarding, credito, formalizacao, cobranca, credora e Pix mobile.

**Esforco total estimado**: 4-6 dias.

**Repo de destino**: `sep-mobile`.

**Localizacao do projeto mobile**: `<sep-mobile-root>/`.

**Decisao de arquitetura da sprint**:
- O design de origem foi extraido de React + Tailwind + shadcn/ui.
- O `sep-mobile` continua em Angular + Ionic + SCSS.
- Esta sprint traduz tokens, padroes visuais e componentes para SCSS/Ionic.
- Nao instalar Tailwind, shadcn/ui, Radix, React, `next-themes` ou `framer-motion` sem ADR aprovada e ordem explicita do usuario.

**Lembrete de marca**:
- `SimpliClin` no documento de origem e referencia do produto de onde o design foi extraido.
- O app continua sendo SEP; nao trocar nome, marca, copy institucional ou assets finais para SimpliClin.
- Se for necessario um icone novo, criar/adaptar um `SepMobileIcon` inspirado no padrao de linhas/nos, sem reutilizar marca de terceiro como identidade final.

**Ordem de execucao recomendada**:

```text
M-12.0 (prechecks)
   |
   v
M-12.1 (auditoria visual e plano de migracao)
   |
   v
M-12.2 (tokens HSL + Ionic variables)
   |
   v
M-12.3 (componentes base)
   |
   v
M-12.4 (shell e telas existentes)
   |
   v
M-12.5 (showcase + testes visuais)
   |
   v
M-12.6 (docs e fechamento)
```

**Como usar este arquivo**:
1. Execute as tasks na ordem.
2. Ao fim de cada task de implementacao, pare em checkpoint pre-commit.
3. Informe arquivos alterados, verificacoes executadas, riscos e mensagem de commit sugerida.
4. Aguarde o usuario mandar `commit` antes de commitar.
5. Em `docs-SEP`, nao fazer commit automatico; o git da documentacao e manual.

**Pre-requisitos globais**:
- F-Sprint 10 concluida ou em fechamento, pois o Epic 17 foi planejado para rodar apos ela.
- Alinhamento com a F-Sprint 14 para manter tokens e nomenclatura consistentes entre web e mobile.
- `sep-mobile` com M-Sprints 0-5 entregues.
- Nenhuma M-Sprint funcional da Fase 3 (M-6 a M-11) iniciada sem decisao explicita de aceitar retrabalho visual.
- Node/npm do repo mobile funcionando.
- Acesso ao documento [`docs-sep/New Design System Sep.md`](<../../docs-sep/New Design System Sep.md>).
- Conhecimento dos arquivos atuais de design mobile Notion (`src/styles/*`, `src/theme/variables.scss`, `src/global.scss`).

**Fora de escopo durante estes steps**:
- Telas funcionais novas de onboarding, credito, formalizacao, cobranca, credora ou Pix.
- Backend, contratos REST, MSW de regra de negocio e autorizacao.
- Backoffice/financeiro/admin no mobile.
- Build nativo Android/iOS.
- Troca de stack para Tailwind/shadcn.

---

## Task M-12.0 - Prechecks da M-Sprint 12

**Objetivo**: confirmar estado do repo, baseline e fontes documentais antes de mexer em design.

**Esforco**: 30-45 min.

### Step 212.0.1 - Conferir branch e status Git

**Comandos**:
```bash
cd <sep-mobile-root>
git status --short --branch
git rev-parse --abbrev-ref HEAD
git log --oneline -10
```

**Verificacao**:
- Branch criada a partir de `develop` atualizado.
- Working tree limpo ou alteracoes locais identificadas como do usuario.
- Nenhuma alteracao de sprint anterior sem owner claro.

### Step 212.0.2 - Criar branch da sprint

**Comandos**:
```bash
cd <sep-mobile-root>
git switch develop
git pull --ff-only
git switch -c feature/msprint-12-new-design-system-mobile
```

**Verificacao**:
- Branch `feature/msprint-12-new-design-system-mobile` ativa.
- Se `git pull --ff-only` falhar, parar e avisar o usuario.

### Step 212.0.3 - Confirmar baseline do projeto

**Comandos**:
```bash
cd <sep-mobile-root>
node -v
npm -v
npm run lint
npm run lint:scss
npm run test
npm run build
```

**Verificacao**:
- Baseline verde antes das alteracoes.
- Qualquer falha preexistente deve ser registrada antes de mudar SCSS/componentes.

### Step 212.0.4 - Confirmar fontes de design

**Comandos**:
```bash
cd <docs-sep-root>
test -f "docs-sep/New Design System Sep.md"
test -f "specs/fase-3/212-msprint-12-new-design-system-mobile.md"
test -f "steps-fase-3/mobile/212-msprint-12-steps.md"
```

**Verificacao**:
- Documento novo de design localizado.
- Spec e steps da M-Sprint 12 localizados.

### Definicao de pronto da Task M-12.0
- [ ] Branch correta.
- [ ] Baseline registrada.
- [ ] Fonte de design confirmada.
- [ ] Escopo sem troca de stack confirmado.

### Commit Task M-12.0
Nao gera commit; apenas validacao.

---

## Task M-12.1 - Auditoria visual e plano de migracao

**Objetivo**: mapear todos os pontos onde o Notion mobile aparece no `sep-mobile` e definir a estrategia de substituicao sem quebrar as telas existentes.

**Pre-requisito**: Task M-12.0 concluida.

**Esforco**: 0,5 dia.

### Step 212.1.1 - Inventariar arquivos de estilo atuais

**Comandos**:
```bash
cd <sep-mobile-root>
find src -maxdepth 5 -type f | sort
grep -R "notion\\|Notion\\|--notion\\|ion-color\\|theme-transition\\|dark" -n src
```

**Verificacao**:
- Lista de arquivos de tokens, mixins, variaveis Ionic, globals e componentes afetados.
- Separar o que e token global do que e estilo local de tela.

### Step 212.1.2 - Mapear telas e componentes existentes

**Comandos**:
```bash
cd <sep-mobile-root>
find src/app/features -maxdepth 6 -type f | sort
find src/app/layout -maxdepth 6 -type f | sort
find src/app/shared -maxdepth 6 -type f | sort
```

**Verificacao**:
- Telas publicas existentes identificadas.
- Shell autenticado/tabs/stack identificados.
- Showcase atual identificado, se existir.

### Step 212.1.3 - Comparar design novo contra o Notion mobile atual

**Implementacao**:
- Criar nota curta no PR description temporario ou no checkpoint da task com:
  - tokens a substituir;
  - componentes a migrar;
  - telas impactadas;
  - riscos de regressao visual;
  - decisoes que exigiriam ADR.
- Nao criar arquivo documental temporario no repo se nao for necessario.

**Pontos obrigatorios da comparacao**:
- Paleta HSL nova (`--background`, `--primary`, `--secondary`, `--success`, `--warning`, `--destructive`, `--devolutiva`).
- Dark mode novo.
- Raios `0.75rem` e derivacoes.
- Sombras `--shadow-sm/md/lg/card/elegant/glow`.
- Header `h-14`, superficies `bg-card`, painel de pagina e cards.
- Componentes base: botoes, badges, inputs, tabs, tabelas/listas, dialogs/dropdowns, skeleton/loading.

### Step 212.1.4 - Definir nomes de arquivos e estrategia de compatibilidade

**Direcao recomendada**:
- Criar novos arquivos com prefixo `_sep-ds-*` ou `_new-design-system-*`.
- Evitar manter novos tokens com prefixo `notion`.
- Remover imports Notion somente depois de a nova camada compilar.
- Se houver muitas classes antigas em templates, criar aliases temporarios apenas se reduzirem risco de migracao.

**Verificacao**:
- Plano nao exige alterar fluxo funcional.
- Plano nao exige instalar Tailwind/shadcn.
- Plano permite rollback por commit.

### Definicao de pronto da Task M-12.1
- [ ] Arquivos/telas impactados mapeados.
- [ ] Decisao de nomes dos novos tokens definida.
- [ ] Riscos registrados no checkpoint.
- [ ] Nenhuma alteracao funcional feita.

### Commit sugerido
```text
chore(mobile): mapear migracao para new design system
```

---

## Task M-12.2 - Tokens HSL, dark mode e Ionic variables

**Objetivo**: criar a base visual global do New Design System SEP no mobile, mapeando os tokens do documento de origem para SCSS/CSS variables e para Ionic.

**Pre-requisito**: Task M-12.1 concluida.

**Esforco**: 1 dia.

### Step 212.2.1 - Criar arquivo de tokens do New Design System SEP

**Arquivos provaveis**:
- `<sep-mobile-root>/src/styles/_sep-design-system-tokens.scss`
- `<sep-mobile-root>/src/styles/index.scss`

**Implementacao**:
- Transcrever os tokens `:root` do documento de origem como CSS custom properties.
- Transcrever o bloco `.dark`.
- Preservar HSL no formato `--primary: 213 58% 43%`.
- Expor helpers SCSS minimos apenas se o projeto ja usa mixins para tokens.
- Adicionar tokens de sombra e transicao:
  - `--shadow-sm`
  - `--shadow-md`
  - `--shadow-lg`
  - `--shadow-card`
  - `--shadow-elegant`
  - `--shadow-glow`
  - `--transition-smooth`

**Verificacao**:
- Nenhum token novo usa prefixo `notion`.
- Light e dark mode existem no mesmo arquivo.
- O arquivo compila com Stylelint.

### Step 212.2.2 - Mapear tokens para Ionic

**Arquivo provavel**:
- `<sep-mobile-root>/src/theme/variables.scss`

**Implementacao**:
- Mapear `--ion-background-color` para `hsl(var(--background))`.
- Mapear `--ion-text-color` para `hsl(var(--foreground))`.
- Mapear cores Ionic principais para `primary`, `secondary`, `success`, `warning`, `destructive`.
- Ajustar toolbar, tab bar, item, card e input para usar `background`, `card`, `border`, `muted` e `ring`.
- Manter compatibilidade com componentes Ionic existentes.

**Verificacao**:
- `ion-button color="primary"` usa azul novo.
- `ion-button color="secondary"` usa verde novo.
- Estados `success`, `warning` e `danger` continuam acessiveis.
- Dark mode nao deixa toolbar/tab bar com fundo incorreto.

### Step 212.2.3 - Atualizar estilos globais

**Arquivo provavel**:
- `<sep-mobile-root>/src/global.scss`

**Implementacao**:
- Atualizar `body` para `bg-background` equivalente via CSS variables.
- Aplicar transicoes globais de tema para superficies, texto, borda, svg, inputs e botoes.
- Definir fundo geral frio claro e superficie de pagina com `card`.
- Manter imports padrao do Ionic.
- Remover dependencia ativa de mixins Notion, se a nova camada ja cobrir equivalentes.

**Verificacao**:
- App abre sem flash visual quebrado.
- Scroll, safe area e teclado virtual continuam respeitados.
- Sem seletor global que quebre componentes Ionic internos.

### Step 212.2.4 - Remover ou isolar tokens Notion antigos

**Implementacao**:
- Remover imports Notion que deixaram de ser usados.
- Se algum arquivo antigo ainda for necessario para compatibilidade, marcar como legado em comentario curto e abrir pendencia para remocao.
- Nao deixar `Notion` como fonte visual vigente em docs/comentarios novos.

**Verificacao**:
- `grep -R "notion\\|Notion\\|--notion" -n src` mostra apenas legado justificado ou nada.
- `npm run lint:scss` passa.

### Definicao de pronto da Task M-12.2
- [ ] Tokens light/dark implementados.
- [ ] Ionic variables mapeadas.
- [ ] Globals migrados.
- [ ] Notion antigo removido ou isolado como legado.
- [ ] `npm run lint:scss` passa.

### Commit sugerido
```text
feat(mobile): adicionar tokens do new design system
```

---

## Task M-12.3 - Componentes base e estados globais

**Objetivo**: migrar os componentes primarios para o novo visual sem alterar comportamento.

**Pre-requisito**: Task M-12.2 concluida.

**Esforco**: 1-1,5 dia.

### Step 212.3.1 - Migrar botoes e icon buttons

**Arquivos provaveis**:
- `<sep-mobile-root>/src/styles/_sep-design-system-components.scss`
- templates/componentes que usam classes antigas.

**Implementacao**:
- Base:
  - inline/flex center;
  - gap entre icone e texto;
  - raio `md`;
  - foco visivel com `ring`;
  - disabled com opacidade e sem pointer events.
- Variantes:
  - primary/default;
  - secondary;
  - outline;
  - ghost;
  - destructive;
  - icon.
- Tamanhos:
  - default touch target >= 44px;
  - small sem ficar abaixo de 40px em mobile;
  - icon com dimensao estavel.

**Verificacao**:
- Botoes com icone nao mudam layout ao carregar.
- Texto nao estoura em viewport mobile.
- Foco por teclado continua visivel em PWA.

### Step 212.3.2 - Migrar formularios, inputs e filtros segmentados

**Implementacao**:
- Inputs com borda `border/input`, `bg-background`, `placeholder muted`, foco em `ring`.
- Labels com `text-sm font-medium text-muted-foreground` equivalente.
- Mensagens de erro em destructive.
- Filtros segmentados com fundo `muted/30`, borda e botoes compactos.
- Preservar integracao com Angular Reactive Forms existente.

**Verificacao**:
- Campos seguem contraste minimo.
- Erros de validacao continuam legiveis.
- Teclado virtual nao cobre CTA principal sem possibilidade de scroll.

### Step 212.3.3 - Migrar cards, badges, listas e empty states

**Implementacao**:
- Card base: `rounded-lg border bg-card text-card-foreground shadow-sm`.
- Cards de metrica/atalho podem usar `shadow-md`, hover/tap sutil e icone em bloco colorido.
- Badges com raio pill, borda opcional e variantes semanticamente corretas.
- Listas densas com hover/tap `muted/30` ou `muted/50`.
- Empty states sem texto educativo longo.

**Verificacao**:
- Nao criar cards dentro de cards.
- Cards possuem altura/espacamento estavel.
- Badges nao quebram texto de status.

### Step 212.3.4 - Migrar dialogs, dropdowns, toasts, loaders e skeletons

**Implementacao**:
- Dialog/sheet mobile com overlay escuro, `bg-background`, borda, sombra e animacao curta.
- Dropdown/popover com `bg-popover`, borda, sombra e itens com foco/hover.
- Toasts usando semantic colors.
- Loader com `animate-spin` equivalente em SCSS.
- Skeleton com `animate-pulse` equivalente.

**Verificacao**:
- Dialog respeita safe areas.
- Toast nao cobre botoes de navegacao essenciais.
- Skeleton nao causa layout shift relevante.

### Step 212.3.5 - Garantir dark mode nos componentes base

**Implementacao**:
- Validar `.dark` em body/root conforme padrao existente do app.
- Corrigir componentes com cores hardcoded.
- Preferir `hsl(var(--token))` a hex em CSS novo.

**Verificacao**:
- Light/dark trocam sem perder contraste.
- SVGs e icones herdam cor correta.
- Nenhuma cor antiga Notion domina a UI.

### Definicao de pronto da Task M-12.3
- [ ] Componentes base migrados.
- [ ] Estados globais migrados.
- [ ] Dark mode validado.
- [ ] `npm run lint`, `npm run lint:scss` e `npm run test` passam.

### Commit sugerido
```text
feat(mobile): migrar componentes base para new design system
```

---

## Task M-12.4 - Shell, navegacao e telas existentes

**Objetivo**: aplicar o novo design nas superficies reais existentes do app mobile.

**Pre-requisito**: Task M-12.3 concluida.

**Esforco**: 1-1,5 dia.

### Step 212.4.1 - Migrar shell mobile autenticado

**Arquivos provaveis**:
- `<sep-mobile-root>/src/app/layout/mobile-tabs/*`
- `<sep-mobile-root>/src/app/layout/stack-shell/*`
- `<sep-mobile-root>/src/app/app.component.*`

**Implementacao**:
- Header mobile inspirado no padrao:
  - altura proxima de `h-14`;
  - borda inferior;
  - fundo `background`/`card`;
  - marca SEP clara;
  - subtitulo curto apenas se ja existir espaco.
- Tabs inferiores:
  - superficie `card`;
  - borda superior `border`;
  - item ativo com `primary`;
  - labels curtos.
- Stack navigation:
  - back button iconico;
  - titulo compacto;
  - area de conteudo com padding mobile.

**Verificacao**:
- Navegacao por tabs continua funcionando.
- Header nao ocupa excesso de viewport.
- Areas clicaveis >= 44px.

### Step 212.4.2 - Migrar telas publicas existentes

**Arquivos provaveis**:
- `<sep-mobile-root>/src/app/features/public/**`

**Implementacao**:
- Splash/boas-vindas/login/cadastro devem usar:
  - fundo frio claro;
  - cards brancos apenas quando forem superficies reais de formulario;
  - botoes primary/outline;
  - campos e erros migrados.
- Nao transformar landing mobile em marketing page longa.
- Nao usar copy `SimpliClin`.

**Verificacao**:
- Login/cadastro continuam chamando os mesmos services.
- MSW/dev-offline continua funcionando.
- Em 360px de largura, textos nao estouram.

### Step 212.4.3 - Migrar telas autenticadas existentes

**Arquivos provaveis**:
- `<sep-mobile-root>/src/app/features/tomador/**`
- `<sep-mobile-root>/src/app/features/credora/**`
- `<sep-mobile-root>/src/app/features/authenticated/**`, se existir.

**Implementacao**:
- Home do tomador e da credora usam quick actions em grid mobile.
- Cards de status/atalhos usam cores semanticas novas.
- Perfil e alterar senha usam formularios novos.
- Estados loading/error/empty usam componentes migrados.

**Verificacao**:
- Nenhuma permissao/role muda.
- Nenhum endpoint novo e chamado.
- UI continua focada em tomador/credora.

### Step 212.4.4 - Remover classes locais antigas substituidas

**Implementacao**:
- Eliminar duplicacoes de SCSS local que agora estao em componentes/tokens globais.
- Manter estilos locais apenas para layout especifico de tela.
- Evitar refactor de TypeScript sem relacao visual.

**Verificacao**:
- Reducao ou neutralidade de duplicacao visual.
- Componentes nao dependem de seletor global fragil.

### Definicao de pronto da Task M-12.4
- [ ] Shell migrado.
- [ ] Telas publicas existentes migradas.
- [ ] Telas autenticadas existentes migradas.
- [ ] Nenhuma mudanca funcional indevida.
- [ ] `npm run test` passa.

### Commit sugerido
```text
feat(mobile): aplicar new design system nas telas existentes
```

---

## Task M-12.5 - Showcase, regressao visual e smoke PWA

**Objetivo**: validar o novo design de forma inspecionavel e automatizar o minimo contra regressao visual/funcional.

**Pre-requisito**: Task M-12.4 concluida.

**Esforco**: 1 dia.

### Step 212.5.1 - Atualizar showcase de design system

**Arquivos provaveis**:
- `<sep-mobile-root>/src/app/features/design-system/**`

**Implementacao**:
- Showcase deve cobrir:
  - paleta light/dark;
  - tipografia;
  - botoes;
  - inputs/formularios;
  - badges/status;
  - cards/listas;
  - dialogs/toasts;
  - loaders/skeletons;
  - tabs/navegacao.
- Se houver graficos no app mobile atual, documentar padrao inspirado em `recharts` sem adicionar biblioteca nova sem demanda real.

**Verificacao**:
- Showcase renderiza em viewport Pixel 5/360px.
- Sem dependencia de dados reais.

### Step 212.5.2 - Atualizar testes unitarios

**Comandos**:
```bash
cd <sep-mobile-root>
npm run test -- --run
```

**Implementacao**:
- Ajustar queries que dependiam de textos/classes removidas.
- Cobrir:
  - existencia do shell;
  - render de login/home/perfil;
  - showcase definido/renderizavel conforme padrao do repo;
  - dark mode se ja houver mecanismo testavel.

**Verificacao**:
- Testes nao dependem de cor computada em happy-dom quando isso for instavel.
- Evitar snapshots grandes e frageis.

### Step 212.5.3 - Atualizar smoke PWA/Playwright

**Comandos**:
```bash
cd <sep-mobile-root>
npm run e2e
```

**Cenarios minimos**:
- App carrega em viewport mobile.
- Login/boas-vindas visiveis.
- Shell autenticado abre com MSW/dev-offline, se o repo ja tiver esse fluxo.
- Showcase abre sem tela em branco.

**Verificacao visual manual**:
- Sem texto sobreposto.
- Sem overflow horizontal.
- Cards/botoes com tap target adequado.
- Dark mode, se disponivel, sem contraste quebrado.

### Step 212.5.4 - Rodar suite final da sprint

**Comandos**:
```bash
cd <sep-mobile-root>
npm run lint
npm run lint:scss
npm run test
npm run build
```

**Verificacao**:
- Suite verde.
- Warnings preexistentes registrados.
- Build PWA gera output esperado (`www/` ou equivalente do repo).

### Definicao de pronto da Task M-12.5
- [ ] Showcase atualizado.
- [ ] Testes ajustados.
- [ ] Smoke PWA validado.
- [ ] Suite final verde ou falha preexistente documentada.

### Commit sugerido
```text
test(mobile): validar new design system no pwa
```

---

## Task M-12.6 - Docs, fechamento e checkpoint final

**Objetivo**: atualizar documentacao operacional e fechar a sprint com estado rastreavel.

**Pre-requisito**: Task M-12.5 concluida.

**Esforco**: 0,5 dia.

### Step 212.6.1 - Atualizar doc operacional do `sep-mobile`

**Arquivo provavel**:
- `<docs-sep-root>/repos/sep-mobile/README.md`

**Implementacao**:
- Registrar que o design system vigente do mobile passa a ser [`New Design System Sep.md`](<../../docs-sep/New Design System Sep.md>).
- Registrar que Notion mobile virou legado historico.
- Registrar onde ficam tokens, variaveis Ionic, componentes base e showcase no repo.
- Registrar comandos de validacao visual.

### Step 212.6.2 - Atualizar PRD/roadmap se necessario

**Arquivos provaveis**:
- `<docs-sep-root>/docs-sep/PRD-FASE-3.md`
- `<docs-sep-root>/docs-sep/MOBILE-SCREENS-PLAN.md`
- `<docs-sep-root>/AI-ROADMAP.md`

**Implementacao**:
- Marcar M-Sprint 12 conforme status real.
- Atualizar qualquer mencao ativa que ainda diga que o mobile deve usar Notion como design vigente.
- Nao reescrever historico de sprints concluidas; registre apenas a mudanca de direcao visual.

### Step 212.6.3 - Capturar resumo de fechamento

**Conteudo do resumo**:
- Branch e commits.
- Arquivos principais alterados.
- Decisoes tomadas.
- Checks executados e resultados.
- Pendencias conhecidas.
- Screenshots ou observacoes manuais de viewport, se aplicavel.

### Step 212.6.4 - Checkpoint final da sprint

**Comandos**:
```bash
cd <sep-mobile-root>
git status --short
git log --oneline -5
```

**Pausa obrigatoria**:
- Aguardar revisao manual do usuario.
- Nao iniciar M-Sprint seguinte sem ordem explicita.

### Definicao de pronto da Task M-12.6
- [ ] Docs atualizados.
- [ ] Resumo de fechamento preparado.
- [ ] Workspace limpo ou alteracoes pendentes explicadas.
- [ ] Usuario liberou proxima sprint explicitamente.

### Commit sugerido
```text
docs(mobile): registrar new design system mobile
```

---

## Checklist final da M-Sprint 12

- [ ] New Design System SEP e fonte visual vigente do `sep-mobile`.
- [ ] Tokens HSL light/dark implementados.
- [ ] Ionic variables mapeadas.
- [ ] Componentes base migrados.
- [ ] Shell e telas existentes migrados.
- [ ] Showcase atualizado.
- [ ] Sem strings/branding `SimpliClin` como produto final.
- [ ] Sem Tailwind/shadcn/React adicionados sem ADR.
- [ ] Sem regra de negocio nova no app.
- [ ] `npm run lint` verde.
- [ ] `npm run lint:scss` verde.
- [ ] `npm run test` verde.
- [ ] `npm run build` verde.
- [ ] Smoke PWA/mobile validado.
- [ ] Docs e indices atualizados.
