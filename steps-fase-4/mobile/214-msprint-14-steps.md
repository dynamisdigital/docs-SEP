# Steps - M-Sprint 14 - Empacotamento nativo iOS

**Spec de origem**: [`specs/fase-4/214-msprint-14-empacotamento-nativo-ios.md`](../../specs/fase-4/214-msprint-14-empacotamento-nativo-ios.md)

**Objetivo geral**: empacotar o `sep-mobile` para iOS com Capacitor 8, reutilizando a base nativa
comum entregue na M-Sprint 13 e preservando o PWA e as jornadas existentes. A sprint entrega
projeto Xcode reproduzivel, ajustes iOS, build debug, smoke em simulador ou device e documentacao
operacional. Nao publica na App Store.

**Esforco total estimado**: 3-4 dias.

**Repo de destino**: `sep-mobile`.

**Ordem de execucao recomendada**:

```text
prechecks (Git + macOS/Xcode + baseline PWA/Android)
  -> M-14.0 (dependencia iOS + projeto Xcode)
  -> M-14.1 (configuracao, assets e seguranca)
  -> M-14.2 (runtime e compatibilidade iOS/PWA)
  -> M-14.3 (build + smoke + CI/docs + regressao)
```

**Como usar este arquivo**:

1. Execute as tasks na ordem.
2. Escreva ou ajuste testes antes de comportamento observavel novo.
3. Pare em checkpoint pre-commit ao final de cada task.
4. Informe arquivos, verificacoes, riscos e mensagem de commit sugerida.
5. Aguarde aprovacao antes de executar `git add` ou `git commit`.
6. O git de `docs-SEP` e manual.

**Pre-requisitos globais**:

- M-Sprint 13 esta integrada em `develop` e `main`, incluindo ADR 0019, projeto Android e runtime
  nativo comum.
- `main` esta integrada em `develop`, ou a divergencia foi registrada e aprovada.
- Host macOS com Xcode e Command Line Tools compativeis com Capacitor 8 esta disponivel.
- Simulador iOS ou device de teste esta disponivel.
- Para build em device/IPA, Team e provisioning de desenvolvimento estao configurados localmente;
  certificados e perfis nunca entram no Git.
- Node >= 22, CocoaPods e baseline PWA verdes.
- Spec 214, ADR 0019, steps 213 e este arquivo foram lidos.

**Fora de escopo**:

- App Store Connect, TestFlight, publicacao, notarizacao e distribuicao de producao.
- Biometria nativa (M-15).
- Jornada, endpoint, regra de negocio ou contrato REST novo.
- Upgrade de major alem da baseline aprovada.
- App Links HTTPS associados a dominio; manter o scheme proprio aprovado na M-13.
- Persistir token, credencial ou outro segredo em armazenamento inseguro.

---

## Precheck - Integracao, toolchain e baseline

### Step 214.P.1 - Conferir integracao e working tree

```bash
cd <sep-mobile-root>
git fetch --all --prune
git status --short --branch
git rev-list --left-right --count origin/develop...origin/main
git log --oneline -10 origin/develop
```

**Verificacao**:

- `develop` contem a M-Sprint 13 mergeada.
- `main` esta integrada em `develop`, ou ha pendencia aprovada.
- Alteracoes locais do usuario foram identificadas e preservadas.
- Se a cadeia estiver incompleta, parar antes da branch.

### Step 214.P.2 - Criar branch

```bash
cd <sep-mobile-root>
git switch develop
git pull --ff-only
git switch -c feature/msprint-14-ios-capacitor
```

### Step 214.P.3 - Validar toolchain iOS

```bash
cd <sep-mobile-root>
node -v
npm -v
npx cap --version
xcodebuild -version
xcode-select -p
pod --version
```

- Confirmar a versao minima do iOS suportada pelo template vigente do Capacitor 8.
- Registrar versoes de macOS, Xcode, SDK e simulador usadas.
- Confirmar que a licenca do Xcode foi aceita e que o runtime do simulador esta instalado.
- Nao versionar Apple ID, Team pessoal, certificado, perfil, token ou caminho local.

### Step 214.P.4 - Registrar baseline PWA e Android

```bash
cd <sep-mobile-root>
npm ci
npm run lint
npm run lint:scss
npm run format:check
npm run test
npm run build
npm run e2e
npx cap sync android
cd android
./gradlew test lint assembleDebug
```

- Registrar falhas preexistentes.
- Confirmar que `webDir` continua sendo `www`.
- Nao corrigir regressao alheia a M-14 sem aprovacao.

---

## Task M-14.0 - Gerar o projeto iOS reproduzivel

