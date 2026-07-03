# Steps - Sprint 25 - Leitura do Interesse Ativo da Credora (Gate I1 da M-10)

**Spec de origem**: [`210-msprint-10-credora-mobile.md`](../../specs/fase-3/210-msprint-10-credora-mobile.md) §Gate I1.

**Status**: implementada na branch `feature/sprint-25-credora-interesse-ativo` do `sep-api`
(commits `affd879`, `2c9e134`, `9ed6483`); `./gradlew check` + `bootJar` verdes. Push, PR e merge
manuais. O Gate I1 fecha e a Task M-10.4 libera apos o merge em `origin/develop`.

**Objetivo geral**: fechar o Gate backend bloqueante I1 da M-Sprint 10 expondo uma leitura
autoritativa do interesse ativo da credora numa oportunidade, sem a qual o mobile nao distingue
`Manifestar interesse` de `Cancelar interesse` apos reload/novo login. Contrato aprovado = Opcao A
(GET dedicado), simetrico ao `DELETE .../interesses/me` ja existente.

**Esforco total estimado**: 0,5-1 dia de Dev Senior Backend.

**Repos de destino**:
- `sep-api`: use case de consulta, endpoint no controller existente, testes.
- `docs-SEP`: OpenAPI/collection, docs operacional, spec/step 210 (marcar I1 resolvido),
  spec/step 025, PRD/CONTEXT e roadmap; operacao Git manual.

**Branch sugerida**:
- `feature/sprint-25-credora-interesse-ativo`

**Pre-requisitos**:
- M-Sprint 9 backend (Sprints 23/24) integrada; `develop` == `main`.
- Modulo `credores` das Sprints 16-17 integrado.
- `EmpresaCredoraRepository.findByUsuarioId` disponivel.
- `InteresseCredoraRepository.findByEmpresaCredoraIdAndOportunidadeIdAndStatus` disponivel
  (ja existe — usada pelo `CancelarInteresseCredoraUseCase`).
- `InteresseView`, `InteresseResponse` e `CarteiraCredoraWebMapper.toResponse(InteresseView)`
  disponiveis (ja existem — usados pelo `RegistrarInteresseCredoraUseCase`).

## Contrato aprovado (Opcao A)

```http
GET /api/v1/credores/oportunidades/{id}/interesses/me
```

- `@PreAuthorize("isAuthenticated()")`; autorizacao real por credora vinculada ao usuario
  autenticado + ownership do interesse no backend.
- `200 InteresseResponse` quando existe interesse `ATIVO` da credora do usuario na oportunidade.
- `404` quando o usuario nao possui credora **ou** nao possui interesse ativo na oportunidade.
- `401` tratado pelos filtros de seguranca existentes.

`InteresseResponse` (ja existente, sem alteracao):

```text
id: UUID
oportunidadeId: UUID
status: ATIVO | CANCELADO   # a leitura retorna sempre ATIVO
dataCriacao: OffsetDateTime
```

## Decisoes tecnicas

- Opcao A (GET dedicado), nao Opcao B: nao alterar `OportunidadeResponse`, que e consumido por
  web/mobile ja entregues e pela lista (evita N+1 / join por credora na listagem).
- Criar `ConsultarInteresseAtivoCredoraUseCase` read-only; nao reutilizar o use case de registro
  nem tentar `POST` + `409` como leitura.
- Reusar `InteresseCredoraRepository.findByEmpresaCredoraIdAndOportunidadeIdAndStatus(..., ATIVO)`.
  **Nao criar novo metodo de repository.**
- Reusar `InteresseView` + `InteresseResponse` + mapper existente. **Nao criar novo DTO.**
- `404` neutro: as mesmas excecoes do `DELETE .../interesses/me`
  (`EmpresaCredoraNaoEncontradaException`, `InteresseNaoEncontradoException`) ja mapeiam para
  `404`; nao diferenciar "sem credora" de "sem interesse" de "recurso alheio".
- GET read-only: sem evento, sem mutacao, sem step-up, sem lock, sem auditoria, sem job.
- Sem migration. Sem novo padrao GoF.

## Protocolo obrigatorio por Task

1. Executar somente a Task liberada pelo usuario.
2. Confirmar codigo e contratos atuais antes de editar.
3. Escrever teste comportamental antes da mudanca quando o risco for ownership/estado do interesse.
4. Implementar a menor mudanca coerente com os padroes do modulo `credores`.
5. Parar em checkpoint pre-commit por Task.
6. Aguardar aprovacao antes de `git add` e `git commit`.
7. Usar paths especificos; nunca `git add -A`.

