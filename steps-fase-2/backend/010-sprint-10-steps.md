# Steps - Sprint 10 - Formalizacao (geracao de contrato)

**Spec de origem**: [`specs/fase-2/010-sprint-10-formalizacao-geracao-contrato.md`](../../specs/fase-2/010-sprint-10-formalizacao-geracao-contrato.md)

**Status**: a implementar.

**Objetivo geral**: criar o modulo `contratos` para gerar contrato textual a partir de proposta de credito `APROVADA`, versionar o conteudo gerado, registrar aceite explicito do tomador com step-up e evidencia tecnica, permitir cancelamento antes do aceite e preparar o contrato para assinatura digital da Sprint 11.

**Esforco total estimado**: 7-10 dias de Dev Senior.

**Repo de destino**:
- `sep-api`: backend Spring Boot, unico repo de codigo alterado nesta sprint.
- `docs-SEP`: documentacao pode ser editada no working tree quando necessario, mas operacao git continua manual.

**Branch sugerida**:
- `feature/sprint-10-formalizacao-contrato`

**Pre-requisitos globais**:
- Sprint 9 concluida, revisada e mergeada em `develop`.
- `sep-api` em `develop` atualizado a partir de `origin/develop`.
- Modulo `credito` funcional com `PropostaCredito`, `StatusProposta.APROVADA`, `PropostaAprovadaEvent`, parecer manual e Open Finance.
- Step-up authentication da Sprint 5 funcional.
- Role `FINANCEIRO` disponivel.
- `audit_log_seguranca` funcional e extensivel.
- ADRs 0001, 0007 e 0012 vigentes.

**Fora de escopo**:
- Assinatura digital com provider externo.
- CCB juridicamente completa.
- PDF/HTML rico.
- Renegociacao ou aditivos contratuais.
- Calculo definitivo de juros, IOF, CET, amortizacao ou agenda financeira.
- Desembolso, Pix ou conciliacao.
- Telas web/mobile.

---

## Ordem de execucao recomendada

```text
10.0 (prechecks)
  |
  v
10.1 (dominio + migrations contratos)
  |
  +--> 10.2 (template engine + templates texto)
  |
  v
10.3 (geracao + listener de proposta aprovada)
  |
  +--> 10.4 (aceite com step-up)
  +--> 10.5 (cancelamento financeiro)
  |
  v
10.6 (REST + DTOs + OpenAPI)
  |
  v
10.7 (auditoria reforcada)
  |
  v
10.8 (IT/E2E)
  |
  v
10.9 (documentacao + collections + validacao final)
```

- 10.1 deve estabilizar modelo e migrations antes dos use cases.
- 10.2 pode avancar em paralelo com 10.1 depois que `TipoContrato` e variaveis minimas estiverem definidos.
- 10.3 depende de template e repositories.
- 10.4 e 10.5 dependem do agregado com transicoes fechadas.
- 10.6 so deve expor endpoints depois dos use cases estabilizados.
- 10.7 deve estar pronta antes do IT para validar audit log.
- 10.9 so marca PRD como executado apos implementacao/merge.

---

## Task 10.0 - Prechecks da Sprint 10

**Objetivo**: garantir que a Sprint 10 nasce de `develop` atualizado, com Sprint 9 integrada e baseline verde.

**Esforco**: 1-2 horas.

### Step 010.0.1 - Conferir estado Git do `sep-api`

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

### Step 010.0.2 - Criar branch da sprint

**Comandos**:
```bash
cd <sep-api-root>
git switch develop
git pull --ff-only
git switch -c feature/sprint-10-formalizacao-contrato
```

**Verificacao**:
- Branch criada a partir de `develop` atualizado.
- Se `git pull --ff-only` falhar, abortar e avisar o usuario.

### Step 010.0.3 - Rodar baseline backend

**Comandos**:
```bash
cd <sep-api-root>
./gradlew clean test
./gradlew bootJar
```

**Verificacao**:
- Suite passa antes de qualquer alteracao.
- Se os testes dependem de PostgreSQL local, subir Docker Compose conforme README do `sep-api`.

### Step 010.0.4 - Conferir pontos de extensao

**Comandos**:
```bash
cd <sep-api-root>
find src/main/resources/db/migration -maxdepth 1 -type f | sort
grep -R "class PropostaCredito" -n src/main/java/com/dynamis/sep_api/credito
grep -R "enum StatusProposta" -n src/main/java/com/dynamis/sep_api/credito
grep -R "PropostaAprovadaEvent" -n src/main/java/com/dynamis/sep_api
grep -R "RequireStepUp" -n src/main/java/com/dynamis/sep_api
grep -R "TipoEventoSeguranca" -n src/main/java/com/dynamis/sep_api
grep -R "Role.FINANCEIRO\\|FINANCEIRO" -n src/main/java/com/dynamis/sep_api
```

