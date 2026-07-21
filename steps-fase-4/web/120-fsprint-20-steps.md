# Steps - F-Sprint 20 - Gestao de chaves Pix no web

**Spec de origem**: [`120-fsprint-20-chaves-pix-web.md`](../../specs/fase-4/120-fsprint-20-chaves-pix-web.md)

**Status**: planejada. Steps just-in-time criados para execucao; nenhuma Task iniciada. Consome o
contrato da Sprint backend 31 ([`031`](../../specs/fase-4/031-sprint-31-pix-gestao-chaves.md)), ja
integrado em `develop`.

**Objetivo geral**: permitir que `FINANCEIRO`/`ADMIN` liste (mascarado), cadastre e remova chaves Pix
da conta operacional/escrow no web, de forma assistida, com confirmacao e **step-up estrito** nas
mutacoes. Tipo, valor mascarado, estado (`ATIVA`/`INATIVA`), digito verificador, idempotencia,
advisory lock e auditoria permanecem autoritativos no backend. Fecha a pendencia de visibilidade web
de chaves Pix do marco `v1.0-local` (PRD-FASE-4 §37 / Gate F-18.0).

**Esforco total estimado**: 3-5 dias de Dev Pleno Frontend.

**Repos de destino**:

- `sep-app`: DTOs de borda, service, contrato consumido, rota/tela, interceptor de step-up,
  navegacao, MSW, Vitest e Playwright.
- `docs-SEP`: docs operacionais, indices e collections; toda operacao Git permanece manual.

**Branch sugerida**: `feature/fsprint-20-chaves-pix-web`.

## Contratos backend consumidos

### Chaves Pix da conta operacional/escrow

```http
GET    /api/v1/pix/chaves
POST   /api/v1/pix/chaves
DELETE /api/v1/pix/chaves/{chaveId}
```

- Todos exigem `FINANCEIRO` ou `ADMIN`. Somente `POST` e `DELETE` exigem **step-up estrito**
  (header `X-Step-Up-Token`, uso unico; validate-and-consume). O `GET` nao consome step-up.
- `GET` retorna `200` com array (pode ser vazio), incluindo historico `INATIVA`, mais recentes
  primeiro. Nunca falha por ausencia de conta operacional (retorna `[]`).
- `POST`: header `Idempotency-Key` (nao vazia, max 100 caracteres; sem restricao de charset no
  backend) e body `CadastrarChavePixRequest { tipo, valor }`; retorna `201` no registro novo ou
  `200` no replay idempotente (mesma key + mesmo `tipo`/`valor`).
- `DELETE /{chaveId}` (UUID): inativacao logica `ATIVA -> INATIVA`, **idempotente**; retorna `204`.
- DTO publico `ChavePixResponse`: `id` (UUID), `tipo`, `valorMascarado`, `status`, `criadaEm`,
  `removidaEm` (nulo enquanto `ATIVA`). **O valor bruto da chave nunca e retornado.**
- Enums (inline no OpenAPI): `TipoChavePix = CPF | CNPJ | EMAIL | TELEFONE | EVP`;
  `StatusChavePix = ATIVA | INATIVA`.
- Erros (mensagens neutras, sem ecoar valor/UUID/provider):
  - `POST` `400` — `Idempotency-Key` ausente/invalida, `tipo` nulo, ou valor invalido (DV de
    CPF/CNPJ, sequencia repetida, telefone/email/EVP invalido).
  - `POST` `409` — `Idempotency-Key` reusada com `tipo`/`valor` diferente, ou chave equivalente ja
    ativa.
  - `POST` `422` — conta operacional/escrow indisponivel.
  - `POST`/`DELETE` `403` — sem role autorizada ou sem step-up valido.
  - `DELETE` `404` — chave inexistente, fora do escopo da conta operacional ou conta ausente
    (`404` neutro, nao distingue os casos).

> **Nota de contrato (knownGaps[0])**: o header `X-Step-Up-Token` **nao** e documentado no OpenAPI
> em nenhuma operacao sensivel. O `contract:check` nao o valida; o frontend o adiciona manualmente no
> `consumed-contracts.json` para `POST` e `DELETE /pix/chaves`, como ja feito nas mutacoes das
> F-16/17/18. Da mesma forma, `required`/`nullable` de respostas nao sao confiaveis no snapshot
> (springdoc emite `required: []`): a obrigatoriedade de `valorMascarado`/`status` e a nulidade de
> `removidaEm` vem do contrato Java, nao do snapshot.

