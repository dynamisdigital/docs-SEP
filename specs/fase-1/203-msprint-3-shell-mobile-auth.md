# Spec 203 - M-Sprint 3 - Auth Real + Shell Mobile + Guards

## Metadados

- **ID da Spec**: 203
- **Titulo**: M-Sprint 3 - Substituir MSW por API real + Shell mobile autenticado (tabs inferiores) + Guards
- **Status**: aprovada para execucao (apos M-Sprint 2 e Sprint 3 backend)
- **Fase do produto**: Epic 14 - Mobile SEP
- **Trilha**: Mobile (paralela a Sprint 3 backend e F-Sprint 3 frontend web)
- **Origem**: PRD - API SEP, Secao 22 + MOBILE-SCREENS-PLAN.md secoes 6.5
- **Depende de**: [`202-msprint-2-telas-publicas-mobile.md`](./202-msprint-2-telas-publicas-mobile.md) e Sprint 3 backend (Tasks 3.1, 3.2)
- **Responsavel principal**: Dev Mobile

## Objetivo

Trocar a camada de MSW por **API real** entregue pela Sprint 3 backend (login + `/auth/me`), implementar o **shell mobile autenticado** com tabs inferiores e header simples, e introduzir Functional Guards + HTTP interceptors para proteger rotas autenticadas e tratar 401/403/sessao expirada de forma centralizada. Esta e a primeira M-Sprint que depende efetivamente do backend pronto.

## Escopo

### Em escopo
- Substituicao do MSW pelo backend real (mantendo MSW disponivel via flag `dev-offline`)
- Configuracao de URL do backend via `environment.ts` (apontar para `http://localhost:8080` em dev)
- Shell mobile autenticado: tabs inferiores (Inicio / Propostas / Parcelas / Perfil para tomador; Inicio / Oportunidades / Operacoes / Perfil para credora), header simples
- Functional Guards (Angular 20): `auth.guard.ts` e `role.guard.ts`
- HTTP interceptors funcionais: `auth.interceptor.ts` (anexa Bearer token) e `error.interceptor.ts` (trata 401/403/sessao expirada)
- Tratamento de sessao expirada: 401 limpa Capacitor Preferences e redireciona para `/welcome`
- Tela "sessao expirada" e "acesso negado"
- Decisao de jornada: apos login, identificar role do usuario e direcionar para o shell correto (tomador vs credora). Por enquanto, ambos os roles `ADMIN` e `CLIENTE` veem o shell de tomador como casca; a separacao real vira na Epic 14 Fase Mobile 2+
- Testes Vitest cobrindo guards, interceptors e shell

### Fora de escopo nesta M-Sprint
- Telas autenticadas concretas (perfil, alterar senha, casca tomador, casca credora) — M-Sprint 4
- Smoke E2E completo — M-Sprint 4
- Telas das jornadas funcionais (Epic 14 Fase Mobile 2+)
- Capacitor build Android/iOS (fica para fase posterior, depois das M-Sprints 0-4 estabilizarem)

## Pre-requisitos globais

- M-Sprint 2 concluida (telas publicas + auth.service.ts + MSW funcionais)
- Sprint 3 backend Task 3.1 entregue (`POST /auth/login`, `GET /auth/me`)
- Sprint 3 backend Task 3.2 entregue (autorizacao por perfil)
- Tokens Notion mobile disponiveis (M-Sprint 1)
- Backend rodando localmente (Docker Compose Postgres + Spring Boot)
- CORS configurado no backend para aceitar `http://localhost:8100` (porta padrao Ionic)

## Tasks

### Task M-3.1 - Substituir MSW por API real (login + /me)

**Descricao**
Apontar `auth.service.ts` para a URL real do backend Sprint 3. Manter MSW disponivel via flag `dev-offline` para desenvolvimento sem backend.

