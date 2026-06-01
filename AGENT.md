# AGENT.md - Guia para agentes de IA no projeto SEP

Este arquivo e o guia operacional curto para qualquer agente de IA que trabalhe no SEP. Ele nao substitui PRD, ADRs, specs, steps ou docs operacionais: aponta para eles e fixa as regras que evitam divergencia entre repositorios.

## Ordem de leitura

Antes de implementar, revisar codigo ou responder duvidas, leia:

1. [`docs-sep/PRD.md`](docs-sep/PRD.md) - indice do PRD por fase. Conteudo detalhado em [`PRD-FASE-1.md`](docs-sep/PRD-FASE-1.md), [`PRD-FASE-2.md`](docs-sep/PRD-FASE-2.md) e [`PRD-FASE-3.md`](docs-sep/PRD-FASE-3.md).
2. [`docs-sep/CONTEXT.md`](docs-sep/CONTEXT.md) - indice do contexto consolidado. Conteudo detalhado em [`CONTEXT-PARTE-1.md`](docs-sep/CONTEXT-PARTE-1.md) e [`CONTEXT-PARTE-2.md`](docs-sep/CONTEXT-PARTE-2.md).
3. Este arquivo (`AGENT.md`) - regras operacionais para agentes.
4. [`AI-ROADMAP.md`](AI-ROADMAP.md) - indice por tipo de tarefa.
5. Spec relevante em `specs/`.
6. Step correspondente em `steps-fase-1/` ou `steps-fase-2/`, quando existir.
7. Docs operacionais em `repos/<repo>/` e ADRs relevantes em `adr/`.

Hierarquia em caso de conflito: PRD + ADRs prevalecem; depois specs; depois steps; depois docs operacionais em `repos/`; por fim `AI-ROADMAP.md` e este arquivo.

## Skills obrigatorias

Toda implementacao, refactor, code review ou bugfix nos repos de codigo (`sep-api`, `sep-app`, `sep-mobile`) deve aplicar tres skills de qualidade:

1. **`coding-guidelines`** — 4 regras base:
   - Pensar antes de codar (estado de suposicoes; perguntar quando incerto; surface tradeoffs; discordar com honestidade).
   - Simplicidade primeiro (codigo minimo; sem feature/abstracao especulativa; sem error handling para cenarios impossiveis).
   - Mudancas cirurgicas (tocar apenas o necessario; nao "melhorar" codigo adjacente; respeitar estilo existente).
   - Execucao orientada a meta (criterios verificaveis; teste falha→passa; loop ate verificar).

2. **`clean-code`** — Robert C. Martin:
   - Nomes significativos (classes = substantivo; metodos = verbo; revelar intencao).
   - Funcoes pequenas, fazem uma coisa, nivel de abstracao unico, args minimos, sem efeitos colaterais.
   - Codigo autoexplicativo > comentario; eliminar ruido (comentarios obsoletos, codigo comentado).
   - Metafora do jornal (alto nivel topo, detalhes abaixo); afinidade vertical; Regra do Escoteiro.
   - Excecoes > codigos de erro; nao retornar null (Optional ou caso especial); Lei de Demeter.
   - Testes F.I.R.S.T. (Fast, Independent, Repeatable, Self-validating, Timely).
   - Detectar code smells: rigidez, fragilidade, imobilidade, complexidade desnecessaria.

3. **`design-patterns-java`** — padroes GoF aplicados a Java:
   - Catalogo: Abstract Factory/Factory Method/Singleton; Adapter/Composite/Facade/Proxy; Command/Observer/Strategy/Template Method/Visitor.
   - Programar para interface, nao para implementacao.
   - Composicao > heranca.
   - Triangulacao: aplicar padrao apenas apos 2+ exemplos reais; nao aplicar para problema simples (recusar pattern-itis explicitamente).
   - Preferir recursos Java modernos (interfaces funcionais, `enum` Singleton, `sealed`, `record`) antes de classe-heavy GoF classico.
   - Documentar o *porque* (nao o nome) quando padrao nao for obvio.

### Carregamento por agente

Cada agente carrega as skills da sua propria infra:

- **Claude Code** (Anthropic): skills vivem em `~/.claude/skills/<skill-name>/SKILL.md` (user-level) ou `.claude/skills/<skill-name>/SKILL.md` (repo-level). Invocar via tool `Skill` quando reconhecida; caso contrario, ler o `SKILL.md` diretamente e aplicar como guideline ativa da sessao. Persistir como `feedback` memory para sessoes futuras quando aplicavel.
- **Codex CLI / Codex Cloud** (OpenAI): carregar via mecanismo nativo (custom instructions, arquivo de prompt do usuario, ou equivalente). As tres skills devem estar replicadas no setup do Codex com conteudo equivalente ao deste documento.

