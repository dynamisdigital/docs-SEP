# Spec 036 - Sprint 36 - Publicar a taxonomia de codigos de erro no fio

## Metadados

- **ID da Spec**: 036
- **Titulo**: Sprint 36 - Fazer os codigos de erro do dominio chegarem ao cliente: campo `codigo` no
  corpo de erro, propagacao no ponto unico de montagem e catalogo do subconjunto apto publicado no
  OpenAPI, com perimetro sobre o que ainda nao pode ser publicado
- **Revisada em**: 2026-09-01, sob a lente de produto (cap. 3 de *The Product-Minded Engineer*). A
  revisao derrubou quatro numeros e a premissa central; ver §Ancoras 1, 5, 6, 7 e §Decisao tecnica
  principal
- **Status**: **MERGEADA develop+main** em **2026-09-08** — PR **#107** (squash `452a09f`,
  back-merge `a774aa4`) e PR **#108** (`042949b`); `develop` == `main` por conteudo e arvore
  byte-identica a da branch. Criada em 2026-09-01. Contagens finais na §Medicao do Gate 36.0, que
  **substitui** as das Ancoras
- **Fase do produto**: Fase 4 - produto novo (superficie de contrato nova); sem endpoint, migration,
  evento, provider ou regra de negocio nova. **Sem ADR previsto**
- **Trilha**: Backend (`sep-api`)
- **Origem**: recomendacao **P1** do [`DIAGNOSTICO-PRODUTO.md`](../../docs-sep/DIAGNOSTICO-PRODUTO.md),
  a de maior alavancagem medida (valor / custo)
- **Depende de**: [`035`](./035-sprint-35-divida-config-lockout-contrato.md) integrada em `develop`.
  Nao e dependencia de contrato — e de **arquivo**: as duas mexem em `ApiExceptionHandler.java`, e a
  35 tem um item que esta spec **contradiz** (ver §Conflito com a Spec 035)
- **Desbloqueia**: [`126`](./126-fsprint-26-consumo-codigos-erro-web.md) (F-Sprint 26, web) e
  [`218`](./218-msprint-18-consumo-codigos-erro-mobile.md) (M-Sprint 18, mobile). Sem esta sprint as
  duas nao tem o que consumir
- **Responsavel principal**: Devs Plenos Backend

## Numeracao

Esta sprint consome o numero **36**, seguindo o precedente ja aplicado tres vezes: a 33 pela correcao
de lockout, a 34 pelos follow-ups dela e a 35 pela divida de config/lockout/contrato, todas na Fase 4,
com a Fase 5 recuando a cada vez ([`PRD-FASE-5.md`](../../docs-sep/PRD-FASE-5.md) §46 registra as
tres). Em consequencia, **o backend da Fase 5 renumera de 36-39 para 37-40** no mesmo ciclo desta
spec. E o **quarto** recuo.

**Atualizacao de 2026-09-01**: a [`037`](./037-sprint-37-normalizacao-taxonomia-erro.md), criada no
mesmo dia para o escopo que esta spec deixou fora do perimetro, consome o **37** e provoca o
**quinto** recuo — o backend da Fase 5 fica em **38-41**.

> **Encerrado em 2026-09-01**: a numeracao passou a ter **faixa reservada por fase** — Fases 1-4 em 0-49, Fase 5 em 50-99 ([`AGENT.md`](../../AGENT.md) §Numeracao de sprint e de spec). Este recuo foi um dos **oito** que o mecanismo antigo produziu, e o mecanismo **nao existe mais**: a Fase 4 cresce dentro da propria faixa sem tocar na Fase 5. O registro acima e historico.

## Objetivo

O `sep-api` constroi uma taxonomia de erro no dominio — **~103 codigos em 12 prefixos**, medidos na
revisao de 2026-09-01 — e **descarta ela na fronteira HTTP**. Esta sprint faz a parte apta dessa
taxonomia atravessar o fio.

O diagnostico registra o efeito: sem codigo, o cliente so tem o status HTTP para discriminar, e dai
saem seis itens que o [`STATE.md`](../../docs-sep/STATE.md) hoje lista como defeitos **separados** —
78 pontos de ramificacao por status no front, 3 literais byte-identicos entre `login` e
`verify-totp`, `verify-totp` acusando "codigo invalido" em bloqueio/rate limit/5xx/rede, `message: ""`
apagando o alerta, `CONTA_BLOQUEADA_FALLBACK` com "30 minutos" fixo, e o `contract:check` tendo de
validar `erros` contra o OpenAPI para recuperar estrutura perdida.

