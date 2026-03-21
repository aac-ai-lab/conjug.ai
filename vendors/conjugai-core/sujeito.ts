import { extrairVerbo, indiceDoVerboNaFrase } from "./conjugador";
import type { PessoaIndice } from "./types";

export type InfoSujeito = {
  texto: string;
  pessoa: PessoaIndice;
  rotulo: string;
  /** Sem pronome explícito na frase — usa-se 1.ª pessoa (Eu) para telegrafias. */
  implicito?: boolean;
  /** Sujeito composto: substituir o prefixo antes do verbo pelo pronome em `texto`. */
  composto?: boolean;
};

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isToken(t: string, forms: string[]): boolean {
  const n = normalize(t);
  return forms.some((f) => n === f);
}

function temConectorE(tokens: string[]): boolean {
  return tokens.some((t) => normalize(t) === "e");
}

/** Prefixo antes do primeiro token verbal (infinitivo ou forma do léxico). */
function prefixoAntesDoVerbo(tokens: string[]): string[] | null {
  const inf = extrairVerbo(tokens);
  if (!inf) return null;
  const vi = indiceDoVerboNaFrase(tokens, inf);
  if (vi < 0) return null;
  return tokens.slice(0, vi);
}

/**
 * Sujeito composto com padrão **X e Y** antes do verbo (telegrafia).
 * — contém **eu** → 1.ª plural (Nós);
 * — contém **tu** ou **você** → Vocês (pessoa verbal 4, como *eles* em PT-BR);
 * — caso contrário (ex.: *João e Maria*, *meu pai e minha mãe*) → Eles.
 */
export function detectarSujeitoComposto(tokens: string[]): InfoSujeito | null {
  const prefix = prefixoAntesDoVerbo(tokens);
  if (!prefix || prefix.length < 3 || !temConectorE(prefix)) {
    return null;
  }

  const toks = prefix.map(normalize);

  if (toks.some((t) => t === "eu")) {
    return {
      texto: "Nós",
      pessoa: 3,
      rotulo: "composto (contém «eu») → 1ª plural",
      implicito: false,
      composto: true,
    };
  }

  if (toks.some((t) => t === "tu" || t === "voce")) {
    return {
      texto: "Vocês",
      pessoa: 4,
      rotulo: "composto (tu/você + …) → plural (forma verbal como «eles»)",
      implicito: false,
      composto: true,
    };
  }

  return {
    texto: "Eles",
    pessoa: 4,
    rotulo: "composto (dois núcleos sem eu/tu/você) → 3ª plural",
    implicito: false,
    composto: true,
  };
}

function isCompostoEuOutra(tokens: string[]): boolean {
  const lower = tokens.map(normalize);
  const hasEu = lower.includes("eu");
  if (!hasEu) return false;
  if (lower.includes("mamae") || lower.some((t) => t.startsWith("mamae"))) return true;
  if (lower.includes("papai")) return true;
  const joined = lower.join(" ");
  if (/(mamae|papai)\s+e\s+eu|eu\s+e\s+(mamae|papai)/.test(joined)) return true;
  return false;
}

function detectarSujeitoSimples(tokens: string[]): InfoSujeito {
  const lower = tokens.map(normalize);

  if (isCompostoEuOutra(tokens)) {
    return {
      texto: "Nós",
      pessoa: 3,
      rotulo: "composto (Eu + mamãe/papai) → 1ª plural",
      implicito: false,
      composto: true,
    };
  }

  if (lower.includes("nos")) {
    return { texto: "Nós", pessoa: 3, rotulo: "explícito: nós", implicito: false };
  }
  if (lower.includes("eles")) {
    return { texto: "Eles", pessoa: 4, rotulo: "explícito: eles", implicito: false };
  }
  if (lower.includes("ela")) {
    return { texto: "Ela", pessoa: 2, rotulo: "explícito: ela", implicito: false };
  }
  if (lower.includes("ele")) {
    return { texto: "Ele", pessoa: 2, rotulo: "explícito: ele", implicito: false };
  }
  if (lower.includes("eu")) {
    return { texto: "Eu", pessoa: 0, rotulo: "explícito: eu", implicito: false };
  }
  if (lower.includes("tu")) {
    return { texto: "Tu", pessoa: 1, rotulo: "explícito: tu", implicito: false };
  }

  return {
    texto: "Eu",
    pessoa: 0,
    rotulo: "implícito: 1ª pessoa do singular (frase sem pronome explícito)",
    implicito: true,
  };
}

/**
 * Identifica sujeito e pessoa (0–4).
 * Tenta primeiro sujeito composto (**X e Y** antes do verbo); depois regras simples e *Eu + mamãe/papai*.
 */
export function detectarSujeito(tokens: string[]): InfoSujeito {
  const comp = detectarSujeitoComposto(tokens);
  if (comp) return comp;
  return detectarSujeitoSimples(tokens);
}
