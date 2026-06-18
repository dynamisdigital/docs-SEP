# Papel da Celcoin no projeto SEP

## Objetivo

Este documento consolida o papel atribuido a Celcoin no PRD e na implementacao atual do
SEP. Ele serve como base para discussao com Produto, negocio, compliance e arquitetura
sobre uma possivel reducao das responsabilidades da Celcoin.

O conteudo representa a direcao atual do projeto, nao um contrato comercial definitivo.
Qualquer mudanca de fornecedor ou de escopo deve ser confirmada pelo PO e refletida no
PRD, nas ADRs, nas specs e nos documentos operacionais afetados.

## Resumo executivo

A Celcoin foi escolhida inicialmente como provedora de infraestrutura financeira e
regulatoria para cinco grupos de capacidades:

1. KYC de pessoa fisica.
2. KYB de pessoa juridica e identificacao de representantes.
3. Background Check para PLD.
4. Open Finance via Celcoin/Finansystech.
5. Conta escrow e movimentacoes Pix.

Essas capacidades nao tornam a Celcoin dona das regras de negocio do SEP. O SEP continua
responsavel pelas jornadas, estados internos, autorizacao, auditoria, idempotencia,
analise de credito, formalizacao, cobranca, backoffice e experiencia dos usuarios.

O marco regulatorio pode exigir capacidades como KYC/KYB, PLD, segregacao patrimonial e
rastreabilidade. Ele nao obriga, por si so, que a Celcoin seja a fornecedora de todas
elas. A escolha da Celcoin e uma decisao de produto, arquitetura e contratacao.

A arquitetura por Provider Pattern permite manter a Celcoin somente onde houver valor
comercial ou operacional e substituir as demais capacidades por outros fornecedores.

## Capacidades previstas para a Celcoin

| Capacidade | Funcao esperada da Celcoin | Responsabilidade que permanece no SEP | Estado atual |
| --- | --- | --- | --- |
| KYC PF | Receber dados e documentos, executar verificacao de identidade e devolver o resultado da verificacao. A visao inicial do PRD inclui OCR e FaceMatch. | Coletar dados, controlar ownership, armazenar a solicitacao, controlar a maquina de estados, receber callbacks, auditar e decidir como o resultado entra na jornada. | Fluxo e adapter Celcoin implementados e testados com WireMock. Uso real depende de credenciais, contrato e homologacao. |
| KYB PJ | Consultar situacao cadastral da empresa e retornar dados cadastrais e representantes legais. | Manter o cadastro da solicitacao, mascarar dados, controlar estados, autorizacao, auditoria e tratamento operacional. | Fluxo e adapter Celcoin implementados e testados com WireMock. |
| PLD / Background Check | Consultar os alvos definidos pelo SEP e retornar resultados de verificacao. | Definir politica de bloqueio, bases obrigatorias, retencao, exposicao de dados, tratamento de falso positivo, auditoria e decisao final do onboarding. | Fluxo e adapter Celcoin implementados. A politica de PLD ainda exige revisao juridica antes de producao. |
| Open Finance | Criar o consentimento externo, fornecer URL de autorizacao, notificar autorizacao/negacao e disponibilizar o snapshot financeiro. | Controlar o consentimento local, ownership, sanitizacao LGPD, persistencia, calculo do score e reavaliacao da proposta. | Adapter Celcoin/Finansystech implementado e testado com WireMock. |
| Conta escrow | Criar e consultar conta escrow e wallets, alem de consultar saldo operacional. | Modelar contas, wallets e movimentacoes no dominio SEP; garantir correlacao, idempotencia, auditoria e segregacao nas regras internas. | Dominio e port implementados. Adapter Celcoin ainda e um skeleton; o contrato real e o provisionamento completo precisam de homologacao. |
| Pix de desembolso | Executar a transferencia Pix, devolver identificador/status e enviar atualizacoes de liquidacao ou falha. | Validar contrato, agenda, valor e escrow; exigir operador e step-up; impedir duplicidade; registrar eventos, falhas e backoffice. | Fluxo SEP implementado. Adapter Celcoin e skeleton testado contra WireMock, sem contrato real fechado. |
| Pix de recebimento | Criar referencia de cobranca Pix, notificar recebimento e fornecer dados de conciliacao. | Correlacionar o pagamento com a parcela, efetuar a baixa em cobranca, registrar escrow e tratar divergencias. | Fluxo SEP implementado. Adapter Celcoin permanece dependente de validacao do contrato real. |
| Webhooks e autenticacao de integracao | Disponibilizar OAuth2/client credentials e emitir callbacks dos servicos contratados. | Validar HMAC, deduplicar eventos, manter outbox, correlation ID, auditoria e tratamento seguro de falhas. | Infraestrutura implementada por capacidade. |

