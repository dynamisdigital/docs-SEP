# Steps - Sprint 26 - Leitura Pix owner-scoped (Gates P1-P3 da M-Sprint 11)

**Spec de origem**: [`026-sprint-26-pix-leitura-owner-scoped.md`](../../specs/fase-3/026-sprint-26-pix-leitura-owner-scoped.md)

**Status**: planejada. Desbloqueia os Gates P1-P3 da
[`M-Sprint 11`](../mobile/211-msprint-11-steps.md). O trabalho mobile so inicia apos estes tres
contratos integrados em `origin/develop`.

**Objetivo geral**: entregar tres leituras Pix owner-scoped (desembolso do tomador, Pix da
parcela do tomador, Pix da operacao da credora), minimas e read-only, sem liberar rotas
operacionais nem expor dados internos.

**Esforco total estimado**: 2-3 dias de Dev Senior Backend.

**Repos de destino**:
- `sep-api`: enums publicos, mappers, use cases, portas, DTOs, controllers e testes.
- `docs-SEP`: spec/step 026, `PIX.md`, collection, secao de Gates do step 211; Git manual.

**Branch sugerida**:
- `feature/sprint-26-pix-leitura-owner-scoped`

**Pre-requisitos**:
- Sprints 19-21 (Pix), 17 (carteira credora) e 25 (credora) integradas em `develop`.
- `PixTransferenciaRepository` existe, mas o unico finder por contrato
  (`findFirstByContratoIdAndStatusInOrderByDataCriacaoDesc`) filtra por status "ocupado"
  (CRIADA/SOLICITADA/PROCESSANDO/CONCLUIDA) e nao retorna `FALHOU`/`CANCELADA`; a Sprint cria um
  finder sem filtro.
- `PixReferenciaRecebimentoRepository.findByParcelaIdAndStatus` disponivel; faltam o finder da
  referencia atual por parcela e o do recebimento por `referenciaId`.
- `EntidadeAuditavel` fornece `dataModificacao` (`getDataModificacao()`) para `atualizadoEm`.
- Padrao de ownership CLIENTE em `cobranca` (`ConsultarRecebimentosParcelaUseCase`,
  `ContratoCobrancaQueryPort.tomadorIdDoContrato`) disponivel.
- Padrao de ownership credora em `credores` (`ConsultarOperacaoCarteiraUseCase`,
  `OperacaoFinanciadaRepository.findByIdAndEmpresaCredoraId`,
  `EmpresaCredoraRepository.findByUsuarioId`) disponivel.

## Decisoes tecnicas

- Enums publicos `StatusPixPublico` e `StatusPixParcelaPublico` novos em `pix/domain/vo`; nunca
  reutilizar `StatusPixTransferencia`, `StatusDesembolsoResponse` ou DTOs operacionais.
- Mappers interno -> publico puros e testaveis na aplicacao/dominio de `pix`; o mapa do P1 e P3 e
  o mesmo (`StatusPixTransferencia -> StatusPixPublico`) e fica em fonte unica.
- Ownership sempre antes de revelar existencia. Recurso alheio e inexistente retornam o mesmo
  `404` neutro; nunca vazar UUID.
- `403` no P1/P2 vem do `@PreAuthorize("hasRole('CLIENTE')")` para papeis operacionais; nao e
  tratado no corpo.
- P2 resolve parcela -> tomador por porta nova em `pix.application.port.out`, implementada por
  adapter em `pix.infrastructure.adapter.cobranca` (a ponte pix->cobranca ja existe).
- P3 vive em `credores`; define porta consumer-driven `PixOperacaoStatusQueryPort` em
  `credores.application.port.out`, cujo adapter delega ao componente de leitura publico de `pix`
  para nao duplicar o mapa de status. O status cruza como `String`.
- P1/P3 usam um finder SEM filtro de status, `findFirstByContratoIdOrderByDataCriacaoDesc`, para
  refletir a tentativa mais recente inclusive `FALHOU`/`CANCELADA`. O finder filtrado existente
  (Sprint 20) permanece so para bloqueio de novo desembolso.
