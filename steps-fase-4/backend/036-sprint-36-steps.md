# Steps - Sprint 36 - Publicar codigos de erro no fio

**Spec de origem**:
[`036-sprint-36-codigos-erro-no-fio.md`](../../specs/fase-4/036-sprint-36-codigos-erro-no-fio.md)

**Status**: planejada; steps criados em 2026-09-08. Nenhuma implementacao iniciada.

**Objetivo geral**: fazer o subconjunto apto da taxonomia de erros atravessar a fronteira HTTP por
meio do campo opcional `codigo`, publicar esse subconjunto no OpenAPI e registrar, sem sobra, cada
codigo que permanecer fora do contrato.

**Natureza da sprint**: produto novo na superficie de contrato. Nao cria endpoint, regra de negocio,
evento, provider, migration nem ADR.

**Dependencia**: Sprint 35 integrada em `develop`. O [`STATE.md`](../../docs-sep/STATE.md) registra
que ela foi mergeada em `develop` e `main` em 2026-09-02, preservou
`ContaBloqueadaException.CODIGO`/`getCodigo()` e deixou 17 handlers no
`ApiExceptionHandler`. O Gate 36.0 deve conferir esses fatos no checkout atual.

**Desbloqueia**:

- [`126`](../../specs/fase-4/126-fsprint-26-consumo-codigos-erro-web.md), F-Sprint 26;
- [`218`](../../specs/fase-4/218-msprint-18-consumo-codigos-erro-mobile.md), M-Sprint 18;
- [`037`](../../specs/fase-4/037-sprint-37-normalizacao-taxonomia-erro.md), que decide e normaliza o
  que esta sprint deixar fora do perimetro.

**Repo de implementacao**: `sep-api`.

**Docs de destino**: este step, a spec 036, o catalogo operacional em
[`CONTRATOS.md`](../../repos/sep-api/CONTRATOS.md), os indices afetados e a descricao temporaria
`repos/sep-api/SPRINT-36-PR.md`. Git do `docs-SEP` permanece manual.

**Branch sugerida**: `feature/sprint-36-codigos-erro`, criada de `develop` atualizado.

**Skills obrigatorias durante a implementacao**: `coding-guidelines`, `clean-code` e
`design-patterns-java`.

---

## Decisoes da sprint

1. **O Gate mede o fenomeno por duas vias.** A varredura deve encontrar tanto literais com forma de
   codigo quanto constantes candidatas por nome. Uma regex isolada ja deixou dezenas de itens fora
   da medicao que originou a spec.
2. **Existe uma unica fonte machine-readable para o catalogo publicado.** OpenAPI, testes e
   documentacao nao podem manter listas independentes sujeitas a divergencia. O Gate identifica o
   mecanismo mais simples compativel com a estrutura atual; a Task 36.5 o implementa.
3. **O campo e opcional por contrato e por serializacao.** Handler sem codigo continua entregando o
   corpo atual, sem `codigo: null`. Compatibilidade regressiva faz parte da entrega.
4. **Publicar menos e aceitavel; publicar identificador ambiguo nao e.** Um codigo so entra no
   catalogo se for canonico (`MOD-STATUS-NNN`), nao colidir e for alcancavel no fluxo real ate o
   `build()`.
5. **Exclusao e dado de aceite.** Todo codigo nao publicado aparece uma unica vez no inventario, com
   origem e motivo: `colisao`, `formato` ou `inalcancavel`.
6. **Nao mudar visibilidade de passagem.** Se um codigo `private` impedir a comprovacao ou a fonte
   unica do catalogo, parar a Task e reportar. A spec exclui esse alargamento de escopo.
7. **Nao inventar codigo para handler sem taxonomia.** A lacuna e medida e documentada; nao e
   preenchida nesta sprint.
8. **O contrato OpenAPI e global, nao anotacao repetida por endpoint.** A Sprint 35 demonstrou que
   `OperationCustomizer` pode publicar comportamento transversal. O Gate 36.0 deve comparar esse
   caminho com a modelagem no schema comum de erro. Preferir a menor solucao global que mantenha
   `codigo` e seu catalogo no ponto unico; anotacao operacao a operacao exige evidencia de que os
   dois caminhos globais nao atendem.
