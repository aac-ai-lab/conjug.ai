import { indiceDoVerboNaFrase } from "./conjugador";
import type { TempoVerbal } from "./types";

function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Verbos de movimento/deslocamento em que *a/o + lugar* (lista abaixo) admite «à»/«ao» em telegrafia. */
const VERBOS_MOVIMENTO_REGENCIA_LOCAL = new Set(["ir", "viajar"]);

/**
 * Substantivos de lugar frequentes em telegrafia (CAA), com género para regência *a/o + substantivo*.
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
 * Regência de **ir** / **viajar** (e similares na lista) + complemento de lugar (PT-BR):
 * preposição «a» + artigo «a» ou «o» + substantivo → «à» ou «ao».
 * - Telegrafia sem artigo: insere «à» ou «ao» antes do substantivo conhecido.
 * - Com «a» ou «o» explícitos antes do substantivo: contração num único token («à» ou «ao»).
 * Artigo errado para o género do substantivo (ex.: «o» + escola) corrige-se para «à» ou «ao».
 */
function aplicarRegenciaMovimentoLocais(resultado: string[], vi: number, infinitivo: string): void {
  if (vi < 0 || !VERBOS_MOVIMENTO_REGENCIA_LOCAL.has(normalizar(infinitivo))) return;

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
  sujeito: {
    texto: string;
    pessoa: number;
    implicito?: boolean;
    composto?: boolean;
    posicaoOriginal?: "antes" | "depois";
    tokenIndex?: number;
  },
  infinitivo: string,
  conjugado: string,
  _tempoTipo: TempoVerbal
): string {
  const verbLower = conjugado.charAt(0).toLowerCase() + conjugado.slice(1);
  const vi = indiceDoVerboNaFrase(tokens, infinitivo);

  // 1. Filtrar tokens para reconstrução
  // Se o sujeito for explícito e estiver depois do verbo, vamos movê-lo para o início (SVO)
  const normalizeSVO = sujeito.posicaoOriginal === "depois" && typeof sujeito.tokenIndex === "number";
  
  const resultado: string[] = [];
  
  // Se normalizando SVO, o sujeito vem primeiro
  if (normalizeSVO) {
    resultado.push(sujeito.texto);
  } else if (sujeito.implicito) {
    // Se implícito, também garantimos o pronome no início
    resultado.push(sujeito.texto);
  }

  for (let i = 0; i < tokens.length; i++) {
    // Pula o token do sujeito se estivermos normalizando SVO (pois já o adicionamos no início)
    if (normalizeSVO && i === sujeito.tokenIndex) continue;

    if (i === vi) {
      resultado.push(verbLower);
    } else {
      resultado.push(tokens[i]);
    }
  }

  if (vi < 0 && resultado.length === 0) {
    const fallback = `${sujeito.texto} ${verbLower}`.replace(/\s+/g, " ").trim();
    return fallback.charAt(0).toUpperCase() + fallback.slice(1);
  }

  // Se o sujeito era explícito e estava ANTES do verbo, ele já está nos 'tokens[i]' 
  // e foi adicionado naturalmente no loop acima. Não precisamos unshift.
  
  // Se vi não foi encontrado, mas temos tokens (ex: erro no índice), garantir que não perdemos o verbo
  const viFinal = vi >= 0 ? (normalizeSVO ? (sujeito.tokenIndex! < vi ? vi - 1 : vi) + 1 : vi) : -1;

  aplicarRegenciaMovimentoLocais(resultado, viFinal + (normalizeSVO || sujeito.implicito ? 0 : 0), infinitivo);
  
  // Re-calculando o índice do verbo no array 'resultado' para a regência
  const viNoResultado = resultado.findIndex(t => normalizar(t) === normalizar(verbLower));
  if (viNoResultado >= 0) {
    aplicarRegenciaMovimentoLocais(resultado, viNoResultado, infinitivo);
  }

  const out = resultado.join(" ").replace(/\s+/g, " ").trim();
  return out.charAt(0).toUpperCase() + out.slice(1);
}
