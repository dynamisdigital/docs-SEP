# ADR 0008 - WireMock para Testes de Integracao com Celcoin

## Status

Aceito (2026-04-27). Estende [ADR 0004](./0004-provider-pattern-para-integracoes-externas.md) sem substituir.

## Contexto

O ADR 0004 estabelece o **Provider Pattern**: cada modulo expoe uma `port.out.<X>Provider` (interface) e tem ao menos duas implementacoes — `Celcoin<X>Provider` (adapter HTTP real) e `Fake<X>Provider` (substituto em Java para testes/dev local).

Isso cria uma boa cobertura para:
- **Camada `application`**: testada com Mockito + `Fake<X>Provider` injetado
- **Smoke contra Celcoin sandbox real**: validacao manual em homologacao

Mas deixa um **gap critico**: como testar o **proprio** `Celcoin<X>Provider` (a parte de HTTP) sem chamar Celcoin?

Sem testar o adapter:
- nao garantimos que a URL esta correta
- nao garantimos que headers OAuth, `Idempotency-Key`, `correlationId` sao enviados como esperado
- nao garantimos que parsing de respostas (sucesso, erro 4xx, erro 5xx) funciona
- nao garantimos que retry/circuit breaker via Resilience4j atua corretamente em cenarios HTTP especificos
- testes de integracao dependeriam de credenciais Celcoin, secrets em CI, e sandbox que pode ter rate limit ou side effects

## Decisao

Adotar **WireMock 3.x** como ferramenta padrao para testes de integracao dos adapters HTTP de Celcoin (e qualquer outra integracao externa futura).

WireMock e um servidor de stub HTTP que intercepta chamadas em uma porta local e responde com payloads canned. Ele complementa — nao substitui — o `Fake<X>Provider`.

### Camadas de teste consolidadas

| Camada | Ferramenta | Testa o que |
|--------|------------|-------------|
| `application/usecase` | Mockito + `@MockitoExtension` | Logica de negocio pura |
| `application` com fake | `Fake<X>Provider` injetado | Comportamento de aplicacao com substituto deterministico |
| `infrastructure.adapter` | **WireMock + `@WireMockTest`** | **HTTP wiring real do `Celcoin<X>Provider`** |
| End-to-end sandbox | Manual / smoke em homologacao | Confianca contra Celcoin real |

### Padroes de uso

1. **Integration tests dos adapters**: cada `Celcoin<X>Provider` tem um `Celcoin<X>ProviderIT.java` correspondente que usa WireMock para simular Celcoin
2. **Stubs em arquivos JSON**: `src/test/resources/wiremock/<provider>/mappings/*.json` com matchers + responses, permitindo reuso entre testes
3. **Scenarios para cenarios sequenciais**: rate limit, retry, circuit breaker, paginacao
4. **Profile dev `local-wiremock`**: aplicacao roda apontando para WireMock standalone, permitindo desenvolvimento Frontend sem credenciais Celcoin
5. **Recording mode (follow-up)**: capturar traffic real do sandbox Celcoin com credenciais e gerar mappings automaticos para reuso offline

## Alternativas consideradas

- **Manter apenas `Fake<X>Provider`**: descartado. Deixa o adapter HTTP nao testado. Bugs de URL, headers e parsing so apareceriam contra Celcoin real, frequentemente em homologacao ou producao.
- **Testar adapter direto contra Celcoin sandbox em CI**: descartado. Exige credenciais como secrets do GitHub Actions, depende de SLA do sandbox, side effects acumulam (contas test sujas), rate limit.
- **MockServer**: alternativa viavel. WireMock tem comunidade maior, sintaxe mais fluida e melhor integracao com JUnit 5/Spring Boot.
- **OkHttp MockWebServer**: simples mas pobre em features (sem scenarios, sem recording, sem stub priorities). Inadequado para integracoes complexas como Celcoin.
- **Spring Cloud Contract**: focado em consumer-driven contract testing entre microservicos da casa. Nao serve para mockar provider externo.
- **Pact**: complementar (validacao de contrato), nao substituto.

## Consequencias

### Positivas
- Adapter HTTP do Celcoin testado deterministicamente em CI
- Captura regressoes de contrato cedo (se Celcoin mudar API, stubs divergem)
- Dev Frontend pode trabalhar com adapter real backeado por WireMock, sem credenciais Celcoin (profile `local-wiremock`)
- CI sem secrets de Celcoin ou rate limits
- Stubs JSON viram documentacao executavel do contrato Celcoin
- Recording mode (futuro) permite capturar traffic real e replicar offline

### Negativas
- Mais uma dependencia de teste no `build.gradle` (~5MB JAR)
- Curva de aprendizado para o time (matchers, scenarios, fixtures)
- Stubs podem driftar do real Celcoin se nao forem atualizados periodicamente
- Risco de "verde em CI mas vermelho em prod" se Celcoin tiver comportamento sutilmente diferente do stub — mitigado por smoke test manual contra sandbox em cada release

### Neutras
- Setup pequeno: ~30 min para configurar dependencia e estrutura inicial em Sprint 1 Task 1.1b
- Padrao replicado para todos os providers Celcoin (KYC, KYB, Open Finance, Escrow, Pix, etc.)

## Implementacao

### Dependencia (Sprint 1 Task 1.1b)
```gradle
testImplementation 'org.wiremock:wiremock-standalone:3.9.x'
testImplementation 'org.wiremock.integrations:wiremock-spring-boot:3.x'
```

### Estrutura de arquivos
```
src/test/
├── java/com/dynamis/broker_app/
│   └── <modulo>/infrastructure/adapter/<X>/
│       └── Celcoin<X>ProviderIT.java
└── resources/
    └── wiremock/
        └── <provider>/
            ├── mappings/*.json
            └── __files/*.json
```

### Profile `local-wiremock` (opcional, recomendado)
- `application-local-wiremock.yml` aponta `app.celcoin.base-url` para `http://localhost:8089`
- `wiremock/celcoin-mock/mappings/` contem stubs basicos para dev frontend
- Documentado no README

### Cronologia de uso
- **Sprint 1 Task 1.1b**: declaracao da dependencia
- **Sprint 1 Task 1.7**: estrutura de adapter pronta para receber WireMock futuramente
- **Sprint 4 Task 4.4**: primeiro uso real (testar `WebhookController` simulando webhook externo)
- **Epic 5 (Onboarding KYC/KYB)**: primeiro `Celcoin<X>Provider` real com `Celcoin<X>ProviderIT`
- **Epics 6, 7, 8, 14, 15**: padrao replicado por adapter

### Versao
- WireMock `3.9.x` (atual em 2024-2025)
- Compativel com Java 17+, Java 21 OK
- Compativel com Spring Boot 3.x e JUnit 5

## Referencias

- [ADR 0004 - Provider Pattern para Integracoes Externas](./0004-provider-pattern-para-integracoes-externas.md)
- PRD §11 (Stack principal — Testes)
- PRD §18 (Decisoes Consolidadas — Testes)
- Spec 001 Task 1.1b (Dependencias do Gradle)
- Spec 001 Task 1.7 (Estrutura de adapter para integracoes externas)
- WireMock docs: https://wiremock.org/docs/
- WireMock Spring Boot integration: https://github.com/wiremock/wiremock-spring-boot
- docs-sep/Aprendizado Celcoin e SEP/Proposta Tecnica - Implementacao SEP via Celcoin BaaS.md
