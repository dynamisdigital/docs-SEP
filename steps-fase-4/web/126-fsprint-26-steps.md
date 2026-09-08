# Steps - F-Sprint 26 - Consumir codigos de erro no web

**Spec de origem**:
[`126-fsprint-26-consumo-codigos-erro-web.md`](../../specs/fase-4/126-fsprint-26-consumo-codigos-erro-web.md)

**Status**: planejada; steps criados em 2026-09-08. Execucao bloqueada ate os gates abaixo serem
fechados.

**Por que estes steps precedem os da Sprint 37**: a
[`037`](../../specs/fase-4/037-sprint-37-normalizacao-taxonomia-erro.md) declara deliberadamente a
ordem `36 -> consumo -> 37`. A Sprint 36 publica valor utilizavel agora; os codigos excluidos
continuam fora do contrato e podem ser normalizados depois sem quebra. Antecipar a 37 seguraria o
primeiro ganho de produto atras de um ADR sem reduzir o custo dos renames.

**Objetivo geral**: fazer o `sep-app` consumir o campo opcional `codigo`, usar os tres codigos MFA
para discriminar o `400` do `verify-totp` e colocar o catalogo sob o gate de contrato, preservando o
corpo da API como fonte da mensagem.

**Natureza da sprint**: produto novo na superficie de contrato. Sem tela, endpoint, migration, regra
de negocio ou ADR novo.

**Dependencias obrigatorias**:

1. **Sprint 36 corrigida e integrada em `develop` do `sep-api`.** O code review de 2026-09-08 abriu
   finding P1: `ONB-400-004` foi publicado embora represente duas condicoes na mesma classe, e a
   particao confunde “classe dona” com “condicao”. A F-26 nao comeca enquanto esse finding nao estiver
   resolvido e a 36 nao estiver mergeada.
2. **F-Sprint 25 integrada no `sep-app`.** O `STATE.md` registra PR #136 em `develop` e #137 em
   `main`; o Gate reconfere por conteudo.
3. **`develop` do `sep-app` regularizado.** A varredura de 2026-09-02 encontrou tres commits diretos
   (`bf33e45`, `63248af`, `64b7b73`) que deixaram `format:check` vermelho. A decisao sobre eles e do
   responsavel pelo repo. Nao abrir a F-26 sobre uma baseline vermelha.

**Repo de implementacao**: `sep-app`.

**Repo apenas para leitura/contrato**: `sep-api`, na revisao integrada da Sprint 36. Nenhuma mudanca
de backend pertence a esta sprint.

**Branch sugerida**: `feature/fsprint-26-codigos-erro`, criada de `develop` atualizado e verde.

**Skills obrigatorias durante a implementacao**: `coding-guidelines` e `clean-code`, mais a skill de
testes por mutacao do web se estiver disponivel no ambiente de execucao.

---

## Decisoes da sprint

1. **Codigo escolhe o ramo; corpo continua escolhendo a frase.** O `message` da API permanece
   autoritativo onde ja era. Nao criar dicionario local de copy por codigo.
2. **Campo opcional na borda.** Backend antigo, proxy defeituoso ou handler sem taxonomia nao pode
   quebrar a tela. Valor ausente ou nao-string produz `undefined` e cai no comportamento legado.
3. **Escopo de consumo estreito.** Somente `MFA-400-002`, `MFA-400-003` e `MFA-400-004` passam a
   escolher ramo. Nao varrer os demais pontos que hoje ramificam por status.
4. **Mock precisa distinguir as tres causas.** Se todos os casos devolverem a mesma mensagem ou o
   mesmo codigo, o teste passa sem provar a discriminacao.
5. **Catalogo declarado deve ser exatamente o publicado pela 36 integrada.** Nao copiar os 87 do
   estado anterior ao review; o P1 pode alterar a contagem.
6. **Snapshot vem do runtime.** Nao editar OpenAPI manualmente. Registrar o diff legado de cerca de
   43 schemas separadamente do campo novo para que a mudanca da Sprint 36 permaneça revisavel.
7. **Nao corrigir os quatro pontos cegos do `contract-check.mjs` de passagem.** Se impedirem a Task
   126.3, parar e reportar; eles exigem sprint propria.
