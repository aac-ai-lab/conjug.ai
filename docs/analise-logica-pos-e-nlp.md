# Lógica Interna de Análise (POS e NLP)

Este documento explica como o `conjugai-core` resolve classes gramaticais (**Part-of-Speech Tagging**) e entidades sem recorrer a modelos estatísticos pesados (ex.: spaCy, modelos baseados em ML de dezenas de MB), priorizando a execução **offline** e instantânea no navegador.

---

## 1. Princípio: Híbrido Determinístico

O motor baseia-se num equilíbrio entre **léxico massivo** e **heurísticas de exclusão**. Não há probabilidade envolvida; cada token é processado por uma série de verificações em cascata. Todas as listas de palavras agora residem em arquivos **JSON** na pasta `data/`, separando dados de lógica.

### 1.1 Camadas de Decisão
1. **Léxico Direto**: Consulta de dicionários (`verbos.json`, `pos-sujeito.json`, etc.).
2. **Heurísticas Morfossintáticas**: Regex de sufixação (ex.: termina em `-ar`?) e análise de "capitalitas" (ex.: começa com Maiúscula?).
3. **Exclusão de Stopwords**: Remoção de termos funcionais conhecidos (`pos-funcionais.json`) para isolar os candidatos a sujeito e verbo.

---

## 2. Como identificamos cada classe?

### A. Verbos (O "Corpo" do Motor)
- **Dicionário (MorphoBr)**: Temos um índice gerado de milhares de lemas e suas formas flexionadas. Se uma palavra está no `verbos.json`, ela é marcada como verbo.
- **Regex de Infinitivo**: Verbos fora do léxico, no infinitivo (ex.: `comer`, `pôr`), são detectados por sufixo. Isto é vital para entradas **telegráficas**.
- **Perífrases**: Reconhecimento de verbos auxiliares seguidos de infinitivo (ex.: `vou caminhar`).

### B. Sujeitos (Pronomes e Nomes)
- **Pronomes Mapeados**: Lista em `pos-sujeito.json` que mapeia pronomes para pessoas gramaticais (0-4).
- **Nomes Próprios**: Identificação por **Maiúsculas**, com um filtro em `pos-funcionais.json` para garantir que não são o início de uma frase com outro constituinte.
- **Títulos de Parentesco e Profissão**: Uma lista controlada em `pos-sujeito.json` de substantivos humanos comuns (ex.: `papai`, `mãe`, `médico`).

### C. Tempo Verbal
- **Marcadores Sintáticos**: Palavras-chave em `pos-tempo.json` como `ontem` (passado), `amanhã` (futuro), `hoje` ou `agora` (presente).
- **Subjuntivo**: Marcadores como `se`, `quando`, `talvez` disparam o modo subjuntivo.
- **Tags Explícitas**: Opcionalmente, o sistema aceita `tempo:preterito` para desambiguação forçada.

---

## 3. Arquitetura e Extensibilidade

- **Dados Desacoplados**: Listas de regência (`regencia.json`), lugares e marcadores são carregadas via JSON.
- **NLP Genérico**: O objetivo é extrair a lógica de tokenização e POS-Tagging para uma biblioteca independente (`nlp-pt-br-lite`), deixando o `conjugai-core` focado apenas na correção sintática e conjugação.
