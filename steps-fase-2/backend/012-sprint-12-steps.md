# Steps - Sprint 12 - Cobranca (parcelas e agenda)

**Spec de origem**: [`specs/fase-2/012-sprint-12-cobranca-parcelas-agenda.md`](../../specs/fase-2/012-sprint-12-cobranca-parcelas-agenda.md)

**Status**: a implementar.

**Objetivo geral**: criar o modulo `cobranca` para gerar agenda de pagamento apos contrato assinado, calcular parcelas Price/SAC, registrar recebimentos manuais, atualizar status das parcelas, gerar movimentacao segregada no `escrow` e preparar eventos para inadimplencia na Sprint 13.

**Esforco total estimado**: 8-12 dias de Dev Senior.

**Repo de destino**:
- `sep-api`: backend Spring Boot, unico repo de codigo alterado nesta sprint.
- `docs-SEP`: documentacao pode ser editada no working tree quando necessario, mas operacao git continua manual.

**Branch sugerida**:
- `feature/sprint-12-cobranca-parcelas-agenda`

**Pre-requisitos globais**:
- Sprint 11 concluida, revisada e mergeada em `develop`.
- `sep-api` em `develop` atualizado a partir de `origin/develop`.
- Modulo `contratos` com `ContratoAssinadoEvent` publicado apos assinatura digital confirmada.
- Modulo `credito` com dados minimos de proposta aprovados para valor, prazo e condicoes financeiras.
- Modulo `escrow` com ponto de extensao interno para registrar movimentacao segregada; se o use case publico ainda nao existir, criar a porta minima dentro da Task 12.4 sem integrar Celcoin real.
- Role `FINANCEIRO` disponivel.
- `audit_log_seguranca` funcional e extensivel.
- ADRs 0001, 0005 e 0007 vigentes.

**Fora de escopo**:
- Pix, boleto, conciliacao bancaria automatica ou webhook de pagamento real.
- Cobranca ativa, notificacoes, negativacao, renegociacao e recuperacao de credito.
- Dashboard financeiro ou backoffice operacional.
- Desembolso.
- IOF, CET completo ou memoria juridica definitiva dos encargos.
- Telas web/mobile.

**Protocolo obrigatorio por Task**:
- Implementar somente a Task liberada pelo usuario.
- Ao concluir a implementacao e a verificacao da Task, parar em checkpoint pre-commit com arquivos alterados, testes executados, riscos e sugestao de commit.
- Aguardar `commit` ou aprovacao equivalente antes de stage/commit.
- Depois do commit principal, rodar `chown -R mauricio:mauricio .git .claude` no `sep-api`.
- Fazer exatamente 1 code review automatizado da Task.
- Se houver hotfix, implementar, parar em novo checkpoint pre-commit, aguardar aprovacao e commitar; nao rodar novo review automatizado salvo pedido explicito.
- Ao final da Task, pausar para review manual do usuario. Nao iniciar a proxima Task sem ordem explicita.

---

## Ordem de execucao recomendada

```text
12.0 (prechecks)
  |
  v
12.1 (dominio + migrations cobranca)
  |
  +--> 12.2 (calculadoras financeiras)
  |
  v
12.3 (geracao de agenda + listener ContratoAssinadoEvent)
  |
  v
12.4 (recebimento manual + escrow)
  |
  +--> 12.5 (calculo atualizado + job de atraso)
  |
  v
12.6 (REST + DTOs + OpenAPI)
  |
  v
12.7 (auditoria reforcada)
  |
  v
12.8 (IT/E2E)
  |
  v
12.9 (documentacao + collections + validacao final)
```

- 12.1 deve estabilizar tabelas, entidades, status e eventos antes dos use cases.
- 12.2 pode avancar em paralelo com 12.1 apos fechamento dos campos financeiros.
- 12.3 depende das calculadoras e do evento `ContratoAssinadoEvent`.
- 12.4 depende da agenda persistida e deve fechar a integracao interna com `escrow`.
- 12.5 pode compartilhar calculadoras com 12.4, mas deve usar `Clock` injetado para testes deterministicos.
- 12.6 so deve expor endpoints depois que os use cases estiverem fechados.
- 12.7 deve estar pronta antes do IT para validar audit log.
- 12.9 marca PRD como executado apenas apos implementacao validada e mergeada.

---

## Task 12.0 - Prechecks da Sprint 12

**Objetivo**: garantir que a Sprint 12 nasce de `develop` atualizado, com Sprint 11 integrada e baseline verde.

**Esforco**: 1-2 horas.

### Step 012.0.1 - Conferir estado Git do `sep-api`

**Comandos**:
```bash
cd <sep-api-root>
git fetch --all --prune
git status --short --branch
git rev-list --left-right --count HEAD...origin/develop
```

**Verificacao**:
- Working tree limpo antes de criar branch.
- Branch local alinhada a `origin/develop`.
- Se houver mudancas locais, identificar se sao do usuario; nao reverter.

### Step 012.0.2 - Criar branch da sprint

