# F-Sprint 24 - Divida tecnica do web (`sep-app`)

> Descricao temporaria do PR `feature/fsprint-24-divida-tecnica` -> `develop` no `sep-app`.
> Apagar apos o merge (ciclo de vida padrao).

## Summary

**Sprint de divida, sem escopo de produto novo**: nenhuma tela, endpoint, DTO, migration ou regra de
negocio. Fecha os follow-ups que a F-22 e a F-23 nomearam sem corrigir, os **dois defeitos vivos** que
elas deixaram, e leva o `contract:check` a **zero lacunas** — a primeira vez desde a criacao do gate
na F-Sprint 19 (2026-07-16).

Spec [`124`](../../specs/fase-4/124-fsprint-24-divida-tecnica-web.md) + steps
[`124`](../../steps-fase-4/web/124-fsprint-24-steps.md). Sem ADR. Nada mudou em `sep-api`/`sep-mobile`.

## Numeros

| Gate | Partida (Gate F-24.0) | Fim |
|---|---|---|
| Vitest | 765 / 93 arquivos | **802 / 94** |
| `contract:check` | 85 operacoes / **1 lacuna** | 85 operacoes / **0 lacunas** |
| Playwright | 39 | 39 |
| `lint`, `lint:scss`, `format:check`, `build` | verdes | verdes |
| `npm audit` (gate da D-1) | 3 `moderate` | 3 `moderate` (inalterado) |

**36 mutacoes** aplicadas e mortas ao longo das sete Tasks. Definicoes de helper de teste: **80 -> 2**.

## Os dois defeitos vivos, fechados

**1. O `errorInterceptor` arrancava o usuario da `/account-locked`.** A F-23 isentou
`/auth/politica-lockout` so no `authInterceptor`, o que impede o header de ser **enviado** mas nao a
resposta de ser **tratada** — o `errorInterceptor` e o ultimo da cadeia (`app.config.ts:24-28`), logo o
mais interno, e ve o erro antes do `catchError` do servico. Um `401`/`403` na consulta da politica
arrancava o usuario da pagina que o `423` acabara de abrir.

**2. O KPI do dashboard renderizava `NaNmin`.** `tempoMedioResolucao30d` era declarado `number`, mas o
backend serializa `Duration` como ISO-8601 (`"PT2H"`). A guarda `!segundos || segundos <= 0` nao pegava
a string, e `Math.round("PT2H" / 60)` dava `NaN`. Nenhum teste via, porque o mock devolvia `7200` — era
**mais correto que o servidor**.

## Mudancas por Task

| Task | Commits | Entrega |
|---|---|---|
| F-24.1 | `ee86e13`, `2cf81cc` | Lista de rotas publicas extraida para `core/interceptors/rotas-publicas.ts` e consultada tambem pelo `errorInterceptor` nos ramos `401`/`403`. O `423` **nao** consulta, de proposito: ele chega de `/auth/login`, que e rota publica, e e a navegacao que ABRE a `/account-locked`. Casamento pelo fim do `pathname`, nao `includes`. |
| F-24.2 | `eba5649`, `a9ef7e1` | `/auth/totp/verify` entra na lista: `handleTokenResponse` retorna cedo no ramo `mfaRequired` sem limpar o token, entao o desafio de MFA viajava com `Authorization` morto e o usuario o perdia. Ramo de `401` defensivo na tela. |
| F-24.3 | `ad7e09e`, `df320e0` | `message` vazia ou em branco cai no padrao, no helper compartilhado (cobre os 7 helpers de dominio de uma vez) e no `login`. **Dez pontos** em cinco componentes de `admin`/`profile` que duplicavam o corpo do helper passam a delegar. |
| F-24.4 | `9892936`, `a7b6f7d` | `tempoMedioResolucao30d` vira `string`, parse ISO-8601 sem biblioteca nova, mock alinhado, `knownGap` removido. **`contract:check` 1 -> 0.** |
| F-24.5 | `f2b28f5`, `3ea59bb` | `409` declarado em `assumir`/`resolver`/`ignorar`, `403` em `resolver`/`ignorar`, `404` em `filaDetalhe`. Operacoes com `erros`: 9 -> 13 de 85. |
| F-24.6 | `f5149d0`, `345b17e` | **38 `estabilizar` + 42 `flush`** em 44 specs viram uma de cada, em `src/testing/estabilizar.ts`. Commit isolado. |
| F-24.7 | `462320f` | Copy da `/account-locked` comparada elemento a elemento; tres literais byte-identicos entre `login` e `verify-totp` ganham origem unica. |

## Decisoes

