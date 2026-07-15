# Steps - F-Sprint 17 - Aprofundamento financeiro/conciliacao web

**Spec de origem**: [`117-fsprint-17-financeiro-conciliacao-web.md`](../../specs/fase-4/117-fsprint-17-financeiro-conciliacao-web.md)

**Status**: concluida em 2026-07-15 — PR #92 para `develop` (squash `2dfa0fd`; 3 commits
absorvidos) e PR #93 para `main` (`develop` == `main`). **Classificacoes finais do gap
analysis (matriz aprovada pelo usuario na F-17.1)**: IMPLEMENTAR = divergencias Pix com recorte
de status enviado ao backend (default ABERTO; "Todos" omite o param) + contagens via
`PageResponse.totalElements` com aviso de pagina parcial (F-17.2, commit `cfcfa52`);
JA_COBERTO = lista de recebimentos manuais (F-9), jornada de desembolso/recebimento Pix (F-13),
navegacao de tratamento e reprocessos com step-up (F-10), dashboard (F-10) — F-17.4 encerrada sem
codigo; CONTRATO_AUSENTE (follow-ups backend, nada simulado no front) = paginacao/filtros em
`GET /cobranca/recebimentos`, recebimentos por parcela para perfil financeiro, listagem Pix por
operacao/contrato, DTO consolidado server-side (F-17.3 encerrada sem codigo);
FORA_DE_ESCOPO = chaves Pix (F-18), tomador/credora/BI/boleto/Pix automatico. F-17.5: fixture MSW
de divergencia RESOLVIDA + specs de rede e recorte server-side (commit `80e1c29`). Gate final:
lint, lint:scss, Vitest 491, build e Playwright 27/27 (novo smoke do filtro de status).

**Objetivo geral**: fechar somente gaps comprovados da jornada interna de financeiro/conciliacao no
`sep-app`, consumindo contratos ja existentes dos modulos `cobranca`, `pix` e `backoffice`. O
frontend apresenta dados autoritativos e conduz comandos suportados; conciliacao, elegibilidade,
status, somatorios, ownership, auditoria, escrow e chamadas de provider permanecem no backend.

**Esforco total estimado**: 2-4 dias de Dev Pleno Frontend, sujeito ao escopo aprovado no Gate
F-17.1. Se o gap analysis concluir que todas as superficies viaveis ja foram entregues nas F-Sprints
10 e 13, a sprint pode fechar como auditoria/documentacao, sem mudanca funcional artificial.

**Repos de destino**:

- `sep-app`: alterado apenas para gaps frontend confirmados e suportados por contrato atual.
- `docs-SEP`: matriz de gaps e documentacao de fechamento; toda operacao Git permanece manual.

**Branch sugerida**: `feature/fsprint-17-financeiro-conciliacao-web`.

## Hipotese inicial a confirmar

A base atual ja cobre parte substancial da spec 117:

- F-Sprint 9: agenda financeira, detalhe da parcela, recebimento manual e inadimplencia;
- F-Sprint 10: dashboard/fila de backoffice, detalhe operacional, resolver/ignorar e reprocessos
  com step-up;
- F-Sprint 13: desembolso Pix, referencia/recebimento Pix, status, divergencias e atalho para o
  backoffice;
- backend: `GET /cobranca/recebimentos` lista recebimentos manuais; os contratos Pix operacionais
  oferecem consulta de desembolso, referencia e recebimento apenas por ID;
- nao existe hoje endpoint Pix de listagem por operacao/contrato, nem endpoint consolidado que una
  recebimentos e desembolsos por operacao.

Essa hipotese nao autoriza pular o inventario. A Task F-17.1 deve confirmar codigo, OpenAPI/DTOs,
roles e comportamento atuais antes de liberar qualquer implementacao.

## Regra de decisao do escopo

Cada gap candidato recebe exatamente uma classificacao:

| Classificacao | Significado | Acao |
|---------------|-------------|------|
| `IMPLEMENTAR` | Contrato backend atual suporta o caso e falta uma superficie web relevante | Liberar a menor mudanca frontend |
| `JA_COBERTO` | Fluxo e estados ja existem e possuem cobertura proporcional | Registrar evidencia; nao duplicar |
| `CONTRATO_AUSENTE` | Endpoint/campo/filtro necessario nao existe | Registrar dependencia backend; nao simular no frontend |
| `FORA_DE_ESCOPO` | Pertence a tomador, credora, BI, Pix automatico ou Fase 5 | Registrar e excluir |

