# Steps - Sprint 27 - Step-up estrito server-side no aceite de contrato

**Spec de origem**: [`027-sprint-27-step-up-server-side-aceite.md`](../../specs/fase-4/027-sprint-27-step-up-server-side-aceite.md)

**Status**: planejada (primeira sprint da Fase 4; fecha o bloqueio de go-live de step-up estrito).

**Objetivo geral**: remover o bypass server-side de step-up nas operacoes legais/financeiras que hoje
usam `@RequireStepUp` (com bypass pre-MFA), aplicando a annotation estrita ja existente
`@RequireStepUpEstrito` (sem bypass) ao aceite de contrato e as operacoes sensiveis equivalentes.
Nao reescreve o mecanismo de step-up: **aplica** o que a Sprint 20 ja criou.

**Esforco total estimado**: 1-1,5 dia de Dev Senior Backend.

**Repos de destino**:
- `sep-api`: annotations nos controllers, ajuste de Javadoc, testes.
- `docs-SEP`: spec/steps, `SEGURANCA.md`, `CONTRATOS.md`, `COBRANCA.md`, PRD/CONTEXT/roadmap; Git
  manual.

**Branch sugerida**:
- `feature/sprint-27-step-up-server-side-aceite`

**Pre-requisitos**:
- Fase 3 integrada em `origin/develop`; `origin/main` sem conteudo de produto ausente de `develop`.
- `@RequireStepUpEstrito` (Sprint 20) e `StepUpEnforcementAspect.aplicarEstrito()` vigentes — ja
  exigem MFA ativo + token valido, sem bypass.
- MFA/step-up da Sprint 5 vigente (`X-Step-Up-Token`, `StepUpTokenService`).
- Precedente de uso estrito: `PixDesembolsoController` (`POST /api/v1/pix/desembolsos`).

## Achado que dimensiona a sprint

O mecanismo estrito **ja existe** e ja e usado no desembolso Pix. O `ContratoController` documenta no
proprio Javadoc (Sprint 10) que "ganhara a annotation forte quando ela existir". Ela existe. Logo esta
sprint e majoritariamente **aplicacao de annotation + testes + docs**, sem novo aspecto, migration,
DTO ou regra de negocio.

Operacoes hoje com `@RequireStepUp` (com bypass) que sao atos legais/financeiros:

| Operacao | Controller | Role | Acao |
|----------|-----------|------|------|
| `PATCH /contratos/{id}/aceite` | `ContratoController.registrarAceite` | CLIENTE | **-> estrito** (bloqueio de go-live nomeado) |
| `POST /contratos/{id}/cancelar` | `ContratoController.cancelar` | FIN/ADMIN | **-> estrito** (Javadoc ja cita aceite+cancelamento) |
| `POST /contratos/{id}/assinar` | `ContratoController.enviarParaAssinatura` | FIN/ADMIN | **-> estrito** (consistencia com desembolso Pix) |
| `POST /cobranca/parcelas/{id}/renegociacao` | `CobrancaController.proporRenegociacao` | FIN/ADMIN | **-> estrito** (muta acordo financeiro) |
| `PATCH /cobranca/renegociacoes/{id}/aceite` | `CobrancaController.aceitarRenegociacao` | CLIENTE | **-> estrito** (equivalente ao aceite de contrato) |

Mantem `@RequireStepUp` (bypass de migracao) o que **nao** e ato legal/financeiro e ainda pode ter
usuario pre-MFA em migracao (fora de escopo desta sprint; confirmar na auditoria): ex. alterar role
(`usuarios`), registrar parecer (`credito`), reprocesso (`backoffice`). `recusarRenegociacao` nao tem
step-up hoje e permanece sem (recusa nao e ato de comprometimento).

## Decisoes tecnicas

- Reusar `@RequireStepUpEstrito`; **nao** criar annotation nem alterar `StepUpEnforcementAspect`.
- Escopo estrito = atos legais/financeiros da tabela acima; demais `@RequireStepUp` ficam intactos.
- `AccessDeniedException` continua mapeada para `403` pelo `ApiExceptionHandler`; distinguir do `409`
  de estado (ja lancado pelos use cases). Nao vazar UUID/estado sensivel no corpo.
- Sem migration, sem mudanca de contrato de negocio, sem novo endpoint.
- Atualizar o Javadoc do `ContratoController` removendo a "limitacao conhecida do step-up".

## Protocolo obrigatorio por Task

1. Executar somente a Task liberada pelo usuario.
2. Confirmar codigo e testes atuais antes de editar.
3. Implementar a menor mudanca aderente ao estilo do modulo.
4. Rodar verificacoes proporcionais ao risco.
5. Parar em checkpoint pre-commit com status, diff, testes, riscos e mensagem sugerida.
6. Aguardar aprovacao antes de `git add` e `git commit`.
7. Usar paths especificos no staging; nunca `git add -A`.

