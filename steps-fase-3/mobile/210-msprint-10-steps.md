# Steps - M-Sprint 10 - Jornada da Empresa Credora Mobile

**Spec de origem**: [`210-msprint-10-credora-mobile.md`](../../specs/fase-3/210-msprint-10-credora-mobile.md)

**Status**: planejada.

**Objetivo geral**: substituir a casca da empresa credora por uma jornada mobile simplificada
de perfil/elegibilidade, oportunidades, interesse e carteira, consumindo os contratos reais do
modulo `credores` das Sprints backend 16-17 sem duplicar ownership, elegibilidade, regras de
interesse, associacao de carteira, auditoria ou calculos financeiros no app.

**Esforco total estimado**: 6-8 dias de Dev Mobile.

**Repos de destino**:
- `sep-mobile`: codigo Angular/Ionic, testes, MSW e smoke PWA.
- `sep-api`: somente eventual contrato backend aprovado em trabalho separado; nao alterar backend
  dentro de uma Task mobile.
- `docs-SEP`: documentacao operacional editada apenas no working tree; operacao Git manual.

**Branch sugerida**:
- `feature/msprint-10-credora-mobile`

**Design system vigente**: New Design System SEP mobile aplicado na M-Sprint 12. Usar Ionic
standalone, Ionicons, tokens e mixins `sep-mobile-*` existentes. Nao reintroduzir Notion legado,
Tailwind, shadcn/ui, Radix, React ou biblioteca nova de icones sem ADR e aprovacao explicita.

## Estado confirmado durante o planejamento (2026-07-02)

- M-Sprint 9 esta mergeada em `origin/develop` pelo PR #107 e promovida a `origin/main` pelo
  PR #108.
- `sep-mobile` usa Angular 20, Ionic 8 e Capacitor 8; nao ha upgrade de stack nesta sprint.
- A rota `/app/credora/inicio` existe como casca isolada, sem tab propria, guard de presenca,
  service real ou navegacao funcional.
- Nao existe `Role.CREDORA`. Usuarios que representam uma empresa credora continuam autenticados
  com uma das roles existentes, normalmente `CLIENTE`.
- Os endpoints da jornada usam `isAuthenticated()`; a autorizacao real ocorre por credora
  vinculada ao usuario autenticado, ownership e elegibilidade no backend.
- O acesso mobile deve ser governado por autenticacao + presenca de credora confirmada por
  `GET /api/v1/credores/me`. Nao inventar role, claim ou permissao local.
- Cadastro de credora e onboarding KYB nao fazem parte da Spec 210. A M-10 atende empresas
  credoras ja cadastradas; usuario sem credora recebe estado neutro e nao entra na jornada.
- O backend nao expoe consulta do interesse ativo da credora por oportunidade. Esse gap bloqueia
  uma UX correta de cancelamento apos reload e esta formalizado no Gate I1 abaixo.

## Modelo de acesso da jornada

```text
usuario autenticado
  -> GET /api/v1/credores/me
     -> 200: credora presente; libera jornada
     -> 404: usuario sem credora; nao libera rotas/tabs
     -> 401: sessao tratada pelos interceptors/guards existentes
     -> rede/5xx: estado tecnico com retry; nao concluir que o usuario nao e credora
```

Regras:
- Nao usar `roleGuard` com uma role `CREDORA` inexistente.
- O guard de presenca melhora a UX, mas nao substitui a autorizacao backend.
- IDs de rota sao localizadores; ownership continua validada pelo backend.
- Estado de presenca pode ficar em memoria durante a sessao para evitar chamadas duplicadas.
- Nao persistir perfil, oportunidades, carteira ou estado de interesse em `localStorage`,
  `sessionStorage` ou Capacitor Preferences.
- Limpar qualquer contexto em memoria quando o usuario autenticado mudar ou fizer logout.
- Endpoints administrativos permanecem inacessiveis no mobile.

## Contratos backend consumidos

Base: `/api/v1/credores`.

### Perfil e elegibilidade - Sprint 16

- `GET /me` -> `200 EmpresaCredoraResponse`; `404` quando o usuario nao possui credora.
- `GET /me/elegibilidade` -> `200 ElegibilidadeResponse`; `404` quando nao possui credora.

`EmpresaCredoraResponse`:

```text
id: UUID
usuarioId: UUID
onboardingId: UUID
cnpj: string                 # formatado pelo backend
razaoSocial: string
status: CADASTRADA | ATIVA | SUSPENSA
elegibilidade: PENDENTE | ELEGIVEL | INELEGIVEL
motivoInelegibilidade: string | null
tipoCredora: EMPRESA | INSTITUICAO_FINANCEIRA
capacidadeAporte: BigDecimal | null
dataCriacao: OffsetDateTime
dataModificacao: OffsetDateTime
```

`ElegibilidadeResponse`:

```text
status: CADASTRADA | ATIVA | SUSPENSA
elegibilidade: PENDENTE | ELEGIVEL | INELEGIVEL
motivoInelegibilidade: string | null
```

### Oportunidades e interesse - Sprint 17

- `GET /oportunidades` -> `200 OportunidadeResponse[]`; lista nao paginada.
- `GET /oportunidades/{id}` -> `200 OportunidadeResponse`; `404` para credora/oportunidade
  indisponivel.
- `POST /oportunidades/{id}/interesses` com body vazio -> `201 InteresseResponse`;
  `404`, `409` ou `422`.
- `DELETE /oportunidades/{id}/interesses/me` -> `204`; sem interesse ativo retorna `404`.

`OportunidadeResponse`:

```text
id: UUID
propostaId: UUID
contratoId: UUID | null
valor: BigDecimal
prazoMeses: int
taxaJurosMensal: BigDecimal
status: DISPONIVEL | ENCERRADA
dataCriacao: OffsetDateTime
```

`InteresseResponse`:

```text
id: UUID
oportunidadeId: UUID
status: ATIVO | CANCELADO
dataCriacao: OffsetDateTime
```

### Carteira - Sprint 17

- `GET /carteira` -> `200 OperacaoCarteiraResponse[]`; lista nao paginada.
- `GET /carteira/{id}` -> `200 OperacaoCarteiraResponse`; `404` uniforme para credora/operacao
  indisponivel ou alheia.

`OperacaoCarteiraResponse`:

```text
id: UUID
contratoId: UUID
oportunidadeId: UUID | null
status: ASSOCIADA | ENCERRADA
justificativa: string
valor: BigDecimal | null
prazoMeses: int | null
taxaJurosMensal: BigDecimal | null
contratoStatus: string | null
cobranca: CarteiraCobrancaResumo | null
dataCriacao: OffsetDateTime
```

`CarteiraCobrancaResumo`:

```text
numeroParcelas: int
valorTotal: BigDecimal
parcelasPagas: int
parcelasAtrasadas: int
totalRecebido: BigDecimal
proximoVencimento: LocalDate | null
```

### Endpoints explicitamente proibidos no mobile

- `POST /api/v1/credores`.
- `GET /api/v1/credores/{id}`.
- `POST /api/v1/credores/oportunidades/sync`.
- `POST /api/v1/credores/carteira/operacoes`.

O primeiro cadastra a credora e esta fora do recorte simplificado da Spec 210. Os tres ultimos
sao administrativos; `carteira/operacoes` exige ADMIN + step-up. A M-10 nao altera
`step-up.interceptor.ts`.

## Gate I1 - Descoberta do interesse ativo

O contrato atual nao informa se a credora autenticada possui interesse ativo:
- `OportunidadeResponse` nao possui `interesseAtual` ou flag equivalente.
- nao existe `GET /oportunidades/{id}/interesses/me`.
- `POST` devolve `409` quando ja existe interesse.
- `DELETE` devolve `404` quando nao existe interesse ativo.

Sem leitura autoritativa, o app nao consegue renderizar corretamente
`Manifestar interesse` versus `Cancelar interesse` apos reload, novo login ou outro dispositivo.

Contrato minimo aceitavel antes de concluir a Task M-10.4:

```text
Opcao A:
  GET /api/v1/credores/oportunidades/{id}/interesses/me
  -> 200 InteresseResponse | 404 sem interesse ativo

Opcao B:
  OportunidadeResponse inclui interesseAtual: InteresseResponse | null
```

Regras:
- A decisao do contrato pertence ao backend e deve ser aprovada/implementada separadamente.
- Nao persistir interesse em storage para mascarar o gap.
- Nao usar tentativa de `POST` + `409` como mecanismo primario de leitura.
- Nao assumir interesse ativo apenas porque a oportunidade aparece na carteira.
- M-10.1, M-10.2, M-10.3 e M-10.5 podem avancar sem I1.
- M-10.4 pode preparar componentes e operacoes, mas nao fecha o DoD enquanto I1 estiver aberto.
- Se o usuario aceitar explicitamente uma UX degradada baseada apenas no resultado das mutacoes
  da sessao atual, atualizar primeiro a Spec 210 e este step com a divida aceita.

## Decisoes de implementacao

- A navegacao credora usa uma unica tab `Credora`, visivel apenas quando a presenca foi confirmada.
  Isso mantem no maximo cinco tabs para um usuario `CLIENTE` que tambem possui credora.
- A home credora substitui a casca existente e apresenta atalhos para perfil, oportunidades e
  carteira. Nao simula KYB, aporte, Pix ou operacao administrativa.
- Dashboard pode mostrar contagens de oportunidades/carteira retornadas pelas listas, mas nao
  calcula total aportado, rentabilidade, exposicao ou qualquer indicador financeiro inexistente.
