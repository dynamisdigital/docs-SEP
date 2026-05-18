# Steps - Sprint 8 - Credito (regras internas + parecer)

**Spec de origem**: [`specs/fase-2/008-sprint-8-credito-regras-parecer.md`](../../specs/fase-2/008-sprint-8-credito-regras-parecer.md)

**Status**: a implementar.

**Objetivo geral**: implementar o modulo `credito` para analise de credito interna, com propostas, motor de regras Java puro, score interno, parecer manual por operador financeiro, auditoria reforcada e contratos REST documentados.

**Esforco total estimado**: 7-10 dias de Dev Senior.

**Repo de destino**:
- `sep-api`: backend Spring Boot, unico repo de codigo alterado nesta sprint.
- `docs-SEP`: documentacao pode ser editada no working tree quando necessario, mas operacao git continua manual.

**Branch sugerida**:
- `feature/sprint-8-credito-regras-parecer`

**Pre-requisitos globais**:
- Sprint 7 concluida e mergeada em `develop`.
- `sep-api` em `develop` atualizado a partir de `origin/develop`.
- Modulo `onboarding` funcional com PF, PJ e PLD.
- Status `APROVADO_FINAL` disponivel em `SolicitacaoOnboarding`.
- Step-up authentication da Sprint 5 funcional.
- `audit_log_seguranca` funcional e extensivel.
- ADRs 0001 e 0007 vigentes.
- Confirmar se ja existe usuario interno para atuar como `FINANCEIRO` nos testes manuais.

**Fora de escopo**:
- Integracao Open Finance.
- Calculo de juros, taxas, IOF, CET ou simulacao financeira completa.
- Motor de regras externo, Drools, JEXL ou MVEL.
- Limites dinamicos por campanha ou produto.
- Telas web/mobile.
- Formalizacao contratual, CCB ou assinatura digital.
- Desembolso, Pix ou conciliacao financeira.

---

## Ordem de execucao recomendada

```text
8.0 (prechecks)
 |
 v
8.1 (dominio + migrations credito)
 |
 +--> 8.2 (motor de regras)
 |
 v
8.3 (use cases proposta + avaliacao)
 |
 v
8.4 (role FINANCEIRO + parecer manual)
 |
 v
8.5 (REST + DTOs + OpenAPI)
 |
 v
8.6 (auditoria reforcada)
 |
 +--> 8.7 (ADR 0011)
 |
 v
8.8 (testes E2E)
 |
 v
8.9 (documentacao + validacao final)
```

- 8.1 deve estabilizar modelo e migrations antes dos use cases.
- 8.2 pode avancar em paralelo com parte da persistencia, desde que os contratos de dominio estejam claros.
- 8.3 depende do motor e dos repositories.
- 8.4 depende dos estados da proposta e da seguranca da Sprint 5.
- 8.5 deve ser feita depois de fechar os contratos internos.
- 8.6 deve estar pronta antes dos testes E2E para validar audit log.
- 8.7 deve ser criada depois da decisao real sobre o motor Java puro.

---

## Task 8.0 - Prechecks da Sprint 8

**Objetivo**: garantir que a Sprint 8 nasce de `develop` atualizado, com Sprint 7 integrada e baseline verde.

**Esforco**: 1-2 horas.

### Step 008.0.1 - Conferir estado Git do `sep-api`

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

### Step 008.0.2 - Criar branch da sprint

**Comandos**:
```bash
cd <sep-api-root>
git switch develop
git pull --ff-only
git switch -c feature/sprint-8-credito-regras-parecer
```

**Verificacao**:
- Branch criada a partir de `develop` atualizado.
- Se `git pull --ff-only` falhar, abortar e avisar o usuario.

### Step 008.0.3 - Rodar baseline backend

**Comandos**:
```bash
cd <sep-api-root>
./gradlew clean test
./gradlew bootJar
```

**Verificacao**:
- Suite passa antes de qualquer alteracao.
- Se os testes dependem de PostgreSQL local, subir o Docker Compose conforme README do `sep-api`.

### Step 008.0.4 - Conferir migrations e pontos de extensao

**Comandos**:
```bash
cd <sep-api-root>
find src/main/resources/db/migration -maxdepth 1 -type f | sort
grep -R "enum TipoEventoSeguranca" -n src/main/java/com/dynamis/sep_api
grep -R "enum Role" -n src/main/java/com/dynamis/sep_api
grep -R "enum StatusOnboarding" -n src/main/java/com/dynamis/sep_api/onboarding
grep -R "APROVADO_FINAL" -n src/main/java/com/dynamis/sep_api/onboarding
grep -R "RequireStepUp" -n src/main/java/com/dynamis/sep_api
```

**Verificacao**:
- Proximo numero livre de migration confirmado.
- Local do enum `Role` confirmado.
- Local do enum `TipoEventoSeguranca` e check constraint de `audit_log_seguranca` confirmado.
- Repositories/use cases de onboarding identificados para consulta de pre-requisito.

### Definicao de pronto da Task 8.0
- [ ] Branch correta criada.
- [ ] Baseline backend verde.
- [ ] Proximo numero de migration confirmado.
- [ ] Pontos de extensao de onboarding, roles, step-up e audit log identificados.

---

## Task 8.1 - Dominio, entidades e migrations de credito

**Objetivo**: criar o nucleo persistente do modulo `credito`.

**Pre-requisito**: Task 8.0 concluida.

**Esforco**: 1-2 dias.

