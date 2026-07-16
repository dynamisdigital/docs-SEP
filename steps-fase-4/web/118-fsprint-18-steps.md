# Steps - F-Sprint 18 - Aporte e matching da credora no web

**Spec de origem**: [`118-fsprint-18-aporte-matching-credora-web.md`](../../specs/fase-4/118-fsprint-18-aporte-matching-credora-web.md)

**Status**: concluida (PR #94 `develop` squash `ee9d5b6` + PR #95 `main`, 2026-07-16;
`develop` == `main`). Todas as tasks executadas; review manual com 3 achados fechados em
`5e03226` (intencao de aporte em store de root, refresh da lista sem descarte, seed MSW
coerente). Chaves Pix fora por decisao do Gate F-18.0 (ver bloco da decisao abaixo).

**Objetivo geral**: permitir que `FINANCEIRO`/`ADMIN` consulte sugestoes, decida matching e inicie
aporte assistido com confirmacao e step-up estrito. A empresa credora dona recebe somente a leitura
owner-scoped dos aportes de sua operacao. Elegibilidade, ownership, valor elegivel, estados,
idempotencia, auditoria e movimentacao de escrow permanecem autoritativos no backend.

**Esforco total estimado**: 4-6 dias de Dev Pleno Frontend, sujeito ao Gate F-18.0.

**Repos de destino**:

- `sep-app`: DTOs de borda, service, rotas/telas, interceptor de step-up, navegacao, MSW, Vitest e
  Playwright.
- `docs-SEP`: docs operacionais e indices; toda operacao Git permanece manual.

**Branch sugerida**: `feature/fsprint-18-aporte-matching-credora-web`.

## Contratos backend consumidos

### Matching operacional

```http
GET  /api/v1/credores/matching/sugestoes
GET  /api/v1/credores/matching/{sugestaoId}
POST /api/v1/credores/matching/{sugestaoId}/decisao
```

- Todos exigem `FINANCEIRO` ou `ADMIN`; somente o `POST` exige step-up estrito.
- `GET /sugestoes` e **refresh-on-read**: pode persistir e auditar sugestoes novas antes de listar
  apenas as `SUGERIDA`. Nao e leitura pura e nao admite polling automatico.
- DTO publico: `id`, `operacaoId`, `empresaCredoraId`, `status`, `valorElegivel`, `criterios`,
  `criadaEm`, `decididaEm`.
- Decisao: `{ acao: CONFIRMAR | REJEITAR, motivo? }`, com motivo opcional de ate 255 caracteres.
- `SUGERIDA -> CONFIRMADA | REJEITADA`; decisao terminal/repetida retorna `409`.
- Confirmar matching apenas registra a decisao. Nunca cria aporte nem chama escrow, Pix ou provider.

### Aporte assistido e leitura owner-scoped

```http
POST /api/v1/credores/operacoes/{operacaoId}/aportes
GET  /api/v1/credores/operacoes/{operacaoId}/aportes
```

- `POST`: `FINANCEIRO`/`ADMIN`, step-up estrito, header `Idempotency-Key` obrigatorio e body
  `{ valor }`; retorna `201` no registro novo ou `200` no replay idempotente.
- `GET`: autenticado, sem step-up; permite visao operacional e empresa credora dona. Usuario sem
  credora, operacao alheia e operacao inexistente recebem `404` neutro.
- DTO publico: `id`, `operacaoId`, `status`, `valor`, `dataCriacao`, `dataAtualizacao`.
- Estados: `PENDENTE -> EM_PROCESSAMENTO -> LIQUIDADO | FALHOU`.
- Nao existe endpoint REST de reconciliacao na Fase 4. A UI pode reconsultar o `GET`, mas nunca
  forca liquidacao, simula webhook ou promete atualizacao em tempo real.

## Decisoes da sprint

- Separar as duas personas dentro do modulo `credores`:
  - rotas operacionais de matching/aporte protegidas por `roleGuard` para `FINANCEIRO`/`ADMIN`;
  - detalhe da carteira existente protegido por `credoraPresenceGuard`, acrescido somente da lista
    owner-scoped de aportes, sem CTA de mutacao.
