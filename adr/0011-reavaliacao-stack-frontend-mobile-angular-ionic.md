# ADR 0011 - Reavaliacao da Stack Frontend e Mobile (mantida Angular + Ionic + Capacitor)

## Status

Aceito (2026-04-27). Reafirma e estende [ADR 0003 - Stack Angular 20 + Ionic 8 + Capacitor 6](./0003-stack-angular-20-ionic-8-capacitor-6.md).

## Contexto

Apos os ADRs 0002 (design systems Apple e Notion com SCSS puro), 0003 (stack Angular 20 + Ionic 8.4+ + Capacitor 6) e 0010 (MFA com biometria mobile via Capacitor BiometricAuth) consolidarem a stack frontend e mobile, surgiu o questionamento natural durante o planejamento:

> "Escolhemos Angular + Ionic por compatibilidade, mas seria a melhor opcao? Considerando React + React Native ou Angular + React Native, mesmo que isso acarrete re-planejamento, qual seria a melhor escolha para o SEP?"

O usuario abriu explicitamente espaco para mudanca, com a unica restricao de que o **backend Java permanece inegociavel**. Esta ADR documenta a comparacao tecnica feita e a decisao consciente de **manter** a stack atual.

A questao e relevante porque:
- Bancos digitais brasileiros grandes (Nubank, Mercado Pago, PicPay, Stone) usam React Native em mobile
- React tem mercado de hiring maior (~50K devs no Brasil vs ~17K Angular)
- React Native usa bridge nativa (performance UI superior ao Capacitor/WebView)
- O CONTEXT.md ja registrava (linha 161) que "Flutter e React Native nao foram recomendados nesta fase para evitar nova stack e duplicacao tecnica" — mas essa decisao nunca tinha sido formalmente avaliada com criterios explicitos

## Decisao

**Manter a stack atual: Angular 20.x + Ionic 8.4+ + Capacitor 6** (ja consolidada em [ADR 0003](./0003-stack-angular-20-ionic-8-capacitor-6.md)).

A decisao foi tomada apos analise comparativa formal das alternativas, ponderando criterios alinhados ao contexto especifico do SEP: time pequeno (4 devs), produto fintech tipica (forms/listas/dashboards sem demanda de UI premium), prioridade de reuso entre web e mobile, e necessidade de validacao em PWA antes de submeter para stores.

## Alternativas consideradas

### A. Angular + Ionic + Capacitor 6 (mantida) ⭐

**Pros**: stack unificada Angular dos dois lados; reuso alto (services, DTOs, guards, interceptors compartilhaveis); Capacitor cobre todas as APIs nativas necessarias (biometria, push, camera); Ionic tem componentes mobile-first prontos; PWA-first natural; TypeScript end-to-end; SCSS puro funciona bem; validado em fintechs (Caixa Tem, Inter parcial) e gov BR; time-to-market alto.

**Cons**: performance UI mobile e WebView (nao bridge nativa) — adequada para SEP, mas inferior ao RN em listas longas e animacoes complexas; hiring de devs Ionic e nicho; ecossistema Ionic menor que React Native.

### B. React + React Native (com Expo)

