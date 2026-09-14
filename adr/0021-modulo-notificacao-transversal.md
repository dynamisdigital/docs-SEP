# ADR 0021 - Modulo de notificacao transversal: historico por usuario, canal in-app e idempotencia por origem

## Status

Aceito (2026-09-14, Sprint 38 — Fase 4). Supersede parcialmente o
[ADR 0014](./0014-estrategia-de-notificacoes-transacionais.md) **so no recorte de onde a capacidade
mora**; a escolha de providers (SMTP, Zenvia, Log) do 0014 segue valendo.

Decisoes do responsavel pelo repo em 2026-09-14, tomadas sobre o inventario do Gate 38.0: retencao
provisoria de **5 anos**, central **so `IN_APP`**, gatilhos por **evento consumido pelo modulo**, e
dominio **sem JPA**. O restante deste documento deriva dessas quatro e foi aceito pelo responsavel
no checkpoint da Task 38.1, na mesma data.

## Contexto

Medido em `develop` `30c1f2b` do `sep-api` (2026-09-14):

| Fato | Consequencia |
|---|---|
| **71** eventos de dominio em 10 modulos e **3** pontos de envio (`EscalarCobrancaUseCase:132`, `RenegociacaoPropostaListener:91`, `LockoutService:175`) | O SEP so fala com o tomador para cobrar ou avisar que ele perdeu acesso |
| Duas infraestruturas: `cobranca...NotificationProvider` (canal, template, resultado, falha persistida) e `shared.email.EmailService` (`void enviar(para, assunto, corpo)`, um consumidor, nenhum historico) | A completa esta presa no `cobranca`; a transversal e rasa |
| Nenhuma tabela de notificacao; ultima migration `V60` | Nao ha como saber se um aviso saiu, nem auditar |
| `LogEmailService` so registra log; nao ha adapter real de e-mail fora do `cobranca` | Resultado de envio hoje e **simulacao**, nao entrega |
| `PixTransferenciaConcluidaEvent` carrega `tomadorId`, e `contrato.tomador_id REFERENCES usuario(id)` (`V20`); o `ConsultarDesembolsoTomadorUseCase` compara esse id com `principal.id()` | O destinatario do gatilho Pix e o usuario autenticado, sem lookup |
| O evento e publicado em tres caminhos, todos com transacao ativa (`DesembolsoTransacaoService` `REQUIRES_NEW`, `ProcessarWebhookPixUseCase` e `ConsultarStatusDesembolsoPixUseCase` `@Transactional`) | Listener `AFTER_COMMIT` dispara nos tres |
| `LockoutService.avaliarPosFalha` roda em `REQUIRES_NEW` e grava o audit `LOCKOUT` antes do e-mail; o chamador lanca `BadCredentialsException` logo depois | Uma excecao no e-mail desfaria o audit do bloqueio e trocaria o `401` por `500` (o adapter de log atual nunca lanca) |
| `avaliarPosFalha(null, username)` so ocorre para username inexistente, cujo status (`USUARIO_INEXISTENTE`) nao conta como falha | Sem usuario, nao ha bloqueio a notificar |
| Os 12 modulos com persistencia poem `@Entity` em `domain.model`, contra o ADR 0007 | O modulo novo e o primeiro a seguir o ADR 0007 |
| Reagir a evento de outro modulo ja e feito pelo consumidor: `backoffice` ouve `PixTransferenciaFalhouEvent` em `AFTER_COMMIT` com insercao idempotente por unique parcial | Existe padrao local para o gatilho |

## Decisao

### 1. Modulo `notificacao`, e quem depende de quem

- Entra `notificacao` como modulo proprio (`domain`, `application`, `infrastructure`, `web`), sem
  importar nada do `cobranca`.
- **Os gatilhos chegam por evento de dominio**, consumido por listener dentro do `notificacao`, em
  `@TransactionalEventListener(AFTER_COMMIT)` — o padrao do `backoffice`. O `notificacao` depende dos
  eventos dos produtores (`pix`, `identity`); **nenhum produtor depende do `notificacao`**.