- Perfil e elegibilidade sao snapshots do backend. O app nao deriva elegibilidade de status,
  CNPJ, onboarding ou PLD.
- Oportunidades e carteira nao sao paginadas no contrato atual. Consumir a lista como retornada;
  nao criar paginacao/cache local ficticio.
- `propostaId`, `contratoId`, `usuarioId` e `onboardingId` nao sao apresentados como informacao
  de negocio na UI.
- Valores e taxas usam `number` somente na borda de apresentacao. Nao realizar aritmetica
  financeira; formatar com `Intl.NumberFormat`.
- Manifestar interesse nao cria aporte, alocacao, carteira ou operacao financiada. A carteira
  nasce por associacao assistida do ADMIN, fora do mobile.
- `justificativa` da associacao e operacional. Modelar o contrato real, mas nao exibir o texto
  bruto no recorte simplificado sem aprovacao de produto/seguranca.
- Nenhum endpoint da jornada da credora exige step-up.
- Erros `404` de detalhe devem ser neutros; nao diferenciar recurso inexistente de recurso alheio.

## Fora de escopo

- Cadastro da empresa credora no mobile.
- Onboarding KYB/documentos da credora.
- Criar role ou claim `CREDORA`.
- Aporte financeiro, Pix, escrow, matching ou marketplace.
- Sincronizar oportunidades.
- Associar operacao a carteira.
- Exibir dados do tomador, payload de provider, auditoria ou observacao operacional interna.
- Recalcular elegibilidade, taxa, saldo, recebimentos ou status contratual.
- Paginacao local, cache offline ou persistencia de dados financeiros.
- Push notification, deep link nativo, Android/iOS ou plugin Capacitor novo.

## Protocolo obrigatorio por Task

1. Executar somente a Task liberada pelo usuario.
2. Confirmar codigo e contratos atuais antes de editar.
3. Implementar a menor mudanca coerente com os padroes existentes.
4. Escrever testes comportamentais para guard, ownership aparente, estados e mutacoes.
5. Rodar as verificacoes indicadas.
6. Parar em checkpoint pre-commit com status, diff, testes, riscos e mensagem sugerida.
7. Aguardar aprovacao antes de `git add` e `git commit`.
8. Usar paths especificos; nunca `git add -A`.

**Skills obrigatorias na implementacao**:
- `coding-guidelines`: simplicidade, mudancas cirurgicas e verificacao orientada a meta.
- `clean-code`: nomes intencionais, componentes pequenos e testes F.I.R.S.T.
- Arquitetura do projeto: components chamam services; DTOs ficam na borda; ownership,
  elegibilidade, regras de interesse e carteira permanecem no backend.
- `design-patterns-java`: aplicar o filtro de pattern-itis; nenhuma mudanca Java ou novo GoF e
  esperada nesta sprint mobile.

## Ordem de execucao

```text
M-10.0 prechecks
  -> M-10.1 DTOs + CredoraMobileService + contexto de presenca
  -> M-10.2 dashboard, perfil e elegibilidade
  -> M-10.3 oportunidades e detalhe
  -> Gate I1 resolvido
  -> M-10.4 interesse e cancelamento
  -> M-10.5 carteira simplificada
  -> M-10.6 rotas/tabs/guards + MSW + Vitest + smoke + docs
```

---

## Gate M-10.0 - Prechecks

**Objetivo**: confirmar cadeia Git, contratos backend, modelo de acesso, gap I1 e baseline.

### Step 210.0.1 - Confirmar cadeia Git

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
- M-9/PR #107 presente em `origin/develop`.
- M-9/PR #108 presente em `origin/main`.
- `develop` contem todo o produto necessario para iniciar M-10.
- Working tree limpo ou alteracoes do usuario identificadas e preservadas.
- Se a sprint anterior nao estiver integrada, parar e pedir aprovacao antes de implementar.

### Step 210.0.2 - Criar branch e tratar PR temporario

```bash
cd <sep-mobile-root>
git switch develop
git pull --ff-only
git switch -c feature/msprint-10-credora-mobile
```

Em `docs-SEP`, remover `repos/sep-mobile/SPRINT-M-9-PR.md` somente depois de usado no PR.

### Step 210.0.3 - Confirmar stack e estrutura mobile

```bash
cd <sep-mobile-root>
node --version
npm --version
npm ls @angular/core @ionic/angular @capacitor/core
find src/app/features/credora -maxdepth 4 -type f | sort
sed -n '1,240p' src/app/features/authenticated/authenticated.routes.ts
sed -n '1,240p' src/app/layout/tabs/tabs.component.ts
sed -n '1,180p' src/app/features/credora/home/home.component.ts
```

