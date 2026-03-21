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
 * *ontem* → passado.
 * *amanhã* → futuro, exceto quando a frase já tem perífrase **ir + infinitivo** no presente
 * (ex.: «vou viajar amanhã»), caso em que o primeiro verbo permanece no presente.
 * Caso contrário → presente.
 */
export function detectarTempo(tokens: string[]): InfoTempo {
  const lower = tokens.map(normalize);
  const primeiro = lower[0] ?? "";
  const amanha = lower.includes("amanha");
  const perifrasisIrPresente =
    amanha &&
    (primeiro === "vou" ||
      primeiro === "vais" ||
      primeiro === "vai" ||
      primeiro === "vamos" ||
      primeiro === "vao");

  if (perifrasisIrPresente) {
    return {
      tipo: "presente",
      rotulo:
        'Marcador "amanhã" com «vou/vai/… viajar» (perífrase) → presente no verbo suporte.',
    };
  }

  if (amanha) {
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
