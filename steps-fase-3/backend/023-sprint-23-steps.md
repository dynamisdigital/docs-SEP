# Steps - Sprint 23 - Historico de Recebimentos do Tomador

**Spec de origem**: [`023-sprint-23-cobranca-historico-tomador.md`](../../specs/fase-3/023-sprint-23-cobranca-historico-tomador.md)

**Status**: mergeada em `develop` (PR #81) e promovida a `main` (PR #82). Desbloqueio backend B1 da M-Sprint 9 concluido.

**Objetivo geral**: expor uma consulta read-only de recebimentos por parcela para o
tomador owner, com resposta publica minima e sem reutilizar a listagem operacional de
`FINANCEIRO/ADMIN`.

**Esforco total estimado**: 1-2 dias de Dev Senior Backend.

**Repos de destino**:
- `sep-api`: use case, repository, controller, DTOs e testes.
- `docs-SEP`: specs, steps, docs operacionais e collection; Git manual.

**Branch sugerida**:
- `feature/sprint-23-cobranca-historico-tomador`

**Pre-requisitos**:
- Sprint 22 presente em `origin/develop`.
- `origin/main` sem conteudo de produto ausente de `develop`.
- Sprints 12-13 de cobranca integradas.
- `RecebimentoRepository.findByParcela_IdOrderByDataRecebimentoAsc` e endpoint operacional
  `GET /cobranca/recebimentos` conhecidos.
- ADR 0007 e regra de ownership do modulo `cobranca` vigentes.

## Decisoes tecnicas

- Criar endpoint exclusivo de `CLIENTE`; perfis internos continuam usando
  `GET /api/v1/cobranca/recebimentos`.
- Criar `RecebimentoTomadorResult` e `RecebimentoTomadorResponse`; nao reutilizar
  `RecebimentoResponse`, que contem campos operacionais.
- Validar ownership antes de consultar/retornar recebimentos.
- Parcela inexistente e parcela alheia retornam `403` com corpo generico, sem UUID, para nao permitir enumeracao.
- Ordenar no repository por `dataRecebimento DESC`.
- Nao criar migration, auditoria de leitura, cache, paginacao ou novo padrao GoF.

## Protocolo obrigatorio por Task

1. Executar somente a Task liberada pelo usuario.
2. Confirmar codigo e testes atuais antes de editar.
3. Implementar a menor mudanca aderente ao estilo do modulo.
4. Rodar verificacoes proporcionais ao risco.
5. Parar em checkpoint pre-commit com status, diff, testes, riscos e mensagem sugerida.
6. Aguardar aprovacao antes de `git add` e `git commit`.
7. Usar paths especificos no staging; nunca `git add -A`.

**Skills obrigatorias**:
- `coding-guidelines`: simplicidade, mudancas cirurgicas e verificacao orientada a meta.
- `clean-code`: nomes intencionais, funcoes pequenas e testes F.I.R.S.T.
- `clean-architecture`: result na aplicacao, DTO na web, persistencia isolada no repository.
- `design-patterns-java`: recusar pattern-itis; esta consulta nao exige novo padrao GoF.

## Ordem de execucao

```text
23.0 prechecks
  -> 23.1 query owner-scoped
  -> 23.2 DTO/controller
  -> 23.3 testes e seguranca
  -> 23.4 docs, collection e fechamento
```

---

## Gate 23.0 - Prechecks

**Objetivo**: confirmar cadeia Git, contrato atual e baseline antes de implementar.

### Step 023.0.1 - Confirmar cadeia de integracao

```bash
cd <sep-api-root>
git fetch --all --prune
git status --short --branch
git log --oneline --decorate -15 origin/develop
git log --oneline --decorate -12 origin/main
git diff --stat origin/develop..origin/main
git diff --stat origin/main..origin/develop
```

**Verificacao**:
- Sprint 22/PR #79 presente em `develop`.
- Promocao para `main` conhecida e conteudo necessario presente em `develop`.
- Working tree limpo ou alteracoes do usuario identificadas.
- Se `main` tiver conteudo ausente em `develop`, reconciliar antes da Sprint 23 ou obter
  aprovacao explicita para a excecao.

### Step 023.0.2 - Criar branch e tratar artefato temporario

```bash
cd <sep-api-root>
git switch develop
git pull --ff-only
git switch -c feature/sprint-23-cobranca-historico-tomador
```

Em `docs-SEP`:
- remover `repos/sep-api/SPRINT-22-PR.md`, ja utilizado no PR #79;
- manter a remocao apenas no working tree documental.

### Step 023.0.3 - Reconfirmar codigo atual

```bash
cd <sep-api-root>
sed -n '1,520p' src/main/java/com/dynamis/sep_api/cobranca/web/controller/CobrancaController.java
sed -n '1,220p' src/main/java/com/dynamis/sep_api/cobranca/application/usecase/ConsultarRecebimentosUseCase.java
sed -n '1,220p' src/main/java/com/dynamis/sep_api/cobranca/infrastructure/persistence/RecebimentoRepository.java
sed -n '1,220p' src/main/java/com/dynamis/sep_api/cobranca/infrastructure/persistence/ParcelaCobrancaRepository.java
sed -n '1,220p' src/main/java/com/dynamis/sep_api/cobranca/application/port/out/ContratoCobrancaQueryPort.java
```

**Verificacao**:
- Endpoint global continua restrito a `FINANCEIRO/ADMIN`.
- `Recebimento` possui campos sensiveis que nao podem entrar na resposta do tomador.
- Ownership de parcela continua derivada de `parcela -> agenda -> contrato`.
- Nao existe endpoint concorrente com o path planejado.

### Step 023.0.4 - Rodar baseline

```bash
cd <sep-api-root>
./gradlew check
```

Registrar resultado e contagem de testes antes da alteracao.

### Definicao de pronto do Gate 23.0

- [ ] Cadeia Git validada.
- [ ] Branch criada da base correta.
- [ ] PR temporario da Sprint 22 tratado.
- [ ] Contratos atuais reconfirmados.
- [ ] Baseline verde ou falha preexistente documentada.

---

## Task 23.1 - Query owner-scoped e result publico

**Objetivo**: consultar recebimentos somente depois de validar que a parcela pertence ao
tomador autenticado.

**Esforco**: 0,5 dia.

**Arquivos esperados**:
- `cobranca/application/dto/RecebimentoTomadorResult.java`
- `cobranca/application/usecase/ConsultarRecebimentosParcelaUseCase.java`
- `cobranca/domain/exception/CobrancaOwnershipException.java`
- `cobranca/infrastructure/persistence/RecebimentoRepository.java`
- testes correspondentes.

### Step 023.1.1 - Escrever testes do use case

Cobrir antes da implementacao:
- owner recebe historico.
- owner sem recebimentos recebe lista vazia.
- parcela inexistente recebe `CobrancaOwnershipException`.
- parcela alheia recebe `CobrancaOwnershipException`.
- repository de recebimentos nao e chamado quando ownership falha.
- resultado contem apenas ID, valor, data e meio de pagamento.

### Step 023.1.2 - Criar result de aplicacao

```text
RecebimentoTomadorResult
  recebimentoId
  valorRecebido
  dataRecebimento
  meioPagamento
```

**Regras**:
- Record imutavel.
- Sem dependencia de web/Jackson/OpenAPI.
- Sem `Recebimento` ou `ParcelaCobranca` escapando da transacao.
- Sem campos nullable inventados; espelhar o dominio persistido.

### Step 023.1.3 - Adicionar query ordenada

Adicionar ao `RecebimentoRepository`:

```text
findByParcela_IdOrderByDataRecebimentoDesc(UUID parcelaId)
```

Manter o metodo ASC existente; ele e preexistente e nao deve ser removido sem prova de
que esta morto e pedido explicito.

### Step 023.1.4 - Implementar use case

Antes do use case, adicionar factory/constructor generico em `CobrancaOwnershipException`, preservando `COB-403-001` e removendo UUID da mensagem usada pelos endpoints do tomador.

`ConsultarRecebimentosParcelaUseCase.executar(parcelaId, tomadorAutenticadoId)`:
1. Busca a parcela dentro de `@Transactional(readOnly = true)`.
2. Se nao existir, lanca `CobrancaOwnershipException` com mensagem generica, sem identificador.
3. Resolve o `contratoId` pela agenda.
4. Resolve o tomador pelo `ContratoCobrancaQueryPort`.
5. Se contrato/tomador nao existir ou nao coincidir, lanca a mesma excecao.
6. Consulta recebimentos DESC.
7. Mapeia para `RecebimentoTomadorResult`.

Nao chamar `ConsultarRecebimentosUseCase.listar()` e filtrar em memoria.

### Verificacao

```bash
./gradlew test --tests "*ConsultarRecebimentosParcelaUseCaseTest"
./gradlew test --tests "*RecebimentoRepositoryTest"
```

### Definicao de pronto da Task 23.1

- [ ] Ownership antecede a consulta de recebimentos.
- [ ] Ausente e alheia usam a mesma excecao.
- [ ] Repository ordena DESC.
- [ ] Result nao contem campos internos.
- [ ] Testes focados passam.

### Commit sugerido

```text
feat(cobranca): consultar recebimentos de parcela propria
```

---

## Task 23.2 - DTO e endpoint REST do tomador

**Objetivo**: publicar o contrato B1 com autorizacao e JSON minimos.

**Esforco**: 0,5 dia.

**Arquivos esperados**:
- `cobranca/web/controller/CobrancaTomadorController.java`
- `cobranca/web/dto/RecebimentoTomadorResponse.java`
- `cobranca/web/mapper/CobrancaWebMapper.java`
- teste de controller.

### Step 023.2.1 - Criar DTO publico

`RecebimentoTomadorResponse` deve conter somente:
- `recebimentoId`.
- `valorRecebido`.
- `dataRecebimento`.
- `meioPagamento`.

Adicionar `@Schema` com exemplos nao sensiveis.

### Step 023.2.2 - Estender mapper

Adicionar mapeamento explicito:

```text
RecebimentoTomadorResult -> RecebimentoTomadorResponse
List<RecebimentoTomadorResult> -> List<RecebimentoTomadorResponse>
```

Nao reutilizar `toRecebimentoResponse(Recebimento)`.

### Step 023.2.3 - Criar controller focado

Criar `CobrancaTomadorController`:

```http
GET /api/v1/cobranca/parcelas/{parcelaId}/recebimentos
```

**Regras**:
- `@PreAuthorize("hasRole('CLIENTE')")`.
- Usa `@AuthenticationPrincipal UsuarioAutenticado`.
- Chama somente `ConsultarRecebimentosParcelaUseCase`.
- Retorna `200` com lista, inclusive vazia.
- Documenta `200`, `400`, `401` e `403`.
- Nao adiciona endpoint ao controller operacional ja sobrecarregado.

### Step 023.2.4 - Testar contrato web

Cobrir:
- `CLIENTE` owner recebe `200`.
- lista vazia retorna `[]`.
- `FINANCEIRO` e `ADMIN` nao usam este endpoint e recebem `403`.
- UUID invalido retorna `400`.
- excecao de ownership retorna `403` com o mesmo codigo/mensagem para ausente e alheia, sem UUID.
- JSON nao contem `movimentacaoEscrowId`, `identificadorExterno`, `novo`,
  `observacao`, `registradoPor` ou `idempotencyKey`.

### Verificacao

```bash
./gradlew test --tests "*CobrancaTomadorControllerTest"
./gradlew spotlessCheck
```

### Definicao de pronto da Task 23.2

- [ ] Endpoint e exclusivo de `CLIENTE`.
- [ ] Controller possui responsabilidade unica.
- [ ] DTO e mapper sao dedicados.
- [ ] JSON minimo validado por testes.
- [ ] Spotless passa.

### Commit sugerido

```text
feat(cobranca): expor historico de recebimentos ao tomador
```

---

## Task 23.3 - Integracao, seguranca e regressao

**Objetivo**: provar o contrato contra banco e seguranca reais.

**Esforco**: 0,5 dia.

### Step 023.3.1 - Cobrir repository

Adicionar teste com recebimentos fora de ordem de insercao e confirmar retorno por
`dataRecebimento DESC`.

### Step 023.3.2 - Criar teste de integracao

Criar `CobrancaTomadorConsultaIT` ou nome equivalente, cobrindo:
- owner com dois recebimentos.
- owner sem recebimentos.
- outro cliente para parcela existente.
- cliente para parcela inexistente.
- endpoint global `/cobranca/recebimentos` continua `403` para cliente.
- endpoint novo nao aceita perfil interno.
- resposta nao contem campos proibidos.

### Step 023.3.3 - Rodar regressao de cobranca

```bash
./gradlew test --tests "*CobrancaTomador*"
./gradlew test --tests "*CobrancaControllerTest"
./gradlew test --tests "*CobrancaIT"
./gradlew test --tests "*RecebimentoRepositoryTest"
```

### Definicao de pronto da Task 23.3

- [ ] Ordenacao provada no banco.
- [ ] Ownership provada com seguranca real.
- [ ] Endpoint operacional nao regrediu.
- [ ] Campos proibidos ausentes.
- [ ] Regressao focada passa.

### Commit sugerido

```text
test(cobranca): cobrir historico owner-scoped
```

---

## Task 23.4 - OpenAPI, docs, collection e fechamento

**Objetivo**: manter contrato operacional e desbloqueio mobile rastreaveis.

**Esforco**: 0,5 dia.

### Step 023.4.1 - Atualizar documentacao

Atualizar:
- `repos/sep-api/COBRANCA.md`.
- spec e steps 023 com status real.
- spec 209 e step 209: marcar B1 liberado apos merge.
- `docs-sep/PRD-FASE-3.md`.
- `docs-sep/CONTEXT-PARTE-2.md`.
- `AI-ROADMAP.md`.

### Step 023.4.2 - Atualizar collection

Adicionar request autenticado:

```text
GET /api/v1/cobranca/parcelas/{{parcelaId}}/recebimentos
```

Incluir exemplos:
- `200` com itens.
- `200 []`.
- `403` nao-owner.

### Step 023.4.3 - Rodar gate final

```bash
cd <sep-api-root>
./gradlew check
./gradlew bootJar
```

### Step 023.4.4 - Criar PR description e checkpoint

Criar `repos/sep-api/SPRINT-23-PR.md` com summary, test plan, contratos, seguranca,
decisoes, follow-ups e commits.

Apresentar status, diff, testes, riscos e mensagem sugerida. Aguardar aprovacao antes de
stage/commit. Push e PR permanecem manuais.

### Definicao de pronto da Task 23.4

- [ ] OpenAPI e collection atualizados.
- [ ] Docs refletem o contrato entregue.
- [ ] M-9.4 marcada como desbloqueada somente apos merge.
- [ ] `check` e `bootJar` passam.
- [ ] PR description e checkpoint apresentados.

### Commit sugerido

```text
docs(cobranca): documentar historico do tomador
```

## Definition of Done da Sprint 23

- [ ] Contrato B1 implementado exatamente como na spec.
- [ ] Ownership e nao enumeracao comprovadas.
- [ ] Resposta publica minima.
- [ ] Nenhuma migration ou mutacao.
- [ ] Endpoint global interno preservado.
- [ ] Testes focados, `check` e `bootJar` verdes.
- [ ] Docs e collection atualizados.
- [ ] Merge em `develop` registrado antes de iniciar a Sprint 24.