- P2 seleciona a referencia atual da parcela (`findFirstByParcelaIdOrderByDataCriacaoDesc`) e o
  recebimento associado pela `referenciaId` dessa referencia
  (`findFirstByReferenciaIdOrderByDataCriacaoDesc`), nunca o recebimento mais recente da parcela de
  forma independente (evita casar referencia nova com recebimento de referencia antiga).
- `atualizadoEm` usa `dataModificacao` (`EntidadeAuditavel`), sem fallback para `dataCriacao`. No
  P2, e a `dataModificacao` da fonte que determinou o status vencedor (referencia ou recebimento).
- `mensagemPublica` (P2) e copy fixa sanitizada no backend, sem `motivoDivergencia` bruto.
- Sem migration, sem novo status interno, sem evento, sem auditoria, sem step-up, sem lock, sem
  chamada a provider e sem novo padrao GoF.

## Protocolo obrigatorio por Task

1. Executar somente a Task liberada pelo usuario.
2. Confirmar codigo e contratos atuais antes de editar.
3. Escrever teste comportamental antes da mudanca quando o risco for ownership/mapeamento.
4. Implementar a menor mudanca coerente.
5. Rodar `./gradlew spotlessCheck` alem dos testes focados.
6. Parar em checkpoint pre-commit por Task com status, diff, testes, riscos e commit sugerido.
7. Aguardar aprovacao antes de `git add` e `git commit`.
8. Usar paths especificos; nunca `git add -A`.
9. Apos operacao git, `chown -R mauricio:mauricio .git .claude`.

**Skills obrigatorias**:
- `coding-guidelines`: simplicidade, mudancas cirurgicas e verificacao orientada a meta.
- `clean-code`: nomes intencionais, funcoes pequenas e testes F.I.R.S.T.
- `clean-architecture`: ownership/mapeamento na aplicacao; DTO restrito a web; portas
  consumer-driven; dominio sem framework.
- `design-patterns-java`: sem pattern-itis; repository/use case/mapper existentes resolvem o caso.

## Ordem de execucao

```text
26.0 prechecks
  -> 26.1 P1 desembolso do tomador
  -> 26.2 P2 status Pix da parcela
  -> 26.3 P3 status Pix da operacao da credora
  -> 26.4 testes de integracao e regressao
  -> 26.5 OpenAPI, PIX.md, collection, Gates do step 211 e fechamento
```

---

## Gate 26.0 - Prechecks

**Objetivo**: confirmar cadeia Git, contratos Pix/credora atuais, campos reais e baseline.

### Step 026.0.1 - Confirmar cadeia Git

```bash
cd <sep-api-root>
git fetch --all --prune
git status --short --branch
git log --oneline --decorate -15 origin/develop
git log --oneline --decorate -12 origin/main
git diff --stat origin/main..origin/develop
```

**Verificacao**:
- Sprints 19-21, 17 e 25 presentes em `origin/develop`.
- `main` incorporada em `develop` ou pendencia registrada.
- Working tree limpo ou alteracoes do usuario identificadas.

### Step 026.0.2 - Criar branch e tratar PR temporario

```bash
cd <sep-api-root>
git switch develop
git pull --ff-only
git switch -c feature/sprint-26-pix-leitura-owner-scoped
```

Em `docs-SEP`, remover `repos/sep-api/SPRINT-25-PR.md` somente depois de usado no PR #85.

### Step 026.0.3 - Reconfirmar contratos e campos reais