9. **`codigo` e `Retry-After` sao independentes.** O `423` precisa provar os dois separadamente: uma
   regressao em um nao pode ser mascarada pelo teste do outro.

---

## Protocolo obrigatorio por Task

1. Executar somente a Task liberada; nao adiantar a seguinte.
2. Conferir toda ancora no checkout atual e registrar `arquivo:linha`; este documento nao substitui
   a medicao.
3. Escrever primeiro o teste que descreve o comportamento e ve-lo falhar pelo motivo esperado.
4. Para cada comportamento novo, aplicar a mutacao nomeada, ver o teste reprovar e reverter a
   mutacao. Teste que sobrevive nao entrega o comportamento.
5. Rodar a verificacao da Task com `EXIT=$?` explicito. Nao validar comando por pipeline que esconda
   o exit code.
6. **PAUSA #1 — checkpoint pre-commit**: informar status, diff, arquivos tocados, gates executados,
   resultado, mutacoes, riscos, pendencias e mensagem de commit sugerida. Aguardar aprovacao antes
   de `git add` e `git commit`; usar paths especificos, nunca `git add -A`.
7. Depois do commit aprovado, executar um code review. Findings confirmados geram hotfix, nova pausa
   pre-commit e commit proprio; nao iniciar a Task seguinte com finding aberto.
8. **PAUSA #2 — fim da Task**: aguardar revisao manual e autorizacao explicita para continuar.
9. Push e PR sao manuais. Operacoes Git no `docs-SEP` tambem sao manuais.

---

## Rastreabilidade spec 036 -> steps

| Item da spec | Steps |
|---|---|
| `codigo` opcional em `ErrorResponseDto` | 36.1 |
| Propagacao no ponto unico de montagem | 36.2 |
| Normalizacao de `CTR-422-CCB-001` | 36.3 |
| `AUTH-423-001` no `423` e desfecho dos dois `BOF-*` | 36.4 |
| Catalogo do subconjunto apto no OpenAPI | 36.5 |
| Regressao por subtipo e mutacao | 36.6 |
| Catalogo operacional e lista completa de excluidos | 36.7 |
| Baseline, inventario, particao e lacunas | Gate 36.0 e fechamento |

---

## Ordem de execucao

```text
Gate 36.0  medir baseline, taxonomia, handlers e caminhos OpenAPI
  -> 36.1  adicionar o campo opcional e preservar o JSON legado
  -> 36.2  propagar DomainException pelo build() e cobrir os 5 subtipos
  -> 36.3  normalizar CTR-422-CCB-001 dentro do perimetro
  -> 36.4  publicar AUTH-423-001 e decidir os dois BOF-* orfaos
  -> 36.5  publicar a fonte unica do catalogo no OpenAPI
  -> 36.6  consolidar a matriz de regressao e matar mutacoes
  -> 36.7  documentar publicados, excluidos e handlers sem codigo
Fechamento  provar particao, contrato, gates e compatibilidade
```

A ordem e deliberada: a fonte do corpo nasce antes da propagacao; todos os caminhos runtime ficam
estaveis antes de o catalogo virar contrato; a documentacao so fecha depois de a particao poder ser
gerada e conferida contra o resultado real.

---

## Gate 36.0 - Precheck, baseline e perimetro

### Step 036.0.1 - Confirmar integracao e criar a branch

No `sep-api`:

```bash
git fetch origin
git switch develop
git pull --ff-only
git diff --stat origin/main origin/develop
git status --short --branch
git switch -c feature/sprint-36-codigos-erro
```

Esperado pelo registro de 2026-09-02: `develop` e `main` equivalentes por conteudo, arvore limpa e
Sprint 35 presente. Se houver divergencia de conteudo, alteracao local ou ausencia da Sprint 35,
parar antes de criar/alterar codigo e reportar.

### Step 036.0.2 - Medir a baseline

```bash
./gradlew clean build; echo "EXIT=$?"
./gradlew spotlessCheck; echo "EXIT=$?"
```

