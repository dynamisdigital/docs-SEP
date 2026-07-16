# F-Sprint 19 — Hardening de tooling, contrato e collections (descricao de PR)

> Descricao temporaria consolidada para o PR `feature/fsprint-19-hardening-tooling-contrato-web`
> -> `develop` no `sep-app`. Apagar apos o merge (ciclo de vida padrao).

## Resumo

Sprint de tooling que salda a divida aceita no fechamento da Fase 3 (PRD-FASE-4 §35, follow-up 4;
spec `119`): validacao automatizada dos contratos consumidos contra o OpenAPI runtime, hardening do
tooling dentro da baseline Angular 20/Node 20, refresh das collections Postman/Insomnia
(congeladas desde a Sprint 14) e ADR 0018 decidindo **adiar** o Angular 22. Nao cria tela,
endpoint ou regra de negocio.

## Commits (sep-app)

| Commit | Tipo | Conteudo |
|---|---|---|
| `d45d54f` | test | `contract:check` + snapshot OpenAPI + descriptor de 82 contratos consumidos + 15 testes do verificador |
| `e7d6d56` | fix | pos-review: $ref recursivo com guarda de ciclo, timeout 30s no fetch, validacao de form params multipart (+3 testes) |
| `5743436` | chore | Angular 20.3.26 + build/CLI 20.3.32; lockfile regenerado; audit 9 -> 0 |
| `cbb441c` | docs | README alinhado ao CI real (npm ci sem legacy-peer-deps; Vitest 3) |
| `be55046` | ci | step `contract:check` no CI-APP (offline, snapshot versionado) |
| `bb825e7` | fix | pos-review manual: required de request bodies, parametros de path, headers de resposta consumidos, schema sem tipo (24 testes) |

## Contrato frontend <-> OpenAPI (Task F-19.1)

- **Fonte**: OpenAPI runtime do `sep-api` `develop` `7f40056` (perfil dev, `GET /v3/api-docs`);
  export bruto sha256 `e2b7a0416d115ec72cefb7b351606f759f084ce82006c231f7e6ba28e13e4c38`;
  3.1.0, 97 paths / 105 operacoes / 108 schemas. Snapshot versionado em
  `contracts/openapi.snapshot.json` (chaves ordenadas; meta + regeneracao documentadas).
- **Matriz**: 82 operacoes consumidas inventariadas (12 services) — **todas ALINHADO**;
  **zero** `DIVERGENTE_FRONT`; nenhum tipo de borda alterado.
- **Verificador** (`scripts/contract-check.mjs`, zero dependencia): falha em divergencia de
  path/metodo, parametro obrigatorio, header sensivel, status de sucesso, campo/tipo/enum;
  18 testes com fixtures minimas. `SEP_OPENAPI_SCHEMA=<path|url>` valida contra runtime.
- **Lacunas do OpenAPI registradas** (`knownGaps`; reportadas sem falhar — follow-ups backend):
  1. `X-Step-Up-Token` nao documentado em nenhuma das operacoes sensiveis (springdoc);
  2. `DashboardResponse.tempoMedioResolucao30d` documentado `string`, runtime devolve `number`
     (Jackson WRITE_DURATIONS_AS_TIMESTAMPS);
  3. enums nao publicados: `ContratoResponse.tipo/status`, `StatusAssinaturaResponse.*`;
  4. headers de resposta do documento assinado (`X-Document-Hash-Sha256`/`Content-Disposition`)
     lidos pelo frontend e nao documentados;
  5. springdoc nao emite `required`/`nullable` nos schemas de RESPONSE (obrigatoriedade de
     request bodies E validada pelo check; nulabilidade de response segue nao verificavel).
- **Endurecimentos do review manual** (hotfix): validacao de `required` dos request bodies,
  de parametros de path (existencia + obrigatoriedade), de headers de resposta consumidos e
  falha explicita para schema sem tipo ($ref quebrado). Verificador com 24 testes.

## Tooling (Task F-19.2)

- Angular runtime `20.3.25 -> 20.3.26`; `@angular/build`/`@angular/cli` `-> 20.3.32`.
- Lockfile **regenerado** (npm 9.2.0 nao resolve o grupo Angular incremental sem
  `--force`/`--legacy-peer-deps`, ambos proibidos); `npm ci` limpo validado.
- Audit: 9 ocorrencias (0 critical, 5 high, 1 moderate, 3 low — **todas dev tooling**;
  `--omit=dev` sempre 0) -> **0 total**. Corrigidos: piscina (RCE gadget), vite, esbuild, ws,
  sigstore, brace-expansion, @babel/core. In-range acompanharam: prettier 3.9.5 (reflow de
  `api.models.ts`, sem mudanca semantica), playwright 1.61.1, msw 2.15.0 (worker regenerado),
  happy-dom 20.10.6, eslint 9.39.5.
- Nenhuma major; nenhuma regra de lint/teste relaxada. README + Dependabot alinhados.

