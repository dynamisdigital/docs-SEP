# Spec 212 - M-Sprint 12 - Aplicacao do New Design System Mobile

## Metadados

- **ID da Spec**: 212
- **Titulo**: M-Sprint 12 - Aplicacao visual do New Design System SEP no mobile
- **Status**: concluida (mergeada em `develop` e promovida a `main`, 2026-06-15)
- **Fase do produto**: Fase 3 - Epic 17
- **Trilha**: Mobile (`sep-mobile`)
- **Origem**: PRD Epic 17; [`New Design System Sep.md`](<../../docs-sep/New Design System Sep.md>); F-Sprint 15 [`115-fsprint-15-aplicacao-design-system-web.md`](./115-fsprint-15-aplicacao-design-system-web.md); feedback do usuario sobre a aplicacao visual do design system
- **Sprint pareada**: F-Sprint 15 - Aplicacao do New Design System Web
- **Depende de**: M-Sprints 0-5 como base tecnica mobile; shell/tabs publicas e autenticadas existentes no `sep-mobile`; decisao de manter Ionic/Angular/SCSS salvo ADR explicita em contrario
- **Responsavel principal**: Dev Mobile

## Objetivo

A M-Sprint 12 antiga estava planejada como uma migracao generica do Notion mobile para o New Design System SEP, pareada com a F-Sprint 14. Esse plano ficou desatualizado depois da criacao da F-Sprint 15: no web, a melhoria real nao e recriar tokens, mas **aplicar melhor** os recursos visuais do design system em superficies chave.

Esta M-Sprint 12 deve seguir a mesma direcao da F-Sprint 15, adaptada ao mobile: aplicar o New Design System SEP no `sep-mobile` com mais presenca visual, cor, hierarquia e polimento em splash/welcome, login, registro, home autenticada, home tomador/credora, header, tabs e showcase. No mobile, `splash/welcome` cumprem o papel da landing publica redesenhada na F-Sprint 15; nao ha necessidade de criar uma rota landing separada se o fluxo publico atual continuar sendo `splash -> welcome -> login/register`.

A sprint preserva a stack atual (`Ionic + Angular + Capacitor + SCSS`) e nao altera contratos REST, autenticacao, autorizacao, biometria, step-up, rotas de negocio ou regras de produto. O foco e visual e ergonomico.

Apesar do ID `M-12`, a ordem de execucao foi antecipada antes das M-Sprints funcionais 6-11 para evitar retrabalho visual em onboarding, credito, formalizacao, cobranca, credora e Pix mobile. Com a M-Sprint 12 concluida e validada, a M-Sprint 6 (`206-msprint-6-onboarding-mobile.md`) fica desbloqueada do ponto de vista visual.

## Decisoes de design

- A sprint **nao troca stack**: sem React, Tailwind, shadcn/ui, Radix, `next-themes` ou `framer-motion` sem ADR aprovada.
- O mobile usa Ionic. Os primitivos visuais devem ser traduzidos para SCSS, CSS custom properties e variaveis `--ion-*`, sem brigar com os componentes Ionic.
- O `sep-mobile` ja usa `ionicons`. Nao instalar `lucide-angular` por simetria cega com o web; preferir `ion-icon`/Ionicons para manter a stack mobile. Se for necessario outro pacote de icones, registrar justificativa e pedir aprovacao.
- A direcao visual segue a F-Sprint 15: chip de icone colorido, tile de acesso rapido, botao gradiente, painel de marca e shell mais polido.
- No mobile, os equivalentes sao: `sep-mobile-icon-chip`, `sep-mobile-quick-tile`, `sep-mobile-button-gradient`, `sep-mobile-auth-brand-panel`, header translucido/sticky e tabs com estado ativo mais evidente.
- Dashboard/home mobile usa apenas conteudo real existente. Proibido fabricar metricas, saldos, contadores ou numeros sem fonte de dados.
- `SimpliClin`/`TeaAgenda` no material de origem sao referencia visual, nao marca final. O app continua SEP.
- O app mobile continua focado em tomador e empresa credora. Financeiro interno, backoffice, administracao e auditoria seguem fora do mobile salvo spec futura.

