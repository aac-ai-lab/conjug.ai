# conjugai-core — biblioteca de análise e conjugação

## 1. Visão geral

**conjugai-core** é uma biblioteca JavaScript/TypeScript isolada (`vendors/conjugai-core/`) que concentra a **inteligência linguística** do projeto ConjugAI: tokenização, deteção de sujeito e tempo, conjugação verbal e montagem da frase corrigida a partir de entradas **telegráficas** (ex.: *eu comer maçã*).

No repositório ConjugAI o código está em **`vendors/`** para deixar explícito que o núcleo **não depende** da interface web experimental (visualização em contexto **CAA**); esta pasta pode ser tratada como um pacote reutilizável à parte.

O objetivo é **acessibilidade linguística** em contexto de Tecnologia Assistiva: o utilizador produz mensagens com estrutura reduzida; o sistema devolve uma forma mais próxima do português normativo, com explicação passo a passo (`debug`) para o pipeline visual já existente na interface.

### Testes automatizados (Vitest)

Na **raiz** do repositório ConjugAI: `npm install`, depois `npm test` (ou `npm run test:watch`). Os ficheiros `*.test.ts` dentro de `vendors/conjugai-core/` cobrem **testes unitários** (`tokenizer`, `sujeito`, `tempo`, `conjugador`), **integração/regressão** do pipeline `analisarFrase` (`analisar-frase.regression.test.ts`) e devem ser atualizados quando o comportamento do motor mudar de forma intencional.

