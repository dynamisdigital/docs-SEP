# Perguntas sobre o modelo de negócio do SEP

_Preparado em 2026-09-03 pela equipe técnica, para a próxima reunião com a direção._

## Como usar este documento

Nas últimas conversas apareceram três direções novas para o produto, e nenhuma delas está fechada:

1. a plataforma seria **implementada para terceiros**, com o SEP atuando como **conciliante**;
2. o produto ofereceria **consignado**, possivelmente como única modalidade;
3. o consignado seria **apenas para funcionários de empresas que já emprestam na plataforma**.

As três se afetam. Antes de construir qualquer coisa, precisamos confirmar o que foi entendido e
fechar as decisões que só a direção pode tomar.

**São 38 perguntas numeradas (P1 a P38).** As marcadas 🔴 travam o trabalho — sem resposta, a equipe
ou fica parada nessa frente, ou constrói algo que pode ser descartado.

Onde existe risco jurídico, trabalhista ou de privacidade, a pergunta vem acompanhada de uma
**opinião da equipe técnica**, marcada com ▸. É sugestão, não conclusão.

**Se o tempo da reunião for curto**, as cinco que mais destravam trabalho são **P1, P3, P4, P12 e
P37**. Não são as mais graves — a mais grave é a P25 —, são as que hoje impedem a equipe de
avançar.

> ⚠️ Este documento contém leitura de normas feita pela equipe técnica. **Não é parecer jurídico.**
> Os pontos 🔴 das partes I e IV deveriam passar por advogado antes de virarem decisão.

---

# PARTE I — Qual é o nosso negócio

Esta parte é nova e passou à frente das demais. A frase *"a plataforma será implementada para
terceiros, seremos os conciliantes"* admite leituras muito diferentes, e a diferença entre elas não
é de detalhe: é de **empresa**.

## 1. Somos instituição financeira, ou fornecedor de software?

**P1.** 🔴 Qual destas descreve o negócio?

| | Modelo | O que somos | Quem tem autorização do Banco Central |
|---|---|---|---|
| **A** | Nós operamos o SEP; terceiros participam como credores | Instituição financeira | Nós |
| **B** | Vendemos/licenciamos o sistema; cada terceiro opera o próprio SEP | Fornecedor de software | Cada cliente |
| **C** | Uma plataforma só, vários terceiros operando dentro dela, isolados entre si | Instituição **e** fornecedor | A definir — ver P2 |
| **D** | Nós operamos, e terceiros entram como parceiros de originação (trazem clientes) | Instituição financeira | Nós |

*Muda:* tudo. O produto, o time, o custo, o prazo, o risco e a licença. Em **B** não precisamos de
autorização e nosso cliente é uma empresa de tecnologia comprando software. Em **A** e **D** somos a
instituição e respondemos pela operação inteira. **C** é os dois ao mesmo tempo, e é o mais caro de
todos.

**P2.** 🔴 Operar uma SEP exige **autorização do Banco Central**. Se terceiros vão operar na nossa
plataforma: eles serão SEPs autorizados por conta própria, ou operarão sob a nossa autorização?
*Muda:* se operarem sob a nossa, nós respondemos perante o regulador por tudo o que eles fizerem —
inclusive pelo crédito que concederem e pelo tratamento que derem aos clientes deles. Se cada um
tiver a própria, somos fornecedor e a relação é contratual, não regulatória.

**P3.** 🔴 O que exatamente significa **"seremos os conciliantes"**? Encontramos dois sentidos
possíveis e eles não são a mesma coisa:

- **(a) Conciliação financeira** — nós operamos a rotina de casar pagamentos recebidos com parcelas
  em aberto, para os terceiros. É serviço operacional.
- **(b) Intermediação** — nós somos a parte que fica no meio entre quem empresta e quem toma, que é
  o papel que a norma atribui à SEP. É papel institucional.

*Muda:* (a) é um serviço que podemos prestar mesmo sendo fornecedor de software. (b) só existe se
formos a instituição autorizada. Se a intenção é as duas, precisamos saber, porque a conta é
diferente.

