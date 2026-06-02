# Steps - Sprint 18 - Administracao, RBAC cumulativo e parametros

**Spec de origem**: [`specs/fase-3/018-sprint-18-governanca-rbac-parametros.md`](../../specs/fase-3/018-sprint-18-governanca-rbac-parametros.md)

**Status**: a implementar.

**Objetivo geral**: evoluir a administracao interna para suportar multiplas roles por usuario, resolver a pendencia `FINANCEIRO + BACKOFFICE`, expor parametros operacionais versionados e auditaveis, e reforcar a trilha administrativa com endpoints sensiveis protegidos por step-up.

**Esforco total estimado**: 7-10 dias de Dev Senior.

**Repo de destino**:
- `sep-api`: backend Spring Boot, unico repo de codigo alterado nesta sprint.
- `docs-SEP`: documentacao editada no working tree quando necessario; operacao git continua manual.

**Branch sugerida**:
- `feature/sprint-18-governanca-rbac-parametros`

**Pre-requisitos globais**:
- Fase 2 concluida em `main` e `develop` atualizado.
- Sprint 14/15 conhecidas: role `BACKOFFICE`, step-up, auditoria e pendencias de multi-role documentadas.
- Auth JWT, MFA/step-up e audit log de seguranca funcionando.
- `Usuario`, `Role`, `JwtTokenProvider`, `CustomUserDetailsService`, controllers de usuarios e `AlterarRoleUsuarioUseCase` mapeados antes de alterar contrato.
- ADRs 0001 (monolito modular DDD), 0007 (DDD + Hexagonal) e docs de seguranca vigentes.

**Nota sobre numeracao de migrations**:
- Confirmar sempre o proximo numero livre em `src/main/resources/db/migration`.
- Se a Sprint 17 ja estiver mergeada, a Sprint 18 deve provavelmente iniciar em `V42`.
- Se a Sprint 18 rodar em paralelo antes da Sprint 17, reservar numero livre real da branch e registrar risco de conflito de migration.

**Fora de escopo**:
- Tela web de governanca.
- SSO corporativo.
- ABAC completo.
- WebAuthn/Passkeys.
- Refactor amplo de todos os guards de negocio para modelo de permissionamento granular.
- Step-up estrito sem bypass MFA para Pix; esta sprint pode preparar decisao/annotation, mas nao implementa Pix.

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
- `clean-architecture`: dominio de usuarios/governanca protegido de web/JWT/JPA, use cases na application layer, ports/adapters quando a regra depender de infraestrutura.

---

## Decisoes tecnicas da Sprint 18

- **Compatibilidade de claims**: JWT continua emitindo `roles` como lista (`ROLE_ADMIN`, `ROLE_CLIENTE`, etc.). O consumidor que ja espera lista nao deve quebrar.
- **Compatibilidade de dominio legado**: durante a migracao, preservar uma leitura equivalente a `getRole()` ou `rolePrincipal()` quando codigo existente ainda precisar de uma role singular. A fonte autoritativa passa a ser o conjunto de roles.
- **Modelo cumulativo**: usuario pode possuir mais de uma role operacional. `ADMIN` nao deve ser removido acidentalmente de si mesmo pelo proprio admin sem regra explicita de seguranca.
- **Parametros operacionais**: valores versionados e auditaveis no banco; uso em regras criticas deve passar por service/port, nao por leitura direta em controller.
- **Step-up**: alteracoes de roles e parametros exigem `@RequireStepUp` na borda web.

---

## Ordem de execucao recomendada

```text
18.0 (prechecks)
  |
  v
18.1 (modelo de roles cumulativas preservando compatibilidade)
  |
  v
18.2 (migrations usuario_role + migracao dos dados existentes)
  |
  v
18.3 (JWT, Spring Security e guards para multiplas roles)
  |
  v
18.4 (parametros operacionais versionados e auditaveis)
  |
  v
18.5 (endpoints administrativos com step-up)
  |
  v
18.6 (auditoria, OpenAPI e regressao de seguranca)
  |
  v
18.7 (docs, collections e fechamento)
```

- 18.1/18.2 alteram o contrato persistente de usuario e devem ser pequenas e muito testadas.
- 18.3 adapta o runtime de autenticacao/autorizacao.
- 18.4 adiciona governanca de parametros sem espalhar `@Value` dinamico por regras de negocio.
- 18.5 expoe operacoes sensiveis somente apos use cases prontos.
- 18.6 fecha auditoria e regressao.
- 18.7 e gate documental; nao conta como task de implementacao.