**A versao anterior desta spec afirmava que "o trabalho de taxonomia ja esta feito" e que a sprint
"nao inventa codigo nenhum: publica o que existe". A revisao derrubou as duas metades.** O que existe
tem 12 colisoes de significado e 12 violacoes de formato (§Ancoras 6 e 7), e publicar como esta
tornaria os dois defeitos contrato permanente.

A formulacao correta: esta sprint continua **nao inventando codigo nenhum**, e passa a publicar
**so o que ja esta apto** — deixando o resto explicitamente fora, com motivo registrado. Ver
§Decisao tecnica principal.

## Medicao do Gate 36.0 (2026-09-08) — substitui as contagens das Ancoras

Executado em `feature/sprint-36-codigos-erro`, a partir de `develop` `17bd72d` (Sprint 35 dentro).
Inventario por **duas vias** (literal com forma de codigo; constante cujo nome indica codigo),
unidas e deduplicadas; script reproduzivel guardado com a sprint. Baseline: **2262 testes / 0 falhas
/ 363 classes**, `clean build` e `spotlessCheck` EXIT=0.

As Ancoras abaixo ficam como **registro historico**. Onde divergirem, vale esta secao.

| Item | Ancora dizia | Gate 36.0 mediu |
|---|---|---|
| Codigos unicos | ~103 | **133** |
| Prefixos | 12 | **13** — entra `OF` (1 codigo) |
| Ponto unico de montagem (§4) | `build()` e o unico | **falso: 5 construcoes** |
| Colisoes (§7) | 12 | **16** |
| Violacoes de formato (§6) | 12 | **31** |
| Codigos `private` (§8) | 12 | **26** |
| Handlers sem codigo | 10 de 16 | **13 de 17** |
| Orfaos `BOF-*` (§5) | possivelmente inalcancaveis | **alcancaveis** — `CODIGO` publico + `@ExceptionHandler` dedicado |

**A §Ancora 4 cai, e e o achado com consequencia de escopo.** `ErrorResponseDto.of(...)` tem
**cinco** call sites em `src/main`: o `build()` do `ApiExceptionHandler` (por onde passam os 17
handlers) e **quatro fora dele** — `ApiAccessDeniedHandler:35`, `ApiAuthenticationEntryPoint:35`,
`RateLimitFilter:181` e `PasswordResetEnforcementFilter:106`. Sao filtros e entry points da cadeia
do Spring Security: escrevem o corpo direto na response e **nunca passam pelo
`@RestControllerAdvice`**. Consequencia declarada: `401`, `403` e `429` originados na cadeia de
seguranca **continuam sem `codigo`** depois desta sprint. Ficam **fora do escopo** — nenhum deles
carrega codigo canonico, e dar-lhes um cai na proibicao de inventar taxonomia (§Fora).

**O caso que prova a demanda**: `PasswordResetEnforcementFilter:109` concatena
`AUTH-403-PASSWORD_RESET_REQUIRED` **dentro da `message`**. O codigo ja chega ao cliente hoje, por
contorno, porque nao existe campo para ele. O valor nao e canonico e fica em `excluidos/formato`.

### Particao medida

```text
133 unicos = 83 publicaveis + 50 excluidos        intersecao = 0
excluidos: 31 formato · 16 colisao · 3 inalcancavel
```

Os 3 `inalcancavel` sao exatamente os orfaos da §Ancora 5 (`AUTH-423-001`, `BOF-429-001`,
`BOF-400-002`), que a Task 36.4 resolve. Com a 36.3 normalizando `CTR-422-CCB-001` para
**`CTR-422-004`** (faixa `001..003` ocupada, `004` livre), a particao de fechamento projetada e
**80 publicados + 53 excluidos = 133**.