- Rotas operacionais propostas:
  - `/app/credora/matching` — sugestoes pendentes;
  - `/app/credora/matching/:sugestaoId` — detalhe e decisao;
  - `/app/credora/matching/:sugestaoId/aporte` — aporte da operacao vinculada ao matching.
- A pagina de aporte reconsulta o matching pelo `sugestaoId` e usa `operacaoId` e `valorElegivel`
  recebidos do backend. O CTA aparece somente em `CONFIRMADA`, como regra de UX; o `POST /aportes`
  continua sendo a autoridade de elegibilidade.
- `CredoraService` permanece a borda HTTP do modulo; nao criar service paralelo apenas por persona.
- Cada decisao e cada aporte exige gesto explicito proprio. Retornar do step-up nunca confirma,
  rejeita ou registra aporte automaticamente: a tela reconsulta o recurso e exige novo clique.
- Gerar uma `Idempotency-Key` por intencao de aporte e mante-la somente em memoria durante retries
  ambiguos. Alterar o valor cria nova intencao/key; reload perde o rascunho, nunca o persiste em
  `localStorage` ou `sessionStorage`.
- Tratar `201` e `200` como sucesso real, distinguindo novo registro de replay apenas quando a
  resposta HTTP estiver disponivel. Nunca presumir sucesso em erro de rede ou `5xx`.
- Aplicar o New Design System SEP ja traduzido para Angular/SCSS: tabela responsiva, badges de
  status, dialogs acessiveis, foco visivel, light/dark e estados de loading/erro/vazio.

## Gate de escopo: chaves Pix

A spec 118 exclui explicitamente gestao de chaves Pix, mas o PRD-FASE-4 §37 exige que o recorte de
Pix avancado fique visivel no web para fechar `v1.0-local`, e o `STATE.md` manda avaliar essa
visibilidade na F-18.

No Gate F-18.0, registrar uma destas decisoes antes de implementar:

1. manter chaves fora da F-18 e criar destino web posterior explicito; ou
2. ampliar formalmente a spec 118 e sua rastreabilidade antes de adicionar qualquer task de chaves.

Este step nao inclui implementacao silenciosa de chaves Pix. Split Pix e Pix automatico continuam
fora de escopo em qualquer caso.

> **Decisao registrada (Gate F-18.0, 2026-07-16)**: opcao 1 — chaves Pix **fora da F-18**. A spec
> 118 permanece como esta. Destino web posterior explicito: sprint web dedicada de visibilidade de
> chaves Pix (spec propria, apos a F-19; paralela ao recorte mobile da M-16). O item de Pix avancado
> do `v1.0-local` **nao** pode ser marcado como concluido pela F-18; a pendencia segue rastreada no
> PRD-FASE-4 §37 e no fechamento desta sprint em `STATE.md`.

## Fora de escopo

- Alterar endpoint, DTO, migration ou regra no `sep-api`.
- Calcular elegibilidade, valor elegivel, total, estado ou ownership no browser.
- Matching automatico, polling de sugestoes ou decisao automatica.
- Disparar aporte ao confirmar matching ou liquidar/reconciliar aporte pelo frontend.
- Expor motivo interno de decisao, decisor, snapshot bruto, score, PII, dados bancarios, escrow,
  provider, idempotency key ou motivo tecnico de falha.
- Movimentar dinheiro real ou ativar Celcoin/BaaS; providers seguem Fake/WireMock.
- Split Pix, Pix automatico e, ate decisao formal do Gate F-18.0, gestao de chaves Pix.
- Refactor amplo da jornada credora, do shell, dos interceptors ou do design system.

## Protocolo obrigatorio por Task

1. Executar somente a Task liberada pelo usuario.
2. Confirmar codigo e contrato atuais antes de editar.
3. Implementar a menor mudanca coerente com a spec e este step.
4. Escrever/ajustar teste observavel para o comportamento alterado.
5. Rodar verificacoes proporcionais ao risco.
6. Parar em checkpoint pre-commit com arquivos, testes, riscos e mensagem sugerida.
7. Aguardar aprovacao antes de `git add`/`git commit`; usar somente paths especificos.
8. Nao iniciar a Task seguinte sem ordem explicita.

**Skills obrigatorias durante a implementacao**:

- `coding-guidelines`: suposicoes explicitas, simplicidade, mudancas cirurgicas e verificacao.
- `clean-code`: nomes intencionais, componentes focados, dialogs acessiveis e testes legiveis.
- `clean-architecture`: componentes orquestram UI via service; regra financeira e seguranca ficam
  no backend; DTOs TypeScript permanecem modelos de borda.

## Rastreabilidade spec 118 -> steps

| Task da spec 118 | Steps |
|------------------|-------|
| 1. Service/modelos de aporte e matching | F-18.1 |
| 2. Sugestoes + decisao assistida com step-up | F-18.2-F-18.3 |
| 3. Aporte assistido + status | F-18.4 |
| 4. Estados, ownership e erros | F-18.2-F-18.5 |
| 5. MSW e Vitest | F-18.1-F-18.5 |
| 6. Smoke Playwright + docs | F-18.6 |
| Gates de cadeia, contrato, baseline e chaves Pix | F-18.0 |

## Ordem de execucao

```text
F-18.0 prechecks + decisao documentada sobre chaves Pix
  -> F-18.1 DTOs + CredoraService + step-up routing
  -> F-18.2 rotas, navegacao e sugestoes de matching
  -> F-18.3 detalhe + decisao assistida
  -> F-18.4 aporte + status operacional e owner-scoped
  -> F-18.5 matriz de erros, concorrencia e acessibilidade
  -> F-18.6 MSW, Vitest, Playwright, docs e fechamento
```

---

## Gate F-18.0 - Prechecks, contrato e recorte final

**Objetivo**: confirmar cadeia Git, contratos integrados, baseline e a fronteira de chaves Pix antes
de editar o `sep-app`.

### Step 118.0.1 - Confirmar cadeia Git do `sep-app`

```bash
cd <sep-app-root>
git fetch --all --prune
git status --short --branch
git log --oneline --decorate -15 origin/develop
git log --oneline --decorate -10 origin/main
git rev-list --left-right --count origin/main...origin/develop
```

**Verificacao**:

- F-Sprint 17 presente em `origin/develop`.
- `main` integrada em `develop`, ou pendencia registrada antes de criar branch.
- Working tree limpa ou mudancas do usuario identificadas e preservadas.

### Step 118.0.2 - Tratar artefato temporario e criar branch

- Em `docs-SEP`, remover `repos/sep-app/SPRINT-F-17-PR.md` somente se ja foi usado no PR.
- Git de `docs-SEP` continua manual.

```bash
cd <sep-app-root>
git switch develop
git pull --ff-only
git switch -c feature/fsprint-18-aporte-matching-credora-web
```

### Step 118.0.3 - Reconfirmar backend integrado e OpenAPI

```bash
cd <sep-api-root>
git log --oneline --decorate -25 origin/develop
sed -n '1,260p' src/main/java/com/dynamis/sep_api/credores/web/controller/AporteCredoraController.java
sed -n '1,280p' src/main/java/com/dynamis/sep_api/credores/web/controller/MatchingCredoraController.java
find src/main/java/com/dynamis/sep_api/credores/web/dto -type f | sort
rg -n "RequireStepUpEstrito|Idempotency-Key|matching|aportes" \
  src/main/java/com/dynamis/sep_api/credores/web
```

Registrar metodo, path, roles, step-up, headers, status HTTP, campos e nullability. Divergencia
contra os contratos deste step bloqueia a implementacao ate alinhamento documental.

### Step 118.0.4 - Mapear base web e seguranca atuais

```bash
cd <sep-app-root>
sed -n '840,980p' src/app/core/api/api.models.ts
sed -n '1,260p' src/app/core/credora/credora.service.ts
sed -n '1,240p' src/app/features/authenticated/credora/credora.routes.ts
sed -n '1,240p' src/app/core/interceptors/step-up.interceptor.ts
sed -n '1,180p' src/app/core/interceptors/error.interceptor.ts
sed -n '1,180p' src/app/layout/sidenav/sidenav.component.ts
rg -n "credora|matching|aporte" src/app src/mocks e2e
```

Confirmar:

- `CredoraService` e os DTOs atuais nao cobrem aporte/matching.
- rota `/app/credora` atual representa a persona `CLIENTE` com presenca de credora.
- rotas operacionais novas precisam de `roleGuard`, sem aplicar `credoraPresenceGuard`.
- `stepUpInterceptor` ainda nao reconhece os dois POSTs novos.
- `TRATA_403_LOCALMENTE` pode ser aplicado somente nas mutacoes cujo `403` de step-up sera tratado
  na propria tela; GET sem role continua no fluxo global de acesso negado.

### Step 118.0.5 - Decidir o destino de chaves Pix

Apresentar ao usuario a divergencia entre spec 118 e PRD/STATE e registrar a decisao escolhida.
Se houver ampliacao da F-18, atualizar primeiro spec, rastreabilidade, estimativa e ordem das tasks;
nao encaixar chaves dentro de F-18.1-F-18.6 sem essa revisao.

### Step 118.0.6 - Rodar baseline

```bash
cd <sep-app-root>
npm run lint
npm run lint:scss
npm run test
npm run build
npm run e2e
```

### Definicao de pronto do Gate F-18.0

- [ ] Cadeia Git web confirmada.
- [ ] Backends 29-30 e contratos runtime confirmados.
- [ ] Fronteira owner-scoped x operacional registrada.
- [ ] Decisao sobre chaves Pix aprovada e documentada.
- [ ] Baseline verde com contagens, ou falha preexistente registrada.

---

## Task F-18.1 - DTOs, CredoraService e step-up routing

**Objetivo**: criar a borda tipada e segura antes das telas.

**Pre-requisito**: Gate F-18.0 concluido.

**Esforco**: 0,5-1 dia.

**Arquivos esperados**:

- `src/app/core/api/api.models.ts`.
- `src/app/core/credora/credora.service.ts`.
- `src/app/core/credora/credora.service.spec.ts`.
- `src/app/core/interceptors/step-up.interceptor.ts` e spec.

### Step 118.1.1 - Adicionar modelos de borda

Adicionar tipos exatos:

```text
StatusMatchingCredoraOperacao = SUGERIDA | CONFIRMADA | REJEITADA
AcaoDecisaoMatching = CONFIRMAR | REJEITAR
StatusAporteCredora = PENDENTE | EM_PROCESSAMENTO | LIQUIDADO | FALHOU
MatchingSugestaoResponse
DecidirMatchingRequest
RegistrarAporteRequest
AporteCredoraResponse
```

Datas permanecem `string` ISO e valores monetarios `number` apenas para entrada/exibicao. Nao
adicionar campos internos nem helpers que calculem elegibilidade ou total.

### Step 118.1.2 - Estender `CredoraService`

Metodos esperados, com nomes equivalentes aceitos se revelarem melhor a intencao:

```text
listarSugestoesMatching()
consultarMatching(sugestaoId)
decidirMatching(sugestaoId, request)
registrarAporte(operacaoId, request, idempotencyKey)
listarAportes(operacaoId)
```

- O service transporta DTOs e headers; nao gera key, nao decide retry e nao interpreta estado.
- `registrarAporte` deve permitir observar `201` x `200` somente se a UI realmente usar essa
  distincao; nao ampliar `observe: 'response'` sem necessidade.

### Step 118.1.3 - Incluir os POSTs no `stepUpInterceptor`

Anexar e consumir token somente em:

```text
POST /credores/matching/{id}/decisao
POST /credores/operacoes/{id}/aportes
```

GETs nunca consomem token. Cobrir match positivo, metodo errado e paths parecidos para impedir
consumo acidental.

### Step 118.1.4 - Testar contrato HTTP

Cobrir URLs/metodos/body, `Idempotency-Key`, DTOs, ausencia de step-up nos GETs e token somente nos
dois POSTs sensiveis.

```bash
npm run test -- --run src/app/core/credora/credora.service.spec.ts
npm run test -- --run src/app/core/interceptors/step-up.interceptor.spec.ts
npm run lint
```

### Definicao de pronto da Task F-18.1

- [ ] DTOs publicos fieis e minimos.
- [ ] Cinco operacoes HTTP centralizadas no `CredoraService`.
- [ ] Step-up anexado somente aos POSTs corretos.
- [ ] Nenhuma regra financeira ou ownership no frontend.

### Commit sugerido

