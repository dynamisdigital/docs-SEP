# NOTIFICACOES - sep-api

Documento operacional das notificacoes do SEP. Desde a Sprint 38 existem **dois caminhos**, e este
documento cobre os dois:

| Caminho | Onde mora | O que envia | Historico |
|---|---|---|---|
| **Modulo `notificacao`** (Sprint 38) | `com.dynamis.sep_api.notificacao` | aviso `IN_APP` de desembolso Pix concluido; e-mail de conta bloqueada | tabela `notificacao` (`V61`) |
| **Regua de cobranca** (Sprint 13, legado) | `cobranca` (`NotificationProvider`) | e-mail e SMS de cobranca e renegociacao | `evento_cobranca` (`V30`) |

A regua ainda nao migrou para o modulo novo: e follow-up nomeado no `STATE.md`, e ate la o
`CanalNotificacao` existe duplicado nos dois modulos, com sincronia travada por teste.

> ADRs: [`0021-modulo-notificacao-transversal.md`](../../adr/0021-modulo-notificacao-transversal.md)
> (modulo, historico, idempotencia, retencao) e
> [`0014-estrategia-de-notificacoes-transacionais.md`](../../adr/0014-estrategia-de-notificacoes-transacionais.md)
> (providers da cobranca).
> Specs: [`038`](../../specs/fase-4/038-sprint-38-modulo-notificacao-historico.md) e
> [`013-sprint-13-cobranca-inadimplencia.md`](../../specs/fase-2/013-sprint-13-cobranca-inadimplencia.md).
> Steps: [`038-sprint-38-steps.md`](../../steps-fase-4/backend/038-sprint-38-steps.md) e
> [`013-sprint-13-steps.md`](../../steps-fase-2/backend/013-sprint-13-steps.md).

## Modulo `notificacao` (Sprint 38)

### Quem e avisado de que

| Tipo | Gatilho | Canal | Destinatario | Origem (chave de idempotencia) | Referencia |
|---|---|---|---|---|---|
| `DESEMBOLSO_PIX_CONCLUIDO` | `PixTransferenciaConcluidaEvent` (`DesembolsoPixConcluidoListener`) | `IN_APP` | tomador (`usuario_id` = `tomadorId`) | id da transferencia | `CONTRATO` + id do contrato |
| `CONTA_BLOQUEADA` | `ContaBloqueadaEvent` do `identity` (`ContaBloqueadaListener`) | `EMAIL` | usuario da conta | instante da falha que fechou a janela, em UTC | nenhuma |

Os dois listeners rodam em `AFTER_COMMIT`: fato que nao comitou nao gera aviso. Nenhum outro dos
eventos de dominio notifica — decidir quais notificam e a frente B, e depende de personas.

**A central esta quase vazia por desenho**: com um unico gatilho `IN_APP`, so quem teve desembolso Pix
concluido ve algum item.

### Estados

| Canal | Situacao ao criar | Situacoes finais | Leitura |
|---|---|---|---|
| `IN_APP` | `DISPONIVEL` | — | `lida_em`, gravado na primeira marcacao e preservado nas seguintes |
| `EMAIL` | `PENDENTE` (gravado **antes** do envio) | `ENVIADA` (provider real aceitou), `SIMULADA` (adapter de log), `FALHOU` (com `motivo_falha`) | nunca |

- `ENVIADA` e aceite do provider, **nao** ciencia do usuario. `SIMULADA` nunca vale como comprovante.
- `SMS` existe no enum por compatibilidade com a cobranca; o modulo nao o entrega.
- `motivo_falha` guarda **so o nome da classe** da excecao (`java.lang.IllegalStateException`), nunca a
  mensagem, que em provider de e-mail costuma carregar endereco, host ou trecho do corpo.

### Contrato da central

Todos exigem autenticacao; o usuario vem do token.

| Rota | Resposta |
|---|---|
| `GET /api/v1/notificacoes?page=0&size=20` | `Page<NotificacaoResponse>`, `criadaEm` desc e `id` desc; `size` 1..100, senao `400 NTF-400-001` |
| `GET /api/v1/notificacoes/nao-lidas/contagem` | `{ "naoLidas": 0 }` |
| `POST /api/v1/notificacoes/{id}/leitura` | `200 NotificacaoResponse`; idempotente; `404 NTF-404-001` para inexistente, de outro usuario ou de e-mail |

`NotificacaoResponse`: `id`, `tipo`, `titulo`, `mensagem`, `criadaEm` e — sempre presentes, nulos quando
vazios — `lidaEm` e `referencia { tipo, id }`. A central mostra **so `IN_APP`**: e-mail enviado fica no
historico e nao vira item nao lido. O contrato vigente e o OpenAPI do runtime (`/v3/api-docs`); as
collections trazem a pasta "Notificacoes (Sprint 38)".

### Idempotencia

Chave `(tipo, origem_id, usuario_id)` com unique parcial `WHERE situacao <> 'FALHOU'`:

- o mesmo evento publicado de novo, inclusive em paralelo, nao gera segunda linha nem segundo envio;
- uma tentativa que **falhou** nao bloqueia a proxima — um novo evento da mesma origem tenta de novo;
- a mesma origem para outro usuario, ou outra origem para o mesmo usuario, sao notificacoes legitimas.

A defesa e a constraint no banco, nao uma checagem previa.

### Falhas e o que o sistema garante

| Falha | Efeito na origem | Efeito na notificacao | Sinal |
|---|---|---|---|
| Provider de e-mail lanca | nenhum: bloqueio e audit comitados, login responde `401`/`423` | linha `FALHOU` com nome da classe | log `WARN` `notification_failed` |
| Gravacao da notificacao falha (banco) | nenhum: desembolso segue `CONCLUIDA`, audit do Pix gravado | nada gravado | log `ERROR` `notification_not_recorded` |
| Transacao de origem reverte | — | nada gravado, nada enviado | nenhum |
| Processo cai entre o commit da origem e o da notificacao | nenhum | **perdida**: listener em memoria nao e entrega duravel | nenhum |
| Processo cai entre o envio do e-mail e a gravacao do resultado | nenhum | linha fica `PENDENTE`, e a chave **impede reenvio** | consulta abaixo |

**Nao existe reenvio automatico, retry nem job de reprocesso.** A garantia de e-mail e "no maximo uma
vez" por origem.

Recuperacao manual de e-mails presos (somente leitura; a acao sobre eles e decisao operacional):

```sql
select id, usuario_id, tipo, origem_id, criada_em
from notificacao
where canal = 'EMAIL' and situacao = 'PENDENTE' and criada_em < now() - interval '15 minutes'
order by criada_em;
```

### Dados que o historico guarda

- Titulo e mensagem vem de texto fixo por tipo, dentro dos listeners. Nada do evento vira texto livre.
- Unica referencia: `referencia_tipo` + `referencia_id`, por allowlist (`CONTRATO` para o Pix).
- **Nunca** entram: endereco de e-mail (o destinatario e so `usuario_id`), CPF, CNPJ, chave Pix,
  `externalId` do provider, valor, corpo de requisicao ou mensagem de excecao. Provado por valor no
  `NotificacaoReplayEMinimizacaoIT`, no banco, na resposta HTTP e nos logs do modulo.

### Retencao

- **5 anos contados de `criada_em`**, provisorio e **sujeito a revisao juridica** (ADR 0021 §8) — mesmo
  prazo ja adotado para `audit_log_seguranca`, PLD e Open Finance. Nao e afirmacao de obrigacao legal.
- **Nao ha expurgo automatico.** O procedimento e manual, executado pela operacao depois da revisao
  juridica, com backup previo:

```sql
delete from notificacao where criada_em < now() - interval '5 years';
```

- Efeito na deduplicacao: apagada a linha, a chave some. Um evento de origem com mais de 5 anos voltaria a
  notificar; nenhum produtor atual reprocessa fato tao antigo.

### Ambientes e providers

- **Nao ha adapter real de e-mail neste modulo.** `LogEnvioEmailAdapter` fica ativo com qualquer valor de
  `app.notificacoes.provider` e grava `SIMULADA`. Com `smtp-zenvia`, a cobranca envia de verdade e o
  e-mail de lockout continua simulado — agora visivel no historico.
- **Pendente para a Fase 5**, antes de ligar e-mail real no modulo:
  - selecao por `app.notificacoes.provider` junto com o adapter real;
  - envio assincrono ou timeout curto: hoje o e-mail sai na mesma requisicao do login que bloqueou a conta;
  - o adapter real precisa logar o proprio diagnostico ja sanitizado, porque o caso de uso so registra o
    nome da classe da excecao;
  - pool de conexoes: cada requisicao que publica evento com listener `REQUIRES_NEW` segura duas conexoes
    durante o `AFTER_COMMIT` (padrao anterior a Sprint 38, medido na Task 38.7). Dimensionar o pool em
    pelo menos o dobro das requisicoes concorrentes com esse padrao.

## Regua de cobranca (Sprint 13, legado)

As secoes abaixo descrevem o caminho da cobranca, que segue como na Sprint 13 ate migrar para o modulo
`notificacao`.

### Objetivo

Definir a politica inicial de comunicacao transacional usada pela Sprint 13 para cobranca, inadimplencia e renegociacao.

Esta politica cobre email e SMS enviados pelo backend. Nao cobre marketing, push mobile, WhatsApp, atendimento humano fora do sistema ou notificacoes de frontend.

### Canais

- **Email**: canal principal para mensagens completas, informacoes de renegociacao e comunicacoes formais.
- **SMS**: canal curto para lembretes de atraso e chamadas para acessar o portal/app.
- **Log**: canal fake para `dev`, `test` e `local-wiremock`; nao envia mensagem real.

Decisao tecnica:

- Email via SMTP/Spring Mail.
- SMS via Zenvia.
- Templates com Thymeleaf versionados em `src/main/resources/templates/notificacoes/`.
- Provider Pattern dentro do modulo `cobranca` na Sprint 13.

### Regras de conteudo

Mensagens de cobranca devem:

- usar linguagem objetiva, respeitosa e sem ameaca;
- informar que existe parcela em atraso ou proposta de renegociacao;
- orientar o tomador a acessar o canal autenticado;
- evitar detalhes sensiveis no SMS;
- incluir identificador interno curto quando necessario para atendimento.

Mensagens nao devem conter:

- CPF, CNPJ, documento completo ou dados bancarios;
- payload bruto de provider;
- informacao que exponha a situacao de inadimplencia a terceiros;
- linguagem constrangedora, abusiva ou que sugira negativacao automatica fora do escopo aprovado.

### Opt-out e LGPD

Comunicacoes de cobranca e renegociacao sao transacionais e relacionadas a contrato. Ainda assim:

- Opt-out deve ser respeitado para comunicacoes nao obrigatorias ou promocionais.
- Comunicacoes obrigatorias de inadimplencia precisam de parecer juridico antes de producao.
- O sistema deve registrar tentativa de envio sem armazenar conteudo sensivel.
- Logs e audit trails devem guardar metadados, nao a mensagem completa quando ela contiver dados do contrato.

**Pendente antes de producao:** revisao juridica formal de opt-out, base legal, texto dos templates e retencao.

### Templates iniciais

Email:

- `cobranca-amigavel-email.html`
- `cobranca-firme-email.html`
- `cobranca-final-email.html`
- `renegociacao-proposta-email.html`

SMS:

- `cobranca-lembrete-sms.txt`
- `cobranca-firme-sms.txt`
- `renegociacao-proposta-sms.txt`

Variaveis permitidas:

- `nomeTomador`
- `diasAtraso`
- `dataVencimento`
- `valorEmAberto`
- `numeroParcela`
- `valor`
- `novoVencimento`
- `numeroParcelas`
- `linkPortal`
- `codigoReferencia`

Variaveis proibidas:

- CPF/CNPJ completo;
- dados de conta bancaria;
- token JWT, step-up token ou qualquer segredo;
- payload bruto de provider.

### Providers e ambientes

Default seguro:

```yaml
app:
  notificacoes:
    provider: log
```

Ambientes esperados:

| Ambiente | Provider |
|----------|----------|
| `test` | `log` |
| `dev` | `log` |
| `local-wiremock` | `log` ou `zenvia-wiremock` quando houver profile dedicado |
| `homologacao` | `smtp-zenvia` |
| `producao` | `smtp-zenvia` |

Variaveis planejadas:

- `APP_NOTIFICACOES_PROVIDER` (`log` ou `smtp-zenvia`)
- `APP_NOTIFICACOES_REMETENTE_EMAIL`
- `APP_NOTIFICACOES_ZENVIA_BASE_URL`
- `APP_NOTIFICACOES_ZENVIA_API_TOKEN`
- `APP_NOTIFICACOES_ZENVIA_FROM`
- `APP_NOTIFICACOES_ZENVIA_TIMEOUT_MS`
- `APP_COBRANCA_FINANCEIRO_EMAIL` (copia final para financeiro; vazio desabilita)

### Auditoria e retencao

Eventos da Sprint 13:

- `NOTIFICACAO_ENVIADA`
- `EVENTO_COBRANCA_REGISTRADO`
- `PARCELA_INADIMPLENTE`
- `RENEGOCIACAO_PROPOSTA`
- `RENEGOCIACAO_ACEITA`
- `RENEGOCIACAO_RECUSADA`
- `RENEGOCIACAO_EXPIRADA`

Payload permitido no audit:

- IDs internos;
- canal;
- template;
- status tecnico;
- dias de atraso;
- timestamp;
- operador responsavel quando houver.

Payload proibido:

- corpo completo da mensagem com dados sensiveis;
- CPF/CNPJ;
- telefone completo quando nao for necessario;
- segredo/API token;
- resposta bruta da Zenvia.

### Falhas e reprocesso

- Falha de notificacao nao deve impedir transicao de dominio critica.
- Cada tentativa deve gerar `EventoCobranca` com status tecnico.
- Retries automaticos ficam no adapter Zenvia via Resilience4j.
- Reprocessos manuais ficam para Sprint 14, no modulo `backoffice`.

### Checklist pre-producao

- [ ] Templates revisados pelo juridico.
- [ ] Opt-out revisado pelo juridico.
- [ ] Credenciais SMTP e Zenvia em secret manager do ambiente.
- [ ] WireMock cobrindo adapter Zenvia.
- [ ] `APP_NOTIFICACOES_PROVIDER=smtp-zenvia` validado em homologacao com SMTP e Zenvia reais.
- [ ] Logs sem corpo completo de mensagem sensivel.
- [ ] Auditoria sem CPF/CNPJ ou dados bancarios.
