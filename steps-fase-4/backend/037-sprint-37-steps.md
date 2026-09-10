# Steps - Sprint 37 - Normalizar a taxonomia de codigos de erro

**Spec de origem**:
[`037-sprint-37-normalizacao-taxonomia-erro.md`](../../specs/fase-4/037-sprint-37-normalizacao-taxonomia-erro.md)

**ADR**: [`0020`](../../adr/0020-convencao-codigos-de-erro.md) — prefixo por area funcional
(`credito` sai de `CRD` para `PRP`), sufixo numerico, publicacao na propria sprint.

**Status**: planejada; steps criados em 2026-09-10, depois das decisoes do responsavel pelo repo.

**Objetivo geral**: tornar apta toda a taxonomia de erro que a Sprint 36 deixou fora do perimetro,
**sem renomear nenhum codigo publicado**, instalar o registro de prefixos e o gate de formato no build,
e publicar o que ficar apto.

**Natureza da sprint**: divida de contrato. Sem endpoint, migration, evento, provider ou regra de
negocio. Catalogo publicado **cresce** (compativel); nenhum publicado muda.

**Dependencia**: Sprint 36 em `develop` (PR #107/#108) — conferido em 2026-09-10: `develop` `a774aa4`
identico a `main` por conteudo.

**Repo de implementacao**: `sep-api`. **Docs de destino**: ADR 0020, spec 037, este step,
`repos/sep-api/CODIGOS-DE-ERRO.md` e `repos/sep-api/SPRINT-37-PR.md`. Git do `docs-SEP` e manual.

**Branch sugerida**: `feature/sprint-37-normalizacao-codigos-erro`, de `develop` atualizado.

**Skills obrigatorias**: `coding-guidelines`, `clean-code`, `design-patterns-java`, e
`coupling-analysis` na decisao do `ONB-404-001` (Task 37.2).

---

## Decisoes da sprint

1. **Nenhum codigo publicado muda.** O conjunto publicado antes da sprint tem de ser **subconjunto** do
   publicado depois, conferido por teste no fechamento. Se uma Task precisar renomear um publicado,
   ela **para e reporta** — vira mudanca de contrato e muda de sprint (criterio 8 da spec).
2. **Um codigo = um dono = uma condicao** (ADR 0020 §3). Mesma condicao em N lugares vira **excecao
   nomeada unica** no modulo dono; condicoes distintas recebem codigos distintos.
3. **Renumerar sem inventar significado.** O codigo novo e o proximo `NNN` livre no par prefixo +
   status. A mensagem ao usuario **nao muda** — so o identificador.
4. **`credito` -> `PRP` preserva status e numero** (`CRD-404-001` de `PropostaNaoEncontradaException`
   vira `PRP-404-001`), para o mapeamento ser legivel no diff e no PR.
5. **Registro de prefixos e gate entram depois das conversoes**, porque o gate estrito reprovaria a
   arvore enquanto houver codigo fora do formato. A ordem das Tasks existe por isso.
6. **Publicar e a ultima Task.** O teste de particao exige `aptos == catalogo`; cada Task que torna um
   codigo apto tem de **acrescenta-lo ao catalogo no mesmo commit**, ou o build reprova. A Task 37.7
   consolida, confere o subconjunto e fecha o documento operacional.
7. **Suite backend nao e hermetica.** Ela usa o `sep_dev` compartilhado; residuo de uso manual ja
   produziu ~90 falsos vermelhos. Vermelho fora dos arquivos da Task e investigado **antes** de ser
   atribuido a ela.

---

## Protocolo obrigatorio por Task

1. Executar somente a Task liberada.
2. Reconferir cada ancora no checkout atual com `arquivo:linha`; os numeros deste documento sao de
   2026-09-10.
3. Teste primeiro, visto falhar pelo motivo esperado.
4. Mutacao nomeada aplicada, conferida no diff, vista reprovar e revertida com o arquivo voltando byte
   a byte. Contar ancora com `node` (`split(a).length - 1`), nao com `grep -cF` em ancora multi-linha.
   Morte so conta com teste nomeado falhando e sem erro de compilacao.
5. Gates com exit code capturado um a um (`cmd; echo "EXIT=$?"`), nunca por pipe.
6. Checkpoint pre-commit: status, diff, arquivos, tabela de codigos antes -> depois, testes,
   mutacoes, riscos, mensagem sugerida. Aguardar aprovacao; `git add` com paths especificos.
7. Um code review depois do commit. Finding confirmado vira hotfix com novo checkpoint, sem novo
   review.
8. Aguardar autorizacao antes da Task seguinte. Push e PR sao manuais.

---

## Rastreabilidade spec 037 -> steps

| Item da spec | Steps |
|---|---|
| ADR das duas decisoes + imutabilidade | 37.1 (docs, ja escrito em 2026-09-10) |
| Deduplicacao do tipo B (`ONB-400-008`, `ONB-404-001`) | 37.2 |
| Colisoes reais: tipo C (5 entre classes do mesmo modulo) e tipo D (7 dentro da mesma classe) | 37.3 |
| Re-prefixacao do tipo A: `credito` `CRD` -> `PRP` (9) + `OF-400-001` | 37.4 |
| Conversao de sufixo: 28 do `pix` + `AUTH-403-PASSWORD_RESET_REQUIRED` | 37.5 |
| Registro de prefixos + gate de formato, prefixo e dono unico, provado que morde | 37.6 |
| Publicacao dos aptos, conferencia de subconjunto, testes literais, doc operacional | 37.7 |
| Baseline, particao, ancoras | Gate 37.0 e fechamento |

**Tipo D e novo em relacao a spec**: sao os sete codigos que o code review de fechamento da 036
retirou do catalogo por identificarem mais de uma condicao **na mesma classe** (`ASN-400-001`,
`ONB-400-002`, `ONB-400-004`, `ONB-400-014`, `ONB-400-015`, `PIX-400-002`, `WHK-400-002`).

---

## Ordem de execucao

```text
Gate 37.0  baseline, particao 80/53 remedida, ancoras, branch
  -> 37.1  ADR 0020 aceito (docs; sem commit no sep-api)
  -> 37.2  deduplicar o tipo B
  -> 37.3  separar colisoes do tipo C e D
  -> 37.4  re-prefixar credito CRD -> PRP
  -> 37.5  converter sufixo semantico -> numerico
  -> 37.6  registro de prefixos + gate de formato/prefixo/dono no build
  -> 37.7  consolidar publicacao, subconjunto, testes literais, doc operacional
Fechamento  gates, particao final, SPRINT-37-PR.md
```

---

## Gate 37.0 - Baseline e integracao

### Step 037.0.1 - Integracao e branch

```bash
git fetch origin
git switch develop && git pull --ff-only
git diff --stat origin/main origin/develop     # vazio esperado
git status --short --branch
git switch -c feature/sprint-37-normalizacao-codigos-erro
```

Apagar `docs-SEP/repos/sep-api/SPRINT-36-PR.md` (working tree; ja usado no PR #107). Regra do
`AGENT.md` §Arquivos de PR description.

### Step 037.0.2 - Baseline de gates

```bash
./gradlew clean build; echo "EXIT=$?"          # inclui spotlessCheck
```

Registrar total de testes e falhas a partir de `build/test-results/test/*.xml`. Referencia da Sprint
36: **2297 testes / 0 falhas**. Vermelho aqui e investigado antes de abrir a branch — ver Decisao 7.

### Step 037.0.3 - Remedir a particao e os grupos

- Particao: **80 publicados + 53 excluidos = 133**, recalculada pelo `ParticaoDeCodigosErroTest`, nao
  por este documento.
- Excluidos por grupo, com `arquivo:linha` de cada ponto de lancamento: 9 de faixa compartilhada
  (`credito` x `credores`), 2 de tipo B, 5 de tipo C, 7 de tipo D, 28 `pix` semanticos,
  `AUTH-403-PASSWORD_RESET_REQUIRED`, `OF-400-001`.
- Conjunto publicado antes da sprint salvo como referencia do criterio de subconjunto.
- Consumidores nos fronts (`sep-app`, `sep-mobile`, fora de spec): so `MFA-400-003`/`004` ramificam.
- Arquivos de teste com codigo literal (medido em 2026-09-10: 37 codigos em 15 arquivos).

### Definicao de pronto do Gate 37.0

- [ ] Branch criada de `develop` identico a `main`; `SPRINT-36-PR.md` removido do working tree.
- [ ] Baseline de testes registrada, 0 falhas.
- [ ] Particao e grupos remedidos; publicado-antes salvo.

---

## Task 37.1 - ADR 0020 aceito

**Objetivo**: registrar as duas decisoes, a publicacao e as regras de unicidade e imutabilidade.

Ja escrito em `docs-SEP/adr/0020-convencao-codigos-de-erro.md` em 2026-09-10. A Task confere o ADR
contra a medicao do Gate e ajusta numero que tenha mudado. **Sem commit no `sep-api`**; git do
`docs-SEP` e do responsavel.

---

## Task 37.2 - Deduplicar o tipo B

**Objetivo**: cada condicao duplicada passa a ter **um** dono.

- `ONB-400-008` — "Solicitacao nao e do tipo EMPRESA" em `ConsultarStatusOnboardingEmpresaUseCase` e
  `IniciarVerificacaoKybUseCase`: extrair **excecao nomeada** no `domain` do `onboarding`, lancada
  pelos dois. Constante compartilhada **nao** basta — o teste de particao conta o dono pela classe, e
  dois use cases continuariam dois donos.
- `ONB-404-001` — "onboarding nao encontrado" em `OnboardingNaoEncontradoException` e inline em
  `credito/.../CriarPropostaCreditoUseCase`. **Decisao da Task, com `coupling-analysis`**: se o
  `credito` ja depende da API do `onboarding` nesse fluxo, reusar a excecao dele (um codigo, uma
  condicao); se reusar criar dependencia de dominio na direcao errada, a condicao no `credito` e
  outra ("proposta exige onboarding aprovado") e recebe codigo `PRP` proprio na Task 37.4. **Parar e
  reportar** no checkpoint com a medicao antes de escolher.

**Mutacao**: reintroduzir o literal num segundo dono — o teste de particao tem de acusar colisao.

**Commit sugerido**: `refactor(onboarding): unificar condicoes duplicadas de codigo de erro`

---

## Task 37.3 - Separar colisoes do tipo C e D

**Objetivo**: nenhum codigo identifica duas condicoes.

- **Tipo C** (condicoes diferentes em classes diferentes do mesmo modulo): `COB-409-002`,
  `ONB-400-006`, `ONB-400-007`, `USR-400-001`, `USR-400-002`. Um lado mantem o codigo, o outro recebe o
  proximo `NNN` livre. Em `ONB-400-007` ha **tres** sites: os dois de "arquivo invalido" sao a mesma
  condicao (deduplicar como no tipo B) e o de "campo obrigatorio" e outra (renumerar).
- **Tipo D** (condicoes diferentes na mesma classe): `ASN-400-001`, `ONB-400-002`, `ONB-400-004`,
  `ONB-400-014`, `ONB-400-015`, `PIX-400-002`, `WHK-400-002`. Cada condicao distinta recebe codigo
  proprio; a mensagem nao muda.
- Codigo que ficar apto entra no catalogo **no mesmo commit** (Decisao 6).

**Criterio**: `nenhumCodigoPublicadoIdentificaMaisDeUmaCondicao` segue verde, e nenhum excluido por
`colisao` sobra nos modulos tocados.

**Mutacao**: devolver uma condicao ao codigo antigo — particao tem de reprovar.

**Commit sugerido**: `refactor(erros): separar codigos que identificavam mais de uma condicao`

---

## Task 37.4 - Re-prefixar o `credito`: `CRD` -> `PRP`

**Objetivo**: `CRD` passa a ter um unico modulo dono (`credores`).

| Antes | Depois | Classe |
|---|---|---|
| `CRD-400-001` | `PRP-400-001` | `PropostaInvalidaException` |
| `CRD-400-002` | `PRP-400-002` | `StatusPropostaInvalidoException` |
| `CRD-403-001` | `PRP-403-001` | `OwnershipPropostaException` |
| `CRD-404-001` | `PRP-404-001` | `PropostaNaoEncontradaException` |
| `CRD-404-002` | `PRP-404-002` | `ConsentimentoNaoEncontradoException` |
| `CRD-409-002` | `PRP-409-002` | `ConsentimentoAtivoException` |
| `CRD-422-001` | `PRP-422-001` | `OnboardingNaoAprovadoException` |
| `CRD-422-002` | `PRP-422-002` | `OpenFinanceFluxoInvalidoException` |
| `CRD-422-003` | `PRP-422-003` | `ConsentimentoNaoAutorizadoException` |
| `OF-400-001` | aposentado: `WHK-400-003`/`004`/`005` | `CelcoinOpenFinanceWebhookController` |

Tabela medida em 2026-09-10; reconferir no Gate. Com o `credito` fora, o lado `credores` das 9 vira
dono unico e **tambem** fica apto — os dois lados entram no catalogo no mesmo commit.

**Corrigido na execucao (2026-09-10)**, pela medicao da Task:

- `OF-400-001` identificava as quatro checagens de recepcao de webhook (dois headers, body vazio,
  body nao-JSON) que a 37.3b consolidou em `WHK`. Renomea-lo para `PRP` daria dois codigos a mesma
  condicao (ADR 0020 §3) e ainda deixaria o novo com quatro condicoes. O controller passa a lancar as
  excecoes `WHK` e o codigo e aposentado.
- `StatusPropostaInvalidoException` declarava `CRD-400-002` e nunca o usava: os construtores
  chamavam o do pai, e a transicao invalida saia com `CRD-400-001`. Renomear sem corrigir publicaria
  `PRP-400-001` com duas condicoes (dado invalido e status que recusa a operacao) e deixaria
  `PRP-400-002` inalcancavel. A classe passa a emitir o proprio codigo, e o "novo parecer em proposta
  em estado final" do `RegistrarParecerUseCase` — mesma condicao pelo criterio da acao do cliente —
  sai por ela, com a mensagem identica.

**Mutacao**: devolver um `PRP` a `CRD` — particao tem de acusar colisao.

**Commit sugerido**: `refactor(credito): mover codigos de erro para o prefixo PRP`

---

## Task 37.5 - Converter sufixo semantico em numerico

**Objetivo**: todo codigo casa `^[A-Z]{3,4}-[0-9]{3}-[0-9]{3}$`.

- 28 do `pix`: proximo `NNN` livre no par `PIX-STATUS`, respeitando os ja publicados (`PIX-400-001`,
  `PIX-404-001`) e o que a Task 37.3 tiver criado. Tabela antes -> depois no checkpoint.
- `AUTH-403-PASSWORD_RESET_REQUIRED` (`PasswordResetEnforcementFilter`): vai para o proximo
  `AUTH-403-NNN` livre. Ele e escrito direto na response pelo filtro, fora do `ApiExceptionHandler`,
  entao depois de canonico continua **excluido por `inalcancavel`** — e isso e o esperado. Conferir que
  nenhum front le o valor antigo (medido em 2026-09-10: nenhum).

**Mutacao**: devolver um sufixo semantico — particao tem de classificar como `formato`.

**Commit sugerido**: `refactor(erros): converter sufixos semanticos para numericos`

---

## Task 37.6 - Registro de prefixos e gate no build

**Objetivo**: codigo novo fora da convencao ou com prefixo nao registrado reprova o build.

- Registro unico no `shared/exception` (enum `PrefixoCodigoErro`, ou equivalente), com modulo dono e
  area — a tabela do ADR 0020 §1.
- Gate executavel no mesmo estilo do `ParticaoDeCodigosErroTest` (varredura de `src/main/java`):
  1. todo codigo casa o formato canonico;
  2. todo prefixo em uso esta no registro;
  3. todo prefixo aparece em **um** modulo so — o dono do registro.
- **Provado que morde**: introduzir um codigo semantico sai 1; um prefixo nao registrado sai 1; um
  prefixo registrado usado em outro modulo sai 1; removidos, sai 0. Mesmo protocolo da D-Sprint 1.

**Commit sugerido**: `test(erros): gatear formato e prefixo dos codigos no build`

---

## Task 37.7 - Publicacao, subconjunto e documento operacional

**Objetivo**: fechar o catalogo e provar que nada publicado mudou.

- Conferir que o catalogo contem exatamente os aptos (o teste de particao ja exige) e registrar a
  contagem final.
- **Teste de subconjunto**: os 80 publicados antes da sprint continuam publicados, com o mesmo valor.
- Testes com codigo literal atualizados para os valores novos.
- `repos/sep-api/CODIGOS-DE-ERRO.md`: regra de nomenclatura (area funcional, registro), catalogo novo,
  tabela de excluidos restante (esperado: so `inalcancavel`), e o mapa antes -> depois da sprint.

**Mutacao**: retirar um dos 80 do catalogo — o teste de subconjunto tem de reprovar.

**Commit sugerido**: `feat(erros): publicar codigos normalizados pela Sprint 37`

---

## Fechamento da Sprint 37

- [ ] `./gradlew clean build` verde, testes >= baseline do Gate, 0 falhas.
- [ ] Particao final registrada; excluidos restantes so por `inalcancavel`, cada um explicado.
- [ ] Nenhum dos 80 publicados antes mudou (teste de subconjunto).
- [ ] Gate de formato/prefixo provado.
- [ ] Spec 037 com §Resultado medido; `STATE.md`, `CONTEXT-PARTE-2.md`, indices e
      `CODIGOS-DE-ERRO.md` atualizados; `repos/sep-api/SPRINT-37-PR.md` criado.
- [ ] O PR diz que **nenhuma tela muda** — o valor e o catalogo apto e publicavel, nao comportamento.
