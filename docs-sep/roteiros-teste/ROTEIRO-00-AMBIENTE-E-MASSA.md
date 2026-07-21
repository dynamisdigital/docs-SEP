# Roteiro 00 - Ambiente e massa de dados

> Pré-requisito de **todos** os demais roteiros. Nada aqui e jornada de usuário: e o
> preparo que faz as jornadas serem executáveis contra o backend real local.
> Hub: [`CENARIOS-TESTE-JORNADAS-USUARIO.md`](./CENARIOS-TESTE-JORNADAS-USUARIO.md).
>
> **Execute pelo [app](./app/index.html)**, não editando este arquivo — as caixas aqui ficam
> sempre vazias. Desvio não vira caixa marcada: vira **ocorrência** registrada no passo.

_Atualizado em: 2026-07-21._

## 1. Objetivo

Deixar o ambiente `v1.0-local` de pé (PostgreSQL em Docker + `sep-api` + `sep-app` +
`sep-mobile`, providers Fake) e criar a massa de dados mínima para executar as jornadas.

Ao final deste roteiro você tem: quatro usuários internos e dois clientes, um deles com
TOTP habilitado, e as pré-condições `PRE-01` a `PRE-10` satisfeitas.

**Tempo estimado**: 40 min na primeira vez; ~10 min nas seguintes.

## 2. O que você precisa antes de começar

- [ ] Docker e Docker Compose instalados e o daemon rodando
      _Como:_ No terminal, rodar `docker ps`. Se listar uma tabela (mesmo vazia), está tudo
      certo. Se disser "Cannot connect to the Docker daemon", o Docker está instalado mas não
      iniciado — abrir o Docker Desktop, ou no Linux `sudo systemctl start docker`.
- [ ] JDK 21 disponível (`java -version`)
      _Como:_ Rodar `java -version`. A primeira linha precisa começar com `21`. Se aparecer
      17, 11 ou "command not found", a API não sobe — instalar o JDK 21 antes de seguir.
- [ ] Node.js >= 22 (`node -v`) — exigido pelo CLI do Capacitor 8 ([ADR 0019](../../adr/0019-baseline-capacitor-8-mobile.md))
      _Como:_ Rodar `node -v`. Precisa ser `v22` ou maior. Versão menor faz o `npm start` do
      mobile falhar de um jeito difícil de diagnosticar — vale conferir agora.
- [ ] Um autenticador TOTP (Google Authenticator, Aegis, 1Password, Bitwarden — extensão de
      navegador serve). **Não há atalho**: o step-up estrito exige código válido
      _Como:_ Instalar um destes no celular ou como extensão do navegador. A extensão é mais
      prática, porque dá para copiar o código em vez de digitar olhando para o celular. Não dá
      para pular: várias jornadas param sem um código TOTP válido de verdade.
- [ ] **Insomnia** com a collection do projeto importada — ver §3.1
      _Como:_ Baixar em `insomnia.rest` e instalar. O Insomnia é o programa usado para chamar
      a API direto, sem passar pela tela — várias verificações do roteiro só existem lá. A
      importação da collection é o §3.1, logo abaixo.

## 3. Superfícies e portas

Todas as superfícies rodam **no navegador**. Testes em aparelho físico e APK Android estão
fora deste ciclo; os passos que dependem de hardware aparecem marcados como `N/A` nas
jornadas, com o critério de reativação.

| Superfície | URL | Repo | Comando |
|---|---|---|---|
| API | `http://localhost:8080` | `sep-api` | `./gradlew bootRun` |
| Web | `http://localhost:4200` | `sep-app` | `npm start` |
| Mobile (PWA no navegador) | `http://localhost:8100` | `sep-mobile` | `npm start` |
| Swagger | `http://localhost:8080/swagger-ui.html` | `sep-api` | (sobe com a API) |

O CORS do `sep-api` já libera `4200` e `8100`. Não e preciso configurar nada.

> **O mobile continua no roteiro.** Ele roda como PWA em `localhost:8100`, que e navegador.
> Isso importa porque o **cadastro de usuário só existe no mobile** — no web, `/register` e
> tela de canalização. Sem a superfície mobile não há como criar conta pela UI.

> **Atenção ao MSW.** Web e mobile podem rodar com mock (Mock Service Worker) em vez do
> backend real. Este roteiro exige backend real. Ver `PRE-04`.

### 3.1 Insomnia

As jornadas `.A` (API direta) referenciam a collection por **pasta > nome do request**. Não
há comando `curl` neste roteiro: importe a collection e use os requests que já existem.

- [ ] Importar [`sep-api.insomnia_collection.json`](../sep-api.insomnia_collection.json)
      _Como:_ O arquivo fica em `docs-SEP/docs-sep/`, um nível acima desta pasta. No Insomnia:
      **Application** > **Preferences** > **Data** > **Import Data** > **From File**, e
      escolher esse arquivo. Depois de importar, a barra lateral mostra as pastas — é por elas
      que os passos se referem aos requests, no formato `Insomnia > **Pasta** > nome do
      request`.
      _Esperado:_ 18 pastas e 150 requests. Há também uma
      [collection Postman](../sep-api.postman_collection.json) equivalente.
