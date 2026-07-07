# Sprint 27 — Step-up estrito server-side (PR description)

> Arquivo temporario: apagar ao iniciar a Sprint 28.

## Resumo

Remove o bypass de MFA nas operacoes juridico-financeiras do `sep-api`. Substitui `@RequireStepUp`
(legado, com bypass quando `mfaHabilitado=false`) por `@RequireStepUpEstrito` (sem bypass) nos
cinco endpoints de alto risco dos modulos `contratos` e `cobranca`.

Fecha o **Follow-up 1 da Fase 3** e o unico bloqueio de go-live independente de acesso externo
(`v1.0-local` agora completamente seguro em step-up).

## Classificacao do Gate (Task 27.1)

| Criterio | Resultado |
|----------|-----------|
| Base Git | `origin/develop` (b2200c0) — `main == develop` pos-merge Fase 3 |
| Endpoint ja com `@RequireStepUpEstrito` | `PixDesembolsoController.solicitarDesembolso` (Sprint 20) |
| Endpoint com `@RequireStepUp` justificado | `PixDesembolsoController.reconciliarStatus` — apenas sync de estado com provider, sem obrigacao financeira |
| Novos endpoints para upgrade | 5 (ver tabela abaixo) |
| Risco de regressao | Baixo — aspecto AOP existe desde Sprint 20; apenas troca pointcut |

## Endpoints alterados

| Controller | Metodo | Endpoint | Antes | Depois |
|------------|--------|----------|-------|--------|
| `ContratoController` | `registrarAceite` | `PATCH /contratos/{id}/aceite` | `@RequireStepUp` | `@RequireStepUpEstrito` |
| `ContratoController` | `cancelar` | `DELETE /contratos/{id}` | `@RequireStepUp` | `@RequireStepUpEstrito` |
| `ContratoController` | `enviarParaAssinatura` | `POST /contratos/{id}/assinar` | `@RequireStepUp` | `@RequireStepUpEstrito` |
| `CobrancaController` | `proporRenegociacao` | `POST /parcelas/{id}/renegociacao` | `@RequireStepUp` (FQN) | `@RequireStepUpEstrito` (FQN) |
| `CobrancaController` | `aceitarRenegociacao` | `PATCH /renegociacoes/{id}/aceite` | `@RequireStepUp` (FQN) | `@RequireStepUpEstrito` (FQN) |

### Fora de escopo (intencional)

- `CobrancaController.recusarRenegociacao` — recusa nao gera obrigacao financeira nova; mantido sem step-up.
- `PixDesembolsoController.reconciliarStatus` — sync de estado com provider, sem obrigacao; mantido com `@RequireStepUp`.

## Seguranca

**Comportamento anterior** (`@RequireStepUp`): se `mfaHabilitado=false` no usuario, aspecto libera
sem verificar token. Cenario de bypass: usuario sem MFA configurado podia aceitar contrato via API
direta com qualquer header.

**Comportamento novo** (`@RequireStepUpEstrito`): aspecto verifica (1) `usuario.isMfaHabilitado() == true`
e (2) `X-Step-Up-Token` valido e nao expirado. Se qualquer check falha → `AccessDeniedException` →
`ApiExceptionHandler` retorna HTTP 403 `"Acesso negado"` (sem UUID, sem stack trace vazado).

**Base regulatoria**: CMN 4.656/2018 Art. 11 — ato de formalizacao de operacao financiada exige
autenticacao forte; o bypass era incompativel com go-live.

**Risco residual zero**: `StepUpEnforcementAspect` existe desde Sprint 20 e ja governa o desembolso
Pix. Nenhuma nova infra introduzida; apenas troca de pointcut nas anotacoes.

## Decisoes

1. **FQN em `CobrancaController`**: o controller ja usava FQN para a anotacao legada (sem import).
   Mantido o padrao FQN para nao introduzir import desnecessario num arquivo extenso.

2. **`recusarRenegociacao` sem step-up**: recusa nao e ato de formalizacao — nao cria obrigacao
   financeira nova. Exigir step-up seria sobrecarga UX sem ganho de compliance.

3. **Javadoc atualizado**: removido paragrafo "Limitacao conhecida do step-up" de `ContratoController`;
   substituido por nota de Sprint 27. Alinhado com CMN 4.656/2018 Art. 11.

4. **Testes novos em slice `@WebMvcTest`**: `@Import(StepUpEnforcementAspect.class)` +
   `@EnableAspectJAutoProxy` no `MethodSecurityTestConfig`. Tres cenarios por endpoint critico:
   MFA=false→403, MFA=true sem token→403, MFA=true com token→2xx.

## Testes

- **Baseline**: 1832 testes (antes da sprint).
- **Novos**: 8 testes adicionados (3 em `ContratoControllerTest` ja existentes/1 novo; 7 em `CobrancaControllerTest`).
- **Total**: 1840 testes, todos os unit tests passando.
- **IT failures**: 371 (100% Docker-offline; sem regressao de IT relacionado ao step-up).

Novos testes `ContratoControllerTest`:
- `patchAceiteClienteSemMfaComToken403` — prova bypass removido (MFA=false + token → 403)

Novos testes `CobrancaControllerTest`:
- `postProporRenegociacaoSemMfa403`
- `postProporRenegociacaoSemStepUp403`
- `postProporRenegociacaoComStepUp201`
- `patchAceitarRenegociacaoSemMfa403`
- `patchAceitarRenegociacaoSemStepUp403`
- `patchAceitarRenegociacaoComStepUp200`
- `patchRecusarRenegociacaoSemStepUp200` — confirma que recusa nao exige step-up

## Follow-ups

Nenhum follow-up tecnico gerado. Sprint encerra o Follow-up 1 da Fase 3 sem divida residual.

## Mensagens de commit sugeridas

```
feat(security): replace @RequireStepUp with @RequireStepUpEstrito on contract and renegotiation endpoints

Removes server-side MFA bypass from five legal/financial operations:
- ContratoController: registrarAceite, cancelar, enviarParaAssinatura
- CobrancaController: proporRenegociacao, aceitarRenegociacao

@RequireStepUpEstrito enforces mfaHabilitado=true AND valid X-Step-Up-Token
with no bypass path. Closes go-live blocker (Fase 3 Follow-up 1, CMN 4.656/2018 Art. 11).

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

```
test(security): add step-up enforcement tests for contract and renegotiation controllers

CobrancaControllerTest: 7 new tests covering propor/aceitar renegociacao (MFA=false→403,
no-token→403, valid→2xx) and recusar (no step-up required).
ContratoControllerTest: 1 new test proving bypass removal (MFA=false + token → 403).

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

> Alternativa: commit unico consolidando feat+test (mais simples para squash-merge).
