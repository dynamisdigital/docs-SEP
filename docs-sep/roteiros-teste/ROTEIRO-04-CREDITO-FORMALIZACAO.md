# Roteiro 04 - Crédito e formalização

> Família `J-060` a `J-079`: proposta, motor de regras, parecer, Open Finance, contrato,
> aceite, assinatura, CCB e cancelamento. Requer
> [`ROTEIRO-00`](./ROTEIRO-00-AMBIENTE-E-MASSA.md) concluído.
> Hub: [`CENARIOS-TESTE-JORNADAS-USUARIO.md`](./CENARIOS-TESTE-JORNADAS-USUARIO.md).
>
> **Execute pelo [app](./app/index.html)**, não editando este arquivo — as caixas aqui ficam
> sempre vazias. Desvio não vira caixa marcada: vira **ocorrência** registrada no passo.

_Atualizado em: 2026-07-21._

## Por que esta família e a mais sensível

Todas as mutações de formalização usam **`@RequireStepUpEstrito`** (Sprint 27): o
`StepUpEnforcementAspect` **nega com 403 antes de validar o token** se o usuário não tiver
MFA habilitado. Não há bypass — diferente do `@RequireStepUp` legado, que ainda tolera
usuário pré-MFA em operações não-legais (ver
[`ROTEIRO-01`](./ROTEIRO-01-ACESSO-E-SESSAO.md) `J-022.W-N1`).

São atos legais sob a CMN 4.656/2018. Se qualquer jornada negativa desta família passar
quando deveria negar, e bloqueio de go-live, não achado menor.

> **Divergência documental conhecida.** O
> [`CONTRATOS.md`](../../repos/sep-api/CONTRATOS.md) ainda descreve o aceite com
> `@RequireStepUp` (texto da Sprint 10). O `ContratoController` usa `@RequireStepUpEstrito`
> desde a Sprint 27. O **código** e a referência; o doc operacional precisa de correção.

## Máquina de estados

```
GERADO            -> AGUARDANDO_ACEITE | CANCELADO
AGUARDANDO_ACEITE -> AGUARDANDO_ACEITE (regeneracao) | ACEITO | CANCELADO
ACEITO            -> EM_ASSINATURA        (listener automatico AFTER_COMMIT)
EM_ASSINATURA     -> ASSINADO | RECUSADO  (callback do webhook do provider)
ASSINADO / RECUSADO / CANCELADO = finais
```

Dois pontos que mudam o roteiro:

1. **O tomador não assina.** Ele **aceita**; o envio para assinatura e automático
   (`auto-envio-pos-aceite` default `true`) e a conclusão vem por **webhook**.
   `POST /contratos/{id}/assinar` e reenvio manual, restrito a `FINANCEIRO`/`ADMIN`.
2. **Há assincronia.** Aceite → envelope e envelope → assinado passam por listener
   `AFTER_COMMIT` e por webhook. Não existe polling na UI: e preciso reconsultar por gesto.

## Índice