```text
feat(web): adicionar contratos de aporte e matching da credora
```

---

## Task F-18.2 - Rotas, navegacao e sugestoes de matching

**Objetivo**: oferecer a `FINANCEIRO`/`ADMIN` uma fila explicita de sugestoes pendentes, sem
polling nem decisao automatica.

**Pre-requisito**: Task F-18.1 concluida.

**Esforco**: 0,5-1 dia.

### Step 118.2.1 - Criar rotas operacionais protegidas

Adicionar as rotas propostas em `credora.routes.ts` com `roleGuard` e roles
`FINANCEIRO`/`ADMIN`. Nao aplicar `credoraPresenceGuard` nelas. Preservar sem alteracao o acesso
`CLIENTE` a perfil/oportunidades/carteira.

Adicionar item de navegacao `Matching de credoras` somente para `FINANCEIRO`/`ADMIN`; `CLIENTE` e
`BACKOFFICE` nao veem o item. O menu `Credora` da persona `CLIENTE` continua separado.

### Step 118.2.2 - Criar pagina de sugestoes

Na entrada, executar uma unica chamada a `listarSugestoesMatching()` e explicar que a atualizacao
pode gerar novas sugestoes auditadas.

Exibir:

- operacao e empresa credora por IDs curtos, sem expor UUID integral como titulo;
- valor elegivel recebido do backend;
- criterios funcionais recebidos;
- status e data de criacao;
- link para detalhe/decisao.

Nao inventar nome de credora, tomador ou contrato: esses campos nao existem no DTO.

### Step 118.2.3 - Controlar refresh-on-read

- Sem interval, polling, refresh invisivel ao recuperar foco ou repeticao automatica.
- Permitir `Atualizar sugestoes` apenas por gesto explicito, com aviso curto e botao bloqueado
  enquanto a request estiver em andamento.
- Lista vazia e estado valido; nao fabricar fixtures na UI nem reter lista como fonte autoritativa.

### Step 118.2.4 - Testar acesso e listagem

Cobrir roles, uma chamada inicial, refresh explicito, ausencia de polling, vazio, erro/retry e
renderizacao fiel do DTO.

```bash
npm run test -- --run src/app/features/authenticated/credora
npm run test -- --run src/app/layout/sidenav/sidenav.component.spec.ts
npm run lint
npm run lint:scss
```

### Definicao de pronto da Task F-18.2

- [ ] Rotas e menu restritos a `FINANCEIRO`/`ADMIN`.
- [ ] Sugestoes renderizadas sem PII nem dados inventados.
- [ ] Refresh-on-read acionado conscientemente, sem polling.
- [ ] Loading, vazio, erro e retry acessiveis.

### Commit sugerido

```text
feat(web): listar sugestoes de matching da credora
```

---

## Task F-18.3 - Detalhe e decisao assistida com step-up

**Objetivo**: confirmar ou rejeitar uma sugestao somente apos reconsulta, confirmacao acessivel e
step-up valido.

**Pre-requisito**: Task F-18.2 concluida.

**Esforco**: 1 dia.

### Step 118.3.1 - Criar detalhe autoritativo

Carregar `GET /matching/{sugestaoId}` ao entrar. Exibir todos os campos publicos relevantes e
habilitar decisoes somente em `SUGERIDA`. Em status terminal, mostrar resultado e data sem CTA de
repeticao.

### Step 118.3.2 - Reconsultar antes de decidir

Ao clicar em confirmar ou rejeitar:

1. bloquear abertura/submit concorrente;
2. reconsultar o detalhe;
3. abrir dialog somente se o status atual ainda for `SUGERIDA`;
4. apresentar acao, valor elegivel e operacao atuais;
5. permitir motivo opcional com contador/limite de 255 caracteres.

Falha na reconsulta nao chama o POST.

### Step 118.3.3 - Orquestrar MFA e step-up

- Sem MFA ativo, bloquear a decisao e orientar habilitacao; nao tentar bypass.
- Sem token, navegar para `/app/step-up?next=<rota-do-detalhe>`.
- No retorno, reconsultar o detalhe e exigir novo clique; nunca retomar o POST automaticamente.
- Aplicar `TRATA_403_LOCALMENTE` ao POST para que token ausente/expirado ofereca nova verificacao
  explicita sem loop. GET/guard de role permanecem no tratamento global.

