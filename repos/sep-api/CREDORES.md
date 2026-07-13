# CREDORES - sep-api

Documento operacional do modulo `credores` (Epic 10 — Jornada da empresa credora). Epic 10
backend concluido em duas sprints:
- **Sprint 16** (foundation): cadastro da empresa credora, elegibilidade derivada do onboarding
  PJ, perfil operacional, endpoints REST e auditoria.
- **Sprint 17** (oportunidades e carteira): oportunidades de investimento, manifestacao de
  interesse e carteira de operacoes financiadas por associacao assistida.

> Specs: [`016`](../../specs/fase-3/016-sprint-16-credora-foundation.md), [`017`](../../specs/fase-3/017-sprint-17-credora-oportunidades-carteira.md).
> Dependencias: [`ONBOARDING.md`](./ONBOARDING.md) (porta read-only de onboarding PJ), [`PLD.md`](./PLD.md) (status final do onboarding reflete o resultado PLD), [`CREDITO.md`](./CREDITO.md) + [`CONTRATOS.md`](./CONTRATOS.md) + [`COBRANCA.md`](./COBRANCA.md) (leitura via ports na Sprint 17).

## Objetivo

Representar a empresa que aporta recursos na plataforma sem duplicar onboarding/KYB. O modulo
liga um usuario autenticado a um onboarding PJ ja aprovado, registra o perfil operacional da
credora e deriva sua elegibilidade do resultado KYB/PLD existente. Aportes, oportunidades e
carteira ficam para a Sprint 17.

## Escopo da Sprint 16

Em escopo: cadastro da credora a partir de onboarding PJ, perfil operacional, elegibilidade,
consultas (propria e administrativa), auditoria.

Fora de escopo: aportes financeiros, carteira, oportunidades, alocacao, Pix/escrow externo,
UI web/mobile.

## Modelo de dominio

- `EmpresaCredora` (agregado raiz) — vinculo logico com `usuario` (`usuario_id`) e com o
  onboarding PJ (`onboarding_id`, referencia a `solicitacao_onboarding` do tipo `EMPRESA`).
  Snapshot de `cnpj` (14 digitos) e `razao_social` derivados do KYB. Carrega `status`
  (`StatusCredora`) e `elegibilidade` (`StatusElegibilidade`) + `motivo_inelegibilidade`.
- `PerfilCredora` (1:1 com `EmpresaCredora` via `empresa_credora_id`) — perfil operacional:
  `tipo_credora` (`TipoCredora`) e `capacidade_aporte` (opcional).

VOs:
- `StatusCredora`: `CADASTRADA` -> `ATIVA` (apos ELEGIVEL) -> `SUSPENSA`.
- `StatusElegibilidade`: `PENDENTE` (inicial) | `ELEGIVEL` | `INELEGIVEL`.
- `TipoCredora`: `EMPRESA` | `INSTITUICAO_FINANCEIRA`.

Vinculos com usuario e onboarding sao logicos (sem FK fisica cross-module, mesma diretriz da
V33/backoffice). A FK `perfil_credora -> empresa_credora` nao tem `ON DELETE CASCADE` (preserva
trilha LGPD/CMN 4.656). Unicidade por `usuario_id`, `onboarding_id` e `cnpj`.

## Integracao com onboarding (sem acoplamento ao repositorio interno)

O modulo `onboarding` publica a porta read-only
`onboarding.application.query.ConsultarEmpresaParaCredoraQuery` -> `EmpresaParaCredoraResumo`
(`solicitacaoId`, `usuarioId`, `tipoSolicitante`, `status`, `cnpj`, `razaoSocial`). `credores`
consome essa porta — mesmo padrao que `credito` usa com `ConsultarOnboardingParaCreditoQuery`.
`cnpj`/`razaoSocial` vem do `KybEmpresa`; ficam nulos quando a solicitacao nao e PJ ou ainda
nao tem KYB.

A elegibilidade nao reexecuta KYB/PLD: deriva do status do onboarding no momento do cadastro.

```text
status onboarding -> elegibilidade credora
  APROVADO_FINAL          -> ELEGIVEL    (credora -> ATIVA)
  REPROVADO | REPROVADO_PLD -> INELEGIVEL (credora permanece CADASTRADA)
  demais                  -> PENDENTE
```

