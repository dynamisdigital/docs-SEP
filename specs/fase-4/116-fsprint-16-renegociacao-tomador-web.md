# Spec 116 - F-Sprint 16 - Renegociacao do tomador no web

## Metadados

- **ID da Spec**: 116
- **Titulo**: F-Sprint 16 - Decisao de renegociacao do tomador no web
- **Status**: planejada
- **Fase do produto**: Fase 4 - Epic 13 (fecha gap da F-Sprint 9)
- **Trilha**: Web (`sep-app`)
- **Origem**: PRD-FASE-4 §35 (Epic 13 / follow-up 2); gap adiado na F-Sprint 9
- **Depende de**: backend Sprint 24 (`GET /parcelas/{id}/renegociacao-ativa`) integrada em `develop`;
  padrao mobile M-9.5
- **Responsavel principal**: Devs Plenos Frontend

## Objetivo

Fechar o gap deixado na F-Sprint 9: permitir que o tomador consulte e decida a renegociacao ativa de
uma parcela no web, consumindo a leitura owner-scoped da Sprint 24 e o aceite com step-up. Espelha o
comportamento ja entregue no mobile (M-9.5). O frontend so apresenta; total e regra vem do backend.

## Escopo

### Em escopo

- Estender `CobrancaService`/modelos de borda para renegociacao ativa do tomador (espelha
  `RenegociacaoTomadorResponse`, 10 campos; total do backend).
- Tela/rota de decisao de renegociacao do tomador + CTA na parcela `EM_NEGOCIACAO`.
- Aceite com confirmacao explicita + step-up (`stepUpInterceptor`); recusa sem step-up.
- Reconsulta dos termos ao entrar e antes de cada confirmacao; anti duplo-submit.
- Tratamento de erros: `403` step-up vs ownership, `404`/`409` recarregam termos, rede nunca vira
  sucesso.

### Fora de escopo

- Recalcular total, mora, multa ou status (sempre do backend).
- Operacao de renegociacao pelo financeiro (ja entregue na F-9).
- Novo endpoint backend (consome os existentes).
- Pix automatico, boleto ou BI.

## Tasks de implementacao

1. Estender `CobrancaService` e modelos de borda para a renegociacao ativa do tomador.
2. Criar rota/tela de decisao + CTA na parcela `EM_NEGOCIACAO`.
3. Implementar aceite com confirmacao explicita + step-up; total sempre do backend.
4. Implementar recusa sem step-up + reconsulta de termos e anti duplo-submit.
5. Tratar `403` step-up vs ownership, `404`/`409` (recarrega), rede (nao vira sucesso).
6. Atualizar MSW, Vitest e smoke Playwright + docs (`README §Cobranca`).

## Gates que nao contam como task

- Precheck do endpoint `GET /parcelas/{id}/renegociacao-ativa` (Sprint 24).
- Smoke E2E: parcela `EM_NEGOCIACAO` -> aceite com step-up e recusa.
- Docs/roadmap quando aplicavel.

## Definition of Done

- Tomador ve os termos autoritativos da renegociacao e decide com aceite (step-up) ou recusa.
- Total nunca e calculado no front; `403`/`404`/`409`/rede tratados corretamente.
- Comportamento consistente com o mobile (M-9.5).
- MSW/Vitest/smoke verdes; docs atualizadas.
