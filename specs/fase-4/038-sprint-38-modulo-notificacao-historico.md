# Spec 038 - Sprint 38 - Modulo de notificacao transversal, historico e canal in-app

## Metadados

- **ID da Spec**: 038
- **Titulo**: Sprint 38 - Tirar a notificacao de dentro do modulo `cobranca`, dar historico
  persistido e idempotencia, criar o canal `IN_APP` e provar o pipeline com **um** gatilho real
- **Status**: **planejada** (criada em 2026-09-01)
- **Fase do produto**: Fase 4 - produto novo (modulo, tabela e endpoints novos); **migration `V61`**.
  **ADR previsto** — ver §Por que esta sprint exige ADR
- **Trilha**: Backend (`sep-api`)
- **Origem**: frente **A** do levantamento de notificacoes de 2026-09-01 — a unica das quatro que nao
  depende de acesso externo
- **Depende de**: nada das sprints 35-37. Toca `identity` (absorve o `EmailService`) e `pix` (o
  gatilho), mas **nao** toca `ApiExceptionHandler` nem a taxonomia de erro, entao corre em paralelo
  com a cadeia P1
- **Desbloqueia**: [`127`](./127-fsprint-27-central-notificacao-web.md) (F-Sprint 27, web) e
  [`219`](./219-msprint-19-central-notificacao-mobile.md) (M-Sprint 19, mobile). Sem esta sprint as
  duas nao tem o que consumir
- **Responsavel principal**: Devs Plenos Backend

## Numeracao

Consome o numero **38**. O backend da Fase 5 estava em 38-41 apos a
[`037`](./037-sprint-37-normalizacao-taxonomia-erro.md); com esta spec **renumera para 39-42**. E o
**sexto** recuo, pelo mesmo precedente aplicado nas sprints 33 a 37.

> **Encerrado em 2026-09-01**: a numeracao passou a ter **faixa reservada por fase** — Fases 1-4 em 0-49, Fase 5 em 50-99 ([`AGENT.md`](../../AGENT.md) §Numeracao de sprint e de spec). Este recuo foi um dos **oito** que o mecanismo antigo produziu, e o mecanismo **nao existe mais**: a Fase 4 cresce dentro da propria faixa sem tocar na Fase 5. O registro acima e historico.

## Objetivo

Medido em 2026-09-01: o `sep-api` tem **71 eventos de dominio** e **tres pontos de envio de
notificacao**. Os tres falam com o tomador, e os tres em momento ruim — regua de cobranca, proposta
de renegociacao e conta bloqueada.

Traduzindo para produto: **o SEP so fala com o tomador para cobrar divida ou avisar que ele perdeu o
acesso.** Ele nao e avisado quando a proposta e aprovada, quando o contrato esta pronto para assinar,
nem quando o dinheiro cai.

Esta sprint **nao resolve isso** — decidir quem e avisado de que e decisao de persona, e personas nao
existem (P2 do [`DIAGNOSTICO-PRODUTO.md`](../../docs-sep/DIAGNOSTICO-PRODUTO.md)). Ela constroi a
capacidade que torna a decisao executavel, e prova o pipeline com **um** gatilho.

## Ancoras verificadas (2026-09-01)

### 1. Sao tres pontos de envio, e so tres

```bash
grep -rn "\.enviar(\|notificationProvider\.\|emailService\." src/main/java --include=*.java \
  | grep -v "port/out\|shared/email/\|adapter/notification"
```

| Ponto | Destinatario | Momento |
|---|---|---|
| `cobranca/application/usecase/EscalarCobrancaUseCase.java:132` | tomador | regua de cobranca (amigavel / firme / final) |
| `cobranca/application/listener/RenegociacaoPropostaListener.java:91` | tomador | proposta de renegociacao |
| `identity/application/service/LockoutService.java:155` | usuario | conta bloqueada |

### 2. Ha DUAS infraestruturas paralelas, com maturidades diferentes

