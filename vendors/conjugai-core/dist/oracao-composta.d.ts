export type BlocoOracao = {
    tokens: string[];
    /** Conector antes da oração seguinte (null na última). */
    conectorDepois: string | null;
};
/**
 * Segmenta por coordenação (subordinação não entra).
 * Cada bloco tem `conectorDepois` preenchido exceto o último.
 */
export declare function segmentarOracoesCoordenadas(tokens: string[]): BlocoOracao[];
type SujeitoMin = {
    texto: string;
    implicito?: boolean;
};
/**
 * Junta as frases corrigidas de cada oração, preservando conectores e omitindo
 * pronome repetido quando dois blocos seguidos têm o mesmo sujeito implícito.
 */
export declare function juntarCorrecoesOracoes(partes: Array<{
    correcao: string;
    sujeito: SujeitoMin;
}>, conectores: Array<string | null>): string;
export {};
