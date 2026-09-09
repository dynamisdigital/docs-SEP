# Steps - M-Sprint 18 - Consumo dos codigos de erro no mobile

**Spec**: [`218`](../../specs/fase-4/218-msprint-18-consumo-codigos-erro-mobile.md).
**Status em 2026-09-09**: preparacao e baseline medidas; nenhuma Task funcional iniciada.
**Destino**: `sep-mobile`; documentacao em `docs-SEP`, com Git manual.
**Branch funcional sugerida**: `feature/msprint-18-codigos-erro`, de `develop` atualizado,
depois de resolver os gates abaixo.

## Objetivo e limites

Unificar a extracao segura de erros e impedir que o usuario redigite TOTP quando o desafio ja
nao pode ser aceito. O codigo escolhe o ramo; a mensagem valida do corpo fornece o texto onde
e autoritativa. Sem nova rota, endpoint, contrato backend ou dicionario global de mensagens.

Fora: portar `contract:check`, ligar MSW ao Vitest, renovar majors de dependencias, alterar
interceptors globalmente, reabrir escopo FINANCEIRO do Gate M-16.0 ou implementar biometria/iOS.
Falhas preexistentes da baseline devem ser tratadas separadamente, antes da implementacao.

## Gate M-18.0 - Cadeia, ambiente e baseline

### Cadeia medida em 2026-09-09

- Backend: Sprint 36 em `origin/develop@a774aa4`, com conteudo igual a `origin/main@042949b`.
- Web: F-26 em `develop` pelo PR #145 e `main` pelo #146. Os remotos sao iguais, mas possuem
  dois testes duplicados de login (+28 linhas) em relacao a branch verificada da F-26.
  Correcao ja existente no working tree do `sep-app`, fora desta preparacao mobile.
- Mobile: `develop@280857e` limpo antes do merge; `git pull --ff-only` nao trouxe mudancas.
  Back-merge de `origin/main@deb5b72` executado sem conflitos, commit local **`d82caaa`**.
  `git diff origin/main HEAD` vazio: os tres arquivos de dependencias/CI sao as unicas mudancas.
  **Push manual do back-merge pendente**; `origin/develop` ainda nao inclui esse commit.

### Comandos de baseline

Executar em `sep-mobile`, depois de conferir a cadeia e o working tree:

```bash
npm ci --legacy-peer-deps
npm run format:check
npm run lint
npm run lint:scss
npm run test:coverage
npm run audit
npm run build
npm run e2e -- --workers=2
npm run cap:sync -- android
```

Android, a partir de `sep-mobile/android`, neste host Linux:

```bash
ANDROID_HOME=/home/mauricio/Android/Sdk ./gradlew assembleDebug --console=plain
```

O SDK deste host existe em `/home/mauricio/Android/Sdk`; nao reutilizar o caminho Windows
registrado por outra maquina no STATE. `local.properties` esta ausente. Node >=22 e JDK 21
sao os requisitos da baseline nativa (ADR 0019).

| Gate | Resultado em `d82caaa` |
|---|---|
| Instalacao limpa | Passou; 1375 pacotes instalados |
| Format / lint / SCSS | Passaram, exit 0 |
| Vitest com cobertura | **527 testes / 70 arquivos**, 0 falhas; statements/linhas 87,09%, branches 87,78%, funcoes 79,74% |
| Build PWA | Passou; warnings preexistentes de budget SCSS |
| Playwright | **41 testes**, 0 falhas, 2 workers, 1,1 min |
| Audit | **Reprovou**, exit 1: 20 vulnerabilidades (1 low, 11 moderate, **8 high**, 0 critical) |
| Capacitor sync Android | Passou, 5 plugins reconhecidos, sem diff versionado |
| Assemble debug | Passou em 56s, 243 tasks (179 executadas / 64 up-to-date); APK debug gerado |

Os oito pacotes classificados como high pelo npm audit: `@angular-devkit/build-angular`,
`@xmldom/xmldom`, `browserslist`, `fast-uri`, `image-size`, `js-yaml`, `less`, `nanoid`.
O relatorio sugere major de Analog para parte da cadeia; isso **nao prova** que major seja a
unica solucao. Investigar a cadeia em trabalho proprio; nao usar `npm audit fix --force`.
O back-merge nao zerou o audit. Baseline funcional verde nao equivale a gate completo verde.

Logs locais desta medicao: `/tmp/m18-gate-0.log` (format), `1` (lint), `2` (SCSS),
`3` (coverage), `4` (audit JSON), `5` (build), `6` (Playwright) e `/tmp/m18-android.log`.
Sao artefatos temporarios; os resultados acima sao o registro duravel.

