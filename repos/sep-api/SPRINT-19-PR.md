# Sprint 19 — Pix Foundation + EscrowProvider (Epic 15 parte 1)

Branch: `feature/sprint-19-pix-foundation-escrow-provider` -> `develop`.
Spec: `specs/fase-3/019-sprint-19-pix-foundation-escrow-provider.md`. Steps: `steps-fase-3/backend/019-sprint-19-steps.md`.

## Summary

Cria a fundacao backend do modulo `pix` e o `EscrowProvider`, mantendo Celcoin isolado por Provider Pattern (Fake default + adapter Celcoin skeleton com WireMock). Inclui dominio Pix com idempotencia, webhook Pix com HMAC e auditoria reforcada. **Foundation**: sem desembolso real, conciliacao de parcela ou aporte — esses comandos ficam para as Sprints 20/21.

## Mudancas por modulo

**`pix` (novo)**
- `domain`: `PixTransferencia`, `PixRecebimento`, `PixWebhookEvent` + VOs de status + `TipoPixWebhookEvent`; eventos de webhook (recebido/processado/falhou).
- `application.port.out`: `PixProvider` + DTOs; excecoes `PixProviderException`/`PixProviderHttpException`.
- `application.usecase`: `ProcessarWebhookPixUseCase` (idempotencia por `(provider,event_id)`, roteamento por tipo, FALHOU para reprocesso).
- `application.listener`: `PixWebhookAuditListener` (AFTER_COMMIT + REQUIRES_NEW).
- `infrastructure`: `FakePixProvider`, `CelcoinPixProvider` (+ properties, OAuth, DTOs), `PixWebhookNormalizer` (parse + SHA-256 + classificacao, compartilhado fake/celcoin), repositories.
- `web`: `PixWebhookController` (`POST /api/v1/webhooks/celcoin/pix`).

**`escrow`**
- `application.port.out`: `EscrowProvider` (criar/consultar conta e wallet, consultar saldo) + DTOs + excecoes.
- `infrastructure`: `FakeEscrowProvider`, `CelcoinEscrowProvider` (+ properties, OAuth, DTOs).
- `RegistrarMovimentacaoEscrowUseCase` local (Sprint 12) **preservado**.

**`shared`**
- `TipoEventoSeguranca`: +`PIX_WEBHOOK_RECEBIDO`/`PROCESSADO`/`FALHOU`.

**Config (`application.yml`)**
- `app.pix.provider` / `app.escrow.provider` (default `fake`); `app.celcoin.pix.*` / `app.celcoin.escrow.*`; secret `app.webhooks.secrets.celcoin-pix`; Resilience4j instances `celcoin-pix` / `celcoin-escrow`.

## Migrations

- `V45__criar_tabelas_pix_foundation.sql` — `pix_transferencia`, `pix_recebimento`, `pix_webhook_event` (sem FK/CASCADE; UNIQUE de idempotency_key, unique parcial de end_to_end_id, composto (provider,event_id); CHECK status/valor; indices status+data; CHECK payload_hash SHA-256).
- `V46__ampliar_audit_seguranca_tipo_pix.sql` — amplia `chk_audit_seguranca_tipo` com os 3 tipos Pix (forward-only).

## Test plan

- `./gradlew test` — suite completa verde (1561 testes, 0 falhas).
- Novos: `PixDomainTest`, `PixRepositoryTest`, `FakePixProviderTest`, `CelcoinPixProviderIT`, `FakeEscrowProviderTest`, `CelcoinEscrowProviderIT`, `PixWebhookIT`.
- WireMock cobre Celcoin sem credenciais (OAuth Bearer, parsing, map de status, retry 5xx, traducao de erro, Idempotency-Key).

## Decisoes

- Dominio com anotacoes JPA (convencao do repo — todas as entidades sao `@Entity` em `domain.model`).
- `PixWebhookEvent` separado do `WebhookEventLog` shared: persiste so o hash (minimizacao), nao o payload bruto.
- Idempotencia do webhook por `event_id` do payload (sem `Idempotency-Key` no header).
- Erros Celcoin traduzidos para excecoes de provider; sem vazar tipos de framework.
- OAuth fail-fast no boot quando `provider=celcoin`.

## Dividas aceitas / followups (Sprints 20/21)

- Retry roteado por tipo no YAML -> 4xx tambem reentra (tradeoff de skeleton, igual `clicksign-assinatura`); predicate Java fica como follow-up.
- `PIX_TRANSFERENCIA_SOLICITADA` e `ESCROW_*_PROVIDER_CRIADA` nao adicionados (sem use case que os dispare ainda).
- `Wallet.externalId` ausente — necessario quando houver wiring provider->dominio.
- Conciliacao automatica de recebimento com parcela; desembolso real.
- Contrato Celcoin real (endpoints/campos do skeleton validados por WireMock, nao pelo contrato fechado).

## Commits

```
6f6976f feat(pix): adiciona dominio base do modulo Pix com estados operacionais
9a51b75 feat(pix): cria tabelas, repositories e constraints de idempotencia Pix
8ba8e86 fix(pix): reforca invariantes de webhook, hash e valor no dominio Pix
cb01a17 feat(pix): define ports PixProvider e EscrowProvider por Provider Pattern
055e05f feat(pix): adiciona adapters Fake e Celcoin para PixProvider e EscrowProvider
cb93d37 fix(pix): traduz erros Celcoin, fail-fast de credenciais e timeout no OAuth
ed3378c feat(pix): adiciona webhook Pix com HMAC, idempotencia e processamento inicial
6677e7d test(pix): cobre alias HMAC, path FALHOU e correlationId no webhook Pix
9b9c0b3 feat(pix): adiciona auditoria reforcada do webhook Pix
b3c7089 test(pix): asserta auditoria do webhook Pix no caso IGNORADO
```
