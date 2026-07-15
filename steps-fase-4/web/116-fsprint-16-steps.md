# Steps - F-Sprint 16 - Renegociacao do tomador no web

**Spec de origem**: [`116-fsprint-16-renegociacao-tomador-web.md`](../../specs/fase-4/116-fsprint-16-renegociacao-tomador-web.md)

**Status**: concluida em 2026-07-15 — PR #87 para `develop` (squash `908c353`; 7 commits
absorvidos) e PR #88 para `main`; follow-up mergeado via PR #89 (squash `d9f9733`) + PR
#90 (`develop` == `main`). Gate final: lint, lint:scss, Vitest, build e Playwright
verdes. **Conteudo do follow-up** (3 commits):
(1) `57bcea6` reaplica a extensao do smoke Playwright de cobranca (F-16.6, 3 -> 6
cenarios), que ficou fora do squash #87; (2) `c90640e` fecha os 3 findings do review
manual pos-merge — P1 `HttpContextToken` `TRATA_403_LOCALMENTE` suprime o redirect global
de 403 nos endpoints da decisao (o errorInterceptor ejetava o usuario antes do
"Verificar novamente"; specs agora integram o interceptor real), P2 dialogo acessivel de
verdade (aria-modal, foco gerenciado/restaurado, Escape, trap de Tab), P2 smokes F-16 com
persona `tomador@empresa.com` (CLIENTE + MFA) em vez de ADMIN; (3) `5db67ad` alinha o
comentario da tela ao novo tratamento de 403. Gate do follow-up: lint,
lint:scss, Vitest 487, build, cobranca e2e 6/6. Pendencias registradas: aceite com TOTP
real validado apenas no smoke real com backend :8080 (desafio MFA nao tem handler no
MSW); cenario de proposta expirada representado no mock apenas via status (sem relogio).

**Objetivo geral**: fechar no `sep-app` o gap da F-Sprint 9, permitindo que o tomador consulte os
termos autoritativos de uma renegociacao ativa e decida por aceite ou recusa. O aceite exige
confirmacao explicita, MFA ativo e step-up estrito de uso unico; a recusa exige confirmacao, mas nao
consome step-up. Valores, total, elegibilidade, ownership e transicoes continuam no backend.

**Esforco total estimado**: 3-4 dias de Dev Pleno Frontend.

**Repos de destino**:

- `sep-app`: modelos de borda, service, rota/tela, MSW, Vitest e Playwright.
- `docs-SEP`: docs operacionais e indices; toda operacao Git permanece manual.

**Branch sugerida**: `feature/fsprint-16-renegociacao-tomador-web`.

## Contratos backend consumidos

### Leitura owner-scoped dos termos

```http
GET /api/v1/cobranca/parcelas/{parcelaId}/renegociacao-ativa
```

- `ROLE_CLIENTE`, sem step-up e sem mutacao.
- `200 RenegociacaoTomadorResponse` somente para `PROPOSTA` ainda nao expirada.
- `403` uniforme para parcela inexistente ou alheia, sem UUID no corpo.
- `404` para parcela propria sem proposta ativa, proposta decidida ou expirada.
- Resposta publica com exatamente dez campos:
  `renegociacaoId`, `parcelaId`, `status`, `novoValorParcela`, `numeroParcelas`,
  `valorTotalRenegociado`, `novoVencimento`, `desconto`, `dataProposta` e `dataExpiracao`.

### Decisao

```http
PATCH /api/v1/cobranca/renegociacoes/{renegociacaoId}/aceite
PATCH /api/v1/cobranca/renegociacoes/{renegociacaoId}/recusa
```

- Aceite: tomador owner + `X-Step-Up-Token` de uso unico + MFA ativo
  (`@RequireStepUpEstrito`); cria nova obrigacao e agenda substituta.
- Recusa: tomador owner, sem step-up; rejeita a proposta e restaura o estado anterior da parcela.
- Ownership e validada antes do estado. A UI nao pode inferir status ou existencia de recurso alheio.
- `409` representa proposta decidida/expirada concorrentemente ou estado ja alterado.

