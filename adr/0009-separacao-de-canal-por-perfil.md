# ADR 0009 - Separacao de Canal por Perfil

## Status

Aceito (2026-04-27)

## Contexto

A versao inicial do PRD previa que ambos os canais (web e mobile) cobrissem os 4 perfis principais do produto SEP: tomador, empresa credora, financeiro interno e administrador. Apos analise de seguranca conduzida durante a fase de planejamento, identificou-se que:

- **Cliente externo (tomador)** ganha protecao significativa em mobile via biometria nativa (Face ID/Touch ID), storage de token em Android Keystore/iOS Keychain (encryption at rest), certificate pinning, anti-phishing por app store, ambiente WebView controlado (XSS/CSRF mitigados).
- **Cliente externo PJ (empresa credora)** trabalha em desktop (analistas, gestores), tem tarefas intrinsecamente desktop-friendly: KYB com upload de muitos documentos, analise de carteira, dashboards densos, exportacao de relatorios.
- **Usuarios internos (admin, financeiro, backoffice)** trabalham em desktop o dia inteiro com ferramentas de analise — telas grandes sao mandatorias.
- **Tomador no web** e exposto a phishing, sem biometria nativa, com storage de token em localStorage (acessivel via XSS).

O estado anterior (ambos os canais para todos os perfis) duplicava esforco e expunha tomador ao canal mais vulneravel (web).

## Decisao

Adotar **separacao de canal por perfil**:

| Perfil | Canal principal | Canal secundario |
|--------|----------------|-------------------|
| Visitante | Web (landing) + Mobile (boas-vindas) | — |
| Tomador (atualmente `ROLE_CLIENTE`) | **Mobile** | — (sem versao web) |
| Empresa Credora | **Web** | Mobile (notificacoes + status simplificado) |
| Financeiro Interno | **Web** | — |
| Backoffice | **Web** | — |
| Administrador | **Web** | — |

### Implicacoes praticas

1. **Cadastro publico e separado por canal**:
   - Tomador: cadastro publico **apenas no mobile** (ganha biometria/storage seguro desde a primeira sessao)
   - Empresa Credora: cadastro **por convite** no web (admin envia link/email; credora completa cadastro autenticando-se no web)
   - Admin/Financeiro/Backoffice: cadastro **interno** (admin cria via endpoint autenticado; sem caminho publico)

2. **Tela "register publico" do web e desativada** apos a Sprint 5 (Endurecimento de Seguranca). Visitante que tentar cadastrar como cliente recebe mensagem direcionando para o app (com link da loja).

3. **Mobile nao recebe telas internas** (admin, financeiro, backoffice). Mobile cobre apenas tomador + credora resumida (notificacoes, status, sem KYB completo nem carteira detalhada).

4. **Web nao recebe jornada de tomador**. Apos a separacao, web fica focado em: landing publica, login, internos, empresa credora (jornada completa).

5. **Roles devem ser refinadas** na Epic 11 (Administracao e Governanca):
   - `ROLE_TOMADOR` (mobile-only, era `ROLE_CLIENTE`)
   - `ROLE_CREDORA` (web-primary, mobile-secondary)
   - `ROLE_ADMIN`, `ROLE_FINANCEIRO`, `ROLE_BACKOFFICE` (web-only)
   - Backend tem que validar canal de origem das requests (header customizado, JWT claim ou User-Agent) para reforcar a regra.

## Alternativas consideradas

- **Manter ambos os canais para todos os perfis (estado anterior)**: descartado. Expoe tomador ao web (menos seguro), duplica esforco de manutencao, dilui foco.
- **Web apenas internos + Mobile cobre tomador e credora completos (radical)**: descartado. Empresa credora e PJ que trabalha em desktop; forcar tudo em celular = UX ruim para cliente que paga pra usar a plataforma.
- **Hibrido por sensibilidade do dado**: descartado por complexidade — criava casos de borda (onde tomador edita? onde visualiza?) sem ganho claro.

## Consequencias

