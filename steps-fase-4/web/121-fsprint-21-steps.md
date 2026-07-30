# Steps - F-Sprint 21 - Jornada de conta bloqueada no login web

**Spec de origem**: [`121-fsprint-21-lockout-login-web.md`](../../specs/fase-4/121-fsprint-21-lockout-login-web.md)

**Status**: **MERGEADA develop+main** (2026-07-30, PR #113 squash `b3e3f90` + PR #114 `84eb47c`).
Gate F-21.0 e Tasks F-21.1 a F-21.4 executadas, cada uma com code review de subagente e hotfix
pos-review; review manual do usuario sem findings. Smoke real contra `:8080` aprovado no criterio
final (com a Sprint 33 integrada). Detalhe em [`SPRINT-F-21-PR.md`](../../repos/sep-app/SPRINT-F-21-PR.md).

**Sprint irma**: [`033`](../backend/033-sprint-33-steps.md) (Sprint backend 33 - conformidade da
politica de lockout, branch `feature/sprint-33-lockout-conformidade`). Ela eleva o rate limit acima do
limiar de lockout e alinha a politica a regra documentada. **As duas sao independentes para
implementar**; so o smoke real contra `:8080` (Step 121.4.3) exige as duas integradas.

**Objetivo geral**: corrigir a jornada de conta bloqueada no login web. O login passa a mapear cada
HTTP status para a mensagem correta, `/account-locked` passa a informar o prazo real (30 minutos,
desbloqueio automatico) e o mock MSW passa a produzir `423`, tornando a jornada verificavel em
dev-offline, Vitest e Playwright. Limiar, janela e desbloqueio permanecem autoritativos no `sep-api`.

**Esforco total estimado**: 1-1,5 dia de Dev Pleno Frontend.

**Repos de destino**:

- `sep-app`: componente de login, componente de conta bloqueada, mock MSW, specs Vitest, smoke
  Playwright e contrato consumido.
- `docs-SEP`: spec, steps, indices e PR description; toda operacao Git permanece manual.

**Branch**: `feature/fsprint-21-lockout-login-web` (criada de `develop` em `bffb6c8`, que ja contem a
F-Sprint 20 `66b5f04` e o merge `main -> develop`).

## Contratos backend consumidos

### `POST /api/v1/auth/login` — respostas de erro

```http
200 -> TokenResponse
400 -> ErrorResponseDto   validacao de payload
401 -> ErrorResponseDto   "Autenticacao requerida"  (senha errada OU usuario inexistente)
423 -> ErrorResponseDto   "Conta bloqueada temporariamente. Tente novamente em 30 minutos."
429 -> ErrorResponseDto   "Limite de requisicoes excedido. Aguarde antes de tentar novamente."
```

- Corpo de erro sempre `{ timestamp, status, error, message, path, traceId? }`. **Nao existe campo de
  codigo, nem `tentativasRestantes`, nem `bloqueadoAte`, nem header `Retry-After`.** O
  `ContaBloqueadaException.CODIGO = "AUTH-423-001"` existe apenas em Java e nunca e serializado.
  **O HTTP status e o unico discriminador no fio.**
- `401` e identico para senha errada e usuario inexistente (evita enumeracao de usuarios).
- Politica de lockout (`LockoutProperties`, `application.yml`): `max-attempts=5`,
  `window-minutes=15`, `lockout-minutes=30`. **Nao ha endpoint de unlock**; o desbloqueio e por
  expiracao das falhas na janela.
- Rate limit (`RateLimitFilter`): **10** POSTs/min/IP em `/auth/login` e `/auth/totp/verify`, refresh
  de 1 minuto, resposta `429` com o mesmo `ErrorResponseDto`. Era 5 quando este step foi escrito; a
  Sprint 33 elevou para 10 com a invariante `rate-limit > max-attempts` comentada no `application.yml`
  — com ambos em 5, o `429` mascarava o `423`.

### Ordem de avaliacao no backend (define o comportamento do mock)

`AutenticarUsuarioUseCase.executar` chama `lockoutService.verificar(username)` **antes** de buscar o
usuario e antes de registrar a tentativa. Consequencias que o mock precisa reproduzir:

| Tentativa | Backend | Status |
|-----------|---------|--------|
| 1-4 | `verificar()` passa; registra falha | `401` |
| 5 | `verificar()` ve 4 falhas e passa; registra a 5a — **conta trancada** | `401` |
| 6 | `verificar()` ve 5 falhas | `423` |

- **A 5a senha errada ainda responde `401`.** Um teste escrito como "5 cliques -> redirect" so
  passaria com o mock mentindo sobre o backend.
- **Senha correta apos o bloqueio ainda responde `423`**, porque a credencial nem chega a ser
  avaliada.
- **Login com sucesso nao zera o contador**: `estaBloqueada` apenas conta falhas na janela; nao ha
  reset em `LockoutService`.

> **Nota de contrato — RESOLVIDA na execucao (2026-07-30).** O step previa registrar `423`/`429` em
> `knownGaps` como divida do backend. Nao foi preciso: a Sprint 33 ja estava integrada em `develop`
> quando a Task F-21.4 rodou, entao seguiu-se a instrucao do proprio Step 121.4.2 ("se a Sprint 33 for
> integrada antes desta Task, pular o Step inteiro e apenas renovar o snapshot"). O snapshot foi
> renovado de `7f40056` para `a613c6c`; a diferenca semantica e de exatamente 4 adicoes — `423` e
> `429` em `/auth/login` e `/auth/totp/verify`. **Nenhuma entrada de `knownGaps` foi criada** e
> `contract:check` produz saida identica ao baseline.

## Decisoes da sprint

- **A navegacao do `423` fica exclusivamente no `errorInterceptor`.** O `LoginComponent` apenas mapeia
  status para mensagem. Motivos: (a) sete arquivos do `sep-app` ja afirmam esse contrato
  textualmente (`credito-error.ts`, `pix-format.ts`, `onboarding-error.ts`, `cobranca-format.ts`,
  `backoffice-format.ts`, `formalizacao-format.ts`, `credora-format.ts`: *"401/403/423 sao tratados
  pelo errorInterceptor global"*); (b) o `423` tambem vem de `/auth/totp/verify`, entao a duplicacao
  se espalharia; (c) o interceptor faz `clearSession()` junto, e uma copia no componente ou duplica
  isso ou deixa sessao pela metade. O `sep-mobile` trata no componente porque **la nao existe** esse
  redirect no interceptor — arquitetura diferente, nao precedente a importar.
- **A mensagem de `423` no componente e fallback defensivo, nao caminho normal.** Se a navegacao for
  cancelada (guard futuro), o usuario nao pode ficar lendo "senha invalida". No fluxo normal o
  componente ja foi destruido antes de renderizar. **Comentar isso no codigo** para nao ser
  "limpado" numa revisao futura.
- **`/account-locked` usa copy estatica, nao a `message` do servidor.** O interceptor navega e
  descarta o `HttpErrorResponse`; propagar a mensagem exigiria store novo (abstracao especulativa
  para um caso). A pagina tambem e alcancavel por URL direta e por `423` de qualquer endpoint, onde
  nao ha mensagem alguma. E a string do backend nao esta no snapshot OpenAPI: nao e contrato.
- **O mock MSW nao simula o `429`.** Um limitador fiel e um token bucket por wall-clock (5 permits,
  refresh de 1 min): tornaria Vitest e Playwright sensiveis a tempo — classe de flakiness que este
  repo evita — e, pior, **reproduziria o proprio bug**, escondendo `/account-locked` de todo teste. O
  `429` e coberto por override `server.use(...)` pontual no spec do login, que e exatamente o escopo
  de responsabilidade do frontend.
- **Fidelidade do mock e deliberada, nao conveniencia**: checar bloqueio antes da credencial, sucesso
  nao zerar contador, `401` na 5a e `423` na 6a. Cada escolha rastreia uma linha do `sep-api`.
- Estado de mock exige reset por spec (`resetLoginMockState`), no padrao de `resetPixState` /
  `resetChavesPixState` / `resetGovernancaState`. **Vitest isola modulos por arquivo, nao por teste**:
  sem reset, o contador acumula e um teste nao relacionado acaba navegando para `/account-locked` no
  6o caso do arquivo.

## Fora de escopo

- Alterar `sep-api` (`RateLimitFilter`, `LockoutService`, `application.yml`) — escopo da Sprint
  backend [`033`](../backend/033-sprint-33-steps.md) — ou `sep-mobile`.
- Contar tentativas, prever bloqueio ou exibir tentativas restantes no frontend.
- Ecoar a `message` do servidor na tela de bloqueio.
- Simular `429` no mock MSW.
- Estender `contract-check.mjs` para validar status de erro — e feature de checker, nao correcao de
  defeito.
- Corrigir o callback de erro pelado de `verify-totp.component.ts` (mesma classe de defeito;
  follow-up).
- Refactor do fluxo TOTP/step-up, do shell, dos interceptors ou do design system.

## Protocolo obrigatorio por Task

1. Executar somente a Task liberada pelo usuario.
2. Confirmar codigo e contrato atuais antes de editar.
3. Implementar a menor mudanca coerente com a spec e este step.
4. Escrever/ajustar teste observavel para o comportamento alterado.
5. **Verificar cada teste novo por mutacao** antes de declara-lo pronto (ver abaixo).
6. Rodar verificacoes proporcionais ao risco.
7. Parar em checkpoint pre-commit com arquivos, testes, riscos e mensagem sugerida.
8. Aguardar aprovacao antes de `git add`/`git commit`; usar somente paths especificos.
9. Nao iniciar a Task seguinte sem ordem explicita.

**Skills obrigatorias durante a implementacao**:

- `coding-guidelines`: suposicoes explicitas, simplicidade, mudancas cirurgicas e verificacao.
- `clean-code`: nomes intencionais, funcao pura focada, testes legiveis.
- `clean-architecture`: componente orquestra UI; regra de seguranca fica no backend; o mapeamento de
  status e traducao de borda, nao regra de negocio.
- `sep-web-mutation-verified-testing`: **obrigatoria nesta sprint**. Na F-Sprint 20 houve teste verde
  provando nada; aqui todo teste novo cobre codigo de seguranca e precisa falhar quando o codigo que
  ele alega cobrir e mutado.

## Rastreabilidade spec 121 -> steps

| Task da spec 121 | Steps |
|------------------|-------|
| 1. Mock MSW stateful + reset + teste de limiar | F-21.1 |
| 2. Mapeamento de status no login + specs do `423` | F-21.2 |
| 3. Copy de `/account-locked` + spec do componente | F-21.3 |
| 4. Playwright + `knownGaps` + docs + fechamento | F-21.4 |
| Gates de cadeia, baseline e contrato de erro | F-21.0 |

## Ordem de execucao

```text
F-21.0 prechecks + baseline + confirmacao da ordem de avaliacao no sep-api
  -> F-21.1 mock MSW com lockout (destrava todo o resto)
  -> F-21.2 login mapeia status + spec do 423 no interceptor + rewire do spec do login
  -> F-21.3 copy de /account-locked + spec nova do componente
  -> F-21.4 smoke Playwright, knownGaps, docs e fechamento
```

---

## Gate F-21.0 - Prechecks, baseline e contrato de erro

**Objetivo**: confirmar cadeia Git, baseline verde e a ordem real de avaliacao no backend antes de
escrever qualquer mock.

### Step 121.0.1 - Confirmar cadeia Git do `sep-app`

```bash
cd <sep-app-root>
git fetch --all --prune
git status --short --branch
git rev-list --left-right --count origin/main...origin/develop
```

**Verificacao**:

- F-Sprint 20 (`66b5f04`) presente em `origin/develop`.
- `main` integrada em `develop`.
- Branch `feature/fsprint-21-lockout-login-web` criada de `develop`. **Ja executado em 2026-07-29**
  (base `bffb6c8`).

### Step 121.0.2 - Rodar baseline

```bash
npm ci
npm run lint && npm run contract:check && npm run test && npm run build
npm run e2e
```

Registrar os numeros de partida: Vitest **664**, Playwright **36**, `contract:check` sem divergencia
real, `npm audit` 0. Qualquer vermelho preexistente e anotado antes de editar, nunca corrigido de
carona.

### Step 121.0.3 - Reconfirmar a ordem de avaliacao no `sep-api` (somente leitura)

Confirmar em `identity/application/usecase/AutenticarUsuarioUseCase.java` que
`lockoutService.verificar()` roda **antes** do `findByUsername` e do registro da tentativa, e em
`identity/application/service/LockoutService.java` o limiar e as janelas. Confirmar em
`infrastructure/security/RateLimitFilter.java` o limite de 5/min/IP.

**Por que e gate e nao task**: o mock da F-21.1 so pode espelhar o que o backend faz. Se esta ordem
mudou desde 2026-07-29, o desenho do mock e dos testes muda junto e a spec precisa ser revista antes
de codar.

### Step 121.0.4 - Reproduzir o defeito contra `:8080`

Com o `sep-api` local no ar e o front em `ng serve` (configuracao `development`, `useMsw: false`):
5 senhas erradas, depois uma 6a tentativa imediata. **Esperado hoje** (backend sem a Sprint 33): a 6a
responde `429` e a tela exibe `E-mail ou senha invalidos.` Esperar ~1 minuto e tentar de novo:
responde `423` e redireciona. Registrar o resultado — e o baseline do smoke final.

Se a Sprint backend 33 ja estiver integrada em `develop` no momento do gate, o esperado muda: a 6a
tentativa imediata responde `423`. Anotar qual dos dois cenarios foi observado, porque isso muda o
criterio do Step 121.4.3.

### Definicao de pronto do Gate F-21.0

- [ ] Cadeia Git conferida e branch criada de `develop` atualizado.
- [ ] Baseline verde com numeros registrados.
- [ ] Ordem de avaliacao do backend reconfirmada em codigo.
- [ ] Defeito reproduzido contra `:8080` e comportamento anotado.

---

## Task F-21.1 - Mock MSW com lockout

**Objetivo**: tornar `423` e `/account-locked` alcancaveis offline, em Vitest e em Playwright.
Sem isto nada mais e testavel.

**Pre-requisito**: Gate F-21.0 concluido.

**Esforco**: 0,25 dia.

**Arquivos esperados**:

- `src/mocks/handlers.ts`.
- `src/app/core/auth/auth.service.spec.ts`.

### Step 121.1.1 - Adicionar estado de lockout ao mock

Apos a declaracao de `currentMockUser`, no padrao dos `reset*State` existentes:

```text
LOCKOUT_MAX_TENTATIVAS = 5
LOCKOUT_MINUTOS = 30
falhasDeLoginPorUsuario: Map<string, number>
export function resetLoginMockState(): void
```

Comentar a origem: espelha `LockoutService` + `LockoutProperties` do `sep-api`.

> **Desvio aplicado (2026-07-30, pos-review).** O nome planejado era `resetLoginLockoutState`, mas o
> reset precisou cobrir tambem `currentMockUser` — sem isso um login valido de uma spec vazava para
> as specs de `/auth/me` do mesmo arquivo, e o teste de escopo por usuario tinha sido **enfraquecido**
> para contornar a limitacao. Nome final: `resetLoginMockState`. `Map` em vez de `Record` pelo
> precedente do proprio arquivo (`chavePixPorKey`, `desembolsoPorChave`) e para tirar do caminho
> chaves herdadas de `Object.prototype`.

### Step 121.1.2 - Reescrever o handler de `POST /auth/login`

Ordem obrigatoria, espelhando `AutenticarUsuarioUseCase`:

1. **Checar bloqueio primeiro**: `>= LOCKOUT_MAX_TENTATIVAS` falhas -> `423` com a mensagem do
   backend. Nao avaliar credencial neste ramo.
2. Validar credencial. Falha incrementa o contador do usuario e responde `401`.
3. Sucesso define `currentMockUser` e responde `200`. **Nao zerar o contador** — o backend nao zera.

> **Correcao factual (2026-07-30, Gate 121.0.3).** A versao original deste step afirmava que
> "usuario inexistente tambem incrementa, porque `USUARIO_INEXISTENTE` conta no backend". **E falso.**
> `LockoutService.STATUSES_FALHA` e `[SENHA_INVALIDA, TOTP_INVALIDO]` — nem hoje nem antes da
> Sprint 33 (conferido em `406eef8`, que tinha `[SENHA_INVALIDA, TOTP_INVALIDO, CONTA_BLOQUEADA]`).
> Verificado no fio contra `:8080`: 6 falhas de username inexistente devolvem 6x `401` e gravam 6
> linhas `USUARIO_INEXISTENTE`, nenhuma contada. Um username desconhecido **nunca tranca**.
>
> **Decisao do dono do repo (2026-07-30)**: mesmo assim o mock incrementa para qualquer credencial
> recusada, inclusive username desconhecido, vazio ou fora do formato e-mail (estes dois ultimos o
> backend rejeita com `400` por bean validation, antes do use case). O mock fica **mais estrito** que
> a producao; a assimetria e segura (falha offline, passa em producao — nunca o contrario) e mantem
> `/account-locked` alcancavel offline com qualquer e-mail. A divergencia esta comentada no
> `handlers.ts` e travada por teste, para nao ser "corrigida" em silencio.

### Step 121.1.3 - Evitar vazamento de estado entre specs

Adicionar `beforeEach(() => resetLoginMockState())` em `auth.service.spec.ts` — o teste de login
invalido que ja existe passa a incrementar o contador. Mesmo motivo dos resets em
`pix.service.spec.ts` e `chaves-pix-page.component.spec.ts`.

### Step 121.1.4 - Fixar o limiar por teste

Teste novo no `auth.service.spec.ts`: 5 chamadas com credencial invalida devolvem `401`; a **6a**
devolve `error.status === 423`. E o lugar mais barato de travar o limiar, sem DOM.

```bash
npm run test -- --run src/app/core/auth/auth.service.spec.ts
npm run test
```

**Verificacao por mutacao**: trocar `>=` por `>` na checagem de bloqueio -> o teste deve falhar.
Mover a checagem de bloqueio para depois da validacao de credencial -> o caso "senha correta apos
bloqueio ainda da 423" deve falhar.

### Definicao de pronto da Task F-21.1

- [ ] Mock devolve `401` ate a 5a falha e `423` a partir da 6a, por usuario.
- [ ] Bloqueio verificado antes da credencial; sucesso nao zera o contador.
- [ ] `resetLoginMockState` exportado e usado em `auth.service.spec.ts`.
- [ ] Suite completa verde, sem vazamento de contador entre arquivos.

### Commit sugerido

```text
test(web): simular lockout de conta no mock de login
```

---

## Task F-21.2 - Login mapeia status para mensagem

**Objetivo**: o login para de reportar bloqueio, rate limit e falha de rede como senha invalida.

**Pre-requisito**: Task F-21.1 concluida e aprovada.

**Esforco**: 0,5 dia.

**Arquivos esperados**:

- `src/app/features/public/login/login.component.ts` e `login.component.spec.ts`.
- `src/app/core/interceptors/error.interceptor.spec.ts`.

### Step 121.2.1 - Mapear status para mensagem

Substituir o callback de erro vazio por um que consulte uma **funcao pura local** (sem arquivo novo,
sem abstracao) com `switch` sobre `HttpErrorResponse.status`:

```text
400     -> dados invalidos
401     -> e-mail ou senha invalidos
423     -> conta bloqueada, 30 minutos        (fallback defensivo; ver Decisoes)
429     -> muitas tentativas, aguarde ~1 min  (rate limit por IP, NAO e o lockout)
default -> generica  (inclui status 0: rede/CORS)
```

`status === 0` cair no `default` e requisito, nao detalhe: falha de rede jamais pode ser reportada
como senha invalida.

**Nao adicionar navegacao no componente.** Comentar por que a mensagem de `423` existe mesmo assim.
O template nao muda — ja renderiza `errorMessage()` em `role="alert"`.

### Step 121.2.2 - Cobrir o `423` no `errorInterceptor`

Dois casos novos em `error.interceptor.spec.ts`, reusando o harness `makeNext` existente:

- `423` em `/auth/login`: limpa sessao (token removido, `currentUser()` nulo) **e** navega para
  `/account-locked`.
- O erro **continua propagando** apos o redirect, para a tela poder renderizar o fallback.

**Verificacao por mutacao** (obrigatoria): remover o bloco `if (error.status === 423)` -> ambos
falham. Trocar por `error.status === 423 && !req.url.includes('/auth/login')` — o "fix" plausivel e
errado, copiado da linha do `401` — -> o primeiro caso deve falhar. Se sobreviver, o teste nao prova
nada sobre login.

### Step 121.2.3 - Rewire do spec do login

Hoje `login.component.spec.ts` usa `provideHttpClient()` pelado: **nenhum interceptor na cadeia**,
entao um `423` nunca redirecionaria neste spec. Trocar por um `setup(comInterceptors)` no molde de
`reprocessos-page.component.spec.ts`, usando `provideHttpClient(withInterceptors([errorInterceptor]))`
no ramo com interceptor, e stubar `router.navigateByUrl` como o teste ja existente faz.

Manter `provideRouter([])` **sem** rota `account-locked`: registrar a rota real deixaria uma
navegacao de verdade acontecer e mascararia stub faltando.

Casos: `423` com interceptor -> navegou para `/account-locked`; `423` sem interceptor -> mensagem de
bloqueio (prova que o mapeamento independe do redirect); `429` -> orientacao de aguardar ~1 minuto e
**ausencia** da copy de `401`; `400`; `HttpResponse.error()` -> generica e **ausencia** da copy de
`401`. Adicionar `beforeEach(() => resetLoginMockState())`.

```bash
npm run test -- --run src/app/core/interceptors/error.interceptor.spec.ts
npm run test -- --run src/app/features/public/login/login.component.spec.ts
npm run lint
```

**Verificacao por mutacao**: colapsar o `switch` de volta para a string unica -> os casos de `429`,
`400`, rede e `423`-sem-interceptor devem falhar. Remover `withInterceptors([errorInterceptor])` do
setup -> o caso de navegacao deve falhar; se sobreviver, o spec nao exercita o interceptor e e inutil
para este bug.

### Definicao de pronto da Task F-21.2

- [ ] Cinco superficies de mensagem distintas e corretas; rede nunca vira "senha invalida".
- [ ] Navegacao do `423` permanece so no interceptor, com teste que trava as duas mutacoes previstas.
- [ ] `login.component.spec.ts` exercita interceptors de verdade.
- [ ] Lint e suite verdes.

### Commit sugerido

```text
fix(web): distinguir bloqueio, rate limit e falha de rede no login
```

---

## Task F-21.3 - Copy de `/account-locked`

**Objetivo**: a pagina passa a informar o prazo e o mecanismo reais de desbloqueio.

**Pre-requisito**: Task F-21.2 concluida e aprovada.

**Esforco**: 0,25 dia.

**Arquivos esperados**:

- `src/app/features/public/account-locked/account-locked.component.ts`.
- `src/app/features/public/account-locked/account-locked.component.spec.ts` (novo).

### Step 121.3.1 - Corrigir a copy

Trocar `alguns minutos` por **30 minutos** e acrescentar que o desbloqueio e **automatico**, sem
liberacao manual — verificado: nao existe endpoint de unlock nem acao administrativa no `sep-api`; a
unica saida e a expiracao. Comentar a origem do numero
(`app.security.lockout.lockout-minutes`). Nao prometer botao de reenvio, suporte ou desbloqueio
assistido: nao existem.

Badge, heading e link "Voltar ao login" permanecem.

### Step 121.3.2 - Criar a spec do componente (nao existe hoje)

Molde `landing.component.spec.ts` (so `render` + `provideRouter([])`; o componente importa apenas
`RouterLink`). Casos: heading de conta bloqueada; presenca de `30 minutos`; desbloqueio automatico;
**ausencia** de `alguns minutos`; link "Voltar ao login" com `href="/login"`.

```bash
npm run test -- --run src/app/features/public/account-locked/account-locked.component.spec.ts
```

**Verificacao por mutacao**: restaurar a copy antiga -> os casos de `30 minutos` e de ausencia devem
falhar.

### Definicao de pronto da Task F-21.3

- [ ] Copy fiel ao backend: 30 minutos, desbloqueio automatico, sem promessa de acao manual.
- [ ] Spec nova cobrindo copy e link de volta, verificada por mutacao.

### Commit sugerido

```text
fix(web): informar prazo real de desbloqueio na tela de conta bloqueada
```

---

## Task F-21.4 - Smoke, contrato, docs e fechamento

**Objetivo**: provar a jornada ponta a ponta e registrar honestamente os limites da correcao.

**Pre-requisito**: Task F-21.3 concluida e aprovada.

**Esforco**: 0,25-0,5 dia.

**Arquivos esperados**:

- `e2e/account-locked.spec.ts` (novo).
- `contracts/consumed-contracts.json`.
- `docs-SEP`: `repos/sep-app/SPRINT-F-21-PR.md`, `AI-ROADMAP.md`, `specs/fase-4/README.md`,
  `docs-sep/STATE.md`, `docs-sep/CONTEXT-PARTE-2.md`, e remocao de `repos/sep-app/SPRINT-F-20-PR.md`.

### Step 121.4.1 - Smoke Playwright da jornada

Novo `e2e/account-locked.spec.ts`, ativando MSW como `golden-path.spec.ts` faz (necessario: `ng serve`
usa a configuracao `development`, com `useMsw: false`).

Roteiro: 5 submits com senha errada, assertando a mensagem de credencial a cada um; depois um 6o
submit **com a senha correta**, assertando `waitForURL(/\/account-locked/)`, o heading e `30 minutos`.
Opcional barato: clicar "Voltar ao login" e assertar `/login`.

Determinismo sem sleep: o botao e `[disabled]="loading()"` e o Playwright espera actionability, entao
os 6 cliques sao 6 requests sequenciais, sem sobreposicao. O estado do mock vive na pagina e
`fullyParallel` da contexto proprio a cada teste.

**O 6o submit e fiel ao backend, nao conveniencia**: `verificar()` roda antes do registro, entao a 5a
falha ainda e `401`. Escrever "5 cliques -> redirect" exigiria o mock mentir. Comentar isso no spec.

### Step 121.4.2 - Registrar a lacuna de contrato

Adicionar **uma** entrada em `knownGaps` do `consumed-contracts.json` (precedente
`X-Step-Up-Token`) registrando que `423`/`429` do `auth.login` nao estao documentados no OpenAPI, com
`followUp` apontando para a **Task 33.4** da Sprint backend 33 (que ja tem o trabalho previsto).
Marcar a entrada como **temporaria**: ao integrar a Sprint 33, renovar o snapshot OpenAPI e remover
a entrada. Se a Sprint 33 for integrada antes desta Task, **pular o Step inteiro** e apenas renovar o
snapshot.

Ser explicito na review: os helpers `existeGap*` filtram por quatro `kind` conhecidos, entao a
entrada e **dado inerte** — ledger de divida, nao mudanca de comportamento do checker. Confirmar que
`npm run contract:check` produz saida identica ao baseline.

### Step 121.4.3 - Smoke manual contra `:8080`

Repetir o Step 121.0.4 com a correcao aplicada. O criterio depende de a Sprint backend 33 estar ou
nao integrada no `sep-api` local:

- **Sem a Sprint 33**: 5 senhas erradas -> mensagem de credencial; 6a imediata -> mensagem de rate
  limit (nao mais "senha invalida"); apos ~1 minuto -> `423` -> `/account-locked` com "30 minutos".
  Resultado **parcial**, esperado e aceitavel — registrar como tal.
- **Com a Sprint 33**: 5 senhas erradas -> mensagem de credencial; **6a imediata -> `423` ->
  `/account-locked`**. Este e o criterio de aceite final da jornada.

Registrar no PR qual cenario foi executado. E o unico caminho que fecha o loop real; o e2e nao o
substitui.

### Step 121.4.4 - Docs e fechamento

- Criar `repos/sep-app/SPRINT-F-21-PR.md` e **remover** `repos/sep-app/SPRINT-F-20-PR.md` (ciclo
  padrao do `AGENT.md`). Confirmar antes que as mudancas documentais da F-20 ja foram commitadas pelo
  dev.
- Atualizar `AI-ROADMAP.md` e `specs/fase-4/README.md` no mesmo ciclo.
- Sobrescrever `docs-sep/STATE.md` e apender entrada curta em `docs-sep/CONTEXT-PARTE-2.md`.
- Referenciar a Sprint backend [`033`](../backend/033-sprint-33-steps.md), que absorve o que era
  follow-up backend (rate limit maior que `max-attempts`, `@ApiResponse` `423`/`429`, divergencia da
  janela de 15 x 30 minutos). Registrar apenas os follow-ups que continuam sem dono: `sep-mobile`
  (mock sem `423`) e `verify-totp.component.ts` com callback de erro pelado.

```bash
npm run format:check && npm run lint && npm run lint:scss
npm run contract:check && npm run test && npm run build
npm run e2e
npm audit --omit=dev
```

### Definicao de pronto da Task F-21.4

- [ ] Smoke Playwright cobre a jornada completa e passa.
- [ ] `knownGaps` registrado; `contract:check` com saida identica ao baseline.
- [ ] Smoke manual contra `:8080` executado e resultado registrado.
- [ ] Docs, roadmap, STATE e historico atualizados; `SPRINT-F-20-PR.md` removido.
- [ ] PR description declara o que a correcao **nao** resolve (429 na 6a rapida; e2e mais verde que
      a producao de proposito) e lista os follow-ups backend/mobile.

### Commit sugerido

```text
test(web): cobrir jornada de conta bloqueada no smoke e2e
```
