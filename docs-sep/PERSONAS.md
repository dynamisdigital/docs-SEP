# PERSONAS.md — quem usa o SEP

> 🔒 **Documento interno de design.** Insumo da equipe para desenhar telas, textos e jornadas.
> **Não é pauta de reunião com a direção** — as decisões de negócio que precisam do dono estão em
> [`PERGUNTAS-MODELO-NEGOCIO.md`](./PERGUNTAS-MODELO-NEGOCIO.md), e persona não é uma delas.

> 🟠 **PROVISÓRIO desde 2026-09-03.** A direção indicou três mudanças de rumo ainda não confirmadas:
> a plataforma seria **implementada para terceiros** (com o SEP como conciliante), o produto seria
> **consignado**, e o consignado seria **só para funcionários de empresas participantes**.
>
> Se isso se confirmar, a **Persona 1 (tomador PJ / capital de giro) deixa de existir** e o tomador
> passa a ser o **funcionário CLT** — outra pessoa, outra motivação, outra página. E se houver
> terceiros operando, surge uma persona que este documento nem cogita: **o operador que licencia a
> plataforma**.
>
> As perguntas que decidem isso estão em
> [`PERGUNTAS-MODELO-NEGOCIO.md`](./PERGUNTAS-MODELO-NEGOCIO.md) — P1, P12, P18, P19.
> **Não use este documento para decidir escopo até que elas sejam respondidas.**

> **Status: RASCUNHO.** Atende ao **P2** do
> [`DIAGNOSTICO-PRODUTO.md`](./DIAGNOSTICO-PRODUTO.md) §2 ("personas não existem — só papéis RBAC").
>
> **Como ler este documento.** Cada persona tem dois blocos com autoridade diferente:
>
> - 🟩 **MEDIDO** — derivado do código, com `arquivo:linha`. É fato verificável hoje.
> - 🟨 **HIPÓTESE** — **não** está no código e **não** foi validado com ninguém real. Está aqui para
>   ser corrigido ou apagado, não para ser citado. Um documento de persona que passa hipótese por
>   fato é pior que a ausência dele.
>
> Persona ≠ papel de autorização. `CLIENTE` diz o que o sistema permite; persona diz quem é a pessoa
> e o que ela quer. Confundir os dois já custou escopo neste projeto — ver o Gate M-16.0
> (`PRD-FASE-4.md:272,276`).
>
> _Criado em 2026-09-03. Recorte: as três personas que chegam **sem convite**, porque a demanda de
> origem era a landing page pública. As três internas estão esboçadas no fim e **não** fecham o P2._

---

## O envelope do produto — medido, e vale para todas as personas

Antes das pessoas, os limites que o motor de crédito impõe. Todos em
`sep-api/.../credito/application/service/regras/` com defaults em `application.yml:240-252`.

| Parâmetro | Pessoa física | Empresa |
|---|---|---|
| Valor máximo **no código** | R$ 50.000,00 | R$ 200.000,00 |
| Valor máximo **efetivo (legal)** | **R$ 15.000,00** | **R$ 15.000,00** |
| Prazo máximo | **12 meses** | **24 meses** |
| Idade mínima | 18 anos | — |
| Tempo mínimo de existência | — | **6 meses** |

> 🔴 **As duas primeiras linhas divergem, e a divergência é de conformidade.** Ver
> §Teto regulatório logo abaixo. **Para qualquer decisão de produto ou comunicação, vale
> R$ 15.000** — os valores do código são os que estão errados, não o teto.

Outros fatos do motor:

- **Score começa em 1000** e é decrementado por falha (−50) e pendência (−20).
  **≥ 700 → pré-aprovação; ≥ 400 → análise manual**; abaixo disso, reprovação.
- **Open Finance pesa muito** (`RegraOpenFinanceMovimentacao.java:42-44,75`): movimentação mensal
  **≥ 3× a parcela estimada** dá bônus de **200 pontos**; parcial dá 100; **saldo negativo custa −150**.
- Tipos de operação existentes: `CAPITAL_GIRO` e `OUTROS`. Só isso
  (`TipoOperacao.java`). Consignado, antecipação de recebíveis e linhas dedicadas **não existem**.
- Taxa default **2% a.m.**, amortização **PRICE**, primeira parcela em **30 dias**
  (`ParametrosCobrancaProperties.java:34,37,58`).
