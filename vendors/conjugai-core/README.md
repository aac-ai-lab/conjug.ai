# conjugai-core — biblioteca de análise e conjugação

## 1. Visão geral

**conjugai-core** é uma biblioteca JavaScript/TypeScript isolada (`vendors/conjugai-core/`) que concentra a **inteligência linguística** do projeto ConjugAI: tokenização, deteção de sujeito e tempo, conjugação verbal e montagem da frase corrigida a partir de entradas **telegráficas** (ex.: *eu comer maçã*).

No repositório ConjugAI o código está em **`vendors/`** para deixar explícito que o núcleo **não depende** da interface web experimental (visualização em contexto **CAA**); podes tratar esta pasta como um pacote reutilizável à parte.

O objetivo é **acessibilidade linguística** em contexto de Tecnologia Assistiva: o utilizador produz mensagens com estrutura reduzida; o sistema devolve uma forma mais próxima do português normativo, com explicação passo a passo (`debug`) para o pipeline visual já existente na interface.

### Testes automatizados (Vitest)

Na **raiz** do repositório ConjugAI: `npm install`, depois `npm test` (ou `npm run test:watch`). Os ficheiros `*.test.ts` dentro de `vendors/conjugai-core/` cobrem **testes unitários** (`tokenizer`, `sujeito`, `tempo`, `conjugador`), **integração/regressão** do pipeline `analisarFrase` (`analisar-frase.regression.test.ts`) e devem ser atualizados quando o comportamento do motor mudar de forma intencional.

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

No ConjugAI adotamos, por agora, um **léxico controlado** (`data/verbos.json`, importado em `data/verbos-data.ts`) complementado por **regras de sufixação** (-AR, -ER, -IR) no **presente**, numa abordagem leve e auditável.

### 4.1 MorphoBr (`.dict`) → `verbos.json`