## Decisoes da sprint

- Co-localizar a feature no modulo Pix existente: estender `core/pix/pix.service.ts` (nao criar
  service paralelo) e adicionar a sub-rota `chaves` em `PIX_ROUTES`
  (`features/authenticated/pix/`). Reusar `features/authenticated/pix/shared/pix-format.ts` e o
  padrao `*-status.component`.
- A sub-rota `/app/pix/chaves` recebe `roleGuard` proprio com `data.roles = ['FINANCEIRO','ADMIN']`
  — mais restrito que o pai `/app/pix`, que hoje inclui `BACKOFFICE`. `BACKOFFICE` nao ve o item nem
  acessa a rota (backend restringe a `FINANCEIRO`/`ADMIN`).
- Cada cadastro e cada remocao exige gesto explicito proprio. Retornar do step-up **nunca** cadastra
  nem remove automaticamente: a tela exige novo clique.
- Idempotencia do cadastro por **intencao**, em memoria, atraves da navegacao ao step-up: introduzir
  `ChavePixIntencaoStore` (root, memory-only), espelhando
  `core/credora/aporte-intencao.store.ts` (`sep-app`), preservando
  `{ tipo, valor, Idempotency-Key }`. Retry ambiguo (rede/`5xx`) reusa a **mesma** key; alterar
  `tipo`/`valor` invalida a intencao e gera key nova na proxima confirmacao. Reload perde o rascunho;
  nunca persistir em `localStorage`/`sessionStorage`. A key e o valor bruto nunca sao exibidos.
- `DELETE` e idempotente (`204` mesmo se ja `INATIVA`); a UI trata `404` como indisponivel neutro,
  sem enumerar o motivo.
- Tratar `201` e `200` como sucesso real, distinguindo registro novo de replay apenas quando a
  resposta HTTP estiver disponivel. Nunca presumir sucesso em erro de rede ou `5xx`.
- Aplicar o New Design System SEP em Angular/SCSS: tabela responsiva, badges de status com texto,
  dialogs acessiveis, foco visivel, light/dark e estados de loading/erro/vazio.

## Fora de escopo

- Alterar endpoint, DTO, migration ou regra no `sep-api`.
- Validar tipo, digito verificador ou valor no browser alem de formato minimo; a regra e do backend.
- Expor o valor bruto da chave, `valorHash`, `providerKeyId`, `Idempotency-Key` ou dados de provider.
- Split Pix, Pix automatico, agendamento ou recorrencia.
- Movimentar dinheiro real ou ativar Celcoin/BaaS; providers seguem Fake/WireMock.
- Persona `BACKOFFICE` em chaves Pix e qualquer alteracao do fluxo TOTP/step-up.
- Refactor amplo do modulo Pix, do shell, dos interceptors ou do design system.

## Protocolo obrigatorio por Task

1. Executar somente a Task liberada pelo usuario.
2. Confirmar codigo e contrato atuais antes de editar.
3. Implementar a menor mudanca coerente com a spec e este step.
4. Escrever/ajustar teste observavel para o comportamento alterado.
5. Rodar verificacoes proporcionais ao risco.
6. Parar em checkpoint pre-commit com arquivos, testes, riscos e mensagem sugerida.
7. Aguardar aprovacao antes de `git add`/`git commit`; usar somente paths especificos.
8. Nao iniciar a Task seguinte sem ordem explicita.

**Skills obrigatorias durante a implementacao**:

- `coding-guidelines`: suposicoes explicitas, simplicidade, mudancas cirurgicas e verificacao.
- `clean-code`: nomes intencionais, componentes focados, dialogs acessiveis e testes legiveis.
- `clean-architecture`: componentes orquestram UI via service; regra e seguranca ficam no backend;
  DTOs TypeScript permanecem modelos de borda.

## Rastreabilidade spec 120 -> steps

| Task da spec 120 | Steps |
|------------------|-------|
| 1. DTOs + `PixService` + contrato consumido | F-20.1 |
| 2. Rota/guard/menu + listagem (tres superficies) | F-20.2 |
| 3. Cadastro assistido com step-up + idempotencia | F-20.3 |
| 4. Remocao assistida com step-up | F-20.4 |
| 5. Matriz de erros, concorrencia e acessibilidade | F-20.5 |
| 6. MSW e Vitest | F-20.1-F-20.6 |
| 7. Playwright + collections + docs + fechamento | F-20.7 |
| Gates de cadeia, contrato e baseline | F-20.0 |