**Limites e o que não está coberto** (regência **à**/**ao**, verbos `ir`/`viajar`, listas de lugares, sujeito, tempos, etc.): **`../docs/limites-e-nao-cobertura.md`**.

**MorphoBr vs WordNet / VerbNet** (por que o léxico de flexão é a base): **`../docs/morphobr-e-recursos-semanticos.md`**.

**Manutenção de documentação e diagramas** (o que atualizar quando o código muda): **`../docs/manutencao-documentacao.md`**.

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

O léxico verbal (`data/verbos.json`, importado em `data/verbos-data.ts`) pode ser **gerado a partir do MorphoBr** (cobertura alargada) ou mantido **subconjunto**; o motor complementa com **regras de sufixação** (-AR, -ER, -IR) para **Presente**, **Passado** (Perfeito) e **Futuro** quando o lema não tem entrada no léxico.

### 4.1 MorphoBr (`.dict`) → `verbos.json` (minificado, todos os tempos do .dict)

O repositório **[LR-POR/MorphoBr](https://github.com/LR-POR/MorphoBr)** (Apache-2.0) publica flexões em ficheiros `verbs-*.dict` (uma letra do alfabeto por ficheiro).

**Fluxo recomendado (raiz do repositório ConjugAI):**

```bash
npm run build:lexicon   # descarrega verbs-a…z.dict em scripts/cache/ (se faltarem) e gera data/verbos.json minificado
npm run build:core      # atualiza assets/js/conjugai-core.js (bundle IIFE)
```

O script `scripts/morphobr_dict_to_verbos.py` mapeia as etiquetas verbais do MorphoBr (`PRS`, `IMPF`, `PRF`, `PQP`, `FUT`, `COND`, `SBJR`, `SBJP`, `SBJF`, `IMP`, `INF`, `GRD`, `PTPST`) para chaves JSON (`presente`, `preterito_imperfeito`, …, `gerundio`, `participio`, `infinitivo_pessoal`, etc.). Por omissão só entram lemas com **presente do indicativo completo** (5/5); os restantes paradigmas são incluídos **só quando completos**. Opções úteis:

- `--require-core` — exige também `futuro` e `passado` completos (léxico mais restrito).
- `--whitelist ficheiro.txt` — um lema por linha.
- `-m ../data/verbos.json --prefer-morphobr` — fundir com léxico existente.
- `--no-minify` — JSON indentado para revisão humana.

**Subconjunto manual de letras** (sem o script `build_verbos_from_morphobr.sh`):

```bash
cd vendors/conjugai-core/scripts
bash fetch_morphobr_verb_dicts.sh   # ou LETRAS="c f i" bash fetch_morphobr_verb_dicts.sh
python3 morphobr_dict_to_verbos.py -i cache/verbs-c.dict -o ../data/verbos.json
```

**Nota:** O ficheiro `verbos.json` completo é **grande** (~30 MB); o bundle `conjugai-core.js` cresce na mesma ordem. Para dispositivos muito limitados, usar whitelist ou léxico parcial.

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
Nota: este script CSV mantém foco no formato base (5 pessoas / 3 tempos); o runtime já suporta tempos compostos e a demo de paradigma inclui linha de `vós`.

**Exemplo:**

```bash
python3 scripts/csv_to_verbos.py -i minhas_flexoes.csv -o /tmp/verbos_novo.json
python3 scripts/csv_to_verbos.py -i minhas_flexoes.csv -m data/verbos.json -o data/verbos.json --merge-overwrites
```

**Depois do script:** o motor lê `data/verbos.json` via `verbos-data.ts`; na raiz do repositório, `npm run build:core` regenera o bundle em `assets/js/conjugai-core.js`.

Recursos DELAF em formato nativo exigem um passo prévio (conversão para este CSV); convém **documentar** o **mapeamento** das etiquetas morfológicas para `tense` + `person` ao integrar essas fontes.

**Deteção do verbo na frase:** ver **§6.3** (ordem: perífrase *ir*, **locuções verbais**, **subordinação com «que»** exc. *ter que*, primeiro infinitivo *-ar/-er/-ir*, léxico).

### 4.3 Tempos verbais na API e no pipeline CAA

- **`TempoVerbal` (TypeScript):** inclui tempos simples e compostos (ex.: `preterito_perfeito_composto`, `futuro_composto`, `subjuntivo_futuro_composto`) além de não-finitos (`infinitivo`, `gerundio`, `participio`).
- **`conjugar(verbo, pessoa, tempo)`:** base de conjugação em 5 pessoas (pipeline CAA). **Agora com fallbacks regulares para presente, passado e futuro.**
- **`conjugarTempo(verbo, pessoa, tempo)`:** camada ampliada para tempos simples + compostos e não-finitos.
- **`conjugarPessoaTabela(verbo, pessoa, tempo)`:** API para paradigma de **6 pessoas** (`eu, tu, ele/ela, nós, vós, eles/elas/vocês`) usada na demo da raiz.
- **`gerundio(verbo)`**, **`participio(verbo, 'm'|'f', 'sg'|'pl')`**, **`infinitivoLexico(verbo)`:** leitura de campos não paradigmáticos no JSON.
- **`detectarTempo` / `analisarFrase`:** usam marcadores adicionais (incluindo subjuntivo/imperfeito/compostos), aceitam **tempo explícito** no texto e **seleção manual via UI** (com prioridade máxima).

## 5. Decisão arquitetural

**Por que não dependemos de libs prontas de terceiros no bundle da app**

- Evitar **incompatibilidades** com empacotamento PWA/offline.  
- **Performance** previsível e footprint reduzido.  
- **Controlo total** sobre regras de sujeito composto, marcadores temporais e correção de frase.

**Por que abordagem híbrida (dicionário + regras)**

- **Dicionário** para verbos irregulares ou de uso frequente nos exemplos.  
- **Regras** para verbos regulares (AR/ER/IR) em três tempos (Presente, Passado Perfeito, Futuro) quando o infinitivo não está no léxico.  
- Extensível: novos verbos entram no JSON/TS sem alterar o restante motor.

**Restrições respeitadas:** sem backend dedicado, sem Python em runtime, sem APIs externas — tudo corre no cliente.

## 6. Detecção de verbo — evolução

### 6.1 Abordagem inicial

- Baseada em **regex** (`isVerbShape`): tokens que terminam em *-ar*, *-er*, *-ir* ou *-pôr* são candidatos a **infinitivo**.  
- **Simples e rápida**, adequada a frases telegráficas com infinitivo explícito (*eu comer maçã*).  
- Hoje esse critério é usado no **primeiro passo** de `extrairVerbo` (antes do léxico de flexões).

### 6.2 Limitações da heurística pura

- **Não** é etiquetagem morfossintática (POS) real.  
- **Não** reconhece formas **conjugadas** como verbo (*como*, *danço*) se não coincidirem com o padrão de infinitivo.  
- **Não** usa um dicionário aberto da língua — só padrões.  
- **Não** resolve todos os casos com **dois** infinitivos: há heurística para o primeiro infinitivo **após** um *que* de subordinação (não *ter que*); fora disso, o **primeiro** infinitivo na ordem dos tokens prevalece (salvo *ir + inf.* e locuções).  
- **Dois** verbos só no padrão *Pronome + infinitivo + que* + dependente (ver `corrigir`); fora disso, só o lema de `extrairVerbo` é flexionado.

### 6.3 Evolução implementada (camadas)

1. **Dicionário (`VERBOS` / `verbos.json`):** constrói-se um **índice** forma → lema com **todos** os paradigmas de cinco pessoas presentes no JSON, mais **gerúndio**, **particípios** (m/f × sg/pl), **infinitivo** anotado e **infinitivo pessoal** (quando existir), além da chave do lema.
2. **`detectarVerboPorDicionario(tokens)`:** percorre os tokens **em ordem**, **ignora** tokens numa lista de **pronomes, conectores e palavras funcionais** (para evitar homógrafos como *ele* → lema espúrio) e devolve o lema do primeiro token encontrado no índice.
3. **`extrairVerbo` (ordem atual, alinhada ao telegráfico CAA):**
   - **Perífrase *ir*:** se o **primeiro** token for forma de presente de **ir** (*vou*, *vais*, *vai*, *vamos*, *vão*) e houver infinitivo à frente (*vou viajar*), o lema é **ir**.
   - **Locuções verbais** (`detectarLocucaoVerbalHeadLemma`): padrões como *ter que/de* + infinitivo, *poder*/*dever* + infinitivo, *estar a*, *começar/continuar/voltar a*, *acabar/parar/deixar de*, *pretender a* — o lema é o **verbo auxiliar/modal** (não o segundo verbo). Formas de presente de **poder** (*posso*, *pode*…) tratam-se antes do léxico genérico para evitar colisão com **possar** (homógrafo *posso*).
   - **Subordinação «que»:** se existir um *que* que **não** seja *ter que* / *tenho que*…, usa-se o **primeiro infinitivo depois desse *que*** (ex.: *Ele dizer que eles falar* → *falar*, não *dizer*).
   - **Primeiro infinitivo** (`-ar`/`-er`/`-ir`/`-pôr`) na ordem dos tokens se a regra anterior não aplicar (ex.: *Ele viajar ontem* → *viajar*).
   - **Depois:** `detectarVerboPorDicionario` (flexões conhecidas, com o filtro de ignorados).

A API pública **`analisarFrase`** mantém a mesma assinatura.

**Correção de frase:** `corrigir` usa **`indiceDoVerboNaFrase`** para localizar o token verbal mesmo quando a entrada é flexionada (*eu como maçã* → lema *comer*, substituição e complementos corretos). Com *Pronome + infinitivo + que* e predicado dependente, também flexiona o infinitivo da matriz (*Ele dizer que eles falar* → *Ele disse que…*).

### 6.4 Por que não verbecc / mlconjug “de fábrica”

- **verbecc** e pipelines pesados de conjugação ML tendem a exigir **runtime** ou **dependências** pouco alinhadas com **PWA offline** e **mobile** modesto.  
- **mlconjug** e similares muitas vezes implicam **Python** ou modelos volumosos — fora do escopo de um cliente leve sem backend.  
- Mantemos **controlo** sobre regras de TA (sujeito composto, marcadores temporais, frases telegráficas).

### 6.5 Benefícios da abordagem em camadas

- Maior **precisão** para verbos presentes no léxico, incluindo **formas conjugadas** na frase (e, com MorphoBr completo, muitos tempos por lema).  
- O índice é um `Map` em memória, construído **uma vez** (lazy); com léxico muito grande, o **tempo de arranque** e o **uso de RAM** aumentam — daí a option de whitelist ou léxico parcial.  
- **Escalável** em dados: novas flexões entram via `verbos.json`; o índice reflete-as.  
- Compatível com o objetivo de **NLP offline** assistivo — motor inicial de análise e interpretação de linguagem imperfeita, não só “um conjugador” isolado.

## 7. Arquitetura final

```text
UI (HTML + CSS + app.js)
        ↓
  conjugai-core (ConjugaiCore.analisarFrase)
        ↓
  tokenizer → [segmentação por coordenação, se aplicável] → sujeito → tempo → conjugador → corretor
        ↓
  { tokens, sujeito, tempo, verbo, correcao, debug }  (+ composta/oracoes se várias orações)
```

*(O diagrama pode referir React noutros contextos; neste repositório a UI é estática.)*

## 8. Ficheiros da biblioteca

| Ficheiro | Função |
|----------|--------|
| `index.ts` | `analisarFrase`, exportações públicas |
| `oracao-composta.ts` | `segmentarOracoesCoordenadas`, `juntarCorrecoesOracoes` — coordenação entre orações |
| `tokenizer.ts` | `tokenize` |
| `sujeito.ts` | `detectarSujeito`, `detectarSujeitoComposto` (sujeito simples + composto) |
| `tempo.ts` | `detectarTempo` (marcadores + seleção explícita de tempo) |
| `conjugador.ts` | `conjugar`, `conjugarTempo`, `conjugarPessoaTabela`, `extrairVerbo`, `detectarLocucaoVerbalHeadLemma`, `detectarVerboPorDicionario`, `indiceDoVerboNaFrase`, `gerundio`, `participio`, `infinitivoLexico`, léxico + presente regular |
| `corretor.ts` | `corrigir` — substitui só o token verbal (e antecede pronome se sujeito implícito) |
| `types.ts` | `ResultadoAnalise`, `TempoVerbal`, `GeneroParticipio`, `NumeroParticipio`, … (inclui `posicaoOriginal` e `tokenIndex` no sujeito) |
| `data/verbos.json` | Léxico (importado em `verbos-data.ts`); tipicamente minificado; ver §4.1 |
| `data/verbos-data.ts` | Tipos `EntradaVerbo`, constante `CHAVES_PARADIGMA_CINCO`, export `VERBOS` |
| `scripts/morphobr_dict_to_verbos.py` | MorphoBr `.dict` → `verbos.json` (tempos alargados, minify por omissão) |
| `scripts/build_verbos_from_morphobr.sh` | Descarrega `verbs-a`…`z` para `cache/` e invoca o Python |
| `scripts/fetch_morphobr_verb_dicts.sh` | Descarrega subconjunto de letras (útil sem build completo) |
| `scripts/csv_to_verbos.py` | Gera/atualiza `verbos.json` a partir de CSV (só `presente`/`futuro`/`passado`; ver §4.2) |

## 9. Fonte (TypeScript) vs bundle (`assets/js/conjugai-core.js`)

| Artefacto | O quê |
|-----------|--------|
| **`vendors/conjugai-core/*.ts`** | **Fonte oficial** da biblioteca — é aqui que se edita a lógica. |
| **`assets/js/conjugai-core.js`** | **Saída para o browser**: um único ficheiro IIFE que expõe `globalThis.ConjugaiCore` (mesma API que o TypeScript exporta em `index.ts`). O ficheiro **inclui** o conteúdo de `verbos.json` embutido; com léxico MorphoBr completo, o bundle tem **dezenas de MB**. |

**Fluxo de trabalho**

1. (Opcional) `npm run build:lexicon` — regerar `data/verbos.json` a partir dos `.dict` MorphoBr (cache em `scripts/cache/`, ignorada pelo Git).  
2. Alterar o código em `vendors/conjugai-core/` (e/ou o JSON, se aplicável).  
3. Correr `npm install` (uma vez) e `npm run build:core` para **regenerar** `assets/js/conjugai-core.js` com esbuild.  
4. Se não usares `npm`, tens de **atualizar manualmente** o `.js` em `assets/` para ficar alinhado ao TypeScript — caso contrário o demo e o código-fonte **divergem**.

O `index.html` na **raiz** do repositório referencia apenas `assets/js/conjugai-core.js`; não importa os `.ts` diretamente. A demo CAA em `demo/caa/index.html` acrescenta `assets/js/app.js`.

**Demo: infinitivo em português e tabelas geradas pelo `conjugai-core` (tempos simples e compostos).** Abrir com servidor HTTP a partir da raiz do repositório, por exemplo  
`http://localhost:8765/` (ficheiro `index.html` na raiz) — usa `ConjugaiCore.conjugarPessoaTabela` para renderizar tempos suportados em **seis pessoas** (incluindo `vós`).

## 10. Integração no browser (resumo)

- O bundle IIFE `assets/js/conjugai-core.js` expõe `ConjugaiCore.analisarFrase`, `conjugar`, `gerundio`, `participio`, etc.  
- `npm run build:core` gera esse ficheiro a partir de `vendors/conjugai-core/index.ts` (com `verbos.json` resolvido em tempo de bundle).

### 10.1 Uso em projetos React / JavaScript / TypeScript

O diretório `vendors/conjugai-core/` também funciona como pacote JS/TS:

```bash
# na raiz do repositório
npm install
npm run build:core:package
```

Esse comando gera:

- `vendors/conjugai-core/dist/index.js` (ESM)
- `vendors/conjugai-core/dist/index.cjs` (CommonJS)
- `vendors/conjugai-core/dist/index.d.ts` (tipos TypeScript)

No projeto consumidor (exemplo com dependência local):

```bash
npm install file:/caminho/absoluto/para/conjugai/vendors/conjugai-core
```

Exemplo de uso (React/TS):

```ts
import { analisarFrase } from "conjugai-core";

const resultado = analisarFrase("eu comer maçã");
console.log(resultado.correcao);
```

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

- Publicação do `conjugai-core` como pacote npm público (nome final, licença e versionamento semântico).
- Pipeline de release automatizada (build de `dist`, changelog e publicação no npm/GitHub Releases).
- Análise sintática mais rica (ordem de constituintes, vários verbos).  
- Novas heurísticas e marcadores para `detectarTempo` (incluindo modo explícito por tag) e calibração linguística por corpus CAA real.  
- **Carregamento lazy** ou ficheiros de léxico fatiados para reduzir RAM e tempo de arranque no mobile.  
- Importação ou reconciliação com **DELAF/Unitex** nativos além do pipeline MorphoBr.  
- Deteção de erros mais complexos (concordância além do verbo).  
- Camada de **IA local** (modelos pequenos on-device) como sugestão, mantendo o núcleo simbólico para explicabilidade.

## 13. Sujeito e Normalização SVO

### 13.1 Identificação de Sujeito (Evolução)

O motor evoluiu de uma busca puramente por prefixo para uma **busca bidirecional** e baseada em **categorias de palavras**:

1. **Busca Bidirecional**: Procura por pronomes explícitos (`eu, tu, ele...`) antes **e** depois do verbo. Isto permite lidar com ordens inversas (VSO/VOS), comuns em telegrafia assistiva.
2. **Resiliência de Identidade**: Utiliza uma lista estática de **pronomes básicos** (Eu, Nós, Ele, etc.) como fallback imediato. Isso evita que pronomes comuns sejam classificados como nomes próprios caso o léxico não esteja carregado.
3.  **Deteção de Nomes e Títulos**: Casos como `Ana comer` ou `papai viajar` agora são identificados corretamente (3.ª pessoa) através de uma lógica de **`isNounCandidate`**, que valida:
    *   **Nomes Próprios**: Palavras com inicial maiúscula (que não sejam verbos conhecidos ou partículas).
    *   **Títulos de Parentesco/Profissões**: Lista controlada de termos como `mamãe, vovô, médico, professor`.
    *   **Filtro de Objetos**: Substantivos comuns em minúsculas (ex: `pizza`) são ignorados para evitar falsos positivos de sujeito.
4. **Dependente de «que»**: Se há um **que** antes do verbo a corrigir e um **pronome** entre esse **que** e o verbo, o sujeito para conjugar é esse pronome (ex.: *Ele disse que eles falar muito* → **eles**, não *ele*). Não cobre subordinação complexa (vários *que*, relativas, nomes nessa posição).

### 13.2 Normalização SVO

Sempre que um sujeito é identificado **após** o verbo, a função `corrigir` realiza a **reordenação sintática**:
- O token do sujeito é removido da sua posição original.
- O sujeito (flexionado ou original) é movido para o **início** da frase (Ordem Direta).
- Exemplo: `comer eu maçã` → `Eu como maçã`.

---

*Licença do código ConjugAI: conforme ficheiro `LICENSE` na raiz do repositório, quando existir.*
