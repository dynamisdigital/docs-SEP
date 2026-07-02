# Sprint 24 — Consulta owner-scoped de renegociação ativa do tomador (B2 da M-Sprint 9)

**Branch**: `feature/sprint-24-cobranca-renegociacao-tomador` (base `origin/develop`, após Sprint 23)
**Epic/frente**: Epic 8 / Epic 14 — desbloqueio backend B2 da M-Sprint 9
**Spec**: [`024`](../../specs/fase-3/024-sprint-24-cobranca-renegociacao-tomador.md) · **Steps**: [`024`](../../steps-fase-3/backend/024-sprint-24-steps.md)

## Summary

Permite ao tomador (`ROLE_CLIENTE`) descobrir e ler os termos financeiros de uma renegociação ativa da própria parcela **antes** de aceitar ou recusar, por um contrato REST mínimo e seguro, sem expor IDs operacionais, dados do operador ou justificativa interna. Estende o `CobrancaTomadorController` criado na Sprint 23.

```http
GET /api/v1/cobranca/parcelas/{parcelaId}/renegociacao-ativa
```

- Exclusivo de `ROLE_CLIENTE` (`@PreAuthorize("hasRole('CLIENTE')")`); `FINANCEIRO/ADMIN` recebem 403.
- **Read-only, sem `@RequireStepUp`** — os PATCHes de aceite/recusa seguem inalterados.
- Ownership validada no use case (`parcela → agenda.contratoId → ContratoCobrancaQueryPort`) **antes** de revelar se existe proposta.
- Parcela inexistente e parcela de outro tomador → **mesmo 403 uniforme, sem UUID** (anti-enumeração); parcela própria sem proposta ativa → `404`.
- Só `StatusRenegociacao.PROPOSTA` ainda não expirada pelo `Clock` é retornada; proposta vencida antes do job vira `404`.
- `valorTotalRenegociado = novoValorParcela * numeroParcelas` calculado no backend (`BigDecimal`), nunca no mobile.

## Mudanças por módulo (`cobranca`)

**application**
- `dto/RenegociacaoTomadorResult` — record público (10 campos), sem dependência de web/Jackson; sem justificativa/operador/IDs de agenda/statusParcelaAnterior.
- `usecase/ConsultarRenegociacaoAtivaTomadorUseCase` — `@Transactional(readOnly=true)`; ownership antes de buscar a proposta; filtro `expirouEm(now(Clock))`; total em `BigDecimal`. Não dispara o job de expiração.

**domain**
- `exception/RenegociacaoNaoEncontradaException` — factory `semPropostaAtiva()` com mensagem genérica **sem UUID**, preservando `COB-404-003` e o construtor `(UUID)` usado pelos PATCHes.

**web**
- `dto/RenegociacaoTomadorResponse` — record + `@Schema` (10 campos públicos, exemplos não-sensíveis).
- `mapper/CobrancaWebMapper` — `toRenegociacaoTomadorResponse` dedicado (não reutiliza `RenegociacaoResponse.from`, que expõe IDs de agenda, operador e justificativa).
- `controller/CobrancaTomadorController` — endpoint REST + OpenAPI (200/400/401/403/404). PATCHes intocados.

## Migrations

Nenhuma. Sprint read-only, sem tabela, coluna, novo status, evento ou auditoria de leitura.

## Test plan

