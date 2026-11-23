/**
 * automato.js — núcleo do simulador (sem nenhuma dependência de tela).
 *
 * Responsabilidades:
 *   1. validar()  -> confere se a especificação (JSON) é um autômato válido
 *   2. simular()  -> processa uma palavra e devolve TODOS os passos
 *
 * Funciona em AFD, AFND e AFND com transições vazias (ε).
 * A ideia é a mesma para os três: em cada passo guardamos o CONJUNTO de
 * estados em que o autômato pode estar. Num AFD esse conjunto sempre tem
 * 1 estado; num AFND pode ter vários.
 */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.Automato = fabrica();
})(this, function () {
  const EPS = 'ε';
  // Formas aceitas no JSON para escrever a transição vazia
  const APELIDOS_EPS = ['ε', 'eps', 'epsilon', 'λ', ''];

  /** Converte texto JSON em objeto, sem estourar exceção. */
  function lerJSON(texto) {
    if (typeof texto !== 'string' || texto.trim() === '') {
      return { erros: ['O arquivo/texto está vazio.'] };
    }
    try {
      return { spec: JSON.parse(texto) };
    } catch (e) {
      return { erros: ['JSON malformado: ' + e.message] };
    }
  }

  const ehTexto = (x) => typeof x === 'string';
  const emArray = (x) => (Array.isArray(x) ? x : [x]);

  /**
   * Valida a especificação e devolve { erros: [...], automato }.
   * Se houver qualquer erro, automato é null.
   */
  function validar(spec) {
    const erros = [];
    if (spec === null || typeof spec !== 'object' || Array.isArray(spec)) {
      return { erros: ['A especificação deve ser um objeto JSON.'], automato: null };
    }

    // --- campos obrigatórios -------------------------------------------
    const { estados, alfabeto, transicoes, estadoInicial, estadosFinais } = spec;
    if (!Array.isArray(estados) || estados.length === 0)
      erros.push('"estados" deve ser uma lista não vazia.');
    if (!Array.isArray(alfabeto) || alfabeto.length === 0)
      erros.push('"alfabeto" deve ser uma lista não vazia.');
    if (transicoes === null || typeof transicoes !== 'object' || Array.isArray(transicoes))
      erros.push('"transicoes" deve ser um objeto: { estado: { símbolo: [destinos] } }.');
    if (!ehTexto(estadoInicial) || estadoInicial === '')
      erros.push('"estadoInicial" deve ser um texto (nome de um estado).');
    if (!Array.isArray(estadosFinais))
      erros.push('"estadosFinais" deve ser uma lista (pode ser vazia).');
    if (erros.length) return { erros, automato: null };

    // --- conteúdo dos campos -------------------------------------------
    if (!estados.every(ehTexto) || estados.some((e) => e === ''))
      erros.push('Todos os estados devem ser textos não vazios.');
    if (new Set(estados).size !== estados.length)
      erros.push('Há estados repetidos em "estados".');

    if (!alfabeto.every((s) => ehTexto(s) && [...s].length === 1))
      erros.push('Cada símbolo do alfabeto deve ser um único caractere.');
    if (new Set(alfabeto).size !== alfabeto.length)
      erros.push('Há símbolos repetidos em "alfabeto".');
    if (alfabeto.some((s) => APELIDOS_EPS.includes(s)))
      erros.push('A transição vazia (ε) não pode fazer parte do alfabeto.');
    if (erros.length) return { erros, automato: null };

    const conjuntoEstados = new Set(estados);
    if (!conjuntoEstados.has(estadoInicial))
      erros.push(`O estado inicial "${estadoInicial}" não existe em "estados".`);
    estadosFinais.forEach((f) => {
      if (!conjuntoEstados.has(f))
        erros.push(`O estado final "${f}" não existe em "estados".`);
    });

    // --- transições ------------------------------------------------------
    const delta = {};
    estados.forEach((e) => (delta[e] = {}));
    let temEps = false;
    let naoDeterministico = false;

    Object.keys(transicoes).forEach((origem) => {
      if (!conjuntoEstados.has(origem)) {
        erros.push(`Transição sai de "${origem}", que não existe em "estados".`);
        return;
      }
      const porSimbolo = transicoes[origem];
      if (porSimbolo === null || typeof porSimbolo !== 'object' || Array.isArray(porSimbolo)) {
        erros.push(`As transições de "${origem}" devem ser um objeto { símbolo: [destinos] }.`);
        return;
      }
      Object.keys(porSimbolo).forEach((chave) => {
        const ehEps = APELIDOS_EPS.includes(chave);
        const simbolo = ehEps ? EPS : chave;
        if (!ehEps && !alfabeto.includes(chave)) {
          erros.push(`Transição de "${origem}" usa o símbolo "${chave}", que não está no alfabeto.`);
          return;
        }
        const destinos = emArray(porSimbolo[chave]);
        const unicos = [];
        destinos.forEach((d) => {
          if (!ehTexto(d) || !conjuntoEstados.has(d)) {
            erros.push(`Transição ("${origem}", "${chave}") vai para "${d}", que não existe em "estados".`);
          } else if (!unicos.includes(d)) unicos.push(d);
        });
        if (ehEps) temEps = true;
        if (unicos.length > 1) naoDeterministico = true;
        delta[origem][simbolo] = unicos;
      });
    });
    if (erros.length) return { erros, automato: null };

    const tipo = temEps || naoDeterministico ? 'AFND' : 'AFD';
    // AFD "incompleto": falta alguma transição (a palavra é rejeitada se travar)
    const incompleto =
      tipo === 'AFD' &&
      estados.some((e) => alfabeto.some((s) => !(delta[e][s] && delta[e][s].length)));

    return {
      erros: [],
      automato: {
        nome: ehTexto(spec.nome) ? spec.nome : 'Autômato sem nome',
        estados: [...estados],
        alfabeto: [...alfabeto],
        delta,
        inicial: estadoInicial,
        finais: [...new Set(estadosFinais)],
        tipo,
        temEps,
        incompleto,
      },
    };
  }

  /** Lista plana de arestas {de, simbolo, para} (usada para desenhar). */
  function listarArestas(auto) {
    const arestas = [];
    auto.estados.forEach((de) =>
      Object.keys(auto.delta[de]).forEach((simbolo) =>
        auto.delta[de][simbolo].forEach((para) => arestas.push({ de, simbolo, para }))
      )
    );
    return arestas;
  }

  /** Fecho-ε: todos os estados alcançáveis só com transições vazias. */
  function fechoEps(auto, inicio) {
    const conjunto = new Set(inicio);
    const arestas = [];
    const fila = [...inicio];
    while (fila.length) {
      const e = fila.shift();
      (auto.delta[e][EPS] || []).forEach((p) => {
        arestas.push({ de: e, simbolo: EPS, para: p });
        if (!conjunto.has(p)) {
          conjunto.add(p);
          fila.push(p);
        }
      });
    }
    return { conjunto, arestas };
  }

  /** Lê UM símbolo a partir de um conjunto de estados. */
  function mover(auto, conjunto, simbolo) {
    const destinos = new Set();
    const arestas = [];
    conjunto.forEach((e) =>
      (auto.delta[e][simbolo] || []).forEach((p) => {
        destinos.add(p);
        arestas.push({ de: e, simbolo, para: p });
      })
    );
    const fecho = fechoEps(auto, [...destinos]);
    return { conjunto: fecho.conjunto, arestas: arestas.concat(fecho.arestas) };
  }

  const ordenar = (conj, auto) => auto.estados.filter((e) => conj.has(e));
  const fmt = (lista) => '{' + lista.join(', ') + '}';

  /**
   * Simula a palavra. Retorna:
   *   { aceita, motivo, erro, passos }
   * Cada passo: { n, lido, estados, arestas, texto }
   *   n       = quantos símbolos já foram lidos
   *   lido    = símbolo lido neste passo (null no passo 0)
   *   estados = conjunto de estados ativos DEPOIS do passo
   *   arestas = transições usadas neste passo (para destacar no desenho)
   */
  function simular(auto, palavra) {
    const passos = [];
    const simbolos = [...palavra];

    let atual = fechoEps(auto, [auto.inicial]);
    passos.push({
      n: 0,
      lido: null,
      estados: ordenar(atual.conjunto, auto),
      arestas: atual.arestas,
      texto: `Início em ${fmt(ordenar(atual.conjunto, auto))}` +
        (atual.arestas.length ? ' (já contando as transições ε)' : ''),
    });

    for (let i = 0; i < simbolos.length; i++) {
      const c = simbolos[i];
      if (!auto.alfabeto.includes(c)) {
        return {
          aceita: false,
          erro: `Símbolo inválido "${c}" na posição ${i + 1}: não pertence ao alfabeto {${auto.alfabeto.join(', ')}}.`,
          motivo: 'Símbolo fora do alfabeto',
          passos,
        };
      }
      const antes = ordenar(atual.conjunto, auto);
      atual = mover(auto, atual.conjunto, c);
      const depois = ordenar(atual.conjunto, auto);
      passos.push({
        n: i + 1,
        lido: c,
        estados: depois,
        arestas: atual.arestas,
        texto: `Leu "${c}": ${fmt(antes)} → ${depois.length ? fmt(depois) : '{ } (nenhum estado)'}`,
      });
      if (depois.length === 0) {
        return {
          aceita: false,
          motivo: 'O autômato travou: não existe transição para o símbolo lido.',
          passos,
        };
      }
    }

    const finais = ordenar(atual.conjunto, auto).filter((e) => auto.finais.includes(e));
    const aceita = finais.length > 0;
    return {
      aceita,
      motivo: aceita
        ? `Terminou em estado final: ${fmt(finais)}.`
        : `Terminou em ${fmt(ordenar(atual.conjunto, auto))}, que não contém estado final.`,
      passos,
    };
  }

  return { EPS, lerJSON, validar, simular, listarArestas, fechoEps };
});