## Escopo

### Em escopo

- Auditar a base visual atual do `sep-mobile` e mapear onde o Notion mobile ainda aparece.
- Criar ou ajustar primitivos visuais mobile equivalentes aos da F-Sprint 15:
  - chip de icone colorido;
  - tile de acesso rapido;
  - botao gradiente;
  - painel de marca para superficies publicas;
  - cards/tabs/header com estados mais ricos.
- Aplicar os primitivos em:
  - splash/welcome;
  - login e verificacao TOTP;
  - registro;
  - home autenticada;
  - home tomador;
  - home credora;
  - perfil, troca de senha, biometria e step-up quando houver superficie visual relevante;
  - shell, header mobile e tabs.
- Atualizar showcase mobile para demonstrar os novos primitivos.
- Ajustar testes unitarios/DOM e smoke PWA em viewport mobile.
- Auditar dependencias apos a sprint para remover pacotes comprovadamente orfaos, sem instalar bibliotecas novas por simetria com o web.
- Atualizar documentacao operacional do `sep-mobile`, roadmap e PR description temporaria.

### Fora de escopo

- Recriar toda a paleta sem necessidade ou duplicar tokens que ja existam.
- Introduzir Tailwind, shadcn/ui, Radix, React ou Lucide sem justificativa aprovada.
- Criar telas funcionais novas de onboarding, credito, formalizacao, cobranca, credora ou Pix.
- Alterar backend, contratos REST, guards, autenticacao, autorizacao, biometria ou step-up.
- Exibir metricas numericas, saldos ou dados operacionais sem endpoint/fonte real.
- Renomear o produto para `SimpliClin`/`TeaAgenda` ou importar assets de outra marca.
- Build nativo Android/iOS, publicacao em loja ou assets de loja.

## Tasks de implementacao

0. Fundacao visual mobile: auditar base atual, confirmar Ionicons, adicionar tokens/mixins faltantes e mapear variaveis Ionic.
1. Publico mobile: redesenhar splash/welcome, login, TOTP e registro com painel de marca, CTA gradiente e formularios preservados.
2. Home autenticada e jornadas: aplicar tiles coloridos, chips de icone e cards de jornada nas homes existentes, sem dados fabricados.
3. Shell mobile: polir header, tabs, estados ativos, superficies, feedback de toque e dark mode.
4. Showcase, testes, smoke PWA, auditoria de dependencias e documentacao operacional.

## Gates que nao contam como task

- Precheck de branch, status Git e baseline (`lint`, `lint:scss`, `test`, `build`).
- Decisao arquitetural caso alguem proponha Tailwind/shadcn/React/Lucide no mobile.
- Revisao manual em viewport mobile realista, light e dark.
- Checkpoint pre-commit por task.
- Fechamento documental e PR description temporaria.

## Definition of Done

- `sep-mobile` aplica o New Design System SEP de forma visualmente rica nas superficies existentes.
- Splash/welcome, login/TOTP, registro, homes, shell/header/tabs e showcase usam os novos primitivos mobile.
- Botoes de destaque usam cor/gradiente; tiles e cards usam chips de icone coloridos.
- O app continua Ionic/Angular/Capacitor/SCSS, sem Tailwind/shadcn/React.
- Nenhuma regra funcional, contrato REST, guard, autenticacao, biometria ou step-up foi alterado por causa visual.
- Dashboard/homes nao exibem metrica ou numero fabricado.
- Light/dark mode funcionam sem contraste insuficiente nas telas alteradas.
- `npm run lint`, `npm run lint:scss`, `npm run test`, `npm run build` e smoke PWA passam ou tem falha preexistente documentada.
- Dependencias orfas introduzidas ou reveladas pela sprint foram auditadas; remocoes so ocorrem com grep-guard e suite verde.
- Documentacao e indices apontam para a M-Sprint 12 revisada e para a relacao com a F-Sprint 15.
