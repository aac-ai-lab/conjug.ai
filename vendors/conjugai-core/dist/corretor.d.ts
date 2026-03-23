import type { TempoVerbal } from "./types";
/**
 * Reconstrói a frase a partir dos **tokens originais**:
 * substitui só a forma verbal pelo `conjugado` e, se o sujeito for implícito, antecede o pronome.
 * Sujeito composto (ex.: «Mamãe e eu …») mantém-se na superfície — só o verbo é flexionado.
 * Não descarta complementos.
 */
export declare function corrigir(tokens: string[], sujeito: {
    texto: string;
    pessoa: number;
    implicito?: boolean;
    composto?: boolean;
}, infinitivo: string, conjugado: string, _tempoTipo: TempoVerbal): string;
