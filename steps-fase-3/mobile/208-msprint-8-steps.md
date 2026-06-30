# Steps - M-Sprint 8 - Formalizacao e Contrato Mobile

**Spec de origem**: [`specs/fase-3/208-msprint-8-formalizacao-mobile.md`](../../specs/fase-3/208-msprint-8-formalizacao-mobile.md)

**Status**: mergeada em `origin/develop` via PR #105 (squash `be792df`, 2026-06-30). Gate M-8.0 e
Tasks M-8.1 a M-8.5 concluidos; suite (lint/scss/format/Vitest 274/build/e2e 8) verde e reconfirmada
em `origin/develop` pos-merge (`npm ci` limpo). Bug pre-existente de step-up (`type="submit"`/Enter
sem `[formGroup]`) corrigido.

**Objetivo geral**: permitir que o tomador autenticado localize o contrato a partir de
uma proposta propria, leia a versao contratual, registre o aceite com step-up e acompanhe
assinatura e documento assinado/CCB no PWA mobile, consumindo os contratos reais do
`sep-api` sem duplicar ownership, versionamento, regra contratual, assinatura ou validade
juridica no app.

**Esforco total estimado**: 5-7 dias de Dev Mobile dedicado.

**Repos de destino**:
- `sep-mobile`: codigo Angular/Ionic, testes, MSW e smoke PWA.
- `docs-SEP`: documentacao operacional editada apenas no working tree; operacao Git manual.

**Branch sugerida**:
- `feature/msprint-8-formalizacao-mobile`

**Design system vigente**: New Design System SEP mobile aplicado na M-Sprint 12.
Usar Ionic standalone, Ionicons, tokens e mixins `sep-mobile-*` existentes. Nao
reintroduzir Notion legado, Tailwind, shadcn/ui, Radix, React ou biblioteca nova de
icones sem ADR e aprovacao explicita.

**Estado confirmado durante o planejamento (2026-06-30)**:
- M-Sprint 7 esta presente em `origin/develop` pelo PR #100, com os reparos pos-merge
  dos PRs #102 e #103.
- O usuario confirmou a M-Sprint 8 desbloqueada. O precheck ainda deve executar `fetch`
  e validar a cadeia real antes de criar a branch.
- Contagens `rev-list` entre `origin/main` e `origin/develop` podem permanecer nao zero
  por merges/squashes anteriores; nao usar a contagem isoladamente como prova de bloqueio
  ou paridade. Conferir historico e conteudo integrado da M-7.
- O mobile atual usa Angular 20, Ionic 8 e Capacitor 8; confirmar novamente no precheck,
  sem downgrade ou upgrade de stack nesta sprint.

## Contratos backend consumidos

Contratos (`/api/v1/contratos`):
- `GET /api/v1/contratos/proposta/{propostaId}` -> `200 ContratoResponse`.
- `GET /api/v1/contratos/{id}` -> `200 ContratoResponse`.
- `GET /api/v1/contratos/{id}/versoes` -> `200 VersaoContratoResponse[]`, em ordem
  ascendente de numero.
- `PATCH /api/v1/contratos/{id}/aceite`, body vazio -> `200 ContratoResponse`, somente
  `CLIENTE` owner e com `X-Step-Up-Token`.
- `GET /api/v1/contratos/{id}/assinatura/status` -> `200 StatusAssinaturaResponse`.
- `GET /api/v1/contratos/{id}/documento-assinado` -> `200 application/pdf`, com
  `Content-Disposition` e `X-Document-Hash-Sha256`.

Credito (`/api/v1/credito`):
- `GET /api/v1/credito/propostas`, ja encapsulado por `CreditoMobileService`, e a fonte
  para a entrada/lista da jornada.
- `GET /api/v1/credito/propostas/{id}` continua sendo a fonte do detalhe da proposta e
  do CTA de formalizacao.

Autenticacao reforcada (`/api/v1/auth/step-up`):
- `POST /initiate` -> challenge efemero.
- `POST /complete` -> token efemero, em memoria e de uso unico.
- `stepUpInterceptor` deve passar a anexar `X-Step-Up-Token` tambem em
  `PATCH /api/v1/contratos/{id}/aceite`.

**Endpoints explicitamente fora do mobile**:
- `POST /api/v1/contratos/{id}/cancelar`: operacao `FINANCEIRO`/`ADMIN`.
- `POST /api/v1/contratos/{id}/assinar`: reprocesso manual `FINANCEIRO`/`ADMIN`.
- Webhook/provider Clicksign: processamento exclusivo do backend.

## Decisoes e gaps conhecidos

- Nao existe `GET /api/v1/contratos` para listar contratos. A tela de entrada deve listar
  propostas do proprio tomador com o `CreditoMobileService` e resolver o contrato apenas
  quando o usuario abrir uma proposta. Nao fazer N+1 e nao inventar lista local de contratos.
- Proposta aprovada sem contrato retorna `404` na consulta por proposta. Exibir
  "contrato ainda indisponivel" com retry; nao gerar contrato pelo mobile.