## O que nao deve ser responsabilidade da Celcoin

Mesmo que a Celcoin ofereca produtos comerciais adicionais, o desenho atual do SEP nao
delega a ela as seguintes responsabilidades:

- cadastro de usuarios, login, JWT, MFA, biometria, RBAC e step-up;
- motor interno de credito, score, parecer e decisao de aprovacao ou rejeicao;
- regras de elegibilidade de propostas e empresas credoras;
- marketplace de oportunidades e formacao da carteira das credoras;
- geracao interna e versionamento do contrato e da CCB;
- assinatura digital, atualmente atribuida a Clicksign pelo ADR 0013;
- calculo de parcelas, juros, multa, inadimplencia e renegociacao;
- baixa contabil e regras internas de cobranca;
- fila de backoffice, comentarios, resolucao de pendencias e reprocessos;
- auditoria regulatoria e retencao de evidencias do SEP;
- interfaces web/mobile e experiencia dos participantes;
- responsabilidade do SEP por suas regras de negocio, controles internos e conformidade.

Uma oferta comercial da Celcoin nao deve ser confundida automaticamente com escopo do
produto. Por exemplo, a Celcoin pode oferecer core de credito, CCB, cobranca ou assinatura,
mas essas capacidades estao implementadas ou planejadas como dominios controlados pelo
SEP e por provedores especificos.

## Diferenca entre capacidade regulatoria e fornecedor

As decisoes devem separar duas perguntas:

1. A capacidade e obrigatoria para o produto ou para a operacao regulada?
2. A Celcoin precisa ser a fornecedora dessa capacidade?

| Necessidade do SEP | Pode ser obrigatoria? | Precisa ser Celcoin? |
| --- | --- | --- |
| KYC/KYB | Sim, conforme enquadramento e politica regulatoria. | Nao. Pode existir outro provider homologado. |
| PLD | Sim, conforme politica aprovada por compliance. | Nao. Pode ser outro provider ou composicao de fontes. |
| Segregacao patrimonial | Sim para o modelo operacional previsto. | Nao necessariamente. Depende do arranjo financeiro e do custodiante contratado. |
| Pix | Necessario para a jornada de desembolso/recebimento definida no produto. | Nao. Outro PSP/BaaS pode implementar `PixProvider`. |
| Open Finance | Nao e requisito para toda proposta; o fluxo atual e opt-in. | Nao. Pode ser removido, adiado ou substituido. |
| Assinatura digital | Necessaria para a formalizacao definida pelo produto. | Nao e Celcoin no desenho atual; o provider escolhido e Clicksign. |

## Cenarios para reduzir o papel da Celcoin

### Cenario A — Celcoin somente como infraestrutura financeira

Manter conta escrow, Pix de desembolso, Pix de recebimento e notificacoes de liquidacao.
Substituir ou retirar KYC/KYB, PLD e Open Finance.

Esse cenario concentra a Celcoin onde existe movimentacao financeira e permite contratar
providers especializados para onboarding e compliance.

### Cenario B — Celcoin somente para onboarding e compliance

Manter KYC, KYB e Background Check/PLD. Substituir escrow, Pix e Open Finance.

Esse cenario usa a Celcoin como provedora cadastral, mas exige outro PSP/BaaS ou parceiro
bancario para movimentacao e segregacao patrimonial.

### Cenario C — Celcoin apenas para Pix

Manter transferencias Pix, cobrancas/referencias Pix e webhooks de liquidacao. Substituir
KYC/KYB, PLD, Open Finance e escrow, caso o novo arranjo permita separar essa capacidade.

Esse recorte depende de uma definicao clara sobre onde ficam as contas segregadas e como
o dinheiro dos participantes sera custodiado.

### Cenario D — Remocao completa da Celcoin

Todas as portas existentes permitem adapters alternativos, mas a remocao completa exige:

- selecionar fornecedores para KYC/KYB, PLD, Open Finance, escrow e Pix;
- validar contratos, webhooks, idempotencia, seguranca e tratamento de erros;
- criar novos adapters e testes de integracao;
- homologar os fluxos ponta a ponta;
- revisar PRD, ADRs, configuracoes, collections e documentacao operacional;
- validar o novo arranjo com juridico e compliance.

O dominio do SEP pode ser preservado. O maior custo fica na integracao e homologacao dos
novos fornecedores.

## Impactos de uma reducao de escopo

| Capacidade retirada da Celcoin | Impacto principal |
| --- | --- |
| KYC/KYB | Contratar e integrar outro provider; revisar payloads, documentos, callbacks e mascaramento. |
| PLD | Redefinir fontes consultadas, politica de hits e evidencias aceitas por compliance. |
| Open Finance | Remover/adiar a reavaliacao por dados bancarios ou integrar outro agregador. |
| Escrow | Decisao critica sobre custodiante, contas segregadas, wallets e reconciliacao financeira. |
| Pix | Novo PSP/BaaS para cash-in/cash-out, cobranca Pix, status e webhooks. |

