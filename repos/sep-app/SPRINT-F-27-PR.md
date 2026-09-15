# F-Sprint 27 — Central de notificacao no web

**Branch**: `feature/fsprint-27-central-notificacao` (de `develop` `ac0e24a`)
**Spec**: [`127`](../../specs/fase-4/127-fsprint-27-central-notificacao-web.md) ·
**Steps**: [`127`](../../steps-fase-4/web/127-fsprint-27-steps.md)
**Escopo**: Fase 4, produto novo. Tela e consumo de contrato novo; sem endpoint, DTO de escrita,
migration, regra de negocio ou ADR.

## Summary

O `sep-app` passa a ter a primeira superficie de notificacao, sobre o modulo `notificacao` da Sprint 38:
**sino com contador de nao lidas no header, central paginada e marcar como lida**.

**O que a pessoa ganha**: o desembolso Pix concluido — primeiro momento positivo do produto para o
tomador — deixa de ficar so no historico do backend e vira aviso visivel, com leitura por gesto.

**Tres garantias, cada uma provada por mutacao:**

1. **Nunca mostra aviso de outra conta.** O recorte e do backend (dono do token); no web, o contador so
   expoe a contagem do usuario logado e descarta estado e consulta em voo quando a sessao acaba. O mock
   MSW filtra dono e canal `IN_APP` antes de paginar e contar, e o Playwright contra os handlers reais
   reprova se qualquer um dos dois filtros sair.
2. **Vazio nao se confunde com erro.** `200` com `content: []` e vazio; resposta sem `content` e erro;
   pagina alem do fim nao afirma central vazia.
3. **Leitura consistente para quem le.** O item recebe o `lidaEm` do servidor, o contador baixa **uma**
   vez sobre numero conhecido e reconcilia; duplo clique, chamada direta e lista atrasada nao produzem
   segunda baixa nem ressuscitam aviso lido. Falha nao confirma nada.

**Review humano de fim de sprint: dois P2, corrigidos na branch.** (1) Com duas leituras em voo, a
recontagem pedida pela primeira confirmacao podia ja incluir a segunda, que descontava de novo — o contador
zerava com aviso nao lido se a recontagem seguinte falhasse. O store agora so desconta localmente quando
nenhuma contagem chegou depois do envio. (2) O sino somava 58px ao transbordo horizontal do header a 390px;
a causa de fundo era `width: 100%` + padding sem `border-box` no header e na sidenav empilhada (tambem no
desktop: 1328px a 1280). Documento agora sem rolagem horizontal de 360 a 1280px, com asserção no e2e.

**Limite declarado**: **sem polling e sem tempo real**, por decisao da spec. O contador atualiza ao montar
o shell, ao abrir a central e depois da leitura; entre esses momentos pode estar desatualizado, e a tela
diz isso.

## Mudancas por modulo

| Modulo | Mudanca |
|---|---|
| `core/api/api.models.ts` | `NotificacaoResponse` (`lidaEm`/`referencia` opcionais **e** nulos), `NotificacoesNaoLidasResponse`, tipos de enum |
| `core/notificacoes/notificacao.service.ts` | transporte dos tres endpoints, sem parametro de dono |
| `core/notificacoes/notificacoes-nao-lidas.store.ts` | contador root: `carregar` deduplicado, `leituraEnviada`/`registrarLeitura` com baixa unica coordenada por marco de contagem, descarte no fim da sessao |
| `layout/header` | sino com rotulo textual, marcador `99+`/`?`, `aria-current` na central; `border-box` e, ate 600px, padding menor sem nome/papel |
| `layout/sidenav` | `border-box` quando empilhada (ate 833px) |
| `features/authenticated/notificacoes` | central: quatro superficies, paginacao, leitura, anuncios e foco |
| `authenticated.routes.ts` | rota `notificacoes`, sem `roleGuard` |
| `mocks/handlers.ts` | tres handlers owner-scoped com seed de tomador (12 IN_APP + 1 e-mail), outra conta e contas vazias |
| `contracts/` | snapshot renovado do runtime `develop@98d427c`; tres operacoes consumidas; `erros: [404]` na leitura |
| `scripts/contract-check.spec.ts` | 5 testes contra o descriptor real |
| `e2e/notificacoes.spec.ts` | 6 cenarios Playwright contra os handlers reais |

21 arquivos, **+3046 / −21**.

## Test plan

