# Steps - F-Sprint 8 - Formalizacao, Assinatura e CCB Web

**Spec de origem**: [`specs/fase-3/108-fsprint-8-formalizacao-web.md`](../../specs/fase-3/108-fsprint-8-formalizacao-web.md)

**Status**: mergeada em `origin/develop` (PR #39) e `origin/main` (PR #40), 2026-06-03.

**Objetivo geral**: implementar no `sep-app` a jornada autenticada de formalizacao contratual para o tomador, consumindo os contratos reais de `sep-api` (`contratos` Sprints 10-11), com UI Notion, aceite com step-up, status de assinatura e acesso protegido ao documento assinado/CCB, sem duplicar regras contratuais ou logica de assinatura no frontend.

**Esforco total estimado**: 5-7 dias de Dev Pleno Frontend.

**Repo de destino**:
- `sep-app`: Angular web, repo de codigo alterado nesta sprint.
- `docs-SEP`: documentacao editada no working tree quando necessario; operacao git continua manual.

**Branch sugerida**:
- `feature/fsprint-8-formalizacao-web`

**Pre-requisitos globais**:
- `sep-app/develop` atualizado apos F-Sprint 7 (`feature/fsprint-7-credito-open-finance-web`).
- F-Sprints 0-7 concluidas: shell autenticado Notion, guards, interceptors, MSW, Vitest, Playwright, MFA/step-up/refresh, onboarding PF/PJ, propostas de credito e Open Finance navegaveis.
- `sep-api/develop` ou `main` com Sprints backend 10-11 mergeadas: contratos, versoes contratuais, aceite, assinatura digital, CCB e documento assinado.
- Backend local disponivel em `http://localhost:8080` quando for validar smoke real.
- Docs de referencia: `repos/sep-api/CONTRATOS.md`, `repos/sep-api/CCB.md`, `docs-sep/WEB-SCREENS-PLAN.md`, `docs-sep/DESIGN-notion.md`, `docs-sep/SEGURANCA.md`.

**Contratos backend consumidos**:

Contratos (`/api/v1/contratos`):
- `GET /api/v1/contratos/{id}` -> `ContratoResponse`, com ownership do tomador ou perfil `FINANCEIRO`/`ADMIN`.
- `GET /api/v1/contratos/proposta/{propostaId}` -> `ContratoResponse`, com ownership do tomador ou perfil `FINANCEIRO`/`ADMIN`.
- `GET /api/v1/contratos/{id}/versoes` -> `VersaoContratoResponse[]`, com ownership do tomador ou perfil `FINANCEIRO`/`ADMIN`.
- `PATCH /api/v1/contratos/{id}/aceite` body vazio -> `ContratoResponse` (contrato atualizado, com o aceite embutido em `aceite`), com usuario `CLIENTE` owner e `@RequireStepUp`. (Correcao pos-implementacao: o backend retorna `ContratoResponse`, nao `AceiteContratoResponse`; o frontend usa esse retorno para refletir o novo estado sem segunda chamada.)
- `GET /api/v1/contratos/{id}/assinatura/status` -> `StatusAssinaturaResponse`, com ownership do tomador ou perfil `FINANCEIRO`/`ADMIN`.
- `GET /api/v1/contratos/{id}/documento-assinado` -> `application/pdf`, com `Content-Disposition` e `X-Document-Hash-Sha256`, com ownership do tomador ou perfil `FINANCEIRO`/`ADMIN`.

Operacoes existentes, mas fora do escopo funcional da F-Sprint 8:
- `POST /api/v1/contratos/{id}/cancelar`, `FINANCEIRO`/`ADMIN` + step-up; entra em backoffice/financeiro.
- `POST /api/v1/contratos/{id}/assinar`, `FINANCEIRO`/`ADMIN` + step-up; reprocesso/manual entra em backoffice/financeiro.
- `POST /api/v1/webhooks/assinatura/{provider}`; callback publico validado por HMAC no backend, nao pertence ao web app.

**DTOs esperados no frontend**:
- `ContratoResponse`: `id`, `propostaId`, `tomadorId`, `tipo`, `status`, `versaoVigente`, `aceite`, `dataCriacao`, `dataModificacao`.
- `VersaoContratoResponse`: `id`, `numero`, `conteudoTexto`, `hashSha256`, `dataGeracao`, `parecerOrigemId`, `clausulas`.
- `ClausulaContratoResponse`: `id`, `ordem`, `titulo`, `texto`.
- `AceiteContratoResponse`: `id`, `versaoId`, `tomadorId`, `dataAceite`, `ipOrigem`, `userAgentOrigem`.
- `RegistrarAceiteRequest`: body vazio/reservado.
- `StatusAssinaturaResponse`: `statusContrato`, `statusEnvelope`, `idEnvelopeExterno`, `dataAtualizacaoProvider`.

**Enums esperados**:
- `StatusFormalizacao`: `GERADO`, `AGUARDANDO_ACEITE`, `ACEITO`, `EM_ASSINATURA`, `ASSINADO`, `RECUSADO`, `CANCELADO`.
- `StatusEnvelope`: `RASCUNHO`, `ENVIADO`, `VISUALIZADO`, `ASSINADO`, `RECUSADO`, `EXPIRADO`.
- `TipoContrato`: confirmado no backend como `MUTUO | CCB | OUTROS` (o union TypeScript reflete os tres valores).

**Decisoes da sprint**:
- Frontend exibe contrato, versao, aceite, status de assinatura e documento assinado; versionamento, hashes, geracao de PDF/CCB, assinatura provider e transicoes de estado pertencem ao backend.
- Aceite contratual usa fluxo real de step-up e envia o token pelo header esperado pelo interceptor/servico existente, sem criar bypass no frontend.
- A limitacao conhecida do backend `@RequireStepUp` em operadores sem MFA nao deve ser replicada ou mascarada no web; para esta sprint, a tela de aceite do tomador deve tratar `403` como exigencia/erro de step-up e manter a decisao de seguranca no backend.
- Documento assinado/CCB deve ser tratado como `Blob` transitorio: baixar/abrir com URL temporaria, revogar URL depois do uso e nao persistir base64/blob/hash em `localStorage` ou `sessionStorage`.
- Conteudo contratual e clausulas sao somente leitura; o web nao edita template, nao altera clausula, nao calcula readiness para desembolso e nao tenta inferir validade juridica.
- Se nao existir endpoint de lista global de contratos, nao inventar contrato no frontend. A navegacao deve partir de proposta aprovada/F-Sprint 7 ou consulta por proposta/contrato; registrar o gap se a lista ampla for necessaria para UX.
- `CLIENTE` deve visualizar apenas contratos que o backend autorizar. O frontend pode esconder entradas por role, mas nunca assumir ownership como controle de seguranca.
- Erros `400/403/404/409/422` devem virar estados de UI claros sem quebrar o shell autenticado.

**Fora de escopo da sprint**:
- Editor de template contratual.
- Assinatura offline ou coleta de assinatura fora do provider backend.
- Renegociacao, aditivos ou cancelamento operacional.
- Backoffice de formalizacao, reenvio para assinatura, cancelamento e excecoes operacionais.
- Integracao direta do frontend com Clicksign ou outro provider de assinatura.
- Exibir payload bruto de webhook, dados sensiveis de provider ou PDF sem autorizacao.

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
C1 = F-8.0 + F-8.1
Prechecks + modelos/ContratosService/MSW base

C2 = F-8.2
Rotas, menu e entrada da jornada de formalizacao

C3 = F-8.3
Detalhe, versoes e visualizacao contratual

C4 = F-8.4
Aceite contratual com step-up real

C5 = F-8.5
Status de assinatura, documento assinado/CCB, smoke e docs
```

- C1 fecha contratos antes de UI.
- C2 abre navegacao sem criar endpoint inexistente.
- C3 consolida leitura contratual antes de permitir aceite.
- C4 isola a operacao sensivel e seus testes.
- C5 fecha assinatura/documento e validacao final da sprint.

---

## Task F-8.0 - Prechecks da F-Sprint 8

**Objetivo**: confirmar base Git, scripts, contratos backend e arquitetura atual do `sep-app`.

**Esforco**: 1-2 horas.

### Step 108.0.1 - Conferir estado Git do `sep-app`

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
- F-Sprint 7 presente no historico.

### Step 108.0.2 - Criar branch da sprint

**Comandos**:
```bash
cd <sep-app-root>
git switch develop
git pull --ff-only
git switch -c feature/fsprint-8-formalizacao-web
```

**Verificacao**:
- Branch criada a partir de `develop` atualizado.
- Se `git pull --ff-only` falhar, abortar e avisar o usuario.

### Step 108.0.3 - Mapear estrutura atual do frontend

**Comandos**:
```bash
cd <sep-app-root>
find src/app/core -maxdepth 3 -type f | sort
find src/app/features/authenticated -maxdepth 5 -type f | sort
find src/app/layout -maxdepth 3 -type f | sort
find src/mocks -maxdepth 3 -type f | sort
sed -n '1,300p' src/app/core/api/api.models.ts
sed -n '1,260p' src/app/features/authenticated/authenticated.routes.ts
sed -n '1,240p' src/app/layout/sidenav/sidenav.component.ts
```

**Verificacao**:
- Shell Notion e rotas autenticadas existem.
- `CreditoService`/feature F-Sprint 7 esta navegavel para entrada por proposta aprovada.
- MSW esta disponivel para `dev-offline`.
- Fluxo MFA/step-up existente localizado antes da Task F-8.4.

### Step 108.0.4 - Conferir contratos backend

**Comandos**:
```bash
cd <sep-api-root>
grep -R "class ContratoController\|class AssinaturaWebhookController" -n src/main/java/com/dynamis/sep_api/contratos src/main/java/com/dynamis/sep_api/assinatura 2>/dev/null
grep -R "record .*Contrato\|record .*VersaoContrato\|record .*AceiteContrato\|record .*StatusAssinatura" -n src/main/java/com/dynamis/sep_api/contratos/web/dto
find src/main/java/com/dynamis/sep_api/contratos/domain -maxdepth 3 -type f | sort
```

**Verificacao**:
- Endpoints de contrato por id/proposta confirmados.
- Endpoints de versoes, aceite, status de assinatura e documento assinado confirmados.
- Enums `StatusFormalizacao`, `StatusEnvelopeAssinatura` e `TipoContrato` confirmados antes de criar modelos TypeScript.

### Step 108.0.5 - Rodar baseline web

**Comandos**:
```bash
cd <sep-app-root>
npm run lint
npm run lint:scss
npm run test -- --run
npm run build
```

**Verificacao**:
- Baseline passa antes das alteracoes.
- Se falhar por problema preexistente, registrar evidencia e alinhar com o usuario antes de seguir.

### Step 108.0.6 - Checkpoint C1 parcial

**Entregaveis**:
- Estado Git e baseline registrados.
- Contratos backend confirmados.
- Branch da sprint pronta.

**Pausa obrigatoria**:
- Parar se houver divergencia em DTO, enum, endpoint de aceite ou header de step-up.

---

## Task F-8.1 - ContratosService, modelos e MSW base

**Objetivo**: criar a borda de API da formalizacao sem UI complexa, com modelos TypeScript fieis aos DTOs backend e mocks suficientes para desenvolvimento offline.

**Esforco**: 1 dia.

### Step 108.1.1 - Criar modelos de contratos

**Arquivos provaveis**:
- `src/app/core/api/api.models.ts`
- ou arquivo local seguindo padrao existente de F-Sprint 7, se o projeto separar modelos por feature.

**Implementacao**:
- Adicionar unions para status contratuais e status de envelope.
- Adicionar interfaces para contrato, versao, clausula, aceite e status de assinatura.
- Manter nomes e tipos alinhados aos DTOs backend.
- Datas ficam como `string` ISO na borda de API; formatacao pertence a componente/helper de apresentacao.

**Verificacao**:
- Nenhum modelo cria regra de negocio ou metodo calculado.
- Campos opcionais refletem nullable real do backend, nao conveniencia visual.

### Step 108.1.2 - Criar `ContratosService`

**Arquivos provaveis**:
- `src/app/core/contratos/contratos.service.ts`
- `src/app/core/contratos/contratos.service.spec.ts`

**Metodos minimos**:
- `consultarContrato(id: string)`.
- `consultarContratoPorProposta(propostaId: string)`.
- `listarVersoes(contratoId: string)`.
- `registrarAceite(contratoId: string, stepUpToken: string)`.
- `consultarStatusAssinatura(contratoId: string)`.
- `baixarDocumentoAssinado(contratoId: string)`.

**Regras de implementacao**:
- Usar `HttpClient` e configuracao de base URL ja existente.
- `registrarAceite` deve enviar body vazio/reservado e header de step-up conforme padrao existente do projeto.
- `baixarDocumentoAssinado` deve pedir `responseType: 'blob'` e `observe: 'response'` para preservar `X-Document-Hash-Sha256`.
- Nao adicionar metodo de cancelar/reprocessar assinatura na UI do tomador nesta sprint.

**Verificacao**:
- Specs validam URL, metodo HTTP, header de step-up e responseType do PDF.
- Nenhum componente chama endpoint diretamente.

### Step 108.1.3 - Adicionar fixtures MSW de formalizacao

**Arquivos provaveis**:
- `src/mocks/handlers.ts`
- `src/mocks/data/contratos.ts` ou padrao equivalente.

**Cenarios minimos**:
- Contrato `AGUARDANDO_ACEITE` com versao vigente, hash e clausulas.
- Consulta por proposta aprovada retornando contrato.
- Lista de versoes retornando historico ordenado.
- Aceite com token valido retornando `ContratoResponse` atualizado e mudando estado mockado para `EM_ASSINATURA`.
- Aceite sem token retornando `403`.
- Consulta de assinatura retornando `ENVIADO`, `ASSINADO` e `RECUSADO` conforme fixture.
- Documento assinado retornando blob PDF fake e header `X-Document-Hash-Sha256`.
- `403`, `404` e `409` para ownership, contrato inexistente e estado invalido.

**Verificacao**:
- MSW nao mascara exigencia de step-up.
- Fixture nao armazena PDF real nem dados sensiveis desnecessarios.

### Step 108.1.4 - Testar service e mocks

**Comandos**:
```bash
cd <sep-app-root>
npm run lint
npm run test -- --run contratos
```

**Verificacao**:
- `ContratosService` coberto.
- Tipos compilaram sem `any` desnecessario.

### Step 108.1.5 - Checkpoint C1

**Entregaveis**:
- Modelos de contrato/assinatura/CCB.
- `ContratosService`.
- MSW base.
- Specs do service.

**Pausa obrigatoria**:
- Review da Task F-8.1 antes de criar telas.

---

## Task F-8.2 - Rotas, menu e entrada da jornada

**Objetivo**: tornar a formalizacao acessivel no shell autenticado sem criar fluxo quebrado ou endpoint inexistente.

**Esforco**: 0,5-1 dia.

### Step 108.2.1 - Criar feature de formalizacao

**Arquivos provaveis**:
- `src/app/features/authenticated/formalizacao/formalizacao.routes.ts`
- `src/app/features/authenticated/formalizacao/formalizacao-shell.component.ts`
- `src/app/features/authenticated/formalizacao/formalizacao-shell.component.html`
- `src/app/features/authenticated/formalizacao/formalizacao-shell.component.scss`
- `src/app/features/authenticated/authenticated.routes.ts`

**Rotas sugeridas**:
- `/app/formalizacao`
- `/app/formalizacao/contratos`
- `/app/formalizacao/contratos/:id`
- `/app/formalizacao/proposta/:propostaId`

**Verificacao**:
- Lazy loading segue padrao das features autenticadas existentes.
- Rotas inexistentes nao aparecem em links da F-Sprint 7.

### Step 108.2.2 - Adicionar entrada no menu autenticado

**Arquivos provaveis**:
- `src/app/layout/sidenav/sidenav.component.ts`
- templates/SCSS associados, conforme padrao atual.

**Implementacao**:
- Adicionar item "Formalizacao" no grupo adequado.
- Usar icone da biblioteca ja adotada no projeto.
- Preservar densidade e estilo Notion.
- Aplicar visibilidade por autenticacao/role apenas como UX, nao como controle de seguranca.

**Verificacao**:
- Menu nao quebra em viewport mobile.
- Texto cabe no container.

### Step 108.2.3 - Implementar home/lista de formalizacao

**Implementacao**:
- Criar tela de entrada com contratos acessiveis a partir de propostas aprovadas ou parametro de proposta.
- Se o backend nao disponibilizar `GET /contratos` global, usar explicitamente `GET /contratos/proposta/{propostaId}` quando houver `propostaId`.
- Para uma lista ampla, preferir reaproveitar propostas da F-Sprint 7 e resolver contrato por proposta somente quando viavel e limitado; se isso gerar N+1 ou UX ruim, registrar gap e manter tela orientada por proposta/detalhe.

**Estados obrigatorios**:
- Carregando.
- Sem contrato gerado para a proposta.
- Contrato encontrado.
- Erro `403`.
- Erro `404`.

**Verificacao**:
- Nenhum contrato fake hardcoded fora do MSW.
- A rota por proposta consegue navegar para detalhe do contrato retornado.

### Step 108.2.4 - Testar rotas e menu

**Comandos**:
```bash
cd <sep-app-root>
npm run lint
npm run lint:scss
npm run test -- --run formalizacao
```

**Verificacao**:
- Rotas carregam.
- Menu aponta para rota existente.
- Nenhum link da jornada de credito aponta para rota ausente.

### Step 108.2.5 - Checkpoint C2

**Entregaveis**:
- Feature formalizacao navegavel.
- Menu autenticado atualizado.
- Entrada por proposta/contrato funcionando com MSW.

**Pausa obrigatoria**:
- Review da Task F-8.2 antes de detalhar contrato e versoes.

---

## Task F-8.3 - Detalhe, versoes e visualizacao contratual

**Objetivo**: permitir que o tomador leia o contrato gerado, veja versao vigente, clausulas e historico de versoes de forma clara e somente leitura.

**Esforco**: 1-1,5 dia.

### Step 108.3.1 - Criar detalhe de contrato

**Arquivos provaveis**:
- `src/app/features/authenticated/formalizacao/contrato-detail.component.ts`
- `src/app/features/authenticated/formalizacao/contrato-detail.component.html`
- `src/app/features/authenticated/formalizacao/contrato-detail.component.scss`
- specs associados.

**Implementacao**:
- Carregar contrato por `contratoId` ou por `propostaId`.
- Exibir status de formalizacao, proposta vinculada, datas principais e versao vigente.
- Usar badges/indicadores consistentes com status da F-Sprint 7.
- Nao exibir `tomadorId` bruto como informacao principal; pode ficar em area tecnica se o projeto ja tiver esse padrao.

**Verificacao**:
- `AGUARDANDO_ACEITE`, `ACEITO`, `EM_ASSINATURA`, `ASSINADO`, `RECUSADO` e `CANCELADO` tem apresentacao distinta.
- Erros de API mantem shell estavel.

### Step 108.3.2 - Visualizar conteudo e clausulas

**Implementacao**:
- Renderizar `versaoVigente.conteudoTexto` como texto preservando quebras, sem interpretar HTML.
- Exibir clausulas em ordem por `ordem`.
- Exibir `hashSha256` da versao de forma escaneavel e copiavel somente se houver padrao de copy no app; caso contrario, mostrar como metadado tecnico.
- Evitar cards aninhados; usar seccoes full-width/constrained conforme design Notion do app.

**Verificacao**:
- Conteudo contratual longo nao quebra layout mobile.
- Texto nao sobrepoe botoes ou abas.
- Nenhuma interpolacao usa HTML inseguro.

### Step 108.3.3 - Historico de versoes

**Implementacao**:
- Carregar `GET /contratos/{id}/versoes`.
- Mostrar versao vigente e versoes anteriores com numero, data, hash e origem de parecer quando disponivel.
- Permitir alternar visualizacao entre versoes sem mutar contrato.

**Verificacao**:
- Ordenacao por `numero` ou `dataGeracao` fica explicita.
- Versao selecionada nao altera a versao vigente backend.

### Step 108.3.4 - Testar detalhe e versoes

**Comandos**:
```bash
cd <sep-app-root>
npm run lint
npm run lint:scss
npm run test -- --run formalizacao
```

**Verificacao**:
- Specs cobrem sucesso, erro, contrato sem versao e contrato com multiplas versoes.
- Conteudo contratual e clausulas sao tratados como texto.

### Step 108.3.5 - Checkpoint C3

**Entregaveis**:
- Detalhe de contrato.
- Visualizacao de conteudo/versao contratual.
- Historico de versoes.

**Pausa obrigatoria**:
- Review da Task F-8.3 antes de liberar aceite.

---

## Task F-8.4 - Aceite contratual com step-up

**Objetivo**: implementar o aceite do contrato como operacao sensivel, exigindo step-up real antes de chamar o backend.

**Esforco**: 1-1,5 dia.

### Step 108.4.1 - Mapear fluxo step-up existente

**Comandos**:
```bash
cd <sep-app-root>
grep -R "step-up\|StepUp\|mfa\|Mfa" -n src/app src/mocks | head -80
```

**Verificacao**:
- Servico/componente/modal de step-up existente identificado.
- Header usado pelo projeto para token step-up confirmado.
- Fluxo nao depende de token fake fora de MSW/teste.

### Step 108.4.2 - Criar acao de aceite no detalhe

**Implementacao**:
- Exibir acao de aceite somente quando contrato estiver em estado aceitavel (`AGUARDANDO_ACEITE` ou conforme backend permitir).
- Antes do `PATCH`, abrir/coletar step-up pelo fluxo existente.
- Enviar token step-up pelo `ContratosService.registrarAceite`.
- Apos sucesso, recarregar contrato e status de assinatura.
- Desabilitar botao durante envio para evitar duplo clique.

**Verificacao**:
- Sem token step-up, request nao deve ser disparado ou deve falhar controladamente conforme padrao do app.
- `409` de estado invalido vira mensagem clara e recarrega estado.
- `403` vira mensagem de autorizacao/step-up sem esconder erro.

### Step 108.4.3 - Tratar aceite ja registrado

**Implementacao**:
- Se `aceite` existir, mostrar data, versao aceita e evidencia textual permitida.
- Nao exibir IP/user-agent como destaque para tomador, salvo se design/seguranca pedir; estes campos sao evidencia tecnica.
- Nao permitir novo aceite quando backend indicar estado terminal ou ja aceito.

**Verificacao**:
- Estado `ACEITO` ou `EM_ASSINATURA` nao mostra acao duplicada.
- Estado `ASSINADO` mostra aceite como concluido.

### Step 108.4.4 - Testar aceite com step-up

**Comandos**:
```bash
cd <sep-app-root>
npm run lint
npm run lint:scss
npm run test -- --run formalizacao
```

**Cenarios minimos**:
- Aceite com token valido chama `PATCH /contratos/{id}/aceite`.
- Aceite sem token recebe/trata `403`.
- Estado invalido recebe/trata `409`.
- Botao fica indisponivel durante envio.
- Tela recarrega status apos sucesso.

### Step 108.4.5 - Checkpoint C4

**Entregaveis**:
- Aceite contratual com step-up real.
- Tratamento de estados e erros.
- Specs da operacao sensivel.

**Pausa obrigatoria**:
- Code review da Task F-8.4 antes de seguir para documento assinado.

---

## Task F-8.5 - Status de assinatura, documento assinado/CCB e fechamento

**Objetivo**: exibir status de assinatura e permitir acesso protegido ao documento assinado/CCB quando autorizado.

**Esforco**: 1-1,5 dia.

### Step 108.5.1 - Exibir status de assinatura

**Implementacao**:
- Consultar `GET /contratos/{id}/assinatura/status`.
- Mostrar `statusContrato`, `statusEnvelope`, `dataAtualizacaoProvider` e identificador externo de forma discreta.
- Mapear estados de envelope para UI: `RASCUNHO`, `ENVIADO`, `VISUALIZADO`, `ASSINADO`, `RECUSADO`, `EXPIRADO`.
- Nao consultar provider externo diretamente.

**Verificacao**:
- Tela distingue contrato aceito aguardando assinatura, em assinatura e assinado.
- Estados recusado/expirado explicam que a operacao precisa de suporte/backoffice, sem oferecer acao fora de escopo.

### Step 108.5.2 - Implementar download/visualizacao de documento assinado

**Implementacao**:
- Habilitar acao apenas quando backend retornar documento disponivel ou status `ASSINADO`.
- Chamar `GET /contratos/{id}/documento-assinado`.
- Ler `X-Document-Hash-Sha256` da resposta e mostrar como metadado do documento.
- Criar URL temporaria com `URL.createObjectURL(blob)` para download/visualizacao e chamar `URL.revokeObjectURL` apos uso.
- Preservar filename de `Content-Disposition` quando possivel.

**Verificacao**:
- `responseType: 'blob'` usado no service.
- Blob/base64/documento nao persiste em storage.
- `403`/`404` nao vazam informacao sensivel e mantem UI estavel.

### Step 108.5.3 - Integrar jornada a partir de proposta aprovada

**Implementacao**:
- A partir do detalhe da proposta F-Sprint 7, adicionar CTA para formalizacao somente quando o backend/estado indicar contrato gerado ou proposta aprovada.
- Linkar para `/app/formalizacao/proposta/:propostaId` ou `/app/formalizacao/contratos/:id`, conforme dado disponivel.
- Para proposta sem contrato ainda, mostrar estado "contrato em geracao/indisponivel" sem criar contrato local.

**Verificacao**:
- Nenhum CTA aponta para rota quebrada.
- Estados de proposta que nao podem formalizar nao mostram acao primaria indevida.

### Step 108.5.4 - Smoke offline e real

**Comandos offline**:
```bash
cd <sep-app-root>
npm run dev-offline
```

**Fluxo offline minimo**:
- Login mockado.
- Acessar proposta aprovada.
- Abrir formalizacao por proposta.
- Ler contrato e versao.
- Executar aceite com step-up mockado valido.
- Ver status de assinatura.
- Baixar PDF fake assinado e conferir hash exibido.

**Comandos de validacao final**:
```bash
cd <sep-app-root>
npm run lint
npm run lint:scss
npm run test -- --run
npm run build
```

**Smoke real recomendado**:
- Backend `sep-api` local com contratos Sprints 10-11.
- Fluxo contrato aprovado -> aceite -> assinatura fake/status, conforme provider configurado no ambiente.
- Se provider real nao estiver disponivel, registrar limite e validar ate o ponto suportado pelo backend fake/local.

### Step 108.5.5 - Atualizar documentacao

**Arquivos provaveis**:
- `docs-SEP/specs/fase-3/108-fsprint-8-formalizacao-web.md`
- `docs-SEP/docs-sep/PRD-FASE-3.md`
- `docs-SEP/docs-sep/CONTEXT-PARTE-2.md`
- `docs-SEP/AI-ROADMAP.md`
- `sep-app/README.md`, se o projeto registrar novas rotas/fluxos.

**Implementacao**:
- Marcar spec/steps como implementados somente apos conclusao real.
- Registrar branch, data, validacoes executadas e eventuais pendencias.
- Registrar qualquer gap de endpoint de lista global de contratos.
- Registrar limitacao real se assinatura provider depender de ambiente externo.

### Step 108.5.6 - Checkpoint C5 final

**Entregaveis**:
- Status de assinatura.
- Download/visualizacao protegida do documento assinado/CCB.
- CTA integrado a proposta aprovada.
- Testes e build final.
- Documentacao revisada.

**Pausa obrigatoria**:
- Code review da F-Sprint 8 completa antes de merge/PR.

---

## Definition of Done da F-Sprint 8

- Jornada de formalizacao acessivel pelo shell autenticado e por proposta aprovada.
- Contrato e versao vigente exibidos como somente leitura.
- Historico de versoes exibido sem mutar contrato.
- Aceite contratual usa step-up real e envia token pelo service.
- Erros de autorizacao, step-up e estado invalido tratados sem quebrar a UI.
- Status de assinatura exibido a partir do backend.
- Documento assinado/CCB acessado somente por endpoint autenticado/autorizado.
- PDF tratado como blob transitorio, sem persistencia em storage.
- Nenhuma regra juridica, contratual, assinatura provider ou readiness de desembolso duplicada no frontend.
- MSW cobre fluxo feliz e erros principais.
- `npm run lint`, `npm run lint:scss`, `npm run test -- --run` e `npm run build` executados.
- Docs de spec/steps/PRD/CONTEXT/roadmap atualizados ao final da sprint.

## Checklist de code review final

- [ ] O frontend nao criou endpoint, fixture ou regra para substituir ausencia de contrato backend.
- [ ] `ContratosService` centraliza chamadas HTTP de formalizacao.
- [ ] O aceite exige step-up e nao aceita token vazio em fluxo real.
- [ ] `PATCH /aceite` nao e chamado diretamente por componente sem passar pelo service.
- [ ] Conteudo contratual e renderizado como texto, nao HTML.
- [ ] Documento assinado e baixado como `Blob` com `observe: 'response'`.
- [ ] `X-Document-Hash-Sha256` e lido e exibido quando presente.
- [ ] Blob/object URL e revogado apos uso.
- [ ] Nenhum PDF/base64/hash sensivel e salvo em storage.
- [ ] Estados `403`, `404`, `409` e `422` tem tratamento de UI.
- [ ] CTA de formalizacao na proposta nao aparece em estados indevidos.
- [ ] Componentes mantem padrao Notion e nao usam cards aninhados.
- [ ] Testes cobrem service, detalhe, aceite e documento assinado.

---

## Resultado da implementacao (2026-06-03)

Branch `feature/fsprint-8-formalizacao-web` (a partir de `develop`). Commits por Task:

- F-8.1 borda de API: modelos TS (`StatusFormalizacao`, `StatusEnvelope`, `TipoContrato = MUTUO | CCB | OUTROS`, contrato/versao/clausula/aceite/status), `ContratosService` e MSW base (+fix `documento-assinado` 409, +fix persistencia de aceite e ordem ascendente de versoes).
- F-8.2 rotas, menu e entrada por proposta aprovada (sem lista global de contratos no backend).
- F-8.3 detalhe: conteudo como texto (pre-wrap, sem HTML), clausulas, hash, historico de versoes em abas (best-effort; nao derruba a leitura).
- F-8.4 aceite com step-up real: `stepUpInterceptor` estendido para `PATCH /contratos/{id}/aceite` (guard de metodo); 403 -> `/app/step-up`, 409 -> mensagem + reload.
- F-8.5 status de assinatura, download do documento/CCB como blob transitorio (object URL revogado em `finally`, nada em storage) e CTA "Formalizar contrato" na proposta aprovada.

Validacoes: `npm run lint`, `npm run lint:scss`, `npm run test -- --run` (180 testes) e `npm run build` verdes. Smoke `dev-offline` no browser recomendado manualmente.

### Divergencias e gaps registrados

- DTO de aceite: o backend retorna `ContratoResponse` (nao `AceiteContratoResponse`); corrigido neste step.
- `TipoContrato`: backend real expoe `MUTUO | CCB | OUTROS` (o step original estava conservador).
- Gap: backend nao tem endpoint de lista global de contratos. A entrada da jornada parte de propostas aprovadas e resolve o contrato por proposta sob demanda (evita N+1). Caso uma lista ampla seja necessaria para UX, abrir endpoint no backend.
