# PRD - Fase 3 - Expansao e proximas frentes

> Extraido de `PRD.md` para reduzir o tamanho do documento principal.

Este arquivo preserva o roadmap consolidado e detalha as frentes de expansao da Fase 3. As epics 5-9 e o mapeamento da Fase 2 estao em [`PRD-FASE-2.md`](./PRD-FASE-2.md).

## 25. Roadmap Inicial

### Epic 1 - Fundacao da API
**Status: Concluida em 2026-05-05** (Sprint 1, commit `ebd6310` mergeado em `main`)
- configurar Docker Compose e banco dev
- configurar locale e timezone
- implementar auditoria JPA
- padronizar campos auditaveis
- configurar Flyway
- configurar Actuator
- configurar CORS basico
- definir convencoes de persistencia e identificadores UUID

### Epic 2 - Gestao de usuarios (escopo da Sprint 2)
**Status: Concluida em 2026-05-05** (Sprint 2, commit `7fc88ba` mergeado em `main`)
- modelar entidade `Usuario` com `UUID v6`, repositorio e auditoria JPA
- configurar `AuditorAware` com fallback `system`
- criar DTOs de usuario (`UsuarioCreateDto`, `UsuarioResponseDto`, `UsuarioSenhaUpdateDto`) e `UsuarioMapper`
- implementar criacao publica de usuario em `POST /api/v1/usuarios`
- armazenar senha com hash `BCrypt` desde a criacao
- garantir que a senha nunca seja exposta em respostas da API

### Epic 3 - Seguranca, autenticacao e autorizacao (escopo da Sprint 3)
**Status: Concluida em 2026-05-05** (Sprint 3, commit `242b2a0` mergeado em `develop`/`main`)
- configurar propriedades JWT (`app.jwt.secret`, `app.jwt.expiration-seconds`)
- implementar `JwtTokenProvider`, `JwtAuthenticationFilter` e `CustomUserDetailsService`
- criar `LoginRequestDto` e `TokenResponseDto`
- implementar login em `POST /api/v1/auth/login` e recurso autenticado `GET /api/v1/auth/me`
- aplicar claims minimas obrigatorias (`sub`, `email`, `roles`, `iat`, `exp`) com `sub = UUID do usuario`
- implementar consulta de usuario por id com autorizacao por perfil e ownership
- implementar listagem de usuarios restrita a `ROLE_ADMIN`
- implementar alteracao da propria senha pelo usuario autenticado
- consolidar `SecurityConfig` com CORS, filtro JWT e liberacao publica apenas do cadastro e do login
- persistir na auditoria o UUID do usuario autenticado em operacoes autenticadas

