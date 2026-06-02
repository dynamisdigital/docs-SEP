# Steps - Sprint 17 - Oportunidades e carteira da credora

**Spec de origem**: [`specs/fase-3/017-sprint-17-credora-oportunidades-carteira.md`](../../specs/fase-3/017-sprint-17-credora-oportunidades-carteira.md)

**Status**: a implementar.

**Objetivo geral**: permitir que uma empresa credora elegivel visualize oportunidades de investimento derivadas de propostas aprovadas/formalizadas, manifeste ou cancele interesse operacional e acompanhe uma carteira inicial de operacoes financiadas, ainda sem aporte financeiro real, Pix, escrow externo ou matching automatico.

**Esforco total estimado**: 6-9 dias de Dev Senior.

**Repo de destino**:
- `sep-api`: backend Spring Boot, unico repo de codigo alterado nesta sprint.
- `docs-SEP`: documentacao editada no working tree quando necessario; operacao git continua manual.

**Branch sugerida**:
- `feature/sprint-17-credora-oportunidades-carteira`

**Pre-requisitos globais**:
- Sprint 16 concluida e mergeada na base de trabalho (`develop`) ou base alternativa explicitamente aprovada pelo usuario.
- Modulo `credores` funcional com `EmpresaCredora`, `PerfilCredora`, elegibilidade derivada do onboarding e endpoints `/api/v1/credores`.
- Credora deve possuir contrato de ownership/autorizacao claro: usuario autenticado acessa apenas sua credora; `ADMIN` acessa consultas administrativas.
- Modulos `credito`, `contratos` e `cobranca` disponiveis como fontes de leitura, sem acesso direto de `credores` aos repositories internos desses modulos.
- ADRs 0001 (monolito modular DDD), 0004 (Provider Pattern quando houver integracao externa) e 0007 (DDD + Hexagonal) vigentes.

**Nota sobre numeracao de migrations**:
- Sprint 16 criou `V38__criar_tabelas_credores.sql` e `V39__ampliar_audit_seguranca_tipo_credora.sql`.
- Sprint 17 deve confirmar o proximo numero livre antes de implementar. Reserva inicial sugerida: `V40` para oportunidades/interesses/operacoes financiadas e `V41` se for necessario ampliar `audit_log_seguranca`.

**Fora de escopo**:
- Matching financeiro automatico.
- Aporte real via Pix, escrow ou provider externo.
- Split, liquidacao, desembolso ou recebimento financeiro.
- Marketplace publico.
- Precificacao secundaria.
- UI web/mobile.

**Protocolo obrigatorio por Task**:
- Implementar somente a Task liberada pelo usuario.
- Ao concluir implementacao e verificacao da Task, parar em checkpoint pre-commit com arquivos alterados, testes executados, riscos e sugestao de commit.
- Aguardar `commit` ou aprovacao equivalente antes de stage/commit.
- Usar `git add <paths-especificos>`, nunca `git add -A`.
- Fazer exatamente 1 code review automatizado/manual da Task quando solicitado pelo usuario; se houver hotfix, implementar em novo checkpoint.
- Ao final da Task, pausar para review manual do usuario. Nao iniciar a proxima Task sem ordem explicita.

**Skills obrigatorias na implementacao**:
- `coding-guidelines`: pensar antes, simplicidade, mudancas cirurgicas, execucao orientada a meta.
- `clean-code`: nomes intencionais, funcoes pequenas, sem ruido, testes F.I.R.S.T.
- `clean-architecture`: dominio protegido de web/JPA/providers, use cases na application layer, ports orientadas ao consumidor e adapters nas bordas.

---

## Ordem de execucao recomendada

```text
17.0 (prechecks)
  |
  v
17.1 (dominio: OportunidadeInvestimento, InteresseCredora, OperacaoFinanciada)
  |
  v
17.2 (migrations, repositories e indices)
  |
  v
17.3 (ports de leitura para credito, contratos e cobranca)
  |
  v
17.4 (use cases de oportunidades, interesse e carteira)
  |
  v
17.5 (REST controllers, DTOs, mapper e OpenAPI)
  |
  v
17.6 (auditoria e testes)
  |
  v
17.7 (docs, collections e fechamento)
```

