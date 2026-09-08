# Sprint 36 — Publicar a taxonomia de codigos de erro no fio

> Descricao **temporaria** para montar o PR real. Removida ao iniciar a sprint seguinte
> (regra do [`AGENT.md`](../../AGENT.md)).

**Status**: **MERGEADA develop+main em 2026-09-08** — PR **#107** (squash `452a09f`, back-merge
`a774aa4`) e PR **#108** (`042949b`). `develop` == `main` por conteudo, e a arvore dos dois
byte-identica a da branch que passou nos gates (tree `89441ab`), conferida **depois** do back-merge.
**Branch**: `feature/sprint-36-codigos-erro`, a partir de `develop` `17bd72d`
**Spec**: [`036`](../../specs/fase-4/036-sprint-36-codigos-erro-no-fio.md) ·
**Steps**: [`036`](../../steps-fase-4/backend/036-sprint-36-steps.md)
**Desbloqueia**: [`126`](../../specs/fase-4/126-fsprint-26-consumo-codigos-erro-web.md) (F-26, web) e
[`218`](../../specs/fase-4/218-msprint-18-consumo-codigos-erro-mobile.md) (M-18, mobile)

Sem endpoint, migration, evento, provider, regra de negocio ou ADR novo. Nada mudou em `sep-app` nem
em `sep-mobile`.

## Resumo

O `sep-api` construia uma taxonomia de erro no dominio e a **descartava na fronteira HTTP** —
`getCodigo()` tinha zero consumidores em `src/main`. Esta sprint faz a parte apta dessa taxonomia
atravessar o fio, por um campo `codigo` opcional no corpo de erro, e publica o subconjunto no OpenAPI
com perimetro explicito sobre o que ficou de fora e por que.

**80 codigos publicados, 53 excluidos, 133 no total.** A particao e recalculada a cada
`./gradlew build`, e nao lida de documento.

## O que o Gate 36.0 derrubou

Cinco sprints de divida seguidas tiveram numero ou premissa derrubados no Gate. Esta manteve o
padrao, com **sete** correcoes:

| Item | Spec 036 dizia | Medido |
|---|---|---|
| Codigos unicos | ~103 | **133** |
| Prefixos | 12 | **13** (entra `OF`) |
| `build()` e ponto unico de montagem (§Ancora 4) | sim | **nao — 5 construcoes** |
| Colisoes | 12 | **16** |
| Violacoes de formato | 12 | **31** |
| Codigos `private` | 12 | **26** |
| Handlers sem codigo | 10 de 16 | **13 de 17** |
| Orfaos `BOF-*` | possivelmente inalcancaveis | **alcancaveis** |

A **§Ancora 4 e a que teve consequencia de escopo**: `ErrorResponseDto` e montado em cinco lugares.
Quatro sao filtros e entry points do Spring Security (`ApiAccessDeniedHandler`,
`ApiAuthenticationEntryPoint`, `RateLimitFilter`, `PasswordResetEnforcementFilter`) que escrevem o
corpo direto na response e **nunca chegam ao `@RestControllerAdvice`**. `401`, `403` e `429`
originados na cadeia de seguranca seguem sem codigo — limitacao declarada, nao omissao.

O caso que prova a demanda: `PasswordResetEnforcementFilter:109` concatena
`AUTH-403-PASSWORD_RESET_REQUIRED` **dentro da `message`**. O codigo ja chegava ao cliente por
contorno, porque nao existia campo para ele.

## Entregas por Task

| Task | Commit | Entrega |
|---|---|---|
| 36.1 | `ae6dc6c` | `codigo` opcional no `ErrorResponseDto`; `of/5` preservada |
| — | `fa2177e` | hotfix dos 3 achados 🟢 do review da 36.1 |
| 36.2 | `b139443` | `handleDomain` propaga; matriz exaustiva dos 5 subtipos selados |
| 36.3 | `1f79549` | `CTR-422-CCB-001` → `CTR-422-004` |
| 36.4 | `78e880a` | `AUTH-423-001`, `BOF-429-001`, `BOF-400-002` publicados |
| 36.5 | `2af6194` | `CatalogoCodigosErro` + `OpenApiCustomizer` global |
| 36.6 | `c40eab8` | matriz consolidada + **correcao de vazamento de perimetro** |
| 36.7 | `0f92316` | `ParticaoDeCodigosErroTest` + doc operacional |
| review | `d5f0569` | **7 codigos ambiguos retirados do catalogo**; criterio de unicidade corrigido |

