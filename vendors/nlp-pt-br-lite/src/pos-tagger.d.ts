/**
 * Motor de busca léxica assíncrona com suporte a múltiplas fontes (ferramentas)
 * e divisão alfabética.
 */
export declare class LexiconLoader {
    private cache;
    private baseDir;
    private sources;
    constructor(baseDir?: string, sources?: string[]);
    setSources(sources: string[]): void;
    private getAlphabetKey;
    /**
     * Carrega e mescla dados de uma letra de todas as fontes disponíveis.
     */
    loadLetter(letter: string): Promise<Record<string, any>>;
    getWordInfo(token: string): Promise<any | null>;
}
export declare const loader: LexiconLoader;
export declare function normalize(s: string): string;
export declare function isBasicPronoun(token: string): boolean;
/**
 * Versão assíncrona das validações de POS
 */
export declare function isStopword(token: string): Promise<boolean>;
export declare function getPronomeInfo(token: string): Promise<any | null>;
export declare function isSubstantivoHumano(token: string): Promise<boolean>;
export declare function isTempoMarker(token: string): Promise<boolean>;
export declare function getRegenciaInfo(token: string): Promise<any | null>;
