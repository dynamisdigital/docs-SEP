# Cenarios de Teste - Jornadas de Usuario SEP

## 1. Objetivo

Este documento lista cenarios de teste orientados a jornadas reais de usuario, conectando passos de frontend web, mobile e API. O foco e validar fluxos completos, nao apenas endpoints isolados.

Os cenarios servem como backlog para testes manuais, Playwright E2E, smoke tests cross-stack e validacao de regressao. Cada cenario deve ser automatizado quando a tela e o endpoint correspondente existirem.

## 2. Premissas

- Web e mobile consomem a mesma API publica.
- Web cobre visitante, cliente/tomador, admin, financeiro/backoffice e empresa credora em fases futuras.
- Mobile cobre apenas tomador e empresa credora nesta fase.
- A partir da Sprint 5, login pode exigir MFA TOTP, refresh token, lockout e step-up para operacoes sensiveis.
- Alguns cenarios abaixo sao futuros porque dependem de endpoints ainda nao implementados, como alteracao de nome, delecao de conta, recuperacao de senha, onboarding funcional, credito, contratos e cobranca.
- Quando um cenario depender de funcionalidade futura, ele deve ser mantido como `PLANEJADO` ate existir spec/endpoint.

## 3. Estados dos Cenarios

- `ATUAL`: pode ser testado com as telas/endpoints ja entregues nas Sprints/F-Sprints/M-Sprints concluidas.
- `PARCIAL`: parte da jornada existe, mas algum passo depende de endpoint/tela futura.
- `PLANEJADO`: jornada de produto prevista, ainda sem contrato completo.
- `NEGATIVO`: cenario de falha, seguranca, permissao ou validacao.

## 4. Massa de Dados Recomendada

- `visitante`: sem token.
- `cliente_a`: usuario `CLIENTE` com MFA habilitado e senha forte.
- `cliente_b`: outro usuario `CLIENTE`, usado para validar ownership.
- `admin`: usuario `ADMIN`.
- `credora`: usuario futuro vinculado a empresa credora, quando o perfil existir.
- `usuario_bloqueado`: usuario com lockout ativo.
- `usuario_legado`: usuario com `precisaRedefinirSenha=true`.

Usar e-mails unicos por execucao, por exemplo `cliente-a+<timestamp>@sep.test`, para evitar colisao entre runs.

## 5. Jornadas Publicas

### J-001 - Visitante acessa landing e vai para login

Status: `ATUAL`

Perfil: visitante

Passos:
1. Abrir landing web `/`.
2. Conferir conteudo principal e CTAs.
3. Clicar em `Entrar`.
4. Verificar redirecionamento para `/login`.

Resultado esperado:
- Landing carrega sem token.
- Login e exibido sem erro.
- Nenhuma chamada autenticada deve ser feita antes do login.

Automacao sugerida:
- `sep-app/e2e/smoke.spec.ts` ou novo `public-navigation.spec.ts`.

### J-002 - Visitante tenta acessar area autenticada

Status: `ATUAL`

Perfil: visitante

Passos:
1. Acessar `/app/dashboard` no web sem token.
2. Acessar `/app/inicio` no mobile sem token.

Resultado esperado:
- Web redireciona para `/login`.
- Mobile redireciona para `/welcome`.
- Nenhum dado autenticado aparece antes da validacao de sessao.

Automacao sugerida:
- Web: `auth-guard.spec.ts` ou Playwright.
- Mobile: `smoke.spec.ts`.

### J-003 - Visitante cria conta de cliente

Status: `PARCIAL`

Perfil: visitante

Passos:
1. Abrir cadastro publico.
2. Informar e-mail valido.
3. Informar senha conforme politica vigente.
4. Enviar cadastro.
5. Ir para login ou fluxo de canalizacao aprovado.

Resultado esperado:
- Conta criada como `CLIENTE`.
- Cadastro publico nao permite criar `ADMIN`.
- Erro de e-mail duplicado aparece de forma amigavel.

