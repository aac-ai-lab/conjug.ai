import type { ResultadoAnalise, TempoVerbal } from "./types";
export type { GeneroParticipio, NumeroParticipio, PessoaIndice, PessoaIndiceTabela, InfoSujeitoAnalise, ResultadoAnalise, ResultadoAnaliseClausula, TempoVerbal, } from "./types";
export { tokenize } from "../nlp-pt-br-lite/src/index";
export { detectarSujeito } from "./sujeito";
export { detectarTempo } from "./tempo";
export { conjugar, conjugarPessoaTabela, conjugarTempo, detectarVerboPorDicionario, extrairVerbo, gerundio, indiceDoVerboNaFrase, infinitivoLexico, isVerbShape, participio, } from "./conjugador";
export { corrigir } from "./corretor";
export { segmentarOracoesCoordenadas } from "./oracao-composta";
/**
 * Pipeline principal: tokenização → sujeito → tempo → verbo → conjugação → correção.
 * Orações coordenadas (por «e», «mas», «porém», «então») são segmentadas e analisadas em sequência.
 * @param frase Texto bruto para processar.
 * @param contexto Opções manuais para guiar a análise (ex: tempo verbal).
 */
export declare function analisarFrase(frase: string, contexto?: {
    tempo?: TempoVerbal;
}): Promise<ResultadoAnalise>;