> **Fechamento em 2026-09-08: a projecao se confirmou.** A particao final e
> **80 publicados + 53 excluidos = 133**, intersecao 0, sem nenhum `inalcancavel` restante — 30 por
> formato e 23 por colisao. **Nao e numero escrito aqui**: `ParticaoDeCodigosErroTest` varre
> `src/main/java` do zero a cada `./gradlew build` e reprova se o catalogo divergir do codigo-fonte.
>
> A decomposicao das 16 colisoes, medida ao escrever a Task 36.7, e **9 de faixa compartilhada +
> 2 de deduplicacao + 5 de colisao intra-modulo** — a §Ancora 7 dizia 8/2/6.

**`MFA-400-002`, `MFA-400-003` e `MFA-400-004` estao em `publicaveis`** — a
[`126`](./126-fsprint-26-consumo-codigos-erro-web.md) nao perde o caso de uso.

### Colisoes: 16, e uma reclassificacao

As 12 da §Ancora 7 se confirmam. Somam-se **quatro** que nenhuma versao registrava:

| Codigo | Classes donas |
|---|---|
| `CRD-400-001` | `PropostaInvalidaException` (credito) x `AssociarOperacaoFinanciadaUseCase` (credores) |
| `CRD-400-002` | `StatusPropostaInvalidoException` (credito) x `RegistrarAporteCredoraUseCase` (credores) |
| `USR-400-002` | `GerenciarRolesUsuarioUseCase` ("ultima role") x `CriarUsuarioUseCase` ("criacao direta com role") |
| `ONB-404-001` | `OnboardingNaoEncontradoException` x `CriarPropostaCreditoUseCase` |

E a §Ancora 7 **erra na classificacao de `ONB-400-007`**: ela o trata como duplicata de significado
identico, corrigivel por deduplicacao. Sao **tres** sites, nao dois — os dois
`CODIGO_ARQUIVO_INVALIDO` mais um terceiro em `IniciarOnboardingEmpresaUseCase:86`, que o usa para
**"campo obrigatorio"**. E colisao real. Renumerar, e nao deduplicar.

`ONB-404-001` e `ONB-400-008` sao o caso oposto — mesma condicao escrita duas vezes. Ficam em
`excluidos/colisao` mesmo assim, por criterio conservador: o criterio de particao conta **classe
dona**, e publicar identificador com dois donos e o que a §Decisao tecnica principal proibe.
Registrados como candidatos a **deduplicacao** e nao a renumeracao, insumo da
[`037`](./037-sprint-37-normalizacao-taxonomia-erro.md).

### Decisao do Step 036.0.6 — como o catalogo chega ao OpenAPI

**`OpenApiCustomizer` global**, provado contra o documento runtime antes de qualquer Task: escreve o
catalogo **uma vez** em `components/schemas/ErrorResponseDto/properties/codigo`, preservando OpenAPI
3.1, `securitySchemes`, as **795** `description` e os **137** `example` do documento. O
`OperationCustomizer` foi descartado: opera por operacao, e o criterio exige publicacao unica em
`components`. **O `ModelResolver` nao e substituido** — licao da Sprint 35 Task 35.7.

**Limitacao da "fonte unica", declarada e nao contornada**: **46 dos 133** codigos sao literais
inline sem constante, e **19 dos 83 publicaveis** sao `private` (os tres `MFA` inclusive). O catalogo
nao tem como referenciar as constantes sem alargar visibilidade, o que a §Fora proibe. Ele e,
portanto, **lista literal**, e a nao-divergencia em relacao ao codigo-fonte fica garantida pelo
script de inventario versionado da Task 36.7 — por verificacao executavel, nao pelo compilador.

## Ancoras verificadas (2026-09-01)

### 1. A taxonomia e MAIOR que 67, e o numero exato e do Gate

A primeira versao desta spec afirmava "67 codigos em 9 prefixos", medidos assim:

```bash
grep -rh 'CODIGO = "' sep-api/src/main/java --include=*.java | wc -l   # 67
```

**Esse padrao so pega constantes literalmente chamadas `CODIGO`.** O dominio tem cerca de 30
constantes com outros nomes carregando codigos do mesmo formato e da mesma taxonomia —
`CODIGO_HEADER_OBRIGATORIO` (7 ocorrencias), `CODIGO_VALIDACAO`, `CODIGO_CPF_INVALIDO`,
`CODIGO_TRANSICAO`, `CODIGO_ROLE_INVALIDA`, entre outras.

