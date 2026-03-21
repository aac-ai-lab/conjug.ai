# ConjugAI — diagramas da lógica e do protótipo

Documentação em Mermaid. Pode pré-visualizar no VS Code/Cursor (extensão Mermaid) ou abrir `diagrama.html` na raiz do projeto no navegador.

---

## 1. Pipeline de análise (`analyze`)

Fluxo principal desde o texto bruto até a frase final.

```mermaid
flowchart TD
  A[Texto bruto] --> B[tokenize]
  B --> C{Tokens vazios?}
  C -->|sim| ERR[Erro: digite uma frase]
  C -->|não| D[findVerbInfinitive]
  D --> E{Infinitivo conhecido?}
  E -->|não| ERR2[Erro: verbo não reconhecido]
  E -->|sim| F[resolveSubject]
  F --> G[resolveTemporal]
  G --> H[pickForm + pronome + complementos]
  H --> I[Frase final capitalizada]

  subgraph regras_tempo["Marcador temporal"]
    G1["amanhã → Futuro do Presente"]
    G2["ontem → Pretérito Perfeito"]
    G3["caso contrário → Presente"]
  end

  subgraph sujeito["Sujeito"]
    F1["Eu + mamãe/papai → Nós"]
    F2["Ordem: composto → nós → eles → ela → ele → eu → padrão eu"]
  end
```

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
