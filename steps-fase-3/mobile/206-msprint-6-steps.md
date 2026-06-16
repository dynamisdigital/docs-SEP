# Steps - M-Sprint 6 - Onboarding Mobile

**Spec de origem**: [`specs/fase-3/206-msprint-6-onboarding-mobile.md`](../../specs/fase-3/206-msprint-6-onboarding-mobile.md)

**Status**: planejada para execucao no repo `sep-mobile`, branch sugerida `feature/msprint-6-onboarding-mobile`.

**Objetivo geral**: implementar o onboarding mobile do tomador em PWA/Ionic, consumindo APIs existentes de onboarding/KYC/KYB e mantendo regra de negocio, validacoes regulatórias e workflow no backend.

**Esforco total estimado**: 4-6 dias de Dev Mobile dedicado.

**Repo de destino**: `sep-mobile`.

**Localizacao do projeto mobile**: `<sep-mobile-root>/`.

**Design system vigente**: usar o New Design System SEP mobile aplicado na M-Sprint 12. Nao reintroduzir tokens Notion legados, Tailwind, shadcn/ui, Radix, React ou biblioteca nova de icones sem ADR/aprovacao explicita.

**Estado esperado antes da sprint**:
- M-Sprint 12 (`212`) concluida e validada no `sep-mobile`.
- M-Sprint 5 concluida e integrada na branch base definida pelo time.
- Backend Fase 2 em `main`, com APIs de onboarding/KYC/KYB disponiveis.
- Autenticacao mobile, shell autenticado, tabs e interceptors funcionando.
- MSW, Vitest e Playwright PWA disponiveis no repo ou planejados para ajuste nesta sprint.

**Ordem de execucao recomendada**:

```text
M-6.0 (prechecks)
   |
   v
M-6.1 (contratos + OnboardingMobileService)
   |
   v
M-6.2 (rota + entrypoint na tab do tomador)
   |
   v
M-6.3 (formularios PF/PJ)
   |
   v
M-6.4 (upload de documentos)
   |
   v
M-6.5 (status, pendencias e feedback)
   |
   v
M-6.6 (MSW, Vitest, Playwright PWA e docs)
```

**Como usar este arquivo**:
1. Execute os prechecks da Task M-6.0 antes de editar.
2. Execute as tasks na ordem indicada.
3. Em cada step, rode a verificacao antes de seguir.
4. Nao replique regra KYC/KYB no app; o mobile coleta dados, envia documentos e apresenta status do backend.
5. Comite por task ou por grupo coerente com mensagens Conventional Commits.

**Pre-requisitos globais**:
- Branch criada a partir da base correta e atualizada.
- Backend local rodando em `http://localhost:8080`, ou MSW cobrindo a jornada para testes de UI.
- Usuario `CLIENTE`/tomador disponivel para login local.
- Endpoints de onboarding documentados no backend e consumiveis pelo mobile.
- CORS do backend aceitando `http://localhost:8100` quando validar contra API real.

**Fora de escopo durante estes steps**:
- Backoffice/admin mobile.
- OCR nativo ou leitura automatica de documento.
- Build Android/iOS.
- Regras de decisao KYC/KYB no app.
- Novos endpoints backend.
- Fluxos de credora, credito, formalizacao ou cobranca.

---

## Task M-6.0 - Prechecks da M-Sprint 6

**Objetivo**: confirmar que mobile, backend e documentacao estao no ponto correto para iniciar o onboarding do tomador.

**Pre-requisito**: M-Sprint 12 concluida e branch da M-Sprint 6 criada a partir da base combinada.

**Esforco**: 30-60 min.

### Step 206.0.1 - Confirmar estado do repo mobile

**Comando**:
```bash
cd <sep-mobile-root>
git status --short --branch
find src/app -maxdepth 4 -type f | sort | sed -n '1,220p'
```

**Verificacao**:
- Branch esperada: `feature/msprint-6-onboarding-mobile` ou nome equivalente.
- Nao ha alteracoes pendentes nao relacionadas.
- Shell autenticado, tabs, guards, interceptors e theme service existem.
- M-Sprint 12 esta presente: tokens DS, mixins mobile, `global.scss` e dark mode.

### Step 206.0.2 - Confirmar contratos backend de onboarding

**Comando**:
```bash
cd <sep-api-root>
grep -R "onboarding" -n src/main/java src/test/java | sed -n '1,220p'
grep -R "documento" -n src/main/java src/test/java | sed -n '1,220p'
```

