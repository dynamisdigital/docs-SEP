# Steps - F-Sprint 19 - Hardening de tooling, contrato e collections

**Spec de origem**: [`119-fsprint-19-hardening-tooling-contrato-web.md`](../../specs/fase-4/119-fsprint-19-hardening-tooling-contrato-web.md)

**Status**: planejada.

**Objetivo geral**: quitar a divida de tooling aceita no fechamento da Fase 3: confrontar os tipos
de borda consumidos pelo `sep-app` com o OpenAPI runtime vigente, atualizar o tooling compativel
com a baseline Angular 20, renovar as collections Postman e Insomnia para os contratos posteriores
a Sprint 14 e registrar em ADR a decisao sobre Angular 22. A sprint nao cria tela, endpoint ou
regra de negocio.

**Esforco total estimado**: 3-5 dias de Dev Pleno Frontend, com apoio backend apenas para subir o
OpenAPI runtime e validar as collections.

**Repos de destino**:

- `sep-app`: validacao automatizada de contrato, tipos de borda quando houver divergencia real,
  dependencias/tooling, scripts, CI e testes de regressao.
- `docs-SEP`: este step, ADR 0018, collections, indices e docs operacionais; toda operacao Git
  permanece manual.
- `sep-api`: somente fonte runtime do OpenAPI e alvo de smoke. Nao alterar contrato, controller,
  DTO, migration ou regra nesta sprint.

**Branch sugerida**: `feature/fsprint-19-hardening-tooling-contrato-web`.

## Baseline conhecida a reconfirmar

Na criacao deste step, a base observada era:

- Angular `20.3.x`, TypeScript `5.9.x`, RxJS `7.8.x` e Node 20 no CI;
- Vitest `3.2.x`, `@analogjs/vitest-angular` `1.22.x`, ESLint 9, Stylelint 16 e Prettier 3;
- `sep-app/README.md` e comentarios do Dependabot ainda citam partes de uma baseline anterior
  (Vitest 2, instalacao com `--legacy-peer-deps`), embora o CI use `npm ci`;
- springdoc publica o contrato em `GET /v3/api-docs`;
- as collections `docs-sep/sep-api.postman_collection.json` e
  `docs-sep/sep-api.insomnia_collection.json` nao cobrem os contratos novos de `credores` e
  conservam apenas o recorte Pix antigo;
- a spec registra dez ocorrencias de audit exclusivas de tooling, mas a contagem e severidade
  devem ser recalculadas no Gate F-19.0. Nao tratar o numero historico como resultado atual.

Esses dados orientam o precheck, mas nao substituem a evidencia obtida na branch da sprint.

## Autoridades e regras de decisao

1. O JSON servido pelo `sep-api` integrado em `develop` por `/v3/api-docs` e a autoridade do
   contrato HTTP. Docs de modulo e codigo ajudam a diagnosticar, mas nao sobrescrevem o runtime.
2. O frontend deve validar apenas os endpoints e schemas que efetivamente consome. Nao gerar ou
   adotar um client completo para toda a API sem necessidade comprovada.
3. Divergencia real do tipo TypeScript e corrigida no `sep-app`. OpenAPI ausente/incompleto vira
   follow-up backend explicito; nao alterar o backend silenciosamente para fechar esta sprint.
4. Angular 20 permanece a baseline durante toda a F-19. O ADR pode recomendar Angular 22, mas o
   upgrade major exige execucao dedicada posterior e nao entra implicitamente nesta branch.
5. Proibidos `npm audit fix --force`, relaxamento de lint/teste, `skipLibCheck` novo para esconder
   incompatibilidade, pin arbitrario sem evidencia e atualizacao ampla nao relacionada.
6. Vulnerabilidade de runtime, vulnerabilidade de dependencia de desenvolvimento e alerta
   exclusivo de tooling sao categorias diferentes. Registrar alcance, cadeia e correcao de cada
   ocorrencia antes de decidir.
7. Collections nunca armazenam credencial, token, CPF/CNPJ, chave Pix bruta ou identificador real.
   Usar variaveis e exemplos ficticios.