Registrar total de testes, falhas e classes. O ultimo registro e 2262 testes / 0 falhas / 363
classes, mas somente o resultado deste Gate vale como baseline da Sprint 36.

### Step 036.0.3 - Conferir as ancoras estruturais

Conferir e registrar:

- forma atual de `ErrorResponseDto`, inclusive `@JsonInclude`;
- todos os pontos que constroem `ErrorResponseDto` e se `build()` continua sendo o unico;
- quantidade e lista dos `@ExceptionHandler` de `ApiExceptionHandler` — esperado: 17;
- cinco subclasses seladas atuais de `DomainException` e o `switch` que as trata;
- preservacao de `ContaBloqueadaException.CODIGO` e `getCodigo()`;
- os tres orfaos descritos na spec: `AUTH-423-001`, `BOF-429-001` e `BOF-400-002`;
- montagem do `423` e preservacao do `Retry-After` depois do helper comum;
- configuracao OpenAPI atual, incluindo o `OperationCustomizer` usado pela Sprint 35.

Qualquer divergencia muda o desenho antes da Task 36.1. Nao adaptar silenciosamente.

### Step 036.0.4 - Inventariar a taxonomia por duas vias

Produzir um artefato temporario e reproduzivel contendo, por definicao candidata:

```text
codigo | constante | visibilidade | classe | modulo | excecao | handler | status | alcance-runtime
```

Usar duas buscas e unir/deduplicar os resultados:

1. literais que parecem codigo de erro, sem exigir o formato canonico;
2. constantes cujo nome indica codigo, sem exigir que o valor passe pela regex.

Para cada valor, registrar todas as definicoes. Nao colapsar duplicatas antes de classifica-las: a
duplicidade e justamente a evidencia de colisao ou deduplicacao futura.

### Step 036.0.5 - Classificar publicado ou excluido

Aplicar os tres criterios da spec a cada codigo unico:

- formato canonico `^[A-Z]{3,4}-[0-9]{3}-[0-9]{3}$`;
- uma unica condicao identificada pelo valor;
- caminho runtime comprovado da excecao ate o ponto comum de montagem do corpo.

Gerar duas listas disjuntas:

- `publicados`: satisfaz os tres criterios;
- `excluidos`: falha em um ou mais, com motivo primario `colisao`, `formato` ou `inalcancavel` e
  observacao quando houver mais de uma causa.

`CTR-422-CCB-001` deve ser avaliado como caso reservado para a Task 36.3, nao descartado sem
decisao. Os codigos `PIX-*` de convencao semantica permanecem fora ate a Sprint 37 decidir a
convencao. Confirmar que `MFA-400-002`, `MFA-400-003` e `MFA-400-004` entram em `publicados`; se
qualquer um nao entrar, parar e reportar porque a F-Sprint 26 perde seu caso de uso declarado.

### Step 036.0.6 - Escolher como o catalogo chega ao OpenAPI

Fazer uma prova minima contra o documento runtime e comparar:

1. schema comum de `ErrorResponseDto`, com `codigo` referenciando uma fonte unica do catalogo;
2. customizacao global do OpenAPI, aproveitando o precedente da Sprint 35.

Escolher o mecanismo que:

- publica a lista uma unica vez em `components`;
- associa o campo `codigo` a essa lista sem anotacoes repetidas por endpoint;
- preserva descricoes, exemplos, `securitySchemes` e OpenAPI 3.1;
- permite ao teste comparar a fonte runtime e o documento gerado;
- nao exige mudar a visibilidade dos 12 codigos `private` apenas para montar o catalogo.

Se nenhum dos dois satisfizer, parar e reportar. Nao cair automaticamente em anotacao por endpoint.

### Step 036.0.7 - Fixar as contagens do Gate

Registrar no checkpoint:

- total de definicoes candidatas e total de valores unicos;
- prefixos encontrados;
- codigos canonicos, nao canonicos e duplicados;
- publicados e excluidos por motivo;
- codigos `private`;
- handlers com e sem codigo;
- cinco subclasses seladas atuais;
- decisao OpenAPI do Step 036.0.6.

Atualizar as contagens historicas da spec 036 antes da primeira Task, sem reescrever a decisao de
perimetro. Este e ajuste documental da propria sprint, nao alteracao de escopo.