Automacao sugerida:
- Web/mobile devem validar que o campo `role` nao permite escalada para admin.

## 6. Jornadas de Login e Sessao

### J-010 - Login simples com senha valida

Status: `ATUAL`

Perfil: cliente/admin sem MFA ativo

Passos:
1. Abrir login.
2. Informar e-mail e senha validos.
3. Enviar formulario.
4. Aguardar carregamento de `/auth/me`.

Resultado esperado:
- Login retorna access token.
- Web entra em `/app/dashboard`.
- Mobile entra em `/app/inicio`.
- Header/perfil exibem o usuario autenticado.

Automacao sugerida:
- Web: `sep-app/e2e/golden-path.spec.ts`.
- Mobile: `sep-mobile/e2e/golden-path-mobile.spec.ts`.

### J-011 - Login com MFA TOTP

Status: `ATUAL`

Perfil: cliente/admin com MFA ativo

Passos:
1. Informar e-mail e senha validos.
2. Receber desafio MFA.
3. Informar codigo TOTP valido.
4. Concluir login.

Resultado esperado:
- Senha valida nao emite sessao completa antes do TOTP.
- Codigo TOTP valido conclui login.
- Codigo invalido exibe erro e nao autentica.
- Tentativas invalidas entram na politica de rate limit/lockout.

Automacao sugerida:
- Web: fluxo `verify-totp`.
- Mobile: fluxo `verify-totp` com fallback sem biometria no PWA.

### J-012 - Login invalido ate lockout

Status: `ATUAL NEGATIVO`

Perfil: usuario existente

Passos:
1. Tentar login com senha invalida repetidas vezes.
2. Atingir limite de lockout.
3. Tentar login com senha correta durante bloqueio.

Resultado esperado:
- Tentativas invalidas retornam erro sem indicar se o usuario existe.
- Apos limite, conta fica bloqueada.
- Login correto durante bloqueio retorna estado de conta bloqueada.
- Web/mobile exibem pagina `account-locked`.

Automacao sugerida:
- Smoke API + Playwright para tela de bloqueio.

### J-013 - Sessao expirada durante navegacao

Status: `ATUAL`

Perfil: usuario autenticado

Passos:
1. Entrar autenticado.
2. Simular access token expirado.
3. Fazer chamada autenticada.
4. Verificar refresh ou redirecionamento.

Resultado esperado:
- Web usa refresh via cookie HttpOnly quando aplicavel.
- Mobile usa refresh token via Capacitor Preferences.
- Se refresh falhar, sessao e limpa.
- Usuario volta para login/welcome ou tela de sessao expirada.

Automacao sugerida:
- Interceptor tests + Playwright com mock MSW.

## 7. Jornadas de Perfil

### J-020 - Login + consultar perfil

Status: `ATUAL`

Perfil: cliente/admin

Passos:
1. Login com usuario valido.
2. Abrir `Meu perfil`.
3. Conferir e-mail, perfil, identificador e auditoria.
4. Recarregar perfil.

Resultado esperado:
- Dados exibidos batem com `/auth/me`.
- Recarregar atualiza dados sem sair da tela.
- Mobile nao deve chamar endpoints administrativos para perfil proprio.

Automacao sugerida:
- Web: profile component + golden path.
- Mobile: `profile-actions.spec.ts`.

### J-021 - Login + alteracao de nome

Status: `PLANEJADO`

Perfil: cliente

Pre-requisito futuro:
- Endpoint de atualizacao de perfil, por exemplo `PATCH /api/v1/usuarios/{id}/perfil`.
- Campo de nome ou dados cadastrais do usuario definido no dominio. Atualmente o contrato inicial de usuario usa `username` como e-mail e nao possui nome civil.

Passos:
1. Login com cliente.
2. Abrir `Meu perfil`.
3. Clicar em `Editar perfil`.
4. Alterar nome.
5. Salvar.
6. Recarregar `/auth/me` ou endpoint de perfil.