## Fora de escopo

- Angular 22 efetivo ou outra major de framework/build/test runner.
- Tela web de gestao/visibilidade de chaves Pix; ela permanece na sprint dedicada pos-F-19.
- Endpoint, DTO, anotacao OpenAPI, migration ou regra de negocio nova no `sep-api`.
- Cliente HTTP gerado substituindo os services existentes de forma ampla.
- Refactor de componentes, design system, MSW ou jornadas funcionais sem divergencia de contrato.
- Alteracao de CI de deploy, infraestrutura AWS ou providers reais da Fase 5.
- Fazer a collection executar movimentacao financeira real ou webhook contra ambiente externo.

## Protocolo obrigatorio por Task

1. Executar somente a Task liberada pelo usuario.
2. Confirmar branch, arquivos e evidencia atuais antes de editar.
3. Fazer a menor mudanca que cumpra o criterio observavel da Task.
4. Atualizar teste/script/documento diretamente afetado; nao aproveitar para refactor adjacente.
5. Rodar as verificacoes proporcionais ao risco e comparar com a baseline do Gate F-19.0.
6. Parar em checkpoint pre-commit com arquivos, comandos, resultados, riscos e commit sugerido.
7. Aguardar aprovacao antes de `git add`/`git commit`; usar apenas paths especificos.
8. Nao iniciar a Task seguinte sem ordem explicita.

**Skills obrigatorias durante a implementacao em codigo**:

- `coding-guidelines`: suposicoes explicitas, mudancas cirurgicas e verificacao orientada a meta;
- `clean-code`: scripts, tipos e testes com nomes claros e uma responsabilidade;
- `design-patterns-java`: usar somente como filtro contra complexidade desnecessaria; a F-19 nao
  pede padrao GoF nem alteracao Java.

## Rastreabilidade spec 119 -> steps

| Task da spec 119 | Steps |
|------------------|-------|
| 1. Refresh da collection | F-19.3 |
| 2. Validar tipos de borda contra OpenAPI | F-19.1 |
| 3. Revisar audit e atualizar tooling seguro | F-19.2 |
| 4. ADR de avaliacao Angular 22 | F-19.4 |
| 5. Ajustar CI/lint/testes e manter suite verde | F-19.5 |
| Precheck OpenAPI, collection e baseline | Gate F-19.0 |
| Smoke, docs e fechamento | Gate final F-19.G |

## Ordem de execucao

```text
F-19.0 prechecks + inventarios
  -> F-19.1 contrato automatizado + correcoes comprovadas
  -> F-19.2 tooling seguro dentro do Angular 20
  -> F-19.3 Postman + Insomnia alinhados ao OpenAPI
  -> F-19.4 ADR 0018 (adotar depois ou adiar Angular 22)
  -> F-19.5 CI + regressao
  -> F-19.G smoke + docs + fechamento
```

O inventario do Gate F-19.0 e bloqueante. Nao corrigir tipo, dependencia ou collection com base
apenas na spec, em controller isolado ou em memoria de contrato.

---

## Gate F-19.0 - Cadeia Git, OpenAPI e baselines

**Objetivo**: produzir evidencia reproduzivel antes de alterar tipos, dependencias ou collections.

### Step 119.0.1 - Confirmar a cadeia de integracao

No `sep-app`:

```bash
git fetch --all --prune
git status --short --branch
git log --oneline --decorate -10
git rev-list --left-right --count origin/develop...origin/main
git merge-base --is-ancestor ee9d5b6 origin/develop
```

Confirmar que:

- a branch nasceu de `origin/develop` atualizado;
- F-18 esta integrada em `develop` e `main`;
- nao ha mudanca local do usuario que seria sobrescrita;
- `sep-api/develop` contem as Sprints 27-32, fonte do OpenAPI vigente.

Se a cadeia divergir, parar e registrar o bloqueio. Nao fazer merge/rebase/reset automaticamente.

### Step 119.0.2 - Capturar a baseline web

