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

  // 1. Prioridade: Tempo manual (ex: selecionado na UI)
  if (tempoManual && TEMPOS_EXPLICITOS.has(tempoManual)) {
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

  if (temOntem) {
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
  const temJa = lower.includes("ja");
  const temImperfeito = tokensInfo.some(info => info?.cat?.includes("IMPERFEITO"));

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

  if (temImperfeito) {
    return { tipo: "preterito_imperfeito", rotulo: 'Marcador aspectual (hábito/passado) → Pretérito Imperfeito.' };
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
