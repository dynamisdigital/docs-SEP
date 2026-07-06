# Steps - M-Sprint 11 - Pix Visivel ao Usuario Mobile

**Spec de origem**: [`211-msprint-11-pix-mobile.md`](../../specs/fase-3/211-msprint-11-pix-mobile.md)

**Status**: desbloqueada. Os Gates P1, P2 e P3 de leitura Pix owner-scoped foram entregues pela
**Sprint 26 backend** (spec/step [`026`](../backend/026-sprint-26-steps.md)), **mergeada em
`origin/develop` (PR #87, `b351596`) e promovida a `origin/main` (PR #88, `e443047`); develop==main**.
Os endpoints Pix das Sprints 19-21 continuam restritos a operacao interna; o mobile consome apenas os
tres contratos publicos abaixo. **M-Sprint 11 mobile implementada na branch
`feature/msprint-11-pix-mobile` (Tasks M-11.1-M-11.5: borda, desembolso P1, hotfix, parcela P2,
carteira P3, MSW+smoke; mais hotfix do code review); pendente de merge em `origin/develop`.**

**Objetivo geral**: exibir ao tomador e a empresa credora o estado Pix das operacoes que lhes
pertencem, integrado as telas existentes de contrato, parcela e carteira, sem expor comandos
financeiros internos, conciliacao, provider, escrow ou dados de outra parte.

**Esforco mobile estimado**: 4-6 dias de Dev Mobile, depois dos contratos backend integrados.
O trabalho backend dos Gates P1-P3 deve ser planejado e executado separadamente.

**Repos de destino**:
- `sep-mobile`: DTOs, service, componentes, MSW, Vitest e smoke PWA.
- `sep-api`: contratos owner-scoped P1-P3 em sprint/task backend separada.
- `docs-SEP`: specs, steps e docs operacionais no working tree; Git manual.

**Branch sugerida**: `feature/msprint-11-pix-mobile`.

**Design vigente**: New Design System SEP mobile aplicado na M-Sprint 12. Usar Ionic standalone,
Ionicons e tokens/componentes `sep-mobile-*` existentes. Nao adicionar Tailwind, shadcn/ui,
Radix, React ou biblioteca nova de icones.

## Estado confirmado durante o planejamento (2026-07-06)

- M-Sprint 10 foi mergeada em `origin/develop` pelo PR #109 e promovida a `origin/main` pelo
  PR #110; `develop` e `main` possuem o mesmo conteudo funcional.
- O app usa Angular 20, Ionic 8 e Capacitor 8. Nao ha upgrade de stack nesta sprint.
- O tomador ja possui contrato, agenda, detalhe de parcela e historico owner-scoped de
  recebimentos.
- A credora ja possui perfil, oportunidades e carteira owner-scoped, sem role `CREDORA`;
  o acesso usa autenticacao + presenca em `GET /api/v1/credores/me`.
- O backend Pix possui desembolso, referencia, recebimento e conciliacao, mas todos os endpoints
  REST atuais sao restritos a `FINANCEIRO`, `ADMIN` e `BACKOFFICE`.
- Nao existe leitura Pix owner-scoped por contrato do tomador, parcela do tomador ou operacao da
  carteira da credora.
- O historico da M-9 ja identifica recebimentos concluidos com `meioPagamento=PIX`; deve ser
  reutilizado, nao duplicado.

## Limite de seguranca

O mobile nunca deve chamar:

```text
POST /api/v1/pix/desembolsos
GET  /api/v1/pix/desembolsos/{id}
POST /api/v1/pix/desembolsos/{id}/status
POST /api/v1/pix/recebimentos/referencias
GET  /api/v1/pix/recebimentos/referencias/{id}
GET  /api/v1/pix/recebimentos/{id}
```

Essas rotas sao operacionais. Liberar `CLIENTE` nelas ampliaria payloads e capacidades internas
e nao e uma solucao aceitavel.

Tambem e proibido expor:
- chave Pix completa ou mascarada;
- `txid`, `endToEndId`, `externalId` ou payload de provider/webhook;
- `providerIndisponivel`, correlation id ou motivo tecnico bruto;
- IDs de transferencia, referencia, recebimento interno ou movimentacao escrow;
- conciliacao, reprocesso, baixa manual, geracao de referencia ou inicio de desembolso;
- dados cadastrais do tomador na jornada da credora;
- justificativas e observacoes operacionais.

## Gates backend obrigatorios

As capacidades abaixo ainda nao sao contratos aprovados. A task backend deve definir paths,
DTOs e status HTTP finais, atualizar esta secao e integrar o codigo em `origin/develop` antes da
Task M-11.1.

### Gate P1 - Status de desembolso do tomador

**Status**: FECHADO na Sprint 26 backend (mergeada em `develop` PR #87 / `main` PR #88).

**Contrato final**: `GET /api/v1/pix/contratos/{contratoId}/desembolso` (`ROLE_CLIENTE`, read-only,
sem step-up). Resposta `PixDesembolsoTomadorResponse { status, valor, atualizadoEm }` com
`StatusPixPublico = EM_PROCESSAMENTO | LIQUIDADO | FALHOU | CANCELADO`. `404` neutro sem UUID para
contrato inexistente, alheio ou sem desembolso; `403` para papel operacional. Mapa interno->publico:
`CRIADA|SOLICITADA|PROCESSANDO -> EM_PROCESSAMENTO`, `CONCLUIDA -> LIQUIDADO`, `FALHOU -> FALHOU`,
`CANCELADA -> CANCELADO`.

Capacidade minima:

```text
usuario CLIENTE autenticado
  -> consulta o desembolso pelo contrato que lhe pertence
  -> 200 com resumo publico quando existe
  -> 404 neutro quando contrato/desembolso nao existe ou nao pertence ao usuario
```

Regras:
- validar ownership do contrato antes de revelar a transferencia;
- leitura local, sem provider, mutacao ou step-up;
- nao reutilizar `StatusDesembolsoResponse`, que e operacional;
- resposta publica minima: `status`, `valor`, `atualizadoEm`;
- estados publicos: `EM_PROCESSAMENTO`, `LIQUIDADO`, `FALHOU`, `CANCELADO`;
- `CRIADA`, `SOLICITADA` e `PROCESSANDO` internos convergem para `EM_PROCESSAMENTO`;
- `403/404` nao revela UUID nem diferencia recurso alheio de inexistente;
- testes de owner, nao-owner, inexistente, sem desembolso e ausencia de side effect.

### Gate P2 - Status Pix da parcela do tomador

**Status**: FECHADO na Sprint 26 backend (mergeada em `develop` PR #87 / `main` PR #88).

**Contrato final**: `GET /api/v1/pix/parcelas/{parcelaId}/status` (`ROLE_CLIENTE`, read-only, sem
step-up). Resposta `PixPagamentoParcelaResponse { status, valor, atualizadoEm, mensagemPublica }` com
`StatusPixParcelaPublico = AGUARDANDO | EM_PROCESSAMENTO | LIQUIDADO | DIVERGENTE | FALHOU | EXPIRADO
| CANCELADO`. `mensagemPublica` (String|null) sanitizada, so em `DIVERGENTE`/`FALHOU`. Estado derivado
por precedencia (referencia atual + recebimento por `referenciaId`); estados terminais da referencia
sao autoritativos. `404` neutro sem UUID; historico liquidado continua em
`GET /api/v1/cobranca/parcelas/{parcelaId}/recebimentos` (B1 da M-9).

Capacidade minima:

```text
usuario CLIENTE autenticado
  -> consulta o estado Pix de uma parcela que lhe pertence
  -> 200 com resumo publico da referencia/recebimento atual
  -> 404 neutro quando nao ha estado Pix ou a parcela nao pertence ao usuario
```

Regras:
- validar ownership antes de consultar referencia/recebimento;
- leitura local, sem gerar referencia, reprocessar, conciliar ou usar step-up;
- resposta sem `txid`, copia-cola, `endToEndId`, IDs internos ou motivo tecnico;
- estados publicos: `AGUARDANDO`, `EM_PROCESSAMENTO`, `LIQUIDADO`, `DIVERGENTE`,
  `FALHOU`, `EXPIRADO`, `CANCELADO`;
- mensagem publica opcional deve ser sanitizada pelo backend;
- historico liquidado continua vindo de
  `GET /api/v1/cobranca/parcelas/{parcelaId}/recebimentos`;
- testes de owner, nao-owner, sem Pix e estados ativo/conciliado/divergente/falho.

Geracao self-service de referencia e Pix copia-cola nao pertencem a Spec 211. Se produto decidir
inclui-los, atualizar primeiro a spec, a analise de seguranca e este step.

### Gate P3 - Status Pix da operacao financiada da credora

**Status**: FECHADO na Sprint 26 backend (mergeada em `develop` PR #87 / `main` PR #88).

**Contrato final**: `GET /api/v1/credores/carteira/{operacaoId}/pix` (`isAuthenticated()`, sem role
`CREDORA` — acesso por presenca de credora, read-only, sem step-up). Resposta
`PixOperacaoCredoraResponse { status: String, valor, atualizadoEm }` (status = nome do
`StatusPixPublico`). Mesmo mapa do P1. `404` neutro sem UUID para usuario sem credora, operacao
alheia/inexistente ou sem desembolso Pix; nunca expoe tomador, contrato, chave ou IDs internos.

Capacidade minima:

```text
usuario autenticado com credora presente
  -> consulta o status Pix de uma operacao da propria carteira
  -> 200 com resumo publico quando existe
  -> 404 neutro quando credora/operacao/status nao existe ou nao pertence ao usuario
```

Regras:
- nao criar role `CREDORA`;
- resolver a credora pelo usuario e validar ownership da operacao antes do Pix;
- leitura local, sem provider, conciliacao ou step-up;
- resposta publica minima: `status`, `valor`, `atualizadoEm`;
- nao expor tomador, chave Pix, IDs internos, escrow ou falha operacional bruta;
- testes de owner, outra credora, usuario sem credora, operacao inexistente e sem Pix.

### Definicao de pronto dos Gates P1-P3

- [ ] Spec/step backend aprovados para os tres contratos.
- [ ] Endpoints/DTOs publicos integrados em `origin/develop`.
- [ ] Ownership validado antes de qualquer leitura Pix.
- [ ] DTOs operacionais nao foram reutilizados.
- [ ] Nenhuma rota de comando foi liberada a `CLIENTE`.
- [ ] OpenAPI, `PIX.md`, collection e testes backend atualizados.
- [ ] Este step registra paths, DTOs, enums e status HTTP finais.

## Contratos mobile esperados

Os nomes abaixo estao FIXADOS pela Sprint 26 backend (espelham as respostas REST reais); no P3 o
`status` chega como `String` (nome do `StatusPixPublico`):

```text
StatusPixPublico:
  EM_PROCESSAMENTO | LIQUIDADO | FALHOU | CANCELADO

StatusPixParcelaPublico:
  AGUARDANDO | EM_PROCESSAMENTO | LIQUIDADO | DIVERGENTE |
  FALHOU | EXPIRADO | CANCELADO

PixDesembolsoTomadorResponse:
  status
  valor
  atualizadoEm

PixPagamentoParcelaResponse:
  status
  valor
  atualizadoEm
  mensagemPublica: string | null

PixOperacaoCredoraResponse:
  status
  valor
  atualizadoEm
```

Regras:
- espelhar JSON e nullability reais, sem campos de conveniencia;
- `number` serve apenas para formatacao, nunca para aritmetica financeira;
- datas sao strings ISO-8601 na borda;
- ausencia de Pix e estado de tela, nao objeto com valor zero.

## Decisoes de implementacao mobile

- Nao criar tab Pix. Integrar status ao contrato, detalhe da parcela e detalhe da carteira.
- `PixMobileService` faz apenas transporte HTTP.
- O backend devolve o estado publico; o app nao deriva status financeiro.
- O historico usa `RecebimentoTomadorResponse[]` e destaca `meioPagamento=PIX`, preservando
  ordem e valores do backend.
- Consultar ao entrar/reentrar e por refresh explicito. Sem polling.
- `404` vira ausencia neutra; rede/5xx vira erro com retry.
- Falha Pix nao promete reenvio, prazo ou conciliacao.
- Nao persistir estado Pix em storage.
- Nenhuma rota M-11 entra no allowlist do `stepUpInterceptor`.

## Fora de escopo

- Iniciar, cancelar, reenviar ou reprocessar desembolso.
- Consultar provider sob demanda.
- Gerar referencia ou oferecer Pix copia-cola.
- Conciliar, baixar ou ajustar parcela.
- Resolver divergencia.
- Aporte, split Pix, Pix automatico, devolucao ou gestao de chaves.
- Painel financeiro/backoffice, webhook, auditoria ou escrow.
- Push, deep link nativo, Android/iOS ou plugin Capacitor novo.
- Nova tab, store global, cache offline ou mudanca Java dentro de Task mobile.

## Protocolo obrigatorio por Task

1. Executar somente a Task liberada.
2. Confirmar codigo/contratos atuais antes de editar.
3. Implementar a menor mudanca coerente.
4. Escrever testes comportamentais.
5. Rodar as verificacoes indicadas.
6. Parar em checkpoint pre-commit com status, diff, testes, riscos e commit sugerido.
7. Aguardar aprovacao antes de `git add`/`git commit`.
8. Usar paths especificos; nunca `git add -A`.

**Skills obrigatorias na implementacao**:
- `coding-guidelines`;
- `clean-code`;
- `design-patterns-java` somente no backend, com filtro de pattern-itis;
- arquitetura do projeto: components -> services; DTOs na borda; ownership/status no backend.

## Ordem de execucao

```text
M-11.0 prechecks
  -> Gates P1 + P2 + P3 integrados
  -> M-11.1 DTOs + PixMobileService
  -> M-11.2 desembolso do tomador
  -> M-11.3 status/historico Pix da parcela
  -> M-11.4 status Pix da operacao da credora
  -> M-11.5 MSW + Vitest + smoke + docs + fechamento
```

## Gate M-11.0 - Prechecks

### Step 211.0.1 - Confirmar cadeia Git

```bash
cd <sep-mobile-root>
git fetch --all --prune
git status --short --branch
git log --oneline --decorate -15 origin/develop
git log --oneline --decorate -12 origin/main
git diff --stat origin/develop..origin/main
git diff --stat origin/main..origin/develop
```

Confirmar M-10/PR #109 em `develop`, PR #110 em `main`, `main` incorporada em `develop` e
working tree limpo ou com mudancas do usuario identificadas.

### Step 211.0.2 - Criar branch e tratar PR temporario

```bash
cd <sep-mobile-root>
git switch develop
git pull --ff-only
git switch -c feature/msprint-11-pix-mobile
```

Remover `repos/sep-mobile/SPRINT-M-10-PR.md` somente depois de usado nos PRs #109/#110.

### Step 211.0.3 - Confirmar estrutura mobile

```bash
cd <sep-mobile-root>
npm ls @angular/core @ionic/angular @capacitor/core
find src/app/core -maxdepth 3 -type f | sort
find src/app/features/tomador -maxdepth 4 -type f | sort
find src/app/features/credora -maxdepth 4 -type f | sort
sed -n '1,300p' src/app/features/authenticated/authenticated.routes.ts
sed -n '1,220p' src/app/core/cobranca/cobranca-mobile.service.ts
sed -n '1,260p' src/app/features/tomador/cobranca/parcela-detail.component.ts
sed -n '1,260p' src/app/features/credora/carteira/portfolio-detail.component.ts
```

Confirmar stack, design vigente, telas reutilizaveis, historico da M-9 e ausencia de
`PixMobileService`, tab Pix ou persistencia financeira local.

### Step 211.0.4 - Reconfirmar Gates P1-P3

```bash
cd <sep-api-root>
find src/main/java/com/dynamis/sep_api/pix/web -type f | sort
rg -n "PreAuthorize|GetMapping|PostMapping|RequestMapping" \
  src/main/java/com/dynamis/sep_api/pix/web
rg -n "tomador|credores|owner|contratoId|parcelaId|operacaoId" \
  src/main/java/com/dynamis/sep_api/pix
```

Confirmar paths, auth, ownership, DTOs, enums, testes, leitura local e ausencia de campos
proibidos. Se qualquer gate estiver aberto, registrar evidencia e parar. Nao mockar contrato
nao aprovado para iniciar UI.

### Step 211.0.5 - Rodar baseline

```bash
cd <sep-mobile-root>
npm run lint
npm run lint:scss
npm run format:check
npm run test
npm run build
```

### Definicao de pronto do Gate M-11.0

- [ ] M-10 integrada em `develop` e `main`.
- [ ] Branch criada de `develop` atualizado.
- [ ] PR temporario anterior tratado.
- [ ] Stack/estrutura confirmadas.
- [ ] P1-P3 integrados e registrados.
- [ ] Endpoints internos continuam proibidos.
- [ ] Baseline verde ou falha preexistente documentada.

## Task M-11.1 - DTOs e PixMobileService

**Gate**: P1-P3 integrados.

**Arquivos esperados**:
- `src/app/core/api/api.models.ts`;
- `src/app/core/pix/pix-mobile.service.ts`;
- `src/app/core/pix/pix-mobile.service.spec.ts`.

### Steps

1. Adicionar enums/interfaces exatamente como integrados, sem `any`, requests operacionais ou
   campos opcionais para esconder divergencia.
2. Criar apenas as operacoes logicas:

```text
consultarDesembolsoDoContrato(contratoId)
consultarStatusPixDaParcela(parcelaId)
consultarStatusPixDaOperacao(operacaoId)
```

3. Usar `HttpClient` + `firstValueFrom`, apenas GET, auth existente, sem step-up,
   `Idempotency-Key` ou header financeiro.
4. Propagar `403`, `404` e 5xx; nao fabricar vazio/sucesso.
5. Testar URLs, metodos, payloads, erros e ausencia de endpoints operacionais.

```bash
npm run test -- --run src/app/core/pix
npm run lint
npm run format:check
```

### Definicao de pronto

- [ ] DTOs espelham contratos publicos.
- [ ] Service possui somente tres leituras.
- [ ] Nenhum comando/DTO operacional foi exposto.
- [ ] Testes e gates passam.

**Commit sugerido**: `feat(mobile): adicionar borda publica de status pix`.

## Task M-11.2 - Status de desembolso do tomador

**Objetivo**: integrar P1 ao detalhe do contrato.

### Steps

1. Consultar P1 depois do contrato owner-scoped carregar.
2. Exibir card "Desembolso Pix"; reconsultar em `ionViewWillEnter` e refresh explicito.
3. Tratar `404` como "ainda nao disponivel" e rede/5xx como erro isolado com retry.
4. Mapear exaustivamente `EM_PROCESSAMENTO`, `LIQUIDADO`, `FALHOU`, `CANCELADO`.
5. Usar texto + tom semantico; nao exibir chave, IDs, provider ou escrow.
6. Testar estados, ausencia, erro, retry, reentrada, concorrencia, 320 px e tema escuro.

```bash
npm run test -- --run src/app/features/tomador/formalizacao
npm run lint
npm run lint:scss
npm run format:check
npm run build
```

### Definicao de pronto

- [ ] Status aparece no contrato.
- [ ] Ausencia e erro tecnico sao distintos.
- [ ] Falha do card nao bloqueia o contrato.
- [ ] Nenhuma acao Pix interna existe.
- [ ] Testes e gates passam.

**Commit sugerido**: `feat(mobile): exibir desembolso pix do tomador`.

## Task M-11.3 - Status e historico Pix da parcela

**Objetivo**: integrar P2 ao detalhe da parcela e reutilizar o historico M-9.

### Steps

1. Consultar P2 junto ao detalhe owner-scoped.
2. Exibir "Pagamento Pix" sem substituir o status autoritativo de cobranca.
3. Mapear todos os estados P2; `DIVERGENTE` orienta suporte e `FALHOU` nunca vira pago.
4. `404` e ausencia; rede/5xx e erro isolado com retry.
5. Reutilizar `consultarRecebimentos(parcelaId)` e destacar `meioPagamento=PIX`, sem nova
   chamada quando a secao M-9 ja estiver carregada.
6. Preservar ordem/valores; nao somar, recalcular ou inferir conciliacao.
7. Testar estados, historico misto/vazio, reentrada, concorrencia e ausencia de campos/comandos
   internos.

```bash
npm run test -- --run src/app/core/cobranca src/app/core/pix
npm run test -- --run src/app/features/tomador/cobranca
npm run lint
npm run lint:scss
npm run format:check
npm run build
```

### Definicao de pronto

- [ ] Estado atual vem de P2.
- [ ] Historico usa o contrato B1 da M-9.
- [ ] Status Pix nao sobrescreve cobranca.
- [ ] Nao existe regra de conciliacao/calculo no app.
- [ ] Testes e gates passam.

**Commit sugerido**: `feat(mobile): integrar status pix nas parcelas`.

## Task M-11.4 - Status Pix da operacao da credora

**Objetivo**: integrar P3 ao detalhe da operacao owner-scoped.

### Steps

1. Consultar P3 depois da operacao carregar.
2. Exibir card "Status Pix da operacao"; reconsultar em `ionViewWillEnter` e refresh.
3. Tratar `404` de forma neutra e rede/5xx como erro isolado com retry.
4. Exibir somente status, valor e data do backend.
5. Nao cruzar valores nem expor contrato, transferencia, tomador, provider ou escrow.
6. Testar estados, usuario sem credora, operacao alheia, ausencia, erro, reentrada,
   320 px, tema escuro e ausencia de dados proibidos no DOM/storage.

```bash
npm run test -- --run src/app/features/credora/carteira src/app/core/pix
npm run lint
npm run lint:scss
npm run format:check
npm run build
```

### Definicao de pronto

- [ ] Status aparece somente em operacao owner-scoped.
- [ ] Payload/UI nao revelam tomador ou detalhes internos.
- [ ] Nenhum calculo financeiro foi criado.
- [ ] Ausencia e erro tecnico sao distintos.
- [ ] Testes e gates passam.

**Commit sugerido**: `feat(mobile): exibir status pix da carteira credora`.

## Task M-11.5 - MSW, Vitest, smoke, docs e fechamento

### Step 211.5.1 - MSW e Vitest

Seeds:
- desembolso nos quatro estados;
- parcela sem Pix e com estados processando/liquidado/divergente/falho;
- historico misto PIX/outros;
- operacao credora com/sem Pix;
- `404`, rede/5xx e retry.

Regras:
- estado reseedavel;
- sem handlers operacionais ou dados internos;
- cobertura de service, componentes, loading, ausencia, retry, reentrada, concorrencia,
  storage e assercoes negativas.

### Step 211.5.2 - Smoke Playwright PWA

```text
tomador:
  login -> contrato -> desembolso -> parcela -> status Pix -> historico Pix

credora:
  login -> tab Credora -> carteira -> operacao -> status Pix
```

Validar ausencia, falha/retry, `404` neutro, Pixel 5, 320 px e tema escuro.
Assegurar que nao houve endpoint operacional, step-up, provider/escrow/chave/ID interno,
storage financeiro ou acao Pix.

### Step 211.5.3 - Suite final

```bash
cd <sep-mobile-root>
npm run lint
npm run lint:scss
npm run format:check
npm run test
npm run build
npx playwright test \
  e2e/smoke.spec.ts \
  e2e/onboarding-mobile.spec.ts \
  e2e/credito-mobile.spec.ts \
  e2e/formalizacao-mobile.spec.ts \
  e2e/cobranca-mobile.spec.ts \
  e2e/credora-mobile.spec.ts \
  e2e/pix-mobile.spec.ts
```

### Step 211.5.4 - Documentacao e fechamento

Atualizar:
- `repos/sep-mobile/README.md`;
- Spec/step 211;
- `docs-sep/PRD-FASE-3.md`;
- `docs-sep/CONTEXT-PARTE-2.md`;
- `docs-sep/MOBILE-SCREENS-PLAN.md`;
- `AI-ROADMAP.md`;
- `repos/sep-mobile/SPRINT-M-11-PR.md`.

No backend P1-P3, atualizar `PIX.md`, spec/step backend, OpenAPI, collection e roadmap.

Antes de fechar a Fase 3:
- confirmar `main` incorporada em `develop` nos tres repos;
- promover M-11 para `main`;
- corrigir status documentais obsoletos;
- registrar dividas aceitas/itens adiados;
- executar regressao final.

### Step 211.5.5 - Checkpoint final

Apresentar status, diff, arquivos, testes, Gates P1-P3, riscos e commit sugerido. Aguardar
aprovacao antes de staging/commit.

**Commit sugerido**: `test(mobile): consolidar jornada pix visivel`.

## Definition of Done da M-Sprint 11

- [ ] P1-P3 integrados e testados.
- [ ] Tomador ve apenas desembolso do proprio contrato.
- [ ] Tomador ve apenas Pix da propria parcela.
- [ ] Credora ve apenas Pix da propria operacao.
- [ ] Estados possuem copy acessivel.
- [ ] Ausencia e erro tecnico sao distintos.
- [ ] Nenhum endpoint/comando operacional e acessivel.
- [ ] Nenhum status, valor, ownership ou conciliacao e calculado no app.
- [ ] Nenhum dado Pix interno e exibido, logado ou persistido.
- [ ] Nenhum step-up e usado.
- [ ] Tema claro/escuro e 320 px validados.
- [ ] Lint, SCSS, format, Vitest, build AOT e smokes passam.
- [ ] M-11 promovida a `main`.
- [ ] Documentacao registra o fechamento da Fase 3.

## Checklist de code review

### Contratos e arquitetura
- [ ] DTOs sao apenas P1-P3 publicos.
- [ ] Components chamam `PixMobileService`.
- [ ] Ownership/status ficam no backend.
- [ ] Historico M-9 foi reutilizado.
- [ ] Sem store/cache/abstracao especulativa.

### Seguranca
- [ ] Endpoints operacionais nao aparecem no service, MSW ou smoke.
- [ ] `404` nao enumera recurso alheio.
- [ ] Sem chave, IDs tecnicos, provider, webhook ou escrow.
- [ ] Sem dados do tomador na jornada credora.
- [ ] Sem persistencia financeira ou step-up.

### UX e testes
- [ ] Status possuem texto, nao apenas cor.
- [ ] Loading, ausencia, erro e retry existem.
- [ ] Falha Pix nao bloqueia tela hospedeira.
- [ ] Reentrada/respostas obsoletas cobertas.
- [ ] Smokes/regressao e build AOT passam.
- [ ] Docs refletem somente comportamento entregue.
