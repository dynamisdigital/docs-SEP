# Steps - M-Sprint 13 - Empacotamento nativo Android

**Spec de origem**: [`specs/fase-4/213-msprint-13-empacotamento-nativo-android.md`](../../specs/fase-4/213-msprint-13-empacotamento-nativo-android.md)

**Objetivo geral**: empacotar o `sep-mobile` para Android com Capacitor 8, preservando o PWA e as
jornadas existentes. A sprint entrega projeto Android reproduzivel, integracao segura com o runtime
nativo, smoke em emulador ou device e documentacao operacional. Nao publica na Play Store.

**Esforco total estimado**: 3-4 dias.

**Repo de destino**: `sep-mobile`.

**Ordem de execucao recomendada**:

```text
prechecks (Git + toolchain + baseline PWA)
  -> M-13.0 (ADR Capacitor 8 + inventario)
  -> M-13.1 (projeto Android + configuracao + assets)
  -> M-13.2 (runtime nativo + compatibilidade PWA)
  -> M-13.3 (APK/AAB + smoke Android)
  -> M-13.4 (CI/docs + regressao)
```

**Como usar este arquivo**:

1. Execute as tasks na ordem.
2. Escreva ou ajuste testes antes de comportamento observavel novo.
3. Pare em checkpoint pre-commit ao final de cada task.
4. Informe arquivos, verificacoes, riscos e mensagem de commit sugerida.
5. Aguarde `commit` antes de executar `git add` ou `git commit`.
6. O git de `docs-SEP` e manual.

**Pre-requisitos globais**:

- `sep-mobile/develop` contem a M-Sprint 12 e as sprints mobile concluidas da Fase 3.
- `main` esta integrada em `develop`, ou a divergencia foi registrada e aprovada.
- JDK e Android SDK compativeis com o projeto do Capacitor 8 estao instalados.
- Emulador Android ou device esta disponivel.
- Baseline PWA verde.
- ADR 0003, spec 213 e este arquivo foram lidos.

**Fora de escopo**:

- Play Store, assinatura release e conta de loja.
- iOS (M-14) e biometria nativa (M-15).
- Jornada, endpoint, regra de negocio ou contrato REST novo.
- Upgrade alem da baseline aprovada.
- Persistir segredo em armazenamento inseguro.

---

## Precheck - Integracao, toolchain e baseline

### Step 213.P.1 - Conferir integracao e working tree

```bash
cd <sep-mobile-root>
git fetch --all --prune
git status --short --branch
git rev-list --left-right --count origin/develop...origin/main
git log --oneline -10 origin/develop
```

**Verificacao**:

- `develop` contem a sprint mobile anterior.
- `main` esta integrada em `develop`, ou ha pendencia aprovada.
- Alteracoes locais do usuario foram identificadas e preservadas.
- Se a cadeia estiver incompleta, parar antes da branch.

### Step 213.P.2 - Criar branch

```bash
cd <sep-mobile-root>
git switch develop
git pull --ff-only
git switch -c feature/msprint-13-android-capacitor
```

### Step 213.P.3 - Validar toolchain Android

```bash
cd <sep-mobile-root>
node -v
npm -v
java -version
npx cap --version
```

- Conferir JDK exigido pelo Gradle wrapper.
- Confirmar Android SDK, platform-tools e platform compativel.
- Nao versionar caminho do SDK, credencial ou keystore.

### Step 213.P.4 - Registrar baseline PWA

```bash
cd <sep-mobile-root>
npm ci
npm run lint
npm run lint:scss
npm run format:check
npm run test
npm run build
npm run e2e
```

- Registrar falhas preexistentes.
- Confirmar que o build produz o diretorio usado em `webDir`.

---

## Task M-13.0 - Formalizar a baseline Capacitor 8

**Objetivo**: registrar a decisao vigente e inventariar as dependencias nativas necessarias.

### Step 213.0.1 - Criar ADR da baseline Capacitor 8

**Arquivo previsto**:

- `<docs-root>/adr/0019-baseline-capacitor-8-mobile.md`

**Conteudo minimo**:

- O ADR 0003 fixou Capacitor 6, mas o `sep-mobile` ja opera na linha 8.
- Angular 20.x + Ionic 8.4+ + Capacitor 8, com plugins oficiais no major 8.
- Compatibilidade de Node, JDK, Gradle e Android SDK.
- Consequencias para Android, iOS, CI e plugins.
- ADR 0003 supersedido somente no recorte do Capacitor.
- Novo major ou plugin relevante exige avaliacao explicita.

### Step 213.0.2 - Inventariar configuracao e plugins

```bash
cd <sep-mobile-root>
npm ls @capacitor/core @capacitor/cli @capacitor/app @capacitor/preferences @capacitor/status-bar
rg -n "@capacitor|Capacitor|Preferences|StatusBar|App\\.addListener" src package.json
```

