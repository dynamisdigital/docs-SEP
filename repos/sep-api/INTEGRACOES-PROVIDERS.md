# INTEGRACOES-PROVIDERS — sep-api

Documento operacional dos providers externos (Provider Pattern, ADR 0004). Criado na Sprint 32:
inventario, matriz de cobertura, feature flags por ambiente (ADR 0017), fixtures WireMock, smoke
local e procedimento de ativacao gated da Fase 5.

> Specs/steps: [`032`](../../specs/fase-4/032-sprint-32-adapters-celcoin-skeleton.md) +
> [`steps 032`](../../steps-fase-4/backend/032-sprint-32-steps.md). ADRs: 0004 (Provider Pattern),
> 0008 (WireMock), 0013 (Clicksign — **vinculante**: assinatura nao tem adapter Celcoin),
> [0017](../../adr/0017-feature-flags-de-providers-por-ambiente.md) (flags por ambiente).
>
> **Todos os contratos HTTP sao skeletons locais da Fase 4** — rotas/campos assumidos e validados
> por WireMock, NAO certificados contra as APIs reais. Certificacao e gate da Fase 5 (§Ativacao).

## Inventario por capacidade (pos-Sprint 32)

| Capacidade | Port (application.port.out) | Fake (default) | Adapter HTTP | Flag | Resilience instance | IT WireMock |
|---|---|---|---|---|---|---|
| KYC | `KycProvider` | `FakeKycProvider` | `CelcoinKycProvider` | `app.kyc.provider` | `celcoin-kyc` | `CelcoinKycProviderIT` (11) |
| KYB | `KybProvider` | `FakeKybProvider` | `CelcoinKybProvider` | `app.kyb.provider` | `celcoin-kyb` | `CelcoinKybProviderIT` (10) |
| PLD | `BackgroundCheckProvider` | `FakeBackgroundCheckProvider` | `CelcoinBackgroundCheckProvider` | `app.pld.provider` | `celcoin-background-check` | `CelcoinBackgroundCheckProviderIT` (9) |
| Assinatura | `AssinaturaDigitalProvider` | `FakeAssinaturaDigitalProvider` | `ClicksignAssinaturaDigitalProvider` (**ADR 0013**) | `app.assinatura.provider` | `clicksign-assinatura` | `ClicksignAssinaturaDigitalProviderIT` (15) |
| Pix | `PixProvider` | `FakePixProvider` | `CelcoinPixProvider` | `app.pix.provider` | `celcoin-pix` | `CelcoinPixProviderIT` (21) |
| Escrow | `EscrowProvider` | `FakeEscrowProvider` | `CelcoinEscrowProvider` | `app.escrow.provider` | `celcoin-escrow` | `CelcoinEscrowProviderIT` (11) |

Transversais: OAuth2 client-credentials com cache por credencial (`CelcoinOAuthTokenProvider`
compartilhado em onboarding + token providers dedicados de Pix/Escrow); `RestClientFactory`
(connect 10s / read 30s); `IdempotencyKeyInterceptor` + correlation id via MDC;
`ProviderFlagsValidator` (fail-fast de flag no boot, antes de qualquer singleton);
`ProviderRetryConfig` (predicate de retry compartilhado, 6 instances). Adjacentes fora do escopo
da Sprint 32: `OpenFinanceProvider` (Sprint 9) e notificacoes Zenvia (ADR 0014).

## Matriz de cobertura (fechada na Sprint 32)

| Criterio | KYC | KYB | PLD | Assinatura | Pix | Escrow |
|---|---|---|---|---|---|---|
| Sucesso/mapeamento | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| 4xx sem retry | ✔ | ✔ | ✔ | ✔ (32.4) | ✔ (32.5) | ✔ (32.5) |
| 5xx com retry (3) | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Timeout/IO com retry | ✔ (32.3) | ✔ (32.3) | ✔ (32.3) | ✔ (32.4) | ✔ (32.5) | ✔ (32.5) |
| Malformed/vazio → falha clara sem retry | ✔ (32.3) | ✔ (32.3) | ✔ (32.3; corpo sem `results` NUNCA vira "sem hits") | ✔ | ✔ | ✔ (32.5) |
| Bearer/OAuth + cache de token | ✔ | ✔ | ✔ | ✔ (token estatico) | ✔ | ✔ |
| Correlation id | ✔ | ✔ | ✔ | ✔ (32.4) | ✔ (32.5) | ✔ (32.5) |
| Idempotency-Key | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Sanitizacao (sem PII/doc/chave/PDF/body em erro) | ✔ (32.3) | ✔ (32.3) | ✔ (32.3) | ✔ (32.4) | ✔ | ✔ (32.5) |
| Fail-fast de configuracao (ctor cita property, sem segredo) | ✔ (32.3) | ✔ (32.3) | ✔ (32.3) | ✔ | ✔ | ✔ |
| Fake default + selecao explicita (wiring real) | ✔ (32.2) | ✔ | ✔ | ✔ | ✔ | ✔ |

