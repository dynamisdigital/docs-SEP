# Roteiro de teste manual - Jornadas de usuário SEP

> **Hub de execução.** Roteiro manual, tela a tela, contra o **backend real local**
> (`:8080`, PostgreSQL em Docker, providers Fake). Cobre o marco `v1.0-local` (Fase 4).
> As jornadas ficam em [`roteiros-teste/`](./); este arquivo e o ponto de
> entrada, o preparo comum e a matriz de cobertura.
>
> Estado do produto: [`STATE.md`](../STATE.md). Escopo da fase:
> [`PRD-FASE-4.md`](../PRD-FASE-4.md) §37.

_Atualizado em: 2026-07-21._

## 1. Objetivo

Provar que o SEP funciona **como jornada de usuário** — e não apenas como endpoints e
componentes verdes isoladamente.

O que só este roteiro cobre, e nenhuma suite automatizada cobre hoje:

- **TOTP real** no login, no step-up e no step-up estrito.
- **Consumo único e expiração** do token de step-up em operações encadeadas.
- **Negação de rota por URL direta**, por persona.
- **Layout abaixo de 768px** e conferência visual.
- **Integração real entre as três superfícies** — os testes automatizados rodam contra MSW.

Os três primeiros itens estão registrados no [`STATE.md`](../STATE.md) como limitações que
"exigem smoke local" e nunca foram executados.

### O que este roteiro não e

- **Não substitui os testes automatizados.** Existem 36 specs Playwright no `sep-app` e 26
  no `sep-mobile`. Cada jornada aponta a spec equivalente e declara, no campo
  `So o manual cobre`, o que justifica sua existência.
- **Não e spec nem step.** Não define comportamento; verifica o comportamento entregue.
  Conflito entre este roteiro e uma spec resolve-se a favor da spec (ver
  [`AGENT.md`](../../AGENT.md) §Ordem de leitura).
- **Não cobre a Fase 5.** Celcoin real, AWS e publicação em lojas dependem de gates
  externos.

## 2. Como usar

### Execute pelo app, não editando o markdown

Abra [`app/index.html`](./app/index.html) — **duplo clique basta**, sem servidor e sem
internet. O app le os roteiros, mostra progresso, deixa marcar cada passo, registrar
ocorrências e definir o status de cada jornada.

Os `.md` são a **fonte dos roteiros** e ficam no git com todas as caixas vazias. Eles **não
são marcados**: quem registra resultado e o app.

Ao terminar, clique em **Exportar** e salve o JSON em
`roteiros-teste/execucoes/AAAA-MM-DD-<tag>/execucao.json`. Esse arquivo e o registro da
rodada: marcações, status por jornada, ocorrências, campos do registro e contra qual versão
dos roteiros a execução rodou. O app também **importa** esse JSON, o que permite retomar a
rodada em outra máquina.

> **Exporte antes de fechar a aba.** As marcações vivem no `localStorage` do navegador. Em
> `file://` alguns navegadores limpam esse armazenamento sem aviso (o Safari e o mais
> restritivo). Se o app detectar que não consegue gravar, ele exibe um banner vermelho no
> topo — nesse caso, exporte com frequência ou sirva a pasta por HTTP:
> `cd app && python3 -m http.server 8000`.

### Convenções do checklist

- Caixa marcada = passo executado **e** conforme. **Não existe caixa de "falhou"**: duas
  marcações convidariam a estados inconsistentes. Desvio vira linha em `Ocorrencias`.
- Passos agrupados **por tela**, com o esperado colado na linha do passo — quem executa le
  uma linha e decide, sem correlacionar com outra lista.
- Passo não aplicável usa `- [x] ~~texto~~ **N/A**`, para o progresso fechar em 100% sem
  mentir.
- Estados de jornada: `OK`, `NOK`, `BLOQUEADO`.

### Ordem de execução

Algumas pré-condições são produzidas por jornadas, não por setup. A ordem importa:

1. [`ROTEIRO-00`](./ROTEIRO-00-AMBIENTE-E-MASSA.md) — obrigatório, sempre primeiro
2. [`ROTEIRO-01`](./ROTEIRO-01-ACESSO-E-SESSAO.md) — acesso e sessão
3. Onboarding — produz `PRE-11` (KYC aprovado)
4. [`ROTEIRO-04`](./ROTEIRO-04-CREDITO-FORMALIZACAO.md) — produz `PRE-12` (contrato assinado)
5. Cobrança — depende de contrato `ASSINADO`
6. Credora, Pix, backoffice e financeiro — independentes entre si
7. Matriz RBAC — por último, com todas as personas já existindo

> A jornada de lockout (`J-012.W-N1`) bloqueia a persona por **30 minutos**. Execute-a por
> último dentro da sessão de acesso.

## 3. Superfícies e portas

**Tudo roda no navegador.** Aparelho físico e APK Android estão fora do ciclo atual; os
passos que dependem de hardware ficam marcados `N/A` nas jornadas, com critério de
reativação. As jornadas `.A` usam o **Insomnia** com a
[collection do projeto](../sep-api.insomnia_collection.json) — 18 pastas, 150 requests.

| Superfície | URL | Repo | Como |
|---|---|---|---|
| API | `http://localhost:8080` | `sep-api` | Insomnia (collection importada) |
| Web | `http://localhost:4200` | `sep-app` | Navegador |
| Mobile (PWA) | `http://localhost:8100` | `sep-mobile` | Navegador com emulação de dispositivo |

Sufixo de superfície no ID da jornada: `.W` web, `.M` mobile, `.A` API direta.

> **O mobile permanece no roteiro** mesmo sem aparelho: ele roda como PWA no navegador. Isso
> não e detalhe — o **cadastro de usuário só existe no mobile** (§7.2). Sem essa superfície
> não há como criar conta pela UI, só pela API.

> **Verifique que o MSW esta desligado.** Web e mobile podem rodar com Mock Service Worker.
> Se a superfície estiver em mock, o resultado do roteiro **não vale** — o mock aceita
> credenciais que o backend real recusa. Ver `PRE-04` no
> [`ROTEIRO-00`](./ROTEIRO-00-AMBIENTE-E-MASSA.md) §8.

## 4. Preparação e massa de dados

Tudo em [`ROTEIRO-00-AMBIENTE-E-MASSA.md`](./ROTEIRO-00-AMBIENTE-E-MASSA.md):
subir o ambiente, **bootstrap do primeiro ADMIN por SQL**, criação das personas, habilitação
de TOTP e as pré-condições `PRE-01` a `PRE-13`.

Personas: `admin`, `financeiro`, `backoffice`, `cliente-a`, `cliente-b`, `credora`.

Três pontos que costumam derrubar a primeira execução:

1. **Não há seed de usuários.** Nenhuma migration cria usuário; o primeiro ADMIN só nasce
   por SQL direto, porque o cadastro público sempre cria `CLIENTE` e a criação de interno
   exige um ADMIN que ainda não existe.
2. **A senha dos fixtures não funciona.** `123456` existe apenas no MSW. A política real e
   12+ caracteres ou passphrase de 4+ palavras.
3. **Step-up estrito exige MFA.** Sem TOTP habilitado, as operações financeiras retornam
   403 antes de olhar o token — e o enrollment de TOTP **só existe no web**.

## 5. Familias de jornada