## Ordem de execucao

```text
F-20.0 prechecks + contrato Sprint 31 confirmado + baseline
  -> F-20.1 DTOs + PixService + contrato consumido + step-up routing
  -> F-20.2 rota, guard, menu e listagem com tres superficies
  -> F-20.3 cadastro assistido com step-up estrito + idempotencia
  -> F-20.4 remocao assistida com step-up estrito
  -> F-20.5 matriz de erros, concorrencia e acessibilidade
  -> F-20.6 MSW, Vitest e cobertura focada
  -> F-20.7 Playwright, collections, docs e fechamento
```

---

## Gate F-20.0 - Prechecks, contrato e recorte final

**Objetivo**: confirmar cadeia Git, contrato da Sprint 31 integrado, baseline e a fronteira de
seguranca antes de editar o `sep-app`.

### Step 120.0.1 - Confirmar cadeia Git do `sep-app`

```bash
cd <sep-app-root>
git fetch --all --prune
git status --short --branch
git log --oneline --decorate -15 origin/develop
git log --oneline --decorate -10 origin/main
git rev-list --left-right --count origin/main...origin/develop
```

**Verificacao**:

- F-Sprint 19 presente em `origin/develop`.
- `main` integrada em `develop`, ou pendencia registrada antes de criar branch.
- Working tree limpa ou mudancas do usuario identificadas e preservadas.

### Step 120.0.2 - Criar branch

```bash
cd <sep-app-root>
git switch develop
git pull --ff-only
git switch -c feature/fsprint-20-chaves-pix-web
```

Git de `docs-SEP` continua manual.

### Step 120.0.3 - Reconfirmar backend Sprint 31 integrado e OpenAPI

```bash
cd <sep-api-root>
git log --oneline --decorate -25 origin/develop
sed -n '1,200p' src/main/java/com/dynamis/sep_api/pix/web/controller/PixChaveController.java
find src/main/java/com/dynamis/sep_api/pix/web/dto -type f | sort
sed -n '1,80p' src/main/java/com/dynamis/sep_api/pix/domain/vo/TipoChavePix.java
sed -n '1,80p' src/main/java/com/dynamis/sep_api/pix/domain/vo/StatusChavePix.java
rg -n "RequireStepUpEstrito|Idempotency-Key|X-Step-Up-Token|PreAuthorize" \
  src/main/java/com/dynamis/sep_api/pix/web
```

Registrar metodo, path, roles, step-up, headers, status HTTP, campos e nullability. Confirmar que a
leitura retorna apenas `valorMascarado` (nunca o valor bruto). Divergencia contra os contratos deste
step bloqueia a implementacao ate alinhamento documental.

### Step 120.0.4 - Mapear base web e seguranca atuais

```bash
cd <sep-app-root>
rg -n "pix|chave" src/app/core/api/api.models.ts
sed -n '1,200p' src/app/core/pix/pix.service.ts
sed -n '1,120p' src/app/features/authenticated/pix/pix.routes.ts
sed -n '1,240p' src/app/core/interceptors/step-up.interceptor.ts
sed -n '1,180p' src/app/core/interceptors/error.interceptor.ts
sed -n '1,200p' src/app/layout/sidenav/sidenav.component.ts
sed -n '1,120p' src/app/core/credora/aporte-intencao.store.ts
rg -n "chave|pix/chaves" src/app src/mocks e2e
```

Confirmar:

- `PixService` e os DTOs atuais **nao** cobrem chaves Pix (so desembolsos/recebimentos).
- rota pai `/app/pix` guarda `roles: ['FINANCEIRO','ADMIN','BACKOFFICE']`; a sub-rota `chaves`
  precisa de guard proprio mais restrito (`FINANCEIRO`/`ADMIN`).
- `stepUpInterceptor` ainda nao reconhece `POST`/`DELETE /pix/chaves`.
- `TRATA_403_LOCALMENTE` pode ser aplicado somente nas mutacoes cujo `403` de step-up sera tratado
  na propria tela; `GET` sem role continua no fluxo global de acesso negado.
- `AporteIntencaoStore` e o modelo de idempotencia por intencao a espelhar.

### Step 120.0.5 - Rodar baseline

```bash
cd <sep-app-root>
npm run lint
npm run lint:scss
npm run test
npm run build
npm run e2e
npm run contract:check
```

### Definicao de pronto do Gate F-20.0