8. **Fallback de bloqueio nao promete tempo fixo.** Remover “30 minutos” sem inventar outra duracao;
   a politica e o `Retry-After` continuam sendo as fontes dinamicas.

---

## Protocolo obrigatorio por Task

1. Executar somente a Task liberada.
2. Reconferir toda ancora no codigo atual com `arquivo:linha`; os numeros da spec sao historicos.
3. Escrever o teste primeiro e ve-lo falhar pelo motivo esperado.
4. Aplicar a mutacao nomeada, confirmar no diff que ela realmente entrou, ver o teste reprovar e
   reverter. Mutacao que nao aplicou nao e prova; mutante sobrevivente significa teste incompleto.
5. Rodar os gates da Task com exit code explicito.
6. Parar em checkpoint pre-commit com status, diff, arquivos, testes, mutacoes, riscos e mensagem
   sugerida. Aguardar aprovacao antes de `git add`/`git commit`; usar paths especificos.
7. Fazer code review depois do commit aprovado. Finding confirmado gera hotfix e novo checkpoint.
8. Aguardar revisao manual e autorizacao antes da Task seguinte.
9. Push e PR sao manuais. Git do `docs-SEP` tambem e manual.

---

## Rastreabilidade spec 126 -> steps

| Item da spec | Steps |
|---|---|
| `codigo?` em `ApiErrorResponse` e snapshot runtime | 126.1 |
| `codigoDeErroDaApi()` | 126.2 |
| Catalogo no contrato e gate | 126.3 |
| Discriminacao do `verify-totp` | 126.4 |
| Fallback sem tempo fixo | 126.5 |
| Campanha de mutacao | 126.6 |
| Integracoes, baseline, mock e riscos | Gate F-26.0 e fechamento |

---

## Ordem de execucao

```text
Gate F-26.0  resolver bloqueios, integrar contratos e medir baseline
  -> 126.1   atualizar borda e snapshot OpenAPI
  -> 126.2   criar extrator defensivo de codigo
  -> 126.3   declarar e gatear o catalogo publicado
  -> 126.4   discriminar o 400 do verify-totp
  -> 126.5   remover tempo fixo do fallback de bloqueio
  -> 126.6   campanha final de mutacao e regressao
Fechamento   gates completos, smoke e documentacao
```

---

## Gate F-26.0 - Integracao, baseline e contrato real

### Step 126.0.1 - Fechar os bloqueios externos da sprint

Antes de tocar no `sep-app`, confirmar:

- finding P1 do review da Sprint 36 resolvido, com teste que distingue condicoes dentro da mesma
  classe ou exclusao conservadora dos codigos afetados;
- Sprint 36 integrada em `origin/develop` do `sep-api`;
- `MFA-400-002`, `MFA-400-003` e `MFA-400-004` ainda publicados no OpenAPI runtime;
- F-Sprint 25 presente em `origin/develop` do `sep-app`;
- decisao humana aplicada aos tres commits diretos de 2026-08-26 no `sep-app`.

Se qualquer item falhar, parar. Criar steps nao autoriza resolver merge, descartar commits de outro
autor ou alterar a Sprint 36.

### Step 126.0.2 - Sincronizar e criar a branch

No `sep-app`:

```bash
git fetch origin
git switch develop
git pull --ff-only
git diff --stat origin/main origin/develop
git status --short --branch
git switch -c feature/fsprint-26-codigos-erro
```

`develop` e `main` podem divergir somente por mudanca conhecida, aprovada e registrada. Divergencia
sem explicacao interrompe o Gate.

### Step 126.0.3 - Medir todos os gates antes da implementacao

```bash
npm ci; echo "EXIT=$?"
npm test -- --run; echo "EXIT=$?"
npm run e2e; echo "EXIT=$?"
npm run lint; echo "EXIT=$?"
npm run lint:scss; echo "EXIT=$?"
npm run format:check; echo "EXIT=$?"
npm run build; echo "EXIT=$?"
npm run audit; echo "EXIT=$?"
npm run contract:check; echo "EXIT=$?"
```