### Definicao de pronto do Gate 36.0

- [ ] Integracao, arvore e branch conferidas.
- [ ] Baseline registrada com exit codes explicitos.
- [ ] Ancoras estruturais conferidas no checkout atual.
- [ ] Inventario reproduzivel gerado pelas duas vias, sem depender de numero historico.
- [ ] Todo codigo classificado provisoriamente em publicado ou excluido.
- [ ] Os tres codigos MFA necessarios a F-26 estao no subconjunto publicavel, ou o bloqueio foi
      reportado.
- [ ] Caminho global de publicacao no OpenAPI escolhido com prova minima.
- [ ] Contagens da spec atualizadas.
- [ ] Nenhum arquivo de producao alterado antes da aprovacao do Gate.

---

## Task 36.1 - Campo opcional no corpo de erro

**Objetivo**: criar lugar para o codigo sem mudar o JSON dos handlers que nao o possuem.

**Pre-requisito**: Gate 36.0 aprovado.

**Arquivos esperados**: `ErrorResponseDto.java` e testes do contrato/serializacao.

### Step 036.1.1 - Escrever os testes de contrato primeiro

Cobrir duas formas do DTO:

- com codigo: o JSON contem `codigo` com o valor fornecido;
- sem codigo: o JSON continua valido e **nao** contem a propriedade `codigo`.

O segundo teste deve inspecionar a serializacao, nao apenas o valor Java.

### Step 036.1.2 - Adicionar `codigo` opcional

Adicionar o campo ao record preservando nomes, tipos e semantica dos seis campos existentes. Usar o
mecanismo `NON_NULL` ja presente; nao criar serializer proprio.

Atualizar as construcoes existentes pelo caminho mais localizado possivel. Nesta Task elas continuam
sem codigo; a propagacao pertence a 36.2.

### Mutacoes obrigatorias

- remover/ignorar o campo quando preenchido: o teste do JSON com codigo reprova;
- forcar `codigo: null` no JSON legado: o teste de ausencia reprova.

### Verificacao da Task 36.1

```bash
./gradlew test; echo "EXIT=$?"
./gradlew spotlessCheck; echo "EXIT=$?"
```

### Definicao de pronto da Task 36.1

- [ ] O DTO aceita codigo sem alterar os campos existentes.
- [ ] Corpo sem codigo omite a propriedade no JSON.
- [ ] As duas mutacoes foram vistas falhar e revertidas.
- [ ] Nenhum handler passou a emitir codigo ainda.

### Commit sugerido

```text
feat(shared): adicionar codigo opcional ao corpo de erro
```

---

## Task 36.2 - Propagar codigo de `DomainException`

**Objetivo**: fazer cada uma das cinco subclasses seladas emitir seu proprio codigo pelo ponto unico
de montagem.

**Pre-requisito**: Task 36.1 concluida e aprovada.

**Arquivos esperados**: `ApiExceptionHandler.java`, testes unitarios e/ou de integracao do handler.

### Step 036.2.1 - Teste exaustivo por subtipo

Criar uma matriz explicita com as cinco subclasses medidas no Gate. Para cada subtipo, provocar o
handler real e verificar juntos:

- status esperado;
- `codigo` exato daquela excecao;
- demais campos padronizados, incluindo `traceId` quando o fixture atual o suporta.

Nao derivar o valor esperado do proprio `getCodigo()`: isso faria uma implementacao que devolve o
codigo errado concordar com o teste.

### Step 036.2.2 - Propagar pelo ponto unico

Fazer `handleDomain` levar o codigo da excecao ate `build()`, mantendo o switch selado exaustivo e
sem duplicar a montagem do DTO em cada ramo. Preservar os chamadores sem codigo.

Se a assinatura do helper precisar evoluir, preferir uma forma explicita que nao force `null` em
todos os call sites nem espalhe overloads sem semantica.

### Mutacoes obrigatorias

- remover a propagacao no `build()`: a matriz reprova;
- substituir `ex.getCodigo()` por um literal fixo: ao menos quatro casos reprovam;
- trocar o codigo entre dois subtipos: os dois casos correspondentes reprovam.

