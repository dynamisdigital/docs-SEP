# ADR 0017 - Feature flags de providers por ambiente

## Status

Aceito (Sprint 32 — Fase 4)

## Contexto

O SEP integra capacidades externas via Provider Pattern (ADR 0004): KYC, KYB, PLD, assinatura
digital, Pix e escrow. Cada capacidade tem um fake determinístico (dev/test) e um adapter HTTP
skeleton (Celcoin; assinatura = Clicksign por ADR 0013), coberto por WireMock (ADR 0008). A
ativacao real e gated pela Fase 5 (credenciais). Era preciso formalizar a selecao por ambiente,
impedir ativacao acidental de adapter real e padronizar o fail-fast de configuracao — sem criar
mecanismo novo por cima das properties existentes.

## Decisao

### Flags independentes por capacidade (sem flag global)

| Property | Valores aceitos | Default |
|---|---|---|
| `app.kyc.provider` | `fake` \| `celcoin` | `fake` |
| `app.kyb.provider` | `fake` \| `celcoin` | `fake` |
| `app.pld.provider` | `fake` \| `celcoin` | `fake` |
| `app.assinatura.provider` | `fake` \| `clicksign` (**ADR 0013**; `celcoin` NAO e valor aceito) | `fake` |
| `app.pix.provider` | `fake` \| `celcoin` | `fake` |
| `app.escrow.provider` | `fake` \| `celcoin` | `fake` |

- **Rejeitada** flag global (`celcoin.enabled` ou similar): capacidades ativam de forma
  independente, conforme a certificacao sandbox de cada uma (Fase 5).
- Selecao continua por `@ConditionalOnProperty`; `matchIfMissing=true` **somente no fake**.
  Adapter HTTP exige selecao explicita.
- Adjacentes fora deste ADR mantem o mesmo padrao: `app.open-finance.provider` (`fake` default) e
  `app.notificacoes.provider` (`log` default, ADR 0014).

### Matriz por ambiente

| Ambiente | Valor das flags | Observacao |
|---|---|---|
| dev (local) | tudo `fake` | default; sem credencial |
| test (CI) | tudo `fake` | ITs de adapter sobrescrevem base-url para WireMock local via `@DynamicPropertySource` |
| `local-wiremock` | adapters HTTP explicitos + base-urls `localhost` + credenciais ficticias | profile opt-in (Task 32.6); nunca herdado |
| aws-develop / homolog | real por capacidade **apos gate da Fase 5** (credencial sandbox + skeleton confrontado com doc real + smoke controlado) | secrets via ambiente, nunca versionados |
| producao | real por capacidade apos homologacao | rollback = voltar a flag anterior; ver abaixo |

### Fail-fast de configuracao

- **Valor desconhecido** de flag derruba o boot com mensagem clara (property, valor recebido,
  valores aceitos) — `ProviderFlagsValidator` em `shared.integration`. Antes, valor errado
  deixava o port sem bean e o erro aparecia como `NoSuchBeanDefinitionException` no consumidor.
- **Adapter selecionado sem configuracao obrigatoria** (base-url/credencial) falha no construtor
  com `IllegalStateException` citando a property ausente — **nunca** o valor de um segredo.
- Fake nao instancia OAuth/token provider nem exige credencial.

### Rollback e proibicoes

- Rollback de uma capacidade = retornar a flag para o valor anterior (`fake` em ultimo caso) e
  reiniciar; nao ha estado de provider persistido fora dos registros de dominio.
- **Proibido fallback silencioso** (cair para fake em runtime quando o adapter real falha):
  producao com adapter real que falha deve falhar visivel (retry/circuit breaker + alarme), nunca
  degradar para fake — fake em producao mascararia operacoes financeiras.
- Ativacao real segue o procedimento gated por capacidade documentado em
  [`repos/sep-api/INTEGRACOES-PROVIDERS.md`](../repos/sep-api/INTEGRACOES-PROVIDERS.md)
  (credencial -> confronto do skeleton com doc real -> smoke sandbox -> observabilidade ->
  promocao com rollback documentado).

## Consequencias

- Wiring testavel: testes de contexto provam fake default, selecao explicita, falha clara de
  valor desconhecido e fail-fast sem vazamento de segredo.
- A Fase 5 ativa capacidade por capacidade sem tocar codigo (somente flags/secrets por ambiente).
- Divergencia deliberada de nomenclatura (Clicksign vs Celcoin) fica protegida pelo validator:
  `app.assinatura.provider=celcoin` e rejeitado no boot.

## Referencias

- ADR 0004 (Provider Pattern), ADR 0008 (WireMock), ADR 0013 (Clicksign), ADR 0014 (notificacoes).
- PRD-FASE-5 Frente A (gates de ativacao real).
- Spec/steps da Sprint 32.