## 2. Se houver terceiros dentro da mesma plataforma

Responder só se P1 for **C** ou **D**.

**P4.** 🔴 Os dados de um terceiro podem ser vistos por outro? Clientes, propostas, carteira,
inadimplência.
*Muda:* isolamento entre terceiros **não existe hoje** no sistema — nada nele foi construído
sabendo que existiria mais de um operador. Não é uma tela nova; é uma mudança que atravessa todos
os módulos, todas as consultas e todas as tabelas.

> ▸ **Opinião da equipe técnica:** esta é a pergunta mais cara do documento. Se a resposta exigir
> isolamento, é um programa de trabalho, não uma sprint — e deveria ser decidido **antes** de
> construir mais qualquer funcionalidade, porque tudo que for feito até lá terá de ser revisitado.
> Adaptar depois custa muito mais do que nascer assim.

**P5.** Cada terceiro tem a **própria conta escrow** (conta segregada onde o dinheiro fica), ou
todos compartilham a nossa?
*Muda:* hoje a configuração do sistema aponta para **uma única** conta e um único conjunto de
credenciais. Uma conta por terceiro é mudança estrutural; conta compartilhada levanta a questão de
segregação patrimonial entre operadores diferentes.

**P6.** Cada terceiro define os **próprios limites, taxas e regras de crédito**, ou vale a mesma
regra para todos?
*Muda:* parâmetros por operador exigem que toda decisão de crédito passe a perguntar "de quem é
esta operação" antes de decidir.

**P7.** Cada terceiro aparece com a **própria marca** para o cliente final, ou todo mundo é SEP?
*Muda:* marca própria significa domínio, e-mail, contrato, aparência e loja de aplicativos por
terceiro. É um produto diferente do que existe hoje.

**P8.** O limite de **R$ 15.000** que a norma impõe vale "por credor, por devedor, **na mesma SEP**".
Se cada terceiro for uma SEP distinta, o limite conta separado por terceiro. Se todos estiverem sob
a nossa, o limite é somado. **Qual dos dois?**
*Muda:* muda o tamanho máximo do que cada cliente final consegue tomar.

## 3. Dinheiro

**P9.** Como cobramos do terceiro — mensalidade, taxa por operação, percentual do volume,
implantação, ou combinação?
*Muda:* define o que precisa ser medido e cobrado. Hoje **não existe nada** de faturamento no
sistema.

**P10.** Quem responde pelo **prejuízo de um calote** — o terceiro, o credor final, ou nós?

**P11.** Existe algum terceiro **já definido**, ou é um plano ainda sem cliente?
*Muda:* se já há um cliente concreto, as necessidades dele valem mais que qualquer suposição nossa,
e o certo é desenhar com ele. Se não há, estamos construindo flexibilidade para um cliente
imaginário — que é o jeito mais comum de gastar caro e errar.

> ▸ **Opinião da equipe técnica:** só construiríamos suporte a múltiplos terceiros com pelo menos
> **três** interessados concretos, ou um contrato assinado. Antes disso, o mesmo esforço rende muito
> mais aplicado ao produto que já existe. Flexibilidade construída cedo demais costuma não servir
> ao primeiro cliente real quando ele aparece.

---

# PARTE II — Que empréstimos vamos oferecer

Hoje o sistema reconhece **dois** tipos de operação: capital de giro para empresa e um empréstimo
pessoal genérico. Todo o resto — consignado, antecipação de recebíveis, financiamento com garantia —
está explicitamente marcado no código como fora de escopo.

**P12.** 🔴 **Qual é a lista de produtos que se pretende oferecer?** Não a de longo prazo — a dos
próximos 12 meses. Por exemplo:

- [ ] Capital de giro para empresa
- [ ] Empréstimo pessoal sem garantia
- [ ] Consignado (INSS / servidor público / CLT)
- [ ] Antecipação de recebíveis
- [ ] Financiamento com garantia
- [ ] Outro: ______

