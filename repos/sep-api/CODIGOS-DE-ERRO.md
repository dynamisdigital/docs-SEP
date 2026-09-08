# CODIGOS DE ERRO - sep-api

Documento operacional do contrato de erro da API SEP. Criado pela **Sprint 36** (spec
[`036`](../../specs/fase-4/036-sprint-36-codigos-erro-no-fio.md), steps
[`036`](../../steps-fase-4/backend/036-sprint-36-steps.md)).

> **Destino deste documento.** Os steps da Sprint 36 apontavam o catalogo para
> [`CONTRATOS.md`](./CONTRATOS.md). Aquele arquivo e o doc operacional do **modulo `contratos`**
> (formalizacao, CCB, `StatusFormalizacao`) — assunto diferente e audiencia diferente. O catalogo
> ganhou arquivo proprio; a divergencia esta registrada no checkpoint da Task 36.7.

## O que mudou

Ate a Sprint 35 o `sep-api` construia uma taxonomia de erro no dominio e a **descartava na fronteira
HTTP**: `getCodigo()` tinha zero consumidores em `src/main`. O cliente so tinha o status para
discriminar, e por isso o `sep-app` acumulava ramificacao por status, mensagens byte-identicas entre
telas e um `verify-totp` que acusava "codigo invalido" em bloqueio, rate limit, 5xx e queda de rede.

A partir da Sprint 36 o corpo de erro carrega um campo **`codigo`** opcional.

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
nem semantica. Consumidor que ignora o campo novo nao percebe a sprint. Consumidor que ramifica por
`'codigo' in body` funciona porque a ausencia e ausencia de chave, nao `null`
(`@JsonInclude(NON_NULL)`).

## `codigo` + `traceId`: o par de suporte

- **`codigo`** diz **o que** aconteceu. E estavel entre chamadas, entre versoes e entre ambientes, e
  serve para o cliente ramificar e para a documentacao referenciar.
- **`traceId`** diz **qual** chamada foi. Muda a cada requisicao e serve para achar a ocorrencia no
  log.

Quem abre chamado reporta os dois: o `codigo` leva ao comportamento, o `traceId` a evidencia. Nenhum
dos dois sozinho resolve — codigo sem trace nao localiza, trace sem codigo nao classifica.

## Regra de nomenclatura

```text
MOD-STATUS-NNN
```

- **`MOD`** — prefixo de 3 ou 4 letras maiusculas identificando o modulo de origem.
- **`STATUS`** — o status HTTP com que a condicao chega ao cliente, com 3 digitos.
- **`NNN`** — sequencial de 3 digitos dentro do par modulo+status.

Regex canonica, aplicada no carregamento de `CatalogoCodigosErro`:

```text
^[A-Z]{3,4}-[0-9]{3}-[0-9]{3}$
```

**Acrescentar codigo ao catalogo e mudanca compativel. Renomear codigo ja publicado nao e** — depois
de publicado, o par `codigo + traceId` e o identificador que o usuario reporta, e o valor esta no
`enum` do OpenAPI consumido pelo `contract:check` do `sep-app`.

## O perimetro: por que nem todo codigo esta aqui

O Gate 36.0 mediu **133 codigos unicos** em `src/main`. Um codigo so entra no contrato se satisfizer
os **tres** criterios:

1. **formato canonico** — casa a regex acima;
2. **uma condicao** — o valor identifica **uma** situacao, e nao um conjunto delas. Isso e mais forte
   que "um unico dono": uma classe de excecao **nomeia** a condicao, entao seus construtores
   sobrecarregados sao variantes de mensagem da mesma coisa; mas um literal solto num use case ou
   controller nao nomeia nada, e ali cada mensagem distinta e uma condicao distinta. Foi por confundir
   as duas que sete codigos ambiguos entraram no catalogo e tiveram de sair;
3. **alcancavel** — existe caminho de runtime da excecao ate a montagem do corpo.