- O app pode oferecer entrada por proposta e rota direta por contrato, mas ownership
  continua sendo validado exclusivamente pelo backend.
- `conteudoTexto` e clausulas sao texto nao confiavel para renderizacao. Exibir como texto,
  nunca com `innerHTML`, parser Markdown ou interpretacao de tags.
- O aceite sempre se refere a versao vigente no backend. Antes de confirmar, mostrar numero
  e hash da versao lida; se houver corrida/regeneracao, tratar `409`, descartar a confirmacao
  anterior e recarregar o contrato.
- Depois do step-up, retornar ao detalhe e exigir novo toque explicito em "Aceitar contrato".
  Nao executar aceite automaticamente ao voltar da verificacao.
- `StepUpTokenStore` permanece em memoria e de uso unico. Nao persistir step-up token,
  contrato, conteudo, PDF, hash ou dados de aceite em `localStorage`, `sessionStorage` ou
  Capacitor Preferences.
- O controller de contratos ainda usa `@RequireStepUp` legado, que possui bypass backend
  para usuario sem MFA. O mobile deve exigir MFA habilitado antes de iniciar o aceite,
  mas isso nao substitui enforcement server-side. Go-live da jornada exige confirmar a
  politica operacional de MFA ou aprovar hardening backend para step-up estrito.
- Nao existe setup TOTP autenticado no mobile atual. Se `mfaHabilitado=false`, bloquear
  o aceite com orientacao segura; nao criar setup MFA improvisado dentro desta sprint.
- O documento disponivel e o PDF assinado retornado pelo backend. Nao prometer preview
  ou download de CCB antes de `ASSINADO` e antes do endpoint responder `200`.
- Download/abertura PWA usa blob transitorio e URL de objeto revogada. Build Android/iOS,
  filesystem nativo, compartilhamento e plugin Browser ficam fora da sprint.
- `idEnvelopeExterno`, `tomadorId`, `parecerOrigemId`, IP e User-Agent do aceite nao
  agregam valor ao tomador e nao devem ser exibidos.
- Status, transicoes, integridade, geracao da CCB e readiness para desembolso pertencem
  ao backend. O app apenas apresenta os snapshots recebidos.

## Fora de escopo

- Criar ou alterar endpoint backend.
- Lista global real de contratos.
- Geracao, edicao ou regeneracao de contrato/CCB.
- Assinatura nativa dentro do app ou integracao direta com Clicksign.
- Cancelamento, reenvio, reprocesso ou backoffice de formalizacao.
- Aditivos, renegociacao ou aceite de versao antiga.
- Calculo de hash, validacao juridica, CET, IOF, juros ou readiness de desembolso.
- Persistencia offline de contrato ou documento.
- Build Android/iOS e plugins nativos de arquivo/compartilhamento.

## Protocolo obrigatorio por Task

1. Executar somente a Task liberada pelo usuario.
2. Antes de editar, confirmar arquivos e comportamento atual.
3. Implementar a menor mudanca coerente com os padroes do repo.
4. Rodar as verificacoes indicadas.
5. Parar em checkpoint pre-commit com status, diff, testes, riscos e mensagem sugerida.
6. Aguardar aprovacao explicita antes de `git add` e `git commit`.
7. Usar paths especificos no staging; nunca `git add -A`.

**Skills obrigatorias na implementacao**:
- `coding-guidelines`: simplicidade, mudancas cirurgicas e verificacao orientada a meta.
- `clean-code`: nomes intencionais, componentes pequenos e testes F.I.R.S.T.
- `clean-architecture`: componentes orquestram UI e chamam services; DTOs ficam na
  borda HTTP; regras, ownership e transicoes contratuais permanecem no backend.

## Ordem de execucao recomendada

```text
M-8.0 (gate: Git, contratos, step-up e baseline)
   |
   v
M-8.1 (DTOs + ContratosMobileService)
   |
   v
M-8.2 (rotas + entrada por propostas + detalhe)
   |
   v
M-8.3 (leitura responsiva + versoes)
   |
   v
M-8.4 (aceite com step-up)
   |
   v
M-8.5 (assinatura + documento + testes + fechamento)
```

---

## Gate M-8.0 - Prechecks da M-Sprint 8

**Objetivo**: confirmar cadeia Git, contratos reais, comportamento do step-up e baseline
antes de qualquer alteracao no `sep-mobile`.

**Esforco**: 1-2 horas. Nao conta como task de implementacao.

### Step 208.0.1 - Confirmar a cadeia de integracao

**Comandos**:
```bash
cd <sep-mobile-root>
git fetch --all --prune
git status --short --branch
git log --oneline --decorate -15 origin/develop
git log --oneline --decorate -12 origin/main
git diff --stat origin/develop...origin/main
```

**Verificacao**:
- `origin/develop` contem M-7/PR #100 e os fixes #102/#103.
- Mudancas exclusivas de `main`, se existirem por topologia de squash/Dependabot, foram
  inspecionadas; nenhuma mudanca de produto necessaria para M-8 esta ausente de `develop`.
- Working tree limpo ou alteracoes do usuario identificadas e preservadas.
- Se a cadeia real contradizer o desbloqueio informado, parar e registrar evidencia.

