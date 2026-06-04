# F-Sprint 8 - Formalizacao, Assinatura e CCB Web

## Summary

Implementa no `sep-app` a jornada autenticada de formalizacao contratual para o tomador,
em `/app/formalizacao`, consumindo os contratos reais de `sep-api` (modulo `contratos`,
Sprints backend 10-11). O frontend apresenta contrato, versoes, conteudo/clausulas,
aceite com step-up real, status de assinatura e acesso protegido ao documento assinado/CCB.
Versionamento, hashes, geracao de PDF/CCB, assinatura provider e transicoes de estado
permanecem no backend; o frontend so apresenta. UI no design system Notion.

Escopo: modelos TS + `ContratosService` + MSW, rotas/menu/entrada por proposta, detalhe
contratual com historico de versoes, aceite com step-up e fluxo de status/documento.

## Test plan

- `npm run lint` / `npm run lint:scss` — verdes.
- `npm run test -- --run` — 180 testes (Vitest), incluindo `ContratosService`,
  `stepUpInterceptor`, detalhe do contrato (conteudo/clausulas/versoes/aceite/status/
  documento), entrada por proposta, home e CTA na proposta.
- `npm run build` — verde (chunks lazy de formalizacao gerados).
- Smoke MSW/dev-offline: recomendado manualmente (interativo).
- Smoke com backend real (`http://localhost:8080`): pendente por ambiente.

## Mudancas por area

- `core/api/api.models.ts`: tipos de borda da formalizacao (`StatusFormalizacao`,
  `StatusEnvelope`, `TipoContrato = MUTUO | CCB | OUTROS`, `ContratoResponse`,
  `VersaoContratoResponse`, `ClausulaContratoResponse`, `AceiteContratoResponse`,
  `StatusAssinaturaResponse`). Datas como `string` ISO; nullable real do backend.
- `core/contratos/contratos.service.ts`: transporte HTTP puro (contrato por id/proposta,
  versoes, aceite, status de assinatura, download do documento assinado com
  `observe: 'response'` + `responseType: 'blob'` para preservar `X-Document-Hash-Sha256`).
- `core/interceptors/step-up.interceptor.ts`: whitelist estendida para
  `PATCH /contratos/{id}/aceite` (com guard de metodo), mantendo o transporte do
  step-up token centralizado no interceptor.
- `features/authenticated/formalizacao/`: rotas lazy, home (propostas aprovadas),
  entrada por proposta (resolve o contrato sob demanda), detalhe do contrato
  (status, metadados, conteudo como texto, clausulas, hash, historico de versoes em
  abas, aceite com step-up, status de assinatura, download do documento/CCB) e helpers
  `formalizacao-format`.
- `features/authenticated/credito/propostas/proposta-detail-page`: CTA
  "Formalizar contrato" na proposta aprovada do tomador dono.
- `layout/sidenav`: entrada "Formalizacao" visivel a todo usuario autenticado.
- `mocks/handlers.ts`: cenarios de formalizacao (contratos em
  AGUARDANDO_ACEITE/EM_ASSINATURA/ASSINADO/RECUSADO, contrato sem versao, ownership 403,
  404, 409 de estado invalido, aceite exigindo `X-Step-Up-Token`, status de envelope e
  documento PDF com `X-Document-Hash-Sha256`).

## Decisoes

- Step-up token transportado pelo `StepUpTokenStore` + `stepUpInterceptor` (padrao do
  projeto), nao pelo service; aceite redireciona para `/app/step-up` em 403 (espelha o
  fluxo de troca de senha) e mantem a decisao de seguranca no backend.
- Download do documento/CCB como blob transitorio: object URL criado e revogado em
  `finally`; `X-Document-Hash-Sha256` apenas exibido; nada de PDF/base64/hash em storage.
- Conteudo contratual e clausulas renderizados como texto (interpolacao, sem HTML).
- Status de assinatura e historico de versoes carregados best-effort: se falharem, a
  leitura do contrato e da versao vigente permanece.
- Entrada por proposta aprovada (sem lista global de contratos no backend), resolvendo o
  contrato por proposta sob demanda (evita N+1).

## Divergencias corrigidas vs spec original

- `PATCH /contratos/{id}/aceite` retorna `ContratoResponse` (nao `AceiteContratoResponse`);
  o frontend usa o retorno para refletir o novo estado sem segunda chamada.
- `TipoContrato` confirmado como `MUTUO | CCB | OUTROS`.
- `GET /contratos/{id}/versoes` retorna ordem ascendente de numero (alinhado ao backend).

## Gaps e follow-ups

- Backend sem endpoint de lista global de contratos; abrir no backend se uma lista ampla
  for necessaria para UX.
- Smoke `dev-offline` (browser) e smoke com backend real recomendados manualmente.

## Commits

- `b5ef0f7` feat(formalizacao): modelos, ContratosService e MSW base (F-8.1)
- `4072a8d` fix(formalizacao): documento-assinado indisponivel retorna 409 (F-8.1)
- `e185eff` feat(formalizacao): rotas, menu e entrada da jornada (F-8.2)
- `c7336e2` fix(formalizacao): mock persiste aceite e alinha ordem de versoes (F-8.1)
- `33cc828` feat(formalizacao): detalhe, conteudo, clausulas e versoes (F-8.3)
- `a991a59` fix(formalizacao): historico de versoes nao derruba leitura do contrato (F-8.3)
- `471d3a8` feat(formalizacao): aceite contratual com step-up real (F-8.4)
- `5c3bddc` fix(security): exige PATCH na whitelist de step-up do aceite (F-8.4)
- `55aa88b` feat(formalizacao): status de assinatura, documento assinado e CTA (F-8.5)
- `ee3e21a` fix(formalizacao): revoga object URL do download em finally (F-8.5)