## Defeito que a sprint achou nela mesma

A coluna "catalogada/excluida" que o Step 036.6.1 exige revelou que a **Task 36.2 vazava codigos
fora do perimetro para o fio**.

`OwnershipPropostaException` carrega `CRD-403-001`, excluido por colisao — significa "proposta de
outro tomador" no modulo `credito` e "credora de outro dono" no `credores`. Ela herda de
`AcessoNegadoException`, entao chegava ao `handleDomain` normalmente e o `ex.getCodigo()` emitia o
valor. O corpo saia com um codigo **fora do `enum` declarado no OpenAPI** — a resposta violava
o proprio schema publicado — e entregava ao cliente um identificador ambiguo como se fosse estavel.

Corrigido por `somenteSePublicado` no `build`, uma linha num lugar so. Com ela o
`CatalogoCodigosErro` governa **documento e fio**, o que torna "fonte unica" verdadeiro em vez de
aspiracional.

**Efeito colateral do conserto**: os fixtures da matriz da 36.2 usavam `USR-400-001`, `ONB-404-001` e
`CRD-403-001` — os tres excluidos. O filtro expos isso; antes o teste passava afirmando que codigo
excluido chegava ao corpo.

## Achado do code review de fechamento — 7 codigos ambiguos publicados

O review humano achou o que nenhuma guarda desta sprint pegava: **`ONB-400-004` foi publicado como
identificador estavel, mas representa duas condicoes na mesma classe** —
`EnviarDocumentoUseCase:52` o lanca para "Conteudo do documento e obrigatorio" e
`EnviarDocumentoUseCase:62` para "Documento excede o tamanho maximo permitido". A constante chama-se
`CODIGO_TAMANHO_EXCEDIDO` e cobre um caso que nao e de tamanho.

**A causa e a operacionalizacao do criterio, nao o caso isolado.** A `ParticaoDeCodigosErroTest`
media unicidade por **classe dona** — um `Set<String>` de nomes de arquivo. Duas condicoes no mesmo
arquivo colapsavam num dono so e passavam. Classe nao implica condicao.

Medida a classe inteira do defeito: **sete** codigos publicados estavam nessa situacao —
`ASN-400-001`, `ONB-400-002`, `ONB-400-004`, `ONB-400-014`, `ONB-400-015`, `PIX-400-002` e
`WHK-400-002`. Os quatro ultimos sao familias de webhook em que o mesmo codigo cobre "body ausente",
"body nao e JSON" e "header obrigatorio ausente" — condicoes que exigem acoes diferentes do cliente,
que e exatamente a discriminacao que esta sprint existe para dar.

**Correcao**: a unicidade passou a ser medida por **assinatura de condicao** — a mensagem de cada
ponto de lancamento —, com uma distincao que a primeira versao nao fazia:

- dentro de uma **classe de excecao**, os `super(CODIGO, ...)` dos construtores sobrecarregados sao
  variantes de mensagem da **mesma** condicao, porque a classe e que a nomeia. `CobrancaOwnershipException`
  tem duas: uma cita o contrato, a outra e generica de proposito para nao vazar existencia de recurso;
- num **literal inline** em use case ou controller nao ha classe que nomeie nada, e ali cada mensagem
  distinta e uma condicao distinta.

Sem essa distincao a guarda excluia mais sete codigos legitimos (`BOF-409-001`, `COB-403-001`,
`COB-404-003`, `COB-409-001`, `CTR-409-001`, `CTR-422-001`, `ONB-400-001`), todos overloads de
construtor. **Duas medicoes independentes convergiram nos mesmos sete** depois que a regra ficou
certa.

Catalogo **87 -> 80**, excluidos **46 -> 53**. Guarda nova: `nenhumCodigoPublicadoIdentificaMaisDeUmaCondicao`.

**O que isto custou aprender**: a primeira versao da particao usava um **proxy** (nome do arquivo)
para uma propriedade semantica (identidade de condicao). O proxy passou em toda mutacao que apliquei,
porque as mutacoes testavam o mecanismo — e nao a adequacao do criterio ao que ele deveria medir.
Mutacao valida implementacao; nao valida definicao.