- O `identity` passa a publicar `ContaBloqueadaEvent` em `avaliarPosFalha`, no lugar da chamada ao
  `EmailService`. **Desvio declarado da spec 038**, que dizia "`LockoutService` passa a usar o modulo
  novo": a chamada direta criaria ciclo `identity <-> notificacao` (os controllers dependem do
  principal do `identity`) e exigiria capturar excecao dentro da transacao que grava o audit.
- E-mail sai por porta do proprio modulo (`application.port.out`) com adapter de log como default,
  mantendo o Provider Pattern do ADR 0004 e do 0014. `shared.email` e removido.
- A regua de cobranca **nao** migra nesta sprint e segue com o `NotificationProvider` dela.

### 2. Destinatario

`usuario_id NOT NULL`, e so. Grupo, papel e broadcast ficam fora; se um dia houver tres cenarios, o
fan-out vira N linhas, sem mudanca de esquema. Evento sem usuario identificavel nao gera
notificacao — no lockout, o `identity` nao publica o evento quando `usuarioId` e nulo.

O endereco de e-mail **nao** e persistido: vem no evento e so existe em memoria durante o envio. O
historico guarda `usuario_id`.

### 3. Canal, situacao de entrega e leitura sao tres coisas

| | `IN_APP` | `EMAIL` |
|---|---|---|
| Situacao ao criar | `DISPONIVEL` | `PENDENTE` |
| Situacoes finais | — | `ENVIADA` (provider real aceitou), `SIMULADA` (adapter de log), `FALHOU` |
| Leitura (`lida_em`) | sim | **nunca** — invariante do agregado |
| Aparece na central | sim | **nao** |

- `ENVIADA` e aceite do provider, nao ciencia do usuario (mesma ressalva do 0014). `SIMULADA` nunca
  e tratada como comprovante.
- `SMS` existe no enum por compatibilidade com o `cobranca`, mas nenhum caminho deste modulo o
  entrega; criar notificacao `SMS` e rejeitado.
- **A central (listar, contar, marcar lida) usa um unico recorte: `canal = IN_APP` do usuario
  autenticado.** Historico de e-mail fica persistido e auditavel, mas nao vira item nao-lido.

### 4. Idempotencia por origem

- Chave: `(tipo, origem_id, usuario_id)`, com **unique parcial `WHERE situacao <> 'FALHOU'`**. Uma
  tentativa que falhou nao bloqueia a proxima; uma pendente, disponivel, enviada ou simulada bloqueia.
- `origem_id` e texto derivado do fato, nunca UUID aleatorio:
  - `DESEMBOLSO_PIX_CONCLUIDO`: `transferenciaId`.
  - `CONTA_BLOQUEADA`: instante do evento de bloqueio (a falha que fecha a janela, em ISO-8601 UTC).
    Repetir a avaliacao do mesmo bloqueio nao duplica; um bloqueio posterior tem outro instante e
    notifica.
- A defesa e a constraint no banco. A insercao roda em `REQUIRES_NEW` e o
  `DataIntegrityViolationException` da chave e tratado como "ja notificado", fora da transacao que
  inseriu — mesmo desenho do `CriarItemFilaOperacionalService`.

### 5. Fronteira de commit e falha

- Listener em `AFTER_COMMIT`: origem revertida (Pix que nao comitou, audit de bloqueio desfeito)
  **nao** notifica.
- A notificacao grava em transacao propria. Falha nela — banco, provider, template — **nao** desfaz o
  desembolso, o bloqueio nem o audit, que ja comitaram. O listener registra a falha em log estruturado
  sem dado pessoal.
- `EMAIL`: grava `PENDENTE` (commit), chama o provider fora de transacao e grava a situacao final em
  nova transacao. Excecao do provider vira `FALHOU` com motivo sanitizado (nome da classe da excecao,
  nunca a mensagem).

### 6. Garantia de entrega declarada

- **Listener em memoria nao e entrega duravel.** Se o processo cair entre o commit da origem e o
  commit da notificacao, a notificacao **nao existe** e nada a recria. Sem broker nem outbox nesta
  sprint: nenhum caso atual justifica o custo.