**Arquivos principais**:
- `credito/domain/model/PropostaCredito.java`
- `credito/domain/model/ParecerCredito.java`
- `credito/domain/model/ScoreInterno.java`
- `credito/domain/model/DecisaoCredito.java`
- `credito/domain/model/RegraCreditoAvaliada.java`
- `credito/domain/vo/StatusProposta.java`
- `credito/domain/vo/TipoOperacao.java`
- `credito/domain/vo/Money.java`
- `credito/domain/event/PropostaAprovadaEvent.java`
- `credito/domain/event/PropostaRejeitadaEvent.java`
- `credito/domain/exception/PropostaInvalidaException.java`
- `credito/domain/exception/PropostaNaoEncontradaException.java`
- `credito/infrastructure/persistence/PropostaCreditoRepository.java`
- `credito/infrastructure/persistence/ParecerCreditoRepository.java`
- `credito/infrastructure/persistence/ScoreInternoRepository.java`
- `credito/infrastructure/persistence/DecisaoCreditoRepository.java`
- `credito/infrastructure/persistence/RegraCreditoAvaliadaRepository.java`
- `src/main/resources/db/migration/V<n>__criar_tabelas_credito.sql`

### Step 008.1.1 - Criar VOs e enums do dominio

**Contrato inicial**:
```java
public enum StatusProposta {
    EM_ANALISE,
    PRE_APROVADA,
    APROVADA,
    REJEITADA,
    PENDENCIA
}

public enum TipoOperacao {
    CAPITAL_GIRO,
    OUTROS
}
```

**Regras para `Money`**:
- `Money` deve ser `record`.
- Moeda default: `BRL`.
- Valor deve ser positivo.
- Usar `BigDecimal` com escala 2.
- Nao usar `double` para valores monetarios.

**Testes obrigatorios**:
- `MoneyTest`: valor positivo, valor zero/negativo rejeitado, moeda default BRL.

### Step 008.1.2 - Criar agregado `PropostaCredito`

**Campos minimos**:
- `id`
- `tomadorId`
- `solicitacaoOnboardingId`
- `tipoOperacao`
- `valorSolicitado`
- `moeda`
- `prazoMeses`
- `status`
- campos de auditoria herdados de `EntidadeAuditavel`

**Regras**:
- `tomadorId` obrigatorio.
- `solicitacaoOnboardingId` obrigatorio.
- `valorSolicitado` positivo.
- `prazoMeses` positivo.
- Status inicial: `EM_ANALISE`.
- Estados finais: `APROVADA`, `REJEITADA`.
- Nao permitir novo parecer final se a proposta ja estiver finalizada, salvo decisao explicita de reabertura futura.

**Transicoes validas**:
```text
EM_ANALISE -> PRE_APROVADA
EM_ANALISE -> REJEITADA
EM_ANALISE -> PENDENCIA
PRE_APROVADA -> APROVADA
PRE_APROVADA -> REJEITADA
PRE_APROVADA -> PENDENCIA
PENDENCIA -> APROVADA
PENDENCIA -> REJEITADA
PENDENCIA -> EM_ANALISE
```

**Testes obrigatorios**:
- `PropostaCreditoTest`: criacao valida, valor invalido, prazo invalido, transicoes validas, transicoes invalidas, finalizacao bloqueia nova finalizacao.

### Step 008.1.3 - Criar entidades filhas

**`ScoreInterno`**:
- 1:1 com proposta.
- Campos: `propostaId`, `valor`, `statusSugerido`, `falhas`, `pendencias`, `dataCalculo`.
- Score deve ficar entre 0 e 1000.

**`RegraCreditoAvaliada`**:
- N:1 com proposta.
- Campos: `propostaId`, `nomeRegra`, `resultado`, `motivo`, `bloqueante`, `dataAvaliacao`.
- Resultado: `PASSOU`, `FALHOU`, `PENDENTE`.

**`ParecerCredito`**:
- N:1 com proposta.
- Campos: `propostaId`, `pareceristaId`, `decisao`, `justificativa`, `versao`, `dataParecer`.
- Decisao: `APROVAR`, `REJEITAR`, `PENDENCIA`.
- Justificativa obrigatoria.

**`DecisaoCredito`**:
- 1:1 com proposta.
- Campos: `propostaId`, `statusFinal`, `origem` (`MOTOR` ou `MANUAL`), `scoreMotor`, `parecerId`, `dataDecisao`.

### Step 008.1.4 - Criar migration de credito

**Arquivo**: `src/main/resources/db/migration/V<n>__criar_tabelas_credito.sql`

**Tabelas obrigatorias**:
- `proposta_credito`
- `score_interno`
- `regra_credito_avaliada`
- `parecer_credito`
- `decisao_credito`

**Regras SQL**:
- IDs UUID nativos.
- Tabelas/colunas em portugues.
- FKs para `usuario(id)` e `solicitacao_onboarding(id)`.
- Indices por `status`, `tomador_id`, `solicitacao_onboarding_id`.
- Checks para `valor_solicitado > 0`, `prazo_meses > 0`, `score` entre 0 e 1000.
- Nao usar cascade delete em dados de credito; manter trilha auditavel.

**Schema minimo de referencia**:
```sql
CREATE TABLE proposta_credito (
    id UUID PRIMARY KEY,
    tomador_id UUID NOT NULL REFERENCES usuario(id),
    solicitacao_onboarding_id UUID NOT NULL REFERENCES solicitacao_onboarding(id),
    tipo_operacao VARCHAR(40) NOT NULL,
    valor_solicitado NUMERIC(15,2) NOT NULL,
    moeda VARCHAR(3) NOT NULL,
    prazo_meses INTEGER NOT NULL,
    status VARCHAR(40) NOT NULL,
    data_criacao TIMESTAMP WITH TIME ZONE NOT NULL,
    data_modificacao TIMESTAMP WITH TIME ZONE NOT NULL,
    criado_por VARCHAR(50) NOT NULL,
    modificado_por VARCHAR(50) NOT NULL,
    CONSTRAINT chk_proposta_credito_valor CHECK (valor_solicitado > 0),
    CONSTRAINT chk_proposta_credito_prazo CHECK (prazo_meses > 0)
);

CREATE INDEX idx_proposta_credito_status ON proposta_credito(status);
CREATE INDEX idx_proposta_credito_tomador ON proposta_credito(tomador_id);
CREATE INDEX idx_proposta_credito_onboarding ON proposta_credito(solicitacao_onboarding_id);
```

