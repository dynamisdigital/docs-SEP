# Spec 217 - M-Sprint 17 - Follow-ups de lockout, acessibilidade e smoke no mobile

## Metadados

- **ID da Spec**: 217
- **Titulo**: M-Sprint 17 - Tornar a jornada de conta bloqueada alcancavel e testada no mobile,
  fechar os gaps de acessibilidade do Ionic e recuperar o smoke `golden-path-mobile`
- **Status**: planejada (criada em 2026-07-30)
- **Fase do produto**: Fase 4 - correcao de divida tecnica registrada; sem jornada de produto nova
- **Trilha**: Mobile (`sep-mobile`)
- **Origem**: follow-ups registrados pela M-Sprint 11 (race condition em `consultarStatusPix`), pela
  M-Sprint 16 ([`216`](./216-msprint-16-aporte-pix-avancado-mobile.md)) e pela F-Sprint 21
  ([`121`](./121-fsprint-21-lockout-login-web.md), que apontou o mock do `sep-mobile` sem `423`); mais
  o smoke `golden-path-mobile`, vermelho desde a M-Sprint 4
- **Depende de**: nada. Nao consome contrato novo do `sep-api`; o `423` de `/auth/login` existe desde a
  Sprint 5 e a Sprint 33 apenas o tornou alcancavel
- **Desbloqueia**: nada; e correcao de divida
- **Responsavel principal**: Dev Mobile

## Objetivo

Quitar a divida acumulada no `sep-mobile`, hoje espalhada por tres registros. Sao quatro defeitos
independentes, todos verificaveis:

1. **A jornada de conta bloqueada e inalcancavel e nao testada.** O mock MSW nunca produz `423`
   (`handlers.ts:46-62` responde `401` para qualquer credencial recusada), entao `/account-locked`
   existe como rota e componente mas nada leva ate la em dev-offline nem em Playwright. E, embora o
   mobile **ja trate `423` em tres camadas** (`login.component.ts:69-71`,
   `verify-totp.component.ts:85-88`, `error.interceptor.ts:33-40`), **nenhuma das tres tem teste** —
   `error.interceptor.spec.ts` cobre `401`/`403`/outros e nao cobre `423`; `verify-totp` e
   `account-locked` nao tem spec nenhuma.
2. **Race condition de duplo toque, em dois componentes.** O follow-up registrou um; sao **dois**:
   `portfolio-detail.component.ts:130` (credora) e `parcela-detail.component.ts:138` (tomador). Ambos
   os `consultarStatusPix` checam so o id no early-return e confiam no `[disabled]="carregandoPix()"`,
   que so vale a partir do proximo ciclo de change detection — um duplo toque no mesmo tick dispara
   duas requests concorrentes com a **mesma** `geracao`, e o guard de geracao nao descarta nenhuma.
3. **Landmark `main` duplicado.** O `ion-content` do Ionic ja aplica `role="main"` quando nao esta
   dentro de `ion-menu`/`ion-popover`/`ion-modal` — o que e sempre o caso aqui, porque o app usa
   `ion-tabs`. Quatro telas publicas envolvem o conteudo num `<main>` **dentro** desse `ion-content`,
   produzindo dois landmarks `main` aninhados na mesma pagina, sem `aria-label`. E violacao de
   WCAG/ARIA (o landmark `main` deve ser unico por documento) e esta observada no snapshot de
   acessibilidade do proprio Playwright. **O problema aqui e o inverso do web**: la faltava landmark,
   aqui sobra.
4. **O smoke `golden-path-mobile` nunca passou.** Esta vermelho **desde a M-Sprint 4**, nao desde a
   M-13 como o `STATE.md` registrava: o seletor `link /cadastr/i` nunca casou com o CTA "Criar conta",
   que tem esse texto desde a M-2. Sao tres causas independentes e o seletor e a menor delas.

## Decisao tecnica principal — fidelidade do mock, sem trocar a infra de teste

