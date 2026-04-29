# ADR 0003 - Stack Angular 20 + Ionic 8.4+ + Capacitor 6

## Status

Aceito (2026-04-27). Substitui a decisao anterior de Angular `17` (com possibilidade de downgrade para compatibilidade com template).

## Contexto

A versao do Angular foi inicialmente travada em `17` para compatibilidade com o template Datta Able. Apos o ADR 0002 retirar o template, ficou aberta a discussao: qual versao adotar?

Opcoes consideradas:
- Angular `19` (LTS, conservador)
- Angular `20` (atual, equilibrio entre maturidade e novidade)
- Angular `21` (bleeding edge, lancado nov/2025)

Restricao paralela: o mobile usa Ionic, e Ionic v8 oficialmente suporta Angular `17-20` (versao `8.4+`). Angular `21` ainda nao e oficialmente suportado por Ionic v8 no momento desta decisao.

## Decisao

Adotaremos **Angular `20.x`** como baseline, pareado com **Ionic `8.4+`** e **Capacitor `6`** para mobile.

Na fase de implementacao mobile, avaliaremos upgrade para Angular `21` se houver release oficial do Ionic e dos plugins Capacitor com suporte explicito a `21`. Caso contrario, mantemos `20.x`. Se Ionic v8 nao acompanhar, atualizar o Ionic em vez de regredir o Angular.

Nao ha previsao de downgrade do Angular abaixo de `20`.

## Alternativas consideradas

- **Angular 19**: descartado. Sem ganhos relevantes vs `20.x`; deixaria o time sem Zoneless estavel e melhorias recentes de Signals.
- **Angular 21 imediato**: descartado para baseline. Risco de incompatibilidade com Ionic v8 e plugins Capacitor; ecossistema (NgRx, Angular Material) ainda alinhando.
- **Manter Angular 17**: descartado. Sem o template, perde sentido travar em versao antiga.

## Consequencias

### Positivas
- frontend ganha Standalone Components, Signals, Zoneless (estaveis em `20`)
- mobile pode comecar com stack confiavel
- janela aberta para upgrade tecnologico futuro sem retrabalho

### Negativas
- requer atencao no momento da implementacao mobile para validar Ionic + Capacitor + Angular `20.x`
- pode haver minor breaking entre patches do Angular `20.x` ao longo do projeto

### Neutras
- decisao revisitada na fase mobile

## Implementacao

- PRD §11 (Base frontend e mobile)
- PRD §18 (Decisoes Consolidadas)
- CONTEXT.md (Frontend, Mobile, Situacao atual)
- Spec 100 ([`specs/100-fsprint-0-setup-angular.md`](../specs/100-fsprint-0-setup-angular.md)) — F-Sprint 0 cria projeto Angular `20.x` para o frontend web
- Spec 200 ([`specs/200-msprint-0-setup-ionic.md`](../specs/200-msprint-0-setup-ionic.md)) — M-Sprint 0 cria projeto Mobile com Ionic `8.4+` + Angular `20.x` + Capacitor `6`

## Referencias

- PRD §11, §18
- ADR 0002 (design systems)
- ADR 0011 (Reavaliacao da Stack Frontend e Mobile — confirmou esta decisao apos comparacao formal com React+RN+Expo) — ver [`0011-reavaliacao-stack-frontend-mobile-angular-ionic.md`](./0011-reavaliacao-stack-frontend-mobile-angular-ionic.md)
- Ionic 8 release notes
- Angular release notes