### Step 208.0.2 - Atualizar base, limpar artefato temporario e criar branch

**Comandos**:
```bash
cd <sep-mobile-root>
git switch develop
git pull --ff-only
git switch -c feature/msprint-8-formalizacao-mobile
```

**Acoes em `docs-SEP`**:
- Remover `repos/sep-mobile/SPRINT-M-7-PR.md` somente ao iniciar efetivamente a M-8 e
  depois de confirmar que o PR M-7 ja usou esse artefato.
- A remocao fica apenas no working tree de `docs-SEP`; Git documental continua manual.

**Verificacao**:
- Branch criada a partir de `develop` atualizado.
- `SPRINT-M-7-PR.md` nao permanece como artefato temporario obsoleto.
- Se `pull --ff-only` falhar, parar e registrar o bloqueio.

### Step 208.0.3 - Confirmar stack e estrutura mobile

**Comandos**:
```bash
cd <sep-mobile-root>
node --version
npm --version
npm ls @angular/core @ionic/angular @capacitor/core
find src/app/core -maxdepth 3 -type f | sort
find src/app/features/tomador -maxdepth 4 -type f | sort
sed -n '1,220p' src/app/features/authenticated/authenticated.routes.ts
sed -n '1,180p' src/app/core/interceptors/step-up.interceptor.ts
```

**Verificacao**:
- Angular 20, Ionic 8 e Capacitor 8 continuam instalados.
- M-7 esta presente: lista/detalhe de propostas e `CreditoMobileService`.
- `StepUpService`, `StepUpTokenStore`, `StepUpComponent` e interceptor existem.
- New Design System SEP mobile continua sendo a base visual.

### Step 208.0.4 - Reconfirmar contratos backend

**Comandos**:
```bash
cd <sep-api-root>
sed -n '90,420p' src/main/java/com/dynamis/sep_api/contratos/web/controller/ContratoController.java
find src/main/java/com/dynamis/sep_api/contratos/web/dto -maxdepth 1 -type f | sort
sed -n '1,180p' src/main/java/com/dynamis/sep_api/contratos/web/dto/ContratoResponse.java
sed -n '1,180p' src/main/java/com/dynamis/sep_api/contratos/web/dto/VersaoContratoResponse.java
sed -n '1,160p' src/main/java/com/dynamis/sep_api/contratos/web/dto/StatusAssinaturaResponse.java
```

**Verificacao**:
- Endpoints, codigos HTTP, campos nullable e enums continuam iguais aos documentados.
- Aceite retorna `ContratoResponse`, nao `AceiteContratoResponse` isolado.
- Documento retorna PDF binario e headers de metadados, nao JSON/base64.
- Nao surgiu endpoint global de contratos. Se surgir, reavaliar a entrada antes de codar.
- Divergencia deve ser registrada antes de criar DTO mobile.

### Step 208.0.5 - Validar o gate de step-up

**Verificacao obrigatoria**:
- Confirmar que `PATCH /contratos/{id}/aceite` ainda usa `@RequireStepUp`.
- Confirmar a limitacao de bypass para `mfaHabilitado=false`.
- Confirmar que o usuario alvo do smoke possui MFA ou que o MSW simula MFA habilitado.
- Confirmar o fluxo `next` da tela mobile e a semantica de token em memoria/uso unico.
- Se a operacao de producao exigir enforcement estrito no backend, registrar como
  bloqueio de go-live; nao ampliar silenciosamente o escopo mobile.

### Step 208.0.6 - Rodar baseline

**Comandos**:
```bash
cd <sep-mobile-root>
npm run lint
npm run lint:scss
npm run format:check
npm run test
npm run build
```

**Verificacao**:
- Todos os comandos passam antes da implementacao.
- Falhas preexistentes ou ambientais ficam registradas no checkpoint.

### Definicao de pronto do Gate M-8.0

- [ ] M-7 e fixes pos-merge presentes em `origin/develop`.
- [ ] Cadeia Git validada por historico/conteudo, nao apenas por contagem.
- [ ] Branch M-8 criada da base correta.
- [ ] Artefato temporario M-7 tratado conforme `AGENT.md`.
- [ ] Contratos backend e gap de lista global reconfirmados.
- [ ] Limitacao e politica de step-up registradas.
- [ ] Stack, estrutura e baseline confirmadas.

**Commit sugerido**: nenhum; prechecks nao geram commit.

---

## Task M-8.1 - DTOs e ContratosMobileService

**Objetivo**: criar uma borda HTTP tipada para formalizacao, centralizando URLs, respostas
JSON e download binario sem espalhar contrato de transporte pelos componentes.

**Pre-requisito**: Gate M-8.0 concluido.

**Esforco**: 0,5-1 dia.

**Arquivos esperados**:
- `src/app/core/api/api.models.ts`
- `src/app/core/contratos/contratos-mobile.service.ts`
- `src/app/core/contratos/contratos-mobile.service.spec.ts`

### Step 208.1.1 - Adicionar DTOs de borda