Resultado esperado:
- Nome atualizado aparece no perfil e no header, se o header usar nome.
- Auditoria registra `modificadoPor` com UUID do usuario.
- Usuario nao consegue alterar nome de outro usuario.
- Nome invalido ou vazio retorna erro de validacao.

Automacao sugerida:
- Criar quando o endpoint existir.

### J-022 - Login + alterar senha

Status: `ATUAL`

Perfil: cliente/admin

Passos:
1. Login com usuario valido.
2. Abrir `Meu perfil`.
3. Abrir `Alterar senha`.
4. Informar senha atual.
5. Informar nova senha conforme politica vigente.
6. Confirmar alteracao.
7. Fazer logout.
8. Login com nova senha.

Resultado esperado:
- Alteracao exige senha atual valida.
- Se MFA estiver ativo, fluxo exige step-up antes da alteracao.
- Sessao atual permanece ou e tratada conforme regra vigente.
- Login com senha antiga falha.
- Login com nova senha passa.
- Audit log registra `PASSWORD_CHANGED`.

Automacao sugerida:
- Web: `golden-path.spec.ts`.
- Mobile: `golden-path-mobile.spec.ts` e `profile-actions.spec.ts`.

### J-023 - Login + senha atual incorreta

Status: `ATUAL NEGATIVO`

Perfil: cliente/admin

Passos:
1. Login.
2. Abrir alteracao de senha.
3. Informar senha atual incorreta.
4. Enviar.

Resultado esperado:
- API retorna erro de validacao.
- UI mostra mensagem sem limpar toda a sessao.
- Senha permanece inalterada.

Automacao sugerida:
- Component tests + Playwright com backend real ou MSW.

### J-024 - Usuario legado forcado a redefinir senha

Status: `ATUAL`

Perfil: usuario com `precisaRedefinirSenha=true`

Passos:
1. Login com usuario legado.
2. Tentar acessar dashboard.
3. Alterar senha conforme politica vigente.
4. Retentar acesso ao dashboard.

Resultado esperado:
- Usuario fica confinado em alteracao de senha.
- APIs nao permitidas retornam `AUTH-403-PASSWORD_RESET_REQUIRED`.
- Apos alterar senha, flag e liberada.

Automacao sugerida:
- API smoke + web/mobile E2E.

### J-025 - Login + delecao de conta

Status: `PLANEJADO`

Perfil: cliente

Pre-requisito futuro:
- Endpoint formal de encerramento/delecao de conta.
- Decisao regulatoria/LGPD sobre exclusao fisica, anonimizacao ou bloqueio operacional. O PRD atual diz que nao ha soft delete na fase inicial.

Passos:
1. Login.
2. Abrir perfil.
3. Solicitar delecao/encerramento de conta.
4. Confirmar com senha atual e MFA/step-up.
5. Encerrar sessao.
6. Tentar novo login.

Resultado esperado:
- Operacao exige confirmacao forte.
- Conta nao pode ser usada apos encerramento.
- Dados regulatorios/auditoria sao preservados conforme regra aprovada.
- Tentativa de login exibe erro controlado.

Automacao sugerida:
- Criar somente apos ADR/spec de encerramento de conta.

## 8. Jornadas de MFA e Biometria

### J-030 - Login + ativar MFA TOTP

Status: `ATUAL`

Perfil: cliente/admin

Passos:
1. Login.
2. Abrir configuracao de MFA.
3. Iniciar setup TOTP.
4. Escanear QR code ou copiar secret.
5. Confirmar com codigo valido.
6. Guardar backup codes.
7. Fazer logout e login novamente.

Resultado esperado:
- MFA fica habilitado.
- Backup codes sao exibidos apenas uma vez.
- Proximo login exige TOTP.
- Audit log registra `MFA_ENABLED`.

Automacao sugerida:
- Web E2E com TOTP deterministico em ambiente de teste.

### J-031 - Login + usar backup code

Status: `ATUAL`