Aplicabilidade:
- **Codigo (Java/TypeScript/etc nos 3 repos)**: aplicar as tres skills.
- **`docs-SEP`**: aplicar `clean-code` para clareza textual (nomes claros, sem ruido, secoes objetivas). `design-patterns-java` nao se aplica a documentacao.
- **Excecao**: nao aplicar `design-patterns-java` para scripts triviais, configuracao YAML/JSON ou comandos pontuais — `coding-guidelines` + `clean-code` bastam.

Conflito entre as skills: prevalece `coding-guidelines` (simplicidade + cirurgico vence padrao GoF teorico).

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

Arquivos de PR description (regra fixa — comportamento ativo do agente):

- `repos/<repo>/SPRINT-*-PR.md` sao artefatos temporarios para apoiar a abertura/revisao do PR da sprint.
- **Fim de cada sprint**: o agente DEVE criar `repos/<repo>/SPRINT-<N>-PR.md` com a descricao consolidada do PR (Summary, test plan, mudancas por modulo, migrations, decisoes, dividas aceitas, followups, notas e lista de commits), sem aguardar pedido explicito. Formato espelha os PRs anteriores.
- **Inicio de cada sprint**: o agente DEVE apagar o(s) `SPRINT-*-PR.md` da(s) sprint(s) anterior(es) ja usado(s) no PR, antes de iniciar a nova. O historico definitivo permanece no PR do GitHub, no step da sprint, no doc operacional do modulo, no PRD/CONTEXT e no relatorio de acompanhamento.
- Operacao em `docs-SEP` e 100% manual no git: o agente cria/edita/apaga apenas no working tree; nunca commita, faz push ou abre PR desses arquivos.
- Nao manter links permanentes para `SPRINT-*-PR.md` em docs operacionais, PRD, CONTEXT ou AI-ROADMAP.

Melhoria de fim de fase:

- Ao encerrar uma fase, antes de iniciar a fase seguinte, executar uma rotina de melhoria de codigo e busca de bugs quando o usuario solicitar.
- Esta rotina deve comecar obrigatoriamente em modo plano. O agente nao implementa correcoes nessa etapa inicial.
- O agente deve revisar PRD, CONTEXT, relatorio de acompanhamento, specs/steps da fase encerrada, docs operacionais, status dos repos, diffs entre branches relevantes e resultados de testes/CI disponiveis.
- O resultado deve ser um arquivo Markdown de plano com tasks, usando como base `docs-sep/TEMPLATE-PLANO-MELHORIA-FIM-DE-FASE.md`. O arquivo concreto deve usar nome claro, por exemplo `docs-sep/PLANO-MELHORIA-FIM-FASE-2.md`.
- O plano deve separar bugs P0/P1, melhorias de baixo risco, dividas tecnicas aceitas, itens adiados e validacoes necessarias.
- Implementacao de qualquer task desse plano so pode ocorrer apos aprovacao explicita do usuario.

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

Para sprints de hardening / bug-hunt:

- Use `cavecrew-investigator` em paralelo (1 invocacao por modulo critico) na fase de inventario de findings. Saida caveman-compressed cabe em contexto curto.
- Sempre **validar findings reportados** antes de implementar — subagentes podem emitir falsos positivos. Confirmar arquivo:linha, conferir codigo atual, descartar com justificativa quando for o caso.
- Para cleanup de tech debt (renames cross-module): prefira `sed -i` apenas com substrings literais inequivocas. Sed que envolve caracteres `/`, `\` ou escape pode esvaziar arquivos — abertura manual via `Edit` eh mais seguro pra strings complexas.

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
- [`docs-sep/PRD-FASE-1.md`](docs-sep/PRD-FASE-1.md)
- [`docs-sep/PRD-FASE-2.md`](docs-sep/PRD-FASE-2.md)
- [`docs-sep/PRD-FASE-3.md`](docs-sep/PRD-FASE-3.md)
- [`docs-sep/CONTEXT.md`](docs-sep/CONTEXT.md)
- [`docs-sep/CONTEXT-PARTE-1.md`](docs-sep/CONTEXT-PARTE-1.md)
- [`docs-sep/CONTEXT-PARTE-2.md`](docs-sep/CONTEXT-PARTE-2.md)
- [`AI-ROADMAP.md`](AI-ROADMAP.md)
- [`adr/`](adr/)
- [`specs/`](specs/)
- [`steps-fase-1/`](steps-fase-1/)
- [`steps-fase-2/`](steps-fase-2/)
- [`repos/`](repos/)
