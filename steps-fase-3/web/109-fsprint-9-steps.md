# Steps - F-Sprint 9 - Cobranca Web

**Spec de origem**: [`specs/fase-3/109-fsprint-9-cobranca-web.md`](../../specs/fase-3/109-fsprint-9-cobranca-web.md)

**Status**: planejada.

**Objetivo geral**: implementar no `sep-app` a jornada autenticada de cobranca para tomador e financeiro, consumindo os contratos reais de `sep-api` (`cobranca` Sprints 12-13), com UI Notion, parcelas, agenda, recebimento manual, inadimplencia, contato e renegociacao, sem duplicar calculo financeiro, workflow de cobranca, ownership, auditoria ou regras de transicao de status no frontend.

**Esforco total estimado**: 5-7 dias de Dev Pleno Frontend.

**Repo de destino**:
- `sep-app`: Angular web, repo de codigo alterado nesta sprint.
- `docs-SEP`: documentacao editada no working tree quando necessario; operacao git continua manual.

**Branch sugerida**:
- `feature/fsprint-9-cobranca-web`

**Pre-requisitos globais**:
- `sep-app/develop` atualizado apos F-Sprint 8 (`feature/fsprint-8-formalizacao-web`).
- F-Sprints 0-8 concluidas: shell autenticado Notion, guards, interceptors, MSW, Vitest, Playwright, MFA/step-up/refresh, onboarding PF/PJ, propostas de credito, Open Finance e formalizacao navegaveis.
- `sep-api/develop` ou `main` com Sprints backend 12-13 mergeadas: agenda, parcelas, recebimentos, escrow local, inadimplencia, contato manual, notificacoes e renegociacao basica.
- Backend local disponivel em `http://localhost:8080` quando for validar smoke real.
- Docs de referencia: `repos/sep-api/COBRANCA.md`, `repos/sep-api/NOTIFICACOES.md`, `docs-sep/WEB-SCREENS-PLAN.md`, `docs-sep/DESIGN-notion.md`, `docs-sep/SEGURANCA.md`.

**Contratos backend consumidos**:

Cobranca (`/api/v1/cobranca`):
- `GET /api/v1/cobranca/contratos/{contratoId}/agenda` -> `AgendaPagamentoResponse`, com ownership do tomador ou perfil `FINANCEIRO`/`ADMIN`.
- `GET /api/v1/cobranca/parcelas/{id}` -> `ValorAtualizadoParcelaResponse`, com valor atualizado por mora/multa calculado no backend.
- `POST /api/v1/cobranca/parcelas/{id}/recebimentos` body `RegistrarRecebimentoRequest` + header `Idempotency-Key` -> `200 RecebimentoResponse`, somente `FINANCEIRO`/`ADMIN`.
- `GET /api/v1/cobranca/recebimentos` -> `RecebimentoResponse[]`, somente `FINANCEIRO`/`ADMIN`; listagem sem paginacao no backend atual.
- `GET /api/v1/cobranca/inadimplencia` query `dias_atraso_min?`, `dias_atraso_max?`, `status?` -> lista de parcelas atrasadas/inadimplentes, somente `FINANCEIRO`/`ADMIN`.
- `POST /api/v1/cobranca/parcelas/{id}/contato` body `RegistrarContatoRequest` -> `201 EventoCobrancaResponse`, somente `FINANCEIRO`/`ADMIN`.
- `POST /api/v1/cobranca/parcelas/{id}/renegociacao` body `IniciarRenegociacaoRequest` -> `201 RenegociacaoResponse`, `FINANCEIRO`/`ADMIN` + step-up.
- `PATCH /api/v1/cobranca/renegociacoes/{id}/aceite` body vazio/reservado -> `RenegociacaoResponse`, tomador owner + step-up.
- `PATCH /api/v1/cobranca/renegociacoes/{id}/recusa` body vazio/reservado -> `RenegociacaoResponse`, tomador owner.

Operacoes existentes, mas fora do escopo funcional da F-Sprint 9:
- Conciliacao automatica por Pix.
- Boleto.
- Negativacao, cobranca juridica ou BI externo.
- Edicao de calculadoras, parametros de mora/multa, workflow backend ou templates de notificacao.

