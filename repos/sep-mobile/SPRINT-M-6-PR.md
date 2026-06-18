# PR — M-Sprint 6: Onboarding Mobile (Epic 14)

Branch: `feature/msprint-6-onboarding-mobile` → `develop`.

## Summary

Implementa a jornada PWA de onboarding do tomador (KYC PF / KYB PJ) no `sep-mobile`,
consumindo as APIs existentes de `sep-api` (onboarding Sprints 6-7). O app coleta dados,
envia documentos e apresenta o status; **decisoes KYC/KYB/PLD permanecem no backend**.

Entrada por `/app/onboarding` (rota lazy protegida pelo `authGuard` do shell autenticado),
acessada pelo atalho "Onboarding" da home do tomador.

## Test plan

- `npm run lint` ✓ · `npm run lint:scss` ✓ · `npm run format:check` ✓
- `npm run test` (Vitest) ✓ — 154 testes.
- `npm run build` ✓ (warning de budget em `onboarding-shell.component.scss`: 3.59 kB, abaixo do
  limite de erro de 4 kB; consistente com outros componentes do repo).
- `npm run e2e` (Playwright PWA, viewport Pixel 5): smoke de onboarding + smoke publico passam
  servidos por MSW (4/4). `golden-path-mobile.spec.ts` e `profile-actions.spec.ts` permanecem
  vermelhos por exigirem backend real em `:8080` (login sem MSW) — bloqueio preexistente, nao
  relacionado a onboarding.

## Mudancas por modulo

### `core/api` + `core/onboarding`
- `api.models.ts`: DTOs de borda do onboarding espelhando o contrato real (status, tipos de
  documento, requests PF/PJ, responses de status PF/PJ, representante, resultado).
- `onboarding-mobile.service.ts`: transporte HTTP (`/api/v1/onboarding/pessoa|empresa`) —
  iniciar, documentos (`FormData` multipart), verificar, consultar status, representantes PJ.
  Promise via `firstValueFrom` (convencao do repo).
- `onboarding-journey.store.ts`: persiste o ponteiro `{tipo, onboardingId}` via Capacitor
  Preferences, com validacao de forma na leitura. Necessario porque o backend nao expoe consulta
  do onboarding corrente por usuario (apenas por id). Nao persiste PII.

### `features/tomador`
- Atalho "Onboarding" da home convertido em CTA de navegacao.
- `onboarding-shell.component`: orquestrador (selecao PF/PJ, progresso por etapas, inicio,
  upload, verificacao, status, reload/retry, erro, recomecar) + restauracao da jornada no
  `ngOnInit`.
- `pessoa-fisica-form` / `pessoa-juridica-form`: formularios apresentacionais (validacao local
  apenas de formato basico; tipo societario e porte opcionais, alinhados a colunas nullable).
- `document-upload.component`: tipo + arquivo, limite local de 10 MB.
- `onboarding-status.component`: badge de status + resultado.

### `features/authenticated`
- Rota lazy `/app/onboarding` sob o shell autenticado.

### Infra de teste / mocks
- `src/mocks/handlers.ts`: handlers MSW de onboarding (cenarios feliz/pendencia/erro por
  documento de entrada).
- `e2e/onboarding-mobile.spec.ts`: smoke PWA servido por MSW.

## Migrations

Nenhuma (mobile).

## Decisoes

- Jornada em memoria + ponteiro persistido (sem endpoint de "onboarding corrente"); resume apos
  reload, evitando 409 ao recomecar.
- Tipos de documento PF/PJ seguem o contrato real do backend (PF nao inclui
  `COMPROVANTE_ENDERECO`).
- Componentes com `ion-input`/`ion-select` sao testados por instancia (`runInInjectionContext`),
  pois o happy-dom nao monta esses web components — mesma convencao de `login`/`register`.

## Dividas aceitas / followups

- `onboarding-shell.component.scss` acima do budget de warning (2 kB), abaixo do de erro (4 kB).
- `golden-path-mobile`/`profile-actions` e2e dependem de backend real `:8080` (preexistente).
- Representantes PJ exibidos quando presentes; backend nao retorna lista de pendencias explicita
  (status `PENDENCIA` + `resultado.motivo`).

## Commits

```
01afc6a feat(mobile): adicionar servico de onboarding
03d4e72 test(mobile): alinhar verificar onboarding a 202 Accepted
feab33d feat(mobile): abrir jornada de onboarding
21a57f6 test(mobile): cobrir badge dos atalhos placeholder da home
4af291e feat(mobile): implementar formularios de onboarding
d221d7a fix(mobile): tornar tipo societario e porte opcionais no form PJ
d4e2514 feat(mobile): adicionar upload de documentos
8c40ae2 feat(mobile): exibir status do onboarding
a68796c fix(mobile): validar forma do ponteiro de onboarding persistido
54ab99e test(mobile): cobrir onboarding mobile
98c9886 test(mobile): aguardar action-sheet no smoke de onboarding
```
