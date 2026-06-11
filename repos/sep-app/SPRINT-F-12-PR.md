# PR — F-Sprint 12: Administracao e governanca web (sep-app)

## Summary

Implementa as telas administrativas de governanca (Epic 11 + Epic 13) consumindo o modulo
`governanca` do `sep-api` (Sprint 18 — RBAC cumulativo e parametros operacionais): gestao de
**roles cumulativas** por usuario e **parametros operacionais** versionados com historico.

Toda a area e **ADMIN-only** — os endpoints de governanca usam `hasRole('ADMIN')` (inclusive
leitura), entao a feature **aninha na area `Administracao` existente** (`/app/admin`,
`roleGuard ['ADMIN']`), sem criar grupo `/app/governanca` paralelo. Operacoes sensiveis
(alterar roles, alterar parametro) reusam o step-up existente. Precedencia de role, validacao de
tipo, versionamento e auditoria permanecem no backend; o frontend so apresenta e dispara acoes.

Spec `specs/fase-3/112-fsprint-12-governanca-web.md`,
steps `steps-fase-3/web/112-fsprint-12-steps.md`.

## Mudancas por area

- **Landing `Administracao`** (`/app/admin`): novo `admin-home.component` com cards (`Usuarios`,
  `Parametros operacionais`); o redirect `'' -> users` virou a landing. Sidenav: o item
  `Administracao` passou a apontar para `/app/admin`.
- **Roles cumulativas** no detalhe de usuario (`/app/admin/users/:id`): consulta o conjunto +
  role principal e edita o conjunto via `PUT /usuarios/{id}/roles`. Auto-protecao (nao editar as
  proprias roles), `FINANCEIRO + BACKOFFICE` representavel, step-up nas mutacoes.
- **Parametros operacionais**: lista (`/app/admin/parametros`) e detalhe
  (`/app/admin/parametros/:chave`) com historico de versoes (mais recente primeiro) e form de
  alteracao (`novoValor` + `justificativa`) com step-up; apos `200` recarrega detalhe e historico.
- **Step-up**: `stepUpInterceptor` estendido para anexar `X-Step-Up-Token` nas mutacoes de roles
  (`PUT`/`POST`/`DELETE`) e no `PATCH` de parametro; os GET de leitura nunca consomem token.
- **Auditoria**: legenda reforcando o historico de parametros como trilha auditavel; nota
  explicita do gap de auditoria de roles na UI (sem endpoint backend).
- **MSW** (`src/mocks/handlers.ts`): fakes de governanca reseedaveis (`resetGovernancaState`),
  admin com `mfaHabilitado`, validacao por tipo fiel ao backend, regras de auto-protecao e
  ultima role.

## Migrations / contratos

- Nenhuma migration. Contratos consumidos (Sprint 18): `GET/PUT /usuarios/{id}/roles`,
  `POST/DELETE /usuarios/{id}/roles/{role}`, `GET /governanca/parametros`,
  `GET /governanca/parametros/{chave}`, `PATCH /governanca/parametros/{chave}`.

## Decisoes aceitas

- Governanca aninhada em `/app/admin` (sem grupo `/app/governanca`); roles reusam o detalhe de
  usuario (sem pagina de roles separada nem campo de `id`/busca) — a area e listagem ja existiam.
- Edicao de roles via `PUT` (conjunto inteiro); `POST`/`DELETE` por role nao expostos na UI
  (cobertos pelo service/interceptor). `403` de mutacao -> `/app/step-up` (gated por MFA);
  auto-edicao bloqueada client-side.
- Valor de parametro trafega como `string`; input de texto unico com dica do tipo; validacao por
  tipo/faixa fica no backend (`400`/`422` tratados). Justificativa so em memoria (nunca em
  storage).
- DTOs alinhados aos reais do backend: `RolesResponseDto(roles, principal)`,
  `AlterarParametroRequest(novoValor, justificativa)`, parametro com `ativo`/`dataModificacao`,
  detalhe aninhado `{ parametro, historico }`, versao com `atorId`/`dataCriacao`.

## Test plan

- `npm run lint` — verde.
- `npm run lint:scss` — verde.
- `npm run test` — suite verde (governanca service, roles no detalhe de usuario, lista/detalhe/
  alteracao de parametros, `stepUpInterceptor`, landing admin).
- `npm run build` — verde.
- Smoke Playwright offline `e2e/governanca.spec.ts` (landing, parametros + historico, secao de
  roles). Mutacoes exigem step-up (MFA) e ficam para smoke real com backend em `:8080`.

## Dividas / follow-ups

- **Auditoria de roles na web**: sem endpoint de leitura na Sprint 18; a trilha detalhada de
  roles nao e exibida (apenas nota na UI). Follow-up: novo endpoint backend + tela.
- Smoke real com backend em `:8080` para validar step-up (MFA) nas mutacoes de roles/parametro e
  os codigos `400/403/404/422` reais.
- `POST`/`DELETE` de role individual existem no service mas nao tem UI dedicada (edicao por
  conjunto via `PUT` cobre os casos).

## Notas

- `roleGuard` valida a role principal (`user.role`); para governanca ADMIN-only e suficiente
  (precedencia resolve `principal = ADMIN`). A autorizacao real e server-side.

## Commits

- `f672ebd` feat(web): GovernancaService, modelos e MSW base da governanca (F-12.1)
- `c962d5f` fix(web): alinhar ordem de validacao do PUT roles ao backend (F-12.1)
- `0ebc295` fix(web): alinhar POST role e MSW de governanca ao backend (F-12.1)
- `9a5e311` fix(web): completar mocks de usuario com flags MFA (corrige build)
- `150689f` feat(web): area Administracao com landing sob /app/admin (F-12.2)
- `5e6650b` feat(web): gestao de roles cumulativas no detalhe de usuario (F-12.3)
- `fa30639` test(web): exercitar toggle de role no save do detalhe de usuario (F-12.3)
- `205f701` feat(web): parametros operacionais — lista, detalhe/historico e alteracao (F-12.4)
- `a60ec63` feat(web): visao auditavel de parametros e nota do gap de auditoria de roles (F-12.5)
