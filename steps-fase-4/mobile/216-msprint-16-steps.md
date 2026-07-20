# Steps - M-Sprint 16 - Aporte/matching e chaves Pix na credora mobile

**Spec de origem**: [`specs/fase-4/216-msprint-16-aporte-pix-avancado-mobile.md`](../../specs/fase-4/216-msprint-16-aporte-pix-avancado-mobile.md)

**Objetivo geral**: levar ao `sep-mobile` da credora as superficies de **aporte** e **matching**
assistidos e a **visibilidade mascarada de chaves Pix**, consumindo os contratos das Sprints backend
29 (aporte), 30 (matching) e 31 (chaves Pix). Manter o mobile restrito a tomador e credora,
preservando PWA e empacotamento nativo Android (M-13). Regras, estados, totais, elegibilidade,
ownership, idempotencia, auditoria, movimentacao de escrow e mascaramento continuam autoritativos no
backend.

> **ESCOPO REDUZIDO PELO GATE M-16.0 (2026-07-20).** O precheck constatou que o `sep-mobile` so
> conhece `UsuarioRole = 'ADMIN' | 'CLIENTE'` (`src/app/core/api/api.models.ts:1`) e que 5 dos 6
> endpoints previstos exigem `FINANCEIRO`/`ADMIN` no backend — persona que esta spec/step exclui do
> mobile. Decisao registrada (opcao A): **a M-16 entrega somente a leitura owner-scoped de aportes**
> (`GET /api/v1/credores/operacoes/{operacaoId}/aportes`, o unico contrato que a credora `CLIENTE`
> alcanca). As Tasks **M-16.2, M-16.3 e M-16.5** e os Steps **216.4.1-216.4.3** ficam **ADIADOS** e
> permanecem abaixo apenas como registro para quando a persona operacional existir no mobile.
> Detalhe da decisao e da tabela de alcance por endpoint na spec 216.
>
> Ordem executavel real: `Gate M-16.0` -> `M-16.1` (reduzida) -> `M-16.4` (somente Step 216.4.4) ->
> `M-16.6` (reduzida).

**Esforco total estimado**: 4-6 dias de Dev Pleno Mobile no escopo original; **1-1,5 dia** no
escopo reduzido pelo Gate M-16.0.

**Repos de destino**:

- `sep-mobile`: DTOs de borda, services, rotas/paginas Ionic, interceptor de step-up, navegacao,
  MSW, Vitest e smoke Playwright PWA.
- `docs-SEP`: docs operacionais e indices; toda operacao Git permanece manual.

**Branch sugerida**: `feature/msprint-16-aporte-pix-avancado-mobile`.

**Ordem de execucao recomendada**:

```text
prechecks (Git + toolchain + baseline PWA/Android + contratos S29-31)
  -> M-16.0 (prechecks + gate de escopo Pix)
  -> M-16.1 (DTOs + services + step-up routing)
  -> M-16.2 (rotas, navegacao e sugestoes de matching)
  -> M-16.3 (detalhe + decisao assistida com step-up)
  -> M-16.4 (aporte + status operacional + leitura owner-scoped)
  -> M-16.5 (visao mascarada de chaves Pix)
  -> M-16.6 (erros, concorrencia, a11y, MSW, Vitest, Playwright, docs, fechamento)
```

**Como usar este arquivo**:

1. Execute as tasks na ordem.
2. Escreva ou ajuste testes antes de comportamento observavel novo.
3. Pare em checkpoint pre-commit ao final de cada task.
4. Informe arquivos, verificacoes, riscos e mensagem de commit sugerida.
5. Aguarde aprovacao antes de executar `git add` ou `git commit`.
6. O git de `docs-SEP` e manual.

**Pre-requisitos globais**:

- `sep-mobile/develop` contem a M-Sprint 13 mergeada (empacotamento nativo Android + runtime nativo
  comum).
- `main` esta integrada em `develop`, ou a divergencia foi registrada e aprovada.
- Backend Sprints 29, 30 e 31 estao integradas em `sep-api/develop` (contratos aporte, matching,
  chaves Pix disponiveis).
- Node >= 22, baseline PWA verde, projeto Android sincronizavel via `cap sync android`.
- Spec 216, ADR 0019 (Capacitor 8), spec 118 (F-Sprint 18 web como referencia de padrao aporte/
  matching) e este arquivo foram lidos.

**Fora de escopo**:

- Alterar endpoint, DTO, migration ou regra no `sep-api`.
- Calcular elegibilidade, valor elegivel, total, estado, ownership ou mascaramento no cliente.
- Matching automatico, polling de sugestoes ou decisao automatica.
- Disparar aporte ao confirmar matching ou liquidar/reconciliar aporte pelo mobile.
- Expor motivo interno de decisao, decisor, snapshot bruto, score, PII, dados bancarios, escrow,
  provider, idempotency key, valor bruto da chave Pix ou motivo tecnico de falha.
- Cadastrar ou remover chave Pix a partir do mobile (mutacoes de chave permanecem no web/backoffice).
- Movimentar dinheiro real ou ativar Celcoin/BaaS; providers seguem Fake/WireMock.
- Split Pix, Pix automatico, agendamento ou recorrencia.
- Operacao interna de financeiro/backoffice no app (personas fora do mobile).
- Biometria nativa (M-15), iOS (M-14), publicacao em lojas (Fase 5).
- Refactor amplo do shell, dos interceptors, do runtime nativo ou do design system.

## Contratos backend consumidos

> **Conferencia de contrato (Gate M-16.0, 2026-07-20)**: os 6 endpoints existem em
> `sep-api/origin/develop` nos paths previstos. Correcoes factuais aplicadas abaixo: `TipoChavePix`
> usa `EVP` (nao `ALEATORIA`); `ChavePixResponse` tem campo extra `removidaEm`; `POST /aportes`
> tambem pode retornar `422`; `POST /matching/{id}/decisao` responde `200` (nao `201`).

