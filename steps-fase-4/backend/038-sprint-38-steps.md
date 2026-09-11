# Steps - Sprint 38 - Modulo de notificacao, historico e canal in-app

**Spec**: [038](../../specs/fase-4/038-sprint-38-modulo-notificacao-historico.md).
**Status**: steps criados em 2026-09-11; implementacao nao iniciada.
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

- [ ] Base, branch, ambiente e baseline documentados; divergencias tratadas.
- [ ] Inventario conferido, incluindo identidade do destinatario e transacoes efetivas.
- [ ] Banco de ensaio, V61 e numero do ADR confirmados.

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

- [ ] Dominio/persistencia testados, inclusive repeticao concorrente da chave.
- [ ] Aplicacao e reversao nos dois cenarios registradas com evidencias e limites.

**Commit sugerido**: `feat(notificacao): persistir historico por usuario com idempotencia`

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

- [ ] Compatibilidade dos enums testada; cobranca preservada.
- [ ] `IN_APP` nao envia email/SMS; resultados respeitam o ADR.

**Commit sugerido**: `feat(notificacao): adicionar canal in-app e adapters de envio`

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

- [ ] Owner comprovado nos tres endpoints e na persistencia.
- [ ] Vazio e erro distintos; OpenAPI coincide com respostas reais.

**Commit sugerido**: `feat(notificacao): expor central restrita ao destinatario`

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

- [ ] Email acionado com historico; falha nao desfaz bloqueio/audit.
- [ ] `shared.email` removido e cobranca intacta.

**Commit sugerido**: `refactor(identity): registrar notificacoes de lockout no modulo transversal`

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

- [ ] Evento produz item para tomador correto sem envio externo adicional.
- [ ] Commit, rollback e falha exercitados com transacoes efetivas.

**Commit sugerido**: `feat(notificacao): avisar tomador sobre desembolso Pix concluido`

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

- [ ] Replay, concorrencia e payload comprovados; mutacoes obrigatorias mortas.
- [ ] Matriz registra comandos, resultados, sobreviventes e restauracao.

**Commit sugerido**: `test(notificacao): provar isolamento replay e minimizacao`

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

- [ ] Docs e collections coerentes com comportamento e ADR.
- [ ] Follow-ups tem destino; consumidores sabem qual contrato usar.

**Commit sugerido**: `docs(notificacao): documentar historico canais e limites operacionais`
(somente se houver arquivos no `sep-api`; git de `docs-SEP` permanece manual).

## Fechamento

- [ ] `./gradlew clean build` e `./gradlew spotlessCheck` verdes na ponta final, testes >= baseline,
  zero falhas/erros. Reexecutar checks afetados se hooks modificarem arquivos.
- [ ] Oito aceites da spec rastreados: gates (38.0/fechamento), migration (38.2), owner (38.4/38.7),
  replay (38.7), falha (38.5/38.6), payload (38.7), mutacoes (38.7), email/historico (38.5).
- [ ] Regressoes de cobranca, Pix e autenticacao verdes; codigos publicados preservados. Se novos
  codigos existirem, incluir no registro/catalogo e lista congelada da Sprint 37.
- [ ] Smoke contra `:8080` com dados controlados: concluir Pix, listar/contar como A, marcar lida,
  recontar e negar acesso cruzado como B. Se inviavel, declarar motivo/limite conforme spec;
  nao chamar mock de smoke real.
- [ ] Revisao final focada em transacoes, ownership, unique parcial, retencao e logs.
- [ ] Criar descricao temporaria `repos/sep-api/SPRINT-38-PR.md` com commits, testes, migration,
  decisoes, limites e follow-ups; atualizar STATE e historico conforme AGENT.
- [ ] Checkpoint antes de commit; push/PR pelo responsavel. Apos integracao, conferir conteudo
  de `develop`/`main` e eventual back-merge; nao presumir equivalencia por hash.

**Resultado da preparacao**: roteiro disponivel. ADR, baseline, migration, codigo e testes ainda
pendentes de execucao; nenhum resultado foi presumido a partir destes steps.