### Epic 4 - Tratamento de erros, documentacao e testes (escopo da Sprint 4)
**Status: Concluida em 2026-05-06** (Sprint 4, branch `feature/sprint-4-erros-docs-testes` reimplementada apos incidente squash merge dos PRs #10/#11 que perderam o conteudo da sprint; mergeada em `main` via PR #16, commit `c5158de`; ver `CONTEXT.md` para o postmortem completo)
- criar `ApiExceptionHandler` com `@RestControllerAdvice`
- padronizar payload de erro via `ErrorResponseDto` (`timestamp`, `status`, `error`, `message`, `path`, `traceId`)
- mapear validacao, conflito, autenticacao, autorizacao, excecoes de dominio e fallback generico
- configurar `Springdoc OpenAPI` com `SecurityScheme` HTTP Bearer para JWT
- expor Swagger UI no profile `dev`
- documentar todos os endpoints e schemas dos DTOs com exemplos coerentes com o PRD
- cobrir com testes automatizados os cenarios criticos de autenticacao, autorizacao, validacao e auditoria
- introduzir `Webhook Receiver Pattern` (`POST /api/v1/webhooks/{provider}/{event}`) com HMAC-SHA256, idempotencia por `Idempotency-Key` e Outbox stub (`webhook_event_log` em V3) para preparacao da Epic 15 (Pix) e Epic 5 (KYC callbacks)

### Epic 10 - Jornada da empresa credora
**Status: backend concluido — Sprint 16 (foundation) e Sprint 17 (oportunidades e carteira) mergeadas em `develop` (PRs #67 e #69).** Doc operacional: [`repos/sep-api/CREDORES.md`](../repos/sep-api/CREDORES.md).
- estruturar a jornada futura da empresa que aporta recursos na SEP
- ✅ Sprint 16: cadastro da credora a partir de onboarding PJ aprovado, perfil operacional, elegibilidade derivada do resultado KYB/PLD (sem reexecutar), endpoints REST `/api/v1/credores`, auditoria (`CREDORA_CADASTRADA`/`ELEGIVEL`/`INELEGIVEL`)
- ✅ Sprint 17: oportunidades de investimento (snapshot de propostas elegiveis via ports), manifestacao/cancelamento de interesse e carteira de operacoes financiadas por associacao assistida (admin, contrato `ASSINADO`); endpoints `/api/v1/credores/oportunidades` e `/carteira`; auditoria (`CREDORA_INTERESSE_REGISTRADO`/`CANCELADO`, `CREDORA_OPERACAO_ASSOCIADA`). Sem aporte/Pix/escrow/matching automatico.
- permitir acompanhamento das operacoes financiadas e seu status
- movimentacao financeira real (aporte/Pix/escrow) e matching ficam fora do Epic 10 (dependem do Epic 15 e de decisao de produto)
- manter a entrada desta jornada posterior ao nucleo de contratacao do emprestimo

### Epic 11 - Administracao e governanca
**Status: Sprint 18 (RBAC cumulativo + parametros) mergeada em `develop` via PR #71 (merge `ab2c39a`).** Doc operacional: [`docs-sep/SEGURANCA.md`](./SEGURANCA.md) §multi-role.
- expandir a administracao de usuarios para governanca operacional mais ampla
- ✅ Sprint 18: roles cumulativas por usuario (resolve `FINANCEIRO + BACKOFFICE`) com JWT/authorities/guards multi-role e compatibilidade preservada; modulo `governanca` com parametros operacionais versionados/auditaveis; endpoints admin de roles e parametros com step-up; auditoria `USUARIO_ROLES_ALTERADAS`/`PARAMETRO_OPERACIONAL_ALTERADO`
- preparar RBAC evoluido, perfis internos e parametrizacoes futuras
- registrar auditoria administrativa e controles de acesso mais detalhados
- permitir cadastros mestres e configuracoes operacionais do produto
- sustentar seguranca e segregacao de responsabilidades conforme o produto crescer

### Epic 12 - Fundacao Frontend
**Status: F-Sprints 0-5 concluidas (2026-05-04 a 2026-05-11).**
- ✅ F-Sprint 0: scaffold Angular `20.x` Standalone + Signals + SCSS puro + tooling (ESLint, Prettier, Stylelint, Husky, Vitest, Playwright, MSW, CI)
- ✅ F-Sprint 1: tokens SCSS Apple e Notion fieis aos design systems oficiais ([`DESIGN-apple.md`](./DESIGN-apple.md) e [`DESIGN-notion.md`](./DESIGN-notion.md)) em variaveis SCSS reutilizaveis + showcase navegavel em `/design-system`
- ✅ F-Sprint 2: telas publicas Apple (landing institucional `/`, login `/login`, register publico `/register`) + AuthService Signals + handlers MSW alinhados ao PRD §21
- ✅ F-Sprint 3: integracao auth real (environment + interceptors + guards funcionais) + shell autenticado Notion (`/app`) com header, sidenav (filtrado por role), breadcrumbs e dashboard placeholder; MSW disponivel via build configuracao `dev-offline`; pagina `/access-denied` para 403
- ✅ F-Sprint 4: telas autenticadas concretas (meu perfil, alterar senha, administracao de usuarios, detalhe de usuario, dashboard administrativa) consumindo apenas APIs das Sprints 1-4
- ✅ F-Sprint 5: hardening de seguranca no web (MFA TOTP, step-up, refresh token rotativo, account locked e canalizacao do cadastro publico)
- biblioteca interna de componentes Notion (botoes, inputs, formularios, cards, tabelas, modais, toasts, loaders) cresce conforme demanda nas F-Sprints 4+
- guards de rota, controle de sessao, integracao HTTP com a API e tratamento padronizado de erros 401/403/404/409 ja entregues na F-Sprint 3
- entregar o "Frontend MVP" navegavel, validado e independente de qualquer jornada de negocio
- escopo: tudo que depende apenas das APIs entregues nas Sprints 1-4 (auth, usuarios e admin de usuarios)

### Epic 13 - Frontend de Jornadas
- implementar telas funcionais das jornadas, historicamente no design system Notion ate F-Sprint 10 e, apos o Epic 17, no New Design System SEP, consumindo APIs das Epics 5-11
- jornada do tomador: onboarding, solicitar emprestimo, acompanhar proposta, status da analise, formalizacao, parcelas e historico
- jornada da empresa credora: dashboard, perfil, KYB, oportunidades, operacoes financiadas, carteira e detalhe da operacao
- jornada do financeiro interno: dashboard financeiro, fila operacional, conciliacao, pendencias e visao de recebimentos/desembolsos
- jornada do backoffice: fila de propostas, mesa de credito, painel de formalizacao, painel de cobranca, comentarios internos, reprocessos e excecoes
- governanca avancada: gestao avancada de usuarios, perfis e permissoes, parametros, cadastros mestres e auditoria administrativa
- depende: Epic 12 (Fundacao Frontend) entregue e validado, mais APIs das Epics 5-11 publicadas e estaveis

### Epic 14 - Mobile SEP
- iniciar junto com a fundacao do frontend, como trilha paralela dependente dos mesmos contratos da API
- stack mobile: `Angular 20.x + Ionic 8.4+ + Capacitor 6` como baseline; opcionalmente `Angular 21 + Ionic correspondente` se a checagem de compatibilidade na fase de implementacao mobile passar
- a base historica das M-Sprints 0-5 adotou [`DESIGN-notion.md`](./DESIGN-notion.md) em todo o mobile; a partir do Epic 17, o design system vigente do app mobile passa a ser [`New Design System Sep.md`](<./New Design System Sep.md>), adaptado para Ionic/Angular/SCSS
- estilizar em SCSS puro, customizando componentes Ionic via CSS variables/SCSS; sem frameworks CSS adicionais. Ate a M-Sprint 5 a referencia era Notion mobile; apos a M-Sprint 12, novos estilos devem seguir o New Design System SEP
- validar primeiro em PWA/browser e evoluir para Android/iOS via Capacitor em fase posterior
- incluir apenas as jornadas mobile do tomador de emprestimo e da empresa credora
- excluir a visao do financeiro interno, backoffice operacional, administracao, governanca, cadastros mestres e telas de auditoria
- nao criar regra de negocio propria no app; decisoes de credito, status, permissoes e dados operacionais devem vir da API
- iniciar funcionalmente apos autenticacao documentada e estavel, preferencialmente apos Sprint 4
- nao antecipar telas funcionais alem de login antes de existirem APIs minimas de onboarding, analise de credito e formalizacao
- manter o mobile antes de Pix e automacoes financeiras expandidas, pois ajuda a validar a jornada de contratacao com usuarios reais

#### Trilha Mobile Foundation (M-Sprints 0-4, paralelas a Sprints 0-4 backend)

A primeira fase da Epic 14 e detalhada em 5 specs (1 arquivo por M-Sprint, paralelo aos padroes 0XX backend e 1XX frontend), conduzida pelo Dev Mobile dedicado:

- M-Sprint 0: [`specs/fase-1/200-msprint-0-setup-ionic.md`](../specs/fase-1/200-msprint-0-setup-ionic.md) — Setup Ionic 8.4+ + Angular 20.x + Capacitor 6 + tooling
- M-Sprint 1: [`specs/fase-1/201-msprint-1-tokens-notion-mobile.md`](../specs/fase-1/201-msprint-1-tokens-notion-mobile.md) — Tokens Notion adaptados (touch, tabs inferiores) + Showcase
- M-Sprint 2: [`specs/fase-1/202-msprint-2-telas-publicas-mobile.md`](../specs/fase-1/202-msprint-2-telas-publicas-mobile.md) — Splash, Boas-vindas, Login, Register com MSW + Capacitor Preferences (**concluida em 2026-05-07**)
- M-Sprint 3: [`specs/fase-1/203-msprint-3-shell-mobile-auth.md`](../specs/fase-1/203-msprint-3-shell-mobile-auth.md) — Auth real, Shell mobile (tabs inferiores), Guards, Interceptors (**concluida em 2026-05-08**)
- M-Sprint 4: [`specs/fase-1/204-msprint-4-telas-autenticadas-mobile.md`](../specs/fase-1/204-msprint-4-telas-autenticadas-mobile.md) — Perfil, Alterar senha, Casca tomador, Casca credora + Smoke E2E PWA (**concluida em 2026-05-08**)
- M-Sprint 5: hardening mobile da Sprint 5 — MFA verify, refresh token rotativo, account locked e preparacao de biometria via stub PWA (**concluida em 2026-05-11**, PR #21)

Apos a conclusao das M-Sprints 0-4, a Epic 14 entra nas Fases Mobile 2-4 (jornadas funcionais do tomador, da empresa credora e Pix visivel ao usuario), que dependem das APIs das Epics 5-11.

#### Escopo mobile do tomador
- cadastro e login
- acompanhamento de perfil
- solicitacao e acompanhamento de emprestimo quando a API existir
- status de analise, formalizacao, cobranca e pagamentos em fases futuras

#### Escopo mobile da empresa credora
- login
- visao simplificada de oportunidades, operacoes financiadas e status
- acompanhamento de carteira em fases futuras

### Epic 15 - Movimentacao Pix

**Status: Epic 15 backend concluido. Sprint 19 (foundation) mergeada via PR #73 (`12ca083`); Sprint 20 (desembolso assistido) via PR #75 (`d40768a`, 2026-06-01); Sprint 21 (recebimento e conciliacao) via PR #77 (`dbc7761`, 2026-06-02).** Modulo `pix` (dominio + idempotencia + webhook HMAC + auditoria), `PixProvider`/`EscrowProvider` por Provider Pattern (Fake default + Celcoin skeleton com WireMock). Sprint 20 entregou desembolso Pix assistido pelo financeiro: REST `/api/v1/pix/desembolsos` com step-up estrito (sem bypass de MFA), elegibilidade por ports (contrato ASSINADO + agenda + escrow), idempotencia, integracao `PixProvider` + status, webhook de reconciliacao, item de backoffice + reprocesso seguro e auditoria `PIX_TRANSFERENCIA_*` (V47-V50). Sprint 21 (recebimento e conciliacao) fecha o Epic 15 backend: referencia Pix por `txid` (`PixReferenciaRecebimento`, V51), REST `/api/v1/pix/recebimentos`, webhook `RECEBIMENTO_PIX` correlacionado + baixa de parcela via port de `cobranca` (escrow idempotente por `pix:<endToEndId>`), divergencias em item de backoffice `RECEBIMENTO_PIX_DIVERGENTE` (V52) e smoke E2E full-chain. Doc operacional: [`repos/sep-api/PIX.md`](../repos/sep-api/PIX.md).

- tratar Pix como fase posterior a fundacao atual da API e a estabilizacao das jornadas que impactam a contratacao
- posicionar Pix depois de onboarding, analise de credito, formalizacao contratual e cobranca inicial
- iniciar pelo recorte de `desembolso + recebimento`, evitando comecar por automacao ampla
- operar inicialmente em modo assistido pelo financeiro interno
- consumir o modulo `escrow` (modelado desde Sprint 1) para registrar todas as movimentacoes na conta segregada
- usar `PixProvider` (Provider Pattern definido em §11), com implementacao via Celcoin
- depende do `Webhook Receiver Pattern` introduzido na Sprint 4 (eventos `proposta_aprovada`, `pagamento_recebido`, `transferencia_liquidada`, etc.)

#### Blocos funcionais futuros
- `Pix de desembolso`
  - enviar valor aprovado ao tomador apos validacoes operacionais e financeiras
- `Pix de recebimento`
  - registrar e conciliar pagamento de parcelas e obrigacoes via Pix
- `Conciliação e webhooks`
  - processar eventos assincronos de liquidacao, falha, devolucao e atualizacao de status

#### Dominios internos esperados
- `PixTransferencia`
- `PixRecebimento`
- `PixWebhookEvent`
- `PixConciliacao`

#### Estados operacionais esperados
- `PENDENTE`
- `EM_PROCESSAMENTO`
- `LIQUIDADO`
- `FALHOU`
- `DEVOLVIDO`
- `EM_ANALISE`

#### Interfaces futuras em alto nivel
- endpoint interno para iniciar desembolso Pix
- endpoint interno para consultar status de transacao Pix
- endpoint webhook para eventos da provedora
- endpoint interno para conciliacao e consulta operacional

#### Requisitos transversais obrigatorios
- idempotencia por transacao
- auditoria reforcada
- rastreabilidade ponta a ponta
- associacao da transacao Pix a proposta, desembolso ou cobranca correspondente
- tratamento explicito de falhas, divergencias e reprocessamento

#### Capacidades explicitamente posteriores
- `split Pix`
- gestao avancada de chaves
- `Pix automatico`
- automacao ampla com minima intervencao humana

### Epic 16 - Infraestrutura AWS futura

**Status: primeiro incremento implementado pela Sprint 22 — Observabilidade Operacional MVP.** A
aplicacao passa a produzir logs JSON correlacionaveis, proteger Actuator, apresentar codigo de
suporte nos clientes e versionar configuracoes do CloudWatch Agent. Como ainda nao existe ambiente
AWS, EC2/RDS/IAM/SNS e alarmes permanecem planejados, sem provisionamento.

- manter provisionamento AWS apenas como planejamento ate existir conta/ambiente aprovado
- iniciar somente apos a conclusao completa do sistema de login, autenticacao e autorizacao
- usar PostgreSQL local via Docker Compose como banco oficial ate esse marco
- preferencialmente iniciar apos a Sprint 4, caso a equipe queira levar documentacao, tratamento de erros e testes criticos ja estabilizados para o ambiente remoto
- usar AWS como plataforma de infraestrutura remota
- usar Amazon EC2 para servidores de aplicacao
- usar Amazon RDS for PostgreSQL para banco gerenciado fora da EC2
- planejar develop e homologacao em EC2 compartilhada, com bancos RDS separados
- planejar producao com EC2 e RDS proprios
- considerar `sa-east-1` como regiao recomendada

### Epic 17 - New Design System SEP
**Status: web CONCLUIDO — F-Sprint 14 (design system, PR #48) + F-Sprint 15 (aplicacao em login/registro/dashboard/shell/landing, PR #55), mergeadas em `develop`; mobile (M-Sprint 12) CONCLUIDO, mergeado em `develop` e promovido a `main` em 2026-06-15.** Specs: web [`114-fsprint-14-new-design-system-web.md`](../specs/fase-3/114-fsprint-14-new-design-system-web.md) + [`115-fsprint-15-aplicacao-design-system-web.md`](../specs/fase-3/115-fsprint-15-aplicacao-design-system-web.md) e mobile [`212-msprint-12-new-design-system-mobile.md`](../specs/fase-3/212-msprint-12-new-design-system-mobile.md). Steps: web [`114-fsprint-14-steps.md`](../steps-fase-3/web/114-fsprint-14-steps.md) + [`115-fsprint-15-steps.md`](../steps-fase-3/web/115-fsprint-15-steps.md) e mobile [`212-msprint-12-steps.md`](../steps-fase-3/mobile/212-msprint-12-steps.md). Fonte visual: [`New Design System Sep.md`](<./New Design System Sep.md>).
- substituir a base visual Apple/Notion do `sep-app` e a base Notion mobile do `sep-mobile` pelo novo design system descrito em [`New Design System Sep.md`](<./New Design System Sep.md>)
- preservar as stacks atuais: `Angular + SCSS` no `sep-app` e `Angular + Ionic + Capacitor + SCSS` no `sep-mobile`, traduzindo tokens Tailwind/shadcn do documento de origem para CSS variables, SCSS e Ionic variables quando aplicavel
- manter a identidade SEP; referencias `SimpliClin` do documento de origem sao inspiracao visual, nao marca final do app
- migrar tokens, dark mode, shell, navegacao, cards, botoes, inputs, badges, dialogs, toasts, loaders, skeletons e showcases web/mobile
- nao alterar contratos REST, regras de negocio, autenticacao, roles, escopo de cada jornada ou exclusoes de financeiro/backoffice/admin no mobile
- exigir ADR e aprovacao explicita se houver proposta de trocar qualquer stack para Tailwind, shadcn, Radix ou React

### Ordem de prioridade funcional consolidada
1. Fundacao da API
2. Gestao de usuarios
3. Seguranca e autenticacao JWT
4. Tratamento de erros e documentacao
5. Onboarding KYC/KYB
6. Analise de credito
7. Formalizacao contratual
8. Cobranca e inadimplencia
9. Backoffice operacional
10. Jornada da empresa credora
11. Administracao e governanca
12. Fundacao Frontend
13. Frontend de Jornadas
14. Mobile SEP
15. Movimentacao Pix
16. Infraestrutura AWS futura
17. New Design System SEP (priorizado para execucao logo apos a F-Sprint 10 antes de novas telas web/mobile)

### Fronteiras entre epicos
- `Onboarding KYC/KYB`
  - capacidade transversal de validacao cadastral e documental
  - nao substitui a jornada especifica da empresa credora
- `Analise de credito`
  - responsavel pela decisao de risco, parecer e elegibilidade da proposta
  - nao substitui a fila e a operacao transversal do backoffice
- `Formalizacao contratual`
  - responsavel por contrato, aceite, assinatura e condicao de prontidao para desembolso
  - nao substitui a analise de credito nem a cobranca
- `Cobranca e inadimplencia`
  - responsavel pela regra de negocio de parcelas, atraso e recuperacao
  - nao substitui o meio de pagamento ou liquidacao
  - consome o modulo `escrow` para registrar recebimentos
- `escrow` (modulo transversal, sem epic propria)
  - responsavel pela segregacao patrimonial obrigatoria por Resolucao CMN 4.656/2018
  - modela `ContaEscrow`, `Wallet`, `MovimentacaoEscrow`
  - modelado desde a Sprint 1 (entidades), implementacao concreta via `EscrowProvider` (Celcoin) na Epic 15
  - usado por `cobranca`, `credores`, `pix` e `financeiro`
  - nao e jornada de negocio nem capacidade financeira; e infraestrutura de dominio
- `Backoffice operacional`
  - responsavel por fila, pendencias, excecoes, comentarios e reprocessos
  - nao substitui os modulos de dominio como onboarding, credito ou cobranca
- `Jornada da empresa credora`
  - responsavel pela experiencia e pelas regras do participante que aporta recursos
  - pode reutilizar capacidades de onboarding e governanca, mas nao deve duplicar esses modulos
- `Administracao e governanca`
  - responsavel por RBAC evoluido, parametros, cadastros mestres e controles administrativos
  - nao substitui a gestao operacional do backoffice
- `Fundacao Frontend`
  - camada de fundacao tecnica e visual do web (Angular 20.x + SCSS + tokens dos design systems)
  - cobre telas publicas (Apple) e a base autenticada (Notion: shell, navegacao, componentes compartilhados, perfil, alterar senha, admin de usuarios e dashboard inicial)
  - nao deve concentrar regra de negocio de dominio
  - precondicao para Frontend de Jornadas
- `Frontend de Jornadas`
  - camada de experiencia das jornadas funcionais (tomador, credora, financeiro, backoffice e governanca avancada)
  - reutiliza shell, tokens e componentes da Fundacao Frontend
  - nao deve concentrar regra de negocio de dominio
  - depende de APIs publicadas pelas Epics 5-11
- `Mobile SEP`
  - camada de experiencia mobile para tomador e empresa credora
  - nao substitui o frontend web/backoffice nem deve incluir financeiro interno ou administracao completa nesta fase
  - deve compartilhar contratos e padroes de autenticacao com o frontend web
- `New Design System SEP`
  - camada visual habilitadora do `sep-app` e do `sep-mobile`
  - substitui Apple/Notion como direcao vigente para novas telas web e substitui Notion mobile como direcao vigente para novas telas mobile
  - nao substitui os Epics 13/14 nem cria jornada funcional propria
  - traduz o design de origem para Angular/SCSS e Ionic/Angular/SCSS sem mudar as stacks por padrao
- `Movimentacao Pix`
  - responsavel pelo meio de movimentacao e liquidacao financeira via Pix
  - nao substitui cobranca, analise de credito ou formalizacao
- `Infraestrutura AWS futura`
  - trilha tecnica habilitadora para ambientes remotos, banco gerenciado, deploy e observabilidade
  - nao substitui as epics funcionais nem deve bloquear a evolucao local enquanto o produto ainda estiver nas sprints iniciais

### Regra de priorizacao
- funcionalidades que impactam diretamente a jornada de contratacao do emprestimo devem ser implementadas antes das capacidades financeiras expandidas
- funcionalidades operacionais posteriores, como Pix e automacoes avancadas, so entram apos estabilizacao do fluxo de contratacao
- Mobile SEP deve iniciar junto com a fundacao do frontend, mas sua implementacao funcional depende de contratos estaveis da API e deve priorizar tomador e empresa credora
- o Epic 17 deve rodar apos a F-Sprint 10 para estabilizar a base visual do `sep-app` e do `sep-mobile` antes de novas telas funcionais
- infraestrutura AWS nao e funcionalidade de negocio; pode ser planejada como trilha tecnica apos o gate minimo da Sprint 3, preferencialmente apos Sprint 4, mesmo que a lista funcional ainda avance para KYC/KYB, credito e formalizacao
- as quatro jornadas do PO devem estar explicitamente refletidas em epics do roadmap, mesmo quando forem implementadas em fases diferentes

### Criterios para reavaliar microservicos
- um modulo precisa escalar independentemente
- um modulo precisa deployar em ciclo diferente do restante do backend
- um modulo exige banco proprio por seguranca, LGPD, auditoria ou regulacao
- uma equipe separada passa a ser dona integral do modulo
- integracoes externas criticas justificam isolamento operacional
- observabilidade, CI/CD, secrets, deploy e monitoramento ja estao maduros o suficiente para sustentar operacao distribuida

## 26. Regras de Execucao

- a implementacao deve acontecer em tarefas pequenas
- ao final de cada task concluida, a execucao deve parar em checkpoint pre-commit para revisao humana dos arquivos criados/modificados e para testes locais manuais
- o agente deve informar no checkpoint: arquivos alterados, testes/build/lint executados e resultado, riscos/pendencias e mensagem de commit sugerida
- o agente deve aguardar comando explicito do usuario antes de fazer `git add` e `git commit` daquela task
- commits podem ser feitos pelo agente de IA
- push e PR serao manuais
- testes, build e deploy no GitHub Actions ficarao para fase separada
- AWS, EC2, RDS, CI/CD e deploy remoto serao tratados em fase separada de infraestrutura
- a fase de infraestrutura AWS so podera iniciar, no minimo, apos a conclusao completa da Sprint 3 / Epic 3 de login, autenticacao e autorizacao
- a primeira fase AWS pode usar deploy manual documentado em ambiente nao produtivo enquanto GitHub Actions ainda nao estiver implementado
- deploy remoto de producao deve depender de estrategia explicita de secrets, rollback, backup, migrations e controle de acesso
- revisao arquitetural deve acontecer a cada nova epic para confirmar se o modulo respeita suas fronteiras DDD

## 27. Premissas

- esta API sera a primeira entrega do projeto antes da integracao completa com Angular
- a politica de senha de 6 caracteres sera seguida exatamente como solicitado nesta fase
- o cadastro publico de usuarios e valido apenas para a etapa inicial
- antes da fase AWS, o banco oficial sera PostgreSQL local em Docker Compose
- o backend continuara sendo um unico Spring Boot na fase inicial
- o banco continuara unico ate decisao futura explicita
- DDD sera usado primeiro como organizacao modular e linguagem de dominio, nao como pretexto para distribuir o sistema cedo demais
- este PRD e um documento vivo: as specs das Sprints 1 a 4 ja existem em `../specs/` e devem evoluir junto com o produto
- o frontend web consumira esta API a partir de uma base Angular standalone + SCSS, implementada diretamente sobre os design systems oficiais do web (Apple para superficies publicas e Notion para superficies autenticadas), sem reaproveitar templates administrativos prontos nem frameworks CSS de terceiros
- o web e o mobile passam a ter design system unificado a partir do Epic 17: [`New Design System Sep.md`](<./New Design System Sep.md>), traduzido para Angular/SCSS no `sep-app` e Ionic/Angular/SCSS no `sep-mobile`
- a versao do Angular esta travada em `20.x` como baseline para o frontend e o mobile; o upgrade para `21` so pode ser avaliado na fase de implementacao mobile e depende de release oficial do Ionic e dos plugins Capacitor com suporte explicito
- nao ha previsao de downgrade do Angular abaixo de `20`; a clausula anterior de downgrade (motivada pelo template administrativo descartado) foi removida

## 28. Apendice - Orientacao para agentes de IA

A orientacao operacional para os agentes de IA que assumem trabalho neste projeto (Claude, Codex, Copilot) esta consolidada em [`AGENT.md`](../AGENT.md), na raiz do repositorio `docs-SEP`. O projeto opera em 3 repositorios separados (`sep-api`, `sep-app`, `sep-mobile`), conforme descrito na §11; o `AGENT.md` tambem registra essa estrategia logo no inicio (secao "Repositorios do projeto").

**Pre-requisito de leitura**: toda nova instancia de agente de IA, antes de qualquer acao no repositorio, deve ler:

1. Este PRD (`docs-sep/PRD.md`)
2. [`docs-sep/CONTEXT.md`](./CONTEXT.md) — historico de decisoes
3. [`AGENT.md`](../AGENT.md) — pelo menos a secao do agente em uso (Claude, Codex ou Copilot)
4. O spec relevante em `specs/` quando ha task em andamento
5. O step correspondente em `steps-fase-1/{backend,web,mobile}/` ou `steps-fase-2/{backend,web,mobile}/`, quando existir
6. ADRs relevantes em `adr/`

**Conteudo do `AGENT.md`** (resumo):

- **Secao Claude** — orientacao para Claude Code: estado do projeto, stack confirmada, arquitetura, roteiro de sprints, marco regulatorio, convencoes, "como iniciar uma nova conversa", hierarquia SDD, "o que NAO fazer" e regras de comunicacao.
- **Secao Codex** — orientacao para o agente Codex: ordem de leitura, hierarquia SDD, visao do produto, stack, design systems, arquitetura backend, Provider Pattern, marco regulatorio, roteiro de sprints, convencoes, "regras para o Codex" e "o que nao fazer".
- **Secao Copilot** — orientacao para GitHub Copilot CLI: contexto do produto, stack, design systems, arquitetura obrigatoria, marco regulatorio, convencoes, ordem de leitura, hierarquia SDD, roadmap consolidado, sprints iniciais, "o que o Copilot deve/nao deve fazer", regra pratica para implementacao e comunicacao.

As tres secoes tem sobreposicao intencional (estado, stack, arquitetura, marco regulatorio, convencoes), mas cada uma foi escrita com o tom e os detalhes que fazem sentido para o agente correspondente.

**Resolucao de conflitos**: quando o `AGENT.md` divergir do PRD ou de algum ADR, o **PRD e os ADRs prevalecem**. O `AGENT.md` complementa, nao reescreve, esses artefatos.

**Historico**: o `AGENT.md` substitui os arquivos `CLAUDE.md`, `CODEX.md` e `COPILOT.md` que existiam na raiz do repositorio `docs-SEP` em sprints anteriores e foram apagados ao consolidar a orientacao em um unico arquivo.

## 30. Mapeamento Fase 3: Projetos × Sprints

Tabela executiva consolidando o planejamento inicial da Fase 3. A Fase 3 parte da Fase 2 concluida em `main` e separa sprints por projeto (`sep-api`, `sep-app`, `sep-mobile`). Cada sprint foi planejada com no maximo 6 tasks de implementacao; precheck, E2E/smoke e documentacao nao entram nessa contagem.

As tabelas abaixo usam a ordem recomendada de execucao. Em Epic 17, a numeracao dos specs foi preservada (`F-14` e `M-12`), mas a execucao foi antecipada para evitar retrabalho visual.

### Backend (`sep-api`)

| Sprint | Epic/frente | Tema | Spec | Tasks impl. |
|--------|-------------|------|------|-------------|
| 16 | Epic 10 | Jornada credora foundation (**implementada**) | [`016`](../specs/fase-3/016-sprint-16-credora-foundation.md) | 6 |
| 17 | Epic 10 | Oportunidades e carteira da credora (**implementada**) | [`017`](../specs/fase-3/017-sprint-17-credora-oportunidades-carteira.md) | 6 |
| 18 | Epic 11 | Administracao e governanca avancada (**mergeada**, PR #71) | [`018`](../specs/fase-3/018-sprint-18-governanca-rbac-parametros.md) | 6 |
| 19 | Epic 15 | Pix foundation + EscrowProvider (**implementada**) | [`019`](../specs/fase-3/019-sprint-19-pix-foundation-escrow-provider.md) | 6 |
| 20 | Epic 15 | Pix desembolso assistido (**implementada**) | [`020`](../specs/fase-3/020-sprint-20-pix-desembolso-assistido.md) | 5 |
| 21 | Epic 15 | Pix recebimento e conciliacao (**implementada**) | [`021`](../specs/fase-3/021-sprint-21-pix-recebimento-conciliacao.md) | 6 |
| 22 | Epic 16 | Observabilidade operacional MVP + CloudWatch ready (**implementada**) | [`022`](../specs/fase-3/022-sprint-22-observabilidade-operacional.md) + [`steps`](../steps-fase-3/backend/022-sprint-22-steps.md) | 6 |
| 23 | Epic 8/14 | Historico owner-scoped de recebimentos do tomador (B1 da M-9) (**mergeada em `develop` (PR #81) e promovida a `main` (PR #82); develop==main**) | [`023`](../specs/fase-3/023-sprint-23-cobranca-historico-tomador.md) + [`steps`](../steps-fase-3/backend/023-sprint-23-steps.md) | 4 |
| 24 | Epic 8/14 | Consulta owner-scoped de renegociacao ativa (B2 da M-9) (**mergeada em `develop` via PR #83 (`2a41c51`); ainda nao promovida a `main`**) | [`024`](../specs/fase-3/024-sprint-24-cobranca-renegociacao-tomador.md) + [`steps`](../steps-fase-3/backend/024-sprint-24-steps.md) | 4 |

### Web (`sep-app`)

| Sprint | Epic/frente | Tema | Spec | Tasks impl. |
|--------|-------------|------|------|-------------|
| F-6 | Epic 13 | Jornada onboarding PF/PJ (**mergeada**, PR #33) | [`106`](../specs/fase-3/106-fsprint-6-onboarding-web.md) + [`steps`](../steps-fase-3/web/106-fsprint-6-steps.md) | 6 |
| F-7 | Epic 13 | Propostas, credito e Open Finance (**implementada**) | [`107`](../specs/fase-3/107-fsprint-7-credito-open-finance-web.md) + [`steps`](../steps-fase-3/web/107-fsprint-7-steps.md) | 6 |
| F-8 | Epic 13 | Formalizacao, assinatura e CCB (**mergeada**, PR #39/#40) | [`108`](../specs/fase-3/108-fsprint-8-formalizacao-web.md) + [steps](../steps-fase-3/web/108-fsprint-8-steps.md) | 5 |
| F-9 | Epic 13 | Cobranca, parcelas e inadimplencia (**mergeada**, PR #42/#43; renegociacao do tomador adiada por gap backend) | [`109`](../specs/fase-3/109-fsprint-9-cobranca-web.md) + [steps](../steps-fase-3/web/109-fsprint-9-steps.md) | 6 |
| F-10 | Epic 13 | Backoffice e financeiro operacional (**mergeada**, PR #46 -> develop; promovida para main via PR #52) | [`110`](../specs/fase-3/110-fsprint-10-backoffice-financeiro-web.md) + [steps](../steps-fase-3/web/110-fsprint-10-steps.md) | 6 |
| F-14 | Epic 17 | New Design System Web (**mergeada**, PR #48 -> develop; promovida para main via PR #52) | [`114`](../specs/fase-3/114-fsprint-14-new-design-system-web.md) + [`steps`](../steps-fase-3/web/114-fsprint-14-steps.md) | 6 |
| F-11 | Epic 10/13 | Jornada empresa credora | [`111`](../specs/fase-3/111-fsprint-11-credora-web.md) | 6 |
| F-12 | Epic 11/13 | Administracao e governanca avancada (**mergeada**, PR #51 -> develop, PR #52 -> main) | [`112`](../specs/fase-3/112-fsprint-12-governanca-web.md) + [`steps`](../steps-fase-3/web/112-fsprint-12-steps.md) | 5 |
| F-13 | Epic 13/15 | Pix operacional no web (**mergeada**, PR #53 -> develop; promocao para main pendente) | [`113`](../specs/fase-3/113-fsprint-13-pix-web.md) + [`steps`](../steps-fase-3/web/113-fsprint-13-steps.md) | 5 |

### Mobile (`sep-mobile`)

| Sprint | Epic/frente | Tema | Spec | Tasks impl. |
|--------|-------------|------|------|-------------|
| M-12 | Epic 17 | Aplicacao do design system mobile (**concluida em 2026-06-15; desbloqueia M-6/206**) | [`212`](../specs/fase-3/212-msprint-12-new-design-system-mobile.md) + [`steps`](../steps-fase-3/mobile/212-msprint-12-steps.md) | 5 |
| M-6 | Epic 14 | Tomador: onboarding mobile (**mergeada em `origin/develop` via PR #79, commit `4f495f3`**) | [`206`](../specs/fase-3/206-msprint-6-onboarding-mobile.md) + [`steps`](../steps-fase-3/mobile/206-msprint-6-steps.md) | 6 |
| M-7 | Epic 14 | Tomador: proposta, credito e Open Finance (**mergeada em `develop` (PR #100) e promovida a `main` (PR #104); develop==main**) | [`207`](../specs/fase-3/207-msprint-7-credito-mobile.md) + [`steps`](../steps-fase-3/mobile/207-msprint-7-steps.md) | 6 |
| M-8 | Epic 14 | Tomador: formalizacao e contrato (**mergeada em `origin/develop` via PR #105 (`be792df`) e promovida a `origin/main` via PR #106 (`e009d50`)**) | [`208`](../specs/fase-3/208-msprint-8-formalizacao-mobile.md) + [`steps`](../steps-fase-3/mobile/208-msprint-8-steps.md) | 5 |
| M-9 | Epic 14 | Tomador: parcelas e cobranca (**M-9.1→M-9.3 implementadas na branch `feature/msprint-9-cobranca-mobile` (commits `71c6acf`/`393d927`/`1937cfe`); sprint pausada — M-9.4 depende da Sprint 23 (B1, **mergeada PR #81 — liberada**) e M-9.5 da Sprint 24 (B2, **mergeada em `develop` PR #83 — liberada**); ambos os gates backend abertos; M-9.6 fecha a sprint apos M-9.4/M-9.5**) | [`209`](../specs/fase-3/209-msprint-9-cobranca-mobile.md) + [`steps`](../steps-fase-3/mobile/209-msprint-9-steps.md) | 6 |
| M-10 | Epic 14 | Empresa credora mobile | [`210`](../specs/fase-3/210-msprint-10-credora-mobile.md) | 6 |
| M-11 | Epic 14/15 | Pix visivel ao usuario | [`211`](../specs/fase-3/211-msprint-11-pix-mobile.md) | 5 |

**Decisoes de planejamento**:
- **Separacao por projeto**: backend, web e mobile possuem specs proprios e podem evoluir com dependencias explicitas.
- **Granularidade menor**: quando um tema exigiria mais de 6 tasks de implementacao, ele foi dividido em sprints separadas.
- **Steps just-in-time**: esta secao cria o mapa de specs; os steps continuam sendo criados apenas antes da execucao de cada sprint.
- **Ordem vs numeracao**: F-14/F-15 e M-12 preservam a numeracao ja criada, mas a ordem recomendada de execucao coloca a base/aplicacao visual antes das jornadas funcionais; M-12 foi concluida antes de M-6/206, removendo o bloqueio visual para iniciar a jornada funcional mobile.
- **Mobile restrito**: mobile cobre tomador e empresa credora; financeiro interno, backoffice operacional, administracao completa e auditoria continuam fora do app.
- **Design system web/mobile**: a F-Sprint 14 + M-Sprint 12/Epic 17 substituem Apple/Notion como design vigente por [`New Design System Sep.md`](<./New Design System Sep.md>), mantendo Angular/SCSS no web e Ionic/Angular/SCSS no mobile salvo ADR explicita.
- **Infraestrutura AWS**: permanece trilha paralela candidata, nao mapeada como sprint funcional nesta tabela.
- **Gates de seguranca e operacao**: desembolso Pix assistido depende da decisao de step-up estrito sem bypass MFA; reprocessos web dependem de handlers reais backend por provider/event; jornadas credora web/mobile dependem de contrato explicito de autorizacao/ownership.