**Skills obrigatorias**:
- `coding-guidelines`: simplicidade, mudancas cirurgicas e verificacao orientada a meta.
- `clean-code`: nomes intencionais, funcoes pequenas e testes F.I.R.S.T.
- `clean-architecture`: consulta na aplicacao; DTO restrito a web; ownership no backend.
- `design-patterns-java`: sem pattern-itis; repository/use case/mapper existentes resolvem o caso.

## Ordem de execucao

```text
25.0 prechecks
  -> 25.1 use case de consulta read-only
  -> 25.2 endpoint GET .../interesses/me
  -> 25.3 integracao (registrar -> ler -> cancelar -> ler 404) + regressao
  -> 25.4 OpenAPI, collection, docs, marcar I1 resolvido e fechamento
```

---

## Gate 25.0 - Prechecks

**Objetivo**: confirmar cadeia Git, o gap I1 ainda aberto, os contratos reutilizados e o baseline.

### Step 025.0.1 - Confirmar cadeia Git

```bash
cd <sep-api-root>
git fetch --all --prune
git status --short --branch
git log --oneline --decorate -15 origin/develop
git log --oneline --decorate -12 origin/main
git diff --stat origin/develop..origin/main
```

**Verificacao**:
- Sprints 23/24 presentes em `origin/develop`.
- `develop` contem o modulo `credores` das Sprints 16-17.
- Working tree limpo ou alteracoes do usuario identificadas e preservadas.
- Se a cadeia estiver quebrada, parar e pedir aprovacao antes de implementar.

### Step 025.0.2 - Criar branch

```bash
cd <sep-api-root>
git switch develop
git pull --ff-only
git switch -c feature/sprint-25-credora-interesse-ativo
```

Nao ha `SPRINT-*-PR.md` backend anterior pendente de tratamento nesta abertura (o ultimo foi o da
Sprint 24). Se existir residual, remover apenas depois de usado no PR real.

### Step 025.0.3 - Reconfirmar o gap I1 e os contratos reutilizados

```bash
cd <sep-api-root>
sed -n '1,150p' src/main/java/com/dynamis/sep_api/credores/web/controller/EmpresaCredoraOportunidadeController.java
sed -n '1,60p'  src/main/java/com/dynamis/sep_api/credores/infrastructure/persistence/InteresseCredoraRepository.java
sed -n '1,60p'  src/main/java/com/dynamis/sep_api/credores/application/usecase/CancelarInteresseCredoraUseCase.java
sed -n '1,40p'  src/main/java/com/dynamis/sep_api/credores/application/dto/InteresseView.java
sed -n '1,20p'  src/main/java/com/dynamis/sep_api/credores/web/dto/InteresseResponse.java
grep -rn "InteresseNaoEncontradoException\|EmpresaCredoraNaoEncontradaException" \
  src/main/java/com/dynamis/sep_api/**/exception src/main/java/com/dynamis/sep_api/shared 2>/dev/null
```

**Verificacao**:
- O controller **ainda nao** possui `GET /{id}/interesses/me` nem `interesseAtual` em
  `OportunidadeResponse` (gap I1 aberto).
- `findByEmpresaCredoraIdAndOportunidadeIdAndStatus` existe e retorna `Optional`.
- `InteresseView.de(...)` e `CarteiraCredoraWebMapper.toResponse(InteresseView)` existem.
- `EmpresaCredoraNaoEncontradaException` e `InteresseNaoEncontradoException` mapeiam para `404`
  (mesmo comportamento ja exercido pelo `DELETE .../interesses/me`).

### Step 025.0.4 - Rodar baseline

```bash
cd <sep-api-root>
./gradlew check
```

### Definicao de pronto do Gate 25.0

- [ ] Sprints 23/24 integradas; `develop` == `main`.
- [ ] Branch Sprint 25 criada de `develop` atualizado.
- [ ] Gap I1 confirmado aberto.
- [ ] Repository, view, DTO e mapper reutilizaveis confirmados.
- [ ] Mapeamento `404` das excecoes confirmado.
- [ ] Baseline verde ou falha preexistente documentada.

---

## Task 25.1 - Use case de consulta read-only do interesse ativo

**Objetivo**: localizar o interesse `ATIVO` da credora do usuario autenticado numa oportunidade,
sem revelar existencia antes de resolver a credora e sem mutacao.

**Esforco**: 0,25 dia.

**Arquivos esperados**:
- `credores/application/usecase/ConsultarInteresseAtivoCredoraUseCase.java`
- `src/test/java/.../ConsultarInteresseAtivoCredoraUseCaseTest.java`

