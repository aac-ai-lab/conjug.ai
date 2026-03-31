import { extrairVerbo, indiceDoVerboNaFrase } from "./conjugador";
import type { PessoaIndice } from "./types";

export type InfoSujeito = {
  texto: string;
  pessoa: PessoaIndice;
  rotulo: string;
  /** Sem pronome explícito na frase — usa-se 1.ª pessoa (Eu) para telegrafias. */
  implicito?: boolean;
  /** Sujeito composto: `texto` é rótulo (ex.: Nós) para UI; a pessoa serve à conjugação. A frase corrigida mantém os tokens do sujeito. */
  composto?: boolean;
  /** 'antes' ou 'depois' do verbo. */
  posicaoOriginal?: "antes" | "depois";
  /** Índice do token na frase original (se não for implícito). */
  tokenIndex?: number;
};

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isToken(t: string, forms: string[]): boolean {
  const n = normalize(t);
  return forms.some((f) => n === f);
}

function temConectorE(tokens: string[]): boolean {
  return tokens.some((t) => normalize(t) === "e");
}

/** Prefixo antes do primeiro token verbal (infinitivo ou forma do léxico). */
function prefixoAntesDoVerbo(tokens: string[]): string[] | null {
  const inf = extrairVerbo(tokens);
  if (!inf) return null;
  const vi = indiceDoVerboNaFrase(tokens, inf);
  if (vi < 0) return null;
  return tokens.slice(0, vi);
}

/**
 * Sujeito composto com padrão **X e Y** antes do verbo (telegrafia).
 * — contém **eu** → 1.ª plural (Nós);
 * — contém **tu** ou **você** → Vocês (pessoa verbal 4, como *eles* em PT-BR);
 * — caso contrário (ex.: *João e Maria*, *meu pai e minha mãe*) → Eles.
 */
export function detectarSujeitoComposto(tokens: string[]): InfoSujeito | null {
  const prefix = prefixoAntesDoVerbo(tokens);
  if (!prefix || prefix.length < 3 || !temConectorE(prefix)) {
    return null;
  }

  const toks = prefix.map(normalize);

  if (toks.some((t) => t === "eu")) {
    return {
      texto: "Nós",
      pessoa: 3,
      rotulo: "composto (contém «eu») → 1ª plural",
      implicito: false,
      composto: true,
    };
  }

  if (toks.some((t) => t === "tu" || t === "voce")) {
    return {
      texto: "Vocês",
      pessoa: 4,
      rotulo: "composto (tu/você + …) → plural (forma verbal como «eles»)",
      implicito: false,
      composto: true,
    };
  }

  return {
    texto: "Eles",
    pessoa: 4,
    rotulo: "composto (dois núcleos sem eu/tu/você) → 3ª plural",
    implicito: false,
    composto: true,
  };
}

function isCompostoEuOutra(tokens: string[]): boolean {
  const lower = tokens.map(normalize);
  const hasEu = lower.includes("eu");
  if (!hasEu) return false;
  if (lower.includes("mamae") || lower.some((t) => t.startsWith("mamae"))) return true;
  if (lower.includes("papai")) return true;
  const joined = lower.join(" ");
  if (/(mamae|papai)\s+e\s+eu|eu\s+e\s+(mamae|papai)/.test(joined)) return true;
  return false;
}

function isNounCandidate(token: string): boolean {
  const n = normalize(token);
  if (n.length < 2) return false;

  // 1. Títulos de pessoas / Parentesco (comum em CAA)
  const pessoas = [
    "mae", "mamae", "mamãe", "pai", "papai",
    "vo", "vovo", "vovô", "vovó",
    "tio", "tia", "irmao", "irma", "irmão", "irmã",
    "medico", "medica", "médico", "médica",
    "professor", "professora", "amigo", "amiga"
  ];
  if (pessoas.includes(n)) return true;

  // 2. Nomes Próprios (começam com maiúscula na frase original)
  // Nota: tokens[i] é a forma original.
  const isUpper = token.charAt(0) !== token.charAt(0).toLowerCase();
  if (isUpper) {
    // Verificar se não é apenas o início da frase (primeira posição)
    // Mas em telegrafia, o primeiro token costuma ser o sujeito.
    // Para ser seguro, evitamos palavras funcionais mesmo se em maiúscula.
    const funcionais = ["o", "a", "os", "as", "um", "uma", "de", "em", "por", "com", "e"];
    if (funcionais.includes(n)) return false;
    
    // Se for um verbo conhecido mesmo em maiúscula, não é sujeito
    if (extrairVerbo([token])) return false;
    
    return true;
  }

  return false;
}

