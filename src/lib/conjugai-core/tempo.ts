import type { TempoVerbal } from "./types";

export type InfoTempo = {
  tipo: TempoVerbal;
  rotulo: string;
};

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * *amanhã* → futuro; *ontem* → passado; caso contrário → presente.
 */
export function detectarTempo(tokens: string[]): InfoTempo {
  const lower = tokens.map(normalize);
  if (lower.includes("amanha")) {
    return {
      tipo: "futuro",
      rotulo: 'Marcador "amanhã" → Futuro do Presente do indicativo.',
    };
  }
  if (lower.includes("ontem")) {
    return {
      tipo: "passado",
      rotulo: 'Marcador "ontem" → Pretérito Perfeito do indicativo.',
    };
  }
  return {
    tipo: "presente",
    rotulo: "Sem marcador de passado/futuro → Presente do indicativo.",
  };
}
