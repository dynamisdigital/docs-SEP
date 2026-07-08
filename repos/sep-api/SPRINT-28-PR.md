# Sprint 28 - Portas de persistencia do modulo cobranca

> Descricao de PR da Sprint 28 (`feature/sprint-28-cobranca-portas-persistencia` -> `develop`).
> **Mergeada**: PR #91 (develop, `6a4f5d6`) + PR #92 (main, `1f111e2`), 2026-07-08.

**Spec**: [`028-sprint-28-cobranca-portas-persistencia.md`](../../specs/fase-4/028-sprint-28-cobranca-portas-persistencia.md)
**Steps**: [`028-sprint-28-steps.md`](../../steps-fase-4/backend/028-sprint-28-steps.md)

## Summary

Fecha o follow-up 3 da Fase 3 (ADR 0007): os 14 use cases de `cobranca` deixam de injetar
repositories Spring Data/JPA e passam a depender de portas de saida em `application.port.out`,
com adapters de delegacao pura em `infrastructure.adapter.persistence`. Refactor **100%
behavior-preserving**: zero mudanca de contrato REST, DTO, regra de negocio, evento, auditoria,
migration ou semantica de erro — suite identica antes/depois (**1840 testes, 0 falhas**).

## Portas e adapters criados

| Porta (`application.port.out`) | Metodos | Adapter |
|---|---|---|
| `ParcelaCobrancaPort` | `buscarPorId`, `buscarPorIdComLock`, `existePorId`, `listarPorContratoOrdenadoPorNumero`, `listarTodas`, `listarPorStatusOrdenadoPorVencimento`, `salvar`, `salvarEFlush` | `ParcelaCobrancaPersistenceAdapter` |
| `AgendaPagamentoCobrancaPort` | `buscarAtivaPorContrato`, `salvar`, `salvarEFlush` | `AgendaPagamentoPersistenceAdapter` |
| `RecebimentoCobrancaPort` (read-only) | `buscarPorIdempotencyKey`, `listarPorParcelaOrdenadoPorDataDesc`, `listarTodosComParcelaOrdenadoPorDataDesc` | `RecebimentoPersistenceAdapter` |
| `RenegociacaoCobrancaPort` | `buscarPorIdComLock`, `buscarPorParcelaOriginalEStatus`, `existePorParcelaOriginalEStatus`, `salvar`, `salvarEFlush` | `RenegociacaoPersistenceAdapter` |
| `EventoCobrancaPort` | `jaNotificado`, `salvar` | `EventoCobrancaPersistenceAdapter` |

Regras seguidas: metodos espelham SOMENTE o que os use cases consomem (auditoria da Task 28.1);
nomes por intencao com lock/flush/fetch-join/idempotencia explicitos; dominio nas assinaturas;
zero `org.springframework.data.*`/`jakarta.persistence.*` nas portas; nenhuma porta CRUD generica.
`Recebimento` persiste por cascade da parcela — porta de recebimento sem escrita. Queries, locks e
`@EntityGraph` permanecem nos repositories JPA (repository tests intactos).

## Use cases refatorados (14/14)

- **28.3 leitura/parcela/agenda**: ConsultarAgendaPorContrato, ConsultarParcelas,
  CalcularValorAtualizadoParcela, GerarAgendaPagamento (TransactionTemplate + race
  `DataIntegrityViolationException` preservados), ListarInadimplencia.
- **28.4 recebimento/eventos**: ConsultarRecebimentos, ConsultarRecebimentosParcela (owner-scoped
  Sprint 23), RegistrarRecebimento (3 camadas de idempotencia + lock), RegistrarContatoCobranca,
  EscalarCobranca (guard de reemissao).
- **28.5 renegociacao**: Iniciar (race `uq_renegociacao_parcela_ativa`), Aceitar (flush da agenda
  original antes da substituta — UNIQUE parcial), Recusar, ConsultarRenegociacaoAtivaTomador
  (ownership-antes-de-revelar + expiracao por Clock, Sprint 24).

Fora do escopo (mantem repositories direto, conforme spec/auditoria): jobs (`EscaladorCobrancaJob`,
`ExpirarRenegociacaoJob`, `MarcarParcelaAtrasadaJob`, `MarcarParcelaInadimplenteJob`), listeners
(`CobrancaAuditListener`, `ParcelaAtrasouListener`, `RenegociacaoPropostaListener`),
`WorkflowCobrancaSeeder` e `WorkflowCobrancaRepository`.

## Garantias de nao-mudanca comportamental

- Invariantes da Sprint 27 intactas: ownership antes de estado, 403 neutro, step-up estrito.
- Idempotencia: 3 camadas do recebimento (pre-lock, pos-lock, consistencia de chave), guard de
  notificacao, UNIQUEs de agenda/renegociacao com excecoes atravessando adapters inalteradas.
- Locks pessimistas preservados (`buscarPorIdComLock` -> `findByIdForUpdate`).
- Eventos publicados com mesmos payloads e ordem.
- Task 28.6: zero import de `cobranca.infrastructure.persistence` nos use cases; portas sem
  Spring Data/JPA; suite focada de cobranca, `spotlessCheck`, `check` e `bootJar` verdes.

## Testes

Suite completa: **1840 testes, 0 falhas** (identica a baseline pre-refactor — prova de
preservacao). 10 unit tests de use case migrados pra mocks de porta sem enfraquecer assercoes
(verify de lock nunca chamado no atalho idempotente, captors de agenda substituta, races).
Repository tests e ITs (`RenegociacaoIT`, `CobrancaIT` etc.) inalterados.

## Reviews

1 review de subagente por task de codigo: 28.2 (1 finding — escritas de `ParcelaCobrancaPort`
retornando entidade — corrigido em `8f0fab7`), 28.3/28.4/28.5 zero findings. Review manual do
usuario apos 28.6: ok.

## Riscos / Follow-ups

- Jobs/listeners/seeder com repositories direto — proxima iteracao SE houver dor real
  (pattern-itis evitado deliberadamente).
- Javadoc de `ParcelaCobrancaPort` menciona `infrastructure.persistence` como referencia textual
  (nao import) — informativo.

## Commits

1. `03b068b` refactor(cobranca): introduzir portas de persistencia
2. `8f0fab7` refactor(cobranca): retornar entidade nas escritas de ParcelaCobrancaPort (hotfix review 28.2)
3. `bd8fd1a` refactor(cobranca): usar portas nos use cases de leitura, parcela e agenda
4. `386e9ca` refactor(cobranca): usar portas nos use cases de recebimento e eventos
5. `80a10e0` refactor(cobranca): usar portas nos use cases de renegociacao
