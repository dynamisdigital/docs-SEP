# CI/CD evolutivo do SEP

## Objetivo

Este diretorio documenta a evolucao planejada das pipelines do SEP. A regra central e simples: ativar primeiro CI de validacao, sem deploy, e manter qualquer automacao de distribuicao ou infraestrutura como template versionado ate que os gates do PRD sejam cumpridos.

## Modelo de 3 repositorios

A partir de 2026-05-04 o projeto opera em **3 repositorios independentes** no GitHub:

- **`sep-api`** — backend Java + Spring Boot
- **`sep-app`** — frontend Angular
- **`sep-mobile`** — mobile Ionic + Capacitor

A documentacao consolidada (este repo `docs-SEP`) **nao executa CI proprio** — apenas hospeda os templates abaixo, que sao copiados para o `.github/workflows/` de cada repo correspondente.

## Templates por repositorio

Os arquivos em `docs-sep/ci-pipelines/templates/` sao templates versionados. Cada um tem o sufixo `.template.yml` e e copiado para o `.github/workflows/<arquivo>.yml` (sem o sufixo `.template`) no repo correspondente.

### `sep-api`

- [`sep-api-ci.template.yml`](./templates/sep-api-ci.template.yml) — valida backend Java/Spring com Spotless + JaCoCo + build Gradle. Usa Postgres como service container do GitHub Actions.

### `sep-app`

- [`sep-app-ci.template.yml`](./templates/sep-app-ci.template.yml) — valida frontend Angular com lint + test + build.

### `sep-mobile`

- [`sep-mobile-pwa-ci.template.yml`](./templates/sep-mobile-pwa-ci.template.yml) — valida mobile como PWA (lint + test + build). Padrao da fase atual conforme PRD §11 (PWA-first).
- [`sep-mobile-android-validation.template.yml`](./templates/sep-mobile-android-validation.template.yml) — build Android debug para validacao interna (futuro, apos M-Sprints 0-4).
- [`sep-mobile-android-distribution.template.yml`](./templates/sep-mobile-android-distribution.template.yml) — build Android assinado para homologacao/distribuicao.
- [`sep-mobile-ios-validation.template.yml`](./templates/sep-mobile-ios-validation.template.yml) — build iOS de validacao em runner macOS.
- [`sep-mobile-ios-testflight.template.yml`](./templates/sep-mobile-ios-testflight.template.yml) — publicacao em TestFlight.

### Comuns (deploy AWS — futuro, apos Sprint 3 / Epic 3)

- [`aws-deploy-develop.yml`](./templates/aws-deploy-develop.yml)
- [`aws-deploy-homologacao.yml`](./templates/aws-deploy-homologacao.yml)
- [`aws-deploy-producao.yml`](./templates/aws-deploy-producao.yml)

## Como promover um template

1. Copiar o arquivo `.template.yml` para `.github/workflows/<arquivo>.yml` no repo correspondente (remover o sufixo `.template`).
2. Ajustar `node-version`, `java-version`, environment ou comandos se a implementacao real tiver divergido do plano.
3. Validar em branch de teste do repo de destino.
4. Conferir artifacts gerados e logs.
5. Ativar branch protection ou required checks somente depois do workflow ficar estavel.

## Diferencas vs versao monorepo

Os templates antigos (anteriores a 2026-05-04) tinham `paths-filter` por subpasta (`apps/sep-frontend/**`, `apps/sep-mobile/**`) e `working-directory` apontando para subpastas. **Removidos** porque cada repo agora so contem um app — o workflow roda no root do repo sem filtros de path.

## Gates de promocao

- Android nativo so deve ser promovido depois da estabilizacao das M-Sprints 0-4.
- Distribuicao Android exige secrets separados no environment `mobile-android-homologacao`.
- iOS exige conta Apple Developer, certificados, provisioning profile e runner macOS.
- AWS so pode iniciar apos conclusao completa da Sprint 3; preferencialmente apos Sprint 4.
- Producao exige estrategia explicita de secrets, rollback, backup, migrations, controle de acesso, logs e monitoramento.

## Secrets previstos

Android (no repo `sep-mobile`):

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_PASSWORD`

iOS (no repo `sep-mobile`):

- `APP_STORE_CONNECT_API_KEY_ID`
- `APP_STORE_CONNECT_ISSUER_ID`
- `APP_STORE_CONNECT_API_KEY`
- `IOS_CERTIFICATE_BASE64`
- `IOS_CERTIFICATE_PASSWORD`
- `IOS_PROVISIONING_PROFILE_BASE64`

AWS (em todos os repos com deploy):

- `AWS_ROLE_TO_ASSUME`
- `AWS_REGION` com valor recomendado `sa-east-1`
- variaveis especificas por ambiente

Nenhum secret de producao deve ser criado ou consumido pelas fases de CI inicial.

## Rollback

- Para CI de validacao, rollback e reverter o commit que adicionou ou alterou o workflow.
- Para deploy nao produtivo, rollback minimo e redeploy da versao anterior documentada.
- Para producao, nenhum workflow deve ser promovido sem procedimento de rollback explicito, backup validado, migrations reversiveis ou plano manual de recuperacao aprovado.