**Arquivos esperados**
- update em `src/app/core/auth/auth.service.ts` (URL configuravel via `environment.ts`)
- `src/environments/environment.ts` (URL real: `http://localhost:8080`)
- `src/environments/environment.dev-offline.ts` (URL de MSW)
- atualizacao do `src/main.ts` para condicionalmente subir MSW
- `src/app/core/auth/token-storage.service.ts` ja existe da M-Sprint 2 (Capacitor Preferences)

**Criterios de verificacao**
- Login real funciona contra backend rodando localmente
- Token armazenado em Capacitor Preferences e enviado em `Authorization: Bearer <token>` para `/auth/me`
- Erros 401/403 sao tratados via interceptor (ver M-3.3)
- MSW pode ser ativado via `--configuration dev-offline` para desenvolvimento sem backend
- CORS funciona (backend aceita origem `localhost:8100`)

**Pre-requisitos**
- Sprint 3 backend Task 3.1 concluida

**Dependencias**
- depende de Sprint 3 backend Task 3.1

**Responsavel sugerido**
- Dev Mobile

---

### Task M-3.2 - Shell Mobile Autenticado (tabs inferiores)

**Descricao**
Implementar o shell autenticado mobile usando `<ion-tabs>` com tabs inferiores customizados via tokens Notion (M-Sprint 1). Header simples com nome do usuario e botao de logout.

**Arquivos esperados**
- `src/app/layout/shell/shell.component.ts`
- `src/app/layout/shell/shell.component.html`
- `src/app/layout/header-mobile/header-mobile.component.ts`
- `src/app/layout/tabs/tabs.component.ts` (logica de visibilidade de tabs por role)

**Estrutura inicial das tabs (per MOBILE-SCREENS-PLAN.md §9)**

Para tomador (role `CLIENTE`):
- Inicio
- Propostas (placeholder ate Epic 14 Fase 2)
- Parcelas (placeholder ate Epic 14 Fase 2)
- Perfil

Para empresa credora (role futura, separar de `CLIENTE` na Epic 11):
- Inicio
- Oportunidades (placeholder ate Epic 14 Fase 3)
- Operacoes (placeholder ate Epic 14 Fase 3)
- Carteira (placeholder ate Epic 14 Fase 3)
- Perfil

**Lacuna a confirmar (per MOBILE-SCREENS-PLAN.md §14)**
> Definir nomenclatura futura de perfis para diferenciar tomador e empresa credora, pois hoje a base inicial possui apenas `ROLE_ADMIN` e `ROLE_CLIENTE`.

Por enquanto, na M-Sprint 3, o shell exibe as tabs de **tomador** para `CLIENTE` (placeholder) e tabs administrativas reduzidas para `ADMIN`. A separacao real entre tomador e credora vira em fase posterior.

**Criterios de verificacao**
- Tabs inferiores visualmente fieis ao Notion mobile-adaptado
- Tabs ativas/inativas com peso 600/400 (tipografia Notion)
- Header simples com nome do usuario do `/auth/me`
- Botao de logout limpa Capacitor Preferences e redireciona para `/welcome`
- Responsivo (375px ate tablets em modo retrato)
- Testes Vitest cobrem renderizacao + navegacao basica

**Pre-requisitos**
- M-Sprint 1 concluida (tokens Notion mobile + tabs customizadas)
- Task M-3.1 concluida (auth real para popular header)

**Dependencias**
- depende de M-3.1

**Responsavel sugerido**
- Dev Mobile

---

### Task M-3.3 - Guards funcionais + interceptors

**Descricao**
Functional Guards (Angular 20) para proteger rotas autenticadas + interceptor HTTP para anexar token e tratar 401/403/sessao expirada.

**Arquivos esperados**
- `src/app/core/guards/auth.guard.ts` (functional guard)
- `src/app/core/guards/role.guard.ts` (verifica `ROLE_ADMIN` ou `ROLE_CLIENTE`)
- `src/app/core/interceptors/auth.interceptor.ts` (functional interceptor)
- `src/app/core/interceptors/error.interceptor.ts`
- `src/app/features/error/access-denied.component.ts` (pagina 403)
- `src/app/features/error/session-expired.component.ts` (pagina 401)