```bash
cd <sep-app-root>
node --version
npm --version
npm ci
npm ls --depth=0
npm run format:check
npm run lint
npm run lint:scss
npm run test
npm run build
npm run e2e
npm audit --json > /tmp/sep-app-f19-audit-before.json
npm audit --omit=dev
npm outdated || true
```

Registrar versoes, contagem de testes/E2E, warnings de build e audit por severidade. Separar:

- `RUNTIME`: alcanca `dependencies` usadas no bundle;
- `DEV_TOOLING`: apenas lint/build/test/formatacao;
- `SEM_CORRECAO_COMPATIVEL`: exige major ou depende de upstream;
- `FALSO_POSITIVO/NAO_ALCANCAVEL`: somente com justificativa tecnica verificavel.

Nao modificar `package.json` ou lockfile neste step.

### Step 119.0.3 - Exportar o OpenAPI runtime

Com PostgreSQL local disponivel, subir o `sep-api` integrado em outro terminal e exportar:

```bash
cd <sep-api-root>
./gradlew bootRun
```

```bash
curl --fail --silent --show-error http://localhost:8080/v3/api-docs \
  --output /tmp/sep-api-f19-openapi.json
jq empty /tmp/sep-api-f19-openapi.json
sha256sum /tmp/sep-api-f19-openapi.json
```

O arquivo em `/tmp` e evidencia temporaria, sem token ou segredo, e nao deve ser commitado por
acidente. Registrar commit do `sep-api`, hash, versao OpenAPI e quantidade de paths/schemas.

Se o runtime nao subir, diagnosticar ambiente/DB antes de usar controller ou doc como substituto.

### Step 119.0.4 - Inventariar contratos consumidos pelo frontend

Para cada chamada HTTP existente no `sep-app`, registrar:

- service/metodo TypeScript;
- metodo e path OpenAPI;
- path/query/header parameters e obrigatoriedade;
- request/response schema e status de sucesso;
- campos required/opcionais, nullability, arrays/paginacao, enums, datas e numeros;
- classificacao `ALINHADO | DIVERGENTE_FRONT | OPENAPI_INCOMPLETO | NAO_CONSUMIDO`.

Priorizar as bordas alteradas desde a collection da Sprint 14: credoras, oportunidades/interesse,
carteira owner-scoped, aporte/matching, Pix operacional/owner-scoped, chaves Pix, cobranca,
renegociacao e backoffice. O inventario e amplo; correcoes continuam restritas a divergencias reais.

### Step 119.0.5 - Inventariar as duas collections

Comparar Postman e Insomnia com os paths/tags do OpenAPI. Registrar para cada operacao do recorte:

- `PRESENTE_ALINHADA`;
- `PRESENTE_DIVERGENTE`;
- `AUSENTE`;
- `FORA_DO_RECORTE`.

Confirmar tambem variaveis, auth, step-up, idempotencia, exemplos de body/status e ausencia de
segredos. Postman e Insomnia devem terminar equivalentes; nenhuma delas e tratada como descartavel.

### Definicao de pronto do Gate F-19.0

- [ ] Cadeia Git e commits fonte registrados.
- [ ] Baseline web verde ou falhas preexistentes documentadas.
- [ ] Audit atual classificado sem assumir a contagem historica.
- [ ] OpenAPI runtime exportado, validado e identificado por hash.
- [ ] Matrizes frontend/OpenAPI e collections/OpenAPI revisadas antes de qualquer correcao.

---

## Task F-19.1 - Validacao automatizada do contrato frontend

**Objetivo**: tornar divergencias dos tipos de borda observaveis e corrigir somente as comprovadas.

**Pre-requisito**: Gate F-19.0 concluido.

**Esforco**: 1 dia.

### Step 119.1.1 - Escolher o mecanismo minimo de validacao

Implementar uma verificacao deterministica que receba um JSON OpenAPI por path local ou URL e
termine com exit code diferente de zero quando um contrato consumido divergir. Ela deve cobrir no
minimo:

- existencia de metodo/path e parametros obrigatorios;
- headers sensiveis (`X-Step-Up-Token`, `Idempotency-Key`) quando documentados;
- status de sucesso realmente tratados pelo frontend;
- campos, required/opcional, nullability, array/paginacao e enums dos DTOs consumidos.

