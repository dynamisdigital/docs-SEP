# CODIGOS DE ERRO - sep-api

Documento operacional do contrato de erro da API SEP. Criado pela **Sprint 36** (spec
[`036`](../../specs/fase-4/036-sprint-36-codigos-erro-no-fio.md), steps
[`036`](../../steps-fase-4/backend/036-sprint-36-steps.md)) e reescrito pela **Sprint 37** (spec
[`037`](../../specs/fase-4/037-sprint-37-normalizacao-taxonomia-erro.md), steps
[`037`](../../steps-fase-4/backend/037-sprint-37-steps.md), ADR
[`0020`](../../adr/0020-convencao-codigos-de-erro.md)).

> **Destino deste documento.** Os steps da Sprint 36 apontavam o catalogo para
> [`CONTRATOS.md`](./CONTRATOS.md). Aquele arquivo e o doc operacional do **modulo `contratos`**
> (formalizacao, CCB, `StatusFormalizacao`) — assunto diferente e audiencia diferente. O catalogo
> ganhou arquivo proprio; a divergencia esta registrada no checkpoint da Task 36.7.

## O que mudou

Ate a Sprint 35 o `sep-api` construia uma taxonomia de erro no dominio e a **descartava na fronteira
HTTP**: `getCodigo()` tinha zero consumidores em `src/main`. O cliente so tinha o status para
discriminar, e por isso o `sep-app` acumulava ramificacao por status, mensagens byte-identicas entre
telas e um `verify-totp` que acusava "codigo invalido" em bloqueio, rate limit, 5xx e queda de rede.

A **Sprint 36** pos no corpo de erro um campo **`codigo`** opcional e publicou 80 codigos, deixando
53 fora do perimetro por formato ou colisao.

A **Sprint 37** normalizou a taxonomia inteira sem mudar contrato: definiu o que o prefixo
significa, converteu o sufixo semantico em numerico, separou e deduplicou as colisoes e instalou um
gate no build. O catalogo foi de **80 para 143**, e os 80 anteriores continuam publicados com o mesmo
valor e o mesmo dono.

## Forma do corpo

Com codigo publicado:

```json
{
  "timestamp": "2026-09-08T10:15:30-03:00",
  "status": 423,
  "error": "Locked",
  "message": "Conta bloqueada temporariamente. Tente novamente em 11 minutos.",
  "path": "/api/v1/auth/login",
  "traceId": "8e1b8c5e-3f6f-4f5a-90c5-9b6c2c2b1c0a",
  "codigo": "AUTH-423-001"
}
```

Sem codigo publicado — **a propriedade some, e nao vira `null`**:

```json
{
  "timestamp": "2026-09-08T10:15:30-03:00",
  "status": 401,
  "error": "Unauthorized",
  "message": "Autenticacao requerida",
  "path": "/api/v1/usuarios",
  "traceId": "8e1b8c5e-3f6f-4f5a-90c5-9b6c2c2b1c0a"
}
```

**Garantia de compatibilidade**: as seis propriedades anteriores nao mudaram de nome, tipo, ordem
nem semantica. Consumidor que ignora o campo novo nao percebe as sprints. Consumidor que ramifica por
`'codigo' in body` funciona porque a ausencia e ausencia de chave, nao `null`
(`@JsonInclude(NON_NULL)`).

## `codigo` + `traceId`: o par de suporte

- **`codigo`** diz **o que** aconteceu. E estavel entre chamadas, entre versoes e entre ambientes, e
  serve para o cliente ramificar e para a documentacao referenciar.
- **`traceId`** diz **qual** chamada foi. Muda a cada requisicao e serve para achar a ocorrencia no
  log.

Quem abre chamado reporta os dois: o `codigo` leva ao comportamento, o `traceId` a evidencia. Nenhum
dos dois sozinho resolve — codigo sem trace nao localiza, trace sem codigo nao classifica.

## Regra de nomenclatura (ADR 0020)

```text
MOD-STATUS-NNN          ^[A-Z]{3,4}-[0-9]{3}-[0-9]{3}$
```

- **`MOD`** — prefixo de 3 ou 4 letras que identifica uma **area funcional**, com **um** modulo dono.
  Um modulo pode ter mais de um prefixo (`identity`: `AUTH` e `MFA`); **o mesmo prefixo nunca aparece
  em dois modulos**. Os prefixos vivem no registro `shared/exception/PrefixoCodigoErro`.
