# Steps - F-Sprint 11 - Jornada Credora Web

**Spec de origem**: [`specs/fase-3/111-fsprint-11-credora-web.md`](../../specs/fase-3/111-fsprint-11-credora-web.md)

**Status**: planejada.

**Objetivo geral**: implementar no `sep-app` a jornada web da empresa credora (Epic 10 + Epic 13), consumindo os endpoints reais do modulo `credores` do `sep-api` (Sprint 16 foundation + Sprint 17 oportunidades/carteira): cadastro da credora a partir de onboarding PJ aprovado, perfil e elegibilidade derivada do KYB/PLD, dashboard da credora, lista e detalhe de oportunidades, manifestacao/cancelamento de interesse e carteira de operacoes financiadas, sem duplicar elegibilidade, ownership, regras de interesse, associacao de carteira, auditoria ou logica de provider no frontend.

**Esforco total estimado**: 5-7 dias de Dev Pleno Frontend.

**Repo de destino**:
- `sep-app`: Angular web, repo de codigo alterado nesta sprint.
- `docs-SEP`: documentacao editada no working tree quando necessario; operacao git continua manual.

**Branch sugerida**:
- `feature/fsprint-11-credora-web`

**Pre-requisitos globais**:
- `sep-app/develop` atualizado apos F-Sprint 10.
- F-Sprints 0-10 concluidas: shell autenticado Notion, guards, interceptors, MSW, Vitest, New Design System Web (F-Sprint 14 mergeada), shell operacional backoffice/financeiro.
- `sep-api/develop` ou `main` com Sprints backend 16 e 17 mergeadas (modulo `credores` completo).
- Backend local disponivel em `http://localhost:8080` quando for validar smoke real.
- Docs de referencia: `repos/sep-api/CREDORES.md`, `repos/sep-api/ONBOARDING.md`, `docs-sep/WEB-SCREENS-PLAN.md`, `docs-sep/New Design System Sep.md`, `repos/sep-app/DESIGN-SYSTEM.md`, `docs-sep/SEGURANCA.md`.

**Modelo de acesso desta jornada (decisao de arquitetura)**:
- Nao existe role dedicada `CREDORA`. A hierarquia de roles e `ADMIN > FINANCEIRO > BACKOFFICE > CLIENTE` (ver `docs-sep/SEGURANCA.md`).
- Os endpoints da credora usam `isAuthenticated()`; a autorizacao real e por **ownership** (a credora vinculada ao usuario autenticado) e por **elegibilidade** (`ATIVA` + `ELEGIVEL`), validados no backend.
- Logo o acesso web e governado por: usuario autenticado **+ presenca de credora**. `GET /api/v1/credores/me` retorna `404` quando o usuario ainda nao tem credora; nesse estado a UI conduz ao cadastro a partir de um onboarding PJ aprovado, sem simular elegibilidade.
- Endpoints administrativos do modulo (`GET /credores/{id}`, `POST /credores/oportunidades/sync`, `POST /credores/carteira/operacoes`) **nao** pertencem a esta jornada web da credora; sao operacao admin/assistida e ficam fora de escopo desta sprint.

**Contratos backend consumidos** (`/api/v1/credores`, persona credora = usuario autenticado dono da credora):

Foundation (Sprint 16):
- `POST /api/v1/credores` body `CadastrarCredoraRequest` -> `201 EmpresaCredoraResponse`. Erros: `404` onboarding ausente; `422 CRD-422-001` solicitacao nao-empresa ou KYB incompleto; `403 CRD-403-001` onboarding de outro usuario; `409 CRD-409-001` credora ja existente para usuario/onboarding/cnpj.
- `GET /api/v1/credores/me` -> `200 EmpresaCredoraResponse` / `404` quando nao ha credora para o usuario.
- `GET /api/v1/credores/me/elegibilidade` -> `200 ElegibilidadeCredoraResponse` / `404`.

Oportunidades e carteira (Sprint 17):
- `GET /api/v1/credores/oportunidades` -> lista de `OportunidadeResponse` (oportunidades `DISPONIVEL` da credora).
- `GET /api/v1/credores/oportunidades/{id}` -> `OportunidadeResponse`.
- `POST /api/v1/credores/oportunidades/{id}/interesses` body vazio -> `201 InteresseResponse`. Exige credora `ATIVA`+`ELEGIVEL` (`422`) e oportunidade `DISPONIVEL`; `409` para interesse ativo duplicado.
- `DELETE /api/v1/credores/oportunidades/{id}/interesses/me` -> `204`. Cancelamento idempotente por ownership.
- `GET /api/v1/credores/carteira` -> lista de `OperacaoFinanciadaResponse`.
- `GET /api/v1/credores/carteira/{id}` -> `OperacaoFinanciadaDetalheResponse`, por ownership; `404` para operacao de outra credora.

