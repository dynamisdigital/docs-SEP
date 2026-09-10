# ADR 0020 - Convencao dos codigos de erro: prefixo por area funcional, sufixo numerico

## Status

Aceito (Sprint 37 — Fase 4). Decisoes do responsavel pelo repo em 2026-09-10, tomadas sobre a
medicao antecipada do Gate 37.0.

## Contexto

A Sprint 36 ([`036`](../specs/fase-4/036-sprint-36-codigos-erro-no-fio.md)) pos o campo `codigo` no
corpo de erro e publicou **80** codigos no contrato (`CatalogoCodigosErro`), deixando **53** fora do
perimetro: 30 por formato e 23 por colisao, cada um com motivo em
[`CODIGOS-DE-ERRO.md`](../repos/sep-api/CODIGOS-DE-ERRO.md). Nunca houve decisao sobre o que o
prefixo significa nem sobre a convencao de sufixo: cada sprint escolheu o seu, e o resultado foi um
prefixo (`CRD`) em dois modulos e duas convencoes de sufixo convivendo.

A [`037`](../specs/fase-4/037-sprint-37-normalizacao-taxonomia-erro.md) foi escrita em 2026-09-01,
**antes** da 036 publicar. Medido em 2026-09-10, em `develop` `a774aa4` do `sep-api`:

| Fato | Consequencia para a decisao |
|---|---|
| Os **80 publicados sao todos numericos** (`MOD-STATUS-NNN`) | Sufixo semantico exigiria renomear os 80 |
| Os **29 semanticos** (28 do `pix` e `AUTH-403-PASSWORD_RESET_REQUIRED`) estao **todos excluidos** | Sufixo numerico converte 29 codigos que ninguem consome |
| Os **26 `CRD` publicados sao todos do `credores`** | Re-prefixar o `credores` renomearia 26 codigos de contrato |
| Os **9 `CRD` do `credito`** estao todos excluidos, colidindo um a um com o `credores` | Re-prefixar o `credito` resolve as 9 colisoes sem tocar contrato |
| Nos fronts, so `MFA-400-003`/`004` sao **ramificados** (web e mobile), e a F-Sprint 28 os gateou; `CRD-409-001`, `AUTH-423-001` e `MFA-400-002` aparecem so em comentario | Fundir `MFA` em `AUTH` quebraria codigo consumido e gateado |

Regra ja vigente desde a 036: **acrescentar codigo ao catalogo e compativel; renomear codigo
publicado e mudanca de contrato.**

## Decisao

### 1. O prefixo identifica uma area funcional

- Um prefixo pertence a **uma** area funcional, com **um** modulo dono. Um modulo pode ter mais de um
  prefixo (`identity`: `AUTH` e `MFA`; `contratos`: `CTR` e `ASN`); **o mesmo prefixo nunca aparece
  em dois modulos**.
- Os prefixos vivem num **registro unico no codigo**, com dono e significado. Prefixo fora do
  registro reprova o build.
- **O `credito` sai da faixa `CRD` e passa a `PRP`** (proposta de credito). `CRD` fica com o
  `credores`, que ja tem 26 codigos publicados nele. O Open Finance do `credito` (`OF-400-001`, fora
  do formato por ter duas letras) entra em `PRP`.

Registro inicial:

| Prefixo | Modulo dono | Area |
|---|---|---|
| `ASN` | `contratos` | assinatura digital |
| `AUTH` | `identity` | autenticacao e sessao |
| `BOF` | `backoffice` | fila e operacao de backoffice |
| `COB` | `cobranca` | cobranca e renegociacao |
| `CRD` | `credores` | credora: cadastro, oportunidade, interesse, aporte |
| `CTR` | `contratos` | formalizacao contratual |
| `GOV` | `governanca` | parametros e papeis |
| `MFA` | `identity` | segundo fator |
| `ONB` | `onboarding` | KYC, KYB e PLD |
| `PIX` | `pix` | desembolso, recebimento e chaves |
| `PRP` | `credito` | proposta de credito e Open Finance |
| `USR` | `usuarios` | cadastro e senha de usuario |
| `WHK` | `shared` | recepcao de webhooks |

