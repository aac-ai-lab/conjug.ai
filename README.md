# ConjugAI

Biblioteca e demos de **conjugação verbal** em **português do Brasil**, para **uso geral**: paradigmas a partir do infinitivo, análise de frases e correção de verbos em texto **minimalista** (pessoa gramatical, tempos simples e compostos).

**Motivação:** cenários de **tecnologia assistiva** e **CAA** (Comunicação Aumentativa e Alternativa), onde entradas **telegráficas** são comuns; o núcleo não está limitado a essa aplicação.

Há **duas** páginas de demonstração na raiz do repositório: **`index.html`** — Demo infinitivo em português e tabelas geradas pelo `conjugai-core` (tempos simples e compostos, incluindo linha de `vós`), só `conjugai-core.js`; e **`demo/caa/index.html`** — frases telegráficas com passos e `analisarFrase`, com `app.js` + `conjugai-core.js`. A interface de **análise ao vivo** (quatro passos) é esta segunda; permite **validar** a correção e o pipeline do motor em contexto **CAA**. Na barra lateral, cada exemplo mostra **badges** (sujeito, tempo, conjugação, etc.) como guia explicativo — mostram o que o motor identificou internamente.

O **motor linguístico** (`conjugai-core`) vive em **`vendors/`** de propósito: núcleo reutilizável que **pode existir sem** estas páginas; as demos são interfaces de visualização.

## Outros domínios de aplicação

Além de CAA, o núcleo pode ser reutilizado em:

- **EdTech / ensino de português**: feedback imediato de flexão verbal em exercícios.
- **Apoio à escrita**: pré-correção verbal em editores, teclados e extensões.
- **Assistentes locais/offline**: normalização de texto telegráfico antes de NLU.
- **Saúde digital**: apps de reabilitação da linguagem com apoio à produção verbal.
- **Atendimento e formulários**: melhoria de mensagens curtas em contextos de serviço.
- **Pré-processamento NLP**: enriquecimento morfológico para pipelines simbólicos/híbridos.

## Requisitos

- **Demos no browser:** navegador moderno; servidor HTTP local recomendado (paths relativos a `assets/`).
- **Build do núcleo e testes:** Node.js + `npm` (na raiz: `npm install`, `npm run build:core`, `npm test`).
- **Regenerar o léxico a partir do MorphoBr:** `curl` e Python 3 disponíveis no PATH (`npm run build:lexicon`).

## Como executar

```bash
cd /caminho/para/conjugai
python3 -m http.server 8765
```

Abrir: `http://localhost:8765/`

## Repositório Git

- **`main`** — ramo predefinido para desenvolvimento e integração.
- **`gh-pages`** — ramo de publicação do **GitHub Pages**, atualizado automaticamente pelo workflow `.github/workflows/deploy-pages.yml` em pushes na `main`.

Versões estáveis para quem consome o repositório: preferir **tags** (`v1.0.0`, etc.) e **GitHub Releases**, não o nome do ramo em si.

## Motor linguístico: `conjugai-core`

- **Fonte:** `vendors/conjugai-core/` (ficheiros `.ts`) — biblioteca isolada do resto da UI.  
- **No browser:** `assets/js/conjugai-core.js` — **bundle IIFE** gerado a partir dessa fonte; expõe `ConjugaiCore` (ex.: `analisarFrase`, `conjugar`). É a **mesma lib**, empacotada para `<script src="...">`.
- **Como pacote JS/TS (React, Vite, Next):** `vendors/conjugai-core/` também pode ser empacotado em `dist/` (ESM + CJS + tipos) via `npm run build:core:package`.
- **Léxico verbal** (`verbos.json`): em geral gerado a partir do **MorphoBr** (Apache-2.0) com `npm run build:lexicon` — ficheiro **minificado** (uma linha, sem indentação), com dezenas de milhares de lemas e **vários tempos/modos** por lema (indicativo alargado, condicional, subjuntivos, imperativo, gerúndio, particípio, infinitivo pessoal, quando o paradigma no MorphoBr está completo). O pipeline CAA em `analisarFrase` usa heurísticas por marcadores e também pode receber **tempo explícito** no texto via `tempo:<chave>` ou `[tempo=<chave>]`; `conjugar`/`conjugarTempo` aceitam o conjunto alargado de `TempoVerbal`.
- **Peso do bundle:** com o léxico completo MorphoBr, `verbos.json` e `conjugai-core.js` ficam da ordem de **dezenas de MB**; para cenários muito limitados, usar **whitelist** ou subconjunto de `.dict` (ver `vendors/conjugai-core/README.md`).