Codigo que falha em qualquer um **simplesmente nao emite `codigo`**. O campo e opcional, entao a
resposta continua valida e nada regride. O filtro vale **no fio, e nao so no documento**:
`ApiExceptionHandler.somenteSePublicado` recusa qualquer valor fora do catalogo, para que a resposta
nunca carregue algo que o `enum` publicado nao declara.

A assimetria e o motivo do perimetro ser conservador: **publicar mais codigos depois nao quebra
ninguem; renomear codigo ja publicado quebra.**

## Particao

```text
133 codigos unicos = 80 publicados + 53 excluidos      intersecao = 0
excluidos: 30 por formato · 23 por colisao · 0 inalcancaveis
```

As 23 colisoes sao de **dois tipos**, e o segundo so foi medido no code review de fechamento:

- **16 entre classes** — o mesmo valor tem dono em dois arquivos diferentes;
- **7 dentro da mesma classe** — o mesmo valor e lancado para condicoes diferentes no mesmo
  arquivo. `ONB-400-004` e o caso que os nomeia: a constante chama-se `CODIGO_TAMANHO_EXCEDIDO` e e
  lancada tambem para "Conteudo do documento e obrigatorio".

A primeira versao da particao contava **classes donas**, e classe nao implica condicao. Esses sete
passaram pelo criterio e chegaram a entrar no catalogo publicado; foram retirados.

A particao **nao e um numero escrito aqui**: e recalculada a cada `./gradlew build` por
`ParticaoDeCodigosErroTest`, que varre `src/main/java` do zero e reprova se o catalogo divergir do
codigo-fonte em qualquer direcao.

## Catalogo publicado (80)

| Prefixo | Modulo | Qtd | Codigos |
|---|---|---|---|
| `ASN` | contratos (assinatura) | 2 | `ASN-400-002`, `ASN-400-003` |
| `AUTH` | identity | 3 | `AUTH-400-101`, `AUTH-400-102`, `AUTH-423-001` |
| `BOF` | backoffice | 5 | `BOF-400-001`, `BOF-400-002`, `BOF-404-001`, `BOF-409-001`, `BOF-429-001` |
| `COB` | cobranca | 7 | `COB-400-001`, `COB-403-001`, `COB-404-001`, `COB-404-002`, `COB-404-003`, `COB-409-001`, `COB-409-003` |
| `CRD` | credito + credores | 26 | `CRD-400-003`, `CRD-400-004`, `CRD-400-005`, `CRD-400-006`, `CRD-400-007`, `CRD-400-008`, `CRD-400-009`, `CRD-400-010`, `CRD-400-011`, `CRD-400-012`, `CRD-400-013`, `CRD-400-014`, `CRD-400-015`, `CRD-404-003`, `CRD-404-004`, `CRD-404-005`, `CRD-404-006`, `CRD-404-007`, `CRD-404-008`, `CRD-409-001`, `CRD-409-003`, `CRD-409-004`, `CRD-409-005`, `CRD-409-006`, `CRD-409-007`, `CRD-422-004` |
| `CTR` | contratos | 10 | `CTR-400-001`, `CTR-403-001`, `CTR-404-001`, `CTR-409-001`, `CTR-409-002`, `CTR-409-003`, `CTR-422-001`, `CTR-422-002`, `CTR-422-003`, `CTR-422-004` |
| `GOV` | governanca | 2 | `GOV-400-001`, `GOV-404-001` |
| `MFA` | identity (MFA) | 5 | `MFA-400-001`, `MFA-400-002`, `MFA-400-003`, `MFA-400-004`, `MFA-409-001` |
| `ONB` | onboarding | 13 | `ONB-400-001`, `ONB-400-003`, `ONB-400-005`, `ONB-400-009`, `ONB-400-010`, `ONB-400-011`, `ONB-400-012`, `ONB-400-013`, `ONB-400-016`, `ONB-400-018`, `ONB-404-002`, `ONB-409-001`, `ONB-409-002` |
| `PIX` | pix | 2 | `PIX-400-001`, `PIX-404-001` |
| `USR` | usuarios | 4 | `USR-403-001`, `USR-403-002`, `USR-404-001`, `USR-409-001` |
| `WHK` | shared (webhooks) | 1 | `WHK-400-001` |

