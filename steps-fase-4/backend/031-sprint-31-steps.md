# Steps - Sprint 31 - Gestao assistida de chaves Pix

**Spec de origem**: [`031-sprint-31-pix-gestao-chaves.md`](../../specs/fase-4/031-sprint-31-pix-gestao-chaves.md)

**Status**: planejada (Fase 4, Epic 15; recorte inicial aprovado de Pix avancado). A gestao e
**assistida** por financeiro/admin e roda sobre provider fake por default. O skeleton Celcoin fica
testavel por WireMock, mas nao e ativado nem certificado contra ambiente real nesta sprint.

**Objetivo geral**: permitir cadastrar, listar e remover/inativar chaves Pix da conta
operacional/escrow, com step-up estrito nas mutacoes, idempotencia, minimizacao do valor da chave,
Provider Pattern e auditoria reforcada, sem movimentar dinheiro.

**Esforco total estimado**: 2-3 dias de Dev Senior Backend.

**Repos de destino**:
- `sep-api`: dominio `ChavePix`, migrations, evolucao de `PixProvider`, fake, skeleton Celcoin,
  use cases, endpoints, auditoria e testes.
- `docs-SEP`: este step, `PIX.md`, OpenAPI/collection, `AI-ROADMAP.md`, PRD/STATE/historico no
  fechamento e PR description; Git manual.

**Branch sugerida**:
- `feature/sprint-31-pix-gestao-chaves`

**Pre-requisitos**:
- Sprints 19-21 (`pix`/`escrow`), 27 (step-up estrito) e 30 integradas em `develop`.
- `develop` e `main` em paridade antes da abertura, conforme estado registrado apos a Sprint 30.
- `app.pix.provider=fake` permanece o default; `celcoin` e apenas skeleton condicionado por
  configuracao e credenciais.
- O valor bruto da chave existe apenas durante o request e a chamada ao provider. Persistencia,
  resposta, erro, evento, auditoria e log usam somente hash, mascara ou identificador tecnico.

## Contrato aprovado

```http
POST    /api/v1/pix/chaves
GET     /api/v1/pix/chaves
DELETE  /api/v1/pix/chaves/{chaveId}
```

### Regras de autorizacao

- `POST`: `ROLE_FINANCEIRO`/`ROLE_ADMIN` + `@RequireStepUpEstrito` + `Idempotency-Key`.
- `GET`: `ROLE_FINANCEIRO`/`ROLE_ADMIN`, read-only e sem step-up.
- `DELETE`: `ROLE_FINANCEIRO`/`ROLE_ADMIN` + `@RequireStepUpEstrito`.
- Chave inexistente retorna `404` neutro, sem ecoar UUID; chave ja `INATIVA` retorna sucesso
  idempotente.
- Nenhum erro ou log inclui valor bruto, body do provider ou dados da conta escrow.

### Tipos e estados

Tipos iniciais, coerentes com o DICT, a confirmar no Gate 31.0 contra o contrato vigente do projeto:

```text
CPF | CNPJ | EMAIL | TELEFONE | EVP
```

```text
ATIVA -> INATIVA
```

Nao criar estado intermediario fora da spec. Falha no cadastro nao cria `ChavePix` ativa; falha na
remocao mantem a chave `ATIVA` para permitir retentativa segura.

## Decisoes tecnicas

- Modelar `ChavePix` no modulo `pix` e associa-la a conta operacional/escrow local resolvida por
  porta/read model; o dominio nao depende de entidade JPA de `escrow`.
- Estender o `PixProvider` existente com operacoes de chave, em vez de criar um segundo mecanismo
  de selecao/configuracao. O mesmo `FakePixProvider` default e `CelcoinPixProvider` skeleton
  implementam o contrato.
- Reutilizar `ChavePixSeguranca`: persistir `valorHash` SHA-256 e `valorMascarado`; nunca persistir
  `valor` bruto. O identificador externo retornado pelo provider e interno e nao entra no DTO.
- Cadastro usa `Idempotency-Key`: replay com mesmo tipo/valor/conta retorna o mesmo recurso
  (`200`); chave reutilizada com payload diferente retorna `409`. Primeira criacao retorna `201`.
- Unicidade ativa e garantida no banco por conta + tipo + hash. Concorrencia nao depende apenas de
  verificacao em memoria.