**Tipos e DTOs minimos**:
- `StatusFormalizacao`:
  `GERADO | AGUARDANDO_ACEITE | ACEITO | EM_ASSINATURA | ASSINADO | RECUSADO | CANCELADO`.
- `StatusEnvelope`:
  `RASCUNHO | ENVIADO | VISUALIZADO | ASSINADO | RECUSADO | EXPIRADO`.
- `TipoContrato`: `MUTUO | CCB | OUTROS`.
- `ClausulaContratoResponse`.
- `VersaoContratoResponse`.
- `AceiteContratoResponse`.
- `ContratoResponse`.
- `StatusAssinaturaResponse`, com campos nullable conforme backend.
- Estrutura local de resultado do download contendo `blob`, nome de arquivo e hash
  apenas se o service precisar devolver os headers de forma tipada.

**Regras**:
- Datas como `string` ISO.
- Campos nullable como `T | null`.
- Espelhar os campos do backend na borda, sem criar entidade de dominio mobile.
- A presenca de um campo no DTO nao obriga sua exibicao na UI.
- Nao calcular status derivado, hash ou validade.

### Step 208.1.2 - Criar ContratosMobileService

**Metodos esperados**:
- `consultarPorProposta(propostaId)`.
- `consultarPorId(contratoId)`.
- `listarVersoes(contratoId)`.
- `registrarAceite(contratoId)`.
- `consultarStatusAssinatura(contratoId)`.
- `baixarDocumentoAssinado(contratoId)`.

**Regras**:
- Usar `HttpClient`, `environment.apiBaseUrl`, interceptors existentes e
  `firstValueFrom`, seguindo os services mobile atuais.
- Aceite envia body vazio coerente com o backend; o interceptor injeta o token.
- Download usa `observe: 'response'` e `responseType: 'blob'` para ler
  `Content-Disposition` e `X-Document-Hash-Sha256`.
- Sanitizar o nome sugerido pelo header antes de usa-lo no atributo `download`; fallback
  local `contrato-{id}-assinado.pdf`.
- Propagar erros HTTP para a UI. Nao transformar `404` em contrato fake.
- Nao persistir respostas ou blob.

### Step 208.1.3 - Testar o service

**Cenarios obrigatorios**:
- Consulta por proposta e por contrato montam paths exatos.
- Versoes usam o endpoint correto e preservam a ordem recebida.
- Aceite usa `PATCH`, body vazio e retorna `ContratoResponse`.
- Status de assinatura usa `GET`.
- Download solicita blob e captura nome/hash dos headers.
- `403`, `404`, `409` e erro de rede sao propagados.
- Nenhum metodo grava storage.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
npm run test -- src/app/core/contratos/contratos-mobile.service.spec.ts
```

### Definicao de pronto da Task M-8.1

- [ ] DTOs refletem os contratos reais.
- [ ] Service centraliza todas as chamadas da M-8.
- [ ] Componentes nao conhecem URLs de contratos.
- [ ] Download e tratado como binario transitorio.
- [ ] Nenhuma regra contratual foi adicionada ao mobile.
- [ ] Specs do service passam.

### Commit sugerido
```text
feat(mobile): adicionar contratos e servico de formalizacao
```

---

## Task M-8.2 - Rotas, entrada por propostas e detalhe do contrato

**Objetivo**: tornar a formalizacao acessivel ao tomador sem simular um endpoint de lista
de contratos inexistente e sem duplicar a lista de propostas da M-7.

**Pre-requisito**: Task M-8.1 concluida.

**Esforco**: 1 dia.

**Arquivos esperados**:
- `src/app/features/authenticated/authenticated.routes.ts`
- `src/app/features/tomador/credito/proposta-detail.component.*`
- `src/app/features/tomador/formalizacao/formalizacao-list.component.*`
- `src/app/features/tomador/formalizacao/contrato-detail.component.*`
- Specs correspondentes.

### Step 208.2.1 - Criar rotas lazy

**Rotas**:
```text
/app/formalizacao
/app/formalizacao/proposta/:propostaId
/app/formalizacao/contratos/:contratoId
```

**Regras**:
- Herdar `authGuard` do shell e aplicar `roleGuard` com `roles: ['CLIENTE']`.
- Usar `data.tab = 'propostas'` para manter contexto da jornada do tomador.
- Nao duplicar shell, header ou tab bar.
- Nao expor rotas internas de cancelamento/reprocesso.

### Step 208.2.2 - Implementar entrada sem N+1

**Comportamento esperado**:
- Reutilizar `CreditoMobileService.listarPropostas` como fonte da tela de entrada.
- Listar propostas do proprio tomador, preferindo filtro `APROVADA` quando o contrato
  vigente confirmar essa pre-condicao.
- Ao tocar, navegar para `/app/formalizacao/proposta/{propostaId}`.
- Consultar contrato por proposta somente na abertura; nunca consultar um contrato para
  cada item da lista.
- Prever loading, vazio, erro, retry, refresh e paginacao.

**Texto de UX**:
- A lista e de propostas aptas a abrir formalizacao, nao uma falsa "lista de contratos".
- `404` ao abrir significa contrato ainda nao gerado/disponivel.

### Step 208.2.3 - Integrar o detalhe da proposta M-7

**Comportamento esperado**:
- Adicionar CTA "Ver formalizacao" para proposta `APROVADA`.
- Nao inferir existencia do contrato apenas pelo status da proposta.
- O CTA abre a rota por proposta; a consulta do backend confirma a existencia.
- Demais status nao exibem CTA primario indevido.

### Step 208.2.4 - Implementar carregamento do detalhe

**Comportamento esperado**:
- Rota por proposta chama `consultarPorProposta`.
- Rota por contrato chama `consultarPorId`.
- Depois da primeira resposta, usar `contrato.id` como identidade das demais operacoes.
- Exibir tipo, status, datas e resumo da versao vigente.
- Nao exibir IDs internos, dados tecnicos de aceite ou envelope externo.
- Tratar contrato sem versao como estado valido/indisponivel, sem crash.

**Erros**:
- `403`: acesso negado/ownership; nao revelar existencia de contrato alheio.
- `404`: contrato ainda indisponivel ou id inexistente.
- rede/`5xx`: retry mantendo apenas ids de rota em memoria.

### Step 208.2.5 - Testar navegacao e detalhe

**Cenarios obrigatorios**:
- Rotas exigem `CLIENTE`.
- Entrada pagina propostas sem N+1 de contratos.
- CTA aparece em proposta aprovada e nao em status indevido.
- Consulta por proposta navega/carrega o contrato correto.
- Rota direta consulta por contrato.
- Loading, vazio, `403`, `404`, erro e retry.
- Nenhum controle interno e renderizado.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
npm run lint:scss
npm run test -- src/app/features/tomador/formalizacao src/app/features/tomador/credito
npm run build
```