- 17.1 e 17.2 estabilizam o modelo persistente.
- 17.3 cria as fronteiras entre `credores` e os modulos donos de proposta, contrato e cobranca.
- 17.4 implementa regra de negocio sem depender de HTTP/JPA de outros modulos.
- 17.5 expoe a API somente apos use cases prontos.
- 17.6 fecha ownership, elegibilidade, auditoria e regressao.
- 17.7 e gate documental; nao conta como task de implementacao.

---

## Task 17.0 - Prechecks da Sprint 17

**Objetivo**: garantir que a sprint nasce da base correta, com Sprint 16 integrada e com contratos dos modulos fonte mapeados.

**Esforco**: 1-2 horas.

### Step 017.0.1 - Conferir estado Git do `sep-api`

**Comandos**:
```bash
cd <sep-api-root>
git fetch --all --prune
git status --short --branch
git rev-list --left-right --count HEAD...origin/develop
git log --oneline -8 origin/develop
```

**Verificacao**:
- Working tree limpo antes de criar branch.
- Branch local alinhada a `origin/develop`.
- Sprint 16 presente na base de trabalho. Se Sprint 16 ainda estiver apenas em feature branch, parar e pedir decisao do usuario.
- Se houver mudancas locais, identificar se sao do usuario; nao reverter.

### Step 017.0.2 - Criar branch da sprint

**Comandos**:
```bash
cd <sep-api-root>
git switch develop
git pull --ff-only
git switch -c feature/sprint-17-credora-oportunidades-carteira
```

**Verificacao**:
- Branch criada a partir de `develop` atualizado.
- Se `git pull --ff-only` falhar, abortar e avisar o usuario.

### Step 017.0.3 - Rodar baseline backend

**Comandos**:
```bash
cd <sep-api-root>
./gradlew clean test
./gradlew bootJar
```

**Verificacao**:
- Suite passa antes de qualquer alteracao.
- Contagem de testes registrada no checkpoint.
- Se a falha for ambiental conhecida (`build/` com ownership incorreto, Testcontainers/Docker ou stale outputs), registrar evidencia e pedir decisao antes de implementar.

### Step 017.0.4 - Conferir contratos e proximo numero de migration

**Comandos**:
```bash
cd <sep-api-root>
find src/main/resources/db/migration -maxdepth 1 -type f | sort | tail
find src/main/java/com/dynamis/sep_api/credores -type f | sort
find src/main/java/com/dynamis/sep_api/credito -type f | sort
find src/main/java/com/dynamis/sep_api/contratos -type f | sort
find src/main/java/com/dynamis/sep_api/cobranca -type f | sort
grep -R "APROVADA\\|FORMALIZAD\\|ASSINAD\\|PRE_APROVADA" -n src/main/java/com/dynamis/sep_api/credito src/main/java/com/dynamis/sep_api/contratos
grep -R "findBy.*Usuario\\|findBy.*Contrato\\|findBy.*Proposta" -n src/main/java/com/dynamis/sep_api/credito src/main/java/com/dynamis/sep_api/contratos src/main/java/com/dynamis/sep_api/cobranca
```

**Verificacao**:
- Proximo numero de migration confirmado.
- Estados de proposta/contrato elegiveis para oportunidade identificados.
- Fonte para leitura de parcelas/recebimentos identificada no modulo `cobranca`.
- Nenhum plano de acesso direto de `credores` a repositories internos de `credito`, `contratos` ou `cobranca`.

### Definicao de pronto da Task 17.0
- [ ] Branch correta criada.
- [ ] Baseline backend executado e registrado.
- [ ] Sprint 16 confirmada na base.
- [ ] Proximo numero de migration confirmado.
- [ ] Contratos de leitura de `credito`, `contratos` e `cobranca` mapeados.

---

## Task 17.1 - Dominio de oportunidades, interesses e operacoes financiadas

**Objetivo**: modelar o nucleo de dominio da carteira credora sem regra financeira automatica.

**Pre-requisito**: Task 17.0 concluida.

**Esforco**: 1 dia.

**Arquivos principais**:
- `credores/domain/model/OportunidadeInvestimento.java`
- `credores/domain/model/InteresseCredora.java`
- `credores/domain/model/OperacaoFinanciada.java`
- `credores/domain/vo/StatusOportunidade.java`
- `credores/domain/vo/StatusInteresseCredora.java`
- `credores/domain/vo/StatusOperacaoFinanciada.java`
- `credores/domain/event/InteresseCredoraRegistradoEvent.java`
- `credores/domain/event/InteresseCredoraCanceladoEvent.java`
- `credores/domain/event/OperacaoFinanciadaAssociadaEvent.java`