### Step 025.1.1 - Escrever testes do use case

Cobrir:
- credora do usuario com interesse `ATIVO` na oportunidade recebe `InteresseView` com `status ATIVO`.
- credora do usuario sem interesse ativo recebe `InteresseNaoEncontradoException`.
- interesse `CANCELADO` nao e ativo (filtro por `StatusInteresseCredora.ATIVO`).
- usuario sem credora recebe `EmpresaCredoraNaoEncontradaException` (resolucao da credora antes da
  busca do interesse).
- a busca do interesse nao ocorre antes de resolver a credora (ordem verificada por mocks).
- nenhuma mutacao, evento ou save e disparado (verificar `verifyNoInteractions`/`verify(...,never())`).

### Step 025.1.2 - Implementar use case

`ConsultarInteresseAtivoCredoraUseCase.executar(UUID usuarioId, UUID oportunidadeId)`:
1. `@Transactional(readOnly = true)`.
2. Resolve a credora: `empresaRepository.findByUsuarioId(usuarioId)` else
   `EmpresaCredoraNaoEncontradaException.porUsuario(usuarioId)`.
3. Busca o interesse ativo:
   `interesseRepository.findByEmpresaCredoraIdAndOportunidadeIdAndStatus(credora.getId(),
   oportunidadeId, StatusInteresseCredora.ATIVO)` else `new InteresseNaoEncontradoException()`.
4. Retorna `InteresseView.de(interesse)`.

Nao publicar evento, nao chamar `save`, nao verificar step-up.

### Verificacao

```bash
./gradlew test --tests "*ConsultarInteresseAtivoCredoraUseCaseTest"
```

### Definicao de pronto da Task 25.1

- [ ] Credora resolvida antes da busca do interesse.
- [ ] Somente interesse `ATIVO` e retornado.
- [ ] Ausencia de credora e de interesse tratadas por excecoes que mapeiam para `404`.
- [ ] Read-only, sem evento/mutacao.
- [ ] Testes focados passam.

### Commit sugerido

```text
feat(credores): consultar interesse ativo da credora
```

---

## Task 25.2 - Endpoint REST GET .../interesses/me

**Objetivo**: publicar a leitura autoritativa do interesse ativo, simetrica ao DELETE existente.

**Esforco**: 0,25 dia.

**Arquivos esperados**:
- `credores/web/controller/EmpresaCredoraOportunidadeController.java` (novo metodo).
- teste de controller/web slice correspondente.

### Step 025.2.1 - Adicionar o endpoint

Adicionar ao controller existente:

```http
GET /api/v1/credores/oportunidades/{id}/interesses/me
```

**Regras**:
- Injetar `ConsultarInteresseAtivoCredoraUseCase` no construtor existente.
- `@PreAuthorize("isAuthenticated()")`.
- Sem `@RequireStepUp`.
- `200` retorna `mapper.toResponse(useCase.executar(principal.id(), id))`.
- Documentar `200`, `401` e `404` com `@ApiResponses`, espelhando o estilo dos endpoints vizinhos.
- Nao alterar `POST /{id}/interesses`, `DELETE /{id}/interesses/me`, `GET`/lista, `GET /{id}` nem
  `POST /sync`.

### Step 025.2.2 - Testar contrato web

Cobrir:
- credora com interesse ativo recebe `200` e corpo `InteresseResponse` com `status ATIVO`.
- sem interesse ativo recebe `404` neutro (sem UUID, sem diferenciar sem-credora/sem-interesse).
- sem credora recebe `404` neutro.
- GET nao consulta/consome step-up.
- JSON contem apenas `id`, `oportunidadeId`, `status`, `dataCriacao`.

### Verificacao

```bash
./gradlew test --tests "*EmpresaCredoraOportunidadeController*"
./gradlew spotlessCheck
```

### Definicao de pronto da Task 25.2

- [ ] Endpoint adicionado ao controller existente, autenticado, sem step-up.
- [ ] `200`/`404` documentados e testados.
- [ ] `404` neutro, sem enumeracao.
- [ ] Demais endpoints preservados.
- [ ] Testes e Spotless passam.

### Commit sugerido

```text
feat(credores): expor leitura do interesse ativo ao mobile
```

---

## Task 25.3 - Integracao e regressao

**Objetivo**: provar o ciclo registrar -> ler -> cancelar -> ler `404` com ownership real, e que os
endpoints existentes nao regrediram.

**Esforco**: 0,25 dia.

### Step 025.3.1 - Estender teste de integracao