**Pros**: performance UI mobile superior (bridge nativa real); comunidade gigante (#1 e #2 stacks frontend mundiais); Expo simplifica scaffold/build/OTA; React mais simples que Angular (sem RxJS, decorators, DI); validado em Nubank, Mercado Pago, PicPay, Stone; hiring facil.

**Cons**: reuso de UI entre web e mobile e LIMITADO (RN nao usa HTML — `<View>`/`<Text>` em vez de `<div>`/`<span>`); SCSS nao funciona em RN (precisa migrar para NativeWind ou Tamagui); sem PWA nativo no RN — perderia opcao de validar como PWA antes da loja; refactor de ~30 arquivos atuais; 3-4 semanas de re-treino do time se nao fluente em React.

**Quando faria sentido**: time crescendo para 10+ devs, demanda de UI premium, hiring critico de mais 5+ devs, ou time vindo do mundo React.

### C. Angular + React Native ❌ rejeitada

**Por que rejeitar**: pior dos dois mundos. Time aprende DUAS stacks completas; reuso minimo (so types via lib comum); code review cruzado dificil; hiring duplicado; padroes Angular (RxJS, services, DI) nao tem equivalente em RN (hooks, promises). So vale para empresas com 50+ devs e squads independentes — nao e o caso do SEP.

### D. Angular + Capacitor (sem Ionic)

**Por que rejeitar**: perde os componentes Ionic mobile prontos (tab bars, modals full-screen, swipeable, gestos) sem ganho material — continua WebView; nao e padrao de mercado em apps brasileiros; mais codigo SCSS para escrever; sem ganho real vs Angular+Ionic.

### E. Flutter, Native (Swift+Kotlin)

Ja descartadas no PRD. Flutter exige nova stack (Dart) fora do mundo TS; Native dobraria/triplicaria o esforco de mantencao com 3 codebases.

## Criterios de avaliacao usados

| Criterio | Peso | Vencedor |
|----------|------|----------|
| Reuso de codigo web ↔ mobile | Alto | A (mesma stack Angular) |
| Performance UI mobile | Medio | B (bridge nativa) |
| Hiring no Brasil | Alto | B (React #1) |
| Curva de aprendizado | Alto | B (React mais simples; mas A se time ja for fluente) |
| Maturidade do ecossistema mobile | Alto | B (React Native ecosystem) |
| Adequacao ao produto SEP | Alto | A e B empatam (forms/listas) |
| Esforco de mudar agora | Medio | A (mudanca = zero) |
| Convergencia com SCSS dos design systems | Medio | A (B exige migrar para NativeWind/Tamagui) |
| Suporte PWA | Medio | A (Ionic permite; RN nao gera PWA nativo) |

**Vencedor por criterios + contexto SEP**: **Opcao A** (Angular + Ionic + Capacitor) — equilibrio favoravel para time pequeno, fintech tipica, escopo definido.

## Consequencias

### Positivas
- Sem mudanca: Sprint 0 pode comecar imediato
- Stack unificada Angular dos dois lados maximiza produtividade do time atual
- Reuso real entre frontend web e mobile (services, DTOs, guards, interceptors)
- PWA-first preservado (validacao mobile sem precisar publicar em store)
- SCSS dos design systems Apple/Notion funcionam diretamente
- Capacitor cobre todas as APIs nativas necessarias para SEP (biometria, push, camera, file picker)

### Negativas (aceitas conscientemente)
- Performance UI mobile fica em "boa o suficiente" (WebView), nao "premium" (RN bridge nativa)
- Ecossistema Ionic menor que React Native — busca de plugins especificos pode exigir mais workaround
- Hiring de Devs Ionic e nicho; mitigar contratando Devs Angular e treinando 1-2 semanas em Ionic
- Se requisitos futuros mudarem (UI premium, time crescer 10+ devs, demanda de animacoes complexas), pode ser necessaria reavaliacao

### Neutras
- ADR 0010 (biometria via Capacitor BiometricAuth na Sprint 5) permanece valido
- Specs 100-104, 200-204 e 005 nao precisam de alteracao
- CONTEXT.md linha 161 ja registrava a rejeicao informalmente; este ADR formaliza

## Gatilhos para futura reavaliacao

A decisao deve ser revisitada se qualquer um destes ocorrer:

- **Time crescer para 10+ devs frontend/mobile** — escala favorece RN (squads independentes, hiring mais facil)
- **Requisitos de UI premium** — animacoes complexas, listas de 1000+ itens com gestos avancados, AR/games
- **Hiring travar** por 3+ meses por escassez de devs Angular/Ionic disponiveis
- **Ionic descontinuar** suporte ou parar de seguir releases do Angular
- **Mudanca estrategica de produto** que demande UX mais proxima de bancos digitais grandes (Nubank-like)

Sem nenhum desses gatilhos, a stack permanece. Reavaliar a cada 6-12 meses durante revisao arquitetural.

## Implementacao

Esta ADR e puramente documental. Nada precisa ser alterado em codigo, specs, CLAUDE.md, CONTEXT.md ou outros artefatos do projeto.

Atualizacoes minimas:
- ADR 0003 ganha referencia para esta ADR (formaliza a reavaliacao)
- PRD §18 (Decisoes registradas em ADR) lista esta nova ADR

## Referencias

- [ADR 0002 - Design Systems Apple e Notion com SCSS Puro](./0002-design-systems-apple-e-notion-com-scss-puro.md)
- [ADR 0003 - Stack Angular 20 + Ionic 8 + Capacitor 6](./0003-stack-angular-20-ionic-8-capacitor-6.md)
- [ADR 0010 - MFA TOTP + Biometria Mobile](./0010-mfa-totp-com-biometria-mobile.md)
- [PRD §11 (Stack principal)](../docs-sep/PRD.md)
- [CONTEXT.md (linha 161 — rejeicao informal anterior)](../docs-sep/CONTEXT.md)
- React Native: https://reactnative.dev/
- Expo: https://expo.dev/
- Ionic Framework: https://ionicframework.com/
- Capacitor: https://capacitorjs.com/
