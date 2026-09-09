# M-Sprint 18 — Consumo dos codigos de erro no mobile

**Branch**: `feature/msprint-18-codigos-erro` (de `develop` `d82caaa`)
**Spec**: [`218`](../../specs/fase-4/218-msprint-18-consumo-codigos-erro-mobile.md) ·
**Steps**: [`218`](../../steps-fase-4/mobile/218-msprint-18-steps.md)
**Escopo**: Fase 4, produto novo sobre superficie de contrato existente. Sem rota, endpoint,
contrato backend, migration ou ADR.

## Summary

O `400` do `/auth/totp/verify` era **um** desfecho: toast de tres segundos, formulario de pe. Quem
caia em desafio expirado (`MFA-400-004`) ou conta sem TOTP ativo (`MFA-400-003`) redigitava codigo
contra algo que nunca aceitaria, ate desistir. Os dois passam a **encerrar a tentativa**, com a
explicacao do backend visivel na tela e o retorno ao login; `MFA-400-002` mantem o formulario,
porque ali o desafio segue vivo.

Antes disso, a sprint fecha a divida que tornava esse consumo perigoso: o mobile nao tinha helper de
extracao de erro e cada tela fazia o proprio `err.error as ApiErrorResponse` — **nove casts em oito
arquivos, com duas assinaturas de tipo diferentes**. Ler `codigo` direto nos nove entregaria a
feature e dobraria a duplicacao.

**A regra que atravessa a sprint: o codigo escolhe o RAMO, o corpo continua escolhendo a FRASE.**

Fecha, ao lado da Sprint 36 (backend) e da F-Sprint 26 (web), a recomendacao **P1** do
[`DIAGNOSTICO-PRODUTO.md`](../../docs-sep/DIAGNOSTICO-PRODUTO.md).

## Mudancas por modulo

| Modulo | Mudanca |
|---|---|
| `core/api` | `codigo?: string` em `ApiErrorResponse`; **`api-error.ts` novo** com `mensagemDaApi` e `codigoDeErroDaApi` |
| `core/auth` | `AuthService.descartarDesafioMfa()` — descarta so o desafio, nao a sessao |
| `features/public/login/verify-totp` | ramo terminal por codigo, `mensagemTerminal`, guardas em `submit()` e `tentarBiometria()` |
| 8 arquivos de feature | nove casts migrados para o helper |
| `mocks/handlers.ts` | `errorResponse` aceita `codigo`; `423` publica `AUTH-423-001`; `401` segue sem |
| `e2e/` | `codigos-erro-mobile.spec.ts` novo (4 testes) |

19 arquivos, **+897 / −47**.

## Test plan

| Gate | Baseline | Resultado |
|---|---|---|
| Vitest | 527 / 70 | **575 / 72**, 0 falhas |
| Playwright | 41 | **45**, 0 falhas |
| `format:check` / `lint` / `lint:scss` / `build` | verdes | verdes |
| `cap sync android` | passou | passou, 5 plugins |
| `gradlew assembleDebug` | passou | **BUILD SUCCESSFUL**, APK 5,17 MB |
| `npm audit` | **exit 1** (8 high) | **exit 0** — 0 high; ver Dividas |

Todos re-rodados **depois dos commits** e apos `npm ci --legacy-peer-deps`, porque o `lint-staged`
reescreve arquivos.

### Smoke real contra `:8080` — EXECUTADO

Backend subido localmente (`sep-postgres` ja ativo). No fio:

- desafio invalido + codigo nao-vazio → `"codigo":"MFA-400-004"`, message
  `"Desafio MFA invalido ou expirado. Refaca o login."` — o fixture do e2e foi alinhado **byte a
  byte** a essa frase;
- codigo em branco → **corpo sem campo `codigo`**, `"codigo não deve estar em branco"` — confirma
  que e bean validation (`@NotBlank`) na fronteira do controller, e nao `MFA-400-002`;
- `401` de credencial → **sem `codigo`**, confirmando que o mock esta certo em nao inventar um.

**Nao provado no fio, declarado**: `AUTH-423-001` exigiria travar uma conta real e deixar residuo em
`login_attempt` no `sep_dev` **compartilhado** — a suite backend nao e hermetica e o residuo produz
falsos vermelhos. `MFA-400-002`/`003` exigem conta com TOTP ativo. Os tres foram verificados na
**fonte** (`ApiExceptionHandler:222` chama `build(..., ex.getCodigo())`; `CatalogoCodigosErro`).

### Mutacao — 10 aplicadas, 10 mortas, 0 sobreviventes