## Decisoes da sprint

- Criar a rota `/app/cobranca/parcelas/:parcelaId/renegociacao`, coerente com o detalhe atual da
  parcela e suficiente para formar o `next` do step-up sem transportar IDs operacionais extras.
- Mostrar CTA no detalhe somente quando a parcela vier como `EM_NEGOCIACAO`. A condicao e apenas de
  UX; o GET owner-scoped continua sendo a fonte final da disponibilidade.
- Criar `RenegociacaoTomadorResponse` separado do `RenegociacaoResponse` interno ja usado pelas
  mutacoes. Nao ampliar nem reutilizar o DTO interno na tela publica.
- Exibir `valorTotalRenegociado` recebido do backend. Nunca calcular
  `novoValorParcela * numeroParcelas`, nem derivar desconto, expiracao ou elegibilidade.
- Consultar os termos ao entrar e novamente antes de abrir qualquer confirmacao. Depois do retorno
  do step-up, recarregar termos e exigir novo clique; jamais aceitar automaticamente.
- Manter o token somente no `StepUpTokenStore`; o `stepUpInterceptor` ja possui match method-aware
  para o PATCH de aceite. GET e recusa nao podem consumir o token.
- Nao distinguir ownership por mensagem do backend. No aceite, `403` apos tentativa autenticada
  deve limpar estado efemero e oferecer nova verificacao de forma explicita, sem loop automatico;
  nos GETs, `403` permanece acesso negado neutro.
- Bloquear duplo submit separadamente para aceite e recusa. Falha de rede ou `5xx` nunca vira
  decisao presumida.
- Aplicar o New Design System SEP ja materializado em Angular/SCSS: tokens e mixins existentes,
  dialog/confirmacao acessivel, foco visivel, light/dark e layout responsivo. Nao instalar framework
  CSS nem criar tokens paralelos.

## Fora de escopo

- Novo endpoint ou alteracao no `sep-api`.
- Proposta de renegociacao pelo financeiro, ja entregue na F-Sprint 9.
- Calculo de total, juros, multa, desconto, vencimento, expiracao ou status no frontend.
- Exposicao de `tomadorId`, `propostaPor`, IDs de agenda, justificativa interna, auditoria ou payload
  de provider.
- Pix automatico, boleto, BI ou mudanca de workflow de cobranca.
- Persistencia de termos, IDs tecnicos ou token de step-up em `localStorage`/`sessionStorage`.
- Refactor amplo do interceptor ou da feature de cobranca.

## Protocolo obrigatorio por Task

1. Executar somente a Task liberada pelo usuario.
2. Confirmar o codigo e o contrato atuais antes de editar.
3. Implementar a menor mudanca coerente com a spec.
4. Rodar as verificacoes proporcionais ao risco da Task.
5. Parar em checkpoint pre-commit com arquivos, testes, riscos e mensagem sugerida.
6. Aguardar aprovacao antes de `git add`/`git commit`; usar somente paths especificos.
7. Nao iniciar a Task seguinte sem ordem explicita.

**Skills obrigatorias durante a implementacao**:

- `coding-guidelines`: suposicoes explicitas, mudanca cirurgica e verificacao orientada a meta.
- `clean-code`: nomes intencionais, componentes focados e testes legiveis.
- `clean-architecture`: componente orquestra estado de UI via service; regra financeira e seguranca
  permanecem no backend; modelos TypeScript sao DTOs de borda.

## Ordem de execucao

```text
F-16.0 prechecks e contrato
  -> F-16.1 DTO publico + CobrancaService
  -> F-16.2 rota, CTA e tela de termos
  -> F-16.3 aceite com confirmacao + step-up
  -> F-16.4 recusa + reconsulta + anti duplo-submit
  -> F-16.5 erros, concorrencia e recuperacao
  -> F-16.6 MSW, Vitest, Playwright, docs e fechamento
```

---

## Gate F-16.0 - Prechecks e contrato

**Objetivo**: confirmar cadeia Git, integracoes backend, baseline e estrutura atual antes de editar.

### Step 116.0.1 - Confirmar cadeia Git do `sep-app`

