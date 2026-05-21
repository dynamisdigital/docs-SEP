# ADR 0013 - Provedor de Assinatura Digital (Clicksign)

## Status

Aceito

## Contexto

A Sprint 11 (Epic 7 parte 2 — Formalizacao Contratual) precisa integrar assinatura digital com validade juridica para a Cedula de Credito Bancario (CCB) emitida pelo SEP. A operacao envolve:

- Geracao de CCB em PDF estruturado a partir do contrato aceito (Sprint 10)
- Envio do PDF para signatario unico (tomador) com link de assinatura
- Recebimento de webhook de eventos (`enviado`, `visualizado`, `assinado`, `recusado`, `expirado`)
- Download do PDF assinado com selo/evidencia (`hashSha256` + carimbo de tempo)
- Retencao minima de 10 anos (Resolucao CMN 4.656/2018 Art. 11 + Lei 10.931/2004)

Exigencias regulatorias:

- **Lei 14.063/2020** — admite assinatura eletronica avancada para CCB; ICP-Brasil nao e obrigatoria mas deve ser opcional no provider
- **Lei 10.931/2004** — CCB e titulo executivo extrajudicial; integridade do PDF assinado e prova juridica
- **CMN 4.656/2018** — auditoria reforcada das operacoes financeiras

O spec [`011-sprint-11-formalizacao-assinatura-digital.md`](../specs/fase-2/011-sprint-11-formalizacao-assinatura-digital.md) cita `ADR 0012` como gate desta decisao, mas o numero `0012` ja foi consumido pela ADR `Motor de regras de credito interno`. Esta ADR usa o proximo numero livre (`0013`) e registra a divergencia para futura correcao no spec.

## Decisao

**Adotaremos Clicksign** como provedor primario de assinatura digital, integrado via [Provider Pattern (ADR 0004)](0004-provider-pattern-para-integracoes-externas.md):

- Port `AssinaturaDigitalProvider` em `contratos.application.port.out`
- Adapter real `ClicksignAssinaturaDigitalProvider` em `contratos.infrastructure.adapter.assinatura`
- Stub `FakeAssinaturaDigitalProvider` para dev local e testes da camada `application`
- Integration test `ClicksignAssinaturaDigitalProviderIT` com WireMock (ADR 0008)

Selecao por property `app.assinatura.provider=clicksign|fake` com `@ConditionalOnProperty`.

## Alternativas consideradas

- **Clicksign** — API REST documentada, sandbox gratuito, webhooks HMAC-SHA-256, suporte a assinatura eletronica avancada + ICP-Brasil opcional, planos por volume. Preco mais competitivo no segmento PME. **ESCOLHIDO**.
- **D4Sign** — API REST, webhooks, validade juridica equivalente. Descartada nesta rodada por custo por assinatura ligeiramente superior e sandbox menos confortavel; mantida como segundo provider em caso de necessidade futura (Provider Pattern permite trocar/coexistir).
- **DocuSign Brasil** — provider global maduro, mas custo significativamente maior e foco em mercado corporativo. Descartado por custo.
- **ZapSign** — API REST, custo baixo, mas oferta de evidencia juridica para CCB ainda em amadurecimento; descartado para esta rodada e revisitavel.

## Consequencias

### Positivas
- Integracao economicamente viavel desde o lancamento PME
- Webhook HMAC + idempotencia compativeis com padrao da Sprint 4 (`RegistrarWebhookEventUseCase`, `HmacSignatureValidator`)
- Sandbox permite WireMock fixtures realistas
- Provider Pattern permite adicionar D4Sign/DocuSign como segundo provider sem mudanca de dominio (path param `{provider}` no webhook ja prepara extensibilidade)

### Negativas
- Lock-in operacional: trocar provider exige migracao de envelopes em aberto (mitigado por Provider Pattern + ausencia de transacao em curso na troca)
- Sandbox da Clicksign tem rate limit baixo; testes E2E rodam contra `FakeAssinaturaDigitalProvider` ou WireMock; sandbox real fica para validacao manual pre-producao
- ICP-Brasil opcional gera custo extra por assinatura — habilitado caso a caso na fase de producao

### Neutras
- Evidencia juridica (`AuthenticatedDocument`/`signed.pdf`) baixada apos `ASSINADO` substitui o PDF original — armazenado em `documento_assinado.conteudo` (BYTEA) com `hashSha256` calculado pelo SEP (nao pelo provider) para garantia de integridade local

## Implementacao

- Properties em `application.yml` (perfil `dev` usa `fake`, `prod`/`homologacao` usa `clicksign`):

```yaml
app:
  assinatura:
    provider: clicksign
    clicksign:
      base-url: https://sandbox.clicksign.com
      access-token: ${CLICKSIGN_ACCESS_TOKEN}
      webhook:
        hmac-secret: ${CLICKSIGN_WEBHOOK_HMAC_SECRET}
      timeout-ms: 5000
      retry:
        max-attempts: 3
        wait-duration-ms: 500
```

- Resilience4j: `assinaturaClicksign` circuit breaker + retry para 5xx/IOException
- Endpoints Clicksign usados:
  - `POST /api/v1/documents` — cria documento + envelope
  - `POST /api/v1/lists` — agrupa signatarios
  - `GET /api/v1/documents/{key}` — status + download evidencia
- Webhook path: `POST /api/v1/webhooks/assinatura/clicksign`
- HMAC header: `Content-Hmac` (formato `sha256=<hex>`) — validado por `ClicksignWebhookValidator` (ou validator generico se compativel)

## Riscos conhecidos e mitigacao

| Risco | Mitigacao |
|-------|-----------|
| Indisponibilidade do provider durante envio | Circuit breaker; envio reagendavel via `POST /contratos/{id}/assinar` (idempotente por `contratoId + numeroVersao`) |
| Webhook duplicado / fora de ordem | Idempotencia por `(envelopeId, idEventoExterno)` + `RegistrarWebhookEventUseCase` |
| HMAC vazado | Secret em variavel de ambiente; rotacao documentada no `CCB.md` |
| Mudanca de API do provider | DTOs do port em linguagem de dominio; adapter encapsula breaking changes |
| Necessidade futura de ICP-Brasil obrigatoria | Property `app.assinatura.clicksign.exigir-icp-brasil=true` ja prevista; sem mudanca de codigo |

## Referencias

- [PRD §11 — Provider Pattern + modulo contratos](../docs-sep/PRD.md)
- [PRD §22 Sprint 11](../docs-sep/PRD.md)
- [Spec 011 — Sprint 11 (gate desta ADR)](../specs/fase-2/011-sprint-11-formalizacao-assinatura-digital.md)
- [ADR 0004 — Provider Pattern](0004-provider-pattern-para-integracoes-externas.md)
- [ADR 0008 — WireMock para integration tests](0008-wiremock-para-testes-integracao-celcoin.md)
- Lei 10.931/2004 (Cedula de Credito Bancario)
- Lei 14.063/2020 (Assinatura eletronica para atos publicos)
- Clicksign API: https://developers.clicksign.com/

## Divergencia conhecida

O spec 011 referencia esta decisao como `ADR 0012`, mas a numeracao foi ajustada para `0013` porque `0012` ja era `Motor de regras de credito interno`. Atualizar o spec 011 no fechamento da Sprint 11 (Task 11.10).
