# Spec 122 - F-Sprint 22 - Contrato de erro verificavel e follow-ups da F-21 no web

## Metadados

- **ID da Spec**: 122
- **Titulo**: F-Sprint 22 - Tornar o contrato de erro verificavel em CI e quitar os follow-ups web
  que a F-Sprint 21 deixou registrados
- **Status**: planejada (criada em 2026-07-30)
- **Fase do produto**: Fase 4 - correcao de divida tecnica registrada; sem jornada de produto nova
- **Trilha**: Web (`sep-app`)
- **Origem**: follow-ups registrados pela F-Sprint 21
  ([`121`](./121-fsprint-21-lockout-login-web.md); historico em
  [`CONTEXT-PARTE-2.md`](../../docs-sep/CONTEXT-PARTE-2.md) §F-Sprint 21) e achados do code review
  dela. A frente de contrato vem da F-Sprint 19
  ([`119`](./119-fsprint-19-hardening-tooling-contrato-web.md)), que criou o `contract:check`
- **Depende de**: nada para as Tasks 1 a 5. A Task 6 **exige a Sprint 34
  ([`034`](./034-sprint-34-followups-lockout-contrato.md)) mergeada em `develop`** e o snapshot
  OpenAPI regenerado — sem o backend no ar nao ha como reexportar
- **Desbloqueia**: nada; e correcao de divida. O que ela entrega e o `423` deixar de poder sumir do
  backend sem ninguem perceber
- **Responsavel principal**: Devs Plenos Frontend

## Objetivo

Duas frentes independentes, ambas de divida:

1. **O contrato de erro nao e verificavel.** `consumed-contracts.json` declara todas as 85 operacoes
   com `"sucesso": [200]` e **nenhum status de erro**, e o `contract-check.mjs` so inspeciona status
   de sucesso. Se o backend removesse o `423` de `/auth/login`, o `contract:check` passaria verde e a
   jornada de conta bloqueada voltaria a quebrar em silencio — o mesmo modo de falha que originou o
   par corretivo 33/F-21. Alem disso o checker **nao detecta `knownGap` obsoleto**: os quatro
   predicados `existeGap*` sao `.some()` puros, entao um gap ja fechado fica no JSON para sempre,
   silenciando o que ja esta documentado. O `knownGaps[0]` (`X-Step-Up-Token`, `appliesTo: "*"`)
   produz sozinho **18 das 29 lacunas** do output atual — se ele ficar apos a Sprint 34, suprime a
   falha para qualquer operacao futura que envie o header.
2. **Follow-ups da F-21.** A correcao do login nao foi propagada: `verify-totp` tem exatamente o
   callback de erro pelado que o login tinha; `access-denied` e destino de redirect sem mover foco;
   `verify-totp` e `redirect-to-app` nao tem landmark; o `RegisterComponent` e codigo morto com 5
   testes verdes; e a extracao de mensagem de erro esta duplicada em 7 helpers.

## Decisao tecnica principal — declarar erro so onde ha ramo

O checker passa a validar status de erro, mas **preencher `erros` nas 85 operacoes seria cerimonia
sem assercao**: 83 delas usam o padrao `apiErr?.message ?? padrao`, que nao discrimina status. Declarar
`erros` ali nao protege nada e cria 83 pontos de manutencao.

**Decisao: declarar `erros` apenas onde o frontend faz ramo explicito por status.** Hoje isso e
`auth.login` (o `switch` de `mensagemDeErroDeLogin`) e, depois da Task 2, `mfa.totpVerify`. A regra
fica registrada no descriptor para as proximas sprints: *se a tela ramifica por status, o status entra
em `erros`*.

Para os headers, `responseHeaders` hoje e uma lista plana verificada **contra os status de sucesso**
(`verificarHeadersDaResposta` itera `operacao.sucesso`), o que torna o `Retry-After` — que so existe
em `423`/`429` — **inalcancavel pelo checker**. `responseHeaders` passa a ser mapa por status. A
migracao custa **uma linha de JSON**: so `contratos.documentoAssinado` usa o campo hoje.

**Sem ADR**: nao ha escolha estrutural nova; o checker ja existe desde a F-19 e a mudanca e de
cobertura, nao de arquitetura.

## Contratos backend consumidos

Nada muda nas Tasks 1 a 5. A Task 6 consome o que a Sprint 34 entrega:

```http
GET /api/v1/auth/politica-lockout      200 -> PoliticaLockoutResponse   (publico)
POST /api/v1/auth/login                423 -> Retry-After: <segundos restantes>
POST /api/v1/auth/login                429 -> Retry-After: <segundos ate o refresh>
POST /api/v1/auth/totp/verify          423 / 429 -> idem
```