### Positivas
- Tomador ganha seguranca real via biometria nativa, storage seguro em Keystore/Keychain, certificate pinning, anti-phishing por app store
- Empresa credora mantem UX desktop adequada para suas tarefas (KYB, carteira, dashboards)
- Reducao de attack surface no web (sem cadastro publico permitindo arbitrary roles, sem jornada de cliente externo no canal mais vulneravel)
- Foco do produto: cada canal tem audiencia clara
- Simetria com mercado (Nubank, PicPay, Inter — clientes PF mobile-first; clientes PJ desktop-first)
- Sprint 5 (Endurecimento) ganha contexto: MFA pode ser adaptado por canal (biometria mobile vs TOTP web)

### Negativas
- Tomador sem smartphone moderno fica sem acesso (mitigacao: app PWA acessivel via browser mobile como degrade gracioso)
- Frontend web (specs 100-104) perde escopo de tomador — ja foi planejado, precisa ajuste
- Mobile (specs 200-204) ganha escopo de tomador — ja era foco principal, mas reforca
- Cadastro de empresa credora vira fluxo "por convite" — mais codigo, mais complexidade no Epic 11
- Acessibilidade (deficientes visuais com leitor de tela) — apps mobile tem suporte, mas web desktop e mais maduro

### Neutras
- Roles `ROLE_CLIENTE` atual continua valida nas Sprints 1-4; refinamento para `ROLE_TOMADOR`/`ROLE_CREDORA` fica para Epic 11
- Estrutura de pacotes DDD nao muda (modulos `usuarios`, `credores`, `onboarding` permanecem)

## Implementacao

### Sprints/Specs afetadas
- **Sprint 2 backend (atual)**: cadastro publico continua valido; sera ajustado na Sprint 5 (Endurecimento) para canalizacao por canal
- **F-Sprint 2 (specs/102)**: tela de registro publico no web sera removida apos Sprint 5; mantida ate la com aviso de "redirecione tomadores para app"
- **F-Sprint 3, 4 (specs/103, 104)**: foco interno + credora; sem casca de tomador
- **M-Sprint 2 (specs/202)**: cadastro publico do tomador permanece e e o fluxo principal
- **M-Sprint 3, 4 (specs/203, 204)**: shell mobile foca em tomador (tabs Inicio/Propostas/Parcelas/Perfil); credora resumida (apenas notificacoes/status, sem KYB nem carteira completos)
- **Sprint 5 (Endurecimento — a ser criada)**: implementacao concreta da canalizacao com:
  - validacao de canal de origem nas requests (User-Agent + claim JWT `channel`)
  - desativacao da tela de registro publico no web
  - fluxo de convite por email para empresa credora
  - cadastro publico do tomador habilitado apenas via mobile

### Backend mudancas previstas (Sprint 5+)
- `POST /api/v1/usuarios` (atual, publico) — mantido temporariamente; sera marcado como deprecated apos Sprint 5
- Novo: `POST /api/v1/usuarios/tomador` (publico, validacao de canal mobile)
- Novo: `POST /api/v1/usuarios/credora/convite` (autenticado, admin emite link)
- Novo: `POST /api/v1/usuarios/credora/completar-cadastro` (publico com token de convite)
- Novo: `POST /api/v1/usuarios/interno` (autenticado, admin cria admin/financeiro/backoffice)

Os enderecos exatos podem ser ajustados na implementacao da Epic 11 quando roles forem refinadas.

## Referencias

- PRD §6 (Perfis), §7 (RF-01 Cadastro), §11 (Base mobile/frontend), §22 (Trilhas), §25 (Epic 11 Administracao e Governanca, Epic 12 Frontend, Epic 14 Mobile)
- WEB-SCREENS-PLAN.md (telas reorganizadas)
- MOBILE-SCREENS-PLAN.md (escopo tomador ampliado)
- ADR 0010 (MFA — Sprint 5) — a ser criado: refera-se a este ADR como precondicao
- Spec 005 (Sprint 5 Endurecimento) — a ser criada: implementa a canalizacao
- ADR 0002 (Design Systems) — Apple para superficies publicas web; Notion para autenticadas web e todo o mobile
- ADR 0003 (Stack Mobile) — Ionic 8.4+ + Angular 20.x + Capacitor 6
- Resolucao CMN nº 4.656/2018 (PRD §3.1)