### Reconferencias do escopo

1. Recontar casts: `rg -n 'as ApiErrorResponse' src/app -g '!*.spec.ts'`.
   Medido: **9**, em **8 arquivos**, exatamente os da spec 218.
2. `core/api/api-error.ts` nao existe; `ApiErrorResponse` ainda nao tem `codigo`.
3. Login so ramifica `401` e `423`. `AUTH-423-001` esta publicado; o `401` segue sem codigo.
   Nao inventar codigo de credenciais nem converter todo `status` em catalogo local.
4. `verify-totp` trata `423` e usa o mesmo toast para os demais erros. O template ja tem estado
   `challengeAusente`, mas nao distingue desafio expirado de conta sem MFA.
5. MSW nao tem `/auth/totp/verify`; login mockado devolve `mfaRequired: false`
   (`handlers.ts`, comentario sobre `TOTP_INVALIDO`). Nao declarar jornada MFA offline coberta.
6. Confirmar catalogo e handlers em `sep-api`: `AUTH-423-001`, `MFA-400-002/003/004` publicados.
   O catalogo nao cobre todos os erros; `401/403/429` da cadeia de seguranca seguem sem codigo.
7. **Codigo TOTP em branco nao produz `MFA-400-002`**: bean validation o recusa antes do
   use case, sem `codigo`. Ordem: validacao -> desafio (`004`) -> MFA habilitado (`003`) ->
   verificacao TOTP (`002`). Smoke registrado pela F-26; reconferir no fechamento funcional.
8. Nao assumir que fixture tipado garante contrato: medir o typecheck dos specs antes de
   usar erro de compilacao como prova. O build deve validar consumidores de producao.

## Ordem e protocolo

Gate M-18.0 -> 218.1 -> 218.2 -> 218.3 -> 218.4 -> 218.5 -> fechamento.

Em cada Task: conferir fonte atual, escrever teste de comportamento afetado, implementar o
minimo, validar e apresentar checkpoint com status/diff, testes, riscos e mensagem sugerida.
Commit somente com aprovacao; paths explicitos. Push/PR manuais. Aplicar `coding-guidelines`,
`clean-code`, `codenavi`, `code-review-skill` e a lente de produto conforme o escopo.
Nenhuma Task funcional esta autorizada por este documento de preparacao.

## Task 218.1 - Campo opcional no modelo

- Adicionar `codigo?: string` somente a `ApiErrorResponse` em `core/api/api.models.ts`.
- Preservar os campos obrigatorios `codigo` dos requests MFA/step-up. Evitar substituicao global.
- Documentar que ausencia e esperada, sem contagem perecivel de codigos no docblock.
- Validar `build`, lint e diff restrito. Nao criar teste que apenas repita a interface.

**Commit sugerido**: `feat(api): declarar codigo opcional no erro mobile`.

## Task 218.2 - Helper e migracao dos nove casts

- Criar `core/api/api-error.ts` com extratores de mensagem e codigo recebendo `unknown`.
  Conferir o helper web como referencia; manter convencoes locais e evitar dependencia entre repos.
- Validar `HttpErrorResponse`, corpo objeto nao nulo e campo string nao vazio apos `trim`.
  Sem coercoes de numeros/objetos e sem excecao para corpo inesperado. Definir retorno ausente
  consistente para permitir fallback explicito no chamador.
- Migrar as duas leituras de `change-password`, `step-up`, `renegociacao-detail`,
  `open-finance`, `proposta-create`, `proposta-detail`, `contrato-detail` e `onboarding-error`.
- Preservar os fallbacks e a interpretacao local das mensagens nas regras existentes de
  renegociacao/contrato. Nao trocar ramificacao de negocio incidentalmente nesta Task.
- Testar corpo ausente, null, string/HTML, campo numerico/objeto, string vazia/espacos, erro
  nao HTTP e mensagem/codigo validos. Testar comportamento de cada chamador afetado, inclusive
  defaults e referencia de suporte; nao apenas chamadas do helper.
- Aceite: busca por `as ApiErrorResponse` vazia fora do helper; suites afetadas, lint e build verdes.

**Commit sugerido**: `refactor(api): unificar extracao segura dos erros mobile`.

## Task 218.3 - Consumo com recuperacao adequada

Medir o valor do ramo do login antes de alterá-lo: `423` ja leva a `/account-locked` nas
camadas existentes. Se o codigo nao mudar a acao, registrar que o ramo por status permanece;
nao criar um ramo redundante apenas para ter consumidor de `AUTH-423-001`.

O ganho observavel esta no `400` do TOTP:

| Resposta | Comportamento a implementar e testar |
|---|---|
| `400` + `MFA-400-002` | Manter formulario e permitir nova tentativa; mostrar mensagem valida ou fallback |
| `400` + `MFA-400-003` | Encerrar tentativa; explicar indisponibilidade do MFA e oferecer retorno ao login |
| `400` + `MFA-400-004` | Encerrar tentativa; informar desafio expirado/invalido e oferecer novo login |
| Codigo ausente/desconhecido/nao-string | Preservar fallback por status; nao lançar nem presumir estado terminal |
| `423`, com/sem codigo | Preservar navegacao de conta bloqueada e limpeza da sessao pelo interceptor |

- Nao reutilizar texto fixo "Sessao expirada" para conta sem MFA. Estados terminais precisam
  manter mensagem visivel; toast de 3 segundos sozinho nao explica formulario encerrado.
- Barrar submit programatico e biometria depois de estado terminal, nao so esconder controles.
- Preservar sucesso, guard de reentrada, redirecionamento de redefinicao de senha e cancelamento.
- Conferir persistencia de pending MFA e reentrada na rota; nao chamar `clearSession()` apenas
  para apagar desafio sem avaliar efeitos. Reusar operacao especifica se existir; caso precise
  criá-la, cobrir estado em memoria e storage, sem alterar politica global de sessao.
- Testes do componente devem provar formulario presente/ausente, retorno ao login, texto e
  nenhuma nova chamada apos estado terminal, nao apenas valor de um signal.

**Commit sugerido**: `feat(auth): distinguir falhas TOTP por codigo no mobile`.

## Task 218.4 - Mock fiel ao perimetro

- Permitir `codigo` opcional em `errorResponse`, sem alterar indiscriminadamente os chamadores.
- Publicar `AUTH-423-001` no mock de bloqueio do login; `401` e validacao continuam sem codigo.
- Nao inferir um codigo a partir de todo status HTTP. Conferir cada inclusao com handler/catalogo.
- O MSW nao cobre MFA hoje. Para o E2E do ramo TOTP, usar fixture HTTP explicita e isolada no
  Playwright com desafio persistido pelo mecanismo real do app; declarar a interceptacao.
  Um simulador global de MFA/backup codes nao faz parte desta Task.
- Cobrir a resposta mockada do login no Playwright; Vitest usa os doubles existentes e nao
  prova o `handlers.ts`. Manter comentarios sobre limites do mock coerentes com o que existir.

**Commit sugerido**: `test(mocks): alinhar codigos de erro mobile ao backend`.

## Task 218.5 - Regressao, mutacao e smoke

- Rodar suite completa e Playwright. Piso inicial: 527/70 e 41; testes novos aumentam o piso,
  e queda de contagem exige justificativa por conteudo, nao compensacao com testes duplicados.
- Aplicar individualmente e verificar no diff antes de rodar: retirar guarda de tipo, aceitar
  vazio/espacos, trocar os ramos `003/004` pelo legado, encerrar formulario no `002`, eliminar
  fallback sem codigo e remover a barreira de reenvio terminal. Cada mutante deve falhar no
  teste da propriedade correspondente. Restaurar apenas a alteracao propria e conferir diff.
- Sobrevivente e achado a investigar. Nao alterar expectativa para produzir verde artificial.
- Smoke real: desafio invalido com codigo nao vazio -> `MFA-400-004`; campo em branco ->
  validacao sem codigo. `003/002` precisam de fixture/conta apropriada; ausencia de acesso
  deve ser registrada, sem apresentar teste interceptado como prova do backend.
- Conferir `withSupportReference`: preservar `codigo` e texto de suporte na cadeia HTTP real.

**Commit sugerido**: `test(auth): verificar recuperacao TOTP e compatibilidade mobile`.

## Fechamento

- Repetir gates depois dos commits se hooks modificarem arquivos; build PWA antes do cap sync.
- Audit high/critical precisa estar verde para declarar sprint pronta; nao herdar vermelho
  silenciosamente. Android e smoke devem ter resultado ou bloqueio explicito.
- Revisar diff por conteudo contra a baseline, templates e comentarios tornados falsos.
- Atualizar spec/STATE/PRD/roadmap; criar descricao temporaria do PR em
  `docs-SEP/repos/sep-mobile/SPRINT-M-18-PR.md` apenas ao concluir a sprint.
- Na abertura da implementacao, remover descricoes temporarias anteriores ja usadas conforme
  AGENT.md; nao remover durante esta preparacao nem confundir com encerramento funcional.
- Apos push/PR manuais, conferir conteudo de feature/develop/main; hashes diferentes por squash
  nao demonstram perda, e hashes de merge nao demonstram preservacao.
