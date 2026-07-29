# Spec 121 - F-Sprint 21 - Jornada de conta bloqueada no login web

## Metadados

- **ID da Spec**: 121
- **Titulo**: F-Sprint 21 - Correcao da jornada de conta bloqueada (lockout) no login web
- **Status**: planejada (2026-07-29)
- **Fase do produto**: Fase 4 - correcao de requisito da Sprint 5 (Fase 2) no recorte web
- **Trilha**: Web (`sep-app`)
- **Origem**: bug reportado pelo dev em 2026-07-29 contra o backend real `:8080` — apos 5 senhas
  erradas o front nao chega em `/account-locked`. Requisito original:
  [`005`](../fase-2/005-sprint-5-endurecimento-seguranca.md) Task 5.4/5.8 e
  [`SEGURANCA.md`](../../docs-sep/SEGURANCA.md) §5
- **Depende de**: nada para implementar (o mock MSW cobre a jornada). O **smoke real contra `:8080`**
  depende da Sprint backend [`033`](./033-sprint-33-lockout-conformidade.md) integrada em `develop` —
  sem ela o `423` continua mascarado pelo `429` em tentativas rapidas
- **Desbloqueia**: nada; e correcao de defeito
- **Responsavel principal**: Devs Plenos Frontend

## Objetivo

Fazer o login web **dizer a verdade** em cada resposta de erro do `POST /api/v1/auth/login` e tornar
a jornada de conta bloqueada verificavel por teste. Hoje o componente de login trata todos os erros
como credencial invalida, entao um usuario com a conta trancada e informado de que errou a senha; e o
mock MSW nunca produz `423`, o que deixa `/account-locked` inalcancavel em dev-offline, Vitest e
Playwright.

**Nao ha regra de negocio nova.** Limiar, janela, duracao e desbloqueio permanecem autoritativos no
`sep-api` (`LockoutService` + `LockoutProperties`); o frontend apenas reage ao HTTP status, que e o
**unico discriminador disponivel no fio** — o `ErrorResponseDto` nao carrega campo de codigo e o
`AUTH-423-001` existe somente em Java.

### Diagnostico que motiva a spec

O redirect `423 -> /account-locked` **ja existe** em `core/interceptors/error.interceptor.ts` e a rota
publica existe em `features/public/public.routes.ts`. O defeito tem duas causas independentes:

1. **`RateLimitFilter` mascara o lockout no backend.** O rate limit de login e de 5 POSTs/min/IP e o
   limiar de lockout tambem e 5 falhas. Como `AutenticarUsuarioUseCase.executar` chama
   `lockoutService.verificar()` **antes** de registrar a tentativa, a 5a senha errada ainda responde
   `401` (e tranca a conta) e a 6a requisicao — a primeira que responderia `423` — e barrada pelo
   filtro com `429`, sem chegar ao controller. Dentro do mesmo minuto o `423` e inalcancavel.
2. **O componente de login nao diferencia status.** O callback de erro e vazio: `400`, `401`, `423`,
   `429` e falha de rede renderizam a mesma frase `E-mail ou senha invalidos.`

Esta sprint corrige **a causa 2 e a testabilidade**. A **causa 1 e corrigida pela Sprint backend
[`033`](./033-sprint-33-lockout-conformidade.md)**, que eleva o rate limit acima do limiar de lockout
e alinha a politica a regra documentada. As duas sprints sao independentes para implementar; so o
smoke real contra `:8080` exige as duas.

## Escopo

### Em escopo

- Mapear `HttpErrorResponse.status` para mensagem correta no login (`400`, `401`, `423`, `429`,
  rede/desconhecido), sem mover a navegacao do `423` para o componente.
- Corrigir a copy de `/account-locked` para o comportamento real do backend: **30 minutos** e
  desbloqueio **automatico**, sem liberacao manual (nao existe endpoint de unlock no `sep-api`).
- Tornar o mock MSW de login **stateful** quanto a falhas por usuario, espelhando a ordem do backend,
  para que `423` e `/account-locked` sejam alcancaveis offline, em Vitest e em Playwright.
