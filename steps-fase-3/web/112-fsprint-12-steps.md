# Steps - F-Sprint 12 - Governanca Web

**Spec de origem**: [`specs/fase-3/112-fsprint-12-governanca-web.md`](../../specs/fase-3/112-fsprint-12-governanca-web.md)

**Status**: concluida e mergeada (PR #51 -> `develop`, PR #52 -> `main`, 2026-06-10).

> **Revisao pos-F-12.1 (gaps resolvidos antes de F-12.2)** — confronto do steps com o codigo real (`sep-app` + contratos `sep-api`):
> 1. **Ancoragem de rotas**: a area `Administracao` ja existe (`/app/admin`, `roleGuard ['ADMIN']`, com `users` + `users/:id`) e o sidenav ja tem o item `Administracao -> /app/admin/users`. Decisao: governanca **aninha em `/app/admin/*`**, sem criar grupo `/app/governanca` paralelo nem novo item de sidenav `Governanca`.
> 2. **Selecao do usuario-alvo (roles)**: ja resolvida. `UsuariosService.listar()` + `users-list.component` + `user-detail.component` (`buscarPorId`) existem. Roles cumulativas (F-12.3) **reusam `/app/admin/users/:id`** (estende `user-detail`); nao ha campo de `id`/busca inventado nem gap de listagem.
> 3. **DTOs**: a secao "DTOs esperados" abaixo foi corrigida para os DTOs reais (F-12.1 ja os usa). Diferencas vs. o texto original: `principal` (nao `rolePrincipal`), sem `usuarioId`; parametro tem `id`/`ativo`/`dataModificacao` (nao `status`); detalhe e aninhado `{ parametro, historico }`; versao usa `atorId`/`dataCriacao` (`valorAnterior` nullable); body do PATCH e `novoValor` (nao `valor`).
> 4. **Sidenav sem aninhamento**: `MenuItem` e flat (`label/route/roles`, sem `children`). "sub-item de Administracao" exige decidir entre landing `/app/admin` com cards ou itens irmaos flat — ver F-12.2.
> 5. **`roleGuard` checa a role principal** (`user.role`), nao o conjunto cumulativo. Para governanca `ADMIN`-only e suficiente (precedencia faz `principal=ADMIN`). Anotado; nao bloqueia.

**Objetivo geral**: implementar no `sep-app` as telas administrativas de governanca (Epic 11 + Epic 13), consumindo os endpoints reais do modulo de governanca do `sep-api` (Sprint 18 - RBAC cumulativo e parametros operacionais, mergeada): gestao de roles cumulativas por usuario, catalogo de parametros operacionais versionados com historico, e leitura administrativa do historico disponivel. Operacoes sensiveis (alterar roles, alterar parametro) passam por step-up reusando o mecanismo existente, sem duplicar autorizacao, regras de precedencia de role, validacao de tipo de parametro, versionamento ou auditoria no frontend.

**Esforco total estimado**: 4-6 dias de Dev Pleno Frontend.

**Repo de destino**:
- `sep-app`: Angular web, repo de codigo alterado nesta sprint.
- `docs-SEP`: documentacao editada no working tree quando necessario; operacao git continua manual.

**Branch sugerida**:
- `feature/fsprint-12-governanca-web`

**Pre-requisitos globais**:
- `sep-app/develop` atualizado apos a ultima F-Sprint web mergeada.
- F-Sprints web anteriores concluidas: shell autenticado, `roleGuard` com `data.roles`, `StepUpTokenStore` + `stepUpInterceptor`, tela `/app/step-up?next=...`, MSW, Vitest, New Design System Web (F-Sprint 14 mergeada) e area `Administracao` no sidenav restrita a `ADMIN`.
- `sep-api/develop` ou `main` com Sprint backend 18 mergeada (modulo `governanca` + roles cumulativas completos).
- Backend local disponivel em `http://localhost:8080` quando for validar smoke real.
- Docs de referencia: `docs-sep/SEGURANCA.md` (§6 step-up, §12 componentes web, §17 RBAC cumulativo e parametros), `specs/fase-3/018-sprint-18-governanca-rbac-parametros.md`, `steps-fase-3/backend/018-sprint-18-steps.md`, `docs-sep/New Design System Sep.md`, `repos/sep-app/DESIGN-SYSTEM.md`, `docs-sep/WEB-SCREENS-PLAN.md`.

**Modelo de acesso desta jornada (decisao de arquitetura)**:
- Todos os endpoints de governanca (roles e parametros), inclusive os de leitura, usam `hasRole('ADMIN')` no backend (`SEGURANCA.md` §17). Logo a area web inteira e `ADMIN`-only; `FINANCEIRO`/`BACKOFFICE`/`CLIENTE` nao acessam governanca.
- A real autorizacao e validada no backend. O `roleGuard` web (`data.roles: ['ADMIN']`) e UX/defesa-em-profundidade; nao substitui a checagem server-side.
- Mutacoes de roles (`PUT`/`POST`/`DELETE`) e de parametro (`PATCH`) exigem step-up. O `stepUpInterceptor` deve anexar `X-Step-Up-Token`; sem token, o backend responde `403` e o fluxo redireciona para `/app/step-up?next=<rota-atual>`. Componente/service nunca enviam o token manualmente.
- Regras de auto-protecao do backend que a UI deve respeitar: um `ADMIN` nao pode alterar as proprias roles (`403`); a ultima role de um usuario nao pode ser removida (`400`). A UI nao reimplementa essas regras; previne o obvio (auto-edicao) e trata o erro retornado.

**Contratos backend consumidos** (Sprint 18; persona executora = `ADMIN` autenticado com MFA ativo):

Roles cumulativas (`/api/v1/usuarios`):
- `GET /api/v1/usuarios/{id}/roles` -> conjunto de roles + role principal. `ADMIN`.
- `PUT /api/v1/usuarios/{id}/roles` body com conjunto nao vazio -> substitui o conjunto. `ADMIN` + `@RequireStepUp`.
- `POST /api/v1/usuarios/{id}/roles/{role}` body vazio -> adiciona role. `ADMIN` + `@RequireStepUp`.
- `DELETE /api/v1/usuarios/{id}/roles/{role}` -> remove role (nunca a ultima). `ADMIN` + `@RequireStepUp`.
- Endpoint legado `POST /api/v1/usuarios/{id}/role` (substitui o conjunto pela role unica) **nao** e usado por esta jornada; preferir os endpoints cumulativos.

Parametros operacionais (`/api/v1/governanca/parametros`):
- `GET /api/v1/governanca/parametros` -> lista de parametros. `ADMIN`.
- `GET /api/v1/governanca/parametros/{chave}` -> detalhe + historico de versoes. `ADMIN`.
- `PATCH /api/v1/governanca/parametros/{chave}` body com novo valor + justificativa -> altera valor (validado pelo tipo). `ADMIN` + `@RequireStepUp`.

**Selecao do usuario-alvo (roles)** (resolvido na F-12.0):
- As operacoes de roles agem sobre `{id}` de um usuario. A area `Administracao` ja oferece a selecao: `/app/admin/users` (lista via `UsuariosService.listar()`) e `/app/admin/users/:id` (detalhe via `buscarPorId`). A gestao de roles **reusa o detalhe `/app/admin/users/:id`**, estendendo `user-detail.component` com a secao de roles. Nao inventar campo de `id`/busca nem endpoint de listagem novo.

**DTOs reais do frontend** (confirmados contra os DTOs do backend na F-12.0; ja materializados em `src/app/core/api/api.models.ts` pela F-12.1):
- `UsuarioRolesResponse` (espelha `RolesResponseDto`): `roles` (`UsuarioRole[]`), `principal` (`UsuarioRole`). O DTO real **nao** expoe `usuarioId` nem `username`; nao inventar dado pessoal.
- `SubstituirRolesRequest` (body do `PUT`): `roles` (`UsuarioRole[]`, nao vazio).
- `ParametroOperacional` (item de `GET .../parametros` e retorno do `PATCH`): `id` (`string`), `chave`, `tipo` (`TipoParametro`), `valor` (`string`), `descricao`, `ativo` (`boolean`), `versao` (`number`), `dataModificacao` (`string` ISO).
- `ParametroComHistorico` (detalhe `GET .../parametros/{chave}`): aninhado `{ parametro: ParametroOperacional, historico: VersaoParametro[] }`.
- `VersaoParametro`: `versao` (`number`), `valorAnterior` (`string | null` — nulo na versao inicial), `valorNovo` (`string`), `atorId` (`string`), `justificativa` (`string`), `dataCriacao` (`string` ISO).
- `AlterarParametroRequest` (body do `PATCH`, espelha `AlterarParametroRequest`): `novoValor` (`string`), `justificativa` (`string`). Ambos `@NotBlank`, `@Size(max=500)`.

> O `valor` do parametro e textual tipado: trafega como `string` na borda; a interpretacao por `tipo` (`INTEGER`/`DECIMAL`/`BOOLEAN`/`STRING`) e responsabilidade de helper/componente de apresentacao, nao do modelo de borda. Onde a doc operacional nao especifica um campo, conferir o controller/DTO do backend e nao inventar conveniencia visual.

**Enums esperados**:
- `Role`: `ADMIN`, `FINANCEIRO`, `BACKOFFICE`, `CLIENTE` (precedencia `ADMIN > FINANCEIRO > BACKOFFICE > CLIENTE` resolvida no backend; a UI nao recalcula precedencia).
- `TipoParametro`: `INTEGER`, `DECIMAL`, `BOOLEAN`, `STRING`.

**Parametros operacionais conhecidos (seed Sprint 18, V43)** — para fixtures e copy, nao para hardcode de regra:
- `credito.valor.maximo.pf`, `credito.valor.maximo.pj`
- `credito.prazo.maximo.pf.meses`, `credito.prazo.maximo.pj.meses`
- `credito.score.pre-aprovacao`
- `credito.open-finance.bonus.entradas.altas`, `credito.open-finance.bonus.entradas.minimas`
- `credito.open-finance.penalidade.saldo.negativo`
- `backoffice.proposta.pendente.horas`, `backoffice.contrato.aceito.horas`, `backoffice.webhook.pendente.horas`

**Codigos de retorno por operacao** (confirmar os codigos de erro exatos na Task F-12.0; nao inventar codigos de dominio):
- Roles: `200` (consulta/sucesso), `403` (sem `ADMIN`, sem step-up, ou auto-edicao do proprio admin), `400` (remocao da ultima role), `404` (usuario inexistente).
- Parametros: `200` (consulta/sucesso), `403` (sem `ADMIN` ou sem step-up), `404` (chave inexistente), `400`/`422` (valor invalido para o tipo ou justificativa ausente — confirmar qual codigo o backend usa).

**Decisoes da sprint**:
- O frontend apresenta e edita roles e parametros; precedencia de role, regras de auto-protecao, versionamento, validacao de tipo/faixa e auditoria pertencem ao backend.
- Area `ADMIN`-only para toda a governanca, inclusive leitura, espelhando o contrato real do backend (`SEGURANCA.md` §17). A spec menciona "roles internas", mas os endpoints da Sprint 18 sao `hasRole('ADMIN')`; a UI segue o backend.
- Step-up e reusado, nao recriado. `PUT`/`POST`/`DELETE` de roles e `PATCH` de parametro sao adicionados ao `stepUpInterceptor`; reads nunca consomem token.
- Roles cumulativas: a UI edita o **conjunto** de roles. Preferir `PUT` (substituir conjunto) como operacao principal de edicao; `POST`/`DELETE` de role individual sao atalhos opcionais. Nao usar o endpoint legado de role unica.
- Justificativa de alteracao de parametro pode conter informacao operacional sensivel. Nao persistir em `localStorage`/`sessionStorage`; manter apenas estado de formulario em memoria.
- Valor do parametro fica como `string` tipada na borda; formulario adapta o input ao `tipo`, mas nao reimplementa validacao de faixa de negocio (deixa o backend validar e trata o erro).

**Gaps e pendencias registradas (decisao de produto)**:
- **Historico/auditoria de roles nao tem endpoint de leitura na Sprint 18.** As alteracoes de roles geram o evento `USUARIO_ROLES_ALTERADAS` em `audit_log_seguranca`, mas o backend nao expoe leitura web dessa trilha. Portanto a Task F-12.5 ("historico/auditoria administrativa") fica escopada ao **historico de versoes de parametro** (`GET /governanca/parametros/{chave}`), que e o unico historico legivel disponivel. Exibir trilha de auditoria de roles na web exigiria novo endpoint backend e fica **fora do escopo desta sprint** — registrar como follow-up; nao inventar endpoint nem simular trilha no frontend.
- A DoD da spec 112 ("historico fica legivel para auditoria") e atendida pelo historico de parametros; o limite acima deve ser comunicado ao usuario/reviewer antes do fechamento.

**Fora de escopo da sprint**:
- Governanca mobile.
- SSO corporativo, ABAC completo, BI externo, WebAuthn/Passkeys.
- Endpoint/trilha web de auditoria de alteracao de roles (sem read endpoint no backend Sprint 18).
- Criar/remover parametros operacionais pela UI (Sprint 18 expoe apenas listar/detalhar/alterar valor).
- Reimplementar precedencia de role, validacao de tipo/faixa, versionamento ou auditoria no frontend.
- Endpoint legado `POST /usuarios/{id}/role` de role unica.
- Expor dados pessoais, secrets, tokens ou payload sensivel em responses de governanca alem do necessario.

**Protocolo obrigatorio por Task**:
- Implementar somente a Task liberada pelo usuario.
- Ao concluir implementacao e verificacao da Task, parar em checkpoint pre-commit com arquivos alterados, testes executados, riscos e sugestao de commit.
- Aguardar `commit` ou aprovacao equivalente antes de stage/commit.
- Usar `git add <paths-especificos>`, nunca `git add -A`.
- Fazer um code review da Task quando solicitado pelo usuario; se houver hotfix, implementar em novo checkpoint.
- Ao final da Task, pausar para review manual do usuario. Nao iniciar a proxima Task sem ordem explicita.

**Skills obrigatorias na implementacao**:
- `coding-guidelines`: pensar antes, simplicidade, mudancas cirurgicas, execucao orientada a meta.
- `clean-code`: nomes intencionais, componentes pequenos, sem comentarios ruidosos, testes F.I.R.S.T.
- `clean-architecture`: componentes chamam services; regra de governanca fica no backend; modelos TypeScript sao DTOs de borda, nao entidades de dominio duplicadas.

---

## Mapeamento spec 112 -> steps (rastreabilidade)

| Task da spec 112 | Onde e implementada nestes steps |
|------------------|----------------------------------|
| 1. `GovernancaService` e modelos de roles/parametros/auditoria | F-12.1 |
| 2. Gestao de roles cumulativas | F-12.3 |
| 3. Parametros operacionais | F-12.4 |
| 4. Historico/auditoria administrativa | F-12.5 (escopado ao historico de parametros; gap de auditoria de roles registrado) |
| 5. Integrar step-up e testes de autorizacao | distribuido em F-12.3 e F-12.4 (extensao do `stepUpInterceptor`) e consolidado em F-12.6 (regressao de autorizacao + smoke) |
| Gate: precheck backend Sprint 18 | F-12.0 |
| Gate: rotas/menu/guard | F-12.2 |
| Gate: smoke E2E, docs, roadmap | F-12.6 |

---

## Protocolo de breakpoints recomendado

```text
C1 = F-12.0 + F-12.1
Prechecks + modelos/GovernancaService/MSW base

C2 = F-12.2
Rotas, menu (Governanca sob Administracao), shell e guard (ADMIN)

C3 = F-12.3
Gestao de roles cumulativas (consultar + mutacoes) com step-up

C4 = F-12.4
Parametros operacionais (lista, detalhe + historico, alterar) com step-up

C5 = F-12.5
Historico/auditoria administrativa (historico de parametro legivel)

C6 = F-12.6
Smoke, autorizacao E2E, docs e fechamento
```

- C1 fecha contrato antes de UI.
- C2 abre navegacao `ADMIN`-only, sem fluxo parcial escondido.
- C3 isola a edicao de roles e seu step-up.
- C4 isola a edicao de parametros e seu step-up.
- C5 entrega leitura de historico de parametro para auditoria.
- C6 fecha validacao final, regressao de autorizacao e documentacao.

---

## Task F-12.0 - Prechecks da F-Sprint 12

**Objetivo**: confirmar base Git, scripts, contratos backend do modulo de governanca (Sprint 18) e a arquitetura atual do `sep-app` (role guard, step-up, area `Administracao`, selecao de usuario).

**Esforco**: 1-2 horas.

### Step 112.0.1 - Conferir estado Git do `sep-app`

**Comandos**:
```bash
cd <sep-app-root>
git fetch --all --prune
git status --short --branch
git rev-list --left-right --count HEAD...origin/develop
git log --oneline -10 origin/develop
```

**Verificacao**:
- Branch local alinhada a `origin/develop`.
- Working tree limpo ou alteracoes locais identificadas como do usuario.
- Ultima F-Sprint web presente no historico.

### Step 112.0.2 - Criar branch da sprint

**Comandos**:
```bash
cd <sep-app-root>
git switch develop
git pull --ff-only
git switch -c feature/fsprint-12-governanca-web
```

**Verificacao**:
- Branch criada a partir de `develop` atualizado.
- Se `git pull --ff-only` falhar, abortar e avisar o usuario.

### Step 112.0.3 - Mapear estrutura atual do frontend

**Comandos**:
```bash
cd <sep-app-root>
find src/app/core -maxdepth 3 -type f | sort
find src/app/features/authenticated -maxdepth 5 -type f | sort
find src/app/layout -maxdepth 3 -type f | sort
find src/mocks -maxdepth 3 -type f | sort
sed -n '1,420p' src/app/core/api/api.models.ts
sed -n '1,260p' src/app/features/authenticated/authenticated.routes.ts
sed -n '1,220p' src/app/layout/sidenav/sidenav.component.ts
sed -n '1,160p' src/app/core/interceptors/step-up.interceptor.ts
grep -R "roleGuard\\|UsuarioRole\\|ADMIN\\|Administracao" -n src/app src/mocks
grep -R "StepUp\\|X-Step-Up-Token\\|step-up" -n src/app src/mocks
grep -R "admin/usuarios\\|usuarios\\b" -n src/app src/mocks
```

**Verificacao**:
- `roleGuard` aceita `data.roles: ['ADMIN']` sem cast ou `any`.
- `stepUpInterceptor`, `StepUpTokenStore` e a tela `/app/step-up?next=...` localizados; entender o padrao de matching de URL atual antes de estende-lo.
- Area `Administracao` (item de sidenav `ADMIN`-only) e suas rotas localizadas; decidir se governanca vira sub-area de `Administracao` ou grupo proprio `/app/governanca`.
- Mecanismo existente de listagem/selecao de usuarios (para a tela de criacao de usuario interno) localizado; definir como selecionar o usuario-alvo das roles. Se nao houver listagem, registrar o gap e escopar entrada por `id`/busca.
- MSW disponivel para `dev-offline`; usuario `ADMIN` mock identificado.

### Step 112.0.4 - Confirmar contratos reais do backend

**Comandos**:
```bash
cd <sep-api-root>
grep -R "usuarios/{id}/roles\\|/roles\\|class.*UsuarioRoleController\\|class.*UsuarioController" -n src/main/java
grep -R "class.*GovernancaParametroController\\|governanca/parametros" -n src/main/java
find src/main/java -path "*governanca/web*" -type f | sort
sed -n '1,260p' src/main/java/com/dynamis/sep_api/governanca/web/controller/*Controller.java
find src/main/java -path "*governanca/web/dto*" -type f | sort
grep -R "RequireStepUp\\|hasRole" -n src/main/java/com/dynamis/sep_api/governanca src/main/java/com/dynamis/sep_api/usuarios
grep -R "TipoParametro\\|INTEGER\\|DECIMAL\\|BOOLEAN\\|STRING" -n src/main/java/com/dynamis/sep_api/governanca
grep -R "ultima role\\|propria\\|self\\|403\\|400" -n src/main/java/com/dynamis/sep_api/usuarios
```

**Verificacao**:
- Endpoints, metodos, status HTTP e DTOs batem com a secao "Contratos backend consumidos".
- `PUT`/`POST`/`DELETE` de roles e `PATCH` de parametro usam `@RequireStepUp`; reads nao.
- Todos os endpoints de governanca usam `hasRole('ADMIN')`, inclusive os de leitura.
- Codigos exatos de `403` (auto-edicao), `400` (ultima role) e `400`/`422` (valor invalido / justificativa) confirmados.
- Campos e nullability dos DTOs de roles e parametros registrados para fixar os modelos TypeScript sem `any`.

### Step 112.0.5 - Rodar baseline web

**Comandos**:
```bash
cd <sep-app-root>
npm run test -- --run
npm run lint -- --quiet
npm run lint:scss
npm run build
```

**Verificacao**:
- Suite passa antes de alteracao funcional.
- Warnings preexistentes registrados sem tratar como falha se ja eram conhecidos.

### Definicao de pronto da Task F-12.0
- [ ] Branch correta criada.
- [ ] Baseline web verde com contagem registrada.
- [ ] Contratos backend de roles e parametros confirmados (endpoints, step-up, codigos de erro).
- [ ] Modelo de acesso `ADMIN`-only confirmado.
- [ ] Mecanismo de selecao do usuario-alvo definido (reuso ou gap por `id`/busca).
- [ ] Gap de auditoria de roles (sem read endpoint) confirmado e registrado.

---

## Task F-12.1 - GovernancaService, modelos e MSW base

**Objetivo**: criar a borda de API da feature governanca sem UI complexa, com modelos TypeScript fieis aos DTOs backend e mocks suficientes para desenvolvimento offline.

**Pre-requisito**: Task F-12.0 concluida.

**Esforco**: 1 dia.

### Step 112.1.1 - Criar modelos de governanca

**Arquivos provaveis**:
- `src/app/core/api/api.models.ts`
- ou arquivo local seguindo padrao existente, se o projeto separar modelos por feature.

**Implementacao**:
- Reusar a union `Role` existente (`ADMIN`/`FINANCEIRO`/`BACKOFFICE`/`CLIENTE`); criar somente se ainda nao existir.
- Adicionar union `TipoParametro` (`INTEGER`/`DECIMAL`/`BOOLEAN`/`STRING`).
- Adicionar interfaces para `UsuarioRolesResponse`, `SubstituirRolesRequest`, `ParametroOperacionalResponse`, `ParametroOperacionalDetalheResponse`, `VersaoParametroResponse` e `AlterarParametroRequest`.
- Datas ficam como `string` ISO na borda; formatacao pertence a componente/helper.
- `valor`/`valorAnterior`/`valorNovo` de parametro ficam como `string`; a tipagem por `TipoParametro` e tratada na apresentacao.

**Verificacao**:
- Nenhum modelo cria metodo calculado para precedencia de role, validacao de tipo ou permissao de edicao.
- Campos opcionais refletem nullable real do backend, nao conveniencia visual.

### Step 112.1.2 - Criar `GovernancaService`

**Arquivos provaveis**:
- `src/app/core/governanca/governanca.service.ts`
- `src/app/core/governanca/governanca.service.spec.ts`

**Metodos minimos**:
- `consultarRoles(usuarioId)`.
- `substituirRoles(usuarioId, request)`.
- `adicionarRole(usuarioId, role)`.
- `removerRole(usuarioId, role)`.
- `listarParametros()`.
- `consultarParametro(chave)`.
- `alterarParametro(chave, request)`.

**Regras de implementacao**:
- Usar `HttpClient` e configuracao de base URL ja existente.
- Operacoes com step-up seguem o padrao existente do `StepUpTokenStore` + `stepUpInterceptor`; o service nao recebe token como parametro.
- Nao chamar endpoint de governanca diretamente a partir de componente.
- `removerRole`/`adicionarRole` usam `{role}` no path, sem body; `substituirRoles` envia `{ roles }`.
- Nao expor metodo para o endpoint legado de role unica.

**Verificacao**:
- Specs validam URL, metodo HTTP e body esperado de cada operacao.
- Specs validam que as mutacoes (`PUT`/`POST`/`DELETE` roles, `PATCH` parametro) falham com `403` no MSW sem `X-Step-Up-Token`.
- Nenhum service calcula precedencia de role nem valida tipo de parametro localmente.

### Step 112.1.3 - Adicionar fixtures MSW de governanca

**Arquivos provaveis**:
- `src/mocks/handlers.ts`
- `src/mocks/data/governanca.mock.ts` ou padrao equivalente.

**Cenarios minimos**:
- Usuario `admin@empresa.com` com role `ADMIN` no login mock (`senha 123456`), com MFA ativo (pre-condicao de step-up).
- Usuarios-alvo de exemplo: um `CLIENTE`, um `FINANCEIRO`, um `FINANCEIRO + BACKOFFICE` (multi-role) e o proprio admin (para o cenario de auto-edicao).
- `GET /usuarios/{id}/roles` retornando conjunto + principal coerentes.
- `PUT /usuarios/{id}/roles` exigindo `X-Step-Up-Token`; `403` sem token; `403` quando o alvo for o proprio admin; `200` no caminho feliz.
- `POST /usuarios/{id}/roles/{role}` e `DELETE /usuarios/{id}/roles/{role}` exigindo step-up; `DELETE` retornando `400` ao remover a ultima role; `404` para usuario inexistente.
- `GET /governanca/parametros` com os parametros do seed (varios tipos).
- `GET /governanca/parametros/{chave}` com detalhe + `historico` de pelo menos duas versoes.
- `PATCH /governanca/parametros/{chave}` exigindo `X-Step-Up-Token`; `200` no caminho feliz incrementando versao e anexando entrada de historico; `400`/`422` para valor incompativel com o tipo ou justificativa ausente; `404` para chave inexistente.
- `CLIENTE`/`FINANCEIRO`/`BACKOFFICE` recebem `403` nas rotas de governanca quando o mock depender do usuario atual.

**Verificacao**:
- MSW nao mascara a exigencia de step-up nem as regras de auto-protecao (auto-edicao `403`, ultima role `400`).
- Fixture nao armazena secrets, tokens, dados pessoais sensiveis ou payload bruto.

### Step 112.1.4 - Testar service e mocks

**Comandos**:
```bash
cd <sep-app-root>
npm run test -- --run governanca
npm run lint -- --quiet
npm run lint:scss
```

**Verificacao**:
- `GovernancaService` coberto.
- Tipos compilaram sem `any` desnecessario.

### Step 112.1.5 - Checkpoint C1

**Entregaveis**:
- Modelos de governanca.
- `GovernancaService`.
- MSW base.
- Specs do service.

**Pausa obrigatoria**:
- Review da Task F-12.1 antes de criar telas.

---

## Task F-12.2 - Rotas, menu, shell e guard

**Objetivo**: tornar a governanca acessivel no shell autenticado apenas para `ADMIN`, sob a area `Administracao`, sem expor a feature a roles internas ou `CLIENTE`.

**Pre-requisito**: Task F-12.1 concluida.

**Esforco**: 0,5-1 dia.

### Step 112.2.1 - Criar feature e rotas de governanca

**Decisao de ancoragem**: governanca **aninha na area `Administracao` existente** (`/app/admin`, ja `roleGuard ['ADMIN']`), em vez de um grupo `/app/governanca` paralelo. Roles cumulativas reusam o detalhe de usuario; parametros ganham rotas sob `/app/admin`.

**Arquivos provaveis**:
- `src/app/features/authenticated/authenticated.routes.ts` (estender o filho `admin`, ja existente).
- `src/app/features/authenticated/admin/admin-home.component.ts` (NOVO — landing com cards `Usuarios`, `Parametros`; o redirect atual `'' -> users` vira esta landing).
- `src/app/features/authenticated/admin/parametros/` (telas de parametros — F-12.4).
- `.html` e `.scss` correspondentes.

**Rotas (sob o grupo `admin` existente, todas herdam `roleGuard ['ADMIN']`)**:
- `/app/admin` -> landing com cards (`Usuarios`, `Parametros`).
- `/app/admin/users`, `/app/admin/users/:id` -> ja existem; `:id` recebe a secao de roles em F-12.3.
- `/app/admin/parametros` -> lista (F-12.4).
- `/app/admin/parametros/:chave` -> detalhe + historico (F-12.4).

**Implementacao**:
- Estender os `children` do path `admin` em `authenticated.routes.ts`; nao criar grupo `/app/governanca` nem segundo `roleGuard`.
- Trocar o `{ path: '', redirectTo: 'users' }` por uma landing `admin-home` com cards navegaveis; manter breadcrumb `Administracao`.
- Usar lazy loading (`loadComponent`) nas telas novas, no mesmo padrao das demais.
- Habilitar cada card apenas na Task que entregar a tela (Parametros em F-12.4); ate la o card fica desabilitado, nunca apontando para rota inexistente. Roles nao tem rota propria — entram no detalhe de usuario (F-12.3).

**Verificacao**:
- `CLIENTE`, `FINANCEIRO` e `BACKOFFICE` recebem `/access-denied` em `/app/admin/**`.
- `ADMIN` acessa a landing e as rotas filhas.
- Nenhuma rota administrativa nova fica fora do `roleGuard` herdado do grupo `admin`.

### Step 112.2.2 - Adicionar menu no sidenav

**Arquivos provaveis**:
- `src/app/layout/sidenav/sidenav.component.ts`
- `src/app/layout/sidenav/sidenav.component.spec.ts`

**Implementacao**:
- O sidenav ja tem `Administracao -> /app/admin/users` (`roles: ['ADMIN']`). Repontar para a landing `Administracao -> /app/admin` (que expoe `Usuarios` e `Parametros` como cards). `MenuItem` e flat (sem `children`); **nao** adicionar um item separado `Governanca` — a navegacao para roles/parametros ocorre dentro da area `Administracao`.
- Manter os demais itens com suas restricoes atuais.

**Verificacao**:
- `ADMIN` ve `Administracao` e, dentro dela, alcanca `Usuarios` e `Parametros`.
- `FINANCEIRO`/`BACKOFFICE`/`CLIENTE` nao veem `Administracao`.

### Step 112.2.3 - Criar landing `Administracao` (`admin-home`)

**Implementacao**:
- Landing em `/app/admin` com cards para `Usuarios` (rota existente) e `Parametros` (habilitado em F-12.4; desabilitado ate la).
- Cards/links navegaveis conforme o estado de cada Task; sem placeholder sem rota quando o fluxo ja esta nesta sprint.
- Conteudo denso, administrativo, coerente com New Design System SEP (superficie autenticada).
- Gestao de roles nao tem card proprio: e alcancada via `Usuarios -> detalhe do usuario` (F-12.3).

**Verificacao**:
- Todos os links habilitados apontam para rotas existentes.
- Landing e ferramenta operacional, sem texto educativo longo.

### Step 112.2.4 - Checkpoint C2

**Entregaveis**:
- Rotas protegidas por `roleGuard` (`ADMIN`).
- Sidenav atualizado.
- Shell navegavel.
- Specs de guard/menu/shell.

**Pausa obrigatoria**:
- Review da Task F-12.2 antes de implementar gestao de roles.

---

## Task F-12.3 - Gestao de roles cumulativas

**Objetivo**: permitir que o `ADMIN` consulte e edite o conjunto de roles de um usuario, respeitando step-up e as regras de auto-protecao validadas no backend.

**Pre-requisito**: Task F-12.2 concluida.

**Esforco**: 1-1,5 dia.

### Step 112.3.1 - Criar pagina de gestao de roles

**Arquivos provaveis**:
- `src/app/features/authenticated/admin/users/user-detail.component.ts` (estender o detalhe existente com a secao de roles).
- `.html`, `.scss` e `.spec.ts` correspondentes.
- Opcional: componente apresentacional de edicao de roles em `admin/users/` se a secao crescer.

**Implementacao**:
- O usuario-alvo e o `:id` ja aberto em `/app/admin/users/:id` (selecionado via lista `/app/admin/users`). Nao criar pagina de roles separada nem entrada por `id`/busca.
- Carregar `GET /usuarios/{id}/roles` (via `GovernancaService.consultarRoles`) e exibir o conjunto de roles + a role principal (somente apresentacao; a precedencia vem do backend).
- Editar o conjunto:
  - operacao principal: `PUT /usuarios/{id}/roles` com o conjunto selecionado (nao vazio);
  - atalhos opcionais: `POST .../roles/{role}` e `DELETE .../roles/{role}`.
- Mostrar `FINANCEIRO + BACKOFFICE` como combinacao valida.
- Prevenir o obvio: desabilitar a edicao das proprias roles do admin logado (auto-edicao retorna `403`); nao oferecer remover a ultima role.

**Verificacao**:
- Conjunto vazio bloqueia o submit do `PUT` no frontend.
- A UI nao recalcula a role principal; apresenta a retornada.
- Auto-edicao bloqueada antes do request quando o alvo e o proprio usuario.

### Step 112.3.2 - Tratar step-up e erros de roles

**Implementacao**:
- Sem token step-up, `403` redireciona para `/app/step-up?next=<rota-atual>` pelo padrao existente; com step-up valido, o `stepUpInterceptor` anexa `X-Step-Up-Token`.
- Tratar erros de dominio com mensagem clara:
  - `403`: sem permissao, sem step-up, ou tentativa de auto-edicao;
  - `400`: tentativa de remover a ultima role do usuario;
  - `404`: usuario nao encontrado.
- Apos sucesso, recarregar o conjunto de roles do usuario.

**Verificacao**:
- Duplo clique nao dispara duas mutacoes simultaneas.
- `400` de ultima role e `403` de auto-edicao mostram mensagem coerente sem reabilitar a acao indevidamente.

### Step 112.3.3 - Estender step-up para mutacoes de roles

**Arquivos provaveis**:
- `src/app/core/interceptors/step-up.interceptor.ts`
- `src/app/core/interceptors/step-up.interceptor.spec.ts`

**Implementacao**:
- Anexar token apenas em:
  - `PUT /usuarios/{id}/roles`;
  - `POST /usuarios/{id}/roles/{role}`;
  - `DELETE /usuarios/{id}/roles/{role}`.
- `GET /usuarios/{id}/roles` nunca consome token.

**Verificacao**:
- `step-up.interceptor.spec.ts` cobre as tres URLs de mutacao e confirma que o `GET` nao recebe header.
- O matching distingue `{id}` e `{role}` no path sem casar reads por engano.

### Step 112.3.4 - Testar gestao de roles

**Cenarios minimos**:
- Consulta exibe conjunto + principal do MSW.
- `PUT` com step-up substitui o conjunto e recarrega.
- `PUT` sem step-up redireciona para confirmacao adicional.
- `FINANCEIRO + BACKOFFICE` representavel e enviavel.
- Remover ultima role retorna `400` tratado.
- Auto-edicao do proprio admin bloqueada/`403` tratado.

### Step 112.3.5 - Checkpoint C3

**Entregaveis**:
- Pagina de gestao de roles.
- Step-up interceptor estendido para roles.
- Specs das operacoes de roles.

**Pausa obrigatoria**:
- Review da Task F-12.3 antes de implementar parametros.

---

## Task F-12.4 - Parametros operacionais

**Objetivo**: permitir que o `ADMIN` liste parametros, veja detalhe com historico de versoes e altere o valor com justificativa, respeitando step-up e validacao de tipo do backend.

**Pre-requisito**: Task F-12.3 concluida.

**Esforco**: 1-1,5 dia.

### Step 112.4.1 - Criar lista de parametros

**Arquivos provaveis**:
- `src/app/features/authenticated/admin/parametros/parametros-page.component.ts`
- `.html`, `.scss` e `.spec.ts`.

**Implementacao**:
- Consumir `GET /governanca/parametros`.
- Listar `chave`, `tipo`, `valor` atual, `descricao` e `versao`, com link para detalhe `/app/governanca/parametros/:chave`.
- Se o backend nao paginar, consumir a lista como retornada; nao criar paginacao/cache local artificial.

**Verificacao**:
- Lista mostra os parametros do seed com tipos variados.
- Valor exibido respeita o `tipo` (ex: `BOOLEAN` legivel; `DECIMAL` formatado) sem alterar o dado de borda.

### Step 112.4.2 - Criar detalhe + historico de parametro

**Arquivos provaveis**:
- `src/app/features/authenticated/admin/parametros/parametro-detail-page.component.ts`
- `.html`, `.scss` e `.spec.ts`.

**Implementacao**:
- Consumir `GET /governanca/parametros/{chave}`.
- Exibir o parametro e o `historico` de versoes: `versao`, `valorAnterior`, `valorNovo`, `justificativa`, `ator` e `dataAlteracao`, do mais recente para o mais antigo.
- `404` vira estado "parametro nao encontrado".

**Verificacao**:
- Historico legivel para auditoria (atende a DoD da spec 112 no escopo de parametros).
- A UI nao reordena/recalcula versoes; apresenta o que o backend retorna.

### Step 112.4.3 - Implementar alterar valor com step-up

**Implementacao**:
- Form de alteracao com `valor` (input adaptado ao `tipo`: numero para `INTEGER`/`DECIMAL`, toggle para `BOOLEAN`, texto para `STRING`) e `justificativa` obrigatoria.
- Chamar `PATCH /governanca/parametros/{chave}`.
- Desabilitar o submit durante o envio.
- Sem token step-up, `403` redireciona para `/app/step-up?next=<rota-atual>`; com step-up valido, o `stepUpInterceptor` anexa `X-Step-Up-Token`.
- Tratar erros:
  - `400`/`422`: valor incompativel com o tipo ou justificativa ausente -> mensagem clara, sem perder o que o usuario digitou;
  - `403`: sem permissao ou sem step-up;
  - `404`: chave inexistente.
- Apos `200`, recarregar detalhe e historico (nova versao deve aparecer).
- Nao reimplementar validacao de faixa de negocio; o input adapta ao tipo, o backend valida e a UI trata o erro.

**Verificacao**:
- Justificativa vazia bloqueada no frontend; `400`/`422` do backend tambem tratado.
- Nova versao aparece no historico apos sucesso.
- Justificativa nao e persistida em storage.

### Step 112.4.4 - Estender step-up para alteracao de parametro

**Arquivos provaveis**:
- `src/app/core/interceptors/step-up.interceptor.ts`
- `src/app/core/interceptors/step-up.interceptor.spec.ts`

**Implementacao**:
- Anexar token apenas em `PATCH /governanca/parametros/{chave}`.
- `GET /governanca/parametros` e `GET /governanca/parametros/{chave}` nunca consomem token.

**Verificacao**:
- `step-up.interceptor.spec.ts` cobre o `PATCH` e confirma que os `GET` de parametros nao recebem header.

### Step 112.4.5 - Testar parametros

**Cenarios minimos**:
- Lista carrega parametros do MSW.
- Detalhe mostra historico de versoes.
- `PATCH` com step-up altera valor, incrementa versao e atualiza historico.
- `PATCH` sem step-up redireciona para confirmacao adicional.
- Valor invalido para o tipo retorna `400`/`422` tratado.
- Justificativa ausente bloqueada/tratada.
- `404` de chave inexistente tratado.

### Step 112.4.6 - Checkpoint C4

**Entregaveis**:
- Lista, detalhe + historico e alteracao de parametro.
- Step-up interceptor estendido para `PATCH` parametro.
- Specs principais.

**Pausa obrigatoria**:
- Review da Task F-12.4 antes de consolidar historico/auditoria.

---

## Task F-12.5 - Historico/auditoria administrativa

**Objetivo**: consolidar a leitura administrativa do historico disponivel, garantindo que a trilha de alteracao de parametros fique legivel para auditoria, e registrar com clareza o limite atual da auditoria de roles.

**Pre-requisito**: Task F-12.4 concluida.

**Esforco**: 0,5 dia.

### Step 112.5.1 - Consolidar historico de parametros para auditoria

**Implementacao**:
- Reforcar a apresentacao do historico de versoes do parametro (ja carregado em F-12.4) como visao auditavel: ordem cronologica clara, identificacao do `ator`, `justificativa` e `data` de cada alteracao.
- Garantir que valores anterior/novo sejam comparaveis na UI (ex: destaque de mudanca), sem recalcular nada.
- Nao buscar dado pessoal do ator alem do que o DTO real expoe.

**Verificacao**:
- A trilha de alteracoes de parametro e legivel e atribuivel (quem, quando, de que valor para qual, por que).
- Nenhum dado sensivel alem do necessario e exibido.

### Step 112.5.2 - Registrar o gap de auditoria de roles

**Implementacao**:
- Na secao de roles do detalhe de usuario (`/app/admin/users/:id`), deixar explicito (texto curto/estado) que a alteracao de roles e auditada no backend, mas a trilha detalhada de roles nao e exibida na web nesta versao.
- Nao simular trilha de auditoria de roles no frontend nem inferir historico a partir do estado atual.
- Registrar o gap na doc operacional (F-12.6) e como follow-up: leitura web da auditoria de roles depende de novo endpoint backend.

**Verificacao**:
- A UI nao promete trilha de roles que o backend nao expoe.
- O gap esta documentado para o reviewer.

### Step 112.5.3 - Checkpoint C5

**Entregaveis**:
- Historico de parametro consolidado como visao auditavel.
- Gap de auditoria de roles comunicado na UI e registrado.
- Specs de apresentacao do historico.

**Pausa obrigatoria**:
- Review da Task F-12.5 antes do fechamento.

---

## Task F-12.6 - Smoke, autorizacao, docs e fechamento

**Objetivo**: consolidar validacao da sprint, cobrir regressao de autorizacao/step-up, atualizar documentacao operacional e preparar fechamento.

**Pre-requisito**: Tasks F-12.1 a F-12.5 concluidas.

**Esforco**: 0,5-1 dia.

### Step 112.6.1 - Rodar validacoes finais

**Comandos**:
```bash
cd <sep-app-root>
npm run test -- --run
npm run lint -- --quiet
npm run lint:scss
npm run build
```

**Verificacao**:
- Suite completa verde.
- Warnings conhecidos registrados.

### Step 112.6.2 - Regressao de autorizacao e step-up

**Cenarios minimos**:
- `ADMIN` acessa `/app/governanca`; `FINANCEIRO`, `BACKOFFICE` e `CLIENTE` recebem `/access-denied`.
- `Governanca` aparece no sidenav apenas para `ADMIN`.
- Toda mutacao (`PUT`/`POST`/`DELETE` roles, `PATCH` parametro) sem step-up redireciona para `/app/step-up`; com step-up, envia `X-Step-Up-Token` uma unica vez.
- Reads de roles e parametros nunca consomem token step-up.

**Verificacao**:
- `step-up.interceptor.spec.ts` cobre as quatro URLs sensiveis e nenhum `GET`.
- `roleGuard`/sidenav specs cobrem a visibilidade `ADMIN`-only.

### Step 112.6.3 - Smoke manual dev-offline

**Roteiro**:
1. Login `admin@empresa.com` / `123456` (MFA ativo).
2. Abrir `/app/governanca`.
3. Gestao de roles: consultar um usuario, adicionar/remover/substituir roles com step-up; confirmar `FINANCEIRO + BACKOFFICE`.
4. Confirmar bloqueio de auto-edicao e de remocao da ultima role.
5. Parametros: listar, abrir detalhe com historico.
6. Alterar um parametro com justificativa e step-up; ver nova versao no historico.
7. Confirmar que role nao-`ADMIN` nao ve o menu nem acessa as rotas.

**Verificacao**:
- Fluxo nao quebra o shell autenticado.
- Estados de erro (`400`/`403`/`404`/`422`) aparecem na UI.
- Step-up consome token apenas uma vez por operacao.

### Step 112.6.4 - Smoke contra backend real

**Pre-requisitos**:
- `sep-api` rodando em `http://localhost:8080` com Sprint 18 mergeada.
- Usuario `ADMIN` com MFA ativo (step-up estrito exige operador com MFA).
- Pelo menos um usuario-alvo distinto do admin para editar roles.

**Roteiro minimo**:
- `GET /usuarios/{id}/roles`.
- `PUT /usuarios/{id}/roles` (ambiente apropriado) com step-up.
- `GET /governanca/parametros` e `GET /governanca/parametros/{chave}`.
- `PATCH /governanca/parametros/{chave}` (ambiente apropriado) com step-up e justificativa.

**Verificacao**:
- DTOs reais batem com os modelos TypeScript.
- Erros `400/403/404/422` sao tratados.
- Evitar alterar massa compartilhada sensivel sem aprovacao.

### Step 112.6.5 - Atualizar docs operacionais

**Arquivos provaveis**:
- `docs-SEP/repos/sep-app/README.md`
- `docs-SEP/docs-sep/WEB-SCREENS-PLAN.md`, se as telas novas precisarem constar no mapa.
- `docs-SEP/steps-fase-3/README.md`, adicionando a linha da F-Sprint 12.
- `docs-SEP/AI-ROADMAP.md`, registrando o step 112 e as telas/rotas de governanca quando aplicavel.
- `docs-SEP/repos/sep-app/SPRINT-F-12-PR.md` no fim da sprint, conforme regra fixa do `AGENT.md`.

**Implementacao**:
- Registrar telas de governanca, modelo de acesso `ADMIN`-only, comandos de validacao e o gap de auditoria de roles aceito.
- Se criar `SPRINT-F-12-PR.md`, manter como artefato temporario e nao linkar permanentemente em PRD/CONTEXT/roadmap.

### Step 112.6.6 - Definition of Done da sprint

**Checklist**:
- [ ] `GovernancaService` e modelos alinhados ao backend (Sprint 18).
- [ ] Rotas/menu/guard `ADMIN`-only; roles internas e `CLIENTE` sem acesso.
- [ ] Gestao de roles cumulativas (consultar/substituir/adicionar/remover) com step-up.
- [ ] `FINANCEIRO + BACKOFFICE` representavel na UI.
- [ ] Auto-edicao do proprio admin e remocao da ultima role tratadas (`403`/`400`).
- [ ] Parametros: lista, detalhe + historico e alteracao com justificativa e step-up.
- [ ] Historico de parametro legivel para auditoria.
- [ ] Gap de auditoria de roles comunicado na UI e documentado.
- [ ] Step-up reusa o mecanismo existente; reads nao consomem token.
- [ ] UI segue New Design System SEP.
- [ ] Nenhum secret, token ou dado pessoal desnecessario exposto.
- [ ] MSW e specs cobrem principais fluxos e erros.
- [ ] Suite completa, lint, SCSS e build verdes.
- [ ] Docs atualizados.

### Step 112.6.7 - Checkpoint C6

**Entregaveis**:
- Sprint validada.
- Regressao de autorizacao/step-up verde.
- Docs atualizados.
- PR description temporaria, se aplicavel.

**Pausa obrigatoria**:
- Review final manual antes de iniciar a proxima F-Sprint.

---

## Definition of Done da F-Sprint 12

- [ ] Alteracoes sensiveis (roles e parametros) usam step-up, reusando `StepUpTokenStore` + `stepUpInterceptor`.
- [ ] A UI nao permite operacao sem role adequada: governanca e `ADMIN`-only em rota, menu e guard, com a autorizacao real no backend.
- [ ] Roles cumulativas editaveis (incl. `FINANCEIRO + BACKOFFICE`), respeitando auto-protecao do backend (`403` auto-edicao, `400` ultima role).
- [ ] Parametros operacionais versionados com historico legivel para auditoria.
- [ ] Limite de auditoria de roles (sem read endpoint na Sprint 18) registrado como gap/follow-up, sem simulacao no frontend.
- [ ] UI segue o New Design System SEP (superficie autenticada).
- [ ] Regra de negocio (precedencia, validacao de tipo, versionamento, auditoria) permanece no backend; modelos TypeScript sao DTOs de borda.
- [ ] Testes proporcionais, lint, SCSS e build verdes.
- [ ] Documentacao operacional e roadmap atualizados.
