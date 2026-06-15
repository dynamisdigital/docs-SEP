# PR — F-Sprint 11: Jornada da empresa credora no web (sep-app)

## Summary

Implementa a jornada web da empresa credora (Epic 10 + Epic 13) consumindo o modulo `credores` do
`sep-api` (Sprints backend 16-17): cadastro a partir de onboarding PJ aprovado, perfil/elegibilidade
derivada, oportunidades (lista + detalhe), manifestacao/cancelamento de interesse e carteira de
operacoes financiadas. O frontend apenas apresenta os DTOs e reflete os retornos do backend:
elegibilidade, ownership, regras de interesse, associacao de carteira e auditoria ficam no backend.

Acesso governado por **autenticacao + presenca de credora** — nao existe role `CREDORA`. Nenhuma
operacao desta jornada usa step-up.

Spec `specs/fase-3/111-fsprint-11-credora-web.md`,
steps `steps-fase-3/web/111-fsprint-11-steps.md`.

## Mudancas por area

- **Borda de API** (`core/credora/credora.service.ts`, `core/api/api.models.ts`): `CredoraService`
  (transporte puro, sem step-up) com cadastro/me/elegibilidade/oportunidades/interesse/carteira;
  unions e DTOs de borda fieis aos contratos reais (`StatusCredora`, `StatusElegibilidade`,
  `TipoCredora`, `StatusOportunidade`, `StatusInteresseCredora`, `StatusOperacaoFinanciada`). O
  service propaga o `404` de `/me` e o `404` do `DELETE` de interesse (nao idempotente) pelo canal de
  erro, sem mascarar.
- **Navegacao e acesso** (`features/authenticated/credora/credora.routes.ts`, `credora-shell.*`,
  `core/guards/credora-presence.guard.ts`, `layout/sidenav`): grupo `/app/credora` sob `authGuard`;
  `credoraPresenceGuard` consulta `GET /credores/me` e roteia ao cadastro no `404`; shell resolve
  presenca (sem credora -> so cadastro). Item `Credora` no sidenav para `CLIENTE`.
- **Cadastro, perfil e elegibilidade** (`pages/credora-cadastro-page.*`, `credora-perfil-page.*`):
  cadastro a partir de onboarding PJ aprovado com tratamento de cada erro de dominio; perfil carrega
  `/me` + `/me/elegibilidade` e apresenta estados de forma exaustiva (INELEGIVEL+motivo, SUSPENSA,
  PENDENTE, apto, CADASTRADA aguardando), com CTA de oportunidades so quando `ATIVA`+`ELEGIVEL`.
- **Oportunidades** (`pages/oportunidades-page.*`, `oportunidade-detail-page.*`): lista em tabela (so
  `DISPONIVEL` linkavel) e detalhe read-only; manifestar/cancelar interesse no detalhe.
- **Carteira** (`pages/carteira-page.*`, `operacao-carteira-detail-page.*`): lista e detalhe com
  resumo **agregado** de cobranca; estado vazio reforca que interesse nao gera carteira.
- **Apresentacao** (`shared/`): badges dedicados `credora-status`, `elegibilidade-status`,
  `oportunidade-status`, `operacao-status`; helper `credora-format` (moeda, data, taxa mensal
  `fracao -> "% a.m."`, idCurto, mensagem de erro, label de tipo). Placeholder temporario da jornada
  removido quando a ultima rota real entrou.
- **Mocks** (`mocks/handlers.ts`): personas `credora@empresa.com` (elegivel),
  `credora-inelegivel@empresa.com` e `credora-novo@empresa.com` (sem credora); fixtures de
  credora/oportunidades/carteira cobrindo `201`/`404`/`422`/`403`/`409`/`204`, ownership e
  elegibilidade, sem dado sensivel do tomador.

## Migrations / contratos

- Nenhuma migration (frontend). Nenhum contrato REST alterado: a sprint apenas consome os endpoints
  ja entregues nas Sprints backend 16-17. Nenhum endpoint administrativo do modulo (`GET
  /credores/{id}`, `oportunidades/sync`, `carteira/operacoes`) e consumido.

