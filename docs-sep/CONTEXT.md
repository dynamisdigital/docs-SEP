# Contexto do Projeto SEP

Este arquivo e o indice do contexto consolidado do SEP.

O conteudo foi dividido para reduzir o tamanho dos arquivos e facilitar a leitura por agentes de IA e integrantes do time. As referencias antigas para `docs-sep/CONTEXT.md` continuam validas como ponto de entrada.

## Arquivos

1. [`CONTEXT-ESTADO-ATUAL.md`](./CONTEXT-ESTADO-ATUAL.md) - **estado atual, proximo passo, gates pendentes e decisoes ativas**. Pequeno; e a fonte unica do estado. **Leia sempre este para saber onde estamos.**
2. [`CONTEXT-PARTE-1.md`](./CONTEXT-PARTE-1.md) - fundacao: origem do projeto, referencias iniciais, marco regulatorio, estrategia de execucao, stack, arquitetura, ambiente, primeira entrega e regras operacionais combinadas.
3. [`CONTEXT-PARTE-2.md`](./CONTEXT-PARTE-2.md) - historico de execucao (log por sprint), sprints concluidas, incidentes e decisoes operacionais. **Grande; leia so sob demanda**, para detalhe historico.

## Como navegar

- Para saber **onde estamos, o proximo passo e os gates pendentes**, leia [`CONTEXT-ESTADO-ATUAL.md`](./CONTEXT-ESTADO-ATUAL.md).
- Para entender por que o projeto existe e quais decisoes fundacionais foram tomadas, leia [`CONTEXT-PARTE-1.md`](./CONTEXT-PARTE-1.md).
- Para detalhe historico de uma sprint especifica (o que foi implementado e mergeado), leia [`CONTEXT-PARTE-2.md`](./CONTEXT-PARTE-2.md).

## Manutencao

- Ao **fechar uma sprint**: sobrescreva [`CONTEXT-ESTADO-ATUAL.md`](./CONTEXT-ESTADO-ATUAL.md) (estado + proximo passo) e apende uma entrada curta ao historico em [`CONTEXT-PARTE-2.md`](./CONTEXT-PARTE-2.md). Isso mantem o estado pequeno e sempre atual, sem inchar o log.