**Objetivo**: adicionar a plataforma iOS na mesma baseline Capacitor 8 da M-13 e validar o projeto
Xcode gerado.

### Step 214.0.1 - Adicionar a dependencia da plataforma

```bash
cd <sep-mobile-root>
npm install --save-exact @capacitor/ios@8.4.0
npm ls @capacitor/core @capacitor/cli @capacitor/ios
```

- Manter `@capacitor/core`, CLI e plataforma iOS na mesma linha 8.4.
- Nao atualizar dependencias adjacentes.
- Confirmar `package.json` e lockfile sem mudancas estranhas.

### Step 214.0.2 - Remover o ignore temporario e adicionar iOS

**Arquivos provaveis**:

- `<sep-mobile-root>/.gitignore`
- `<sep-mobile-root>/ios/`

```bash
cd <sep-mobile-root>
npm run build
npx cap add ios
npx cap sync ios
npx cap doctor ios
```

- Remover somente a regra que ignora todo o diretorio `ios/`.
- Preservar ignores de `DerivedData`, build, Pods e dados locais do Xcode.
- Versionar o projeto iOS e os arquivos de lock exigidos pelo template vigente.
- Nao versionar `xcuserdata`, provisioning, certificados ou artefatos.

### Step 214.0.3 - Validar o projeto Xcode sem assinatura

```bash
cd <sep-mobile-root>
xcodebuild \
  -workspace ios/App/App.xcworkspace \
  -scheme App \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  CODE_SIGNING_ALLOWED=NO \
  build
```

- Confirmar o nome real de workspace e scheme antes de fixar o comando em CI/docs.
- Tratar warnings novos relevantes; nao tentar zerar warnings gerados por dependencias.

### Definicao de pronto da Task M-14.0

- [ ] `@capacitor/ios` alinhado ao Capacitor 8.4.
- [ ] Diretorio `ios/` gerado, sincronizado e versionavel.
- [ ] Arquivos locais, secrets e artefatos continuam ignorados.
- [ ] Build de simulador passa sem assinatura.
- [ ] PWA e Android permanecem funcionais.

### Commit sugerido

```text
feat(mobile): adicionar projeto nativo iOS
```

---

## Task M-14.1 - Configurar identidade, assets e seguranca iOS

**Objetivo**: configurar o target iOS com identidade coerente, permissoes minimas e assets da marca,
sem acoplar o repositorio a credenciais de uma pessoa ou ambiente.

### Step 214.1.1 - Configurar target e deployment

**Arquivos provaveis**:

- `<sep-mobile-root>/ios/App/App.xcodeproj/project.pbxproj`
- `<sep-mobile-root>/ios/App/App/Info.plist`
- `<sep-mobile-root>/capacitor.config.ts`

**Implementacao**:

- Manter bundle identifier `com.dynamis.sep.mobile` e nome `SEP`.
- Fixar deployment target compativel com o Capacitor 8 e registra-lo na documentacao.
- Manter Team e signing automatico como configuracao local quando dependerem de conta pessoal.
- Validar orientacoes, idiomas e configuracoes de release/debug sem inventar requisito.

### Step 214.1.2 - Restringir permissoes e URL scheme

- Declarar apenas capabilities e chaves `Info.plist` exigidas pelas jornadas atuais.
- Nao habilitar camera, fotos, localizacao, contatos, push, Keychain Sharing ou background modes
  sem uso concreto.
- Registrar o scheme proprio `com.dynamis.sep.mobile://` de forma restrita.
- Fazer toda URL recebida passar pela allowlist e pelos guards existentes.
- Nao antecipar Universal Links/App Links da Fase 5.

### Step 214.1.3 - Configurar icone, splash e aparencia

- Reutilizar os assets oficiais da marca quando existirem.
- Se a arte oficial continuar pendente, manter placeholder explicitamente documentado; nao
  fabricar identidade definitiva.
- Validar AppIcon, splash/launch screen, light/dark, escala e areas seguras.
- Evitar duplicar assets binarios sem necessidade.

### Step 214.1.4 - Auditar armazenamento de sessao no iOS

- Inventariar tokens, trust de device, desafio MFA, step-up e preferencias funcionais.
- `Preferences`, `UserDefaults` e `localStorage` nao contam como armazenamento seguro para segredo.
- Step-up permanece somente em memoria e de uso unico.
- Se access/refresh token continuarem persistidos fora do Keychain, implementar uma porta
  Keychain-backed compativel com Capacitor 8, com revisao do plugin, fallback web explicito,
  migracao/limpeza segura e testes. Nao instalar plugin apenas para preferencia nao sensivel.
