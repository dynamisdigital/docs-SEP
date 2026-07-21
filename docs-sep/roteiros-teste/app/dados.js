// GERADO por gerar-dados.mjs — nao editar a mao.
// Fonte: docs-sep/roteiros-teste/*.md — rode `node gerar-dados.mjs` apos editar.
window.SEP_DADOS = {
  "schemaVersion": 1,
  "geradoEm": "2026-07-21T22:39:23.402Z",
  "gerador": {
    "arquivo": "gerar-dados.mjs",
    "versao": "1.1.0"
  },
  "totais": {
    "roteiros": 4,
    "escopos": 39,
    "jornadas": 25,
    "passos": 170,
    "assercoes": 23,
    "na": 1
  },
  "glossario": [
    {
      "termo": "MFA",
      "definicaoHtml": "Autenticação multifator: além da senha, o sistema exige um segundo fator. No SEP o segundo fator é o TOTP."
    },
    {
      "termo": "TOTP",
      "definicaoHtml": "Código numérico de 6 dígitos que muda a cada 30 segundos, gerado por um app autenticador (Google Authenticator, Authy) pareado com a conta. É o segundo fator do MFA."
    },
    {
      "termo": "Backup code",
      "definicaoHtml": "Código de uso único, entregue ao habilitar o MFA, que substitui o TOTP quando o celular não está à mão. Cada código só funciona uma vez."
    },
    {
      "termo": "Step-up",
      "definicaoHtml": "Reautenticação no meio de uma operação sensível: mesmo já logado, o usuário confirma identidade de novo e recebe um token de curta duração para aquela ação específica."
    },
    {
      "termo": "Step-up legado",
      "definicaoHtml": "Variante que só exige o token de step-up se o usuário tiver MFA habilitado. Quem não tem MFA passa direto."
    },
    {
      "termo": "Step-up estrito",
      "definicaoHtml": "Variante que <strong>nega</strong> a operação quando o usuário não tem MFA, antes mesmo de olhar o token. É a diferença que várias jornadas negativas testam."
    },
    {
      "termo": "Token de uso único",
      "definicaoHtml": "O token de step-up vale para <strong>uma</strong> mutação. Reenviar a mesma requisição com o mesmo token dá 403 — é proposital."
    },
    {
      "termo": "KYC",
      "definicaoHtml": "&quot;Know Your Customer&quot;: conferência de identidade da pessoa física."
    },
    {
      "termo": "KYB",
      "definicaoHtml": "O equivalente para pessoa jurídica: conferência da empresa e do representante."
    },
    {
      "termo": "PLD",
      "definicaoHtml": "Prevenção à lavagem de dinheiro. Exige trilha de auditoria do que aconteceu e quando."
    },
    {
      "termo": "Onboarding",
      "definicaoHtml": "A jornada de cadastro e aprovação que precede o crédito. Só com onboarding <code>APROVADO_FINAL</code> o tomador consegue criar proposta."
    },
    {
      "termo": "Proposta",
      "definicaoHtml": "O pedido de crédito criado pelo tomador, antes de virar contrato."
    },
    {
      "termo": "Formalização",
      "definicaoHtml": "A etapa entre a aprovação da proposta e o contrato assinado: gerar minuta, aceitar, assinar."
    },
    {
      "termo": "Minuta",
      "definicaoHtml": "A versão do contrato apresentada para leitura e aceite, antes da assinatura."
    },
    {
      "termo": "CCB",
      "definicaoHtml": "Cédula de Crédito Bancário: o documento de dívida que o tomador assina. É o PDF baixado ao fim da formalização."
    },
    {
      "termo": "Envelope",
      "definicaoHtml": "O pacote enviado ao provedor de assinatura digital. Tem status próprio (<code>ENVIADO</code>, <code>ASSINADO</code>) separado do status do contrato."
    },
    {
      "termo": "Webhook",
      "definicaoHtml": "Chamada que o provedor externo faz <strong>para</strong> o SEP avisando que algo aconteceu (ex.: &quot;o documento foi assinado&quot;). Nos roteiros ele é simulado pelo Insomnia."
    },
    {
      "termo": "HMAC",
      "definicaoHtml": "Assinatura criptográfica que acompanha o webhook e prova que ele veio mesmo do provedor. Webhook com HMAC errado deve ser recusado."
    },
    {
      "termo": "Idempotency-Key",
      "definicaoHtml": "Cabeçalho que identifica uma tentativa. Reenviar a mesma requisição com a mesma chave não duplica a operação — é o que protege contra duplo clique e retry."
    },
    {
      "termo": "IDOR",
      "definicaoHtml": "Falha em que trocar um ID na URL dá acesso ao dado de outra pessoa. As jornadas &quot;de contrato alheio&quot; existem para provar que o SEP <strong>não</strong> tem essa falha."
    },
    {
      "termo": "Escrow",
      "definicaoHtml": "Conta em que o dinheiro fica retido até a condição combinada se cumprir."
    },
    {
      "termo": "Lockout",
      "definicaoHtml": "Bloqueio temporário da conta após seguidas senhas erradas. No SEP: 5 tentativas em 15 min bloqueiam por 30 min."
    },
    {
      "termo": "RBAC",
      "definicaoHtml": "Controle de acesso por papel (<code>ADMIN</code>, <code>FINANCEIRO</code>, <code>BACKOFFICE</code>, <code>CLIENTE</code>). Define o que cada persona enxerga."
    },
    {
      "termo": "MSW",
      "definicaoHtml": "Mock Service Worker: camada que finge ser o backend no navegador. <strong>Se ele estiver ligado, o teste não vale</strong> — o roteiro exige o backend real."
    },
    {
      "termo": "DevTools",
      "definicaoHtml": "O painel do navegador aberto com <code>F12</code>. A aba <strong>Network</strong> mostra as chamadas de rede; a aba <strong>Console</strong> mostra os erros."
    },
    {
      "termo": "psql",
      "definicaoHtml": "O cliente de linha de comando do PostgreSQL. Nos roteiros ele é sempre chamado por dentro do Docker, pelo comando já pronto no passo."
    },
    {
      "termo": "Aba anônima",
      "definicaoHtml": "Janela do navegador que não reaproveita sessão nem cache de login. Garante que você está mesmo deslogado."
    }
  ],
  "diagnostico": {
    "avisos": [
      {
        "codigo": "SEM_RESULTADO_FINAL",
        "arquivo": "ROTEIRO-01-ACESSO-E-SESSAO.md",
        "linha": 142,
        "msg": "jornada J-002.M-N1 sem \"Resultado final esperado\""
      },
      {
        "codigo": "SEM_RESULTADO_FINAL",
        "arquivo": "ROTEIRO-01-ACESSO-E-SESSAO.md",
        "linha": 203,
        "msg": "jornada J-003.M sem \"Resultado final esperado\""
      },
      {
        "codigo": "SEM_RESULTADO_FINAL",
        "arquivo": "ROTEIRO-01-ACESSO-E-SESSAO.md",
        "linha": 313,
        "msg": "jornada J-011.W sem \"Resultado final esperado\""
      },
      {
        "codigo": "SEM_RESULTADO_FINAL",
        "arquivo": "ROTEIRO-01-ACESSO-E-SESSAO.md",
        "linha": 362,
        "msg": "jornada J-012.W-N1 sem \"Resultado final esperado\""
      },
      {
        "codigo": "SEM_RESULTADO_FINAL",
        "arquivo": "ROTEIRO-01-ACESSO-E-SESSAO.md",
        "linha": 417,
        "msg": "jornada J-020.W sem \"Resultado final esperado\""
      },
      {
        "codigo": "SEM_RESULTADO_FINAL",
        "arquivo": "ROTEIRO-01-ACESSO-E-SESSAO.md",
        "linha": 523,
        "msg": "jornada J-022.W-N1 sem \"Resultado final esperado\""
      },
      {
        "codigo": "SEM_RESULTADO_FINAL",
        "arquivo": "ROTEIRO-01-ACESSO-E-SESSAO.md",
        "linha": 556,
        "msg": "jornada J-030.W sem \"Resultado final esperado\""
      },
      {
        "codigo": "SEM_RESULTADO_FINAL",
        "arquivo": "ROTEIRO-01-ACESSO-E-SESSAO.md",
        "linha": 611,
        "msg": "jornada J-031.W sem \"Resultado final esperado\""
      },
      {
        "codigo": "SEM_RESULTADO_FINAL",
        "arquivo": "ROTEIRO-01-ACESSO-E-SESSAO.md",
        "linha": 651,
        "msg": "jornada J-033.W sem \"Resultado final esperado\""
      },
      {
        "codigo": "SEM_RESULTADO_FINAL",
        "arquivo": "ROTEIRO-04-CREDITO-FORMALIZACAO.md",
        "linha": 137,
        "msg": "jornada J-061.W-N1 sem \"Resultado final esperado\""
      },
      {
        "codigo": "SEM_RESULTADO_FINAL",
        "arquivo": "ROTEIRO-04-CREDITO-FORMALIZACAO.md",
        "linha": 179,
        "msg": "jornada J-062.W sem \"Resultado final esperado\""
      },
      {
        "codigo": "SEM_RESULTADO_FINAL",
        "arquivo": "ROTEIRO-04-CREDITO-FORMALIZACAO.md",
        "linha": 224,
        "msg": "jornada J-063.W sem \"Resultado final esperado\""
      },
      {
        "codigo": "SEM_RESULTADO_FINAL",
        "arquivo": "ROTEIRO-04-CREDITO-FORMALIZACAO.md",
        "linha": 372,
        "msg": "jornada J-070.W-N1 sem \"Resultado final esperado\""
      },
      {
        "codigo": "SEM_RESULTADO_FINAL",
        "arquivo": "ROTEIRO-04-CREDITO-FORMALIZACAO.md",
        "linha": 437,
        "msg": "jornada J-070.W-N2 sem \"Resultado final esperado\""
      },
      {
        "codigo": "SEM_RESULTADO_FINAL",
        "arquivo": "ROTEIRO-04-CREDITO-FORMALIZACAO.md",
        "linha": 582,
        "msg": "jornada J-072.W sem \"Resultado final esperado\""
      },
      {
        "codigo": "SEM_RESULTADO_FINAL",
        "arquivo": "ROTEIRO-04-CREDITO-FORMALIZACAO.md",
        "linha": 635,
        "msg": "jornada J-073.M sem \"Resultado final esperado\""
      }
    ]
  },
  "roteiros": [
    {
      "id": "CENARIOS",
      "arquivo": "CENARIOS-TESTE-JORNADAS-USUARIO.md",
      "hash": "33caf670",
      "titulo": "Roteiro de teste manual - Jornadas de usuário SEP",
      "tipo": "hub",
      "ordem": 0,
      "atualizadoEm": "2026-07-21",
      "resumoHtml": "",
      "escopos": [
        {
          "key": "CENARIOS/7.1",
          "id": "7.1",
          "escopoId": "7.1",
          "kind": "secao",
          "nivel": 3,
          "titulo": "Exclusão de cliente pelo admin — não existe",
          "anchor": "excluso-de-cliente-pelo-admin--no-existe",
          "ordem": 1,
          "meta": [],
          "metaIndex": {},
          "notas": [
            "<strong>Hub de execução.</strong> Roteiro manual, tela a tela, contra o <strong>backend real local</strong> (<code>:8080</code>, PostgreSQL em Docker, providers Fake). Cobre o marco <code>v1.0-local</code> (Fase 4). As jornadas ficam em <a href=\"./\" rel=\"noreferrer\"><code>roteiros-teste/</code></a>; este arquivo e o ponto de entrada, o preparo comum e a matriz de cobertura.",
            "Estado do produto: <a href=\"../STATE.md\" rel=\"noreferrer\"><code>STATE.md</code></a>. Escopo da fase: <a href=\"../PRD-FASE-4.md\" rel=\"noreferrer\"><code>PRD-FASE-4.md</code></a> §37.",
            "<strong>Exporte antes de fechar a aba.</strong> As marcações vivem no <code>localStorage</code> do navegador. Em <code>file://</code> alguns navegadores limpam esse armazenamento sem aviso (o Safari e o mais restritivo). Se o app detectar que não consegue gravar, ele exibe um banner vermelho no topo — nesse caso, exporte com frequência ou sirva a pasta por HTTP: <code>cd app &amp;&amp; python3 -m http.server 8000</code>.",
            "A jornada de lockout (<code>J-012.W-N1</code>) bloqueia a persona por <strong>30 minutos</strong>. Execute-a por último dentro da sessão de acesso.",
            "<strong>O mobile permanece no roteiro</strong> mesmo sem aparelho: ele roda como PWA no navegador. Isso não e detalhe — o <strong>cadastro de usuário só existe no mobile</strong> (§7.2). Sem essa superfície não há como criar conta pela UI, só pela API.",
            "<strong>Verifique que o MSW esta desligado.</strong> Web e mobile podem rodar com Mock Service Worker. Se a superfície estiver em mock, o resultado do roteiro <strong>não vale</strong> — o mock aceita credenciais que o backend real recusa. Ver <code>PRE-04</code> no <a href=\"./ROTEIRO-00-AMBIENTE-E-MASSA.md\" rel=\"noreferrer\"><code>ROTEIRO-00</code></a> §8.",
            "<code>golden-path-mobile.spec.ts</code> esta vermelha desde a M-13. E a <strong>única</strong> spec que já bate no <code>:8080</code> real — as demais injetam MSW. A jornada <code>J-010.M</code> do <a href=\"./ROTEIRO-01-ACESSO-E-SESSAO.md\" rel=\"noreferrer\"><code>ROTEIRO-01</code></a> executa manualmente o mesmo caminho e serve de referência para o diagnóstico.",
            "Os dois checkboxes transformam &quot;isso não existe&quot; em afirmação verificável. Se o endpoint aparecer um dia, o roteiro falha e avisa."
          ],
          "grupos": [],
          "assercoes": [
            {
              "key": "CENARIOS/7.1/#0d96370a",
              "id": null,
              "hash": "18f7cffe",
              "textoHtml": "Confirmar que <code>/app/admin/users/:id</code> <strong>não</strong> oferece ação de exclusão",
              "comoHtml": "Logado como <code>admin</code>, abrir o detalhe de um usuário e procurar botão de excluir, remover ou deletar. Não pode existir — o sistema não apaga usuário, por decisão. Se houver, é ocorrência (funcionalidade não prevista, com risco de perder trilha).",
              "textoBusca": "confirmar que /app/admin/users/:id não oferece ação de exclusão logado como admin, abrir o detalhe de um usuário e procurar botão de excluir, remover ou deletar. não pode existir — o sistema não apaga usuário, por decisão. se houver, é ocorrência (funcionalidade não prevista, com risco de perder trilha).",
              "esperadoHtml": null,
              "blocos": [],
              "na": false,
              "naMotivo": null,
              "marcadoNaFonte": false,
              "linha": 216,
              "ordem": 1
            },
            {
              "key": "CENARIOS/7.1/#d46c22c9",
              "id": null,
              "hash": "c70c25ab",
              "textoHtml": "Confirmar que <code>DELETE /api/v1/usuarios/{id}</code> responde <code>404</code>/<code>405</code>, não <code>500</code>",
              "comoHtml": "No Insomnia, montar um request <code>DELETE</code> para <code>/api/v1/usuarios/&lt;algum-id&gt;</code> com o <code>adminAccessToken</code>. O endpoint não existe, então a resposta certa é <code>404</code> (rota inexistente) ou <code>405</code> (método não permitido). Um <code>500</code> seria defeito: significaria que o endpoint existe e quebrou, em vez de simplesmente não existir.",
              "textoBusca": "confirmar que delete /api/v1/usuarios/{id} responde 404/405, não 500 no insomnia, montar um request delete para /api/v1/usuarios/<algum-id> com o adminaccesstoken. o endpoint não existe, então a resposta certa é 404 (rota inexistente) ou 405 (método não permitido). um 500 seria defeito: significaria que o endpoint existe e quebrou, em vez de simplesmente não existir.",
              "esperadoHtml": null,
              "blocos": [],
              "na": false,
              "naMotivo": null,
              "marcadoNaFonte": false,
              "linha": 220,
              "ordem": 2
            }
          ],
          "linha": 208,
          "stats": {
            "passos": 0,
            "na": 0,
            "assercoes": 2
          }
        },
        {
          "key": "CENARIOS/8",
          "id": "8",
          "escopoId": "8",
          "kind": "secao",
          "nivel": 2,
          "titulo": "Achados a confirmar em execução",
          "anchor": "achados-a-confirmar-em-execuo",
          "ordem": 2,
          "meta": [],
          "metaIndex": {},
          "notas": [],
          "grupos": [
            {
              "id": "g1",
              "tituloHtml": null,
              "tela": null,
              "implicito": true,
              "passos": [
                {
                  "key": "CENARIOS/8/A1",
                  "id": "A1",
                  "hash": "25dcfd1e",
                  "textoHtml": "A rota <code>/app/credora</code> <strong>não</strong> tem <code>roleGuard</code>, embora o item de menu seja <code>roles: ['CLIENTE']</code>. Conferir se <code>financeiro</code>, <code>backoffice</code> e <code>admin</code> alcançam a tela por URL direta. Se alcançarem, decidir se é intencional (o <code>credoraPresenceGuard</code> já barra as sub-rotas) ou gap de guard.",
                  "comoHtml": "Logar como <code>financeiro</code> e colar <code>http://localhost:4200/app/credora</code> na barra. Repetir com <code>backoffice</code> e <code>admin</code>. Anotar, para cada um, se a tela abre ou é barrada. Este é um <strong>achado a confirmar</strong>: o resultado alimenta uma decisão de projeto, não é pass/fail — registrar o que observou, sem julgar como defeito.",
                  "textoBusca": "a rota /app/credora não tem roleguard, embora o item de menu seja roles: ['cliente']. conferir se financeiro, backoffice e admin alcançam a tela por url direta. se alcançarem, decidir se é intencional (o credorapresenceguard já barra as sub-rotas) ou gap de guard. logar como financeiro e colar http://localhost:4200/app/credora na barra. repetir com backoffice e admin. anotar, para cada um, se a tela abre ou é barrada. este é um achado a confirmar: o resultado alimenta uma decisão de projeto, não é pass/fail — registrar o que observou, sem julgar como defeito.",
                  "esperadoHtml": null,
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 268,
                  "ordem": 1
                },
                {
                  "key": "CENARIOS/8/A2",
                  "id": "A2",
                  "hash": "5a885f3b",
                  "textoHtml": "<code>roleGuard</code> (web e mobile) checa <code>user.role</code> — apenas a role <strong>principal</strong>, nunca o conjunto. Um usuário <code>{CLIENTE, FINANCEIRO}</code> tem principal <code>FINANCEIRO</code> e perderia acesso a rotas marcadas <code>CLIENTE</code>. Conferir com o <code>admin@sep.test</code>, que nasce <code>ADMIN</code>+<code>CLIENTE</code> pelo bootstrap.",
                  "comoHtml": "Logar como <code>admin@sep.test</code> (que é ADMIN <strong>e</strong> CLIENTE) e tentar abrir uma rota marcada só para <code>CLIENTE</code>, como <code>/app/credito/propostas/nova</code>. Registrar se ele alcança ou é barrado — isso mostra se o guard olha só a role principal ou o conjunto todo.",
                  "textoBusca": "roleguard (web e mobile) checa user.role — apenas a role principal, nunca o conjunto. um usuário {cliente, financeiro} tem principal financeiro e perderia acesso a rotas marcadas cliente. conferir com o admin@sep.test, que nasce admin+cliente pelo bootstrap. logar como admin@sep.test (que é admin e cliente) e tentar abrir uma rota marcada só para cliente, como /app/credito/propostas/nova. registrar se ele alcança ou é barrado — isso mostra se o guard olha só a role principal ou o conjunto todo.",
                  "esperadoHtml": null,
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 276,
                  "ordem": 2
                },
                {
                  "key": "CENARIOS/8/A3",
                  "id": "A3",
                  "hash": "dbe2caab",
                  "textoHtml": "O <code>credoraPresenceGuard</code> do web <strong>libera</strong> o acesso quando o erro não é 404. Conferir o comportamento com a API fora do ar.",
                  "comoHtml": "Logar como <code>cliente-a</code>, abrir uma rota de credora e então <strong>parar a API</strong> (<code>Ctrl+C</code> no terminal do A3 do ROTEIRO-00). Recarregar a rota de credora e observar: o guard deixa passar ou barra? Religar a API depois. Registrar o comportamento observado.",
                  "textoBusca": "o credorapresenceguard do web libera o acesso quando o erro não é 404. conferir o comportamento com a api fora do ar. logar como cliente-a, abrir uma rota de credora e então parar a api (ctrl+c no terminal do a3 do roteiro-00). recarregar a rota de credora e observar: o guard deixa passar ou barra? religar a api depois. registrar o comportamento observado.",
                  "esperadoHtml": null,
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 283,
                  "ordem": 3
                },
                {
                  "key": "CENARIOS/8/A4",
                  "id": "A4",
                  "hash": "a9827e56",
                  "textoHtml": "O <code>sep-app</code> não tem equivalente do <code>redirectAuthenticatedGuard</code> do mobile: um usuário logado consegue reabrir <code>/login</code>. Conferir se isso gera estado inconsistente.",
                  "comoHtml": "Logado no web, colar <code>http://localhost:4200/login</code> na barra. A tela de login abre mesmo já logado? Se abrir, tentar entrar de novo e observar se algo quebra — é isso que se investiga: reentrar não pode deixar a sessão num estado estranho.",
                  "textoBusca": "o sep-app não tem equivalente do redirectauthenticatedguard do mobile: um usuário logado consegue reabrir /login. conferir se isso gera estado inconsistente. logado no web, colar http://localhost:4200/login na barra. a tela de login abre mesmo já logado? se abrir, tentar entrar de novo e observar se algo quebra — é isso que se investiga: reentrar não pode deixar a sessão num estado estranho.",
                  "esperadoHtml": null,
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 288,
                  "ordem": 4
                },
                {
                  "key": "CENARIOS/8/A5",
                  "id": "A5",
                  "hash": "1c98dc29",
                  "textoHtml": "<a href=\"../../repos/sep-api/CONTRATOS.md\" rel=\"noreferrer\"><code>CONTRATOS.md</code></a> descreve o aceite com <code>@RequireStepUp</code>, mas o <code>ContratoController</code> usa <code>@RequireStepUpEstrito</code> desde a Sprint 27. Divergência documental a corrigir no doc operacional.",
                  "comoHtml": "Este é o único A que não se testa na tela — é conferência de documento. A prova prática já está na <a href=\"./ROTEIRO-04-CREDITO-FORMALIZACAO.md#j-070w-n1---aceite-negado-para-usuário-sem-mfa\" rel=\"noreferrer\"><code>J-070.W-N1</code></a>: o aceite exige MFA, logo é estrito. Marcar quando aquela jornada confirmar, e registrar que o <code>CONTRATOS.md</code> precisa de correção.",
                  "textoBusca": "contratos.md descreve o aceite com @requirestepup, mas o contratocontroller usa @requirestepupestrito desde a sprint 27. divergência documental a corrigir no doc operacional. este é o único a que não se testa na tela — é conferência de documento. a prova prática já está na j-070.w-n1: o aceite exige mfa, logo é estrito. marcar quando aquela jornada confirmar, e registrar que o contratos.md precisa de correção.",
                  "esperadoHtml": null,
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 293,
                  "ordem": 5
                }
              ]
            }
          ],
          "assercoes": [],
          "linha": 264,
          "stats": {
            "passos": 5,
            "na": 0,
            "assercoes": 0
          }
        }
      ],
      "ocorrenciasColunas": [],
      "registroCampos": []
    },
    {
      "id": "ROTEIRO-00",
      "arquivo": "ROTEIRO-00-AMBIENTE-E-MASSA.md",
      "hash": "61caa9ea",
      "titulo": "Roteiro 00 - Ambiente e massa de dados",
      "tipo": "secoes",
      "ordem": 10,
      "atualizadoEm": "2026-07-21",
      "resumoHtml": "",
      "escopos": [
        {
          "key": "ROTEIRO-00/2",
          "id": "2",
          "escopoId": "2",
          "kind": "secao",
          "nivel": 2,
          "titulo": "O que você precisa antes de começar",
          "anchor": "o-que-voc-precisa-antes-de-comear",
          "ordem": 1,
          "meta": [],
          "metaIndex": {},
          "notas": [
            "Pré-requisito de <strong>todos</strong> os demais roteiros. Nada aqui e jornada de usuário: e o preparo que faz as jornadas serem executáveis contra o backend real local. Hub: <a href=\"./CENARIOS-TESTE-JORNADAS-USUARIO.md\" rel=\"noreferrer\"><code>CENARIOS-TESTE-JORNADAS-USUARIO.md</code></a>.",
            "<strong>Execute pelo <a href=\"./app/index.html\" rel=\"noreferrer\">app</a></strong>, não editando este arquivo — as caixas aqui ficam sempre vazias. Desvio não vira caixa marcada: vira <strong>ocorrência</strong> registrada no passo."
          ],
          "grupos": [],
          "assercoes": [
            {
              "key": "ROTEIRO-00/2/#0a2a5264",
              "id": null,
              "hash": "2d5212a1",
              "textoHtml": "Docker e Docker Compose instalados e o daemon rodando",
              "comoHtml": "No terminal, rodar <code>docker ps</code>. Se listar uma tabela (mesmo vazia), está tudo certo. Se disser &quot;Cannot connect to the Docker daemon&quot;, o Docker está instalado mas não iniciado — abrir o Docker Desktop, ou no Linux <code>sudo systemctl start docker</code>.",
              "textoBusca": "docker e docker compose instalados e o daemon rodando no terminal, rodar docker ps. se listar uma tabela (mesmo vazia), está tudo certo. se disser \"cannot connect to the docker daemon\", o docker está instalado mas não iniciado — abrir o docker desktop, ou no linux sudo systemctl start docker.",
              "esperadoHtml": null,
              "blocos": [],
              "na": false,
              "naMotivo": null,
              "marcadoNaFonte": false,
              "linha": 24,
              "ordem": 1
            },
            {
              "key": "ROTEIRO-00/2/#2710b503",
              "id": null,
              "hash": "e65e22d4",
              "textoHtml": "JDK 21 disponível (<code>java -version</code>)",
              "comoHtml": "Rodar <code>java -version</code>. A primeira linha precisa começar com <code>21</code>. Se aparecer 17, 11 ou &quot;command not found&quot;, a API não sobe — instalar o JDK 21 antes de seguir.",
              "textoBusca": "jdk 21 disponível (java -version) rodar java -version. a primeira linha precisa começar com 21. se aparecer 17, 11 ou \"command not found\", a api não sobe — instalar o jdk 21 antes de seguir.",
              "esperadoHtml": null,
              "blocos": [],
              "na": false,
              "naMotivo": null,
              "marcadoNaFonte": false,
              "linha": 28,
              "ordem": 2
            },
            {
              "key": "ROTEIRO-00/2/#af3b05ae",
              "id": null,
              "hash": "caefa939",
              "textoHtml": "Node.js &gt;= 22 (<code>node -v</code>) — exigido pelo CLI do Capacitor 8 (<a href=\"../../adr/0019-baseline-capacitor-8-mobile.md\" rel=\"noreferrer\">ADR 0019</a>)",
              "comoHtml": "Rodar <code>node -v</code>. Precisa ser <code>v22</code> ou maior. Versão menor faz o <code>npm start</code> do mobile falhar de um jeito difícil de diagnosticar — vale conferir agora.",
              "textoBusca": "node.js >= 22 (node -v) — exigido pelo cli do capacitor 8 (adr 0019) rodar node -v. precisa ser v22 ou maior. versão menor faz o npm start do mobile falhar de um jeito difícil de diagnosticar — vale conferir agora.",
              "esperadoHtml": null,
              "blocos": [],
              "na": false,
              "naMotivo": null,
              "marcadoNaFonte": false,
              "linha": 31,
              "ordem": 3
            },
            {
              "key": "ROTEIRO-00/2/#54d2057e",
              "id": null,
              "hash": "4d5681ec",
              "textoHtml": "Um autenticador TOTP (Google Authenticator, Aegis, 1Password, Bitwarden — extensão de navegador serve). <strong>Não há atalho</strong>: o step-up estrito exige código válido",
              "comoHtml": "Instalar um destes no celular ou como extensão do navegador. A extensão é mais prática, porque dá para copiar o código em vez de digitar olhando para o celular. Não dá para pular: várias jornadas param sem um código TOTP válido de verdade.",
              "textoBusca": "um autenticador totp (google authenticator, aegis, 1password, bitwarden — extensão de navegador serve). não há atalho: o step-up estrito exige código válido instalar um destes no celular ou como extensão do navegador. a extensão é mais prática, porque dá para copiar o código em vez de digitar olhando para o celular. não dá para pular: várias jornadas param sem um código totp válido de verdade.",
              "esperadoHtml": null,
              "blocos": [],
              "na": false,
              "naMotivo": null,
              "marcadoNaFonte": false,
              "linha": 34,
              "ordem": 4
            },
            {
              "key": "ROTEIRO-00/2/#f8c034df",
              "id": null,
              "hash": "865a812e",
              "textoHtml": "<strong>Insomnia</strong> com a collection do projeto importada — ver §3.1",
              "comoHtml": "Baixar em <code>insomnia.rest</code> e instalar. O Insomnia é o programa usado para chamar a API direto, sem passar pela tela — várias verificações do roteiro só existem lá. A importação da collection é o §3.1, logo abaixo.",
              "textoBusca": "insomnia com a collection do projeto importada — ver §3.1 baixar em insomnia.rest e instalar. o insomnia é o programa usado para chamar a api direto, sem passar pela tela — várias verificações do roteiro só existem lá. a importação da collection é o §3.1, logo abaixo.",
              "esperadoHtml": null,
              "blocos": [],
              "na": false,
              "naMotivo": null,
              "marcadoNaFonte": false,
              "linha": 39,
              "ordem": 5
            }
          ],
          "linha": 22,
          "stats": {
            "passos": 0,
            "na": 0,
            "assercoes": 5
          }
        },
        {
          "key": "ROTEIRO-00/3.1",
          "id": "3.1",
          "escopoId": "3.1",
          "kind": "secao",
          "nivel": 3,
          "titulo": "Insomnia",
          "anchor": "insomnia",
          "ordem": 2,
          "meta": [],
          "metaIndex": {},
          "notas": [
            "<strong>O mobile continua no roteiro.</strong> Ele roda como PWA em <code>localhost:8100</code>, que e navegador. Isso importa porque o <strong>cadastro de usuário só existe no mobile</strong> — no web, <code>/register</code> e tela de canalização. Sem a superfície mobile não há como criar conta pela UI.",
            "<strong>Atenção ao MSW.</strong> Web e mobile podem rodar com mock (Mock Service Worker) em vez do backend real. Este roteiro exige backend real. Ver <code>PRE-04</code>.",
            "As variáveis de token e ID nascem <strong>vazias</strong> de propósito: a collection e versionada e não pode carregar credencial nem PII. Preencher e parte do roteiro.",
            "<strong>Nota editorial.</strong> O restante do <code>docs-SEP</code> escreve sem acentuação, mas os roteiros de teste são a <strong>exceção</strong>: quem executa é gente que não conhece o sistema, e português sem acento cansa numa leitura de ~170 passos. Aqui se escreve em PT-BR correto. O parser e o app comparam marcadores sem acento (<code>semAcento()</code>), então acentuar um título de seção não quebra a geração — mas <strong>acentuar o texto de um passo muda o hash dele</strong> e marca &quot;revise&quot; para quem já executou. Ajuste texto de passo só quando for necessário mesmo.",
            "Os nomes de pasta e de request do Insomnia são citados <strong>literalmente</strong> (<code>Usuários</code>, <code>criar cliente público</code>) porque precisam bater com a busca da ferramenta. Não &quot;corrigir&quot; essas ocorrências."
          ],
          "grupos": [],
          "assercoes": [
            {
              "key": "ROTEIRO-00/3.1/#47146b58",
              "id": null,
              "hash": "1e48d45c",
              "textoHtml": "Importar <a href=\"../sep-api.insomnia_collection.json\" rel=\"noreferrer\"><code>sep-api.insomnia_collection.json</code></a>",
              "comoHtml": "O arquivo fica em <code>docs-SEP/docs-sep/</code>, um nível acima desta pasta. No Insomnia: <strong>Application</strong> &gt; <strong>Preferences</strong> &gt; <strong>Data</strong> &gt; <strong>Import Data</strong> &gt; <strong>From File</strong>, e escolher esse arquivo. Depois de importar, a barra lateral mostra as pastas — é por elas que os passos se referem aos requests, no formato <code>Insomnia &gt; **Pasta** &gt; nome do request</code>.",
              "textoBusca": "importar sep-api.insomniacollection.json o arquivo fica em docs-sep/docs-sep/, um nível acima desta pasta. no insomnia: application > preferences > data > import data > from file, e escolher esse arquivo. depois de importar, a barra lateral mostra as pastas — é por elas que os passos se referem aos requests, no formato insomnia > pasta > nome do request.",
              "esperadoHtml": "18 pastas e 150 requests. Há também uma <a href=\"../sep-api.postman_collection.json\" rel=\"noreferrer\">collection Postman</a> equivalente.",
              "blocos": [],
              "na": false,
              "naMotivo": null,
              "marcadoNaFonte": false,
              "linha": 71,
              "ordem": 1
            },
            {
              "key": "ROTEIRO-00/3.1/#d42574f4",
              "id": null,
              "hash": "9d4057fa",
              "textoHtml": "Selecionar o environment e conferir <code>baseUrl = http://localhost:8080</code>",
              "comoHtml": "No topo da barra lateral há um seletor de environment (costuma vir escrito &quot;No Environment&quot;). Selecionar o environment da collection e abrir para editar: <code>baseUrl</code> precisa estar como <code>http://localhost:8080</code>. As demais variáveis (<code>adminAccessToken</code>, <code>clienteId</code>...) estão <strong>vazias de propósito</strong> — você as preenche conforme os passos mandarem guardar valores.",
              "textoBusca": "selecionar o environment e conferir baseurl = http://localhost:8080 no topo da barra lateral há um seletor de environment (costuma vir escrito \"no environment\"). selecionar o environment da collection e abrir para editar: baseurl precisa estar como http://localhost:8080. as demais variáveis (adminaccesstoken, clienteid...) estão vazias de propósito — você as preenche conforme os passos mandarem guardar valores.",
              "esperadoHtml": null,
              "blocos": [],
              "na": false,
              "naMotivo": null,
              "marcadoNaFonte": false,
              "linha": 79,
              "ordem": 2
            }
          ],
          "linha": 66,
          "stats": {
            "passos": 0,
            "na": 0,
            "assercoes": 2
          }
        },
        {
          "key": "ROTEIRO-00/4.1",
          "id": "4.1",
          "escopoId": "4.1",
          "kind": "secao",
          "nivel": 3,
          "titulo": "Banco de dados",
          "anchor": "banco-de-dados",
          "ordem": 3,
          "meta": [],
          "metaIndex": {},
          "notas": [],
          "grupos": [
            {
              "id": "g1",
              "tituloHtml": null,
              "tela": null,
              "implicito": true,
              "passos": [
                {
                  "key": "ROTEIRO-00/4.1/A1",
                  "id": "A1",
                  "hash": "4e652bf5",
                  "textoHtml": "No <code>sep-api</code>, subir o Postgres:",
                  "comoHtml": "Abrir um terminal na raiz do workspace — a pasta que contém <code>sep-api</code>, <code>sep-app</code> e <code>sep-mobile</code> — e rodar os dois comandos. O <code>-d</code> deixa o banco rodando em segundo plano, então o terminal volta a ficar livre. <strong>Deixe este terminal aberto</strong>: ele é o que você vai usar nos passos de SQL mais adiante.",
                  "textoBusca": "no sep-api, subir o postgres: abrir um terminal na raiz do workspace — a pasta que contém sep-api, sep-app e sep-mobile — e rodar os dois comandos. o -d deixa o banco rodando em segundo plano, então o terminal volta a ficar livre. deixe este terminal aberto: ele é o que você vai usar nos passos de sql mais adiante.",
                  "esperadoHtml": "container <code>sep-postgres</code> em execução (<code>docker ps</code>), imagem <code>postgres:16-alpine</code>, porta <code>5432</code> publicada.",
                  "blocos": [
                    {
                      "tipo": "codigo",
                      "lang": "bash",
                      "regiao": "como",
                      "conteudo": "cd sep-api\ndocker compose up -d postgres"
                    }
                  ],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 115,
                  "ordem": 1
                },
                {
                  "key": "ROTEIRO-00/4.1/A2",
                  "id": "A2",
                  "hash": "650b3ef4",
                  "textoHtml": "Conferir que o banco aceita conexão:",
                  "comoHtml": "Rodar no mesmo terminal. O comando pergunta ao Postgres se ele já está pronto para receber conexão. Subir o container leva alguns segundos: se a resposta for &quot;no response&quot;, esperar 5 segundos e repetir antes de concluir que deu errado.",
                  "textoBusca": "conferir que o banco aceita conexão: rodar no mesmo terminal. o comando pergunta ao postgres se ele já está pronto para receber conexão. subir o container leva alguns segundos: se a resposta for \"no response\", esperar 5 segundos e repetir antes de concluir que deu errado.",
                  "esperadoHtml": "<code>accepting connections</code>.",
                  "blocos": [
                    {
                      "tipo": "codigo",
                      "lang": "bash",
                      "regiao": "como",
                      "conteudo": "docker exec sep-postgres pg_isready -U sep -d sep_dev"
                    }
                  ],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 126,
                  "ordem": 2
                }
              ]
            }
          ],
          "assercoes": [],
          "linha": 113,
          "stats": {
            "passos": 2,
            "na": 0,
            "assercoes": 0
          }
        },
        {
          "key": "ROTEIRO-00/4.2",
          "id": "4.2",
          "escopoId": "4.2",
          "kind": "secao",
          "nivel": 3,
          "titulo": "API",
          "anchor": "api",
          "ordem": 4,
          "meta": [],
          "metaIndex": {},
          "notas": [],
          "grupos": [
            {
              "id": "g1",
              "tituloHtml": null,
              "tela": null,
              "implicito": true,
              "passos": [
                {
                  "key": "ROTEIRO-00/4.2/A3",
                  "id": "A3",
                  "hash": "5d74eb13",
                  "textoHtml": "Subir a API:",
                  "comoHtml": "Abrir um <strong>segundo</strong> terminal — o primeiro fica reservado para o banco — entrar em <code>sep-api</code> e rodar o comando. Ele não devolve o prompt: a API fica rodando e imprimindo log, e é assim mesmo. Esperar a linha <code>Started SepApiApplication</code>. <strong>Deixe este terminal aberto</strong> durante toda a execução; fechá-lo derruba a API.",
                  "textoBusca": "subir a api: abrir um segundo terminal — o primeiro fica reservado para o banco — entrar em sep-api e rodar o comando. ele não devolve o prompt: a api fica rodando e imprimindo log, e é assim mesmo. esperar a linha started sepapiapplication. deixe este terminal aberto durante toda a execução; fechá-lo derruba a api.",
                  "esperadoHtml": "sobe sem erro; o Flyway aplica as migrations até a última versão.",
                  "blocos": [
                    {
                      "tipo": "codigo",
                      "lang": "bash",
                      "regiao": "como",
                      "conteudo": "./gradlew bootRun"
                    }
                  ],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 141,
                  "ordem": 1
                },
                {
                  "key": "ROTEIRO-00/4.2/A4",
                  "id": "A4",
                  "hash": "6e2cf4e5",
                  "textoHtml": "Conferir prontidão: Insomnia &gt; <strong>Actuator</strong> &gt; <code>GET /actuator/health</code>.",
                  "comoHtml": "No Insomnia, abrir a pasta <strong>Actuator</strong> na barra lateral, clicar no request <code>GET /actuator/health</code> e depois no botão <strong>Send</strong>. A resposta aparece no painel da direita. Erro de conexão aqui significa que a API do <strong>A3</strong> não subiu.",
                  "textoBusca": "conferir prontidão: insomnia > actuator > get /actuator/health. no insomnia, abrir a pasta actuator na barra lateral, clicar no request get /actuator/health e depois no botão send. a resposta aparece no painel da direita. erro de conexão aqui significa que a api do a3 não subiu.",
                  "esperadoHtml": "<code>{\"status\":\"UP\"}</code>.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 150,
                  "ordem": 2
                },
                {
                  "key": "ROTEIRO-00/4.2/A5",
                  "id": "A5",
                  "hash": "43336e29",
                  "textoHtml": "Conferir que as migrations rodaram por completo:",
                  "comoHtml": "Rodar no terminal do banco (o do <strong>A1</strong>). O comando lê a tabela em que o Flyway registra cada migration aplicada. Olhar a coluna <code>success</code>: <code>t</code> é sucesso, <code>f</code> é falha. Uma única linha <code>f</code> significa banco em estado inconsistente — nesse caso, fazer o reset do §7 antes de continuar, porque nada adiante vai funcionar direito.",
                  "textoBusca": "conferir que as migrations rodaram por completo: rodar no terminal do banco (o do a1). o comando lê a tabela em que o flyway registra cada migration aplicada. olhar a coluna success: t é sucesso, f é falha. uma única linha f significa banco em estado inconsistente — nesse caso, fazer o reset do §7 antes de continuar, porque nada adiante vai funcionar direito.",
                  "esperadoHtml": "as últimas linhas com <code>success = t</code>. Nenhuma migration falhada.",
                  "blocos": [
                    {
                      "tipo": "codigo",
                      "lang": "bash",
                      "regiao": "como",
                      "conteudo": "docker exec sep-postgres psql -U sep -d sep_dev \\\n  -c \"SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;\""
                    }
                  ],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 155,
                  "ordem": 3
                },
                {
                  "key": "ROTEIRO-00/4.2/A6",
                  "id": "A6",
                  "hash": "d3b97054",
                  "textoHtml": "Conferir que os providers estão em Fake (default do <code>application.yml</code>): nenhuma variável <code>APP_*_PROVIDER</code> apontando para adapter real no shell.",
                  "comoHtml": "No terminal em que você subiu a API, rodar <code>env | grep APP_</code> (no PowerShell, <code>Get-ChildItem Env:APP_*</code>). O esperado é <strong>não sair nada</strong>: sem variável definida, a API usa o default do <code>application.yml</code>, que é o provider Fake. Se aparecer alguma variável apontando para adapter real, o teste tentaria falar com serviço externo de verdade — apagar a variável e reiniciar a API.",
                  "textoBusca": "conferir que os providers estão em fake (default do application.yml): nenhuma variável appprovider apontando para adapter real no shell. no terminal em que você subiu a api, rodar env | grep app (no powershell, get-childitem env:app). o esperado é não sair nada: sem variável definida, a api usa o default do application.yml, que é o provider fake. se aparecer alguma variável apontando para adapter real, o teste tentaria falar com serviço externo de verdade — apagar a variável e reiniciar a api.",
                  "esperadoHtml": "KYC, KYB e PLD em <code>fake</code>. Nenhuma chamada externa sai da máquina.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 165,
                  "ordem": 4
                }
              ]
            }
          ],
          "assercoes": [],
          "linha": 139,
          "stats": {
            "passos": 4,
            "na": 0,
            "assercoes": 0
          }
        },
        {
          "key": "ROTEIRO-00/4.3",
          "id": "4.3",
          "escopoId": "4.3",
          "kind": "secao",
          "nivel": 3,
          "titulo": "Web e mobile",
          "anchor": "web-e-mobile",
          "ordem": 5,
          "meta": [],
          "metaIndex": {},
          "notas": [],
          "grupos": [
            {
              "id": "g1",
              "tituloHtml": null,
              "tela": null,
              "implicito": true,
              "passos": [
                {
                  "key": "ROTEIRO-00/4.3/A7",
                  "id": "A7",
                  "hash": "cfb17564",
                  "textoHtml": "Subir o web:",
                  "comoHtml": "<strong>Terceiro</strong> terminal, também na raiz do workspace. Na primeira vez, rodar <code>npm ci</code> antes do <code>npm start</code> para instalar as dependências (demora alguns minutos). Este terminal também fica ocupado e precisa continuar aberto.",
                  "textoBusca": "subir o web: terceiro terminal, também na raiz do workspace. na primeira vez, rodar npm ci antes do npm start para instalar as dependências (demora alguns minutos). este terminal também fica ocupado e precisa continuar aberto.",
                  "esperadoHtml": "<code>http://localhost:4200</code> carrega a landing pública.",
                  "blocos": [
                    {
                      "tipo": "codigo",
                      "lang": "bash",
                      "regiao": "como",
                      "conteudo": "cd sep-app && npm start"
                    }
                  ],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 176,
                  "ordem": 1
                },
                {
                  "key": "ROTEIRO-00/4.3/A8",
                  "id": "A8",
                  "hash": "93814a63",
                  "textoHtml": "Subir o mobile (PWA) e abrir no navegador:",
                  "comoHtml": "<strong>Quarto</strong> terminal. Mesma coisa do A7: <code>npm ci</code> na primeira vez. Ao final você tem quatro terminais abertos (banco, API, web, mobile) — vale deixá-los identificados, porque os passos adiante dizem em qual rodar. O &quot;mobile&quot; aqui é o site aberto no navegador comum, não um celular.",
                  "textoBusca": "subir o mobile (pwa) e abrir no navegador: quarto terminal. mesma coisa do a7: npm ci na primeira vez. ao final você tem quatro terminais abertos (banco, api, web, mobile) — vale deixá-los identificados, porque os passos adiante dizem em qual rodar. o \"mobile\" aqui é o site aberto no navegador comum, não um celular.",
                  "esperadoHtml": "<code>http://localhost:8100</code> carrega a splash e navega para <code>/welcome</code>.",
                  "blocos": [
                    {
                      "tipo": "codigo",
                      "lang": "bash",
                      "regiao": "como",
                      "conteudo": "cd sep-mobile && npm start"
                    }
                  ],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 184,
                  "ordem": 2
                },
                {
                  "key": "ROTEIRO-00/4.3/A9",
                  "id": "A9",
                  "hash": "260576e6",
                  "textoHtml": "Ativar a emulação de dispositivo no DevTools (Pixel 5 ou 390x844).",
                  "comoHtml": "Na aba do <code>localhost:8100</code>, abrir o DevTools com <code>F12</code> e ligar o modo dispositivo com <code>Ctrl+Shift+M</code>. No seletor que aparece no topo da página, escolher <strong>Pixel 5</strong>. Sem isso o mobile abre em tamanho de desktop e o layout não é o que se quer testar.",
                  "textoBusca": "ativar a emulação de dispositivo no devtools (pixel 5 ou 390x844). na aba do localhost:8100, abrir o devtools com f12 e ligar o modo dispositivo com ctrl+shift+m. no seletor que aparece no topo da página, escolher pixel 5. sem isso o mobile abre em tamanho de desktop e o layout não é o que se quer testar.",
                  "esperadoHtml": "layout mobile. As specs Playwright usam Pixel 5; usar a mesma referência mantém os resultados comparáveis.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 193,
                  "ordem": 3
                }
              ]
            }
          ],
          "assercoes": [],
          "linha": 174,
          "stats": {
            "passos": 3,
            "na": 0,
            "assercoes": 0
          }
        },
        {
          "key": "ROTEIRO-00/5.2",
          "id": "5.2",
          "escopoId": "5.2",
          "kind": "secao",
          "nivel": 3,
          "titulo": "Cadastrar o usuário que virara ADMIN",
          "anchor": "cadastrar-o-usurio-que-virara-admin",
          "ordem": 6,
          "meta": [],
          "metaIndex": {},
          "notas": [
            "<strong>Política de senha real.</strong> Mínimo 12 caracteres <strong>ou</strong> passphrase de 4+ palavras. A senha <code>123456</code> usada nos fixtures e no MSW <strong>não passa</strong> no backend real — ela existe apenas no mock. Use as senhas deste roteiro.",
            "A verificação HIBP (vazamento de senha) vem <strong>desabilitada</strong> por default (<code>NoopPasswordBreachChecker</code>, <code>matchIfMissing = true</code>), então o cadastro não depende de acesso a internet."
          ],
          "grupos": [
            {
              "id": "g1",
              "tituloHtml": null,
              "tela": null,
              "implicito": true,
              "passos": [
                {
                  "key": "ROTEIRO-00/5.2/B1",
                  "id": "B1",
                  "hash": "01f9d9d2",
                  "textoHtml": "Insomnia &gt; <strong>Usuários</strong> &gt; <code>POST /usuarios (criar cliente público) — 201</code>, com o body:",
                  "comoHtml": "No Insomnia, abrir a pasta <strong>Usuários</strong> (com acento — é o nome literal na collection) e clicar no request <code>POST /usuarios (criar cliente público) — 201</code>. No painel do meio, aba <strong>Body</strong>, substituir o conteúdo pelo JSON abaixo e clicar em <strong>Send</strong>. Na resposta, copiar o valor do campo <code>id</code> e colar na variável <code>adminId</code> do environment — vários passos adiante dependem dele. Este usuário nasce como <code>CLIENTE</code> comum; ele vira ADMIN no <strong>B2</strong>.",
                  "textoBusca": "insomnia > usuários > post /usuarios (criar cliente público) — 201, com o body: no insomnia, abrir a pasta usuários (com acento — é o nome literal na collection) e clicar no request post /usuarios (criar cliente público) — 201. no painel do meio, aba body, substituir o conteúdo pelo json abaixo e clicar em send. na resposta, copiar o valor do campo id e colar na variável adminid do environment — vários passos adiante dependem dele. este usuário nasce como cliente comum; ele vira admin no b2.",
                  "esperadoHtml": "<code>201</code> com o <code>id</code> (UUID v6) e <code>role: \"CLIENTE\"</code>. Guardar o <code>id</code> em <code>adminId</code>.",
                  "blocos": [
                    {
                      "tipo": "codigo",
                      "lang": "json",
                      "regiao": "como",
                      "conteudo": "{ \"username\": \"admin@sep.test\", \"password\": \"roteiro-manual-sep-2026\" }"
                    }
                  ],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 223,
                  "ordem": 1
                }
              ]
            }
          ],
          "assercoes": [],
          "linha": 217,
          "stats": {
            "passos": 1,
            "na": 0,
            "assercoes": 0
          }
        },
        {
          "key": "ROTEIRO-00/5.3",
          "id": "5.3",
          "escopoId": "5.3",
          "kind": "secao",
          "nivel": 3,
          "titulo": "Promover a ADMIN por SQL",
          "anchor": "promover-a-admin-por-sql",
          "ordem": 7,
          "meta": [],
          "metaIndex": {},
          "notas": [
            "<strong>A linha <code>CLIENTE</code> permanece de propósito</strong> — roles são cumulativas e o backfill da V42 já tinha criado a linha <code>CLIENTE</code>. O <code>admin@sep.test</code> fica ADMIN <strong>e</strong> CLIENTE. Isso ajuda em algumas jornadas e <strong>atrapalha as negativas de RBAC</strong>: para testar &quot;ADMIN não ve tela de tomador&quot;, use um ADMIN sem <code>CLIENTE</code>, ou remova a linha: ``<code>sql DELETE FROM usuario_role ur USING usuario u WHERE ur.usuario_id = u.id AND u.username = 'admin@sep.test' AND ur.role = 'CLIENTE'; </code>``"
          ],
          "grupos": [
            {
              "id": "g1",
              "tituloHtml": null,
              "tela": null,
              "implicito": true,
              "passos": [
                {
                  "key": "ROTEIRO-00/5.3/B2",
                  "id": "B2",
                  "hash": "352443b6",
                  "textoHtml": "Promover:",
                  "comoHtml": "Rodar no terminal do banco (o do <strong>A1</strong>). Copiar o bloco inteiro de uma vez, incluindo a linha final <code>SQL</code> — é ela que fecha o comando. São dois comandos SQL: o primeiro muda a role principal, o segundo acrescenta a linha na tabela de roles cumulativas. Os dois são necessários; rodar só um deixa o usuário meio promovido, que é pior do que não promover.",
                  "textoBusca": "promover: rodar no terminal do banco (o do a1). copiar o bloco inteiro de uma vez, incluindo a linha final sql — é ela que fecha o comando. são dois comandos sql: o primeiro muda a role principal, o segundo acrescenta a linha na tabela de roles cumulativas. os dois são necessários; rodar só um deixa o usuário meio promovido, que é pior do que não promover.",
                  "esperadoHtml": "<code>UPDATE 1</code> e <code>INSERT 0 1</code>.",
                  "blocos": [
                    {
                      "tipo": "codigo",
                      "lang": "bash",
                      "regiao": "como",
                      "conteudo": "docker exec sep-postgres psql -U sep -d sep_dev <<'SQL'\nUPDATE usuario SET role = 'ADMIN' WHERE username = 'admin@sep.test';\nINSERT INTO usuario_role (usuario_id, role)\nSELECT id, 'ADMIN' FROM usuario WHERE username = 'admin@sep.test'\nON CONFLICT DO NOTHING;\nSQL"
                    }
                  ],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 251,
                  "ordem": 1
                },
                {
                  "key": "ROTEIRO-00/5.3/B3",
                  "id": "B3",
                  "hash": "a7afdeeb",
                  "textoHtml": "Conferir o resultado:",
                  "comoHtml": "Mesmo terminal. <code>UPDATE 0</code> no passo anterior significa que o usuário do <strong>B1</strong> não foi criado — nesse caso, voltar ao B1 antes de seguir. A saída deste comando vem em formato de tabela; ler a linha e comparar com o esperado.",
                  "textoBusca": "conferir o resultado: mesmo terminal. update 0 no passo anterior significa que o usuário do b1 não foi criado — nesse caso, voltar ao b1 antes de seguir. a saída deste comando vem em formato de tabela; ler a linha e comparar com o esperado.",
                  "esperadoHtml": "<code>principal = ADMIN</code> e <code>roles = {ADMIN,CLIENTE}</code>.",
                  "blocos": [
                    {
                      "tipo": "codigo",
                      "lang": "bash",
                      "regiao": "como",
                      "conteudo": "docker exec sep-postgres psql -U sep -d sep_dev \\\n  -c \"SELECT u.username, u.role AS principal, array_agg(ur.role) AS roles\n      FROM usuario u JOIN usuario_role ur ON ur.usuario_id = u.id\n      WHERE u.username = 'admin@sep.test' GROUP BY u.username, u.role;\""
                    }
                  ],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 266,
                  "ordem": 2
                },
                {
                  "key": "ROTEIRO-00/5.3/B4",
                  "id": "B4",
                  "hash": "0c96c7f9",
                  "textoHtml": "Insomnia &gt; <strong>Auth</strong> &gt; <code>POST /auth/login (admin)</code>, com o body:",
                  "comoHtml": "Pasta <strong>Auth</strong>, request <code>POST /auth/login (admin)</code>, aba <strong>Body</strong>, o JSON abaixo, <strong>Send</strong>. Na resposta, copiar o valor de <code>accessToken</code> — é uma cadeia longa de letras e números — e colar na variável <code>adminAccessToken</code> do environment. Copiar <strong>sem</strong> as aspas e sem a palavra <code>Bearer</code>. Esse token é o que autoriza os próximos requests de administrador; sem ele, o <strong>B6</strong> e o <strong>B7</strong> respondem 401.",
                  "textoBusca": "insomnia > auth > post /auth/login (admin), com o body: pasta auth, request post /auth/login (admin), aba body, o json abaixo, send. na resposta, copiar o valor de accesstoken — é uma cadeia longa de letras e números — e colar na variável adminaccesstoken do environment. copiar sem as aspas e sem a palavra bearer. esse token é o que autoriza os próximos requests de administrador; sem ele, o b6 e o b7 respondem 401.",
                  "esperadoHtml": "<code>accessToken</code> no corpo e <code>mfaRequired: false</code> (o ADMIN ainda não tem TOTP). Guardar o token em <code>adminAccessToken</code>.",
                  "blocos": [
                    {
                      "tipo": "codigo",
                      "lang": "json",
                      "regiao": "como",
                      "conteudo": "{ \"username\": \"admin@sep.test\", \"password\": \"roteiro-manual-sep-2026\" }"
                    }
                  ],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 287,
                  "ordem": 3
                }
              ]
            }
          ],
          "assercoes": [],
          "linha": 245,
          "stats": {
            "passos": 3,
            "na": 0,
            "assercoes": 0
          }
        },
        {
          "key": "ROTEIRO-00/5.4",
          "id": "5.4",
          "escopoId": "5.4",
          "kind": "secao",
          "nivel": 3,
          "titulo": "Criar os demais usuários internos",
          "anchor": "criar-os-demais-usurios-internos",
          "ordem": 8,
          "meta": [],
          "metaIndex": {},
          "notas": [
            "<strong>Ordem importa: promova antes de habilitar TOTP no <code>admin</code>.</strong> A promoção usa o <code>@RequireStepUp</code> legado, que <strong>faz bypass quando o usuário ainda não tem MFA</strong>. Com o <code>admin</code> sem TOTP, a promoção passa sem token. Se você habilitar TOTP no <code>admin</code> primeiro, cada promoção passa a exigir o par <code>step-up/initiate</code> + <code>step-up/complete</code> e o header <code>X-Step-Up-Token</code>.",
            "<strong>B9 a B12 não são burocracia.</strong> Se qualquer um deles passar, há escalada de privilégio: o impasse de bootstrap descrito em §5.1 e uma decisão de segurança deliberada, não um descuido."
          ],
          "grupos": [
            {
              "id": "g1",
              "tituloHtml": null,
              "tela": null,
              "implicito": true,
              "passos": [
                {
                  "key": "ROTEIRO-00/5.4/B5",
                  "id": "B5",
                  "hash": "e79f364d",
                  "textoHtml": "Insomnia &gt; <strong>Usuários</strong> &gt; <code>POST /usuarios (criar cliente público) — 201</code>, duas vezes, com os bodies:",
                  "comoHtml": "É o mesmo request do <strong>B1</strong>, enviado duas vezes trocando o body. Anotar o <code>id</code> da resposta do <strong>financeiro</strong> na variável <code>financeiroId</code>; o do backoffice você vai colar direto na URL do <strong>B7</strong>, então deixe à mão. Os dois nascem <code>CLIENTE</code> — a promoção é o passo seguinte.",
                  "textoBusca": "insomnia > usuários > post /usuarios (criar cliente público) — 201, duas vezes, com os bodies: é o mesmo request do b1, enviado duas vezes trocando o body. anotar o id da resposta do financeiro na variável financeiroid; o do backoffice você vai colar direto na url do b7, então deixe à mão. os dois nascem cliente — a promoção é o passo seguinte.",
                  "esperadoHtml": "dois <code>201</code>, ambos <code>CLIENTE</code>. Guardar o <code>id</code> do financeiro em <code>financeiroId</code>.",
                  "blocos": [
                    {
                      "tipo": "codigo",
                      "lang": "json",
                      "regiao": "como",
                      "conteudo": "{ \"username\": \"financeiro@sep.test\", \"password\": \"roteiro-manual-sep-2026\" }"
                    },
                    {
                      "tipo": "codigo",
                      "lang": "json",
                      "regiao": "como",
                      "conteudo": "{ \"username\": \"backoffice@sep.test\", \"password\": \"roteiro-manual-sep-2026\" }"
                    }
                  ],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 312,
                  "ordem": 1
                },
                {
                  "key": "ROTEIRO-00/5.4/B6",
                  "id": "B6",
                  "hash": "30a0bf6c",
                  "textoHtml": "Insomnia &gt; <strong>Usuários</strong> &gt; <code>POST /usuarios/{id}/role (ADMIN + step-up promove FINANCEIRO)</code>, apontando para o <code>id</code> do financeiro, com o body:",
                  "comoHtml": "Na URL do request, trocar o <code>{id}</code> pelo <code>financeiroId</code> do <strong>B5</strong> (ou usar a variável, se a collection já referenciar). Conferir na aba <strong>Headers</strong> que o <code>Authorization</code> está usando o <code>adminAccessToken</code> do <strong>B4</strong>. Este passo funciona <strong>sem</strong> token de step-up só porque o <code>admin</code> ainda não tem TOTP — é o motivo do aviso logo acima sobre a ordem. Se responder 403 pedindo step-up, é sinal de que alguém habilitou TOTP no <code>admin</code> antes da hora.",
                  "textoBusca": "insomnia > usuários > post /usuarios/{id}/role (admin + step-up promove financeiro), apontando para o id do financeiro, com o body: na url do request, trocar o {id} pelo financeiroid do b5 (ou usar a variável, se a collection já referenciar). conferir na aba headers que o authorization está usando o adminaccesstoken do b4. este passo funciona sem token de step-up só porque o admin ainda não tem totp — é o motivo do aviso logo acima sobre a ordem. se responder 403 pedindo step-up, é sinal de que alguém habilitou totp no admin antes da hora.",
                  "esperadoHtml": "<code>200</code> com <code>role: \"FINANCEIRO\"</code>.",
                  "blocos": [
                    {
                      "tipo": "codigo",
                      "lang": "json",
                      "regiao": "como",
                      "conteudo": "{ \"role\": \"FINANCEIRO\" }"
                    }
                  ],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 325,
                  "ordem": 2
                },
                {
                  "key": "ROTEIRO-00/5.4/B7",
                  "id": "B7",
                  "hash": "52b74c99",
                  "textoHtml": "Repetir <strong>B6</strong> para o <code>id</code> do backoffice, com o body:",
                  "comoHtml": "Mesmo request, trocando o <code>{id}</code> na URL pelo do backoffice e o valor do body.",
                  "textoBusca": "repetir b6 para o id do backoffice, com o body: mesmo request, trocando o {id} na url pelo do backoffice e o valor do body.",
                  "esperadoHtml": "<code>200</code> com <code>role: \"BACKOFFICE\"</code>.",
                  "blocos": [
                    {
                      "tipo": "codigo",
                      "lang": "json",
                      "regiao": "como",
                      "conteudo": "{ \"role\": \"BACKOFFICE\" }"
                    }
                  ],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 338,
                  "ordem": 3
                },
                {
                  "key": "ROTEIRO-00/5.4/B8",
                  "id": "B8",
                  "hash": "5cf137c3",
                  "textoHtml": "Conferir o audit log das duas promoções:",
                  "comoHtml": "Terminal do banco. Este comando lê a trilha de auditoria de segurança. Cada promoção precisa ter deixado uma linha <code>ROLE_ALTERADO</code> — é exigência regulatória, não capricho. Se as promoções deram <code>200</code> mas aqui não aparecem duas linhas, <strong>isso é um defeito</strong>: registre uma ocorrência.",
                  "textoBusca": "conferir o audit log das duas promoções: terminal do banco. este comando lê a trilha de auditoria de segurança. cada promoção precisa ter deixado uma linha rolealterado — é exigência regulatória, não capricho. se as promoções deram 200 mas aqui não aparecem duas linhas, isso é um defeito: registre uma ocorrência.",
                  "esperadoHtml": "duas linhas <code>ROLE_ALTERADO</code>. Promoção sem trilha é defeito.",
                  "blocos": [
                    {
                      "tipo": "codigo",
                      "lang": "bash",
                      "regiao": "como",
                      "conteudo": "docker exec sep-postgres psql -U sep -d sep_dev \\\n  -c \"SELECT tipo, data_evento FROM audit_log_seguranca WHERE tipo = 'ROLE_ALTERADO' ORDER BY data_evento DESC LIMIT 5;\""
                    }
                  ],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 344,
                  "ordem": 4
                },
                {
                  "key": "ROTEIRO-00/5.4/B9",
                  "id": "B9",
                  "hash": "9d2fe4fa",
                  "textoHtml": "Insomnia &gt; <strong>Usuários</strong> &gt; <code>POST /admin/usuarios (criar admin interno) — 201</code>, trocando o body para uma role operacional:",
                  "comoHtml": "<strong>Atenção: aqui o erro é o resultado certo.</strong> Estes quatro passos tentam burlar o sistema de propósito; se algum deles der certo, o defeito é grave. Enviar o request com o body abaixo (note o campo <code>role</code>, que o body normal não tem) e conferir que a resposta é <strong>400</strong>, não 201. Procurar <code>USR-400-002</code> no corpo da resposta.",
                  "textoBusca": "insomnia > usuários > post /admin/usuarios (criar admin interno) — 201, trocando o body para uma role operacional: atenção: aqui o erro é o resultado certo. estes quatro passos tentam burlar o sistema de propósito; se algum deles der certo, o defeito é grave. enviar o request com o body abaixo (note o campo role, que o body normal não tem) e conferir que a resposta é 400, não 201. procurar usr-400-002 no corpo da resposta.",
                  "esperadoHtml": "<strong>400</strong> com código <code>USR-400-002</code>. O atalho para role operacional é fechado.",
                  "blocos": [
                    {
                      "tipo": "codigo",
                      "lang": "json",
                      "regiao": "como",
                      "conteudo": "{ \"username\": \"atalho@sep.test\", \"password\": \"roteiro-manual-sep-2026\", \"role\": \"FINANCEIRO\" }"
                    }
                  ],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 357,
                  "ordem": 5
                },
                {
                  "key": "ROTEIRO-00/5.4/B10",
                  "id": "B10",
                  "hash": "6f96b63a",
                  "textoHtml": "Repetir <strong>B9</strong> sem o header <code>Authorization</code>.",
                  "comoHtml": "No mesmo request do B9, aba <strong>Headers</strong>, desmarcar (ou apagar) a linha <code>Authorization</code> e enviar de novo. Depois <strong>restaurar o header</strong> — os passos seguintes precisam dele. A diferença entre 401 e 403 importa: 401 é &quot;não sei quem você é&quot;, 403 é &quot;sei quem você é e você não pode&quot;.",
                  "textoBusca": "repetir b9 sem o header authorization. no mesmo request do b9, aba headers, desmarcar (ou apagar) a linha authorization e enviar de novo. depois restaurar o header — os passos seguintes precisam dele. a diferença entre 401 e 403 importa: 401 é \"não sei quem você é\", 403 é \"sei quem você é e você não pode\".",
                  "esperadoHtml": "<strong>401</strong>. Criação de interno não é pública.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 367,
                  "ordem": 6
                },
                {
                  "key": "ROTEIRO-00/5.4/B11",
                  "id": "B11",
                  "hash": "153ae09c",
                  "textoHtml": "Insomnia &gt; <strong>Usuários</strong> &gt; <code>POST /admin/usuarios (cliente tenta criar admin) — 403</code>, com <code>clienteAccessToken</code> preenchido (persona criada na §6).",
                  "comoHtml": "Este passo depende do <code>clienteAccessToken</code>, que só existe depois da §6.1 — se você ainda não criou as personas, <strong>pule agora e volte aqui</strong> depois do <strong>C1</strong>. Para obter o token: fazer login como <code>cliente-a</code> pelo request de login e copiar o <code>accessToken</code>, como no <strong>B4</strong>.",
                  "textoBusca": "insomnia > usuários > post /admin/usuarios (cliente tenta criar admin) — 403, com clienteaccesstoken preenchido (persona criada na §6). este passo depende do clienteaccesstoken, que só existe depois da §6.1 — se você ainda não criou as personas, pule agora e volte aqui depois do c1. para obter o token: fazer login como cliente-a pelo request de login e copiar o accesstoken, como no b4.",
                  "esperadoHtml": "<strong>403</strong>. Só ADMIN cria interno.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 373,
                  "ordem": 7
                },
                {
                  "key": "ROTEIRO-00/5.4/B12",
                  "id": "B12",
                  "hash": "0ee6dd0c",
                  "textoHtml": "Como <code>admin</code>, tentar alterar a <strong>própria</strong> role para <code>CLIENTE</code>.",
                  "comoHtml": "Usar o request de promoção do <strong>B6</strong>, mas colocando na URL o <code>adminId</code> (o id do próprio admin, guardado no <strong>B1</strong>) e <code>{ \"role\": \"CLIENTE\" }</code> no body. A recusa é proposital: se um ADMIN pudesse se rebaixar, poderia também se promover, e todo o impasse de bootstrap da §5.1 perderia sentido.",
                  "textoBusca": "como admin, tentar alterar a própria role para cliente. usar o request de promoção do b6, mas colocando na url o adminid (o id do próprio admin, guardado no b1) e { \"role\": \"cliente\" } no body. a recusa é proposital: se um admin pudesse se rebaixar, poderia também se promover, e todo o impasse de bootstrap da §5.1 perderia sentido.",
                  "esperadoHtml": "recusado. ADMIN não altera a própria role — é por isso que o primeiro ADMIN precisa nascer por SQL.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 381,
                  "ordem": 8
                }
              ]
            }
          ],
          "assercoes": [],
          "linha": 299,
          "stats": {
            "passos": 8,
            "na": 0,
            "assercoes": 0
          }
        },
        {
          "key": "ROTEIRO-00/6.1",
          "id": "6.1",
          "escopoId": "6.1",
          "kind": "secao",
          "nivel": 3,
          "titulo": "Personas",
          "anchor": "personas",
          "ordem": 9,
          "meta": [],
          "metaIndex": {},
          "notas": [
            "A persona <code>credora</code> só vira credora de fato depois do KYB aprovado e do cadastro em <code>/app/credora/cadastro</code> — <strong>isso é jornada</strong>, coberta no roteiro de credora, não aqui. Até lá ela é um <code>CLIENTE</code> comum e o <code>credoraPresenceGuard</code> a bloqueia."
          ],
          "grupos": [
            {
              "id": "g1",
              "tituloHtml": null,
              "tela": null,
              "implicito": true,
              "passos": [
                {
                  "key": "ROTEIRO-00/6.1/C1",
                  "id": "C1",
                  "hash": "a3238473",
                  "textoHtml": "Insomnia &gt; <strong>Usuários</strong> &gt; <code>POST /usuarios (criar cliente público) — 201</code>, três vezes, com os bodies:",
                  "comoHtml": "Mesmo request do <strong>B1</strong> e do <strong>B5</strong>, agora três vezes. <strong>As senhas são diferentes entre si</strong> — copie cada uma exatamente da tabela acima, porque errar aqui só aparece muitas jornadas depois, na forma de um login que não entra. Guardar o <code>id</code> do <code>cliente-a</code> em <code>clienteId</code>. Estas três personas são as que aparecem na maioria das jornadas: <code>cliente-a</code> é o tomador principal, <code>cliente-b</code> serve para provar que ninguém enxerga dado alheio, e <code>credora</code> é usada no roteiro de credora.",
                  "textoBusca": "insomnia > usuários > post /usuarios (criar cliente público) — 201, três vezes, com os bodies: mesmo request do b1 e do b5, agora três vezes. as senhas são diferentes entre si — copie cada uma exatamente da tabela acima, porque errar aqui só aparece muitas jornadas depois, na forma de um login que não entra. guardar o id do cliente-a em clienteid. estas três personas são as que aparecem na maioria das jornadas: cliente-a é o tomador principal, cliente-b serve para provar que ninguém enxerga dado alheio, e credora é usada no roteiro de credora.",
                  "esperadoHtml": "três <code>201</code>, todos <code>CLIENTE</code>. Guardar o <code>id</code> do <code>cliente-a</code> em <code>clienteId</code>. Nenhum deles recebe role interna.",
                  "blocos": [
                    {
                      "tipo": "codigo",
                      "lang": "json",
                      "regiao": "como",
                      "conteudo": "{ \"username\": \"cliente-a@sep.test\", \"password\": \"jornada-tomador-sep-2026\" }"
                    },
                    {
                      "tipo": "codigo",
                      "lang": "json",
                      "regiao": "como",
                      "conteudo": "{ \"username\": \"cliente-b@sep.test\", \"password\": \"jornada-ownership-sep-2026\" }"
                    },
                    {
                      "tipo": "codigo",
                      "lang": "json",
                      "regiao": "como",
                      "conteudo": "{ \"username\": \"credora@sep.test\", \"password\": \"jornada-credora-sep-2026\" }"
                    }
                  ],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 406,
                  "ordem": 1
                },
                {
                  "key": "ROTEIRO-00/6.1/C2",
                  "id": "C2",
                  "hash": "2863418a",
                  "textoHtml": "Conferir que nenhum usuário nasceu com <code>precisa_redefinir_senha = true</code>:",
                  "comoHtml": "Terminal do banco. Este comando lista todos os usuários criados até aqui — devem ser seis. É um bom momento para conferir a lista inteira: se faltar alguém, algum passo anterior falhou sem você notar. Nas colunas <code>mfa_habilitado</code> e <code>precisa_redefinir_senha</code>, <code>f</code> quer dizer falso.",
                  "textoBusca": "conferir que nenhum usuário nasceu com precisaredefinirsenha = true: terminal do banco. este comando lista todos os usuários criados até aqui — devem ser seis. é um bom momento para conferir a lista inteira: se faltar alguém, algum passo anterior falhou sem você notar. nas colunas mfahabilitado e precisaredefinirsenha, f quer dizer falso.",
                  "esperadoHtml": "<code>precisa_redefinir_senha = f</code> e <code>mfa_habilitado = f</code> para todos. O <code>UPDATE</code> da migration V6 só atingiu usuários que existiam na época; em banco novo não há nenhum.",
                  "blocos": [
                    {
                      "tipo": "codigo",
                      "lang": "bash",
                      "regiao": "como",
                      "conteudo": "docker exec sep-postgres psql -U sep -d sep_dev \\\n  -c \"SELECT username, role, mfa_habilitado, precisa_redefinir_senha FROM usuario ORDER BY data_criacao;\""
                    }
                  ],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 425,
                  "ordem": 2
                }
              ]
            }
          ],
          "assercoes": [],
          "linha": 395,
          "stats": {
            "passos": 2,
            "na": 0,
            "assercoes": 0
          }
        },
        {
          "key": "ROTEIRO-00/6.2",
          "id": "6.2",
          "escopoId": "6.2",
          "kind": "secao",
          "nivel": 3,
          "titulo": "Habilitar TOTP",
          "anchor": "habilitar-totp",
          "ordem": 10,
          "meta": [],
          "metaIndex": {},
          "notas": [
            "<strong>Deixe <code>cliente-b</code> sem TOTP de propósito.</strong> Ele é a persona das negativas de step-up estrito: sem MFA, a operação tem de ser negada com 403."
          ],
          "grupos": [
            {
              "id": "g1",
              "tituloHtml": null,
              "tela": null,
              "implicito": true,
              "passos": [
                {
                  "key": "ROTEIRO-00/6.2/C3",
                  "id": "C3",
                  "hash": "fd2a2567",
                  "textoHtml": "No web, autenticar como <code>cliente-a</code> e abrir <strong>Meu perfil</strong>.",
                  "comoHtml": "Na aba do <code>localhost:4200</code>, entrar com <code>cliente-a@sep.test</code> / <code>jornada-tomador-sep-2026</code>. Como este usuário ainda não tem TOTP, o login entra direto no painel, sem pedir código. <strong>Meu perfil</strong> fica no menu do usuário.",
                  "textoBusca": "no web, autenticar como cliente-a e abrir meu perfil. na aba do localhost:4200, entrar com cliente-a@sep.test / jornada-tomador-sep-2026. como este usuário ainda não tem totp, o login entra direto no painel, sem pedir código. meu perfil fica no menu do usuário.",
                  "esperadoHtml": null,
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 451,
                  "ordem": 1
                },
                {
                  "key": "ROTEIRO-00/6.2/C4",
                  "id": "C4",
                  "hash": "b947002d",
                  "textoHtml": "Abrir a configuração de TOTP em <code>/app/profile/setup-totp</code>.",
                  "comoHtml": "<strong>Não há link para esta tela no menu nem no perfil</strong> — digitar o endereço <code>http://localhost:4200/app/profile/setup-totp</code> direto na barra; funciona porque você já está logado. A tela abre com o título <strong>Habilitar autenticação em duas etapas (TOTP)</strong> e um botão <strong>Iniciar setup</strong>: o QR só aparece depois de clicar nele.",
                  "textoBusca": "abrir a configuração de totp em /app/profile/setup-totp. não há link para esta tela no menu nem no perfil — digitar o endereço http://localhost:4200/app/profile/setup-totp direto na barra; funciona porque você já está logado. a tela abre com o título habilitar autenticação em duas etapas (totp) e um botão iniciar setup: o qr só aparece depois de clicar nele.",
                  "esperadoHtml": "QR code e secret em texto são exibidos.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 455,
                  "ordem": 2
                },
                {
                  "key": "ROTEIRO-00/6.2/C5",
                  "id": "C5",
                  "hash": "a693cae6",
                  "textoHtml": "Escanear o QR no autenticador e confirmar com o código corrente.",
                  "comoHtml": "A tela está numerada em três passos. No <strong>1. Escaneie o QR code</strong>, ler o QR pelo autenticador (na extensão de navegador costuma haver a opção de colar o secret em texto em vez de escanear). Depois, no <strong>3. Confirme com o primeiro código gerado</strong>, digitar no campo <strong>Código TOTP</strong> o número de 6 dígitos que o autenticador mostra — ele <strong>muda a cada 30 segundos</strong> — e clicar em <strong>Confirmar e ativar MFA</strong>. Se der erro, o código provavelmente virou no meio do caminho: esperar o próximo e repetir.",
                  "textoBusca": "escanear o qr no autenticador e confirmar com o código corrente. a tela está numerada em três passos. no 1. escaneie o qr code, ler o qr pelo autenticador (na extensão de navegador costuma haver a opção de colar o secret em texto em vez de escanear). depois, no 3. confirme com o primeiro código gerado, digitar no campo código totp o número de 6 dígitos que o autenticador mostra — ele muda a cada 30 segundos — e clicar em confirmar e ativar mfa. se der erro, o código provavelmente virou no meio do caminho: esperar o próximo e repetir.",
                  "esperadoHtml": "MFA habilitado; <strong>os backup codes aparecem uma única vez</strong> — copiar agora.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 461,
                  "ordem": 3
                },
                {
                  "key": "ROTEIRO-00/6.2/C6",
                  "id": "C6",
                  "hash": "265a170b",
                  "textoHtml": "Guardar os backup codes junto das credenciais desta execução.",
                  "comoHtml": "<strong>Não feche a tela antes de copiar.</strong> Os códigos aparecem no bloco <strong>2. Guarde seus backup codes</strong>, como uma lista simples — <strong>não há botão de copiar</strong>: selecionar com o mouse e copiar à mão. A própria tela avisa que eles não serão exibidos de novo, e é verdade: perdê-los significa refazer o enrollment. Colar num arquivo de rascunho da execução, junto das senhas em uso. Pelo menos um precisa sobrar sem uso para a jornada <code>J-031.W</code>, que testa justamente o consumo de um backup code.",
                  "textoBusca": "guardar os backup codes junto das credenciais desta execução. não feche a tela antes de copiar. os códigos aparecem no bloco 2. guarde seus backup codes, como uma lista simples — não há botão de copiar: selecionar com o mouse e copiar à mão. a própria tela avisa que eles não serão exibidos de novo, e é verdade: perdê-los significa refazer o enrollment. colar num arquivo de rascunho da execução, junto das senhas em uso. pelo menos um precisa sobrar sem uso para a jornada j-031.w, que testa justamente o consumo de um backup code.",
                  "esperadoHtml": "pelo menos um backup code reservado para a jornada de backup code.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 469,
                  "ordem": 4
                },
                {
                  "key": "ROTEIRO-00/6.2/C7",
                  "id": "C7",
                  "hash": "ee2ce43b",
                  "textoHtml": "Repetir <strong>C3-C6</strong> para <code>financeiro</code> (opera Pix e chaves Pix, ambos com step-up estrito).",
                  "comoHtml": "Sair da sessão do <code>cliente-a</code> e entrar como <code>financeiro@sep.test</code> / <code>roteiro-manual-sep-2026</code>. Repetir C3 a C6. No autenticador, a segunda conta aparece como uma entrada separada — confira que está lendo o código <strong>da conta certa</strong> na hora de usar; é o erro mais comum daqui em diante.",
                  "textoBusca": "repetir c3-c6 para financeiro (opera pix e chaves pix, ambos com step-up estrito). sair da sessão do cliente-a e entrar como financeiro@sep.test / roteiro-manual-sep-2026. repetir c3 a c6. no autenticador, a segunda conta aparece como uma entrada separada — confira que está lendo o código da conta certa na hora de usar; é o erro mais comum daqui em diante.",
                  "esperadoHtml": "<code>financeiro</code> com MFA habilitado.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 477,
                  "ordem": 5
                },
                {
                  "key": "ROTEIRO-00/6.2/C8",
                  "id": "C8",
                  "hash": "d29da957",
                  "textoHtml": "Conferir no banco:",
                  "comoHtml": "Terminal do banco. Esta consulta lista só quem tem MFA ligado — devem ser exatamente duas linhas. Se <code>cliente-b</code> aparecer aqui, o enrollment foi feito na conta errada e as jornadas negativas de step-up vão falhar sem motivo aparente.",
                  "textoBusca": "conferir no banco: terminal do banco. esta consulta lista só quem tem mfa ligado — devem ser exatamente duas linhas. se cliente-b aparecer aqui, o enrollment foi feito na conta errada e as jornadas negativas de step-up vão falhar sem motivo aparente.",
                  "esperadoHtml": "<code>cliente-a</code> e <code>financeiro</code> na lista.",
                  "blocos": [
                    {
                      "tipo": "codigo",
                      "lang": "bash",
                      "regiao": "como",
                      "conteudo": "docker exec sep-postgres psql -U sep -d sep_dev \\\n  -c \"SELECT username, mfa_habilitado FROM usuario WHERE mfa_habilitado = true;\""
                    }
                  ],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 484,
                  "ordem": 6
                }
              ]
            }
          ],
          "assercoes": [],
          "linha": 441,
          "stats": {
            "passos": 6,
            "na": 0,
            "assercoes": 0
          }
        },
        {
          "key": "ROTEIRO-00/7",
          "id": "7",
          "escopoId": "7",
          "kind": "secao",
          "nivel": 2,
          "titulo": "Reset entre execuções",
          "anchor": "reset-entre-execues",
          "ordem": 11,
          "meta": [],
          "metaIndex": {},
          "notas": [
            "Os valores-sentinela de <code>99999999999</code> (força <code>409</code>) e os UUIDs de ownership existem no <strong>MSW</strong>, não no backend real. Contra <code>:8080</code>, os cenários negativos se constroem com dados reais — por exemplo, ownership se testa com o ID real do <code>cliente-a</code> autenticado como <code>cliente-b</code>."
          ],
          "grupos": [
            {
              "id": "g1",
              "tituloHtml": null,
              "tela": null,
              "implicito": true,
              "passos": [
                {
                  "key": "ROTEIRO-00/7/D1",
                  "id": "D1",
                  "hash": "a95a72d2",
                  "textoHtml": "Reset total (apaga o volume; ambiente do zero):",
                  "comoHtml": "<strong>Este passo apaga tudo e não tem desfazer.</strong> O <code>-v</code> remove o volume do banco, ou seja, todos os usuários e dados que você criou. Só rode quando quiser recomeçar do zero, e faça o <strong>D3</strong> antes para não perder o registro da rodada anterior. Depois de rodar, reiniciar a API (o terminal do <strong>A3</strong>) para o Flyway recriar as tabelas.",
                  "textoBusca": "reset total (apaga o volume; ambiente do zero): este passo apaga tudo e não tem desfazer. o -v remove o volume do banco, ou seja, todos os usuários e dados que você criou. só rode quando quiser recomeçar do zero, e faça o d3 antes para não perder o registro da rodada anterior. depois de rodar, reiniciar a api (o terminal do a3) para o flyway recriar as tabelas.",
                  "esperadoHtml": "banco vazio. Toda a §5 e a §6 precisam ser refeitas.",
                  "blocos": [
                    {
                      "tipo": "codigo",
                      "lang": "bash",
                      "regiao": "como",
                      "conteudo": "cd sep-api && docker compose down -v && docker compose up -d postgres"
                    }
                  ],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 524,
                  "ordem": 1
                },
                {
                  "key": "ROTEIRO-00/7/D2",
                  "id": "D2",
                  "hash": "686abcf5",
                  "textoHtml": "Destravar uma conta bloqueada sem reset total: remover as tentativas registradas para o usuário e reiniciar a API.",
                  "comoHtml": "Use isto quando errar a senha cinco vezes e a persona ficar bloqueada por 30 minutos (§6.4) — é bem mais rápido que o reset total, e não destrói a massa de dados. Apagar as tentativas do usuário no banco e reiniciar a API no terminal do <strong>A3</strong> (<code>Ctrl+C</code> e <code>./gradlew bootRun</code> de novo). A alternativa é simplesmente esperar os 30 minutos passarem.",
                  "textoBusca": "destravar uma conta bloqueada sem reset total: remover as tentativas registradas para o usuário e reiniciar a api. use isto quando errar a senha cinco vezes e a persona ficar bloqueada por 30 minutos (§6.4) — é bem mais rápido que o reset total, e não destrói a massa de dados. apagar as tentativas do usuário no banco e reiniciar a api no terminal do a3 (ctrl+c e ./gradlew bootrun de novo). a alternativa é simplesmente esperar os 30 minutos passarem.",
                  "esperadoHtml": "login volta a ser aceito com a senha correta.",
                  "blocos": [
                    {
                      "tipo": "codigo",
                      "lang": "bash",
                      "regiao": "como",
                      "conteudo": "docker exec sep-postgres psql -U sep -d sep_dev \\\n  -c \"DELETE FROM login_attempt WHERE username = 'cliente-b@sep.test';\""
                    }
                  ],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 533,
                  "ordem": 2
                },
                {
                  "key": "ROTEIRO-00/7/D3",
                  "id": "D3",
                  "hash": "852562f8",
                  "textoHtml": "Antes de uma execução limpa, abrir o <a href=\"./app/index.html\" rel=\"noreferrer\">app</a>, <strong>exportar</strong> o JSON da rodada anterior para <code>execucoes/AAAA-MM-DD-&lt;tag&gt;/execucao.json</code> e criar uma <strong>rodada nova</strong> pelo botão <code>+</code> do topo.",
                  "comoHtml": "No app, clicar em <strong>Exportar</strong> — o arquivo cai na pasta de downloads. Criar a pasta <code>execucoes/AAAA-MM-DD-&lt;tag&gt;/</code> (por exemplo <code>execucoes/2026-07-21-regressao/</code>) e mover o arquivo para lá. Só então clicar no <code>+</code> no topo para abrir uma rodada nova. A ordem importa: as marcações vivem no navegador, e exportar é o que as transforma em registro permanente.",
                  "textoBusca": "antes de uma execução limpa, abrir o app, exportar o json da rodada anterior para execucoes/aaaa-mm-dd-<tag>/execucao.json e criar uma rodada nova pelo botão + do topo. no app, clicar em exportar — o arquivo cai na pasta de downloads. criar a pasta execucoes/aaaa-mm-dd-<tag>/ (por exemplo execucoes/2026-07-21-regressao/) e mover o arquivo para lá. só então clicar no + no topo para abrir uma rodada nova. a ordem importa: as marcações vivem no navegador, e exportar é o que as transforma em registro permanente.",
                  "esperadoHtml": "a rodada nova começa com o progresso zerado; a anterior continua acessível no seletor de rodadas e no JSON exportado.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 545,
                  "ordem": 3
                }
              ]
            }
          ],
          "assercoes": [],
          "linha": 522,
          "stats": {
            "passos": 3,
            "na": 0,
            "assercoes": 0
          }
        },
        {
          "key": "ROTEIRO-00/9",
          "id": "9",
          "escopoId": "9",
          "kind": "secao",
          "nivel": 2,
          "titulo": "Verificação final do ambiente",
          "anchor": "verificao-final-do-ambiente",
          "ordem": 12,
          "meta": [],
          "metaIndex": {},
          "notas": [],
          "grupos": [
            {
              "id": "g1",
              "tituloHtml": null,
              "tela": null,
              "implicito": true,
              "passos": [
                {
                  "key": "ROTEIRO-00/9/E1",
                  "id": "E1",
                  "hash": "c183581a",
                  "textoHtml": "<code>PRE-01</code> a <code>PRE-10</code> marcados",
                  "comoHtml": "Conferir na tabela do §8 que cada <code>PRE</code> de 01 a 10 aponta para um passo que você já executou. <code>PRE-11</code> a <code>PRE-13</code> <strong>não</strong> entram aqui: eles são produzidos por jornadas de outros roteiros, não por este preparo.",
                  "textoBusca": "pre-01 a pre-10 marcados conferir na tabela do §8 que cada pre de 01 a 10 aponta para um passo que você já executou. pre-11 a pre-13 não entram aqui: eles são produzidos por jornadas de outros roteiros, não por este preparo.",
                  "esperadoHtml": null,
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 583,
                  "ordem": 1
                },
                {
                  "key": "ROTEIRO-00/9/E2",
                  "id": "E2",
                  "hash": "132ba191",
                  "textoHtml": "Login funciona no web para <code>admin</code>, <code>financeiro</code>, <code>backoffice</code> e <code>cliente-a</code>",
                  "comoHtml": "Em <code>localhost:4200</code>, entrar e sair com as quatro personas, uma de cada vez, usando as senhas da tabela do §6.1. <code>cliente-a</code> e <code>financeiro</code> vão pedir o código TOTP (foram habilitados no §6.2); <code>admin</code> e <code>backoffice</code> entram direto. Testar agora evita descobrir uma senha errada no meio de uma jornada longa.",
                  "textoBusca": "login funciona no web para admin, financeiro, backoffice e cliente-a em localhost:4200, entrar e sair com as quatro personas, uma de cada vez, usando as senhas da tabela do §6.1. cliente-a e financeiro vão pedir o código totp (foram habilitados no §6.2); admin e backoffice entram direto. testar agora evita descobrir uma senha errada no meio de uma jornada longa.",
                  "esperadoHtml": null,
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 587,
                  "ordem": 2
                },
                {
                  "key": "ROTEIRO-00/9/E3",
                  "id": "E3",
                  "hash": "69b29020",
                  "textoHtml": "Login funciona no mobile para <code>cliente-a</code>",
                  "comoHtml": "Na aba do <code>localhost:8100</code>, com a emulação de dispositivo ligada (<strong>A9</strong>), entrar como <code>cliente-a</code>. O mobile <strong>verifica</strong> o código TOTP mas não cadastra — o enrollment é só no web, e já foi feito.",
                  "textoBusca": "login funciona no mobile para cliente-a na aba do localhost:8100, com a emulação de dispositivo ligada (a9), entrar como cliente-a. o mobile verifica o código totp mas não cadastra — o enrollment é só no web, e já foi feito.",
                  "esperadoHtml": null,
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 592,
                  "ordem": 3
                },
                {
                  "key": "ROTEIRO-00/9/E4",
                  "id": "E4",
                  "hash": "a96b4877",
                  "textoHtml": "Nenhuma superfície está em MSW (<code>PRE-04</code> conferido nas duas)",
                  "comoHtml": "Em cada aba (<code>:4200</code> e <code>:8100</code>), abrir o DevTools (<code>F12</code>), aba <strong>Console</strong>, e rodar <code>localStorage.NG_APP_USE_MSW</code>. A resposta precisa ser <code>null</code> ou <code>\"false\"</code>. Se vier <code>\"true\"</code>, rodar <code>localStorage.removeItem('NG_APP_USE_MSW')</code> e recarregar. Com o MSW ligado a tela responde bonito sem backend nenhum, e <strong>o roteiro inteiro perde o valor</strong>.",
                  "textoBusca": "nenhuma superfície está em msw (pre-04 conferido nas duas) em cada aba (:4200 e :8100), abrir o devtools (f12), aba console, e rodar localstorage.ngappusemsw. a resposta precisa ser null ou \"false\". se vier \"true\", rodar localstorage.removeitem('ngappusemsw') e recarregar. com o msw ligado a tela responde bonito sem backend nenhum, e o roteiro inteiro perde o valor.",
                  "esperadoHtml": null,
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 596,
                  "ordem": 4
                },
                {
                  "key": "ROTEIRO-00/9/E5",
                  "id": "E5",
                  "hash": "cd720b2e",
                  "textoHtml": "A aba de rede do navegador mostra chamadas saindo para <code>localhost:8080</code>",
                  "comoHtml": "É a confirmação positiva do E4: em vez de perguntar se o mock está desligado, olhar se o backend real está sendo chamado. Aba <strong>Network</strong>, filtrar por <code>8080</code>, e fazer qualquer ação na tela (um login serve). Tem que aparecer chamada.",
                  "textoBusca": "a aba de rede do navegador mostra chamadas saindo para localhost:8080 é a confirmação positiva do e4: em vez de perguntar se o mock está desligado, olhar se o backend real está sendo chamado. aba network, filtrar por 8080, e fazer qualquer ação na tela (um login serve). tem que aparecer chamada.",
                  "esperadoHtml": "se não há chamadas para <code>:8080</code>, a superfície está em mock e o resultado do roteiro não vale.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 601,
                  "ordem": 5
                }
              ]
            }
          ],
          "assercoes": [],
          "linha": 579,
          "stats": {
            "passos": 5,
            "na": 0,
            "assercoes": 0
          }
        }
      ],
      "ocorrenciasColunas": [
        "#",
        "Passo",
        "O que aconteceu",
        "Esperado",
        "Issue"
      ],
      "registroCampos": [
        {
          "chave": "executado_por",
          "rotulo": "Executado por",
          "tipo": "texto"
        },
        {
          "chave": "data_hora",
          "rotulo": "Data / hora",
          "tipo": "texto"
        },
        {
          "chave": "commit_sep_api",
          "rotulo": "Commit sep-api",
          "tipo": "texto"
        },
        {
          "chave": "commit_sep_app",
          "rotulo": "Commit sep-app",
          "tipo": "texto"
        },
        {
          "chave": "commit_sep_mobile",
          "rotulo": "Commit sep-mobile",
          "tipo": "texto"
        },
        {
          "chave": "resultado",
          "rotulo": "Resultado",
          "tipo": "texto"
        },
        {
          "chave": "observacoes",
          "rotulo": "Observações",
          "tipo": "textarea"
        }
      ]
    },
    {
      "id": "ROTEIRO-01",
      "arquivo": "ROTEIRO-01-ACESSO-E-SESSAO.md",
      "hash": "dbbec8f9",
      "titulo": "Roteiro 01 - Acesso e sessão",
      "tipo": "jornadas",
      "ordem": 11,
      "atualizadoEm": "2026-07-21",
      "resumoHtml": "",
      "escopos": [
        {
          "key": "ROTEIRO-01/J-001.W",
          "id": "J-001.W",
          "escopoId": "J-001.W",
          "kind": "jornada",
          "nivel": 3,
          "titulo": "Visitante navega da landing até o login",
          "anchor": "j-001w---visitante-navega-da-landing-at-o-login",
          "ordem": 1,
          "meta": [
            {
              "chave": "ID",
              "texto": "J-001.W",
              "html": "<code>J-001.W</code>"
            },
            {
              "chave": "Tipo",
              "texto": "Positiva",
              "html": "Positiva"
            },
            {
              "chave": "Persona",
              "texto": "Visitante (sem token)",
              "html": "Visitante (sem token)"
            },
            {
              "chave": "Superfície",
              "texto": "Web http://localhost:4200",
              "html": "Web <code>http://localhost:4200</code>"
            },
            {
              "chave": "Pré-condições",
              "texto": "PRE-01 PRE-02 PRE-04",
              "html": "<code>PRE-01</code> <code>PRE-02</code> <code>PRE-04</code>"
            },
            {
              "chave": "Credenciais",
              "texto": "nenhuma — esta jornada é de visitante, sem fazer login",
              "html": "nenhuma — esta jornada é de visitante, <strong>sem</strong> fazer login"
            },
            {
              "chave": "Endpoints tocados",
              "texto": "nenhum obrigatório",
              "html": "nenhum obrigatório"
            },
            {
              "chave": "Duração",
              "texto": "3 min",
              "html": "3 min"
            },
            {
              "chave": "Automação equivalente",
              "texto": "smoke.spec.ts (parcial)",
              "html": "<a href=\"../../../sep-app/e2e/smoke.spec.ts\" rel=\"noreferrer\"><code>smoke.spec.ts</code></a> (parcial)"
            },
            {
              "chave": "Só o manual cobre",
              "texto": "Leitura visual do conteúdo, layout <768px",
              "html": "Leitura visual do conteúdo, layout &lt;768px"
            }
          ],
          "metaIndex": {
            "ID": "J-001.W",
            "Tipo": "Positiva",
            "Persona": "Visitante (sem token)",
            "Superfície": "Web http://localhost:4200",
            "Pré-condições": "PRE-01 PRE-02 PRE-04",
            "Credenciais": "nenhuma — esta jornada é de visitante, sem fazer login",
            "Endpoints tocados": "nenhum obrigatório",
            "Duração": "3 min",
            "Automação equivalente": "smoke.spec.ts (parcial)",
            "Só o manual cobre": "Leitura visual do conteúdo, layout <768px"
          },
          "notas": [
            "Família <code>J-000</code> a <code>J-039</code>: público, cadastro, login, MFA, lockout, sessão, perfil, senha e step-up. Requer <a href=\"./ROTEIRO-00-AMBIENTE-E-MASSA.md\" rel=\"noreferrer\"><code>ROTEIRO-00</code></a> concluído. Hub: <a href=\"./CENARIOS-TESTE-JORNADAS-USUARIO.md\" rel=\"noreferrer\"><code>CENARIOS-TESTE-JORNADAS-USUARIO.md</code></a>.",
            "Tudo no navegador. O mobile e o PWA em <code>localhost:8100</code> com emulação de dispositivo. Biometria nativa fica no <code>ROTEIRO-09</code>, adiado por exigir aparelho."
          ],
          "grupos": [
            {
              "id": "g2",
              "tituloHtml": "Tela <code>/</code> (landing)",
              "tela": "/",
              "implicito": false,
              "passos": [
                {
                  "key": "ROTEIRO-01/J-001.W/P1",
                  "id": "P1",
                  "hash": "1b39d05b",
                  "textoHtml": "Abrir <code>http://localhost:4200</code> em aba anônima.",
                  "comoHtml": "No Chrome, <code>Ctrl+Shift+N</code> abre uma janela anônima (no Firefox, <code>Ctrl+Shift+P</code>). A janela anônima importa: ela não tem token de sessão de execuções anteriores, e é isso que faz de você um &quot;visitante&quot;. Digitar o endereço na barra e abrir. Se a página não carregar, o <code>sep-app</code> não está no ar — volte ao <a href=\"./ROTEIRO-00-AMBIENTE-E-MASSA.md\" rel=\"noreferrer\"><code>ROTEIRO-00</code></a> §4.3.",
                  "textoBusca": "abrir http://localhost:4200 em aba anônima. no chrome, ctrl+shift+n abre uma janela anônima (no firefox, ctrl+shift+p). a janela anônima importa: ela não tem token de sessão de execuções anteriores, e é isso que faz de você um \"visitante\". digitar o endereço na barra e abrir. se a página não carregar, o sep-app não está no ar — volte ao roteiro-00 §4.3.",
                  "esperadoHtml": "landing carrega; nenhum erro no console.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 61,
                  "ordem": 1
                },
                {
                  "key": "ROTEIRO-01/J-001.W/P2",
                  "id": "P2",
                  "hash": "a46befc5",
                  "textoHtml": "Abrir a aba de rede antes de interagir.",
                  "comoHtml": "<code>F12</code> abre o DevTools; escolher a aba <strong>Network</strong> (ou <strong>Rede</strong>) e recarregar com <code>Ctrl+R</code> para capturar o carregamento desde o início. Ler a coluna <strong>Name</strong>: você deve ver só arquivos estáticos (<code>.js</code>, <code>.css</code>, fontes, ícones). O que <strong>não</strong> pode aparecer é chamada à API — filtre por <code>auth</code> ou <code>api</code> na caixa de filtro para confirmar que a lista fica vazia.",
                  "textoBusca": "abrir a aba de rede antes de interagir. f12 abre o devtools; escolher a aba network (ou rede) e recarregar com ctrl+r para capturar o carregamento desde o início. ler a coluna name: você deve ver só arquivos estáticos (.js, .css, fontes, ícones). o que não pode aparecer é chamada à api — filtre por auth ou api na caixa de filtro para confirmar que a lista fica vazia.",
                  "esperadoHtml": "<strong>nenhuma</strong> chamada autenticada (<code>/auth/me</code>, <code>/api/v1/...</code>) antes do login.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 68,
                  "ordem": 2
                },
                {
                  "key": "ROTEIRO-01/J-001.W/P3",
                  "id": "P3",
                  "hash": "4797d145",
                  "textoHtml": "Reduzir a janela para 375px de largura.",
                  "comoHtml": "Com o DevTools aberto, ligar o modo dispositivo (<code>Ctrl+Shift+M</code>) e escolher um preset de 375px de largura, como <strong>iPhone SE</strong>. 375px é a largura de celular mais estreita que interessa. Depois rolar a página inteira até o rodapé procurando barra de rolagem <strong>horizontal</strong> — ela é o defeito; a vertical é normal.",
                  "textoBusca": "reduzir a janela para 375px de largura. com o devtools aberto, ligar o modo dispositivo (ctrl+shift+m) e escolher um preset de 375px de largura, como iphone se. 375px é a largura de celular mais estreita que interessa. depois rolar a página inteira até o rodapé procurando barra de rolagem horizontal — ela é o defeito; a vertical é normal.",
                  "esperadoHtml": "sem scroll horizontal; CTAs alcançáveis. Este é um dos itens que o <a href=\"../STATE.md\" rel=\"noreferrer\"><code>STATE.md</code></a> marca como pendente de conferência visual.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 75,
                  "ordem": 3
                },
                {
                  "key": "ROTEIRO-01/J-001.W/P4",
                  "id": "P4",
                  "hash": "4422bd14",
                  "textoHtml": "Clicar em <strong>Entrar</strong>.",
                  "comoHtml": "A palavra <strong>Entrar</strong> aparece em três lugares da landing (no topo, no bloco principal e no rodapé) e as três levam ao mesmo lugar — use a do topo. Ao lado dela há <strong>Criar conta</strong>, que leva a outro destino; não é esta. Conferir o endereço na barra depois do clique.",
                  "textoBusca": "clicar em entrar. a palavra entrar aparece em três lugares da landing (no topo, no bloco principal e no rodapé) e as três levam ao mesmo lugar — use a do topo. ao lado dela há criar conta, que leva a outro destino; não é esta. conferir o endereço na barra depois do clique.",
                  "esperadoHtml": "vai para <code>/login</code>; formulário visível e com foco utilizável.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 82,
                  "ordem": 4
                }
              ]
            }
          ],
          "assercoes": [
            {
              "key": "ROTEIRO-01/J-001.W/#a684c7fd",
              "id": null,
              "hash": "f1fd2774",
              "textoHtml": "Landing e login renderizam sem token e sem chamada autenticada",
              "comoHtml": "Na tela de login, conferir que existem os campos <strong>E-mail</strong> e <strong>Senha</strong> e o botão <strong>Entrar</strong>. Não preencher nada: esta jornada termina aqui, e o login em si é a <a href=\"#j-011w---login-com-mfa-totp\" rel=\"noreferrer\"><code>J-011.W</code></a>.",
              "textoBusca": "landing e login renderizam sem token e sem chamada autenticada na tela de login, conferir que existem os campos e-mail e senha e o botão entrar. não preencher nada: esta jornada termina aqui, e o login em si é a j-011.w.",
              "esperadoHtml": null,
              "blocos": [],
              "na": false,
              "naMotivo": null,
              "marcadoNaFonte": false,
              "linha": 91,
              "ordem": 1
            }
          ],
          "linha": 42,
          "stats": {
            "passos": 4,
            "na": 0,
            "assercoes": 1
          }
        },
        {
          "key": "ROTEIRO-01/J-002.W-N1",
          "id": "J-002.W-N1",
          "escopoId": "J-002.W-N1",
          "kind": "jornada",
          "nivel": 3,
          "titulo": "Visitante tenta área autenticada",
          "anchor": "j-002w-n1---visitante-tenta-rea-autenticada",
          "ordem": 2,
          "meta": [
            {
              "chave": "ID",
              "texto": "J-002.W-N1",
              "html": "<code>J-002.W-N1</code>"
            },
            {
              "chave": "Tipo",
              "texto": "Negativa — controle de acesso",
              "html": "Negativa — controle de acesso"
            },
            {
              "chave": "Persona",
              "texto": "Visitante (sem token)",
              "html": "Visitante (sem token)"
            },
            {
              "chave": "Superfície",
              "texto": "Web",
              "html": "Web"
            },
            {
              "chave": "Vetor",
              "texto": "Acesso por URL direta sem sessão",
              "html": "Acesso por URL direta sem sessão"
            },
            {
              "chave": "Comportamento seguro esperado",
              "texto": "Redireciono para /login sem vazar dado",
              "html": "Redireciono para <code>/login</code> sem vazar dado"
            },
            {
              "chave": "Pré-condições",
              "texto": "PRE-01 PRE-02 PRE-04",
              "html": "<code>PRE-01</code> <code>PRE-02</code> <code>PRE-04</code>"
            },
            {
              "chave": "Só o manual cobre",
              "texto": "Negação de rota por URL direta — item pendente no STATE.md",
              "html": "<strong>Negação de rota por URL direta</strong> — item pendente no <code>STATE.md</code>"
            }
          ],
          "metaIndex": {
            "ID": "J-002.W-N1",
            "Tipo": "Negativa — controle de acesso",
            "Persona": "Visitante (sem token)",
            "Superfície": "Web",
            "Vetor": "Acesso por URL direta sem sessão",
            "Comportamento seguro esperado": "Redireciono para /login sem vazar dado",
            "Pré-condições": "PRE-01 PRE-02 PRE-04",
            "Só o manual cobre": "Negação de rota por URL direta — item pendente no STATE.md"
          },
          "notas": [],
          "grupos": [
            {
              "id": "g1",
              "tituloHtml": null,
              "tela": null,
              "implicito": true,
              "passos": [
                {
                  "key": "ROTEIRO-01/J-002.W-N1/P1",
                  "id": "P1",
                  "hash": "aa27d558",
                  "textoHtml": "Sem sessão, abrir <code>/app/dashboard</code> direto na barra de endereços.",
                  "comoHtml": "Em aba anônima (<code>Ctrl+Shift+N</code>), colar <code>http://localhost:4200/app/dashboard</code> na barra. O ponto do teste é <strong>não</strong> passar pela tela de login: é a tentativa de entrar pela URL, que é como um atacante faria. Olhar a tela com atenção no instante do carregamento — o defeito seria o dashboard piscar antes do redirecionamento, vazando dado por um segundo.",
                  "textoBusca": "sem sessão, abrir /app/dashboard direto na barra de endereços. em aba anônima (ctrl+shift+n), colar http://localhost:4200/app/dashboard na barra. o ponto do teste é não passar pela tela de login: é a tentativa de entrar pela url, que é como um atacante faria. olhar a tela com atenção no instante do carregamento — o defeito seria o dashboard piscar antes do redirecionamento, vazando dado por um segundo.",
                  "esperadoHtml": "redireciona para <code>/login</code>. Nenhum dado do dashboard aparece antes.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 113,
                  "ordem": 1
                },
                {
                  "key": "ROTEIRO-01/J-002.W-N1/P2",
                  "id": "P2",
                  "hash": "da2ba53f",
                  "textoHtml": "Repetir para <code>/app/admin/users</code>.",
                  "comoHtml": "Mesma aba anônima, trocando só o endereço. Continuar sem fazer login entre um passo e outro.",
                  "textoBusca": "repetir para /app/admin/users. mesma aba anônima, trocando só o endereço. continuar sem fazer login entre um passo e outro.",
                  "esperadoHtml": "<code>/login</code>.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 120,
                  "ordem": 2
                },
                {
                  "key": "ROTEIRO-01/J-002.W-N1/P3",
                  "id": "P3",
                  "hash": "24fc8e89",
                  "textoHtml": "Repetir para <code>/app/pix/chaves</code>.",
                  "comoHtml": null,
                  "textoBusca": "repetir para /app/pix/chaves.",
                  "esperadoHtml": "<code>/login</code>.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 124,
                  "ordem": 3
                },
                {
                  "key": "ROTEIRO-01/J-002.W-N1/P4",
                  "id": "P4",
                  "hash": "a82519af",
                  "textoHtml": "Repetir para <code>/app/credora</code>.",
                  "comoHtml": null,
                  "textoBusca": "repetir para /app/credora.",
                  "esperadoHtml": "<code>/login</code>.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 126,
                  "ordem": 4
                },
                {
                  "key": "ROTEIRO-01/J-002.W-N1/P5",
                  "id": "P5",
                  "hash": "94e609ac",
                  "textoHtml": "Abrir <code>/design-system</code>.",
                  "comoHtml": "<strong>Aqui o comportamento é o oposto dos anteriores</strong>: esta rota carrega mesmo sem login, e isso é decisão de projeto, não falha. O que você verifica é o conteúdo: a página deve mostrar só amostras de componentes e cores. Se aparecer nome de cliente, valor de contrato ou qualquer dado de verdade, aí sim é ocorrência.",
                  "textoBusca": "abrir /design-system. aqui o comportamento é o oposto dos anteriores: esta rota carrega mesmo sem login, e isso é decisão de projeto, não falha. o que você verifica é o conteúdo: a página deve mostrar só amostras de componentes e cores. se aparecer nome de cliente, valor de contrato ou qualquer dado de verdade, aí sim é ocorrência.",
                  "esperadoHtml": "<strong>carrega sem sessão</strong> — a rota não tem guard, por decisão. Registrar se expõe qualquer dado real; deve exibir apenas componentes e tokens.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 128,
                  "ordem": 5
                }
              ]
            }
          ],
          "assercoes": [
            {
              "key": "ROTEIRO-01/J-002.W-N1/#a994f26c",
              "id": null,
              "hash": "d4ed9f3a",
              "textoHtml": "Nenhuma rota <code>/app/**</code> renderiza conteúdo sem sessão",
              "comoHtml": null,
              "textoBusca": "nenhuma rota /app/ renderiza conteúdo sem sessão",
              "esperadoHtml": null,
              "blocos": [],
              "na": false,
              "naMotivo": null,
              "marcadoNaFonte": false,
              "linha": 138,
              "ordem": 1
            }
          ],
          "linha": 98,
          "stats": {
            "passos": 5,
            "na": 0,
            "assercoes": 1
          }
        },
        {
          "key": "ROTEIRO-01/J-002.M-N1",
          "id": "J-002.M-N1",
          "escopoId": "J-002.M-N1",
          "kind": "jornada",
          "nivel": 3,
          "titulo": "Visitante tenta área autenticada (mobile)",
          "anchor": "j-002m-n1---visitante-tenta-rea-autenticada-mobile",
          "ordem": 3,
          "meta": [
            {
              "chave": "ID",
              "texto": "J-002.M-N1",
              "html": "<code>J-002.M-N1</code>"
            },
            {
              "chave": "Tipo",
              "texto": "Negativa — controle de acesso",
              "html": "Negativa — controle de acesso"
            },
            {
              "chave": "Persona",
              "texto": "Visitante",
              "html": "Visitante"
            },
            {
              "chave": "Superfície",
              "texto": "Mobile http://localhost:8100",
              "html": "Mobile <code>http://localhost:8100</code>"
            },
            {
              "chave": "Comportamento seguro esperado",
              "texto": "Redireciono para /welcome (não /login)",
              "html": "Redireciono para <code>/welcome</code> (não <code>/login</code>)"
            },
            {
              "chave": "Pré-condições",
              "texto": "PRE-01 PRE-03 PRE-04",
              "html": "<code>PRE-01</code> <code>PRE-03</code> <code>PRE-04</code>"
            },
            {
              "chave": "Automação equivalente",
              "texto": "smoke.spec.ts (parcial)",
              "html": "<a href=\"../../../sep-mobile/e2e/smoke.spec.ts\" rel=\"noreferrer\"><code>smoke.spec.ts</code></a> (parcial)"
            }
          ],
          "metaIndex": {
            "ID": "J-002.M-N1",
            "Tipo": "Negativa — controle de acesso",
            "Persona": "Visitante",
            "Superfície": "Mobile http://localhost:8100",
            "Comportamento seguro esperado": "Redireciono para /welcome (não /login)",
            "Pré-condições": "PRE-01 PRE-03 PRE-04",
            "Automação equivalente": "smoke.spec.ts (parcial)"
          },
          "notas": [],
          "grupos": [
            {
              "id": "g1",
              "tituloHtml": null,
              "tela": null,
              "implicito": true,
              "passos": [
                {
                  "key": "ROTEIRO-01/J-002.M-N1/P1",
                  "id": "P1",
                  "hash": "4d1d3602",
                  "textoHtml": "Sem sessão, abrir <code>/app/inicio</code>.",
                  "comoHtml": "Em aba anônima, com a emulação de dispositivo ligada (<code>Ctrl+Shift+M</code>), colar <code>http://localhost:8100/app/inicio</code>. Repare que a porta é <strong>8100</strong> (mobile), não 4200.",
                  "textoBusca": "sem sessão, abrir /app/inicio. em aba anônima, com a emulação de dispositivo ligada (ctrl+shift+m), colar http://localhost:8100/app/inicio. repare que a porta é 8100 (mobile), não 4200.",
                  "esperadoHtml": "redireciona para <code>/welcome</code>. Note a diferença em relação ao web, que vai para <code>/login</code>.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 156,
                  "ordem": 1
                },
                {
                  "key": "ROTEIRO-01/J-002.M-N1/P2",
                  "id": "P2",
                  "hash": "c7a49168",
                  "textoHtml": "Repetir para <code>/app/propostas</code> e <code>/app/parcelas</code>.",
                  "comoHtml": "Mesmos endereços com <code>/app/propostas</code> e depois <code>/app/parcelas</code>. A diferença de destino em relação ao web (<code>/welcome</code> em vez de <code>/login</code>) é proposital: no mobile o visitante cai na tela de boas-vindas, que oferece <strong>Entrar</strong> e <strong>Criar conta</strong>.",
                  "textoBusca": "repetir para /app/propostas e /app/parcelas. mesmos endereços com /app/propostas e depois /app/parcelas. a diferença de destino em relação ao web (/welcome em vez de /login) é proposital: no mobile o visitante cai na tela de boas-vindas, que oferece entrar e criar conta.",
                  "esperadoHtml": "<code>/welcome</code> nos dois casos.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 161,
                  "ordem": 2
                }
              ]
            }
          ],
          "assercoes": [],
          "linha": 142,
          "stats": {
            "passos": 2,
            "na": 0,
            "assercoes": 0
          }
        },
        {
          "key": "ROTEIRO-01/J-003.W",
          "id": "J-003.W",
          "escopoId": "J-003.W",
          "kind": "jornada",
          "nivel": 3,
          "titulo": "Visitante tenta se cadastrar pelo web (canalização)",
          "anchor": "j-003w---visitante-tenta-se-cadastrar-pelo-web-canalizao",
          "ordem": 4,
          "meta": [
            {
              "chave": "ID",
              "texto": "J-003.W",
              "html": "<code>J-003.W</code>"
            },
            {
              "chave": "Tipo",
              "texto": "Positiva — verifica canalização, não cadastro",
              "html": "Positiva — verifica canalização, <strong>não</strong> cadastro"
            },
            {
              "chave": "Persona",
              "texto": "Visitante",
              "html": "Visitante"
            },
            {
              "chave": "Superfície",
              "texto": "Web",
              "html": "Web"
            },
            {
              "chave": "Pré-condições",
              "texto": "PRE-01 PRE-02 PRE-04",
              "html": "<code>PRE-01</code> <code>PRE-02</code> <code>PRE-04</code>"
            },
            {
              "chave": "Nota",
              "texto": "O cadastro real só existe no mobile (J-003.M). No web, /register e tela estática de canalização.",
              "html": "O cadastro real <strong>só existe no mobile</strong> (<a href=\"#j-003m---visitante-cria-conta-de-cliente\" rel=\"noreferrer\"><code>J-003.M</code></a>). No web, <code>/register</code> e tela estática de canalização."
            },
            {
              "chave": "Automação equivalente",
              "texto": "golden-path.spec.ts",
              "html": "<a href=\"../../../sep-app/e2e/golden-path.spec.ts\" rel=\"noreferrer\"><code>golden-path.spec.ts</code></a>"
            }
          ],
          "metaIndex": {
            "ID": "J-003.W",
            "Tipo": "Positiva — verifica canalização, não cadastro",
            "Persona": "Visitante",
            "Superfície": "Web",
            "Pré-condições": "PRE-01 PRE-02 PRE-04",
            "Nota": "O cadastro real só existe no mobile (J-003.M). No web, /register e tela estática de canalização.",
            "Automação equivalente": "golden-path.spec.ts"
          },
          "notas": [],
          "grupos": [
            {
              "id": "g1",
              "tituloHtml": null,
              "tela": null,
              "implicito": true,
              "passos": [
                {
                  "key": "ROTEIRO-01/J-003.W/P1",
                  "id": "P1",
                  "hash": "39406636",
                  "textoHtml": "Abrir <code>/register</code> sem token.",
                  "comoHtml": "Em aba anônima, abrir <code>http://localhost:4200/register</code>. Você chega aqui também clicando em <strong>Criar conta</strong> na landing. A tela se chama <strong>Como cadastrar sua conta</strong> e explica três caminhos (tomador pelo app, credora por convite, interno pelo admin). O único elemento clicável é o link <strong>Já tenho conta — fazer login</strong>.",
                  "textoBusca": "abrir /register sem token. em aba anônima, abrir http://localhost:4200/register. você chega aqui também clicando em criar conta na landing. a tela se chama como cadastrar sua conta e explica três caminhos (tomador pelo app, credora por convite, interno pelo admin). o único elemento clicável é o link já tenho conta — fazer login.",
                  "esperadoHtml": "tela de canalização (&quot;tomador baixa o app; credora entra por convite; interno é criado pelo admin&quot;). <strong>Nenhum</strong> campo de senha, nenhum formulário de cadastro.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 183,
                  "ordem": 1
                },
                {
                  "key": "ROTEIRO-01/J-003.W/P2",
                  "id": "P2",
                  "hash": "9d8b1884",
                  "textoHtml": "Inspecionar a rede durante a visita.",
                  "comoHtml": "Com o DevTools na aba <strong>Network</strong>, recarregar a página. Como esta tela é estática, não pode haver nenhuma chamada à API — filtrar por <code>api</code> e confirmar lista vazia.",
                  "textoBusca": "inspecionar a rede durante a visita. com o devtools na aba network, recarregar a página. como esta tela é estática, não pode haver nenhuma chamada à api — filtrar por api e confirmar lista vazia.",
                  "esperadoHtml": "nenhum <code>POST /api/v1/usuarios</code>, nenhuma chamada autenticada.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 190,
                  "ordem": 2
                }
              ]
            }
          ],
          "assercoes": [
            {
              "key": "ROTEIRO-01/J-003.W/#30dc0ed5",
              "id": null,
              "hash": "7d286371",
              "textoHtml": "Não existe caminho de cadastro pelo web — a jornada &quot;cadastro cliente pelo web&quot; não e executável por decisão de produto, não por defeito",
              "comoHtml": null,
              "textoBusca": "não existe caminho de cadastro pelo web — a jornada \"cadastro cliente pelo web\" não e executável por decisão de produto, não por defeito",
              "esperadoHtml": null,
              "blocos": [],
              "na": false,
              "naMotivo": null,
              "marcadoNaFonte": false,
              "linha": 198,
              "ordem": 1
            }
          ],
          "linha": 169,
          "stats": {
            "passos": 2,
            "na": 0,
            "assercoes": 1
          }
        },
        {
          "key": "ROTEIRO-01/J-003.M",
          "id": "J-003.M",
          "escopoId": "J-003.M",
          "kind": "jornada",
          "nivel": 3,
          "titulo": "Visitante cria conta de cliente",
          "anchor": "j-003m---visitante-cria-conta-de-cliente",
          "ordem": 5,
          "meta": [
            {
              "chave": "ID",
              "texto": "J-003.M",
              "html": "<code>J-003.M</code>"
            },
            {
              "chave": "Tipo",
              "texto": "Positiva",
              "html": "Positiva"
            },
            {
              "chave": "Persona",
              "texto": "Visitante",
              "html": "Visitante"
            },
            {
              "chave": "Superfície",
              "texto": "Mobile",
              "html": "Mobile"
            },
            {
              "chave": "Pré-condições",
              "texto": "PRE-01 PRE-03 PRE-04",
              "html": "<code>PRE-01</code> <code>PRE-03</code> <code>PRE-04</code>"
            },
            {
              "chave": "Endpoints tocados",
              "texto": "POST /api/v1/usuarios",
              "html": "<code>POST /api/v1/usuarios</code>"
            },
            {
              "chave": "Duração",
              "texto": "5 min",
              "html": "5 min"
            },
            {
              "chave": "Automação equivalente",
              "texto": "golden-path-mobile.spec.ts — vermelha hoje",
              "html": "<a href=\"../../../sep-mobile/e2e/golden-path-mobile.spec.ts\" rel=\"noreferrer\"><code>golden-path-mobile.spec.ts</code></a> — <strong>vermelha hoje</strong>"
            },
            {
              "chave": "Só o manual cobre",
              "texto": "Política de senha real do backend (o mock aceita 123456)",
              "html": "Política de senha real do backend (o mock aceita <code>123456</code>)"
            }
          ],
          "metaIndex": {
            "ID": "J-003.M",
            "Tipo": "Positiva",
            "Persona": "Visitante",
            "Superfície": "Mobile",
            "Pré-condições": "PRE-01 PRE-03 PRE-04",
            "Endpoints tocados": "POST /api/v1/usuarios",
            "Duração": "5 min",
            "Automação equivalente": "golden-path-mobile.spec.ts — vermelha hoje",
            "Só o manual cobre": "Política de senha real do backend (o mock aceita 123456)"
          },
          "notas": [],
          "grupos": [
            {
              "id": "g2",
              "tituloHtml": "Tela <code>/welcome</code> → <code>/register</code>",
              "tela": "/welcome",
              "implicito": false,
              "passos": [
                {
                  "key": "ROTEIRO-01/J-003.M/P1",
                  "id": "P1",
                  "hash": "38c81645",
                  "textoHtml": "Abrir <code>/welcome</code> e tocar na ação de criar conta.",
                  "comoHtml": "Em <code>http://localhost:8100/welcome</code>, com a emulação de dispositivo ligada. A tela tem dois botões: <strong>Entrar</strong> e <strong>Criar conta</strong> — usar o segundo. Ao contrário do web, aqui existe formulário de verdade.",
                  "textoBusca": "abrir /welcome e tocar na ação de criar conta. em http://localhost:8100/welcome, com a emulação de dispositivo ligada. a tela tem dois botões: entrar e criar conta — usar o segundo. ao contrário do web, aqui existe formulário de verdade.",
                  "esperadoHtml": "vai para <code>/register</code> com formulário real.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 221,
                  "ordem": 1
                },
                {
                  "key": "ROTEIRO-01/J-003.M/P2",
                  "id": "P2",
                  "hash": "186fbc83",
                  "textoHtml": "Informar um e-mail único desta execução e a senha <code>123456</code>.",
                  "comoHtml": "Usar um e-mail que ninguém tenha usado ainda, com a data para não repetir — por exemplo <code>cadastro-2026-07-21@sep.test</code>. <strong>Anote esse e-mail</strong>: a jornada <a href=\"#j-010m---cadastro--login--sair\" rel=\"noreferrer\"><code>J-010.M</code></a> faz login com ele. No campo <strong>Senha</strong>, digitar <code>123456</code> de propósito e enviar. A recusa é o resultado correto.",
                  "textoBusca": "informar um e-mail único desta execução e a senha 123456. usar um e-mail que ninguém tenha usado ainda, com a data para não repetir — por exemplo cadastro-2026-07-21@sep.test. anote esse e-mail: a jornada j-010.m faz login com ele. no campo senha, digitar 123456 de propósito e enviar. a recusa é o resultado correto.",
                  "esperadoHtml": "<strong>recusado</strong>. Política real é 12+ chars ou passphrase de 4+ palavras. Se passar, a superfície está em MSW — voltar e conferir <code>PRE-04</code>.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 226,
                  "ordem": 2
                },
                {
                  "key": "ROTEIRO-01/J-003.M/P3",
                  "id": "P3",
                  "hash": "15a971bc",
                  "textoHtml": "Informar a senha <code>jornada-cadastro-sep-2026</code> e enviar.",
                  "comoHtml": "Trocar só o campo <strong>Senha</strong>, mantendo o mesmo e-mail do P2. Anotar essa senha junto do e-mail.",
                  "textoBusca": "informar a senha jornada-cadastro-sep-2026 e enviar. trocar só o campo senha, mantendo o mesmo e-mail do p2. anotar essa senha junto do e-mail.",
                  "esperadoHtml": "<code>201</code>; conta criada como <code>CLIENTE</code>.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 233,
                  "ordem": 3
                },
                {
                  "key": "ROTEIRO-01/J-003.M/P4",
                  "id": "P4",
                  "hash": "af0f40d2",
                  "textoHtml": "Repetir o cadastro com o <strong>mesmo</strong> e-mail.",
                  "comoHtml": "Voltar para <code>/register</code> e enviar de novo com o e-mail do P2. O que se verifica aqui é a <strong>qualidade da mensagem</strong>: tem de ser um aviso compreensível de e-mail já cadastrado. Se aparecer código de erro cru, stack trace ou tela em branco, é ocorrência.",
                  "textoBusca": "repetir o cadastro com o mesmo e-mail. voltar para /register e enviar de novo com o e-mail do p2. o que se verifica aqui é a qualidade da mensagem: tem de ser um aviso compreensível de e-mail já cadastrado. se aparecer código de erro cru, stack trace ou tela em branco, é ocorrência.",
                  "esperadoHtml": "erro amigável de e-mail duplicado; sem stack trace na tela.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 237,
                  "ordem": 4
                },
                {
                  "key": "ROTEIRO-01/J-003.M/P5",
                  "id": "P5",
                  "hash": "84a0383a",
                  "textoHtml": "Conferir no banco que a role não escalou:",
                  "comoHtml": "<strong>Faça o P3 escolhendo &quot;Administrador&quot; no seletor Perfil</strong> — o formulário oferece essa opção, e é justamente por isso que este passo existe. O backend ignora o campo e cria <code>CLIENTE</code> de qualquer jeito. Se a consulta abaixo devolver <code>ADMIN</code>, é uma escalada de privilégio e a ocorrência é grave. Rodar no terminal do banco.",
                  "textoBusca": "conferir no banco que a role não escalou: faça o p3 escolhendo \"administrador\" no seletor perfil — o formulário oferece essa opção, e é justamente por isso que este passo existe. o backend ignora o campo e cria cliente de qualquer jeito. se a consulta abaixo devolver admin, é uma escalada de privilégio e a ocorrência é grave. rodar no terminal do banco.",
                  "esperadoHtml": "<code>role = CLIENTE</code>. O cadastro público não cria ADMIN em nenhuma hipótese.",
                  "blocos": [
                    {
                      "tipo": "codigo",
                      "lang": "bash",
                      "regiao": "como",
                      "conteudo": "docker exec sep-postgres psql -U sep -d sep_dev \\\n  -c \"SELECT username, role FROM usuario ORDER BY data_evento DESC LIMIT 1;\""
                    }
                  ],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 242,
                  "ordem": 5
                }
              ]
            }
          ],
          "assercoes": [],
          "linha": 203,
          "stats": {
            "passos": 5,
            "na": 0,
            "assercoes": 0
          }
        },
        {
          "key": "ROTEIRO-01/J-010.M",
          "id": "J-010.M",
          "escopoId": "J-010.M",
          "kind": "jornada",
          "nivel": 3,
          "titulo": "Cadastro + login + sair",
          "anchor": "j-010m---cadastro--login--sair",
          "ordem": 6,
          "meta": [
            {
              "chave": "ID",
              "texto": "J-010.M",
              "html": "<code>J-010.M</code>"
            },
            {
              "chave": "Tipo",
              "texto": "Positiva",
              "html": "Positiva"
            },
            {
              "chave": "Persona",
              "texto": "Conta criada em J-003.M",
              "html": "Conta criada em <a href=\"#j-003m---visitante-cria-conta-de-cliente\" rel=\"noreferrer\"><code>J-003.M</code></a>"
            },
            {
              "chave": "Superfície",
              "texto": "Mobile",
              "html": "Mobile"
            },
            {
              "chave": "Pré-condições",
              "texto": "PRE-01 PRE-03 PRE-04 + J-003.M concluída",
              "html": "<code>PRE-01</code> <code>PRE-03</code> <code>PRE-04</code> + <code>J-003.M</code> concluída"
            },
            {
              "chave": "Endpoints tocados",
              "texto": "POST /auth/login, GET /auth/me, POST /auth/logout",
              "html": "<code>POST /auth/login</code>, <code>GET /auth/me</code>, <code>POST /auth/logout</code>"
            },
            {
              "chave": "Duração",
              "texto": "5 min",
              "html": "5 min"
            },
            {
              "chave": "Automação equivalente",
              "texto": "golden-path-mobile.spec.ts — vermelha hoje",
              "html": "<a href=\"../../../sep-mobile/e2e/golden-path-mobile.spec.ts\" rel=\"noreferrer\"><code>golden-path-mobile.spec.ts</code></a> — <strong>vermelha hoje</strong>"
            },
            {
              "chave": "Só o manual cobre",
              "texto": "O caminho completo contra :8080 real, que e exatamente o que a spec vermelha tenta fazer",
              "html": "O caminho completo contra <code>:8080</code> real, que e exatamente o que a spec vermelha tenta fazer"
            }
          ],
          "metaIndex": {
            "ID": "J-010.M",
            "Tipo": "Positiva",
            "Persona": "Conta criada em J-003.M",
            "Superfície": "Mobile",
            "Pré-condições": "PRE-01 PRE-03 PRE-04 + J-003.M concluída",
            "Endpoints tocados": "POST /auth/login, GET /auth/me, POST /auth/logout",
            "Duração": "5 min",
            "Automação equivalente": "golden-path-mobile.spec.ts — vermelha hoje",
            "Só o manual cobre": "O caminho completo contra :8080 real, que e exatamente o que a spec vermelha tenta fazer"
          },
          "notas": [],
          "grupos": [
            {
              "id": "g1",
              "tituloHtml": null,
              "tela": null,
              "implicito": true,
              "passos": [
                {
                  "key": "ROTEIRO-01/J-010.M/P1",
                  "id": "P1",
                  "hash": "17c102ba",
                  "textoHtml": "Em <code>/login</code>, autenticar com as credenciais de <code>J-003.M</code>.",
                  "comoHtml": "São o e-mail e a senha que você anotou no P2/P3 da <a href=\"#j-003m---visitante-cria-conta-de-cliente\" rel=\"noreferrer\"><code>J-003.M</code></a> — não são as personas do ROTEIRO-00. Em <code>http://localhost:8100/login</code>, campos <strong>E-mail</strong> e <strong>Senha</strong>, botão <strong>Entrar</strong>.",
                  "textoBusca": "em /login, autenticar com as credenciais de j-003.m. são o e-mail e a senha que você anotou no p2/p3 da j-003.m — não são as personas do roteiro-00. em http://localhost:8100/login, campos e-mail e senha, botão entrar.",
                  "esperadoHtml": "entra em <code>/app/inicio</code>; <code>mfaRequired = false</code> (conta nova não tem TOTP).",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 271,
                  "ordem": 1
                },
                {
                  "key": "ROTEIRO-01/J-010.M/P2",
                  "id": "P2",
                  "hash": "82b6dc01",
                  "textoHtml": "Observar a barra de tabs.",
                  "comoHtml": "A barra fica no rodapé da tela. Contar as abas: devem ser quatro. O teste aqui é de <strong>ausência</strong> — as abas Credora e Admin não podem aparecer para esta persona.",
                  "textoBusca": "observar a barra de tabs. a barra fica no rodapé da tela. contar as abas: devem ser quatro. o teste aqui é de ausência — as abas credora e admin não podem aparecer para esta persona.",
                  "esperadoHtml": "Início, Propostas, Parcelas e Perfil. <strong>Sem</strong> aba Credora (a persona não tem credora) e <strong>sem</strong> aba Admin.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 277,
                  "ordem": 2
                },
                {
                  "key": "ROTEIRO-01/J-010.M/P3",
                  "id": "P3",
                  "hash": "9451c590",
                  "textoHtml": "Abrir <strong>Perfil</strong>.",
                  "comoHtml": "Tocar na aba <strong>Perfil</strong> (rota <code>/app/perfil</code> no mobile — note que no web é <code>/app/profile</code>). Conferir que o e-mail exibido no card <strong>Identificação</strong> é o mesmo com que você entrou.",
                  "textoBusca": "abrir perfil. tocar na aba perfil (rota /app/perfil no mobile — note que no web é /app/profile). conferir que o e-mail exibido no card identificação é o mesmo com que você entrou.",
                  "esperadoHtml": "e-mail e perfil batem com <code>/auth/me</code>.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 282,
                  "ordem": 3
                },
                {
                  "key": "ROTEIRO-01/J-010.M/P4",
                  "id": "P4",
                  "hash": "c0e35334",
                  "textoHtml": "Sair pela ação de logout.",
                  "comoHtml": "Há dois botões <strong>Sair</strong>: um no topo da tela e outro no fim da tela de perfil. Qualquer um serve.",
                  "textoBusca": "sair pela ação de logout. há dois botões sair: um no topo da tela e outro no fim da tela de perfil. qualquer um serve.",
                  "esperadoHtml": "volta para <code>/welcome</code>; sessão limpa.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 287,
                  "ordem": 4
                },
                {
                  "key": "ROTEIRO-01/J-010.M/P5",
                  "id": "P5",
                  "hash": "c31d1de4",
                  "textoHtml": "Acionar o <strong>voltar do navegador</strong>.",
                  "comoHtml": "Logo após sair, apertar a seta de voltar do navegador (ou <code>Alt+←</code>). A tentação do navegador é remontar a última página, que era a área logada — e é exatamente isso que não pode acontecer. Se a tela logada reaparecer, mesmo que por um instante, é ocorrência.",
                  "textoBusca": "acionar o voltar do navegador. logo após sair, apertar a seta de voltar do navegador (ou alt+←). a tentação do navegador é remontar a última página, que era a área logada — e é exatamente isso que não pode acontecer. se a tela logada reaparecer, mesmo que por um instante, é ocorrência.",
                  "esperadoHtml": "<strong>não</strong> retorna para a área logada. O <code>redirectAuthenticatedGuard</code> foi criado para esse caso na M-13 — o gatilho original era o botão físico do Android, mas o guard é o mesmo no PWA.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 291,
                  "ordem": 5
                },
                {
                  "key": "ROTEIRO-01/J-010.M/P6",
                  "id": "P6",
                  "hash": "acd76b30",
                  "textoHtml": "Abrir <code>/app/inicio</code> por URL direta após o logout.",
                  "comoHtml": "Colar <code>http://localhost:8100/app/inicio</code> na barra. É a mesma verificação da <a href=\"#j-002m-n1---visitante-tenta-área-autenticada-mobile\" rel=\"noreferrer\"><code>J-002.M-N1</code></a>, agora depois de uma sessão que existiu — o que prova que o logout limpou mesmo o token.",
                  "textoBusca": "abrir /app/inicio por url direta após o logout. colar http://localhost:8100/app/inicio na barra. é a mesma verificação da j-002.m-n1, agora depois de uma sessão que existiu — o que prova que o logout limpou mesmo o token.",
                  "esperadoHtml": "<code>/welcome</code>.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 299,
                  "ordem": 6
                }
              ]
            }
          ],
          "assercoes": [
            {
              "key": "ROTEIRO-01/J-010.M/#79218d7b",
              "id": null,
              "hash": "c306c345",
              "textoHtml": "Ciclo cadastro → login → sair fecha sem residuo de sessão",
              "comoHtml": null,
              "textoBusca": "ciclo cadastro → login → sair fecha sem residuo de sessão",
              "esperadoHtml": null,
              "blocos": [],
              "na": false,
              "naMotivo": null,
              "marcadoNaFonte": false,
              "linha": 307,
              "ordem": 1
            },
            {
              "key": "ROTEIRO-01/J-010.M/#c2ac306f",
              "id": null,
              "hash": "c858607b",
              "textoHtml": "Se todos os passos passarem, vale reavaliar por que a <code>golden-path-mobile.spec.ts</code> segue vermelha — o roteiro manual e a referência para o diagnóstico",
              "comoHtml": null,
              "textoBusca": "se todos os passos passarem, vale reavaliar por que a golden-path-mobile.spec.ts segue vermelha — o roteiro manual e a referência para o diagnóstico",
              "esperadoHtml": null,
              "blocos": [],
              "na": false,
              "naMotivo": null,
              "marcadoNaFonte": false,
              "linha": 308,
              "ordem": 2
            }
          ],
          "linha": 255,
          "stats": {
            "passos": 6,
            "na": 0,
            "assercoes": 2
          }
        },
        {
          "key": "ROTEIRO-01/J-011.W",
          "id": "J-011.W",
          "escopoId": "J-011.W",
          "kind": "jornada",
          "nivel": 3,
          "titulo": "Login com MFA TOTP",
          "anchor": "j-011w---login-com-mfa-totp",
          "ordem": 7,
          "meta": [
            {
              "chave": "ID",
              "texto": "J-011.W",
              "html": "<code>J-011.W</code>"
            },
            {
              "chave": "Tipo",
              "texto": "Positiva",
              "html": "Positiva"
            },
            {
              "chave": "Persona",
              "texto": "cliente-a — CLIENTE com TOTP habilitado",
              "html": "<code>cliente-a</code> — CLIENTE com TOTP habilitado"
            },
            {
              "chave": "Superfície",
              "texto": "Web",
              "html": "Web"
            },
            {
              "chave": "Pré-condições",
              "texto": "PRE-01 PRE-02 PRE-04 PRE-07 PRE-10",
              "html": "<code>PRE-01</code> <code>PRE-02</code> <code>PRE-04</code> <code>PRE-07</code> <code>PRE-10</code>"
            },
            {
              "chave": "Endpoints tocados",
              "texto": "POST /auth/login, POST /auth/totp/verify",
              "html": "<code>POST /auth/login</code>, <code>POST /auth/totp/verify</code>"
            },
            {
              "chave": "Duração",
              "texto": "5 min",
              "html": "5 min"
            },
            {
              "chave": "Automação equivalente",
              "texto": "nenhuma — a suite mocka o desafio",
              "html": "nenhuma — a suite mocka o desafio"
            },
            {
              "chave": "Só o manual cobre",
              "texto": "TOTP real — item pendente no STATE.md",
              "html": "<strong>TOTP real</strong> — item pendente no <code>STATE.md</code>"
            }
          ],
          "metaIndex": {
            "ID": "J-011.W",
            "Tipo": "Positiva",
            "Persona": "cliente-a — CLIENTE com TOTP habilitado",
            "Superfície": "Web",
            "Pré-condições": "PRE-01 PRE-02 PRE-04 PRE-07 PRE-10",
            "Endpoints tocados": "POST /auth/login, POST /auth/totp/verify",
            "Duração": "5 min",
            "Automação equivalente": "nenhuma — a suite mocka o desafio",
            "Só o manual cobre": "TOTP real — item pendente no STATE.md"
          },
          "notas": [],
          "grupos": [
            {
              "id": "g1",
              "tituloHtml": null,
              "tela": null,
              "implicito": true,
              "passos": [
                {
                  "key": "ROTEIRO-01/J-011.W/P1",
                  "id": "P1",
                  "hash": "c63f4a9a",
                  "textoHtml": "Em <code>/login</code>, informar e-mail e senha corretos de <code>cliente-a</code>.",
                  "comoHtml": "<code>cliente-a@sep.test</code> / <code>jornada-tomador-sep-2026</code> (tabela do §6.1 do <a href=\"./ROTEIRO-00-AMBIENTE-E-MASSA.md\" rel=\"noreferrer\"><code>ROTEIRO-00</code></a>). Como esta persona tem TOTP, o login <strong>não entra direto</strong>: cai numa segunda tela, <strong>Verificação em duas etapas</strong>. Manter o DevTools aberto na aba <strong>Network</strong> desde já — o P2 depende de ver a resposta desta chamada.",
                  "textoBusca": "em /login, informar e-mail e senha corretos de cliente-a. cliente-a@sep.test / jornada-tomador-sep-2026 (tabela do §6.1 do roteiro-00). como esta persona tem totp, o login não entra direto: cai numa segunda tela, verificação em duas etapas. manter o devtools aberto na aba network desde já — o p2 depende de ver a resposta desta chamada.",
                  "esperadoHtml": "resposta com <code>mfaRequired: true</code> e <code>mfaChallengeId</code>; <strong><code>accessToken</code> vem <code>null</code></strong>. Vai para <code>/login/verify-totp</code>.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 329,
                  "ordem": 1
                },
                {
                  "key": "ROTEIRO-01/J-011.W/P2",
                  "id": "P2",
                  "hash": "69a55250",
                  "textoHtml": "Conferir na aba de rede que nenhuma sessão completa foi emitida.",
                  "comoHtml": "Na aba <strong>Network</strong>, clicar na chamada <code>login</code> e abrir a aba <strong>Response</strong>. O ponto é o campo <code>accessToken</code>: ele tem de vir <code>null</code>. Se vier preenchido, a senha sozinha já teria dado acesso e o segundo fator seria decorativo — ocorrência grave.",
                  "textoBusca": "conferir na aba de rede que nenhuma sessão completa foi emitida. na aba network, clicar na chamada login e abrir a aba response. o ponto é o campo accesstoken: ele tem de vir null. se vier preenchido, a senha sozinha já teria dado acesso e o segundo fator seria decorativo — ocorrência grave.",
                  "esperadoHtml": "senha válida <strong>sozinha</strong> não autentica.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 337,
                  "ordem": 2
                },
                {
                  "key": "ROTEIRO-01/J-011.W/P3",
                  "id": "P3",
                  "hash": "7735dad7",
                  "textoHtml": "Informar um código TOTP <strong>incorreto</strong>.",
                  "comoHtml": "No campo <strong>Código</strong>, digitar seis dígitos quaisquer (<code>000000</code> serve) e clicar em <strong>Verificar</strong>. Erro é o resultado esperado. <strong>Não repita mais de duas vezes</strong>: tentativas inválidas contam para o lockout (§6.4 do ROTEIRO-00) e podem travar a persona por 30 minutos no meio do roteiro.",
                  "textoBusca": "informar um código totp incorreto. no campo código, digitar seis dígitos quaisquer (000000 serve) e clicar em verificar. erro é o resultado esperado. não repita mais de duas vezes: tentativas inválidas contam para o lockout (§6.4 do roteiro-00) e podem travar a persona por 30 minutos no meio do roteiro.",
                  "esperadoHtml": "erro; permanece na tela; não autentica.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 342,
                  "ordem": 3
                },
                {
                  "key": "ROTEIRO-01/J-011.W/P4",
                  "id": "P4",
                  "hash": "72ac3e73",
                  "textoHtml": "Informar o código TOTP corrente do autenticador.",
                  "comoHtml": "Ler o código de 6 dígitos <strong>da conta <code>cliente-a</code></strong> no autenticador — se você cadastrou mais de uma conta, confira o nome antes. Como o código muda a cada 30 segundos, se ele estiver quase virando, espere o próximo para ter tempo de digitar.",
                  "textoBusca": "informar o código totp corrente do autenticador. ler o código de 6 dígitos da conta cliente-a no autenticador — se você cadastrou mais de uma conta, confira o nome antes. como o código muda a cada 30 segundos, se ele estiver quase virando, espere o próximo para ter tempo de digitar.",
                  "esperadoHtml": "login conclui; entra em <code>/app/dashboard</code>.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 348,
                  "ordem": 4
                },
                {
                  "key": "ROTEIRO-01/J-011.W/P5",
                  "id": "P5",
                  "hash": "3879a0fe",
                  "textoHtml": "Conferir o menu lateral.",
                  "comoHtml": "De novo um teste de <strong>ausência</strong>. O menu deve mostrar os grupos <strong>Jornadas</strong> e <strong>Conta</strong>. Não pode haver <strong>Operação</strong> (com Backoffice, Pix, Chaves Pix, Matching de credoras) nem <strong>Administração</strong> — são de perfis internos, e <code>cliente-a</code> é cliente.",
                  "textoBusca": "conferir o menu lateral. de novo um teste de ausência. o menu deve mostrar os grupos jornadas e conta. não pode haver operação (com backoffice, pix, chaves pix, matching de credoras) nem administração — são de perfis internos, e cliente-a é cliente.",
                  "esperadoHtml": "grupos Jornadas e Conta. <strong>Sem</strong> grupo Operação (Backoffice, Pix, Chaves Pix, Matching) e <strong>sem</strong> Administração — <code>cliente-a</code> é CLIENTE.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 353,
                  "ordem": 5
                }
              ]
            }
          ],
          "assercoes": [],
          "linha": 313,
          "stats": {
            "passos": 5,
            "na": 0,
            "assercoes": 0
          }
        },
        {
          "key": "ROTEIRO-01/J-012.W-N1",
          "id": "J-012.W-N1",
          "escopoId": "J-012.W-N1",
          "kind": "jornada",
          "nivel": 3,
          "titulo": "Login inválido até o lockout",
          "anchor": "j-012w-n1---login-invlido-at-o-lockout",
          "ordem": 8,
          "meta": [
            {
              "chave": "ID",
              "texto": "J-012.W-N1",
              "html": "<code>J-012.W-N1</code>"
            },
            {
              "chave": "Tipo",
              "texto": "Negativa — resistência a força bruta",
              "html": "Negativa — resistência a força bruta"
            },
            {
              "chave": "Persona",
              "texto": "cliente-b",
              "html": "<code>cliente-b</code>"
            },
            {
              "chave": "Superfície",
              "texto": "Web",
              "html": "Web"
            },
            {
              "chave": "Vetor",
              "texto": "Tentativas repetidas de senha inválida",
              "html": "Tentativas repetidas de senha inválida"
            },
            {
              "chave": "Comportamento seguro esperado",
              "texto": "Bloqueio após 5 tentativas; erro que não revela se o usuário existe",
              "html": "Bloqueio após 5 tentativas; erro que não revela se o usuário existe"
            },
            {
              "chave": "Pré-condições",
              "texto": "PRE-01 PRE-02 PRE-04 PRE-09",
              "html": "<code>PRE-01</code> <code>PRE-02</code> <code>PRE-04</code> <code>PRE-09</code>"
            },
            {
              "chave": "Política",
              "texto": "5 tentativas / janela de 15 min / bloqueio de 30 min",
              "html": "5 tentativas / janela de 15 min / bloqueio de 30 min"
            }
          ],
          "metaIndex": {
            "ID": "J-012.W-N1",
            "Tipo": "Negativa — resistência a força bruta",
            "Persona": "cliente-b",
            "Superfície": "Web",
            "Vetor": "Tentativas repetidas de senha inválida",
            "Comportamento seguro esperado": "Bloqueio após 5 tentativas; erro que não revela se o usuário existe",
            "Pré-condições": "PRE-01 PRE-02 PRE-04 PRE-09",
            "Política": "5 tentativas / janela de 15 min / bloqueio de 30 min"
          },
          "notas": [
            "<strong>Esta jornada bloqueia a persona por 30 minutos.</strong> Execute-a por último na sessão, ou tenha o procedimento de destravamento do <a href=\"./ROTEIRO-00-AMBIENTE-E-MASSA.md\" rel=\"noreferrer\"><code>ROTEIRO-00</code></a> §7 <strong>D2</strong> a mão."
          ],
          "grupos": [
            {
              "id": "g1",
              "tituloHtml": null,
              "tela": null,
              "implicito": true,
              "passos": [
                {
                  "key": "ROTEIRO-01/J-012.W-N1/P1",
                  "id": "P1",
                  "hash": "07ec1b68",
                  "textoHtml": "Tentar login com e-mail <strong>inexistente</strong>.",
                  "comoHtml": "Usar algo que certamente não existe, como <code>naoexiste@sep.test</code>, com qualquer senha. O que se verifica é a <strong>mensagem</strong>: ela não pode dizer &quot;usuário não encontrado&quot;. Se dissesse, um atacante descobriria quais e-mails têm conta só testando a tela. Compare mentalmente com a mensagem que vai aparecer no P2 — têm de ser iguais.",
                  "textoBusca": "tentar login com e-mail inexistente. usar algo que certamente não existe, como naoexiste@sep.test, com qualquer senha. o que se verifica é a mensagem: ela não pode dizer \"usuário não encontrado\". se dissesse, um atacante descobriria quais e-mails têm conta só testando a tela. compare mentalmente com a mensagem que vai aparecer no p2 — têm de ser iguais.",
                  "esperadoHtml": "erro genérico. <strong>Não</strong> revela que o usuário não existe.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 381,
                  "ordem": 1
                },
                {
                  "key": "ROTEIRO-01/J-012.W-N1/P2",
                  "id": "P2",
                  "hash": "bd801006",
                  "textoHtml": "Tentar login de <code>cliente-b</code> com senha inválida, 4 vezes.",
                  "comoHtml": "<code>cliente-b@sep.test</code> com uma senha errada qualquer, <strong>exatamente 4 vezes</strong> — contar. A quinta é o passo seguinte, e é ela que dispara o bloqueio. A mensagem tem de ser a mesma do P1: o sistema não distingue &quot;usuário não existe&quot; de &quot;senha errada&quot;.",
                  "textoBusca": "tentar login de cliente-b com senha inválida, 4 vezes. cliente-b@sep.test com uma senha errada qualquer, exatamente 4 vezes — contar. a quinta é o passo seguinte, e é ela que dispara o bloqueio. a mensagem tem de ser a mesma do p1: o sistema não distingue \"usuário não existe\" de \"senha errada\".",
                  "esperadoHtml": "mesmo erro genérico a cada tentativa.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 387,
                  "ordem": 2
                },
                {
                  "key": "ROTEIRO-01/J-012.W-N1/P3",
                  "id": "P3",
                  "hash": "82663c70",
                  "textoHtml": "Quinta tentativa inválida.",
                  "comoHtml": "Mais uma vez com senha errada. Agora a tela muda: em vez do erro no formulário, o navegador vai para uma página própria, <strong>Conta bloqueada temporariamente</strong>, com o número <code>423</code> em destaque. Esse 423 é o código HTTP de &quot;recurso trancado&quot;.",
                  "textoBusca": "quinta tentativa inválida. mais uma vez com senha errada. agora a tela muda: em vez do erro no formulário, o navegador vai para uma página própria, conta bloqueada temporariamente, com o número 423 em destaque. esse 423 é o código http de \"recurso trancado\".",
                  "esperadoHtml": "conta bloqueada; o web navega para <code>/account-locked</code> (o <code>error.interceptor</code> trata o HTTP <strong>423</strong>).",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 392,
                  "ordem": 3
                },
                {
                  "key": "ROTEIRO-01/J-012.W-N1/P4",
                  "id": "P4",
                  "hash": "aa9abb40",
                  "textoHtml": "Tentar login com a senha <strong>correta</strong> durante o bloqueio.",
                  "comoHtml": "Voltar ao login e entrar com <code>cliente-b@sep.test</code> / <code>jornada-ownership-sep-2026</code> — a senha certa desta vez. Continuar bloqueado é o comportamento correto: se a senha certa destravasse, bastaria o atacante acertar para anular o bloqueio.",
                  "textoBusca": "tentar login com a senha correta durante o bloqueio. voltar ao login e entrar com cliente-b@sep.test / jornada-ownership-sep-2026 — a senha certa desta vez. continuar bloqueado é o comportamento correto: se a senha certa destravasse, bastaria o atacante acertar para anular o bloqueio.",
                  "esperadoHtml": "continua bloqueado. A senha certa não destrava antes do prazo.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 398,
                  "ordem": 4
                },
                {
                  "key": "ROTEIRO-01/J-012.W-N1/P5",
                  "id": "P5",
                  "hash": "2b2663c8",
                  "textoHtml": "Conferir o audit log:",
                  "comoHtml": "Terminal do banco. Procurar na saída os eventos das tentativas e do bloqueio que você acabou de provocar. Tentativa de invasão sem trilha registrada é defeito de compliance, não detalhe. Terminada a jornada, <code>cliente-b</code> fica travado por 30 minutos — para destravar antes, o <strong>D2</strong> do <a href=\"./ROTEIRO-00-AMBIENTE-E-MASSA.md\" rel=\"noreferrer\"><code>ROTEIRO-00</code></a> §7.",
                  "textoBusca": "conferir o audit log: terminal do banco. procurar na saída os eventos das tentativas e do bloqueio que você acabou de provocar. tentativa de invasão sem trilha registrada é defeito de compliance, não detalhe. terminada a jornada, cliente-b fica travado por 30 minutos — para destravar antes, o d2 do roteiro-00 §7.",
                  "esperadoHtml": "tentativas e bloqueio registrados.",
                  "blocos": [
                    {
                      "tipo": "codigo",
                      "lang": "bash",
                      "regiao": "como",
                      "conteudo": "docker exec sep-postgres psql -U sep -d sep_dev \\\n  -c \"SELECT tipo, data_evento FROM audit_log_seguranca ORDER BY data_evento DESC LIMIT 10;\""
                    }
                  ],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 404,
                  "ordem": 5
                }
              ]
            }
          ],
          "assercoes": [],
          "linha": 362,
          "stats": {
            "passos": 5,
            "na": 0,
            "assercoes": 0
          }
        },
        {
          "key": "ROTEIRO-01/J-020.W",
          "id": "J-020.W",
          "escopoId": "J-020.W",
          "kind": "jornada",
          "nivel": 3,
          "titulo": "Consultar o próprio perfil",
          "anchor": "j-020w---consultar-o-prprio-perfil",
          "ordem": 9,
          "meta": [
            {
              "chave": "ID",
              "texto": "J-020.W",
              "html": "<code>J-020.W</code>"
            },
            {
              "chave": "Tipo",
              "texto": "Positiva",
              "html": "Positiva"
            },
            {
              "chave": "Persona",
              "texto": "cliente-a",
              "html": "<code>cliente-a</code>"
            },
            {
              "chave": "Superfície",
              "texto": "Web",
              "html": "Web"
            },
            {
              "chave": "Pré-condições",
              "texto": "PRE-01 PRE-02 PRE-04 PRE-07",
              "html": "<code>PRE-01</code> <code>PRE-02</code> <code>PRE-04</code> <code>PRE-07</code>"
            },
            {
              "chave": "Endpoints tocados",
              "texto": "GET /auth/me",
              "html": "<code>GET /auth/me</code>"
            },
            {
              "chave": "Automação equivalente",
              "texto": "golden-path.spec.ts",
              "html": "<a href=\"../../../sep-app/e2e/golden-path.spec.ts\" rel=\"noreferrer\"><code>golden-path.spec.ts</code></a>"
            }
          ],
          "metaIndex": {
            "ID": "J-020.W",
            "Tipo": "Positiva",
            "Persona": "cliente-a",
            "Superfície": "Web",
            "Pré-condições": "PRE-01 PRE-02 PRE-04 PRE-07",
            "Endpoints tocados": "GET /auth/me",
            "Automação equivalente": "golden-path.spec.ts"
          },
          "notas": [],
          "grupos": [
            {
              "id": "g1",
              "tituloHtml": null,
              "tela": null,
              "implicito": true,
              "passos": [
                {
                  "key": "ROTEIRO-01/J-020.W/P1",
                  "id": "P1",
                  "hash": "f74de3dc",
                  "textoHtml": "Autenticado, abrir <strong>Meu perfil</strong> (<code>/app/profile</code>).",
                  "comoHtml": "Logado como <code>cliente-a</code>, abrir o menu lateral, grupo <strong>Conta</strong>, item <strong>Meu perfil</strong>. A tela tem dois cards: <strong>Identificação</strong> (E-mail, Perfil, ID) e <strong>Auditoria</strong> (Criado em, Modificado em, Criado por, Modificado por).",
                  "textoBusca": "autenticado, abrir meu perfil (/app/profile). logado como cliente-a, abrir o menu lateral, grupo conta, item meu perfil. a tela tem dois cards: identificação (e-mail, perfil, id) e auditoria (criado em, modificado em, criado por, modificado por).",
                  "esperadoHtml": "e-mail, perfil, identificador e dados de auditoria batem com <code>/auth/me</code>.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 431,
                  "ordem": 1
                },
                {
                  "key": "ROTEIRO-01/J-020.W/P2",
                  "id": "P2",
                  "hash": "b002e670",
                  "textoHtml": "Recarregar a página.",
                  "comoHtml": "<code>F5</code>. O ponto é que a sessão sobreviva ao recarregamento: se a tela devolver você ao login, o token não está sendo persistido corretamente.",
                  "textoBusca": "recarregar a página. f5. o ponto é que a sessão sobreviva ao recarregamento: se a tela devolver você ao login, o token não está sendo persistido corretamente.",
                  "esperadoHtml": "dados reaparecem sem sair da tela e sem novo login.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 436,
                  "ordem": 2
                },
                {
                  "key": "ROTEIRO-01/J-020.W/P3",
                  "id": "P3",
                  "hash": "ed1be94c",
                  "textoHtml": "Conferir na aba de rede quais endpoints a tela chama.",
                  "comoHtml": "Na aba <strong>Network</strong>, filtrar por <code>api</code> e recarregar. Ler a lista de chamadas: a tela deve buscar só o próprio usuário. Se aparecer uma chamada que <strong>lista</strong> usuários (<code>/api/v1/usuarios</code> sem id), a tela estaria pedindo dados de todo mundo para mostrar os seus — vazamento potencial, e ocorrência.",
                  "textoBusca": "conferir na aba de rede quais endpoints a tela chama. na aba network, filtrar por api e recarregar. ler a lista de chamadas: a tela deve buscar só o próprio usuário. se aparecer uma chamada que lista usuários (/api/v1/usuarios sem id), a tela estaria pedindo dados de todo mundo para mostrar os seus — vazamento potencial, e ocorrência.",
                  "esperadoHtml": "apenas endpoints de perfil próprio. <strong>Nenhuma</strong> chamada a endpoint administrativo (<code>/api/v1/usuarios</code> lista) para exibir o próprio perfil.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 440,
                  "ordem": 3
                }
              ]
            }
          ],
          "assercoes": [],
          "linha": 417,
          "stats": {
            "passos": 3,
            "na": 0,
            "assercoes": 0
          }
        },
        {
          "key": "ROTEIRO-01/J-022.W",
          "id": "J-022.W",
          "escopoId": "J-022.W",
          "kind": "jornada",
          "nivel": 3,
          "titulo": "Alterar senha com step-up",
          "anchor": "j-022w---alterar-senha-com-step-up",
          "ordem": 10,
          "meta": [
            {
              "chave": "ID",
              "texto": "J-022.W",
              "html": "<code>J-022.W</code>"
            },
            {
              "chave": "Tipo",
              "texto": "Positiva",
              "html": "Positiva"
            },
            {
              "chave": "Persona",
              "texto": "cliente-a — com TOTP habilitado",
              "html": "<code>cliente-a</code> — <strong>com</strong> TOTP habilitado"
            },
            {
              "chave": "Superfície",
              "texto": "Web",
              "html": "Web"
            },
            {
              "chave": "Pré-condições",
              "texto": "PRE-01 PRE-02 PRE-04 PRE-07 PRE-10",
              "html": "<code>PRE-01</code> <code>PRE-02</code> <code>PRE-04</code> <code>PRE-07</code> <code>PRE-10</code>"
            },
            {
              "chave": "Endpoints tocados",
              "texto": "POST /auth/step-up/initiate, POST /auth/step-up/complete, PATCH /usuarios/{id}/senha",
              "html": "<code>POST /auth/step-up/initiate</code>, <code>POST /auth/step-up/complete</code>, <code>PATCH /usuarios/{id}/senha</code>"
            },
            {
              "chave": "Step-up",
              "texto": "@RequireStepUp legado — com MFA habilitado, exige token",
              "html": "<code>@RequireStepUp</code> legado — com MFA habilitado, <strong>exige</strong> token"
            },
            {
              "chave": "Duração",
              "texto": "8 min",
              "html": "8 min"
            },
            {
              "chave": "Automação equivalente",
              "texto": "golden-path.spec.ts",
              "html": "<a href=\"../../../sep-app/e2e/golden-path.spec.ts\" rel=\"noreferrer\"><code>golden-path.spec.ts</code></a>"
            },
            {
              "chave": "Só o manual cobre",
              "texto": "TOTP real no desafio de step-up",
              "html": "TOTP real no desafio de step-up"
            }
          ],
          "metaIndex": {
            "ID": "J-022.W",
            "Tipo": "Positiva",
            "Persona": "cliente-a — com TOTP habilitado",
            "Superfície": "Web",
            "Pré-condições": "PRE-01 PRE-02 PRE-04 PRE-07 PRE-10",
            "Endpoints tocados": "POST /auth/step-up/initiate, POST /auth/step-up/complete, PATCH /usuarios/{id}/senha",
            "Step-up": "@RequireStepUp legado — com MFA habilitado, exige token",
            "Duração": "8 min",
            "Automação equivalente": "golden-path.spec.ts",
            "Só o manual cobre": "TOTP real no desafio de step-up"
          },
          "notas": [],
          "grupos": [
            {
              "id": "g2",
              "tituloHtml": "Tela <code>/app/profile/change-password</code>",
              "tela": "/app/profile/change-password",
              "implicito": false,
              "passos": [
                {
                  "key": "ROTEIRO-01/J-022.W/P1",
                  "id": "P1",
                  "hash": "777e7506",
                  "textoHtml": "Abrir <strong>Alterar senha</strong> e informar a senha atual <strong>incorreta</strong> e uma nova senha válida.",
                  "comoHtml": "Em <strong>Meu perfil</strong>, clicar em <strong>Alterar senha</strong>. A tela tem três campos: <strong>Senha atual</strong>, <strong>Nova senha</strong> e <strong>Confirme a nova senha</strong>. Aqui, errar a senha atual de propósito e preencher as outras duas com <code>jornada-tomador-sep-2026-v2</code>. Clicar em <strong>Salvar nova senha</strong>. Repare que você <strong>continua logado</strong> depois do erro — errar a senha atual não pode derrubar a sessão.",
                  "textoBusca": "abrir alterar senha e informar a senha atual incorreta e uma nova senha válida. em meu perfil, clicar em alterar senha. a tela tem três campos: senha atual, nova senha e confirme a nova senha. aqui, errar a senha atual de propósito e preencher as outras duas com jornada-tomador-sep-2026-v2. clicar em salvar nova senha. repare que você continua logado depois do erro — errar a senha atual não pode derrubar a sessão.",
                  "esperadoHtml": "erro de validação; a sessão <strong>não</strong> é derrubada; a senha não muda.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 469,
                  "ordem": 1
                },
                {
                  "key": "ROTEIRO-01/J-022.W/P2",
                  "id": "P2",
                  "hash": "34d49a23",
                  "textoHtml": "Informar a senha atual correta e a nova senha <code>123456</code>.",
                  "comoHtml": "Agora com <code>jornada-tomador-sep-2026</code> no campo <strong>Senha atual</strong>, e <code>123456</code> nos dois campos de nova senha. A própria tela avisa a regra abaixo do campo: mínimo 12 caracteres ou passphrase de 4+ palavras. Se <code>123456</code> for aceito, a superfície está em MSW — conferir <code>PRE-04</code>.",
                  "textoBusca": "informar a senha atual correta e a nova senha 123456. agora com jornada-tomador-sep-2026 no campo senha atual, e 123456 nos dois campos de nova senha. a própria tela avisa a regra abaixo do campo: mínimo 12 caracteres ou passphrase de 4+ palavras. se 123456 for aceito, a superfície está em msw — conferir pre-04.",
                  "esperadoHtml": "recusado pela política (12+ chars ou passphrase 4+ palavras).",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 476,
                  "ordem": 2
                },
                {
                  "key": "ROTEIRO-01/J-022.W/P3",
                  "id": "P3",
                  "hash": "139b30fa",
                  "textoHtml": "Informar a senha atual correta e a nova senha <code>jornada-tomador-sep-2026-v2</code>.",
                  "comoHtml": "Preencher os três campos corretamente e enviar. <strong>A senha ainda não mudou neste ponto</strong> — a tela leva você para uma etapa de confirmação adicional, que é o step-up. É exatamente isso que a jornada testa: operação sensível não se completa só com a sessão.",
                  "textoBusca": "informar a senha atual correta e a nova senha jornada-tomador-sep-2026-v2. preencher os três campos corretamente e enviar. a senha ainda não mudou neste ponto — a tela leva você para uma etapa de confirmação adicional, que é o step-up. é exatamente isso que a jornada testa: operação sensível não se completa só com a sessão.",
                  "esperadoHtml": "vai para o desafio de step-up (<code>/app/step-up</code>); a senha ainda <strong>não</strong> mudou.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 482,
                  "ordem": 3
                },
                {
                  "key": "ROTEIRO-01/J-022.W/P4",
                  "id": "P4",
                  "hash": "0fc38253",
                  "textoHtml": "Informar o código TOTP corrente.",
                  "comoHtml": "A tela <strong>Confirmação adicional</strong> tem um botão <strong>Iniciar</strong>; depois dele aparece o campo <strong>Código TOTP ou backup code</strong>. Digitar o código da conta <code>cliente-a</code> e clicar em <strong>Confirmar</strong>. Guarde um backup code para a <code>J-031.W</code> — aqui use o TOTP mesmo.",
                  "textoBusca": "informar o código totp corrente. a tela confirmação adicional tem um botão iniciar; depois dele aparece o campo código totp ou backup code. digitar o código da conta cliente-a e clicar em confirmar. guarde um backup code para a j-031.w — aqui use o totp mesmo.",
                  "esperadoHtml": "volta para a tela de origem preservando o contexto.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 488,
                  "ordem": 4
                },
                {
                  "key": "ROTEIRO-01/J-022.W/P5",
                  "id": "P5",
                  "hash": "a79a8e2a",
                  "textoHtml": "Confirmar a alteração.",
                  "comoHtml": "De volta à tela de senha, os campos devem estar preservados; confirmar. Com o DevTools na aba <strong>Network</strong>, clicar na chamada <code>senha</code> e conferir na aba <strong>Headers</strong> que existe um header <code>X-Step-Up-Token</code>. É esse header que carrega a prova do step-up.",
                  "textoBusca": "confirmar a alteração. de volta à tela de senha, os campos devem estar preservados; confirmar. com o devtools na aba network, clicar na chamada senha e conferir na aba headers que existe um header x-step-up-token. é esse header que carrega a prova do step-up.",
                  "esperadoHtml": "<code>PATCH /usuarios/{id}/senha</code> sai com o header <code>X-Step-Up-Token</code>; sucesso.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 493,
                  "ordem": 5
                },
                {
                  "key": "ROTEIRO-01/J-022.W/P6",
                  "id": "P6",
                  "hash": "2eaf71f7",
                  "textoHtml": "Sair e autenticar com a senha <strong>antiga</strong>.",
                  "comoHtml": "<strong>Sair</strong> (botão no topo direito) e tentar entrar com <code>jornada-tomador-sep-2026</code>. Falhar é o esperado. <strong>No máximo duas tentativas</strong> — o lockout conta.",
                  "textoBusca": "sair e autenticar com a senha antiga. sair (botão no topo direito) e tentar entrar com jornada-tomador-sep-2026. falhar é o esperado. no máximo duas tentativas — o lockout conta.",
                  "esperadoHtml": "falha.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 498,
                  "ordem": 6
                },
                {
                  "key": "ROTEIRO-01/J-022.W/P7",
                  "id": "P7",
                  "hash": "b3155404",
                  "textoHtml": "Autenticar com a senha <strong>nova</strong>.",
                  "comoHtml": "Entrar com <code>jornada-tomador-sep-2026-v2</code> e o código TOTP.",
                  "textoBusca": "autenticar com a senha nova. entrar com jornada-tomador-sep-2026-v2 e o código totp.",
                  "esperadoHtml": "sucesso (com o desafio TOTP normal do login).",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 502,
                  "ordem": 7
                },
                {
                  "key": "ROTEIRO-01/J-022.W/P8",
                  "id": "P8",
                  "hash": "3e442d71",
                  "textoHtml": "Conferir o audit log.",
                  "comoHtml": "Terminal do banco, mesma consulta do audit log usada antes.",
                  "textoBusca": "conferir o audit log. terminal do banco, mesma consulta do audit log usada antes.",
                  "esperadoHtml": "evento de senha alterada registrado.",
                  "blocos": [
                    {
                      "tipo": "codigo",
                      "lang": "bash",
                      "regiao": "como",
                      "conteudo": "docker exec sep-postgres psql -U sep -d sep_dev \\\n  -c \"SELECT tipo, data_evento FROM audit_log_seguranca ORDER BY data_evento DESC LIMIT 5;\""
                    }
                  ],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 505,
                  "ordem": 8
                }
              ]
            }
          ],
          "assercoes": [
            {
              "key": "ROTEIRO-01/J-022.W/#55c73e52",
              "id": null,
              "hash": "b6578a57",
              "textoHtml": "Senha alterada exatamente uma vez",
              "comoHtml": null,
              "textoBusca": "senha alterada exatamente uma vez",
              "esperadoHtml": null,
              "blocos": [],
              "na": false,
              "naMotivo": null,
              "marcadoNaFonte": false,
              "linha": 515,
              "ordem": 1
            },
            {
              "key": "ROTEIRO-01/J-022.W/#3f0f0766",
              "id": null,
              "hash": "c9d5587a",
              "textoHtml": "Atualizar a senha de <code>cliente-a</code> na sua folha de credenciais desta execução",
              "comoHtml": "<strong>A partir daqui a senha de <code>cliente-a</code> é <code>jornada-tomador-sep-2026-v2</code></strong>, e não mais a da tabela do ROTEIRO-00. Anotar isso no seu rascunho da execução: as jornadas seguintes vão pedir &quot;a senha de <code>cliente-a</code>&quot; e é esta a valer.",
              "textoBusca": "atualizar a senha de cliente-a na sua folha de credenciais desta execução a partir daqui a senha de cliente-a é jornada-tomador-sep-2026-v2, e não mais a da tabela do roteiro-00. anotar isso no seu rascunho da execução: as jornadas seguintes vão pedir \"a senha de cliente-a\" e é esta a valer.",
              "esperadoHtml": null,
              "blocos": [],
              "na": false,
              "naMotivo": null,
              "marcadoNaFonte": false,
              "linha": 516,
              "ordem": 2
            }
          ],
          "linha": 450,
          "stats": {
            "passos": 8,
            "na": 0,
            "assercoes": 2
          }
        },
        {
          "key": "ROTEIRO-01/J-022.W-N1",
          "id": "J-022.W-N1",
          "escopoId": "J-022.W-N1",
          "kind": "jornada",
          "nivel": 3,
          "titulo": "Alterar senha sem MFA usa o bypass legado",
          "anchor": "j-022w-n1---alterar-senha-sem-mfa-usa-o-bypass-legado",
          "ordem": 11,
          "meta": [
            {
              "chave": "ID",
              "texto": "J-022.W-N1",
              "html": "<code>J-022.W-N1</code>"
            },
            {
              "chave": "Tipo",
              "texto": "Positiva — documenta comportamento deliberado",
              "html": "Positiva — documenta comportamento deliberado"
            },
            {
              "chave": "Jornada pai",
              "texto": "J-022.W",
              "html": "<a href=\"#j-022w---alterar-senha-com-step-up\" rel=\"noreferrer\"><code>J-022.W</code></a>"
            },
            {
              "chave": "Persona",
              "texto": "cliente-b — sem TOTP",
              "html": "<code>cliente-b</code> — <strong>sem</strong> TOTP"
            },
            {
              "chave": "Superfície",
              "texto": "Web",
              "html": "Web"
            },
            {
              "chave": "Pré-condições",
              "texto": "PRE-01 PRE-02 PRE-04 PRE-09",
              "html": "<code>PRE-01</code> <code>PRE-02</code> <code>PRE-04</code> <code>PRE-09</code>"
            },
            {
              "chave": "Nota",
              "texto": "@RequireStepUp legado faz bypass quando o usuário não tem MFA — compatibilidade com usuários pré-MFA. Isto não vale para @RequireStepUpEstrito (ver ROTEIRO-04).",
              "html": "<code>@RequireStepUp</code> <strong>legado</strong> faz bypass quando o usuário não tem MFA — compatibilidade com usuários pré-MFA. Isto <strong>não</strong> vale para <code>@RequireStepUpEstrito</code> (ver <a href=\"./ROTEIRO-04-CREDITO-FORMALIZACAO.md\" rel=\"noreferrer\"><code>ROTEIRO-04</code></a>)."
            }
          ],
          "metaIndex": {
            "ID": "J-022.W-N1",
            "Tipo": "Positiva — documenta comportamento deliberado",
            "Jornada pai": "J-022.W",
            "Persona": "cliente-b — sem TOTP",
            "Superfície": "Web",
            "Pré-condições": "PRE-01 PRE-02 PRE-04 PRE-09",
            "Nota": "@RequireStepUp legado faz bypass quando o usuário não tem MFA — compatibilidade com usuários pré-MFA. Isto não vale para @RequireStepUpEstrito (ver ROTEIRO-04)."
          },
          "notas": [],
          "grupos": [
            {
              "id": "g1",
              "tituloHtml": null,
              "tela": null,
              "implicito": true,
              "passos": [
                {
                  "key": "ROTEIRO-01/J-022.W-N1/P1",
                  "id": "P1",
                  "hash": "3ce93b89",
                  "textoHtml": "Como <code>cliente-b</code>, alterar a senha informando a senha atual correta.",
                  "comoHtml": "Entrar como <code>cliente-b@sep.test</code> / <code>jornada-ownership-sep-2026</code> e repetir o caminho da <a href=\"#j-022w---alterar-senha-com-step-up\" rel=\"noreferrer\"><code>J-022.W</code></a>: <strong>Meu perfil</strong> &gt; <strong>Alterar senha</strong>, senha atual correta e nova senha <code>jornada-ownership-sep-2026-v2</code>. <strong>Se <code>cliente-b</code> ainda estiver bloqueado</strong> pela <code>J-012.W-N1</code>, destravar pelo <strong>D2</strong> do ROTEIRO-00 ou esperar os 30 minutos. A diferença para a J-022.W é o que <strong>não</strong> acontece: não aparece tela de confirmação adicional. Anotar a senha nova.",
                  "textoBusca": "como cliente-b, alterar a senha informando a senha atual correta. entrar como cliente-b@sep.test / jornada-ownership-sep-2026 e repetir o caminho da j-022.w: meu perfil > alterar senha, senha atual correta e nova senha jornada-ownership-sep-2026-v2. se cliente-b ainda estiver bloqueado pela j-012.w-n1, destravar pelo d2 do roteiro-00 ou esperar os 30 minutos. a diferença para a j-022.w é o que não acontece: não aparece tela de confirmação adicional. anotar a senha nova.",
                  "esperadoHtml": "conclui <strong>sem</strong> desafio de step-up. Este é o comportamento esperado, não um defeito.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 537,
                  "ordem": 1
                },
                {
                  "key": "ROTEIRO-01/J-022.W-N1/P2",
                  "id": "P2",
                  "hash": "d55b493a",
                  "textoHtml": "Conferir que o mesmo bypass <strong>não</strong> existe nas operações financeiras.",
                  "comoHtml": "Este passo <strong>não se executa aqui</strong> — ele é uma anotação de rastreio. A prova está na <a href=\"./ROTEIRO-04-CREDITO-FORMALIZACAO.md#j-070w-n1---aceite-negado-para-usuário-sem-mfa\" rel=\"noreferrer\"><code>J-070.W-N1</code></a> do ROTEIRO-04. Marcar quando aquela jornada tiver sido executada; se você ainda não chegou lá, deixar em branco e voltar depois.",
                  "textoBusca": "conferir que o mesmo bypass não existe nas operações financeiras. este passo não se executa aqui — ele é uma anotação de rastreio. a prova está na j-070.w-n1 do roteiro-04. marcar quando aquela jornada tiver sido executada; se você ainda não chegou lá, deixar em branco e voltar depois.",
                  "esperadoHtml": "coberto por <a href=\"./ROTEIRO-04-CREDITO-FORMALIZACAO.md\" rel=\"noreferrer\"><code>ROTEIRO-04</code></a> — sem MFA, o aceite de contrato retorna 403.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 546,
                  "ordem": 2
                }
              ]
            }
          ],
          "assercoes": [],
          "linha": 523,
          "stats": {
            "passos": 2,
            "na": 0,
            "assercoes": 0
          }
        },
        {
          "key": "ROTEIRO-01/J-030.W",
          "id": "J-030.W",
          "escopoId": "J-030.W",
          "kind": "jornada",
          "nivel": 3,
          "titulo": "Habilitar MFA TOTP",
          "anchor": "j-030w---habilitar-mfa-totp",
          "ordem": 12,
          "meta": [
            {
              "chave": "ID",
              "texto": "J-030.W",
              "html": "<code>J-030.W</code>"
            },
            {
              "chave": "Tipo",
              "texto": "Positiva",
              "html": "Positiva"
            },
            {
              "chave": "Persona",
              "texto": "Qualquer usuário sem TOTP",
              "html": "Qualquer usuário sem TOTP"
            },
            {
              "chave": "Superfície",
              "texto": "Web — o enrollment só existe aqui; o mobile apenas verifica",
              "html": "Web — <strong>o enrollment só existe aqui</strong>; o mobile apenas verifica"
            },
            {
              "chave": "Pré-condições",
              "texto": "PRE-01 PRE-02 PRE-04 PRE-10",
              "html": "<code>PRE-01</code> <code>PRE-02</code> <code>PRE-04</code> <code>PRE-10</code>"
            },
            {
              "chave": "Endpoints tocados",
              "texto": "POST /auth/totp/setup, POST /auth/totp/confirm",
              "html": "<code>POST /auth/totp/setup</code>, <code>POST /auth/totp/confirm</code>"
            },
            {
              "chave": "Automação equivalente",
              "texto": "nenhuma",
              "html": "nenhuma"
            },
            {
              "chave": "Só o manual cobre",
              "texto": "QR real, autenticador real, backup codes exibidos uma única vez",
              "html": "QR real, autenticador real, backup codes exibidos uma única vez"
            }
          ],
          "metaIndex": {
            "ID": "J-030.W",
            "Tipo": "Positiva",
            "Persona": "Qualquer usuário sem TOTP",
            "Superfície": "Web — o enrollment só existe aqui; o mobile apenas verifica",
            "Pré-condições": "PRE-01 PRE-02 PRE-04 PRE-10",
            "Endpoints tocados": "POST /auth/totp/setup, POST /auth/totp/confirm",
            "Automação equivalente": "nenhuma",
            "Só o manual cobre": "QR real, autenticador real, backup codes exibidos uma única vez"
          },
          "notas": [
            "<strong>Use <code>backoffice@sep.test</code> nesta jornada.</strong> <code>cliente-a</code> e <code>financeiro</code> já habilitaram TOTP no §6.2 do ROTEIRO-00, e <code>cliente-b</code> <strong>precisa continuar sem MFA</strong> — ele é a persona das negativas de step-up estrito. Sobra o <code>backoffice</code>, que não usa MFA em nenhuma outra jornada. Os backup codes gerados aqui são os que a <code>J-031.W</code> consome."
          ],
          "grupos": [
            {
              "id": "g1",
              "tituloHtml": null,
              "tela": null,
              "implicito": true,
              "passos": [
                {
                  "key": "ROTEIRO-01/J-030.W/P1",
                  "id": "P1",
                  "hash": "9783a1b5",
                  "textoHtml": "Abrir <code>/app/profile/setup-totp</code>.",
                  "comoHtml": "Entrar como <code>backoffice@sep.test</code> / <code>roteiro-manual-sep-2026</code> e digitar <code>http://localhost:4200/app/profile/setup-totp</code> na barra — <strong>não há link para esta tela no menu</strong>. Clicar em <strong>Iniciar setup</strong>: o QR só aparece depois disso.",
                  "textoBusca": "abrir /app/profile/setup-totp. entrar como backoffice@sep.test / roteiro-manual-sep-2026 e digitar http://localhost:4200/app/profile/setup-totp na barra — não há link para esta tela no menu. clicar em iniciar setup: o qr só aparece depois disso.",
                  "esperadoHtml": "QR code e secret em texto.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 576,
                  "ordem": 1
                },
                {
                  "key": "ROTEIRO-01/J-030.W/P2",
                  "id": "P2",
                  "hash": "c6583e22",
                  "textoHtml": "Escanear no autenticador e confirmar com um código <strong>incorreto</strong>.",
                  "comoHtml": "Escanear o QR primeiro (o autenticador passa a mostrar códigos), mas no campo <strong>Código TOTP</strong> digitar <code>000000</code> e clicar em <strong>Confirmar e ativar MFA</strong>. A recusa é o resultado certo: o QR ter sido escaneado não basta, o sistema precisa da prova de que você tem o autenticador agora.",
                  "textoBusca": "escanear no autenticador e confirmar com um código incorreto. escanear o qr primeiro (o autenticador passa a mostrar códigos), mas no campo código totp digitar 000000 e clicar em confirmar e ativar mfa. a recusa é o resultado certo: o qr ter sido escaneado não basta, o sistema precisa da prova de que você tem o autenticador agora.",
                  "esperadoHtml": "recusado; MFA <strong>não</strong> é habilitado.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 581,
                  "ordem": 2
                },
                {
                  "key": "ROTEIRO-01/J-030.W/P3",
                  "id": "P3",
                  "hash": "54ee010e",
                  "textoHtml": "Confirmar com o código corrente.",
                  "comoHtml": "Agora com o código real de 6 dígitos da conta <code>backoffice</code>. Ao dar certo, aparecem os backup codes — <strong>copiar todos antes de sair da tela</strong> e guardar no rascunho da execução. Eles são o insumo da <code>J-031.W</code>.",
                  "textoBusca": "confirmar com o código corrente. agora com o código real de 6 dígitos da conta backoffice. ao dar certo, aparecem os backup codes — copiar todos antes de sair da tela e guardar no rascunho da execução. eles são o insumo da j-031.w.",
                  "esperadoHtml": "MFA habilitado; backup codes exibidos.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 587,
                  "ordem": 3
                },
                {
                  "key": "ROTEIRO-01/J-030.W/P4",
                  "id": "P4",
                  "hash": "b903a84f",
                  "textoHtml": "Recarregar a tela.",
                  "comoHtml": "<code>F5</code>. Os códigos não podem reaparecer — a exibição é única, e é por isso que o P3 mandou copiar. Se reaparecerem, é ocorrência: significa que estão recuperáveis por quem tiver acesso à sessão.",
                  "textoBusca": "recarregar a tela. f5. os códigos não podem reaparecer — a exibição é única, e é por isso que o p3 mandou copiar. se reaparecerem, é ocorrência: significa que estão recuperáveis por quem tiver acesso à sessão.",
                  "esperadoHtml": "os backup codes <strong>não</strong> aparecem de novo. Exibição única.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 592,
                  "ordem": 4
                },
                {
                  "key": "ROTEIRO-01/J-030.W/P5",
                  "id": "P5",
                  "hash": "75e5b375",
                  "textoHtml": "Sair e autenticar novamente.",
                  "comoHtml": "<strong>Sair</strong> e entrar de novo como <code>backoffice</code>. Agora o login pede o código, o que antes não acontecia — é a confirmação de que o MFA passou a valer.",
                  "textoBusca": "sair e autenticar novamente. sair e entrar de novo como backoffice. agora o login pede o código, o que antes não acontecia — é a confirmação de que o mfa passou a valer.",
                  "esperadoHtml": "o login agora exige TOTP.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 597,
                  "ordem": 5
                },
                {
                  "key": "ROTEIRO-01/J-030.W/P6",
                  "id": "P6",
                  "hash": "c0fe65a0",
                  "textoHtml": "Conferir no banco:",
                  "comoHtml": "Terminal do banco. O comando já está com o usuário desta jornada preenchido.",
                  "textoBusca": "conferir no banco: terminal do banco. o comando já está com o usuário desta jornada preenchido.",
                  "esperadoHtml": "<code>mfa_habilitado = t</code>.",
                  "blocos": [
                    {
                      "tipo": "codigo",
                      "lang": "bash",
                      "regiao": "como",
                      "conteudo": "docker exec sep-postgres psql -U sep -d sep_dev \\\n  -c \"SELECT username, mfa_habilitado FROM usuario WHERE username = 'backoffice@sep.test';\""
                    }
                  ],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 601,
                  "ordem": 6
                }
              ]
            }
          ],
          "assercoes": [],
          "linha": 556,
          "stats": {
            "passos": 6,
            "na": 0,
            "assercoes": 0
          }
        },
        {
          "key": "ROTEIRO-01/J-031.W",
          "id": "J-031.W",
          "escopoId": "J-031.W",
          "kind": "jornada",
          "nivel": 3,
          "titulo": "Usar backup code e tentar reusar",
          "anchor": "j-031w---usar-backup-code-e-tentar-reusar",
          "ordem": 13,
          "meta": [
            {
              "chave": "ID",
              "texto": "J-031.W",
              "html": "<code>J-031.W</code>"
            },
            {
              "chave": "Tipo",
              "texto": "Positiva + negativa de reuso",
              "html": "Positiva + negativa de reuso"
            },
            {
              "chave": "Persona",
              "texto": "Usuário com MFA habilitado e backup codes guardados",
              "html": "Usuário com MFA habilitado e backup codes guardados"
            },
            {
              "chave": "Superfície",
              "texto": "Web",
              "html": "Web"
            },
            {
              "chave": "Pré-condições",
              "texto": "PRE-01 PRE-02 PRE-04 PRE-07 + backup codes de J-030.W",
              "html": "<code>PRE-01</code> <code>PRE-02</code> <code>PRE-04</code> <code>PRE-07</code> + backup codes de <code>J-030.W</code>"
            },
            {
              "chave": "Automação equivalente",
              "texto": "nenhuma",
              "html": "nenhuma"
            }
          ],
          "metaIndex": {
            "ID": "J-031.W",
            "Tipo": "Positiva + negativa de reuso",
            "Persona": "Usuário com MFA habilitado e backup codes guardados",
            "Superfície": "Web",
            "Pré-condições": "PRE-01 PRE-02 PRE-04 PRE-07 + backup codes de J-030.W",
            "Automação equivalente": "nenhuma"
          },
          "notas": [],
          "grupos": [
            {
              "id": "g1",
              "tituloHtml": null,
              "tela": null,
              "implicito": true,
              "passos": [
                {
                  "key": "ROTEIRO-01/J-031.W/P1",
                  "id": "P1",
                  "hash": "b5540435",
                  "textoHtml": "No desafio MFA do login, informar um backup code válido.",
                  "comoHtml": "Entrar como <code>backoffice@sep.test</code> (a persona que habilitou MFA na <a href=\"#j-030w---habilitar-mfa-totp\" rel=\"noreferrer\"><code>J-030.W</code></a>). Na tela <strong>Verificação em duas etapas</strong>, em vez do código do autenticador, digitar um dos <strong>backup codes</strong> guardados. O campo aceita os dois formatos. <strong>Anote qual código você usou</strong> — o P2 depende disso.",
                  "textoBusca": "no desafio mfa do login, informar um backup code válido. entrar como backoffice@sep.test (a persona que habilitou mfa na j-030.w). na tela verificação em duas etapas, em vez do código do autenticador, digitar um dos backup codes guardados. o campo aceita os dois formatos. anote qual código você usou — o p2 depende disso.",
                  "esperadoHtml": "autentica.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 624,
                  "ordem": 1
                },
                {
                  "key": "ROTEIRO-01/J-031.W/P2",
                  "id": "P2",
                  "hash": "71d42d38",
                  "textoHtml": "Sair e tentar o <strong>mesmo</strong> backup code de novo.",
                  "comoHtml": "<strong>Riscar do rascunho o código usado no P1</strong> — ele morreu ali. Sair, voltar ao login e informar exatamente aquele mesmo código. A recusa é o ponto da jornada: se ele funcionasse duas vezes, quem interceptasse o código uma vez teria acesso permanente.",
                  "textoBusca": "sair e tentar o mesmo backup code de novo. riscar do rascunho o código usado no p1 — ele morreu ali. sair, voltar ao login e informar exatamente aquele mesmo código. a recusa é o ponto da jornada: se ele funcionasse duas vezes, quem interceptasse o código uma vez teria acesso permanente.",
                  "esperadoHtml": "<strong>recusado</strong>. Backup code é de uso único.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 630,
                  "ordem": 2
                },
                {
                  "key": "ROTEIRO-01/J-031.W/P3",
                  "id": "P3",
                  "hash": "6df879f4",
                  "textoHtml": "Autenticar com um segundo backup code, ainda não usado.",
                  "comoHtml": "Pegar outro código da lista guardada na <code>J-030.W</code>, ainda não riscado. Riscar este também depois de usar. Sobrando códigos, guarde-os: são a saída se o autenticador se perder no meio da execução.",
                  "textoBusca": "autenticar com um segundo backup code, ainda não usado. pegar outro código da lista guardada na j-030.w, ainda não riscado. riscar este também depois de usar. sobrando códigos, guarde-os: são a saída se o autenticador se perder no meio da execução.",
                  "esperadoHtml": "autentica.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 635,
                  "ordem": 3
                },
                {
                  "key": "ROTEIRO-01/J-031.W/P4",
                  "id": "P4",
                  "hash": "21c4689b",
                  "textoHtml": "Conferir o audit log.",
                  "comoHtml": "Terminal do banco, mesma consulta de audit log das jornadas anteriores. Procurar os eventos referentes aos dois backup codes usados agora.",
                  "textoBusca": "conferir o audit log. terminal do banco, mesma consulta de audit log das jornadas anteriores. procurar os eventos referentes aos dois backup codes usados agora.",
                  "esperadoHtml": "uso de backup code registrado.",
                  "blocos": [
                    {
                      "tipo": "codigo",
                      "lang": "bash",
                      "regiao": "como",
                      "conteudo": "docker exec sep-postgres psql -U sep -d sep_dev \\\n  -c \"SELECT tipo, data_evento FROM audit_log_seguranca ORDER BY data_evento DESC LIMIT 10;\""
                    }
                  ],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 640,
                  "ordem": 4
                }
              ]
            }
          ],
          "assercoes": [],
          "linha": 611,
          "stats": {
            "passos": 4,
            "na": 0,
            "assercoes": 0
          }
        },
        {
          "key": "ROTEIRO-01/J-033.W",
          "id": "J-033.W",
          "escopoId": "J-033.W",
          "kind": "jornada",
          "nivel": 3,
          "titulo": "Token de step-up e de uso único",
          "anchor": "j-033w---token-de-step-up-e-de-uso-nico",
          "ordem": 14,
          "meta": [
            {
              "chave": "ID",
              "texto": "J-033.W",
              "html": "<code>J-033.W</code>"
            },
            {
              "chave": "Tipo",
              "texto": "Negativa — reuso de credencial",
              "html": "Negativa — reuso de credencial"
            },
            {
              "chave": "Persona",
              "texto": "cliente-a",
              "html": "<code>cliente-a</code>"
            },
            {
              "chave": "Superfície",
              "texto": "Web + API",
              "html": "Web + API"
            },
            {
              "chave": "Vetor",
              "texto": "Reaproveitar o mesmo X-Step-Up-Token em duas mutações",
              "html": "Reaproveitar o mesmo <code>X-Step-Up-Token</code> em duas mutações"
            },
            {
              "chave": "Comportamento seguro esperado",
              "texto": "Segunda chamada negada; token consumido na primeira",
              "html": "Segunda chamada negada; token consumido na primeira"
            },
            {
              "chave": "Pré-condições",
              "texto": "PRE-01 PRE-04 PRE-07 PRE-10",
              "html": "<code>PRE-01</code> <code>PRE-04</code> <code>PRE-07</code> <code>PRE-10</code>"
            },
            {
              "chave": "Política",
              "texto": "Token de 32 bytes, TTL 5 min, uso único, guardado como SHA-256",
              "html": "Token de 32 bytes, TTL 5 min, <strong>uso único</strong>, guardado como SHA-256"
            },
            {
              "chave": "Automação equivalente",
              "texto": "nenhuma — a suite mocka o step-up",
              "html": "nenhuma — a suite mocka o step-up"
            },
            {
              "chave": "Só o manual cobre",
              "texto": "O ciclo real de emissão, consumo e expiração",
              "html": "O ciclo real de emissão, consumo e expiração"
            }
          ],
          "metaIndex": {
            "ID": "J-033.W",
            "Tipo": "Negativa — reuso de credencial",
            "Persona": "cliente-a",
            "Superfície": "Web + API",
            "Vetor": "Reaproveitar o mesmo X-Step-Up-Token em duas mutações",
            "Comportamento seguro esperado": "Segunda chamada negada; token consumido na primeira",
            "Pré-condições": "PRE-01 PRE-04 PRE-07 PRE-10",
            "Política": "Token de 32 bytes, TTL 5 min, uso único, guardado como SHA-256",
            "Automação equivalente": "nenhuma — a suite mocka o step-up",
            "Só o manual cobre": "O ciclo real de emissão, consumo e expiração"
          },
          "notas": [
            "<strong>Esta jornada é pelo Insomnia, não pela tela.</strong> O objetivo é manipular o token na mão — algo que a interface não deixa fazer, porque ela sempre pede um token novo."
          ],
          "grupos": [
            {
              "id": "g1",
              "tituloHtml": null,
              "tela": null,
              "implicito": true,
              "passos": [
                {
                  "key": "ROTEIRO-01/J-033.W/P1",
                  "id": "P1",
                  "hash": "9bbcd93e",
                  "textoHtml": "Autenticado como <code>cliente-a</code>, chamar <code>POST /api/v1/auth/step-up/initiate</code>.",
                  "comoHtml": "Antes, fazer login como <code>cliente-a</code> pelo request de login do Insomnia (senha <code>jornada-tomador-sep-2026-v2</code>, se você já executou a <code>J-022.W</code>) e guardar o <code>accessToken</code> em <code>clienteAccessToken</code>. Depois, pasta <strong>Auth</strong>, request de <code>step-up/initiate</code>, <strong>Send</strong>. Copiar o <code>stepUpChallengeId</code> da resposta para a variável de mesmo nome.",
                  "textoBusca": "autenticado como cliente-a, chamar post /api/v1/auth/step-up/initiate. antes, fazer login como cliente-a pelo request de login do insomnia (senha jornada-tomador-sep-2026-v2, se você já executou a j-022.w) e guardar o accesstoken em clienteaccesstoken. depois, pasta auth, request de step-up/initiate, send. copiar o stepupchallengeid da resposta para a variável de mesmo nome.",
                  "esperadoHtml": "<code>stepUpChallengeId</code>.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 671,
                  "ordem": 1
                },
                {
                  "key": "ROTEIRO-01/J-033.W/P2",
                  "id": "P2",
                  "hash": "cb1daf22",
                  "textoHtml": "Chamar <code>POST /api/v1/auth/step-up/complete</code> com o desafio e o TOTP corrente.",
                  "comoHtml": "No body, o <code>stepUpChallengeId</code> do P1 e o código de 6 dígitos do autenticador (conta <code>cliente-a</code>). Copiar o token da resposta para <code>stepUpToken</code>. <strong>A partir daqui você tem 5 minutos</strong> — o P3 e o P4 precisam acontecer dentro dessa janela.",
                  "textoBusca": "chamar post /api/v1/auth/step-up/complete com o desafio e o totp corrente. no body, o stepupchallengeid do p1 e o código de 6 dígitos do autenticador (conta cliente-a). copiar o token da resposta para stepuptoken. a partir daqui você tem 5 minutos — o p3 e o p4 precisam acontecer dentro dessa janela.",
                  "esperadoHtml": "token de step-up no corpo. Guardar.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 678,
                  "ordem": 2
                },
                {
                  "key": "ROTEIRO-01/J-033.W/P3",
                  "id": "P3",
                  "hash": "bd5b05e9",
                  "textoHtml": "Usar o token em <code>PATCH /api/v1/usuarios/{id}/senha</code>.",
                  "comoHtml": "No request de troca de senha, aba <strong>Headers</strong>, conferir que existe <code>X-Step-Up-Token</code> com o valor do P2. No body, a senha atual e uma nova (<code>jornada-tomador-sep-2026-v3</code>). <strong>Anotar a senha nova</strong> — ela passa a valer.",
                  "textoBusca": "usar o token em patch /api/v1/usuarios/{id}/senha. no request de troca de senha, aba headers, conferir que existe x-step-up-token com o valor do p2. no body, a senha atual e uma nova (jornada-tomador-sep-2026-v3). anotar a senha nova — ela passa a valer.",
                  "esperadoHtml": "sucesso.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 683,
                  "ordem": 3
                },
                {
                  "key": "ROTEIRO-01/J-033.W/P4",
                  "id": "P4",
                  "hash": "0b47d4b0",
                  "textoHtml": "Repetir a <strong>mesma</strong> chamada com o <strong>mesmo</strong> token.",
                  "comoHtml": "Clicar em <strong>Send</strong> de novo, sem mudar nada. Como a senha atual agora é outra, o request está errado por dois motivos — mas o que importa é <strong>qual erro vem</strong>: tem de ser 403 por token consumido. Este é o coração da jornada: o token vale para <strong>uma</strong> operação.",
                  "textoBusca": "repetir a mesma chamada com o mesmo token. clicar em send de novo, sem mudar nada. como a senha atual agora é outra, o request está errado por dois motivos — mas o que importa é qual erro vem: tem de ser 403 por token consumido. este é o coração da jornada: o token vale para uma operação.",
                  "esperadoHtml": "<strong>403</strong>. Token já consumido.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 688,
                  "ordem": 4
                },
                {
                  "key": "ROTEIRO-01/J-033.W/P5",
                  "id": "P5",
                  "hash": "8cba3d4f",
                  "textoHtml": "Emitir um token novo, aguardar <strong>mais de 5 minutos</strong> e usá-lo.",
                  "comoHtml": "Repetir P1 e P2 para obter um token novo, <strong>anotar o horário</strong> e ir fazer outra coisa por 6 minutos (dá para adiantar outra jornada e voltar). Depois, enviar o request do P3 com esse token. Não tem atalho: o tempo é a variável testada.",
                  "textoBusca": "emitir um token novo, aguardar mais de 5 minutos e usá-lo. repetir p1 e p2 para obter um token novo, anotar o horário e ir fazer outra coisa por 6 minutos (dá para adiantar outra jornada e voltar). depois, enviar o request do p3 com esse token. não tem atalho: o tempo é a variável testada.",
                  "esperadoHtml": "<strong>403</strong> por expiração.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 693,
                  "ordem": 5
                },
                {
                  "key": "ROTEIRO-01/J-033.W/P6",
                  "id": "P6",
                  "hash": "989eedc4",
                  "textoHtml": "Conferir o corpo dos 403 de P4 e P5.",
                  "comoHtml": "Ler o corpo das duas respostas 403 no painel do Insomnia. O que se procura é o que <strong>não</strong> pode estar lá: id de usuário, nome de classe Java, caminho de arquivo, stack trace, ou explicação do tipo &quot;token expirado em tal horário&quot;. Mensagem detalhada demais ensina o atacante a ajustar o ataque.",
                  "textoBusca": "conferir o corpo dos 403 de p4 e p5. ler o corpo das duas respostas 403 no painel do insomnia. o que se procura é o que não pode estar lá: id de usuário, nome de classe java, caminho de arquivo, stack trace, ou explicação do tipo \"token expirado em tal horário\". mensagem detalhada demais ensina o atacante a ajustar o ataque.",
                  "esperadoHtml": "mensagem genérica (&quot;Acesso negado&quot;), <strong>sem</strong> UUID, stack trace ou detalhe interno.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 698,
                  "ordem": 6
                }
              ]
            }
          ],
          "assercoes": [],
          "linha": 651,
          "stats": {
            "passos": 6,
            "na": 0,
            "assercoes": 0
          }
        },
        {
          "key": "ROTEIRO-01/J-045.M",
          "id": "J-045.M",
          "escopoId": "J-045.M",
          "kind": "jornada",
          "nivel": 3,
          "titulo": "Usuário FINANCEIRO autentica no mobile",
          "anchor": "j-045m---usurio-financeiro-autentica-no-mobile",
          "ordem": 15,
          "meta": [
            {
              "chave": "ID",
              "texto": "J-045.M",
              "html": "<code>J-045.M</code>"
            },
            {
              "chave": "Tipo",
              "texto": "Positiva — documenta limitação conhecida",
              "html": "Positiva — documenta <strong>limitação conhecida</strong>"
            },
            {
              "chave": "Persona",
              "texto": "financeiro — FINANCEIRO",
              "html": "<code>financeiro</code> — FINANCEIRO"
            },
            {
              "chave": "Superfície",
              "texto": "Mobile",
              "html": "Mobile"
            },
            {
              "chave": "Pré-condições",
              "texto": "PRE-01 PRE-03 PRE-04 PRE-06",
              "html": "<code>PRE-01</code> <code>PRE-03</code> <code>PRE-04</code> <code>PRE-06</code>"
            },
            {
              "chave": "Nota",
              "texto": "O sep-mobile tipa UsuarioRole como `'ADMIN' \\",
              "html": "O <code>sep-mobile</code> tipa <code>UsuarioRole</code> como `'ADMIN' \\"
            }
          ],
          "metaIndex": {
            "ID": "J-045.M",
            "Tipo": "Positiva — documenta limitação conhecida",
            "Persona": "financeiro — FINANCEIRO",
            "Superfície": "Mobile",
            "Pré-condições": "PRE-01 PRE-03 PRE-04 PRE-06",
            "Nota": "O sep-mobile tipa UsuarioRole como `'ADMIN' \\"
          },
          "notas": [
            "A distinção entre P2 e P3 é o ponto desta jornada: barra vazia é limitação aceita; tela branca ou loop de navegação é bug. Não registre os dois como &quot;esperado&quot;."
          ],
          "grupos": [
            {
              "id": "g1",
              "tituloHtml": null,
              "tela": null,
              "implicito": true,
              "passos": [
                {
                  "key": "ROTEIRO-01/J-045.M/P1",
                  "id": "P1",
                  "hash": "cc9c701e",
                  "textoHtml": "Autenticar como <code>financeiro@sep.test</code> no mobile.",
                  "comoHtml": "Em <code>http://localhost:8100/login</code>, com emulação de dispositivo ligada. Senha <code>roteiro-manual-sep-2026</code>, e o código TOTP da conta <code>financeiro</code> (habilitado no §6.2 do ROTEIRO-00). O login funcionar já é o primeiro achado: o backend não impede o FINANCEIRO de entrar no app.",
                  "textoBusca": "autenticar como financeiro@sep.test no mobile. em http://localhost:8100/login, com emulação de dispositivo ligada. senha roteiro-manual-sep-2026, e o código totp da conta financeiro (habilitado no §6.2 do roteiro-00). o login funcionar já é o primeiro achado: o backend não impede o financeiro de entrar no app.",
                  "esperadoHtml": "login <strong>conclui</strong> — o backend aceita normalmente.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 721,
                  "ordem": 1
                },
                {
                  "key": "ROTEIRO-01/J-045.M/P2",
                  "id": "P2",
                  "hash": "7cdea372",
                  "textoHtml": "Observar a barra de tabs.",
                  "comoHtml": "Olhar o rodapé. Com <code>cliente-a</code> havia quatro abas; aqui a barra fica <strong>vazia</strong>, porque o app mobile só conhece os perfis Cliente e Administrador. Tirar um screenshot (<code>Ctrl+Shift+P</code> no DevTools &gt; &quot;Capture screenshot&quot;) e anexar à ocorrência, se registrar alguma. Isto é <strong>limitação conhecida</strong>, não defeito — marcar o passo normalmente.",
                  "textoBusca": "observar a barra de tabs. olhar o rodapé. com cliente-a havia quatro abas; aqui a barra fica vazia, porque o app mobile só conhece os perfis cliente e administrador. tirar um screenshot (ctrl+shift+p no devtools > \"capture screenshot\") e anexar à ocorrência, se registrar alguma. isto é limitação conhecida, não defeito — marcar o passo normalmente.",
                  "esperadoHtml": "<strong>vazia</strong>. Capturar screenshot. Este é o comportamento atual documentado.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 727,
                  "ordem": 2
                },
                {
                  "key": "ROTEIRO-01/J-045.M/P3",
                  "id": "P3",
                  "hash": "05383d50",
                  "textoHtml": "Abrir <code>/app/propostas</code> por URL direta.",
                  "comoHtml": "Colar <code>http://localhost:8100/app/propostas</code> na barra. <strong>É aqui que a jornada separa limitação de defeito</strong>: qualquer resposta clara serve (negar, mandar para <code>/welcome</code>, mostrar aviso). O que <strong>não</strong> pode é tela totalmente branca ou o endereço ficar trocando sozinho num ciclo — isso é bug e vira ocorrência.",
                  "textoBusca": "abrir /app/propostas por url direta. colar http://localhost:8100/app/propostas na barra. é aqui que a jornada separa limitação de defeito: qualquer resposta clara serve (negar, mandar para /welcome, mostrar aviso). o que não pode é tela totalmente branca ou o endereço ficar trocando sozinho num ciclo — isso é bug e vira ocorrência.",
                  "esperadoHtml": "negado ou redirecionado. <strong>Sem</strong> tela em branco e <strong>sem</strong> loop de navegação.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 733,
                  "ordem": 3
                },
                {
                  "key": "ROTEIRO-01/J-045.M/P4",
                  "id": "P4",
                  "hash": "099d8808",
                  "textoHtml": "Repetir <strong>P1</strong> a <strong>P3</strong> com <code>backoffice@sep.test</code>.",
                  "comoHtml": "Sair e refazer os três passos com <code>backoffice@sep.test</code> / <code>roteiro-manual-sep-2026</code>. Se você executou a <a href=\"#j-030w---habilitar-mfa-totp\" rel=\"noreferrer\"><code>J-030.W</code></a>, esta conta agora pede código TOTP no login.",
                  "textoBusca": "repetir p1 a p3 com backoffice@sep.test. sair e refazer os três passos com backoffice@sep.test / roteiro-manual-sep-2026. se você executou a j-030.w, esta conta agora pede código totp no login.",
                  "esperadoHtml": "mesmo comportamento.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 739,
                  "ordem": 4
                }
              ]
            }
          ],
          "assercoes": [
            {
              "key": "ROTEIRO-01/J-045.M/#b235f9b2",
              "id": null,
              "hash": "aef03826",
              "textoHtml": "P2 confirma a limitação conhecida (esperado)",
              "comoHtml": null,
              "textoBusca": "p2 confirma a limitação conhecida (esperado)",
              "esperadoHtml": null,
              "blocos": [],
              "na": false,
              "naMotivo": null,
              "marcadoNaFonte": false,
              "linha": 747,
              "ordem": 1
            },
            {
              "key": "ROTEIRO-01/J-045.M/#313f487d",
              "id": null,
              "hash": "88ed6b58",
              "textoHtml": "P3 <strong>não</strong> pode resultar em tela branca ou loop — isso seria defeito, não limitação",
              "comoHtml": null,
              "textoBusca": "p3 não pode resultar em tela branca ou loop — isso seria defeito, não limitação",
              "esperadoHtml": null,
              "blocos": [],
              "na": false,
              "naMotivo": null,
              "marcadoNaFonte": false,
              "linha": 748,
              "ordem": 2
            }
          ],
          "linha": 708,
          "stats": {
            "passos": 4,
            "na": 0,
            "assercoes": 2
          }
        }
      ],
      "ocorrenciasColunas": [
        "#",
        "Jornada",
        "Passo",
        "O que aconteceu",
        "Esperado",
        "Issue"
      ],
      "registroCampos": [
        {
          "chave": "executado_por",
          "rotulo": "Executado por",
          "tipo": "texto"
        },
        {
          "chave": "data_hora",
          "rotulo": "Data / hora",
          "tipo": "texto"
        },
        {
          "chave": "commit_sep_api",
          "rotulo": "Commit sep-api",
          "tipo": "texto"
        },
        {
          "chave": "commit_sep_app",
          "rotulo": "Commit sep-app",
          "tipo": "texto"
        },
        {
          "chave": "commit_sep_mobile",
          "rotulo": "Commit sep-mobile",
          "tipo": "texto"
        },
        {
          "chave": "jornadas_ok",
          "rotulo": "Jornadas OK",
          "tipo": "texto"
        },
        {
          "chave": "jornadas_nok",
          "rotulo": "Jornadas NOK",
          "tipo": "texto"
        },
        {
          "chave": "jornadas_bloqueado",
          "rotulo": "Jornadas BLOQUEADO",
          "tipo": "texto"
        },
        {
          "chave": "observacoes",
          "rotulo": "Observações",
          "tipo": "textarea"
        }
      ]
    },
    {
      "id": "ROTEIRO-04",
      "arquivo": "ROTEIRO-04-CREDITO-FORMALIZACAO.md",
      "hash": "e728703a",
      "titulo": "Roteiro 04 - Crédito e formalização",
      "tipo": "jornadas",
      "ordem": 14,
      "atualizadoEm": "2026-07-21",
      "resumoHtml": "",
      "escopos": [
        {
          "key": "ROTEIRO-04/J-060.W",
          "id": "J-060.W",
          "escopoId": "J-060.W",
          "kind": "jornada",
          "nivel": 3,
          "titulo": "Tomador cria proposta de crédito",
          "anchor": "j-060w---tomador-cria-proposta-de-crdito",
          "ordem": 1,
          "meta": [
            {
              "chave": "ID",
              "texto": "J-060.W",
              "html": "<code>J-060.W</code>"
            },
            {
              "chave": "Tipo",
              "texto": "Positiva",
              "html": "Positiva"
            },
            {
              "chave": "Persona",
              "texto": "cliente-a — CLIENTE com onboarding APROVADOFINAL",
              "html": "<code>cliente-a</code> — CLIENTE com onboarding <code>APROVADO_FINAL</code>"
            },
            {
              "chave": "Superfície",
              "texto": "Web",
              "html": "Web"
            },
            {
              "chave": "Pré-condições",
              "texto": "PRE-01 PRE-02 PRE-04 PRE-07 PRE-11",
              "html": "<code>PRE-01</code> <code>PRE-02</code> <code>PRE-04</code> <code>PRE-07</code> <code>PRE-11</code>"
            },
            {
              "chave": "Endpoints tocados",
              "texto": "POST /api/v1/credito/propostas, GET /propostas/{id}",
              "html": "<code>POST /api/v1/credito/propostas</code>, <code>GET /propostas/{id}</code>"
            },
            {
              "chave": "Step-up",
              "texto": "não",
              "html": "não"
            },
            {
              "chave": "Duração",
              "texto": "8 min",
              "html": "8 min"
            },
            {
              "chave": "Automação equivalente",
              "texto": "nenhuma spec cobre a criação contra backend real",
              "html": "nenhuma spec cobre a criação contra backend real"
            },
            {
              "chave": "Só o manual cobre",
              "texto": "Motor de regras avaliando dados reais, não fixture",
              "html": "Motor de regras avaliando dados reais, não fixture"
            }
          ],
          "metaIndex": {
            "ID": "J-060.W",
            "Tipo": "Positiva",
            "Persona": "cliente-a — CLIENTE com onboarding APROVADOFINAL",
            "Superfície": "Web",
            "Pré-condições": "PRE-01 PRE-02 PRE-04 PRE-07 PRE-11",
            "Endpoints tocados": "POST /api/v1/credito/propostas, GET /propostas/{id}",
            "Step-up": "não",
            "Duração": "8 min",
            "Automação equivalente": "nenhuma spec cobre a criação contra backend real",
            "Só o manual cobre": "Motor de regras avaliando dados reais, não fixture"
          },
          "notas": [
            "Família <code>J-060</code> a <code>J-079</code>: proposta, motor de regras, parecer, Open Finance, contrato, aceite, assinatura, CCB e cancelamento. Requer <a href=\"./ROTEIRO-00-AMBIENTE-E-MASSA.md\" rel=\"noreferrer\"><code>ROTEIRO-00</code></a> concluído. Hub: <a href=\"./CENARIOS-TESTE-JORNADAS-USUARIO.md\" rel=\"noreferrer\"><code>CENARIOS-TESTE-JORNADAS-USUARIO.md</code></a>.",
            "<strong>Execute pelo <a href=\"./app/index.html\" rel=\"noreferrer\">app</a></strong>, não editando este arquivo — as caixas aqui ficam sempre vazias. Desvio não vira caixa marcada: vira <strong>ocorrência</strong> registrada no passo.",
            "<strong>Divergência documental conhecida.</strong> O <a href=\"../../repos/sep-api/CONTRATOS.md\" rel=\"noreferrer\"><code>CONTRATOS.md</code></a> ainda descreve o aceite com <code>@RequireStepUp</code> (texto da Sprint 10). O <code>ContratoController</code> usa <code>@RequireStepUpEstrito</code> desde a Sprint 27. O <strong>código</strong> e a referência; o doc operacional precisa de correção.",
            "<strong>Esta jornada exige <code>PRE-11</code></strong> — <code>cliente-a</code> com onboarding aprovado, que é produzido pelo roteiro de onboarding, não pelo preparo do ROTEIRO-00. Sem isso, o comportamento correto é o da <a href=\"#j-061w-n1---proposta-sem-onboarding-aprovado\" rel=\"noreferrer\"><code>J-061.W-N1</code></a>: a UI manda você para o onboarding. Se for esse o caso, execute o onboarding antes e volte."
          ],
          "grupos": [
            {
              "id": "g2",
              "tituloHtml": "Tela <code>/app/credito/propostas/nova</code>",
              "tela": "/app/credito/propostas/nova",
              "implicito": false,
              "passos": [
                {
                  "key": "ROTEIRO-04/J-060.W/P1",
                  "id": "P1",
                  "hash": "0c938cea",
                  "textoHtml": "Abrir <strong>Crédito</strong> no menu e iniciar nova proposta.",
                  "comoHtml": "Logado como <code>cliente-a</code> (senha <code>jornada-tomador-sep-2026-v2</code> se você executou a <code>J-022.W</code>), abrir o menu lateral, grupo <strong>Jornadas</strong>, item <strong>Crédito</strong>. Procurar a ação de criar uma proposta nova.",
                  "textoBusca": "abrir crédito no menu e iniciar nova proposta. logado como cliente-a (senha jornada-tomador-sep-2026-v2 se você executou a j-022.w), abrir o menu lateral, grupo jornadas, item crédito. procurar a ação de criar uma proposta nova.",
                  "esperadoHtml": "formulário com valor, prazo e finalidade.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 88,
                  "ordem": 1
                },
                {
                  "key": "ROTEIRO-04/J-060.W/P2",
                  "id": "P2",
                  "hash": "2715346e",
                  "textoHtml": "Enviar com valor fora da faixa permitida.",
                  "comoHtml": "Digitar um valor absurdo de propósito — <code>1</code> ou <code>99999999</code> — e enviar. A recusa é o resultado correto. Conferir que a mensagem diz <strong>qual</strong> é a faixa aceita: erro que não orienta é erro pela metade, e vale registrar como ocorrência de usabilidade.",
                  "textoBusca": "enviar com valor fora da faixa permitida. digitar um valor absurdo de propósito — 1 ou 99999999 — e enviar. a recusa é o resultado correto. conferir que a mensagem diz qual é a faixa aceita: erro que não orienta é erro pela metade, e vale registrar como ocorrência de usabilidade.",
                  "esperadoHtml": "recusado com mensagem de validação; nenhuma proposta criada.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 93,
                  "ordem": 2
                },
                {
                  "key": "ROTEIRO-04/J-060.W/P3",
                  "id": "P3",
                  "hash": "f1eeee42",
                  "textoHtml": "Preencher valores válidos e enviar.",
                  "comoHtml": "Usar um valor dentro da faixa que a mensagem do P2 indicou, um prazo qualquer oferecido e uma finalidade. <strong>Anotar o <code>propostaId</code></strong> que aparece no endereço depois do redirecionamento (<code>/app/credito/propostas/&lt;id&gt;</code>) — praticamente todas as jornadas seguintes deste roteiro dependem dele.",
                  "textoBusca": "preencher valores válidos e enviar. usar um valor dentro da faixa que a mensagem do p2 indicou, um prazo qualquer oferecido e uma finalidade. anotar o propostaid que aparece no endereço depois do redirecionamento (/app/credito/propostas/<id>) — praticamente todas as jornadas seguintes deste roteiro dependem dele.",
                  "esperadoHtml": "<code>201</code>; redireciona para o detalhe da proposta.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 98,
                  "ordem": 3
                }
              ]
            },
            {
              "id": "g3",
              "tituloHtml": "Tela <code>/app/credito/propostas/:id</code>",
              "tela": "/app/credito/propostas/:id",
              "implicito": false,
              "passos": [
                {
                  "key": "ROTEIRO-04/J-060.W/P4",
                  "id": "P4",
                  "hash": "fa490375",
                  "textoHtml": "Conferir o status logo após a criação.",
                  "comoHtml": "Na tela de detalhe, localizar o status da proposta. Qualquer um dos três valores esperados serve — inclusive <code>REJEITADA</code>, que não é falha do teste. O defeito seria status vazio, &quot;carregando&quot; que nunca termina, ou um valor fora dessa lista.",
                  "textoBusca": "conferir o status logo após a criação. na tela de detalhe, localizar o status da proposta. qualquer um dos três valores esperados serve — inclusive rejeitada, que não é falha do teste. o defeito seria status vazio, \"carregando\" que nunca termina, ou um valor fora dessa lista.",
                  "esperadoHtml": "o motor de regras já avaliou: <code>PRE_APROVADA</code>, <code>EM_ANALISE</code> ou <code>REJEITADA</code>. <strong>Não</strong> fica em branco nem em estado intermediário indefinido.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 107,
                  "ordem": 1
                },
                {
                  "key": "ROTEIRO-04/J-060.W/P5",
                  "id": "P5",
                  "hash": "f5e436ac",
                  "textoHtml": "Conferir que nenhuma regra de decisão foi calculada no front.",
                  "comoHtml": "Na aba <strong>Network</strong>, abrir a resposta da chamada que trouxe a proposta e conferir que o status <strong>já vem pronto no JSON</strong>, igual ao que a tela mostra. Se o JSON não trouxesse status e a tela mostrasse um, a decisão de crédito estaria sendo tomada no navegador — onde o usuário pode alterá-la. Ocorrência grave.",
                  "textoBusca": "conferir que nenhuma regra de decisão foi calculada no front. na aba network, abrir a resposta da chamada que trouxe a proposta e conferir que o status já vem pronto no json, igual ao que a tela mostra. se o json não trouxesse status e a tela mostrasse um, a decisão de crédito estaria sendo tomada no navegador — onde o usuário pode alterá-la. ocorrência grave.",
                  "esperadoHtml": "o status vem da API; a tela apenas exibe.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 113,
                  "ordem": 2
                },
                {
                  "key": "ROTEIRO-04/J-060.W/P6",
                  "id": "P6",
                  "hash": "a2598c6d",
                  "textoHtml": "Conferir o audit log:",
                  "comoHtml": "Terminal do banco. Os dois eventos precisam existir: um registra que a proposta foi criada, o outro que o motor de regras a avaliou. Decisão de crédito sem trilha é problema de compliance.",
                  "textoBusca": "conferir o audit log: terminal do banco. os dois eventos precisam existir: um registra que a proposta foi criada, o outro que o motor de regras a avaliou. decisão de crédito sem trilha é problema de compliance.",
                  "esperadoHtml": "<code>PROPOSTA_CRIADA</code> e <code>PROPOSTA_AVALIADA_MOTOR</code> registrados.",
                  "blocos": [
                    {
                      "tipo": "codigo",
                      "lang": "bash",
                      "regiao": "como",
                      "conteudo": "docker exec sep-postgres psql -U sep -d sep_dev \\\n  -c \"SELECT tipo, data_evento FROM audit_log_seguranca\n      WHERE tipo IN ('PROPOSTA_CRIADA','PROPOSTA_AVALIADA_MOTOR')\n      ORDER BY data_evento DESC LIMIT 5;\""
                    }
                  ],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 119,
                  "ordem": 3
                }
              ]
            }
          ],
          "assercoes": [
            {
              "key": "ROTEIRO-04/J-060.W/#084e1411",
              "id": null,
              "hash": "f95a6d76",
              "textoHtml": "Proposta criada e avaliada pelo motor; anotar o <code>propostaId</code> para as proximas jornadas",
              "comoHtml": null,
              "textoBusca": "proposta criada e avaliada pelo motor; anotar o propostaid para as proximas jornadas",
              "esperadoHtml": null,
              "blocos": [],
              "na": false,
              "naMotivo": null,
              "marcadoNaFonte": false,
              "linha": 133,
              "ordem": 1
            }
          ],
          "linha": 64,
          "stats": {
            "passos": 6,
            "na": 0,
            "assercoes": 1
          }
        },
        {
          "key": "ROTEIRO-04/J-061.W-N1",
          "id": "J-061.W-N1",
          "escopoId": "J-061.W-N1",
          "kind": "jornada",
          "nivel": 3,
          "titulo": "Proposta sem onboarding aprovado",
          "anchor": "j-061w-n1---proposta-sem-onboarding-aprovado",
          "ordem": 2,
          "meta": [
            {
              "chave": "ID",
              "texto": "J-061.W-N1",
              "html": "<code>J-061.W-N1</code>"
            },
            {
              "chave": "Tipo",
              "texto": "Negativa — regra de negócio",
              "html": "Negativa — regra de negócio"
            },
            {
              "chave": "Persona",
              "texto": "cliente-b — CLIENTE sem onboarding APROVADOFINAL",
              "html": "<code>cliente-b</code> — CLIENTE <strong>sem</strong> onboarding <code>APROVADO_FINAL</code>"
            },
            {
              "chave": "Superfície",
              "texto": "Web + API",
              "html": "Web + API"
            },
            {
              "chave": "Vetor",
              "texto": "Tentar contratar crédito sem KYC concluído",
              "html": "Tentar contratar crédito sem KYC concluído"
            },
            {
              "chave": "Comportamento seguro esperado",
              "texto": "Bloqueio no backend, com orientação na UI",
              "html": "Bloqueio no backend, com orientação na UI"
            },
            {
              "chave": "Pré-condições",
              "texto": "PRE-01 PRE-02 PRE-04 PRE-09",
              "html": "<code>PRE-01</code> <code>PRE-02</code> <code>PRE-04</code> <code>PRE-09</code>"
            }
          ],
          "metaIndex": {
            "ID": "J-061.W-N1",
            "Tipo": "Negativa — regra de negócio",
            "Persona": "cliente-b — CLIENTE sem onboarding APROVADOFINAL",
            "Superfície": "Web + API",
            "Vetor": "Tentar contratar crédito sem KYC concluído",
            "Comportamento seguro esperado": "Bloqueio no backend, com orientação na UI",
            "Pré-condições": "PRE-01 PRE-02 PRE-04 PRE-09"
          },
          "notas": [
            "<strong>P2 e o passo que importa.</strong> Bloquear só na UI não e bloquear. Se a API aceitar, há contratação sem KYC — violação direta da CMN 4.656/2018."
          ],
          "grupos": [
            {
              "id": "g1",
              "tituloHtml": null,
              "tela": null,
              "implicito": true,
              "passos": [
                {
                  "key": "ROTEIRO-04/J-061.W-N1/P1",
                  "id": "P1",
                  "hash": "118a335e",
                  "textoHtml": "Como <code>cliente-b</code>, abrir <strong>Crédito</strong>.",
                  "comoHtml": "Entrar como <code>cliente-b@sep.test</code> — atenção: se você executou a <code>J-022.W-N1</code>, a senha dele agora é <code>jornada-ownership-sep-2026-v2</code>. Abrir <strong>Crédito</strong> no menu. Esta persona nunca fez onboarding, então a tela deve orientar a fazê-lo em vez de oferecer o formulário de proposta.",
                  "textoBusca": "como cliente-b, abrir crédito. entrar como cliente-b@sep.test — atenção: se você executou a j-022.w-n1, a senha dele agora é jornada-ownership-sep-2026-v2. abrir crédito no menu. esta persona nunca fez onboarding, então a tela deve orientar a fazê-lo em vez de oferecer o formulário de proposta.",
                  "esperadoHtml": "a UI direciona para o onboarding em vez de oferecer a proposta.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 151,
                  "ordem": 1
                },
                {
                  "key": "ROTEIRO-04/J-061.W-N1/P2",
                  "id": "P2",
                  "hash": "d5ac4dc9",
                  "textoHtml": "Chamar <code>POST /api/v1/credito/propostas</code> direto na API, com payload válido.",
                  "comoHtml": "<strong>Este é o passo que importa</strong> — o P1 só mostrou que a tela esconde o caminho, e esconder não é bloquear. No Insomnia, fazer login como <code>cliente-b</code>, guardar o token, e enviar o request de criação de proposta com um payload perfeitamente válido (pode copiar o que funcionou na <code>J-060.W</code>). A recusa tem de vir do <strong>backend</strong>.",
                  "textoBusca": "chamar post /api/v1/credito/propostas direto na api, com payload válido. este é o passo que importa — o p1 só mostrou que a tela esconde o caminho, e esconder não é bloquear. no insomnia, fazer login como cliente-b, guardar o token, e enviar o request de criação de proposta com um payload perfeitamente válido (pode copiar o que funcionou na j-060.w). a recusa tem de vir do backend.",
                  "esperadoHtml": "recusado pela regra <code>RegraOnboardingAprovado</code>. Nenhuma proposta criada.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 157,
                  "ordem": 2
                },
                {
                  "key": "ROTEIRO-04/J-061.W-N1/P3",
                  "id": "P3",
                  "hash": "85f60859",
                  "textoHtml": "Conferir no banco que nada foi persistido.",
                  "comoHtml": "Terminal do banco. Um 4xx na resposta não prova que nada foi gravado — pode ter criado a linha e falhado depois. Esta consulta fecha essa dúvida: a contagem tem de ser zero.",
                  "textoBusca": "conferir no banco que nada foi persistido. terminal do banco. um 4xx na resposta não prova que nada foi gravado — pode ter criado a linha e falhado depois. esta consulta fecha essa dúvida: a contagem tem de ser zero.",
                  "esperadoHtml": "nenhuma proposta para <code>cliente-b</code>.",
                  "blocos": [
                    {
                      "tipo": "codigo",
                      "lang": "bash",
                      "regiao": "como",
                      "conteudo": "docker exec sep-postgres psql -U sep -d sep_dev \\\n  -c \"SELECT count(*) FROM proposta_credito p JOIN usuario u ON u.id = p.tomador_id\n      WHERE u.username = 'cliente-b@sep.test';\""
                    }
                  ],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 163,
                  "ordem": 3
                }
              ]
            }
          ],
          "assercoes": [],
          "linha": 137,
          "stats": {
            "passos": 3,
            "na": 0,
            "assercoes": 0
          }
        },
        {
          "key": "ROTEIRO-04/J-062.W",
          "id": "J-062.W",
          "escopoId": "J-062.W",
          "kind": "jornada",
          "nivel": 3,
          "titulo": "Autorizar Open Finance e reavaliar",
          "anchor": "j-062w---autorizar-open-finance-e-reavaliar",
          "ordem": 3,
          "meta": [
            {
              "chave": "ID",
              "texto": "J-062.W",
              "html": "<code>J-062.W</code>"
            },
            {
              "chave": "Tipo",
              "texto": "Positiva",
              "html": "Positiva"
            },
            {
              "chave": "Persona",
              "texto": "cliente-a com proposta em EMANALISE",
              "html": "<code>cliente-a</code> com proposta em <code>EM_ANALISE</code>"
            },
            {
              "chave": "Superfície",
              "texto": "Web",
              "html": "Web"
            },
            {
              "chave": "Pré-condições",
              "texto": "PRE-01 PRE-02 PRE-04 + J-060.W concluída",
              "html": "<code>PRE-01</code> <code>PRE-02</code> <code>PRE-04</code> + <code>J-060.W</code> concluída"
            },
            {
              "chave": "Endpoints tocados",
              "texto": "POST /credito/propostas/{id}/open-finance/consentimento, GET .../open-finance",
              "html": "<code>POST /credito/propostas/{id}/open-finance/consentimento</code>, <code>GET .../open-finance</code>"
            },
            {
              "chave": "Provider",
              "texto": "FakeOpenFinanceProvider (default)",
              "html": "<code>FakeOpenFinanceProvider</code> (default)"
            },
            {
              "chave": "Duração",
              "texto": "6 min",
              "html": "6 min"
            }
          ],
          "metaIndex": {
            "ID": "J-062.W",
            "Tipo": "Positiva",
            "Persona": "cliente-a com proposta em EMANALISE",
            "Superfície": "Web",
            "Pré-condições": "PRE-01 PRE-02 PRE-04 + J-060.W concluída",
            "Endpoints tocados": "POST /credito/propostas/{id}/open-finance/consentimento, GET .../open-finance",
            "Provider": "FakeOpenFinanceProvider (default)",
            "Duração": "6 min"
          },
          "notas": [],
          "grupos": [
            {
              "id": "g1",
              "tituloHtml": null,
              "tela": null,
              "implicito": true,
              "passos": [
                {
                  "key": "ROTEIRO-04/J-062.W/P1",
                  "id": "P1",
                  "hash": "10814b8d",
                  "textoHtml": "No detalhe da proposta, iniciar a autorização de Open Finance.",
                  "comoHtml": "Abrir <code>/app/credito/propostas/&lt;propostaId&gt;</code> com o id anotado na <code>J-060.W</code>. Localizar a ação de Open Finance. Aqui não há banco de verdade: o provider é o <code>FakeOpenFinanceProvider</code>, que simula a resposta da instituição.",
                  "textoBusca": "no detalhe da proposta, iniciar a autorização de open finance. abrir /app/credito/propostas/<propostaid> com o id anotado na j-060.w. localizar a ação de open finance. aqui não há banco de verdade: o provider é o fakeopenfinanceprovider, que simula a resposta da instituição.",
                  "esperadoHtml": "vai para <code>/app/credito/propostas/:id/open-finance</code>.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 194,
                  "ordem": 1
                },
                {
                  "key": "ROTEIRO-04/J-062.W/P2",
                  "id": "P2",
                  "hash": "acfcb026",
                  "textoHtml": "Conferir o texto de consentimento antes de autorizar.",
                  "comoHtml": "<strong>Ler o texto na tela, não só clicar.</strong> O que se verifica: está escrito quais dados serão acessados e para quê? Consentimento é exigência regulatória — texto vago, ausente, ou caixa já marcada por padrão são ocorrência.",
                  "textoBusca": "conferir o texto de consentimento antes de autorizar. ler o texto na tela, não só clicar. o que se verifica: está escrito quais dados serão acessados e para quê? consentimento é exigência regulatória — texto vago, ausente, ou caixa já marcada por padrão são ocorrência.",
                  "esperadoHtml": "escopo e finalidade explícitos. Consentimento não pode ser implícito.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 199,
                  "ordem": 2
                },
                {
                  "key": "ROTEIRO-04/J-062.W/P3",
                  "id": "P3",
                  "hash": "f6269be4",
                  "textoHtml": "Autorizar.",
                  "comoHtml": "Confirmar a autorização. O endereço muda para <code>.../open-finance/retorno</code> — é a simulação do retorno da instituição financeira.",
                  "textoBusca": "autorizar. confirmar a autorização. o endereço muda para .../open-finance/retorno — é a simulação do retorno da instituição financeira.",
                  "esperadoHtml": "redireciona para <code>.../open-finance/retorno</code> (mesmo componente com <code>data.retorno = true</code>); consentimento registrado.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 204,
                  "ordem": 3
                },
                {
                  "key": "ROTEIRO-04/J-062.W/P4",
                  "id": "P4",
                  "hash": "529248bc",
                  "textoHtml": "Voltar ao detalhe da proposta e reconsultar por gesto.",
                  "comoHtml": "&quot;Por gesto&quot; quer dizer: <strong>você</strong> aciona a atualização (botão de recarregar da tela, ou <code>F5</code>), a tela não se atualiza sozinha. Com a aba <strong>Network</strong> aberta, ficar parado uns 30 segundos e conferir que <strong>não aparecem chamadas repetidas</strong> — isso seria polling, que a arquitetura do projeto evita de propósito.",
                  "textoBusca": "voltar ao detalhe da proposta e reconsultar por gesto. \"por gesto\" quer dizer: você aciona a atualização (botão de recarregar da tela, ou f5), a tela não se atualiza sozinha. com a aba network aberta, ficar parado uns 30 segundos e conferir que não aparecem chamadas repetidas — isso seria polling, que a arquitetura do projeto evita de propósito.",
                  "esperadoHtml": "dados do Open Finance refletidos; sem polling automático na aba de rede.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 209,
                  "ordem": 4
                },
                {
                  "key": "ROTEIRO-04/J-062.W/P5",
                  "id": "P5",
                  "hash": "386d38f1",
                  "textoHtml": "Repetir a autorização para a <strong>mesma</strong> proposta.",
                  "comoHtml": "Percorrer P1 a P3 de novo na mesma proposta. O sistema tem de absorver a repetição sem criar um segundo consentimento — é o que garante que um duplo clique ou um retry de rede não gere registro duplicado. Conferir no detalhe que continua havendo um consentimento só.",
                  "textoBusca": "repetir a autorização para a mesma proposta. percorrer p1 a p3 de novo na mesma proposta. o sistema tem de absorver a repetição sem criar um segundo consentimento — é o que garante que um duplo clique ou um retry de rede não gere registro duplicado. conferir no detalhe que continua havendo um consentimento só.",
                  "esperadoHtml": "tratado de forma idempotente; não duplica consentimento.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 215,
                  "ordem": 5
                }
              ]
            }
          ],
          "assercoes": [],
          "linha": 179,
          "stats": {
            "passos": 5,
            "na": 0,
            "assercoes": 0
          }
        },
        {
          "key": "ROTEIRO-04/J-063.W",
          "id": "J-063.W",
          "escopoId": "J-063.W",
          "kind": "jornada",
          "nivel": 3,
          "titulo": "FINANCEIRO registra parecer e aprova",
          "anchor": "j-063w---financeiro-registra-parecer-e-aprova",
          "ordem": 4,
          "meta": [
            {
              "chave": "ID",
              "texto": "J-063.W",
              "html": "<code>J-063.W</code>"
            },
            {
              "chave": "Tipo",
              "texto": "Positiva",
              "html": "Positiva"
            },
            {
              "chave": "Persona",
              "texto": "financeiro — FINANCEIRO com TOTP habilitado",
              "html": "<code>financeiro</code> — FINANCEIRO com TOTP habilitado"
            },
            {
              "chave": "Superfície",
              "texto": "Web",
              "html": "Web"
            },
            {
              "chave": "Pré-condições",
              "texto": "PRE-01 PRE-02 PRE-04 PRE-06 PRE-08 PRE-10 + J-060.W",
              "html": "<code>PRE-01</code> <code>PRE-02</code> <code>PRE-04</code> <code>PRE-06</code> <code>PRE-08</code> <code>PRE-10</code> + <code>J-060.W</code>"
            },
            {
              "chave": "Endpoints tocados",
              "texto": "POST /credito/propostas/{id}/parecer, GET /propostas/{id}/regras",
              "html": "<code>POST /credito/propostas/{id}/parecer</code>, <code>GET /propostas/{id}/regras</code>"
            },
            {
              "chave": "Step-up",
              "texto": "@RequireStepUp legado — como financeiro tem MFA, exige token",
              "html": "<code>@RequireStepUp</code> legado — como <code>financeiro</code> tem MFA, <strong>exige</strong> token"
            },
            {
              "chave": "Duração",
              "texto": "8 min",
              "html": "8 min"
            },
            {
              "chave": "Só o manual cobre",
              "texto": "O parecer real que dispara a geração do contrato pelo listener",
              "html": "O parecer real que dispara a geração do contrato pelo listener"
            }
          ],
          "metaIndex": {
            "ID": "J-063.W",
            "Tipo": "Positiva",
            "Persona": "financeiro — FINANCEIRO com TOTP habilitado",
            "Superfície": "Web",
            "Pré-condições": "PRE-01 PRE-02 PRE-04 PRE-06 PRE-08 PRE-10 + J-060.W",
            "Endpoints tocados": "POST /credito/propostas/{id}/parecer, GET /propostas/{id}/regras",
            "Step-up": "@RequireStepUp legado — como financeiro tem MFA, exige token",
            "Duração": "8 min",
            "Só o manual cobre": "O parecer real que dispara a geração do contrato pelo listener"
          },
          "notas": [],
          "grupos": [
            {
              "id": "g1",
              "tituloHtml": null,
              "tela": null,
              "implicito": true,
              "passos": [
                {
                  "key": "ROTEIRO-04/J-063.W/P1",
                  "id": "P1",
                  "hash": "0e04b3bc",
                  "textoHtml": "Autenticar como <code>financeiro</code> e localizar a proposta de <code>J-060.W</code>.",
                  "comoHtml": "<strong>Sair da sessão de <code>cliente-a</code> antes</strong> — esta jornada é do outro lado do balcão. Entrar como <code>financeiro@sep.test</code> / <code>roteiro-manual-sep-2026</code> (com código TOTP). O menu agora mostra o grupo <strong>Operação</strong>, que o cliente não via. Localizar a proposta pelo <code>propostaId</code> anotado.",
                  "textoBusca": "autenticar como financeiro e localizar a proposta de j-060.w. sair da sessão de cliente-a antes — esta jornada é do outro lado do balcão. entrar como financeiro@sep.test / roteiro-manual-sep-2026 (com código totp). o menu agora mostra o grupo operação, que o cliente não via. localizar a proposta pelo propostaid anotado.",
                  "esperadoHtml": "FINANCEIRO enxerga propostas de qualquer tomador, com filtros.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 240,
                  "ordem": 1
                },
                {
                  "key": "ROTEIRO-04/J-063.W/P2",
                  "id": "P2",
                  "hash": "a58a6b3a",
                  "textoHtml": "Abrir a trilha de regras avaliadas.",
                  "comoHtml": "Procurar na tela a seção que lista as regras que o motor aplicou. O que se verifica é <strong>coerência</strong>: se o status é <code>PRE_APROVADA</code>, as regras listadas têm de sustentar isso. Trilha vazia ou que contradiz o status é ocorrência — é ela que justifica a decisão para o regulador.",
                  "textoBusca": "abrir a trilha de regras avaliadas. procurar na tela a seção que lista as regras que o motor aplicou. o que se verifica é coerência: se o status é preaprovada, as regras listadas têm de sustentar isso. trilha vazia ou que contradiz o status é ocorrência — é ela que justifica a decisão para o regulador.",
                  "esperadoHtml": "regras, score e sugestão do motor visíveis e coerentes com o status.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 246,
                  "ordem": 2
                },
                {
                  "key": "ROTEIRO-04/J-063.W/P3",
                  "id": "P3",
                  "hash": "cc6ac98b",
                  "textoHtml": "Registrar parecer com decisão <code>PENDENCIA</code>.",
                  "comoHtml": "Escolher <code>PENDENCIA</code> e escrever uma justificativa. <strong>A justificativa tem tamanho mínimo e máximo</strong> (10 a 500 caracteres) — escrever uma frase de verdade, não &quot;teste&quot;. <code>PENDENCIA</code> é estado intermediário: a proposta continua viva e pode voltar a andar.",
                  "textoBusca": "registrar parecer com decisão pendencia. escolher pendencia e escrever uma justificativa. a justificativa tem tamanho mínimo e máximo (10 a 500 caracteres) — escrever uma frase de verdade, não \"teste\". pendencia é estado intermediário: a proposta continua viva e pode voltar a andar.",
                  "esperadoHtml": "status vai para <code>PENDENCIA</code>; <strong>não</strong> é estado final.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 252,
                  "ordem": 3
                },
                {
                  "key": "ROTEIRO-04/J-063.W/P4",
                  "id": "P4",
                  "hash": "9e946e02",
                  "textoHtml": "Registrar parecer com decisão <code>APROVAR</code>, passando pelo step-up.",
                  "comoHtml": "Novo parecer, agora <code>APROVAR</code>. Como <code>financeiro</code> tem MFA, aparece a tela <strong>Confirmação adicional</strong>: clicar em <strong>Iniciar</strong>, digitar o código TOTP <strong>da conta <code>financeiro</code></strong> e <strong>Confirmar</strong>. Este é o passo que dispara a geração do contrato, em segundo plano.",
                  "textoBusca": "registrar parecer com decisão aprovar, passando pelo step-up. novo parecer, agora aprovar. como financeiro tem mfa, aparece a tela confirmação adicional: clicar em iniciar, digitar o código totp da conta financeiro e confirmar. este é o passo que dispara a geração do contrato, em segundo plano.",
                  "esperadoHtml": "status <code>APROVADA</code> (final).",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 257,
                  "ordem": 4
                },
                {
                  "key": "ROTEIRO-04/J-063.W/P5",
                  "id": "P5",
                  "hash": "56ae7f03",
                  "textoHtml": "Tentar registrar um novo parecer na proposta já <code>APROVADA</code>.",
                  "comoHtml": "Tentar registrar mais um parecer na mesma proposta. A recusa é o resultado certo: <code>APROVADA</code> é estado final e não tem saída. Se aceitasse, uma proposta aprovada poderia ser revertida sem trilha.",
                  "textoBusca": "tentar registrar um novo parecer na proposta já aprovada. tentar registrar mais um parecer na mesma proposta. a recusa é o resultado certo: aprovada é estado final e não tem saída. se aceitasse, uma proposta aprovada poderia ser revertida sem trilha.",
                  "esperadoHtml": "recusado — <code>APROVADA</code> é final, sem transição de saída.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 263,
                  "ordem": 5
                },
                {
                  "key": "ROTEIRO-04/J-063.W/P6",
                  "id": "P6",
                  "hash": "81f853d2",
                  "textoHtml": "Aguardar o <code>PropostaAprovadaListener</code> (AFTER_COMMIT) e consultar <code>GET /api/v1/contratos/proposta/{propostaId}</code>.",
                  "comoHtml": "O contrato <strong>não</strong> nasce junto com a aprovação: um processo em segundo plano o cria logo depois. Por isso a primeira consulta pode vir vazia — isso é normal. Esperar alguns segundos e consultar de novo (pelo Insomnia ou pela tela de formalização) até o contrato aparecer. Se depois de um minuto não aparecer, aí sim é ocorrência.",
                  "textoBusca": "aguardar o propostaaprovadalistener (aftercommit) e consultar get /api/v1/contratos/proposta/{propostaid}. o contrato não nasce junto com a aprovação: um processo em segundo plano o cria logo depois. por isso a primeira consulta pode vir vazia — isso é normal. esperar alguns segundos e consultar de novo (pelo insomnia ou pela tela de formalização) até o contrato aparecer. se depois de um minuto não aparecer, aí sim é ocorrência.",
                  "esperadoHtml": "contrato gerado em <strong><code>AGUARDANDO_ACEITE</code></strong>. Reconsultar até aparecer; a geração é assíncrona.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 268,
                  "ordem": 6
                },
                {
                  "key": "ROTEIRO-04/J-063.W/P7",
                  "id": "P7",
                  "hash": "a8f5b437",
                  "textoHtml": "Anotar o <code>contratoId</code>.",
                  "comoHtml": "Copiar o <code>id</code> do contrato da resposta e guardar junto do <code>propostaId</code>. As jornadas <code>J-070.W</code>, <code>J-070.W-N2</code>, <code>J-071.A</code> e <code>J-073.M</code> todas dependem dele — perder esse valor significa refazer a cadeia inteira.",
                  "textoBusca": "anotar o contratoid. copiar o id do contrato da resposta e guardar junto do propostaid. as jornadas j-070.w, j-070.w-n2, j-071.a e j-073.m todas dependem dele — perder esse valor significa refazer a cadeia inteira.",
                  "esperadoHtml": null,
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 276,
                  "ordem": 7
                }
              ]
            }
          ],
          "assercoes": [],
          "linha": 224,
          "stats": {
            "passos": 7,
            "na": 0,
            "assercoes": 0
          }
        },
        {
          "key": "ROTEIRO-04/J-070.W",
          "id": "J-070.W",
          "escopoId": "J-070.W",
          "kind": "jornada",
          "nivel": 3,
          "titulo": "Tomador aceita o contrato com step-up estrito",
          "anchor": "j-070w---tomador-aceita-o-contrato-com-step-up-estrito",
          "ordem": 5,
          "meta": [
            {
              "chave": "ID",
              "texto": "J-070.W",
              "html": "<code>J-070.W</code>"
            },
            {
              "chave": "Tipo",
              "texto": "Positiva",
              "html": "Positiva"
            },
            {
              "chave": "Persona",
              "texto": "cliente-a — CLIENTE dono, com TOTP habilitado",
              "html": "<code>cliente-a</code> — CLIENTE dono, <strong>com</strong> TOTP habilitado"
            },
            {
              "chave": "Superfície",
              "texto": "Web",
              "html": "Web"
            },
            {
              "chave": "Pré-condições",
              "texto": "PRE-01 PRE-02 PRE-04 PRE-07 PRE-10 + J-063.W",
              "html": "<code>PRE-01</code> <code>PRE-02</code> <code>PRE-04</code> <code>PRE-07</code> <code>PRE-10</code> + <code>J-063.W</code>"
            },
            {
              "chave": "Endpoints tocados",
              "texto": "PATCH /api/v1/contratos/{id}/aceite",
              "html": "<code>PATCH /api/v1/contratos/{id}/aceite</code>"
            },
            {
              "chave": "Step-up",
              "texto": "Estrito — sem MFA, nega 403 antes de validar o token",
              "html": "<strong>Estrito</strong> — sem MFA, nega 403 antes de validar o token"
            },
            {
              "chave": "Duração",
              "texto": "10 min",
              "html": "10 min"
            },
            {
              "chave": "Automação equivalente",
              "texto": "golden-path.spec.ts (parcial, com step-up mockado)",
              "html": "<a href=\"../../../sep-app/e2e/golden-path.spec.ts\" rel=\"noreferrer\"><code>golden-path.spec.ts</code></a> (parcial, com step-up mockado)"
            },
            {
              "chave": "Só o manual cobre",
              "texto": "TOTP real, consumo único do token, integridade do hash SHA-256",
              "html": "TOTP real, consumo único do token, integridade do hash SHA-256"
            }
          ],
          "metaIndex": {
            "ID": "J-070.W",
            "Tipo": "Positiva",
            "Persona": "cliente-a — CLIENTE dono, com TOTP habilitado",
            "Superfície": "Web",
            "Pré-condições": "PRE-01 PRE-02 PRE-04 PRE-07 PRE-10 + J-063.W",
            "Endpoints tocados": "PATCH /api/v1/contratos/{id}/aceite",
            "Step-up": "Estrito — sem MFA, nega 403 antes de validar o token",
            "Duração": "10 min",
            "Automação equivalente": "golden-path.spec.ts (parcial, com step-up mockado)",
            "Só o manual cobre": "TOTP real, consumo único do token, integridade do hash SHA-256"
          },
          "notas": [],
          "grupos": [
            {
              "id": "g2",
              "tituloHtml": "Tela <code>/app/formalizacao/proposta/{propostaId}</code>",
              "tela": "/app/formalizacao/proposta/{propostaId}",
              "implicito": false,
              "passos": [
                {
                  "key": "ROTEIRO-04/J-070.W/P1",
                  "id": "P1",
                  "hash": "a59b0fe5",
                  "textoHtml": "Como <code>cliente-a</code>, abrir <strong>Formalização</strong> e localizar a proposta.",
                  "comoHtml": "Sair da sessão do <code>financeiro</code> e entrar como <code>cliente-a</code>. Menu lateral, grupo <strong>Jornadas</strong>, item <strong>Formalização</strong>. O contrato que aparece aqui é o que o <code>financeiro</code> gerou ao aprovar, na <code>J-063.W</code>.",
                  "textoBusca": "como cliente-a, abrir formalização e localizar a proposta. sair da sessão do financeiro e entrar como cliente-a. menu lateral, grupo jornadas, item formalização. o contrato que aparece aqui é o que o financeiro gerou ao aprovar, na j-063.w.",
                  "esperadoHtml": "contrato vinculado em <code>AGUARDANDO_ACEITE</code>.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 302,
                  "ordem": 1
                },
                {
                  "key": "ROTEIRO-04/J-070.W/P2",
                  "id": "P2",
                  "hash": "2cbf29a9",
                  "textoHtml": "Abrir o contrato e ler a minuta.",
                  "comoHtml": "<strong>Ler de verdade, comparando com a proposta.</strong> O valor e o prazo têm de bater com o que foi aprovado. Este é o documento que a pessoa vai assinar juridicamente: campo vazio, <code>null</code>, <code>undefined</code> ou <code>[object Object]</code> na tela é ocorrência séria, mesmo que a tela &quot;funcione&quot;.",
                  "textoBusca": "abrir o contrato e ler a minuta. ler de verdade, comparando com a proposta. o valor e o prazo têm de bater com o que foi aprovado. este é o documento que a pessoa vai assinar juridicamente: campo vazio, null, undefined ou [object object] na tela é ocorrência séria, mesmo que a tela \"funcione\".",
                  "esperadoHtml": "valor, prazo e cláusulas conferem com a proposta aprovada. Nenhum campo vazio ou <code>null</code> na tela.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 307,
                  "ordem": 2
                },
                {
                  "key": "ROTEIRO-04/J-070.W/P3",
                  "id": "P3",
                  "hash": "f66b5682",
                  "textoHtml": "Conferir a lista de versões (<code>GET /contratos/{id}/versoes</code>).",
                  "comoHtml": "Pelo Insomnia ou pela própria tela, se ela exibir versões. O hash é uma sequência de 64 caracteres entre letras e números — <strong>contar os caracteres</strong> se estiver em dúvida. Ele é a impressão digital do documento: serve para provar depois que o contrato assinado é exatamente este, sem alteração.",
                  "textoBusca": "conferir a lista de versões (get /contratos/{id}/versoes). pelo insomnia ou pela própria tela, se ela exibir versões. o hash é uma sequência de 64 caracteres entre letras e números — contar os caracteres se estiver em dúvida. ele é a impressão digital do documento: serve para provar depois que o contrato assinado é exatamente este, sem alteração.",
                  "esperadoHtml": "ordem ascendente; a versão vigente tem hash SHA-256 de 64 caracteres.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 314,
                  "ordem": 3
                }
              ]
            },
            {
              "id": "g3",
              "tituloHtml": "Tela <code>/app/formalizacao/contratos/{contratoId}</code>",
              "tela": "/app/formalizacao/contratos/{contratoId}",
              "implicito": false,
              "passos": [
                {
                  "key": "ROTEIRO-04/J-070.W/P4",
                  "id": "P4",
                  "hash": "6c6c538b",
                  "textoHtml": "Clicar em <strong>Aceitar contrato</strong>.",
                  "comoHtml": "O botão fica no fim da minuta; rolar a página até alcançá-lo. <strong>Conferir o status antes de prosseguir</strong>: ele tem de continuar <code>AGUARDANDO_ACEITE</code>. Se mudasse já no clique, o aceite estaria sendo registrado antes da confirmação de identidade — que é exatamente o que esta jornada existe para impedir.",
                  "textoBusca": "clicar em aceitar contrato. o botão fica no fim da minuta; rolar a página até alcançá-lo. conferir o status antes de prosseguir: ele tem de continuar aguardandoaceite. se mudasse já no clique, o aceite estaria sendo registrado antes da confirmação de identidade — que é exatamente o que esta jornada existe para impedir.",
                  "esperadoHtml": "vai para o step-up. O status <strong>continua</strong> <code>AGUARDANDO_ACEITE</code> — nenhuma mutação ocorreu ainda.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 323,
                  "ordem": 1
                },
                {
                  "key": "ROTEIRO-04/J-070.W/P5",
                  "id": "P5",
                  "hash": "49564063",
                  "textoHtml": "Informar o código TOTP corrente.",
                  "comoHtml": "Na tela <strong>Confirmação adicional</strong>: <strong>Iniciar</strong>, código da conta <code>cliente-a</code>, <strong>Confirmar</strong>. Ao voltar, <strong>olhar o status de novo</strong>: ainda tem de ser <code>AGUARDANDO_ACEITE</code>. Passar no step-up dá permissão para aceitar; não é o aceite.",
                  "textoBusca": "informar o código totp corrente. na tela confirmação adicional: iniciar, código da conta cliente-a, confirmar. ao voltar, olhar o status de novo: ainda tem de ser aguardandoaceite. passar no step-up dá permissão para aceitar; não é o aceite.",
                  "esperadoHtml": "volta à tela de origem preservando o contexto. <strong>O retorno do step-up não pode, sozinho, registrar o aceite.</strong>",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 330,
                  "ordem": 2
                },
                {
                  "key": "ROTEIRO-04/J-070.W/P6",
                  "id": "P6",
                  "hash": "f4491905",
                  "textoHtml": "Confirmar o aceite.",
                  "comoHtml": "Agora sim, confirmar. Com o DevTools na aba <strong>Network</strong>, clicar na chamada de aceite e conferir em <strong>Headers</strong> que existe o <code>X-Step-Up-Token</code>. <strong>Anotar o horário</strong> — ajuda a localizar o evento no audit log do P9.",
                  "textoBusca": "confirmar o aceite. agora sim, confirmar. com o devtools na aba network, clicar na chamada de aceite e conferir em headers que existe o x-step-up-token. anotar o horário — ajuda a localizar o evento no audit log do p9.",
                  "esperadoHtml": "<code>PATCH .../aceite</code> sai com <code>X-Step-Up-Token</code>; <code>200</code> com <code>status = ACEITO</code>.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 336,
                  "ordem": 3
                },
                {
                  "key": "ROTEIRO-04/J-070.W/P7",
                  "id": "P7",
                  "hash": "9a2440b3",
                  "textoHtml": "Reconsultar <code>GET /api/v1/contratos/{id}/assinatura/status</code>.",
                  "comoHtml": "Outro processo assíncrono, como o do <code>J-063.W</code> P6: aceitar dispara o envio para o provedor de assinatura em segundo plano. Consultar pelo Insomnia, repetindo até o status mudar. <strong>Anotar o <code>idEnvelopeExterno</code></strong> — a <code>J-071.A</code> precisa dele para simular o webhook de assinatura.",
                  "textoBusca": "reconsultar get /api/v1/contratos/{id}/assinatura/status. outro processo assíncrono, como o do j-063.w p6: aceitar dispara o envio para o provedor de assinatura em segundo plano. consultar pelo insomnia, repetindo até o status mudar. anotar o idenvelopeexterno — a j-071.a precisa dele para simular o webhook de assinatura.",
                  "esperadoHtml": "após o <code>ContratoAceitoListener</code>, <code>statusContrato = EM_ASSINATURA</code> e <code>statusEnvelope = ENVIADO</code>. Anotar o <code>idEnvelopeExterno</code> (formato <code>fake-env-&lt;idempotencyKey&gt;</code> no provider Fake).",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 341,
                  "ordem": 4
                },
                {
                  "key": "ROTEIRO-04/J-070.W/P8",
                  "id": "P8",
                  "hash": "532cd11c",
                  "textoHtml": "Tentar aceitar o <strong>mesmo</strong> contrato de novo.",
                  "comoHtml": "Voltar à tela do contrato e tentar aceitar outra vez (se o botão sumiu, repetir a chamada pelo Insomnia). O <strong>409</strong> é o resultado correto: o contrato já saiu de <code>AGUARDANDO_ACEITE</code>, e aceitar duas vezes criaria dois atos jurídicos para uma dívida só.",
                  "textoBusca": "tentar aceitar o mesmo contrato de novo. voltar à tela do contrato e tentar aceitar outra vez (se o botão sumiu, repetir a chamada pelo insomnia). o 409 é o resultado correto: o contrato já saiu de aguardandoaceite, e aceitar duas vezes criaria dois atos jurídicos para uma dívida só.",
                  "esperadoHtml": "<strong>409</strong> de estado inválido — <code>AGUARDANDO_ACEITE</code> era pré-condição.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 349,
                  "ordem": 5
                },
                {
                  "key": "ROTEIRO-04/J-070.W/P9",
                  "id": "P9",
                  "hash": "9e67c738",
                  "textoHtml": "Conferir o audit log.",
                  "comoHtml": "Terminal do banco. Procurar o evento de aceite no horário anotado no P6. Além de existir, ele precisa carregar <strong>evidência técnica</strong> — hash do documento, IP e user-agent. É o que permite provar mais tarde quem aceitou, o quê e de onde.",
                  "textoBusca": "conferir o audit log. terminal do banco. procurar o evento de aceite no horário anotado no p6. além de existir, ele precisa carregar evidência técnica — hash do documento, ip e user-agent. é o que permite provar mais tarde quem aceitou, o quê e de onde.",
                  "esperadoHtml": "aceite registrado com evidência técnica (hash, IP, user-agent).",
                  "blocos": [
                    {
                      "tipo": "codigo",
                      "lang": "bash",
                      "regiao": "como",
                      "conteudo": "docker exec sep-postgres psql -U sep -d sep_dev \\\n  -c \"SELECT tipo, data_evento FROM audit_log_seguranca ORDER BY data_evento DESC LIMIT 5;\""
                    }
                  ],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 355,
                  "ordem": 6
                }
              ]
            }
          ],
          "assercoes": [
            {
              "key": "ROTEIRO-04/J-070.W/#bed1b9ae",
              "id": null,
              "hash": "b4a19841",
              "textoHtml": "Contrato em <code>EM_ASSINATURA</code> com envelope criado",
              "comoHtml": null,
              "textoBusca": "contrato em emassinatura com envelope criado",
              "esperadoHtml": null,
              "blocos": [],
              "na": false,
              "naMotivo": null,
              "marcadoNaFonte": false,
              "linha": 367,
              "ordem": 1
            },
            {
              "key": "ROTEIRO-04/J-070.W/#45848496",
              "id": null,
              "hash": "a731021e",
              "textoHtml": "Um único aceite registrado, mesmo com P8",
              "comoHtml": null,
              "textoBusca": "um único aceite registrado, mesmo com p8",
              "esperadoHtml": null,
              "blocos": [],
              "na": false,
              "naMotivo": null,
              "marcadoNaFonte": false,
              "linha": 368,
              "ordem": 2
            }
          ],
          "linha": 283,
          "stats": {
            "passos": 9,
            "na": 0,
            "assercoes": 2
          }
        },
        {
          "key": "ROTEIRO-04/J-070.W-N1",
          "id": "J-070.W-N1",
          "escopoId": "J-070.W-N1",
          "kind": "jornada",
          "nivel": 3,
          "titulo": "Aceite negado para usuário sem MFA",
          "anchor": "j-070w-n1---aceite-negado-para-usurio-sem-mfa",
          "ordem": 6,
          "meta": [
            {
              "chave": "ID",
              "texto": "J-070.W-N1",
              "html": "<code>J-070.W-N1</code>"
            },
            {
              "chave": "Tipo",
              "texto": "Negativa — controle de acesso",
              "html": "Negativa — controle de acesso"
            },
            {
              "chave": "Jornada pai",
              "texto": "J-070.W",
              "html": "<a href=\"#j-070w---tomador-aceita-o-contrato-com-step-up-estrito\" rel=\"noreferrer\"><code>J-070.W</code></a>"
            },
            {
              "chave": "Persona",
              "texto": "cliente-b — CLIENTE, sem TOTP",
              "html": "<code>cliente-b</code> — CLIENTE, <strong>sem</strong> TOTP"
            },
            {
              "chave": "Superfície",
              "texto": "Web + API",
              "html": "Web + API"
            },
            {
              "chave": "Vetor",
              "texto": "@RequireStepUpEstrito sem MFA cadastrado",
              "html": "<code>@RequireStepUpEstrito</code> sem MFA cadastrado"
            },
            {
              "chave": "Comportamento seguro esperado",
              "texto": "403, nenhuma mutação, corpo genérico",
              "html": "<strong>403</strong>, nenhuma mutação, corpo genérico"
            },
            {
              "chave": "Pré-condições",
              "texto": "PRE-01 PRE-04 PRE-09 + contrato próprio de cliente-b em AGUARDANDOACEITE",
              "html": "<code>PRE-01</code> <code>PRE-04</code> <code>PRE-09</code> + contrato próprio de <code>cliente-b</code> em <code>AGUARDANDO_ACEITE</code>"
            },
            {
              "chave": "Automação equivalente",
              "texto": "ContratoControllerTest (unitário); nenhuma E2E",
              "html": "<code>ContratoControllerTest</code> (unitário); nenhuma E2E"
            }
          ],
          "metaIndex": {
            "ID": "J-070.W-N1",
            "Tipo": "Negativa — controle de acesso",
            "Jornada pai": "J-070.W",
            "Persona": "cliente-b — CLIENTE, sem TOTP",
            "Superfície": "Web + API",
            "Vetor": "@RequireStepUpEstrito sem MFA cadastrado",
            "Comportamento seguro esperado": "403, nenhuma mutação, corpo genérico",
            "Pré-condições": "PRE-01 PRE-04 PRE-09 + contrato próprio de cliente-b em AGUARDANDOACEITE",
            "Automação equivalente": "ContratoControllerTest (unitário); nenhuma E2E"
          },
          "notas": [
            "Esta jornada <strong>fecha o bloqueio de go-live da Sprint 27</strong>. Se ela passar (aceite concluído sem MFA), o bypass pré-MFA voltou e o ato legal esta desprotegido.",
            "<strong>Esta jornada precisa de um contrato do próprio <code>cliente-b</code> em <code>AGUARDANDO_ACEITE</code></strong> — não serve o do <code>cliente-a</code>, senão você estaria testando ownership (que é a <a href=\"#j-070w-n2---aceite-de-contrato-alheio\" rel=\"noreferrer\"><code>J-070.W-N2</code></a>) e não ausência de MFA. Para produzi-lo: <code>cliente-b</code> precisa de onboarding aprovado e de uma proposta aprovada pelo <code>financeiro</code>, repetindo <code>J-060.W</code> e <code>J-063.W</code> com essa persona. <strong><code>cliente-b</code> tem de continuar sem TOTP</strong> — é a condição do teste."
          ],
          "grupos": [
            {
              "id": "g1",
              "tituloHtml": null,
              "tela": null,
              "implicito": true,
              "passos": [
                {
                  "key": "ROTEIRO-04/J-070.W-N1/P1",
                  "id": "P1",
                  "hash": "0d8b2fe5",
                  "textoHtml": "Autenticar como <code>cliente-b</code> e abrir o próprio contrato.",
                  "comoHtml": "Entrar como <code>cliente-b</code> (senha <code>jornada-ownership-sep-2026-v2</code> se a <code>J-022.W-N1</code> já rodou) e abrir a formalização do contrato dele. <strong>Ler o contrato funciona sem MFA</strong> — a proteção é sobre o ato de aceitar, não sobre a leitura.",
                  "textoBusca": "autenticar como cliente-b e abrir o próprio contrato. entrar como cliente-b (senha jornada-ownership-sep-2026-v2 se a j-022.w-n1 já rodou) e abrir a formalização do contrato dele. ler o contrato funciona sem mfa — a proteção é sobre o ato de aceitar, não sobre a leitura.",
                  "esperadoHtml": "tela carrega normalmente — leitura não exige step-up.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 398,
                  "ordem": 1
                },
                {
                  "key": "ROTEIRO-04/J-070.W-N1/P2",
                  "id": "P2",
                  "hash": "ba8ed1f6",
                  "textoHtml": "Clicar em <strong>Aceitar contrato</strong>.",
                  "comoHtml": "Aqui o 403 é o resultado desejado. Além do erro, avaliar a <strong>mensagem</strong>: ela deve orientar a habilitar a verificação em duas etapas. O que não pode existir é qualquer atalho oferecido ali — &quot;continuar mesmo assim&quot;, &quot;pular esta etapa&quot; — que permita aceitar sem MFA.",
                  "textoBusca": "clicar em aceitar contrato. aqui o 403 é o resultado desejado. além do erro, avaliar a mensagem: ela deve orientar a habilitar a verificação em duas etapas. o que não pode existir é qualquer atalho oferecido ali — \"continuar mesmo assim\", \"pular esta etapa\" — que permita aceitar sem mfa.",
                  "esperadoHtml": "<strong>403</strong>. A mensagem orienta habilitar MFA e <strong>não</strong> oferece caminho alternativo que burle o step-up.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 403,
                  "ordem": 2
                },
                {
                  "key": "ROTEIRO-04/J-070.W-N1/P3",
                  "id": "P3",
                  "hash": "43e96a65",
                  "textoHtml": "Conferir o status do contrato após o erro.",
                  "comoHtml": "Recarregar a tela do contrato. Uma negação não pode deixar rastro: se o status tivesse mudado, a operação teria acontecido pela metade.",
                  "textoBusca": "conferir o status do contrato após o erro. recarregar a tela do contrato. uma negação não pode deixar rastro: se o status tivesse mudado, a operação teria acontecido pela metade.",
                  "esperadoHtml": "segue <code>AGUARDANDO_ACEITE</code>. A negação não pode ter efeito colateral.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 410,
                  "ordem": 3
                },
                {
                  "key": "ROTEIRO-04/J-070.W-N1/P4",
                  "id": "P4",
                  "hash": "2bc56ba1",
                  "textoHtml": "Chamar <code>PATCH /api/v1/contratos/{id}/aceite</code> direto na API, sem <code>X-Step-Up-Token</code>.",
                  "comoHtml": "Pelo Insomnia, autenticado como <code>cliente-b</code>, sem o header de step-up. Repete a lógica do P2 sem passar pela tela — porque bloquear só na interface não é bloquear.",
                  "textoBusca": "chamar patch /api/v1/contratos/{id}/aceite direto na api, sem x-step-up-token. pelo insomnia, autenticado como cliente-b, sem o header de step-up. repete a lógica do p2 sem passar pela tela — porque bloquear só na interface não é bloquear.",
                  "esperadoHtml": "<strong>403</strong>.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 414,
                  "ordem": 4
                },
                {
                  "key": "ROTEIRO-04/J-070.W-N1/P5",
                  "id": "P5",
                  "hash": "603cfe09",
                  "textoHtml": "Emitir um step-up token por <code>initiate</code> + <code>complete</code> e repetir <strong>P4</strong> com o header preenchido.",
                  "comoHtml": "<strong>Este é o passo decisivo da jornada, e o mais fácil de executar errado.</strong> <code>cliente-b</code> não tem TOTP, então o <code>complete</code> provavelmente falha — se falhar, registre isso e o passo está cumprido: sem MFA não há como obter o token. Se por algum motivo você conseguir um token e a chamada <strong>ainda assim</strong> der 403, é o resultado ideal: o estrito recusa por ausência de MFA <strong>antes</strong> de olhar o token. O que seria falha grave é a chamada dar <code>200</code>.",
                  "textoBusca": "emitir um step-up token por initiate + complete e repetir p4 com o header preenchido. este é o passo decisivo da jornada, e o mais fácil de executar errado. cliente-b não tem totp, então o complete provavelmente falha — se falhar, registre isso e o passo está cumprido: sem mfa não há como obter o token. se por algum motivo você conseguir um token e a chamada ainda assim der 403, é o resultado ideal: o estrito recusa por ausência de mfa antes de olhar o token. o que seria falha grave é a chamada dar 200.",
                  "esperadoHtml": "ainda <strong>403</strong> — o estrito nega por ausência de MFA <strong>antes</strong> de validar o token. Este é o passo que distingue estrito de legado.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 419,
                  "ordem": 5
                },
                {
                  "key": "ROTEIRO-04/J-070.W-N1/P6",
                  "id": "P6",
                  "hash": "258ae285",
                  "textoHtml": "Conferir o corpo dos 403.",
                  "comoHtml": "Ler o corpo das respostas 403 no Insomnia. Não pode vazar id de usuário, nome de classe, caminho de arquivo nem explicação do tipo &quot;usuário não possui MFA&quot; — mensagem detalhada demais ensina o atacante a ajustar a tentativa.",
                  "textoBusca": "conferir o corpo dos 403. ler o corpo das respostas 403 no insomnia. não pode vazar id de usuário, nome de classe, caminho de arquivo nem explicação do tipo \"usuário não possui mfa\" — mensagem detalhada demais ensina o atacante a ajustar a tentativa.",
                  "esperadoHtml": "genérico (&quot;Acesso negado&quot;), sem UUID, sem stack trace, sem detalhe interno.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 429,
                  "ordem": 6
                }
              ]
            }
          ],
          "assercoes": [],
          "linha": 372,
          "stats": {
            "passos": 6,
            "na": 0,
            "assercoes": 0
          }
        },
        {
          "key": "ROTEIRO-04/J-070.W-N2",
          "id": "J-070.W-N2",
          "escopoId": "J-070.W-N2",
          "kind": "jornada",
          "nivel": 3,
          "titulo": "Aceite de contrato alheio",
          "anchor": "j-070w-n2---aceite-de-contrato-alheio",
          "ordem": 7,
          "meta": [
            {
              "chave": "ID",
              "texto": "J-070.W-N2",
              "html": "<code>J-070.W-N2</code>"
            },
            {
              "chave": "Tipo",
              "texto": "Negativa — ownership",
              "html": "Negativa — ownership"
            },
            {
              "chave": "Jornada pai",
              "texto": "J-070.W",
              "html": "<a href=\"#j-070w---tomador-aceita-o-contrato-com-step-up-estrito\" rel=\"noreferrer\"><code>J-070.W</code></a>"
            },
            {
              "chave": "Persona",
              "texto": "cliente-b agindo sobre o contrato de cliente-a",
              "html": "<code>cliente-b</code> agindo sobre o contrato de <code>cliente-a</code>"
            },
            {
              "chave": "Superfície",
              "texto": "API",
              "html": "API"
            },
            {
              "chave": "Vetor",
              "texto": "IDOR — manipular o contratoId na URL",
              "html": "IDOR — manipular o <code>contratoId</code> na URL"
            },
            {
              "chave": "Comportamento seguro esperado",
              "texto": "403 de ownership, sem vazar dado do titular",
              "html": "<strong>403</strong> de ownership, sem vazar dado do titular"
            },
            {
              "chave": "Pré-condições",
              "texto": "PRE-01 PRE-04 + contratoId de cliente-a (de J-063.W)",
              "html": "<code>PRE-01</code> <code>PRE-04</code> + <code>contratoId</code> de <code>cliente-a</code> (de <code>J-063.W</code>)"
            }
          ],
          "metaIndex": {
            "ID": "J-070.W-N2",
            "Tipo": "Negativa — ownership",
            "Jornada pai": "J-070.W",
            "Persona": "cliente-b agindo sobre o contrato de cliente-a",
            "Superfície": "API",
            "Vetor": "IDOR — manipular o contratoId na URL",
            "Comportamento seguro esperado": "403 de ownership, sem vazar dado do titular",
            "Pré-condições": "PRE-01 PRE-04 + contratoId de cliente-a (de J-063.W)"
          },
          "notas": [],
          "grupos": [
            {
              "id": "g1",
              "tituloHtml": null,
              "tela": null,
              "implicito": true,
              "passos": [
                {
                  "key": "ROTEIRO-04/J-070.W-N2/P1",
                  "id": "P1",
                  "hash": "fa93d3da",
                  "textoHtml": "Autenticado como <code>cliente-b</code>, chamar <code>GET /api/v1/contratos/{contratoId-do-cliente-a}</code>.",
                  "comoHtml": "<strong>IDOR</strong> é isto: trocar um identificador na URL para alcançar dado de outra pessoa. No Insomnia, autenticar como <code>cliente-b</code> e colocar na URL o <code>contratoId</code> do <code>cliente-a</code> (o da <code>J-063.W</code> P7). Além do 403, <strong>ler o corpo da resposta</strong>: nem um pedaço do dado alheio pode aparecer ali — nem valor, nem nome, nem documento.",
                  "textoBusca": "autenticado como cliente-b, chamar get /api/v1/contratos/{contratoid-do-cliente-a}. idor é isto: trocar um identificador na url para alcançar dado de outra pessoa. no insomnia, autenticar como cliente-b e colocar na url o contratoid do cliente-a (o da j-063.w p7). além do 403, ler o corpo da resposta: nem um pedaço do dado alheio pode aparecer ali — nem valor, nem nome, nem documento.",
                  "esperadoHtml": "<strong>403</strong>. O corpo <strong>não</strong> pode conter valor, CPF ou nome do <code>cliente-a</code>.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 452,
                  "ordem": 1
                },
                {
                  "key": "ROTEIRO-04/J-070.W-N2/P2",
                  "id": "P2",
                  "hash": "1175047f",
                  "textoHtml": "Chamar <code>PATCH .../aceite</code> no mesmo contrato, com step-up válido do <code>cliente-b</code>.",
                  "comoHtml": "Se <code>cliente-b</code> não tem MFA, use <code>cliente-a</code>... <strong>não</strong> — a persona tem de ser <code>cliente-b</code> mesmo. O ponto do passo é que um step-up legítimo <strong>da pessoa errada</strong> não dá acesso: identidade confirmada e permissão sobre o recurso são coisas diferentes. Se não conseguir emitir o token por falta de MFA, registre isso; o passo continua provando o que precisa.",
                  "textoBusca": "chamar patch .../aceite no mesmo contrato, com step-up válido do cliente-b. se cliente-b não tem mfa, use cliente-a... não — a persona tem de ser cliente-b mesmo. o ponto do passo é que um step-up legítimo da pessoa errada não dá acesso: identidade confirmada e permissão sobre o recurso são coisas diferentes. se não conseguir emitir o token por falta de mfa, registre isso; o passo continua provando o que precisa.",
                  "esperadoHtml": "<strong>403</strong> de ownership. Token válido <strong>não</strong> compensa ownership ausente.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 459,
                  "ordem": 2
                },
                {
                  "key": "ROTEIRO-04/J-070.W-N2/P3",
                  "id": "P3",
                  "hash": "d38a8ed0",
                  "textoHtml": "Repetir <strong>P1</strong> pela URL do web (<code>/app/formalizacao/contratos/{id}</code>).",
                  "comoHtml": "Logado como <code>cliente-b</code> no navegador, colar <code>http://localhost:4200/app/formalizacao/contratos/&lt;contratoId-do-cliente-a&gt;</code>. Observar a tela <strong>no instante do carregamento</strong>: o defeito seria os dados do contrato alheio aparecerem por um segundo antes do erro. Vazamento de um segundo é vazamento.",
                  "textoBusca": "repetir p1 pela url do web (/app/formalizacao/contratos/{id}). logado como cliente-b no navegador, colar http://localhost:4200/app/formalizacao/contratos/<contratoid-do-cliente-a>. observar a tela no instante do carregamento: o defeito seria os dados do contrato alheio aparecerem por um segundo antes do erro. vazamento de um segundo é vazamento.",
                  "esperadoHtml": "acesso negado na UI, sem renderizar dado parcial antes do erro.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 467,
                  "ordem": 3
                },
                {
                  "key": "ROTEIRO-04/J-070.W-N2/P4",
                  "id": "P4",
                  "hash": "46b96c96",
                  "textoHtml": "Como <code>cliente-a</code>, conferir que o contrato segue intacto.",
                  "comoHtml": "Voltar para a sessão de <code>cliente-a</code> e abrir o contrato. As tentativas do <code>cliente-b</code> não podem ter mudado nada — nem status, nem qualquer campo.",
                  "textoBusca": "como cliente-a, conferir que o contrato segue intacto. voltar para a sessão de cliente-a e abrir o contrato. as tentativas do cliente-b não podem ter mudado nada — nem status, nem qualquer campo.",
                  "esperadoHtml": "<code>AGUARDANDO_ACEITE</code> ou <code>EM_ASSINATURA</code>, conforme o ponto do roteiro.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 473,
                  "ordem": 4
                }
              ]
            }
          ],
          "assercoes": [],
          "linha": 437,
          "stats": {
            "passos": 4,
            "na": 0,
            "assercoes": 0
          }
        },
        {
          "key": "ROTEIRO-04/J-071.A",
          "id": "J-071.A",
          "escopoId": "J-071.A",
          "kind": "jornada",
          "nivel": 3,
          "titulo": "Assinatura concluída por webhook e download da CCB",
          "anchor": "j-071a---assinatura-concluda-por-webhook-e-download-da-ccb",
          "ordem": 8,
          "meta": [
            {
              "chave": "ID",
              "texto": "J-071.A",
              "html": "<code>J-071.A</code>"
            },
            {
              "chave": "Tipo",
              "texto": "Positiva",
              "html": "Positiva"
            },
            {
              "chave": "Persona",
              "texto": "Provider de assinatura (simulado) + cliente-a",
              "html": "Provider de assinatura (simulado) + <code>cliente-a</code>"
            },
            {
              "chave": "Superfície",
              "texto": "API + Web",
              "html": "API + Web"
            },
            {
              "chave": "Pré-condições",
              "texto": "PRE-01 PRE-04 + J-070.W concluída (contrato em EMASSINATURA)",
              "html": "<code>PRE-01</code> <code>PRE-04</code> + <code>J-070.W</code> concluída (contrato em <code>EM_ASSINATURA</code>)"
            },
            {
              "chave": "Endpoints tocados",
              "texto": "POST /api/v1/webhooks/assinatura/clicksign, GET /contratos/{id}/assinatura/status, GET /contratos/{id}/documento-assinado",
              "html": "<code>POST /api/v1/webhooks/assinatura/clicksign</code>, <code>GET /contratos/{id}/assinatura/status</code>, <code>GET /contratos/{id}/documento-assinado</code>"
            },
            {
              "chave": "Duração",
              "texto": "10 min",
              "html": "10 min"
            },
            {
              "chave": "Só o manual cobre",
              "texto": "O ciclo completo de callback, dedup e integridade do documento",
              "html": "O ciclo completo de callback, dedup e integridade do documento"
            }
          ],
          "metaIndex": {
            "ID": "J-071.A",
            "Tipo": "Positiva",
            "Persona": "Provider de assinatura (simulado) + cliente-a",
            "Superfície": "API + Web",
            "Pré-condições": "PRE-01 PRE-04 + J-070.W concluída (contrato em EMASSINATURA)",
            "Endpoints tocados": "POST /api/v1/webhooks/assinatura/clicksign, GET /contratos/{id}/assinatura/status, GET /contratos/{id}/documento-assinado",
            "Duração": "10 min",
            "Só o manual cobre": "O ciclo completo de callback, dedup e integridade do documento"
          },
          "notas": [
            "O webhook e público mas exige HMAC. O segredo de desenvolvimento e <code>dev-clicksign-webhook-secret-change-me</code> (default de <code>app.webhooks.secrets</code>); em qualquer ambiente que não seja local ele <strong>precisa</strong> ser trocado. Preencha <code>clicksignWebhookSecret</code> no environment antes de começar — a collection calcula a assinatura a partir dele."
          ],
          "grupos": [
            {
              "id": "g1",
              "tituloHtml": null,
              "tela": null,
              "implicito": true,
              "passos": [
                {
                  "key": "ROTEIRO-04/J-071.A/P1",
                  "id": "P1",
                  "hash": "7336edfb",
                  "textoHtml": "Insomnia &gt; <strong>Webhook Assinatura Digital</strong> &gt; <code>POST /webhooks/assinatura/clicksign — sign (202)</code>, com <code>idEnvelopeExterno</code> preenchido no environment. Body:",
                  "comoHtml": "Você está no papel do provedor de assinatura: este request simula o aviso de &quot;documento assinado&quot; que a empresa de assinatura digital mandaria. Antes de enviar, conferir no environment que <code>idEnvelopeExterno</code> (anotado na <code>J-070.W</code> P7) e <code>clicksignWebhookSecret</code> estão preenchidos — sem o segredo, a assinatura HMAC sai errada e você recebe 401 em vez de 202. Body:",
                  "textoBusca": "insomnia > webhook assinatura digital > post /webhooks/assinatura/clicksign — sign (202), com idenvelopeexterno preenchido no environment. body: você está no papel do provedor de assinatura: este request simula o aviso de \"documento assinado\" que a empresa de assinatura digital mandaria. antes de enviar, conferir no environment que idenvelopeexterno (anotado na j-070.w p7) e clicksignwebhooksecret estão preenchidos — sem o segredo, a assinatura hmac sai errada e você recebe 401 em vez de 202. body:",
                  "esperadoHtml": "<strong>202</strong>.",
                  "blocos": [
                    {
                      "tipo": "codigo",
                      "lang": "json",
                      "regiao": "como",
                      "conteudo": "{\n  \"event\": { \"name\": \"sign\", \"occurred_at\": \"2026-07-21T12:00:00Z\" },\n  \"document\": { \"key\": \"{{ idEnvelopeExterno }}\" }\n}"
                    }
                  ],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 501,
                  "ordem": 1
                },
                {
                  "key": "ROTEIRO-04/J-071.A/P2",
                  "id": "P2",
                  "hash": "be72ff72",
                  "textoHtml": "Insomnia &gt; <strong>Webhook Assinatura Digital</strong> &gt; <code>POST /webhooks/assinatura/clicksign (HMAC invalido) — 401</code>.",
                  "comoHtml": "Este request tem a assinatura propositalmente errada. É o teste de que <strong>qualquer pessoa na internet</strong> pode chamar esse endereço, mas só quem tem o segredo consegue mudar alguma coisa. Se responder 202, qualquer um poderia declarar um contrato como assinado — é a ocorrência mais grave deste roteiro.",
                  "textoBusca": "insomnia > webhook assinatura digital > post /webhooks/assinatura/clicksign (hmac invalido) — 401. este request tem a assinatura propositalmente errada. é o teste de que qualquer pessoa na internet pode chamar esse endereço, mas só quem tem o segredo consegue mudar alguma coisa. se responder 202, qualquer um poderia declarar um contrato como assinado — é a ocorrência mais grave deste roteiro.",
                  "esperadoHtml": "<strong>401</strong>. Webhook sem assinatura válida não muda estado.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 516,
                  "ordem": 2
                },
                {
                  "key": "ROTEIRO-04/J-071.A/P3",
                  "id": "P3",
                  "hash": "14780830",
                  "textoHtml": "Insomnia &gt; <strong>Contratos</strong> &gt; <code>GET /contratos/{id}/assinatura/status</code>.",
                  "comoHtml": "Confirma que o webhook do P1 (e não o do P2) surtiu efeito. Os dois campos têm de estar <code>ASSINADO</code>.",
                  "textoBusca": "insomnia > contratos > get /contratos/{id}/assinatura/status. confirma que o webhook do p1 (e não o do p2) surtiu efeito. os dois campos têm de estar assinado.",
                  "esperadoHtml": "<code>statusContrato = ASSINADO</code> e <code>statusEnvelope = ASSINADO</code>.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 523,
                  "ordem": 3
                },
                {
                  "key": "ROTEIRO-04/J-071.A/P4",
                  "id": "P4",
                  "hash": "1bbb2b7e",
                  "textoHtml": "Reenviar o <strong>mesmo</strong> callback de <strong>P1</strong>, sem alterar nada.",
                  "comoHtml": "Só clicar em <strong>Send</strong> de novo no request do P1. Provedores reenviam callbacks quando não têm certeza de que chegaram — é normal e o sistema tem de aguentar. O segundo envio não pode gerar um segundo evento nem alterar o estado. Conferir no P7 que os eventos não duplicaram.",
                  "textoBusca": "reenviar o mesmo callback de p1, sem alterar nada. só clicar em send de novo no request do p1. provedores reenviam callbacks quando não têm certeza de que chegaram — é normal e o sistema tem de aguentar. o segundo envio não pode gerar um segundo evento nem alterar o estado. conferir no p7 que os eventos não duplicaram.",
                  "esperadoHtml": "deduplicado pela UNIQUE <code>(envelope_id, id_evento_externo)</code>; nenhum evento duplicado e nenhuma mudança de estado.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 527,
                  "ordem": 4
                },
                {
                  "key": "ROTEIRO-04/J-071.A/P5",
                  "id": "P5",
                  "hash": "dcb1b61c",
                  "textoHtml": "Insomnia &gt; <strong>Contratos</strong> &gt; <code>GET /contratos/{id}/documento-assinado</code>.",
                  "comoHtml": "Autenticado como <code>cliente-a</code>. Olhar a aba <strong>Headers</strong> da resposta: tem de haver <code>Content-Disposition</code> (que faz o arquivo baixar em vez de abrir) e <code>X-Document-Hash-Sha256</code> (a impressão digital do documento). Como o provider é Fake, o conteúdo é um PDF de mentira com o texto indicado — isso é esperado, não defeito.",
                  "textoBusca": "insomnia > contratos > get /contratos/{id}/documento-assinado. autenticado como cliente-a. olhar a aba headers da resposta: tem de haver content-disposition (que faz o arquivo baixar em vez de abrir) e x-document-hash-sha256 (a impressão digital do documento). como o provider é fake, o conteúdo é um pdf de mentira com o texto indicado — isso é esperado, não defeito.",
                  "esperadoHtml": "<code>application/pdf</code> com <code>Content-Disposition</code> e <code>X-Document-Hash-Sha256</code>. No provider Fake, o conteúdo é o stub <code>%PDF-1.4 fake-assinado</code>.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 534,
                  "ordem": 5
                },
                {
                  "key": "ROTEIRO-04/J-071.A/P6",
                  "id": "P6",
                  "hash": "74d1b085",
                  "textoHtml": "Repetir <strong>P5</strong> com <code>clienteAccessToken</code> do <code>cliente-b</code>.",
                  "comoHtml": "Trocar o token para o do <code>cliente-b</code> e repetir. A CCB é a dívida de uma pessoa específica: ninguém além do titular pode baixá-la.",
                  "textoBusca": "repetir p5 com clienteaccesstoken do cliente-b. trocar o token para o do cliente-b e repetir. a ccb é a dívida de uma pessoa específica: ninguém além do titular pode baixá-la.",
                  "esperadoHtml": "<strong>403</strong> de ownership.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 541,
                  "ordem": 6
                },
                {
                  "key": "ROTEIRO-04/J-071.A/P7",
                  "id": "P7",
                  "hash": "03daf95c",
                  "textoHtml": "Conferir o audit log:",
                  "comoHtml": "Terminal do banco. Os quatro eventos contam a história completa do documento: gerado, enviado para assinatura, assinado e baixado. <strong>Conferir também que não há duplicata</strong> de <code>ASSINATURA_ASSINADA</code> — se houver duas, a deduplicação do P4 falhou.",
                  "textoBusca": "conferir o audit log: terminal do banco. os quatro eventos contam a história completa do documento: gerado, enviado para assinatura, assinado e baixado. conferir também que não há duplicata de assinaturaassinada — se houver duas, a deduplicação do p4 falhou.",
                  "esperadoHtml": "os quatro eventos registrados.",
                  "blocos": [
                    {
                      "tipo": "codigo",
                      "lang": "bash",
                      "regiao": "como",
                      "conteudo": "docker exec sep-postgres psql -U sep -d sep_dev \\\n  -c \"SELECT tipo, data_evento FROM audit_log_seguranca\n      WHERE tipo IN ('CCB_GERADA','ASSINATURA_ENVIADA','ASSINATURA_ASSINADA','DOCUMENTO_ASSINADO_BAIXADO')\n      ORDER BY data_evento DESC LIMIT 10;\""
                    }
                  ],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 545,
                  "ordem": 7
                },
                {
                  "key": "ROTEIRO-04/J-071.A/P8",
                  "id": "P8",
                  "hash": "47dba7a6",
                  "textoHtml": "Conferir que o payload bruto do webhook <strong>não</strong> foi persistido.",
                  "comoHtml": "Payload de provedor externo costuma trazer dado pessoal; guardar o corpo inteiro no banco seria acumular PII sem necessidade. A coluna guarda no máximo 1000 caracteres. Rodar no terminal do banco e conferir o tamanho.",
                  "textoBusca": "conferir que o payload bruto do webhook não foi persistido. payload de provedor externo costuma trazer dado pessoal; guardar o corpo inteiro no banco seria acumular pii sem necessidade. a coluna guarda no máximo 1000 caracteres. rodar no terminal do banco e conferir o tamanho.",
                  "esperadoHtml": "<code>evento_assinatura.payload_resumo</code> truncado em 1000 chars; nenhum corpo integral no banco.",
                  "blocos": [
                    {
                      "tipo": "codigo",
                      "lang": "bash",
                      "regiao": "como",
                      "conteudo": "docker exec sep-postgres psql -U sep -d sep_dev \\\n  -c \"SELECT length(payload_resumo) FROM evento_assinatura ORDER BY data_evento DESC LIMIT 3;\""
                    }
                  ],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 556,
                  "ordem": 8
                },
                {
                  "key": "ROTEIRO-04/J-071.A/P9",
                  "id": "P9",
                  "hash": "b6a56233",
                  "textoHtml": "No web, como <code>cliente-a</code>, abrir o contrato.",
                  "comoHtml": "Fecha o ciclo pela interface: tudo o que foi feito por API tem de aparecer para o usuário. Abrir a formalização e conferir que o status é <code>ASSINADO</code> e que existe a ação de baixar a CCB. Baixar e abrir o arquivo — é o PDF de mentira do provider Fake.",
                  "textoBusca": "no web, como cliente-a, abrir o contrato. fecha o ciclo pela interface: tudo o que foi feito por api tem de aparecer para o usuário. abrir a formalização e conferir que o status é assinado e que existe a ação de baixar a ccb. baixar e abrir o arquivo — é o pdf de mentira do provider fake.",
                  "esperadoHtml": "status <code>ASSINADO</code> e a CCB disponível para download.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 566,
                  "ordem": 9
                }
              ]
            }
          ],
          "assercoes": [
            {
              "key": "ROTEIRO-04/J-071.A/#656a300a",
              "id": null,
              "hash": "75c3c8d4",
              "textoHtml": "Contrato <code>ASSINADO</code>, CCB acessível pelo titular e negada a terceiros",
              "comoHtml": null,
              "textoBusca": "contrato assinado, ccb acessível pelo titular e negada a terceiros",
              "esperadoHtml": null,
              "blocos": [],
              "na": false,
              "naMotivo": null,
              "marcadoNaFonte": false,
              "linha": 574,
              "ordem": 1
            },
            {
              "key": "ROTEIRO-04/J-071.A/#d716979b",
              "id": null,
              "hash": "4030880d",
              "textoHtml": "<code>ASSINADO</code> é pré-condição das jornadas de cobrança — anotar o <code>contratoId</code>",
              "comoHtml": "Este é o <code>PRE-12</code> que o hub cita na ordem de execução: o roteiro de cobrança só roda com um contrato assinado. Guardar o <code>contratoId</code> num lugar que sobreviva ao fim da sessão de hoje.",
              "textoBusca": "assinado é pré-condição das jornadas de cobrança — anotar o contratoid este é o pre-12 que o hub cita na ordem de execução: o roteiro de cobrança só roda com um contrato assinado. guardar o contratoid num lugar que sobreviva ao fim da sessão de hoje.",
              "esperadoHtml": null,
              "blocos": [],
              "na": false,
              "naMotivo": null,
              "marcadoNaFonte": false,
              "linha": 575,
              "ordem": 2
            }
          ],
          "linha": 480,
          "stats": {
            "passos": 9,
            "na": 0,
            "assercoes": 2
          }
        },
        {
          "key": "ROTEIRO-04/J-072.W",
          "id": "J-072.W",
          "escopoId": "J-072.W",
          "kind": "jornada",
          "nivel": 3,
          "titulo": "FINANCEIRO cancela contrato pré-aceite",
          "anchor": "j-072w---financeiro-cancela-contrato-pr-aceite",
          "ordem": 9,
          "meta": [
            {
              "chave": "ID",
              "texto": "J-072.W",
              "html": "<code>J-072.W</code>"
            },
            {
              "chave": "Tipo",
              "texto": "Positiva + negativa de estado",
              "html": "Positiva + negativa de estado"
            },
            {
              "chave": "Persona",
              "texto": "financeiro — FINANCEIRO com TOTP",
              "html": "<code>financeiro</code> — FINANCEIRO com TOTP"
            },
            {
              "chave": "Superfície",
              "texto": "Web + API",
              "html": "Web + API"
            },
            {
              "chave": "Pré-condições",
              "texto": "PRE-01 PRE-04 PRE-06 PRE-08 PRE-10 + um segundo contrato em AGUARDANDOACEITE",
              "html": "<code>PRE-01</code> <code>PRE-04</code> <code>PRE-06</code> <code>PRE-08</code> <code>PRE-10</code> + um segundo contrato em <code>AGUARDANDO_ACEITE</code>"
            },
            {
              "chave": "Endpoints tocados",
              "texto": "POST /api/v1/contratos/{id}/cancelar",
              "html": "<code>POST /api/v1/contratos/{id}/cancelar</code>"
            },
            {
              "chave": "Step-up",
              "texto": "Estrito",
              "html": "<strong>Estrito</strong>"
            }
          ],
          "metaIndex": {
            "ID": "J-072.W",
            "Tipo": "Positiva + negativa de estado",
            "Persona": "financeiro — FINANCEIRO com TOTP",
            "Superfície": "Web + API",
            "Pré-condições": "PRE-01 PRE-04 PRE-06 PRE-08 PRE-10 + um segundo contrato em AGUARDANDOACEITE",
            "Endpoints tocados": "POST /api/v1/contratos/{id}/cancelar",
            "Step-up": "Estrito"
          },
          "notas": [
            "<strong>Esta jornada precisa de um segundo contrato</strong>, ainda em <code>AGUARDANDO_ACEITE</code> — o da <code>J-070.W</code> já foi aceito e serve só para o P3. Para produzi-lo, repetir <code>J-060.W</code> e <code>J-063.W</code> criando outra proposta para <code>cliente-a</code> e aprovando-a. Fazer isso <strong>antes</strong> de começar os passos abaixo."
          ],
          "grupos": [
            {
              "id": "g1",
              "tituloHtml": null,
              "tela": null,
              "implicito": true,
              "passos": [
                {
                  "key": "ROTEIRO-04/J-072.W/P1",
                  "id": "P1",
                  "hash": "3b30359b",
                  "textoHtml": "Como <code>financeiro</code>, cancelar um contrato em <code>AGUARDANDO_ACEITE</code> com justificativa de menos de 10 caracteres.",
                  "comoHtml": "Entrar como <code>financeiro</code>, abrir o <strong>segundo</strong> contrato (não o aceito) e acionar o cancelamento com uma justificativa curta de propósito, como <code>erro</code>. A recusa é o resultado certo: cancelar contrato é ato relevante e exige motivo registrado de verdade.",
                  "textoBusca": "como financeiro, cancelar um contrato em aguardandoaceite com justificativa de menos de 10 caracteres. entrar como financeiro, abrir o segundo contrato (não o aceito) e acionar o cancelamento com uma justificativa curta de propósito, como erro. a recusa é o resultado certo: cancelar contrato é ato relevante e exige motivo registrado de verdade.",
                  "esperadoHtml": "recusado por validação (justificativa de 10 a 500 chars).",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 601,
                  "ordem": 1
                },
                {
                  "key": "ROTEIRO-04/J-072.W/P2",
                  "id": "P2",
                  "hash": "662aa103",
                  "textoHtml": "Cancelar com justificativa válida, passando pelo step-up.",
                  "comoHtml": "Repetir com uma justificativa real, por exemplo <code>Cancelamento de teste do roteiro manual de formalização</code>. O step-up aqui é <strong>estrito</strong> — é o mesmo mecanismo do aceite: <strong>Iniciar</strong>, código TOTP da conta <code>financeiro</code>, <strong>Confirmar</strong>. <code>CANCELADO</code> é estado final, sem volta.",
                  "textoBusca": "cancelar com justificativa válida, passando pelo step-up. repetir com uma justificativa real, por exemplo cancelamento de teste do roteiro manual de formalização. o step-up aqui é estrito — é o mesmo mecanismo do aceite: iniciar, código totp da conta financeiro, confirmar. cancelado é estado final, sem volta.",
                  "esperadoHtml": "<code>200</code>; status <code>CANCELADO</code> (final).",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 607,
                  "ordem": 2
                },
                {
                  "key": "ROTEIRO-04/J-072.W/P3",
                  "id": "P3",
                  "hash": "e2a47001",
                  "textoHtml": "Tentar cancelar um contrato já <strong><code>ACEITO</code></strong> (o de <code>J-070.W</code>).",
                  "comoHtml": "Agora sobre o primeiro contrato, o que foi aceito. O 409 é o resultado certo: depois do aceite existe um ato jurídico, e desfazê-lo por cancelamento simples apagaria a dívida sem trilha adequada.",
                  "textoBusca": "tentar cancelar um contrato já aceito (o de j-070.w). agora sobre o primeiro contrato, o que foi aceito. o 409 é o resultado certo: depois do aceite existe um ato jurídico, e desfazê-lo por cancelamento simples apagaria a dívida sem trilha adequada.",
                  "esperadoHtml": "<strong>409</strong>. Cancelamento só vale antes do aceite.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 613,
                  "ordem": 3
                },
                {
                  "key": "ROTEIRO-04/J-072.W/P4",
                  "id": "P4",
                  "hash": "c5c99643",
                  "textoHtml": "Como <code>cliente-a</code>, tentar cancelar o próprio contrato.",
                  "comoHtml": "Trocar de sessão para <code>cliente-a</code> e tentar cancelar pela API (a tela dele nem deve oferecer a ação). Mesmo sendo o dono, o tomador não cancela: seria uma saída unilateral da dívida.",
                  "textoBusca": "como cliente-a, tentar cancelar o próprio contrato. trocar de sessão para cliente-a e tentar cancelar pela api (a tela dele nem deve oferecer a ação). mesmo sendo o dono, o tomador não cancela: seria uma saída unilateral da dívida.",
                  "esperadoHtml": "<strong>403</strong>. Cancelamento é de <code>FINANCEIRO</code>/<code>ADMIN</code>, não do tomador.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 618,
                  "ordem": 4
                },
                {
                  "key": "ROTEIRO-04/J-072.W/P5",
                  "id": "P5",
                  "hash": "d36c880c",
                  "textoHtml": "Conferir que a justificativa foi truncada no evento, não no dado.",
                  "comoHtml": "Terminal do banco. A distinção: o <strong>dado</strong> do contrato guarda a justificativa inteira, mas o <strong>evento de auditoria</strong> guarda só um resumo — trilha não é lugar de texto livre irrestrito.",
                  "textoBusca": "conferir que a justificativa foi truncada no evento, não no dado. terminal do banco. a distinção: o dado do contrato guarda a justificativa inteira, mas o evento de auditoria guarda só um resumo — trilha não é lugar de texto livre irrestrito.",
                  "esperadoHtml": "auditoria registra o cancelamento sem expor texto integral irrestrito.",
                  "blocos": [
                    {
                      "tipo": "codigo",
                      "lang": "bash",
                      "regiao": "como",
                      "conteudo": "docker exec sep-postgres psql -U sep -d sep_dev \\\n  -c \"SELECT tipo, length(detalhes::text) FROM audit_log_seguranca ORDER BY data_evento DESC LIMIT 5;\""
                    }
                  ],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 623,
                  "ordem": 5
                }
              ]
            }
          ],
          "assercoes": [],
          "linha": 582,
          "stats": {
            "passos": 5,
            "na": 0,
            "assercoes": 0
          }
        },
        {
          "key": "ROTEIRO-04/J-073.M",
          "id": "J-073.M",
          "escopoId": "J-073.M",
          "kind": "jornada",
          "nivel": 3,
          "titulo": "Formalização no mobile",
          "anchor": "j-073m---formalizao-no-mobile",
          "ordem": 10,
          "meta": [
            {
              "chave": "ID",
              "texto": "J-073.M",
              "html": "<code>J-073.M</code>"
            },
            {
              "chave": "Tipo",
              "texto": "Positiva",
              "html": "Positiva"
            },
            {
              "chave": "Persona",
              "texto": "cliente-a",
              "html": "<code>cliente-a</code>"
            },
            {
              "chave": "Superfície",
              "texto": "Mobile — PWA em localhost:8100 no navegador",
              "html": "Mobile — <strong>PWA em <code>localhost:8100</code> no navegador</strong>"
            },
            {
              "chave": "Pré-condições",
              "texto": "PRE-01 PRE-03 PRE-04 PRE-07 PRE-10 + contrato em AGUARDANDOACEITE",
              "html": "<code>PRE-01</code> <code>PRE-03</code> <code>PRE-04</code> <code>PRE-07</code> <code>PRE-10</code> + contrato em <code>AGUARDANDO_ACEITE</code>"
            },
            {
              "chave": "Automação equivalente",
              "texto": "formalizacao-mobile.spec.ts",
              "html": "<a href=\"../../../sep-mobile/e2e/formalizacao-mobile.spec.ts\" rel=\"noreferrer\"><code>formalizacao-mobile.spec.ts</code></a>"
            },
            {
              "chave": "Só o manual cobre",
              "texto": "TOTP real no step-up mobile",
              "html": "TOTP real no step-up mobile"
            }
          ],
          "metaIndex": {
            "ID": "J-073.M",
            "Tipo": "Positiva",
            "Persona": "cliente-a",
            "Superfície": "Mobile — PWA em localhost:8100 no navegador",
            "Pré-condições": "PRE-01 PRE-03 PRE-04 PRE-07 PRE-10 + contrato em AGUARDANDOACEITE",
            "Automação equivalente": "formalizacao-mobile.spec.ts",
            "Só o manual cobre": "TOTP real no step-up mobile"
          },
          "notas": [
            "<strong>Esta jornada precisa de um contrato de <code>cliente-a</code> em <code>AGUARDANDO_ACEITE</code>.</strong> Se você já aceitou o da <code>J-070.W</code> pelo web, produza outro (repetir <code>J-060.W</code> + <code>J-063.W</code>) ou use o segundo contrato criado para a <code>J-072.W</code>, desde que não tenha sido cancelado. O ponto da jornada é fazer o aceite <strong>pelo mobile</strong>, então o contrato precisa estar por aceitar."
          ],
          "grupos": [
            {
              "id": "g1",
              "tituloHtml": null,
              "tela": null,
              "implicito": true,
              "passos": [
                {
                  "key": "ROTEIRO-04/J-073.M/P1",
                  "id": "P1",
                  "hash": "869b4ba5",
                  "textoHtml": "Com a emulação de dispositivo ligada, abrir a aba <strong>Propostas</strong> e ir à formalização.",
                  "comoHtml": "Em <code>http://localhost:8100</code>, logado como <code>cliente-a</code>, com <code>Ctrl+Shift+M</code> ligado. A navegação do mobile é por abas no rodapé — tocar em <strong>Propostas</strong> e seguir até a formalização do contrato pendente.",
                  "textoBusca": "com a emulação de dispositivo ligada, abrir a aba propostas e ir à formalização. em http://localhost:8100, logado como cliente-a, com ctrl+shift+m ligado. a navegação do mobile é por abas no rodapé — tocar em propostas e seguir até a formalização do contrato pendente.",
                  "esperadoHtml": "contrato listado com status correto.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 654,
                  "ordem": 1
                },
                {
                  "key": "ROTEIRO-04/J-073.M/P2",
                  "id": "P2",
                  "hash": "6a776681",
                  "textoHtml": "Abrir o contrato e ler a minuta.",
                  "comoHtml": "<strong>Este passo é sobre o layout mobile</strong>, que nenhum teste automatizado cobre. No DevTools, trocar o preset para uma largura de <strong>320px</strong> (o menor telefone comum) e rolar a minuta inteira. Procurar barra de rolagem <strong>horizontal</strong> e texto cortado na borda — qualquer um dos dois é ocorrência.",
                  "textoBusca": "abrir o contrato e ler a minuta. este passo é sobre o layout mobile, que nenhum teste automatizado cobre. no devtools, trocar o preset para uma largura de 320px (o menor telefone comum) e rolar a minuta inteira. procurar barra de rolagem horizontal e texto cortado na borda — qualquer um dos dois é ocorrência.",
                  "esperadoHtml": "texto legível sem scroll horizontal; sem corte a 320px de largura.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 660,
                  "ordem": 2
                },
                {
                  "key": "ROTEIRO-04/J-073.M/P3",
                  "id": "P3",
                  "hash": "0ed082fe",
                  "textoHtml": "Aceitar, passando pelo step-up com TOTP real.",
                  "comoHtml": "Aceitar o contrato. O step-up é o mesmo do web: <strong>Iniciar</strong>, código TOTP da conta <code>cliente-a</code>, <strong>Confirmar</strong>. O mobile sabe <strong>verificar</strong> o código, mas não sabe cadastrar TOTP — por isso o enrollment teve de ser feito no web, no §6.2 do ROTEIRO-00.",
                  "textoBusca": "aceitar, passando pelo step-up com totp real. aceitar o contrato. o step-up é o mesmo do web: iniciar, código totp da conta cliente-a, confirmar. o mobile sabe verificar o código, mas não sabe cadastrar totp — por isso o enrollment teve de ser feito no web, no §6.2 do roteiro-00.",
                  "esperadoHtml": "<code>ACEITO</code>; o mobile <strong>verifica</strong> TOTP normalmente (o que ele não faz é cadastrar).",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 666,
                  "ordem": 3
                },
                {
                  "key": "ROTEIRO-04/J-073.M/P4",
                  "id": "P4",
                  "hash": "15bdb2ef",
                  "textoHtml": "Reconsultar por gesto até <code>ASSINADO</code> (após <code>J-071.A</code>).",
                  "comoHtml": "O status só chega a <code>ASSINADO</code> depois que o webhook da <a href=\"#j-071a---assinatura-concluída-por-webhook-e-download-da-ccb\" rel=\"noreferrer\"><code>J-071.A</code></a> for enviado — se você ainda não fez aquela jornada com <strong>este</strong> contrato, o status para em <code>EM_ASSINATURA</code>, e está correto. &quot;Por gesto&quot; quer dizer que <strong>você</strong> puxa para atualizar ou recarrega; a tela não faz sozinha. Conferir na aba Network que não há chamadas repetidas em intervalo fixo.",
                  "textoBusca": "reconsultar por gesto até assinado (após j-071.a). o status só chega a assinado depois que o webhook da j-071.a for enviado — se você ainda não fez aquela jornada com este contrato, o status para em emassinatura, e está correto. \"por gesto\" quer dizer que você puxa para atualizar ou recarrega; a tela não faz sozinha. conferir na aba network que não há chamadas repetidas em intervalo fixo.",
                  "esperadoHtml": "status atualiza; <strong>sem polling automático</strong>.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 672,
                  "ordem": 4
                },
                {
                  "key": "ROTEIRO-04/J-073.M/P5",
                  "id": "P5",
                  "hash": "380e02c2",
                  "textoHtml": "Baixar o contrato assinado.",
                  "comoHtml": "Acionar o download da CCB. No PWA (navegador), o arquivo cai na pasta de downloads como qualquer download — é o PDF de mentira do provider Fake.",
                  "textoBusca": "baixar o contrato assinado. acionar o download da ccb. no pwa (navegador), o arquivo cai na pasta de downloads como qualquer download — é o pdf de mentira do provider fake.",
                  "esperadoHtml": "download conclui no PWA.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 680,
                  "ordem": 5
                },
                {
                  "key": "ROTEIRO-04/J-073.M/P6",
                  "id": "P6",
                  "hash": "1a8b2f5f",
                  "textoHtml": "Conferir o download em WebView no APK Android",
                  "comoHtml": null,
                  "textoBusca": "conferir o download em webview no apk android",
                  "esperadoHtml": null,
                  "blocos": [],
                  "na": true,
                  "naMotivo": "fora deste ciclo (sem aparelho físico). Reativa quando houver device ou emulador Android.",
                  "marcadoNaFonte": true,
                  "linha": 684,
                  "ordem": 6
                },
                {
                  "key": "ROTEIRO-04/J-073.M/P7",
                  "id": "P7",
                  "hash": "1f7f2082",
                  "textoHtml": "Conferir a consistência entre superfícies.",
                  "comoHtml": "Abrir o <strong>mesmo</strong> contrato no web (<code>localhost:4200</code>) e no mobile (<code>localhost:8100</code>), lado a lado. O status tem de ser idêntico nos dois. Divergência indica cache desatualizado numa das telas — ocorrência, porque as duas leem o mesmo backend e deveriam concordar.",
                  "textoBusca": "conferir a consistência entre superfícies. abrir o mesmo contrato no web (localhost:4200) e no mobile (localhost:8100), lado a lado. o status tem de ser idêntico nos dois. divergência indica cache desatualizado numa das telas — ocorrência, porque as duas leem o mesmo backend e deveriam concordar.",
                  "esperadoHtml": "o mesmo contrato mostra o mesmo status no web e no mobile.",
                  "blocos": [],
                  "na": false,
                  "naMotivo": null,
                  "marcadoNaFonte": false,
                  "linha": 686,
                  "ordem": 7
                }
              ]
            }
          ],
          "assercoes": [],
          "linha": 635,
          "stats": {
            "passos": 7,
            "na": 1,
            "assercoes": 0
          }
        }
      ],
      "ocorrenciasColunas": [
        "#",
        "Jornada",
        "Passo",
        "O que aconteceu",
        "Esperado",
        "Issue"
      ],
      "registroCampos": [
        {
          "chave": "executado_por",
          "rotulo": "Executado por",
          "tipo": "texto"
        },
        {
          "chave": "data_hora",
          "rotulo": "Data / hora",
          "tipo": "texto"
        },
        {
          "chave": "commit_sep_api",
          "rotulo": "Commit sep-api",
          "tipo": "texto"
        },
        {
          "chave": "commit_sep_app",
          "rotulo": "Commit sep-app",
          "tipo": "texto"
        },
        {
          "chave": "commit_sep_mobile",
          "rotulo": "Commit sep-mobile",
          "tipo": "texto"
        },
        {
          "chave": "propostaid_usado",
          "rotulo": "propostaId usado",
          "tipo": "texto"
        },
        {
          "chave": "contratoid_usado",
          "rotulo": "contratoId usado",
          "tipo": "texto"
        },
        {
          "chave": "jornadas_ok",
          "rotulo": "Jornadas OK",
          "tipo": "texto"
        },
        {
          "chave": "jornadas_nok",
          "rotulo": "Jornadas NOK",
          "tipo": "texto"
        },
        {
          "chave": "jornadas_bloqueado",
          "rotulo": "Jornadas BLOQUEADO",
          "tipo": "texto"
        },
        {
          "chave": "observacoes",
          "rotulo": "Observações",
          "tipo": "textarea"
        }
      ]
    }
  ]
};