**Verificacao**:
- Proximo numero livre de migration confirmado.
- Evento `PropostaAprovadaEvent` localizado e com payload suficiente para gerar contrato.
- Padrao atual de `@RequireStepUp` confirmado.
- Local do enum/check de auditoria identificado.
- Repositories/use cases de credito identificados para consulta da proposta aprovada.

### Definicao de pronto da Task 10.0
- [ ] Branch correta criada.
- [ ] Baseline backend verde.
- [ ] Proximo numero de migration confirmado.
- [ ] Pontos de extensao de credito, step-up, role e audit log identificados.

---

## Task 10.1 - Dominio, entidades e migrations de contratos

**Objetivo**: criar o nucleo persistente do modulo `contratos`.

**Pre-requisito**: Task 10.0 concluida.

**Esforco**: 1-2 dias.

**Arquivos principais**:
- `contratos/domain/model/Contrato.java`
- `contratos/domain/model/ClausulaContratual.java`
- `contratos/domain/model/VersaoContrato.java`
- `contratos/domain/model/AceiteContrato.java`
- `contratos/domain/vo/StatusFormalizacao.java`
- `contratos/domain/vo/TipoContrato.java`
- `contratos/domain/event/ContratoGeradoEvent.java`
- `contratos/domain/event/ContratoNovaVersaoEvent.java`
- `contratos/domain/event/ContratoAceitoEvent.java`
- `contratos/domain/event/ContratoCanceladoEvent.java`
- `contratos/domain/exception/ContratoNaoEncontradoException.java`
- `contratos/domain/exception/ContratoEstadoInvalidoException.java`
- `contratos/infrastructure/persistence/ContratoRepository.java`
- `contratos/infrastructure/persistence/VersaoContratoRepository.java`
- `src/main/resources/db/migration/V<n>__criar_tabelas_contratos.sql`

### Step 010.1.1 - Modelar `StatusFormalizacao` e `TipoContrato`

**Status esperados**:
```text
GERADO
AGUARDANDO_ACEITE
ACEITO
EM_ASSINATURA
ASSINADO
CANCELADO
```

**Regras**:
- `ASSINADO` fica reservado para Sprint 11.
- `EM_ASSINATURA` fica reservado para Sprint 11.
- `CANCELADO` e final.
- Helpers recomendados: `permiteNovaVersao()`, `permiteAceite()`, `permiteCancelamento()`, `isFinal()`.

**Tipos esperados**:
```text
MUTUO
CCB
OUTROS
```

**Observacao**:
- O spec cita sealed types; se a base atual usa enums para VOs simples, preferir enum para consistencia e menor atrito. Se sealed interface for adotada, justificar no checkpoint.

### Step 010.1.2 - Criar agregado `Contrato`

**Campos minimos**:
- `id`
- `propostaId`
- `tomadorId`
- `tipo`
- `status`
- `versoes`
- campos de auditoria herdados de `EntidadeAuditavel`

**Regras de dominio**:
- 1 contrato por proposta (`proposta_id` unico).
- Contrato nasce em `GERADO` e deve ir para `AGUARDANDO_ACEITE` apos versao gerada.
- Nova versao permitida apenas em `GERADO` ou `AGUARDANDO_ACEITE`.
- Aceite permitido apenas em `AGUARDANDO_ACEITE`.
- Cancelamento permitido apenas em `GERADO` ou `AGUARDANDO_ACEITE`.
- Nao aceitar/cancelar/regenerar em `ACEITO`, `EM_ASSINATURA`, `ASSINADO` ou `CANCELADO`.

### Step 010.1.3 - Criar `VersaoContrato`, `ClausulaContratual` e `AceiteContrato`

**`VersaoContrato`**:
- `id`
- `contratoId`
- `numero`
- `conteudoTexto`
- `hashSha256`
- `dataGeracao`

**Regras**:
- `numero` incremental por contrato.
- `hashSha256` calculado sobre `conteudoTexto` final.
- Conteudo nunca deve ser atualizado depois de persistido; nova geracao cria nova versao.

**`ClausulaContratual`**:
- `id`
- `versaoId`
- `ordem`
- `titulo`
- `texto`

**`AceiteContrato`**:
- `id`
- `versaoId`
- `tomadorId`
- `dataAceite`
- `ipOrigem`
- `userAgentOrigem`

**Regras**:
- Aceite referencia a versao aceita.
- `versao_id` unico em `aceite_contrato`.
- `ipOrigem` max 45 chars.
- `userAgentOrigem` truncar em 500 chars.

### Step 010.1.4 - Criar migration Flyway

**Tabelas minimas**:
- `contrato`
- `versao_contrato`
- `clausula_contratual`
- `aceite_contrato`