Medindo por formato em vez de por nome de constante:

```bash
grep -rhoE '"[A-Z]{3,4}-[0-9]{3}-[A-Z0-9-]*[0-9]{3}"' sep-api/src/main/java --include=*.java \
  | sort -u | wc -l   # 103
```

| | Versao anterior desta spec | Medido em 2026-09-01 |
|---|---|---|
| Codigos unicos | 67 | **103** |
| Prefixos | 9 | **12** — entram `PIX`, `ASN`, `WHK` |
| `ONB` | 5 | **21** |
| `CRD` | 28 | **35** |
| `CTR` | 8 | **10** |
| `USR` | 3 | **6** |

**Ressalva que vale mais que o numero**: o padrao acima tambem e limitado. A medicao de colisoes
(§Ancora 7) revelou `PIX-400-IDEMPOTENCY-KEY` e `PIX-400-IDEMPOTENCY-KEY-TAMANHO`, que a regex de
formato **nao** captura. Nenhum numero desta secao e fato — sao piso.

**O Gate 36.0 estabelece o numero**, varrendo por formato E por nome de constante, e o resultado
substitui esta secao antes de qualquer Task comecar. Criterio de aceite ancorado em contagem fixa
foi justamente o que faria esta sprint fechar verde com ~36 codigos de fora.

### 2. O corpo de erro nao tem onde por o codigo

`shared/exception/ErrorResponseDto.java` e um `record` com
`timestamp, status, error, message, path, traceId`. Nenhum campo de codigo. Ja tem
`@JsonInclude(NON_NULL)` na classe, o que cobre corpo legado sem mudanca adicional.

### 3. `getCodigo()` tem ZERO consumidores

```bash
grep -rn "getCodigo()" sep-api/src/main/java --include=*.java
```

Devolve exatamente duas linhas, e **as duas sao definicoes**: `DomainException.java:30` e
`ContaBloqueadaException.java:36`. Nenhuma leitura em `src/main`. A taxonomia e write-only de ponta a
ponta.

### 4. `build()` e o ponto unico, e cobre mais do que o diagnostico registra

`ApiExceptionHandler.build()` (`:245-249`) e o unico lugar que monta `ErrorResponseDto`. Os
**16** `@ExceptionHandler` do arquivo passam por ele — inclusive `handleLocked` (`:138-145`), que
chama `build` e so **depois** acrescenta o `Retry-After`, num arranjo que o proprio docblock
(`:134-136`) documenta como deliberado para nao perder headers que o helper comum ganhe no futuro.

**Correcao de numero**: a Spec [`035`](./035-sprint-35-divida-config-lockout-contrato.md) §3 afirma
"17 `@ExceptionHandler` no arquivo". A contagem medida hoje e **16**. A 35 acrescenta o handler de
`405`, o que leva a 17 **depois** dela — entao o Gate 36.0 deve medir 17, e medir 16 significa que a
35 nao esta em `develop`.

### 5. TRES excecoes com codigo nao herdam de `DomainException`, nao uma

A versao anterior desta spec nomeava so a `ContaBloqueadaException`. Medido:

| Excecao | Codigo | Herda | Tem `getCodigo()`? |
|---|---|---|---|
| `identity/application/exception/ContaBloqueadaException.java:11` | `AUTH-423-001` | `RuntimeException` | sim (`:36`) |
| `backoffice/domain/exception/LimiteReprocessoExcedidoException.java:12` | `BOF-429-001` | `RuntimeException` | **nao** |
| `backoffice/domain/exception/TipoReprocessoNaoSuportadoException.java:11` | `BOF-400-002` | `RuntimeException` | **nao** |

Nenhuma das tres entra no `switch` selado de `handleDomain` (`:105-112`).

**Consequencia direta no plano**: a Task 36.2 cobre o `switch` selado e a Task 36.4 cobre so o
`AUTH-423-001`. Os dois `BOF-*` caem **entre** as duas Tasks — e, sem getter, o `build()` nao teria
nem como le-los. Sairiam do catalogo direto para o vazio, com todos os criterios de aceite verdes.

### 6. As violacoes de formato sao DOZE, nao uma

