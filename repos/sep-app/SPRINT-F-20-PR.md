# F-Sprint 20 — Gestao de chaves Pix no web (descricao de PR)

> Descricao temporaria consolidada para o PR `feature/fsprint-20-chaves-pix-web` -> `develop` no
> `sep-app`. Apagar apos o merge (ciclo de vida padrao).

## Resumo

Superficie web para **gestao assistida das chaves Pix da conta operacional/escrow**, consumindo o
contrato da Sprint backend 31. Fecha a pendencia de visibilidade web registrada no **Gate F-18.0**
(PRD-FASE-4 §37) e conclui o recorte web do marco `v1.0-local`. Spec `120`; steps `120`.

`FINANCEIRO`/`ADMIN` listam (sempre mascarado, com historico), cadastram e removem chaves, com
**step-up estrito** nas mutacoes. Tipo, digito verificador, unicidade, idempotencia, advisory lock
e auditoria permanecem autoritativos no backend. Nao altera endpoint, DTO, migration ou regra no
`sep-api`.

## Commits (sep-app)

| Commit | Tipo | Conteudo |
|---|---|---|
| `c2c6a87` | feat | DTOs de borda + 3 operacoes no `PixService` + `stepUpInterceptor` + `consumed-contracts.json` |
| `381f232` | feat | rota `/app/pix/chaves` com `roleGuard` proprio, item de menu e listagem (3 superficies) |
| `39aae5c` | feat | cadastro assistido com step-up e `ChavePixIntencaoStore` (idempotencia por intencao) |
| `cee77ce` | test | pos-review: cobertura da reconstituicao do rascunho da intencao |
| `4c00aa6` | feat | remocao assistida (inativacao logica) com step-up e `404` neutro |
| `ae3bde3` | fix | pos-review: mensagens que alegavam reconsulta concluida; espelho do teste de sobreposicao de dialogos |
| `1dc6e2e` | test | matriz de erros, concorrencia, tabela responsiva e acessibilidade |
| `6a53634` | fix | pos-review: regiao da lista nomeada por `aria-labelledby`; `thead` fora da arvore de acessibilidade nos cartoes |
| `f8c883d` | test | MSW stateful (`chavesPixHandlers`, `seedChavesPix`, `resetChavesPixState`) + 13 testes de comportamento |
| `fcb9e9c` | fix | pos-review: equivalencia de chave por impressao (mascara de 3 chars colidia); idempotencia sem valor em claro |
| _(este)_ | test | smoke Playwright + docs + collections conferidas + descricao de PR |

## Contrato consumido (backend Sprint 31)

| Operacao | Step-up | Idempotency-Key | Sucesso | Erros |
|---|---|---|---|---|
| `GET /pix/chaves` | nao | nao | `200` (array, pode ser vazio) | **nunca `404`** |
| `POST /pix/chaves` | **estrito** | **obrigatoria** | `201` novo / `200` replay | `400`, `409`, `422`, `403` |
| `DELETE /pix/chaves/{chaveId}` | **estrito** | nao | `204` (idempotente) | `404` neutro, `403` |

`ChavePixResponse`: `id`, `tipo`, `valorMascarado`, `status`, `criadaEm`, `removidaEm` (nulo
enquanto `ATIVA`). **O valor bruto da chave nunca e retornado.**

Nota de contrato (`knownGaps[0]`): o header `X-Step-Up-Token` nao e documentado no OpenAPI; o
frontend o registra manualmente em `consumed-contracts.json` para `POST` e `DELETE`, como nas
mutacoes das F-16/17/18. `contract:check` verde, sem divergencia real.

## Decisoes da sprint

- **Guard proprio, mais restrito que o pai.** `/app/pix` admite `BACKOFFICE`; a sub-rota `chaves`
  declara `roles: ['FINANCEIRO','ADMIN']`. `BACKOFFICE` nao ve o item de menu nem acessa a rota.
- **Valor em claro so na request de cadastro.** Nunca em leitura, erro, sucesso, log ou storage. A
  mensagem de sucesso usa o `valorMascarado` do backend, nao o que foi digitado.
- **Idempotencia por intencao** (`ChavePixIntencaoStore`, root e so memoria) preservando
  `{ tipo, valor, Idempotency-Key }` atraves do round-trip de step-up. Retry apos rede/`5xx` reusa a
  **mesma** key; mudar `tipo`/`valor` gera key nova. O rascunho e reconstituido no retorno — sem
  isso, um erro de digitacao no reenvio criaria key nova e reabriria o risco de duplicar a chave.
