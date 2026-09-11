# Sprint 37 — Normalizar a taxonomia de codigos de erro

**Branch**: `feature/sprint-37-normalizacao-codigos-erro` (de `develop` `a774aa4`)
**Spec**: [`037`](../../specs/fase-4/037-sprint-37-normalizacao-taxonomia-erro.md) ·
**Steps**: [`037`](../../steps-fase-4/backend/037-sprint-37-steps.md) ·
**ADR**: [`0020`](../../adr/0020-convencao-codigos-de-erro.md)
**Escopo**: Fase 4, divida de contrato. Sem tela, endpoint, migration, evento, provider ou regra de
negocio nova.

## Summary

A Sprint 36 publicou 80 codigos de erro no campo `codigo` e deixou 53 fora do perimetro — por
formato (sufixo semantico, prefixo de duas letras) ou por colisao (o mesmo codigo para duas
condicoes, ou o mesmo prefixo em dois modulos). Esta sprint torna o resto apto **sem mudar
contrato**: nada do que ela renomeia estava publicado, e os 80 seguem com o mesmo valor e o mesmo
dono.

- **Convencao decidida** (ADR 0020): o prefixo e uma area funcional com um modulo dono — o `credito`
  sai de `CRD` (que fica com o `credores`) para `PRP` —, o sufixo e numerico, e numero retirado nao
  volta. **Mesma acao do cliente = mesma condicao = um codigo.**
- **Colisoes resolvidas**: condicoes duplicadas viram excecao nomeada unica
  (`SolicitacaoNaoEmpresaException`, `WebhookHeaderObrigatorioException`,
  `IdempotencyKeyConflitanteException`...); condicoes distintas sob o mesmo codigo ganham codigo
  proprio.
- **Catalogo de 80 para 143.** Particao `144 = 143 publicados + 1 excluido`; o excluido e
  `AUTH-403-001`, que o filtro de redefinicao de senha escreve direto na response.
- **Gate no build**: `PrefixoCodigoErro` registra os 13 prefixos, e `ConvencaoCodigosErroTest`
  reprova formato, prefixo fora do registro ou do modulo dono, numero aposentado e ponto de
  lancamento que a particao nao consegue ler. `CodigosPublicadosNaoMudamTest` congela os 143.

**Nenhuma tela muda.** O valor e o catalogo apto e publicavel: 63 condicoes passam a sair com
`codigo` no corpo, o que da ao `sep-app` e ao `sep-mobile` onde ramificar. Status HTTP e mensagens
nao mudam, com uma excecao declarada abaixo.

## Mudancas por Task

| Task | Mudanca |
|---|---|
| 37.2 | `ONB-400-008` numa excecao nomeada; o `credito` reusa `OnboardingNaoEncontradoException` (`ONB-404-001`) |
| 37.3a | colisoes intra-modulo separadas: `COB-409-004`, `USR-400-003`/`004`, `CpfInvalidoException`, `CnpjInvalidoException`, `DocumentoSemConteudoException` (`ONB-400-017`), `ArquivoIlegivelException`, `ONB-400-019` |
| 37.3b | validacao de recepcao de webhook em seis controllers consolidada em `WHK-400-003`/`004`/`005` |
| 37.4 | `credito` de `CRD` para `PRP`; `StatusPropostaInvalidoException` passa a emitir o proprio codigo; webhook Open Finance em `WHK` |
| 37.5 | 28 codigos do `pix` e o `AUTH-403` de sufixo semantico para numerico; `ChavePixInvalidaException` e a familia `IdempotencyKey*` no `pix` |
| 37.6 | `PrefixoCodigoErro` + `ConvencaoCodigosErroTest` |
| 37.7 | 80 anteriores provados intactos; amostra fixa de excluidos trocada pela garantia composta; linha do `pix` na matriz |

O mapa completo antes -> depois esta no [`CODIGOS-DE-ERRO.md`](./CODIGOS-DE-ERRO.md).

## Test plan

| Gate | Baseline (Gate 37.0) | Resultado |
|---|---|---|
| `./gradlew clean build` (inclui `spotlessCheck`) | 2297 / 0 | **2318 / 0** |
| Particao | 133 = 80 + 53 | **144 = 143 + 1** |
| 80 publicados antes da sprint | — | todos publicados, **mesmo dono** de `a774aa4` (medido codigo a codigo) |
| `sep-app` `contract:check` | — | nao afetado: `ApiErrorResponse.codigo` e `enumSubset` (pertinencia), o catalogo pode crescer |

**Smoke real contra `:8080`**: nao feito. A mudanca no fio e aditiva e esta coberta por
`MatrizFinalDeErroTest` (handler emite o codigo publicado) e pelos testes de controller que assertam
`$.codigo`.

