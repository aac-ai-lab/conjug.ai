import {
  CHAVES_PARADIGMA_CINCO,
  type EntradaVerbo,
  VERBOS,
} from "./data/verbos-data";
import type { GeneroParticipio, NumeroParticipio, TempoVerbal } from "./types";

const verbos = VERBOS;

function normalizarToken(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Mapa forma normalizada → infinitivo (todas as entradas e flexões conhecidas). */
let cacheFormaParaInfinitivo: Map<string, string> | null = null;

function getIndiceFormaParaInfinitivo(): Map<string, string> {
  if (cacheFormaParaInfinitivo) return cacheFormaParaInfinitivo;
  const m = new Map<string, string>();
  for (const infinitivo of Object.keys(verbos)) {
    m.set(normalizarToken(infinitivo), infinitivo);
    const entry = verbos[infinitivo];
    if (entry.infinitivo) {
      m.set(normalizarToken(entry.infinitivo), infinitivo);
    }
    for (const col of CHAVES_PARADIGMA_CINCO) {
      const arr = entry[col];
      if (!Array.isArray(arr)) continue;
      for (const forma of arr) {
        if (forma) m.set(normalizarToken(forma), infinitivo);
      }
    }
    if (entry.gerundio) {
      m.set(normalizarToken(entry.gerundio), infinitivo);
    }
    const p = entry.participio;
    if (p) {
      for (const g of ["m", "f"] as const) {
        for (const n of ["sg", "pl"] as const) {
          const f = p[g][n];
          if (f) m.set(normalizarToken(f), infinitivo);
        }
      }
    }
  }
  cacheFormaParaInfinitivo = m;
  return m;
}

export function isVerbShape(s: string): boolean {
  return /(?:[aei]|pô)r$/i.test(String(s).trim());
}

/**
 * Nível 1: procura o primeiro token cuja forma (infinitivo ou flexão) existe no léxico `VERBOS`.
 * Em caso de colisão (duas formas iguais de verbos diferentes), prevalece a ordem de inserção no mapa.
 */
/** Não usar estas formas para resolver lema (pronome, conector, artigos comuns). */
const IGNORAR_FORMA_PARA_LEMA = new Set(
  [
    "eu",
    "tu",
    "ele",
    "ela",
    "nos",
    "nós",
    "eles",
    "elas",
    "mim",
    "ti",
    "si",
    "me",
    "te",
    "se",
    "lhe",
    "lhes",
    "o",
    "a",
    "os",
    "as",
    "um",
    "uma",
    "de",
    "do",
    "da",
    "dos",
    "das",
    "em",
    "no",
    "na",
    "por",
    "com",
    "sem",
    "sobre",
    "e",
  ].map((s) => normalizarToken(s))
);

export function detectarVerboPorDicionario(tokens: string[]): string | null {
  const m = getIndiceFormaParaInfinitivo();
  for (const t of tokens) {
    const nt = normalizarToken(t);
    if (nt.length < 2 || IGNORAR_FORMA_PARA_LEMA.has(nt)) continue;
    const lemma = m.get(nt);
    if (lemma) return lemma;
  }
  return null;
}

/**
 * Índice do token verbal na frase: infinitivo literal ou forma conjugada conhecida para esse lema.
 */
export function indiceDoVerboNaFrase(tokens: string[], infinitivo: string): number {
  const inf = infinitivo.toLowerCase().trim();
  const m = getIndiceFormaParaInfinitivo();
  for (let i = 0; i < tokens.length; i++) {
    const nt = normalizarToken(tokens[i]);
    if (nt === normalizarToken(inf)) return i;
    if (m.get(nt) === inf) return i;
  }
  return -1;
}

/** Presente do indicativo de «ir» (normalizado): perífrase «vou viajar» → lema «ir». */
const FORMAS_PRESENTE_IR = new Set(
  ["vou", "vais", "vai", "vamos", "vao", "vão"].map((s) => normalizarToken(s))
);

/**
 * Extrai o lema verbal: em telegráfico CAA prioriza **infinitivo** (-ar/-er/-ir) na frase,
 * exceto perífrase **ir + infinitivo** («vou viajar» → «ir»); depois flexão no léxico.
 */
export function extrairVerbo(tokens: string[]): string | null {
  const lower = tokens.map(normalizarToken);
  const primeiro = lower[0] ?? "";
  const temInfinitivoDepois = tokens.slice(1).some((t) => isVerbShape(t));
  if (temInfinitivoDepois && FORMAS_PRESENTE_IR.has(primeiro)) {
    return "ir";
  }

  for (const t of tokens) {
    if (isVerbShape(t)) {
      return t.trim().toLowerCase();
    }
  }
  return detectarVerboPorDicionario(tokens);
}

function paradigmaCinco(entry: EntradaVerbo, tempo: TempoVerbal): string[] | undefined {
  const arr = entry[tempo as keyof EntradaVerbo];
  return Array.isArray(arr) ? arr : undefined;
}

/**
 * Presente regular: -AR / -ER / -IR (5 pessoas: eu, tu, ele, nós, eles).
 */
function conjugarRegularPresente(infinitivo: string, pessoa: number): string | null {
  const v = infinitivo.toLowerCase().trim();
  if (v.endsWith("ar")) {
    const p = v.slice(0, -2);
    const suf = ["o", "as", "a", "amos", "am"];
    return p + suf[pessoa];
  }
  if (v.endsWith("er")) {
    const p = v.slice(0, -2);
    const suf = ["o", "es", "e", "emos", "em"];
    return p + suf[pessoa];
  }
  if (v.endsWith("ir")) {
    const p = v.slice(0, -2);
    const suf = ["o", "es", "e", "imos", "em"];
    return p + suf[pessoa];
  }
  if (/p[oô]r$/i.test(v)) {
    return null;
  }
  return null;
}

/**
 * @param verbo infinitivo (minúsculas)
 * @param pessoa 0–4
 * @param tempo ver verbo-data / MorphoBr
 */
export function conjugar(verbo: string, pessoa: number, tempo: TempoVerbal): string | null {
  const v = verbo.toLowerCase().trim();
  if (pessoa < 0 || pessoa > 4) return null;

  const entry = verbos[v];
  if (entry) {
    const arr = paradigmaCinco(entry, tempo);
    if (arr && arr[pessoa]) return arr[pessoa]!;
    return null;
  }

  if (tempo === "presente") {
    return conjugarRegularPresente(v, pessoa);
  }

  return null;
}

/** Gerúndio (forma única por lema), se existir no léxico. */
export function gerundio(verbo: string): string | null {
  const v = verbo.toLowerCase().trim();
  const g = verbos[v]?.gerundio;
  return g && g.length > 0 ? g : null;
}

/** Particípio flexionado em género e número. */
export function participio(
  verbo: string,
  genero: GeneroParticipio,
  numero: NumeroParticipio
): string | null {
  const v = verbo.toLowerCase().trim();
  const p = verbos[v]?.participio;
  if (!p) return null;
  const f = p[genero][numero];
  return f && f.length > 0 ? f : null;
}

/** Infinitivo como anotado no léxico (senão o próprio lema). */
export function infinitivoLexico(verbo: string): string {
  const v = verbo.toLowerCase().trim();
  const e = verbos[v];
  if (e?.infinitivo && e.infinitivo.length > 0) return e.infinitivo;
  return v;
}