**Skills obrigatorias**:
- `coding-guidelines`: simplicidade, mudancas cirurgicas e verificacao orientada a meta.
- `clean-code`: nomes intencionais, funcoes pequenas e testes F.I.R.S.T.
- `design-patterns-java`: recusar pattern-itis; reutilizar a annotation existente, sem novo padrao; enforcement na borda (aspecto/controller), dominio e use case intactos.

## Ordem de execucao

```text
27.0 prechecks
  -> 27.1 auditoria e classificacao do gate
  -> 27.2 estrito no ContratoController (aceite + cancelar + assinar)
  -> 27.3 estrito na renegociacao (propor + aceitar)
  -> 27.4 padronizacao de respostas 403 vs 409
  -> 27.5 testes (4 cenarios + ownership) unit/integracao
  -> 27.6 OpenAPI, docs e fechamento
```

---

## Gate 27.0 - Prechecks

**Objetivo**: confirmar cadeia Git, o estado real do step-up e a baseline antes de aplicar.

### Step 027.0.1 - Confirmar cadeia de integracao

```bash
cd <sep-api-root>
git fetch --all --prune
git status --short --branch
git log --oneline --decorate -15 origin/develop
git diff --stat origin/main..origin/develop
git diff --stat origin/develop..origin/main
```

**Verificacao**:
- Fase 3 presente em `develop`; `main` sem conteudo de produto ausente de `develop`.
- Working tree limpo ou alteracoes do usuario identificadas.

### Step 027.0.2 - Criar branch

```bash
cd <sep-api-root>
git switch develop
git pull --ff-only
git switch -c feature/sprint-27-step-up-server-side-aceite
```

### Step 027.0.3 - Reconfirmar o mecanismo e os pontos de aplicacao

```bash
cd <sep-api-root>
sed -n '1,110p' src/main/java/com/dynamis/sep_api/identity/infrastructure/security/StepUpEnforcementAspect.java
cat src/main/java/com/dynamis/sep_api/identity/infrastructure/security/RequireStepUpEstrito.java
sed -n '190,335p' src/main/java/com/dynamis/sep_api/contratos/web/controller/ContratoController.java
sed -n '355,435p' src/main/java/com/dynamis/sep_api/cobranca/web/controller/CobrancaController.java
grep -rn "@RequireStepUp\b" src/main/java
```

**Verificacao**:
- `aplicarEstrito()` exige MFA ativo + token valido, sem bypass (confirmado).
- `registrarAceite`, `cancelar`, `enviarParaAssinatura` usam `@RequireStepUp` hoje.
- `proporRenegociacao` e `aceitarRenegociacao` usam `@RequireStepUp` no metodo do controller;
  `recusarRenegociacao` nao usa step-up.
- Nenhum outro ato legal/financeiro fora da tabela ficou de fora.

### Step 027.0.4 - Rodar baseline

```bash
cd <sep-api-root>
./gradlew check
```

Registrar resultado e contagem de testes antes da alteracao.

### Definicao de pronto do Gate 27.0

- [ ] Cadeia Git validada.
- [ ] Branch criada da base correta.
- [ ] Mecanismo estrito e pontos de aplicacao reconfirmados no codigo atual.
- [ ] Baseline verde ou falha preexistente documentada.

---

## Task 27.1 - Auditoria e classificacao do gate

**Objetivo**: fixar, contra o codigo atual, quais `@RequireStepUp` viram `@RequireStepUpEstrito` e
quais mantem o bypass, com justificativa.

**Esforco**: 0,25 dia.

### Step 027.1.1 - Levantar e classificar as ocorrencias

- Listar todas as ocorrencias de `@RequireStepUp` (`grep -rn "@RequireStepUp\b" src/main/java`).
- Classificar cada uma como **ato legal/financeiro** (vira estrito) ou **migracao pre-MFA nao-legal**
  (mantem bypass), registrando o motivo.
- Confirmar o conjunto estrito desta sprint = 5 endpoints da tabela do cabecalho.

### Step 027.1.2 - Registrar a decisao

Anexar a classificacao ao `SPRINT-27-PR.md` (criado na Task 27.6) e alinhar com a spec 027. Se a
auditoria divergir da tabela (ex.: nova operacao sensivel), pausar e confirmar com o usuario antes de
implementar.

### Definicao de pronto da Task 27.1

- [ ] Todas as ocorrencias de `@RequireStepUp` classificadas.
- [ ] Conjunto estrito confirmado (ou divergencia levada ao usuario).
- [ ] Operacoes que mantem bypass documentadas com justificativa.

---

