# Sprint 32 — Consolidacao dos adapters externos skeleton (Epic 15 / integracao)

> Branch: `feature/sprint-32-adapters-externos-skeleton` -> `develop`.
> Spec: [`specs/fase-4/032-sprint-32-adapters-celcoin-skeleton.md`](../../specs/fase-4/032-sprint-32-adapters-celcoin-skeleton.md) · Steps: [`steps-fase-4/backend/032-sprint-32-steps.md`](../../steps-fase-4/backend/032-sprint-32-steps.md).

## O que entrega

Consolida e endurece os adapters HTTP skeleton existentes (KYC/KYB/PLD Celcoin, assinatura
Clicksign — ADR 0013, Pix e escrow Celcoin) sem criar adapter novo, sem tocar dominio/REST/
migration e **sem ativar nada real** (fake segue default; ativacao = Fase 5 gated). Fecha o
recorte backend da Fase 4.

- **ADR 0017** (feature flags de providers por ambiente): flags independentes, fake default,
  selecao explicita, fail-fast, rollback gated, proibicao de fallback silencioso e de flag
  global; `app.assinatura.provider` aceita apenas `fake|clicksign`.
- **`ProviderFlagsValidator`** (BeanFactoryPostProcessor): valor desconhecido de flag derruba o
  boot com mensagem clara ANTES de qualquer singleton; nunca cita credencial.
- **`ProviderRetryConfig`** (predicate compartilhado nas 6 instances): retry somente em falha
  transiente — timeout/IO (inclusive o wrap generico do RestClient) e 5xx traduzido via marcador
  `ProviderHttpFault`; 4xx, parsing (Jackson) e resposta malformada nao reentram. **Fecha os
  follow-ups de retry-em-4xx documentados desde as Sprints 11/19** (clicksign, pix, escrow).
- **Hardening minimo por gap comprovado** (matriz em
  [`INTEGRACOES-PROVIDERS.md`](./INTEGRACOES-PROVIDERS.md)): fail-fast de base-url no ctor de
  KYC/KYB/PLD; resposta malformada falha claro sem retry — em PLD, corpo sem `results` virava
  "sem hits" (falso limpo, risco CMN 4.656); em KYC, resposta sem `verification_id` virava NPE.
- **Fixtures WireMock reutilizaveis** por capacidade (sucesso/erro-negocio/timeout via header
  `X-Simular`, dados 100% ficticios) + **profile opt-in `local-wiremock`** (adapters explicitos,
  base-urls somente localhost, credenciais ficticias) + README de smoke standalone.
- **Guards permanentes**: wiring real das flags (fake default/selecao/fail-fast sem segredo),
  profile local-wiremock e dev/test 100% fake, fixtures sem host/segredo real, contexto test com
  exatamente 1 bean por port (todos fakes).

## Cobertura consolidada (por capacidade: sucesso, 4xx sem retry, 5xx retry, timeout, malformed, OAuth, correlation, idempotencia, sanitizacao, fail-fast)

| Suite | Antes -> Depois |
| ----- | --------------- |
| `CelcoinKycProviderIT` | 7 -> 11 |
| `CelcoinKybProviderIT` | 7 -> 10 |
| `CelcoinBackgroundCheckProviderIT` | 7 -> 9 |
| `ClicksignAssinaturaDigitalProviderIT` | 11 -> 15 |
| `CelcoinPixProviderIT` | 19 -> 21 (2 asserts de 4xx passaram de 3 -> 1 tentativa) |
| `CelcoinEscrowProviderIT` | 7 -> 11 |
| Novos | `ProviderWiringTest` (9), `ProviderFlagsValidatorTest` (5), `ProviderRetryConfigTest` (7), `LocalWiremockProfileTest` (5), `WireMockFixturesGuardTest` (2), `ProvidersFakeDefaultIT` (1) |

## Invariantes provados

- Zero mudanca em `web/`, `domain/`, `usecase/` e `db/migration` (diff da branch); zero endpoint/
  DTO/OpenAPI funcional alterado.
- Fake default comprovado por wiring + contexto completo; nenhum teste toca rede real (base-urls
  de teste sempre WireMock local; guard de fixtures).
- Clicksign permanece a decisao de assinatura (ADR 0013); `assinatura=celcoin` e rejeitado no boot.
- Nenhuma credencial real versionada; profile local-wiremock e opt-in e localhost-only.

## Docs

`INTEGRACOES-PROVIDERS.md` (novo — matriz, flags, retry, fixtures, smoke, **procedimento de
ativacao gated da Fase 5 com rollback**), ADR 0017 (novo), notas nos docs de modulo
(ONBOARDING/PLD/CONTRATOS/PIX — follow-up de retry marcado como fechado), `AI-ROADMAP.md`.

## Commits

1. `feat(integracoes): endurecer selecao de providers`
2. `fix(integracoes): validar flags antes dos singletons` (code review 32.2)
3. `test(onboarding): consolidar skeletons Celcoin`
4. `fix(integracoes): blindar predicate contra causa circular` (code review 32.3)
5. `test(contratos): consolidar skeleton Clicksign`
6. `test(financeiro): consolidar skeletons Pix e escrow`
7. `test(integracoes): consolidar fixtures WireMock`
8. `test(integracoes): endurecer guard de fixtures` (code review 32.6)
