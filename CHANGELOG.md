# Changelog

Todas as alterações notáveis do projeto **ConjugAI** são registadas neste ficheiro.

O formato inspira-se em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/). Enquanto não houver **tags de versão** publicadas de forma consistente no Git, as entradas agrupam-se por **data** (`YYYY-MM-DD`), alinhada ao histórico de commits no Git/GitHub.

---

## [2026-03-31]

### Adicionado

- **Busca Bidirecional de Sujeito**: O motor agora identifica sujeitos (pronomes e nomes) tanto antes quanto depois do verbo (ordens SVO e VSO).
- **Deteção de Nomes e Títulos**: Reconhecimento de nomes próprios (Maiúsculas) e títulos (mamãe, médico, etc.) como sujeitos em textos telegráficos.
- **Normalização SVO**: Reordenação automática da frase corrigida para a ordem direta (Sujeito-Verbo-Objeto) quando o sujeito é detectado após o verbo.
- Expansão de metadados em `ResultAnalysis`: campos `posicaoOriginal` e `tokenIndex` no objeto `sujeito`.

### Alterado

- **Documentação**: Atualização de `docs/limites-e-nao-cobertura.md`, `docs/diagrama.md` (diagrama de sujeito) e `README.md` (root e core) para refletir as novas capacidades e tom de produto para terceiros.
- **Ajuste de Tom**: Remoção de referências acadêmicas ("orientador", "projeto de investigação") para melhor adequação a utilizadores e parceiros externos.

---

## [Unreleased]

Alterações em desenvolvimento que ainda não foram consolidadas num período datado abaixo.

### Adicionado

- **Locuções verbais** (telegrafia): `extrairVerbo` / `detectarLocucaoVerbalHeadLemma` em `conjugador.ts`; `tempo.ts` não trata o «que» de *ter que* como subjuntivo isolado. Exemplos na demo CAA.
- **Oração composta (coordenação)**: `analisarFrase` segmenta períodos com **«e»**, **«ou»**, **«mas»**, **«porém»**, **«então»** (heurísticas em `oracao-composta.ts`); resultado com `composta: true` e `oracoes[]`. Exemplos na demo CAA (`demo/caa/index.html`, `assets/js/app.js`).

### Corrigido

- **Regência de lugar** em `corretor.ts`: evita aplicar a contração **«à»**/**«ao»** duas vezes (casos «ao à praia»).
- **Sujeito após «que»** (`sujeito.ts`): em frases como *Ele disse que eles falar*, o pronome **entre «que» e o infinitivo** passa a definir a pessoa verbal (evita *fala* com sujeito *eles*).
- **Lema verbal em subordinação** (`extrairVerbo` em `conjugador.ts`): com *que* de dependência (exc. *ter que*), o alvo passa a ser o **primeiro infinitivo após esse *que*** — alinha com tempo manual **passado** (*Ele disse que eles falar* → *falaram*; *Ele dizer que eles falar* corrige só o dependente).

### Alterado

- **Diagramas e LaTeX**: `docs/diagrama.md`, `diagrama.html` e `demo/verbs/diagram.html` — fluxo de `extrairVerbo` alinhado à ordem real (ir + inf., locuções, 1.º infinitivo, léxico); notas sobre coordenação, sujeito *X ou Y* e exceção *ter que* no tempo verbal; `docs/diagramas-conjugai.tex` — nó de segmentação no pipeline e secção `extrairVerbo` atualizada.

---

## [2026-03-27]

### Adicionado

- Documentação dos **limites** do motor e da demo CAA: `docs/limites-e-nao-cobertura.md`.
- Documentação **MorphoBr vs WordNet / VerbNet**: `docs/morphobr-e-recursos-semanticos.md`.
- Guia de **manutenção** de documentação e artefatos: `docs/manutencao-documentacao.md`; regras alargadas em `.cursorrules` (docs, diagramas, demos, `npm run build:core`).
- **Regência de lugar** com **«à»** / **«ao»** também para o infinitivo **viajar** (antes só **ir**); léxico feminino/masculino mantido em `corretor.ts`.
- Teste de regressão do pipeline para «Ana e Pedro viajar praia» → «Ana e Pedro viajam à praia».

### Alterado

- **Demo CAA** (`demo/caa/`, `assets/js/app.js`): lista de exemplos com **badges** por item (sujeito, tempo, conjugação, etc.); substituição do `<select>` por lista acessível; mais frases de exemplo (incl. «você», sujeito composto, regência).
- **README.md**: índice de documentação, tabela de estrutura, parágrafo sobre manutenção de docs/diagramas.

---

## [2026-03-23]

### Adicionado

- Suporte a **empacotamento** do núcleo como pacote JS/TS (`npm run build:core:package`, artefactos em `vendors/conjugai-core/dist`).
- Documentação e planos de **publicação npm** e pipeline de release (README).
- **Workflow GitHub Actions** para deploy em **GitHub Pages** (`.github/workflows/deploy-pages.yml`).

### Alterado

- **Motor e demo**: suporte a **tempos verbais compostos** no fluxo de conjugação/análise; documentação e demos atualizadas em conjunto.
- **Diagramas**: HTML (`diagrama.html`, `demo/verbs/diagram.html`), LaTeX e **PDF** (`docs/diagramas-conjugai.pdf`) alinhados à lógica de conjugação.
- **README**: domínios de aplicação, limitações conhecidas, ramos `main` / `gh-pages`.

---

## [2026-03-22]

### Alterado

- **README**: secção de **referências bibliográficas** e recursos relacionados (MorphoBr, projetos de conjugação).

---

## [2026-03-21]

### Adicionado

- Estrutura inicial do repositório com demos HTML/CSS/JS.
- Separação do **núcleo** (`vendors/conjugai-core`) da UI; regras do projeto (`.cursorrules`).
- **Demo CAA** com passos (tokenização, sujeito, tempo, conjugação), modais e estilos.
- **Diagramas** (Mermaid, HTML interativo, LaTeX), página sobre o **léxico verbal** / MorphoBr (`demo/verbs/lexico-verbos.html`).
- Leitura visual de README no browser (`docs/readme-viewer.html`); funcionalidade de **copiar** código Mermaid.
- Informação sobre **repositório Git** e ramos no README.

### Alterado

- **Documentação e nomenclatura** do projeto; links nas demos.
- **Lógica de conjugação** e textos de demonstração (desinências do presente em verbos regulares).

### Corrigido

- Ajustes na **lógica de conjugação** reportados na documentação da altura (commits de correção alinhados a testes/demos).

---

## Legenda

- **Adicionado** — funcionalidades novas.
- **Alterado** — mudanças em comportamento ou documentação existente.
- **Corrigido** — correção de bugs ou regressões.
- **Removido** — funcionalidades descontinuadas (quando aplicável).

Para o detalhe ao nível de commit, usar `git log` no repositório ou o histórico no GitHub.