Perfil: usuario com MFA ativo

Passos:
1. Login com senha valida.
2. Na etapa MFA, usar backup code valido.
3. Tentar reutilizar o mesmo backup code.

Resultado esperado:
- Primeiro uso autentica.
- Reuso falha.
- Audit log registra `BACKUP_CODE_USED`.

Automacao sugerida:
- API integration test + web/mobile E2E.

### J-032 - Mobile: login + habilitar biometria confiavel

Status: `PARCIAL`

Perfil: tomador mobile

Pre-requisito:
- PWA usa stub; plugin nativo entra em fase Android/iOS.

Passos:
1. Login mobile.
2. Abrir perfil.
3. Abrir configuracao de biometria.
4. Habilitar dispositivo confiavel.
5. Fazer logout.
6. Iniciar login novamente.

Resultado esperado:
- No PWA, fallback informa disponibilidade limitada.
- Em app nativo futuro, biometria aprovada substitui digitacao TOTP quando permitido.
- Falha biometrica permite fallback TOTP.

Automacao sugerida:
- PWA: testar stub.
- Nativo futuro: teste manual/device lab.

## 9. Jornadas Administrativas

### J-040 - Admin login + listar usuarios + detalhe

Status: `ATUAL`

Perfil: admin

Passos:
1. Login como admin.
2. Abrir administracao de usuarios.
3. Listar usuarios.
4. Filtrar por e-mail.
5. Abrir detalhe de usuario.

Resultado esperado:
- Admin ve lista.
- Filtro local funciona.
- Detalhe mostra dados e auditoria.

Automacao sugerida:
- Web: `sep-app/e2e/admin-flow.spec.ts`.

### J-041 - Cliente tenta acessar administracao

Status: `ATUAL NEGATIVO`

Perfil: cliente

Passos:
1. Login como cliente.
2. Tentar acessar `/app/admin/users`.

Resultado esperado:
- UI redireciona para acesso negado.
- API retorna 403 em endpoints administrativos.
- Links administrativos nao aparecem no menu do cliente.

Automacao sugerida:
- Web: `admin-flow.spec.ts`.

### J-042 - Admin cria usuario interno

Status: `PARCIAL`

Perfil: admin

Passos:
1. Login como admin.
2. Abrir administracao.
3. Criar novo usuario interno.
4. Definir perfil permitido.
5. Confirmar.

Resultado esperado:
- Apenas admin pode criar usuario interno.
- Cadastro publico continua criando apenas `CLIENTE`.
- Novo usuario aparece na listagem.

Automacao sugerida:
- Criar E2E quando a tela admin de criacao existir.

## 10. Jornadas de Onboarding KYC PF

### J-050 - Tomador login + iniciar KYC + enviar documentos + aprovar

Status: `PARCIAL`

Perfil: cliente/tomador

Pre-requisito:
- Sprint 6 completa com endpoints de onboarding.

Passos:
1. Login como tomador.
2. Abrir onboarding.
3. Informar CPF, nome completo e data de nascimento.
4. Enviar documento de identidade.
5. Enviar selfie.
6. Disparar verificacao.
7. Receber callback do provider com `APROVADO`.
8. Consultar status.

Resultado esperado:
- Solicitacao inicia em `INICIADO`.
- Primeiro documento transiciona para `DOCUMENTOS_RECEBIDOS`.
- Verificacao transiciona para `EM_VERIFICACAO`.
- Callback finaliza como `APROVADO`.
- Audit log registra eventos KYC.

Automacao sugerida:
- API E2E backend na Sprint 6.
- Web/mobile E2E quando telas existirem.

### J-051 - Tomador tenta KYC sem selfie

Status: `PARCIAL NEGATIVO`

Perfil: cliente/tomador

Passos:
1. Login.
2. Criar solicitacao KYC.
3. Enviar apenas RG/CNH/passaporte.
4. Disparar verificacao.