---

## Task 18.0 - Prechecks da Sprint 18

**Objetivo**: garantir que a sprint nasce de base correta e mapear todos os pontos afetados por RBAC, JWT, step-up, auditoria e parametros.

**Esforco**: 1-2 horas.

### Step 018.0.1 - Conferir estado Git do `sep-api`

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
- Se Sprint 17 ainda estiver aberta e houver conflito de migration, registrar e pedir decisao do usuario.
- Se houver mudancas locais, identificar se sao do usuario; nao reverter.

### Step 018.0.2 - Criar branch da sprint

**Comandos**:
```bash
cd <sep-api-root>
git switch develop
git pull --ff-only
git switch -c feature/sprint-18-governanca-rbac-parametros
```

**Verificacao**:
- Branch criada a partir de `develop` atualizado.
- Se `git pull --ff-only` falhar, abortar e avisar o usuario.

### Step 018.0.3 - Rodar baseline backend

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

### Step 018.0.4 - Mapear pontos de RBAC/JWT/step-up

**Comandos**:
```bash
cd <sep-api-root>
grep -R "enum Role" -n src/main/java/com/dynamis/sep_api/usuarios
grep -R "getRole()\\|\\.role()\\|ROLE_" -n src/main/java/com/dynamis/sep_api
grep -R "JwtTokenProvider\\|CustomUserDetailsService\\|UsuarioAutenticado" -n src/main/java/com/dynamis/sep_api/identity
grep -R "hasRole\\|hasAnyRole\\|@PreAuthorize" -n src/main/java/com/dynamis/sep_api
grep -R "RequireStepUp" -n src/main/java/com/dynamis/sep_api
grep -R "AlterarRoleUsuarioUseCase\\|UsuarioRoleUpdateDto" -n src/main/java/com/dynamis/sep_api
grep -R "TipoEventoSeguranca\\|ROLE_ALTERADA" -n src/main/java/com/dynamis/sep_api
find src/main/resources/db/migration -maxdepth 1 -type f | sort | tail
```

**Verificacao**:
- Todos os usos de role singular mapeados.
- Pontos de claims JWT e authorities mapeados.
- Endpoints sensiveis com `@RequireStepUp` localizados.
- Proximo numero de migration confirmado.

### Step 018.0.5 - Definir parametros operacionais iniciais

**Checklist**:
- Parametros candidatos:
  - thresholds de score/risco do motor de credito;
  - limites de valor/prazo por PF/PJ;
  - thresholds de backoffice (`proposta > 24h`, contrato aceito > 48h, webhook > 1h);
  - limites de reprocesso operacional quando aplicavel.
- Definir chaves canonicas (`credito.score.pre-aprovacao`, `backoffice.webhook.pendente.horas`, etc.).
- Definir tipo do valor (`INTEGER`, `DECIMAL`, `BOOLEAN`, `STRING`) e validacao.
- Definir se a Sprint 18 apenas cadastra parametros ou tambem troca consumo de properties em regras criticas.

### Definicao de pronto da Task 18.0
- [ ] Branch correta criada.
- [ ] Baseline backend executado e registrado.
- [ ] Usos de role singular mapeados.
- [ ] Pontos JWT/authorities/guards mapeados.
- [ ] Proximo numero de migration confirmado.
- [ ] Lista inicial de parametros aprovada.

---

## Task 18.1 - Modelo de roles cumulativas

**Objetivo**: adaptar o dominio de usuario para representar multiplas roles preservando compatibilidade com o contrato atual.

**Pre-requisito**: Task 18.0 concluida.

**Esforco**: 1-1.5 dia.

**Arquivos principais**:
- `usuarios/domain/model/Usuario.java`
- `usuarios/domain/model/Role.java`
- novo VO/helper, se necessario: `usuarios/domain/model/UsuarioRoles.java`
- `usuarios/application/usecase/AlterarRoleUsuarioUseCase.java` ou novo use case cumulativo.
- DTOs internos de usuario/role.