O repositório **[LR-POR/MorphoBr](https://github.com/LR-POR/MorphoBr)** (Apache-2.0) publica flexões em ficheiros `verbs-*.dict` (uma letra do alfabeto por ficheiro, ex.: `verbs-c.dict` para lemas que começam por «c»).

1. Descarregar os `.dict` necessários (ex.: letras que cobrem os teus lemas):

   ```bash
   cd vendors/conjugai-core/scripts
   bash fetch_morphobr_verb_dicts.sh
   # ou: LETRAS="a b c" bash fetch_morphobr_verb_dicts.sh
   # (Se preferires ./fetch_… e der «Permissão negada»: chmod +x fetch_morphobr_verb_dicts.sh)
   ```

2. Gerar/atualizar `data/verbos.json` com **merge** sobre o léxico atual e **lista branca** (evita incluir dezenas de milhares de verbos no bundle):

   ```bash
   python3 morphobr_dict_to_verbos.py \
     -i cache/verbs-c.dict -i cache/verbs-f.dict -i cache/verbs-i.dict \
     -i cache/verbs-q.dict -i cache/verbs-v.dict \
     -m ../data/verbos.json -o ../data/verbos.json \
     --whitelist morphobr-whitelist.txt --prefer-morphobr
   ```

3. Na **raiz** do projeto (com dependências instaladas): `npm install` uma vez, depois `npm run build:core` (atualiza `assets/js/conjugai-core.js`). O script usa `npx esbuild` para encontrar o binário local.

**Nota:** Cada lema precisa de **15** células preenchidas (3 tempos × 5 pessoas). O script omite paradigmas incompletos e regista `[omit]` em *stderr*.

### 4.2 Importação CSV → `verbos.json` (recurso validado)

Para **aumentar o léxico** a partir de dados **humanos** (exportação de DELAF/Unitex/Linguateca ou folha de cálculo), usa-se o script offline `scripts/csv_to_verbos.py`.

**Formato do CSV** (UTF-8, primeira linha = cabeçalho):

| Coluna | Valores |
|--------|---------|
| `lemma` | Infinitivo minúsculas (ex.: `comer`) |
| `form` | Forma flexionada (ex.: `como`) |
| `tense` | `presente` \| `futuro` \| `passado` (alinhado a `tempo.ts` / `conjugar`) |
| `person` | `0`–`4` → eu, tu, ele/ela, nós, eles (igual a `conjugar` em `conjugador.ts`) |

Cada lema precisa de **15 linhas** (3 tempos × 5 pessoas) para ser emitido no JSON por omissão; com `--allow-incomplete` aceitam-se buracos (preenchidos com string vazia — evitar em produção).

**Exemplo:**

```bash
python3 scripts/csv_to_verbos.py -i minhas_flexoes.csv -o /tmp/verbos_novo.json
python3 scripts/csv_to_verbos.py -i minhas_flexoes.csv -m data/verbos.json -o data/verbos.json --merge-overwrites
```

**Depois do script:** o motor lê `data/verbos.json` via `verbos-data.ts`; na raiz do repositório corre `npm run build:core` para regenerar o bundle em `assets/js/conjugai-core.js`.

Recursos DELAF em formato nativo exigem um passo prévio (conversão para este CSV); documenta no trabalho o **mapeamento** das etiquetas morfológicas para `tense` + `person`.

**Deteção do verbo na frase:** primeiro procura-se o lema via **índice** (formas do léxico, incluindo conjugadas, → infinitivo); se falhar, usa-se o **fallback** por regex de infinitivo (`-ar/-er/-ir/-pôr`). Pormenores e limitações: **§6** (*Detecção de verbo — evolução*).

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
| `sujeito.ts` | `detectarSujeito`, `detectarSujeitoComposto` (sujeito simples + composto) |
| `tempo.ts` | `detectarTempo` (*amanhã*, *ontem*, default presente) |
| `conjugador.ts` | `conjugar`, `extrairVerbo`, `detectarVerboPorDicionario`, `indiceDoVerboNaFrase`, léxico + presente regular |
| `corretor.ts` | `corrigir` — substitui só o token verbal (e antecede pronome se sujeito implícito) |
| `types.ts` | `ResultadoAnalise` e tipos auxiliares |
| `data/verbos.json` | Léxico (espelhado em `verbos-data.ts` para o bundler) |
| `scripts/csv_to_verbos.py` | Gera/atualiza `verbos.json` a partir de CSV (ver §4.1) |

## 9. Fonte (TypeScript) vs bundle (`assets/js/conjugai-core.js`)

| Artefacto | O quê |
|-----------|--------|
| **`vendors/conjugai-core/*.ts`** | **Fonte oficial** da biblioteca — é aqui que se edita a lógica. |
| **`assets/js/conjugai-core.js`** | **Saída para o browser**: um único ficheiro IIFE que expõe `globalThis.ConjugaiCore` (mesma API que o TypeScript exporta em `index.ts`). Não é uma segunda biblioteca; é o **empacotamento** da conjugai-core para carregar com `<script>` sem bundler no HTML. |

**Fluxo de trabalho**

1. Alterar o código em `vendors/conjugai-core/`.  
2. Correr `npm install` (uma vez) e `npm run build:core` para **regenerar** `assets/js/conjugai-core.js` com esbuild.  
3. Se não usares `npm`, tens de **atualizar manualmente** o `.js` em `assets/` para ficar alinhado ao TypeScript — caso contrário o demo e o código-fonte **divergem**.

O `index.html` na **raiz** do repositório referencia apenas `assets/js/conjugai-core.js`; não importa os `.ts` diretamente. A demo CAA em `demo/caa/index.html` acrescenta `assets/js/app.js`.

**Demo tipo [verbe.cc](https://verbe.cc/) (só infinitivo → paradigma):** abrir com servidor HTTP a partir da raiz do repositório, por exemplo  
`http://localhost:8765/` (ficheiro `index.html` na raiz) — usa `ConjugaiCore.conjugar` em ciclo (presente, futuro, passado × cinco pessoas).

## 10. Integração no browser (resumo)

- O bundle IIFE `assets/js/conjugai-core.js` expõe `ConjugaiCore.analisarFrase`, etc.  
- `npm run build:core` gera esse ficheiro a partir de `vendors/conjugai-core/index.ts`.

## 11. Sujeito composto

### 11.1 Problema

Frases telegráficas podem ter **vários núcleos** no sujeito (*eu e João*, *João e Maria*, *meu pai e minha mãe*). Um motor só baseado em palavras isoladas tende a ignorar a concordância plural ou a depender de regras ad hoc (ex.: só *Eu + mamãe*).

### 11.2 Solução (leve, sem parser sintático completo)

1. Localiza-se o **primeiro token verbal** (mesma heurística que `extrairVerbo` / léxico).
2. O **prefixo** antes desse token é tratado como candidato a sujeito.
3. Se o prefixo tiver **pelo menos três tokens** e contiver o conector **`e`** (token isolado), aplica-se `detectarSujeitoComposto`:
   - existe token **eu** → pronome **Nós**, pessoa **1.ª plural** (índice 3);
   - existe **tu** ou **você** (`voce` normalizado) → **Vocês**, pessoa **4** (em PT-BR, mesmas terminações que *eles* no sistema);
   - caso contrário → **Eles**, pessoa **4** (ex.: *João e Maria*, *meu pai e minha mãe* — nomes próprios ou grupos nominais simples).
4. Mantém-se a regra legada **`isCompostoEuOutra`** (*mamãe e eu*, *eu e papai* sem depender estritamente do ponto 3) em `detectarSujeitoSimples`, com `composto: true`.
5. Na correção da frase, **`corrigir`** só substitui a **forma verbal** no sítio certo; os tokens do sujeito (incluindo prefixo *X e Y*) **mantêm-se** na superfície. O pronome em `sujeito.texto` (ex.: Nós, Eles) serve à **UI** e à **pessoa** para `conjugar`, não à reconstrução literal quando `composto` é verdadeiro.

### 11.3 Limitações

- Não há árvore sintática: ambiguidades (*X e Y* como coordenação de objetos) não são resolvidas.
- Frases muito longas ou ordem não canónica podem falhar.
- **Marcador temporal** *amanhã* continua a mapear para **futuro** no motor; *João e Maria viajar amanhã* tende a **«João e Maria viajarão amanhã»** (só o verbo é flexionado para a pessoa do sujeito composto).

### 11.4 Benefícios

- Melhor **concordância** em padrões frequentes em TA.
- Aproximação a **linguagem natural** sem custo de NLP pesado.

## 12. Possíveis evoluções

- Análise sintática mais rica (ordem de constituintes, vários verbos).  
- Léxico maior ou importação parcial de recursos DELAF/Unitex.  
- Deteção de erros mais complexos (concordância além do verbo).  
- Camada de **IA local** (modelos pequenos on-device) como sugestão, mantendo o núcleo simbólico para explicabilidade.

---

*Licença do projeto ConjugAI: uso no âmbito do teu trabalho; extensões à biblioteca são tuas.*