- [ ] Cadeia Git web confirmada.
- [ ] Contrato da Sprint 31 confirmado em runtime (endpoints, roles, step-up, DTOs, enums,
      mascaramento).
- [ ] Fronteira de guard (`FINANCEIRO`/`ADMIN`, sem `BACKOFFICE`) registrada.
- [ ] Baseline verde com contagens, ou falha preexistente registrada (`golden-path-mobile` nao se
      aplica ao web; `smoke`/`pix` devem estar verdes).

---

## Task F-20.1 - DTOs, PixService, contrato consumido e step-up routing

**Objetivo**: criar a borda tipada e segura antes da tela.

**Pre-requisito**: Gate F-20.0 concluido.

**Esforco**: 0,5-1 dia.

**Arquivos esperados**:

- `src/app/core/api/api.models.ts`.
- `src/app/core/pix/pix.service.ts` e `pix.service.spec.ts`.
- `src/app/core/interceptors/step-up.interceptor.ts` e spec.
- `contracts/consumed-contracts.json`.

### Step 120.1.1 - Adicionar modelos de borda

Adicionar tipos exatos, espelhando o backend:

```text
TipoChavePix = CPF | CNPJ | EMAIL | TELEFONE | EVP
StatusChavePix = ATIVA | INATIVA
ChavePixResponse   { id, tipo, valorMascarado, status, criadaEm, removidaEm | null }
CadastrarChavePixRequest { tipo, valor }
```

Datas permanecem `string` ISO. `valor` (bruto) so existe na request de cadastro; nunca em resposta,
modelo de leitura ou log. Nao adicionar helpers que validem DV/tipo nem derivem estado no frontend.

### Step 120.1.2 - Estender `PixService`

Metodos esperados (nomes equivalentes aceitos se revelarem melhor a intencao):

```text
listarChavesPix()
cadastrarChavePix(request, idempotencyKey)
removerChavePix(chaveId)
```

- O service transporta DTOs e headers; nao gera key, nao decide retry e nao interpreta estado.
- `cadastrarChavePix` envia header `Idempotency-Key` e `context` com `TRATA_403_LOCALMENTE`;
  `removerChavePix` envia `context` com `TRATA_403_LOCALMENTE`. `listarChavesPix` nao usa nenhum dos
  dois.
- Distinguir `201` x `200` no cadastro somente se a UI usar essa distincao; nao ampliar
  `observe: 'response'` sem necessidade.

### Step 120.1.3 - Incluir as mutacoes no `stepUpInterceptor`

Anexar e consumir token somente em:

```text
POST   /pix/chaves
DELETE /pix/chaves/{id}
```

`GET /pix/chaves` nunca consome token. Cobrir match positivo, metodo errado e paths parecidos
(ex.: `/pix/chaves` x `/pix/desembolsos`) para impedir consumo acidental.

### Step 120.1.4 - Atualizar o contrato consumido

Registrar as tres operacoes e os DTOs em `consumed-contracts.json`; adicionar o header
`X-Step-Up-Token` manual para `POST`/`DELETE` (knownGaps[0]). Rodar `npm run contract:check` e
confirmar zero divergencia real (lacunas conhecidas ficam em `knownGaps`).

### Step 120.1.5 - Testar contrato HTTP

Cobrir URLs/metodos/body, `Idempotency-Key`, DTOs, ausencia de step-up no `GET` e token somente nas
duas mutacoes.

```bash
npm run test -- --run src/app/core/pix/pix.service.spec.ts
npm run test -- --run src/app/core/interceptors/step-up.interceptor.spec.ts
npm run contract:check
npm run lint
```

### Definicao de pronto da Task F-20.1

- [ ] DTOs publicos fieis e minimos; valor bruto so na request de cadastro.
- [ ] Tres operacoes HTTP centralizadas no `PixService`.
- [ ] Step-up anexado somente a `POST`/`DELETE /pix/chaves`.
- [ ] `consumed-contracts.json` atualizado e `contract:check` verde.

### Commit sugerido

```text
feat(web): adicionar contrato de chaves Pix ao PixService
```

---

## Task F-20.2 - Rota, guard, menu e listagem

**Objetivo**: oferecer a `FINANCEIRO`/`ADMIN` a lista de chaves Pix (mascarada, com historico), com
as tres superficies e refresh por gesto, sem polling.

**Pre-requisito**: Task F-20.1 concluida.

**Esforco**: 0,5-1 dia.

**Arquivos esperados**:

