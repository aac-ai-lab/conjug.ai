/**
 * Motor de busca léxica assíncrona com divisão alfabética.
 * Carrega arquivos JSON sob demanda (lazy-loading) e mantém cache em memória.
 */
export class LexiconLoader {
  private cache: Map<string, Record<string, any>> = new Map();
  private basePath: string = "vendors/nlp-pt-br-lite/src/data/alphabet"; // Padrão para local node/build

  constructor(basePath?: string) {
    if (basePath) this.basePath = basePath;
  }

  setBasePath(path: string) {
    this.basePath = path;
  }

  private getAlphabetKey(token: string): string {
    const firstChar = token.charAt(0).toLowerCase();
    // Normalizar para a-z simples
    const normalized = firstChar.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return /^[a-z]$/.test(normalized) ? normalized : "others";
  }

  async loadLetter(letter: string): Promise<Record<string, any>> {
    const cacheKey = letter.toLowerCase();
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const url = `${this.basePath}/${cacheKey}.json`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Lexicon file ${url} not found`);
      const data = await response.json();
      this.cache.set(cacheKey, data);
      return data;
    } catch (e) {
      console.warn(`Could not load lexicon for letter ${cacheKey}:`, e);
      this.cache.set(cacheKey, {}); // Cache vazio para evitar retentativas infinitas
      return {};
    }
  }

  async getWordInfo(token: string): Promise<any | null> {
    const n = token.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const letter = this.getAlphabetKey(n);
    const data = await this.loadLetter(letter);
    return data[n] || null;
  }
}

export const loader = new LexiconLoader();

export function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** 
 * Versão assíncrona das validações de POS 
 */

export async function isStopword(token: string): Promise<boolean> {
  const info = await loader.getWordInfo(token);
  return info?.cat?.includes("STOPWORD") || false;
}

export async function getPronomeInfo(token: string): Promise<any | null> {
  const info = await loader.getWordInfo(token);
  if (info?.cat?.includes("PRONOME")) {
    return { texto: info.w || token, pessoa: info.p };
  }
  return null;
}

export async function isSubstantivoHumano(token: string): Promise<boolean> {
  const info = await loader.getWordInfo(token);
  return info?.cat?.includes("PERSON") || info?.cat?.includes("SUBST_HUMANO") || false;
}

export async function isTempoMarker(token: string): Promise<boolean> {
  const info = await loader.getWordInfo(token);
  return info?.cat?.includes("TEMPO") || false;
}

export async function getRegenciaInfo(token: string): Promise<any | null> {
  const info = await loader.getWordInfo(token);
  return info?.reg || null;
}