| Banda | Família | Roteiro | Status |
|---|---|---|---|
| `J-000`–`J-039` | Público, login, MFA, sessão, perfil, senha, step-up | [`ROTEIRO-01`](./ROTEIRO-01-ACESSO-E-SESSAO.md) | **escrito** |
| `J-040`–`J-049` | Governança, usuários, parâmetros | `ROTEIRO-02` | a escrever |
| `J-050`–`J-059` | Onboarding KYC PF e KYB PJ + PLD | `ROTEIRO-03` | a escrever |
| `J-060`–`J-079` | Crédito, Open Finance, formalização, CCB | [`ROTEIRO-04`](./ROTEIRO-04-CREDITO-FORMALIZACAO.md) | **escrito** |
| `J-080`–`J-089` | Cobrança, inadimplência, renegociação, recebimentos | `ROTEIRO-05` | a escrever |
| `J-090`–`J-099` | **Congelada** — não reusar | — | — |
| `J-100`–`J-119` | Credora: cadastro, oportunidades, carteira, aporte, matching | `ROTEIRO-06` | a escrever |
| `J-120`–`J-139` | Pix: desembolso, recebimento, divergências, chaves | `ROTEIRO-07` | a escrever |
| `J-140`–`J-159` | Backoffice e financeiro/conciliação | `ROTEIRO-08` | a escrever |
| `J-160`–`J-169` | Plataforma: Android nativo, deep link, biometria | `ROTEIRO-09` | adiado — exige aparelho |
| `RBAC-NN` | Matriz de rota x role | `ROTEIRO-10` | a escrever |

### Por que `J-09x` esta congelada

No documento anterior, `J-090` a `J-092` eram erro, step-up ausente e logout-all. Reusar
essa banda faria um relatório antigo citando `J-091` ser lido com significado novo. Os
cenários migraram para variantes `-N` das jornadas pai, que e o lugar correto deles, e a
banda fica vazia como sinalização.

### Formato do ID

`J-NNN` + superfície + variante negativa: `J-070.W-N1` = jornada 070, web, primeira negativa.

## 6. Matriz de cobertura

### 6.1 Jornada de negócio x superfície

| Jornada de negócio | Web | Mobile | API | Entregue por |
|---|---|---|---|---|
| Cadastro de cliente | **não existe** (canalização) | sim | sim | Sprint 2 |
| Login, MFA, lockout, sessão | sim | sim | sim | Sprints 3, 5 |
| Enrollment de TOTP | sim | **não existe** | sim | Sprint 5 |
| Perfil e alteração de senha | sim | sim | sim | Sprints 2, 3 |
| Onboarding KYC PF | sim | sim | sim | Sprint 6 / F-6 / M-6 |
| Onboarding KYB PJ + PLD | sim | — | sim | Sprint 7 / F-6 |
| Proposta de crédito e parecer | sim | sim | sim | Sprint 8 / F-7 / M-7 |
| Open Finance | sim | sim | sim | Sprint 9 / F-7 / M-7 |
| Formalização, aceite, CCB | sim | sim | sim | Sprints 10-11 / F-8 / M-8 |
| Cobrança, parcelas, agenda | sim | sim | sim | Sprint 12 / F-9 / M-9 |
| Inadimplência e renegociação | sim | sim | sim | Sprints 13, 24, 27 / F-16 / M-9 |
| Backoffice operacional | sim | — | sim | Sprint 14 / F-10 |
| Financeiro e conciliação | sim | — | sim | F-10, F-17 |
| Governança: RBAC e parâmetros | sim | — | sim | Sprint 18 / F-12 |
| Credora: cadastro e carteira | sim | leitura | sim | Sprints 16-17 / F-11 / M-10 |
| Pix: desembolso e recebimento | sim | leitura | sim | Sprints 20-21 / F-13 / M-11 |
| Aporte da credora + escrow | sim | **leitura** | sim | Sprint 29 / F-18 / M-16 |
| Matching credora-operação | sim | **adiado** | sim | Sprint 30 / F-18 |
| Gestao de chaves Pix | sim | **adiado** | sim | Sprint 31 / F-20 |
| Empacotamento Android | — | sim | — | M-13 |
| Empacotamento iOS e biometria iOS | — | **bloqueado** | — | M-14/M-15 |
| **Exclusão de cliente pelo admin** | **não existe** | **não existe** | **não existe** | — |

### 6.2 Cobertura automatizada existente

As specs rodam contra **MSW**, não contra o backend real, e **não rodam em CI**.