### Politica de retry (ProviderRetryConfig + ADR 0017)

Retry **somente em falha transiente**, uniforme nas 6 instances:
- Reentra: timeout/IO (`IOException` na causa, inclusive o wrap generico do RestClient) e 5xx
  traduzido (`ProviderHttpFault.isServerError()`).
- NAO reentra: 4xx traduzido, resposta HTTP crua (`RestClientResponseException` — 5xx cru segue
  pelo YAML), parsing invalido (Jackson) e resposta malformada (`IllegalStateException`).
- Follow-ups de 4xx-reentra das Sprints 11/19 **fechados** (32.4/32.5).

## Feature flags e fail-fast (ADR 0017)

- 6 flags independentes, defaults `fake`; `matchIfMissing=true` so no fake; adapter HTTP exige
  selecao explicita; `app.assinatura.provider` aceita apenas `fake|clicksign`.
- `ProviderFlagsValidator` (BeanFactoryPostProcessor): valor desconhecido derruba o boot citando
  property/valor/aceitos — nunca credencial. Adapter selecionado sem base-url/credencial falha no
  ctor citando a property.
- Guards permanentes: `ProviderWiringTest`, `ProviderFlagsValidatorTest`, `ProvidersFakeDefaultIT`
  (contexto test = 1 bean por port, todos fakes), `LocalWiremockProfileTest` (dev/test seguem
  fake; local-wiremock so localhost + credencial ficticia), `WireMockFixturesGuardTest` (fixtures
  sem host/segredo real).

## Fixtures e smoke local

Fixtures reutilizaveis em `sep-api/src/test/resources/wiremock/{onboarding,assinatura,pix,escrow}/`
(sucesso; falhas opt-in por header `X-Simular: erro-negocio|timeout`) — ver o README de la para o
passo a passo do WireMock standalone (portas 9091-9094) + profile **opt-in** `local-wiremock`
(`SPRING_PROFILES_ACTIVE=dev,local-wiremock`). Os ITs de adapter usam stubs inline (cenarios
dinamicos de retry/erro).

## Ativacao gated (Fase 5 — Frente A) e rollback

Por capacidade, nesta ordem (nenhum passo pulavel):

1. **Credencial sandbox liberada** (gate externo; secrets por ambiente, nunca versionados).
2. **Skeleton confrontado com a documentacao real** do provider (rotas, campos, status, erros);
   divergencias corrigidas no adapter + fixtures + ITs.
3. **Smoke sandbox controlado** (dados de teste do provider; valores minimos; sem cliente real).
4. **Observabilidade/auditoria verificadas** (logs sanitizados, correlation, retries/CB, trilha
   `audit_log_seguranca` da capacidade).
5. **Promocao por flag de ambiente** (`aws-develop` -> homolog -> prod) com rollback documentado:
   voltar a flag anterior e reiniciar. **Fallback silencioso para fake em producao e proibido**
   (ADR 0017) — falha de adapter real deve ser visivel.

## Testes (mapa rapido)

- Wiring/flags: `ProviderWiringTest`, `ProviderFlagsValidatorTest`, `ProvidersFakeDefaultIT`,
  `LocalWiremockProfileTest`, `WireMockFixturesGuardTest`.
- Retry: `ProviderRetryConfigTest`.
- Adapters (WireMock): `CelcoinKycProviderIT`, `CelcoinKybProviderIT`,
  `CelcoinBackgroundCheckProviderIT`, `ClicksignAssinaturaDigitalProviderIT`,
  `CelcoinPixProviderIT`, `CelcoinEscrowProviderIT`, `CelcoinOAuthTokenProviderIT`,
  `CelcoinOAuthCrossProviderIT`.
- Fakes: `Fake{Kyc,Kyb,BackgroundCheck,AssinaturaDigital,Pix,Escrow}ProviderTest`.