**DTOs esperados no frontend**:
- `AgendaPagamentoResponse`: `id`, `contratoId`, `numeroParcelas`, `valorTotal`, `dataGeracao`, `parcelas`.
- `ParcelaResponse` dentro da agenda: `id`, `numero`, `principal`, `juros`, `multa`, `encargos`, `total`, `dataVencimento`, `status`.
- `ValorAtualizadoParcelaResponse`: `parcelaId`, `numero`, `status`, `dataVencimento`, `principalOriginal`, `jurosOriginal`, `jurosMora`, `multa`, `valorDevidoAtualizado`, `totalRecebido`, `valorEmAberto`.
- `RegistrarRecebimentoRequest`: `valorRecebido`, `dataRecebimento`, `meioPagamento`, `identificadorExterno`, `observacao`.
- `RecebimentoResponse`: `recebimentoId`, `parcelaId`, `statusParcela`, `valorRecebido`, `dataRecebimento`, `meioPagamento`, `identificadorExterno`, `movimentacaoEscrowId`, `novo`.
- `InadimplenciaResponse`: `parcelaId`, `agendaId`, `contratoId`, `tomadorId`, `numeroParcela`, `status`, `dataVencimento`, `diasAtraso`, `valorOriginal`.
- `RegistrarContatoRequest`: `descricao`, `diasAtraso`.
- `EventoCobrancaResponse`: `id`, `parcelaId`, `tipo`, `canal`, `template`, `status`, `diasAtraso`, `descricao`, `registradoPor`, `dataEvento`. Para contato manual, `canal` e `template` podem vir `null`.
- `IniciarRenegociacaoRequest`: `novoValorParcela`, `novoVencimento`, `numeroParcelas`, `desconto`, `justificativa`.
- `RenegociacaoResponse`: `id`, `parcelaOriginalId`, `agendaOriginalId`, `tomadorId`, `statusParcelaAnterior`, `novoValorParcela`, `novoVencimento`, `numeroParcelas`, `desconto`, `status`, `propostaPor`, `dataProposta`, `dataDecisao`, `dataExpiracao`, `agendaSubstitutaId`.

**Enums esperados**:
- `StatusParcela`: `PENDENTE`, `PARCIALMENTE_PAGA`, `PAGA`, `ATRASADA`, `EM_NEGOCIACAO`, `INADIMPLENTE`, `RENEGOCIADA`.
- `StatusRenegociacao`: `PROPOSTA`, `ACEITA`, `RECUSADA`, `EXPIRADA`.

**Decisoes da sprint**:
- Frontend exibe parcelas, valores estaticos da agenda, valor atualizado do detalhe, recebimentos e renegociacoes; calculo de saldo, mora, multa, status e transicoes pertence ao backend.
- `CLIENTE` deve visualizar somente a propria agenda/parcela autorizada. O frontend pode esconder menus por role, mas nunca assumir ownership como controle de seguranca.
- Recebimento manual e criacao de renegociacao sao operacoes financeiras sensiveis: respeitar roles e step-up quando o backend exigir.
- `Idempotency-Key` deve ser gerada por tentativa de recebimento e reaproveitada apenas durante retry controlado da mesma submissao; nao persistir em storage.
- Inadimplencia e contatos sao visoes operacionais para `FINANCEIRO`/`ADMIN`; tomador deve ver estados e propostas de renegociacao aplicaveis, sem dados internos de workflow, notificacao ou provider.
- Conteudo de notificacao nao aparece no frontend. Exibir apenas metadados operacionais permitidos quando o backend retornar.
- Erros `400/403/404/409/422` devem virar estados de UI claros sem quebrar o shell autenticado. Em cobranca, `409` e o codigo primario para conflito/estado invalido; `422` fica como fallback defensivo para erro propagado de provider/escrow quando ocorrer.

**Fora de escopo da sprint**:
- Implementar Pix automatico, boleto ou conciliacao.
- Criar calculadora financeira no frontend.
- Criar workflow de cobranca, templates de email/SMS ou provider externo no frontend.
- Reprocesso de notificacao, backoffice avancado e juridico.
- Persistir comprovantes, documentos financeiros, Idempotency-Key, tokens step-up ou payload bruto de notificacao em `localStorage`/`sessionStorage`.

**Protocolo obrigatorio por Task**:
- Implementar somente a Task liberada pelo usuario.
- Ao concluir implementacao e verificacao da Task, parar em checkpoint pre-commit com arquivos alterados, testes executados, riscos e sugestao de commit.
- Aguardar `commit` ou aprovacao equivalente antes de stage/commit.
- Usar `git add <paths-especificos>`, nunca `git add -A`.
- Fazer um code review da Task quando solicitado pelo usuario; se houver hotfix, implementar em novo checkpoint.
- Ao final da Task, pausar para review manual do usuario. Nao iniciar a proxima Task sem ordem explicita.

**Skills obrigatorias na implementacao**:
- `coding-guidelines`: pensar antes, simplicidade, mudancas cirurgicas, execucao orientada a meta.
- `clean-code`: nomes intencionais, componentes pequenos, sem comentarios ruidosos, testes F.I.R.S.T.
- `clean-architecture`: componentes chamam services; regra de negocio fica no backend; modelos TypeScript sao DTOs de borda, nao entidades de dominio duplicadas.

---

## Protocolo de breakpoints recomendado

```text
C1 = F-9.0 + F-9.1
Prechecks + modelos/CobrancaService/MSW base

C2 = F-9.2
Rotas, menu e shell da jornada de cobranca

C3 = F-9.3
Parcelas do tomador e historico da agenda

C4 = F-9.4
Agenda financeira, detalhe de parcela e recebimento manual

C5 = F-9.5
Inadimplencia, contato e renegociacao

C6 = F-9.6
MSW, Vitest, smoke, docs e fechamento
```

