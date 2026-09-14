# Sprint 38 — Modulo de notificacao transversal, historico e canal in-app

**Branch**: `feature/sprint-38-notificacao-historico` (de `develop` `30c1f2b`)
**Spec**: [`038`](../../specs/fase-4/038-sprint-38-modulo-notificacao-historico.md) ·
**Steps**: [`038`](../../steps-fase-4/backend/038-sprint-38-steps.md) ·
**ADR**: [`0021`](../../adr/0021-modulo-notificacao-transversal.md)
**Escopo**: Fase 4, produto novo. Modulo, tabela, endpoints e migration `V61` novos.

## Summary

O `sep-api` tinha 71 eventos de dominio e tres pontos de envio de notificacao, e os tres falavam com o
tomador em momento ruim: regua de cobranca, renegociacao e conta bloqueada. Nao havia historico — nao
dava para saber se um aviso saiu — e a infraestrutura completa estava presa dentro de `cobranca`.

- **Modulo `notificacao`** com historico por usuario (`V61`), dominio sem JPA e idempotencia por origem:
  unique parcial `(tipo, origem_id, usuario_id) WHERE situacao <> 'FALHOU'`.
- **Central de notificacoes** owner-scoped: listar, contar nao lidas e marcar como lida. Codigos novos
  `NTF-400-001` e `NTF-404-001`.
- **Primeiro momento positivo do produto**: desembolso Pix concluido vira aviso na central do tomador.
- **E-mail de conta bloqueada pelo modulo novo**, via `ContaBloqueadaEvent`: continua saindo e agora deixa
  historico; falha do envio deixa de poder desfazer o audit do bloqueio. `shared.email` removido.

**A central esta quase vazia por desenho**: um unico gatilho `IN_APP`. Decidir quais eventos notificam e a
frente B, e depende de personas. **A regua de cobranca nao migrou** — segue no caminho da Sprint 13, e o
`CanalNotificacao` fica duplicado nos dois modulos, com sincronia travada por teste.

## Contrato novo

| Rota | Sucesso | Erros |
|---|---|---|
| `GET /api/v1/notificacoes?page=0&size=20` | `200` `Page<NotificacaoResponse>`, `criadaEm` desc e `id` desc | `400 NTF-400-001`, `401` |
| `GET /api/v1/notificacoes/nao-lidas/contagem` | `200 { "naoLidas": n }` | `401` |
| `POST /api/v1/notificacoes/{id}/leitura` | `200 NotificacaoResponse` (idempotente) | `400`, `401`, `404 NTF-404-001` |

`NotificacaoResponse`: `id`, `tipo`, `titulo`, `mensagem`, `criadaEm` (obrigatorios) e `lidaEm`,
`referencia { tipo, id }` (sempre presentes, nulos quando vazios). Nao expoe usuario, origem, canal nem
situacao. Contrato para a F-27 e a M-19.

## Mudancas por Task

| Task | Mudanca |
|---|---|
| 38.1 | ADR 0021 aceito: modulo, destinatario unico, canais e situacoes, idempotencia, fronteira de falha, garantia de entrega, allowlist, retencao de 5 anos, contrato |
| 38.2 | agregado `Notificacao` sem JPA, `NotificacaoJpaEntity`, `NotificacaoPort` com dedup por constraint, `V61` |
| 38.3 | `NotificarUsuarioUseCase` (`IN_APP` sem I/O; `EMAIL` em `PENDENTE` -> envio -> resultado), `EnvioEmailPort` + `LogEnvioEmailAdapter`, compatibilidade com o enum da cobranca |
| 38.4 | endpoints da central, prefixo `NTF`, truncagem do relogio em microssegundos; hotfix: consultas com o canal literal para usar os indices parciais |
| 38.5 | `ContaBloqueadaEvent` + `ContaBloqueadaListener`; `shared.email` removido |
| 38.6 | `DesembolsoPixConcluidoListener` |
| 38.7 | replay pelo publisher, concorrencia, minimizacao por valor e matriz de mutacoes |
| 38.8 | `NOTIFICACOES.md`, `SEGURANCA.md`, `PIX.md`, collections |
| Fechamento | `NTF-400-001`/`NTF-404-001` na lista congelada (143 -> 145) |

## Migration

`V61__criar_notificacao.sql`: tabela `notificacao`, FK para `usuario` sem cascade, CHECKs espelhando o
dominio, unique parcial da chave de origem e dois indices parciais da central.

- Ensaiada do zero (base vazia) e como upgrade de uma copia do `sep_dev` em V60 com dados: contagens de
  todas as tabelas identicas, fora a tabela nova.
- Reversao ensaiada, com uma notificacao gravada: `DROP TABLE notificacao` + remocao da linha 61 do
  historico do Flyway. Schema identico ao pre-V61 e reaplicacao limpa. **A reversao apaga as
  notificacoes.**

## Test plan

| Gate | Baseline (Gate 38.0) | Resultado |
|---|---|---|
| `./gradlew clean build` | 2318 / 0 | **2434 / 0** |
| `./gradlew spotlessCheck` | exit 0 | exit 0 |
| Codigos publicados | 143 | **145** (particao, convencao, enum do OpenAPI e lista congelada verdes) |
| Rotas no OpenAPI | 98 | **101** |

**Smoke real contra `:8080`** (perfil `dev`, dados controlados e apagados ao fim), **20 de 20
verificacoes**:

- cadastro e login de A e B;
- transferencia `SOLICITADA` semeada e webhook `pix.transfer.status` assinado -> `CONCLUIDA`;
- A lista 1 aviso nao lido, com a referencia do contrato e sem `externalId`;
- A conta 1, marca, reconta 0 e remarca com o mesmo `lidaEm`;
- B lista vazio e recebe `404 NTF-404-001` ao marcar o aviso de A, que segue nao lido no banco;
- `size=101` -> `400 NTF-400-001`; sem token -> `401`;
- bloqueio real de B: `401` x5 e `423`, com `CONTA_BLOQUEADA`/`EMAIL`/`SIMULADA` e nenhum endereco gravado.