## Decisoes aceitas

- **Sem role `CREDORA`** (nao existe no backend): acesso por autenticacao + presenca de credora; o
  gating de conteudo e por presenca no backend, nao por role no front.
- A tela nunca recalcula elegibilidade nem deriva estado de interesse. A CTA de oportunidades e a
  acao de manifestar espelham o gate do backend (`ATIVA`+`ELEGIVEL`), que ainda valida e pode recusar.
- O cadastro trata `404`/`422 CRD-422-001`/`403 CRD-403-001` com mensagem clara e conduz ao perfil no
  `409 CRD-409-001`.
- Como o backend **nao expoe estado de interesse por item**, o estado de interesse e local e
  corrigido pelos retornos do backend (`201`/`409` -> ativo; `204`/`404` -> inativo). O `DELETE` de
  interesse nao e idempotente: `404` (sem interesse) e tratado como estado desejado, nao erro duro.
- A carteira apresenta apenas o agregado de cobranca; nunca busca parcelas individuais nem dado
  sensivel do tomador. CNPJ aparece como o backend devolve (mascarado). Campos nullable como tracinho.
- Sem paginacao/cache local artificial: listas consumidas como o backend retorna.

## Test plan

- `npm run test` (Vitest) — 451 testes / 78 arquivos verdes; inclui `CredoraService`
  (URLs/metodos/sem step-up, `404` de `/me`, `DELETE` nao idempotente), guard de presenca, shell,
  sidenav, cadastro (`404`/`422`/`403`/`409` + payload), perfil (estados exaustivos), oportunidades
  (lista/detalhe), interesse (manifestar `201`/`409`/`422`, cancelar `204`/`404`) e carteira
  (lista/detalhe agregado, campos nulos, `404` por ownership).
- `npm run lint` — verde.
- `npm run lint:scss` — verde.
- `npm run build` — compila.
- Smoke manual dev-offline (MSW): `credora@empresa.com` / `123456` (elegivel),
  `credora-inelegivel@empresa.com` e `credora-novo@empresa.com` (sem credora -> cadastro).

## Dividas / follow-ups

- **Estado de interesse nao persiste entre cargas**: ao recarregar o detalhe da oportunidade, o
  "interesse registrado" so reaparece quando o usuario tenta manifestar de novo e recebe `409`
  (tratado graciosamente). Follow-up: expor estado de interesse por oportunidade no backend.
- **Smoke real com backend em `:8080`**: nao executado neste ambiente; re-rodar com `sep-api` no ar e
  massa com onboarding PJ aprovado / oportunidade disponivel.
- **Operacao admin fora de escopo**: sincronizar oportunidades, associar carteira (com step-up) e
  consulta administrativa `GET /credores/{id}` nao pertencem a esta jornada.

## Notas

- A autorizacao real permanece server-side (ownership + elegibilidade). Nenhum dado bancario, chave
  Pix ou dado sensivel do tomador e exposto. Branch local `feature/fsprint-11-credora-web`; push/PR
  manuais.

## Commits

- `b53d127` feat(credora): modelos de borda, CredoraService e MSW base (F-11.1)
- `f6e8a6c` fix(credora): corrige comentario do cancelarInteresse e remove ruido no MSW
- `a97763f` feat(credora): rotas, menu, shell e guard de presenca (F-11.2)
- `c50bd22` feat(credora): cadastro, perfil e elegibilidade (F-11.3)
- `d37a610` fix(credora): explica todos estados de perfil e valida payload de cadastro (F-11.3)
- `ead30cc` feat(credora): oportunidades lista e detalhe (F-11.4)
- `01bb3db` fix(credora): carrega detalhe de oportunidade incondicionalmente (F-11.4)
- `bd70402` feat(credora): manifestar e cancelar interesse em oportunidade (F-11.5)
- `393a376` feat(credora): carteira lista e detalhe de operacao financiada (F-11.6)
- `3775176` test(credora): cobre campos nulos e erro nao-404 no detalhe da operacao (F-11.6)
