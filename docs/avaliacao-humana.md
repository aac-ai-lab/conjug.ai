# Avaliação humana do ConjugAI

Este documento define um protocolo pratico para avaliacao humana das saidas do ConjugAI em contexto de CAA.

## Objetivo

Avaliar se as frases corrigidas pelo ConjugAI sao:

- corretas gramaticalmente;
- fieis ao significado da frase telegrafica original;
- naturais em PT-BR;
- uteis para comunicacao aumentativa e alternativa (CAA).

## Desenho da avaliacao

### Amostra

- Tamanho recomendado: 200 a 300 exemplos do conjunto de teste cego.
- Balanceamento minimo:
  - tempos verbais (`presente`, `passado`, `futuro`);
  - pessoas (`0..4`);
  - verbos regulares e irregulares;
  - sujeito explicito e implicito.

### Condicao cega

Para cada item, o avaliador deve ver:

- entrada telegrafica;
- saida gerada.

Nao deve saber qual sistema gerou a saída (ConjugAI ou baseline).

### Comparação

Comparar o ConjugAI com pelo menos um baseline:

- baseline simples por regra;
- opcionalmente, baseline "sem correção".

## Equipa de avaliação

- 2 avaliadores independentes por exemplo.
- 1 avaliador de desempate (adjudicador) quando houver conflito.

## Rubrica de avaliação (escala 1-5)

Cada exemplo deve receber nota em quatro critérios:

1. Correcao gramatical
   - Forma verbal, concordância, tempo e pessoa.
2. Preservacao de significado
   - Mantem a intencao original da frase telegráfica.
3. Naturalidade em PT-BR
   - Frase soa natural para uso cotidiano.
4. Utilidade para CAA
   - A saída ajuda o utilizador a comunicar melhor.

Campo adicional (binário):

- Aceitavel sem edição? (`sim`/`nao`)

## Metricas humanas principais

- MOS (Mean Opinion Score) por criterio.
- Taxa de aceitacao sem edicao.
- Preferencia pareada (quando duas saidas sao apresentadas).
- Acordo entre avaliadores:
  - Cohen's Kappa (2 avaliadores), ou
  - Krippendorff's Alpha (geral).

## Criterios de sucesso (exemplo)

- MOS >= 4.0 em:
  - correcao gramatical;
  - preservacao de significado.
- Taxa de aceitacao sem edicao >= 70%.
- Preferencia do ConjugAI superior ao baseline com significancia estatistica.

## Avaliacao em tarefa real de CAA (recomendado)

Complementar a avaliacao linguistica com tarefa pratica:

- tempo para chegar a frase final;
- numero de edicoes manuais apos sugestao;
- satisfacao percebida (Likert 1-5).

## Formato minimo dos registos

Cada anotacao deve guardar, no minimo:

- `id` do exemplo;
- `input_tele`;
- `output_sistema`;
- `sistema` (oculto para analise cega; visivel apenas no pos-processamento);
- notas por criterio (1-5);
- `aceitavel_sem_edicao` (`sim`/`nao`);
- `avaliador_id`;
- `timestamp`;
- `observacoes`.

## Fluxo operacional sugerido

1. Rodada piloto com 30 a 50 exemplos.
2. Ajuste da rubrica e instrucoes.
3. Anotacao em lotes (ex.: 100 exemplos).
4. Adjudicacao de conflitos.
5. Relatorio final com metricas e analise de erros.