### Verificacao da Task 36.2

```bash
./gradlew test; echo "EXIT=$?"
./gradlew spotlessCheck; echo "EXIT=$?"
```

### Definicao de pronto da Task 36.2

- [ ] As cinco subclasses medidas no Gate aparecem individualmente no teste.
- [ ] Cada uma emite seu codigo exato e status esperado.
- [ ] Handlers sem codigo continuam omitindo o campo.
- [ ] As tres mutacoes foram vistas falhar e revertidas.

### Commit sugerido

```text
feat(shared): propagar codigos das excecoes de dominio
```

---

## Task 36.3 - Normalizar o codigo CCB publicavel

**Objetivo**: corrigir `CTR-422-CCB-001`, unica forma nao canonica que a spec admite trazer para o
subconjunto publicado nesta sprint.

**Pre-requisito**: Task 36.2 concluida e aprovada; Gate confirmou que nao ha colisao no destino.

**Arquivos esperados**: excecao dona do codigo e testes que exercitam seu caminho HTTP.

### Step 036.3.1 - Definir o destino sem colisao

Antes de editar, usar o inventario para escolher o proximo identificador canonico livre dentro de
`CTR-422-NNN`. Registrar o valor anterior, o novo, a condicao representada e a prova de que o destino
nao existe.

Se escolher o numero exigir reorganizar outros codigos ou decidir uma faixa nova, parar: isso pertence
a Sprint 37 e ao ADR previsto por ela.

### Step 036.3.2 - Alterar constante e expectativa externa

Trocar a definicao em um unico ponto e atualizar somente testes/documentos que afirmem o valor. Nao
renomear classes, mensagens ou regras adjacentes.

### Step 036.3.3 - Provar o caminho HTTP

O teste deve chegar ao corpo serializado e verificar o novo codigo. Um teste apenas da constante nao
prova que ela atravessa o fio.

### Mutacao obrigatoria

Restaurar temporariamente `CTR-422-CCB-001`: o teste HTTP e a validacao do catalogo devem reprovar.

### Verificacao da Task 36.3

```bash
./gradlew test; echo "EXIT=$?"
./gradlew spotlessCheck; echo "EXIT=$?"
```

### Definicao de pronto da Task 36.3

- [ ] Novo codigo e canonico e nao colide.
- [ ] O valor antigo nao aparece em fonte de producao.
- [ ] Caminho HTTP emite o valor novo.
- [ ] Mutacao foi vista falhar e revertida.

### Commit sugerido

```text
fix(contratos): normalizar codigo de erro da CCB
```

---

## Task 36.4 - Codigos orfaos fora de `DomainException`

**Objetivo**: publicar `AUTH-423-001` preservando `Retry-After` e dar desfecho explicito aos dois
codigos `BOF-*` que nao herdam de `DomainException`.

**Pre-requisito**: Task 36.3 concluida e aprovada.

**Arquivos esperados**: `ApiExceptionHandler.java`, excecoes orfas somente se o Gate provar mudanca
dentro do escopo, e testes dos tres handlers.

### Step 036.4.1 - `AUTH-423-001` no `423`

Escrever teste que provoca `ContaBloqueadaException` e verifica simultaneamente:

- status `423`;
- corpo com `codigo: AUTH-423-001`;
- `Retry-After` com o valor esperado;
- corpo padronizado e `traceId` preservados.

Depois, passar o getter ja preservado pela Sprint 35 ao helper comum. Nao duplicar a montagem do DTO.

### Step 036.4.2 - Decidir `BOF-429-001` e `BOF-400-002`

Para cada excecao, provar no handler e no inventario se existe acesso ao valor sem:

- criar codigo novo;
- mudar visibilidade `private` por conveniencia;
- alterar hierarquia de excecao apenas para caber nesta sprint;
- duplicar o literal no handler.

Se houver caminho pequeno e explicito, adicionar a leitura e um teste HTTP por codigo. Caso
contrario, classificar como `inalcancavel` na lista de excluidos. Os dois desfechos sao validos; ficar
sem classificacao nao e.

### Mutacoes obrigatorias

