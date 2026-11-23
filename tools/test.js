/** test.js — testes automáticos. Rode com: node test.js */
const fs = require('fs');
const path = require('path');
const A = require('../js/automato');

let falhas = 0;
function esperar(nome, obtido, esperado) {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (!ok) falhas++;
  console.log((ok ? 'OK    ' : 'FALHOU') + ' ' + nome + (ok ? '' : `  (obtido ${JSON.stringify(obtido)}, esperado ${JSON.stringify(esperado)})`));
}

function carregar(arq) {
  const t = fs.readFileSync(path.join(__dirname, '..', 'exemplos', arq), 'utf8');
  return A.validar(A.lerJSON(t).spec);
}
const aceita = (auto, w) => A.simular(auto, w).aceita;

// ---------- AFD: binário múltiplo de 3 ----------
const afd = carregar('afd_multiplo_de_3.json').automato;
esperar('AFD detectado', afd.tipo, 'AFD');
for (let n = 0; n <= 200; n++) {
  esperar(`múltiplo de 3: ${n.toString(2)} (${n})`, aceita(afd, n.toString(2)), n % 3 === 0);
}
esperar('AFD palavra vazia (0 é múltiplo de 3 → aceita)', aceita(afd, ''), true);
esperar('AFD símbolo inválido', A.simular(afd, '10x1').erro !== undefined, true);
esperar('AFD símbolo inválido rejeita', aceita(afd, '10x1'), false);

// ---------- AFND: termina em 01 ----------
const afnd = carregar('afnd_termina_em_01.json').automato;
esperar('AFND detectado', afnd.tipo, 'AFND');
['01', '001', '1101', '0101'].forEach((w) => esperar(`termina em 01: ${w}`, aceita(afnd, w), true));
['', '0', '1', '10', '011', '110'].forEach((w) => esperar(`NÃO termina em 01: "${w}"`, aceita(afnd, w), false));
esperar('AFND passo mostra 2 estados', A.simular(afnd, '0').passos[1].estados, ['q0', 'q1']);

// ---------- AFND com ε: 0*1* ----------
const eps = carregar('afnd_epsilon_zeros_e_uns.json').automato;
esperar('ε detectado como AFND', eps.tipo, 'AFND');
['', '0', '1', '0011', '000', '111'].forEach((w) => esperar(`0*1* aceita "${w}"`, aceita(eps, w), true));
['10', '0101', '110'].forEach((w) => esperar(`0*1* rejeita "${w}"`, aceita(eps, w), false));
esperar('fecho-ε inicial inclui q1', A.simular(eps, '').passos[0].estados, ['q0', 'q1']);

// ---------- Robustez ----------
esperar('arquivo vazio', A.lerJSON('').erros.length, 1);
esperar('JSON malformado', A.lerJSON('{ "estados": [').erros[0].startsWith('JSON malformado'), true);
esperar('não é objeto', A.validar([1, 2]).erros.length, 1);
esperar('faltam campos', A.validar({}).erros.length > 0, true);
const inv = carregar('invalido_estado_inexistente.json');
esperar('arquivo inválido gera erros', inv.erros.length >= 3, true);
esperar('arquivo inválido não gera autômato', inv.automato, null);
esperar('símbolo multi-caractere no alfabeto', A.validar({ estados: ['a'], alfabeto: ['ab'], transicoes: {}, estadoInicial: 'a', estadosFinais: [] }).erros.length > 0, true);
esperar('estados repetidos', A.validar({ estados: ['a', 'a'], alfabeto: ['0'], transicoes: {}, estadoInicial: 'a', estadosFinais: [] }).erros.length > 0, true);

// AFD incompleto: trava e rejeita
const parcial = A.validar({ estados: ['a', 'b'], alfabeto: ['0', '1'], transicoes: { a: { 0: 'b' } }, estadoInicial: 'a', estadosFinais: ['b'] }).automato;
esperar('AFD incompleto detectado', parcial.incompleto, true);
esperar('AFD incompleto aceita "0"', aceita(parcial, '0'), true);
esperar('AFD incompleto trava em "01"', aceita(parcial, '01'), false);

console.log(falhas === 0 ? '\nTodos os testes passaram.' : `\n${falhas} teste(s) falharam.`);
process.exit(falhas === 0 ? 0 : 1);
