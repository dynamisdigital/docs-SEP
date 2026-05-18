# PR — Sprint 8 (Credito — regras internas + parecer)

Artefato exigido pela Task 8.9 (steps `008-sprint-8-steps.md`). Conteudo abaixo
deve ser usado ao abrir o PR manualmente (`gh pr create --base develop ...` ou via UI).

## Titulo sugerido

```
feat(credito): Sprint 8 — analise de credito interna (motor + parecer + audit)
```

## Resumo

- Implementa o **modulo `credito`** (Epic 6 parte 1) com analise de credito interna
  conforme **Resolucao CMN 4.656/2018 Art. 9**: proposta -> motor de regras Java puro
  (ADR 0012) -> parecer manual auditavel por operador `FINANCEIRO`.
- Adiciona role `FINANCEIRO` (nova) + endpoint dedicado de promocao
  (`POST /api/v1/usuarios/{id}/role`) restrito a `ADMIN + step-up`. Cadastros publicos
  rejeitam FINANCEIRO (`USR-400-002`) — bypass do fluxo auditado de promocao bloqueado.
- 5 endpoints REST em `/api/v1/credito` com OpenAPI completo + 5 use cases de
  aplicacao + motor de regras com 5 heuristicas (Onboarding, IdadeMin PF, Tempo
  Empresa PJ, Valor Max, Prazo Max) configuraveis via `application.yml`.
- Trilha auditavel reforcada: 5 tipos novos em `audit_log_seguranca`
  (`PROPOSTA_CRIADA`, `PROPOSTA_AVALIADA_MOTOR`, `PARECER_REGISTRADO`,
  `PROPOSTA_APROVADA`, `PROPOSTA_REJEITADA`) + `ROLE_ALTERADO` da Task 8.4.
  `PROPOSTA_AVALIADA_MOTOR` gravado **sincrono** dentro da tx do motor (Step 008.6.3
  — motor sem audit -> PENDENCIA); demais via listener `AFTER_COMMIT + REQUIRES_NEW`.

## Escopo tecnico

### Migrations

| Versao | Conteudo |
| ------ | -------- |
| `V14__criar_tabelas_credito.sql` | 5 tabelas: `proposta_credito`, `score_interno` (1:1), `regra_credito_avaliada` (N:1 auditavel), `parecer_credito` (N:1 versionado com `uq_parecer_credito_versao`), `decisao_credito` (1:1) + indices + checks. FKs sem `ON DELETE CASCADE` (CMN + LGPD — retencao auditavel). Cross-check `chk_decisao_credito_parecer_manual` garante origem MANUAL exige parecer_id e MOTOR exige null. |
| `V15__adicionar_role_financeiro_e_audit_role_alterado.sql` | `usuario.role` aceita `FINANCEIRO`; `ROLE_ALTERADO` em `chk_audit_seguranca_tipo`. |
| `V16__ampliar_audit_seguranca_tipo_credito.sql` | 5 tipos novos em `chk_audit_seguranca_tipo` (`PROPOSTA_*` + `PARECER_REGISTRADO`). |

### Dominio (`credito.domain`)

- Agregado raiz `PropostaCredito` com maquina de estados encapsulada
  (`aplicarSugestaoMotor`, `marcarPendencia`, `registrarDecisaoManual`).
  Construtor `protected` + factory `criar(...)` (UUID v6).
- Entidades filhas: `ScoreInterno` (1:1), `RegraCreditoAvaliada` (N:1),
  `ParecerCredito` (N:1 versionado), `DecisaoCredito` (1:1).
- VOs: `StatusProposta`, `TipoOperacao`, `Money` (record BigDecimal escala 2),
  `DecisaoParecer`, `OrigemDecisao`, `ResultadoRegra`.
- 5 eventos: `PropostaCriadaEvent`, `ParecerRegistradoEvent`, `PropostaAprovadaEvent`,
  `PropostaRejeitadaEvent`. (`PropostaAvaliadaPeloMotorEvent` removido — gravacao
  sincrona no fix de code review Task 8.6.)
