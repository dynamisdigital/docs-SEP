# CI/CD evolutivo do SEP

## Objetivo

Este diretorio documenta a evolucao planejada das pipelines do SEP. A regra central e simples: ativar primeiro CI de validacao, sem deploy, e manter qualquer automacao de distribuicao ou infraestrutura como template versionado ate que os gates do PRD sejam cumpridos.

## Workflows ativos

Os workflows ativos ficam em `.github/workflows/` e podem aparecer no GitHub Actions:

- `backend-ci.yml`: valida backend Java/Spring quando o Gradle Wrapper existir.
- `frontend-ci.yml`: valida `apps/sep-frontend` quando a F-Sprint 0 criar o app.
- `mobile-pwa-ci.yml`: valida `apps/sep-mobile` como PWA quando a M-Sprint 0 criar o app.

Esses workflows nao fazem deploy, nao usam secrets produtivos e encerram com aviso quando a respectiva trilha ainda nao existe no repositorio.

## Templates futuros

Os arquivos em `docs-sep/ci-pipelines/templates/` nao sao executados pelo GitHub Actions. Eles devem ser copiados para `.github/workflows/` somente quando a fase correspondente for formalmente iniciada.

- `mobile-android-validation.yml`: build Android debug para validacao interna.
- `mobile-android-distribution.yml`: build Android assinado para homologacao/distribuicao.
- `mobile-ios-validation.yml`: build iOS de validacao em runner macOS.
- `mobile-ios-testflight.yml`: publicacao em TestFlight.
- `aws-deploy-develop.yml`: deploy futuro para `aws-develop`.
- `aws-deploy-homologacao.yml`: deploy futuro para `homologacao`.
- `aws-deploy-producao.yml`: deploy futuro para `producao`.

## Gates de promocao

- Android nativo so deve ser promovido depois da estabilizacao das M-Sprints 0-4.
- Distribuicao Android exige secrets separados no environment `mobile-android-homologacao`.
- iOS exige conta Apple Developer, certificados, provisioning profile e runner macOS.
- AWS so pode iniciar apos conclusao completa da Sprint 3; preferencialmente apos Sprint 4.
- Producao exige estrategia explicita de secrets, rollback, backup, migrations, controle de acesso, logs e monitoramento.

## Secrets previstos

Android:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_PASSWORD`

iOS:

- `APP_STORE_CONNECT_API_KEY_ID`
- `APP_STORE_CONNECT_ISSUER_ID`
- `APP_STORE_CONNECT_API_KEY`
- `IOS_CERTIFICATE_BASE64`
- `IOS_CERTIFICATE_PASSWORD`
- `IOS_PROVISIONING_PROFILE_BASE64`

AWS:

- `AWS_ROLE_TO_ASSUME`
- `AWS_REGION` com valor recomendado `sa-east-1`
- variaveis especificas por ambiente

Nenhum secret de producao deve ser criado ou consumido pelas fases de CI inicial.

## Promocao de template

1. Copiar o template para `.github/workflows/`.
2. Ajustar apenas nomes de app, comandos e environment se a implementacao real tiver divergido do plano.
3. Validar em branch de teste.
4. Conferir artifacts gerados e logs.
5. Ativar branch protection ou required checks somente depois do workflow ficar estavel.

## Rollback

- Para CI de validacao, rollback e reverter o commit que adicionou ou alterou o workflow.
- Para deploy nao produtivo, rollback minimo e redeploy da versao anterior documentada.
- Para producao, nenhum workflow deve ser promovido sem procedimento de rollback explicito, backup validado, migrations reversiveis ou plano manual de recuperacao aprovado.