**Verificacao**:
- Angular 20, Ionic 8 e Capacitor 8 permanecem instalados.
- `/app/credora/inicio` continua sendo casca sem integracao real.
- Nao existe role `CREDORA`.
- Tabs atuais do CLIENTE sao Inicio, Propostas, Parcelas e Perfil.
- New Design System SEP mobile continua vigente.

### Step 210.0.4 - Reconfirmar contratos backend

```bash
cd <sep-api-root>
sed -n '1,280p' src/main/java/com/dynamis/sep_api/credores/web/controller/EmpresaCredoraController.java
sed -n '1,320p' src/main/java/com/dynamis/sep_api/credores/web/controller/EmpresaCredoraOportunidadeController.java
sed -n '1,280p' src/main/java/com/dynamis/sep_api/credores/web/controller/EmpresaCredoraCarteiraController.java
find src/main/java/com/dynamis/sep_api/credores/web/dto -maxdepth 1 -type f | sort
```

Confirmar:
- paths, metodos, auth, status HTTP e DTOs listados neste step;
- `isAuthenticated()` + ownership em endpoints da persona credora;
- endpoints ADMIN continuam fora do mobile;
- listas continuam nao paginadas;
- cancelamento sem interesse ativo continua `404`;
- Gate I1 continua aberto ou foi resolvido por contrato documentado.

### Step 210.0.5 - Rodar baseline

```bash
cd <sep-mobile-root>
npm run lint
npm run lint:scss
npm run format:check
npm run test
npm run build
```

### Definicao de pronto do Gate M-10.0

- [ ] M-9 integrada em `develop` e `main`.
- [ ] Branch M-10 criada de `develop` atualizado.
- [ ] PR temporario anterior tratado.
- [ ] Stack e estrutura confirmadas.
- [ ] Modelo auth + presenca, sem role `CREDORA`, confirmado.
- [ ] Contratos backend reconfirmados.
- [ ] Gate I1 classificado com evidencia.
- [ ] Baseline verde ou falha preexistente documentada.

---

## Task M-10.1 - DTOs, CredoraMobileService e contexto de presenca

**Objetivo**: criar uma borda HTTP fiel e o estado efemero minimo usado por guard/tab, sem regra
de negocio ou persistencia financeira.

**Arquivos esperados**:
- `src/app/core/api/api.models.ts`
- `src/app/core/credores/credora-mobile.service.ts`
- `src/app/core/credores/credora-context.store.ts`
- testes correspondentes.

### Step 210.1.1 - Adicionar DTOs de borda

Adicionar os tipos e interfaces descritos em "Contratos backend consumidos":
- `StatusCredora`, `StatusElegibilidade`, `TipoCredora`;
- `StatusOportunidade`, `StatusInteresseCredora`, `StatusOperacaoFinanciada`;
- `EmpresaCredoraResponse`, `ElegibilidadeResponse`;
- `OportunidadeResponse`, `InteresseResponse`;
- `CarteiraCobrancaResumo`, `OperacaoCarteiraResponse`.

Regras:
- espelhar nomes, tipos e nullability reais;
- nao criar view model dentro de `api.models.ts`;
- nao modelar requests ou DTOs dos endpoints ADMIN proibidos;
- `number` e representacao de borda, nao autorizacao para calculo financeiro.

### Step 210.1.2 - Criar CredoraMobileService

Metodos:

```text
consultarMinhaCredora()
consultarElegibilidade()
listarOportunidades()
consultarOportunidade(oportunidadeId)
registrarInteresse(oportunidadeId)
cancelarInteresse(oportunidadeId)
listarCarteira()
consultarOperacao(operacaoId)
```

Regras:
- base URL unica `${environment.apiBaseUrl}/credores`;
- `HttpClient` + `firstValueFrom`, seguindo services existentes;
- `POST interesses` envia body vazio somente se o backend exigir um body;
- `DELETE` trata `204` como sucesso sem fabricar DTO;
- propagar `404`, `409` e `422`; nao converter em vazio/sucesso;
- auth fica no `authInterceptor`;
- nenhum metodo de cadastro, sync, associacao admin ou consulta administrativa.

### Step 210.1.3 - Criar contexto efemero de presenca

O contexto:
- representa `desconhecido | carregando | presente | ausente | erro`;
- carrega `GET /credores/me`;
- deduplica chamadas concorrentes de tab/guard/home;
- mantem `EmpresaCredoraResponse` somente em memoria;
- diferencia `404` de rede/5xx;
- permite retry explicito;
- limpa estado quando muda o usuario/logout.

Nao transformar o store em cache permanente de oportunidades/carteira.

### Step 210.1.4 - Testar borda e contexto

Cobrir:
- URLs e metodos dos oito endpoints permitidos;
- DTOs retornados sem transformacao;
- `204` do DELETE;
- propagacao de `404`, `409`, `422`;
- ausencia de endpoints proibidos;
- contexto presente, ausente, erro+retry e deduplicacao;
- limpeza ao trocar usuario.