**Verificacao**:
- Identificar endpoints reais de iniciar onboarding, enviar dados PF/PJ, upload de documento e consultar status.
- Confirmar payloads, status HTTP, campos obrigatorios e enums.
- Registrar divergencia antes de implementar se a API real divergir da documentacao.

### Step 206.0.3 - Confirmar backend local ou MSW

**Comando**:
```bash
curl -i http://localhost:8080/actuator/health
cd <sep-mobile-root>
npm run
```

**Verificacao**:
- Backend responde `200 OK`, ou a jornada tera cobertura MSW para desenvolvimento/testes.
- Scripts de `lint`, `lint:scss`, `test`, `build` e `e2e` existem ou possuem equivalentes.

### Step 206.0.4 - Rodar baseline antes de editar

**Comando**:
```bash
cd <sep-mobile-root>
npm run lint
npm run lint:scss
npm run test
npm run build
```

**Verificacao**:
- Todos os comandos passam antes da implementacao.
- Falha preexistente deve ser registrada no checkpoint antes de editar.

### Definicao de pronto da Task M-6.0
- [ ] Branch e working tree conferidos
- [ ] M-Sprint 12 confirmada no mobile
- [ ] Contratos backend de onboarding identificados
- [ ] Backend local ou MSW disponivel
- [ ] Baseline de lint/test/build registrado

### Commit sugerido
Nao gera commit - e apenas validacao de ambiente.

---

## Task M-6.1 - Contratos e OnboardingMobileService

**Objetivo**: criar modelos e servico mobile para centralizar chamadas de onboarding, sem espalhar URLs ou payloads nos componentes.

**Pre-requisito**: Task M-6.0 concluida.

**Esforco**: 0,5-1 dia.

**Arquivos esperados**:
- `<sep-mobile-root>/src/app/core/api/api.models.ts`
- `<sep-mobile-root>/src/app/core/onboarding/onboarding-mobile.service.ts`
- `<sep-mobile-root>/src/app/core/onboarding/onboarding-mobile.service.spec.ts`

### Step 206.1.1 - Mapear modelos mobile de onboarding

**Arquivo**: `<sep-mobile-root>/src/app/core/api/api.models.ts`

**Comportamento esperado**:
- Adicionar apenas interfaces/enums exigidos pela API real.
- Separar request de PF, request de PJ, documento, upload response e status.
- Usar nomes alinhados ao backend, sem traduzir campo tecnico por conveniencia de UI.
- Representar status do backend sem criar status local paralelo.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
```

### Step 206.1.2 - Criar OnboardingMobileService

**Arquivo**: `<sep-mobile-root>/src/app/core/onboarding/onboarding-mobile.service.ts`

**Comportamento esperado**:
- Expor metodos para iniciar/obter onboarding, enviar PF/PJ, enviar documentos e consultar status.
- Usar `HttpClient`, `environment.apiBaseUrl` e interceptor de auth existente.
- Usar `FormData` para upload quando o endpoint exigir multipart.
- Nao interpretar resultado regulatorio; apenas propagar status/mensagem recebidos.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
```

### Step 206.1.3 - Testar OnboardingMobileService

**Arquivo**: `<sep-mobile-root>/src/app/core/onboarding/onboarding-mobile.service.spec.ts`