- [ ] Selecionar o environment e conferir `baseUrl = http://localhost:8080`
      _Como:_ No topo da barra lateral há um seletor de environment (costuma vir escrito "No
      Environment"). Selecionar o environment da collection e abrir para editar: `baseUrl`
      precisa estar como `http://localhost:8080`. As demais variáveis (`adminAccessToken`,
      `clienteId`...) estão **vazias de propósito** — você as preenche conforme os passos
      mandarem guardar valores.

Variáveis de environment que você vai preencher ao longo dos roteiros:

| Variável | Preenchida em |
|---|---|
| `adminAccessToken`, `adminId` | §5 deste roteiro |
| `financeiroAccessToken`, `financeiroId` | §5.4 |
| `clienteAccessToken`, `clienteId` | §6.1 |
| `stepUpChallengeId`, `stepUpToken` | Jornadas com step-up |
| `propostaCreditoId`, `contratoId`, `idEnvelopeExterno` | [`ROTEIRO-04`](./ROTEIRO-04-CREDITO-FORMALIZACAO.md) |
| `cpfTeste`, `cnpjTeste` | §6.3 — vazias na collection, por decisão (sem PII versionada) |

> As variáveis de token e ID nascem **vazias** de propósito: a collection e versionada e não
> pode carregar credencial nem PII. Preencher e parte do roteiro.

> **Nota editorial.** O restante do `docs-SEP` escreve sem acentuação, mas os roteiros de
> teste são a **exceção**: quem executa é gente que não conhece o sistema, e português sem
> acento cansa numa leitura de ~170 passos. Aqui se escreve em PT-BR correto. O parser e o
> app comparam marcadores sem acento (`semAcento()`), então acentuar um título de seção não
> quebra a geração — mas **acentuar o texto de um passo muda o hash dele** e marca "revise"
> para quem já executou. Ajuste texto de passo só quando for necessário mesmo.
>
> Os nomes de pasta e de request do Insomnia são citados **literalmente**
> (`Usuários`, `criar cliente público`) porque precisam bater com a busca da ferramenta.
> Não "corrigir" essas ocorrências.

## 4. Subir o ambiente

### 4.1 Banco de dados

- [ ] **A1** — No `sep-api`, subir o Postgres:
      _Como:_ Abrir um terminal na raiz do workspace — a pasta que contém `sep-api`,
      `sep-app` e `sep-mobile` — e rodar os dois comandos. O `-d` deixa o banco rodando em
      segundo plano, então o terminal volta a ficar livre. **Deixe este terminal aberto**:
      ele é o que você vai usar nos passos de SQL mais adiante.
      ```bash
      cd sep-api
      docker compose up -d postgres
      ```
      _Esperado:_ container `sep-postgres` em execução (`docker ps`), imagem
      `postgres:16-alpine`, porta `5432` publicada.
- [ ] **A2** — Conferir que o banco aceita conexão:
      _Como:_ Rodar no mesmo terminal. O comando pergunta ao Postgres se ele já está pronto
      para receber conexão. Subir o container leva alguns segundos: se a resposta for "no
      response", esperar 5 segundos e repetir antes de concluir que deu errado.
      ```bash
      docker exec sep-postgres pg_isready -U sep -d sep_dev
      ```
      _Esperado:_ `accepting connections`.

Parâmetros default (do [`docker-compose.yml`](../../../sep-api/docker-compose.yml), todos
sobrescrevíveis por `.env`): banco `sep_dev`, usuário `sep`, senha `sep`, porta `5432`,
timezone `America/Sao_Paulo`, volume nomeado `sep-postgres-data`.

### 4.2 API

- [ ] **A3** — Subir a API:
      _Como:_ Abrir um **segundo** terminal — o primeiro fica reservado para o banco — entrar
      em `sep-api` e rodar o comando. Ele não devolve o prompt: a API fica rodando e
      imprimindo log, e é assim mesmo. Esperar a linha `Started SepApiApplication`. **Deixe
      este terminal aberto** durante toda a execução; fechá-lo derruba a API.
      ```bash
      ./gradlew bootRun
      ```
      _Esperado:_ sobe sem erro; o Flyway aplica as migrations até a última versão.
- [ ] **A4** — Conferir prontidão: Insomnia > **Actuator** > `GET /actuator/health`.
      _Como:_ No Insomnia, abrir a pasta **Actuator** na barra lateral, clicar no request
      `GET /actuator/health` e depois no botão **Send**. A resposta aparece no painel da
      direita. Erro de conexão aqui significa que a API do **A3** não subiu.
      _Esperado:_ `{"status":"UP"}`.
- [ ] **A5** — Conferir que as migrations rodaram por completo:
      _Como:_ Rodar no terminal do banco (o do **A1**). O comando lê a tabela em que o Flyway
      registra cada migration aplicada. Olhar a coluna `success`: `t` é sucesso, `f` é falha.
      Uma única linha `f` significa banco em estado inconsistente — nesse caso, fazer o reset
      do §7 antes de continuar, porque nada adiante vai funcionar direito.
      ```bash
      docker exec sep-postgres psql -U sep -d sep_dev \
        -c "SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;"
      ```
      _Esperado:_ as últimas linhas com `success = t`. Nenhuma migration falhada.
- [ ] **A6** — Conferir que os providers estão em Fake (default do `application.yml`):
      nenhuma variável `APP_*_PROVIDER` apontando para adapter real no shell.
      _Como:_ No terminal em que você subiu a API, rodar `env | grep APP_` (no PowerShell,
      `Get-ChildItem Env:APP_*`). O esperado é **não sair nada**: sem variável definida, a API
      usa o default do `application.yml`, que é o provider Fake. Se aparecer alguma variável
      apontando para adapter real, o teste tentaria falar com serviço externo de verdade —
      apagar a variável e reiniciar a API.
      _Esperado:_ KYC, KYB e PLD em `fake`. Nenhuma chamada externa sai da máquina.

### 4.3 Web e mobile

- [ ] **A7** — Subir o web:
      _Como:_ **Terceiro** terminal, também na raiz do workspace. Na primeira vez, rodar
      `npm ci` antes do `npm start` para instalar as dependências (demora alguns minutos).
      Este terminal também fica ocupado e precisa continuar aberto.
      ```bash
      cd sep-app && npm start
      ```
      _Esperado:_ `http://localhost:4200` carrega a landing pública.
- [ ] **A8** — Subir o mobile (PWA) e abrir no navegador:
      _Como:_ **Quarto** terminal. Mesma coisa do A7: `npm ci` na primeira vez. Ao final você
      tem quatro terminais abertos (banco, API, web, mobile) — vale deixá-los identificados,
      porque os passos adiante dizem em qual rodar. O "mobile" aqui é o site aberto no
      navegador comum, não um celular.
      ```bash
      cd sep-mobile && npm start
      ```
      _Esperado:_ `http://localhost:8100` carrega a splash e navega para `/welcome`.
- [ ] **A9** — Ativar a emulação de dispositivo no DevTools (Pixel 5 ou 390x844).
      _Como:_ Na aba do `localhost:8100`, abrir o DevTools com `F12` e ligar o modo
      dispositivo com `Ctrl+Shift+M`. No seletor que aparece no topo da página, escolher
      **Pixel 5**. Sem isso o mobile abre em tamanho de desktop e o layout não é o que se
      quer testar.
      _Esperado:_ layout mobile. As specs Playwright usam Pixel 5; usar a mesma referência
      mantém os resultados comparáveis.

## 5. Bootstrap do primeiro ADMIN

### 5.1 Por que isto e necessário

Não existe seed de usuários no `sep-api`: não há `data.sql`, não há `CommandLineRunner` e
nenhuma migration insere usuário. As únicas migrations com `INSERT` são o backfill de roles
(V42) e os parâmetros de governança (V43).

E há um impasse: o cadastro público `POST /api/v1/usuarios` **sempre cria `CLIENTE`** — o
campo `role` foi removido do DTO no follow-up 5F-FIX-01 da Sprint 5, justamente para impedir
escalada de privilégio — e a criação de usuário interno `POST /api/v1/admin/usuarios` exige
`hasRole('ADMIN')`. Sem um ADMIN, não nasce nenhum ADMIN.

A saída e promover por SQL **um usuário já cadastrado pela aplicação**. Cadastrar pelo app e
só promover por SQL evita gerar hash BCrypt na mão, que e a maior fonte de erro deste passo.

### 5.2 Cadastrar o usuário que virara ADMIN

O cadastro real de usuário **só existe no mobile** — no web, `/register` e tela de
canalização (ver [§7.2 do hub](./CENARIOS-TESTE-JORNADAS-USUARIO.md#72-cadastro-publico-pelo-web--nao-existe)).
Use o mobile ou a API.

- [ ] **B1** — Insomnia > **Usuários** > `POST /usuarios (criar cliente público) — 201`, com
      o body:
      _Como:_ No Insomnia, abrir a pasta **Usuários** (com acento — é o nome literal na
      collection) e clicar no request `POST /usuarios (criar cliente público) — 201`. No
      painel do meio, aba **Body**, substituir o conteúdo pelo JSON abaixo e clicar em
      **Send**. Na resposta, copiar o valor do campo `id` e colar na variável `adminId` do
      environment — vários passos adiante dependem dele. Este usuário nasce como `CLIENTE`
      comum; ele vira ADMIN no **B2**.
      ```json
      { "username": "admin@sep.test", "password": "roteiro-manual-sep-2026" }
      ```
      _Esperado:_ `201` com o `id` (UUID v6) e `role: "CLIENTE"`. Guardar o `id` em
      `adminId`.

> **Política de senha real.** Mínimo 12 caracteres **ou** passphrase de 4+ palavras. A senha
> `123456` usada nos fixtures e no MSW **não passa** no backend real — ela existe apenas no
> mock. Use as senhas deste roteiro.
>
> A verificação HIBP (vazamento de senha) vem **desabilitada** por default
> (`NoopPasswordBreachChecker`, `matchIfMissing = true`), então o cadastro não depende de
> acesso a internet.

### 5.3 Promover a ADMIN por SQL

As roles são **cumulativas**: `usuario_role` e a fonte autoritativa e `usuario.role` e a
principal denormalizada (precedência `ADMIN > FINANCEIRO > BACKOFFICE > CLIENTE`). Os dois
lugares precisam ser atualizados.

- [ ] **B2** — Promover:
      _Como:_ Rodar no terminal do banco (o do **A1**). Copiar o bloco inteiro de uma vez,
      incluindo a linha final `SQL` — é ela que fecha o comando. São dois comandos SQL: o
      primeiro muda a role principal, o segundo acrescenta a linha na tabela de roles
      cumulativas. Os dois são necessários; rodar só um deixa o usuário meio promovido, que
      é pior do que não promover.
      ```bash
      docker exec sep-postgres psql -U sep -d sep_dev <<'SQL'
      UPDATE usuario SET role = 'ADMIN' WHERE username = 'admin@sep.test';
      INSERT INTO usuario_role (usuario_id, role)
      SELECT id, 'ADMIN' FROM usuario WHERE username = 'admin@sep.test'
      ON CONFLICT DO NOTHING;
      SQL
      ```
      _Esperado:_ `UPDATE 1` e `INSERT 0 1`.
- [ ] **B3** — Conferir o resultado:
      _Como:_ Mesmo terminal. `UPDATE 0` no passo anterior significa que o usuário do **B1**
      não foi criado — nesse caso, voltar ao B1 antes de seguir. A saída deste comando vem em
      formato de tabela; ler a linha e comparar com o esperado.
      ```bash
      docker exec sep-postgres psql -U sep -d sep_dev \
        -c "SELECT u.username, u.role AS principal, array_agg(ur.role) AS roles
            FROM usuario u JOIN usuario_role ur ON ur.usuario_id = u.id
            WHERE u.username = 'admin@sep.test' GROUP BY u.username, u.role;"
      ```
      _Esperado:_ `principal = ADMIN` e `roles = {ADMIN,CLIENTE}`.

> **A linha `CLIENTE` permanece de propósito** — roles são cumulativas e o backfill da V42 já
> tinha criado a linha `CLIENTE`. O `admin@sep.test` fica ADMIN **e** CLIENTE. Isso ajuda em
> algumas jornadas e **atrapalha as negativas de RBAC**: para testar "ADMIN não ve tela de
> tomador", use um ADMIN sem `CLIENTE`, ou remova a linha:
> ```sql
> DELETE FROM usuario_role ur USING usuario u
> WHERE ur.usuario_id = u.id AND u.username = 'admin@sep.test' AND ur.role = 'CLIENTE';
> ```

- [ ] **B4** — Insomnia > **Auth** > `POST /auth/login (admin)`, com o body:
      _Como:_ Pasta **Auth**, request `POST /auth/login (admin)`, aba **Body**, o JSON
      abaixo, **Send**. Na resposta, copiar o valor de `accessToken` — é uma cadeia longa de
      letras e números — e colar na variável `adminAccessToken` do environment. Copiar **sem**
      as aspas e sem a palavra `Bearer`. Esse token é o que autoriza os próximos requests de
      administrador; sem ele, o **B6** e o **B7** respondem 401.
      ```json
      { "username": "admin@sep.test", "password": "roteiro-manual-sep-2026" }
      ```
      _Esperado:_ `accessToken` no corpo e `mfaRequired: false` (o ADMIN ainda não tem TOTP).
      Guardar o token em `adminAccessToken`.

### 5.4 Criar os demais usuários internos

`FINANCEIRO` e `BACKOFFICE` **não podem ser criados diretamente**. O
`CriarUsuarioUseCase.executarInterno` rejeita as duas roles com `USR-400-002`: a promoção só
vale pelo fluxo auditado `POST /api/v1/usuarios/{id}/role`, que exige ADMIN + step-up +
`ROLE_ALTERADO` no audit log. São dois passos, sempre.

> **Ordem importa: promova antes de habilitar TOTP no `admin`.** A promoção usa o
> `@RequireStepUp` legado, que **faz bypass quando o usuário ainda não tem MFA**. Com o
> `admin` sem TOTP, a promoção passa sem token. Se você habilitar TOTP no `admin` primeiro,
> cada promoção passa a exigir o par `step-up/initiate` + `step-up/complete` e o header
> `X-Step-Up-Token`.

- [ ] **B5** — Insomnia > **Usuários** > `POST /usuarios (criar cliente público) — 201`, duas
      vezes, com os bodies:
      _Como:_ É o mesmo request do **B1**, enviado duas vezes trocando o body. Anotar o `id`
      da resposta do **financeiro** na variável `financeiroId`; o do backoffice você vai
      colar direto na URL do **B7**, então deixe à mão. Os dois nascem `CLIENTE` — a promoção
      é o passo seguinte.
      ```json
      { "username": "financeiro@sep.test", "password": "roteiro-manual-sep-2026" }
      ```
      ```json
      { "username": "backoffice@sep.test", "password": "roteiro-manual-sep-2026" }
      ```
      _Esperado:_ dois `201`, ambos `CLIENTE`. Guardar o `id` do financeiro em `financeiroId`.
- [ ] **B6** — Insomnia > **Usuários** >
      `POST /usuarios/{id}/role (ADMIN + step-up promove FINANCEIRO)`, apontando para o `id`
      do financeiro, com o body:
      _Como:_ Na URL do request, trocar o `{id}` pelo `financeiroId` do **B5** (ou usar a
      variável, se a collection já referenciar). Conferir na aba **Headers** que o
      `Authorization` está usando o `adminAccessToken` do **B4**. Este passo funciona **sem**
      token de step-up só porque o `admin` ainda não tem TOTP — é o motivo do aviso logo
      acima sobre a ordem. Se responder 403 pedindo step-up, é sinal de que alguém habilitou
      TOTP no `admin` antes da hora.
      ```json
      { "role": "FINANCEIRO" }
      ```
      _Esperado:_ `200` com `role: "FINANCEIRO"`.
- [ ] **B7** — Repetir **B6** para o `id` do backoffice, com o body:
      _Como:_ Mesmo request, trocando o `{id}` na URL pelo do backoffice e o valor do body.
      ```json
      { "role": "BACKOFFICE" }
      ```
      _Esperado:_ `200` com `role: "BACKOFFICE"`.
- [ ] **B8** — Conferir o audit log das duas promoções:
      _Como:_ Terminal do banco. Este comando lê a trilha de auditoria de segurança. Cada
      promoção precisa ter deixado uma linha `ROLE_ALTERADO` — é exigência regulatória, não
      capricho. Se as promoções deram `200` mas aqui não aparecem duas linhas, **isso é um
      defeito**: registre uma ocorrência.
      ```bash
      docker exec sep-postgres psql -U sep -d sep_dev \
        -c "SELECT tipo, data_evento FROM audit_log_seguranca WHERE tipo = 'ROLE_ALTERADO' ORDER BY data_evento DESC LIMIT 5;"
      ```
      _Esperado:_ duas linhas `ROLE_ALTERADO`. Promoção sem trilha é defeito.

Negativas do bootstrap — provam que o impasse da §5.1 continua fechado:

- [ ] **B9** — Insomnia > **Usuários** > `POST /admin/usuarios (criar admin interno) — 201`,
      trocando o body para uma role operacional:
      _Como:_ **Atenção: aqui o erro é o resultado certo.** Estes quatro passos tentam burlar
      o sistema de propósito; se algum deles der certo, o defeito é grave. Enviar o request
      com o body abaixo (note o campo `role`, que o body normal não tem) e conferir que a
      resposta é **400**, não 201. Procurar `USR-400-002` no corpo da resposta.
      ```json
      { "username": "atalho@sep.test", "password": "roteiro-manual-sep-2026", "role": "FINANCEIRO" }
      ```
      _Esperado:_ **400** com código `USR-400-002`. O atalho para role operacional é fechado.
- [ ] **B10** — Repetir **B9** sem o header `Authorization`.
      _Como:_ No mesmo request do B9, aba **Headers**, desmarcar (ou apagar) a linha
      `Authorization` e enviar de novo. Depois **restaurar o header** — os passos seguintes
      precisam dele. A diferença entre 401 e 403 importa: 401 é "não sei quem você é", 403 é
      "sei quem você é e você não pode".
      _Esperado:_ **401**. Criação de interno não é pública.
- [ ] **B11** — Insomnia > **Usuários** >
      `POST /admin/usuarios (cliente tenta criar admin) — 403`, com `clienteAccessToken`
      preenchido (persona criada na §6).
      _Como:_ Este passo depende do `clienteAccessToken`, que só existe depois da §6.1 — se
      você ainda não criou as personas, **pule agora e volte aqui** depois do **C1**. Para
      obter o token: fazer login como `cliente-a` pelo request de login e copiar o
      `accessToken`, como no **B4**.
      _Esperado:_ **403**. Só ADMIN cria interno.
- [ ] **B12** — Como `admin`, tentar alterar a **própria** role para `CLIENTE`.
      _Como:_ Usar o request de promoção do **B6**, mas colocando na URL o `adminId` (o id do
      próprio admin, guardado no **B1**) e `{ "role": "CLIENTE" }` no body. A recusa é
      proposital: se um ADMIN pudesse se rebaixar, poderia também se promover, e todo o
      impasse de bootstrap da §5.1 perderia sentido.
      _Esperado:_ recusado. ADMIN não altera a própria role — é por isso que o primeiro
      ADMIN precisa nascer por SQL.

> **B9 a B12 não são burocracia.** Se qualquer um deles passar, há escalada de privilégio: o
> impasse de bootstrap descrito em §5.1 e uma decisão de segurança deliberada, não um
> descuido.

## 6. Massa de dados

### 6.1 Personas

| Persona | Usuário | Role | Senha | Para que serve |
|---|---|---|---|---|
| `admin` | `admin@sep.test` | ADMIN (+CLIENTE) | `roteiro-manual-sep-2026` | Governança, usuários, parâmetros, matching |
| `financeiro` | `financeiro@sep.test` | FINANCEIRO | `roteiro-manual-sep-2026` | Pix, chaves Pix, conciliação, aporte, cobrança financeira |
| `backoffice` | `backoffice@sep.test` | BACKOFFICE | `roteiro-manual-sep-2026` | Fila operacional, reprocessos |
| `cliente-a` | `cliente-a@sep.test` | CLIENTE | `jornada-tomador-sep-2026` | Tomador principal: KYC, proposta, contrato, parcelas |
| `cliente-b` | `cliente-b@sep.test` | CLIENTE | `jornada-ownership-sep-2026` | Ownership: tentar acessar dados do `cliente-a` |
| `credora` | `credora@sep.test` | CLIENTE + credora | `jornada-credora-sep-2026` | Credora: KYB, oportunidades, interesse, carteira |

- [ ] **C1** — Insomnia > **Usuários** > `POST /usuarios (criar cliente público) — 201`, três
      vezes, com os bodies:
      _Como:_ Mesmo request do **B1** e do **B5**, agora três vezes. **As senhas são
      diferentes entre si** — copie cada uma exatamente da tabela acima, porque errar aqui só
      aparece muitas jornadas depois, na forma de um login que não entra. Guardar o `id` do
      `cliente-a` em `clienteId`. Estas três personas são as que aparecem na maioria das
      jornadas: `cliente-a` é o tomador principal, `cliente-b` serve para provar que ninguém
      enxerga dado alheio, e `credora` é usada no roteiro de credora.
      ```json
      { "username": "cliente-a@sep.test", "password": "jornada-tomador-sep-2026" }
      ```
      ```json
      { "username": "cliente-b@sep.test", "password": "jornada-ownership-sep-2026" }
      ```
      ```json
      { "username": "credora@sep.test", "password": "jornada-credora-sep-2026" }
      ```
      _Esperado:_ três `201`, todos `CLIENTE`. Guardar o `id` do `cliente-a` em `clienteId`.
      Nenhum deles recebe role interna.
- [ ] **C2** — Conferir que nenhum usuário nasceu com `precisa_redefinir_senha = true`:
      _Como:_ Terminal do banco. Este comando lista todos os usuários criados até aqui —
      devem ser seis. É um bom momento para conferir a lista inteira: se faltar alguém, algum
      passo anterior falhou sem você notar. Nas colunas `mfa_habilitado` e
      `precisa_redefinir_senha`, `f` quer dizer falso.
      ```bash
      docker exec sep-postgres psql -U sep -d sep_dev \
        -c "SELECT username, role, mfa_habilitado, precisa_redefinir_senha FROM usuario ORDER BY data_criacao;"
      ```
      _Esperado:_ `precisa_redefinir_senha = f` e `mfa_habilitado = f` para todos. O `UPDATE`
      da migration V6 só atingiu usuários que existiam na época; em banco novo não há nenhum.

> A persona `credora` só vira credora de fato depois do KYB aprovado e do cadastro em
> `/app/credora/cadastro` — **isso é jornada**, coberta no roteiro de credora, não aqui.
> Até lá ela é um `CLIENTE` comum e o `credoraPresenceGuard` a bloqueia.

### 6.2 Habilitar TOTP

Obrigatório para qualquer jornada com **step-up estrito**: aceite, cancelamento e assinatura
de contrato, proposta e aceite de renegociação, e desembolso Pix. Nessas operações o
`StepUpEnforcementAspect` **nega com 403 antes de validar o token** se o usuário não tiver
MFA habilitado — não há bypass.

O enrollment de TOTP **só existe no web** (`/app/profile/setup-totp`). O mobile apenas
verifica o código; não cadastra.

- [ ] **C3** — No web, autenticar como `cliente-a` e abrir **Meu perfil**.
      _Como:_ Na aba do `localhost:4200`, entrar com `cliente-a@sep.test` /
      `jornada-tomador-sep-2026`. Como este usuário ainda não tem TOTP, o login entra direto
      no painel, sem pedir código. **Meu perfil** fica no menu do usuário.
- [ ] **C4** — Abrir a configuração de TOTP em `/app/profile/setup-totp`.
      _Como:_ **Não há link para esta tela no menu nem no perfil** — digitar o endereço
      `http://localhost:4200/app/profile/setup-totp` direto na barra; funciona porque você já
      está logado. A tela abre com o título **Habilitar autenticação em duas etapas (TOTP)** e
      um botão **Iniciar setup**: o QR só aparece depois de clicar nele.
      _Esperado:_ QR code e secret em texto são exibidos.
- [ ] **C5** — Escanear o QR no autenticador e confirmar com o código corrente.
      _Como:_ A tela está numerada em três passos. No **1. Escaneie o QR code**, ler o QR pelo
      autenticador (na extensão de navegador costuma haver a opção de colar o secret em texto
      em vez de escanear). Depois, no **3. Confirme com o primeiro código gerado**, digitar no
      campo **Código TOTP** o número de 6 dígitos que o autenticador mostra — ele **muda a
      cada 30 segundos** — e clicar em **Confirmar e ativar MFA**. Se der erro, o código
      provavelmente virou no meio do caminho: esperar o próximo e repetir.
      _Esperado:_ MFA habilitado; **os backup codes aparecem uma única vez** — copiar agora.
- [ ] **C6** — Guardar os backup codes junto das credenciais desta execução.
      _Como:_ **Não feche a tela antes de copiar.** Os códigos aparecem no bloco **2. Guarde
      seus backup codes**, como uma lista simples — **não há botão de copiar**: selecionar com
      o mouse e copiar à mão. A própria tela avisa que eles não serão exibidos de novo, e é
      verdade: perdê-los significa refazer o enrollment. Colar num arquivo de rascunho da
      execução, junto das senhas em uso. Pelo menos um precisa sobrar sem uso para a jornada
      `J-031.W`, que testa justamente o consumo de um backup code.
      _Esperado:_ pelo menos um backup code reservado para a jornada de backup code.
- [ ] **C7** — Repetir **C3-C6** para `financeiro` (opera Pix e chaves Pix, ambos com
      step-up estrito).
      _Como:_ Sair da sessão do `cliente-a` e entrar como `financeiro@sep.test` /
      `roteiro-manual-sep-2026`. Repetir C3 a C6. No autenticador, a segunda conta aparece
      como uma entrada separada — confira que está lendo o código **da conta certa** na hora
      de usar; é o erro mais comum daqui em diante.
      _Esperado:_ `financeiro` com MFA habilitado.
- [ ] **C8** — Conferir no banco:
      _Como:_ Terminal do banco. Esta consulta lista só quem tem MFA ligado — devem ser
      exatamente duas linhas. Se `cliente-b` aparecer aqui, o enrollment foi feito na conta
      errada e as jornadas negativas de step-up vão falhar sem motivo aparente.
      ```bash
      docker exec sep-postgres psql -U sep -d sep_dev \
        -c "SELECT username, mfa_habilitado FROM usuario WHERE mfa_habilitado = true;"
      ```
      _Esperado:_ `cliente-a` e `financeiro` na lista.

> **Deixe `cliente-b` sem TOTP de propósito.** Ele é a persona das negativas de step-up
> estrito: sem MFA, a operação tem de ser negada com 403.

### 6.3 Valores de teste

| Dado | Valor | Efeito |
|---|---|---|
| CPF do representante (KYB) | `52998224725` | Devolvido pelo `FakeKybProvider` |
| Callback KYC | — | `FakeKycProvider` devolve `APROVADO` |
| Background check | — | `FakeBackgroundCheckProvider` devolve limpo |

Use CPF/CNPJ com dígito verificador válido: a validação de DV e feita no backend e recusa
sequências inválidas antes de chegar ao provider.

> Os valores-sentinela de `99999999999` (força `409`) e os UUIDs de ownership existem no
> **MSW**, não no backend real. Contra `:8080`, os cenários negativos se constroem com dados
> reais — por exemplo, ownership se testa com o ID real do `cliente-a` autenticado como
> `cliente-b`.

### 6.4 Política de lockout

Default do `application.yml`: **5 tentativas** inválidas em janela de **15 minutos** →
bloqueio de **30 minutos**.

Isso importa em duas frentes: a jornada de lockout precisa desses números, e **errar a senha
cinco vezes durante o roteiro bloqueia a persona por 30 minutos**. Para destravar sem
esperar, ver §7.

## 7. Reset entre execuções

- [ ] **D1** — Reset total (apaga o volume; ambiente do zero):
      _Como:_ **Este passo apaga tudo e não tem desfazer.** O `-v` remove o volume do banco,
      ou seja, todos os usuários e dados que você criou. Só rode quando quiser recomeçar do
      zero, e faça o **D3** antes para não perder o registro da rodada anterior. Depois de
      rodar, reiniciar a API (o terminal do **A3**) para o Flyway recriar as tabelas.
      ```bash
      cd sep-api && docker compose down -v && docker compose up -d postgres
      ```
      _Esperado:_ banco vazio. Toda a §5 e a §6 precisam ser refeitas.
- [ ] **D2** — Destravar uma conta bloqueada sem reset total: remover as tentativas
      registradas para o usuário e reiniciar a API.
      _Como:_ Use isto quando errar a senha cinco vezes e a persona ficar bloqueada por 30
      minutos (§6.4) — é bem mais rápido que o reset total, e não destrói a massa de dados.
      Apagar as tentativas do usuário no banco e reiniciar a API no terminal do **A3**
      (`Ctrl+C` e `./gradlew bootRun` de novo). A alternativa é simplesmente esperar os 30
      minutos passarem.
      ```bash
      docker exec sep-postgres psql -U sep -d sep_dev \
        -c "DELETE FROM login_attempt WHERE username = 'cliente-b@sep.test';"
      ```
      _Esperado:_ login volta a ser aceito com a senha correta.
- [ ] **D3** — Antes de uma execução limpa, abrir o [app](./app/index.html), **exportar** o
      JSON da rodada anterior para `execucoes/AAAA-MM-DD-<tag>/execucao.json` e criar uma
      **rodada nova** pelo botão `+` do topo.
      _Como:_ No app, clicar em **Exportar** — o arquivo cai na pasta de downloads. Criar a
      pasta `execucoes/AAAA-MM-DD-<tag>/` (por exemplo `execucoes/2026-07-21-regressao/`) e
      mover o arquivo para lá. Só então clicar no `+` no topo para abrir uma rodada nova. A
      ordem importa: as marcações vivem no navegador, e exportar é o que as transforma em
      registro permanente.
      _Esperado:_ a rodada nova começa com o progresso zerado; a anterior continua acessível
      no seletor de rodadas e no JSON exportado.

## 8. Pré-condições reutilizáveis

As jornadas referenciam estes identificadores em vez de repetir o preparo.

| ID | Pré-condição | Como satisfazer |
|---|---|---|
| `PRE-01` | API responde `UP` | §4.2 **A4** |
| `PRE-02` | Web em `:4200` | §4.3 **A7** |
| `PRE-03` | Mobile em `:8100` | §4.3 **A8** |
| `PRE-04` | Superfície **sem MSW** | `localStorage.NG_APP_USE_MSW` ausente ou `'false'`; build **não** e `dev-offline` |
| `PRE-05` | `admin` existe e autentica | §5.2 e §5.3 |
| `PRE-06` | `financeiro` e `backoffice` existem e promovidos | §5.4 **B5** a **B7** |
| `PRE-07` | `cliente-a` com TOTP habilitado | §6.2 **C3-C6** |
| `PRE-08` | `financeiro` com TOTP habilitado | §6.2 **C7** |
| `PRE-09` | `cliente-b` **sem** TOTP | §6.1 **C1** (não habilitar) |
| `PRE-10` | Autenticador TOTP a mão | §2 |
| `PRE-11` | `cliente-a` com KYC aprovado | Roteiro de onboarding |
| `PRE-12` | `cliente-a` com proposta aprovada e contrato aguardando aceite | Roteiro de crédito |
| `PRE-13` | `credora` cadastrada e elegível | Roteiro de credora |

`PRE-11` a `PRE-13` são produzidas por jornadas, não por setup. Por isso a ordem de execução
recomendada no hub importa: onboarding antes de crédito, crédito antes de cobrança.

## 9. Verificação final do ambiente

Antes de abrir qualquer roteiro de jornada:

- [ ] **E1** — `PRE-01` a `PRE-10` marcados
      _Como:_ Conferir na tabela do §8 que cada `PRE` de 01 a 10 aponta para um passo que
      você já executou. `PRE-11` a `PRE-13` **não** entram aqui: eles são produzidos por
      jornadas de outros roteiros, não por este preparo.
- [ ] **E2** — Login funciona no web para `admin`, `financeiro`, `backoffice` e `cliente-a`
      _Como:_ Em `localhost:4200`, entrar e sair com as quatro personas, uma de cada vez,
      usando as senhas da tabela do §6.1. `cliente-a` e `financeiro` vão pedir o código TOTP
      (foram habilitados no §6.2); `admin` e `backoffice` entram direto. Testar agora evita
      descobrir uma senha errada no meio de uma jornada longa.
- [ ] **E3** — Login funciona no mobile para `cliente-a`
      _Como:_ Na aba do `localhost:8100`, com a emulação de dispositivo ligada (**A9**),
      entrar como `cliente-a`. O mobile **verifica** o código TOTP mas não cadastra — o
      enrollment é só no web, e já foi feito.
- [ ] **E4** — Nenhuma superfície está em MSW (`PRE-04` conferido nas duas)
      _Como:_ Em cada aba (`:4200` e `:8100`), abrir o DevTools (`F12`), aba **Console**, e
      rodar `localStorage.NG_APP_USE_MSW`. A resposta precisa ser `null` ou `"false"`. Se vier
      `"true"`, rodar `localStorage.removeItem('NG_APP_USE_MSW')` e recarregar. Com o MSW
      ligado a tela responde bonito sem backend nenhum, e **o roteiro inteiro perde o valor**.
- [ ] **E5** — A aba de rede do navegador mostra chamadas saindo para `localhost:8080`
      _Como:_ É a confirmação positiva do E4: em vez de perguntar se o mock está desligado,
      olhar se o backend real está sendo chamado. Aba **Network**, filtrar por `8080`, e fazer
      qualquer ação na tela (um login serve). Tem que aparecer chamada.
      _Esperado:_ se não há chamadas para `:8080`, a superfície está em mock e o resultado
      do roteiro não vale.

## 10. Ocorrências desta execução

> Estrutura lida pelo gerador para montar o painel de ocorrências do app.
> **Não preencher aqui** — registre a ocorrência no próprio passo, dentro do app.

| # | Passo | O que aconteceu | Esperado | Issue |
|---|---|---|---|---|
| | | | | |

## 11. Registro da execução

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
| Resultado | `OK` / `NOK` / `BLOQUEADO` |
| Observações | |