```bash
npm run test -- --run src/app/core/credores
npm run lint
npm run format:check
```

### Definicao de pronto da Task M-10.1

- [ ] DTOs espelham contratos reais.
- [ ] Service contem somente transporte HTTP.
- [ ] Endpoints ADMIN/cadastro nao foram expostos.
- [ ] Contexto de presenca e efemero e distingue 404 de erro tecnico.
- [ ] Testes focados, lint e format passam.

### Commit sugerido

```text
feat(mobile): adicionar borda da jornada credora
```

---

## Task M-10.2 - Dashboard, perfil e elegibilidade

**Objetivo**: substituir a casca credora por uma home real e apresentar o perfil/elegibilidade
da empresa ja cadastrada.

**Arquivos esperados**:
- evolucao de `src/app/features/credora/home/home.component.*`;
- `src/app/features/credora/perfil/credora-profile.component.*`;
- testes correspondentes.

### Step 210.2.1 - Implementar dashboard credora

Apresentar:
- razao social e tipo da credora;
- status cadastral e elegibilidade com texto + tom semantico;
- atalhos para perfil, oportunidades e carteira;
- contagem simples de oportunidades e operacoes, somente se as listas carregarem;
- estados loading, erro+retry e carregamento parcial.

Regras:
- nao calcular total aportado, rentabilidade, saldo ou exposicao;
- falha de uma lista nao apaga o perfil;
- `404 /me` nao vira dashboard vazio;
- nao manter os cards "Em breve" da casca depois da integracao real.

### Step 210.2.2 - Implementar perfil e elegibilidade

Apresentar:
- razao social;
- CNPJ ja formatado pelo backend;
- tipo da credora;
- capacidade de aporte, quando presente;
- status e elegibilidade;
- motivo de inelegibilidade, quando retornado;
- datas de criacao/atualizacao apenas para apresentacao.

Regras:
- nao exibir `usuarioId` ou `onboardingId`;
- nao criar edicao de perfil;
- nao iniciar/reexecutar KYB ou PLD;
- nao inferir `ATIVA` a partir de `ELEGIVEL`;
- usar copy neutra para `PENDENTE`, `INELEGIVEL` e `SUSPENSA`.

### Step 210.2.3 - Testar dashboard/perfil

Cobrir:
- credora presente;
- elegivel, pendente, inelegivel e suspensa;
- campos opcionais nulos;
- dashboard com listas vazias;
- falha parcial de oportunidades/carteira;
- `404` sem credora e retry de erro tecnico;
- IDs internos ausentes do DOM;
- tema claro/escuro e 320 px por classes/seletores relevantes.

```bash
npm run test -- --run src/app/features/credora/home src/app/features/credora/perfil
npm run lint
npm run lint:scss
npm run format:check
npm run build
```

### Definicao de pronto da Task M-10.2

- [ ] Casca substituida por dashboard real.
- [ ] Perfil/elegibilidade refletem somente o backend.
- [ ] Estados sensiveis usam copy neutra.
- [ ] Nenhum identificador interno ou regra KYB/PLD foi exposto.
- [ ] Testes, suite estatica e build passam.

### Commit sugerido

```text
feat(mobile): implementar dashboard e perfil da credora
```

---

## Task M-10.3 - Oportunidades e detalhe

**Objetivo**: permitir leitura das oportunidades disponiveis sem antecipar a mutacao de
interesse antes do Gate I1.

**Arquivos esperados**:
- `src/app/features/credora/oportunidades/opportunity-list.component.*`;
- `src/app/features/credora/oportunidades/opportunity-detail.component.*`;
- testes correspondentes.

### Step 210.3.1 - Implementar lista

- Consumir `GET /credores/oportunidades`.
- Exibir valor, prazo, taxa mensal, status e data.
- Preservar a ordem do backend.
- Tratar lista vazia, loading, erro+retry e pull-to-refresh.
- Abrir detalhe por `oportunidadeId`.
- Nao criar paginacao ficticia.
- Nao expor `propostaId`/`contratoId`.

### Step 210.3.2 - Implementar detalhe read-only

- Consumir `GET /credores/oportunidades/{id}`.
- Reconsultar ao entrar/reentrar na stack Ionic.
- Exibir os mesmos termos de forma legivel.
- `DISPONIVEL` e apenas potencialmente acionavel; elegibilidade e interesse continuam backend.
- `ENCERRADA` nao oferece acao.
- `404` recebe mensagem neutra e retorno para lista.
- Area de interesse permanece ausente/desabilitada ate M-10.4.

### Step 210.3.3 - Testar oportunidades

Cobrir:
- lista com itens e vazia;
- formatacao BRL/percentual sem calculo de negocio;
- detalhe e `404`;
- pull-to-refresh/retry;
- resposta obsoleta nao sobrescreve refresh mais novo;
- IDs internos ausentes do DOM;
- oportunidade encerrada sem acao.

