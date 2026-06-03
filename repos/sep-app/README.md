# sep-app

Documentacao especifica do frontend web SEP.

## Orientacao

Crie aqui documentacao tecnica ou operacional que pertenca apenas ao repo `sep-app`.
Exemplos: guias de fluxo web, notas de arquitetura frontend, decisoes locais de testes,
MSW, Playwright ou convencoes especificas da aplicacao Angular.

Documentos globais de produto/processo devem continuar em `docs-SEP/docs-sep/`.

## Jornada de Onboarding (F-Sprint 6)

Jornada autenticada de onboarding PF (KYC) e PJ (KYB) dentro de `/app`, consumindo
os contratos reais de `sep-api` (modulo `onboarding`, Sprints 6-7). O frontend apenas
orquestra telas e chamadas HTTP; status e decisoes KYC/KYB/PLD pertencem ao backend.

### Rotas

| Rota | Tela |
|------|------|
| `/app/onboarding` | Home com os dois caminhos (PF e PJ) |
| `/app/onboarding/pessoa` | Formulario de inicio PF |
| `/app/onboarding/pessoa/:id` | Detalhe PF: documentos, verificacao e status |
| `/app/onboarding/empresa` | Formulario de inicio PJ |
| `/app/onboarding/empresa/:id` | Detalhe PJ: dados, representantes, documentos e status |

### Contratos consumidos

PF (`/api/v1/onboarding/pessoa`): `POST` iniciar, `POST /{id}/documentos` (multipart
`tipo`+`arquivo`), `POST /{id}/verificar`, `GET /{id}`.

PJ (`/api/v1/onboarding/empresa`): `POST` iniciar, `POST /{id}/documentos`,
`POST /{id}/verificar`, `GET /{id}`, `GET /{id}/representantes`.

Tipos de borda em `src/app/core/api/api.models.ts`; transporte em
`src/app/core/onboarding/onboarding.service.ts`.

### Decisoes

- Componentes compartilhados em `features/authenticated/onboarding/shared/`:
  `OnboardingStatusComponent` (badge semantico + resultado) e
  `OnboardingDocumentUploadComponent` (selecao de tipo + upload com limite de 10MB).
  Sao presentacionais: nao chamam a API.
- LGPD: representante exibido apenas com `cpfMascarado`; resumo PLD mostra apenas
  status/data, nunca motivo/base/severidade.
- Upload nao persiste arquivo em storage local; o arquivo vive so na memoria do form.
- Campos PJ opcionais (`nomeFantasia`, `tipoSocietario`, `porte`) sao omitidos quando
  vazios para nao enviar enum em branco ao backend.
- `409` de CPF/CNPJ ativo vira estado de conflito orientado a acao; `401/403/423` seguem
  tratados globalmente pelo `errorInterceptor`.

### Testes

- Vitest: `OnboardingService`, paginas PF/PJ e componentes compartilhados
  (`npm run test`).
- Playwright (MSW/dev-offline): `e2e/onboarding.spec.ts` cobre PF (sucesso + conflito 409)
  e PJ (representante mascarado). Habilita MSW por sessao via
  `localStorage.NG_APP_USE_MSW`; rodar com `npx playwright test onboarding`.
- MSW handlers de onboarding em `src/mocks/handlers.ts`.

## Jornada de Credito e Open Finance (F-Sprint 7)

Jornada autenticada de propostas de credito e Open Finance do tomador dentro de
`/app/credito`, consumindo os contratos reais de `sep-api` (modulo `credito`,
Sprints 8-9). O frontend cria, lista e acompanha propostas e conduz o consentimento
Open Finance; motor de credito, score, regras, parecer e decisao de consentimento
pertencem ao backend.

### Rotas

| Rota | Tela |
|------|------|
| `/app/credito` | Home com atalhos (minhas propostas, nova proposta) |
| `/app/credito/propostas` | Lista de propostas do tomador |
| `/app/credito/propostas/nova` | Formulario de solicitacao de credito |
| `/app/credito/propostas/:id` | Detalhe: proposta, score e ultimo parecer |
| `/app/credito/propostas/:id/open-finance` | Consentimento Open Finance + status/agregados |
| `/app/credito/propostas/:id/open-finance/retorno` | Retorno do provider (consulta status) |

### Contratos consumidos

Credito (`/api/v1/credito/propostas`): `POST`, `GET` (lista paginada `PageResponse<T>`),
`GET /{id}`, `GET /{id}/regras` (FINANCEIRO/ADMIN).

Open Finance (`/api/v1/credito/propostas/{id}/open-finance`): `POST /consentimento`,
`GET` (status do consentimento + ultima movimentacao consolidada).

Tipos de borda em `src/app/core/api/api.models.ts`; transporte em
`src/app/core/credito/credito.service.ts`.

### Decisoes

- Componentes reutilizaveis em `features/authenticated/credito/shared/`:
  `PropostaStatusComponent` (badge com label operacional), `ScorePanelComponent` e
  `ParecerPanelComponent`, mais helpers `credito-format` (moeda/data/id curto) e
  `credito-error`. Sao presentacionais.
- O frontend nunca calcula score, elegibilidade, parcela, juros, IOF, CET ou decisao.
- `CLIENTE` nunca envia `tomadorId`; ownership e resolvido no backend.
- Open Finance: `redirectUri` sempre gerado pela aplicacao (rota `/retorno`, http(s));
  `urlAutorizacao` tratada como handoff externo (`window.open` com `noopener`); a rota de
  retorno consulta o `GET` da API, sem confiar em query params do provider.
- LGPD: exibe apenas agregados sanitizados; nunca payload bruto, conta, agencia, titular
  ou CPF/CNPJ de terceiro; nada persistido em storage local.
- `401/403/423` tratados globalmente pelo `errorInterceptor`; paginas tratam
  `400/404/409/422`.

### Testes

- Vitest: `CreditoService`, paginas de lista/detalhe/criacao/Open Finance e componentes
  compartilhados (`npm run test`).
- MSW handlers de credito/Open Finance em `src/mocks/handlers.ts`.
- Smoke Playwright dedicado e smoke com backend real ficaram como follow-up.
