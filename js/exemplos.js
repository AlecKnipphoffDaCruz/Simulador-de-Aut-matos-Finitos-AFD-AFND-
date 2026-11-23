// gerado por tools/build.js — não edite à mão
window.EXEMPLOS = {
  "AFD — binário múltiplo de 3": {
    "json": "{\n  \"nome\": \"AFD — binário múltiplo de 3\",\n  \"estados\": [\"r0\", \"r1\", \"r2\"],\n  \"alfabeto\": [\"0\", \"1\"],\n  \"transicoes\": {\n    \"r0\": { \"0\": \"r0\", \"1\": \"r1\" },\n    \"r1\": { \"0\": \"r2\", \"1\": \"r0\" },\n    \"r2\": { \"0\": \"r1\", \"1\": \"r2\" }\n  },\n  \"estadoInicial\": \"r0\",\n  \"estadosFinais\": [\"r0\"]\n}",
    "palavra": "1001",
    "arquivo": "afd_multiplo_de_3.json"
  },
  "AFD — catraca (m = moeda, e = empurrar)": {
    "json": "{\n  \"nome\": \"AFD — catraca (m = moeda, e = empurrar)\",\n  \"estados\": [\"Trancada\", \"Liberada\"],\n  \"alfabeto\": [\"m\", \"e\"],\n  \"transicoes\": {\n    \"Trancada\": { \"m\": \"Liberada\", \"e\": \"Trancada\" },\n    \"Liberada\": { \"m\": \"Liberada\", \"e\": \"Trancada\" }\n  },\n  \"estadoInicial\": \"Trancada\",\n  \"estadosFinais\": [\"Liberada\"]\n}",
    "palavra": "mem",
    "arquivo": "afd_catraca.json"
  },
  "⚠ Arquivo com erro (teste de validação)": {
    "json": "{\n  \"nome\": \"Exemplo de arquivo com erro (para testar a validação)\",\n  \"estados\": [\"q0\", \"q1\"],\n  \"alfabeto\": [\"a\", \"b\"],\n  \"transicoes\": {\n    \"q0\": { \"a\": \"q1\", \"c\": \"q0\" },\n    \"q1\": { \"b\": \"q9\" }\n  },\n  \"estadoInicial\": \"q0\",\n  \"estadosFinais\": [\"q5\"]\n}",
    "palavra": "ab",
    "arquivo": "invalido_estado_inexistente.json"
  }
};