**Comandos**:
```bash
cd <sep-api-root>
git switch develop
git pull --ff-only
git switch -c feature/sprint-12-cobranca-parcelas-agenda
```

**Verificacao**:
- Branch criada a partir de `develop` atualizado.
- Se `git pull --ff-only` falhar, abortar e avisar o usuario.

### Step 012.0.3 - Rodar baseline backend

**Comandos**:
```bash
cd <sep-api-root>
./gradlew clean test
./gradlew bootJar
```

**Verificacao**:
- Suite passa antes de qualquer alteracao.
- Se os testes dependem de PostgreSQL local, subir Docker Compose conforme README do `sep-api`.

### Step 012.0.4 - Conferir pontos de extensao

**Comandos**:
```bash
cd <sep-api-root>
find src/main/resources/db/migration -maxdepth 1 -type f | sort
grep -R "ContratoAssinadoEvent" -n src/main/java/com/dynamis/sep_api/contratos
grep -R "class PropostaCredito" -n src/main/java/com/dynamis/sep_api/credito
grep -R "prazo\|valor\|taxa" -n src/main/java/com/dynamis/sep_api/credito
grep -R "ContaEscrow\|Wallet\|MovimentacaoEscrow" -n src/main/java/com/dynamis/sep_api/escrow
grep -R "TipoEventoSeguranca\|AuditLogSegurancaTipo" -n src/main/java/com/dynamis/sep_api
grep -R "Role.FINANCEIRO\|FINANCEIRO" -n src/main/java/com/dynamis/sep_api
grep -R "@Scheduled\|EnableScheduling" -n src/main/java/com/dynamis/sep_api
```

**Verificacao**:
- Proximo numero livre de migration confirmado.
- Payload de `ContratoAssinadoEvent` tem `contratoId`, `propostaId` ou caminho confiavel para buscar a proposta.
- Dados de valor, prazo e taxa aprovados estao acessiveis sem acoplar `cobranca` a DTO web.
- Ponto de extensao de `escrow` identificado; se ausente, escopo da Task 12.4 inclui criar use case/porta interna minima.
- Padrao atual de auditoria e role `FINANCEIRO` identificado.
- Agendamento habilitado ou ponto de configuracao identificado.

### Step 012.0.5 - Confirmar parametros financeiros com PO

**Checklist**:
- Sistema de amortizacao default da sprint: `PRICE`.
- Primeira parcela: 30 dias apos `dataAssinatura`.
- Periodicidade: mensal por incremento de meses ou 30 dias corridos. Se o produto nao decidir, usar 30 dias corridos como no spec e registrar pendencia.
- Juros de mora default: 1% ao mes pro rata die.
- Multa default: 2% sobre valor em atraso.
- Encargos adicionais: zero nesta sprint.
- Arredondamento: `RoundingMode.HALF_UP`, escala 2, com ajuste residual na ultima parcela.
- Recebimento manual exige `Idempotency-Key`.

### Definicao de pronto da Task 12.0
- [ ] Branch correta criada.
- [ ] Baseline backend verde.
- [ ] Proximo numero de migration confirmado.
- [ ] Pontos de extensao de contrato, credito, escrow, auditoria e scheduler identificados.
- [ ] Parametros financeiros minimos confirmados ou risco registrado.

---

## Task 12.1 - Dominio, entidades e migrations de cobranca

**Objetivo**: criar o nucleo persistente do modulo `cobranca`.

**Pre-requisito**: Task 12.0 concluida.

**Esforco**: 1-2 dias.

**Arquivos principais**:
- `cobranca/domain/model/AgendaPagamento.java`
- `cobranca/domain/model/ParcelaCobranca.java`
- `cobranca/domain/model/Recebimento.java`
- `cobranca/domain/vo/StatusParcela.java`
- `cobranca/domain/vo/ComposicaoValor.java`
- `cobranca/domain/event/AgendaGeradaEvent.java`
- `cobranca/domain/event/RecebimentoRegistradoEvent.java`
- `cobranca/domain/event/ParcelaPagaEvent.java`
- `cobranca/domain/event/ParcelaAtrasouEvent.java`
- `cobranca/domain/exception/AgendaPagamentoNaoEncontradaException.java`
- `cobranca/domain/exception/ParcelaCobrancaNaoEncontradaException.java`
- `cobranca/domain/exception/ParcelaEstadoInvalidoException.java`
- `cobranca/infrastructure/persistence/AgendaPagamentoRepository.java`
- `cobranca/infrastructure/persistence/ParcelaCobrancaRepository.java`
- `cobranca/infrastructure/persistence/RecebimentoRepository.java`
- `src/main/resources/db/migration/V<n>__criar_tabelas_cobranca.sql`

### Step 012.1.1 - Modelar status e composicao de valores

**Status esperados**:
```text
PENDENTE
PARCIALMENTE_PAGA
PAGA
ATRASADA
INADIMPLENTE
```