## Collections (Task F-19.3 — `docs-SEP`, git manual)

- Postman e Insomnia com **150 requests cada** e cobertura metodo+path identica
  (**115 operacoes unicas**), alinhadas ao mesmo OpenAPI (hash acima): + Credores (19 ops +
  4 negativos), + Pix com chaves (11 ops + 2 negativos), + Governanca (7 ops), + Cobranca
  (5: inadimplencia/contato/renegociacao/aceite/recusa); variantes de webhook kyb/pld
  espelhadas nas duas (assimetrias pre-existentes corrigidas nas duas direcoes). Rotulos de
  requests pre-Sprint 14 divergem em estilo entre as ferramentas (mesmas operacoes).
- Convencoes: Idempotency-Key por intencao; replay reutiliza a mesma variavel conscientemente;
  exemplos negativos de 400/401-403 (step-up)/404 owner-scoped neutro/409; chave Pix exemplo
  inequivocamente ficticia; **zero segredo/PII/chave bruta versionado** — CPF/CNPJ sinteticos
  e secrets de webhook (`dev-*-change-me`) removidos no review manual e substituidos por
  variaveis vazias (`cpfTeste`/`cnpjTeste`/secrets), preenchidas localmente a partir do
  `application-dev.yml`.
- Exclusoes justificadas: `roles/{role}` e `provider/{tipoChamada}` cobertos por exemplares
  literais (`FINANCEIRO`, `KYC`); webhooks genericos cobertos pelas variantes concretas.
- Smoke HTTP real contra `:8080` (usuario de teste): 404 neutro owner-scoped e 403 role-based
  confirmados; import GUI fica para o dev.

## ADR 0018 (Task F-19.4 — `docs-SEP`, git manual)

Decisao: **ADIAR** Angular 22. Sem driver de seguranca (audit 0); Angular 20 em LTS ate
2026-11-28; Angular 22 exige Node 22+ (CI roda Node 20) + TypeScript 6 + majors da cadeia de
teste (@analogjs 2.x, Vitest 4, angular-eslint 22, Testing Library 19). Gatilhos: planejamento
infra/CI da Fase 5, revisao 2026-09-30, advisory runtime sem fix na serie 20 (imediato).

## CI (Task F-19.5)

- Step `Contract check (OpenAPI snapshot)` no job de qualidade do `CI-APP`, entre `format:check`
  e `lint` — offline/deterministico (le o snapshot versionado; nao sobe backend nem baixa
  OpenAPI externo). Gate cross-repo contra runtime segue local (`SEP_OPENAPI_SCHEMA`).
- Verificado: exit codes corretos, check nao muta working tree, `npm ci` sem bypass.

## Gate final (F-19.G)

- Re-export do OpenAPI ao fim da sprint: **hash identico** ao usado em contrato e collections.
- Gate completo em instalacao limpa (`npm ci`): format ✓, contract ✓, lint ✓, scss ✓,
  **Vitest 586/586** (85 arquivos; 580 do gate + 6 do hotfix pos-review), coverage publicavel,
  build ✓, **Playwright 31/31**, `npm audit` **0** (total e `--omit=dev`),
  `git diff --check` limpo.
- Code reviews por Task (cavecrew): F-19.1 com 3 findings corrigidos em `e7d6d56`; F-19.2, F-19.3
  (2 findings corrigidos nas collections) e F-19.5 sem pendencias. Review manual do dev:
  7 findings (checker, PII/secrets das collections, paridade, STATE) corrigidos em `bb825e7` +
  working tree do `docs-SEP`.

## Fora desta sprint (sem falso fechamento)

- **Tela web de chaves Pix**: collections cobrem o contrato, mas a visibilidade web continua na
  sprint dedicada pos-F-19 (Gate F-18.0; pendencia `v1.0-local`, PRD-FASE-4 §37).
- **Angular 22 efetivo**: adiado por ADR 0018.
- **Follow-ups backend de OpenAPI** (documentar step-up header, Duration, enums, required):
  registrados em `contracts/consumed-contracts.json` (`knownGaps`).

## Checklist do PR

- [x] Integracao em `develop`: os 6 commits entraram por **push direto fast-forward**
      (`bb825e7` = tip), sem PR/squash — desvio do fluxo padrao **aceito pelo dev** em
      2026-07-16 (conteudo identico ao HEAD validado; sem evil merge).
- [x] CI verde no push de `develop` (inclui novo step de contrato).
- [x] PR de promocao `develop -> main`: **PR #96** (`01ccc52`, 2026-07-16); `develop` == `main`
      conferido por conteudo. Pos-merge local: `npm ci` (0 vulns) + `format:check` +
      `contract:check` verdes.
- [x] PRD-FASE-4/STATE/CONTEXT-PARTE-2 atualizados (fechamento, working tree).
- [ ] Commits manuais do `docs-SEP` (collections + ADR 0018 + docs desta sprint).