Registrar testes/arquivos do Vitest, testes/specs do Playwright, operacoes/lacunas do contrato e
contagem do audit. Nenhum gate vermelho e baseline aceitavel. Em especial, `format:check` vermelho
por causa dos commits diretos nao pode ser absorvido pela F-26.

### Step 126.0.4 - Exportar e medir o OpenAPI integrado da Sprint 36

Subir o `sep-api` na revisao integrada da 36, perfil `dev`, e exportar `/v3/api-docs` para arquivo
temporario. Conferir:

- campo opcional `codigo` no schema de erro;
- enum publicado e contagem atual;
- presenca dos tres MFA;
- ausencia de `ONB-400-004`, caso esse tenha sido o desfecho do P1;
- OpenAPI 3.1, descricoes, exemplos e `securitySchemes` preservados.

Comparar o documento com `contracts/openapi.snapshot.json` e separar no registro:

1. diff funcional da Sprint 36 (`codigo` e enum);
2. diff de fidelidade acumulado dos schemas anteriores.

### Step 126.0.5 - Reconferir as ancoras web

Conferir no estado atual:

- forma de `ApiErrorResponse`;
- contratos de `mensagemDeErroDaApi()` e `mensagemBrutaDaApi()`;
- ramo atual do `verify-totp` para `400`, `423`, `429`, `5xx` e rede;
- mock MSW do fluxo TOTP e como seleciona cada resposta;
- `CONTA_BLOQUEADA_FALLBACK` e todos os seus consumidores;
- formato de `consumed-contracts.json`, `knownGaps` e algoritmo atual do `contract:check.mjs`.

### Definicao de pronto do Gate F-26.0

- [ ] P1 da Sprint 36 resolvido e branch integrada no backend.
- [ ] F-25 presente e `develop` do web regularizado.
- [ ] Branch criada de baseline limpa e conhecida.
- [ ] Todos os gates iniciais verdes e contagens registradas.
- [ ] OpenAPI runtime exportado e diff separado por natureza.
- [ ] Tres MFA confirmados no catalogo real.
- [ ] Ancoras web reconferidas antes de qualquer codigo.

---

## Task 126.1 - Atualizar a borda e o snapshot OpenAPI

**Objetivo**: representar `codigo` como opcional no tipo do cliente e versionar o contrato real da
Sprint 36.

**Pre-requisito**: Gate F-26.0 aprovado.

**Arquivos esperados**: `core/api/api.models.ts`, `contracts/openapi.snapshot.json` e testes de
contrato existentes.

### Step 126.1.1 - Adicionar o campo opcional

Adicionar `codigo?: string` a `ApiErrorResponse`. Nao usar union com `null`: o backend omite a
propriedade quando nao ha codigo. Nao tornar o campo obrigatorio enquanto handlers sem taxonomia
existirem.

### Step 126.1.2 - Renovar o snapshot pelo runtime

Substituir o snapshot pelo documento exportado no Gate. Nao formatar ou editar manualmente o JSON.
Revisar o diff e registrar separadamente o campo/enum novo e as mudancas de fidelidade acumuladas.

### Mutacoes obrigatorias

- tornar `codigo` obrigatorio: o gate de contrato ou teste de tipo precisa reprovar;
- trocar o tipo para `number`: o gate precisa reprovar;
- remover `codigo` do snapshot: o contrato precisa reprovar depois da Task 126.3; registrar agora a
  falha esperada se o check ainda estiver cego.

### Verificacao da Task 126.1

```bash
npm test -- --run; echo "EXIT=$?"
npm run format:check; echo "EXIT=$?"
npm run build; echo "EXIT=$?"
```

### Definicao de pronto da Task 126.1

- [ ] Tipo representa ausencia sem `null`.
- [ ] Snapshot vem do runtime integrado da 36.
- [ ] Diff funcional e diff acumulado estao distinguidos no checkpoint.
- [ ] Nenhuma mudanca manual foi misturada ao snapshot.

### Commit sugerido

```text
feat(api): declarar codigo opcional no corpo de erro
```

---

## Task 126.2 - Extrair codigo defensivamente