- Remocao chama o provider de forma idempotente pelo identificador externo e so entao transiciona
  `ATIVA -> INATIVA`. Replay de chave inativa retorna `204`, sem chamar provider nem auditar outra
  vez.
- Listagem vem da persistencia local, inclui `ATIVA` e `INATIVA`, ordenada por criacao decrescente,
  e nunca consulta o provider. Nao adicionar filtro/paginacao sem necessidade demonstrada.
- Auditoria minima: `PIX_CHAVE_CADASTRADA` e `PIX_CHAVE_REMOVIDA`, emitidas AFTER_COMMIT uma vez por
  mudanca efetiva. Detalhes levam apenas `chaveId`, `tipo`, `status` e conta local quando seguro.
- Sem split, Pix automatico, transferencia, recebimento, conciliacao, novo webhook ou movimentacao
  de escrow nesta sprint.

## Protocolo obrigatorio por Task

1. Executar somente a Task liberada pelo usuario.
2. Confirmar codigo, migrations e contratos atuais antes de editar.
3. Escrever teste comportamental antes da mudanca para dominio, idempotencia, provider, seguranca,
   auditoria e concorrencia.
4. Implementar a menor mudanca coerente com os padroes existentes do modulo `pix`.
5. Rodar verificacoes proporcionais por bloco e `./gradlew spotlessCheck`.
6. Parar em checkpoint pre-commit com status, diff, testes, riscos e mensagem sugerida.
7. Aguardar aprovacao antes de `git add` e `git commit`.
8. Usar paths especificos no staging; nunca `git add -A`.

**Skills/guidelines obrigatorias na implementacao**:
- `coding-guidelines`: simplicidade, mudancas cirurgicas e verificacao orientada a meta.
- `clean-code`: nomes intencionais, funcoes pequenas, transicoes explicitas e testes F.I.R.S.T.
- clean architecture: use cases na aplicacao, DTOs restritos a web, provider/escrow via portas e
  dominio sem Spring.
- `design-patterns-java`: evitar pattern-itis; evoluir o Provider Pattern existente, sem criar
  hierarquia ou facade especulativa.

## Ordem de execucao

```text
31.0 prechecks
  -> 31.1 contrato, normalizacao e dominio ChavePix
  -> 31.2 migration, persistencia e concorrencia
  -> 31.3 evolucao do PixProvider + fake idempotente
  -> 31.4 skeleton Celcoin coberto por WireMock
  -> 31.5 cadastro assistido + auditoria
  -> 31.6 listagem mascarada e remocao idempotente
  -> 31.7 endpoints, integracao, docs e fechamento
```

---

## Gate 31.0 - Prechecks

**Objetivo**: confirmar cadeia Git, baseline e contratos atuais de `pix`, `escrow`, step-up,
idempotencia e provider antes de modelar chaves.

### Step 031.0.1 - Confirmar cadeia de integracao

```bash
cd <sep-api-root>
git fetch --all --prune
git status --short --branch
git log --oneline --decorate -12 origin/develop
git log --oneline --decorate -12 origin/main
git diff --stat origin/main..origin/develop
git diff --stat origin/develop..origin/main
```

**Verificacao**:
- Sprints 19-21, 27 e 30 presentes em `origin/develop`.
- `origin/develop` e `origin/main` sem divergencia de produto nao explicada.
- Working tree limpo ou alteracoes do usuario identificadas e preservadas.

### Step 031.0.2 - Criar branch e tratar artefato temporario anterior

```bash
cd <sep-api-root>
git switch develop
git pull --ff-only
git switch -c feature/sprint-31-pix-gestao-chaves
```

Depois de confirmar que `SPRINT-30-PR.md` ja foi usado no PR, remove-lo do working tree de
`docs-SEP` conforme a regra operacional. Nao remover antes dessa confirmacao.

### Step 031.0.3 - Reconfirmar modulo Pix e conta operacional/escrow

```bash
cd <sep-api-root>
find src/main/java/com/dynamis/sep_api/pix -maxdepth 6 -type f | sort
rg -n "ContaEscrow|OPERACIONAL|ATIVA|Escrow.*Port|Escrow.*Adapter" \
  src/main/java/com/dynamis/sep_api/escrow src/main/java/com/dynamis/sep_api/pix
rg -n "ChavePixSeguranca|valorHash|valorMascarado" \
  src/main/java/com/dynamis/sep_api/pix src/test/java/com/dynamis/sep_api/pix
```

