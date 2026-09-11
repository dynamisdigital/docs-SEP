# Spec 037 - Sprint 37 - Normalizar a taxonomia de codigos de erro

## Metadados

- **ID da Spec**: 037
- **Titulo**: Sprint 37 - Decidir o que o prefixo significa e qual e a convencao de sufixo, resolver
  as colisoes de significado e re-prefixar o modulo `credores`, para que o restante da taxonomia
  fique publicavel
- **Status**: **MERGEADA develop+main em 2026-09-10** — PR #110 (squash `c8b98ae`) em `develop` e
  #111 (`5fe83a1`) em `main`, conferidos por conteudo — [ADR 0020](../../adr/0020-convencao-codigos-de-erro.md); steps em
  [`037`](../../steps-fase-4/backend/037-sprint-37-steps.md). Ver §Decidido em 2026-09-10 e §Resultado
- **Fase do produto**: Fase 4 - divida de contrato; sem endpoint, migration, evento, provider ou
  regra de negocio nova. **ADR previsto** — ver §Por que esta sprint exige ADR
- **Trilha**: Backend (`sep-api`)
- **Origem**: escopo que a [`036`](./036-sprint-36-codigos-erro-no-fio.md) deixou **explicitamente
  fora** ao adotar o perimetro (036 §Decisao tecnica principal e §Escopo/Fora)
- **Depende de**: [`036`](./036-sprint-36-codigos-erro-no-fio.md) integrada em `develop`, **e da
  lista de excluidos que a Task 36.7 entrega** — e ela que dimensiona esta sprint. Sem ela, esta spec
  e estimativa
- **Desbloqueia**: uma segunda rodada de publicacao (os codigos normalizados entram no catalogo) e,
  por consequencia, mais discriminacao no `sep-app` e no `sep-mobile`
- **Responsavel principal**: Devs Plenos Backend

## Numeracao

Consome o numero **37**. A [`036`](./036-sprint-36-codigos-erro-no-fio.md) ja havia empurrado o
backend da Fase 5 de 36-39 para **37-40**. Com esta spec, **o backend da Fase 5 renumera para
38-41**, e o [`PRD-FASE-5.md`](../../docs-sep/PRD-FASE-5.md) §46/§47 foi atualizado no mesmo ciclo. E
o **quinto** recuo, pelo mesmo precedente aplicado nas sprints 33, 34, 35 e 36.

> **Encerrado em 2026-09-01**: a numeracao passou a ter **faixa reservada por fase** — Fases 1-4 em 0-49, Fase 5 em 50-99 ([`AGENT.md`](../../AGENT.md) §Numeracao de sprint e de spec). Este recuo foi um dos **oito** que o mecanismo antigo produziu, e o mecanismo **nao existe mais**: a Fase 4 cresce dentro da propria faixa sem tocar na Fase 5. O registro acima e historico.

## Objetivo

A [`036`](./036-sprint-36-codigos-erro-no-fio.md) publica o subconjunto apto e deixa fora o que tem
colisao de significado ou formato divergente. Esta sprint torna o resto apto.

O trabalho **nao** e renomear codigo. E decidir duas coisas que nunca foram decididas, e so depois
renomear:

1. **O que o prefixo significa.**
2. **Qual e a convencao de sufixo.**

Enquanto as duas estiverem em aberto, qualquer rename e chute com sotaque tecnico — e caro, porque
rename de codigo publicado nao volta.

## Decidido em 2026-09-10 — as duas recomendacoes desta spec cairam

Esta spec foi escrita **antes** da 036 publicar. A §Ancora 6 avisava que o publicado condicionaria
tudo; medido em 2026-09-10 (`develop` `a774aa4`), condicionou:

- os **26 `CRD` publicados sao todos do `credores`**, e os 9 do `credito` estao todos excluidos
  — recomendar que o `credores` saia do `CRD` (§Decisao 1, (b)) renomearia 26 codigos de contrato;