### Step 118.3.4 - Submeter uma unica decisao

- Desabilitar os dois CTAs durante o POST.
- Sucesso substitui o detalhe pela resposta terminal.
- `409` reconsulta e mostra que a sugestao ja foi decidida.
- `404` usa mensagem neutra, sem ecoar ID.
- Rede/`5xx` nao presume decisao; oferecer reconsulta antes de nova tentativa.

O texto de sucesso de `CONFIRMADA` deve afirmar que o matching foi registrado e que o aporte e um
passo separado. Nunca dizer que recursos foram transferidos.

### Step 118.3.5 - Garantir dialog acessivel

Reusar o padrao corrigido na F-16: `role="dialog"`, `aria-modal`, titulo associado, foco inicial,
trap de `Tab`, `Escape`, restauracao de foco e acao destrutiva semanticamente distinta.

### Definicao de pronto da Task F-18.3

- [ ] Decisao somente sobre estado atual `SUGERIDA`.
- [ ] Confirmar/rejeitar exigem confirmacao e step-up proprio.
- [ ] Retorno do step-up nunca executa decisao.
- [ ] `409`/`404`/rede nao viram sucesso presumido.
- [ ] Confirmacao nao promete nem dispara aporte.

### Commit sugerido

```text
feat(web): permitir decisao assistida de matching
```

---

## Task F-18.4 - Aporte assistido e status da operacao

**Objetivo**: iniciar um aporte separado a partir de matching confirmado e apresentar o ciclo de
status tanto ao operador quanto a empresa credora dona.

**Pre-requisito**: Task F-18.3 concluida.

**Esforco**: 1 dia.

### Step 118.4.1 - Criar rota/pagina operacional de aporte

Na rota `/app/credora/matching/:sugestaoId/aporte`:

- reconsultar o matching;
- aceitar acesso somente para `FINANCEIRO`/`ADMIN` pelo guard;
- oferecer CTA apenas se o backend retornar `CONFIRMADA`;
- usar `operacaoId` como path do POST e preencher o valor inicial com `valorElegivel` recebido;
- permitir revisao consciente do valor, sem calcular, somar ou aplicar capacidade local.

O backend continua validando operacao ativa, contrato assinado e valor.

### Step 118.4.2 - Confirmar e registrar com idempotencia

Antes do POST:

1. validar apenas formato frontend (obrigatorio, positivo, ate duas casas);
2. abrir dialog acessivel com valor e aviso de provider fake/local;
3. exigir MFA e step-up, usando a propria rota como `next`;
4. apos retorno, reconsultar matching/aportes e exigir novo clique;
5. criar key com `crypto.randomUUID()` para a intencao confirmada.

Reusar a mesma key em retry de rede/`5xx` sem alteracao do valor, sempre com novo step-up valido,
porque o token anterior e de uso unico. Mudanca do valor invalida a intencao e gera key nova somente
na proxima confirmacao. Nunca mostrar nem persistir a key.

### Step 118.4.3 - Apresentar resposta e historico operacional

Depois de `201` ou `200`, renderizar o DTO retornado e reconsultar `GET /aportes`. Exibir lista em
ordem recebida, valor, status e datas. Atualizacao posterior ocorre apenas por botao `Atualizar
status`; sem polling e sem endpoint ficticio de reconciliacao.

Mensagens por estado:

- `PENDENTE`/`EM_PROCESSAMENTO`: processamento local em andamento, sem garantia de liquidacao;
- `LIQUIDADO`: status confirmado pelo backend;
- `FALHOU`: falha generica; o contrato publico nao traz motivo tecnico.

### Step 118.4.4 - Expor leitura owner-scoped na carteira

Estender `/app/credora/carteira/:id` para chamar `listarAportes(operacaoId)` e mostrar a mesma
representacao somente leitura. Nao exibir registrar, retry, matching ou qualquer mutacao para a
persona credora `CLIENTE`.

- `[]` = nenhum aporte registrado.
- `404` = operacao indisponivel/neutra, coerente com o detalhe atual.
- Falha da lista de aportes nao deve apagar um detalhe de carteira ja carregado; apresentar erro
  localizado com retry.

