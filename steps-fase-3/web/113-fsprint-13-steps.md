# Steps - F-Sprint 13 - Pix Web

**Spec de origem**: [`specs/fase-3/113-fsprint-13-pix-web.md`](../../specs/fase-3/113-fsprint-13-pix-web.md)

**Status**: mergeada (PR #53 -> develop, 2026-06-11). Promocao para `main` pendente.

**Objetivo geral**: implementar no `sep-app` a operacao Pix assistida (Epic 15 + superficies operacionais do Epic 13), consumindo os endpoints reais do modulo `pix` do `sep-api` entregues nas Sprints backend 19-21: desembolso assistido, status de transferencia, referencias de recebimento, recebimentos vinculados a parcelas e visibilidade de divergencias/conciliacao operacional. O frontend apenas apresenta estado, dispara comandos autorizados e conduz step-up quando exigido; elegibilidade de contrato/parcela, idempotencia, conciliacao, auditoria, escrow e provider pertencem ao backend.

**Esforco total estimado**: 4-6 dias de Dev Pleno Frontend.

**Repo de destino**:
- `sep-app`: Angular web, repo de codigo alterado nesta sprint.
- `docs-SEP`: documentacao editada no working tree quando necessario; operacao git continua manual.

**Branch sugerida**:
- `feature/fsprint-13-pix-web`

**Pre-requisitos globais**:
- `sep-app/develop` atualizado apos F-Sprint 14 mergeada (New Design System Web vigente).
- F-Sprints web anteriores concluidas: shell autenticado, `roleGuard`, `StepUpTokenStore`, `stepUpInterceptor`, tela `/app/step-up?next=...`, MSW, Vitest, telas operacionais de cobranca/backoffice e New Design System SEP.
- `sep-api/develop` ou `main` com Sprints backend 19, 20 e 21 mergeadas (`pix` foundation, desembolso assistido e recebimento/conciliacao).
- Backend local disponivel em `http://localhost:8080` quando for validar smoke real.
- Docs de referencia: `repos/sep-api/PIX.md`, `repos/sep-api/COBRANCA.md`, `repos/sep-api/BACKOFFICE.md`, `docs-sep/SEGURANCA.md`, `docs-sep/WEB-SCREENS-PLAN.md`, `docs-sep/New Design System Sep.md`, `repos/sep-app/DESIGN-SYSTEM.md`.

**Modelo de acesso desta jornada (decisao de arquitetura)**:
- A area Pix operacional e interna. O route group deve ser visivel para `FINANCEIRO`, `ADMIN` e, quando houver leitura/conciliacao operacional, `BACKOFFICE`.
- A autorizacao real e do backend. O `roleGuard` web e UX/defesa-em-profundidade; nao substitui `hasRole` server-side.
- `FINANCEIRO`/`ADMIN` podem iniciar desembolso e gerar referencia de recebimento quando o backend permitir.
- `BACKOFFICE` pode consultar status/recebimentos e atuar em divergencias via fluxo operacional ja existente, mas nao inicia desembolso novo nem gera cobranca Pix se o backend nao autorizar.
- Operacoes sensiveis usam o step-up existente: o service nunca envia token manualmente; o `stepUpInterceptor` anexa `X-Step-Up-Token` para URLs allowlisted.

**Contratos backend consumidos** (confirmar campos exatos na Task F-13.0 antes de fixar modelos TypeScript):

Desembolso Pix (`/api/v1/pix/desembolsos`):
- `POST /api/v1/pix/desembolsos` -> cria/reaproveita desembolso assistido. Roles `FINANCEIRO`, `ADMIN`. Exige `@RequireStepUpEstrito` e header `Idempotency-Key`. Retorna `201` quando novo e `200` quando idempotente.
- `GET /api/v1/pix/desembolsos/{id}` -> leitura local do desembolso. Roles `FINANCEIRO`, `ADMIN`, `BACKOFFICE`.
- `POST /api/v1/pix/desembolsos/{id}/status` -> reconsulta/sincroniza status no provider. Roles `FINANCEIRO`, `ADMIN`, `BACKOFFICE`. Exige `@RequireStepUp`.

Recebimentos Pix (`/api/v1/pix/recebimentos`):
- `POST /api/v1/pix/recebimentos/referencias` -> gera ou reaproveita referencia Pix para parcela. Roles `FINANCEIRO`, `ADMIN`. Nao exige step-up. Retorna `201` quando nova e `200` quando idempotente.
- `GET /api/v1/pix/recebimentos/referencias/{id}` -> leitura local da referencia. Roles `FINANCEIRO`, `ADMIN`, `BACKOFFICE`.
- `GET /api/v1/pix/recebimentos/{id}` -> leitura do recebimento e estado de conciliacao. Roles `FINANCEIRO`, `ADMIN`, `BACKOFFICE`.

Backoffice de divergencias (`/api/v1/backoffice`):
- Divergencias Pix chegam como itens operacionais `RECEBIMENTO_PIX_DIVERGENTE`/`PIX_RECEBIMENTO` no backoffice.
- Nao ha reprocesso de provider para recebimento Pix divergente; o Pix ja foi recebido. O tratamento e assistido por assumir/comentar/resolver/ignorar no backoffice.
- Reprocesso de `PIX_TRANSFERENCIA` existe para desembolso falho e deve apenas reconsultar status, nunca reenviar transferencia.

**DTOs esperados no frontend**:
- `SolicitarDesembolsoPixRequest`: `contratoId`, `valor`, `chavePixDestino`.
- `PixDesembolsoResponse`: campos reais do backend para `id`, `contratoId`, `status`, `valor`, mascara da chave destino, flags de idempotencia/status e datas. A chave Pix em claro nunca volta em response.
- `GerarReferenciaRecebimentoPixRequest`: identificador da parcela e campos exigidos pelo backend real.
- `PixReferenciaRecebimentoResponse`: `id`, `parcelaId`, `txid`/referencia, `valor`, copia-cola quando exposto, `status`, `novo` e datas conforme DTO real.
- `PixRecebimentoResponse`: `id`, `referenciaId`/`parcelaId` quando houver, `status`, `valor`, `endToEndId` quando exposto pelo backend, motivo de divergencia/falha quando houver e datas.

> Campos exatos, nomes, nullability e enums devem ser confirmados contra os DTOs reais em `pix.web.dto` na Task F-13.0. Onde a doc operacional nao especificar campo, conferir controller/DTO do backend e nao inventar conveniencia visual.

**Enums esperados**:
- `PixTransferenciaStatus`: `CRIADA`, `SOLICITADA`, `PROCESSANDO`, `CONCLUIDA`, `FALHOU`, `CANCELADA`.
- `PixReferenciaRecebimentoStatus`: confirmar no backend; esperado no minimo estados operacionais como `ATIVA`, `PAGA` e `DIVERGENTE`.
- `PixRecebimentoStatus`: `RECEBIDO`, `EM_PROCESSAMENTO`, `CONCILIADO`, `NAO_IDENTIFICADO`, `FALHOU`.

**Codigos de retorno e erros relevantes**:
- Desembolso: `201` novo, `200` idempotente, `403` sem role/step-up, `404` contrato inexistente, `409` idempotencia divergente ou desembolso duplicado, `422` inelegibilidade (contrato nao assinado, sem agenda, escrow inoperante, valor divergente).
- Status de desembolso: `200` com estado local/sincronizado; provider indisponivel deve aparecer como estado rastreavel, nao como sucesso falso.
- Referencia de recebimento: `201` nova, `200` idempotente, `403` sem role, `404` parcela inexistente, `409` concorrencia/referencia ativa existente quando aplicavel, `422` parcela inelegivel.
- Recebimento: `200` leitura, `404` inexistente/sem acesso, `403` sem role.

**Decisoes da sprint**:
- Frontend nao calcula elegibilidade de contrato, valor financiado, saldo de parcela, multa, mora, status Pix, conciliacao ou movimentacao escrow.
- `Idempotency-Key` do desembolso e gerada por tentativa e mantida apenas enquanto o submit daquela tentativa esta pendente. Nao persistir em `localStorage`/`sessionStorage`; descartar ao alterar payload ou apos sucesso/erro final.
- Chave Pix destino trafega apenas no request de desembolso. Nunca logar, persistir em storage, exibir novamente em claro ou incluir em fixture com dado real.
- Step-up e reusado, nao recriado. Adicionar ao `stepUpInterceptor` apenas as rotas sensiveis (`POST /pix/desembolsos` e `POST /pix/desembolsos/{id}/status`), sem aplicar token em leitura nem em geracao de referencia.
- Recebimentos Pix vinculados a parcelas devem se conectar visualmente com a jornada de cobranca quando houver rota/identificador disponivel, sem duplicar a tela de parcela nem criar baixa manual paralela.
- Divergencias aparecem como estado operacional claro e rastreavel. A UI nao deve mascarar `NAO_IDENTIFICADO`, `DIVERGENTE`, `FALHOU` ou provider indisponivel como sucesso.
- Backoffice continua dono do tratamento operacional de divergencias; a sprint Pix Web pode criar atalhos/filtros/contexto, mas nao duplica resolver/ignorar/comentar fora do fluxo existente.

**Fora de escopo da sprint**:
- Pix automatico, split Pix, gestao avancada de chaves, devolucao Pix e aporte real da credora.
- Self-service do tomador para gerar referencia Pix da propria parcela, salvo se houver ordem explicita e contrato backend confirmado.
- Recalcular conciliacao no frontend ou baixar parcela diretamente.
- Reenviar transferencia Pix falha a partir da UI.
- Expor payload bruto de webhook/provider, chave Pix completa, dados bancarios, CPF/CNPJ completo ou segredo de webhook.

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
- `clean-architecture`: componentes chamam services; regra Pix/financeira fica no backend; modelos TypeScript sao DTOs de borda, nao entidades de dominio duplicadas.

---

## Mapeamento spec 113 -> steps (rastreabilidade)

| Task da spec 113 | Onde e implementada nestes steps |
|------------------|----------------------------------|
| 1. Criar `PixService` e modelos web | F-13.1 |
| 2. Implementar desembolsos e status | F-13.3 |
| 3. Implementar recebimentos Pix e vinculo com parcela | F-13.4 |
| 4. Implementar conciliacao/divergencias | F-13.5 |
| 5. Integrar step-up/guards e testes | distribuido em F-13.2/F-13.3 e consolidado em F-13.6 |
| Gate: precheck backend Sprints 19-21 | F-13.0 |
| Gate: smoke E2E Pix com fake provider | F-13.6 |
| Gate: docs, PRD/CONTEXT e roadmap | F-13.6 |

---

## Protocolo de breakpoints recomendado

```text
C1 = F-13.0 + F-13.1
Prechecks + modelos/PixService/MSW base

C2 = F-13.2
Rotas, menu, shell e guards operacionais

C3 = F-13.3
Desembolso assistido + consulta/reconsulta de status com step-up

C4 = F-13.4
Referencias e recebimentos Pix vinculados a parcelas

C5 = F-13.5
Divergencias/conciliacao operacional e integracao com backoffice/cobranca

C6 = F-13.6
Smokes, testes de autorizacao/step-up, docs e fechamento
```

- C1 fecha contrato antes de UI.
- C2 abre navegacao operacional sem fluxo parcial escondido.
- C3 isola a acao mais sensivel da sprint.
- C4 entrega acompanhamento de recebimento sem duplicar cobranca.
- C5 garante rastreabilidade de divergencias.
- C6 fecha regressao, smoke e documentacao.

---

## Task F-13.0 - Prechecks da F-Sprint 13

**Objetivo**: confirmar base Git, scripts, contratos backend do modulo `pix` e a arquitetura atual do `sep-app` antes de criar UI.

**Esforco**: 1-2 horas.

### Step 113.0.1 - Conferir estado Git do `sep-app`

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
- F-Sprint 14 presente no historico, pois a UI deve nascer no New Design System SEP.

### Step 113.0.2 - Criar branch da sprint

**Comandos**:
```bash
cd <sep-app-root>
git switch develop
git pull --ff-only
git switch -c feature/fsprint-13-pix-web
```

**Verificacao**:
- Branch criada a partir de `develop` atualizado.
- Se `git pull --ff-only` falhar, abortar e avisar o usuario.

### Step 113.0.3 - Mapear estrutura atual do frontend

**Comandos**:
```bash
cd <sep-app-root>
find src/app/core -maxdepth 3 -type f | sort
find src/app/features/authenticated -maxdepth 5 -type f | sort
find src/app/layout -maxdepth 3 -type f | sort
find src/mocks -maxdepth 3 -type f | sort
sed -n '1,520p' src/app/core/api/api.models.ts
sed -n '1,260p' src/app/features/authenticated/authenticated.routes.ts
sed -n '1,220p' src/app/layout/sidenav/sidenav.component.ts
sed -n '1,200p' src/app/core/interceptors/step-up.interceptor.ts
grep -R "FINANCEIRO\|BACKOFFICE\|ADMIN\|roleGuard" -n src/app src/mocks
grep -R "cobranca\|backoffice\|Idempotency-Key\|step-up\|StepUp" -n src/app src/mocks
```

**Verificacao**:
- Padrao de service, modelos e paginas autenticadas localizado.
- Padrao de `Idempotency-Key` existente na cobranca identificado para reaproveitar ou adaptar.
- `stepUpInterceptor` e fluxo `/app/step-up?next=...` entendidos antes de adicionar rotas Pix.
- Sidenav e rotas operacionais existentes localizados para decidir se Pix vira grupo proprio ou subarea financeira.
- MSW disponivel para `dev-offline`.

### Step 113.0.4 - Confirmar contratos reais do backend

**Comandos**:
```bash
cd <sep-api-root>
grep -R "class.*Pix.*Controller\|pix/desembolsos\|pix/recebimentos" -n src/main/java
find src/main/java -path "*pix/web*" -type f | sort
sed -n '1,280p' src/main/java/com/dynamis/sep_api/pix/web/controller/*Controller.java
find src/main/java -path "*pix/web/dto*" -type f | sort
grep -R "RequireStepUp\|RequireStepUpEstrito\|hasRole\|Idempotency-Key" -n src/main/java/com/dynamis/sep_api/pix
grep -R "PIX-404\|PIX-409\|PIX-422\|providerIndisponivel\|novo" -n src/main/java/com/dynamis/sep_api/pix
grep -R "RECEBIMENTO_PIX_DIVERGENTE\|PIX_TRANSFERENCIA\|PixRecebimentoObjetoOriginalAdapter" -n src/main/java/com/dynamis/sep_api
```

**Verificacao**:
- Endpoints, metodos, status HTTP e DTOs batem com a secao "Contratos backend consumidos".
- `POST /pix/desembolsos` exige step-up estrito e `Idempotency-Key`.
- `POST /pix/desembolsos/{id}/status` exige step-up.
- `POST /pix/recebimentos/referencias` nao exige step-up.
- Roles reais por endpoint confirmadas antes de fixar `data.roles` no frontend.
- Campos e nullability dos DTOs registrados para fixar os modelos TypeScript sem `any`.

### Step 113.0.5 - Rodar baseline web

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

### Definicao de pronto da Task F-13.0
- [ ] Branch correta criada.
- [ ] Baseline web verde com contagem registrada.
- [ ] Contratos backend Pix Sprints 19-21 confirmados.
- [ ] Modelo de acesso por role e step-up confirmado.
- [ ] Gaps reais registrados antes de iniciar UI.

---

## Task F-13.1 - PixService, modelos e MSW base

**Objetivo**: criar a borda de API da feature Pix sem UI complexa, com modelos TypeScript fieis aos DTOs backend e mocks suficientes para desenvolvimento offline.

**Pre-requisito**: Task F-13.0 concluida.

**Esforco**: 1 dia.

### Step 113.1.1 - Criar modelos de Pix

**Arquivos provaveis**:
- `src/app/core/api/api.models.ts`
- ou arquivo local seguindo padrao existente, se o projeto separar modelos por feature.

**Implementacao**:
- Adicionar unions/enums TypeScript para status de transferencia, referencia e recebimento conforme DTO real.
- Adicionar interfaces de request/response para desembolso, status, referencia e recebimento.
- Datas ficam como `string` ISO na borda de API; formatacao pertence a componente/helper de apresentacao.
- Valores monetarios ficam como `number` para exibicao; nenhuma regra financeira no modelo.
- Campos sensiveis: chave Pix em claro so existe em `SolicitarDesembolsoPixRequest`.

**Verificacao**:
- Nenhum modelo cria metodo calculado para elegibilidade, conciliacao ou permissao.
- Campos opcionais refletem nullable real do backend, nao conveniencia visual.
- Nenhum `any` introduzido.

### Step 113.1.2 - Criar `PixService`

**Arquivos provaveis**:
- `src/app/core/pix/pix.service.ts`
- `src/app/core/pix/pix.service.spec.ts`

**Metodos minimos**:
- `solicitarDesembolso(request, idempotencyKey)`.
- `consultarDesembolso(id)`.
- `consultarStatusDesembolso(id)`.
- `gerarReferenciaRecebimento(request)`.
- `consultarReferenciaRecebimento(id)`.
- `consultarRecebimento(id)`.

**Regras de implementacao**:
- Usar `HttpClient` e configuracao de base URL ja existente.
- `solicitarDesembolso` envia `Idempotency-Key` por header recebido do componente/use helper.
- Nenhum metodo recebe ou envia token de step-up; o interceptor faz isso.
- Nenhum componente chama endpoints Pix diretamente.
- Diferenciar erro de dominio (`409`, `422`) de erro global para a UI orientar acao sem mascarar falha.

**Verificacao**:
- Specs validam URL, metodo HTTP, body e headers esperados.
- Specs validam que leituras nao enviam `Idempotency-Key`.
- Specs validam que o service nao manipula `X-Step-Up-Token`.

### Step 113.1.3 - Adicionar fixtures MSW de Pix

**Arquivos provaveis**:
- `src/mocks/handlers.ts`
- `src/mocks/data/pix.mock.ts` ou padrao equivalente.

**Cenarios minimos**:
- Usuario `financeiro`/`admin` consegue solicitar desembolso com `201` e consultar status.
- Reenvio com mesma `Idempotency-Key` e mesmo payload retorna `200` idempotente; payload divergente retorna `409`.
- Desembolso inelegivel retorna `422` com motivo operacional.
- Sem step-up nas rotas sensiveis retorna `403` conforme padrao atual dos mocks.
- Geracao de referencia retorna `201`; reaproveitamento por parcela retorna `200`.
- Recebimento `CONCILIADO` vinculado a parcela.
- Recebimento `NAO_IDENTIFICADO` ou divergente visivel para backoffice/financeiro.
- Provider indisponivel em status de desembolso nao vira sucesso falso.

**Verificacao**:
- Fixtures nao armazenam chave Pix real, payload de provider, dados bancarios ou CPF/CNPJ completo.
- MSW cobre estados felizes e divergentes usados pelas telas.

### Step 113.1.4 - Testar service e mocks

**Comandos**:
```bash
cd <sep-app-root>
npm run test -- --run pix
npm run lint -- --quiet
npm run lint:scss
```

**Verificacao**:
- Testes do `PixService` passam.
- Lint TS/SCSS sem regressao.

### Definicao de pronto da Task F-13.1
- [ ] Modelos Pix adicionados e fieis aos DTOs reais.
- [ ] `PixService` criado com cobertura de URLs, metodos, body e headers.
- [ ] MSW cobre desembolso, status, referencia, recebimento e divergencia.
- [ ] Nenhum token step-up ou dado sensivel manipulado fora do lugar correto.

### Commit sugerido
```text
feat(web): adicionar borda de api pix operacional
```

---

## Task F-13.2 - Rotas, menu e shell Pix operacional

**Objetivo**: expor a area Pix no shell autenticado com guard correto e navegacao coerente com o New Design System SEP.

**Pre-requisito**: Task F-13.1 concluida.

**Esforco**: 0,5-1 dia.

### Step 113.2.1 - Definir ancoragem de rota

**Direcao recomendada**:
- Criar area `/app/pix` se o `sep-app` ja usa grupos por jornada operacional.
- Alternativamente, aninhar em area financeira existente se houver padrao consolidado.
- Evitar duplicar telas de cobranca/backoffice; criar links contextuais quando necessario.

**Verificacao**:
- Decisao documentada no checkpoint.
- Rotas existentes de cobranca/backoffice continuam funcionando.

### Step 113.2.2 - Criar shell e rotas filhas

**Rotas minimas sugeridas**:
- `/app/pix` -> dashboard/entrada operacional.
- `/app/pix/desembolsos` -> lista/consulta e acao de novo desembolso.
- `/app/pix/desembolsos/:id` -> detalhe/status.
- `/app/pix/recebimentos` -> referencias/recebimentos.
- `/app/pix/recebimentos/:id` -> detalhe do recebimento.
- `/app/pix/divergencias` -> filtro/atalho para divergencias Pix, reusando backoffice quando possivel.

**Verificacao**:
- Lazy loading/padrao de rotas segue o repo.
- `data.roles` reflete roles reais (`FINANCEIRO`, `ADMIN`, `BACKOFFICE`) sem liberar `CLIENTE`.
- Acoes restritas (`novo desembolso`, `gerar referencia`) ficam visiveis apenas para roles autorizadas e continuam dependendo do backend.

### Step 113.2.3 - Adicionar menu/sidenav

**Implementacao**:
- Adicionar item `Pix` ou equivalente operacional seguindo o padrao visual atual.
- Roles de visibilidade: `FINANCEIRO`, `ADMIN`, `BACKOFFICE`.
- Evitar novo grupo se o menu existente ja tiver secao financeira adequada.

**Verificacao**:
- `CLIENTE` nao ve nem acessa a area.
- `BACKOFFICE` ve leitura/divergencias, mas nao recebe CTA de iniciar desembolso se nao autorizado.

### Step 113.2.4 - Testar rotas e guards

**Comandos**:
```bash
cd <sep-app-root>
npm run test -- --run pix
npm run test -- --run sidenav
npm run lint -- --quiet
npm run lint:scss
```

**Verificacao**:
- Rotas carregam componentes esperados.
- Guard bloqueia role nao autorizada.
- Sidenav respeita roles.

### Definicao de pronto da Task F-13.2
- [ ] Area Pix navegavel por roles internas autorizadas.
- [ ] `CLIENTE` bloqueado no guard e no menu.
- [ ] Shell visual segue New Design System SEP.
- [ ] Nenhuma regra de autorizacao backend duplicada como regra de negocio local.

### Commit sugerido
```text
feat(web): criar area operacional pix
```

---

## Task F-13.3 - Desembolso assistido e status

**Objetivo**: permitir que `FINANCEIRO`/`ADMIN` solicitem desembolso Pix assistido e que roles internas acompanhem/reconsultem status quando permitido.

**Pre-requisito**: Task F-13.2 concluida.

**Esforco**: 1-1,5 dia.

### Step 113.3.1 - Criar tela de lista/entrada de desembolsos

**Implementacao**:
- Se o backend nao expuser listagem global de desembolsos, nao inventar lista local. Oferecer busca/entrada por `id` ou links contextuais a partir de contrato/backoffice quando houver.
- Exibir estados operacionais com badges semanticos.
- Exibir empty/error/loading states.

**Verificacao**:
- UI nao promete listagem se o contrato backend nao existir.
- Estados terminais e falhas ficam visiveis.

### Step 113.3.2 - Criar formulario de novo desembolso

**Campos minimos**:
- `contratoId`.
- `valor`.
- `chavePixDestino`.

**Regras de implementacao**:
- Gerar `Idempotency-Key` por tentativa de submit.
- Desabilitar submit durante envio.
- Descartar a key ao alterar payload ou apos resposta final.
- Nao persistir chave Pix em storage nem reexibir em claro apos sucesso.
- Confirmacao visual deve deixar claro que a acao exige step-up e e assistida.

**Verificacao**:
- `403` sem step-up redireciona pelo fluxo existente.
- `409` idempotencia divergente/duplicidade mostra mensagem operacional.
- `422` inelegibilidade mostra motivo retornado sem recalcular regra.

### Step 113.3.3 - Criar detalhe/status do desembolso

**Implementacao**:
- Consumir `GET /pix/desembolsos/{id}` para leitura local.
- Exibir valor, contrato, status, mascara da chave, data e flags de provider quando existirem.
- Botao de reconsulta (`POST /status`) para roles permitidas, com step-up.
- Provider indisponivel deve aparecer como alerta/estado rastreavel.

**Verificacao**:
- `POST /status` passa pelo `stepUpInterceptor`.
- `GET` nao chama provider nem exige step-up.
- Status `FALHOU`/`CANCELADA` nao e apresentado como sucesso.

### Step 113.3.4 - Testar desembolso

**Comandos**:
```bash
cd <sep-app-root>
npm run test -- --run pix
npm run test -- --run step-up
npm run lint -- --quiet
npm run lint:scss
```

**Verificacao**:
- Formulario cobre sucesso, `403`, `409`, `422` e erro de provider/status.
- Tests do interceptor cobrem rotas Pix sensiveis.

### Definicao de pronto da Task F-13.3
- [ ] `FINANCEIRO`/`ADMIN` solicitam desembolso com idempotencia e step-up.
- [ ] Roles autorizadas consultam/reconsultam status sem falso sucesso.
- [ ] Chave Pix em claro nao e persistida nem reexibida.
- [ ] Erros de dominio ficam acionaveis para operacao.

### Commit sugerido
```text
feat(web): implementar desembolso pix assistido
```

---

## Task F-13.4 - Referencias e recebimentos Pix vinculados a parcelas

**Objetivo**: permitir que a operacao gere/reaproveite referencia Pix para parcela e acompanhe recebimentos conciliados ou pendentes/divergentes.

**Pre-requisito**: Task F-13.3 concluida.

**Esforco**: 1 dia.

### Step 113.4.1 - Criar fluxo de geracao de referencia

**Implementacao**:
- Formulario/acao recebe o identificador da parcela exigido pelo backend.
- Consumir `POST /pix/recebimentos/referencias`.
- Tratar `201` como referencia nova e `200` como reaproveitamento idempotente.
- Exibir `txid`/copia-cola apenas se o backend expuser.

**Verificacao**:
- Nao exigir step-up.
- `422` parcela inelegivel mostra motivo retornado.
- UI nao cria referencia local falsa quando API falha.

### Step 113.4.2 - Criar detalhe de referencia Pix

**Implementacao**:
- Consumir `GET /pix/recebimentos/referencias/{id}`.
- Exibir status da referencia, valor, parcela vinculada e datas.
- Criar link para a parcela/cobranca quando rota e identificador existirem.

**Verificacao**:
- Link para cobranca nao quebra quando a rota nao existir; nesse caso registrar gap.
- Status `DIVERGENTE` fica destacado.

### Step 113.4.3 - Criar detalhe de recebimento Pix

**Implementacao**:
- Consumir `GET /pix/recebimentos/{id}`.
- Exibir status (`CONCILIADO`, `NAO_IDENTIFICADO`, `FALHOU`, etc.), valor, parcela/referencia quando houver e motivo operacional quando retornado.
- Linkar para cobranca/backoffice quando aplicavel.

**Verificacao**:
- Recebimento sem referencia nao e tratado como erro de UI; e divergencia operacional.
- Recebimento conciliado mostra vinculo com parcela sem recalcular baixa.

### Step 113.4.4 - Testar recebimentos

**Comandos**:
```bash
cd <sep-app-root>
npm run test -- --run pix
npm run lint -- --quiet
npm run lint:scss
```

**Verificacao**:
- Testes cobrem referencia nova, referencia reaproveitada, parcela inelegivel, recebimento conciliado e recebimento nao identificado.

### Definicao de pronto da Task F-13.4
- [ ] Referencia Pix gerada/reaproveitada pelo backend.
- [ ] Recebimentos ficam consultaveis e vinculados a parcela quando houver vinculo.
- [ ] Divergencias nao sao escondidas.
- [ ] Nenhuma baixa ou conciliacao e calculada no frontend.

### Commit sugerido
```text
feat(web): implementar recebimentos pix operacionais
```

---

## Task F-13.5 - Conciliacao assistida e divergencias

**Objetivo**: tornar divergencias Pix visiveis e rastreaveis no web, preferindo reaproveitar o backoffice existente em vez de duplicar tratamento operacional.

**Pre-requisito**: Task F-13.4 concluida.

**Esforco**: 0,5-1 dia.

### Step 113.5.1 - Mapear integracao com backoffice

**Implementacao**:
- Confirmar filtros/rotas existentes para `RECEBIMENTO_PIX_DIVERGENTE` e `PIX_RECEBIMENTO`.
- Se o backoffice ja lista esses itens, criar atalho/filtro a partir da area Pix.
- Se faltar filtro visual, adicionar filtro sem alterar contrato backend.

**Verificacao**:
- Acoes de resolver/ignorar/comentar continuam no fluxo backoffice.
- A area Pix nao duplica logica de fila.

### Step 113.5.2 - Exibir painel de divergencias Pix

**Implementacao**:
- Mostrar contadores/lista se houver endpoint existente que forneca dados.
- Caso nao haja endpoint dedicado, usar link filtrado para backoffice e registrar gap de endpoint dedicado.
- Estados minimos: referencia desconhecida, referencia nao ativa, `endToEndId` ausente, valor parcial/maior, falha de baixa.

**Verificacao**:
- Nenhum caso divergente e apresentado como recebido quitado.
- Copy operacional orienta consulta/tratamento sem prometer reprocesso de provider.

### Step 113.5.3 - Reprocesso/consulta operacional suportado

**Implementacao**:
- Para desembolso, expor reconsulta de status (`POST /desembolsos/{id}/status`) ja implementada em F-13.3.
- Para recebimento divergente, nao criar reprocesso de provider. Encaminhar para backoffice.
- Para reprocesso de `PIX_TRANSFERENCIA` via backoffice, apenas linkar/reusar fluxo existente se ja estiver implementado.

**Verificacao**:
- UI nao oferece "reenviar Pix".
- UI nao oferece "reprocessar provider" para recebimento Pix.

### Step 113.5.4 - Testar divergencias

**Comandos**:
```bash
cd <sep-app-root>
npm run test -- --run pix
npm run test -- --run backoffice
npm run lint -- --quiet
npm run lint:scss
```

**Verificacao**:
- Testes cobrem link/filtro de divergencias e ausencia de reprocesso indevido.
- Regressao de backoffice continua verde.

### Definicao de pronto da Task F-13.5
- [ ] Divergencias Pix ficam visiveis e rastreaveis.
- [ ] Tratamento operacional reusa backoffice.
- [ ] Reprocesso/consulta respeita o que a API suporta.
- [ ] Nenhuma acao perigosa ou inexistente e oferecida.

### Commit sugerido
```text
feat(web): expor divergencias pix operacionais
```

---

## Task F-13.6 - Testes, smoke e fechamento

**Objetivo**: consolidar autorizacao, step-up, smoke Pix com fake provider e atualizacao documental da sprint.

**Pre-requisito**: Tasks F-13.0 a F-13.5 concluidas.

**Esforco**: 0,5-1 dia.

### Step 113.6.1 - Regressao automatizada web

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
- Falhas preexistentes, se houver, registradas com evidencia e owner.

### Step 113.6.2 - Smoke offline com MSW

**Fluxos minimos**:
- Login como `FINANCEIRO` ou `ADMIN`.
- Abrir area Pix.
- Solicitar desembolso com step-up e ver status.
- Reconsultar status.
- Gerar referencia de recebimento.
- Consultar recebimento conciliado.
- Consultar divergencia Pix e navegar para backoffice/filtro.
- Confirmar que `CLIENTE` nao ve/acessa Pix.

**Comandos sugeridos**:
```bash
cd <sep-app-root>
npx playwright test pix
```

**Verificacao**:
- Smoke offline passa ou, se nao houver Playwright dedicado, registrar smoke manual com passos e evidencias.

### Step 113.6.3 - Smoke com backend real e fake provider

**Pre-condicoes**:
- `sep-api` rodando com `app.pix.provider=fake` e `app.escrow.provider=fake`.
- Usuario com role interna e MFA/step-up configurado.
- Dados elegiveis: contrato assinado, agenda ativa, escrow operacional e parcela elegivel.

**Fluxos minimos**:
- Desembolso elegivel: criar e consultar status.
- Desembolso inelegivel: confirmar `422` apresentado corretamente.
- Referencia de recebimento: gerar/reaproveitar.
- Recebimento/divergencia: validar visualizacao se houver fixture/evento disponivel.

**Verificacao**:
- UI nao mascara `403`, `409`, `422` ou provider indisponivel.
- Nenhum dado sensivel aparece em console, storage ou tela.

### Step 113.6.4 - Atualizar documentacao operacional

**Arquivos provaveis**:
- `docs-SEP/repos/sep-app/README.md`
- `docs-SEP/AI-ROADMAP.md`
- `docs-SEP/docs-sep/CONTEXT-PARTE-2.md` e/ou PRD de fase, se a sprint for concluida.
- `docs-SEP/repos/sep-app/SPRINT-F-13-PR.md` no fechamento da sprint.

**Verificacao**:
- Rotas, contratos consumidos, decisoes e testes da jornada Pix Web documentados.
- Roadmap aponta para spec/step quando aplicavel.
- PR description temporaria criada ao fim da sprint, seguindo padrao dos PRs anteriores.

### Step 113.6.5 - Checkpoint final pre-commit

**Comandos**:
```bash
cd <sep-app-root>
git status --short --branch
git diff --stat
```

**Relatorio obrigatorio**:
- Arquivos criados/modificados/removidos.
- Testes/build/lint executados e resultado.
- Smokes executados e resultado.
- Riscos/pendencias.
- Sugestao de mensagem de commit.

### Definicao de pronto da Task F-13.6
- [ ] Testes, lint, SCSS lint e build executados.
- [ ] Smoke offline Pix validado.
- [ ] Smoke real com fake provider executado ou pendencia justificada.
- [ ] Docs operacionais/roadmap atualizados.
- [ ] `SPRINT-F-13-PR.md` criado no fechamento da sprint.

### Commit sugerido
```text
feat(web): concluir jornada pix operacional
```

---

## Definition of Done da F-Sprint 13

Sprint mergeada em `origin/develop` via PR #53 (`8ab6a80`), 2026-06-11. Promocao para `main` e
smoke real `:8080` pendentes (ver follow-ups).

- [x] Financeiro opera Pix assistido pelo web.
- [x] Desembolso Pix usa step-up e idempotencia sem expor chave em claro.
- [x] Status de transferencia Pix e consultavel e nao mascara falha como sucesso.
- [x] Recebimentos Pix ficam vinculados a parcelas quando conciliados.
- [x] Divergencias Pix ficam visiveis, rastreaveis e encaminhadas ao backoffice.
- [x] `CLIENTE` nao acessa a area Pix operacional.
- [x] UI segue o New Design System SEP vigente no web.
- [x] Testes proporcionais ao risco executados (vitest 395 + `e2e/pix.spec.ts` 7/7).
- [x] Docs e PR description temporaria atualizados no fechamento.
