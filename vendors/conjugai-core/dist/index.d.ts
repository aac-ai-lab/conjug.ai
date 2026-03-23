import type { ResultadoAnalise } from "./types";
export type { GeneroParticipio, NumeroParticipio, PessoaIndiceTabela, ResultadoAnalise, TempoVerbal, } from "./types";
export { tokenize } from "./tokenizer";
export { detectarSujeito, detectarSujeitoComposto } from "./sujeito";
export { detectarTempo } from "./tempo";
export { conjugar, conjugarPessoaTabela, conjugarTempo, detectarVerboPorDicionario, extrairVerbo, gerundio, indiceDoVerboNaFrase, infinitivoLexico, isVerbShape, participio, } from "./conjugador";
export { corrigir } from "./corretor";
/**
 * Pipeline principal: tokenização → sujeito → tempo → verbo → conjugação → correção.
 */
export declare function analisarFrase(frase: string): ResultadoAnalise;
