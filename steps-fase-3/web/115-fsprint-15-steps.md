# Steps - F-Sprint 15 - Aplicacao do New Design System Web

**Spec de origem**: [`specs/fase-3/115-fsprint-15-aplicacao-design-system-web.md`](../../specs/fase-3/115-fsprint-15-aplicacao-design-system-web.md)

**Objetivo geral**: aplicar a riqueza visual do New Design System SEP nas telas de login, registro e dashboard e no shell autenticado do `sep-app`, mantendo Angular/SCSS, preservando contratos de API e sem introduzir regra de negocio no frontend. A F-14 ja entregou os tokens; esta sprint adiciona os primitivos que faltam e os **aplica**.

**Esforco total estimado**: 3-4 dias.

**Repo de destino**: `sep-app`.

**Localizacao do projeto web**: `<sep-app-root>/`.

**Nota de numeracao**:
- `F-15` e o proximo ID web livre apos a F-Sprint 14.
- A sprint executa apos a F-Sprint 14 (design system) ja mergeada em `develop`.
- Nao depende de F-11/F-12/F-13; e puramente visual sobre telas existentes.

**Decisao de arquitetura da sprint**:
- A base visual (tokens HSL, gradientes, sombras, mixins de botao/card/input) ja existe em `src/styles/_sep-ds-*.scss`.
- Esta sprint **nao recria tokens**; adiciona mixins e um token de raio, e aplica nas telas.
- Adicionar `lucide-angular` como biblioteca de icones. Nao instalar Tailwind, shadcn/ui, Radix, React, `next-themes` ou `framer-motion` sem ADR aprovada.

**Lembrete de marca**:
- `SimpliClin`/`TeaAgenda` no design de origem sao referencia de outro produto.
- O app continua SEP; marca = texto `SEP` + gradiente da propria paleta. Nao importar logo/assets de terceiro como identidade final.

**Ordem de execucao recomendada**:

```text
(prechecks: branch + baseline)
   |
   v
F-15.0 (fundacao: lucide-angular + radius-xl + mixins)
   |
   v
F-15.1 (login + registro: painel de marca)
   |
   v
F-15.2 (dashboard: acesso rapido + jornadas + header sticky)
   |
   v
F-15.3 (shell: sidenav + header)
   |
   v
F-15.4 (showcase + testes + docs)
```

**Como usar este arquivo**:
1. Execute as tasks na ordem.
2. Ao fim de cada task de implementacao, pare em checkpoint pre-commit.
3. Informe arquivos alterados, verificacoes executadas, riscos e mensagem de commit sugerida.
4. Aguarde o usuario mandar `commit` antes de commitar.
5. Em `docs-SEP`, nao fazer commit automatico; o git da documentacao e manual.

**Pre-requisitos globais**:
- F-Sprint 14 concluida e mergeada em `develop` (tokens `_sep-ds-*` presentes).
- Branch da sprint criada a partir de `develop` atualizado com `git pull --ff-only`: `feature/fsprint-15-aplicacao-design-system`.
- Baseline verde (`lint`, `lint:scss`, `test`, `build`) registrada antes de alterar; falhas preexistentes anotadas (ver nota da F-14 sobre specs de `/register`).
- Node/npm do repo web funcionando.
- Bundle de referencia visual disponivel (handoff `SimpliClin Design System`): `ui_kits/admin/index.html`, `ui_kits/landing/index.html`, `components/core/*.prompt.md`.

**Fora de escopo durante estes steps**:
- Telas funcionais novas de credora, governanca ou Pix.
- Backend, contratos REST, MSW de regra de negocio e autorizacao.
- Mudanca de stack para Tailwind/shadcn/React.
- Metricas/numeros fabricados no dashboard.
- Rebranding final ou import de logo de terceiro.

---

## Task F-15.0 - Fundacao: icones e primitivos visuais

**Objetivo**: preparar a biblioteca de icones e os mixins SCSS reutilizaveis que as telas vao consumir.

**Pre-requisito**: branch criada e baseline verde.

**Esforco**: 0,5 dia.

### Step 115.0.1 - Adicionar lucide-angular

**Comandos**:
```bash
cd <sep-app-root>
npm install lucide-angular
```

