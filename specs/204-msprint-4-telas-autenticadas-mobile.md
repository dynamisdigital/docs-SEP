# Spec 204 - M-Sprint 4 - Telas Autenticadas Iniciais Mobile + Smoke E2E PWA

## Metadados

- **ID da Spec**: 204
- **Titulo**: M-Sprint 4 - Perfil, Alterar Senha, Casca Tomador, Casca Credora + Smoke E2E PWA
- **Status**: aprovada para execucao (apos M-Sprint 3 e Sprint 4 backend)
- **Fase do produto**: Epic 14 - Mobile SEP (ultima M-Sprint da trilha 200-204)
- **Trilha**: Mobile (paralela a Sprint 4 backend e F-Sprint 4 frontend web)
- **Origem**: PRD - API SEP, Secao 22 + MOBILE-SCREENS-PLAN.md secoes 6.6, 6.7, 6.8, 6.9
- **Depende de**: [`203-msprint-3-shell-mobile-auth.md`](./203-msprint-3-shell-mobile-auth.md) e Sprint 3 backend (Task 3.3)
- **Responsavel principal**: Dev Mobile

## Objetivo

Fechar a Fundacao Mobile (M-Sprints 0-4) entregando as telas autenticadas iniciais: meu perfil, alterar senha, casca de inicio do tomador e casca de inicio da empresa credora. Validar o golden path mobile com **smoke E2E Playwright em PWA** rodando contra backend real. Ao final, o "Mobile MVP" e demonstravel para stakeholders, e a Epic 14 Fase Mobile 2+ (jornadas funcionais) pode ser iniciada.

> **Nota apos [ADR 0009 - Separacao de Canal por Perfil](../adr/0009-separacao-de-canal-por-perfil.md)**: a Fase Mobile 2+ (jornadas funcionais — Epic 14) tem escopos diferentes por perfil:
> - **Tomador**: jornada completa (mobile e o canal exclusivo) — onboarding, solicitar emprestimo, acompanhar proposta, formalizacao, parcelas, comprovantes
> - **Empresa Credora**: versao **resumida** — notificacoes de oportunidades, status de operacoes financiadas, perfil basico. KYB completo, carteira detalhada, comparacao de oportunidades, exportacao de relatorios ficam no **web** (Epic 13)
>
> A casca de tomador (Task M-4.3) e a casca da credora (Task M-4.4) refletem essa diferenca: tomador ganha mais cards/atalhos (jornada complexa); credora tem layout enxuto.

## Escopo

### Em escopo
- Tela "Meu Perfil" mobile (consome `/auth/me`, link para alterar senha)
- Tela "Alterar Senha" mobile (consome `PATCH /api/v1/usuarios/{id}/senha`)
- Inicio do Tomador (casca) — saudacao + cards placeholder com atalhos para futuras jornadas
- Inicio da Empresa Credora (casca) — saudacao + cards placeholder com atalhos para futuras jornadas (apenas estrutura — exibicao real depende de role separada da Epic 11)
- Smoke E2E Playwright em PWA (Chromium, viewport mobile 375x812) cobrindo o golden path
- Mobile CI rodando E2E em PR
- Validacao manual em device fisico via `ionic serve --external` (PWA acessivel pelo IP local)

### Fora de escopo nesta M-Sprint
- Telas das jornadas funcionais (Epic 14 Fase Mobile 2+: tomador onboarding, credora oportunidades, etc.)
- Build Capacitor Android/iOS (fica para fase posterior, depois de M-Sprints 0-4 estabilizadas)
- Push notifications (futuro)
- Cobertura E2E exaustiva (apenas golden path)

## Pre-requisitos globais

- M-Sprint 3 concluida (shell mobile + auth real + guards + interceptors)
- Sprint 3 backend Task 3.3 entregue (`PATCH /api/v1/usuarios/{id}/senha`)
- Sprint 4 backend para Smoke E2E completo (Task M-4.5 depende disso)

## Tasks

### Task M-4.1 - Tela Meu Perfil Mobile

**Descricao**
Tela mostrando dados do `/auth/me` em layout mobile, com link para alterar senha. Estilo Notion mobile-adaptado.

**Arquivos esperados**
- `src/app/features/authenticated/profile/profile.component.ts`
- `profile.component.html`, `profile.component.scss`

**Conteudo (per MOBILE-SCREENS-PLAN.md §6.8)**
- id (formato resumido)
- e-mail
- perfil (role)
- data de criacao
- botao "Alterar senha" — direciona para tela M-4.2
- botao "Sair" — limpa Capacitor Preferences e redireciona para `/welcome`