```bash
cd <sep-app-root>
git fetch --all --prune
git status --short --branch
git log --oneline --decorate -15 origin/develop
git log --oneline --decorate -10 origin/main
git rev-list --left-right --count origin/main...origin/develop
```

**Verificacao**:

- `origin/develop` contem a F-Sprint 15 e esta apta a iniciar a F-16.
- `main` foi integrada em `develop`, ou a pendencia foi registrada antes de criar a branch.
- Working tree limpa ou mudancas do usuario identificadas e preservadas.
- Se a sprint web anterior nao estiver integrada, parar e pedir aprovacao antes de implementar.

### Step 116.0.2 - Tratar artefato temporario e criar branch

- Em `docs-SEP`, remover `repos/sep-app/SPRINT-F-*-PR.md` anterior somente se o arquivo ja tiver
  sido usado no PR correspondente. Git de `docs-SEP` continua manual.

```bash
cd <sep-app-root>
git switch develop
git pull --ff-only
git switch -c feature/fsprint-16-renegociacao-tomador-web
```

### Step 116.0.3 - Reconfirmar backend integrado

```bash
cd <sep-api-root>
git log --oneline --decorate -20 origin/develop
rg -n "renegociacao-ativa|RenegociacaoTomadorResponse" src/main/java src/test
rg -n "RequireStepUpEstrito|renegociacoes/.*/aceite|renegociacoes/.*/recusa" \
  src/main/java/com/dynamis/sep_api/cobranca
```

**Verificacao**:

- Sprint 24 presente em `develop`: GET owner-scoped e DTO publico de dez campos.
- Sprint 27 presente: aceite usa step-up estrito, recusa nao usa step-up e ownership precede estado.
- Nenhuma credencial Celcoin/AWS e necessaria para a F-16.
- Divergencia de path, campos, status ou seguranca bloqueia a implementacao ate alinhamento.

### Step 116.0.4 - Mapear a base web existente

```bash
cd <sep-app-root>
sed -n '400,550p' src/app/core/api/api.models.ts
sed -n '1,240p' src/app/core/cobranca/cobranca.service.ts
sed -n '1,220p' src/app/features/authenticated/cobranca/cobranca.routes.ts
sed -n '1,280p' src/app/features/authenticated/cobranca/pages/parcela-detail-page.component.ts
sed -n '1,220p' src/app/core/interceptors/step-up.interceptor.ts
rg -n "renegoci|cobranca" src/mocks/handlers.ts e2e/cobranca.spec.ts
```

**Verificacao**:

- `CobrancaService` ja possui os PATCHes de aceite/recusa.
- `stepUpInterceptor` anexa token apenas no PATCH de aceite, nao no GET nem na recusa.
- Nao existe rota/tela de decisao nem metodo de consulta da renegociacao ativa.
- O detalhe atual da parcela e o ponto correto para o CTA `EM_NEGOCIACAO`.

### Step 116.0.5 - Rodar baseline

```bash
cd <sep-app-root>
npm run lint
npm run lint:scss
npm run test
npm run build
```

**Verificacao**:

- Baseline verde antes das alteracoes.
- Falha preexistente registrada com evidencia e alinhada com o usuario antes de seguir.

### Definicao de pronto do Gate F-16.0

- [ ] Cadeia Git web confirmada.
- [ ] Backend Sprints 24 e 27 confirmado em `develop`.
- [ ] Contrato e lacunas atuais reconfirmados.
- [ ] Baseline verde ou falha preexistente documentada.

---

## Task F-16.1 - DTO publico e CobrancaService

**Objetivo**: criar a borda tipada da consulta owner-scoped antes da UI.

**Pre-requisito**: Gate F-16.0 concluido.

**Esforco**: 0,5 dia.

**Arquivos esperados**:

- `src/app/core/api/api.models.ts`.
- `src/app/core/cobranca/cobranca.service.ts`.
- `src/app/core/cobranca/cobranca.service.spec.ts`.

### Step 116.1.1 - Adicionar `RenegociacaoTomadorResponse`