| Gate | Baseline (Gate F-27.0) | Resultado |
|---|---|---|
| Vitest | 875 / 97 | **951 / 100**, 0 falhas |
| Playwright | 42 | **48**, 0 falhas |
| `contract:check` | 85 / 0 | **88 / 0** |
| `typecheck:spec` / `lint` / `lint:scss` / `format:check` / `build` | verdes | verdes |
| `npm audit` | 0 high, 4 moderate | idem |

Bateria re-rodada **depois dos commits** e de `npm ci` limpo, porque o `lint-staged` reescreve arquivos.

### Smoke real contra `:8080` — 19 de 19

Perfil `dev`, `sep-api` na arvore `6b3aab2` (identica a `develop`), web **sem MSW**. Dois usuarios de teste
cadastrados; dois avisos `IN_APP` e um `EMAIL` semeados por SQL para A (a origem por evento ja foi provada
no smoke da Sprint 38; este prova a UI no fio).

- Contador e lista de A sem o e-mail; `referencia` e `lidaEm` presentes e nulos no fio; ordem `criadaEm` desc.
- Leitura na tela, contador reconciliado, persistencia apos reload; remarcar preserva o `lidaEm`.
- `404 NTF-404-001` no e-mail do proprio A; `401` sem token; `400 NTF-400-001` com `size=101`.
- B: contador zero, central vazia, `404 NTF-404-001` ao marcar o aviso de A — que seguiu nao lido no banco.
- Nenhum erro de CORS; `lidaEm` com microssegundos formatado corretamente.

Dados apagados ao fim: base de volta a 0 usuarios, 0 notificacoes e 8335 registros de auditoria.

### Mutacao — 67 mutantes distintos

Cada mutante conferido no arquivo antes de rodar, morte aceita so com teste nomeado e sem erro de
compilacao, restauracao com MD5 igual ao backup.

| Task | Mutantes | Resultado |
|---|---|---|
| 127.1 | operacao ou `lidaEm` fora do descriptor; tipo errado em `marcarComoLida` (hotfix) | 3 mortos; o do hotfix sobrevivia a assercao anterior |
| 127.2 | guarda por dono no `computed`; descarte no fim da sessao; dedup; reconsulta que apaga valor; filtros de dono e `IN_APP` do mock; acesso sem sessao; polling dentro e fora da zona; marcador de indisponivel; cancelamento em `carregar` e `descartar`; `TokenResponse` tipado | 13 mortos; **2 sobreviventes** (guarda de usuario na chegada e contador de versao) viraram **remocao** das guardas |
| 127.3 | vazio como erro; malformado como vazio; `lidaEm` sem tolerancia; pagina pelo tamanho atual; alem do fim como vazio; sem cancelar; foco ao abrir; foco apos gesto; sem reconsultar contagem; HTML; retry sem efeito; extrator de erro; `role="list"` | 13 mortos; o de foco apos gesto **sobreviveu na primeira rodada** e expos teste vazio |
| 127.4 | baixa local; registro da leitura; piso zero; cancelar contagem em voo; reentrada; aviso ja lido; sobreposicao; timestamp local; falha que baixa; `404` com mensagem do backend; `disabled`; foco no titulo; desconhecida vira zero; liberacao da leitura em voo; `404` ausente do snapshot | 15 mortos |
| 127.5 | mock sem dono; sem `IN_APP`; sem `Authorization`; `lidaEm` sobrescrita; `403` para alheio; DTO vazando dono/canal; contagem sem leitura; paginar antes de filtrar | 8 mortos pelo Playwright |
| 127.6 | `aria-current`; anuncio de pagina; `disabled`; foco no titulo do aviso; foco ao abrir | 4 mortos no Vitest e no Playwright; **`disabled` so morre no Vitest** |
| Review P2 (1) | descontar sempre (o defeito); retry sobrescreve o marco; contagem nao avanca o marco; central nao registra o envio; descontar sem envio registrado | 5 mortos; os dois testes de reproducao falhavam antes da correcao (`0` onde era `1`, `1` onde era `2`) |
| Review P2 (2) | sem a regra de ate 600px; header sem `border-box`; sidenav sem `border-box` | 3 mortos no e2e estreito, cada um com a largura da propria causa (513, 422, 422) |

## Decisoes

1. **Servico em `core/notificacoes/`**, convencao do repo, e nao `core/api/` como a spec escrevia.
2. **Handlers MSW adiantados para a 127.2**: o Vitest usa MSW com `onUnhandledRequest: 'error'`, e o
   contador no header geraria requisicao nao tratada nos specs existentes.
