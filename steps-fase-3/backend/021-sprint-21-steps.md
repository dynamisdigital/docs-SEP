# Steps - Sprint 21 - Pix Recebimento e Conciliacao

**Spec de origem**: [`specs/fase-3/021-sprint-21-pix-recebimento-conciliacao.md`](../../specs/fase-3/021-sprint-21-pix-recebimento-conciliacao.md)

**Status**: a implementar.

**Objetivo geral**: automatizar o recebimento Pix de parcelas, conciliando webhooks de entrada com `cobranca` e `escrow` por fronteiras explicitas, mantendo divergencias rastreaveis em backoffice e sem duplicar baixa de parcela.

**Esforco total estimado**: 6-9 dias de Dev Senior.

**Repo de destino**:
- `sep-api`: backend Spring Boot, unico repo de codigo alterado nesta sprint.
- `docs-SEP`: documentacao editada no working tree quando necessario; operacao git continua manual.

**Branch sugerida**:
- `feature/sprint-21-pix-recebimento-conciliacao`

**Pre-requisitos globais**:
- `sep-api/develop` atualizado apos merge da Sprint 20 (`d40768a`, PR #75, ou commit equivalente).
- Sprint 19 conhecida: `PixRecebimento`, `PixWebhookEvent`, `PixProvider`, `FakePixProvider`, `CelcoinPixProvider`, webhook HMAC e auditoria Pix.
- Sprint 20 conhecida: `ProcessarWebhookPixUseCase` ja roteia `RECEBIMENTO_PIX` e `STATUS_TRANSFERENCIA`; desembolso Pix e backoffice Pix ja existem.
- Sprint 12/13 conhecida: `AgendaPagamento`, `ParcelaCobranca`, `RegistrarRecebimentoUseCase`, `RegistrarMovimentacaoEscrowPort`, inadimplencia e backoffice de cobranca.
- ADRs 0004 (Provider Pattern), 0005 (Escrow), 0007 (DDD + Hexagonal) e 0008 (WireMock) vigentes.
- Docs de referencia: `repos/sep-api/PIX.md`, `COBRANCA.md`, `BACKOFFICE.md`, `docs-sep/SEGURANCA.md` e `docs-sep/RELATORIO-ACOMPANHAMENTO-ENTREGAS-FASE-3.md`.

**Nota sobre numeracao de migrations**:
- Confirmar sempre o proximo numero livre em `src/main/resources/db/migration`.
- Apos Sprint 20 mergeada, a Sprint 21 deve provavelmente iniciar em `V51`.
- Se houver hotfix paralelo em `develop`, reservar o numero real da branch e registrar risco de conflito de migration.

**Fora de escopo**:
- Desembolso automatico ou qualquer envio de Pix sem operador.
- Split Pix, devolucao Pix, disputa/estorno ou conciliacao bancaria ampla.
- Boleto, open finance payment initiation ou agenda automatica de pagamento futuro.
- Tela web/mobile de Pix.
- Validacao real contra sandbox Celcoin sem credenciais fornecidas.
- Persistir payload bruto de webhook, dados bancarios sensiveis ou chave Pix em claro fora do minimo operacional.

**Protocolo obrigatorio por Task**:
- Implementar somente a Task liberada pelo usuario.
- Ao concluir implementacao e verificacao da Task, parar em checkpoint pre-commit com arquivos alterados, testes executados, riscos e sugestao de commit.
- Aguardar `commit` ou aprovacao equivalente antes de stage/commit.
- Usar `git add <paths-especificos>`, nunca `git add -A`.
- Fazer code review da Task quando solicitado pelo usuario; se houver hotfix, implementar em novo checkpoint.
- Ao final da Task, pausar para review manual do usuario. Nao iniciar a proxima Task sem ordem explicita.

**Skills obrigatorias na implementacao**:
- `coding-guidelines`: pensar antes, simplicidade, mudancas cirurgicas, execucao orientada a meta.
- `clean-code`: nomes intencionais, funcoes pequenas, sem ruido, testes F.I.R.S.T.
- `clean-architecture`: dominio `pix` protegido de HTTP/JPA/Celcoin; baixa de parcela via port; `cobranca` preserva regra de parcela/recebimento; DTOs Celcoin nunca entram no dominio.

---

## Decisoes tecnicas da Sprint 21

- **Referencia Pix deterministica**: conciliacao automatica depende de identificador controlado pelo SEP (`txid`/`referencia`) vinculado a uma parcela. Sem referencia deterministica no webhook, nao baixar automaticamente.
- **`cobranca` e dono da baixa**: `pix` nao altera `ParcelaCobranca` nem `Recebimento` diretamente. A baixa passa por port de `pix.application` implementado por adapter que chama `RegistrarRecebimentoUseCase` ou use case publico equivalente de `cobranca`.
- **Escrow por cobranca**: nao criar movimentacao escrow diretamente em `pix` se a baixa usar `RegistrarRecebimentoUseCase`, porque o fluxo de cobranca ja registra escrow via `RegistrarMovimentacaoEscrowPort`. Evitar movimentacao duplicada.
- **Idempotencia em camadas**: webhook dedup por `(provider,event_id)`, recebimento Pix por `end_to_end_id`, referencia Pix por `txid`, baixa de cobranca por `Idempotency-Key` deterministica derivada do Pix (`pix:<endToEndId>` ou fallback seguro).
- **Divergencia nao some**: valor parcial/maior, referencia desconhecida, parcela nao recebivel, provider sem campo de correlacao ou erro de baixa devem virar estado rastreavel e item operacional.
- **Minimizacao de dados**: persistir apenas identificadores tecnicos (`txid`, `endToEndId`, provider id), valor, mascara/descricao segura e status. Payload bruto continua fora das tabelas de dominio.
- **Provider Pattern estrito**: se a sprint gerar cobranca Pix via provider, extender `PixProvider` com DTOs em linguagem SEP e adapters Fake/Celcoin. Campo Celcoin especifico fica em `infrastructure.adapter.celcoin`.
- **REST de referencia Pix**: endpoint de geracao de referencia pode ser acionado por `FINANCEIRO`/`ADMIN` e, se habilitado, por `CLIENTE` owner da parcela. Qualquer acao que apenas gera cobranca para pagamento proprio nao exige step-up; mudanca operacional/forcar reprocesso por operador deve seguir padrao de backoffice.

---

## Protocolo de breakpoints recomendado

```text
C1 = 21.0 + 21.1
Prechecks + modelo persistente de referencia/conciliacao

C2 = 21.2
Geracao de referencia Pix para parcela elegivel

C3 = 21.3
Webhook RECEBIMENTO_PIX idempotente + correlacao deterministica

C4 = 21.4
Baixa em cobranca + escrow por port + transacoes

C5 = 21.5
Backoffice/divergencias/reprocesso operacional

C6 = 21.6
REST/OpenAPI/docs/collections + smoke E2E Fake provider
```

- C1 fecha o contrato de dados antes de tocar webhook e cobranca.
- C2 isola a geracao da referencia e o contrato com provider.
- C3 isola recebimento Pix e deduplicacao.
- C4 isola o ponto mais sensivel: baixa de parcela e movimentacao escrow.
- C5 isola operacao assistida e divergencias.
- 21.6 e gate documental/operacional; nao deve esconder bug funcional.

---

## Task 21.0 - Prechecks da Sprint 21

**Objetivo**: garantir base Git correta, confirmar o comportamento real de Pix/cobranca/escrow/backoffice e decidir o campo de correlacao obrigatorio para conciliacao automatica.

**Esforco**: 1-2 horas.

### Step 021.0.1 - Conferir estado Git do `sep-api`

**Comandos**:
```bash
cd <sep-api-root>
git fetch --all --prune
git status --short --branch
git rev-list --left-right --count HEAD...origin/develop
git log --oneline -10 origin/develop
```

**Verificacao**:
- Working tree limpo antes de criar branch.
- Branch local alinhada a `origin/develop`.
- Sprint 20 presente em `develop` (`d40768a` ou commit equivalente do PR #75).
- Se houver mudancas locais, identificar se sao do usuario; nao reverter.

### Step 021.0.2 - Criar branch da sprint

**Comandos**:
```bash
cd <sep-api-root>
git switch develop
git pull --ff-only
git switch -c feature/sprint-21-pix-recebimento-conciliacao
```

**Verificacao**:
- Branch criada a partir de `develop` atualizado.
- Se `git pull --ff-only` falhar, abortar e avisar o usuario.

### Step 021.0.3 - Rodar baseline backend

**Comandos**:
```bash
cd <sep-api-root>
./gradlew clean test
./gradlew bootJar
```

**Verificacao**:
- Suite passa antes de qualquer alteracao.
- Contagem de testes registrada no checkpoint.
- Se a falha for ambiental conhecida, registrar evidencia antes de implementar.

### Step 021.0.4 - Mapear classes atuais de Pix, cobranca, escrow e backoffice

**Comandos**:
```bash
cd <sep-api-root>
find src/main/java/com/dynamis/sep_api/pix -type f | sort
find src/main/java/com/dynamis/sep_api/cobranca -type f | sort
find src/main/java/com/dynamis/sep_api/escrow -type f | sort
find src/main/java/com/dynamis/sep_api/backoffice -type f | sort
grep -R "RECEBIMENTO_PIX\|PixRecebimento\|RegistrarRecebimentoUseCase\|RegistrarMovimentacaoEscrowPort" -n src/main/java src/test/java
find src/main/resources/db/migration -maxdepth 1 -type f | sort | tail
```

**Verificacao**:
- `PixRecebimento` e `PixWebhookEvent` da Sprint 19 confirmados.
- `ProcessarWebhookPixUseCase` atual confirmado para nao duplicar recebimento.
- `RegistrarRecebimentoUseCase` confirmado como caminho oficial de baixa de parcela e escrow.
- Tipos de backoffice existentes confirmados antes de criar novos enums.
- Proximo numero de migration confirmado.

### Step 021.0.5 - Gate de correlacao Pix -> parcela

**Checklist bloqueante**:
- Definir qual campo identifica a parcela de forma deterministica no webhook recebido:
  - preferencial: `txid`/reference criada pelo SEP e retornada pelo provider;
  - aceitavel: provider id de cobranca gerado pelo SEP e devolvido no webhook;
  - nao aceitavel para auto-baixa: match apenas por valor, data, CPF/CNPJ ou texto livre.
- `PixWebhookNormalizer` deve expor esse campo no DTO normalizado antes de auto-conciliar.
- Se o provider fake/Celcoin skeleton nao tiver esse campo, implementar extensao do DTO/normalizer na Task 21.2/21.3 ou bloquear auto-baixa e mandar para backoffice.

### Step 021.0.6 - Gate de ownership e autorizacao de geracao de referencia

**Checklist**:
- Decidir se `CLIENTE` owner pode gerar referencia Pix da propria parcela.
- Se sim, reutilizar padrao de ownership de `cobranca` e nao enumerar 404 vs 403 para cliente nao-owner.
- `FINANCEIRO`/`ADMIN` podem gerar referencia operacional.
- `BACKOFFICE` pode consultar/tratar divergencia, mas nao deve criar baixa manual fora do fluxo de cobranca.

### Definicao de pronto da Task 21.0
- [ ] Branch correta criada.
- [ ] Baseline backend executado e registrado.
- [ ] Classes atuais e migrations mapeadas.
- [ ] Campo de correlacao deterministica definido.
- [ ] Ownership/autorizacao de geracao de referencia definido.

---

## Task 21.1 - Modelar referencia Pix de recebimento e vinculo com parcela

**Objetivo**: criar o modelo persistente que liga uma referencia Pix gerada pelo SEP a uma parcela de cobranca, sem acoplar `pix.domain` a entidades de `cobranca`.

**Pre-requisito**: Task 21.0 concluida.

**Esforco**: 1-1.5 dia.

**Arquivos principais esperados**:
- `pix/domain/model/PixReferenciaRecebimento.java` ou nome equivalente.
- `pix/domain/vo/StatusPixReferenciaRecebimento.java`.
- Evolucao de `PixRecebimento` para guardar `referenciaId`/`parcelaId`/status de conciliacao quando necessario.
- `pix/infrastructure/persistence/PixReferenciaRecebimentoRepository.java`.
- Migration `Vxx__criar_referencia_pix_recebimento.sql`.
- Testes de dominio e repository.

**Modelo sugerido**:
```text
PixReferenciaRecebimento
  id
  parcelaId
  contratoId
  tomadorId
  valorEsperado
  txid
  providerReferenciaId
  codigoCopiaCola (opcional, se for contrato publico de pagamento)
  status = ATIVA | PAGA | EXPIRADA | CANCELADA | DIVERGENTE
  correlationId
  audit fields
```

**Regras de integridade**:
- `txid` unico quando presente.
- `providerReferenciaId` unico quando presente.
- No maximo uma referencia `ATIVA` por parcela.
- Referencia `PAGA` nao pode voltar para `ATIVA`.
- Valor esperado positivo, escala ate 2.
- `parcelaId`, `contratoId`, `tomadorId` obrigatorios.
- Sem FK fisica para `cobranca`; isolamento por ports, seguindo padrao da Sprint 20.

**Evolucao de `PixRecebimento`**:
- Adicionar colunas nullable para conciliacao:
  - `referencia_id` ou `referencia_pix_id`;
  - `parcela_id`;
  - `recebimento_cobranca_id`;
  - `motivo_divergencia` truncado.
- Manter `end_to_end_id` unique parcial.
- Evitar payload bruto.

**Verificacao sugerida**:
```bash
cd <sep-api-root>
./gradlew test --tests "*PixReferenciaRecebimento*"
./gradlew test --tests "*PixRecebimento*"
```

### Definicao de pronto da Task 21.1
- [ ] Entidade/VO de referencia Pix criada com transicoes guardadas.
- [ ] Migration aplica em banco limpo e banco existente.
- [ ] Uniques parciais protegem referencia ativa e IDs do provider.
- [ ] `PixRecebimento` evoluido sem quebrar foundation/webhook existente.
- [ ] Testes cobrem transicoes, constraints e minimizacao.

---

## Task 21.2 - Gerar cobranca/referencia Pix para parcela elegivel

**Objetivo**: expor use case para gerar ou retornar referencia Pix de pagamento para uma parcela elegivel, com idempotencia por parcela e Provider Pattern quando houver criacao externa.

**Pre-requisito**: Task 21.1 concluida.

**Esforco**: 1-1.5 dia.

**Arquivos principais esperados**:
- `pix/application/usecase/GerarReferenciaRecebimentoPixUseCase.java`.
- DTOs em `pix/application/dto/*ReferenciaRecebimentoPix*`.
- Ports de leitura de cobranca em `pix/application/port/out`, por exemplo:
  - `CobrancaRecebimentoPixQueryPort`;
  - DTO view `ParcelaRecebimentoPixView`.
- Adapter `pix/infrastructure/adapter/cobranca/CobrancaRecebimentoPixQueryAdapter.java`.
- Extensao de `PixProvider`, se a referencia depender do provider:
  - `ComandoCriarCobrancaPix`;
  - `RespostaCobrancaPix`.
- Evolucao de `FakePixProvider` e `CelcoinPixProvider`/WireMock quando aplicavel.

**Contrato minimo de elegibilidade da parcela**:
- Parcela existe.
- Operador/cliente autorizado conforme decisao 021.0.6.
- Parcela permite recebimento (`StatusParcela.permiteRecebimento()`).
- Valor devido atualizado calculado a partir de cobranca, nao recalculado em `pix`.
- Nao existe referencia Pix `ATIVA` para a parcela; se existir, retornar idempotentemente.
- Parcela `PAGA`, `RENEGOCIADA`, `EM_NEGOCIACAO` ou status nao recebivel -> 409/422 conforme padrao de cobranca.

**Fluxo esperado**:
```text
REST/controller ou use case chamador
  -> GerarReferenciaRecebimentoPixUseCase
       -> CobrancaRecebimentoPixQueryPort.buscarParcelaElegivel(parcelaId)
       -> calcula txid/reference deterministica ou solicita ao PixProvider
       -> persiste PixReferenciaRecebimento ATIVA
       -> retorna txid/codigo copia-cola/valor/vencimento sem dado sensivel desnecessario
```

**Decisao sobre `PixProvider`**:
- Se o provider real exigir criacao de cobranca/QR, extender a port com metodo explicito.
- Se a referencia for local no fake, ainda manter o contrato da port para nao acoplar o use case ao fake.
- `CelcoinPixProvider` pode continuar skeleton com WireMock; documentar campos assumidos.

**Idempotencia**:
- Requisicao repetida para a mesma parcela com referencia `ATIVA` retorna a existente.
- Requisicao concorrente para a mesma parcela deve cair na unique parcial e retornar 409 ou reconsultar em transacao limpa, conforme padrao escolhido.
- `txid` deve ser estavel o suficiente para correlacao, mas sem expor dados de CPF/CNPJ ou contrato em claro se isso aumentar risco.

**Verificacao sugerida**:
```bash
cd <sep-api-root>
./gradlew test --tests "*GerarReferenciaRecebimentoPix*"
./gradlew test --tests "*FakePixProvider*"
./gradlew test --tests "*CelcoinPixProvider*"
```

### Definicao de pronto da Task 21.2
- [ ] Use case gera/retorna referencia Pix para parcela elegivel.
- [ ] `pix.application` depende de ports, nao de repositories/entities de cobranca.
- [ ] Provider fake cobre sucesso e falha.
- [ ] Idempotencia por parcela/referencia coberta.
- [ ] Nenhum dado sensivel desnecessario entra em log/audit/response.

---

## Task 21.3 - Processar webhook `RECEBIMENTO_PIX` com correlacao e idempotencia

**Objetivo**: evoluir o processamento de webhook Pix para correlacionar recebimentos recebidos com referencia/parcela e preparar a baixa automatica sem duplicidade.

**Pre-requisito**: Task 21.2 concluida.

**Esforco**: 1-1.5 dia.

**Arquivos principais esperados**:
- Evolucao de `pix/application/usecase/ProcessarWebhookPixUseCase.java`.
- Possivel novo use case `ConciliarRecebimentoPixUseCase.java`.
- Evolucao de `EventoWebhookPixNormalizado` para carregar `txid`/`providerReferenciaId`.
- Evolucao de `PixWebhookNormalizer` e DTO Celcoin `CelcoinPixWebhookPayload`.
- Testes de webhook recebido conhecido/desconhecido/duplicado.

**Fluxo esperado para `RECEBIMENTO_PIX`**:
```text
ProcessarWebhookPixUseCase
  -> dedup PixWebhookEvent por (provider,event_id)
  -> normaliza payload sem persistir bruto
  -> se endToEndId ja existe: idempotente, nao baixa de novo
  -> registra PixRecebimento RECEBIDO
  -> busca PixReferenciaRecebimento por txid/providerReferenciaId
     -> encontrada: segue para conciliacao (Task 21.4)
     -> nao encontrada: marca NAO_IDENTIFICADO/DIVERGENTE e gera evento/backoffice (Task 21.5)
  -> marca PixWebhookEvent PROCESSADO/IGNORADO/FALHOU coerente com estado real
```

**Regras de idempotencia e corrida**:
- Mesmo `event_id` -> retorno 202 duplicado sem reprocessar.
- `event_id` diferente com mesmo `endToEndId` -> nao cria baixa duplicada; unique parcial de `PixRecebimento` deve proteger.
- Se unique de `endToEndId` estourar dentro da tx, tratar como duplicidade idempotente ou deixar webhook FALHOU apenas se nao for possivel recuperar em tx limpa. Registrar decisao no checkpoint.
- Nao usar valor/data como chave de dedup.

**Estados sugeridos em `PixRecebimento`**:
- `RECEBIDO`: entrada persistida.
- `EM_PROCESSAMENTO`: conciliacao em andamento, se houver fase intermediaria.
- `CONCILIADO`: baixa em cobranca concluida.
- `NAO_IDENTIFICADO`: sem referencia/parcela deterministica.
- `FALHOU`: erro tecnico ou falha de baixa recuperavel.

**Verificacao sugerida**:
```bash
cd <sep-api-root>
./gradlew test --tests "*ProcessarWebhookPix*"
./gradlew test --tests "*PixWebhook*"
```

### Definicao de pronto da Task 21.3
- [ ] Webhook `RECEBIMENTO_PIX` usa referencia deterministica quando disponivel.
- [ ] Webhook sem referencia nao baixa parcela automaticamente.
- [ ] Duplicidade por `event_id` e `endToEndId` coberta.
- [ ] Payload bruto continua fora da persistencia.
- [ ] Testes cobrem conhecido, desconhecido, duplicado e payload invalido.

---

## Task 21.4 - Baixar parcela e registrar escrow via ports

**Objetivo**: conectar recebimento Pix identificado ao fluxo oficial de cobranca, garantindo baixa unica da parcela e movimentacao escrow vinculada sem duplicar regras.

**Pre-requisito**: Task 21.3 concluida.

**Esforco**: 1.5-2 dias.

**Arquivos principais esperados**:
- Port em `pix/application/port/out`, por exemplo `CobrancaRecebimentoPixPort.java`.
- DTO de comando/resultado do port, por exemplo:
  - `RegistrarRecebimentoPixCobrancaCommand`;
  - `RecebimentoPixCobrancaResult`.
- Adapter `pix/infrastructure/adapter/cobranca/CobrancaRecebimentoPixAdapter.java`.
- Evolucao de `ConciliarRecebimentoPixUseCase` ou `ProcessarWebhookPixUseCase`.
- Testes unitarios de conciliacao com fake port e adapter com mock/use case real.

**Regra de arquitetura**:
- `pix.application` chama uma port sua, orientada ao caso de uso Pix.
- Adapter de infrastructure traduz para `cobranca.application.usecase.RegistrarRecebimentoUseCase` com `RegistrarRecebimentoCommand`.
- `pix` nao importa `ParcelaCobranca`, `RecebimentoRepository`, `ParcelaCobrancaRepository` ou entities de `cobranca`.
- `cobranca` continua dona de:
  - lock pessimista da parcela;
  - calculo do valor devido atualizado;
  - status `PAGA`/`PARCIALMENTE_PAGA`;
  - criacao de `Recebimento`;
  - chamada a `RegistrarMovimentacaoEscrowPort`.

**Idempotency-Key para baixa de cobranca**:
- Preferencial: `pix:<endToEndId>`.
- Se `endToEndId` ausente, nao baixar automaticamente; mandar para divergencia.
- Reapresentacao do mesmo Pix deve retornar baixa existente (`novo=false`) e manter `PixRecebimento` conciliado.

**Tratamento de valor**:
- Valor igual ao esperado: baixa normal.
- Valor menor: registrar recebimento parcial se `RegistrarRecebimentoUseCase` aceitar; marcar referencia/recebimento como divergente parcial e gerar item operacional.
- Valor maior: registrar recebimento/overpayment conforme regra atual de cobranca; marcar divergencia de valor maior e gerar item operacional.
- Valor zero/negativo ou escala invalida: webhook FALHOU ou recebimento divergente, sem baixa.

**Transacoes**:
- Evitar efeito externo/provider nesta task.
- A baixa e a marcacao de `PixRecebimento.CONCILIADO` precisam ser consistentes:
  - se a baixa em cobranca falhar por estado nao recebivel, marcar Pix como divergente/falhou e abrir backoffice;
  - se erro tecnico deixar tx rollback-only, nao tentar reconsultar/escrever no mesmo EntityManager; usar transacao separada ou publicar evento para tratamento posterior.
- Registrar explicitamente no checkpoint a escolha transacional.

**Verificacao sugerida**:
```bash
cd <sep-api-root>
./gradlew test --tests "*ConciliarRecebimentoPix*"
./gradlew test --tests "*CobrancaRecebimentoPixAdapter*"
./gradlew test --tests "*RegistrarRecebimentoUseCase*"
```

### Definicao de pronto da Task 21.4
- [ ] Recebimento Pix identificado baixa parcela via use case/port de cobranca.
- [ ] Escrow e registrado uma unica vez pelo fluxo de cobranca.
- [ ] Replay do webhook nao duplica `Recebimento` nem movimentacao escrow.
- [ ] Parcial/maior ficam rastreaveis.
- [ ] Testes cobrem sucesso, replay, estado nao recebivel e falha tecnica.

---

## Task 21.5 - Backoffice de divergencias e reprocesso operacional

**Objetivo**: garantir que divergencias de recebimento Pix entrem na operacao assistida com item rastreavel e, quando seguro, permitam reprocessar a conciliacao sem nova entrada financeira.

**Pre-requisito**: Task 21.4 concluida.

**Esforco**: 1-1.5 dia.

**Arquivos principais esperados**:
- Enum `TipoItemFila` com tipo especifico, por exemplo `RECEBIMENTO_PIX_DIVERGENTE`.
- Enum `TipoEntidadeReferenciada` com `PIX_RECEBIMENTO` ou reuso seguro documentado.
- Possivel enum `TipoChamadaProvider`/strategy se houver reprocesso real.
- Listener de evento de divergencia:
  - `RecebimentoPixDivergenteListener`;
  - evento `PixRecebimentoDivergenteEvent`.
- Adapter de objeto original:
  - `PixRecebimentoObjetoOriginalAdapter`.
- Migration `Vxx__ampliar_backoffice_para_pix_recebimento.sql`.
- Testes de listener, adapter e strategy/no-op.

**Divergencias que devem gerar item**:
- Referencia Pix desconhecida.
- Referencia conhecida, mas parcela nao recebivel.
- Valor recebido diferente do valor esperado.
- Falha ao registrar baixa em cobranca.
- End-to-end id ausente quando necessario para idempotencia da baixa.
- Webhook valido mas sem campo de correlacao deterministica.

**Reprocesso seguro**:
- Reprocessar conciliacao local e permitido quando:
  - `PixRecebimento` existe;
  - ha `referenciaId`/`parcelaId`;
  - `endToEndId` esta presente;
  - a baixa ainda nao foi registrada em cobranca.
- Nao chamar provider para "receber de novo".
- Nao gerar nova movimentacao escrow manualmente.
- Se a parcela ja estiver PAGA por outro meio, strategy deve retornar resultado honesto e manter item para decisao operacional ou marcar resolvido apenas se a politica estiver explicita.

**Auditoria**:
- Avaliar se os eventos existentes de cobranca (`RECEBIMENTO_REGISTRADO`, `PARCELA_PAGA`, `MOVIMENTACAO_ESCROW_CRIADA`) bastam para sucesso.
- Para divergencia Pix, criar audit especifico apenas se houver valor regulatorio claro; caso contrario, o item de backoffice + `PixWebhookEvent` + `PixRecebimento` podem ser trilha suficiente.
- Nunca gravar payload bruto ou chave Pix no audit log.

**Verificacao sugerida**:
```bash
cd <sep-api-root>
./gradlew test --tests "*RecebimentoPixDivergente*"
./gradlew test --tests "*PixRecebimentoObjetoOriginalAdapter*"
./gradlew test --tests "*Backoffice*Pix*"
```

### Definicao de pronto da Task 21.5
- [ ] Divergencias geram item operacional idempotente.
- [ ] Item aponta para objeto original consultavel.
- [ ] Reprocesso local existe ou ausencia de reprocesso esta documentada.
- [ ] Nenhum caso divergente fica apenas em log.
- [ ] Testes cobrem unknown reference, valor divergente e falha de baixa.

---

## Task 21.6 - REST, OpenAPI, smoke E2E Fake provider e documentacao

**Objetivo**: expor contratos REST necessarios para gerar/consultar referencias Pix, validar o fluxo ponta a ponta com provider fake e atualizar documentacao/collections.

**Pre-requisito**: Tasks 21.1-21.5 concluidas e revisadas.

**Esforco**: 1-1.5 dia.

**Endpoints sugeridos**:
- `POST /api/v1/pix/recebimentos/referencias`
  - roles: `CLIENTE` owner da parcela ou `FINANCEIRO`/`ADMIN` conforme decisao 021.0.6;
  - request: `parcelaId`;
  - response: `referenciaId`, `parcelaId`, `valor`, `txid`, `codigoCopiaCola`/dados seguros, `status`.
- `GET /api/v1/pix/recebimentos/referencias/{id}`
  - roles: owner, `FINANCEIRO`, `ADMIN`, `BACKOFFICE`;
  - leitura local.
- `GET /api/v1/pix/recebimentos/{id}`
  - roles: `FINANCEIRO`, `ADMIN`, `BACKOFFICE`;
  - usado para operacao e objeto original.

**Arquivos principais esperados**:
- `pix/web/controller/PixRecebimentoController.java`.
- DTOs em `pix/web/dto/*RecebimentoPix*`.
- OpenAPI annotations e `OpenApiConfigTest` atualizado.
- Tests web com `@WebMvcTest` ou padrao local.
- Atualizacao das collections Postman/Insomnia.
- Docs operacionais e PR description.

**Smoke E2E minimo com Fake provider**:
```text
criar/obter contrato ASSINADO + agenda + parcela PENDENTE
  -> gerar referencia Pix para parcela
  -> simular webhook RECEBIMENTO_PIX com txid/endToEndId/valor exato
  -> PixRecebimento fica CONCILIADO
  -> Parcela vira PAGA ou PARCIALMENTE_PAGA conforme valor
  -> Recebimento em cobranca criado com meioPagamento=PIX
  -> MovimentacaoEscrow criada com externalReferenceId = recebimentoId
  -> reenviar mesmo webhook/event_id -> nao duplica nada
  -> enviar novo event_id com mesmo endToEndId -> nao duplica baixa
```

**Comandos sugeridos**:
```bash
cd <sep-api-root>
./gradlew test --tests "*PixRecebimento*"
./gradlew test --tests "*ProcessarWebhookPix*"
./gradlew test --tests "*RegistrarRecebimentoUseCase*"
./gradlew test --tests "*OpenApiConfigTest"
./gradlew test
./gradlew bootJar
```

**Docs esperadas**:
- `docs-SEP/repos/sep-api/PIX.md`:
  - referencia Pix;
  - webhook recebido;
  - idempotencia;
  - divergencias;
  - dados persistidos/proibidos.
- `docs-SEP/repos/sep-api/COBRANCA.md`:
  - baixa automatica via Pix;
  - interacao com recebimento manual;
  - regra de parcial/maior.
- `docs-SEP/repos/sep-api/BACKOFFICE.md`:
  - novo tipo de item e reprocesso/no-op.
- `docs-SEP/docs-sep/PRD-FASE-3.md`, `CONTEXT-PARTE-2.md`, relatorio Fase 3 e `AI-ROADMAP.md`.
- Collections:
  - `docs-SEP/docs-sep/sep-api.postman_collection.json`;
  - `docs-SEP/docs-sep/sep-api.insomnia_collection.json`.
- `docs-SEP/repos/sep-api/SPRINT-21-PR.md`.

### Definicao de pronto da Task 21.6
- [ ] Endpoints REST criados e protegidos por role/ownership.
- [ ] OpenAPI atualizado.
- [ ] Smoke E2E Fake provider cobre referencia -> webhook -> baixa -> escrow.
- [ ] Docs operacionais atualizadas.
- [ ] Collections Postman/Insomnia atualizadas.
- [ ] PR description temporaria criada.
- [ ] Suite proporcional verde ou bloqueio ambiental registrado.

---

## Definition of Done da Sprint 21

- [ ] Referencia Pix de parcela modelada e persistida com unicidade adequada.
- [ ] Parcela elegivel gera ou reaproveita referencia Pix idempotentemente.
- [ ] Webhook `RECEBIMENTO_PIX` identifica referencia/parcela por campo deterministico.
- [ ] Pagamento recebido baixa parcela uma unica vez.
- [ ] Replays por `event_id` e `endToEndId` nao duplicam `Recebimento` nem escrow.
- [ ] Baixa em `cobranca` ocorre via port/use case publico, sem acesso direto de `pix` a entities/repositories de cobranca.
- [ ] Movimentacao escrow fica vinculada ao recebimento de cobranca e nao duplica.
- [ ] Pagamento parcial/maior e referencia desconhecida geram rastreabilidade/backoffice.
- [ ] Payload bruto e dados sensiveis continuam fora da persistencia de dominio e audit log.
- [ ] Fake provider e WireMock cobrem referencia, webhook recebido e falhas principais.
- [ ] OpenAPI, collections e docs refletem os contratos novos.
- [ ] Testes proporcionais verdes; bloqueios ambientais registrados.
- [ ] Migrations aplicam em banco limpo e banco existente.

---

## Pendencias aceitas / follow-ups provaveis

- Contrato Celcoin real de cobranca Pix/QR pode exigir ajuste de campos apos acesso a sandbox/documentacao fechada.
- Conciliacao bancaria ampla, devolucao, disputa e split Pix ficam fora da Sprint 21.
- Tratamento financeiro detalhado de overpayment pode exigir regra de produto futura; Sprint 21 deve ao menos rastrear e nao perder valor.
- Reprocesso automatico assíncrono/DLQ tecnica para falhas de webhook pode ficar para sprint de observabilidade se nao houver infraestrutura de fila.