### Definicao de pronto da Task M-13.0

- [ ] ADR criado e coerente com o repositorio.
- [ ] Compatibilidade da toolchain registrada.
- [ ] Plugins e pontos de integracao inventariados.
- [ ] Nenhum upgrade ou plugin especulativo.

### Commit sugerido

```text
docs(mobile): formalizar baseline do Capacitor 8
```

---

## Task M-13.1 - Gerar e configurar o projeto Android

**Objetivo**: criar a plataforma Android e configurar identidade, navegacao e assets sem secrets.

### Step 213.1.1 - Confirmar configuracao Capacitor

**Arquivos provaveis**:

- `<sep-mobile-root>/capacitor.config.ts`
- `<sep-mobile-root>/angular.json`

**Implementacao**:

- Definir `appId`, `appName` e `webDir` com valores oficiais do SEP.
- Nao versionar `server.url` de desenvolvimento.
- Validar alinhamento do build Angular com `webDir`.

### Step 213.1.2 - Adicionar plataforma Android

```bash
cd <sep-mobile-root>
npm run build
npx cap add android
npx cap sync android
npx cap doctor android
```

- Diretorio `android/` gerado e versionavel.
- Gradle sync concluido.
- Nenhum arquivo local, keystore ou segredo versionado.

### Step 213.1.3 - Configurar manifest, deep links e permissoes

**Arquivos provaveis**:

- `<sep-mobile-root>/android/app/src/main/AndroidManifest.xml`
- `<sep-mobile-root>/android/app/src/main/res/values/strings.xml`
- `<sep-mobile-root>/android/app/src/main/res/xml/`

**Implementacao**:

- Manter somente permissoes exigidas pelas jornadas atuais.
- Usar apenas scheme/host oficial; nao inventar dominio.
- Restringir intent filters e conferir `android:exported`.
- Rotas protegidas continuam passando por autenticacao e guards.

### Step 213.1.4 - Configurar icone e splash

- Usar assets oficiais da marca SEP.
- Gerar densidades a partir de uma fonte versionada.
- Validar adaptive icon, area segura e splash claro/escuro.

### Definicao de pronto da Task M-13.1

- [ ] Configuracao Capacitor alinhada ao Angular.
- [ ] Plataforma Android gerada e sincronizada.
- [ ] Manifest contem somente permissoes necessarias.
- [ ] Deep links preservam guards.
- [ ] Icone e splash usam a marca SEP.
- [ ] Gradle sync passa.

### Commit sugerido

```text
feat(mobile): adicionar projeto nativo Android
```

---

## Task M-13.2 - Integrar runtime nativo sem regredir o PWA

**Objetivo**: adaptar capacidades da plataforma com deteccao explicita, fallback web e testes.

### Step 213.2.1 - Isolar capacidades de plataforma

- Centralizar deteccao do runtime em servico pequeno e testavel.
- Evitar chamadas estaticas do Capacitor espalhadas por componentes.
- Manter fallback web para cada capacidade.
- Nao abstrair plugins sem uso real.

**Testes**:

- Android seleciona implementacao nativa.
- Web preserva comportamento PWA.
- Erro de plugin nao deixa sessao ou navegacao inconsistente.

### Step 213.2.2 - Revisar sessao e preferencias

- Separar token/sessao de preferencias nao sensiveis.
- Nao considerar `Preferences` armazenamento seguro para segredo.
- Preservar logout, expiracao, restauracao e limpeza.
- Plugin adicional exige necessidade concreta e revisao de seguranca.

### Step 213.2.3 - Integrar status bar e botao voltar

- Aplicar status bar apenas no runtime nativo.
- Fechar overlay/modal antes de navegar.
- Respeitar pilha Ionic/Angular e fronteira de autenticacao.
- Evitar listeners duplicados e remove-los adequadamente.

**Testes**:

- Voltar fecha overlay.
- Voltar navega quando existe historico.
- Na raiz, a saida e previsivel e nao perde dados silenciosamente.
- Web independe do listener Android.

### Step 213.2.4 - Tratar deep links

- Aceitar somente schemes, hosts e rotas reconhecidos.
- Passar navegacao pelos guards existentes.
- Rejeitar entrada desconhecida com fallback seguro.
- Nao registrar URL com token ou PII.

### Definicao de pronto da Task M-13.2

- [ ] Capacidades nativas isoladas e testaveis.
- [ ] PWA possui fallback explicito.
- [ ] Sessao nao teve seguranca reduzida.
- [ ] Status bar, back button e deep links funcionam.
- [ ] Guards continuam efetivos.
- [ ] Testes unitarios passam.

### Commit sugerido

```text
feat(mobile): integrar runtime nativo Android
```

---

## Task M-13.3 - Produzir artefatos e executar smoke Android

**Objetivo**: provar o build e uma jornada basica no runtime nativo.