Resultado esperado:
- API rejeita por documentos minimos ausentes.
- UI orienta envio de selfie.
- Nenhuma chamada ao provider externo e feita.

### J-052 - Cliente A tenta acessar KYC do Cliente B

Status: `PARCIAL NEGATIVO`

Perfil: cliente

Passos:
1. Cliente A cria KYC.
2. Cliente B faz login.
3. Cliente B tenta consultar ou anexar documento na solicitacao do Cliente A.

Resultado esperado:
- API retorna 403.
- UI mostra acesso negado ou estado controlado.
- Nenhum documento e salvo.

### J-053 - CPF duplicado em onboarding ativo

Status: `PARCIAL NEGATIVO`

Perfil: cliente/tomador

Passos:
1. Criar onboarding com CPF valido.
2. Tentar criar novo onboarding com mesmo CPF enquanto status ativo.

Resultado esperado:
- API retorna 409.
- UI informa que ja existe solicitacao ativa.

## 11. Jornadas de Credito e Contratacao

### J-060 - Tomador KYC aprovado + solicitar emprestimo

Status: `PLANEJADO`

Perfil: tomador

Pre-requisito:
- Sprint 8+ com modulo `credito`.

Passos:
1. Login.
2. Concluir KYC aprovado.
3. Abrir solicitacao de emprestimo.
4. Informar valor, prazo e finalidade.
5. Enviar proposta.
6. Acompanhar status.

Resultado esperado:
- API aceita proposta apenas com KYC aprovado.
- Proposta entra no status inicial definido pelo modulo credito.
- Dashboard mostra proposta ativa.

### J-061 - Tomador tenta credito sem KYC aprovado

Status: `PLANEJADO NEGATIVO`

Perfil: tomador

Passos:
1. Login sem KYC aprovado.
2. Tentar solicitar emprestimo.

Resultado esperado:
- API bloqueia proposta.
- UI direciona para onboarding.

### J-062 - Tomador proposta aprovada + formalizacao

Status: `PLANEJADO`

Perfil: tomador

Pre-requisito:
- Sprints 10-11 com contratos e assinatura.

Passos:
1. Login.
2. Abrir proposta aprovada.
3. Visualizar contrato.
4. Aceitar termos.
5. Assinar digitalmente.
6. Consultar status de formalizacao.

Resultado esperado:
- Contrato fica formalizado.
- Desembolso futuro permanece bloqueado ate assinatura concluida.
- Audit trail registra aceite e assinatura.

## 12. Jornadas de Cobranca e Pagamento

### J-070 - Tomador consulta parcelas

Status: `PLANEJADO`

Perfil: tomador

Pre-requisito:
- Sprint 12+ com cobranca.

Passos:
1. Login.
2. Abrir `Minhas parcelas`.
3. Ver parcela atual, vencimento e status.
4. Abrir detalhe.

Resultado esperado:
- Parcelas aparecem conforme contrato.
- Status vem da API.
- Nenhuma regra de calculo fica no frontend/mobile.

### J-071 - Tomador em atraso

Status: `PLANEJADO`

Perfil: tomador

Passos:
1. Login com parcela em atraso.
2. Abrir dashboard.
3. Ver alerta de atraso.
4. Abrir detalhe da cobranca.

Resultado esperado:
- UI mostra status de atraso sem recalcular regra.
- API expoe encargos e estado.
- Historico de cobranca fica disponivel.

## 13. Jornadas da Empresa Credora

### J-080 - Credora login + dashboard

Status: `PLANEJADO`

Perfil: empresa credora

Passos:
1. Login como usuario credora.
2. Abrir dashboard da credora.
3. Ver resumo de carteira, oportunidades e operacoes financiadas.

Resultado esperado:
- Credora nao acessa telas de tomador.
- Dados exibidos pertencem apenas a empresa vinculada.

### J-081 - Credora onboarding KYB

Status: `PLANEJADO`

Perfil: empresa credora

Pre-requisito:
- Sprint 7+ com KYB.