*Muda:* cada modalidade tem regra própria, garantia própria, forma de cobrança própria e norma
própria. Não são variações de um mesmo produto — são produtos. Uma lista de cinco itens é um plano
de anos, não de meses.

**P13.** 🔴 **Qual vem primeiro, e por quê?**
*Muda:* precisamos de um só para começar. Construir dois em paralelo com a equipe atual atrasa os
dois.

**P14.** O **capital de giro para empresa**, que já está construído, continua sendo produto?
*Muda:* é o que existe hoje pronto. Se sai de cena, há trabalho concluído que deixa de ser usado —
e é bom que essa decisão seja consciente, não um efeito colateral.

**P15.** As modalidades convivem **para o mesmo cliente**? Um tomador poderia ter consignado e
capital de giro ao mesmo tempo?
*Muda:* se sim, o limite de R$ 15.000 por credor precisa somar as duas — e hoje não soma nada,
porque não existe.

**P16.** Quem define o catálogo de produtos: **nós**, ou cada terceiro escolhe o que quer oferecer?
*Muda:* ligado ao P6. Catálogo por terceiro multiplica a complexidade de novo.

**P17.** Existe alguma modalidade **fora de questão** por decisão de negócio? Saber o que **não**
faremos ajuda tanto quanto saber o que faremos.

---

# PARTE III — Consignado

Responder se o consignado entrar na lista da P12.

## 1. Confirme o entendimento

Entendemos que os tomadores seriam **funcionários de empresas que já participam da plataforma como
credoras** — o patrão coloca o dinheiro, o funcionário toma emprestado, e a parcela sai da folha.

Duas ambiguidades da frase original, e cada uma leva a um produto diferente:

**P18.** 🔴 O patrão é o **credor** do empréstimo do próprio funcionário (o dinheiro é dele e ele
recebe de volta), ou é apenas quem **desconta em folha e repassa** a outros credores?

**P19.** 🔴 "Apenas funcionários de empresas que emprestam" restringe **quem pode tomar** (só
empregados de empresas participantes são elegíveis, mas qualquer credora financia), ou **quem
financia** (cada funcionário só é financiado pelo próprio patrão)?

## 2. O que este modelo resolve bem

Vale registrar, porque a direção acertou em pontos relevantes:

1. **Resolve o maior obstáculo técnico do consignado.** Consignado normalmente exige convênio de
   averbação com INSS ou empregadores — integração externa, lenta, fora do nosso alcance hoje. Com o
   empregador já na plataforma, o desconto em folha é nativo.
2. **O risco de calote cai muito.** Desconto na origem é a melhor garantia que existe em crédito
   pessoal.
3. **Resolve a aquisição de clientes.** Vender para **um** empregador traz **N** tomadores. É
   incomparavelmente mais barato que atrair um a um pela internet.
4. **Encaixa no que já está construído.** Hoje cada operação já tem exatamente **uma** empresa
   credora, e o pagamento de parcela **já não é iniciado pelo tomador** — é registrado por operador
   interno. O modelo do patrão-credor combina com os dois. Economiza meses.

## 3. Enquadramento 🔴

**P20.** 🔴 Entra **dentro do programa federal "Crédito do Trabalhador"** (consignado CLT com
desconto via eSocial), ou é **convênio privado** direto com cada empregador?

| | Dentro do programa | Convênio privado |
|---|---|---|
| Averbação | via eSocial, padronizada | acordo empresa a empresa |
| Margem | 35% da remuneração disponível | a definir por nós |
| Garantias extras | até 10% do FGTS + 100% da multa de 40% | nenhuma |
| Portabilidade | **o funcionário pode levar a dívida para outro banco** | não se aplica |
| Integração | alta (eSocial) | baixa por empresa, mas repete a cada empresa |

> ▸ **Opinião da equipe técnica:** atenção à portabilidade. Dentro do programa, um banco grande pode
> oferecer taxa menor e puxar a operação — o patrão perde o ativo que acabou de financiar. Isso
> precisa estar claro **antes** da escolha.

