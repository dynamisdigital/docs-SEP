# Steps - M-Sprint 12 - Aplicacao do New Design System Mobile

**Spec de origem**: [`specs/fase-3/212-msprint-12-new-design-system-mobile.md`](../../specs/fase-3/212-msprint-12-new-design-system-mobile.md)

**Sprint de referencia**: [`steps-fase-3/web/115-fsprint-15-steps.md`](../web/115-fsprint-15-steps.md). A F-Sprint 15 aplica visualmente o New Design System SEP no `sep-app`; esta M-Sprint 12 traduz a mesma melhoria para `sep-mobile` com Ionic/Angular/SCSS.

**Objetivo geral**: aplicar a riqueza visual do New Design System SEP nas superficies existentes do `sep-mobile` (splash/welcome, login/TOTP, registro, homes, shell/header/tabs e showcase), mantendo Ionic/Angular/Capacitor/SCSS, preservando contratos de API e sem introduzir regra de negocio no app. `Splash/welcome` sao o equivalente mobile da landing publica redesenhada na F-Sprint 15; nao criar rota landing separada sem necessidade real de produto.

**Esforco total estimado**: 3-4 dias.

**Repo de destino**: `sep-mobile`.

**Localizacao do projeto mobile**: `<sep-mobile-root>/`.

**Nota de ordem**:
- Apesar do ID `M-12`, executar antes das M-Sprints funcionais 6-11.
- A M-Sprint 6 (`206`, onboarding mobile) fica bloqueada ate a conclusao/validacao desta M-Sprint 12.
- A sprint substitui o plano antigo de "migracao generica" por uma aplicacao visual baseada na F-Sprint 15.
- Nao depende de telas futuras; atua sobre superficies ja existentes do mobile.

**Decisao de arquitetura da sprint**:
- O `sep-mobile` continua em Ionic + Angular + Capacitor + SCSS.
- A sprint nao recria stack nem copia implementacao web literalmente.
- O mobile ja usa Ionicons (`ionicons`). Preferir `ion-icon`/Ionicons em vez de instalar `lucide-angular`.
- Tailwind, shadcn/ui, Radix, React, `next-themes`, `framer-motion` ou biblioteca nova de icones exigem ADR/aprovacao explicita.
- Esta sprint adiciona/aplica primitivos visuais mobile: `sep-mobile-icon-chip`, `sep-mobile-quick-tile`, `sep-mobile-button-gradient`, `sep-mobile-auth-brand-panel`, header translucido e tabs mais expressivas.

**Lembrete de marca**:
- `SimpliClin`/`TeaAgenda` no design de origem sao referencia visual de outro produto.
- O app continua SEP; marca = texto `SEP`, gradiente/paleta propria e linguagem visual do design system.
- Nao importar logo/assets de terceiro como identidade final.

**Ordem de execucao recomendada**:

```text
(prechecks: branch + baseline)
   |
   v
M-12.0 (fundacao: auditoria + tokens/mixins mobile + Ionicons)
   |
   v
M-12.1 (publico: splash/welcome + login/TOTP + registro)
   |
   v
M-12.2 (homes: autenticada + tomador + credora)
   |
   v
M-12.3 (shell: header + tabs + estados)
   |
   v
M-12.4 (showcase + testes + depcheck + docs)
```

**Como usar este arquivo**:
1. Execute as tasks na ordem.
2. Ao fim de cada task de implementacao, pare em checkpoint pre-commit.
3. Informe arquivos alterados, verificacoes executadas, riscos e mensagem de commit sugerida.
4. Aguarde o usuario mandar `commit` antes de commitar.
5. Em `docs-SEP`, nao fazer commit automatico; o git da documentacao e manual.

**Pre-requisitos globais**:
- `sep-mobile/develop` atualizado.
- Branch sugerida: `feature/msprint-12-aplicacao-design-system-mobile`.
- M-Sprints 0-5 entregues como base tecnica mobile.
- Baseline verde (`lint`, `lint:scss`, `test`, `build`) registrada antes de alterar; falhas preexistentes anotadas.
- Node/npm do repo mobile funcionando.
- `New Design System Sep.md`, spec/steps 115 e spec/steps 212 lidos.
- Conhecimento dos arquivos atuais:
  - `src/styles/_notion-mobile-*`;
  - `src/theme/variables.scss`;
  - `src/global.scss`;
  - `src/app/features/public/**`;
  - `src/app/features/authenticated/**`;
  - `src/app/features/tomador/**`;
  - `src/app/features/credora/**`;
  - `src/app/layout/**`;
  - `src/app/features/design-system/**`.

