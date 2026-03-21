# conjugai-core — biblioteca de análise e conjugação

## 1. Visão geral

**conjugai-core** é uma biblioteca JavaScript/TypeScript isolada (`src/lib/conjugai-core/`) que concentra a **inteligência linguística** do projeto ConjugAI: tokenização, deteção de sujeito e tempo, conjugação verbal e montagem da frase corrigida a partir de entradas **telegráficas** (ex.: *eu comer maçã*).

O objetivo é **acessibilidade linguística** em contexto de Tecnologia Assistiva: o utilizador produz mensagens com estrutura reduzida; o sistema devolve uma forma mais próxima do português normativo, com explicação passo a passo (`debug`) para o pipeline visual já existente na interface.

## 2. Estado atual da aplicação

A UI (HTML/CSS) já expõe etapas alinhadas ao fluxo interno:

1. Tokenização  
2. Sujeito e pessoa  
3. Marcador temporal  
4. Conjugação e regra  

A lógica que antes estava acoplada ao `app.js` ou a dependências externas foi **extraída** para `conjugai-core`. O ficheiro `assets/js/app.js` apenas orquestra a interface e chama `ConjugaiCore.analisarFrase(frase)`.

## 3. Alternativas analisadas

| Abordagem | Notas |
|-----------|--------|
| **verbecc** / motores baseados em ML | Boa cobertura, mas custo computacional, dependências e modelos pesados; menos previsível para **execução offline** em dispositivos modestos ou PWA. |
| **mlconjug** (e similares) | Foco em conjugação via aprendizagem; requer pipeline de treino/manutenção e, em muitos casos, **Python** ou serviços externos. |
| **Serviços em nuvem / APIs** | Excluídos pelo requisito de **offline** e privacidade no contexto TA. |

## 4. Uso de dicionários linguísticos

Em **NLP** e lexicografia, recursos como **DELAF** (e ecosistemas **Unitex**/Linguateca) oferecem **cobertura lexical** fina (lemas, flexões, classes). Integrações completas exigem pipelines e formatos específicos.

No ConjugAI adotamos, por agora, um **léxico controlado** (`data/verbos.json` espelhado em `data/verbos-data.ts`) complementado por **regras de sufixação** (-AR, -ER, -IR) no **presente**, alinhado a um protótipo leve e auditável.

## 5. Decisão arquitetural

**Por que não dependemos de libs prontas de terceiros no bundle da app**

- Evitar **incompatibilidades** com empacotamento PWA/offline.  
- **Performance** previsível e footprint reduzido.  
- **Controlo total** sobre regras de sujeito composto, marcadores temporais e correção de frase.

**Por que abordagem híbrida (dicionário + regras)**

- **Dicionário** para verbos irregulares ou de uso frequente nos exemplos.  
- **Regras** para verbos regulares no presente quando o infinitivo não está no léxico.  
- Extensível: novos verbos entram no JSON/TS sem alterar o restante motor.

**Restrições respeitadas:** sem backend dedicado, sem Python em runtime, sem APIs externas — tudo corre no cliente.

## 6. Detecção de verbo — evolução

### 6.1 Abordagem inicial

- Baseada em **regex** (`isVerbShape`): tokens que terminam em *-ar*, *-er*, *-ir* ou *-pôr* são candidatos a **infinitivo**.  
- **Simples e rápida**, adequada a frases telegráficas com infinitivo explícito (*eu comer maçã*).  
- Inspirada na ideia de validação por forma (como no antigo conjugador lusofonia).

### 6.2 Limitações da heurística pura

- **Não** é etiquetagem morfossintática (POS) real.  
- **Não** reconhece formas **conjugadas** como verbo (*como*, *danço*) se não coincidirem com o padrão de infinitivo.  
- **Não** usa um dicionário aberto da língua — só padrões.  
- **Não** resolve ambiguidades: o primeiro token com forma de infinitivo “ganha”.  
- **Não** trata vários verbos na mesma frase de forma explícita.

### 6.3 Evolução implementada (camadas)

1. **Dicionário (`VERBOS` / `verbos.json`):** constrói-se um **índice** forma → lema com todas as flexões armazenadas (presente, futuro, passado) mais o próprio infinitivo.  
2. **`detectarVerboPorDicionario(tokens)`:** percorre os tokens **em ordem** e devolve o **lema** do primeiro token encontrado no índice (infinitivo ou flexão conhecida).  
3. **Fallback:** se o dicionário não encontrar nada, mantém-se o comportamento anterior com `isVerbShape` + primeiro infinitivo candidato.