### Step 118.4.5 - Testar os dois recortes

Cobrir prefill autoritativo, edicao sem calculo, key por intencao/retry, `201`/`200`, estados,
refresh explicito, ausencia de polling e owner sem CTA de mutacao.

### Definicao de pronto da Task F-18.4

- [ ] Aporte continua passo separado do matching.
- [ ] Step-up e idempotencia corretos, sem persistencia sensivel.
- [ ] Status vem somente do POST/GET backend.
- [ ] Operador e owner veem o recorte permitido; owner nao ve mutacao.
- [ ] UI deixa explicito que a Fase 4 usa provider fake/local.

### Commit sugerido

```text
feat(web): adicionar aporte assistido e status da credora
```

---

## Task F-18.5 - Erros, concorrencia, acessibilidade e cobertura focada

**Objetivo**: fechar a matriz negativa sem reinterpretar regra de negocio.

**Pre-requisito**: Task F-18.4 concluida.

**Esforco**: 0,5-1 dia.

### Step 118.5.1 - Fixar matriz de resposta

| Resposta | Matching | Aporte |
|----------|----------|--------|
| `400` | acao/motivo invalido; manter formulario | valor/key invalido; manter formulario |
| `403` GET | acesso negado global | acesso negado conforme persona/rota |
| `403` POST | limpar estado efemero e oferecer novo step-up | idem, preservando a intencao sem reenviar |
| `404` | recurso indisponivel neutro | operacao indisponivel neutra; sem enumeracao |
| `409` | reconsultar estado terminal | elegibilidade/key conflitante; reconsultar lista, sem sucesso presumido |
| rede/`5xx` | estado desconhecido; reconsultar antes de repetir | reusar key da mesma intencao e reconsultar |

Mensagens nao ecoam UUID, header, payload bruto ou detalhe de provider.

### Step 118.5.2 - Cobrir concorrencia e duplo submit

- uma request por comando;
- CTAs bloqueados durante GET de reverificacao e POST;
- dialogs nao sobrepostos;
- resposta tardia de request anterior nao sobrescreve recurso mais novo;
- `409` sempre converge por nova leitura.

### Step 118.5.3 - Revisar acessibilidade e responsividade

- heading unico por pagina, landmarks e status anunciados;
- tabela vira cards/lista legivel em viewport estreito, sem ocultar acao ou estado;
- badges possuem texto, nao dependem so de cor;
- foco, teclado, dialogs, erros e retry verificaveis;
- light/dark e zoom de 200% sem perda funcional.

### Step 118.5.4 - Rodar suite focada e completa

```bash
npm run test -- --run src/app/core/credora
npm run test -- --run src/app/features/authenticated/credora
npm run test -- --run src/app/core/interceptors/step-up.interceptor.spec.ts
npm run lint
npm run lint:scss
npm run test
npm run build
```

### Definicao de pronto da Task F-18.5

- [ ] Matriz `400/403/404/409/rede` coberta.
- [ ] Concorrencia e duplo submit nao duplicam comandos.
- [ ] Nenhum erro presume decisao, aporte ou liquidacao.
- [ ] Fluxos operacionais e owner-scoped acessiveis e responsivos.

### Commit sugerido

```text
test(web): cobrir erros de aporte e matching
```

---

## Task F-18.6 - MSW, smoke Playwright, docs e fechamento

**Objetivo**: validar as jornadas integradas, atualizar a documentacao e preparar o PR.

**Pre-requisito**: Task F-18.5 concluida.

**Esforco**: 0,5 dia.

### Step 118.6.1 - Completar MSW stateful

Fixtures/handlers devem representar:

- sugestao `SUGERIDA`, decisao `CONFIRMADA` e `REJEITADA`;
- refresh-on-read idempotente, sem duplicar sugestao;
- decisao `409` em terminal e `404` neutro;
- aporte novo `201`, replay da mesma key/valor `200`, conflito `409`;
- lista vazia e aportes nos quatro estados;
- owner credora com operacao propria e `404` para alheia;
- reset deterministico entre specs.

O mock valida `X-Step-Up-Token` e `Idempotency-Key`; nao altera o comportamento de producao para
facilitar o teste.

