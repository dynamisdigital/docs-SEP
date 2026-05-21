# AGENT.md - Guia para agentes de IA no projeto SEP

Este arquivo e o guia operacional curto para qualquer agente de IA que trabalhe no SEP. Ele nao substitui PRD, ADRs, specs, steps ou docs operacionais: aponta para eles e fixa as regras que evitam divergencia entre repositorios.

## Ordem de leitura

Antes de implementar, revisar codigo ou responder duvidas, leia:

1. [`docs-sep/PRD.md`](docs-sep/PRD.md) - produto, epicos, roadmap e regras macro.
2. [`docs-sep/CONTEXT.md`](docs-sep/CONTEXT.md) - contexto e historico do projeto.
3. Este arquivo (`AGENT.md`) - regras operacionais para agentes.
4. [`AI-ROADMAP.md`](AI-ROADMAP.md) - indice por tipo de tarefa.
5. Spec relevante em `specs/`.
6. Step correspondente em `steps-fase-1/` ou `steps-fase-2/`, quando existir.
7. Docs operacionais em `repos/<repo>/` e ADRs relevantes em `adr/`.

Hierarquia em caso de conflito: PRD + ADRs prevalecem; depois specs; depois steps; depois docs operacionais em `repos/`; por fim `AI-ROADMAP.md` e este arquivo.

## Repositorios

O projeto opera com repos independentes:

- `sep-api` - backend Java + Spring Boot.
- `sep-app` - frontend web Angular.
- `sep-mobile` - mobile Ionic + Angular + Capacitor.
- `docs-SEP` - documentacao consolidada, specs, steps, ADRs, templates e docs especificas por repo.

Documentacao tecnica especifica de codigo fica sempre em `docs-SEP/repos/<repo>/`:

- Backend/API: `docs-SEP/repos/sep-api/`.
- Web: `docs-SEP/repos/sep-app/`.
- Mobile: `docs-SEP/repos/sep-mobile/`.

Nao crie pastas `docs/` dentro de `sep-api`, `sep-app` ou `sep-mobile`. Esses repos devem manter apenas entrypoints minimos, como `README.md` e `CONTRIBUTING.md`, apontando para `docs-SEP`.

## Git e checkpoints

Nos repos de codigo (`sep-api`, `sep-app`, `sep-mobile`):

- Criar branch de sprint a partir de `develop` atualizado com `git pull --ff-only`.
- Usar uma branch por sprint: `feature/<sprint-ou-tema>`.
- Push e PR sao manuais do desenvolvedor humano. Nao executar `git push` nem abrir PR sem pedido explicito.
- Commits seguem Conventional Commits: `feat`, `fix`, `ci`, `chore`, `test`, `docs`, `refactor`.
- Antes de qualquer staging/commit ao concluir uma Task, parar em checkpoint com:
  - `git status --short --branch`;
  - `git diff --stat`;
  - arquivos criados/modificados/removidos;
  - testes/build/lint executados e resultado;
  - riscos/pendencias;
  - sugestao de mensagem de commit.
- Aguardar aprovacao explicita do usuario antes de `git add` e `git commit`.
- Usar `git add <paths-especificos>`, nunca `git add -A`.

No repo `docs-SEP`:

- Toda operacao git e manual.
- O agente pode editar arquivos no working tree, mas nao cria branch, nao comita, nao faz push e nao faz reset/rebase/merge.
- Sempre preservar mudancas existentes do usuario. Se houver arquivos modificados fora do escopo, ignorar.

## Arquitetura e stack

Backend:

- Java 21, Spring Boot 3.5.x, Gradle, PostgreSQL 16, Hibernate 6.x.
- JWT com Spring Security, BCrypt, Flyway, Springdoc OpenAPI, Actuator.
- MapStruct para mapeamento.
- RestClient para integracoes externas; WebClient apenas quando streaming justificar.
- Resilience4j para circuit breaker/retry/timeout.
- Micrometer + Prometheus para metricas.
- Testes com JUnit 5, AssertJ, Mockito, Testcontainers quando aplicavel e WireMock para adapters HTTP externos.