**Criterios de verificacao**
- Consome `/auth/me` e exibe dados
- Botoes ocupam largura total (touch targets generosos)
- Estilo Notion mobile-adaptado fiel
- Testes Vitest cobrem renderizacao + fetch
- Responsivo

**Pre-requisitos**
- M-Sprint 3 concluida

**Dependencias**
- nenhuma dentro desta M-Sprint (pode ser primeira)

**Responsavel sugerido**
- Dev Mobile

---

### Task M-4.2 - Tela Alterar Senha Mobile

**Descricao**
Form mobile com senha atual + nova senha + confirmacao, consumindo `PATCH /api/v1/usuarios/{id}/senha`.

**Arquivos esperados**
- `src/app/features/authenticated/profile/change-password/change-password.component.ts`
- `change-password.component.html`, `change-password.component.scss`

**Comportamentos mobile-specific**
- `inputmode="numeric"` para senha de 6 digitos? (decisao: nao, manter `password` para permitir letras se a politica mudar; PRD diz exatamente 6 caracteres, nao numericos)
- `autocomplete="current-password"` no campo senha atual e `autocomplete="new-password"` na nova
- Botao de submit ocupa largura total
- Erro de senha atual incorreta exibe ion-toast com cor semantica

**Criterios de verificacao**
- Form valida senha atual obrigatoria, nova senha 6 chars exatos, confirmacao igual a nova
- Erro de senha atual incorreta exibe feedback (backend retorna excecao mapeada)
- Sucesso retorna ion-toast e mantem usuario autenticado
- Testes Vitest cobrem validacao + sucesso + falha

**Pre-requisitos**
- M-Sprint 3 concluida + Sprint 3 backend Task 3.3

**Dependencias**
- depende de M-4.1 (link parte do perfil)

**Responsavel sugerido**
- Dev Mobile

---

### Task M-4.3 - Inicio do Tomador (Casca)

**Descricao**
Primeira tab "Inicio" para tomador com cards placeholder. Sera populada quando Epic 14 Fase Mobile 2 (jornada do tomador funcional) for desenvolvida.

**Arquivos esperados**
- `src/app/features/tomador/home/home.component.ts`
- `home.component.html`, `home.component.scss`

**Conteudo inicial (per MOBILE-SCREENS-PLAN.md §6.6)**
- Saudacao com nome do usuario
- Card placeholder "Status do cadastro" (bloqueado ate API existir)
- Card placeholder "Proposta ativa" (bloqueado ate API existir)
- Atalhos: "Onboarding", "Solicitar emprestimo", "Acompanhar proposta" — todos com badge "Em breve"

**Criterios de verificacao**
- Renderiza com saudacao baseada em `/auth/me`
- Cards placeholder visualmente fieis ao Notion mobile
- Atalhos exibem toast informativo "Funcionalidade em breve" quando clicados
- Testes Vitest cobrem renderizacao basica

**Pre-requisitos**
- M-Sprint 3 concluida

**Dependencias**
- pode rodar em paralelo com M-4.1, M-4.2, M-4.4

**Responsavel sugerido**
- Dev Mobile

---

### Task M-4.4 - Inicio da Empresa Credora (Casca)

**Descricao**
Primeira tab "Inicio" para empresa credora com cards placeholder. Sera populada quando Epic 14 Fase Mobile 3 (jornada da credora funcional) for desenvolvida.

**Arquivos esperados**
- `src/app/features/credora/home/home.component.ts`
- `home.component.html`, `home.component.scss`

**Conteudo inicial (per MOBILE-SCREENS-PLAN.md §6.7)**
- Saudacao
- Card placeholder "Status do cadastro/KYB" (bloqueado ate API existir)
- Card placeholder "Resumo de oportunidades" (bloqueado ate API existir)
- Card placeholder "Resumo de operacoes financiadas" (bloqueado ate API existir)
- Atalho para "Carteira" (com badge "Em breve")

**Importante**: como ainda nao existe role separada para empresa credora (apenas `ADMIN` e `CLIENTE`), esta tela fica em rota `/credora/home` mas sera acessivel apenas quando role dedicada existir. Por enquanto, fica registrada como casca para validar layout.

**Criterios de verificacao**
- Renderiza casca
- Cards placeholder fiéis ao Notion
- Testes Vitest cobrem renderizacao

**Pre-requisitos**
- M-Sprint 3 concluida

**Dependencias**
- pode rodar em paralelo com M-4.1, M-4.2, M-4.3

**Responsavel sugerido**
- Dev Mobile

---

### Task M-4.5 - Smoke E2E Playwright em PWA

**Descricao**
Suite Playwright cobrindo o golden path mobile em viewport iPhone-like:
- abrir splash
- ir para boas-vindas
- ir para register, criar usuario CLIENTE
- ir para login, autenticar
- chegar no shell mobile (tabs inferiores)
- ver perfil
- alterar senha
- voltar para inicio (tomador casca)
- logout