### Step 118.6.2 - Criar smoke Playwright

Cobrir ao menos:

1. `FINANCEIRO`/`ADMIN`: sugestoes -> detalhe -> confirmacao -> step-up -> gesto explicito ->
   decisao -> CTA separado de aporte;
2. aporte -> confirmacao -> step-up -> gesto explicito -> `201/200` -> status/lista;
3. empresa credora: carteira -> detalhe -> status de aportes somente leitura;
4. role indevida nao ve menu e nao acessa rota operacional.

Se o MSW nao conseguir concluir TOTP de forma fiel, o smoke offline deve ao menos provar o
redirecionamento e a ausencia de auto-submit; a decisao/aporte com token real vira smoke local com
backend `:8080`, registrado como gate, nao como sucesso simulado.

### Step 118.6.3 - Atualizar docs obrigatorios

- `docs-SEP/repos/sep-app/README.md`: rotas, contratos, personas, refresh-on-read, step-up,
  idempotencia, estados, testes e limitacao fake/local.
- `docs-SEP/docs-sep/WEB-SCREENS-PLAN.md`: matching/aporte/status como implementados quando a sprint
  fechar.
- `docs-SEP/AI-ROADMAP.md`: F-18 e temas aporte/matching apontando para spec + este step.
- `docs-SEP/repos/sep-app/SPRINT-F-18-PR.md`: criar descricao temporaria consolidada ao fim.
- No fechamento mergeado: atualizar PRD-FASE-4, `STATE.md` e apendar historico curto em
  `CONTEXT-PARTE-2.md`.

Registrar explicitamente o destino aprovado para chaves Pix; a F-18 nao pode ser usada para marcar
o item do `v1.0-local` como concluido se ele continuar sem superficie web.

### Step 118.6.4 - Rodar gate final

```bash
cd <sep-app-root>
npm run lint
npm run lint:scss
npm run test
npm run build
npm run e2e
npm audit --omit=dev
git status --short --branch
git diff --stat
```

### Step 118.6.5 - Checkpoint final pre-commit

Apresentar:

- arquivos criados/modificados/removidos;
- testes, lint, build, E2E e audit com resultados/contagens;
- evidencias dos fluxos matching -> decisao e aporte -> status;
- riscos: provider fake, reconciliacao sem endpoint web, smoke TOTP real e destino de chaves Pix;
- mensagem de commit sugerida.

Criar/atualizar `repos/sep-app/SPRINT-F-18-PR.md`, mas nao executar Git em `docs-SEP`. Push e PR do
`sep-app` permanecem manuais.

### Definicao de pronto da Task F-18.6

- [ ] MSW/Vitest cobrem contratos, estados e erros.
- [ ] Playwright cobre os fluxos proporcionais ao ambiente, sem bypass enganoso.
- [ ] Docs e roadmap atualizados.
- [ ] PR description temporaria criada.
- [ ] Gate final verde ou pendencias objetivas registradas.

### Commit sugerido

```text
test(web): validar jornada de aporte e matching da credora
```

---

## Definition of Done da F-Sprint 18

- [ ] `FINANCEIRO`/`ADMIN` lista sugestoes sem polling e entende o efeito de refresh-on-read.
- [ ] Decisao e sempre explicita, reverificada e protegida por step-up estrito.
- [ ] Confirmar matching nao cria nem promete aporte.
- [ ] Aporte e separado, confirmado, idempotente e protegido por step-up estrito.
- [ ] Operador acompanha status e empresa credora dona recebe leitura owner-scoped sem mutacao.
- [ ] Valores, criterios e estados refletem o backend; nenhuma regra financeira e recalculada.
- [ ] `400/403/404/409/rede`, concorrencia e duplo submit possuem cobertura proporcional.
- [ ] Nenhum dado interno, UUID em erro, key, PII, escrow ou provider vaza na UI.
- [ ] New Design System SEP, acessibilidade, responsividade e light/dark verificados.
- [ ] MSW, Vitest, lint, SCSS lint, build e Playwright verdes.
- [ ] Decisao sobre chaves Pix registrada sem marcar visibilidade inexistente como concluida.
- [ ] README web, WEB-SCREENS-PLAN, AI-ROADMAP e PR description atualizados.