**Regras**:
- `INADIMPLENTE` fica reservado para Sprint 13; nesta sprint nao deve ser alcancado pelo job.
- Helpers recomendados: `permiteRecebimento()`, `permiteMarcarAtrasada()`, `isFinal()`.
- Se a base atual usa enums para VOs simples, preferir enum para consistencia e menor atrito, mesmo que o spec cite sealed type.
- `ComposicaoValor` deve usar `BigDecimal` para `principal`, `juros`, `multa`, `encargos` e `total`; `total` deve ser derivado da soma.

### Step 012.1.2 - Criar agregado `AgendaPagamento`

**Campos minimos**:
- `id`, `contratoId`, `numeroParcelas`, `valorTotal`, `dataGeracao`, `parcelas` e campos de auditoria.

**Regras de dominio**:
- 1 agenda por contrato (`contrato_id` unico).
- Agenda nasce com todas as parcelas planejadas.
- Nao permitir agenda sem parcelas.
- Nao permitir numeros de parcela duplicados.
- Nao expor colecao mutavel diretamente.

### Step 012.1.3 - Criar `ParcelaCobranca` e `Recebimento`

**Parcela - campos minimos**:
- `id`, `agenda`, `numero`, valores de composicao, `dataVencimento`, `status`, `recebimentos`.

**Recebimento - campos minimos**:
- `id`, `parcela`, `valorRecebido`, `dataRecebimento`, `meioPagamento`, `identificadorExterno`, `idempotencyKey`, `observacao`, `registradoPor`.

**Regras**:
- Parcela nasce `PENDENTE`.
- `marcarAtrasada()` permitido apenas para `PENDENTE` vencida.
- Recebimento exige `valorRecebido > 0`, data obrigatoria e idempotency key unica.
- Pagamento adicional em parcela `PAGA` deve ser rejeitado nesta sprint, salvo repeticao idempotente do mesmo recebimento.

### Step 012.1.4 - Criar migration de cobranca

**Tabelas esperadas**:
- `agenda_pagamento`
- `parcela_cobranca`
- `recebimento`

**Constraints minimas**:
- `agenda_pagamento.contrato_id UNIQUE REFERENCES contrato(id)`.
- `parcela_cobranca.agenda_id REFERENCES agenda_pagamento(id)`.
- `parcela_cobranca (agenda_id, numero) UNIQUE`.
- `recebimento.parcela_id REFERENCES parcela_cobranca(id)`.
- `recebimento.idempotency_key UNIQUE`.
- Checks para status, valores nao negativos e numero de parcela positivo.
- FKs sem `ON DELETE CASCADE`.

**Indices minimos**:
- `idx_parcela_status_vencimento(status, data_vencimento)`.
- `idx_parcela_agenda(agenda_id)`.
- `idx_recebimento_parcela(parcela_id)`.
- `idx_recebimento_data(data_recebimento DESC)`.

### Step 012.1.5 - Criar repositories e testes

**Consultas esperadas**:
- `AgendaPagamentoRepository.findByContratoId(...)`.
- `AgendaPagamentoRepository.existsByContratoId(...)`.
- `ParcelaCobrancaRepository.findByIdForUpdate(...)`.
- `ParcelaCobrancaRepository.findByStatusAndDataVencimentoBefore(...)`.
- `RecebimentoRepository.findByIdempotencyKey(...)`.

**Testes obrigatorios**:
- `AgendaPagamentoTest`.
- `ParcelaCobrancaTest`.
- `RecebimentoTest`.
- `AgendaPagamentoRepositoryTest`.
- `ParcelaCobrancaRepositoryTest`.
- `RecebimentoRepositoryTest`.

**Comandos sugeridos**:
```bash
cd <sep-api-root>
./gradlew test --tests "*AgendaPagamento*" --tests "*ParcelaCobranca*" --tests "*Recebimento*"
```

### Definicao de pronto da Task 12.1
- [ ] Entidades do modulo `cobranca` criadas sem dependencia de web/DTO.
- [ ] Status e transicoes basicas cobertos por testes.
- [ ] Migration cria tabelas, constraints e indices esperados.
- [ ] Repositories cobertos por testes.
- [ ] Checkpoint pre-commit apresentado ao usuario.

---

## Task 12.2 - Calculadoras financeiras

**Objetivo**: implementar amortizacao Price/SAC e calculo de juros de mora/multa com resultados deterministicos.

**Pre-requisito**: Task 12.1 concluida ou modelo financeiro fechado.

**Esforco**: 1-1,5 dia.

**Arquivos principais**:
- `cobranca/application/service/calculo/CalculadoraAmortizacao.java`
- `cobranca/application/service/calculo/CalculadoraPrice.java`
- `cobranca/application/service/calculo/CalculadoraSAC.java`
- `cobranca/application/service/calculo/CalculadoraJurosMora.java`
- `cobranca/application/service/calculo/CalculadoraMulta.java`
- `cobranca/application/service/calculo/SistemaAmortizacao.java`
- `cobranca/application/service/calculo/ParametrosCobrancaProperties.java`
- `cobranca/application/service/calculo/dto/ParametrosCalculo.java`
- `cobranca/application/service/calculo/dto/ParcelaCalculada.java`
- `cobranca/application/service/calculo/dto/ResultadoCalculo.java`

