# Simulador de Autômatos Finitos (AFD / AFND)

Trabalho de Computabilidade — simulador de Autômatos Finitos Determinísticos (AFD) e Não Determinísticos (AFND), inclusive com transições vazias (ε).

O autômato é descrito em um arquivo JSON. O simulador valida a definição, desenha o grafo de estados e executa uma palavra passo a passo, mostrando os estados ativos em cada momento e se a palavra foi aceita ou rejeitada.

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
node tools/cli.js exemplos/afnd_epsilon_zeros_e_uns.json ""    # palavra vazia
node tools/test.js                                               # testes automáticos
```

## Formato do arquivo JSON

```json
{
  "nome": "AFND — termina em 01",
  "estados": ["q0", "q1", "q2"],
  "alfabeto": ["0", "1"],
  "transicoes": {
    "q0": { "0": ["q0", "q1"], "1": ["q0"] },
    "q1": { "1": ["q2"] }
  },
  "estadoInicial": "q0",
  "estadosFinais": ["q2"]
}
```

| Campo | Significado |
|---|---|
| `estados` | conjunto Q |
| `alfabeto` | conjunto Σ (cada símbolo é um caractere) |
| `transicoes` | função δ: `estado → símbolo → [destinos]` |
| `estadoInicial` | q₀ |
| `estadosFinais` | conjunto F (pode ser vazio) |
| `nome` | opcional |

Transição vazia: chave `"ε"` (também aceita `"eps"`, `"epsilon"` e `"λ"`). O programa identifica automaticamente se o autômato é um AFD ou um AFND.

## Como a simulação funciona

A simulação mantém o **conjunto de estados ativos**. Ela começa em q₀ mais todos os estados alcançáveis por transições ε (fecho-ε). A cada símbolo lido, o novo conjunto reúne todos os destinos daquele símbolo, também com o fecho-ε. Se o conjunto ficar vazio, a máquina trava e a palavra é rejeitada. Ao fim da palavra, ela é aceita se algum estado ativo for final.

Em um AFD o conjunto tem sempre no máximo um estado, então o mesmo algoritmo serve para os dois tipos de autômato.

## Tratamento de erros

| Situação | Reação |
|---|---|
| Arquivo vazio | aviso de arquivo vazio |
| JSON malformado | mostra o erro de sintaxe |
| Campo ausente ou do tipo errado | indica qual campo |
| Estado inexistente / símbolo fora do alfabeto na transição | lista cada erro |
| Palavra com símbolo fora do alfabeto | rejeita e indica a posição |
| Palavra vazia | aceita só se o estado inicial for final |
| AFD sem transição para o símbolo | a máquina trava e rejeita |

## Exemplos

| Autômato | Palavra | Resultado |
|---|---|---|
| AFD múltiplo de 3 | `1001` (9) | aceita |
| AFD múltiplo de 3 | `1010` (10) | rejeita |
| AFND termina em 01 | `1101` | aceita, ativos no fim: {q0, q2} |
| AFND termina em 01 | `10` | rejeita |
| AFND com ε (0\*1\*) | `0011` | aceita |
| AFND com ε (0\*1\*) | (vazia) | aceita |
| Arquivo com erro | — | lista 3 erros e não carrega |

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
