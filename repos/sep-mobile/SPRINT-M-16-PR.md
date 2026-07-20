# PR — M-Sprint 16: Aportes owner-scoped da credora (escopo reduzido pelo Gate M-16.0)

> Descricao temporaria para o PR `feature/msprint-16-aporte-pix-avancado-mobile -> develop`.
> Apagar apos o uso (ciclo padrao das descricoes de sprint).

## Summary

Leva a empresa credora dona a leitura **somente leitura** dos aportes da propria operacao, dentro do
detalhe da carteira ja existente, consumindo o contrato owner-scoped da **Sprint 29**:

```http
GET /api/v1/credores/operacoes/{operacaoId}/aportes
```

Autenticado (`isAuthenticated()`), sem step-up e sem `Idempotency-Key`. Ownership, ordem, valores e
estados permanecem autoritativos no backend, que devolve `404` neutro para operacao alheia ou
inexistente.

Nenhuma jornada nova, nenhuma rota nova, nenhuma mudanca de contrato backend, nenhuma regressao PWA
ou do empacotamento Android da M-13.

## Gate M-16.0 — por que o escopo foi reduzido

A spec 216 previa seis contratos (matching, aporte assistido com step-up e chaves Pix mascaradas). O
precheck mediu os contratos reais contra a base do `sep-mobile` e encontrou uma contradicao de
persona que invalida cinco deles:

- o `sep-mobile` so conhece `UsuarioRole = 'ADMIN' | 'CLIENTE'`
  (`src/app/core/api/api.models.ts:1`); o `roleGuard` tipa `route.data['roles']` como
  `UsuarioRole[]` (`src/app/core/guards/role.guard.ts:10`), entao declarar `'FINANCEIRO'` nem
  compila;
- 5 dos 6 endpoints exigem `FINANCEIRO`/`ADMIN` no backend, e a credora autentica como `CLIENTE`;
- a propria spec 216 e o step 216 ja restringiam o mobile a **tomador e credora**, excluindo
  operacao interna de financeiro/backoffice.

| Endpoint | Role backend | Credora alcanca? |
|----------|--------------|------------------|
| `GET /credores/matching/sugestoes` | `FINANCEIRO`/`ADMIN` | nao |
| `GET /credores/matching/{sugestaoId}` | `FINANCEIRO`/`ADMIN` | nao |
| `POST /credores/matching/{sugestaoId}/decisao` | `FINANCEIRO`/`ADMIN` + step-up | nao |
| `POST /credores/operacoes/{operacaoId}/aportes` | `FINANCEIRO`/`ADMIN` + step-up | nao |
| `GET /credores/operacoes/{operacaoId}/aportes` | `isAuthenticated()`, owner-scoped | **sim** |
| `GET /pix/chaves` | `FINANCEIRO`/`ADMIN` | nao |

**Decisao (opcao A)**: entregar apenas a leitura owner-scoped de aportes. Matching, aporte com
step-up e chaves Pix ficam **adiados**, registrados na spec 216 e preservados no step 216 para
reativacao. Reativa-los exige ADR + revisao da spec (expor persona operacional no mobile) ou uma
sprint backend que admita a credora dona nesses contratos.

**O item de Pix avancado do `v1.0-local` (PRD-FASE-4 §37) NAO e fechado por esta sprint** — segue
dependendo da sprint web dedicada de chaves Pix (Gate F-18.0).

## Divergencias de contrato corrigidas na documentacao

O precheck tambem encontrou erros factuais no step 216, ja corrigidos:

- `TipoChavePix` usa `EVP`, nao `ALEATORIA`;
- `ChavePixResponse` tem campo extra `removidaEm` (nullable);
- `POST /aportes` tambem pode retornar `422`;
- `TRATA_403_LOCALMENTE` **nao existe no `sep-mobile`** (conceito criado no `sep-app` na F-16);
- rotas reais sao `/app/credora/...`, nao `/credora/...`;
- service real e `core/credores/credora-mobile.service.ts`, nao `core/credora/credora.service.ts`;
- baseline usa `npm ci --legacy-peer-deps` (o `npm ci` puro falha com `ERESOLVE` em `zone.js`).

## Mudancas

**Borda** (`core/`)
- `api.models.ts`: `StatusAporteCredora` (`PENDENTE | EM_PROCESSAMENTO | LIQUIDADO | FALHOU`) e
  `AporteCredoraResponse`.
- `credores/credora-mobile.service.ts`: `listarAportes(operacaoId)` — decimo endpoint permitido.
- `interceptors/step-up.interceptor.ts`: **inalterado**. Ganhou teste travando que o GET de aportes
  nao anexa nem consome `X-Step-Up-Token` — o token e de uso unico e consumi-lo numa leitura
  inutilizaria a proxima mutacao legitima do usuario.

**Tela** (`features/credora/`)
- `carteira/portfolio-detail.component`: secao "Aportes da operacao", espelhando o padrao do card de
  status Pix (M-11.4) — leitura secundaria que nao bloqueia o detalhe principal, token de geracao
  descartando resposta obsoleta, retry proprio.
- `shared/aporte-status.component` (novo): badge dos quatro estados com rotulo textual (cor nunca e
  a unica informacao) e switch exaustivo sobre o union.

**Mocks e smoke**
- `credoresHandlers`: `GET /credores/operacoes/:operacaoId/aportes`, reseedavel por `mock.credora`
  (`aportes: 'LISTA' | 'VAZIA'`), com `404` neutro para operacao alheia. Nenhum endpoint de mutacao
  mockado.