### Step 008.1.5 - Criar repositories e testes de persistencia

**Repositories**:
- Seguir padrao dos repositories das Sprints 6/7.
- Criar queries especificas para:
  - buscar por id + ownership.
  - listar por status.
  - listar por tomador.
  - buscar score/decisao por proposta.

**Testes obrigatorios**:
- `PropostaCreditoRepositoryTest`.
- `ScoreInternoRepositoryTest`.
- `ParecerCreditoRepositoryTest`.

**Comandos de verificacao**:
```bash
cd <sep-api-root>
./gradlew test --tests "*PropostaCreditoTest" --tests "*Credito*RepositoryTest"
```

### Definicao de pronto da Task 8.1
- [ ] Entidades de credito persistem corretamente.
- [ ] Transicoes de dominio cobertas.
- [ ] Migration aplicada no boot.
- [ ] Repositories cobertos por testes.
- [ ] Nao ha cascade delete em dados regulados de credito.

### Checkpoint pre-commit obrigatorio
Ao concluir a Task 8.1, parar antes de `git add`/`git commit` e apresentar:
- arquivos criados/modificados.
- comandos executados e resultado.
- riscos/pendencias.
- sugestao de commit: `feat(credito): modelar propostas e persistencia de credito`.

---

## Task 8.2 - Motor de regras de credito

**Objetivo**: implementar motor Java puro para heuristicas iniciais de credito.

**Pre-requisito**: Task 8.1 com contratos de dominio estabilizados.

**Esforco**: 1-2 dias.

**Arquivos principais**:
- `credito/application/service/MotorRegrasCredito.java`
- `credito/application/service/RegraCredito.java`
- `credito/application/service/CreditoMotorProperties.java`
- `credito/application/service/dto/ResultadoAvaliacaoCredito.java`
- `credito/application/service/dto/RegraResultado.java`
- `credito/application/service/regras/RegraOnboardingAprovado.java`
- `credito/application/service/regras/RegraIdadeMinimaPessoa.java`
- `credito/application/service/regras/RegraTempoExistenciaEmpresa.java`
- `credito/application/service/regras/RegraValorMaximo.java`
- `credito/application/service/regras/RegraPrazoMaximo.java`

### Step 008.2.1 - Definir contratos do motor

**Interface sugerida**:
```java
public interface RegraCredito {
    String nome();

    RegraResultado avaliar(ContextoAvaliacaoCredito contexto);
}
```

**Contexto recomendado**:
- `PropostaCredito`.
- Dados resumidos de onboarding.
- Tipo do solicitante (`PESSOA` ou `EMPRESA`).
- Data de nascimento PF quando existir.
- Data de abertura PJ quando existir.
- Status onboarding.

**Regra importante**:
- Nao fazer regra acessar repository diretamente.
- Use case monta o contexto e injeta no motor.

### Step 008.2.2 - Criar properties configuraveis

**`application.yml`**:
```yaml
app:
  credito:
    motor:
      score-inicial: 1000
      penalidade-falha: 50
      penalidade-pendencia: 20
      score-pre-aprovacao: 700
      score-analise: 400
      idade-minima-pessoa: 18
      tempo-minimo-empresa-meses: 6
      valor-maximo-pf: 50000.00
      valor-maximo-pj: 200000.00
      prazo-maximo-pf-meses: 12
      prazo-maximo-pj-meses: 24
```

**Verificacao**:
- Properties bindam com `@ConfigurationProperties`.
- Teste cobre defaults e override se houver perfil de teste.

### Step 008.2.3 - Implementar regras individuais

**Regras obrigatorias**:
- `RegraOnboardingAprovado`: exige `APROVADO_FINAL`; falha bloqueante.
- `RegraIdadeMinimaPessoa`: PF >= 18 anos; PJ retorna `PASSOU` ou `PENDENTE` conforme contexto.
- `RegraTempoExistenciaEmpresa`: PJ >= 6 meses; PF retorna `PASSOU` ou `PENDENTE` conforme contexto.
- `RegraValorMaximo`: PF <= 50k, PJ <= 200k, configuravel.
- `RegraPrazoMaximo`: PF <= 12 meses, PJ <= 24 meses, configuravel.

**Resultado**:
```java
public enum StatusRegraCredito {
    PASSOU,
    FALHOU,
    PENDENTE
}
```

**Testes obrigatorios**:
- Um teste unitario por regra.
- Casos de contexto incompleto devem retornar `PENDENTE`, exceto onboarding nao aprovado, que retorna `FALHOU` bloqueante.

### Step 008.2.4 - Implementar agregacao do motor

**Formula da Sprint 8**:
```text
score = max(0, scoreInicial - (penalidadeFalha * falhas) - (penalidadePendencia * pendencias))
```

**Status sugerido**:
- Onboarding `FALHOU` bloqueante -> `REJEITADA`.
- Score >= 700 -> `PRE_APROVADA`.
- Score >= 400 -> `EM_ANALISE`.
- Score < 400 -> `REJEITADA`.

