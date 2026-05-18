# CREDITO — Modulo `credito` (Sprint 8, Epic 6 parte 1)

Visao consolidada do modulo `credito` do `sep-api`: analise de credito interna,
motor de regras, esteira de parecer manual e auditoria reforcada.

> Spec de origem: [`specs/fase-2/008-sprint-8-credito-regras-parecer.md`](../../specs/fase-2/008-sprint-8-credito-regras-parecer.md). Steps: [`steps-fase-2/backend/008-sprint-8-steps.md`](../../steps-fase-2/backend/008-sprint-8-steps.md). ADR motor: [`adr/0012-motor-de-regras-de-credito-interno.md`](../../adr/0012-motor-de-regras-de-credito-interno.md).

## Objetivo

Permitir que um tomador com onboarding **APROVADO_FINAL** (Sprint 6/7) crie uma proposta
de credito, receba uma sugestao automatica do motor de regras (heuristicas) e tenha a
decisao final tomada por operador `FINANCEIRO` via parecer manual auditavel — conforme
**Resolucao CMN 4.656/2018 Art. 9**.

## Estados da proposta

```
EM_ANALISE  ─ aplicarSugestaoMotor ─▶ PRE_APROVADA
            ├─ aplicarSugestaoMotor ─▶ EM_ANALISE     (mantem)
            ├─ aplicarSugestaoMotor ─▶ REJEITADA      (motor — bloqueio absoluto)
            ├─ marcarPendencia      ─▶ PENDENCIA
            └─ registrarDecisaoManual(APROVAR|REJEITAR|PENDENCIA)

PRE_APROVADA ─ registrarDecisaoManual(APROVAR)   ─▶ APROVADA    (final)
             ├ registrarDecisaoManual(REJEITAR)  ─▶ REJEITADA   (final)
             ├ registrarDecisaoManual(PENDENCIA) ─▶ PENDENCIA
             └ marcarPendencia                   ─▶ PENDENCIA

PENDENCIA    ─ registrarDecisaoManual(APROVAR)   ─▶ APROVADA    (final)
             └ registrarDecisaoManual(REJEITAR)  ─▶ REJEITADA   (final)

APROVADA / REJEITADA = estados finais — nenhuma transicao saindo.
```

`StatusProposta.isFinal()` cobre `APROVADA` e `REJEITADA`.

## Motor de regras (heuristicas declarativas)

5 regras como `@Component`s independentes (ADR 0012):

| Regra | Aplica a | Logica |
| ----- | -------- | ------ |
| `RegraOnboardingAprovado` | PF + PJ | Exige `StatusOnboarding.APROVADO_FINAL`; falha `bloqueante` -> sugere `REJEITADA` direto |
| `RegraIdadeMinimaPessoa` | PF | Idade >= `app.credito.motor.idade-minima-pessoa` (default 18). PJ -> `PASSOU` (N/A). Sem `dataNascimento` -> `PENDENTE` |
| `RegraTempoExistenciaEmpresa` | PJ | Empresa >= `tempo-minimo-empresa-meses` meses (default 6). PF -> `PASSOU` (N/A). Sem `dataAbertura` (ConsultaCNPJ pendente) -> `PENDENTE` |
| `RegraValorMaximo` | PF + PJ | Valor <= `valor-maximo-pf` (R$ 50k) ou `valor-maximo-pj` (R$ 200k) — configuravel |
| `RegraPrazoMaximo` | PF + PJ | Prazo em meses <= `prazo-maximo-pf-meses` (12) ou `prazo-maximo-pj-meses` (24) |

### Formula do score

```
score = max(0, scoreInicial - penalidadeFalha * falhas - penalidadePendencia * pendencias)
```

Defaults: `scoreInicial=1000`, `penalidadeFalha=50`, `penalidadePendencia=20`.

### Status sugerido pelo motor

1. Qualquer regra `FALHOU + bloqueante` -> `REJEITADA` (bloqueio absoluto, independente do score)
2. `score >= scorePreAprovacao` (default 700) -> `PRE_APROVADA`
3. `score >= scoreAnalise` (default 400) -> `EM_ANALISE` (mantem; financeiro precisa avaliar)
4. Caso contrario -> `REJEITADA`

### Configuracao

Todos os thresholds via `application.yml` (`app.credito.motor.*`) ou env vars:

```yaml
app:
  credito:
    motor:
      score-inicial: 1000
      penalidade-falha: 50
      penalidade-pendencia: 20
      score-pre-aprovacao: 700
      score-analise: 400
      idade-minima-pessoa: 18
      tempo-minimo-empresa-meses: 6
      valor-maximo-pf: 50000.00
      valor-maximo-pj: 200000.00
      prazo-maximo-pf-meses: 12
      prazo-maximo-pj-meses: 24
```

## Parecer manual