**Verificacao**:
- Identificar a fonte unica para resolver a conta operacional/escrow ativa.
- Definir uma porta minima caso `pix` ainda nao consiga consultar a conta sem acessar repository de
  outro modulo.
- Confirmar reuso de `ChavePixSeguranca`, sem duplicar hashing/mascaramento.
- Confirmar que nenhum fluxo existente persiste chave Pix em claro.

### Step 031.0.4 - Reconfirmar provider, idempotencia, step-up e auditoria

```bash
cd <sep-api-root>
rg -n "interface PixProvider|class FakePixProvider|class CelcoinPixProvider" src/main/java src/test/java
rg -n "Idempotency-Key|RequireStepUpEstrito|TipoEventoSeguranca|AuditListener" \
  src/main/java/com/dynamis/sep_api/pix src/main/java/com/dynamis/sep_api/identity \
  src/main/java/com/dynamis/sep_api/shared src/test/java/com/dynamis/sep_api/pix
```

**Verificacao**:
- Reusar validacao de `Idempotency-Key` da borda Pix; nao criar formato concorrente.
- Confirmar `@RequireStepUpEstrito` nas mutacoes, sem bypass pre-MFA.
- Confirmar listener AFTER_COMMIT + REQUIRES_NEW e CHECK forward-only de auditoria.
- Confirmar que o skeleton Celcoin usa OAuth, MDC, retry/circuit breaker e traducao sanitizada de
  erro existentes.

### Step 031.0.5 - Confirmar tipos e normalizacao

Antes de implementar, registrar no checkpoint o contrato final para `CPF`, `CNPJ`, `EMAIL`,
`TELEFONE` e `EVP`:
- remover pontuacao apenas de CPF/CNPJ/telefone antes de validar e hashear;
- email normalizado com trim e lowercase;
- EVP normalizada como UUID canonico;
- hash e mascara calculados sobre o mesmo valor normalizado enviado ao provider;
- rejeitar tipo/valor incompativel com `400`, sem ecoar o valor na mensagem.

Se o codigo ou contrato vigente limitar os tipos, reduzir o enum ao conjunto comprovado; nao
inventar suporte parcial.

### Step 031.0.6 - Rodar baseline

```bash
cd <sep-api-root>
./gradlew check
```

Registrar resultado e contagem de testes antes da alteracao.

### Definicao de pronto do Gate 31.0

- [ ] Cadeia Git e base da branch validadas.
- [ ] Dependencias das Sprints 19-21, 27 e 30 confirmadas.
- [ ] Conta operacional/escrow e porta de consulta identificadas.
- [ ] Contrato de tipos/normalizacao fechado sem suposicao silenciosa.
- [ ] Provider, idempotencia, step-up e auditoria reconfirmados.
- [ ] Baseline verde ou falha preexistente documentada.

---

## Task 31.1 - Contrato, normalizacao e dominio `ChavePix`

**Objetivo**: definir invariantes, tipos e transicao de estado antes de persistencia ou HTTP.

**Esforco**: 0,5 dia.

**Arquivos esperados**:
- `pix/domain/model/ChavePix.java`
- `pix/domain/vo/TipoChavePix.java`
- `pix/domain/vo/StatusChavePix.java`
- normalizador/validador pequeno em domain/application, conforme o padrao atual.
- testes de dominio e normalizacao.

### Step 031.1.1 - Escrever testes de tipo e normalizacao

Cobrir:
- valores validos de cada tipo suportado.
- trim/canonicalizacao deterministica antes de hash/mascara/provider.
- CPF/CNPJ/telefone/email/EVP invalidos rejeitados sem ecoar valor bruto.
- hash igual para representacoes equivalentes normalizadas.
- mascaramento nunca retorna o valor integral e respeita o limite vigente.
- tipo e valor incompativeis falham antes de chamar provider ou repository.

### Step 031.1.2 - Escrever testes de dominio

Cobrir:
- nova chave valida nasce `ATIVA` apenas com `valorHash`, `valorMascarado` e referencia provider.
- `ATIVA -> INATIVA` e a unica transicao mutavel.
- remover `INATIVA` e no-op idempotente e informa que nao houve mudanca.
- entidade, `toString`, eventos e excecoes nao carregam valor bruto.
- campos obrigatorios, limites e timestamps preservam invariantes.

