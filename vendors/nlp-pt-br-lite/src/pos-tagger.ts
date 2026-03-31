/**
 * Motor de busca léxica assíncrona com suporte a múltiplas fontes (ferramentas) 
 * e divisão alfabética.
 */
export class LexiconLoader {
  private cache: Map<string, Record<string, any>> = new Map();
  private baseDir: string = "assets/nlp/data";
  private sources: string[] = ["legacy", "wordnet", "verbnet"];

  constructor(baseDir?: string, sources?: string[]) {
    if (baseDir) this.baseDir = baseDir;
    if (sources) this.sources = sources;
  }

  setSources(sources: string[]) {
    this.sources = sources;
  }

  private getAlphabetKey(token: string): string {
    const firstChar = token.charAt(0).toLowerCase();
    const normalized = firstChar.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return /^[a-z]$/.test(normalized) ? normalized : "others";
  }

  /**
   * Carrega e mescla dados de uma letra de todas as fontes disponíveis.
   */
  async loadLetter(letter: string): Promise<Record<string, any>> {
    const cacheKey = letter.toLowerCase();
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const mergedData: Record<string, any> = {};

    // Tenta carregar de cada fonte (ferramenta)
    for (const source of this.sources) {
      try {
        const url = `${this.baseDir}/${source}/${cacheKey}.json`;
        const response = await fetch(url);
        if (response.ok) {
          const sourceData = await response.json();
          // Mescla dados (prioridade para a primeira fonte se houver conflito, 
          // mas idealmente as fontes são complementares)
          for (const [word, info] of Object.entries(sourceData)) {
            if (!mergedData[word]) {
              mergedData[word] = info;
            } else {
              // Se a palavra já existe, mescla as categorias (cat)
              const existing = mergedData[word];
              const newData = info as any;
              if (newData.cat && existing.cat) {
                existing.cat = Array.from(new Set([...existing.cat, ...newData.cat]));
              }
              // Atualiza regência ou pessoa se a nova fonte trouxer algo novo
              if (newData.reg && !existing.reg) existing.reg = newData.reg;
              if (newData.p !== undefined && existing.p === undefined) existing.p = newData.p;
            }
          }
        }
      } catch (e) {
        // Ignora erros de rede para fontes específicas que podem não existir (ex: z.json em verbnet)
        // console.debug(`Source ${source} not found for letter ${cacheKey}`);
      }
    }

    this.cache.set(cacheKey, mergedData);
    return mergedData;
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