- os **80 publicados sao todos numericos** e os 29 semanticos estao todos excluidos — recomendar sufixo
  semantico (§Decisao 2, (a)) renomearia os 80, incluindo `MFA-400-003`/`004`, ramificados por web e
  mobile e gateados pela F-Sprint 28.

**Decidido pelo responsavel pelo repo** ([ADR 0020](../../adr/0020-convencao-codigos-de-erro.md)):
prefixo = area funcional com **o `credito` saindo do `CRD` para `PRP`**; **sufixo numerico**; e
**publicacao na propria sprint** — o `ParticaoDeCodigosErroTest` exige `aptos == catalogo`, entao
normalizar sem publicar e estruturalmente impossivel. Tudo o que a sprint renomeia esta fora do
catalogo: **zero mudanca de contrato**.

**Escopo acrescentado**: os **7 codigos de tipo D** — mais de uma condicao **na mesma classe** —, que o
code review de fechamento da 036 retirou do catalogo depois desta spec ser escrita. As secoes abaixo
sao o registro de 2026-09-01; onde divergirem, valem este bloco, o ADR e os steps.

## Ancoras verificadas (2026-09-01)

### 1. O prefixo NAO e identificador de modulo — e rotulo ad hoc

```bash
for m in credito credores onboarding contratos cobranca pix usuarios identity backoffice governanca shared; do
  grep -rhoE '"[A-Z]{3,4}-[0-9]{3}-[A-Z0-9-]*"' src/main/java/com/dynamis/sep_api/$m --include=*.java \
    | sed 's/"//g;s/-.*//' | sort -u | tr '\n' ' '
done
```

| Modulo | Codigos | Prefixos usados |
|---|---|---|
| `credores` | **35** | `CRD` |
| `pix` | 31 | `PIX` |
| `onboarding` | 21 | `ONB` |
| `contratos` | 13 | **`ASN`, `CTR`** |
| `credito` | **10** | **`CRD`, `ONB`** |
| `identity` | 8 | **`AUTH`, `MFA`** |
| `cobranca` | 8 | `COB` |
| `usuarios` | 6 | `USR` |
| `backoffice` | 5 | `BOF` |
| `governanca` | 2 | `GOV` |
| `shared` | 2 | `WHK` |

Tres padroes distintos convivem:

- **Um modulo, dois prefixos**: `contratos` (`CTR` + `ASN` de assinatura), `identity` (`AUTH` + `MFA`).
  Pode ser sub-dominio legitimo.
- **Um prefixo, dois modulos**: `CRD` em `credito` **e** `credores`; `ONB` em `onboarding` **e**
  `credito`. E a fonte das colisoes.
- **Prefixo sem modulo correspondente**: `WHK` (webhook) mora em `shared`.

**Nao ha registro de prefixos em lugar nenhum** — nem constante, nem enum, nem doc. Cada sprint
escolheu o seu.

### 2. O "squat" do `CRD` esta invertido em relacao ao esperado

`credores` usa **35** codigos, todos `CRD-*`. `credito` — dono semantico do prefixo — usa **10**, e
ainda por cima **vaza para `ONB-404-001`** em
`credito/application/usecase/CriarPropostaCreditoUseCase.java`.

Ou seja: **quem ocupa a faixa `CRD` majoritariamente e o modulo que nao lhe da nome.** Renomear "o
invasor" custa 35 renames para poupar 10.

Isto e decisao, nao detalhe de execucao. Ver §Decisao tecnica principal.

### 3. As 12 colisoes sao de tres tipos, com custos muito diferentes