Passos:
1. Login.
2. Abrir onboarding da empresa.
3. Informar CNPJ, representantes e documentos.
4. Enviar para verificacao.
5. Acompanhar status.

Resultado esperado:
- KYB segue status e pendencias vindos da API.
- Pendencias sao exibidas sem permitir edicao de dados bloqueados.

## 14. Jornadas de Erro, Permissao e Seguranca

### J-090 - Erro de rede durante acao sensivel

Status: `ATUAL/PARCIAL NEGATIVO`

Perfil: usuario autenticado

Passos:
1. Login.
2. Iniciar alteracao de senha, KYC ou outra acao sensivel.
3. Simular queda de rede ou erro 5xx.
4. Tentar novamente.

Resultado esperado:
- UI exibe erro recuperavel.
- Operacao idempotente nao duplica efeitos.
- Usuario consegue repetir acao quando rede volta.

### J-091 - Step-up ausente em operacao sensivel

Status: `ATUAL NEGATIVO`

Perfil: usuario com MFA ativo

Passos:
1. Login.
2. Tentar alterar senha sem step-up valido.

Resultado esperado:
- API retorna 403 exigindo step-up.
- UI redireciona para fluxo de step-up.
- Apos step-up valido, acao e executada uma vez.

### J-092 - Logout em todos os dispositivos

Status: `ATUAL`

Perfil: usuario autenticado

Passos:
1. Login em dois clientes.
2. Executar logout-all.
3. Tentar usar a sessao antiga no outro cliente.

Resultado esperado:
- Refresh tokens da familia/usuario sao revogados conforme regra.
- Cliente antigo perde sessao no proximo refresh/chamada protegida.

## 15. Matriz de Cobertura Inicial

| Jornada | Web | Mobile | API | Status |
|---|---|---|---|---|
| J-001 landing -> login | Cobrir | N/A | N/A | ATUAL |
| J-010 login simples | Coberto parcialmente | Coberto parcialmente | Coberto | ATUAL |
| J-011 login MFA | Cobrir | Cobrir | Coberto parcialmente | ATUAL |
| J-020 consultar perfil | Coberto parcialmente | Coberto parcialmente | Coberto | ATUAL |
| J-022 alterar senha | Coberto | Coberto | Coberto | ATUAL |
| J-025 delecao de conta | Futuro | Futuro | Futuro | PLANEJADO |
| J-040 admin usuarios | Coberto | N/A | Coberto | ATUAL |
| J-050 KYC PF | Futuro | Futuro | Em Sprint 6 | PARCIAL |
| J-060 solicitar emprestimo | Futuro | Futuro | Futuro | PLANEJADO |
| J-070 parcelas | Futuro | Futuro | Futuro | PLANEJADO |
| J-080 credora dashboard | Futuro | Futuro | Futuro | PLANEJADO |

## 16. Regras para Automatizacao

- Priorizar jornadas `ATUAL` antes de automatizar jornadas futuras.
- Cada jornada automatizada deve criar sua propria massa de dados ou usar fixtures isoladas.
- Evitar depender de ordem entre testes.
- Usar `data-testid` em elementos criticos de fluxo.
- Validar estados de carregamento, erro e sucesso.
- Para cenarios com MFA, usar segredo TOTP deterministico apenas em ambiente de teste.
- Para jornadas com dados sensiveis, nunca imprimir CPF completo, token, senha, backup code ou conteudo de documento nos logs do teste.
- Para acoes idempotentes, repetir a chamada no teste e validar que o efeito nao duplica.

## 17. Proximos Cenarios a Transformar em E2E

1. Web: login com MFA + setup TOTP + logout + relogin com TOTP.
2. Web: usuario legado com reset obrigatorio de senha.
3. Mobile: fluxo de step-up antes de alterar senha.
4. API: KYC PF completo com callback aprovado.
5. API: KYC PF negativos de ownership, MIME invalido e CPF duplicado.
6. Web/mobile futuro: onboarding KYC quando telas existirem.
