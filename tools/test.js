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
esperar('AFD completo (não é parcial)', afd.incompleto, false);
for (let n = 0; n <= 200; n++) {
  esperar(`múltiplo de 3: ${n.toString(2)} (${n})`, aceita(afd, n.toString(2)), n % 3 === 0);
}
esperar('AFD palavra vazia (0 é múltiplo de 3 → aceita)', aceita(afd, ''), true);
esperar('AFD símbolo inválido', A.simular(afd, '10x1').erro !== undefined, true);
esperar('AFD símbolo inválido rejeita', aceita(afd, '10x1'), false);

// ---------- AFD: catraca (m = moeda, e = empurrar) ----------
const catraca = carregar('afd_catraca.json').automato;
['m', 'mm', 'em', 'memm', 'eem'].forEach((w) => esperar(`catraca termina liberada: "${w}"`, aceita(catraca, w), true));
['', 'e', 'me', 'mee', 'emme'].forEach((w) => esperar(`catraca termina trancada: "${w}"`, aceita(catraca, w), false));
esperar('catraca: caminho de "me"', A.simular(catraca, 'me').passos.map((p) => p.estado), ['Trancada', 'Liberada', 'Trancada']);
esperar('catraca não é parcial', catraca.incompleto, false);

// ---------- Passos da simulação ----------
const sim = A.simular(afd, '1001');
esperar('1001 passa por r0 r1 r2 r1 r0', sim.passos.map((p) => p.estado), ['r0', 'r1', 'r2', 'r1', 'r0']);
esperar('passo 1 usa a aresta r0 -1-> r1', sim.passos[1].aresta, { de: 'r0', simbolo: '1', para: 'r1' });

// ---------- Robustez ----------
esperar('arquivo vazio', A.lerJSON('').erros.length, 1);
esperar('JSON malformado', A.lerJSON('{ "estados": [').erros[0].startsWith('JSON malformado'), true);
esperar('não é objeto', A.validar([1, 2]).erros.length, 1);
esperar('faltam campos', A.validar({}).erros.length > 0, true);
const inv = carregar('invalido_estado_inexistente.json');
esperar('arquivo inválido gera erros', inv.erros.length >= 3, true);
esperar('destino em lista é recusado (AFND não é aceito)', A.validar({ estados: ['a', 'b'], alfabeto: ['0'], transicoes: { a: { 0: ['a', 'b'] } }, estadoInicial: 'a', estadosFinais: [] }).erros.length, 1);
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
