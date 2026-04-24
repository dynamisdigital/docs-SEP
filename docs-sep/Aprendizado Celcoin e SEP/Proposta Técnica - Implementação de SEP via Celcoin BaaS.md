Este documento detalha a arquitetura técnica e os endpoints necessários para a implementação de uma Sociedade de Empréstimo entre Pessoas (SEP) utilizando a infraestrutura modular de Banking as a Service (BaaS) da Celcoin.

--------------------------------------------------------------------------------
Proposta Técnica: Implementação de SEP via Celcoin BaaS
Uma SEP atua como um "marketplace de crédito", conectando investidores a tomadores sem assumir o risco direto da operação
. Para viabilizar isso, a Celcoin fornece módulos integrados que cobrem desde a validação de identidade até a liquidação financeira
.
1. Arquitetura de Módulos Utilizados
Para o funcionamento de uma SEP focada em empréstimos, a integração deve consumir quatro verticais principais:
cel_onboarding: Validação de KYC (Know Your Customer) e Prevenção à Lavagem de Dinheiro (PLD)
.
cel_credit: Gestão do ciclo de vida do crédito e emissão de títulos (CCB)
.
cel_banking: Gestão de contas digitais e movimentações (Pix/TED)
.
cel_escrow: Segregação de recursos entre investidores e tomadores
.

--------------------------------------------------------------------------------
2. Fluxo Técnico e Endpoints Principais
A. Autenticação (Mandatório)
Toda interação com a API requer um token de acesso de curta duração.
Endpoint: POST /v5/token
Função: Gera o token Bearer via client_id e client_secret fornecidos no processo de homologação
.
B. Onboarding e Verificação de Identidade (KYC)
Essencial para validar investidores (PF) e empresas tomadoras (PJ) antes de qualquer transação
.
Criar Proposta (PF): POST /onboarding/individual
.
Criar Proposta (PJ): POST /onboarding/legal-entity
.
Tecnologias Integradas:
FaceMatch: Compara a selfie com o documento oficial
.
OCR: Extrai dados de RGs e CNHs automaticamente para evitar erros de digitação
.
Background Check: Consulta automática a bases como COAF, INTERPOL e bases governamentais
.
C. Ciclo de Crédito e Formalização
Etapas para transformar uma solicitação em um título executivo legal (CCB)
.
Simulações de Crédito: POST /credit/simulations — Permite ao tomador visualizar taxas e parcelas antes de solicitar
.
Criação de CCB (Cédula de Crédito Bancário): POST /credit/applications — Gera o documento que lastreia o empréstimo, podendo ser configurado para pagamento via Pix ou Boleto
.
Consulta de Assinaturas: GET /credit/signatures — Verifica o status das assinaturas digitais dos avalistas e sócios
.
D. Gestão Financeira (Contas Escrow e Wallets)
Garante a conformidade da SEP ao segregar o dinheiro do investidor até o momento do desembolso
.
Criar Conta Escrow: POST /escrow/accounts — Abertura da conta de custódia
.
Gestão de Carteiras (Wallets): POST /escrow/wallets — Organiza os aportes de diferentes investidores para um mesmo projeto/empresa
.
Consulta de Saldo/Extrato: GET /escrow/accounts/balance e GET /escrow/accounts/statement
.
E. Movimentação e Recebíveis (Cash-in / Cash-out)
Endpoints para desembolsar o crédito e receber o pagamento das parcelas
.
Desembolso (Pix/TED): POST /v5/pix/payment ou POST /v5/ted
.
Emissão de Boletos para Cobrança: POST /v5/billet — Gera os boletos das parcelas mensais para o tomador pagar
.
Split Pix: POST /v5/pix/split — Caso a SEP queira automatizar a divisão do pagamento entre a plataforma e o investidor no momento da entrada
.

--------------------------------------------------------------------------------
3. Informações Técnicas Adicionais
Recurso
Detalhe Técnico
Ambiente de Sandbox
Disponível para testes sem movimentação financeira real, simulando todos os retornos da API
.
Webhooks
O backend da SEP deve implementar receptores para eventos de: proposta_aprovada, assinatura_concluída, pagamento_recebido e transferência_liquidada
.
Segurança
Suporte a mTLS (Mutual TLS) para camadas extras de proteção e idempotência em transações críticas para evitar duplicidade
.
Conformidade
A Celcoin fornece a licença bancária integrada, desonerando a empresa de obter licenças próprias para operar inicialmente
.
4. Próximos Passos para Integração
Qualificação Comercial: Definição dos módulos necessários (ex: Banking + Credit)
.
Acesso ao Developer Hub: Obtenção de credenciais de Sandbox e documentação completa via Swagger/OpenAPI
.
Desenvolvimento e Homologação: Implementação dos fluxos no backend da SEP e validação pela equipe técnica da Celcoin
.