- Cobertura ausente hoje: caso `423` no `errorInterceptor`, mapeamento de status no login, spec do
  `AccountLockedComponent` (nao existe) e um smoke Playwright da jornada.
- Registrar em `knownGaps` do contrato consumido que `423`/`429` do `auth.login` nao estao no OpenAPI.

### Fora de escopo

- Alterar `sep-api`: nem o `RateLimitFilter`, nem o `LockoutService`, nem a config
  `app.security.*`. Tudo isso e escopo da Sprint backend
  [`033`](./033-sprint-33-lockout-conformidade.md), que corre em paralelo nesta branch propria.
- Alterar `sep-mobile` (o componente de login de la ja trata `423`; o mock tem a mesma lacuna e fica
  como follow-up).
- Contar tentativas, prever bloqueio ou exibir tentativas restantes no frontend — o backend nao
  informa isso em nenhum campo.
- Ecoar a `message` do servidor na tela de bloqueio: e texto livre, nao contrato, e nao chega ate a
  pagina (o interceptor navega e descarta o erro).
- Simular o rate limit `429` no mock MSW (ver Decisoes nos steps).
- Corrigir a divergencia doc x implementacao da janela de lockout (a doc diz 15 min, `estaBloqueada`
  conta em 30 min) — **escopo da Sprint backend [`033`](./033-sprint-33-lockout-conformidade.md)**.
- Refactor do fluxo TOTP/step-up, do `verify-totp` ou do design system.

## Tasks de implementacao

1. Mock MSW de login com contador de falhas por usuario + `resetLoginLockoutState` e teste de limiar
   no `auth.service.spec.ts`.
2. Mapeamento de status para mensagem no `LoginComponent` + spec do `423` no `errorInterceptor` +
   rewire do `login.component.spec.ts` com interceptors reais.
3. Copy de `/account-locked` fiel ao backend (30 min, desbloqueio automatico) + spec nova do
   `AccountLockedComponent`.
4. Smoke Playwright da jornada, entrada em `knownGaps`, docs e fechamento.

## Gates que nao contam como task

- Precheck da cadeia Git (`main` em `develop`, F-20 presente) e baseline verde
  (Vitest 664 / Playwright 36 / `contract:check` / lint / build).
- Reconfirmar no `sep-api` a ordem `verificar()` antes do registro da tentativa, antes de escrever o
  mock — o mock so pode espelhar o que o backend faz.
- Verificacao por mutacao de cada teste novo (skill `sep-web-mutation-verified-testing`); teste que
  sobrevive a mutacao do codigo que ele alega cobrir e considerado nao entregue.
- Smoke manual contra `:8080` (unico caminho que fecha o loop real) e PR description.

## Definition of Done

- O login exibe mensagem distinta e correta para `400`, `401`, `423`, `429` e falha de rede; nenhuma
  falha de rede ou bloqueio e reportada como senha invalida.
- A navegacao do `423` permanece **exclusivamente** no `errorInterceptor`, com `clearSession()`, e ha
  teste que falha se esse bloco for removido ou receber excecao para `/auth/login`.
- `/account-locked` informa 30 minutos e desbloqueio automatico, com teste que falha se a copy
  antiga (`alguns minutos`) voltar.
- O mock MSW devolve `423` a partir da 6a tentativa por usuario, espelhando a ordem do backend
  (bloqueio verificado antes da credencial; sucesso nao zera o contador), com reset por spec para nao
  vazar estado entre testes.
- Smoke Playwright cobre 5 falhas seguidas -> proxima tentativa cai em `/account-locked`.
- Vitest, Playwright, lint, SCSS lint, build e `contract:check` verdes; `npm audit` 0.
- O PR declara explicitamente a dependencia: **isolada, esta sprint nao faz o usuario chegar em
  `/account-locked` na 6a tentativa rapida contra o `:8080`** — a resposta ainda e `429` ate a Sprint
  backend [`033`](./033-sprint-33-lockout-conformidade.md) estar integrada. O e2e continua mais verde
  que a producao ate la, **de proposito** (o mock omite o `429`).
- O smoke real contra `:8080` so e declarado concluido com as duas sprints integradas.