```bash
cd <sep-api-root>
sed -n '1,160p' src/main/java/com/dynamis/sep_api/pix/domain/model/PixTransferencia.java
sed -n '1,60p'  src/main/java/com/dynamis/sep_api/pix/domain/vo/StatusPixTransferencia.java
sed -n '1,40p'  src/main/java/com/dynamis/sep_api/pix/infrastructure/persistence/PixTransferenciaRepository.java
sed -n '1,120p' src/main/java/com/dynamis/sep_api/pix/domain/model/PixReferenciaRecebimento.java
sed -n '1,120p' src/main/java/com/dynamis/sep_api/pix/domain/model/PixRecebimento.java
sed -n '1,40p'  src/main/java/com/dynamis/sep_api/pix/domain/vo/StatusPixReferenciaRecebimento.java
sed -n '1,40p'  src/main/java/com/dynamis/sep_api/pix/domain/vo/StatusPixRecebimento.java
sed -n '1,60p'  src/main/java/com/dynamis/sep_api/pix/infrastructure/persistence/PixReferenciaRecebimentoRepository.java
sed -n '1,60p'  src/main/java/com/dynamis/sep_api/pix/infrastructure/persistence/PixRecebimentoRepository.java
sed -n '1,40p'  src/main/java/com/dynamis/sep_api/pix/application/port/out/ContratoDesembolsoQueryPort.java
sed -n '1,60p'  src/main/java/com/dynamis/sep_api/cobranca/application/usecase/ConsultarRecebimentosParcelaUseCase.java
sed -n '1,120p' src/main/java/com/dynamis/sep_api/credores/application/usecase/ConsultarOperacaoCarteiraUseCase.java
sed -n '1,60p'  src/main/java/com/dynamis/sep_api/credores/domain/model/OperacaoFinanciada.java
```

**Verificacao**:
- Confirmar que `PixTransferencia`, `PixReferenciaRecebimento` e `PixRecebimento` estendem
  `EntidadeAuditavel` (`dataModificacao` alimenta `atualizadoEm`) e o campo real de valor.
- Confirmar que os enums e valores batem com a spec 026.
- Confirmar `ContratoDesembolsoQueryPort.buscarPorContrato` devolve `tomadorId` (ownership P1).
- Confirmar como `pix` resolve parcela -> contrato -> tomador para desenhar a porta do P2.
- Confirmar que os endpoints operacionais das Sprints 19-21 seguem restritos e nao serao tocados.

### Step 026.0.4 - Confirmar Gates abertos

```bash
cd <sep-api-root>
rg -n "PreAuthorize|GetMapping|PostMapping|RequestMapping" \
  src/main/java/com/dynamis/sep_api/pix/web
rg -n "hasRole\('CLIENTE'\)" src/main/java/com/dynamis/sep_api/pix \
  src/main/java/com/dynamis/sep_api/credores
```

**Verificacao**: nao existe leitura Pix owner-scoped hoje; confirmar antes de criar.

### Step 026.0.5 - Rodar baseline

```bash
cd <sep-api-root>
./gradlew check
```

### Definicao de pronto do Gate 26.0

- [ ] Sprints 19-21, 17 e 25 integradas.
- [ ] Branch Sprint 26 criada de `develop` atualizado.
- [ ] PR temporario anterior tratado.
- [ ] Campos, enums e portas reais reconfirmados.
- [ ] Gates P1-P3 confirmados abertos.
- [ ] Endpoints operacionais confirmados restritos.
- [ ] Baseline verde ou falha preexistente documentada.

---

## Task 26.1 - P1 status de desembolso do tomador

**Objetivo**: revelar o estado publico do desembolso Pix apenas para o contrato proprio.

**Esforco**: 0,5-1 dia.

**Arquivos esperados**:
- `pix/domain/vo/StatusPixPublico.java`
- `pix/application/mapper/StatusPixPublicoMapper.java` (ou equivalente)
- `pix/application/dto/PixDesembolsoTomadorResult.java`
- `pix/application/usecase/ConsultarDesembolsoTomadorUseCase.java`
- `pix/web/dto/PixDesembolsoTomadorResponse.java`
- `pix/web/controller/PixTomadorController.java` (novo controller CLIENTE)
- finder `findFirstByContratoIdOrderByDataCriacaoDesc` em `PixTransferenciaRepository`
- `pix/web/mapper/...` e testes correspondentes.

### Step 026.1.1 - Escrever testes do use case

