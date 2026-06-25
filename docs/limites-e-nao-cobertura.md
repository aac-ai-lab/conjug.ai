# Limites e o que o ConjugAI **não** cobre

Este documento descreve o **âmbito intencional** do motor (`vendors/conjugai-core/`) e da demo **CAA** (`demo/caa/`), e lista **condições** que **não** estão cobertas ou só o estão **parcialmente**. Serve para evitar expectativas de um corretor gramatical completo ou de um analisador sintático de frase livre.

Para a arquitetura e o fluxo técnico, ver também `README.md` (raiz) e `vendors/conjugai-core/README.md`.

**Ver também:** `morphobr-e-recursos-semanticos.md` — por que o núcleo assenta em **léxico de flexão** (MorphoBr) e não em recursos semânticos tipo WordNet/VerbNet como substituto. · `manutencao-documentacao.md` — checklist para manter docs e diagramas alinhados ao código.

---

## 1. Escopo geral

- O pipeline (`tokenize` → sujeito → tempo → verbo → `corrigir`) foi pensado para **frases telegráficas curtas**, típicas de **CAA**, não para texto corrido longo ou estilo literário.
- **Orações compostas por coordenação** (`e`, `ou`, `mas`, `porém`, `então`): o motor pode **segmentar** várias orações com verbo e aplicar o fluxo **a cada oração**; `e` e `ou` só cortam **depois do primeiro verbo** (para não confundir com sujeito composto *X e Y* / *X ou Y*). **Subordinação** (*que*, *embora*, orações relativas, etc.) **não** é decomposta em orações separadas; há heurísticas para **lema** e **sujeito** do verbo **após** um *que* que não seja *ter que*. Com padrão **pronome + infinitivo + que** e verbo dependente mais à frente, `corrigir` pode flexionar **dois** verbos (*Ele dizer que eles falar* → *Ele disse que eles falaram* / *falem*), só neste recorte.
- **Locuções verbais** (telegrafia): há suporte **heurístico** a padrões frequentes (*ter que/de*, *poder/dever* + infinitivo, *estar a*, *começar a*, *acabar de*, etc.); **não** cobre todas as locuções do português nem ordens não canónicas.
- A **correção** em `corretor.ts` altera sobretudo a **forma verbal** e realiza a **normalização para ordem direta (SVO)** quando o sujeito é identificado após o verbo; também antecede pronome em sujeito **implícito**.
- **Não** reescreve a frase como um revisor humano faria para além destes recortes.

---

## 2. Sujeito

| Coberto (heurísticas) | Não coberto ou frágil |
|------------------------|------------------------|
| Padrão **X e Y** antes do verbo (sujeito composto) | Coordenação com **ou**, **nem**, vírgulas, mais de dois núcleos sem padrão fixo |
| **Eu + núcleo familiar** (lista em `sujeito.ts`: mamãe, papai, titio, vovô, tio, avô, irmão…); prefixo antes do verbo, **com ou sem** «e», **qualquer ordem** | Palavras **fora da lista** em uso próprio (outros substantivos); núcleos em **lados opostos** do verbo ou **muitos** tokens entre sujeito e verbo |
| Pronomes explícitos (eu, tu, ele, ela...) em **qualquer posição** (SVO, VSO) | Resolução de **correferência**, sujeito em oração relativa |
| Pronome **entre «que» e o verbo** a corrigir (heurística de dependente) | Vários «que» aninhados, sujeito **nominal** só após «que» (sem pronome), relativas |
| **Nomes próprios** (Maiúsculas) e **títulos** (médico, papai...) como sujeito | Substantivos comuns minúsculos que possam ser interpretados como objeto (ex: "comer pizza") |
| **Pronomes básicos estáticos** (Eu, Nós...) | Detecção de sujeito oculto a partir de contexto visual de pranchas (o sistema só lê o texto linear) |

---

## 3. Perífrase progressiva (*estar* + V)

- **Coberto:** telegrafia *estar* + infinitivo do segundo verbo → forma flexionada de **estar** + **gerúndio** (ex.: *estava brincando* com Ontem; *estou / estarei brincando* com Hoje / Amanhã). Opcional *estar a* + infinitivo (omissão de «a» na saída).
- **Dependente *quando* + pronome + verbo** com macro-tempo **passado** (ex. Ontem): o verbo da dependente passa a **pretérito** coerente com o pronome (*quando ela chegou*), em `corretor.ts` — não aplica a Hoje/Amanhã (mantém-se *quando ela chegar* no telegráfico).
- **Não coberto (por agora):** *quando* + sujeito **não** pronome (ex. *quando a chuva passar*); progressiva com verbo **fora do léxico** sem gerúndio gerado.

---

## 4. Tempo verbal (pipeline CAA)