Preferir geracao de tipos + assercoes estruturais quando o schema runtime for suficiente. Se a
geracao integral produzir um client amplo sem uso, filtrar para os paths consumidos ou usar um
verificador pequeno. Uma checklist manual isolada nao atende a Task.

Interface sugerida, adaptavel ao mecanismo escolhido:

```bash
SEP_OPENAPI_SCHEMA=/tmp/sep-api-f19-openapi.json npm run contract:check
```

O check nao pode depender de backend remoto, credencial ou ordem de testes. Se houver artefato
gerado commitado, documentar claramente fonte, comando de regeneracao e proibicao de edicao manual.

### Step 119.1.2 - Adicionar testes do proprio verificador

Cobrir fixtures pequenas para provar ao menos:

- contrato alinhado passa;
- path/metodo ausente falha;
- campo required removido/adicionado de forma incompativel falha;
- enum ou nullability divergente falha;
- diferenca fora dos paths consumidos nao gera falso bloqueio.

Os testes nao devem copiar o OpenAPI completo nem depender de `/tmp`.

### Step 119.1.3 - Corrigir divergencias `DIVERGENTE_FRONT`

Para cada item aprovado na matriz:

- ajustar o modelo de borda e o menor conjunto de consumidores/testes;
- manter data ISO como `string`, salvo conversao explicita existente fora do DTO;
- nao trocar campo opcional por `any`, cast duplo ou valor default que esconda ausencia;
- nao inferir enum/status nao publicado;
- atualizar MSW apenas se a fixture contrariar o mesmo contrato real.

`OPENAPI_INCOMPLETO` nao vira tipo inventado nem alteracao backend nesta Task. Registrar follow-up
com path/schema/campo e evidencia do runtime.

### Step 119.1.4 - Executar verificacao focada

```bash
SEP_OPENAPI_SCHEMA=/tmp/sep-api-f19-openapi.json npm run contract:check
npm run test -- --run src/app/core
npm run lint
npm run build
```

### Definicao de pronto da Task F-19.1

- [ ] Check automatizado falha para divergencia observavel e passa para o runtime vigente.
- [ ] Somente contratos consumidos entram no gate.
- [ ] Divergencias reais do frontend foram corrigidas sem mudar regra de negocio.
- [ ] Lacunas do OpenAPI foram registradas, nao mascaradas.
- [ ] Verificador possui testes pequenos e deterministas.

### Commit sugerido

```text
test(web): validar contratos de borda contra openapi
```

---

## Task F-19.2 - Hardening seguro do tooling Angular 20

**Objetivo**: reduzir vulnerabilidades e inconsistencias de tooling sem trocar a baseline major.

**Pre-requisito**: Task F-19.1 concluida e audit classificado.

**Esforco**: 0,5-1 dia.

### Step 119.2.1 - Definir atualizacoes permitidas

Montar uma tabela por pacote/grupo com versao atual, versao alvo, motivo, advisory corrigido,
compatibilidade declarada e rollback. Grupos minimos a avaliar separadamente:

- Angular framework/build/CLI/compiler;
- `angular-eslint`, ESLint e TypeScript ESLint;
- Vitest, coverage e plugins Analog;
- Playwright/MSW/happy-dom/jsdom;
- Prettier, Stylelint, Husky e lint-staged.

Permitir patch/minor compativel com Angular 20 e Node 20. Major, peer incompativel ou pacote sem
beneficio concreto fica adiado e entra no ADR/registro de risco.

### Step 119.2.2 - Atualizar em grupos pequenos

Aplicar um grupo por vez com versoes explicitas e lockfile reproduzivel. A cada grupo:

```bash
npm install --save-dev <pacotes@versoes-aprovadas>
npm ls
npm run format:check
npm run lint
npm run lint:scss
npm run test
npm run build
```

Nao usar `--force`, `--legacy-peer-deps` como solucao permanente nem editar o lockfile manualmente.
Se a resolucao exigir isso, reverter somente o grupo da Task e registrar o adiamento.

