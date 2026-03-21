# ConjugAI

Protótipo de **Tecnologia Assistiva** focado na **conjugação verbal** em contexto de **CAA** (Comunicação Aumentativa e Alternativa), em **português do Brasil**: entradas telegráficas, **pessoa gramatical** e **tempos** (presente, futuro, passado com marcadores). A interface “análise ao vivo” serve para **visualizar e discutir** o desenho do motor com o orientador.

O **motor linguístico** (`conjugai-core`) vive em **`vendors/`** de propósito: é um núcleo reutilizável que **pode existir sem** esta interface web experimental; a app é só o protótipo de visualização.

## Requisitos

- Navegador moderno.
- Servidor HTTP local recomendado (paths relativos a `assets/`).

## Como executir

```bash
cd /caminho/para/conjugai
python3 -m http.server 8765
```

Abrir: `http://localhost:8765/`

## Motor linguístico: `conjugai-core`

- **Fonte:** `vendors/conjugai-core/` (ficheiros `.ts`) — biblioteca isolada do resto da UI.  
- **No browser:** `assets/js/conjugai-core.js` — **bundle IIFE** gerado a partir dessa fonte; expõe `ConjugaiCore` (ex.: `analisarFrase`). É a **mesma lib**, empacotada para `<script src="...">`.
- **Léxico verbal** (`verbos.json`): pode ser atualizado a partir do recurso **MorphoBr** (Apache-2.0); ver a secção MorphoBr em `vendors/conjugai-core/README.md`.

Depois de editares o TypeScript, regenera o bundle:

```bash
npm install   # necessário para instalar esbuild em node_modules
npm run build:core
npm test      # Vitest: testes unitários e de regressão do conjugai-core
```

Sem este passo, o ficheiro em `assets/js/` pode ficar **desatualizado** em relação a `vendors/conjugai-core/`.

Documentação detalhada (fonte vs bundle, fluxo): **`vendors/conjugai-core/README.md`**.

## Estrutura (principal)

| Caminho | Descrição |
|--------|-----------|
| `index.html` | Página principal |
| `assets/css/styles.css` | Estilos |
| `assets/js/app.js` | UI e chamada ao core |
| `assets/js/conjugai-core.js` | Bundle do motor (IIFE `ConjugaiCore`) |
| `vendors/conjugai-core/` | Código-fonte TS do motor (pacote separado da UI) |
| `vendors/conjugai-core/data/verbos.json` | Léxico de verbos (importado em `verbos-data.ts`) |
| `vendors/conjugai-core/demo.html` | Página simples “infinitivo → paradigma” (estilo verbe.cc) |
| `vendors/conjugai-core/diagram.html` | Diagramas da biblioteca (`conjugar`, `analisarFrase`, `corrigir` + pipeline visual) |
| `diagrama.html` / `docs/diagrama.md` | Diagramas Mermaid (app + protótipo) |

## Regras (resumo)

| Marcador | Tempo |
|----------|--------|
| *amanhã* | Futuro do Presente |
| *ontem* | Pretérito Perfeito |
| (outros) | Presente |

Sujeito composto (*Eu* + *mamãe*/*papai*, ou *X e Y* antes do verbo) → **pessoa** para conjugação é **1.ª plural** (rótulo interno «Nós»); na **frase corrigida** só o verbo é flexionado — os **tokens do sujeito mantêm-se** (ex.: «Mamãe e eu iremos…»).

## Limpeza de versões antigas

Se ainda existir uma pasta antiga **`vendor/`** (singular, cópia de um conjugador de terceiros), podes apagá-la. O motor atual é **`vendors/conjugai-core/`** (nome plural intencional: pacote “fornecido” / isolado da app de visualização).

## Evolução

Para **aumentar a cobertura de conjugação** (ir além do léxico manual `verbos.json`), o caminho alinhado com morfologia é usar **léxicos de flexão** — por exemplo no ecossistema **Unitex** (**DELAF** e recursos da **Linguateca**): lema + formas flexionadas + etiquetas, adequados a **análise morfológica** e geração de formas.

**WordNet** e **VerbNet** resolvem sobretudo **relações semânticas** e classes de predicados (sentidos, papéis temáticos); são **complementares**, não substitutos de um léxico de flexão para o núcleo atual do ConjugAI.

Integrar DELAF/Unitex implica tratar **formato**, **licença**, **norma** (ex. PT-BR) e **peso** em cliente móvel (subconjunto ou índice compactado). O pipeline de sujeito, tempo e reconstrução da frase mantém-se; o recurso externo **alimenta** a camada **“qual forma verbal / lema”**.

## Licença

Código do projeto ConjugAI: conforme o uso no teu trabalho/repositório.