- remover o codigo do `423`: o teste do corpo reprova e o teste de `Retry-After` continua verde;
- remover o `Retry-After`: o teste do header reprova e o teste do codigo continua verde;
- para cada `BOF-*` publicado, substituir seu codigo pelo outro: ambos os testes reprovam.

### Verificacao da Task 36.4

```bash
./gradlew test; echo "EXIT=$?"
./gradlew spotlessCheck; echo "EXIT=$?"
```

### Definicao de pronto da Task 36.4

- [ ] `AUTH-423-001` aparece no corpo do `423`.
- [ ] `Retry-After` permanece correto e independentemente testado.
- [ ] Cada `BOF-*` foi publicado com teste ou excluido como `inalcancavel`.
- [ ] Mutacoes aplicaveis foram vistas falhar e revertidas.

### Commit sugerido

```text
feat(shared): propagar codigos de excecoes fora do dominio selado
```

---

## Task 36.5 - Publicar o catalogo no OpenAPI

**Objetivo**: tornar o subconjunto apto um contrato machine-readable, versionado e derivado de uma
unica fonte.

**Pre-requisito**: Task 36.4 concluida e aprovada; lista runtime de publicados estabilizada.

**Arquivos esperados**: fonte unica do catalogo, configuracao/testes OpenAPI e snapshot/documento
versionado conforme o padrao medido no Gate.

### Step 036.5.1 - Materializar a fonte unica

Implementar a decisao do Step 036.0.6. A fonte deve permitir:

- consultar todos os codigos publicados em teste;
- emitir o codigo real das excecoes sem manter uma segunda lista divergente;
- gerar ou validar o schema OpenAPI;
- rejeitar duplicata e formato nao canonico.

Nao criar hierarquia GoF ou registry extensivel sem necessidade. Um catalogo estatico e pequeno e
preferivel enquanto houver uma unica fonte e uma unica responsabilidade.

### Step 036.5.2 - Expor no documento OpenAPI

Publicar o catalogo uma vez em `components` e associar o campo opcional `codigo` ao schema. Preservar:

- OpenAPI 3.1;
- descricoes e exemplos existentes;
- `securitySchemes`;
- schemas de enum por `$ref` configurados na Sprint 35;
- operacoes e respostas existentes.

Gerar o documento pelo runtime, nunca montar snapshot manualmente.

### Step 036.5.3 - Testes do contrato

Testar que:

- o schema de erro contem `codigo`, mas nao o marca como obrigatorio;
- a lista publicada e exatamente igual a fonte unica;
- todos os valores passam no formato canonico;
- nenhum valor aparece em mais de uma definicao candidata;
- os tres MFA necessarios a F-26 estao presentes;
- descricoes, exemplos e `securitySchemes` continuam presentes por regressao dirigida.

### Mutacoes obrigatorias

- retirar um codigo apto do catalogo: igualdade com a fonte reprova;
- inserir um excluido por colisao ou formato: validacao reprova;
- tornar `codigo` obrigatorio: teste de compatibilidade do schema reprova;
- desligar a customizacao/configuracao escolhida: teste do documento runtime reprova.

### Verificacao da Task 36.5

```bash
./gradlew test; echo "EXIT=$?"
./gradlew clean build; echo "EXIT=$?"
./gradlew spotlessCheck; echo "EXIT=$?"
```

Se o `sep-app` continuar sendo o consumidor do snapshot OpenAPI, gerar o documento novo em arquivo
temporario e rodar seu `contract:check` sem editar codigo do app. Se o check nao reconhecer o campo
novo, registrar a lacuna para a F-Sprint 26; nao expandir esta Task para mudar o web.

### Definicao de pronto da Task 36.5

- [ ] Uma unica fonte machine-readable governa catalogo, teste e OpenAPI.
- [ ] `codigo` e opcional no schema.
- [ ] Catalogo publicado e canonico, sem colisao e igual ao runtime apto.
- [ ] OpenAPI 3.1, descricoes, exemplos, seguranca e enums anteriores preservados.
- [ ] Documento gerado pelo runtime e versionado no destino definido pelo Gate.
- [ ] Mutacoes foram vistas falhar e revertidas.