- C1 fecha contratos antes de UI.
- C2 abre navegacao sem fluxo parcial escondido.
- C3 entrega visibilidade segura ao tomador.
- C4 isola operacao financeira com idempotencia e tratamento de erro.
- C5 isola inadimplencia e renegociacao, incluindo step-up.
- C6 fecha validacao final e documentacao.

---

## Task F-9.0 - Prechecks da F-Sprint 9

**Objetivo**: confirmar base Git, scripts, contratos backend e arquitetura atual do `sep-app`.

**Esforco**: 1-2 horas.

### Step 109.0.1 - Conferir estado Git do `sep-app`

**Comandos**:
```bash
cd <sep-app-root>
git fetch --all --prune
git status --short --branch
git rev-list --left-right --count HEAD...origin/develop
git log --oneline -10 origin/develop
```

**Verificacao**:
- Branch local alinhada a `origin/develop`.
- Working tree limpo ou alteracoes locais identificadas como do usuario.
- F-Sprint 8 presente no historico.

### Step 109.0.2 - Criar branch da sprint

**Comandos**:
```bash
cd <sep-app-root>
git switch develop
git pull --ff-only
git switch -c feature/fsprint-9-cobranca-web
```

**Verificacao**:
- Branch criada a partir de `develop` atualizado.
- Se `git pull --ff-only` falhar, abortar e avisar o usuario.

### Step 109.0.3 - Mapear estrutura atual do frontend

**Comandos**:
```bash
cd <sep-app-root>
find src/app/core -maxdepth 3 -type f | sort
find src/app/features/authenticated -maxdepth 5 -type f | sort
find src/app/layout -maxdepth 3 -type f | sort
find src/mocks -maxdepth 3 -type f | sort
sed -n '1,340p' src/app/core/api/api.models.ts
sed -n '1,280p' src/app/features/authenticated/authenticated.routes.ts
sed -n '1,260p' src/app/layout/sidenav/sidenav.component.ts
grep -R "UsuarioRole\\|roleGuard\\|allowedRoles" -n src/app
grep -R "step-up\\|StepUp\\|RequireStepUp" -n src/app src/mocks
```

**Verificacao**:
- Shell Notion e rotas autenticadas existem.
- Features `credito` e `formalizacao` estao navegaveis para entrada por proposta/contrato.
- MSW esta disponivel para `dev-offline`.
- Fluxo MFA/step-up existente localizado antes das Tasks F-9.4/F-9.5.
- `UsuarioRole` e `roleGuard` localizados; se `FINANCEIRO`/`BACKOFFICE` ainda nao existirem no union TypeScript, atualizar na Task F-9.2 antes de declarar rotas financeiras.

### Step 109.0.4 - Conferir contratos backend

**Comandos**:
```bash
cd <sep-api-root>
grep -R "class .*Cobranca.*Controller" -n src/main/java/com/dynamis/sep_api/cobranca
grep -R "record .*Agenda\\|record .*Parcela\\|record .*Recebimento\\|record .*Renegociacao\\|record .*Contato" -n src/main/java/com/dynamis/sep_api/cobranca/web/dto
find src/main/java/com/dynamis/sep_api/cobranca/domain -maxdepth 3 -type f | sort
```

**Verificacao**:
- Endpoints de agenda, parcela e recebimento confirmados.
- Endpoints de inadimplencia, contato e renegociacao confirmados.
- Enums `StatusParcela` e `StatusRenegociacao` confirmados antes de criar modelos TypeScript.
- Header de `Idempotency-Key` e header de step-up confirmados nos controllers/interceptors.

### Step 109.0.5 - Rodar baseline web

**Comandos**:
```bash
cd <sep-app-root>
npm run lint
npm run lint:scss
npm run test -- --run
npm run build
```

**Verificacao**:
- Baseline passa antes das alteracoes.
- Se falhar por problema preexistente, registrar evidencia e alinhar com o usuario antes de seguir.

### Step 109.0.6 - Checkpoint C1 parcial

**Entregaveis**:
- Estado Git e baseline registrados.
- Contratos backend confirmados.
- Branch da sprint pronta.

**Pausa obrigatoria**:
- Parar se houver divergencia em DTO, enum, endpoint de recebimento, endpoint de renegociacao, `Idempotency-Key` ou header de step-up.

---

## Task F-9.1 - CobrancaService, modelos e MSW base

**Objetivo**: criar a borda de API da cobranca sem UI complexa, com modelos TypeScript fieis aos DTOs backend e mocks suficientes para desenvolvimento offline.

**Pre-requisito**: Task F-9.0 concluida.

**Esforco**: 1 dia.

### Step 109.1.1 - Criar modelos de cobranca

**Arquivos provaveis**:
- `src/app/core/api/api.models.ts`
- ou arquivo local seguindo padrao existente, se o projeto separar modelos por feature.

**Implementacao**:
- Adicionar unions para status de parcela e renegociacao.
- Adicionar interfaces para agenda, parcela, recebimento, contato e renegociacao.
- Datas ficam como `string` ISO na borda de API; formatacao pertence a componente/helper de apresentacao.
- Valores monetarios ficam como `number` apenas na borda/display; calculo de negocio nao e feito no frontend.