**Regras de dominio esperadas**:
- `OportunidadeInvestimento` representa snapshot operacional de uma proposta/contrato elegivel para captação, sem copiar regra de credito.
- `InteresseCredora` pertence a uma `EmpresaCredora` e a uma oportunidade; deve impedir interesse duplicado ativo para a mesma credora/oportunidade.
- `OperacaoFinanciada` representa a associacao operacional entre credora e contrato/operação, ainda sem movimentacao financeira real.
- Somente credora `ATIVA` e `ELEGIVEL` pode registrar interesse.
- Cancelamento deve ser idempotente ou rejeitar transicao invalida com erro claro, conforme padrao local.
- Entidades nao devem importar DTO web, request HTTP, repositories de outros modulos ou SDK/provider externo.

**Clean Architecture**:
- Regras de transicao ficam em entidades/metodos de dominio.
- IDs externos (`propostaId`, `contratoId`, `parcelaId`) podem ser referencias logicas por UUID, mas regra de leitura do modulo dono fica em ports da Task 17.3.
- Se alguma regra depender de data/hora, usar clock/valor passado pelo use case, nao `now()` escondido no dominio.

### Definicao de pronto da Task 17.1
- [ ] Entidades e VOs criados com invariantes minimas.
- [ ] Eventos de dominio definidos para auditoria futura.
- [ ] Nenhum acoplamento do dominio a web/JPA de outros modulos.
- [ ] Testes unitarios de dominio cobrindo transicoes principais.

---

## Task 17.2 - Migrations, repositories e indices

**Objetivo**: persistir o modelo da Task 17.1 com constraints e indices adequados para consulta por credora/status.

**Pre-requisito**: Task 17.1 concluida.

**Esforco**: 1 dia.

**Arquivos principais**:
- `src/main/resources/db/migration/V40__criar_tabelas_carteira_credora.sql` ou numero livre confirmado.
- `credores/infrastructure/persistence/OportunidadeInvestimentoRepository.java`
- `credores/infrastructure/persistence/InteresseCredoraRepository.java`
- `credores/infrastructure/persistence/OperacaoFinanciadaRepository.java`

**Schema esperado**:
- Tabelas para oportunidades, interesses e operacoes financiadas.
- UNIQUE para evitar interesse ativo duplicado por `empresa_credora_id + oportunidade_id`.
- Indices para:
  - oportunidades por `status`;
  - interesses por `empresa_credora_id` e `status`;
  - carteira/operacoes por `empresa_credora_id` e `status`;
  - referencias logicas a `proposta_id` e `contrato_id`.
- CHECK constraints alinhadas aos enums de dominio.
- FKs internas para `empresa_credora` quando pertencer ao modulo `credores`; referencias a outros modulos devem ser logicas salvo decisao documentada em contrario.

**Verificacao**:
```bash
cd <sep-api-root>
./gradlew test --tests "*Credora*RepositoryTest"
```

### Definicao de pronto da Task 17.2
- [ ] Migration forward-only criada com numero correto.
- [ ] Repositories criados apenas no modulo `credores`.
- [ ] Constraints protegem duplicidade e enums.
- [ ] Indices cobrem consultas previstas.
- [ ] Testes de repository ou slices equivalentes verdes.

---

## Task 17.3 - Ports de leitura para propostas, contratos e cobranca

**Objetivo**: expor leituras necessarias a partir dos modulos donos sem `credores` acessar repositories internos diretamente.

**Pre-requisito**: Task 17.2 concluida.

**Esforco**: 1-1.5 dia.

**Arquivos principais**:
- `credores/application/port/out/ConsultarPropostasElegiveisParaCredoraPort.java`
- `credores/application/port/out/ConsultarContratoParaCarteiraCredoraPort.java`
- `credores/application/port/out/ConsultarCobrancaParaCarteiraCredoraPort.java`
- adapters nos modulos donos ou em package de infraestrutura apropriado, seguindo padrao existente.