Cobrir:
- owner com transferencia em cada estado interno recebe o publico mapeado.
- multiplas tentativas no mesmo contrato: a mais recente por `dataCriacao` vence, inclusive quando
  e `FALHOU`/`CANCELADA` (garante finder sem filtro de status).
- owner sem transferencia recebe excecao de ausencia (`404`).
- contrato inexistente ou alheio recebe a mesma excecao de ausencia (`404`, nao diferenciado).
- ownership e validada antes de consultar a transferencia.
- nenhuma chamada a provider, mutacao ou evento ocorre.

### Step 026.1.2 - Criar enum e mapper publico

`StatusPixPublico`: `EM_PROCESSAMENTO`, `LIQUIDADO`, `FALHOU`, `CANCELADO`. Mapper exaustivo com
`switch` cobrindo os 6 estados internos; `default` inexistente falha em compilacao (usar `switch`
sobre enum sem `default`).

### Step 026.1.3 - Implementar use case

`ConsultarDesembolsoTomadorUseCase.executar(contratoId, clienteAutenticadoId)`:
1. `ContratoDesembolsoQueryPort.buscarPorContrato(contratoId)`; ausente ou
   `tomadorId != clienteAutenticadoId` -> excecao de ausencia.
2. Buscar transferencia mais recente via `findFirstByContratoIdOrderByDataCriacaoDesc(contratoId)`
   (finder novo, sem filtro de status); ausente -> excecao de ausencia.
3. Mapear para `PixDesembolsoTomadorResult(status, valor, atualizadoEm)`, com
   `atualizadoEm = dataModificacao`.

Transacao read-only; sem side effect.

### Step 026.1.4 - Criar DTO e endpoint

`GET /api/v1/pix/contratos/{contratoId}/desembolso`:
- `@PreAuthorize("hasRole('CLIENTE')")`, sem `@RequireStepUp`.
- `@AuthenticationPrincipal UsuarioAutenticado` -> `principal.id()`.
- `200` com `PixDesembolsoTomadorResponse`; documentar `200`, `400`, `401`, `403`, `404`.
- Excecao de ausencia -> `404` neutro sem UUID.

**Assercoes negativas**: sem chave, `txid`, `endToEndId`, IDs internos, provider ou escrow.

### Verificacao

```bash
./gradlew test --tests "*ConsultarDesembolsoTomadorUseCaseTest" --tests "*PixTomadorControllerTest"
./gradlew spotlessCheck
```

### Definicao de pronto da Task 26.1

- [ ] Ownership antes da leitura.
- [ ] Mapa de status exaustivo e testado.
- [ ] Recurso alheio e inexistente indistinguiveis.
- [ ] DTO minimo, sem campos proibidos.
- [ ] GET read-only sem step-up.
- [ ] Testes e Spotless passam.

### Commit sugerido

```text
feat(pix): expor status de desembolso ao tomador
```

---

## Task 26.2 - P2 status Pix da parcela do tomador

**Objetivo**: revelar o estado publico Pix da parcela propria, sem duplicar o historico da M-9.

**Esforco**: 1 dia.

**Arquivos esperados**:
- `pix/domain/vo/StatusPixParcelaPublico.java`
- `pix/application/mapper/StatusPixParcelaPublicoMapper.java`
- `pix/application/port/out/ParcelaTomadorQueryPort.java`
- `pix/infrastructure/adapter/cobranca/...` (implementacao da porta)
- finders derivados por parcela em `PixReferenciaRecebimentoRepository` e
  `PixRecebimentoRepository`.
- `pix/application/dto/PixPagamentoParcelaResult.java`
- `pix/application/usecase/ConsultarStatusPixParcelaUseCase.java`
- `pix/web/dto/PixPagamentoParcelaResponse.java`, endpoint no `PixTomadorController` e testes.

### Step 026.2.1 - Escrever testes do use case e do mapper

