import type { TempoVerbal } from "./types";
export type InfoTempo = {
    tipo: TempoVerbal;
    rotulo: string;
};
/**
 * *ontem* → passado.
 * *amanhã* → futuro, exceto quando a frase já tem perífrase **ir + infinitivo** no presente
 * (ex.: «vou viajar amanhã»), caso em que o primeiro verbo permanece no presente.
 * Caso contrário → presente.
 */
export declare function detectarTempo(tokens: string[]): InfoTempo;
