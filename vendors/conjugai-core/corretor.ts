import { indiceDoVerboNaFrase } from "./conjugador";
import type { TempoVerbal } from "./types";

function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Substantivos de lugar frequentes em telegrafia (CAA), com género para regência de «ir».
 * Comparação sempre com `normalizar` (sem acento).
 * Fora desta lista não se insere artigo — evita erros em nomes próprios ou usos não locativos.
 */
const SUBST_LOCATIVO_FEMININO = new Set([
  "escola",
  "praia",
  "casa",
  "igreja",
  "farmacia",
  "padaria",
  "academia",
  "universidade",
  "faculdade",
  "praca",
  "feira",
  "loja",
  "piscina",
  "biblioteca",
  "clinica",
  "festa",
]);

const SUBST_LOCATIVO_MASCULINO = new Set([
  "trabalho",
  "cinema",
  "hospital",
  "banco",
  "parque",
  "medico",
  "dentista",
  "colegio",
  "shopping",
  "teatro",
  "zoologico",
  "ginasio",
  "mar",
  "mercado",
]);

function generoLocativoSubs(subs: string): "f" | "m" | null {
  const n = normalizar(subs);
  if (SUBST_LOCATIVO_FEMININO.has(n)) return "f";
  if (SUBST_LOCATIVO_MASCULINO.has(n)) return "m";
  return null;
}

/**
 * Regência de «ir» + complemento de lugar (PT-BR): preposição «a» + artigo «a» ou «o» + substantivo → «à» ou «ao».
 * - Telegrafia sem artigo: insere «à» ou «ao» antes do substantivo conhecido.
 * - Com «a» ou «o» explícitos antes do substantivo: contração num único token («à» ou «ao»).
 * Artigo errado para o género do substantivo (ex.: «o» + escola) corrige-se para «à» ou «ao».
 */
function aplicarRegenciaIrLocais(resultado: string[], vi: number, infinitivo: string): void {
  if (vi < 0 || normalizar(infinitivo) !== "ir") return;

  for (let k = vi + 1; k < resultado.length - 1; k++) {
    const art = normalizar(resultado[k]);
    const gen = generoLocativoSubs(resultado[k + 1]);
    if (!gen) continue;
    if (gen === "f") {
      if (art === "a" || art === "o") resultado[k] = "à";
    } else {
      if (art === "a" || art === "o") resultado[k] = "ao";
    }
  }

  const j = vi + 1;
  if (j >= resultado.length) return;
  const gen = generoLocativoSubs(resultado[j]);
  if (gen === "f") resultado.splice(j, 0, "à");
  else if (gen === "m") resultado.splice(j, 0, "ao");
}

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

  aplicarRegenciaIrLocais(resultado, vi, infinitivo);

  if (sujeito.implicito) {
    resultado.unshift(sujeito.texto);
  }

  const out = resultado.join(" ").replace(/\s+/g, " ").trim();
  return out.charAt(0).toUpperCase() + out.slice(1);
}