- `e2e/credora-mobile.spec.ts`: dois smokes novos.

## Decisoes de design

- **Quatro superficies mutuamente exclusivas**: carregando, lista, vazia (`200 []`), indisponivel
  (`404` neutro) e erro tecnico (rede/5xx). Um `404` seguido de retry com 5xx mostra o erro tecnico,
  nao a ausencia neutra — a ausencia anterior e limpa antes de cada leitura.
- **Falha isolada**: erro na lista de aportes nunca derruba o detalhe da carteira ja carregado.
- **Sem polling** e sem refresh invisivel ao retomar foreground; atualizacao so por gesto.
- **Guarda de request em voo**: o `[disabled]` do `ion-button` so vale a partir do proximo ciclo de
  change detection, entao um duplo toque disparava duas leituras concorrentes com a mesma geracao,
  e a ultima a responder vencia. A guarda impede a segunda chamada em vez de dispara-la e descartar.
- **Nenhum CTA de mutacao** na superficie da credora; ordem vem do backend e o app nao reordena nem
  agrega.

## Test plan

| Verificacao | Resultado |
|-------------|-----------|
| `npm ci --legacy-peer-deps` | exit 0 |
| `npm run lint` | exit 0 |
| `npm run lint:scss` | exit 0 |
| `npm run format:check` | exit 0 |
| `npm run test` (Vitest) | **503/503** (68 arquivos); baseline da M-13 era 487 |
| `npm run build` | exit 0 |
| `npm run e2e` (Playwright) | **26 passed, 1 failed** — `golden-path-mobile`, falha preexistente da M-13 |
| `npm audit --omit=dev` | **0 vulnerabilidades** |
| `npx cap sync android` | exit 0 |
| `./gradlew assembleDebug` | **NAO EXECUTADO** — ver limitacoes |

Cobertura nova (16 testes): contrato HTTP (URL/metodo, ordem preservada, lista vazia, `404` neutro,
ausencia de step-up/`Idempotency-Key`, ausencia de metodos de mutacao no prototype); tela (quatro
estados com rotulo e tom, vazio ≠ `404` ≠ erro tecnico, retry `404`→5xx, duplo toque com request
unica, erro nao derruba o detalhe, ausencia de CTA de mutacao, ausencia de escrow/provider/IDs);
smoke PWA (quatro aportes somente leitura com um unico botao no card; operacao sem aportes no estado
vazio).

O teste de duplo toque foi validado por negacao: com a guarda removida ele falha com
`Expected one matching request ... found 2 requests`.

## Limitacoes e follow-ups

1. **`./gradlew assembleDebug` nao foi executado localmente**: a maquina de desenvolvimento nao tem
   Android SDK (`SDK location not found`; `local.properties` e gitignored). `npx cap sync android`
   passou.

   **Nao exige acao manual**: o job `Build Android (debug)` do `CI-MOBILE`
   (`.github/workflows/ci.yml`) roda em push de **qualquer** branch e cobre exatamente esse gate —
   `npm run build`, `npx cap sync android`, `./gradlew test lint`, `./gradlew assembleDebug` e
   verificacao de que o APK existe, com upload do artefato. O runner `ubuntu-24.04` ja traz o SDK.
   O gate fecha sozinho no primeiro push da branch; conferir o job verde antes de promover a `main`.

   A sprint nao toca `android/`, codigo nativo nem dependencia Capacitor, entao o risco de regressao
   Android e baixo de qualquer forma.
2. **`golden-path-mobile` continua vermelho** — falha preexistente herdada da M-13, fora do escopo.
3. **Bug gemeo preexistente**: `consultarStatusPix` (mesmo arquivo, M-11.4, ja em `main`) tem a
   mesma race condition de duplo toque corrigida aqui para os aportes. Nao foi corrigido por estar
   fora do escopo desta sprint. Fix e a mesma linha.
4. **Provider fake**: nesta fase os aportes nunca liquidam de verdade. A UI diz isso explicitamente
   ("processamento local nesta fase; o status vem do backend e nao garante liquidacao").
5. **Escopo adiado** (matching, aporte POST, chaves Pix) permanece nao implementado e rastreado na
   spec 216.

## Commits

```text
6436a2e feat(mobile): adicionar contrato de aportes owner-scoped da credora
1d60e20 test(mobile): tipar fixture de aporte com StatusAporteCredora
88bfcd8 feat(mobile): exibir aportes owner-scoped no detalhe da carteira
078d6f9 fix(mobile): impedir leituras concorrentes de aportes no duplo toque
1245309 test(mobile): cobrir aportes owner-scoped com MSW e smoke PWA
13c7989 test(mobile): atualizar assercoes negativas da credora pos-M-16
```

O ultimo commit atualiza uma assercao negativa do smoke da M-10 que guardava "credora nao ve
aporte" — invariante que esta sprint mudou deliberadamente. Ela passava por sorte de fraseado
("Aportes da operacao" nao casa com `'aporte de'`); passou a asserir o invariante vigente (a credora
ve aportes, mas nunca a superficie de mutacao).

## Referencias

- Spec [`216`](../../specs/fase-4/216-msprint-16-aporte-pix-avancado-mobile.md)
- Steps [`216`](../../steps-fase-4/mobile/216-msprint-16-steps.md)
- Backend Sprint 29 (aporte, PR #93/#94)
- [`repos/sep-mobile/README.md`](README.md) §Aportes owner-scoped da credora