- **`STATUS`** — o status HTTP com que a condicao chega ao cliente, com 3 digitos. E informativo; o
  status autoritativo e o da resposta.
- **`NNN`** — sequencial de 3 digitos dentro do par prefixo + status. **Numero retirado nao volta ao
  uso.**

Registro de prefixos:

| Prefixo | Modulo dono | Area |
|---|---|---|
| `ASN` | `contratos` | assinatura digital |
| `AUTH` | `identity` | autenticacao e sessao |
| `BOF` | `backoffice` | fila e operacao de backoffice |
| `COB` | `cobranca` | cobranca e renegociacao |
| `CRD` | `credores` | credora: cadastro, oportunidade, interesse e aporte |
| `CTR` | `contratos` | formalizacao contratual |
| `GOV` | `governanca` | parametros e papeis |
| `MFA` | `identity` | segundo fator |
| `ONB` | `onboarding` | KYC, KYB e PLD |
| `PIX` | `pix` | desembolso, recebimento e chaves |
| `PRP` | `credito` | proposta de credito e Open Finance |
| `USR` | `usuarios` | cadastro e senha de usuario |
| `WHK` | `shared` | recepcao de webhooks |

> **`CRD` significa "credora"**, embora a leitura natural seja "credito". Mudar custaria renomear
> codigos publicados; o `credito` usa `PRP` desde a Sprint 37.

Regras de identidade:

- **Um codigo identifica uma condicao e tem um dono** — a classe de excecao que nomeia a condicao,
  ou um unico ponto de lancamento inline.
- **Mesma condicao = mesma acao do cliente.** Se o cliente faz a mesma coisa para se recuperar, e a
  mesma condicao e recebe uma excecao nomeada unica, nunca dois codigos. Foi assim que a validacao de
  recepcao de webhook virou `WHK` nos sete controllers que a repetiam.
- **Acrescentar codigo ao catalogo e compativel. Renomear, reutilizar ou mudar o significado de codigo
  publicado nao e.**

O build reprova codigo fora do formato, prefixo fora do registro, prefixo usado fora do modulo dono,
numero aposentado de volta e ponto de lancamento que a particao nao consegue ler
(`ConvencaoCodigosErroTest`).

## O perimetro: o que entra no contrato

Um codigo so entra no contrato se satisfizer os **tres** criterios:

1. **formato canonico** — casa a regex acima;
2. **uma condicao** — o valor identifica **uma** situacao. Uma classe de excecao **nomeia** a
   condicao, entao seus construtores e fabricas sao variantes de mensagem da mesma coisa; um literal
   solto num use case ou controller nao nomeia nada, e ali cada mensagem distinta e uma condicao;
3. **alcancavel** — existe caminho de runtime da excecao ate a montagem do corpo.

Todo codigo apto e publicado (ADR 0020 §4). Codigo que falha em algum criterio **simplesmente nao
emite `codigo`**. O filtro vale **no fio, e nao so no documento**: `ApiExceptionHandler.somenteSePublicado`
recusa qualquer valor fora do catalogo, para que a resposta nunca carregue algo que o `enum`
publicado nao declara.

## Particao

```text
Sprint 37:  144 codigos unicos = 143 publicados + 1 excluido     intersecao = 0
            excluido: 1 inalcancavel · 0 formato · 0 colisao
Sprint 36:  133 codigos unicos =  80 publicados + 53 excluidos
```

A particao **nao e um numero escrito aqui**: e recalculada a cada `./gradlew build` por
`ParticaoDeCodigosErroTest`, que varre `src/main/java` do zero e reprova se o catalogo divergir do
codigo-fonte em qualquer direcao.

## Catalogo publicado (143)

Em **negrito**, os 80 publicados ate a Sprint 36. Os 143 estao congelados em
`CodigosPublicadosNaoMudamTest`: codigo publicado nao se renomeia nem sai do catalogo, e a lista so
cresce — cada sprint que publica acrescenta os seus no fechamento.