**Regras esperadas**:
- Usuario pode possuir conjunto nao vazio de roles.
- Cadastro publico continua criando `CLIENTE`.
- Criacao de usuario interno continua controlada por `ADMIN`.
- `FINANCEIRO + BACKOFFICE` passa a ser valido simultaneamente.
- Operacao de role deve ser cumulativa: adicionar/remover/substituir conjunto explicitamente, sem apagar roles por acidente.
- Impedir que um admin remova sua ultima role administrativa de si mesmo sem regra explicita aprovada.

**Compatibilidade**:
- Manter leitura singular equivalente (`rolePrincipal()` ou adapter de compatibilidade) enquanto existirem fluxos antigos.
- DTOs atuais que exibem `role` podem ganhar `roles` sem quebrar imediatamente consumidores existentes.
- Claims JWT devem continuar como lista de strings.

**Clean Architecture**:
- Regras de consistencia do conjunto de roles ficam no dominio/use case.
- Controller nao decide transicoes de role.
- Spring Security/JWT apenas traduz roles ja resolvidas.

### Definicao de pronto da Task 18.1
- [ ] Modelo cumulativo definido.
- [ ] Cadastro publico/interno preserva comportamento atual.
- [ ] `FINANCEIRO + BACKOFFICE` representavel.
- [ ] Testes unitarios de dominio/use case para adicionar/remover/substituir roles.

---

## Task 18.2 - Migrations de roles cumulativas

**Objetivo**: criar estrutura persistente para roles cumulativas e migrar dados existentes sem perda de acesso.

**Pre-requisito**: Task 18.1 concluida.

**Esforco**: 1 dia.

**Arquivos principais**:
- `src/main/resources/db/migration/Vxx__criar_usuario_role.sql`
- repositories/adapters afetados em `usuarios/infrastructure/persistence`.

**Schema esperado**:
- Tabela `usuario_role`:
  - `usuario_id UUID NOT NULL`;
  - `role VARCHAR(...) NOT NULL`;
  - auditoria minima se o padrao local exigir;
  - PK ou UNIQUE em `(usuario_id, role)`;
  - FK para `usuario(id)` sem cascade destrutivo.
- Backfill:
  - inserir em `usuario_role` a role atual de cada usuario.
- Compatibilidade:
  - manter coluna `usuario.role` temporariamente ou remover apenas se todos os usos forem migrados na mesma sprint com baixo risco.

**Verificacao**:
```bash
cd <sep-api-root>
./gradlew test --tests "*Usuario*RepositoryTest"
```

### Definicao de pronto da Task 18.2
- [ ] Migration forward-only criada com numero correto.
- [ ] Dados existentes migrados para `usuario_role`.
- [ ] Constraints impedem role duplicada para o mesmo usuario.
- [ ] Testes de repository/migration proporcionais verdes.

---

## Task 18.3 - JWT, authorities e guards para multiplas roles

**Objetivo**: atualizar autenticacao/autorizacao para emitir e consumir multiplas roles sem quebrar tokens/fluxos existentes.

**Pre-requisito**: Task 18.2 concluida.

**Esforco**: 1-1.5 dia.

**Arquivos principais**:
- `identity/infrastructure/security/JwtTokenProvider.java`
- `identity/infrastructure/security/CustomUserDetailsService.java`
- `identity/infrastructure/security/UsuarioAutenticado.java`
- filtros/aspects que leem principal autenticado.
- controllers/use cases que usam `principal.role()`.

**Regras esperadas**:
- JWT claim `roles` contem todas as authorities (`ROLE_ADMIN`, `ROLE_FINANCEIRO`, `ROLE_BACKOFFICE`, etc.).
- Parsing de token aceita lista atual e, se houver token legado, faz fallback seguro para role singular quando aplicavel.
- `CustomUserDetailsService` emite `GrantedAuthority` para todas as roles.
- `@PreAuthorize("hasRole('X')")` continua funcionando.
- Pontos que usam role singular devem migrar para `hasRole`, `hasAnyRole` ou helper de `UsuarioAutenticado`.

**Regressao obrigatoria**:
- Login de `CLIENTE`, `ADMIN`, `FINANCEIRO`, `BACKOFFICE` e usuario multi-role.
- Endpoint que exige `FINANCEIRO`.
- Endpoint que exige `BACKOFFICE`.
- Endpoint que aceita `ADMIN`.

### Definicao de pronto da Task 18.3
- [ ] JWT emite multiplas roles.
- [ ] Principal autenticado carrega conjunto de roles.
- [ ] Guards e `@PreAuthorize` continuam funcionando.
- [ ] Testes de login/autorizacao multi-role verdes.

