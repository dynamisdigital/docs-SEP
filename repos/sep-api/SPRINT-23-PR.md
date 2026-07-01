# Sprint 23 — Historico owner-scoped de recebimentos do tomador (B1 da M-Sprint 9)

**Branch**: `feature/sprint-23-cobranca-historico-tomador` (base `origin/develop`)
**Epic/frente**: Epic 8 / Epic 14 — desbloqueio backend B1 da M-Sprint 9
**Spec**: [`023`](../../specs/fase-3/023-sprint-23-cobranca-historico-tomador.md) · **Steps**: [`023`](../../steps-fase-3/backend/023-sprint-23-steps.md)

## Summary

Expõe ao tomador (`ROLE_CLIENTE`) o histórico de recebimentos de uma parcela própria por um contrato REST mínimo e seguro, sem reutilizar a listagem operacional de `FINANCEIRO/ADMIN` nem vazar dados de escrow, operador, idempotência ou integração externa.

```http
GET /api/v1/cobranca/parcelas/{parcelaId}/recebimentos
```

- Exclusivo de `ROLE_CLIENTE` (`@PreAuthorize("hasRole('CLIENTE')")`); `FINANCEIRO/ADMIN` recebem 403.
- Controller dedicado `CobrancaTomadorController`, separado do `CobrancaController` operacional.
- Ownership validada no use case (`parcela → agenda.contratoId → ContratoCobrancaQueryPort`) **antes** de consultar recebimentos.
- Parcela inexistente e parcela de outro tomador → **mesmo 403 uniforme, sem UUID** (anti-enumeração).
- Resposta `RecebimentoTomadorResponse[]` com 4 campos (`recebimentoId`, `valorRecebido`, `dataRecebimento`, `meioPagamento`), ordenada `dataRecebimento DESC`; lista vazia é `200 []`.

## Mudanças por módulo (`cobranca`)

**application**
- `dto/RecebimentoTomadorResult` — record público mínimo (4 campos), sem dependência de web/Jackson.
- `usecase/ConsultarRecebimentosParcelaUseCase` — `@Transactional(readOnly=true)`; ownership antes da consulta; DESC via repository.

**domain**
- `exception/CobrancaOwnershipException` — construtor genérico sem UUID (mensagem `"Recurso de cobranca indisponivel"`), preservando `COB-403-001`. Construtor `(UUID)` legado intocado.

**infrastructure**
- `persistence/RecebimentoRepository` — `findByParcela_IdOrderByDataRecebimentoDesc`. Método ASC preexistente mantido.

**web**
- `dto/RecebimentoTomadorResponse` — record + `@Schema` (exemplos não-sensíveis).
- `mapper/CobrancaWebMapper` — `toRecebimentoTomadorResponse` + variante lista (dedicados; não reutilizam o DTO operacional).
- `controller/CobrancaTomadorController` — endpoint REST + OpenAPI (200/400/401/403).

## Migrations

Nenhuma. Sprint read-only, sem tabela, coluna, evento ou auditoria de leitura.

## Test plan

- `ConsultarRecebimentosParcelaUseCaseTest` (unit): owner com histórico, owner vazio, parcela inexistente (não toca port nem recebimentos), parcela alheia (não toca recebimentos), contrato sem tomador, result só 4 campos.
- `CobrancaTomadorControllerTest` (`@WebMvcTest`): CLIENTE 200, lista vazia `[]`, FINANCEIRO 403, ADMIN 403, `parcelaId` inválido 400, ownership → 403 mensagem genérica sem UUID, JSON sem campos proibidos.
- `RecebimentoRepositoryTest` (`@DataJpaTest`): inserção fora de ordem cronológica prova `dataRecebimento DESC` no banco.
- `CobrancaTomadorConsultaIT` (`@SpringBootTest` + Postgres `sep_test`, segurança real): owner com 2 recebimentos (DESC, com assert de data por posição), owner vazio, outro cliente 403, parcela inexistente 403, endpoint global `/cobranca/recebimentos` segue 403 para cliente, FINANCEIRO/ADMIN 403 no endpoint novo, resposta com exatamente 4 campos.
- Regressão: `CobrancaControllerTest` e `CobrancaIT` intactos.
- Gate final: `./gradlew check` + `./gradlew bootJar` verdes.

## Segurança

- Endpoint isolado por role (`CLIENTE`), ownership derivada do contrato da agenda no backend.
- Não-enumeração: inexistente e alheia indistinguíveis por status e corpo (403 genérico sem UUID).
- Minimização de dados: DTO público não expõe `movimentacaoEscrowId`, `identificadorExterno`, `idempotencyKey`, `observacao`, `registradoPor`, status técnico `novo` ou `statusParcela`.

## Decisões

- Controller dedicado em vez de acoplar ao operacional (responsabilidade unica; superficie minima ao cliente).
- Result de aplicação + DTO web dedicados (não reutilizar `RecebimentoResponse`/`toRecebimentoResponse`).
- Ordenação no repository, nunca no cliente.
- Sem novo padrão GoF (recusa de pattern-itis; consulta simples).

## Dívidas aceitas / fora de escopo

- Sem paginação (recorte por parcela).
- Endpoint operacional `GET /cobranca/recebimentos` inalterado (segue interno).
- Construtores legados de `CobrancaOwnershipException(UUID)` ainda incluem UUID na mensagem nos endpoints antigos — fora do escopo (spec exige não-enumeração apenas no endpoint novo do tomador).

## Follow-ups

- **M-9.4 (mobile)**: liberada somente após o merge da Sprint 23 em `develop`.
- Sprint 24 (B2 — renegociação ativa owner-scoped) na sequência, antes de retomar a M-Sprint 9.

## Commits

```
d90306a feat(cobranca): consultar recebimentos de parcela propria
1b1d307 feat(cobranca): expor historico de recebimentos ao tomador
236cac4 test(cobranca): cobrir historico owner-scoped
edbe3e4 test(cobranca): reforcar assercao de ordem no historico do tomador
```