**DTOs esperados no frontend**:
- `CadastrarCredoraRequest`: `onboardingId`, `tipoCredora` (`TipoCredora`), `capacidadeAporte` (opcional, `number`).
- `EmpresaCredoraResponse`: `id`, `onboardingId`, `cnpj` (ja formatado `00.000.000/0000-00`), `razaoSocial`, `status` (`StatusCredora`), `elegibilidade` (`StatusElegibilidade`), `motivoInelegibilidade` (opcional), `tipoCredora` (`TipoCredora`), `capacidadeAporte` (opcional), `dataCadastro`.
- `ElegibilidadeCredoraResponse`: `elegibilidade` (`StatusElegibilidade`), `motivoInelegibilidade` (opcional), `status` (`StatusCredora`).
- `OportunidadeResponse`: `id`, `propostaId`, `contratoId` (opcional), `valor` (`number`), `prazoMeses` (`number`), `taxaJurosMensal` (`number`), `status` (`StatusOportunidade`). Se o backend expuser estado de interesse por item (ex: `possuiInteresseAtivo`), refletir o campo real; nao inferir interesse no frontend.
- `InteresseResponse`: `id`, `oportunidadeId`, `status` (`StatusInteresseCredora`), `dataCriacao`.
- `OperacaoFinanciadaResponse`: `id`, `contratoId`, `status` (`StatusOperacaoFinanciada`), `valor` (`number`), `dataAssociacao`.
- `OperacaoFinanciadaDetalheResponse`: campos de `OperacaoFinanciadaResponse` + `justificativa`, snapshot da oportunidade de origem, `contrato` (`ContratoCarteiraView`: `statusContratual` como `string`) e `cobranca` (`CarteiraCobrancaResumo`: agregado de parcelas e recebimentos, sem dado sensivel do tomador).

> Campos exatos e nullability devem ser confirmados contra os DTOs reais em `credores.web.dto` na Task F-11.0 antes de fixar os modelos TypeScript. Onde a doc operacional nao especifica um campo, conferir o controller/DTO do backend e nao inventar conveniencia visual.

**Enums esperados**:
- `StatusCredora`: `CADASTRADA`, `ATIVA`, `SUSPENSA`.
- `StatusElegibilidade`: `PENDENTE`, `ELEGIVEL`, `INELEGIVEL`.
- `TipoCredora`: `EMPRESA`, `INSTITUICAO_FINANCEIRA`.
- `StatusOportunidade`: `DISPONIVEL`, `ENCERRADA`.
- `StatusInteresseCredora`: `ATIVO`, `CANCELADO`.
- `StatusOperacaoFinanciada`: `ASSOCIADA`, `ENCERRADA`.

**Codigos de erro de dominio**:
- `CRD-422-001`: solicitacao de onboarding nao e empresa, ou KYB incompleto (CNPJ ausente).
- `CRD-403-001`: onboarding pertence a outro usuario (ownership).
- `CRD-409-001`: credora ja cadastrada para usuario/onboarding/cnpj.

**Decisoes da sprint**:
- Frontend apresenta perfil, elegibilidade, oportunidades, interesse e carteira; derivacao de elegibilidade, regras de interesse (credora elegivel/oportunidade disponivel/unicidade), associacao de carteira, ownership e auditoria pertencem ao backend.
- Acesso por autenticacao + presenca de credora; sem role `CREDORA`. A UI nao recalcula elegibilidade nem habilita acao de interesse para credora nao elegivel; respeita o estado retornado pelo backend e trata `422`.
- Nenhuma operacao desta jornada da credora exige step-up. Step-up so existe no fluxo admin de associacao de carteira (`POST /credores/carteira/operacoes`), que esta fora de escopo desta sprint. Nao alterar `step-up.interceptor.ts` nesta sprint.
- Carteira nasce por associacao operacional assistida (admin); interesse **nao** vira carteira automaticamente. A UI nao deve sugerir que manifestar interesse gera aporte, alocacao ou operacao financiada.
- Lista de oportunidades e carteira usam dados do backend. Se o backend nao paginar essas listas na Sprint 17, nao criar paginacao/cache local artificial; consumir a lista como retornada e registrar como gap se o volume exigir paginacao futura.
- Valores monetarios e taxas ficam como `number` apenas para exibicao; formatacao em helper/componente, nao no modelo de borda.

**Fora de escopo da sprint**:
- Aporte financeiro real, Pix, escrow externo, matching automatico ou marketplace.
- Operacao admin do modulo credores: sincronizar oportunidades, associar operacao de carteira, consulta administrativa `GET /credores/{id}`.
- Credora mobile.
- Recalcular elegibilidade, KYB/PLD ou status contratual no frontend.
- Expor CNPJ completo nao mascarado quando o backend mascarar, dados bancarios, chave Pix, payload de provider ou dado sensivel do tomador na carteira.

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
- `clean-architecture`: componentes chamam services; regra de negocio fica no backend; modelos TypeScript sao DTOs de borda, nao entidades de dominio duplicadas.

