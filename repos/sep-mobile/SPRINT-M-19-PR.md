# M-Sprint 19 — Central de notificacao no mobile

**Branch**: `feature/msprint-19-central-notificacao` (de `develop` `60a0540`)
**Spec**: [`219`](../../specs/fase-4/219-msprint-19-central-notificacao-mobile.md) ·
**Steps**: [`219`](../../steps-fase-4/mobile/219-msprint-19-steps.md)
**Escopo**: Fase 4, produto novo. Tela e consumo de contrato novo; sem endpoint, migration, regra de
negocio, ADR, plugin ou permissao nativa.

## Summary

O `sep-mobile` passa a ter a primeira superficie de notificacao, sobre o modulo `notificacao` da Sprint 38:
**sino com contador de nao lidas no header de toda pagina autenticada, central paginada, marcar como lida e
"Ver contrato"**.

**O que a pessoa ganha**: o desembolso Pix concluido — primeiro momento positivo do produto para o
tomador — vira aviso no celular, com leitura por gesto e caminho direto para o contrato. Quem so atua como
credora ve a central vazia com texto que explica o que aparece ali: com um gatilho ativo, esse e o caso
comum.

**Tres garantias, cada uma provada por mutacao:**

1. **Nunca mostra aviso de outra conta.** O recorte e do backend; no app, o store so expoe a contagem do
   usuario logado, descarta resposta de geracao vencida e apaga estado no fim da sessao. O mock filtra dono e
   canal `IN_APP` antes de paginar e contar, e o Playwright contra os handlers reais reprova se qualquer
   filtro sair. No smoke real, o aviso de outra conta deu `404 NTF-404-001` e seguiu nao lido no banco.
2. **Vazio nao se confunde com erro.** `200` com `content: []` e vazio; pagina fora do contrato e erro;
   pagina alem do fim oferece a ultima pagina valida.
3. **O contador nao desconta duas vezes.** Cada leitura guarda o marco de contagem do primeiro envio; so ha
   baixa local se nenhuma contagem chegou depois. Duas leituras concorrentes com recontagem e retry apos
   timeout que gravou tem teste desde a primeira versao — o P2 que a F-27 so achou no review humano.

**Sem push, de proposito.** Nenhum plugin, token, permissao, badge ou service worker novo; manifest e busca
conferidos. Pedir permissao antes de haver push queima a permissao uma vez so.

**Limite declarado**: **sem polling e sem tempo real**. O contador atualiza ao montar o shell, a cada entrada
na central e depois da leitura. Numero cuja reconsulta falhou fica na tela marcado como desatualizado no
rotulo.

## Mudancas por modulo

| Modulo | Mudanca |
|---|---|
| `core/api/api.models.ts` | `NotificacaoResponse` (`lidaEm`/`referencia` opcionais **e** nulos), `NotificacoesNaoLidasResponse`, tipos de enum |
| `core/notificacoes/notificacoes-mobile.service.ts` | transporte dos tres endpoints, sem parametro de dono |
| `core/notificacoes/notificacoes-nao-lidas.store.ts` | store root por dono: `carregar` deduplicado, geracao contra resposta vencida, situacoes `carregando`/`indisponivel`/`conhecida`/`desatualizada`, `leituraEnviada`/`registrarLeitura` com baixa unica por marco, descarte no fim da sessao |
| `layout/shell` | pede a contagem uma vez ao montar |
| `layout/header-mobile` | sino com rotulo textual e marcador (`99+`, `?`); navega para a central |
| `features/authenticated/notificacoes` | central: quatro superficies, paginacao, referencia `CONTRATO` por rota interna validada, leitura, anuncio e foco |
| `authenticated.routes.ts` | rota `notificacoes`, sem guarda de tomador ou credora |
| 6 specs de pagina com header | provider stub do store (o header agora o le) |
| `mocks/handlers.ts` | tres handlers owner-scoped, contas `tomadora.b@empresa.com` e `credora@empresa.com`, flag `mock.notificacoes.falhar` |
| `e2e/notificacoes-mobile.spec.ts` | 17 cenarios Playwright contra os handlers reais |

25 arquivos, **+3222 / −8**.

## Test plan

