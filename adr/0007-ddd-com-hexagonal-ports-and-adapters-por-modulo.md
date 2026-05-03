# ADR 0007 - DDD com Hexagonal/Ports & Adapters por Modulo

## Status

Aceito (2026-04-27)

## Contexto

O ADR 0001 estabelece o monolito modular orientado a DDD. O ADR 0004 estabelece o Provider Pattern para integracoes externas. Este ADR consolida o **padrao interno** de cada modulo: como organizar `domain`, `application`, `infrastructure` e `web`.

Sem um padrao explicito, cada modulo poderia evoluir com estrutura propria, dificultando navegacao para novos desenvolvedores e tornando a migracao para microservicos (se necessaria no futuro) mais cara.

## Decisao

Cada modulo do monolito segue **Hexagonal/Ports & Adapters**:

```
<modulo>/
  domain/
    model/         # entidades, value objects
    event/         # eventos de dominio
    exception/     # excecoes proprias do dominio
    vo/            # value objects (alternativa a model/ se preferir separar)
  application/
    usecase/       # casos de uso (1 classe por use case)
    service/       # servicos de aplicacao (orquestracao)
    port/
      out/         # interfaces para dependencias externas (Provider Pattern)
    exception/     # excecoes de aplicacao (estendendo DomainException)
  infrastructure/
    persistence/   # repositorios JPA, mappings ORM
    adapter/       # implementacoes das portas (Celcoin<X>Provider, Fake<X>Provider)
    config/        # configuracoes Spring especificas do modulo
  web/
    controller/    # controllers REST
    dto/           # DTOs de request/response (preferencialmente records)
    mapper/        # MapStruct mappers
```

Regras:
- `domain` nao depende de Spring nem de JPA (puro Java)
- `application` depende de `domain` e expoe `port.out` para dependencias externas
- `infrastructure` implementa `port.out` e contem dependencias de Spring/JPA/HTTP
- `web` depende de `application` e nunca de `infrastructure` diretamente
- modulos nao acessam `domain` ou `infrastructure` de outros modulos; comunicacao via `application` services publicos ou eventos de dominio

## Alternativas consideradas

- **Camadas globais** (`model`, `repository`, `service`, `controller`): descartado no ADR 0001.
- **Onion Architecture / Clean Architecture sem nome explicito**: equivalente conceitualmente; usar "Hexagonal/Ports & Adapters" da o vocabulario mais comum hoje.
- **Estrutura simples sem `port`/`adapter`**: descartado. Sem `port.out`, integracoes externas (Celcoin) acoplam ao dominio.
- **Sem separacao `usecase`/`service`**: descartado. `usecase` por use case ajuda a manter classes pequenas; `service` complementa quando e orquestracao pura.

## Consequencias

### Positivas
- estrutura uniforme em todos os modulos
- novo dev encontra codigo no mesmo lugar em qualquer modulo
- testes de dominio puros (sem Spring)
- testes de application com mocks dos `port.out`
- possivel extracao para microservico mantendo a estrutura interna

### Negativas
- mais pacotes (overhead de criar arvore por modulo)
- requer disciplina de revisao para nao "vazar" infraestrutura no dominio
- aprendizado para devs nao familiarizados com Hexagonal

### Neutras
- pode ser ajustado por modulo se a complexidade nao justificar (ex.: modulo com 2 entidades pode dispensar separacao `vo/`)

## Implementacao

- PRD §11 (Diretriz arquitetural — Hexagonal/Ports & Adapters)
- PRD §19 (Estrutura de Pacotes detalhada)
- AGENT.md (resumo da arquitetura)
- Spec 001, Task 1.1a cria a estrutura inicial com `package-info.java` documentando cada pacote

## Referencias

- PRD §11, §19
- Spec 001
- ADR 0001 (monolito modular DDD)
- ADR 0004 (Provider Pattern)
- "Hexagonal Architecture" - Alistair Cockburn
- "Implementing Domain-Driven Design" - Vaughn Vernon
