import {
  CHAVES_PARADIGMA_CINCO,
  type EntradaVerbo,
  VERBOS,
} from "./data/verbos-data";
import type { GeneroParticipio, NumeroParticipio, PessoaIndiceTabela, TempoVerbal } from "./types";

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
 * Formas de presente de «poder» — «posso» colide no léxico com o verbo «possar» (forma homógrafa).
 */
const FORMAS_PRESENTE_PODER = new Set(
  ["posso", "podes", "pode", "podemos", "podem"].map((s) => normalizarToken(s))
);

/** Presente de «ter» (normalizado) — ignorar o «que» de *ter que* ao localizar subordinação. */
const FORMAS_PRESENTE_TER_SUB = new Set(
  ["tenho", "tens", "tem", "temos", "têm"].map((s) => normalizarToken(s))
);

/**
 * Índice do último «que» que **não** é locução *ter que* / *tenho que*…
 * Permite priorizar o infinitivo dependente (*Ele dizer que eles falar* → *falar*).
 */
function ultimoQueSubordinante(tokens: string[]): number {
  const lower = tokens.map(normalizarToken);
  let last = -1;
  for (let i = 0; i < lower.length; i++) {
    if (lower[i] !== "que") continue;
    const prev = i > 0 ? lower[i - 1] : "";
    if (prev === "ter" || FORMAS_PRESENTE_TER_SUB.has(prev)) continue;
    last = i;
  }
  return last;
}

function primeiroInfinitivoDepoisDe(tokens: string[], idx: number): string | null {
  for (let i = idx + 1; i < tokens.length; i++) {
    if (isVerbShape(tokens[i])) return tokens[i].trim().toLowerCase();
  }
  return null;
}

/** Lema do token: léxico primeiro, senão infinitivo por sufixo (-ar/-er/-ir/-pôr). */
function lemmaDoToken(t: string): string | null {
  const nt = normalizarToken(t);
  if (FORMAS_PRESENTE_PODER.has(nt)) return "poder";
  const via = detectarVerboPorDicionario([t]);
  if (via) return via;
  if (isVerbShape(t)) return t.trim().toLowerCase();
  return null;
}

/**
 * Locuções verbais frequentes em telegrafia (PT-BR): núcleo flexionado + partícula + não-finito.
 * Ex.: «tenho que comer» → lema **ter** (não «comer»); «começo a trabalhar» → **começar**.
 */
export function detectarLocucaoVerbalHeadLemma(tokens: string[]): string | null {
  const n = tokens.length;
  for (let i = 0; i < n; i++) {
    const lem = lemmaDoToken(tokens[i]);
    if (!lem) continue;

    const next1 = i + 1 < n ? normalizarToken(tokens[i + 1]) : "";
    const segVerbo = i + 2 < n ? lemmaDoToken(tokens[i + 2]) : null;
    const segDireto = i + 1 < n ? lemmaDoToken(tokens[i + 1]) : null;

    if (lem === "ter" && i + 2 < n && (next1 === "que" || next1 === "de") && segVerbo) {
      return "ter";
    }

    if ((lem === "poder" || lem === "dever") && i + 1 < n && segDireto) {
      return lem;
    }

    if (lem === "estar" && i + 2 < n && next1 === "a" && segVerbo) {
      return "estar";
    }

    if (
      (lem === "começar" || lem === "continuar" || lem === "voltar") &&
      i + 2 < n &&
      next1 === "a" &&
      segVerbo
    ) {
      return lem;
    }

    if (
      (lem === "acabar" || lem === "parar" || lem === "deixar") &&
      i + 2 < n &&
      next1 === "de" &&
      segVerbo
    ) {
      return lem;
    }

    if (lem === "pretender" && i + 2 < n && next1 === "a" && segVerbo) {
      return "pretender";
    }
  }
  return null;
}