## Contrato

Corpo com codigo publicado ganha a propriedade; corpo sem codigo mantem **as seis propriedades
anteriores, sem `codigo: null`** (`@JsonInclude(NON_NULL)`). Consumidor que ignora o campo nao
percebe a sprint.

Documento OpenAPI antes → depois:

| | antes | depois |
|---|---|---|
| `openapi` | 3.1.0 | 3.1.0 |
| paths | 98 | 98 |
| schemas | 152 | 152 |
| `description` | 795 | **796** |
| `example` | 137 | **138** |
| `securitySchemes` | `bearerAuth` | `bearerAuth` |
| enum de `codigo` | — | **80** |

O crescimento e exatamente a propriedade nova. **Nada foi apagado** — a regressao dirigida existe
porque a Sprint 35 Task 35.7 perdeu 21 `description` e 17 `example` em silencio ao registrar um
`ModelResolver` proprio. Aqui o resolver **nao** e tocado: o `OpenApiCustomizer` edita o documento ja
pronto.

`contract:check` do `sep-app`: **85 operacoes / 0 lacunas**, verde contra o snapshot versionado e
contra o documento novo do runtime. **Nenhum arquivo do `sep-app` foi tocado.** O verde nao prova que
o web enxerga o campo — medido, as tres ocorrencias de `"codigo"` em `consumed-contracts.json` sao o
codigo TOTP de seis digitos. Consumir e escopo da F-26.

## Test plan

```
./gradlew clean build     EXIT=0
./gradlew spotlessCheck   EXIT=0
```

**2262 → 2297 testes** (+35), **363 → 368 classes** (+5), 0 falhas, 0 erros, 0 skipped.

| Suite | Cobre |
|---|---|
| `ErrorResponseDtoTest` | serializacao com e sem codigo, via `@JsonTest` |
| `DomainExceptionCodigoNoCorpoTest` | os 5 subtipos selados, individualmente, + guarda de exaustividade |
| `ApiExceptionHandlerTest` | `423` com codigo e `Retry-After` em testes **separados**; os dois `BOF-*` |
| `MatrizFinalDeErroTest` | matriz consolidada: status, codigo, headers, pertencimento ao catalogo |
| `CatalogoCodigosErroContratoTest` | catalogo no OpenAPI, opcionalidade, regressao de description/example/security |
| `ParticaoDeCodigosErroTest` | particao completa e disjunta; catalogo == codigo-fonte |
| `ContratoAssinaturaControllerTest` | `CTR-422-004` no caminho HTTP real |

## Mutacoes

**26 aplicadas, 26 mortas, 0 sobreviventes** (24 nas Tasks, 2 no hotfix do review). Cada uma com prova de que entrou no arquivo antes de
rodar — `git diff --numstat` ou `assert` no patch.

A campanha final da Task 36.6 sao 9 dirigidas, rodadas por script sobre o estado final: remover a
propagacao no `build`, literal fixo no `handleDomain`, remover o codigo do `423`, remover o
`Retry-After`, serializar `codigo: null`, remover um subtipo da matriz, inserir um excluido no
catalogo, remover um publicado do catalogo e desligar o filtro de perimetro.

**Duas licoes de mutacao, ambas caras:**

1. **Mutacao que nao aplica produz verde falso.** A primeira tentativa de "remover a propagacao no
   `build`" nao casou o padrao, porque o `spotlessApply` reflowou a chamada para uma linha. A suite
   ficou verde e o resultado quase foi lido como mutante sobrevivente. Desde entao toda mutacao
   imprime a prova de que entrou.
2. **Mutante que sobrevive por tautologia.** No checkpoint da Task 36.5, "retirar um codigo do
   catalogo" **nao** foi morta pelo teste de igualdade com a fonte unica: documento e expectativa
   derivavam da mesma lista. So o spot-check dos tres MFA a pegou. A fraqueza fechou na Task 36.6 —
   com o catalogo virando gate de runtime, remover um codigo dele quebra os testes que provam o
   codigo chegando ao fio.

## Perimetro — o que ficou de fora e por que

```
133 unicos = 80 publicados + 53 excluidos      intersecao = 0
excluidos: 30 formato · 23 colisao · 0 inalcancavel
```

