/** Léxico verbal: fonte única em `verbos.json` (gerado/atualizado por scripts, ex. MorphoBr). */
import verbosJson from "./verbos.json";

export type EntradaVerbo = {
  presente: string[];
  futuro: string[];
  passado: string[];
};

export const VERBOS: Record<string, EntradaVerbo> = verbosJson as Record<string, EntradaVerbo>;
