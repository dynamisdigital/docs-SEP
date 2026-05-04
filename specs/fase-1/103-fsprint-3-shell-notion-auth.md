# Spec 103 - F-Sprint 3 - Integracao Auth Real + Shell Notion + Guards

## Metadados

- **ID da Spec**: 103
- **Titulo**: F-Sprint 3 - Substituir MSW por API real + Shell autenticado Notion + Guards funcionais
- **Status**: aprovada para execucao (apos conclusao da F-Sprint 2 e Sprint 3 backend)
- **Fase do produto**: Epic 12 - Fundacao Frontend
- **Trilha**: Frontend (paralela a Sprint 3 backend)
- **Origem**: PRD - API SEP, Secao 22 (Trilha paralela Frontend) + Plano de melhorias R7
- **Depende de**: [`102-fsprint-2-telas-apple-publicas.md`](./102-fsprint-2-telas-apple-publicas.md) e Sprint 3 backend (Tasks 3.1, 3.2)
- **Responsavel principal**: Dev Pleno Frontend 1 + Dev Pleno Frontend 2

## Objetivo

Trocar a camada de MSW por **API real** entregue pela Sprint 3 backend (login + `/auth/me`), implementar o **shell autenticado** seguindo o design system Notion (header, sidenav, breadcrumbs), e introduzir **Functional Guards** + **HTTP interceptors** para proteger rotas e tratar 401/403 de forma centralizada. Esta e a primeira F-Sprint que depende efetivamente do backend pronto.

## Escopo

### Em escopo
- Substituicao do MSW pelo backend real (mantendo MSW disponivel via flag `dev-offline`)
- Shell autenticado seguindo `DESIGN-notion.md`: header, sidenav collapsable, breadcrumbs
- Functional Guards (Angular 20): `auth.guard.ts` e `role.guard.ts`
- HTTP interceptors funcionais: `auth.interceptor.ts` (anexa Bearer token) e `error.interceptor.ts` (trata 401/403)
- Tratamento de sessao expirada: 401 limpa sessao e redireciona
- Pagina "acesso negado" para 403
- Testes Vitest cobrindo guards, interceptors e shell

### Fora de escopo nesta F-Sprint
- Telas autenticadas concretas (perfil, alterar senha, admin) — F-Sprint 4
- Smoke E2E completo — F-Sprint 4
- Telas das jornadas funcionais (Epic 13)

## Pre-requisitos globais

- F-Sprint 2 concluida (telas Apple + auth.service.ts + MSW funcionais)
- Sprint 3 backend Task 3.1 entregue (`POST /auth/login`, `GET /auth/me`)
- Sprint 3 backend Task 3.2 entregue (autorizacao por perfil, `403` para clientes em rotas admin)
- Tokens Notion disponiveis (F-Sprint 1)
- Backend rodando localmente (Docker Compose Postgres + Spring Boot)

## Tasks

### Task F-3.1 - Substituir MSW por API real (login + /me)

**Descricao**
Apontar `auth.service.ts` para a URL real do backend Sprint 3. Manter MSW disponivel via flag para desenvolvimento offline.

**Arquivos esperados**
- update em `src/app/core/auth/auth.service.ts` (URL configuravel via `environment.ts`)
- `src/environments/environment.ts` (URL real)
- `src/environments/environment.dev-offline.ts` (URL de MSW, opcional)
- atualizacao do `src/main.ts` para condicionalmente subir MSW

**Criterios de verificacao**
- login real funciona contra backend rodando localmente
- token armazenado e enviado em `Authorization: Bearer <token>` para `/auth/me`
- erros 401/403 sao tratados via interceptor (ver F-3.3)
- MSW pode ser ativado via flag de build (`--configuration dev-offline`) para desenvolvimento sem backend

**Pre-requisitos**
- Sprint 3 backend concluida (Task 3.1 entregue endpoint `/auth/login` e `/auth/me`)

**Dependencias**
- depende de Sprint 3 backend Task 3.1

**Responsavel sugerido**
- Dev Pleno Frontend 2

---

### Task F-3.2 - Shell Autenticado Notion

**Descricao**
Implementar o shell autenticado seguindo `DESIGN-notion.md`: header com logo + user menu, menu lateral (collapsable), breadcrumbs, area de conteudo.

**Arquivos esperados**
- `src/app/layout/shell/shell.component.ts`
- `src/app/layout/header/header.component.ts`
- `src/app/layout/sidenav/sidenav.component.ts`
- `src/app/layout/breadcrumbs/breadcrumbs.component.ts`

**Criterios de verificacao**
- visualmente fiel a Notion
- responsivo (breakpoints do Notion)
- testes Vitest cobrem navegacao basica
- sidenav collapsable funcionando
- user menu mostra dados do `/auth/me`

**Pre-requisitos**
- F-Sprint 1 concluida (tokens Notion disponiveis)
- Task F-3.1 concluida (auth real para popular o user menu)

**Dependencias**
- depende de F-3.1

**Responsavel sugerido**
- Dev Pleno Frontend 1

---

### Task F-3.3 - Guards funcionais + interceptors

**Descricao**
Functional Guards (Angular 20) para proteger rotas autenticadas + interceptor HTTP para anexar token e tratar 401/403.