## Task 27.2 - Estrito no ContratoController

**Objetivo**: aplicar `@RequireStepUpEstrito` no aceite, cancelamento e envio para assinatura, e
remover a "limitacao conhecida" do Javadoc.

**Esforco**: 0,25 dia.

**Arquivos esperados**:
- `contratos/web/controller/ContratoController.java`.

### Step 027.2.1 - Trocar as annotations

- Substituir `@RequireStepUp` por `@RequireStepUpEstrito` em `registrarAceite`, `cancelar` e
  `enviarParaAssinatura`.
- Ajustar o import de `RequireStepUp` -> `RequireStepUpEstrito` (remover o import orfao).

### Step 027.2.2 - Atualizar Javadoc e OpenAPI local

- Remover o paragrafo "Limitacao conhecida do step-up" (o bypass deixou de existir para estas
  operacoes).
- Ajustar as descricoes `@Operation`/`@ApiResponse` de `403` para refletir "sem step-up **ou sem MFA
  ativo**".

### Verificacao

```bash
./gradlew spotlessCheck
./gradlew test --tests "*ContratoControllerTest" --tests "*ContratoAssinaturaControllerTest"
```

### Definicao de pronto da Task 27.2

- [ ] As tres operacoes de contrato usam `@RequireStepUpEstrito`.
- [ ] Import orfao removido; Spotless verde.
- [ ] Javadoc sem a limitacao; `403` documenta a exigencia de MFA ativo.

### Commit sugerido

```text
feat(contratos): exigir step-up estrito no aceite, cancelamento e assinatura
```

---

## Task 27.3 - Estrito na renegociacao (cobranca)

**Objetivo**: aplicar `@RequireStepUpEstrito` a proposta e ao aceite de renegociacao, mantendo a
recusa sem step-up.

**Esforco**: 0,25 dia.

**Arquivos esperados**:
- `cobranca/web/controller/CobrancaController.java`.

### Step 027.3.1 - Trocar as annotations

- Substituir `@RequireStepUp` por `@RequireStepUpEstrito` em `proporRenegociacao` e
  `aceitarRenegociacao`.
- Nao tocar `recusarRenegociacao` (permanece sem step-up).
- Ajustar imports.

### Step 027.3.2 - Atualizar descricoes

- Ajustar `@Operation`/`@ApiResponse` de `403` das duas operacoes para "sem step-up ou sem MFA ativo".

### Verificacao

```bash
./gradlew spotlessCheck
./gradlew test --tests "*CobrancaControllerTest" --tests "*RenegociacaoIT"
```

### Definicao de pronto da Task 27.3

- [ ] Propor e aceitar renegociacao usam `@RequireStepUpEstrito`.
- [ ] Recusar permanece sem step-up.
- [ ] Spotless e testes focados verdes.

### Commit sugerido

```text
feat(cobranca): exigir step-up estrito na proposta e aceite de renegociacao
```

---

## Task 27.4 - Padronizacao de respostas 403 vs 409

**Objetivo**: garantir que step-up ausente/sem-MFA retorne `403` determinado e distinto do `409` de
estado, sem vazar UUID ou estado sensivel.

**Esforco**: 0,25 dia.

### Step 027.4.1 - Confirmar o mapeamento de erro

```bash
cd <sep-api-root>
grep -rn "AccessDeniedException" src/main/java/com/dynamis/sep_api/shared/exception
sed -n '1,240p' src/main/java/com/dynamis/sep_api/shared/exception/ApiExceptionHandler.java
```

**Verificacao**:
- `AccessDeniedException` (do aspecto estrito) mapeia para `403`.
- O corpo `ErrorResponseDto` do `403` de step-up nao inclui UUID de contrato/parcela/usuario nem
  mensagem interna do provider.
- `409` continua vindo dos use cases (estado de contrato/renegociacao), sem colisao com o `403`.

### Step 027.4.2 - Ajustar somente se houver vazamento

- Se o handler expuser detalhe sensivel no `403`, padronizar a mensagem (generica) sem alterar o
  contrato dos outros erros. Caso ja esteja correto, registrar "sem mudanca" e seguir.

### Definicao de pronto da Task 27.4

- [ ] `403` step-up/MFA e `409` estado sao distinguiveis.
- [ ] Corpo do `403` nao vaza UUID nem detalhe interno.
- [ ] Nenhuma regressao nos demais mapeamentos de erro.

---

## Task 27.5 - Testes (quatro cenarios + ownership)

**Objetivo**: provar o enforcement estrito por unit (aspecto) e integracao (contrato + renegociacao).

**Esforco**: 0,5 dia.

**Arquivos esperados**:
- teste do `StepUpEnforcementAspect` (cenario estrito), se ainda nao cobrir a variante;
- `ContratoControllerTest`/IT e `CobrancaControllerTest`/`RenegociacaoIT` estendidos.