**Implementacao**:
- Registrar `LucideAngularModule` na composicao de icones (app config / modulo compartilhado), expondo um set curado: `users`, `user`, `user-check`, `file-text`, `bar-chart-3`, `calendar`, `shield`, `credit-card`, `wallet`, `banknote`, `settings`, `lock`, `arrow-right`, `check-circle`, `log-out`, `moon`, `sun`, `menu`, `chevron-down`.
- Nao importar o pacote inteiro de icones; importar apenas os usados (tree-shaking).

**Verificacao**:
- `npm run build` resolve o pacote sem erro.
- Um icone de teste renderiza em uma tela existente.

### Step 115.0.2 - Adicionar token de raio de tile

**Arquivo**: `<sep-app-root>/src/styles/_sep-ds-tokens.scss`

**Implementacao**:
- Adicionar `--sep-radius-xl: 1rem;` (16px, tiles de acesso rapido), junto aos demais raios. Unico token faltante; nao alterar os existentes.

**Verificacao**:
- `npm run lint:scss` passa.

### Step 115.0.3 - Criar mixins base

**Arquivo**: `<sep-app-root>/src/styles/_sep-ds-components.scss`

**Implementacao** (consumindo tokens existentes, sem duplicar paleta/sombra):
- `sep-icon-chip($tone)`: chip de icone colorido — `background: hsl(var(#{$tone}) / 12%)`, `color: hsl(var(#{$tone}))`, raio `md`, dimensao fixa centralizada.
- `sep-quick-tile`: tile de acesso rapido — coluna centralizada, raio `xl`, fundo translucido por tom, hover `translateY(-2px)` + sombra; compoe `sep-icon-chip`.
- `sep-button-gradient`: CTA de destaque — compoe `sep-button-base`, `background: var(--gradient-primary)`, texto claro, hover com `--shadow-md`/brilho sutil.
- `sep-auth-brand-panel`: painel lateral de marca — `background: var(--gradient-primary)`, texto claro, espacamento para wordmark, tagline e selos.

**Verificacao**:
- `npm run lint:scss` passa.
- Mixins compilam quando referenciados.

### Definicao de pronto da Task F-15.0
- [ ] `lucide-angular` instalado e set de icones registrado.
- [ ] Token `--sep-radius-xl` adicionado.
- [ ] Mixins `sep-icon-chip`, `sep-quick-tile`, `sep-button-gradient`, `sep-auth-brand-panel` criados.
- [ ] `npm run lint:scss` e `npm run build` passam.

### Commit sugerido
```text
feat(web): adicionar icones lucide e primitivos visuais do design system
```

---

## Task F-15.1 - Login e registro (painel de marca + formulario)

**Objetivo**: dar presenca de marca e cor combinada as telas publicas, sem alterar a logica de autenticacao/cadastro.

**Pre-requisito**: Task F-15.0 concluida.

**Esforco**: 0,5-1 dia.

### Step 115.1.1 - Redesenhar login

**Arquivos**:
- `<sep-app-root>/src/app/features/public/login/login.component.html`
- `<sep-app-root>/src/app/features/public/login/login.component.scss`

**Implementacao**:
- Layout 2 colunas: `sep-auth-brand-panel` a esquerda (wordmark `SEP`, tagline curta, 2-3 selos com `check-circle`) + card de formulario a direita.
- CTA de submit com `sep-button-gradient`.
- Manter `FormGroup`, validacoes, `errorMessage()`, `routerLink` e atributos ARIA exatamente como estao.
- Responsivo: abaixo do breakpoint, empilhar (painel vira faixa superior compacta).

**Verificacao**:
- Login chama o mesmo service; nenhum atributo de form removido.
- `*.component.spec.ts` do login passa (ajustar apenas seletores visuais se necessario).

### Step 115.1.2 - Redesenhar registro

**Arquivos**:
- `<sep-app-root>/src/app/features/public/register/register.component.html`
- `<sep-app-root>/src/app/features/public/register/register.component.scss`

**Implementacao**:
- Mesmo layout painel + formulario do login.
- Estilizar o `<select>` de perfil de forma consistente (altura 40px, borda `input`, chevron, focus ring azul).
- Preservar validacoes (e-mail, senha, perfil) e mensagens.

**Verificacao**:
- Cadastro continua chamando o mesmo endpoint.
- Mobile viewport sem overflow.

