# Metricas de Implementacao do Projeto SEP

## Objetivo

Este guia define boas praticas para acompanhar a implementacao do SEP sem transformar metricas em controle individual de produtividade. As metricas devem ajudar o time a enxergar fluxo, qualidade, risco e valor entregue por sprint, modulo e repositorio.

As referencias principais usadas sao:

- DORA / Google Cloud: metricas de desempenho de entrega de software. <https://dora.dev/guides/dora-metrics/>
- SPACE Framework: produtividade de desenvolvedores medida por multiplas dimensoes. <https://queue.acm.org/detail.cfm?id=3454124>
- Scrum.org Evidence-Based Management: valor, time-to-market, capacidade de inovar e capacidade atual. <https://www.scrum.org/resources/evidence-based-management-guide>
- Thoughtworks: uso responsavel de metricas de entrega e fluxo. <https://www.thoughtworks.com/insights/blog/agile-project-management/measure-software-delivery-performance>

## Principios

1. Medir fluxo, nao pessoas.
2. Usar metricas em conjunto, nunca isoladas.
3. Preferir metricas que gerem acao clara.
4. Separar sinal operacional de julgamento de performance.
5. Registrar contexto junto do numero.
6. Revisar metricas por sprint e por modulo, nao por dia isolado.
7. Evitar metas que incentivem comportamento ruim, como commits artificiais ou PRs menores que o necessario.

## Modelo recomendado

O SEP deve usar um modelo combinado:

- **Entrega**: DORA e fluxo Git.
- **Qualidade**: testes, cobertura, bugs, regressao e code review.
- **Produto**: progresso por sprint, epico e DoD.
- **Operacao do projeto**: pendencias, riscos, documentacao e prontidao para PR.
- **Saude do time**: carga cognitiva, bloqueios e retrabalho, sem ranking individual.

## Metricas de entrega

### Lead time de mudanca

Tempo entre o primeiro commit da task e a branch estar pronta para PR.

Uso no SEP:

- medir por task e por sprint;
- separar backend, web e mobile;
- registrar bloqueios externos, como dependencia de credenciais, Docker, Celcoin ou decisao de produto.

Evitar:

- comparar pessoas;
- reduzir lead time as custas de teste ou revisao.

### Frequencia de entrega

Quantidade de tasks ou branches concluidas por sprint.

Uso no SEP:

- contar tasks fechadas com checkpoint, testes e revisao;
- acompanhar ritmo por modulo;
- identificar sprints grandes demais.

Evitar:

- usar numero de commits como produtividade;
- premiar fragmentacao artificial de trabalho.

### Taxa de falha de mudanca

Percentual de mudancas que exigem hotfix, rollback, rework relevante ou nova rodada de review por bug funcional.

Uso no SEP:

- contar hotfixes por task;
- classificar causa: teste ausente, regra mal entendida, concorrencia, autorizacao, migration, contrato REST, documentacao divergente.

### Tempo de recuperacao

Tempo entre identificar uma falha e aplicar o hotfix validado.

Uso no SEP:

- medir para falhas de CI, testes locais, bugs de review e regressao funcional;
- registrar se a correcao exigiu alterar spec, step ou ADR.

## Metricas de fluxo

### Throughput de task

Quantidade de tasks realmente concluidas por sprint.

Definicao de concluida:

- implementada;
- testes proporcionais executados;
- checkpoint pre-commit apresentado;
- review automatizado ou humano feito quando exigido;
- pendencias registradas;
- commit aprovado pelo usuario quando aplicavel.

### Work in progress

Quantidade de tasks abertas ao mesmo tempo por repo.

Regra recomendada:

- uma task ativa por agente;
- nao iniciar a proxima task da sprint sem fechamento ou pausa explicita da anterior;
- evitar misturar hotfix de review com nova task.

### Tamanho de mudanca

Medir arquivos alterados e linhas adicionadas/removidas por task.

Uso pratico:

- `git diff --stat <base>..HEAD`;
- detectar tasks grandes demais;
- orientar divisao futura de steps.

Limite orientativo:

- ate 15 arquivos: task pequena/media;
- 16 a 40 arquivos: revisar risco de acoplamento;
- mais de 40 arquivos: exigir plano de verificacao mais forte.

## Metricas de qualidade

### Testes executados

Registrar no checkpoint:

- comando;
- resultado;
- escopo testado;
- se foi cacheado ou reexecutado com `--rerun-tasks`;
- razao de nao rodar algum teste.

Exemplos:

```bash
./gradlew test --tests '*backoffice.application.usecase*' --rerun-tasks
./gradlew check
npm run test:coverage
npm run e2e
```

### Cobertura

Usar JaCoCo/Vitest como sinal de risco, nao como objetivo isolado.

Uso no SEP:

- manter gate definido no repo;
- observar queda por modulo;
- exigir teste novo quando comportamento novo altera regra, autorizacao, transacao, evento, provider, migration ou contrato REST.

#### Baseline JaCoCo - sep-api - pos-Sprint 15 (2026-05-27)

Primeira medicao formal por modulo. Substitui o status anterior "Em monitoramento". Coletado por `./gradlew clean test jacocoTestReport` na branch `feature/sprint-15-hardening-bughunt`, suite com 1429 testes / 0 falhas / 0 erros / 0 skipped.

Tabela final pos-Task 15.10 (coverage uplift). Baseline anterior pos-Sprint 14 trazia `escrow` com 50,0% de branches; novos testes de validacao de dominio (`EscrowDomainValidationTest`) trouxeram para 100%.

| Modulo | Linha % | Branch % | Gate 70% (linhas) | Gate 70% (branches) |
|---|---:|---:|---|---|
| backoffice | 96,5 | 82,4 | OK | OK |
| cobranca | 94,4 | 77,7 | OK | OK |
| contratos | 93,9 | 76,2 | OK | OK |
| credito | 91,1 | 78,5 | OK | OK |
| escrow | **86,4** | **100,0** | OK | OK |
| identity | 90,8 | 78,5 | OK | OK |
| onboarding | 92,2 | 73,9 | OK | OK |
| shared | 93,3 | 75,3 | OK | OK |
| usuarios | 96,4 | 90,9 | OK | OK |

Notas:
- Modulos `pix`, `financeiro` e `credores` permanecem stubs (4 arquivos cada) e nao geram cobertura mensuravel; ficam fora da tabela.
- Todos os modulos com codigo de producao acima do gate de 70% em linhas e branches.
- Gate atual no `build.gradle` continua `LINE COVEREDRATIO 0.70` apenas; branches nao bloqueiam build, mas a baseline acima serve como referencia pra detectar regressao.

### Achados de code review

Classificar cada finding:

- `P0`: quebra funcional, seguranca, perda de dados, migration invalida.
- `P1`: bug provavel, divergencia de contrato, concorrencia, autorizacao, transacao.
- `P2`: lacuna de teste, acoplamento, risco de manutencao.
- `P3`: melhoria menor, clareza, estilo.

Boas praticas:

- findings devem apontar arquivo e linha;
- nao registrar preferencias como bugs;
- registrar test gaps separadamente.

### Retrabalho

Medir hotfixes por task e motivo.

Categorias recomendadas:

- regra de negocio incompleta;
- teste ausente;
- divergencia spec/step;
- acoplamento entre modulos;
- erro de transacao;
- concorrencia/idempotencia;
- documentacao/collection esquecida.

## Metricas de produto e roadmap

### Progresso por sprint

Para cada sprint:

- tasks planejadas;
- tasks concluidas;
- tasks em review;
- tasks bloqueadas;
- tasks adiadas;
- pendencias antes de producao.

### Progresso por epico

Medir por capacidade entregue, nao por volume de codigo.

Exemplos:

- Onboarding: PF, PJ, PLD, webhooks, auditoria.
- Credito: motor interno, parecer, Open Finance.
- Contratos: geracao, aceite, assinatura, CCB.
- Cobranca: agenda, recebimento, inadimplencia, renegociacao.
- Backoffice: fila, comentarios, reprocessos, dashboard.