3. **O `404` da leitura ramifica por status, nao por `codigo`**: uma condicao so nesta rota; ler
   `NTF-404-001` seria consumidor decorativo.
4. **Guardas que nao morrem por mutacao sairam**: o `computed` por dono e o `unsubscribe` ja cobriam.
5. **Paginacao por `totalElements`**; o `totalPages` do helper `paginar` do mock diverge do Spring com
   central vazia (1 contra 0) e nao e lido.
6. **Na duvida, o contador fica alto, nunca baixo** (review P2): uma confirmacao so desconta localmente se
   nenhuma contagem chegou depois do primeiro envio daquele aviso; senao, so a reconsulta decide.
7. **Ate 600px o header esconde nome e papel** (review P2), que a sidenav empilhada mostra no rodape. Com
   o menu recolhido no celular, a identidade nao aparece em lugar nenhum; "Sair" segue visivel.
8. **Contador nao reconsulta ao "Atualizar lista" apos `404`**: a spec fixa tres momentos de atualizacao;
   mudar isso e decisao de produto.

## Achados fora do plano

- **happy-dom nao move foco no clique** nem tira foco de botao desabilitado: um teste de foco passava
  provando nada, e `aria-disabled` so e provado pelo atributo.
- **Horario depende do fuso** (CI em UTC): testes afirmam so a data.
- **O `path` do corpo de erro repete a URL da requisicao** (tambem no backend): neutralidade do `404` e
  "igual ao de aviso inexistente", nao "sem o id no corpo".
- **Header a 390px**: o transbordo horizontal (455px antes do sino, 513px com ele) foi corrigido depois do
  review — tinha duas causas somadas, `width: 100%` + padding sem `border-box` e conteudo maior que a tela.
  Segue aberto o outro defeito, anterior a sprint: a navegacao SPA do
  login mantem `scrollY=160` com o header `sticky` em `top=-160`. Registrado no teste estreito.

## Dividas aceitas e follow-ups

- 🟡 **Playwright fora do CI-APP**: a prova de owner-scope do mock (e a de teclado e foco) so roda
  localmente.
- 🟡 **Header fora da tela apos o login a 390px**: a navegacao SPA herda `scrollY=160` e o header `sticky`
  fica em `top=-160` (anterior a sprint; o transbordo horizontal foi corrigido).
- 🟢 Sete copias de `formatarDataHora` com `Intl.DateTimeFormat`, uma por feature — consolidar junto de
  `idCurto`/`formatarMoeda`.
- 🟢 Contador desatualizado apos `404` + "Atualizar lista" (decisao de produto, ver Decisoes 8).
- 🟢 `SPRINT-F-28-PR.md` segue no `docs-SEP`: nao foi possivel confirmar seu uso no PR #151 (`gh` sem
  autenticacao).
- 🟢 Acentuacao da copy (`Notificacoes`, `nao lida`) segue a convencao ASCII do repo; decisao de produto
  aberta desde a Sprint 38.

## Commits

- `50a8b43` feat(notificacoes): consumir contrato da central no web
- `9fc7b08` test(notificacoes): endurecer asserções do contrato da central
- `b847b37` feat(notificacoes): exibir contador no shell autenticado
- `48cb4c5` test(notificacoes): tipar sessao e isolar listener nos specs do contador
- `4b1f995` feat(notificacoes): criar central paginada no web
- `fd9eca3` fix(notificacoes): manter semantica de lista da central no WebKit
- `317bd6b` feat(notificacoes): marcar leitura e reconciliar contador
- `87ae2b7` refactor(notificacoes): expor idDoTitulo como propriedade na central
- `96e6b0c` test(notificacoes): modelar central owner-scoped no MSW
- `cb0450e` feat(notificacoes): anunciar pagina e marcar sino na central, com e2e de acessibilidade
- `b7b0072` fix(notificacoes): nao descontar leitura ja refletida na contagem do servidor
- `164d351` fix(layout): impedir transbordo horizontal do header e da sidenav em telas estreitas

## Notas

Nada mudou em `sep-api` nem em `sep-mobile`. A M-19 (mobile) consome o mesmo contrato e segue
independente. Push e PR sao **manuais**. Conferir o merge **por conteudo** (arvore), nao por hash, e rodar
`git diff-tree --cc` no back-merge.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01XP14VSaGhJLBSPB6tFZcEQ