## Fluxo de cadastro (`CadastrarEmpresaCredoraUseCase`, @Transactional)

```text
POST /api/v1/credores  (usuario autenticado, body: onboardingId, tipoCredora, capacidadeAporte)
  1. consulta onboarding via porta read-only      -> ausente: 404
  2. tipoSolicitante != EMPRESA                    -> 422 (CRD-422-001 naoEmpresa)
  3. onboarding.usuarioId != autenticado           -> 403 (CRD-403-001 ownership)
  4. cnpj nulo (KYB incompleto)                    -> 422 (CRD-422-001 kybIncompleto)
  5. ja existe credora p/ usuario / onboarding / cnpj -> 409 (CRD-409-001)
  6. cria EmpresaCredora (cnpj/razao do KYB) + deriva elegibilidade
  7. cria PerfilCredora
  8. publica EmpresaCredoraCadastradaEvent + (se decidida) EmpresaCredoraElegibilidadeDefinidaEvent
  -> 201 + EmpresaCredoraResponse (cnpj formatado)
```

## Endpoints REST (`/api/v1/credores`)

| Metodo | Path | Autorizacao | Descricao |
|--------|------|-------------|-----------|
| POST | `/` | `isAuthenticated()` | Cadastra credora a partir de onboarding PJ aprovado (201) |
| GET | `/me` | `isAuthenticated()` | Consulta a credora do usuario autenticado (200/404) |
| GET | `/me/elegibilidade` | `isAuthenticated()` | Status de elegibilidade da credora propria (200/404) |
| GET | `/{id}` | `hasRole('ADMIN')` | Consulta administrativa de qualquer credora (200/403/404) |

DTOs em `credores.web.dto`; mapeamento via `EmpresaCredoraWebMapper` (MapStruct), que formata o
CNPJ (`00.000.000/0000-00`). Documentacao OpenAPI por endpoint.

## Auditoria

Eventos de dominio consumidos por `CredoresAuditListener`
(`@TransactionalEventListener(AFTER_COMMIT)` + `@Transactional(REQUIRES_NEW)`, mesmo padrao do
`OnboardingAuditListener`). Grava em `audit_log_seguranca`; detalhes carregam apenas
identificadores tecnicos e CNPJ mascarado (LGPD/CMN 4.656).

Tipos de evento (`TipoEventoSeguranca`, migration V39):
- `CREDORA_CADASTRADA` — credora criada.
- `CREDORA_ELEGIVEL` — decisao de elegibilidade ELEGIVEL.
- `CREDORA_INELEGIVEL` — decisao de elegibilidade INELEGIVEL.

## Migrations

- `V38__criar_tabelas_credores.sql` — tabelas `empresa_credora` e `perfil_credora` + constraints
  de unicidade (`usuario_id`, `onboarding_id`, `cnpj`) e CHECKs de enum.
- `V39__ampliar_audit_seguranca_tipo_credora.sql` — adiciona os 3 tipos de evento ao CHECK de
  `audit_log_seguranca` (forward-only, preserva tipos anteriores).

## Testes

`EmpresaCredoraIT` (E2E, profile `test`, Postgres real) — 10 cenarios: cadastro feliz
(APROVADO_FINAL -> ATIVA/ELEGIVEL + auditoria), onboarding REPROVADO -> INELEGIVEL, rejeicoes
404 (inexistente), 422 (PF), 403 (onboarding de outro usuario), 409 (duplicado), consulta
propria + elegibilidade, consulta administrativa (ADMIN 200, nao-ADMIN 403).

## Sprint 17 — Oportunidades e carteira

Permite que a credora elegivel veja oportunidades de investimento (derivadas de propostas
aprovadas/formalizadas), manifeste/cancele interesse e acompanhe uma carteira inicial de
operacoes financiadas. **Sem aporte real, Pix, escrow externo ou matching automatico.** A
carteira nasce por associacao operacional assistida e explicita (admin) — interesse NAO vira
carteira automaticamente.

### Modelo de dominio

- `OportunidadeInvestimento` — snapshot 1:1 de uma proposta elegivel (`proposta_id` UNIQUE):
  `contrato_id` (logico), `valor`, `prazo_meses`, `taxa_juros_mensal`, `status`
  (`StatusOportunidade`: `DISPONIVEL` | `ENCERRADA`). Materializada por sync explicito.
