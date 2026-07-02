# Steps - M-Sprint 9 - Parcelas e Cobranca Mobile

**Spec de origem**: [`specs/fase-3/209-msprint-9-cobranca-mobile.md`](../../specs/fase-3/209-msprint-9-cobranca-mobile.md)

**Status**: concluida — mergeada em `develop` via PR #107 (`7162b67`) e promovida a `main`
via PR #108 (2026-07-02; develop==main). Gates atendidos: B1/Sprint 23 (PR #81) e
B2/Sprint 24 (PR #83) mergeados em `develop` no `sep-api` antes das Tasks M-9.4/M-9.5.

**Objetivo geral**: permitir que o tomador autenticado localize a agenda de um contrato
proprio, consulte parcelas, vencimentos, valores atualizados e estados de atraso, veja o
historico de recebimentos e decida uma proposta de renegociacao com termos completos,
consumindo os contratos reais do `sep-api` sem duplicar ownership, calculos financeiros,
status ou transicoes no app.

**Esforco total estimado**: 6-8 dias de Dev Mobile dedicado, depois que os dois contratos
backend bloqueantes estiverem disponiveis. O recorte M-9.1 a M-9.3 pode avancar com a API
atual.

**Repos de destino**:
- `sep-mobile`: codigo Angular/Ionic, testes, MSW e smoke PWA.
- `sep-api`: apenas os endpoints de leitura bloqueantes, em trabalho backend separado e
  explicitamente aprovado; nao alterar backend dentro de uma Task mobile.
- `docs-SEP`: documentacao operacional editada apenas no working tree; operacao Git manual.

**Branch sugerida**:
- `feature/msprint-9-cobranca-mobile`

**Design system vigente**: New Design System SEP mobile aplicado na M-Sprint 12.
Usar Ionic standalone, Ionicons, tokens e mixins `sep-mobile-*` existentes. Nao
reintroduzir Notion legado, Tailwind, shadcn/ui, Radix, React ou biblioteca nova de
icones sem ADR e aprovacao explicita.

**Estado confirmado durante o planejamento (2026-07-01)**:
- M-Sprint 8 esta em `origin/develop` pelo PR #105 (`be792df`) e foi promovida a
  `origin/main` pelo PR #106 (`e009d50`).
- `origin/develop` e `origin/main` possuem o mesmo conteudo, embora a topologia de merge
  seja divergente; o precheck deve reconfirmar conteudo e historico antes da branch M-9.
- `sep-mobile` usa Angular 20, Ionic 8 e Capacitor 8; nao ha upgrade de stack nesta sprint.
- A rota `/app/parcelas` ainda aponta para placeholder e ja corresponde a uma tab do shell.
- M-8 fornece `CreditoMobileService`, `ContratosMobileService` e a navegacao
  proposta -> contrato, que devem ser reutilizados para descobrir o `contratoId` sem N+1.

## Contratos backend disponiveis

Cobranca (`/api/v1/cobranca`):
- `GET /api/v1/cobranca/contratos/{contratoId}/agenda` ->
  `200 AgendaPagamentoResponse`, somente owner ou `FINANCEIRO/ADMIN`.
- `GET /api/v1/cobranca/parcelas/{id}` -> `200 ValorAtualizadoParcelaResponse`,
  somente owner ou `FINANCEIRO/ADMIN`.
- `PATCH /api/v1/cobranca/renegociacoes/{id}/aceite` ->
  `200 RenegociacaoResponse`, owner com `X-Step-Up-Token`.
- `PATCH /api/v1/cobranca/renegociacoes/{id}/recusa` ->
  `200 RenegociacaoResponse`, owner sem step-up.

Contratos e credito:
- `GET /api/v1/credito/propostas?status=APROVADA&page=&size=` lista propostas proprias.
- `GET /api/v1/contratos/proposta/{propostaId}` resolve o contrato sob demanda.
- `GET /api/v1/contratos/{id}` permite entrada direta pelo contrato.
- Somente contrato `ASSINADO` gera agenda. `404` antes da geracao deve ser apresentado como
  "parcelas ainda indisponiveis", nunca como lista vazia ou erro financeiro inventado.

Autenticacao reforcada (`/api/v1/auth/step-up`):
- `POST /initiate` -> challenge efemero.
- `POST /complete` -> token efemero, em memoria e de uso unico.
- `stepUpInterceptor` deve anexar `X-Step-Up-Token` somente ao
  `PATCH /api/v1/cobranca/renegociacoes/{id}/aceite`.

**Endpoints internos explicitamente fora do mobile**:
- `POST /api/v1/cobranca/parcelas/{id}/recebimentos`.
- `GET /api/v1/cobranca/recebimentos`.
- `GET /api/v1/cobranca/inadimplencia`.
- `POST /api/v1/cobranca/parcelas/{id}/contato`.
- `POST /api/v1/cobranca/parcelas/{id}/renegociacao`.

O mobile nao deve chamar, simular autorizacao nem criar telas para essas operacoes
`FINANCEIRO/ADMIN`.

## Gaps backend bloqueantes

### Gap B1 - Historico de recebimentos do tomador (Sprint 23)

O endpoint atual `GET /api/v1/cobranca/recebimentos` e restrito a
`FINANCEIRO/ADMIN`. `AgendaPagamentoResponse` nao inclui recebimentos e
`ValorAtualizadoParcelaResponse` informa apenas `totalRecebido`, sem eventos individuais.

A [`Spec 023`](../../specs/fase-3/023-sprint-23-cobranca-historico-tomador.md) e os [`steps 023`](../backend/023-sprint-23-steps.md) formalizam o contrato bloqueante:

> **Status (2026-07-01)**: B1 mergeado em `develop` via PR #81 (e `main` via PR #82) — Sprint 23. M-9.4 liberada.

```http
GET /api/v1/cobranca/parcelas/{parcelaId}/recebimentos
```

Requisitos minimos:
- exclusivo de `ROLE_CLIENTE`;
- `200 RecebimentoTomadorResponse[]`, ordenado por `dataRecebimento DESC`;
- parcela inexistente ou nao-owner recebe `403` uniforme;
- lista vazia e valida;
- resposta contem somente `recebimentoId`, `valorRecebido`, `dataRecebimento` e `meioPagamento`;
- sem payload bancario, escrow, identificador externo, observacao, operador ou idempotencia.

### Gap B2 - Descoberta e leitura da renegociacao (Sprint 24)

> **Status B2 (2026-07-02)**: contrato entregue no `sep-api` — `GET /parcelas/{parcelaId}/renegociacao-ativa`
> + `RenegociacaoTomadorResponse`. **Mergeado em `develop` via PR #83 (`2a41c51`); M-9.5 liberada.**
> Ao implementar a renegociacao mobile, espelhar `RenegociacaoTomadorResponse`, nao o
> `RenegociacaoResponse` interno.

Os PATCHes atuais exigem `renegociacaoId`, mas o tomador nao consegue descobrir esse ID
nem ler os termos antes da decisao. `ParcelaResponse` informa apenas
`status=EM_NEGOCIACAO`. Implementar aceite/recusa nessas condicoes seria uma decisao
financeira no escuro e viola o objetivo de transparencia da jornada.

A [`Spec 024`](../../specs/fase-3/024-sprint-24-cobranca-renegociacao-tomador.md) e os [`steps 024`](../backend/024-sprint-24-steps.md) formalizam o contrato bloqueante:

```http
GET /api/v1/cobranca/parcelas/{parcelaId}/renegociacao-ativa
```

Requisitos minimos:
- exclusivo de `ROLE_CLIENTE`;
- `200 RenegociacaoTomadorResponse` para proposta ativa e `404` quando nao houver;
- resposta contem ID da renegociacao/parcela, status, valor por parcela, quantidade, total
  calculado no backend, vencimento, desconto, data da proposta e expiracao;
- parcela inexistente ou nao-owner recebe `403` uniforme;
- termos retornados sao o snapshot autoritativo usado antes do PATCH;
- sem tomador, operador, agendas, justificativa operacional ou IDs internos.

Os contratos acima sao os contratos planejados das Sprints 23/24. Se a implementacao
backend aprovada divergir, atualizar primeiro as respectivas specs/steps e depois este arquivo;
nao adaptar silenciosamente o mobile.

## Decisoes de implementacao

- A entrada `/app/parcelas` reutiliza a lista de propostas `APROVADA`, como M-8, sem fazer
  consulta de contrato ou agenda para cada card.
- Ao abrir uma proposta, o app resolve o contrato e depois a agenda. Isso evita N+1 e nao
  inventa lista global de contratos.
- A rota direta por contrato permite entrada pela formalizacao quando o contrato estiver
  `ASSINADO` e retorno seguro apos step-up.
- Agenda e parcela sao snapshots do backend. O app nao recalcula saldo, juros, mora, multa,
  dias de atraso, vencimento, status ou elegibilidade para renegociacao.
- A lista usa a composicao estatica recebida na agenda. O detalhe consulta
  `GET /parcelas/{id}` para obter valor atualizado e total recebido.
- Ordenacao e status recebidos da API sao preservados. Se a lista precisar ordenar para UX,
  usar `numero` apenas como apresentacao e cobrir por teste; nunca inferir prioridade financeira.
- `PENDENTE`, `PARCIALMENTE_PAGA`, `PAGA`, `ATRASADA`, `EM_NEGOCIACAO`,
  `INADIMPLENTE` e `RENEGOCIADA` recebem rotulos e tons visuais, sem transicao local.
- Datas e valores sao formatados em `pt-BR` somente para exibicao. DTOs preservam ISO e
  numeros recebidos; nao fazer aritmetica monetaria no componente.
- Nenhuma agenda, parcela, recebimento, renegociacao ou step-up token e persistido em
  `localStorage`, `sessionStorage` ou Capacitor Preferences.
- `403` de ownership mostra mensagem neutra e nao entra em loop de step-up.
- Aceite de renegociacao exige termos completos, confirmacao explicita, MFA habilitado e
  step-up de uso unico. Ao voltar do step-up, exigir novo toque; nunca aceitar automaticamente.
- Recusa nao exige step-up, mas exige confirmacao explicita porque encerra a proposta.
- Apos aceite/recusa, recarregar agenda e parcela a partir do backend. A consulta por
  `contratoId` retorna a agenda ativa, inclusive a substituta apos aceite.
- Notificacoes por email/SMS pertencem ao backend. O mobile nao chama Zenvia/SMTP e nao
  promete confirmacao de leitura.

## Fora de escopo

- Criar ou alterar regra financeira no mobile.
- Operacao `FINANCEIRO`, `ADMIN` ou `BACKOFFICE`.
- Registro manual de recebimento, contato de cobranca ou proposta de renegociacao.
- Calculo de Price/SAC, juros, mora, multa, desconto, saldo ou dias de atraso.
- Pix, boleto, conciliacao, negativacao, juridico ou reprocesso de provider.
- Lista global de contratos ou agendas.
- Persistencia offline de dados financeiros.
- Push notification, plugin nativo, build Android/iOS ou deep link nativo.
- Alteracao da politica de MFA/step-up no backend.
- Exibicao de payload de auditoria, `tomadorId`, operador, escrow ou dados bancarios.

## Protocolo obrigatorio por Task

1. Executar somente a Task liberada pelo usuario.
2. Antes de editar, confirmar arquivos, contratos e comportamento atual.
3. Implementar a menor mudanca coerente com os padroes do repo.
4. Rodar as verificacoes indicadas.
5. Parar em checkpoint pre-commit com status, diff, testes, riscos e mensagem sugerida.
6. Aguardar aprovacao explicita antes de `git add` e `git commit`.
7. Usar paths especificos no staging; nunca `git add -A`.

**Skills obrigatorias na implementacao**:
- `coding-guidelines`: simplicidade, mudancas cirurgicas e verificacao orientada a meta.
- `clean-code`: nomes intencionais, componentes pequenos e testes F.I.R.S.T.
- `clean-architecture`: componentes orquestram UI e chamam services; DTOs ficam na
  borda HTTP; ownership, calculos e transicoes permanecem no backend.

## Ordem de execucao recomendada

```text
M-9.0 (gate: Git, contratos, gaps e baseline)
   |
   v
M-9.1 (DTOs + CobrancaMobileService)
   |
   v
M-9.2 (rotas + descoberta + lista de parcelas)
   |
   v
M-9.3 (detalhe + valor atualizado + estados)
   |
   +---- B1 backend liberado ----> M-9.4 (historico de recebimentos)
   |
   +---- B2 backend liberado ----> M-9.5 (renegociacao + step-up)
                                   |
                                   v
                         M-9.6 (MSW + Vitest + PWA + docs)
```

M-9.4 e M-9.5 podem ser desenvolvidas em paralelo somente depois dos respectivos
contratos backend estarem integrados e reconfirmados. M-9.6 fecha a sprint apenas quando
ambas estiverem concluidas.

---

## Gate M-9.0 - Prechecks da M-Sprint 9

**Objetivo**: confirmar cadeia Git, contratos reais, gaps backend, estrutura mobile e
baseline antes de qualquer alteracao no `sep-mobile`.

**Esforco**: 2-3 horas. Nao conta como task de implementacao.

### Step 209.0.1 - Confirmar a cadeia de integracao

**Comandos**:
```bash
cd <sep-mobile-root>
git fetch --all --prune
git status --short --branch
git log --oneline --decorate -15 origin/develop
git log --oneline --decorate -12 origin/main
git diff --stat origin/develop..origin/main
git diff --stat origin/main..origin/develop
```

**Verificacao**:
- `origin/develop` contem M-8/PR #105 e os fixes de formalizacao/step-up.
- `origin/main` contem a promocao M-8/PR #106.
- Conteudo de produto necessario para M-9 esta presente em `develop`; divergencia apenas
  topologica fica registrada, nao inferida por contagem de commits.
- Working tree limpo ou alteracoes do usuario identificadas e preservadas.
- Se `main` tiver conteudo ausente em `develop`, parar. A cadeia deve ser reconciliada
  antes da branch M-9 ou o usuario deve autorizar explicitamente a excecao.

### Step 209.0.2 - Atualizar base e criar branch

**Comandos**:
```bash
cd <sep-mobile-root>
git switch develop
git pull --ff-only
git switch -c feature/msprint-9-cobranca-mobile
```

**Acoes em `docs-SEP`**:
- Confirmar que `repos/sep-mobile/SPRINT-M-8-PR.md` foi removido no inicio da M-9, depois
  de usado no PR #105.
- Manter toda operacao Git de `docs-SEP` manual.

**Verificacao**:
- Branch criada a partir de `develop` atualizado.
- Artefato temporario da M-8 nao permanece no working tree documental.
- Se `pull --ff-only` falhar, parar e registrar o bloqueio.

### Step 209.0.3 - Confirmar stack e estrutura mobile

**Comandos**:
```bash
cd <sep-mobile-root>
node --version
npm --version
npm ls @angular/core @ionic/angular @capacitor/core
find src/app/core -maxdepth 3 -type f | sort
find src/app/features/tomador -maxdepth 4 -type f | sort
sed -n '1,240p' src/app/features/authenticated/authenticated.routes.ts
sed -n '1,220p' src/app/core/interceptors/step-up.interceptor.ts
```

**Verificacao**:
- Angular 20, Ionic 8 e Capacitor 8 continuam instalados.
- `CreditoMobileService` e `ContratosMobileService` da M-7/M-8 estao presentes.
- `/app/parcelas` ainda e placeholder; nao existe implementacao concorrente.
- `StepUpService`, `StepUpTokenStore`, `StepUpComponent` e interceptor continuam em uso.
- New Design System SEP mobile continua sendo a base visual.

### Step 209.0.4 - Reconfirmar contratos backend atuais

**Comandos**:
```bash
cd <sep-api-root>
sed -n '1,520p' src/main/java/com/dynamis/sep_api/cobranca/web/controller/CobrancaController.java
find src/main/java/com/dynamis/sep_api/cobranca/web/dto -maxdepth 1 -type f | sort
sed -n '1,180p' src/main/java/com/dynamis/sep_api/cobranca/web/dto/AgendaPagamentoResponse.java
sed -n '1,180p' src/main/java/com/dynamis/sep_api/cobranca/web/dto/ParcelaResponse.java
sed -n '1,180p' src/main/java/com/dynamis/sep_api/cobranca/web/dto/ValorAtualizadoParcelaResponse.java
sed -n '1,220p' src/main/java/com/dynamis/sep_api/cobranca/web/dto/RecebimentoResponse.java
sed -n '1,240p' src/main/java/com/dynamis/sep_api/cobranca/web/dto/RenegociacaoResponse.java
```

**Verificacao**:
- Agenda e detalhe mantem auth owner-scoped.
- Campos, nullability, enums e codigos HTTP continuam iguais aos documentados.
- `GET /recebimentos` continua interno e nao deve ser chamado pelo mobile.
- PATCH de aceite continua com step-up; PATCH de recusa continua sem step-up.
- Se o backend tiver fechado B1/B2, registrar paths e DTOs reais neste arquivo antes da
  Task correspondente.
- Divergencia deve ser resolvida no step, nao escondida por adaptacao especulativa no app.

### Step 209.0.5 - Classificar gates B1 e B2

**Checklist**:
- [x] B1 possui endpoint owner-scoped integrado em `develop` do `sep-api`.
- [x] B1 possui teste de owner, nao-owner, parcela inexistente e lista vazia.
- [x] B2 possui endpoint de descoberta/leitura integrado em `develop` do `sep-api`.
- [x] B2 devolve termos completos antes da decisao.
- [x] B2 possui teste de owner, nao-owner, sem proposta ativa e proposta expirada.
- [x] OpenAPI e `COBRANCA.md` refletem os novos contratos.

**Regra**:
- B1 ausente: M-9.4 permanece bloqueada.
- B2 ausente: M-9.5 permanece bloqueada.
- Ambos ausentes: M-9.1 a M-9.3 podem avancar; a sprint nao pode ser declarada concluida.

### Step 209.0.6 - Rodar baseline

**Comandos**:
```bash
cd <sep-mobile-root>
npm run lint
npm run lint:scss
npm run format:check
npm run test
npm run build
```

**Verificacao**:
- Todos os comandos passam antes da implementacao.
- Falhas preexistentes ou ambientais ficam registradas no checkpoint.
- Build AOT e obrigatorio; Vitest isolado nao protege contra perda de tipos em merge.

### Definicao de pronto do Gate M-9.0

- [x] M-8 presente em `origin/develop` e `origin/main`.
- [x] Cadeia Git validada por conteudo e historico.
- [x] Branch M-9 criada da base correta.
- [x] Artefato temporario M-8 tratado conforme `AGENT.md`.
- [x] Contratos backend atuais reconfirmados.
- [x] B1 e B2 classificados como liberados ou bloqueados com evidencia.
- [x] Stack, estrutura e baseline confirmadas.

**Commit sugerido**: nenhum; prechecks nao geram commit.

---

## Task M-9.1 - DTOs e CobrancaMobileService

**Objetivo**: criar a borda HTTP fiel aos contratos de cobranca, sem regra financeira,
persistencia local ou acesso a endpoints internos.

**Esforco**: 0,5-1 dia.

**Arquivos esperados**:
- `src/app/core/api/api.models.ts`
- `src/app/core/cobranca/cobranca-mobile.service.ts`
- `src/app/core/cobranca/cobranca-mobile.service.spec.ts`

### Step 209.1.1 - Adicionar DTOs de borda

Adicionar, conforme o backend real:
- `StatusParcela`.
- `StatusRenegociacao`.
- `ParcelaResponse`.
- `AgendaPagamentoResponse`.
- `ValorAtualizadoParcelaResponse`.
- `RecebimentoTomadorResponse`, somente quando a Sprint 23 estiver mergeada.
- `RenegociacaoTomadorResponse`, somente quando a Sprint 24 estiver mergeada.

**Regras**:
- Espelhar nomes, tipos e nullability do JSON; nao renomear campos no transporte.
- Usar `number` apenas como representacao de borda; nenhum calculo monetario no mobile.
- Nao criar enum/estado inexistente para "vencendo", "quase atrasada" ou similar.
- DTOs publicos B1/B2 nao incluem campos internos; nao modelar no mobile o que o backend nao retorna.

### Step 209.1.2 - Criar CobrancaMobileService

Metodos do recorte atual:
```text
consultarAgenda(contratoId)
consultarParcela(parcelaId)
```

Metodos condicionados:
```text
listarRecebimentos(parcelaId)          # somente depois de B1
consultarRenegociacaoAtiva(parcelaId)  # somente depois de B2
aceitarRenegociacao(renegociacaoId)    # somente depois de B2
recusarRenegociacao(renegociacaoId)    # somente depois de B2
```

**Regras**:
- Centralizar base URL `${environment.apiBaseUrl}/cobranca`.
- Usar `HttpClient` + `firstValueFrom`, seguindo services atuais.
- Body dos PATCHes vazio se o contrato backend assim permanecer.
- Auth fica no `authInterceptor`.
- Step-up fica no `stepUpInterceptor`, nunca em argumento do service.
- Nao capturar erro para converter `403/404/409` em sucesso ou lista vazia.
- Nao adicionar metodo para recebimento manual, inadimplencia interna, contato ou proposta.

### Step 209.1.3 - Testar o service

Cobrir:
- URL e metodo da agenda.
- URL e metodo do detalhe.
- DTOs retornados sem transformacao.
- Propagacao de `403` e `404`.
- B1, quando liberado: path owner-scoped e lista vazia valida.
- B2, quando liberado: consulta, aceite e recusa nos metodos corretos.
- Nenhum teste deve esperar `X-Step-Up-Token` diretamente no service; isso pertence ao
  teste do interceptor.

**Comandos**:
```bash
npm run test -- --run src/app/core/cobranca/cobranca-mobile.service.spec.ts
npm run lint
npm run format:check
```

### Definicao de pronto da Task M-9.1

- [x] DTOs espelham contratos reais.
- [x] Service contem somente transporte HTTP.
- [x] Endpoints internos nao foram expostos.
- [x] Metodos B1/B2 so existem se os gates estiverem liberados.
- [x] Testes focados, lint e format passam.

### Commit sugerido

```text
feat(mobile): adicionar borda HTTP de cobranca
```

---

## Task M-9.2 - Rotas, descoberta e lista de parcelas

**Objetivo**: substituir o placeholder da tab Parcelas por uma jornada owner-scoped que
descobre contrato/agenda sob demanda e apresenta as parcelas recebidas.

**Esforco**: 1-1,5 dia.

**Arquivos esperados**:
- `src/app/features/authenticated/authenticated.routes.ts`
- `src/app/features/authenticated/authenticated.routes.spec.ts`
- `src/app/features/tomador/cobranca/parcelas-entry.component.*`
- `src/app/features/tomador/cobranca/agenda-detail.component.*`
- `src/app/features/tomador/formalizacao/contrato-detail.component.*`
- testes correspondentes.

### Step 209.2.1 - Criar rotas lazy owner-scoped

Rotas:
```text
/app/parcelas
/app/parcelas/proposta/:propostaId
/app/parcelas/contratos/:contratoId
/app/parcelas/contratos/:contratoId/parcelas/:parcelaId
/app/parcelas/contratos/:contratoId/parcelas/:parcelaId/renegociacao
```

**Regras**:
- Todas usam `roleGuard` com `roles: ['CLIENTE']`.
- Todas usam `data.tab = 'parcelas'`.
- A rota de renegociacao pode ser criada na M-9.5; nao apontar para placeholder.
- IDs da rota sao apenas localizadores; ownership real fica no backend.
- Nao expor rota interna de financeiro/backoffice.

### Step 209.2.2 - Implementar entrada sem N+1

`ParcelasEntryComponent`:
- lista propostas `APROVADA` via `CreditoMobileService`, paginadas como na M-8;
- nao consulta contrato/agenda para montar cada card;
- ao tocar, navega para `/app/parcelas/proposta/:propostaId`;
- estados loading, vazio, erro+retry, pull-to-refresh e carregar mais;
- token de geracao para descartar resposta obsoleta.

**Copy**:
- Explicar que as parcelas aparecem apos assinatura e geracao da agenda.
- Lista vazia nao significa divida quitada; significa ausencia de propostas elegiveis na
  fonte atual.

### Step 209.2.3 - Resolver contrato e agenda

`AgendaDetailComponent`:
- por `propostaId`, chama `ContratosMobileService.consultarPorProposta`;
- por `contratoId`, chama `ContratosMobileService.consultarPorId`;
- exige `contrato.status === 'ASSINADO'` apenas para habilitar a expectativa de agenda;
- chama `CobrancaMobileService.consultarAgenda(contrato.id)`;
- usa `contrato.id` retornado como identidade da jornada;
- trata `404` como agenda ainda indisponivel com retry;
- trata `403` com mensagem neutra, sem revelar existencia;
- trata rede/`5xx` com erro e retry, sem cache financeiro local.

Nao fazer N+1, polling ou persistencia do `contratoId`.

### Step 209.2.4 - Exibir lista de parcelas

Cada item apresenta:
- numero da parcela;
- vencimento;
- valor total estatico da agenda;
- status retornado pela API;
- CTA/toque para detalhe.

Resumo da agenda:
- numero de parcelas;
- valor total;
- data de geracao.

**Nao apresentar**:
- calculo local de proxima parcela;
- dias de atraso calculados no dispositivo;
- juros/multa atualizados na lista;
- labels que prometam quitacao fora do status do backend.

Usar componentes Ionic e mixins do New Design System SEP. Garantir toque minimo, foco,
contraste, quebra em 320 px e tema escuro.

### Step 209.2.5 - Integrar entradas existentes

- A tab Parcelas ja aponta para `/app/parcelas`; substituir apenas o componente.
- Adicionar CTA "Ver parcelas" no detalhe do contrato somente quando o snapshot estiver
  `ASSINADO`.
- Opcionalmente tornar o card "Proximas parcelas" da home navegavel para `/app/parcelas`;
  manter uma unica fonte de rota.
- Nao duplicar a lista de propostas da M-8 em um novo service.

### Step 209.2.6 - Testar rotas, descoberta e lista

Cobrir:
- role `CLIENTE` permitida e `ADMIN` bloqueada.
- entrada pagina sem N+1.
- resolucao por proposta e por contrato.
- contrato nao assinado sem chamada indevida de agenda.
- agenda `404`, ownership `403`, rede e retry.
- lista vazia e lista com todos os status.
- navegacao ao detalhe preservando `contratoId` e `parcelaId`.
- CTA da formalizacao somente em `ASSINADO`.

**Comandos**:
```bash
npm run test -- --run src/app/features/authenticated/authenticated.routes.spec.ts
npm run test -- --run src/app/features/tomador/cobranca
npm run lint
npm run lint:scss
npm run format:check
npm run build
```

### Definicao de pronto da Task M-9.2

- [x] Placeholder de Parcelas removido.
- [x] Rotas protegidas por `CLIENTE`.
- [x] Descoberta proposta -> contrato -> agenda ocorre sob demanda.
- [x] Nenhuma lista global ou N+1 foi inventada.
- [x] Lista apresenta somente snapshots do backend.
- [x] Testes, lint, SCSS, format e build passam.

### Commit sugerido

```text
feat(mobile): implementar lista de parcelas do tomador
```

---

## Task M-9.3 - Detalhe, valor atualizado e estados

**Objetivo**: apresentar o snapshot atualizado de uma parcela e tornar atraso,
inadimplencia, pagamento parcial e renegociacao visualmente claros sem recalculo local.

**Esforco**: 1 dia.

**Arquivos esperados**:
- `src/app/features/tomador/cobranca/parcela-detail.component.*`
- `src/app/features/tomador/cobranca/parcela-status.component.*`
- testes correspondentes.

### Step 209.3.1 - Criar componente de status

`ParcelaStatusComponent` deve mapear:
- `PENDENTE` -> Pendente.
- `PARCIALMENTE_PAGA` -> Parcialmente paga.
- `PAGA` -> Paga.
- `ATRASADA` -> Atrasada.
- `EM_NEGOCIACAO` -> Em negociacao.
- `INADIMPLENTE` -> Inadimplente.
- `RENEGOCIADA` -> Renegociada.

**Regras**:
- Texto acompanha cor/icone; nunca usar cor como unica informacao.
- O mapa e exaustivo para o union type.
- Nao derivar status por data ou valor.
- Reutilizar o componente na lista e no detalhe.

### Step 209.3.2 - Consultar e apresentar valor atualizado

`ParcelaDetailComponent`:
- le `contratoId` e `parcelaId` da rota;
- consulta `CobrancaMobileService.consultarParcela(parcelaId)`;
- apresenta numero, vencimento, status, principal original, juros originais, juros de mora,
  multa, valor devido atualizado, total recebido e valor em aberto;
- informa a data/hora da consulta somente como momento da tela, sem trata-la como data
  calculada pelo backend;
- possui atualizar sob demanda e retry; sem polling.

**Regras monetarias**:
- Formatar em BRL para exibicao.
- Nao somar campos para validar total.
- Nao substituir campos ausentes por calculo.
- Nao apresentar valor negativo localmente corrigido; divergencia de API e erro de contrato.

### Step 209.3.3 - Tratar estados e CTAs

- `PAGA`: historico disponivel quando B1 existir; sem CTA de pagamento/renegociacao.
- `PARCIALMENTE_PAGA`: destacar total recebido e saldo retornado.
- `ATRASADA`/`INADIMPLENTE`: copy objetiva, sem linguagem constrangedora.
- `EM_NEGOCIACAO`: CTA para termos somente quando B2 estiver liberado.
- `RENEGOCIADA`: informar que a agenda foi substituida e oferecer retorno para agenda ativa.
- `PENDENTE`: exibir vencimento sem prever atraso.

Nao oferecer Pix, boleto, "pagar agora", contato ou proposta de renegociacao.

### Step 209.3.4 - Tratar erros e concorrencia

- `403`: mensagem neutra; nao diferenciar parcela alheia de inexistente.
- `404`: parcela indisponivel; CTA para voltar a agenda.
- `409`: se surgir em leitura, tratar como conflito generico e recarregar; nao inventar estado.
- rede/`5xx`: manter ultimo snapshot apenas durante a vida do componente, marcado como nao
  atualizado; oferecer retry.
- resposta atrasada de uma parcela anterior nao sobrescreve a atual.

### Step 209.3.5 - Testar detalhe e estados

Cobrir:
- todos os status e seus rotulos.
- composicao e valores exibidos sem recalculo.
- atualizacao sob demanda.
- `403`, `404`, rede e retry.
- CTA de renegociacao condicionado a `EM_NEGOCIACAO` + B2.
- nenhum texto/controle interno.
- layout em viewport estreito e tema escuro por seletores/classes relevantes.

**Comandos**:
```bash
npm run test -- --run src/app/features/tomador/cobranca/parcela-status.component.spec.ts
npm run test -- --run src/app/features/tomador/cobranca/parcela-detail.component.spec.ts
npm run lint
npm run lint:scss
npm run format:check
npm run build
```

### Definicao de pronto da Task M-9.3

- [x] Detalhe usa `ValorAtualizadoParcelaResponse`.
- [x] Todos os status possuem rotulo acessivel.
- [x] Nenhum calculo financeiro foi duplicado.
- [x] Estados de atraso/inadimplencia sao claros e nao constrangedores.
- [x] Erros nao vazam existencia/ownership.
- [x] Testes, lint, SCSS, format e build passam.

### Commit sugerido

```text
feat(mobile): adicionar detalhe e estados de parcela
```

---

## Task M-9.4 - Historico de recebimentos

**Gate**: executar somente depois da Sprint 23/B1 mergeada em `develop` e documentada.

**Objetivo**: permitir que o tomador veja os recebimentos da propria parcela sem acessar
a listagem operacional interna.

**Esforco**: 0,5-1 dia.

### Step 209.4.1 - Reconfirmar B1

Antes de editar:
- confirmar path, auth, ordenacao e DTO no controller/backend;
- confirmar teste de owner e nao-owner;
- atualizar a secao de contratos deste arquivo se o path diferir;
- confirmar que nenhum campo bancario/interno foi adicionado.

Se B1 nao estiver integrado, parar a Task. Nao usar `GET /recebimentos` interno e filtrar
no cliente.

### Step 209.4.2 - Implementar historico sob demanda

No detalhe da parcela:
- secao "Historico de recebimentos" recolhida por padrao;
- carregar somente ao abrir ou tocar em atualizar;
- lista ordenada conforme backend;
- exibir data, valor e meio de pagamento;
- nao modelar identificador externo, pois o contrato B1 nao o retorna;
- lista vazia com estado proprio;
- falha do historico nao apaga nem bloqueia o detalhe da parcela.

**Nao exibir**:
- `movimentacaoEscrowId`;
- operador;
- idempotency key;
- observacao interna;
- dados bancarios;
- flag tecnica `novo`.

### Step 209.4.3 - Validar consistencia sem recalculo

- `totalRecebido` do detalhe continua autoritativo.
- Nao somar historico para substituir ou "corrigir" `totalRecebido`.
- Se houver divergencia visual, oferecer refresh e registrar o contrato; nao ajustar localmente.
- O app nao classifica recebimento como conciliado, parcial ou excedente sem campo backend.

### Step 209.4.4 - Testar historico

Cobrir:
- lazy load.
- lista vazia.
- ordenacao preservada.
- campos permitidos e assercoes negativas para IDs internos.
- erro isolado e retry.
- ownership `403`.
- detalhe permanece utilizavel quando historico falha.

**Comandos**:
```bash
npm run test -- --run src/app/core/cobranca/cobranca-mobile.service.spec.ts
npm run test -- --run src/app/features/tomador/cobranca/parcela-detail.component.spec.ts
npm run lint
npm run lint:scss
npm run format:check
npm run build
```

### Definicao de pronto da Task M-9.4

- [x] B1 integrado e reconfirmado.
- [x] Mobile nao chama endpoint interno.
- [x] Historico e owner-scoped e carregado sob demanda.
- [x] Nenhum dado operacional sensivel e exibido.
- [x] Nenhum total e recalculado.
- [x] Testes e suite estatica passam.

### Commit sugerido

```text
feat(mobile): exibir historico de recebimentos da parcela
```

---

## Task M-9.5 - Renegociacao do tomador com step-up

**Gate**: executar somente depois da Sprint 24/B2 mergeada em `develop` e documentada.

**Objetivo**: permitir leitura completa e decisao consciente da proposta de renegociacao,
com aceite reforcado e recusa explicita.

**Esforco**: 1-1,5 dia.

**Arquivos esperados**:
- `src/app/features/tomador/cobranca/renegociacao-detail.component.*`
- `src/app/core/interceptors/step-up.interceptor.ts`
- testes correspondentes.

### Step 209.5.1 - Reconfirmar B2 e termos

Antes de editar:
- confirmar path de descoberta, auth e DTO;
- confirmar que `EM_NEGOCIACAO` resolve uma proposta ativa legivel;
- confirmar `404` para ausencia/expiracao e `403` para nao-owner;
- confirmar que aceite exige step-up e recusa nao;
- confirmar que resposta dos PATCHes permite atualizar a jornada.

Se o mobile nao puder ler valor por parcela, quantidade, total, vencimento, desconto e
expiracao antes da decisao, parar a Task.

### Step 209.5.2 - Criar detalhe da renegociacao

Apresentar:
- status da proposta.
- valor de cada nova parcela.
- quantidade de parcelas.
- primeiro vencimento.
- desconto.
- data da proposta.
- data de expiracao.
- valor total renegociado retornado pelo backend; nunca calcular `valor x quantidade`.

**Nao apresentar**:
- `tomadorId`.
- `propostaPor`.
- `agendaOriginalId`.
- IDs tecnicos fora do necessario para rota/request.
- linguagem que sugira aceite automatico ou garantia de quitacao.

O componente consulta B2 ao entrar e imediatamente antes de abrir a confirmacao, evitando
decisao sobre snapshot expirado.

### Step 209.5.3 - Estender o stepUpInterceptor

Adicionar matching exato:
```text
PATCH /api/v1/cobranca/renegociacoes/{id}/aceite
```

**Nao incluir**:
- GET de renegociacao.
- PATCH de recusa.
- GET de agenda/parcela/historico.

Cobrir:
- metodo + path corretos consomem token uma vez.
- recusa nao consome token.
- URL parecida ou outro metodo nao recebe header.
- ausencia de token deixa request seguir sem header para o backend responder `403`.

### Step 209.5.4 - Implementar aceite consciente

Fluxo:
1. Recarregar termos atuais.
2. Abrir confirmacao explicita com valor, quantidade, vencimento e expiracao.
3. Se MFA estiver desabilitado, bloquear e orientar; nao usar bypass backend.
4. Se nao houver token, navegar para
   `/app/step-up?next=/app/parcelas/contratos/{contratoId}/parcelas/{parcelaId}/renegociacao`.
5. Ao voltar, recarregar termos e exigir novo toque.
6. Chamar PATCH apenas apos nova confirmacao.
7. Em sucesso, limpar estado local e recarregar agenda ativa + parcela.

**Concorrencia/erro**:
- `403` por step-up: limpar token e permitir nova verificacao.
- `403` por ownership: mensagem neutra, sem loop.
- `404`: proposta indisponivel/expirada; voltar ao detalhe.
- `409`: decisao concorrente ou expiracao; recarregar termos e agenda.
- rede/`5xx`: nunca assumir aceite.
- bloquear duplo submit.

### Step 209.5.5 - Implementar recusa explicita

Fluxo:
- mostrar termos atuais e confirmacao de recusa;
- nao iniciar step-up e nao consumir token;
- chamar PATCH de recusa uma vez;
- em sucesso, recarregar agenda/parcela;
- tratar `403/404/409/rede` como no aceite, sem assumir recusa.

Cancelar a confirmacao nao chama API.

### Step 209.5.6 - Testar renegociacao

Cobrir:
- termos completos antes dos CTAs.
- IDs internos ausentes da UI.
- aceite sem MFA bloqueado.
- aceite sem token navega ao step-up.
- retorno nao aceita automaticamente.
- token anexado e consumido apenas no aceite.
- recusa sem step-up.
- duplo submit bloqueado.
- `403` step-up vs ownership, `404`, `409`, rede e retry.
- refresh da agenda ativa depois da decisao.

**Comandos**:
```bash
npm run test -- --run src/app/core/interceptors/step-up.interceptor.spec.ts
npm run test -- --run src/app/features/tomador/cobranca/renegociacao-detail.component.spec.ts
npm run lint
npm run lint:scss
npm run format:check
npm run build
```

### Definicao de pronto da Task M-9.5

- [x] B2 integrado e reconfirmado.
- [x] Termos completos aparecem antes da decisao.
- [x] Aceite exige confirmacao, MFA e step-up de uso unico.
- [x] Retorno do step-up nao dispara aceite.
- [x] Recusa e explicita e nao consome step-up.
- [x] Agenda/parcela sao recarregadas apos sucesso.
- [x] Erros nunca viram sucesso presumido.
- [x] Testes e suite estatica passam.

### Commit sugerido

```text
feat(mobile): implementar decisao de renegociacao
```

---

## Task M-9.6 - MSW, Vitest, smoke PWA e fechamento

**Objetivo**: consolidar cenarios offline, regressao, smoke responsivo e documentacao da
M-Sprint 9.

**Esforco**: 1 dia.

**Arquivos esperados**:
- `src/mocks/handlers.ts`
- `e2e/cobranca-mobile.spec.ts`
- `docs-SEP/repos/sep-mobile/README.md`
- `docs-SEP/repos/sep-mobile/SPRINT-M-9-PR.md`
- PRD, CONTEXT e AI-ROADMAP quando aplicavel.

### Step 209.6.1 - Adicionar MSW de cobranca

Seed minimo:
- proposta aprovada propria.
- contrato assinado.
- agenda com parcelas `PENDENTE`, `PARCIALMENTE_PAGA`, `PAGA`, `ATRASADA`,
  `EM_NEGOCIACAO`, `INADIMPLENTE` e `RENEGOCIADA`.
- detalhe atualizado com valores ficticios coerentes.
- historico vazio e com recebimentos, quando B1 liberado.
- proposta de renegociacao ativa com termos, quando B2 liberado.

**Regras**:
- estado isolado/reseedavel por teste.
- aceite cria agenda substituta ativa e atualiza status de forma observavel.
- recusa restaura estado retornado pelo mock.
- nenhum token, dado bancario, CPF/CNPJ ou operador em storage.
- handlers de cobranca nao quebram smokes de onboarding, credito ou formalizacao.

### Step 209.6.2 - Completar Vitest

Cobertura minima:
- service e DTOs.
- rotas/role guard.
- entrada, agenda e lista.
- detalhe e todos os status.
- historico, se B1.
- renegociacao/step-up, se B2.
- MSW e cenarios de erro.
- regressao do CTA da formalizacao.

Manter testes de componentes Ionic por instancia quando o happy-dom nao montar web
components; usar render real nos componentes HTML simples.

### Step 209.6.3 - Criar smoke Playwright PWA

Fluxo principal:
```text
login CLIENTE
  -> tab Parcelas
  -> proposta aprovada
  -> agenda
  -> parcela atrasada/inadimplente
  -> detalhe atualizado
  -> historico
  -> termos de renegociacao
  -> step-up
  -> retorno sem aceite automatico
  -> aceite explicito
  -> agenda substituta ativa
```

Fluxo secundario:
- recusa de renegociacao sem step-up.

Viewports:
- Pixel 5.
- largura 320 px.

Assercoes negativas:
- sem operacoes internas.
- sem `tomadorId`, `propostaPor`, escrow ou identificador de operador.
- sem token em storage.
- sem dados bancarios.
- sem aceite automatico ao voltar do step-up.

Se B1/B2 ainda estiverem bloqueados, criar smoke apenas para M-9.1 a M-9.3 e registrar
que ele nao fecha o DoD da sprint.

### Step 209.6.4 - Rodar suite final

**Comandos**:
```bash
cd <sep-mobile-root>
npm run lint
npm run lint:scss
npm run format:check
npm run test
npm run build
npx playwright test e2e/smoke.spec.ts e2e/onboarding-mobile.spec.ts e2e/credito-mobile.spec.ts e2e/formalizacao-mobile.spec.ts e2e/cobranca-mobile.spec.ts
```

**Verificacao**:
- lint, SCSS, format, Vitest e build AOT verdes.
- smokes anteriores continuam verdes.
- smoke M-9 verde nos dois viewports.
- falha ambiental/preexistente separada de regressao.

### Step 209.6.5 - Atualizar documentacao

Atualizar no mesmo ciclo:
- `repos/sep-mobile/README.md`: rotas, componentes, service, contratos, seguranca, testes e
  gaps efetivamente entregues.
- `docs-sep/PRD-FASE-3.md`: status da M-9 e link dos steps.
- `docs-sep/CONTEXT-PARTE-2.md`: resumo verificavel, branch/PR e validacoes.
- `AI-ROADMAP.md`: mapa mobile e termos de busca.
- spec 209: status de execucao, divergencias e follow-ups.
- `repos/sep-api/COBRANCA.md` e OpenAPI, se B1/B2 forem implementados no backend.
- `repos/sep-mobile/SPRINT-M-9-PR.md`: Summary, test plan, mudancas, decisoes, gaps,
  follow-ups e commits.

Nao manter link permanente para o PR temporario.

### Step 209.6.6 - Checkpoint final pre-commit

Apresentar:
- `git status --short --branch`.
- `git diff --stat`.
- arquivos criados/modificados/removidos.
- testes/build/lint executados e resultado.
- estado dos gates B1/B2.
- riscos e pendencias.
- mensagem de commit sugerida.

Aguardar aprovacao antes de staging/commit. Push e PR continuam manuais.

### Definicao de pronto da Task M-9.6

- [x] MSW cobre estados e erros entregues.
- [x] Vitest cobre services, rotas, componentes e step-up.
- [x] Smoke PWA completo passa em Pixel 5 e 320 px.
- [x] Smokes anteriores nao regrediram.
- [x] Suite estatica e build AOT passam.
- [x] Docs e PR temporario atualizados.
- [x] Checkpoint final apresentado.

### Commit sugerido

```text
test(mobile): consolidar cobranca e smoke PWA
```

---

## Definition of Done da M-Sprint 9

- [x] Tomador acessa apenas propostas, contratos, agendas e parcelas proprias.
- [x] Entrada proposta -> contrato -> agenda nao faz N+1.
- [x] Lista e detalhe apresentam status e valores do backend sem recalculo.
- [x] Atraso, inadimplencia, pagamento parcial e renegociacao sao claros e acessiveis.
- [x] Historico usa endpoint owner-scoped; endpoint interno nunca e chamado.
- [x] Renegociacao exibe termos completos antes de aceitar/recusar.
- [x] Aceite exige MFA, confirmacao e step-up de uso unico.
- [x] Recusa nao consome step-up e exige confirmacao.
- [x] Nenhuma operacao interna aparece no mobile.
- [x] Nenhum dado financeiro/sensivel e persistido localmente.
- [x] New Design System SEP funciona em tema claro/escuro e 320 px.
- [x] Lint, SCSS, format, Vitest, build AOT e smokes passam.
- [x] Documentacao e PR temporario refletem a implementacao real.

**A sprint nao esta concluida enquanto B1 ou B2 permanecer bloqueado**, mesmo que
M-9.1 a M-9.3 estejam implementadas.

## Checklist de code review da M-Sprint 9

### Contratos e arquitetura
- [x] DTOs espelham JSON real.
- [x] Components chamam services; nao acessam `HttpClient` diretamente.
- [x] Services nao contem regra financeira.
- [x] Nao ha N+1 nem lista global inventada.
- [x] Nenhum endpoint interno e chamado pelo mobile.

### Seguranca e regulatorio
- [x] `roleGuard ['CLIENTE']` em todas as rotas.
- [x] Ownership permanece no backend.
- [x] `403` nao enumera recurso.
- [x] Step-up token fica em memoria e e consumido uma vez.
- [x] Aceite e recusa seguem a assimetria do backend.
- [x] Termos completos precedem decisao financeira.
- [x] Copy de cobranca nao e constrangedora.
- [x] Nenhum dado bancario, operador, escrow ou token aparece/loga/persiste.

### UX e acessibilidade
- [x] Todos os status possuem texto, nao apenas cor.
- [x] Loading, vazio, erro e retry existem por superficie.
- [x] Falha de historico nao bloqueia detalhe.
- [x] Duplo submit bloqueado.
- [x] Tema claro/escuro, foco, toque e 320 px validados.

### Testes e fechamento
- [x] Services, rotas, estados e erros cobertos.
- [x] Interceptor cobre aceite e exclui recusa/GET.
- [x] Smoke cobre retorno do step-up sem efeito automatico.
- [x] Build AOT executado.
- [x] Smokes M-6, M-7 e M-8 sem regressao.
- [x] Docs refletem somente comportamento entregue.
