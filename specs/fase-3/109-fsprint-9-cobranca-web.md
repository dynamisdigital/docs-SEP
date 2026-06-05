# Spec 109 - F-Sprint 9 - Cobranca Web

## Metadados

- **ID da Spec**: 109
- **Titulo**: F-Sprint 9 - Parcelas, cobranca e inadimplencia no web
- **Status**: mergeada em `origin/develop` (PR #42) e `origin/main` (PR #43), 2026-06-05 (develop==main)
- **Fase do produto**: Fase 3 - Epic 13
- **Trilha**: Web (`sep-app`)
- **Origem**: PRD Epic 13; APIs cobranca Sprints 12-13
- **Depende de**: [`108-fsprint-8-formalizacao-web.md`](./108-fsprint-8-formalizacao-web.md)
- **Responsavel principal**: Devs Plenos Frontend

## Objetivo

Dar visibilidade web ao tomador e ao financeiro sobre parcelas, agenda, recebimentos manuais, inadimplencia e renegociacao.

## Escopo

### Em escopo
- Tela do tomador para parcelas e historico.
- Tela financeira para agenda e recebimentos manuais.
- Visao de inadimplencia e contatos.
- Fluxo de proposta/aceite/recusa de renegociacao.
- Estados de atraso, pago, inadimplente e renegociado.

### Fora de escopo
- Pix automatico.
- Boleto.
- BI externo.

## Tasks de implementacao

1. Criar `CobrancaService` e modelos de agenda/parcela/recebimento/renegociacao.
2. Implementar parcelas do tomador.
3. Implementar agenda financeira e detalhe de parcela.
4. Implementar registro de recebimento manual com step-up quando aplicavel.
5. Implementar inadimplencia, contato e renegociacao.
6. Atualizar MSW, Vitest e cenarios de erro.

## Gates que nao contam como task

- Precheck dos endpoints de cobranca.
- Smoke E2E parcelas -> recebimento/renegociacao.
- Docs, PRD/CONTEXT e roadmap quando aplicavel.

## Definition of Done

- Tomador ve apenas suas parcelas.
- Financeiro opera recebimento/renegociacao com autorizacao correta.
- Estados financeiros sao consistentes com a API.

## Execucao (2026-06-05)

Mergeada em `origin/develop` (PR #42, merge `64e8cad`) e `origin/main` (PR #43); develop==main.
Desenvolvida em `feature/fsprint-9-cobranca-web`.

- **F-9.1**: `CobrancaService` (transporte HTTP puro, 9 metodos), modelos de borda
  (`StatusParcela`, `StatusRenegociacao`, agenda/parcela/recebimento/inadimplencia/
  evento/renegociacao) e MSW base. Frontend nunca calcula saldo/mora/multa/status.
- **F-9.2**: feature lazy `/app/cobranca`, shell por perfil (financeiro/tomador/sem-jornada)
  e menu. `UsuarioRole` estendido com `FINANCEIRO`/`BACKOFFICE` (role principal do backend).
- **F-9.3**: agenda do tomador (composicao estatica) e detalhe da parcela (valor atualizado),
  com CTA a partir do contrato ASSINADO; componente `parcela-composicao` reusado.
- **F-9.4**: agenda financeira (recebimentos + lookup por id), detalhe financeiro e
  recebimento manual com `Idempotency-Key` por tentativa (descartada ao editar/sucesso,
  nunca persistida); submit anti duplo-clique.
- **F-9.5**: painel de inadimplencia (filtros), contato manual e proposta de renegociacao
  pelo financeiro (step-up via `stepUpInterceptor` estendido; recusa sem step-up).

### Divergencias corrigidas vs spec original

- `GET /parcelas/{id}` retorna `ValorAtualizadoParcelaResponse` (nao `ParcelaResponse`);
  parcela dentro da agenda e composicao estatica (`principal/juros/multa/encargos/total`).
- `RecebimentoResponse` usa `recebimentoId`/`statusParcela`/`novo` (sem `observacao`/
  `registradoPor`); POST recebimento retorna `200`.
- `RegistrarContatoRequest = { descricao, diasAtraso? }`; contato retorna `201 EventoCobrancaResponse`.
- `RenegociacaoResponse` usa `parcelaOriginalId/novoValorParcela/dataProposta/...`.

### Gaps / follow-ups (backend)

- **Aceite/recusa de renegociacao pelo tomador (109.5.5) NAO implementado.** Backend nao
  expoe `GET /cobranca/renegociacoes/{id}` nem o `renegociacaoId` ao tomador, entao a tela
  exigiria decidir "no escuro" (sensivel — CMN 4.656). Requer no backend: (1) `GET
  /cobranca/renegociacoes/{id}` com termos completos antes da decisao; (2) descoberta do id
  pelo tomador (id na parcela, lista por parcela ou lista de propostas pendentes); manter
  `PATCH` aceite (step-up) + recusa (sem step-up). Interceptor ja preparado para o aceite.
- Sem endpoint de lista global de agendas: visao financeira parte da parcela por id (lookup).
- `GET /cobranca/recebimentos` sem paginacao nesta fase (sinalizado na UI).

### Validacao

- `npm run lint`, `npm run lint:scss`, `npm run test -- --run` (236 testes Vitest) e
  `npm run build` verdes. Smoke E2E offline `e2e/cobranca.spec.ts` (agenda/detalhe do
  tomador, recebimento manual, inadimplencia). Renegociacao com step-up e smoke com backend
  real recomendados manualmente (step-up exige MFA, indisponivel no dev-offline).
- Descricao consolidada em `repos/sep-app/SPRINT-F-9-PR.md`.
