# Sprint 31 — Gestao assistida de chaves Pix da conta operacional (Epic 15)

> Branch: `feature/sprint-31-pix-gestao-chaves` -> `develop`.
> Spec: [`specs/fase-4/031-sprint-31-pix-gestao-chaves.md`](../../specs/fase-4/031-sprint-31-pix-gestao-chaves.md) · Steps: [`steps-fase-4/backend/031-sprint-31-steps.md`](../../steps-fase-4/backend/031-sprint-31-steps.md).

## O que entrega

Gestao **assistida** (financeiro/admin) de chaves Pix da conta operacional/escrow via Provider
Pattern — recorte inicial de Pix avancado da Fase 4. Roda sobre **fake default**; o skeleton
Celcoin e coberto por WireMock e **nao e ativado** (Fase 5). **Nenhum dinheiro e movido**;
desembolso/recebimento/conciliacao (Sprints 19-21) ficam intocados.

```http
POST    /api/v1/pix/chaves            # FINANCEIRO/ADMIN + step-up estrito + Idempotency-Key
GET     /api/v1/pix/chaves            # FINANCEIRO/ADMIN, read-only local, sem step-up
DELETE  /api/v1/pix/chaves/{chaveId}  # FINANCEIRO/ADMIN + step-up estrito; 404 neutro
```

- `POST`: 201 cria / 200 replay idempotente (mesma key + mesmo tipo/valor); key reutilizada com
  payload diferente ou chave equivalente ja ATIVA -> 409; tipo/valor invalido -> 400 sem ecoar o
  valor; conta operacional indisponivel -> 422.
- `DELETE`: remocao **logica** `ATIVA -> INATIVA` (historico preservado); 204 tambem no replay de
  chave ja INATIVA; falha do provider mantem a chave ATIVA (retentativa segura).
- `GET`: lista local mascarada (ATIVA + INATIVA, mais recente primeiro); nunca consulta provider.

## Decisoes tecnicas

- **Minimizacao (CMN 4.656/2018 + LGPD)**: o valor bruto da chave existe apenas no request e na
  chamada ao provider (memoria). Persistencia (`chave_pix`, V58) guarda somente `valor_hash`
  SHA-256 + `valor_mascarado`; resposta, erro, evento, auditoria e log nunca carregam valor, hash
  interno, `provider_key_id` ou idempotency key.
- **Normalizacao** (`NormalizadorChavePix`, contrato fechado no Gate 31.0): CPF 11 / CNPJ 14
  digitos **com digitos verificadores mod-11 e rejeicao de sequencias repetidas** (review manual);
  TELEFONE E.164 `+55DDDNUMERO` (DDD digitos 1-9); EMAIL trim+lowercase (regex estrita, limite
  DICT 77); EVP UUID canonico. Hash/mascara/provider usam o mesmo valor normalizado.
- **Cadastro serializado por advisory lock** (review manual — P1): `pg_advisory_xact_lock` em
  (conta, tipo, hash) adquirido antes das verificacoes e da chamada externa — corrida de mesmo
  valor com keys diferentes nao cadastra duas chaves no provider (perdedor leva 409 sem chamada
  externa; zero chave orfa). UNIQUEs da V58 (idempotencia + chave ativa) + CHECK de coerencia
  seguem como defesa residual, convergidas para replay/409, nunca 500.
- **Provider antes de persistir** no cadastro: falha externa nao cria chave ATIVA nem auditoria;
  provider honra idempotencia (mesma key) permitindo retry seguro; sem compensacao automatica.
- **Fake sem retencao de valor** (review manual — P2): o mapa de idempotencia guarda fingerprint
  SHA-256 do comando, nunca o valor em claro.
- **Remocao serializada**: `SELECT FOR UPDATE` escopado na conta — remocoes concorrentes fazem
  uma unica chamada de provider/auditoria; replay e no-op.
- **`PixProvider` evoluido** (sem mecanismo paralelo): `cadastrarChave`/`removerChave`;
  `FakePixProvider` idempotente/thread-safe com falhas armaveis; `CelcoinPixProvider`
  `POST/DELETE /pix/keys` = **contrato skeleton local da Fase 4** (validar na Fase 5), 404 no
  DELETE = sucesso idempotente sem retry.
- **Conta operacional por porta** (`ContaOperacionalEscrowQueryPort`): titular `SEP-COBRANCA`
  ATIVA (fonte unica desde a Sprint 12); `pix` nao acessa repository de `escrow` diretamente.
- **Auditoria** (V59): `PIX_CHAVE_CADASTRADA`/`PIX_CHAVE_REMOVIDA`, AFTER_COMMIT + REQUIRES_NEW,
  1x por transicao efetiva; `usuario_id` = operador; detalhes = chaveId/conta local/tipo/status.

## Migrations

- `V58__criar_chave_pix.sql` — tabela minimizada + UNIQUEs + CHECKs + indice de listagem.
- `V59__ampliar_audit_seguranca_tipo_chave_pix.sql` — CHECK completo (base V57) + 2 tipos.

## Testes (todos verdes)

| Camada | Suite |
| ------ | ----- |
| Normalizacao | `NormalizadorChavePixTest` (43; inclui DV mod-11 e sequencias repetidas) |
| Dominio | `ChavePixTest` (9) |
| Persistencia/concorrencia | `ChavePixRepositoryTest` (9; locks FOR UPDATE e advisory com 2 transacoes reais) |
| Provider fake | `FakePixProviderTest` (17; 8 legados sem regressao) |
| Skeleton Celcoin | `CelcoinPixProviderIT` (19 WireMock; 11 legados sem regressao) |
| Use cases | `CadastrarChavePixUseCaseTest` (16; inclui ordem lock->provider e corrida sem chave orfa), `ListarChavesPixUseCaseTest` (4), `RemoverChavePixUseCaseTest` (6) |
| Auditoria | `PixChaveAuditListenerTest` (2) |
| Borda web | `PixChaveControllerTest` (13, `@WebMvcTest` + aspect real) |
| E2E | `PixChaveIT` (8; auth real + Postgres: fluxo completo, replay, colisao normalizada, falha de provider, minimizacao fim a fim, auditoria unica) |

`./gradlew check` e `bootJar` verdes (baseline 1975 -> ver checkpoint final da sprint).

## Fora de escopo (spec)

Split/Pix automatico/agendamento; mover dinheiro; ativar Celcoin real; expor valor bruto.

## Commits

1. `feat(pix): modelar chave da conta operacional`
2. `fix(pix): endurecer validacao de email e DDD na chave` (code review 31.1)
3. `feat(pix): persistir chaves com minimizacao`
4. `test(pix): assertar constraint por causa raiz` (code review 31.2)
5. `feat(pix): adicionar chaves ao provider fake`
6. `feat(pix): criar skeleton de chaves Celcoin`
7. `feat(pix): cadastrar chave com idempotencia`
8. `feat(pix): listar e remover chaves`
9. `feat(pix): publicar endpoints de chaves` (Task 31.7)
10. `test(pix): endurecer guard de banco no PixChaveIT` (code review 31.7)
11. `fix(pix): fechar findings do review manual da sprint` (P1 advisory lock; P2 fake fingerprint; P2 DV CPF/CNPJ)