Fonte unica: `shared/exception/CatalogoCodigosErro.java`. O `enum` do campo `codigo` em
`components/schemas/ErrorResponseDto` do OpenAPI deriva dela por `OpenApiCustomizer`, publicado uma
vez e nao por operacao.

## Excluidos (53) — o que ficou fora e por que

Motivos possiveis: `formato`, `colisao`, `inalcancavel`.

| Codigo | Classes donas | Modulo | Motivo | Observacao |
|---|---|---|---|---|
| `ASN-400-001` | AssinaturaWebhookController | `contratos` | `colisao` | **mais de uma condicao na mesma classe** — separar na Sprint 37 |
| `AUTH-403-PASSWORD_RESET_REQUIRED` | PasswordResetEnforcementFilter | `identity` | `formato` | sufixo semantico; convencao a decidir na Sprint 37 |
| `COB-409-002` | ChaveIdempotenciaConflitanteException, RenegociacaoConflitanteException | `cobranca` | `colisao` | 2 classes donas — renumerar ou deduplicar na Sprint 37 |
| `CRD-400-001` | AssociarOperacaoFinanciadaUseCase, PropostaInvalidaException | `credito, credores` | `colisao` | 2 classes donas — renumerar ou deduplicar na Sprint 37 |
| `CRD-400-002` | RegistrarAporteCredoraUseCase, StatusPropostaInvalidoException | `credito, credores` | `colisao` | 2 classes donas — renumerar ou deduplicar na Sprint 37 |
| `CRD-403-001` | OwnershipCredoraException, OwnershipPropostaException | `credito, credores` | `colisao` | 2 classes donas — renumerar ou deduplicar na Sprint 37 |
| `CRD-404-001` | EmpresaCredoraNaoEncontradaException, PropostaNaoEncontradaException | `credito, credores` | `colisao` | 2 classes donas — renumerar ou deduplicar na Sprint 37 |
| `CRD-404-002` | ConsentimentoNaoEncontradoException, OportunidadeNaoEncontradaException | `credito, credores` | `colisao` | 2 classes donas — renumerar ou deduplicar na Sprint 37 |
| `CRD-409-002` | ConsentimentoAtivoException, InteresseDuplicadoException | `credito, credores` | `colisao` | 2 classes donas — renumerar ou deduplicar na Sprint 37 |
| `CRD-422-001` | OnboardingInvalidoParaCredoraException, OnboardingNaoAprovadoException | `credito, credores` | `colisao` | 2 classes donas — renumerar ou deduplicar na Sprint 37 |
| `CRD-422-002` | CredoraNaoElegivelException, OpenFinanceFluxoInvalidoException | `credito, credores` | `colisao` | 2 classes donas — renumerar ou deduplicar na Sprint 37 |
| `CRD-422-003` | ConsentimentoNaoAutorizadoException, OportunidadeIndisponivelException | `credito, credores` | `colisao` | 2 classes donas — renumerar ou deduplicar na Sprint 37 |
| `OF-400-001` | CelcoinOpenFinanceWebhookController | `credito` | `formato` | sufixo semantico; convencao a decidir na Sprint 37 |
| `ONB-400-002` | IniciarOnboardingPessoaUseCase | `onboarding` | `colisao` | **mais de uma condicao na mesma classe** — separar na Sprint 37 |
| `ONB-400-004` | EnviarDocumentoUseCase | `onboarding` | `colisao` | **mais de uma condicao na mesma classe** — separar na Sprint 37 |
| `ONB-400-006` | CelcoinKycWebhookController, IniciarOnboardingEmpresaUseCase | `onboarding` | `colisao` | 2 classes donas — renumerar ou deduplicar na Sprint 37 |
| `ONB-400-007` | IniciarOnboardingEmpresaUseCase, OnboardingEmpresaController, OnboardingPessoaController | `onboarding` | `colisao` | 3 classes donas — renumerar ou deduplicar na Sprint 37 |
| `ONB-400-008` | ConsultarStatusOnboardingEmpresaUseCase, IniciarVerificacaoKybUseCase | `onboarding` | `colisao` | 2 classes donas — renumerar ou deduplicar na Sprint 37 |
| `ONB-400-014` | CelcoinKybWebhookController | `onboarding` | `colisao` | **mais de uma condicao na mesma classe** — separar na Sprint 37 |
| `ONB-400-015` | CelcoinPldWebhookController | `onboarding` | `colisao` | **mais de uma condicao na mesma classe** — separar na Sprint 37 |
| `ONB-404-001` | CriarPropostaCreditoUseCase, OnboardingNaoEncontradoException | `credito, onboarding` | `colisao` | 2 classes donas — renumerar ou deduplicar na Sprint 37 |
| `PIX-400-002` | PixWebhookController | `pix` | `colisao` | **mais de uma condicao na mesma classe** — separar na Sprint 37 |
| `PIX-400-CHAVE` | NormalizadorChavePix, SolicitarDesembolsoPixUseCase | `pix` | `formato` | sufixo semantico; convencao a decidir na Sprint 37 |
| `PIX-400-CHAVE-TIPO` | NormalizadorChavePix | `pix` | `formato` | sufixo semantico; convencao a decidir na Sprint 37 |
| `PIX-400-CONTRATO` | SolicitarDesembolsoPixUseCase | `pix` | `formato` | sufixo semantico; convencao a decidir na Sprint 37 |
| `PIX-400-IDEMPOTENCY-KEY` | CadastrarChavePixUseCase, SolicitarDesembolsoPixUseCase | `pix` | `formato` | sufixo semantico; convencao a decidir na Sprint 37 |
| `PIX-400-IDEMPOTENCY-KEY-TAMANHO` | CadastrarChavePixUseCase, SolicitarDesembolsoPixUseCase | `pix` | `formato` | sufixo semantico; convencao a decidir na Sprint 37 |
| `PIX-400-PARCELA` | GerarReferenciaRecebimentoPixUseCase | `pix` | `formato` | sufixo semantico; convencao a decidir na Sprint 37 |
| `PIX-400-VALOR` | SolicitarDesembolsoPixUseCase | `pix` | `formato` | sufixo semantico; convencao a decidir na Sprint 37 |
| `PIX-400-VALOR-ESCALA` | SolicitarDesembolsoPixUseCase | `pix` | `formato` | sufixo semantico; convencao a decidir na Sprint 37 |
| `PIX-404-CHAVE` | RemoverChavePixUseCase | `pix` | `formato` | sufixo semantico; convencao a decidir na Sprint 37 |
| `PIX-404-CONTRATO` | SolicitarDesembolsoPixUseCase | `pix` | `formato` | sufixo semantico; convencao a decidir na Sprint 37 |
| `PIX-404-PARCELA` | GerarReferenciaRecebimentoPixUseCase | `pix` | `formato` | sufixo semantico; convencao a decidir na Sprint 37 |
| `PIX-404-RECEBIMENTO` | ConsultarRecebimentoPixUseCase | `pix` | `formato` | sufixo semantico; convencao a decidir na Sprint 37 |
| `PIX-404-REFERENCIA` | ConsultarReferenciaRecebimentoPixUseCase | `pix` | `formato` | sufixo semantico; convencao a decidir na Sprint 37 |
| `PIX-404-TRANSFERENCIA` | ConsultarStatusDesembolsoPixUseCase | `pix` | `formato` | sufixo semantico; convencao a decidir na Sprint 37 |
| `PIX-409-CHAVE-ATIVA` | CadastrarChavePixUseCase | `pix` | `formato` | sufixo semantico; convencao a decidir na Sprint 37 |
| `PIX-409-CONFLITO-CONCORRENTE` | DesembolsoTransacaoService | `pix` | `formato` | sufixo semantico; convencao a decidir na Sprint 37 |
| `PIX-409-DESEMBOLSO-DUPLICADO` | SolicitarDesembolsoPixUseCase | `pix` | `formato` | sufixo semantico; convencao a decidir na Sprint 37 |
| `PIX-409-IDEMPOTENCIA` | SolicitarDesembolsoPixUseCase | `pix` | `formato` | sufixo semantico; convencao a decidir na Sprint 37 |
| `PIX-409-IDEMPOTENCIA-CHAVE` | CadastrarChavePixUseCase | `pix` | `formato` | sufixo semantico; convencao a decidir na Sprint 37 |
| `PIX-409-REFERENCIA-CONCORRENTE` | GerarReferenciaRecebimentoPixUseCase | `pix` | `formato` | sufixo semantico; convencao a decidir na Sprint 37 |
| `PIX-422-AGENDA-INEXISTENTE` | SolicitarDesembolsoPixUseCase | `pix` | `formato` | sufixo semantico; convencao a decidir na Sprint 37 |
| `PIX-422-CONTA-OPERACIONAL` | CadastrarChavePixUseCase | `pix` | `formato` | sufixo semantico; convencao a decidir na Sprint 37 |
| `PIX-422-CONTRATO-NAO-ASSINADO` | SolicitarDesembolsoPixUseCase | `pix` | `formato` | sufixo semantico; convencao a decidir na Sprint 37 |
| `PIX-422-ESCROW-INOPERANTE` | SolicitarDesembolsoPixUseCase | `pix` | `formato` | sufixo semantico; convencao a decidir na Sprint 37 |
| `PIX-422-PARCELA-NAO-RECEBIVEL` | GerarReferenciaRecebimentoPixUseCase | `pix` | `formato` | sufixo semantico; convencao a decidir na Sprint 37 |
| `PIX-422-PARCELA-SEM-SALDO` | GerarReferenciaRecebimentoPixUseCase | `pix` | `formato` | sufixo semantico; convencao a decidir na Sprint 37 |
| `PIX-422-VALOR-DIVERGENTE` | SolicitarDesembolsoPixUseCase | `pix` | `formato` | sufixo semantico; convencao a decidir na Sprint 37 |
| `PIX-422-VALOR-INDISPONIVEL` | SolicitarDesembolsoPixUseCase | `pix` | `formato` | sufixo semantico; convencao a decidir na Sprint 37 |
| `USR-400-001` | AlterarRoleUsuarioUseCase, SenhaAtualIncorretaException | `usuarios` | `colisao` | 2 classes donas — renumerar ou deduplicar na Sprint 37 |
| `USR-400-002` | CriarUsuarioUseCase, GerenciarRolesUsuarioUseCase | `usuarios` | `colisao` | 2 classes donas — renumerar ou deduplicar na Sprint 37 |
| `WHK-400-002` | WebhookController | `shared` | `colisao` | **mais de uma condicao na mesma classe** — separar na Sprint 37 |