---

## Task 18.4 - Parametros operacionais versionados

**Objetivo**: implementar governanca de parametros operacionais auditaveis para limites configuraveis criticos.

**Pre-requisito**: Task 18.3 concluida.

**Esforco**: 1.5-2 dias.

**Arquivos principais**:
- `governanca/domain/model/ParametroOperacional.java` ou modulo equivalente aprovado.
- `governanca/domain/model/VersaoParametroOperacional.java` se separar historico.
- `governanca/domain/vo/TipoParametroOperacional.java`
- `governanca/application/usecase/ListarParametrosOperacionaisUseCase.java`
- `governanca/application/usecase/AlterarParametroOperacionalUseCase.java`
- `governanca/application/port/out/ParametroOperacionalReader.java` ou service de leitura para modulos consumidores.
- migration para tabelas de parametros e historico.

**Parametros iniciais recomendados**:
- `credito.valor.maximo.pf`
- `credito.valor.maximo.pj`
- `credito.prazo.maximo.pf.meses`
- `credito.prazo.maximo.pj.meses`
- `credito.score.pre-aprovacao`
- `credito.open-finance.bonus.entradas.altas`
- `credito.open-finance.bonus.entradas.minimas`
- `credito.open-finance.penalidade.saldo.negativo`
- `backoffice.proposta.pendente.horas`
- `backoffice.contrato.aceito.horas`
- `backoffice.webhook.pendente.horas`

**Regras esperadas**:
- Parametro tem chave unica, tipo, valor atual, descricao, status e versao.
- Alteracao cria historico com valor anterior, valor novo, ator e justificativa.
- Valor deve ser validado conforme tipo e faixa quando houver.
- Parametros sensiveis nao devem ser alterados sem step-up no endpoint.

**Clean Architecture**:
- Modulos consumidores leem parametros por service/port de aplicacao, nao diretamente por repository.
- A Sprint 18 pode iniciar com parametros governados e manter consumo de properties para regras existentes, desde que isso fique documentado; se trocar consumo, fazer de forma incremental e testada.

### Definicao de pronto da Task 18.4
- [ ] Modelo de parametro e historico criado.
- [ ] Migration criada com seed dos parametros iniciais aprovados.
- [ ] Use cases de listar/alterar parametros implementados.
- [ ] Historico registra toda alteracao.
- [ ] Testes unitarios e repository/slice proporcionais verdes.

---

## Task 18.5 - Endpoints administrativos com step-up

**Objetivo**: expor administracao de roles cumulativas e parametros operacionais com protecao administrativa e step-up.

**Pre-requisito**: Task 18.4 concluida.

**Esforco**: 1 dia.

**Arquivos principais**:
- `usuarios/web/controller/UsuarioController.java` ou controller administrativo dedicado.
- `governanca/web/controller/GovernancaParametroController.java`
- DTOs de request/response para roles cumulativas.
- DTOs de request/response para parametros.
- mappers web.

**Endpoints esperados**:
- `GET /api/v1/usuarios/{id}/roles`
  - consulta roles do usuario.
- `PUT /api/v1/usuarios/{id}/roles`
  - substitui conjunto de roles, com `ADMIN` + `@RequireStepUp`.
- `POST /api/v1/usuarios/{id}/roles/{role}`
  - adiciona role, com `ADMIN` + `@RequireStepUp`, se escolhido pelo executor.
- `DELETE /api/v1/usuarios/{id}/roles/{role}`
  - remove role, com `ADMIN` + `@RequireStepUp`, se escolhido pelo executor.
- `GET /api/v1/governanca/parametros`
  - lista parametros.
- `GET /api/v1/governanca/parametros/{chave}`
  - detalhe + historico resumido.
- `PATCH /api/v1/governanca/parametros/{chave}`
  - altera valor com justificativa, `ADMIN` + `@RequireStepUp`.

**Seguranca**:
- Apenas `ADMIN` altera roles e parametros.
- Alteracoes exigem `@RequireStepUp`.
- Responses nao devem vazar secrets, tokens ou dados pessoais desnecessarios.

### Definicao de pronto da Task 18.5
- [ ] Endpoints criados com DTOs e mapper.
- [ ] `@PreAuthorize` e `@RequireStepUp` aplicados nas alteracoes.
- [ ] OpenAPI inicial nos endpoints.
- [ ] Testes de controller/IT cobrindo 200/403/404/422.

