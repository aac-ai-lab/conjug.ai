import {
  conjugarTempo,
  detectarVerboPorDicionario,
  indiceDoVerboNaFrase,
  isVerbShape,
} from "./conjugador";
import { ADJETIVOS_BIFORMES } from "./data/adjetivos-biformes";
import type { TempoVerbal } from "./types";
import { normalize, getRegenciaInfo, getPronomeInfo, loader } from "../nlp-pt-br-lite/src/index";

/** Tempos macro em que matriz e dependente usam o mesmo tempo (*Ele dizer…* + passado manual → *disse* + *falaram*). */
const TEMPOS_MACRO_MATRIZ_IGUAL: TempoVerbal[] = ["passado", "presente", "futuro"];
type GeneroNominal = "f" | "m";
type NumeroNominal = "sg" | "pl";

const PARES_GENERO: Array<[masc: string, fem: string]> = [
  ["o", "a"],
  ["os", "as"],
  ["um", "uma"],
  ["uns", "umas"],
  ["meu", "minha"],
  ["meus", "minhas"],
  ["teu", "tua"],
  ["teus", "tuas"],
  ["seu", "sua"],
  ["seus", "suas"],
  ["nosso", "nossa"],
  ["nossos", "nossas"],
  ["vosso", "vossa"],
  ["vossos", "vossas"],
  ["este", "esta"],
  ["estes", "estas"],
  ["esse", "essa"],
  ["esses", "essas"],
  ["aquele", "aquela"],
  ["aqueles", "aquelas"],
];

const TOKENS_SINGULAR = new Set(
  PARES_GENERO.flatMap(([m, f]) =>
    [m, f].filter((t) => !t.endsWith("s"))
  )
);

const TOKENS_PLURAL = new Set(
  PARES_GENERO.flatMap(([m, f]) =>
    [m, f].filter((t) => t.endsWith("s"))
  )
);

function manterCaixa(orig: string, novo: string): string {
  if (orig === orig.toUpperCase()) return novo.toUpperCase();
  if (orig[0] === orig[0].toUpperCase()) return novo.charAt(0).toUpperCase() + novo.slice(1);
  return novo;
}

function pluralRegular(token: string): string | null {
  const n = normalize(token);
  if (n.endsWith("s")) return null;
  if (/[aeiou]$/.test(n)) return `${token}s`;
  if (n.endsWith("m") && token.length > 1) return `${token.slice(0, -1)}ns`;
  return null;
}

function singularRegular(token: string): string | null {
  const n = normalize(token);
  if (n.endsWith("ns") && token.length > 2) return `${token.slice(0, -2)}m`;
  if (/[aeiou]s$/.test(n) && token.length > 1) return token.slice(0, -1);
  return null;
}

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

/**
 * Com macro-tempo **passado** (ex.: «ontem» na UI), oração **quando** + **pronome** + verbo
 * (telegráfico, p.ex. infinitivo no lugar do futuro do subjuntivo) alinha-se ao passado
 * (*quando ela chegou*), coerente com a matriz no imperfeito + gerúndio.
 */
async function flexionarQuandoSubordinadaNoPassado(
  resultado: string[],
  tempoTipo: TempoVerbal
): Promise<void> {
  if (tempoTipo !== "passado") return;
  for (let i = 0; i < resultado.length - 2; i++) {
    if (normalize(resultado[i]) !== "quando") continue;
    const pron = await getPronomeInfo(resultado[i + 1]);
    if (!pron) continue;
    const tokV = resultado[i + 2];
    let lema: string | null = null;
    if (isVerbShape(tokV)) {
      lema = tokV.trim().toLowerCase();
    } else {
      lema = detectarVerboPorDicionario([tokV]);
    }
    if (!lema) continue;
    const forma = conjugarTempo(lema, pron.pessoa, "passado");
    if (!forma) continue;
    const fl = forma.charAt(0).toLowerCase() + forma.slice(1);
    resultado[i + 2] = manterCaixa(tokV, fl);
  }
}


async function generoSubstantivo(subs: string): Promise<GeneroNominal | null> {
  const infoAtual = await loader.getWordInfo(subs);
  const catsAtual: string[] = Array.isArray(infoAtual?.cat) ? infoAtual.cat : [];
  const ehNucleoAtual = catsAtual.includes("SUBST") || catsAtual.includes("LUGAR");
  if (ehNucleoAtual) {
    const femAtual = catsAtual.includes("LUGAR_FEM");
    const mascAtual = catsAtual.includes("LUGAR_MASC");
    if (femAtual && !mascAtual) return "f";
    if (mascAtual && !femAtual) return "m";
  }

  const singular = singularRegular(subs);
  if (!singular) return null;
  const infoSing = await loader.getWordInfo(singular);
  const catsSing: string[] = Array.isArray(infoSing?.cat) ? infoSing.cat : [];
  const ehNucleoSing = catsSing.includes("SUBST") || catsSing.includes("LUGAR");
  if (!ehNucleoSing) return null;
  const fem = catsSing.includes("LUGAR_FEM");
  const masc = catsSing.includes("LUGAR_MASC");
  if (fem && !masc) return "f";
  if (masc && !fem) return "m";
  return null;
}

async function ehSubstantivoOuLugar(token: string): Promise<boolean> {
  const info = await loader.getWordInfo(token);
  const cats: string[] = Array.isArray(info?.cat) ? info.cat : [];
  return cats.includes("SUBST") || cats.includes("LUGAR");
}