**Verificacao**:
- Nenhum modelo cria metodo calculado para juros, multa, saldo ou status.
- Campos opcionais refletem nullable real do backend, nao conveniencia visual.

### Step 109.1.2 - Criar `CobrancaService`

**Arquivos provaveis**:
- `src/app/core/cobranca/cobranca.service.ts`
- `src/app/core/cobranca/cobranca.service.spec.ts`

**Metodos minimos**:
- `consultarAgendaPorContrato(contratoId: string)`.
- `consultarParcela(id: string)`.
- `registrarRecebimento(parcelaId: string, request: RegistrarRecebimentoRequest, idempotencyKey: string)`.
- `listarRecebimentos()`.
- `listarInadimplencia(filtros)`.
- `registrarContato(parcelaId: string, request: RegistrarContatoRequest)`.
- `iniciarRenegociacao(parcelaId: string, request: IniciarRenegociacaoRequest, stepUpToken: string)`.
- `aceitarRenegociacao(renegociacaoId: string, stepUpToken: string)`.
- `recusarRenegociacao(renegociacaoId: string)`.

**Regras de implementacao**:
- Usar `HttpClient` e configuracao de base URL ja existente.
- `registrarRecebimento` deve enviar `Idempotency-Key` no header.
- Operacoes com step-up devem seguir o padrao existente de header/interceptor.
- Nao chamar endpoint de cobranca diretamente a partir de componente.

**Verificacao**:
- Specs validam URL, metodo HTTP, headers de idempotencia/step-up e body esperado.
- Nenhum service calcula valores financeiros.

### Step 109.1.3 - Adicionar fixtures MSW de cobranca

**Arquivos provaveis**:
- `src/mocks/handlers.ts`
- `src/mocks/data/cobranca.mock.ts` ou padrao equivalente.

**Cenarios minimos**:
- Agenda com parcelas `PENDENTE`, `ATRASADA`, `PARCIALMENTE_PAGA` e `PAGA`.
- Consulta de detalhe com `ValorAtualizadoParcelaResponse` (`valorDevidoAtualizado`, `valorEmAberto`, `totalRecebido`, `jurosMora`, `multa`).
- Recebimento manual com `Idempotency-Key` valida retornando `RecebimentoResponse` e atualizando estado mockado.
- Recebimento sem key retornando `400`; key divergente retornando `409`; role insuficiente retornando `403`.
- Lista financeira de recebimentos.
- Lista de inadimplencia com filtros basicos.
- Registro de contato com `descricao` e `diasAtraso`, retornando evento operacional permitido.
- Criacao de renegociacao com step-up valido; sem step-up retornando `403`; proposta ativa retornando `409`.
- Aceite e recusa de renegociacao pelo tomador.

**Verificacao**:
- MSW nao mascara exigencia de step-up.
- Fixture nao armazena payload sensivel de notificacao, dados bancarios, CPF/CNPJ ou tokens.

### Step 109.1.4 - Testar service e mocks

**Comandos**:
```bash
cd <sep-app-root>
npm run lint
npm run test -- --run cobranca
```

**Verificacao**:
- `CobrancaService` coberto.
- Tipos compilaram sem `any` desnecessario.

### Step 109.1.5 - Checkpoint C1

**Entregaveis**:
- Modelos de agenda/parcela/recebimento/renegociacao.
- `CobrancaService`.
- MSW base.
- Specs do service.

**Pausa obrigatoria**:
- Review da Task F-9.1 antes de criar telas.

---

## Task F-9.2 - Rotas, menu e shell da jornada

**Objetivo**: tornar cobranca acessivel no shell autenticado para tomador e financeiro, sem expor operacoes por role indevida.

**Pre-requisito**: Task F-9.1 concluida.

**Esforco**: 0,5-1 dia.

### Step 109.2.1 - Estender roles web para perfis operacionais

**Arquivos provaveis**:
- `src/app/core/api/api.models.ts`
- arquivo do `roleGuard`, se separado do modelo.
- specs existentes de guard/auth, se houver.

**Implementacao**:
- Estender `UsuarioRole` para incluir `FINANCEIRO` e `BACKOFFICE`, mantendo `ADMIN` e `CLIENTE`.
- Confirmar que `UsuarioResponse.role` continua sendo single-role principal retornada pelo login (`ADMIN`, `CLIENTE`, `FINANCEIRO` ou `BACKOFFICE`).
- Confirmar que `roleGuard` usa `allowedRoles.includes(user.role)` e passa a aceitar `data.roles: UsuarioRole[]` com `FINANCEIRO`.
- Nao decodificar JWT nem criar novo modelo multi-role nesta sprint; usar a role principal denormalizada que o backend ja retorna para o web.

**Verificacao**:
- Rotas com `data.roles: ['FINANCEIRO', 'ADMIN']` compilam sem cast ou `any`.
- Menu financeiro consegue avaliar `FINANCEIRO` de forma type-safe.
- `BACKOFFICE` entra no union para compatibilidade com backend, mesmo que a F-Sprint 9 nao exponha telas completas de backoffice.

### Step 109.2.2 - Criar feature de cobranca

