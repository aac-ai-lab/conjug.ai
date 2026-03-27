# Changelog

Todas as alterações notáveis do projeto **ConjugAI** são registadas neste ficheiro.

O formato inspira-se em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/). Enquanto não houver **tags de versão** publicadas de forma consistente no Git, as entradas agrupam-se por **data** (`YYYY-MM-DD`), alinhada ao histórico de commits no Git/GitHub.

---

## [Unreleased]

Alterações em desenvolvimento que ainda não foram consolidadas num período datado abaixo.

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