### Definicao de pronto da Task M-8.2

- [ ] Jornada acessivel pelo detalhe da proposta e pela entrada de formalizacao.
- [ ] Lista usa propostas sem inventar endpoint de contratos.
- [ ] Nenhuma consulta N+1 foi criada.
- [ ] Ownership permanece no backend.
- [ ] Estados mobile e erros principais foram tratados.
- [ ] Testes de rota/entrada/detalhe passam.

### Commit sugerido
```text
feat(mobile): adicionar jornada de formalizacao
```

---

## Task M-8.3 - Leitura responsiva e historico de versoes

**Objetivo**: permitir leitura clara do texto e das clausulas contratuais em viewport
mobile, incluindo historico somente leitura e identificacao inequívoca da versao vigente.

**Pre-requisito**: Task M-8.2 concluida.

**Esforco**: 0,5-1 dia.

**Arquivos esperados**:
- `src/app/features/tomador/formalizacao/contrato-detail.component.*`
- `src/app/features/tomador/formalizacao/contrato-content.component.*`, somente se
  houver duplicacao real que justifique componente apresentacional.
- Specs correspondentes.

### Step 208.3.1 - Exibir a versao vigente

**Conteudo permitido**:
- numero e data de geracao.
- tipo e status do contrato.
- hash SHA-256 para conferencia, com quebra/copia segura.
- `conteudoTexto`.
- clausulas em ordem, com titulo e texto.

**Regras**:
- Renderizar conteudo com interpolacao/text nodes.
- Preservar quebras de linha via CSS; nunca usar `innerHTML`.
- Nao exibir `parecerOrigemId`, `tomadorId`, IP ou User-Agent.
- Nao recalcular nem "validar" o hash no app.

### Step 208.3.2 - Implementar historico de versoes

**Comportamento esperado**:
- Chamar `GET /contratos/{id}/versoes` sob demanda.
- Preservar a ordem ascendente recebida.
- Permitir selecionar uma versao para leitura sem alterar `versaoVigente`.
- Marcar visualmente qual versao e a vigente.
- Aceite permanece sempre associado a versao vigente retornada no contrato; versao
  historica nunca apresenta CTA de aceite.
- Falha no historico nao impede leitura da versao vigente embutida no contrato.

### Step 208.3.3 - Garantir ergonomia e acessibilidade mobile

**UI**:
- Usar `ion-content` e primitivos `sep-mobile-*`.
- Tipografia legivel, contraste do tema claro/escuro e largura de leitura controlada.
- Clausulas longas quebram linha; hashes e palavras extensas nao geram overflow.
- Touch targets de pelo menos 44px.
- Nao aninhar cards desnecessariamente.
- Funcionar em Pixel 5 e largura 320px.

### Step 208.3.4 - Testar leitura contratual