| Roteiro | Specs web | Specs mobile |
|---|---|---|
| `ROTEIRO-01` | `smoke`, `golden-path` | `smoke`, `golden-path-mobile` (**vermelha**), `profile-actions` |
| `ROTEIRO-02` | `governanca`, `admin-flow` | — |
| `ROTEIRO-03` | `onboarding` | `onboarding-mobile` |
| `ROTEIRO-04` | `golden-path` (parcial) | `credito-mobile`, `formalizacao-mobile` |
| `ROTEIRO-05` | `cobranca` | `cobranca-mobile` |
| `ROTEIRO-06` | `credora-matching` | `credora-mobile` |
| `ROTEIRO-07` | `pix`, `pix-chaves` | `pix-mobile` |
| `ROTEIRO-08` | `backoffice` | — |

> `golden-path-mobile.spec.ts` esta vermelha desde a M-13. E a **única** spec que já bate no
> `:8080` real — as demais injetam MSW. A jornada `J-010.M` do
> [`ROTEIRO-01`](./ROTEIRO-01-ACESSO-E-SESSAO.md) executa manualmente o mesmo
> caminho e serve de referência para o diagnóstico.

## 7. Limitações e jornadas inexistentes

### 7.1 Exclusão de cliente pelo admin — não existe

Não há `DELETE /api/v1/usuarios/{id}` no `sep-api`. O admin **não exclui** um cliente. O
mais próximo e a remoção de role (`DELETE /api/v1/usuarios/{id}/roles/{role}`), que muda o
acesso mas preserva o usuário e a trilha — coerente com a decisão da migration V42 de não
usar `ON DELETE CASCADE` na FK de `usuario_role`, e com o PRD, que não preve soft delete
nesta fase.

- [ ] Confirmar que `/app/admin/users/:id` **não** oferece ação de exclusão
      _Como:_ Logado como `admin`, abrir o detalhe de um usuário e procurar botão de excluir,
      remover ou deletar. Não pode existir — o sistema não apaga usuário, por decisão. Se
      houver, é ocorrência (funcionalidade não prevista, com risco de perder trilha).
- [ ] Confirmar que `DELETE /api/v1/usuarios/{id}` responde `404`/`405`, não `500`
      _Como:_ No Insomnia, montar um request `DELETE` para `/api/v1/usuarios/<algum-id>` com o
      `adminAccessToken`. O endpoint não existe, então a resposta certa é `404` (rota
      inexistente) ou `405` (método não permitido). Um `500` seria defeito: significaria que o
      endpoint existe e quebrou, em vez de simplesmente não existir.

Jornada equivalente testável: remoção de role no `ROTEIRO-02` — o admin remove `CLIENTE` e o
usuário perde acesso as rotas de tomador.

> Os dois checkboxes transformam "isso não existe" em afirmação verificável. Se o endpoint
> aparecer um dia, o roteiro falha e avisa.

### 7.2 Cadastro público pelo web — não existe