```bash
npm run test -- --run src/app/features/credora/oportunidades
npm run lint
npm run lint:scss
npm run format:check
npm run build
```

### Definicao de pronto da Task M-10.3

- [ ] Lista e detalhe consomem contratos reais.
- [ ] Sem paginacao/cache artificial.
- [ ] Nenhuma regra de elegibilidade/interesse foi inferida.
- [ ] Erros e concorrencia estao cobertos.
- [ ] Testes e gates passam.

### Commit sugerido

```text
feat(mobile): exibir oportunidades da credora
```

---

## Task M-10.4 - Manifestar e cancelar interesse

**Gate**: iniciar somente depois de o Gate I1 possuir contrato aprovado e integrado.

**Objetivo**: permitir decisao explicita de interesse com estado autoritativo, sem sugerir aporte
ou criacao automatica de carteira.

### Step 210.4.1 - Reconfirmar I1

Antes de editar:
- confirmar endpoint/campo de leitura do interesse ativo;
- confirmar auth, ownership, status e DTO;
- atualizar este step e a Spec 210 se o contrato divergir;
- confirmar testes backend de owner, nao-owner, interesse ausente e ativo.

### Step 210.4.2 - Exibir estado autoritativo

- Carregar oportunidade + interesse ativo.
- Mostrar `Manifestar interesse` somente sem interesse ativo.
- Mostrar `Cancelar interesse` somente com interesse `ATIVO`.
- Nao persistir estado.
- Reconsultar ao entrar e apos qualquer mutacao.
- Desabilitar acoes quando credora nao estiver `ATIVA/ELEGIVEL` ou oportunidade estiver
  `ENCERRADA`, mantendo o backend como autoridade final.

### Step 210.4.3 - Manifestar interesse

- Confirmacao explicita antes do POST.
- Bloquear duplo submit.
- `201`: reconsultar interesse e oportunidade.
- `409`: reconsultar estado autoritativo; nao assumir sucesso apenas pelo codigo.
- `422`: informar inelegibilidade/indisponibilidade sem alterar estado local.
- `404`: mensagem neutra e retorno seguro.
- rede/5xx: nunca assumir interesse registrado.
- Nao iniciar step-up.

### Step 210.4.4 - Cancelar interesse

- Confirmacao explicita antes do DELETE.
- Bloquear duplo submit.
- `204`: reconsultar estado.
- `404`: reconsultar; pode significar interesse ja ausente ou recurso indisponivel.
- rede/5xx: nunca assumir cancelamento.
- Cancelar dialog nao chama API.

Copy obrigatoria:
- interesse registra intencao;
- nao representa aporte, reserva, matching, alocacao ou operacao de carteira;
- associacao de carteira e assistida e ocorre fora do mobile.

### Step 210.4.5 - Testar interesse

Cobrir:
- estado sem/com interesse;
- manifestacao `201`;
- duplicidade `409`;
- inelegibilidade `422`;
- cancelamento `204`;
- cancelamento concorrente `404`;
- `404` de ownership neutro;
- rede/5xx;
- confirmacao cancelada;
- duplo submit;
- nenhuma chamada/consumo de step-up;
- reentrada/reload usa leitura autoritativa.

```bash
npm run test -- --run src/app/core/credores
npm run test -- --run src/app/features/credora/oportunidades
npm run lint
npm run lint:scss
npm run format:check
npm run build
```

### Definicao de pronto da Task M-10.4

- [ ] Gate I1 resolvido e documentado.
- [ ] Estado de interesse vem do backend.
- [ ] Manifestacao/cancelamento exigem confirmacao e bloqueiam duplo submit.
- [ ] Erros nunca viram sucesso presumido.
- [ ] UI nao promete aporte/carteira automatica.
- [ ] Testes e gates passam.

### Commit sugerido

```text
feat(mobile): implementar interesse em oportunidades
```

---

## Task M-10.5 - Carteira simplificada

**Objetivo**: apresentar operacoes financiadas e resumo agregado de cobranca sem expor operacao
interna ou recalcular indicadores.

**Arquivos esperados**:
- `src/app/features/credora/carteira/portfolio-list.component.*`;
- `src/app/features/credora/carteira/portfolio-detail.component.*`;
- testes correspondentes.

### Step 210.5.1 - Implementar lista

- Consumir `GET /credores/carteira`.
- Exibir status, valor/prazo/taxa quando presentes e data de associacao.
- Tratar campos nullable como "Nao informado", sem zero artificial.
- Lista vazia explica que interesse nao gera carteira automaticamente.
- Loading, erro+retry e pull-to-refresh.
- Nao paginar localmente.
- Nao somar valores para criar "total aportado".

### Step 210.5.2 - Implementar detalhe

