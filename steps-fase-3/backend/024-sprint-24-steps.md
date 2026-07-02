# Steps - Sprint 24 - Consulta de Renegociacao Ativa do Tomador

**Spec de origem**: [`024-sprint-24-cobranca-renegociacao-tomador.md`](../../specs/fase-3/024-sprint-24-cobranca-renegociacao-tomador.md)

**Status**: mergeada em `develop` via PR #83 (squash `2a41c51`); ainda nao promovida a `main`. Desbloqueio backend B2 da M-Sprint 9 (M-9.5 liberada).

**Objetivo geral**: permitir que o tomador owner descubra e leia uma proposta de
renegociacao ativa antes da decisao, com termos financeiros calculados no backend e sem
expor dados operacionais.

**Esforco total estimado**: 1-2 dias de Dev Senior Backend.

**Repos de destino**:
- `sep-api`: use case, controller/DTO, mapper e testes.
- `docs-SEP`: specs, steps, docs operacionais e collection; Git manual.

**Branch sugerida**:
- `feature/sprint-24-cobranca-renegociacao-tomador`

**Pre-requisitos**:
- Sprint 23 mergeada em `develop`.
- `CobrancaTomadorController` e padrao de ownership B1 disponiveis.
- Renegociacao da Sprint 13 integrada.
- `RenegociacaoRepository.findByParcelaOriginalIdAndStatus` disponivel.
- `Clock` injetavel e regra `Renegociacao.expirouEm` preservados.

## Decisoes tecnicas

- Estender o controller do tomador criado na Sprint 23.
- Validar ownership da parcela antes de consultar/revelar proposta ativa.
- Retornar somente `StatusRenegociacao.PROPOSTA` e ainda nao expirada pelo `Clock`.
- Criar `RenegociacaoTomadorResult` e `RenegociacaoTomadorResponse`; nao reutilizar
  `RenegociacaoResponse`, que expoe IDs operacionais.
- Calcular `valorTotalRenegociado` na aplicacao, nunca no mobile.
- Nao expor `justificativa`: o campo existente e operacional e nao possui contrato de
  conteudo seguro para cliente.
- GET nao usa step-up, lock pessimista, evento, auditoria ou mutacao.
- Nao criar migration nem novo padrao GoF.

## Protocolo obrigatorio por Task

1. Executar somente a Task liberada pelo usuario.
2. Confirmar codigo e contratos atuais antes de editar.
3. Escrever teste comportamental antes da mudanca quando o risco for ownership/expiracao.
4. Implementar a menor mudanca coerente.
5. Parar em checkpoint pre-commit por Task.
6. Aguardar aprovacao antes de `git add` e `git commit`.
7. Usar paths especificos; nunca `git add -A`.

**Skills obrigatorias**:
- `coding-guidelines`: simplicidade, mudancas cirurgicas e verificacao orientada a meta.
- `clean-code`: nomes intencionais, funcoes pequenas e testes F.I.R.S.T.
- `clean-architecture`: regra de consulta na aplicacao; DTO restrito a web.
- `design-patterns-java`: sem pattern-itis; repository/use case existentes resolvem o caso.

## Ordem de execucao

```text
24.0 prechecks
  -> 24.1 query owner-scoped + Clock
  -> 24.2 DTO/controller
  -> 24.3 testes e integracao com PATCHes
  -> 24.4 docs, collection e fechamento
```

---

## Gate 24.0 - Prechecks

**Objetivo**: confirmar Sprint 23 integrada, contrato de renegociacao e baseline.

### Step 024.0.1 - Confirmar cadeia Git

```bash
cd <sep-api-root>
git fetch --all --prune
git status --short --branch
git log --oneline --decorate -15 origin/develop
git log --oneline --decorate -12 origin/main
```

**Verificacao**:
- Sprint 23 e seu endpoint B1 presentes em `origin/develop`.
- Working tree limpo ou alteracoes do usuario identificadas.
- Se a Sprint 23 nao estiver integrada, nao iniciar a Sprint 24 sem aprovacao explicita.

### Step 024.0.2 - Criar branch e tratar PR temporario

```bash
cd <sep-api-root>
git switch develop
git pull --ff-only
git switch -c feature/sprint-24-cobranca-renegociacao-tomador
```

Em `docs-SEP`, remover `repos/sep-api/SPRINT-23-PR.md` somente depois de usado no PR.

### Step 024.0.3 - Reconfirmar contrato atual

```bash
cd <sep-api-root>
sed -n '1,280p' src/main/java/com/dynamis/sep_api/cobranca/domain/model/Renegociacao.java
sed -n '1,220p' src/main/java/com/dynamis/sep_api/cobranca/infrastructure/persistence/RenegociacaoRepository.java
sed -n '1,260p' src/main/java/com/dynamis/sep_api/cobranca/application/usecase/AceitarRenegociacaoUseCase.java
sed -n '1,220p' src/main/java/com/dynamis/sep_api/cobranca/application/usecase/RecusarRenegociacaoUseCase.java
sed -n '1,240p' src/main/java/com/dynamis/sep_api/cobranca/web/dto/RenegociacaoResponse.java
```