**Regras SQL**:
- FKs sem `ON DELETE CASCADE`.
- `contrato.proposta_id` unico.
- `versao_contrato` com unique `(contrato_id, numero)`.
- `clausula_contratual` com unique `(versao_id, ordem)`.
- Checks para `status` e `tipo`.
- Indices em `proposta_id`, `tomador_id`, `status`.
- Preservar nomes de tabelas/colunas em portugues.

**Retencao**:
- Documentar no SQL ou no `CONTRATOS.md`: contratos legais com retencao minima de 10 anos.

### Step 010.1.5 - Criar repositories e testes

**Testes obrigatorios**:
- `ContratoTest`
- `VersaoContratoTest`
- `ContratoRepositoryTest`
- `VersaoContratoRepositoryTest`

**Comandos**:
```bash
cd <sep-api-root>
./gradlew test --tests "*ContratoTest" --tests "*ContratoRepositoryTest" --tests "*VersaoContrato*"
```

### Definicao de pronto da Task 10.1
- [ ] Modelo persistente criado.
- [ ] Transicoes de estado cobertas por testes.
- [ ] Migration sem cascade destrutivo.
- [ ] Repositories funcionando.

### Checkpoint pre-commit obrigatorio
Sugestao de commit: `feat(contratos): modelar formalizacao contratual`.

---

## Task 10.2 - Template engine e templates iniciais

**Objetivo**: renderizar contrato textual com variaveis da proposta/tomador e clausulas padrao.

**Pre-requisito**: Task 10.1 concluida ou modelo estabilizado.

**Esforco**: 1 dia.

**Arquivos principais**:
- `contratos/application/port/out/TemplateContratoEngine.java`
- `contratos/application/port/out/dto/TemplateContratoRequest.java`
- `contratos/application/port/out/dto/TemplateContratoResponse.java`
- `contratos/application/service/ContextoContratoBuilder.java`
- `contratos/application/service/ClausulaContratoParser.java`
- `contratos/infrastructure/template/ThymeleafTemplateContratoEngine.java`
- `src/main/resources/templates/contratos/mutuo.txt`
- `src/main/resources/templates/contratos/ccb.txt`
- `src/main/resources/templates/contratos/clausulas-padrao.txt`

### Step 010.2.1 - Confirmar dependencia Thymeleaf

**Comandos**:
```bash
cd <sep-api-root>
grep -R "thymeleaf" -n build.gradle gradle.properties settings.gradle
```

**Regra**:
- Se Thymeleaf nao estiver no classpath, adicionar dependencia minima e justificar no checkpoint.
- Nao usar template engine com execucao dinamica de codigo.

### Step 010.2.2 - Definir port do template

**Contrato sugerido**:
```java
public interface TemplateContratoEngine {
    TemplateContratoResponse renderizar(TemplateContratoRequest request);
}
```

**Regras**:
- Port usa linguagem de dominio (`tipoContrato`, `variaveis`, `templatePath`), nao classes Thymeleaf.
- Erros de template devem virar exception de aplicacao mapeavel.
- Resultado deve retornar `conteudoTexto` e lista de clausulas parseadas ou dados suficientes para gerar `ClausulaContratual`.

### Step 010.2.3 - Criar `ContextoContratoBuilder`

**Entradas esperadas**:
- `PropostaCredito`
- dados basicos do tomador disponiveis nos modulos existentes.
- dados consolidados de score/parecer quando necessario.

**Variaveis minimas**:
- `propostaId`
- `tomadorId`
- `valorSolicitado`
- `prazoMeses`
- `tipoOperacao`
- `dataGeracao`
- `clausulasPadrao`

**Ponto critico**:
- Se os dados cadastrais completos do tomador ainda nao estiverem disponiveis (nome/endereco/documento), usar placeholders tecnicos explicitos no template e registrar como pendencia para Sprint 11/ajuste juridico. Nao inventar dados.

### Step 010.2.4 - Criar templates texto

**Regras**:
- `mutuo.txt` e o template principal desta sprint.
- `ccb.txt` deve ser esqueleto preparatorio; CCB completa entra na Sprint 11.
- `clausulas-padrao.txt` deve separar clausulas comuns para facilitar revisao juridica.
- Incluir marcadores claros como `CLAUSULA 1 - ...` para permitir parser simples de clausulas.
- Nao prometer assinatura digital ou desembolso nesta sprint.

### Step 010.2.5 - Testes de renderizacao

**Testes obrigatorios**:
- `ThymeleafTemplateContratoEngineTest`
- `ContextoContratoBuilderTest`
- `ClausulaContratoParserTest`

**Cenarios**:
- Renderiza variaveis obrigatorias.
- Falha quando template nao existe.
- Parser extrai clausulas na ordem correta.
- Conteudo final nao fica vazio.