**Fora de escopo durante estes steps**:
- Telas funcionais novas de onboarding, credito, formalizacao, cobranca, credora ou Pix.
- Backend, contratos REST, MSW de regra de negocio e autorizacao.
- Backoffice/financeiro/admin no mobile.
- Build nativo Android/iOS.
- Troca de stack para Tailwind/shadcn/React.
- Metricas/numeros fabricados em homes.
- Landing publica separada: no mobile, `splash/welcome` cobrem esse papel salvo spec futura.

---

## Task M-12.0 - Fundacao visual mobile

**Objetivo**: confirmar baseline, auditar a base visual existente e preparar os primitivos visuais mobile equivalentes aos da F-Sprint 15.

**Esforco**: 0,5-1 dia.

### Step 212.0.1 - Conferir branch e status Git

**Comandos**:
```bash
cd <sep-mobile-root>
git fetch --all --prune
git status --short --branch
git rev-list --left-right --count HEAD...origin/develop
git log --oneline -10 origin/develop
```

**Verificacao**:
- Branch local alinhada a `origin/develop`.
- Working tree limpo ou alteracoes locais identificadas como do usuario.
- Nenhuma alteracao de sprint anterior sem owner claro.

### Step 212.0.2 - Criar branch da sprint

**Comandos**:
```bash
cd <sep-mobile-root>
git switch develop
git pull --ff-only
git switch -c feature/msprint-12-aplicacao-design-system-mobile
```

**Verificacao**:
- Branch criada a partir de `develop` atualizado.
- Se `git pull --ff-only` falhar, parar e avisar o usuario.

### Step 212.0.3 - Registrar baseline

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
- Falhas preexistentes registradas antes de mudar SCSS/componentes.

### Step 212.0.4 - Auditar base visual atual

**Comandos**:
```bash
cd <sep-mobile-root>
find src/app/features src/app/layout src/styles src/theme -maxdepth 5 -type f | sort
grep -R "notion\\|Notion\\|--notion\\|ion-color\\|theme-transition\\|dark\\|ion-icon" -n src/app src/styles src/theme src/global.scss
```

**Verificacao**:
- Pontos Notion mobile identificados.
- Superficies reais listadas: splash/welcome, login/TOTP, registro, home autenticada, home tomador, home credora, perfil, biometria, step-up, header, shell, tabs e showcase.
- Confirmar que Ionicons ja atende os icones necessarios antes de propor nova dependencia.

### Step 212.0.5 - Criar primitivos visuais mobile

**Arquivos provaveis**:
- `<sep-mobile-root>/src/styles/_sep-mobile-ds-tokens.scss`
- `<sep-mobile-root>/src/styles/_sep-mobile-ds-components.scss`
- `<sep-mobile-root>/src/styles/index.scss`
- `<sep-mobile-root>/src/theme/variables.scss`

**Implementacao**:
- Reusar tokens existentes quando ja houver traducao do New Design System SEP.
- Adicionar somente tokens faltantes e justificados, por exemplo `--sep-radius-xl: 1rem`.
- Mapear tokens principais para Ionic quando fizer sentido: `--ion-color-primary`, `--ion-background-color`, `--ion-text-color`, `--ion-card-background`, `--ion-toolbar-background`.
- Criar mixins/classes base:
  - `sep-mobile-icon-chip($tone)`;
  - `sep-mobile-quick-tile`;
  - `sep-mobile-button-gradient`;
  - `sep-mobile-auth-brand-panel`;
  - `sep-mobile-surface-card`;
  - `sep-mobile-touch-state`.
- Consumir gradiente/sombra/paleta do design system; nao duplicar paleta hardcoded em cada tela.

**Verificacao**:
- `npm run lint:scss` passa.
- Um uso simples dos mixins compila.
- Nenhuma tela funcional muda comportamento.

### Definicao de pronto da Task M-12.0
- [ ] Branch correta criada.
- [ ] Baseline registrado.
- [ ] Base visual e superficies impactadas auditadas.
- [ ] Decisao de icones registrada (preferir Ionicons).
- [ ] Primitivos mobile criados/ajustados sem troca de stack.
- [ ] `npm run lint:scss` e `npm run build` passam ou falha preexistente documentada.