O mock de login passa a ser stateful quanto a falhas por usuario, espelhando a **ordem de avaliacao do
`sep-api`**, exatamente como a F-Sprint 21 fez no `sep-app`: `lockoutService.verificar()` roda antes de
resolver o usuario e de avaliar a credencial, entao a 5a senha errada ainda responde `401`, o `423` so
aparece na 6a requisicao, a senha correta apos o bloqueio tambem responde `423`, e login bem-sucedido
**nao** zera o contador. Molde pronto em `sep-app/src/mocks/handlers.ts`.

**Decisao: o MSW continua fora do Vitest.** `test-setup.ts` registra desde a M-2 que o server seria
plugado "na M-Sprint 2/3" e nunca foi: os 68 spec files usam `HttpTestingController`/`vi.fn()` e
**nenhum importa `mocks/server` ou `mocks/handlers`**. Plugar o MSW agora mudaria a infra de teste dos
68 de uma vez, com risco de interferir em quem ja usa `HttpTestingController` — e frente propria, nao
follow-up. **Consequencia pratica que a sprint assume**: o mock stateful serve ao dev-offline e ao
Playwright; a cobertura do `423` nas tres camadas e feita com `HttpTestingController`, que e o que o
repo ja usa e sabe verificar por mutacao.

**Sem ADR**: nao ha escolha estrutural nova. Um ADR passa a ser exigido para plugar o MSW no Vitest,
para ligar o `focusManagerPriority` global e para introduzir a role `FINANCEIRO` no mobile.

## Escopo

### Em escopo

- Mock MSW de login com contador de falhas por usuario e reset por spec, produzindo `423` a partir da
  6a tentativa e espelhando a ordem de avaliacao do backend.
- Cobertura do `423` nas tres camadas que ja o tratam (`login.component`, `verify-totp.component`,
  `error.interceptor`), com `HttpTestingController`; **specs novas** para `verify-totp` e
  `account-locked`, que hoje nao tem nenhuma.
- Guard de reentrancia em `consultarStatusPix` nos **dois** componentes, no padrao que a M-Sprint 16
  aplicou em `consultarAportes`.
- Remover o `<main>` redundante das quatro telas que o aninham dentro do `ion-content`.
- Foco no heading em `account-locked` e `access-denied`, que sao destinos de redirect.
- Reescrever o `golden-path-mobile` contra MSW: ligar `NG_APP_USE_MSW`, corrigir o seletor, usar senha
  compativel com a politica e **ensinar o mock a registrar e autenticar um usuario criado
  dinamicamente** — hoje o seed e fixo (`cliente@empresa.com` / `senha-passphrase-segura`) e
  incompativel com o `uniqueEmail()` do spec.

### Fora de escopo

- **Plugar o MSW server no Vitest** — ver Decisao tecnica principal. Mudaria a infra dos 68 specs.
  **Follow-up**.
- **Ligar `focusManagerPriority` global** no `provideIonicAngular()`. E uma linha e seria mais correto
  em acessibilidade, mas passa a mover foco em **todas** as ~30 rotas de uma vez e exige smoke visual,
  que hoje so roda manualmente. A sprint faz foco pontual nos dois destinos de redirect. **Follow-up**.
- **Portar o `contract:check` para o `sep-mobile`**. O `sep-app` tem desde a F-Sprint 19; o mobile nao
  tem verificacao de contrato nenhuma. Exige snapshot OpenAPI versionado, descriptor dos contratos
  consumidos, step no `CI-MOBILE` e inventario dos tipos de borda — foi uma sprint inteira no web.
  **Follow-up: frente propria**.
- **Escopo adiado pelo Gate M-16.0** (matching, aporte POST, chaves Pix). Continua bloqueado e foi
  reconferido nos dois lados: `UsuarioRole = 'ADMIN' | 'CLIENTE'` (`api.models.ts:1`), o `roleGuard`
  tipa `route.data['roles']` como `UsuarioRole[]` (entao `'FINANCEIRO'` **nao compila**), e os seis
  endpoints seguem `hasAnyRole('FINANCEIRO','ADMIN')` no backend. A spec 216 §Fora de escopo proibe
  introduzir a role sem ADR + revisao. **Nao e follow-up quitavel.**