**Cenarios obrigatorios**:
- Contrato sem versao, com uma versao e com multiplas versoes.
- Clausulas renderizadas na ordem.
- Conteudo contendo tags aparece como texto literal, sem execucao/renderizacao HTML.
- Selecao historica nao muda a versao vigente nem habilita aceite.
- Hash e texto longo nao causam overflow.
- Falha de versoes preserva o conteudo vigente.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
npm run lint:scss
npm run test -- src/app/features/tomador/formalizacao
npm run build
```

### Definicao de pronto da Task M-8.3

- [ ] Versao vigente e inequivoca.
- [ ] Conteudo e clausulas sao somente leitura e tratados como texto.
- [ ] Historico nao altera estado nem permite aceite de versao antiga.
- [ ] Layout funciona em 320px e nos dois temas.
- [ ] Testes de leitura e seguranca de renderizacao passam.

### Commit sugerido
```text
feat(mobile): exibir contrato e historico de versoes
```

---

## Task M-8.4 - Aceite contratual com step-up

**Objetivo**: registrar o consentimento explicito do tomador sobre a versao vigente,
usando o fluxo de step-up existente e sem automatizar uma decisao juridicamente sensivel.

**Pre-requisito**: Tasks M-8.1-M-8.3 concluidas e gate de MFA resolvido.

**Esforco**: 1 dia.

**Arquivos esperados**:
- `src/app/core/interceptors/step-up.interceptor.ts`
- `src/app/core/interceptors/step-up.interceptor.spec.ts`
- `src/app/features/tomador/formalizacao/contrato-detail.component.*`
- Specs correspondentes.

### Step 208.4.1 - Estender o interceptor

**Mudanca**:
- Adicionar apenas `PATCH /api/v1/contratos/{id}/aceite` a `STEP_UP_ENDPOINTS`.

**Regras**:
- Guardar metodo e path exatos; `GET` de contrato/documento nao recebe step-up token.
- Consumir o token uma unica vez conforme `StepUpTokenStore`.
- Nao adicionar header em host externo ou rota parecida.
- Atualizar comentario e testes do interceptor.

### Step 208.4.2 - Implementar confirmacao explicita

**Comportamento esperado**:
- CTA aparece somente para `AGUARDANDO_ACEITE`, versao vigente carregada e usuario
  `CLIENTE`.
- Abrir confirmacao com numero da versao, hash e texto claro de consentimento.
- Exigir acao afirmativa do usuario; fechar/cancelar nao chama API.
- Desabilitar duplo submit.
- Nao usar checkbox pre-marcado.
- Nao permitir aceite enquanto o usuario visualiza versao historica.

### Step 208.4.3 - Executar o fluxo de step-up

**Comportamento esperado**:
- Se MFA habilitado e store sem token, navegar para
  `/app/step-up?next=/app/formalizacao/contratos/{id}`.
- Ao voltar, recarregar contrato e exigir nova confirmacao/toque.
- Com token disponivel, chamar `registrarAceite`.
- Em sucesso, usar o `ContratoResponse` devolvido para atualizar a tela e consultar
  status de assinatura.
- Limpar/consumir token mesmo quando a request falhar, conforme interceptor.

**Usuario sem MFA**:
- Nao chamar aceite apoiado no bypass legado.
- Exibir que a verificacao adicional precisa estar habilitada.
- Nao criar setup TOTP incompleto nesta task.

### Step 208.4.4 - Tratar concorrencia e erros

**Estados esperados**:
- `403` com indicio de step-up ausente/expirado: limpar token e oferecer nova verificacao.
- `403` de ownership/role: acesso negado, sem loop de step-up.
- `404`: contrato nao encontrado.
- `409`: versao/estado mudou; fechar confirmacao, recarregar contrato e exigir nova leitura.
- rede/`5xx`: informar falha sem assumir aceite; recarregar antes de permitir nova tentativa.

### Step 208.4.5 - Testar o aceite

**Cenarios obrigatorios**:
- Interceptor anexa token somente ao PATCH exato e o consome uma vez.
- CTA existe apenas para a versao vigente em `AGUARDANDO_ACEITE`.
- Cancelar confirmacao nao chama API.
- Sem MFA, aceite e bloqueado.
- Sem token e com MFA, navega ao step-up com `next` relativo.
- Retorno nao dispara aceite automaticamente.
- Confirmacao chama PATCH uma vez e usa a resposta atualizada.
- `403` step-up, `403` ownership, `404`, `409`, rede e duplo toque.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
npm run lint:scss
npm run test -- src/app/core/interceptors/step-up.interceptor.spec.ts
npm run test -- src/app/features/tomador/formalizacao
npm run build
```

### Definicao de pronto da Task M-8.4

- [ ] Aceite exige confirmacao explicita e step-up.
- [ ] Token e efemero, em memoria e de uso unico.
- [ ] Nenhum aceite automatico ocorre depois da verificacao.
- [ ] Corrida de versao/estado exige recarga e nova confirmacao.
- [ ] Usuario sem MFA nao usa o bypass legado pelo mobile.
- [ ] Testes de seguranca, concorrencia e erro passam.

### Commit sugerido
```text
feat(mobile): proteger aceite contratual com step-up
```

---

## Task M-8.5 - Status de assinatura, documento e fechamento

**Objetivo**: concluir a jornada com acompanhamento do envelope, acesso protegido ao PDF
assinado/CCB, mocks deterministas, cobertura proporcional, smoke PWA e documentacao.

**Pre-requisito**: Tasks M-8.1-M-8.4 concluidas.

**Esforco**: 1-1,5 dia.

**Arquivos esperados**:
- `src/app/features/tomador/formalizacao/assinatura-status.component.*`, somente se
  remover duplicacao real do detalhe.