/**
 * Extrai o lema verbal: em telegráfico CAA prioriza **infinitivo** (-ar/-er/-ir) na frase,
 * exceto perífrase **ir + infinitivo** («vou viajar» → «ir»), locuções em `detectarLocucaoVerbalHeadLemma`,
 * e — se houver subordinação com **que** (que não seja *ter que*) — o **primeiro infinitivo após esse que**
 * («Ele dizer que eles falar» → «falar»); depois flexão no léxico.
 */
export function extrairVerbo(tokens: string[]): string | null {
  const lower = tokens.map(normalizarToken);
  const primeiro = lower[0] ?? "";
  const temInfinitivoDepois = tokens.slice(1).some((t) => isVerbShape(t));
  if (temInfinitivoDepois && FORMAS_PRESENTE_IR.has(primeiro)) {
    return "ir";
  }

  const loc = detectarLocucaoVerbalHeadLemma(tokens);
  if (loc) return loc;

  const qi = ultimoQueSubordinante(tokens);
  if (qi >= 0) {
    const apos = primeiroInfinitivoDepoisDe(tokens, qi);
    if (apos) return apos;
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
 * Passado regular (Pretérito Perfeito): -AR / -ER / -IR.
 */
function conjugarRegularPassado(infinitivo: string, pessoa: number): string | null {
  const v = infinitivo.toLowerCase().trim();
  if (v.endsWith("ar")) {
    const p = v.slice(0, -2);
    const suf = ["ei", "aste", "ou", "amos", "aram"];
    return p + suf[pessoa];
  }
  if (v.endsWith("er")) {
    const p = v.slice(0, -2);
    const suf = ["i", "este", "eu", "emos", "eram"];
    return p + suf[pessoa];
  }
  if (v.endsWith("ir")) {
    const p = v.slice(0, -2);
    const suf = ["i", "iste", "iu", "imos", "iram"];
    return p + suf[pessoa];
  }
  return null;
}

/**
 * Futuro do Presente regular: infinitivo + sufixos.
 */
function conjugarRegularFuturo(infinitivo: string, pessoa: number): string | null {
  const v = infinitivo.toLowerCase().trim();
  const sufAcentuados = ["ei", "ás", "á", "emos", "ão"];
  return v + sufAcentuados[pessoa];
}

/**
 * @param verbo infinitivo (minúsculas)
 * @param pessoa 0–4 (pipeline CAA). Para paradigma completo com `vós`, usar `conjugarPessoaTabela` (0–5).
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
  if (tempo === "passado") {
    return conjugarRegularPassado(v, pessoa);
  }
  if (tempo === "futuro") {
    return conjugarRegularFuturo(v, pessoa);
  }

  return null;
}

export const TEMPOS_SIMPLES: readonly TempoVerbal[] = [
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

const TER_VOS: Partial<Record<TempoVerbal, string>> = {
  presente: "tendes",
  futuro: "tereis",
  passado: "tivestes",
  preterito_imperfeito: "tínheis",
  preterito_mais_que_perfeito: "tivéreis",
  condicional: "teríeis",
  subjuntivo_presente: "tenhais",
  subjuntivo_imperfeito: "tivésseis",
  subjuntivo_futuro: "tiverdes",
  imperativo: "tende",
  infinitivo_pessoal: "terdes",
  infinitivo: "ter",
  gerundio: "tendo",
  participio: "tido",
};

function radicalVerbo(v: string): string | null {
  if (v.endsWith("ar") || v.endsWith("er") || v.endsWith("ir")) return v.slice(0, -2);
  return null;
}

function conjugarVosRegular(verbo: string, tempo: TempoVerbal): string | null {
  const v = verbo.toLowerCase().trim();
  const r = radicalVerbo(v);
  if (!r) return null;

  if (tempo === "presente") {
    if (v.endsWith("ar")) return r + "ais";
    if (v.endsWith("er")) return r + "eis";
    if (v.endsWith("ir")) return r + "is";
  }
  if (tempo === "futuro") return v + "eis";
  if (tempo === "passado") {
    if (v.endsWith("ar")) return r + "astes";
    if (v.endsWith("er")) return r + "estes";
    if (v.endsWith("ir")) return r + "istes";
  }
  if (tempo === "preterito_imperfeito") {
    if (v.endsWith("ar")) return r + "áveis";
    return r + "íeis";
  }
  if (tempo === "preterito_mais_que_perfeito") {
    if (v.endsWith("ar")) return r + "áreis";
    if (v.endsWith("er")) return r + "êreis";
    if (v.endsWith("ir")) return r + "íreis";
  }
  if (tempo === "condicional") return v + "íeis";
  if (tempo === "subjuntivo_presente") {
    if (v.endsWith("ar")) return r + "eis";
    return r + "ais";
  }
  if (tempo === "subjuntivo_imperfeito") return r + "sseis";
  if (tempo === "subjuntivo_futuro") return v + "des";
  if (tempo === "imperativo") {
    if (v.endsWith("ar")) return r + "ai";
    if (v.endsWith("er")) return r + "ei";
    if (v.endsWith("ir")) return r + "i";
  }
  if (tempo === "infinitivo_pessoal") return v + "des";
  return null;
}

function conjugarVos(verbo: string, tempo: TempoVerbal): string | null {
  const v = verbo.toLowerCase().trim();
  if (v === "ter") return TER_VOS[tempo] ?? null;
  if (tempo === "infinitivo") return infinitivoLexico(v);
  if (tempo === "gerundio") return gerundio(v);
  if (tempo === "participio") return participio(v, "m", "sg");
  const tempoAux = AUXILIAR_TER_POR_TEMPO[tempo];
  if (tempoAux) {
    const aux = TER_VOS[tempoAux] ?? null;
    const part = participio(v, "m", "sg");
    if (!aux || !part) return null;
    return `${aux} ${part}`;
  }

  const entry = verbos[v];
  const arr = entry ? paradigmaCinco(entry, tempo) : undefined;
  if (arr && arr.length >= 6 && arr[4]) return arr[4]!;

  return conjugarVosRegular(v, tempo);
}

const AUXILIAR_TER_POR_TEMPO: Partial<Record<TempoVerbal, TempoVerbal>> = {
  preterito_perfeito_composto: "presente",
  preterito_mais_que_perfeito_composto: "preterito_imperfeito",
  preterito_mais_que_perfeito_anterior: "preterito_mais_que_perfeito",
  futuro_composto: "futuro",
  futuro_do_preterito_composto: "condicional",
  subjuntivo_preterito_perfeito: "subjuntivo_presente",
  subjuntivo_preterito_mais_que_perfeito: "subjuntivo_imperfeito",
  subjuntivo_futuro_composto: "subjuntivo_futuro",
  infinitivo_pessoal_composto: "infinitivo_pessoal",
};

/** Conjugação ampliada: tempos simples + compostos e formas não finitas. */
export function conjugarTempo(verbo: string, pessoa: number, tempo: TempoVerbal): string | null {
  if (tempo === "infinitivo") return infinitivoLexico(verbo);
  if (tempo === "gerundio") return gerundio(verbo);
  if (tempo === "participio") return participio(verbo, "m", "sg");

  const tempoAux = AUXILIAR_TER_POR_TEMPO[tempo];
  if (tempoAux) {
    const aux = conjugar("ter", pessoa, tempoAux);
    const part = participio(verbo, "m", "sg");
    if (!aux || !part) return null;
    return `${aux} ${part}`;
  }

  return conjugar(verbo, pessoa, tempo);
}

/** API para paradigmas completos de 6 pessoas: eu, tu, ele/ela, nós, vós, eles/elas/vocês. */
export function conjugarPessoaTabela(
  verbo: string,
  pessoa: PessoaIndiceTabela,
  tempo: TempoVerbal
): string | null {
  if (pessoa === 4) return conjugarVos(verbo, tempo);
  const pessoaCore = pessoa === 5 ? 4 : pessoa;
  return conjugarTempo(verbo, pessoaCore, tempo);
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