**Arquivos esperados**
- `e2e/golden-path-mobile.spec.ts`
- `e2e/fixtures/users.ts` (dados de teste)
- `playwright.config.ts` configurado para `viewport: { width: 375, height: 812 }`

**Criterios de verificacao**
- E2E roda contra backend local
- CI executa (idealmente apos backend Sprint 4 completa)
- Tempo total < 4 min para o golden path mobile (mobile e mais lento que desktop)
- Screenshots de falha disponiveis como artifact

**Pre-requisitos**
- todas as Tasks M-4.x concluidas + Sprint 4 backend completa

**Dependencias**
- depende de M-4.1, M-4.2, M-4.3, M-4.4

**Responsavel sugerido**
- Dev Mobile

---

## Grafo de dependencias entre as tasks

```
M-Sprint 3 concluida
        |
        +---> M-4.1 (perfil)         ---+
        +---> M-4.3 (casca tomador)  ---+
        +---> M-4.4 (casca credora)  ---+
                                         |
        M-4.1 ---> M-4.2 (alterar senha)-+
                                         |
                                         v
                                    M-4.5 (Smoke E2E PWA)
```

## Definicao de pronto da M-Sprint 4 (e da trilha Mobile Foundation)

- Tela "Meu Perfil" consumindo `/auth/me`
- Tela "Alterar Senha" funcional contra backend real
- Casca de inicio do tomador e da empresa credora navegaveis
- Smoke E2E Playwright em PWA passando contra backend local
- Mobile CI executa lint + test + build + E2E em PR
- "Mobile MVP" demonstravel para stakeholders em PWA (instalavel via "Add to Home Screen")
- Documentacao breve do que ficou pronto + proximos passos para Epic 14 Fase Mobile 2+

## Definicao de pronto da trilha Mobile Foundation (consolidada apos M-Sprint 4)

- Projeto Ionic 8.4+ + Angular 20.x + Capacitor 6 rodando com tooling completo
- Tokens Notion mobile-adaptados em SCSS, com componentes Ionic customizados
- Showcase em `/design-system` documenta tudo
- Telas publicas (splash, boas-vindas, login, register) navegaveis consumindo API real
- Shell mobile com tabs inferiores + guards funcionais
- Telas autenticadas iniciais (perfil, alterar senha, cascas tomador e credora) funcionais
- Vitest + Playwright (PWA) passando, com cobertura razoavel
- Mobile CI verde
- "Mobile MVP" demonstravel em PWA

## Impacto nas fases seguintes

- **Epic 14 Fase Mobile 2** (Jornada do Tomador Funcional) consome:
  - Shell mobile ja pronto
  - Casca de inicio do tomador (M-4.3) sera substituida por dashboard funcional
  - Componentes Ionic customizados ja estabelecidos
  - Padrao de teste estabelecido (Vitest + Playwright PWA)
- **Epic 14 Fase Mobile 3** (Jornada da Empresa Credora) consome:
  - Casca de inicio da credora (M-4.4) sera substituida por dashboard funcional
  - Mesmos padroes
- **Build Capacitor Android/iOS** (fase posterior):
  - PWA validado nas M-Sprints 0-4 reduz risco
  - Adicao via `npx cap add android` e `npx cap add ios`
  - Plugins Capacitor (preferences, push notifications, etc.) adicionados conforme demanda

## Restricoes e regras de execucao

- M-Sprint 4 depende de Sprint 3 backend Task 3.3 estar concluida
- M-4.5 (Smoke E2E PWA) idealmente roda apos Sprint 4 backend completa (com `ApiExceptionHandler` evoluido)
- Validar em device fisico via `ionic serve --external` antes de fechar a M-Sprint
- Code review obrigatorio em todos os PRs
- Tests obrigatorios em cada PR

## Referencias

- [PRD - API SEP §22, §23](../docs-sep/PRD.md)
- [DESIGN-notion.md](../docs-sep/DESIGN-notion.md)
- [MOBILE-SCREENS-PLAN.md §6.6, §6.7, §6.8, §6.9](../docs-sep/MOBILE-SCREENS-PLAN.md)
- [Spec 003 - Sprint 3 backend](./003-sprint-3-seguranca-autenticacao.md)
- [Spec 004 - Sprint 4 backend (paralela)](./004-sprint-4-erros-docs-testes.md)
- [Spec 104 - F-Sprint 4 frontend web (paralela)](./104-fsprint-4-telas-autenticadas.md)
- [Spec 203 - M-Sprint 3 (anterior)](./203-msprint-3-shell-mobile-auth.md)
