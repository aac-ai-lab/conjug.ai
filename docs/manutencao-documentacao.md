# Manutenção da documentação e artefatos

Regra de projeto: **alterações no código que afetem comportamento, fluxos ou o que é prometido ao utilizador** devem ir acompanhadas da **atualização** dos artefatos listados abaixo, quando aplicável.

Esta lista complementa `.cursorrules` na raiz do repositório.

---

## Checklist por tipo de mudança

| Tipo de alteração | Atualizar (quando relevante) |
|-------------------|------------------------------|
| Motor (`vendors/conjugai-core/**/*.ts`) | Testes `*.test.ts`, `analisar-frase.regression.test.ts`; `npm run build:core`; `README.md` / `vendors/conjugai-core/README.md`; `docs/limites-e-nao-cobertura.md` se mudarem limites ou regras; `docs/morphobr-e-recursos-semanticos.md` se mudar a relação léxico/pipeline; **diagramas** (`docs/diagrama.md`, `diagrama.html`, `demo/verbs/diagram.html`) se o fluxo ou módulos mudarem; **`CHANGELOG.md`** para o utilizador |
| Conjunto de alterações merged (release lógico) | **`CHANGELOG.md`** (secção [Unreleased] ou data) alinhada ao Git/GitHub |
| `corretor.ts` (regência, `à`/`ao`, verbos) | `docs/limites-e-nao-cobertura.md` (secção regência) |
| Demo CAA (`demo/caa/`, `assets/js/app.js`) | Textos em `index.html`, exemplos/badges em `app.js` se o pipeline exposto mudar |
| Léxico / `verbos.json` | `vendors/conjugai-core/README.md`; nota de peso no `README.md` se necessário |
| LaTeX / PDF de diagramas | `docs/diagramas-conjugai.tex` e regenerar PDF se for parte do fluxo de release do projeto |

---

## Artefatos de referência rápida

- Documentação geral e índice: `README.md`
- Histórico de alterações: `CHANGELOG.md`
- Limites do motor: `docs/limites-e-nao-cobertura.md`
- MorphoBr vs recursos semânticos: `docs/morphobr-e-recursos-semanticos.md`
- Núcleo técnico: `vendors/conjugai-core/README.md`
- Diagramas Mermaid: `docs/diagrama.md`
- Diagramas HTML: `diagrama.html`, `demo/verbs/diagram.html`

---

## Nota

Se uma mudança for **interna** e não alterar contratos nem comportamento observável, não é obrigatório tocar em diagramas ou docs — usar bom senso; em dúvida, uma linha no CHANGELOG ou no corpo do commit ajuda.
