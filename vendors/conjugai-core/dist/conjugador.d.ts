import type { GeneroParticipio, NumeroParticipio, PessoaIndiceTabela, TempoVerbal } from "./types";
export declare function isVerbShape(s: string): boolean;
export declare function detectarVerboPorDicionario(tokens: string[]): string | null;
/**
 * Índice do token verbal na frase: infinitivo literal ou forma conjugada conhecida para esse lema.
 */
export declare function indiceDoVerboNaFrase(tokens: string[], infinitivo: string): number;
/**
 * Extrai o lema verbal: em telegráfico CAA prioriza **infinitivo** (-ar/-er/-ir) na frase,
 * exceto perífrase **ir + infinitivo** («vou viajar» → «ir»); depois flexão no léxico.
 */
export declare function extrairVerbo(tokens: string[]): string | null;
/**
 * @param verbo infinitivo (minúsculas)
 * @param pessoa 0–4 (pipeline CAA). Para paradigma completo com `vós`, usar `conjugarPessoaTabela` (0–5).
 * @param tempo ver verbo-data / MorphoBr
 */
export declare function conjugar(verbo: string, pessoa: number, tempo: TempoVerbal): string | null;
export declare const TEMPOS_SIMPLES: readonly TempoVerbal[];
/** Conjugação ampliada: tempos simples + compostos e formas não finitas. */
export declare function conjugarTempo(verbo: string, pessoa: number, tempo: TempoVerbal): string | null;
/** API para paradigmas completos de 6 pessoas: eu, tu, ele/ela, nós, vós, eles/elas/vocês. */
export declare function conjugarPessoaTabela(verbo: string, pessoa: PessoaIndiceTabela, tempo: TempoVerbal): string | null;
/** Gerúndio (forma única por lema), se existir no léxico. */
export declare function gerundio(verbo: string): string | null;
/** Particípio flexionado em género e número. */
export declare function participio(verbo: string, genero: GeneroParticipio, numero: NumeroParticipio): string | null;
/** Infinitivo como anotado no léxico (senão o próprio lema). */
export declare function infinitivoLexico(verbo: string): string;