Adicionar exatamente os dez campos do contrato backend. Datas permanecem `string` ISO e valores
monetarios permanecem `number` somente como representacao de borda/exibicao.

**Assercoes negativas**:

- Nao incluir `tomadorId`, `propostaPor`, `agendaOriginalId`, `agendaSubstitutaId`,
  `statusParcelaAnterior` ou `justificativa`.
- Nao adicionar getter/helper de total; usar `valorTotalRenegociado` da resposta.
- Nao substituir o `RenegociacaoResponse` existente das mutacoes.

### Step 116.1.2 - Adicionar consulta ao service

Metodo esperado:

```text
consultarRenegociacaoAtiva(parcelaId: string): Observable<RenegociacaoTomadorResponse>
```

Path:

```text
GET /api/v1/cobranca/parcelas/{parcelaId}/renegociacao-ativa
```

O service apenas transporta o DTO; nao calcula total, nao interpreta expiracao e nao envia token.

### Step 116.1.3 - Testar contrato HTTP

Cobrir:

- metodo e URL exatos da consulta;
- resposta tipada com os dez campos;
- GET sem `X-Step-Up-Token` mesmo quando o store possui token;
- regressao dos PATCHes: aceite continua PATCH e recusa continua PATCH.

```bash
npm run test -- --run src/app/core/cobranca/cobranca.service.spec.ts
npm run lint
```

### Definicao de pronto da Task F-16.1

- [ ] DTO publico minimo e fiel ao backend.
- [ ] Consulta centralizada no `CobrancaService`.
- [ ] Nenhum calculo financeiro ou campo interno adicionado.
- [ ] Specs focadas verdes.

### Commit sugerido

```text
feat(web): adicionar consulta de renegociacao ativa do tomador
```

---

## Task F-16.2 - Rota, CTA e tela de termos

**Objetivo**: permitir que o tomador navegue da parcela `EM_NEGOCIACAO` para os termos completos e
autoritativos da proposta.

**Pre-requisito**: Task F-16.1 concluida.

**Esforco**: 0,5-1 dia.

**Arquivos esperados**:

- `src/app/features/authenticated/cobranca/cobranca.routes.ts`.
- `src/app/features/authenticated/cobranca/pages/parcela-detail-page.component.{ts,html,spec.ts}`.
- `src/app/features/authenticated/cobranca/pages/renegociacao-tomador-page.component.{ts,html,scss,spec.ts}`.

### Step 116.2.1 - Criar rota lazy de decisao

Adicionar depois da rota de detalhe da parcela:

```text
/app/cobranca/parcelas/:parcelaId/renegociacao
```

- Componente standalone/lazy conforme padrao atual.
- Breadcrumb curto, sem expor UUID.
- Nao criar guard de ownership no frontend; backend continua sendo a autoridade.

### Step 116.2.2 - Adicionar CTA no detalhe da parcela

- Exibir `Ver proposta de renegociacao` somente quando `status === 'EM_NEGOCIACAO'`.
- Usar link/CTA acessivel e estilo existente do New Design System SEP.
- Nao inferir proposta ativa para outros status e nao transportar `renegociacaoId` na URL.
- Se o GET posterior responder `404`, informar proposta indisponivel e recarregar a parcela.

### Step 116.2.3 - Criar tela de termos

Ao entrar, chamar `consultarRenegociacaoAtiva(parcelaId)` e apresentar:

- status da proposta;
- novo valor por parcela;
- quantidade de parcelas;
- valor total renegociado do backend;
- primeiro vencimento;
- desconto;
- data da proposta;
- data de expiracao.

Nao apresentar IDs tecnicos, operador, justificativa, agenda ou linguagem que sugira aceite
automatico/quitação garantida.

**Estados obrigatorios**:

- loading com `role="status"`;
- termos carregados;
- erro recuperavel com retry explicito;
- proposta indisponivel/expirada;
- acesso negado neutro, sem enumeracao.

### Step 116.2.4 - Aplicar design e acessibilidade