### Commit sugerido
```text
feat(mobile): adicionar primitivos visuais do design system
```

---

## Task M-12.1 - Publico mobile: splash, welcome, login/TOTP e registro

**Objetivo**: dar presenca de marca e cor combinada as superficies publicas, preservando logica de formularios e autenticacao.

**Pre-requisito**: Task M-12.0 concluida.

**Esforco**: 0,5-1 dia.

### Step 212.1.1 - Redesenhar splash e welcome

**Arquivos provaveis**:
- `<sep-mobile-root>/src/app/features/public/splash/*`
- `<sep-mobile-root>/src/app/features/public/welcome/*`

**Implementacao**:
- Aplicar painel/hero mobile com marca `SEP`, gradiente da paleta e CTA principal.
- Tratar `welcome` como a landing publica mobile: hero compacto, CTAs para login/registro e beneficios reais do SEP, sem criar rota nova.
- Usar `ion-icon` com chips coloridos para beneficios/atalhos reais.
- Manter rotas, textos de acao e fluxo de navegacao existentes.
- Garantir layout sem overflow em viewport estreita.

**Verificacao**:
- Specs existentes de splash/welcome passam.
- Nenhum asset de terceiro introduzido.

### Step 212.1.2 - Redesenhar login e TOTP

**Arquivos provaveis**:
- `<sep-mobile-root>/src/app/features/public/login/login.component.*`
- `<sep-mobile-root>/src/app/features/public/login/verify-totp/*`

**Implementacao**:
- Usar `sep-mobile-auth-brand-panel` em formato mobile: faixa superior/painel compacto + form.
- CTA de submit com `sep-mobile-button-gradient`.
- Inputs Ionic/HTML mantem `formControlName`, validacoes, mensagens, loading e ARIA.
- TOTP segue visual coerente com login, sem alterar o desafio MFA.

**Verificacao**:
- Login/TOTP chamam os mesmos services.
- `401/403/423` continuam no tratamento atual.
- Specs de login passam; ajustar somente seletores visuais se necessario.

### Step 212.1.3 - Redesenhar registro

**Arquivos provaveis**:
- `<sep-mobile-root>/src/app/features/public/register/*`

**Implementacao**:
- Mesmo padrao visual do login.
- Select/segmento de perfil consistente com Ionic e com foco visivel.
- Preservar validacoes e body enviado ao backend.

**Verificacao**:
- Cadastro continua chamando o mesmo endpoint.
- Mobile viewport sem overflow horizontal.

### Definicao de pronto da Task M-12.1
- [ ] Splash/welcome com marca SEP e CTA visualmente forte.
- [ ] Login/TOTP com painel de marca e CTA gradiente.
- [ ] Registro coerente com login.
- [ ] Nenhuma mudanca de logica, contrato ou auth.
- [ ] `npm run test`, `npm run lint:scss` passam.

### Commit sugerido
```text
feat(mobile): redesenhar superficies publicas com design system
```

---

## Task M-12.2 - Homes e jornadas existentes

**Objetivo**: aplicar tiles, chips e cards nas homes existentes sem criar funcionalidades novas nem dados fabricados.

**Pre-requisito**: Task M-12.1 concluida.

**Esforco**: 0,5-1 dia.

### Step 212.2.1 - Enriquecer home autenticada

**Arquivos provaveis**:
- `<sep-mobile-root>/src/app/features/authenticated/home/*`

**Implementacao**:
- Transformar atalhos reais em tiles (`sep-mobile-quick-tile`) com `ion-icon` e tom semantico.
- Aplicar header/saudacao visualmente mais forte, sem metricas inventadas.
- Manter role-gating e rotas existentes.

**Verificacao**:
- Nenhum numero, saldo ou contador sem fonte real.
- Navegacao existente preservada.

### Step 212.2.2 - Enriquecer home tomador

**Arquivos provaveis**:
- `<sep-mobile-root>/src/app/features/tomador/home/*`

**Implementacao**:
- Cards de jornada do tomador com chips de icone, estados textuais reais e CTAs existentes.
- Se alguma jornada for placeholder, manter estado "em preparacao" sem simular dados.

**Verificacao**:
- Fluxo tomador nao ganha tela funcional nova.
- Placeholders continuam claros.