**Regra operacional do spec**:
- Se a auditoria reforcada estiver indisponivel ou se o use case nao conseguir persistir a trilha de regras avaliadas, nao promover para `PRE_APROVADA`; retornar `PENDENCIA` com motivo claro.

**Testes obrigatorios**:
- `MotorRegrasCreditoTest`:
  - todas passam -> score 1000 e `PRE_APROVADA`.
  - falhas/pendencias reduzem score.
  - onboarding nao aprovado -> `REJEITADA`.
  - score baixo -> `REJEITADA`.
  - score intermediario -> `EM_ANALISE`.

### Definicao de pronto da Task 8.2
- [ ] Motor nao depende de infraestrutura.
- [ ] Regras individuais cobertas.
- [ ] Thresholds configuraveis em YAML.
- [ ] Resultado do motor contem score, status sugerido e lista de regras.

### Checkpoint pre-commit obrigatorio
Sugestao de commit: `feat(credito): implementar motor de regras interno`.

---

## Task 8.3 - Use cases de proposta e avaliacao

**Objetivo**: implementar criacao, avaliacao automatica, consulta e listagem de propostas.

**Pre-requisitos**: Tasks 8.1 e 8.2 concluidas.

**Esforco**: 1-2 dias.

**Arquivos principais**:
- `credito/application/usecase/CriarPropostaCreditoUseCase.java`
- `credito/application/usecase/AvaliarPropostaUseCase.java`
- `credito/application/usecase/ConsultarPropostaUseCase.java`
- `credito/application/usecase/ListarPropostasPendentesUseCase.java`
- `credito/application/dto/CriarPropostaCreditoCommand.java`
- `credito/application/dto/RegistrarParecerCommand.java`
- `credito/application/dto/PropostaCreditoView.java`
- `credito/application/event/PropostaCreditoCriadaEvent.java` (se usar event-driven interno)
- adapters/read services necessarios para consultar onboarding sem vazar repository interno.

### Step 008.3.1 - Criar porta/read service para onboarding

**Decisao obrigatoria**:
- O modulo `credito` nao deve acessar repository interno de `onboarding` diretamente.
- Criar contrato publico de aplicacao no modulo dono, por exemplo:
  - `onboarding/application/port/in/ConsultarOnboardingCreditoPort.java`
  - ou `onboarding/application/query/ConsultarOnboardingParaCreditoQuery.java`

**Dados minimos retornados**:
- `solicitacaoId`
- `usuarioId`
- `tipoSolicitante`
- `status`
- `dataNascimento` quando PF.
- `dataAberturaEmpresa` quando PJ, se disponivel.

**Verificacao**:
- Dependencia fica de `credito` para interface publica de aplicacao, nao para persistence interna de `onboarding`.

### Step 008.3.2 - Implementar criacao de proposta

**Regras**:
- Usuario autenticado cria proposta para seu proprio onboarding.
- `ROLE_ADMIN` e `ROLE_FINANCEIRO` nao devem criar proposta em nome de cliente nesta sprint, salvo decisao explicita do usuario.
- Onboarding deve existir.
- Onboarding deve pertencer ao usuario autenticado.
- Onboarding deve estar `APROVADO_FINAL`.
- Caso contrario, retornar 422 para pre-condicao de negocio nao atendida.

**Depois de criar**:
- Persistir `PropostaCredito` em `EM_ANALISE`.
- Disparar avaliacao automatica no mesmo fluxo ou via evento transacional.
- Evitar duplicar avaliacao se ocorrer retry da mesma transacao.

### Step 008.3.3 - Implementar avaliacao automatica

**Regras**:
- Montar contexto de avaliacao.
- Executar `MotorRegrasCredito`.
- Persistir `ScoreInterno`.
- Persistir todas as `RegraCreditoAvaliada`.
- Atualizar status da proposta para status sugerido.
- Se status sugerido for `REJEITADA`, persistir `DecisaoCredito` com origem `MOTOR`.
- Se status sugerido for `PRE_APROVADA` ou `EM_ANALISE`, deixar decisao final para parecer manual.

**Auditoria**:
- Publicar evento interno para `PROPOSTA_AVALIADA_MOTOR`.
- O listener de auditoria sera implementado na Task 8.6.

### Step 008.3.4 - Implementar consulta e listagem

**Consulta por id**:
- Cliente consulta apenas propria proposta.
- `ROLE_FINANCEIRO` e `ROLE_ADMIN` consultam qualquer proposta.

**Listagem**:
- Cliente lista apenas proprias propostas.
- `ROLE_FINANCEIRO` e `ROLE_ADMIN` podem filtrar por `status` e `tomadorId`.
- Usar paginacao desde a primeira versao (`Pageable`) para evitar quebra futura.

**Testes obrigatorios**:
- `CriarPropostaCreditoUseCaseTest`.
- `AvaliarPropostaUseCaseTest`.
- `ConsultarPropostaUseCaseTest`.
- `ListarPropostasPendentesUseCaseTest`.

**Comandos de verificacao**:
```bash
cd <sep-api-root>
./gradlew test --tests "*PropostaCreditoUseCaseTest" --tests "*AvaliarPropostaUseCaseTest"
```

### Definicao de pronto da Task 8.3
- [ ] Proposta so nasce com onboarding `APROVADO_FINAL`.
- [ ] Avaliacao automatica persiste score e regras.
- [ ] Consulta/listagem respeitam ownership e roles.
- [ ] Modulo `credito` nao acessa repository interno de `onboarding`.

### Checkpoint pre-commit obrigatorio
Sugestao de commit: `feat(credito): criar use cases de proposta e avaliacao`.

---

## Task 8.4 - Parecer manual e role `FINANCEIRO`

**Objetivo**: adicionar perfil financeiro e permitir decisao manual auditavel com step-up.