- `InteresseCredora` — credora x oportunidade; `status` (`StatusInteresseCredora`: `ATIVO` |
  `CANCELADO`); cancelamento idempotente; UNIQUE parcial de 1 interesse ATIVO por
  credora+oportunidade.
- `OperacaoFinanciada` — associacao credora x contrato (carteira); nasce `ASSOCIADA`
  (`StatusOperacaoFinanciada`: `ASSOCIADA` | `ENCERRADA`), com `justificativa` operacional;
  UNIQUE `(empresa_credora_id, contrato_id)`.

Factories validam invariantes (requireNonNull, valor>=0, prazo>0, justificativa nao-blank).

### Leitura cross-module (ports orientadas a necessidade)

`credores.application.port.out` declara ports consumidas pelos use cases; adapters em
`credores.infrastructure.adapter.{credito,contratos,cobranca}` traduzem os repositorios dos
modulos donos (padrao consumer-side, sem `credores` alterar esses modulos e sem expor entidades
JPA):
- `ConsultarPropostasElegiveisParaCredoraPort` -> `PropostaElegivelView` (propostas `APROVADA` +
  `contratoId` quando ha contrato).
- `ConsultarContratoParaCarteiraCredoraPort` -> `ContratoCarteiraView` (status contratual como
  String).
- `ConsultarCobrancaParaCarteiraCredoraPort` -> `CarteiraCobrancaResumo` (agregado de parcelas e
  recebimentos; sem dado sensivel do tomador).

### Use cases

- `SincronizarOportunidadesInvestimentoUseCase` — admin; upsert idempotente por `propostaId`.
  Sem listener cross-module nem scheduler obrigatorio.
- `ListarOportunidadesCredoraUseCase` / `ConsultarOportunidadeCredoraUseCase` — credora propria.
- `RegistrarInteresseCredoraUseCase` — exige credora `ATIVA` + `ELEGIVEL`, oportunidade
  `DISPONIVEL`, sem interesse ativo duplicado.
- `CancelarInteresseCredoraUseCase` — ownership; idempotente.
- `ConsultarCarteiraCredoraUseCase` / `ConsultarOperacaoCarteiraUseCase` — enriquecidas via
  `OperacaoCarteiraEnricher` (snapshot + contrato + cobranca).
- `AssociarOperacaoFinanciadaUseCase` — admin; associacao assistida. Exige credora elegivel,
  contrato em `StatusFormalizacao.ASSINADO` (carteira nao recebe contrato nao formalizado) e
  ausencia de operacao duplicada. Se `contratoId` informado divergir do contrato da oportunidade
  -> 400.

### Endpoints REST

| Metodo | Path | Autorizacao | Descricao |
|--------|------|-------------|-----------|
| GET | `/api/v1/credores/oportunidades` | `isAuthenticated()` | Lista oportunidades disponiveis da credora |
| GET | `/api/v1/credores/oportunidades/{id}` | `isAuthenticated()` | Detalhe de oportunidade |
| POST | `/api/v1/credores/oportunidades/{id}/interesses` | `isAuthenticated()` | Registra interesse (201) |
| GET | `/api/v1/credores/oportunidades/{id}/interesses/me` | `isAuthenticated()` | Consulta o interesse ativo proprio (200/404) — Sprint 25 |
| DELETE | `/api/v1/credores/oportunidades/{id}/interesses/me` | `isAuthenticated()` | Cancela interesse proprio (204) |
| POST | `/api/v1/credores/oportunidades/sync` | `hasRole('ADMIN')` | Sincroniza oportunidades |
| GET | `/api/v1/credores/carteira` | `isAuthenticated()` | Lista carteira da credora |
| GET | `/api/v1/credores/carteira/{id}` | `isAuthenticated()` | Detalhe de operacao (ownership) |
| POST | `/api/v1/credores/carteira/operacoes` | `hasRole('ADMIN')` + `@RequireStepUp` | Associa operacao assistida (201) |

### Auditoria (Sprint 17)

`CredoresAuditListener` grava (AFTER_COMMIT + REQUIRES_NEW): `CREDORA_INTERESSE_REGISTRADO`,
`CREDORA_INTERESSE_CANCELADO`, `CREDORA_OPERACAO_ASSOCIADA` (V41 amplia o CHECK).

