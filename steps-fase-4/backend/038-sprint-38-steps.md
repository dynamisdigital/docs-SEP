# Steps - Sprint 38 - Modulo de notificacao, historico e canal in-app

**Spec**: [038](../../specs/fase-4/038-sprint-38-modulo-notificacao-historico.md).
**Status**: steps criados em 2026-09-11; **implementados em 2026-09-14 e MERGEADOS develop+main** (PR #112/#113, arvore `6b3aab2` conferida por conteudo).
**Repositorio**: `sep-api`. **Fase**: 4. **Migration prevista**: `V61`.
**ADR previsto**: proximo numero livre (0021 na leitura de 2026-09-11; confirmar antes de criar).

**Objetivo**: persistir notificacoes por usuario, oferecer consulta e leitura da central e avisar o
tomador quando o desembolso Pix concluir. Absorver o email de lockout com historico, preservando a
regua de cobranca. Desbloqueia [F-27](../../specs/fase-4/127-fsprint-27-central-notificacao-web.md)
e [M-19](../../specs/fase-4/219-msprint-19-central-notificacao-mobile.md) apos integracao em `develop`.

## Leituras e limites

Ler [STATE](../../docs-sep/STATE.md), [AGENT](../../AGENT.md),
[PRD da Fase 4](../../docs-sep/PRD-FASE-4.md), spec 038 e estes steps. Consultar:

- [ADR 0007](../../adr/0007-ddd-com-hexagonal-ports-and-adapters-por-modulo.md), fronteiras hexagonais.
- [ADR 0004](../../adr/0004-provider-pattern-para-integracoes-externas.md), providers.
- [ADR 0014](../../adr/0014-estrategia-de-notificacoes-transacionais.md), notificacoes existentes.
- [ADR 0020](../../adr/0020-convencao-codigos-de-erro.md), codigos publicados.
- [NOTIFICACOES](../../repos/sep-api/NOTIFICACOES.md), [PIX](../../repos/sep-api/PIX.md)
  e [SEGURANCA](../../docs-sep/SEGURANCA.md).

Aplicar as skills obrigatorias do AGENT e as skills carregadas conforme o trabalho: arquitetura e
acoplamento nas fronteiras, DDD nas invariantes e pensamento de produto no contrato e nas mensagens.

Fora do escopo: migrar a regua, adicionar gatilhos alem do Pix concluido, grupos/broadcast,
preferencias, opt-out, push, tempo real e endpoints administrativos de reenvio. Sem alteracao de
`ApiExceptionHandler`, renomeacao de codigos publicados ou implementacao das telas web/mobile.
Se novas condicoes exigirem codigo, seguir o registro e as guardas da Sprint 37.

A criacao destes steps nao decide prazo legal nem inicia implementacao. As decisoes ainda abertas
ficam na Task 38.1, antes de congelar schema e contratos. Nao renumerar a Fase 5.

## Checkpoint de cada task

Apresentar `git status --short --branch`, `git diff --stat`, arquivos afetados, verificacoes e
resultados, riscos, desvios e sugestao de commit. Aguardar aprovacao explicita antes de staging e
commit no `sep-api`, com paths especificos. Push e PR sao manuais salvo pedido explicito.
Em `docs-SEP`, editar apenas working tree; git permanece manual. Checkboxes exigem evidencia.

## Gate 38.0 - Base e premissas

### Step 038.0.1 - Integracao e ambiente

Conferir working tree do `sep-api` e preservar alteracoes existentes. Atualizar referencias remotas,
comparar `develop` e `main` por conteudo e confirmar Sprint 37 integrada. Registrar divergencias;
ancestralidade de squash nao substitui diff. Com a base liberada, atualizar `develop` por
fast-forward e criar `feature/sprint-38-notificacao-historico`.

Conferir perfil e banco dos testes: a suite existente usa `sep_dev` compartilhado. Preparar banco
descartavel para migration, concorrencia e lockout; nao limpar dados de uso manual para obter verde.
No inicio da implementacao, aplicar a regra de remocao da descricao temporaria da Sprint 37 somente
apos confirmar seu uso no PR. Isso nao faz parte da preparacao destes steps.

### Step 038.0.2 - Baseline

Executar no diretorio `sep-api`, registrando o exit code real de cada comando:

```bash
./gradlew clean build
./gradlew spotlessCheck
```

Contar testes, falhas e erros pelos XMLs em `build/test-results/test/`. Referencia documental:
2318 testes apos Sprint 37; a baseline e a medicao atual. Investigar vermelho antes de implementar,
distinguindo defeito preexistente de contaminacao do ambiente.

### Step 038.0.3 - Inventario com fonte

Remedir e registrar paths e consumidores:

- Eventos e pontos de envio: 71 e tres sao referencias da spec, nao aceite.
- `shared.email.EmailService`, implementacoes, configuracao e consumidores em producao/testes.
- `LockoutService.avaliarPosFalha`: destinatario, instante de bloqueio, audit, `REQUIRES_NEW`,
  chamadores de login/TOTP e efeito da excecao que encerra a autenticacao.
- `SincronizadorStatusTransferencia`: solicitacao, consulta e webhook; transacao de cada chamador.
- Correspondencia entre `tomadorId` e ID do usuario autenticado, antes de definir ownership.
- Provider, templates, retry e enum da cobranca; testes que devem continuar passando.
- Ultima migration, numero livre de ADR e ausencia do modulo `notificacao`.
- Padroes atuais de principal, ownership, `Page<T>` e OpenAPI.

**Conferido na preparacao (2026-09-11)**: `LogEmailService` apenas simula envio. O lockout o chama
em transacao propria. O sincronizador Pix evita republicar status terminal; repetir consulta Pix
nao prova deduplicacao do listener novo.

**Pronto quando**:

- [x] Base, branch, ambiente e baseline documentados; divergencias tratadas.
- [x] Inventario conferido, incluindo identidade do destinatario e transacoes efetivas.
- [x] Banco de ensaio, V61 e numero do ADR confirmados.

**Resultado medido (2026-09-14)**:

- **Base**: `git fetch` exit 0. `origin/develop` `30c1f2b` e `origin/main` `5fe83a1` com a **mesma
  arvore** `e4eae0e`, identica a da branch verificada da Sprint 37 (`d4a1d72`). Sprint 37 integrada,
  conferida por arvore e nao por ancestralidade. `develop` local avancado por fast-forward; branch
  `feature/sprint-38-notificacao-historico` criada de `30c1f2b`. Dois stashes antigos em `main`
  (2026-09-02) preservados, sem relacao com a sprint.
- **Descricao temporaria da Sprint 37 NAO removida**: o PR #110 foi mergeado com o corpo do template
  (1201 caracteres, sem mencao a Sprint 37 nem ao ADR 0020), e o #111 idem. Uso no PR nao confirmado,
  entao a regra do Step 038.0.1 manda manter `repos/sep-api/SPRINT-37-PR.md`. Decisao do responsavel.
- **Ambiente**: `sep-postgres` (postgres 16) em `:5432`; `sep_dev` sem residuo
  (`solicitacao_onboarding` = 0), Flyway em `V60`. ITs usam `sep_test` (perfil `test`). O banco
  descartavel de ensaio da `V61` e criado na Task 38.2, fora das duas bases.
- **Baseline**: `./gradlew clean build` exit 0 (6m12s); `./gradlew spotlessCheck` exit 0. XMLs:
  **373 classes, 2318 testes, 0 falhas, 0 erros, 0 skipped** — igual ao registro da Sprint 37. Os 42
  `*IT` entram no `build`.
- **Inventario**:
  - Eventos: **71** records `*Event`, igual a spec. Pontos de envio: **3**, iguais; o do lockout
    mudou de `LockoutService:155` para `:175`.
  - `shared.email`: `EmailService` + `LogEmailService` (so log, nunca lanca); consumidores
    `LockoutService` e testes `LogEmailServiceTest`/`LockoutServiceTest`.
  - `avaliarPosFalha` (`REQUIRES_NEW`): chamado por `AutenticarUsuarioUseCase:88` (usuario
    inexistente, `usuarioId` nulo — status que nao conta falha, entao nunca bloqueia), `:95` e
    `VerificarTotpUseCase:116`. Grava audit `LOCKOUT` e depois chama o e-mail na mesma transacao.
  - `PixTransferenciaConcluidaEvent`: publicado em `SincronizadorStatusTransferencia:91`, via
    `DesembolsoTransacaoService` (`REQUIRES_NEW`), `ProcessarWebhookPixUseCase:93` e
    `ConsultarStatusDesembolsoPixUseCase:44` (`@Transactional`) — sempre com transacao ativa.
  - **Destinatario**: `contrato.tomador_id REFERENCES usuario(id)` (`V20`) e
    `ConsultarDesembolsoTomadorUseCase:37` compara `tomadorId` com `principal.id()`. `tomadorId` e o
    id do usuario.
  - Cobranca a preservar: `NotificationProvider`, `CanalNotificacao {EMAIL, SMS}`, adapters Log/Smtp/
    Zenvia e testes `LogNotificationProviderTest`, `SmtpNotificationProviderTest`,
    `ThymeleafTemplateNotificacaoEngineTest`, `ZenviaSmsNotificationProviderIT`,
    `EscalarCobrancaUseCaseTest`, `InadimplenciaIT`, `EventoCobranca*Test`.
  - Ultima migration `V60`; ADR livre **0021**; modulo `notificacao` inexistente.
  - Padroes: principal `@AuthenticationPrincipal UsuarioAutenticado`; 404 neutro por subtipo de
    `RecursoNaoEncontradoException` com codigo (Sprint 26); `Page<T>` serializado direto
    (`CreditoController`, `BackofficeController`); criacao idempotente por unique parcial +
    `REQUIRES_NEW` + captura de `DataIntegrityViolationException` (`CriarItemFilaOperacionalService`).
- **Divergencia nova**: os 12 modulos com persistencia poem `@Entity` em `domain.model`, contra o
  ADR 0007 e o `package-info` de cada `domain`. Decisao em 38.1: o `notificacao` segue o ADR.

## Task 38.1 - ADR da capacidade transversal

### Step 038.1.1 - Decisoes antes do schema

Escrever ADR no template do repo, supersedendo parcialmente o 0014 apenas na localizacao da
capacidade. Registrar alternativas e consequencias, fechando:

1. Modulo `notificacao`, dependencias e contrato de entrada. Nao importar infrastructure ou dominio
   da cobranca para enviar email; ports pertencem ao consumidor da capacidade externa.
2. Destinatario unico `usuario_id NOT NULL`; grupos/fan-out fora do escopo.
3. Diferenca entre tentativa, sucesso do provider, simulacao, disponibilidade `IN_APP` e leitura.
   Definir se a central expoe somente `IN_APP` ou tambem email; lista, contador e marcar lida usam
   o mesmo recorte. Historico de email nao implica email nao-lido.
4. Chave derivada de `(tipo, origem_id, destinatario)`, predicado do unique parcial e estados
   abrangidos. No lockout, a origem identifica o bloqueio: repeticao nao duplica, bloqueio posterior
   pode notificar. Nao usar apenas usuario nem UUID aleatorio como origem de replay.
5. Fronteira de commit e isolamento: Pix revertido nao notifica; falha de notificacao nao desfaz
   desembolso, bloqueio ou audit. Fixar persistencia e sinalizacao de falhas.
6. Garantia de replay versus envio externo: uma linha unica nao garante email exatamente uma vez
   se o processo cair entre envio e resultado. Declarar janela e recuperacao. Listener em memoria
   nao equivale a entrega duravel; nao adicionar broker sem justificativa.
7. Payload permitido por tipo, campos publicos, timestamps e idempotencia de marcar lida.
8. Prazo de retencao numerico, finalidade, marco inicial, procedimento de aplicacao e efeito do
   expurgo sobre deduplicacao. Encaminhar o prazo ao responsavel antes de aceitar o ADR; registrar
   decisao provisoria sujeita a revisao juridica, sem inventar obrigacao legal.

### Step 038.1.2 - Contrato consumivel

Fixar paths, verbos, status, schemas e exemplos dos tres endpoints seguindo os padroes existentes.
Definir ordenacao estavel (desempate por ID), limites de pagina e contador. Definir resposta para
item inexistente ou de terceiro sem revelar sua existencia. Nenhum endpoint permite substituir o
principal por destinatario arbitrario. Registrar pendencias no checkpoint antes das tasks dependentes.

**Pronto quando**:

- [ ] ADR aceito com retencao, falha, idempotencia e recorte da central definidos.
- [ ] Contrato dos tres endpoints registrado para F-27 e M-19.

**Commit**: nenhum no `sep-api` se a task alterar somente documentacao.

## Task 38.2 - Dominio, persistencia e migration

### Step 038.2.1 - Modelo minimo e portas

Criar dominio sem Spring/JPA, use cases, portas de persistencia e adapters. Usar metodos de intencao
para criacao e transicoes, protegendo invariantes. Separar estado de leitura de resultado de envio.
Usar relogio injetavel nos timestamps novos, sem ampliar o trabalho para todo relogio legado.

### Step 038.2.2 - V61 e restricoes

Criar tabela com usuario, tipo, canal, leitura, resultado de envio conforme ADR, payload minimizado,
origem/chave e timestamps. Indices atendem lista, contador e deduplicacao. Verificar o unique parcial
nos estados definidos; `exists` seguido de `save` nao substitui protecao concorrente no banco.

### Step 038.2.3 - Provar aplicacao e reversao

Testar invariantes em unidade; mapeamento, queries e restricoes em PostgreSQL. Ensaiar aplicacao do
zero e upgrade de V60 com dados representativos, em bases descartaveis. Preparar e ensaiar reversao
ou restore explicitamente: nao presumir undo automatico do Flyway. Declarar perda dos dados novos
em eventual downgrade e conferir preservacao dos anteriores. Nao executar rollback no banco compartilhado.

**Pronto quando**:

- [x] Dominio/persistencia testados, inclusive repeticao concorrente da chave.
- [x] Aplicacao e reversao nos dois cenarios registradas com evidencias e limites.

**Commit sugerido**: `feat(notificacao): persistir historico por usuario com idempotencia`

**Resultado medido (2026-09-14)**:

- **Modelo**: agregado `Notificacao` sem Spring/JPA (`OrigemNotificacao`, `ConteudoNotificacao`,
  `Entrega`, leitura so em `IN_APP`); `NotificacaoJpaEntity` com mapeamento explicito; porta
  `NotificacaoPort.registrarSeInedita` e adapter com `REQUIRES_NEW` que so trata como "ja notificado"
  a violacao de `uq_notificacao_origem` (FK e CHECK propagam). `CanalNotificacao` criado aqui porque o
  agregado depende dele; o teste de compatibilidade com o enum da cobranca fica na 38.3.
- **Testes**: 43 novos (dominio 26, esquema 12, adapter 5). Suite `./gradlew clean build` exit 0:
  **2361 testes, 0 falhas, 0 erros, 378 classes** (baseline 2318); `spotlessCheck` exit 0; JaCoCo
  verde. Concorrencia: 8 threads com a mesma chave -> 1 `true`, 1 linha.
- **Aplicacao do zero** (`sep_ensaio38_zero`, vazia): testes do modulo contra ela, V1..V61 com
  `success = t`; `sep_dev` conferido intocado em V60 no mesmo momento.
- **Upgrade com dados** (`sep_ensaio38_upgrade`, copia do `sep_dev` em V60 por `pg_dump`: 7551
  `audit_log_seguranca`, 1787 `login_attempt`, 150 `conta_escrow`, 76 `item_fila_operacional`...):
  V61 `success = t`; contagem de todas as tabelas antes/depois difere so em
  `flyway_schema_history` (+1) e na tabela nova.
- **Armadilha medida**: a primeira rodada do upgrade saiu `BUILD SUCCESSFUL in 1s` com a base ainda em
  V60 — o Gradle deu a task `test` como em dia, porque variavel de ambiente nao e input dela. Refeito
  com `--rerun`. Ensaio de migration por `DB_NAME=... ./gradlew test` **exige `--rerun`**.
- **Reversao ensaiada** na base de upgrade, com uma notificacao gravada:
  `BEGIN; DROP TABLE notificacao; DELETE FROM flyway_schema_history WHERE version = '61'; COMMIT;`
  Schema pos-reversao identico ao pre-V61 (`pg_dump --schema-only`, diff so nas linhas `\restrict`,
  token aleatorio do pg_dump 16.13); contagens identicas as pre-V61; V61 reaplica limpa depois.
  **Limite declarado**: a reversao **apaga as notificacoes**; restore de backup e a alternativa quando
  o historico precisar sobreviver. Nada foi executado no `sep_dev`; o Flyway nao tem undo.
- **Mutacoes** (base descartavel recriada a cada uma, alvo conferido por diff, restauracao por `cmp`):
  unique sem predicado `FALHOU` -> 2 testes reprovam; indice nao unico -> 3 reprovam (replay,
  concorrencia, esquema); adapter tratando toda violacao como dedup -> `violacaoQueNaoEAChaveDeOrigem_propaga`
  reprova. Nenhuma morte por compilacao.
- **Code review do commit `c66041d`**: o ADR dizia que a frente B dispensa esquema novo, mas o
  `chk_notificacao_tipo` fecha a lista — cada tipo novo e migration, como no `audit_log_seguranca`.
  Corrigido no ADR. **Limite aceito**: os CHECKs da V61 nao barram texto em branco (`titulo`,
  `mensagem`, `origem_id`, `motivo_falha`), que o dominio recusa; so escrita fora do agregado os
  produziria. Endurecer exigiria alterar a V61 ja aplicada em `sep_dev`/`sep_test` (checksum do
  Flyway) ou uma V62 so para isso.

## Task 38.3 - Canais e adapters

### Step 038.3.1 - Enum novo e compatibilidade

Criar `CanalNotificacao` no modulo novo com `EMAIL`, `SMS`, `IN_APP`; preservar enum e comportamento
da cobranca. Testar nomes compartilhados e diferenca permitida exatamente `IN_APP`. Igualdade
integral dos enums seria uma guarda errada. Registrar duplicacao temporaria.

### Step 038.3.2 - Entrega e resultado

Implementar `IN_APP` como disponibilidade persistida sem I/O externo. Conectar email por porta e
adapter com fake/log default, preservando estrategia de providers do ADR 0014. `SMS` no enum nao
autoriza novo gatilho ou migracao de adapter. Testar selecao, sucesso, simulacao e excecao; nao
registrar corpo sensivel em logs nem tratar fake como comprovante de entrega.

**Pronto quando**:

- [x] Compatibilidade dos enums testada; cobranca preservada.
- [x] `IN_APP` nao envia email/SMS; resultados respeitam o ADR.

**Commit sugerido**: `feat(notificacao): adicionar canal in-app e adapters de envio`

**Resultado medido (2026-09-14)**:

- **Entrega**: `NotificarUsuarioUseCase` com dois metodos de intencao — `disponibilizarNaCentral`
  (grava `IN_APP`, zero I/O) e `enviarEmail` (grava `PENDENTE`, chama `EnvioEmailPort` fora de
  transacao, grava `ENVIADA`/`SIMULADA`/`FALHOU` por `NotificacaoPort.atualizarEntrega`). Excecao do
  provider vira `FALHOU` com o nome da classe e nao sobe; falha de persistencia sobe. `SMS` nao tem
  caminho: nao ha metodo que o entregue.
- **Adapter**: `LogEnvioEmailAdapter` devolve `SIMULADO` e loga sem destinatario, assunto nem corpo.
  `EmailNotificacao.toString()` omite o conteudo.
- **Desvio do plano, medido antes de rodar**: a primeira versao condicionava o adapter a
  `app.notificacoes.provider=log`, como o `LogNotificationProvider`. O `ZenviaSmsNotificationProviderIT`
  sobe contexto completo com `smtp-zenvia`, e sem nenhum `EnvioEmailPort` o contexto nao subiria —
  nem o IT, nem um ambiente de homologacao. O adapter ficou incondicional, como o `LogEmailService`
  que substitui; a diferenca e que a simulacao agora fica gravada como `SIMULADA`. A selecao por
  provider entra com o adapter real (Fase 5).
- **Enums**: `CanalNotificacaoCompatibilidadeTest` exige que os canais da cobranca estejam contidos no
  modulo novo e que a diferenca seja exatamente `{IN_APP}`. Testes da cobranca inalterados e verdes.
- **Testes**: 18 novos (use case 10, compatibilidade 2, e-mail 2, adapter de log 2, persistencia do
  resultado 2). `./gradlew clean build` exit 0: **2379 testes, 0 falhas, 0 erros, 382 classes**;
  `spotlessCheck` exit 0.
- **Mutacoes** (7 aplicadas, 7 mortas por comportamento, 0 por compilacao, restauracao por `cmp`):
  `IN_APP` chamando o provider; falha do provider propagando; motivo com a mensagem da excecao; sem
  gravar o resultado; log com o destinatario; adapter de log declarando `ENVIADO`; `toString` padrao
  do record.

## Task 38.4 - Endpoints das minhas notificacoes

### Step 038.4.1 - Consultas e leitura

Implementar lista paginada, marcar lida e contador conforme 38.1. Derivar usuario do principal e
aplicar owner nas queries, contagem e update; RBAC sozinho nao isola contas. Repetir marcacao
preserva a semantica de timestamp/resultado definida no ADR. A consulta seguinte do contador reflete
a escrita concluida, sem negativo nem inclusao de canais fora do recorte.

### Step 038.4.2 - Contrato e HTTP

Documentar OpenAPI com respostas reais, required/nullable e exemplos minimizados. Testar contas A/B:
conteudo da pagina, `totalElements`, contador e tentativa de A marcar item de B. Conferir no banco
que o item de B nao mudou. Cobrir anonimo, ID ausente, vazio, pagina invalida, ordenacao estavel,
formato `Page<T>` e repeticao de leitura.

**Pronto quando**:

- [x] Owner comprovado nos tres endpoints e na persistencia.
- [x] Vazio e erro distintos; OpenAPI coincide com respostas reais.

**Commit sugerido**: `feat(notificacao): expor central restrita ao destinatario`

**Resultado medido (2026-09-14)**:

- **Contrato** (ADR 0021 §9), todos com `isAuthenticated()` e usuario vindo do principal:
  `GET /api/v1/notificacoes?page&size` -> `Page<NotificacaoResponse>` (`criadaEm` desc, `id` desc;
  `size` 1..100, senao `400 NTF-400-001`); `GET /api/v1/notificacoes/nao-lidas/contagem` ->
  `{ "naoLidas": n }`; `POST /api/v1/notificacoes/{id}/leitura` -> `200 NotificacaoResponse`,
  idempotente, `404 NTF-404-001` neutro para inexistente, alheia ou e-mail. `NotificacaoResponse`:
  `id`, `tipo`, `titulo`, `mensagem`, `criadaEm` (obrigatorios) e `lidaEm`, `referencia { tipo, id }`
  (sempre presentes, nulos quando vazios). Nao expoe usuario, origem, canal nem situacao.
- **Owner**: o dono e o canal `IN_APP` entram nas tres consultas do `CentralNotificacoesPersistenceAdapter`,
  inclusive na busca que antecede a marcacao (`PESSIMISTIC_WRITE`, que serializa marcacoes
  concorrentes e preserva a primeira leitura).
- **Codigos**: prefixo `NTF` registrado (`PrefixoCodigoErro`, dono `notificacao`) e `NTF-400-001`/
  `NTF-404-001` publicados no `CatalogoCodigosErro`; particao, convencao e enum do OpenAPI verdes. A
  lista congelada (`CodigosPublicadosNaoMudamTest`) e o `CODIGOS-DE-ERRO.md` recebem os dois no
  fechamento, como a manutencao da Sprint 37 prescreve.
- **Dois defeitos achados pelos testes, corrigidos no codigo, nao no teste**:
  1. A primeira marcacao devolvia `lidaEm` com nanossegundos do relogio Java e a segunda o valor
     relido do PostgreSQL (microssegundos): o mesmo instante com dois valores para o cliente. O
     `CentralNotificacoesIT` reprovou; os casos de uso do modulo passam a truncar o relogio em
     microssegundos.
  2. Em OpenAPI 3.1 o springdoc descarta `nullable = true` — o documento inteiro tem **zero**
     ocorrencias de `null`, e o precedente do Pix (`mensagemPublica`) perde a marca do mesmo jeito.
     Declarar `lidaEm`/`referencia` como `required` publicaria "string nao nula" para campo que chega
     nulo; os dois ficaram fora do `required`, com a nulidade na descricao.
- **Guarda existente ajustada**: `CatalogoCodigosErroContratoTest` fixa a contagem exata de rotas;
  98 -> 101, as tres da central, conferidas no documento de runtime.
- **Testes**: 35 novos — `CentralNotificacoesIT` (8, JWT e banco reais: A/B com conferencia de
  `lida_em` no banco, e-mail fora da central, vazio, paginacao, 404/400, 401 nos tres, OpenAPI x
  resposta real), `CentralNotificacoesPersistenceAdapterTest` (6), `NotificacaoControllerTest` (8),
  casos de uso (11), truncagem (2). `./gradlew clean build` exit 0: **2414 testes, 0 falhas, 0 erros,
  387 classes**; `spotlessCheck` exit 0.
- **Mutacoes** (8 aplicadas, 8 mortas por comportamento, 0 por compilacao, restauracao por `cmp`):
  listar, contar e marcar sem dono (cada uma morta pelo IT A/B e pelo teste do adapter); limite de
  pagina em 101; leitura sobrescrevendo a primeira; relogio sem truncar; resposta vazando `canal`;
  `lidaEm` declarado obrigatorio no OpenAPI.
- **Code review do commit `e8e6b02` — hotfix de desempenho**: as consultas derivadas passavam o canal
  como parametro (`canal=?`), e os indices da V61 sao parciais em `canal = 'IN_APP'`. Medido com
  200 mil notificacoes em transacao revertida: com `plan_cache_mode = force_generic_plan`, listagem e
  contagem faziam `Parallel Seq Scan` (custo ~12.000); com o literal no SQL, `Index Only Scan` em
  `idx_notificacao_central` (39 e 195) e `Index Scan` em `idx_notificacao_nao_lidas` (12). Consultas da
  central passaram a JPQL com `CanalNotificacao.IN_APP` literal, e o SQL emitido foi conferido
  (`canal='IN_APP'`). Guarda nova com `StatementInspector`
  (`consultasDaCentral_chegamAoBancoComOCanalLiteral`); a mutacao que volta ao canal parametrizado so
  morre nela. Suite: **2415 testes, 0 falhas**; `spotlessCheck` exit 0.

## Task 38.5 - Absorver email de lockout

### Step 038.5.1 - Substituir consumidor legado

Conectar `LockoutService` ao contrato novo, preservando destinatario, condicao, assunto e conteudo
vigente, salvo ajuste justificado no checkpoint. Usar origem estavel do bloqueio conforme ADR.
Remover `shared.email` depois de provar ausencia de consumidores, inclusive configuracoes e testes.
Nao redirecionar consumidores da cobranca.

### Step 038.5.2 - Envio, trilha e falha

Testar bloqueio real ate adapter fake e historico persistido: ambos devem existir. Com provider
lancando, verificar bloqueio/audit persistidos, resultado da autenticacao preservado e falha
registrada conforme ADR. Cobrir repeticao do mesmo bloqueio e bloqueio posterior. O rollback esperado
do login nao pode apagar a trilha; apenas `verify(provider)` nao prova persistencia.

**Pronto quando**:

- [x] Email acionado com historico; falha nao desfaz bloqueio/audit.
- [x] `shared.email` removido e cobranca intacta.

**Commit sugerido**: `refactor(identity): registrar notificacoes de lockout no modulo transversal`

**Resultado medido (2026-09-14)**:

- **Desenho (ADR 0021 §1)**: `LockoutService.avaliarPosFalha` grava o audit `LOCKOUT` e publica
  `identity.domain.event.ContaBloqueadaEvent(usuarioId, username, bloqueadaEm, lockoutMinutes)`, sem
  chamar e-mail. `notificacao.application.listener.ContaBloqueadaListener` consome em `AFTER_COMMIT`
  e chama `NotificarUsuarioUseCase.enviarEmail` com a origem `CONTA_BLOQUEADA` + instante do bloqueio
  em UTC. Assunto e corpo **identicos** aos do `EmailService` antigo. O `identity` nao depende do
  `notificacao`.
- **Desvio declarado dos steps**: o step pedia conectar o `LockoutService` "ao contrato novo"; o ADR
  aceito trocou a chamada direta por evento. Com `usuarioId` nulo (username inexistente, status que
  nao conta falha) o evento nao e publicado; o audit continua.
- **`shared.email` removido** (`EmailService`, `LogEmailService`, `LogEmailServiceTest`) depois de
  `grep` sem consumidor em `src/main`, `src/test` e `*.yml`. Cobranca intocada.
- **Ambiente**: o `LockoutLoginIT.limpar()` faz `usuarioRepository.deleteAll()` no `sep_test`; com o
  historico gravado, travaria na FK. Passa a apagar `notificacao` antes. Unico IT que provoca lockout.
- **Provas**:
  - `LockoutLoginIT` (adapter de log real): bloqueio real grava **uma** linha `CONTA_BLOQUEADA` /
    `EMAIL` / `SIMULADA`, mesmo com as tentativas barradas seguintes.
  - `ContaBloqueadaNotificacaoIT` (provider simulado): com o provider lancando, as 5 tentativas
    respondem `401` (nao `500`), a 6a `423`, o audit `LOCKOUT` persiste e o historico registra
    `FALHOU` com `java.lang.IllegalStateException`; mesmo bloqueio publicado duas vezes (inclusive em
    outro fuso) gera uma linha e um envio; bloqueio 45 min depois gera a segunda; evento de transacao
    revertida nao gera nada.
  - `LockoutServiceTest`: evento publicado com os quatro campos; sem usuario, audit sim e evento nao.
  - `ContaBloqueadaListenerTest`: conteudo byte a byte, origem independente de fuso, falha nao sobe e
    log sem endereco nem mensagem.
- **Suite**: `./gradlew clean build` exit 0: **2421 testes, 0 falhas, 0 erros, 388 classes** (+7 novos,
  -1 removido); `spotlessCheck` exit 0.
- **Mutacoes** (6 aplicadas, 6 mortas por comportamento, 0 por compilacao, restauracao por `cmp`):
  listener em `AFTER_COMPLETION`; lockout sem publicar; origem com fuso local; lockout na central em vez
  de e-mail; listener repassando a excecao; evento publicado sem usuario. **A do listener repassando a
  excecao so morre no teste unitario**: o Spring ja descarta excecao de listener `AFTER_COMMIT`, entao o
  `catch` e defesa redundante — nao muda a resposta do login, so garante o log sem dado pessoal.

## Task 38.6 - Pix concluido gera notificacao in-app

### Step 038.6.1 - Unico gatilho novo

Consumir `PixTransferenciaConcluidaEvent`, traduzindo para o contrato novo. Usar `transferenciaId`
como origem e destinatario confirmado no Gate. Persistir somente campos permitidos; nao copiar
`externalId` nem serializar evento inteiro por conveniencia. Mensagem informa conclusao do desembolso
sem prometer alem do estado confirmado do Pix.

### Step 038.6.2 - Integracao transacional

Exercitar transicao real pelo sincronizador e eventos do Spring. Apos commit, consultar central como
tomador e encontrar item `IN_APP` nao-lido. Provocar rollback da origem e exigir ausencia do item.
Provocar falha de notificacao e comprovar desembolso concluido no banco. Se `IN_APP` nao usa provider
externo, falhar sua porta efetiva de gravacao/entrega: mock SMTP nunca chamado nao prova isolamento.
Excecao de provider de email fica coberta tambem na Task 38.5; declarar essa distincao na evidencia.

**Pronto quando**:

- [x] Evento produz item para tomador correto sem envio externo adicional.
- [x] Commit, rollback e falha exercitados com transacoes efetivas.

**Commit sugerido**: `feat(notificacao): avisar tomador sobre desembolso Pix concluido`

**Resultado medido (2026-09-14)**:

- **Gatilho**: `DesembolsoPixConcluidoListener` consome `PixTransferenciaConcluidaEvent` em `AFTER_COMMIT` e
  chama `disponibilizarNaCentral(tomadorId, origem = transferenciaId, conteudo)`. Titulo
  "Desembolso concluido", mensagem "A transferencia Pix do desembolso do seu contrato foi concluida." —
  afirma so o estado confirmado, sem prometer credito na conta. Referencia `CONTRATO` + `contratoId`;
  `externalId` nunca e lido. Sem `tomadorId`, nao ha destinatario e nada e gravado.
- **Transicao real** (`DesembolsoPixConcluidoNotificacaoIT`, `sep_test`, JWT real):
  `ConsultarStatusDesembolsoPixUseCase` -> `FakePixProvider` (`CONCLUIDA`) -> `SincronizadorStatusTransferencia`
  -> evento do Spring -> listener. Depois do commit, o tomador ve o item nao lido na central com a
  referencia do contrato, o contador vai a 1, outra conta continua em 0, a linha e `IN_APP`/`DISPONIVEL`
  e o `EnvioEmailPort` nunca e chamado.
- **Rollback da origem**: a mesma consulta dentro de transacao revertida deixa a transferencia
  `SOLICITADA` e nenhuma notificacao; a porta de gravacao nem e chamada.
- **Falha da notificacao**: como `IN_APP` nao tem provider, a falha provocada e da **porta de gravacao**
  (`NotificacaoPort.registrarSeInedita` lancando `DataAccessResourceFailureException`, via
  `@MockitoSpyBean`). O desembolso fica `CONCLUIDA` no banco e o audit `PIX_TRANSFERENCIA_CONCLUIDA`
  continua gravado. A falha de provider de e-mail esta coberta na 38.5.
- **FK no `sep_test`, medida**: nenhum IT existente conclui transferencia pelo sincronizador — os que
  precisam de `CONCLUIDA` semeiam direto no dominio, sem evento. Na suite inteira o log "nao registrada"
  so aparece nos tres testes que provocam a falha de proposito.
- **Suite**: `./gradlew clean build` exit 0: **2429 testes, 0 falhas, 0 erros, 390 classes** (+8);
  `spotlessCheck` exit 0.
- **Mutacoes** (5 aplicadas, 5 mortas por comportamento, 0 por compilacao, restauracao por `cmp`):
  gatilho por `EMAIL` em vez de `IN_APP` (mutacao obrigatoria da spec: morre no IT, pelo canal e pelo
  envio); listener em `AFTER_COMPLETION`; listener repassando a excecao; origem pelo `externalId`;
  destinatario trocado pelo contrato. A do listener repassando a excecao **so morre no unitario**, e agora
  isso esta medido tambem no Pix: com a porta lancando, o `executar` do desembolso nao ve a excecao.

## Task 38.7 - Replay, minimizacao e mutacao

### Step 038.7.1 - Replay pelo evento

Publicar o mesmo evento duas vezes pelo publisher, em transacoes confirmadas; exigir uma linha e
um incremento no contador. Nao usar a guarda do sincronizador para impedir a segunda publicacao.
Complementar com concorrencia, destinatarios distintos para mesma origem e origens distintas para
mesmo destinatario: deduplicacao nao pode suprimir notificacao legitima. Conferir estado persistido.

### Step 038.7.2 - Payload por allowlist

Testar campos permitidos por tipo e entradas sensiveis nos pontos possiveis: CPF, CNPJ, chave Pix,
documento bruto e segredos. Conferir banco, HTTP e logs novos. Blacklist de nomes sozinha nao basta:
dados podem entrar em variavel, mensagem, `externalId` ou excecao. Persistir motivo sanitizado de falha.

### Step 038.7.3 - Mutacoes verificadas

Um mutante por vez: conferir aplicacao no arquivo, executar teste, registrar falha esperada,
restaurar somente o trecho alterado e confirmar verde/diff sem residuo. Erro de compilacao nao
substitui falha comportamental.

| Mutante | Prova exigida |
|---|---|
| Retirar owner da lista | Teste A/B detecta item ou total de B |
| Retirar owner do contador | Teste A/B detecta contagem de B |
| Retirar owner da marcacao | Teste detecta alteracao indevida persistida |
| Desabilitar deduplicacao efetiva | Replay do evento reprova por duplicidade |
| Trocar `IN_APP` por `EMAIL` no gatilho | Teste reprova canal e efeito |
| Propagar falha da notificacao para origem | Integracao detecta erro/perda da transacao critica |
| Permitir payload sensivel | Teste reprova persistencia/exposicao |

Se a constraint mantiver deduplicacao apos retirar guarda da aplicacao, registrar a defesa e testar
constraint separadamente em base descartavel. Nao afirmar eficacia com mutante que nao removeu a
protecao real. Investigar sobreviventes ou justificar equivalencia; nao ocultar resultados.

**Pronto quando**:

- [x] Replay, concorrencia e payload comprovados; mutacoes obrigatorias mortas.
- [x] Matriz registra comandos, resultados, sobreviventes e restauracao.

**Commit sugerido**: `test(notificacao): provar isolamento replay e minimizacao`

**Resultado medido (2026-09-14)** — `NotificacaoReplayEMinimizacaoIT` (5 testes, `sep_test`, JWT real):

- **Replay pelo publisher**: o mesmo `PixTransferenciaConcluidaEvent` publicado duas vezes, cada uma em
  transacao confirmada, gera **uma** linha e `naoLidas = 1` pela API. A guarda do sincronizador nao
  participa. Mesma origem para outro destinatario e outra origem para o mesmo destinatario sao
  notificadas (A = 2, B = 1).
- **Concorrencia**: duas publicacoes simultaneas do mesmo evento geram uma linha. **Limite medido, e
  anterior a sprint**: cada publicacao segura a conexao da transacao de origem durante o `AFTER_COMMIT`
  e pede outra para o `REQUIRES_NEW`. Com o pool de 5 do perfil `test` (timeout 15 s), oito threads
  falham (`CannotCreateTransactionException`, 3 de 8) **tambem so com o listener de audit do Pix da
  Sprint 20** (15,1 s); com audit e notificacao, 30,0 s; com duas threads, 0 falhas em 70 ms. A corrida
  na constraint com oito threads segue provada sem transacao externa no
  `NotificacaoPersistenceAdapterTest`. Follow-up: dimensionar pool >= 2x as requisicoes concorrentes que
  publicam evento com listener `REQUIRES_NEW`, ou listener assincrono (exige rever ADR 0021 §6).
- **Minimizacao por valor**: `externalId` com CPF (com e sem mascara), CNPJ, chave Pix e token Bearer;
  username com CPF; excecao do provider com endereco, CPF e token. Nenhum desses valores aparece no
  `row_to_json` da linha, na resposta HTTP da central nem nos logs do pacote `notificacao`. Allowlist
  por tipo conferida coluna a coluna: Pix = texto fixo + origem `transferenciaId` + `CONTRATO`; lockout
  = texto fixo + origem pelo instante UTC, sem referencia, `motivo_falha = java.lang.IllegalStateException`.

**Matriz de mutacoes** (codigo de `1a6c72a`, um mutante por vez, ancora conferida por contagem unica,
`./gradlew test --tests 'com.dynamis.sep_api.notificacao.*'`, restauracao por backup + `cmp`, resíduo
de `notificacao` apagado entre rodadas; nenhum sobrevivente, nenhuma morte por compilacao):

| Mutante | Aplicacao | Mortos por |
|---|---|---|
| Retirar dono da lista | JPQL `(n.usuarioId = :usuarioId or 1 = 1)` | IT A/B da central; adapter `listar_soInAppDoDono` |
| Retirar dono do contador | idem na contagem de nao lidas | IT A/B; adapter; IT do Pix (contador da outra conta); IT de replay |
| Retirar dono da marcacao | `findById` no lugar da busca com dono e canal | IT A/B; IT e-mail fora da central; adapter |
| Desabilitar deduplicacao efetiva | V61 com indice **nao unico**, base descartavel `sep_test_mut38` (`indexdef` conferido) | replay pelo evento (2 linhas), paralelo (2), reavaliacao do bloqueio (2), adapter replay e concorrencia (8 linhas), esquema |
| Retirar so a guarda da aplicacao | adapter repassa a violacao da chave | adapter replay e concorrencia; **ITs de evento seguem verdes** — defesa registrada: a constraint mantem uma linha e o listener engole a excecao |
| Trocar `IN_APP` por `EMAIL` no gatilho | listener Pix chama `enviarEmail` | IT do Pix (canal e envio); IT de replay e payload; unitario |
| Propagar falha para a origem | listener Pix em `BEFORE_COMMIT` **e** repassando a excecao | IT do Pix: desembolso deixa de ficar `CONCLUIDA`; unitario |
| Permitir payload sensivel — Pix | `externalId` concatenado na mensagem | IT de payload; unitario |
| Permitir payload sensivel — lockout | username concatenado no corpo | IT de payload; unitario |
| Permitir payload sensivel — motivo | `getMessage()` no lugar do nome da classe | IT de payload; IT do lockout; unitarios do caso de uso |

**Registro honesto de uma rodada invalida**: a primeira execucao da deduplicacao usou a base
`sep_ensaio38_mut`, e os ITs recusam base cujo nome nao contem `sep_test` — metade das "mortes" foi
pela guarda de ambiente. Refeita em `sep_test_mut38`; a tabela registra so a rodada valida (6 mortes
por comportamento). A mutacao "propagar falha" so com `throw` no listener nao chega a origem (medido na
38.5 e na 38.6); a que chega exige `BEFORE_COMMIT`.

## Task 38.8 - Documentacao operacional e consumidores

### Step 038.8.1 - Operacao e retencao

Atualizar [NOTIFICACOES](../../repos/sep-api/NOTIFICACOES.md) com os dois caminhos: novo historico
(Pix in-app/email lockout) e cobranca legada. Documentar estados, contratos, simulacao, falhas,
limites de recuperacao, prazo e procedimento de retencao do ADR. Nao anunciar reenvio, retry ou
expurgo automatico inexistentes.

### Step 038.8.2 - Rastreabilidade

Atualizar docs Pix/seguranca afetadas, collections existentes e exemplos dos endpoints sem dados
pessoais/credenciais. Registrar follow-ups no STATE: migracao da regua e remocao do enum duplicado;
revisao juridica de retencao/opt-out; cobertura futura por personas; push gated. Atualizar roadmap,
spec e registro da fase com resultados medidos, sem declarar merge antecipado.
Fornecer OpenAPI e exemplos para F-27/M-19; snapshots e telas ficam nas sprints consumidoras.
Central vazia para usuario sem desembolso e limite esperado deste primeiro gatilho.

**Pronto quando**:

- [x] Docs e collections coerentes com comportamento e ADR.
- [x] Follow-ups tem destino; consumidores sabem qual contrato usar.

**Resultado medido (2026-09-14)** — so `docs-SEP` (working tree), nenhum arquivo no `sep-api`:

- `repos/sep-api/NOTIFICACOES.md` reescrito em dois caminhos: modulo `notificacao` (quem e avisado de que,
  estados, contrato da central, idempotencia, tabela de falhas com o que o sistema garante e o que
  **nao** garante, consulta de e-mails `PENDENTE`, dados que nunca entram, retencao de 5 anos com
  procedimento manual, pendencias da Fase 5) e a regua de cobranca como legado, com a hierarquia de
  titulos rebaixada. Nao anuncia reenvio, retry nem expurgo automatico.
- `docs-sep/SEGURANCA.md` §lockout: o e-mail sai pelo modulo via `ContaBloqueadaEvent`; o texto antigo
  sobre `LogEmailService` saiu. `repos/sep-api/PIX.md`: conclusao do desembolso gera aviso na central.
- **Collections**: pasta "Notificacoes (Sprint 38)" com os tres requests e variavel `notificacaoId` no
  Postman (`{{clienteToken}}`) e no Insomnia (`{{ clienteAccessToken }}`); 150 -> 153 requests, sem dado
  pessoal. A primeira gravacao reformatou os dois JSON inteiros (indentacao detectada errada); restaurado
  do backup e refeito com o formato original reproduzido byte a byte (indent 1, UTF-8, quebra final) —
  diff final +201/-1.
- `AI-ROADMAP.md`: linha do modulo `notificacao`, entrada em "Se a tarefa menciona" e bloco da Sprint 38,
  como "implementada na branch, merge pendente". `PRD-FASE-4.md`: linha da 38 idem.
- **Follow-ups com destino** (registro no `STATE.md` no fechamento): migrar a regua de cobranca e
  remover o `CanalNotificacao` duplicado; revisao juridica de retencao e opt-out; cobertura por personas
  (frente B); push (frente D, gated); adapter real de e-mail com envio assincrono; limite de pool do
  padrao `AFTER_COMMIT` + `REQUIRES_NEW`; acentuacao do texto exibido na central (decisao de produto).
- **Consumidores** (F-27/M-19): contrato no OpenAPI do runtime e na secao "Contrato da central" do
  `NOTIFICACOES.md`; snapshot e telas ficam nas sprints consumidoras.

**Commit sugerido**: `docs(notificacao): documentar historico canais e limites operacionais`
(somente se houver arquivos no `sep-api`; git de `docs-SEP` permanece manual).

## Fechamento

- [x] `./gradlew clean build` e `./gradlew spotlessCheck` verdes na ponta final, testes >= baseline,
  zero falhas/erros. Reexecutar checks afetados se hooks modificarem arquivos.
- [x] Oito aceites da spec rastreados: gates (38.0/fechamento), migration (38.2), owner (38.4/38.7),
  replay (38.7), falha (38.5/38.6), payload (38.7), mutacoes (38.7), email/historico (38.5).
- [x] Regressoes de cobranca, Pix e autenticacao verdes; codigos publicados preservados. Se novos
  codigos existirem, incluir no registro/catalogo e lista congelada da Sprint 37.
- [x] Smoke contra `:8080` com dados controlados: concluir Pix, listar/contar como A, marcar lida,
  recontar e negar acesso cruzado como B. Se inviavel, declarar motivo/limite conforme spec;
  nao chamar mock de smoke real.
- [x] Revisao final focada em transacoes, ownership, unique parcial, retencao e logs.
- [x] Criar descricao temporaria `repos/sep-api/SPRINT-38-PR.md` com commits, testes, migration,
  decisoes, limites e follow-ups; atualizar STATE e historico conforme AGENT.
- [ ] Checkpoint antes de commit; push/PR pelo responsavel. Apos integracao, conferir conteudo
  de `develop`/`main` e eventual back-merge; nao presumir equivalencia por hash.

**Resultado da preparacao**: roteiro disponivel. ADR, baseline, migration, codigo e testes ainda
pendentes de execucao; nenhum resultado foi presumido a partir destes steps.

**Resultado do fechamento (2026-09-14)**:

- **Codigos congelados**: `NTF-400-001` e `NTF-404-001` em `CodigosPublicadosNaoMudamTest` (143 -> 145).
  Mutacao: renomear `NTF-404-001` no fonte **e** no catalogo passa na particao e na convencao e so a lista
  congelada reprova — a garantia que a Sprint 37 descreveu.
- **Suite final** da branch: `./gradlew clean build` e `spotlessCheck` exit 0 (numeros no checkpoint do
  commit de fechamento).
- **Smoke real** contra `:8080` (perfil `dev`, `bootRun`): 20 de 20 verificacoes — cadastro e login de A e
  B; transferencia `SOLICITADA` semeada por SQL e concluida por webhook `pix.transfer.status` assinado
  com HMAC; aviso nao lido na central de A com a referencia do contrato e sem `externalId`; contagem 1,
  marca, reconta 0, remarca com o mesmo `lidaEm`; B com lista vazia e `404 NTF-404-001` ao marcar o aviso
  de A, que segue nao lido no banco; `400 NTF-400-001` com `size=101`; `401` sem token; bloqueio real de B
  com `CONTA_BLOQUEADA`/`EMAIL`/`SIMULADA` e nenhum endereco gravado. Todos os dados do smoke apagados do
  `sep_dev` (usuarios, notificacoes, transferencia, evento de webhook, tentativas e audit), conferido por
  contagem.
- **Revisao final**: um code review por Task (38.2 a 38.7), com hotfix na 38.4 (indices parciais); nenhum
  achado bloqueante aberto.
- **Merge conferido (2026-09-14)**: `develop` (#112 squash `9703432` + back-merge `98d427c`, `--cc` vazio) e
  `main` (#113 `57b770b`) na mesma arvore `6b3aab2` da branch verificada `b54e692`; proximo back-merge
  previsto limpo por `merge-tree`.
- **Pendente do responsavel**: review humano de fim de sprint; destino do `SPRINT-37-PR.md`.
