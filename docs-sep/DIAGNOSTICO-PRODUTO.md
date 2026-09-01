# SEP sob a lente de *The Product-Minded Engineer* (Drew Hoskins)

## Contexto

O dev do SEP pediu uma leitura do livro *The Product-Minded Engineer* (Hoskins, O'Reilly) aplicada
ao projeto: **como dono de produto, o que melhorar?**

_Escrito em: 2026-09-01._

O SEP hoje é forte em engenharia (DDD + hexagonal, mutation testing, `contract:check`, gates de CI,
2220 testes no backend, 833 no web) e fraco exatamente onde o livro foca: **o produto tem
engenharia excelente a serviço de um usuário que nunca foi descrito**.

Este documento registra o diagnóstico medido no código e as recomendações priorizadas. Não é plano
de execução: nenhum recorte foi aberto como sprint.

---

## Diagnóstico — medido, não inferido

### 1. 67 códigos de erro existem e nenhum chega ao cliente ⭐ maior alavancagem

Medição:

- `grep -rh 'CODIGO = "'` no `sep-api` → **67 códigos**, 9 prefixos de módulo
  (`CRD` 28, `CTR` 8, `COB` 8, `ONB` 5, `MFA` 5, `BOF` 5, `USR` 3, `AUTH` 3, `GOV` 2).
  Ex.: `BOF-404-001`, `COB-409-002`, `CRD-...`.
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

### P1 — Publicar os 67 códigos de erro no fio

**Por quê primeiro**: é a única recomendação que fecha *seis* itens já abertos no `STATE.md` com uma
mudança só, e o trabalho de taxonomia **já está feito** — os códigos existem, só não saem.

Recorte:
1. `codigo` em `ErrorResponseDto` (opcional, `@JsonInclude(NON_NULL)` já cobre o legado).
2. `ApiExceptionHandler.build()` passa a receber e propagar `DomainException.getCodigo()`. É **um**
   ponto de montagem (`:246-249`) — a mudança é local.
3. Catálogo dos 67 códigos publicado no OpenAPI e versionado, virando gate do `contract:check`.
4. Front troca ramificação por status por ramificação por código, começando pelos 3 literais
   duplicados entre `login` e `verify-totp`.

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