| Prefixo | Modulo dono | Area | Qtd | Codigos |
|---|---|---|---|---|
| `ASN` | `contratos` | assinatura digital | 3 | `ASN-400-001`, **`ASN-400-002`**, **`ASN-400-003`** |
| `AUTH` | `identity` | autenticacao e sessao | 3 | **`AUTH-400-101`**, **`AUTH-400-102`**, **`AUTH-423-001`** |
| `BOF` | `backoffice` | fila e operacao de backoffice | 5 | **`BOF-400-001`**, **`BOF-400-002`**, **`BOF-404-001`**, **`BOF-409-001`**, **`BOF-429-001`** |
| `COB` | `cobranca` | cobranca e renegociacao | 9 | **`COB-400-001`**, **`COB-403-001`**, **`COB-404-001`**, **`COB-404-002`**, **`COB-404-003`**, **`COB-409-001`**, `COB-409-002`, **`COB-409-003`**, `COB-409-004` |
| `CRD` | `credores` | credora: cadastro, oportunidade, interesse e aporte | 35 | `CRD-400-001`, `CRD-400-002`, **`CRD-400-003`**, **`CRD-400-004`**, **`CRD-400-005`**, **`CRD-400-006`**, **`CRD-400-007`**, **`CRD-400-008`**, **`CRD-400-009`**, **`CRD-400-010`**, **`CRD-400-011`**, **`CRD-400-012`**, **`CRD-400-013`**, **`CRD-400-014`**, **`CRD-400-015`**, `CRD-403-001`, `CRD-404-001`, `CRD-404-002`, **`CRD-404-003`**, **`CRD-404-004`**, **`CRD-404-005`**, **`CRD-404-006`**, **`CRD-404-007`**, **`CRD-404-008`**, **`CRD-409-001`**, `CRD-409-002`, **`CRD-409-003`**, **`CRD-409-004`**, **`CRD-409-005`**, **`CRD-409-006`**, **`CRD-409-007`**, `CRD-422-001`, `CRD-422-002`, `CRD-422-003`, **`CRD-422-004`** |
| `CTR` | `contratos` | formalizacao contratual | 10 | **`CTR-400-001`**, **`CTR-403-001`**, **`CTR-404-001`**, **`CTR-409-001`**, **`CTR-409-002`**, **`CTR-409-003`**, **`CTR-422-001`**, **`CTR-422-002`**, **`CTR-422-003`**, **`CTR-422-004`** |
| `GOV` | `governanca` | parametros e papeis | 2 | **`GOV-400-001`**, **`GOV-404-001`** |
| `MFA` | `identity` | segundo fator | 5 | **`MFA-400-001`**, **`MFA-400-002`**, **`MFA-400-003`**, **`MFA-400-004`**, **`MFA-409-001`** |
| `ONB` | `onboarding` | KYC, KYB e PLD | 21 | **`ONB-400-001`**, `ONB-400-002`, **`ONB-400-003`**, `ONB-400-004`, **`ONB-400-005`**, `ONB-400-006`, `ONB-400-007`, `ONB-400-008`, **`ONB-400-009`**, **`ONB-400-010`**, **`ONB-400-011`**, **`ONB-400-012`**, **`ONB-400-013`**, **`ONB-400-016`**, `ONB-400-017`, **`ONB-400-018`**, `ONB-400-019`, `ONB-404-001`, **`ONB-404-002`**, **`ONB-409-001`**, **`ONB-409-002`** |
| `PIX` | `pix` | desembolso, recebimento e chaves | 29 | **`PIX-400-001`**, `PIX-400-003`, `PIX-400-004`, `PIX-400-005`, `PIX-400-006`, `PIX-400-007`, `PIX-400-008`, `PIX-400-009`, `PIX-400-010`, **`PIX-404-001`**, `PIX-404-002`, `PIX-404-003`, `PIX-404-004`, `PIX-404-005`, `PIX-404-006`, `PIX-404-007`, `PIX-409-001`, `PIX-409-002`, `PIX-409-003`, `PIX-409-004`, `PIX-409-005`, `PIX-422-001`, `PIX-422-002`, `PIX-422-003`, `PIX-422-004`, `PIX-422-005`, `PIX-422-006`, `PIX-422-007`, `PIX-422-008` |
| `PRP` | `credito` | proposta de credito e Open Finance | 9 | `PRP-400-001`, `PRP-400-002`, `PRP-403-001`, `PRP-404-001`, `PRP-404-002`, `PRP-409-002`, `PRP-422-001`, `PRP-422-002`, `PRP-422-003` |
| `USR` | `usuarios` | cadastro e senha de usuario | 8 | `USR-400-001`, `USR-400-002`, `USR-400-003`, `USR-400-004`, **`USR-403-001`**, **`USR-403-002`**, **`USR-404-001`**, **`USR-409-001`** |
| `WHK` | `shared` | recepcao de webhooks | 4 | **`WHK-400-001`**, `WHK-400-003`, `WHK-400-004`, `WHK-400-005` |