- Consumir `GET /credores/carteira/{id}`.
- Exibir termos do snapshot, status contratual e resumo de cobranca quando presentes.
- Apresentar diretamente `parcelasPagas`, `parcelasAtrasadas`, `totalRecebido` e
  `proximoVencimento`; nao recalcular saldo ou inadimplencia.
- Nao exibir `justificativa` operacional no recorte simplificado.
- Nao exibir IDs de contrato/oportunidade.
- `404` neutro para recurso inexistente/alheio.
- Reconsultar ao entrar/reentrar; sem polling.

### Step 210.5.3 - Testar carteira

Cobrir:
- lista com itens e vazia;
- campos nullable;
- operacao ASSOCIADA/ENCERRADA;
- cobranca presente/ausente;
- agregados exibidos sem recalculo;
- `404`, rede e retry;
- IDs/justificativa/dados do tomador ausentes do DOM;
- resposta obsoleta descartada;
- 320 px e tema escuro.

```bash
npm run test -- --run src/app/features/credora/carteira
npm run lint
npm run lint:scss
npm run format:check
npm run build
```

### Definicao de pronto da Task M-10.5

- [ ] Lista e detalhe usam o DTO enriquecido real.
- [ ] Campos opcionais nao viram zero inventado.
- [ ] Nenhum total/status financeiro foi recalculado.
- [ ] Dados internos e do tomador nao aparecem.
- [ ] Testes e gates passam.

### Commit sugerido

```text
feat(mobile): implementar carteira simplificada da credora
```

---

## Task M-10.6 - Rotas, tab, guard, MSW, smoke e fechamento

**Objetivo**: integrar a jornada ao shell com acesso correto, consolidar mocks/testes e fechar
documentacao.

### Step 210.6.1 - Criar rotas lazy

Rotas:

```text
/app/credora/inicio
/app/credora/perfil
/app/credora/oportunidades
/app/credora/oportunidades/:oportunidadeId
/app/credora/carteira
/app/credora/carteira/:operacaoId
```

Regras:
- parent autenticado pelo `authGuard` existente;
- todas as rotas credora protegidas por guard de presenca;
- `data.tab = 'credora'`;
- sem `roles: ['CREDORA']`;
- IDs apenas como localizadores;
- nenhuma rota ADMIN/cadastro/KYB.

Guard:
- `200 /me`: libera e popula contexto;
- `404`: bloqueia e redireciona para superficie neutra;
- rede/5xx: nao marca usuario como "nao credora"; permite retry controlado;
- nao cria loop de navegacao/chamada.

### Step 210.6.2 - Integrar tab Credora

- Adicionar uma unica tab `Credora` para usuario com credora presente.
- Manter tabs do tomador quando o mesmo usuario tambem for `CLIENTE`.
- Enquanto presenca e desconhecida/carregando, nao piscar tab indevida.
- Ausencia/erro nao exibe tab como se acesso estivesse confirmado.
- Limpar tab/contexto no logout/troca de usuario.
- Atalhos internos da home cobrem perfil, oportunidades e carteira.

### Step 210.6.3 - Adicionar MSW

Seeds:
- usuario credora autenticado com role existente (`CLIENTE`), nunca `CREDORA`;
- `GET /me` presente e ausente;
- elegibilidade ELEGIVEL/PENDENTE/INELEGIVEL;
- oportunidades disponiveis/encerradas;
- interesse ativo/ausente conforme contrato I1;
- mutacoes POST/DELETE com estado observavel;
- carteira vazia e com operacoes/cobranca agregada;
- ownership/404 e erros 409/422.

Regras:
- estado reseedavel por teste;
- nao incluir CPF/CNPJ cru, dado bancario, chave Pix, payload de provider ou tomador;
- nao criar handlers dos endpoints ADMIN para a jornada;
- mocks nao quebram smokes anteriores.

### Step 210.6.4 - Completar Vitest

Cobertura minima:
- service/DTOs/contexto;
- guard e tab condicional;
- dashboard/perfil/elegibilidade;
- oportunidades/detalhe;
- interesse/cancelamento, se I1 resolvido;
- carteira/detalhe;
- estados loading/vazio/erro/retry;
- concorrencia e reentrada Ionic;
- assercoes negativas de dados/operacoes internas.

### Step 210.6.5 - Criar smoke Playwright PWA

Fluxo principal:

```text
login usuario com credora
  -> tab Credora
  -> dashboard/perfil/elegibilidade
  -> oportunidades
  -> detalhe
  -> manifestar/cancelar interesse
  -> carteira
  -> detalhe da operacao
```

Fluxos adicionais:
- tomador sem credora nao ve tab e nao acessa rota direta;
- credora inelegivel nao manifesta interesse;
- carteira vazia;
- viewport Pixel 5 e largura 320 px;
- tema escuro nas superficies principais.