**Arquivos esperados**
- `src/app/core/guards/auth.guard.ts` (functional guard)
- `src/app/core/guards/role.guard.ts` (verifica `ROLE_ADMIN` para rotas admin)
- `src/app/core/interceptors/auth.interceptor.ts` (functional interceptor)
- `src/app/core/interceptors/error.interceptor.ts`
- `src/app/features/error/access-denied.component.ts` (pagina 403)

**Criterios de verificacao**
- rota protegida sem token redireciona para `/login`
- 401 do backend limpa sessao e redireciona
- 403 mostra pagina "acesso negado"
- testes Vitest cobrem guards e interceptors

**Pre-requisitos**
- Tasks F-3.1, F-3.2 concluidas

**Dependencias**
- depende de F-3.1 e F-3.2

**Responsavel sugerido**
- Dev Pleno Frontend 2

---

## Grafo de dependencias entre as tasks

```
Sprint 3 backend (Task 3.1) concluida
            |
            v
        F-3.1 (auth real) --+
                            |
                            v
        F-3.2 (shell Notion) [pode comecar em paralelo apos F-3.1]
                            |
                            v
                        F-3.3 (guards + interceptors)
```

## Definicao de pronto da F-Sprint 3

- Login real funcionando contra backend Sprint 3
- Token JWT enviado em `Authorization: Bearer` para `/auth/me`
- MSW disponivel via flag para fallback `dev-offline`
- Shell Notion implementado: header, sidenav, breadcrumbs, user menu
- Functional Guards `auth` e `role` funcionais
- HTTP interceptors `auth` e `error` funcionais
- Pagina "acesso negado" para 403
- Sessao expirada (401) limpa estado e redireciona para login
- Testes Vitest cobrindo guards, interceptors e shell
- CI Frontend verde

## Impacto na F-Sprint seguinte

A F-Sprint 4 (`specs/104-fsprint-4-telas-autenticadas.md`) consome:
- Shell Notion para envolver as telas autenticadas
- Guards e interceptors para proteger rotas (perfil, admin)
- `auth.service.ts` ja apontando para backend real

## Profile `local-wiremock` (alternativa para Frontend desenvolver sem credenciais Celcoin)

A partir da Epic 5 (Onboarding KYC/KYB), o backend ganha um profile `local-wiremock` (ver [ADR 0008](../../adr/0008-wiremock-para-testes-integracao-celcoin.md)) que aponta `app.celcoin.base-url` para um WireMock local em `http://localhost:8089`. Stubs WireMock simulam respostas Celcoin deterministicas.

**Importante para o frontend**: nas F-Sprints 0-4 (escopo desta trilha), o backend nao depende de Celcoin ainda — entao MSW e o suficiente. O profile `local-wiremock` so se torna relevante quando a Epic 13 (Frontend de Jornadas) for desenvolvida, depois da Epic 5 backend introduzir os primeiros adapters Celcoin.

### Quando usar `local-wiremock` ao inves de MSW (futuro, Epic 13)

| Cenario | Recomendacao |
|---------|--------------|
| Desenvolvimento das telas das F-Sprints 1-4 (auth, usuarios, admin) | **MSW** (mais rapido, nao precisa subir backend) |
| Desenvolvimento de jornadas que dependem de Celcoin (Epic 13 - onboarding, credito, etc.) | **`local-wiremock`** (testa integracao end-to-end real, sem credenciais Celcoin) |
| Smoke E2E em PR | `local-wiremock` em ambiente CI ou mock no Frontend conforme custo |

### Como rodar (futuro, Epic 13+)

```bash
# Terminal 1: subir backend com profile local-wiremock
cd backend
./gradlew bootRun --args='--spring.profiles.active=local-wiremock'

# Terminal 2: subir WireMock standalone com mappings de Celcoin
java -jar wiremock-standalone.jar --port 8089 --root-dir wiremock/celcoin-mock

# Terminal 3: subir Frontend
cd apps/sep-frontend
npm run start
```

Detalhes finais (mappings, scripts auxiliares) ficam para a Epic 5 quando o primeiro adapter Celcoin for implementado.

## Restricoes e regras de execucao

- F-Sprint 3 **depende** do backend Sprint 3 estar entregue (especialmente Tasks 3.1 e 3.2)
- Caso o backend atrase, F-Sprint 3 pode ser parcialmente adiantada usando MSW estendido (mas sem garantir compatibilidade real)
- Code review do Dev Senior obrigatorio para validar contratos HTTP (formato JWT, claims, codigos de erro)
- Tests obrigatorios em cada PR

## Referencias

- [PRD - API SEP §14 (JWT), §15 (Auditoria), §22](../../docs-sep/PRD.md)
- [DESIGN-notion.md](../../docs-sep/DESIGN-notion.md)
- [WEB-SCREENS-PLAN.md §5.4](../../docs-sep/WEB-SCREENS-PLAN.md)
- [ADR 0008 - WireMock](../../adr/0008-wiremock-para-testes-integracao-celcoin.md)
- [Spec 003 - Sprint 3 backend (paralela)](./003-sprint-3-seguranca-autenticacao.md)
- [Spec 102 - F-Sprint 2 (anterior)](./102-fsprint-2-telas-apple-publicas.md)
- [Spec 104 - F-Sprint 4 (proxima)](./104-fsprint-4-telas-autenticadas.md)