Regras obrigatorias:

- nao criar lista a partir de IDs conhecidos em fixture, storage, query string ou constantes;
- nao montar consolidacao por N+1 de endpoints `GET /pix/.../{id}`;
- nao somar, reconciliar, inferir status ou correlacionar operacoes no browser;
- nao duplicar assumir/comentar/resolver/ignorar/reprocessar fora do backoffice;
- nao alterar `sep-api` nesta sprint;
- qualquer `CONTRATO_AUSENTE` vira follow-up backend explicito, sem placeholder que pareca funcional.

## Contratos atuais a reconfirmar

### Cobranca

```http
GET /api/v1/cobranca/recebimentos
GET /api/v1/cobranca/inadimplencia
GET /api/v1/cobranca/parcelas/{id}
POST /api/v1/cobranca/parcelas/{id}/recebimentos
```

- `FINANCEIRO`/`ADMIN` nas superficies operacionais.
- A listagem de recebimentos nao possui paginacao nem filtros por contrato/operacao na base atual.
- Valores, saldo, mora, multa e status sao retornados pelo backend; o web nao recalcula.

### Pix operacional

```http
POST /api/v1/pix/desembolsos
GET  /api/v1/pix/desembolsos/{id}
POST /api/v1/pix/desembolsos/{id}/status
POST /api/v1/pix/recebimentos/referencias
GET  /api/v1/pix/recebimentos/referencias/{id}
GET  /api/v1/pix/recebimentos/{id}
```

- `POST /desembolsos`: `FINANCEIRO`/`ADMIN`, step-up estrito e `Idempotency-Key`.
- `GET` operacionais: `FINANCEIRO`/`ADMIN`/`BACKOFFICE`, leitura local.
- `POST /desembolsos/{id}/status`: mesmas roles de leitura e step-up; somente reconsulta o provider.
- Referencia: geracao por `FINANCEIRO`/`ADMIN`, sem step-up; consultas incluem `BACKOFFICE`.
- Nao ha listagem Pix por operacao/contrato na base atual. Confirmar novamente no precheck.

### Backoffice financeiro

```http
GET   /api/v1/backoffice/dashboard
GET   /api/v1/backoffice/fila
GET   /api/v1/backoffice/fila/{id}
POST  /api/v1/backoffice/fila/{id}/assumir
POST  /api/v1/backoffice/fila/{id}/comentarios
PATCH /api/v1/backoffice/fila/{id}/resolver
PATCH /api/v1/backoffice/fila/{id}/ignorar
POST  /api/v1/backoffice/reprocessos/webhook/{webhookEventId}
POST  /api/v1/backoffice/reprocessos/provider/{tipoChamada}/{entidadeId}
```

- Fila aceita filtros, paginacao e ordenacao do backend.
- `RECEBIMENTO_PIX_DIVERGENTE` e `DESEMBOLSO_PIX_FALHOU` ja alimentam a jornada Pix.
- Resolver, ignorar e reprocessar exigem step-up.
- Recebimento Pix divergente nao tem reprocesso de provider; o dinheiro ja entrou e o tratamento e
  assistido na fila.
- `PIX_TRANSFERENCIA` apenas reconsulta status; nunca reenvia a transferencia.

## Fora de escopo

- endpoint, migration ou regra nova no `sep-api`;
- Pix automatico, split, devolucao, boleto ou integracao real Celcoin;
- BI, exportacao financeira e agregados calculados no frontend;
- self-service do tomador ou jornada da credora;
- gestao de chaves Pix da Sprint 31 (avaliada na F-18 quando aplicavel);
- reprocesso local de recebimento Pix `FALHOU`, ainda ausente no backend;
- refactor amplo das features `cobranca`, `pix` ou `backoffice`.

## Protocolo obrigatorio por Task