### Step 012.2.1 - Definir contratos das calculadoras

**Regras**:
- Receber valor financiado, taxa, numero de parcelas e data base.
- Retornar parcelas ordenadas por numero.
- Separar principal, juros remuneratorios, multa, encargos e total.
- Nao usar `double`/`float`.
- Arredondar valores monetarios para escala 2.
- Ajustar diferenca residual na ultima parcela.

### Step 012.2.2 - Implementar Price e SAC

**Price**:
- Parcelas totais iguais ou com ajuste residual na ultima.
- Juros remuneratorios decrescentes.
- Amortizacao crescente.

**SAC**:
- Amortizacao constante.
- Juros decrescentes.
- Parcela total decrescente.

**Testes obrigatorios**:
- 12 parcelas com taxa conhecida.
- 24 parcelas com taxa conhecida.
- Taxa zero.
- Ajuste residual na ultima parcela.
- Soma do principal fecha com o valor financiado.

### Step 012.2.3 - Implementar juros de mora, multa e config

**Regras**:
- Juros de mora default: 1% ao mes pro rata die.
- Multa default: 2% sobre base em atraso.
- Se `dataReferencia <= dataVencimento`, juros e multa devem ser zero.
- Encargos adicionais ficam zero nesta sprint.
- Parametros devem vir de config com defaults seguros.

**Propriedades sugeridas**:
```yaml
app:
  cobranca:
    amortizacao-default: PRICE
    primeira-parcela-dias: 30
    periodicidade-dias: 30
    juros-mora-mensal: 0.01
    multa-atraso: 0.02
    job-atraso-cron: "0 0 2 * * *"
```

### Definicao de pronto da Task 12.2
- [ ] Price e SAC implementadas e testadas.
- [ ] Juros de mora e multa implementados e testados.
- [ ] Configuracoes com defaults documentados no codigo/config.
- [ ] Nenhum calculo financeiro usa `double`/`float`.
- [ ] Checkpoint pre-commit apresentado ao usuario.

---

## Task 12.3 - Geracao de agenda via `ContratoAssinadoEvent`

**Objetivo**: consumir contrato assinado e criar agenda + parcelas de forma idempotente.

**Pre-requisitos**: Tasks 12.1 e 12.2 concluidas.

**Esforco**: 1-2 dias.

**Arquivos principais**:
- `cobranca/application/usecase/GerarAgendaPagamentoUseCase.java`
- `cobranca/application/listener/ContratoAssinadoListener.java`
- `cobranca/application/dto/GerarAgendaPagamentoCommand.java`
- `cobranca/application/port/in/GerarAgendaPagamentoPort.java`, se o padrao local usar porta de entrada.

### Step 012.3.1 - Definir entrada do use case

**Dados necessarios**:
- `contratoId`.
- `propostaId` ou forma de carregar proposta vinculada.
- `tomadorId`, se necessario para ownership posterior.
- `dataAssinatura`.
- Valor financiado.
- Prazo/numero de parcelas.
- Taxa mensal aprovada.

**Regra**:
- Nao inferir taxa, prazo ou valor a partir de texto de contrato. Usar fonte estruturada do dominio.

### Step 012.3.2 - Implementar idempotencia e geracao

**Regras**:
- Se ja existe `AgendaPagamento` para `contratoId`, retornar a agenda existente sem recriar parcelas.
- Concorrencia deve ser protegida por `UNIQUE contrato_id` e tratamento de `DataIntegrityViolationException`.
- Publicar `AgendaGeradaEvent` somente quando uma agenda nova for criada.
- Usar `CalculadoraPrice` por default da Sprint 12.
- Primeira parcela vence 30 dias apos assinatura; seguintes a cada 30 dias, salvo decisao registrada.
- Todas as parcelas nascem `PENDENTE`.
- Persistir agenda e parcelas na mesma transacao.

### Step 012.3.3 - Implementar listener de contrato assinado

**Regras**:
- `@TransactionalEventListener(phase = AFTER_COMMIT)`.
- `@Transactional(propagation = REQUIRES_NEW)` se o padrao local de listeners de contrato ja usa transacao independente.
- Falha ao gerar agenda nao deve desfazer assinatura; deve ser logada com `contratoId` e `correlationId`.
- Reprocessamento manual pode ser feito via use case; endpoint administrativo fica fora do escopo se nao estiver no spec.

### Step 012.3.4 - Testar geracao de agenda

**Testes obrigatorios**:
- `GerarAgendaPagamentoUseCaseTest` com 12 parcelas.
- `GerarAgendaPagamentoUseCaseTest` com 24 parcelas.
- Idempotencia: duas execucoes geram uma agenda.
- Corrida concorrente: unique constraint vira retorno idempotente.
- `ContratoAssinadoListenerTest` confirma chamada do use case apos evento.