- `src/app/features/authenticated/pix/pix.routes.ts`.
- `src/app/features/authenticated/pix/pages/chaves-pix-page.component.*` e spec.
- `src/app/features/authenticated/pix/shared/chave-pix-status.component.*` e spec.
- `src/app/layout/sidenav/sidenav.component.ts` e spec.

### Step 120.2.1 - Criar sub-rota protegida

Adicionar `chaves` em `PIX_ROUTES` com `roleGuard` e `data: { roles: ['FINANCEIRO','ADMIN'],
breadcrumb: 'Chaves Pix' }`. A rota pai `/app/pix` mantem o guard atual; a sub-rota restringe mais.

Adicionar item de navegacao `Chaves Pix` no grupo "Operacao" do sidenav somente para
`FINANCEIRO`/`ADMIN`; `CLIENTE` e `BACKOFFICE` nao veem o item.

### Step 120.2.2 - Criar pagina de listagem

Na entrada, executar uma unica chamada a `listarChavesPix()`. Exibir tabela responsiva com:

- `tipo`;
- `valorMascarado` (nunca o valor bruto);
- badge de `status` (`chave-pix-status.component`, switch exaustivo `ATIVA`/`INATIVA`, com texto);
- `criadaEm` e, quando `INATIVA`, `removidaEm`.

Ordem recebida do backend (mais recentes primeiro); nao reordenar nem fabricar dados. Nao exibir
UUID integral como titulo.

### Step 120.2.3 - Controlar as tres superficies e refresh por gesto

- **lista**: itens renderizados;
- **vazia**: `200 []` e estado valido, mensagem neutra, sem fabricar fixtures;
- **erro tecnico**: falha de rede/`5xx`, com botao `Tentar novamente`.
- O `GET /pix/chaves` nunca retorna `404` (retorna `[]` sem conta operacional); o `404` neutro
  pertence a remocao (Task F-20.4), nao a listagem.
- Refresh apenas por gesto (`Atualizar`), sem interval, polling ou refresh ao recuperar foco; botao
  bloqueado durante a request (guarda de reentrancia).

### Step 120.2.4 - Testar acesso e listagem

Cobrir roles, uma chamada inicial, refresh explicito, ausencia de polling, vazio, `404` neutro,
erro/retry e renderizacao fiel do DTO.

```bash
npm run test -- --run src/app/features/authenticated/pix
npm run test -- --run src/app/layout/sidenav/sidenav.component.spec.ts
npm run lint
npm run lint:scss
```

### Definicao de pronto da Task F-20.2

- [ ] Rota e menu restritos a `FINANCEIRO`/`ADMIN`.
- [ ] Lista renderiza mascarado, com badge textual e datas, sem PII nem dados inventados.
- [ ] Tres superficies da listagem (lista/vazia/erro) acessiveis; refresh so por gesto, sem polling.

### Commit sugerido

```text
feat(web): listar chaves Pix da conta operacional
```

---

## Task F-20.3 - Cadastro assistido com step-up e idempotencia

**Objetivo**: cadastrar uma chave apos confirmacao acessivel e step-up valido, com idempotencia por
intencao resistente ao round-trip de step-up.

**Pre-requisito**: Task F-20.2 concluida.

**Esforco**: 1 dia.

**Arquivos esperados**:

- `src/app/core/pix/chave-pix-intencao.store.ts` e spec.
- `src/app/features/authenticated/pix/pages/chaves-pix-page.component.*` (form/dialog) e spec.

### Step 120.3.1 - Criar o formulario de cadastro

Form com `select` de `tipo` (`CPF/CNPJ/EMAIL/TELEFONE/EVP`) e input de `valor`. Validar apenas
formato minimo no frontend (obrigatorio, nao vazio); DV, tipo e unicidade sao do backend. `valor` e
obrigatorio para todo `tipo`, inclusive `EVP` (backend valida `@NotBlank`); nao permitir submit com
`valor` vazio.

### Step 120.3.2 - Confirmar e registrar com idempotencia

Ao confirmar:

1. bloquear submit concorrente;
2. abrir dialog acessivel com `tipo`/`valor` e aviso de provider fake/local;
3. exigir MFA (`mfaHabilitado`) e step-up; sem MFA, orientar habilitacao sem tentar bypass;
4. sem token, gerar/recuperar a intencao no `ChavePixIntencaoStore` e navegar para
   `/app/step-up?next=/app/pix/chaves`;
5. no retorno, exigir **novo clique**; nunca retomar o `POST` automaticamente.