1. Executar somente a Task liberada pelo usuario.
2. Confirmar codigo e contrato atuais antes de editar.
3. Aplicar a regra `IMPLEMENTAR | JA_COBERTO | CONTRATO_AUSENTE | FORA_DE_ESCOPO`.
4. Implementar a menor mudanca coerente apenas para itens `IMPLEMENTAR`.
5. Rodar verificacoes proporcionais ao risco.
6. Parar em checkpoint pre-commit com arquivos, testes, riscos e mensagem sugerida.
7. Aguardar aprovacao antes de `git add`/`git commit`; usar somente paths especificos.
8. Nao iniciar a Task seguinte sem ordem explicita.

**Skills obrigatorias durante a implementacao**:

- `coding-guidelines`: suposicoes explicitas, simplicidade e mudancas cirurgicas;
- `clean-code`: nomes intencionais, componentes focados e testes legiveis;
- `clean-architecture`: componente chama service; regra financeira fica no backend; DTO TypeScript
  permanece modelo de borda.

## Rastreabilidade spec 117 -> steps

| Task da spec 117 | Steps |
|------------------|-------|
| 1. Auditar gaps financeiros/conciliacao | F-17.1 |
| 2. Visao de conciliacao/divergencias pendentes | F-17.2 |
| 3. Visao consolidada por operacao | F-17.3 |
| 4. Reprocesso/backoffice financeiro com step-up | F-17.4 |
| 5. MSW, Vitest, erro e autorizacao | F-17.5 |
| 6. Smoke Playwright + docs | F-17.6 |
| Gate de cadeia Git, contratos e baseline | F-17.0 |

## Ordem de execucao

```text
F-17.0 prechecks
  -> F-17.1 gap analysis + aprovacao do recorte
      -> F-17.2 divergencias (somente itens IMPLEMENTAR)
      -> F-17.3 consolidacao (somente com contrato suficiente)
      -> F-17.4 reprocessos (somente lacunas reais)
  -> F-17.5 testes/mocks dos itens implementados
  -> F-17.6 smoke, docs e fechamento
```

F-17.1 e um gate bloqueante. F-17.2-F-17.4 nao podem comecar antes de o usuario aprovar a matriz e
o recorte `IMPLEMENTAR`.

---

## Gate F-17.0 - Prechecks e baseline

**Objetivo**: confirmar cadeia Git, contratos backend e base web antes do gap analysis.

### Step 117.0.1 - Confirmar cadeia Git do `sep-app`

```bash
cd <sep-app-root>
git fetch --all --prune
git status --short --branch
git log --oneline --decorate -15 origin/develop
git log --oneline --decorate -10 origin/main
git rev-list --left-right --count origin/main...origin/develop
```

**Verificacao**:

- F-Sprint 16 e o follow-up de review/e2e presentes em `origin/develop`.
- `main` integrada em `develop`, ou pendencia registrada antes de criar branch.
- Working tree limpa ou mudancas do usuario identificadas e preservadas.

### Step 117.0.2 - Tratar artefato temporario e criar branch

- Em `docs-SEP`, remover `repos/sep-app/SPRINT-F-16-PR.md` somente se ja foi usado no PR.
- Git de `docs-SEP` continua manual.

```bash
cd <sep-app-root>
git switch develop
git pull --ff-only
git switch -c feature/fsprint-17-financeiro-conciliacao-web
```

### Step 117.0.3 - Reconfirmar endpoints e DTOs backend

```bash
cd <sep-api-root>
sed -n '1,240p' src/main/java/com/dynamis/sep_api/pix/web/controller/PixDesembolsoController.java
sed -n '1,220p' src/main/java/com/dynamis/sep_api/pix/web/controller/PixRecebimentoController.java
sed -n '1,340p' src/main/java/com/dynamis/sep_api/cobranca/web/controller/CobrancaController.java
sed -n '1,360p' src/main/java/com/dynamis/sep_api/backoffice/web/controller/BackofficeController.java
sed -n '1,240p' src/main/java/com/dynamis/sep_api/backoffice/web/controller/BackofficeDashboardController.java
sed -n '1,260p' src/main/java/com/dynamis/sep_api/backoffice/web/controller/BackofficeReprocessoController.java
find src/main/java/com/dynamis/sep_api/{pix,cobranca,backoffice}/web/dto -type f | sort
rg -n "GetMapping|PostMapping|PatchMapping|RequireStepUp|PreAuthorize" \
  src/main/java/com/dynamis/sep_api/{pix,cobranca,backoffice}/web
```