### Definition of Done

Uma task so deve contar como concluida quando o DoD aplicavel foi atendido.

Para backend:

- codigo implementado;
- testes unitarios/integracao proporcionais;
- migrations aplicadas em banco limpo quando houver schema;
- Spotless/JaCoCo sem regressao quando aplicavel;
- docs/collections atualizadas quando contrato muda;
- checkpoint pre-commit apresentado.

## Metricas de documentacao

Registrar por sprint:

- docs operacionais criadas ou atualizadas em `docs-SEP/repos/<repo>/`;
- specs/steps atualizados;
- ADRs criados ou alterados;
- collections Postman/Insomnia atualizadas;
- PRD/CONTEXT/AI-ROADMAP atualizados quando houver mudanca relevante.

Sinais de risco:

- endpoint novo sem collection;
- migration nova sem doc operacional;
- comportamento implementado sem spec/step;
- roadmap apontando para arquivo inexistente;
- PRD desatualizado apos sprint concluida.

## Metricas de seguranca e compliance

Para tarefas que tocam autenticacao, autorizacao, financeiro, contratos, KYC/KYB, PLD ou auditoria, registrar:

- rotas protegidas por role;
- ownership validado;
- step-up exigido quando aplicavel;
- evento de auditoria criado;
- payload de auditoria sem dado sensivel indevido;
- idempotencia em operacoes financeiras ou webhooks;
- retencao/LGPD respeitada;
- FK sem `ON DELETE CASCADE` quando preservar trilha auditavel for requisito.

## Dashboard minimo recomendado

Criar uma visao simples por sprint com:

| Campo | Como medir |
|-------|------------|
| Tasks concluidas | checklist do step |
| Tasks em review | branch/commits sem aprovacao final |
| Hotfixes de review | commits `fix(...)` apos review |
| Testes executados | comandos registrados no checkpoint |
| Cobertura | relatorio JaCoCo/Vitest |
| Arquivos alterados | `git diff --stat` |
| Migrations novas | `src/main/resources/db/migration` |
| Endpoints novos | controllers + OpenAPI + collections |
| Pendencias | docs operacionais e PR description |
| Riscos | findings P0/P1/P2 abertos |

## Comandos uteis

### Git

```bash
git status --short --branch
git diff --stat origin/develop...HEAD
git diff --name-status origin/develop...HEAD
git log --oneline --decorate -20
```

### Backend

```bash
./gradlew test
./gradlew check
./gradlew test --tests '*NomeDoModulo*' --rerun-tasks
```

### Web e mobile

```bash
npm run lint
npm run lint:scss
npm run format:check
npm run test:coverage
npm run build
npm run e2e
```

## Anti-padroes

- Medir produtividade por linhas de codigo.
- Medir produtividade por numero de commits.
- Comparar desenvolvedores por quantidade de PRs.
- Aumentar cobertura com testes que nao validam comportamento.
- Fechar task sem registrar teste executado.
- Considerar sprint concluida com documentacao operacional pendente.
- Ignorar hotfixes de review no aprendizado da sprint.
- Usar uma metrica isolada para decidir qualidade.

## Ritual recomendado

### Durante a task

1. Registrar escopo e criterio de pronto.
2. Implementar em fatias pequenas.
3. Rodar teste proporcional.
4. Parar no checkpoint pre-commit.
5. Revisar findings e hotfixes antes de seguir.

### Ao fechar a sprint

1. Contar tasks concluidas e pendentes.
2. Consolidar hotfixes e causas.
3. Conferir testes/build/cobertura.
4. Atualizar docs, collections e roadmap.
5. Registrar riscos remanescentes.
6. Preparar PR description com validacao objetiva.

## Leitura dos numeros

Metricas boas nao respondem so "quanto foi feito". Elas respondem:

- onde o fluxo esta travando;
- qual tipo de bug esta se repetindo;
- qual modulo esta acumulando risco;
- quais contratos estao mudando demais;
- que teste faltou para evitar retrabalho;
- qual documentacao esta ficando para tras;
- se a sprint esta aumentando ou reduzindo incerteza.