### Step 031.1.3 - Implementar o menor modelo de dominio

Campos internos esperados:

```text
id
contaEscrowId
tipo
valorHash
valorMascarado
status
providerKeyId
idempotencyKey
criadaPorUsuarioId
removidaPorUsuarioId
criadaEm
removidaEm
```

Regras:
- Sem campo `valor`, payload ou request provider na entidade.
- Sem setter publico de status; usar `inativar(usuarioId, instante)`.
- `providerKeyId` nunca aparece em resposta/erro/auditoria publica.
- Nao adicionar estados intermediarios nem abstracao para futuro split/Pix automatico.

### Verificacao

```bash
./gradlew test --tests "*ChavePix*Test" --tests "*Normaliz*ChavePix*"
./gradlew spotlessCheck
```

### Definicao de pronto da Task 31.1

- [ ] Tipos e normalizacao estao explicitos e testados.
- [ ] Dominio representa somente `ATIVA -> INATIVA`.
- [ ] Valor bruto nao entra em entidade, evento ou excecao.
- [ ] Nenhum provider ou framework entrou no dominio.

### Commit sugerido

```text
feat(pix): modelar chave da conta operacional
```

---

## Task 31.2 - Migration, persistencia e concorrencia

**Objetivo**: persistir chaves minimizadas e garantir idempotencia/unicidade tambem sob corrida.

**Esforco**: 0,5 dia.

**Arquivos esperados**:
- `pix/infrastructure/persistence/ChavePixRepository.java`
- migration `V58__criar_chave_pix.sql`
- testes de repository com PostgreSQL/Testcontainers.

### Step 031.2.1 - Criar migration forward-only

Criar `chave_pix` com FKs sem `ON DELETE CASCADE`, CHECKs e indices. Regras minimas:
- `status in ('ATIVA','INATIVA')`.
- `tipo` limitado aos tipos realmente aprovados no Gate 31.0.
- `valor_hash` com 64 caracteres; `valor_mascarado` limitado; sem coluna de valor bruto.
- `provider_key_id` e `idempotency_key` internos, com limites coerentes com o projeto.
- UNIQUE de `idempotency_key` no escopo da conta operacional.
- UNIQUE parcial de `(conta_escrow_id, tipo, valor_hash)` quando `status='ATIVA'`.
- indices de listagem por conta/status/criacao.

Se outra migration tiver ocupado `V58` quando a task iniciar, usar o proximo numero livre sem
renumerar migrations aplicadas.

### Step 031.2.2 - Criar repository e consultas

Consultas esperadas:

```text
findByContaEscrowIdAndIdempotencyKey(...)
findByContaEscrowIdAndTipoAndValorHashAndStatus(...)
findAllByContaEscrowIdOrderByCriadaEmDesc(...)
findByIdForUpdate(...)
```

Usar lock pessimista na remocao para serializar DELETE concorrente. Traduzir somente as constraints
conhecidas; nao converter toda `DataIntegrityViolationException` em conflito funcional.

### Step 031.2.3 - Testar constraints e concorrencia

Cobrir:
- nunca existe coluna/valor bruto persistido.
- mesma idempotency key na conta nao duplica.
- mesma chave normalizada nao possui duas linhas `ATIVA` na mesma conta.
- uma nova ativacao apos `INATIVA` so e permitida com nova idempotency key e decisao explicitamente
  coberta; por default, permitir reativacao como novo cadastro/provider.
- listagem deterministica inclui `ATIVA` e `INATIVA`.
- lock impede duas remocoes efetivas/auditorias concorrentes.

### Verificacao

```bash
./gradlew test --tests "*ChavePixRepositoryTest"
./gradlew spotlessCheck
```

### Definicao de pronto da Task 31.2

- [ ] Migration minimiza dados e possui CHECKs/indices.
- [ ] Idempotencia e unicidade ativa protegidas pelo banco.
- [ ] Remocao concorrente pode ser serializada.
- [ ] Repository nao vaza detalhes JPA para o dominio/web.

### Commit sugerido

```text
feat(pix): persistir chaves com minimizacao
```

---

## Task 31.3 - Evolucao do `PixProvider` e fake idempotente

**Objetivo**: adicionar gestao de chaves ao Provider Pattern existente e entregar o comportamento
local default sem dependencia externa.