Arquitetura backend obrigatoria:

- Monolito modular DDD, sem microservicos nesta fase.
- Hexagonal/Ports & Adapters por modulo.
- Pacotes por modulo: `domain`, `application`, `application.port.out`, `infrastructure`, `web`.
- `domain` nao depende de Spring/JPA.
- `web` chama use cases; nao acessa infrastructure diretamente.
- Integracoes externas seguem Provider Pattern: port em `application.port.out`, fake para dev/test e adapter real em `infrastructure.adapter`.

Frontend e mobile:

- Web: Angular 20.x, Standalone Components, Signals, SCSS puro, sem framework CSS pronto.
- Mobile: Ionic 8.4+ + Angular 20.x + Capacitor 6, SCSS puro.
- Design Apple em superficies publicas web (`DESIGN-apple.md`).
- Design Notion em superficies autenticadas web e em todo mobile (`DESIGN-notion.md`).

## Marco regulatorio

O SEP opera sob a Resolucao CMN 4.656/2018. Trate como requisitos de produto e arquitetura:

- KYC/KYB obrigatorio.
- Segregacao patrimonial via conta escrow.
- PLD com consultas e trilha auditavel.
- Auditoria reforcada de operacoes financeiras, contratos e acessos administrativos.
- Retencao legal de documentos financeiros/contratuais conforme docs operacionais.

A integracao com Celcoin/BaaS e outros provedores deve ficar isolada por Provider Pattern e coberta por fake + WireMock quando houver adapter HTTP.

## Manutencao documental

Atualize `AI-ROADMAP.md` no mesmo ciclo quando criar, mover, remover ou alterar finalidade de:

- documentacao relevante;
- specs;
- steps;
- ADRs;
- docs de modulo;
- collections;
- templates;
- estrutura de repos.

Docs globais de produto, contexto, seguranca transversal e operacao cross-repo ficam em `docs-SEP/docs-sep/`. ADRs ficam em `docs-SEP/adr/`. Specs ficam em `docs-SEP/specs/`. Steps ficam em `docs-SEP/steps-fase-1/` ou `docs-SEP/steps-fase-2/`.

## Como trabalhar

Para implementacao:

1. Leia o pacote do `AI-ROADMAP.md` para o tipo de tarefa.
2. Confirme spec, step, ADRs e doc operacional do modulo.
3. Verifique se a mudanca altera contrato REST, migration, evento, provider, collection, seguranca ou docs.
4. Implemente seguindo os padroes existentes do repo.
5. Rode testes proporcionais ao risco.
6. Atualize docs/collections quando comportamento ou contrato mudar.
7. Pare no checkpoint antes de commit.

Para code review:

- Priorize bugs, regressao comportamental, seguranca, autorizacao/ownership, transacoes, migrations, falta de testes e divergencia documental.
- Apresente findings primeiro, com arquivo/linha quando possivel.

## Nao faca

- Nao assuma regra de negocio sem fonte documental ou codigo atual.
- Nao duplique conteudo longo do PRD/specs dentro do roadmap ou docs operacionais.
- Nao crie documentacao tecnica local dentro dos repos de codigo.
- Nao acople dominio a DTOs de provider externo.
- Nao introduza microservicos, frameworks CSS prontos ou nova stack sem ADR.
- Nao reverta mudancas que nao foram feitas por voce.
- Nao execute comandos destrutivos sem pedido explicito do usuario.

## Referencias principais

- [`docs-sep/PRD.md`](docs-sep/PRD.md)
- [`docs-sep/CONTEXT.md`](docs-sep/CONTEXT.md)
- [`AI-ROADMAP.md`](AI-ROADMAP.md)
- [`adr/`](adr/)
- [`specs/`](specs/)
- [`steps-fase-1/`](steps-fase-1/)
- [`steps-fase-2/`](steps-fase-2/)
- [`repos/`](repos/)