### Migrations (Sprint 17)

- `V40__criar_tabelas_carteira_credora.sql` — `oportunidade_investimento`, `interesse_credora`,
  `operacao_financiada`; UNIQUE parcial de interesse ativo; UNIQUE `(empresa_credora_id,
  contrato_id)`; FKs internas sem CASCADE; refs cross-module logicas.
- `V41__ampliar_audit_seguranca_tipo_carteira_credora.sql` — +3 tipos (forward-only).

### Testes (Sprint 17)

- `CarteiraCredoraIT` (E2E) — fluxo sync -> lista -> interesse -> 409 dup -> cancela -> associar
  (admin) -> carteira + auditoria; inelegivel 422; sync nao-admin 403; sem credora 404; operacao
  de outra credora 404.
- `CarteiraCredoraUseCaseTest` (unit, mocks) — sucesso/inelegivel/duplicidade/ownership/contrato
  divergente/contrato nao assinado/sincronizacao.
- `CarteiraCredoraDomainTest` — transicoes de dominio.

### Divida tecnica aceita

- Use cases de `credores` dependem de `infrastructure.persistence` (repositories) diretamente,
  nao de ports de persistencia em `application.port.out`. Mantem o padrao herdado da Sprint 16 e
  o precedente de `cobranca`. Refator para ports de persistencia fica como divida aceita, a ser
  tratada em sprint de hardening junto com os demais modulos.

## Sprint 25 — Leitura do interesse ativo (Gate I1 da M-10)

Fecha o Gate backend bloqueante I1 da M-Sprint 10 mobile: expor uma leitura autoritativa do
interesse ativo da credora numa oportunidade, sem a qual o app nao distingue `Manifestar` de
`Cancelar` apos reload/novo login. Contrato aprovado = Opcao A (GET dedicado), simetrico ao
`DELETE .../interesses/me`.

- `GET /api/v1/credores/oportunidades/{id}/interesses/me` (`isAuthenticated()`, sem step-up):
  `200 InteresseResponse` (sempre `status ATIVO`) quando existe interesse ativo da credora do
  usuario; `404` neutro quando o usuario nao possui credora **ou** nao possui interesse ativo.
- `ConsultarInteresseAtivoCredoraUseCase` — read-only (`@Transactional(readOnly = true)`). Resolve
  a credora por `usuarioId` **antes** de buscar o interesse (nao revela existencia a quem nao possui
  credora) e reusa `InteresseCredoraRepository.findByEmpresaCredoraIdAndOportunidadeIdAndStatus(...,
  ATIVO)`. Sem evento, mutacao, lock ou auditoria.
- Sem migration, sem novo DTO (reusa `InteresseResponse` + `InteresseView` + mapper), sem novo
  metodo de repository, sem novo padrao GoF.
- Testes: `CarteiraCredoraUseCaseTest` (unit — sucesso/sem-interesse/sem-credora + ordem de
  ownership) e `CarteiraCredoraIT` (E2E — 200 com apenas 4 campos, 404 neutro, ciclo
  registrar->ler->cancelar->ler 404 provando o filtro JPA `ATIVO`, GET sem auditoria, ownership
  entre credoras).
- Ao mergear a Sprint 25 em `develop`, o Gate I1 fecha e libera a Task M-10.4 (spec/steps 210).

> Collection: o modulo `credores` ainda nao esta na `sep-api.postman_collection.json` (gap herdado
> das Sprints 16-17). Nao retrofitado aqui para evitar scope creep; registrado como followup.

## Sprint 29 — Aporte assistido da credora + escrow (Epic 15, Fase 4)

Modela e expoe o aporte da credora em operacao financiada da carteira, iniciado de forma
**assistida** por `FINANCEIRO`/`ADMIN` e registrado no escrow **fake/local** — nenhum dinheiro real
e movido; a ativacao Celcoin/BaaS fica na Fase 5. Detalhe do lado escrow em
[`PIX.md`](./PIX.md) (secao "Aporte da credora no escrow").

### Modelo e estados