Operador `FINANCEIRO` (nova role da Sprint 8 Task 8.4) registra parecer em
`POST /api/v1/credito/propostas/{id}/parecer`:

- Restrito a `hasRole('FINANCEIRO')` + `@RequireStepUp` (header `X-Step-Up-Token`)
- Justificativa obrigatoria, 10-1000 chars
- 3 decisoes: `APROVAR` (-> `APROVADA`), `REJEITAR` (-> `REJEITADA`), `PENDENCIA`
- Decisao manual **sobrepoe** sugestao do motor (CMN 4.656/2018 Art. 9)
- Versao auto-incrementada com lock pessimista na proposta (`findByIdForUpdate` +
  unique `uq_parecer_credito_versao`) — evita race em pareceres concorrentes
- Score do motor no momento do parecer eh persistido em `parecer_credito.score_motor_snapshot`
  pra auditoria comparar sugestao vs decisao manual

## Como promover usuario a FINANCEIRO

`POST /api/v1/usuarios/{id}/role` (Sprint 8 Task 8.4):

- Restrito a `hasRole('ADMIN')` + `@RequireStepUp`
- ADMIN nao pode alterar a propria role (`USR-403-001`)
- Cadastro publico `POST /api/v1/usuarios` e `POST /api/v1/admin/usuarios` rejeitam role
  `FINANCEIRO` (`USR-400-002`) — promocao obrigatoriamente via endpoint dedicado
- Operacao publica evento `RoleAlteradaEvent` -> `UsuariosAuditListener` grava
  `ROLE_ALTERADO` em `audit_log_seguranca` (AFTER_COMMIT + REQUIRES_NEW)

Payload:

```json
{ "role": "FINANCEIRO" }
```

## Endpoints REST

Todos sob `/api/v1/credito`:

| Metodo | Path | Auth | Descricao |
| ------ | ---- | ---- | --------- |
| `POST` | `/propostas` | `hasRole('CLIENTE')` | Cria proposta a partir de onboarding APROVADO_FINAL |
| `GET`  | `/propostas/{id}` | autenticado | Ownership (CLIENTE) ou FINANCEIRO/ADMIN livre |
| `GET`  | `/propostas` | autenticado | CLIENTE lista proprias; FINANCEIRO/ADMIN filtra (status, tomadorId, page, size) |
| `POST` | `/propostas/{id}/parecer` | `hasRole('FINANCEIRO')` + `@RequireStepUp` | Registra parecer manual |
| `GET`  | `/propostas/{id}/regras` | `hasAnyRole('FINANCEIRO','ADMIN')` | Lista trilha de regras avaliadas |

## Auditoria reforcada

5 tipos novos em `TipoEventoSeguranca` / `audit_log_seguranca` (migration V16):

| Tipo | Origem | Detalhes JSON |
| ---- | ------ | ------------- |
| `PROPOSTA_CRIADA` | listener AFTER_COMMIT | propostaId, solicitacaoOnboardingId |
| `PROPOSTA_AVALIADA_MOTOR` | **gravacao sincrona** dentro da tx do motor (Step 008.6.3) | propostaId, score, statusSugerido, falhas, pendencias |
| `PARECER_REGISTRADO` | listener AFTER_COMMIT | propostaId, parecerId, decisao, justificativa truncada (200 chars), scoreMotorSnapshot |
| `PROPOSTA_APROVADA` | listener AFTER_COMMIT | propostaId, parecerId |
| `PROPOSTA_REJEITADA` | listener AFTER_COMMIT | propostaId, origem (MOTOR ou MANUAL), parecerId quando MANUAL |

Tambem `ROLE_ALTERADO` (Task 8.4 V15): usuarioAlvoId, roleAnterior, roleNova.