- `EMAIL` e **no maximo uma vez** por chave: se o processo cair entre o envio e a gravacao do
  resultado, a linha fica `PENDENTE` e a unique impede reenvio. Recuperacao manual: consultar
  `PENDENTE` antigas. Isso inverte o trade-off anterior do `LockoutService` ("duplicar e melhor que
  perder") **so** para o mesmo bloqueio; falha registrada (`FALHOU`) continua reenviavel.

### 7. Payload por allowlist

- Titulo e mensagem sao montados de texto fixo por `tipo`, dentro do modulo. Nada do evento vira
  texto livre.
- Unica referencia persistida e exposta: `referencia_tipo` + `referencia_id`, por allowlist:
  `DESEMBOLSO_PIX_CONCLUIDO` -> `CONTRATO` + `contratoId`; `CONTA_BLOQUEADA` -> nenhuma.
- Nunca persistidos: CPF, CNPJ, chave Pix (nem mascarada), `externalId`, valor, e-mail, corpo de
  requisicao ou mensagem de excecao.
- Timestamps: `criada_em`, `lida_em`, `situacao_atualizada_em`, todos pelo `Clock` injetado.
- Marcar lida e idempotente: a segunda marcacao preserva o `lida_em` da primeira.

### 8. Retencao

- **5 anos contados de `criada_em`**, provisorio e sujeito a revisao juridica — mesmo prazo ja
  adotado para `audit_log_seguranca`, PLD e Open Finance nos docs operacionais. **Nao e afirmacao de
  obrigacao legal.** A trilha regulatoria do desembolso continua no `audit_log_seguranca` e na
  `pix_transferencia`; a notificacao e registro de comunicacao.
- Finalidade: provar que o usuario foi avisado e permitir auditoria de comunicacao.
- Aplicacao: **procedimento manual documentado** em `NOTIFICACOES.md`, sem job de expurgo nesta
  sprint.
- Efeito do expurgo na deduplicacao: apagada a linha, a chave some. Um replay de origem com mais de
  5 anos voltaria a notificar; nenhum produtor atual reprocessa fato tao antigo (o sincronizador Pix
  ignora status terminal).

### 9. Contrato HTTP da central

Todos exigem autenticacao (`isAuthenticated()`), derivam o usuario do principal e **nao aceitam
destinatario por parametro**.

| Operacao | Rota | Sucesso | Erros |
|---|---|---|---|
| Listar | `GET /api/v1/notificacoes?page=0&size=20` | `200` `Page<NotificacaoResponse>`, ordem `criadaEm` desc e `id` desc | `400 NTF-400-001` (`page < 0`, `size < 1` ou `size > 100`), `401` |
| Contar nao lidas | `GET /api/v1/notificacoes/nao-lidas/contagem` | `200` `{ "naoLidas": 0 }` | `401` |
| Marcar lida | `POST /api/v1/notificacoes/{id}/leitura` | `200` `NotificacaoResponse` com `lidaEm` | `400` (id nao-UUID), `401`, `404 NTF-404-001` |

`NotificacaoResponse`: `id`, `tipo`, `titulo`, `mensagem`, `criadaEm`, `lidaEm` (nulo quando nao
lida), `referencia` (nula ou `{ tipo, id }`).

- Item inexistente, de outro usuario ou fora do recorte `IN_APP` devolve o **mesmo** `404` neutro,
  sem identificador.
- Codigos novos com prefixo `NTF`, dono `notificacao`, registrados em `PrefixoCodigoErro`,
  publicados no catalogo e congelados na lista da Sprint 37, conforme o [ADR 0020](./0020-convencao-codigos-de-erro.md).

### 10. Dominio sem JPA

O agregado `Notificacao` e seus value objects nao importam Spring nem JPA. A persistencia fica em
`infrastructure.persistence` com entidade JPA propria e mapeamento explicito, conforme o
[ADR 0007](./0007-ddd-com-hexagonal-ports-and-adapters-por-modulo.md). Os demais modulos **nao** sao
migrados por esta decisao.

## Alternativas consideradas

- **Estender o `cobranca`**: descartada. `pix`, `credores` e `contratos` teriam de depender do
  `cobranca` para avisar alguem.
- **Migrar a regua de cobranca agora**: descartada. Funciona, tem retry, falha persistida e testes;
  mover e caro e nao muda nada para o usuario.
- **`LockoutService` chamando o modulo por porta**: descartada (§1). Ciclo entre modulos e e-mail
  podendo sair com o audit desfeito.
- **Destinatario por papel ou grupo**: descartada (§2). Um cenario (backoffice), que ja tem fila de
  trabalho.
- **Central com `IN_APP` e `EMAIL`**: descartada (§3). Obrigaria definir leitura de e-mail e misturaria
  aviso de seguranca com aviso de produto.
- **Unique total na chave**: descartada (§4). Uma falha de provider impediria para sempre o aviso
  daquele fato.
- **Outbox transacional ou broker**: adiada (§6). Garante entrega, mas nenhum caso atual paga o custo.
- **`@Entity` em `domain.model`, como os demais modulos**: descartada (§10). Contraria o ADR 0007 e os
  steps; o custo e uma classe e um mapeamento.
- **Retencao de 10 anos** (contratos/cobranca) ou **1 ano**: descartadas (§8). A primeira guarda
  contexto de jornada alem da trilha regulatoria, que ja tem 10 anos onde precisa; a segunda apaga o
  historico do e-mail de lockout antes do audit que ele complementa.

## Consequencias

### Positivas

- Primeiro momento positivo do produto: o tomador e avisado quando o desembolso Pix conclui.
- O e-mail de lockout ganha historico, e a falha dele deixa de desfazer o audit do bloqueio.
- Frente B (quais eventos notificam) vira acrescentar listener, texto e allowlist, sem tabela nova. Cada
  tipo novo amplia os `CHECK` de `tipo` (e de `referencia_tipo`, se trouxer referencia nova) por
  migration — o mesmo custo que o `audit_log_seguranca` ja paga a cada modulo desde a `V13`.
- Contrato da central pronto para F-27 e M-19.

### Negativas

- **Dois caminhos de notificacao** ate a regua migrar, e `CanalNotificacao` duplicado (`cobranca` e
  `notificacao`), mantido em sincronia por teste.
- O `notificacao` passa a conhecer eventos de cada modulo que notifica — acoplamento que cresce com a
  frente B, mesma forma do `backoffice`.
- Entrega nao duravel (§6), declarada.
- Central quase vazia: com um gatilho, a maioria dos usuarios nao vera nada.

### Neutras

- Opt-out, preferencias e push seguem fora (frentes C e D). O recorte `IN_APP` nasce sem depender de
  provider e compativel com push futuro.
- Retencao e politica de opt-out continuam pendentes de revisao juridica antes de producao.

## Implementacao

- Spec [038](../specs/fase-4/038-sprint-38-modulo-notificacao-historico.md) e steps
  [038](../steps-fase-4/backend/038-sprint-38-steps.md), Tasks 38.2 a 38.8.
- Migration `V61` (tabela `notificacao`, unique parcial, indices da central).
- `identity/domain/event/ContaBloqueadaEvent`; remocao de `shared/email`.
- Doc operacional [NOTIFICACOES.md](../repos/sep-api/NOTIFICACOES.md), com os dois caminhos e o
  procedimento de retencao.

## Referencias

- [ADR 0004 - Provider Pattern](./0004-provider-pattern-para-integracoes-externas.md)
- [ADR 0007 - DDD com Hexagonal por modulo](./0007-ddd-com-hexagonal-ports-and-adapters-por-modulo.md)
- [ADR 0014 - Estrategia de notificacoes transacionais](./0014-estrategia-de-notificacoes-transacionais.md)
- [ADR 0020 - Convencao dos codigos de erro](./0020-convencao-codigos-de-erro.md)
- [DIAGNOSTICO-PRODUTO.md](../docs-sep/DIAGNOSTICO-PRODUTO.md) — P2 (personas)
- Resolucao CMN 4.656/2018; LGPD Lei 13.709/2018