**Arquivos provaveis**:
- `src/app/features/authenticated/cobranca/cobranca.routes.ts`
- `src/app/features/authenticated/cobranca/cobranca-shell.component.ts`
- `src/app/features/authenticated/cobranca/cobranca-shell.component.html`
- `src/app/features/authenticated/cobranca/cobranca-shell.component.scss`
- `src/app/features/authenticated/authenticated.routes.ts`

**Rotas sugeridas**:
- `/app/cobranca`
- `/app/cobranca/contratos/:contratoId/agenda`
- `/app/cobranca/parcelas/:id`
- `/app/cobranca/financeiro/agenda`
- `/app/cobranca/financeiro/inadimplencia`
- `/app/cobranca/renegociacoes/:id`

**Verificacao**:
- Lazy loading segue padrao das features autenticadas existentes.
- Rotas financeiras usam guard/visibilidade compativel com o padrao atual, mas seguranca real permanece no backend.

### Step 109.2.3 - Adicionar entrada no menu autenticado

**Arquivos provaveis**:
- `src/app/layout/sidenav/sidenav.component.ts`
- templates/SCSS associados, conforme padrao atual.

**Implementacao**:
- Adicionar item "Cobranca" ou "Parcelas" para tomador.
- Adicionar entrada financeira para `FINANCEIRO`/`ADMIN`, usando o `UsuarioRole` atualizado no Step 109.2.1.
- Usar icone da biblioteca ja adotada no projeto.
- Preservar densidade e estilo Notion.

**Verificacao**:
- Cliente nao recebe CTA primario para agenda financeira.
- Financeiro consegue navegar para agenda/inadimplencia.
- UI escondida por role nao e tratada como seguranca.

### Step 109.2.4 - Criar shell com estados base

**Implementacao**:
- Criar shell com tabs/links internos de acordo com role.
- Estados de carregamento, vazio, erro e acesso negado.
- Sem textos explicativos longos sobre como usar a aplicacao.

**Verificacao**:
- Layout nao usa cards aninhados.
- Componentes cabem em mobile e desktop sem sobreposicao.

### Step 109.2.5 - Testar rotas e menu

**Comandos**:
```bash
cd <sep-app-root>
npm run lint
npm run lint:scss
npm run test -- --run cobranca
```

**Verificacao**:
- Rotas carregam lazy feature.
- Menu renderiza conforme perfil mockado.
- Guard aceita `FINANCEIRO` sem cast.

### Step 109.2.6 - Checkpoint C2

**Entregaveis**:
- `UsuarioRole` atualizado para roles operacionais.
- Feature `cobranca` navegavel.
- Menu autenticado atualizado.
- Shell com estados base.

**Pausa obrigatoria**:
- Review da Task F-9.2 antes de implementar telas de parcelas.

---

## Task F-9.3 - Parcelas do tomador e historico

**Objetivo**: permitir que o tomador veja sua agenda, parcelas, status e historico financeiro autorizado.

**Pre-requisito**: Task F-9.2 concluida.

**Esforco**: 1 dia.

### Step 109.3.1 - Criar tela de agenda por contrato

**Arquivos provaveis**:
- `src/app/features/authenticated/cobranca/pages/agenda-tomador-page.component.ts`
- `.html` e `.scss` correspondentes.

**Implementacao**:
- Carregar `GET /cobranca/contratos/{contratoId}/agenda`.
- Exibir resumo da agenda com contrato, numero de parcelas, valor total e data de geracao.
- Listar parcelas com numero, vencimento, status e composicao estatica (`principal`, `juros`, `multa`, `encargos`, `total`).
- Registrar como gap se a UX exigir status ativo/substituido, porque o backend atual nao expoe `ativa` nem `agendaSubstituidaId`.
- Usar badges semanticos para status.

**Verificacao**:
- Nao calcular `valorEmAberto`, `diasAtraso` ou status ativo/substituido a partir da agenda.
- Valor atualizado e saldo em aberto aparecem somente no detalhe carregado por `GET /parcelas/{id}`.
- `403` vira acesso negado; `404` vira estado vazio/indisponivel.

### Step 109.3.2 - Criar detalhe de parcela para tomador

**Implementacao**:
- Carregar `GET /cobranca/parcelas/{id}`.
- Exibir `ValorAtualizadoParcelaResponse`: `principalOriginal`, `jurosOriginal`, `jurosMora`, `multa`, `totalRecebido`, `valorDevidoAtualizado` e `valorEmAberto`.
- Exibir estado de atraso/inadimplencia/renegociacao quando backend retornar.
- Nao expor metadados internos de workflow de cobranca.

**Verificacao**:
- Valores sao apresentados como dados do backend.
- Estados finais (`PAGA`, `RENEGOCIADA`) nao exibem acoes indevidas.

### Step 109.3.3 - Integrar entrada a partir de formalizacao/proposta

**Implementacao**:
- A partir de contrato assinado/formalizacao, adicionar CTA para agenda quando `contratoId` estiver disponivel e estado permitir.
- Se agenda ainda nao existir, mostrar estado "agenda em geracao/indisponivel" sem criar dados locais.