**Verificacao**:

- metodo, path, roles, step-up, status HTTP, campos e nullability registrados.
- Confirmacao explicita de existencia ou ausencia de lista/filtro por operacao.
- Nenhuma credencial Celcoin/AWS necessaria; providers Fake/WireMock bastam.

### Step 117.0.4 - Mapear superficies web atuais

```bash
cd <sep-app-root>
find src/app/features/authenticated/{cobranca,pix,backoffice} -type f | sort
sed -n '1,220p' src/app/features/authenticated/pix/pix.routes.ts
sed -n '1,220p' src/app/core/pix/pix.service.ts
sed -n '1,220p' src/app/core/cobranca/cobranca.service.ts
sed -n '1,240p' src/app/core/backoffice/backoffice.service.ts
sed -n '1,220p' src/app/features/authenticated/pix/pages/divergencias-page.component.ts
sed -n '1,260p' src/app/features/authenticated/backoffice/pages/reprocessos-page.component.ts
rg -n "recebimento|desembolso|diverg|concili|reprocess" src/app src/mocks e2e
```

### Step 117.0.5 - Rodar baseline

```bash
cd <sep-app-root>
npm run lint
npm run lint:scss
npm run test
npm run build
npm run e2e
```

**Definicao de pronto do Gate F-17.0**:

- [ ] Cadeia Git confirmada.
- [ ] Contratos/roles/step-up reconfirmados.
- [ ] Superficies F-9/F-10/F-13 inventariadas.
- [ ] Baseline verde com contagens registradas, ou falha preexistente documentada.

---

## Task F-17.1 - Gap analysis e recorte aprovado

**Objetivo**: produzir evidencia comparavel e bloquear implementacao sem contrato.

**Pre-requisito**: Gate F-17.0 concluido.

### Step 117.1.1 - Criar matriz de capacidades

Avaliar ao menos:

- recebimentos manuais: lista, detalhe da parcela, filtro, paginacao e contexto de contrato;
- desembolso Pix: criacao, consulta local, reconsulta de provider e descoberta/listagem;
- recebimento Pix: referencia, detalhe, descoberta/listagem e vinculo com parcela;
- divergencias: fila, filtros, detalhe, navegacao e estados vazio/erro;
- reprocessos: tipos suportados, step-up, anti-abuso e resultado real/stub;
- dashboard: agregados existentes e proibicao de recalculo local.

Para cada linha registrar: endpoint, DTO/campos, roles, tela/rota atual, testes, classificacao,
impacto e menor acao possivel.

### Step 117.1.2 - Provar gaps candidatos

Um item so recebe `IMPLEMENTAR` quando:

1. existe jornada de usuario interna clara;
2. backend fornece todos os dados/operacoes necessarios;
3. a superficie atual nao cobre o caso;
4. a solucao nao exige correlacao ou regra local;
5. ha criterio de teste observavel.

### Step 117.1.3 - Registrar contratos ausentes

Para cada `CONTRATO_AUSENTE`, registrar o contrato minimo necessario, sem desenhar a implementacao
backend completa. Exemplos a confirmar: lista paginada/filtro de desembolsos por contrato/operacao;
lista/filtro de recebimentos Pix por parcela/operacao; DTO consolidado server-side.

### Step 117.1.4 - Checkpoint de escopo

Apresentar ao usuario:

- matriz completa;
- itens `IMPLEMENTAR` propostos;
- itens `JA_COBERTO` com evidencia;
- contratos ausentes e destino sugerido;
- arquivos previstos, testes e esforco revisado.

**Parar e aguardar aprovacao.** Nenhuma tela/service/modelo deve ser alterado antes desse
checkpoint.

**Definicao de pronto da Task F-17.1**:

- [ ] Toda task funcional da spec classificada.
- [ ] Nenhum endpoint/campo presumido.
- [ ] Recorte `IMPLEMENTAR` aprovado pelo usuario.
- [ ] Sprint docs-only aceita explicitamente se nao houver gap frontend viavel.

### Commit sugerido, somente se houver artefato versionado no `sep-app`

```text
docs(web): registrar gap analysis financeiro da f-sprint 17
```

---

## Task F-17.2 - Visao de conciliacao e divergencias pendentes

