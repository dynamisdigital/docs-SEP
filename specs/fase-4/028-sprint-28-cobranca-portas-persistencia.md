# Spec 028 - Sprint 28 - Extracao de portas de persistencia de cobranca

## Metadados

- **ID da Spec**: 028
- **Titulo**: Sprint 28 - Portas de persistencia do modulo `cobranca` (ADR 0007)
- **Status**: planejada
- **Fase do produto**: Fase 4 - follow-up de arquitetura (divida aceita da Fase 3)
- **Trilha**: Backend (`sep-api`)
- **Origem**: PRD-FASE-4 §35 (follow-up 3); `COBRANCA.md §limitacoes`; decisao do review da Sprint 24
- **Depende de**: modulo `cobranca` (Sprints 12-13, 23-24) integrado em `develop`
- **Desbloqueia**: aderencia plena ao Hexagonal/ADR 0007 no modulo `cobranca`
- **Responsavel principal**: Dev Senior Backend

## Objetivo

Refatorar o modulo `cobranca` para que os use cases dependam de **portas de saida**
(`application.port.out`) em vez de repositorios JPA de `infrastructure.persistence`. Hoje 14/14 use
cases injetam repositorios direto, contrariando o ADR 0007. Refactor module-wide, **sem mudanca de
comportamento nem de contrato REST**.

## Escopo

### Em escopo

- Mapear os use cases de `cobranca` e os repositorios que cada um consome.
- Definir portas de saida para os agregados/consultas: parcela, agenda, recebimento e renegociacao.
- Implementar adapters de persistencia em `infrastructure` que satisfazem as portas (delegando aos
  repositorios JPA atuais).
- Refatorar os use cases para depender das portas.
- Ajustar os testes: unit mocka portas; integracao continua validando persistencia real.
- Preservar assinatura publica, contratos REST, eventos e auditoria.

### Fora de escopo

- Alterar contrato REST, DTOs, regra de negocio, mora/multa/status ou eventos.
- Criar migration, tabela ou coluna.
- Refatorar outros modulos (o padrao pode ser referencia, mas o escopo e `cobranca`).
- Otimizacao de performance/queries alem do necessario para manter comportamento.

## Tasks de implementacao

1. Mapear use cases de `cobranca` e o conjunto de repositorios consumidos por cada um.
2. Definir as portas de saida (`port.out`) para parcela, agenda, recebimento e renegociacao.
3. Implementar os adapters de persistencia em `infrastructure` que satisfazem as portas.
4. Refatorar os use cases de parcela/agenda para depender das portas.
5. Refatorar os use cases de recebimento/renegociacao para depender das portas.
6. Ajustar testes unit (mock de portas) e confirmar integracao verde, sem mudanca de comportamento.
7. Atualizar `COBRANCA.md` (remover divida) e conferir aderencia ao ADR 0007.

## Gates que nao contam como task

- Confirmar cadeia Git e baseline `./gradlew check`.
- Diff de comportamento: contratos REST e respostas identicos antes/depois (smoke).
- Checkpoint e PR description da Sprint 28.

## Definition of Done

- Todos os use cases de `cobranca` dependem de portas `port.out`, nao de repositorios JPA diretos.
- Adapters de persistencia isolam o JPA em `infrastructure`.
- Nenhum contrato REST, evento, auditoria ou regra de negocio muda; `./gradlew check` verde.
- Testes unit passam com portas mockadas; integracao valida persistencia real.
- Divida de portas de persistencia de `cobranca` removida do backlog e do `COBRANCA.md`.
