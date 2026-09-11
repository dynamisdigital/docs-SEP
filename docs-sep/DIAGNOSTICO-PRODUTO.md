# SEP sob a lente de *The Product-Minded Engineer* (Drew Hoskins)

## Contexto

O dev do SEP pediu uma leitura do livro *The Product-Minded Engineer* (Hoskins, O'Reilly) aplicada
ao projeto: **como dono de produto, o que melhorar?**

_Escrito em: 2026-09-01._

O SEP hoje é forte em engenharia (DDD + hexagonal, mutation testing, `contract:check`, gates de CI,
2220 testes no backend, 833 no web) e fraco exatamente onde o livro foca: **o produto tem
engenharia excelente a serviço de um usuário que nunca foi descrito**.

Este documento registra o diagnóstico medido no código e as recomendações priorizadas.

_Atualizado em 2026-09-01: a **P1 foi aberta** como três sprints (uma por repo). As demais seguem sem
recorte aberto. Ver §Encaminhamento._

---

## Diagnóstico — medido, não inferido

### 1. ~103 códigos de erro existem e nenhum chega ao cliente ⭐ maior alavancagem

> **Correção de 2026-09-01**, na revisão das specs 036/126/218: este documento afirmava
> **67 códigos em 9 prefixos**. O número estava errado — o `grep` filtrava por constantes
> **chamadas** `CODIGO`, e o domínio tem ~30 constantes com outros nomes
> (`CODIGO_HEADER_OBRIGATORIO`, `CODIGO_VALIDACAO`, `CODIGO_CPF_INVALIDO`...) carregando códigos do
> mesmo formato. Medindo por formato: **~103 códigos em 12 prefixos** (entram `PIX`, `ASN`, `WHK`).
> A conclusão da seção não muda — nenhum deles chega ao cliente. O que muda é o tamanho.
> Lição registrada: **medir o fenômeno, não o nome que ele costuma ter.**
>
> A mesma revisão achou o que este documento não viu: **12 códigos definidos duas vezes com
> significados diferentes** (`CRD-403-001` é `OwnershipProposta` E `OwnershipCredora`; 8 das 12
> colisões vêm de `credores` reusando a faixa `CRD-*` de `credito`) e **12 violações de formato**
> (não 1). Detalhe em [`036`](../specs/fase-4/036-sprint-36-codigos-erro-no-fio.md) §Âncoras 6 e 7.

Medição (corrigida):

```bash
grep -rhoE '"[A-Z]{3,4}-[0-9]{3}-[A-Z0-9-]*[0-9]{3}"' sep-api/src/main/java --include=*.java | sort -u | wc -l
```

- **~103 códigos**, 12 prefixos (`CRD` 35, `ONB` 21, `CTR` 10, `COB` 8, `USR` 6, `MFA` 5, `BOF` 5,
  `PIX` 3, `AUTH` 3, `ASN` 3, `WHK` 2, `GOV` 2). Ex.: `BOF-404-001`, `COB-409-002`.
- O número é piso, não teto: a própria regex acima não captura `PIX-400-IDEMPOTENCY-KEY`.
- `ErrorResponseDto` (`shared/exception/ErrorResponseDto.java`) tem
  `timestamp, status, error, message, path, traceId` — **nenhum campo de código**.
- `ApiExceptionHandler.build()` (`:246-249`) é o **único** ponto que monta corpo de erro, e chama
  `ErrorResponseDto.of(status, error, ex.getMessage(), uri, traceId)`. O `getCodigo()` nunca é lido.

Ou seja: a taxonomia é construída no domínio e **descartada na fronteira HTTP**.

Cap. 3 do livro: *"For developers, include enough context and structure with your error so that other
developers can do their jobs. Organize your errors into hierarchies to provide developers with both
generic and specific ways to serve their users."*

**Isso é a causa raiz de uma lista de defeitos que o `STATE.md` já registra como itens separados:**

| Sintoma já documentado | Origem real |
|---|---|
| 78 pontos de ramificação por status no front (65 `if`, 10 `case`, 3 entradas de tabela) | sem código, só resta o status HTTP |
| 3 literais byte-idênticos entre `login` e `verify-totp` | mesma mensagem, sem chave para compartilhar |
| `verify-totp` acusava "código inválido" em bloqueio, rate limit, 5xx e queda de rede (F-22) | status colidido, sem código para desambiguar |
| `message: ""` apaga o alerta e a tela fica muda | o contrato permite string livre vazia |
| `CONTA_BLOQUEADA_FALLBACK` embute "30 minutos" fixo | copy no cliente porque não há código + dados |
| `contract:check` teve de validar `erros` contra o OpenAPI (F-22) | tentativa de recuperar estrutura perdida |

O custo aparece cru em [`api-error.ts`](../../sep-app/src/app/core/api/api-error.ts): **30 linhas de
comentário forense** sobre quando a `message` pode vir vazia, incluindo análise de bytecode do
`spring-boot-3.5.5.jar`. Esse comentário é excelente — e é o preço de não ter estrutura no fio.

### 2. Personas não existem — só papéis RBAC

- `grep -rn "persona" docs-sep/PRD-FASE-*.md` → **3 ocorrências**, e **2 delas são o Gate M-16.0
  registrando que a falta de persona bloqueou escopo** (`PRD-FASE-4.md:272,276`: *"não é déficit de
  implementação, e sim de persona"*).
- O que existe é `UsuarioRole = ADMIN | CLIENTE` (mobile) e `ADMIN | CLIENTE | BACKOFFICE |
  FINANCEIRO` (web) — autorização, não persona.
- Nenhum documento descreve **quem** é o tomador, **quem** é a credora, o que cada um valoriza, que
  alternativa usa hoje, o que o faria trocar.

Cap. 6: personas com background e motivação tornam priorização e decisão de escopo triviais. O Gate
M-16.0 é a prova negativa — cortou escopo por descobrir tarde que a credora do mobile autentica como
`CLIENTE` e cinco dos seis contratos exigem `FINANCEIRO`. Uma lista de personas teria pego isso no
planejamento, não no gate.

### 3. Zero métricas de produto

- `METRICAS-IMPLEMENTACAO.md` → DORA + SPACE + EBM. Métricas de **entrega**.
- `OBSERVABILIDADE.md` → Actuator + Micrometer + Prometheus, `correlationId`. Métricas de **sistema**.
  A própria tabela declara `Traces: Não implementado`.
- `grep -rl "analytics|gtag|posthog|mixpanel|amplitude|trackEvent"` em `sep-app/src` + `sep-mobile/src`
  → **nenhum hit real** (os 5 resultados são o `client-channel.interceptor` e a página de política de
  privacidade).

Não existe **nenhuma** métrica de adoção ou de valor. Cap. 5: nenhuma decisão de produto é defensável
sem elas. Hoje não há resposta para "quantos tomadores concluem o onboarding?" ou "quantas credoras
que veem uma oportunidade aportam?".

**Restrição real**: a política de privacidade publicada na F-25 **afirma a ausência de rastreamento de
terceiros**. Analytics de terceiro contradiz um texto legal já publicado. Telemetria própria
(evento no `sep-api`, sem terceiro) é compatível — mas é decisão, não detalhe.

### 4. Documentação é relatório de entrega, não guia de uso

`documentacao-cliente.html` (53 KB) tem seções: *O que é a SEP, Quem Vai Usar, Cronograma de Entrega,
Resumo das Sprints, Onde Estamos Agora, Próximos Marcos*.

Isso é **prestação de contas ao contratante**, não documentação de produto. Cap. 4 pede três tipos que
não existem: getting-started guide, usage guide, conceptual guide — todos escritos **na ontologia do
usuário**. Escrever o guia é também o teste: se a jornada não cabe num guia legível, ela está errada.

### 5. Testes de cenário organizados por módulo, não por jornada

Os 12 specs Playwright do web (`onboarding`, `pix`, `cobranca`, `backoffice`, `governanca`,
`credora-matching`, `pix-chaves`...) espelham a **arquitetura**, não a **jornada**. Só
`golden-path.spec.ts` é cenário de ponta a ponta.

Cap. 4: cenário de teste é o documento executável do produto. Um spec por módulo prova que o módulo
funciona; não prova que **o tomador consegue pegar dinheiro emprestado**.

### 6. Mensagens de erro falam a ontologia do sistema

Amostra medida nas exceptions e use cases:

- `"Contrato nao esta ASSINADO; desembolso indisponivel."` — vaza o enum interno em caixa alta e não
  diz o que fazer.
- `"Acesso negado: cliente so pode consultar o proprio usuario"` — vocabulário de RBAC; o usuário não
  se chama "cliente" nem sabe o que é "consultar o próprio usuário".
- `"Conta bloqueada temporariamente. Tente novamente em "` — o `STATE.md` já registra que essa `message`
  **superestima a espera por design**, enquanto o `Retry-After` traz o valor real.
- `"Contrato nao encontrado para desembolso: "` + id — dá contexto, não dá ação.

Cap. 3 pede: dar contexto, usar a ontologia do usuário, sugerir ação, e categorizar em System /
User's Invalid Argument / Preconditions Not Met / Developer's Invalid Argument / Assertion.

---

## O que NÃO está quebrado

Registrar isso importa tanto quanto o resto — o livro alerta contra o *streetlight effect*
(otimizar onde a luz está, não onde o problema está):

- **Design for change** (cap. 5) já é prática: feature por sprint, gates automatizados, MSW, mutação.
- **Idempotency keys** (cap. 9, seção Data Consistency) já existem em aporte, chave Pix e cobrança —
  e o `AporteIntencaoStore` / `ChavePixIntencaoStore` resolvem exatamente o caso que o livro descreve
  (retry pós-5xx reusando a mesma key).
- **Rule of three** já foi aplicada sem o nome: o Gate M-16.0 cortou escopo por falta de cenário.
- **Perimeter / trapdoor** (cap. 8): `TRATA_403_LOCALMENTE` e step-up estrito são perímetros corretos.

---

## Recomendações priorizadas

Ordenadas por (valor ao usuário ÷ custo), não por gravidade. Nenhuma exige API externa — todas são
executáveis hoje, ao lado da Sprint 35 já planejada.

### P1 — Publicar os códigos de erro no fio

**Por quê primeiro**: é a única recomendação que fecha *seis* itens já abertos no `STATE.md` com uma
mudança só.

> **Correção de 2026-09-01**: esta seção dizia que "o trabalho de taxonomia **já está feito** — os
> códigos existem, só não saem". A revisão das specs derrubou essa premissa: existem, mas com 12
> colisões de significado e 12 violações de formato. Publicar como está tornaria os dois defeitos
> contrato permanente. A Spec 036 passou a publicar **só o subconjunto apto** (sem colisão, formato
> canônico, alcançável em runtime), com o resto explicitamente fora e listado com motivo — um
> perímetro, no sentido do cap. 8 do livro: afrouxar depois é barato, renomear código publicado não é.

Recorte:
1. `codigo` em `ErrorResponseDto` (opcional, `@JsonInclude(NON_NULL)` já cobre o legado).
2. `ApiExceptionHandler.build()` passa a receber e propagar `DomainException.getCodigo()`. É **um**
   ponto de montagem (`:246-249`) — a mudança é local. **Ressalva**: três exceções com código não
   herdam de `DomainException` (`AUTH-423-001`, `BOF-429-001`, `BOF-400-002`) e precisam de caminho
   próprio; duas delas nem getter têm.
3. Catálogo do **subconjunto apto** publicado no OpenAPI e versionado, virando gate do
   `contract:check` — mais a lista do que ficou de fora, que dimensiona a sprint de normalização.
4. Front troca ramificação por status por ramificação por código, começando pelos 3 literais
   duplicados entre `login` e `verify-totp`. **Ressalva**: medido em 2026-09-01, esses 3 literais
   **já foram fechados pela F-24** (`features/public/login/copy-de-erro.ts`); o que sobrou é o ramo,
   não a frase — que é o caso que a `126` ataca.

**Não** fazer de uma vez os 78 pontos de ramificação. O `STATE.md` já avisa que varrer o resto exige
antes decidir a regra para handlers compartilhados entre operações — decisão própria.

Ganho colateral: o `traceId` deixa de ser o único identificador de suporte. Com código + traceId, o
usuário reporta e o time reproduz.

### P2 — Escrever a lista de personas

Documento em `docs-SEP/docs-sep/`, uma página por persona: quem é, o que valoriza, o que usa hoje,
o que a faria trocar, e qual é o papel RBAC correspondente.

Mínimo: **tomador**, **credora pessoa física** (`CLIENTE`), **credora institucional**
(`FINANCEIRO`), **operador de backoffice**, **admin**.

O Gate M-16.0 é a justificativa pronta: o escopo do mobile foi cortado porque a diferença entre
"credora" e "credora com papel `FINANCEIRO`" só apareceu no gate. Persona documentada é o artefato
que pega isso no planejamento.

Custo: baixo, só escrita. Retorno: destrava priorização das fases seguintes e dá vocabulário para P4
e P5.

### P3 — Um cenário de ponta a ponta por persona

Hoje há `golden-path.spec.ts` e 11 specs por módulo. Adicionar cenário por **jornada**, não por
módulo: a credora institucional que vê oportunidade → decide → aporta → acompanha; o tomador que se
cadastra → propõe → assina → recebe → paga.

Reusa o Playwright e o MSW que já existem. O valor não é cobertura — é que um cenário que não fecha
denuncia jornada quebrada, e cobertura por módulo nunca denuncia.

### P4 — Reescrever as mensagens de erro na ontologia do usuário

Depende de P1 (código separa identidade de texto) e P2 (persona define vocabulário).

Regra do cap. 3, aplicável direto: toda mensagem dá **contexto** (o que se tentou fazer), fala a
**ontologia do usuário** (nunca `ASSINADO`, nunca "cliente" como papel) e sugere **ação**.

Começar pelas que já se sabe erradas: a `message` do `423` que superestima a espera, e
`"Contrato nao esta ASSINADO; desembolso indisponivel."`

### P5 — Guia de uso por jornada

Três documentos por persona prioritária: getting started, guia de uso, guia conceitual. Substituem
nada — `documentacao-cliente.html` continua sendo prestação de contas ao contratante, que é outro
público.

O livro trata escrever o guia como **teste de produto**, não como entrega de documentação: se a
jornada não cabe num guia legível, a jornada está errada. Esse é o retorno real.

### P6 — Telemetria de produto própria no `sep-api`

Direção decidida: **eventos de produto no próprio backend, sem terceiro**. Não contradiz a política
de privacidade publicada na F-25.

Um par de métricas por jornada, no formato do cap. 5:
- **adoção** — quantos chegam (ex.: onboardings iniciados que concluem KYC)
- **valor** — quanto valor real entregue (ex.: volume desembolsado, não propostas criadas)

Armadilha que o livro nomeia e que o SEP já está exposto: métrica de adoção como meta produz número
sem valor. "Propostas criadas" sobe sem ninguém pegar dinheiro emprestado.

**Bloqueio a tratar antes de coletar**: evento de comportamento é dado pessoal sob LGPD. A política
publicada já entrou marcada como pendente de revisão jurídica; essa revisão passa a ter um item a
mais. Não coletar antes disso.

---

## Encaminhamento (2026-09-01)

### P1 — aberta como três sprints, uma por repo

| Spec | Sprint | Repo | Papel na cadeia |
|---|---|---|---|
| [`036`](../specs/fase-4/036-sprint-36-codigos-erro-no-fio.md) | Sprint 36 | `sep-api` | Publica: `codigo` no `ErrorResponseDto`, propagação no `build()`, catálogo do subconjunto apto no OpenAPI + lista do excluído |
| [`126`](../specs/fase-4/126-fsprint-26-consumo-codigos-erro-web.md) | F-Sprint 26 | `sep-app` | Consome: helper, gate no `contract:check`, `400` colapsado do `verify-totp` |
| [`218`](../specs/fase-4/218-msprint-18-consumo-codigos-erro-mobile.md) | M-Sprint 18 | `sep-mobile` | Consome: cria o `api-error.ts` inexistente, unifica 9 casts, ramifica por código |

| [`037`](../specs/fase-4/037-sprint-37-normalizacao-taxonomia-erro.md) | Sprint 37 | `sep-api` | Normaliza o que ficou fora do perímetro: decide o significado do prefixo e a convenção de sufixo (**ADR 0020**), resolve colisões, re-prefixa o `credito` (`CRD` → `PRP`) — **MERGEADA** em 2026-09-10 (#110/#111), catálogo de 80 para 143 |

Ordem: `35 → 36 → {F-26, M-18}`, com a `37` em paralelo às duas de consumo ou logo após. As duas de
consumo são independentes entre si.

A `37` vem **depois** da `36` de propósito: o perímetro garante que código não publicado continua
renomeável de graça, então adiar a normalização não custa nada — e assim a P1 entrega valor ao web e
ao mobile sem esperar um ADR de convenção.

**Cinco correções que a verificação de código impôs ao diagnóstico**, todas incorporadas nas specs:

1. **`build()` cobre 16 handlers, não só o caminho de domínio** — inclusive o `handleLocked` do `423`,
   que chama `build` e só depois acrescenta o `Retry-After`. A mudança é ainda mais local do que este
   documento estimava.
2. **Três exceções com código não são `DomainException`** — `ContaBloqueadaException`
   (`AUTH-423-001`), `LimiteReprocessoExcedidoException` (`BOF-429-001`) e
   `TipoReprocessoNaoSuportadoException` (`BOF-400-002`) estendem `RuntimeException` direto, e as
   duas últimas **nem getter têm**. Nenhuma entra no `switch` selado.
   *(Corrigido em 2026-09-01 — a primeira redação dizia que o `423` era o único.)*
3. **Doze códigos quebram o padrão**, não um: `CTR-422-CCB-001` mais onze `PIX-*` com sufixo
   semântico em vez de sequencial (`PIX-404-RECEBIMENTO`, `PIX-409-IDEMPOTENCIA`...). E **doze
   códigos estão definidos duas vezes com significados diferentes** — `credores` reusou a faixa
   `CRD-*` de `credito` em 8 dos 12 casos.
   Como nada consome, corrigir é grátis **agora**; depois de publicado vira mudança de contrato. Isso
   deixou de definir só a ordem interna da Sprint 36 e passou a definir o **escopo** dela: publicar
   o subconjunto apto, com perímetro sobre o resto.
   *(Corrigido em 2026-09-01 — a primeira redação media só uma violação e nenhuma colisão.)*
4. **Os 3 literais duplicados entre `login` e `verify-totp` já foram fechados pela F-24** — viraram
   `copy-de-erro.ts`. O que sobrou é o **ramo**, não a frase, e o próprio docblock desse arquivo
   nomeia o alvo certo: o `400` do `verify-totp`, que colapsa três causas (`MFA-400-002`, `-003`,
   `-004`) discrimináveis só pelo texto.
5. **O mobile tem 9 casts inline, não 6** — em 8 arquivos, com duas assinaturas de tipo distintas
   convivendo.

**Conflito registrado**: a Task 35.5 da Sprint 35 planeja remover `ContaBloqueadaException.CODIGO`
como código morto, e a Task 36.4 lhe dá consumidor. A 35.5 deve manter apenas a metade do
`countByIpAndJanela`.

**Custo de numeração**: a cadeia provoca o 4º **e o 5º** recuo do backend da Fase 5
(36-39 → 37-40 pela Sprint 36 → **38-41** pela Sprint 37) e o 1º do mobile
(M-18/M-19 → M-19/M-20), pelo mecanismo que o [`PRD-FASE-5.md`](./PRD-FASE-5.md) §46 já documenta.

### P2 a P6 — sem recorte aberto

- **P2 (personas)** e **P5 (guias de uso)**: entregável **pré-requisito** em `docs-sep/`, fora do
  ciclo de sprint — não produzem código, e `docs-SEP` não tem branch, CI nem gate. P2 é pré-requisito
  de P3 (define quais jornadas escrever) e de P4 (define o vocabulário).
- **P3 (cenário por persona)**: bloqueada por P2.
- **P4 (mensagens na ontologia do usuário)**: depende de P1 **e** P2. Inclui as 5 categorias do cap. 3,
  que mudam a semântica dos códigos — a P1 só publica os que existem.
- **P6 (telemetria própria)**: bloqueada pela revisão jurídica da política de privacidade publicada na
  F-25, que já entrou marcada como pendente. Evento de comportamento é dado pessoal sob LGPD.

---

## Práticas do livro que valem adotar como hábito

Independentes de qualquer sprint:

| Prática | Onde encaixa no SEP hoje |
|---|---|
| **Friction log** | Você é o único usuário do produto. Rodar a jornada do tomador ponta a ponta e anotar cada atrito, sem consertar nada durante. O `dev-offline` com MSW já permite. |
| **Rule of three** | Antes de cada feature, escrever 3 cenários que a justifiquem. Se não achar 3, cortar. Teria evitado o escopo do Gate M-16.0. |
| **Four brutal truths** | Valor é *back-loaded*: SEP tem 9 módulos e nenhuma jornada completa validada com usuário real. O risco não é falta de feature, é subestimar quanto falta antes de a primeira ter valor. |
| **Streetlight effect** | O `STATE.md` mostra o padrão saudável (medir antes de blindar) — e mostra o risco: quatro sprints seguidas de dívida técnica. Dívida é onde a luz está. |

---

## Skills candidatas (retomando a conversa anterior)

Cada lacuna vira um arquivo no padrão do `sep-web-mutation-verified-testing` já existente:

- `sep-erros-produto` — as 5 categorias do cap. 3, o formato do código `MOD-STATUS-NNN`, e a regra
  de contexto + ontologia + ação. Vira gate de review.
- `sep-personas` — as personas e seus papéis RBAC, para o agente não confundir "credora" com
  "credora `FINANCEIRO`" de novo.
- `sep-cenarios-jornada` — como escrever cenário de ponta a ponta por persona.

Combinam com as de domínio financeiro já discutidas (`sep-dominio-credito-br`,
`sep-ledger-partidas-dobradas`, `sep-conformidade-4656`, `sep-pld-ft`).

---

## Verificação

Este entregável é diagnóstico, não mudança de código — não há teste a rodar. As afirmações são
reproduzíveis:

```bash
grep -rh 'CODIGO = "' sep-api/src/main/java --include=*.java | wc -l
```

```bash
grep -n "ErrorResponseDto.of\|getCodigo" sep-api/src/main/java/com/dynamis/sep_api/shared/exception/ApiExceptionHandler.java
```

```bash
grep -rn "persona" docs-SEP/docs-sep/PRD-FASE-4.md
```

```bash
grep -rl "analytics\|posthog\|mixpanel\|amplitude\|trackEvent" sep-app/src sep-mobile/src
```

Fonte do livro: `The Product-Minded Engineer`, Drew Hoskins (O'Reilly). Capítulos usados: 3 (erros),
4 (dogfooding, docs, friction logs), 5 (design for change, métricas, digital twin), 6 (personas),
7 (brutal truths, use case compendium), 8 (rule of three, trapdoor), 9 (product architecture, NFRs,
consistência centrada no usuário).