### Matching operacional (Sprint 30) - ADIADO pelo Gate M-16.0

```http
GET  /api/v1/credores/matching/sugestoes
GET  /api/v1/credores/matching/{sugestaoId}
POST /api/v1/credores/matching/{sugestaoId}/decisao
```

**Nao consumido nesta sprint**: exige `FINANCEIRO`/`ADMIN`; a credora autentica como `CLIENTE`.

- Todos exigem `FINANCEIRO` ou `ADMIN`; somente o `POST` exige step-up estrito.
- `GET /sugestoes` e **refresh-on-read**: pode persistir e auditar sugestoes novas antes de listar
  apenas as `SUGERIDA`. Nao admite polling automatico.
- DTO publico: `id`, `operacaoId`, `empresaCredoraId`, `status`, `valorElegivel`, `criterios`,
  `criadaEm`, `decididaEm`.
- Decisao: `{ acao: CONFIRMAR | REJEITAR, motivo? }`, motivo opcional ate 255 caracteres.
- `SUGERIDA -> CONFIRMADA | REJEITADA`; decisao terminal/repetida retorna `409`.
- Confirmar matching apenas registra a decisao. Nunca cria aporte, chama escrow, Pix ou provider.

### Aporte assistido e leitura owner-scoped (Sprint 29)

```http
POST /api/v1/credores/operacoes/{operacaoId}/aportes
GET  /api/v1/credores/operacoes/{operacaoId}/aportes
```

- `POST` — **ADIADO pelo Gate M-16.0**: `FINANCEIRO`/`ADMIN`, step-up estrito, header
  `Idempotency-Key` obrigatorio e body `{ valor }`; retorna `201` em novo registro, `200` em replay
  idempotente, e ainda `400`/`403`/`404`/`409`/`422`. Nao consumido nesta sprint.
- `GET` — **unico contrato consumido pela M-16**: autenticado (`isAuthenticated()`), sem step-up;
  atende visao operacional e empresa credora dona. Usuario sem credora, operacao alheia e operacao
  inexistente recebem `404` neutro. Lista vem ordenada por data de criacao desc.
- DTO publico: `id`, `operacaoId`, `status`, `valor`, `dataCriacao`, `dataAtualizacao` (todos
  non-null).
- Estados: `PENDENTE -> EM_PROCESSAMENTO -> LIQUIDADO | FALHOU`.
- Nao existe endpoint REST de reconciliacao na Fase 4. Reconsulta e permitida por gesto, sem
  polling e sem simular webhook.

### Chaves Pix (Sprint 31) - ADIADO pelo Gate M-16.0

```http
GET /api/v1/pix/chaves
```

- `FINANCEIRO`/`ADMIN`; sem step-up (step-up so nas mutacoes `POST`/`DELETE`, fora de escopo desta
  sprint mobile). **Nao consumido nesta sprint**: a credora `CLIENTE` receberia `403`.
- DTO publico: `id`, `tipo`, `valorMascarado`, `status` (`ATIVA` | `INATIVA`), `criadaEm`,
  `removidaEm` (nullable, preenchido so em `INATIVA`).
- Valor bruto da chave nunca aparece no payload, log ou erro. Mobile so exibe `valorMascarado` e
  `tipo`.
- Sem cadastro/remocao no mobile; `POST` e `DELETE` sao do web (F-Sprint dedicada de chaves Pix +
  backoffice) e nao consumidos aqui.

## Decisoes da sprint

- Separar as duas personas dentro do modulo `credora` mobile, espelhando o padrao F-18 do web:
  - rotas operacionais de matching/aporte/chaves protegidas por `roleGuard` para
    `FINANCEIRO`/`ADMIN`;
  - detalhe da carteira/oportunidade existente da persona `CLIENTE` acrescido apenas da lista
    owner-scoped de aportes (leitura), sem CTA de mutacao.
- Rotas operacionais propostas (Ionic tabs/router):
  - `/credora/matching` - sugestoes pendentes;
  - `/credora/matching/:sugestaoId` - detalhe e decisao;
  - `/credora/matching/:sugestaoId/aporte` - aporte da operacao vinculada;
  - `/credora/pix/chaves` - visao mascarada.
- A pagina de aporte reconsulta o matching pelo `sugestaoId` e usa `operacaoId` e `valorElegivel`
  recebidos do backend. O CTA aparece somente em `CONFIRMADA`, como regra de UX; o `POST /aportes`
  continua sendo a autoridade de elegibilidade.
- `CredoraService` continua sendo a borda HTTP do modulo credora; nao criar service paralelo apenas
  por persona. Chaves Pix ganham `PixChavesService` proprio (modulo `pix`), sem misturar com o
  service da credora.
- Cada decisao e cada aporte exige gesto explicito proprio. Retornar do step-up nunca confirma,
  rejeita ou registra aporte automaticamente: a tela reconsulta o recurso e exige novo clique.
- Gerar uma `Idempotency-Key` por intencao de aporte, mantida somente em memoria durante retries
  ambiguos. Alterar o valor cria nova intencao/key; reload perde o rascunho, nunca o persiste em
  `localStorage`, `sessionStorage` ou `Preferences` nativo.
- Tratar `201` e `200` como sucesso real, distinguindo novo registro de replay apenas quando a
  resposta HTTP estiver disponivel. Nunca presumir sucesso em erro de rede ou `5xx`.
- Aplicar o New Design System SEP ja vigente no mobile: tabela responsiva (cards em viewport
  estreito), badges de status, dialogs Ionic acessiveis, foco visivel, light/dark, estados
  loading/erro/vazio e respeito a `safe-area-inset-*` (M-13).
- Preservar guard `redirectAuthenticatedGuard` (M-13) e allowlist de deep links; nenhuma URL nova
  entra em rota sem passar por guard existente.

## Gate de escopo: chaves Pix

A F-18 web adiou chaves Pix (Gate F-18.0). O `PRD-FASE-4 §37` mantem visibilidade Pix como
pendencia do `v1.0-local` e o `STATE.md` explicita que M-16 traz visibilidade mobile em paralelo a
sprint web dedicada.