| Gate | Baseline (Gate M-19.0) | Resultado |
|---|---|---|
| Vitest | 575 / 72 | **673 / 76**, 0 falhas (cobertura 87,3% -> 88,2%) |
| Playwright | 45 | **62**, 0 falhas |
| `format:check` / `lint` / `lint:scss` / `build` | verdes | verdes |
| `npm audit` | 0 high, 10 moderate | idem |
| `cap sync android` / `gradlew assembleDebug` | verdes | verdes (APK 5.323.397 bytes) |

Bateria re-rodada sobre a arvore final depois de `npm ci` limpo. `tsc -p tsconfig.spec.json` com os mesmos
12 erros preexistentes, nenhum nos arquivos da sprint.

### Conferencia no APK dev-offline — 15 de 15

Emulador `sep-pixel` (API 36, 1080x2340, headless), service worker do MSW ativo no WebView; toque real por
`adb input tap`, back fisico por `keyevent 4`, DOM e foco pelo CDP do WebView.

- Login e sino "3 nao lidas"; header dentro da safe area.
- Toque no sino abre a central com foco no `h1`; sem rolagem horizontal; paginacao acima da tab bar ao rolar
  ate o fim.
- "Marcar como lida" baixa para 2 com anuncio; "Ver contrato" abre o detalhe.
- Back fisico volta a central (foco no `h1`, aviso lido); segundo back vai ao inicio sem sair do app.

### Smoke real contra `:8080` — 27 de 27

Perfil `dev`, `sep-api` na arvore `6b3aab2` (identica a `develop`), mobile **sem MSW**. Tres usuarios de
teste pela API; avisos semeados por SQL (onze `IN_APP` e um `EMAIL` para A, um `IN_APP` para B, um `EMAIL`
para C).

- A: contador e lista sem o e-mail; datas com microssegundos formatadas; referencia nula sem CTA e
  `CONTRATO` com CTA interno; duas paginas.
- Leitura na tela gravada no banco; remarcar devolve o mesmo `lida_em`.
- `404 NTF-404-001` para aviso de B, igual ao de inexistente, com o aviso de B nao lido no banco; e-mail do
  proprio A `404`; `401` sem token e sem codigo; `400 NTF-400-001` na faixa; `400` de UUID invalido sem codigo.
- Troca A -> B -> C sem heranca de contador ou lista; C com vazio; nenhum erro de CORS.

Dados apagados ao fim: base de volta a 0 usuarios, 0 notificacoes, 8335 registros de auditoria e 1963
`login_attempt`.

### Mutacao — 83 mutantes distintos

Cada mutante conferido no arquivo antes de rodar, morte aceita so com teste nomeado, restauracao conferida
por md5/`cmp`.

| Task | Mutantes | Resultado |
|---|---|---|
| 219.1 | dono na query; corpo do POST; verbo da contagem; pagina fixa | 4 mortos |
| 219.2 | geracao no sucesso e no erro; dedup; descarte no logout; dono no `computed`; falha que apaga numero; validacao do corpo; reconsulta que pisca; `finally` preso; rotulos de carregando/indisponivel como zero; marcador; teto `99+`; rota; guarda de usuario; shell sem contagem; `data-situacao` | 19 mortos; `catch` sem geracao **sobreviveu** e ganhou o teste que faltava |
| 219.3 | vazio como erro (template e TS); validacao da pagina; guardas da referencia (tipo, role, segmento, rota); geracao; contagem na entrada; foco na entrada e apos gesto; helper ignorado; data sem guarda; ultima pagina; rotulo "Nao lida" | 16 mortos |
| 219.4 | desconto sempre; sem baixa; negativo; marco renovado; nao invalida; marco parado; marco nao apagado; falha vira conhecida; desconto so em `conhecida`; guardas de voo e de lida; aviso ao store; sobreposicao; `id` e `lidaEm` da confirmacao; `404`; foco; `aria-disabled`; limpeza de falhas; anuncio; liberacao | 23 mortos; **1 equivalente** (`clear()` dos marcos); **1 sem alvo** (guarda redundante removida); dois sobreviventes da primeira rodada ganharam testes |
| 219.5 | filtro de dono e de canal na lista e na leitura; idempotencia; contagem com lidas; codigo inventado; `401`; ordem; persistencia; `404` revelando dono | 11 mortos pelo Playwright |
| 219.6 | reentrada sem recarga; foco na entrada; `role="status"`; foco no aviso; item mais largo que a tela; shell sem contagem; guarda de tipo do `mensagemDaApi` | 7 mortos; **1 equivalente** (`--padding-bottom`); o de largura **sobreviveu a primeira medicao** |