`PROPOSTA_AVALIADA_MOTOR` eh **sincrono** pra atender Step 008.6.3 ("motor sem audit
-> PENDENCIA"). Falha de gravacao -> rollback da tx do motor -> `AvaliarPropostaUseCase`
catch global -> `moverParaPendencia` em REQUIRES_NEW isolada.

Demais eventos seguem padrao `OnboardingAuditListener` Sprint 7: AFTER_COMMIT +
REQUIRES_NEW (eventually-consistent).

## Eventos de dominio (consumiveis em sprints futuras)

| Evento | Quando | Consumidor previsto |
| ------ | ------ | ------------------- |
| `PropostaCriadaEvent` | Apos `CriarPropostaCreditoUseCase` | `PropostaAvaliacaoListener` dispara motor; `CreditoAuditListener` |
| `PropostaAprovadaEvent` | Apos parecer manual `APROVAR` (final) | **Sprint 10** (Formalizacao) iniciara contrato; `CreditoAuditListener` |
| `PropostaRejeitadaEvent` | Apos rejeicao (motor ou parecer manual) | `CreditoAuditListener` |
| `ParecerRegistradoEvent` | Sempre que parecer eh persistido | `CreditoAuditListener` |
| `RoleAlteradaEvent` | `AlterarRoleUsuarioUseCase` | `UsuariosAuditListener` |

## Como rodar smoke local

```bash
cd <sep-api-root>
docker compose up -d sep-postgres
./gradlew bootRun
```

Em outro terminal — com Bruno/Postman ou curl:

1. Criar CLIENTE: `POST /api/v1/usuarios` (passphrase 12+ chars)
2. Logar: `POST /api/v1/auth/login` -> guarda `accessToken`
3. Promover ADMIN (manual via SQL ou seed): roles validas: `ADMIN`, `CLIENTE`, `FINANCEIRO`
4. Iniciar onboarding KYC PF e levar ate `APROVADO_FINAL` (ver `ONBOARDING.md` + `PLD.md`)
5. Criar proposta: `POST /api/v1/credito/propostas` com `solicitacaoOnboardingId` da etapa 4
6. Aguardar gravacao de `PROPOSTA_AVALIADA_MOTOR` (sincrona na transacao do motor)
7. Consultar: `GET /api/v1/credito/propostas/{id}` — status deve estar `PRE_APROVADA`/`EM_ANALISE`/`REJEITADA`
8. Promover usuario a FINANCEIRO: `POST /api/v1/usuarios/{id}/role` (ADMIN + step-up)
9. Step-up tokens: completar TOTP em `POST /api/v1/auth/totp/verify` ou usar usuario com MFA desabilitado (bypass documentado)
10. Registrar parecer: `POST /api/v1/credito/propostas/{id}/parecer` (FINANCEIRO + step-up)
11. Validar audit log: `SELECT * FROM audit_log_seguranca WHERE tipo IN ('PROPOSTA_CRIADA', 'PROPOSTA_AVALIADA_MOTOR', 'PARECER_REGISTRADO', 'PROPOSTA_APROVADA')`

## Limitacoes desta Sprint

- **Sem Open Finance**: enriquecimento via movimentacao bancaria entra na Sprint 9
- **Sem calculo financeiro**: juros, taxas, IOF, CET entram na Sprint 10 (Formalizacao) ou Sprint 12 (Cobranca)
- **Limites estaticos por perfil**: nao ha campanha por linha de produto nesta sprint
- **Sem ML / bureau externo**: motor 100% interno + heuristicas declarativas (ADR 0012)
- **Sem UI**: apenas backend (decisao 2026-05-04 — Frontend/Mobile da Fase 2 aguarda contratos estaveis)
- **Sem desembolso**: contratos formalizados na Sprint 10/11; desembolso Pix na Sprint 15

## Evolucao planejada: Open Finance (Sprint 9)

A Sprint 9 complementa este modulo com consentimento Open Finance opcional via
Celcoin/Finansystech. O objetivo e enriquecer o `ScoreInterno` com movimentacao
bancaria consolidada do tomador, sem substituir o parecer manual do operador
`FINANCEIRO`.

Artefatos preparatorios:
- [`OPEN-FINANCE.md`](OPEN-FINANCE.md) — fluxo operacional, endpoints previstos,
  auditoria e limites LGPD.
- [`steps-fase-2/backend/009-sprint-9-steps.md`](../../steps-fase-2/backend/009-sprint-9-steps.md)
  — plano de execucao detalhado da Sprint 9.

## Migrations

| Versao | Conteudo |
| ------ | -------- |
| `V14__criar_tabelas_credito.sql` | 5 tabelas: `proposta_credito`, `score_interno` (1:1), `regra_credito_avaliada` (N:1), `parecer_credito` (N:1 versionado), `decisao_credito` (1:1) + indices + check constraints. FKs sem `ON DELETE CASCADE` (CMN + LGPD — retencao auditavel). |
| `V15__adicionar_role_financeiro_e_audit_role_alterado.sql` | `usuario.role` aceita `FINANCEIRO`; `ROLE_ALTERADO` em `chk_audit_seguranca_tipo`. |
| `V16__ampliar_audit_seguranca_tipo_credito.sql` | 5 tipos em `chk_audit_seguranca_tipo`: `PROPOSTA_CRIADA`, `PROPOSTA_AVALIADA_MOTOR`, `PARECER_REGISTRADO`, `PROPOSTA_APROVADA`, `PROPOSTA_REJEITADA`. |

## Referencias

- ADR 0012 — motor de regras de credito interno (Sprint 8)
- Spec 008 — Sprint 8 credito (regras internas + parecer)
- ADR 0001 — monolito modular DDD
- ADR 0007 — DDD com Hexagonal/Ports & Adapters
- Resolucao CMN 4.656/2018 Art. 9 — analise de credito
- `ONBOARDING.md` — fluxo KYC/KYB que produz APROVADO_FINAL
- `PLD.md` — bases obrigatorias COAF/OFAC/INTERPOL/MTE