Cada mutante aplicado individualmente, **conferido no disco apos gravar** e revertido; MD5 pos-
restauracao identico ao backup, efeito liquido zero.

| # | Mutante | Morto por |
|---|---|---|
| 1 | helper aceita campo nao-string | `api-error.spec`, `onboarding-error.spec` |
| 2 | helper aceita vazio/espacos | normalizacao de branco |
| 3 | `003`/`004` voltam ao legado | 6 testes do componente |
| 4 | `002` vira terminal | unit + DOM |
| 5 | codigo ausente vira terminal | fallback legado |
| 6 | remove barreira de reenvio | submit programatico |
| 7 | remove barreira da biometria | biometria pos-terminal |
| 8 | nao descarta o desafio morto | 2 testes |
| 9 | mock para de publicar `AUTH-423-001` | e2e MSW |
| 10 | mock **inventa** codigo no `401` | e2e MSW |

**9 e 10 so morrem no Playwright** — o MSW nao esta plugado no Vitest, entao nenhum teste unitario
prova o `handlers.ts`.

## Decisoes

1. **Helper antes do consumo.** A Task 218.2 e pre-requisito das seguintes, com aceite por `grep`:
   zero `as ApiErrorResponse` em producao fora do helper. A F-24 ja pagou essa conta com
   `estabilizar()` — 38 definicoes de um helper e 42 de outro.
2. **O login NAO ganha ramo por codigo.** Medido antes de decidir: o `423` ja navega para
   `/account-locked` desde a M-5 e `AUTH-423-001` nao mudaria acao. Os steps proibiam consumidor
   decorativo.
3. **`descartarDesafioMfa()` em vez de `clearSession()`.** Quem esta na verificacao TOTP nao tem
   sessao a derrubar; o unico estado obsoleto e o `mfaChallengeId`. Sem descartar, o
   `hydratePendingMfa` de uma reentrada ressuscitaria o desafio morto e a tela ofereceria o
   formulario de novo — a mesma armadilha por outro caminho.
4. **Estado terminal barra o envio, nao apenas esconde controles.** O template para de renderizar
   `<form>` e o botao de biometria, mas `submit()` e `tentarBiometria()` seguem alcancaveis.
5. **Sem lista local de codigos aceitos.** O perimetro publicado muda entre sprints e a Sprint 37 vai
   renomear parte dele; uma lista fechada faria o mobile recusar codigo novo em vez de degradar.
6. **Mock nunca deriva codigo de status.** Cada inclusao conferida contra o handler que a emite.

## Achados fora do plano

- **Defeito latente fechado de graca**: os call sites fazem `erro.set(mensagemDaApi(err) ?? 'padrao')`
  com template `@if (erro(); as msg)`. Uma `message` em branco vinda do backend deixava `erro('')`,
  o `@if` tratava como falsy e **a tela ficava muda depois do erro**. Nada no tipo do `sep-api`
  impede `""`: `DomainException` faz `super(mensagem)` sem validar e `@JsonInclude(NON_NULL)`
  suprime so `null`.
- **`ion-button` com `routerLink` renderiza LINK, nao button.** O e2e reprovou com
  `getByRole('button')` e o DOM snapshot mostrou `link "Voltar ao login" /url: /login`.
- **Nenhum spec deste repo renderizava `ion-input`.** O happy-dom entrega `MutationObserver` e
  `IntersectionObserver` como funcoes cujas **instancias nao tem `observe`**, e o `connectedCallback`
  do `ion-input` quebra com `TypeError: n.observe is not a function`. Polyfill **escopado ao spec**,
  nao no `test-setup.ts` global: promover mudaria o ambiente de 72 arquivos para servir a um.

## Dividas aceitas e follow-ups

- 🟢 **`npm audit` QUITADO no recorte high** (commit `147508b`). O CI-MOBILE reprovava na branch
  pushada com **22 vulnerabilidades (1 low, 13 moderate, 8 high)**; agora sao **10 (0 low, 10
  moderate, 0 high)** e o gate `--audit-level=high` sai **0**. Divida preexistente, herdada.
  `npm audit fix` **sem `--force`**, `package.json` intacto, ADR 0018/0019 preservados. Detalhe na
  secao propria abaixo.
- 🟡 **Restam 10 moderate**, declarados: presos ao major do `vitest 4` (`@vitest/mocker` → `vitest` →
  `@angular/build` → `@angular-devkit/build-angular`, `@vitest/coverage-v8`) ou a cadeia do
  `webpack-dev-server` (`qs`, `sockjs`, `uuid`). Abaixo do limiar do gate; sair deles exige `--force`,
  que os steps proibem.