1. **A lista de rotas publicas e compartilhada, e isso tem DOIS efeitos.** Acrescentar uma rota faz o
   `authInterceptor` parar de anexar `Authorization` **e** o `errorInterceptor` parar de navegar em
   `401`/`403`. Uma rota so entra se os dois forem desejados — por isso `/auth/refresh` e
   `/auth/logout`, ambos `permitAll`, ficam **de fora**: um `401` neles significa sessao morta e
   PRECISA navegar. Travado por teste.

2. **O `423` e assimetrico de proposito**, e o motivo esta no codigo: isentar rota publica ali mataria
   a unica navegacao que abre a `/account-locked`.

3. **O ramo de `401` do `verify-totp` existe mesmo sendo improduzivel hoje.** A improdutibilidade
   depende de **duas** pre-condicoes, e uma mora no outro repo (`SecurityConfig.java:82-83` manter o
   `permitAll`). Se cair, o `401` volta **sem `Authorization` no fio** e — como a rota tambem esta
   isenta no `errorInterceptor` — nao redireciona: o usuario ficaria preso no desafio lendo "Servico
   indisponivel". Tres linhas contra um beco sem saida.

4. **O parser de `Duration` aceita so `PT[nH][nM][nS]`.** `Duration.toString()` nunca emite componente
   de dias (`ofDays(365)` -> `PT8760H`, verificado na JDK 21 do projeto). Parsear ISO-8601 completo, ou
   trazer dependencia, seria complexidade sem caso de uso.

5. **O helper de teste MANTEM a drenagem em `flush(5)`.** Medido que e dispensavel — a suite passa com
   ela removida, e a mutacao de controle derruba 20 testes mesmo sem drenagem —, mas manter custa
   quatro linhas e o objetivo da Task era equivalencia, nao otimizacao.

## Nota tecnica — o que a sprint descobriu sobre o `contract-check.mjs`

Quatro pontos cegos, todos **medidos**, nenhum corrigido aqui:

1. Nao ha `kind` de `knownGap` para status de erro nao documentado; `verificarStatusDeErro` empurra
   falha dura, sem escape.
2. Mesmo que houvesse, o `varrerGapsObsoletos` (F-22) reprova **qualquer** gap que nenhuma operacao
   consuma — o fallback previsto nos steps era impossivel por dois motivos independentes.
3. E unidirecional: valida o que o front declara contra o OpenAPI, nunca o contrario.
4. Valida `declarado ⊆ documentado`, **nunca** `declarado = ramificado` — declarar `403` em
   `backoffice.assumir`, cuja guarda `exigeStepUp` exclui a acao, passa verde.

Como contrapartida: o gate **forca** o conserto do tipo e a remocao do `knownGap` no mesmo commit —
corrigir um sem o outro reprova nos dois sentidos. Bom desenho.

## Dividas aceitas

- **`400` de `backoffice.reprocessarWebhook` nao declarado.** O `@ApiResponses` do controller
  (`BackofficeReprocessoController.java:56-61`) publica so `201/401/403/429`, entao declarar quebra o
  check. O ramo do front esta certo: `@PathVariable UUID` mais um form que so valida `required` tornam
  o `400` alcancavel por UUID malformado. Vira follow-up, nos **dois** lados (ver abaixo).
- **Os ~20 pontos de ramificacao sem `erros`**: inventariados, nao fechados. Numero real **78**, nao 65
  — ver o inventario nos steps.
- **`idCurto`/`formatarMoeda` duplicados em 6 arquivos cada**: mesma familia da F-24.6, mas codigo de
  producao. Risco diferente, follow-up separado.

## Riscos declarados como pendencia, nao simulados

- **Smoke real contra `:8080` nao executado.** O vetor da F-24.1 e observavel offline (o MSW devolve
  `401` na rota da politica), mas o comportamento contra um backend real **sem a Sprint 34** — que e o
  cenario que motiva a correcao — fica sem prova de ponta a ponta.
- **`PT0S` esconde falha de banco.** O `resiliente(...)` do `ConsultarVisaoConsolidadaUseCase` engole
  `RuntimeException`, loga `WARN` no servidor e devolve `Duration.ZERO` — indistinguivel de "sem
  amostra" no fio. O travessao e honesto nos tres casos, mas quem olha o dashboard nao sabe a
  diferenca. **E limitacao do backend, nao do web.**

## Follow-ups abertos por esta sprint

1. **`handleTokenResponse` nao limpa o token no ramo `mfaRequired`** (`auth.service.ts:124-128`). A
   isencao da F-24.2 neutraliza a consequencia, nao a causa. O remedio obvio tem raio maior que a
   Task: limpar ali deslogaria quem esta autenticado e abre a tela de login em outra aba. Exige
   analise propria.