**Pre-requisitos**: Tasks 8.1, 8.2 e 8.3 concluidas.

**Esforco**: 1 dia.

**Arquivos principais**:
- `identity/domain/vo/Role.java` ou equivalente atual.
- `src/main/resources/db/migration/V<n>__adicionar_role_financeiro.sql`
- `credito/application/usecase/RegistrarParecerUseCase.java`
- `usuarios/application/usecase/AlterarRoleUsuarioUseCase.java` ou equivalente.
- `usuarios/web/dto/UsuarioRoleUpdateDto.java`
- `usuarios/web/controller/UsuarioController.java` ou controller admin especifico.

### Step 008.4.1 - Adicionar role `FINANCEIRO`

**Regras**:
- Role canonica no dominio/API: `FINANCEIRO`.
- Spring Security deve enxergar authority `ROLE_FINANCEIRO`.
- Atualizar qualquer mapper/helper que converte role em authority.
- Atualizar fixtures/test helpers.

**Migration**:
- Ajustar check constraint da coluna `usuario.role`.
- Nao alterar usuarios existentes.

**Testes obrigatorios**:
- Teste unitario de conversao de role para authority, se existir.
- Teste de migration/repository com usuario `FINANCEIRO`.

### Step 008.4.2 - Criar endpoint admin para alterar role

**Endpoint definido no spec**:
```text
POST /api/v1/usuarios/{id}/role
```

**Request sugerido**:
```json
{
  "role": "FINANCEIRO"
}
```

**Regras**:
- Apenas `ROLE_ADMIN`.
- Exigir step-up se o projeto considerar alteracao de role como operacao sensivel. A spec exige role auditada, e o PRD privilegia step-up em operacoes sensiveis.
- Nao permitir usuario alterar a propria role.
- Auditar como `ROLE_ALTERADO`.
- Retornar `UsuarioResponseDto`.

**Observacao de implementacao**:
- Se o projeto ja separa endpoints admin em `/api/v1/admin/usuarios`, avaliar manter consistencia local. Se mudar o endpoint em relacao ao spec, registrar a decisao no checkpoint e atualizar doc/collection.

### Step 008.4.3 - Implementar `RegistrarParecerUseCase`

**Regras**:
- Apenas `ROLE_FINANCEIRO`.
- Endpoint deve exigir `@RequireStepUp`.
- Proposta deve existir.
- Proposta nao pode estar finalizada.
- Justificativa obrigatoria e com tamanho minimo razoavel.
- Decisao manual sobrepoe a sugestao do motor.
- Decisao `APROVAR` -> status `APROVADA` + `PropostaAprovadaEvent`.
- Decisao `REJEITAR` -> status `REJEITADA` + `PropostaRejeitadaEvent`.
- Decisao `PENDENCIA` -> status `PENDENCIA`.
- Persistir versao incremental do parecer.
- Persistir/atualizar `DecisaoCredito` com origem `MANUAL`.

**Testes obrigatorios**:
- `RegistrarParecerUseCaseTest`:
  - financeiro aprova com sucesso.
  - financeiro rejeita com sucesso.
  - justificativa ausente rejeitada.
  - proposta finalizada rejeita novo parecer.
  - usuario sem role financeiro nao registra parecer.
- Teste web de step-up na Task 8.5.

### Definicao de pronto da Task 8.4
- [ ] Role `FINANCEIRO` funciona em auth/autorizacao.
- [ ] Promocao de role restrita a admin e auditada.
- [ ] Parecer manual persiste decisao final.
- [ ] Eventos de aprovacao/rejeicao publicados.

### Checkpoint pre-commit obrigatorio
Sugestao de commit: `feat(credito): adicionar parecer manual financeiro`.

---

## Task 8.5 - Endpoints REST, DTOs e OpenAPI

**Objetivo**: expor os contratos REST do modulo `credito`.

**Pre-requisitos**: Tasks 8.3 e 8.4 concluidas.

**Esforco**: 1-2 dias.

**Arquivos principais**:
- `credito/web/controller/CreditoController.java`
- `credito/web/dto/CriarPropostaRequest.java`
- `credito/web/dto/PropostaResponse.java`
- `credito/web/dto/RegistrarParecerRequest.java`
- `credito/web/dto/RegraAvaliadaResponse.java`
- `credito/web/dto/ScoreInternoResponse.java`
- `credito/web/dto/ParecerCreditoResponse.java`
- `credito/web/mapper/CreditoWebMapper.java`

### Step 008.5.1 - Criar DTOs

**`CriarPropostaRequest`**:
```java
public record CriarPropostaRequest(
        UUID solicitacaoOnboardingId,
        TipoOperacao tipoOperacao,
        BigDecimal valorSolicitado,
        Integer prazoMeses) {}
```

**Validacoes**:
- `solicitacaoOnboardingId`: `@NotNull`.
- `tipoOperacao`: `@NotNull`.
- `valorSolicitado`: `@NotNull`, `@DecimalMin`.
- `prazoMeses`: `@NotNull`, `@Min(1)`.

**`RegistrarParecerRequest`**:
- `decisao`: `APROVAR`, `REJEITAR`, `PENDENCIA`.
- `justificativa`: obrigatoria.

### Step 008.5.2 - Criar controller

**Endpoints obrigatorios**:
```text
POST /api/v1/credito/propostas
GET /api/v1/credito/propostas/{id}
GET /api/v1/credito/propostas?status=&tomadorId=&page=&size=
POST /api/v1/credito/propostas/{id}/parecer
GET /api/v1/credito/propostas/{id}/regras
```