- 🟡 **Back-merge `main -> develop` (`d82caaa`) ainda nao esta em `origin/develop`.** Esta branch sai
  dele; o push do back-merge e pre-requisito do PR.
- 🟢 **`sep-mobile` segue sem `contract:check`** — declarado fora de escopo pela spec. Nada gateia a
  divergencia entre o mock e o backend a nao ser a conferencia manual. A F-26 mostrou que **mesmo
  onde o check existe ele nao ve corpo de erro**, entao o buraco e o mesmo nos dois repos front.
- 🟢 **MSW nao plugado no Vitest** e mock **sem** `/auth/totp/verify` — follow-ups anteriores,
  inalterados.
- 🟢 **Escopo adiado pelo Gate M-16.0** (matching, aporte `POST`, chaves Pix) segue exigindo persona
  `FINANCEIRO`, que o mobile nao tem.

## Correcao do gate de audit (commit isolado)

O `npm run audit` reprovava no CI-MOBILE com **8 high**, divida preexistente que esta sprint herdou
e nao introduziu. Corrigido por `npm audit fix` **sem `--force`** — o `--force` instalaria
`vitest@4.1.11`, breaking.

**`package.json` ficou intacto; so o lock mudou** (+540/−384). Conferido **depois** da correcao:
`@angular/core` 20.3.27, `@ionic/angular` 8.8.11, `@capacitor/core` 8.4.0, `typescript` 5.9.3 e
`vitest` 3.2.7 inalterados. ADR 0018 (adia Angular 22) e ADR 0019 (Capacitor 8) preservados.

Fecharam `@xmldom/xmldom` (13 CVEs de injecao e ReDoS), `browserslist` (OOM, prototype write),
`fast-uri` (4 de SSRF/host confusion), `js-yaml` (CPU quadratica), `nanoid` (loop infinito) e
`image-size` (DoS nos parsers ICNS/JXL/HEIF), que arrastava `less` e `@angular-devkit/build-angular`.

**69 pacotes no lock, tres cruzando major**, os tres build-time e nenhum em `dependencies`:
`copy-anything` 2→3 e `is-what` 3→4 sob o `less`; `make-dir` 2→5 sob o `istanbul-lib-report`. O
`image-size` sumiu porque o `less` foi de 4.4.0 a **4.9.0** e trocou a biblioteca de dimensao por
`probe-image-size` — por isso `lint:scss`, `build` e `test:coverage` entraram na verificacao, que sao
os caminhos que `less` e `istanbul` tocam. Cobertura **87,3 / 88,35 / 80** (era 87,09 / 87,78 /
79,74). O **APK sai com 5.175.385 bytes, o mesmo tamanho de antes**: o bundle de runtime nao mudou.

**O gate morde**, provado e nao presumido: `--audit-level=moderate` sai **1** e `--audit-level=high`
sai **0**. Mesmo criterio que a D-Sprint 1 usou ao instalar o gate.

**Desvio declarado**: o precedente da F-Sprint 26 mandou a baseline vermelha para um PR proprio
(#143). Aqui a branch ja estava pushada e o CI ja vermelho nela, entao PR separado exigiria rebase;
ficou como **commit isolado de um unico arquivo** nesta branch, integralmente separavel na revisao.

**Correcao de estimativa**: esta sprint havia registrado que tres dos 8 high so sairiam com major do
`@analogjs/vite-plugin-angular`, e recomendado sprint propria com base nisso. A base de advisories
mudou entre a medicao e a esteira, `less`/`image-size` ganharam saida sem major, e a estimativa caiu.
Mesmo padrao das sprints de divida anteriores: **numero de registro perde para medicao fresca**.

## Commits

- `3e43cd4` feat(api): declarar codigo opcional no erro mobile
- `678b80c` refactor(api): unificar extracao segura dos erros mobile
- `9cc4817` feat(auth): distinguir falhas TOTP por codigo no mobile
- `4af4a37` test(mocks): alinhar codigos de erro mobile ao backend
- `b3d4e00` test(auth): verificar recuperacao TOTP e compatibilidade mobile
- `147508b` fix(deps): zerar vulnerabilidades high do lock do mobile

## Notas

Nada mudou em `sep-api` nem em `sep-app`. Push e PR sao **manuais**. Conferir o merge **por
conteudo**, nao por hash: foi assim que a Sprint 34 quebrou no back-merge e que a F-25 apareceu
defasada por 12 dias.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01CxnUKCzeHzyWnhh6qsKJpa