Cobrir:
- owner sem estado Pix -> excecao de ausencia (`404`).
- owner nos estados: aguardando, em processamento, liquidado, divergente, falho, expirado,
  cancelado -> publico correto pela tabela de precedencia.
- parcela inexistente ou alheia -> excecao de ausencia (`404`, nao diferenciado).
- ownership antes de qualquer consulta de referencia/recebimento.
- referencia nova `ATIVA` com recebimento divergente de referencia ANTIGA nao vira `DIVERGENTE`
  (recebimento e buscado por `referenciaId` da referencia atual, nao por parcela).
- `mensagemPublica` presente apenas em `DIVERGENTE`/`FALHOU`, sanitizada, sem `motivoDivergencia`.
- nenhuma geracao de referencia, conciliacao, reprocesso ou mutacao.

### Step 026.2.2 - Porta parcela -> tomador

`ParcelaTomadorQueryPort.tomadorIdDaParcela(UUID parcelaId): Optional<UUID>`, implementada por
adapter que resolve parcela -> `agenda.contratoId` -> `tomadorId`, reutilizando a ponte pix->
cobranca existente. Nao acoplar `pix` ao dominio de `cobranca` alem da leitura ja usada.

### Step 026.2.3 - Finders e mapper de precedencia

- Referencia atual:
  `PixReferenciaRecebimentoRepository.findFirstByParcelaIdOrderByDataCriacaoDesc(parcelaId)`.
- Recebimento associado:
  `PixRecebimentoRepository.findFirstByReferenciaIdOrderByDataCriacaoDesc(referenciaId)`, usando a
  `referenciaId` da referencia selecionada acima; nunca o recebimento mais recente da parcela de
  forma independente (evita casar referencia nova com recebimento de referencia antiga).
- `StatusPixParcelaPublicoMapper` implementa a precedencia da spec 026 de forma pura e testavel e
  define `atualizadoEm` como a `dataModificacao` da fonte vencedora.

### Step 026.2.4 - Use case e endpoint

`ConsultarStatusPixParcelaUseCase.executar(parcelaId, clienteAutenticadoId)`:
1. `ParcelaTomadorQueryPort.tomadorIdDaParcela`; ausente ou `!= autenticado` -> ausencia.
2. Buscar referencia atual da parcela; ausente -> ausencia (`404`).
3. Buscar o recebimento pela `referenciaId` dessa referencia (se houver) e aplicar o mapper.
4. Retornar `PixPagamentoParcelaResult(status, valor, atualizadoEm, mensagemPublica)`, com
   `atualizadoEm = dataModificacao` da fonte vencedora.

`GET /api/v1/pix/parcelas/{parcelaId}/status`, `@PreAuthorize("hasRole('CLIENTE')")`, sem step-up.

**Assercoes negativas**: sem `txid`, copia-cola, `endToEndId`, IDs internos, motivo tecnico.

### Verificacao

```bash
./gradlew test --tests "*StatusPixParcela*" --tests "*PixTomadorControllerTest"
./gradlew spotlessCheck
```

### Definicao de pronto da Task 26.2

- [ ] Ownership antes da leitura.
- [ ] Precedencia de estados exaustiva e testada.
- [ ] Historico continua no contrato B1 da M-9, nao duplicado.
- [ ] `mensagemPublica` sanitizada e restrita.
- [ ] DTO minimo, sem campos proibidos.
- [ ] Testes e Spotless passam.

### Commit sugerido

```text
feat(pix): expor status pix da parcela ao tomador
```

---

## Task 26.3 - P3 status Pix da operacao da credora

**Objetivo**: revelar o estado publico Pix apenas para operacao da carteira propria da credora.

**Esforco**: 0,5-1 dia.

**Arquivos esperados**:
- `credores/application/port/out/PixOperacaoStatusQueryPort.java`
- `credores/application/dto/PixOperacaoStatusView.java` (status como `String`)
- `credores/infrastructure/adapter/pix/...` (delega ao componente de leitura publico de `pix`)
- `credores/application/usecase/ConsultarStatusPixOperacaoCredoraUseCase.java`
- `credores/web/dto/PixOperacaoCredoraResponse.java`
- endpoint em `credores/web/controller/EmpresaCredoraCarteiraController.java` e testes.