### Step 119.2.3 - Alinhar configuracoes e documentacao de tooling

Revisar apenas inconsistencias relacionadas:

- scripts e engines/package manager quando necessarios;
- `eslint.config.js`, Stylelint, TypeScript e Angular builder;
- grupos/ignores/comentarios do Dependabot;
- `sep-app/README.md` e `docs-SEP/repos/sep-app/README.md`, removendo versoes e comandos obsoletos.

Nao relaxar regra existente para fazer pacote novo passar.

### Step 119.2.4 - Comparar audit antes/depois

```bash
npm audit --json > /tmp/sep-app-f19-audit-after.json
npm audit --omit=dev
npm ls --depth=0
```

Registrar o delta por advisory e cadeia. O criterio nao e "zero a qualquer custo":

- vulnerabilidade de runtime alta/critica bloqueia o fechamento;
- ocorrencia apenas de tooling sem correcao compativel pode permanecer se documentada no ADR;
- advisory removido deve ter evidencia no audit final, nao apenas versao presumida.

### Definicao de pronto da Task F-19.2

- [ ] Atualizacoes sao compativeis com Angular 20/Node 20 e possuem motivo concreto.
- [ ] Lockfile instala com `npm ci` sem bypass.
- [ ] Nenhuma regra de qualidade foi desabilitada.
- [ ] Audit antes/depois e residuos estao classificados.
- [ ] README e Dependabot refletem a baseline real.

### Commit sugerido

```text
chore(web): endurecer tooling compativel com angular 20
```

---

## Task F-19.3 - Refresh das collections Postman e Insomnia

**Objetivo**: alinhar as duas collections ao OpenAPI runtime para os contratos posteriores a
Sprint 14, com exemplos seguros e executaveis localmente.

**Pre-requisito**: Gate F-19.0 concluido; usar o mesmo OpenAPI identificado por commit/hash.

**Esforco**: 1 dia.

### Step 119.3.1 - Definir pastas e variaveis equivalentes

Organizar Postman e Insomnia com os mesmos grupos funcionais e variaveis ficticias, incluindo:

- `baseUrl`, `accessToken`, `stepUpToken` e `idempotencyKey`;
- IDs de empresa credora, oportunidade, operacao, matching, aporte, contrato, parcela, chave Pix,
  desembolso e recebimento;
- headers Bearer, step-up e idempotencia somente nos endpoints que os exigem.

Tokens/IDs de exemplo nao podem parecer credenciais reais. `Idempotency-Key` deve ser variavel por
intencao; exemplos de replay reutilizam conscientemente a mesma variavel.

### Step 119.3.2 - Cobrir `credores` e leituras owner-scoped

Confrontar todos os paths do tag/modulo `credores`, incluindo no minimo:

```http
POST   /api/v1/credores
GET    /api/v1/credores/me
GET    /api/v1/credores/me/elegibilidade
GET    /api/v1/credores/{id}
GET    /api/v1/credores/oportunidades
GET    /api/v1/credores/oportunidades/{id}
POST   /api/v1/credores/oportunidades/{id}/interesses
GET    /api/v1/credores/oportunidades/{id}/interesses/me
DELETE /api/v1/credores/oportunidades/{id}/interesses/me
POST   /api/v1/credores/oportunidades/sync
GET    /api/v1/credores/carteira
GET    /api/v1/credores/carteira/{id}
GET    /api/v1/credores/carteira/{id}/pix
POST   /api/v1/credores/carteira/operacoes
GET    /api/v1/credores/matching/sugestoes
GET    /api/v1/credores/matching/{sugestaoId}
POST   /api/v1/credores/matching/{sugestaoId}/decisao
POST   /api/v1/credores/operacoes/{operacaoId}/aportes
GET    /api/v1/credores/operacoes/{operacaoId}/aportes
```

O OpenAPI decide a lista final, os bodies, headers, roles documentadas e statuses. Para ownership,
incluir exemplo neutro de `404` sem transformar a collection em enumerador de recursos alheios.

### Step 119.3.3 - Cobrir Pix vigente e gestao de chaves