- Confirmar logout, expiracao e troca de usuario removendo segredos nativos.

### Definicao de pronto da Task M-14.1

- [ ] Bundle, target e deployment coerentes com a baseline.
- [ ] Permissoes e capabilities minimas.
- [ ] URL scheme nao contorna guards.
- [ ] Icone, splash, tema e safe area visualmente validados.
- [ ] Segredos nao ficam em `Preferences`, `UserDefaults` ou `localStorage`.
- [ ] Signing e provisioning nao vazam para o Git.

### Commit sugerido

```text
feat(mobile): configurar target e seguranca iOS
```

---

## Task M-14.2 - Integrar comportamento especifico do iOS

**Objetivo**: adaptar o runtime comum para safe area, status bar, teclado, ciclo de vida e deep
links do iOS, preservando os fallbacks web e o comportamento Android.

### Step 214.2.1 - Validar safe area e status bar

- Testar telas publicas, shell autenticado, tabs, modais e dialogs com notch/Dynamic Island.
- Usar `env(safe-area-inset-*)` e primitivas Ionic; evitar offsets por modelo de device.
- Preservar contraste da status bar em tema claro e escuro.
- Nao espalhar deteccao de plataforma por componentes; evoluir o runtime comum somente onde houver
  diferenca real.

**Testes**:

- iOS aplica estilo nativo esperado.
- Android preserva o comportamento da M-13.
- Web continua sem depender de plugin nativo.

### Step 214.2.2 - Tratar teclado e formularios

- Validar foco, scroll, resize e fechamento do teclado em login, MFA e formulario existente.
- Garantir que CTA e campo com erro permanecem alcancaveis.
- Evitar listener duplicado; remover listeners no ciclo de vida correto.
- Nao registrar valor digitado, documento ou segredo.

### Step 214.2.3 - Validar ciclo de vida, links e navegacao

- Validar cold start, background/foreground, encerramento e reabertura.
- Tratar deep link tanto com app fechado quanto aberto.
- Aceitar apenas scheme e rotas reconhecidos; passar sempre pelos guards.
- Rejeitar URL malformada ou desconhecida com fallback seguro.
- Confirmar que usuario autenticado nao retorna a tela publica ao restaurar navegacao.

### Step 214.2.4 - Cobrir regressao multiplataforma

- Estender testes de `PlatformService` e `NativeRuntimeService` para os ramos iOS reais.
- Testar inicializacao idempotente e remocao de listeners.
- Testar falha de plugin sem quebrar login, sessao ou navegacao.
- Manter testes Android e web existentes verdes.

### Definicao de pronto da Task M-14.2

- [ ] Safe area e status bar corretas em light/dark.
- [ ] Teclado nao oculta campos, erros ou CTA.
- [ ] Cold start e retomada preservam sessao e guards.
- [ ] Deep links desconhecidos sao rejeitados com seguranca.
- [ ] Runtime continua isolado e idempotente.
- [ ] Testes iOS, Android e web passam.

### Commit sugerido

```text
feat(mobile): adaptar runtime nativo ao iOS
```

---

## Task M-14.3 - Produzir build, executar smoke e fechar

**Objetivo**: provar o app no runtime iOS e deixar build, CI e operacao reproduziveis.

### Step 214.3.1 - Compilar para simulador

```bash
cd <sep-mobile-root>
npm run build
npx cap sync ios
xcodebuild \
  -workspace ios/App/App.xcworkspace \
  -scheme App \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  CODE_SIGNING_ALLOWED=NO \
  build
```

- Build de simulador e gate obrigatorio e nao depende de conta Apple.
- Binarios e `DerivedData` nao entram no Git.

### Step 214.3.2 - Gerar archive/IPA debug quando houver provisioning

```bash
cd <sep-mobile-root>
xcodebuild \
  -workspace ios/App/App.xcworkspace \
  -scheme App \
  -configuration Debug \
  -destination 'generic/platform=iOS' \
  -archivePath build/SEP-Debug.xcarchive \
  archive

xcodebuild \
  -exportArchive \
  -archivePath build/SEP-Debug.xcarchive \
  -exportPath build/ios-debug \
  -exportOptionsPlist <export-options-local.plist>
```

- O `ExportOptions.plist` real pode conter Team/configuracao local e nao deve ser versionado com
  identificador pessoal.
- Registrar tamanho, metodo de exportacao e resultado sem publicar o IPA.
- Se provisioning nao estiver disponivel, manter o build de simulador verde e registrar o gate
  externo; nao criar certificado, Team ou IPA falso.