Confirmar no Gate M-16.0:

1. contrato `GET /api/v1/pix/chaves` esta em `origin/develop` do `sep-api` com DTO mascarado;
2. sprint web dedicada de chaves Pix nao mudou o contrato consumido aqui;
3. mobile so consome `GET`; qualquer cadastro/remocao ampliaria a spec 216 antes de qualquer task.

Nenhuma implementacao silenciosa de mutacao de chave. Split Pix e Pix automatico continuam fora de
escopo em qualquer caso.

## Protocolo obrigatorio por Task

1. Executar somente a Task liberada pelo usuario.
2. Confirmar codigo e contrato atuais antes de editar.
3. Implementar a menor mudanca coerente com a spec e este step.
4. Escrever/ajustar teste observavel para o comportamento alterado.
5. Rodar verificacoes proporcionais ao risco (Vitest focado + lint; Playwright/build ao fim).
6. Parar em checkpoint pre-commit com arquivos, testes, riscos e mensagem sugerida.
7. Aguardar aprovacao antes de `git add`/`git commit`; usar somente paths especificos.
8. Nao iniciar a Task seguinte sem ordem explicita.

**Skills obrigatorias durante a implementacao**:

- `coding-guidelines`: suposicoes explicitas, simplicidade, mudancas cirurgicas e verificacao.
- `clean-code`: nomes intencionais, componentes focados, dialogs acessiveis e testes legiveis.
- `clean-architecture`: paginas orquestram UI via service; regra financeira e seguranca ficam no
  backend; DTOs TypeScript permanecem modelos de borda.
- `react-native-expert` NAO se aplica (stack e Ionic 8 + Angular 20 + Capacitor 8; sem RN).

## Rastreabilidade spec 216 -> steps

Apos o Gate M-16.0 a spec 216 foi reescrita para tres tasks. Rastreabilidade vigente:

| Task da spec 216 (revisada) | Steps |
|-----------------------------|-------|
| 1. Modelos de borda + `listarAportes` no service | M-16.1 (reduzida) |
| 2. Lista owner-scoped no detalhe da carteira | M-16.4, Steps 216.4.4-216.4.5 |
| 3. MSW + Vitest + smoke + docs + fechamento | M-16.6 (reduzida) |
| Gates de cadeia, contrato, baseline e escopo | M-16.0 |

Rastreabilidade do escopo **adiado**, preservada para reativacao futura:

| Escopo adiado | Steps preservados | Bloqueio |
|---------------|-------------------|----------|
| Sugestoes de matching | M-16.2 | persona `FINANCEIRO` ausente no mobile |
| Decisao de matching com step-up | M-16.3 | persona `FINANCEIRO` + `TRATA_403_LOCALMENTE` inexistente |
| Aporte assistido (POST, idempotencia, step-up) | Steps 216.4.1-216.4.3 | persona `FINANCEIRO` |
| Chaves Pix mascaradas | M-16.5 | `GET /pix/chaves` exige `FINANCEIRO`/`ADMIN` |

---

## Gate M-16.0 - Prechecks, contratos e recorte final

**Objetivo**: confirmar cadeia Git, contratos backend integrados, baseline PWA/Android e a
fronteira de chaves Pix antes de editar o `sep-mobile`.

### Step 216.0.1 - Confirmar cadeia Git do `sep-mobile`

```bash
cd <sep-mobile-root>
git fetch --all --prune
git status --short --branch
git log --oneline --decorate -15 origin/develop
git log --oneline --decorate -10 origin/main
git rev-list --left-right --count origin/main...origin/develop
```

**Verificacao**:

- M-Sprint 13 presente em `origin/develop`.
- `main` integrada em `develop`, ou pendencia registrada antes de criar branch.
- Working tree limpa ou mudancas locais identificadas e preservadas.

### Step 216.0.2 - Tratar artefato temporario e criar branch

- Em `docs-SEP`, remover `repos/sep-mobile/SPRINT-M-13-PR.md` somente se ja foi usado no PR.
- Git de `docs-SEP` continua manual.

```bash
cd <sep-mobile-root>
git switch develop
git pull --ff-only
git switch -c feature/msprint-16-aporte-pix-avancado-mobile
```

### Step 216.0.3 - Reconfirmar backend integrado e OpenAPI

```bash
cd <sep-api-root>
git log --oneline --decorate -30 origin/develop
sed -n '1,260p' src/main/java/com/dynamis/sep_api/credores/web/controller/AporteCredoraController.java
sed -n '1,280p' src/main/java/com/dynamis/sep_api/credores/web/controller/MatchingCredoraController.java
sed -n '1,220p' src/main/java/com/dynamis/sep_api/pix/web/controller/PixChaveController.java
find src/main/java/com/dynamis/sep_api/credores/web/dto -type f | sort
find src/main/java/com/dynamis/sep_api/pix/web/dto -type f | sort
rg -n "RequireStepUpEstrito|Idempotency-Key|matching|aportes|/pix/chaves" \
  src/main/java/com/dynamis/sep_api/credores/web \
  src/main/java/com/dynamis/sep_api/pix/web
```

Registrar metodo, path, roles, step-up, headers, status HTTP, campos e nullability para os cinco
endpoints consumidos (3 matching + 1 aporte POST + 1 aporte GET + 1 chaves GET). Divergencia contra
os contratos deste step bloqueia a implementacao ate alinhamento documental.

### Step 216.0.4 - Mapear base mobile e seguranca atuais

```bash
cd <sep-mobile-root>
sed -n '1,240p' src/app/core/api/api.models.ts
sed -n '1,220p' src/app/core/credora/credora.service.ts
sed -n '1,220p' src/app/features/credora/credora.routes.ts
sed -n '1,180p' src/app/core/interceptors/step-up.interceptor.ts
sed -n '1,180p' src/app/core/interceptors/error.interceptor.ts
sed -n '1,140p' src/app/core/native/platform.service.ts
sed -n '1,140p' src/app/core/native/native-runtime.service.ts
rg -n "credora|matching|aporte|pix" src/app src/mocks e2e
```