**Verificacao**:
- Repository por parcela/status continua disponivel.
- `PROPOSTA`, `ACEITA`, `RECUSADA` e `EXPIRADA` continuam os status reais.
- `expirouEm` usa comparacao inclusiva no instante de expiracao.
- PATCH aceite exige step-up e recusa nao.
- `RenegociacaoResponse` continua inadequado para a leitura publica.

### Step 024.0.4 - Rodar baseline

```bash
cd <sep-api-root>
./gradlew check
```

### Definicao de pronto do Gate 24.0

- [x] Sprint 23 integrada.
- [x] Branch Sprint 24 criada.
- [x] PR temporario anterior tratado.
- [x] Contrato atual reconfirmado.
- [x] Baseline verde ou falha preexistente documentada.

---

## Task 24.1 - Query owner-scoped com expiracao por Clock

**Objetivo**: localizar somente uma proposta ativa de parcela propria, sem revelar
existencia antes da ownership.

**Esforco**: 0,5 dia.

**Arquivos esperados**:
- `cobranca/application/dto/RenegociacaoTomadorResult.java`
- `cobranca/application/usecase/ConsultarRenegociacaoAtivaTomadorUseCase.java`
- evolucao controlada de `RenegociacaoNaoEncontradaException.java`.
- testes correspondentes.

### Step 024.1.1 - Escrever testes do use case

Cobrir:
- owner com `PROPOSTA` futura recebe termos.
- owner sem proposta ativa recebe `RenegociacaoNaoEncontradaException`.
- proposta `ACEITA`, `RECUSADA` ou `EXPIRADA` nao e ativa.
- `PROPOSTA` com `dataExpiracao == agora` nao e ativa.
- `PROPOSTA` vencida antes do job nao e ativa.
- parcela inexistente ou alheia recebe `CobrancaOwnershipException`.
- repository de renegociacao nao e consultado antes de ownership valida.
- valor total e calculado no backend.

### Step 024.1.2 - Criar result de aplicacao

```text
RenegociacaoTomadorResult
  renegociacaoId
  parcelaId
  status
  novoValorParcela
  numeroParcelas
  valorTotalRenegociado
  novoVencimento
  desconto
  dataProposta
  dataExpiracao
```

Nao incluir justificativa, tomador, operador ou IDs de agenda.

### Step 024.1.3 - Evoluir excecao de ausencia

Adicionar factory clara a `RenegociacaoNaoEncontradaException`, por exemplo:

```text
porParcela(UUID parcelaId)
```

Preservar o codigo `COB-404-003` e o construtor usado pelos PATCHes.

### Step 024.1.4 - Implementar use case

`ConsultarRenegociacaoAtivaTomadorUseCase.executar(parcelaId, tomadorAutenticadoId)`:
1. Busca parcela em transacao read-only.
2. Valida contrato/tomador via `ContratoCobrancaQueryPort`.
3. Para parcela ausente/alheia, lanca `CobrancaOwnershipException`.
4. Busca `findByParcelaOriginalIdAndStatus(parcelaId, PROPOSTA)`.
5. Se ausente ou `expirouEm(OffsetDateTime.now(clock))`, lanca
   `RenegociacaoNaoEncontradaException.porParcela`.
6. Calcula `valorTotalRenegociado` com `BigDecimal`, sem `double`.
7. Retorna result publico.

Nao chamar o job de expiracao nem persistir mudanca durante o GET.

### Verificacao

```bash
./gradlew test --tests "*ConsultarRenegociacaoAtivaTomadorUseCaseTest"
```

### Definicao de pronto da Task 24.1

- [x] Ownership ocorre antes da busca da proposta.
- [x] Clock controla expiracao.
- [x] Estados finais nao sao ativos.
- [x] Total usa BigDecimal no backend.
- [x] Result nao expoe campos internos.
- [x] Testes focados passam.

### Commit sugerido

```text
feat(cobranca): consultar renegociacao ativa do tomador
```

---

## Task 24.2 - DTO e endpoint REST de renegociacao ativa

**Objetivo**: publicar termos financeiros minimos para a decisao do tomador.

**Esforco**: 0,5 dia.

**Arquivos esperados**:
- `cobranca/web/dto/RenegociacaoTomadorResponse.java`
- `cobranca/web/controller/CobrancaTomadorController.java`
- `cobranca/web/mapper/CobrancaWebMapper.java`
- teste de controller.

### Step 024.2.1 - Criar DTO publico

Adicionar exatamente os dez campos da spec 024, com `@Schema`.

**Assercoes negativas obrigatorias**:
- sem `tomadorId`.
- sem `propostaPor`.
- sem IDs de agenda.
- sem `statusParcelaAnterior`.
- sem `justificativa`.

### Step 024.2.2 - Estender mapper

Mapear `RenegociacaoTomadorResult -> RenegociacaoTomadorResponse` explicitamente.
Nao reutilizar o factory `RenegociacaoResponse.from`.

### Step 024.2.3 - Estender controller do tomador

Adicionar:

```http
GET /api/v1/cobranca/parcelas/{parcelaId}/renegociacao-ativa
```

