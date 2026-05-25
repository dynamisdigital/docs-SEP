# ADR 0014 - Estrategia de Notificacoes Transacionais

## Status

Aceito (2026-05-25). Sprint 13 (Epic 8 parte 2 - Cobranca, inadimplencia e recuperacao).

> **Nota de numeracao:** o spec 013 referencia "ADR 0013 - estrategia de notificacoes". O numero 0013 ja esta ocupado por [ADR 0013 - Provedor de Assinatura Digital](./0013-provedor-de-assinatura-digital.md). Esta ADR cobre o tema previsto na Sprint 13 sob o proximo numero livre.

## Contexto

A Sprint 13 estende o modulo `cobranca` para workflows de inadimplencia, contato ativo e renegociacao. O sistema precisa enviar comunicacoes transacionais ao tomador e ao financeiro por email e SMS, com trilha auditavel, retries controlados e isolamento de provedores externos.

Forcas relevantes:

- **CDC Lei 8.078/1990**: cobranca deve evitar constrangimento, exposicao indevida e linguagem abusiva.
- **LGPD Lei 13.709/2018**: mensagens devem minimizar dados pessoais, respeitar opt-out quando aplicavel e manter retencao proporcional.
- **CMN 4.656/2018**: eventos financeiros e operacionais precisam de auditoria reforcada.
- **Equipe pequena**: a solucao inicial deve ser simples, testavel e substituivel por Provider Pattern.
- **Operacao Brasil**: SMS precisa funcionar bem com numeros nacionais e custos previsiveis.

## Decisao

Adotaremos notificacoes transacionais com:

- **Email via SMTP/Spring Mail** para mensagens completas e rastreaveis.
- **SMS via Zenvia** como provedor primario para lembretes curtos.
- **Templates Thymeleaf** versionados em `src/main/resources/templates/notificacoes/`.
- **Provider Pattern** no modulo `cobranca`:
  - port `NotificationProvider` em `cobranca.application.port.out`;
  - adapter `SmtpNotificationProvider` para email;
  - adapter `ZenviaSmsNotificationProvider` para SMS;
  - adapter `LogNotificationProvider` para dev/testes.
- Selecao por properties, mantendo `LogNotificationProvider` como default em `dev`, `test` e `local-wiremock`.

## Alternativas consideradas

- **Zenvia**: provedor brasileiro, boa aderencia a SMS nacional, API REST simples, sandbox/fixtures adequados para WireMock. **Escolhido**.
- **Twilio**: API global madura e excelente documentacao, mas custo e operacao local podem ser menos favoraveis para o primeiro recorte Brasil.
- **TotalVoice**: alternativa nacional viavel, mantida como substituivel pelo Provider Pattern se contrato comercial favorecer no futuro.
- **AWS SES + SNS**: boa opcao quando a infraestrutura AWS estiver madura, mas antecipa dependencia operacional de cloud para uma sprint backend local.
- **SendGrid + provedor SMS separado**: tecnicamente viavel, mas aumenta o numero de fornecedores sem ganho claro nesta fase.

## Consequencias

### Positivas

- Provider Pattern permite trocar Zenvia por outro provedor sem alterar dominio ou use cases.
- `LogNotificationProvider` torna testes e desenvolvimento local independentes de credenciais.
- Templates versionados reduzem risco de mensagens divergentes entre ambientes.
- WireMock cobre contrato HTTP do adapter Zenvia sem chamar o provedor real.

### Negativas

- Spring Mail adiciona dependencia nova ao `sep-api`.
- Zenvia introduz custo por SMS e limite operacional por contrato.
- Entrega SMS nao garante leitura; eventos de envio devem ser tratados como tentativa, nao confirmacao de ciencia do tomador.

### Neutras

- Opt-out nao se aplica de forma absoluta a comunicacoes obrigatorias de relacao contratual e inadimplencia, mas a politica precisa de revisao juridica antes de producao.
- Falha de notificacao nao deve impedir transicao de dominio critica, como marcar parcela `INADIMPLENTE`; deve gerar evento/audit para reprocesso futuro no backoffice.

## Implementacao

Properties planejadas:

```yaml
app:
  notificacoes:
    provider: log # log | smtp-zenvia
    remetente-email: ${APP_NOTIFICACOES_REMETENTE_EMAIL:no-reply@sep.local}
    zenvia:
      base-url: ${ZENVIA_BASE_URL:https://api.zenvia.com}
      api-token: ${ZENVIA_API_TOKEN:}
      from: ${ZENVIA_SMS_FROM:SEP}
      timeout-ms: 5000
```

Dependencias previstas:

- `org.springframework.boot:spring-boot-starter-mail`
- Thymeleaf standalone ja existe no projeto e deve ser reutilizado para templates de notificacao.

Resilience4j:

- instance `zenvia-sms`;
- retry 3x para `5xx`/`IOException`;
- circuit breaker para proteger o fluxo de cobranca.

Templates iniciais:

- `cobranca-amigavel-email.html`
- `cobranca-firme-email.html`
- `cobranca-final-email.html`
- `cobranca-lembrete-sms.txt`
- `cobranca-firme-sms.txt`

## Riscos conhecidos e mitigacao

| Risco | Mitigacao |
|-------|-----------|
| Vazamento de dado pessoal na mensagem | Templates sem CPF/CNPJ, dados bancarios ou payload bruto; testes de blacklist minima. |
| Cobranca com linguagem indevida | `NOTIFICACOES.md` define politica textual e marca revisao juridica como pendente pre-producao. |
| Indisponibilidade Zenvia | Circuit breaker + retry; evento de falha fica disponivel para reprocesso no backoffice. |
| Duplicidade de envio | `EventoCobranca` com chave logica por parcela, dia de atraso e template/canal. |
| Opt-out mal interpretado | Separar comunicacao transacional/contratual de marketing; revisao juridica antes de producao. |

## Referencias

- [Spec 013 - Sprint 13 Cobranca Inadimplencia](../specs/fase-2/013-sprint-13-cobranca-inadimplencia.md)
- [Steps 013 - Sprint 13](../steps-fase-2/backend/013-sprint-13-steps.md)
- [ADR 0004 - Provider Pattern](./0004-provider-pattern-para-integracoes-externas.md)
- [ADR 0008 - WireMock para testes de integracao](./0008-wiremock-para-testes-integracao-celcoin.md)
- [COBRANCA.md](../repos/sep-api/COBRANCA.md)
- [NOTIFICACOES.md](../repos/sep-api/NOTIFICACOES.md)
- CDC Lei 8.078/1990
- LGPD Lei 13.709/2018