No `sep-app`, `/register` e tela estática de canalização ("tomador baixa o app; credora entra
por convite; interno e criado pelo admin"). O cadastro real só existe no `sep-mobile`.
Coberto por `J-003.W` (canalização) e `J-003.M` (cadastro real).

### 7.3 FINANCEIRO e BACKOFFICE no mobile — tabs vazias

O `sep-mobile` tipa `UsuarioRole` como `'ADMIN' | 'CLIENTE'`. As duas roles internas
autenticam, mas nenhuma tab as lista: a barra fica **vazia**. Comportamento conhecido, não
defeito novo. Coberto por `J-045.M`, que distingue a limitação aceita (barra vazia) do que
seria bug de verdade (tela branca ou loop de navegação).

### 7.4 Enrollment de TOTP só no web

O mobile **verifica** TOTP mas não cadastra: não existe rota equivalente a
`/app/profile/setup-totp`. Qualquer persona que va operar step-up no mobile precisa habilitar
o MFA antes, pelo web.

### 7.5 Bloqueios por gate externo

| Item | Gate | Reativa quando |
|---|---|---|
| Android nativo, biometria, deep link, back físico | **Escopo deste ciclo** — só navegador | Houver aparelho ou emulador Android disponível |
| iOS nativo (M-14) e biometria iOS (M-15) | Hardware macOS 13+ para Xcode 15+ | Mac com macOS 13+, cloud Mac ou runner CI macOS |
| Matching, aporte POST e chaves Pix no mobile | **Gate M-16.0** — contratos exigem `FINANCEIRO`/`ADMIN`, role inexistente no `sep-mobile` | ADR + revisão da spec 216, ou backend que admita a credora dona |
| Celcoin real, AWS, publicação em lojas | Fase 5 | Credenciais e contas liberadas |

Jornadas bloqueadas permanecem no roteiro da família, na posição numérica correta, com
`- [x] ~~passo~~ **N/A**` e critério de reativação. Apagar faria o pedido voltar em três
meses e alguém reinvestigar do zero.

## 8. Achados a confirmar em execução

Suspeitas levantadas na leitura do código. São **verificações**, não afirmações.

- [ ] **A1** — A rota `/app/credora` **não** tem `roleGuard`, embora o item de menu seja
      `roles: ['CLIENTE']`. Conferir se `financeiro`, `backoffice` e `admin` alcançam a tela
      por URL direta. Se alcançarem, decidir se é intencional (o
      `credoraPresenceGuard` já barra as sub-rotas) ou gap de guard.
      _Como:_ Logar como `financeiro` e colar `http://localhost:4200/app/credora` na barra.
      Repetir com `backoffice` e `admin`. Anotar, para cada um, se a tela abre ou é barrada.
      Este é um **achado a confirmar**: o resultado alimenta uma decisão de projeto, não é
      pass/fail — registrar o que observou, sem julgar como defeito.
- [ ] **A2** — `roleGuard` (web e mobile) checa `user.role` — apenas a role **principal**,
      nunca o conjunto. Um usuário `{CLIENTE, FINANCEIRO}` tem principal `FINANCEIRO` e
      perderia acesso a rotas marcadas `CLIENTE`. Conferir com o `admin@sep.test`, que nasce
      `ADMIN`+`CLIENTE` pelo bootstrap.
      _Como:_ Logar como `admin@sep.test` (que é ADMIN **e** CLIENTE) e tentar abrir uma rota
      marcada só para `CLIENTE`, como `/app/credito/propostas/nova`. Registrar se ele alcança
      ou é barrado — isso mostra se o guard olha só a role principal ou o conjunto todo.
- [ ] **A3** — O `credoraPresenceGuard` do web **libera** o acesso quando o erro não é 404.
      Conferir o comportamento com a API fora do ar.
      _Como:_ Logar como `cliente-a`, abrir uma rota de credora e então **parar a API**
      (`Ctrl+C` no terminal do A3 do ROTEIRO-00). Recarregar a rota de credora e observar: o
      guard deixa passar ou barra? Religar a API depois. Registrar o comportamento observado.
- [ ] **A4** — O `sep-app` não tem equivalente do `redirectAuthenticatedGuard` do mobile: um
      usuário logado consegue reabrir `/login`. Conferir se isso gera estado inconsistente.
      _Como:_ Logado no web, colar `http://localhost:4200/login` na barra. A tela de login
      abre mesmo já logado? Se abrir, tentar entrar de novo e observar se algo quebra — é isso
      que se investiga: reentrar não pode deixar a sessão num estado estranho.
- [ ] **A5** — [`CONTRATOS.md`](../../repos/sep-api/CONTRATOS.md) descreve o aceite com
      `@RequireStepUp`, mas o `ContratoController` usa `@RequireStepUpEstrito` desde a
      Sprint 27. Divergência documental a corrigir no doc operacional.
      _Como:_ Este é o único A que não se testa na tela — é conferência de documento. A prova
      prática já está na [`J-070.W-N1`](./ROTEIRO-04-CREDITO-FORMALIZACAO.md#j-070w-n1---aceite-negado-para-usuário-sem-mfa):
      o aceite exige MFA, logo é estrito. Marcar quando aquela jornada confirmar, e registrar
      que o `CONTRATOS.md` precisa de correção.

## 9. Relação com o documento anterior

Este arquivo substitui o catálogo `J-001`..`J-092` congelado em 2026-05-13, que marcava como
`PLANEJADO` crédito, formalização, cobrança e credora — todos entregues desde então.

| ID antigo | Destino |
|---|---|
| `J-001`, `J-002`, `J-003` | `J-001.W`, `J-002.W-N1`/`J-002.M-N1`, `J-003.W`/`J-003.M` |
| `J-010`..`J-013` | `J-010.M`, `J-011.W`, `J-012.W-N1`, sessão expirada no `ROTEIRO-01` |
| `J-020`..`J-024` | `J-020.W`, `J-022.W`, `J-022.W-N1` |
| `J-021` (alterar nome) | **removida** — não há endpoint de atualização de perfil |
| `J-025` (deleção de conta) | **removida** — ver §7.1 |
| `J-030`..`J-032` | `J-030.W`, `J-031.W`, biometria no `ROTEIRO-09` |
| `J-040`..`J-042` | `ROTEIRO-02` |
| `J-050`..`J-053` | `ROTEIRO-03` |
| `J-060`..`J-062` | `J-060.W`, `J-061.W-N1`, `J-070.W` |
| `J-070`, `J-071` | `ROTEIRO-05` (banda `J-080`+) |
| `J-080`, `J-081` | `ROTEIRO-06` (banda `J-100`+) |
| `J-090`..`J-092` | variantes `-N` das jornadas pai; banda congelada |

## 10. Como regenerar o app

O conteúdo do app vem de [`app/dados.js`](./app/dados.js), **artefato derivado** dos `.md`
desta pasta. Depois de editar qualquer roteiro:

```bash
cd docs-sep/roteiros-teste/app
node gerar-dados.mjs
```

Sem dependências e sem `npm install` — só Node 22+. O gerador escreve **um único arquivo**,
`app/dados.js`, que e commitado para que um clone novo abra o app sem rodar nada.

| Comando | Para que |
|---|---|
| `node gerar-dados.mjs` | regenera `dados.js` |
| `node gerar-dados.mjs --relatorio` | imprime a arvore parseada e os totais |
| `node gerar-dados.mjs --check` | sai com código 1 se `dados.js` estiver velho |
| `node gerar-dados.mjs --force` | rebaixa erros a avisos (arquivo novo fora do padrão) |

O app **não le os `.md`** em tempo de execução — `file://` proibe `fetch`. Se você editar um
roteiro e não regerar, o app continua mostrando a versão antiga; o rodape avisa quando
`dados.js` passa de 7 dias.

Se um passo mudar de texto depois de marcado, o app **mantém a marca** e sinaliza "revise".
Se um passo sumir, a marca vai para o painel de **orfaos** em vez de ser apagada.

## 11. Formato dos roteiros

O parser exige as convenções abaixo. Elas eram implicitas até a criação do app; agora são
contrato. Violar qualquer uma faz `gerar-dados.mjs` abortar com `arquivo:linha`.

**Nome do arquivo**: `ROTEIRO-NN-TEMA.md` ou `CENARIOS-*.md`.

**Jornada** — o título carrega o id, e a tabela seguinte precisa de uma linha `ID`:

```markdown
### J-070.W - Tomador aceita o contrato com step-up estrito

| Campo | Valor |
|---|---|
| ID | `J-070.W` |
| Tipo | Positiva |
```

As demais chaves são livres: o app renderiza qualquer par chave/valor. Chave nova não quebra
nada.

**Passo** — id em negrito, **em-dash** (`—`) como separador, e até duas linhas de
continuação indentadas: `_Como:_` (opcional) e `_Esperado:_`, **nesta ordem**:

```markdown
- [ ] **P4** — Clicar em **Aceitar contrato**.
      _Como:_ O botão fica no rodapé da minuta; role a página até o fim para
      alcançá-lo. Se ele estiver desabilitado, a minuta ainda não foi lida por
      inteiro.
      _Esperado:_ vai para o step-up; o status continua `AGUARDANDO_ACEITE`.
```

As três partes têm papéis distintos, e vale respeitar a divisão:

| Parte | Responde | Tom |
|---|---|---|
| texto do passo | **o quê** | curto, uma ação, no infinitivo |
| `_Como:_` | **como fazer**, para quem não conhece o sistema | onde clicar, o que digitar, em qual terminal rodar, o que anotar |
| `_Esperado:_` | **como saber se deu certo** | o resultado observável |

Regras do `_Como:_`:

- Vem **depois** do texto e **antes** do `_Esperado:_`. Invertido, o gerador aborta com
  `COMO_DEPOIS_DE_ESPERADO` — se ele fosse tolerado ali, viraria parte do esperado e mudaria
  o hash do passo em silêncio.
- Grafia exata `_Como:_`. Variação (`_como:_`, `Como:`) aborta com `COMO_MALFORMADO`, em vez
  de virar texto do passo e disparar "revise" em quem já executou.
- **Fica fora do hash.** Melhorar uma instrução não invalida marcação de ninguém — é o
  motivo de o detalhe morar aqui e não no texto do passo.
- Entra na busca do app: dá para achar um passo pelo que está escrito no `_Como:_`.
- Passo `N/A` não recebe `_Como:_` (não há o que executar); o gerador avisa.
- Comando vai em fence dentro do passo — ganha botão **copiar** no app e aparece logo abaixo
  do `_Como:_`, não no fim do passo.

Prefixos de id validos: `A` a `ZZZ` seguidos de 1 a 3 dígitos (`P4`, `B12`, `A1`). **Ids se
repetem entre arquivos de propósito** — a chave real e `<ROTEIRO>/<escopo>/<id>`.

**Passo N/A** (bloqueado por gate):

```markdown
- [x] ~~**P6** — Conferir o download no APK Android~~ **N/A: fora deste ciclo.**
```

**Asserção final** — checkbox sem id, sob o marcador:

```markdown
**Resultado final esperado**

- [ ] Contrato em `EM_ASSINATURA` com envelope criado
```

**Seção com passos** (roteiros sem jornada, como o `ROTEIRO-00`): qualquer heading `##`/`###`
que contenha checkbox vira escopo automaticamente. Não precisa de tabela de metadados.

Regras que evitam surpresa:

- Bloco de código dentro de um passo fica **indentado 6 espacos** sob ele. A cerca ```` ``` ````
  tem prioridade sobre tudo — `- [ ]` dentro de código nunca vira passo.
- `---` sozinho e separador de jornada. Tabela usa `|---|---|`.
- Tabela `| Campo | Valor |` **só** e lida como metadados quando vem logo após um `### J-...`.
  Tabelas no meio do texto (personas, matrizes) são ignoradas pelo parser.
- Blockquote `>` dentro de uma jornada vira nota destacada no app.

Rode `node gerar-dados.mjs --relatorio` ao criar um roteiro novo e confira se os totais
batem antes de commitar.

## 12. Glossário

Termos que aparecem nos roteiros e não são óbvios para quem chega agora. No app, o botão
**Glossário** (tecla `g`) abre esta lista com filtro.

| Termo | Definicao |
|---|---|
| MFA | Autenticação multifator: além da senha, o sistema exige um segundo fator. No SEP o segundo fator é o TOTP. |
| TOTP | Código numérico de 6 dígitos que muda a cada 30 segundos, gerado por um app autenticador (Google Authenticator, Authy) pareado com a conta. É o segundo fator do MFA. |
| Backup code | Código de uso único, entregue ao habilitar o MFA, que substitui o TOTP quando o celular não está à mão. Cada código só funciona uma vez. |
| Step-up | Reautenticação no meio de uma operação sensível: mesmo já logado, o usuário confirma identidade de novo e recebe um token de curta duração para aquela ação específica. |
| Step-up legado | Variante que só exige o token de step-up se o usuário tiver MFA habilitado. Quem não tem MFA passa direto. |
| Step-up estrito | Variante que **nega** a operação quando o usuário não tem MFA, antes mesmo de olhar o token. É a diferença que várias jornadas negativas testam. |
| Token de uso único | O token de step-up vale para **uma** mutação. Reenviar a mesma requisição com o mesmo token dá 403 — é proposital. |
| KYC | "Know Your Customer": conferência de identidade da pessoa física. |
| KYB | O equivalente para pessoa jurídica: conferência da empresa e do representante. |
| PLD | Prevenção à lavagem de dinheiro. Exige trilha de auditoria do que aconteceu e quando. |
| Onboarding | A jornada de cadastro e aprovação que precede o crédito. Só com onboarding `APROVADO_FINAL` o tomador consegue criar proposta. |
| Proposta | O pedido de crédito criado pelo tomador, antes de virar contrato. |
| Formalização | A etapa entre a aprovação da proposta e o contrato assinado: gerar minuta, aceitar, assinar. |
| Minuta | A versão do contrato apresentada para leitura e aceite, antes da assinatura. |
| CCB | Cédula de Crédito Bancário: o documento de dívida que o tomador assina. É o PDF baixado ao fim da formalização. |
| Envelope | O pacote enviado ao provedor de assinatura digital. Tem status próprio (`ENVIADO`, `ASSINADO`) separado do status do contrato. |
| Webhook | Chamada que o provedor externo faz **para** o SEP avisando que algo aconteceu (ex.: "o documento foi assinado"). Nos roteiros ele é simulado pelo Insomnia. |
| HMAC | Assinatura criptográfica que acompanha o webhook e prova que ele veio mesmo do provedor. Webhook com HMAC errado deve ser recusado. |
| Idempotency-Key | Cabeçalho que identifica uma tentativa. Reenviar a mesma requisição com a mesma chave não duplica a operação — é o que protege contra duplo clique e retry. |
| IDOR | Falha em que trocar um ID na URL dá acesso ao dado de outra pessoa. As jornadas "de contrato alheio" existem para provar que o SEP **não** tem essa falha. |
| Escrow | Conta em que o dinheiro fica retido até a condição combinada se cumprir. |
| Lockout | Bloqueio temporário da conta após seguidas senhas erradas. No SEP: 5 tentativas em 15 min bloqueiam por 30 min. |
| RBAC | Controle de acesso por papel (`ADMIN`, `FINANCEIRO`, `BACKOFFICE`, `CLIENTE`). Define o que cada persona enxerga. |
| MSW | Mock Service Worker: camada que finge ser o backend no navegador. **Se ele estiver ligado, o teste não vale** — o roteiro exige o backend real. |
| DevTools | O painel do navegador aberto com `F12`. A aba **Network** mostra as chamadas de rede; a aba **Console** mostra os erros. |
| psql | O cliente de linha de comando do PostgreSQL. Nos roteiros ele é sempre chamado por dentro do Docker, pelo comando já pronto no passo. |
| Aba anônima | Janela do navegador que não reaproveita sessão nem cache de login. Garante que você está mesmo deslogado. |

## 13. Histórico de revisões

| Data | Mudanca |
|---|---|
| 2026-07-21 | Passos ganham `_Como:_` (instrução de execução) e o hub ganha §12 Glossário; roteiros passam a ser escritos em PT-BR acentuado. Histórico vira §13. |
| 2026-07-21 | App de execução em [`app/`](./app/): a marcação sai do markdown e vai para o navegador; a "regra da copia por execução" e substituida por exportar JSON. Novas seções §10 (regenerar) e §11 (formato dos roteiros). |
| 2026-07-21 | Reescrita completa. Vira hub de execução manual contra backend real; jornadas movidas para `roteiros-teste/`; `ROTEIRO-00`, `01` e `04` escritos como piloto. |
| 2026-05-13 | Última atualização do catálogo anterior (`ddc512d`). |