**Criterios de verificacao**
- Rota protegida sem token redireciona para `/login`
- 401 do backend limpa Capacitor Preferences e redireciona para `/welcome` com toast "sessao expirada"
- 403 mostra pagina "acesso negado" com botao voltar
- Testes Vitest cobrem guards e interceptors

**Pre-requisitos**
- Tasks M-3.1, M-3.2 concluidas

**Dependencias**
- depende de M-3.1 e M-3.2

**Responsavel sugerido**
- Dev Mobile

---

## Grafo de dependencias entre as tasks

```
Sprint 3 backend (Task 3.1) concluida
            |
            v
        M-3.1 (auth real) --+
                            |
                            v
        M-3.2 (shell mobile) [depende de M-3.1]
                            |
                            v
                        M-3.3 (guards + interceptors)
```

## Definicao de pronto da M-Sprint 3

- Login real funcionando contra backend Sprint 3
- Token JWT armazenado em Capacitor Preferences e enviado em `Authorization: Bearer` para `/auth/me`
- MSW disponivel via `--configuration dev-offline` para fallback offline
- Shell mobile com tabs inferiores e header simples implementado
- Functional Guards `auth` e `role` funcionais
- HTTP interceptors `auth` e `error` funcionais
- Pagina "sessao expirada" (401) e "acesso negado" (403)
- Logout limpa Preferences e redireciona para welcome
- Testes Vitest cobrindo guards, interceptors e shell
- Mobile CI verde

## Impacto na M-Sprint seguinte

A M-Sprint 4 (`specs/204-msprint-4-telas-autenticadas-mobile.md`) consome:
- Shell mobile para envolver as telas autenticadas
- Guards e interceptors para proteger rotas
- `auth.service.ts` apontando para backend real
- Token storage operacional

## Diferenca de tabs entre roles (decisao temporaria)

Ate a Epic 11 (Administracao e Governanca) introduzir uma separacao formal entre `TOMADOR` e `EMPRESA_CREDORA`:

- `ROLE_CLIENTE` ve tabs de tomador (Inicio / Propostas / Parcelas / Perfil) — todas placeholder ate Epic 14 Fase 2
- `ROLE_ADMIN` ve tabs administrativas reduzidas (Inicio / Perfil) — adicional admin sera implementado conforme demanda
- Nao ha separacao de empresa credora ate roles dedicadas existirem (PRD §6 lista visitante, cliente, administrador; credora vem em fase posterior)

## Restricoes e regras de execucao

- M-Sprint 3 **depende** do backend Sprint 3 estar entregue (especialmente Tasks 3.1 e 3.2)
- Caso o backend atrase, M-Sprint 3 pode ser parcialmente adiantada usando MSW estendido + assumindo contratos do PRD §21
- Code review do Dev Senior obrigatorio para validar contratos HTTP (formato JWT, claims, codigos de erro, CORS)
- Tests obrigatorios em cada PR
- Validar fluxo completo em PWA + Chrome DevTools mobile viewport (375x812 iPhone-like)

## Referencias

- [PRD - API SEP §6 (perfis), §14 (JWT), §22](../../docs-sep/PRD.md)
- [DESIGN-notion.md](../../docs-sep/DESIGN-notion.md)
- [MOBILE-SCREENS-PLAN.md §6.5, §9](../../docs-sep/MOBILE-SCREENS-PLAN.md)
- [Capacitor Preferences API](https://capacitorjs.com/docs/apis/preferences)
- [Spec 003 - Sprint 3 backend (paralela)](./003-sprint-3-seguranca-autenticacao.md)
- [Spec 103 - F-Sprint 3 frontend web (paralela)](./103-fsprint-3-shell-notion-auth.md)
- [Spec 202 - M-Sprint 2 (anterior)](./202-msprint-2-telas-publicas-mobile.md)
- [Spec 204 - M-Sprint 4 (proxima)](./204-msprint-4-telas-autenticadas-mobile.md)