/**
 * Identifica sujeito e pessoa (0–4).
 * Tenta primeiro sujeito composto (**X e Y** antes do verbo); 
 * depois procura pronomes ou nomes em qualquer posição (bidirecional).
 */
export function detectarSujeito(tokens: string[]): InfoSujeito {
  const inf = extrairVerbo(tokens);
  const verbIdx = inf ? indiceDoVerboNaFrase(tokens, inf) : -1;

  // 1. Tentar Sujeito Composto (apenas antes do verbo por agora)
  if (verbIdx > 0) {
    const comp = detectarSujeitoComposto(tokens);
    if (comp) return { ...comp, posicaoOriginal: "antes" };
  }

  // 2. Tentar Sujeito Explícito (Pronomes) - Busca Bidirecional
  const pronomesMap: Record<string, { texto: string; pessoa: PessoaIndice }> = {
    eu: { texto: "Eu", pessoa: 0 },
    tu: { texto: "Tu", pessoa: 1 },
    ele: { texto: "Ele", pessoa: 2 },
    ela: { texto: "Ela", pessoa: 2 },
    nos: { texto: "Nós", pessoa: 3 },
    "nós": { texto: "Nós", pessoa: 3 },
    eles: { texto: "Eles", pessoa: 4 },
    elas: { texto: "Eles", pessoa: 4 }, // Simplificado para Eles no motor
    voce: { texto: "Você", pessoa: 2 }, // Em PT-BR você = 3ª pessoa verbal
    "você": { texto: "Você", pessoa: 2 },
    voces: { texto: "Vocês", pessoa: 4 },
    "vocês": { texto: "Vocês", pessoa: 4 },
  };

  // Prioridade 1: Pronome antes do verbo
  if (verbIdx > 0) {
    for (let i = 0; i < verbIdx; i++) {
      const n = normalize(tokens[i]);
      if (pronomesMap[n]) {
        return {
          ...pronomesMap[n],
          rotulo: `explícito: ${n}`,
          tokenIndex: i,
          posicaoOriginal: "antes",
          implicito: false,
        };
      }
    }
  }

  // Prioridade 2: Pronome depois do verbo (VSO/VOS)
  if (verbIdx >= 0) {
    for (let i = verbIdx + 1; i < tokens.length; i++) {
      const n = normalize(tokens[i]);
      if (pronomesMap[n]) {
        return {
          ...pronomesMap[n],
          rotulo: `explícito (pós-verbo): ${n}`,
          tokenIndex: i,
          posicaoOriginal: "depois",
          implicito: false,
        };
      }
    }
  }

  // 3. Tentar "Casos Familiares" (Eu + mamãe/papai)
  if (isCompostoEuOutra(tokens)) {
    return {
      texto: "Nós",
      pessoa: 3,
      rotulo: "composto (Eu + mamãe/papai) → 1ª plural",
      implicito: false,
      composto: true,
      posicaoOriginal: "antes" // Geralmente antes
    };
  }

  // 4. Tentar Substantivo/Nome Próprio (Busca Bidirecional)
  // Prioridade: Antes do verbo
  if (verbIdx > 0) {
    for (let i = 0; i < verbIdx; i++) {
      if (isNounCandidate(tokens[i])) {
        return {
          texto: tokens[i],
          pessoa: 2, // 3ª pessoa para nomes
          rotulo: `nome identificado: ${tokens[i]}`,
          tokenIndex: i,
          posicaoOriginal: "antes",
          implicito: false,
        };
      }
    }
  }
  // Fallback: Depois do verbo
  if (verbIdx >= 0) {
    for (let i = verbIdx + 1; i < tokens.length; i++) {
      if (isNounCandidate(tokens[i])) {
        return {
          texto: tokens[i],
          pessoa: 2,
          rotulo: `nome identificado (pós-verbo): ${tokens[i]}`,
          tokenIndex: i,
          posicaoOriginal: "depois",
          implicito: false,
        };
      }
    }
  }

  // 5. Fallback Final: Implícito Eu
  return {
    texto: "Eu",
    pessoa: 0,
    rotulo: "implícito: 1ª pessoa do singular (frase sem sujeito identificado)",
    implicito: true,
    posicaoOriginal: "antes"
  };
}