A função **`extrairVerbo`** passou a ser: dicionário primeiro, heurística depois. A API pública **`analisarFrase`** mantém a mesma assinatura.

**Correção de frase:** `corrigir` usa **`indiceDoVerboNaFrase`** para localizar o token verbal mesmo quando a entrada é flexionada (*eu como maçã* → lema *comer*, substituição e complementos corretos).

### 6.4 Por que não verbecc / mlconjug “de fábrica”

- **verbecc** e pipelines pesados de conjugação ML tendem a exigir **runtime** ou **dependências** pouco alinhadas com **PWA offline** e **mobile** modesto.  
- **mlconjug** e similares muitas vezes implicam **Python** ou modelos volumosos — fora do escopo de um cliente leve sem backend.  
- Mantemos **controlo** sobre regras de TA (sujeito composto, marcadores temporais, frases telegráficas).

### 6.5 Benefícios da abordagem em camadas

- Maior **precisão** para verbos presentes no léxico, incluindo **formas conjugadas** na frase.  
- Continua **leve**: o índice é um `Map`/`object` em memória, construído uma vez (lazy).  
- **Escalável:** novos verbos e flexões entram no JSON/TS; o índice reflete essas entradas.  
- Compatível com o objetivo de **NLP offline** assistivo — motor inicial de análise e interpretação de linguagem imperfeita, não só “um conjugador” isolado.

## 7. Arquitetura final

```text
UI (HTML + CSS + app.js)
        ↓
  conjugai-core (ConjugaiCore.analisarFrase)
        ↓
  tokenizer → sujeito → tempo → conjugador → corretor
        ↓
  { tokens, sujeito, tempo, verbo, correcao, debug }
```

*(O diagrama pode referir React noutros contextos; neste repositório a UI é estática.)*

## 8. Ficheiros da biblioteca

| Ficheiro | Função |
|----------|--------|
| `index.ts` | `analisarFrase`, exportações públicas |
| `tokenizer.ts` | `tokenize` |
| `sujeito.ts` | `detectarSujeito` (incl. composto Eu + mamãe/papai → Nós) |
| `tempo.ts` | `detectarTempo` (*amanhã*, *ontem*, default presente) |
| `conjugador.ts` | `conjugar`, `extrairVerbo`, `detectarVerboPorDicionario`, `indiceDoVerboNaFrase`, léxico + presente regular |
| `corretor.ts` | `corrigir` — pronome + forma verbal + complementos |
| `types.ts` | `ResultadoAnalise` e tipos auxiliares |
| `data/verbos.json` | Léxico (espelhado em `verbos-data.ts` para o bundler) |

## 9. Fonte (TypeScript) vs bundle (`assets/js/conjugai-core.js`)

| Artefacto | O quê |
|-----------|--------|
| **`src/lib/conjugai-core/*.ts`** | **Fonte oficial** da biblioteca — é aqui que se edita a lógica. |
| **`assets/js/conjugai-core.js`** | **Saída para o browser**: um único ficheiro IIFE que expõe `globalThis.ConjugaiCore` (mesma API que o TypeScript exporta em `index.ts`). Não é uma segunda biblioteca; é o **empacotamento** da conjugai-core para carregar com `<script>` sem bundler no HTML. |

**Fluxo de trabalho**

1. Alterar o código em `src/lib/conjugai-core/`.  
2. Correr `npm install` (uma vez) e `npm run build:core` para **regenerar** `assets/js/conjugai-core.js` com esbuild.  
3. Se não usares `npm`, tens de **atualizar manualmente** o `.js` em `assets/` para ficar alinhado ao TypeScript — caso contrário o demo e o código-fonte **divergem**.

O `index.html` referencia apenas `assets/js/conjugai-core.js`; não importa os `.ts` diretamente.

## 10. Integração no browser (resumo)

- O bundle IIFE `assets/js/conjugai-core.js` expõe `ConjugaiCore.analisarFrase`, etc.  
- `npm run build:core` gera esse ficheiro a partir de `src/lib/conjugai-core/index.ts`.

## 11. Possíveis evoluções

- Análise sintática mais rica (ordem de constituintes, vários verbos).  
- Léxico maior ou importação parcial de recursos DELAF/Unitex.  
- Deteção de erros mais complexos (concordância além do verbo).  
- Camada de **IA local** (modelos pequenos on-device) como sugestão, mantendo o núcleo simbólico para explicabilidade.

---

*Licença do projeto ConjugAI: uso no âmbito do teu trabalho; extensões à biblioteca são tuas.*