2. **Frontend**: `Validators.pattern` de UUID em `reprocessos-page.component.ts:45` e `:50-51`. Mais
   barato que o item 3 e sob nosso controle; **se feito primeiro, torna o item 3 desnecessario para
   fins de declaracao**.
3. **Backend**: publicar `400` no `@ApiResponses` do endpoint de webhook. Candidato a Sprint 35.
4. **`contract-check.mjs`**: os quatro pontos cegos acima. Sprint propria.
5. **`CONTA_BLOQUEADA_FALLBACK` embute "30 minutos" fixo**, enquanto `lockout-minutes` e sobrescrivel
   por ambiente — mesmo defeito que a F-23 corrigiu na `/account-locked`. Agora que ha uma constante
   so, consertar ficou barato.
6. **`404` do `/auth/totp/verify` cai no `default:`** (`VerificarTotpUseCase.java:92` lanca
   `UsuarioNaoEncontradoException` quando o challenge aponta para usuario removido). Pre-existente,
   fora do OpenAPI e do descriptor.
7. **`src/testing/estabilizar.ts` serve dois exports** e leva o nome de um. Renomear custa 44 imports;
   fazer so se o arquivo for tocado de novo.

## Notas

**Nenhum numero de planejamento sobreviveu a medicao intacto**, e o padrao se repetiu nas sete Tasks:

- Gate: `estabilizar` nao eram "39 byte-identicas" — eram **38, com tres corpos**, e a identidade
  textual escondia um **segundo** helper duplicado (`flush`, 42 definicoes, dois defaults).
- F-24.3: o produtor de `message: ""` **nao** e o caminho de erro do Spring. Medido no bytecode do
  `spring-boot-3.5.5.jar`: `ErrorAttributeOptions.retainIncluded` faz `Map.remove` da chave. Quem pode
  emitir branco e o `ErrorResponseDto` da propria aplicacao, porque `DomainException` nao valida a
  mensagem.
- F-24.4: os comentarios falsos eram **cinco**, nao tres — dois estavam fora de `sep-app/src`, no
  `README.md` do repo e no registro da F-10 em `CONTEXT-PARTE-2.md`.
- F-24.5: o alvo da Task nao era declaravel e o fallback prescrito era impossivel.
- F-24.6: a propria afirmacao desta sprint sobre settle time era autocontraditoria.
- F-24.7: "reformatacao quebra o teste" era so meia verdade — reindentar passava; o que quebrava era
  quebra de linha **dentro** do `<span>` do badge.

**Tres erros de execucao, registrados por honestidade de processo**: (a) um regex de deduplicacao
retrocedeu e apagou 68 linhas de um spec — pego conferindo o `git diff`, nao os testes, e refeito por
linha com guarda; (b) uma contagem de mutacao reportada como 8 quando era 14, por `head -8` truncar a
saida; (c) previsao de bloat no bundle pelo helper de teste, desmentida pela medicao (tree-shaking).

## Commits

```
345b17e docs(test): corrigir a afirmacao de settle time e excluir o helper da cobertura
462320f refactor(public): unificar literais de erro e tornar a copy robusta a reformatacao
3ea59bb chore(contracts): declarar o 403 de step-up e o 404 do detalhe da fila
f5149d0 refactor(test): extrair estabilizar() e flush() para helper unico
f2b28f5 chore(contracts): declarar o 409 das mutacoes de fila do backoffice
a7b6f7d fix(backoffice): registrar as tres causas de PT0S e tratar a faixa sub-minuto
9892936 fix(backoffice): tratar tempoMedioResolucao30d como Duration ISO-8601
df320e0 fix(core): corrigir a causa registrada de message em branco e guardar o tipo
ad7e09e fix(core): tratar message vazia ou em branco como ausente na extracao de erro
a9ef7e1 fix(verify-totp): tratar 401 como fallback defensivo e corrigir a prova registrada
eba5649 fix(core): isentar /auth/totp/verify do Authorization no authInterceptor
2cf81cc fix(core): ancorar rotas publicas no pathname e travar as exclusoes
ee86e13 fix(core): isentar rotas publicas da navegacao global do errorInterceptor
```

## Test plan

- [x] `npm ci` — exit 0
- [x] `npm run format:check` · `npm run lint` · `npm run lint:scss` — exit 0
- [x] `npm run contract:check` — **85 operacoes / 0 lacunas**, exit 0
- [x] `npm test` — **802 testes / 94 arquivos**, exit 0
- [x] `npm run build` — exit 0
- [x] `npx playwright test` — **39**, exit 0
- [x] `npm run audit` — exit 0 (3 `moderate` residuais da D-1, todos so corrigiveis em major)
- [ ] Smoke real contra `:8080` — **nao executado**, ver §Riscos
