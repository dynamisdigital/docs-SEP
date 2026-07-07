# Spec 027 - Sprint 27 - Step-up estrito server-side no aceite de contrato

## Metadados

- **ID da Spec**: 027
- **Titulo**: Sprint 27 - Enforcement server-side de step-up estrito no aceite de contrato
- **Status**: planejada
- **Fase do produto**: Fase 4 - follow-up de go-live (divida aceita da Fase 3)
- **Trilha**: Backend (`sep-api`)
- **Origem**: PRD-FASE-4 §35 (follow-up 1) + gap registrado na M-Sprint 8
- **Depende de**: modulo `contratos` (Sprints 10-11) e infraestrutura de step-up (Sprint 5)
- **Desbloqueia**: go-live de producao (Fase 5)
- **Responsavel principal**: Dev Senior Backend

## Objetivo

Fechar o bloqueio de go-live: o aceite de contrato passa a exigir step-up **estrito no servidor**,
removendo o bypass legado que permitia concluir o aceite sem MFA. Hoje o controller de `contratos`
usa `@RequireStepUp` legado com bypass server-side para usuario sem MFA; o mobile/web ja exigem MFA
no cliente, mas isso nao substitui o enforcement no backend.

## Contrato REST

```http
PATCH /api/v1/contratos/{contratoId}/aceite
```

### Autorizacao

- Usuario autenticado, dono do contrato (ownership preservada).
- Exige `X-Step-Up-Token` valido e nao expirado; usuario sem MFA configurado e **bloqueado** (sem
  bypass).
- Sem token ou token invalido/expirado -> `403` com codigo de step-up requerido.
- Conflito de estado (contrato ja aceito, versao divergente) -> `409`.
- Mensagens/codigos nao vazam UUID nem estado sensivel.

## Escopo

### Em escopo

- Auditar o fluxo atual `@RequireStepUp` no aceite e mapear exatamente onde o bypass ocorre.
- Substituir o bypass por enforcement estrito: aceite so conclui com step-up valido; usuario sem MFA
  recebe erro determinado.
- Padronizar a distincao de respostas `403` (step-up requerido) vs `409` (estado).
- Aplicar o mesmo enforcement a operacoes sensiveis equivalentes que compartilham o gate (ex.: aceite
  de renegociacao), quando usarem o mesmo mecanismo.
- Cobrir com testes: com MFA + step-up (200), sem MFA (bloqueado), sem token (403), token
  invalido/expirado (403).
- Atualizar OpenAPI, `SEGURANCA.md` (§step-up) e `CONTRATOS.md`; remover a divida do fechamento da
  Fase 3.

### Fora de escopo

- Alterar o mecanismo de emissao de step-up token (Sprint 5) ou a politica de MFA.
- Alterar regra de negocio de contrato, versionamento, geracao de PDF/CCB ou assinatura.
- Introduzir novo provider ou migration de dados.
- Mudar contratos de leitura owner-scoped ja entregues.

## Tasks de implementacao

1. Auditar o gate `@RequireStepUp` no aceite e documentar o ponto de bypass server-side.
2. Implementar enforcement estrito: exigir step-up token valido; bloquear usuario sem MFA sem bypass.
3. Padronizar respostas `403` step-up vs `409` estado, sem vazar UUID/estado sensivel.
4. Estender o enforcement as operacoes sensiveis equivalentes que compartilham o gate.
5. Cobrir com testes unit + integracao os quatro cenarios (com/sem MFA, sem/invalid token) e a
   ownership.
6. Atualizar OpenAPI, `SEGURANCA.md`, `CONTRATOS.md` e a nota de go-live.

## Gates que nao contam como task

- Confirmar cadeia Git (`main` em `develop`; Fase 3 integrada).
- Rodar baseline `./gradlew check`.
- Smoke autenticado: aceite com step-up valido vs bloqueio sem MFA.
- Checkpoint e PR description da Sprint 27.

## Definition of Done

- Aceite de contrato so conclui com step-up valido; nao ha bypass server-side para usuario sem MFA.
- `403` step-up e `409` estado sao distinguiveis e nao vazam dados sensiveis.
- Operacoes sensiveis equivalentes que usam o mesmo gate ficam consistentes.
- Testes dos quatro cenarios e da ownership passam; `./gradlew check` verde.
- Divida de go-live de step-up estrito e removida do backlog da Fase 3.