---

## Protocolo de breakpoints recomendado

```text
C1 = F-11.0 + F-11.1
Prechecks + modelos/CredoraService/MSW base

C2 = F-11.2
Rotas, menu, shell e guard (auth + presenca de credora)

C3 = F-11.3
Cadastro a partir de onboarding PJ, perfil e elegibilidade

C4 = F-11.4
Oportunidades: lista e detalhe

C5 = F-11.5
Interesse: manifestar e cancelar

C6 = F-11.6
Carteira: lista e detalhe de operacao financiada

C7 = F-11.7
Smoke, docs e fechamento
```

- C1 fecha contrato antes de UI.
- C2 abre navegacao governada por autenticacao + presenca de credora, sem fluxo parcial escondido.
- C3 entrega entrada da jornada (cadastro/perfil/elegibilidade) sem oportunidades.
- C4 entrega leitura de oportunidades sem acao.
- C5 isola a acao de interesse e seu cancelamento.
- C6 entrega acompanhamento de carteira.
- C7 fecha validacao final e documentacao.

---

## Task F-11.0 - Prechecks da F-Sprint 11

**Objetivo**: confirmar base Git, scripts, contratos backend do modulo `credores` e arquitetura atual do `sep-app`.

**Esforco**: 1-2 horas.

### Step 111.0.1 - Conferir estado Git do `sep-app`

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
- F-Sprint 10 presente no historico.

### Step 111.0.2 - Criar branch da sprint

**Comandos**:
```bash
cd <sep-app-root>
git switch develop
git pull --ff-only
git switch -c feature/fsprint-11-credora-web
```

**Verificacao**:
- Branch criada a partir de `develop` atualizado.
- Se `git pull --ff-only` falhar, abortar e avisar o usuario.

