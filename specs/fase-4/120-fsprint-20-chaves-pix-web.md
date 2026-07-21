# Spec 120 - F-Sprint 20 - Gestao de chaves Pix no web

## Metadados

- **ID da Spec**: 120
- **Titulo**: F-Sprint 20 - Gestao assistida de chaves Pix da conta operacional no web
- **Status**: concluida (PR #107 develop / #108 main, 2026-07-21; fecha a pendencia de visibilidade
  web de chaves Pix do Gate F-18.0)
- **Fase do produto**: Fase 4 - Epic 15
- **Trilha**: Web (`sep-app`)
- **Origem**: PRD-FASE-4 §37 (pendencia do marco `v1.0-local`, Gate F-18.0); Sprint backend 31
- **Depende de**: backend Sprint 31 (gestao de chaves Pix) integrada em `develop`; padrao de step-up
  estrito das F-16/17/18
- **Desbloqueia**: fechamento do item de Pix avancado do `v1.0-local` no web (PRD-FASE-4 §37)
- **Responsavel principal**: Devs Plenos Frontend

## Objetivo

Superficie web para **gestao assistida de chaves Pix** da conta operacional/escrow, para as personas
`FINANCEIRO`/`ADMIN`, consumindo o contrato da Sprint backend 31
([`031`](./031-sprint-31-pix-gestao-chaves.md)): `POST/GET/DELETE /api/v1/pix/chaves`. O frontend
apresenta e opera de forma assistida, com **step-up estrito** nas mutacoes; tipo, valor mascarado,
estado (`ATIVA`/`INATIVA`), validacao e idempotencia permanecem autoritativos no backend. Fecha a
pendencia de visibilidade web do recorte de chaves Pix registrada no Gate F-18.0 (PRD-FASE-4 §37).

## Escopo

### Em escopo

- Estender modelos de borda + `PixService` para chaves Pix (espelham os DTOs do backend; leitura
  sempre mascarada) e atualizar o contrato consumido.
- Tela de listagem de chaves (`ATIVA`/`INATIVA`, valor mascarado) com as tres superficies
  (lista / vazia `200 []` / erro tecnico) e refresh por gesto, sem polling.
- Cadastro assistido de chave (`tipo` + `valor`) com step-up estrito e idempotencia.
- Remocao assistida (inativar) com step-up estrito, confirmacao acessivel e `404` neutro.
- Rotas e item de menu restritos a `FINANCEIRO`/`ADMIN`.

### Fora de escopo

- Expor o valor bruto da chave em qualquer superficie, erro ou log.
- Validar tipo, digito verificador ou valor no frontend alem de formato minimo; a regra e do backend.
- Split Pix, Pix automatico, agendamento ou recorrencia.
- Movimentar dinheiro real ou ativar Celcoin/BaaS; providers seguem Fake/WireMock.
- Persona `BACKOFFICE` (o backend restringe a `FINANCEIRO`/`ADMIN`) e alterar o fluxo TOTP/step-up.

## Tasks de implementacao

1. Estender modelos de borda + `PixService` para chaves Pix (DTOs + tres operacoes HTTP) e atualizar
   o contrato consumido (`consumed-contracts.json`, com o header `X-Step-Up-Token` manual).
2. Rota `/app/pix/chaves` (guard `FINANCEIRO`/`ADMIN` + item de menu) e listagem com as tres
   superficies (lista / vazia / erro), refresh por gesto e badge de status.
3. Cadastro assistido de chave (`tipo` + `valor`) com step-up estrito e idempotencia por intencao.
4. Remocao assistida (inativar) com step-up estrito, confirmacao acessivel e `404` neutro.
5. Matriz de erros (`400/403/404/409/422/rede`), concorrencia e acessibilidade sem reinterpretar
   regra.
6. Atualizar MSW stateful e Vitest (contratos, estados, step-up, idempotencia e mascaramento).
7. Smoke Playwright + collections + docs + fechamento.

## Gates que nao contam como task

- Precheck do contrato backend Sprint 31 integrado em `develop`, cadeia Git e baseline verde.
- Confirmar que a leitura nunca expoe o valor bruto da chave.
- Smoke E2E: listar -> cadastrar (redirect para step-up, sem auto-submit) e remover (idem).
- Docs/roadmap/collections e PR description.

## Definition of Done

- `FINANCEIRO`/`ADMIN` lista (mascarado), cadastra e remove chaves Pix no web, com step-up estrito
  nas mutacoes; retornar do step-up nunca cadastra nem remove sozinho.
- Cadastro idempotente: retry ambiguo (rede/`5xx`) reusa a **mesma** `Idempotency-Key`; alterar
  `tipo`/`valor` cria nova intencao/key. A key nunca aparece nem e persistida.
- Valor bruto da chave nunca aparece em leitura, erro ou log; tipos e estados refletem o backend.
- Tres superficies da listagem (lista / vazia / erro) acessiveis; `404` neutro tratado na remocao;
  sem polling.
- MSW/Vitest/Playwright, lint, SCSS lint e build verdes; `contract:check` verde; `npm audit` 0.
- Fecha no web a pendencia de chaves Pix do marco `v1.0-local` (PRD-FASE-4 §37); docs e roadmap
  atualizados no fechamento.
