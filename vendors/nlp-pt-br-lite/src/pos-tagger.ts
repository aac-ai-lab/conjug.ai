import dataSujeito from "./data/pos-sujeito.json";
import dataFuncionais from "./data/pos-funcionais.json";
import dataTempo from "./data/pos-tempo.json";
import dataRegencia from "./data/regencia.json";

export type PosCategory = "PRONOME" | "SUBST_HUMANO" | "STOPWORD" | "TEMPO" | "OBJETO";

export function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function isStopword(token: string): boolean {
  const n = normalize(token);
  return [
    ...dataFuncionais.artigos,
    ...dataFuncionais.preposicoes,
    ...dataFuncionais.conclusoes,
    ...dataFuncionais.outras_funcionais
  ].includes(n);
}

export function getPronomeInfo(token: string) {
  const n = normalize(token);
  return (dataSujeito.pronomes as any)[n] || null;
}

export function isSubstantivoHumano(token: string): boolean {
  const n = normalize(token);
  return dataSujeito.titulos.includes(n);
}

export function isTempoMarker(token: string): boolean {
  const n = normalize(token);
  return [
    ...dataTempo.passado,
    ...dataTempo.presente,
    ...dataTempo.futuro,
    ...dataTempo.imperfeito,
    ...dataTempo.subjuntivo
  ].includes(n);
}

export const DATA_SUJEITO = dataSujeito;
export const DATA_FUNCIONAL = dataFuncionais;
export const DATA_TEMPO = dataTempo;
export const DATA_REGENCIA = dataRegencia;