- `AporteCredora` (`aporte_credora`, V54): `operacaoId`, `empresaCredoraId`, `valor` (scale 2),
  `moeda` (fixa `BRL`), `status`, `idempotencyKey`, `referenciaEscrow` (interna — nunca exposta),
  `motivoFalhaSanitizado`. Transicoes encapsuladas no dominio:
  `PENDENTE -> EM_PROCESSAMENTO -> LIQUIDADO | FALHOU` (`FALHOU` tambem de `PENDENTE`).
- Idempotencia: `UNIQUE (operacao_id, idempotency_key)` — replay do mesmo POST retorna o mesmo
  aporte; FKs sem `ON DELETE CASCADE` (trilha CMN 4.656/LGPD).

### Endpoints (`/api/v1/credores/operacoes/{operacaoId}/aportes`)

- `POST` — `hasAnyRole('FINANCEIRO','ADMIN')` + `@RequireStepUpEstrito` (sem bypass de MFA) +
  header `Idempotency-Key` obrigatorio. `201` novo / `200` replay idempotente (mesmo valor);
  `400` (key ausente/valor invalido), `404` neutro (operacao inexistente, sem UUID), `409`
  (operacao encerrada ou contrato nao `ASSINADO`; key reutilizada com valor divergente). DTO
  publico minimo: `id`, `operacaoId`, `status`, `valor`, `dataCriacao`, `dataAtualizacao`.
- `GET` — `isAuthenticated()`, read-only, **sem step-up**. Owner-scoped: financeiro/admin (visao
  operacional) ou credora dona (presenca de credora, posse via `findByIdAndEmpresaCredoraId`
  antes de listar). Usuario sem credora, operacao alheia e inexistente = `404` neutro
  indistinguivel. Lista vazia valida; ordenacao por criacao decrescente.

### Fluxo e use cases

- `RegistrarAporteCredoraUseCase` — valida comando (400), resolve operacao com
  `SELECT FOR UPDATE` (serializa concorrentes: replay paralelo vira `200`, nao violacao de
  UNIQUE), checa idempotencia **antes** da elegibilidade (replay estavel), valida operacao
  `ASSOCIADA` + contrato `ASSINADO` via `ConsultarContratoParaCarteiraCredoraPort`, persiste
  `PENDENTE`, registra no escrow via `RegistrarAporteEscrowPort` e avanca para
  `EM_PROCESSAMENTO`. Falha do escrow desfaz tudo na mesma tx (`AporteEscrowException`
  sanitizada).
- `ReconciliarAporteCredoraUseCase` — **sem endpoint REST** nesta fase: o escrow e local e nao ha
  provider externo emitindo callback; o "webhook do provider fake" e chamada direta ao use case
  (testes/smoke). A Fase 5 pluga o webhook real aqui. Le o aporte por `referenciaEscrow` com
  `FOR UPDATE`; replay identico = no-op sem auditoria; resultado divergente apos terminal =
  `409`; `404` neutro para referencia desconhecida. Liquidacao credita a wallet (uma vez) via
  `ReconciliarAporteEscrowPort`.
- `ConsultarAportesOperacaoUseCase` — leitura owner-scoped (read-only) dos aportes da operacao.

### Auditoria (Sprint 29)

`CREDORA_APORTE_REGISTRADO` (ator financeiro/admin, 1x por aporte novo),
`CREDORA_APORTE_LIQUIDADO` e `CREDORA_APORTE_FALHOU` (terminais, 1x, sem ator — sistema), via
eventos de dominio + `CredoresAuditListener` (AFTER_COMMIT + REQUIRES_NEW). Payloads sem
idempotency key nem referencia de escrow. CHECK ampliado na V55.

### Migrations (Sprint 29)

- `V54__criar_aporte_credora.sql` — tabela + UNIQUE de idempotencia + indices de leitura.
- `V55__ampliar_audit_seguranca_tipo_aporte_credora.sql` — 3 tipos `CREDORA_APORTE_*`.

### Testes (Sprint 29)

- Dominio: `AporteCredoraDomainTest` (transicoes, validacoes, sem vazamento em mensagens).
- Use cases: `RegistrarAporteCredoraUseCaseTest`, `ReconciliarAporteCredoraUseCaseTest`,
  `ConsultarAportesOperacaoUseCaseTest`; escrow: `ReconciliarAporteEscrowUseCaseTest` +
  aportes em `RegistrarMovimentacaoEscrowUseCaseTest`; adapter: `AporteEscrowAdapterTest`.