### Definicao de pronto da Task 10.2
- [ ] Port nao vaza Thymeleaf.
- [ ] Templates iniciais versionados.
- [ ] Contexto minimo montado sem dados ficticios.
- [ ] Parser de clausulas testado.

### Checkpoint pre-commit obrigatorio
Sugestao de commit: `feat(contratos): adicionar templates de contrato`.


---

## Task 10.3 - `GerarContratoUseCase` e listener de proposta aprovada

**Objetivo**: gerar contrato automaticamente quando proposta for aprovada e permitir regeneracao antes do aceite.

**Pre-requisitos**: Tasks 10.1 e 10.2.

**Esforco**: 1-1.5 dia.

**Arquivos principais**:
- `contratos/application/usecase/GerarContratoUseCase.java`
- `contratos/application/usecase/command/GerarContratoCommand.java`
- `contratos/application/listener/PropostaAprovadaListener.java`
- `contratos/application/service/HashContratoService.java`

### Step 010.3.1 - Implementar `GerarContratoUseCase`

**Regras**:
- Proposta deve existir.
- Proposta deve estar `APROVADA`.
- Se nao existir contrato para proposta: criar `Contrato`, renderizar template, criar versao numero 1, criar clausulas, transicionar para `AGUARDANDO_ACEITE` e publicar `ContratoGeradoEvent`.
- Se existir contrato em `GERADO` ou `AGUARDANDO_ACEITE`: criar nova versao `numero + 1`, manter historico, retornar para `AGUARDANDO_ACEITE` e publicar `ContratoNovaVersaoEvent`.
- Se existir contrato em `ACEITO`, `EM_ASSINATURA`, `ASSINADO` ou `CANCELADO`: rejeitar com 409.

### Step 010.3.2 - Calcular hash SHA-256 da versao

**Regras**:
- Hash deve ser sobre o texto final renderizado.
- Usar hexadecimal lowercase.
- Hash deve ser persistido em `versao_contrato.hash_sha256`.
- Hash da versao aceita sera usado como evidencia de integridade.

### Step 010.3.3 - Implementar listener de proposta aprovada

**Padrao**:
- `@TransactionalEventListener(phase = AFTER_COMMIT)`.
- `@Transactional(propagation = REQUIRES_NEW)` no metodo ou service chamado, se necessario.
- Falhas devem ser logadas com `propostaId`; avaliar se devem gerar pendencia operacional futura, mas nao quebrar a transacao ja commitada da proposta.

**Ponto critico**:
- Se `PropostaAprovadaEvent` nao carregar todos os dados, buscar proposta por repository/use case publico do modulo `credito`; nao acessar repository interno se houver porta/servico publico ja existente.

### Step 010.3.4 - Testes

**Testes obrigatorios**:
- `GerarContratoUseCaseTest`
- `PropostaAprovadaListenerTest`
- `HashContratoServiceTest`

**Cenarios**:
- Criacao inicial OK.
- Regeneracao em `AGUARDANDO_ACEITE`.
- Rejeicao em `ACEITO`.
- Rejeicao com proposta nao aprovada.
- Listener recebe evento e chama use case.

### Definicao de pronto da Task 10.3
- [ ] Contrato gerado para proposta aprovada.
- [ ] Versao e hash persistidos.
- [ ] Regeneracao preserva historico.
- [ ] Listener automatico funcional.

### Checkpoint pre-commit obrigatorio
Sugestao de commit: `feat(contratos): gerar contrato para proposta aprovada`.

---

## Task 10.4 - `RegistrarAceiteUseCase`

**Objetivo**: registrar aceite explicito do tomador sobre a versao vigente, com step-up e evidencia tecnica.

**Pre-requisitos**: Tasks 10.1 e 10.3.

**Esforco**: 1 dia.

**Arquivos principais**:
- `contratos/application/usecase/RegistrarAceiteUseCase.java`
- `contratos/application/usecase/command/RegistrarAceiteCommand.java`
- `contratos/application/service/EvidenciaAceiteExtractor.java`

### Step 010.4.1 - Implementar comando de aceite

**Campos sugeridos**:
- `contratoId`
- `usuarioAutenticadoId`
- `ipOrigem`
- `userAgentOrigem`

**Regras**:
- Tomador autenticado deve ser dono do contrato.
- Contrato deve estar `AGUARDANDO_ACEITE`.
- Aceite sempre referencia a ultima versao (`max(numero)`).
- Se ja houver aceite para a ultima versao, retornar 409.
- Se houver nova versao apos aceite anterior, exigir novo aceite apenas se o contrato ainda permitir esse estado; nesta sprint, contrato aceito nao deve ser regenerado.
- Publicar `ContratoAceitoEvent`.

### Step 010.4.2 - Aplicar step-up

