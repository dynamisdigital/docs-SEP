# Sprint 21 — Pix Recebimento e Conciliacao (Epic 15 parte 3)

Branch: `feature/sprint-21-pix-recebimento-conciliacao` → `develop`.
Spec: [`specs/fase-3/021-sprint-21-pix-recebimento-conciliacao.md`](../../specs/fase-3/021-sprint-21-pix-recebimento-conciliacao.md) · Steps: [`steps-fase-3/backend/021-sprint-21-steps.md`](../../steps-fase-3/backend/021-sprint-21-steps.md).

## Summary

Fecha o Epic 15 backend: recebimento Pix de parcelas com conciliacao automatica e operacao assistida para divergencias. O dinheiro entra via webhook; a baixa passa pelo caminho oficial de `cobranca` (lock, valor devido, status, `Recebimento`, escrow). O `pix` nunca toca entidades/repositorios de `cobranca` — tudo por ports.

## Mudancas por modulo

### `pix`
- **Referencia (`PixReferenciaRecebimento`, V51)**: `txid` deterministico controlado pelo SEP liga a parcela ao webhook. `GerarReferenciaRecebimentoPixUseCase` (Task 21.2): le parcela elegivel via `CobrancaRecebimentoPixQueryPort`, persiste `ATIVA` (anti-orphan + UNIQUE parcial `1 ATIVA por parcela`), pede copia-cola ao `PixProvider.criarCobrancaRecebimento`. Idempotente por parcela.
- **Webhook correlacionado (Task 21.3)**: `EventoWebhookPixNormalizado`/`CelcoinPixWebhookPayload`/`PixWebhookNormalizer` ganham `txid`/`providerReferenciaId`. `ProcessarWebhookPixUseCase` cria `PixRecebimento` (insert isolado em `PixRecebimentoTransacaoService` `REQUIRES_NEW` — corrida na UNIQUE de `end_to_end_id` vira idempotente sem contaminar a tx do webhook), correlaciona por `txid` (fallback `providerReferenciaId`): achou -> `EM_PROCESSAMENTO`; nao achou -> `NAO_IDENTIFICADO`.
- **Baixa via port (Task 21.4)**: `CobrancaRecebimentoPixPort` + `CobrancaRecebimentoPixAdapter` -> `RegistrarRecebimentoUseCase` (`meioPagamento=PIX`, `registradoPor=tomadorId`). `ConciliarRecebimentoPixUseCase` (`REQUIRES_NEW`): baixa + escrow + vinculo atomicos. `Idempotency-Key=pix:<endToEndId>` garante baixa e escrow unicos. Exato + quitada -> referencia `PAGA`; parcial/maior -> baixa aplicada + referencia `DIVERGENTE`; `endToEndId` ausente ou referencia nao-ATIVA -> nao baixa. Falha de baixa -> recebimento `FALHOU` em tx separada; webhook conclui `PROCESSADO` (sem 5xx).
- **REST (Task 21.6)**: `PixRecebimentoController` (`/api/v1/pix/recebimentos`): `POST /referencias` (FINANCEIRO/ADMIN, 201/200, sem step-up), `GET /referencias/{id}` e `GET /{id}` (FINANCEIRO/ADMIN/BACKOFFICE). `Consultar{Referencia,Recebimento}PixUseCase` readOnly. Nunca expoe payload bruto/chave Pix.

### `backoffice` (Task 21.5)
- `PixRecebimentoDivergenteEvent` publicado em toda divergencia; `RecebimentoPixDivergenteListener` (AFTER_COMMIT) cria item idempotente `RECEBIMENTO_PIX_DIVERGENTE`/`PIX_RECEBIMENTO`. `PixRecebimentoObjetoOriginalAdapter` resolve o detalhe (status/valor/parcela). Enums `TipoItemFila`/`TipoEntidadeReferenciada` ampliados.

## Migrations
- `V51` — `pix_referencia_recebimento` + evolucao de `pix_recebimento` (vinculo de conciliacao).
- `V52` — CHECKs de `item_fila_operacional` (`tipo`/`tipo_entidade`) para `RECEBIMENTO_PIX_DIVERGENTE`/`PIX_RECEBIMENTO`. `reprocesso.tipo_chamada` inalterado.

## Decisoes
- **DDD**: baixa de parcela so via port/use case publico de `cobranca`; `StatusParcela` aparece apenas no adapter de infra (resultado projeta `parcelaQuitada` boolean).
- **Transacoes**: insert do recebimento e conciliacao em `REQUIRES_NEW` isolados — corrida/falha nunca derrubam o webhook nem deixam baixa parcial.
- **Minimizacao**: payload bruto fora da persistencia (so hash); chave Pix nunca trafega; item/objeto-original expõem so status/valor/parcela.
- **Reprocesso**: recebimento divergente nao tem reprocesso de provider (o Pix ja entrou) — operacao assistida via assumir/comentar/resolver/ignorar.

## Dividas aceitas / follow-ups
- Self-service do tomador (CLIENTE owner gera referencia da propria parcela) — front das jornadas (web/mobile).
- Reprocesso local de recebimento `FALHOU` (re-rodar conciliacao sem provider) — nao implementado.
- Contrato Celcoin real de cobranca Pix/QR pode exigir ajuste de campos pos-sandbox.

## Test plan
`./gradlew test` verde (suite completa) + `spotlessCheck` limpo. Cobertura nova: `ProcessarWebhookPixRecebimentoTest`, `ConciliarRecebimentoPixUseCaseTest`, `RecebimentoPixDivergenteListenerTest`, `PixRecebimentoObjetoOriginalAdapterTest`, `PixRecebimentoControllerTest` (`@WebMvcTest`), `OpenApiConfigTest`, `PixRecebimentoConciliacaoIT` (smoke E2E full-chain: referencia → webhook → CONCILIADO → parcela PAGA → Recebimento PIX + escrow → replay nao duplica).

## Commits
```
7ef9e4d feat(pix): modelo de referencia Pix de recebimento e vinculo de conciliacao (Task 21.1)
f159510 feat(pix): gerar referencia Pix de recebimento para parcela elegivel (Task 21.2)
02d20b0 fix(pix): @Transactional(readOnly) no adapter de consulta de parcela (Task 21.2)
178d6cb style(pix): aplicar spotless em arquivos da Task 21.2
5b95770 feat(pix): correlacionar webhook RECEBIMENTO_PIX com referencia por txid (Task 21.3)
5ab9926 test(pix): cobrir fallback txid->providerRef no webhook RECEBIMENTO_PIX (Task 21.3)
103f207 fix(pix): persistir vinculo referencia/parcela e isolar insert do recebimento (Task 21.3)
4ff7993 feat(pix): baixar parcela e escrow via port de cobranca na conciliacao Pix (Task 21.4)
3ac7ddb fix(pix): bloquear baixa em referencia Pix nao-ATIVA na conciliacao (Task 21.4)
efda72b feat(pix): gerar item de backoffice para divergencia de recebimento Pix (Task 21.5)
cb4421e feat(pix): REST de referencia/recebimento Pix + smoke E2E de conciliacao (Task 21.6)
57ce6bc test(pix): cobrir 403 e 404 no GET de referencia Pix de recebimento (Task 21.6)
```
