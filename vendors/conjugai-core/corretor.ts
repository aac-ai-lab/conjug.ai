import { indiceDoVerboNaFrase } from "./conjugador";
import type { TempoVerbal } from "./types";

/**
 * Reconstrói a frase a partir dos **tokens originais**:
 * substitui só a forma verbal pelo `conjugado` e, se o sujeito for implícito, antecede o pronome.
 * Sujeito composto (ex.: «Mamãe e eu …») mantém-se na superfície — só o verbo é flexionado.
 * Não descarta complementos.
 */
export function corrigir(
  tokens: string[],
  sujeito: { texto: string; pessoa: number; implicito?: boolean; composto?: boolean },
  infinitivo: string,
  conjugado: string,
  _tempoTipo: TempoVerbal
): string {
  const verbLower = conjugado.charAt(0).toLowerCase() + conjugado.slice(1);
  const vi = indiceDoVerboNaFrase(tokens, infinitivo);

  const resultado: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (i === vi) {
      resultado.push(verbLower);
    } else {
      resultado.push(tokens[i]);
    }
  }

  if (vi < 0) {
    const fallback = `${sujeito.texto} ${verbLower}`.replace(/\s+/g, " ").trim();
    return fallback.charAt(0).toUpperCase() + fallback.slice(1);
  }

  if (sujeito.implicito) {
    resultado.unshift(sujeito.texto);
  }

  const out = resultado.join(" ").replace(/\s+/g, " ").trim();
  return out.charAt(0).toUpperCase() + out.slice(1);
}