**30 de formato**: 28 do modulo `pix` mais `AUTH-403-PASSWORD_RESET_REQUIRED` e `OF-400-001`. No
`pix` o sufixo semantico e **majoritario** (28 de 31), entao chamar isso de desvio inverte os papeis:
quem foge da convencao local sao os tres numericos.

**23 de colisao**, medidos e decompostos em dois grupos. **16 entre classes**: **9** de faixa
compartilhada (`credito` x `credores`), **2** de duplicacao com significado identico (`ONB-404-001`,
`ONB-400-008` — corrigem-se por deduplicacao, nao renumeracao) e **5** de colisao real intra-modulo.
E **7 dentro da mesma classe**, achados no code review de fechamento: o mesmo valor lancado para
condicoes diferentes no mesmo arquivo (ver §Achado do code review).

`ONB-400-007` mudou de classificacao: a §Ancora 7 da spec o tratava como duplicacao benigna, mas sao
**tres** sites, e o terceiro (`IniciarOnboardingEmpresaUseCase:86`) usa o valor para "campo
obrigatorio". Colisao real.

Lista completa, codigo a codigo, com classe dona, modulo e motivo:
[`CODIGOS-DE-ERRO.md`](./CODIGOS-DE-ERRO.md).

## Riscos e dividas aceitas

- **`401`/`403`/`429` da cadeia de seguranca seguem sem codigo** — os quatro pontos de montagem fora
  do handler. Fora do escopo por decisao: nenhum carrega codigo canonico, e dar-lhes um cairia na
  proibicao de inventar taxonomia.
- **13 dos 17 handlers seguem sem codigo.** Escopo declarado: o front ganha discriminacao onde o
  dominio ja discriminava, e continua sem onde o dominio tambem nao discrimina. Criar codigos novos
  e decisao de produto e depende das personas, que nao existem.
- **Os 53 excluidos nao chegam ao cliente** ate a Sprint 37 decidir convencao de sufixo e resolver as
  colisoes (ela preve ADR). A lista desta sprint e o insumo que a dimensiona.
- **O catalogo e lista literal**, porque 46 dos 133 codigos existem so como literal inline e 19 dos
  publicados sao `private`. Referenciar as constantes exigiria alargar visibilidade em 19 classes, o
  que a spec proibe. A nao-divergencia e garantida por `ParticaoDeCodigosErroTest`, nao pelo
  compilador — escolha declarada.
- **Snapshot OpenAPI do `sep-app` nao renovado.** Ja era follow-up aberto que produz diff de ~43
  schemas; renovar aqui esconderia a mudanca desta sprint dentro de um diff alheio.
- **Renomear codigo publicado passa a ser mudanca de contrato.** Acrescentar segue compativel.

## Desvios dos steps, declarados

1. **Doc operacional foi para `CODIGOS-DE-ERRO.md`, e nao `CONTRATOS.md`.** Aquele arquivo e o doc do
   modulo `contratos` (formalizacao, CCB, `StatusFormalizacao`) — assunto e audiencia diferentes.
2. **A verificacao de particao virou teste, e nao script avulso.** Verificacao que so roda quando
   alguem lembra de invocar nao guarda nada; foi assim que o gate de `npm audit` do `sep-app` ficou
   vermelho por 18 dias. `ParticaoDeCodigosErroTest` roda em todo `./gradlew build`.
3. **Commit da Task 36.6 e `fix`, e nao `test`.** A Task deixou de ser so teste quando achou o
   vazamento de perimetro.

## Commits (9)

```
ae6dc6c feat(shared): adicionar codigo opcional ao corpo de erro
fa2177e fix(shared): endurecer testes do corpo de erro apos review
b139443 feat(shared): propagar codigos das excecoes de dominio
1f79549 fix(contratos): normalizar codigo de erro da CCB
78e880a feat(shared): propagar codigos de excecoes fora do dominio selado
2af6194 feat(openapi): publicar catalogo de codigos de erro
c40eab8 fix(shared): impedir codigo fora do perimetro de vazar no corpo
0f92316 docs(contratos): registrar catalogo e perimetro dos codigos de erro
d5f0569 fix(shared): excluir codigos ambiguos do catalogo publicado
```

12 arquivos, +1212/−46. O ultimo commit responde ao code review de fechamento.