- Web (`@WebMvcTest` + aspect real): `AporteCredoraControllerTest` (roles, step-up estrito sem
  bypass, 201/200/400/403/404/409, campos proibidos).
- E2E (`AporteCredoraIT`, auth real + Postgres `sep_test`): fluxo completo POST -> replay ->
  reconciliacao (liquida e falha) -> GET owner-scoped, wallet creditada so na liquidacao,
  auditoria unica, contrato nao assinado 409, sem step-up 403, credora alheia 404 neutro.

> Collection: gap herdado (congelada no Sprint 14) — nao retrofitada; contrato vigente =
> springdoc runtime (`/v3/api-docs`).

## Sprint 30 — Matching assistido credora-operacao (Epic 15, Fase 4)

Evolui a associacao assistida da Sprint 17 para um recorte de **matching** entre a credora dona e
uma operacao financiada da propria carteira pronta para receber aporte: o sistema **sugere** por
regras explicitas de elegibilidade; a **decisao e sempre** de `FINANCEIRO`/`ADMIN` com step-up
estrito. **Nenhum matching e confirmado automaticamente e a confirmacao nao dispara aporte, Pix,
escrow ou chamada externa** — o aporte continua fluxo separado (Sprint 29).

### Regras de elegibilidade (Task 30.1)

`ValidadorElegibilidadeMatchingCredoraOperacao` (funcao pura; snapshot em lote via ports — sem
N+1), na ordem: credora `ATIVA` -> credora `ELEGIVEL` -> operacao `ASSOCIADA` -> contrato
`ASSINADO` (mesma fronteira do aporte) -> valor da operacao disponivel e positivo (vem da
`OportunidadeInvestimento` da operacao; sem oportunidade = dados insuficientes, nao sugere) ->
capacidade de aporte comporta o valor **quando declarada** (`capacidadeAporte` nula = criterio nao
aplicado) -> par sem matching previo em **qualquer** status (**REJEITADA tambem bloqueia**
re-sugestao — refresh nao re-sugere par ja decidido). Os criterios atendidos viram o
`criteriosSnapshot` persistido (codigos separados por `;` — sem PII/score/payload).

### Modelo e estados

- `MatchingCredoraOperacao` (`matching_credora_operacao`, V56): `empresaCredoraId`, `operacaoId`,
  `status`, `valorElegivel` (scale 2), `criteriosSnapshot`, `decididoPorUsuarioId`,
  `motivoDecisaoSanitizado` (<=255, blank -> null), `dataDecisao`. Transicoes encapsuladas:
  `SUGERIDA -> CONFIRMADA | REJEITADA` (terminais; replay falha sem alterar estado).
- UNIQUE **parcial** `(empresa_credora_id, operacao_id) WHERE status IN ('SUGERIDA','CONFIRMADA')`
  — duplicidade ativa bloqueada no banco; o bloqueio de re-sugestao pos-`REJEITADA` e regra de
  geracao (aplicacao). FKs sem `ON DELETE CASCADE` (trilha CMN 4.656/LGPD).

### Endpoints (`/api/v1/credores/matching`)

- `GET /sugestoes` — `hasAnyRole('FINANCEIRO','ADMIN')`, **sem step-up**. **Refresh-on-read**: o
  contrato aprovado nao tem endpoint de refresh, entao o GET gera sugestoes novas para pares
  elegiveis (idempotente — par ja sugerido/decidido nao duplica; **nao e** read-only puro:
  persiste sugestao + auditoria por par novo; evitar polling agressivo) e lista as `SUGERIDA`
  (valor elegivel desc, criacao asc). Sem job automatico.
- `GET /{sugestaoId}` — mesmas roles, sem step-up; qualquer status; `404` neutro sem UUID.
- `POST /{sugestaoId}/decisao` — mesmas roles + `@RequireStepUpEstrito` (sem bypass de MFA). Body
  `{acao: CONFIRMAR|REJEITAR, motivo?}`; `200` decisao registrada; `400` acao invalida/motivo
  >255; `404` neutro; `409` decisao repetida/terminal. DTO publico minimo (`id`, `operacaoId`,
  `empresaCredoraId`, `status`, `valorElegivel`, `criterios`, `criadaEm`, `decididaEm`) — nunca
  motivo de decisao, decisor ou snapshot bruto.