- 3 exceptions: `PropostaInvalidaException` (400), `PropostaNaoEncontradaException`
  (404), `StatusPropostaInvalidoException` (400). Codigos `CRD-403-001` (ownership) e
  `CRD-422-001` (onboarding nao aprovado) via novas excecoes shared
  `OwnershipPropostaException`/`OnboardingNaoAprovadoException` mapeadas em
  `ApiExceptionHandler`.

### Motor de regras (ADR 0012)

- Interface `RegraCredito` + 5 implementacoes `@Component` em `application.service.regras/`:
  `RegraOnboardingAprovado` (bloqueante), `RegraIdadeMinimaPessoa`,
  `RegraTempoExistenciaEmpresa`, `RegraValorMaximo`, `RegraPrazoMaximo`.
- `MotorRegrasCredito` agrega via `List<RegraCredito>` injetada por Spring.
- `CreditoMotorProperties` (record `@ConfigurationProperties("app.credito.motor")`)
  com 11 thresholds; validacao na construcao.
- Score = `max(0, scoreInicial - penalidadeFalha * falhas - penalidadePendencia * pendencias)`;
  bloqueio absoluto sobrepoe score.

### Use cases

- `CriarPropostaCreditoUseCase` (CLIENTE -> proposta + `PropostaCriadaEvent`)
- `AvaliarPropostaUseCase` orquestrador (sem `@Transactional`) + `PropostaAvaliacaoTransacional`
  (2 metodos `REQUIRES_NEW`: happy path + `moverParaPendencia`). Falha em qualquer
  ponto -> catch global -> PENDENCIA em tx isolada (evita rollback-only).
- `RegistrarParecerUseCase` `@Transactional` com `findByIdForUpdate` (`@Lock(PESSIMISTIC_WRITE)`)
  pra serializar pareceres concorrentes.
- `ConsultarPropostaCompletaUseCase` retorna `PropostaCompletaView`
  (proposta + score + ultimo parecer) — evita controller acessar repository.
- `ListarPropostasUseCase` + `ListarRegrasAvaliadasUseCase` (paginado).
- `AlterarRoleUsuarioUseCase` (ADMIN-only + step-up + `RoleAlteradaEvent`).

### REST + DTOs (`credito.web`)

- 5 endpoints em `/api/v1/credito/propostas` (POST/GET/GET listar/POST parecer/GET regras)
  + `POST /api/v1/usuarios/{id}/role`. OpenAPI completo (200/201/400/401/403/404/422).
- DTOs records com `jakarta.validation`; `CreditoWebMapper` MapStruct.
- `OpenApiConfigTest` atualizado: 5 paths novos + 7 schemas novos validados.

### Auditoria

- `CreditoAuditListener` (4 handlers `@TransactionalEventListener(AFTER_COMMIT) + REQUIRES_NEW`)
  + `UsuariosAuditListener` (1 handler para `ROLE_ALTERADO`).
- `PROPOSTA_AVALIADA_MOTOR` gravado SINCRONO em `PropostaAvaliacaoTransacional.avaliar()`
  — falha de audit causa rollback (Step 008.6.3).
- LGPD: detalhes JSON contem ids + score + decisao + justificativa truncada (200 chars).
  Sem CPF/CNPJ/payloads brutos.
- `ObjectMapper.writeValueAsString` escapa aspas/backslash/newline.

### Endpoints

| Metodo | Path | Auth |
| ------ | ---- | ---- |
| `POST` | `/api/v1/credito/propostas` | `hasRole('CLIENTE')` |
| `GET`  | `/api/v1/credito/propostas/{id}` | autenticado (ownership ou FINANCEIRO/ADMIN) |
| `GET`  | `/api/v1/credito/propostas` | autenticado (filtros status/tomadorId; FINANCEIRO/ADMIN livre) |
| `POST` | `/api/v1/credito/propostas/{id}/parecer` | `hasRole('FINANCEIRO')` + `@RequireStepUp` |
| `GET`  | `/api/v1/credito/propostas/{id}/regras` | `hasAnyRole('FINANCEIRO','ADMIN')` |
| `POST` | `/api/v1/usuarios/{id}/role` | `hasRole('ADMIN')` + `@RequireStepUp` |