`ChavePixIntencaoStore` (root, memory-only) preserva `{ tipo, valor, Idempotency-Key }`: retry de
rede/`5xx` reusa a **mesma** key (com novo step-up valido, pois o token e de uso unico); alterar
`tipo`/`valor` invalida a intencao e gera key nova na proxima confirmacao. Nunca exibir nem persistir
a key ou o valor bruto. Aplicar `TRATA_403_LOCALMENTE` ao `POST`.

### Step 120.3.3 - Tratar a resposta

- `201`/`200` = sucesso real (novo x replay); limpar a intencao, fechar o dialog e reconsultar a
  lista.
- `400` (valor/tipo/key invalido) = manter o formulario com mensagem neutra.
- `409` (key conflitante ou chave ja ativa) = reconsultar a lista, sem sucesso presumido.
- `422` (conta operacional indisponivel) = mensagem neutra; nao e falha do usuario.
- `403` = limpar estado efemero e oferecer novo step-up, preservando a intencao sem reenviar.
- rede/`5xx` = estado desconhecido; manter a intencao/key e reconsultar antes de repetir.

### Step 120.3.4 - Testar o cadastro

Cobrir precheck de MFA, redirect de step-up sem auto-submit, intencao/key por retry, `201`/`200`,
`400`/`409`/`422`/`403`/rede e ausencia de persistencia sensivel.

### Definicao de pronto da Task F-20.3

- [ ] Cadastro exige confirmacao e step-up proprio; retorno do step-up nunca cadastra sozinho.
- [ ] Idempotencia correta: mesma key em retry ambiguo; key nova ao mudar `tipo`/`valor`.
- [ ] Key e valor bruto nunca exibidos nem persistidos.
- [ ] `400/409/422/403/rede` nao viram sucesso presumido.

### Commit sugerido

```text
feat(web): cadastrar chave Pix assistida com step-up
```

---

## Task F-20.4 - Remocao assistida com step-up

**Objetivo**: inativar uma chave `ATIVA` apos confirmacao acessivel e step-up valido, com `404`
neutro e idempotencia.

**Pre-requisito**: Task F-20.3 concluida.

**Esforco**: 0,5 dia.

### Step 120.4.1 - Oferecer a acao de remover

Exibir a acao `Remover` somente em chaves `ATIVA`. Chaves `INATIVA` mostram estado e `removidaEm`,
sem CTA. A acao e semanticamente distinta (destrutiva).

### Step 120.4.2 - Confirmar e inativar

Ao clicar:

1. bloquear submit concorrente;
2. abrir dialog acessivel de confirmacao (`role="dialog"`, `aria-modal`, foco, `Escape`, restauracao
   de foco);
3. exigir MFA e step-up; sem token, navegar para `/app/step-up?next=/app/pix/chaves`;
4. no retorno, exigir novo clique; nunca remover automaticamente;
5. aplicar `TRATA_403_LOCALMENTE` ao `DELETE`.

### Step 120.4.3 - Tratar a resposta

- `204` = sucesso (idempotente mesmo se ja `INATIVA`); reconsultar a lista.
- `404` = indisponivel neutro (chave inexistente/fora de escopo/conta ausente), sem enumerar; a UI
  reconsulta a lista.
- `403` = oferecer novo step-up.
- rede/`5xx` = estado desconhecido; reconsultar antes de repetir.

### Definicao de pronto da Task F-20.4

- [ ] Remover so em `ATIVA`, com confirmacao e step-up proprio.
- [ ] Retorno do step-up nunca remove sozinho; `DELETE` idempotente.
- [ ] `404` neutro; `403`/rede nao presumem sucesso.

### Commit sugerido

```text
feat(web): remover chave Pix assistida com step-up
```

---

## Task F-20.5 - Erros, concorrencia, acessibilidade e cobertura focada

**Objetivo**: fechar a matriz negativa sem reinterpretar regra de negocio.

**Pre-requisito**: Task F-20.4 concluida.

**Esforco**: 0,5 dia.

### Step 120.5.1 - Fixar matriz de resposta

| Resposta | Cadastro | Remocao |
|----------|----------|---------|
| `400` | valor/tipo/key invalido; manter formulario | n/a |
| `403` | limpar estado efemero e oferecer novo step-up, preservando a intencao | oferecer novo step-up |
| `404` | n/a | chave indisponivel neutra; sem enumeracao |
| `409` | key/chave conflitante; reconsultar lista, sem sucesso presumido | n/a |
| `422` | conta operacional indisponivel; mensagem neutra | n/a |
| rede/`5xx` | reusar key da mesma intencao e reconsultar | reconsultar antes de repetir |