**P21.** 🔴 Se for convênio privado: **quem produz o instrumento que autoriza o desconto?**
O art. 462 da CLT proíbe desconto no salário, com exceções — entre elas o valor **expressamente
autorizado pelo trabalhador**. Empréstimo do empregador ao empregado exige previsão em **regulamento
interno, acordo individual ou norma coletiva**.
*Muda:* sem esse instrumento o desconto é contestável na Justiça do Trabalho, e a parcela pode ser
devolvida ao funcionário com a dívida seguindo em aberto.

> ▸ **Opinião da equipe técnica:** se o SEP fornecer o modelo do instrumento, assume parte do risco
> trabalhista de contratos que não controla. Vale exigir que cada empregador apresente o próprio,
> como condição de entrada, guardando a evidência na plataforma.

**P22.** 🔴 **Qual teto de juros se aplica?** O sistema usa 2% ao mês como padrão. Esse número não é
universal — o consignado do INSS tem teto de 1,85% ao mês em 2026, abaixo do nosso padrão.
*Muda:* se houver teto abaixo de 2%, o valor configurado precisa mudar antes de qualquer operação
real, e a margem entre o que se cobra e o que se paga ao credor fica menor do que se imagina.

## 4. Relação de trabalho 🔴

Riscos que provavelmente não apareceram na reunião. Nenhum é técnico.

**P23.** 🔴 Como fica demonstrado que o funcionário aderiu **voluntariamente**?
*Muda:* patrão como credor do empregado é relação assimétrica. Se alguém alegar pressão, precisamos
de evidência do contrário.

> ▸ **Opinião da equipe técnica:** resolve-se barato agora e caro no tribunal. Registrar o aceite do
> funcionário de forma independente do patrão — data, hora, trilha própria — custa pouco hoje.

**P24.** 🔴 O patrão **escolhe qual funcionário** recebe, ou qualquer elegível solicita e o sistema
decide?
*Muda:* se o patrão escolhe, concede a uns e nega a outros por critério próprio — abre discussão de
favorecimento e discriminação. Se o sistema decide, o patrão põe dinheiro sem controlar o destino.

**P25.** 🔴 **O funcionário sai da empresa com o empréstimo em aberto. O que acontece?**
É a pergunta operacional central, e vai acontecer em toda carteira, sempre:
- o saldo é descontado das verbas rescisórias? Até que limite?
- sobrando saldo, quem cobra o ex-funcionário — o ex-patrão ou o SEP?
- a dívida continua na plataforma depois de encerrado o vínculo?

*Muda:* é a diferença entre risco quase zero e uma carteira de ex-funcionários inadimplentes que
ninguém desenhou para administrar.

**P26.** 🔴 E se **a empresa** quebrar, atrasar salários ou sair da plataforma com empréstimos
ativos? O funcionário continua devendo — a quem?

## 5. Privacidade do funcionário 🔴

Hoje a plataforma **esconde de propósito** quem é o tomador de quem coloca o dinheiro: a credora vê
valor, prazo, taxa e status, e **nada** que identifique a pessoa. No modelo novo isso se inverte — a
credora é o patrão e sabe exatamente de quem se trata.

**P27.** 🔴 O patrão vê a **análise de crédito** do funcionário — pontuação, situação financeira,
resultado da checagem de prevenção à lavagem de dinheiro?

**P28.** 🔴 Se o funcionário for **reprovado**, o patrão fica sabendo?
*Muda:* o patrão descobriria, pelo sistema, que um empregado tem restrição de crédito. É informação
pessoal sensível que ele não teria de outra forma.

**P29.** 🔴 O patrão acompanha a **inadimplência** do funcionário no dia a dia?

> ▸ **Opinião da equipe técnica:** recomendamos como padrão **não mostrar nada além do necessário
> para operar** — valor, parcelas, saldo. Pontuação, motivo de recusa e resultado de checagem ficam
> fora da visão do empregador. É fácil abrir depois e difícil fechar depois, e a alternativa expõe a
> empresa e o SEP juntos.

## 6. Dinheiro

**P30.** Quem define a **taxa** — o patrão, o SEP, ou é tabelada?