- Reusar tokens/mixins de `src/styles/_sep-ds-*`; nao criar paleta paralela.
- Hierarquia de pagina + card/painel unico de termos, sem cards aninhados.
- Valores e datas com formatadores visuais existentes ou helper focado.
- Light/dark, foco visivel, teclado e viewport mobile/desktop.
- CTAs de aceitar/recusar semanticamente distintos, sem depender apenas de cor.

### Step 116.2.5 - Testar navegacao e termos

Cobrir:

- CTA aparece somente em `EM_NEGOCIACAO`;
- rota usa `parcelaId` e dispara o GET correto;
- oito termos visuais usam os dados da resposta;
- total exibido e exatamente `valorTotalRenegociado`;
- campos internos nao aparecem no DOM;
- loading, retry, `403` e `404` sao acessiveis.

```bash
npm run test -- --run src/app/features/authenticated/cobranca/pages/parcela-detail-page.component.spec.ts
npm run test -- --run src/app/features/authenticated/cobranca/pages/renegociacao-tomador-page.component.spec.ts
npm run lint
npm run lint:scss
```

### Definicao de pronto da Task F-16.2

- [ ] Rota e CTA navegaveis.
- [ ] Termos completos e autoritativos exibidos.
- [ ] Nenhum campo interno ou calculo local.
- [ ] Estados e acessibilidade cobertos.

### Commit sugerido

```text
feat(web): exibir termos da renegociacao do tomador
```

---

## Task F-16.3 - Aceite consciente com step-up estrito

**Objetivo**: aceitar a proposta somente apos termos atuais, confirmacao explicita e step-up valido.

**Pre-requisito**: Task F-16.2 concluida.

**Esforco**: 0,5-1 dia.

### Step 116.3.1 - Reconsultar antes da confirmacao

Ao clicar em aceitar:

1. Bloquear abertura concorrente de confirmacoes.
2. Reexecutar o GET de termos.
3. Abrir confirmacao somente com a nova resposta.
4. Mostrar valor total, quantidade, valor por parcela, vencimento e expiracao atuais.
5. Se o GET falhar, nao abrir confirmacao e nao chamar PATCH.

### Step 116.3.2 - Orquestrar MFA e step-up

- Se `currentUser().mfaHabilitado` for falso, bloquear aceite e orientar habilitacao; nao tentar o
  bypass que o backend estrito rejeita.
- Se nao houver token no `StepUpTokenStore`, navegar para:

```text
/app/step-up?next=/app/cobranca/parcelas/{parcelaId}/renegociacao
```

- O `next` deve ser montado de rota conhecida, sem aceitar URL externa.
- Ao voltar, recarregar os termos e exigir novo clique/confirmacao. A presenca do token nao dispara
  PATCH em `ngOnInit`, effect, subscription ou callback de navegacao.

### Step 116.3.3 - Enviar aceite uma unica vez

- Na confirmacao final, chamar `aceitarRenegociacao(renegociacaoId)` usando o ID do snapshot recem
  lido.
- O `stepUpInterceptor` anexa e consome o token somente no PATCH de aceite.
- Desabilitar ambos os CTAs enquanto a decisao estiver em voo.
- Em sucesso, limpar confirmacao/estado efemero, recarregar a parcela e sair da tela de proposta ou
  apresentar estado final sem permitir nova decisao.

### Step 116.3.4 - Provar a allowlist do interceptor

Preservar e reforcar testes existentes:

- PATCH de aceite recebe header e consome token uma vez;
- GET de termos nao recebe header nem consome token;
- PATCH de recusa nao recebe header nem consome token;
- URL parecida ou metodo diferente nao recebe header;
- ausencia de token deixa o PATCH seguir sem header para o backend responder `403`.

```bash
npm run test -- --run src/app/core/interceptors/step-up.interceptor.spec.ts
npm run test -- --run src/app/features/authenticated/cobranca/pages/renegociacao-tomador-page.component.spec.ts
```

### Definicao de pronto da Task F-16.3

- [ ] Termos reconsultados antes da confirmacao.
- [ ] Usuario sem MFA nao tenta aceite.
- [ ] Usuario sem token segue para step-up seguro.
- [ ] Retorno do step-up nunca aceita automaticamente.
- [ ] PATCH ocorre uma vez e token e consumido somente nele.

