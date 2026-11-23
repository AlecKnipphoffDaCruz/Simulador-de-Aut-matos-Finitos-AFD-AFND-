// gerado por tools/build.js a partir de js/automato.js — não edite à mão
window.TRECHOS = [
  {
    "id": "validacao",
    "titulo": "Validando as transições",
    "arquivo": "js/automato.js · validar()",
    "oque": "Percorre cada transição do JSON e confere se o estado de origem, o símbolo e os destinos existem. Cada problema vira uma mensagem em português; nada é carregado se houver erro.",
    "ponto": "É aqui que o simulador não quebra com arquivo malformado: ele acumula todos os erros e mostra de uma vez. Também detecta sozinho se o autômato é AFD ou AFND (mais de um destino ou transição ε).",
    "codigo": "Object.keys(transicoes).forEach((origem) => {\n  if (!conjuntoEstados.has(origem)) {\n    erros.push(`Transição sai de \"${origem}\", que não existe em \"estados\".`);\n    return;\n  }\n  const porSimbolo = transicoes[origem];\n  if (porSimbolo === null || typeof porSimbolo !== 'object' || Array.isArray(porSimbolo)) {\n    erros.push(`As transições de \"${origem}\" devem ser um objeto { símbolo: [destinos] }.`);\n    return;\n  }\n  Object.keys(porSimbolo).forEach((chave) => {\n    const ehEps = APELIDOS_EPS.includes(chave);\n    const simbolo = ehEps ? EPS : chave;\n    if (!ehEps && !alfabeto.includes(chave)) {\n      erros.push(`Transição de \"${origem}\" usa o símbolo \"${chave}\", que não está no alfabeto.`);\n      return;\n    }\n    const destinos = emArray(porSimbolo[chave]);\n    const unicos = [];\n    destinos.forEach((d) => {\n      if (!ehTexto(d) || !conjuntoEstados.has(d)) {\n        erros.push(`Transição (\"${origem}\", \"${chave}\") vai para \"${d}\", que não existe em \"estados\".`);\n      } else if (!unicos.includes(d)) unicos.push(d);\n    });\n    if (ehEps) temEps = true;\n    if (unicos.length > 1) naoDeterministico = true;\n    delta[origem][simbolo] = unicos;\n  });\n});"
  },
  {
    "id": "fecho",
    "titulo": "Fecho-ε: andar sem ler nada",
    "arquivo": "js/automato.js · fechoEps()",
    "oque": "Dado um conjunto de estados, devolve todos os que podem ser alcançados usando só transições vazias (ε). Usa uma fila: visita um estado, adiciona os vizinhos por ε e repete até não surgir nenhum novo.",
    "ponto": "É isso que faz o AFND com ε funcionar. Num autômato sem ε, esta função simplesmente devolve o mesmo conjunto que recebeu.",
    "codigo": "/** Fecho-ε: todos os estados alcançáveis só com transições vazias. */\nfunction fechoEps(auto, inicio) {\n  const conjunto = new Set(inicio);\n  const arestas = [];\n  const fila = [...inicio];\n  while (fila.length) {\n    const e = fila.shift();\n    (auto.delta[e][EPS] || []).forEach((p) => {\n      arestas.push({ de: e, simbolo: EPS, para: p });\n      if (!conjunto.has(p)) {\n        conjunto.add(p);\n        fila.push(p);\n      }\n    });\n  }\n  return { conjunto, arestas };\n}"
  },
  {
    "id": "mover",
    "titulo": "Ler um símbolo",
    "arquivo": "js/automato.js · mover()",
    "oque": "Para cada estado ativo, segue as transições do símbolo lido e junta todos os destinos num novo conjunto. No fim, aplica o fecho-ε. Também guarda as arestas usadas, para o desenho destacá-las.",
    "ponto": "Num AFD cada estado tem no máximo um destino, então o conjunto continua com 1 elemento. Num AFND pode crescer. O código é o mesmo para os dois.",
    "codigo": "/** Lê UM símbolo a partir de um conjunto de estados. */\nfunction mover(auto, conjunto, simbolo) {\n  const destinos = new Set();\n  const arestas = [];\n  conjunto.forEach((e) =>\n    (auto.delta[e][simbolo] || []).forEach((p) => {\n      destinos.add(p);\n      arestas.push({ de: e, simbolo, para: p });\n    })\n  );\n  const fecho = fechoEps(auto, [...destinos]);\n  return { conjunto: fecho.conjunto, arestas: arestas.concat(fecho.arestas) };\n}"
  },
  {
    "id": "simular",
    "titulo": "A simulação completa",
    "arquivo": "js/automato.js · simular()",
    "oque": "Começa no fecho-ε do estado inicial, lê a palavra símbolo por símbolo chamando mover() e registra cada passo. Para se encontrar um símbolo fora do alfabeto ou se nenhum estado sobrar (a máquina travou).",
    "ponto": "No fim, a palavra é aceita se algum estado ativo for final. A lista de passos devolvida é o que a tela usa para animar o caminho percorrido.",
    "codigo": "/**\n * Simula a palavra. Retorna:\n *   { aceita, motivo, erro, passos }\n * Cada passo: { n, lido, estados, arestas, texto }\n *   n       = quantos símbolos já foram lidos\n *   lido    = símbolo lido neste passo (null no passo 0)\n *   estados = conjunto de estados ativos DEPOIS do passo\n *   arestas = transições usadas neste passo (para destacar no desenho)\n */\nfunction simular(auto, palavra) {\n  const passos = [];\n  const simbolos = [...palavra];\n\n  let atual = fechoEps(auto, [auto.inicial]);\n  passos.push({\n    n: 0,\n    lido: null,\n    estados: ordenar(atual.conjunto, auto),\n    arestas: atual.arestas,\n    texto: `Início em ${fmt(ordenar(atual.conjunto, auto))}` +\n      (atual.arestas.length ? ' (já contando as transições ε)' : ''),\n  });\n\n  for (let i = 0; i < simbolos.length; i++) {\n    const c = simbolos[i];\n    if (!auto.alfabeto.includes(c)) {\n      return {\n        aceita: false,\n        erro: `Símbolo inválido \"${c}\" na posição ${i + 1}: não pertence ao alfabeto {${auto.alfabeto.join(', ')}}.`,\n        motivo: 'Símbolo fora do alfabeto',\n        passos,\n      };\n    }\n    const antes = ordenar(atual.conjunto, auto);\n    atual = mover(auto, atual.conjunto, c);\n    const depois = ordenar(atual.conjunto, auto);\n    passos.push({\n      n: i + 1,\n      lido: c,\n      estados: depois,\n      arestas: atual.arestas,\n      texto: `Leu \"${c}\": ${fmt(antes)} → ${depois.length ? fmt(depois) : '{ } (nenhum estado)'}`,\n    });\n    if (depois.length === 0) {\n      return {\n        aceita: false,\n        motivo: 'O autômato travou: não existe transição para o símbolo lido.',\n        passos,\n      };\n    }\n  }\n\n  const finais = ordenar(atual.conjunto, auto).filter((e) => auto.finais.includes(e));\n  const aceita = finais.length > 0;\n  return {\n    aceita,\n    motivo: aceita\n      ? `Terminou em estado final: ${fmt(finais)}.`\n      : `Terminou em ${fmt(ordenar(atual.conjunto, auto))}, que não contém estado final.`,\n    passos,\n  };\n}"
  }
];