**Contratos esperados**:
- Propostas elegiveis: dados minimos para oportunidade (`propostaId`, tomador mascarado ou identificador nao sensivel, valor, prazo, status, score/faixa quando permitido, contrato vinculado quando existir).
- Contrato para carteira: status contratual, datas relevantes, valor contratado e identificador operacional.
- Cobranca para carteira: parcelas, status, vencimentos e recebimentos agregados suficientes para leitura, sem expor dados sensiveis de terceiros.

**Clean Architecture**:
- Ports devem ser definidos a partir da necessidade de `credores`, nao como espelho de repositories de `credito`, `contratos` ou `cobranca`.
- Use cases de `credores` dependem das ports; adapters fazem a traducao para os modulos donos.
- Nao retornar entidades JPA de outros modulos pela port.

### Definicao de pronto da Task 17.3
- [ ] Ports orientadas ao consumidor criadas.
- [ ] Adapters implementados sem vazar entidades JPA.
- [ ] Dados sensiveis do tomador minimizados/mascarados.
- [ ] Testes unitarios de adapters ou use cases com fakes cobrindo os contratos.

---

## Task 17.4 - Use cases de oportunidades, interesse e carteira

**Objetivo**: implementar os casos de uso de listar oportunidades, registrar/cancelar interesse e consultar carteira da credora.

**Pre-requisito**: Task 17.3 concluida.

**Esforco**: 1.5-2 dias.

**Arquivos principais**:
- `credores/application/usecase/ListarOportunidadesCredoraUseCase.java`
- `credores/application/usecase/RegistrarInteresseCredoraUseCase.java`
- `credores/application/usecase/CancelarInteresseCredoraUseCase.java`
- `credores/application/usecase/ConsultarCarteiraCredoraUseCase.java`
- `credores/application/dto/*Command.java`
- `credores/application/dto/*View.java`

**Regras esperadas**:
- Listagem de oportunidades exige credora existente, pertencente ao usuario autenticado ou acesso administrativo autorizado.
- Registrar interesse exige credora `ATIVA` + `ELEGIVEL`.
- Cancelar interesse exige ownership da credora e interesse ainda cancelavel.
- Carteira retorna apenas operacoes da credora solicitante, salvo consulta administrativa autorizada.
- Falhas de concorrencia/duplicidade devem ser tratadas por regra de dominio ou constraint traduzida para erro de negocio.

**Transacoes**:
- Registrar/cancelar interesse deve ser transacional.
- Consultas podem usar `@Transactional(readOnly = true)`.
- Eventos de auditoria devem ser publicados dentro da transacao e consumidos `AFTER_COMMIT`.

### Definicao de pronto da Task 17.4
- [ ] Use cases implementados sem depender de HTTP.
- [ ] Ownership e elegibilidade protegidos na application layer.
- [ ] Duplicidade de interesse tratada.
- [ ] Testes unitarios com fakes cobrindo sucesso, inelegivel, ownership e duplicidade.

---

## Task 17.5 - Endpoints REST, DTOs, mapper e OpenAPI

**Objetivo**: expor a jornada backend em `/api/v1/credores/oportunidades` e `/api/v1/credores/carteira`.

**Pre-requisito**: Task 17.4 concluida.

**Esforco**: 1 dia.

**Arquivos principais**:
- `credores/web/controller/EmpresaCredoraOportunidadeController.java`
- `credores/web/controller/EmpresaCredoraCarteiraController.java`
- `credores/web/dto/*Request.java`
- `credores/web/dto/*Response.java`
- `credores/web/mapper/*WebMapper.java`

**Endpoints esperados**:
- `GET /api/v1/credores/oportunidades`
  - lista oportunidades elegiveis para a credora autenticada.
- `GET /api/v1/credores/oportunidades/{id}`
  - detalhe operacional da oportunidade.
- `POST /api/v1/credores/oportunidades/{id}/interesses`
  - registra interesse da credora autenticada.
- `DELETE /api/v1/credores/oportunidades/{id}/interesses/me`
  - cancela interesse proprio quando permitido.
- `GET /api/v1/credores/carteira`
  - lista operacoes financiadas da credora autenticada.
- `GET /api/v1/credores/carteira/{id}`
  - detalhe de uma operacao financiada da propria credora.