**Verificacao**:
- Nenhum CTA aponta para rota quebrada.
- Contratos nao assinados nao sugerem cobranca ativa.

### Step 109.3.4 - Testar parcelas do tomador

**Comandos**:
```bash
cd <sep-app-root>
npm run lint
npm run lint:scss
npm run test -- --run cobranca
```

**Cenarios minimos**:
- Agenda carregada e parcelas renderizadas.
- Lista da agenda exibe composicao estatica.
- Detalhe de parcela atrasada exibe mora/multa e saldo vindos de `ValorAtualizadoParcelaResponse`.
- `403`, `404` e estado vazio tratados.
- CTA a partir de formalizacao nao aparece em estado indevido.

### Step 109.3.5 - Checkpoint C3

**Entregaveis**:
- Agenda do tomador.
- Detalhe de parcela.
- Integracao com formalizacao/proposta.
- Specs dos cenarios principais.

**Pausa obrigatoria**:
- Review da Task F-9.3 antes de implementar operacoes financeiras.

---

## Task F-9.4 - Agenda financeira e recebimento manual

**Objetivo**: permitir que `FINANCEIRO`/`ADMIN` acompanhem parcelas e registrem recebimento manual com idempotencia.

**Pre-requisito**: Task F-9.3 concluida.

**Esforco**: 1-1,5 dia.

### Step 109.4.1 - Criar visao financeira de agenda/recebimentos

**Arquivos provaveis**:
- `src/app/features/authenticated/cobranca/pages/agenda-financeira-page.component.ts`
- `src/app/features/authenticated/cobranca/pages/recebimentos-page.component.ts`

**Implementacao**:
- Exibir agenda financeira a partir de contexto disponivel no app; se o backend nao possuir endpoint de lista global de agendas, usar entradas por contrato/parcela existentes e registrar gap.
- Exibir `GET /cobranca/recebimentos` com data, valor, meio, parcela e status visual.
- Sinalizar que listagem atual nao e paginada quando houver volume relevante.

**Verificacao**:
- Nao inventar endpoint de lista global no frontend.
- Ausencia de paginacao e registrada como gap, nao resolvida com cache local inseguro.

### Step 109.4.2 - Criar detalhe financeiro de parcela

**Implementacao**:
- Reusar `GET /cobranca/parcelas/{id}`.
- Exibir valor atualizado, total recebido, status e acoes permitidas.
- Mostrar acao de recebimento somente para status em que backend permite recebimento.

**Verificacao**:
- Status `PAGA`, `INADIMPLENTE`, `EM_NEGOCIACAO` e `RENEGOCIADA` nao oferecem recebimento manual quando backend rejeitaria.
- Ainda assim, `409` do backend e tratado como fonte final de verdade.

### Step 109.4.3 - Implementar registro de recebimento manual

**Implementacao**:
- Formulario com `valorRecebido`, `dataRecebimento`, `meioPagamento`, `identificadorExterno` e `observacao`.
- Gerar `Idempotency-Key` no inicio da submissao e reaproveitar apenas no retry da mesma tentativa.
- Desabilitar submit durante envio.
- Apos sucesso, recarregar parcela e lista de recebimentos.
- Usar `statusParcela` e `novo` retornados no `RecebimentoResponse`; nao esperar `observacao` ou `registradoPor` na resposta.
- Tratar `400` validacao, `403` autorizacao e `409` idempotencia/estado invalido; manter `422` como fallback defensivo se provider/escrow propagar esse status.

**Verificacao**:
- Header `Idempotency-Key` presente.
- Key nao persiste em storage.
- Duplo clique nao dispara duas tentativas simultaneas.

### Step 109.4.4 - Testar recebimento manual

**Comandos**:
```bash
cd <sep-app-root>
npm run lint
npm run lint:scss
npm run test -- --run cobranca
```

**Cenarios minimos**:
- Recebimento valido chama `POST /parcelas/{id}/recebimentos` com header.
- Ausencia/conflito de key e estado invalido exibem erro.
- Parcela e recebimentos recarregam apos sucesso.
- Usuario sem role financeira nao ve acao operacional.

### Step 109.4.5 - Checkpoint C4

**Entregaveis**:
- Agenda/recebimentos financeiros.
- Detalhe financeiro de parcela.
- Registro manual com idempotencia.
- Specs da operacao sensivel.

**Pausa obrigatoria**:
- Review da Task F-9.4 antes de implementar inadimplencia/renegociacao.

---

## Task F-9.5 - Inadimplencia, contato e renegociacao

**Objetivo**: dar visibilidade operacional a inadimplencia e permitir contato/renegociacao conforme contratos backend.

**Pre-requisito**: Task F-9.4 concluida.

**Esforco**: 1-1,5 dia.

### Step 109.5.1 - Criar painel de inadimplencia

**Arquivos provaveis**:
- `src/app/features/authenticated/cobranca/pages/inadimplencia-page.component.ts`