### Step 027.5.1 - Cobrir os quatro cenarios por operacao critica

Para o aceite de contrato e para o aceite de renegociacao:
- com MFA ativo + step-up token valido -> `200`.
- sem MFA (mfaHabilitado=false) -> `403` (bloqueado, **sem bypass**).
- com MFA, sem `X-Step-Up-Token` -> `403`.
- com MFA, token invalido/expirado/de outro usuario -> `403`.

### Step 027.5.2 - Regressao de ownership e estado

- Ownership preservada: contrato/parcela de outro tomador -> `403` (nao vira `200` por causa do
  step-up).
- Estado invalido (contrato fora de `AGUARDANDO_ACEITE`, renegociacao ja decidida/expirada) -> `409`,
  distinto do `403` de step-up.
- Confirmar que o teste antigo que assumia bypass pre-MFA no aceite foi atualizado (nao deve mais
  passar sem MFA).

### Step 027.5.3 - Rodar a suite focada

```bash
./gradlew test --tests "*StepUpEnforcementAspect*" \
  --tests "*ContratoController*" --tests "*Contrato*IT" \
  --tests "*CobrancaControllerTest" --tests "*RenegociacaoIT"
```

### Definicao de pronto da Task 27.5

- [ ] Quatro cenarios cobertos para aceite de contrato e de renegociacao.
- [ ] Ownership e estado nao sao mascarados pelo step-up.
- [ ] Testes que dependiam do bypass foram atualizados.
- [ ] Suite focada verde.

### Commit sugerido

```text
test(identity): cobrir step-up estrito no aceite de contrato e renegociacao
```

---

## Task 27.6 - OpenAPI, docs e fechamento

**Objetivo**: refletir o enforcement estrito na documentacao e remover a divida de go-live.

**Esforco**: 0,25 dia.

### Step 027.6.1 - Atualizar documentacao

Atualizar:
- `docs-sep/SEGURANCA.md` (§step-up): registrar que aceite de contrato, cancelamento, assinatura e
  renegociacao (propor/aceitar) usam step-up estrito, sem bypass.
- `repos/sep-api/CONTRATOS.md` e `repos/sep-api/COBRANCA.md`: remover a limitacao de bypass e
  registrar a exigencia de MFA ativo.
- `docs-sep/PRD-FASE-4.md` (follow-up 1 e §37 marco): marcar o bloqueio de go-live de step-up como
  fechado apos merge.
- `docs-sep/PRD-FASE-5.md` (Frente D): remover step-up estrito da lista de gates pendentes de
  go-live.
- `docs-sep/CONTEXT-ESTADO-ATUAL.md`: sobrescrever estado + proximo passo (Sprint 27 fechada ->
  proxima sprint da Fase 4); apendar entrada curta ao historico em `docs-sep/CONTEXT-PARTE-2.md`.
- `AI-ROADMAP.md`.

### Step 027.6.2 - Rodar gate final

```bash
cd <sep-api-root>
./gradlew check
./gradlew bootJar
```

### Step 027.6.3 - Criar PR description e checkpoint

Criar `repos/sep-api/SPRINT-27-PR.md` com summary, classificacao do gate (Task 27.1), endpoints
alterados, seguranca, decisoes, follow-ups e commits.

Apresentar status, diff, testes, riscos e mensagem sugerida. Aguardar aprovacao antes de
stage/commit. Push e PR permanecem manuais.

### Definicao de pronto da Task 27.6

- [ ] OpenAPI reflete `403` por step-up/MFA nas operacoes alteradas.
- [ ] `SEGURANCA.md`, `CONTRATOS.md`, `COBRANCA.md`, PRD-FASE-4/5, CONTEXT e roadmap atualizados.
- [ ] `check` e `bootJar` verdes.
- [ ] PR description e checkpoint apresentados.

### Commit sugerido

```text
docs(identity): documentar step-up estrito e fechar divida de go-live
```

## Definition of Done da Sprint 27

- [ ] Aceite de contrato e demais atos legais/financeiros da tabela usam `@RequireStepUpEstrito`.
- [ ] Nao existe mais bypass server-side para usuario sem MFA nessas operacoes.
- [ ] `403` step-up/MFA e distinto do `409` de estado e nao vaza dados sensiveis.
- [ ] Operacoes fora de escopo (nao-legais) mantem `@RequireStepUp` documentado.
- [ ] Quatro cenarios + ownership + estado cobertos; `check` e `bootJar` verdes.
- [ ] Divida de go-live de step-up estrito removida do backlog da Fase 3.
- [ ] Merge em `develop` registrado antes de iniciar a proxima sprint.
```