Assercoes negativas:
- sem endpoints/acoes ADMIN;
- sem aporte/Pix/escrow;
- sem dados do tomador;
- sem IDs internos ou justificativa operacional no DOM;
- sem dados financeiros/credora/interesse em storage.

### Step 210.6.6 - Rodar suite final

```bash
cd <sep-mobile-root>
npm run lint
npm run lint:scss
npm run format:check
npm run test
npm run build
npx playwright test e2e/smoke.spec.ts e2e/onboarding-mobile.spec.ts e2e/credito-mobile.spec.ts e2e/formalizacao-mobile.spec.ts e2e/cobranca-mobile.spec.ts e2e/credora-mobile.spec.ts
```

### Step 210.6.7 - Atualizar documentacao

Atualizar no mesmo ciclo:
- `repos/sep-mobile/README.md`;
- Spec 210 e este step com status real/gaps;
- `docs-sep/PRD-FASE-3.md`;
- `docs-sep/CONTEXT-PARTE-2.md`;
- `AI-ROADMAP.md`;
- `repos/sep-mobile/SPRINT-M-10-PR.md`.

Se I1 exigir backend:
- atualizar `repos/sep-api/CREDORES.md`, OpenAPI/collection, spec/step backend e roadmap no
  trabalho backend correspondente;
- nao declarar M-10 concluida antes do contrato integrado.

### Step 210.6.8 - Checkpoint final

Apresentar:
- `git status --short --branch`;
- `git diff --stat`;
- arquivos criados/modificados/removidos;
- testes/build/lint/smokes e resultados;
- estado do Gate I1;
- riscos/pendencias;
- mensagem sugerida.

Aguardar aprovacao antes de staging/commit. Push e PR continuam manuais.

### Definicao de pronto da Task M-10.6

- [ ] Rotas protegidas por auth + presenca, sem role inventada.
- [ ] Tab Credora aparece somente apos presenca confirmada.
- [ ] MSW e Vitest cobrem contratos/estados.
- [ ] Smoke credora e regressao anterior passam.
- [ ] 320 px e tema escuro validados.
- [ ] Docs e PR temporario atualizados.
- [ ] Checkpoint final apresentado.

### Commit sugerido

```text
test(mobile): consolidar jornada credora
```

## Definition of Done da M-Sprint 10

- [ ] Empresa credora autenticada acessa apenas os proprios dados.
- [ ] Usuario sem credora nao ve tab nem acessa as rotas da jornada.
- [ ] Nenhuma role `CREDORA` foi inventada.
- [ ] Perfil/elegibilidade refletem snapshots backend.
- [ ] Oportunidades e carteira nao possuem regra financeira local.
- [ ] Interesse ativo possui leitura autoritativa; Gate I1 fechado.
- [ ] Manifestacao/cancelamento sao explicitos e nao viram sucesso presumido.
- [ ] UI deixa claro que interesse nao gera aporte/carteira automaticamente.
- [ ] Nenhum endpoint ADMIN/cadastro e exposto.
- [ ] Nenhum dado sensivel, financeiro ou de interesse e persistido localmente.
- [ ] New Design System SEP funciona em tema claro/escuro e 320 px.
- [ ] Lint, SCSS, format, Vitest, build AOT e smokes passam.
- [ ] Documentacao e PR temporario refletem a implementacao real.

## Checklist de code review da M-Sprint 10

### Contratos e arquitetura

- [ ] DTOs espelham JSON real e nullability.
- [ ] Components chamam `CredoraMobileService`; nao acessam `HttpClient`.
- [ ] Guard usa presenca `/me`, nao role inexistente.
- [ ] Nenhum endpoint ADMIN/cadastro foi adicionado.
- [ ] Listas nao ganharam paginacao/cache ficticio.

### Seguranca e regulatorio

- [ ] Ownership permanece no backend.
- [ ] `404` de detalhe nao enumera recurso alheio.
- [ ] Elegibilidade e interesse nao sao inferidos localmente.
- [ ] Dados do tomador, provider, escrow e auditoria nao aparecem.
- [ ] Nenhum snapshot financeiro e persistido.
- [ ] Nenhum step-up e anexado/consumido.

### UX e acessibilidade

- [ ] Status possuem texto, nao apenas cor.
- [ ] Loading, vazio, erro e retry existem por superficie.
- [ ] Confirmacoes e duplo submit cobrem as mutacoes.
- [ ] Copy nao promete aporte, matching ou carteira automatica.
- [ ] Foco, toque, contraste, tema escuro e 320 px validados.

### Testes e fechamento

- [ ] Guard/tab cobrem credora presente, ausente e erro tecnico.
- [ ] Service e componentes cobrem 404/409/422.
- [ ] Gate I1 possui teste de reload/reentrada.
- [ ] Smoke credora e smokes anteriores passam.
- [ ] Build AOT executado.
- [ ] Docs refletem somente comportamento entregue.