### Commit sugerido

```text
feat(openapi): publicar catalogo de codigos de erro
```

---

## Task 36.6 - Consolidar regressao por subtipo e por handler

**Objetivo**: provar que a cobertura nao depende de uma amostra feliz e que codigo, status e headers
nao se mascaram.

**Pre-requisito**: Task 36.5 concluida e aprovada.

**Arquivos esperados**: testes do handler, serializacao e OpenAPI; producao somente se uma mutacao
revelar defeito real dentro do escopo.

### Step 036.6.1 - Montar a matriz final

Consolidar uma tabela de teste com:

```text
excecao | handler | status | codigo esperado/ausente | headers esperados | catalogada/excluida
```

Ela deve conter:

- as cinco subclasses seladas de `DomainException`;
- `ContaBloqueadaException`;
- os dois `BOF-*` orfaos;
- ao menos um handler deliberadamente sem codigo;
- o caso normalizado da Task 36.3.

### Step 036.6.2 - Executar a campanha de mutacao dirigida

Reaplicar, sobre o estado final, no minimo:

1. remover propagacao no `build()`;
2. fixar um literal em `handleDomain`;
3. remover `AUTH-423-001` do `423`;
4. remover `Retry-After` sem tocar no codigo;
5. serializar `codigo: null`;
6. retirar um subtipo da matriz de teste ou trocar sua expectativa;
7. inserir no catalogo um valor excluido;
8. retirar do catalogo um valor publicado.

Registrar mutacao, teste que a matou e resultado. Mutante sobrevivente exige fortalecer o teste antes
do checkpoint; nao vale apenas anota-lo.

### Step 036.6.3 - Verificar ausencia de regressao transversal

Rodar a suite completa e comparar com a baseline. Conferir especialmente testes dos handlers de
`405`, path variable `400`, `423`, `429`, providers e `5xx`, porque todos compartilham a montagem do
corpo.

### Verificacao da Task 36.6

```bash
./gradlew clean build; echo "EXIT=$?"
./gradlew spotlessCheck; echo "EXIT=$?"
```

### Definicao de pronto da Task 36.6

- [ ] Matriz cobre todos os casos obrigatorios.
- [ ] Oito mutacoes dirigidas foram mortas e revertidas.
- [ ] Total de testes e maior ou igual a baseline, com zero falhas.
- [ ] Nenhum handler compartilhado regrediu em status, corpo ou header.

### Commit sugerido

```text
test(shared): travar contrato dos codigos de erro
```

---

## Task 36.7 - Catalogo operacional e lista de excluidos

**Objetivo**: tornar auditavel o que foi publicado, o que ficou fora e por que.

**Pre-requisito**: Task 36.6 concluida e aprovada.

**Arquivos esperados**: [`CONTRATOS.md`](../../repos/sep-api/CONTRATOS.md), spec 036 e indices
estritamente necessarios.

### Step 036.7.1 - Documentar o contrato publicado

Adicionar ao doc operacional:

- forma do corpo com e sem `codigo`;
- semantica de `codigo + traceId` para suporte;
- regra canonica `MOD-STATUS-NNN`;
- garantia de compatibilidade: ausencia do campo mantem o comportamento legado;
- catalogo publicado, preferencialmente gerado ou verificado contra a fonte unica da Task 36.5.

### Step 036.7.2 - Documentar cada exclusao

Para todo valor do inventario que nao estiver publicado, registrar:

```text
codigo | definicao/classe | modulo | motivo | observacao/follow-up
```

Motivos permitidos: `colisao`, `formato`, `inalcancavel`. Quando um valor tiver varias definicoes,
listar todas sem transformar duas condicoes em uma. Apontar a Sprint 37 como destino de colisoes e
convencoes, sem prescrever a decisao do ADR futuro.

### Step 036.7.3 - Registrar handlers sem codigo

Listar os handlers que continuam sem identificador de dominio, com status e excecao. O Gate deve
medir a quantidade atual; nao copiar o numero historico de 10. Explicitar que criar codigos novos
esta fora da Sprint 36.

### Step 036.7.4 - Provar a particao