**Objetivo**: fechar apenas lacunas aprovadas na visibilidade de divergencias, preservando a fila do
backoffice como fonte operacional.

**Pre-requisito**: F-17.1 aprovada com ao menos um item `IMPLEMENTAR` nesta frente.

### Step 117.2.1 - Reusar contrato de fila

- Consumir `BackofficeService.listarFila` com filtros suportados pelo backend.
- Nao criar `ConciliacaoService` se ele apenas duplicar o backoffice.
- Nao carregar mais de uma pagina silenciosamente nem apresentar contagem parcial como total.
- Preservar `PageResponse.totalElements` quando a UI exibir contadores.

### Step 117.2.2 - Implementar o menor complemento visual

Possibilidades somente se aprovadas na matriz:

- filtro/estado ausente na pagina `/app/pix/divergencias`;
- navegacao segura para detalhe da fila ou detalhe Pix usando IDs ja retornados pela API;
- distincao textual entre recebimento divergente (tratamento manual) e desembolso falho (reconsulta
  de status), sem prometer reenvio.

Reusar New Design System SEP, componentes de chip/status e estados acessiveis existentes.

### Step 117.2.3 - Testar comportamento

Cobrir itens implementados, incluindo:

- roles `FINANCEIRO`/`ADMIN`/`BACKOFFICE` conforme rota/endpoint;
- filtros e paginacao enviados exatamente como contrato;
- loading, vazio, erro e retry;
- contagem do backend, sem `array.length` quando a pagina e parcial;
- nenhum reprocesso de provider oferecido para `RECEBIMENTO_PIX_DIVERGENTE`.

**Definicao de pronto da Task F-17.2**:

- [ ] Somente gaps aprovados implementados.
- [ ] Backoffice segue dono das transicoes.
- [ ] Nenhuma contagem/regra de conciliacao derivada localmente.
- [ ] Testes focados verdes.

### Commit sugerido

```text
feat(web): fechar gaps de divergencias financeiras
```

---

## Task F-17.3 - Visao consolidada por operacao

**Objetivo**: entregar consolidacao somente se um contrato backend autoritativo ou filtros
suficientes forem confirmados na F-17.1.

**Pre-requisito bloqueante**: item `IMPLEMENTAR` aprovado com endpoint/campos concretos. Na ausencia
de lista/filtro por operacao, classificar `CONTRATO_AUSENTE` e encerrar esta task sem codigo.

### Step 117.3.1 - Validar fonte unica

A fonte deve fornecer, no minimo, identificador de operacao/contrato, tipo do movimento, valor,
status e instante. Se a tela exigir total consolidado, o total deve vir do backend.

Nao e permitido:

- juntar `GET /cobranca/recebimentos` com consultas Pix por ID descobertos fora do contrato;
- correlacionar por valor/data/texto;
- somar recebimentos/desembolsos no Angular;
- exibir uma lista global como se estivesse filtrada por operacao.

### Step 117.3.2 - Implementar borda e pagina somente com contrato suficiente

- Modelo TypeScript fiel ao DTO real, sem campos calculados.
- Metodo em service dono do endpoint; componente nao usa `HttpClient`.
- Rota dentro da area interna ja protegida por `roleGuard`.
- Filtros enviados ao backend; URL preserva apenas estado navegavel nao sensivel.
- Valores/status/datas apresentados com helpers existentes.

### Step 117.3.3 - Cobrir fidelidade

- URL, query params, roles e resposta tipada.
- Ordem, totais e status exatamente como recebidos.
- Estados vazio/erro/retry e ausencia de N+1.
- Nenhum dado sensivel ou payload bruto no DOM/storage/log.

**Definicao de pronto da Task F-17.3**:

- [ ] Contrato suficiente citado na matriz, ou task encerrada como `CONTRATO_AUSENTE`.
- [ ] Nenhuma consolidacao financeira calculada no frontend.
- [ ] Testes focados verdes quando houver implementacao.

### Commit sugerido, somente se implementada

```text
feat(web): adicionar visao financeira por operacao
```

---

## Task F-17.4 - Reprocessos e tratamento financeiro

**Objetivo**: fechar lacunas aprovadas de navegacao/acao sem duplicar as paginas de backoffice.

