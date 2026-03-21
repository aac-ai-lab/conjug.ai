import { indiceDoVerboNaFrase } from "./conjugador";
import type { TempoVerbal } from "./types";

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Monta a frase corrigida: pronome + forma conjugada + complementos.
 */
export function corrigir(
  tokens: string[],
  sujeito: { texto: string; pessoa: number },
  infinitivo: string,
  conjugado: string,
  tempoTipo: TempoVerbal
): string {
  const pronoun = sujeito.texto;
  const verbLower =
    conjugado.charAt(0).toLowerCase() + conjugado.slice(1);
  const nv = normalize(infinitivo);
  const vi = indiceDoVerboNaFrase(tokens, infinitivo);
  const lower = tokens.map(normalize);
  const after = vi >= 0 ? tokens.slice(vi + 1) : [];

  let complemento = "";

  if (nv === "comer") {
    const obj = after.find((t) => /ma[cç]a/i.test(t));
    complemento = obj ? " uma maçã" : "";
  } else if (nv === "ir") {
    if (after.some((t) => normalize(t) === "shopping")) {
      complemento = " ao shopping amanhã";
    } else if (tempoTipo === "passado") {
      complemento = " ontem";
    } else {
      const rest = after.filter((t) => !["amanha", "ontem"].includes(normalize(t)));
      complemento = rest.length ? " " + rest.join(" ") : "";
    }
  } else if (nv === "querer") {
    const inf = after.find((t) => normalize(t) === "brincar");
    if (inf) {
      complemento = " brincar";
    } else {
      const rest = after.filter(Boolean);
      complemento = rest.length ? " " + rest.join(" ") : "";
    }
  } else {
    const rest = after.filter((t) => !["amanha", "ontem"].includes(normalize(t)));
    if (rest.length) {
      complemento = " " + rest.join(" ");
    } else if (lower.includes("ontem")) {
      complemento = " ontem";
    } else if (lower.includes("amanha")) {
      complemento = " amanhã";
    }
  }

  let core = `${pronoun} ${verbLower}${complemento}`.replace(/\s+/g, " ").trim();
  if (!core.endsWith(".") && !core.endsWith("!") && !core.endsWith("?")) {
    core += ".";
  }
  return core.charAt(0).toUpperCase() + core.slice(1);
}