### Definicao de pronto da Task 12.3
- [ ] Contrato assinado gera agenda e parcelas automaticamente.
- [ ] Idempotencia coberta em teste.
- [ ] Listener usa padrao transacional ja adotado em `contratos`.
- [ ] `AgendaGeradaEvent` publicado apenas para agenda nova.
- [ ] Checkpoint pre-commit apresentado ao usuario.

---

## Task 12.4 - Registro de recebimento manual e integracao com escrow

**Objetivo**: registrar pagamento de parcela, atualizar status e criar movimentacao segregada no modulo `escrow`.

**Pre-requisitos**: Tasks 12.1 e 12.3 concluidas.

**Esforco**: 1,5-2 dias.

**Arquivos principais**:
- `cobranca/application/usecase/RegistrarRecebimentoUseCase.java`
- `cobranca/application/dto/RegistrarRecebimentoCommand.java`
- `cobranca/application/dto/RegistrarRecebimentoResult.java`
- `cobranca/application/port/out/RegistrarMovimentacaoEscrowPort.java` somente se nao houver porta publica adequada no modulo `escrow`.
- `escrow/application/port/in/RegistrarMovimentacaoEscrowUseCase.java` ou equivalente, se precisar criar o contrato interno de consumo.
- `escrow/application/dto/RegistrarMovimentacaoEscrowCommand.java`, se o use case ainda nao existir.

### Step 012.4.1 - Fechar contrato interno com escrow

**Regras**:
- `cobranca` deve depender de uma porta/use case publico do modulo `escrow`, nao de repository de `escrow`.
- Movimentacao deve representar entrada de recurso na conta/wallet segregada da operacao.
- Adapter Celcoin real fica fora do escopo; a movimentacao e interna/local.
- Se a wallet da operacao ainda nao existir, decidir no checkpoint se a Task cria wallet tecnica local ou se usa conta escrow da proposta/contrato existente.

**Dados minimos da movimentacao**:
- `contratoId` ou `operacaoId`.
- `parcelaId`.
- `recebimentoId`.
- Valor recebido.
- Tipo `ENTRADA_RECEBIMENTO`.
- Data da movimentacao.
- Idempotency key.

### Step 012.4.2 - Implementar idempotencia e atualizacao da parcela

**Regras**:
- `Idempotency-Key` obrigatoria na borda REST e no command do use case.
- Se ja existe recebimento com a mesma key, retornar resultado existente sem criar novo recebimento nem nova movimentacao escrow.
- Unique constraint no banco deve ser a defesa final.
- Usar lock pessimista ou equivalente para evitar dois recebimentos simultaneos corrompendo status.
- `valorRecebido >= valorAtualizado` -> `PAGA`.
- `0 < valorRecebido < valorAtualizado` -> `PARCIALMENTE_PAGA`.
- `valorRecebido > valorAtualizado` -> `PAGA` e observacao registra excedente.
- Recebimento em parcela `PAGA` deve retornar idempotente apenas se a key ja existir; caso contrario, rejeitar com 409.

### Step 012.4.3 - Publicar eventos e testar

**Eventos**:
- `RecebimentoRegistradoEvent` sempre que novo recebimento for persistido.
- `ParcelaPagaEvent` quando a parcela transicionar para `PAGA`.
- Evento/retorno de movimentacao escrow para auditoria, se o modulo `escrow` ja publicar.

**Testes obrigatorios**:
- Pagamento total.
- Pagamento parcial.
- Overpayment.
- Idempotencia por `Idempotency-Key`.
- Novo recebimento em parcela `PAGA` recebe conflito.
- Movimentacao escrow gerada uma unica vez e com valor correto.

### Definicao de pronto da Task 12.4
- [ ] Recebimento manual persistido com idempotencia.
- [ ] Status da parcela atualizado corretamente.
- [ ] Movimentacao escrow criada por recebimento novo.
- [ ] Concorrencia protegida por lock/constraint.
- [ ] Eventos publicados.
- [ ] Checkpoint pre-commit apresentado ao usuario.

---

## Task 12.5 - Valor atualizado, consulta de parcelas e job de atraso

**Objetivo**: calcular valor atualizado de parcelas, consultar agenda/parcelas e marcar atrasos diariamente.

**Pre-requisitos**: Tasks 12.1 e 12.2 concluidas; Task 12.4 pode compartilhar o servico de calculo atualizado.

**Esforco**: 1-1,5 dia.

**Arquivos principais**:
- `cobranca/application/usecase/CalcularValorAtualizadoParcelaUseCase.java`
- `cobranca/application/usecase/ConsultarParcelasUseCase.java`
- `cobranca/application/job/MarcarParcelaAtrasadaJob.java`
- `cobranca/application/dto/ParcelaAtualizadaResult.java`
- `cobranca/application/dto/ConsultarParcelasQuery.java`
- Configuracao de `Clock`, se ainda nao existir bean compartilhado.

### Step 012.5.1 - Implementar calculo de valor atualizado