- `src/app/features/tomador/formalizacao/contrato-detail.component.*`
- `src/mocks/handlers.ts`
- `e2e/formalizacao-mobile.spec.ts`
- Specs dos arquivos alterados.
- `docs-SEP/repos/sep-mobile/README.md`
- `docs-SEP/docs-sep/PRD-FASE-3.md`
- `docs-SEP/docs-sep/CONTEXT-PARTE-2.md`
- `docs-SEP/AI-ROADMAP.md`
- `docs-SEP/repos/sep-mobile/SPRINT-M-8-PR.md`

### Step 208.5.1 - Exibir status da assinatura

**Estados do contrato**:
- `ACEITO`: aceite registrado; envio automatico pode estar pendente.
- `EM_ASSINATURA`: exibir estado do envelope quando presente.
- `ASSINADO`: documento pode estar disponivel.
- `RECUSADO` e `CANCELADO`: finais, sem CTA de aceite/download indevido.

**Estados do envelope**:
- `RASCUNHO`, `ENVIADO`, `VISUALIZADO`, `ASSINADO`, `RECUSADO`, `EXPIRADO`.

**Regras**:
- Consultar status por acao de refresh e depois do aceite.
- Nao implementar polling infinito ou background timer nesta sprint.
- `statusEnvelope=null` e normal antes da criacao do envelope.
- Nao exibir `idEnvelopeExterno`.
- Nao inferir assinatura concluida apenas porque o contrato foi aceito.

### Step 208.5.2 - Implementar acesso ao documento assinado

**Comportamento esperado**:
- Habilitar CTA somente quando o estado indicar assinatura concluida, mas aceitar o
  endpoint como fonte final de disponibilidade.
- Chamar `baixarDocumentoAssinado`.
- Criar URL de objeto apenas no momento da abertura/download.
- Revogar URL em `finally` ou depois da acao do browser.
- Nao guardar blob, base64, URL de objeto ou hash em storage persistente.
- Exibir erro seguro para `403`, `404` e `409`.

**Regras de seguranca**:
- Download sempre passa pela API autenticada do SEP.
- Nao abrir URL de provider externo.
- Nao inserir conteudo do PDF no DOM.
- Nao logar bytes, conteudo contratual ou token.

### Step 208.5.3 - Atualizar MSW

**Cenarios minimos**:
- proposta aprovada com contrato `AGUARDANDO_ACEITE`.
- consulta por proposta e por id.
- contrato sem versao e com multiplas versoes.
- aceite `200`, ownership `403`, inexistente `404` e conflito `409`.
- step-up initiate/complete para o smoke.
- assinatura sem envelope, `ENVIADO`, `VISUALIZADO`, `ASSINADO`, `RECUSADO` e `EXPIRADO`.
- documento PDF ficticio `200` e indisponivel `409`.

**Regras**:
- Persistir no maximo estado mock necessario para sobreviver a navegacao/reload do E2E.
- Nao persistir conteudo contratual real, token ou PII.
- Usar dados e PDF integralmente ficticios.
- Handlers respeitam paths, metodos e status HTTP reais.

### Step 208.5.4 - Completar Vitest

**Cobertura minima**:
- `ContratosMobileService`.
- rotas, entrada e CTA da proposta.
- detalhe, conteudo textual e historico.
- aceite e integracao com step-up.
- status de assinatura.
- blob/headers, revogacao da URL e erros de documento.
- loading, vazio, retry, `403`, `404` e `409`.
- ausencia de persistencia de contrato/PDF/token.

**Nota Ionic/happy-dom**:
- Seguir a convencao atual por instancia para web components Ionic que o happy-dom nao
  monta. Nao criar workaround global sem necessidade.

### Step 208.5.5 - Criar smoke Playwright PWA

**Fluxo minimo com MSW**:
1. Login como `CLIENTE` com MFA habilitado.
2. Abrir proposta aprovada.
3. Entrar na formalizacao por proposta.
4. Ler numero/hash e conteudo da versao vigente.
5. Abrir historico e voltar para a versao vigente.
6. Confirmar aceite; concluir step-up; retornar sem aceite automatico.
7. Confirmar novamente e registrar o aceite.
8. Atualizar status ate `ASSINADO`.
9. Baixar/abrir PDF ficticio e validar nome/tipo sem persistencia.

**Viewports**:
- Pixel 5 ou equivalente.
- Repetir o fluxo critico em largura 320px.

**Assercoes negativas obrigatorias**:
- nenhum `tomadorId`, `parecerOrigemId`, IP, User-Agent ou envelope externo.
- nenhum botao de cancelar/reprocessar/enviar para assinatura.
- nenhuma tag do conteudo executada como HTML.
- nenhum aceite automatico no retorno do step-up.
- nenhum blob/base64/token em storage.

### Step 208.5.6 - Rodar suite final

**Comandos**:
```bash
cd <sep-mobile-root>
npm run lint
npm run lint:scss
npm run format:check
npm run test
npm run build
npm run e2e -- e2e/smoke.spec.ts e2e/onboarding-mobile.spec.ts e2e/credito-mobile.spec.ts e2e/formalizacao-mobile.spec.ts
```