Executar verificacao automatizada que compare o inventario bruto com as duas listas finais. Ela deve
falhar para:

- codigo ausente das duas listas;
- codigo presente nas duas;
- codigo publicado com formato invalido;
- codigo publicado com mais de uma condicao;
- exclusao sem motivo.

Registrar a equacao final com os numeros medidos:

```text
publicados + excluidos = total de codigos unicos do Gate 36.0
intersecao(publicados, excluidos) = 0
```

### Verificacao da Task 36.7

```bash
./gradlew test; echo "EXIT=$?"
./gradlew spotlessCheck; echo "EXIT=$?"
```

Rodar tambem a verificacao de particao definida nesta Task e registrar seu exit code.

### Definicao de pronto da Task 36.7

- [ ] Corpo, semantica, nomenclatura e catalogo publicados estao documentados.
- [ ] Todo excluido aparece uma vez, com origem e motivo.
- [ ] Handlers sem codigo estao medidos e registrados.
- [ ] Particao completa, disjunta e verificada automaticamente.
- [ ] Spec 036 reflete as contagens finais, sem transformar piso historico em fato atual.

### Commit sugerido

```text
docs(contratos): registrar catalogo e perimetro dos codigos de erro
```

---

## Fechamento da Sprint 36

### Gate funcional e de contrato

- [ ] Campo `codigo` presente quando ha identificador publicado.
- [ ] Campo ausente, e nao `null`, quando o handler nao tem codigo.
- [ ] Cinco subclasses seladas de `DomainException` cobertas individualmente.
- [ ] `AUTH-423-001` emitido no `423` com `Retry-After` preservado.
- [ ] `BOF-429-001` e `BOF-400-002` publicados ou excluidos como `inalcancavel`.
- [ ] Codigo CCB normalizado sem colisao.
- [ ] Catalogo OpenAPI opcional, canonico, sem duplicata e derivado de uma fonte unica.
- [ ] `MFA-400-002`, `MFA-400-003` e `MFA-400-004` publicados para desbloquear a F-26.
- [ ] Particao final completa e disjunta.

### Gates tecnicos

```bash
./gradlew clean build; echo "EXIT=$?"
./gradlew spotlessCheck; echo "EXIT=$?"
```

- [ ] Total de testes >= baseline do Gate 36.0, com zero falhas.
- [ ] Campanha final de mutacao registrada, sem sobrevivente aceito.
- [ ] OpenAPI runtime comparado antes/depois; descricoes, exemplos, seguranca e enums preservados.
- [ ] `contract:check` do `sep-app` medido contra o documento novo, sem alterar codigo web nesta
      sprint; qualquer limitacao encaminhada para a F-26.

### Documentacao e entrega

- [ ] `CONTRATOS.md` contem catalogo, uso operacional e lista completa de excluidos.
- [ ] Spec 036 contem contagens finais medidas.
- [ ] `STATE.md`, `PRD-FASE-4.md`, `CONTEXT-PARTE-2.md` e indices atualizados somente ao fechar a
      sprint, conforme as regras de manutencao documental.
- [ ] `repos/sep-api/SPRINT-36-PR.md` criado com resumo, test plan, contrato, catalogo, excluidos,
      mutacoes, riscos, dividas aceitas e commits.
- [ ] Descricao temporaria da Sprint 35 removida no inicio da implementacao, conforme regra do
      `AGENT.md`; nao remover durante a criacao destes steps.
- [ ] Checkpoint final apresentado antes de qualquer commit.

### Riscos e pendencias que o fechamento deve declarar

- Codigos excluidos continuam sem chegar ao cliente ate a Sprint 37 ou follow-up correspondente.
- Handlers sem taxonomia continuam omitindo `codigo`; criar identificadores permanece fora do
  escopo.
- Adicionar codigo futuro e compativel; renomear codigo publicado e mudanca de contrato.
- Qualquer codigo `private` bloqueado por visibilidade permanece excluido, sem abertura oportunista.
- A F-26 e a M-18 so comecam depois de a Sprint 36 estar integrada em `develop`.

### Mensagem sugerida para o commit final de documentacao

```text
docs(contratos): fechar catalogo de codigos de erro da sprint 36
```