### Step 212.2.3 - Enriquecer home credora

**Arquivos provaveis**:
- `<sep-mobile-root>/src/app/features/credora/home/*`

**Implementacao**:
- Cards/tiles para jornada credora existente com linguagem visual equivalente ao tomador.
- Nao prometer aporte, marketplace, Pix ou carteira se a tela atual nao tiver contrato implementado.

**Verificacao**:
- Conteudo segue o estado real do app.
- Sem dados financeiros ficticios.

### Step 212.2.4 - Ajustar perfil, biometria, troca de senha e step-up

**Arquivos provaveis**:
- `<sep-mobile-root>/src/app/features/authenticated/profile/**`
- `<sep-mobile-root>/src/app/features/authenticated/step-up/*`

**Implementacao**:
- Aplicar cards, botoes, alerts e estados coerentes.
- Nao alterar biometria, MFA, step-up token ou contratos.

**Verificacao**:
- Specs de perfil/troca de senha continuam verdes.

### Definicao de pronto da Task M-12.2
- [ ] Home autenticada com tiles coloridos.
- [ ] Home tomador e credora com cards/chips coerentes.
- [ ] Perfil/biometria/step-up visualmente alinhados.
- [ ] Sem dados fabricados.
- [ ] `npm run test` passa.

### Commit sugerido
```text
feat(mobile): aplicar design system nas homes e jornadas
```

---

## Task M-12.3 - Shell mobile: header, tabs e estados

**Objetivo**: alinhar o frame autenticado ao novo visual para dar consistencia as telas.

**Pre-requisito**: Task M-12.2 concluida.

**Esforco**: 0,5 dia.

### Step 212.3.1 - Polir header mobile

**Arquivos provaveis**:
- `<sep-mobile-root>/src/app/layout/header-mobile/*`

**Implementacao**:
- Header translucido/sticky com blur quando suportado.
- Titulo, avatar/identidade, acoes e tema coerentes com o design.
- Manter inputs/outputs e interacoes existentes.

**Verificacao**:
- Header nao sobrepoe conteudo em iOS safe area.
- Specs DOM do header passam.

### Step 212.3.2 - Polir shell e tabs

**Arquivos provaveis**:
- `<sep-mobile-root>/src/app/layout/shell/*`
- `<sep-mobile-root>/src/app/layout/tabs/*`

**Implementacao**:
- Tabs com estado ativo mais evidente: icone colorido, wash de fundo, label legivel.
- Usar variaveis Ionic e tokens SEP para background, border, focus e touch target.
- Respeitar `safe-area-inset-bottom`.
- Nao alterar rotas ou role-gating.

**Verificacao**:
- Navegacao por tabs preservada.
- Sem overlap com conteudo em viewport pequena.

### Step 212.3.3 - Ajustar estados globais

**Arquivos provaveis**:
- `<sep-mobile-root>/src/global.scss`
- `<sep-mobile-root>/src/theme/variables.scss`
- componentes de erro/publicos

**Implementacao**:
- Loading, empty, error, toast/dialog/alert e focus visible com tokens novos.
- Dark mode sem contraste insuficiente.

**Verificacao**:
- `npm run lint:scss` passa.
- Validar manualmente light/dark.

### Definicao de pronto da Task M-12.3
- [ ] Header mobile polido.
- [ ] Tabs com estado ativo claro e safe area respeitada.
- [ ] Estados globais coerentes.
- [ ] Navegacao e guards preservados.
- [ ] Specs de layout passam.

### Commit sugerido
```text
feat(mobile): polir shell e navegacao mobile
```

---

## Task M-12.4 - Showcase, testes e documentacao

**Objetivo**: demonstrar os novos primitivos, validar regressao e atualizar docs operacionais.

**Pre-requisito**: Task M-12.3 concluida.

**Esforco**: 0,5 dia.

### Step 212.4.1 - Atualizar showcase mobile

**Arquivos provaveis**:
- `<sep-mobile-root>/src/app/features/design-system/**`

**Implementacao**:
- Demonstrar:
  - `sep-mobile-icon-chip`;
  - `sep-mobile-quick-tile`;
  - `sep-mobile-button-gradient`;
  - `sep-mobile-auth-brand-panel`;
  - cards/tabs/header;
  - estados light/dark.
- Usar exemplos neutros, sem dado real de cliente.