Fluxos:

```text
POST /{id}/interesses (201) -> GET /{id}/interesses/me (200 ATIVO)
GET /{id}/interesses/me -> DELETE /{id}/interesses/me (204) -> GET /{id}/interesses/me (404)
```

Cobrir tambem:
- credora A registra interesse; usuario da credora B recebe `404` no GET (ownership).
- oportunidade sem interesse recebe `404`.
- usuario sem credora recebe `404`.
- o GET nao altera o status do interesse nem gera evento/auditoria.

### Step 025.3.2 - Rodar regressao focada

```bash
./gradlew test --tests "*credores*"
./gradlew test --tests "*Interesse*"
```

### Definicao de pronto da Task 25.3

- [ ] Ciclo registrar/ler/cancelar/ler comprovado.
- [ ] Ownership entre credoras comprovada por `404` neutro.
- [ ] GET nao altera estado.
- [ ] Endpoints de registro/cancelamento nao regrediram.
- [ ] Regressao focada passa.

### Commit sugerido

```text
test(credores): cobrir leitura do interesse ativo
```

---

## Task 25.4 - OpenAPI, collection, docs e fechamento

**Objetivo**: documentar o contrato, marcar o Gate I1 como resolvido e liberar a Task M-10.4.

**Esforco**: 0,25 dia.

### Step 025.4.1 - Atualizar OpenAPI e collection

- Confirmar que o Springdoc expoe o novo `GET` em `/v3/api-docs`.
- Adicionar a request na collection do modulo `credores`:

```text
GET /api/v1/credores/oportunidades/{{oportunidadeId}}/interesses/me
```

Exemplos:
- `200` interesse ativo.
- `404` sem interesse ativo.

Manter `POST`/`DELETE` de interesse existentes.

### Step 025.4.2 - Atualizar documentacao

Atualizar:
- `repos/sep-api/CREDORES.md`: descrever a leitura do interesse ativo (Opcao A) e o fechamento do
  Gate I1.
- step 025 (este arquivo): status real.
- [`210-msprint-10-credora-mobile.md`](../../specs/fase-3/210-msprint-10-credora-mobile.md) e
  [`210-msprint-10-steps.md`](../mobile/210-msprint-10-steps.md): marcar Gate I1 **resolvido**
  (contrato Opcao A integrado) e liberar a Task M-10.4.
- `docs-sep/PRD-FASE-3.md`.
- `docs-sep/CONTEXT-PARTE-2.md`.
- `AI-ROADMAP.md`: atualizar a linha do modulo `credores` e a entrada "credora mobile /
  M-Sprint 10" para refletir o Gate I1 fechado.

### Step 025.4.3 - Rodar gate final

```bash
cd <sep-api-root>
./gradlew check
./gradlew bootJar
```

### Step 025.4.4 - Criar PR description e checkpoint

Criar `repos/sep-api/SPRINT-25-PR.md` (Summary, test plan, mudancas por modulo, decisoes, ausencia
de migration, followups, lista de commits). Apresentar status, diff, testes, riscos, pendencias e
mensagem sugerida. Aguardar aprovacao antes de staging/commit. Push e PR continuam manuais.

### Definicao de pronto da Task 25.4

- [ ] OpenAPI e collection refletem o novo GET.
- [ ] `CREDORES.md` documenta a leitura do interesse ativo.
- [ ] Spec/step 210 marcam Gate I1 resolvido e M-10.4 liberada **somente apos merge**.
- [ ] PRD/CONTEXT/roadmap atualizados.
- [ ] `check` e `bootJar` passam.
- [ ] PR description e checkpoint apresentados.

### Commit sugerido

```text
docs(credores): documentar leitura do interesse ativo
```

## Definition of Done da Sprint 25

- [ ] `GET /api/v1/credores/oportunidades/{id}/interesses/me` implementado exatamente como no
  contrato Opcao A.
- [ ] Leitura autoritativa: `200 ATIVO` ou `404` neutro, sem enumeracao.
- [ ] Ownership no backend; credora resolvida antes da busca do interesse.
- [ ] GET read-only, sem evento, mutacao, step-up, lock, auditoria ou job.
- [ ] Sem migration, sem novo DTO, sem novo metodo de repository, sem novo padrao GoF.
- [ ] Endpoints de registro/cancelamento/listagem/detalhe preservados.
- [ ] Testes focados + integracao, `check` e `bootJar` verdes.
- [ ] OpenAPI, collection e docs atualizados.
- [ ] Gate I1 marcado resolvido e Task M-10.4 liberada apos merge em `develop`.