### Definicao de pronto da Task F-15.1
- [ ] Login e registro com painel de marca + formulario.
- [ ] CTA gradiente e focus ring azul aplicados.
- [ ] Nenhuma mudanca de logica/contrato.
- [ ] `npm run test`, `npm run lint:scss` passam.

### Commit sugerido
```text
feat(web): redesenhar login e registro com painel de marca
```

---

## Task F-15.2 - Dashboard (acesso rapido + jornadas + header sticky)

**Objetivo**: transformar o dashboard plano na superficie principal rica, usando apenas conteudo real.

**Pre-requisito**: Task F-15.1 concluida.

**Esforco**: 0,5-1 dia.

### Step 115.2.1 - Enriquecer metadados de conteudo

**Arquivo**: `<sep-app-root>/src/app/features/authenticated/dashboard/dashboard.component.ts`

**Implementacao**:
- Adicionar a cada atalho/placeholder os campos `icon` (nome lucide) e `tone` (token de cor por dominio), sem alterar `route`, `label` ou `description` reais.
- Nenhuma chamada de API nova; nenhum numero/metrica.

**Verificacao**:
- Lista de atalhos continua derivada da mesma fonte (signals/role-gating intactos).

### Step 115.2.2 - Aplicar layout rico

**Arquivos**:
- `<sep-app-root>/src/app/features/authenticated/dashboard/dashboard.component.html`
- `<sep-app-root>/src/app/features/authenticated/dashboard/dashboard.component.scss`

**Implementacao**:
- Header sticky translucido (`backdrop-filter: blur`, `color-mix(in srgb, hsl(var(--background)) 92%, transparent)`), saudacao + badge de role (ja existe).
- Secao "Acesso Rapido": grid de `sep-quick-tile`, um por atalho real, colorido por `tone`, com icone lucide.
- Secao "Proximas jornadas": cards com `sep-icon-chip` + badge "Em preparacao" (mantem o estado real de placeholder).

**Verificacao**:
- Dashboard navegavel; role-gating preservado.
- Nenhuma metrica fabricada na tela.

### Definicao de pronto da Task F-15.2
- [ ] Header sticky aplicado.
- [ ] Atalhos como tiles coloridos com icone.
- [ ] Jornadas com chips, sem dados fabricados.
- [ ] `npm run test` passa.

### Commit sugerido
```text
feat(web): redesenhar dashboard com acesso rapido e header sticky
```

---

## Task F-15.3 - Shell (sidenav + header)

**Objetivo**: alinhar o frame autenticado ao novo visual para coerencia com o dashboard.

**Pre-requisito**: Task F-15.2 concluida.

**Esforco**: 0,5-1 dia.

### Step 115.3.1 - Polir sidenav

**Arquivos**:
- `<sep-app-root>/src/app/layout/sidenav/sidenav.component.html`
- `<sep-app-root>/src/app/layout/sidenav/sidenav.component.scss`

**Implementacao**:
- Ler o arquivo atual antes de editar.
- Nav agrupada com group-labels (uppercase, `tracking-wide`, muted), item ativo com icone azul + wash `accent` (reusar `sep-nav-link`/`sep-nav-link-active`).
- Marca `SEP` no topo; rodape de usuario (avatar/nome/role) sem logo de terceiro.

**Verificacao**:
- Navegacao por role inalterada.
- Sidenav colapsavel (se existir) nao quebra.

### Step 115.3.2 - Polir header

**Arquivos**:
- `<sep-app-root>/src/app/layout/header/header.component.html`
- `<sep-app-root>/src/app/layout/header/header.component.scss`

**Implementacao**:
- Header sticky translucido + blur, altura `--header-height`.
- Toggle de tema usando o `ThemeService` existente (sem nova logica de preferencia).

**Verificacao**:
- Toggle de tema continua funcionando.
- Shell coerente com o dashboard em light e dark.

### Definicao de pronto da Task F-15.3
- [ ] Sidenav agrupada com item ativo destacado.
- [ ] Header sticky com toggle de tema.
- [ ] Specs do layout passam.

### Commit sugerido
```text
feat(web): polir shell autenticado (sidenav e header)
```

---

## Task F-15.4 - Showcase, testes e docs

**Objetivo**: documentar os novos primitivos, garantir verde automatizado e atualizar docs operacionais.

**Pre-requisito**: Task F-15.3 concluida.

**Esforco**: 0,5 dia.

### Step 115.4.1 - Atualizar showcase/design-system