### Fluxo e use cases

- `GerarSugestoesMatchingCredoraUseCase` — candidatas com `SELECT FOR UPDATE` deterministico
  (refreshes concorrentes serializam; o segundo enxerga as sugestoes do primeiro, sem violar o
  UNIQUE parcial) + `NOT EXISTS` tira da janela pares ja decididos (sem starvation no limite);
  limite conservador de **200 candidatas por refresh** (mais antigas primeiro); 6 consultas em
  lote fixas (candidatas, credoras, perfis, oportunidades, matchings existentes, contratos via
  porta batch `consultarPorIds`). Trade-off local: o refresh compartilha o lock da operacao com o
  registro de aporte (Sprint 29) — bloqueio breve, irrelevante no volume da fase.
- `ListarSugestoesMatchingCredoraUseCase` — lista `SUGERIDA` (decididas so no `GET /{id}`).
- `ConsultarMatchingCredoraOperacaoUseCase` — consulta individual, `404` neutro.
- `DecidirMatchingCredoraOperacaoUseCase` — `findByIdForUpdate` (decisoes concorrentes
  serializam; segunda recebe `409`), valida `SUGERIDA`, aplica `confirmar/rejeitar` no dominio
  (ator + data + motivo sanitizado) e publica evento terminal. **Nao cria** `AporteCredora`, nao
  chama escrow/provider — o use case nem depende dessas portas (garantia fixada por teste).

### Auditoria (Sprint 30)

`CREDORA_MATCHING_SUGERIDA` (1x por sugestao nova, ator = operador do refresh),
`CREDORA_MATCHING_CONFIRMADA` / `CREDORA_MATCHING_REJEITADA` (terminais, 1x, ator = decisor;
motivo sanitizado no payload apenas quando presente), via eventos + `CredoresAuditListener`
(AFTER_COMMIT + REQUIRES_NEW). CHECK ampliado na V57.

### Migrations (Sprint 30)

- `V56__criar_matching_credora_operacao.sql` — tabela + UNIQUE parcial de par ativo + CHECKs +
  indices (par, operacao, status+criacao).
- `V57__ampliar_audit_seguranca_tipo_matching_credora.sql` — 3 tipos `CREDORA_MATCHING_*`.

### Testes (Sprint 30)

- Elegibilidade: `ValidadorElegibilidadeMatchingCredoraOperacaoTest` (13).
- Dominio: `MatchingCredoraOperacaoDomainTest` (11 — transicoes, terminal sem mutacao, sem
  vazamento em excecao/toString).
- Use cases: `GerarSugestoesMatchingCredoraUseCaseTest` (11 — lote sem consulta por item,
  duplicata/REJEITADA bloqueiam, auditoria so para novas), `ListarSugestoesMatchingCredoraUseCaseTest`
  (2), `ConsultarMatchingCredoraOperacaoUseCaseTest` (3), `DecidirMatchingCredoraOperacaoUseCaseTest`
  (8 — 404 neutro, 409 terminal, sem aporte/escrow).
- Web (`@WebMvcTest` + aspect real): `MatchingCredoraControllerTest` (15 — roles, step-up estrito
  so no POST, 400/403/404/409, campos proibidos).
- E2E (`MatchingCredoraIT`, auth real + Postgres `sep_test`, 6 cenarios): refresh gera e nao
  duplica, consulta, confirma/rejeita com step-up real, 401 sem token, 403 sem role/step-up,
  409 replay, confirmacao **sem criar aporte**, par decidido fora do refresh seguinte.

> Collection: gap herdado (congelada no Sprint 14) — nao retrofitada; contrato vigente =
> springdoc runtime (`/v3/api-docs`).

## Pendencias / proximos passos

- Divida tecnica de ports de persistencia (acima) — sprint de hardening.
- N+1 na agregacao de cobranca da carteira (carteira pequena na foundation; avaliar
  `@EntityGraph` se escalar) e sync sem paginacao das propostas `APROVADA` (admin, volume
  controlado).
- Aporte assistido entregue na Sprint 29 (fake/local); matching assistido entregue na Sprint 30
  (sugestao + decisao com step-up, sem automacao financeira). Marketplace e movimentacao
  financeira real (Celcoin/BaaS) seguem pendentes — Fase 4/5 e decisao de produto.