**P31.** Quando o patrão desconta a parcela da folha, **o dinheiro chega a se mover?**
Se o patrão é o credor, ele desconta e o valor fica com ele — não há transferência.
*Muda:* consequência técnica grande. Toda a cobrança hoje pressupõe um pagamento real a conciliar.
Se vira lançamento contábil sem movimento, a baixa da parcela precisa funcionar de outro jeito.

**P32.** O dinheiro do empréstimo continua passando pela **conta escrow** na saída para o
funcionário?

## 7. Escala

**P33.** Qual o **porte de empregador** que se pretende atender, e quantos para o negócio fechar?

**P34.** Quem cadastra os funcionários: **RH em lote**, ou cada funcionário sozinho?
*Muda:* cadastro em lote não existe e precisa ser construído, com toda a verificação de identidade
que a norma exige. Autosserviço reaproveita o que já temos.

---

# PARTE IV — Limite regulatório que vale em qualquer cenário

**P35.** 🔴 A norma que rege a SEP limita a **R$ 15.000 o total que um mesmo credor pode emprestar a
um mesmo devedor** na mesma plataforma. Como hoje cada operação tem um único credor, na prática
**esse é o teto por cliente**. Confirma que o produto é desenhado para esse teto?
*Muda:* se a direção espera tickets maiores, é preciso permitir que **vários credores financiem o
mesmo empréstimo** — mudança estrutural de plataforma, não ajuste. Vale para qualquer modalidade da
P12, não só consignado.

**P36.** A norma abre exceção para credores que sejam **investidores qualificados**. Isso faz parte
do plano?
*Muda:* se sim, precisamos registrar e comprovar essa condição — hoje não existe no sistema.

---

# PARTE V — A página pública

**P37.** 🔴 Para **quem** a página pública do site precisa falar?

| Se o negócio for… | A página vende para… |
|---|---|
| P1 = B ou C (plataforma para terceiros) | **empresas que querem operar crédito** |
| Consignado via patrão | **empregadores** |
| Capital de giro PJ | **empresas que precisam de crédito** |
| Vários ao mesmo tempo | provavelmente **páginas diferentes** — uma só não fala com todos |

*Muda:* é o motivo de este documento existir. A página está sendo redesenhada, e escrevê-la para o
público errado joga a sprint fora. Hoje ela tenta falar com dois públicos ao mesmo tempo e não
convence nenhum.

**P38.** Existe expectativa de **captar clientes pela internet**, ou a venda é sempre feita por
pessoa — reunião, indicação, parceria?
*Muda:* se a venda é sempre por pessoa, a página é material de credibilidade e o esforço certo é
pequeno. Se há expectativa de captar sozinha, é outro nível de investimento — e envolve decisões
técnicas de indexação em buscadores que o site hoje não atende.

---

# O que está parado esperando resposta

| Parado | Depende de |
|---|---|
| Redesenho da página pública — texto, seções, simulador | P1, P12, P37, P38 |
| Qualquer decisão de arquitetura de médio porte | **P1 e P4** — construir sem saber se haverá isolamento entre terceiros é o risco mais caro em aberto |
| Correção do teto de valor no sistema | P35 |
| Correção da taxa padrão | P22 |
| Estimativa de prazo para consignado | P20 |

Nada disso está bloqueado por falta de capacidade técnica. Está bloqueado por falta de definição.

---

# Apêndice técnico

Para quem quiser conferir. Não é necessário para responder as perguntas.

## Evidência no código

