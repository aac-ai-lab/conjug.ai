# ConjugAI — diagramas da lógica e do protótipo

Documentação em Mermaid. Pode pré-visualizar no VS Code/Cursor (extensão Mermaid) ou abrir `diagrama.html` na raiz do projeto no navegador.

---

## 1. Pipeline de análise (`analisarFrase`)

Fluxo em `vendors/conjugai-core/index.ts`: desde o texto bruto até `correcao`. A UI chama `ConjugaiCore.analisarFrase` a partir de `assets/js/app.js` (`analyze`).

```mermaid
flowchart TD
  A[Texto bruto] --> B[tokenize]
  B --> C{Tokens vazios?}
  C -->|sim| ERR[Erro: digite uma frase]
  C -->|não| D[detectarSujeito]
  D --> E[detectarTempo]
  E --> F[extrairVerbo]
  F --> G{Lema verbal?}
  G -->|não| ERR2[Erro: verbo não identificado]
  G -->|sim| H[conjugar]
  H --> I{Forma no tempo?}
  I -->|não| ERR3[Erro: não foi possível conjugar neste tempo]
  I -->|sim| J[corrigir]
  J --> K[Frase corrigida]
```

### 1.1. `extrairVerbo` (lema verbal)

Detalhe de `conjugador.ts`, invocado dentro de `analisarFrase` após sujeito e tempo.

```mermaid
flowchart TD
  X["extrairVerbo(tokens)"] --> Y["detectarVerboPorDicionario"]
  Y --> Z{lema?}
  Z -->|sim| R["retorna infinitivo"]
  Z -->|não| W["percorrer tokens em ordem"]
  W --> V{"isVerbShape(token)?"}
  V -->|sim| R
  V -->|não| N0["null"]
```

Diagrama interativo e restantes fluxos do núcleo: `vendors/conjugai-core/diagram.html`.

---

## 2. Sujeito e tempo (detalhe)

**Sujeito**

```mermaid
flowchart TD
  S0[Contém eu + mamãe ou papai?] -->|sim| SN[Nós — 1ª plural]
  S0 -->|não| S1[Ordem: nós → eles → ela → ele → eu → padrão eu]
```

**Tempo verbal**

```mermaid
flowchart TD
  T0[Tem token amanhã?] -->|sim| TF[Futuro do Presente]
  T0 -->|não| T1[Tem token ontem?]
  T1 -->|sim| TP[Pretérito Perfeito]
  T1 -->|não| TN[Presente do indicativo]
```

---

## 3. Arquitetura do protótipo (SPA)

```mermaid
flowchart TB
  subgraph ui["Interface — index.html + assets/css/styles.css"]
    ASIDE[Lista / select de exemplos]
    IN[Textarea entrada]
    BTN[Analisar / Limpar]
    STEPS[4 passos: tokens → sujeito → tempo → regra]
    OUT[Saída destacada]
  end

  subgraph core["conjugai-core — assets/js/conjugai-core.js"]
    AF[analisarFrase]
    TOK[tokenize]
    SUB[detectarSujeito]
    TMP[detectarTempo]
    CJ[conjugar + corrigir]
  end

  subgraph app["assets/js/app.js"]
    AN[analyze → chama core]
    ANIM[runStepAnimation]
  end

  ASIDE --> IN
  IN --> BTN
  BTN --> AN
  AN --> AF
  AF --> TOK
  AF --> SUB
  AF --> TMP
  AF --> CJ
  AN --> ANIM
  ANIM --> STEPS
  ANIM --> OUT
```

---

## 4. Fluxo de dados na demonstração ao vivo

```mermaid
sequenceDiagram
  participant U as Utilizador
  participant S as Select / Textarea
  participant C as ConjugaiCore.analisarFrase
  participant UI as Painel de passos + saída

  U->>S: escolhe exemplo ou edita texto
  U->>UI: clica Analisar
  UI->>C: texto bruto
  C-->>UI: ResultadoAnalise (tokens, correcao, debug)
  Note over UI: animação em 4 etapas (~1,7 s)
  UI->>U: frase corrigida
```
