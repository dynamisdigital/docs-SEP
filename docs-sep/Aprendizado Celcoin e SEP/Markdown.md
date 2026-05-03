Title: Gera o token para autenticação dos endpoints da API.

URL Source: https://developers.celcoin.com.br/reference

Markdown Content:
# Generates the token for authentication of API endpoints.

[Jump to Content](https://developers.celcoin.com.br/reference#content)

[![Image 1: Celcoin - Infraestrutura de Tecnologia Financeira - Banking, Payments e Credit](https://files.readme.io/f75294e-Logo.svg)](https://developers.celcoin.com.br/)

[Documentation](https://developers.celcoin.com.br/docs)[Recipes](https://developers.celcoin.com.br/recipes)[API](https://developers.celcoin.com.br/reference)[Ask AI](javascript:window.Kapa.open())

* * *

[Status Page](https://developers.celcoin.com.br/page/status-page)[Support](https://suporte.celcoin.com.br/hc/pt-br/requests/new?ticket_form_id=4553742630939)[![Image 2: Celcoin - Infraestrutura de Tecnologia Financeira - Banking, Payments e Credit](https://files.readme.io/f75294e-Logo.svg)](https://developers.celcoin.com.br/)

API

Search

CTRL-K

[Status Page](https://developers.celcoin.com.br/page/status-page)[Support](https://suporte.celcoin.com.br/hc/pt-br/requests/new?ticket_form_id=4553742630939)

v2.0.0

[Documentation](https://developers.celcoin.com.br/docs)[Recipes](https://developers.celcoin.com.br/recipes)[API](https://developers.celcoin.com.br/reference)[Ask AI](javascript:window.Kapa.open())Generates the token for authentication of API endpoints.

JUMP TO CTRL-/

## Celcoin Infratech API

*   [Token](https://developers.celcoin.com.br/reference/post_v5-token)
    *   [Generates the token for authentication of API endpoints.post](https://developers.celcoin.com.br/reference/post_v5-token)

## CEL_ONBOARDING

*   [Onboarding](https://developers.celcoin.com.br/reference/propostas)
    *   [Create Individual proposal.post](https://developers.celcoin.com.br/reference/criar-proposta-pessoa-fisica)
    *   [Create Legal Entity proposal.post](https://developers.celcoin.com.br/reference/criar-proposta-pessoa-juridica)
    *   [Search for a proposal or a list of proposals.get](https://developers.celcoin.com.br/reference/consultar-proposta)
    *   [Search for a file or a list of files.get](https://developers.celcoin.com.br/reference/buscar-arquivos-proposta)
    *   [Search webview journey tagging.get](https://developers.celcoin.com.br/reference/buscar-tagueamento-jornada-webview)

## cel_banking - BaaS

*   [Account Management](https://developers.celcoin.com.br/reference/cria%C3%A7%C3%A3o-de-contas-v2)
    *   [Account creation](https://developers.celcoin.com.br/reference/api-para-onboarding)
        *   [Account Opening and KYC](https://developers.celcoin.com.br/reference/api-para-onboarding)

    *   [Check Account Status.get](https://developers.celcoin.com.br/reference/verificar-status-da-conta)
    *   [Update Individual Customer Data put](https://developers.celcoin.com.br/reference/atualizar-dados-do-cliente)
    *   [Update PJ Client data put](https://developers.celcoin.com.br/reference/atualizar-dados-do-cliente-pj)
    *   [Returns individual account information get](https://developers.celcoin.com.br/reference/retorna-informa%C3%A7%C3%B5es-da-conta)
    *   [Returns PJ account information get](https://developers.celcoin.com.br/reference/retorna-informa%C3%A7%C3%B5es-de-conta-pj)
    *   [Returns information from multiple individual accounts get](https://developers.celcoin.com.br/reference/retorna-informa%C3%A7%C3%B5es-de-varias-contas)
    *   [Returns information from multiple PJ accounts get](https://developers.celcoin.com.br/reference/retorna-informa%C3%A7%C3%B5es-de-varias-contas-pj)
    *   [Change account status put](https://developers.celcoin.com.br/reference/altera-status-da-conta)
    *   [Close account del](https://developers.celcoin.com.br/reference/encerra-conta)
    *   [Account Creation V1 (Discontinued)](https://developers.celcoin.com.br/reference/criar-conta-pj)
        *   [Create a Business Account post](https://developers.celcoin.com.br/reference/criar-conta-pj)
        *   [Create Individual Account post](https://developers.celcoin.com.br/reference/criar-conta-pf)

*   [Account Information](https://developers.celcoin.com.br/reference/consultar-saldo)
    *   [Check Balance get](https://developers.celcoin.com.br/reference/consultar-saldo)
    *   [Check Daily Balance get](https://developers.celcoin.com.br/reference/consultar-saldo-dia)
    *   [View Extract get](https://developers.celcoin.com.br/reference/consultar-extrato)
    *   [Consultar Transações do Extrato get](https://developers.celcoin.com.br/reference/consultar-transacoes-do-extrato)
    *   [Consultar Extrato Detalhado (Beta)get](https://developers.celcoin.com.br/reference/consultar-extrato-detalhado)

*   [Transfer between accounts](https://developers.celcoin.com.br/reference/realizar-uma-transferencia-entre-contas)
    *   [Initiate a transfer between accounts post](https://developers.celcoin.com.br/reference/realizar-uma-transferencia-entre-contas)
    *   [Check the status of an internal transfer get](https://developers.celcoin.com.br/reference/consultar-status-transferencia-interna)

*   [Pix](https://developers.celcoin.com.br/reference/pix)
    *   [Payment (cash-out)](https://developers.celcoin.com.br/reference/redirect-consulta-emv)
        *   [EMV QRCode Query](https://developers.celcoin.com.br/reference/redirect-consulta-emv)
        *   [Querying a Pix key (DICT)get](https://developers.celcoin.com.br/reference/consulta-informa%C3%A7%C3%B5es-da-chave-pix-externa)
        *   [Pix Cashout post](https://developers.celcoin.com.br/reference/realizar-transfer%C3%AAncia-pix)
        *   [Check PIX Status get](https://developers.celcoin.com.br/reference/verificar-status-do-pix)
        *   [PIX Participants get](https://developers.celcoin.com.br/reference/participantes-pix)

    *   [Receipt (cash-in)](https://developers.celcoin.com.br/reference/baas-cria%C3%A7%C3%A3o-de-qrcode)
        *   [QRCode Creation](https://developers.celcoin.com.br/reference/baas-cria%C3%A7%C3%A3o-de-qrcode)
        *   [Check QRCode status](https://developers.celcoin.com.br/reference/baas-recebimento-cash-in-consulta-status)
        *   [Pix receipts query](https://developers.celcoin.com.br/reference/consulta-dados-de-recebimentos)

    *   [Cash-in return](https://developers.celcoin.com.br/reference/iniciar-uma-devolu%C3%A7%C3%A3o-pix)
        *   [Starting a Return of a Pix Receipt post](https://developers.celcoin.com.br/reference/iniciar-uma-devolu%C3%A7%C3%A3o-pix)
        *   [Checking the Status of a Pix Receipt Return get](https://developers.celcoin.com.br/reference/consultar-status-devolucao-pix)

    *   [Cash-out refund](https://developers.celcoin.com.br/reference/devolu%C3%A7%C3%A3o-de-pagamento-cash-out)
        *   [Querying a Pix-out return](https://developers.celcoin.com.br/reference/devolu%C3%A7%C3%A3o-de-pagamento-cash-out)

    *   [Key Management](https://developers.celcoin.com.br/reference/criar-chaves-pix)
        *   [Create Pix keys post](https://developers.celcoin.com.br/reference/criar-chaves-pix)
        *   [Check Pix keys for an account get](https://developers.celcoin.com.br/reference/consulta-informa%C3%A7%C3%B5es-da-chave-pix)
        *   [Delete Pix keys del](https://developers.celcoin.com.br/reference/excluir-chaves-pix)
        *   [Alteração de nome em uma chave Pix put](https://developers.celcoin.com.br/reference/alterar-chave-pix)

    *   [Pix Key Portability and Claim](https://developers.celcoin.com.br/reference/cadastrar-portabilidade-reivindicacao-de-chaves-pix)
        *   [Register new Pix key claim/portability post](https://developers.celcoin.com.br/reference/cadastrar-portabilidade-reivindicacao-de-chaves-pix)
        *   [Confirm new Pix key claim/portability post](https://developers.celcoin.com.br/reference/confirmar-reivindica%C3%A7%C3%A3o-portabilidade-de-chave-pix)
        *   [Cancel new Pix key claim/portability post](https://developers.celcoin.com.br/reference/cancela-reivindicacao-e-portabilidade-de-chave-pix)
        *   [Pix key claim/portability query get](https://developers.celcoin.com.br/reference/consulta-reivindicacao-e-portabilidade-de-chave-pix)
        *   [Check the Pix key portability/claim list get](https://developers.celcoin.com.br/reference/consulta-lista-de-reivindicacao-e-portabilidade-de-chave-pix)

    *   [Split Pix](https://developers.celcoin.com.br/reference/split-de-pix-cash-in-por-qr-code-din%C3%A2micoduedate-1)
        *   [Split de Pix Cash-in por QR Code dinâmico(duedate)post](https://developers.celcoin.com.br/reference/split-de-pix-cash-in-por-qr-code-din%C3%A2micoduedate-1)
        *   [Split de Pix Cash-in por QR Code dinâmico (immediate)post](https://developers.celcoin.com.br/reference/split-de-pix-cash-in-por-qr-code-din%C3%A2mico-immediate-1)

*   [Automatic Pix](https://developers.celcoin.com.br/reference/jornada-pagadora)
    *   [Paying Journey](https://developers.celcoin.com.br/reference/aceita-uma-recorr%C3%AAncia-jornada-1)
        *   [Accepts a recurrence Journey 1 patch](https://developers.celcoin.com.br/reference/aceita-uma-recorr%C3%AAncia-jornada-1)
        *   [Accept a recurrence journey 2 post](https://developers.celcoin.com.br/reference/aceita-uma-recorr%C3%AAncia-jornada-2)
        *   [Accept a recurrence Journey 3 post](https://developers.celcoin.com.br/reference/aceita-uma-recorr%C3%AAncia-jornada-3)
        *   [Accepts a recurring journey 4 post](https://developers.celcoin.com.br/reference/aceita-uma-recorr%C3%AAncia-jornada-4)
        *   [Refuse a recurrence patch](https://developers.celcoin.com.br/reference/recusa-uma-recorr%C3%AAncia-baas)
        *   [Search for recurrences by status with pagination get](https://developers.celcoin.com.br/reference/busca-recorr%C3%AAncias-por-status-com-pagina%C3%A7%C3%A3o-baas)
        *   [Search for a recurrence by ID get](https://developers.celcoin.com.br/reference/busca-uma-recorr%C3%AAncia-pelo-id-baas)
        *   [Cancellation of Authorization post](https://developers.celcoin.com.br/reference/cancelamento-de-autoriza%C3%A7%C3%A3o-baas)
        *   [Appointment cancellation post](https://developers.celcoin.com.br/reference/cancelamento-de-agendamento-baas)

    *   [Receiving Journey](https://developers.celcoin.com.br/reference/crie-uma-recorr%C3%AAncia-com-jornada-1)
        *   [Crie uma recorrência com jornada 1 post](https://developers.celcoin.com.br/reference/crie-uma-recorr%C3%AAncia-com-jornada-1)
        *   [Create a recurrence with journey 2 post](https://developers.celcoin.com.br/reference/crie-uma-recorr%C3%AAncia-com-a-jornada-dois-baas)
        *   [Crie uma recorrência jornada 3 post](https://developers.celcoin.com.br/reference/crie-uma-recorr%C3%AAncia-jornadas-3-e-4)
        *   [Crie uma recorrência jornada 4 post](https://developers.celcoin.com.br/reference/crie-uma-recorr%C3%AAncia-jornada-4)
        *   [Sending an appointment put](https://developers.celcoin.com.br/reference/envio-de-agendamento)
        *   [Receipt retries post](https://developers.celcoin.com.br/reference/retentativas-de-recebimento)
        *   [Appointment cancellation post](https://developers.celcoin.com.br/reference/cancelamento-de-agendamento-2)
        *   [Cancellation of recurrence post](https://developers.celcoin.com.br/reference/cancelamento-da-recorr%C3%AAncia)

*   [Pix Inteligente](https://developers.celcoin.com.br/reference/get_new-endpoint-2)
    *   [Criar consentimento para transação de Pix Inteligente post](https://developers.celcoin.com.br/reference/get_new-endpoint-2)
    *   [Cancelar consetimento de longo prazo patch](https://developers.celcoin.com.br/reference/patch_new-endpoint)
    *   [Detalhar Consentimento get](https://developers.celcoin.com.br/reference/get_open-keysitpapiv2sweeping-accountsv2payment-initiation-1)
    *   [Listar consentimentos get](https://developers.celcoin.com.br/reference/post_open-keysitpapiv2payment-initiationcallback-1)

*   [Agendador de Transação](https://developers.celcoin.com.br/reference/consultar-agendamento-de-pix-baas)
    *   [Consultar agendamento de pix get](https://developers.celcoin.com.br/reference/consultar-agendamento-de-pix-baas)
    *   [Cancelar agendamento de pix del](https://developers.celcoin.com.br/reference/cancelar-agendamento-de-pix-baas)
    *   [Endpoint responsável por listar agendamentos get](https://developers.celcoin.com.br/reference/lista-pix-agendado-baas)

*   [TED](https://developers.celcoin.com.br/reference/enviar-uma-transferencia-ted)
    *   [Send a TED post](https://developers.celcoin.com.br/reference/enviar-uma-transferencia-ted)
    *   [Check the status of a TED transfer get](https://developers.celcoin.com.br/reference/consultar-status-de-uma-ted)

*   [Issuing of bills](https://developers.celcoin.com.br/reference/criar-cobranca-avulsa)
    *   [Issue Ticket post](https://developers.celcoin.com.br/reference/criar-cobranca-avulsa)
    *   [Check Issued Bill get](https://developers.celcoin.com.br/reference/consultar-staus-cobranca-avulsa)
    *   [Consulta de Boletos por Período (BETA)get](https://developers.celcoin.com.br/reference/consulta-boleto-periodo)
    *   [Cancel Issued Bill del](https://developers.celcoin.com.br/reference/delete_charge-transactionid)
    *   [Generate PDF for an Issued Bill get](https://developers.celcoin.com.br/reference/gerar-um-pdf-para-uma-cobran%C3%A7a)

*   [CNAB](https://developers.celcoin.com.br/reference/processamento-de-arquivo-cnab)
    *   [Processamento de Arquivo CNAB post](https://developers.celcoin.com.br/reference/processamento-de-arquivo-cnab)
    *   [Consulta de Dados CNAB enviado get](https://developers.celcoin.com.br/reference/consulta-de-dados-cnab-enviado)
    *   [Baixar arquivo retorno do CNAB pelo id.get](https://developers.celcoin.com.br/reference/baixar-arquivo-retorno-do-cnab-pelo-id)
    *   [Baixar arquivo remessa do CNAB pelo id.get](https://developers.celcoin.com.br/reference/baixar-arquivo-remessa-do-cnab-pelo-id)

*   [Bill payment](https://developers.celcoin.com.br/reference/efetuar-pagamento-de-conta)
    *   [Bill payment.post](https://developers.celcoin.com.br/reference/efetuar-pagamento-de-conta)
    *   [Status of a Bill Payment.get](https://developers.celcoin.com.br/reference/consultar-status-de-pagamento-de-conta)

*   [Top-ups](https://developers.celcoin.com.br/reference/efetuar-uma-recarga)
    *   [Make Recharge post](https://developers.celcoin.com.br/reference/efetuar-uma-recarga)
    *   [Check Recharge get](https://developers.celcoin.com.br/reference/consultar-recarga)

*   [Vehicle Debts](https://developers.celcoin.com.br/reference/criar-pedido-de-consulta-de-d%C3%A9bitos-veiculares)
    *   [Create a vehicle debt inquiry request.post](https://developers.celcoin.com.br/reference/criar-pedido-de-consulta-de-d%C3%A9bitos-veiculares)
    *   [Consult vehicle debt inquiry request.get](https://developers.celcoin.com.br/reference/consultar-pedido-de-consulta-de-d%C3%A9bitos-veiculares)
    *   [Make Vehicle Debt Payment post](https://developers.celcoin.com.br/reference/realizar-pagamento-debito-veicular)
    *   [Check vehicle payments and debts.get](https://developers.celcoin.com.br/reference/consultar-pagamento-de-debitos-veiculares)

*   [Income Statement](https://developers.celcoin.com.br/reference/consultar-informe-de-rendimentos)
    *   [View Income Report get](https://developers.celcoin.com.br/reference/consultar-informe-de-rendimentos)

*   [Dados via Open Finance](https://developers.celcoin.com.br/reference/consentimento-3)
    *   [Consent](https://developers.celcoin.com.br/reference/post_baas-v1-open-dat-consents)
        *   [Pedido de consentimento de dados post](https://developers.celcoin.com.br/reference/post_baas-v1-open-dat-consents)
        *   [Callback do consentimento post](https://developers.celcoin.com.br/reference/post_baas-v1-open-dat-consents-callback)

    *   [Accounts | Dados](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-accounts)
        *   [Obtém a lista de contas consentidas pelo cliente get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-accounts)
        *   [Obter detalhes de uma conta específica get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-accounts-accountid)
        *   [Obtém os saldos da conta identificada por accountId get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-accounts-accountid-balances)
        *   [Obtém a lista de transações da conta identificada por accountId get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-accounts-accountid-transactions)

    *   [Customers | Dados](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-customers-personal-identifications)
        *   [Obtém os registros de identificação da pessoa natural get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-customers-personal-identifications)
        *   [Obtém os dados de qualificação da pessoa natural get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-customers-personal-qualifications)
        *   [Obtém os dados de relacionamento da pessoa natural com a instituição get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-customers-personal-financial-relations)
        *   [Obtém os registros de identificação da pessoa jurídica get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-customers-business-identifications)
        *   [Obtém os dados de qualificação da pessoa jurídica get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-customers-business-qualifications)
        *   [Obtém os dados de relacionamento da pessoa jurídica com a instituição get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-customers-business-financial-relations)

    *   [Resources | Dados](https://developers.celcoin.com.br/reference/get_api-open-keys-resources-v3-resources-1)
        *   [Obtém a lista de recursos consentidos pelo cliente get](https://developers.celcoin.com.br/reference/get_api-open-keys-resources-v3-resources-1)

    *   [Investments | Dados](https://developers.celcoin.com.br/reference/get_api-open-keys-bank-fixed-incomes-v1-investments-1)
        *   [Obtém lista de investimentos em renda fixa bancária get](https://developers.celcoin.com.br/reference/get_api-open-keys-bank-fixed-incomes-v1-investments-1)
        *   [Obtém detalhes de um investimento em renda fixa bancária get](https://developers.celcoin.com.br/reference/get_api-open-keys-bank-fixed-incomes-v1-investments-investmentid-1)
        *   [Obtém saldos de um investimento em renda fixa bancária get](https://developers.celcoin.com.br/reference/get_api-open-keys-bank-fixed-incomes-v1-investments-investmentid-balances-1)
        *   [Obtém transações de um investimento em renda fixa bancária get](https://developers.celcoin.com.br/reference/get_api-open-keys-bank-fixed-incomes-v1-investments-investmentid-transactions-1)
        *   [Obtém lista de investimentos em renda fixa de crédito get](https://developers.celcoin.com.br/reference/get_api-open-keys-credit-fixed-incomes-v1-investments-1)
        *   [Obtém detalhes de um investimento em renda fixa de crédito get](https://developers.celcoin.com.br/reference/get_api-open-keys-credit-fixed-incomes-v1-investments-investmentid-1)
        *   [Obtém lista de investimentos em renda variável get](https://developers.celcoin.com.br/reference/get_api-open-keys-variable-incomes-v1-investments-1)
        *   [Obtém detalhes de uma nota de corretagem get](https://developers.celcoin.com.br/reference/get_api-open-keys-variable-incomes-v1-investments-investmentid-broker-note-brokernoteid-1)
        *   [Obtém lista de investimentos em títulos do tesouro get](https://developers.celcoin.com.br/reference/get_api-open-keys-treasure-titles-v1-investments-1)
        *   [Obtém lista de investimentos em fundos get](https://developers.celcoin.com.br/reference/get_api-open-keys-funds-v1-investments-1)

    *   [Financings | Dados](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-financings-contracts)
        *   [Obtém os dados dos contratos de financiamento get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-financings-contracts)
        *   [Obtém detalhes de um contrato de financiamento identificado por contractId get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-financings-contracts-contractid)
        *   [Obtém cronograma de parcelas de um financiamento get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-financings-contracts-contractid-scheduled-instalments)
        *   [Obtém histórico de pagamentos de um financiamento get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-financings-contracts-contractid-payments)
        *   [Obtém a lista de garantias vinculadas ao contrato de financiamento get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-financings-contracts-contractid-warranties)

    *   [Loans | Dados](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-loans-contracts)
        *   [Obtém lista de contratos de empréstimo get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-loans-contracts)
        *   [Obtém detalhes de um contrato de empréstimo get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-loans-contracts-contractid)
        *   [Obtém cronograma de parcelas de um empréstimo get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-loans-contracts-contractid-scheduled-instalments)
        *   [Obtém histórico de pagamentos de um empréstimo get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-loans-contracts-contractid-payments)
        *   [Obtém garantias de um contrato de empréstimo get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-loans-contracts-contractid-warranties)

*   [Pagamentos via Open Finance (ITP)](https://developers.celcoin.com.br/reference/application-accounts-1)
    *   [Contas de crédito da Aplicação](https://developers.celcoin.com.br/reference/post_baas-v1-open-itp-applications-applicationid-accounts-1)
        *   [Criar conta de crédito post](https://developers.celcoin.com.br/reference/post_baas-v1-open-itp-applications-applicationid-accounts-1)
        *   [Listar contas de crédito get](https://developers.celcoin.com.br/reference/get_baas-v1-open-itp-applications-applicationid-accounts-1)
        *   [Buscar dados de uma conta de crédito get](https://developers.celcoin.com.br/reference/get_baas-v1-open-itp-applications-applicationid-accounts-accountid-1)
        *   [Deletar uma conta de crédito del](https://developers.celcoin.com.br/reference/delete_baas-v1-open-itp-applications-applicationid-accounts-accountid-1)

    *   [URL de redirecionamentos da Aplicação](https://developers.celcoin.com.br/reference/post_baas-v1-open-itp-applications-applicationid-redirects-1)
        *   [Add redirect URL post](https://developers.celcoin.com.br/reference/post_baas-v1-open-itp-applications-applicationid-redirects-1)
        *   [List redirect URLs get](https://developers.celcoin.com.br/reference/get_baas-v1-open-itp-applications-applicationid-redirects-1)
        *   [Buscar dados de uma URL de redirecionamento get](https://developers.celcoin.com.br/reference/get_baas-v1-open-itp-applications-applicationid-redirects-redirectid-1)
        *   [Deletar URL de redirecionamento del](https://developers.celcoin.com.br/reference/delete_baas-v1-open-itp-applications-applicationid-redirects-redirectid-1)

    *   [Application Webhooks](https://developers.celcoin.com.br/reference/post_baas-v1-open-itp-applications-applicationid-webhooks-1)
        *   [Cadastrar webhook da aplicação post](https://developers.celcoin.com.br/reference/post_baas-v1-open-itp-applications-applicationid-webhooks-1)
        *   [To obtain .get](https://developers.celcoin.com.br/reference/get_baas-v1-open-itp-applications-applicationid-webhooks-1)
        *   [To obtain .get](https://developers.celcoin.com.br/reference/get_baas-v1-open-itp-applications-applicationid-webhooks-id-1)
        *   [To obtain .del](https://developers.celcoin.com.br/reference/delete_baas-v1-open-itp-applications-applicationid-webhooks-id-1)

    *   [Configuração da Aplicação](https://developers.celcoin.com.br/reference/post_baas-v1-open-itp-applications-applicationid-settings-1)
        *   [Criar ou atualizar configuração da aplicação post](https://developers.celcoin.com.br/reference/post_baas-v1-open-itp-applications-applicationid-settings-1)
        *   [Obtain .get](https://developers.celcoin.com.br/reference/get_baas-v1-open-itp-applications-applicationid-settings-1)

    *   [Participants](https://developers.celcoin.com.br/reference/get_baas-v1-open-itp-participants-brands-1)
        *   [Lists the participating ITP holders.get](https://developers.celcoin.com.br/reference/get_baas-v1-open-itp-participants-brands-1)
        *   [Gets details of an ITP participating holder.get](https://developers.celcoin.com.br/reference/get_baas-v1-open-itp-participants-brands-brandid-1)

    *   [Sessão de jornadas](https://developers.celcoin.com.br/reference/post_baas-v1-open-itp-payments-journeys-sessions-1)
        *   [Criar uma sessão de jornada ITP post](https://developers.celcoin.com.br/reference/post_baas-v1-open-itp-payments-journeys-sessions-1)
        *   [Listar sessões de jornada get](https://developers.celcoin.com.br/reference/get_baas-v1-open-itp-payments-journeys-sessions-1)
        *   [Buscar dados de uma sessão de jornada get](https://developers.celcoin.com.br/reference/get_baas-v1-open-itp-payments-journeys-sessions-id-1)

    *   [Enrollment Journey Sessions](https://developers.celcoin.com.br/reference/post_baas-v1-open-itp-enrollments-journeys-sessions-1)
        *   [Creates an ITP journey session for enrollment.post](https://developers.celcoin.com.br/reference/post_baas-v1-open-itp-enrollments-journeys-sessions-1)
        *   [Lists journey enrollment sessions.get](https://developers.celcoin.com.br/reference/get_baas-v1-open-itp-enrollments-journeys-sessions-1)
        *   [Search for an enrollment journey session.get](https://developers.celcoin.com.br/reference/get_baas-v1-open-itp-enrollments-journeys-sessions-id-1)
        *   [Updates the journey enrollment session.patch](https://developers.celcoin.com.br/reference/patch_baas-v1-open-itp-enrollments-journeys-sessions-id-1)
        *   [Search for an enrollment journey session, using as reference the external ID sent in the creation of the session.get](https://developers.celcoin.com.br/reference/get_baas-v1-open-itp-enrollments-journeys-sessions-external-externalid)

    *   [Enrollment Payment Initiation](https://developers.celcoin.com.br/reference/post_baas-v1-open-itp-enrollments-payment-initiation-1)
        *   [Creates an enrollment payment initiation.post](https://developers.celcoin.com.br/reference/post_baas-v1-open-itp-enrollments-payment-initiation-1)
        *   [Lists enrollment payment initiations.get](https://developers.celcoin.com.br/reference/get_baas-v1-open-itp-enrollments-payment-initiation-1)
        *   [Gets an enrollment payment initiation.get](https://developers.celcoin.com.br/reference/get_baas-v1-open-itp-payment-initiation-itp-payment-id-1)
        *   [Updates an enrollment payment initiation.patch](https://developers.celcoin.com.br/reference/patch_baas-v1-open-itp-payment-initiation-itp-payment-id-1)
        *   [Gets enrollment FIDO registration options.post](https://developers.celcoin.com.br/reference/post_baas-v1-open-itp-enrollments-payment-initiation-itp-enrollment-id-fido-registration-options-1)
        *   [Completes enrollment FIDO registration.post](https://developers.celcoin.com.br/reference/post_baas-v1-open-itp-payment-initiation-id-fido-registration-1)
        *   [Gets enrollment FIDO sign options.post](https://developers.celcoin.com.br/reference/post_baas-v1-open-itp-payment-initiation-itp-enrollment-id-fido-sign-options-1)
        *   [Authorizes enrollment consent.post](https://developers.celcoin.com.br/reference/post_baas-v1-open-itp-payment-initiation-itp-enrollment-id-authorise-1)

    *   [Payment Initiation](https://developers.celcoin.com.br/reference/post_baas-v1-open-itp-payment-initiation-1)
        *   [Payment Processing.post](https://developers.celcoin.com.br/reference/post_baas-v1-open-itp-payment-initiation-1)
        *   [Payment Processing.get](https://developers.celcoin.com.br/reference/get_baas-v1-open-itp-payment-initiation-1)

    *   [Payment Initiation Management Session](https://developers.celcoin.com.br/reference/post_baas-v1-open-itp-payment-initiation-management-session-1)
        *   [Create end user management session with url.post](https://developers.celcoin.com.br/reference/post_baas-v1-open-itp-payment-initiation-management-session-1)
        *   [Get end user management session data.get](https://developers.celcoin.com.br/reference/get_baas-v1-open-itp-payment-initiation-management-session-1)

*   [MED 2.0](https://developers.celcoin.com.br/reference/med-20-1)
    *   [Criar recuperação de valores post](https://developers.celcoin.com.br/reference/criar-recupera%C3%A7%C3%A3o-de-valores-1)
    *   [Consulta recuperação de valores get](https://developers.celcoin.com.br/reference/consulta-recupera%C3%A7%C3%A3o-de-valores-1)
    *   [Cancelar recuperação de valores post](https://developers.celcoin.com.br/reference/cancelar-recupera%C3%A7%C3%A3o-de-valores-1)
    *   [Fechar solicitação de recuperação de valores post](https://developers.celcoin.com.br/reference/fechar-solicita%C3%A7%C3%A3o-de-recupera%C3%A7%C3%A3o-de-valores)

## Sub-acquiring

*   [Credenciamento](https://developers.celcoin.com.br/reference/get_baas-v1-cash-accreditation)
    *   [Consultar credenciamento de subconta get](https://developers.celcoin.com.br/reference/get_baas-v1-cash-accreditation)
    *   [Credenciar Conta Baas na Sub Celcoin post](https://developers.celcoin.com.br/reference/post_baas-v1-cash-accreditation-mainaccount-account)

*   [Clients](https://developers.celcoin.com.br/reference/get_baas-v1-cash-customers)
    *   [Listar clientes get](https://developers.celcoin.com.br/reference/get_baas-v1-cash-customers)
    *   [Criar cliente post](https://developers.celcoin.com.br/reference/post_baas-v1-cash-customers)
    *   [Editar cliente put](https://developers.celcoin.com.br/reference/put_baas-v1-cash-customers-customerid-typeid)
    *   [Excluir cliente del](https://developers.celcoin.com.br/reference/delete_baas-v1-cash-customers-customerid-typeid)

*   [Cards](https://developers.celcoin.com.br/reference/get_baas-v1-cash-cards)
    *   [Listar cartão get](https://developers.celcoin.com.br/reference/get_baas-v1-cash-cards)
    *   [Criar cartão post](https://developers.celcoin.com.br/reference/post_baas-v1-cash-cards-customerid-typeid)
    *   [Inativar Cartão del](https://developers.celcoin.com.br/reference/delete_baas-v1-cash-cards-customerid-typeid)

*   [Individual Charges](https://developers.celcoin.com.br/reference/get_baas-v1-cash-charges)
    *   [List charges get](https://developers.celcoin.com.br/reference/get_baas-v1-cash-charges)
    *   [Create charge post](https://developers.celcoin.com.br/reference/post_baas-v1-cash-charges)
    *   [Editar cobrança put](https://developers.celcoin.com.br/reference/put_baas-v1-cash-charges-chargeid-typeid)
    *   [Cancelar cobrança del](https://developers.celcoin.com.br/reference/delete_baas-v1-cash-charges-chargeid-typeid)
    *   [Retentar cobrança put](https://developers.celcoin.com.br/reference/put_baas-v1-cash-charges-chargeid-typeid-retry)
    *   [Estornar cobrança put](https://developers.celcoin.com.br/reference/put_baas-v1-cash-charges-chargeid-typeid-reverse)
    *   [Capturar cobrança put](https://developers.celcoin.com.br/reference/put_baas-v1-cash-charges-chargeid-typeid-capture)

*   [Planos](https://developers.celcoin.com.br/reference/post_baas-v1-cash-plans)
    *   [Criar plano post](https://developers.celcoin.com.br/reference/post_baas-v1-cash-plans)
    *   [Listar planos get](https://developers.celcoin.com.br/reference/get_baas-v1-cash-plans)
    *   [Editar plano put](https://developers.celcoin.com.br/reference/put_baas-v1-cash-plans-planid-typeid)
    *   [Excluir plano del](https://developers.celcoin.com.br/reference/delete_baas-v1-cash-plans-planid-typeid)

*   [Assinaturas](https://developers.celcoin.com.br/reference/get_baas-v1-cash-subscriptions)
    *   [Listar assinaturas get](https://developers.celcoin.com.br/reference/get_baas-v1-cash-subscriptions)
    *   [Criar Assinatura com ou sem plano post](https://developers.celcoin.com.br/reference/post_baas-v1-cash-subscriptions)
    *   [Criar Assinatura Manual post](https://developers.celcoin.com.br/reference/post_baas-v1-cash-subscriptions-manual)
    *   [Editar informações ou pagamento da assinatura put](https://developers.celcoin.com.br/reference/put_baas-v1-cash-subscriptions-manual-subscriptionid-typeid)
    *   [Capturar transação put](https://developers.celcoin.com.br/reference/put_baas-v1-cash-subscriptions-manual-transactionid-typeid-capture)
    *   [Adicionar transação post](https://developers.celcoin.com.br/reference/post_baas-v1-cash-transactions-subscriptionid-typeid-add)
    *   [Editar transação put](https://developers.celcoin.com.br/reference/put_baas-v1-cash-transactions-transactionid-typeid)
    *   [Cancelar uma transação del](https://developers.celcoin.com.br/reference/delete_baas-v1-cash-transactions-transactionid-typeid)
    *   [Retentar cobrança no cartão put](https://developers.celcoin.com.br/reference/put_baas-v1-cash-transactions-transactionid-typeid-retry)
    *   [Estornar cobrança no cartão put](https://developers.celcoin.com.br/reference/put_baas-v1-cash-transactions-transactionid-typeid-reverse)
    *   [Capturar Cobrança put](https://developers.celcoin.com.br/reference/put_baas-v1-cash-transactions-transactionid-typeid-capture)
    *   [Cancelar Assinatura del](https://developers.celcoin.com.br/reference/delete_baas-v1-cash-subscriptions-subscriptionid-typeid)

*   [Disputas e Chargebacks](https://developers.celcoin.com.br/reference/get_baas-v1-cash-chargebacks)
    *   [Listar chargebacks get](https://developers.celcoin.com.br/reference/get_baas-v1-cash-chargebacks)
    *   [Enviar documentação put](https://developers.celcoin.com.br/reference/put_baas-v1-cash-chargebacks-chargebackid)
    *   [Desistir de disputa put](https://developers.celcoin.com.br/reference/put_baas-v1-cash-chargebacks-lose-chargebackid)

*   [Webhooks](https://developers.celcoin.com.br/reference/put_baas-v1-cash-webhooks)
    *   [Register Webhook put](https://developers.celcoin.com.br/reference/put_baas-v1-cash-webhooks)

*   [Webhook Management](https://developers.celcoin.com.br/reference/cadastrar-webhook)
    *   [Register Webhook post](https://developers.celcoin.com.br/reference/cadastrar-webhook)
    *   [Check registered Webhooks get](https://developers.celcoin.com.br/reference/consultar-webhooks-cadastrados)
    *   [Edit registered Webhook put](https://developers.celcoin.com.br/reference/editar-webhook-cadastrado)
    *   [Delete registered Webhook del](https://developers.celcoin.com.br/reference/excluir-webhook-cadastrado)
    *   [View list of events sent by webhook get](https://developers.celcoin.com.br/reference/consultar-lista-de-eventos-enviados-pelo-webhook)
    *   [Consult Webhooks Templates get](https://developers.celcoin.com.br/reference/consultar-templates-de-webhooks)
    *   [Check the number of webhooks sent.get](https://developers.celcoin.com.br/reference/consultar-quantidade-de-webhooks-enviados)
    *   [View details of sent webhooks.get](https://developers.celcoin.com.br/reference/consultar-detalhes-dos-webhooks-enviados)
    *   [Resending pending webhooks put](https://developers.celcoin.com.br/reference/reenvio-de-webhooks-pendentes)

*   [Transações](https://developers.celcoin.com.br/reference/get_baas-v1-cash-transactions)
    *   [Listar transações get](https://developers.celcoin.com.br/reference/get_baas-v1-cash-transactions)

*   [Fees](https://developers.celcoin.com.br/reference/get_baas-v1-cash-company-fees)
    *   [Listar taxas get](https://developers.celcoin.com.br/reference/get_baas-v1-cash-company-fees)

## EMBEDDED PAYMENT

*   [Auxiliary APIs](https://developers.celcoin.com.br/reference/retorna-as-informa%C3%A7%C3%B5es-do-seu-saldo-atual)
    *   [Return your current balance information get](https://developers.celcoin.com.br/reference/retorna-as-informa%C3%A7%C3%B5es-do-seu-saldo-atual)
    *   [Retrieve details of a transaction get](https://developers.celcoin.com.br/reference/recupere-detalhes-de-uma-transa%C3%A7%C3%A3o)
    *   [Obtain proof of a transaction get](https://developers.celcoin.com.br/reference/obter-um-comprovante-de-uma-transa%C3%A7%C3%A3o)
    *   [List agreements get](https://developers.celcoin.com.br/reference/obtenha-a-lista-de-conv%C3%AAnios)
    *   [Returns the health of a given transaction type get](https://developers.celcoin.com.br/reference/retorna-a-sa%C3%BAde-de-um-determinado-tipo-de-transa%C3%A7%C3%A3o)
    *   [List banks get](https://developers.celcoin.com.br/reference/gere-a-lista-de-bancos)
    *   [List pending transactions get](https://developers.celcoin.com.br/reference/lista-de-transa%C3%A7%C3%B5es-pendentes)

*   [Extract APIs](https://developers.celcoin.com.br/reference/consultar-extrato-consolidado)
    *   [Consult consolidated statement get](https://developers.celcoin.com.br/reference/consultar-extrato-consolidado)

*   [Conciliation Files](https://developers.celcoin.com.br/reference/buscar-tipos-de-arquivos)
    *   [Search for file types get](https://developers.celcoin.com.br/reference/buscar-tipos-de-arquivos)
    *   [Extract file get](https://developers.celcoin.com.br/reference/extrair-arquivo)
    *   [Consolidated extract get](https://developers.celcoin.com.br/reference/extrato-consolidado)

*   [Direct Debit](https://developers.celcoin.com.br/reference/webhook-2)
    *   [Webhooks](https://developers.celcoin.com.br/reference/configurar-webhooks)
        *   [Configure webhooks post](https://developers.celcoin.com.br/reference/configurar-webhooks)
        *   [Query webhooks get](https://developers.celcoin.com.br/reference/consultar-webhooks)

    *   [Users](https://developers.celcoin.com.br/reference/cadastrar-usu%C3%A1rio)
        *   [Register user post](https://developers.celcoin.com.br/reference/cadastrar-usu%C3%A1rio)
        *   [Delete user del](https://developers.celcoin.com.br/reference/excluir-usu%C3%A1rio)

    *   [Tickets (Sandbox only)](https://developers.celcoin.com.br/reference/gerar-boleto)
        *   [Generate ticket post](https://developers.celcoin.com.br/reference/gerar-boleto)

*   [Vehicle Debts](https://developers.celcoin.com.br/reference/consultas)
    *   [Consultation](https://developers.celcoin.com.br/reference/criar-pedido-ass%C3%ADncrono-de-uma-de-d%C3%A9bito-veiculares)
        *   [Check vehicle debts post](https://developers.celcoin.com.br/reference/criar-pedido-ass%C3%ADncrono-de-uma-de-d%C3%A9bito-veiculares)

    *   [Plate Enrichment](https://developers.celcoin.com.br/reference/consultar-dados-enriquecidos-de-um-veiculo)
        *   [Query Enriched Vehicle Data post](https://developers.celcoin.com.br/reference/consultar-dados-enriquecidos-de-um-veiculo)

    *   [Payment](https://developers.celcoin.com.br/reference/cria-um-pedido-de-pagamento-ass%C3%ADncrono-para-uma-lista-de-d%C3%A9bitos)
        *   [Make payment post](https://developers.celcoin.com.br/reference/cria-um-pedido-de-pagamento-ass%C3%ADncrono-para-uma-lista-de-d%C3%A9bitos)

    *   [Webhook](https://developers.celcoin.com.br/reference/registra-uma-url-para-recebimento-de-notifica%C3%A7%C3%B5es-via-webhook)
        *   [Register URL to receive notifications via Webhook post](https://developers.celcoin.com.br/reference/registra-uma-url-para-recebimento-de-notifica%C3%A7%C3%B5es-via-webhook)
        *   [Register Webhook With Token - JWT post](https://developers.celcoin.com.br/reference/registrar-webhook-com-token-jwt)
        *   [Return registered URL for receiving notifications via Webhook get](https://developers.celcoin.com.br/reference/retorna-a-url-registrada-para-recebimento-de-notifica%C3%A7%C3%B5es-via-webhook)

*   [Issuing of Bills](https://developers.celcoin.com.br/reference/gestao-carteira)
    *   [Gestão de Carteiras](https://developers.celcoin.com.br/reference/inclusao-carteira)
        *   [Portfolio Inclusion post](https://developers.celcoin.com.br/reference/inclusao-carteira)
        *   [Consulta de Carteira por código/ID get](https://developers.celcoin.com.br/reference/consulta-carteira-id)
        *   [Alteração de Carteira patch](https://developers.celcoin.com.br/reference/alteracao-carteira)
        *   [Exclusão de carteira del](https://developers.celcoin.com.br/reference/exclusao-carteira)
        *   [Consulta de todas as Carteiras get](https://developers.celcoin.com.br/reference/consulta-todas-carteiras)

    *   [Gestão de Beneficiários](https://developers.celcoin.com.br/reference/inclusao-beneficiario)
        *   [Inclusão de Beneficiário post](https://developers.celcoin.com.br/reference/inclusao-beneficiario)
        *   [Consulta de Beneficiário get](https://developers.celcoin.com.br/reference/consulta-beneficiario)

    *   [Gestão de Boletos](https://developers.celcoin.com.br/reference/emissao-boleto)
        *   [Issuing a Ticket post](https://developers.celcoin.com.br/reference/emissao-boleto)
        *   [Consulta de boletos com paginação get](https://developers.celcoin.com.br/reference/consulta-boleto-paginacao)
        *   [Consulta de boleto por Id get](https://developers.celcoin.com.br/reference/consulta-boleto-id)

    *   [Gestão de Baixas](https://developers.celcoin.com.br/reference/inclusao-baixa)
        *   [Inclusão de Baixa (Cancelamento)post](https://developers.celcoin.com.br/reference/inclusao-baixa)
        *   [Consulta de Baixa get](https://developers.celcoin.com.br/reference/consulta-baixa)

*   [Bill payment](https://developers.celcoin.com.br/reference/pagamento-de-contas-2)
    *   [Consult account data post](https://developers.celcoin.com.br/reference/pagamento-de-contas-2)
    *   [Reserve a balance to pay a bill post](https://developers.celcoin.com.br/reference/efetuar-um-pagamento)
    *   [Confirm payment of an account put](https://developers.celcoin.com.br/reference/confirmar-o-pagamento-de-uma-conta)
    *   [Querying the status of a transaction get](https://developers.celcoin.com.br/reference/consultar-informa%C3%A7%C3%B5es-de-um-pagamento)
    *   [Check payment occurrences get](https://developers.celcoin.com.br/reference/consulta-lista-de-ocorr%C3%AAncias)
    *   [Cancel a reservation made del](https://developers.celcoin.com.br/reference/cancela-a-transa%C3%A7%C3%A3o-de-pagamento-de-contas-efetuada)
    *   [Reverse a completed bill payment transaction del](https://developers.celcoin.com.br/reference/estornar-uma-transa%C3%A7%C3%A3o-de-pagamento-de-contas-efetuada)
    *   [Pagamentos - Obter comprovante de uma transação get](https://developers.celcoin.com.br/reference/obter-um-comprovante-de-uma-transa%C3%A7%C3%A3o-1-1)

*   [Automatic Pix](https://developers.celcoin.com.br/reference/jornada-pagadora-copy-2)
    *   [Paying Journey](https://developers.celcoin.com.br/reference/aceita-uma-recorr%C3%AAncia-2)
        *   [Accept a recurrence post](https://developers.celcoin.com.br/reference/aceita-uma-recorr%C3%AAncia-2)
        *   [Accept a recurrence patch](https://developers.celcoin.com.br/reference/aceita-uma-recorr%C3%AAncia-3)
        *   [Refuse a recurrence patch](https://developers.celcoin.com.br/reference/recusa-uma-recorr%C3%AAncia-1)
        *   [Search for recurrences by status with pagination get](https://developers.celcoin.com.br/reference/busca-recorr%C3%AAncias-por-status-com-pagina%C3%A7%C3%A3o-1)
        *   [Search for a recurrence by ID get](https://developers.celcoin.com.br/reference/busca-uma-recorr%C3%AAncia-pelo-id-1)
        *   [Cancellation of Authorization post](https://developers.celcoin.com.br/reference/cancelamento-de-autoriza%C3%A7%C3%A3o-1)
        *   [Appointment cancellation get](https://developers.celcoin.com.br/reference/cancelamento-de-agendamento-1)

    *   [Receiving Journey](https://developers.celcoin.com.br/reference/crie-uma-recorr%C3%AAncia-com-a-jornada-1-1)
        *   [Create a recurrence with journey 1 post](https://developers.celcoin.com.br/reference/crie-uma-recorr%C3%AAncia-com-a-jornada-1-1)
        *   [Create a recurrence with journey 2 post](https://developers.celcoin.com.br/reference/crie-uma-recorr%C3%AAncia-com-a-jornada-2-1)

*   [Pix-in](https://developers.celcoin.com.br/reference/cobranca-dinamica-dynamic)
    *   [Dynamic billing](https://developers.celcoin.com.br/reference/criar-um-qrcode-dinamico-dynamic)
        *   [Create a dynamic QR Code post](https://developers.celcoin.com.br/reference/criar-um-qrcode-dinamico-dynamic)
        *   [Fetching data from a dynamic charge get](https://developers.celcoin.com.br/reference/buscar-dados-de-uma-cobranca-dinamica-dynamic)
        *   [Update Dynamic QR Code put](https://developers.celcoin.com.br/reference/atualizar-um-qrcode-dinamico)
        *   [Retrieves a base64 image representing a dynamic QR Code get](https://developers.celcoin.com.br/reference/recupera-imagem-de-um-qrcode-dinamico)
        *   [Loads, validates and parses the json payload from the URL post](https://developers.celcoin.com.br/reference/carrega-valida-e-parseia-o-json-do-payload-da-url)
        *   [Delete a dynamic QR Code del](https://developers.celcoin.com.br/reference/deletar-um-qrcode-dinamico)

    *   [Static charging](https://developers.celcoin.com.br/reference/criar-um-qrcode-estatico)
        *   [Create a static QR Code post](https://developers.celcoin.com.br/reference/criar-um-qrcode-estatico)
        *   [Return data from a static QR Code.get](https://developers.celcoin.com.br/reference/retorna-os-dados-de-um-qrcode-estatico)
        *   [Retrieves a base64 image representing a static QR Code get](https://developers.celcoin.com.br/reference/recupera-imagem-de-um-qrcode-estatico)
        *   [Return static QR Code data and payments received get](https://developers.celcoin.com.br/reference/consultar-dados-do-qrcode-estatico-e-pagamentos-recebidos)
        *   [Delete a static QR code del](https://developers.celcoin.com.br/reference/deleta-um-qr-code-est%C3%A1tico)

    *   [QR Code (Location)](https://developers.celcoin.com.br/reference/criar-um-qrcode-location)
        *   [Create a QR Code (location)post](https://developers.celcoin.com.br/reference/criar-um-qrcode-location)
        *   [Returns data from a QR Code location get](https://developers.celcoin.com.br/reference/retorna-dados-de-um-qrcode-location)
        *   [Retrieves a base64 image representing a dynamic QR Code Location get](https://developers.celcoin.com.br/reference/recupera-imagem-de-um-qrcode-location-dinamico)

    *   [Immediate collection (COB)](https://developers.celcoin.com.br/reference/criar-uma-cobranca-imediata)
        *   [Create new immediate charge post](https://developers.celcoin.com.br/reference/criar-uma-cobranca-imediata)
        *   [Update data for an immediate charge put](https://developers.celcoin.com.br/reference/atualizar-dados-de-uma-cobranca-imediata)
        *   [Search for data from an immediate charge get](https://developers.celcoin.com.br/reference/buscar-dados-de-uma-cobranca-imediata-v2)
        *   [Unlink immediate billing from a BRCode Location patch](https://developers.celcoin.com.br/reference/desvincular-cobranca-imediata-e-qrcode-location)
        *   [Loads, validates and parses the json payload of an Immediate Charge (COB)get](https://developers.celcoin.com.br/reference/carrega-valida-e-analisa-uma-cobranca-imediata-cob)
        *   [Delete an immediate charge del](https://developers.celcoin.com.br/reference/deletar-uma-cobranca-imediata)

    *   [Collection with due date (COBV)](https://developers.celcoin.com.br/reference/criar-cobranca-com-vencimento-cobv)
        *   [Create a billing with due date post](https://developers.celcoin.com.br/reference/criar-cobranca-com-vencimento-cobv)
        *   [Update data for a due billing put](https://developers.celcoin.com.br/reference/atualizar-dados-de-uma-cobranca-com-vencimento-cobv)
        *   [Search for data on a due date charge get](https://developers.celcoin.com.br/reference/buscar-uma-cobranca-com-vencimento-v2)
        *   [Unlink due date charge from a QR Code location patch](https://developers.celcoin.com.br/reference/desvincular-cobranca-com-vencimento-e-qrcode-location)
        *   [Loads, validates and parses the JSON payload of a Due Payment (COBV)get](https://developers.celcoin.com.br/reference/carrega-valida-e-analisa-uma-cobranca-com-vencimento-cobv)
        *   [Delete an overdue charge del](https://developers.celcoin.com.br/reference/deletar-uma-cobranca-com-vencimento-cobv)

    *   [Pix Receipts](https://developers.celcoin.com.br/reference/consulta-o-status-de-um-recebimento-pix)
        *   [Check the status of a Pix Receipt get](https://developers.celcoin.com.br/reference/consulta-o-status-de-um-recebimento-pix)
        *   [Check the status of a Pix Receipt - Enhanced Version (V2)get](https://developers.celcoin.com.br/reference/consulta-o-status-de-um-recebimento-pix-v2)

    *   [Cash-in return](https://developers.celcoin.com.br/reference/devolver-um-pagamento-pix-recebido)
        *   [Criar uma devolução de um recebimento Pix via TransactionId post](https://developers.celcoin.com.br/reference/devolver-um-pagamento-pix-recebido)
        *   [Check the status of a Pix receipt return created get](https://developers.celcoin.com.br/reference/consulta-status-de-devolucao)

*   [Pix-out](https://developers.celcoin.com.br/reference/dict-diret%C3%B3rio-de-identificadores-de-contas-transacionais-1)
    *   [DICT (Directory of Transactional Account Identifiers)](https://developers.celcoin.com.br/reference/consulta-dados-bancarios-de-uma-chave-pix)
        *   [Return information from the DICT using a key registered in Pix post](https://developers.celcoin.com.br/reference/consulta-dados-bancarios-de-uma-chave-pix)
        *   [Perform key or person statistics search get](https://developers.celcoin.com.br/reference/realizar-busca-das-estat%C3%ADsticas-de-chave-ou-de-pessoa)

    *   [Participant](https://developers.celcoin.com.br/reference/consulta-participante-do-pix)
        *   [List Pix participants get](https://developers.celcoin.com.br/reference/consulta-participante-do-pix)

    *   [Payment with Pix](https://developers.celcoin.com.br/reference/iniciar-pagamento-ou-transferencia-pix)
        *   [Start Pix payment post](https://developers.celcoin.com.br/reference/iniciar-pagamento-ou-transferencia-pix)
        *   [Check the status of a Pix payment get](https://developers.celcoin.com.br/reference/verificar-o-status-de-um-pagamento-pix)
        *   [Check the status of a Pix payment - Enhanced Version (V2)get](https://developers.celcoin.com.br/reference/verificar-o-status-de-um-pagamento-pix-v2)
        *   [Return information from a QRCode via EMV post](https://developers.celcoin.com.br/reference/retornar-informa%C3%A7%C3%B5es-do-qr-code-a-partir-de-um-emv-full)

    *   [Cash-out refund](https://developers.celcoin.com.br/reference/consulta-o-status-de-uma-devolu%C3%A7%C3%A3o-de-pagamento-pix)
        *   [Check a received Pix payment refund get](https://developers.celcoin.com.br/reference/consulta-o-status-de-uma-devolu%C3%A7%C3%A3o-de-pagamento-pix)

    *   [ITP (Payment Transaction Initiation)](https://developers.celcoin.com.br/reference/criar-um-pix-itp)
        *   [Creating a Pix ITP post](https://developers.celcoin.com.br/reference/criar-um-pix-itp)
        *   [Create a Pix ITP Setup post](https://developers.celcoin.com.br/reference/criar-setup-de-um-pix-itp)
        *   [Edit a Pix ITP Setup put](https://developers.celcoin.com.br/reference/editar-setup-de-um-pix-itp)

*   [Top-ups](https://developers.celcoin.com.br/reference/retorna-a-lista-de-operadoras)
    *   [List operators get](https://developers.celcoin.com.br/reference/retorna-a-lista-de-operadoras)
    *   [Check operating values for an operator or provider get](https://developers.celcoin.com.br/reference/consulta-valores-operacionais)
    *   [Reserve balance to top up post](https://developers.celcoin.com.br/reference/reserva-saldo-para-realizar-recarga)
    *   [Confirm a top-up transaction put](https://developers.celcoin.com.br/reference/confirma-uma-recarga)
    *   [Check information about a recharge get](https://developers.celcoin.com.br/reference/consultar-informa%C3%A7%C3%B5es-de-uma-recarga)
    *   [Cancel a completed recharge transaction del](https://developers.celcoin.com.br/reference/cancela-uma-transa%C3%A7%C3%A3o-de-recarga-efetuada)
    *   [Search for a carrier from a phone number get](https://developers.celcoin.com.br/reference/buscar-operadora-a-partir-de-um-n%C3%BAmero-de-telefone)
    *   [Recargas - Obter comprovante de uma transação get](https://developers.celcoin.com.br/reference/obter-um-comprovante-de-uma-transa%C3%A7%C3%A3o-1)

*   [Physical withdrawals and deposits](https://developers.celcoin.com.br/reference/retorna-lista-de-parceiros)
    *   [Return Partner List get](https://developers.celcoin.com.br/reference/retorna-lista-de-parceiros)
    *   [Check nearby service points post](https://developers.celcoin.com.br/reference/consulta-pontos-de-atendimentos-pr%C3%B3ximos)
    *   [Make a deposit at a 24-hour ATM post](https://developers.celcoin.com.br/reference/efetua-um-deposito-eletr%C3%B4nico)
    *   [Make electronic withdrawal with Qrcode post](https://developers.celcoin.com.br/reference/efetua-um-saque-eletr%C3%B4nico)
    *   [Generate token for withdrawal at 24h ATM post](https://developers.celcoin.com.br/reference/efetua-um-saque-eletr%C3%B4nico-com-token)
    *   [Cancel a token for withdrawal at the 24h ATM del](https://developers.celcoin.com.br/reference/cancela-um-token-para-saque-no-caixa-24h)

*   [TED](https://developers.celcoin.com.br/reference/efetuar-uma-transfer%C3%AAncia-banc%C3%A1ria)
    *   [Conduct TED post](https://developers.celcoin.com.br/reference/efetuar-uma-transfer%C3%AAncia-banc%C3%A1ria)
    *   [Checking the status of a TED get](https://developers.celcoin.com.br/reference/consulta-o-status-de-uma-transfer%C3%AAncia)

*   [Webhooks Registration](https://developers.celcoin.com.br/reference/cadastro-de-webhooks)

## CEL_BRICKS WEBHOOKS

*   [Webhook Manager](https://developers.celcoin.com.br/reference/cadastrar-webhook-common)
    *   [Register Webhook post](https://developers.celcoin.com.br/reference/cadastrar-webhook-common)
    *   [Resending pending webhooks put](https://developers.celcoin.com.br/reference/reenvio-de-webhooks-pendentes-common)
    *   [View details of sent webhooks.get](https://developers.celcoin.com.br/reference/consultar-detalhes-dos-webhooks-enviados-common)
    *   [Check the number of webhooks sent.get](https://developers.celcoin.com.br/reference/consultar-quantidade-de-webhooks-enviados-common)
    *   [Delete registered Webhook.del](https://developers.celcoin.com.br/reference/excluir-webhook-cadastrado-common)
    *   [Edit registered Webhook.put](https://developers.celcoin.com.br/reference/editar-webhook-cadastrado-common)
    *   [Consult registered Webhooks.get](https://developers.celcoin.com.br/reference/consultar-webhooks-cadastrados-common)

## Pix Indirect Participant

*   [Automatic Pix](https://developers.celcoin.com.br/reference/jornada-pagadora-copy-1)
    *   [Paying Journey](https://developers.celcoin.com.br/reference/busca-uma-recorr%C3%AAncia-pelo-id)
        *   [Search for a recurrence by ID get](https://developers.celcoin.com.br/reference/busca-uma-recorr%C3%AAncia-pelo-id)
        *   [Cancellation of Authorization post](https://developers.celcoin.com.br/reference/cancelamento-de-autoriza%C3%A7%C3%A3o)
        *   [Appointment cancellation post](https://developers.celcoin.com.br/reference/cancelamento-de-agendamento)
        *   [Aceita recorrência para jornadas 2 e 4 post](https://developers.celcoin.com.br/reference/aceita-recorr%C3%AAncia-para-jornadas-2-e-4)
        *   [Aceita recorrência jornada tipo 1 patch](https://developers.celcoin.com.br/reference/aceita-recorr%C3%AAncia-jornada-tipo-1)
        *   [Recusa uma recorrência jornada tipo 1 patch](https://developers.celcoin.com.br/reference/recusa-uma-recorr%C3%AAncia-jornada-tipo-1)

    *   [Receiving Journey](https://developers.celcoin.com.br/reference/crie-uma-recorr%C3%AAncia-com-a-jornada-1)
        *   [Create a recurrence with journey 1 post](https://developers.celcoin.com.br/reference/crie-uma-recorr%C3%AAncia-com-a-jornada-1)
        *   [Create a recurrence with journey 2 post](https://developers.celcoin.com.br/reference/crie-uma-recorr%C3%AAncia-com-a-jornada-2)

*   [Receiving with Pix](https://developers.celcoin.com.br/reference/consulta-o-status-de-um-recebimento-pix-indireto)
    *   [Check the status of a Pix Receipt get](https://developers.celcoin.com.br/reference/consulta-o-status-de-um-recebimento-pix-indireto)
    *   [Check the status of a Pix Receipt - Enhanced Version (V2)get](https://developers.celcoin.com.br/reference/consulta-o-status-de-um-recebimento-pix-vers%C3%A3o-enriquecida-v2-indireto)

*   [Payment with Pix](https://developers.celcoin.com.br/reference/gerar-endtoendid-para-iniciar-um-pagamento-indireto)
    *   [Generate endToEndId to initiate a payment post](https://developers.celcoin.com.br/reference/gerar-endtoendid-para-iniciar-um-pagamento-indireto)
    *   [Start Pix payment post](https://developers.celcoin.com.br/reference/iniciar-pagamento-pix-indireto)
    *   [Check the status of a Pix payment get](https://developers.celcoin.com.br/reference/verificar-o-status-de-um-pagamento-pix-indireto)
    *   [Check the status of a Pix payment - Enhanced Version (V2)get](https://developers.celcoin.com.br/reference/verificar-o-status-de-um-pagamento-pix-vers%C3%A3o-enriquecida-v2-indireto)
    *   [Return QR Code information from an EMV post](https://developers.celcoin.com.br/reference/retornar-informa%C3%A7%C3%B5es-do-qr-code-a-partir-de-um-emv-indireto)

*   [Return](https://developers.celcoin.com.br/reference/criar-devolu%C3%A7%C3%A3o-estorno-de-um-pix-recebido-copy)
    *   [Create a refund (refund) for a Pix received post](https://developers.celcoin.com.br/reference/criar-devolu%C3%A7%C3%A3o-estorno-de-um-pix-recebido-copy)
    *   [Criar devolução via endToEndId post](https://developers.celcoin.com.br/reference/criar-devolu%C3%A7%C3%A3o-via-e2e)
    *   [Check the status of a Pix return get](https://developers.celcoin.com.br/reference/consulta-o-status-de-uma-devolu%C3%A7%C3%A3o-pix-copy-1)
    *   [Check the status of a Return receipt get](https://developers.celcoin.com.br/reference/consulta-o-status-do-recebimento-de-uma-devolu%C3%A7%C3%A3o-copy)

*   [DICT (Directory of Transactional Account Identifiers)](https://developers.celcoin.com.br/reference/cadastro-consulta-e-dele%C3%A7%C3%A3o-de-chaves)
    *   [Registration, Consultation and Deletion of keys](https://developers.celcoin.com.br/reference/cadastrar-uma-chave-pix-indireto)
        *   [Register a new Pix key post](https://developers.celcoin.com.br/reference/cadastrar-uma-chave-pix-indireto)
        *   [Change a Pix key put](https://developers.celcoin.com.br/reference/alterar-uma-chave-pix-indireto)
        *   [Return information from the DICT using a key registered in Pix post](https://developers.celcoin.com.br/reference/retornar-informacoes-do-dict-utilizando-uma-chave-cadastrada-pix-indireto)
        *   [Checks for the existence of keys in the DICT post](https://developers.celcoin.com.br/reference/verifica-a-existencia-de-chaves-no-dict-indireto)
        *   [Delete a Pix key del](https://developers.celcoin.com.br/reference/deletar-uma-chave-pix-indireto)
        *   [Perform key or person statistics search get](https://developers.celcoin.com.br/reference/realizar-busca-das-estat%C3%ADsticas-de-chave-ou-de-pessoa-copy)
        *   [Listar todas as chaves pix de um cliente post](https://developers.celcoin.com.br/reference/listar-todas-as-chaves-pix-de-um-cliente)

    *   [Portability and Claim](https://developers.celcoin.com.br/reference/cadastrar-nova-portabilidade-reivindicacao-dict-indireto)
        *   [Register new portability or DICT claim post](https://developers.celcoin.com.br/reference/cadastrar-nova-portabilidade-reivindicacao-dict-indireto)
        *   [Complete the DICT key portability/claim request post](https://developers.celcoin.com.br/reference/completa-nova-portabilidade-ou-reivindica%C3%A7%C3%A3o-dict-indireto)
        *   [Cancels a Claim in the process of being resolved or confirmed due to expiration post](https://developers.celcoin.com.br/reference/cancela-solicita%C3%A7%C3%A3o-portabilidade-reivindicacao-chave-dict-indireto)
        *   [Confirms a Claim in the process of resolution post](https://developers.celcoin.com.br/reference/confirma-claim-processo-resolucao-indireto)
        *   [Query an existing claim get](https://developers.celcoin.com.br/reference/consulta-claim-existente-indireto)
        *   [List of portabilities or claims with pagination get](https://developers.celcoin.com.br/reference/lista-reivindicacoes-indireto)

    *   [Infractions](https://developers.celcoin.com.br/reference/criar-um-relato-de-infra%C3%A7%C3%A3o-indireto)
        *   [Create a violation report for a transaction post](https://developers.celcoin.com.br/reference/criar-um-relato-de-infra%C3%A7%C3%A3o-indireto)
        *   [View a Violation report for a transaction get](https://developers.celcoin.com.br/reference/consultar-relato-infra%C3%A7%C3%A3o-indireto)
        *   [Cancel a violation report for a transaction post](https://developers.celcoin.com.br/reference/cancelar-um-relato-de-infra%C3%A7%C3%A3o-indireto)
        *   [Close a transaction violation report post](https://developers.celcoin.com.br/reference/fechar-um-relato-de-infra%C3%A7%C3%A3o-indireto)
        *   [List of infractions for Indirect participants get](https://developers.celcoin.com.br/reference/lista-infra%C3%A7%C3%B5es-para-participantes-indiretos)

    *   [Special Return Mechanism - MED](https://developers.celcoin.com.br/reference/criar-solicita%C3%A7%C3%A3o-de-devolu%C3%A7%C3%A3o-indireto)
        *   [Create return request post](https://developers.celcoin.com.br/reference/criar-solicita%C3%A7%C3%A3o-de-devolu%C3%A7%C3%A3o-indireto)
        *   [Query a return request get](https://developers.celcoin.com.br/reference/consultar-solicita%C3%A7%C3%A3o-de-devolu%C3%A7%C3%A3o-indireto)
        *   [Cancel return request post](https://developers.celcoin.com.br/reference/cancelar-solicita%C3%A7%C3%A3o-devolu%C3%A7%C3%A3o-indireto)
        *   [Close return request post](https://developers.celcoin.com.br/reference/fechar-solicita%C3%A7%C3%A3o-de-devolu%C3%A7%C3%A3o-indireto)
        *   [List of return requests get](https://developers.celcoin.com.br/reference/lista-solicita%C3%A7%C3%B5es-de-devolu%C3%A7%C3%A3o)

    *   [Marcação de fraude](https://developers.celcoin.com.br/reference/cancela-marca%C3%A7%C3%A3o-de-fraude)
        *   [Cancela marcação de fraude del](https://developers.celcoin.com.br/reference/cancela-marca%C3%A7%C3%A3o-de-fraude)
        *   [Cria marcação de fraude post](https://developers.celcoin.com.br/reference/cria-marca%C3%A7%C3%A3o-de-fraude)
        *   [Consulta detalhes da marcação de fraude get](https://developers.celcoin.com.br/reference/consulta-detalhes-da-marca%C3%A7%C3%A3o-de-fraude)

*   [QR Code](https://developers.celcoin.com.br/reference/criar-um-qr-code-location-copy)
    *   [Create a QR Code (location)post](https://developers.celcoin.com.br/reference/criar-um-qr-code-location-copy)
    *   [Returns data from a QR Code location get](https://developers.celcoin.com.br/reference/retorna-os-dados-de-um-qr-code-location-copy)
    *   [Delete a static QR code del](https://developers.celcoin.com.br/reference/deleta-um-qr-code-est%C3%A1tico-copy)
    *   [Retrieves a base64 image representing a dynamic QR Code Location get](https://developers.celcoin.com.br/reference/recupera-uma-imagem-base64-representando-um-qr-code-location-din%C3%A2mico-copy)

*   [Collection with due date (COBV)](https://developers.celcoin.com.br/reference/criar-cobran%C3%A7a-com-vencimento-copy)
    *   [Create a billing with due date post](https://developers.celcoin.com.br/reference/criar-cobran%C3%A7a-com-vencimento-copy)
    *   [Update data for a due billing put](https://developers.celcoin.com.br/reference/atualizar-dados-de-uma-cobran%C3%A7a-com-vencimento-copy)
    *   [Delete an overdue charge del](https://developers.celcoin.com.br/reference/deletar-uma-cobran%C3%A7a-com-vencimento-copy)
    *   [Search for data on a due date charge get](https://developers.celcoin.com.br/reference/buscar-dados-de-uma-cobran%C3%A7a-com-vencimento-copy)
    *   [Unlink due date charge from a QR Code location patch](https://developers.celcoin.com.br/reference/desvincular-cobran%C3%A7a-com-vencimento-de-um-qr-code-location-copy)
    *   [Loads, validates and parses the JSON payload of a Due Payment (COBV)get](https://developers.celcoin.com.br/reference/carrega-valida-e-analisa-a-carga-de-json-de-uma-cobran%C3%A7a-com-vencimento-cobv-copy)

*   [Immediate collection (COB)](https://developers.celcoin.com.br/reference/criar-nova-cobran%C3%A7a-imediata-copy)
    *   [Create new immediate charge post](https://developers.celcoin.com.br/reference/criar-nova-cobran%C3%A7a-imediata-copy)
    *   [Update data for an immediate charge put](https://developers.celcoin.com.br/reference/atualizar-dados-de-uma-cobran%C3%A7a-imediata-copy)
    *   [Delete an immediate charge del](https://developers.celcoin.com.br/reference/deletar-uma-cobran%C3%A7a-imediata-copy)
    *   [Search for data from an immediate charge get](https://developers.celcoin.com.br/reference/busca-de-dados-de-uma-cobran%C3%A7a-imediata-copy)
    *   [Unlink immediate billing from a BRCode Location patch](https://developers.celcoin.com.br/reference/desvincular-cobran%C3%A7a-imediata-de-um-brcode-location-copy)
    *   [Loads, validates and parses the json payload of an Immediate Charge (COB)get](https://developers.celcoin.com.br/reference/carrega-valida-e-analisa-a-carga-de-json-de-uma-cobran%C3%A7a-imediata-cob-copy)

*   [Dynamic billing](https://developers.celcoin.com.br/reference/criar-um-qr-code-din%C3%A2mico-copy)
    *   [Create a dynamic QR Code post](https://developers.celcoin.com.br/reference/criar-um-qr-code-din%C3%A2mico-copy)
    *   [Retrieves a base64 image representing a dynamic QR Code get](https://developers.celcoin.com.br/reference/recupera-uma-imagem-base64-representando-um-qr-code-din%C3%A2mico-copy)
    *   [Update Dynamic QR Code put](https://developers.celcoin.com.br/reference/atualizar-qr-code-din%C3%A2mico-copy)
    *   [Delete a dynamic QR Code del](https://developers.celcoin.com.br/reference/deletar-um-qr-code-din%C3%A2mico-copy)
    *   [Loads, validates and parses the json payload from the URL post](https://developers.celcoin.com.br/reference/carrega-valida-e-parseia-o-json-do-payload-da-url-copy)

*   [Static charging](https://developers.celcoin.com.br/reference/criar-um-qr-code-est%C3%A1tico-copy)
    *   [Create a static QR Code post](https://developers.celcoin.com.br/reference/criar-um-qr-code-est%C3%A1tico-copy)
    *   [Return data from a static QR Code.get](https://developers.celcoin.com.br/reference/retornar-dados-de-um-qr-code-est%C3%A1tico-copy)
    *   [Retrieves a base64 image representing a static QR Code get](https://developers.celcoin.com.br/reference/recupera-uma-imagem-base64-representando-um-qr-code-est%C3%A1tico-copy)
    *   [Return static QR Code data and payments received get](https://developers.celcoin.com.br/reference/retornar-dados-do-qr-code-est%C3%A1tico-e-os-pagamentos-recebidos-copy)

*   [Transferência](https://developers.celcoin.com.br/reference/transa%C3%A7%C3%B5es-fora-do-spi-reporte-bacen)
    *   [Transações fora do SPI - Reporte Bacen post](https://developers.celcoin.com.br/reference/transa%C3%A7%C3%B5es-fora-do-spi-reporte-bacen)

*   [MED 2.0](https://developers.celcoin.com.br/reference/med-20)
    *   [Criar recuperação de valores post](https://developers.celcoin.com.br/reference/criar-recupera%C3%A7%C3%A3o-de-valores)
    *   [Consulta recuperação de valores get](https://developers.celcoin.com.br/reference/consulta-recupera%C3%A7%C3%A3o-de-valores)
    *   [Cancelar recuperação de valores post](https://developers.celcoin.com.br/reference/cancelar-recupera%C3%A7%C3%A3o-de-valores)
    *   [Solicitar devolução de recuperação de valores post](https://developers.celcoin.com.br/reference/solicitar-devolu%C3%A7%C3%A3o-de-recupera%C3%A7%C3%A3o-de-valores)
    *   [Consulta grafo de recuperação de valores get](https://developers.celcoin.com.br/reference/consultar-grafo-de-recupera%C3%A7%C3%A3o-de-valores)
    *   [Atualiza recuperação de valores put](https://developers.celcoin.com.br/reference/atualiza-recupera%C3%A7%C3%A3o-de-valores)

## CEL_CARD

*   [Faturas](https://developers.celcoin.com.br/reference/1186cec39b0cbe483a2aa78bc8980b81)
    *   [Busca as transações de uma fatura.get](https://developers.celcoin.com.br/reference/1186cec39b0cbe483a2aa78bc8980b81)
    *   [Listar faturas da conta.get](https://developers.celcoin.com.br/reference/ef66a3140d227dfbaf44692c4a96c219)

*   [Relatório de Autorizações](https://developers.celcoin.com.br/reference/51011976cbae03e7a1a71d747cbba12a)
    *   [Obtem detalhes de autorizações get](https://developers.celcoin.com.br/reference/51011976cbae03e7a1a71d747cbba12a)

*   [Autorização de Transações](https://developers.celcoin.com.br/reference/72ecce9f06bda6d3887187966bff78a4)
    *   [Simulates a transaction post](https://developers.celcoin.com.br/reference/72ecce9f06bda6d3887187966bff78a4)
    *   [Executa um chargeback post](https://developers.celcoin.com.br/reference/a2e3a99c28775a68eca08d128f4a5a17)

*   [Card Management](https://developers.celcoin.com.br/reference/ebf2d0ba4cfd3139f4317acc3cb99892)
    *   [Search data from a card get](https://developers.celcoin.com.br/reference/ebf2d0ba4cfd3139f4317acc3cb99892)
    *   [Create credit/debit cards post](https://developers.celcoin.com.br/reference/74263a95ceb5c2ee1655eabbc42f71e0)
    *   [List of cards get](https://developers.celcoin.com.br/reference/2fb18694a140ed94cc4d6109798a50cb)
    *   [Updates Card data patch](https://developers.celcoin.com.br/reference/dba8b62a17eb693182f099effd290226)
    *   [Activate a card put](https://developers.celcoin.com.br/reference/cd2a46ad3a37d495eece564878c03a6a)
    *   [Block a card put](https://developers.celcoin.com.br/reference/5d8aafa0910cfacf334ebd4f2c6b3627)
    *   [Unlock a card put](https://developers.celcoin.com.br/reference/1b6d0c5c4ed4fab7761fe8deb979ee2f)
    *   [Cancel a card put](https://developers.celcoin.com.br/reference/c432ada072f80e15d477f4335330ebf5)
    *   [Reissue a card post](https://developers.celcoin.com.br/reference/6127f027ea23497fbfe58913b90ac164)
    *   [Change the card PIN patch](https://developers.celcoin.com.br/reference/d3dabf62fceb4450a1f1b3e41c121d26)
    *   [Search for the customer's current card password get](https://developers.celcoin.com.br/reference/558bd49f128fefadbba81552ac30ed0b)
    *   [Search for customer card information get](https://developers.celcoin.com.br/reference/1e28376240132d6a15935535a5f3cc08)
    *   [Resets wrong password attempts post](https://developers.celcoin.com.br/reference/0527b4d0bd0025950ee975428460fff4)
    *   [It resets the Application Transaction Counter (ATC)post](https://developers.celcoin.com.br/reference/43680f82bdeb483c021d7864e8d56299)

*   [Gestão de Clientes](https://developers.celcoin.com.br/reference/286c8dcd0570bfb72f12f2a2f08fbcec)
    *   [Lists all customers of a specific account.get](https://developers.celcoin.com.br/reference/286c8dcd0570bfb72f12f2a2f08fbcec)
    *   [Gets a customer from a specific account by Document.get](https://developers.celcoin.com.br/reference/b058221a30422c7366c1b6ca71c1091e)
    *   [Gets a customer from a specific account by ID.get](https://developers.celcoin.com.br/reference/03b8dc03bafe4e08ae24b87ac92fc82d)
    *   [Atualiza os dados de um cliente (PF ou PJ)patch](https://developers.celcoin.com.br/reference/8124c843736991279246ab1bef141b0c)

*   [Account Management](https://developers.celcoin.com.br/reference/1bd7b380132ba7bc27cbcd6050eb1277)
    *   [Fetches data from a specific account.get](https://developers.celcoin.com.br/reference/1bd7b380132ba7bc27cbcd6050eb1277)
    *   [Search for an account by parameters.get](https://developers.celcoin.com.br/reference/25f3feedd3689848716ce768039aecd3)
    *   [Create a new account post](https://developers.celcoin.com.br/reference/06a69fbffaf07d9dcf16bf0d99a615be)
    *   [Check the limits of a specific account get](https://developers.celcoin.com.br/reference/d39c996d61c57217a767cb463b963a95)
    *   [Update an account limit patch](https://developers.celcoin.com.br/reference/c72fa508ec35413d6404ff2af1fbc1bd)
    *   [Changes the reported account to canceled status.post](https://developers.celcoin.com.br/reference/0e436897e68c0ed7b880fae43c6a94ae)
    *   [Move account from canceled status to normal.post](https://developers.celcoin.com.br/reference/0ad8ba94b912f4c7d815db5f0f1128bf)
    *   [Update invoice due date put](https://developers.celcoin.com.br/reference/3922b57e5840576a579d839859606503)

*   [Gestão de Endereços](https://developers.celcoin.com.br/reference/972cea0493c5ea89395e25fc295908f4)
    *   [Creates a new address for a specific account post](https://developers.celcoin.com.br/reference/972cea0493c5ea89395e25fc295908f4)
    *   [It searches for a single address from a specific account.get](https://developers.celcoin.com.br/reference/eb576bc5e4bbc0ce7f3a440289582ec8)
    *   [Updates address data patch](https://developers.celcoin.com.br/reference/805bb1a5ac2c7e435ed4d74030d18a93)
    *   [Lists all addresses for a specific account.get](https://developers.celcoin.com.br/reference/f6c54a8fc31b8f46489be32c4d67a9f5)

*   [Gestão de Telefone](https://developers.celcoin.com.br/reference/47edc698b196fbfa4f434d4d314c0490)
    *   [Create a new phone for a specific account post](https://developers.celcoin.com.br/reference/47edc698b196fbfa4f434d4d314c0490)
    *   [Search for phones registered by account get](https://developers.celcoin.com.br/reference/586f7fdc5d0d3a1f7655342202616809)
    *   [Update a phone get](https://developers.celcoin.com.br/reference/3e0908b70f9e30b847d8317b5d514c78)
    *   [Update a phone patch](https://developers.celcoin.com.br/reference/e97858b35ae4c23ab6ca936e5272498e)

*   [Embossing](https://developers.celcoin.com.br/reference/d81f1a6565d8b2fd742eaca3e05ca71b)
    *   [Search for embossing information from a card get](https://developers.celcoin.com.br/reference/d81f1a6565d8b2fd742eaca3e05ca71b)
    *   [Simulating a card's tracking post](https://developers.celcoin.com.br/reference/c2aaa769f790e27b1e707b8996cfed6b)
    *   [Updates a card's embossing address patch](https://developers.celcoin.com.br/reference/8e56eb78821872b29fb69fafb7b63db4)
    *   [Resend card for embossing post](https://developers.celcoin.com.br/reference/83f302dfb147cea87791708f4e21fa66)

## CEL_CASH - AaaS

*   [Authentication](https://developers.celcoin.com.br/reference/aaas-gerar-token-de-autenticacao)
    *   [Generate authentication token post](https://developers.celcoin.com.br/reference/aaas-gerar-token-de-autenticacao)

*   [Account Management](https://developers.celcoin.com.br/reference/aaas-cadastrar-uma-conta-pf)
    *   [Registering an individual account post](https://developers.celcoin.com.br/reference/aaas-cadastrar-uma-conta-pf)
    *   [Registering a PJ account post](https://developers.celcoin.com.br/reference/aaas-cadastrar-uma-conta-pj)

*   [Receivables Management](https://developers.celcoin.com.br/reference/aaas-solicitar-relat%C3%B3rio-de-receb%C3%ADveis)
    *   [Request receivables report post](https://developers.celcoin.com.br/reference/aaas-solicitar-relat%C3%B3rio-de-receb%C3%ADveis)
    *   [View transaction receivable get](https://developers.celcoin.com.br/reference/visualizar-recebivel)
    *   [View contract receivable get](https://developers.celcoin.com.br/reference/visualizar-recebivel-de-contrato)

*   [Reports](https://developers.celcoin.com.br/reference/aaas-buscar-estado-de-relatorio-solicitado)
    *   [Search for requested report status get](https://developers.celcoin.com.br/reference/aaas-buscar-estado-de-relatorio-solicitado)
    *   [View report file get](https://developers.celcoin.com.br/reference/aaas-visualizar-arquivo-de-relatorio)

*   [Webhooks](https://developers.celcoin.com.br/reference/aaas-visualizar-template-de-evento-de-webhook)
    *   [View webhook event template get](https://developers.celcoin.com.br/reference/aaas-visualizar-template-de-evento-de-webhook)

## cel_credit

*   [Visão Geral](https://developers.celcoin.com.br/reference/visao-geral-1)
    *   [Glossário de Termos Técnicos](https://developers.celcoin.com.br/reference/glossario-de-termos-tecnicos-1)

*   [Authentication](https://developers.celcoin.com.br/reference/autenticacao-1)
    *   [Obter Token de Autenticação post](https://developers.celcoin.com.br/reference/post_oauth2-token-4)

*   [Webhook](https://developers.celcoin.com.br/reference/webhook-credit)
*   [Variaveis Customizadas](https://developers.celcoin.com.br/reference/variaveis-customizadas)
*   [Tomador | Borrower](https://developers.celcoin.com.br/reference/pessoa-fisica)
    *   [Pessoa Fisica](https://developers.celcoin.com.br/reference/cadastro-de-tomador-person)
        *   [Pessoa Fisica](https://developers.celcoin.com.br/reference/cadastro-de-tomador-person)
        *   [KYC (Know Your Customer)](https://developers.celcoin.com.br/reference/kyc-credito)
        *   [Document](https://developers.celcoin.com.br/reference/documento)

    *   [Pessoa Juridica](https://developers.celcoin.com.br/reference/pessoa-juridica-1)
        *   [Pessoa Juridica](https://developers.celcoin.com.br/reference/pessoa-juridica-1)
        *   [Document](https://developers.celcoin.com.br/reference/documento-1)
        *   [KYC (Know Your Costumer)](https://developers.celcoin.com.br/reference/kyc-know-your-costumer)

*   [Solicitação de Crédito (Applications)](https://developers.celcoin.com.br/reference/simulacoes-de-credito)
    *   [Simulações de Crédito](https://developers.celcoin.com.br/reference/simulacoes-de-credito)
    *   [Tipos de solicitações de Crédito](https://developers.celcoin.com.br/reference/consulta-opera%C3%A7%C3%B5es-de-cr%C3%A9dito)
        *   [Consulta Operações de Crédito](https://developers.celcoin.com.br/reference/consulta-opera%C3%A7%C3%B5es-de-cr%C3%A9dito)
        *   [Originação com Boleto de Entrada](https://developers.celcoin.com.br/reference/originacao-com-boleto-de-entrada)
        *   [Originação com Split de Pagamento](https://developers.celcoin.com.br/reference/originacao-com-split-de-pagamento)
        *   [Originação com pagamento ao tomador](https://developers.celcoin.com.br/reference/originacao-com-pagamento-tomador)
        *   [Originação com múltiplos assinantes](https://developers.celcoin.com.br/reference/originacao-com-multiplos-assinantes)
        *   [Criação de CCB — Pagamento via QR Code PIX (EMV)](https://developers.celcoin.com.br/reference/copy-of-origina%C3%A7%C3%A3o-com-m%C3%BAltiplos-assinantes)
        *   [Criação de CCB — Pagamento de Boleto (BILLET_PAYMENT)](https://developers.celcoin.com.br/reference/copy-of-cria%C3%A7%C3%A3o-de-ccb-pagamento-via-qr-code-pix-emv)

    *   [Saque Aniversário FGTS](https://developers.celcoin.com.br/reference/saque-aniversario-fgts)
        *   [Authentication](https://developers.celcoin.com.br/reference/autenticacao-5)
        *   [Margin Consultation](https://developers.celcoin.com.br/reference/consulta-de-margem-6)
        *   [Simulação de CCB](https://developers.celcoin.com.br/reference/simulacao-de-ccb-2)
        *   [Cadastro de Tomador & Solicitação](https://developers.celcoin.com.br/reference/cadastro-de-tomador-solicitacao-2)
        *   [Status de Operação](https://developers.celcoin.com.br/reference/status-de-operacao-4)

    *   [Emissão de Crédito consignado](https://developers.celcoin.com.br/reference/credito-do-trabalhador-sem-leilao)
        *   [Crédito do trabalhador -Sem leilão](https://developers.celcoin.com.br/reference/credito-do-trabalhador-sem-leilao)
        *   [Crédito trabalhador - Leilão](https://developers.celcoin.com.br/reference/credito-trabalhador-leilao)

    *   [Consignado Servidores do Exército](https://developers.celcoin.com.br/reference/consignado-servidores-do-exercito)
        *   [Authentication](https://developers.celcoin.com.br/reference/autenticacao-3)
        *   [Margin Consultation](https://developers.celcoin.com.br/reference/consulta-de-margem-4)
        *   [Simulação de CCB](https://developers.celcoin.com.br/reference/simulacao-de-ccb)
        *   [Cadastro de Tomador](https://developers.celcoin.com.br/reference/cadastro-de-tomador)
        *   [Cadastro de Tomador & Solicitação](https://developers.celcoin.com.br/reference/cadastro-de-tomador-solicitacao)
        *   [Compra com Troco](https://developers.celcoin.com.br/reference/compra-com-troco-1)
        *   [Status de Operação](https://developers.celcoin.com.br/reference/status-de-operacao-2)

    *   [Tipos de Assinaturas](https://developers.celcoin.com.br/reference/modalidades-de-assinaturas)
        *   [Modalidades de Assinaturas](https://developers.celcoin.com.br/reference/modalidades-de-assinaturas)
        *   [Assinatura via Cláusula Mandato (Timestamp)](https://developers.celcoin.com.br/reference/assinatura-via-cl%C3%A1usula-mandato-timestamp)
        *   [Assinatura via Envio de PDF (Assinatura Física/Externa)](https://developers.celcoin.com.br/reference/assinatura-via-envio-de-pdf-assinatura-f%C3%ADsicaexterna)
        *   [Consulta de Assinaturas da CCB](https://developers.celcoin.com.br/reference/consulta-de-assinaturas-da-ccb)

    *   [Status de Solicitações (Applications)](https://developers.celcoin.com.br/reference/solicita%C3%A7%C3%B5es-applications)
    *   [Consultas, Escriturações e Repasses](https://developers.celcoin.com.br/reference/consultas-escrituracoes-e-repasses)

*   [Cessão de crédito](https://developers.celcoin.com.br/reference/fluxos-de-cessao)

## CUSTOMER PANEL

*   [Tickets](https://developers.celcoin.com.br/reference/listar-tickets)
    *   [Ticket Listing get](https://developers.celcoin.com.br/reference/listar-tickets)

## Issuance of Service Invoice

*   [Business Management](https://developers.celcoin.com.br/reference/cadastrar-uma-empresa)
    *   [Registering a Company post](https://developers.celcoin.com.br/reference/cadastrar-uma-empresa)
    *   [Consult a Company get](https://developers.celcoin.com.br/reference/consultar-uma-empresa)
    *   [Registering a Digital Certificate for the Company post](https://developers.celcoin.com.br/reference/cadastrar-um-certificado-digital)

*   [Invoice Management](https://developers.celcoin.com.br/reference/emitir-nota-fiscal-de-servico)
    *   [Issue Service Invoice post](https://developers.celcoin.com.br/reference/emitir-nota-fiscal-de-servico)
    *   [Consult Service Invoice get](https://developers.celcoin.com.br/reference/consultar-nota-fiscal-de-servico)
    *   [Cancel Service Invoice issuance post](https://developers.celcoin.com.br/reference/cancelar-emissao-nota-fiscal-servico)

## Celcoin - Escrow

*   [Authentication](https://developers.celcoin.com.br/reference/post_oauth2-token-2)
    *   [Get authentication token post](https://developers.celcoin.com.br/reference/post_oauth2-token-2)

*   [People](https://developers.celcoin.com.br/reference/post_escrow-api-v1-documents-upload)
    *   [Upload de Documentos da Pessoa post](https://developers.celcoin.com.br/reference/post_escrow-api-v1-documents-upload)
    *   [Create a "physical" type person post](https://developers.celcoin.com.br/reference/post_escrow-api-persons)
    *   [List registered people get](https://developers.celcoin.com.br/reference/get_escrow-api-persons)
    *   [Criar uma pessoa do tipo "jurídica"post](https://developers.celcoin.com.br/reference/post_escrow-api-persons2)
    *   [Update person's registration patch](https://developers.celcoin.com.br/reference/patch_escrow-api-persons-person-id)

*   [Introduction](https://developers.celcoin.com.br/reference/credit-escrow-introducao)
*   [Accounts](https://developers.celcoin.com.br/reference/post_escrow-api-v1-accounts)
    *   [Create a new account post](https://developers.celcoin.com.br/reference/post_escrow-api-v1-accounts)
    *   [Lists all registered accounts get](https://developers.celcoin.com.br/reference/get_escrow-api-v1-accounts)
    *   [View escrow account details get](https://developers.celcoin.com.br/reference/get_escrow-api-v1-accounts-account-id)
    *   [View your account statement get](https://developers.celcoin.com.br/reference/get_escrow-api-v1-accounts-account-id-statement)
    *   [Check the status/details of a transaction get](https://developers.celcoin.com.br/reference/get_escrow-api-v1-accounts-account-id-statement-client-code-status)
    *   [Check your account balance get](https://developers.celcoin.com.br/reference/get_escrow-api-v1-accounts-account-id-balance)

*   [Accounts > Retention](https://developers.celcoin.com.br/reference/post_escrow-api-v1-accounts-account-id-deposit-retention)
    *   [Registering a retention post](https://developers.celcoin.com.br/reference/post_escrow-api-v1-accounts-account-id-deposit-retention)
    *   [List all registered retentions get](https://developers.celcoin.com.br/reference/get_escrow-api-v1-accounts-account-id-deposit-retention)
    *   [Change a hold patch](https://developers.celcoin.com.br/reference/patch_escrow-api-v1-accounts-account-id-deposit-retention-deposit-retention-id)
    *   [Delete a hold del](https://developers.celcoin.com.br/reference/delete_escrow-api-v1-accounts-account-id-deposit-retention-deposit-retention-id)

*   [Accounts > Webhook](https://developers.celcoin.com.br/reference/get_escrow-api-v1-webhook-configurations)
    *   [List all webhook entities available for configuration get](https://developers.celcoin.com.br/reference/get_escrow-api-v1-webhook-configurations)
    *   [Creating a webhook configuration post](https://developers.celcoin.com.br/reference/post_escrow-api-v1-accounts-account-id-webhook-configurations)
    *   [List all webhooks registered for an Account get](https://developers.celcoin.com.br/reference/get_escrow-api-v1-accounts-account-id-webhook-configurations)
    *   [Changing a webhook configuration patch](https://developers.celcoin.com.br/reference/patch_escrow-api-v1-accounts-account-id-webhook-configurations-webhook-id)
    *   [Deleting a webhook configuration del](https://developers.celcoin.com.br/reference/delete_escrow-api-v1-accounts-account-id-webhook-configurations-webhook-id)

*   [Requests](https://developers.celcoin.com.br/reference/post_escrow-api-v1-postings)
    *   [Create a request post](https://developers.celcoin.com.br/reference/post_escrow-api-v1-postings)
    *   [List all requests get](https://developers.celcoin.com.br/reference/get_escrow-api-v1-postings)
    *   [View the details of a request made get](https://developers.celcoin.com.br/reference/get_escrow-api-v1-postings-posting-id)
    *   [Review a request put](https://developers.celcoin.com.br/reference/put_escrow-api-v1-postings-posting-id-review)
    *   [Cancel a request put](https://developers.celcoin.com.br/reference/put_escrow-api-v1-postings-posting-id-cancel)
    *   [Check the details of a boleto barcode get](https://developers.celcoin.com.br/reference/get_escrow-api-v1-billpayments-bar-code)

*   [Wallets](https://developers.celcoin.com.br/reference/post_escrow-api-v1-wallets-1)
    *   [Register a new wallet post](https://developers.celcoin.com.br/reference/post_escrow-api-v1-wallets-1)
    *   [List all wallets get](https://developers.celcoin.com.br/reference/get_escrow-api-v1-wallets)
    *   [View the details of a wallet get](https://developers.celcoin.com.br/reference/get_escrow-api-v1-wallets-wallet-id)
    *   [Change wallet details patch](https://developers.celcoin.com.br/reference/patch_escrow-api-v1-wallets-wallet-id)
    *   [Archive or unarchive a portfolio put](https://developers.celcoin.com.br/reference/put_escrow-api-v1-wallets-wallet-id-archive)

*   [Contas > Conta destino](https://developers.celcoin.com.br/reference/get_escrow-api-v1-accounts-accountid-destinations)
    *   [Criar uma nova conta de destino (transferências)post](https://developers.celcoin.com.br/reference/get_escrow-api-v1-accounts-accountid-destinations)
    *   [Excluir uma conta de destino del](https://developers.celcoin.com.br/reference/delete_escrow-api-v1-accounts-accountid-destinations-accountdestinationid)
    *   [Alterar uma conta de destino patch](https://developers.celcoin.com.br/reference/patch_escrow-api-v1-accounts-accountid-destinations-accountdestinationid)

*   [Wallets > Charges](https://developers.celcoin.com.br/reference/post_escrow-api-v1-wallets-wallet-id-charges-1)
    *   [Cadastrar Cobrança post](https://developers.celcoin.com.br/reference/post_escrow-api-v1-wallets-wallet-id-charges-1)
    *   [List all charges for a wallet get](https://developers.celcoin.com.br/reference/get_escrow-api-v1-wallets-wallet-id-charges)
    *   [View the details of a charge get](https://developers.celcoin.com.br/reference/get_escrow-api-v1-wallets-wallet-id-charges-charge-id)
    *   [Delete a charge del](https://developers.celcoin.com.br/reference/delete_escrow-api-v1-wallets-wallet-id-charges-charge-id)
    *   [Download a PDF of a charge get](https://developers.celcoin.com.br/reference/get_escrow-api-v1-wallets-wallet-id-charges-charge-id-pdf)
    *   [Cadastrar uma nova cobrança (PIX)post](https://developers.celcoin.com.br/reference/post_escrow-api-v1-accounts-account-id-pix-charges)
    *   [Consultar uma cobrança (PIX)get](https://developers.celcoin.com.br/reference/get_escrow-api-v1-accounts-account-id-pix-charges-pix-charge-id)

## OPEN KEYS (ITP Stand-alone)

*   [Health Check](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-healthcheck-1)
    *   [Get service status.get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-healthcheck-1)

*   [Application Management](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-applications)
    *   [Create application post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-applications)
    *   [List applications get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-applications)
    *   [Get application details get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-applications-applicationid)
    *   [Update application put](https://developers.celcoin.com.br/reference/put_open-keys-itp-api-v2-applications-applicationid)
    *   [Create payment journey session post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-applications-applicationid-journeys-journeyid-sessions)
    *   [Create end-user management session post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-applications-applicationid-management-sessions)

*   [Application Accounts](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-applications-applicationid-accounts)
    *   [Create creditor account post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-applications-applicationid-accounts)
    *   [List creditor accounts get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-applications-applicationid-accounts)
    *   [Detail creditor account get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-applications-applicationid-accounts-id)
    *   [Delete creditor account del](https://developers.celcoin.com.br/reference/delete_open-keys-itp-api-v2-applications-applicationid-accounts-id)

*   [Application Redirects](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-applications-applicationid-redirects)
    *   [Add redirect URL post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-applications-applicationid-redirects)
    *   [List redirect URLs get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-applications-applicationid-redirects)
    *   [Get Redirect URL get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-applications-applicationid-redirects-id)
    *   [Delete redirect URL del](https://developers.celcoin.com.br/reference/delete_open-keys-itp-api-v2-applications-applicationid-redirects-id)

*   [Application Webhooks](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-applications-applicationid-webhooks)
    *   [Create application webhook post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-applications-applicationid-webhooks)
    *   [List application webhooks get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-applications-applicationid-webhooks)
    *   [Get webhook from app get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-applications-applicationid-webhooks-id)
    *   [Remove webhook from application del](https://developers.celcoin.com.br/reference/delete_open-keys-itp-api-v2-applications-applicationid-webhooks-id)

*   [Application Settings](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-applications-applicationid-settings)
    *   [Create or update application configuration post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-applications-applicationid-settings)
    *   [List application settings get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-applications-applicationid-settings)

*   [Participants](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-participants-brands-1)
    *   [Lists the participating ITP holders.get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-participants-brands-1)
    *   [Gets details of an ITP participating holder.get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-participants-brands-id-1)

*   [Journey Sessions](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-payments-v4-journeys-sessions-1)
    *   [Creates an ITP journey session.post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-payments-v4-journeys-sessions-1)
    *   [Lists the sessions of a journey.get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-payments-v4-journeys-sessions-1)
    *   [Search for a session of a journey.get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-payments-v4-journeys-sessions-id-1)

*   [JSR Journey Sessions (Journey without Redirection)](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-enrollments-v2-journeys-sessions-1)
    *   [Creates an ITP journey session for bonding.post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-enrollments-v2-journeys-sessions-1)
    *   [Lists the registration journey sessions.get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-enrollments-v2-journeys-sessions-1)
    *   [Search for a registration journey session.get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-enrollments-v2-journeys-sessions-id-1)
    *   [Updates the bond journey session.patch](https://developers.celcoin.com.br/reference/patch_open-keys-itp-api-v2-enrollments-v2-journeys-sessions-id)
    *   [Searches for a registration journey session, using the external ID sent when creating the session as a reference.get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-enrollments-v2-journeys-sessions-external-externalid-1)
    *   [Search for a registration journey session with internship.get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-enrollments-v2-journeys-sessions-id-stage)
    *   [Check if the registration journey session has expired.get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-enrollments-v2-journeys-sessions-id-verify-expired)

*   [JSR Payment Initiation (Journey Without Redirection)](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-enrollments-v2-payment-initiations)
    *   [Create link (account link).post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-enrollments-v2-payment-initiations)
    *   [List account links (enrollments).get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-enrollments-v2-payment-initiations)
    *   [You get a registration payment initiation.get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-enrollments-v2-payment-initiations-id)
    *   [Updates a bond payment initiation.patch](https://developers.celcoin.com.br/reference/patch_open-keys-itp-api-v2-enrollments-v2-payment-initiations-id)
    *   [You get the updated registration payment initiation.get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-enrollments-v2-payment-initiations-id-updated)
    *   [Get FIDO registration options for registration.post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-enrollments-v2-payment-initiations-id-fido-registration-options)
    *   [You complete the FIDO registration form.post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-enrollments-v2-payment-initiations-id-fido-registration)
    *   [Gets FIDO signature options for authentication.post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-enrollments-v2-payment-initiations-id-fido-sign-options)
    *   [Authorizes registration consent.post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-enrollments-v2-payment-initiations-id-authorise)

*   [Payment Initiation](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-payments-v4-payment-initiation)
    *   [Payment Processing.post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-payments-v4-payment-initiation)
    *   [Payment Processing.get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-payments-v4-payment-initiation)
    *   [Payment Processing.get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-payments-v4-payment-initiation-id)
    *   [Payment Processing.patch](https://developers.celcoin.com.br/reference/patch_open-keys-itp-api-v2-payments-v4-payment-initiation-id)
    *   [Payment Processing.patch](https://developers.celcoin.com.br/reference/patch_open-keys-itp-api-v2-payments-v4-payment-initiation-id-payments-paymentid)

*   [Payment Initiation Management Session](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-payment-initiation-management-sessions)
    *   [Create end user management session with URL.post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-payment-initiation-management-sessions)
    *   [Get end user management session data.get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-payment-initiation-management-sessions)

## CEL_OPEN (ITP Stand-alone EN)

*   [Participants](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-participants-brands)
    *   [List Open Finance Brasil participant institution brands get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-participants-brands)
    *   [Get Open Finance Brasil participant institution brand by ID get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-participants-brands-id)

*   [JSR Payment Initiation (Journey without Redirection)](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-enrollments-v2-payment-initiation)
    *   [Create Open Finance account enrollment for PIX payment initiation post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-enrollments-v2-payment-initiation)
    *   [List account links (enrollments).get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-enrollments-v2-payment-initiation)
    *   [Retrieve enrollment payment initiation details with brand and authorization information get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-enrollments-v2-payment-initiation-id)
    *   [Get parameters for FIDO2 credential creation.post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-enrollments-v2-payment-initiation-itp-enrollment-id-fido-registration-options)
    *   [Associate FIDO2 credential to account enrollment.post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-enrollments-v2-payment-initiation-itp-enrollment-id-fido-registration)
    *   [Get parameters for FIDO2 authentication.post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-enrollments-v2-payment-initiation-itp-enrollment-id-fido-sign-options)
    *   [Authorizes enrollment consent using FIDO2 signature post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-enrollments-v2-payment-initiation-itp-enrollment-id-authorise)

*   [Payment Initiation](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-payments-v4-payment-initiation-1)
    *   [Create PIX payment initiation post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-payments-v4-payment-initiation-1)
    *   [List PIX payment initiations with filters get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-payments-v4-payment-initiation-1)
    *   [Get PIX payment initiation by ID get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-payments-v4-payment-initiation-id-1)
    *   [Decode PIX EMV string post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-payments-v4-payment-initiation-pix-emv)
    *   [Execute PIX payment post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-payments-v4-payment-initiation-id-pix)
    *   [Process OAuth2 authorization callback from account holder post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-payment-initiation-callback)

*   [Payment Initiation Management Session](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-payment-initiation-management-session)
    *   [Create payment initiation management session post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-payment-initiation-management-session)

## Cartoes-Fatura-Management-Webservice

*   [fees](https://developers.celcoin.com.br/reference/4037b7b64ae54541d939103606a26195)
    *   [Listar as taxas da fatura get](https://developers.celcoin.com.br/reference/4037b7b64ae54541d939103606a26195)

*   [Antecipacao](https://developers.celcoin.com.br/reference/09ae3b3783de57ebc4e6d174bcc805e7)
    *   [Cria uma antecipação de parcela post](https://developers.celcoin.com.br/reference/09ae3b3783de57ebc4e6d174bcc805e7)
    *   [Simula a antecipação de parcelas para a fatura atual get](https://developers.celcoin.com.br/reference/95df6371f89da3ec38d7784163c34147)
    *   [Lista todas as antecipações de parcelas para a conta get](https://developers.celcoin.com.br/reference/f96f7b1e4f23387352d9a3ed887e69aa)
    *   [Detalhe uma antecipação de parcela feita get](https://developers.celcoin.com.br/reference/49ed9de3d31b255cf6eae3ba1ea5578a)
    *   [Cancela uma antecipação de parcela del](https://developers.celcoin.com.br/reference/3a5e850800516cd44363a325591590a0)

## CEL_CARD - CARD MANAGEMENT

*   [Cards](https://developers.celcoin.com.br/reference/46ce7706da954433a2004ce6738f692f)
    *   [Lista todos os status de cartão disponíveis get](https://developers.celcoin.com.br/reference/46ce7706da954433a2004ce6738f692f)
    *   [Lista os motivos de reemissão do cartão do cliente get](https://developers.celcoin.com.br/reference/1b1a87599d8be1cb9cfe6c7a00154511)
    *   [Atualiza Pin de um cartão - modo Off post](https://developers.celcoin.com.br/reference/cb82739e8fab4c117d07835793bd44d3)

*   [Card Token](https://developers.celcoin.com.br/reference/9f733d4d7454f0f84da4d8c3c9fff212)
    *   [Obtem todos os tokens de um cartão get](https://developers.celcoin.com.br/reference/9f733d4d7454f0f84da4d8c3c9fff212)
    *   [Transfere um token de um cartão para outro post](https://developers.celcoin.com.br/reference/5705c8985471970e65b4151b7347a294)
    *   [Busca informações do token get](https://developers.celcoin.com.br/reference/75717e4fdd2b82246a43efd923db84cd)
    *   [Executa uma operação no token post](https://developers.celcoin.com.br/reference/aa38c1b3986029d71903cca8c620a197)

Powered by[](https://readme.com/?ref_src=hub&project=celcoin)

1.   Celcoin Infratech API
2.   [Token](https://developers.celcoin.com.br/reference/token)

# Generates the token for authentication of API endpoints.

Copy Page

post

https://sandbox.openfinance.celcoin.dev/v5/token

Recent Requests

Log in to see full request history

| Team | Status | User Agent |  |
| :--- | :--- | :--- | :--- |
| Retrieving recent requests… |

Loading…

#### URL Expired

The URL for this request expired after 30 days.

Close

[](https://developers.celcoin.com.br/reference#body-params)Body Params

client_id 

string

ClienId provided by Celcoin's homologation team.

grant_type 

string

By default, always use the value "client_credentials".

client_secret 

string

clientSecret provided by Celcoin homologation team.

[](https://developers.celcoin.com.br/reference#response-schemas)Responses

# 200

Success

# 400

Bad Request

 500

Server Error

Updated 5 months ago

* * *

[Onboarding](https://developers.celcoin.com.br/reference/propostas)

Did this page help you?

Yes

No

Language

Shell Node Ruby PHP Python

cURL Request

Examples

xxxxxxxxxx

1

curl --request POST \

2

 --url https://sandbox.openfinance.celcoin.dev/v5/token \

3

 --header 'accept: application/json' \

4

 --header 'content-type: multipart/form-data'

Try It!

Response 

Click `Try It!` to start a request and see the response here! Or choose an example:

application/json

200 400

Updated 5 months ago

* * *

[Onboarding](https://developers.celcoin.com.br/reference/propostas)

Did this page help you?

Yes

No

1.   Celcoin Infratech API
2.   [Token](https://developers.celcoin.com.br/reference/token)
3.   [Generates the token for authentication of API endpoints. post](https://developers.celcoin.com.br/reference/post_v5-token)

1.   CEL_ONBOARDING
2.   [Onboarding](https://developers.celcoin.com.br/reference/propostas)
3.   [Search webview journey tagging. get](https://developers.celcoin.com.br/reference/buscar-tagueamento-jornada-webview)
4.   [Search for a file or a list of files. get](https://developers.celcoin.com.br/reference/buscar-arquivos-proposta)
5.   [Search for a proposal or a list of proposals. get](https://developers.celcoin.com.br/reference/consultar-proposta)
6.   [Create Legal Entity proposal. post](https://developers.celcoin.com.br/reference/criar-proposta-pessoa-juridica)
7.   [Create Individual proposal. post](https://developers.celcoin.com.br/reference/criar-proposta-pessoa-fisica)

1.   cel_banking - BaaS
2.   [Account Management](https://developers.celcoin.com.br/reference/gest%C3%A3o-de-contas-1)
3.   [Account Creation V1 (Discontinued)](https://developers.celcoin.com.br/reference/cria%C3%A7%C3%A3o-de-contas-v1-descontinuado)
4.   [Create PF Account post](https://developers.celcoin.com.br/reference/criar-conta-pf)
5.   [Create PJ Account post](https://developers.celcoin.com.br/reference/criar-conta-pj)
6.   [Encerra conta del](https://developers.celcoin.com.br/reference/encerra-conta)
7.   [Change put account status](https://developers.celcoin.com.br/reference/altera-status-da-conta)
8.   [Returns information from multiple PJ get accounts](https://developers.celcoin.com.br/reference/retorna-informa%C3%A7%C3%B5es-de-varias-contas-pj)
9.   [Returns information from multiple PF get accounts](https://developers.celcoin.com.br/reference/retorna-informa%C3%A7%C3%B5es-de-varias-contas)
10.   [Returns PJ account information get](https://developers.celcoin.com.br/reference/retorna-informa%C3%A7%C3%B5es-de-conta-pj)
11.   [Returns PF get account information](https://developers.celcoin.com.br/reference/retorna-informa%C3%A7%C3%B5es-da-conta)
12.   [Update PJ put Client data](https://developers.celcoin.com.br/reference/atualizar-dados-do-cliente-pj)
13.   [Update PF put Customer data](https://developers.celcoin.com.br/reference/atualizar-dados-do-cliente)
14.   [Check Account Status. get](https://developers.celcoin.com.br/reference/verificar-status-da-conta)
15.   [Account creation](https://developers.celcoin.com.br/reference/cria%C3%A7%C3%A3o-de-contas-v2)
16.   [Account Opening and KYC](https://developers.celcoin.com.br/reference/api-para-onboarding)
17.   [Account Information](https://developers.celcoin.com.br/reference/relat%C3%B3rios-1)
18.   [Consultar Extrato Detalhado (Beta)get](https://developers.celcoin.com.br/reference/consultar-extrato-detalhado)
19.   [Consultar Transações do Extrato get](https://developers.celcoin.com.br/reference/consultar-transacoes-do-extrato)
20.   [Consult Extract get](https://developers.celcoin.com.br/reference/consultar-extrato)
21.   [Consultar Saldo do Dia get](https://developers.celcoin.com.br/reference/consultar-saldo-dia)
22.   [Check Balance get](https://developers.celcoin.com.br/reference/consultar-saldo)
23.   [Transfer between accounts](https://developers.celcoin.com.br/reference/transfer%C3%AAncia-entre-contas)
24.   [Check the status of an internal transfer get](https://developers.celcoin.com.br/reference/consultar-status-transferencia-interna)
25.   [Initiate a transfer between post accounts](https://developers.celcoin.com.br/reference/realizar-uma-transferencia-entre-contas)
26.   [Pix](https://developers.celcoin.com.br/reference/pix-2)
27.   [Split Pix](https://developers.celcoin.com.br/reference/split-pix-1)
28.   [Split de Pix Cash-in por QR Code dinâmico (immediate)post](https://developers.celcoin.com.br/reference/split-de-pix-cash-in-por-qr-code-din%C3%A2mico-immediate-1)
29.   [Split de Pix Cash-in por QR Code dinâmico(duedate)post](https://developers.celcoin.com.br/reference/split-de-pix-cash-in-por-qr-code-din%C3%A2micoduedate-1)
30.   [Pix Key Portability and Claim](https://developers.celcoin.com.br/reference/portabilidade-e-reivindicacao-de-chaves-pix)
31.   [Check the Pix get key portability/claim list](https://developers.celcoin.com.br/reference/consulta-lista-de-reivindicacao-e-portabilidade-de-chave-pix)
32.   [Pix get key claim/portability query](https://developers.celcoin.com.br/reference/consulta-reivindicacao-e-portabilidade-de-chave-pix)
33.   [Cancel new Pix post key claim/portability](https://developers.celcoin.com.br/reference/cancela-reivindicacao-e-portabilidade-de-chave-pix)
34.   [Confirm new Pix post key claim/portability](https://developers.celcoin.com.br/reference/confirmar-reivindica%C3%A7%C3%A3o-portabilidade-de-chave-pix)
35.   [Register new Pix post key claim/portability](https://developers.celcoin.com.br/reference/cadastrar-portabilidade-reivindicacao-de-chaves-pix)
36.   [Key Management](https://developers.celcoin.com.br/reference/pix-gerenciamento-de-chaves-1)
37.   [Alteração de nome em uma chave Pix put](https://developers.celcoin.com.br/reference/alterar-chave-pix)
38.   [Excluir chaves Pix del](https://developers.celcoin.com.br/reference/excluir-chaves-pix)
39.   [Check Pix keys for a Get account](https://developers.celcoin.com.br/reference/consulta-informa%C3%A7%C3%B5es-da-chave-pix)
40.   [Create Pix post keys](https://developers.celcoin.com.br/reference/criar-chaves-pix)
41.   [Cash-out refund](https://developers.celcoin.com.br/reference/devolu%C3%A7%C3%A3o-de-cash-out-baas)
42.   [Querying a Pix-out return](https://developers.celcoin.com.br/reference/devolu%C3%A7%C3%A3o-de-pagamento-cash-out)
43.   [Cash-in return](https://developers.celcoin.com.br/reference/pix-gerenciamento-de-chaves-copy)
44.   [Checking the Status of a Pix Receipt Return](https://developers.celcoin.com.br/reference/consultar-status-devolucao-pix)
45.   [Starting a Return of a Pix Post Receipt](https://developers.celcoin.com.br/reference/iniciar-uma-devolu%C3%A7%C3%A3o-pix)
46.   [Receipt (cash-in)](https://developers.celcoin.com.br/reference/pix-cash-in-recebimento)
47.   [Pix receipts query](https://developers.celcoin.com.br/reference/consulta-dados-de-recebimentos)
48.   [Check QRCode status](https://developers.celcoin.com.br/reference/baas-recebimento-cash-in-consulta-status)
49.   [QRCode Creation](https://developers.celcoin.com.br/reference/baas-cria%C3%A7%C3%A3o-de-qrcode)
50.   [Payment (cash-out)](https://developers.celcoin.com.br/reference/pix)
51.   [PIX participants get](https://developers.celcoin.com.br/reference/participantes-pix)
52.   [Check PIX get status](https://developers.celcoin.com.br/reference/verificar-status-do-pix)
53.   [Pix Cashout post](https://developers.celcoin.com.br/reference/realizar-transfer%C3%AAncia-pix)
54.   [Querying a Pix key (DICT) get](https://developers.celcoin.com.br/reference/consulta-informa%C3%A7%C3%B5es-da-chave-pix-externa)
55.   [EMV QRCode Query](https://developers.celcoin.com.br/reference/redirect-consulta-emv)
56.   [Automatic Pix](https://developers.celcoin.com.br/reference/pix-automatico-baas)
57.   [Receiving Journey](https://developers.celcoin.com.br/reference/jornada-recebedora-baas)
58.   [Cancellation of post recurrence](https://developers.celcoin.com.br/reference/cancelamento-da-recorr%C3%AAncia)
59.   [Post appointment cancellation](https://developers.celcoin.com.br/reference/cancelamento-de-agendamento-2)
60.   [Post receipt retries](https://developers.celcoin.com.br/reference/retentativas-de-recebimento)
61.   [Sending a put schedule](https://developers.celcoin.com.br/reference/envio-de-agendamento)
62.   [Crie uma recorrência jornada 4 post](https://developers.celcoin.com.br/reference/crie-uma-recorr%C3%AAncia-jornada-4)
63.   [Crie uma recorrência jornada 3 post](https://developers.celcoin.com.br/reference/crie-uma-recorr%C3%AAncia-jornadas-3-e-4)
64.   [Create a recurrence with post 2](https://developers.celcoin.com.br/reference/crie-uma-recorr%C3%AAncia-com-a-jornada-dois-baas)
65.   [Crie uma recorrência com jornada 1 post](https://developers.celcoin.com.br/reference/crie-uma-recorr%C3%AAncia-com-jornada-1)
66.   [Paying Journey](https://developers.celcoin.com.br/reference/jornada-pagadora)
67.   [Post appointment cancellation](https://developers.celcoin.com.br/reference/cancelamento-de-agendamento-baas)
68.   [Post Authorization Cancellation](https://developers.celcoin.com.br/reference/cancelamento-de-autoriza%C3%A7%C3%A3o-baas)
69.   [Search for a recurrence by get ID](https://developers.celcoin.com.br/reference/busca-uma-recorr%C3%AAncia-pelo-id-baas)
70.   [Search for recurrences by status with get pagination](https://developers.celcoin.com.br/reference/busca-recorr%C3%AAncias-por-status-com-pagina%C3%A7%C3%A3o-baas)
71.   [Refuse a patch recurrence](https://developers.celcoin.com.br/reference/recusa-uma-recorr%C3%AAncia-baas)
72.   [Accepts a recurring journey 4 post](https://developers.celcoin.com.br/reference/aceita-uma-recorr%C3%AAncia-jornada-4)
73.   [Accept a recurring Journey 3 post](https://developers.celcoin.com.br/reference/aceita-uma-recorr%C3%AAncia-jornada-3)
74.   [Accepts a recurring journey 2 post](https://developers.celcoin.com.br/reference/aceita-uma-recorr%C3%AAncia-jornada-2)
75.   [Accepts a recurring Journey 1 patch](https://developers.celcoin.com.br/reference/aceita-uma-recorr%C3%AAncia-jornada-1)
76.   [Pix Inteligente](https://developers.celcoin.com.br/reference/pix-inteligente)
77.   [Listar consentimentos get](https://developers.celcoin.com.br/reference/post_open-keysitpapiv2payment-initiationcallback-1)
78.   [Detalhar Consentimento get](https://developers.celcoin.com.br/reference/get_open-keysitpapiv2sweeping-accountsv2payment-initiation-1)
79.   [Cancelar consetimento de longo prazo patch](https://developers.celcoin.com.br/reference/patch_new-endpoint)
80.   [Criar consentimento para transação de Pix Inteligente post](https://developers.celcoin.com.br/reference/get_new-endpoint-2)
81.   [Agendador de Transação](https://developers.celcoin.com.br/reference/gest%C3%A3o-de-contas-copy)
82.   [Endpoint responsável por listar agendamentos get](https://developers.celcoin.com.br/reference/lista-pix-agendado-baas)
83.   [Cancelar agendamento de pix del](https://developers.celcoin.com.br/reference/cancelar-agendamento-de-pix-baas)
84.   [Consultar agendamento de pix get](https://developers.celcoin.com.br/reference/consultar-agendamento-de-pix-baas)
85.   [TED](https://developers.celcoin.com.br/reference/ted)
86.   [Check the status of a TED transfer get](https://developers.celcoin.com.br/reference/consultar-status-de-uma-ted)
87.   [Send a TED post](https://developers.celcoin.com.br/reference/enviar-uma-transferencia-ted)
88.   [Issuing of bills](https://developers.celcoin.com.br/reference/cobranca)
89.   [Generate PDF for an Issued Bill get](https://developers.celcoin.com.br/reference/gerar-um-pdf-para-uma-cobran%C3%A7a)
90.   [Cancelar Boleto Emitido del](https://developers.celcoin.com.br/reference/delete_charge-transactionid)
91.   [Consulta de Boletos por Período (BETA)get](https://developers.celcoin.com.br/reference/consulta-boleto-periodo)
92.   [Check Issued Bill get](https://developers.celcoin.com.br/reference/consultar-staus-cobranca-avulsa)
93.   [Issue Postal Bill](https://developers.celcoin.com.br/reference/criar-cobranca-avulsa)
94.   [CNAB](https://developers.celcoin.com.br/reference/cnab)
95.   [Baixar arquivo remessa do CNAB pelo id.get](https://developers.celcoin.com.br/reference/baixar-arquivo-remessa-do-cnab-pelo-id)
96.   [Baixar arquivo retorno do CNAB pelo id.get](https://developers.celcoin.com.br/reference/baixar-arquivo-retorno-do-cnab-pelo-id)
97.   [Consulta de Dados CNAB enviado get](https://developers.celcoin.com.br/reference/consulta-de-dados-cnab-enviado)
98.   [Processamento de Arquivo CNAB post](https://developers.celcoin.com.br/reference/processamento-de-arquivo-cnab)
99.   [Bill payment](https://developers.celcoin.com.br/reference/pagamento-de-boletos-baas)
100.   [Status of a Bill Payment. get](https://developers.celcoin.com.br/reference/consultar-status-de-pagamento-de-conta)
101.   [Bill payment. post](https://developers.celcoin.com.br/reference/efetuar-pagamento-de-conta)
102.   [Top-ups](https://developers.celcoin.com.br/reference/recargas-2)
103.   [Check Recharge get](https://developers.celcoin.com.br/reference/consultar-recarga)
104.   [Perform Post Recharge](https://developers.celcoin.com.br/reference/efetuar-uma-recarga)
105.   [Vehicle Debts](https://developers.celcoin.com.br/reference/debitos-veiculares-baas)
106.   [Check vehicle payments and debts. get](https://developers.celcoin.com.br/reference/consultar-pagamento-de-debitos-veiculares)
107.   [Make Vehicle Debt Payment Post](https://developers.celcoin.com.br/reference/realizar-pagamento-debito-veicular)
108.   [Consult vehicle debt inquiry request. get](https://developers.celcoin.com.br/reference/consultar-pedido-de-consulta-de-d%C3%A9bitos-veiculares)
109.   [Create a vehicle debt inquiry request. post](https://developers.celcoin.com.br/reference/criar-pedido-de-consulta-de-d%C3%A9bitos-veiculares)
110.   [Income Statement](https://developers.celcoin.com.br/reference/informe-de-rendimentos-1)
111.   [Consult Income Report get](https://developers.celcoin.com.br/reference/consultar-informe-de-rendimentos)
112.   [Dados via Open Finance](https://developers.celcoin.com.br/reference/receptor-de-dados)
113.   [Loans | Dados](https://developers.celcoin.com.br/reference/loans-dados-1)
114.   [Obtém garantias de um contrato de empréstimo get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-loans-contracts-contractid-warranties)
115.   [Obtém histórico de pagamentos de um empréstimo get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-loans-contracts-contractid-payments)
116.   [Obtém cronograma de parcelas de um empréstimo get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-loans-contracts-contractid-scheduled-instalments)
117.   [Obtém detalhes de um contrato de empréstimo get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-loans-contracts-contractid)
118.   [Obtém lista de contratos de empréstimo get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-loans-contracts)
119.   [Financings | Dados](https://developers.celcoin.com.br/reference/financings-dados-1)
120.   [Obtém a lista de garantias vinculadas ao contrato de financiamento get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-financings-contracts-contractid-warranties)
121.   [Obtém histórico de pagamentos de um financiamento get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-financings-contracts-contractid-payments)
122.   [Obtém cronograma de parcelas de um financiamento get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-financings-contracts-contractid-scheduled-instalments)
123.   [Obtém detalhes de um contrato de financiamento identificado por contractId get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-financings-contracts-contractid)
124.   [Obtém os dados dos contratos de financiamento get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-financings-contracts)
125.   [Investments | Dados](https://developers.celcoin.com.br/reference/investments-dados-1)
126.   [Obtém lista de investimentos em fundos get](https://developers.celcoin.com.br/reference/get_api-open-keys-funds-v1-investments-1)
127.   [Obtém lista de investimentos em títulos do tesouro get](https://developers.celcoin.com.br/reference/get_api-open-keys-treasure-titles-v1-investments-1)
128.   [Obtém detalhes de uma nota de corretagem get](https://developers.celcoin.com.br/reference/get_api-open-keys-variable-incomes-v1-investments-investmentid-broker-note-brokernoteid-1)
129.   [Obtém lista de investimentos em renda variável get](https://developers.celcoin.com.br/reference/get_api-open-keys-variable-incomes-v1-investments-1)
130.   [Obtém detalhes de um investimento em renda fixa de crédito get](https://developers.celcoin.com.br/reference/get_api-open-keys-credit-fixed-incomes-v1-investments-investmentid-1)
131.   [Obtém lista de investimentos em renda fixa de crédito get](https://developers.celcoin.com.br/reference/get_api-open-keys-credit-fixed-incomes-v1-investments-1)
132.   [Obtém transações de um investimento em renda fixa bancária get](https://developers.celcoin.com.br/reference/get_api-open-keys-bank-fixed-incomes-v1-investments-investmentid-transactions-1)
133.   [Obtém saldos de um investimento em renda fixa bancária get](https://developers.celcoin.com.br/reference/get_api-open-keys-bank-fixed-incomes-v1-investments-investmentid-balances-1)
134.   [Obtém detalhes de um investimento em renda fixa bancária get](https://developers.celcoin.com.br/reference/get_api-open-keys-bank-fixed-incomes-v1-investments-investmentid-1)
135.   [Obtém lista de investimentos em renda fixa bancária get](https://developers.celcoin.com.br/reference/get_api-open-keys-bank-fixed-incomes-v1-investments-1)
136.   [Resources | Dados](https://developers.celcoin.com.br/reference/resources-dados-1)
137.   [Obtém a lista de recursos consentidos pelo cliente get](https://developers.celcoin.com.br/reference/get_api-open-keys-resources-v3-resources-1)
138.   [Customers | Dados](https://developers.celcoin.com.br/reference/customers-dados-1)
139.   [Obtém os dados de relacionamento da pessoa jurídica com a instituição get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-customers-business-financial-relations)
140.   [Obtém os dados de qualificação da pessoa jurídica get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-customers-business-qualifications)
141.   [Obtém os registros de identificação da pessoa jurídica get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-customers-business-identifications)
142.   [Obtém os dados de relacionamento da pessoa natural com a instituição get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-customers-personal-financial-relations)
143.   [Obtém os dados de qualificação da pessoa natural get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-customers-personal-qualifications)
144.   [Obtém os registros de identificação da pessoa natural get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-customers-personal-identifications)
145.   [Accounts | Dados](https://developers.celcoin.com.br/reference/accounts-dados-1)
146.   [Obtém a lista de transações da conta identificada por accountId get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-accounts-accountid-transactions)
147.   [Obtém os saldos da conta identificada por accountId get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-accounts-accountid-balances)
148.   [Obter detalhes de uma conta específica get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-accounts-accountid)
149.   [Obtém a lista de contas consentidas pelo cliente get](https://developers.celcoin.com.br/reference/get_baas-v1-open-dat-accounts)
150.   [Consent](https://developers.celcoin.com.br/reference/consentimento-3)
151.   [Callback do consentimento post](https://developers.celcoin.com.br/reference/post_baas-v1-open-dat-consents-callback)
152.   [Pedido de consentimento de dados post](https://developers.celcoin.com.br/reference/post_baas-v1-open-dat-consents)
153.   [Pagamentos via Open Finance (ITP)](https://developers.celcoin.com.br/reference/baas-itp)
154.   [Payment Initiation Management Session](https://developers.celcoin.com.br/reference/payment-initiation-management-session-1)
155.   [Get end user management session data. get](https://developers.celcoin.com.br/reference/get_baas-v1-open-itp-payment-initiation-management-session-1)
156.   [Create end user management session with url. post](https://developers.celcoin.com.br/reference/post_baas-v1-open-itp-payment-initiation-management-session-1)
157.   [Payment Initiation](https://developers.celcoin.com.br/reference/payment-initiation-1)
158.   [Payment Processing. get](https://developers.celcoin.com.br/reference/get_baas-v1-open-itp-payment-initiation-1)
159.   [Payment Processing. post](https://developers.celcoin.com.br/reference/post_baas-v1-open-itp-payment-initiation-1)
160.   [Enrollment Payment Initiation](https://developers.celcoin.com.br/reference/enrollment-payment-initiation-1)
161.   [Authorizes enrollment consent. post](https://developers.celcoin.com.br/reference/post_baas-v1-open-itp-payment-initiation-itp-enrollment-id-authorise-1)
162.   [Gets enrollment FIDO sign options. post](https://developers.celcoin.com.br/reference/post_baas-v1-open-itp-payment-initiation-itp-enrollment-id-fido-sign-options-1)
163.   [Completes enrollment FIDO registration. post](https://developers.celcoin.com.br/reference/post_baas-v1-open-itp-payment-initiation-id-fido-registration-1)
164.   [Gets enrollment FIDO registration options. post](https://developers.celcoin.com.br/reference/post_baas-v1-open-itp-enrollments-payment-initiation-itp-enrollment-id-fido-registration-options-1)
165.   [Updates an enrollment payment initiation. patch](https://developers.celcoin.com.br/reference/patch_baas-v1-open-itp-payment-initiation-itp-payment-id-1)
166.   [Gets an enrollment payment initiation. get](https://developers.celcoin.com.br/reference/get_baas-v1-open-itp-payment-initiation-itp-payment-id-1)
167.   [Lists enrollment payment initiations. get](https://developers.celcoin.com.br/reference/get_baas-v1-open-itp-enrollments-payment-initiation-1)
168.   [Creates an enrollment payment initiation. post](https://developers.celcoin.com.br/reference/post_baas-v1-open-itp-enrollments-payment-initiation-1)
169.   [Enrollment Journey Sessions](https://developers.celcoin.com.br/reference/enrollment-journey-sessions-1)
170.   [Search for an enrollment journey session, using as reference the external ID sent in the creation of the session. get](https://developers.celcoin.com.br/reference/get_baas-v1-open-itp-enrollments-journeys-sessions-external-externalid)
171.   [Updates the journey enrollment session. patch](https://developers.celcoin.com.br/reference/patch_baas-v1-open-itp-enrollments-journeys-sessions-id-1)
172.   [Search for an enrollment journey session. get](https://developers.celcoin.com.br/reference/get_baas-v1-open-itp-enrollments-journeys-sessions-id-1)
173.   [Lists journey enrollment sessions. get](https://developers.celcoin.com.br/reference/get_baas-v1-open-itp-enrollments-journeys-sessions-1)
174.   [Creates an ITP journey session for enrollment. post](https://developers.celcoin.com.br/reference/post_baas-v1-open-itp-enrollments-journeys-sessions-1)
175.   [Sessão de jornadas](https://developers.celcoin.com.br/reference/journey-sessions-1)
176.   [Buscar dados de uma sessão de jornada get](https://developers.celcoin.com.br/reference/get_baas-v1-open-itp-payments-journeys-sessions-id-1)
177.   [Listar sessões de jornada get](https://developers.celcoin.com.br/reference/get_baas-v1-open-itp-payments-journeys-sessions-1)
178.   [Criar uma sessão de jornada ITP post](https://developers.celcoin.com.br/reference/post_baas-v1-open-itp-payments-journeys-sessions-1)
179.   [Participants](https://developers.celcoin.com.br/reference/participants-1)
180.   [Gets details of an ITP participating holder. get](https://developers.celcoin.com.br/reference/get_baas-v1-open-itp-participants-brands-brandid-1)
181.   [List of participating ITP holders. get](https://developers.celcoin.com.br/reference/get_baas-v1-open-itp-participants-brands-1)
182.   [Configuração da Aplicação](https://developers.celcoin.com.br/reference/application-settings-1)
183.   [Obtain . get](https://developers.celcoin.com.br/reference/get_baas-v1-open-itp-applications-applicationid-settings-1)
184.   [Criar ou atualizar configuração da aplicação post](https://developers.celcoin.com.br/reference/post_baas-v1-open-itp-applications-applicationid-settings-1)
185.   [Application Webhooks](https://developers.celcoin.com.br/reference/application-webhooks-1)
186.   [Obter .del](https://developers.celcoin.com.br/reference/delete_baas-v1-open-itp-applications-applicationid-webhooks-id-1)
187.   [Get . get](https://developers.celcoin.com.br/reference/get_baas-v1-open-itp-applications-applicationid-webhooks-id-1)
188.   [Get . get](https://developers.celcoin.com.br/reference/get_baas-v1-open-itp-applications-applicationid-webhooks-1)
189.   [Cadastrar webhook da aplicação post](https://developers.celcoin.com.br/reference/post_baas-v1-open-itp-applications-applicationid-webhooks-1)
190.   [URL de redirecionamentos da Aplicação](https://developers.celcoin.com.br/reference/application-redirects-1)
191.   [Deletar URL de redirecionamento del](https://developers.celcoin.com.br/reference/delete_baas-v1-open-itp-applications-applicationid-redirects-redirectid-1)
192.   [Buscar dados de uma URL de redirecionamento get](https://developers.celcoin.com.br/reference/get_baas-v1-open-itp-applications-applicationid-redirects-redirectid-1)
193.   [List get redirect URLs](https://developers.celcoin.com.br/reference/get_baas-v1-open-itp-applications-applicationid-redirects-1)
194.   [Add post redirect URL](https://developers.celcoin.com.br/reference/post_baas-v1-open-itp-applications-applicationid-redirects-1)
195.   [Contas de crédito da Aplicação](https://developers.celcoin.com.br/reference/application-accounts-1)
196.   [Deletar uma conta de crédito del](https://developers.celcoin.com.br/reference/delete_baas-v1-open-itp-applications-applicationid-accounts-accountid-1)
197.   [Buscar dados de uma conta de crédito get](https://developers.celcoin.com.br/reference/get_baas-v1-open-itp-applications-applicationid-accounts-accountid-1)
198.   [Listar contas de crédito get](https://developers.celcoin.com.br/reference/get_baas-v1-open-itp-applications-applicationid-accounts-1)
199.   [Criar conta de crédito post](https://developers.celcoin.com.br/reference/post_baas-v1-open-itp-applications-applicationid-accounts-1)
200.   [MED 2.0](https://developers.celcoin.com.br/reference/med-20-1)
201.   [Fechar solicitação de recuperação de valores post](https://developers.celcoin.com.br/reference/fechar-solicita%C3%A7%C3%A3o-de-recupera%C3%A7%C3%A3o-de-valores)
202.   [Cancelar recuperação de valores post](https://developers.celcoin.com.br/reference/cancelar-recupera%C3%A7%C3%A3o-de-valores-1)
203.   [Consulta recuperação de valores get](https://developers.celcoin.com.br/reference/consulta-recupera%C3%A7%C3%A3o-de-valores-1)
204.   [Criar recuperação de valores post](https://developers.celcoin.com.br/reference/criar-recupera%C3%A7%C3%A3o-de-valores-1)

1.   Sub-acquiring
2.   [Credenciamento](https://developers.celcoin.com.br/reference/baasv1cashaccreditationmainaccountaccount)
3.   [Credenciar Conta Baas na Sub Celcoin post](https://developers.celcoin.com.br/reference/post_baas-v1-cash-accreditation-mainaccount-account)
4.   [Consultar credenciamento de subconta get](https://developers.celcoin.com.br/reference/get_baas-v1-cash-accreditation)
5.   [Clients](https://developers.celcoin.com.br/reference/clientes-1)
6.   [Excluir cliente del](https://developers.celcoin.com.br/reference/delete_baas-v1-cash-customers-customerid-typeid)
7.   [Editar cliente put](https://developers.celcoin.com.br/reference/put_baas-v1-cash-customers-customerid-typeid)
8.   [Criar cliente post](https://developers.celcoin.com.br/reference/post_baas-v1-cash-customers)
9.   [Listar clientes get](https://developers.celcoin.com.br/reference/get_baas-v1-cash-customers)
10.   [Cards](https://developers.celcoin.com.br/reference/cart%C3%B5es-1)
11.   [Inativar Cartão del](https://developers.celcoin.com.br/reference/delete_baas-v1-cash-cards-customerid-typeid)
12.   [Criar cartão post](https://developers.celcoin.com.br/reference/post_baas-v1-cash-cards-customerid-typeid)
13.   [Listar cartão get](https://developers.celcoin.com.br/reference/get_baas-v1-cash-cards)
14.   [Individual Charges](https://developers.celcoin.com.br/reference/cobran%C3%A7as)
15.   [Capturar cobrança put](https://developers.celcoin.com.br/reference/put_baas-v1-cash-charges-chargeid-typeid-capture)
16.   [Estornar cobrança put](https://developers.celcoin.com.br/reference/put_baas-v1-cash-charges-chargeid-typeid-reverse)
17.   [Retentar cobrança put](https://developers.celcoin.com.br/reference/put_baas-v1-cash-charges-chargeid-typeid-retry)
18.   [Cancelar cobrança del](https://developers.celcoin.com.br/reference/delete_baas-v1-cash-charges-chargeid-typeid)
19.   [Editar cobrança put](https://developers.celcoin.com.br/reference/put_baas-v1-cash-charges-chargeid-typeid)
20.   [Criar cobrança post](https://developers.celcoin.com.br/reference/post_baas-v1-cash-charges)
21.   [Listar cobranças get](https://developers.celcoin.com.br/reference/get_baas-v1-cash-charges)
22.   [Planos](https://developers.celcoin.com.br/reference/planos-1)
23.   [Excluir plano del](https://developers.celcoin.com.br/reference/delete_baas-v1-cash-plans-planid-typeid)
24.   [Editar plano put](https://developers.celcoin.com.br/reference/put_baas-v1-cash-plans-planid-typeid)
25.   [Listar planos get](https://developers.celcoin.com.br/reference/get_baas-v1-cash-plans)
26.   [Criar plano post](https://developers.celcoin.com.br/reference/post_baas-v1-cash-plans)
27.   [Assinaturas](https://developers.celcoin.com.br/reference/assinaturas-1)
28.   [Cancelar Assinatura del](https://developers.celcoin.com.br/reference/delete_baas-v1-cash-subscriptions-subscriptionid-typeid)
29.   [Capturar Cobrança put](https://developers.celcoin.com.br/reference/put_baas-v1-cash-transactions-transactionid-typeid-capture)
30.   [Estornar cobrança no cartão put](https://developers.celcoin.com.br/reference/put_baas-v1-cash-transactions-transactionid-typeid-reverse)
31.   [Retentar cobrança no cartão put](https://developers.celcoin.com.br/reference/put_baas-v1-cash-transactions-transactionid-typeid-retry)
32.   [Cancelar uma transação del](https://developers.celcoin.com.br/reference/delete_baas-v1-cash-transactions-transactionid-typeid)
33.   [Editar transação put](https://developers.celcoin.com.br/reference/put_baas-v1-cash-transactions-transactionid-typeid)
34.   [Adicionar transação post](https://developers.celcoin.com.br/reference/post_baas-v1-cash-transactions-subscriptionid-typeid-add)
35.   [Capturar transação put](https://developers.celcoin.com.br/reference/put_baas-v1-cash-subscriptions-manual-transactionid-typeid-capture)
36.   [Editar informações ou pagamento da assinatura put](https://developers.celcoin.com.br/reference/put_baas-v1-cash-subscriptions-manual-subscriptionid-typeid)
37.   [Criar Assinatura Manual post](https://developers.celcoin.com.br/reference/post_baas-v1-cash-subscriptions-manual)
38.   [Criar Assinatura com ou sem plano post](https://developers.celcoin.com.br/reference/post_baas-v1-cash-subscriptions)
39.   [Listar assinaturas get](https://developers.celcoin.com.br/reference/get_baas-v1-cash-subscriptions)
40.   [Disputas e Chargebacks](https://developers.celcoin.com.br/reference/chargeback)
41.   [Desistir de disputa put](https://developers.celcoin.com.br/reference/put_baas-v1-cash-chargebacks-lose-chargebackid)
42.   [Enviar documentação put](https://developers.celcoin.com.br/reference/put_baas-v1-cash-chargebacks-chargebackid)
43.   [Listar chargebacks get](https://developers.celcoin.com.br/reference/get_baas-v1-cash-chargebacks)
44.   [Webhooks](https://developers.celcoin.com.br/reference/webhooks-1)
45.   [Cadastrar Webhook put](https://developers.celcoin.com.br/reference/put_baas-v1-cash-webhooks)
46.   [Webhook Management](https://developers.celcoin.com.br/reference/webhook-3)
47.   [Resending pending put webhooks](https://developers.celcoin.com.br/reference/reenvio-de-webhooks-pendentes)
48.   [View details of sent webhooks. get](https://developers.celcoin.com.br/reference/consultar-detalhes-dos-webhooks-enviados)
49.   [Check the number of webhooks sent. get](https://developers.celcoin.com.br/reference/consultar-quantidade-de-webhooks-enviados)
50.   [Consult Get Webhooks Templates](https://developers.celcoin.com.br/reference/consultar-templates-de-webhooks)
51.   [View list of events sent by webhook get](https://developers.celcoin.com.br/reference/consultar-lista-de-eventos-enviados-pelo-webhook)
52.   [Excluir Webhook cadastrado del](https://developers.celcoin.com.br/reference/excluir-webhook-cadastrado)
53.   [Edit registered Webhook put](https://developers.celcoin.com.br/reference/editar-webhook-cadastrado)
54.   [Check registered Webhooks get](https://developers.celcoin.com.br/reference/consultar-webhooks-cadastrados)
55.   [Register Webhook post](https://developers.celcoin.com.br/reference/cadastrar-webhook)
56.   [Transações](https://developers.celcoin.com.br/reference/transa%C3%A7%C3%B5es-2)
57.   [Listar transações get](https://developers.celcoin.com.br/reference/get_baas-v1-cash-transactions)
58.   [Fees](https://developers.celcoin.com.br/reference/taxas)
59.   [Listar taxas get](https://developers.celcoin.com.br/reference/get_baas-v1-cash-company-fees)

1.   EMBEDDED PAYMENT
2.   [Auxiliary APIs](https://developers.celcoin.com.br/reference/apis-auxiliares)
3.   [List pending transactions get](https://developers.celcoin.com.br/reference/lista-de-transa%C3%A7%C3%B5es-pendentes)
4.   [List get banks](https://developers.celcoin.com.br/reference/gere-a-lista-de-bancos)
5.   [Returns the health of a given transaction type get](https://developers.celcoin.com.br/reference/retorna-a-sa%C3%BAde-de-um-determinado-tipo-de-transa%C3%A7%C3%A3o)
6.   [List get agreements](https://developers.celcoin.com.br/reference/obtenha-a-lista-de-conv%C3%AAnios)
7.   [Get proof of a get transaction](https://developers.celcoin.com.br/reference/obter-um-comprovante-de-uma-transa%C3%A7%C3%A3o)
8.   [Retrieve details of a get transaction](https://developers.celcoin.com.br/reference/recupere-detalhes-de-uma-transa%C3%A7%C3%A3o)
9.   [Return your current balance information get](https://developers.celcoin.com.br/reference/retorna-as-informa%C3%A7%C3%B5es-do-seu-saldo-atual)
10.   [Extract APIs](https://developers.celcoin.com.br/reference/apis-de-extrato)
11.   [Consult consolidated statement get](https://developers.celcoin.com.br/reference/consultar-extrato-consolidado)
12.   [Conciliation Files](https://developers.celcoin.com.br/reference/arquivos-de-movimenta%C3%A7%C3%A3o)
13.   [Consolidated extract get](https://developers.celcoin.com.br/reference/extrato-consolidado)
14.   [Extract get file](https://developers.celcoin.com.br/reference/extrair-arquivo)
15.   [Search for get file types](https://developers.celcoin.com.br/reference/buscar-tipos-de-arquivos)
16.   [Direct Debit](https://developers.celcoin.com.br/reference/api-para-dda)
17.   [Tickets (Sandbox only)](https://developers.celcoin.com.br/reference/boletos)
18.   [Generate post ticket](https://developers.celcoin.com.br/reference/gerar-boleto)
19.   [Users](https://developers.celcoin.com.br/reference/cadastros)
20.   [Excluir usuário del](https://developers.celcoin.com.br/reference/excluir-usu%C3%A1rio)
21.   [Register user post](https://developers.celcoin.com.br/reference/cadastrar-usu%C3%A1rio)
22.   [Webhooks](https://developers.celcoin.com.br/reference/webhook-2)
23.   [Query get webhooks](https://developers.celcoin.com.br/reference/consultar-webhooks)
24.   [Configure post webhooks](https://developers.celcoin.com.br/reference/configurar-webhooks)
25.   [Vehicle Debts](https://developers.celcoin.com.br/reference/api-de-d%C3%A9bitos-veiculares)
26.   [Webhook](https://developers.celcoin.com.br/reference/webhook)
27.   [Return registered URL for receiving notifications via Webhook get](https://developers.celcoin.com.br/reference/retorna-a-url-registrada-para-recebimento-de-notifica%C3%A7%C3%B5es-via-webhook)
28.   [Register Webhook With Token - JWT post](https://developers.celcoin.com.br/reference/registrar-webhook-com-token-jwt)
29.   [Register URL to receive notifications via Webhook post](https://developers.celcoin.com.br/reference/registra-uma-url-para-recebimento-de-notifica%C3%A7%C3%B5es-via-webhook)
30.   [Payment](https://developers.celcoin.com.br/reference/pagamento)
31.   [Make post payment](https://developers.celcoin.com.br/reference/cria-um-pedido-de-pagamento-ass%C3%ADncrono-para-uma-lista-de-d%C3%A9bitos)
32.   [Plate Enrichment](https://developers.celcoin.com.br/reference/enriquecimento-de-placas)
33.   [Query Enriched Data of a Post Vehicle](https://developers.celcoin.com.br/reference/consultar-dados-enriquecidos-de-um-veiculo)
34.   [Consultation](https://developers.celcoin.com.br/reference/consultas)
35.   [Check Debts of a Post Vehicle](https://developers.celcoin.com.br/reference/criar-pedido-ass%C3%ADncrono-de-uma-de-d%C3%A9bito-veiculares)
36.   [Issuing of Bills](https://developers.celcoin.com.br/reference/emiss%C3%A3o-de-boletos)
37.   [Gestão de Baixas](https://developers.celcoin.com.br/reference/gestao-baixa)
38.   [Consulta de Baixa get](https://developers.celcoin.com.br/reference/consulta-baixa)
39.   [Inclusão de Baixa (Cancelamento)post](https://developers.celcoin.com.br/reference/inclusao-baixa)
40.   [Gestão de Boletos](https://developers.celcoin.com.br/reference/gestao-boletos)
41.   [Consulta de boleto por Id get](https://developers.celcoin.com.br/reference/consulta-boleto-id)
42.   [Consulta de boletos com paginação get](https://developers.celcoin.com.br/reference/consulta-boleto-paginacao)
43.   [Emissão de Boleto post](https://developers.celcoin.com.br/reference/emissao-boleto)
44.   [Gestão de Beneficiários](https://developers.celcoin.com.br/reference/gestao-beneficiario)
45.   [Consulta de Beneficiário get](https://developers.celcoin.com.br/reference/consulta-beneficiario)
46.   [Inclusão de Beneficiário post](https://developers.celcoin.com.br/reference/inclusao-beneficiario)
47.   [Gestão de Carteiras](https://developers.celcoin.com.br/reference/gestao-carteira)
48.   [Consulta de todas as Carteiras get](https://developers.celcoin.com.br/reference/consulta-todas-carteiras)
49.   [Exclusão de carteira del](https://developers.celcoin.com.br/reference/exclusao-carteira)
50.   [Alteração de Carteira patch](https://developers.celcoin.com.br/reference/alteracao-carteira)
51.   [Consulta de Carteira por código/ID get](https://developers.celcoin.com.br/reference/consulta-carteira-id)
52.   [Inclusão de Carteira post](https://developers.celcoin.com.br/reference/inclusao-carteira)
53.   [Bill payment](https://developers.celcoin.com.br/reference/pagamento-de-contas-3)
54.   [Pagamentos - Obter comprovante de uma transação get](https://developers.celcoin.com.br/reference/obter-um-comprovante-de-uma-transa%C3%A7%C3%A3o-1-1)
55.   [Reverter uma transação de pagamento de contas efetuada del](https://developers.celcoin.com.br/reference/estornar-uma-transa%C3%A7%C3%A3o-de-pagamento-de-contas-efetuada)
56.   [Cancelar uma reserva realizada del](https://developers.celcoin.com.br/reference/cancela-a-transa%C3%A7%C3%A3o-de-pagamento-de-contas-efetuada)
57.   [Check occurrences of a get payment](https://developers.celcoin.com.br/reference/consulta-lista-de-ocorr%C3%AAncias)
58.   [Querying the status of a get transaction](https://developers.celcoin.com.br/reference/consultar-informa%C3%A7%C3%B5es-de-um-pagamento)
59.   [Confirm payment of a put account](https://developers.celcoin.com.br/reference/confirmar-o-pagamento-de-uma-conta)
60.   [Reserve a balance to pay a post bill](https://developers.celcoin.com.br/reference/efetuar-um-pagamento)
61.   [Consult the data of a post account](https://developers.celcoin.com.br/reference/pagamento-de-contas-2)
62.   [Automatic Pix](https://developers.celcoin.com.br/reference/pix-autom%C3%A1tico)
63.   [Receiving Journey](https://developers.celcoin.com.br/reference/jornada-recebedora-1)
64.   [Create a recurrence with post 2](https://developers.celcoin.com.br/reference/crie-uma-recorr%C3%AAncia-com-a-jornada-2-1)
65.   [Create a recurrence with journey 1 post](https://developers.celcoin.com.br/reference/crie-uma-recorr%C3%AAncia-com-a-jornada-1-1)
66.   [Paying Journey](https://developers.celcoin.com.br/reference/jornada-pagadora-copy-2)
67.   [Canceling an appointment get](https://developers.celcoin.com.br/reference/cancelamento-de-agendamento-1)
68.   [Post Authorization Cancellation](https://developers.celcoin.com.br/reference/cancelamento-de-autoriza%C3%A7%C3%A3o-1)
69.   [Search for a recurrence by get ID](https://developers.celcoin.com.br/reference/busca-uma-recorr%C3%AAncia-pelo-id-1)
70.   [Search for recurrences by status with get pagination](https://developers.celcoin.com.br/reference/busca-recorr%C3%AAncias-por-status-com-pagina%C3%A7%C3%A3o-1)
71.   [Refuse a patch recurrence](https://developers.celcoin.com.br/reference/recusa-uma-recorr%C3%AAncia-1)
72.   [Accepts a patch recurrence](https://developers.celcoin.com.br/reference/aceita-uma-recorr%C3%AAncia-3)
73.   [Accepts a post recurrence](https://developers.celcoin.com.br/reference/aceita-uma-recorr%C3%AAncia-2)
74.   [Pix-in](https://developers.celcoin.com.br/reference/pix-in)
75.   [Cash-in return](https://developers.celcoin.com.br/reference/devolu%C3%A7%C3%A3o-de-recebimento)
76.   [Check the status of a Pix receipt return created get](https://developers.celcoin.com.br/reference/consulta-status-de-devolucao)
77.   [Criar uma devolução de um recebimento Pix via TransactionId post](https://developers.celcoin.com.br/reference/devolver-um-pagamento-pix-recebido)
78.   [Pix Receipts](https://developers.celcoin.com.br/reference/receivement)
79.   [Check the status of a Pix Receipt - Enriched Version (V2) get](https://developers.celcoin.com.br/reference/consulta-o-status-de-um-recebimento-pix-v2)
80.   [Check the status of a Pix receipt](https://developers.celcoin.com.br/reference/consulta-o-status-de-um-recebimento-pix)
81.   [Collection with due date (COBV)](https://developers.celcoin.com.br/reference/cobranca-imediata-cobv-duedate)
82.   [Deletar uma cobrança com vencimento del](https://developers.celcoin.com.br/reference/deletar-uma-cobranca-com-vencimento-cobv)
83.   [Loads, validates and parses the json payload of a Due Payment (COBV) get](https://developers.celcoin.com.br/reference/carrega-valida-e-analisa-uma-cobranca-com-vencimento-cobv)
84.   [Unlink due date charge from a QR Code location patch](https://developers.celcoin.com.br/reference/desvincular-cobranca-com-vencimento-e-qrcode-location)
85.   [Search for data for a charge with due date get](https://developers.celcoin.com.br/reference/buscar-uma-cobranca-com-vencimento-v2)
86.   [Update data for a charge with put maturity](https://developers.celcoin.com.br/reference/atualizar-dados-de-uma-cobranca-com-vencimento-cobv)
87.   [Create a billing with post due date](https://developers.celcoin.com.br/reference/criar-cobranca-com-vencimento-cobv)
88.   [Immediate collection (COB)](https://developers.celcoin.com.br/reference/cobranca-imediata-com-qrcode-immediate)
89.   [Deletar uma cobrança imediata del](https://developers.celcoin.com.br/reference/deletar-uma-cobranca-imediata)
90.   [Loads, validates and parses the json payload of an Immediate Charge (COB) get](https://developers.celcoin.com.br/reference/carrega-valida-e-analisa-uma-cobranca-imediata-cob)
91.   [Unlink immediate charge from a BRCode Location patch](https://developers.celcoin.com.br/reference/desvincular-cobranca-imediata-e-qrcode-location)
92.   [Search for data from an immediate charge get](https://developers.celcoin.com.br/reference/buscar-dados-de-uma-cobranca-imediata-v2)
93.   [Update data for an immediate put charge](https://developers.celcoin.com.br/reference/atualizar-dados-de-uma-cobranca-imediata)
94.   [Create new immediate charge post](https://developers.celcoin.com.br/reference/criar-uma-cobranca-imediata)
95.   [QR Code (Location)](https://developers.celcoin.com.br/reference/qrcode)
96.   [Retrieves a base64 image representing a dynamic QR Code Location get](https://developers.celcoin.com.br/reference/recupera-imagem-de-um-qrcode-location-dinamico)
97.   [Returns the data from a QR Code location get](https://developers.celcoin.com.br/reference/retorna-dados-de-um-qrcode-location)
98.   [Create a QR Code (location) post](https://developers.celcoin.com.br/reference/criar-um-qrcode-location)
99.   [Static charging](https://developers.celcoin.com.br/reference/cobran%C3%A7a-est%C3%A1tica-1)
100.   [Deleta um QR code estático del](https://developers.celcoin.com.br/reference/deleta-um-qr-code-est%C3%A1tico)
101.   [Return data from static QR Code and payments received get](https://developers.celcoin.com.br/reference/consultar-dados-do-qrcode-estatico-e-pagamentos-recebidos)
102.   [Retrieves a base64 image representing a static QR Code get](https://developers.celcoin.com.br/reference/recupera-imagem-de-um-qrcode-estatico)
103.   [Return data from a static QR Code. get](https://developers.celcoin.com.br/reference/retorna-os-dados-de-um-qrcode-estatico)
104.   [Create a static QR Code post](https://developers.celcoin.com.br/reference/criar-um-qrcode-estatico)
105.   [Dynamic billing](https://developers.celcoin.com.br/reference/cobranca-dinamica-dynamic)
106.   [Deletar um QR Code dinâmico del](https://developers.celcoin.com.br/reference/deletar-um-qrcode-dinamico)
107.   [Loads, validates and parses the json payload from the post URL](https://developers.celcoin.com.br/reference/carrega-valida-e-parseia-o-json-do-payload-da-url)
108.   [Retrieves a base64 image representing a dynamic QR Code get](https://developers.celcoin.com.br/reference/recupera-imagem-de-um-qrcode-dinamico)
109.   [Update dynamic QR Code put](https://developers.celcoin.com.br/reference/atualizar-um-qrcode-dinamico)
110.   [Fetch data from a dynamic charge get](https://developers.celcoin.com.br/reference/buscar-dados-de-uma-cobranca-dinamica-dynamic)
111.   [Create a dynamic QR Code post](https://developers.celcoin.com.br/reference/criar-um-qrcode-dinamico-dynamic)
112.   [Pix-out](https://developers.celcoin.com.br/reference/api-para-pix)
113.   [ITP (Payment Transaction Initiation)](https://developers.celcoin.com.br/reference/itp-inicia%C3%A7%C3%A3o-de-transa%C3%A7%C3%A3o-de-pagamento)
114.   [Edit Setup of a Pix ITP put](https://developers.celcoin.com.br/reference/editar-setup-de-um-pix-itp)
115.   [Create a Pix ITP post setup](https://developers.celcoin.com.br/reference/criar-setup-de-um-pix-itp)
116.   [Create a Pix ITP post](https://developers.celcoin.com.br/reference/criar-um-pix-itp)
117.   [Cash-out refund](https://developers.celcoin.com.br/reference/estorno)
118.   [Check a Pix payment refund received](https://developers.celcoin.com.br/reference/consulta-o-status-de-uma-devolu%C3%A7%C3%A3o-de-pagamento-pix)
119.   [Payment with Pix](https://developers.celcoin.com.br/reference/iniciar-uma-transacao-pix)
120.   [Return information from a QRCode via EMV post](https://developers.celcoin.com.br/reference/retornar-informa%C3%A7%C3%B5es-do-qr-code-a-partir-de-um-emv-full)
121.   [Check the status of a Pix payment - Enriched Version (V2) get](https://developers.celcoin.com.br/reference/verificar-o-status-de-um-pagamento-pix-v2)
122.   [Check the status of a Pix payment get](https://developers.celcoin.com.br/reference/verificar-o-status-de-um-pagamento-pix)
123.   [Start Pix post payment](https://developers.celcoin.com.br/reference/iniciar-pagamento-ou-transferencia-pix)
124.   [Participant](https://developers.celcoin.com.br/reference/participante)
125.   [List Pix get participants](https://developers.celcoin.com.br/reference/consulta-participante-do-pix)
126.   [DICT (Directory of Transactional Account Identifiers)](https://developers.celcoin.com.br/reference/dict-diret%C3%B3rio-de-identificadores-de-contas-transacionais-1)
127.   [Perform key or person statistics search get](https://developers.celcoin.com.br/reference/realizar-busca-das-estat%C3%ADsticas-de-chave-ou-de-pessoa)
128.   [Return information from the DICT using a key registered in Pix post](https://developers.celcoin.com.br/reference/consulta-dados-bancarios-de-uma-chave-pix)
129.   [Top-ups](https://developers.celcoin.com.br/reference/recargas-1)
130.   [Recargas - Obter comprovante de uma transação get](https://developers.celcoin.com.br/reference/obter-um-comprovante-de-uma-transa%C3%A7%C3%A3o-1)
131.   [Find carrier from a phone number get](https://developers.celcoin.com.br/reference/buscar-operadora-a-partir-de-um-n%C3%BAmero-de-telefone)
132.   [Cancelar transação de recarga efetuada del](https://developers.celcoin.com.br/reference/cancela-uma-transa%C3%A7%C3%A3o-de-recarga-efetuada)
133.   [Check information about a get recharge](https://developers.celcoin.com.br/reference/consultar-informa%C3%A7%C3%B5es-de-uma-recarga)
134.   [Confirm a put top-up transaction](https://developers.celcoin.com.br/reference/confirma-uma-recarga)
135.   [Reserve balance to carry out post recharge](https://developers.celcoin.com.br/reference/reserva-saldo-para-realizar-recarga)
136.   [Check operating values for an operator or provider get](https://developers.celcoin.com.br/reference/consulta-valores-operacionais)
137.   [List get operators](https://developers.celcoin.com.br/reference/retorna-a-lista-de-operadoras)
138.   [Physical withdrawals and deposits](https://developers.celcoin.com.br/reference/transa%C3%A7%C3%B5es-eletr%C3%B4nicas)
139.   [Cancela um token para saque no caixa 24h del](https://developers.celcoin.com.br/reference/cancela-um-token-para-saque-no-caixa-24h)
140.   [Generate token for withdrawal at 24h post ATM](https://developers.celcoin.com.br/reference/efetua-um-saque-eletr%C3%B4nico-com-token)
141.   [Make electronic withdrawal with Qrcode post](https://developers.celcoin.com.br/reference/efetua-um-saque-eletr%C3%B4nico)
142.   [Make a deposit at a 24-hour post office ATM](https://developers.celcoin.com.br/reference/efetua-um-deposito-eletr%C3%B4nico)
143.   [Check nearby service points](https://developers.celcoin.com.br/reference/consulta-pontos-de-atendimentos-pr%C3%B3ximos)
144.   [Return list of Partners get](https://developers.celcoin.com.br/reference/retorna-lista-de-parceiros)
145.   [TED](https://developers.celcoin.com.br/reference/transf%C3%AArencia-banc%C3%A1ria)
146.   [Checking the status of a TED get](https://developers.celcoin.com.br/reference/consulta-o-status-de-uma-transfer%C3%AAncia)
147.   [Make a TED post](https://developers.celcoin.com.br/reference/efetuar-uma-transfer%C3%AAncia-banc%C3%A1ria)
148.   [Webhooks Registration](https://developers.celcoin.com.br/reference/cadastro-de-webhooks)

1.   CEL_BRICKS WEBHOOKS
2.   [Webhook Manager](https://developers.celcoin.com.br/reference/webhook-manager)
3.   [Check registered Webhooks. get](https://developers.celcoin.com.br/reference/consultar-webhooks-cadastrados-common)
4.   [Edit registered Webhook. put](https://developers.celcoin.com.br/reference/editar-webhook-cadastrado-common)
5.   [Excluir Webhook cadastrado.del](https://developers.celcoin.com.br/reference/excluir-webhook-cadastrado-common)
6.   [Check the number of webhooks sent. get](https://developers.celcoin.com.br/reference/consultar-quantidade-de-webhooks-enviados-common)
7.   [View details of sent webhooks. get](https://developers.celcoin.com.br/reference/consultar-detalhes-dos-webhooks-enviados-common)
8.   [Resending pending put webhooks](https://developers.celcoin.com.br/reference/reenvio-de-webhooks-pendentes-common)
9.   [Register Webhook post](https://developers.celcoin.com.br/reference/cadastrar-webhook-common)

1.   Pix Indirect Participant
2.   [Automatic Pix](https://developers.celcoin.com.br/reference/pix-autom%C3%A1tico-copy-2)
3.   [Receiving Journey](https://developers.celcoin.com.br/reference/jornada-recebedora-copy-1)
4.   [Create a recurrence with post 2](https://developers.celcoin.com.br/reference/crie-uma-recorr%C3%AAncia-com-a-jornada-2)
5.   [Create a recurrence with journey 1 post](https://developers.celcoin.com.br/reference/crie-uma-recorr%C3%AAncia-com-a-jornada-1)
6.   [Paying Journey](https://developers.celcoin.com.br/reference/jornada-pagadora-copy-1)
7.   [Recusa uma recorrência jornada tipo 1 patch](https://developers.celcoin.com.br/reference/recusa-uma-recorr%C3%AAncia-jornada-tipo-1)
8.   [Aceita recorrência jornada tipo 1 patch](https://developers.celcoin.com.br/reference/aceita-recorr%C3%AAncia-jornada-tipo-1)
9.   [Aceita recorrência para jornadas 2 e 4 post](https://developers.celcoin.com.br/reference/aceita-recorr%C3%AAncia-para-jornadas-2-e-4)
10.   [Post appointment cancellation](https://developers.celcoin.com.br/reference/cancelamento-de-agendamento)
11.   [Post Authorization Cancellation](https://developers.celcoin.com.br/reference/cancelamento-de-autoriza%C3%A7%C3%A3o)
12.   [Search for a recurrence by get ID](https://developers.celcoin.com.br/reference/busca-uma-recorr%C3%AAncia-pelo-id)
13.   [Receiving with Pix](https://developers.celcoin.com.br/reference/recebimentos-indireto)
14.   [Check the status of a Pix Receipt - Enriched Version (V2) get](https://developers.celcoin.com.br/reference/consulta-o-status-de-um-recebimento-pix-vers%C3%A3o-enriquecida-v2-indireto)
15.   [Check the status of a Pix receipt](https://developers.celcoin.com.br/reference/consulta-o-status-de-um-recebimento-pix-indireto)
16.   [Payment with Pix](https://developers.celcoin.com.br/reference/pagamento-com-pix-indireto)
17.   [Return QR Code information from an EMV post](https://developers.celcoin.com.br/reference/retornar-informa%C3%A7%C3%B5es-do-qr-code-a-partir-de-um-emv-indireto)
18.   [Check the status of a Pix payment - Enriched Version (V2) get](https://developers.celcoin.com.br/reference/verificar-o-status-de-um-pagamento-pix-vers%C3%A3o-enriquecida-v2-indireto)
19.   [Check the status of a Pix payment get](https://developers.celcoin.com.br/reference/verificar-o-status-de-um-pagamento-pix-indireto)
20.   [Start Pix post payment](https://developers.celcoin.com.br/reference/iniciar-pagamento-pix-indireto)
21.   [Generate endToEndId to initiate a post payment](https://developers.celcoin.com.br/reference/gerar-endtoendid-para-iniciar-um-pagamento-indireto)
22.   [Return](https://developers.celcoin.com.br/reference/devolu%C3%A7%C3%A3o-copy)
23.   [Check the status of a return receipt](https://developers.celcoin.com.br/reference/consulta-o-status-do-recebimento-de-uma-devolu%C3%A7%C3%A3o-copy)
24.   [Check the status of a Pix return](https://developers.celcoin.com.br/reference/consulta-o-status-de-uma-devolu%C3%A7%C3%A3o-pix-copy-1)
25.   [Criar devolução via endToEndId post](https://developers.celcoin.com.br/reference/criar-devolu%C3%A7%C3%A3o-via-e2e)
26.   [Create a refund for a Pix received post](https://developers.celcoin.com.br/reference/criar-devolu%C3%A7%C3%A3o-estorno-de-um-pix-recebido-copy)
27.   [DICT (Directory of Transactional Account Identifiers)](https://developers.celcoin.com.br/reference/dict-diret%C3%B3rio-de-identificadores-de-contas-transacionais-indireto)
28.   [Marcação de fraude](https://developers.celcoin.com.br/reference/marca%C3%A7%C3%A3o-de-fraude)
29.   [Consulta detalhes da marcação de fraude get](https://developers.celcoin.com.br/reference/consulta-detalhes-da-marca%C3%A7%C3%A3o-de-fraude)
30.   [Cria marcação de fraude post](https://developers.celcoin.com.br/reference/cria-marca%C3%A7%C3%A3o-de-fraude)
31.   [Cancela marcação de fraude del](https://developers.celcoin.com.br/reference/cancela-marca%C3%A7%C3%A3o-de-fraude)
32.   [Special Return Mechanism - MED](https://developers.celcoin.com.br/reference/mecanismo-especial-de-devolu%C3%A7%C3%A3o-med)
33.   [List get return requests](https://developers.celcoin.com.br/reference/lista-solicita%C3%A7%C3%B5es-de-devolu%C3%A7%C3%A3o)
34.   [Close post return request](https://developers.celcoin.com.br/reference/fechar-solicita%C3%A7%C3%A3o-de-devolu%C3%A7%C3%A3o-indireto)
35.   [Cancel post return request](https://developers.celcoin.com.br/reference/cancelar-solicita%C3%A7%C3%A3o-devolu%C3%A7%C3%A3o-indireto)
36.   [Query the request for a get return](https://developers.celcoin.com.br/reference/consultar-solicita%C3%A7%C3%A3o-de-devolu%C3%A7%C3%A3o-indireto)
37.   [Create post return request](https://developers.celcoin.com.br/reference/criar-solicita%C3%A7%C3%A3o-de-devolu%C3%A7%C3%A3o-indireto)
38.   [Infractions](https://developers.celcoin.com.br/reference/infractions)
39.   [List of infractions for Indirect participants get](https://developers.celcoin.com.br/reference/lista-infra%C3%A7%C3%B5es-para-participantes-indiretos)
40.   [Closing a violation report for a post transaction](https://developers.celcoin.com.br/reference/fechar-um-relato-de-infra%C3%A7%C3%A3o-indireto)
41.   [Cancel a violation report for a post transaction](https://developers.celcoin.com.br/reference/cancelar-um-relato-de-infra%C3%A7%C3%A3o-indireto)
42.   [View a Violation Report for a get transaction](https://developers.celcoin.com.br/reference/consultar-relato-infra%C3%A7%C3%A3o-indireto)
43.   [Create a violation report for a post transaction](https://developers.celcoin.com.br/reference/criar-um-relato-de-infra%C3%A7%C3%A3o-indireto)
44.   [Portability and Claim](https://developers.celcoin.com.br/reference/portabilidade-e-reivindica%C3%A7%C3%A3o)
45.   [List portabilities or claims with get pagination](https://developers.celcoin.com.br/reference/lista-reivindicacoes-indireto)
46.   [Query an existing claim get](https://developers.celcoin.com.br/reference/consulta-claim-existente-indireto)
47.   [Confirms a Claim in post resolution process](https://developers.celcoin.com.br/reference/confirma-claim-processo-resolucao-indireto)
48.   [Cancels a Claim in the process of resolution or confirmed by post expiration](https://developers.celcoin.com.br/reference/cancela-solicita%C3%A7%C3%A3o-portabilidade-reivindicacao-chave-dict-indireto)
49.   [Complete the portability request/claim for a DICT key post](https://developers.celcoin.com.br/reference/completa-nova-portabilidade-ou-reivindica%C3%A7%C3%A3o-dict-indireto)
50.   [Register new portability or DICT post claim](https://developers.celcoin.com.br/reference/cadastrar-nova-portabilidade-reivindicacao-dict-indireto)
51.   [Registration, Consultation and Deletion of keys](https://developers.celcoin.com.br/reference/cadastro-consulta-e-dele%C3%A7%C3%A3o-de-chaves)
52.   [Listar todas as chaves pix de um cliente post](https://developers.celcoin.com.br/reference/listar-todas-as-chaves-pix-de-um-cliente)
53.   [Perform key or person statistics search get](https://developers.celcoin.com.br/reference/realizar-busca-das-estat%C3%ADsticas-de-chave-ou-de-pessoa-copy)
54.   [Deleta uma chave Pix del](https://developers.celcoin.com.br/reference/deletar-uma-chave-pix-indireto)
55.   [Checks for the existence of keys in the DICT post](https://developers.celcoin.com.br/reference/verifica-a-existencia-de-chaves-no-dict-indireto)
56.   [Return information from the DICT using a key registered in Pix post](https://developers.celcoin.com.br/reference/retornar-informacoes-do-dict-utilizando-uma-chave-cadastrada-pix-indireto)
57.   [Change a Pix put key](https://developers.celcoin.com.br/reference/alterar-uma-chave-pix-indireto)
58.   [Register a new Pix post key](https://developers.celcoin.com.br/reference/cadastrar-uma-chave-pix-indireto)
59.   [QR Code](https://developers.celcoin.com.br/reference/qr-code-copy)
60.   [Retrieves a base64 image representing a dynamic QR Code Location get](https://developers.celcoin.com.br/reference/recupera-uma-imagem-base64-representando-um-qr-code-location-din%C3%A2mico-copy)
61.   [Deleta um QR code estático del](https://developers.celcoin.com.br/reference/deleta-um-qr-code-est%C3%A1tico-copy)
62.   [Returns the data from a QR Code location get](https://developers.celcoin.com.br/reference/retorna-os-dados-de-um-qr-code-location-copy)
63.   [Create a QR Code (location) post](https://developers.celcoin.com.br/reference/criar-um-qr-code-location-copy)
64.   [Collection with due date (COBV)](https://developers.celcoin.com.br/reference/cobran%C3%A7a-com-vencimento-cobv-copy-copy)
65.   [Loads, validates and parses the json payload of a Due Payment (COBV) get](https://developers.celcoin.com.br/reference/carrega-valida-e-analisa-a-carga-de-json-de-uma-cobran%C3%A7a-com-vencimento-cobv-copy)
66.   [Unlink due date charge from a QR Code location patch](https://developers.celcoin.com.br/reference/desvincular-cobran%C3%A7a-com-vencimento-de-um-qr-code-location-copy)
67.   [Search for data for a charge with due date get](https://developers.celcoin.com.br/reference/buscar-dados-de-uma-cobran%C3%A7a-com-vencimento-copy)
68.   [Deletar uma cobrança com vencimento del](https://developers.celcoin.com.br/reference/deletar-uma-cobran%C3%A7a-com-vencimento-copy)
69.   [Update data for a charge with put maturity](https://developers.celcoin.com.br/reference/atualizar-dados-de-uma-cobran%C3%A7a-com-vencimento-copy)
70.   [Create a billing with post due date](https://developers.celcoin.com.br/reference/criar-cobran%C3%A7a-com-vencimento-copy)
71.   [Immediate collection (COB)](https://developers.celcoin.com.br/reference/cobran%C3%A7a-imediata-cob-copy)
72.   [Loads, validates and parses the json payload of an Immediate Charge (COB) get](https://developers.celcoin.com.br/reference/carrega-valida-e-analisa-a-carga-de-json-de-uma-cobran%C3%A7a-imediata-cob-copy)
73.   [Unlink immediate charge from a BRCode Location patch](https://developers.celcoin.com.br/reference/desvincular-cobran%C3%A7a-imediata-de-um-brcode-location-copy)
74.   [Search for data from an immediate charge get](https://developers.celcoin.com.br/reference/busca-de-dados-de-uma-cobran%C3%A7a-imediata-copy)
75.   [Deletar uma cobrança imediata del](https://developers.celcoin.com.br/reference/deletar-uma-cobran%C3%A7a-imediata-copy)
76.   [Update data for an immediate put charge](https://developers.celcoin.com.br/reference/atualizar-dados-de-uma-cobran%C3%A7a-imediata-copy)
77.   [Create new immediate charge post](https://developers.celcoin.com.br/reference/criar-nova-cobran%C3%A7a-imediata-copy)
78.   [Dynamic billing](https://developers.celcoin.com.br/reference/cobran%C3%A7a-din%C3%A2mica-dynamic-copy)
79.   [Loads, validates and parses the json payload from the post URL](https://developers.celcoin.com.br/reference/carrega-valida-e-parseia-o-json-do-payload-da-url-copy)
80.   [Deletar um QR Code dinâmico del](https://developers.celcoin.com.br/reference/deletar-um-qr-code-din%C3%A2mico-copy)
81.   [Update dynamic QR Code put](https://developers.celcoin.com.br/reference/atualizar-qr-code-din%C3%A2mico-copy)
82.   [Retrieves a base64 image representing a dynamic QR Code get](https://developers.celcoin.com.br/reference/recupera-uma-imagem-base64-representando-um-qr-code-din%C3%A2mico-copy)
83.   [Create a dynamic QR Code post](https://developers.celcoin.com.br/reference/criar-um-qr-code-din%C3%A2mico-copy)
84.   [Static charging](https://developers.celcoin.com.br/reference/cobran%C3%A7a-est%C3%A1tica-copy)
85.   [Return data from static QR Code and payments received get](https://developers.celcoin.com.br/reference/retornar-dados-do-qr-code-est%C3%A1tico-e-os-pagamentos-recebidos-copy)
86.   [Retrieves a base64 image representing a static QR Code get](https://developers.celcoin.com.br/reference/recupera-uma-imagem-base64-representando-um-qr-code-est%C3%A1tico-copy)
87.   [Return data from a static QR Code. get](https://developers.celcoin.com.br/reference/retornar-dados-de-um-qr-code-est%C3%A1tico-copy)
88.   [Create a static QR Code post](https://developers.celcoin.com.br/reference/criar-um-qr-code-est%C3%A1tico-copy)
89.   [Transferência](https://developers.celcoin.com.br/reference/transfer%C3%AAncia)
90.   [Transações fora do SPI - Reporte Bacen post](https://developers.celcoin.com.br/reference/transa%C3%A7%C3%B5es-fora-do-spi-reporte-bacen)
91.   [MED 2.0](https://developers.celcoin.com.br/reference/med-20)
92.   [Atualiza recuperação de valores put](https://developers.celcoin.com.br/reference/atualiza-recupera%C3%A7%C3%A3o-de-valores)
93.   [Consulta grafo de recuperação de valores get](https://developers.celcoin.com.br/reference/consultar-grafo-de-recupera%C3%A7%C3%A3o-de-valores)
94.   [Solicitar devolução de recuperação de valores post](https://developers.celcoin.com.br/reference/solicitar-devolu%C3%A7%C3%A3o-de-recupera%C3%A7%C3%A3o-de-valores)
95.   [Cancelar recuperação de valores post](https://developers.celcoin.com.br/reference/cancelar-recupera%C3%A7%C3%A3o-de-valores)
96.   [Consulta recuperação de valores get](https://developers.celcoin.com.br/reference/consulta-recupera%C3%A7%C3%A3o-de-valores)
97.   [Criar recuperação de valores post](https://developers.celcoin.com.br/reference/criar-recupera%C3%A7%C3%A3o-de-valores)

1.   CEL_CARD
2.   [Faturas](https://developers.celcoin.com.br/reference/fatura)
3.   [Listar faturas da conta.get](https://developers.celcoin.com.br/reference/ef66a3140d227dfbaf44692c4a96c219)
4.   [Busca as transações de uma fatura.get](https://developers.celcoin.com.br/reference/1186cec39b0cbe483a2aa78bc8980b81)
5.   [Relatório de Autorizações](https://developers.celcoin.com.br/reference/authorizations)
6.   [Obtem detalhes de autorizações get](https://developers.celcoin.com.br/reference/51011976cbae03e7a1a71d747cbba12a)
7.   [Autorização de Transações](https://developers.celcoin.com.br/reference/authorizations-1)
8.   [Executa um chargeback post](https://developers.celcoin.com.br/reference/a2e3a99c28775a68eca08d128f4a5a17)
9.   [Simulates a transaction posting](https://developers.celcoin.com.br/reference/72ecce9f06bda6d3887187966bff78a4)
10.   [Card Management](https://developers.celcoin.com.br/reference/cards)
11.   [Reset the Application Transaction Counter (ATC) post](https://developers.celcoin.com.br/reference/43680f82bdeb483c021d7864e8d56299)
12.   [Resets wrong password attempts post](https://developers.celcoin.com.br/reference/0527b4d0bd0025950ee975428460fff4)
13.   [Search customer card information get](https://developers.celcoin.com.br/reference/1e28376240132d6a15935535a5f3cc08)
14.   [Search for the current customer card password get](https://developers.celcoin.com.br/reference/558bd49f128fefadbba81552ac30ed0b)
15.   [Performs the patch card pin change](https://developers.celcoin.com.br/reference/d3dabf62fceb4450a1f1b3e41c121d26)
16.   [Reissue a postcard](https://developers.celcoin.com.br/reference/6127f027ea23497fbfe58913b90ac164)
17.   [Cancel a put card](https://developers.celcoin.com.br/reference/c432ada072f80e15d477f4335330ebf5)
18.   [Unlock a put card](https://developers.celcoin.com.br/reference/1b6d0c5c4ed4fab7761fe8deb979ee2f)
19.   [Block a put card](https://developers.celcoin.com.br/reference/5d8aafa0910cfacf334ebd4f2c6b3627)
20.   [Activate a put card](https://developers.celcoin.com.br/reference/cd2a46ad3a37d495eece564878c03a6a)
21.   [Updates data from a Patch Card](https://developers.celcoin.com.br/reference/dba8b62a17eb693182f099effd290226)
22.   [Get cards list](https://developers.celcoin.com.br/reference/2fb18694a140ed94cc4d6109798a50cb)
23.   [Create post credit/debit cards](https://developers.celcoin.com.br/reference/74263a95ceb5c2ee1655eabbc42f71e0)
24.   [Fetch data from a get card](https://developers.celcoin.com.br/reference/ebf2d0ba4cfd3139f4317acc3cb99892)
25.   [Gestão de Clientes](https://developers.celcoin.com.br/reference/customers)
26.   [Atualiza os dados de um cliente (PF ou PJ)patch](https://developers.celcoin.com.br/reference/8124c843736991279246ab1bef141b0c)
27.   [You get a customer from a specific account by ID. get](https://developers.celcoin.com.br/reference/03b8dc03bafe4e08ae24b87ac92fc82d)
28.   [Gets a customer from a specific account by Document. get](https://developers.celcoin.com.br/reference/b058221a30422c7366c1b6ca71c1091e)
29.   [Lists all customers of a specific account. get](https://developers.celcoin.com.br/reference/286c8dcd0570bfb72f12f2a2f08fbcec)
30.   [Account Management](https://developers.celcoin.com.br/reference/accounts)
31.   [Update the due date of the put invoice](https://developers.celcoin.com.br/reference/3922b57e5840576a579d839859606503)
32.   [Move account from canceled status to normal. post](https://developers.celcoin.com.br/reference/0ad8ba94b912f4c7d815db5f0f1128bf)
33.   [Changes the reported account to canceled status. post](https://developers.celcoin.com.br/reference/0e436897e68c0ed7b880fae43c6a94ae)
34.   [Updates a patch account limit](https://developers.celcoin.com.br/reference/c72fa508ec35413d6404ff2af1fbc1bd)
35.   [Check the limits of a specific account get](https://developers.celcoin.com.br/reference/d39c996d61c57217a767cb463b963a95)
36.   [Create a new post account](https://developers.celcoin.com.br/reference/06a69fbffaf07d9dcf16bf0d99a615be)
37.   [Search for an account by parameters. get](https://developers.celcoin.com.br/reference/25f3feedd3689848716ce768039aecd3)
38.   [Fetches data from a specific account. get](https://developers.celcoin.com.br/reference/1bd7b380132ba7bc27cbcd6050eb1277)
39.   [Gestão de Endereços](https://developers.celcoin.com.br/reference/addresses)
40.   [Lists all addresses for a specific account. get](https://developers.celcoin.com.br/reference/f6c54a8fc31b8f46489be32c4d67a9f5)
41.   [Updates the data of a patch address](https://developers.celcoin.com.br/reference/805bb1a5ac2c7e435ed4d74030d18a93)
42.   [It searches for a single address from a specific account. get](https://developers.celcoin.com.br/reference/eb576bc5e4bbc0ce7f3a440289582ec8)
43.   [Create a new address for a specific post account](https://developers.celcoin.com.br/reference/972cea0493c5ea89395e25fc295908f4)
44.   [Gestão de Telefone](https://developers.celcoin.com.br/reference/phones)
45.   [Update a phone patch](https://developers.celcoin.com.br/reference/e97858b35ae4c23ab6ca936e5272498e)
46.   [Update a get phone](https://developers.celcoin.com.br/reference/3e0908b70f9e30b847d8317b5d514c78)
47.   [Search for phones registered by the get account](https://developers.celcoin.com.br/reference/586f7fdc5d0d3a1f7655342202616809)
48.   [Create a new phone for a specific post account](https://developers.celcoin.com.br/reference/47edc698b196fbfa4f434d4d314c0490)
49.   [Embossing](https://developers.celcoin.com.br/reference/embossing)
50.   [Resend card for post embossing](https://developers.celcoin.com.br/reference/83f302dfb147cea87791708f4e21fa66)
51.   [Updates the embossing address of a patch card](https://developers.celcoin.com.br/reference/8e56eb78821872b29fb69fafb7b63db4)
52.   [Simulation of tracking a postcard](https://developers.celcoin.com.br/reference/c2aaa769f790e27b1e707b8996cfed6b)
53.   [Search for embossing information from a get card](https://developers.celcoin.com.br/reference/d81f1a6565d8b2fd742eaca3e05ca71b)

1.   CEL_CASH - AaaS
2.   [Authentication](https://developers.celcoin.com.br/reference/aaas-autenticacao)
3.   [Generate authentication token post](https://developers.celcoin.com.br/reference/aaas-gerar-token-de-autenticacao)
4.   [Account Management](https://developers.celcoin.com.br/reference/aaas-gestao-de-contas)
5.   [Registering a PJ account post](https://developers.celcoin.com.br/reference/aaas-cadastrar-uma-conta-pj)
6.   [Registering a PF post account](https://developers.celcoin.com.br/reference/aaas-cadastrar-uma-conta-pf)
7.   [Receivables Management](https://developers.celcoin.com.br/reference/aaas-gestao-de-recebiveis)
8.   [Display get contract receivable](https://developers.celcoin.com.br/reference/visualizar-recebivel-de-contrato)
9.   [Display transaction receivable get](https://developers.celcoin.com.br/reference/visualizar-recebivel)
10.   [Request post receivables report](https://developers.celcoin.com.br/reference/aaas-solicitar-relat%C3%B3rio-de-receb%C3%ADveis)
11.   [Reports](https://developers.celcoin.com.br/reference/aaas-relatorios)
12.   [View get report file](https://developers.celcoin.com.br/reference/aaas-visualizar-arquivo-de-relatorio)
13.   [Get requested report status get](https://developers.celcoin.com.br/reference/aaas-buscar-estado-de-relatorio-solicitado)
14.   [Webhooks](https://developers.celcoin.com.br/reference/webhooks-3)
15.   [View get webhook event template](https://developers.celcoin.com.br/reference/aaas-visualizar-template-de-evento-de-webhook)

1.   cel_credit
2.   [Visão Geral](https://developers.celcoin.com.br/reference/visao-geral-1)
3.   [Glossário de Termos Técnicos](https://developers.celcoin.com.br/reference/glossario-de-termos-tecnicos-1)
4.   [Authentication](https://developers.celcoin.com.br/reference/autenticacao-1)
5.   [Obter Token de Autenticação post](https://developers.celcoin.com.br/reference/post_oauth2-token-4)
6.   [Webhook](https://developers.celcoin.com.br/reference/webhook-credit)
7.   [Variaveis Customizadas](https://developers.celcoin.com.br/reference/variaveis-customizadas)
8.   [Tomador | Borrower](https://developers.celcoin.com.br/reference/pessoas-4)
9.   [Pessoa Juridica](https://developers.celcoin.com.br/reference/pessoa-juridica)
10.   [KYC (Know Your Costumer)](https://developers.celcoin.com.br/reference/kyc-know-your-costumer)
11.   [Document](https://developers.celcoin.com.br/reference/documento-1)
12.   [Pessoa Juridica](https://developers.celcoin.com.br/reference/pessoa-juridica-1)
13.   [Pessoa Fisica](https://developers.celcoin.com.br/reference/pessoa-fisica)
14.   [Document](https://developers.celcoin.com.br/reference/documento)
15.   [KYC (Know Your Customer)](https://developers.celcoin.com.br/reference/kyc-credito)
16.   [Pessoa Fisica](https://developers.celcoin.com.br/reference/cadastro-de-tomador-person)
17.   [Solicitação de Crédito (Applications)](https://developers.celcoin.com.br/reference/operacoes-de-credito)
18.   [Consultas, Escriturações e Repasses](https://developers.celcoin.com.br/reference/consultas-escrituracoes-e-repasses)
19.   [Status de Solicitações (Applications)](https://developers.celcoin.com.br/reference/solicita%C3%A7%C3%B5es-applications)
20.   [Tipos de Assinaturas](https://developers.celcoin.com.br/reference/assinaturas)
21.   [Consulta de Assinaturas da CCB](https://developers.celcoin.com.br/reference/consulta-de-assinaturas-da-ccb)
22.   [Assinatura via Envio de PDF (Assinatura Física/Externa)](https://developers.celcoin.com.br/reference/assinatura-via-envio-de-pdf-assinatura-f%C3%ADsicaexterna)
23.   [Assinatura via Cláusula Mandato (Timestamp)](https://developers.celcoin.com.br/reference/assinatura-via-cl%C3%A1usula-mandato-timestamp)
24.   [Modalidades de Assinaturas](https://developers.celcoin.com.br/reference/modalidades-de-assinaturas)
25.   [Consignado Servidores do Exército](https://developers.celcoin.com.br/reference/consignado-servidores-do-exercito)
26.   [Status de Operação](https://developers.celcoin.com.br/reference/status-de-operacao-2)
27.   [Compra com Troco](https://developers.celcoin.com.br/reference/compra-com-troco-1)
28.   [Cadastro de Tomador & Solicitação](https://developers.celcoin.com.br/reference/cadastro-de-tomador-solicitacao)
29.   [Cadastro de Tomador](https://developers.celcoin.com.br/reference/cadastro-de-tomador)
30.   [Simulação de CCB](https://developers.celcoin.com.br/reference/simulacao-de-ccb)
31.   [Margin Consultation](https://developers.celcoin.com.br/reference/consulta-de-margem-4)
32.   [Authentication](https://developers.celcoin.com.br/reference/autenticacao-3)
33.   [Emissão de Crédito consignado](https://developers.celcoin.com.br/reference/emissao-credito-consignado)
34.   [Crédito trabalhador - Leilão](https://developers.celcoin.com.br/reference/credito-trabalhador-leilao)
35.   [Crédito do trabalhador -Sem leilão](https://developers.celcoin.com.br/reference/credito-do-trabalhador-sem-leilao)
36.   [Saque Aniversário FGTS](https://developers.celcoin.com.br/reference/saque-aniversario-fgts)
37.   [Status de Operação](https://developers.celcoin.com.br/reference/status-de-operacao-4)
38.   [Cadastro de Tomador & Solicitação](https://developers.celcoin.com.br/reference/cadastro-de-tomador-solicitacao-2)
39.   [Simulação de CCB](https://developers.celcoin.com.br/reference/simulacao-de-ccb-2)
40.   [Margin Consultation](https://developers.celcoin.com.br/reference/consulta-de-margem-6)
41.   [Authentication](https://developers.celcoin.com.br/reference/autenticacao-5)
42.   [Tipos de solicitações de Crédito](https://developers.celcoin.com.br/reference/solicitacoes-de-credito)
43.   [Criação de CCB — Pagamento de Boleto (BILLET_PAYMENT)](https://developers.celcoin.com.br/reference/copy-of-cria%C3%A7%C3%A3o-de-ccb-pagamento-via-qr-code-pix-emv)
44.   [Criação de CCB — Pagamento via QR Code PIX (EMV)](https://developers.celcoin.com.br/reference/copy-of-origina%C3%A7%C3%A3o-com-m%C3%BAltiplos-assinantes)
45.   [Originação com múltiplos assinantes](https://developers.celcoin.com.br/reference/originacao-com-multiplos-assinantes)
46.   [Originação com pagamento ao tomador](https://developers.celcoin.com.br/reference/originacao-com-pagamento-tomador)
47.   [Originação com Split de Pagamento](https://developers.celcoin.com.br/reference/originacao-com-split-de-pagamento)
48.   [Originação com Boleto de Entrada](https://developers.celcoin.com.br/reference/originacao-com-boleto-de-entrada)
49.   [Consulta Operações de Crédito](https://developers.celcoin.com.br/reference/consulta-opera%C3%A7%C3%B5es-de-cr%C3%A9dito)
50.   [Simulações de Crédito](https://developers.celcoin.com.br/reference/simulacoes-de-credito)
51.   [Cessão de crédito](https://developers.celcoin.com.br/reference/fluxos-de-cessao)

1.   CUSTOMER PANEL
2.   [Tickets](https://developers.celcoin.com.br/reference/painel-tickets)
3.   [Ticket Listing get](https://developers.celcoin.com.br/reference/listar-tickets)

1.   Issuance of Service Invoice
2.   [Business Management](https://developers.celcoin.com.br/reference/gestao-de-empresas)
3.   [Registering a Digital Certificate for the Company post](https://developers.celcoin.com.br/reference/cadastrar-um-certificado-digital)
4.   [Consult a Company get](https://developers.celcoin.com.br/reference/consultar-uma-empresa)
5.   [Registering a Company post](https://developers.celcoin.com.br/reference/cadastrar-uma-empresa)
6.   [Invoice Management](https://developers.celcoin.com.br/reference/gestao-de-nota-fiscal)
7.   [Cancelling the issuance of a post service invoice](https://developers.celcoin.com.br/reference/cancelar-emissao-nota-fiscal-servico)
8.   [Consult Service Invoice get](https://developers.celcoin.com.br/reference/consultar-nota-fiscal-de-servico)
9.   [Issue Post Service Invoice](https://developers.celcoin.com.br/reference/emitir-nota-fiscal-de-servico)

1.   Celcoin - Escrow
2.   [Authentication](https://developers.celcoin.com.br/reference/autentica%C3%A7%C3%A3o)
3.   [Get post authentication token](https://developers.celcoin.com.br/reference/post_oauth2-token-2)
4.   [People](https://developers.celcoin.com.br/reference/pessoas)
5.   [Update person's registration patch](https://developers.celcoin.com.br/reference/patch_escrow-api-persons-person-id)
6.   [Criar uma pessoa do tipo "jurídica"post](https://developers.celcoin.com.br/reference/post_escrow-api-persons2)
7.   [List registered people get](https://developers.celcoin.com.br/reference/get_escrow-api-persons)
8.   [Create a "physical" person post](https://developers.celcoin.com.br/reference/post_escrow-api-persons)
9.   [Upload de Documentos da Pessoa post](https://developers.celcoin.com.br/reference/post_escrow-api-v1-documents-upload)
10.   [Introduction](https://developers.celcoin.com.br/reference/credit-escrow-introducao)
11.   [Accounts](https://developers.celcoin.com.br/reference/contas)
12.   [Check your get account balance](https://developers.celcoin.com.br/reference/get_escrow-api-v1-accounts-account-id-balance)
13.   [Check the status/details of a get transaction](https://developers.celcoin.com.br/reference/get_escrow-api-v1-accounts-account-id-statement-client-code-status)
14.   [View your get account statement](https://developers.celcoin.com.br/reference/get_escrow-api-v1-accounts-account-id-statement)
15.   [View details of an escrow account](https://developers.celcoin.com.br/reference/get_escrow-api-v1-accounts-account-id)
16.   [Lists all registered get accounts](https://developers.celcoin.com.br/reference/get_escrow-api-v1-accounts)
17.   [Create a new post account](https://developers.celcoin.com.br/reference/post_escrow-api-v1-accounts)
18.   [Accounts > Retention](https://developers.celcoin.com.br/reference/contas-reten%C3%A7%C3%A3o)
19.   [Excluir uma retenção del](https://developers.celcoin.com.br/reference/delete_escrow-api-v1-accounts-account-id-deposit-retention-deposit-retention-id)
20.   [Change a patch retention](https://developers.celcoin.com.br/reference/patch_escrow-api-v1-accounts-account-id-deposit-retention-deposit-retention-id)
21.   [List all registered retentions get](https://developers.celcoin.com.br/reference/get_escrow-api-v1-accounts-account-id-deposit-retention)
22.   [Register a post retention](https://developers.celcoin.com.br/reference/post_escrow-api-v1-accounts-account-id-deposit-retention)
23.   [Accounts > Webhook](https://developers.celcoin.com.br/reference/contas-webhook)
24.   [Excluir uma configuração de webhook del](https://developers.celcoin.com.br/reference/delete_escrow-api-v1-accounts-account-id-webhook-configurations-webhook-id)
25.   [Changing a webhook patch configuration](https://developers.celcoin.com.br/reference/patch_escrow-api-v1-accounts-account-id-webhook-configurations-webhook-id)
26.   [List all webhooks registered for a get Account](https://developers.celcoin.com.br/reference/get_escrow-api-v1-accounts-account-id-webhook-configurations)
27.   [Create a webhook post configuration](https://developers.celcoin.com.br/reference/post_escrow-api-v1-accounts-account-id-webhook-configurations)
28.   [List all available webhook entities for get configuration](https://developers.celcoin.com.br/reference/get_escrow-api-v1-webhook-configurations)
29.   [Requests](https://developers.celcoin.com.br/reference/solicita%C3%A7%C3%B5es)
30.   [Check the details of a barcode on a get boleto](https://developers.celcoin.com.br/reference/get_escrow-api-v1-billpayments-bar-code)
31.   [Cancel a put request](https://developers.celcoin.com.br/reference/put_escrow-api-v1-postings-posting-id-cancel)
32.   [Review a put request](https://developers.celcoin.com.br/reference/put_escrow-api-v1-postings-posting-id-review)
33.   [View the details of a request made get](https://developers.celcoin.com.br/reference/get_escrow-api-v1-postings-posting-id)
34.   [List all get requests](https://developers.celcoin.com.br/reference/get_escrow-api-v1-postings)
35.   [Create a post request](https://developers.celcoin.com.br/reference/post_escrow-api-v1-postings)
36.   [Wallets](https://developers.celcoin.com.br/reference/carteiras)
37.   [Archive or unarchive a put wallet](https://developers.celcoin.com.br/reference/put_escrow-api-v1-wallets-wallet-id-archive)
38.   [Changing the details of a patch wallet](https://developers.celcoin.com.br/reference/patch_escrow-api-v1-wallets-wallet-id)
39.   [View the details of a get wallet](https://developers.celcoin.com.br/reference/get_escrow-api-v1-wallets-wallet-id)
40.   [List all get wallets](https://developers.celcoin.com.br/reference/get_escrow-api-v1-wallets)
41.   [Register a new post wallet](https://developers.celcoin.com.br/reference/post_escrow-api-v1-wallets-1)
42.   [Contas > Conta destino](https://developers.celcoin.com.br/reference/contas-conta-destino)
43.   [Alterar uma conta de destino patch](https://developers.celcoin.com.br/reference/patch_escrow-api-v1-accounts-accountid-destinations-accountdestinationid)
44.   [Excluir uma conta de destino del](https://developers.celcoin.com.br/reference/delete_escrow-api-v1-accounts-accountid-destinations-accountdestinationid)
45.   [Criar uma nova conta de destino (transferências)post](https://developers.celcoin.com.br/reference/get_escrow-api-v1-accounts-accountid-destinations)
46.   [Wallets > Charges](https://developers.celcoin.com.br/reference/carteiras-cobran%C3%A7as)
47.   [Consultar uma cobrança (PIX)get](https://developers.celcoin.com.br/reference/get_escrow-api-v1-accounts-account-id-pix-charges-pix-charge-id)
48.   [Cadastrar uma nova cobrança (PIX)post](https://developers.celcoin.com.br/reference/post_escrow-api-v1-accounts-account-id-pix-charges)
49.   [Download a PDF of a get charge](https://developers.celcoin.com.br/reference/get_escrow-api-v1-wallets-wallet-id-charges-charge-id-pdf)
50.   [Excluir uma cobrança del](https://developers.celcoin.com.br/reference/delete_escrow-api-v1-wallets-wallet-id-charges-charge-id)
51.   [View the details of a get charge](https://developers.celcoin.com.br/reference/get_escrow-api-v1-wallets-wallet-id-charges-charge-id)
52.   [List all charges for a get wallet](https://developers.celcoin.com.br/reference/get_escrow-api-v1-wallets-wallet-id-charges)
53.   [Cadastrar Cobrança post](https://developers.celcoin.com.br/reference/post_escrow-api-v1-wallets-wallet-id-charges-1)

1.   OPEN KEYS (ITP Stand-alone)
2.   [Health Check](https://developers.celcoin.com.br/reference/verifica%C3%A7%C3%A3o-de-sa%C3%BAde)
3.   [Get the service status. get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-healthcheck-1)
4.   [Application Management](https://developers.celcoin.com.br/reference/gerenciamento-de-aplica%C3%A7%C3%A3o)
5.   [Create post end user management session](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-applications-applicationid-management-sessions)
6.   [Create post payment journey session](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-applications-applicationid-journeys-journeyid-sessions)
7.   [Update put application](https://developers.celcoin.com.br/reference/put_open-keys-itp-api-v2-applications-applicationid)
8.   [Get app details get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-applications-applicationid)
9.   [List get apps](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-applications)
10.   [Create post application](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-applications)
11.   [Application Accounts](https://developers.celcoin.com.br/reference/contas-da-aplica%C3%A7%C3%A3o)
12.   [Deletar conta credora del](https://developers.celcoin.com.br/reference/delete_open-keys-itp-api-v2-applications-applicationid-accounts-id)
13.   [Detail creditor account get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-applications-applicationid-accounts-id)
14.   [List creditor accounts get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-applications-applicationid-accounts)
15.   [Create a post creditor account](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-applications-applicationid-accounts)
16.   [Application Redirects](https://developers.celcoin.com.br/reference/redirecionamentos-da-aplica%C3%A7%C3%A3o)
17.   [Excluir URL de redirecionamento del](https://developers.celcoin.com.br/reference/delete_open-keys-itp-api-v2-applications-applicationid-redirects-id)
18.   [Get Redirect URL get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-applications-applicationid-redirects-id)
19.   [List get redirect URLs](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-applications-applicationid-redirects)
20.   [Add post redirect URL](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-applications-applicationid-redirects)
21.   [Application Webhooks](https://developers.celcoin.com.br/reference/webhooks-da-aplica%C3%A7%C3%A3o)
22.   [Remover webhook da aplicação del](https://developers.celcoin.com.br/reference/delete_open-keys-itp-api-v2-applications-applicationid-webhooks-id)
23.   [Get webhook from get app](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-applications-applicationid-webhooks-id)
24.   [List get application webhooks](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-applications-applicationid-webhooks)
25.   [Create webhook application post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-applications-applicationid-webhooks)
26.   [Application Settings](https://developers.celcoin.com.br/reference/configura%C3%A7%C3%B5es-da-aplica%C3%A7%C3%A3o)
27.   [List get application settings](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-applications-applicationid-settings)
28.   [Create or update application configuration post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-applications-applicationid-settings)
29.   [Participants](https://developers.celcoin.com.br/reference/participantes-1)
30.   [Gets details of an ITP participating holder. get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-participants-brands-id-1)
31.   [List of participating ITP holders. get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-participants-brands-1)
32.   [Journey Sessions](https://developers.celcoin.com.br/reference/sess%C3%B5es-de-jornada)
33.   [Search for a session of a journey. get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-payments-v4-journeys-sessions-id-1)
34.   [Lists the sessions of a journey. get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-payments-v4-journeys-sessions-1)
35.   [Creates an ITP journey session. post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-payments-v4-journeys-sessions-1)
36.   [JSR Journey Sessions (Journey without Redirection)](https://developers.celcoin.com.br/reference/sess%C3%B5es-de-jornada-jsr-jornada-sem-redirecionamento)
37.   [Check if the registration journey session has expired. get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-enrollments-v2-journeys-sessions-id-verify-expired)
38.   [Search for a registration journey session with internship. get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-enrollments-v2-journeys-sessions-id-stage)
39.   [Searches for a registration journey session, using the external ID sent when creating the session as a reference. get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-enrollments-v2-journeys-sessions-external-externalid-1)
40.   [Updates the bond journey session. patch](https://developers.celcoin.com.br/reference/patch_open-keys-itp-api-v2-enrollments-v2-journeys-sessions-id)
41.   [Search for a registration journey session. get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-enrollments-v2-journeys-sessions-id-1)
42.   [Lists the registration journey sessions. get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-enrollments-v2-journeys-sessions-1)
43.   [Creates an ITP journey session for link. post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-enrollments-v2-journeys-sessions-1)
44.   [JSR Payment Initiation (Journey Without Redirection)](https://developers.celcoin.com.br/reference/inicia%C3%A7%C3%A3o-de-pagamentos-jsr-jornada-sem-redirecionamento)
45.   [Authorizes registration consent. post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-enrollments-v2-payment-initiations-id-authorise)
46.   [Gets FIDO signature options for authentication. post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-enrollments-v2-payment-initiations-id-fido-sign-options)
47.   [You complete the FIDO registration form. post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-enrollments-v2-payment-initiations-id-fido-registration)
48.   [Get FIDO registration options for registration. post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-enrollments-v2-payment-initiations-id-fido-registration-options)
49.   [You get the updated registration payment initiation. get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-enrollments-v2-payment-initiations-id-updated)
50.   [Updates a link payment initiation. patch](https://developers.celcoin.com.br/reference/patch_open-keys-itp-api-v2-enrollments-v2-payment-initiations-id)
51.   [You get a registration payment initiation. get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-enrollments-v2-payment-initiations-id)
52.   [List account links (enrollments). get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-enrollments-v2-payment-initiations)
53.   [Create link (account link). post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-enrollments-v2-payment-initiations)
54.   [Payment Initiation](https://developers.celcoin.com.br/reference/inicia%C3%A7%C3%A3o-de-pagamento)
55.   [Payment Processing. patch](https://developers.celcoin.com.br/reference/patch_open-keys-itp-api-v2-payments-v4-payment-initiation-id-payments-paymentid)
56.   [Payment Processing. patch](https://developers.celcoin.com.br/reference/patch_open-keys-itp-api-v2-payments-v4-payment-initiation-id)
57.   [Payment Processing. get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-payments-v4-payment-initiation-id)
58.   [Payment Processing. get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-payments-v4-payment-initiation)
59.   [Payment Processing. post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-payments-v4-payment-initiation)
60.   [Payment Initiation Management Session](https://developers.celcoin.com.br/reference/sess%C3%A3o-de-gerenciamento-de-inicia%C3%A7%C3%A3o-de-pagamento)
61.   [Get end user management session data. get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-payment-initiation-management-sessions)
62.   [Create end-user management session with URL. post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-payment-initiation-management-sessions)

1.   CEL_OPEN (ITP Stand-alone EN)
2.   [Participants](https://developers.celcoin.com.br/reference/participants)
3.   [Get Open Finance Brasil participant institution brand by ID get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-participants-brands-id)
4.   [List Open Finance Brasil participant institution brands get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-participants-brands)
5.   [JSR Payment Initiation (Journey without Redirection)](https://developers.celcoin.com.br/reference/jsr-payment-initiation-journey-without-redirection)
6.   [Authorizes enrollment consent using FIDO2 signature post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-enrollments-v2-payment-initiation-itp-enrollment-id-authorise)
7.   [Get parameters for FIDO2 authentication.post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-enrollments-v2-payment-initiation-itp-enrollment-id-fido-sign-options)
8.   [Associate FIDO2 credential to account enrollment.post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-enrollments-v2-payment-initiation-itp-enrollment-id-fido-registration)
9.   [Get parameters for FIDO2 credential creation.post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-enrollments-v2-payment-initiation-itp-enrollment-id-fido-registration-options)
10.   [Retrieve enrollment payment initiation details with brand and authorization information get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-enrollments-v2-payment-initiation-id)
11.   [List account links (enrollments).get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-enrollments-v2-payment-initiation)
12.   [Create Open Finance account enrollment for PIX payment initiation post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-enrollments-v2-payment-initiation)
13.   [Payment Initiation](https://developers.celcoin.com.br/reference/payment-initiation)
14.   [Process OAuth2 authorization callback from account holder post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-payment-initiation-callback)
15.   [Execute PIX payment post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-payments-v4-payment-initiation-id-pix)
16.   [Decode PIX EMV string post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-payments-v4-payment-initiation-pix-emv)
17.   [Get PIX payment initiation by ID get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-payments-v4-payment-initiation-id-1)
18.   [List PIX payment initiations with filters get](https://developers.celcoin.com.br/reference/get_open-keys-itp-api-v2-payments-v4-payment-initiation-1)
19.   [Create PIX payment initiation post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-payments-v4-payment-initiation-1)
20.   [Payment Initiation Management Session](https://developers.celcoin.com.br/reference/payment-initiation-management-session)
21.   [Create payment initiation management session post](https://developers.celcoin.com.br/reference/post_open-keys-itp-api-v2-payment-initiation-management-session)

1.   Cartoes-Fatura-Management-Webservice
2.   [fees](https://developers.celcoin.com.br/reference/fees)
3.   [Listar as taxas da fatura get](https://developers.celcoin.com.br/reference/4037b7b64ae54541d939103606a26195)
4.   [Antecipacao](https://developers.celcoin.com.br/reference/antecipacao)
5.   [Cancela uma antecipação de parcela del](https://developers.celcoin.com.br/reference/3a5e850800516cd44363a325591590a0)
6.   [Detalhe uma antecipação de parcela feita get](https://developers.celcoin.com.br/reference/49ed9de3d31b255cf6eae3ba1ea5578a)
7.   [Lista todas as antecipações de parcelas para a conta get](https://developers.celcoin.com.br/reference/f96f7b1e4f23387352d9a3ed887e69aa)
8.   [Simula a antecipação de parcelas para a fatura atual get](https://developers.celcoin.com.br/reference/95df6371f89da3ec38d7784163c34147)
9.   [Cria uma antecipação de parcela post](https://developers.celcoin.com.br/reference/09ae3b3783de57ebc4e6d174bcc805e7)

1.   CEL_CARD - CARD MANAGEMENT
2.   [Cards](https://developers.celcoin.com.br/reference/cards-1)
3.   [Atualiza Pin de um cartão - modo Off post](https://developers.celcoin.com.br/reference/cb82739e8fab4c117d07835793bd44d3)
4.   [Lista os motivos de reemissão do cartão do cliente get](https://developers.celcoin.com.br/reference/1b1a87599d8be1cb9cfe6c7a00154511)
5.   [Lista todos os status de cartão disponíveis get](https://developers.celcoin.com.br/reference/46ce7706da954433a2004ce6738f692f)
6.   [Card Token](https://developers.celcoin.com.br/reference/card-token)
7.   [Executa uma operação no token post](https://developers.celcoin.com.br/reference/aa38c1b3986029d71903cca8c620a197)
8.   [Busca informações do token get](https://developers.celcoin.com.br/reference/75717e4fdd2b82246a43efd923db84cd)
9.   [Transfere um token de um cartão para outro post](https://developers.celcoin.com.br/reference/5705c8985471970e65b4151b7347a294)
10.   [Obtem todos os tokens de um cartão get](https://developers.celcoin.com.br/reference/9f733d4d7454f0f84da4d8c3c9fff212)

We're currently having some issues with our infrastructure. Please check back soon to see if this has been resolved. [Learn more](https://celcoin.statuspage.io/)

© 2026 Celcoin - Todos os direitos reservados

Celcoin.com.br

![Image 3](https://developers.celcoin.com.br/reference)

![Image 4](https://developers.celcoin.com.br/reference)![Image 5](https://developers.celcoin.com.br/reference)

SOLUTIONS

Vehicular Debts

[Vehicle Debit](https://www.celcoin.com.br/solucoes/auto/debito-veicular/)

Billing

[Collection with Pix](https://www.celcoin.com.br/solucoes/cobranca/cobranca-com-pix/)[Recurring Billing](https://www.celcoin.com.br/solucoes/cobranca/cobranca-recorrente/)

[Loan](https://www.celcoin.com.br/solucoes/credit-platform/)

Bill payment

[Invoices and utilities](https://www.celcoin.com.br/solucoes/pagamento-de-contas/boletos-e-concessionarias/)

Withdrawals and Deposits

[Pix Withdrawal and Pix Change](https://www.celcoin.com.br/solucoes/saques-e-depositos/pix-saque-e-pix-troco/)[Banco24Horas Network](https://www.celcoin.com.br/solucoes/saques-e-depositos/rede-banco24horas/)

[Banking as a Service](https://www.celcoin.com.br/solucoes/banking-as-a-service/)

[Corban as a Service](https://www.celcoin.com.br/solucoes/corban-as-a-service/)

Open Banking

[Data Sharing](https://www.celcoin.com.br/solucoes/open-banking/compartilhamento-de-dados/)[Initiation of payments](https://www.celcoin.com.br/solucoes/open-banking/iniciacao-de-pagamentos/)

Top-ups

[Gift Cards](https://www.celcoin.com.br/solucoes/recargas/gift-cards/)[Top-ups](https://www.celcoin.com.br/solucoes/recargas/recarga-de-celular/)[Streaming and prepaid TV top-up](https://www.celcoin.com.br/solucoes/recargas/streaming-e-tv-pre-pago/)[Top-up for 150 countries](https://www.celcoin.com.br/solucoes/recargas/recarga-para-150-paises/)

Transfers

[Pix Cash-out](https://www.celcoin.com.br/solucoes/transferencias/pix-cash-out/)

ENTERPRISE

[About Us](https://www.celcoin.com.br/sobre-a-celcoin/)[News](https://news.celcoin.com.br/)[Work with us](https://jobs.kenoby.com/celcoin)[Financial Statements](https://www.celcoin.com.br/demonstracoes-financeiras/)

DEVELOPER

[Where to start](https://developers.celcoin.com.br/docs)[API Reference](https://developers.celcoin.com.br/reference/integrando-na-celcoin)[Support](https://suporte.celcoin.com.br/hc/pt-br/requests/new?ticket_form_id=4553742630939)[APIs Status](https://developers.celcoin.com.br/page/status-page)

RESOURCES

[Support](https://suporte.celcoin.com.br/hc/pt-br/requests/new?ticket_form_id=4553742630939)[Get in touch](https://www.celcoin.com.br/contato-celcoin/)[Ombudsman](https://www.celcoin.com.br/ouvidoria/)

POLICIES & COMPLIANCE

[Risk Management Policy](https://www.celcoin.com.br/politica-de-gerenciamento-de-riscos-operacionais-e-liquidez/)[Money Laundering Prevention Policy](https://www.celcoin.com.br/politica-de-prevencao-a-lavagem-de-dinheiro-e-ao-financiamento-do-terrorismo-pld-ft/)[Information Security Policy](https://www.celcoin.com.br/politica-de-seguranca-da-informacao-e-seguranca-cibernetica/)[Reporting Channel](https://www.contatoseguro.com.br/)

[USE CASE](https://www.celcoin.com.br/casos-de-uso/)

Celcoin Payment Institution SA – 13.935.893/0001-09 

 Al. Xingu, 350 – Conj 1604 – Alphaville Industrial Barueri – SP – 06455-030

[Cookie settings](https://www.celcoin.com.br/politica-de-cookies/)[Privacy & Terms](https://www.celcoin.com.br/privacidade-e-termos/)[![Image 6](https://developers.celcoin.com.br/reference)](https://www.linkedin.com/company/celcoin-financial-hub/)

[Português](https://developers.celcoin.com.br/reference)

Powered by [Localize](https://localizejs.com/)

[English](https://developers.celcoin.com.br/reference)