/**
 * codigo.js — controla as abas (Simulador / Código) e monta a aba Código
 * a partir de window.TRECHOS (gerado por tools/build.js).
 */
(function () {
  const $ = (id) => document.getElementById(id);

  // ---------------- abas ----------------
  const abas = { simulador: $('aba-simulador'), codigo: $('aba-codigo') };
  const botoes = document.querySelectorAll('.abas button');

  function abrir(nome) {
    if (!abas[nome]) nome = 'simulador';
    Object.keys(abas).forEach((k) => (abas[k].hidden = k !== nome));
    botoes.forEach((b) => b.setAttribute('aria-selected', String(b.dataset.aba === nome)));
    if (location.hash !== '#' + nome) history.replaceState(null, '', '#' + nome);
    window.scrollTo(0, 0);
  }
  botoes.forEach((b) => (b.onclick = () => abrir(b.dataset.aba)));
  window.addEventListener('hashchange', () => abrir(location.hash.slice(1)));

  // ---------------- destaque de sintaxe (bem simples) ----------------
  function escapar(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  const PADRAO = new RegExp(
    '(\\/\\*[\\s\\S]*?\\*\\/|\\/\\/[^\\n]*)' + // 1 comentário
    '|(\'(?:\\\\.|[^\'\\\\])*\'|"(?:\\\\.|[^"\\\\])*"|`(?:\\\\.|[^`\\\\])*`)' + // 2 texto
    '|\\b(const|let|var|function|return|if|else|for|while|of|in|new|true|false|null|typeof)\\b' + // 3 palavra-chave
    '|\\b(\\d+)\\b', // 4 número
    'g'
  );
  function realcar(codigo) {
    let saida = '', ultimo = 0, m;
    PADRAO.lastIndex = 0;
    while ((m = PADRAO.exec(codigo))) {
      saida += escapar(codigo.slice(ultimo, m.index));
      const classe = m[1] ? 'c' : m[2] ? 's' : m[3] ? 'k' : 'n';
      saida += '<span class="' + classe + '">' + escapar(m[0]) + '</span>';
      ultimo = PADRAO.lastIndex;
    }
    return saida + escapar(codigo.slice(ultimo));
  }

  // ---------------- copiar ----------------
  function copiar(texto, botao) {
    const feito = () => {
      const antes = botao.textContent;
      botao.textContent = 'Copiado!';
      setTimeout(() => (botao.textContent = antes), 1400);
    };
    try {
      navigator.clipboard.writeText(texto).then(feito, () => botao.textContent = 'Selecione e copie');
    } catch (e) {
      botao.textContent = 'Selecione e copie';
    }
  }

  // ---------------- trechos ----------------
  const trechos = window.TRECHOS || [];
  const lista = $('trechos');
  trechos.forEach((t, i) => {
    const sec = document.createElement('section');
    sec.className = 'card trecho';
    sec.innerHTML =
      '<div class="cab"><span class="num-circ">' + (i + 1) + '</span>' +
      '<div><h3>' + escapar(t.titulo) + '</h3><span class="arq">' + escapar(t.arquivo) + '</span></div></div>' +
      '<p class="expl">' + escapar(t.oque) + '</p>' +
      '<div class="bloco"><button class="copiar">Copiar</button><pre><code>' + realcar(t.codigo) + '</code></pre></div>' +
      '<p class="ponto"><b>Ponto-chave:</b> ' + escapar(t.ponto) + '</p>';
    sec.querySelector('.copiar').onclick = (ev) => copiar(t.codigo, ev.currentTarget);
    lista.appendChild(sec);
  });

  // ---------------- exemplo de JSON + downloads ----------------
  const ex = window.EXEMPLOS || {};
  const nomes = Object.keys(ex);
  const exJson = nomes.find((n) => ex[n].arquivo === 'afd_multiplo_de_3.json');
  if (exJson) $('json-exemplo').innerHTML = realcar(ex[exJson].json);
  const alvo = document.querySelector('[data-alvo="json-exemplo"]');
  if (alvo && exJson) alvo.onclick = (ev) => copiar(ex[exJson].json, ev.currentTarget);

  const baixar = $('baixar');
  nomes.forEach((n) => {
    const a = document.createElement('a');
    a.href = 'exemplos/' + ex[n].arquivo;
    a.download = ex[n].arquivo;
    a.textContent = '↓ ' + ex[n].arquivo;
    baixar.appendChild(a);
  });

  // abre a aba pedida na URL (ex.: /#codigo)
  abrir(location.hash.slice(1));
})();