## Decisoes

1. **Servico em `core/notificacoes/`**, convencao do repo, e nao `core/api/` como os steps escreviam.
2. **Sino no `HeaderMobileComponent`, carga no `ShellComponent`**: no Ionic cada pagina tem o proprio
   `ion-header`; um controle no template do `ion-tabs` seria overlay.
3. **Situacao `desatualizada`** no store, sinalizada no rotulo do sino.
4. **Referencia vira CTA "Ver contrato"**, montada no app, com id validado e role `CLIENTE` da rota de
   destino; sem destino permitido, o aviso fica legivel e sem CTA.
5. **`200` da leitura so confirma com o mesmo `id` e `lidaEm`**; corpo diferente e falha com retry.
6. **`404` da leitura por status**, nao por `codigo`.
7. **Guarda de dono em `registrarLeitura` removida**: sobreviveu a mutacao porque o `computed` por dono e o
   `carregar` seguinte ja cobrem.
8. **Falha no e2e por flag do mock**, e nao por `page.route`.

## Achados fora do plano

- **`page.route` nao intercepta requisicao atendida pelo service worker do MSW.**
- **No Ionic, largura do documento nao mede transbordo do conteudo**: o `ion-content` recorta. O teste mede
  o documento e o scroll element do `ion-content`.
- **`toBe` entre elementos DOM estoura a memoria do worker quando falha** (OOM sem teste reprovando);
  assercoes de foco viraram comparacao booleana.
- **`chromium.connectOverCDP` nao conecta no WebView**; a conferencia usou CDP cru. Procedimento na skill de
  projeto `sep-mobile-apk-conferencia-emulador`.
- **CORS do perfil `dev` aceita `localhost:8100`, nao `127.0.0.1:8100`.**
- `develop` tinha o `eslint-plugin-jsdoc` 64 (Dependabot #163) sem registro no `STATE.md`.

## Dividas aceitas e follow-ups

- 🟡 **Playwright fora do `CI-MOBILE`**: owner-scope do mock, foco e largura so rodam localmente.
- 🟡 **Back fisico provado so no emulador**, sem teste versionado; sem aparelho fisico.
- 🟢 Marcador `?` e ausencia de marca visual para `desatualizada` (decisao de produto).
- 🟢 Copy do vazio e do subtitulo; concordancia de "pode estar desatualizado".
- 🟢 Role `CLIENTE` repetida entre a central e a rota do contrato.
- 🟢 Foco volta ao `h1`, e nao ao "Ver contrato", no retorno do contrato.
- 🟢 Duas contagens na primeira entrada quando a primeira falha rapido.
- 🟢 Alvo de toque de 40px no sino e no tema.
- 🟢 Contador nao reconsulta apos `404` + "Atualizar lista" (decisao aberta tambem no web).
- 🟢 Anuncio de leitura pode sair com outra pagina na tela.
- 🟢 Mock: `mock.auth` antigo esconde as contas novas no dev-offline; ordenacao textual; `lidaEm` em UTC.

## Commits

- `c9ff7df` feat(notificacoes): consumir contrato da central no mobile
- `202f381` feat(notificacoes): mostrar contador no shell mobile
- `589a59f` fix(notificacoes): corrigir comentario do marcador do sino
- `aabb07d` feat(notificacoes): criar central paginada e referencia interna
- `d895357` feat(notificacoes): marcar leitura e atualizar contador mobile
- `7af26a8` test(notificacoes): reproduzir central owner-scoped no MSW mobile
- `9cc2907` test(notificacoes): verificar central mobile e ausencia de push

## Notas

Nada mudou em `sep-api` nem em `sep-app`. Push e PR sao **manuais**. Conferir o merge **por conteudo**
(arvore `c3400eb` da branch), nao por hash, e rodar `git diff-tree --cc` no back-merge. O review humano de
fim de sprint ainda nao foi feito.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
