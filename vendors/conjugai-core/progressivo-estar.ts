/**
 * Perífrase progressiva em PT-BR: **estar** + gerúndio (telegrafia com segundo verbo em infinitivo).
 * Evita saídas como *estive brincar* — usa-se *estava brincando* no passado narrativo (imperfeito + gerúndio).
 */
import { conjugarTempo, gerundio, indiceDoVerboNaFrase, isVerbShape } from "./conjugador";
import type { TempoVerbal } from "./types";
import { normalize } from "../nlp-pt-br-lite/src/index";

/**
 * Tempo do auxiliar **estar** na progressiva: o macro `passado` (ex.: «ontem») mapeia para **imperfeito**,
 * não para pretérito perfeito (*estive*), para descrever processo em curso no passado.
 */
export function tempoConjugacaoEstarProgressivo(tempo: TempoVerbal): TempoVerbal {
  if (tempo === "passado") return "preterito_imperfeito";
  return tempo;
}

export type ResultadoProgressivoEstar = {
  conjugado: string;
  omitirIndices: Set<number>;
};

/**
 * Se o lema verbal principal é **estar** e segue-se (opcionalmente «a» e) outro infinitivo verbal,
 * devolve **forma do estar + gerúndio** e índices a omitir na reconstrução (infinitivo e «a»).
 */
export function resolverConjugacaoProgressivaEstar(
  tokens: string[],
  infinitivo: string,
  pessoa: number,
  tempo: TempoVerbal
): ResultadoProgressivoEstar | null {
  if (normalize(infinitivo) !== "estar") return null;

  const vi = indiceDoVerboNaFrase(tokens, infinitivo);
  if (vi < 0) return null;

  const omit: number[] = [];
  let j = vi + 1;

  if (j < tokens.length && normalize(tokens[j]) === "a") {
    omit.push(j);
    j++;
  }

  if (j >= tokens.length) return null;

  const tokSegundo = tokens[j];
  if (!isVerbShape(tokSegundo)) return null;

  const lema2 = tokSegundo.trim().toLowerCase();
  if (normalize(lema2) === "estar") return null;

  const ger = gerundio(lema2);
  if (!ger) return null;

  const tempoEstar = tempoConjugacaoEstarProgressivo(tempo);
  const formaEstar = conjugarTempo("estar", pessoa, tempoEstar);
  if (!formaEstar) return null;

  omit.push(j);
  return {
    conjugado: `${formaEstar} ${ger}`,
    omitirIndices: new Set(omit),
  };
}
