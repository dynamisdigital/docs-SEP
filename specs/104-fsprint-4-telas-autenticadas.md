# Spec 104 - F-Sprint 4 - Telas Autenticadas Iniciais + Smoke E2E

## Metadados

- **ID da Spec**: 104
- **Titulo**: F-Sprint 4 - Perfil, Alterar Senha, Admin de Usuarios, Dashboard casca + Smoke E2E
- **Status**: aprovada para execucao (apos conclusao da F-Sprint 3 e Sprint 4 backend)
- **Fase do produto**: Epic 12 - Fundacao Frontend (ultima F-Sprint da trilha)
- **Trilha**: Frontend (paralela a Sprint 4 backend)
- **Origem**: PRD - API SEP, Secao 22 (Trilha paralela Frontend) + Plano de melhorias R7
- **Depende de**: [`103-fsprint-3-shell-notion-auth.md`](./103-fsprint-3-shell-notion-auth.md) e Sprint 3 backend (Tasks 3.2, 3.3)
- **Responsavel principal**: Dev Pleno Frontend 1 + Dev Pleno Frontend 2

## Objetivo

Fechar a Fundacao Frontend (Epic 12) entregando as telas autenticadas iniciais: meu perfil, alterar senha, administracao de usuarios (apenas ADMIN), e dashboard administrativa em formato de casca. Validar o golden path com **smoke E2E Playwright** rodando contra backend real. Ao final, o "Frontend MVP" e demonstravel para stakeholders, e a Epic 13 (Frontend de Jornadas) pode ser iniciada.

> **Nota apos [ADR 0009 - Separacao de Canal por Perfil](../adr/0009-separacao-de-canal-por-perfil.md)**: as telas autenticadas desta F-Sprint focam em **usuarios internos** (admin, financeiro, backoffice). A jornada do **tomador nao tem versao web** — fica integralmente no mobile (Epic 14). A jornada da **empresa credora completa** (KYB, carteira, oportunidades, operacoes financiadas) entra no escopo da Epic 13 (Frontend de Jornadas), apos as APIs das Epics 5-11 estarem publicadas.

## Escopo

### Em escopo
- Tela "Meu Perfil" — dados do `/auth/me` + link para alterar senha
- Tela "Alterar Senha" — form com senha atual + nova senha + confirmacao
- Tela "Administracao de Usuarios" — tabela consumindo `GET /api/v1/usuarios` (apenas ADMIN)
- Tela "Detalhe de Usuario" — `GET /api/v1/usuarios/{id}` com role guard
- Dashboard administrativa em formato de casca (placeholder navegavel)
- Smoke E2E Playwright cobrindo o golden path completo
- CI Frontend rodando E2E em PR (idealmente apos Sprint 4 backend completa)

### Fora de escopo nesta F-Sprint
- Telas das jornadas funcionais (Epic 13 - Frontend de Jornadas)
- Cobertura E2E exaustiva (apenas golden path)
- Mobile (Epic 14)

## Pre-requisitos globais

- F-Sprint 3 concluida (shell Notion + auth real + guards + interceptors)
- Sprint 3 backend Task 3.2 entregue (`GET /api/v1/usuarios`, `GET /api/v1/usuarios/{id}` com autorizacao)
- Sprint 3 backend Task 3.3 entregue (`PATCH /api/v1/usuarios/{id}/senha`)
- Sprint 4 backend para Smoke E2E completo (Task F-4.5 depende disso)

## Tasks

### Task F-4.1 - Tela Meu Perfil

**Descricao**
Tela mostrando dados do `/auth/me`, com link para alterar senha. Estilo Notion.

**Arquivos esperados**
- `src/app/features/authenticated/profile/profile.component.ts`
- `profile.component.html`, `profile.component.scss`

**Criterios de verificacao**
- consome `/auth/me` e exibe id, email, role, datas de auditoria
- estilo Notion fiel (cards, tipografia, espacamento)
- link "Alterar senha" funcional
- testes Vitest cobrem renderizacao e fetch
- responsivo

