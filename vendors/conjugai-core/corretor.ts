import { conjugarTempo, indiceDoVerboNaFrase, isVerbShape } from "./conjugador";
import type { TempoVerbal } from "./types";
import { normalize, getRegenciaInfo, getPronomeInfo, loader } from "../nlp-pt-br-lite/src/index";

/** Tempos macro em que matriz e dependente usam o mesmo tempo (*Ele dizer…* + passado manual → *disse* + *falaram*). */
const TEMPOS_MACRO_MATRIZ_IGUAL: TempoVerbal[] = ["passado", "presente", "futuro"];

/**
 * *Pronome + infinitivo + que* … verbo dependente: flexiona o infinitivo da matriz
 * (passado/presente/futuro: mesmo tempo que o dependente; outros tempos do dependente → matriz no **pretérito**, ex. *disse* + *falem*).
 */
async function conjugadoMatrizInfinitivoAntesQue(
  tokens: string[],
  viDependente: number,
  tempoDependente: TempoVerbal
): Promise<{ matIdx: number; forma: string } | null> {
  if (viDependente < 3 || tokens.length < 3) return null;
  if (normalize(tokens[2]) !== "que") return null;
  const pron = await getPronomeInfo(tokens[0]);
  if (!pron) return null;
  if (!isVerbShape(tokens[1])) return null;
  const matIdx = 1;
  if (matIdx === viDependente) return null;
  const lemaMat = tokens[1].trim().toLowerCase();
  const tempoMatriz: TempoVerbal = TEMPOS_MACRO_MATRIZ_IGUAL.includes(tempoDependente)
    ? tempoDependente
    : "passado";
  const forma = conjugarTempo(lemaMat, pron.pessoa, tempoMatriz);
  if (!forma) return null;
  const fl = forma.charAt(0).toLowerCase() + forma.slice(1);
  return { matIdx, forma: fl };
}





async function generoLocativoSubs(subs: string): Promise<"f" | "m" | null> {
  const info = await loader.getWordInfo(subs);
  if (info?.cat?.includes("LUGAR_FEM")) return "f";
  if (info?.cat?.includes("LUGAR_MASC")) return "m";
  return null;
}

/**
 * Regência de **ir** / **viajar** (e similares na lista) + complemento de lugar (PT-BR):
 * preposição «a» + artigo «a» ou «o» + substantivo → «à» ou «ao».
 * - Telegrafia sem artigo: insere «à» ou «ao» antes do substantivo conhecido.
 * - Com «a» ou «o» explícitos antes do substantivo: contração num único token («à» ou «ao»).
 * Artigo errado para o género do substantivo (ex.: «o» + escola) corrige-se para «à» ou «ao».
 */
async function aplicarRegenciaMovimentoLocais(resultado: string[], vi: number, infinitivo: string): Promise<void> {
  const regValue = await getRegenciaInfo(infinitivo);
  if (vi < 0 || regValue !== "local") return;

  for (let k = vi + 1; k < resultado.length - 1; k++) {
    const art = normalize(resultado[k]);
    const gen = await generoLocativoSubs(resultado[k + 1]);
    if (!gen) continue;
    if (gen === "f") {
      if (art === "a" || art === "o") resultado[k] = "à";
    } else {
      if (art === "a" || art === "o") resultado[k] = "ao";
    }
  }

  const j = vi + 1;
  if (j >= resultado.length) return;
  const gen = await generoLocativoSubs(resultado[j]);
  if (gen === "f") resultado.splice(j, 0, "à");
  else if (gen === "m") resultado.splice(j, 0, "ao");
}

/**
 * Reconstrói a frase a partir dos **tokens originais**:
 * substitui só a forma verbal pelo `conjugado` e, se o sujeito for implícito, antecede o pronome.
 * Sujeito composto (ex.: «Mamãe e eu …») mantém-se na superfície — só o verbo é flexionado.
 * Com *Pronome + infinitivo + que* e verbo dependente mais à frente, flexiona-se também o infinitivo da matriz (macro passado/presente/futuro: alinhado ao dependente; noutros tempos do dependente, matriz no pretérito: *Ele disse que eles falem*).
 * Não descarta complementos.
 */
export async function corrigir(
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
  tempoTipo: TempoVerbal
): Promise<string> {
  const verbLower = conjugado.charAt(0).toLowerCase() + conjugado.slice(1);
  const vi = indiceDoVerboNaFrase(tokens, infinitivo);

  // 1. Filtrar tokens para reconstrução
  // Se o sujeito for explícito e estiver depois do verbo, vamos movê-lo para o início (SVO)
  const normalizeSVO = sujeito.posicaoOriginal === "depois" && typeof sujeito.tokenIndex === "number";
  const matriz =
    !normalizeSVO && !sujeito.implicito
      ? await conjugadoMatrizInfinitivoAntesQue(tokens, vi, tempoTipo)
      : null;

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

    if (matriz && i === matriz.matIdx) {
      resultado.push(matriz.forma);
    } else if (i === vi) {
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
  
  const viNoResultado = resultado.findIndex((t) => normalize(t) === normalize(verbLower));
  await aplicarRegenciaMovimentoLocais(resultado, viNoResultado, infinitivo);

  const out = resultado.join(" ").replace(/\s+/g, " ").trim();
  return out.charAt(0).toUpperCase() + out.slice(1);
}
