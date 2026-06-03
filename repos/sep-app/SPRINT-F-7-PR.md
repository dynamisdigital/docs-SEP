# F-Sprint 7 - Credito e Open Finance Web

## Summary

Implementa no `sep-app` a jornada autenticada de propostas de credito e Open Finance
para o tomador, dentro de `/app/credito`, consumindo os contratos reais de `sep-api`
(modulo `credito`, Sprints 8-9). O frontend cria, lista e acompanha propostas e conduz
o consentimento Open Finance; motor de credito, score, regras, parecer e decisao de
consentimento pertencem ao backend. UI no design system Notion.

Escopo: contratos TS + `CreditoService` + MSW, rotas/menu/home, lista e detalhe de
propostas, formulario de solicitacao, componentes reutilizaveis de status/score/parecer
e fluxo Open Finance (consentimento, redirect/retorno, status/agregados).

## Test plan

- `npm run lint` / `npm run lint:scss` — verdes.
- `npm run test` — 148 testes (Vitest), incluindo `CreditoService`, paginas de lista,
  detalhe, criacao e Open Finance, e componentes compartilhados.
- `npm run build` — verde (chunks lazy de credito gerados).
- Smoke manual MSW/dev-offline: pendente (interativo).
- Smoke com backend real (`http://localhost:8080`): pendente por ambiente.

## Mudancas por area

- `core/api/api.models.ts`: tipos de borda de credito/Open Finance (enums de status,
  `PropostaResponse` com `score`+`parecer` aninhados, score, parecer, regra avaliada,
  consentimento, status Open Finance, movimentacao consolidada, `PageResponse<T>`).
- `core/credito/credito.service.ts`: transporte HTTP puro (criar/listar/consultar
  proposta, listar regras, iniciar consentimento, consultar Open Finance); query params
  vazios omitidos; nao interpreta status/score como regra de negocio.
- `features/authenticated/credito/`: home, rotas lazy, lista (`propostas/`), detalhe,
  formulario de criacao, pagina Open Finance (`open-finance/`) e componentes
  compartilhados (`shared/`): `PropostaStatusComponent` (badge com label),
  `ScorePanelComponent`, `ParecerPanelComponent` e helpers `credito-format`/`credito-error`.
- `layout/sidenav`: entrada "Credito" visivel a todo usuario autenticado.
- `mocks/handlers.ts`: cenarios de propostas (lista por status, detalhe com score+parecer,
  criacao 201, 422 onboarding nao aprovado, 403 ownership) e Open Finance (consentimento
  201, 409 pendente, 403, 404, status AUTORIZADO com agregados sanitizados).

## Contratos consumidos

Credito (`/api/v1/credito/propostas`): `POST`, `GET` (lista paginada), `GET /{id}`,
`GET /{id}/regras` (FINANCEIRO/ADMIN).

Open Finance (`/api/v1/credito/propostas/{id}/open-finance`): `POST /consentimento`,
`GET` (status + ultima movimentacao consolidada).

## Decisoes e dividas aceitas

- Frontend nunca calcula score, elegibilidade, parcela, juros, IOF, CET ou decisao final.
- `CLIENTE` nunca envia `tomadorId`; ownership e resolvido no backend.
- Open Finance: `redirectUri` sempre gerado pela aplicacao (rota `/retorno`, http(s));
  a `urlAutorizacao` e tratada como handoff externo (`window.open` com `noopener`); a rota
  de retorno nao consome query params do provider como verdade — consulta o `GET` da API.
- LGPD: exibe apenas agregados sanitizados (`mediaEntradasMensal`, `mediaSaidasMensal`,
  `saldoMedio`, `numeroMesesAvaliados`, `dataRecebimento`); nunca payload bruto,
  transacoes, conta, agencia, titular ou CPF/CNPJ de terceiro; nada persistido em storage.
- Status mapeado para label operacional curto, sem reinterpretar transicao de dominio.
- `401/403/423` tratados pelo `errorInterceptor` global; paginas tratam `400/404/409/422`.
  Como 403 redireciona globalmente, ha apenas fallback defensivo de erro nas paginas.
- Atalho Open Finance condicionado a tomador dono e proposta nao final (APROVADA/REJEITADA).
- `MovimentacaoConsolidadaResponse` formatada em BRL; datas em formato curto pt-BR.
- Menu "Credito" sem filtro de role; `UsuarioRole` segue `ADMIN | CLIENTE` enquanto o
  backend nao retornar `FINANCEIRO` ao web.

## Follow-ups

- Smoke com backend real e smoke Playwright dedicado da jornada de credito/Open Finance.
- Trilha de regras (`GET /propostas/{id}/regras`) para perfil interno quando a UI
  autenticar `FINANCEIRO`/`ADMIN`.
- Descoberta do `solicitacaoOnboardingId` aprovado (hoje digitado no form) depende de
  endpoint backend de listagem dedicada.
- Parecer manual / mesa de credito permanece fora (entra na F-Sprint 10).

## Commits

- `f734dd8` feat(credito): contratos TS, CreditoService e MSW base (F-7.1)
- `3541337` fix(credito): MSW filtra propostas por status e valida redirectUri (F-7.1)
- `646a1a6` feat(credito): rotas lazy, menu e home da jornada de credito (F-7.2)
- `7af3ad4` feat(credito): lista e detalhe de propostas (F-7.3)
- `d82c5de` test(credito): cobre casos negativos do atalho Open Finance (F-7.3)
- `cd99878` feat(credito): formulario de solicitacao de proposta (F-7.4)
- `1fcb116` feat(credito): paineis reutilizaveis de status, score e parecer (F-7.5)
- `7618638` fix(credito): cobre PENDENCIA e padroniza label de decisao (F-7.5)
- `81e85a6` feat(credito): fluxo Open Finance opt-in no web (F-7.6)