A versao anterior media so entre as constantes chamadas `CODIGO` e achava uma. Medindo em toda a
taxonomia:

```bash
grep -rhoE '"[A-Z]{3,4}-[0-9]{3}-[A-Z0-9-]*[0-9]{3}"|"[A-Z]{3,4}-[0-9]{3}-[A-Z]+"' \
  sep-api/src/main/java --include=*.java | sed 's/"//g' | sort -u \
  | grep -vE '^[A-Z]{3,4}-[0-9]{3}-[0-9]{3}$'
```

Devolve **doze**: `CTR-422-CCB-001` mais onze `PIX-*` sem sequencial numerico —
`PIX-400-CHAVE`, `PIX-400-CONTRATO`, `PIX-400-PARCELA`, `PIX-400-VALOR`, `PIX-404-CHAVE`,
`PIX-404-CONTRATO`, `PIX-404-PARCELA`, `PIX-404-RECEBIMENTO`, `PIX-404-REFERENCIA`,
`PIX-404-TRANSFERENCIA`, `PIX-409-IDEMPOTENCIA`. Mais os dois que nem esta regex pega
(`PIX-400-IDEMPOTENCY-KEY`, `PIX-400-IDEMPOTENCY-KEY-TAMANHO`).

O modulo `PIX` inteiro usa sufixo semantico em vez de sequencial. Nao e desvio pontual; e uma
convencao paralela.

**Correcao da leitura, 2026-09-01** (medida ao escrever a
[`037`](./037-sprint-37-normalizacao-taxonomia-erro.md)): chamar os `PIX-*` de "violacao" e enviesado.
Dos **31** codigos do modulo, **28** usam sufixo semantico e apenas **tres** usam sequencial
(`PIX-400-001`, `PIX-400-002`, `PIX-404-001`). Dentro do `PIX`, quem viola a convencao local sao os
numericos.

Isso nao muda nada para esta sprint — os `PIX-*` ficam fora do perimetro de qualquer forma, porque a
taxonomia tem duas convencoes e nenhuma foi decidida. Muda o **enquadramento** do trabalho da 037:
nao e "corrigir 11 desvios", e "escolher entre duas convencoes que ja existem no codigo, cada uma
com dono e com argumento".

### 7. DOZE codigos estao definidos duas vezes, com significados diferentes

```bash
grep -rnoE 'String [A-Z_]+ = "[A-Z]{3,4}-[0-9]{3}-[A-Z0-9-]*"' sep-api/src/main/java --include=*.java \
  | sed 's|^.*/main/java/||' | awk -F'"' '{split($1,a,":"); print $2"\t"a[1]}' | sort -u \
  | awk -F'\t' '{c[$1]=c[$1]" "$2; n[$1]++} END {for (k in n) if (n[k]>1) print k c[k]}'
```

Sao **definicoes** duplicadas, nao referencias: `COB-409-002`, `CRD-403-001`, `CRD-404-001`,
`CRD-404-002`, `CRD-409-002`, `CRD-422-001`, `CRD-422-002`, `CRD-422-003`, `ONB-400-006`,
`ONB-400-007`, `ONB-400-008`, `USR-400-001`.

Exemplo verificado:

```
credito/domain/exception/OwnershipPropostaException.java:12:  CODIGO = "CRD-403-001"
credores/domain/exception/OwnershipCredoraException.java:8:   CODIGO = "CRD-403-001"
```

O padrao e sistematico: o modulo `credores` foi construido reusando a faixa `CRD-*` do modulo
`credito` — **oito** das doze colisoes sao desse par.

**Refinamento, 2026-09-01** (medido ao escrever a
[`037`](./037-sprint-37-normalizacao-taxonomia-erro.md)): as doze sao de **tres tipos** com
tratamentos diferentes, e duas delas **nao sao colisao**:

- **8 de faixa compartilhada** (`credito` x `credores`) — exigem re-prefixar um modulo inteiro. E
  `credores` que ocupa `CRD` majoritariamente: **35 codigos contra 10** do `credito`.
- **2 de constante duplicada com significado identico** (`ONB-400-007`, `ONB-400-008`) — corrigem-se
  por **deduplicacao**, nao por renumeracao. Renumerar criaria dois codigos onde deve haver um.
