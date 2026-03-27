# MorphoBr, WordNet e VerbNet — por que o núcleo usa léxico de **flexão**

Este documento fixa a **razão de desenho** do ConjugAI: a camada de **conjugação** e reconhecimento de formas verbais assenta num **léxico morfológico** em **português** (pipeline **MorphoBr** → `verbos.json`). Recursos como **WordNet** e **VerbNet** são **outro tipo de ferramenta** e **não** substituem esse léxico.

---

## Problema que o motor precisa resolver

O `conjugai-core` precisa, entre outras coisas, de:

- **Lemas** e **formas flexionadas** em PT-BR (ex.: *comer* → *como*, *comemos*, *comeria*…).
- Dados suficientes para **conjugar** e para **reconhecer** uma forma tokenizada como verbo (quando aplicável).

Isso é um problema de **morfologia** e de **inventário de formas**, não de classificação semântica fina de verbos.

---

## O que o MorphoBr oferece

**MorphoBr** é um **léxico morfológico de grande cobertura** para português: formas anotadas (lema, traços), adequado a análise morfológica e à extração de paradigmas. No projeto, os dados são convertidos para **`verbos.json`**, que alimenta `conjugar`, `extrairVerbo` e o resto do pipeline descrito em `vendors/conjugai-core/README.md`.

Em resumo: MorphoBr → **dados de flexão em português** → base do comportamento verbal do núcleo.

---

## O que são WordNet e VerbNet (e por que não os usamos *em lugar* do MorphoBr)

| Recurso | Língua típica | Foco principal |
|--------|----------------|----------------|
| **WordNet** | Sobretudo inglês (existem extensões e redes para outras línguas) | **Relações semânticas** entre palavras (sinonímia, hiponímia, etc.), não paradigmas completos de flexão verbal como objetivo central. |
| **VerbNet** | Inglês (recurso clássico) | **Classes de predicados** e **frames** (padrões sintático-semânticos, papéis temáticos), não um dicionário de todas as formas verbais de PT-BR. |

**WordNet** e **VerbNet** resolvem sobretudo **lexical semantics** e **organização de predicados**; são **complementares** para aplicações que precisem de raciocínio sobre papéis, classes de verbo ou relações entre conceitos.

**Não** substituem um léxico de **flexão** usado para gerar e validar **formas verbais** em português. Para o objetivo atual do ConjugAI — conjugação e análise morfossintática leve em texto telegráfico — o recurso certo na base é um **léxico de formas** (MorphoBr / eventualmente DELAF ou similar), não VerbNet.

---

## Como combinar no futuro

- **Morfologia / flexão:** MorphoBr (ou DELAF/Unitex, subconjuntos, outras normas) continua a alimentar a camada **“qual forma / qual lema”**.
- **Semântica / frames:** WordNet, VerbNet, ou recursos em português alinhados a essa função poderiam ser **camadas à parte** (desambiguação, escolha de lema, validação de argumentos), **sem** substituir `verbos.json` como fonte de paradigmas.

Integrações desse tipo implicam licenças, formato, norma (PT-BR) e peso em cliente — como já se comenta na secção **Evolução** do `README.md` na raiz.

---

## Referências no repositório

- Pipeline MorphoBr → `verbos.json`: `vendors/conjugai-core/README.md` (secções sobre MorphoBr e build).
- Limites do motor (o que **não** cobrimos): `docs/limites-e-nao-cobertura.md`.