| Tipo | Casos | Natureza | Correcao |
|---|---|---|---|
| **A — faixa compartilhada** | 8 | `credito` x `credores`, ambos em `CRD-*` | Re-prefixar um dos dois modulos (35 ou 10 codigos) |
| **B — constante duplicada, mesmo significado** | 2 | `ONB-400-007` (`CODIGO_ARQUIVO_INVALIDO` em dois controllers), `ONB-400-008` (`CODIGO_TIPO_INVALIDO` em dois use cases) | **Nao renumerar** — extrair para constante unica |
| **C — colisao real intra-modulo** | 3 | `ONB-400-006` (CNPJ invalido / header obrigatorio), `USR-400-001` (senha atual incorreta / role invalida), `COB-409-002` (chave de idempotencia / renegociacao conflitante) | Renumerar um dos lados |

**O tipo B nao e colisao** — e duplicacao de constante com semantica identica. Tratar como colisao
produziria dois codigos onde deve haver um, piorando a taxonomia. Chamar os 12 de "colisoes" no
plano anterior era impreciso: sao **11 codigos a corrigir**, dos quais 2 por deduplicacao e 9 por
renumeracao ou re-prefixacao.

### 4. O modulo `PIX` nao "desvia" da convencao — ele tem outra, e e maioria dentro dele

```bash
grep -rhoE '"PIX-[0-9]{3}-[A-Z0-9-]*"' src/main/java --include=*.java | sort -u
```

Dos **31** codigos `PIX`, apenas **tres** usam sequencial numerico (`PIX-400-001`, `PIX-400-002`,
`PIX-404-001`). Os outros **28** usam sufixo semantico: `PIX-422-CONTRATO-NAO-ASSINADO`,
`PIX-409-DESEMBOLSO-DUPLICADO`, `PIX-422-PARCELA-SEM-SALDO`, `PIX-404-RECEBIMENTO`...

**A leitura da Spec 036 §Ancora 6 estava enviesada**: ela contou os semanticos como violacao porque
media contra `MOD-STATUS-NNN`. Dentro do `PIX`, quem viola a convencao local sao os **tres
numericos**.

Isto transforma o item de "corrigir 11 desvios" em "escolher entre duas convencoes que ja existem no
codigo, cada uma com dono".

### 5. Dezenove codigos aparecem em testes

```bash
grep -rhoE '"[A-Z]{3,4}-[0-9]{3}-[A-Z0-9-]*"' src/test/java --include=*.java | sort -u | wc -l   # 19
grep -rloE '"[A-Z]{3,4}-[0-9]{3}-[A-Z0-9-]*"' src/test/java --include=*.java | wc -l             # 6 arquivos
```

Fallout de rename e pequeno e concentrado. Nao e risco; e checklist.

### 6. O que a 036 tera publicado condiciona tudo

Codigo **nao publicado** renomeia de graca. Codigo **publicado** pela 036 nao renomeia sem mudanca de
contrato. O perimetro da 036 foi desenhado para que esta sprint pegue exatamente o conjunto ainda
livre — mas isso **precisa ser reconferido no Gate 37.0** contra o catalogo real, nao presumido.

## Decisao tecnica principal — duas decisoes, nesta ordem

### Decisao 1: o que o prefixo significa

Tres desfechos legitimos. Nao ha default obvio, e por isso e decisao, nao tarefa.

| Opcao | Regra | Custo | Consequencia |
|---|---|---|---|
| **(a) Prefixo = modulo** | Um prefixo por bounded context, sem excecao | Alto — `credores` ganha prefixo proprio (**35** renames), `contratos` funde `ASN` em `CTR` (3), `identity` funde `MFA` em `AUTH` (5) | Regra sem excecao, verificavel por script. Destroi a distincao `MFA`/`AUTH`, que hoje **e** util ao consumidor |
| **(b) Prefixo = area funcional** | Pode haver mais de um por modulo; nao pode haver o mesmo em dois modulos | Medio — so `credores` sai do `CRD` (35) e `credito` sai do `ONB` (1) | Preserva `MFA`, `ASN`, `WHK`. A regra e mais fraca: "area funcional" precisa de definicao para nao virar arbitrio |
| **(c) Renumerar so as colisoes** | Deixa a faixa compartilhada | Baixo — 9 renames | **Nao resolve**: `credito` e `credores` continuam na mesma faixa e a proxima colisao e questao de tempo. Trata sintoma |