**Regra**:
- Endpoint de aceite deve usar `@RequireStepUp`.
- Use case nao deve depender diretamente de servlet/security annotation; a obrigatoriedade de step-up fica na borda web/AOP existente.
- Teste web deve cobrir 403 sem `X-Step-Up-Token`.

### Step 010.4.3 - Extrair evidencia tecnica

**Regras**:
- `ipOrigem`: priorizar mecanismo ja existente de IP real se houver; caso contrario usar `request.getRemoteAddr()`.
- Nao confiar cegamente em `X-Forwarded-For` sem configuracao explicita de proxy confiavel.
- `userAgentOrigem`: truncar em 500 chars.
- Persistir evidencia em `aceite_contrato`.

### Step 010.4.4 - Testes

**Testes obrigatorios**:
- `RegistrarAceiteUseCaseTest`
- `EvidenciaAceiteExtractorTest`

**Cenarios**:
- Sucesso.
- Contrato inexistente -> 404.
- Tomador errado -> 403.
- Ja aceito -> 409.
- Contrato cancelado -> 409.
- User-Agent longo truncado.

### Definicao de pronto da Task 10.4
- [ ] Aceite altera status para `ACEITO`.
- [ ] Evidencia persistida.
- [ ] Ownership aplicado.
- [ ] Step-up coberto na borda web.

### Checkpoint pre-commit obrigatorio
Sugestao de commit: `feat(contratos): registrar aceite do tomador`.

---

## Task 10.5 - `CancelarContratoUseCase`

**Objetivo**: permitir cancelamento operacional pelo financeiro antes do aceite.

**Pre-requisitos**: Task 10.1 concluida.

**Esforco**: 0.5-1 dia.

**Arquivos principais**:
- `contratos/application/usecase/CancelarContratoUseCase.java`
- `contratos/application/usecase/command/CancelarContratoCommand.java`

### Step 010.5.1 - Implementar cancelamento

**Regras**:
- Permitido apenas para `FINANCEIRO` ou `ADMIN`.
- Endpoint deve exigir `@RequireStepUp`.
- Justificativa obrigatoria, com tamanho minimo e maximo.
- Cancelar apenas em `GERADO` ou `AGUARDANDO_ACEITE`.
- Transicionar para `CANCELADO`.
- Publicar `ContratoCanceladoEvent`.

### Step 010.5.2 - Tratar concorrencia

**Recomendacao**:
- Usar lock pessimista no contrato ou controle transacional equivalente para evitar corrida entre aceite e cancelamento.
- Se aceite vencer a corrida, cancelamento deve retornar 409.
- Se cancelamento vencer, aceite posterior deve retornar 409.

### Step 010.5.3 - Testes

**Testes obrigatorios**:
- `CancelarContratoUseCaseTest`

**Cenarios**:
- Financeiro cancela em `AGUARDANDO_ACEITE`.
- Admin cancela em `GERADO`.
- Cliente nao cancela -> 403 na borda/use case.
- Justificativa ausente -> 400.
- Cancelar `ACEITO` -> 409.

### Definicao de pronto da Task 10.5
- [ ] Cancelamento antes do aceite funcional.
- [ ] Justificativa obrigatoria.
- [ ] Roles e step-up aplicados.
- [ ] Concorrencia considerada.

### Checkpoint pre-commit obrigatorio
Sugestao de commit: `feat(contratos): permitir cancelamento pre-aceite`.

---

## Task 10.6 - Endpoints REST, DTOs e OpenAPI

**Objetivo**: expor contratos REST para consulta, aceite e cancelamento.

**Pre-requisitos**: Tasks 10.3, 10.4 e 10.5.

**Esforco**: 1 dia.

**Arquivos principais**:
- `contratos/web/controller/ContratoController.java`
- `contratos/web/dto/ContratoResponse.java`
- `contratos/web/dto/VersaoContratoResponse.java`
- `contratos/web/dto/ClausulaContratoResponse.java`
- `contratos/web/dto/AceiteContratoResponse.java`
- `contratos/web/dto/RegistrarAceiteRequest.java`
- `contratos/web/dto/CancelarContratoRequest.java`
- `contratos/web/mapper/ContratoWebMapper.java`

### Step 010.6.1 - Criar endpoints de consulta

**Endpoints**:
```text
GET /api/v1/contratos/proposta/{propostaId}
GET /api/v1/contratos/{id}
GET /api/v1/contratos/{id}/versoes
```

**Autorizacao**:
- `CLIENTE` dono do contrato.
- `FINANCEIRO` e `ADMIN` podem consultar qualquer contrato.

**Resposta minima `ContratoResponse`**:
- `id`
- `propostaId`
- `tomadorId`
- `tipo`
- `status`
- `versaoVigente`
- `aceite`
- auditoria basica

