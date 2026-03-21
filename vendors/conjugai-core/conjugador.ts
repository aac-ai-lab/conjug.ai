import { VERBOS } from "./data/verbos-data";
import type { TempoVerbal } from "./types";

const verbos = VERBOS;

function normalizarToken(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Mapa forma normalizada → infinitivo (todas as entradas de VERBOS). */
let cacheFormaParaInfinitivo: Map<string, string> | null = null;

function getIndiceFormaParaInfinitivo(): Map<string, string> {
  if (cacheFormaParaInfinitivo) return cacheFormaParaInfinitivo;
  const m = new Map<string, string>();
  for (const infinitivo of Object.keys(verbos)) {
    m.set(normalizarToken(infinitivo), infinitivo);
    const entry = verbos[infinitivo];
    for (const col of ["presente", "futuro", "passado"] as const) {
      for (const forma of entry[col]) {
        if (forma) m.set(normalizarToken(forma), infinitivo);
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
export function detectarVerboPorDicionario(tokens: string[]): string | null {
  const m = getIndiceFormaParaInfinitivo();
  for (const t of tokens) {
    const lemma = m.get(normalizarToken(t));
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

/**
 * Extrai o lema verbal: primeiro dicionário (infinitivo ou flexão conhecida), depois heurística de sufixo.
 */
export function extrairVerbo(tokens: string[]): string | null {
  const viaDict = detectarVerboPorDicionario(tokens);
  if (viaDict) return viaDict;
  for (const t of tokens) {
    if (isVerbShape(t)) {
      return t.trim().toLowerCase();
    }
  }
  return null;
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
 * @param tempo presente | futuro | passado
 */
export function conjugar(verbo: string, pessoa: number, tempo: TempoVerbal): string | null {
  const v = verbo.toLowerCase().trim();
  if (pessoa < 0 || pessoa > 4) return null;

  const entry = verbos[v];
  if (entry) {
    const col = tempo === "futuro" ? "futuro" : tempo === "passado" ? "passado" : "presente";
    const arr = entry[col];
    if (arr && arr[pessoa]) return arr[pessoa];
    return null;
  }

  if (tempo === "presente") {
    return conjugarRegularPresente(v, pessoa);
  }

  return null;
}