**Recomendacao: (b).** Motivo: `MFA-400-002` diz mais ao consumidor do que `AUTH-400-007` diria — a
distincao carrega informacao de dominio, e o cap. 2 do livro e explicito sobre codinome opaco custar
descoberta. A (a) compra pureza de regra pagando com informacao. A (c) e o efeito do poste de luz:
barata porque e onde a luz esta, e deixa a causa viva.

Sob (b), o prefixo novo do `credores` e a sub-decisao restante. `CRE` e o candidato obvio; conferir
que nao colide com nada e que nao se confunde com `CRD` na leitura de log — dois prefixos de tres
letras diferindo em uma consoante e exatamente o tipo de nome que gera erro de leitura humana.
`CDR` ou `INV` (investidor) sao alternativas a considerar no Gate.

### Decisao 2: qual convencao de sufixo

| Opcao | Custo | A favor | Contra |
|---|---|---|---|
| **(a) Semantico vence** (`PIX-422-CONTRATO-NAO-ASSINADO`) | Alto — ~74 codigos numericos a converter | Auto-documentavel: quem le o log sabe o que houve sem consultar catalogo. Alinhado ao cap. 2 (nomes na ontologia de quem consome) | Sufixo vira texto, e texto tenta a ser reescrito. Precisa de regra de imutabilidade explicita |
| **(b) Numerico vence** (`PIX-422-007`) | Medio — 28 codigos `PIX` a converter | Curto, estavel, imune a tentacao de reescrever | Todo codigo vira opaco. Descarta informacao que hoje existe |
| **(c) Cada modulo escolhe** | Zero | — | **Nao vale**: e a "excecao tolerada" que a 036 §Decisao tecnica rejeitou. Publicar taxonomia cuja regra tem excecao e o defeito, nao a solucao |

**Recomendacao: (a), semantico**, apesar de mais caro. O codigo de erro e identificador **para
desenvolvedor** — o consumidor dele e quem depura, quem escreve o `switch` no front e quem atende
suporte. Para esse publico, `PIX-422-PARCELA-SEM-SALDO` num log resolve sozinho o que
`PIX-422-009` exige catalogo para resolver. O custo e alto uma vez; a opacidade e custo recorrente.

**Se o custo inviabilizar**, o desfecho aceitavel e (b) — nunca (c).

Sob (a), a regra de imutabilidade precisa estar no ADR e no doc operacional, em uma frase: **o
sufixo semantico e identificador, nao mensagem; nao se reescreve para "ficar melhor".**

### Por que esta sprint exige ADR

A 036 nao precisou: ela expoe estrutura que ja existia. Esta **decide convencao** que:

- vincula toda sprint futura que criar codigo de erro;
- atravessa os tres repos (o `sep-app` e o `sep-mobile` ramificam sobre esses identificadores);
- e cara de reverter depois da segunda rodada de publicacao.

Os tres criterios que o [`AGENT.md`](../../AGENT.md) usa para exigir ADR. Sem ele, a proxima sprint
que criar um codigo escolhe de novo, e voltamos ao §Ancora 1.

## Ordem em relacao a Sprint 36 — depois, e de proposito

A pergunta natural e por que nao normalizar **antes** de publicar, ja que a spec 036 argumenta que a
janela barata fecha na 036.

Ela fecha **para o que a 036 publica**. O perimetro existe justamente para que o resto continue
livre: codigo nao publicado renomeia de graca em qualquer momento. Entao a ordem `36 -> 37` nao custa
nada em termos de rename.

E ganha duas coisas:

1. **Valor chega antes.** A 036 desbloqueia a [`126`](./126-fsprint-26-consumo-codigos-erro-web.md) e
   a [`218`](./218-msprint-18-consumo-codigos-erro-mobile.md) sem esperar uma decisao de convencao
   que precisa de ADR.