Reduzir Open Finance tende a ter menor impacto no nucleo do produto porque o fluxo e
opt-in e o motor funciona sem snapshot. Reduzir escrow ou Pix exige uma decisao de
arquitetura financeira mais profunda. Reduzir KYC/KYB ou PLD exige manter as capacidades
com outro fornecedor, salvo decisao formal de compliance que altere o processo.

## Pontos que precisam ser decididos pelo PO

1. Quais produtos da Celcoin estao efetivamente contratados ou em negociacao?
2. A Celcoin sera o parceiro financeiro principal ou apenas um fornecedor de APIs?
3. Quem custodiara os recursos segregados de tomadores e credores?
4. O KYC/KYB sera executado pela Celcoin, por outro fornecedor ou por processo interno?
5. Quem executara PLD e quais fontes serao exigidas por compliance?
6. Open Finance permanece no produto ou deve ser adiado/removido?
7. Pix de desembolso e recebimento permanecera na Celcoin?
8. O produto precisa de conta operacional ou conta digital fornecida pela Celcoin?
9. Quais SLAs, custos por consulta/transacao e limites de volume foram negociados?
10. Quais dados podem ser enviados a cada fornecedor e por quanto tempo serao retidos?

## Recomendacao para a decisao

Registrar a decisao em uma matriz de capacidades:

| Capacidade | Fornecedor escolhido | Obrigatoria no MVP? | Plano alternativo | Responsavel pela homologacao |
| --- | --- | --- | --- | --- |
| KYC PF | A definir | Sim | A definir | A definir |
| KYB PJ | A definir | Sim, se PJ entrar no MVP | A definir | A definir |
| PLD | A definir com compliance | Sim | A definir | A definir |
| Open Finance | A definir | Nao, fluxo opt-in | Remover ou adiar | A definir |
| Escrow | A definir | Sim para movimentacao real | A definir | A definir |
| Pix | A definir | Conforme escopo financeiro do MVP | A definir | A definir |

Depois da aprovacao do PO, atualizar:

1. PRD da fase afetada.
2. ADR 0004 e ADR 0005, caso a estrategia de provider ou escrow mude.
3. Specs e steps das capacidades alteradas.
4. `ONBOARDING.md`, `PLD.md`, `OPEN-FINANCE.md` e `PIX.md`.
5. Configuracoes, collections e testes dos adapters.

## Observacoes sobre o estado tecnico atual

- Onboarding e Open Finance possuem adapters Celcoin implementados, mas producao ainda
  depende de contrato, credenciais e homologacao com o ambiente real.
- Pix e Escrow possuem dominio e fluxos internos implementados, mas os adapters Celcoin
  sao skeletons baseados em contratos simulados por WireMock.
- O `PIX.md` registra que endpoints e campos do skeleton ainda precisam ser validados
  contra o contrato Celcoin fechado.
- A arquitetura usa `Fake<X>Provider` por padrao em desenvolvimento e testes.
- Uma troca de fornecedor exige novos adapters e possivelmente novas rotas de webhook,
  sem obrigar a reescrita do dominio.

## Fontes internas

- [`PRD-FASE-1.md`](./PRD-FASE-1.md) — marco regulatorio, estrategia BaaS e Provider Pattern.
- [`PRD-FASE-2.md`](./PRD-FASE-2.md) — KYC/KYB, PLD e Open Finance.
- [`PRD-FASE-3.md`](./PRD-FASE-3.md) — escrow e Pix.
- [`../adr/0004-provider-pattern-para-integracoes-externas.md`](../adr/0004-provider-pattern-para-integracoes-externas.md).
- [`../adr/0005-segregacao-patrimonial-via-conta-escrow.md`](../adr/0005-segregacao-patrimonial-via-conta-escrow.md).
- [`../adr/0008-wiremock-para-testes-integracao-celcoin.md`](../adr/0008-wiremock-para-testes-integracao-celcoin.md).
- [`../repos/sep-api/ONBOARDING.md`](../repos/sep-api/ONBOARDING.md).
- [`../repos/sep-api/PLD.md`](../repos/sep-api/PLD.md).
- [`../repos/sep-api/OPEN-FINANCE.md`](../repos/sep-api/OPEN-FINANCE.md).
- [`../repos/sep-api/PIX.md`](../repos/sep-api/PIX.md).
- [`../repos/sep-api/CONTRATOS.md`](../repos/sep-api/CONTRATOS.md) — Clicksign como
  provider atual de assinatura digital.