**Autorizacao**:
- `POST /propostas`: autenticado; cliente cria propria proposta.
- `GET /propostas/{id}`: ownership ou `ROLE_FINANCEIRO`/`ROLE_ADMIN`.
- `GET /propostas`: cliente lista proprias; financeiro/admin podem filtrar.
- `POST /propostas/{id}/parecer`: `ROLE_FINANCEIRO` + `@RequireStepUp`.
- `GET /propostas/{id}/regras`: `ROLE_FINANCEIRO` ou `ROLE_ADMIN`.

### Step 008.5.3 - OpenAPI

**Obrigatorio**:
- `@Tag(name = "credito")`.
- `@Operation` em todos os endpoints.
- `@ApiResponses` com 200/201/400/401/403/404/409/422 quando aplicavel.
- Schemas dos DTOs com exemplos.
- Erros usando `ErrorResponseDto`.

**Teste obrigatorio**:
- Atualizar `OpenApiConfigTest` ou equivalente para validar paths:
  - `/api/v1/credito/propostas`
  - `/api/v1/credito/propostas/{id}`
  - `/api/v1/credito/propostas/{id}/parecer`
  - `/api/v1/credito/propostas/{id}/regras`
  - `/api/v1/usuarios/{id}/role` se implementado.

### Step 008.5.4 - Testes web

**Testes obrigatorios**:
- `CreditoControllerTest`:
  - criar proposta 201.
  - criar proposta sem token 401.
  - consultar propria proposta 200.
  - cliente em proposta alheia 403.
  - financeiro consulta qualquer 200.
  - cliente tenta registrar parecer 403.
  - financeiro registra parecer sem step-up 403.
  - financeiro registra parecer com step-up 200.
  - listar regras como financeiro 200.

**Comandos de verificacao**:
```bash
cd <sep-api-root>
./gradlew test --tests "*CreditoControllerTest" --tests "*OpenApiConfigTest"
```

### Definicao de pronto da Task 8.5
- [ ] 5 endpoints REST expostos.
- [ ] DTOs records com validacao declarativa.
- [ ] MapStruct usado para mapper web.
- [ ] OpenAPI atualizado.
- [ ] Autorizacao e step-up cobertos por `@WebMvcTest`.

### Checkpoint pre-commit obrigatorio
Sugestao de commit: `feat(credito): expor contratos REST de propostas`.

---

## Task 8.6 - Auditoria reforcada de credito

**Objetivo**: registrar eventos sensiveis de credito no `audit_log_seguranca`.

**Pre-requisitos**: Tasks 8.3 e 8.4 concluidas.

**Esforco**: 1 dia.

**Arquivos principais**:
- enum atual de `TipoEventoSeguranca`.
- `src/main/resources/db/migration/V<n>__adicionar_eventos_auditoria_credito.sql`
- `credito/application/listener/CreditoAuditListener.java`
- eventos de dominio/aplicacao necessarios.

### Step 008.6.1 - Adicionar eventos de auditoria

**Eventos obrigatorios**:
```text
PROPOSTA_CRIADA
PROPOSTA_AVALIADA_MOTOR
PARECER_REGISTRADO
PROPOSTA_APROVADA
PROPOSTA_REJEITADA
ROLE_ALTERADO
```

**Migration**:
- Atualizar check constraint de `audit_log_seguranca.tipo_evento` com os novos valores.
- Preservar todos os eventos das Sprints 5-7.

### Step 008.6.2 - Implementar listener

**Padrao obrigatorio**:
- Seguir padrao do `OnboardingAuditListener`.
- Usar `@TransactionalEventListener(phase = AFTER_COMMIT)`.
- Usar `@Transactional(propagation = REQUIRES_NEW)` quando gravar audit log.
- Serializar detalhes com `ObjectMapper`, nao concatenacao manual.

**Dados permitidos no audit log**:
- `propostaId`
- `tomadorId`
- `solicitacaoOnboardingId`
- `statusAnterior`
- `statusNovo`
- `score`
- `statusSugerido`
- `decisaoManual`
- `pareceristaId`
- justificativa truncada para limite seguro.

**Dados proibidos**:
- Payload bruto de documentos.
- Dados completos de PLD.
- Informacoes bancarias futuras.

### Step 008.6.3 - Garantir auditoria antes de promover status

**Regra do spec**:
- Motor nao pode rodar sem auditoria.
- Na pratica, se a aplicacao nao conseguir persistir `RegraCreditoAvaliada` ou publicar evento de auditoria, nao deve deixar a proposta como `PRE_APROVADA`; mover para `PENDENCIA` com motivo tecnico claro.

**Testes obrigatorios**:
- `CreditoAuditListenerTest`.
- Cenario com detalhes escapados corretamente.
- Cenario de `PARECER_REGISTRADO` contendo score do motor e decisao manual.

### Definicao de pronto da Task 8.6
- [ ] Eventos novos no enum Java e no check SQL.
- [ ] Listener grava audit log apos commit.
- [ ] Dados sensiveis nao vazam no audit log.
- [ ] Testes cobrem eventos principais.

### Checkpoint pre-commit obrigatorio
Sugestao de commit: `feat(credito): auditar eventos de analise de credito`.

---

## Task 8.7 - ADR 0011 - Motor de regras de credito interno

**Objetivo**: documentar a decisao de manter motor de regras em classes Java puras nesta sprint.

**Pre-requisito**: Task 8.2 implementada ou prototipada o suficiente para validar a decisao.

**Esforco**: 2-4 horas.

**Arquivo**:
- `docs-SEP/adr/0011-motor-de-regras-de-credito-interno.md`

### Step 008.7.1 - Criar ADR 0011