**Os 30 de `formato`** sao 28 do modulo `pix` mais `AUTH-403-PASSWORD_RESET_REQUIRED` e
`OF-400-001`. No `pix` o sufixo semantico e **majoritario** — 28 dos 31 codigos do modulo —, entao
chamar isso de desvio inverte os papeis: dentro do `pix`, quem foge da convencao local sao os tres
numericos. Escolher entre as duas convencoes e decisao de taxonomia e pertence a **Sprint 37**, que
preve ADR. O `OF-400-001` falha por outro motivo: prefixo de duas letras.

**Das 23 de `colisao`, as 16 entre classes** sao de tres tipos, medidos e nao estimados, e o
tratamento difere:

- **9 de faixa compartilhada** (`credito` x `credores`) — o modulo `credores` foi construido
  reusando a faixa `CRD-*` do `credito`: `CRD-400-001`, `CRD-400-002`, `CRD-403-001`, `CRD-404-001`,
  `CRD-404-002`, `CRD-409-002`, `CRD-422-001`, `CRD-422-002` e `CRD-422-003`. Exige re-prefixar um
  modulo inteiro, e e `credores` quem ocupa `CRD` majoritariamente.
- **2 de duplicacao com significado identico** — `ONB-404-001` (a mesma condicao "solicitacao de
  onboarding nao encontrada" escrita em `OnboardingNaoEncontradoException` e reescrita inline em
  `CriarPropostaCreditoUseCase`) e `ONB-400-008` (a mesma frase "Solicitacao nao e do tipo EMPRESA"
  em dois use cases). Corrigem-se por **deduplicacao**, nao por renumeracao: renumerar criaria dois
  codigos onde deve haver um.