**Implementacao**:
- Consumir `GET /cobranca/inadimplencia` com filtros `dias_atraso_min`, `dias_atraso_max` e `status`.
- Exibir parcelas atrasadas/inadimplentes com contrato, agenda, tomador, numero da parcela, vencimento, dias de atraso, valor original e status.
- Usar filtros simples e previsiveis; sem BI ou graficos fora de escopo.

**Verificacao**:
- Painel restrito a `FINANCEIRO`/`ADMIN` na UX.
- Dados sensiveis de notificacao/provider nao aparecem.

### Step 109.5.2 - Implementar registro de contato manual

**Implementacao**:
- Formulario curto com `descricao` e `diasAtraso`.
- Chamar `POST /cobranca/parcelas/{id}/contato`.
- Nao alterar status local da parcela; recarregar dados do backend se necessario.

**Verificacao**:
- Contato manual nao e apresentado como notificacao enviada pelo provider.
- Descricao tem limite visual e nao incentiva inserir CPF/CNPJ, dados bancarios ou segredos.

### Step 109.5.3 - Estender allowlist do step-up para cobranca

**Arquivos provaveis**:
- `src/app/core/interceptors/step-up.interceptor.ts`
- `src/app/core/interceptors/step-up.interceptor.spec.ts`

**Implementacao**:
- Adicionar match method-aware para `POST /api/v1/cobranca/parcelas/{id}/renegociacao`.
- Adicionar match method-aware para `PATCH /api/v1/cobranca/renegociacoes/{id}/aceite`.
- Manter a allowlist estreita; nao liberar toda a area `/cobranca`.
- Nao anexar step-up token em `PATCH /api/v1/cobranca/renegociacoes/{id}/recusa`, porque a recusa nao exige step-up no backend.

**Verificacao**:
- Specs do interceptor cobrem token anexado na criacao de renegociacao.
- Specs do interceptor cobrem token anexado no aceite de renegociacao.
- Specs do interceptor cobrem ausencia de token na recusa e em endpoint de cobranca nao sensivel.
- O token continua sendo enviado nos fluxos sensiveis ja existentes (senha, TOTP, aceite contratual).

### Step 109.5.4 - Implementar proposta de renegociacao pelo financeiro

**Implementacao**:
- Formulario com `novoValorParcela`, `novoVencimento`, `numeroParcelas`, `desconto` e `justificativa`.
- Abrir fluxo de step-up antes do `POST /parcelas/{id}/renegociacao`.
- Confirmar que o `step-up.interceptor.ts` anexa o token nessa URL apos o Step 109.5.3.
- Apos sucesso, mostrar proposta criada com `RenegociacaoResponse` (`parcelaOriginalId`, `agendaOriginalId`, `novoValorParcela`, `desconto`, `status`, `dataProposta`, `dataExpiracao`) e recarregar parcela.
- Tratar conflito de proposta ativa (`409`).

**Verificacao**:
- Step-up enviado pelo padrao existente apos a extensao da allowlist.
- Sem step-up, fluxo falha controladamente.
- Frontend nao calcula nova agenda substituta.

### Step 109.5.5 - Implementar aceite/recusa de renegociacao pelo tomador

**Implementacao**:
- Tela de detalhe de renegociacao com status, parcela original, agenda original, valor proposto, desconto, vencimento, numero de parcelas, proponente, datas de proposta/decisao/expiracao e agenda substituta quando retornada.
- Aceite chama `PATCH /renegociacoes/{id}/aceite` com step-up.
- Recusa chama `PATCH /renegociacoes/{id}/recusa` sem step-up, conforme backend.
- Confirmar que o `step-up.interceptor.ts` anexa token no aceite e nao anexa na recusa.
- Apos decisao, recarregar agenda/parcela.

**Verificacao**:
- Aceite exige step-up e nao aceita token vazio em fluxo real.
- Recusa nao cria nova agenda no frontend.
- Estados `ACEITA`, `RECUSADA` e `EXPIRADA` nao mostram acoes duplicadas.

### Step 109.5.6 - Testar inadimplencia e renegociacao

**Comandos**:
```bash
cd <sep-app-root>
npm run lint
npm run lint:scss
npm run test -- --run cobranca
```

**Cenarios minimos**:
- Filtros de inadimplencia chamam query params corretos.
- Contato manual registra evento e mantem UI estavel.
- Criacao de renegociacao envia step-up apos match da allowlist.
- Aceite envia step-up; recusa nao envia.
- `403`, `404` e `409` tratados; `422` tratado defensivamente se provider/escrow propagar esse status.

### Step 109.5.7 - Checkpoint C5

**Entregaveis**:
- Painel de inadimplencia.
- Registro de contato manual.
- Allowlist do step-up estendida e testada para cobranca.
- Proposta, aceite e recusa de renegociacao.
- Specs das operacoes sensiveis.

**Pausa obrigatoria**:
- Review da Task F-9.5 antes de fechamento.

---

## Task F-9.6 - Smoke, docs e fechamento

**Objetivo**: fechar cobertura, validar fluxo offline/real e atualizar documentacao da sprint.

**Pre-requisito**: Tasks F-9.1 a F-9.5 concluidas.

**Esforco**: 0,5-1 dia.