**Conteudo minimo**:
- Contexto: regras de credito mutaveis, necessidade de rastreabilidade.
- Alternativas:
  - classes Java puras + config YAML.
  - Drools.
  - JEXL/MVEL.
  - servico externo.
- Decisao: classes Java puras na Sprint 8.
- Motivos:
  - regras iniciais poucas e estaveis.
  - sem nova dependencia operacional.
  - melhor debug e cobertura de testes neste momento.
  - menor risco para Fase 2.
- Consequencias:
  - deploy necessario para mudar regra estrutural.
  - config YAML cobre apenas thresholds/pesos.
  - revisitar quando houver muitas regras ou campanhas dinamicas.
- Gatilhos de revisao:
  - mais de 20 regras ativas.
  - Epic 10/Jornada Credora exigir campanhas por linha de produto.
  - necessidade de simular regra sem deploy.

### Step 008.7.2 - Referenciar ADR na documentacao

**Atualizar quando aplicavel**:
- `docs-SEP/repos/sep-api/CREDITO.md` na Task 8.9.
- PR description da Sprint 8.
- Comentario curto no motor apontando para ADR somente se ajudar manutencao.

### Definicao de pronto da Task 8.7
- [ ] ADR criado.
- [ ] Decisao coerente com implementacao real.
- [ ] Gatilhos de revisao explicitos.

### Checkpoint pre-commit obrigatorio
Como `docs-SEP` tem operacao git manual, nao fazer commit deste arquivo. No checkpoint, listar o ADR como alteracao documental para revisao humana.

---

## Task 8.8 - Testes de integracao end-to-end

**Objetivo**: validar o ciclo completo proposta -> avaliacao -> parecer -> auditoria.

**Pre-requisitos**: Tasks 8.1 a 8.6 concluidas.

**Esforco**: 1-2 dias.

**Arquivo principal**:
- `credito/web/CreditoIT.java`

### Step 008.8.1 - Preparar fixtures de usuarios e onboarding

**Fixtures necessarias**:
- Usuario `CLIENTE` com onboarding PF ou PJ `APROVADO_FINAL`.
- Usuario `CLIENTE` sem onboarding aprovado.
- Usuario `FINANCEIRO`.
- Usuario `ADMIN`.
- Step-up token valido para financeiro.

**Regras**:
- Reutilizar helpers de smoke/E2E das Sprints 5-7 quando existirem.
- Evitar depender de rede ou Celcoin.
- Criar dados via repositories/use cases ou endpoints, conforme padrao dos ITs existentes.

### Step 008.8.2 - Cobrir fluxo feliz

**Cenario**:
```text
Tomador com onboarding APROVADO_FINAL
 -> cria proposta
 -> motor avalia
 -> score >= 700
 -> status PRE_APROVADA
 -> financeiro registra parecer APROVAR com step-up
 -> status APROVADA
 -> audit log contem PROPOSTA_CRIADA, PROPOSTA_AVALIADA_MOTOR, PARECER_REGISTRADO, PROPOSTA_APROVADA
```

### Step 008.8.3 - Cobrir negativos obrigatorios

**Cenarios**:
- Tomador sem onboarding aprovado cria proposta -> 422.
- Valor acima do limite reduz score e exige analise manual.
- Financeiro rejeita proposta -> `REJEITADA`.
- Cliente tenta listar pendentes de todos -> 403 ou lista apenas proprias, conforme contrato implementado.
- Financeiro registra parecer sem step-up -> 403.
- Nao-admin tenta alterar role -> 403.
- Admin promove usuario para `FINANCEIRO` -> 200.

### Step 008.8.4 - Rodar suite completa relevante

**Comandos**:
```bash
cd <sep-api-root>
./gradlew test --tests "*Credito*"
./gradlew check
```

**Verificacao**:
- Testes de credito verdes.
- JaCoCo geral nao regride.
- Cobertura do modulo `credito` >= 70%.
- Spotless verde.

### Definicao de pronto da Task 8.8
- [ ] Fluxo feliz E2E coberto.
- [ ] Negativos principais cobertos.
- [ ] Audit log validado em integracao.
- [ ] `./gradlew check` verde.

### Checkpoint pre-commit obrigatorio
Sugestao de commit: `test(credito): cobrir ciclo de proposta e parecer`.

---

## Task 8.9 - Documentacao, collections e validacao final

**Objetivo**: consolidar documentacao operacional do modulo credito e preparar handoff da Sprint 8.

**Pre-requisitos**: Tasks 8.1 a 8.8 concluidas.

**Esforco**: 0.5-1 dia.

**Decisao travada sobre `SPRINT-8-PR.md`**:
- Nao criar `docs-SEP/repos/sep-api/SPRINT-8-PR.md` no inicio da Sprint 8.
- Criar este arquivo somente no final da implementacao, dentro da Task 8.9, depois que migrations, endpoints, testes, auditoria e documentacao do modulo estiverem estabilizados.
- Motivo: `SPRINT-8-PR.md` e uma descricao consolidada do PR real, nao um plano preliminar. Criar antes da implementacao aumenta risco de divergencia entre o documento e o codigo entregue.
- Quando criado, atualizar tambem `docs-SEP/repos/sep-api/README.md` para incluir o link do novo arquivo.

**Arquivos esperados**:
- `docs-SEP/repos/sep-api/CREDITO.md`
- `docs-SEP/repos/sep-api/SPRINT-8-PR.md`
- `docs-SEP/docs-sep/sep-api.postman_collection.json` se os endpoints forem adicionados.
- `docs-SEP/docs-sep/sep-api.insomnia_collection.json` se os endpoints forem adicionados.
- `sep-api/README.md` se houver instrucoes locais novas.
- `docs-SEP/docs-sep/PRD.md` somente apos conclusao/merge, para marcar Sprint 8 como executada.

