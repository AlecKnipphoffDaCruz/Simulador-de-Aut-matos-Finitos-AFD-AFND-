/**
 * app.js — interface gráfica do simulador.
 * Usa o núcleo (automato.js) e só cuida de desenhar e controlar a animação.
 */
(function () {
  const A = window.Automato;
  const NS = 'http://www.w3.org/2000/svg';
  let R = 26; // raio dos estados (aumenta se o nome do estado for longo)

  const $ = (id) => document.getElementById(id);
  const el = (nome, attrs, pai) => {
    const e = document.createElementNS(NS, nome);
    Object.keys(attrs || {}).forEach((k) => e.setAttribute(k, attrs[k]));
    if (pai) pai.appendChild(e);
    return e;
  };

  // ---------------- estado da aplicação ----------------
  let auto = null; // autômato validado
  let resultado = null; // saída de simular()
  let passo = 0; // passo atual (índice em resultado.passos)
  let palavra = '';
  let timer = null;
  let pos = {}; // posição (x,y) de cada estado
  let grupos = []; // arestas agrupadas (para desenhar/destacar)

  // ---------------- carregar exemplos ----------------
  const EXEMPLOS = window.EXEMPLOS || {};
  const seletor = $('exemplo');
  Object.keys(EXEMPLOS).forEach((nome) => {
    const o = document.createElement('option');
    o.value = nome;
    o.textContent = nome;
    seletor.appendChild(o);
  });

  // ---------------- mensagens ----------------
  function mostrarErros(lista) {
    const caixa = $('erros');
    if (!lista || !lista.length) {
      caixa.hidden = true;
      caixa.innerHTML = '';
      return;
    }
    caixa.hidden = false;
    caixa.innerHTML = '<strong>Não foi possível carregar o autômato:</strong><ul>' +
      lista.map((e) => '<li>' + escapar(e) + '</li>').join('') + '</ul>';
  }
  const escapar = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------------- carregar autômato do JSON ----------------
  function carregar() {
    pararAuto();
    const lido = A.lerJSON($('json').value);
    const v = lido.erros ? { erros: lido.erros } : A.validar(lido.spec);
    mostrarErros(v.erros);
    if (v.erros.length) {
      auto = null;
      resultado = null;
      desenharVazio();
      atualizarTudo();
      return;
    }
    auto = v.automato;
    calcularLayout();
    iniciarSimulacao();
  }

  function iniciarSimulacao() {
    pararAuto();
    if (!auto) return;
    palavra = $('palavra').value;
    resultado = A.simular(auto, palavra);
    passo = 0;
    desenhar();
    atualizarTudo();
  }

  // ---------------- layout automático ----------------
  function calcularLayout() {
    const maior = Math.max(...auto.estados.map((e) => [...e].length));
    R = Math.max(26, Math.ceil(maior * 4.6) + 10);

    // profundidade por busca em largura a partir do estado inicial
    const prof = {};
    prof[auto.inicial] = 0;
    const fila = [auto.inicial];
    const arestas = A.listarArestas(auto);
    while (fila.length) {
      const e = fila.shift();
      arestas.filter((a) => a.de === e).forEach((a) => {
        if (!(a.para in prof)) {
          prof[a.para] = prof[e] + 1;
          fila.push(a.para);
        }
      });
    }
    let maxProf = Math.max(...Object.values(prof));
    auto.estados.forEach((e) => {
      if (!(e in prof)) prof[e] = maxProf + 1; // inalcançáveis ficam no fim
    });
    maxProf = Math.max(...Object.values(prof));

    const colunas = {};
    auto.estados.forEach((e) => (colunas[prof[e]] = (colunas[prof[e]] || []).concat(e)));
    const maxLinhas = Math.max(...Object.values(colunas).map((c) => c.length));

    const dx = Math.max(170, 2 * R + 100), dy = Math.max(120, 2 * R + 40), margemX = 90, margemY = 90;
    const largura = Math.max(560, margemX * 2 + maxProf * dx);
    const altura = Math.max(300, margemY * 2 + (maxLinhas - 1) * dy);
    pos = {};
    Object.keys(colunas).forEach((c) => {
      const lista = colunas[c];
      const total = (lista.length - 1) * dy;
      lista.forEach((e, i) => {
        pos[e] = { x: margemX + c * dx, y: altura / 2 - total / 2 + i * dy, col: +c };
      });
    });
    pos.__w = largura;
    pos.__h = altura;

    // agrupa arestas com mesma origem/destino: "0,1" em uma seta só
    const mapa = {};
    arestas.forEach((a) => {
      const k = a.de + '→' + a.para;
      (mapa[k] = mapa[k] || { de: a.de, para: a.para, simbolos: [] }).simbolos.push(a.simbolo);
    });
    grupos = Object.values(mapa);
  }

  // ---------------- desenho ----------------
  const svg = $('grafo');

  function desenharVazio() {
    svg.innerHTML = '';
    svg.setAttribute('viewBox', '0 0 560 220');
    const t = el('text', { x: 280, y: 110, 'text-anchor': 'middle', class: 'vazio' }, svg);
    t.textContent = 'Carregue um autômato válido para ver o desenho';
  }

  function desenhar() {
    if (!auto) return desenharVazio();
    svg.innerHTML = '';
    svg.setAttribute('viewBox', `0 0 ${pos.__w} ${pos.__h}`);

    const defs = el('defs', {}, svg);
    ['normal', 'ativa'].forEach((tipo) => {
      const m = el('marker', { id: 'seta-' + tipo, viewBox: '0 0 10 10', refX: 9, refY: 5, markerUnits: 'userSpaceOnUse', markerWidth: 12, markerHeight: 12, orient: 'auto-start-reverse' }, defs);
      el('path', { d: 'M0,0 L10,5 L0,10 z', class: 'seta-' + tipo }, m);
    });

    const ativas = new Set();
    const p = resultado.passos[passo];
    if (p && p.aresta) ativas.add(p.aresta.de + '|' + p.aresta.simbolo + '|' + p.aresta.para);

    // arestas
    grupos.forEach((g) => {
      const usada = g.simbolos.some((s) => ativas.has(g.de + '|' + s + '|' + g.para));
      desenharAresta(g, usada);
    });

    // seta de entrada no estado inicial
    const pi = pos[auto.inicial];
    el('line', { x1: pi.x - R - 38, y1: pi.y, x2: pi.x - R - 2, y2: pi.y, class: 'aresta', 'marker-end': 'url(#seta-normal)' }, svg);

    // estados
    const ultimo = passo === resultado.passos.length - 1;
    const ativosAgora = new Set(p && p.estado ? [p.estado] : []);
    auto.estados.forEach((e) => {
      const { x, y } = pos[e];
      const final = auto.finais.includes(e);
      let classe = 'estado';
      if (ativosAgora.has(e)) {
        classe += ' ativo';
        if (ultimo) classe += resultado.aceita && final ? ' aceito' : ' rejeitado';
      }
      const g = el('g', { class: classe }, svg);
      el('circle', { cx: x, cy: y, r: R }, g);
      if (final) el('circle', { cx: x, cy: y, r: R - 5, class: 'anel' }, g);
      const t = el('text', { x, y: y + 5, 'text-anchor': 'middle' }, g);
      t.textContent = e;
    });
  }

  function desenharAresta(g, usada) {
    const a = pos[g.de], b = pos[g.para];
    const classe = 'aresta' + (usada ? ' ativa' : '');
    const marcador = 'url(#seta-' + (usada ? 'ativa' : 'normal') + ')';
    const rotulo = g.simbolos.join(', ');

    if (g.de === g.para) {
      // laço em cima do estado
      const d = `M ${a.x - 14} ${a.y - R + 3} C ${a.x - 38} ${a.y - R - 46}, ${a.x + 38} ${a.y - R - 46}, ${a.x + 14} ${a.y - R + 3}`;
      el('path', { d, class: classe, 'marker-end': marcador }, svg);
      texto(a.x, a.y - R - 38, rotulo, usada);
      return;
    }

    const temVolta = grupos.some((o) => o.de === g.para && o.para === g.de);
    const distCol = Math.abs(a.col - b.col);
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    const nx = -dy / len, ny = dx / len; // normal
    let curva = 0;
    if (temVolta) curva = 34;
    else if (distCol > 1 || (distCol === 0 && Math.abs(dy) > 130)) curva = 46;
    // ponto de controle
    const cx = (a.x + b.x) / 2 + nx * curva * 2;
    const cy = (a.y + b.y) / 2 + ny * curva * 2;
    const unit = (px, py, qx, qy) => {
      const l = Math.hypot(qx - px, qy - py) || 1;
      return [(qx - px) / l, (qy - py) / l];
    };
    const [ux, uy] = unit(a.x, a.y, cx, cy);
    const [vx, vy] = unit(b.x, b.y, cx, cy);
    const x0 = a.x + ux * R, y0 = a.y + uy * R;
    const x2 = b.x + vx * (R + 3), y2 = b.y + vy * (R + 3);
    el('path', { d: `M ${x0} ${y0} Q ${cx} ${cy} ${x2} ${y2}`, class: classe, 'marker-end': marcador }, svg);
    // rótulo no meio da curva, um pouco afastado
    const mx = 0.25 * x0 + 0.5 * cx + 0.25 * x2;
    const my = 0.25 * y0 + 0.5 * cy + 0.25 * y2;
    const lado = curva === 0 ? 1 : Math.sign(curva);
    texto(mx + nx * 13 * lado, my + ny * 13 * lado + 4, rotulo, usada);
  }

  function texto(x, y, conteudo, usada) {
    const t = el('text', { x, y, 'text-anchor': 'middle', class: 'rotulo' + (usada ? ' ativa' : '') }, svg);
    t.textContent = conteudo;
  }

  // ---------------- fita, log, tabela ----------------
  function desenharFita() {
    const fita = $('fita');
    fita.innerHTML = '';
    if (!resultado) return;
    const simbolos = [...palavra];
    if (simbolos.length === 0) {
      fita.innerHTML = '<span class="fita-vazia">(palavra vazia)</span>';
      return;
    }
    simbolos.forEach((c, i) => {
      const s = document.createElement('span');
      s.className = 'celula';
      if (i < passo) s.classList.add('lida');
      if (i === passo) s.classList.add('cabeca'); // próximo símbolo a ser lido
      const invalida = resultado.erro && i >= resultado.passos.length - 1 && i === resultado.passos.length - 1;
      if (invalida && passo === resultado.passos.length - 1) s.classList.add('invalida');
      s.textContent = c;
      fita.appendChild(s);
    });
  }

  function desenharLog() {
    const corpo = $('log');
    corpo.innerHTML = '';
    if (!resultado) return;
    resultado.passos.slice(0, passo + 1).forEach((p, i) => {
      const tr = document.createElement('tr');
      if (i === passo) tr.className = 'atual';
      tr.innerHTML = `<td>${p.n}</td><td>${p.lido === null ? '—' : escapar(p.lido)}</td>` +
        `<td>${p.estado ? escapar(p.estado) : '— (travou)'}</td>`;
      corpo.appendChild(tr);
    });
    corpo.parentElement.parentElement.scrollTop = 1e6;
  }

  function desenharResultado() {
    const caixa = $('resultado');
    if (!resultado) {
      caixa.className = 'resultado';
      caixa.textContent = '';
      $('descricao').textContent = '';
      return;
    }
    const fim = passo === resultado.passos.length - 1;
    const p = resultado.passos[passo];
    $('descricao').textContent = p.texto;
    if (!fim) {
      caixa.className = 'resultado';
      caixa.textContent = 'Processando…';
      return;
    }
    caixa.className = 'resultado ' + (resultado.aceita ? 'ok' : 'nao');
    caixa.innerHTML = `<strong>${resultado.aceita ? '✔ PALAVRA ACEITA' : '✘ PALAVRA REJEITADA'}</strong><br>` +
      escapar(resultado.erro || resultado.motivo);
  }

  function desenharDefinicao() {
    const d = $('definicao');
    const t = $('tabela');
    if (!auto) {
      d.innerHTML = '';
      t.innerHTML = '';
      return;
    }
    d.innerHTML =
      `<b>${escapar(auto.nome)}</b> <span class="selo">AFD</span>` +
      (auto.incompleto ? ' <span class="selo aviso" title="Se faltar transição, a palavra é rejeitada">AFD parcial</span>' : '') +
      `<br>Q = {${escapar(auto.estados.join(', '))}} &nbsp; Σ = {${escapar(auto.alfabeto.join(', '))}}` +
      `<br>q₀ = ${escapar(auto.inicial)} &nbsp; F = {${escapar(auto.finais.join(', '))}}`;

    const cols = auto.alfabeto;
    let h = '<thead><tr><th>δ</th>' + cols.map((c) => `<th>${escapar(c)}</th>`).join('') + '</tr></thead><tbody>';
    auto.estados.forEach((e) => {
      const marca = (e === auto.inicial ? '→' : '') + (auto.finais.includes(e) ? '*' : '');
      h += `<tr><th>${marca}${escapar(e)}</th>` + cols.map((c) => {
        const dest = auto.delta[e][c];
        return `<td>${dest ? escapar(dest) : '—'}</td>`;
      }).join('') + '</tr>';
    });
    t.innerHTML = h + '</tbody>';
  }

  function atualizarBotoes() {
    const tem = !!resultado;
    const fim = tem && passo === resultado.passos.length - 1;
    $('btn-passo').disabled = !tem || fim;
    $('btn-voltar').disabled = !tem || passo === 0;
    $('btn-auto').disabled = !tem || fim;
    $('btn-reiniciar').disabled = !tem;
    $('btn-auto').textContent = timer ? '⏸ Pausar' : '▶ Executar';
    if (timer) $('btn-auto').disabled = false;
  }

  function atualizarTudo() {
    desenharDefinicao();
    desenharFita();
    desenharLog();
    desenharResultado();
    atualizarBotoes();
  }

  // ---------------- controles ----------------
  function irPara(n) {
    if (!resultado) return;
    passo = Math.max(0, Math.min(resultado.passos.length - 1, n));
    desenhar();
    atualizarTudo();
  }
  function pararAuto() {
    if (timer) clearInterval(timer);
    timer = null;
  }
  function alternarAuto() {
    if (timer) {
      pararAuto();
      atualizarBotoes();
      return;
    }
    if (!resultado) return;
    if (passo === resultado.passos.length - 1) irPara(0);
    timer = setInterval(() => {
      if (passo >= resultado.passos.length - 1) {
        pararAuto();
        atualizarBotoes();
        return;
      }
      irPara(passo + 1);
    }, +$('velocidade').value);
    atualizarBotoes();
  }

  $('btn-carregar').onclick = carregar;
  $('btn-passo').onclick = () => irPara(passo + 1);
  $('btn-voltar').onclick = () => irPara(passo - 1);
  $('btn-auto').onclick = alternarAuto;
  $('btn-reiniciar').onclick = iniciarSimulacao;
  $('palavra').addEventListener('input', iniciarSimulacao);
  $('velocidade').onchange = () => { if (timer) { pararAuto(); alternarAuto(); } };
  seletor.onchange = () => {
    if (seletor.value && EXEMPLOS[seletor.value]) {
      $('json').value = EXEMPLOS[seletor.value].json;
      $('palavra').value = EXEMPLOS[seletor.value].palavra;
      carregar();
    }
  };
  $('arquivo').onchange = (ev) => {
    const f = ev.target.files[0];
    if (!f) return;
    const leitor = new FileReader();
    leitor.onload = () => {
      $('json').value = leitor.result;
      seletor.value = '';
      carregar();
    };
    leitor.onerror = () => mostrarErros(['Não foi possível ler o arquivo.']);
    leitor.readAsText(f);
  };

  // início: primeiro exemplo
  const primeiro = Object.keys(EXEMPLOS)[0];
  if (primeiro) {
    seletor.value = primeiro;
    seletor.onchange();
  } else {
    desenharVazio();
  }
})();
