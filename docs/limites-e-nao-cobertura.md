# Limites e o que o ConjugAI **não** cobre

Este documento descreve o **âmbito intencional** do motor (`vendors/conjugai-core/`) e da demo **CAA** (`demo/caa/`), e lista **condições** que **não** estão cobertas ou só o estão **parcialmente**. Serve para evitar expectativas de um corretor gramatical completo ou de um analisador sintático de frase livre.

Para a arquitetura e o fluxo técnico, ver também `README.md` (raiz) e `vendors/conjugai-core/README.md`.

**Ver também:** `morphobr-e-recursos-semanticos.md` — por que o núcleo assenta em **léxico de flexão** (MorphoBr) e não em recursos semânticos tipo WordNet/VerbNet como substituto.

---

## 1. Escopo geral

- O pipeline (`tokenize` → sujeito → tempo → verbo → `corrigir`) foi pensado para **frases telegráficas curtas**, típicas de **CAA**, não para texto corrido, múltiplas orações ou estilo literário.
- A **correção** em `corretor.ts` altera sobretudo a **forma verbal** (e antecede pronome em sujeito **implícito**); **não** reescreve a frase como um revisor humano faria.

---

## 2. Sujeito

| Coberto (heurísticas) | Não coberto ou frágil |
|------------------------|------------------------|
| Padrão **X e Y** antes do verbo (sujeito composto) | Coordenação com **ou**, **nem**, vírgulas, mais de dois núcleos sem padrão fixo |
| **Eu + mamãe/papai** (e variantes próximas) | Ordens de palavras livres, sujeito **depois** do verbo, clíticos |
| Pronomes explícitos simples (eu, tu, ele, ela, nós, eles…) | Resolução de **correferência**, sujeito em oração relativa |

---

## 3. Tempo verbal (pipeline CAA)

- O fluxo de `analisarFrase` usa **três macro-tempos** orientados por marcadores: **presente**, **futuro**, **passado** (ver `tempo.ts`).
- **Não** há desambiguação semântica fina entre, por exemplo, pretérito perfeito vs imperfeito em todos os contextos; há **heurísticas** por palavras-chave e regras documentadas no README.
- Tempos **alargados** existem no tipo `TempoVerbal` e no léxico quando a forma está em `verbos.json`; o utilizador pode forçar tempo com `tempo:<chave>` / `[tempo=<chave>]` — isso **não** substitui análise pragmática automática.

---

## 4. Conjugação e léxico

- A cobertura de formas vem sobretudo de **`verbos.json`** (MorphoBr). **Fora do léxico**, a conjugação de **presente** por sufixos regulares é **limitada** (ver `conjugador.ts` e regras do projeto).
- Verbos **irregulares** ou raros podem falhar se o lema/forma não estiver representado como o pipeline espera.

---

## 5. Regência de movimento, **à** / **ao** e “crase”

Implementação em `corretor.ts` (`aplicarRegenciaMovimentoLocais`):

| Aspeto | Limite |
|--------|--------|
| **Verbos** | Apenas **`ir`** e **`viajar`** estão na lista de verbos que disparam a inserção de **à** / **ao** antes de um substantivo de lugar conhecido. Outros verbos de movimento (**voltar**, **chegar**, **partir**, …) **não** estão incluídos. |
| **Lugares** | Apenas substantivos presentes nos conjuntos **feminino** / **masculino** (listas fechadas no código). **Fora da lista**, não se insere artigo nem contração. |
| **Padrão** | Trata sobretudo **verbo + [a/o?] + lugar** na sequência após o verbo conjugado. Não cobre **para a**, **em**, **de**, nem todas as construções com **a** + artigo em contextos que não sejam este recorte. |
| **Crase no sentido amplo** | O motor **não** implementa regras gerais de crase (horas, “à moda de”, “referir-se à …”, etc.) — apenas o recorte **a + a → à** e **a + o → ao** neste contexto de movimento + lista. |

---

## 6. Tokenização

- `tokenizer.ts` separa por espaços e remove pontuação final simples. **Não** há análise morfossintática profunda nem segmentação de contrações complexas em todos os casos.

---

## 7. Outras lacunas gramaticais superficiais

- **Concordância nominal** (adjetivo, participo com objeto, etc.), **pontuação** e **reordenação** sintática **não** são objetivo central da correção atual.
- **Ambiguidade**, **polissemia**, **nomes próprios** vs comum, **registo** (formal/coloquial) **não** são tratados.

---

## 8. Demo CAA (interface)

- `assets/js/app.js` apenas **orquestra** o núcleo; exemplos com **badges** são **rótulos pedagógicos** escolhidos manualmente — não substituem documentação formal do motor.
- A lista de exemplos pode ficar **desalinhada** de versões antigas do bundle se não se correr `npm run build:core` após alterações em TypeScript.

---

## 9. Peso e desempenho

- Com léxico MorphoBr completo, `verbos.json` e o bundle web são **grandes** (ordem de dezenas de MB); dispositivos muito limitados podem sofrer no arranque e na memória.

---

## Atualização deste documento

Quando se adicionarem regras novas (por exemplo mais verbos em `VERBOS_MOVIMENTO_REGENCIA_LOCAL`, mais substantivos nas listas, ou mudanças em sujeito/tempo), **atualize** esta página para não prometer limites que o código já ultrapassou.
