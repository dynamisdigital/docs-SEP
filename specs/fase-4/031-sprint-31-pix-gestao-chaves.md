# Spec 031 - Sprint 31 - Gestao de chaves Pix (assistido)

## Metadados

- **ID da Spec**: 031
- **Titulo**: Sprint 31 - Gestao assistida de chaves Pix da conta operacional/escrow
- **Status**: planejada (recorte de Pix avancado escolhido: gestao de chaves)
- **Fase do produto**: Fase 4 - Epic 15 (capacidade avancada, recorte inicial)
- **Trilha**: Backend (`sep-api`)
- **Origem**: PRD-FASE-4 §35 (Epic 15 - recorte "gestao avancada de chaves")
- **Depende de**: modulo `pix` (Sprints 19-21), `escrow` (Sprint 19), Sprint 27 (step-up)
- **Desbloqueia**: visibilidade de chaves no web/mobile (F-18/M-16, quando aplicavel)
- **Responsavel principal**: Dev Senior Backend

## Objetivo

Entregar o recorte inicial de Pix avancado escolhido por produto: **gestao de chaves Pix**
(cadastro, consulta e remocao) da conta operacional/escrow, de forma **assistida** pelo financeiro,
via Provider Pattern. Nesta fase roda sobre **fake default + WireMock skeleton**; nao move dinheiro e
nao ativa provider real (Fase 5).

## Contrato REST

```http
POST    /api/v1/pix/chaves
GET     /api/v1/pix/chaves
DELETE  /api/v1/pix/chaves/{chaveId}
```

### Autorizacao

- `ROLE_FINANCEIRO`/`ROLE_ADMIN`; mutacoes (`POST`/`DELETE`) com **step-up**.
- Idempotencia no cadastro; remocao idempotente.
- Erros nao vazam o valor bruto da chave nem dados de provider.

### Estados de `ChavePix`

```text
ATIVA -> INATIVA
```

## Escopo

### Em escopo

- Modelar dominio `ChavePix` (tipo, valor mascarado em leitura, status ATIVA/INATIVA) + migration.
- Porta `PixKeyProvider` (ou extensao do `PixProvider`) com fake default + WireMock skeleton.
- Use cases assistidos: cadastrar, listar (mascarado), remover (inativar) com step-up nas mutacoes.
- Endpoints `POST/GET/DELETE` + DTOs dedicados.
- Auditoria `PIX_CHAVE_CADASTRADA`/`REMOVIDA`.
- Cobrir CRUD, autorizacao, step-up, idempotencia e mascaramento.

### Fora de escopo

- Split Pix, Pix automatico, agendamento ou recorrencia.
- Mover dinheiro, desembolso, recebimento ou conciliacao (Sprints 19-21 permanecem intactas).
- Ativar adapter Celcoin real (Fase 5).
- Expor o valor bruto da chave em leitura ou log.

## Tasks de implementacao

1. Modelar `ChavePix` (tipo/status/valor mascarado) + migration.
2. Porta `PixKeyProvider` + fake default + WireMock skeleton (sucesso/erro).
3. Use case cadastrar chave (assistido, step-up, idempotente) + auditoria.
4. Use cases listar (mascarado) e remover/inativar (assistido, step-up) + auditoria.
5. Endpoints `POST/GET/DELETE` + DTOs; erros sem vazar valor bruto.
6. Cobrir com testes CRUD, autorizacao, step-up, idempotencia e mascaramento; atualizar OpenAPI,
   `PIX.md` e collection.

## Gates que nao contam como task

- Confirmar Sprints 19-21 e 27 integradas em `develop`.
- Baseline `./gradlew check`; WireMock para o adapter HTTP.
- Confirmar que leitura nunca expoe o valor bruto da chave.
- Checkpoint e PR description da Sprint 31.

## Definition of Done

- Financeiro/admin cadastra, lista (mascarado) e remove chaves Pix, com step-up nas mutacoes.
- `PixKeyProvider` roda em fake por default; skeleton real coberto por WireMock, sem ativar.
- Nenhum dinheiro e movido; Sprints 19-21 permanecem inalteradas.
- Valor bruto da chave nunca aparece em leitura, erro ou log.
- Testes e `./gradlew check` passam.