- `ConsultarRenegociacaoAtivaTomadorUseCaseTest` (unit): owner com PROPOSTA futura (termos + total 600,00 calculado no backend); consulta usa só status `PROPOSTA` (estados finais não são ativos); expiração `== agora` não é ativa; vencida antes do job não é ativa; parcela inexistente → ownership sem tocar contrato/renegociação; parcela alheia → ownership sem tocar renegociação; contrato sem tomador → ownership.
- `CobrancaTomadorControllerTest` (`@WebMvcTest`, cenários novos): CLIENTE 200 + `verifyNoInteractions(stepUpTokenService)`; sem proposta 404; ownership → 403 genérico sem UUID; `parcelaId` inválido 400; FINANCEIRO 403; ADMIN 403; JSON sem campos proibidos.
- `RenegociacaoIT` (`@SpringBootTest` + Postgres `sep_test`, segurança real — 7 cenários novos): owner recebe termos/total e GET não altera status; cliente alheio 403; parcela inexistente 403; parcela própria sem proposta 404; proposta vencida pelo `Clock` 404 antes do job (renegociação segue `PROPOSTA` no banco); `GET ativa → PATCH aceite (step-up) → GET 404` (parcela `RENEGOCIADA`); `GET ativa → PATCH recusa (sem step-up) → GET 404` (parcela volta a `ATRASADA`).
- Regressão: `AceitarRenegociacaoUseCaseTest`, `RecusarRenegociacaoUseCaseTest`, `ExpirarRenegociacaoJobTest` e demais `*CobrancaTomador*` intactos.
- Gate final: `./gradlew check` + `./gradlew bootJar` verdes.

## Segurança

- Endpoint isolado por role (`CLIENTE`), ownership derivada do contrato da agenda no backend.
- Não-enumeração: inexistente e alheia indistinguíveis por status e corpo (403 genérico sem UUID). 404 de "sem proposta ativa" também sem UUID (mensagem genérica de `semPropostaAtiva()`).
- Minimização de dados: DTO público não expõe `tomadorId`, `propostaPor`, `agendaOriginalId`, `agendaSubstitutaId`, `statusParcelaAnterior`, `justificativa` ou payload de notificação/auditoria/provider.
- GET read-only, sem step-up e sem mutação.

## Decisões

- Estende o `CobrancaTomadorController` da Sprint 23 em vez de novo controller (mesma superfície owner-scoped do cliente).
- Result de aplicação + DTO web dedicados; não reutilizar `RenegociacaoResponse`, que expõe campos operacionais.
- Total calculado no backend; o mobile nunca deriva o valor.
- Factory `semPropostaAtiva()` **sem** argumento em vez do `porParcela(UUID)` sugerido no step: a spec proíbe UUID na mensagem de erro (spec > step), e o corpo do 404 usa `ex.getMessage()` — um UUID vazaria no corpo. Sem argumento inútil (clean-code).
- Sem novo padrão GoF (recusa de pattern-itis; consulta simples com repository/use case existentes).

## Dívidas aceitas / fora de escopo

- Sem alteração dos PATCHes de aceite/recusa, do job de expiração ou da regra de prazo.
- Sem proposta de renegociação pelo tomador (segue `FINANCEIRO/ADMIN`).
- Construtor legado `RenegociacaoNaoEncontradaException(UUID)` ainda inclui UUID na mensagem nos endpoints internos — fora do escopo (spec exige não-enumeração apenas no endpoint novo do tomador).
- **Arquitetura hexagonal (ADR 0007) — dívida aceita de módulo**: o `ConsultarRenegociacaoAtivaTomadorUseCase` injeta `ParcelaCobrancaRepository`/`RenegociacaoRepository` de `infrastructure.persistence` diretamente, seguindo o padrão de **14/14** use cases do módulo `cobranca` (incluindo o irmão B1 `ConsultarRecebimentosParcelaUseCase`, já mergeado). Extrair portas só nesta sprint divergiria do módulo e do B1; a refatoração para portas de persistência deve ser **module-wide**, em tarefa dedicada / melhoria de fim-de-fase. Registrado em `COBRANCA.md §limitações`.

## Follow-ups

- **M-9.5 (mobile)**: liberada somente após o merge da Sprint 24 em `develop`. Ao retomar, DTOs mobile devem espelhar `RenegociacaoTomadorResponse`, não o `RenegociacaoResponse` interno.
- Fecha o par de desbloqueios B1/B2; retomar M-9.4/M-9.5/M-9.6 na mesma branch `feature/msprint-9-cobranca-mobile`.

## Commits

```
12574d4 feat(cobranca): consultar renegociacao ativa do tomador
1c34869 feat(cobranca): expor termos de renegociacao ao tomador
e5743a5 test(cobranca): cobrir consulta de renegociacao ativa
8bcedfd test(cobranca): comparar valores de renegociacao por BigDecimal
```