- **5 de colisao real intra-modulo** — `COB-409-002`, `ONB-400-006`, `ONB-400-007`, `USR-400-001` e
  `USR-400-002`. Renumerar um dos lados.

> `ONB-400-007` merece nota: a §Ancora 7 da spec 036 o classificava como duplicacao benigna. Sao
> **tres** sites, nao dois — os dois `CODIGO_ARQUIVO_INVALIDO` mais um terceiro em
> `IniciarOnboardingEmpresaUseCase:86`, que o usa para "campo obrigatorio". E colisao real.

**Caso que merece nome**: `AUTH-403-PASSWORD_RESET_REQUIRED` ja chega ao cliente hoje, concatenado
**dentro da `message`** em `PasswordResetEnforcementFilter`. E um contorno anterior a esta sprint, e
a prova de que a demanda por codigo no fio existia antes do campo.

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

**Criar codigo para eles esta fora do escopo da Sprint 36.** Inventar taxonomia nova e decisao de
produto — exige escolher nome, faixa e granularidade — e depende das personas, que o
[`DIAGNOSTICO-PRODUTO.md`](../../docs-sep/DIAGNOSTICO-PRODUTO.md) registra como inexistentes.

## Limitacao declarada: quatro corpos de erro nao passam pelo handler

`ErrorResponseDto` e montado em **cinco** lugares, e nao so no `build()` do `ApiExceptionHandler`
(a Spec 036 §Ancora 4 afirmava o contrario; o Gate 36.0 derrubou). Os outros quatro sao filtros e
entry points da cadeia do Spring Security, que escrevem o corpo direto na response e nunca chegam ao
`@RestControllerAdvice`:

| Origem | Status |
|---|---|
| `ApiAccessDeniedHandler` | 403 |
| `ApiAuthenticationEntryPoint` | 401 |
| `RateLimitFilter` | 429 |
| `PasswordResetEnforcementFilter` | 403 |

**`401`, `403` e `429` originados na cadeia de seguranca continuam sem `codigo`.** Ficou fora do
escopo por decisao: nenhum deles carrega codigo canonico hoje, e dar-lhes um cairia na proibicao de
inventar taxonomia.

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
| Particao completa, disjunta, e catalogo == codigo-fonte | `ParticaoDeCodigosErroTest` |
| Catalogo publicado no OpenAPI == fonte unica; campo opcional; 3.1 e `securitySchemes` intactos | `CatalogoCodigosErroContratoTest` |
| Matriz por handler: status, codigo, headers, pertencimento ao catalogo | `MatrizFinalDeErroTest` |
| Cada subtipo selado emite o proprio codigo; matriz cobre todos os permitidos | `DomainExceptionCodigoNoCorpoTest` |
| Serializacao com e sem codigo | `ErrorResponseDtoTest` |

Todas rodam em `./gradlew build`. Nenhuma depende de numero registrado neste documento.
