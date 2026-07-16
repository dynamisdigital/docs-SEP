# F-Sprint 18 — Aporte e matching da credora no web

> **Concluida em 2026-07-16**: PR #94 -> `develop` (squash `ee9d5b6`) e PR #95 -> `main`
> (`7c96b78`; `develop` == `main`). Sprint fechada.

**Branch**: `feature/fsprint-18-aporte-matching-credora-web` -> `develop`
**Spec**: `docs-SEP/specs/fase-4/118-fsprint-18-aporte-matching-credora-web.md`
**Steps**: `docs-SEP/steps-fase-4/web/118-fsprint-18-steps.md`

## Summary

Superficies web de **matching assistido** (backend Sprint 30) e **aporte assistido** (backend
Sprint 29) para `FINANCEIRO`/`ADMIN`, mais a leitura owner-scoped de aportes na carteira da
credora dona. Duas personas no mesmo modulo `credores`: rotas operacionais novas com `roleGuard`
(sem `credoraPresenceGuard`); jornada `CLIENTE` intacta. Elegibilidade, valor elegivel, estados,
ownership, idempotencia, auditoria e escrow permanecem autoritativos no backend — o frontend nao
recalcula regra financeira. Provider fake/local (Fase 4): nenhum dinheiro real.

**Gate F-18.0 — chaves Pix**: decisao registrada (2026-07-16, opcao 1): gestao/visibilidade de
chaves Pix (Sprint 31) ficou **fora da F-18**; destino web posterior explicito em sprint dedicada
apos a F-19. O item de Pix avancado do `v1.0-local` **nao** foi marcado como concluido por esta
sprint.

## Mudancas

- **Contratos de borda (F-18.1)**: `api.models.ts` +3 types + 4 interfaces espelhando os DTOs
  publicos das Sprints 29-30; `CredoraService` +5 operacoes (sugestoes, detalhe, decisao, registro
  com `Idempotency-Key`, lista owner-scoped); `stepUpInterceptor` cobre os 2 POSTs sensiveis com
  guard de metodo (GETs nunca consomem o token de uso unico).
- **Sugestoes (F-18.2)**: rota `/app/credora/matching` + item de navegacao `Matching de credoras`
  (so `FINANCEIRO`/`ADMIN`); fila com 1 consulta na entrada e refresh-on-read **somente por gesto
  explicito** (sem polling); IDs curtos, valor elegivel, criterios e badge de status com texto.
- **Decisao assistida (F-18.3)**: detalhe autoritativo em `/app/credora/matching/:id`; decisao so
  sobre estado atual `SUGERIDA` com **reconsulta obrigatoria** antes do dialogo; MFA precheck +
  step-up estrito com `next` da propria rota (retorno **nunca** decide); `TRATA_403_LOCALMENTE`
  nos POSTs com reverificacao por gesto; motivo opcional <=255 com contador; dialogo acessivel
  padrao F-16; matriz `400/403/404/409/rede` sem sucesso presumido; confirmar apenas registra a
  decisao (nenhum aporte e criado).
- **Aporte assistido (F-18.4)**: rota `/app/credora/matching/:id/aporte`; CTA/form so em
  `CONFIRMADA` (regra de UX; autoridade e o POST); prefill = `valorElegivel`; validacao local so de
  formato; **intencao em memoria** (valor + `crypto.randomUUID()`): mesma key em retry rede/5xx com
  o mesmo valor, key nova ao mudar valor, nunca exibida/persistida; `201`/`200` ambos sucesso;
  lista de aportes compartilhada somente leitura (`Atualizar status`, mensagens por estado, erro
  localizado) embutida tambem no detalhe da carteira da credora dona, sem CTA de mutacao.
- **Cobertura focada (F-18.5)**: matriz negativa completa, duplo submit (1 reconsulta/1 POST por
  gesto), 403 de leitura segue fluxo global (prova o recorte do `TRATA_403_LOCALMENTE`), heading
  unico por pagina.
- **MSW/e2e/docs (F-18.6)**: mock stateful (decisao muda estado; idempotencia real por key;
  ownership com 404 neutro identico; aportes nos 4 estados; reset deterministico; valida
  `X-Step-Up-Token` e `Idempotency-Key`); smoke `e2e/credora-matching.spec.ts` (4 cenarios);
  README web §F-18, WEB-SCREENS-PLAN §6.7 e AI-ROADMAP atualizados.
- **Review manual (3 achados fechados)**: P1 — intencao `{operacao, valor, key}` movida para o
  `AporteIntencaoStore` (singleton de root, somente memoria): sobrevive a ida/volta do step-up,
  que destroi o componente, e o retry pos-rede/5xx numa instancia nova reusa a MESMA key (sem
  duplicar aporte); P2 — a lista de aportes substitui consulta em andamento em vez de descartar o
  refresh pos-POST (resposta tardia cancelada); P3 — seed MSW da 2a sugestao com credora elegivel
  e criterios completos (backend nunca sugere credora inelegivel).

## Test plan

- `npm run lint` / `npm run lint:scss` — verdes.
- `npm run test` — **562** testes (491 -> 562): service/interceptor (contratos HTTP, key, token),
  sugestoes, detalhe/decisao, aporte (incl. retry com a mesma key numa instancia NOVA do
  componente), store de intencao (4), lista de aportes (substituicao de consulta em voo),
  carteira owner-scoped, sidenav.
- `npm run build` — AOT verde.
- `npm run e2e` — **31/31** (+4 smokes: decisao ate o step-up sem auto-decisao no retorno; CTA
  separado de aporte com prefill e step-up sem registro automatico; carteira owner somente
  leitura; menu oculto para roles indevidas).

## Dividas e follow-ups

- **Decisao/aporte com TOTP real** e a **negacao de rota por role via URL direta**: smoke real com
  backend `:8080` (o full reload do modo offline reinicia a sessao mock — mesma limitacao das
  demais jornadas sensiveis).
- **Chaves Pix no web**: sprint dedicada apos a F-19 (decisao Gate F-18.0); pendencia segue
  rastreada no PRD-FASE-4 §37.
- Sem endpoint REST de reconciliacao de aporte na Fase 4: UI apenas reconsulta o `GET`.
- Collection Postman intocada (nenhum contrato backend mudou).

## Commits

- `63bf4cf` feat(web): adicionar contratos de aporte e matching da credora
- `66d56c1` feat(web): listar sugestoes de matching da credora
- `aa0d1d4` feat(web): permitir decisao assistida de matching
- `4201d4a` fix(web): impedir consultas concorrentes no detalhe do matching
- `7c1b4e4` feat(web): adicionar aporte assistido e status da credora
- `b89e1f4` test(web): cobrir erros de aporte e matching
- `acdd939` test(web): fixar spy de navegacao antes do render no 403 global
- `c7e938f` test(web): validar jornada de aporte e matching da credora
- `e225ecc` test(web): apertar regex de rota do smoke de aporte
- `5e03226` fix(web): preservar intencao de aporte entre instancias e refresh da lista