| ID | Jornada | Superfície |
|---|---|---|
| [`J-060.W`](#j-060w---tomador-cria-proposta-de-crédito) | Tomador cria proposta | Web |
| [`J-061.W-N1`](#j-061w-n1---proposta-sem-onboarding-aprovado) | Proposta sem onboarding aprovado | Web |
| [`J-062.W`](#j-062w---autorizar-open-finance-e-reavaliar) | Open Finance e reavaliação | Web |
| [`J-063.W`](#j-063w---financeiro-registra-parecer-e-aprova) | FINANCEIRO aprova por parecer | Web |
| [`J-070.W`](#j-070w---tomador-aceita-o-contrato-com-step-up-estrito) | Tomador aceita o contrato | Web |
| [`J-070.W-N1`](#j-070w-n1---aceite-negado-para-usuário-sem-mfa) | Aceite negado sem MFA | Web + API |
| [`J-070.W-N2`](#j-070w-n2---aceite-de-contrato-alheio) | Aceite de contrato alheio | API |
| [`J-071.A`](#j-071a---assinatura-concluída-por-webhook-e-download-da-ccb) | Assinatura por webhook + CCB | API |
| [`J-072.W`](#j-072w---financeiro-cancela-contrato-pré-aceite) | Cancelamento pré-aceite | Web |
| [`J-073.M`](#j-073m---formalização-no-mobile) | Formalização no mobile | Mobile |

---

### J-060.W - Tomador cria proposta de crédito

| Campo | Valor |
|---|---|
| ID | `J-060.W` |
| Tipo | Positiva |
| Persona | `cliente-a` — CLIENTE com onboarding `APROVADO_FINAL` |
| Superfície | Web |
| Pré-condições | `PRE-01` `PRE-02` `PRE-04` `PRE-07` `PRE-11` |
| Endpoints tocados | `POST /api/v1/credito/propostas`, `GET /propostas/{id}` |
| Step-up | não |
| Duração | 8 min |
| Automação equivalente | nenhuma spec cobre a criação contra backend real |
| Só o manual cobre | Motor de regras avaliando dados reais, não fixture |

**Passos**

#### Tela `/app/credito/propostas/nova`

> **Esta jornada exige `PRE-11`** — `cliente-a` com onboarding aprovado, que é produzido pelo
> roteiro de onboarding, não pelo preparo do ROTEIRO-00. Sem isso, o comportamento correto é o
> da [`J-061.W-N1`](#j-061w-n1---proposta-sem-onboarding-aprovado): a UI manda você para o
> onboarding. Se for esse o caso, execute o onboarding antes e volte.

- [ ] **P1** — Abrir **Crédito** no menu e iniciar nova proposta.
      _Como:_ Logado como `cliente-a` (senha `jornada-tomador-sep-2026-v2` se você executou a
      `J-022.W`), abrir o menu lateral, grupo **Jornadas**, item **Crédito**. Procurar a ação
      de criar uma proposta nova.
      _Esperado:_ formulário com valor, prazo e finalidade.
- [ ] **P2** — Enviar com valor fora da faixa permitida.
      _Como:_ Digitar um valor absurdo de propósito — `1` ou `99999999` — e enviar. A recusa é
      o resultado correto. Conferir que a mensagem diz **qual** é a faixa aceita: erro que não
      orienta é erro pela metade, e vale registrar como ocorrência de usabilidade.
      _Esperado:_ recusado com mensagem de validação; nenhuma proposta criada.
- [ ] **P3** — Preencher valores válidos e enviar.
      _Como:_ Usar um valor dentro da faixa que a mensagem do P2 indicou, um prazo qualquer
      oferecido e uma finalidade. **Anotar o `propostaId`** que aparece no endereço depois do
      redirecionamento (`/app/credito/propostas/<id>`) — praticamente todas as jornadas
      seguintes deste roteiro dependem dele.
      _Esperado:_ `201`; redireciona para o detalhe da proposta.

#### Tela `/app/credito/propostas/:id`

- [ ] **P4** — Conferir o status logo após a criação.
      _Como:_ Na tela de detalhe, localizar o status da proposta. Qualquer um dos três valores
      esperados serve — inclusive `REJEITADA`, que não é falha do teste. O defeito seria
      status vazio, "carregando" que nunca termina, ou um valor fora dessa lista.
      _Esperado:_ o motor de regras já avaliou: `PRE_APROVADA`, `EM_ANALISE` ou `REJEITADA`.
      **Não** fica em branco nem em estado intermediário indefinido.
- [ ] **P5** — Conferir que nenhuma regra de decisão foi calculada no front.
      _Como:_ Na aba **Network**, abrir a resposta da chamada que trouxe a proposta e conferir
      que o status **já vem pronto no JSON**, igual ao que a tela mostra. Se o JSON não
      trouxesse status e a tela mostrasse um, a decisão de crédito estaria sendo tomada no
      navegador — onde o usuário pode alterá-la. Ocorrência grave.
      _Esperado:_ o status vem da API; a tela apenas exibe.
- [ ] **P6** — Conferir o audit log:
      _Como:_ Terminal do banco. Os dois eventos precisam existir: um registra que a proposta
      foi criada, o outro que o motor de regras a avaliou. Decisão de crédito sem trilha é
      problema de compliance.
      ```bash
      docker exec sep-postgres psql -U sep -d sep_dev \
        -c "SELECT tipo, data_evento FROM audit_log_seguranca
            WHERE tipo IN ('PROPOSTA_CRIADA','PROPOSTA_AVALIADA_MOTOR')
            ORDER BY data_evento DESC LIMIT 5;"
      ```
      _Esperado:_ `PROPOSTA_CRIADA` e `PROPOSTA_AVALIADA_MOTOR` registrados.

**Resultado final esperado**

- [ ] Proposta criada e avaliada pelo motor; anotar o `propostaId` para as proximas jornadas

---

### J-061.W-N1 - Proposta sem onboarding aprovado

| Campo | Valor |
|---|---|
| ID | `J-061.W-N1` |
| Tipo | Negativa — regra de negócio |
| Persona | `cliente-b` — CLIENTE **sem** onboarding `APROVADO_FINAL` |
| Superfície | Web + API |
| Vetor | Tentar contratar crédito sem KYC concluído |
| Comportamento seguro esperado | Bloqueio no backend, com orientação na UI |
| Pré-condições | `PRE-01` `PRE-02` `PRE-04` `PRE-09` |

**Passos**

- [ ] **P1** — Como `cliente-b`, abrir **Crédito**.
      _Como:_ Entrar como `cliente-b@sep.test` — atenção: se você executou a `J-022.W-N1`, a
      senha dele agora é `jornada-ownership-sep-2026-v2`. Abrir **Crédito** no menu. Esta
      persona nunca fez onboarding, então a tela deve orientar a fazê-lo em vez de oferecer o
      formulário de proposta.
      _Esperado:_ a UI direciona para o onboarding em vez de oferecer a proposta.
- [ ] **P2** — Chamar `POST /api/v1/credito/propostas` direto na API, com payload válido.
      _Como:_ **Este é o passo que importa** — o P1 só mostrou que a tela esconde o caminho, e
      esconder não é bloquear. No Insomnia, fazer login como `cliente-b`, guardar o token, e
      enviar o request de criação de proposta com um payload perfeitamente válido (pode copiar
      o que funcionou na `J-060.W`). A recusa tem de vir do **backend**.
      _Esperado:_ recusado pela regra `RegraOnboardingAprovado`. Nenhuma proposta criada.
- [ ] **P3** — Conferir no banco que nada foi persistido.
      _Como:_ Terminal do banco. Um 4xx na resposta não prova que nada foi gravado — pode ter
      criado a linha e falhado depois. Esta consulta fecha essa dúvida: a contagem tem de ser
      zero.
      ```bash
      docker exec sep-postgres psql -U sep -d sep_dev \
        -c "SELECT count(*) FROM proposta_credito p JOIN usuario u ON u.id = p.tomador_id
            WHERE u.username = 'cliente-b@sep.test';"
      ```
      _Esperado:_ nenhuma proposta para `cliente-b`.

> **P2 e o passo que importa.** Bloquear só na UI não e bloquear. Se a API aceitar, há
> contratação sem KYC — violação direta da CMN 4.656/2018.

---

### J-062.W - Autorizar Open Finance e reavaliar

| Campo | Valor |
|---|---|
| ID | `J-062.W` |
| Tipo | Positiva |
| Persona | `cliente-a` com proposta em `EM_ANALISE` |
| Superfície | Web |
| Pré-condições | `PRE-01` `PRE-02` `PRE-04` + `J-060.W` concluída |
| Endpoints tocados | `POST /credito/propostas/{id}/open-finance/consentimento`, `GET .../open-finance` |
| Provider | `FakeOpenFinanceProvider` (default) |
| Duração | 6 min |

**Passos**

- [ ] **P1** — No detalhe da proposta, iniciar a autorização de Open Finance.
      _Como:_ Abrir `/app/credito/propostas/<propostaId>` com o id anotado na `J-060.W`.
      Localizar a ação de Open Finance. Aqui não há banco de verdade: o provider é o
      `FakeOpenFinanceProvider`, que simula a resposta da instituição.
      _Esperado:_ vai para `/app/credito/propostas/:id/open-finance`.
- [ ] **P2** — Conferir o texto de consentimento antes de autorizar.
      _Como:_ **Ler o texto na tela, não só clicar.** O que se verifica: está escrito quais
      dados serão acessados e para quê? Consentimento é exigência regulatória — texto vago,
      ausente, ou caixa já marcada por padrão são ocorrência.
      _Esperado:_ escopo e finalidade explícitos. Consentimento não pode ser implícito.
- [ ] **P3** — Autorizar.
      _Como:_ Confirmar a autorização. O endereço muda para `.../open-finance/retorno` — é a
      simulação do retorno da instituição financeira.
      _Esperado:_ redireciona para `.../open-finance/retorno` (mesmo componente com
      `data.retorno = true`); consentimento registrado.
- [ ] **P4** — Voltar ao detalhe da proposta e reconsultar por gesto.
      _Como:_ "Por gesto" quer dizer: **você** aciona a atualização (botão de recarregar da
      tela, ou `F5`), a tela não se atualiza sozinha. Com a aba **Network** aberta, ficar
      parado uns 30 segundos e conferir que **não aparecem chamadas repetidas** — isso seria
      polling, que a arquitetura do projeto evita de propósito.
      _Esperado:_ dados do Open Finance refletidos; sem polling automático na aba de rede.
- [ ] **P5** — Repetir a autorização para a **mesma** proposta.
      _Como:_ Percorrer P1 a P3 de novo na mesma proposta. O sistema tem de absorver a
      repetição sem criar um segundo consentimento — é o que garante que um duplo clique ou um
      retry de rede não gere registro duplicado. Conferir no detalhe que continua havendo um
      consentimento só.
      _Esperado:_ tratado de forma idempotente; não duplica consentimento.

---

### J-063.W - FINANCEIRO registra parecer e aprova

| Campo | Valor |
|---|---|
| ID | `J-063.W` |
| Tipo | Positiva |
| Persona | `financeiro` — FINANCEIRO com TOTP habilitado |
| Superfície | Web |
| Pré-condições | `PRE-01` `PRE-02` `PRE-04` `PRE-06` `PRE-08` `PRE-10` + `J-060.W` |
| Endpoints tocados | `POST /credito/propostas/{id}/parecer`, `GET /propostas/{id}/regras` |
| Step-up | `@RequireStepUp` legado — como `financeiro` tem MFA, **exige** token |
| Duração | 8 min |
| Só o manual cobre | O parecer real que dispara a geração do contrato pelo listener |

**Passos**

- [ ] **P1** — Autenticar como `financeiro` e localizar a proposta de `J-060.W`.
      _Como:_ **Sair da sessão de `cliente-a` antes** — esta jornada é do outro lado do
      balcão. Entrar como `financeiro@sep.test` / `roteiro-manual-sep-2026` (com código TOTP).
      O menu agora mostra o grupo **Operação**, que o cliente não via. Localizar a proposta
      pelo `propostaId` anotado.
      _Esperado:_ FINANCEIRO enxerga propostas de qualquer tomador, com filtros.
- [ ] **P2** — Abrir a trilha de regras avaliadas.
      _Como:_ Procurar na tela a seção que lista as regras que o motor aplicou. O que se
      verifica é **coerência**: se o status é `PRE_APROVADA`, as regras listadas têm de
      sustentar isso. Trilha vazia ou que contradiz o status é ocorrência — é ela que
      justifica a decisão para o regulador.
      _Esperado:_ regras, score e sugestão do motor visíveis e coerentes com o status.
- [ ] **P3** — Registrar parecer com decisão `PENDENCIA`.
      _Como:_ Escolher `PENDENCIA` e escrever uma justificativa. **A justificativa tem tamanho
      mínimo e máximo** (10 a 500 caracteres) — escrever uma frase de verdade, não "teste".
      `PENDENCIA` é estado intermediário: a proposta continua viva e pode voltar a andar.
      _Esperado:_ status vai para `PENDENCIA`; **não** é estado final.
- [ ] **P4** — Registrar parecer com decisão `APROVAR`, passando pelo step-up.
      _Como:_ Novo parecer, agora `APROVAR`. Como `financeiro` tem MFA, aparece a tela
      **Confirmação adicional**: clicar em **Iniciar**, digitar o código TOTP **da conta
      `financeiro`** e **Confirmar**. Este é o passo que dispara a geração do contrato, em
      segundo plano.
      _Esperado:_ status `APROVADA` (final).
- [ ] **P5** — Tentar registrar um novo parecer na proposta já `APROVADA`.
      _Como:_ Tentar registrar mais um parecer na mesma proposta. A recusa é o resultado
      certo: `APROVADA` é estado final e não tem saída. Se aceitasse, uma proposta aprovada
      poderia ser revertida sem trilha.
      _Esperado:_ recusado — `APROVADA` é final, sem transição de saída.
- [ ] **P6** — Aguardar o `PropostaAprovadaListener` (AFTER_COMMIT) e consultar
      `GET /api/v1/contratos/proposta/{propostaId}`.
      _Como:_ O contrato **não** nasce junto com a aprovação: um processo em segundo plano o
      cria logo depois. Por isso a primeira consulta pode vir vazia — isso é normal. Esperar
      alguns segundos e consultar de novo (pelo Insomnia ou pela tela de formalização) até o
      contrato aparecer. Se depois de um minuto não aparecer, aí sim é ocorrência.
      _Esperado:_ contrato gerado em **`AGUARDANDO_ACEITE`**. Reconsultar até aparecer; a
      geração é assíncrona.
- [ ] **P7** — Anotar o `contratoId`.
      _Como:_ Copiar o `id` do contrato da resposta e guardar junto do `propostaId`. As
      jornadas `J-070.W`, `J-070.W-N2`, `J-071.A` e `J-073.M` todas dependem dele — perder
      esse valor significa refazer a cadeia inteira.

---

### J-070.W - Tomador aceita o contrato com step-up estrito

| Campo | Valor |
|---|---|
| ID | `J-070.W` |
| Tipo | Positiva |
| Persona | `cliente-a` — CLIENTE dono, **com** TOTP habilitado |
| Superfície | Web |
| Pré-condições | `PRE-01` `PRE-02` `PRE-04` `PRE-07` `PRE-10` + `J-063.W` |
| Endpoints tocados | `PATCH /api/v1/contratos/{id}/aceite` |
| Step-up | **Estrito** — sem MFA, nega 403 antes de validar o token |
| Duração | 10 min |
| Automação equivalente | [`golden-path.spec.ts`](../../../sep-app/e2e/golden-path.spec.ts) (parcial, com step-up mockado) |
| Só o manual cobre | TOTP real, consumo único do token, integridade do hash SHA-256 |

**Passos**

#### Tela `/app/formalizacao/proposta/{propostaId}`

- [ ] **P1** — Como `cliente-a`, abrir **Formalização** e localizar a proposta.
      _Como:_ Sair da sessão do `financeiro` e entrar como `cliente-a`. Menu lateral, grupo
      **Jornadas**, item **Formalização**. O contrato que aparece aqui é o que o
      `financeiro` gerou ao aprovar, na `J-063.W`.
      _Esperado:_ contrato vinculado em `AGUARDANDO_ACEITE`.
- [ ] **P2** — Abrir o contrato e ler a minuta.
      _Como:_ **Ler de verdade, comparando com a proposta.** O valor e o prazo têm de bater
      com o que foi aprovado. Este é o documento que a pessoa vai assinar juridicamente: campo
      vazio, `null`, `undefined` ou `[object Object]` na tela é ocorrência séria, mesmo que a
      tela "funcione".
      _Esperado:_ valor, prazo e cláusulas conferem com a proposta aprovada. Nenhum campo
      vazio ou `null` na tela.
- [ ] **P3** — Conferir a lista de versões (`GET /contratos/{id}/versoes`).
      _Como:_ Pelo Insomnia ou pela própria tela, se ela exibir versões. O hash é uma
      sequência de 64 caracteres entre letras e números — **contar os caracteres** se estiver
      em dúvida. Ele é a impressão digital do documento: serve para provar depois que o
      contrato assinado é exatamente este, sem alteração.
      _Esperado:_ ordem ascendente; a versão vigente tem hash SHA-256 de 64 caracteres.

#### Tela `/app/formalizacao/contratos/{contratoId}`

- [ ] **P4** — Clicar em **Aceitar contrato**.
      _Como:_ O botão fica no fim da minuta; rolar a página até alcançá-lo. **Conferir o
      status antes de prosseguir**: ele tem de continuar `AGUARDANDO_ACEITE`. Se mudasse já no
      clique, o aceite estaria sendo registrado antes da confirmação de identidade — que é
      exatamente o que esta jornada existe para impedir.
      _Esperado:_ vai para o step-up. O status **continua** `AGUARDANDO_ACEITE` — nenhuma
      mutação ocorreu ainda.
- [ ] **P5** — Informar o código TOTP corrente.
      _Como:_ Na tela **Confirmação adicional**: **Iniciar**, código da conta `cliente-a`,
      **Confirmar**. Ao voltar, **olhar o status de novo**: ainda tem de ser
      `AGUARDANDO_ACEITE`. Passar no step-up dá permissão para aceitar; não é o aceite.
      _Esperado:_ volta à tela de origem preservando o contexto. **O retorno do step-up não
      pode, sozinho, registrar o aceite.**
- [ ] **P6** — Confirmar o aceite.
      _Como:_ Agora sim, confirmar. Com o DevTools na aba **Network**, clicar na chamada de
      aceite e conferir em **Headers** que existe o `X-Step-Up-Token`. **Anotar o horário** —
      ajuda a localizar o evento no audit log do P9.
      _Esperado:_ `PATCH .../aceite` sai com `X-Step-Up-Token`; `200` com `status = ACEITO`.
- [ ] **P7** — Reconsultar `GET /api/v1/contratos/{id}/assinatura/status`.
      _Como:_ Outro processo assíncrono, como o do `J-063.W` P6: aceitar dispara o envio para
      o provedor de assinatura em segundo plano. Consultar pelo Insomnia, repetindo até o
      status mudar. **Anotar o `idEnvelopeExterno`** — a `J-071.A` precisa dele para simular o
      webhook de assinatura.
      _Esperado:_ após o `ContratoAceitoListener`, `statusContrato = EM_ASSINATURA` e
      `statusEnvelope = ENVIADO`. Anotar o `idEnvelopeExterno` (formato
      `fake-env-<idempotencyKey>` no provider Fake).
- [ ] **P8** — Tentar aceitar o **mesmo** contrato de novo.
      _Como:_ Voltar à tela do contrato e tentar aceitar outra vez (se o botão sumiu, repetir
      a chamada pelo Insomnia). O **409** é o resultado correto: o contrato já saiu de
      `AGUARDANDO_ACEITE`, e aceitar duas vezes criaria dois atos jurídicos para uma dívida
      só.
      _Esperado:_ **409** de estado inválido — `AGUARDANDO_ACEITE` era pré-condição.
- [ ] **P9** — Conferir o audit log.
      _Como:_ Terminal do banco. Procurar o evento de aceite no horário anotado no P6. Além de
      existir, ele precisa carregar **evidência técnica** — hash do documento, IP e
      user-agent. É o que permite provar mais tarde quem aceitou, o quê e de onde.
      ```bash
      docker exec sep-postgres psql -U sep -d sep_dev \
        -c "SELECT tipo, data_evento FROM audit_log_seguranca ORDER BY data_evento DESC LIMIT 5;"
      ```
      _Esperado:_ aceite registrado com evidência técnica (hash, IP, user-agent).

**Resultado final esperado**

- [ ] Contrato em `EM_ASSINATURA` com envelope criado
- [ ] Um único aceite registrado, mesmo com P8

---

### J-070.W-N1 - Aceite negado para usuário sem MFA

| Campo | Valor |
|---|---|
| ID | `J-070.W-N1` |
| Tipo | Negativa — controle de acesso |
| Jornada pai | [`J-070.W`](#j-070w---tomador-aceita-o-contrato-com-step-up-estrito) |
| Persona | `cliente-b` — CLIENTE, **sem** TOTP |
| Superfície | Web + API |
| Vetor | `@RequireStepUpEstrito` sem MFA cadastrado |
| Comportamento seguro esperado | **403**, nenhuma mutação, corpo genérico |
| Pré-condições | `PRE-01` `PRE-04` `PRE-09` + contrato próprio de `cliente-b` em `AGUARDANDO_ACEITE` |
| Automação equivalente | `ContratoControllerTest` (unitário); nenhuma E2E |

> Esta jornada **fecha o bloqueio de go-live da Sprint 27**. Se ela passar (aceite
> concluído sem MFA), o bypass pré-MFA voltou e o ato legal esta desprotegido.

**Passos**

> **Esta jornada precisa de um contrato do próprio `cliente-b` em `AGUARDANDO_ACEITE`** — não
> serve o do `cliente-a`, senão você estaria testando ownership (que é a
> [`J-070.W-N2`](#j-070w-n2---aceite-de-contrato-alheio)) e não ausência de MFA. Para
> produzi-lo: `cliente-b` precisa de onboarding aprovado e de uma proposta aprovada pelo
> `financeiro`, repetindo `J-060.W` e `J-063.W` com essa persona. **`cliente-b` tem de
> continuar sem TOTP** — é a condição do teste.

- [ ] **P1** — Autenticar como `cliente-b` e abrir o próprio contrato.
      _Como:_ Entrar como `cliente-b` (senha `jornada-ownership-sep-2026-v2` se a `J-022.W-N1`
      já rodou) e abrir a formalização do contrato dele. **Ler o contrato funciona sem MFA** —
      a proteção é sobre o ato de aceitar, não sobre a leitura.
      _Esperado:_ tela carrega normalmente — leitura não exige step-up.
- [ ] **P2** — Clicar em **Aceitar contrato**.
      _Como:_ Aqui o 403 é o resultado desejado. Além do erro, avaliar a **mensagem**: ela
      deve orientar a habilitar a verificação em duas etapas. O que não pode existir é
      qualquer atalho oferecido ali — "continuar mesmo assim", "pular esta etapa" — que
      permita aceitar sem MFA.
      _Esperado:_ **403**. A mensagem orienta habilitar MFA e **não** oferece caminho
      alternativo que burle o step-up.
- [ ] **P3** — Conferir o status do contrato após o erro.
      _Como:_ Recarregar a tela do contrato. Uma negação não pode deixar rastro: se o status
      tivesse mudado, a operação teria acontecido pela metade.
      _Esperado:_ segue `AGUARDANDO_ACEITE`. A negação não pode ter efeito colateral.
- [ ] **P4** — Chamar `PATCH /api/v1/contratos/{id}/aceite` direto na API, sem
      `X-Step-Up-Token`.
      _Como:_ Pelo Insomnia, autenticado como `cliente-b`, sem o header de step-up. Repete a
      lógica do P2 sem passar pela tela — porque bloquear só na interface não é bloquear.
      _Esperado:_ **403**.
- [ ] **P5** — Emitir um step-up token por `initiate` + `complete` e repetir **P4** com o
      header preenchido.
      _Como:_ **Este é o passo decisivo da jornada, e o mais fácil de executar errado.**
      `cliente-b` não tem TOTP, então o `complete` provavelmente falha — se falhar, registre
      isso e o passo está cumprido: sem MFA não há como obter o token. Se por algum motivo
      você conseguir um token e a chamada **ainda assim** der 403, é o resultado ideal: o
      estrito recusa por ausência de MFA **antes** de olhar o token. O que seria falha grave é
      a chamada dar `200`.
      _Esperado:_ ainda **403** — o estrito nega por ausência de MFA **antes** de validar o
      token. Este é o passo que distingue estrito de legado.
- [ ] **P6** — Conferir o corpo dos 403.
      _Como:_ Ler o corpo das respostas 403 no Insomnia. Não pode vazar id de usuário, nome de
      classe, caminho de arquivo nem explicação do tipo "usuário não possui MFA" — mensagem
      detalhada demais ensina o atacante a ajustar a tentativa.
      _Esperado:_ genérico ("Acesso negado"), sem UUID, sem stack trace, sem detalhe interno.

---

### J-070.W-N2 - Aceite de contrato alheio

| Campo | Valor |
|---|---|
| ID | `J-070.W-N2` |
| Tipo | Negativa — ownership |
| Jornada pai | [`J-070.W`](#j-070w---tomador-aceita-o-contrato-com-step-up-estrito) |
| Persona | `cliente-b` agindo sobre o contrato de `cliente-a` |
| Superfície | API |
| Vetor | IDOR — manipular o `contratoId` na URL |
| Comportamento seguro esperado | **403** de ownership, sem vazar dado do titular |
| Pré-condições | `PRE-01` `PRE-04` + `contratoId` de `cliente-a` (de `J-063.W`) |

**Passos**

- [ ] **P1** — Autenticado como `cliente-b`, chamar
      `GET /api/v1/contratos/{contratoId-do-cliente-a}`.
      _Como:_ **IDOR** é isto: trocar um identificador na URL para alcançar dado de outra
      pessoa. No Insomnia, autenticar como `cliente-b` e colocar na URL o `contratoId` do
      `cliente-a` (o da `J-063.W` P7). Além do 403, **ler o corpo da resposta**: nem um pedaço
      do dado alheio pode aparecer ali — nem valor, nem nome, nem documento.
      _Esperado:_ **403**. O corpo **não** pode conter valor, CPF ou nome do `cliente-a`.
- [ ] **P2** — Chamar `PATCH .../aceite` no mesmo contrato, com step-up válido do
      `cliente-b`.
      _Como:_ Se `cliente-b` não tem MFA, use `cliente-a`... **não** — a persona tem de ser
      `cliente-b` mesmo. O ponto do passo é que um step-up legítimo **da pessoa errada** não
      dá acesso: identidade confirmada e permissão sobre o recurso são coisas diferentes. Se
      não conseguir emitir o token por falta de MFA, registre isso; o passo continua provando
      o que precisa.
      _Esperado:_ **403** de ownership. Token válido **não** compensa ownership ausente.
- [ ] **P3** — Repetir **P1** pela URL do web (`/app/formalizacao/contratos/{id}`).
      _Como:_ Logado como `cliente-b` no navegador, colar
      `http://localhost:4200/app/formalizacao/contratos/<contratoId-do-cliente-a>`. Observar a
      tela **no instante do carregamento**: o defeito seria os dados do contrato alheio
      aparecerem por um segundo antes do erro. Vazamento de um segundo é vazamento.
      _Esperado:_ acesso negado na UI, sem renderizar dado parcial antes do erro.
- [ ] **P4** — Como `cliente-a`, conferir que o contrato segue intacto.
      _Como:_ Voltar para a sessão de `cliente-a` e abrir o contrato. As tentativas do
      `cliente-b` não podem ter mudado nada — nem status, nem qualquer campo.
      _Esperado:_ `AGUARDANDO_ACEITE` ou `EM_ASSINATURA`, conforme o ponto do roteiro.

---

### J-071.A - Assinatura concluída por webhook e download da CCB

| Campo | Valor |
|---|---|
| ID | `J-071.A` |
| Tipo | Positiva |
| Persona | Provider de assinatura (simulado) + `cliente-a` |
| Superfície | API + Web |
| Pré-condições | `PRE-01` `PRE-04` + `J-070.W` concluída (contrato em `EM_ASSINATURA`) |
| Endpoints tocados | `POST /api/v1/webhooks/assinatura/clicksign`, `GET /contratos/{id}/assinatura/status`, `GET /contratos/{id}/documento-assinado` |
| Duração | 10 min |
| Só o manual cobre | O ciclo completo de callback, dedup e integridade do documento |

> O webhook e público mas exige HMAC. O segredo de desenvolvimento e
> `dev-clicksign-webhook-secret-change-me` (default de `app.webhooks.secrets`); em qualquer
> ambiente que não seja local ele **precisa** ser trocado. Preencha
> `clicksignWebhookSecret` no environment antes de começar — a collection calcula a
> assinatura a partir dele.

**Passos**

- [ ] **P1** — Insomnia > **Webhook Assinatura Digital** >
      `POST /webhooks/assinatura/clicksign — sign (202)`, com `idEnvelopeExterno` preenchido
      no environment. Body:
      _Como:_ Você está no papel do provedor de assinatura: este request simula o aviso de
      "documento assinado" que a empresa de assinatura digital mandaria. Antes de enviar,
      conferir no environment que `idEnvelopeExterno` (anotado na `J-070.W` P7) e
      `clicksignWebhookSecret` estão preenchidos — sem o segredo, a assinatura HMAC sai errada
      e você recebe 401 em vez de 202. Body:
      ```json
      {
        "event": { "name": "sign", "occurred_at": "2026-07-21T12:00:00Z" },
        "document": { "key": "{{ idEnvelopeExterno }}" }
      }
      ```
      _Esperado:_ **202**.
- [ ] **P2** — Insomnia > **Webhook Assinatura Digital** >
      `POST /webhooks/assinatura/clicksign (HMAC invalido) — 401`.
      _Como:_ Este request tem a assinatura propositalmente errada. É o teste de que **qualquer
      pessoa na internet** pode chamar esse endereço, mas só quem tem o segredo consegue mudar
      alguma coisa. Se responder 202, qualquer um poderia declarar um contrato como assinado —
      é a ocorrência mais grave deste roteiro.
      _Esperado:_ **401**. Webhook sem assinatura válida não muda estado.
- [ ] **P3** — Insomnia > **Contratos** > `GET /contratos/{id}/assinatura/status`.
      _Como:_ Confirma que o webhook do P1 (e não o do P2) surtiu efeito. Os dois campos têm
      de estar `ASSINADO`.
      _Esperado:_ `statusContrato = ASSINADO` e `statusEnvelope = ASSINADO`.
- [ ] **P4** — Reenviar o **mesmo** callback de **P1**, sem alterar nada.
      _Como:_ Só clicar em **Send** de novo no request do P1. Provedores reenviam callbacks
      quando não têm certeza de que chegaram — é normal e o sistema tem de aguentar. O segundo
      envio não pode gerar um segundo evento nem alterar o estado. Conferir no P7 que os
      eventos não duplicaram.
      _Esperado:_ deduplicado pela UNIQUE `(envelope_id, id_evento_externo)`; nenhum evento
      duplicado e nenhuma mudança de estado.
- [ ] **P5** — Insomnia > **Contratos** > `GET /contratos/{id}/documento-assinado`.
      _Como:_ Autenticado como `cliente-a`. Olhar a aba **Headers** da resposta: tem de haver
      `Content-Disposition` (que faz o arquivo baixar em vez de abrir) e
      `X-Document-Hash-Sha256` (a impressão digital do documento). Como o provider é Fake, o
      conteúdo é um PDF de mentira com o texto indicado — isso é esperado, não defeito.
      _Esperado:_ `application/pdf` com `Content-Disposition` e `X-Document-Hash-Sha256`. No
      provider Fake, o conteúdo é o stub `%PDF-1.4 fake-assinado`.
- [ ] **P6** — Repetir **P5** com `clienteAccessToken` do `cliente-b`.
      _Como:_ Trocar o token para o do `cliente-b` e repetir. A CCB é a dívida de uma pessoa
      específica: ninguém além do titular pode baixá-la.
      _Esperado:_ **403** de ownership.
- [ ] **P7** — Conferir o audit log:
      _Como:_ Terminal do banco. Os quatro eventos contam a história completa do documento:
      gerado, enviado para assinatura, assinado e baixado. **Conferir também que não há
      duplicata** de `ASSINATURA_ASSINADA` — se houver duas, a deduplicação do P4 falhou.
      ```bash
      docker exec sep-postgres psql -U sep -d sep_dev \
        -c "SELECT tipo, data_evento FROM audit_log_seguranca
            WHERE tipo IN ('CCB_GERADA','ASSINATURA_ENVIADA','ASSINATURA_ASSINADA','DOCUMENTO_ASSINADO_BAIXADO')
            ORDER BY data_evento DESC LIMIT 10;"
      ```
      _Esperado:_ os quatro eventos registrados.
- [ ] **P8** — Conferir que o payload bruto do webhook **não** foi persistido.
      _Como:_ Payload de provedor externo costuma trazer dado pessoal; guardar o corpo inteiro
      no banco seria acumular PII sem necessidade. A coluna guarda no máximo 1000 caracteres.
      Rodar no terminal do banco e conferir o tamanho.
      ```bash
      docker exec sep-postgres psql -U sep -d sep_dev \
        -c "SELECT length(payload_resumo) FROM evento_assinatura ORDER BY data_evento DESC LIMIT 3;"
      ```
      _Esperado:_ `evento_assinatura.payload_resumo` truncado em 1000 chars; nenhum corpo
      integral no banco.
- [ ] **P9** — No web, como `cliente-a`, abrir o contrato.
      _Como:_ Fecha o ciclo pela interface: tudo o que foi feito por API tem de aparecer para
      o usuário. Abrir a formalização e conferir que o status é `ASSINADO` e que existe a ação
      de baixar a CCB. Baixar e abrir o arquivo — é o PDF de mentira do provider Fake.
      _Esperado:_ status `ASSINADO` e a CCB disponível para download.

**Resultado final esperado**

- [ ] Contrato `ASSINADO`, CCB acessível pelo titular e negada a terceiros
- [ ] `ASSINADO` é pré-condição das jornadas de cobrança — anotar o `contratoId`
      _Como:_ Este é o `PRE-12` que o hub cita na ordem de execução: o roteiro de cobrança só
      roda com um contrato assinado. Guardar o `contratoId` num lugar que sobreviva ao fim da
      sessão de hoje.

---

### J-072.W - FINANCEIRO cancela contrato pré-aceite

| Campo | Valor |
|---|---|
| ID | `J-072.W` |
| Tipo | Positiva + negativa de estado |
| Persona | `financeiro` — FINANCEIRO com TOTP |
| Superfície | Web + API |
| Pré-condições | `PRE-01` `PRE-04` `PRE-06` `PRE-08` `PRE-10` + um segundo contrato em `AGUARDANDO_ACEITE` |
| Endpoints tocados | `POST /api/v1/contratos/{id}/cancelar` |
| Step-up | **Estrito** |

**Passos**

> **Esta jornada precisa de um segundo contrato**, ainda em `AGUARDANDO_ACEITE` — o da
> `J-070.W` já foi aceito e serve só para o P3. Para produzi-lo, repetir `J-060.W` e
> `J-063.W` criando outra proposta para `cliente-a` e aprovando-a. Fazer isso **antes** de
> começar os passos abaixo.

- [ ] **P1** — Como `financeiro`, cancelar um contrato em `AGUARDANDO_ACEITE` com
      justificativa de menos de 10 caracteres.
      _Como:_ Entrar como `financeiro`, abrir o **segundo** contrato (não o aceito) e acionar
      o cancelamento com uma justificativa curta de propósito, como `erro`. A recusa é o
      resultado certo: cancelar contrato é ato relevante e exige motivo registrado de verdade.
      _Esperado:_ recusado por validação (justificativa de 10 a 500 chars).
- [ ] **P2** — Cancelar com justificativa válida, passando pelo step-up.
      _Como:_ Repetir com uma justificativa real, por exemplo `Cancelamento de teste do
      roteiro manual de formalização`. O step-up aqui é **estrito** — é o mesmo mecanismo do
      aceite: **Iniciar**, código TOTP da conta `financeiro`, **Confirmar**. `CANCELADO` é
      estado final, sem volta.
      _Esperado:_ `200`; status `CANCELADO` (final).
- [ ] **P3** — Tentar cancelar um contrato já **`ACEITO`** (o de `J-070.W`).
      _Como:_ Agora sobre o primeiro contrato, o que foi aceito. O 409 é o resultado certo:
      depois do aceite existe um ato jurídico, e desfazê-lo por cancelamento simples apagaria
      a dívida sem trilha adequada.
      _Esperado:_ **409**. Cancelamento só vale antes do aceite.
- [ ] **P4** — Como `cliente-a`, tentar cancelar o próprio contrato.
      _Como:_ Trocar de sessão para `cliente-a` e tentar cancelar pela API (a tela dele nem
      deve oferecer a ação). Mesmo sendo o dono, o tomador não cancela: seria uma saída
      unilateral da dívida.
      _Esperado:_ **403**. Cancelamento é de `FINANCEIRO`/`ADMIN`, não do tomador.
- [ ] **P5** — Conferir que a justificativa foi truncada no evento, não no dado.
      _Como:_ Terminal do banco. A distinção: o **dado** do contrato guarda a justificativa
      inteira, mas o **evento de auditoria** guarda só um resumo — trilha não é lugar de
      texto livre irrestrito.
      ```bash
      docker exec sep-postgres psql -U sep -d sep_dev \
        -c "SELECT tipo, length(detalhes::text) FROM audit_log_seguranca ORDER BY data_evento DESC LIMIT 5;"
      ```
      _Esperado:_ auditoria registra o cancelamento sem expor texto integral irrestrito.

---

### J-073.M - Formalização no mobile

| Campo | Valor |
|---|---|
| ID | `J-073.M` |
| Tipo | Positiva |
| Persona | `cliente-a` |
| Superfície | Mobile — **PWA em `localhost:8100` no navegador** |
| Pré-condições | `PRE-01` `PRE-03` `PRE-04` `PRE-07` `PRE-10` + contrato em `AGUARDANDO_ACEITE` |
| Automação equivalente | [`formalizacao-mobile.spec.ts`](../../../sep-mobile/e2e/formalizacao-mobile.spec.ts) |
| Só o manual cobre | TOTP real no step-up mobile |

**Passos**

> **Esta jornada precisa de um contrato de `cliente-a` em `AGUARDANDO_ACEITE`.** Se você já
> aceitou o da `J-070.W` pelo web, produza outro (repetir `J-060.W` + `J-063.W`) ou use o
> segundo contrato criado para a `J-072.W`, desde que não tenha sido cancelado. O ponto da
> jornada é fazer o aceite **pelo mobile**, então o contrato precisa estar por aceitar.

- [ ] **P1** — Com a emulação de dispositivo ligada, abrir a aba **Propostas** e ir à
      formalização.
      _Como:_ Em `http://localhost:8100`, logado como `cliente-a`, com `Ctrl+Shift+M` ligado.
      A navegação do mobile é por abas no rodapé — tocar em **Propostas** e seguir até a
      formalização do contrato pendente.
      _Esperado:_ contrato listado com status correto.
- [ ] **P2** — Abrir o contrato e ler a minuta.
      _Como:_ **Este passo é sobre o layout mobile**, que nenhum teste automatizado cobre.
      No DevTools, trocar o preset para uma largura de **320px** (o menor telefone comum) e
      rolar a minuta inteira. Procurar barra de rolagem **horizontal** e texto cortado na
      borda — qualquer um dos dois é ocorrência.
      _Esperado:_ texto legível sem scroll horizontal; sem corte a 320px de largura.
- [ ] **P3** — Aceitar, passando pelo step-up com TOTP real.
      _Como:_ Aceitar o contrato. O step-up é o mesmo do web: **Iniciar**, código TOTP da
      conta `cliente-a`, **Confirmar**. O mobile sabe **verificar** o código, mas não sabe
      cadastrar TOTP — por isso o enrollment teve de ser feito no web, no §6.2 do ROTEIRO-00.
      _Esperado:_ `ACEITO`; o mobile **verifica** TOTP normalmente (o que ele não faz é
      cadastrar).
- [ ] **P4** — Reconsultar por gesto até `ASSINADO` (após `J-071.A`).
      _Como:_ O status só chega a `ASSINADO` depois que o webhook da
      [`J-071.A`](#j-071a---assinatura-concluída-por-webhook-e-download-da-ccb) for enviado —
      se você ainda não fez aquela jornada com **este** contrato, o status para em
      `EM_ASSINATURA`, e está correto. "Por gesto" quer dizer que **você** puxa para atualizar
      ou recarrega; a tela não faz sozinha. Conferir na aba Network que não há chamadas
      repetidas em intervalo fixo.
      _Esperado:_ status atualiza; **sem polling automático**.
- [ ] **P5** — Baixar o contrato assinado.
      _Como:_ Acionar o download da CCB. No PWA (navegador), o arquivo cai na pasta de
      downloads como qualquer download — é o PDF de mentira do provider Fake.
      _Esperado:_ download conclui no PWA.
- [x] ~~**P6** — Conferir o download em WebView no APK Android~~ **N/A: fora deste ciclo
      (sem aparelho físico). Reativa quando houver device ou emulador Android.**
- [ ] **P7** — Conferir a consistência entre superfícies.
      _Como:_ Abrir o **mesmo** contrato no web (`localhost:4200`) e no mobile
      (`localhost:8100`), lado a lado. O status tem de ser idêntico nos dois. Divergência
      indica cache desatualizado numa das telas — ocorrência, porque as duas leem o mesmo
      backend e deveriam concordar.
      _Esperado:_ o mesmo contrato mostra o mesmo status no web e no mobile.

---

## Ocorrências desta execução

> Estrutura lida pelo gerador para montar o painel de ocorrências do app.
> **Não preencher aqui** — registre a ocorrência no próprio passo, dentro do app.

| # | Jornada | Passo | O que aconteceu | Esperado | Issue |
|---|---|---|---|---|---|
| | | | | | |

## Registro da execução

> Estrutura lida pelo gerador para montar o formulário de registro do app.
> **Não preencher aqui** — preencha no painel lateral do app; o resultado sai no JSON
> exportado. Alterar os rotulos desta tabela muda os campos do formulario.

| Campo | Preencher |
|---|---|
| Executado por | |
| Data / hora | |
| Commit `sep-api` | |
| Commit `sep-app` | |
| Commit `sep-mobile` | |
| `propostaId` usado | |
| `contratoId` usado | |
| Jornadas `OK` | |
| Jornadas `NOK` | |
| Jornadas `BLOQUEADO` | |
| Observações | |
