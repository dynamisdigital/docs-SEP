# Documentacao por repositorio

Esta pasta centraliza documentacao especifica de cada repositorio de codigo do projeto SEP.

## Repositorios

- [sep-api](sep-api/) - backend Java + Spring Boot.
- [sep-app](sep-app/) - frontend web Angular.
- [sep-mobile](sep-mobile/) - app mobile Ionic + Angular + Capacitor.

## Onde criar novos documentos

- Documentos especificos da API/backend devem ficar em `repos/sep-api/`.
- Documentos especificos do frontend web devem ficar em `repos/sep-app/`.
- Documentos especificos do mobile devem ficar em `repos/sep-mobile/`.
- Documentos globais de produto, processo ou operacao continuam em `docs-sep/`.
- ADRs continuam em `adr/`.
- Specs continuam em `specs/`.
- Steps continuam em `steps-fase-1/` e `steps-fase-2/`.
- Templates de CI continuam em `docs-sep/ci-pipelines/templates/`.

Os repositorios de codigo devem manter apenas entrypoints minimos, como `README.md` e
`CONTRIBUTING.md`, apontando para estes indices quando houver documentacao detalhada.

## Regra pratica

- Docs de modulo/API/backend (`ONBOARDING.md`, `PLD.md`, `CREDITO.md`, `CONTRATOS.md`,
  `CCB.md`, `COBRANCA.md`, `NOTIFICACOES.md`, `BACKOFFICE.md` e equivalentes) ficam em
  `repos/sep-api/`.
- Docs de tela, arquitetura ou operacao exclusiva do web ficam em `repos/sep-app/`.
- Docs de build, PWA, Capacitor ou jornada exclusiva do mobile ficam em `repos/sep-mobile/`.
- Docs que descrevem o produto inteiro, regras de processo, contexto historico,
  apresentacoes, seguranca transversal ou templates compartilhados ficam em `docs-sep/`.

Nao crie novas pastas `docs/` dentro dos repositorios `sep-api`, `sep-app` ou
`sep-mobile`.
