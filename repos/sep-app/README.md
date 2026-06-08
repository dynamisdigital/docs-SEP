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

## Jornada de Cobranca (F-Sprint 9)

Jornada autenticada de cobranca em `/app/cobranca`, consumindo o modulo `cobranca` de
`sep-api` (Sprints backend 12-13). O frontend so apresenta: saldo, mora, multa, status e
transicoes pertencem ao backend.

### Rotas

- `/app/cobranca` — shell por perfil: financeiro/admin veem agenda financeira e
  inadimplencia; tomador (CLIENTE) acessa as parcelas a partir de um contrato assinado;
  demais perfis (ex.: BACKOFFICE) ficam sem jornada (o backend nao os autoriza).
- `/app/cobranca/contratos/:contratoId/agenda` e `/app/cobranca/parcelas/:id` — tomador.
- `/app/cobranca/financeiro/agenda`, `/app/cobranca/financeiro/parcelas/:id` e
  `/app/cobranca/financeiro/inadimplencia` — `roleGuard` FINANCEIRO/ADMIN.

### Contratos consumidos

Cobranca (`/api/v1/cobranca`): `GET /contratos/{id}/agenda`, `GET /parcelas/{id}`
(`ValorAtualizadoParcelaResponse`), `POST /parcelas/{id}/recebimentos` (+ `Idempotency-Key`,
200), `GET /recebimentos`, `GET /inadimplencia`, `POST /parcelas/{id}/contato` (201),
`POST /parcelas/{id}/renegociacao` (step-up). `PATCH /renegociacoes/{id}/aceite|recusa`
existem no backend, mas a jornada do tomador ficou de fora (ver Gaps).

### Decisoes

- Nenhum calculo financeiro no frontend; agenda mostra composicao estatica e o valor
  atualizado vem so do detalhe da parcela.
- `Idempotency-Key` gerada por tentativa de recebimento, descartada ao editar o payload ou
  apos sucesso, nunca persistida; submit desabilitado durante o envio.
- Step-up das operacoes de renegociacao via `stepUpInterceptor` (allowlist estendida para
  `POST /renegociacao` e `PATCH /renegociacoes/{id}/aceite`; recusa sem step-up).
- `UsuarioRole` passou a incluir `FINANCEIRO`/`BACKOFFICE` (role principal do backend).

### Gaps

- Aceite/recusa de renegociacao pelo tomador: depende de `GET /cobranca/renegociacoes/{id}`
  e de descoberta do `renegociacaoId` (ausentes no backend) para nao decidir "no escuro".
- Sem lista global de agendas (lookup por id); `GET /recebimentos` sem paginacao.

### Testes

- Vitest: `CobrancaService`, paginas (agenda/detalhe do tomador, agenda financeira,
  parcela financeira, inadimplencia), badge/composicao e `stepUpInterceptor` (`npm run test`).
- MSW handlers de cobranca em `src/mocks/handlers.ts`.
- Smoke Playwright `e2e/cobranca.spec.ts` (offline). Renegociacao com step-up e smoke real
  recomendados manualmente (step-up exige MFA, fora do dev-offline).

## Backoffice e financeiro operacional (F-Sprint 10)

Operacao assistida em `/app/backoffice` para `BACKOFFICE`, `FINANCEIRO` e `ADMIN`, consumindo
o modulo `backoffice` de `sep-api` (Sprint 14 + extensoes Pix das Sprints 20-21). O frontend
apenas apresenta e dispara acoes; transicoes de status, ownership, auditoria, anti-abuso e o
gate de step-up pertencem ao backend. `CLIENTE` nao ve o menu nem acessa as rotas (guard de
visibilidade; a autorizacao real e do backend).

### Rotas

| Rota | Tela |
|------|------|
| `/app/backoffice` | Shell com as secoes (dashboard, fila, reprocessos) |
| `/app/backoffice/dashboard` | Visao consolidada operacional/financeira |
| `/app/backoffice/fila` | Fila com filtros, paginacao e ordenacao do backend |
| `/app/backoffice/fila/:id` | Detalhe do item: dados, comentarios, objeto original e acoes |
| `/app/backoffice/reprocessos` | Painel de reprocesso de webhook e provider |

O route group e protegido por `roleGuard` (`BACKOFFICE`/`FINANCEIRO`/`ADMIN`) e o item
`Backoffice` no sidenav segue as mesmas roles.

### Contratos consumidos

Backoffice (`/api/v1/backoffice`): `GET /dashboard` (`Cache-Control: no-store`),
`GET /fila` (`Page<ItemFilaResponse>` com filtros `tipo`/`prioridade`/`status`/
`data_abertura_de`/`data_abertura_ate`/`atribuido_a`/`page`/`size`/`sort`),
`GET /fila/{id}`, `POST /fila/{id}/assumir`, `POST /fila/{id}/comentarios`,
`PATCH /fila/{id}/resolver` (step-up), `PATCH /fila/{id}/ignorar` (step-up),
`POST /reprocessos/webhook/{webhookEventId}` (step-up), `POST /reprocessos/provider/{tipoChamada}/{entidadeId}` (step-up).

Tipos de borda em `src/app/core/api/api.models.ts`; transporte em
`src/app/core/backoffice/backoffice.service.ts`.

### Decisoes

- Componentes compartilhados em `features/authenticated/backoffice/shared/`:
  `BackofficeChipComponent` (chip de prioridade/status), `ReprocessoResultadoComponent`
  (resultado do reprocesso) e `backoffice-format` (moeda/data/duracao + labels). Sao
  presentacionais.
- A tela nunca recalcula contadores, medias, somatorios, SLA, prioridade ou permissao de
  transicao; apresenta os agregados do backend (dashboard com `no-store`, sem persistir).
- `resolver`, `ignorar` e os reprocessos exigem step-up: o token e anexado pelo
  `stepUpInterceptor` (allowlist estendida) — o service nao envia token. Sem token, o `403`
  redireciona para `/app/step-up?next=<rota>`; `409` recarrega o estado real.
- Reprocesso respeita o backend: `PIX_TRANSFERENCIA` tem reconsulta real; `KYC`/`KYB`/`PLD`/
  `OPEN_FINANCE`/`ASSINATURA_DIGITAL` podem ser stubs — a UI exibe o `resultado` como veio e
  nao promete retentativa. `RECEBIMENTO_PIX_DIVERGENTE` nao tem reprocesso de provider (so
  tratamento manual). Anti-abuso `429` mostra mensagem especifica, sem retry automatico.
- LGPD: filtros, fila e detalhe nao expoem payload bruto de webhook/provider, CPF/CNPJ
  completo, chave Pix, dados bancarios ou tokens; comentario/justificativa ficam so na memoria
  do form (nada em storage).
- `tempoMedioResolucao30d` chega como numero de segundos (Duration); a apresentacao formata.

### Testes

- Vitest: `BackofficeService`, paginas (dashboard, fila, detalhe, reprocessos), shell,
  chip/resultado, `stepUpInterceptor` e sidenav (`npm run test`).
- MSW handlers de backoffice em `src/mocks/handlers.ts` (fila, dashboard, reprocessos, step-up
  e anti-abuso `429`).
- Smoke Playwright `e2e/backoffice.spec.ts` (offline): dashboard, fila, detalhe, assumir e
  comentar. `resolver`/`ignorar` e reprocessos exigem step-up (MFA) e ficam para o smoke real.