**Verificacao**:
- Showcase renderiza em viewport mobile.
- Nao depende de backend.

### Step 212.4.2 - Atualizar testes

**Comandos**:
```bash
cd <sep-mobile-root>
npm run test
npm run e2e
```

**Implementacao**:
- Ajustar seletores que dependiam de markup removido.
- Cobrir render de splash/welcome, login, registro, home, header/tabs e showcase.
- Manter smoke PWA em viewport mobile; registrar falhas preexistentes.

### Step 212.4.3 - Rodar suite final

**Comandos**:
```bash
cd <sep-mobile-root>
npm run lint
npm run lint:scss
npm run test
npm run build
```

**Verificacao**:
- Suite verde ou falhas preexistentes registradas com evidencia.

### Step 212.4.4 - Auditar dependencias nao usadas

**Objetivo**: verificar se a sprint deixou ou revelou dependencias orfas, especialmente pacotes de teste legados, sem remover runtime por suposicao.

**Comandos**:
```bash
cd <sep-mobile-root>
npx depcheck
```

**Implementacao**:
- Validar cada item apontado pelo `depcheck` antes de remover: descartar falsos positivos (`@types/*`, plugins de build/test, libs usadas por configuracao ou CLI).
- Se `karma`, `jasmine-*` ou outra dependencia legada aparecer como comprovadamente sem uso, confirmar com `grep`/`rg` antes de remover do `package.json`/lock.
- Nao remover dependencia de runtime sem confirmar que nenhum `import`, provider, script ou configuracao usa o pacote.
- Apos qualquer remocao, rodar `npm run lint`, `npm run lint:scss`, `npm run test` e `npm run build`.

**Verificacao**:
- Dependencias orfas removidas apenas com evidencia ou pendencias justificadas no checkpoint.
- Suite final continua verde apos remocoes.

### Step 212.4.5 - Atualizar docs operacionais

**Arquivos**:
- `<docs-sep-root>/repos/sep-mobile/README.md`
- `<docs-sep-root>/AI-ROADMAP.md`
- `<docs-sep-root>/docs-sep/MOBILE-SCREENS-PLAN.md`, se o plano textual ainda disser que M-12 e apenas migracao Notion generica
- `<docs-sep-root>/repos/sep-mobile/SPRINT-M-12-PR.md` no fechamento da sprint

**Implementacao**:
- Registrar que a M-Sprint 12 revisada segue a F-Sprint 15.
- Listar os primitivos mobile e onde ficam.
- Atualizar status real da M-Sprint 12 quando concluida.
- Criar PR description temporaria no fechamento, espelhando os PRs anteriores.

### Definicao de pronto da Task M-12.4
- [ ] Showcase cobre novos primitivos mobile.
- [ ] Testes, lint, SCSS lint e build executados.
- [ ] Smoke PWA validado ou pendencia justificada.
- [ ] Dependencias orfas auditadas com `depcheck`; remocoes, se houver, validadas com grep-guard e suite verde.
- [ ] Docs e indices atualizados.
- [ ] Spec/indices deixam claro que M-12 deve ser feita antes da M-6/206.
- [ ] `SPRINT-M-12-PR.md` criado no fechamento.

### Commit sugerido
```text
docs(mobile): registrar aplicacao do design system na m-sprint 12
```

---

## Checklist final da M-Sprint 12

- [ ] Splash/welcome com marca SEP e CTA visualmente forte.
- [ ] Login/TOTP/registro com painel de marca e formularios preservados.
- [ ] Homes com tiles coloridos, chips de icone e cards de jornada.
- [ ] Header/tabs/shell coerentes com o New Design System SEP.
- [ ] Botoes de destaque com cor/gradiente.
- [ ] Ionicons usados de forma curada; sem Tailwind/shadcn/React.
- [ ] Sem metrica/numero fabricado.
- [ ] Sem mudanca funcional, de contrato, auth, biometria ou step-up.
- [ ] Light/dark validados nas telas alteradas.
- [ ] `npm run lint` verde.
- [ ] `npm run lint:scss` verde.
- [ ] `npm run test` verde.
- [ ] `npm run build` verde.
- [ ] Smoke PWA/mobile validado.
- [ ] Dependencias orfas auditadas; nenhuma biblioteca nova adicionada por simetria com o web.
- [ ] Docs e indices atualizados.