| Afirmação | Onde |
|---|---|
| **Não existe isolamento entre operadores.** A única menção a "tenant" nos três repositórios é um comentário hipotético | `LockoutService.java:135` — *"o dia em que a fonte da verdade mudar (parametro governado, politica por tenant...)"* |
| **Escrow é configuração única** — um provedor, um conjunto de credenciais | `application.yml:136-137, 236-239` |
| Existem **dois** tipos de operação; o resto está fora de escopo | `TipoOperacao.java:7` — *"Linhas dedicadas (consignado, antecipacao, etc.) ficam fora de escopo desta fase"* |
| Existe um marcador de credora regulada, ainda sem uso | `TipoCredora.java` — `EMPRESA`, `INSTITUICAO_FINANCEIRA`, *"podem ter parametros operacionais diferentes nas sprints seguintes"* |
| **Nenhum** conceito de funcionário, empregador, folha ou salário | busca por `funcionario\|empregado\|empregador\|salario\|folha` → nenhum resultado de domínio |
| Cada operação tem **exatamente uma** credora, vínculo imutável | `OperacaoFinanciada.java:28-29` — `empresa_credora_id`, `nullable = false, updatable = false` |
| A credora **não vê** identidade do tomador | `OportunidadeResponse.java` expõe só `id, propostaId, contratoId, valor, prazoMeses, taxaJurosMensal, status, dataCriacao` |
| O tomador **não paga** pela plataforma | `CobrancaTomadorController` e `PixTomadorController` só têm `GET` |
| Recebimento é registrado por **operador interno** | `CobrancaController.java:192-193` — `POST /parcelas/{id}/recebimentos`, `hasAnyRole('FINANCEIRO','ADMIN')` |
| A credora **não aporta sozinha** | `AporteCredoraController.java:57` — `hasAnyRole('FINANCEIRO','ADMIN')` |
| Taxa padrão 2% a.m. | `ParametrosCobrancaProperties.java:58` |
| Tetos configurados: R$ 50 mil PF / R$ 200 mil PJ; 12 e 24 meses | `application.yml:249-252` |
| O teto de R$ 15.000 **não existe** no código | busca por `15000` → único resultado é um `connection-timeout` |
| **Não existe faturamento** de nenhum tipo | nenhum módulo de cobrança de cliente da plataforma |

## Fontes regulatórias consultadas

- **Res. CMN 4.656/2018** — teto de R$ 15.000 por par credor↔devedor na mesma SEP; exceção para
  investidores qualificados (CVM); SEP exige autorização do Banco Central.
  [BCB](https://normativos.bcb.gov.br/Lists/Normativos/Attachments/50579/Res_4656_v1_O.pdf) ·
  [Imprensa Nacional](https://www.in.gov.br/materia/-/asset_publisher/Kujrw0TZC2Mb/content/id/12378952/do1-2018-04-30-resolucao-n-4-656-de-26-de-abril-de-2018-12378948)
- **Crédito do Trabalhador** — consignado CLT federal, desconto via eSocial, margem 35% da
  remuneração disponível, garantia de até 10% do FGTS e 100% da multa de 40%, portabilidade ampla;
  virou lei, regras novas em vigor desde 26/06/2026.
  [Senior](https://www.senior.com.br/blog/consignado-privado-clt) ·
  [BM&C News](https://bmcnews.com.br/economia/consignado-clt-veja-as-regras-do-credito-do-trabalhador-em-2026/)
- **Art. 462 da CLT** — desconto salarial vedado, com exceção para valor expressamente autorizado;
  empréstimo do empregador ao empregado exige previsão em regulamento interno, acordo individual ou
  norma coletiva.
  [Teixeira Fortes](https://www.fortes.adv.br/2016/07/28/do-emprestimo-concedido-ao-empregado-da-validade-e-dos-limites-dos-descontos/) ·
  [Hapner Kroetz](https://www.hapnerkroetz.com.br/publicacoes/emprestimos-empregador-ao-empregado)
- **Lei 10.820/2003** — consignado por instituição financeira; §5º do art. 3º responsabiliza o
  empregador que desconta e não repassa.
  [Migalhas](https://www.migalhas.com.br/depeso/427867/consideracoes-acerca-do-emprestimo-consignado-clt)
- **Teto INSS 1,85% a.m. (2026)** — não se aplica a consignado CLT privado, mas evidencia que 2%
  a.m. não é padrão universalmente válido.
  [INSS/CNPS](https://www.gov.br/inss/pt-br/noticias/conselho-decide-aumentar-o-teto-da-taxa-de-juros-do-emprestimo-consignado-do-inss)