**Esforco**: 0,5 dia.

**Arquivos esperados**:
- metodos e DTOs SEP em `pix/application/port/out`.
- evolucao de `FakePixProvider`.
- testes unitarios do fake.

### Step 031.3.1 - Definir contratos SEP do provider

Contratos orientativos:

```text
cadastrarChave(ComandoCadastrarChavePix, idempotencyKey, correlationId)
removerChave(providerKeyId, correlationId)
```

O comando leva apenas tipo, valor normalizado e identificador tecnico da conta necessario ao
provider. A resposta de cadastro leva somente `providerKeyId`. Nao retornar DTO Celcoin, payload
bruto, conta bancaria ou valor da chave.

### Step 031.3.2 - Escrever testes do fake

Cobrir:
- cadastro retorna identificador tecnico deterministico/seguro.
- mesma idempotency key + mesmo comando retorna a mesma resposta.
- mesma key + comando diferente falha com conflito sanitizado.
- remocao existente e repetida sao idempotentes.
- falha armada de cadastro/remocao nao inclui chave na exception/log.
- `reset()` limpa estado entre testes.
- operacoes antigas de transferencia, cobranca e webhook nao regressam.

### Step 031.3.3 - Implementar fake thread-safe

Usar estado concorrente minimo por idempotency key/provider id. Nao logar comando inteiro, chave,
hash ou mascara; logar apenas provider id/status quando necessario. Nao simular DICT, banco ou
maquina de estados que a spec nao exige.

### Verificacao

```bash
./gradlew test --tests "*FakePixProviderTest" --tests "*ChavePixProvider*"
./gradlew spotlessCheck
```

### Definicao de pronto da Task 31.3

- [ ] `PixProvider` expressa cadastro/remocao sem tipos Celcoin.
- [ ] Fake default e idempotente e thread-safe.
- [ ] Falhas sao sanitizadas.
- [ ] Fluxos Pix existentes permanecem cobertos.

### Commit sugerido

```text
feat(pix): adicionar chaves ao provider fake
```

---

## Task 31.4 - Skeleton Celcoin coberto por WireMock

**Objetivo**: implementar o adapter HTTP de chaves no skeleton ja existente, sem ativa-lo ou
afirmar compatibilidade E2E com Celcoin real.

**Esforco**: 0,5 dia.

**Arquivos esperados**:
- DTOs Celcoin internos em `pix/infrastructure/adapter/celcoin/dto`.
- evolucao de `CelcoinPixProvider`.
- cenarios novos em `CelcoinPixProviderIT` com WireMock.

### Step 031.4.1 - Definir contrato HTTP skeleton isolado

Manter rotas, campos e mapeamento restritos ao adapter. Documentar no teste que o contrato e
skeleton local da Fase 4 e precisa ser validado contra a documentacao/credenciais reais na Fase 5.
Nao espalhar nomes Celcoin em application/domain.

### Step 031.4.2 - Implementar cadastro e remocao

Reusar:
- OAuth2 client-credentials e cache de token existentes.
- `RestClientFactory`, `celcoin-pix`, retry e circuit breaker.
- `MDCBridge`/interceptor para `Idempotency-Key` e correlation id.
- traducao `PixProviderHttpException`, sem body de erro.

Cadastro envia a chave apenas no body HTTP em memoria. Logs nao incluem body, chave, hash ou
mascara. DELETE usa somente `providerKeyId`.

### Step 031.4.3 - Cobrir com WireMock

Cobrir:
- Bearer token, correlation id e `Idempotency-Key` no cadastro.
- request/response mapeados para DTOs internos sem vazar ao port.
- DELETE com identificador tecnico e sucesso idempotente (`2xx`/not-found conforme contrato
  skeleton decidido).
- resposta nula/malformada e status desconhecido.
- 4xx traduzido sem retry indevido; 5xx/rede com retry/circuit breaker conforme configuracao.
- exception e logs capturados nao contem a chave usada no teste nem body de erro.

### Verificacao

```bash
./gradlew test --tests "*CelcoinPixProviderIT"
./gradlew spotlessCheck
```

### Definicao de pronto da Task 31.4

- [ ] Skeleton implementa cadastro/remocao pelo port existente.
- [ ] WireMock cobre sucesso, idempotencia HTTP e erro sanitizado.
- [ ] Fake continua default.
- [ ] Nenhuma credencial/chamada real foi usada.

