# sep-api

Documentacao especifica do backend/API SEP.

## Documentos

- [ONBOARDING.md](ONBOARDING.md) - fluxos KYC PF, KYB PJ, PLD, endpoints, webhooks,
  providers, smoke manual e profile `local-wiremock`.
- [PLD.md](PLD.md) - politica PLD, bases consultadas, criterio de bloqueio, retencao
  LGPD e checklist juridico.
- [CREDITO.md](CREDITO.md) - modulo `credito` (Sprint 8): estados da proposta, motor
  de regras, parecer manual, role FINANCEIRO, endpoints, auditoria e smoke local.
- [OPEN-FINANCE.md](OPEN-FINANCE.md) - modulo Open Finance Brasil (Sprint 9):
  consentimento Celcoin/Finansystech, reavaliacao automatica, sanitizer LGPD,
  endpoints REST e auditoria.
- [CONTRATOS.md](CONTRATOS.md) - modulo `contratos` (Sprint 10): geracao textual,
  versionamento, hash, aceite com step-up, cancelamento pre-aceite e auditoria.
- [CODIGOS-DE-ERRO.md](CODIGOS-DE-ERRO.md) - contrato de erro da API (Sprints 36 e 37): campo
  `codigo`, regra `MOD-STATUS-NNN` e registro de prefixos (ADR 0020), catalogo publicado (143), o
  unico excluido e o motivo, aposentados, mapa antes -> depois da Sprint 37, handlers sem taxonomia e
  como o consumidor deve tratar o campo.
- [INTEGRACOES-PROVIDERS.md](INTEGRACOES-PROVIDERS.md) - providers externos (Sprint 32):
  inventario/matriz das 6 capacidades, feature flags por ambiente (ADR 0017), politica de
  retry, fixtures WireMock, smoke `local-wiremock` e ativacao gated da Fase 5.

## Orientacao

Crie aqui documentacao tecnica ou operacional que pertenca apenas ao repo `sep-api`.
Documentos globais de produto/processo devem continuar em `docs-SEP/docs-sep/`.
Arquivos `SPRINT-*-PR.md` sao temporarios: podem ser usados para montar a descricao
do PR real, mas devem ser removidos quando a sprint seguinte iniciar.
