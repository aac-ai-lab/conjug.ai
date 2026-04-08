import type { TempoVerbal } from "./types";
export type InfoTempo = {
    tipo: TempoVerbal;
    rotulo: string;
};
/**
 * Deteta o tempo verbal baseado em tokens, marcadores e contexto opcional.
 * @param tokens Lista de palavras da frase.
 * @param tempoManual Tempo verbal fornecido manualmente (prioridade).
 */
export declare function detectarTempo(tokens: string[], tempoManual?: TempoVerbal): Promise<InfoTempo>;