**Seguranca**:
- Todos os endpoints exigem JWT.
- Endpoints `me`/proprios usam usuario autenticado e ownership.
- Consulta administrativa, se exposta nesta sprint, deve exigir `ADMIN` e ficar claramente separada do fluxo da credora.

**OpenAPI**:
- Documentar status HTTP, ownership, erros 403/404/409/422 e payloads sem dados sensiveis do tomador.

### Definicao de pronto da Task 17.5
- [ ] Endpoints REST criados com DTOs e mapper.
- [ ] Segurança/ownership aplicada.
- [ ] OpenAPI atualizado.
- [ ] Testes de controller ou E2E parcial cobrindo status principais.

---

## Task 17.6 - Auditoria e testes focados

**Objetivo**: registrar eventos sensiveis da jornada credora e cobrir o fluxo completo oportunidade -> interesse -> carteira.

**Pre-requisito**: Task 17.5 concluida.

**Esforco**: 1-1.5 dia.

**Arquivos principais**:
- `credores/application/listener/CredoresAuditListener.java` ou listener complementar.
- `shared/audit/TipoEventoSeguranca.java`
- Migration para ampliar CHECK de audit, se aplicavel.
- `src/test/java/com/dynamis/sep_api/credores/**`

**Eventos de auditoria esperados**:
- `CREDORA_INTERESSE_REGISTRADO`
- `CREDORA_INTERESSE_CANCELADO`
- `CREDORA_OPERACAO_ASSOCIADA` quando houver associacao de operacao financiada nesta sprint.

**Cenarios minimos de teste**:
- Credora elegivel lista oportunidades.
- Credora inelegivel nao registra interesse.
- Credora registra interesse com sucesso.
- Interesse duplicado retorna conflito.
- Credora cancela interesse proprio.
- Usuario nao acessa carteira/interesse de outra credora.
- Admin consulta detalhe operacional quando endpoint administrativo existir.
- Auditoria registra interesse/cancelamento apos commit.

**Comandos sugeridos**:
```bash
cd <sep-api-root>
./gradlew test --tests "*Credora*"
./gradlew test
```

### Definicao de pronto da Task 17.6
- [ ] Eventos de auditoria criados e persistidos apos commit.
- [ ] Testes unitarios e de integracao proporcionais verdes.
- [ ] Fluxo oportunidade -> interesse -> carteira coberto.
- [ ] Erros de ownership/elegibilidade/duplicidade cobertos.

---

## Task 17.7 - Docs, collections e fechamento

**Objetivo**: atualizar documentacao e artefatos operacionais apos a implementacao estar validada.

**Pre-requisito**: Tasks 17.1-17.6 concluidas e revisadas.

**Esforco**: 0.5 dia.

**Arquivos esperados**:
- `docs-SEP/repos/sep-api/CREDORES.md`
- `docs-SEP/docs-sep/PRD.md`
- `docs-SEP/docs-sep/CONTEXT.md`
- `docs-SEP/AI-ROADMAP.md`
- Collections Postman/Insomnia quando houver endpoints novos ou alterados.

**Checklist**:
- Documentar entidades, fluxo, endpoints e erros.
- Registrar Sprint 17 como implementada somente apos merge/fechamento confirmado.
- Atualizar roadmap para apontar este step e a doc operacional.
- Atualizar collections com pasta "Credores - Sprint 17" ou equivalente.

### Definicao de pronto da Task 17.7
- [ ] Docs operacionais atualizadas.
- [ ] PRD/CONTEXT atualizados com status real.
- [ ] AI-ROADMAP revisado.
- [ ] Collections atualizadas quando aplicavel.
- [ ] Checkpoint final pronto para commit/PR.

---

## Definition of Done da Sprint 17

- [ ] Credora elegivel consegue listar oportunidades e registrar/cancelar interesse.
- [ ] Credora consulta carteira inicial com operacoes e status associados.
- [ ] Cliente comum nao acessa dados de outra credora.
- [ ] Backoffice/admin possui consulta de suporte quando prevista.
- [ ] `credores` nao acessa repositories internos de `credito`, `contratos` ou `cobranca`.
- [ ] Migrations aplicam em banco limpo e banco existente.
- [ ] Auditoria registra interesse, cancelamento e associacao quando houver.
- [ ] Testes proporcionais verdes.
- [ ] Documentacao e collections atualizadas.