2. **Esta sprint executa contra mecanismo provado.** A 036 tera exercitado a publicacao, o catalogo e
   o gate; aqui o unico risco novo e a decisao de convencao.

O que a inversao **ganharia** — uma publicacao so, sem lista de excluidos — nao compensa segurar a P1
inteira atras de um ADR.

## Escopo

### Dentro

1. **ADR** com as duas decisoes (§Decisao tecnica principal) e a regra de imutabilidade do sufixo.
2. **Registro de prefixos** — fonte unica (enum ou constante) declarando cada prefixo, seu dono e seu
   significado. Hoje nao existe (§Ancora 1); sem ele a regra do ADR nao tem onde morar.
3. **Deduplicacao do tipo B** — `ONB-400-007` e `ONB-400-008` viram constante unica compartilhada.
   Sem renumerar.
4. **Renumeracao do tipo C** — 3 colisoes reais intra-modulo.
5. **Re-prefixacao do tipo A** — o modulo que a Decisao 1 mandar sair da faixa `CRD`, mais o
   `ONB-404-001` vazado em `credito`.
6. **Conversao de convencao de sufixo** conforme a Decisao 2.
7. **Gate de formato no CI** — script que reprova codigo novo fora da convencao e prefixo fora do
   registro. Sem isso a normalizacao envelhece igual a contagem de `npm audit` envelheceu entre a
   F-19 e a D-1.
8. Atualizacao dos 6 arquivos de teste que citam codigo literal (§Ancora 5).
9. Doc operacional atualizado.

### Fora

- ~~**Publicar os codigos normalizados.**~~ **Revertido em 2026-09-10**: entra na sprint (Task 37.7).
  O `ParticaoDeCodigosErroTest` exige `aptos == catalogo`, entao nao ha como normalizar sem publicar,
  e a janela de rename gratuito existia para esperar o ADR, que agora decide a convencao.
- **Criar codigos novos** para os 10 handlers sem codigo. Continua sendo escopo da sprint de
  personas (P2 do [`DIAGNOSTICO-PRODUTO.md`](../../docs-sep/DIAGNOSTICO-PRODUTO.md)).