| | `cobranca...NotificationProvider` | `shared.email.EmailService` |
|---|---|---|
| Assinatura | `enviar(Notificacao)` com canal, template, variaveis, `correlationId` | `enviar(para, assunto, corpo)` |
| Resultado | `ResultadoNotificacao` | `void` |
| Template | Thymeleaf versionado | nenhum — string crua |
| Falha | persistida como `EventoCobranca` com motivo | perdida |
| Consumidores | 2 | **1** (`LockoutService`) |
| Alcance | preso dentro de `cobranca` | `shared` |

A completa esta no lugar errado; a que esta no lugar certo e rasa.

### 3. Nao existe historico de notificacao

Nenhuma tabela. O que ha e `evento_cobranca` (`V30`), do dominio cobranca. Consequencia: **nao ha
como saber se uma notificacao foi enviada, reenviar, nem auditar** — e o marco regulatorio do projeto
(CMN 4.656/2018) pede auditoria reforcada de evento operacional.

Ultima migration: **`V60`** (`V60__ampliar_audit_seguranca_tipo_lockout_tentativa.sql`, Sprint 34).
As sprints 35-37 nao acrescentam migration. Esta sprint usa **`V61`**.

### 4. Nao existe preferencia nem opt-out

```bash
grep -rln "optOut\|opt_out\|PreferenciaNotificacao" src/main/java --include=*.java   # vazio
```

O [ADR 0014](../../adr/0014-estrategia-de-notificacoes-transacionais.md) §Consequencias/Neutras
registra que a politica *"precisa de revisao juridica antes de producao"*. Essa revisao **nao esta
pendente em lugar nenhum** — some junto com a da politica de privacidade da F-25.

### 5. `CanalNotificacao` ja preve o crescimento, e o ADR ja o barrou

`cobranca/domain/vo/CanalNotificacao.java` tem `EMAIL` e `SMS`, com docblock declarando que
*"novos canais (push, WhatsApp) ficam fora do escopo desta sprint"*. O ADR 0014 confirma. **Push
continua fora** — depende de Firebase/APNs, mesmo gate externo das lojas (Fase 5).

`IN_APP` **nao** tem esse gate: nao depende de provider externo nenhum.

### 6. O gatilho mais barato ja carrega o destinatario

`pix/domain/event/PixTransferenciaConcluidaEvent.java`:

```java
public record PixTransferenciaConcluidaEvent(
        UUID transferenciaId, UUID contratoId, UUID tomadorId, String externalId) {}
```

Publicado em `pix/application/service/SincronizadorStatusTransferencia.java:91`. **O `tomadorId` vem
no proprio evento** — zero lookup para saber quem notificar.

Comparar com `AporteCredoraFalhouEvent`, que carrega `empresaCredoraId`: notificar exigiria resolver
empresa -> usuario, que e trabalho e decisao (qual usuario da empresa?).

## Decisao tecnica principal — modulo novo, e migracao parcial declarada

### Modulo proprio, nao extensao do `cobranca`

Notificacao e preocupacao transversal: os 71 eventos candidatos moram em 10 modulos. Deixar a
capacidade dentro de `cobranca` obrigaria `credores`, `pix` e `contratos` a depender de `cobranca`
para avisar alguem — acoplamento na direcao errada, contra a decisao de monolito modular vigente.

Entra `notificacao` como 14o modulo, no mesmo formato hexagonal dos outros.

### O `EmailService` e absorvido; a regua de cobranca NAO

Esta e a decisao que mais define o tamanho da sprint.

| | Absorver agora? | Por que |
|---|---|---|
| `shared.email.EmailService` | **Sim** | Um unico consumidor (`LockoutService`), assinatura rasa, sem template, sem historico. Custo baixo, ganho imediato: o e-mail de lockout passa a ter trilha |
| Regua de cobranca | **Nao** | Funciona, tem retry, persiste falha, tem 4 templates e cobertura de teste. Mover e caro e **nao muda nada para o usuario**. Migrar depois, com o modulo ja provado |

**Ao fim desta sprint continuam existindo dois caminhos** — o novo (in-app + email de lockout) e o da
cobranca. Isso e **declarado, nao escondido**: a migracao da cobranca e follow-up nomeado, e a
alternativa (migrar tudo de uma vez) e refatoracao de risco alto sem ganho observavel.

### Perimetro sobre o modelo de destinatario

