# Simulador de Autômatos Finitos (AFD / AFND)

Trabalho de Computabilidade — **Opção A**: simulador de AFD e AFND (inclusive com transições vazias ε).
Site estático (HTML + CSS + JavaScript puro), sem build e sem dependências. Tem duas abas:

- **Simulador**: carrega o autômato em JSON, desenha o grafo e executa a palavra passo a passo.
- **Código**: mostra e explica os trechos principais do núcleo (extraídos do código real).

---

## Como publicar na Vercel

O projeto já está pronto: o `index.html` fica na raiz e não existe passo de build.

### Opção 1 — pelo GitHub (recomendada)

1. Crie um repositório no GitHub e envie **o conteúdo desta pasta** (o `index.html` precisa ficar na raiz do repositório).
2. Em [vercel.com/new](https://vercel.com/new), clique em **Import** no repositório.
3. Em **Framework Preset** deixe **Other**. Deixe **Build Command** e **Output Directory** vazios.
4. Clique em **Deploy**. A cada `git push` o site atualiza sozinho.

### Opção 2 — pelo terminal

```
npm i -g vercel
cd pasta-do-projeto
vercel          # primeira vez: responda as perguntas (aceite os padrões)
vercel --prod   # publica na URL final
```

### Testar antes, no seu computador

Pelo terminal: `npx serve .` (ou `python3 -m http.server`) e abra o endereço mostrado.
Também funciona dando duplo clique em `index.html`.

Dica: o link `seu-site.vercel.app/#codigo` já abre direto na aba Código.

---

## Estrutura de arquivos

```
index.html            página com as duas abas
css/estilo.css        aparência
js/
  automato.js         NÚCLEO: validar() e simular() (sem nada de tela)
  app.js              INTERFACE: desenho SVG, fita, botões, passo a passo
  codigo.js           abas e montagem da aba Código
  exemplos.js         exemplos embutidos (gerado por tools/build.js)
  trechos.js          trechos da aba Código (gerado por tools/build.js)
exemplos/*.json       autômatos de exemplo (também baixáveis pela aba Código)
tools/
  build.js            regenera js/exemplos.js e js/trechos.js
  cli.js              versão de linha de comando
  test.js             testes automáticos
```

Se alterar `js/automato.js` ou a pasta `exemplos/`, rode `node tools/build.js` para atualizar a aba Código e a lista de exemplos.

## Como usar

1. Escolha um exemplo (ou abra um `.json` seu).
2. Digite a palavra.
3. Use **Passo**, **Voltar**, **Executar** (animação) e **Reiniciar**.

Terminal (precisa do Node.js):

```
node tools/cli.js exemplos/afd_multiplo_de_3.json 1001
node tools/cli.js exemplos/afnd_epsilon_zeros_e_uns.json ""    # palavra vazia
node tools/test.js                                               # 239 testes
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

Transição vazia: chave `"ε"` (também `"eps"`, `"epsilon"`, `"λ"`). O programa detecta sozinho se é AFD ou AFND.

## Como a simulação funciona

Guarda-se o **conjunto de estados ativos**. Começa em q₀ mais tudo que ε alcança. A cada símbolo, o novo conjunto reúne todos os destinos daquele símbolo (mais o fecho-ε). Se o conjunto ficar vazio, a máquina travou: rejeita. Ao fim da palavra, aceita se algum estado ativo for final. Num AFD o conjunto tem sempre 1 estado, então o mesmo código serve para os dois tipos.

## Tratamento de erros

| Situação | Reação |
|---|---|
| Arquivo vazio | aviso de arquivo vazio |
| JSON malformado | mostra o erro de sintaxe |
| Campo ausente ou do tipo errado | diz qual campo |
| Estado inexistente / símbolo fora do alfabeto na transição | lista cada erro |
| Palavra com símbolo fora do alfabeto | rejeita e indica a posição |
| Palavra vazia | aceita só se o estado inicial já for final |
| AFD sem transição para o símbolo | a máquina trava e rejeita |

## Exemplos de testes bem-sucedidos

| Autômato | Palavra | Resultado |
|---|---|---|
| AFD múltiplo de 3 | `1001` (9) | aceita |
| AFD múltiplo de 3 | `1010` (10) | rejeita |
| AFND termina em 01 | `1101` | aceita, ativos no fim: {q0, q2} |
| AFND termina em 01 | `10` | rejeita |
| AFND com ε (0\*1\*) | `0011` | aceita |
| AFND com ε (0\*1\*) | (vazia) | aceita |
| arquivo com erro | — | lista 3 erros e não carrega |