**Verificacao**:
- Suite verde ou falhas ambientais/preexistentes registradas com evidencia.
- Smokes de onboarding e credito continuam verdes.
- Build AOT e obrigatorio; Vitest isolado nao detecta todas as regressões de tipos.
- Nenhum budget novo acima do limite de erro.

### Step 208.5.7 - Atualizar documentacao e PR temporario

**Atualizacoes**:
- Marcar M-8 como implementada somente depois da conclusao real.
- Documentar rotas, service, estados, step-up, download e limites de seguranca em
  `repos/sep-mobile/README.md`.
- Atualizar PRD, CONTEXT e AI Roadmap no mesmo ciclo.
- Criar `repos/sep-mobile/SPRINT-M-8-PR.md` com summary, test plan, mudancas,
  contratos, decisoes, riscos, dividas, follow-ups e commits.
- Registrar explicitamente o gap do step-up backend legado e a ausencia de lista global.
- Nao criar docs dentro de `sep-mobile`.

### Definicao de pronto da Task M-8.5

- [ ] Status local e do envelope sao apresentados sem inferencia.
- [ ] Documento assinado e acessado pela API e mantido apenas transitoriamente.
- [ ] MSW cobre sucesso, estados e erros principais.
- [ ] Vitest cobre service, componentes, step-up e blob.
- [ ] Smoke PWA percorre leitura, step-up, aceite, assinatura e documento.
- [ ] Suite final e build AOT executados.
- [ ] Docs e indices revisados.
- [ ] PR temporario M-8 criado no fim da sprint.

### Commit sugerido
```text
test(mobile): cobrir formalizacao e documento assinado
```

---

## Definition of Done da M-Sprint 8

- [ ] Cadeia Git, baseline e contratos validados antes da implementacao.
- [ ] Tomador acessa formalizacao somente de proposta/contrato autorizado pelo backend.
- [ ] Entrada por propostas nao cria N+1 nem simula lista global de contratos.
- [ ] Contrato, versao vigente, clausulas e historico sao legiveis em viewport mobile.
- [ ] Conteudo contratual e renderizado como texto, nunca HTML.
- [ ] Versao historica nao permite aceite.
- [ ] Aceite exige confirmacao explicita e step-up de uso unico.
- [ ] Retorno do step-up nao dispara aceite automaticamente.
- [ ] Corrida de versao/estado `409` exige recarga e nova confirmacao.
- [ ] Usuario sem MFA nao usa o bypass legado pelo app.
- [ ] Status de assinatura vem da API, sem transicao calculada no mobile.
- [ ] PDF assinado/CCB e obtido pela API autenticada e nao e persistido.
- [ ] Operacoes `FINANCEIRO`/`ADMIN` nao aparecem no mobile.
- [ ] Loading, vazio, sucesso, rede, `403`, `404` e `409` possuem estados de UI.
- [ ] PWA funciona em Pixel 5 e 320px, claro/escuro, sem overflow.
- [ ] `npm run lint`, `lint:scss`, `format:check`, `test`, `build` e smoke PWA
  passam ou possuem falha preexistente documentada.
- [ ] README mobile, PRD, CONTEXT e AI Roadmap revisados no fechamento.
- [ ] `SPRINT-M-8-PR.md` criado no fim da sprint.

## Checklist de code review da M-Sprint 8

- [ ] Componentes chamam `ContratosMobileService`; URLs nao vazam para a UI.
- [ ] DTOs refletem o backend e nao viram entidades/regra de dominio.
- [ ] Nenhum endpoint global de contratos foi inventado.
- [ ] Lista por propostas evita N+1.
- [ ] `roleGuard CLIENTE` e ownership backend permanecem ativos.
- [ ] Conteudo e clausulas usam text nodes/interpolacao, sem `innerHTML`.
- [ ] Hash nao e recalculado nem tratado como validacao juridica local.
- [ ] IDs internos, IP, User-Agent e envelope externo nao aparecem.
- [ ] CTA de aceite so existe para versao vigente em `AGUARDANDO_ACEITE`.
- [ ] Confirmacao identifica numero/hash da versao e nao vem pre-confirmada.
- [ ] Interceptor anexa token somente ao PATCH exato.
- [ ] Token nao e persistido e e consumido uma unica vez.
- [ ] Retorno do step-up exige nova confirmacao.
- [ ] `403` de step-up nao cria loop para `403` de ownership.
- [ ] `409` recarrega contrato e invalida confirmacao antiga.
- [ ] Usuario sem MFA nao cai no bypass legado pelo mobile.
- [ ] App nao chama cancelamento, reprocesso, provider ou webhook.
- [ ] Blob e URL de objeto sao transitorios e a URL e revogada.
- [ ] PDF/conteudo/token nao aparecem em logs, mocks persistentes ou storage.
- [ ] Layout usa Ionic/New Design System SEP, touch targets estaveis e sem overflow.
- [ ] Build AOT, testes, smoke e docs acompanham o comportamento entregue.