Alcapao evidente: **para quem uma notificacao e endereçada?**

Se o destinatario for modelado agora como "papel" ou "grupo" (`todos os FINANCEIRO`), a sprint compra
broadcast, resolucao de grupo e fan-out sem ter um caso que exija. Se for modelado so como
`usuario_id`, adicionar grupo depois e migration.

**Decisao: `usuario_id`, e so.** Regra de tres aplicada — hoje ha **um** cenario de grupo
(o backoffice), e ele **ja tem fila de trabalho**, que e a solucao certa para aquele papel. Um
cenario nao autoriza construir.

O perimetro que preserva a opcao: a coluna de destinatario e `usuario_id NOT NULL`, e o fan-out para
grupo — se um dia houver tres cenarios — vira **N linhas**, nao mudanca de esquema.

### Idempotencia por chave de origem

O mesmo evento nao pode gerar duas notificacoes. Reprocesso, retry de webhook e replay de evento sao
todos reais neste projeto (o `pix` tem `PixWebhookEvent` com reprocesso no backoffice).

Padrao ja usado no repo (aporte, chave Pix, cobranca): **chave de idempotencia com unique parcial**.
Aqui a chave e derivada de `(tipo, origem_id, destinatario)` — nao de UUID aleatorio, porque o
produtor e o evento, nao um cliente HTTP.

### Por que esta sprint exige ADR

Define o contrato de uma capacidade transversal que toda sprint futura vai usar: o que e uma
notificacao, quem pode ser destinatario, qual a semantica de canal, e o que acontece quando o envio
falha. Os mesmos criterios do [`AGENT.md`](../../AGENT.md) que a
[`037`](./037-sprint-37-normalizacao-taxonomia-erro.md) invocou.

O ADR **supersede parcialmente o [0014](../../adr/0014-estrategia-de-notificacoes-transacionais.md)**
no recorte de onde a capacidade mora — nao no recorte de provider, que segue valendo.

## Escopo

### Dentro

1. Modulo `notificacao` (domain / application / infrastructure / web), hexagonal como os demais.
2. Migration **`V61`**: tabela de notificacao com destinatario, tipo, canal, estado de leitura,
   payload minimizado, chave de idempotencia com unique parcial e timestamps.
3. `CanalNotificacao` movido para o modulo novo, com `IN_APP` acrescentado. O enum antigo em
   `cobranca.domain.vo` permanece ate a migracao da regua — **duplicacao temporaria declarada**.
4. Endpoints owner-scoped: listar as **minhas** notificacoes (paginado, padrao `Page<T>` ja usado em
   `backoffice`, `cobranca` e `credito`), marcar como lida, contador de nao-lidas.
5. Absorcao do `shared.email.EmailService` — `LockoutService` passa a usar o modulo novo, e o e-mail
   de lockout ganha historico.
6. **Um** gatilho real: `PixTransferenciaConcluidaEvent` -> notificacao `IN_APP` ao tomador
   (§Ancora 6). Prova o pipeline ponta a ponta e entrega o primeiro momento positivo do produto.
7. Idempotencia verificada por teste de replay do evento.
8. Doc operacional do modulo e da politica de retencao.

### Fora

- **Migrar a regua de cobranca** para o modulo novo (§Decisao tecnica principal). Follow-up nomeado.
- **Decidir quais dos 71 eventos notificam.** E a frente **B**, e depende de personas (P2). Esta
  sprint entrega **um** gatilho para provar o pipeline, nao uma politica de cobertura.
- **Preferencias e opt-out.** Frente **C**. Exige a revisao juridica que o ADR 0014 declarou pendente
  — comunicacao obrigatoria de relacao contratual nao e recusavel, marketing e lembrete sao, e a
  fronteira e juridica, nao tecnica.
- **Push.** Frente **D**, gated por Firebase/APNs (Fase 5). O contrato do `IN_APP` nasce compativel
  para nao virar alcapao, mas **nada de push e implementado**.
- **Destinatario por papel ou grupo** (§Perimetro).
- **Notificar o backoffice.** Ele tem fila de trabalho, que e a solucao certa para aquele papel.
  Alarme de item envelhecendo na fila e problema proprio, com SLA proprio.