**Arquivos**:
- `<sep-app-root>/src/app/features/design-system/**`

**Implementacao**:
- Demonstrar `sep-quick-tile`, `sep-icon-chip`, `sep-button-gradient` e `sep-auth-brand-panel`, em light e dark.

**Verificacao**:
- Showcase renderiza em desktop e mobile viewport, sem dados reais.

### Step 115.4.2 - Atualizar testes

**Comandos**:
```bash
cd <sep-app-root>
npm run test
npm run e2e
```

**Implementacao**:
- Ajustar seletores que dependiam de marcacao removida; cobrir render de login/registro/dashboard/sidenav.
- Manter smoke Playwright; registrar falhas preexistentes (specs de `/register` ja documentados na F-14).

### Step 115.4.3 - Rodar suite final

**Comandos**:
```bash
cd <sep-app-root>
npm run lint
npm run lint:scss
npm run test
npm run build
```

**Verificacao**:
- Suite verde ou falhas preexistentes registradas.

### Step 115.4.4 - Varredura de dependencias nao usadas

**Objetivo**: apos as atualizacoes de pacote da sprint (inclusao de `lucide-angular` e o experimento descartado com `@lucide/angular`), garantir que nao sobraram libs orfas em `package.json`/`package-lock.json`.

**Comandos**:
```bash
cd <sep-app-root>
npx depcheck
```

**Implementacao**:
- Confirmar que `@lucide/angular` (experimento revertido) nao permaneceu em `package.json` nem no lock.
- Validar cada item apontado pelo `depcheck` antes de remover: descartar falsos positivos (`@types/*`, plugins de build/test, libs usadas apenas em configuracao ou via CLI). Remover apenas dependencias comprovadamente sem uso, com `npm uninstall <pkg> --legacy-peer-deps`.
- Nao remover dependencia de runtime sem confirmar, via `grep`, que nenhum `import`/uso existe em `src`.
- Registrar no checkpoint o que foi removido e o que foi mantido com justificativa.

**Verificacao**:
- `npx depcheck` sem dependencias nao usadas relevantes (ou pendencias justificadas e registradas).
- `npm run lint`, `npm run lint:scss`, `npm run test` e `npm run build` continuam verdes apos as remocoes.

### Step 115.4.5 - Atualizar docs operacionais

**Arquivos**:
- `<docs-sep-root>/repos/sep-app/DESIGN-SYSTEM.md`
- `<docs-sep-root>/repos/sep-app/README.md`
- `<docs-sep-root>/AI-ROADMAP.md`

**Implementacao**:
- Registrar os novos primitivos e onde ficam.
- Atualizar status da F-Sprint 15.
- Criar `repos/sep-app/SPRINT-F-15-PR.md` (formato espelhando `SPRINT-F-13-PR.md`).

### Definicao de pronto da Task F-15.4
- [ ] Showcase cobre os novos primitivos.
- [ ] Testes e build executados.
- [ ] Varredura de dependencias nao usadas (`depcheck`) feita; `@lucide/angular` confirmado removido; remocoes validadas com suite verde.
- [ ] Docs e indices atualizados.
- [ ] Resumo de fechamento preparado.

### Commit sugerido
```text
docs(web): registrar aplicacao do design system na f-sprint 15
```

---

## Checklist final da F-Sprint 15

- [ ] Login/registro com painel de marca SEP, sem logo de terceiro.
- [ ] Dashboard com "Acesso Rapido" colorido, jornadas com chips e header sticky.
- [ ] Shell (sidenav + header) coerente com o dashboard.
- [ ] Botoes de destaque com cor/gradiente; chips de icone coloridos aplicados.
- [ ] `lucide-angular` adicionado; sem Tailwind/shadcn/React.
- [ ] Dependencias nao usadas auditadas (`depcheck`); `@lucide/angular` confirmado removido.
- [ ] Sem token/paleta recriado (reuso da base F-14).
- [ ] Sem metrica/numero fabricado no dashboard.
- [ ] Sem mudanca funcional, de contrato ou de autorizacao.
- [ ] Light/dark validados nas telas alteradas.
- [ ] `npm run lint` verde.
- [ ] `npm run lint:scss` verde.
- [ ] `npm run test` verde.
- [ ] `npm run build` verde.
- [ ] Smoke Playwright validado (falhas preexistentes documentadas).
- [ ] Docs e indices atualizados.