Fonte unica: `shared/exception/CatalogoCodigosErro.java`. O `enum` do campo `codigo` em
`components/schemas/ErrorResponseDto` do OpenAPI deriva dela por `OpenApiCustomizer`, publicado uma
vez e nao por operacao.

## Excluido (1)

| Codigo | Dono | Motivo | Por que |
|---|---|---|---|
| `AUTH-403-001` | `PasswordResetEnforcementFilter` | `inalcancavel` | o filtro escreve o 403 direto na response, na cadeia do Spring Security, e nunca chega ao `ApiExceptionHandler`; o codigo so aparece **dentro do texto da `message`** (`"AUTH-403-001: redefinicao de senha obrigatoria antes de continuar."`) e o campo `codigo` sai ausente |

Levar esse codigo ao campo exigiria o filtro montar o corpo pelo mesmo caminho do handler — mudanca
da cadeia de seguranca, fora do escopo da normalizacao.

## Aposentados

Numeros que ja identificaram uma condicao e sairam de uso. Nao voltam
(`ConvencaoCodigosErroTest.nenhumNumeroAposentadoVoltaAoUso`).

| Codigo | Aposentado em | Condicao passou para |
|---|---|---|
| `ONB-400-014` | 37.3b | validacao do webhook KYB -> `WHK-400-003`/`004`/`005` |
| `ONB-400-015` | 37.3b | validacao do webhook PLD -> `WHK-400-003`/`004`/`005` |
| `PIX-400-002` | 37.3b | validacao do webhook Pix -> `WHK-400-003`/`004` |
| `WHK-400-002` | 37.3b | validacao do webhook generico -> `WHK-400-003`/`004` |
| `OF-400-001` | 37.4 | validacao do webhook Open Finance -> `WHK-400-003`/`004`/`005` |
| `PIX-409-IDEMPOTENCIA-CHAVE` | 37.5 | absorvido por `PIX-409-004` (reuso conflitante de Idempotency-Key) |

Os dois ultimos, e os 28 semanticos convertidos na 37.5, ja reprovam pelo formato.

## Mapa antes -> depois da Sprint 37

Nenhum dos 80 publicados antes da sprint mudou. Tudo abaixo estava **fora** do contrato.

**37.2 — deduplicacao (mesma condicao, dois donos)**

| Antes | Depois |
|---|---|
| `ONB-400-008` em `ConsultarStatusOnboardingEmpresaUseCase` e `IniciarVerificacaoKybUseCase` | `ONB-400-008` em `SolicitacaoNaoEmpresaException` |
| `ONB-404-001` inline em `CriarPropostaCreditoUseCase` | o `credito` lanca `OnboardingNaoEncontradoException` (`ONB-404-001`) |

**37.3a — colisoes separadas**

| Antes | Depois |
|---|---|
| `COB-409-002` em `ChaveIdempotenciaConflitanteException` | `COB-409-004` (`RenegociacaoConflitanteException` fica com `COB-409-002`) |
| `USR-400-001` em `AlterarRoleUsuarioUseCase` (role invalida) | `USR-400-003` (`SenhaAtualIncorretaException` fica com `USR-400-001`) |
| `USR-400-002` em `CriarUsuarioUseCase` | `USR-400-004` (`GerenciarRolesUsuarioUseCase` fica com `USR-400-002`) |
| `ONB-400-002` inline em `IniciarOnboardingPessoaUseCase` | `CpfInvalidoException` (`ONB-400-002`) |
| `ONB-400-006` inline em `IniciarOnboardingEmpresaUseCase` | `CnpjInvalidoException` (`ONB-400-006`) |
| `ONB-400-004` para "conteudo/arquivo do documento obrigatorio" | `DocumentoSemConteudoException` (`ONB-400-017`); `ONB-400-004` fica com "tamanho excedido" |
| `ONB-400-007` nos controllers de onboarding (arquivo ilegivel) | `ArquivoIlegivelException` (`ONB-400-007`) |
| `ONB-400-007` em `IniciarOnboardingEmpresaUseCase` (campo obrigatorio) | `ONB-400-019` |

**37.3b — validacao de recepcao de webhook consolidada em `WHK`**

