# Sprint 25 — Leitura do interesse ativo da credora (Gate I1 da M-Sprint 10)

**Branch**: `feature/sprint-25-credora-interesse-ativo` (base `origin/develop` == `main`)
**Epic/frente**: Epic 10 / Epic 14 — desbloqueio backend do Gate I1 da M-Sprint 10 mobile
**Origem**: [`210` §Gate I1](../../specs/fase-3/210-msprint-10-credora-mobile.md) · **Steps**: [`025`](../../steps-fase-3/backend/025-sprint-25-steps.md)

## Summary

Fecha o Gate backend bloqueante I1 da M-10: expõe uma leitura autoritativa do interesse ativo da credora numa oportunidade, sem a qual o mobile não distingue `Manifestar interesse` de `Cancelar interesse` após reload ou novo login. Contrato **Opção A** (GET dedicado), simétrico ao `DELETE .../interesses/me` já existente.

```http
GET /api/v1/credores/oportunidades/{id}/interesses/me
```

- `@PreAuthorize("isAuthenticated()")`, **read-only, sem `@RequireStepUp`**.
- `200 InteresseResponse` (sempre `status ATIVO`) quando existe interesse ativo da credora do usuário na oportunidade.
- `404` neutro quando o usuário não possui credora **ou** não possui interesse ativo — mesmas exceções 404 do `DELETE` (anti-enumeração; não diferencia sem-credora / sem-interesse / recurso alheio).
- Ownership no backend: a credora é resolvida por `usuarioId` **antes** de buscar o interesse.

## Mudanças por módulo (`credores`)

**application**
- `usecase/ConsultarInteresseAtivoCredoraUseCase` — `@Transactional(readOnly=true)`. Resolve a credora (`EmpresaCredoraRepository.findByUsuarioId` → 404) antes de buscar o interesse; reusa `InteresseCredoraRepository.findByEmpresaCredoraIdAndOportunidadeIdAndStatus(..., ATIVO)` (→ 404). Retorna `InteresseView`. Sem evento, mutação, lock ou auditoria.

**web**
- `controller/EmpresaCredoraOportunidadeController` — novo `GET /{id}/interesses/me` + OpenAPI (200/401/404); reusa `CarteiraCredoraWebMapper.toResponse(InteresseView)` → `InteresseResponse`. Demais endpoints (POST/DELETE interesse, lista, detalhe, sync) intocados.

Reuso deliberado: nenhum DTO novo (`InteresseResponse`/`InteresseView`/mapper já existiam), nenhum método novo de repository (query já usada pelo `CancelarInteresseCredoraUseCase`).

## Migrations

Nenhuma. Sprint read-only, sem tabela, coluna, novo status, evento ou auditoria de leitura.

## Test plan

- `CarteiraCredoraUseCaseTest` (unit, seção `ConsultarInteresseAtivo`): sucesso com interesse `ATIVO` (view + `never().save`); sem interesse → `InteresseNaoEncontradoException`; sem credora → `EmpresaCredoraNaoEncontradaException` + interesse **não** é buscado antes da credora (ordem de ownership).
- `CarteiraCredoraIT` (`@SpringBootTest` + Postgres `sep_test`, segurança real — 3 cenários novos, 10 no total): 200 com `status=ATIVO`/`oportunidadeId` e **exatamente 4 campos** (`aMapWithSize(4)` — sem vazamento); sem interesse → 404 neutro; sem credora → 404 neutro; ciclo `registrar → GET 200 → cancelar → GET 404` (prova o filtro JPA por `ATIVO` — `CANCELADO` não retorna) com auditoria `REGISTRADO==1` (GET não emite evento); interesse de outra credora não visível (escopo por credora).
- Regressão: `*credores*` verde (use cases, IT, domínio).
- Gate final: `./gradlew check` + `./gradlew bootJar` verdes.

## Segurança

- Endpoint autenticado; ownership derivada da credora do usuário no backend (id de rota é localizador).
- Não-enumeração: sem-credora, sem-interesse e recurso alheio → mesmo `404` neutro (exceções `CRD-404-001`/`CRD-404-003`, ambas `RecursoNaoEncontradoException`).
- Minimização: `InteresseResponse` expõe só `id`, `oportunidadeId`, `status`, `dataCriacao` (assertiva negativa `aMapWithSize(4)`).
- GET read-only, sem step-up e sem mutação.

## Decisões

- **Opção A (GET dedicado) sobre Opção B (`interesseAtual` no `OportunidadeResponse`)**: A é aditiva e cirúrgica, não altera o DTO consumido por web F-11 / mobile já entregues e evita N+1/join por credora na listagem de oportunidades. Simétrica ao `DELETE .../interesses/me`.
- Reusar repository/DTO/mapper existentes; sem novo método de persistência, sem novo padrão GoF (recusa de pattern-itis).
- Testes adicionados a `CarteiraCredoraUseCaseTest`/`CarteiraCredoraIT` (convenção do módulo — todos os use cases de interesse/carteira já vivem ali) em vez de arquivo dedicado sugerido no step 025.1.1.

## Dívidas aceitas / fora de escopo

- **Arquitetura hexagonal (ADR 0007) — dívida de módulo**: o use case injeta `infrastructure.persistence` diretamente, seguindo o padrão de todos os use cases de `credores` (Sprints 16-17). Extração de portas de persistência é *module-wide*, para melhoria de fim-de-fase (registrado em `CREDORES.md §Divida tecnica aceita`).
- **Collection**: o módulo `credores` ainda não está na `sep-api.postman_collection.json` (gap herdado das Sprints 16-17). Não retrofitado aqui (evita scope creep de um gate pequeno); OpenAPI runtime (springdoc) já expõe o endpoint. Followup abaixo.
- Fix de formatação (spotless) do teste unitário introduzido na Task 25.1 entrou no commit da Task 25.2 (import não usado + quebra de linha).

## Follow-ups

- **M-Sprint 10 mobile**: a Task M-10.4 (manifestar/cancelar com estado correto após reload) só fecha o DoD **após o merge desta sprint em `develop`**. A borda mobile (M-10.1) deve espelhar `InteresseResponse` e chamar `GET .../interesses/me` como leitura autoritativa.
- **Collection (backlog dedicado — dívida aceita nesta sprint)**: a `sep-api.postman_collection.json` está congelada no **Sprint 14** (Backoffice). Faltam os módulos das Sprints 16-25: `credores` (perfil/elegibilidade/oportunidades/interesse[POST/GET/DELETE]/carteira), `pix` (19-21), observabilidade (22), cobrança-tomador B1/B2 (23-24) e o próprio GET desta sprint. Decisão (2026-07-03): não retrofitar parcialmente — abrir uma **tarefa de documentação dedicada** para refresh completo da collection cobrindo Sprints 16-25 de uma vez. Até lá, o contrato vigente é o OpenAPI runtime (springdoc, `/v3/api-docs`).

## Commits

```
affd879 feat(credores): consultar interesse ativo da credora
2c9e134 feat(credores): expor leitura do interesse ativo ao mobile
9ed6483 test(credores): cobrir leitura do interesse ativo
608ba3c fix(credores): 404 neutro na leitura de interesse ativo
```
