# Roteiro 01 - Acesso e sessão

> Família `J-000` a `J-039`: público, cadastro, login, MFA, lockout, sessão, perfil, senha e
> step-up. Requer [`ROTEIRO-00`](./ROTEIRO-00-AMBIENTE-E-MASSA.md) concluído.
> Hub: [`CENARIOS-TESTE-JORNADAS-USUARIO.md`](./CENARIOS-TESTE-JORNADAS-USUARIO.md).
>
> Tudo no navegador. O mobile e o PWA em `localhost:8100` com emulação de dispositivo.
> Biometria nativa fica no `ROTEIRO-09`, adiado por exigir aparelho.

_Atualizado em: 2026-07-21._

## Como marcar

**Execute pelo [app](./app/index.html)**, não editando este arquivo — as caixas aqui ficam
sempre vazias, porque este `.md` e a fonte do roteiro, não o registro da rodada.

Caixa marcada = passo executado **e** conforme. Desvio não vira caixa marcada: vira uma
**ocorrência** registrada no passo. Estados de jornada: `OK`, `NOK`, `BLOQUEADO`.

## Índice

| ID | Jornada | Superfície |
|---|---|---|
| [`J-001.W`](#j-001w---visitante-navega-da-landing-até-o-login) | Landing pública até o login | Web |
| [`J-002.W-N1`](#j-002w-n1---visitante-tenta-área-autenticada) | Visitante tenta área autenticada | Web |
| [`J-002.M-N1`](#j-002m-n1---visitante-tenta-área-autenticada-mobile) | Visitante tenta área autenticada | Mobile |
| [`J-003.W`](#j-003w---visitante-tenta-se-cadastrar-pelo-web-canalização) | Canalização do cadastro no web | Web |
| [`J-003.M`](#j-003m---visitante-cria-conta-de-cliente) | Cadastro de cliente | Mobile |
| [`J-010.M`](#j-010m---cadastro--login--sair) | Cadastro + login + sair | Mobile |
| [`J-011.W`](#j-011w---login-com-mfa-totp) | Login com MFA TOTP | Web |
| [`J-012.W-N1`](#j-012w-n1---login-inválido-até-o-lockout) | Login inválido até o lockout | Web |
| [`J-020.W`](#j-020w---consultar-o-próprio-perfil) | Consultar o próprio perfil | Web |
| [`J-022.W`](#j-022w---alterar-senha-com-step-up) | Alterar senha com step-up | Web |
| [`J-022.W-N1`](#j-022w-n1---alterar-senha-sem-mfa-usa-o-bypass-legado) | Alterar senha sem MFA (bypass legado) | Web |
| [`J-030.W`](#j-030w---habilitar-mfa-totp) | Habilitar MFA TOTP | Web |
| [`J-031.W`](#j-031w---usar-backup-code-e-tentar-reusar) | Backup code e tentativa de reuso | Web |
| [`J-033.W`](#j-033w---token-de-step-up-e-de-uso-único) | Token de step-up e de uso único | Web |
| [`J-045.M`](#j-045m---usuário-financeiro-autentica-no-mobile) | FINANCEIRO no mobile (limitação) | Mobile |

---

### J-001.W - Visitante navega da landing até o login

| Campo | Valor |
|---|---|
| ID | `J-001.W` |
| Tipo | Positiva |
| Persona | Visitante (sem token) |
| Superfície | Web `http://localhost:4200` |
| Pré-condições | `PRE-01` `PRE-02` `PRE-04` |
| Credenciais | nenhuma — esta jornada é de visitante, **sem** fazer login |
| Endpoints tocados | nenhum obrigatório |
| Duração | 3 min |
| Automação equivalente | [`smoke.spec.ts`](../../../sep-app/e2e/smoke.spec.ts) (parcial) |
| Só o manual cobre | Leitura visual do conteúdo, layout <768px |

**Passos**

#### Tela `/` (landing)

- [ ] **P1** — Abrir `http://localhost:4200` em aba anônima.
      _Como:_ No Chrome, `Ctrl+Shift+N` abre uma janela anônima (no Firefox,
      `Ctrl+Shift+P`). A janela anônima importa: ela não tem token de sessão de execuções
      anteriores, e é isso que faz de você um "visitante". Digitar o endereço na barra e
      abrir. Se a página não carregar, o `sep-app` não está no ar — volte ao
      [`ROTEIRO-00`](./ROTEIRO-00-AMBIENTE-E-MASSA.md) §4.3.
      _Esperado:_ landing carrega; nenhum erro no console.
- [ ] **P2** — Abrir a aba de rede antes de interagir.
      _Como:_ `F12` abre o DevTools; escolher a aba **Network** (ou **Rede**) e recarregar
      com `Ctrl+R` para capturar o carregamento desde o início. Ler a coluna **Name**: você
      deve ver só arquivos estáticos (`.js`, `.css`, fontes, ícones). O que **não** pode
      aparecer é chamada à API — filtre por `auth` ou `api` na caixa de filtro para
      confirmar que a lista fica vazia.
      _Esperado:_ **nenhuma** chamada autenticada (`/auth/me`, `/api/v1/...`) antes do login.
- [ ] **P3** — Reduzir a janela para 375px de largura.
      _Como:_ Com o DevTools aberto, ligar o modo dispositivo (`Ctrl+Shift+M`) e escolher
      um preset de 375px de largura, como **iPhone SE**. 375px é a largura de celular mais
      estreita que interessa. Depois rolar a página inteira até o rodapé procurando barra de
      rolagem **horizontal** — ela é o defeito; a vertical é normal.
      _Esperado:_ sem scroll horizontal; CTAs alcançáveis. Este é um dos itens que o
      [`STATE.md`](../STATE.md) marca como pendente de conferência visual.
- [ ] **P4** — Clicar em **Entrar**.
      _Como:_ A palavra **Entrar** aparece em três lugares da landing (no topo, no bloco
      principal e no rodapé) e as três levam ao mesmo lugar — use a do topo. Ao lado dela há
      **Criar conta**, que leva a outro destino; não é esta. Conferir o endereço na barra
      depois do clique.
      _Esperado:_ vai para `/login`; formulário visível e com foco utilizável.

**Resultado final esperado**

- [ ] Landing e login renderizam sem token e sem chamada autenticada
      _Como:_ Na tela de login, conferir que existem os campos **E-mail** e **Senha** e o
      botão **Entrar**. Não preencher nada: esta jornada termina aqui, e o login em si é a
      [`J-011.W`](#j-011w---login-com-mfa-totp).

---

### J-002.W-N1 - Visitante tenta área autenticada

| Campo | Valor |
|---|---|
| ID | `J-002.W-N1` |
| Tipo | Negativa — controle de acesso |
| Persona | Visitante (sem token) |
| Superfície | Web |
| Vetor | Acesso por URL direta sem sessão |
| Comportamento seguro esperado | Redireciono para `/login` sem vazar dado |
| Pré-condições | `PRE-01` `PRE-02` `PRE-04` |
| Só o manual cobre | **Negação de rota por URL direta** — item pendente no `STATE.md` |

**Passos**

- [ ] **P1** — Sem sessão, abrir `/app/dashboard` direto na barra de endereços.
      _Como:_ Em aba anônima (`Ctrl+Shift+N`), colar
      `http://localhost:4200/app/dashboard` na barra. O ponto do teste é **não** passar pela
      tela de login: é a tentativa de entrar pela URL, que é como um atacante faria. Olhar a
      tela com atenção no instante do carregamento — o defeito seria o dashboard piscar antes
      do redirecionamento, vazando dado por um segundo.
      _Esperado:_ redireciona para `/login`. Nenhum dado do dashboard aparece antes.
- [ ] **P2** — Repetir para `/app/admin/users`.
      _Como:_ Mesma aba anônima, trocando só o endereço. Continuar sem fazer login entre um
      passo e outro.
      _Esperado:_ `/login`.
- [ ] **P3** — Repetir para `/app/pix/chaves`.
      _Esperado:_ `/login`.
- [ ] **P4** — Repetir para `/app/credora`.
      _Esperado:_ `/login`.
- [ ] **P5** — Abrir `/design-system`.
      _Como:_ **Aqui o comportamento é o oposto dos anteriores**: esta rota carrega mesmo sem
      login, e isso é decisão de projeto, não falha. O que você verifica é o conteúdo: a
      página deve mostrar só amostras de componentes e cores. Se aparecer nome de cliente,
      valor de contrato ou qualquer dado de verdade, aí sim é ocorrência.
      _Esperado:_ **carrega sem sessão** — a rota não tem guard, por decisão. Registrar se
      expõe qualquer dado real; deve exibir apenas componentes e tokens.

**Resultado final esperado**

- [ ] Nenhuma rota `/app/**` renderiza conteúdo sem sessão

---

### J-002.M-N1 - Visitante tenta área autenticada (mobile)

| Campo | Valor |
|---|---|
| ID | `J-002.M-N1` |
| Tipo | Negativa — controle de acesso |
| Persona | Visitante |
| Superfície | Mobile `http://localhost:8100` |
| Comportamento seguro esperado | Redireciono para `/welcome` (não `/login`) |
| Pré-condições | `PRE-01` `PRE-03` `PRE-04` |
| Automação equivalente | [`smoke.spec.ts`](../../../sep-mobile/e2e/smoke.spec.ts) (parcial) |

**Passos**

- [ ] **P1** — Sem sessão, abrir `/app/inicio`.
      _Como:_ Em aba anônima, com a emulação de dispositivo ligada (`Ctrl+Shift+M`), colar
      `http://localhost:8100/app/inicio`. Repare que a porta é **8100** (mobile), não 4200.
      _Esperado:_ redireciona para `/welcome`. Note a diferença em relação ao web, que vai
      para `/login`.
- [ ] **P2** — Repetir para `/app/propostas` e `/app/parcelas`.
      _Como:_ Mesmos endereços com `/app/propostas` e depois `/app/parcelas`. A diferença de
      destino em relação ao web (`/welcome` em vez de `/login`) é proposital: no mobile o
      visitante cai na tela de boas-vindas, que oferece **Entrar** e **Criar conta**.
      _Esperado:_ `/welcome` nos dois casos.

---

### J-003.W - Visitante tenta se cadastrar pelo web (canalização)

| Campo | Valor |
|---|---|
| ID | `J-003.W` |
| Tipo | Positiva — verifica canalização, **não** cadastro |
| Persona | Visitante |
| Superfície | Web |
| Pré-condições | `PRE-01` `PRE-02` `PRE-04` |
| Nota | O cadastro real **só existe no mobile** ([`J-003.M`](#j-003m---visitante-cria-conta-de-cliente)). No web, `/register` e tela estática de canalização. |
| Automação equivalente | [`golden-path.spec.ts`](../../../sep-app/e2e/golden-path.spec.ts) |

**Passos**

- [ ] **P1** — Abrir `/register` sem token.
      _Como:_ Em aba anônima, abrir `http://localhost:4200/register`. Você chega aqui também
      clicando em **Criar conta** na landing. A tela se chama **Como cadastrar sua conta** e
      explica três caminhos (tomador pelo app, credora por convite, interno pelo admin). O
      único elemento clicável é o link **Já tenho conta — fazer login**.
      _Esperado:_ tela de canalização ("tomador baixa o app; credora entra por convite;
      interno é criado pelo admin"). **Nenhum** campo de senha, nenhum formulário de cadastro.
- [ ] **P2** — Inspecionar a rede durante a visita.
      _Como:_ Com o DevTools na aba **Network**, recarregar a página. Como esta tela é
      estática, não pode haver nenhuma chamada à API — filtrar por `api` e confirmar lista
      vazia.
      _Esperado:_ nenhum `POST /api/v1/usuarios`, nenhuma chamada autenticada.

**Resultado final esperado**

- [ ] Não existe caminho de cadastro pelo web — a jornada "cadastro cliente pelo web" não e
      executável por decisão de produto, não por defeito

---

### J-003.M - Visitante cria conta de cliente

| Campo | Valor |
|---|---|
| ID | `J-003.M` |
| Tipo | Positiva |
| Persona | Visitante |
| Superfície | Mobile |
| Pré-condições | `PRE-01` `PRE-03` `PRE-04` |
| Endpoints tocados | `POST /api/v1/usuarios` |
| Duração | 5 min |
| Automação equivalente | [`golden-path-mobile.spec.ts`](../../../sep-mobile/e2e/golden-path-mobile.spec.ts) — **vermelha hoje** |
| Só o manual cobre | Política de senha real do backend (o mock aceita `123456`) |

**Passos**

#### Tela `/welcome` → `/register`

- [ ] **P1** — Abrir `/welcome` e tocar na ação de criar conta.
      _Como:_ Em `http://localhost:8100/welcome`, com a emulação de dispositivo ligada. A
      tela tem dois botões: **Entrar** e **Criar conta** — usar o segundo. Ao contrário do
      web, aqui existe formulário de verdade.
      _Esperado:_ vai para `/register` com formulário real.
- [ ] **P2** — Informar um e-mail único desta execução e a senha `123456`.
      _Como:_ Usar um e-mail que ninguém tenha usado ainda, com a data para não repetir — por
      exemplo `cadastro-2026-07-21@sep.test`. **Anote esse e-mail**: a jornada
      [`J-010.M`](#j-010m---cadastro--login--sair) faz login com ele. No campo **Senha**,
      digitar `123456` de propósito e enviar. A recusa é o resultado correto.
      _Esperado:_ **recusado**. Política real é 12+ chars ou passphrase de 4+ palavras. Se
      passar, a superfície está em MSW — voltar e conferir `PRE-04`.
- [ ] **P3** — Informar a senha `jornada-cadastro-sep-2026` e enviar.
      _Como:_ Trocar só o campo **Senha**, mantendo o mesmo e-mail do P2. Anotar essa senha
      junto do e-mail.
      _Esperado:_ `201`; conta criada como `CLIENTE`.
- [ ] **P4** — Repetir o cadastro com o **mesmo** e-mail.
      _Como:_ Voltar para `/register` e enviar de novo com o e-mail do P2. O que se verifica
      aqui é a **qualidade da mensagem**: tem de ser um aviso compreensível de e-mail já
      cadastrado. Se aparecer código de erro cru, stack trace ou tela em branco, é ocorrência.
      _Esperado:_ erro amigável de e-mail duplicado; sem stack trace na tela.
- [ ] **P5** — Conferir no banco que a role não escalou:
      _Como:_ **Faça o P3 escolhendo "Administrador" no seletor Perfil** — o formulário
      oferece essa opção, e é justamente por isso que este passo existe. O backend ignora o
      campo e cria `CLIENTE` de qualquer jeito. Se a consulta abaixo devolver `ADMIN`, é uma
      escalada de privilégio e a ocorrência é grave. Rodar no terminal do banco.
      ```bash
      docker exec sep-postgres psql -U sep -d sep_dev \
        -c "SELECT username, role FROM usuario ORDER BY data_evento DESC LIMIT 1;"
      ```
      _Esperado:_ `role = CLIENTE`. O cadastro público não cria ADMIN em nenhuma hipótese.

---

### J-010.M - Cadastro + login + sair

| Campo | Valor |
|---|---|
| ID | `J-010.M` |
| Tipo | Positiva |
| Persona | Conta criada em [`J-003.M`](#j-003m---visitante-cria-conta-de-cliente) |
| Superfície | Mobile |
| Pré-condições | `PRE-01` `PRE-03` `PRE-04` + `J-003.M` concluída |
| Endpoints tocados | `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` |
| Duração | 5 min |
| Automação equivalente | [`golden-path-mobile.spec.ts`](../../../sep-mobile/e2e/golden-path-mobile.spec.ts) — **vermelha hoje** |
| Só o manual cobre | O caminho completo contra `:8080` real, que e exatamente o que a spec vermelha tenta fazer |

**Passos**

- [ ] **P1** — Em `/login`, autenticar com as credenciais de `J-003.M`.
      _Como:_ São o e-mail e a senha que você anotou no P2/P3 da
      [`J-003.M`](#j-003m---visitante-cria-conta-de-cliente) — não são as personas do
      ROTEIRO-00. Em `http://localhost:8100/login`, campos **E-mail** e **Senha**, botão
      **Entrar**.
      _Esperado:_ entra em `/app/inicio`; `mfaRequired = false` (conta nova não tem TOTP).
- [ ] **P2** — Observar a barra de tabs.
      _Como:_ A barra fica no rodapé da tela. Contar as abas: devem ser quatro. O teste aqui
      é de **ausência** — as abas Credora e Admin não podem aparecer para esta persona.
      _Esperado:_ Início, Propostas, Parcelas e Perfil. **Sem** aba Credora (a persona não
      tem credora) e **sem** aba Admin.
- [ ] **P3** — Abrir **Perfil**.
      _Como:_ Tocar na aba **Perfil** (rota `/app/perfil` no mobile — note que no web é
      `/app/profile`). Conferir que o e-mail exibido no card **Identificação** é o mesmo com
      que você entrou.
      _Esperado:_ e-mail e perfil batem com `/auth/me`.
- [ ] **P4** — Sair pela ação de logout.
      _Como:_ Há dois botões **Sair**: um no topo da tela e outro no fim da tela de perfil.
      Qualquer um serve.
      _Esperado:_ volta para `/welcome`; sessão limpa.
- [ ] **P5** — Acionar o **voltar do navegador**.
      _Como:_ Logo após sair, apertar a seta de voltar do navegador (ou `Alt+←`). A tentação
      do navegador é remontar a última página, que era a área logada — e é exatamente isso
      que não pode acontecer. Se a tela logada reaparecer, mesmo que por um instante, é
      ocorrência.
      _Esperado:_ **não** retorna para a área logada. O `redirectAuthenticatedGuard` foi
      criado para esse caso na M-13 — o gatilho original era o botão físico do Android, mas o
      guard é o mesmo no PWA.
- [ ] **P6** — Abrir `/app/inicio` por URL direta após o logout.
      _Como:_ Colar `http://localhost:8100/app/inicio` na barra. É a mesma verificação da
      [`J-002.M-N1`](#j-002m-n1---visitante-tenta-área-autenticada-mobile), agora depois de
      uma sessão que existiu — o que prova que o logout limpou mesmo o token.
      _Esperado:_ `/welcome`.

**Resultado final esperado**

- [ ] Ciclo cadastro → login → sair fecha sem residuo de sessão
- [ ] Se todos os passos passarem, vale reavaliar por que a `golden-path-mobile.spec.ts`
      segue vermelha — o roteiro manual e a referência para o diagnóstico

---

### J-011.W - Login com MFA TOTP

| Campo | Valor |
|---|---|
| ID | `J-011.W` |
| Tipo | Positiva |
| Persona | `cliente-a` — CLIENTE com TOTP habilitado |
| Superfície | Web |
| Pré-condições | `PRE-01` `PRE-02` `PRE-04` `PRE-07` `PRE-10` |
| Endpoints tocados | `POST /auth/login`, `POST /auth/totp/verify` |
| Duração | 5 min |
| Automação equivalente | nenhuma — a suite mocka o desafio |
| Só o manual cobre | **TOTP real** — item pendente no `STATE.md` |

**Passos**

- [ ] **P1** — Em `/login`, informar e-mail e senha corretos de `cliente-a`.
      _Como:_ `cliente-a@sep.test` / `jornada-tomador-sep-2026` (tabela do §6.1 do
      [`ROTEIRO-00`](./ROTEIRO-00-AMBIENTE-E-MASSA.md)). Como esta persona tem TOTP, o login
      **não entra direto**: cai numa segunda tela, **Verificação em duas etapas**. Manter o
      DevTools aberto na aba **Network** desde já — o P2 depende de ver a resposta desta
      chamada.
      _Esperado:_ resposta com `mfaRequired: true` e `mfaChallengeId`; **`accessToken` vem
      `null`**. Vai para `/login/verify-totp`.
- [ ] **P2** — Conferir na aba de rede que nenhuma sessão completa foi emitida.
      _Como:_ Na aba **Network**, clicar na chamada `login` e abrir a aba **Response**. O
      ponto é o campo `accessToken`: ele tem de vir `null`. Se vier preenchido, a senha
      sozinha já teria dado acesso e o segundo fator seria decorativo — ocorrência grave.
      _Esperado:_ senha válida **sozinha** não autentica.
- [ ] **P3** — Informar um código TOTP **incorreto**.
      _Como:_ No campo **Código**, digitar seis dígitos quaisquer (`000000` serve) e clicar em
      **Verificar**. Erro é o resultado esperado. **Não repita mais de duas vezes**: tentativas
      inválidas contam para o lockout (§6.4 do ROTEIRO-00) e podem travar a persona por 30
      minutos no meio do roteiro.
      _Esperado:_ erro; permanece na tela; não autentica.
- [ ] **P4** — Informar o código TOTP corrente do autenticador.
      _Como:_ Ler o código de 6 dígitos **da conta `cliente-a`** no autenticador — se você
      cadastrou mais de uma conta, confira o nome antes. Como o código muda a cada 30
      segundos, se ele estiver quase virando, espere o próximo para ter tempo de digitar.
      _Esperado:_ login conclui; entra em `/app/dashboard`.
- [ ] **P5** — Conferir o menu lateral.
      _Como:_ De novo um teste de **ausência**. O menu deve mostrar os grupos **Jornadas** e
      **Conta**. Não pode haver **Operação** (com Backoffice, Pix, Chaves Pix, Matching de
      credoras) nem **Administração** — são de perfis internos, e `cliente-a` é cliente.
      _Esperado:_ grupos Jornadas e Conta. **Sem** grupo Operação (Backoffice, Pix, Chaves
      Pix, Matching) e **sem** Administração — `cliente-a` é CLIENTE.

---

### J-012.W-N1 - Login inválido até o lockout

| Campo | Valor |
|---|---|
| ID | `J-012.W-N1` |
| Tipo | Negativa — resistência a força bruta |
| Persona | `cliente-b` |
| Superfície | Web |
| Vetor | Tentativas repetidas de senha inválida |
| Comportamento seguro esperado | Bloqueio após 5 tentativas; erro que não revela se o usuário existe |
| Pré-condições | `PRE-01` `PRE-02` `PRE-04` `PRE-09` |
| Política | 5 tentativas / janela de 15 min / bloqueio de 30 min |

> **Esta jornada bloqueia a persona por 30 minutos.** Execute-a por último na sessão, ou
> tenha o procedimento de destravamento do [`ROTEIRO-00`](./ROTEIRO-00-AMBIENTE-E-MASSA.md)
> §7 **D2** a mão.

**Passos**

- [ ] **P1** — Tentar login com e-mail **inexistente**.
      _Como:_ Usar algo que certamente não existe, como `naoexiste@sep.test`, com qualquer
      senha. O que se verifica é a **mensagem**: ela não pode dizer "usuário não encontrado".
      Se dissesse, um atacante descobriria quais e-mails têm conta só testando a tela.
      Compare mentalmente com a mensagem que vai aparecer no P2 — têm de ser iguais.
      _Esperado:_ erro genérico. **Não** revela que o usuário não existe.
- [ ] **P2** — Tentar login de `cliente-b` com senha inválida, 4 vezes.
      _Como:_ `cliente-b@sep.test` com uma senha errada qualquer, **exatamente 4 vezes** —
      contar. A quinta é o passo seguinte, e é ela que dispara o bloqueio. A mensagem tem de
      ser a mesma do P1: o sistema não distingue "usuário não existe" de "senha errada".
      _Esperado:_ mesmo erro genérico a cada tentativa.
- [ ] **P3** — Quinta tentativa inválida.
      _Como:_ Mais uma vez com senha errada. Agora a tela muda: em vez do erro no formulário,
      o navegador vai para uma página própria, **Conta bloqueada temporariamente**, com o
      número `423` em destaque. Esse 423 é o código HTTP de "recurso trancado".
      _Esperado:_ conta bloqueada; o web navega para `/account-locked` (o `error.interceptor`
      trata o HTTP **423**).
- [ ] **P4** — Tentar login com a senha **correta** durante o bloqueio.
      _Como:_ Voltar ao login e entrar com `cliente-b@sep.test` /
      `jornada-ownership-sep-2026` — a senha certa desta vez. Continuar bloqueado é o
      comportamento correto: se a senha certa destravasse, bastaria o atacante acertar para
      anular o bloqueio.
      _Esperado:_ continua bloqueado. A senha certa não destrava antes do prazo.
- [ ] **P5** — Conferir o audit log:
      _Como:_ Terminal do banco. Procurar na saída os eventos das tentativas e do bloqueio
      que você acabou de provocar. Tentativa de invasão sem trilha registrada é defeito de
      compliance, não detalhe. Terminada a jornada, `cliente-b` fica travado por 30 minutos —
      para destravar antes, o **D2** do [`ROTEIRO-00`](./ROTEIRO-00-AMBIENTE-E-MASSA.md) §7.
      ```bash
      docker exec sep-postgres psql -U sep -d sep_dev \
        -c "SELECT tipo, data_evento FROM audit_log_seguranca ORDER BY data_evento DESC LIMIT 10;"
      ```
      _Esperado:_ tentativas e bloqueio registrados.

---

### J-020.W - Consultar o próprio perfil

| Campo | Valor |
|---|---|
| ID | `J-020.W` |
| Tipo | Positiva |
| Persona | `cliente-a` |
| Superfície | Web |
| Pré-condições | `PRE-01` `PRE-02` `PRE-04` `PRE-07` |
| Endpoints tocados | `GET /auth/me` |
| Automação equivalente | [`golden-path.spec.ts`](../../../sep-app/e2e/golden-path.spec.ts) |

**Passos**

- [ ] **P1** — Autenticado, abrir **Meu perfil** (`/app/profile`).
      _Como:_ Logado como `cliente-a`, abrir o menu lateral, grupo **Conta**, item **Meu
      perfil**. A tela tem dois cards: **Identificação** (E-mail, Perfil, ID) e **Auditoria**
      (Criado em, Modificado em, Criado por, Modificado por).
      _Esperado:_ e-mail, perfil, identificador e dados de auditoria batem com `/auth/me`.
- [ ] **P2** — Recarregar a página.
      _Como:_ `F5`. O ponto é que a sessão sobreviva ao recarregamento: se a tela devolver
      você ao login, o token não está sendo persistido corretamente.
      _Esperado:_ dados reaparecem sem sair da tela e sem novo login.
- [ ] **P3** — Conferir na aba de rede quais endpoints a tela chama.
      _Como:_ Na aba **Network**, filtrar por `api` e recarregar. Ler a lista de chamadas: a
      tela deve buscar só o próprio usuário. Se aparecer uma chamada que **lista** usuários
      (`/api/v1/usuarios` sem id), a tela estaria pedindo dados de todo mundo para mostrar os
      seus — vazamento potencial, e ocorrência.
      _Esperado:_ apenas endpoints de perfil próprio. **Nenhuma** chamada a endpoint
      administrativo (`/api/v1/usuarios` lista) para exibir o próprio perfil.

---

### J-022.W - Alterar senha com step-up

| Campo | Valor |
|---|---|
| ID | `J-022.W` |
| Tipo | Positiva |
| Persona | `cliente-a` — **com** TOTP habilitado |
| Superfície | Web |
| Pré-condições | `PRE-01` `PRE-02` `PRE-04` `PRE-07` `PRE-10` |
| Endpoints tocados | `POST /auth/step-up/initiate`, `POST /auth/step-up/complete`, `PATCH /usuarios/{id}/senha` |
| Step-up | `@RequireStepUp` legado — com MFA habilitado, **exige** token |
| Duração | 8 min |
| Automação equivalente | [`golden-path.spec.ts`](../../../sep-app/e2e/golden-path.spec.ts) |
| Só o manual cobre | TOTP real no desafio de step-up |

**Passos**

#### Tela `/app/profile/change-password`

- [ ] **P1** — Abrir **Alterar senha** e informar a senha atual **incorreta** e uma nova senha válida.
      _Como:_ Em **Meu perfil**, clicar em **Alterar senha**. A tela tem três campos: **Senha
      atual**, **Nova senha** e **Confirme a nova senha**. Aqui, errar a senha atual de
      propósito e preencher as outras duas com `jornada-tomador-sep-2026-v2`. Clicar em
      **Salvar nova senha**. Repare que você **continua logado** depois do erro — errar a
      senha atual não pode derrubar a sessão.
      _Esperado:_ erro de validação; a sessão **não** é derrubada; a senha não muda.
- [ ] **P2** — Informar a senha atual correta e a nova senha `123456`.
      _Como:_ Agora com `jornada-tomador-sep-2026` no campo **Senha atual**, e `123456` nos
      dois campos de nova senha. A própria tela avisa a regra abaixo do campo: mínimo 12
      caracteres ou passphrase de 4+ palavras. Se `123456` for aceito, a superfície está em
      MSW — conferir `PRE-04`.
      _Esperado:_ recusado pela política (12+ chars ou passphrase 4+ palavras).
- [ ] **P3** — Informar a senha atual correta e a nova senha `jornada-tomador-sep-2026-v2`.
      _Como:_ Preencher os três campos corretamente e enviar. **A senha ainda não mudou
      neste ponto** — a tela leva você para uma etapa de confirmação adicional, que é o
      step-up. É exatamente isso que a jornada testa: operação sensível não se completa só
      com a sessão.
      _Esperado:_ vai para o desafio de step-up (`/app/step-up`); a senha ainda **não** mudou.
- [ ] **P4** — Informar o código TOTP corrente.
      _Como:_ A tela **Confirmação adicional** tem um botão **Iniciar**; depois dele aparece o
      campo **Código TOTP ou backup code**. Digitar o código da conta `cliente-a` e clicar em
      **Confirmar**. Guarde um backup code para a `J-031.W` — aqui use o TOTP mesmo.
      _Esperado:_ volta para a tela de origem preservando o contexto.
- [ ] **P5** — Confirmar a alteração.
      _Como:_ De volta à tela de senha, os campos devem estar preservados; confirmar. Com o
      DevTools na aba **Network**, clicar na chamada `senha` e conferir na aba **Headers** que
      existe um header `X-Step-Up-Token`. É esse header que carrega a prova do step-up.
      _Esperado:_ `PATCH /usuarios/{id}/senha` sai com o header `X-Step-Up-Token`; sucesso.
- [ ] **P6** — Sair e autenticar com a senha **antiga**.
      _Como:_ **Sair** (botão no topo direito) e tentar entrar com `jornada-tomador-sep-2026`.
      Falhar é o esperado. **No máximo duas tentativas** — o lockout conta.
      _Esperado:_ falha.
- [ ] **P7** — Autenticar com a senha **nova**.
      _Como:_ Entrar com `jornada-tomador-sep-2026-v2` e o código TOTP.
      _Esperado:_ sucesso (com o desafio TOTP normal do login).
- [ ] **P8** — Conferir o audit log.
      _Como:_ Terminal do banco, mesma consulta do audit log usada antes.
      ```bash
      docker exec sep-postgres psql -U sep -d sep_dev \
        -c "SELECT tipo, data_evento FROM audit_log_seguranca ORDER BY data_evento DESC LIMIT 5;"
      ```
      _Esperado:_ evento de senha alterada registrado.

**Resultado final esperado**

- [ ] Senha alterada exatamente uma vez
- [ ] Atualizar a senha de `cliente-a` na sua folha de credenciais desta execução
      _Como:_ **A partir daqui a senha de `cliente-a` é `jornada-tomador-sep-2026-v2`**, e não
      mais a da tabela do ROTEIRO-00. Anotar isso no seu rascunho da execução: as jornadas
      seguintes vão pedir "a senha de `cliente-a`" e é esta a valer.

---

### J-022.W-N1 - Alterar senha sem MFA usa o bypass legado

| Campo | Valor |
|---|---|
| ID | `J-022.W-N1` |
| Tipo | Positiva — documenta comportamento deliberado |
| Jornada pai | [`J-022.W`](#j-022w---alterar-senha-com-step-up) |
| Persona | `cliente-b` — **sem** TOTP |
| Superfície | Web |
| Pré-condições | `PRE-01` `PRE-02` `PRE-04` `PRE-09` |
| Nota | `@RequireStepUp` **legado** faz bypass quando o usuário não tem MFA — compatibilidade com usuários pré-MFA. Isto **não** vale para `@RequireStepUpEstrito` (ver [`ROTEIRO-04`](./ROTEIRO-04-CREDITO-FORMALIZACAO.md)). |

**Passos**

- [ ] **P1** — Como `cliente-b`, alterar a senha informando a senha atual correta.
      _Como:_ Entrar como `cliente-b@sep.test` / `jornada-ownership-sep-2026` e repetir o
      caminho da [`J-022.W`](#j-022w---alterar-senha-com-step-up): **Meu perfil** > **Alterar
      senha**, senha atual correta e nova senha `jornada-ownership-sep-2026-v2`. **Se
      `cliente-b` ainda estiver bloqueado** pela `J-012.W-N1`, destravar pelo **D2** do
      ROTEIRO-00 ou esperar os 30 minutos. A diferença para a J-022.W é o que **não**
      acontece: não aparece tela de confirmação adicional. Anotar a senha nova.
      _Esperado:_ conclui **sem** desafio de step-up. Este é o comportamento esperado, não um
      defeito.
- [ ] **P2** — Conferir que o mesmo bypass **não** existe nas operações financeiras.
      _Como:_ Este passo **não se executa aqui** — ele é uma anotação de rastreio. A prova
      está na [`J-070.W-N1`](./ROTEIRO-04-CREDITO-FORMALIZACAO.md#j-070w-n1---aceite-negado-para-usuário-sem-mfa)
      do ROTEIRO-04. Marcar quando aquela jornada tiver sido executada; se você ainda não
      chegou lá, deixar em branco e voltar depois.
      _Esperado:_ coberto por [`ROTEIRO-04`](./ROTEIRO-04-CREDITO-FORMALIZACAO.md) — sem MFA,
      o aceite de contrato retorna 403.

---

### J-030.W - Habilitar MFA TOTP

| Campo | Valor |
|---|---|
| ID | `J-030.W` |
| Tipo | Positiva |
| Persona | Qualquer usuário sem TOTP |
| Superfície | Web — **o enrollment só existe aqui**; o mobile apenas verifica |
| Pré-condições | `PRE-01` `PRE-02` `PRE-04` `PRE-10` |
| Endpoints tocados | `POST /auth/totp/setup`, `POST /auth/totp/confirm` |
| Automação equivalente | nenhuma |
| Só o manual cobre | QR real, autenticador real, backup codes exibidos uma única vez |

**Passos**

> **Use `backoffice@sep.test` nesta jornada.** `cliente-a` e `financeiro` já habilitaram TOTP
> no §6.2 do ROTEIRO-00, e `cliente-b` **precisa continuar sem MFA** — ele é a persona das
> negativas de step-up estrito. Sobra o `backoffice`, que não usa MFA em nenhuma outra
> jornada. Os backup codes gerados aqui são os que a `J-031.W` consome.

- [ ] **P1** — Abrir `/app/profile/setup-totp`.
      _Como:_ Entrar como `backoffice@sep.test` / `roteiro-manual-sep-2026` e digitar
      `http://localhost:4200/app/profile/setup-totp` na barra — **não há link para esta tela
      no menu**. Clicar em **Iniciar setup**: o QR só aparece depois disso.
      _Esperado:_ QR code e secret em texto.
- [ ] **P2** — Escanear no autenticador e confirmar com um código **incorreto**.
      _Como:_ Escanear o QR primeiro (o autenticador passa a mostrar códigos), mas no campo
      **Código TOTP** digitar `000000` e clicar em **Confirmar e ativar MFA**. A recusa é o
      resultado certo: o QR ter sido escaneado não basta, o sistema precisa da prova de que
      você tem o autenticador agora.
      _Esperado:_ recusado; MFA **não** é habilitado.
- [ ] **P3** — Confirmar com o código corrente.
      _Como:_ Agora com o código real de 6 dígitos da conta `backoffice`. Ao dar certo,
      aparecem os backup codes — **copiar todos antes de sair da tela** e guardar no rascunho
      da execução. Eles são o insumo da `J-031.W`.
      _Esperado:_ MFA habilitado; backup codes exibidos.
- [ ] **P4** — Recarregar a tela.
      _Como:_ `F5`. Os códigos não podem reaparecer — a exibição é única, e é por isso que o
      P3 mandou copiar. Se reaparecerem, é ocorrência: significa que estão recuperáveis por
      quem tiver acesso à sessão.
      _Esperado:_ os backup codes **não** aparecem de novo. Exibição única.
- [ ] **P5** — Sair e autenticar novamente.
      _Como:_ **Sair** e entrar de novo como `backoffice`. Agora o login pede o código, o que
      antes não acontecia — é a confirmação de que o MFA passou a valer.
      _Esperado:_ o login agora exige TOTP.
- [ ] **P6** — Conferir no banco:
      _Como:_ Terminal do banco. O comando já está com o usuário desta jornada preenchido.
      ```bash
      docker exec sep-postgres psql -U sep -d sep_dev \
        -c "SELECT username, mfa_habilitado FROM usuario WHERE username = 'backoffice@sep.test';"
      ```
      _Esperado:_ `mfa_habilitado = t`.

---

### J-031.W - Usar backup code e tentar reusar

| Campo | Valor |
|---|---|
| ID | `J-031.W` |
| Tipo | Positiva + negativa de reuso |
| Persona | Usuário com MFA habilitado e backup codes guardados |
| Superfície | Web |
| Pré-condições | `PRE-01` `PRE-02` `PRE-04` `PRE-07` + backup codes de `J-030.W` |
| Automação equivalente | nenhuma |

**Passos**

- [ ] **P1** — No desafio MFA do login, informar um backup code válido.
      _Como:_ Entrar como `backoffice@sep.test` (a persona que habilitou MFA na
      [`J-030.W`](#j-030w---habilitar-mfa-totp)). Na tela **Verificação em duas etapas**, em
      vez do código do autenticador, digitar um dos **backup codes** guardados. O campo aceita
      os dois formatos. **Anote qual código você usou** — o P2 depende disso.
      _Esperado:_ autentica.
- [ ] **P2** — Sair e tentar o **mesmo** backup code de novo.
      _Como:_ **Riscar do rascunho o código usado no P1** — ele morreu ali. Sair, voltar ao
      login e informar exatamente aquele mesmo código. A recusa é o ponto da jornada: se ele
      funcionasse duas vezes, quem interceptasse o código uma vez teria acesso permanente.
      _Esperado:_ **recusado**. Backup code é de uso único.
- [ ] **P3** — Autenticar com um segundo backup code, ainda não usado.
      _Como:_ Pegar outro código da lista guardada na `J-030.W`, ainda não riscado. Riscar
      este também depois de usar. Sobrando códigos, guarde-os: são a saída se o autenticador
      se perder no meio da execução.
      _Esperado:_ autentica.
- [ ] **P4** — Conferir o audit log.
      _Como:_ Terminal do banco, mesma consulta de audit log das jornadas anteriores. Procurar
      os eventos referentes aos dois backup codes usados agora.
      ```bash
      docker exec sep-postgres psql -U sep -d sep_dev \
        -c "SELECT tipo, data_evento FROM audit_log_seguranca ORDER BY data_evento DESC LIMIT 10;"
      ```
      _Esperado:_ uso de backup code registrado.

---

### J-033.W - Token de step-up e de uso único

| Campo | Valor |
|---|---|
| ID | `J-033.W` |
| Tipo | Negativa — reuso de credencial |
| Persona | `cliente-a` |
| Superfície | Web + API |
| Vetor | Reaproveitar o mesmo `X-Step-Up-Token` em duas mutações |
| Comportamento seguro esperado | Segunda chamada negada; token consumido na primeira |
| Pré-condições | `PRE-01` `PRE-04` `PRE-07` `PRE-10` |
| Política | Token de 32 bytes, TTL 5 min, **uso único**, guardado como SHA-256 |
| Automação equivalente | nenhuma — a suite mocka o step-up |
| Só o manual cobre | O ciclo real de emissão, consumo e expiração |

**Passos**

> **Esta jornada é pelo Insomnia, não pela tela.** O objetivo é manipular o token na mão —
> algo que a interface não deixa fazer, porque ela sempre pede um token novo.

- [ ] **P1** — Autenticado como `cliente-a`, chamar `POST /api/v1/auth/step-up/initiate`.
      _Como:_ Antes, fazer login como `cliente-a` pelo request de login do Insomnia (senha
      `jornada-tomador-sep-2026-v2`, se você já executou a `J-022.W`) e guardar o
      `accessToken` em `clienteAccessToken`. Depois, pasta **Auth**, request de
      `step-up/initiate`, **Send**. Copiar o `stepUpChallengeId` da resposta para a variável
      de mesmo nome.
      _Esperado:_ `stepUpChallengeId`.
- [ ] **P2** — Chamar `POST /api/v1/auth/step-up/complete` com o desafio e o TOTP corrente.
      _Como:_ No body, o `stepUpChallengeId` do P1 e o código de 6 dígitos do autenticador
      (conta `cliente-a`). Copiar o token da resposta para `stepUpToken`. **A partir daqui
      você tem 5 minutos** — o P3 e o P4 precisam acontecer dentro dessa janela.
      _Esperado:_ token de step-up no corpo. Guardar.
- [ ] **P3** — Usar o token em `PATCH /api/v1/usuarios/{id}/senha`.
      _Como:_ No request de troca de senha, aba **Headers**, conferir que existe
      `X-Step-Up-Token` com o valor do P2. No body, a senha atual e uma nova
      (`jornada-tomador-sep-2026-v3`). **Anotar a senha nova** — ela passa a valer.
      _Esperado:_ sucesso.
- [ ] **P4** — Repetir a **mesma** chamada com o **mesmo** token.
      _Como:_ Clicar em **Send** de novo, sem mudar nada. Como a senha atual agora é outra, o
      request está errado por dois motivos — mas o que importa é **qual erro vem**: tem de ser
      403 por token consumido. Este é o coração da jornada: o token vale para **uma** operação.
      _Esperado:_ **403**. Token já consumido.
- [ ] **P5** — Emitir um token novo, aguardar **mais de 5 minutos** e usá-lo.
      _Como:_ Repetir P1 e P2 para obter um token novo, **anotar o horário** e ir fazer outra
      coisa por 6 minutos (dá para adiantar outra jornada e voltar). Depois, enviar o request
      do P3 com esse token. Não tem atalho: o tempo é a variável testada.
      _Esperado:_ **403** por expiração.
- [ ] **P6** — Conferir o corpo dos 403 de P4 e P5.
      _Como:_ Ler o corpo das duas respostas 403 no painel do Insomnia. O que se procura é o
      que **não** pode estar lá: id de usuário, nome de classe Java, caminho de arquivo,
      stack trace, ou explicação do tipo "token expirado em tal horário". Mensagem detalhada
      demais ensina o atacante a ajustar o ataque.
      _Esperado:_ mensagem genérica ("Acesso negado"), **sem** UUID, stack trace ou detalhe
      interno.

---

### J-045.M - Usuário FINANCEIRO autentica no mobile

| Campo | Valor |
|---|---|
| ID | `J-045.M` |
| Tipo | Positiva — documenta **limitação conhecida** |
| Persona | `financeiro` — FINANCEIRO |
| Superfície | Mobile |
| Pré-condições | `PRE-01` `PRE-03` `PRE-04` `PRE-06` |
| Nota | O `sep-mobile` tipa `UsuarioRole` como `'ADMIN' \| 'CLIENTE'`. `FINANCEIRO` e `BACKOFFICE` autenticam, mas **nenhuma aba os lista**. Comportamento atual conhecido (Gate M-16.0), não defeito novo. |

**Passos**

- [ ] **P1** — Autenticar como `financeiro@sep.test` no mobile.
      _Como:_ Em `http://localhost:8100/login`, com emulação de dispositivo ligada. Senha
      `roteiro-manual-sep-2026`, e o código TOTP da conta `financeiro` (habilitado no §6.2 do
      ROTEIRO-00). O login funcionar já é o primeiro achado: o backend não impede o
      FINANCEIRO de entrar no app.
      _Esperado:_ login **conclui** — o backend aceita normalmente.
- [ ] **P2** — Observar a barra de tabs.
      _Como:_ Olhar o rodapé. Com `cliente-a` havia quatro abas; aqui a barra fica **vazia**,
      porque o app mobile só conhece os perfis Cliente e Administrador. Tirar um screenshot
      (`Ctrl+Shift+P` no DevTools > "Capture screenshot") e anexar à ocorrência, se registrar
      alguma. Isto é **limitação conhecida**, não defeito — marcar o passo normalmente.
      _Esperado:_ **vazia**. Capturar screenshot. Este é o comportamento atual documentado.
- [ ] **P3** — Abrir `/app/propostas` por URL direta.
      _Como:_ Colar `http://localhost:8100/app/propostas` na barra. **É aqui que a jornada
      separa limitação de defeito**: qualquer resposta clara serve (negar, mandar para
      `/welcome`, mostrar aviso). O que **não** pode é tela totalmente branca ou o endereço
      ficar trocando sozinho num ciclo — isso é bug e vira ocorrência.
      _Esperado:_ negado ou redirecionado. **Sem** tela em branco e **sem** loop de navegação.
- [ ] **P4** — Repetir **P1** a **P3** com `backoffice@sep.test`.
      _Como:_ Sair e refazer os três passos com `backoffice@sep.test` /
      `roteiro-manual-sep-2026`. Se você executou a [`J-030.W`](#j-030w---habilitar-mfa-totp),
      esta conta agora pede código TOTP no login.
      _Esperado:_ mesmo comportamento.

**Resultado final esperado**

- [ ] P2 confirma a limitação conhecida (esperado)
- [ ] P3 **não** pode resultar em tela branca ou loop — isso seria defeito, não limitação

> A distinção entre P2 e P3 é o ponto desta jornada: barra vazia é limitação aceita; tela
> branca ou loop de navegação é bug. Não registre os dois como "esperado".

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
| Jornadas `OK` | |
| Jornadas `NOK` | |
| Jornadas `BLOQUEADO` | |
| Observações | |