Confirmar:

- `CredoraService` e DTOs atuais nao cobrem aporte/matching/chaves Pix.
- rota `/credora` atual representa a persona `CLIENTE` com presenca de credora.
- rotas operacionais novas precisam de `roleGuard`, sem `credoraPresenceGuard`.
- `stepUpInterceptor` ainda nao reconhece os POSTs novos.
- `TRATA_403_LOCALMENTE` aplicavel somente nas mutacoes cujo `403` de step-up sera tratado na
  propria tela; GET sem role continua no fluxo global.
- runtime nativo (`PlatformService`/`NativeRuntimeService`) nao precisa mudar; deep links seguem a
  allowlist da M-13.

### Step 216.0.5 - Reconfirmar decisao de escopo Pix (Gate F-18.0)

Ler o bloco de decisao de chaves Pix em [`steps-fase-4/web/118-fsprint-18-steps.md`](../web/118-fsprint-18-steps.md)
(Gate F-18.0, 2026-07-16). Confirmar que:

- mobile so consome `GET /api/v1/pix/chaves`;
- sprint web dedicada de chaves Pix nao alterou o DTO mascarado consumido aqui;
- ampliacao para `POST`/`DELETE` no mobile exigiria revisar spec 216 antes.

Registrar a decisao no bloco de fechamento (M-16.6) e no `SPRINT-M-16-PR.md`.

### Step 216.0.6 - Rodar baseline PWA + Android

```bash
cd <sep-mobile-root>
npm ci --legacy-peer-deps
npm run lint
npm run lint:scss
npm run format:check
npm run test
npm run build
npm run e2e
npx cap sync android
cd android
./gradlew test lint assembleDebug
```

- `npm ci` puro **falha** neste repo (`ERESOLVE`: `zone.js@0.16.2` x peer `~0.15.0` do
  `@angular/core@20.3.26`). O CI usa `npm ci --legacy-peer-deps` (`.github/workflows/ci.yml:52,91,135`)
  e este step segue o CI.
- Node: jobs web do CI usam Node 20; o job Android usa Node 22 (ADR 0019 exige >= 22 para o CLI do
  Capacitor).
- Registrar falhas preexistentes (ex.: `golden-path-mobile` conforme M-13).
- Nao corrigir regressao alheia a M-16 sem aprovacao.

**Baseline medida em 2026-07-20** (branch `feature/msprint-16-aporte-pix-avancado-mobile` recem
criada de `origin/develop`, Node 22): `npm ci --legacy-peer-deps`, lint, lint:scss, format:check,
build e Vitest **487/487 (68 arquivos)** verdes; Playwright **24 passed / 1 failed**, sendo a falha
o `golden-path-mobile` ja registrado como preexistente no fechamento da M-13.

### Definicao de pronto do Gate M-16.0

- [ ] Cadeia Git mobile confirmada.
- [ ] Backends 29-31 e contratos runtime confirmados.
- [ ] Fronteira operacional x owner-scoped x chaves Pix mascaradas registrada.
- [ ] Decisao Gate F-18.0 reconhecida e escopo mobile de Pix restrito a `GET`.
- [ ] Baseline PWA + Android verde com contagens, ou falha preexistente registrada.

---

## Task M-16.1 - DTOs e leitura owner-scoped de aportes no service (REDUZIDA)

**Objetivo**: criar a borda tipada do unico contrato que a credora alcanca, antes da tela.

**Pre-requisito**: Gate M-16.0 concluido.

**Esforco**: 0,25 dia no escopo reduzido.

**Arquivos esperados** (nomes reais conferidos no Gate M-16.0):

- `src/app/core/api/api.models.ts`.
- `src/app/core/credores/credora-mobile.service.ts` e spec.

Nao ha `src/app/core/credora/credora.service.ts` nem modulo `src/app/core/pix/` no `sep-mobile`; os
caminhos originais deste step estavam extrapolados do `sep-app`.

### Step 216.1.1 - Adicionar modelos de borda

Adicionar apenas os tipos do contrato consumido:

```text
StatusAporteCredora = PENDENTE | EM_PROCESSAMENTO | LIQUIDADO | FALHOU
AporteCredoraResponse (id, operacaoId, status, valor, dataCriacao, dataAtualizacao)
```

Datas permanecem `string` ISO e valores monetarios `number` apenas para exibicao. Nao adicionar
campos internos nem helpers que calculem total, elegibilidade ou estado.

Tipos de matching e de chave Pix **nao** entram: seus contratos estao adiados e modelo sem consumo
vira codigo morto.

### Step 216.1.2 - Estender o service da credora

Adicionar um unico metodo a `CredoraMobileService`, seguindo a convencao vigente do service
(`firstValueFrom`, retorno `Promise`, sem `Observable` exposto):

```text
listarAportes(operacaoId) -> Promise<AporteCredoraResponse[]>
```

- O service transporta o DTO; nao interpreta estado, nao ordena e nao agrega.
- Sem cache persistente; leitura por chamada, refresh por gesto.

### Step 216.1.3 - Testar contrato HTTP

Cobrir URL, metodo, DTO, lista vazia e `404` neutro. Confirmar que a chamada **nao** anexa
`X-Step-Up-Token` (o `stepUpInterceptor` nao deve ganhar nenhuma entrada nesta sprint).

```bash
npm run test -- --run src/app/core/credores/credora-mobile.service.spec.ts
npm run lint
```

### Definicao de pronto da Task M-16.1

- [ ] `StatusAporteCredora` e `AporteCredoraResponse` fieis ao DTO backend.
- [ ] `listarAportes` centralizado no service da credora.
- [ ] `stepUpInterceptor` inalterado; GET nao consome token.
- [ ] Nenhuma regra financeira ou de ownership no cliente.