**Cenarios obrigatorios**:
- Metodo de iniciar onboarding chama o endpoint correto.
- Submit PF envia payload esperado.
- Submit PJ envia payload esperado.
- Upload usa `FormData` e preserva arquivo/tipo de documento.
- Consulta de status propaga resposta do backend.
- Erros HTTP sao propagados para tratamento na UI.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run test -- src/app/core/onboarding/onboarding-mobile.service.spec.ts
```

### Definicao de pronto da Task M-6.1
- [ ] Modelos representam contratos reais da API
- [ ] `OnboardingMobileService` centraliza chamadas
- [ ] Componentes ainda nao conhecem URLs de onboarding
- [ ] Upload esta preparado conforme contrato real
- [ ] Testes do servico passam

### Commit sugerido
```text
feat(mobile): adicionar servico de onboarding
```

---

## Task M-6.2 - Rota e entrypoint do tomador

**Objetivo**: expor a jornada de onboarding no app autenticado do tomador, com entrada clara a partir da tab/home existente.

**Pre-requisito**: Task M-6.1 concluida.

**Esforco**: 0,5 dia.

**Arquivos esperados**:
- `<sep-mobile-root>/src/app/features/authenticated/authenticated.routes.ts`
- `<sep-mobile-root>/src/app/features/tomador/home/*`
- `<sep-mobile-root>/src/app/features/tomador/onboarding/onboarding-shell.component.*`
- Testes de rota/home conforme padrao do repo.

### Step 206.2.1 - Criar rota autenticada de onboarding

**Comportamento esperado**:
- Criar rota em `/app/onboarding` ou caminho equivalente coerente com o repo.
- Proteger a rota com guards autenticados/role existentes.
- Carregar componente por lazy loading.
- Manter tabs e shell autenticado sem duplicar layout.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run build
```

### Step 206.2.2 - Adicionar entrypoint na home/tab do tomador

**Comportamento esperado**:
- Incluir tile/CTA de onboarding para tomador.
- Usar primitivos do New Design System SEP mobile, como tile/chip/card ja existentes.
- Evitar texto instrucional longo; o CTA deve ser direto.
- Nao exibir entrada de onboarding para perfis que nao sejam tomador/cliente, salvo regra ja existente.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
npm run lint:scss
```

### Step 206.2.3 - Testar navegacao para onboarding

**Cenarios obrigatorios**:
- Home do tomador exibe entrada de onboarding.
- Toque/click navega para a rota de onboarding.
- Rota exige usuario autenticado.
- Shell/tabs continuam renderizando sem regressao.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run test -- src/app/features/tomador src/app/features/authenticated
```

### Definicao de pronto da Task M-6.2
- [ ] Rota `/app/onboarding` ou equivalente existe
- [ ] Entrypoint aparece na experiencia do tomador
- [ ] Guards existentes protegem a rota
- [ ] Layout respeita o shell mobile atual
- [ ] Testes de navegacao passam

### Commit sugerido
```text
feat(mobile): abrir jornada de onboarding
```

---

## Task M-6.3 - Formularios PF/PJ mobile

**Objetivo**: implementar coleta reduzida e responsiva de dados PF/PJ, deixando validacoes de negocio complexas no backend.

**Pre-requisito**: Task M-6.2 concluida.

**Esforco**: 1-1,5 dia.

**Arquivos esperados**:
- `<sep-mobile-root>/src/app/features/tomador/onboarding/onboarding-shell.component.*`
- `<sep-mobile-root>/src/app/features/tomador/onboarding/pessoa-fisica-form.component.*`
- `<sep-mobile-root>/src/app/features/tomador/onboarding/pessoa-juridica-form.component.*`
- Specs dos componentes.

### Step 206.3.1 - Criar shell da jornada

**Comportamento esperado**:
- Carregar estado atual do onboarding ao abrir a tela.
- Exibir seletor PF/PJ somente quando o contrato permitir.
- Mostrar progresso simples por etapas: dados, documentos e status.
- Controlar loading, erro e retry sem duplicar regra do backend.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
```

### Step 206.3.2 - Implementar formulario PF

**Comportamento esperado**:
- Campos seguem contrato real do backend.
- Validacoes locais apenas para obrigatoriedade, formato basico e UX imediata.
- Submit chama `OnboardingMobileService`.
- Feedback de sucesso avanca para documentos ou status conforme resposta.

**Regras de UI**:
- Campos full-width, touch targets confortaveis e teclado mobile adequado.
- Mensagens de erro curtas.
- Textos longos devem quebrar linha em viewport de 375px.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
npm run lint:scss
```

### Step 206.3.3 - Implementar formulario PJ

**Comportamento esperado**:
- Campos seguem contrato real do backend para empresa/representante.
- Reaproveitar componentes pequenos somente se houver duplicacao real com PF.
- Submit chama `OnboardingMobileService`.
- Nao misturar regra de elegibilidade, PLD ou decisao KYB no app.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
npm run lint:scss
```

### Step 206.3.4 - Testar formularios PF/PJ

**Cenarios obrigatorios**:
- Renderiza campos obrigatorios de PF.
- Renderiza campos obrigatorios de PJ.
- Form invalido nao chama service.
- Submit PF valido chama service com payload correto.
- Submit PJ valido chama service com payload correto.
- Erro do backend aparece como feedback amigavel.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run test -- src/app/features/tomador/onboarding
```

### Definicao de pronto da Task M-6.3
- [ ] Jornada carrega estado atual do onboarding
- [ ] Formulario PF funcional e testado
- [ ] Formulario PJ funcional e testado
- [ ] UI segue New Design System SEP mobile
- [ ] Nenhuma regra KYC/KYB complexa foi replicada no app

### Commit sugerido
```text
feat(mobile): implementar formularios de onboarding
```

---

## Task M-6.4 - Upload de documentos

**Objetivo**: permitir envio de documentos pelo PWA/Ionic, com validacao leve de arquivo e tratamento claro de progresso/erro.

**Pre-requisito**: Task M-6.3 concluida.

**Esforco**: 1 dia.

**Arquivos esperados**:
- `<sep-mobile-root>/src/app/features/tomador/onboarding/document-upload.component.*`
- Ajustes no shell/jornada de onboarding.
- Specs do upload.

### Step 206.4.1 - Criar componente de upload

**Comportamento esperado**:
- Permitir selecionar arquivo por input/Ionic compatível com PWA.
- Listar tipos de documento exigidos pelo backend.
- Enviar um documento por vez ou lote, conforme contrato real.
- Bloquear submit sem tipo/arquivo quando obrigatorio.
- Exibir nome, tamanho e status basico do arquivo selecionado.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
```

### Step 206.4.2 - Integrar upload ao service

**Comportamento esperado**:
- Chamar metodo de upload do `OnboardingMobileService`.
- Usar `FormData` quando endpoint for multipart.
- Propagar mensagem/erro do backend.
- Atualizar status da jornada apos upload concluido.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run test -- src/app/core/onboarding src/app/features/tomador/onboarding
```

### Step 206.4.3 - Tratar limites de UX mobile

**Comportamento esperado**:
- Validar extensao/tamanho apenas conforme contrato/documentacao.
- Mostrar erro local para arquivo evidentemente invalido.
- Garantir layout sem overflow em viewport mobile.
- Nao implementar camera/OCR nativo.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint:scss
npm run build
```

### Definicao de pronto da Task M-6.4
- [ ] Upload de documento esta disponivel na jornada
- [ ] Tipos de documento seguem backend
- [ ] Arquivos invalidos recebem feedback claro
- [ ] Status atualiza apos envio
- [ ] Testes de upload passam

### Commit sugerido
```text
feat(mobile): adicionar upload de documentos
```

---

## Task M-6.5 - Status, pendencias e resultado

**Objetivo**: permitir que o tomador acompanhe verificacao, pendencias, aprovacao ou reprovacao do onboarding.

**Pre-requisito**: Task M-6.4 concluida.

**Esforco**: 0,5-1 dia.

**Arquivos esperados**:
- `<sep-mobile-root>/src/app/features/tomador/onboarding/onboarding-status.component.*`
- Ajustes no shell/jornada de onboarding.
- Specs do status.

### Step 206.5.1 - Criar visualizacao de status

**Comportamento esperado**:
- Exibir status recebido do backend.
- Mostrar pendencias/documentos faltantes quando existirem.
- Mostrar aprovacao/reprovacao com linguagem objetiva.
- Permitir atualizar status manualmente por acao de recarregar.

**Regras**:
- Nao prometer prazo, aprovacao ou decisao fora da resposta da API.
- Nao criar status intermediario local que conflite com backend.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run lint
npm run lint:scss
```

### Step 206.5.2 - Integrar status ao fluxo

**Comportamento esperado**:
- Apos submit de dados ou upload, refletir proxima etapa pelo estado retornado.
- Se houver pendencia, direcionar para correcao/envio necessario.
- Se onboarding estiver concluido, evitar reenvio indevido quando backend nao permitir.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run test -- src/app/features/tomador/onboarding
```

### Step 206.5.3 - Testar estados da jornada

**Cenarios obrigatorios**:
- Sem onboarding iniciado.
- Em preenchimento.
- Aguardando documentos.
- Em analise/verificacao.
- Com pendencias.
- Aprovado.
- Reprovado.
- Erro temporario de API com retry.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run test -- src/app/features/tomador/onboarding
```

### Definicao de pronto da Task M-6.5
- [ ] Status do backend aparece corretamente
- [ ] Pendencias sao visiveis e acionaveis
- [ ] Resultado aprovado/reprovado nao cria regra local
- [ ] Retry/reload existe para falhas temporarias
- [ ] Estados principais estao cobertos por testes

### Commit sugerido
```text
feat(mobile): exibir status do onboarding
```

---

## Task M-6.6 - MSW, Vitest, Playwright PWA e documentacao

**Objetivo**: cobrir a jornada com mocks e testes proporcionais, validar PWA em viewport mobile e atualizar documentacao operacional quando aplicavel.

**Pre-requisito**: Tasks M-6.1 a M-6.5 concluidas.

**Esforco**: 1 dia.

**Arquivos esperados**:
- Handlers MSW existentes ou novos para onboarding.
- Specs Vitest dos services/componentes.
- E2E Playwright PWA da jornada feliz.
- `docs-SEP/repos/sep-mobile/README.md`, se houver comportamento operacional novo relevante.

### Step 206.6.1 - Atualizar MSW para onboarding

**Comportamento esperado**:
- Criar cenarios MSW para jornada feliz.
- Criar cenarios de pendencia e erro de backend.
- Manter payloads alinhados aos modelos reais.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run test
```

### Step 206.6.2 - Completar testes Vitest

**Cenarios obrigatorios**:
- Service cobre endpoints e erros.
- Shell cobre estados principais.
- Formularios cobrem validacao e submit.
- Upload cobre arquivo valido/invalido.
- Status cobre pendencia/aprovacao/reprovacao.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run test
```

### Step 206.6.3 - Criar smoke Playwright PWA

**Cenario minimo**:
- Login como tomador.
- Abrir home autenticada.
- Entrar em onboarding.
- Preencher dados minimos conforme mock/API.
- Enviar documento de teste.
- Ver status final ou pendencia controlada.

**Verificacao**:
```bash
cd <sep-mobile-root>
npm run e2e
```

### Step 206.6.4 - Rodar suite final

**Comando**:
```bash
cd <sep-mobile-root>
npm run lint
npm run lint:scss
npm run test
npm run build
npm run e2e
```

**Verificacao**:
- Todos os comandos passam.
- Se `e2e` exigir backend real indisponivel, registrar claramente o bloqueio e evidenciar os testes MSW/Vitest executados.

### Step 206.6.5 - Atualizar docs operacionais

**Arquivo**: `<docs-SEP-root>/repos/sep-mobile/README.md`

**Atualizar somente se necessario**:
- Jornada de onboarding mobile implementada.
- Caminhos principais de tela.
- Dependencia de endpoints/backend/MSW.
- Notas de teste PWA em viewport mobile.

**Verificacao**:
```bash
cd <docs-SEP-root>
git diff -- docs-SEP/repos/sep-mobile/README.md docs-SEP/steps-fase-3/mobile/206-msprint-6-steps.md
```

### Definicao de pronto da Task M-6.6
- [ ] MSW cobre jornada feliz, pendencia e erro
- [ ] Vitest cobre service e componentes principais
- [ ] Playwright PWA cobre smoke da jornada
- [ ] Suite final foi executada ou bloqueio foi registrado
- [ ] Docs operacionais foram atualizadas quando aplicavel

### Commit sugerido
```text
test(mobile): cobrir onboarding mobile
```

---

## Checklist final da M-Sprint 6

- [ ] Tomador consegue iniciar onboarding no mobile.
- [ ] Tomador consegue enviar dados PF/PJ conforme contrato real.
- [ ] Tomador consegue enviar documentos pelo PWA/Ionic.
- [ ] Tomador consegue acompanhar status, pendencias, aprovacao e reprovacao.
- [ ] App nao replica regra KYC/KYB, PLD ou decisao regulatoria.
- [ ] UI segue New Design System SEP mobile.
- [ ] Nenhum framework CSS ou biblioteca de icones nova foi adicionada sem aprovacao.
- [ ] MSW atualizado para onboarding.
- [ ] Vitest passa.
- [ ] Playwright PWA validado em viewport mobile.
- [ ] `npm run lint`, `npm run lint:scss`, `npm run test`, `npm run build` e `npm run e2e` executados ou bloqueios registrados.
- [ ] Docs operacionais atualizadas quando comportamento/documentacao publica mudar.
- [ ] Checkpoint final preparado antes de staging/commit.

## Fechamento

Antes de qualquer staging/commit, parar em checkpoint com:

```bash
cd <sep-mobile-root>
git status --short --branch
git diff --stat
```

Registrar no checkpoint:
- Arquivos criados/modificados/removidos.
- Testes/build/lint executados e resultado.
- Riscos ou pendencias.
- Se houve divergencia entre contratos backend e documentacao.
- Sugestao de mensagem de commit ou lista de commits por task.

