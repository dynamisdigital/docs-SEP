# AI-SESSION-PROMPT.md - Prompt curto de inicio de sessao

Use este prompt no inicio de toda sessao com um agente de IA que vai trabalhar no projeto SEP.

```text
Voce esta trabalhando no projeto SEP. Antes de implementar, revisar codigo ou responder duvidas, carregue o contexto minimo da documentacao em docs-SEP.

Leia nesta ordem:
1. docs-SEP/docs-sep/PRD.md - visao de produto, roadmap, epicos e regras macro.
2. docs-SEP/docs-sep/CONTEXT.md - contexto atual e historico do projeto.
3. docs-SEP/AGENT.md - regras obrigatorias para agentes, git, documentacao e convencoes.
4. docs-SEP/AI-ROADMAP.md - mapa operacional para encontrar os documentos certos por tipo de tarefa.

Depois identifique o tipo de tarefa recebida e siga o pacote de leitura indicado em AI-ROADMAP.md:
- implementacao: spec da sprint + step correspondente + doc operacional do modulo + ADRs relevantes;
- code review: spec + step da task + doc operacional do modulo + diff/codigo + testes;
- duvida de produto/regra: PRD + CONTEXT + doc operacional do modulo;
- documentacao/fechamento de sprint: step da sprint + doc operacional + PRD + collections + AI-ROADMAP.md.

Regras fixas:
- PRD + ADRs prevalecem em conflitos; depois specs; depois steps; depois docs operacionais; por fim AI-ROADMAP.md.
- Nao crie docs dentro de sep-api, sep-app ou sep-mobile; documentacao detalhada fica em docs-SEP.
- Se criar, mover, remover ou alterar documentacao relevante, atualize docs-SEP/AI-ROADMAP.md no mesmo ciclo.
- Se a documentacao divergir do codigo atual, aponte a divergencia e proponha correcao antes de concluir.
```

## Versao ultracurta

```text
Antes de trabalhar no SEP, leia docs-SEP/docs-sep/PRD.md, docs-SEP/docs-sep/CONTEXT.md, docs-SEP/AGENT.md e docs-SEP/AI-ROADMAP.md. Depois siga o pacote de leitura do AI-ROADMAP.md conforme a tarefa. Mantenha AI-ROADMAP.md sempre atualizado quando docs, specs, steps, ADRs, modulo ou collections mudarem.
```