```json
{ "maxAttempts": 5, "windowMinutes": 15, "lockoutMinutes": 30 }
```

Dois pontos de atencao verificados no levantamento:

- **`Retry-After` e `lockoutMinutes` nao sao a mesma coisa.** O header e o *tempo restante*; a
  politica e a *duracao nominal*. A copy honesta muda conforme a fonte: com o header da para dizer
  "tente novamente em ~12 minutos"; so com a politica, o correto continua sendo "ate 30 minutos,
  contados a partir da ultima tentativa".
- **O `clientChannelInterceptor` anexa `withCredentials: true` a toda URL sob `apiBaseUrl`**, entao a
  chamada ao endpoint publico sai com credenciais. Consequencia de CORS a sinalizar para a Sprint 34:
  o backend nao pode responder `Access-Control-Allow-Origin: *` nesse endpoint, precisa de
  `Access-Control-Allow-Credentials: true` com origem explicita.

### Autorizacao

Nenhuma mudanca. `GET /auth/politica-lockout` e publico e nao exige token — o `authInterceptor` ja
passa sem `Authorization` quando nao ha token (`if (!token || isLoginRequest) return next(req)`), entao
**nao ha mecanismo novo a criar** para chamadas pre-login.

## Escopo

### Em escopo

- `contract-check.mjs` passa a verificar status de erro declarados e a detectar `knownGap` obsoleto;
  `responseHeaders` vira mapa por status; casos novos em `contract-check.spec.ts`.
- `verify-totp` passa a traduzir erro por status, no padrao do `login.component.ts`, **com spec nova**
  (o componente nao tem nenhuma cobertura hoje: sem Vitest spec, sem e2e, sem handler MSW de TOTP).
- Foco no heading em `access-denied` (destino de redirect por `errorInterceptor` no `403` e pelo
  `roleGuard`); landmark `<main>` em `verify-totp` e `redirect-to-app`.
- Remover os 4 arquivos orfaos do `RegisterComponent` e o que fica orfao junto
  (`AuthService.register()` e a operacao `auth.registrar` do descriptor).
- Consolidar a extracao de mensagem da API num helper em `core/api/`, com spec propria — hoje o corpo
  identico de duas linhas esta em 7 helpers e reimplementado em 9 sites inline, e **nenhum deles tem
  teste unitario**.
- Dividas de teste da F-21: assert vacuo no `401` do `error.interceptor.spec.ts`, duplo submit no
  login, e o `5xx` atraves da cadeia real de interceptors.
- **[Task final, com gate]** Consumir `politica-lockout` e `Retry-After`; renovar o snapshot e apagar
  os `knownGaps` que a Sprint 34 fechar.

### Fora de escopo

- **Remover os links "Criar conta"** de `login.component.html` e `landing.component.html` (3
  ocorrencias). Eles **funcionam como projetado**: levam a `/register`, que carrega o
  `RedirectToAppComponent` ("Como cadastrar sua conta") por decisao da Sprint 5, e sao travados por
  `landing.component.spec.ts` e pelo e2e `golden-path.spec.ts`. O que e codigo morto e o
  `RegisterComponent`, nao a rota nem os links. **Follow-up de UX** (nao tecnico): o rotulo "Criar
  conta" promete formulario e entrega pagina informativa; o rotulo honesto seria "Como me cadastrar".
- Reativar auto-cadastro no web. `POST /api/v1/usuarios` e publico no backend, mas a jornada foi
  descontinuada na Sprint 5; reabrir exige decisao de produto com KYC/onboarding (CMN 4.656).
  **Follow-up**.
- Declarar `erros` nas 83 operacoes que nao ramificam por status — ver Decisao tecnica principal.
- Unificar `idCurto` (duplicado em 6 arquivos) e `formatarMoeda` (6 arquivos, **duas assinaturas
  diferentes**). E duplicacao real, mas a de `formatarMoeda` nao e trivial e quebraria call sites.
  **Follow-up**.
- Substituir as 56 chamadas dos 7 helpers por um nome unico (estrategia "C" do levantamento): 65
  pontos de churn mecanico que apagariam 7 comentarios especificos sobre quais status cada dominio
  trata localmente. A sprint mantem os helpers como alias com o comentario preservado.
- Propagar `Retry-After` ate `/account-locked` por store. O `errorInterceptor` navega e descarta o
  erro; a F-21 rejeitou o store como "abstracao especulativa para um caso", e a pagina e alcancavel
  por URL direta, onde nao ha header nenhum. A pagina usa o `politica-lockout`.
