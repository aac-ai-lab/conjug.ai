import type { TempoVerbal } from "./types";
import { normalize, loader } from "../nlp-pt-br-lite/src/index";

export type InfoTempo = {
  tipo: TempoVerbal;
  rotulo: string;
};

const TEMPOS_EXPLICITOS = new Set<TempoVerbal>([
  "presente",
  "futuro",
  "passado",
  "preterito_imperfeito",
  "preterito_mais_que_perfeito",
  "condicional",
  "subjuntivo_presente",
  "subjuntivo_imperfeito",
  "subjuntivo_futuro",
  "imperativo",
  "infinitivo_pessoal",
  "infinitivo",
  "gerundio",
  "participio",
  "preterito_perfeito_composto",
  "preterito_mais_que_perfeito_composto",
  "preterito_mais_que_perfeito_anterior",
  "futuro_composto",
  "futuro_do_preterito_composto",
  "subjuntivo_preterito_perfeito",
  "subjuntivo_preterito_mais_que_perfeito",
  "subjuntivo_futuro_composto",
  "infinitivo_pessoal_composto",
]);

function extrairTempoExplicito(tokens: string[]): TempoVerbal | null {
  for (const raw of tokens) {
    const t = normalize(raw);
    const m1 = /^tempo[:=]([a-z_]+)$/.exec(t);
    const m2 = /^\[tempo=([a-z_]+)\]$/.exec(t);
    const key = (m1?.[1] || m2?.[1]) as TempoVerbal | undefined;
    if (key && TEMPOS_EXPLICITOS.has(key)) return key;
  }
  return null;
}



/**
 * *ontem* → passado.
 * *amanhã* → futuro, exceto quando a frase já tem perífrase **ir + infinitivo** no presente
 * (ex.: «vou viajar amanhã»), caso em que o primeiro verbo permanece no presente.
 * Caso contrário → presente.
 */
export async function detectarTempo(tokens: string[]): Promise<InfoTempo> {
  const lower = tokens.map(normalize);
  const explicito = extrairTempoExplicito(tokens);
  if (explicito) {
    return {
      tipo: explicito,
      rotulo: `Tempo explícito na frase via tag (${explicito}).`,
    };
  }
  
  const tokensInfo = await Promise.all(tokens.map(t => loader.getWordInfo(t)));
  const firstToken = lower[0] ?? "";
  
  const temTalvez = tokensInfo.some(info => info?.cat?.includes("SUBJUNTIVO"));
  const temQuando = lower.includes("quando");
  const temSe = lower.includes("se");
  const temQue = lower.includes("que");
  const temNao = lower.includes("nao");
  const temPassado = tokensInfo.some(info => info?.cat?.includes("PASSADO"));
  const temAmanha = tokensInfo.some(info => info?.cat?.includes("FUTURO"));
  const temJa = lower.includes("ja");
  const temImperfeito = tokensInfo.some(info => info?.cat?.includes("IMPERFEITO"));

  if (temQuando && temJa) {
    return {
      tipo: "subjuntivo_futuro_composto",
      rotulo: 'Marcadores "quando" + "já" → Subjuntivo Futuro composto.',
    };
  }

  if (temSe && temJa) {
    return {
      tipo: "subjuntivo_preterito_mais_que_perfeito",
      rotulo: 'Marcadores "se" + "já" → Subjuntivo Pretérito Mais-que-perfeito composto.',
    };
  }

  if (temQue && temJa) {
    return {
      tipo: "subjuntivo_preterito_perfeito",
      rotulo: 'Marcadores "que" + "já" → Subjuntivo Pretérito Perfeito composto.',
    };
  }

  if (temAmanha && temJa) {
    return {
      tipo: "futuro_composto",
      rotulo: 'Marcadores "amanhã" + "já" → Futuro do presente composto.',
    };
  }

  if (temPassado && temJa) {
    return {
      tipo: "preterito_perfeito_composto",
      rotulo: 'Marcadores de passado + "já" → Pretérito Perfeito composto.',
    };
  }

  if (temPassado && lower.includes("antes")) {
    return {
      tipo: "preterito_mais_que_perfeito",
      rotulo: 'Marcador "antes" em contexto de passado → Pretérito Mais-que-perfeito.',
    };
  }

  if (temImperfeito) {
    return {
      tipo: "preterito_imperfeito",
      rotulo: 'Marcador aspectual (hábito/passado contínuo) → Pretérito Imperfeito.',
    };
  }

  if (temTalvez || temQue) {
    return {
      tipo: "subjuntivo_presente",
      rotulo: 'Marcador "talvez"/"que" → Subjuntivo Presente.',
    };
  }

  if (temSe) {
    return {
      tipo: "subjuntivo_imperfeito",
      rotulo: 'Marcador "se" → Subjuntivo Imperfeito.',
    };
  }

  if (temQuando) {
    return {
      tipo: "subjuntivo_futuro",
      rotulo: 'Marcador "quando" → Subjuntivo Futuro.',
    };
  }

  if (temNao && (firstToken === "tu" || firstToken === "voce" || firstToken === "voces")) {
    return {
      tipo: "imperativo",
      rotulo: 'Estrutura de comando com "não" → Imperativo.',
    };
  }

  const amanha = lower.includes("amanha");
  const perifrasisIrPresente =
    amanha &&
    (firstToken === "vou" ||
      firstToken === "vais" ||
      firstToken === "vai" ||
      firstToken === "vamos" ||
      firstToken === "vao");

  if (perifrasisIrPresente) {
    return {
      tipo: "presente",
      rotulo:
        'Marcador "amanhã" com «vou/vai/… viajar» (perífrase) → presente no verbo suporte.',
    };
  }

  if (temAmanha) {
    return {
      tipo: "futuro",
      rotulo: 'Marcador de futuro → Futuro do Presente do indicativo.',
    };
  }
  if (temPassado) {
    return {
      tipo: "passado",
      rotulo: 'Marcador de passado → Pretérito Perfeito do indicativo.',
    };
  }
  return {
    tipo: "presente",
    rotulo: "Sem marcador de passado/futuro → Presente do indicativo.",
  };
}