**Regras**:
- Para `PENDENTE` sem atraso: retornar composicao original.
- Para `PENDENTE` ou `ATRASADA` vencida: adicionar juros de mora e multa conforme config.
- Para `PARCIALMENTE_PAGA`: considerar saldo restante; se o modelo atual nao persistir saldo separado, calcular por soma dos recebimentos.
- Para `PAGA`: retornar valor em aberto zero e preservar composicao historica.
- Usar `Clock` injetado.

### Step 012.5.2 - Implementar consulta e job de atraso

**Filtros de consulta**:
- `contratoId`, `status`, intervalo de vencimento.
- Ordenacao default: `dataVencimento ASC`, `numero ASC`.

**Job**:
- Cron default `0 0 2 * * *`.
- Timezone `America/Sao_Paulo`.
- Buscar parcelas `PENDENTE` com `dataVencimento < hoje`.
- Marcar como `ATRASADA`.
- Publicar `ParcelaAtrasouEvent`.
- Reexecucao nao republica evento para parcela ja `ATRASADA`.

### Step 012.5.3 - Testar calculo e job

**Testes obrigatorios**:
- `CalcularValorAtualizadoParcelaUseCaseTest`.
- `ConsultarParcelasUseCaseTest`.
- `MarcarParcelaAtrasadaJobTest` com `Clock` fixo.
- Reexecucao do job nao duplica evento.

### Definicao de pronto da Task 12.5
- [ ] Valor atualizado calculado com juros/multa para atraso.
- [ ] Consulta de parcelas cobre filtros minimos.
- [ ] Job diario configurado e idempotente.
- [ ] Eventos de atraso publicados uma unica vez por transicao.
- [ ] Checkpoint pre-commit apresentado ao usuario.

---

## Task 12.6 - Endpoints REST, DTOs e OpenAPI

**Objetivo**: expor os contratos REST de cobranca com autorizacao, DTOs e documentacao OpenAPI.

**Pre-requisitos**: Tasks 12.3, 12.4 e 12.5 concluidas.

**Esforco**: 1-1,5 dia.

**Arquivos principais**:
- `cobranca/web/controller/CobrancaController.java`
- `cobranca/web/dto/AgendaPagamentoResponse.java`
- `cobranca/web/dto/ParcelaResponse.java`
- `cobranca/web/dto/RegistrarRecebimentoRequest.java`
- `cobranca/web/dto/RecebimentoResponse.java`
- `cobranca/web/dto/ValorAtualizadoParcelaResponse.java`
- `cobranca/web/mapper/CobrancaWebMapper.java`

### Step 012.6.1 - Expor endpoints

| Metodo | Path | Auth |
|--------|------|------|
| `GET` | `/api/v1/cobranca/contratos/{contratoId}/agenda` | owner ou `ROLE_FINANCEIRO` |
| `GET` | `/api/v1/cobranca/parcelas/{id}` | owner ou `ROLE_FINANCEIRO` |
| `POST` | `/api/v1/cobranca/parcelas/{id}/recebimentos` | `ROLE_FINANCEIRO` + `Idempotency-Key` |
| `GET` | `/api/v1/cobranca/recebimentos` | `ROLE_FINANCEIRO` |

**Regras**:
- `ROLE_ADMIN` pode ser aceito se o padrao atual permitir admin em consultas operacionais.
- Header `Idempotency-Key` ausente deve retornar `400`.
- UUID invalido deve retornar `400` pelo handler compartilhado.

### Step 012.6.2 - Documentar OpenAPI

**Regras**:
- `@Tag(name = "cobranca")`.
- `@Operation` e `@ApiResponses` em todos os endpoints.
- `@Schema` nos DTOs com exemplos coerentes.
- Exemplos nao devem expor CPF/CNPJ real.

### Step 012.6.3 - Testar controller

**Testes obrigatorios**:
- `CobrancaControllerTest` com `@WebMvcTest`.
- Owner consulta agenda com sucesso.
- Financeiro consulta agenda de terceiro.
- Cliente nao registra recebimento (`403`).
- Financeiro registra recebimento com `Idempotency-Key`.
- Header ausente retorna `400`.
- UUID invalido retorna `400`.

### Definicao de pronto da Task 12.6
- [ ] 4 endpoints REST expostos.
- [ ] DTOs e mapper criados.
- [ ] Autorizacao cobre ownership e `ROLE_FINANCEIRO`.
- [ ] OpenAPI completa.
- [ ] Controller tests verdes.
- [ ] Checkpoint pre-commit apresentado ao usuario.

---

## Task 12.7 - Auditoria reforcada de cobranca

**Objetivo**: registrar eventos financeiros sensiveis no audit log de seguranca.

**Pre-requisitos**: Tasks 12.3, 12.4 e 12.5 concluidas.

**Esforco**: 0,5-1 dia.

