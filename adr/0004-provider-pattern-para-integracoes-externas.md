# ADR 0004 - Provider Pattern para Integracoes Externas

## Status

Aceito (2026-04-27)

## Contexto

O produto SEP precisa integrar com o ecossistema Celcoin BaaS para materializar capacidades obrigatorias (KYC/KYB, conta escrow, Pix, Open Finance, assinatura digital). O monolito modular tem multiplos modulos que dependem de Celcoin direta ou indiretamente: `onboarding`, `credito`, `contratos`, `cobranca`, `escrow`, `pix`.

Sem um padrao de isolamento, cada modulo chamaria a API Celcoin diretamente, gerando:
- acoplamento forte a uma API externa que pode mudar
- testes de dominio dependentes de rede e credenciais
- dificuldade de trocar provedor (regulatorio, comercial)
- impossibilidade de rodar localmente sem credenciais Celcoin

## Decisao

Adotaremos **Provider Pattern (Hexagonal/Ports & Adapters)** obrigatorio para toda integracao com sistema externo:

- **Interface (port)** em `<modulo>.application.port.out.<X>Provider` — descreve a capacidade em termos de dominio (ex.: `KycProvider.validar(documento)`, `EscrowProvider.criarConta(titular)`)
- **Implementacao (adapter)** em `<modulo>.infrastructure.adapter.<X>.Celcoin<X>Provider` — traduz a chamada para a API externa, trata erros tecnicos, aplica idempotencia, retry e circuit breaker via Resilience4j
- **Stub/fake** em `<modulo>.infrastructure.adapter.<X>.Fake<X>Provider` para testes e ambiente local sem credenciais
- escolha do adapter por ambiente via `@ConditionalOnProperty` ou Profile

Provedores previstos por modulo:
- `onboarding` → `KycProvider`, `KybProvider`, `BackgroundCheckProvider`
- `credito` → `OpenFinanceProvider` (Celcoin Finansystech)
- `contratos` → `AssinaturaDigitalProvider`, `CcbProvider`
- `escrow` → `EscrowProvider`
- `pix` → `PixProvider`
- `cobranca` → `BoletoProvider` (futuro)

## Alternativas consideradas

- **Chamadas diretas a Celcoin nos services**: descartado. Acopla, dificulta testes, impossibilita troca de provider.
- **Cliente Celcoin compartilhado em `shared`**: descartado parcialmente. A camada base de adapter HTTP fica em `shared.integration` (RestClient + Resilience4j), mas a logica especifica de cada capacidade fica no modulo dono.
- **Spring Cloud OpenFeign**: descartado. Adiciona dependencia, sem ganho real sobre RestClient para volume atual.
- **Camera anti-corrupcao em modulo separado `celcoin/`**: descartado. Distribui responsabilidade longe do dominio que precisa da capacidade; complica navegacao do codigo.

## Consequencias

### Positivas
- modulos de dominio testaveis sem rede
- possivel rodar local com `Fake<X>Provider` (sem Celcoin)
- adapters HTTP testaveis em CI com WireMock (ver [ADR 0008](./0008-wiremock-para-testes-integracao-celcoin.md)) sem credenciais Celcoin
- troca de provider afeta apenas a camada de adapter
- versionamento da API externa fica encapsulado
- novos providers (futuras integracoes) seguem padrao conhecido

### Negativas
- mais codigo (interface + 2 implementacoes por capacidade)
- requer disciplina para nao "vazar" tipos da API externa (DTOs Celcoin) para o dominio
- mais classes para manter

### Neutras
- estrutura uniforme em todos os modulos

## Implementacao

- PRD §11 (Padrao de Provider Externo)
- PRD §19 (Estrutura de Pacotes — `application.port.out` e `infrastructure.adapter`)
- Spec 001, Task 1.7 cria a base de adapter HTTP em `shared.integration`
- Spec 001, Task 1.8 cria a interface vazia `EscrowProvider` no modulo escrow
- Specs futuras (Epics 5, 6, 7, 8, 14, 15) implementam adapters concretos

## Referencias

- PRD §11, §19
- Spec 001
- "Hexagonal Architecture" - Alistair Cockburn
- "Ports and Adapters" / "Clean Architecture" - Uncle Bob
- ADR 0001 (monolito modular DDD)
- ADR 0008 (WireMock para testes de integracao com Celcoin) — complementa este ADR cobrindo a camada de teste do adapter HTTP
