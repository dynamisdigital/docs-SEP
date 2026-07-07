# Spec 216 - M-Sprint 16 - Aporte/matching e chaves Pix na credora mobile

## Metadados

- **ID da Spec**: 216
- **Titulo**: M-Sprint 16 - Aporte/matching assistidos e visibilidade de chaves Pix (credora mobile)
- **Status**: planejada (dep. backend 29-31)
- **Fase do produto**: Fase 4 - Epic 14 / Epic 15
- **Trilha**: Mobile (`sep-mobile`)
- **Origem**: PRD-FASE-4 §35 (Epic 14/15); Sprints backend 29-31
- **Depende de**: backend Sprints 29 (aporte), 30 (matching), 31 (chaves Pix) integradas; M-Sprint 10
  (credora mobile)
- **Responsavel principal**: Dev Mobile

## Objetivo

Levar ao app da credora as superficies de **aporte** e **matching** assistidos e a **visibilidade de
chaves Pix**, consumindo os contratos das Sprints backend 29-31. O app apresenta e opera de forma
assistida (decisao com step-up); regras, estados e totais vem do backend. Mantem o mobile restrito a
tomador e credora.

## Escopo

### Em escopo

- Estender service/modelos mobile da credora para aporte, matching e chaves Pix (espelham DTOs
  backend).
- Aporte assistido da operacao (iniciar + step-up) + status.
- Decisao de matching assistida (confirmar/rejeitar, step-up) quando aplicavel a credora.
- Visao de chaves Pix (leitura mascarada) da conta/operacao, sem dado tecnico sensivel.
- MSW + Vitest + Playwright PWA + cenarios.

### Fora de escopo

- Movimentacao real (backend roda sobre fake nesta fase).
- Operacao interna de financeiro/backoffice no app.
- Expor valor bruto de chave, dado bancario ou PII de outra parte.
- Split Pix ou Pix automatico.

## Tasks de implementacao

1. Estender service/modelos da credora para aporte, matching e chaves Pix (DTOs backend).
2. Implementar aporte assistido da operacao (iniciar + step-up) + status.
3. Implementar decisao de matching assistida (confirmar/rejeitar, step-up).
4. Implementar visao de chaves Pix (leitura mascarada), sem dado tecnico sensivel.
5. Atualizar MSW, Vitest e smoke Playwright PWA com cenarios de aporte/matching/chaves.
6. Atualizar docs (`README §Credora`).

## Gates que nao contam como task

- Precheck dos contratos backend 29-31.
- Smoke PWA: aporte/matching/decisao e leitura de chaves.
- Docs/roadmap quando aplicavel.

## Definition of Done

- Credora inicia aporte e decide matching de forma assistida no app, com step-up.
- Chaves Pix aparecem mascaradas, sem dado tecnico sensivel nem PII de outra parte.
- Estados e totais refletem o backend; nenhuma regra e calculada no app.
- MSW/Vitest/smoke verdes; docs atualizadas.
