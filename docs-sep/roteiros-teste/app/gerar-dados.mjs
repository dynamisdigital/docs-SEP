#!/usr/bin/env node
// Gera app/dados.js a partir dos ROTEIRO-*.md e do hub.
// Zero dependencias. Rodar: node gerar-dados.mjs [--check|--relatorio|--force]
//
// Politica de falha: estridente na geracao, tolerante na renderizacao.
// Erro aborta sem escrever nada; aviso viaja dentro do dado ate o app.

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const FONTE = join(AQUI, "..");
const SAIDA = join(AQUI, "dados.js");
const SCHEMA_VERSION = 1; // so sobe em mudanca de shape que quebre leitor antigo
const VERSAO = "1.1.0"; // 1.1.0: campo _Como:_ nos passos + glossario no payload

const ORDEM_ROTEIRO = { CENARIOS: 0 };
const RE_JORNADA = /^(J-[\w.\-]+) - (.+)$/;
const RE_PASSO_ID = /^\*\*([A-Z]{1,3}\d{1,3})\*\*\s*[—–-]\s*([\s\S]*)$/;
const RE_SECAO_NUM = /^(\d+(?:\.\d+)*)\.?\s+(.*)$/;

const erros = [];
const avisos = [];

const hash8 = (s) => createHash("sha256").update(s).digest("hex").slice(0, 8);
const norm = (s) => s.replace(/\s+/g, " ").trim().toLowerCase();
// O corpus e escrito em PT-BR acentuado, mas os marcadores estruturais sao
// reconhecidos por texto ("Ocorrencias", "Registro da execucao", "Glossario").
// Comparar sem acento evita que "Ocorrências" deixe de casar e a secao suma do
// payload em silencio — foi o que aconteceu quando o corpus foi acentuado.
const semAcento = (s) => String(s).normalize("NFD").replace(/\p{Diacritic}/gu, "");

function erro(codigo, arquivo, linha, msg) {
  erros.push({ codigo, arquivo: basename(arquivo), linha, msg });
}
function aviso(codigo, arquivo, linha, msg) {
  avisos.push({ codigo, arquivo: basename(arquivo), linha, msg });
}

// ---------------------------------------------------------------- inline HTML

