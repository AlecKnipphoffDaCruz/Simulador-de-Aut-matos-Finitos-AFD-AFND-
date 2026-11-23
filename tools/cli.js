#!/usr/bin/env node
/**
 * cli.js — versão de linha de comando do simulador.
 * Uso:  node cli.js <arquivo.json> <palavra>
 * Para testar a palavra vazia, passe "" (aspas vazias).
 */
const fs = require('fs');
const Automato = require('../js/automato');

const [, , caminho, palavra] = process.argv;
if (!caminho || palavra === undefined) {
  console.log('Uso: node cli.js <arquivo.json> <palavra>');
  process.exit(1);
}

let texto;
try {
  texto = fs.readFileSync(caminho, 'utf8');
} catch (e) {
  console.error('Não consegui abrir o arquivo: ' + e.message);
  process.exit(1);
}

const lido = Automato.lerJSON(texto);
const validado = lido.erros ? { erros: lido.erros } : Automato.validar(lido.spec);
if (validado.erros.length) {
  console.error('Arquivo inválido:');
  validado.erros.forEach((e) => console.error(' - ' + e));
  process.exit(1);
}

const auto = validado.automato;
console.log(`${auto.nome}  [${auto.tipo}]`);
console.log(`Palavra: "${palavra}"\n`);
const r = Automato.simular(auto, palavra);
r.passos.forEach((p) => console.log(`  passo ${p.n}: ${p.texto}`));
console.log('');
if (r.erro) console.log('ERRO: ' + r.erro);
console.log(r.aceita ? 'RESULTADO: ACEITA' : 'RESULTADO: REJEITADA');
console.log(r.motivo);
process.exit(r.aceita ? 0 : 2);