### Commit sugerido

```text
feat(mobile): adicionar contrato de aportes owner-scoped da credora
```

---

### Steps 216.1.4-216.1.5 (original) - **ADIADOS (Gate M-16.0)**

> `PixChavesService`, novos DTOs de matching e as entradas de step-up para
> `POST /credores/matching/{id}/decisao` e `POST /credores/operacoes/{id}/aportes` dependem da
> persona `FINANCEIRO`. Registro preservado na spec 216.

---

## Task M-16.2 - Rotas, navegacao e sugestoes de matching - **ADIADA (Gate M-16.0)**

> Nao implementar nesta sprint. Depende da persona `FINANCEIRO`, inexistente no `sep-mobile`.
> Conteudo preservado como registro.

**Objetivo**: oferecer a `FINANCEIRO`/`ADMIN` uma fila explicita de sugestoes pendentes no app, sem
polling nem decisao automatica.

**Pre-requisito**: Task M-16.1 concluida.

**Esforco**: 0,5-1 dia.

### Step 216.2.1 - Criar rotas operacionais protegidas

Adicionar rotas propostas em `credora.routes.ts` com `roleGuard` para `FINANCEIRO`/`ADMIN`. Nao
aplicar `credoraPresenceGuard`. Preservar sem alteracao o acesso `CLIENTE` a perfil/oportunidades/
carteira e as tabs Ionic existentes.

Adicionar item de navegacao `Matching de credoras` (tab, menu lateral ou entrada do shell mobile,
conforme padrao vigente) visivel somente para `FINANCEIRO`/`ADMIN`. `CLIENTE` e `BACKOFFICE` nao
veem. Menu `Credora` da persona `CLIENTE` continua separado.

Deep links: adicionar as novas rotas a allowlist do `NativeRuntimeService`; URL malformada segue
rejeitada pelo guard existente.

### Step 216.2.2 - Criar pagina de sugestoes

Na entrada, executar uma unica chamada a `listarSugestoesMatching()` e explicar que a atualizacao
pode gerar novas sugestoes auditadas.

Exibir:

- operacao e empresa credora por IDs curtos, sem UUID integral como titulo;
- valor elegivel recebido do backend;
- criterios funcionais recebidos;
- status e data de criacao;
- link para detalhe/decisao (Ionic `routerLink`).

Nao inventar nome de credora, tomador ou contrato: esses campos nao existem no DTO. Renderizar em
`ion-list`/cards para viewport estreito; sem tabela horizontal com scroll oculto.

### Step 216.2.3 - Controlar refresh-on-read

- Sem interval, polling, `ion-refresher` automatico ao voltar do background, ou refresh invisivel
  ao recuperar foco.
- Permitir `Atualizar sugestoes` apenas por gesto explicito (botao + pull-to-refresh **manual**),
  com aviso curto e botao/refresher bloqueado enquanto a request estiver em andamento.
- Lista vazia e estado valido; nao fabricar fixtures na UI nem reter lista como fonte autoritativa.

### Step 216.2.4 - Testar acesso e listagem

Cobrir roles, uma chamada inicial, refresh explicito, ausencia de polling, vazio, erro/retry e
renderizacao fiel do DTO.

```bash
npm run test -- --run src/app/features/credora
npm run test -- --run src/app/layout
npm run lint
npm run lint:scss
```

### Definicao de pronto da Task M-16.2

- [ ] Rotas e navegacao restritas a `FINANCEIRO`/`ADMIN`.
- [ ] Sugestoes renderizadas sem PII nem dados inventados.
- [ ] Refresh-on-read acionado conscientemente, sem polling nem retomada silenciosa.
- [ ] Loading, vazio, erro e retry acessiveis; safe-area respeitada.

### Commit sugerido

```text
feat(mobile): listar sugestoes de matching da credora
```

---

## Task M-16.3 - Detalhe e decisao assistida com step-up - **ADIADA (Gate M-16.0)**

> Nao implementar nesta sprint. Depende da persona `FINANCEIRO`, inexistente no `sep-mobile`.
> Observacao factual: `TRATA_403_LOCALMENTE` citado abaixo **nao existe no `sep-mobile`** (conceito
> criado no `sep-app` na F-16); se esta task for reativada, o mecanismo precisa ser criado antes.
> Conteudo preservado como registro.

**Objetivo**: confirmar ou rejeitar uma sugestao somente apos reconsulta, confirmacao acessivel e
step-up valido.

**Pre-requisito**: Task M-16.2 concluida.

**Esforco**: 1 dia.

### Step 216.3.1 - Criar detalhe autoritativo

Carregar `GET /matching/{sugestaoId}` ao entrar. Exibir todos os campos publicos relevantes e
habilitar decisoes somente em `SUGERIDA`. Em status terminal, mostrar resultado e data sem CTA de
repeticao.

### Step 216.3.2 - Reconsultar antes de decidir

Ao clicar em confirmar ou rejeitar:

1. bloquear abertura/submit concorrente;
2. reconsultar o detalhe;
3. abrir dialog Ionic (`ion-alert` acessivel ou `ion-modal` proprio) somente se o status atual ainda
   for `SUGERIDA`;
4. apresentar acao, valor elegivel e operacao atuais;
5. permitir motivo opcional com contador/limite de 255 caracteres.

Falha na reconsulta nao chama o POST.

### Step 216.3.3 - Orquestrar MFA e step-up

- Sem MFA ativo, bloquear a decisao e orientar habilitacao; sem tentar bypass.
- Sem token, navegar para `/step-up?next=<rota-do-detalhe>` (rota mobile existente da M-Sprint 10).
- No retorno, reconsultar o detalhe e exigir novo clique; nunca retomar o POST automaticamente.
- Aplicar `TRATA_403_LOCALMENTE` ao POST para que token ausente/expirado ofereca nova verificacao
  explicita sem loop. GET/guard de role permanecem no tratamento global.

### Step 216.3.4 - Submeter uma unica decisao

