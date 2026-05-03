# ADR 0005 - Segregacao Patrimonial via Conta Escrow

## Status

Aceito (2026-04-27)

## Contexto

O produto SEP opera sob a **Resolucao CMN nº 4.656/2018**, que disciplina as Sociedades de Emprestimo entre Pessoas no Brasil. Entre os requisitos nao-negociaveis esta a **segregacao patrimonial**: os recursos de tomadores e credores nao podem se misturar com a conta operacional da plataforma.

Operacionalmente, isso e materializado por **contas escrow**, que separam fundos por proposta/operacao. O ecossistema Celcoin oferece esse capability via API (`POST /escrow/accounts`, `POST /escrow/wallets`, `GET /escrow/accounts/balance`, `GET /escrow/accounts/statement`).

A pergunta arquitetural: modelar `ContaEscrow` desde o inicio ou tratar como afterthought na Epic 15 (Pix)?

## Decisao

Modelar o **modulo `escrow`** desde a **Sprint 1** como modulo transversal de dominio, com as entidades centrais `ContaEscrow`, `Wallet`, `MovimentacaoEscrow`. A interface `EscrowProvider` e declarada vazia na Sprint 1; a implementacao via Celcoin entra na Epic 15 (Pix).

Modulos consumidores: `cobranca`, `credores`, `pix`, `financeiro`. Cada um recebera entidades de escrow via inversao de dependencia, sem acoplar a Celcoin diretamente.

## Alternativas consideradas

- **Modelar escrow apenas na Epic 15**: descartado. Cobranca (Epic 8) ja precisa registrar recebimentos em conta escrow. Modelar depois forcaria refatoracao de Cobranca ja entregue.
- **Tratar escrow como subdominio dentro de `financeiro`**: descartado. Escrow e capacidade transversal usada por multiplos modulos; encapsular em `financeiro` cria acoplamento indesejado.
- **Tratar escrow como capacidade externa "opaca" sem entidades proprias**: descartado. A regulacao exige rastreabilidade de movimentacoes; precisamos das entidades no nosso dominio para auditoria.

## Consequencias

### Positivas
- conformidade regulatoria desde Sprint 1
- Cobranca (Epic 8) e Pix (Epic 15) consomem escrow sem refatoracao tardia
- entidades estao no nosso dominio, permitindo rastreabilidade e auditoria proprias
- trocar provedor de escrow (Celcoin → outro) afeta apenas o `EscrowProvider`

### Negativas
- modela entidades cuja regra de negocio so sera materializada na Epic 15
- adiciona complexidade aparente cedo
- migrations Flyway precisam considerar campos que ainda nao sao usados

### Neutras
- modulo `escrow` ganha responsabilidade clara e nao se mistura com `financeiro`

## Implementacao

- PRD §3.1 (marco regulatorio), §11 (modulo escrow), §19 (estrutura de pacotes inclui `escrow`)
- PRD §25 (Epic 8 e Epic 15 referenciam escrow; Fronteiras explicita escrow como modulo transversal)
- Spec 001, Task 1.8 cria entidades `ContaEscrow`, `Wallet`, `MovimentacaoEscrow` + interface `EscrowProvider`
- Spec 001, V2 do Flyway cria as tabelas

## Referencias

- PRD §3.1, §11, §19, §25
- Spec 001, Task 1.8
- Resolucao CMN nº 4.656/2018
- docs-sep/Aprendizado Celcoin e SEP/Proposta Tecnica - Implementacao SEP via Celcoin BaaS.md
- ADR 0004 (Provider Pattern)