### Step 111.0.3 - Mapear estrutura atual do frontend

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
grep -R "authGuard\\|roleGuard\\|UsuarioRole\\|CLIENTE" -n src/app src/mocks
grep -R "onboarding\\|Onboarding" -n src/app src/mocks
```

**Verificacao**:
- Shell autenticado Notion e sidenav localizados.
- Guard de autenticacao (`authGuard`) localizado; confirmar que nao existe role `CREDORA` e que a jornada sera gated por autenticacao + presenca de credora.
- Padrao de feature autenticada existente (ex: backoffice da F-Sprint 10) identificado como referencia de estrutura.
- Fluxo/estado de onboarding PJ no web localizado, pois o cadastro da credora parte de um onboarding aprovado.
- MSW disponivel para `dev-offline`.

### Step 111.0.4 - Confirmar contratos reais do backend

**Comandos**:
```bash
cd <sep-api-root>
grep -R "class.*CredoraController\\|class.*CredoresController" -n src/main/java
find src/main/java -path "*credores/web*" -type f | sort
sed -n '1,260p' src/main/java/com/dynamis/sep_api/credores/web/controller/*Controller.java
find src/main/java -path "*credores/web/dto*" -type f | sort
grep -R "StatusCredora\\|StatusElegibilidade\\|TipoCredora\\|StatusOportunidade\\|StatusInteresseCredora\\|StatusOperacaoFinanciada" -n src/main/java/com/dynamis/sep_api/credores
grep -R "CRD-422-001\\|CRD-403-001\\|CRD-409-001\\|@RequireStepUp\\|isAuthenticated\\|hasRole" -n src/main/java/com/dynamis/sep_api/credores
```

**Verificacao**:
- Endpoints, metodos, status HTTP e DTOs batem com a secao "Contratos backend consumidos".
- Confirmar que os endpoints da persona credora usam `isAuthenticated()` e que apenas `GET /{id}`, `oportunidades/sync` e `carteira/operacoes` exigem `hasRole('ADMIN')` (o ultimo tambem `@RequireStepUp`).
- Nenhum endpoint da jornada credora (cadastro/me/elegibilidade/oportunidades/interesse/carteira) exige step-up.
- Campos e nullability dos DTOs registrados para fixar os modelos TypeScript sem `any`.

### Step 111.0.5 - Rodar baseline web

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

### Definicao de pronto da Task F-11.0
- [ ] Branch correta criada.
- [ ] Baseline web verde com contagem registrada.
- [ ] Contratos backend do modulo `credores` confirmados.
- [ ] Modelo de acesso (auth + presenca de credora, sem role `CREDORA`) confirmado.
- [ ] Gaps reais registrados antes de iniciar UI.

---

## Task F-11.1 - CredoraService, modelos e MSW base

**Objetivo**: criar a borda de API da feature credora sem UI complexa, com modelos TypeScript fieis aos DTOs backend e mocks suficientes para desenvolvimento offline.

**Pre-requisito**: Task F-11.0 concluida.

**Esforco**: 1 dia.

### Step 111.1.1 - Criar modelos de credora

**Arquivos provaveis**:
- `src/app/core/api/api.models.ts`
- ou arquivo local seguindo padrao existente, se o projeto separar modelos por feature.

**Implementacao**:
- Adicionar unions para `StatusCredora`, `StatusElegibilidade`, `TipoCredora`, `StatusOportunidade`, `StatusInteresseCredora` e `StatusOperacaoFinanciada`.
- Adicionar interfaces para `CadastrarCredoraRequest`, `EmpresaCredoraResponse`, `ElegibilidadeCredoraResponse`, `OportunidadeResponse`, `InteresseResponse`, `OperacaoFinanciadaResponse` e `OperacaoFinanciadaDetalheResponse`.
- Modelar `ContratoCarteiraView` e `CarteiraCobrancaResumo` conforme os campos reais do detalhe de operacao.
- Datas ficam como `string` ISO na borda de API; formatacao pertence a componente/helper de apresentacao.
- Valores monetarios e taxas ficam como `number` apenas para exibicao.

**Verificacao**:
- Nenhum modelo cria metodo calculado para elegibilidade, status ou permissao de interesse.
- Campos opcionais refletem nullable real do backend (`capacidadeAporte`, `motivoInelegibilidade`, `contratoId`), nao conveniencia visual.

### Step 111.1.2 - Criar `CredoraService`

**Arquivos provaveis**:
- `src/app/core/credora/credora.service.ts`
- `src/app/core/credora/credora.service.spec.ts`

**Metodos minimos**:
- `cadastrarCredora(request)`.
- `consultarMinhaCredora()`.
- `consultarElegibilidade()`.
- `listarOportunidades()`.
- `consultarOportunidade(id)`.
- `registrarInteresse(oportunidadeId)`.
- `cancelarInteresse(oportunidadeId)`.
- `listarCarteira()`.
- `consultarOperacaoCarteira(id)`.

**Regras de implementacao**:
- Usar `HttpClient` e configuracao de base URL ja existente.
- Nenhum metodo recebe ou envia token de step-up; a jornada credora nao usa step-up.
- Nao chamar endpoint credora diretamente a partir de componente.
- `consultarMinhaCredora()` deve permitir ao consumidor distinguir `404` (sem credora) de erro real, para a UI rotear ao cadastro sem tratar `404` como falha.

**Verificacao**:
- Specs validam URL, metodo HTTP e body esperado de cada operacao.
- Specs validam que `DELETE .../interesses/me` retorna `204` e e idempotente.
- Nenhum service calcula elegibilidade nem deriva estado de interesse local.

### Step 111.1.3 - Adicionar fixtures MSW de credora

**Arquivos provaveis**:
- `src/mocks/handlers.ts`
- `src/mocks/data/credora.mock.ts` ou padrao equivalente.

**Cenarios minimos**:
- Usuario `credora@empresa.com` com role `CLIENTE` no login mock (`senha 123456`), associado a um onboarding PJ aprovado.
- `GET /credores/me` retornando credora `ATIVA`/`ELEGIVEL`; cenario alternativo com `404` (usuario sem credora) e cenario `CADASTRADA`/`INELEGIVEL` com `motivoInelegibilidade`.
- `GET /credores/me/elegibilidade` coerente com o estado da credora do mock.
- `POST /credores` cobrindo `201` feliz e os erros `404`, `422` (CRD-422-001), `403` (CRD-403-001) e `409` (CRD-409-001).
- `GET /credores/oportunidades` com itens `DISPONIVEL`; `GET /credores/oportunidades/{id}` com detalhe.
- `POST /credores/oportunidades/{id}/interesses` retornando `201`; `409` para interesse ativo duplicado; `422` quando a credora do mock for inelegivel.
- `DELETE /credores/oportunidades/{id}/interesses/me` retornando `204` (idempotente, inclusive sem interesse ativo).
- `GET /credores/carteira` com operacoes `ASSOCIADA`; `GET /credores/carteira/{id}` com detalhe enriquecido (contrato + resumo de cobranca) e `404` para operacao de outra credora.

**Verificacao**:
- MSW respeita ownership e elegibilidade (nao deixa credora inelegivel manifestar interesse com sucesso).
- Fixture nao armazena CNPJ completo nao mascarado, dados bancarios, chave Pix, payload de provider ou dado sensivel do tomador na carteira.

### Step 111.1.4 - Testar service e mocks

**Comandos**:
```bash
cd <sep-app-root>
npm run test -- --run credora
npm run lint -- --quiet
npm run lint:scss
```

**Verificacao**:
- `CredoraService` coberto.
- Tipos compilaram sem `any` desnecessario.

### Step 111.1.5 - Checkpoint C1

**Entregaveis**:
- Modelos de credora.
- `CredoraService`.
- MSW base.
- Specs do service.

**Pausa obrigatoria**:
- Review da Task F-11.1 antes de criar telas.

---

## Task F-11.2 - Rotas, menu, shell e guard

**Objetivo**: tornar a jornada credora acessivel no shell autenticado, governada por autenticacao + presenca de credora, sem expor a feature como se fosse role dedicada.

**Pre-requisito**: Task F-11.1 concluida.

**Esforco**: 0,5-1 dia.

### Step 111.2.1 - Criar feature e rotas de credora

**Arquivos provaveis**:
- `src/app/features/authenticated/credora/credora.routes.ts`
- `src/app/features/authenticated/credora/credora-shell.component.ts`
- `.html` e `.scss` correspondentes.
- `src/app/features/authenticated/authenticated.routes.ts`

**Rotas sugeridas**:
- `/app/credora`
- `/app/credora/cadastro`
- `/app/credora/perfil`
- `/app/credora/oportunidades`
- `/app/credora/oportunidades/:id`
- `/app/credora/carteira`
- `/app/credora/carteira/:id`

**Implementacao**:
- Criar route group `credora` protegido por `authGuard` (usuario autenticado). Nao usar role `CREDORA` (nao existe).
- Adicionar resolucao de presenca de credora: ao entrar na area, consultar `GET /credores/me`; quando `404`, rotear para `/app/credora/cadastro`; quando existir, liberar perfil/oportunidades/carteira.
- Rota default da area resolve entre cadastro (sem credora) e perfil/dashboard (com credora).
- Adicionar breadcrumbs coerentes.
- Usar lazy loading de componentes.

**Verificacao**:
- Usuario nao autenticado e barrado pelo `authGuard`.
- Usuario autenticado sem credora cai no cadastro, nao em tela quebrada por `404`.
- Nenhuma rota credora fica fora do `authGuard`.

### Step 111.2.2 - Adicionar menu no sidenav

**Arquivos provaveis**:
- `src/app/layout/sidenav/sidenav.component.ts`
- `src/app/layout/sidenav/sidenav.component.spec.ts`

**Implementacao**:
- Adicionar item `Credora` apontando para `/app/credora`, visivel para usuario autenticado tipo `CLIENTE` (persona da credora).
- Manter itens administrativos (`Administracao`, `Backoffice`) com suas restricoes atuais.

**Verificacao**:
- `CLIENTE` ve `Credora`.
- A visibilidade do item nao depende de role inexistente; a real gating de conteudo segue por presenca de credora no backend.

### Step 111.2.3 - Criar shell da credora

**Implementacao**:
- Shell com entradas para Perfil/Elegibilidade, Oportunidades e Carteira.
- Quando o usuario nao tem credora, o shell apresenta apenas o caminho de cadastro.
- Cards/links devem ser navegaveis; nao usar placeholder sem rota quando o fluxo ja esta nesta sprint.
- Conteudo coerente com New Design System SEP (superficie autenticada).

**Verificacao**:
- Todos os links apontam para rotas existentes.
- Sem credora, oportunidades/carteira nao aparecem como navegaveis.

### Step 111.2.4 - Checkpoint C2

**Entregaveis**:
- Rotas protegidas por `authGuard` + resolucao de presenca de credora.
- Sidenav atualizado.
- Shell navegavel.
- Specs de guard/menu/shell.

**Pausa obrigatoria**:
- Review da Task F-11.2 antes de implementar cadastro/perfil.

---

## Task F-11.3 - Cadastro, perfil e elegibilidade

**Objetivo**: permitir que o usuario com onboarding PJ aprovado cadastre sua credora e acompanhe perfil e elegibilidade derivada, sem recalcular elegibilidade no frontend.

**Pre-requisito**: Task F-11.2 concluida.

**Esforco**: 1-1,5 dia.

### Step 111.3.1 - Criar pagina de cadastro da credora

**Arquivos provaveis**:
- `src/app/features/authenticated/credora/pages/credora-cadastro-page.component.ts`
- `.html`, `.scss` e `.spec.ts`.

**Implementacao**:
- Form com `onboardingId` (selecao/confirmacao do onboarding PJ aprovado do usuario), `tipoCredora` (`EMPRESA` | `INSTITUICAO_FINANCEIRA`) e `capacidadeAporte` opcional.
- Chamar `POST /credores` e, no sucesso, rotear para perfil.
- Tratar os erros de dominio com mensagens claras:
  - `404`: onboarding nao encontrado;
  - `422 CRD-422-001`: onboarding nao e empresa ou KYB ainda incompleto;
  - `403 CRD-403-001`: onboarding pertence a outro usuario;
  - `409 CRD-409-001`: ja existe credora para este usuario/onboarding/CNPJ -> rotear para perfil existente.
- Nao simular aprovacao de onboarding nem elegibilidade no frontend.

**Verificacao**:
- Form bloqueia submit sem `onboardingId`/`tipoCredora`.
- `409` conduz ao perfil existente em vez de erro cego.
- Nenhuma logica de KYB/PLD e reimplementada no front.

### Step 111.3.2 - Criar pagina de perfil e elegibilidade

**Arquivos provaveis**:
- `src/app/features/authenticated/credora/pages/credora-perfil-page.component.ts`
- `.html`, `.scss` e `.spec.ts`.

**Implementacao**:
- Carregar `GET /credores/me` e `GET /credores/me/elegibilidade`.
- Exibir: `razaoSocial`, `cnpj` (como retornado/mascarado pelo backend), `tipoCredora`, `capacidadeAporte`, `status` (`StatusCredora`), `elegibilidade` (`StatusElegibilidade`) e `motivoInelegibilidade` quando houver.
- Apresentar de forma clara o estado: `CADASTRADA`/`PENDENTE` (aguardando), `ATIVA`/`ELEGIVEL` (apta a manifestar interesse), `INELEGIVEL` (com motivo) e `SUSPENSA`.
- Quando elegivel, oferecer navegacao para oportunidades; quando nao, explicar o estado sem prometer aporte.
- `404` em `/me` redireciona para cadastro.

**Verificacao**:
- UI nao deriva elegibilidade; apenas apresenta o que o backend informa.
- `INELEGIVEL` mostra `motivoInelegibilidade` e nao habilita acao de interesse.
- Falha de endpoint nao quebra o shell autenticado.

### Step 111.3.3 - Testar cadastro, perfil e elegibilidade

**Cenarios minimos**:
- Cadastro feliz roteia para perfil.
- Cada erro de dominio (`404`/`422`/`403`/`409`) mostra mensagem coerente; `409` vai ao perfil.
- Perfil `ATIVA`/`ELEGIVEL` oferece caminho para oportunidades.
- Perfil `INELEGIVEL` mostra motivo e nao oferece interesse.
- Usuario sem credora cai em cadastro a partir de `/me` `404`.

**Comandos**:
```bash
cd <sep-app-root>
npm run test -- --run credora-cadastro credora-perfil
```

### Step 111.3.4 - Checkpoint C3

**Entregaveis**:
- Cadastro da credora.
- Perfil e elegibilidade.
- Specs principais.

**Pausa obrigatoria**:
- Review da Task F-11.3 antes de implementar oportunidades.

---

## Task F-11.4 - Oportunidades: lista e detalhe

**Objetivo**: permitir que a credora veja oportunidades disponiveis e o detalhe de cada uma, sem acao de interesse ainda.

**Pre-requisito**: Task F-11.3 concluida.

**Esforco**: 1 dia.

### Step 111.4.1 - Criar lista de oportunidades

**Arquivos provaveis**:
- `src/app/features/authenticated/credora/pages/oportunidades-page.component.ts`
- `.html`, `.scss` e `.spec.ts`.

**Implementacao**:
- Consumir `GET /credores/oportunidades`.
- Listar `valor`, `prazoMeses`, `taxaJurosMensal`, `status` e link para detalhe `/app/credora/oportunidades/:id`.
- Apresentar apenas oportunidades `DISPONIVEL` como acionaveis; `ENCERRADA` em estado nao acionavel se aparecer.
- Se o backend nao paginar, consumir a lista como retornada; nao criar paginacao/cache local artificial.

**Verificacao**:
- Lista vazia mostra estado vazio claro.
- Nao expor `propostaId`/`contratoId` como dado de negocio sensivel alem do necessario para o detalhe.

### Step 111.4.2 - Criar detalhe de oportunidade

**Arquivos provaveis**:
- `src/app/features/authenticated/credora/pages/oportunidade-detail-page.component.ts`
- `.html`, `.scss` e `.spec.ts`.

**Implementacao**:
- Consumir `GET /credores/oportunidades/{id}`.
- Exibir os campos da oportunidade e o estado de interesse quando o backend expuser; caso contrario, o estado de interesse e resolvido na Task F-11.5.
- Reservar a area de acao de interesse para a Task F-11.5 (botao desabilitado/ausente nesta Task).
- `404` vira estado "oportunidade nao encontrada".

**Verificacao**:
- Detalhe carrega a partir da lista.
- `ENCERRADA` nao oferece acao.

### Step 111.4.3 - Testar oportunidades

**Cenarios minimos**:
- Lista carrega itens do MSW.
- Link abre detalhe.
- `404` tratado.
- Estado vazio tratado.

### Step 111.4.4 - Checkpoint C4

**Entregaveis**:
- Lista e detalhe de oportunidades.
- Specs principais.

**Pausa obrigatoria**:
- Review da Task F-11.4 antes de implementar interesse.

---

## Task F-11.5 - Interesse: manifestar e cancelar

**Objetivo**: permitir que a credora elegivel manifeste e cancele interesse em oportunidades, respeitando elegibilidade, disponibilidade e unicidade validadas no backend.

**Pre-requisito**: Task F-11.4 concluida.

**Esforco**: 1 dia.

### Step 111.5.1 - Implementar manifestar interesse

**Implementacao**:
- No detalhe da oportunidade, botao `Manifestar interesse` chama `POST /credores/oportunidades/{id}/interesses`.
- Habilitar a acao apenas quando a oportunidade for `DISPONIVEL` e a credora for `ATIVA`/`ELEGIVEL`; ainda assim tratar a resposta de erro do backend.
- Desabilitar botao durante envio.
- Apos `201`, atualizar estado de interesse e recarregar detalhe.
- Tratar erros:
  - `422`: credora inelegivel -> mensagem clara, sem reabilitar acao indevidamente;
  - `409`: ja existe interesse ativo -> refletir estado "interesse ja registrado";
  - `404`: oportunidade nao encontrada.

**Verificacao**:
- Duplo clique nao dispara duas tentativas simultaneas.
- Credora inelegivel nao consegue manifestar interesse no MSW.

### Step 111.5.2 - Implementar cancelar interesse

**Implementacao**:
- Botao `Cancelar interesse` chama `DELETE /credores/oportunidades/{id}/interesses/me`.
- Tratar `204` como sucesso, inclusive idempotente (sem interesse ativo).
- Apos sucesso, atualizar estado de interesse no detalhe.

**Verificacao**:
- Cancelamento idempotente nao quebra a UI.
- Estado de interesse reflete o resultado real apos a operacao.

### Step 111.5.3 - Deixar claro que interesse nao gera carteira

**Implementacao**:
- Texto/estado deve deixar explicito que manifestar interesse nao gera aporte, alocacao nem operacao de carteira; a carteira nasce por associacao assistida (admin), fora desta jornada.

**Verificacao**:
- UI nao promete aporte/alocacao automatica a partir do interesse.

### Step 111.5.4 - Testar interesse

**Cenarios minimos**:
- Manifestar interesse com credora elegivel retorna `201` e reflete estado.
- Credora inelegivel recebe `422` tratado.
- Interesse duplicado recebe `409` tratado.
- Cancelar interesse retorna `204` e atualiza estado.
- Cancelar sem interesse ativo (idempotente) nao quebra.

### Step 111.5.5 - Checkpoint C5

**Entregaveis**:
- Manifestar/cancelar interesse.
- Specs das operacoes de interesse.

**Pausa obrigatoria**:
- Review da Task F-11.5 antes de implementar carteira.

---

## Task F-11.6 - Carteira: lista e detalhe de operacao

**Objetivo**: permitir que a credora acompanhe sua carteira de operacoes financiadas e o detalhe enriquecido de cada operacao, por ownership.

**Pre-requisito**: Task F-11.5 concluida.

**Esforco**: 1 dia.

### Step 111.6.1 - Criar lista de carteira

**Arquivos provaveis**:
- `src/app/features/authenticated/credora/pages/carteira-page.component.ts`
- `.html`, `.scss` e `.spec.ts`.

**Implementacao**:
- Consumir `GET /credores/carteira`.
- Listar operacoes com `valor`, `status` (`ASSOCIADA` | `ENCERRADA`), `dataAssociacao` e link para detalhe.
- Estado vazio explicito quando a credora ainda nao tem operacoes (interesse nao gera carteira).
- Se o backend nao paginar, consumir a lista como retornada; sem cache/paginacao local artificial.

**Verificacao**:
- Carteira vazia mostra estado vazio que reforca que interesse nao vira carteira automaticamente.
- Lista nao expoe dado sensivel do tomador.

### Step 111.6.2 - Criar detalhe de operacao

**Arquivos provaveis**:
- `src/app/features/authenticated/credora/pages/operacao-carteira-detail-page.component.ts`
- `.html`, `.scss` e `.spec.ts`.

**Implementacao**:
- Consumir `GET /credores/carteira/{id}`.
- Exibir snapshot da oportunidade de origem, `justificativa`, `contrato` (`statusContratual`) e resumo de cobranca (`CarteiraCobrancaResumo`: agregados de parcelas e recebimentos).
- Apresentar apenas o agregado da cobranca; nao buscar parcelas individuais nem dado do tomador.
- `404` (operacao de outra credora ou inexistente) vira estado "operacao nao encontrada".

**Verificacao**:
- Ownership respeitado: `404` de operacao de outra credora e tratado como nao encontrado.
- Nenhum dado bancario, chave Pix ou dado sensivel do tomador e exibido.

### Step 111.6.3 - Testar carteira

**Cenarios minimos**:
- Lista carrega operacoes do MSW.
- Estado vazio tratado.
- Detalhe mostra contrato e resumo de cobranca.
- `404` por ownership tratado.

### Step 111.6.4 - Checkpoint C6

**Entregaveis**:
- Lista e detalhe de carteira.
- Specs principais.

**Pausa obrigatoria**:
- Review da Task F-11.6 antes de fechamento.

---

## Task F-11.7 - Smoke, docs e fechamento

**Objetivo**: consolidar validacao da sprint, atualizar documentacao operacional e preparar fechamento.

**Pre-requisito**: Tasks F-11.1 a F-11.6 concluidas.

**Esforco**: 0,5-1 dia.

### Step 111.7.1 - Rodar validacoes finais

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

### Step 111.7.2 - Smoke manual dev-offline

**Roteiro**:
1. Login `credora@empresa.com` / `123456`.
2. Abrir `/app/credora`.
3. Usuario sem credora: cadastrar a partir do onboarding PJ aprovado.
4. Ver perfil e elegibilidade.
5. Abrir oportunidades e um detalhe.
6. Manifestar interesse (credora elegivel) e depois cancelar.
7. Confirmar credora inelegivel sem acao de interesse (fixture alternativa).
8. Abrir carteira e um detalhe de operacao.
9. Confirmar que interesse nao criou operacao de carteira.

**Verificacao**:
- Fluxo nao quebra shell.
- Estados de erro (`422`/`409`/`404`) aparecem em UI.

### Step 111.7.3 - Smoke contra backend real

**Pre-requisitos**:
- `sep-api` rodando em `http://localhost:8080`.
- Usuario com onboarding PJ aprovado (para cadastro) e/ou credora ja cadastrada.
- Massa/seed com ao menos uma oportunidade disponivel; carteira pode exigir associacao assistida previa (admin), fora desta jornada.

**Roteiro minimo**:
- `GET /credores/me` e `GET /credores/me/elegibilidade`.
- `POST /credores` quando o usuario ainda nao tiver credora (ambiente apropriado).
- `GET /credores/oportunidades` e `GET /credores/oportunidades/{id}`.
- `POST /credores/oportunidades/{id}/interesses` e `DELETE .../interesses/me` em ambiente apropriado.
- `GET /credores/carteira` e `GET /credores/carteira/{id}` quando houver operacao associada.

**Verificacao**:
- DTOs reais batem com modelos TypeScript.
- Erros `403/404/409/422` sao tratados.

### Step 111.7.4 - Atualizar docs operacionais

**Arquivos provaveis**:
- `docs-SEP/repos/sep-app/README.md`
- `docs-SEP/docs-sep/WEB-SCREENS-PLAN.md`, se as telas novas precisarem constar no mapa.
- `docs-SEP/AI-ROADMAP.md`, registrando o step 111 e as telas/rotas credora quando aplicavel.
- `docs-SEP/repos/sep-app/SPRINT-F-11-PR.md` no fim da sprint, conforme regra fixa do `AGENT.md`.

**Implementacao**:
- Registrar telas da credora, modelo de acesso (auth + presenca de credora), comandos de validacao e gaps aceitos.
- Se criar `SPRINT-F-11-PR.md`, manter como artefato temporario e nao linkar permanentemente em PRD/CONTEXT/roadmap.

### Step 111.7.5 - Definition of Done da sprint

**Checklist**:
- [ ] `CredoraService` e modelos alinhados ao backend (Sprints 16-17).
- [ ] Rotas protegidas por `authGuard` + resolucao de presenca de credora; sem role `CREDORA` inventada.
- [ ] Cadastro a partir de onboarding PJ aprovado funcional, com erros de dominio tratados.
- [ ] Perfil e elegibilidade apresentados sem recalculo no frontend.
- [ ] Oportunidades com lista e detalhe.
- [ ] Interesse: manifestar e cancelar (idempotente), respeitando elegibilidade/disponibilidade/unicidade do backend.
- [ ] Carteira com lista e detalhe enriquecido, por ownership.
- [ ] UI segue New Design System SEP.
- [ ] Nenhum dado sensivel do tomador, bancario ou Pix exposto.
- [ ] MSW e specs cobrem principais fluxos e erros.
- [ ] Suite completa, lint, SCSS e build verdes.
- [ ] Docs atualizados.

### Step 111.7.6 - Checkpoint C7

**Entregaveis**:
- Sprint validada.
- Docs atualizados.
- PR description temporaria, se aplicavel.

**Pausa obrigatoria**:
- Review final manual antes de iniciar a proxima F-Sprint.