Confrontar todos os paths do tag/modulo Pix, incluindo no minimo:

```http
POST   /api/v1/pix/desembolsos
GET    /api/v1/pix/desembolsos/{id}
POST   /api/v1/pix/desembolsos/{id}/status
POST   /api/v1/pix/recebimentos/referencias
GET    /api/v1/pix/recebimentos/referencias/{id}
GET    /api/v1/pix/recebimentos/{id}
GET    /api/v1/pix/contratos/{contratoId}/desembolso
GET    /api/v1/pix/parcelas/{parcelaId}/status
POST   /api/v1/pix/chaves
GET    /api/v1/pix/chaves
DELETE /api/v1/pix/chaves/{chaveId}
```

Exemplos de chave usam valor inequivocamente ficticio. Respostas publicas exibem apenas mascara e
hash/identificador permitidos pelo contrato; nunca acrescentar chave bruta em exemplo de response.

### Step 119.3.4 - Adicionar exemplos positivos e negativos relevantes

Sem multiplicar casos artificiais, cobrir:

- sucesso principal e status correto (`200`, `201`, `202` ou `204` conforme OpenAPI);
- `401/403` para auth/role/step-up onde relevante;
- `404` owner-scoped neutro;
- `409` de estado/idempotencia quando publicado;
- replay de aporte com mesma key/valor e ausencia de auto-submit;
- validacao `400` representativa, sem dados sensiveis.

Collections sao ferramentas de contrato, nao suites destrutivas. Comandos mutaveis devem ter nome
e descricao claros e apontar por default para `localhost`.

### Step 119.3.5 - Validar estrutura, importacao e paridade

```bash
jq empty docs-sep/sep-api.postman_collection.json
jq empty docs-sep/sep-api.insomnia_collection.json
```

Importar ambas nas ferramentas correspondentes e executar um smoke local dos grupos atualizados
com usuarios/roles de teste. Comparar metodo+path entre OpenAPI, Postman e Insomnia e justificar
qualquer exclusao. Nao registrar token ou response real nos arquivos versionados.

### Definicao de pronto da Task F-19.3

- [ ] Postman e Insomnia cobrem o mesmo recorte vigente de credores/Pix.
- [ ] Metodo, path, body, headers e status conferem com o OpenAPI runtime.
- [ ] Owner-scoped, step-up e idempotencia aparecem corretamente.
- [ ] Nenhum segredo, PII ou chave Pix bruta foi versionado.
- [ ] JSONs importam e o smoke local foi registrado.

### Commit sugerido (`docs-SEP`, somente sugestao; Git manual)

```text
docs(api): atualizar collections de credores e pix
```

---

## Task F-19.4 - ADR 0018 para Angular 22

**Objetivo**: decidir com evidencia se a major deve ser adotada em trabalho posterior ou adiada.

**Pre-requisito**: audits antes/depois, matriz de compatibilidade e suite Angular 20 disponiveis.

**Esforco**: 0,5 dia.

### Step 119.4.1 - Criar o ADR

Criar:

```text
docs-SEP/adr/0018-avaliacao-angular-22-no-web.md
```

O ADR deve conter:

- contexto da baseline Angular 20 e origem das ocorrencias de tooling;
- compatibilidade oficial de Angular 22 com Node, TypeScript e RxJS na data da avaliacao;
- impacto em CLI/build, angular-eslint, Analog/Vitest, Testing Library, Playwright e CI;
- audit antes/depois, distinguindo runtime de dev tooling;
- custo de migracao, riscos, rollback e efeito sobre mobile (sem acoplar a decisao mobile);
- alternativas: manter Angular 20 endurecido, migrar em sprint dedicada ou substituir tooling
  incompativel de forma pontual;
- decisao unica: `ADOTAR_EM_SPRINT_DEDICADA` ou `ADIAR`;
- gatilho/data de revisao se adiado e pre-condicoes objetivas se adotado.

Usar apenas documentacao oficial/changelogs e saidas locais como evidencia tecnica. Nao basear a
decisao somente no `npm audit fix` sugerido.

