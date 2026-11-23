/**
 * tools/build.js — gera dois arquivos que o site usa:
 *   js/exemplos.js  -> exemplos de autômatos (lidos da pasta exemplos/)
 *   js/trechos.js   -> trechos do núcleo mostrados na aba "Código"
 *
 * Os trechos são EXTRAÍDOS de js/automato.js, então a aba Código nunca
 * fica diferente do código real. Rode:  node tools/build.js
 * (o site já vem com os dois arquivos gerados; só rode de novo se mexer
 * em js/automato.js ou na pasta exemplos/)
 */
const fs = require('fs');
const path = require('path');
const raiz = path.join(__dirname, '..');
const ler = (...p) => fs.readFileSync(path.join(raiz, ...p), 'utf8');

// ---------- 1) exemplos ----------
const casos = {
  'afd_multiplo_de_3.json': ['AFD — binário múltiplo de 3', '1001'],
  'afnd_termina_em_01.json': ['AFND — termina em 01', '1101'],
  'afnd_epsilon_zeros_e_uns.json': ['AFND com ε — 0*1*', '0011'],
  'invalido_estado_inexistente.json': ['⚠ Arquivo com erro (teste de validação)', 'ab'],
};
const exemplos = {};
Object.keys(casos).forEach((arq) => {
  exemplos[casos[arq][0]] = { json: ler('exemplos', arq).trim(), palavra: casos[arq][1], arquivo: arq };
});
fs.writeFileSync(
  path.join(raiz, 'js', 'exemplos.js'),
  '// gerado por tools/build.js — não edite à mão\nwindow.EXEMPLOS = ' + JSON.stringify(exemplos, null, 2) + ';\n'
);

// ---------- 2) trechos do código ----------
const fonte = ler('js', 'automato.js');
const linhas = fonte.split('\n');

/** Remove a indentação comum de um bloco de linhas. */
function dedent(bloco) {
  const uteis = bloco.filter((l) => l.trim() !== '');
  const recuo = Math.min(...uteis.map((l) => l.match(/^ */)[0].length));
  return bloco.map((l) => l.slice(recuo)).join('\n');
}

/** Pega uma função inteira (com o comentário logo acima), casando as chaves. */
function funcao(nome) {
  const ini = linhas.findIndex((l) => l.includes('function ' + nome + '('));
  if (ini < 0) throw new Error('função não encontrada: ' + nome);
  let comeco = ini;
  // sobe enquanto a linha de cima for comentário
  while (comeco > 0 && /^\s*(\/\*\*|\*|\*\/|\/\/)/.test(linhas[comeco - 1])) comeco--;
  let nivel = 0, fim = ini, abriu = false;
  for (let i = ini; i < linhas.length; i++) {
    for (const ch of linhas[i]) {
      if (ch === '{') { nivel++; abriu = true; }
      if (ch === '}') nivel--;
    }
    if (abriu && nivel === 0) { fim = i; break; }
  }
  return dedent(linhas.slice(comeco, fim + 1));
}

/** Pega o intervalo entre duas linhas-âncora (início incluso, fim exclusivo). */
function intervalo(inicioTexto, fimTexto) {
  const a = linhas.findIndex((l) => l.includes(inicioTexto));
  const b = linhas.findIndex((l, i) => i > a && l.includes(fimTexto));
  if (a < 0 || b < 0) throw new Error('âncora não encontrada: ' + inicioTexto);
  return dedent(linhas.slice(a, b).filter((l, i, arr) => !(i === arr.length - 1 && l.trim() === '')));
}

const trechos = [
  {
    id: 'validacao',
    titulo: 'Validando as transições',
    arquivo: 'js/automato.js · validar()',
    oque: 'Percorre cada transição do JSON e confere se o estado de origem, o símbolo e os destinos existem. Cada problema vira uma mensagem em português; nada é carregado se houver erro.',
    ponto: 'É aqui que o simulador não quebra com arquivo malformado: ele acumula todos os erros e mostra de uma vez. Também detecta sozinho se o autômato é AFD ou AFND (mais de um destino ou transição ε).',
    codigo: intervalo('Object.keys(transicoes).forEach((origem) => {', 'if (erros.length) return { erros, automato: null };\n'.trim()),
  },
  {
    id: 'fecho',
    titulo: 'Fecho-ε: andar sem ler nada',
    arquivo: 'js/automato.js · fechoEps()',
    oque: 'Dado um conjunto de estados, devolve todos os que podem ser alcançados usando só transições vazias (ε). Usa uma fila: visita um estado, adiciona os vizinhos por ε e repete até não surgir nenhum novo.',
    ponto: 'É isso que faz o AFND com ε funcionar. Num autômato sem ε, esta função simplesmente devolve o mesmo conjunto que recebeu.',
    codigo: funcao('fechoEps'),
  },
  {
    id: 'mover',
    titulo: 'Ler um símbolo',
    arquivo: 'js/automato.js · mover()',
    oque: 'Para cada estado ativo, segue as transições do símbolo lido e junta todos os destinos num novo conjunto. No fim, aplica o fecho-ε. Também guarda as arestas usadas, para o desenho destacá-las.',
    ponto: 'Num AFD cada estado tem no máximo um destino, então o conjunto continua com 1 elemento. Num AFND pode crescer. O código é o mesmo para os dois.',
    codigo: funcao('mover'),
  },
  {
    id: 'simular',
    titulo: 'A simulação completa',
    arquivo: 'js/automato.js · simular()',
    oque: 'Começa no fecho-ε do estado inicial, lê a palavra símbolo por símbolo chamando mover() e registra cada passo. Para se encontrar um símbolo fora do alfabeto ou se nenhum estado sobrar (a máquina travou).',
    ponto: 'No fim, a palavra é aceita se algum estado ativo for final. A lista de passos devolvida é o que a tela usa para animar o caminho percorrido.',
    codigo: funcao('simular'),
  },
];

fs.writeFileSync(
  path.join(raiz, 'js', 'trechos.js'),
  '// gerado por tools/build.js a partir de js/automato.js — não edite à mão\nwindow.TRECHOS = ' + JSON.stringify(trechos, null, 2) + ';\n'
);
console.log('OK: js/exemplos.js e js/trechos.js gerados (' + trechos.length + ' trechos).');