### Step 010.6.2 - Criar endpoint de aceite

**Endpoint**:
```text
PATCH /api/v1/contratos/{id}/aceite
```

**Autorizacao**:
- `CLIENTE` dono.
- `@RequireStepUp`.

**Request**:
- Pode ser record vazio se nao houver campos, mas manter tipo para evolucao.

**Resposta**:
- 200 com contrato atualizado ou 204; escolher uma opcao e manter consistente com o padrao dos controllers existentes.

### Step 010.6.3 - Criar endpoint de cancelamento

**Endpoint**:
```text
POST /api/v1/contratos/{id}/cancelar
```

**Autorizacao**:
- `FINANCEIRO` ou `ADMIN`.
- `@RequireStepUp`.

**Request**:
```json
{
  "justificativa": "Contrato cancelado por divergencia operacional antes do aceite."
}
```

### Step 010.6.4 - OpenAPI

**Obrigatorio**:
- `@Tag(name = "contratos")`.
- `@Operation` em todos os endpoints.
- `@ApiResponses` com 200/204, 400, 401, 403, 404, 409.
- Schemas dos DTOs com exemplos.
- Atualizar `OpenApiConfigTest` com os 5 paths.

### Step 010.6.5 - Testes web

**Testes obrigatorios**:
- `ContratoControllerTest`

**Cenarios**:
- Cliente dono consulta.
- Cliente alheio -> 403.
- Financeiro consulta.
- Aceite sem step-up -> 403.
- Aceite com step-up -> 200/204.
- Cancelamento sem role -> 403.
- Cancelamento financeiro -> 200/204.

### Definicao de pronto da Task 10.6
- [ ] 5 endpoints expostos.
- [ ] DTOs records com validacao declarativa.
- [ ] OpenAPI atualizado.
- [ ] Autorizacao e ownership cobertos.

### Checkpoint pre-commit obrigatorio
Sugestao de commit: `feat(contratos): expor endpoints de formalizacao`.

---

## Task 10.7 - Auditoria reforcada de contratos

**Objetivo**: registrar eventos sensiveis do ciclo contratual no `audit_log_seguranca`.

**Pre-requisitos**: Tasks 10.3, 10.4 e 10.5.

**Esforco**: 0.5-1 dia.

**Eventos obrigatorios**:
```text
CONTRATO_GERADO
CONTRATO_NOVA_VERSAO
CONTRATO_ACEITO
CONTRATO_CANCELADO
```

### Step 010.7.1 - Atualizar enum e migration

**Arquivos**:
- `shared/audit/TipoEventoSeguranca.java` ou local equivalente.
- `src/main/resources/db/migration/V<n>__ampliar_audit_seguranca_tipo_contratos.sql`

**Regras**:
- Preservar todos os eventos das Sprints 5-9.
- Atualizar check constraint `chk_audit_seguranca_tipo`.
- Migration deve ser aditiva.

### Step 010.7.2 - Criar `ContratoAuditListener`

**Padrao obrigatorio**:
- `@TransactionalEventListener(phase = AFTER_COMMIT)`.
- `@Transactional(propagation = REQUIRES_NEW)`.
- `ObjectMapper` para serializar detalhes.
- Truncar campos livres.
- Nao gravar conteudo completo do contrato no audit log.

**Detalhes permitidos**:
- `contratoId`
- `propostaId`
- `tomadorId`
- `versaoId`
- `numeroVersao`
- `hashSha256`
- `status`
- `ipOrigem`
- `userAgentOrigem` truncado
- `justificativa` truncada

**Dados proibidos no audit log**:
- Conteudo integral do contrato.
- Clausulas completas.
- Dados pessoais completos se nao forem necessarios.

### Step 010.7.3 - Testes

**Testes obrigatorios**:
- `ContratoAuditListenerTest`

**Cenarios**:
- Contrato gerado.
- Nova versao.
- Aceite com hash, ip e user-agent.
- Cancelamento com justificativa truncada.
- JSON escapado corretamente.
- Conteudo completo do contrato nao aparece no audit log.

### Definicao de pronto da Task 10.7
- [ ] Eventos novos no enum Java e check SQL.
- [ ] Listener grava audit log apos commit.
- [ ] Conteudo legal completo nao vaza para auditoria.
- [ ] Testes cobrem eventos principais.

### Checkpoint pre-commit obrigatorio
Sugestao de commit: `feat(contratos): auditar formalizacao contratual`.

---

## Task 10.8 - Testes de integracao end-to-end

**Objetivo**: validar fluxo proposta aprovada -> contrato gerado -> consulta -> aceite/cancelamento -> auditoria.

**Pre-requisitos**: Tasks 10.1 a 10.7 concluidas.

**Esforco**: 1-2 dias.