function ajustarTokenPorGenero(token: string, genero: GeneroNominal): string | null {
  const n = normalize(token);
  for (const [masc, fem] of PARES_GENERO) {
    if (genero === "f" && n === masc) return manterCaixa(token, fem);
    if (genero === "m" && n === fem) return manterCaixa(token, masc);
  }
  return null;
}

function ajustarAdjetivoConhecidoPorGenero(token: string, genero: GeneroNominal): string | null {
  const n = normalize(token);
  for (const [masc, fem] of ADJETIVOS_BIFORMES) {
    const mascPl = `${masc}s`;
    const femPl = `${fem}s`;
    if (genero === "f" && n === masc) return manterCaixa(token, fem);
    if (genero === "m" && n === fem) return manterCaixa(token, masc);
    if (genero === "f" && n === mascPl) return manterCaixa(token, femPl);
    if (genero === "m" && n === femPl) return manterCaixa(token, mascPl);
  }
  return null;
}

function ajustarAdjetivoConhecidoPorNumero(token: string, numero: NumeroNominal): string | null {
  const n = normalize(token);
  for (const [masc, fem] of ADJETIVOS_BIFORMES) {
    const mascPl = `${masc}s`;
    const femPl = `${fem}s`;

    if (numero === "pl") {
      if (n === masc) return manterCaixa(token, mascPl);
      if (n === fem) return manterCaixa(token, femPl);
      continue;
    }

    if (n === mascPl) return manterCaixa(token, masc);
    if (n === femPl) return manterCaixa(token, fem);
  }
  return null;
}

function numeroEsperadoPeloContexto(resultado: string[], idxSubst: number): NumeroNominal | null {
  const prev = idxSubst - 1 >= 0 ? normalize(resultado[idxSubst - 1]) : "";
  if (TOKENS_PLURAL.has(prev)) return "pl";
  if (TOKENS_SINGULAR.has(prev)) return "sg";
  return null;
}

/**
 * Concordância nominal local e conservadora de número:
 * - Usa determinante/possessivo imediatamente anterior para inferir singular/plural.
 * - Ajusta substantivo com flexão regular básica.
 * - Ajusta adjetivo conhecido imediatamente após o substantivo.
 */
async function aplicarConcordanciaNumeroLocal(resultado: string[]): Promise<void> {
  for (let i = 0; i < resultado.length; i++) {
    if (!(await ehSubstantivoOuLugar(resultado[i]))) continue;
    const esperado = numeroEsperadoPeloContexto(resultado, i);
    if (!esperado) continue;

    const subst = esperado === "pl" ? pluralRegular(resultado[i]) : singularRegular(resultado[i]);
    if (subst) resultado[i] = subst;

    const iNext = i + 1;
    if (iNext < resultado.length) {
      const adj = ajustarAdjetivoConhecidoPorNumero(resultado[iNext], esperado);
      if (adj) resultado[iNext] = adj;
    }
  }
}

/**
 * Concordância nominal local e conservadora:
 * - Ajusta determinante/possessivo imediatamente antes do substantivo.
 * - Ajusta adjetivo biforme conhecido imediatamente após o substantivo.
 * Não tenta resolver dependências longas.
 */
async function aplicarConcordanciaGeneroLocal(resultado: string[]): Promise<void> {
  for (let i = 0; i < resultado.length; i++) {
    const genero = await generoSubstantivo(resultado[i]);
    if (!genero) continue;

    const iPrev = i - 1;
    if (iPrev >= 0) {
      const prev = ajustarTokenPorGenero(resultado[iPrev], genero);
      if (prev) resultado[iPrev] = prev;
    }

    const iNext = i + 1;
    if (iNext < resultado.length) {
      const next = ajustarAdjetivoConhecidoPorGenero(resultado[iNext], genero);
      if (next) resultado[iNext] = next;
    }
  }
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
    const gen = await generoSubstantivo(resultado[k + 1]);
    if (!gen) continue;
    if (gen === "f") {
      if (art === "a" || art === "o") resultado[k] = "à";
    } else {
      if (art === "a" || art === "o") resultado[k] = "ao";
    }
  }

  const j = vi + 1;
  if (j >= resultado.length) return;
  const gen = await generoSubstantivo(resultado[j]);
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
export type OpcoesCorrigir = {
  /** Índices em `tokens` que não entram na frase corrigida (ex.: segundo verbo em infinitivo → gerúndio incorporado ao auxiliar). */
  omitirIndicesTokens?: ReadonlySet<number>;
};

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
  tempoTipo: TempoVerbal,
  opcoes?: OpcoesCorrigir
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

  const omitir = opcoes?.omitirIndicesTokens;

  for (let i = 0; i < tokens.length; i++) {
    // Pula o token do sujeito se estivermos normalizando SVO (pois já o adicionamos no início)
    if (normalizeSVO && i === sujeito.tokenIndex) continue;

    if (omitir?.has(i)) continue;

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
  
  await flexionarQuandoSubordinadaNoPassado(resultado, tempoTipo);

  const viNoResultado = resultado.findIndex((t) => normalize(t) === normalize(verbLower));
  await aplicarRegenciaMovimentoLocais(resultado, viNoResultado, infinitivo);
  await aplicarConcordanciaNumeroLocal(resultado);
  await aplicarConcordanciaGeneroLocal(resultado);

  const out = resultado.join(" ").replace(/\s+/g, " ").trim();
  return out.charAt(0).toUpperCase() + out.slice(1);
}