### Commit sugerido

```text
feat(web): implementar aceite de renegociacao com step-up
```

---

## Task F-16.4 - Recusa, reconsulta e anti duplo-submit

**Objetivo**: permitir recusa explicita com termos atuais, sem iniciar nem consumir step-up.

**Pre-requisito**: Task F-16.3 concluida.

**Esforco**: 0,5 dia.

### Step 116.4.1 - Reconsultar antes da confirmacao de recusa

- Reexecutar o GET ao clicar em recusar.
- Abrir confirmacao somente se a proposta continuar ativa.
- Mostrar termos atuais e explicar que a proposta sera rejeitada; nao prometer qual status final a
  parcela tera, pois a restauracao pertence ao backend.
- Cancelar a confirmacao nao chama API.

### Step 116.4.2 - Enviar recusa sem step-up

- Chamar `recusarRenegociacao(renegociacaoId)` uma unica vez.
- Nao verificar/navegar para step-up e nao limpar/consumir token eventualmente guardado.
- Desabilitar aceite e recusa durante a request.
- Em sucesso, recarregar parcela e encerrar a tela de decisao.

### Step 116.4.3 - Cobrir concorrencia de UI

- Um unico signal/estado de decisao em voo deve impedir clique cruzado aceitar -> recusar e vice-versa.
- Fechar dialog durante request nao cria segunda tentativa nem muda sucesso/erro.
- Retry exige acao explicita e novo snapshot dos termos.

### Step 116.4.4 - Testar recusa

Cobrir:

- reconsulta antes de abrir confirmacao;
- cancelamento sem PATCH;
- recusa sem token e sem navegacao para step-up;
- token preexistente permanece no store;
- duplo clique e clique cruzado geram no maximo uma request;
- sucesso recarrega estado autoritativo.

### Definicao de pronto da Task F-16.4

- [ ] Recusa exige confirmacao e termos atuais.
- [ ] Recusa nao usa nem consome step-up.
- [ ] Duplo submit bloqueado para ambas as decisoes.
- [ ] Estado autoritativo recarregado apos sucesso.

### Commit sugerido

```text
feat(web): implementar recusa segura de renegociacao
```

---

## Task F-16.5 - Erros, concorrencia e recuperacao

**Objetivo**: garantir que autorizacao, expiracao, decisao concorrente e rede nunca produzam sucesso
presumido nem loop de step-up.

**Pre-requisito**: Tasks F-16.3 e F-16.4 concluidas.

**Esforco**: 0,5 dia.

### Step 116.5.1 - Tratar leitura

- `403`: estado neutro de acesso negado; nao revelar se a parcela/proposta existe.
- `404`: proposta indisponivel, decidida ou expirada; recarregar parcela e remover CTAs da tela.
- rede/`5xx`: manter estado anterior somente como visualizacao marcada como desatualizada e oferecer
  retry; desabilitar decisoes ate nova leitura bem-sucedida.

### Step 116.5.2 - Tratar aceite

- `403` sem MFA: orientacao para habilitar MFA, sem retry automatico.
- `403` depois de uma tentativa com step-up: limpar estado efemero da confirmacao, exibir falha
  generica e oferecer `Verificar novamente` por acao explicita; nao inferir ownership pelo corpo e
  nao redirecionar em loop.
- `404`/`409`: fechar confirmacao, recarregar termos e parcela; se a proposta sumiu, encerrar a
  decisao.
- rede/`5xx`: nunca mostrar aceite; exigir nova leitura antes de retry.

### Step 116.5.3 - Tratar recusa

- `403`: acesso negado neutro, sem iniciar step-up.
- `404`/`409`: recarregar termos/parcela e encerrar CTAs se a proposta nao estiver mais ativa.
- rede/`5xx`: nunca mostrar recusa concluida; liberar retry somente apos nova leitura.

### Step 116.5.4 - Testar matriz de falhas

Testar separadamente GET, aceite e recusa:

| Resposta | Expectativa de UI |
|----------|-------------------|
| `403` GET | acesso neutro, sem enumeracao |
| `403` aceite | sem sucesso e sem loop automatico de step-up |
| `403` recusa | sem sucesso e sem step-up |
| `404` | recarrega parcela/termos e encerra proposta indisponivel |
| `409` PATCH | decisao concorrente, reconsulta obrigatoria |
| rede/`5xx` | nenhum sucesso presumido; retry explicito apos GET |

### Definicao de pronto da Task F-16.5

- [ ] `403` nao enumera ownership nem cria loop.
- [ ] `404`/`409` invalidam snapshots antigos.
- [ ] Rede/`5xx` nunca vira sucesso.
- [ ] Retry sempre parte de nova consulta.

### Commit sugerido

```text
test(web): cobrir falhas da decisao de renegociacao
```

---

## Task F-16.6 - MSW, Vitest, Playwright, docs e fechamento

**Objetivo**: consolidar mocks realistas, cobrir o fluxo completo e registrar a entrega.

**Pre-requisito**: Tasks F-16.1 a F-16.5 concluidas.

**Esforco**: 0,5-1 dia.

### Step 116.6.1 - Atualizar MSW

Adicionar antes do handler generico `GET /cobranca/parcelas/:id`:

```text
GET /cobranca/parcelas/:parcelaId/renegociacao-ativa
```

Fixtures/cenarios minimos:

- proposta ativa com os dez campos publicos e total precomputado;
- parcela owner sem proposta -> `404`;
- parcela alheia/inexistente -> `403` uniforme, sem UUID no corpo;
- proposta expirada/decidida -> `404`;
- aceite com token -> sucesso e GET seguinte -> `404`;
- recusa sem token -> sucesso e GET seguinte -> `404`;
- aceite sem token -> `403`; recusa nunca exige token;
- `409` de decisao concorrente e falha de rede controlavel para specs.

Nao incluir campos proibidos no DTO publico nem persistir token no mock.

### Step 116.6.2 - Consolidar Vitest

Cobertura minima:

- `CobrancaService` GET/PATCH;
- rota e CTA `EM_NEGOCIACAO`;
- termos completos, sem campos internos e sem calculo do total;
- aceite com MFA/step-up, retorno sem auto-aceite e consumo unico do token;
- recusa sem step-up;
- reconsulta antes de ambas as confirmacoes;
- anti duplo-submit;
- matriz `403`/`404`/`409`/rede/`5xx`;
- responsividade estrutural e estados acessiveis relevantes.

### Step 116.6.3 - Estender smoke Playwright

Atualizar `e2e/cobranca.spec.ts` e remover o comentario obsoleto de endpoint ausente.

Fluxos offline minimos:

1. Tomador abre parcela `EM_NEGOCIACAO` e ve termos completos.
2. Recusa explicitamente sem passar por step-up.
3. Aceite: sem token navega ao step-up; apos retorno, a tela nao aceita automaticamente e exige
   nova confirmacao.

O smoke pode semear token/challenge apenas pelo mecanismo de teste ja adotado; nao criar bypass de
producao nem armazenar token em storage da aplicacao.

### Step 116.6.4 - Rodar gate final

```bash
cd <sep-app-root>
npm run lint
npm run lint:scss
npm run test
npm run build
npm run e2e
```

**Smoke real recomendado**:

- Backend local com Sprints 24 e 27.
- Tomador owner e MFA ativo.
- Parcela em `EM_NEGOCIACAO` com proposta ainda valida.
- GET termos -> step-up -> retorno sem efeito -> nova confirmacao -> aceite.
- Nova massa separada para recusa sem step-up.
- Se nao houver massa, registrar exatamente o ponto nao validado; nao simular sucesso manual.

### Step 116.6.5 - Atualizar documentacao

Atualizar somente apos implementacao real:

- `repos/sep-app/README.md`: substituir o gap antigo pelo contrato/rota entregues e atualizar testes.
- `docs-sep/WEB-SCREENS-PLAN.md`: incluir decisao de renegociacao na jornada de cobranca.
- spec/steps 116: status, branch, data, testes e pendencias reais.
- `docs-sep/PRD-FASE-4.md`, `docs-sep/STATE.md` e `docs-sep/CONTEXT-PARTE-2.md` conforme regras de
  fechamento da sprint.