---

## Task 18.6 - Auditoria, OpenAPI e regressao de seguranca

**Objetivo**: fechar trilha administrativa e regressao de autenticacao/autorizacao.

**Pre-requisito**: Task 18.5 concluida.

**Esforco**: 1-1.5 dia.

**Arquivos principais**:
- `shared/audit/TipoEventoSeguranca.java`
- migration para ampliar CHECK de audit, se aplicavel.
- listeners de auditoria de usuarios/governanca.
- tests em `identity`, `usuarios`, `governanca` e controllers afetados.

**Eventos de auditoria esperados**:
- `USUARIO_ROLES_ALTERADAS`
- `PARAMETRO_OPERACIONAL_ALTERADO`
- opcional: `PARAMETRO_OPERACIONAL_CRIADO`, se houver criacao dinamica nesta sprint.

**Cenarios minimos de regressao**:
- Login emite todas as roles do usuario.
- Usuario `FINANCEIRO + BACKOFFICE` acessa endpoints de ambas as roles.
- Usuario com apenas `FINANCEIRO` nao acessa endpoint `BACKOFFICE`.
- Usuario com apenas `BACKOFFICE` nao acessa endpoint `FINANCEIRO`.
- `ADMIN` altera roles com step-up.
- Alteracao de roles sem step-up falha.
- Alteracao de parametro com step-up audita valor anterior/novo e justificativa.
- Cadastro publico segue criando apenas `CLIENTE`.
- Tokens legados ou fallback documentado nao quebram de forma insegura.

**Comandos sugeridos**:
```bash
cd <sep-api-root>
./gradlew test --tests "*Usuario*"
./gradlew test --tests "*Security*"
./gradlew test --tests "*Governanca*"
./gradlew test
```

### Definicao de pronto da Task 18.6
- [ ] Eventos de auditoria criados e persistidos apos commit.
- [ ] OpenAPI atualizado.
- [ ] Regressao de login/JWT/guards verde.
- [ ] Multi-role `FINANCEIRO + BACKOFFICE` coberto por teste.
- [ ] Alteracoes sensiveis exigem step-up.

---

## Task 18.7 - Docs, collections e fechamento

**Objetivo**: atualizar documentacao e artefatos operacionais apos a implementacao estar validada.

**Pre-requisito**: Tasks 18.1-18.6 concluidas e revisadas.

**Esforco**: 0.5 dia.

**Arquivos esperados**:
- `docs-SEP/docs-sep/SEGURANCA.md`
- `docs-SEP/repos/sep-api/README.md` ou doc operacional de governanca, se criado.
- `docs-SEP/docs-sep/PRD.md`
- `docs-SEP/docs-sep/CONTEXT.md`
- `docs-SEP/AI-ROADMAP.md`
- Collections Postman/Insomnia quando houver endpoints novos ou alterados.

**Checklist**:
- Documentar modelo multi-role e compatibilidade de claims.
- Documentar endpoints de roles e parametros.
- Registrar parametros operacionais iniciais e regras de alteracao.
- Atualizar PRD/CONTEXT com status real da Sprint 18 apenas apos fechamento/merge confirmado.
- Atualizar roadmap para apontar este step e docs operacionais.

### Definicao de pronto da Task 18.7
- [ ] Docs de seguranca/governanca atualizadas.
- [ ] PRD/CONTEXT atualizados com status real.
- [ ] AI-ROADMAP revisado.
- [ ] Collections atualizadas quando aplicavel.
- [ ] Checkpoint final pronto para commit/PR.

---

## Definition of Done da Sprint 18

- [ ] Usuarios podem acumular roles sem perder permissoes existentes.
- [ ] `FINANCEIRO + BACKOFFICE` funciona em JWT, authorities e guards.
- [ ] Cadastro publico continua criando apenas `CLIENTE`.
- [ ] Alteracoes administrativas de roles exigem `ADMIN` + step-up.
- [ ] Parametros operacionais sao versionados, validados e auditaveis.
- [ ] Alteracoes de parametros exigem step-up e justificativa.
- [ ] Auditoria registra alteracoes de roles e parametros.
- [ ] OpenAPI e docs refletem contratos novos.
- [ ] Testes proporcionais verdes.
- [ ] Migrations aplicam em banco limpo e banco existente.