- Crédito exige onboarding em **`APROVADO_FINAL`** — que só existe **depois do PLD**
  (`StatusOnboarding.java`). A máquina é
  `INICIADO → DOCUMENTOS_RECEBIDOS → EM_VERIFICACAO → APROVADO → APROVADO_FINAL`.

---

## 🔴 Teto regulatório de R$ 15.000 — a divergência mais grave deste documento

**A norma.** Res. CMN 4.656/2018: *o credor não pode contratar com um mesmo devedor, na mesma SEP,
operações cujo valor nominal ultrapasse **R$ 15.000,00***. Exceção: credores que sejam
**investidores qualificados** (definição CVM).

O teto é do **par credor↔devedor acumulado** — não da operação, não do tomador. Em tese, um contrato
de R$ 200 mil seria legal se pulverizado entre 14+ credores. **É o modelo P2P.**

**Por que aqui o teto do par vira o teto da operação.** `OperacaoFinanciada.java:28-29`:

```java
@Column(name = "empresa_credora_id", columnDefinition = "uuid", nullable = false, updatable = false)
private UUID empresaCredoraId;
```

Uma operação pertence a **exatamente uma** credora — não-nulo e imutável. Os N `AporteCredora` de
uma operação são todos **da mesma credora** (parcelamento/retentativa). **Pulverização não está
implementada.** Sem ela, o teto do par colapsa no teto do contrato: **R$ 15.000**.

**O gap, medido:**

| Achado | Evidência |
|---|---|
| R$ 15.000 não existe no código | `grep -rn "15000" sep-api/src/main` → só `connection-timeout` em `application-test.yml:17` |
| A regra existente mira o eixo errado | `RegraValorMaximo` limita **por proposta e perfil do tomador**; a norma limita o **credor** |
| Os defaults excedem o teto legal | `application.yml:249-250` — `50000.00` e `200000.00` |
| O aporte não valida teto acumulado | `RegistrarAporteCredoraUseCase.validarComando` só checa `operacaoId`, `Idempotency-Key`, valor positivo, 2 casas decimais |
| Nenhuma regra de concentração existe | os hits de "exposicao" são javadoc sobre exposição de **DTO**, não de crédito |
| A exceção de investidor qualificado não é representável | `EmpresaCredora` não tem flag; o par `elegibilidade`/`motivoInelegibilidade` seria o lugar natural |

Hoje o sistema **aceita e formaliza** proposta PJ de R$ 200.000 financiada por uma credora só.

**Pendência declarada:** a leitura da norma aqui é de agente, não de jurídico. Confirmar antes de
virar spec, no mesmo regime do `PLD.md` e da política de privacidade da F-25.

**Duas saídas, e são estratégias de produto diferentes:**

1. **Alinhar o código ao teto** — `valorMaximoPf`/`valorMaximoPj` para 15.000 e uma regra de
   concentração por par credor↔devedor. Produto de ticket pequeno.
2. **Implementar pulverização** — N credoras por operação, com o teto por par. Destrava o ticket
   grande e é o modelo que a norma pressupõe. Muda `OperacaoFinanciada`, o matching e o escrow.
   Exige ADR.

Enquanto (2) não existe, **o produto é de R$ 15.000**, e é isso que a comunicação deve dizer.

---

**Consequência de produto:** o SEP **não** tem envelope maior que o da referência. R$ 15 mil é
**metade** do teto da landing da Serasa (R$ 30 mil). "Emprestamos mais" está morto como diferencial.
O que sobra e é verdadeiro: **capital de giro PJ** (a página da Serasa é empréstimo pessoal PF),
**24 meses** para empresa, e **escrow segregado com trilha auditável**.

---

## Persona 1 — Tomador PJ / MEI · *o alvo primário da landing*

### 🟩 Medido

- **Como o sistema o vê:** role `CLIENTE` (`Role.java`), `TipoSolicitante.EMPRESA` no onboarding,
  que dispara **KYB + PLD** (Sprint 7).
- **Só entra se a empresa tiver ≥ 6 meses** de existência (`RegraTempoExistenciaEmpresa`).
  Empresa recém-aberta é reprovada por regra, não por análise.
- **Pode pedir até R$ 15.000 em até 24 meses**, finalidade `CAPITAL_GIRO`. (O código diz
  R$ 200.000; o teto legal diz R$ 15.000 — ver §Teto regulatório. Vale o teto.)
- **Precisa conectar Open Finance para ter chance real.** Sem conexão, perde os 200 pontos de bônus;
  com saldo negativo, leva −150. O score inicial de 1000 dá folga, mas a combinação de pendências
  documentais + ausência de Open Finance derruba abaixo dos 700.