**Arquivo principal**:
- `contratos/web/ContratoIT.java`

### Step 010.8.1 - Preparar fixtures

**Fixtures necessarias**:
- Usuario `CLIENTE` com onboarding aprovado.
- Proposta `APROVADA`.
- Usuario `FINANCEIRO`.
- Usuario `ADMIN`.
- Step-up token valido para aceite/cancelamento.
- Contrato em `AGUARDANDO_ACEITE`.
- Contrato `ACEITO`.

**Regras**:
- Usar profile `test` com banco dedicado `sep_test`, como `CreditoIT`/`OpenFinanceIT`.
- Nunca rodar IT destrutivo contra `sep_dev`.
- Evitar dependencias de rede real.

### Step 010.8.2 - Cobrir fluxo feliz de aceite

**Cenario**:
```text
Proposta APROVADA
 -> PropostaAprovadaEvent
 -> contrato gerado em AGUARDANDO_ACEITE
 -> tomador consulta contrato
 -> tomador aceita com step-up
 -> contrato fica ACEITO
 -> aceite_contrato contem ip/user-agent
 -> audit_log contem CONTRATO_GERADO e CONTRATO_ACEITO
```

### Step 010.8.3 - Cobrir negativos obrigatorios

**Cenarios**:
- Tomador aceita sem step-up -> 403.
- Tomador A tenta aceitar contrato de B -> 403.
- Financeiro cancela `AGUARDANDO_ACEITE` -> `CANCELADO`.
- Financeiro tenta cancelar `ACEITO` -> 409.
- Geracao com proposta nao aprovada -> erro.
- Regeneracao em `AGUARDANDO_ACEITE` -> nova versao.
- Regeneracao em `ACEITO` -> 409.

### Step 010.8.4 - Rodar suite relevante

**Comandos**:
```bash
cd <sep-api-root>
./gradlew test --tests "*Contrato*"
./gradlew test --tests "*Credito*"
./gradlew check
```

**Verificacao**:
- Testes do modulo `contratos` verdes.
- Testes de credito existentes continuam verdes.
- JaCoCo geral nao regride.
- Cobertura do modulo `contratos` >= 70%.
- Spotless verde.

### Definicao de pronto da Task 10.8
- [ ] Fluxo feliz E2E coberto.
- [ ] Negativos principais cobertos.
- [ ] Audit log validado em integracao.
- [ ] `./gradlew check` verde.

### Checkpoint pre-commit obrigatorio
Sugestao de commit: `test(contratos): cobrir formalizacao em IT`.

---

## Task 10.9 - Documentacao, collections e validacao final

**Objetivo**: consolidar documentacao operacional de contratos e preparar handoff da Sprint 10.

**Pre-requisitos**: Tasks 10.1 a 10.8 concluidas.

**Esforco**: 0.5-1 dia.

**Decisao sobre `SPRINT-10-PR.md`**:
- Nao criar `docs-SEP/repos/sep-api/SPRINT-10-PR.md` no inicio da Sprint 10.
- Criar este arquivo somente no final da implementacao, dentro da Task 10.9, depois que migrations, endpoints, testes, auditoria e documentacao estiverem estabilizados.
- Motivo: `SPRINT-10-PR.md` e uma descricao consolidada do PR real, nao um plano preliminar.

**Arquivos esperados**:
- `docs-SEP/repos/sep-api/CONTRATOS.md`
- update `docs-SEP/repos/sep-api/CREDITO.md`
- `docs-SEP/repos/sep-api/SPRINT-10-PR.md` somente no final.
- `docs-SEP/docs-sep/sep-api.postman_collection.json`
- `docs-SEP/docs-sep/sep-api.insomnia_collection.json`
- `sep-api/README.md` se houver novas instrucoes locais.
- `docs-SEP/docs-sep/PRD.md` somente apos conclusao/merge, para marcar Sprint 10 como executada.

### Step 010.9.1 - Atualizar documentacao operacional

**Conteudo minimo de `CONTRATOS.md`**:
- Objetivo do modulo `contratos`.
- Fluxo de geracao automatica.
- Estados e transicoes.
- Templates e variaveis.
- Versionamento e hash SHA-256.
- Aceite com step-up e evidencias.
- Cancelamento pre-aceite.
- Eventos de auditoria.
- Retencao minima de 10 anos.
- Limitacoes: sem assinatura digital, sem PDF/HTML rico, sem CCB completa.

**Atualizar `CREDITO.md`**:
- Linkar `CONTRATOS.md` na secao de eventos.
- Explicitar que `PropostaAprovadaEvent` alimenta a Sprint 10.

### Step 010.9.2 - Atualizar collections