### Step 119.4.2 - Registrar consequencias sem executar a major

Se `ADOTAR_EM_SPRINT_DEDICADA`:

- listar sequencia de migracao e gates de compatibilidade;
- criar follow-up explicito no planejamento, sem alterar majors nesta branch.

Se `ADIAR`:

- registrar advisories residuais, alcance, mitigacao e criterio de reabertura;
- manter ignores do Dependabot estritamente alinhados a essa justificativa.

Em ambos os casos, atualizar referencias do roadmap/PRD apenas no fechamento apropriado.

### Definicao de pronto da Task F-19.4

- [ ] ADR 0018 possui evidencia, alternativas, decisao e consequencias.
- [ ] Audit de runtime e tooling nao estao misturados.
- [ ] Compatibilidade de toda a cadeia de build/teste foi considerada.
- [ ] Nenhuma major Angular foi aplicada na F-19.
- [ ] Proximo gatilho e responsavel tecnico estao claros.

### Commit sugerido (`docs-SEP`, somente sugestao; Git manual)

```text
docs(adr): registrar decisao sobre angular 22 no web
```

---

## Task F-19.5 - Integrar gates ao CI e validar regressao

**Objetivo**: tornar o hardening reproduzivel sem acoplar o CI web a um backend remoto.

**Pre-requisito**: Tasks F-19.1-F-19.4 concluidas.

**Esforco**: 0,5-1 dia.

### Step 119.5.1 - Integrar o check de contrato

Adicionar `contract:check` ao workflow web somente se sua entrada versionada/gerada for
deterministica e offline. O CI nao deve baixar OpenAPI de ambiente externo nem subir banco/API para
um teste estrutural do frontend.

Fluxo minimo do job de qualidade:

```text
npm ci
  -> format:check
  -> contract:check
  -> lint
  -> lint:scss
  -> test:coverage
  -> build
```

Se o check contra runtime exigir execucao cross-repo, manter o comando local documentado como gate
de atualizacao de contrato e fazer o CI validar o artefato correspondente sem rede.

### Step 119.5.2 - Testar scripts e instalacao limpa

Garantir que:

- `npm ci` funciona com Node 20 sem flags de bypass;
- scripts retornam exit code correto e nao alteram working tree durante check;
- arquivos temporarios usam diretorio ignorado ou `/tmp`;
- cache/ordem de jobs nao mascara dependencia ausente;
- coverage e artifacts atuais continuam publicados.

### Step 119.5.3 - Rodar regressao funcional

```bash
npm run format:check
npm run contract:check
npm run lint
npm run lint:scss
npm run test
npm run test:coverage
npm run build
npm run e2e
```

Tooling atualizado nao autoriza mudar assertions funcionais apenas para obter verde. Investigar
qualquer diferenca de DOM, timer, transform, coverage ou browser antes de ajustar teste.

### Step 119.5.4 - Revisar dependencias e diff final

```bash
npm ls
npm audit --omit=dev
git diff --check
git diff --stat
git status --short --branch
```

Revisar especialmente lockfile, workflow, configuracoes e artefatos gerados para excluir ruido,
paths absolutos, timestamps instaveis e conteudo externo nao necessario.

### Definicao de pronto da Task F-19.5

- [ ] CI valida o contrato de forma deterministica ou documenta claramente o gate cross-repo.
- [ ] Instalacao limpa nao usa bypass de peers.
- [ ] Lint, SCSS, testes, coverage, build e E2E permanecem verdes.
- [ ] Nenhuma regressao funcional foi normalizada como "mudanca de tooling".
- [ ] Diff de dependencias/configuracao e explicavel e minimo.

### Commit sugerido

```text
ci(web): validar contrato e baseline de tooling
```

---

## Gate final F-19.G - Smoke, docs e fechamento

**Objetivo**: confrontar os artefatos produzidos, atualizar a documentacao e preparar o PR.

### Step 119.G.1 - Revalidar OpenAPI e contrato

Com o mesmo `sep-api` integrado:

```bash
curl --fail --silent --show-error http://localhost:8080/v3/api-docs \
  --output /tmp/sep-api-f19-openapi-final.json
jq empty /tmp/sep-api-f19-openapi-final.json
SEP_OPENAPI_SCHEMA=/tmp/sep-api-f19-openapi-final.json npm run contract:check
```

O hash final deve ser igual ao usado nas collections ou a diferenca deve ser explicada e
revalidada. Comparar novamente metodo+path das duas collections com o recorte OpenAPI.

### Step 119.G.2 - Executar gate completo

```bash
cd <sep-app-root>
npm ci
npm run format:check
npm run contract:check
npm run lint
npm run lint:scss
npm run test
npm run test:coverage
npm run build
npm run e2e
npm audit --omit=dev
npm audit
git diff --check
git status --short --branch
git diff --stat
```

`npm audit` completo pode terminar nao zero somente para residuo de dev tooling aceito e
documentado no ADR/PR. Audit de runtime alto/critico nao pode ser aceito silenciosamente.

### Step 119.G.3 - Atualizar documentacao obrigatoria

- `sep-app/README.md`: manter como entrypoint coerente, sem baseline/comandos obsoletos.
- `docs-SEP/repos/sep-app/README.md`: versoes, contract check, audit e CI.
- `docs-SEP/AI-ROADMAP.md`: F-19 spec + steps + ADR 0018.
- `docs-SEP/repos/sep-app/SPRINT-F-19-PR.md`: descricao temporaria consolidada.
- No fechamento mergeado: atualizar PRD-FASE-4, `STATE.md` e apendar historico curto em
  `CONTEXT-PARTE-2.md`.

Nao marcar a visibilidade web de chaves Pix como entregue: a collection cobre o contrato, mas a
tela continua destinada a sprint propria pos-F-19.

### Step 119.G.4 - Checkpoint final pre-commit

Apresentar:

- arquivos criados/modificados/removidos em cada repo;
- matriz final de divergencias corrigidas e lacunas backend registradas;
- audit antes/depois por runtime/dev e advisories residuais;
- hash/commit do OpenAPI e paridade Postman/Insomnia;
- versoes finais, testes, coverage, build, E2E e resultado do CI local;
- decisao do ADR 0018 e follow-up correspondente;
- riscos/pendencias e mensagens de commit sugeridas por repo.

Criar `SPRINT-F-19-PR.md`, mas nao executar Git em `docs-SEP`. Push e PR permanecem manuais.

### Definicao de pronto do Gate F-19.G

- [ ] OpenAPI, tipos de borda e collections convergem para o mesmo contrato.
- [ ] Audit residual esta classificado e aprovado pelo ADR, sem risco runtime oculto.
- [ ] Suite e CI estao verdes em instalacao limpa.
- [ ] Docs e PR description refletem a baseline real.
- [ ] Chaves Pix web e Angular 22 efetivo continuam em destinos explicitos, sem falso fechamento.

---

## Definition of Done da F-Sprint 19

- [ ] Contratos consumidos pelo frontend foram comparados ao OpenAPI runtime identificado.
- [ ] Existe validacao automatizada e reproduzivel para as bordas em escopo.
- [ ] Divergencias reais do frontend foram corrigidas; lacunas backend foram registradas.
- [ ] Tooling seguro foi atualizado sem sair da baseline Angular 20/Node 20.
- [ ] `npm ci` funciona sem `--force` ou `--legacy-peer-deps`.
- [ ] Audit antes/depois separa runtime de dev tooling e nao oculta alta/critica de runtime.
- [ ] Postman e Insomnia cobrem credores, aporte/matching, owner-scoped, Pix e chaves conforme
      OpenAPI, sem segredo/PII/chave bruta.
- [ ] ADR 0018 decide adotar depois ou adiar Angular 22, sem executar a major nesta sprint.
- [ ] Format, contrato, lint, SCSS, testes, coverage, build e Playwright estao verdes.
- [ ] CI permanece deterministico e nao depende de backend remoto.
- [ ] READMEs, AI-ROADMAP e PR description foram atualizados.
- [ ] PRD, STATE e historico foram atualizados somente no fechamento mergeado.