- M-Sprint 14 (iOS) e M-Sprint 15 (biometria), presas ao gate externo de hardware macOS 13+.
- Rodar Playwright no `CI-MOBILE`. Os 27 e2e sao locais/manuais; o `golden-path-mobile` ficou 4 meses
  vermelho sem bloquear nada justamente por isso. Mudar e frente de tooling. **Follow-up**.
- Unificar duplicacoes de formatacao ou tocar em jornada de produto.
- Alterar `sep-api` ou `sep-app`.

## Tasks de implementacao

1. Mock MSW de login stateful com `423` a partir da 6a tentativa, espelhando a ordem do backend, com
   reset por spec.
2. Cobertura do `423` nas tres camadas + specs novas de `verify-totp` e `account-locked`.
3. Guard de reentrancia em `consultarStatusPix` nos dois componentes, com teste de duplo toque.
4. Remover o `<main>` aninhado das quatro telas.
5. Foco no heading em `account-locked` e `access-denied`.
6. Reescrever o `golden-path-mobile` contra MSW, com cadastro dinamico no mock.

## Gates que nao contam como task

- Precheck da cadeia Git (`main` em `develop`, M-Sprint 16 presente) e baseline verde: **Vitest 503 /
  68 arquivos** e **Playwright 27 (26 passam, 1 falha)**. O vermelho do `golden-path-mobile` e
  **preexistente e esperado** — anotar, nunca corrigir de carona antes da Task 6.
- **Destravar o Vitest na maquina de dev**: `node_modules/.vite-temp` fica root-owned apos execucoes
  em container e faz o Vitest abortar com `EACCES` antes de rodar qualquer teste.
- Reconfirmar, antes da Task 1, a ordem de avaliacao do `AutenticarUsuarioUseCase` no `sep-api` — o
  mock so pode espelhar o que o backend faz.
- Reconfirmar que o Gate M-16.0 continua valendo antes de qualquer toque nas telas da credora.
- Verificacao por mutacao de cada teste novo; teste que sobrevive a mutacao do codigo que alega cobrir
  e considerado nao entregue. A M-16 registrou o precedente: o teste de duplo toque falha com
  `Expected one matching request ... found 2 requests` quando a guarda e removida.
- `cap sync android` e `gradlew assembleDebug` verdes (job `Build Android (debug)` do `CI-MOBILE`).
- PR description.

## Definition of Done

- O mock devolve `423` a partir da 6a tentativa por usuario; a 5a senha errada ainda responde `401`; a
  senha correta apos o bloqueio tambem responde `423`; sucesso nao zera o contador — com teste para
  cada uma dessas quatro afirmacoes.
- Existe teste do `423` em cada uma das tres camadas: o login navega para `/account-locked`, o
  `verify-totp` idem, e o `errorInterceptor` limpa a sessao e navega. Cada um falha se o ramo `423`
  correspondente for removido.
- `verify-totp` e `account-locked` passam a ter spec propria.
- Duplo toque em `consultarStatusPix` dispara **uma** request em cada um dos dois componentes, com
  teste que falha se a guarda for removida.
- Nenhuma tela tem `<main>` dentro de `ion-content`; o snapshot de acessibilidade deixa de mostrar
  landmarks `main` aninhados.
- `account-locked` e `access-denied` movem foco para o heading ao serem abertos, com teste.
- `golden-path-mobile` **passa** com MSW ligado, cobrindo cadastro, login e a jornada autenticada; a
  suite e2e vai a **27 verdes**.
- Vitest, lint, SCSS lint, `format:check` e build verdes; `cap sync android` e `assembleDebug` OK.
- `STATE.md` corrige a atribuicao do `golden-path-mobile` (vermelho desde a M-4, nao desde a M-13).
