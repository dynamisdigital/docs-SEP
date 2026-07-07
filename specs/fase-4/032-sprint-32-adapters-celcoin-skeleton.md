# Spec 032 - Sprint 32 - Skeleton dos adapters Celcoin/BaaS + WireMock

## Metadados

- **ID da Spec**: 032
- **Titulo**: Sprint 32 - Esqueleto dos adapters reais Celcoin/BaaS (sem ativar)
- **Status**: planejada (ativacao real -> Fase 5)
- **Fase do produto**: Fase 4 - Epic 15 / integracao (preparacao de go-live)
- **Trilha**: Backend (`sep-api`)
- **Origem**: PRD-FASE-4 §35 (Epic 15 - adapters skeleton); PRD-FASE-5 Frente A
- **Depende de**: ports/providers existentes (`KycProvider`, `PldProvider`, assinatura,
  `PixProvider`, `EscrowProvider`), ADR 0004 (Provider Pattern)
- **Desbloqueia**: Fase 5 Frente A (ativacao real Celcoin com credenciais)
- **Responsavel principal**: Dev Senior Backend

## Objetivo

Escrever o **esqueleto dos adapters reais Celcoin/BaaS** (KYC/PLD, assinatura, Pix, escrow) cobertos
por WireMock, mantendo o Provider Pattern e o **Fake como default**. Nenhum adapter real e ligado; a
ativacao e a validacao E2E real dependem de credenciais e ocorrem na Fase 5. O objetivo e reduzir o
risco de go-live materializando o mapeamento request/response contra stubs, sem tocar rede real.

## Escopo

### Em escopo

- Levantar as portas/providers existentes e o contrato Celcoin correspondente por capacidade.
- Criar adapters `Celcoin*Provider` skeleton (mapeamento request/response, DTOs de provider isolados),
  atras de **feature flag por ambiente**, com Fake default em dev/test.
- Configurar WireMock stubs por adapter (sucesso, erro de negocio, timeout) espelhando o contrato.
- Testes de adapter contra WireMock (mapeamento, resiliencia Resilience4j, tratamento de erro), sem
  chamar rede real.
- ADR de estrategia de feature flag de provider por ambiente.
- Documentar o procedimento de ativacao gated (Fase 5) na doc de integracao.

### Fora de escopo

- Ativar qualquer adapter real ou usar credenciais reais (Fase 5).
- Chamar a rede/sandbox Celcoin de verdade.
- Alterar dominio, contratos REST ou regra de negocio dos modulos consumidores.
- Acoplar dominio a DTOs de provider externo (isolamento obrigatorio).

## Tasks de implementacao

1. Levantar portas/providers e mapear o contrato Celcoin por capacidade (KYC/PLD, assinatura, Pix,
   escrow).
2. Criar os adapters `Celcoin*Provider` skeleton (DTOs de provider isolados, mapeamento), atras de
   feature flag com Fake default.
3. Configurar WireMock stubs por adapter (sucesso/erro/timeout) espelhando o contrato.
4. Testes de adapter contra WireMock (mapeamento, resiliencia, erro), sem rede real.
5. Escrever ADR de feature flag de provider por ambiente e documentar a ativacao gated (Fase 5).

## Gates que nao contam como task

- Confirmar baseline `./gradlew check` e que o Fake continua o default em dev/test.
- Confirmar que nenhum teste toca a rede real.
- Checkpoint e PR description da Sprint 32.

## Definition of Done

- Existe adapter skeleton por capacidade Celcoin, isolado por Provider Pattern e feature flag.
- WireMock cobre sucesso/erro/timeout de cada adapter; testes verdes sem rede real.
- Fake permanece o default em dev/test; nenhum adapter real e ativado.
- Dominio nao depende de DTOs do provider.
- ADR de feature flag registrado; ativacao real documentada como escopo da Fase 5.
- `./gradlew check` verde.