## Como validar

```bash
cd <sep-api-root>
./gradlew clean check
./gradlew bootJar
```

Cobertura JaCoCo do modulo `credito` >= 70% (gate global enforced).

IT do credito requer banco isolado `sep_test`:

```bash
docker exec sep-postgres psql -U sep -d postgres -c "CREATE DATABASE sep_test"
./gradlew test --tests "com.dynamis.sep_api.credito.web.CreditoIT"
```

Smoke manual via Postman/Insomnia/Bruno — ver `CREDITO.md` §"Como rodar smoke local".

## Riscos / pendencias

- `PROPOSTA_AVALIADA_MOTOR` eh sincrono; demais eventos sao eventually-consistent
  (AFTER_COMMIT). Padrao alinhado com `OnboardingAuditListener` Sprint 7.
- Lock pessimista em `findByIdForUpdate` exige tx ativa — bug pego no IT
  (`Query requires transaction be in progress`) por overload sem `@Transactional`
  no `RegistrarParecerUseCase` (corrigido em `a79f177`).
- Outros ITs (`OnboardingPessoaIT`, `OnboardingEmpresaIT`, etc.) continuam em profile
  `dev`; migracao para `test` fica como sprint futura.
- Numeracao ADR: spec referencia "ADR 0011" — numero ja ocupado em 2026-04-27
  (reavaliacao stack frontend). Motor de regras documentado em **ADR 0012** com nota
  de renumeracao no topo.
- ADR 0012 e CREDITO.md vivem em `docs-SEP`, fora deste PR — alteracoes documentais
  permanecem manuais (regra do projeto).

## Referencias

- Spec: [`specs/fase-2/008-sprint-8-credito-regras-parecer.md`](../../specs/fase-2/008-sprint-8-credito-regras-parecer.md)
- Steps: [`steps-fase-2/backend/008-sprint-8-steps.md`](../../steps-fase-2/backend/008-sprint-8-steps.md)
- ADR motor: [`adr/0012-motor-de-regras-de-credito-interno.md`](../../adr/0012-motor-de-regras-de-credito-interno.md)
- ADR Hexagonal: [`adr/0007-ddd-com-hexagonal-ports-and-adapters-por-modulo.md`](../../adr/0007-ddd-com-hexagonal-ports-and-adapters-por-modulo.md)
- Resolucao CMN 4.656/2018 — Art. 9

## Commits

```
7f73d49 feat(credito): modelar propostas e persistencia de credito           (Task 8.1)
03005ce feat(credito): implementar motor de regras interno                   (Task 8.2)
985e50a feat(credito): criar use cases de proposta e avaliacao               (Task 8.3)
434fb15 fix(credito): codigos HTTP 403/422 + isolar PENDENCIA em REQUIRES_NEW (fix 8.3)
d29ed70 feat(credito): adicionar role FINANCEIRO e parecer manual            (Task 8.4)
490bf41 fix(credito,usuarios): bloquear FINANCEIRO no cadastro + lock parecer (fix 8.4)
7b326d8 feat(credito): expor contratos REST de propostas                     (Task 8.5)
44b537b fix(credito): cobrir step-up, restringir POST a CLIENTE, extrair use cases (fix 8.5)
574ae41 feat(credito): auditar eventos de analise de credito                 (Task 8.6)
0329859 fix(credito,usuarios): audit motor sincrono + ROLE_ALTERADO via listener (fix 8.6)
a79f177 test(credito): cobrir ciclo de proposta e parecer em IT + fix tx parecer (Task 8.8)
45c526d fix(credito): isolar IT em sep_test + cobrir step-up real + rejeicao manual (fix 8.8)
```
