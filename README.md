# Documentação SEP

Este diretório reúne toda a documentação funcional, técnica e de produto do projeto SEP (Sociedade de Empréstimo entre Pessoas).

## Estrutura dos Arquivos

- **PRD.md**: Índice do documento de requisitos do produto. O conteúdo detalhado fica dividido em `docs-sep/PRD-FASE-1.md` a `docs-sep/PRD-FASE-5.md`.
- **STATE.md**: Fonte unica do estado atual, proximo passo, gates e ponteiro "Leia agora". A fundacao vive em `docs-sep/CONTEXT-PARTE-1.md`; o historico de execucao por sprint em `docs-sep/CONTEXT-PARTE-2.md` (grande; sob demanda).
- **AI-ROADMAP.md**: Mapa operacional para agentes de IA encontrarem rapidamente os documentos certos para implementações, reviews e dúvidas.
- **documentacao-cliente.html**: Apresentação executiva para o cliente, com visão de negócio, jornadas, funcionalidades, cronograma e roadmap visual.
- **documentacao-dev.html**: Guia técnico para desenvolvedores, detalhando stack, arquitetura, pacotes, endpoints, segurança, sprints, épicos e convenções.
- **ARQUITETURA-SEP.md**: Descrição da arquitetura implementada (módulos, portas, integrações, persistência, segurança e divergências entre PRD e código), com guia de leitura do diagrama interativo `docs-sep/ARQUITETURA-SEP.html`.
- **docs-sep/roteiros-teste/**: Roteiros de teste manual das jornadas de usuário, executados contra o backend real local. O hub é `CENARIOS-TESTE-JORNADAS-USUARIO.md`; cada família de jornada tem um `ROTEIRO-NN-*.md`. A subpasta `app/` traz um mini-app web (abre por duplo clique, sem servidor) onde o testador marca os passos e exporta o resultado em JSON.
- **Aprendizado Celcoin e SEP/**: Materiais de referência, aprendizados e análises sobre o domínio SEP e integrações (ex: Celcoin, BaaS, propostas técnicas).
- **specs/**: Especificações detalhadas por sprint, descrevendo tasks, critérios de pronto, dependências e arquivos esperados.
- **steps-fase-1/**: Steps granulares da Fase 1, separados por trilha (`backend`, `web`, `mobile`).
- **steps-fase-2/**: Steps granulares da Fase 2. A Sprint 5 ja possui steps em `steps-fase-2/backend/005-sprint-5-steps.md`.
- **steps-fase-3/**: Steps granulares da Fase 3, separados por trilha (`backend`, `web`, `mobile`).
- **repos/**: Documentacao especifica por repositorio (`sep-api`, `sep-app`, `sep-mobile`).

## Como usar

- Consulte o **PRD.md** para navegar pelo PRD por fase.
- Consulte o **STATE.md** para saber onde estamos, o proximo passo e o "Leia agora"; use `CONTEXT-PARTE-1.md` para fundacao e `CONTEXT-PARTE-2.md` para historico.
- Use o **AGENT.md** e o **AI-ROADMAP.md** para carregar o contexto minimo em novas sessoes com agentes.
- Consulte o **AI-ROADMAP.md** para saber quais documentos ler por tipo de tarefa antes de implementar, revisar ou responder dúvidas.
- Use a **documentacao-cliente.html** para apresentações e acompanhamento executivo.
- Use a **documentacao-dev.html** para referência técnica, implementação e onboarding de novos devs.
- Consulte a **ARQUITETURA-SEP.md** para a arquitetura vigente do código e abra a `ARQUITETURA-SEP.html` para navegar o diagrama interativo por capítulos.
- Para validar o produto manualmente, abra `docs-sep/roteiros-teste/app/index.html` no navegador e siga o `ROTEIRO-00` antes de qualquer jornada. Depois de editar um roteiro `.md`, rode `node gerar-dados.mjs` dentro de `app/` para o app refletir a mudança.
- Consulte as **specs** para detalhes de cada sprint e entregáveis técnicos.
- Consulte os **steps-fase-1**, **steps-fase-2** e **steps-fase-3** para a execução granular just-in-time de cada sprint.
- Consulte **repos/** para documentacao tecnica especifica de cada repositorio de codigo.
- Utilize os materiais de aprendizado para aprofundar o domínio e as integrações do projeto.

## Observações

- Esta pasta é commitada no repositório para garantir rastreabilidade, transparência e alinhamento entre todas as partes envolvidas no projeto SEP.
- Mantenha a documentação sempre atualizada conforme o avanço do projeto.