### Step 213.3.1 - Compilar Android

```bash
cd <sep-mobile-root>
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
./gradlew bundleDebug
```

- APK e AAB debug gerados.
- Build independente de segredo ou caminho absoluto versionado.
- Binarios nao adicionados ao Git.

### Step 213.3.2 - Instalar e executar

```bash
cd <sep-mobile-root>
npx cap run android
```

**Smoke minimo**:

1. Instalar e abrir.
2. Confirmar icone, splash e primeira tela.
3. Efetuar login e MFA com usuario de teste.
4. Abrir a home do perfil.
5. Navegar por uma jornada basica existente.
6. Acionar voltar e um deep link valido.
7. Encerrar e reabrir.
8. Fazer logout e confirmar limpeza da sessao.

**Evidencias**:

- Registrar device/emulador, API level, resultado e falhas.
- Nao expor CPF, CNPJ, token, segredo TOTP ou dado financeiro.
- Nao versionar logs extensos ou binarios.

### Step 213.3.3 - Verificar seguranca e regressao

- Nenhum segredo no Logcat.
- Deep link nao contorna guards.
- Permissoes correspondem ao uso.
- Rotacao, background/foreground e retomada preservam a sessao.

### Definicao de pronto da Task M-13.3

- [ ] APK debug gerado.
- [ ] AAB debug gerado.
- [ ] App instalado e aberto.
- [ ] Smoke login -> jornada basica concluido.
- [ ] Back button, deep link e retomada validados.
- [ ] Nenhum segredo ou PII exposto.

### Commit sugerido

```text
test(mobile): validar smoke nativo Android
```

---

## Task M-13.4 - Automatizar, documentar e fechar

**Objetivo**: tornar o build reproduzivel, executar regressao e documentar a operacao.

### Step 213.4.1 - Adicionar build ao CI ou formalizar build local

**Opcao preferencial**:

- Job instala Node/JDK, executa `npm ci`, build web, `cap sync android` e
  `./gradlew assembleDebug`.
- Nao assinar release nem armazenar keystore.
- Falha do build Android deixa o job vermelho.

**Fallback da spec**:

- Se o runner nao suportar Android SDK de modo confiavel, documentar build local, versoes, saidas
  esperadas e limitacao.

### Step 213.4.2 - Atualizar documentacao

**Arquivos previstos**:

- `<sep-mobile-root>/README.md`
- `<docs-root>/repos/sep-mobile/README.md`
- `<docs-root>/AI-ROADMAP.md`

Documentar versoes, pre-requisitos, build, sync, run, APK/AAB, emulador/device, secrets, keystore,
artefatos e limites da sprint. Referenciar spec 213, este step e ADR do Capacitor 8.

### Step 213.4.3 - Executar regressao final

```bash
cd <sep-mobile-root>
npm run lint
npm run lint:scss
npm run format:check
npm run test
npm run build
npm run e2e
npx cap sync android
cd android
./gradlew test
./gradlew lint
./gradlew assembleDebug
./gradlew bundleDebug
```

### Step 213.4.4 - Preparar descricao temporaria do PR

**Arquivo obrigatorio**:

- `<docs-root>/repos/sep-mobile/SPRINT-M-13-PR.md`

Incluir summary, test plan, configuracao Android, decisoes de seguranca, smoke, limitacoes,
follow-ups e commits. Remover antes o artefato temporario da sprint anterior ja usado. O git de
`docs-SEP` permanece manual.

### Definicao de pronto da Task M-13.4

- [ ] Build reproduzivel por CI ou procedimento local.
- [ ] README e documento operacional atualizados.
- [ ] Regressao PWA e Android executada.
- [ ] Descricao temporaria do PR criada.
- [ ] Limites e follow-ups registrados.

### Commit sugerido

```text
ci(mobile): automatizar build Android
```

---

## Gate final da M-Sprint 13

- [ ] ADR Capacitor 8 aceito; ADR 0003 supersedido no recorte.
- [ ] Projeto Android gerado, sincronizado e sem secrets.
- [ ] APK e AAB debug reproduziveis.
- [ ] App Android sem regressao do PWA.
- [ ] Login -> MFA -> home -> jornada basica validado.
- [ ] Deep links, status bar, voltar, retomada e logout validados.
- [ ] Suite PWA e validacoes Android verdes, ou limitacao documentada.
- [ ] Documentacao e descricao do PR atualizadas.
- [ ] Sem publicacao, mudanca de contrato ou antecipacao da M-14/M-15.

## Checkpoint final pre-commit

```bash
cd <sep-mobile-root>
git status --short --branch
git diff --stat
```

Informar arquivos, verificacoes, device/API level, riscos e commits sugeridos. Somente executar
`git add <paths-especificos>` e `git commit` apos aprovacao. Push e PR permanecem manuais.