- Desabilitar os dois CTAs durante o POST.
- Sucesso substitui o detalhe pela resposta terminal.
- `409` reconsulta e mostra que a sugestao ja foi decidida.
- `404` usa mensagem neutra, sem ecoar ID.
- Rede/`5xx` nao presume decisao; oferecer reconsulta antes de nova tentativa.

O texto de sucesso de `CONFIRMADA` deve afirmar que o matching foi registrado e que o aporte e um
passo separado. Nunca dizer que recursos foram transferidos.

### Step 216.3.5 - Garantir dialog acessivel

Dialog Ionic com `role="dialog"`, `aria-modal`, titulo associado, foco inicial, trap de `Tab`,
`Escape`, restauracao de foco e acao destrutiva semanticamente distinta. Verificar comportamento
com teclado virtual (mobile) sem ocultar CTA ou campo com erro.

### Definicao de pronto da Task M-16.3

- [ ] Decisao somente sobre estado atual `SUGERIDA`.
- [ ] Confirmar/rejeitar exigem confirmacao e step-up proprio.
- [ ] Retorno do step-up nunca executa decisao.
- [ ] `409`/`404`/rede nao viram sucesso presumido.
- [ ] Confirmacao nao promete nem dispara aporte.
- [ ] Dialog acessivel com teclado virtual iOS/Android/PWA.

### Commit sugerido

```text
feat(mobile): permitir decisao assistida de matching
```

---

## Task M-16.4 - Leitura owner-scoped de aportes na carteira (REDUZIDA)

**Objetivo**: apresentar o ciclo de status dos aportes a empresa credora dona, em somente leitura,
no detalhe da operacao da carteira.

**Pre-requisito**: Task M-16.1 concluida. (A M-16.3 esta adiada e nao bloqueia.)

**Esforco**: 0,5 dia no escopo reduzido.

**Recorte executavel**: apenas o **Step 216.4.4**. Os Steps 216.4.1-216.4.3 (rota operacional de
aporte, idempotencia, step-up, POST) estao **ADIADOS** pelo Gate M-16.0 e ficam abaixo como
registro.

### Step 216.4.1 - Criar rota/pagina operacional de aporte - **ADIADO (Gate M-16.0)**

Na rota `/credora/matching/:sugestaoId/aporte`:

- reconsultar o matching;
- aceitar acesso somente para `FINANCEIRO`/`ADMIN` pelo guard;
- oferecer CTA apenas se o backend retornar `CONFIRMADA`;
- usar `operacaoId` como path do POST e preencher o valor inicial com `valorElegivel` recebido;
- permitir revisao consciente do valor, sem calcular, somar ou aplicar capacidade local.

O backend continua validando operacao ativa, contrato assinado e valor.

### Step 216.4.2 - Confirmar e registrar com idempotencia - **ADIADO (Gate M-16.0)**

Antes do POST:

1. validar apenas formato frontend (obrigatorio, positivo, ate duas casas);
2. abrir dialog acessivel com valor e aviso de provider fake/local;
3. exigir MFA e step-up, usando a propria rota como `next`;
4. apos retorno, reconsultar matching/aportes e exigir novo clique;
5. criar key com `crypto.randomUUID()` para a intencao confirmada.

Reusar a mesma key em retry de rede/`5xx` sem alteracao do valor, sempre com novo step-up valido,
porque o token anterior e de uso unico. Mudanca do valor invalida a intencao e gera key nova somente
na proxima confirmacao. Nunca mostrar, logar nem persistir a key em `Preferences`, `localStorage`
ou `sessionStorage`.

### Step 216.4.3 - Apresentar resposta e historico operacional - **ADIADO (Gate M-16.0)**

Depois de `201` ou `200`, renderizar o DTO retornado e reconsultar `GET /aportes`. Exibir lista em
ordem recebida, valor, status e datas. Atualizacao posterior ocorre apenas por botao `Atualizar
status`; sem polling e sem endpoint ficticio de reconciliacao.

Mensagens por estado:

- `PENDENTE`/`EM_PROCESSAMENTO`: processamento local em andamento, sem garantia de liquidacao;
- `LIQUIDADO`: status confirmado pelo backend;
- `FALHOU`: falha generica; o contrato publico nao traz motivo tecnico.

### Step 216.4.4 - Expor leitura owner-scoped na carteira (EXECUTAVEL)

Estender a rota existente `/app/credora/carteira/:operacaoId`
(`src/app/features/credora/carteira/portfolio-detail.component.*`, guard `credoraPresenceGuard`,
`authenticated.routes.ts:216`) para chamar `listarAportes(operacaoId)` e mostrar os aportes em
somente leitura. Nao exibir registrar, retry de mutacao, matching ou qualquer CTA de escrita.

- `[]` = nenhum aporte registrado (mensagem neutra).
- `404` = operacao indisponivel/neutra, coerente com o detalhe atual; sem ecoar ID.
- Falha da lista de aportes **nao** apaga um detalhe de carteira ja carregado; apresentar erro
  localizado com retry por gesto.
- Sem polling e sem refresh invisivel ao retomar foreground; atualizacao apenas pelo gesto ja
  existente na pagina (pull-to-refresh manual/botao), sem disparar duas requests simultaneas.

Rotulos por estado, sem inventar semantica alem do contrato:

- `PENDENTE`/`EM_PROCESSAMENTO`: processamento em andamento, sem garantia de liquidacao;
- `LIQUIDADO`: confirmado pelo backend;
- `FALHOU`: falha generica (o contrato publico nao traz motivo tecnico).

Aplicar o New Design System vigente: badge textual (nao so cor), `safe-area`, light/dark e estados
loading/vazio/erro coerentes com `portfolio-detail`/`portfolio-list`.

### Step 216.4.5 - Testar o recorte owner-scoped

Cobrir renderizacao fiel do DTO, os quatro estados, lista vazia, `404` neutro, erro + retry sem
perder o detalhe ja carregado, ausencia de polling e ausencia de qualquer CTA de mutacao.

