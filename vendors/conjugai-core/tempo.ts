import type { TempoVerbal } from "./types";
import { normalize, loader } from "../nlp-pt-br-lite/src/index";

export type InfoTempo = {
  tipo: TempoVerbal;
  rotulo: string;
};

/** Presente de «ter» (normalizado como em `normalize`) — para «tenho que» vs «ter» literal. */
const FORMAS_PRESENTE_TER = new Set(
  ["tenho", "tens", "tem", "temos", "têm"].map((s) => normalize(s))
);

const MACRO_TEMPOS_CAA = new Set<TempoVerbal>(["presente", "passado", "futuro"]);

/** Marcadores de hábito / pano de fundo no passado → pretérito imperfeito (exceto «sempre», tratado à parte). */
const MARCADORES_IMPERFEITO_ASPECTUAL = new Set(
  ["antigamente", "costumava", "enquanto"].map((s) => normalize(s))
);

/** Matriz já flexionada + «que» → futuro do pretérito na dependente (*disse que estudaria*). */
const VERBOS_DISCURSO_REPORTADO = new Set(
  ["disse", "diz", "falou", "contou", "afirmou", "prometeu", "respondeu"].map((s) =>
    normalize(s)
  )
);

/** Formas de polidez / hipótese no token (*gostaria*, *poderia*…). */
const FORMAS_CONDICIONAL_POLIDEZ = new Set(
  ["gostaria", "queria", "poderia", "deveria", "precisaria", "desejaria"].map((s) =>
    normalize(s)
  )
);

function temMarcadorPassado(lower: string[], temPassadoLexico: boolean): boolean {
  return lower.includes("ontem") || temPassadoLexico;
}

function temMarcadorImperfeitoAspectual(
  lower: string[],
  tokensInfo: Array<{ cat?: string[] } | null | undefined>,
  opts?: { sempreComPassado?: boolean }
): boolean {
  if (lower.some((t) => MARCADORES_IMPERFEITO_ASPECTUAL.has(t))) return true;

  const passado = temMarcadorPassado(
    lower,
    tokensInfo.some((info) => info?.cat?.includes("PASSADO"))
  );

  if (opts?.sempreComPassado && lower.includes("sempre") && passado) return true;

  for (let i = 0; i < lower.length; i++) {
    const t = lower[i];
    if (t === "sempre") continue;
    if (tokensInfo[i]?.cat?.includes("IMPERFEITO")) return true;
  }
  return false;
}

function temDiscursoReportadoQue(lower: string[]): boolean {
  for (let i = 0; i < lower.length - 1; i++) {
    if (lower[i + 1] === "que" && VERBOS_DISCURSO_REPORTADO.has(lower[i]!)) return true;
  }
  return false;
}

function temFormaCondicionalPolidez(lower: string[]): boolean {
  return lower.some((t) => FORMAS_CONDICIONAL_POLIDEZ.has(t));
}

/** «se» + forma em -ria (telegráfico ou já flexionado) → condicional, não subjuntivo. */
function temSeComCondicional(lower: string[]): boolean {
  if (!lower.includes("se")) return false;
  return lower.some((t) => /(?:aria|eriam|iriam)$/.test(t) && t.length > 4);
}

function refinarMacroTempoManual(
  tempoManual: TempoVerbal,
  lower: string[],
  tokensInfo: Array<{ cat?: string[] } | null | undefined>
): InfoTempo {
  if (tempoManual === "passado") {
    if (
      lower.includes("sempre") ||
      temMarcadorImperfeitoAspectual(lower, tokensInfo, { sempreComPassado: true })
    ) {
      return {
        tipo: "preterito_imperfeito",
        rotulo:
          "Macro passado (UI) + marcador de hábito/aspecto imperfeito → Pretérito imperfeito.",
      };
    }
  }
  return {
    tipo: tempoManual,
    rotulo: `Tempo definido manualmente pelo usuário (${tempoManual}).`,
  };
}

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
 * Deteta o tempo verbal baseado em tokens, marcadores e contexto opcional.
 * @param tokens Lista de palavras da frase.
 * @param tempoManual Tempo verbal fornecido manualmente (prioridade).
 */
