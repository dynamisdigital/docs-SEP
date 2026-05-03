# ADR 0006 - MapStruct Substitui ModelMapper

## Status

Aceito (2026-04-27). Substitui a decisao anterior de usar ModelMapper.

## Contexto

A versao inicial do PRD especificava `ModelMapper` como biblioteca de mapeamento entre DTOs e entidades. Apos analise do plano de melhorias, decidiu-se reavaliar essa escolha contra alternativas modernas.

ModelMapper:
- usa reflexao em runtime
- mapeamentos implicitos podem mascarar erros (ex.: campo renomeado nao quebra build)
- performance significativamente pior em larga escala
- debugging dificil (stacktrace passa por reflexao)

MapStruct:
- annotation processor que gera codigo Java em build time
- type-safe: mapeamentos errados quebram compilacao
- zero overhead em runtime (codigo gerado e equivalente a if/else manual)
- suporta records nativamente (Java 21)
- ecossistema Spring bem integrado via `componentModel = "spring"`

## Decisao

Substituir **ModelMapper por MapStruct** em todo o projeto. Mappers ficam em `<modulo>.web.mapper.<X>Mapper.java` (interface anotada com `@Mapper(componentModel = "spring")`).

## Alternativas consideradas

- **Manter ModelMapper**: descartado pelos problemas acima.
- **Mapeamento manual sem biblioteca**: descartado para mappers complexos (multiplos campos, agregacoes); aceitavel para mapeamentos triviais de 2-3 campos.
- **JMapper, Orika, outras**: descartado. MapStruct e o padrao de mercado atual.

## Consequencias

### Positivas
- erros de mapeamento aparecem em build, nao em runtime
- performance superior
- codigo gerado pode ser inspecionado em `build/generated/`
- integracao com records Java 21

### Negativas
- adiciona um annotation processor ao build
- requer entender a sintaxe do MapStruct (`@Mapping`, `@MappingTarget`, etc.)
- IDE precisa estar configurada para mostrar codigo gerado

### Neutras
- mapper agora e interface (nao classe), o que muda padrao mental

## Implementacao

- PRD §11 (Stack principal — MapStruct substitui ModelMapper)
- PRD §18 (Decisoes Consolidadas)
- Spec 001, Task 1.1b inclui MapStruct no Gradle (`org.mapstruct:mapstruct:1.6.x` + annotation processor)
- Spec 002, Task 2.2 implementa `UsuarioMapper` via MapStruct

## Referencias

- PRD §11, §18
- Spec 001, Spec 002
- https://mapstruct.org/