Mensagens nao ecoam UUID, header, valor bruto, `valorHash` ou detalhe de provider.

### Step 120.5.2 - Cobrir concorrencia e duplo submit

- uma request por comando; CTAs bloqueados durante GET de refresh e mutacao;
- dialogs nao sobrepostos;
- resposta tardia de request anterior nao sobrescreve a lista mais nova;
- `409`/`404` sempre convergem por nova leitura.

Aplicar aqui a mesma correcao de duplo toque adotada nos aportes da M-16 (follow-up de
`consultarStatusPix`): a mutacao nao pode disparar duas vezes por toque rapido.

### Step 120.5.3 - Revisar acessibilidade e responsividade

- heading unico por pagina, landmarks e status anunciados;
- tabela vira cards/lista legivel em viewport estreito, sem ocultar acao ou estado;
- badges possuem texto, nao dependem so de cor;
- foco, teclado, dialogs, erros e retry verificaveis;
- light/dark e zoom de 200% sem perda funcional.

### Step 120.5.4 - Rodar suite focada

```bash
npm run test -- --run src/app/core/pix
npm run test -- --run src/app/features/authenticated/pix
npm run test -- --run src/app/core/interceptors/step-up.interceptor.spec.ts
npm run lint
npm run lint:scss
```

### Definicao de pronto da Task F-20.5

- [ ] Matriz `400/403/404/409/422/rede` coberta.
- [ ] Concorrencia e duplo submit nao duplicam comandos.
- [ ] Nenhum erro presume cadastro ou remocao.
- [ ] Fluxos acessiveis e responsivos, light/dark.

### Commit sugerido

```text
test(web): cobrir erros e concorrencia de chaves Pix
```

---

## Task F-20.6 - MSW, Vitest e cobertura focada

**Objetivo**: representar o contrato de chaves Pix no MSW stateful e cobrir os cenarios em Vitest.

**Pre-requisito**: Task F-20.5 concluida.

**Esforco**: 0,5 dia.

**Arquivos esperados**:

- `src/mocks/handlers.ts` (`chavesPixHandlers`, `seedChavesPix`, `resetChavesPixState`).
- specs Vitest co-locados das Tasks F-20.1-F-20.5.

### Step 120.6.1 - Completar MSW stateful

Handlers/fixtures devem representar:

- `GET` com lista contendo `ATIVA` e `INATIVA` (mais recentes primeiro) e o caso vazio `[]`;
- `POST` novo `201`, replay da mesma key/`tipo`/`valor` `200`, `409` de key conflitante ou chave ja
  ativa, `400` de valor invalido, `422` de conta indisponivel;
- `DELETE` `204` (idempotente), `404` neutro;
- reset deterministico entre specs (`resetChavesPixState`).

O mock valida `X-Step-Up-Token` nas mutacoes (`403` sem token) e `Idempotency-Key` no cadastro;
reusar `mascararChavePix()` ja existente para nunca emitir valor bruto. Nao alterar o comportamento
de producao para facilitar o teste. Seed com usuarios `financeiro@empresa.com` e `admin@empresa.com`.

### Step 120.6.2 - Rodar suite completa

```bash
npm run lint
npm run lint:scss
npm run test
npm run build
npm run contract:check
```

### Definicao de pronto da Task F-20.6

- [ ] MSW cobre lista/vazia, `201`/`200`/`409`/`400`/`422`, `204`/`404` e valida step-up + key.
- [ ] `resetChavesPixState` garante isolamento entre specs (F.I.R.S.T.).
- [ ] Suite Vitest, lint, build e `contract:check` verdes.

### Commit sugerido

```text
test(web): mockar e cobrir chaves Pix no MSW e Vitest
```

---

## Task F-20.7 - Playwright, collections, docs e fechamento

**Objetivo**: validar a jornada integrada, atualizar documentacao/collections e preparar o PR.

**Pre-requisito**: Task F-20.6 concluida.

**Esforco**: 0,5 dia.

**Arquivos esperados**:

- `e2e/pix-chaves.spec.ts`.
- collections Postman/Insomnia (`docs-SEP`), README web, WEB-SCREENS-PLAN, AI-ROADMAP e PR
  description.

### Step 120.7.1 - Criar smoke Playwright

Cobrir ao menos:

1. `FINANCEIRO`/`ADMIN`: listar chaves -> cadastrar -> confirmacao -> redirect de step-up (sem
   auto-submit) e -> remover -> confirmacao -> redirect de step-up;
2. lista vazia e lista com `ATIVA`/`INATIVA`;
3. role indevida (`CLIENTE`/`BACKOFFICE`) nao ve o menu e nao acessa `/app/pix/chaves`.

Se o MSW nao concluir TOTP de forma fiel, o smoke offline deve ao menos provar o redirecionamento e a
ausencia de auto-submit; cadastro/remocao com token real viram smoke local com backend `:8080`,
registrado como gate, nao como sucesso simulado. Nao tocar `golden-path`/`golden-path-mobile`.

### Step 120.7.2 - Atualizar docs e collections obrigatorios

- `docs-SEP/repos/sep-app/README.md`: rota `/app/pix/chaves`, contrato, personas, refresh por gesto,
  step-up, idempotencia, estados, testes e limitacao fake/local.
- `docs-SEP/docs-sep/WEB-SCREENS-PLAN.md`: chaves Pix como implementada quando a sprint fechar.
- `docs-SEP/AI-ROADMAP.md`: F-20 e o tema chaves Pix apontando para spec 120 + este step.
- Collections Postman/Insomnia: grupo `pix/chaves` (`POST`/`GET`/`DELETE`), sem PII/secrets
  (variaveis vazias).
- `docs-SEP/repos/sep-app/SPRINT-F-20-PR.md`: criar descricao temporaria consolidada ao fim.

### Step 120.7.3 - Fechamento mergeado (apos PR)

Ao mergear em `develop`+`main`:

- PRD-FASE-4 §36 (tabela web): adicionar a linha F-20 com o resultado.
- PRD-FASE-4 §37: marcar a visibilidade web de chaves Pix como **atendida** (a exigencia mobile
  segue como registrada no Gate M-16.0).
- `STATE.md`: sobrescrever estado + proximo passo; apendar historico curto em `CONTEXT-PARTE-2.md`.
- `specs/fase-4/README.md`: status da linha F-20 para `concluida`.

### Step 120.7.4 - Rodar gate final

```bash
cd <sep-app-root>
npm run lint
npm run lint:scss
npm run test
npm run build
npm run e2e
npm run contract:check
npm audit --omit=dev
git status --short --branch
git diff --stat
```

### Step 120.7.5 - Checkpoint final pre-commit

Apresentar arquivos, testes/lint/build/E2E/contract/audit com contagens, evidencias da jornada
(listar -> cadastrar -> step-up; remover -> step-up), riscos (provider fake, smoke TOTP real,
`X-Step-Up-Token` fora do OpenAPI) e mensagem de commit sugerida. Criar/atualizar
`repos/sep-app/SPRINT-F-20-PR.md`, sem executar Git em `docs-SEP`. Push e PR do `sep-app` manuais.

### Definicao de pronto da Task F-20.7

- [ ] Playwright cobre listar/cadastrar/remover proporcional ao ambiente, sem bypass enganoso.
- [ ] Collections, README web, WEB-SCREENS-PLAN e AI-ROADMAP atualizados.
- [ ] PR description temporaria criada.
- [ ] Gate final verde ou pendencias objetivas registradas.

### Commit sugerido

```text
test(web): validar jornada de chaves Pix no web
```

---

## Definition of Done da F-Sprint 20

- [ ] `FINANCEIRO`/`ADMIN` lista (mascarado), cadastra e remove chaves Pix no web.
- [ ] Cadastro e remocao exigem confirmacao e step-up estrito; retorno do step-up nunca muta.
- [ ] Cadastro idempotente: mesma `Idempotency-Key` em retry ambiguo; key nova ao mudar `tipo`/`valor`.
- [ ] Valor bruto da chave, key e dados de provider nunca aparecem em leitura, erro ou log.
- [ ] Tres superficies da listagem (lista/vazia/erro) acessiveis; `404` neutro tratado na remocao;
      sem polling; refresh so por gesto.
- [ ] `400/403/404/409/422/rede`, concorrencia e duplo submit possuem cobertura proporcional.
- [ ] New Design System SEP, acessibilidade, responsividade e light/dark verificados.
- [ ] MSW, Vitest, lint, SCSS lint, build, Playwright e `contract:check` verdes; `npm audit` 0.
- [ ] Fecha no web a pendencia de chaves Pix do `v1.0-local` (PRD-FASE-4 §37); docs e roadmap
      atualizados.
