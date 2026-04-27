# ADR 0001 - Monolito Modular Orientado a DDD

## Status

Aceito (2026-04-27)

## Contexto

A plataforma SEP precisa cobrir multiplos dominios funcionais (`identity`, `usuarios`, `onboarding`, `credito`, `contratos`, `cobranca`, `escrow`, `backoffice`, `financeiro`, `credores`, `pix`) e quatro jornadas de produto (tomador, credora, financeiro interno, administrador). O time inicial e pequeno (1 Dev Senior + 2 Devs Plenos Frontend), o produto ainda esta em fase de validacao, e nao ha equipes separadas por dominio.

A pergunta arquitetural: comecamos com microservicos ou monolito modular?

## Decisao

Adotaremos **monolito modular orientado a DDD** com `Hexagonal/Ports & Adapters` aplicado dentro de cada modulo.

- 1 deploy Spring Boot
- 1 banco PostgreSQL
- separacao por modulos de dominio (nao por camadas globais como `model`/`repository`/`service`/`controller`)
- cada modulo tem sua arvore interna `domain`, `application`, `infrastructure`, `web`
- microservicos serao reavaliados quando houver gatilho real (escala independente, deploy independente, banco separado por regulacao, ownership por equipe)

## Alternativas consideradas

- **Microservicos desde o inicio**: descartado. Time pequeno, dominios ainda nao estabilizados, custo operacional alto (CI/CD, observabilidade, secrets, deploy distribuido). Risco de "distributed monolith".
- **Camadas globais (`model`/`repository`/`service`/`controller`)**: descartado. Espalha um mesmo dominio entre 4 pacotes diferentes, dificulta refatoracao e fronteiras viram porosas com o tempo.
- **Modular monolith sem DDD explicito**: descartado. Sem ports/adapters, integracoes externas (Celcoin) acabariam acopladas a logica de dominio.

## Consequencias

### Positivas
- velocidade de entrega inicial
- baixo custo operacional (1 deploy, 1 banco)
- refatoracao para microservicos no futuro fica viavel se cada modulo respeitar suas fronteiras
- estrutura DDD ajuda novos desenvolvedores a localizar codigo

### Negativas
- disciplina de fronteiras precisa ser mantida via revisao de codigo (sem checagem automatica entre modulos por enquanto)
- escalar um modulo individualmente exige escalar o monolito todo
- mudanca para microservicos depois exige modelar transacoes distribuidas

### Neutras
- se um modulo crescer demais, pode virar um candidato natural a extracao

## Implementacao

- PRD §11 (Diretriz arquitetural) e §19 (Estrutura de Pacotes)
- Sprint 1, Task 1.1a cria a estrutura inicial de pacotes
- Spec 001 detalha o `package-info.java` por modulo
- ADRs futuros podem registrar decisoes de extracao quando houver gatilho

## Referencias

- PRD §11, §19
- Spec 001
- "Monolith First" - Martin Fowler
- "Modular Monolith" - Simon Brown