- O fluxo de `analisarFrase` usa **três macro-tempos** orientados por marcadores: **presente**, **futuro**, **passado** (ver `tempo.ts`).
- **Prioridade manual**: seleções na interface (Ontem, Hoje, Amanhã) têm prioridade sobre marcadores de texto. Com macro **passado**, marcadores de **hábito/aspecto imperfeito** (`antigamente`, `enquanto`, `sempre`…) refinam para **`preterito_imperfeito`**; sem esses marcadores, passado manual permanece **pretérito perfeito** (`passado`).
- **Heurísticas indicativo (automáticas)**: `ontem` e marcadores léxicos de passado → **perfeito**; `antigamente` / `enquanto` / `sempre`+passado → **imperfeito**; `amanhã` → **futuro**; `disse que` / `falou que`, formas em **-ria** (`gostaria`, `estudaria` com `se`) → **condicional**. **`sempre` sozinho** não força imperfeito (mantém **presente** habitual).
- **Não** há desambiguação plena em todos os contextos (ex.: *nós estudamos* presente vs perfeito; pretérito mais-que-perfeito **simples** fora de prioridade CAA). Tag `tempo:<chave>` / `[tempo=<chave>]` força tempo fino.
- Tempos **alargados** existem no tipo `TempoVerbal` e no léxico quando a forma está em `verbos.json` (MorphoBr).

---

## 5. Conjugação e léxico

- **Fallbacks Regulares**: O motor suporta conjugação por sufixação regular (-ar/-er/-ir) para **Presente**, **Passado** (Perfeito) e **Futuro**. Isso fornece cobertura imediata para verbos regulares mesmo sem dados no léxico.
- A cobertura de formas ricas (irregulares) vem sobretudo de **`verbos.json`** (MorphoBr).
- Verbos **irregulares** fora do léxico ainda podem falhar ou ser conjugados de forma errada pelas regras regulares.

---

## 6. Regência de movimento, **à** / **ao** e “crase”

Implementação em `corretor.ts` (`aplicarRegenciaMovimentoLocais`):

| Aspeto | Limite |
|--------|--------|
| **Verbos** | Apenas **`ir`** e **`viajar`** estão na lista de verbos que disparam a inserção de **à** / **ao** antes de um substantivo de lugar conhecido. Outros verbos de movimento (**voltar**, **chegar**, **partir**, …) **não** estão incluídos. |
| **Lugares** | Apenas substantivos presentes nos conjuntos **feminino** / **masculino** (listas fechadas no código). **Fora da lista**, não se insere artigo nem contração. |
| **Padrão** | Trata sobretudo **verbo + [a/o?] + lugar** na sequência após o verbo conjugado. Não cobre **para a**, **em**, **de**, nem todas as construções com **a** + artigo em contextos que não sejam este recorte. |
| **Crase no sentido amplo** | O motor **não** implementa regras gerais de crase (horas, “à moda de”, “referir-se à …”, etc.) — apenas o recorte **a + a → à** e **a + o → ao** neste contexto de movimento + lista. |

---

## 7. Tokenização

- `tokenizer.ts` separa por espaços e remove pontuação final simples. **Não** há análise morfossintática profunda nem segmentação de contrações complexas em todos os casos.

---

## 8. Outras lacunas gramaticais superficiais

- **Concordância nominal** continua **parcial**: há ajuste local de **gênero** e **número** em recortes simples (*determinante/possessivo + substantivo*) e em **adjetivos biformes de lista controlada** imediatamente após o substantivo. O plural/singular do substantivo usa flexão regular básica (ex.: `escola` → `escolas`). Adjetivos fora da lista, exceções morfológicas e dependências longas continuam fora do objetivo central da correção atual.
- **Normalização sintática**: coberta apenas para a ordem **SVO** quando o sujeito é detectado após o verbo. Outras reordenações não são tratadas.
- **Ambiguidade**, **polissemia**, **nomes próprios** vs comum (em minúsculas), **registo** (formal/coloquial) **não** são tratados.

---

## 9. Demo CAA (interface)

- `assets/js/app.js` apenas **orquestra** o núcleo; exemplos com **badges** são **rótulos pedagógicos** escolhidos manualmente — não substituem documentação formal do motor.
- A lista de exemplos pode ficar **desalinhada** de versões antigas do bundle se não se correr `npm run build:core` após alterações em TypeScript.

---

## 10. Peso e desempenho

- Com léxico MorphoBr completo, `verbos.json` e o bundle web são **grandes** (ordem de dezenas de MB); dispositivos muito limitados podem sofrer no arranque e na memória.

---

## Atualização deste documento

Quando se adicionarem regras novas (por exemplo mais verbos em `VERBOS_MOVIMENTO_REGENCIA_LOCAL`, mais substantivos nas listas, ou mudanças em sujeito/tempo), **atualize** esta página para não prometer limites que o código já ultrapassou.
