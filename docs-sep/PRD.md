# PRD - API SEP

Este arquivo e o indice do PRD consolidado do SEP.

O conteudo foi dividido por fase para reduzir o tamanho dos arquivos e facilitar a leitura por agentes de IA e integrantes do time. As referencias antigas para `docs-sep/PRD.md` continuam validas como ponto de entrada.

## Arquivos por fase

1. [`PRD-FASE-1.md`](./PRD-FASE-1.md) - fundacao tecnica da API, contratos iniciais, arquitetura base, sprints 0-4, criterios de sucesso e testes obrigatorios da primeira entrega.
2. [`PRD-FASE-2.md`](./PRD-FASE-2.md) - jornada de contratacao backend, sprints 5-14, epics 5-9 e mapeamento da Fase 2.
3. [`PRD-FASE-3.md`](./PRD-FASE-3.md) - expansao do produto, epics 10-17, Fase 3 backend/web/mobile, regras de execucao, premissas e orientacao para agentes.
4. [`PRD-FASE-4.md`](./PRD-FASE-4.md) - conclusao de jornadas (epics 13/14 remanescentes), Pix avancado e aporte real (epic 15), planejamento de infraestrutura AWS (epic 16) e follow-ups de go-live da Fase 3; fecha o marco `v1.0-local` (tudo menos AWS e Celcoin).
5. [`PRD-FASE-5.md`](./PRD-FASE-5.md) - fase de fechamento: integracao real Celcoin/BaaS, provisionamento AWS e deploy remoto (epic 16 execucao), publicacao mobile em lojas e go-live de producao com conformidade CMN 4.656/LGPD.

## Como navegar

- Para requisitos iniciais de usuarios, autenticacao, auditoria, JWT, DTOs, endpoints e arquitetura base, leia [`PRD-FASE-1.md`](./PRD-FASE-1.md).
- Para onboarding, credito, formalizacao, cobranca e backoffice operacional, leia [`PRD-FASE-2.md`](./PRD-FASE-2.md).
- Para credoras, governanca, Pix, web/mobile de jornadas, novo design system web/mobile e infraestrutura AWS futura, leia [`PRD-FASE-3.md`](./PRD-FASE-3.md).
- Para o planejamento da conclusao das jornadas web/mobile, empacotamento nativo, Pix avancado e aporte real, planejamento de infraestrutura AWS e follow-ups de go-live (marco `v1.0-local`), leia [`PRD-FASE-4.md`](./PRD-FASE-4.md).
- Para a fase de fechamento (integracao real Celcoin, provisionamento AWS e deploy, publicacao em lojas e go-live de producao), leia [`PRD-FASE-5.md`](./PRD-FASE-5.md).

## Observacao

Em caso de conflito, os arquivos de fase acima representam o conteudo vigente do PRD. ADRs continuam prevalecendo sobre specs, steps e docs operacionais conforme definido em [`../AGENT.md`](../AGENT.md).
