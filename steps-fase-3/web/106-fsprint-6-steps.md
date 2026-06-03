# Steps - F-Sprint 6 - Onboarding Web PF/PJ

**Spec de origem**: [`specs/fase-3/106-fsprint-6-onboarding-web.md`](../../specs/fase-3/106-fsprint-6-onboarding-web.md)

**Status**: concluida e mergeada em `develop` em 2026-06-03 (PR #33, merge `ed14629`).

**Objetivo geral**: implementar no `sep-app` a jornada autenticada de onboarding PF/PJ consumindo os contratos reais de `sep-api` (`onboarding` Sprints 6-7), com UI Notion, sem duplicar regra KYC/KYB/PLD no frontend e preservando ownership/erros definidos pela API.

**Esforco total estimado**: 5-7 dias de Dev Pleno Frontend.

**Repo de destino**:
- `sep-app`: Angular web, unico repo de codigo alterado nesta sprint.
- `docs-SEP`: documentacao editada no working tree quando necessario; operacao git continua manual.

**Branch sugerida**:
- `feature/fsprint-6-onboarding-web`

**Pre-requisitos globais**:
- `sep-app/develop` atualizado apos F-Sprint 5.
- F-Sprints 0-5 concluidas: Angular standalone/signals, shell autenticado Notion, guards, interceptors, MSW, Vitest, Playwright, MFA/step-up/refresh e tratamento de erros.
- `sep-api/develop` ou `main` com Sprints backend 6-7 mergeadas: PF KYC, PJ KYB e PLD.
- Backend local disponivel em `http://localhost:8080` quando for validar smoke real.
- Docs de referencia: `repos/sep-api/ONBOARDING.md`, `repos/sep-api/PLD.md`, `docs-sep/WEB-SCREENS-PLAN.md`, `docs-sep/DESIGN-notion.md`, `docs-sep/SEGURANCA.md`.

**Contratos backend consumidos**:

PF (`/api/v1/onboarding/pessoa`):
- `POST /api/v1/onboarding/pessoa` body `{ cpf, nomeCompleto, dataNascimento }` -> `201 OnboardingResponse`.
- `POST /api/v1/onboarding/pessoa/{id}/documentos` multipart `tipo`, `arquivo` -> `204`.
- `POST /api/v1/onboarding/pessoa/{id}/verificar` -> `202`.
- `GET /api/v1/onboarding/pessoa/{id}` -> `StatusOnboardingResponse`.

PJ (`/api/v1/onboarding/empresa`):
- `POST /api/v1/onboarding/empresa` body `{ cnpj, razaoSocial, nomeFantasia, tipoSocietario, porte }` -> `201 EmpresaResponse`.
- `POST /api/v1/onboarding/empresa/{id}/documentos` multipart `tipo`, `arquivo` -> `204`.
- `POST /api/v1/onboarding/empresa/{id}/verificar` -> `202`.
- `GET /api/v1/onboarding/empresa/{id}` -> `StatusOnboardingEmpresaResponse`.
- `GET /api/v1/onboarding/empresa/{id}/representantes` -> `RepresentanteLegalResponse[]`.

**Decisoes da sprint**:
- Frontend orquestra telas e chamadas HTTP; status e decisoes KYC/KYB/PLD pertencem ao backend.
- Nao inferir aprovacao/reprovacao por documento, CPF/CNPJ, valor textual de erro ou dados de representante.
- Nao persistir documento em localStorage/sessionStorage; arquivo fica apenas em memoria do form ate upload.
- Nao exibir CPF completo de representante; usar somente `cpfMascarado` devolvido pela API.
- `CLIENTE` usa a jornada para seu proprio onboarding; `ADMIN` pode validar fluxos quando backend permitir ownership/admin. A tela nao deve criar bypass de role.
- `409` de CPF/CNPJ ativo deve virar estado de conflito orientado a acao, nao erro generico.

**Protocolo obrigatorio por Task**:
- Implementar somente a Task liberada pelo usuario.
- Ao concluir implementacao e verificacao da Task, parar em checkpoint pre-commit com arquivos alterados, testes executados, riscos e sugestao de commit.
- Aguardar `commit` ou aprovacao equivalente antes de stage/commit.
- Usar `git add <paths-especificos>`, nunca `git add -A`.
- Fazer code review da Task quando solicitado pelo usuario; se houver hotfix, implementar em novo checkpoint.
- Ao final da Task, pausar para review manual do usuario. Nao iniciar a proxima Task sem ordem explicita.

**Skills obrigatorias na implementacao**:
- `coding-guidelines`: pensar antes, simplicidade, mudancas cirurgicas, execucao orientada a meta.
- `clean-code`: nomes intencionais, componentes pequenos, sem comentarios ruidosos, testes F.I.R.S.T.
- `clean-architecture`: componentes chamam services; regra de negocio fica no backend; modelos TypeScript sao DTOs de borda, nao entidades de dominio duplicadas.

---

## Protocolo de breakpoints recomendado

```text
C1 = F-6.0 + F-6.1
Prechecks + modelos/OnboardingService/MSW base

C2 = F-6.2
Rotas, menu e shell da jornada

C3 = F-6.3
Fluxo PF completo

C4 = F-6.4
Fluxo PJ/KYB completo

C5 = F-6.5
Estados, erros e componentes reutilizaveis

C6 = F-6.6
MSW/Vitest/smoke/docs/validacao final
```

- C1 fecha contratos antes de UI.
- C2 abre navegacao sem fluxo parcial escondido.
- C3 e C4 podem evoluir em paralelo depois de C1/C2, mas devem compartilhar service/modelos.
- C5 consolida UX de estados e erros para nao duplicar template.
- C6 fecha verificacao e documentacao operacional.

---

## Task F-6.0 - Prechecks da F-Sprint 6

**Objetivo**: confirmar base Git, scripts, contratos backend e arquitetura atual do `sep-app`.

**Esforco**: 1-2 horas.

### Step 106.0.1 - Conferir estado Git do `sep-app`

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
- F-Sprint 5 presente no historico.

### Step 106.0.2 - Criar branch da sprint

**Comandos**:
```bash
cd <sep-app-root>
git switch develop
git pull --ff-only
git switch -c feature/fsprint-6-onboarding-web
```

**Verificacao**:
- Branch criada a partir de `develop` atualizado.
- Se `git pull --ff-only` falhar, abortar e avisar o usuario.

### Step 106.0.3 - Mapear estrutura atual do frontend

**Comandos**:
```bash
cd <sep-app-root>
find src/app/core -maxdepth 3 -type f | sort
find src/app/features/authenticated -maxdepth 4 -type f | sort
find src/app/layout -maxdepth 3 -type f | sort
find src/mocks -maxdepth 3 -type f | sort
sed -n '1,220p' src/app/core/api/api.models.ts
sed -n '1,220p' src/app/features/authenticated/authenticated.routes.ts
sed -n '1,220p' src/app/layout/sidenav/sidenav.component.ts
```

**Verificacao**:
- Shell Notion e rotas autenticadas existem.
- `AuthService`, interceptors e guards existem.
- MSW esta disponivel para `dev-offline`.
- Nao existe feature `onboarding` duplicada.

### Step 106.0.4 - Conferir contratos backend

**Comandos**:
```bash
cd <sep-api-root>
grep -R "class Onboarding.*Controller\|@RequestMapping(\"/api/v1/onboarding" -n src/main/java/com/dynamis/sep_api/onboarding/web/controller
grep -R "record .*Onboarding.*Response\|record .*Onboarding.*Request\|record RepresentanteLegalResponse" -n src/main/java/com/dynamis/sep_api/onboarding/web/dto
```

**Verificacao**:
- Endpoints PF e PJ confirmados.
- DTOs confirmados antes de criar modelos TypeScript.
- Tipos `TipoDocumento`, `StatusOnboarding`, `TipoSocietario` e `PorteEmpresa` confirmados no backend.

### Step 106.0.5 - Rodar baseline web

**Comandos**:
```bash
cd <sep-app-root>
npm run lint
npm run lint:scss
npm run test
npm run build
```

**Verificacao**:
- Suite passa antes de editar.
- Se falha for ambiental ou herdada, registrar evidencia antes de implementar.

### Definicao de pronto da Task F-6.0
- [ ] Branch correta criada.
- [ ] Contratos backend PF/PJ confirmados.
- [ ] Estrutura atual do `sep-app` mapeada.
- [ ] Baseline lint/scss/test/build executado e registrado.

---

## Task F-6.1 - Contratos TypeScript, OnboardingService e MSW base

**Objetivo**: criar a camada de contrato HTTP de onboarding, com tipos alinhados ao backend e MSW cobrindo cenarios basicos.

**Pre-requisito**: Task F-6.0 concluida.

**Esforco**: 0.5-1 dia.

**Arquivos principais esperados**:
- `src/app/core/api/api.models.ts`
- `src/app/core/onboarding/onboarding.service.ts`
- `src/app/core/onboarding/onboarding.service.spec.ts`
- `src/mocks/handlers.ts`
- `src/mocks/data/onboarding.mock.ts` ou equivalente, se o padrao local aceitar dados separados.

### Step 106.1.1 - Adicionar modelos TypeScript

**Modelos minimos**:
```ts
export type StatusOnboarding =
  | 'INICIADO'
  | 'DOCUMENTOS_RECEBIDOS'
  | 'EM_VERIFICACAO'
  | 'APROVADO'
  | 'APROVADO_FINAL'
  | 'REPROVADO'
  | 'REPROVADO_PLD'
  | 'PENDENCIA';

export type TipoDocumento = 'RG' | 'CNH' | 'CPF' | 'COMPROVANTE_ENDERECO' | 'CONTRATO_SOCIAL' | 'CCMEI';
export type TipoSocietario = 'MEI' | 'LTDA' | 'SA' | 'EIRELI' | 'OUTRO';
export type PorteEmpresa = 'MEI' | 'ME' | 'EPP' | 'MEDIO' | 'GRANDE';
export type StatusPldRepresentante = 'NAO_CONSULTADO' | 'EM_ANALISE' | 'LIMPO' | 'HIT' | 'ERRO';
```

**DTOs esperados**:
- `IniciarOnboardingPessoaRequest`
- `IniciarOnboardingEmpresaRequest`
- `OnboardingResponse`
- `StatusOnboardingResponse`
- `StatusOnboardingEmpresaResponse`
- `DocumentoEnviadoResponse`
- `RepresentanteLegalResponse`
- `ConsultaPldResumoResponse`

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint
```

### Step 106.1.2 - Criar `OnboardingService`

**Contrato do service**:
- `iniciarPessoa(request)`
- `enviarDocumentoPessoa(id, tipo, arquivo)`
- `verificarPessoa(id)`
- `consultarPessoa(id)`
- `iniciarEmpresa(request)`
- `enviarDocumentoEmpresa(id, tipo, arquivo)`
- `verificarEmpresa(id)`
- `consultarEmpresa(id)`
- `listarRepresentantesEmpresa(id)`

**Regras**:
- Usar `HttpClient`.
- Multipart via `FormData`, campos exatamente `tipo` e `arquivo`.
- Nao converter status em decisao de negocio; apenas propagar DTO para componentes.
- Nao armazenar arquivo em service.

**Verificacao**:
```bash
cd <sep-app-root>
npm run test -- --run
```

### Step 106.1.3 - Atualizar MSW

**Cenarios minimos**:
- PF: criar -> upload documento -> verificar -> consultar `APROVADO_FINAL`.
- PF: `409` CPF com onboarding ativo.
- PJ: criar -> upload contrato social -> verificar -> consultar com representantes mascarados.
- PJ: `400` documento invalido.
- `403` ownership em consulta/upload.

**Verificacao**:
```bash
cd <sep-app-root>
npm run test -- --run
```

### Definicao de pronto da Task F-6.1
- [ ] Modelos TypeScript alinhados ao backend.
- [ ] `OnboardingService` criado e testado.
- [ ] Multipart usa `tipo` e `arquivo`.
- [ ] MSW cobre PF/PJ sucesso e erros principais.
- [ ] Nenhum status KYC/KYB/PLD vira regra local no service.

---

## Task F-6.2 - Rotas, menu e shell da jornada onboarding

**Objetivo**: abrir a area autenticada de onboarding no shell Notion, com navegacao clara para PF e PJ.

**Pre-requisito**: Task F-6.1 concluida.

**Esforco**: 0.5 dia.

**Arquivos principais esperados**:
- `src/app/features/authenticated/authenticated.routes.ts`
- `src/app/layout/sidenav/sidenav.component.ts`
- `src/app/layout/sidenav/sidenav.component.html`
- `src/app/features/authenticated/onboarding/onboarding.routes.ts`
- `src/app/features/authenticated/onboarding/onboarding-home.component.ts`
- `src/app/features/authenticated/onboarding/onboarding-home.component.html`
- `src/app/features/authenticated/onboarding/onboarding-home.component.scss`
- testes correspondentes.

### Step 106.2.1 - Criar rotas lazy de onboarding

**Rotas sugeridas**:
```text
/app/onboarding
/app/onboarding/pessoa
/app/onboarding/pessoa/:id
/app/onboarding/empresa
/app/onboarding/empresa/:id
```

**Verificacao**:
```bash
cd <sep-app-root>
npm run lint
npm run test -- --run
```

### Step 106.2.2 - Adicionar entrada no sidenav

**Regras**:
- Entrada "Onboarding" visivel para `CLIENTE` e `ADMIN`.
- Nao criar menu separado por status; a home da feature orienta PF/PJ.
- Nao bloquear `CLIENTE` no frontend se backend ainda e a fonte de ownership.

### Step 106.2.3 - Implementar home da jornada

**Conteudo esperado**:
- Visao compacta com dois caminhos: pessoa fisica e empresa.
- Cards com status quando houver id em estado local da feature ou query param.
- Sem texto explicativo longo; UI deve ser operacional e escaneavel.

### Definicao de pronto da Task F-6.2
- [ ] Rotas lazy criadas.
- [ ] Menu "Onboarding" aparece no shell autenticado.
- [ ] Home PF/PJ navegavel.
- [ ] Guards existentes continuam protegendo `/app`.
- [ ] Testes de rota/menu atualizados.

---

## Task F-6.3 - Fluxo PF: iniciar, documentos, verificar e status

**Objetivo**: implementar a jornada PF consumindo `/api/v1/onboarding/pessoa`.

**Pre-requisito**: Tasks F-6.1 e F-6.2 concluidas.

**Esforco**: 1-1.5 dia.

**Arquivos principais esperados**:
- `src/app/features/authenticated/onboarding/pessoa/onboarding-pessoa-page.component.ts`
- `src/app/features/authenticated/onboarding/pessoa/onboarding-pessoa-page.component.html`
- `src/app/features/authenticated/onboarding/pessoa/onboarding-pessoa-page.component.scss`
- `src/app/features/authenticated/onboarding/pessoa/onboarding-pessoa-page.component.spec.ts`
- componentes compartilhados de upload/status se criados em `onboarding/shared/`.

### Step 106.3.1 - Formulario de inicio PF

**Campos**:
- `cpf`
- `nomeCompleto`
- `dataNascimento`

**Regras de UI**:
- Validar obrigatoriedade e formato basico apenas para reduzir erro de digitacao.
- Backend continua dono da validacao juridica/cadastral.
- Ao `201`, armazenar `id` em estado de componente/rota e navegar para detalhe PF.

### Step 106.3.2 - Upload de documentos PF

**Tipos minimos**:
- `RG`
- `CNH`
- `CPF`
- `COMPROVANTE_ENDERECO`

**Regras**:
- Usar input de arquivo com limite visual de 10MB.
- Aceitar PDF/JPEG/PNG conforme contrato backend; erro real vem da API.
- Nao manter arquivo depois de upload concluido.
- Exibir `DocumentoEnviadoResponse` sem link de download, pois backend nao expoe binario.

### Step 106.3.3 - Disparar verificacao e consultar status

**Fluxo**:
- Botao "Enviar para verificacao" chama `POST /{id}/verificar`.
- `202` coloca tela em estado aguardando resultado.
- Consulta manual/refresh chama `GET /{id}`.
- Estados finais `APROVADO_FINAL`, `REPROVADO`, `REPROVADO_PLD`, `PENDENCIA` mudam apenas visualmente.

### Definicao de pronto da Task F-6.3
- [ ] PF cria solicitacao.
- [ ] PF envia documentos via multipart.
- [ ] PF dispara verificacao.
- [ ] PF consulta status e documentos enviados.
- [ ] Erros 400/403/404/409 tratados sem quebrar shell.
- [ ] Testes cobrem sucesso e conflito CPF ativo.

---

## Task F-6.4 - Fluxo PJ/KYB: empresa, documentos, representantes e status

**Objetivo**: implementar a jornada PJ consumindo `/api/v1/onboarding/empresa`.

**Pre-requisito**: Tasks F-6.1 e F-6.2 concluidas.

**Esforco**: 1-1.5 dia.

**Arquivos principais esperados**:
- `src/app/features/authenticated/onboarding/empresa/onboarding-empresa-page.component.ts`
- `src/app/features/authenticated/onboarding/empresa/onboarding-empresa-page.component.html`
- `src/app/features/authenticated/onboarding/empresa/onboarding-empresa-page.component.scss`
- `src/app/features/authenticated/onboarding/empresa/onboarding-empresa-page.component.spec.ts`

### Step 106.4.1 - Formulario de inicio PJ

**Campos**:
- `cnpj`
- `razaoSocial`
- `nomeFantasia`
- `tipoSocietario`
- `porte`

**Regras**:
- `tipoSocietario` e `porte` devem usar selects com enums de contrato.
- Nao consultar CNPJ em fonte externa no frontend.
- Ao `201`, navegar para detalhe PJ.

### Step 106.4.2 - Upload de documentos PJ

**Tipos aceitos no backend**:
- `CONTRATO_SOCIAL`
- `CCMEI`
- `COMPROVANTE_ENDERECO`

**Regras**:
- Nao oferecer tipos PF na tela PJ.
- Erro `ONB-400-016` deve aparecer como documento nao aceito.

### Step 106.4.3 - Verificacao KYB/PLD e representantes

**Fluxo**:
- `POST /{id}/verificar` dispara KYB; PLD e orquestrado pelo backend.
- `GET /{id}` exibe dados da empresa, documentos, representantes e resultado quando existir.
- `GET /{id}/representantes` pode ser usado para refresh dedicado.

**Cuidados LGPD**:
- Exibir apenas `cpfMascarado`.
- Nao criar campo livre para CPF completo de representante; representantes vem do provider/backend.
- Resumo PLD mostra apenas status/data, sem motivo/base/severidade.

### Definicao de pronto da Task F-6.4
- [ ] PJ cria solicitacao.
- [ ] PJ envia documentos aceitos.
- [ ] PJ dispara verificacao.
- [ ] PJ exibe dados, representantes mascarados e status PLD publico.
- [ ] Testes cobrem sucesso e CNPJ ativo/documento invalido.

---

## Task F-6.5 - Componentes de status, erro e experiencia operacional

**Objetivo**: consolidar estados visuais e tratamento de erro para PF/PJ sem duplicar templates.

**Pre-requisito**: Tasks F-6.3 e F-6.4 concluidas.

**Esforco**: 0.5-1 dia.

**Arquivos principais esperados**:
- `src/app/features/authenticated/onboarding/shared/onboarding-status.component.ts`
- `src/app/features/authenticated/onboarding/shared/onboarding-status.component.html`
- `src/app/features/authenticated/onboarding/shared/onboarding-status.component.scss`
- `src/app/features/authenticated/onboarding/shared/document-upload.component.ts` ou equivalente, se reduzir duplicacao real.
- specs correspondentes.

### Step 106.5.1 - Criar componente de status

**Estados mapeados visualmente**:
- `INICIADO`
- `DOCUMENTOS_RECEBIDOS`
- `EM_VERIFICACAO`
- `APROVADO`
- `APROVADO_FINAL`
- `REPROVADO`
- `REPROVADO_PLD`
- `PENDENCIA`

**Regra**:
- O componente nao decide proximas transicoes de negocio; ele so apresenta status e acoes permitidas pelo estado atual da tela.

### Step 106.5.2 - Tratamento de erros

**Mapear UX para**:
- `400`: validacao/campo/documento.
- `403`: sem permissao ou nao-owner.
- `404`: solicitacao nao encontrada.
- `409`: CPF/CNPJ com solicitacao ativa.
- `5xx`: indisponibilidade temporaria.

**Regras**:
- Reusar padrao global de `ErrorInterceptor` quando existir.
- Nao exibir stack, trace interno ou payload bruto.
- `traceId` pode ser mostrado discretamente quando existir.

### Step 106.5.3 - Acessibilidade e responsividade

**Checklist**:
- Labels conectados a inputs.
- Estados de loading/desabilitado em botoes.
- Mensagens de erro ligadas ao campo quando aplicavel.
- Layout denso e escaneavel no desktop; sem hero/marketing dentro de `/app`.
- Mobile viewport nao quebra, embora mobile funcional seja fora de escopo.

### Definicao de pronto da Task F-6.5
- [ ] Status visual unificado.
- [ ] Tratamento de erro PF/PJ consistente.
- [ ] Upload/status sem duplicacao relevante.
- [ ] Acessibilidade basica validada.
- [ ] Testes cobrem status finais e erros principais.

---

## Task F-6.6 - Validacao final, MSW, smoke e documentacao

**Objetivo**: fechar a F-Sprint 6 com testes proporcionais, smoke funcional e documentacao operacional atualizada.

**Pre-requisito**: Tasks F-6.1-F-6.5 concluidas.

**Esforco**: 0.5-1 dia.

### Step 106.6.1 - Completar testes unitarios

**Comandos**:
```bash
cd <sep-app-root>
npm run lint
npm run lint:scss
npm run test
```

**Cobertura esperada**:
- `OnboardingService`.
- Rotas/menu.
- Fluxo PF principal + conflito.
- Fluxo PJ principal + documento invalido.
- Componentes de status/erro.

### Step 106.6.2 - Smoke com MSW/dev-offline

**Fluxos minimos**:
- Login via MSW.
- Abrir `/app/onboarding`.
- PF: criar -> upload -> verificar -> status aprovado final.
- PJ: criar -> upload -> verificar -> representantes mascarados.
- Repetir PF/PJ com erro 409/403.

**Comandos sugeridos**:
```bash
cd <sep-app-root>
npm run build
npm run e2e
```

Se `e2e` exigir servidor local, registrar comando real usado no checkpoint.

### Step 106.6.3 - Smoke opcional com backend real

**Pre-requisito**:
- `sep-api` rodando em `http://localhost:8080`.
- Usuario `CLIENTE` autenticavel.
- Providers fake de onboarding/PLD habilitados.

**Fluxos**:
- PF: login real -> criar solicitacao -> anexar docs -> verificar -> consultar.
- PJ: login real -> criar solicitacao -> anexar doc -> verificar -> consultar representantes.

**Observacao**:
- Se backend real nao estiver disponivel, nao bloquear a task; registrar que smoke real ficou pendente por ambiente.

### Step 106.6.4 - Atualizar documentacao

**Arquivos esperados**:
- `docs-SEP/repos/sep-app/README.md`:
  - rotas web de onboarding;
  - contratos consumidos;
  - modo MSW/dev-offline;
  - testes/smoke.
- `docs-SEP/docs-sep/WEB-SCREENS-PLAN.md` se a UI implementada diferir do plano.
- `docs-SEP/docs-sep/PRD-FASE-3.md` e `CONTEXT-PARTE-2.md` apenas ao fechar/mergear a sprint.
- `docs-SEP/AI-ROADMAP.md` se novo steps/doc operacional precisar entrar no mapa.
- Collections Postman/Insomnia nao sao obrigatorias para web, salvo mudanca de contrato backend.

### Step 106.6.5 - Criar PR description temporaria

**Arquivo esperado**:
- `docs-SEP/repos/sep-app/SPRINT-F6-PR.md`

**Conteudo minimo**:
- Summary.
- Test plan.
- Mudancas por area.
- Contratos consumidos.
- Decisoes e dividas aceitas.
- Follow-ups.
- Lista de commits.

### Definicao de pronto da Task F-6.6
- [ ] Lint/scss/test/build verdes ou bloqueio ambiental registrado.
- [ ] Smoke MSW/dev-offline executado.
- [ ] Smoke backend real executado ou pendencia ambiental registrada.
- [ ] `repos/sep-app/README.md` atualizado.
- [ ] PRD/CONTEXT atualizados somente apos fechamento/merge confirmado.
- [ ] PR description temporaria criada.

---

## Definition of Done da F-Sprint 6

- [x] Jornada onboarding PF/PJ navegavel dentro de `/app`.
- [x] `OnboardingService` consome contratos reais de `sep-api`.
- [x] PF cria solicitacao, envia documentos, dispara verificacao e consulta status.
- [x] PJ cria solicitacao, envia documentos aceitos, dispara verificacao e consulta status/representantes.
- [x] Frontend nao duplica regras KYC/KYB/PLD.
- [x] CPF completo de representante nunca aparece no web.
- [x] Upload nao persiste arquivo em storage local.
- [x] Estados finais e divergentes sao apresentados de forma rastreavel.
- [x] 400/403/404/409/5xx tratados de forma consistente.
- [x] MSW cobre cenarios principais.
- [x] Vitest proporcional verde.
- [x] Build verde.
- [x] Docs operacionais web atualizadas.

---

## Pendencias aceitas / follow-ups provaveis

- Descoberta/listagem de solicitacoes existentes do usuario depende de endpoint backend dedicado; se ausente, F-Sprint 6 trabalha a partir do id retornado no fluxo iniciado na propria sessao.
- Self-service mais rico para retomar onboarding antigo pode exigir endpoint de "minha solicitacao ativa".
- OCR/captura assistida de documentos fica fora do web inicial.
- Edicao documental apos aprovacao/reprovacao depende de regra de produto futura.
- Ajustes finos de contrato Celcoin real permanecem responsabilidade do backend/provider; o web consome apenas DTO SEP.
