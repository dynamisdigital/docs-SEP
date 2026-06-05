# F-Sprint 9 - Cobranca, Parcelas e Inadimplencia Web

## Summary

Implementa no `sep-app` a jornada autenticada de cobranca em `/app/cobranca`, consumindo os
contratos reais de `sep-api` (modulo `cobranca`, Sprints backend 12-13). O frontend apresenta
agenda, parcela com valor atualizado, recebimento manual idempotente, inadimplencia, contato
manual e proposta de renegociacao. Saldo, mora, multa, status e transicoes permanecem no
backend; o frontend so apresenta. UI no design system Notion.

Escopo: modelos TS + `CobrancaService` + MSW; rotas/menu/shell por perfil; agenda e detalhe
do tomador; agenda financeira + recebimento manual; inadimplencia + contato + proposta de
renegociacao (financeiro) com step-up.

## Test plan

- `npm run lint` / `npm run lint:scss` — verdes.
- `npm run test -- --run` — 236 testes (Vitest), incluindo `CobrancaService`,
  `stepUpInterceptor` (renegociacao), paginas (agenda/detalhe do tomador, agenda financeira,
  parcela financeira, inadimplencia) e componentes (`parcela-status`, `parcela-composicao`).
- `npm run build` — verde (chunks lazy de cobranca gerados).
- Smoke E2E offline `e2e/cobranca.spec.ts` (agenda/detalhe do tomador, recebimento manual,
  inadimplencia). Renegociacao com step-up e smoke com backend real recomendados manualmente
  (step-up exige MFA, indisponivel no dev-offline).

## Mudancas por area

- `core/api/api.models.ts`: tipos de borda de cobranca (`StatusParcela`, `StatusRenegociacao`,
  `TipoEventoCobranca`, `CanalNotificacao`, `StatusEventoCobranca`, `AgendaPagamentoResponse`,
  `ParcelaResponse`, `ValorAtualizadoParcelaResponse`, `RegistrarRecebimentoRequest`,
  `RecebimentoResponse`, `InadimplenciaResponse`, `RegistrarContatoRequest`,
  `EventoCobrancaResponse`, `IniciarRenegociacaoRequest`, `RenegociacaoResponse`); `UsuarioRole`
  estendido com `FINANCEIRO`/`BACKOFFICE` (role principal denormalizada do backend).
- `core/cobranca/cobranca.service.ts`: transporte HTTP puro (agenda, parcela, recebimento com
  `Idempotency-Key`, recebimentos, inadimplencia com filtros snake_case, contato, renegociacao
  propor/aceitar/recusar). Nenhum calculo financeiro.
- `core/interceptors/step-up.interceptor.ts`: allowlist estendida para
  `POST /cobranca/parcelas/{id}/renegociacao` e `PATCH /cobranca/renegociacoes/{id}/aceite`
  (recusa sem step-up), com guard de metodo.
- `features/authenticated/cobranca/`: feature lazy, shell por perfil, agenda e detalhe do
  tomador, agenda financeira (recebimentos + lookup por id), parcela financeira (recebimento +
  contato + renegociacao), inadimplencia; `shared/` com `parcela-status`, `parcela-composicao`
  e `cobranca-format`.
- `features/authenticated/formalizacao/contrato-detail`: CTA "Ver agenda de cobranca" no
  contrato ASSINADO.
- `layout/sidenav` + `dashboard`: item "Cobranca"; tipos de roles widened para `UsuarioRole[]`.
- `mocks/handlers.ts`: cenarios de cobranca (agenda, parcela, recebimento com idempotencia,
  inadimplencia com filtros, contato, renegociacao com step-up) fieis ao backend (404/409/400),
  alem de login `financeiro@empresa.com` e `/auth/me`/`refresh` por usuario logado.

## Decisoes

- Frontend so apresenta valores do backend; agenda mostra composicao estatica e o valor
  atualizado/saldo vem apenas do detalhe da parcela.
- `Idempotency-Key` gerada por tentativa de recebimento, reusada apenas no retry do mesmo
  payload, descartada ao editar o payload ou apos sucesso; nunca persistida em storage.
- Step-up das operacoes de renegociacao centralizado no `stepUpInterceptor` (nao no service);
  403 redireciona para `/app/step-up` quando ha MFA; recusa nao exige step-up.
- Shell ramifica por perfil espelhando a autorizacao do backend (FINANCEIRO/ADMIN operam;
  CLIENTE ve a propria jornada; BACKOFFICE sem jornada de cobranca).
- Erros: `403` tratado pelo `errorInterceptor` global; paginas tratam `400/404/409` (+`422`
  defensivo); `409` e a fonte final de verdade (recarrega o estado).

## Divergencias corrigidas vs spec original

- `GET /parcelas/{id}` retorna `ValorAtualizadoParcelaResponse`; a parcela dentro da agenda e
  composicao estatica (`principal/juros/multa/encargos/total`).
- `RecebimentoResponse` usa `recebimentoId/statusParcela/novo` (sem `observacao`/`registradoPor`);
  `POST` recebimento retorna `200`.
- `RegistrarContatoRequest = {descricao, diasAtraso?}`; contato retorna `201 EventoCobrancaResponse`.
- `RenegociacaoResponse` usa `parcelaOriginalId/agendaOriginalId/novoValorParcela/dataProposta/...`.

## Gaps e follow-ups (backend)

- **Aceite/recusa de renegociacao pelo tomador (109.5.5) NAO entrou.** O backend nao expoe
  `GET /cobranca/renegociacoes/{id}` nem o `renegociacaoId` ao tomador, entao a tela exigiria
  decidir "no escuro" (sensivel — CMN 4.656). Requer: (1) `GET /cobranca/renegociacoes/{id}`
  com termos completos antes da decisao; (2) descoberta do id pelo tomador (id na parcela,
  lista por parcela ou lista de propostas pendentes); manter `PATCH` aceite (step-up) e recusa
  (sem step-up). O `stepUpInterceptor` ja contempla o aceite.
- Sem endpoint de lista global de agendas: a visao financeira parte da parcela por id (lookup).
- `GET /cobranca/recebimentos` sem paginacao nesta fase (sinalizado na UI).
- Renegociacao com step-up e smoke com backend real recomendados manualmente (dev-offline nao
  tem MFA/step-up).

## Commits

- `acca6fc` feat(cobranca): adiciona CobrancaService, modelos e MSW base (F-9.1)
- `5f64789` fix(cobranca): MSW valida existencia, estado e Idempotency-Key como o backend (F-9.1)
- `e8438ae` feat(cobranca): rotas, menu e shell da jornada com roles operacionais (F-9.2)
- `7488f81` fix(cobranca): remove aria-disabled invalido e cobre BACKOFFICE no shell (F-9.2)
- `197bd3c` fix(cobranca): rotas financeiras guardadas, shell navegavel e login FINANCEIRO no mock (F-9.2)
- `357d4fb` feat(cobranca): agenda do tomador, detalhe de parcela e entrada via formalizacao (F-9.3)
- `2960c92` test(cobranca): regression guard do badge de status de parcela (F-9.3)
- `1d875f6` feat(cobranca): agenda financeira e recebimento manual idempotente (F-9.4)
- `14823ad` test(cobranca): cobre conversao de dataRecebimento para ISO UTC (F-9.4)
- `8320349` fix(cobranca): valida lookup de parcela e cobre erros do recebimento (F-9.4)
- `2d9e456` feat(cobranca): inadimplencia, contato manual e proposta de renegociacao (F-9.5)
- `224c77f` test(cobranca): cobre renegociacao 403 sem MFA (sem redirect) (F-9.5)
