# ConjugAI

Protótipo de **Tecnologia Assistiva** que transforma frases telegráficas em português do Brasil **gramaticalmente mais corretas**, com interface tipo “análise ao vivo”.

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

- **Fonte:** `src/lib/conjugai-core/` (ficheiros `.ts`) — é a biblioteca propriamente dita.  
- **No browser:** `assets/js/conjugai-core.js` — **bundle IIFE** gerado a partir dessa fonte; expõe `ConjugaiCore` (ex.: `analisarFrase`). Não é outro projeto: é a **mesma lib**, empacotada para `<script src="...">`.

Depois de editares o TypeScript, regenera o bundle:

```bash
npm install
npm run build:core
```

Sem este passo, o ficheiro em `assets/js/` pode ficar **desatualizado** em relação ao `src/`.

Documentação detalhada (fonte vs bundle, fluxo): **`docs/conjugai-core.md`**.

## Estrutura (principal)

| Caminho | Descrição |
|--------|-----------|
| `index.html` | Página principal |
| `assets/css/styles.css` | Estilos |
| `assets/js/app.js` | UI e chamada ao core |
| `assets/js/conjugai-core.js` | Bundle do motor (IIFE `ConjugaiCore`) |
| `src/lib/conjugai-core/` | Código-fonte TS do motor |
| `src/lib/conjugai-core/data/verbos.json` | Léxico de verbos (manter alinhado a `verbos-data.ts`) |
| `src/lib/conjugai-core/demo.html` | Página simples “infinitivo → paradigma” (estilo verbe.cc) |
| `diagrama.html` / `docs/diagrama.md` | Diagramas Mermaid |

## Regras (resumo)

| Marcador | Tempo |
|----------|--------|
| *amanhã* | Futuro do Presente |
| *ontem* | Pretérito Perfeito |
| (outros) | Presente |

Sujeito composto *Eu* + *mamãe*/*papai* → tratamento como **Nós** (1.ª plural).

## Limpeza de versões antigas

Se ainda existir uma pasta **`vendor/`** (ex.: cópia antiga do conjugador de terceiros), podes apagá-la — o motor atual é só **`conjugai-core`**.

## Licença

Código do projeto ConjugAI: conforme o uso no teu trabalho/repositório.