### Mutacao

Cada mutante com ancora conferida, um por vez, morte aceita so por teste de comportamento, restauracao
por backup + `cmp`. **Nenhum sobrevivente.**

| Task | Mutantes | Destaque |
|---|---|---|
| 38.2 | 3 | unique sem predicado, indice nao unico, adapter tratando toda violacao como dedup |
| 38.3 | 7 | `IN_APP` chamando provider; motivo com mensagem da excecao; log com destinatario |
| 38.4 + hotfix | 8 + 1 | dono retirado de cada consulta; canal parametrizado so morre no teste que captura o SQL |
| 38.5 | 6 | listener em `AFTER_COMPLETION`; origem com fuso local |
| 38.6 | 5 | `IN_APP` trocado por `EMAIL` no gatilho (mutacao obrigatoria da spec) |
| 38.7 | 10 | matriz obrigatoria sobre o codigo atual; dedup desligada em base descartavel |
| Fechamento | 1 | rename de `NTF-404-001` no fonte e no catalogo so a lista congelada pega |

## Decisoes

1. **Gatilhos por evento consumido pelo modulo** (padrao do `backoffice`), inclusive o lockout: evita ciclo
   `identity <-> notificacao` e isola a falha sem capturar excecao dentro da transacao do audit.
2. **Central so `IN_APP`**: historico de e-mail nao vira item nao lido.
3. **Destinatario unico** `usuario_id`; grupo vira N linhas se um dia houver tres cenarios.
4. **Dominio sem JPA**, conforme o ADR 0007 — o primeiro modulo aderente; os demais nao foram migrados.
5. **Retencao provisoria de 5 anos**, sujeita a revisao juridica, sem expurgo automatico.
6. **E-mail no maximo uma vez** por origem; falha registrada continua reenviavel por novo evento.

## Achados fora do plano

- **`lidaEm` com dois valores**: a primeira marcacao devolvia nanossegundos do relogio Java e a segunda o
  valor relido do PostgreSQL. Pego pelo IT; o relogio do modulo passou a truncar em microssegundos.
- **`nullable = true` e descartado pelo springdoc em OpenAPI 3.1**: o documento inteiro tem zero marcas de
  nulidade, e o `mensagemPublica` do Pix ja perde a marca. `lidaEm`/`referencia` sairam do `required` para
  nao publicar "string nao nula" para campo que chega nulo.
- **Indices parciais inuteis com o canal como parametro**: plano generico com 200 mil linhas fazia seq scan
  (custo ~12.000); com o literal, `Index Only Scan` (39). Hotfix e guarda por `StatementInspector`.
- **Limite de pool anterior a sprint**: cada requisicao que publica evento com listener `REQUIRES_NEW`
  segura duas conexoes durante o `AFTER_COMMIT`. Com pool 5, oito threads falham ja so com o listener de
  audit do Pix (Sprint 20); a notificacao dobra a espera quando o pool satura.
- **Adapter de log condicional derrubaria o contexto** com `smtp-zenvia` (`ZenviaSmsNotificationProviderIT`):
  ficou incondicional; a simulacao agora e visivel como `SIMULADA`.

## Dividas aceitas e follow-ups

- 🟡 **Migrar a regua de cobranca** para o modulo e remover o `CanalNotificacao` duplicado.
- 🟡 **Revisao juridica** de retencao (5 anos) e de opt-out.
- 🟡 **Pool de conexoes**: dimensionar >= 2x as requisicoes concorrentes com listener `REQUIRES_NEW` em
  `AFTER_COMMIT`, ou listener assincrono (exige rever o ADR 0021 §6).
- 🟢 **Adapter real de e-mail** (Fase 5): selecao por provider, envio assincrono ou timeout curto, log de
  diagnostico sanitizado no proprio adapter.
- 🟢 **Frente B** (quais eventos notificam, por persona) e **frente D** (push, gated).
- 🟢 **Acentuacao** do texto exibido na central: mantido ASCII pela convencao do repo; decisao de produto.
- 🟢 CHECKs da `V61` nao barram texto em branco, que o dominio recusa.
- 🟢 `ContaBloqueadaEvent.toString()` carrega o e-mail (nenhum log o imprime hoje).
- 🟢 Os 4 ITs do modulo sobem 4 contextos Spring; padronizar os spies economiza tempo de build.

## Commits

- `c66041d` feat(notificacao): persistir historico por usuario com idempotencia
- `417e8c7` feat(notificacao): adicionar canal in-app e adapters de envio
- `e8e6b02` feat(notificacao): expor central restrita ao destinatario
- `ac6846e` fix(notificacao): usar indices parciais da central com canal literal
- `577e153` refactor(identity): registrar notificacoes de lockout no modulo transversal
- `1a6c72a` feat(notificacao): avisar tomador sobre desembolso Pix concluido
- `b318d02` test(notificacao): provar isolamento replay e minimizacao
- `b54e692` test(erros): congelar os codigos da central de notificacoes

8 commits, **64 arquivos, +4403 / −74** (`30c1f2b..b54e692`).

## Notas

Nada mudou em `sep-app` nem em `sep-mobile`; a F-27 e a M-19 dependem desta sprint em `develop`. O
snapshot OpenAPI do web cresce na proxima renovacao (3 rotas e 2 codigos). Push e PR sao **manuais**.
Conferir o merge **por conteudo**, nao por hash.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_016L2P6P4n6exSm7PX2tx6uG
