# F-Sprint 6 - Onboarding Web PF/PJ

## Summary

Implementa no `sep-app` a jornada autenticada de onboarding PF (KYC) e PJ (KYB)
dentro de `/app`, consumindo os contratos reais de `sep-api` (modulo `onboarding`,
Sprints 6-7). O frontend orquestra telas e chamadas HTTP; status e decisoes
KYC/KYB/PLD pertencem ao backend. UI no design system Notion.

Escopo: contratos TS + service + MSW, rotas/menu/home, fluxo PF, fluxo PJ,
componentes compartilhados de status e upload, validacao final com smoke MSW.

## Test plan

- `npm run lint` / `npm run lint:scss` — verdes.
- `npm run test` — 106 testes (Vitest), incluindo `OnboardingService`, paginas
  PF/PJ e componentes compartilhados.
- `npm run build` e `npm run build -- --configuration dev-offline` — verdes.
- `npx playwright test onboarding` — 3 smokes MSW/dev-offline verdes (PF sucesso,
  PF conflito 409, PJ representante mascarado).
- Smoke com backend real: pendente por ambiente (backend nao disponivel em
  `http://localhost:8080` durante a sprint).

## Mudancas por area

- `core/api/api.models.ts`: tipos de borda do onboarding (status, documentos,
  empresa, representantes, resumo PLD).
- `core/onboarding/onboarding.service.ts`: transporte HTTP PF/PJ (multipart
  `tipo`+`arquivo`); nao interpreta status como regra de negocio.
- `features/authenticated/onboarding/`: home, rotas lazy, pagina PF (`pessoa/`),
  pagina PJ (`empresa/`) e componentes compartilhados (`shared/`):
  `OnboardingStatusComponent`, `OnboardingDocumentUploadComponent` e helper
  `mensagemOnboardingErro`.
- `layout/sidenav`: entrada "Onboarding" visivel para CLIENTE e ADMIN.
- `mocks/handlers.ts`: cenarios PF/PJ (sucesso, 409 CPF/CNPJ ativo, 400 documento
  invalido, 403 ownership, representantes mascarados).
- `e2e/onboarding.spec.ts`: smoke MSW.

## Contratos consumidos

PF (`/api/v1/onboarding/pessoa`): `POST` iniciar, `POST /{id}/documentos`,
`POST /{id}/verificar`, `GET /{id}`.

PJ (`/api/v1/onboarding/empresa`): `POST` iniciar, `POST /{id}/documentos`,
`POST /{id}/verificar`, `GET /{id}`, `GET /{id}/representantes`.

## Decisoes e dividas aceitas

- Componentes de status e upload sao presentacionais: nao chamam a API. A pagina
  orquestra o upload e chama `limpar()` (via `viewChild`) apos sucesso.
- LGPD: representante exibido apenas com `cpfMascarado`; resumo PLD apenas
  status/data.
- Upload nao persiste arquivo em storage local.
- Campos PJ opcionais omitidos quando vazios (nao envia enum em branco).
- `401/403/423` tratados pelo `errorInterceptor` global; paginas tratam
  `400/404/409/5xx`. Como 403 redireciona globalmente, nao ha tratamento inline
  de 403 nas paginas (evita codigo morto).
- Validacao de CPF/CNPJ no front e apenas de obrigatoriedade; validacao
  juridica/cadastral permanece no backend.

## Follow-ups

- Smoke com backend real quando o ambiente estiver disponivel.
- Descoberta/listagem de solicitacoes existentes do usuario depende de endpoint
  backend dedicado ("minha solicitacao ativa").
- OCR/captura assistida de documentos fica fora do web inicial.

## Commits

- `80547c3` feat(onboarding): contratos TS, OnboardingService e MSW base (F-6.1)
- `7bc2902` test(onboarding): cobre verificarEmpresa() no OnboardingService (F-6.1)
- `fdbb44d` fix(onboarding): valida tipo de documento PF no MSW + teste (F-6.1)
- `0a50908` feat(onboarding): rotas, menu e home da jornada onboarding (F-6.2)
- `ac758d9` test(onboarding): cobre visibilidade CLIENTE do menu Onboarding (F-6.2)
- `783c212` feat(onboarding): fluxo PF iniciar/documentos/verificar/status (F-6.3)
- `0ecf29b` fix(onboarding): aceita COMPROVANTE_ENDERECO como documento PF no MSW (F-6.3)
- `e6f8e5a` feat(onboarding): fluxo PJ/KYB empresa, documentos, representantes e status (F-6.4)
- `ec83199` fix(onboarding): limpa input file ao rejeitar arquivo acima de 10MB no PJ (F-6.4)
- `62c92f2` refactor(onboarding): extrai componentes de status e upload reutilizaveis PF/PJ (F-6.5)
- `5f9b678` test(onboarding): smoke e2e MSW PF/PJ (F-6.6)
- `210b9d5` test(onboarding): reforca LGPD com assert negativo de CPF completo no smoke PJ (F-6.6)

Mergeada em `develop` via PR #33 (merge `ed14629`, 2026-06-03).
