import type { TempoVerbal } from "../types";
/** Particípio (PT): masculino/feminino × singular/plural. */
export type ParticipioEntrada = {
    m: {
        sg: string;
        pl: string;
    };
    f: {
        sg: string;
        pl: string;
    };
};
/**
 * Entrada por lema (infinitivo). `presente` é obrigatório no léxico gerado;
 * restantes chaves vêm do MorphoBr quando o paradigma está completo (5/5).
 */
export type EntradaVerbo = {
    presente: string[];
    futuro?: string[];
    passado?: string[];
    preterito_imperfeito?: string[];
    preterito_mais_que_perfeito?: string[];
    condicional?: string[];
    subjuntivo_presente?: string[];
    subjuntivo_imperfeito?: string[];
    subjuntivo_futuro?: string[];
    imperativo?: string[];
    infinitivo_pessoal?: string[];
    gerundio?: string;
    /** Forma canónica do infinitivo (pode coincidir com a chave). */
    infinitivo?: string;
    participio?: ParticipioEntrada;
};
/** Chaves com array de 5 pessoas (para índice forma→lema e conjugar). */
export declare const CHAVES_PARADIGMA_CINCO: readonly (keyof EntradaVerbo)[];
/** Subconjunto usado por `detectarTempo` / pipeline CAA. */
export declare const TEMPOS_PIPELINE_CAA: readonly TempoVerbal[];
export declare const VERBOS: Record<string, EntradaVerbo>;
