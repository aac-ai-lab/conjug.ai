/** Léxico verbal: `verbos.json` gerado por scripts (ex.: MorphoBr → morphobr_dict_to_verbos.py). */
import verbosJson from "./verbos.json";
import type { TempoVerbal } from "../types";

/** Particípio (PT): masculino/feminino × singular/plural. */
export type ParticipioEntrada = {
  m: { sg: string; pl: string };
  f: { sg: string; pl: string };
};

/**
 * Entrada por lema (infinitivo). `presente` é obrigatório no léxico gerado;
 * restantes chaves vêm do MorphoBr quando o paradigma está completo (5/5).
 */
export type EntradaVerbo = {
  presente: string[];
  futuro?: string[];
  passado?: string[];
  preterito_imperfeito?: string[];
  preterito_mais_que_perfeito?: string[];
  condicional?: string[];
  subjuntivo_presente?: string[];
  subjuntivo_imperfeito?: string[];
  subjuntivo_futuro?: string[];
  imperativo?: string[];
  infinitivo_pessoal?: string[];
  gerundio?: string;
  /** Forma canónica do infinitivo (pode coincidir com a chave). */
  infinitivo?: string;
  participio?: ParticipioEntrada;
};

/** Chaves com array de 5 pessoas (para índice forma→lema e conjugar). */
export const CHAVES_PARADIGMA_CINCO: readonly (keyof EntradaVerbo)[] = [
  "presente",
  "futuro",
  "passado",
  "preterito_imperfeito",
  "preterito_mais_que_perfeito",
  "condicional",
  "subjuntivo_presente",
  "subjuntivo_imperfeito",
  "subjuntivo_futuro",
  "imperativo",
  "infinitivo_pessoal",
] as const;

/** Subconjunto usado por `detectarTempo` / pipeline CAA. */
export const TEMPOS_PIPELINE_CAA: readonly TempoVerbal[] = [
  "presente",
  "futuro",
  "passado",
] as const;

export const VERBOS: Record<string, EntradaVerbo> = verbosJson as Record<string, EntradaVerbo>;