**Pre-requisitos**
- F-Sprint 3 concluida

**Dependencias**
- nenhuma dentro desta F-Sprint (pode ser primeira)

**Responsavel sugerido**
- Dev Pleno Frontend 2

---

### Task F-4.2 - Tela Alterar Senha

**Descricao**
Form com senha atual + nova senha + confirmacao, consumindo `PATCH /api/v1/usuarios/{id}/senha`.

**Arquivos esperados**
- `src/app/features/authenticated/profile/change-password/change-password.component.ts`
- `change-password.component.html`, `change-password.component.scss`

**Criterios de verificacao**
- form valida senha atual obrigatoria, nova senha 6 chars exatos, confirmacao igual a nova
- erro de senha atual incorreta exibe feedback (backend retorna excecao mapeada)
- sucesso retorna feedback e mantem usuario autenticado
- testes Vitest cobrem validacao + sucesso + falha

**Pre-requisitos**
- F-Sprint 3 concluida + Sprint 3 backend Task 3.3

**Dependencias**
- depende de F-4.1 (link parte do perfil)

**Responsavel sugerido**
- Dev Pleno Frontend 2

---

### Task F-4.3 - Administracao de Usuarios (apenas ADMIN)

**Descricao**
Tabela de usuarios consumindo `GET /api/v1/usuarios`, com link para detalhe (`GET /api/v1/usuarios/{id}`).

**Arquivos esperados**
- `src/app/features/authenticated/admin/users/users-list.component.ts`
- `src/app/features/authenticated/admin/users/user-detail.component.ts`
- rotas com `roleGuard(['ROLE_ADMIN'])`

**Criterios de verificacao**
- so acessivel com role ADMIN (role guard)
- estilo Notion: tabela whisper border, colunas claras
- testes Vitest cobrem renderizacao da tabela
- detalhe de usuario consome o `/api/v1/usuarios/{id}` correto
- cliente que tenta acessar recebe redirect para `/access-denied`

**Pre-requisitos**
- F-Sprint 3 concluida + Sprint 3 backend Task 3.2

**Dependencias**
- pode rodar em paralelo com F-4.1, F-4.2

**Responsavel sugerido**
- Dev Pleno Frontend 1

---

### Task F-4.4 - Dashboard Administrativa (Casca)

**Descricao**
Primeira tela autenticada com cards placeholder, atalhos e conteudo mockado (sera populado quando jornadas funcionais existirem - Epic 13).

**Arquivos esperados**
- `src/app/features/authenticated/dashboard/dashboard.component.ts`
- `dashboard.component.html`, `dashboard.component.scss`

**Criterios de verificacao**
- rota `/` (apos login) renderiza dashboard
- cards placeholder com nomes intuitivos (que serao substituidos na Epic 13)
- atalhos para perfil, alterar senha, admin (se ADMIN)
- estilo Notion fiel
- testes Vitest cobrem renderizacao basica

**Pre-requisitos**
- F-Sprint 3 concluida

**Dependencias**
- pode rodar em paralelo com F-4.1, F-4.2, F-4.3

**Responsavel sugerido**
- Dev Pleno Frontend 1

---

### Task F-4.5 - Smoke E2E Playwright

**Descricao**
Suite Playwright cobrindo o golden path:
- abrir landing
- ir para register, criar usuario
- ir para login, autenticar
- chegar no shell autenticado
- ver perfil
- alterar senha
- (se ADMIN) listar usuarios

**Arquivos esperados**
- `e2e/golden-path.spec.ts`
- `e2e/admin-flow.spec.ts` (cenario ADMIN separado)
- `e2e/fixtures/users.ts` (dados de teste)

**Criterios de verificacao**
- E2E roda contra backend local
- CI executa (idealmente apos backend Sprint 4 completa)
- tempo total < 3 min para o golden path
- screenshots de falha disponiveis como artifact