### Step 109.6.1 - Consolidar MSW e cenarios de erro

**Implementacao**:
- Revisar handlers de cobranca para fluxo feliz e erros principais.
- Garantir estado mockado coerente entre recebimento, parcela, inadimplencia e renegociacao.
- Garantir que role/ownership/step-up sejam simulados sem criar bypass do fluxo real.

**Verificacao**:
- MSW cobre tomador, financeiro, recebimento manual, inadimplencia e renegociacao.
- Dados sensiveis proibidos nao aparecem nas fixtures.

### Step 109.6.2 - Criar smoke E2E offline

**Arquivos provaveis**:
- `e2e/cobranca.spec.ts`

**Fluxo offline minimo**:
- Login mockado como tomador.
- Abrir agenda de contrato assinado.
- Ver parcelas e detalhe.
- Login/perfil financeiro mockado.
- Registrar recebimento manual.
- Ver inadimplencia.
- Criar proposta de renegociacao com step-up.
- Como tomador, aceitar ou recusar renegociacao conforme fixture.

**Verificacao**:
- Smoke nao depende de provider real.
- Fluxo nao usa dados persistidos sensiveis.

### Step 109.6.3 - Rodar validacao final

**Comandos**:
```bash
cd <sep-app-root>
npm run lint
npm run lint:scss
npm run test -- --run
npm run build
```

**Smoke real recomendado**:
- Backend `sep-api` local com cobranca Sprints 12-13.
- Contrato assinado com agenda gerada.
- Tomador consulta parcelas.
- Financeiro registra recebimento manual com `Idempotency-Key`.
- Financeiro registra contato/cria renegociacao.
- Tomador aceita renegociacao com step-up.
- Se nao houver massa de dados suficiente, registrar limite e validar ate o ponto suportado.

### Step 109.6.4 - Atualizar documentacao

**Arquivos provaveis**:
- `docs-SEP/specs/fase-3/109-fsprint-9-cobranca-web.md`
- `docs-SEP/docs-sep/PRD-FASE-3.md`
- `docs-SEP/docs-sep/CONTEXT-PARTE-2.md`
- `docs-SEP/AI-ROADMAP.md`
- `docs-SEP/repos/sep-app/README.md`

**Implementacao**:
- Marcar spec/steps como implementados somente apos conclusao real.
- Registrar branch, data, validacoes executadas e eventuais pendencias.
- Registrar qualquer gap de endpoint de lista global de agendas/parcelas para financeiro.
- Registrar limitacao real da listagem de recebimentos sem paginacao, se impactar UX.

### Step 109.6.5 - Checkpoint C6 final

**Entregaveis**:
- MSW e smoke offline.
- Validacao final lint/scss/test/build.
- Documentacao revisada.
- Gaps registrados.

**Pausa obrigatoria**:
- Code review da F-Sprint 9 completa antes de merge/PR.

---

## Definition of Done da F-Sprint 9

- Jornada de cobranca acessivel pelo shell autenticado.
- Tomador ve apenas agenda/parcelas autorizadas.
- Agenda e detalhe de parcela exibem valores/status vindos do backend.
- Financeiro acompanha recebimentos e registra recebimento manual com `Idempotency-Key`.
- Operacoes sensiveis respeitam step-up quando backend exige.
- Inadimplencia, contato manual e renegociacao estao navegaveis para perfis corretos.
- Aceite de renegociacao pelo tomador usa step-up; recusa nao exige step-up.
- Erros de autorizacao, step-up, validacao e estado invalido tratados sem quebrar a UI.
- Nenhuma regra financeira, workflow, notificacao provider, ownership ou auditoria e duplicada no frontend.
- MSW cobre fluxo feliz e erros principais.
- `npm run lint`, `npm run lint:scss`, `npm run test -- --run` e `npm run build` executados.
- Docs de spec/steps/PRD/CONTEXT/roadmap atualizados ao final da sprint.

## Checklist de code review final

- [ ] `CobrancaService` centraliza chamadas HTTP de cobranca.
- [ ] Componentes nao chamam endpoints diretamente.
- [ ] Modelos TypeScript refletem DTOs backend, sem metodos de dominio.
- [ ] Frontend nao calcula juros, multa, saldo, status ou elegibilidade de recebimento.
- [ ] `Idempotency-Key` e enviada no recebimento manual e nao persiste em storage.
- [ ] Submit de recebimento e renegociacao evita duplo clique.
- [ ] Step-up e aplicado em criacao/aceite de renegociacao conforme backend.
- [ ] Tomador nao ve painel financeiro nem dados operacionais internos.
- [ ] Dados de notificacao/provider, CPF/CNPJ, dados bancarios e tokens nao aparecem em UI, fixtures ou storage.
- [ ] Estados `400`, `403`, `404` e `409` tem tratamento de UI; `422` tem fallback defensivo.
- [ ] Ausencia de endpoint de lista global/paginacao e registrada como gap, se confirmada.
- [ ] Componentes mantem padrao Notion e nao usam cards aninhados.
- [ ] Testes cobrem service, agenda do tomador, recebimento manual, inadimplencia e renegociacao.