**Endpoints a adicionar**:
```text
GET /api/v1/contratos/proposta/{propostaId}
GET /api/v1/contratos/{id}
GET /api/v1/contratos/{id}/versoes
PATCH /api/v1/contratos/{id}/aceite
POST /api/v1/contratos/{id}/cancelar
```

**Variaveis sugeridas**:
- `contratoId`
- `contratoVersaoId`
- `contratoPropostaId`
- `stepUpToken`

**Verificacao**:
```bash
cd <docs-SEP-root>
jq empty docs-sep/sep-api.postman_collection.json
jq empty docs-sep/sep-api.insomnia_collection.json
```

### Step 010.9.3 - Criar descricao de PR no final

**Arquivo sugerido**:
- `docs-SEP/repos/sep-api/SPRINT-10-PR.md`

**Conteudo minimo**:
- Titulo sugerido.
- Resumo.
- Escopo tecnico.
- Endpoints novos.
- Migrations novas.
- Auditoria.
- Testes executados.
- Riscos e pendencias.
- Referencias ao spec e ao steps.

### Step 010.9.4 - Validacao final da sprint

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
- Criar proposta aprovada.
- Confirmar contrato gerado.
- Consultar contrato por proposta e por id.
- Aceitar com step-up.
- Validar hash e evidencia.
- Validar audit log.
- Validar cancelamento em contrato ainda nao aceito.

### Definicao de pronto da Task 10.9
- [ ] `CONTRATOS.md` atualizado com implementacao real.
- [ ] `CREDITO.md` atualizado.
- [ ] Collections atualizadas.
- [ ] PR description criada apenas no final.
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

## Definition of Done da Sprint 10

- [ ] Modulo `contratos` criado com estrutura DDD + Hexagonal.
- [ ] Tabelas `contrato`, `versao_contrato`, `clausula_contratual`, `aceite_contrato` criadas por Flyway.
- [ ] Template engine operacional com templates `MUTUO` e `CCB` esqueleto.
- [ ] Contrato gerado automaticamente a partir de `PropostaAprovadaEvent`.
- [ ] Versionamento com hash SHA-256 funcional.
- [ ] Aceite com step-up, ownership, ip e user-agent.
- [ ] Cancelamento pre-aceite por `FINANCEIRO`/`ADMIN` com step-up.
- [ ] 5 endpoints REST documentados no Swagger.
- [ ] Auditoria reforcada com eventos `CONTRATO_*`.
- [ ] Suite E2E de contratos passando.
- [ ] Cobertura JaCoCo do modulo `contratos` >= 70%.
- [ ] `CONTRATOS.md` atualizado em `docs-SEP/repos/sep-api/`.
- [ ] Collections Postman/Insomnia atualizadas.

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

- Contratos sao documentos legais; nao editar conteudo de uma versao ja gerada.
- Hash da versao aceita e evidencia de integridade; nao recalcular a partir de texto modificado.
- Nao gravar conteudo integral do contrato no audit log.
- Retencao minima de 10 anos precisa estar documentada antes do merge.
- Step-up e obrigatorio para aceite e cancelamento.
- Corrida aceite vs cancelamento precisa ser tratada transacionalmente.
- Listener de `PropostaAprovadaEvent` roda apos commit; falhas devem ser observaveis e nao podem corromper a proposta ja aprovada.
- Dados cadastrais incompletos nao devem ser inventados no template.
- Sprint 11 depende do estado `ACEITO` para iniciar assinatura digital.
- `SPRINT-10-PR.md` so deve ser criado no final da implementacao, nao no inicio.

---

## Referencias

- [Spec 010 - Sprint 10 - Formalizacao](../../specs/fase-2/010-sprint-10-formalizacao-geracao-contrato.md)
- [Spec 008 - Sprint 8 - Credito](../../specs/fase-2/008-sprint-8-credito-regras-parecer.md)
- [Spec 009 - Sprint 9 - Open Finance](../../specs/fase-2/009-sprint-9-credito-open-finance.md)
- [Spec 011 - Sprint 11 - Assinatura Digital + CCB](../../specs/fase-2/011-sprint-11-formalizacao-assinatura-digital.md)
- [PRD](../../docs-sep/PRD.md)
- [ADR 0001 - Monolito modular orientado a DDD](../../adr/0001-monolito-modular-orientado-a-ddd.md)
- [ADR 0007 - DDD com Hexagonal Ports and Adapters por modulo](../../adr/0007-ddd-com-hexagonal-ports-and-adapters-por-modulo.md)
- [ADR 0012 - Motor de regras de credito interno](../../adr/0012-motor-de-regras-de-credito-interno.md)
- [CREDITO.md](../../repos/sep-api/CREDITO.md)
- [OPEN-FINANCE.md](../../repos/sep-api/OPEN-FINANCE.md)
- [CONTRATOS.md](../../repos/sep-api/CONTRATOS.md)