- **3 de colisao real intra-modulo** (`ONB-400-006`, `USR-400-001`, `COB-409-002`) — renumerar um lado.

Para o perimetro desta sprint nada muda: os doze ficam fora igual. O refinamento importa para
dimensionar a 037.

**Isto derruba a premissa do §Objetivo.** "O trabalho de taxonomia ja esta feito" e falso: o que
existe tem colisao. Publicar `CRD-403-001` como identificador estavel entrega ao cliente um codigo
com que ele **nao consegue** distinguir "proposta de outro tomador" de "credora de outro dono" — que
e precisamente a discriminacao que esta sprint existe para dar.

### 8. Doze codigos sao `private static final`

```bash
grep -rhoE '(public|private) static final String CODIGO = ' sep-api/src/main/java --include=*.java \
  | sort | uniq -c   # 55 public, 12 private
```

O catalogo da Task 36.5 e o teste do criterio de aceite 4 precisam ler esses valores de fora da
classe. Doze deles nao sao alcancaveis sem mudar visibilidade ou enumerar por outra estrategia.
Nao e bloqueio, mas e trabalho que a versao anterior desta spec nao contava.

## Decisao tecnica principal — publicar o subconjunto limpo, com perimetro

O raciocinio original continua valendo e agora vale mais: enquanto nada consome os codigos, corrigir
e edicao de uma linha sem consumidor a avisar. **Depois de publicado no OpenAPI, a mesma correcao
vira mudanca de contrato**, com snapshot a regenerar no `sep-app`, `knownGap` a criar e sprint de
contrato para fechar. A janela barata fecha nesta sprint.

O que mudou e o tamanho do problema. As Ancoras 6 e 7 medem **12 violacoes de formato** e **12
colisoes de significado**. Normalizar tudo transforma esta sprint em refatoracao de taxonomia de
~103 codigos, com risco alto e zero valor de usuario ate terminar.

**A decisao e construir um perimetro, nao expandir o escopo.**

Publicar apenas o subconjunto que ja esta apto:

1. sem colisao — o codigo identifica **uma** condicao
2. no formato canonico `MOD-STATUS-NNN`
3. alcancavel em runtime — ha caminho do `build()` ate o valor

Todo codigo que falha em qualquer um dos tres **simplesmente nao emite `codigo`**. O campo e
opcional (§Ancora 2); cliente que nao recebe cai no comportamento de hoje, que ja funciona. Nada
regride.

A assimetria e o ponto: **publicar mais codigos depois nao quebra ninguem; renomear codigo ja
publicado quebra.** O perimetro preserva a opcao; expor tudo agora a queima.

Corolario que substitui a regra anterior: nao vale publicar uma taxonomia em que a regra de
nomenclatura tem excecao, nem em que o mesmo identificador significa duas coisas. Vale publicar
menos e dizer exatamente o que ficou de fora e por que.

**A lista do nao-publicado e entregavel, nao omissao.** E ela que dimensiona a sprint de
normalizacao seguinte — que ai sim e sprint de taxonomia, com escopo medido em vez de estimado.

## Conflito com a Spec 035 — resolver antes de executar

A Spec [`035`](./035-sprint-35-divida-config-lockout-contrato.md) §5 e a Task **35.5** classificam
`ContaBloqueadaException.CODIGO` e `getCodigo()` como **codigo morto a remover**, com a justificativa
correta para o momento em que foi escrita: nao ha consumidor.

Esta sprint **da um consumidor a ele**. Remover na 35 para recriar na 36 e churn puro, e pior: a
remocao passa pelo ciclo de PR e volta pelo mesmo ciclo duas sprints depois.

Encaminhamento: a Task 35.5 deve manter apenas a metade do `countByIpAndJanela` e **registrar que a
metade do `ContaBloqueadaException.CODIGO` foi cancelada por esta spec**. Se a 35 ja tiver executado e
removido, a Task 36.4 recria — o custo e o mesmo, so muda quem paga.

Este item e pre-requisito do Gate 36.0, nao consequencia dele.

## Escopo

### Dentro

1. `codigo` opcional em `ErrorResponseDto`.
2. Propagacao no `build()`, cobrindo os 16 (17 pos-35) handlers.
3. Normalizacao de `CTR-422-CCB-001` — a unica violacao de formato **dentro** do subconjunto
   publicavel. As onze do modulo `PIX` ficam fora do perimetro, nao normalizadas (§Fora).