**Pre-requisito**: F-17.1 aprovada com item `IMPLEMENTAR` nesta frente.

### Step 117.4.1 - Mapear capacidade real por tipo

- webhook: reenfileirar apenas quando o endpoint fornece handler;
- `PIX_TRANSFERENCIA`: somente reconsultar status;
- `PIX_RECEBIMENTO`: sem reprocesso de provider;
- stubs backend devem aparecer como nao implementados, nunca sucesso operacional;
- `429` preserva anti-abuso, sem retry automatico.

### Step 117.4.2 - Reusar fluxo existente

- Preferir link contextual para `/app/backoffice/fila/:id` ou `/app/backoffice/reprocessos`.
- Nao copiar forms, allowlist de step-up ou mapeamento de `TipoChamadaProvider` para Pix.
- Se houver complemento aprovado, manter token apenas no `StepUpTokenStore`; service nunca recebe
  `X-Step-Up-Token`.

### Step 117.4.3 - Provar step-up e erros

- GETs/filtros nao consomem token.
- Resolver/ignorar/reprocessar usam allowlist exata.
- Ausencia/expiracao de token nao vira sucesso nem loop automatico.
- `404`/`409` recarregam estado; rede/`5xx` preservam resultado desconhecido; `429` orienta espera.

**Definicao de pronto da Task F-17.4**:

- [ ] Nenhuma acao duplicada fora do backoffice.
- [ ] Reprocesso oferecido apenas quando suportado.
- [ ] Step-up e anti-abuso cobertos.
- [ ] Nenhum falso sucesso.

### Commit sugerido

```text
feat(web): integrar tratamento financeiro ao backoffice
```

---

## Task F-17.5 - MSW, Vitest e matriz de autorizacao/erros

**Objetivo**: consolidar somente a cobertura exigida pelo recorte implementado.

**Pre-requisito**: tasks funcionais aprovadas concluidas ou F-17.1 encerrada como docs-only.

### Step 117.5.1 - Atualizar MSW sem inventar contrato

- Fixtures devem espelhar apenas endpoints reais.
- Reusar itens Pix existentes sempre que possivel.
- Cobrir pagina vazia, pagina parcial, erro, role proibida e estados financeiros relevantes.
- Nunca guardar chave Pix, payload de webhook/provider, dados bancarios, CPF/CNPJ ou token.

### Step 117.5.2 - Consolidar Vitest

Para cada item implementado, cobrir:

- service: metodo/path/query/header;
- component: dados autoritativos, navegacao, estados e acessibilidade;
- guard/role e step-up quando aplicavel;
- `403`/`404`/`409`/`422`/`429`/rede/`5xx` proporcionais ao fluxo;
- assercoes negativas de ausencia de calculo local, N+1 e acao indevida.

Se a sprint for docs-only, nao alterar mocks/testes para fabricar entrega.

### Step 117.5.3 - Rodar gate focado

```bash
cd <sep-app-root>
npm run test -- --run src/app/core/{pix,cobranca,backoffice}
npm run test -- --run src/app/features/authenticated/{pix,cobranca,backoffice}
npm run lint
npm run lint:scss
```

**Definicao de pronto da Task F-17.5**:

- [ ] Mocks correspondem a contratos reais.
- [ ] Cobertura acompanha somente codigo alterado.
- [ ] Seguranca e falhas nao produzem falso sucesso.
- [ ] Nenhum dado sensivel adicionado.

### Commit sugerido

```text
test(web): cobrir gaps financeiros da f-sprint 17
```

---

## Task F-17.6 - Smoke, documentacao e fechamento

**Objetivo**: validar o recorte aprovado e registrar com precisao o que foi entregue, ja coberto ou
bloqueado por contrato.

### Step 117.6.1 - Estender Playwright proporcionalmente

Adicionar cenarios somente para fluxo novo. Usar persona interna correta (`FINANCEIRO`, `ADMIN` ou
`BACKOFFICE`) e MSW/dev-offline.

Cenarios candidatos, quando implementados:

1. financeiro abre visao de divergencias e navega para o tratamento existente;
2. filtro/paginacao preserva totais do backend;
3. reprocesso sensivel navega para step-up e retorno nao executa automaticamente;
4. consolidacao por operacao exibe valores/status do endpoint autoritativo.