**Regras**:
- `@PreAuthorize("hasRole('CLIENTE')")`.
- Sem `@RequireStepUp`.
- `200` somente para proposta ativa.
- Documentar `200`, `400`, `401`, `403` e `404`.
- Nao alterar PATCH aceite/recusa.

### Step 024.2.4 - Testar contrato web

Cobrir:
- owner recebe `200`.
- sem proposta ativa recebe `404`.
- ownership falha com `403` generico, sem UUID e sem diferenciar ausente/alheia.
- UUID invalido recebe `400`.
- `FINANCEIRO`/`ADMIN` recebem `403` neste endpoint.
- GET nao consulta/consome step-up.
- JSON nao contem campos proibidos.

### Verificacao

```bash
./gradlew test --tests "*CobrancaTomadorControllerTest"
./gradlew spotlessCheck
```

### Definicao de pronto da Task 24.2

- [x] Endpoint exclusivo de cliente.
- [x] GET read-only e sem step-up.
- [x] DTO dedicado e minimo.
- [x] PATCHes preservados.
- [x] Testes e Spotless passam.

### Commit sugerido

```text
feat(cobranca): expor termos de renegociacao ao tomador
```

---

## Task 24.3 - Integracao com fluxo de decisao e regressao

**Objetivo**: provar descoberta -> leitura -> aceite/recusa com seguranca real.

**Esforco**: 0,5 dia.

### Step 024.3.1 - Estender teste de integracao

Cobrir:
- owner descobre proposta e recebe total/termos.
- outro cliente recebe `403`.
- parcela inexistente recebe `403`.
- parcela propria sem proposta recebe `404`.
- proposta vencida pelo Clock recebe `404` antes do job.
- proposta aceita/recusada deixa de aparecer.
- GET nao altera status.

### Step 024.3.2 - Cobrir continuidade com PATCHes

Fluxos:
```text
GET ativa -> PATCH aceite com step-up -> GET ativa 404
GET ativa -> PATCH recusa sem step-up -> GET ativa 404
```

Confirmar que:
- aceite ainda gera agenda substituta.
- recusa restaura status anterior.
- nenhum contrato dos PATCHes foi alterado.

### Step 024.3.3 - Rodar regressao

```bash
./gradlew test --tests "*CobrancaTomador*"
./gradlew test --tests "*RenegociacaoIT"
./gradlew test --tests "*AceitarRenegociacaoUseCaseTest"
./gradlew test --tests "*RecusarRenegociacaoUseCaseTest"
./gradlew test --tests "*ExpirarRenegociacaoJobTest"
```

### Definicao de pronto da Task 24.3

- [x] Descoberta e decisao funcionam em sequencia.
- [x] GET nao altera estado.
- [x] Expiracao por Clock coberta.
- [x] PATCHes nao regrediram.
- [x] Regressao focada passa.

### Commit sugerido

```text
test(cobranca): cobrir consulta de renegociacao ativa
```

---

## Task 24.4 - OpenAPI, docs, collection e fechamento

**Objetivo**: fechar B2 e registrar o desbloqueio da Task M-9.5.

**Esforco**: 0,5 dia.

### Step 024.4.1 - Atualizar documentacao

Atualizar:
- `repos/sep-api/COBRANCA.md`.
- spec/steps 024 com status real.
- spec 209 e step 209: marcar B2 liberado apos merge.
- `docs-sep/PRD-FASE-3.md`.
- `docs-sep/CONTEXT-PARTE-2.md`.
- `AI-ROADMAP.md`.

### Step 024.4.2 - Atualizar collection

Adicionar:

```text
GET /api/v1/cobranca/parcelas/{{parcelaId}}/renegociacao-ativa
```

Exemplos:
- `200` proposta ativa.
- `403` nao-owner.
- `404` sem proposta ativa.

Manter requests PATCH existentes.

### Step 024.4.3 - Rodar gate final

```bash
cd <sep-api-root>
./gradlew check
./gradlew bootJar
```

### Step 024.4.4 - Criar PR description e checkpoint

Criar `repos/sep-api/SPRINT-24-PR.md`. Apresentar status, diff, testes, riscos,
pendencias e mensagem sugerida. Aguardar aprovacao antes de staging/commit.

### Definicao de pronto da Task 24.4

- [x] OpenAPI e collection atualizados.
- [x] Docs refletem contrato entregue.
- [x] M-9.5 marcada como desbloqueada somente apos merge.
- [x] `check` e `bootJar` passam.
- [x] PR description e checkpoint apresentados.

### Commit sugerido

```text
docs(cobranca): documentar consulta de renegociacao ativa
```

## Definition of Done da Sprint 24

- [x] Contrato B2 implementado exatamente como na spec.
- [x] Termos completos e total chegam do backend.
- [x] Ownership, nao enumeracao e expiracao comprovadas.
- [x] GET sem step-up e sem mutacao.
- [x] PATCHes de aceite/recusa preservados.
- [x] Resposta publica minima.
- [x] Testes focados, `check` e `bootJar` verdes.
- [x] Docs e collection atualizados.
- [x] Merge em `develop` registrado antes de executar M-9.5. (PR #83, `2a41c51`)