## Criterios de aceite

1. Contagem de testes **>= baseline do Gate 38.0, 0 falhas**; `clean build` e `spotlessCheck` verdes.
2. Migration `V61` aplica e reverte limpa em base do zero e em base com dados.
3. **Owner-scope provado por teste**: usuario A **nao** enxerga notificacao de B em nenhum dos tres
   endpoints. Este e o teste que impede o pior desfecho desta sprint — vazamento de dado pessoal
   entre contas, num modulo que por definicao carrega contexto de outras jornadas.
4. **Idempotencia provada por replay**: publicar `PixTransferenciaConcluidaEvent` duas vezes com os
   mesmos dados gera **uma** notificacao. Provado com o evento, nao com chamada direta ao repositorio.
5. **Falha de notificacao nao derruba a transacao de dominio.** Provado por teste: com o provider
   lancando, o desembolso continua concluido. E o principio que o ADR 0014 ja fixou para a cobranca,
   e vale igual aqui.
6. **Payload minimizado**: teste provando que a notificacao nao persiste CPF, CNPJ, chave Pix em
   claro nem valor bruto de documento. LGPD, e o mesmo criterio que a Sprint 31 aplicou as chaves Pix.
7. **Mutacao obrigatoria**: remover o filtro de owner-scope tem de reprovar; remover a guarda de
   idempotencia tem de reprovar; trocar o `IN_APP` por `EMAIL` no gatilho tem de reprovar.
8. O e-mail de lockout continua saindo **e** agora aparece no historico — teste cobrindo os dois.

## Riscos e limitacoes

- **Dois caminhos de notificacao ao fim da sprint.** Declarado em §Decisao tecnica principal. O risco
  real nao e a duplicacao; e ela virar permanente. A migracao da regua entra como follow-up nomeado
  no `STATE.md`, nao como intencao.
- **A duplicacao do enum `CanalNotificacao`** e a parte mais feia dessa escolha. Enquanto durar, os
  dois tem de ser mantidos em sincronia por teste, nao por atencao.
- **Esta sprint entrega uma central vazia** ate a frente B decidir a cobertura. Com um gatilho so, a
  maioria dos usuarios nao vera nada. Isso e esperado — mas precisa estar no PR, senao o review cobra
  volume que a sprint deliberadamente nao tem.
- **Retencao nao esta decidida.** Notificacao guarda contexto de jornada; guardar para sempre e
  passivo de LGPD, apagar cedo demais destroi a trilha que o CMN 4.656 pede. O ADR precisa fixar um
  prazo, ainda que provisorio, em vez de omitir.
- **Smoke real contra `:8080` segue gate declarado pendente**, como nas sprints anteriores.
- **O Gate 38.0 provavelmente derruba numero desta spec.** Aconteceu nas cinco anteriores. Em
  particular, a contagem de 71 eventos e de tres pontos de envio veio de `grep`, e a Sprint 36 ja
  provou que `grep` por padrao textual tem ponto cego.

## Rastreabilidade

| Item da spec | Task |
|---|---|
| ADR do modulo de notificacao (supersede parcial do 0014) | 38.1 |
| Modulo `notificacao` + migration `V61` | 38.2 |
| `CanalNotificacao` com `IN_APP`, sincronia com o enum antigo travada por teste | 38.3 |
| Endpoints owner-scoped: listar, marcar lida, contador | 38.4 |
| Absorcao do `EmailService`; lockout com historico | 38.5 |
| Gatilho `PixTransferenciaConcluidaEvent` -> `IN_APP` ao tomador | 38.6 |
| Idempotencia por replay + minimizacao de payload | 38.7 |
| Doc operacional, retencao, follow-up da regua | 38.8 |
| Baseline, contagem de eventos e de pontos de envio | Gate 38.0 e Fechamento |

Abre a frente **A** do levantamento de notificacoes, ao lado da
[`127`](./127-fsprint-27-central-notificacao-web.md) e da
[`219`](./219-msprint-19-central-notificacao-mobile.md).

Steps criados just-in-time em `steps-fase-4/backend/038-sprint-38-steps.md` quando a sprint for
aprovada para execucao.