4. `AUTH-423-001` vivo no `423`, preservando o `Retry-After`.
5. Catalogo do **subconjunto apto** publicado no OpenAPI e versionado, com os tres criterios do
   perimetro aplicados e registrados por codigo.
6. Regressao por subtipo, verificada por mutacao.
7. Doc operacional: catalogo publicado, regra de nomenclatura, **e a lista do que ficou fora com o
   motivo por codigo** (colisao / formato / inalcancavel). Esta lista e entregavel de aceite.

### Fora

- **Resolver as colisoes** da §Ancora 7 e **normalizar a convencao de sufixo** (§Ancora 6). As duas
  viraram a [`037`](./037-sprint-37-normalizacao-taxonomia-erro.md), criada em 2026-09-01. Ela nao e
  sprint de rename: **decide duas coisas nunca decididas** — o que o prefixo significa e qual e a
  convencao de sufixo — e por isso preve **ADR**, ao contrario desta. A lista que a Task 36.7 entrega
  e o insumo que a dimensiona.
- **Mudar visibilidade dos 12 codigos `private`** (§Ancora 8). Se algum deles cair no subconjunto
  apto e a visibilidade bloquear, a Task **para e reporta** em vez de abrir a classe de passagem.
- **Criar codigos novos** para os handlers que hoje nao tem: validacao Bean
  (`MethodArgumentNotValidException`), `405`, `5xx` generico, `AccessDeniedException` e
  `AuthenticationException`. Sao **10 dos 16 handlers** sem codigo. Esta sprint mede a lacuna e a
  registra; inventar taxonomia nova e decisao de produto, com nome e faixa a escolher, e merece
  sprint propria com as personas ja escritas (P2 do diagnostico).
