import type { PessoaIndice } from "./types";

export type InfoSujeito = {
  texto: string;
  pessoa: PessoaIndice;
  rotulo: string;
};

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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

/**
 * Identifica sujeito e pessoa (0–4).
 * Regras compostas: Eu + mamãe/papai → Nós (3).
 * Fallback: 3ª pessoa do singular (2) se não houver pronome explícito.
 */
export function detectarSujeito(tokens: string[]): InfoSujeito {
  const lower = tokens.map(normalize);

  if (isCompostoEuOutra(tokens)) {
    return {
      texto: "Nós",
      pessoa: 3,
      rotulo: "composto (Eu + outra pessoa) → 1ª plural",
    };
  }

  if (lower.includes("nos")) {
    return { texto: "Nós", pessoa: 3, rotulo: "explícito: nós" };
  }
  if (lower.includes("eles")) {
    return { texto: "Eles", pessoa: 4, rotulo: "explícito: eles" };
  }
  if (lower.includes("ela")) {
    return { texto: "Ela", pessoa: 2, rotulo: "explícito: ela" };
  }
  if (lower.includes("ele")) {
    return { texto: "Ele", pessoa: 2, rotulo: "explícito: ele" };
  }
  if (lower.includes("eu")) {
    return { texto: "Eu", pessoa: 0, rotulo: "explícito: eu" };
  }
  if (lower.includes("tu")) {
    return { texto: "Tu", pessoa: 1, rotulo: "explícito: tu" };
  }

  return {
    texto: "Ele",
    pessoa: 2,
    rotulo: "padrão: 3ª pessoa do singular (assumido)",
  };
}
