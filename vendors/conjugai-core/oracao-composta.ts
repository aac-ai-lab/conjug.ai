import { extrairVerbo, indiceDoVerboNaFrase } from "./conjugador";
import { normalize } from "../nlp-pt-br-lite/src/index";

/** Após «e»/«mas»/…, pronomes costumam ir em minúsculas no meio do período. */
const PRON_INICIO_CLAUSULA = new Set(
  ["eu", "tu", "ele", "ela", "nos", "nós", "eles", "elas", "voce", "você", "voces", "vocês"].map((s) =>
    normalize(s).toLowerCase()
  )
);

function primeiraPalavraMinusculaSePronome(frase: string): string {
  const trimmed = frase.trim();
  if (!trimmed.length) return frase;
  const primeira = trimmed.split(/\s+/)[0];
  const chave = normalize(primeira).toLowerCase().replace(/[.!?]+$/g, "");
  if (!PRON_INICIO_CLAUSULA.has(chave)) return frase;
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
}

/** Normalização para comparar conectores (minúsculas, sem acento). */
function nt(t: string): string {
  return normalize(t).toLowerCase();
}

/** Coordenação adversativa / conclusiva (token isolado, após normalização). */
const CONJ_FORTE = new Set(["mas", "porem", "entao"]);

export type BlocoOracao = {
  tokens: string[];
  /** Conector antes da oração seguinte (null na última). */
  conectorDepois: string | null;
};

/** Conectores copulativos/disjuntivos tratados como «e»: só após o 1.º verbo (não partir «X e Y» / «X ou Y» sujeito). */
const CONJ_FRACA_POS_VERBO = new Set(["e", "ou"]);

/**
 * Encontra o primeiro corte em orações coordenadas:
 * - «mas», «porém», «então» entre dois troços com verbo;
 * - «e» / «ou» só **depois** do primeiro verbo da frase (evita partir sujeito composto *X e Y* / *X ou Y*).
 */
function findFirstSplit(tokens: string[]): { left: string[]; right: string[]; conector: string } | null {
  const inf = extrairVerbo(tokens);
  if (!inf) return null;
  const vi = indiceDoVerboNaFrase(tokens, inf);
  if (vi < 0) return null;

  for (let i = 0; i < tokens.length; i++) {
    const c = nt(tokens[i]);
    if (!CONJ_FORTE.has(c)) continue;
    if (i === 0) continue;
    const left = tokens.slice(0, i);
    const right = tokens.slice(i + 1);
    if (!left.length || !right.length) continue;
    if (extrairVerbo(left) && extrairVerbo(right)) {
      return { left, right, conector: tokens[i] };
    }
  }

  for (let i = 0; i < tokens.length; i++) {
    if (!CONJ_FRACA_POS_VERBO.has(nt(tokens[i]))) continue;
    if (i <= vi) continue;
    const left = tokens.slice(0, i);
    const right = tokens.slice(i + 1);
    if (!extrairVerbo(right)) continue;
    return { left, right, conector: tokens[i] };
  }

  return null;
}

/**
 * Segmenta por coordenação (subordinação não entra).
 * Cada bloco tem `conectorDepois` preenchido exceto o último.
 */
export function segmentarOracoesCoordenadas(tokens: string[]): BlocoOracao[] {
  const s = findFirstSplit(tokens);
  if (!s) return [{ tokens, conectorDepois: null }];
  const left = segmentarOracoesCoordenadas(s.left);
  const right = segmentarOracoesCoordenadas(s.right);
  const lastLeft = left[left.length - 1];
  lastLeft.conectorDepois = s.conector;
  return [...left.slice(0, -1), lastLeft, ...right];
}

type SujeitoMin = { texto: string; implicito?: boolean };

/**
 * Junta as frases corrigidas de cada oração, preservando conectores e omitindo
 * pronome repetido quando dois blocos seguidos têm o mesmo sujeito implícito.
 */
export function juntarCorrecoesOracoes(
  partes: Array<{ correcao: string; sujeito: SujeitoMin }>,
  conectores: Array<string | null>
): string {
  if (partes.length === 0) return "";
  if (partes.length === 1) return partes[0].correcao;

  let out = partes[0].correcao;

  for (let k = 1; k < partes.length; k++) {
    let piece = partes[k].correcao;
    const prev = partes[k - 1].sujeito;
    const cur = partes[k].sujeito;

    if (cur.implicito && cur.texto === prev.texto && cur.texto.length > 0) {
      const esc = cur.texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp("^" + esc + "\\s+", "i");
      if (re.test(piece)) {
        piece = piece.replace(re, "").trim();
        if (piece.length) piece = piece.charAt(0).toLowerCase() + piece.slice(1);
      }
    } else {
      piece = primeiraPalavraMinusculaSePronome(piece);
    }

    const conn = conectores[k - 1] ?? "e";
    out += " " + conn + " " + piece;
  }

  const t = out.trim().replace(/\s+/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}