### Step 008.9.1 - Criar `CREDITO.md`

**Conteudo minimo**:
- Objetivo do modulo.
- Estados da proposta.
- Diagrama textual do fluxo.
- Regras do motor e thresholds default.
- Como funciona parecer manual.
- Como promover usuario para `FINANCEIRO`.
- Endpoints REST.
- Auditoria e eventos.
- Como rodar smoke local.
- Limitacoes: sem Open Finance, sem juros/taxas, sem formalizacao.

### Step 008.9.2 - Atualizar collections

**Endpoints a adicionar**:
```text
POST /api/v1/credito/propostas
GET /api/v1/credito/propostas/{id}
GET /api/v1/credito/propostas
POST /api/v1/credito/propostas/{id}/parecer
GET /api/v1/credito/propostas/{id}/regras
POST /api/v1/usuarios/{id}/role
```

**Variaveis sugeridas**:
- `propostaCreditoId`
- `financeiroAccessToken`
- `financeiroRefreshToken`
- `financeiroId`

**Verificacao**:
```bash
cd <docs-SEP-root>
jq empty docs-sep/sep-api.postman_collection.json
jq empty docs-sep/sep-api.insomnia_collection.json
```

### Step 008.9.3 - Criar descricao de PR

**Arquivo sugerido**:
- `docs-SEP/repos/sep-api/SPRINT-8-PR.md`

**Conteudo minimo**:
- Titulo sugerido.
- Resumo.
- Escopo tecnico.
- Endpoints novos.
- Migrations novas.
- Testes executados.
- Riscos e pendencias.
- Referencias ao spec e ao steps.

### Step 008.9.4 - Validacao final da sprint

**Comandos**:
```bash
cd <sep-api-root>
./gradlew clean check
./gradlew bootJar
```

**Opcional smoke local**:
```bash
cd <sep-api-root>
./gradlew bootRun
```

Validar via Swagger/collection:
- Criar cliente e admin/financeiro.
- Fazer login.
- Criar onboarding aprovado via fixture ou fluxo fake.
- Criar proposta.
- Consultar score/regras.
- Registrar parecer com step-up.

### Definicao de pronto da Task 8.9
- [ ] `CREDITO.md` criado.
- [ ] Collections atualizadas se endpoints estiverem prontos.
- [ ] PR description criada.
- [ ] Build/test final verde.
- [ ] PRD atualizado apenas quando a sprint estiver concluida/mergeada, nao antes.

### Checkpoint pre-commit obrigatorio
No fim da sprint, apresentar checkpoint consolidado antes de qualquer staging:
- arquivos criados/modificados/removidos.
- testes/build/lint executados e resultado.
- migrations criadas.
- riscos/pendencias.
- sugestao de commits ou mensagem final.

---

## Definition of Done da Sprint 8

- [ ] Modulo `credito` criado com estrutura DDD + Hexagonal.
- [ ] Entidades e migrations Flyway funcionais.
- [ ] Motor de regras com 5 regras iniciais operacional.
- [ ] Thresholds e pesos configuraveis por `application.yml`.
- [ ] Proposta exige onboarding `APROVADO_FINAL`.
- [ ] Role `FINANCEIRO` adicionada e validada.
- [ ] Parecer manual exige `ROLE_FINANCEIRO` e step-up.
- [ ] Endpoints REST documentados no Swagger.
- [ ] Auditoria reforcada grava eventos de credito.
- [ ] ADR 0011 criado.
- [ ] Suite E2E de credito passando.
- [ ] Cobertura JaCoCo do modulo `credito` >= 70%.
- [ ] `CREDITO.md` criado em `docs-SEP/repos/sep-api/`.
- [ ] Collections Postman/Insomnia atualizadas, se endpoints forem expostos.

---

## Comandos finais recomendados

```bash
cd <sep-api-root>
./gradlew clean check
./gradlew bootJar
git status --short --branch
git diff --stat
```

Se documentos em `docs-SEP` forem alterados:
```bash
cd <docs-SEP-root>
jq empty docs-sep/sep-api.postman_collection.json
jq empty docs-sep/sep-api.insomnia_collection.json
git status --short
```

---

## Riscos e pontos de atencao

- `credito` nao deve acessar repositories internos de `onboarding`.
- Alteracao de `Role` pode impactar web/mobile; manter compatibilidade de enum nas respostas.
- Step-up deve ser aplicado no endpoint de parecer manual.
- Auditoria de credito nao pode conter dados sensiveis desnecessarios.
- Migrations devem preservar dados existentes e constraints das Sprints 5-7.
- Evitar criar motor generico demais nesta sprint; ADR 0011 documenta a escolha simples.
- `ROLE_FINANCEIRO` pode exigir ajustes em fixtures, seeds, collections e testes de auth.

---

## Referencias

- [Spec 008 - Sprint 8 - Credito](../../specs/fase-2/008-sprint-8-credito-regras-parecer.md)
- [Spec 007 - Sprint 7 - Onboarding KYB Empresa + PLD](../../specs/fase-2/007-sprint-7-onboarding-kyb-empresa.md)
- [Spec 005 - Sprint 5 - Endurecimento de Seguranca](../../specs/fase-2/005-sprint-5-endurecimento-seguranca.md)
- [PRD](../../docs-sep/PRD.md)
- [ADR 0001 - Monolito modular orientado a DDD](../../adr/0001-monolito-modular-orientado-a-ddd.md)
- [ADR 0007 - DDD com Hexagonal](../../adr/0007-ddd-com-hexagonal-ports-and-adapters-por-modulo.md)
- ADR 0011 - Motor de regras de credito interno (criado nesta sprint)