### Step 026.3.1 - Escrever testes do use case

Cobrir:
- credora owner com operacao e desembolso -> publico correto.
- usuario sem credora -> ausencia (`404`).
- operacao de outra credora ou inexistente -> ausencia (`404`, nao diferenciado).
- operacao sem desembolso Pix -> ausencia (`404`).
- ownership da credora e da operacao antes de consultar o Pix.
- resposta nao contem tomador, contrato, chave, IDs internos ou escrow.

### Step 026.3.2 - Porta consumer-driven e adapter

`PixOperacaoStatusQueryPort.consultarPorContrato(UUID contratoId): Optional<PixOperacaoStatusView>`.
Adapter em `credores` delega ao componente publico de `pix` (reutiliza a transferencia mais
recente + `StatusPixPublicoMapper`), retornando `status` como `String`. Credores nao importa o
dominio de `pix`.

### Step 026.3.3 - Use case e endpoint

`ConsultarStatusPixOperacaoCredoraUseCase.executar(usuarioId, operacaoId)`:
1. Resolver credora por `usuarioId`; ausente -> ausencia.
2. `OperacaoFinanciadaRepository.findByIdAndEmpresaCredoraId(operacaoId, credora.id())`; ausente
   -> ausencia.
3. `PixOperacaoStatusQueryPort.consultarPorContrato(operacao.contratoId)`; ausente -> ausencia.
4. Retornar publico.

`GET /api/v1/credores/carteira/{operacaoId}/pix`, `@PreAuthorize("isAuthenticated()")`, sem
step-up, sem role `CREDORA`.

### Verificacao

```bash
./gradlew test --tests "*ConsultarStatusPixOperacaoCredoraUseCaseTest" \
  --tests "*EmpresaCredoraCarteiraControllerTest"
./gradlew spotlessCheck
```

### Definicao de pronto da Task 26.3

- [ ] Ownership de credora e operacao antes da leitura.
- [ ] Recurso alheio e inexistente indistinguiveis.
- [ ] Sem dados do tomador ou internos.
- [ ] Porta consumer-driven; `pix` nao vaza dominio para `credores`.
- [ ] Testes e Spotless passam.

### Commit sugerido

```text
feat(credores): expor status pix da operacao da carteira
```

---

## Task 26.4 - Testes de integracao e regressao

**Objetivo**: provar seguranca, ownership, ordenacao e fronteiras reais dos tres contratos com
testes de integracao, e garantir que os endpoints operacionais nao regrediram.

**Esforco**: 0,5-1 dia.

**Arquivos esperados**:
- IT dedicado por gate (ex.: `PixTomadorLeituraIT`, `CredoraOperacaoPixIT`) com contexto Spring e
  autenticacao real, no padrao dos ITs existentes (`AssinaturaIT`/`RenegociacaoIT`).

### Step 026.4.1 - Integracao P1/P2 (tomador)

Cobrir com autenticacao real:
- owner recebe `200` com payload minimo; assercoes negativas de campos proibidos no JSON.
- outro cliente e contrato/parcela inexistente recebem o mesmo `404`, sem UUID.
- `FINANCEIRO`/`ADMIN`/`BACKOFFICE` recebem `403` nos endpoints de cliente.
- P1: multiplas transferencias -> a mais recente por `dataCriacao` vence (inclui `FALHOU`).
- P2: referencia nova nao casa com recebimento de referencia antiga.
- GET nao gera side effect (contagem de linhas Pix inalterada apos a chamada).

### Step 026.4.2 - Integracao P3 (credora)

Cobrir com autenticacao real:
- credora owner recebe `200`; sem tomador, contrato, chave ou IDs internos no JSON.
- usuario sem credora, operacao alheia e operacao inexistente recebem o mesmo `404`.
- operacao sem desembolso Pix recebe `404`.

