/**
 * Mapeamento UniMorph → chamadas ao núcleo (`conjugar` / `conjugarPessoaTabela` / formas não finitas).
 * Referência dos tags: https://unimorph.github.io/schema — dados `por` em texto tabular (lema, forma, features).
 *
 * Não substitui MorphoBr: serve apenas para validação cruzada opcional.
 */
import {
  conjugarPessoaTabela,
  conjugarTempo,
  gerundio,
  participio,
} from "../../conjugador";
import type { PessoaIndiceTabela, TempoVerbal } from "../../types";

export type UnimorphConjugarCase =
  | { kind: "finite"; tempo: TempoVerbal; pessoa: PessoaIndiceTabela }
  | { kind: "gerundio" }
  | { kind: "participio"; genero: "m" | "f"; numero: "sg" | "pl" }
  | { kind: "infinitivo" }
  | { kind: "infinitivo_pessoal"; pessoa: PessoaIndiceTabela }
  | { kind: "skip"; reason: string };

function uniMorphPersonToTabela(person: string, number: string): PessoaIndiceTabela | null {
  if (person === "1" && number === "SG") return 0;
  if (person === "2" && number === "SG") return 1;
  if (person === "3" && number === "SG") return 2;
  if (person === "1" && number === "PL") return 3;
  if (person === "2" && number === "PL") return 4;
  if (person === "3" && number === "PL") return 5;
  return null;
}

/** Resto da linha de features depois de pessoa+número (ex.: IND;PRS, IMP;POS). */
function tailToTempo(tail: string[]): TempoVerbal | null {
  const s = tail.join(";");
  switch (s) {
    case "IND;PRS":
      return "presente";
    case "IND;FUT":
      return "futuro";
    case "IND;PST;PFV":
      return "passado";
    case "IND;PST;IPFV":
      return "preterito_imperfeito";
    case "IND;PST;PRF":
      return "preterito_mais_que_perfeito";
    case "SBJV;PRS":
      return "subjuntivo_presente";
    case "SBJV;PST;IPFV":
      return "subjuntivo_imperfeito";
    case "SBJV;FUT":
      return "subjuntivo_futuro";
    case "COND":
      return "condicional";
    case "IMP;POS":
      return "imperativo";
    default:
      return null;
  }
}

export function parseUnimorphFeatures(features: string): UnimorphConjugarCase {
  const parts = features.split(";").filter((x) => x.length > 0);
  const head = parts[0];
  if (!head) return { kind: "skip", reason: "empty_features" };

  if (head === "V.PTCP") {
    if (parts[1] === "PRS") return { kind: "gerundio" };
    const hasMASC = parts.includes("MASC");
    const hasFEM = parts.includes("FEM");
    const gen = hasMASC ? ("m" as const) : hasFEM ? ("f" as const) : null;
    const numero = parts.includes("PL") ? ("pl" as const) : parts.includes("SG") ? ("sg" as const) : null;
    if (!gen || !numero) return { kind: "skip", reason: "participio_sem_genero_numero" };
    if (!parts.includes("PST")) return { kind: "skip", reason: "participio_nao_pst" };
    return { kind: "participio", genero: gen, numero };
  }

  if (head !== "V") return { kind: "skip", reason: "nao_verbo" };

  if (parts.includes("NFIN")) {
    const i = parts.indexOf("NFIN");
    const before = parts.slice(1, i);
    if (before.length === 0) return { kind: "infinitivo" };
    if (before[0] === "1" && before[1] === "SG") return { kind: "infinitivo" };
    if (before[0] === "3" && before[1] === "SG") return { kind: "infinitivo" };
    const person = before[0];
    const number = before[1];
    const pessoa = uniMorphPersonToTabela(person, number);
    if (pessoa === null) return { kind: "skip", reason: "nfin_pessoa_invalida" };
    return { kind: "infinitivo_pessoal", pessoa };
  }

  if (parts.includes("IMP") && parts.includes("NEG")) {
    return { kind: "skip", reason: "imperativo_negativo" };
  }

  const pIdx = parts.findIndex((x) => x === "1" || x === "2" || x === "3");
  if (pIdx < 0) return { kind: "skip", reason: "pessoa_ausente" };
  const person = parts[pIdx];
  const number = parts[pIdx + 1];
  if (number !== "SG" && number !== "PL") return { kind: "skip", reason: "numero_ausente" };

  const pessoa = uniMorphPersonToTabela(person, number);
  if (pessoa === null) return { kind: "skip", reason: "pessoa_invalida" };

  const tempo = tailToTempo(parts.slice(pIdx + 2));
  if (!tempo) return { kind: "skip", reason: "tempo_nao_mapeado" };

  return { kind: "finite", tempo, pessoa };
}

export function predictConjugaiForm(lemma: string, parsed: UnimorphConjugarCase): string | null {
  if (parsed.kind === "skip") return null;

  switch (parsed.kind) {
    case "finite":
      return conjugarPessoaTabela(lemma, parsed.pessoa, parsed.tempo);
    case "gerundio":
      return gerundio(lemma);
    case "participio":
      return participio(lemma, parsed.genero, parsed.numero);
    case "infinitivo":
      return conjugarTempo(lemma, 0, "infinitivo");
    case "infinitivo_pessoal":
      return conjugarPessoaTabela(lemma, parsed.pessoa, "infinitivo_pessoal");
    default:
      return null;
  }
}

/** Comparação estável para PT (Unicode NFC + minúsculas). */
export function normalizarParaComparacao(s: string): string {
  return s.trim().normalize("NFC").toLowerCase();
}

export function parseUnimorphTsvLine(line: string): { lemma: string; gold: string; feats: string } | null {
  const t = line.trim();
  if (!t || t.startsWith("#")) return null;
  const tab = t.indexOf("\t");
  if (tab < 0) return null;
  const rest = t.slice(tab + 1);
  const tab2 = rest.indexOf("\t");
  if (tab2 < 0) return null;
  const lemma = t.slice(0, tab).trim();
  const gold = rest.slice(0, tab2).trim();
  const feats = rest.slice(tab2 + 1).trim();
  if (!lemma || !gold || !feats) return null;
  return { lemma, gold, feats };
}