export async function detectarTempo(tokens: string[], tempoManual?: TempoVerbal): Promise<InfoTempo> {
  const lower = tokens.map(normalize);

  // 1. Prioridade: Tempo manual (ex: selecionado na UI); macro-tempos podem refinar imperfeito
  if (tempoManual && TEMPOS_EXPLICITOS.has(tempoManual)) {
    if (MACRO_TEMPOS_CAA.has(tempoManual)) {
      const tokensInfoEarly = await Promise.all(tokens.map((t) => loader.getWordInfo(t)));
      return refinarMacroTempoManual(tempoManual, lower, tokensInfoEarly);
    }
    return {
      tipo: tempoManual,
      rotulo: `Tempo definido manualmente pelo usuário (${tempoManual}).`,
    };
  }

  // 2. Tempo explícito via tag na frase (ex: tempo:passado)
  const explicito = extrairTempoExplicito(tokens);
  if (explicito) {
    return {
      tipo: explicito,
      rotulo: `Tempo explícito na frase via tag (${explicito}).`,
    };
  }
  
  // Detecção robusta de marcadores básicos (fallback se o léxico falhar)
  const temOntem = lower.includes("ontem");
  const temAmanha = lower.includes("amanha");
  const temJa = lower.includes("ja");

  if (temOntem && temJa) {
    return {
      tipo: "preterito_perfeito_composto",
      rotulo:
        'Marcadores "ontem" + "já" → Pretérito perfeito composto (passado composto).',
    };
  }

  if (temOntem) {
    if (lower.includes("sempre")) {
      return {
        tipo: "preterito_imperfeito",
        rotulo: 'Marcadores "ontem" + "sempre" → Pretérito imperfeito (hábito no passado).',
      };
    }
    return {
      tipo: "passado",
      rotulo: 'Marcador "ontem" identificado diretamente → Passado.',
    };
  }

  const firstToken = lower[0] ?? "";
  const perifrasisIrPresente =
    temAmanha &&
    (firstToken === "vou" ||
      firstToken === "vais" ||
      firstToken === "vai" ||
      firstToken === "vamos" ||
      firstToken === "vao");

  if (perifrasisIrPresente) {
    return {
      tipo: "presente",
      rotulo: 'Marcador "amanhã" com perífrase de "ir" no presente.',
    };
  }

  if (temAmanha) {
    return {
      tipo: "futuro",
      rotulo: 'Marcador "amanhã" identificado diretamente → Futuro.',
    };
  }

  // 3. Detecção via Léxico (MorphoBr, etc.)
  const tokensInfo = await Promise.all(tokens.map(t => loader.getWordInfo(t)));
  
  const temTalvez = tokensInfo.some(info => info?.cat?.includes("SUBJUNTIVO"));
  const temQuando = lower.includes("quando");
  const temSe = lower.includes("se");
  /** «que» que dispara leitura subjuntiva — exclui o «que» da locução «ter que» + infinitivo. */
  const temQueSubjuntivo = lower.some((t, i) => {
    if (t !== "que") return false;
    if (i > 0) {
      const prev = lower[i - 1];
      if (prev === "ter" || FORMAS_PRESENTE_TER.has(prev)) return false;
    }
    return true;
  });
  /** Sequência «ter»/«tenho»… + «que» (locução verbal); não deve forçar subjuntivo por «talvez» no léxico. */
  const temLocucaoTerQue = lower.some((t, i) => {
    if (t !== "que" || i < 1) return false;
    const prev = lower[i - 1];
    return prev === "ter" || FORMAS_PRESENTE_TER.has(prev);
  });
  const temQue = lower.includes("que");
  const temNao = lower.includes("nao");
  const temPassadoLexico = tokensInfo.some(info => info?.cat?.includes("PASSADO"));
  const temAmanhaLexico = tokensInfo.some(info => info?.cat?.includes("FUTURO"));

  if (temQuando && temJa) {
    return { tipo: "subjuntivo_futuro_composto", rotulo: 'Marcadores "quando" + "já" → Subjuntivo Futuro composto.' };
  }

  if (temSe && temJa) {
    return { tipo: "subjuntivo_preterito_mais_que_perfeito", rotulo: 'Marcadores "se" + "já" → Subjuntivo Pretérito Mais-que-perfeito composto.' };
  }

  if (temQue && temJa) {
    return { tipo: "subjuntivo_preterito_perfeito", rotulo: 'Marcadores "que" + "já" → Subjuntivo Pretérito Perfeito composto.' };
  }

  if (temAmanhaLexico && temJa) {
    return { tipo: "futuro_composto", rotulo: 'Marcadores de futuro + "já" → Futuro do presente composto.' };
  }

  if (temPassadoLexico && temJa) {
    return { tipo: "preterito_perfeito_composto", rotulo: 'Marcadores de passado + "já" → Pretérito Perfeito composto.' };
  }

  if (temPassadoLexico && lower.includes("antes")) {
    return { tipo: "preterito_mais_que_perfeito", rotulo: 'Marcador "antes" em contexto de passado → Pretérito Mais-que-perfeito.' };
  }

  if (temMarcadorImperfeitoAspectual(lower, tokensInfo, { sempreComPassado: true })) {
    return {
      tipo: "preterito_imperfeito",
      rotulo: "Marcador aspectual (hábito/passado contínuo) → Pretérito imperfeito.",
    };
  }

  if (temDiscursoReportadoQue(lower)) {
    return {
      tipo: "condicional",
      rotulo: 'Discurso reportado («disse que», «falou que»…) → Futuro do pretérito (condicional).',
    };
  }

  if (temFormaCondicionalPolidez(lower)) {
    return {
      tipo: "condicional",
      rotulo: "Forma de polidez/hipótese (-ria) → Futuro do pretérito (condicional).",
    };
  }

  if (temSeComCondicional(lower)) {
    return {
      tipo: "condicional",
      rotulo: '«Se» + forma condicional (-ria) → Futuro do pretérito.',
    };
  }

  if (temQueSubjuntivo || (temTalvez && !temLocucaoTerQue)) {
    return { tipo: "subjuntivo_presente", rotulo: 'Marcador "talvez"/"que" → Subjuntivo Presente.' };
  }

  if (temSe) {
    return { tipo: "subjuntivo_imperfeito", rotulo: 'Marcador "se" → Subjuntivo Imperfeito.' };
  }

  if (temQuando) {
    return { tipo: "subjuntivo_futuro", rotulo: 'Marcador "quando" → Subjuntivo Futuro.' };
  }

  if (temNao && (firstToken === "tu" || firstToken === "voce" || firstToken === "voces")) {
    return { tipo: "imperativo", rotulo: 'Comando com "não" → Imperativo.' };
  }

  if (temAmanhaLexico) {
    return { tipo: "futuro", rotulo: "Marcador de léxico → Futuro." };
  }
  
  if (temPassadoLexico) {
    return { tipo: "passado", rotulo: "Marcador de léxico → Passado." };
  }

  return {
    tipo: "presente",
    rotulo: "Sem marcador de passado/futuro → Presente do indicativo.",
  };
}