**Objetivo**: centralizar a leitura segura do valor desconhecido recebido pela camada HTTP.

**Pre-requisito**: Task 126.1 concluida e aprovada.

**Arquivos esperados**: `core/api/api-error.ts` e seu teste.

### Step 126.2.1 - Escrever a matriz do helper

Cobrir:

- `HttpErrorResponse` cujo corpo tem `codigo` string nao vazia;
- campo ausente;
- `null`, numero, booleano, objeto e array;
- string vazia ou apenas espacos;
- erro sem corpo e valor que nao seja `HttpErrorResponse`.

Resultado seguro: codigo normalizado ou `undefined`, sem lancar.

### Step 126.2.2 - Implementar junto dos helpers irmaos

Criar `codigoDeErroDaApi()` no mesmo nivel de abstracao de `mensagemDeErroDaApi()` e
`mensagemBrutaDaApi()`. Tratar `err.error` como `unknown`; checar estrutura e `typeof` antes de
`trim()`. Nao validar o codigo contra catalogo local aqui: cliente deve tolerar codigo futuro.

### Mutacoes obrigatorias

- remover a guarda de `typeof`: o caso numerico reprova sem deixar excecao escapar;
- aceitar string vazia: o caso de espacos reprova;
- acessar `err.error.codigo` sem validar corpo: casos sem corpo reprovam.

### Verificacao da Task 126.2

```bash
npm test -- --run; echo "EXIT=$?"
npm run lint; echo "EXIT=$?"
npm run format:check; echo "EXIT=$?"
```

### Definicao de pronto da Task 126.2

- [ ] Helper devolve string valida ou `undefined`.
- [ ] Corpo legado sem codigo continua funcionando.
- [ ] Codigo nao-string nunca lanca.
- [ ] Tres mutacoes foram vistas falhar e revertidas.

### Commit sugerido

```text
feat(api): extrair codigo de erro com seguranca
```

---

## Task 126.3 - Gatear o catalogo no contrato consumido

**Objetivo**: fazer `contract:check` reprovar quando o web declarar codigo que o backend nao publica
ou quando o campo deixar de existir.

**Pre-requisito**: Task 126.2 concluida e aprovada.

**Arquivos esperados**: `contracts/consumed-contracts.json`, `scripts/contract-check.mjs` apenas se a
estrutura atual ja suportar o item sem corrigir ponto cego fora de escopo, e testes do check.

### Step 126.3.1 - Modelar somente o que o web consome

Declarar `codigo?: string` no corpo de erro e os tres valores MFA usados pela Task 126.4. Nao copiar
todo o enum publicado como se o web consumisse todos os valores.

Separar duas garantias:

- o campo existe, e e opcional/string;
- os tres valores consumidos pertencem ao enum documentado.

### Step 126.3.2 - Provar que o gate morde

Executar mutacoes independentes no snapshot/contrato:

- remover a propriedade `codigo` do OpenAPI;
- retirar um dos tres MFA do enum;
- declarar no consumo um codigo excluido;
- tornar o campo obrigatorio apenas de um lado.

Cada mutacao relevante deve fazer `contract:check` sair diferente de zero. Se o algoritmo atual nao
conseguir expressar essas verificacoes sem corrigir um dos quatro pontos cegos da F-24, parar e
reportar antes de alterar `contract-check.mjs`.

### Verificacao da Task 126.3

```bash
npm run contract:check; echo "EXIT=$?"
npm test -- --run; echo "EXIT=$?"
npm run format:check; echo "EXIT=$?"
```

### Definicao de pronto da Task 126.3

- [ ] Apenas o campo e os tres codigos realmente consumidos foram declarados.
- [ ] `contract:check` fecha em zero lacunas na arvore correta.
- [ ] Quatro mutacoes foram testadas; qualquer limite do check foi reportado, nao escondido.
- [ ] Nenhum codigo excluido pela 36 foi convertido em `knownGap` artificial.

### Commit sugerido

```text
test(contracts): gatear codigos de erro consumidos
```

---

## Task 126.4 - Discriminar o `400` do `verify-totp`

**Objetivo**: substituir a decisao baseada apenas em status por decisao estrutural nos tres casos MFA.

