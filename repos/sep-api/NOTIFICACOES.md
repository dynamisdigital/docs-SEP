# NOTIFICACOES - sep-api

Documento operacional inicial de notificacoes transacionais do SEP.

> ADR: [`0014-estrategia-de-notificacoes-transacionais.md`](../../adr/0014-estrategia-de-notificacoes-transacionais.md).
> Spec: [`013-sprint-13-cobranca-inadimplencia.md`](../../specs/fase-2/013-sprint-13-cobranca-inadimplencia.md).
> Steps: [`013-sprint-13-steps.md`](../../steps-fase-2/backend/013-sprint-13-steps.md).

## Objetivo

Definir a politica inicial de comunicacao transacional usada pela Sprint 13 para cobranca, inadimplencia e renegociacao.

Esta politica cobre email e SMS enviados pelo backend. Nao cobre marketing, push mobile, WhatsApp, atendimento humano fora do sistema ou notificacoes de frontend.

## Canais

- **Email**: canal principal para mensagens completas, informacoes de renegociacao e comunicacoes formais.
- **SMS**: canal curto para lembretes de atraso e chamadas para acessar o portal/app.
- **Log**: canal fake para `dev`, `test` e `local-wiremock`; nao envia mensagem real.

Decisao tecnica:

- Email via SMTP/Spring Mail.
- SMS via Zenvia.
- Templates com Thymeleaf versionados em `src/main/resources/templates/notificacoes/`.
- Provider Pattern dentro do modulo `cobranca` na Sprint 13.

## Regras de conteudo

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

## Opt-out e LGPD

Comunicacoes de cobranca e renegociacao sao transacionais e relacionadas a contrato. Ainda assim:

- Opt-out deve ser respeitado para comunicacoes nao obrigatorias ou promocionais.
- Comunicacoes obrigatorias de inadimplencia precisam de parecer juridico antes de producao.
- O sistema deve registrar tentativa de envio sem armazenar conteudo sensivel.
- Logs e audit trails devem guardar metadados, nao a mensagem completa quando ela contiver dados do contrato.

**Pendente antes de producao:** revisao juridica formal de opt-out, base legal, texto dos templates e retencao.

## Templates iniciais

Email:

- `cobranca-amigavel-email.html`
- `cobranca-firme-email.html`
- `cobranca-final-email.html`

SMS:

- `cobranca-lembrete-sms.txt`
- `cobranca-firme-sms.txt`

Variaveis permitidas:

- `nomeTomador`
- `diasAtraso`
- `dataVencimento`
- `valorEmAberto`
- `linkPortal`
- `codigoReferencia`

Variaveis proibidas:

- CPF/CNPJ completo;
- dados de conta bancaria;
- token JWT, step-up token ou qualquer segredo;
- payload bruto de provider.

## Providers e ambientes

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

- `APP_NOTIFICACOES_REMETENTE_EMAIL`
- `ZENVIA_BASE_URL`
- `ZENVIA_API_TOKEN`
- `ZENVIA_SMS_FROM`

## Auditoria e retencao

Eventos da Sprint 13:

- `NOTIFICACAO_ENVIADA`
- `EVENTO_COBRANCA_REGISTRADO`
- `PARCELA_INADIMPLENTE`
- `RENEGOCIACAO_PROPOSTA`
- `RENEGOCIACAO_ACEITA`
- `RENEGOCIACAO_RECUSADA`

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

## Falhas e reprocesso

- Falha de notificacao nao deve impedir transicao de dominio critica.
- Cada tentativa deve gerar `EventoCobranca` com status tecnico.
- Retries automaticos ficam no adapter Zenvia via Resilience4j.
- Reprocessos manuais ficam para Sprint 14, no modulo `backoffice`.

## Checklist pre-producao

- [ ] Templates revisados pelo juridico.
- [ ] Opt-out revisado pelo juridico.
- [ ] Credenciais SMTP e Zenvia em secret manager do ambiente.
- [ ] WireMock cobrindo adapter Zenvia.
- [ ] Logs sem corpo completo de mensagem sensivel.
- [ ] Auditoria sem CPF/CNPJ ou dados bancarios.