- **O caminho até o dinheiro tem 6 etapas obrigatórias:** cadastro → KYB documental → PLD →
  proposta → CCB assinada digitalmente → desembolso Pix. Nenhuma é pulável.

### 🟨 Hipótese — **confirmar**

- **Quem é no mundo:** sócio-administrador ou financeiro de empresa pequena, provavelmente sem
  departamento financeiro estruturado — quem decide o empréstimo é quem opera o negócio.
- **O gatilho:** descasamento de caixa com data marcada (folha, fornecedor, imposto, estoque
  sazonal). Não é investimento planejado; é uma data chegando.
- **Alternativa atual:** ⚠️ **campo mais importante do documento, e o único que não dá para medir.**
  Candidatos: cheque especial PJ, cartão de crédito, antecipação de recebíveis / maquininha,
  factoring, banco onde já tem conta, empréstimo com sócio ou família.
  **Cada um implica uma landing diferente**, porque a barra a superar é diferente:

  | Se a alternativa for… | O que precisamos provar |
  |---|---|
  | Cheque especial / cartão | **preço** — somos muito mais baratos |
  | Antecipação de recebíveis | **não consumir o recebível futuro** |
  | Banco onde já tem conta | **velocidade e ausência de reciprocidade** |
  | Nada (não conseguiu crédito) | **que ele se qualifica** — e aí a régua é o critério, não o preço |

- **O que o faria trocar:** previsibilidade da resposta e prazo até o dinheiro cair. Hipótese: pesa
  mais que taxa, dentro de uma faixa razoável.
- **O que o afasta:** pedir documento que ele não tem à mão; não dizer se vai dar certo antes de ele
  gastar meia hora; e — específico daqui — **pedir conexão Open Finance sem explicar por quê**.

### O que isso já decide sobre a landing

- Headline fala da **situação** ("capital de giro"), não da forma jurídica. MEI se autoexclui se a
  página disser "para empresas".
- **R$ 15.000 é ticket pequeno para capital de giro PJ**, e isso reposiciona a persona: não é a
  empresa financiando estoque sazonal inteiro, é a que precisa **fechar um buraco pontual de
  caixa**. Descasamento de uma folha, um fornecedor, um imposto. Muda quem é a pessoa e muda o
  gatilho — o campo *alternativa atual* abaixo passa a apontar mais para cheque especial e cartão
  do que para banco.
- O valor **não** é o diferencial. Não liderar com número.
- "≥ 6 meses de empresa" é critério de autoqualificação e **deve** estar visível. Poupa o tempo de
  quem não passa e aumenta a confiança de quem passa.
- O Open Finance precisa de uma frase de justificativa na própria home, não só no fluxo.

---

## Persona 2 — Tomador PF

### 🟩 Medido

- Role `CLIENTE`, `TipoSolicitante.PESSOA` → **KYC PF + PLD** (Sprint 6).
- **18 anos ou mais** (`RegraIdadeMinimaPessoa`).
- **Até R$ 15.000 em até 12 meses** (código diz R$ 50.000; vale o teto legal). Finalidade `OUTROS`
  — o código chama isso de "empréstimo PF genérico" (`TipoOperacao.java`).
- Mesma máquina de onboarding, mesmo motor de score.

### 🟨 Hipótese — **confirmar**

- **Existe mesmo como público-alvo, ou é subproduto do motor?** O javadoc do `TipoOperacao` trata
  `OUTROS` como escopo residual da Sprint 8. O PRD e a landing falam de PJ.
- ⚠️ **Decisão de escopo pendente, e ela é de negócio.** Se PF é alvo, o SEP compete de frente com a
  página da Serasa e **perde nos dois eixos**: teto de R$ 15 mil contra R$ 30 mil, prazo de 12 meses
  contra 48. VORP negativo. Se PF **não** é alvo, a landing não deve mencionar.
- Recomendação: **tratar como não-alvo até alguém dizer o contrário.** É a decisão reversível.

---

## Persona 3 — Empresa credora

### 🟩 Medido — e aqui a documentação do produto está errada

- **Não existe role `CREDORA`.** A credora é `CLIENTE` com uma `EmpresaCredora` vinculada
  (`ConsultarEmpresaCredoraPropriaUseCase`).