**Pre-requisito**: Task 126.3 concluida e aprovada.

**Arquivos esperados**: `verify-totp.component.ts`, teste do componente e handlers MSW do fluxo.

### Step 126.4.1 - Tornar as tres respostas observaveis no mock

Preparar cenarios independentes para:

- `MFA-400-002`: codigo TOTP ausente/incorreto;
- `MFA-400-003`: MFA nao habilitado;
- `MFA-400-004`: challenge invalido/expirado.

Cada resposta deve ter codigo e mensagem distintos. Preservar um cenario `400` sem codigo para
compatibilidade com backend antigo.

### Step 126.4.2 - Testar ramo e frase separadamente

Para cada codigo, provar:

- o ramo/estado de UI escolhido;
- a mensagem exibida vem do corpo quando utilizavel;
- fallback local entra apenas quando a mensagem do corpo e ausente/inutilizavel;
- codigo desconhecido ou ausente cai no comportamento legado por status;
- `423`, `429`, `5xx` e rede continuam com os tratamentos existentes.

### Step 126.4.3 - Implementar o menor switch por codigo

Extrair uma vez com `codigoDeErroDaApi()` e ramificar somente dentro do tratamento do `400`. Nao
criar catalogo de copy nem migrar outros status. Codigo desconhecido deve cair no ramo legado.

### Mutacoes obrigatorias

- voltar a decidir somente por status: os tres cenarios deixam de ser distinguiveis e reprovam;
- trocar dois codigos entre ramos: ambos os testes reprovam;
- trocar origem da frase do corpo para literal: teste da mensagem reprova;
- remover fallback sem codigo: compatibilidade legada reprova.

### Verificacao da Task 126.4

```bash
npm test -- --run; echo "EXIT=$?"
npm run lint; echo "EXIT=$?"
npm run format:check; echo "EXIT=$?"
```

### Definicao de pronto da Task 126.4

- [ ] Tres codigos produzem desfechos verificavelmente distintos.
- [ ] Corpo escolhe a frase; codigo escolhe o ramo.
- [ ] Codigo ausente/desconhecido preserva comportamento legado.
- [ ] Demais categorias de erro nao regrediram.
- [ ] Quatro mutacoes foram mortas e revertidas.

### Commit sugerido

```text
feat(auth): discriminar falhas TOTP por codigo de erro
```

---

## Task 126.5 - Remover duracao fixa do fallback de bloqueio

**Objetivo**: impedir que a copy local contradiga a politica configurada ou o `Retry-After`.

**Pre-requisito**: Task 126.4 concluida e aprovada.

**Arquivos esperados**: `features/public/login/copy-de-erro.ts` e testes dos consumidores.

### Step 126.5.1 - Mapear os consumidores antes de alterar

Listar todos os usos de `CONTA_BLOQUEADA_FALLBACK` e confirmar quais superficies exibem a frase.
Conferir que nenhuma extrai numero do texto.

### Step 126.5.2 - Tornar a frase atemporal

Substituir “30 minutos” por texto que comunique bloqueio temporario e tentativa posterior sem afirmar
duracao. Nao inventar prazo, configuracao nem regra de pluralizacao.

### Mutacao obrigatoria

Restaurar temporariamente “30 minutos”: os testes dos consumidores devem reprovar.

### Verificacao da Task 126.5

```bash
npm test -- --run; echo "EXIT=$?"
npm run lint; echo "EXIT=$?"
npm run format:check; echo "EXIT=$?"
```

### Definicao de pronto da Task 126.5

- [ ] Todos os consumidores foram identificados e cobertos.
- [ ] Nenhuma duracao fixa permanece no fallback.
- [ ] Mutacao foi vista falhar e revertida.

### Commit sugerido

```text
fix(auth): remover duracao fixa do fallback de bloqueio
```

---

## Task 126.6 - Campanha final de mutacao e regressao

**Objetivo**: provar o contrato completo sobre o estado final da sprint.

**Pre-requisito**: Task 126.5 concluida e aprovada.

### Step 126.6.1 - Reaplicar as mutacoes criticas

No minimo:

1. remover `codigo` do tipo;
2. aceitar codigo numerico no helper;
3. retirar um MFA do contrato consumido;
4. voltar o `verify-totp` para status apenas;
5. trocar dois codigos entre ramos;
6. trocar mensagem do corpo por literal;
7. remover fallback para corpo sem codigo;
8. restaurar “30 minutos”.

Confirmar a aplicacao de cada mutacao pelo diff antes do teste. Registrar mutacao, teste que a matou
e exit code. Nenhum sobrevivente pode ser aceito sem analise de equivalencia documentada.

### Step 126.6.2 - Rodar regressao completa

```bash
npm test -- --run; echo "EXIT=$?"
npm run e2e; echo "EXIT=$?"
npm run contract:check; echo "EXIT=$?"
npm run lint; echo "EXIT=$?"
npm run lint:scss; echo "EXIT=$?"
npm run format:check; echo "EXIT=$?"
npm run build; echo "EXIT=$?"
npm run audit; echo "EXIT=$?"
```

### Definicao de pronto da Task 126.6

- [ ] Oito mutacoes aplicadas, verificadas, mortas e revertidas.
- [ ] Vitest e Playwright >= baseline, com zero falhas.
- [ ] Contrato em zero lacunas e catalogo consumido protegido.
- [ ] Lint, SCSS, formato, build e audit verdes.

### Commit sugerido

```text
test(auth): travar consumo dos codigos de erro
```

---

## Fechamento da F-Sprint 26

### Gate funcional

- [ ] `ApiErrorResponse.codigo` e opcional.
- [ ] Helper aceita somente string nao vazia e nunca lanca para corpo malformado.
- [ ] Tres codigos MFA escolhem ramos distintos no `verify-totp`.
- [ ] Mensagem continua vindo do corpo quando autoritativa.
- [ ] Codigo ausente ou desconhecido preserva tratamento legado.
- [ ] Fallback de conta bloqueada nao contem duracao fixa.

### Gate de contrato

- [ ] Snapshot foi exportado do runtime integrado da Sprint 36.
- [ ] Campo e tres valores consumidos estao declarados.
- [ ] `contract:check` reprova quando campo/valor desaparece e fecha com zero lacunas.
- [ ] Contagem de operacoes comparada com a baseline; qualquer variacao explicada.
- [ ] Nenhum codigo excluido pela Sprint 36 foi declarado ou transformado em `knownGap`.

### Gates tecnicos

```bash
npm test -- --run; echo "EXIT=$?"
npm run e2e; echo "EXIT=$?"
npm run contract:check; echo "EXIT=$?"
npm run lint; echo "EXIT=$?"
npm run lint:scss; echo "EXIT=$?"
npm run format:check; echo "EXIT=$?"
npm run build; echo "EXIT=$?"
npm run audit; echo "EXIT=$?"
```

- [ ] Contagens finais >= baseline, com zero falhas.
- [ ] Campanha de mutacao registrada, sem mutante real sobrevivente.
- [ ] Smoke real contra `:8080` executado; se ambiente impedir, pendencia declarada sem simulacao.

### Documentacao e entrega

- [ ] Spec 126 atualizada com baseline e desvios medidos.
- [ ] `STATE.md`, `PRD-FASE-4.md`, `CONTEXT-PARTE-2.md`, indices e docs operacionais atualizados no
      fechamento.
- [ ] `repos/sep-app/SPRINT-F-26-PR.md` criado com resumo, test plan, contrato, mutacoes, riscos,
      pendencias e commits.
- [ ] Descricao temporaria da F-Sprint anterior removida no inicio da implementacao, se ainda existir
      e ja tiver sido usada no PR.
- [ ] Checkpoint final apresentado antes de qualquer commit.

### Ordem depois desta sprint

Com a F-26 integrada, a M-Sprint 18 pode seguir independentemente. A Sprint 37 continua sendo o
proximo backend da cadeia: decide via ADR a convencao dos codigos excluidos e os normaliza antes de
uma segunda rodada de publicacao.

### Mensagem sugerida para o commit final de documentacao

```text
docs(contratos): fechar consumo web dos codigos de erro
```
