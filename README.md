# Simulador de Autômato Finito Determinístico (AFD)

Trabalho de Computabilidade — simulador de Autômato Finito Determinístico (AFD), com execução passo a passo.

O autômato é descrito em um arquivo JSON. O simulador valida a definição, desenha o grafo de estados e executa uma palavra passo a passo, mostrando o estado atual em cada momento e se a palavra foi aceita ou rejeitada.

Feito em HTML, CSS e JavaScript puro, sem dependências. A página tem duas abas:

- **Simulador**: carrega o autômato, desenha o grafo e executa a palavra passo a passo.
- **Código**: mostra e explica os trechos principais do núcleo da simulação.

## Como usar

1. Escolha um dos exemplos ou abra um arquivo `.json` próprio.
2. Digite a palavra de entrada.
3. Use **Passo**, **Voltar**, **Executar** (animação) e **Reiniciar** para acompanhar a execução.

Para rodar localmente, basta abrir o `index.html` no navegador.

Também há uma versão de linha de comando (requer Node.js):

```
node tools/cli.js exemplos/afd_multiplo_de_3.json 1001
node tools/cli.js exemplos/afd_catraca.json mem
node tools/test.js                                       # testes automáticos
```

## Formato do arquivo JSON

```json
{
  "nome": "AFD — binário múltiplo de 3",
  "estados": ["r0", "r1", "r2"],
  "alfabeto": ["0", "1"],
  "transicoes": {
    "r0": { "0": "r0", "1": "r1" },
    "r1": { "0": "r2", "1": "r0" },
    "r2": { "0": "r1", "1": "r2" }
  },
  "estadoInicial": "r0",
  "estadosFinais": ["r0"]
}
```

| Campo | Significado |
|---|---|
| `estados` | conjunto Q |
| `alfabeto` | conjunto Σ (cada símbolo é um caractere) |
| `transicoes` | função δ: `estado → símbolo → próximo estado` (um único destino) |
| `estadoInicial` | q₀ |
| `estadosFinais` | conjunto F (pode ser vazio) |
| `nome` | opcional |

Cada símbolo leva a um único estado. Se uma transição tiver mais de um destino (uma lista), o arquivo é recusado, pois isso caracterizaria um autômato não determinístico.

## Como a simulação funciona

O autômato está sempre em **um** estado, começando em q₀. A cada símbolo da palavra, a função δ define o próximo estado. Se não existir transição para o símbolo lido, a máquina trava e a palavra é rejeitada. Ao fim da palavra, ela é aceita se o estado atual for final.

## Tratamento de erros

| Situação | Reação |
|---|---|
| Arquivo vazio | aviso de arquivo vazio |
| JSON malformado | mostra o erro de sintaxe |
| Campo ausente ou do tipo errado | indica qual campo |
| Transição com mais de um destino | recusa o arquivo |
| Estado inexistente / símbolo fora do alfabeto na transição | lista cada erro |
| Palavra com símbolo fora do alfabeto | rejeita e indica a posição |
| Palavra vazia | aceita só se o estado inicial for final |
| Sem transição para o símbolo lido | a máquina trava e rejeita |

## Exemplos

| Autômato | Palavra | Resultado |
|---|---|---|
| AFD múltiplo de 3 | `1001` (9) | aceita |
| AFD múltiplo de 3 | `1010` (10) | rejeita |
| Catraca (m = moeda, e = empurrar) | `mem` | aceita (termina em Liberada) |
| Catraca | `me` | rejeita (termina em Trancada) |
| Arquivo com erro | — | lista os erros e não carrega |

## Estrutura de arquivos

```
index.html            página com as duas abas
css/estilo.css        estilos
js/
  automato.js         núcleo: validação e simulação
  app.js              interface: desenho do grafo, fita, controles
  codigo.js           abas e montagem da aba Código
  exemplos.js         exemplos embutidos
  trechos.js          trechos exibidos na aba Código
exemplos/*.json       autômatos de exemplo
tools/
  build.js            regenera js/exemplos.js e js/trechos.js
  cli.js              versão de linha de comando
  test.js             testes automáticos
```