### Commit sugerido

```text
feat(pix): criar skeleton de chaves Celcoin
```

---

## Task 31.5 - Cadastro assistido, idempotencia e auditoria

**Objetivo**: orquestrar o `POST` com conta operacional, minimizacao, provider e replay seguro.

**Esforco**: 0,5-1 dia.

**Arquivos esperados**:
- `pix/application/usecase/CadastrarChavePixUseCase.java`
- command/result de aplicacao.
- porta/adaptador minimo para resolver conta operacional/escrow, se necessario.
- eventos/listener de auditoria de chave.
- migration `V59__ampliar_audit_seguranca_tipo_chave_pix.sql`.
- testes unitarios do use case/listener.

### Step 031.5.1 - Escrever testes do use case

Cobrir:
- cadastro valido resolve conta, normaliza, chama provider e persiste somente hash/mascara.
- mesma key + mesmo tipo/valor/conta retorna mesma chave com `novo=false`, sem provider/auditoria
  adicionais.
- mesma key + payload diferente retorna `409` antes de chamar provider.
- mesma chave ja `ATIVA` com outra key retorna conflito funcional.
- chave anteriormente `INATIVA` pode ser cadastrada novamente como novo recurso.
- conta operacional ausente/inativa falha de forma sanitizada.
- provider falha: nenhuma chave ativa nem auditoria de cadastro fica persistida.
- corrida cai em constraint conhecida e converge para recurso idempotente ou `409`, sem `500`.

### Step 031.5.2 - Implementar fluxo de cadastro

Fluxo esperado:
1. Validar `Idempotency-Key`, tipo e valor.
2. Resolver a conta operacional/escrow ativa por porta.
3. Normalizar uma unica vez; calcular hash e mascara.
4. Verificar replay por conta + idempotency key e comparar tipo/hash.
5. Bloquear duplicata ativa por conta + tipo + hash.
6. Chamar `PixProvider.cadastrarChave` com a mesma idempotency key.
7. Persistir `ChavePix ATIVA` com provider id, hash e mascara, nunca valor bruto.
8. Publicar evento `PIX_CHAVE_CADASTRADA` apenas para criacao nova.
9. Retornar result minimo com `novo`.

O provider precisa honrar idempotencia para permitir retry seguro caso a chamada externa conclua e
a persistencia local falhe. Nao criar compensacao/remocao automatica sem contrato comprovado.

### Step 031.5.3 - Implementar auditoria

- Adicionar `PIX_CHAVE_CADASTRADA` e `PIX_CHAVE_REMOVIDA` a `TipoEventoSeguranca`.
- Criar migration forward-only a partir do CHECK completo mais recente (`V57` na baseline).
- Listener AFTER_COMMIT + REQUIRES_NEW, seguindo `PixDesembolsoAuditListener`.
- `usuario_id` representa o operador que realizou a mutacao.
- Detalhes nao levam valor bruto, hash, mascara, provider id, idempotency key ou conta externa.
- Falha de serializacao nao pode revelar evento/objeto inteiro no log.

### Verificacao

```bash
./gradlew test --tests "*CadastrarChavePixUseCaseTest" --tests "*PixChaveAuditListenerTest"
./gradlew spotlessCheck
```

### Definicao de pronto da Task 31.5

- [ ] Cadastro novo e replay idempotente estao cobertos.
- [ ] Valor bruto existe apenas no comando/chamada provider em memoria.
- [ ] Provider/auditoria nao duplicam em replay.
- [ ] Falha externa nao cria falso estado `ATIVA`.
- [ ] Auditoria suporta os dois eventos da spec.

### Commit sugerido

```text
feat(pix): cadastrar chave com idempotencia
```

---

## Task 31.6 - Listagem mascarada e remocao idempotente

**Objetivo**: entregar leitura local segura e transicao `ATIVA -> INATIVA` com step-up na borda.

**Esforco**: 0,5 dia.

**Arquivos esperados**:
- `ListarChavesPixUseCase.java`
- `RemoverChavePixUseCase.java`
- results de aplicacao.
- testes unitarios de consulta/remocao.

### Step 031.6.1 - Escrever testes de listagem