```bash
npm run test -- --run src/app/features/credora
npm run test -- --run src/app/core/credores
npm run lint
npm run lint:scss
```

### Definicao de pronto da Task M-16.4

- [ ] Credora dona ve os aportes da propria operacao em somente leitura.
- [ ] Status, valor e datas vem exclusivamente do `GET` backend.
- [ ] Nenhum CTA de mutacao, step-up ou idempotencia na superficie do owner.
- [ ] Erro na lista nao derruba o detalhe da carteira.
- [ ] UI deixa explicito que a Fase 4 usa provider fake/local.

### Commit sugerido

```text
feat(mobile): exibir aportes owner-scoped no detalhe da carteira
```

---

## Task M-16.5 - Visao mascarada de chaves Pix - **ADIADA (Gate M-16.0)**

> Nao implementar nesta sprint. `GET /api/v1/pix/chaves` exige `FINANCEIRO`/`ADMIN`. A visibilidade
> de chaves Pix segue pela sprint web dedicada (Gate F-18.0); o item de Pix avancado do
> `v1.0-local` (PRD-FASE-4 §37) **nao** e fechado pela M-16. Conteudo preservado como registro.

**Objetivo**: exibir a lista de chaves Pix da conta operacional/escrow para `FINANCEIRO`/`ADMIN` no
mobile, em leitura mascarada, sem qualquer mutacao e sem vazar valor bruto.

**Pre-requisito**: Task M-16.4 concluida.

**Esforco**: 0,5 dia.

### Step 216.5.1 - Criar rota e pagina

Rota `/credora/pix/chaves` protegida por `roleGuard` para `FINANCEIRO`/`ADMIN`. Adicionar entrada
de navegacao proxima ao item de matching, visivel para as mesmas roles. Nao adicionar a persona
`CLIENTE`.

### Step 216.5.2 - Renderizar lista mascarada

Chamar `listarChaves()` na entrada. Exibir em `ion-list`/cards:

- `tipo` (rotulo legivel: CPF, CNPJ, e-mail, telefone, aleatoria);
- `valorMascarado` exatamente como veio do backend (sem tentar reconstruir, formatar alem de
  espacamento visual, ou desmascarar);
- `status` (`ATIVA`/`INATIVA`) via badge textual (nao so cor);
- `criadaEm` formatada por locale.

Ordenacao: por `criadaEm` desc, ou como o backend retorna se ja vier ordenado. Nao inferir ordem
por status.

### Step 216.5.3 - Bloquear qualquer mutacao

- Nao renderizar botao/CTA de cadastro, remocao, edicao ou copia.
- Bloquear `long-press`/context menu que permita copiar `valorMascarado` para o clipboard sem
  gesto explicito auditavel; padrao Ionic ja nao expoe copia automatica, apenas confirmar.
- Nao logar `valorMascarado` (ainda que mascarado) em analytics, console de producao ou telemetria.

### Step 216.5.4 - Estados e erros

- Lista vazia: mensagem neutra ("nenhuma chave cadastrada").
- `403`: usuario perdeu role; encaminhar ao fluxo global de acesso negado.
- Rede/`5xx`: oferecer retry por gesto; sem polling.

### Step 216.5.5 - Testes

Cobrir role, renderizacao fiel do DTO mascarado, ausencia de CTA de mutacao, ausencia de log do
valor, estados vazio/erro/retry.

```bash
npm run test -- --run src/app/features/credora
npm run test -- --run src/app/core/pix
npm run lint
npm run lint:scss
```

### Definicao de pronto da Task M-16.5

- [ ] Chaves aparecem mascaradas, sem valor bruto, PII ou dado tecnico do provider.
- [ ] Nenhum CTA de cadastro/remocao/edicao no mobile.
- [ ] Lista, vazio e erro cobertos e acessiveis.
- [ ] Role e navegacao restritas a `FINANCEIRO`/`ADMIN`.

### Commit sugerido

```text
feat(mobile): exibir chaves Pix mascaradas da credora
```

---

## Task M-16.6 - Erros, concorrencia, MSW, smoke Playwright, docs e fechamento

**Objetivo**: fechar a matriz negativa, validar as jornadas integradas em PWA, atualizar
documentacao e preparar o PR.

**Pre-requisito**: Task M-16.4 concluida. (As Tasks M-16.3 e M-16.5 estao adiadas.)

**Esforco**: 0,5 dia no escopo reduzido.

### Step 216.6.1 - Fixar matriz de resposta (reduzida)

Unico contrato consumido: `GET /api/v1/credores/operacoes/{operacaoId}/aportes`.

| Resposta | Comportamento esperado |
|----------|------------------------|
| `200` `[]` | lista vazia; mensagem neutra, sem fabricar fixture |
| `200` com itens | render fiel do DTO, na ordem recebida |
| `403` | acesso negado pelo fluxo global (`error.interceptor` -> `/access-denied`) |
| `404` | operacao indisponivel/neutra; sem ecoar ID e sem enumerar |
| rede/`5xx` | erro localizado + retry por gesto; nao apaga o detalhe ja carregado |

Mensagens nao ecoam UUID, header, payload bruto ou detalhe de provider.

As linhas de `400`/`409`/step-up da matriz original pertencem aos POSTs adiados e nao se aplicam.

### Step 216.6.2 - Cobrir concorrencia

- uma request por gesto;
- pull-to-refresh e botao `Atualizar` nao disparam duas requests simultaneas;
- resposta tardia de request anterior nao sobrescreve leitura mais nova;
- sem polling e sem refresh invisivel ao retomar foreground.

### Step 216.6.3 - Completar MSW stateful (reduzido)

Fixtures/handlers devem representar, para `GET /credores/operacoes/{operacaoId}/aportes`:

- aportes nos quatro estados (`PENDENTE`, `EM_PROCESSAMENTO`, `LIQUIDADO`, `FALHOU`);
- lista vazia;
- operacao propria da credora dona e `404` neutro para operacao alheia/inexistente;
- reset deterministico entre specs, seguindo o padrao ja usado em `mock.credora`.