Nao duplicar smokes F-10/F-13 se nenhuma jornada mudou.

### Step 117.6.2 - Rodar gate final

```bash
cd <sep-app-root>
npm run lint
npm run lint:scss
npm run test
npm run build
npm run e2e
```

Smoke real recomendado apenas para acoes novas com backend local. Se depender de massa inexistente,
registrar exatamente o ponto nao validado.

### Step 117.6.3 - Atualizar documentacao

Conforme resultado real:

- `repos/sep-app/README.md`: secao Financeiro/Pix/Backoffice e gaps remanescentes;
- `docs-sep/WEB-SCREENS-PLAN.md`: somente telas/fluxos realmente entregues;
- spec/steps 117: status, branch, data, testes e classificacoes finais;
- `docs-sep/PRD-FASE-4.md`, `STATE.md`, `CONTEXT-PARTE-2.md` e `AI-ROADMAP.md` no fechamento;
- criar `repos/sep-app/SPRINT-F-17-PR.md` com Summary, matriz resumida, test plan, mudancas,
  contratos ausentes, dividas/follow-ups e commits.

Nao alterar collection Postman se nenhum contrato backend mudou. A F-17 nao cria endpoints.

### Step 117.6.4 - Checkpoint final

Apresentar:

- `git status --short --branch` e `git diff --stat` do `sep-app`;
- arquivos criados/modificados/removidos;
- matriz final e itens nao implementados com justificativa;
- testes/build/lint/e2e e resultados;
- riscos, smoke manual e pendencias;
- mensagens de commit sugeridas.

**Definicao de pronto da Task F-17.6**:

- [ ] Todo item da matriz tem destino final.
- [ ] Smokes cobrem somente fluxos novos.
- [ ] Gate final verde, ou falha externa documentada.
- [ ] Docs e PR description refletem a entrega real.

### Commit sugerido

```text
docs(web): fechar f-sprint 17 financeira
```

---

## Definition of Done da F-Sprint 17

- [ ] Gap analysis aprovado antes de implementacao.
- [ ] Cada capacidade classificada como `IMPLEMENTAR`, `JA_COBERTO`, `CONTRATO_AUSENTE` ou
  `FORA_DE_ESCOPO`.
- [ ] Todos os itens `IMPLEMENTAR` fechados com contrato backend atual.
- [ ] Nenhum endpoint, DTO, total, status ou correlacao inventado no frontend.
- [ ] Divergencias permanecem rastreaveis pela fila do backoffice.
- [ ] Reprocessos exigem role/step-up corretos e nunca reenviam Pix indevidamente.
- [ ] `403`/`404`/`409`/`422`/`429`/rede/`5xx` nao viram sucesso presumido.
- [ ] New Design System SEP, light/dark, responsividade e acessibilidade preservados onde houver UI.
- [ ] MSW/Vitest/Playwright atualizados proporcionalmente ao codigo alterado.
- [ ] `npm run lint`, `npm run lint:scss`, `npm run test`, `npm run build` e `npm run e2e` verdes.
- [ ] README, WEB-SCREENS-PLAN, spec/steps, PRD/STATE/CONTEXT e roadmap atualizados no fechamento.

## Checklist de code review final

- [ ] Componentes chamam services; nenhum `HttpClient` direto em pagina.
- [ ] DTOs TypeScript refletem contratos reais e nullability correta.
- [ ] Nenhum total financeiro, conciliacao, elegibilidade ou status derivado localmente.
- [ ] Nenhuma lista por IDs fixos, storage ou N+1.
- [ ] `PageResponse.totalElements` nao foi substituido por tamanho da pagina.
- [ ] `RECEBIMENTO_PIX_DIVERGENTE` nao oferece reprocesso de provider.
- [ ] `PIX_TRANSFERENCIA` reconsulta status e nunca reenvia transferencia.
- [ ] GETs nao consomem step-up; mutacoes sensiveis usam allowlist exata.
- [ ] Roles de rota/UI espelham o backend sem substituir autorizacao server-side.
- [ ] Erros nao produzem falso sucesso nem loop de step-up.
- [ ] Fixtures/DOM/log/storage nao expoem chave Pix, payload, dado bancario ou token.
- [ ] Mudancas permanecem cirurgicas e nao duplicam F-10/F-13.