// Escape-first e obrigatorio: o corpus tem `<` literal fora de fence
// ("layout <768px", "AAAA-MM-DD-<tag>"). Sem escapar antes, engole a linha.
//
// O code span sai de cena como \u0000<indice>\u0000 e volta no fim. O delimitador
// PRECISA ser NUL: e o unico byte que nao aparece em markdown. Nao troque por
// espaco nem por outro caractere visivel — o corpus tem numero solto entre
// espacos ("aguardar 5 minutos", "18 pastas e 150 requests") e o passo de volta
// passaria a casar esses numeros, trocando-os por code spans sem erro nenhum.
// Escrito como escape, e nao como byte literal, para sobreviver a formatter e
// copy-paste: um NUL literal e invisivel no editor.
function inline(md) {
  const codigos = [];
  let s = String(md).replace(/`([^`]+)`/g, (_, c) => `\u0000${codigos.push(c) - 1}\u0000`);
  s = s.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  s = s
    .replace(/~~([^~]+)~~/g, "<del>$1</del>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" rel="noreferrer">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])_([^_]+)_(?=[\s).,;:]|$)/g, "$1<em>$2</em>");
  return s.replace(
    /\u0000(\d+)\u0000/g,
    (_, i) => `<code>${codigos[i].replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]))}</code>`,
  );
}

const semMarcacao = (md) =>
  String(md)
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_~]/g, "")
    .trim();

// ------------------------------------------------------------------ tokenizer

// Ordem de prioridade normativa: fence manda primeiro, depois checkbox, depois
// continuacao indentada. E o que impede ```bash indentado de virar passo.
function tokenizar(linhas, arquivo) {
  const toks = [];
  let fence = null;
  let aberto = null;

  for (let i = 0; i < linhas.length; i++) {
    const L = linhas[i];
    const f = /^(\s*)(`{3,}|~{3,})(.*)$/.exec(L);

    if (fence) {
      if (f && f[2][0] === fence.cerca[0] && f[2].length >= fence.cerca.length && !f[3].trim()) {
        const bloco = { tipo: "codigo", lang: fence.lang, conteudo: fence.linhas.join("\n") };
        if (fence.dono) fence.dono.blocos.push({ ...bloco, regiao: fence.regiao });
        else toks.push({ t: "CODIGO", ...bloco, linha: fence.abertura });
        fence = null;
      } else {
        fence.linhas.push(L.slice(fence.indent).replace(/\s+$/, ""));
      }
      continue;
    }

    if (f) {
      fence = {
        cerca: f[2],
        lang: f[3].trim() || null,
        indent: f[1].length,
        linhas: [],
        abertura: i + 1,
        dono: aberto,
        // A regiao e decidida na ABERTURA da fence, sobre as partes ja vistas:
        // fence depois de _Esperado:_ pertence ao esperado; depois de _Como:_
        // (e antes do esperado) pertence a instrucao; antes de ambos, ao texto.
        regiao: !aberto
          ? "texto"
          : aberto.partes.some((p) => /^_Esperado:_/.test(p))
            ? "esperado"
            : aberto.partes.some((p) => /^_Como:_/.test(p))
              ? "como"
              : "texto",
      };
      continue;
    }

    const c = /^- \[( |x|X)\] (.*)$/.exec(L);
    if (c) {
      aberto = { t: "ITEM", marcado: c[1].toLowerCase() === "x", linha: i + 1, partes: [c[2]], blocos: [] };
      toks.push(aberto);
      continue;
    }

    if (aberto && /^\s{2,}\S/.test(L)) {
      aberto.partes.push(L.trim());
      continue;
    }
    if (aberto && !L.trim()) {
      aberto = null;
      continue;
    }
    aberto = null;

    const h = /^(#{1,6}) (.*)$/.exec(L);
    if (h) {
      toks.push({ t: "H", nivel: h[1].length, texto: h[2].trim(), linha: i + 1 });
      continue;
    }
    if (/^-{3,}\s*$/.test(L)) {
      toks.push({ t: "HR", linha: i + 1 });
      continue;
    }
    if (/^\|/.test(L)) {
      const celulas = L.replace(/^\||\|$/g, "")
        .split("|")
        .map((x) => x.trim());
      toks.push({ t: "TR", celulas, delim: celulas.every((x) => /^:?-{2,}:?$/.test(x)), linha: i + 1 });
      continue;
    }
    if (/^>\s?/.test(L)) {
      toks.push({ t: "Q", texto: L.replace(/^>\s?/, ""), linha: i + 1 });
      continue;
    }
    const b = /^\*\*(Passos|Resultado final esperado)\*\*\s*$/.exec(L);
    if (b) {
      toks.push({ t: "MARCA", nome: b[1], linha: i + 1 });
      continue;
    }
    toks.push(L.trim() ? { t: "P", texto: L.trim(), linha: i + 1 } : { t: "BR", linha: i + 1 });
  }

  if (fence) erro("FENCE_NAO_FECHADA", arquivo, fence.abertura, "cerca de codigo aberta e nunca fechada");
  return toks;
}

// -------------------------------------------------------------- parse do item

function parseItem(item, escopoKey, arquivo) {
  let partes = item.partes.slice();
  let corpo = partes.join("\n");
  let na = false;
  let naMotivo = null;

  const m = /^~~([\s\S]*?)~~\s*([\s\S]*)$/.exec(corpo);
  if (m) {
    na = true;
    corpo = m[1];
    naMotivo =
      semMarcacao(m[2])
        .replace(/\s+/g, " ")
        .replace(/^N\/A:?\s*/i, "")
        .trim() || null;
    partes = corpo.split("\n");
  }

  const idm = RE_PASSO_ID.exec(corpo);
  const id = idm ? idm[1] : null;

  if (!id && item.marcado && !na) {
    aviso("CHECKBOX_MARCADO_SEM_NA", arquivo, item.linha, "checkbox marcado na fonte sem ser N/A");
  }

  // Regioes do item: texto -> _Como:_ (opcional) -> _Esperado:_ (opcional).
  const iComo = partes.findIndex((p) => /^_Como:_/.test(p));
  const iEsp = partes.findIndex((p) => /^_Esperado:_/.test(p));

  if (iComo !== -1 && iEsp !== -1 && iComo > iEsp) {
    erro(
      "COMO_DEPOIS_DE_ESPERADO",
      arquivo,
      item.linha,
      "_Como:_ deve vir antes de _Esperado:_ — depois, seria engolido no esperado e mudaria o hash",
    );
  }
  if (partes.filter((p) => /^_Como:_/.test(p)).length > 1) {
    erro("COMO_DUPLICADO", arquivo, item.linha, "mais de uma linha _Como:_ no mesmo passo");
  }
  // Typo em _Como:_ nao falharia: a linha seria colada no texto do passo e
  // mudaria hash e key em silencio. Near-miss e erro, nao aviso.
  const quaseComo = partes.find((p) => /^_?como[_\s]*:/i.test(p) && !/^_Como:_/.test(p));
  if (quaseComo) {
    erro(
      "COMO_MALFORMADO",
      arquivo,
      item.linha,
      `linha parece _Como:_ com grafia errada: "${quaseComo.slice(0, 40)}" — grafia exata: _Como:_`,
    );
  }
  if (na && /_Como:_/.test(item.partes.join("\n"))) {
    aviso("COMO_EM_PASSO_NA", arquivo, item.linha, "passo N/A com _Como:_ — instrucao ignorada");
  }

  const comoValido = iComo !== -1 && (iEsp === -1 || iComo < iEsp);
  const fimTexto = comoValido ? iComo : iEsp !== -1 ? iEsp : partes.length;
  const textoPartes = partes.slice(0, fimTexto);
  const comoPartes = comoValido ? partes.slice(iComo, iEsp === -1 ? undefined : iEsp) : [];
  const espPartes = iEsp === -1 ? [] : partes.slice(iEsp);

  let textoMd = textoPartes.join(" ").trim();
  if (idm) textoMd = idm[2].split("\n")[0] + (textoPartes.length > 1 ? " " + textoPartes.slice(1).join(" ") : "");
  textoMd = textoMd.trim();

  const comoMd = comoPartes.join(" ").replace(/^_Como:_\s*/, "").trim();
  const espMd = espPartes.join(" ").replace(/^_Esperado:_\s*/, "").trim();
  const key = id ? `${escopoKey}/${id}` : `${escopoKey}/#${hash8(norm(semMarcacao(textoMd)))}`;

  return {
    key,
    id,
    // O _Como:_ fica FORA do hash de proposito: detalhar a instrucao de
    // execucao nao pode gerar drift ("revisar") em passo ja marcado. So
    // texto+esperado participam — mudar neles e mudar o contrato do passo.
    hash: hash8(norm(semMarcacao(textoMd) + "|" + semMarcacao(espMd))),
    textoHtml: inline(textoMd),
    comoHtml: !na && comoMd ? inline(comoMd) : null,
    textoBusca: (semMarcacao(textoMd) + (comoMd ? " " + semMarcacao(comoMd) : "")).toLowerCase(),
    esperadoHtml: espMd ? inline(espMd) : null,
    blocos: item.blocos.map((b) => ({ tipo: "codigo", lang: b.lang, regiao: b.regiao, conteudo: b.conteudo })),
    na,
    naMotivo,
    marcadoNaFonte: item.marcado,
    linha: item.linha,
  };
}

// ------------------------------------------------------------------ construtor

function construir(arquivo, texto) {
  const toks = tokenizar(texto.split(/\r?\n/), arquivo);
  const id = basename(arquivo, ".md").replace(/-.*$/, "") === "CENARIOS" ? "CENARIOS" : basename(arquivo, ".md").match(/^ROTEIRO-\d+/)?.[0];
  if (!id) {
    erro("NOME_INVALIDO", arquivo, 1, "arquivo nao casa CENARIOS-* nem ROTEIRO-NN-*");
    return null;
  }

  const roteiro = {
    id,
    arquivo: basename(arquivo),
    hash: hash8(texto),
    titulo: "",
    tipo: id === "CENARIOS" ? "hub" : null,
    ordem: ORDEM_ROTEIRO[id] ?? Number(id.replace(/\D/g, "")) + 10,
    atualizadoEm: null,
    resumoHtml: "",
    escopos: [],
    ocorrenciasColunas: [],
    registroCampos: [],
    glossario: [],
  };

  let escopo = null;
  let modo = "PREAMBULO";
  let grupo = null;
  let secaoAtual = null;
  const notasPendentes = [];
  let tabela = null;
  let rodape = null;

  const novoGrupo = (tituloMd, tela) => {
    grupo = { id: `g${escopo.grupos.length + 1}`, tituloHtml: tituloMd ? inline(tituloMd) : null, tela, implicito: !tituloMd, passos: [] };
    escopo.grupos.push(grupo);
    return grupo;
  };

  const fecharEscopo = () => {
    if (!escopo) return;
    escopo.notas = escopo.notas.map(inline); // acumuladas cruas para poder juntar
    const passos = escopo.grupos.flatMap((g) => g.passos);
    escopo.grupos = escopo.grupos.filter((g) => g.passos.length);
    escopo.stats = { passos: passos.length, na: passos.filter((p) => p.na).length, assercoes: escopo.assercoes.length };
    if (!passos.length && !escopo.assercoes.length) {
      roteiro.escopos.pop();
    } else if (escopo.kind === "jornada" && !escopo.assercoes.length) {
      aviso("SEM_RESULTADO_FINAL", arquivo, escopo.linha, `jornada ${escopo.id} sem "Resultado final esperado"`);
    }
    escopo = null;
    grupo = null;
  };

  const abrirEscopo = (kind, escopoId, titulo, linha, nivel) => {
    fecharEscopo();
    escopo = {
      key: `${roteiro.id}/${escopoId}`,
      id: escopoId,
      escopoId,
      kind,
      nivel,
      titulo,
      anchor: titulo
        ? (kind === "jornada" ? `${escopoId} - ${titulo}` : titulo).toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/ /g, "-")
        : null,
      ordem: roteiro.escopos.length + 1,
      meta: [],
      metaIndex: {},
      notas: notasPendentes.splice(0),
      grupos: [],
      assercoes: [],
      linha,
    };
    roteiro.escopos.push(escopo);
    novoGrupo(null, null);
    return escopo;
  };

  let notaAberta = false; // linhas ">" consecutivas formam UMA nota

  for (let i = 0; i < toks.length; i++) {
    const tk = toks[i];
    const continuandoNota = notaAberta;
    notaAberta = tk.t === "Q";

    if (tk.t === "H") {
      tabela = null;
      if (tk.nivel === 1 && !roteiro.titulo) {
        roteiro.titulo = tk.texto;
        continue;
      }

      // roteiros com secoes numeradas trazem "## 11. Registro da execucao"
      const semNum = tk.texto.replace(/^\d+(?:\.\d+)*\.?\s+/, "");

      if (/^Ocorrencias/i.test(semAcento(semNum))) {
        fecharEscopo();
        rodape = "ocorrencias";
        modo = "RODAPE";
        continue;
      }
      if (/^Registro da execucao/i.test(semAcento(semNum))) {
        fecharEscopo();
        rodape = "registro";
        modo = "RODAPE";
        continue;
      }
      if (/^Glossario/i.test(semAcento(semNum))) {
        fecharEscopo();
        rodape = "glossario";
        modo = "RODAPE";
        continue;
      }
      rodape = null;

      const j = tk.nivel === 3 && RE_JORNADA.exec(tk.texto);
      if (j) {
        abrirEscopo("jornada", j[1], j[2], tk.linha, tk.nivel);
        modo = "JORNADA_META";
        continue;
      }

      if (tk.nivel === 4 && escopo && modo === "PASSOS") {
        const tela = /^Tela\s+`([^`]+)`/.exec(tk.texto);
        novoGrupo(tk.texto, tela ? tela[1] : null);
        continue;
      }

      const s = RE_SECAO_NUM.exec(tk.texto);
      if (tk.nivel <= 3) {
        fecharEscopo();
        secaoAtual = { id: s ? s[1] : tk.texto.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), titulo: s ? s[2] : tk.texto, linha: tk.linha, nivel: tk.nivel };
        modo = "SECAO";
      }
      continue;
    }

    if (tk.t === "HR") {
      fecharEscopo();
      modo = "SECAO";
      continue;
    }

    if (tk.t === "Q") {
      // Um blockquote de 5 linhas e UMA nota, nao cinco: antes cada linha virava
      // um cartao proprio no app, e a linha "> " vazia virava um cartao vazio.
      const destino = escopo ? escopo.notas : notasPendentes;
      if (!tk.texto.trim()) {
        notaAberta = false; // linha vazia separa paragrafos do blockquote
        continue;
      }
      if (continuandoNota && destino.length) destino[destino.length - 1] += " " + tk.texto;
      else destino.push(tk.texto);
      continue;
    }

    if (tk.t === "MARCA") {
      if (tk.nome === "Passos") modo = "PASSOS";
      else modo = "ASSERCOES";
      continue;
    }

    if (tk.t === "TR") {
      if (tk.delim) continue;
      if (modo === "RODAPE") {
        if (!tabela) {
          tabela = tk.celulas;
          if (rodape === "ocorrencias") roteiro.ocorrenciasColunas = tk.celulas;
          continue;
        }
        if (rodape === "registro" && tk.celulas[0] && !/^preencher$/i.test(tk.celulas[0])) {
          const rotulo = semMarcacao(tk.celulas[0]);
          if (rotulo && rotulo !== "Campo") {
            roteiro.registroCampos.push({
              chave: semAcento(rotulo).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""),
              rotulo,
              tipo: /observ/i.test(rotulo) ? "textarea" : "texto",
            });
          }
        }
        if (rodape === "glossario" && tk.celulas[0]) {
          const termo = semMarcacao(tk.celulas[0]);
          if (termo && termo !== "Termo") {
            roteiro.glossario.push({ termo, definicaoHtml: inline(tk.celulas[1] || "") });
          }
        }
        continue;
      }
      if (modo === "JORNADA_META" && escopo) {
        if (!tabela) {
          tabela = tk.celulas;
          continue;
        }
        const [chave, valor] = tk.celulas;
        if (chave && chave !== "Campo") {
          escopo.meta.push({ chave: semMarcacao(chave), texto: semMarcacao(valor || ""), html: inline(valor || "") });
          escopo.metaIndex[semMarcacao(chave)] = semMarcacao(valor || "");
        }
        continue;
      }
      continue;
    }

    if (tk.t === "ITEM") {
      if (!escopo) {
        if (!secaoAtual) {
          aviso("PASSO_SEM_SECAO", arquivo, tk.linha, "checkbox antes de qualquer secao; ignorado");
          continue;
        }
        abrirEscopo("secao", secaoAtual.id, secaoAtual.titulo, secaoAtual.linha, secaoAtual.nivel);
      }
      const passo = parseItem(tk, escopo.key, arquivo);
      if (modo === "ASSERCOES" || !passo.id) {
        escopo.assercoes.push({ ...passo, ordem: escopo.assercoes.length + 1 });
      } else {
        if (!grupo) novoGrupo(null, null);
        grupo.passos.push({ ...passo, ordem: grupo.passos.length + 1 });
      }
      continue;
    }

    if (tk.t === "P") {
      if (modo === "PREAMBULO" && !roteiro.resumoHtml && !/^_Atualizado/.test(tk.texto)) {
        roteiro.resumoHtml = inline(tk.texto);
      }
      const d = /^_Atualizado em:\s*([\d-]+)\.?_/.exec(tk.texto);
      if (d) roteiro.atualizadoEm = d[1];
      continue;
    }
  }
  fecharEscopo();

  if (!roteiro.tipo) {
    roteiro.tipo = roteiro.escopos.some((e) => e.kind === "jornada") ? "jornadas" : "secoes";
  }
  if (!roteiro.escopos.length) erro("SEM_ESCOPOS", arquivo, 1, "nenhum escopo com passos encontrado");

  for (const e of roteiro.escopos) {
    if (e.kind === "jornada" && !e.metaIndex.ID) {
      erro("JORNADA_SEM_META", arquivo, e.linha, `jornada ${e.id} sem tabela de metadados com linha ID`);
    }
  }
  return roteiro;
}

// ----------------------------------------------------------------------- main

const args = new Set(process.argv.slice(2));
const arquivos = readdirSync(FONTE)
  .filter((f) => f.endsWith(".md"))
  .sort();

const roteiros = [];
for (const f of arquivos) {
  const caminho = join(FONTE, f);
  const r = construir(caminho, readFileSync(caminho, "utf8"));
  if (r) roteiros.push(r);
}
roteiros.sort((a, b) => a.ordem - b.ordem);

// unicidade global de passoKey
const vistas = new Map();
for (const r of roteiros)
  for (const e of r.escopos)
    for (const p of [...e.grupos.flatMap((g) => g.passos), ...e.assercoes]) {
      if (vistas.has(p.key)) erro("CHAVE_DUPLICADA", r.arquivo, p.linha, `passoKey "${p.key}" ja usada em ${vistas.get(p.key)}`);
      else vistas.set(p.key, `${r.arquivo}:${p.linha}`);
    }

// glossario agregado (por convencao vive no hub, mas qualquer arquivo pode contribuir)
const glossario = [];
const termosVistos = new Map();
for (const r of roteiros) {
  for (const g of r.glossario) {
    const k = g.termo.toLowerCase();
    if (termosVistos.has(k)) {
      aviso("GLOSSARIO_TERMO_DUPLICADO", r.arquivo, 1, `termo "${g.termo}" ja definido em ${termosVistos.get(k)}`);
    } else {
      termosVistos.set(k, r.arquivo);
      glossario.push(g);
    }
  }
  delete r.glossario;
}

const todosPassos = roteiros.flatMap((r) => r.escopos.flatMap((e) => e.grupos.flatMap((g) => g.passos)));
const totais = {
  roteiros: roteiros.length,
  escopos: roteiros.reduce((n, r) => n + r.escopos.length, 0),
  jornadas: roteiros.reduce((n, r) => n + r.escopos.filter((e) => e.kind === "jornada").length, 0),
  passos: todosPassos.length,
  assercoes: roteiros.reduce((n, r) => n + r.escopos.reduce((m, e) => m + e.assercoes.length, 0), 0),
  na: todosPassos.filter((p) => p.na).length,
};

if (args.has("--relatorio")) {
  for (const r of roteiros) {
    console.log(`\n${r.id}  (${r.tipo})  ${r.arquivo}`);
    for (const e of r.escopos) {
      console.log(`  ${e.kind === "jornada" ? "J" : "S"} ${e.id.padEnd(14)} passos=${String(e.stats.passos).padStart(2)} assercoes=${e.stats.assercoes} na=${e.stats.na}  ${e.titulo || ""}`);
    }
  }
  console.log("\nTOTAIS", JSON.stringify(totais));
}

if (erros.length && !args.has("--force")) {
  console.error(`\n${erros.length} ERRO(S) — nada foi escrito:\n`);
  for (const e of erros) console.error(`  [${e.codigo}] ${e.arquivo}:${e.linha}  ${e.msg}`);
  process.exit(1);
}
if (erros.length) for (const e of erros) avisos.push({ ...e, codigo: `FORCADO_${e.codigo}` });

const payload = {
  schemaVersion: SCHEMA_VERSION,
  geradoEm: new Date().toISOString(),
  gerador: { arquivo: "gerar-dados.mjs", versao: VERSAO },
  totais,
  glossario,
  diagnostico: { avisos },
  roteiros,
};

const saida =
  "// GERADO por gerar-dados.mjs — nao editar a mao.\n" +
  "// Fonte: docs-sep/roteiros-teste/*.md — rode `node gerar-dados.mjs` apos editar.\n" +
  "window.SEP_DADOS = " +
  JSON.stringify(payload, null, 2) +
  ";\n";

if (args.has("--check")) {
  let atual = "";
  try {
    atual = readFileSync(SAIDA, "utf8");
  } catch {}
  const semData = (s) => s.replace(/"geradoEm": "[^"]*"/, "");
  if (semData(atual) !== semData(saida)) {
    console.error("dados.js esta desatualizado. Rode: node gerar-dados.mjs");
    process.exit(1);
  }
  console.log("dados.js esta atualizado.");
  process.exit(0);
}

writeFileSync(SAIDA, saida);
console.log(`dados.js escrito — ${totais.passos} passos, ${totais.assercoes} assercoes, ${totais.na} N/A, ${totais.jornadas} jornadas, ${avisos.length} aviso(s).`);
if (avisos.length) for (const a of avisos) console.log(`  [${a.codigo}] ${a.arquivo}:${a.linha}  ${a.msg}`);