**Arquivos principais**:
- `src/main/resources/db/migration/V<n>__ampliar_audit_seguranca_tipo_cobranca.sql`.
- Enum/tipo Java atual de audit log (`AuditLogSegurancaTipo`, `TipoEventoSeguranca` ou equivalente).
- `cobranca/application/listener/CobrancaAuditListener.java`.

### Step 012.7.1 - Ampliar tipos e listener

**Tipos esperados**:
```text
AGENDA_GERADA
PARCELA_CRIADA
RECEBIMENTO_REGISTRADO
PARCELA_PAGA
PARCELA_ATRASADA
MOVIMENTACAO_ESCROW_CRIADA
```

**Regras**:
- Migration deve preservar tipos anteriores.
- Consumir `AgendaGeradaEvent`, `RecebimentoRegistradoEvent`, `ParcelaPagaEvent`, `ParcelaAtrasouEvent` e evento/retorno de movimentacao escrow, se existir.
- Dados permitidos: IDs, valor recebido, status de parcela, datas e referencia truncada/hash de idempotency key.
- Dados proibidos: dados bancarios sensiveis, documento pessoal do tomador e payload bruto de provider futuro.

### Step 012.7.2 - Testar audit log

**Testes obrigatorios**:
- Agenda gerada grava audit.
- Recebimento registrado grava audit.
- Parcela paga grava audit.
- Parcela atrasada grava audit.
- Audit nao vaza dados proibidos.

### Definicao de pronto da Task 12.7
- [ ] Tipos de auditoria adicionados em migration e enum Java.
- [ ] Listener grava eventos esperados apos commit.
- [ ] Testes de audit log cobrem eventos e nao vazamento.
- [ ] Checkpoint pre-commit apresentado ao usuario.

---

## Task 12.8 - Testes E2E e cobertura

**Objetivo**: validar o fluxo completo contrato assinado -> agenda -> recebimento -> escrow -> atraso.

**Pre-requisitos**: Tasks 12.1 a 12.7 concluidas.

**Esforco**: 1-2 dias.

**Arquivo principal**:
- `cobranca/web/CobrancaIT.java`

### Step 012.8.1 - Cobrir fluxo completo

**Cenarios obrigatorios**:
- Contrato assinado dispara listener e cria agenda com 12 parcelas Price.
- Tomador owner consulta agenda.
- Financeiro registra recebimento total.
- Parcela vira `PAGA`.
- Movimentacao escrow e criada.
- Financeiro registra recebimento parcial e parcela vira `PARCIALMENTE_PAGA`.
- Job marca parcela vencida como `ATRASADA`.
- Valor atualizado de parcela atrasada inclui juros e multa.

### Step 012.8.2 - Cobrir seguranca e idempotencia

**Cenarios obrigatorios**:
- Cliente tenta registrar recebimento e recebe `403`.
- Cliente nao-owner tenta consultar agenda e recebe `403`.
- Mesmo `Idempotency-Key` nao duplica recebimento nem movimentacao escrow.
- Nova key para parcela ja paga recebe `409`.

### Step 012.8.3 - Rodar suite completa

**Comandos sugeridos**:
```bash
cd <sep-api-root>
./gradlew test --tests "*Cobranca*"
./gradlew check
```

**Verificacao**:
- Suite completa verde.
- JaCoCo geral continua acima do gate vigente.
- Cobertura do modulo `cobranca` >= 70%, quando mensuravel pelo relatorio.

### Definicao de pronto da Task 12.8
- [ ] `CobrancaIT` cobre os cenarios obrigatorios.
- [ ] `./gradlew check` verde.
- [ ] Cobertura sem regressao abaixo do gate.
- [ ] Checkpoint pre-commit apresentado ao usuario.

---

## Task 12.9 - Documentacao, collections e fechamento

**Objetivo**: atualizar documentacao operacional, collections e preparar o encerramento da sprint.

**Pre-requisitos**: Tasks 12.1 a 12.8 concluidas.

**Esforco**: 0,5-1 dia.

**Arquivos esperados**:
- `docs-SEP/repos/sep-api/COBRANCA.md`.
- `docs-SEP/repos/sep-api/SPRINT-12-PR.md`.
- `docs-SEP/docs-sep/sep-api.postman_collection.json`.
- `docs-SEP/docs-sep/sep-api.insomnia_collection.json`.
- `docs-SEP/AI-ROADMAP.md`.
- `docs-SEP/docs-sep/PRD.md` somente apos merge/fechamento, marcando Sprint 12 como executada.

### Step 012.9.1 - Atualizar docs e collections

**`COBRANCA.md` deve conter**:
- Fluxo end-to-end.
- Entidades e status.
- Calculadoras e parametros financeiros.
- Recebimento manual e idempotencia.
- Integracao com escrow.
- Endpoints.
- Auditoria.
- Limitacoes e pendencias para Sprint 13/Pix.

**Collections devem conter**:
- `GET /api/v1/cobranca/contratos/{contratoId}/agenda`.
- `GET /api/v1/cobranca/parcelas/{id}`.
- `POST /api/v1/cobranca/parcelas/{id}/recebimentos`.
- `GET /api/v1/cobranca/recebimentos`.