- **As 5 categorias do cap. 3** do livro (System / User's Invalid Argument / Preconditions Not Met /
  Developer's Invalid Argument / Assertion). Sao a recomendacao **P4**, dependem de P1 e P2, e mudam
  a semantica dos codigos — nao so a exposicao deles.
- **Reescrever mensagens** na ontologia do usuario. Tambem P4.
- Migration. Nenhum item toca schema; se algum exigir, a Task para e reporta.

## Criterios de aceite

1. Contagem de testes **>= a baseline medida no Gate 36.0, com 0 falhas** (ultimo registro: 2220 pela
   Sprint 34; a 35 acrescenta os seus).
2. `clean build` e `spotlessCheck` verdes.
3. **Todo comportamento novo verificado por mutacao.** No minimo: remover a propagacao do codigo em
   `build()` tem de reprovar; trocar `ex.getCodigo()` por literal fixo em `handleDomain` tem de
   reprovar; remover o `AUTH-423-001` do `handleLocked` tem de reprovar **sem** afetar o teste do
   `Retry-After`, o que prova que os dois sao independentes.
4. Teste provando que **cada uma das 5 subclasses seladas** de `DomainException` emite codigo — nao
   uma amostra. O `switch` e exaustivo por construcao; o teste tem de ser tambem.
5. Teste provando que corpo **sem** codigo continua valido e que o campo some do JSON (o
   `@JsonInclude(NON_NULL)` cobre, mas nada hoje prova que cobre).
6. **Particao completa e sem sobra.** Todo codigo medido pelo Gate 36.0 esta em exatamente um dos
   dois conjuntos: publicado no catalogo, ou listado no doc operacional com o motivo da exclusao
   (colisao / formato / inalcancavel). `publicados + excluidos == total do Gate`, conferido por
   script no checkpoint — nao pela memoria, e **nao contra numero fixo escrito nesta spec**.
   Contagem fixa como criterio foi exatamente o que faria esta sprint fechar verde com dezenas de
   codigos fora do radar.
7. Nenhum codigo publicado viola `MOD-STATUS-NNN`, e nenhum codigo publicado aparece duas vezes na
   lista de definicoes. Os dois `grep` das Ancoras 6 e 7, aplicados **ao catalogo publicado**,
   devolvem vazio. Aplicados ao repo inteiro nao devolvem — e isso e esperado, porque as violacoes
   restantes estao fora do perimetro por decisao.
8. Os **tres** codigos orfaos da §Ancora 5 tem desfecho explicito e testado: `AUTH-423-001` sai no
   `423` (Task 36.4); `BOF-429-001` e `BOF-400-002` **ou** ganham caminho de leitura, **ou** entram
   na lista de excluidos por "inalcancavel". Ficar sem decisao reprova o criterio 6, porque quebram
   a particao.

## Riscos e limitacoes

- **O Gate 36.0 ja derrubou quatro numeros desta spec, antes de executar.** A revisao de 2026-09-01
  mediu: a taxonomia nao e 67 e sim ~103 (§Ancora 1), as excecoes orfas sao 3 e nao 1 (§5), as
  violacoes de formato sao 12 e nao 1 (§6), e ha 12 colisoes que nenhuma versao anterior registrava
  (§7). O padrao das tres sprints de divida anteriores se repetiu — com a diferenca de que **desta
  vez o erro estava na propria medicao**, nao na estimativa: o `grep` original filtrava por nome de
  constante em vez de por formato de codigo.
  A licao vale como regra para o Gate: **medir o fenomeno, nao o nome que ele costuma ter.**
- **As contagens desta spec seguem sendo piso, nao fato.** A propria regex de formato da §Ancora 6
  nao captura `PIX-400-IDEMPOTENCY-KEY`. O Gate 36.0 varre por formato **e** por nome de constante,
  e o numero dele substitui os desta spec.
- **O perimetro pode publicar pouco.** Se o subconjunto apto sair pequeno — as 12 colisoes concentram
  `CRD` e `ONB`, que sao os dois maiores prefixos —, o valor entregue ao web e ao mobile encolhe.
  Isso e informacao do Gate, e e criterio de decisao: se o subconjunto nao cobrir os
  `MFA-400-002/003/004` que a [`126`](./126-fsprint-26-consumo-codigos-erro-web.md) consome, a 126
  perde o caso de uso e precisa de outro. **Conferido em 2026-09-01: os tres MFA nao colidem e estao
  no formato canonico** — passam pelo perimetro.
- **A 35 pode ter removido o `AUTH-423-001` antes** (ver §Conflito). Isso nao bloqueia: muda a Task
  36.4 de "dar consumidor" para "recriar e dar consumidor".
- **10 dos 16 handlers seguirao sem codigo** ao fim desta sprint. Isso e escopo declarado, nao
  omissao: o front ganha discriminacao onde o dominio ja discriminava, e continua sem onde o dominio
  tambem nao discrimina. Registrar a lacuna medida no doc operacional.
- **Publicar codigo e superficie de suporte, nao so de UI.** Depois desta sprint o par
  `codigo + traceId` vira o identificador que o usuario reporta. Isso e ganho, e tambem compromisso:
  codigo publicado nao se renomeia de graca. Dai a §Decisao tecnica principal.

## Rastreabilidade

| Item da spec | Task |
|---|---|
| `codigo` opcional em `ErrorResponseDto` | 36.1 |
| `build()` propaga o codigo nos 16/17 handlers | 36.2 |
| Normalizar `CTR-422-CCB-001` (unica violacao dentro do perimetro) | 36.3 |
| `AUTH-423-001` vivo no `423`, com `Retry-After` intacto; desfecho dos dois `BOF-*` orfaos | 36.4 |
| Catalogo do subconjunto apto no OpenAPI, versionado | 36.5 |
| Regressao por subtipo + mutacao | 36.6 |
| Doc operacional: catalogo, nomenclatura **e lista do excluido com motivo** | 36.7 |
| Medicao da taxonomia por formato E por nome; particao publicado/excluido; conflito com a 035; lacuna dos 10 handlers | Gate 36.0 e Fechamento |

Fecha, ao lado da [`126`](./126-fsprint-26-consumo-codigos-erro-web.md) e da
[`218`](./218-msprint-18-consumo-codigos-erro-mobile.md), a recomendacao **P1** do
[`DIAGNOSTICO-PRODUTO.md`](../../docs-sep/DIAGNOSTICO-PRODUTO.md).

Steps criados just-in-time em `steps-fase-4/backend/036-sprint-36-steps.md` quando a sprint for
aprovada para execucao.