- **Retornar do step-up nunca muta**: cada cadastro e cada remocao exigem gesto novo. O token e de
  uso unico (consumido pelo interceptor ao anexar), entao toda tentativa exige verificacao nova.
- **Remocao sem `Idempotency-Key`**: o `DELETE` e idempotente por contrato, entao nao ha intencao a
  preservar.
- **Sem polling**; refresh so por gesto. Consulta em voo e substituida: resposta tardia da anterior
  nao sobrescreve a lista mais nova.
- **Mock nao reimplementa regra do backend** (DV, formato por tipo): reconhece valores sentinela
  para produzir `400`/`422`, evitando uma segunda fonte de verdade que envelheceria calada.

## Achados dos code reviews (corrigidos na sprint)

| Severidade | Achado | Correcao |
|---|---|---|
| Alta | Equivalencia de chave comparava mascaras de 3 caracteres: dois valores diferentes com o mesmo prefixo colidiam num `409` falso | `impressaoChavePix(tipo, valor)`, identidade fora do DTO (`fcb9e9c`) |
| Media | Mapa de idempotencia do mock guardava `JSON.stringify(body)`, com o valor em claro | mesma impressao nao reversivel (`fcb9e9c`) |
| Media | `id` de heading criado sem `aria-labelledby`; heading dentro da div de acoes | regiao da lista virou `<section>` nomeada (`6a53634`) |
| Media | Comentarios afirmavam que o `clip-path` preservava a semantica de tabela nos cartoes — **falso**: `display: flex` sobre `tr`/`td` desfaz os papeis `row`/`cell` | `thead` para `display: none` + comentarios corrigidos (`6a53634`) |
| Media | Mensagens diziam "A lista foi atualizada" com a reconsulta ainda em voo | "Atualizando a lista" (`ae3bde3`) |
| Media | Testes de duplo clique alegavam provar a guarda do metodo | renomeados; documentado que a barreira efetiva e o token de uso unico (`ae3bde3`) |

## Verificacao

| Gate | Resultado |
|---|---|
| `npm run lint` | 0 |
| `npm run lint:scss` | 0 |
| `npm run test` (Vitest) | **664** / 87 arquivos |
| `npm run build` | OK |
| `npm run e2e` (Playwright) | **36** (+5 desta sprint) |
| `npm run contract:check` | OK (so `knownGaps`) |
| `npm audit --omit=dev` | 0 |

**Verificacao por mutacao** foi usada ao longo da sprint: cada teste novo de guarda/invariante foi
validado quebrando a producao correspondente e confirmando a falha. Tres testes que passavam sem
provar nada foram identificados e corrigidos por esse metodo.

## Riscos e limitacoes

- Provider **fake/local**: nenhuma chave real e criada ou removida no DICT.
- Cadastro e remocao concluidos com **token TOTP real** exigem o desafio MFA (sem handler offline);
  ficam para o smoke local com backend `:8080`, registrado como gate — nao como sucesso simulado. O
  smoke offline prova o redirecionamento ao step-up e a **ausencia de auto-submit** no retorno.
- Lista vazia so seria alcancavel offline removendo as duas chaves do seed, o que depende do
  step-up acima; coberta no Vitest da pagina.
- Negacao da **rota** para role indevida nao e demonstravel no smoke offline (um `page.goto`
  reinicia o MSW e a sessao volta ao usuario default); coberta nos testes de `roleGuard` e da
  configuracao de rotas no Vitest. O smoke cobre a ausencia do item de menu.
- Layout de cartoes abaixo de 768px nao e verificavel em jsdom (media queries nao se aplicam);
  precisa de conferencia visual.
- `X-Step-Up-Token` segue fora do OpenAPI (`knownGaps[0]`, follow-up backend).

## Checklist pos-merge (`develop` + `main`)

- [ ] PRD-FASE-4 §36 (tabela web): adicionar a linha F-20 com o resultado.
- [ ] PRD-FASE-4 §37: marcar a visibilidade web de chaves Pix como **atendida** (a exigencia mobile
      segue registrada no Gate M-16.0).
- [ ] `STATE.md`: sobrescrever estado + proximo passo; apendar historico curto em
      `CONTEXT-PARTE-2.md`.
- [ ] `specs/fase-4/README.md`: status da linha F-20 para `concluida`.
- [ ] Apagar este arquivo (ciclo de vida padrao).
