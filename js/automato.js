/**
 * automato.js — núcleo do simulador de AFD (sem nenhuma dependência de tela).
 *
 * Responsabilidades:
 *   1. validar()  -> confere se a especificação (JSON) é um AFD válido
 *   2. simular()  -> processa uma palavra e devolve TODOS os passos
 *
 * A ideia é simples: o autômato está sempre em UM estado. A cada símbolo
 * lido, a tabela de transições diz qual é o próximo estado.
 */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.Automato = fabrica();
})(this, function () {
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
      erros.push('"transicoes" deve ser um objeto: { estado: { símbolo: destino } }.');
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

    Object.keys(transicoes).forEach((origem) => {
      if (!conjuntoEstados.has(origem)) {
        erros.push(`Transição sai de "${origem}", que não existe em "estados".`);
        return;
      }
      const porSimbolo = transicoes[origem];
      if (porSimbolo === null || typeof porSimbolo !== 'object' || Array.isArray(porSimbolo)) {
        erros.push(`As transições de "${origem}" devem ser um objeto { símbolo: destino }.`);
        return;
      }
      Object.keys(porSimbolo).forEach((simbolo) => {
        if (!alfabeto.includes(simbolo)) {
          erros.push(`Transição de "${origem}" usa o símbolo "${simbolo}", que não está no alfabeto.`);
          return;
        }
        const destino = porSimbolo[simbolo];
        if (!ehTexto(destino)) {
          erros.push(`Transição ("${origem}", "${simbolo}") deve ter um único destino (um texto), mas recebeu ${JSON.stringify(destino)}.`);
        } else if (!conjuntoEstados.has(destino)) {
          erros.push(`Transição ("${origem}", "${simbolo}") vai para "${destino}", que não existe em "estados".`);
        } else {
          delta[origem][simbolo] = destino;
        }
      });
    });
    if (erros.length) return { erros, automato: null };

    // AFD "parcial": falta alguma transição (a palavra é rejeitada se travar)
    const incompleto = estados.some((e) => alfabeto.some((s) => delta[e][s] === undefined));

    return {
      erros: [],
      automato: {
        nome: ehTexto(spec.nome) ? spec.nome : 'Autômato sem nome',
        estados: [...estados],
        alfabeto: [...alfabeto],
        delta,
        inicial: estadoInicial,
        finais: [...new Set(estadosFinais)],
        incompleto,
      },
    };
  }

  /** Lista plana de arestas {de, simbolo, para} (usada para desenhar). */
  function listarArestas(auto) {
    const arestas = [];
    auto.estados.forEach((de) =>
      Object.keys(auto.delta[de]).forEach((simbolo) =>
        arestas.push({ de, simbolo, para: auto.delta[de][simbolo] })
      )
    );
    return arestas;
  }

  /**
   * Simula a palavra. Retorna:
   *   { aceita, motivo, erro, passos }
   * Cada passo: { n, lido, estado, aresta, texto }
   *   n      = quantos símbolos já foram lidos
   *   lido   = símbolo lido neste passo (null no passo 0)
   *   estado = estado em que o autômato está DEPOIS do passo (null se travou)
   *   aresta = transição usada neste passo (para destacar no desenho)
   */
  function simular(auto, palavra) {
    const simbolos = [...palavra];
    let estado = auto.inicial;
    const passos = [
      { n: 0, lido: null, estado, aresta: null, texto: `Início em ${estado}` },
    ];

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
      const proximo = auto.delta[estado][c];
      if (proximo === undefined) {
        passos.push({ n: i + 1, lido: c, estado: null, aresta: null, texto: `Leu "${c}" em ${estado}: não existe transição` });
        return {
          aceita: false,
          motivo: 'O autômato travou: não existe transição para o símbolo lido.',
          passos,
        };
      }
      passos.push({
        n: i + 1,
        lido: c,
        estado: proximo,
        aresta: { de: estado, simbolo: c, para: proximo },
        texto: `Leu "${c}": ${estado} → ${proximo}`,
      });
      estado = proximo;
    }

    const aceita = auto.finais.includes(estado);
    return {
      aceita,
      motivo: aceita
        ? `Terminou em ${estado}, que é estado final.`
        : `Terminou em ${estado}, que não é estado final.`,
      passos,
    };
  }

  return { lerJSON, validar, simular, listarArestas };
});