Cobrir:
- lista chaves da conta operacional corrente, incluindo `ATIVA` e `INATIVA`.
- ordena por criacao decrescente de forma deterministica.
- lista vazia e valida.
- nao chama provider.
- result contem somente id, tipo, valor mascarado, status e timestamps publicos.
- nenhum caminho retorna valorHash, providerKeyId, idempotencyKey ou conta externa.

### Step 031.6.2 - Escrever testes de remocao

Cobrir:
- chave `ATIVA` chama provider uma vez, inativa e publica auditoria uma vez.
- chave `INATIVA` retorna sucesso sem provider, persistencia ou nova auditoria.
- UUID inexistente retorna `404` neutro.
- provider falha e a chave permanece `ATIVA`, sem auditoria de remocao.
- duas remocoes concorrentes resultam em uma unica chamada efetiva/auditoria.
- erro/evento/log nao contem valor bruto, hash, mascara ou provider id.

### Step 031.6.3 - Implementar listagem read-only

Resolver a conta operacional e consultar apenas a persistencia local. Usar transacao read-only e
mapear para result dedicado; nao retornar entidade JPA/domain diretamente ao controller.

### Step 031.6.4 - Implementar remocao com lock

Fluxo esperado:
1. Buscar chave por id com lock e escopo da conta operacional.
2. Retornar `404` neutro se nao encontrada no escopo.
3. Se `INATIVA`, encerrar como sucesso idempotente.
4. Chamar `PixProvider.removerChave(providerKeyId, correlationId)`.
5. Aplicar `inativar` e persistir ator/data.
6. Publicar `PIX_CHAVE_REMOVIDA` apenas na primeira transicao efetiva.

Nao apagar fisicamente a linha e nao reutilizar DELETE para qualquer transferencia/DICT global.

### Verificacao

```bash
./gradlew test --tests "*ListarChavesPixUseCaseTest" --tests "*RemoverChavePixUseCaseTest"
./gradlew spotlessCheck
```

### Definicao de pronto da Task 31.6

- [ ] Listagem e local, read-only e sempre mascarada.
- [ ] Remocao inativa em vez de apagar.
- [ ] Replay/concorrencia nao duplicam provider nem auditoria.
- [ ] Falha do provider preserva estado local coerente.

### Commit sugerido

```text
feat(pix): listar e remover chaves
```

---

## Task 31.7 - Endpoints, integracao, docs e fechamento

**Objetivo**: publicar o contrato REST, validar seguranca/minimizacao fim a fim e fechar a sprint.

**Esforco**: 0,5-1 dia.

**Arquivos esperados**:
- `pix/web/controller/PixChaveController.java`
- DTOs dedicados de request/response.
- testes `@WebMvcTest` e integracao Postgres/auth real.
- OpenAPI/collection e docs operacionais.

### Step 031.7.1 - Criar DTOs e endpoints

Request de cadastro:

```text
tipo
valor
```

Response de cadastro/listagem:

```text
id
tipo
valorMascarado
status
criadaEm
removidaEm
```

Regras HTTP:
- `POST`: `201` novo, `200` replay, `400` entrada/key invalida, `403` role/step-up, `409`
  conflito, erro provider sanitizado conforme handler vigente.
- `GET`: `200` com array, inclusive vazio; sem step-up.
- `DELETE`: `204` para remocao nova ou replay inativo; `403` role/step-up; `404` neutro.
- DTO nao inclui `novo`; ele serve apenas para escolher o status HTTP.
- OpenAPI nao usa valor real de chave em example.

### Step 031.7.2 - Testar borda web

Cobrir:
- sem autenticacao -> `401`.
- papel fora de `FINANCEIRO`/`ADMIN` -> `403` nos tres endpoints.
- `POST`/`DELETE` sem step-up estrito -> `403`; `GET` funciona sem step-up.
- `POST` sem `Idempotency-Key` ou com header invalido -> `400`.
- tipo/valor invalido -> `400` sem ecoar valor.
- primeira criacao `201`; replay `200`; conflito `409`.
- DELETE existente/inativo `204`; inexistente `404` neutro.
- JSON de resposta/erro nao contem campos proibidos.

### Step 031.7.3 - Testes de integracao e regressao

