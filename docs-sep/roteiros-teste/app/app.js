/* App de execucao dos roteiros de teste manual do SEP.
   Sem servidor, sem banco. Estado em localStorage; saida = JSON exportado.
   Fonte do conteudo: dados.js, gerado de ../*.md por gerar-dados.mjs. */

(function () {
  "use strict";

  const DADOS = window.SEP_DADOS;
  const STORE_VERSION = 1;
  const K_STORE = "SEP_ROTEIROS_V1";
  const K_UI = "SEP_ROTEIROS_UI_V1";
  const K_TEMA = "SEP_THEME";
  const STATUS = ["OK", "NOK", "BLOQUEADO"];

  const $ = (s) => document.querySelector(s);
  const el = (tag, cls, txt) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  };
  const hoje = () => new Date().toISOString().slice(0, 10);

  // ------------------------------------------------------------ persistencia

  let storageOk = true;
  const memoria = {};

  function testarStorage() {
    try {
      const k = "SEP_ROTEIROS_probe";
      localStorage.setItem(k, "1");
      localStorage.removeItem(k);
      return true;
    } catch (e) {
      return false;
    }
  }

  const ler = (k) => {
    if (!storageOk) return memoria[k] || null;
    try {
      return localStorage.getItem(k);
    } catch (e) {
      return null;
    }
  };
  const gravar = (k, v) => {
    if (!storageOk) {
      memoria[k] = v;
      return;
    }
    try {
      localStorage.setItem(k, v);
    } catch (e) {
      storageOk = false;
      memoria[k] = v;
      mostrarAvisoStorage("O navegador parou de aceitar gravação (cota ou modo privativo).");
    }
  };

  function mostrarAvisoStorage(motivo) {
    const n = $("#aviso-storage");
    n.hidden = false;
    n.textContent =
      "As marcações NÃO estão sendo salvas: " + motivo + " Exporte o JSON antes de fechar a aba.";
  }

  // ------------------------------------------------------------------- store

  const MIGRACOES = {};

  function storeVazio() {
    const id = hoje() + "-rodada-1";
    return { storeVersion: STORE_VERSION, rodadaAtiva: id, rodadas: { [id]: rodadaVazia(id, "Rodada 1") } };
  }

  function rodadaVazia(id, rotulo) {
    return {
      id,
      rotulo,
      criadaEm: new Date().toISOString(),
      atualizadaEm: new Date().toISOString(),
      finalizadaEm: null,
      dadosSchemaVersion: DADOS.schemaVersion,
      dadosGeradoEm: DADOS.geradoEm,
      hashesFonte: Object.fromEntries(DADOS.roteiros.map((r) => [r.id, r.hash])),
      registro: {},
      escopos: {},
      passos: {},
      ocorrencias: [],
      orfaos: {},
    };
  }

  let store, ui;
  let somenteLeitura = false;

  function carregarStore() {
    const raw = ler(K_STORE);
    if (!raw) return storeVazio();
    let s;
    try {
      s = JSON.parse(raw);
    } catch (e) {
      console.warn("store corrompido; começando vazio", e);
      return storeVazio();
    }
    if (s.storeVersion > STORE_VERSION) {
      somenteLeitura = true;
      mostrarAvisoStorage("este store foi gravado por uma versão mais nova do app; não vou sobrescrever.");
      return s;
    }
    while (s.storeVersion < STORE_VERSION) {
      s = MIGRACOES[s.storeVersion](s);
      s.storeVersion++;
    }
    return s;
  }

  function salvar() {
    if (somenteLeitura) return;
    rodada().atualizadaEm = new Date().toISOString();
    gravar(K_STORE, JSON.stringify(store));
  }
  const salvarUi = () => gravar(K_UI, JSON.stringify(ui));
  const rodada = () => store.rodadas[store.rodadaAtiva];
  const congelada = () => !!rodada().finalizadaEm || somenteLeitura;

  // ------------------------------------------------------------------ indice

  const idxPassos = new Map();
  const idxEscopos = new Map();
  const idxRoteiro = new Map();

  for (const r of DADOS.roteiros) {
    for (const e of r.escopos) {
      idxEscopos.set(e.key, e);
      idxRoteiro.set(e.key, r);
      e.itens = [...e.grupos.flatMap((g) => g.passos), ...e.assercoes];
      for (const p of e.itens) idxPassos.set(p.key, p);
      e.busca = (
        e.id +
        " " +
        (e.titulo || "") +
        " " +
        e.itens.map((p) => p.textoBusca).join(" ") +
        " " +
        Object.values(e.metaIndex || {}).join(" ")
      ).toLowerCase();
    }
  }

  // --------------------------------------------------------- reconciliacao

  function reconciliar() {
    const rd = rodada();
    let orfaos = 0;
    let drift = 0;
    for (const key of Object.keys(rd.passos)) {
      const atual = idxPassos.get(key);
      if (!atual) {
        rd.orfaos[key] = { ...rd.passos[key], rotuloUltimoVisto: key };
        delete rd.passos[key];
        orfaos++;
      } else if (rd.passos[key].h && rd.passos[key].h !== atual.hash) {
        rd.passos[key].revisar = 1; // nunca desmarca sozinho
        drift++;
      }
    }
    rd.hashesFonte = Object.fromEntries(DADOS.roteiros.map((r) => [r.id, r.hash]));
    rd.dadosGeradoEm = DADOS.geradoEm;
    if (orfaos || drift) salvar();
    return { orfaos, drift };
  }

  // ------------------------------------------------------------------ estado

  const marcado = (key) => !!(rodada().passos[key] && rodada().passos[key].m);
  const ocorrenciasDe = (key) => rodada().ocorrencias.filter((o) => o.passoKey === key);

  function concluido(p) {
    return p.na || marcado(p.key);
  }

  function progresso(escopo) {
    const t = escopo.itens.length;
    const f = escopo.itens.filter(concluido).length;
    return { feitos: f, total: t, pct: t ? Math.round((f / t) * 100) : 0 };
  }

  function progressoRoteiro(r) {
    let f = 0;
    let t = 0;
    for (const e of r.escopos) {
      const p = progresso(e);
      f += p.feitos;
      t += p.total;
    }
    return { feitos: f, total: t, pct: t ? Math.round((f / t) * 100) : 0 };
  }

  function alternar(key, valor) {
    if (congelada()) return;
    const p = idxPassos.get(key);
    if (!p || p.na) return;
    const rd = rodada();
    const atual = rd.passos[key] || {};
    rd.passos[key] = { ...atual, m: valor ? 1 : 0, t: Date.now(), h: p.hash };
    delete rd.passos[key].revisar;
    salvar();
  }

  // ------------------------------------------------------------------ filtros

  const FILTROS = [
    { id: "pendentes", rotulo: "Pendentes" },
    { id: "ocorrencia", rotulo: "Com ocorrência" },
    { id: "bloqueadas", rotulo: "Bloqueadas" },
    { id: "web", rotulo: "Web" },
    { id: "mobile", rotulo: "Mobile" },
    { id: "api", rotulo: "API" },
    { id: "negativas", rotulo: "Só negativas" },
  ];

  // O metaIndex e chaveado pelo rotulo escrito no .md ("Superfície", "Tipo").
  // Buscar sem acento evita que uma edicao de texto no corpus mate um filtro em
  // silencio — foi o que aconteceu quando "Superficie" virou "Superfície".
  const semAcento = (s) => String(s).normalize("NFD").replace(/\p{Diacritic}/gu, "");

  function meta(e, chave) {
    const idx = (e && e.metaIndex) || {};
    const alvo = semAcento(chave).toLowerCase();
    for (const k of Object.keys(idx)) if (semAcento(k).toLowerCase() === alvo) return idx[k];
    return "";
  }

  function escopoPassaFiltro(e) {
    const f = ui.filtros;
    const sup = meta(e, "Superficie");
    const tipo = meta(e, "Tipo");
    if (f.pendentes && progresso(e).pct === 100) return false;
    if (f.ocorrencia && !e.itens.some((p) => ocorrenciasDe(p.key).length)) return false;
    if (f.bloqueadas && (rodada().escopos[e.key] || {}).status !== "BLOQUEADO") return false;
    if (f.web && !/web/i.test(sup)) return false;
    if (f.mobile && !/mobile/i.test(sup)) return false;
    if (f.api && !/api/i.test(sup)) return false;
    if (f.negativas && !/negativa/i.test(tipo)) return false;
    if (ui.busca && !e.busca.includes(ui.busca.toLowerCase())) return false;
    return true;
  }

  // ---------------------------------------------------------------- render

  let escopoAtivo = null;
  let focoIdx = -1;

  function render() {
    renderFiltros();
    renderRail();
    renderPalco();
    renderLateral();
    renderRodape();
    renderGlobal();
  }

  function renderGlobal() {
    let f = 0;
    let t = 0;
    for (const r of DADOS.roteiros) {
      const p = progressoRoteiro(r);
      f += p.feitos;
      t += p.total;
    }
    $("#barra-global").style.width = (t ? (f / t) * 100 : 0) + "%";
    $("#txt-global").textContent = `${f}/${t}`;
  }

  function renderFiltros() {
    const c = $("#filtros");
    c.textContent = "";
    for (const f of FILTROS) {
      const b = el("button", "chip", f.rotulo);
      b.setAttribute("aria-pressed", ui.filtros[f.id] ? "true" : "false");
      b.onclick = () => {
        ui.filtros[f.id] = !ui.filtros[f.id];
        salvarUi();
        render();
      };
      c.appendChild(b);
    }
    const lim = el("button", "chip", "Limpar");
    lim.onclick = () => {
      ui.filtros = {};
      ui.busca = "";
      $("#busca").value = "";
      salvarUi();
      render();
    };
    c.appendChild(lim);
  }

  function renderRail() {
    const rail = $("#rail");
    rail.textContent = "";
    let algum = false;

    for (const r of DADOS.roteiros) {
      const visiveis = r.escopos.filter(escopoPassaFiltro);
      if (!visiveis.length) continue;
      algum = true;
      const bloco = el("div", "rail-roteiro");
      const pr = progressoRoteiro(r);
      const cab = el("button", "rail-cab");
      cab.appendChild(el("span", "ponto " + classePonto(pr.pct, null)));
      cab.appendChild(el("span", null, r.id));
      const num = el("span", "rail-num", `${pr.feitos}/${pr.total}`);
      cab.appendChild(num);
      cab.onclick = () => irPara(visiveis[0].key);
      bloco.appendChild(cab);

      for (const e of visiveis) {
        const p = progresso(e);
        const st = (rodada().escopos[e.key] || {}).status || null;
        const b = el("button", "rail-item");
        b.setAttribute("aria-current", e.key === (escopoAtivo && escopoAtivo.key) ? "true" : "false");
        b.appendChild(el("span", "ponto " + classePonto(p.pct, st)));
        b.appendChild(el("span", "rail-id", e.id));
        b.appendChild(el("span", "rail-tit", e.titulo || ""));
        b.appendChild(el("span", "rail-num", `${p.feitos}/${p.total}`));
        b.onclick = () => irPara(e.key);
        bloco.appendChild(b);
      }
      rail.appendChild(bloco);
    }
    if (!algum) rail.appendChild(el("p", "vazio", "Nenhum escopo bate com os filtros."));
  }

  function classePonto(pct, status) {
    if (status === "NOK") return "nok";
    if (status === "BLOQUEADO") return "bloqueado";
    if (pct === 100) return "completo";
    if (pct > 0) return "parcial";
    return "";
  }

  function renderPalco() {
    const p = $("#palco");
    p.textContent = "";
    if (!escopoAtivo) {
      p.appendChild(el("p", "vazio", "Escolha um roteiro na lateral."));
      return;
    }
    const e = escopoAtivo;
    const r = idxRoteiro.get(e.key);

    const cab = el("div", "escopo-cab");
    cab.appendChild(el("span", "escopo-id", e.id));
    const h = el("h1", "escopo-tit", e.titulo || e.id);
    cab.appendChild(h);
    p.appendChild(cab);
    p.appendChild(el("p", "mono", `${r.id} · ${r.arquivo}`));

    // status do escopo
    const st = el("div", "escopo-status");
    const atual = (rodada().escopos[e.key] || {}).status || null;
    for (const v of STATUS) {
      const b = el("button", "status-op", v);
      b.dataset.v = v;
      b.setAttribute("aria-pressed", atual === v ? "true" : "false");
      b.onclick = () => {
        if (congelada()) return;
        const rd = rodada();
        rd.escopos[e.key] = { status: atual === v ? null : v, atualizadoEm: new Date().toISOString() };
        salvar();
        render();
      };
      st.appendChild(b);
    }
    p.appendChild(st);

    if (e.meta && e.meta.length) {
      const dl = el("dl", "meta");
      for (const m of e.meta) {
        dl.appendChild(el("dt", null, m.chave));
        const dd = el("dd");
        const tom = dica(m.chave, m.texto);
        if (tom) {
          const b = el("span", "badge " + tom);
          b.innerHTML = m.html;
          dd.appendChild(b);
        } else {
          dd.innerHTML = m.html;
        }
        dl.appendChild(dd);
      }
      p.appendChild(dl);
    }

    for (const n of e.notas || []) {
      const d = el("div", "nota");
      d.innerHTML = n;
      p.appendChild(d);
    }

    const passos = e.grupos.flatMap((g) => g.passos);
    if (passos.length) {
      p.appendChild(el("div", "marca-bloco", "Passos"));
      for (const g of e.grupos) {
        if (g.tituloHtml) {
          const t = el("div", "grupo-tit");
          t.innerHTML = g.tituloHtml;
          p.appendChild(t);
        }
        for (const passo of g.passos) p.appendChild(renderPasso(passo));
      }
    }

    if (e.assercoes.length) {
      p.appendChild(el("div", "marca-bloco", "Resultado final esperado"));
      for (const a of e.assercoes) p.appendChild(renderPasso(a));
    }
    aplicarFoco();
  }

  // Badge so quando o valor e curto: metade das linhas de meta sao frases inteiras
  // (ex.: Step-up de J-070.W), e frase dentro de pill fica ilegivel.
  function dica(chave, valor) {
    if ((valor || "").length > 28) return null;
    const c = semAcento(chave).toLowerCase();
    if (c === "tipo") return /negativa/i.test(valor) ? "destructive" : "success";
    if (c === "step-up") return /estrito/i.test(valor) ? "warning" : "neutro";
    if (c === "superficie") return "primary";
    if (c === "estado") return /bloquead/i.test(valor) ? "neutro" : "warning";
    return null;
  }

  function renderPasso(p) {
    const linha = el("div", "passo");
    linha.dataset.key = p.key;
    const feito = concluido(p);
    const ocs = ocorrenciasDe(p.key);
    if (feito) linha.classList.add("feito");
    if (p.na) linha.classList.add("na");
    if (ocs.length) linha.classList.add("com-oc");

    const cb = el("input");
    cb.type = "checkbox";
    cb.checked = feito;
    cb.disabled = p.na || congelada();
    cb.title = p.na ? "N/A: " + (p.naMotivo || "") : "Marcar";
    cb.onchange = () => {
      alternar(p.key, cb.checked);
      render();
    };
    linha.appendChild(cb);

    const corpo = el("div", "passo-corpo");
    const txt = el("div", "passo-txt");
    if (p.id) {
      const id = el("span", "passo-id", p.id);
      txt.appendChild(id);
    }
    const span = el("span");
    span.innerHTML = p.textoHtml;
    txt.appendChild(span);
    corpo.appendChild(txt);

    if (p.na && p.naMotivo) {
      const n = el("div", "aviso-revisar", "N/A — " + p.naMotivo);
      corpo.appendChild(n);
    }
    // Ordem do fonte: texto -> Como -> Esperado, cada um seguido dos seus
    // blocos de codigo. Antes todos os blocos caiam depois do Esperado, o que
    // punha o body de um request abaixo do resultado que ele produz.
    const REGIOES = ["texto", "como", "esperado"];
    const blocosDe = (regiao) =>
      (p.blocos || []).filter((b) => (REGIOES.includes(b.regiao) ? b.regiao : "texto") === regiao);

    for (const b of blocosDe("texto")) corpo.appendChild(renderBloco(b));

    if (p.comoHtml) {
      const como = el("div", "passo-como");
      como.innerHTML = "<b>Como:</b> " + p.comoHtml;
      corpo.appendChild(como);
    }
    for (const b of blocosDe("como")) corpo.appendChild(renderBloco(b));

    if (p.esperadoHtml) {
      const esp = el("div", "passo-esp");
      esp.innerHTML = "<b>Esperado:</b> " + p.esperadoHtml;
      corpo.appendChild(esp);
    }
    for (const b of blocosDe("esperado")) corpo.appendChild(renderBloco(b));

    const marca = rodada().passos[p.key];
    if (marca && marca.revisar) {
      corpo.appendChild(
        el("div", "aviso-revisar", "O texto deste passo mudou depois da marcação — revise."),
      );
    }

    if (ocs.length) {
      const lista = el("div", "oc-lista");
      for (const o of ocs) {
        const c = el("div", "oc-card");
        c.appendChild(el("div", null, o.oQueAconteceu));
        if (o.esperado) c.appendChild(el("div", "mono", "esperado: " + o.esperado));
        if (o.issue) c.appendChild(el("div", "mono", "issue: " + o.issue));
        const rm = el("button", "btn btn-ghost", "Remover");
        rm.onclick = () => {
          const rd = rodada();
          rd.ocorrencias = rd.ocorrencias.filter((x) => x.id !== o.id);
          salvar();
          render();
        };
        if (!congelada()) c.appendChild(rm);
        lista.appendChild(c);
      }
      corpo.appendChild(lista);
    }

    const acoes = el("div", "passo-acoes");
    const bo = el("button", "btn btn-ghost", "Ocorrência");
    bo.onclick = () => abrirOcorrencia(p, corpo);
    if (!congelada()) acoes.appendChild(bo);
    linha.appendChild(corpo);
    linha.appendChild(acoes);
    return linha;
  }

  function renderBloco(b) {
    const w = el("div", "bloco-cod");
    const pre = el("pre");
    pre.appendChild(el("code", null, b.conteudo));
    w.appendChild(pre);
    const btn = el("button", "btn btn-ghost copiar", "copiar");
    btn.onclick = () => {
      const done = () => {
        btn.textContent = "copiado";
        setTimeout(() => (btn.textContent = "copiar"), 1200);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(b.conteudo).then(done, fallbackCopia);
      } else fallbackCopia();

      function fallbackCopia() {
        // file:// nao e secure context em alguns navegadores
        const ta = el("textarea");
        ta.value = b.conteudo;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand("copy");
          done();
        } catch (e) {
          btn.textContent = "falhou";
        }
        ta.remove();
      }
    };
    w.appendChild(btn);
    return w;
  }

  function abrirOcorrencia(p, corpo) {
    if (corpo.querySelector(".oc-form")) return;
    const f = el("form", "oc-form");
    const l1 = el("label", null, "O que aconteceu");
    const t1 = el("textarea");
    t1.required = true;
    const l2 = el("label", null, "O que era esperado");
    const t2 = el("textarea");
    t2.value = (p.esperadoHtml || "").replace(/<[^>]+>/g, "");
    const l3 = el("label", null, "Issue (opcional)");
    const t3 = el("input", "input");
    const salvarBtn = el("button", "btn btn-primario", "Registrar");
    const cancelar = el("button", "btn btn-ghost", "Cancelar");
    cancelar.type = "button";
    cancelar.onclick = () => f.remove();
    f.append(l1, t1, l2, t2, l3, t3, salvarBtn, cancelar);
    f.onsubmit = (ev) => {
      ev.preventDefault();
      const rd = rodada();
      rd.ocorrencias.push({
        id: "oc-" + Date.now(),
        passoKey: p.key,
        escopoKey: escopoAtivo.key,
        oQueAconteceu: t1.value.trim(),
        esperado: t2.value.trim(),
        issue: t3.value.trim(),
        criadaEm: new Date().toISOString(),
      });
      salvar();
      render();
    };
    corpo.appendChild(f);
    t1.focus();
  }

  function renderLateral() {
    const c = $("#lateral");
    c.textContent = "";
    if (!escopoAtivo) return;
    const r = idxRoteiro.get(escopoAtivo.key);
    const rd = rodada();

    const orfaos = Object.keys(rd.orfaos || {});
    if (orfaos.length) {
      const o = el("div", "orfaos");
      o.appendChild(el("strong", null, `${orfaos.length} marcação(ões) órfã(s)`));
      o.appendChild(el("div", null, "Passos que sumiram dos .md depois de marcados."));
      const b = el("button", "btn btn-ghost", "Descartar");
      b.onclick = () => {
        if (confirm("Descartar as marcações órfãs? Não dá para desfazer.")) {
          rd.orfaos = {};
          salvar();
          render();
        }
      };
      o.appendChild(b);
      c.appendChild(o);
    }

    c.appendChild(el("h3", null, "Registro · " + r.id));
    const form = el("div", "registro");
    const dados = (rd.registro[r.id] = rd.registro[r.id] || {});
    for (const campo of r.registroCampos || []) {
      const lab = el("label", null, campo.rotulo);
      const inp = campo.tipo === "textarea" ? el("textarea") : el("input", "input");
      inp.value = dados[campo.chave] || "";
      inp.disabled = congelada();
      inp.oninput = () => {
        dados[campo.chave] = inp.value;
        salvar();
      };
      lab.appendChild(inp);
      form.appendChild(lab);
    }
    if (!(r.registroCampos || []).length) form.appendChild(el("p", "mono", "Sem campos de registro."));
    c.appendChild(form);

    c.appendChild(el("h3", null, `Ocorrências (${rd.ocorrencias.length})`));
    const lista = el("div", "oc-lista");
    for (const o of rd.ocorrencias) {
      const card = el("div", "oc-card");
      const link = el("button", "btn btn-ghost", o.passoKey.split("/").slice(1).join("/"));
      link.onclick = () => irPara(o.escopoKey);
      card.appendChild(link);
      card.appendChild(el("div", null, o.oQueAconteceu));
      lista.appendChild(card);
    }
    if (!rd.ocorrencias.length) lista.appendChild(el("p", "mono", "Nenhuma ocorrência registrada."));
    c.appendChild(lista);
  }

  function renderRodape() {
    const d = new Date(DADOS.geradoEm);
    const dias = Math.floor((Date.now() - d.getTime()) / 86400000);
    $("#rodape-info").textContent =
      `dados gerados em ${d.toLocaleString("pt-BR")} · ${DADOS.totais.passos} passos · ` +
      `${DADOS.totais.jornadas} jornadas` +
      (congelada() ? " · RODADA CONGELADA (somente leitura)" : "");
    const av = $("#rodape-avisos");
    av.textContent = "";
    if (dias > 7) {
      av.appendChild(
        el("span", "badge warning", `dados.js tem ${dias} dias — rode: node gerar-dados.mjs`),
      );
    }
    if (DADOS.diagnostico.avisos.length) {
      const b = el("span", "badge neutro", `${DADOS.diagnostico.avisos.length} aviso(s) do gerador`);
      b.title = DADOS.diagnostico.avisos.map((a) => `[${a.codigo}] ${a.arquivo}:${a.linha} ${a.msg}`).join("\n");
      av.appendChild(b);
    }
  }

  // ------------------------------------------------------------- navegacao

  function irPara(escopoKey) {
    location.hash = "#/" + escopoKey;
  }

  function aplicarRota() {
    const key = decodeURIComponent(location.hash.replace(/^#\//, ""));
    escopoAtivo = idxEscopos.get(key) || null;
    if (!escopoAtivo) {
      const primeiro = DADOS.roteiros[0] && DADOS.roteiros[0].escopos[0];
      escopoAtivo = primeiro || null;
    }
    focoIdx = -1;
    render();
    $("#palco").scrollIntoView({ block: "start" });
  }

  function escoposVisiveis() {
    return DADOS.roteiros.flatMap((r) => r.escopos.filter(escopoPassaFiltro));
  }

  function moverEscopo(delta) {
    const lista = escoposVisiveis();
    const i = lista.findIndex((e) => escopoAtivo && e.key === escopoAtivo.key);
    const alvo = lista[(i + delta + lista.length) % lista.length];
    if (alvo) irPara(alvo.key);
  }

  function passosDoPalco() {
    return Array.from(document.querySelectorAll("#palco .passo"));
  }

  function aplicarFoco() {
    const ps = passosDoPalco();
    ps.forEach((n) => n.classList.remove("foco"));
    if (focoIdx >= 0 && ps[focoIdx]) {
      ps[focoIdx].classList.add("foco");
      ps[focoIdx].scrollIntoView({ block: "nearest" });
    }
  }

  function moverFoco(delta) {
    const ps = passosDoPalco();
    if (!ps.length) return;
    focoIdx = focoIdx < 0 ? (delta > 0 ? 0 : ps.length - 1) : (focoIdx + delta + ps.length) % ps.length;
    aplicarFoco();
  }

  // -------------------------------------------------------- export / import

  function exportar() {
    const rd = rodada();
    const payload = {
      tipo: "sep-roteiros-execucao",
      exportadoEm: new Date().toISOString(),
      storeVersion: STORE_VERSION,
      dadosSchemaVersion: DADOS.schemaVersion,
      dadosGeradoEm: DADOS.geradoEm,
      totaisFonte: DADOS.totais,
      resumo: resumo(),
      rodada: rd,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = el("a");
    a.href = URL.createObjectURL(blob);
    a.download = `execucao-${rd.id}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function resumo() {
    const out = { porRoteiro: {}, escoposPorStatus: { OK: 0, NOK: 0, BLOQUEADO: 0, semStatus: 0 } };
    for (const r of DADOS.roteiros) out.porRoteiro[r.id] = progressoRoteiro(r);
    for (const [, e] of idxEscopos) {
      const s = (rodada().escopos[e.key] || {}).status;
      out.escoposPorStatus[s || "semStatus"]++;
    }
    out.ocorrencias = rodada().ocorrencias.length;
    return out;
  }

  // Uma rodada importada pode vir de outra versao do app, ter sido editada a mao
  // ou mesclada. reconciliar() e o render assumem o shape completo, entao
  // completa-lo aqui e a unica defesa possivel: gravar primeiro e descobrir o
  // buraco depois deixa a rodada quebrada como ativa, e o boot seguinte morre no
  // mesmo ponto — sem UI para sair disso.
  function normalizarRodada(rd) {
    const mapa = (v) =>
      v && typeof v === "object" && !Array.isArray(v)
        ? Object.fromEntries(Object.entries(v).filter(([, x]) => x && typeof x === "object"))
        : {};
    return {
      ...rodadaVazia(rd.id, rd.rotulo || rd.id),
      ...rd,
      registro: mapa(rd.registro),
      escopos: mapa(rd.escopos),
      passos: mapa(rd.passos),
      orfaos: mapa(rd.orfaos),
      ocorrencias: (Array.isArray(rd.ocorrencias) ? rd.ocorrencias : [])
        .filter((o) => o && typeof o === "object" && typeof o.passoKey === "string")
        .map((o, i) => ({ ...o, id: o.id || `oc-importada-${i}` })),
    };
  }

  function importar(file) {
    const fr = new FileReader();
    fr.onload = () => {
      let p;
      try {
        p = JSON.parse(fr.result);
      } catch (e) {
        alert("Arquivo inválido: não é JSON.");
        return;
      }
      const rd = p.rodada || p;
      if (!rd || typeof rd !== "object" || !rd.id || !rd.passos) {
        alert("Arquivo inválido: não parece uma execução exportada por este app.");
        return;
      }
      if (somenteLeitura) {
        alert(
          "Importação bloqueada: este store foi gravado por uma versão mais nova " +
            "do app e não vou sobrescrever o que esta versão não entende.",
        );
        return;
      }
      if (store.rodadas[rd.id] && !confirm(`Já existe a rodada "${rd.id}". Sobrescrever?`)) return;

      const anterior = { rodada: store.rodadas[rd.id], ativa: store.rodadaAtiva };
      store.rodadas[rd.id] = normalizarRodada(rd);
      store.rodadaAtiva = rd.id;

      let rec;
      try {
        rec = reconciliar();
        render();
        renderSeletorRodada();
      } catch (e) {
        // normalizarRodada cobre o shape conhecido, nao o desconhecido.
        console.error("importação revertida", e);
        if (anterior.rodada) store.rodadas[rd.id] = anterior.rodada;
        else delete store.rodadas[rd.id];
        store.rodadaAtiva = anterior.ativa;
        salvar();
        render();
        renderSeletorRodada();
        alert("Arquivo inválido: a rodada não pode ser carregada. Nada foi alterado.");
        return;
      }
      salvar();
      alert(
        `Rodada "${rd.id}" importada.` +
          (rec.orfaos || rec.drift ? `\n${rec.orfaos} órfão(s), ${rec.drift} passo(s) com texto alterado.` : ""),
      );
    };
    fr.readAsText(file);
  }

  // ------------------------------------------------------------- rodadas

  function renderSeletorRodada() {
    const s = $("#sel-rodada");
    s.textContent = "";
    for (const id of Object.keys(store.rodadas)) {
      const r = store.rodadas[id];
      const o = el("option", null, r.rotulo + (r.finalizadaEm ? " (fechada)" : ""));
      o.value = id;
      if (id === store.rodadaAtiva) o.selected = true;
      s.appendChild(o);
    }
  }

  function novaRodada() {
    const rotulo = prompt("Nome da rodada:", "Rodada " + (Object.keys(store.rodadas).length + 1));
    if (!rotulo) return;
    const id = hoje() + "-" + rotulo.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (store.rodadas[id]) {
      alert("Já existe uma rodada com esse nome hoje.");
      return;
    }
    store.rodadas[id] = rodadaVazia(id, rotulo);
    store.rodadaAtiva = id;
    salvar();
    renderSeletorRodada();
    render();
  }

  // --------------------------------------------------------------- glossario

  // O glossario vem do hub (secao "Glossario"). Um dados.js antigo nao tem o
  // campo: nesse caso o botao some em vez de abrir um dialogo vazio.
  function montarGlossario() {
    const termos = DADOS.glossario || [];
    const btn = $("#btn-glossario");
    if (!termos.length) {
      btn.hidden = true;
      return;
    }

    const lista = $("#glossario-lista");
    const pares = termos.map((g) => {
      const dt = el("dt", null, g.termo);
      const dd = el("dd");
      dd.innerHTML = g.definicaoHtml;
      lista.append(dt, dd);
      return { busca: (g.termo + " " + dd.textContent).toLowerCase(), dt, dd };
    });

    const vazio = el("p", "glossario-vazio", "Nenhum termo bate com o filtro.");
    vazio.hidden = true;
    lista.after(vazio);

    const filtro = $("#glossario-filtro");
    filtro.oninput = () => {
      const q = filtro.value.trim().toLowerCase();
      let visiveis = 0;
      for (const par of pares) {
        const bate = !q || par.busca.includes(q);
        par.dt.hidden = !bate;
        par.dd.hidden = !bate;
        if (bate) visiveis++;
      }
      vazio.hidden = visiveis > 0;
    };
    btn.onclick = abrirGlossario;
  }

  function abrirGlossario() {
    if ($("#btn-glossario").hidden) return;
    $("#dlg-glossario").showModal();
    $("#glossario-filtro").focus();
  }

  // ------------------------------------------------------------------ boot

  function boot() {
    if (!DADOS || !DADOS.roteiros) {
      document.body.innerHTML =
        '<p style="padding:32px">dados.js não carregou. Rode <code>node gerar-dados.mjs</code> nesta pasta.</p>';
      return;
    }

    storageOk = testarStorage();
    if (!storageOk) {
      mostrarAvisoStorage("o navegador bloqueia armazenamento local nesta página (comum em file:// no Safari).");
    }

    store = carregarStore();
    try {
      ui = JSON.parse(ler(K_UI) || "{}");
    } catch (e) {
      ui = {};
    }
    ui.filtros = ui.filtros || {};
    ui.busca = "";

    const rec = reconciliar();
    if (rec.orfaos || rec.drift) {
      console.info(`reconciliação: ${rec.orfaos} órfão(s), ${rec.drift} com texto alterado`);
    }

    renderSeletorRodada();
    montarGlossario();
    aplicarRota();

    window.addEventListener("hashchange", aplicarRota);
    // somenteLeitura NAO se limpa aqui: ela e propriedade do store carregado
    // (gravado por uma versao mais nova do app), nao da rodada escolhida.
    // Zerar aqui devolvia a escrita e sobrescrevia exatamente o que ela protege.
    $("#sel-rodada").onchange = (e) => {
      store.rodadaAtiva = e.target.value;
      salvar();
      reconciliar();
      render();
    };
    $("#btn-nova-rodada").onclick = novaRodada;
    $("#btn-exportar").onclick = exportar;
    $("#btn-importar").onclick = () => $("#file-importar").click();
    $("#file-importar").onchange = (e) => {
      if (e.target.files[0]) importar(e.target.files[0]);
      e.target.value = "";
    };
    $("#btn-ajuda").onclick = () => $("#dlg-ajuda").showModal();
    $("#btn-tema").onclick = alternarTema;

    let deb;
    $("#busca").oninput = (e) => {
      clearTimeout(deb);
      deb = setTimeout(() => {
        ui.busca = e.target.value.trim();
        render();
      }, 80);
    };

    document.addEventListener("keydown", atalhos);
  }

  function alternarTema() {
    const escuro = document.documentElement.classList.toggle("dark");
    gravar(K_TEMA, escuro ? "dark" : "light");
  }

  function atalhos(ev) {
    const emCampo = /^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName);
    if (ev.key === "Escape") {
      if (emCampo) ev.target.blur();
      for (const d of document.querySelectorAll("dialog[open]")) d.close();
      return;
    }
    if (emCampo || ev.ctrlKey || ev.metaKey || ev.altKey) return;

    switch (ev.key) {
      case "j":
        ev.preventDefault();
        moverFoco(1);
        break;
      case "k":
        ev.preventDefault();
        moverFoco(-1);
        break;
      case "n":
        ev.preventDefault();
        moverEscopo(1);
        break;
      case "p":
        ev.preventDefault();
        moverEscopo(-1);
        break;
      case "/":
        ev.preventDefault();
        $("#busca").focus();
        break;
      case "t":
        alternarTema();
        break;
      case "?":
        $("#dlg-ajuda").showModal();
        break;
      case "g":
        ev.preventDefault();
        abrirGlossario();
        break;
      case "f":
        ui.filtros.pendentes = !ui.filtros.pendentes;
        salvarUi();
        render();
        break;
      case " ":
      case "x": {
        const n = passosDoPalco()[focoIdx];
        if (!n) return;
        ev.preventDefault();
        const cb = n.querySelector('input[type="checkbox"]');
        if (cb && !cb.disabled) {
          cb.checked = !cb.checked;
          cb.onchange();
        }
        break;
      }
      case "Enter": {
        const n = passosDoPalco()[focoIdx];
        if (!n) return;
        ev.preventDefault();
        const b = n.querySelector(".passo-acoes .btn");
        if (b) b.click();
        break;
      }
    }
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