### Step 012.9.2 - Criar descricao de PR

**Arquivo**:
- `docs-SEP/repos/sep-api/SPRINT-12-PR.md`

**Conteudo minimo**:
- Titulo sugerido.
- Resumo.
- Escopo tecnico.
- Endpoints novos.
- Como validar.
- Riscos/breaking changes.
- Pendencias futuras.
- Referencias.

### Step 012.9.3 - Revisar roadmap e PRD

**Regras**:
- `AI-ROADMAP.md` deve apontar para `COBRANCA.md` e para o steps da Sprint 12.
- PRD so deve marcar Sprint 12 como executada quando a sprint estiver concluida/mergeada.
- `docs-SEP` nao deve receber commit pelo agente.

### Definicao de pronto da Task 12.9
- [ ] `COBRANCA.md` atualizado.
- [ ] Collections atualizadas.
- [ ] `SPRINT-12-PR.md` criado.
- [ ] `AI-ROADMAP.md` revisado.
- [ ] PRD atualizado no momento correto.
- [ ] Checkpoint pre-commit apresentado ao usuario.

---

## Grafo de dependencias

```text
Sprint 11 concluida
        |
        v
Task 12.0 (prechecks)
        |
        v
Task 12.1 (dominio + migrations)
        |
        +---> Task 12.2 (calculadoras)
        |              |
        |              v
        +------> Task 12.3 (geracao de agenda + listener)
                        |
                        v
              Task 12.4 (recebimento + escrow)
                        |
                        +---> Task 12.5 (valor atualizado + job)
                                      |
                                      v
                            Task 12.6 (REST + DTOs)
                                      |
                                      v
                            Task 12.7 (auditoria)
                                      |
                                      v
                            Task 12.8 (IT/E2E)
                                      |
                                      v
                            Task 12.9 (docs + collections)
```

## Definicao de pronto da Sprint 12

- [ ] Modulo `cobranca` criado seguindo DDD + Hexagonal/Ports & Adapters.
- [ ] Entidades `AgendaPagamento`, `ParcelaCobranca` e `Recebimento` persistidas por Flyway.
- [ ] Calculadoras Price, SAC, juros de mora e multa testadas.
- [ ] `ContratoAssinadoEvent` gera agenda automaticamente e de forma idempotente.
- [ ] Recebimento manual via API atualiza parcela e gera movimentacao escrow.
- [ ] Job diario marca parcelas vencidas como `ATRASADA`.
- [ ] Endpoints REST documentados no OpenAPI.
- [ ] Auditoria reforcada cobre agenda, parcela, recebimento, atraso e escrow.
- [ ] `CobrancaIT` cobre fluxo principal, seguranca e idempotencia.
- [ ] `./gradlew check` verde.
- [ ] Docs operacionais e collections atualizadas.

## Impacto na Sprint seguinte (Sprint 13 - Inadimplencia)

- Sprint 13 consome `ParcelaAtrasouEvent`.
- Sprint 13 deve definir quando `ATRASADA` vira `INADIMPLENTE`.
- Sprint 13 adiciona notificacoes/cobranca ativa e possivel renegociacao basica.
- `PARCIALMENTE_PAGA` e overpayment devem ser revisitados para regras operacionais mais completas.

## Restricoes e regras de execucao

- Segregacao patrimonial e obrigatoria: todo recebimento novo gera movimentacao no `escrow`.
- Recebimento e manual nesta sprint; Pix fica para Epic 15.
- Nao acoplar `cobranca` a adapters Celcoin ou DTOs externos.
- Nao calcular valores financeiros a partir de texto contratual.
- Nao introduzir frontend/mobile.
- Nao commitar `docs-SEP`; commits neste repo sao manuais.

## Referencias

- [Spec 012 - Sprint 12 - Cobranca](../../specs/fase-2/012-sprint-12-cobranca-parcelas-agenda.md)
- [Spec 011 - Sprint 11 - Formalizacao assinatura digital](../../specs/fase-2/011-sprint-11-formalizacao-assinatura-digital.md)
- [Spec 013 - Sprint 13 - Cobranca inadimplencia](../../specs/fase-2/013-sprint-13-cobranca-inadimplencia.md)
- [CONTRATOS.md](../../repos/sep-api/CONTRATOS.md)
- [COBRANCA.md](../../repos/sep-api/COBRANCA.md)
- [ADR 0001 - Monolito modular orientado a DDD](../../adr/0001-monolito-modular-orientado-a-ddd.md)
- [ADR 0005 - Segregacao patrimonial via conta escrow](../../adr/0005-segregacao-patrimonial-via-conta-escrow.md)
- [ADR 0007 - DDD com Hexagonal Ports and Adapters por modulo](../../adr/0007-ddd-com-hexagonal-ports-and-adapters-por-modulo.md)
- Resolucao CMN 4.656/2018 - segregacao patrimonial
- CDC Lei 8.078/1990 - multa moratoria limitada a 2%