### Mutacao

Cada mutante conferido no diff antes de rodar, morte aceita so com teste nomeado e zero erro de
compilacao, restauracao com MD5 igual ao backup e trap contra interrupcao.

| Task | Mutantes | Destaque |
|---|---|---|
| 37.3b + hotfix | 4 + 6 | mensagens de webhook byte-identicas; checagens de body vazio antes sem teste |
| 37.4 | 6 | subtipo emitindo o codigo do pai so morreu no teste de comportamento |
| 37.5 | 7 | o `SmokeE2ETest` e o unico guarda do texto do 403 de redefinicao de senha |
| 37.6 + hotfix | 8 + 5 | 3 casos so o gate pega; codigo sem `COD` no nome passava silencioso ate o hotfix |
| 37.7 + hotfix | 4 + 3 | rename consistente no fonte e no catalogo so a lista congelada pega |

## Decisoes

1. **Zero mudanca de contrato** como restricao, nao meta. As duas recomendacoes originais da spec
   cairam na medicao porque renomeariam codigos publicados.
2. **Publicar na propria sprint**: a particao exige `aptos == catalogo`, entao normalizar sem publicar
   e estruturalmente impossivel.
3. **Mesma acao do cliente = mesma condicao** (decisao do responsavel pelo repo).
4. **Idempotency-Key unificada dentro do `pix`**; entre modulos exige renomear publicado e fica para
   sprint de contrato.

## Achados fora do plano

- **`OF-400-001` nao foi para `PRP`**: eram as quatro checagens de webhook ja consolidadas em `WHK`.
- **`StatusPropostaInvalidoException` declarava um codigo que nunca usava**: toda transicao invalida
  saia com o codigo de `PropostaInvalidaException`.
- **`RegistrarParecerUseCaseTest` era um arquivo vazio desde a Sprint 8.**
- **As guardas tinham dois pontos cegos, pegos no code review e provados por mutacao**: constante de
  codigo sem `COD` no nome sairia do contrato sem nada reprovar, e o rename consistente de um codigo
  novo passava em 257 testes.

## Mudanca de texto no fio (declarada)

O 403 do `PasswordResetEnforcementFilter` muda de `AUTH-403-PASSWORD_RESET_REQUIRED: ...` para
`AUTH-403-001: ...` dentro da `message`. O campo `codigo` segue ausente nesse corpo. Nenhum front le
esse texto (medido no `sep-app` e no `sep-mobile`); o redirect de troca de senha usa o claim do JWT.

## Dividas aceitas e follow-ups

- 🟡 **Idempotency-Key com codigos em tres modulos** (`PIX-400-006`/`007`/`PIX-409-004` x
  `CRD-400-003`/`004` x `COB-400-001`/`COB-409-004`), e o limite de 100 caracteres escrito em cada um.
  Unificar e mudanca de contrato.
- 🟢 `AUTH-403-001` no campo `codigo` exige o filtro montar o corpo pelo caminho do handler.
- 🟢 Ligar `PrefixoCodigoErro` ao `CatalogoCodigosErro.validar`, para falhar tambem no boot.
- 🟢 A regra de `super(` do gate depende do sufixo `Exception.java` no nome do arquivo.
- 🟢 Construtor de dois argumentos sem chamador em `StatusPropostaInvalidoException`; testes de
  controller do `pix` montando excecao com literal em vez da classe nomeada.
- 🟢 O snapshot OpenAPI do `sep-app` cresce na proxima renovacao; os fronts podem passar a ramificar
  pelos codigos novos em sprints proprias.

## Commits

- `dcd4463` refactor(onboarding): unificar condicoes duplicadas de codigo de erro
- `99301b9` refactor(erros): separar codigos que identificavam mais de uma condicao
- `c2455b1` refactor(webhooks): consolidar validacao de requisicao de webhook em WHK
- `ce437e9` test(webhooks): cobrir body vazio, assinatura do Pld e provider em branco
- `2655d39` refactor(credito): mover codigos de erro para o prefixo PRP
- `36bd051` refactor(pix): converter codigos de erro semanticos para numericos
- `a56b5f5` test(erros): gatear formato, prefixo e dono dos codigos no build
- `540c0fb` test(erros): gate ler constante com a mesma regra da particao
- `5f8a5b1` test(erros): provar que o contrato anterior a Sprint 37 segue publicado
- `d4a1d72` test(erros): congelar os 143 codigos publicados

10 commits, **88 arquivos, +1441 / −244** (`a774aa4..d4a1d72`).

## Notas

Nada mudou em `sep-app` nem em `sep-mobile`. Push e PR sao **manuais**. Conferir o merge **por
conteudo**, nao por hash.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01YRcEjyW8RtSU6YXXuHZRKM
