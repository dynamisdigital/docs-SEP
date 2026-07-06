# Sprint 26 — Leitura Pix owner-scoped (Gates P1-P3 da M-Sprint 11)

Branch: `feature/sprint-26-pix-leitura-owner-scoped` (base `origin/develop`).
Spec: [`026`](../../specs/fase-3/026-sprint-26-pix-leitura-owner-scoped.md) · Step: [`026`](../../steps-fase-3/backend/026-sprint-26-steps.md).

## Summary

Entrega os tres contratos backend owner-scoped que bloqueavam a M-Sprint 11 (Pix mobile). Tres GET
read-only, minimos e de leitura local que expoem o estado Pix ao tomador e a credora **donos** da
operacao — sem liberar nenhuma rota operacional das Sprints 19-21 a `CLIENTE`, sem provider,
conciliacao, step-up, migration, evento ou auditoria nova.

| Gate | Endpoint | Auth | Resposta |
| ---- | -------- | ---- | -------- |
| P1 | `GET /api/v1/pix/contratos/{contratoId}/desembolso` | `hasRole('CLIENTE')` | `PixDesembolsoTomadorResponse { status: StatusPixPublico, valor, atualizadoEm }` |
| P2 | `GET /api/v1/pix/parcelas/{parcelaId}/status` | `hasRole('CLIENTE')` | `PixPagamentoParcelaResponse { status: StatusPixParcelaPublico, valor, atualizadoEm, mensagemPublica }` |
| P3 | `GET /api/v1/credores/carteira/{operacaoId}/pix` | `isAuthenticated()` (sem role `CREDORA`) | `PixOperacaoCredoraResponse { status: String, valor, atualizadoEm }` |

Ownership validada ANTES de revelar; recurso inexistente e recurso alheio retornam o mesmo `404`
neutro sem UUID (anti-enumeracao). Papel operacional nos endpoints de cliente → `403`.

## Mudancas por modulo

### `pix`
- Enums publicos `StatusPixPublico` (P1/P3) e `StatusPixParcelaPublico` (P2) em `domain/vo` — nunca
  reutilizam `StatusPixTransferencia`/DTOs operacionais.
- `StatusPixPublicoMapper` (transferencia → publico, fonte unica) e `StatusPixParcelaPublicoMapper`
  (precedencia referencia+recebimento; estados terminais da referencia autoritativos;
  `atualizadoEm` = `dataModificacao` da fonte vencedora; `mensagemPublica` sanitizada).
- Use cases `ConsultarDesembolsoTomadorUseCase` (P1), `ConsultarStatusPixParcelaUseCase` (P2),
  `ConsultarStatusPixPorContratoUseCase` (read-component sem ownership, consumido pelo P3).
- Porta `ParcelaTomadorQueryPort` + adapter (parcela → `agenda.contratoId` → `tomadorId`).
- Novo finder `PixTransferenciaRepository.findFirstByContratoIdOrderByDataCriacaoDesc` (sem filtro
  de status) e `PixReferenciaRecebimentoRepository.findFirstByParcelaIdOrderByDataCriacaoDesc` +
  `PixRecebimentoRepository.findFirstByReferenciaIdOrderByDataCriacaoDesc`.
- `PixLeituraNaoEncontradaException` (404 neutro P1/P2). Controller `PixTomadorController`.

### `credores`
- Porta consumer-driven `PixOperacaoStatusQueryPort` + `PixOperacaoStatusView` (status como
  `String`, sem depender do dominio de `pix`); adapter delega ao `pix`.
- `ConsultarStatusPixOperacaoCredoraUseCase` (credora por `usuarioId` → operacao por
  `findByIdAndEmpresaCredoraId` → status por `operacao.contratoId`).
- `StatusPixOperacaoNaoEncontradoException` (404 **generico sem UUID** — as excecoes de carteira
  existentes ecoam o UUID). Endpoint `GET /{id}/pix` em `EmpresaCredoraCarteiraController`.

## Migrations

`V53__indexar_pix_recebimento_referencia.sql` — indice parcial composto `pix_recebimento
(referencia_id, data_criacao DESC) WHERE referencia_id IS NOT NULL`, adicionado no code review para a
consulta da P2 (`findFirstByReferenciaIdOrderByDataCriacaoDesc`). Sem mudanca de schema de dominio
(nenhum status, evento ou tabela novos).

## Decisoes

- **404 neutro uniforme** {alheio, inexistente, sem-pix} em todos os gates; papel operacional → 403
  do `@PreAuthorize` (nao tratado no corpo).
- P3 sem role `CREDORA` (acesso por presenca de credora), consistente com Sprints 16-17.
- Mapa de status transferencia→publico em fonte unica (`StatusPixPublicoMapper`), reusado por P1 e
  P3; P3 recebe o status como `String` na fronteira consumer-driven.
- P2: recebimento buscado pela `referenciaId` da referencia atual (nunca latest-by-parcela) e
  estados terminais da referencia autoritativos (ambos vindos do code review por Task).

## Dividas aceitas / follow-ups

- **Collection Postman/Insomnia nao retrofitada** (adiamento aprovado pelo usuario no code review):
  segue congelada no Sprint 14; refresh completo (Sprints 16-26) e backlog separado; retrofitar so a
  Sprint 26 deixaria a collection inconsistente; contrato vigente = OpenAPI/springdoc em runtime.
- `ConsultarDesembolsoTomadorUseCase` (P1) poderia delegar o find+map ao read-component do P3
  (`ConsultarStatusPixPorContratoUseCase`) — cleanup opcional, nao feito para manter a Task 26.1
  cirurgica.
- Endpoint operacional `GET /credores/carteira/{id}` (detalhe, Sprint 17) segue ecoando o UUID no
  404 — pre-existente, fora de escopo.

## Test plan

- `./gradlew check` verde (suite completa + spotless).
- Unit: `StatusPixPublicoMapperTest`, `StatusPixParcelaPublicoMapperTest`,
  `ConsultarDesembolsoTomadorUseCaseTest`, `ConsultarStatusPixParcelaUseCaseTest`,
  `ConsultarStatusPixPorContratoUseCaseTest`, `ConsultarStatusPixOperacaoCredoraUseCaseTest`.
- Web (`@WebMvcTest`): `PixTomadorControllerTest`, `EmpresaCredoraCarteiraControllerTest`.
- Integracao E2E (auth real + Postgres `sep_test`): `PixTomadorLeituraIT` (P1/P2),
  `CredoraOperacaoPixIT` (P3) — ownership, 404 anti-enumeracao, finder sem filtro, ordenacao,
  pareamento por `referenciaId`, isolamento dos endpoints operacionais (403 para `CLIENTE`).

## Commits

```
1173d9f feat(pix): expor status de desembolso ao tomador
7b066f1 feat(pix): expor status pix da parcela ao tomador
694d925 fix(pix): estado terminal da referencia vence recebimento posterior
da2958f feat(credores): expor status pix da operacao da carteira
892771a test(pix): cobrir leitura pix owner-scoped com integracao
```

## Pos-merge

Apos merge em `origin/develop`: marcar os Gates P1-P3 da M-Sprint 11 como fechados (ja refletido no
step 211) e liberar a Task M-11.1 mobile. Promocao a `main` conforme cadeia de integracao vigente.