| Antes | Depois |
|---|---|
| `ASN-400-001` (header/body), `ONB-400-006` (KYC), `ONB-400-014` (KYB), `ONB-400-015` (PLD), `PIX-400-002` (Pix), `WHK-400-002` (generico) | `WHK-400-003` header obrigatorio · `WHK-400-004` body obrigatorio · `WHK-400-005` body nao-JSON |
| `ASN-400-001` | fica so com "path param `{provider}` obrigatorio" |

**37.4 — `credito` de `CRD` para `PRP`** (status e numero preservados)

| Antes | Depois | Classe |
|---|---|---|
| `CRD-400-001` | `PRP-400-001` | `PropostaInvalidaException` (dado invalido) |
| `CRD-400-002` | `PRP-400-002` | `StatusPropostaInvalidoException` (status recusa a operacao; antes saia com o codigo do pai) |
| `CRD-403-001` | `PRP-403-001` | `OwnershipPropostaException` |
| `CRD-404-001` / `002` | `PRP-404-001` / `002` | `PropostaNaoEncontradaException` / `ConsentimentoNaoEncontradoException` |
| `CRD-409-002` | `PRP-409-002` | `ConsentimentoAtivoException` |
| `CRD-422-001` / `002` / `003` | `PRP-422-001` / `002` / `003` | `OnboardingNaoAprovado` / `OpenFinanceFluxoInvalido` / `ConsentimentoNaoAutorizado` |
| `OF-400-001` | aposentado -> `WHK-400-003`/`004`/`005` | `CelcoinOpenFinanceWebhookController` |

Com o `credito` fora, os mesmos nove numeros `CRD` do `credores` ganharam dono unico e foram
publicados.

**37.5 — sufixo semantico para numerico** (proximo `NNN` livre, ordem alfabetica do codigo antigo)

| Antes | Depois |
|---|---|
| `PIX-400-CHAVE` · `-CHAVE-TIPO` · `-CONTRATO` · `-IDEMPOTENCY-KEY` · `-IDEMPOTENCY-KEY-TAMANHO` · `-PARCELA` · `-VALOR` · `-VALOR-ESCALA` | `PIX-400-003` (`ChavePixInvalidaException`) · `004` · `005` · `006` (`IdempotencyKeyObrigatoriaException`) · `007` (`IdempotencyKeyMuitoLongaException`) · `008` · `009` · `010` |
| `PIX-404-CHAVE` · `-CONTRATO` · `-PARCELA` · `-RECEBIMENTO` · `-REFERENCIA` · `-TRANSFERENCIA` | `PIX-404-002` · `003` · `004` · `005` · `006` · `007` |
| `PIX-409-CHAVE-ATIVA` · `-CONFLITO-CONCORRENTE` · `-DESEMBOLSO-DUPLICADO` · `-IDEMPOTENCIA` (+ `-IDEMPOTENCIA-CHAVE`) · `-REFERENCIA-CONCORRENTE` | `PIX-409-001` · `002` · `003` · `004` (`IdempotencyKeyConflitanteException`) · `005` |
| `PIX-422-AGENDA-INEXISTENTE` · `-CONTA-OPERACIONAL` · `-CONTRATO-NAO-ASSINADO` · `-ESCROW-INOPERANTE` · `-PARCELA-NAO-RECEBIVEL` · `-PARCELA-SEM-SALDO` · `-VALOR-DIVERGENTE` · `-VALOR-INDISPONIVEL` | `PIX-422-001` ... `008`, na mesma ordem |
| `AUTH-403-PASSWORD_RESET_REQUIRED` | `AUTH-403-001` (segue excluido; so no texto da `message`) |

## Duplicidade conhecida entre modulos

A mesma condicao de Idempotency-Key tem codigos em tres modulos, e dois deles ja estavam publicados:

| Condicao | `pix` | Outros modulos |
|---|---|---|
| Idempotency-Key obrigatoria | `PIX-400-006` | `CRD-400-003`; parte de `COB-400-001` |
| Idempotency-Key acima de 100 caracteres | `PIX-400-007` | `CRD-400-004`; parte de `COB-400-001` |
| Idempotency-Key reusada com outro payload | `PIX-409-004` | `COB-409-004` |

O `COB-400-001` e mais largo que os outros: valida o header contra `[A-Za-z0-9._-]{1,100}` e junta
num codigo so ausencia, tamanho e caractere invalido.