- Alterar `sep-api` ou `sep-mobile`. Os follow-ups mobile (mock sem `423`, race de duplo toque em
  `consultarStatusPix` — que existe em **dois** arquivos, nao um — e o smoke `golden-path-mobile`) sao
  trilha propria. **Follow-up: M-Sprint 17**.
- Rodar o Playwright no CI. Os 38 e2e sao locais/manuais hoje (`CI-APP` nao os executa); mudar isso e
  frente de tooling. **Follow-up**.

## Tasks de implementacao

1. `contract-check.mjs` verifica status de erro declarados e reporta `knownGap` obsoleto;
   `responseHeaders` por status; casos novos no spec do checker.
2. `verify-totp` traduz erro por status, com spec nova do componente.
3. Acessibilidade: foco no heading em `access-denied`; landmark em `verify-totp` e `redirect-to-app`.
4. Remover o `RegisterComponent` orfao e consolidar a extracao de mensagem em `core/api/`.
5. Dividas de teste da F-21 (assert vacuo do `401`, duplo submit, `5xx` na cadeia real).
6. **[gate: Sprint 34 em `develop` + snapshot regenerado]** Consumir `politica-lockout` e
   `Retry-After`; renovar snapshot e limpar `knownGaps`.

## Gates que nao contam como task

- Precheck da cadeia Git (`main` em `develop`, F-21 presente) e baseline verde: **Vitest 685 / 88
  arquivos**, **Playwright 38 / 11 arquivos**, `contract:check` com 85 operacoes e 29 lacunas
  conhecidas, lint/scss/format/build verdes, `npm audit --omit=dev` 0.
- **Destravar o Playwright na maquina de dev**: o pacote exige `chromium_headless_shell-1228` e o
  cache do usuario tem `1217`; `test-results/`, `playwright-report/` e `node_modules/.vite-temp` estao
  root-owned de execucao anterior. Sem isso o gate de baseline nao fecha.
- Confirmar, antes da Task 1, quais `knownGaps` a Sprint 34 ja fechou — muda o que resta declarar.
- Verificacao por mutacao de cada teste novo (skill `sep-web-mutation-verified-testing`); teste que
  sobrevive a mutacao do codigo que alega cobrir e considerado nao entregue.
- Smoke manual contra `:8080` para a Task 6, e PR description.

## Definition of Done

- Um status de erro declarado em `erros` e ausente do OpenAPI **falha** o `contract:check`, com
  controle positivo (status presente -> verde) travando que a verificacao roda de fato.
- Um header declarado para status de erro nao e exigido nos status de sucesso, com teste.
- `knownGap` que nao foi consumido por nenhuma operacao e reportado como obsoleto; um gap com
  `appliesTo: "*"` consumido por pelo menos uma operacao **nao** e falso positivo, com teste para os
  dois lados.
- Operacoes sem `erros` (as 83 restantes) continuam passando inalteradas, com teste de
  retrocompatibilidade.
- `verify-totp` exibe mensagem distinta para `400`, `401`, `423`, `429`, `5xx` e falha de rede;
  nenhuma delas acusa codigo invalido quando nao foi isso. A navegacao do `423` permanece exclusiva do
  `errorInterceptor`.
- `access-denied` move foco para o heading; `verify-totp` e `redirect-to-app` tem `<main>`; specs
  travam os tres.
- `RegisterComponent` e seus 4 arquivos removidos; suite verde sem eles; nenhum link da UI quebrado
  (os 3 links para `/register` continuam levando ao `RedirectToAppComponent`).
- Helper unico de extracao de mensagem em `core/api/` com spec propria (corpo com `message`, corpo
  ausente, corpo nao-objeto); os 7 helpers de dominio passam a delegar sem alterar call site.
- O assert do `401` no `error.interceptor.spec.ts` falha se o `clearSession()` for removido; ha teste
  de duplo submit provando que o no do `@if` e recriado; e o `5xx` e coberto pela cadeia real de
  interceptors, nao por texto escrito a mao.
- Vitest, Playwright, lint, SCSS lint, build e `contract:check` verdes; `npm audit --omit=dev` 0.
- **Task 6, se executada**: `/account-locked` exibe o prazo vindo do `politica-lockout` e continua
  funcional se a chamada falhar (a pagina e alcancavel por URL direta); o `423`/`429` do login usam o
  `Retry-After` quando presente; snapshot renovado e `knownGaps` fechados removidos.
- **Se a Sprint 34 nao estiver mergeada**: a sprint fecha sem a Task 6, registrando o motivo. As
  outras cinco nao dependem dela.