### Step 214.3.3 - Executar smoke em simulador ou device

```bash
cd <sep-mobile-root>
npx cap run ios
```

**Smoke minimo**:

1. Instalar e abrir.
2. Confirmar icone, splash, safe area e tema.
3. Efetuar login e MFA com usuario de teste.
4. Abrir a home do perfil.
5. Navegar por uma jornada basica existente com campo de formulario.
6. Validar teclado, modal/dialog e deep link valido.
7. Enviar o app ao background, retomar, encerrar e reabrir.
8. Fazer logout e confirmar limpeza da sessao.

**Evidencias**:

- Registrar modelo do simulador/device, versao do iOS, resultado e falhas.
- Nao expor CPF, CNPJ, token, segredo TOTP ou dado financeiro.
- Nao versionar screenshots com PII, logs extensos, `.app`, archive ou IPA.

### Step 214.3.4 - Adicionar build iOS ao CI

**Opcao preferencial**:

- Job em runner macOS com Node 22 executa `npm ci`, build web, `cap sync ios` e `xcodebuild` para
  simulador sem assinatura.
- Fixar a versao de macOS/Xcode suportada pelo provedor do CI.
- Usar cache apenas quando nao esconder divergencia de Pods/dependencias.
- Falha do build iOS deixa o job vermelho.
- Nao armazenar certificado ou provisioning enquanto nao houver entrega assinada autorizada.

**Fallback da spec**:

- Se nao houver runner macOS disponivel, documentar build local, versoes, comandos, saidas
  esperadas e a limitacao. O smoke local continua obrigatorio.

### Step 214.3.5 - Atualizar documentacao e regressao final

**Arquivos previstos**:

- `<sep-mobile-root>/README.md`
- `<docs-root>/repos/sep-mobile/README.md`
- `<docs-root>/AI-ROADMAP.md`

Documentar macOS/Xcode/Node/CocoaPods, sync, abertura no Xcode, simulador/device, signing local,
archive/IPA, CI, troubleshooting, secrets e limites da sprint. Referenciar spec 214, estes steps e
ADR 0019.

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
./gradlew test lint assembleDebug
cd ../..
npx cap sync ios
xcodebuild \
  -workspace ios/App/App.xcworkspace \
  -scheme App \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  CODE_SIGNING_ALLOWED=NO \
  build
```

### Step 214.3.6 - Preparar descricao temporaria do PR

**Arquivo obrigatorio**:

- `<docs-root>/repos/sep-mobile/SPRINT-M-14-PR.md`

Remover antes o `SPRINT-M-13-PR.md`, pois ja foi usado no PR da sprint anterior. Incluir summary,
test plan, configuracao iOS, seguranca/storage, smoke, CI, limitacoes, follow-ups e commits. O git
de `docs-SEP` permanece manual.

### Definicao de pronto da Task M-14.3

- [ ] Build de simulador reproduzivel.
- [ ] Archive/IPA debug gerado quando provisioning estiver disponivel, ou gate registrado.
- [ ] Smoke login -> jornada basica concluido.
- [ ] Safe area, teclado, deep link, retomada e logout validados.
- [ ] CI macOS verde ou fallback local documentado.
- [ ] Regressao PWA, Android e iOS executada.
- [ ] Documentacao e descricao temporaria do PR atualizadas.

### Commit sugerido

```text
ci(mobile): validar build nativo iOS
```

---

## Gate final da M-Sprint 14

- [ ] Baseline Capacitor 8/ADR 0019 preservada.
- [ ] Projeto iOS gerado, sincronizado e sem secrets.
- [ ] Build debug de simulador reproduzivel.
- [ ] Archive/IPA debug validado quando houver provisioning, sem publicacao.
- [ ] App iOS sem regressao do PWA ou Android.
- [ ] Login -> MFA -> home -> jornada basica validado.
- [ ] Safe area, status bar, teclado, deep links, retomada e logout validados.
- [ ] Segredos persistentes protegidos pelo Keychain; step-up segue somente em memoria.
- [ ] Suites PWA/Android e validacoes iOS verdes, ou limitacao documentada.
- [ ] README, documento operacional, roadmap e descricao do PR atualizados.
- [ ] Sem App Store/TestFlight, mudanca de contrato ou antecipacao da M-15.

## Checkpoint final pre-commit

```bash
cd <sep-mobile-root>
git status --short --branch
git diff --stat
```

Informar arquivos, verificacoes, simulador/device/iOS, riscos e commits sugeridos. Somente executar
`git add <paths-especificos>` e `git commit` apos aprovacao. Push e PR permanecem manuais.