### Step 026.4.3 - Regressao dos endpoints operacionais

```bash
./gradlew test --tests "*PixDesembolso*" --tests "*PixRecebimento*" --tests "*PixWebhook*"
```

Confirmar que as rotas das Sprints 19-21 seguem restritas e inalteradas.

### Verificacao

```bash
./gradlew test --tests "*Pix*IT" --tests "*CredoraOperacaoPix*"
./gradlew check
```

### Definicao de pronto da Task 26.4

- [ ] IT cobre auth real, owner/nao-owner, roles internas e `404` nao enumeravel.
- [ ] Ordenacao P1 e pareamento referencia/recebimento P2 cobertos por integracao.
- [ ] Payload minimo e ausencia de campos proibidos verificados no JSON real.
- [ ] Endpoints operacionais 19-21 sem regressao.
- [ ] `check` verde.

### Commit sugerido

```text
test(pix): cobrir leitura pix owner-scoped com integracao
```

---

## Task 26.5 - OpenAPI, docs, collection e fechamento

**Objetivo**: registrar os tres contratos e fechar os Gates P1-P3 da M-Sprint 11.

**Esforco**: 0,5 dia.

### Step 026.5.1 - Atualizar documentacao

Atualizar:
- `repos/sep-api/PIX.md` (secao de leitura owner-scoped: paths, DTOs, enums, mapa de status).
- spec/step 026 com status real.
- step 211: preencher os Gates P1-P3 com paths, DTOs, enums e status HTTP finais; marcar como
  fechados apos merge em `develop`; fixar os "Contratos mobile esperados".
- `docs-sep/PRD-FASE-3.md`.
- `docs-sep/CONTEXT-PARTE-2.md`.
- `AI-ROADMAP.md`.

### Step 026.5.2 - Atualizar collection

Adicionar, com exemplos `200`/`403`/`404`:

```text
GET /api/v1/pix/contratos/{{contratoId}}/desembolso
GET /api/v1/pix/parcelas/{{parcelaId}}/status
GET /api/v1/credores/carteira/{{operacaoId}}/pix
```

Manter as requests operacionais existentes; nao liberar `CLIENTE` nelas.

### Step 026.5.3 - Rodar gate final

```bash
cd <sep-api-root>
./gradlew check
./gradlew bootJar
```

### Step 026.5.4 - Criar PR description e checkpoint

Criar `repos/sep-api/SPRINT-26-PR.md`. Apresentar status, diff, testes, riscos, pendencias e
mensagem sugerida. Aguardar aprovacao antes de staging/commit.

### Definicao de pronto da Task 26.5

- [ ] OpenAPI e collection atualizados.
- [ ] `PIX.md` e docs refletem os contratos entregues.
- [ ] Gates P1-P3 do step 211 preenchidos e marcados como fechados apos merge.
- [ ] `check` e `bootJar` passam.
- [ ] PR description e checkpoint apresentados.

### Commit sugerido

```text
docs(pix): documentar leitura pix owner-scoped
```

## Definition of Done da Sprint 26

- [ ] Tres contratos owner-scoped implementados exatamente como na spec 026.
- [ ] Nenhuma rota operacional liberada a `CLIENTE`; endpoints internos intocados.
- [ ] Nenhum DTO/enum operacional reutilizado.
- [ ] `404` neutro, sem enumeracao e sem UUID nos tres endpoints.
- [ ] Nenhum campo proibido em resposta, log ou OpenAPI.
- [ ] GETs read-only, sem step-up, evento, auditoria ou mutacao.
- [ ] Cada estado publico coberto por teste; ownership e ausencia de side effect comprovadas.
- [ ] Testes de integracao cobrem auth real, owner/nao-owner, roles internas, ordenacao e payload.
- [ ] `check` e `bootJar` verdes.
- [ ] OpenAPI, `PIX.md`, collection e Gates do step 211 atualizados.
- [ ] Merge em `develop` registrado antes de liberar a M-Sprint 11 mobile.