Nao inventar handler de mutacao (POST de aporte, decisao de matching, cadastro/remocao de chave):
esses contratos estao adiados e um mock sem tela vira ruido.

### Step 216.6.4 - Criar smoke Playwright PWA (reduzido)

Cobrir ao menos:

1. empresa credora `CLIENTE`: carteira -> detalhe da operacao -> lista de aportes somente leitura,
   com estado visivel;
2. ausencia de qualquer CTA de mutacao (registrar/decidir/retry de escrita) nessa superficie;
3. operacao sem aportes renderiza o estado vazio.

Reusar o padrao de bootstrap dos smokes existentes (`e2e/credora-mobile.spec.ts`: MSW via
`localStorage.NG_APP_USE_MSW` + login `cliente@empresa.com`).

Manter o smoke `golden-path-mobile` no estado vigente (falha preexistente da M-13 nao regride nem
"cura" nesta sprint sem ADR).

### Step 216.6.5 - Regressao PWA + Android

```bash
cd <sep-mobile-root>
npm run lint
npm run lint:scss
npm run format:check
npm run test
npm run build
npm run e2e
npm audit --omit=dev
npx cap sync android
cd android
./gradlew test lint assembleDebug
cd ..
git status --short --branch
git diff --stat
```

- Confirmar que APK/AAB debug continua abrindo o app em emulador (smoke manual curto: login ->
  matching -> aporte -> chaves).
- iOS (M-14) permanece bloqueado pelo gate de hardware; nao rodar `npx cap sync ios`.

### Step 216.6.6 - Atualizar docs obrigatorios

- `docs-SEP/repos/sep-mobile/README.md` §Credora: rotas, contratos consumidos (S29-31), personas,
  refresh-on-read, step-up, idempotencia, estados, testes, chaves mascaradas e limitacao
  fake/local.
- `docs-SEP/AI-ROADMAP.md`: M-16 e temas aporte/matching/chaves Pix apontando para spec + este
  step.
- `docs-SEP/repos/sep-mobile/SPRINT-M-16-PR.md`: criar descricao temporaria consolidada ao fim
  (summary, test plan, contratos, personas, step-up, idempotencia, chaves mascaradas, smoke, CI,
  limitacoes, follow-ups, commits).
- No fechamento mergeado (feito manualmente pelo dev): atualizar `PRD-FASE-4.md` §37 (visibilidade
  mobile de chaves Pix marcada como concluida no recorte mobile; item `v1.0-local` de Pix
  avancado so fecha quando web dedicada tambem entrar), `STATE.md` e apendar historico curto em
  `CONTEXT-PARTE-2.md`.

Registrar explicitamente que o mobile so consome `GET /api/v1/pix/chaves`; qualquer mutacao vira do
web e nao foi antecipada.

### Step 216.6.7 - Checkpoint final pre-commit

Apresentar:

- arquivos criados/modificados/removidos;
- testes, lint, build, E2E, audit, `gradlew` com resultados/contagens;
- evidencias dos fluxos matching -> decisao, aporte -> status e chaves Pix mascaradas;
- riscos: provider fake, reconciliacao sem endpoint mobile, smoke TOTP real, gate M-14 iOS aberto;
- mensagem de commit sugerida.

Criar/atualizar `repos/sep-mobile/SPRINT-M-16-PR.md`, mas nao executar Git em `docs-SEP`. Push e PR
do `sep-mobile` permanecem manuais.

### Definicao de pronto da Task M-16.6

- [ ] MSW/Vitest cobrem contratos, estados, erros e mascaramento.
- [ ] Playwright PWA cobre os fluxos proporcionais ao ambiente, sem bypass enganoso.
- [ ] Regressao PWA + Android verde ou pendencias objetivas registradas.
- [ ] Docs, roadmap e PR description atualizados.
- [ ] Gate final verde ou pendencias objetivas registradas.

### Commit sugerido

```text
test(mobile): validar jornada de aporte, matching e chaves Pix
```

---

## Gate final da M-Sprint 16 (escopo reduzido pelo Gate M-16.0)

- [ ] Empresa credora dona ve os aportes da propria operacao em somente leitura, sem CTA de mutacao.
- [ ] Valores, estados e datas refletem o backend; nenhuma regra recalculada no app.
- [ ] `403`/`404`/vazio/rede e concorrencia de refresh possuem cobertura proporcional.
- [ ] Erro na lista de aportes nao derruba o detalhe da carteira ja carregado.
- [ ] Sem polling, sem refresh invisivel, sem endpoint ficticio de reconciliacao.
- [ ] Nenhum dado interno, UUID em erro, PII, escrow ou provider vaza na UI, log ou telemetria.
- [ ] Escopo adiado (matching, aporte POST, chaves Pix) permanece **nao implementado** e registrado
      na spec 216, sem marcar item de `v1.0-local` como concluido.
- [ ] New Design System SEP, acessibilidade, safe-area, teclado virtual, responsividade e
      light/dark verificados.
- [ ] MSW, Vitest, lint, SCSS lint, build, Playwright PWA e `gradlew assembleDebug` verdes ou
      falhas preexistentes registradas.
- [ ] Baseline Capacitor 8/ADR 0019 e runtime nativo comum preservados; iOS (M-14) segue bloqueado
      sem regressao introduzida.
- [ ] README mobile §Credora, AI-ROADMAP e `SPRINT-M-16-PR.md` atualizados.
- [ ] Sem alteracao de contrato backend, sem antecipacao de M-14/M-15, sem cadastro/remocao de
      chave no mobile.

## Checkpoint final pre-commit

```bash
cd <sep-mobile-root>
git status --short --branch
git diff --stat
```

Informar arquivos, verificacoes, evidencias, riscos e commits sugeridos. Somente executar
`git add <paths-especificos>` e `git commit` apos aprovacao. Push e PR permanecem manuais.