**Pre-requisitos**
- todas as Tasks F-4.x concluidas + Sprint 4 backend completa

**Dependencias**
- depende de F-4.1, F-4.2, F-4.3, F-4.4

**Responsavel sugerido**
- Dev Pleno Frontend 1 + Dev Pleno Frontend 2

---

## Grafo de dependencias entre as tasks

```
F-Sprint 3 concluida
        |
        +---> F-4.1 (perfil)            ---+
        +---> F-4.3 (admin de usuarios) ---+
        +---> F-4.4 (dashboard casca)   ---+
                                            |
        F-4.1 ---> F-4.2 (alterar senha)----+
                                            |
                                            v
                                       F-4.5 (Smoke E2E)
```

- F-4.1, F-4.3, F-4.4 podem rodar em paralelo
- F-4.2 depende de F-4.1
- F-4.5 fecha a F-Sprint apos todas as anteriores

## Definicao de pronto da F-Sprint 4 (e da trilha Frontend Foundation)

- Tela "Meu Perfil" consumindo `/auth/me`
- Tela "Alterar Senha" funcional contra backend real
- Administracao de Usuarios (lista + detalhe) restrita a ROLE_ADMIN
- Dashboard administrativa em formato de casca
- Role guard barra clientes em rotas admin
- Smoke E2E Playwright passando contra backend local
- CI Frontend executa lint + test + build + E2E em PR
- "Frontend MVP" demonstravel para stakeholders
- Documentacao breve do que ficou pronto + proximos passos para Epic 13

## Definicao de pronto da trilha Frontend Foundation (consolidada apos F-Sprint 4)

- Projeto Angular 20.x rodando com tooling completo (lint, format, hooks, testes)
- Tokens SCSS dos 2 design systems implementados e usados
- Showcase em `/design-system` documenta tudo
- Telas Apple (landing, login, register) navegaveis consumindo API real
- Shell Notion + guards funcionais
- Telas autenticadas (perfil, alterar senha, admin de usuarios, dashboard casca) funcionais
- Vitest + Playwright passando, com cobertura razoavel
- CI Frontend verde
- "Frontend MVP" demonstravel para stakeholders

## Impacto nas Epics seguintes

- **Epic 13 (Frontend de Jornadas)** consome:
  - Shell Notion ja pronto
  - Biblioteca de componentes (botoes, cards, tabelas, modais) que surgiu organicamente nas F-Sprints 2-4
  - Guards e interceptors prontos
  - `auth.service.ts` operacional
  - Padrao de teste estabelecido (Vitest + Playwright)
- **Epic 14 (Mobile SEP)** reusa:
  - Tokens SCSS do Notion (adaptados para mobile)
  - `auth.service.ts` (compartilhado via npm workspace ou copia)
  - Padroes de guards e interceptors

## Restricoes e regras de execucao

- F-Sprint 4 depende de Sprint 3 backend Tasks 3.2 e 3.3 estarem concluidas
- F-4.5 (Smoke E2E) idealmente roda apos Sprint 4 backend completa (com `ApiExceptionHandler` evoluido)
- Code review obrigatorio em todos os PRs
- Tests obrigatorios em cada PR

## Referencias

- [PRD - API SEP §22, §23 (criterios de sucesso)](../docs-sep/PRD.md)
- [DESIGN-notion.md](../docs-sep/DESIGN-notion.md)
- [WEB-SCREENS-PLAN.md §5.5, §5.6, §5.7, §5.8, §5.9](../docs-sep/WEB-SCREENS-PLAN.md)
- [Spec 003 - Sprint 3 backend](./003-sprint-3-seguranca-autenticacao.md)
- [Spec 004 - Sprint 4 backend (paralela)](./004-sprint-4-erros-docs-testes.md)
- [Spec 103 - F-Sprint 3 (anterior)](./103-fsprint-3-shell-notion-auth.md)
