# OPEN-FINANCE — Planejamento operacional da Sprint 9

Documento de apoio para a Sprint 9 do `sep-api`: enriquecimento da analise de credito com Open Finance via Celcoin/Finansystech.

> Status: preparatorio. Atualizar com detalhes reais da implementacao durante a Task 9.9.  
> Spec: [`specs/fase-2/009-sprint-9-credito-open-finance.md`](../../specs/fase-2/009-sprint-9-credito-open-finance.md). Steps: [`steps-fase-2/backend/009-sprint-9-steps.md`](../../steps-fase-2/backend/009-sprint-9-steps.md).

## Objetivo

Adicionar consentimento Open Finance opcional ao fluxo de credito. O tomador autoriza o compartilhamento de dados bancarios, o backend recebe/consulta movimentacao consolidada e reavalia o score interno da proposta.

## Fluxo previsto

```text
Tomador com proposta EM_ANALISE/PRE_APROVADA/PENDENCIA
  -> POST /credito/propostas/{id}/open-finance/consentimento
  -> OpenFinanceProvider cria consentimento no Celcoin/Finansystech
  -> API retorna urlAutorizacao
  -> tomador autoriza fora da SEP
  -> POST /webhooks/celcoin/open-finance
  -> consentimento AUTORIZADO ou NEGADO
  -> se AUTORIZADO: consultar/persistir movimentacao consolidada
  -> reavaliar proposta com RegraOpenFinanceMovimentacao
  -> auditar ciclo Open Finance
```

## Estados do consentimento

| Status | Significado |
| ------ | ----------- |
| `PENDENTE` | Link criado e aguardando autorizacao do tomador |
| `AUTORIZADO` | Tomador autorizou; dados podem ser consultados |
| `NEGADO` | Tomador recusou; score nao muda |
| `EXPIRADO` | Link expirou; novo consentimento pode ser solicitado |

## Endpoints previstos

| Metodo | Path | Auth | Descricao |
| ------ | ---- | ---- | --------- |
| `POST` | `/api/v1/credito/propostas/{id}/open-finance/consentimento` | CLIENTE dono da proposta | Inicia consentimento e retorna URL |
| `GET` | `/api/v1/credito/propostas/{id}/open-finance` | CLIENTE dono ou FINANCEIRO/ADMIN | Consulta status e ultimo snapshot |
| `POST` | `/api/v1/webhooks/celcoin/open-finance` | HMAC + Idempotency-Key | Recebe callback Celcoin/Finansystech |

## Variaveis previstas

```yaml
app:
  open-finance:
    provider: ${APP_OPEN_FINANCE_PROVIDER:fake}
  celcoin:
    open-finance:
      base-url: ${APP_CELCOIN_OPEN_FINANCE_BASE_URL:}
      client-id: ${APP_CELCOIN_OPEN_FINANCE_CLIENT_ID:}
      client-secret: ${APP_CELCOIN_OPEN_FINANCE_CLIENT_SECRET:}
      webhook-secret: ${APP_WEBHOOK_SECRET_CELCOIN_OPEN_FINANCE:dev-open-finance-webhook-secret-change-me}
```

## Dados persistidos

Persistir apenas snapshot consolidado suficiente para score:
- media de entradas mensal
- media de saidas mensal
- saldo medio
- numero de meses avaliados
- payload consolidado minimizado
- datas de inicio/autorizacao/recebimento/expiracao

Evitar persistir extrato bruto completo no dominio de credito. Se o payload bruto for necessario para reprocessamento tecnico, manter no mecanismo de webhook/outbox com retencao e acesso restrito.

## Reavaliacao de score

Regra planejada: `RegraOpenFinanceMovimentacao`.

Critérios iniciais:
- Sem movimentacao: `PENDENTE`, impacto neutro.
- Entradas mensais >= 3x parcela estimada: bonus forte.
- Entradas mensais >= 1x parcela estimada: bonus parcial.
- Entradas abaixo da parcela estimada: falha leve.
- Saldo medio negativo recorrente: alerta forte.

Parcela estimada nesta sprint = `valorSolicitado / prazoMeses`, sem juros. Calculo financeiro real permanece fora de escopo.

## Auditoria prevista

Novos tipos em `audit_log_seguranca`:
- `OPEN_FINANCE_CONSENTIMENTO_INICIADO`
- `OPEN_FINANCE_AUTORIZADO`
- `OPEN_FINANCE_NEGADO`
- `OPEN_FINANCE_DADOS_RECEBIDOS`
- `OPEN_FINANCE_REAVALIACAO`

Dados permitidos no audit log:
- `propostaId`
- `tomadorId`
- `consentimentoId`
- `status`
- `scoreAnterior`
- `scoreNovo`
- `numeroMesesAvaliados`
- `dataRecebimento`

Dados proibidos:
- extrato bruto completo
- identificadores completos de contas bancarias
- payload bruto Celcoin no audit log

## Testes previstos

```bash
cd <sep-api-root>
./gradlew test --tests "*OpenFinance*"
./gradlew test --tests "*Credito*"
./gradlew check
```

IT principal: `credito/web/OpenFinanceIT.java`, usando profile `test` e banco isolado `sep_test`.

Adapter Celcoin: `CelcoinOpenFinanceProviderIT` com WireMock, sem chamadas reais no CI.

## Limitacoes da Sprint 9

- Consentimento Open Finance e opcional.
- Sem renovacao automatica de consentimento.
- Sem UI web/mobile.
- Sem multiplos provedores alem de Celcoin/Finansystech.
- Sem ML ou bureau externo.
- Sem calculo de taxa/juros/CET.