Após alterar o TypeScript, regenerar o bundle:

```bash
npm install   # necessário para instalar esbuild em node_modules
npm run build:lexicon   # opcional: regerar `verbos.json` a partir do MorphoBr (ver `vendors/conjugai-core/README.md`)
npm run build:core
npm run build:core:package  # opcional: gera pacote JS/TS em `vendors/conjugai-core/dist`
npm test      # Vitest: testes unitários e de regressão do conjugai-core
```

Sem `build:core`, o ficheiro em `assets/js/` pode ficar **desatualizado** em relação a `vendors/conjugai-core/`. O `build:lexicon` só é necessário quando atualizares os `.dict` MorphoBr ou o script de conversão.

### Documentação

| Documento | Conteúdo |
|-----------|----------|
| **`docs/limites-e-nao-cobertura.md`** | O que o motor e a demo CAA **não** cobrem (regência **à**/**ao**, sujeito, tempos, léxico, etc.) |
| **`docs/morphobr-e-recursos-semanticos.md`** | Por que **MorphoBr** (flexão em PT) e não **WordNet**/**VerbNet** como base; papéis complementares |
| **`vendors/conjugai-core/README.md`** | Fonte vs bundle, fluxo técnico, léxico MorphoBr |
| **`docs/diagrama.md`** | Diagramas Mermaid (fluxo CAA + motor) |
| **`docs/manutencao-documentacao.md`** | Regra de projeto: o que manter alinhado ao mudar código (docs, diagramas, demos, bundle) |
| **`CHANGELOG.md`** | Registo de alterações ao longo do tempo (histórico Git/GitHub) |

**Manutenção:** ao alterar o motor, a UI CAA ou fluxos documentados, atualizar também **testes**, **`npm run build:core`**, os **diagramas** / **docs** afetados e, quando fizer sentido, uma entrada em **`CHANGELOG.md`** — ver `docs/manutencao-documentacao.md` e `.cursorrules`.

Leitura visual no browser (GitHub Pages): `docs/readme-viewer.html?file=../README.md` e `docs/readme-viewer.html?file=../vendors/conjugai-core/README.md`.

## Estrutura (principal)

| Caminho | Descrição |
|--------|-----------|
| `index.html` | Demo paradigma verbal (raiz); carrega `conjugai-core.js` |
| `demo/caa/index.html` | Demo CAA (frase telegráfica, `analisarFrase`); carrega `app.js` + `conjugai-core.js` |
| `assets/css/styles.css` | Estilos partilhados pelas demos |
| `assets/js/app.js` | UI e orquestração da demo CAA (chama o core) |
| `assets/js/conjugai-core.js` | Bundle do motor (IIFE `ConjugaiCore`) |
| `vendors/conjugai-core/` | Código-fonte TS do motor (pacote separado da UI) |
| `vendors/conjugai-core/data/verbos.json` | Léxico de verbos (importado em `verbos-data.ts`); tipicamente **minificado**; gerado por `npm run build:lexicon` ou scripts em `vendors/conjugai-core/scripts/` |
| `vendors/conjugai-core/scripts/build_verbos_from_morphobr.sh` | Descarrega `verbs-a`…`z.dict` (cache) e gera `verbos.json` |
| `demo/verbs/diagram.html` | Diagramas do núcleo (`conjugar`, `analisarFrase`, `corrigir`, pipeline visual) |
| `demo/verbs/lexico-verbos.html` | Origem e atualização de `verbos.json` (MorphoBr, CSV, build) |
| `diagrama.html` / `docs/diagrama.md` | Diagramas Mermaid da demo CAA + fluxo do motor |
| `docs/limites-e-nao-cobertura.md` | Limites do motor e da demo CAA (o que não está coberto) |
| `docs/morphobr-e-recursos-semanticos.md` | MorphoBr vs WordNet/VerbNet (escolha de léxico) |
| `docs/manutencao-documentacao.md` | Checklist: documentação e diagramas alinhados às alterações |
| `CHANGELOG.md` | Histórico de alterações do projeto |

## Regras (resumo)

| Marcador | Tempo |
|----------|--------|
| `tempo:<chave>` / `[tempo=<chave>]` | Tempo explícito (qualquer `TempoVerbal`) |
| Seleção Manual (UI) | **Prioridade Máxima** (Ontem, Hoje, Amanhã) |
| *talvez* / *que* | Subjuntivo presente |
| *se* | Subjuntivo imperfeito |
| *quando* | Subjuntivo futuro |
| *ontem + já* | Pretérito perfeito composto |
| *amanhã + já* | Futuro composto |
| *antes* | Pretérito mais-que-perfeito |
| *antigamente* / *sempre* | Pretérito imperfeito |
| *amanhã* | Futuro do Presente |
| *ontem* | Pretérito Perfeito |
| (outros) | Presente |

**Nota sobre fallbacks:** O motor agora suporta conjugação regular para verbos em **-ar, -er, -ir** no **passado** (pretérito perfeito) e **futuro**, além do presente. Isso garante correção mesmo para verbos não listados no léxico MorphoBr.

Sujeito composto (*Eu* + *mamãe*/*papai*, ou *X e Y* antes do verbo) → **pessoa** para conjugação é **1.ª plural** (rótulo interno «Nós»); na **frase corrigida** só o verbo é flexionado — os **tokens do sujeito mantêm-se** (ex.: «Mamãe e eu iremos…»).

**Resiliência de Identidade:** Adicionada lista estática de **pronomes básicos** (Eu, Nós, Ele, etc.) para garantir a identificação correta da pessoa gramatical mesmo em ambientes sem carregamento imediato do léxico.

## Evolução

A **cobertura principal** de flexões verbais no cliente vem do **MorphoBr** → `verbos.json` (ver secção do motor e `vendors/conjugai-core/README.md`). Para **refinar ou corrigir** entradas pontuais, continuam válidos o **CSV** (`csv_to_verbos.py`) e fusão com `-m` / listas brancas.

Para ir **além** do que o MorphoBr já traz (outras normas, etiquetas DELAF nativas, subconjuntos por domínio), o caminho alinhado com morfologia continua a ser **léxicos de flexão** — por exemplo no ecossistema **Unitex** (**DELAF** e recursos da **Linguateca**): lema + formas flexionadas + etiquetas.

**Por que MorphoBr e não WordNet/VerbNet como base?** A discussão objetiva (flexão vs semântica de predicados, tabela comparativa, uso futuro como camada complementar) está em **`docs/morphobr-e-recursos-semanticos.md`**.

**WordNet** e **VerbNet** resolvem sobretudo **relações semânticas** e classes de predicados; são **complementares**, não substitutos de um léxico de flexão para o núcleo atual do ConjugAI.

Integrar DELAF/Unitex em profundidade implica tratar **formato**, **licença**, **norma** (ex. PT-BR) e **peso** em cliente móvel (subconjunto, lazy load ou índice compactado). O pipeline de sujeito, tempo e reconstrução da frase mantém-se; o recurso externo **alimenta** a camada **“qual forma verbal / lema”**.

## Limitações e não cobertura

Resumo: o núcleo não é um corretor gramatical completo nem um parser de português livre; foca **telegráfico**, **verbo** e heurísticas de **sujeito/tempo**.

Lista detalhada (regência **ir**/**viajar** + lugares em lista, crase no recorte implementado, sujeito composto, tempos, léxico, tokenização, demo): **`docs/limites-e-nao-cobertura.md`**.

Pontos que se mantêm sempre relevantes:

- Frases **longas** ou com **vários verbos** → leituras simplificadas.
- **Concordância nominal**, pontuação e reordenação sintática → fora do foco atual.
- **Heurísticas** de sujeito/tempo → ambiguidade possível.
- **Peso** do léxico MorphoBr completo (dezenas de MB) em dispositivos limitados.
- Sem `npm run build:core` após alterar TS, o bundle em `assets/js/conjugai-core.js` pode **desatualizar**.

## Referências bibliográficas (artigos)

Artigo de referência do recurso **MorphoBr** ([LR-POR/MorphoBr](https://github.com/LR-POR/MorphoBr)), alinhado ao uso no ConjugAI para dados de flexão em `verbos.json` (pipeline em `vendors/conjugai-core/README.md`):

- **FIGUEIREDO DE ALENCAR, L.**; **CUCONATO, B.**; **RADEMAKER, A.** MorphoBr: an open source large-coverage full-form lexicon for morphological analysis of Portuguese. *Texto Livre*, Belo Horizonte-MG, v. 11, n. 3, p. 1–25, 2018. DOI: [10.17851/1983-3652.11.3.1-25](https://doi.org/10.17851/1983-3652.11.3.1-25).  
  - **Revista (Texto Livre / UFMG):** [periodicos.ufmg.br — artigo 16809](https://periodicos.ufmg.br/index.php/textolivre/article/view/16809)  
  - **IBM Research (resumo e ligação ao PDF):** [MorphoBr — IBM Research](https://research.ibm.com/publications/morphobr-an-open-source-large-coverage-full-form-lexicon-for-morphological-analysis-of-portuguese)

São **duas entradas web** para a **mesma** publicação (acesso aberto na *Texto Livre*).

## Referências (conjugação verbal, outros projetos)

Recursos **independentes** do ConjugAI, úteis como contexto ou comparação de abordagens (léxico vs regras, norma europeia vs brasileira, biblioteca vs app completa):

| Recurso | Ligação | Notas breves |
|--------|---------|----------------|
| **VerbosPT** (IntersoftDev) | [github.com/IntersoftDev/verbos-pt](https://github.com/IntersoftDev/verbos-pt) | App **HTML/CSS/JS** no browser; conjugação por **regras hierárquicas** (Google Sheets + Apps Script), quiz; doc. indica **português europeu**, adaptável ao **PT-BR**. MIT. |
| **conjugador** (portujs) | [github.com/portujs/conjugador](https://github.com/portujs/conjugador) | **Biblioteca JavaScript** para conjugar verbos em português. |
| **conjugador** (npm) | [npmjs.com/package/conjugador](https://www.npmjs.com/package/conjugador) | Pacote **npm** de conjugação em português no ecossistema JS (ver README do pacote para âmbito e licença). |
| **flexoes** (DesignLiquido) | [github.com/DesignLiquido/flexoes](https://github.com/DesignLiquido/flexoes) | Biblioteca de **flexões** para português em JavaScript. |
| **Conjugue** (danxexe) | [github.com/danxexe/Conjugue](https://github.com/danxexe/Conjugue) | **Português do Brasil**; implementação em **Ruby** (não JS). |
| **portuguese-verbs** (jarrodmedrano) | [github.com/jarrodmedrano/portuguese-verbs](https://github.com/jarrodmedrano/portuguese-verbs) | Quiz com **Next.js**; uso de **OpenAI** (abordagem distinta de motor determinístico). |
| **thomasrandell.github.io** | [github.com/thomasrandell/thomasrandell.github.io](https://github.com/thomasrandell/thomasrandell.github.io) | Repositório de página estática com **conjugador** de verbos em português (HTML/CSS/JS). |

O recurso morfológico **MorphoBr** usado no ConjugAI para dados de flexão está documentado em `vendors/conjugai-core/README.md`; o **artigo** correspondente está na secção **Referências bibliográficas (artigos)** acima.

## Licença

Código do projeto ConjugAI: licenciamento conforme ficheiro `LICENSE` na raiz do repositório, quando existir.
