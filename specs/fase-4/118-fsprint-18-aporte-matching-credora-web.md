# Spec 118 - F-Sprint 18 - Aporte e matching da credora no web

## Metadados

- **ID da Spec**: 118
- **Titulo**: F-Sprint 18 - Aporte e matching assistidos da credora no web
- **Status**: planejada (dep. backend 29-30)
- **Fase do produto**: Fase 4 - Epic 15 / Epic 10
- **Trilha**: Web (`sep-app`)
- **Origem**: PRD-FASE-4 §35 (Epic 15 - aporte/matching); Sprints backend 29-30
- **Depende de**: backend Sprint 29 (aporte) e Sprint 30 (matching) integradas em `develop`
- **Responsavel principal**: Devs Plenos Frontend

## Objetivo

Superficies web para **aporte** e **matching** assistidos da credora, consumindo os contratos das
Sprints backend 29-30. O frontend apresenta e opera de forma assistida (financeiro/admin decide, com
step-up); regras de elegibilidade, estados e totais vem do backend.

## Escopo

### Em escopo

- Estender service/modelos de borda para aporte e matching (espelham os DTOs do backend).
- Tela de sugestoes de matching + decisao assistida (confirmar/rejeitar) com step-up.
- Tela de aporte da operacao (iniciar aporte assistido com step-up) + status.
- Estados (pendente/processando/liquidado/falhou; sugerida/confirmada/rejeitada), ownership e erros.

### Fora de escopo

- Calcular elegibilidade, total ou estado no frontend.
- Matching automatico ou disparo automatico de aporte.
- Movimentacao real (roda sobre fake no backend nesta fase).
- Split Pix, gestao de chaves ou Pix automatico.

## Tasks de implementacao

1. Estender service/modelos da credora para aporte e matching (espelham DTOs backend).
2. Tela de sugestoes de matching + decisao assistida (confirmar/rejeitar) com step-up.
3. Tela de aporte da operacao (iniciar assistido, step-up) + status.
4. Tratar estados, ownership e erros (`403`/`404`/`409`/rede) sem reinterpretar regra.
5. Atualizar MSW e Vitest com cenarios de aporte/matching.
6. Smoke Playwright + docs (`README §Credora`).

## Gates que nao contam como task

- Precheck dos contratos backend 29-30.
- Smoke E2E: sugestao -> decisao e aporte -> status.
- Docs/roadmap quando aplicavel.

## Definition of Done

- Financeiro/admin decide matching e inicia aporte assistido no web, com step-up.
- Estados e totais refletem o backend; frontend nao calcula regra.
- Nenhuma decisao automatica; ownership respeitada.
- MSW/Vitest/smoke verdes; docs atualizadas.