**Alternativas rejeitadas, com o custo medido:**

- *`credores` sai do `CRD`* (recomendacao original da spec 037): renomeia **26 codigos publicados**;
  viola o criterio 8 da propria spec.
- *Prefixo = modulo*: funde `MFA` em `AUTH` (5 publicados, 2 ramificados por web e mobile e gateados)
  e `ASN` em `CTR` (2 publicados).
- *So renumerar as colisoes*: tambem gratis, mas `CRD` segue em dois modulos e a proxima colisao e
  questao de tempo.

### 2. O sufixo e numerico

- Todo codigo segue `^[A-Z]{3,4}-[0-9]{3}-[0-9]{3}$` — `MOD-STATUS-NNN`, sem excecao. `NNN` e
  sequencial dentro do par prefixo + status.
- Os 29 codigos semanticos sao convertidos. Nenhum esta publicado.

**Alternativa rejeitada**: *sufixo semantico* (recomendacao original da spec 037). E
auto-documentavel no log, mas exigiria renomear os **80 publicados**, incluindo `MFA-400-003`/`004`,
que web e mobile ramificam.

### 3. Unicidade e imutabilidade

- **Um codigo identifica uma condicao e tem um dono** — a classe de excecao que nomeia a condicao, ou
  um unico ponto de lancamento inline.
- **A mesma condicao em mais de um lugar vira uma excecao nomeada unica**, e nunca dois codigos. Dois
  codigos para uma condicao pioram a taxonomia tanto quanto um codigo para duas.
- **Codigo publicado nao se renomeia, nao se reutiliza e nao muda de significado.** Numero retirado
  nao volta ao uso.
- **Codigo novo nasce no formato e com prefixo registrado** — ou o build reprova.

### 4. Codigo apto e codigo publicado

Todo codigo apto — formato canonico, um dono, uma condicao, alcancavel ate a montagem do corpo — e
publicado. `ParticaoDeCodigosErroTest` ja exige `aptos == catalogo`, e isto passa a ser politica, nao
acidente: a Sprint 37 publica os codigos que normalizar.

## Consequencias

### Positivas

- A regra e verificavel por teste, no build: formato, prefixo registrado e dono unico.
- A Sprint 37 normaliza a taxonomia **sem nenhuma mudanca de contrato**: tudo o que ela renomeia esta
  fora do catalogo publicado.
- O catalogo cresce, e crescer e compativel. O `contract:check` do `sep-app` tolera o crescimento
  (`enumSubset`, F-Sprint 28).

### Negativas

- **Codigo numerico e opaco**: o significado mora no catalogo
  ([`CODIGOS-DE-ERRO.md`](../repos/sep-api/CODIGOS-DE-ERRO.md)), nao no log. Suporte e cliente
  precisam consultar o documento.
- **`CRD` significa "credora"**, embora a leitura natural seja "credito". O registro documenta; o
  custo de mudar seria renomear 26 codigos publicados.
- Codigo novo exige consultar o registro antes de nascer.

### Neutras

- `sep-app` e `sep-mobile` nao precisam mudar. O snapshot OpenAPI do web cresce na proxima
  renovacao.
- Os 13 handlers sem taxonomia e os quatro corpos de erro fora do `ApiExceptionHandler` seguem como
  estao; criar codigo para eles continua dependendo de personas.

## Referencias

- [`specs/fase-4/037-sprint-37-normalizacao-taxonomia-erro.md`](../specs/fase-4/037-sprint-37-normalizacao-taxonomia-erro.md)
- [`steps-fase-4/backend/037-sprint-37-steps.md`](../steps-fase-4/backend/037-sprint-37-steps.md)
- [`repos/sep-api/CODIGOS-DE-ERRO.md`](../repos/sep-api/CODIGOS-DE-ERRO.md)
- [`specs/fase-4/036-sprint-36-codigos-erro-no-fio.md`](../specs/fase-4/036-sprint-36-codigos-erro-no-fio.md)