- ⚠️ **`POST /api/v1/credores` exige apenas `isAuthenticated()`** + onboarding PJ próprio aprovado
  (`EmpresaCredoraController.java:55-56`). **Não há convite, não exige `ADMIN`.**
  O texto de `redirect-to-app.component.ts:22-24` do `sep-app` afirma *"o cadastro é feito por
  convite. Solicite acesso pelo seu gestor de relacionamento"* — **isso não é imposto por nenhum
  mecanismo**. É convenção de processo, não regra de sistema.
- ⚠️ **A credora não consegue aportar sozinha.** `AporteCredoraController.java:57` exige
  `hasAnyRole('FINANCEIRO','ADMIN')`, e `FINANCEIRO` é **operador interno** por definição
  (`Role.java`). Ela vê oportunidade, registra interesse e acompanha carteira — mas o aporte é
  **operação assistida**.
- Esse é exatamente o achado que o Gate M-16.0 pegou tarde, e a razão de este documento existir.

### 🟨 Hipótese — **confirmar**

- **Quem é:** empresa com caixa ocioso buscando retorno acima de renda fixa, aceitando risco de
  crédito PJ pulverizado. Não é investidor de varejo.
- **Alternativa atual:** CDB / Tesouro / fundo de crédito privado. A barra é **retorno ajustado ao
  risco**, e é uma barra explícita e numérica — diferente da do tomador.
- **O que a faria trocar:** rastreabilidade e segregação via escrow (que o SEP **tem** de verdade)
  + retorno superior.
- **O aporte assistido é atrito ou é feature?** Se é decisão consciente (curadoria, conformidade),
  a landing deve dizer isso como **serviço**. Se é limitação temporária, não deve prometer
  autonomia que não existe.

---

## Personas internas — esboço, **não fecham o P2**

Não chegam pela landing. Ficam nomeadas para o documento não parecer completo:

| Papel | Role | O que falta |
|---|---|---|
| Operador de crédito | `FINANCEIRO` | motivação, volume diário, ferramenta atual |
| Operador de backoffice | `BACKOFFICE` | idem |
| Administrador | `ADMIN` | idem |

---

## O que este documento **não** resolve

Honestidade sobre o alcance, porque persona fraca dá falsa segurança:

1. **Nenhuma hipótese 🟨 foi validada com pessoa real.** Não houve entrevista. E o livro avisa:
   perguntar "você usaria isto?" colhe sim educado — pergunte o que a pessoa **fez**, não o que
   faria. Sinal forte é comportamento existente.
2. **Não há dado de uso** para corrigir hipótese: o `DIAGNOSTICO-PRODUTO.md` §3 mediu **zero
   métrica de produto**, e telemetria própria está bloqueada pela revisão jurídica da política de
   privacidade publicada na F-25.
3. **A decisão PF sim/não é de negócio**, não de engenharia, e está em aberto.

## Próximos passos

### Que dependem da direção — **não perguntar aqui**

Estas não são decisões de design. Estão em
[`PERGUNTAS-MODELO-NEGOCIO.md`](./PERGUNTAS-MODELO-NEGOCIO.md) e voltam respondidas:

| Espera | Pergunta lá |
|---|---|
| Quais modalidades existem, e qual vem primeiro | P12, P13 |
| PF continua sendo alvo | P12 |
| Teto de R$ 15.000: alinhar o código ou pulverizar | P35 |
| Se haverá terceiros operando — cria uma persona nova | P1, P4 |
| Se o tomador vira funcionário CLT | P18, P19 |

### Que são nossos, e andam agora

1. **Corrigir as duas afirmações falsas do `sep-app`.** Independem de qualquer decisão de rumo,
   porque são erradas em qualquer cenário: o "convite" da credora
   (`redirect-to-app.component.ts:22-24` — o cadastro exige só autenticação e onboarding PJ próprio)
   e o "Cadastro publico" do tomador (`landing.component.ts:31` — descontinuado na Sprint 5).
2. **Resolver os 🟨 por pesquisa de design, não por reunião.** O campo que mais paga é a
   *alternativa atual* do tomador: contra o que ele compara hoje. Isso se descobre conversando com
   usuário real sobre o que ele **fez**, não perguntando à direção o que ela imagina.
3. **Manter em aberto, para levantar quando a jornada da credora se confirmar:** o aporte é
   assistido por decisão (curadoria) ou por limitação temporária? Hoje exige `FINANCEIRO`/`ADMIN`.
   Não virou pergunta ao dono porque pode deixar de existir.

### Depois que as respostas chegarem

Reescrever as personas afetadas e então o **P3 do diagnóstico** — um cenário de ponta a ponta por
persona — e a sprint da landing.