- `AI-ROADMAP.md`: revisar links e status.
- Criar `repos/sep-app/SPRINT-F-16-PR.md` com Summary, test plan, mudancas, decisoes, dividas,
  follow-ups e lista de commits.

Nao atualizar collection Postman: a F-16 nao cria contrato backend; a collection ja recebeu o GET
na Sprint 24.

### Step 116.6.6 - Checkpoint final

Apresentar:

- `git status --short --branch` e `git diff --stat` do `sep-app`;
- arquivos criados/modificados/removidos;
- comandos executados e resultados;
- riscos, smokes manuais e pendencias;
- mensagem de commit sugerida por Task/fechamento.

Git de `docs-SEP` permanece 100% manual. Push e PR do `sep-app` sao manuais.

### Definicao de pronto da Task F-16.6

- [ ] MSW espelha contrato, seguranca e transicoes relevantes.
- [ ] Vitest cobre service, tela, interceptor, concorrencia e erros.
- [ ] Playwright cobre leitura, recusa e retorno do step-up sem auto-aceite.
- [ ] Lint, SCSS, testes, build e E2E executados.
- [ ] Docs e PR description atualizados.

### Commit sugerido

```text
docs(web): fechar f-sprint 16 de renegociacao do tomador
```

---

## Definition of Done da F-Sprint 16

- [ ] Tomador navega da parcela `EM_NEGOCIACAO` para a proposta ativa.
- [ ] Os dez campos publicos sao consumidos; somente os termos seguros aparecem na UI.
- [ ] Total exibido vem do backend e nenhum valor/status/elegibilidade e recalculado.
- [ ] Termos sao consultados ao entrar e antes de cada confirmacao.
- [ ] Aceite exige MFA ativo, confirmacao e step-up estrito de uso unico.
- [ ] Retorno do step-up nao dispara aceite automatico.
- [ ] Recusa exige confirmacao e nao inicia nem consome step-up.
- [ ] Duplo submit e clique cruzado sao bloqueados.
- [ ] `403`, `404`, `409`, rede e `5xx` nao produzem sucesso presumido nem enumeracao.
- [ ] Estado autoritativo e recarregado depois de sucesso ou conflito.
- [ ] New Design System SEP, light/dark, responsividade e acessibilidade preservados.
- [ ] MSW, Vitest e smoke Playwright verdes.
- [ ] `npm run lint`, `npm run lint:scss`, `npm run test`, `npm run build` e `npm run e2e`
  executados.
- [ ] README web, WEB-SCREENS-PLAN, spec/steps, PRD/STATE/CONTEXT e roadmap atualizados no
  fechamento.

## Checklist de code review final

- [ ] `CobrancaService` centraliza GET/aceite/recusa; componente nao chama `HttpClient`.
- [ ] `RenegociacaoTomadorResponse` tem exatamente os dez campos do backend.
- [ ] `RenegociacaoResponse` interno nao e usado para renderizar termos publicos.
- [ ] Nenhum total, desconto, expiracao, status ou elegibilidade e derivado no frontend.
- [ ] CTA aparece apenas para `EM_NEGOCIACAO`, sem ser tratado como autorizacao.
- [ ] IDs/operador/justificativa/agenda nao aparecem no DOM, log, fixture publica ou storage.
- [ ] GET e recusa nao recebem `X-Step-Up-Token`; aceite recebe e consome uma vez.
- [ ] Usuario sem MFA nao tenta bypass; retorno do step-up exige novo gesto.
- [ ] Confirmacoes usam snapshot recem consultado e bloqueiam duplo-submit.
- [ ] Erros nao vazam ownership e nao criam loop automatico de step-up.
- [ ] Falha de rede/`5xx` nao altera UI para estado de sucesso.
- [ ] Handlers MSW especificos precedem o GET generico de parcela.
- [ ] Testes observam comportamento, nao detalhes internos do componente.
- [ ] Mudancas permanecem cirurgicas na feature de cobranca.