- **As 5 categorias do cap. 3** (System / User's Invalid Argument / Preconditions Not Met /
  Developer's Invalid Argument / Assertion). Continua P4. Nota: se a Decisao 2 sair semantica, a
  categoria vira candidata natural a entrar no codigo depois — **nao antecipar aqui**, e trapdoor.
- **Reescrever mensagens** na ontologia do usuario. P4.
- Migration. Nenhum item toca schema.

## Criterios de aceite

1. ADR escrito, com as duas decisoes, o custo medido de cada uma e a regra de imutabilidade.
2. Registro de prefixos existe como fonte unica, e **todo** prefixo em uso esta nele.
3. `grep` de colisao (036 §Ancora 7) devolve **vazio** — nenhum codigo definido duas vezes com
   significados diferentes. Os dois casos do tipo B saem por deduplicacao, e o teste tem de provar
   que sao **uma** constante, nao duas iguais.
4. `grep` de formato devolve **vazio** contra a convencao escolhida — aplicado ao repo inteiro, nao a
   um subconjunto. Este e o criterio que a 036 nao pode ter e esta pode.
5. Gate de CI reprova: codigo novo fora da convencao, e prefixo fora do registro. **Provado que o
   gate morde** — introduzir violacao tem de sair 1, remover tem de sair 0. Mesmo protocolo que a
   D-1 usou no `npm audit`.
6. Contagem de testes **>= baseline do Gate 37.0, 0 falhas**; `clean build` e `spotlessCheck` verdes.
7. **Mutacao obrigatoria** sobre o gate de formato e sobre a deduplicacao do tipo B.
8. Nenhum codigo **publicado pela 036** foi renomeado. Conferido contra o catalogo versionado. Se
   algum precisar, a Task **para e reporta** — vira mudanca de contrato e muda de sprint.

## Riscos e limitacoes

- **O Gate 37.0 vai derrubar numero desta spec.** Aconteceu nas quatro sprints anteriores, e nesta a
  probabilidade e maior: os numeros aqui vieram de `grep` por formato, e a 036 ja provou que
  medicao por padrao textual tem ponto cego. Os 103 sao piso.
- **A Decisao 1 e a Decisao 2 sao acopladas ao custo, nao a semantica.** Se a Decisao 2 sair
  semantica, os 35 renames do `credores` acontecem junto com a conversao de sufixo deles — o mesmo
  arquivo e tocado uma vez, nao duas. Sequenciar mal dobra o trabalho.
- **Rename em massa e onde diff grande esconde erro.** 35 codigos em um commit e revisavel; 74 em um
  commit nao e. Fatiar por modulo, um commit por prefixo.
- **Esta sprint nao entrega valor observavel ao usuario final.** Nenhuma tela muda, nenhuma mensagem
  muda, nenhum comportamento muda. O valor e destravar a segunda rodada de publicacao — e isso deve
  estar dito no PR, senao o review cobra impacto que a sprint nao tem.
- **Se a lista da Task 36.7 nao existir**, esta spec e estimativa e o Gate 37.0 tem de reconstrui-la
  do zero — o que e o trabalho da 36.7 pago duas vezes. Nao comecar sem ela.

## Rastreabilidade

| Item da spec | Task |
|---|---|
| ADR das duas decisoes + regra de imutabilidade | 37.1 |
| Registro de prefixos como fonte unica | 37.2 |
| Deduplicacao do tipo B (`ONB-400-007`, `ONB-400-008`) | 37.3 |
| Renumeracao do tipo C (3 colisoes reais) | 37.4 |
| Re-prefixacao do tipo A + `ONB-404-001` vazado | 37.5 |
| Conversao de convencao de sufixo (Decisao 2) | 37.6 |
| Gate de formato e prefixo no CI, provado que morde | 37.7 |
| Testes literais + doc operacional | 37.8 |
| Baseline, lista da 36.7, reconferencia do catalogo publicado | Gate 37.0 e Fechamento |

Fecha o escopo que a [`036`](./036-sprint-36-codigos-erro-no-fio.md) deixou fora do perimetro, e
prepara a segunda rodada de publicacao da recomendacao **P1** do
[`DIAGNOSTICO-PRODUTO.md`](../../docs-sep/DIAGNOSTICO-PRODUTO.md).

Steps em [`steps-fase-4/backend/037-sprint-37-steps.md`](../../steps-fase-4/backend/037-sprint-37-steps.md),
criados em 2026-09-10 depois das decisoes do [ADR 0020](../../adr/0020-convencao-codigos-de-erro.md).

## Resultado (medido em 2026-09-10)

Branch `feature/sprint-37-normalizacao-codigos-erro` (de `develop` `a774aa4`), **10 commits**,
mergeada em `develop` (#110, `c8b98ae`) e `main` (#111, `5fe83a1`). Descricao em [`SPRINT-37-PR.md`](../../repos/sep-api/SPRINT-37-PR.md); doc operacional
[`CODIGOS-DE-ERRO.md`](../../repos/sep-api/CODIGOS-DE-ERRO.md) reescrito.

| Criterio | Resultado |
|---|---|
| 1. ADR com as duas decisoes, custo e imutabilidade | **Atendido** — ADR 0020: prefixo = area funcional com o `credito` em `PRP`; sufixo numerico; §3 unicidade e imutabilidade; §4 todo codigo apto e publicado |
| 2. Registro de prefixos como fonte unica, com todo prefixo em uso | **Atendido** — `PrefixoCodigoErro`, 13 prefixos, conferidos contra o uso real antes de escrever |
| 3. Nenhum codigo com dois significados; tipo B por deduplicacao | **Atendido** — particao final sem colisao; `ONB-400-008` e `ONB-404-001` com um dono cada (37.2), provado por mutacao |
| 4. Formato vazio no repo inteiro | **Atendido** — nenhum literal fora de `MOD-STATUS-NNN` em `src/main` |
| 5. Gate reprova formato e prefixo, provado que morde | **Atendido no build, e nao como script de CI**: `ConvencaoCodigosErroTest` roda em todo `./gradlew build`; 8 mutacoes na 37.6 e 3 no hotfix, cada uma morta por teste nomeado |
| 6. Testes >= baseline, 0 falhas | **2297 -> 2318**, 0 falhas; `clean build` e `spotlessCheck` verdes |
| 7. Mutacao sobre o gate e a deduplicacao | **Atendido** — toda Task com mutacao nomeada e morta |
| 8. Nenhum codigo publicado pela 036 renomeado | **Atendido** — os 80 continuam publicados, cada um com o mesmo dono de `a774aa4` (medido codigo a codigo); congelados junto com os 63 novos em `CodigosPublicadosNaoMudamTest` |

**Particao**: `133 = 80 + 53` no Gate 37.0 -> **`144 = 143 publicados + 1 excluido`**. O excluido e
`AUTH-403-001`, `inalcancavel`: o `PasswordResetEnforcementFilter` escreve o 403 direto na response.

### Decisoes tomadas durante a execucao

Do responsavel pelo repo:

- `ONB-404-001`: o `credito` reusa `OnboardingNaoEncontradoException` (37.2).
- Criterio de identidade: **mesma acao do cliente = mesma condicao** (37.3).
- Validacao de recepcao de webhook consolidada em `WHK` (37.3b).
- Familia Idempotency-Key unificada **dentro** do `pix`; entre modulos fica follow-up (37.5).

Impostas pela medicao, registradas no ADR e nos steps:

- `OF-400-001` nao foi para `PRP`: identificava as quatro checagens de webhook que a 37.3b ja
  consolidara em `WHK`, e foi aposentado (37.4).
- `StatusPropostaInvalidoException` declarava `CRD-400-002` e nunca o usava — a transicao saia com o
  codigo do pai. Passa a emitir `PRP-400-002`, e o parecer em proposta final sai por ela (37.4).
- O gate ganhou numero aposentado e "ponto de lancamento legivel pela particao" (37.6), vindos dos
  reviews da 37.3b e da 37.4.

### O que os code reviews pegaram

- **37.3b**: quatro checagens de body vazio e o `ASN-400-001` sem teste de comportamento — hotfix.
- **37.4**: a particao nao ve constante herdada; subtipo com o codigo do pai passava — virou regra do gate.
- **37.6**: constante de codigo sem `COD` no nome passava no gate e saia inalcancavel na particao — um
  codigo novo nunca seria publicado, sem nada reprovar. Provado por mutacao; hotfix.
- **37.7**: a lista congelada protegia 80 dos 143; rename consistente de um codigo novo passou em 257
  testes. Hotfix congelando os 143.
- `RegistrarParecerUseCaseTest` era um arquivo vazio desde a Sprint 8.

### Follow-ups

- Unificar Idempotency-Key entre `pix`, `credores` e `cobranca` (dois lados publicados) e centralizar
  o limite de 100 caracteres — sprint de contrato.
- Levar `AUTH-403-001` ao campo `codigo`: o filtro teria de montar o corpo pelo caminho do handler.
- Opcional: ligar `PrefixoCodigoErro` ao `CatalogoCodigosErro.validar`, para falhar tambem no boot.
- A regra de `super(` do gate depende do sufixo `Exception.java` no nome do arquivo.
- Construtor de dois argumentos sem chamador em `StatusPropostaInvalidoException`; testes de
  controller do `pix` montando excecao com literal em vez da classe nomeada.