Pelo ADR 0020 §3 cada condicao deveria ter um codigo so. Unificar exige renomear codigo publicado —
mudanca de contrato — e fica para uma sprint dedicada, que decide tambem a granularidade (o recorte do
`COB-400-001` ou o do `pix`/`credores`) e centraliza o limite de 100 caracteres, hoje escrito em cada
modulo. Decisao da Sprint 37: unificar **dentro** do `pix` e registrar o resto.

## Handlers sem codigo (13 de 17)

O `ApiExceptionHandler` tem 17 `@ExceptionHandler`. **Quatro** emitem codigo:

| Handler | Status | Origem do codigo |
|---|---|---|
| `handleDomain` | 400/403/404/409/422 | `DomainException.getCodigo()`, 5 subtipos selados |
| `handleLocked` | 423 | `ContaBloqueadaException.CODIGO` |
| `handleLimiteReprocesso` | 429 | `LimiteReprocessoExcedidoException.CODIGO` |
| `handleTipoReprocesso` | 400 | `TipoReprocessoNaoSuportadoException.CODIGO` |

Os outros **13** continuam omitindo o campo, porque o dominio tambem nao discrimina nessas
condicoes: `handleValidation`, `handleUnreadableBody`, `handleMissingRequestHeader`,
`handleTypeMismatch`, `handleDataIntegrity`, `handleNotFound`, `handleNoResource`,
`handleMethodNotSupported`, `handleAccessDenied`, `handleAuth`, `handleAssinaturaProvider`,
`handlePixProvider` e `handleGeneric`.

**Criar codigo para eles segue fora de escopo.** Inventar taxonomia nova e decisao de produto — exige
escolher nome, faixa e granularidade — e depende das personas, que o
[`DIAGNOSTICO-PRODUTO.md`](../../docs-sep/DIAGNOSTICO-PRODUTO.md) registra como inexistentes.

## Limitacao declarada: quatro corpos de erro nao passam pelo handler

`ErrorResponseDto` e montado em **cinco** lugares, e nao so no `build()` do `ApiExceptionHandler`.
Os outros quatro sao filtros e entry points da cadeia do Spring Security, que escrevem o corpo direto
na response e nunca chegam ao `@RestControllerAdvice`:

| Origem | Status | Codigo |
|---|---|---|
| `ApiAccessDeniedHandler` | 403 | — |
| `ApiAuthenticationEntryPoint` | 401 | — |
| `RateLimitFilter` | 429 | — |
| `PasswordResetEnforcementFilter` | 403 | `AUTH-403-001`, so no texto da `message` |

**`401`, `403` e `429` originados na cadeia de seguranca continuam sem o campo `codigo`.**

## Como um consumidor deve tratar o campo

1. **Nao assuma presenca.** Ramifique por `codigo` quando ele existir e caia no tratamento por
   status quando nao existir. Os 13 handlers acima garantem que a ausencia e permanente, nao
   transitoria.
2. **Nao derive significado do formato.** O `STATUS` embutido no codigo e informativo; o status
   autoritativo e o da resposta HTTP.
3. **Nao trate codigo desconhecido como erro.** O catalogo cresce, e crescer e compativel. Codigo
   nao reconhecido deve cair no tratamento por status.

## Verificacao

| O que | Onde |
|---|---|
| Particao completa, disjunta, e catalogo == codigos aptos do fonte | `ParticaoDeCodigosErroTest` |
| Formato, prefixo registrado, modulo dono, aposentados, ponto de lancamento legivel | `ConvencaoCodigosErroTest` |
| Nenhum codigo ja publicado sai do catalogo (143 congelados; a lista so cresce) | `CodigosPublicadosNaoMudamTest` |
| `enum` do OpenAPI == fonte unica; campo opcional; 3.1 e `securitySchemes` intactos | `CatalogoCodigosErroContratoTest` |
| Matriz por handler: status, codigo, headers, pertencimento ao catalogo | `MatrizFinalDeErroTest` |
| Cada subtipo selado emite o proprio codigo; matriz cobre todos os permitidos | `DomainExceptionCodigoNoCorpoTest` |
| Serializacao com e sem codigo | `ErrorResponseDtoTest` |

Todas rodam em `./gradlew build`. Nenhuma depende de numero registrado neste documento, exceto a lista
congelada dos 80, que e o contrato anterior a Sprint 37 por definicao.