Cobrir pelo menos com auth real + PostgreSQL:
- `POST -> GET -> DELETE -> GET` preserva mascara e mostra `INATIVA`.
- replay do POST nao duplica linha, provider ou auditoria.
- chave equivalente apos normalizacao colide como esperado.
- falha de cadastro/remocao do fake mantem persistencia coerente.
- step-up estrito real bloqueia mutacoes sem token.
- tabela e audit log nao contem a chave bruta usada no teste.
- endpoints de desembolso, recebimento, webhook e leituras owner-scoped permanecem isolados.

### Step 031.7.4 - Rodar suite de verificacao

```bash
cd <sep-api-root>
./gradlew test --tests "*ChavePix*" --tests "*PixChave*" --tests "*PixProvider*"
./gradlew spotlessCheck
./gradlew check
./gradlew bootJar
```

Se houver falha preexistente, registrar comando, trecho relevante e evidencia de que a sprint nao a
introduziu.

### Step 031.7.5 - Atualizar contratos e docs

Arquivos esperados:
- OpenAPI/Swagger do `sep-api`.
- collection Postman/HTTP vigente.
- `docs-SEP/repos/sep-api/PIX.md`.
- `docs-SEP/AI-ROADMAP.md`.
- `docs-SEP/repos/sep-api/SPRINT-31-PR.md`.
- `docs-SEP/docs-sep/STATE.md` e `CONTEXT-PARTE-2.md` no fechamento.
- `docs-SEP/docs-sep/PRD-FASE-4.md` quando concluida/mergeada.

Conteudo minimo:
- contrato `POST/GET/DELETE /api/v1/pix/chaves`.
- roles, step-up apenas nas mutacoes e idempotencia do cadastro/remocao.
- tipos suportados e normalizacao efetivamente implementada.
- persistencia somente de hash/mascara; nunca valor bruto.
- fake default, Celcoin skeleton WireMock e ativacao real adiada para Fase 5.
- aviso explicito de que nenhuma transferencia, recebimento ou movimentacao de dinheiro ocorre.

### Step 031.7.6 - Checkpoint final

Registrar:
- resumo do fluxo e decisoes finais.
- arquivos alterados e migrations criadas.
- testes/build executados e resultados.
- evidencia de ausencia de chave bruta em persistencia, resposta, erro, audit e log.
- riscos/remanescentes, sobretudo validacao do contrato Celcoin na Fase 5.
- confirmacao de que o provider fake continua default e nenhum dinheiro foi movido.
- sugestao de commits/descricao de PR.

### Definicao de pronto da Task 31.7

- [ ] Contrato REST publicado com roles e step-up corretos.
- [ ] Fluxo `POST -> GET -> DELETE -> GET` validado.
- [ ] Idempotencia e concorrencia cobertas em integracao.
- [ ] WireMock cobre o skeleton; provider real nao foi acionado.
- [ ] OpenAPI, collection, `PIX.md` e roadmap atualizados.
- [ ] `SPRINT-31-PR.md` criado com evidencias.
- [ ] `STATE.md`, historico e PRD atualizados no fechamento.
- [ ] `./gradlew check` e `bootJar` verdes ou falha preexistente documentada.

### Commit sugerido

```text
docs: documentar fechamento da sprint 31
```

---

## Definition of Done da Sprint 31

- [ ] Financeiro/admin cadastra e remove chave com step-up estrito.
- [ ] Financeiro/admin lista chaves mascaradas sem step-up.
- [ ] Cadastro exige `Idempotency-Key` e responde `201/200` sem duplicar efeito.
- [ ] Remocao `ATIVA -> INATIVA` e idempotente e nao apaga historico.
- [ ] Hash, mascara e provider id substituem o valor bruto em toda persistencia.
- [ ] Valor bruto nao aparece em GET, erro, log, evento, auditoria ou exception.
- [ ] Unicidade ativa e idempotencia estao protegidas no PostgreSQL.
- [ ] `PixProvider`, fake default e skeleton Celcoin suportam cadastro/remocao.
- [ ] WireMock cobre sucesso/erro do skeleton sem chamada real.
- [ ] Auditoria registra `PIX_CHAVE_CADASTRADA` e `PIX_CHAVE_REMOVIDA` uma vez por transicao.
- [ ] Nenhum dinheiro e movido e fluxos das Sprints 19-21 permanecem intactos.
- [ ] OpenAPI, collection, `PIX.md`, roadmap e `SPRINT-31-PR.md` estao atualizados.
- [ ] `./gradlew check` e `bootJar` passam ou falha preexistente fica documentada.
