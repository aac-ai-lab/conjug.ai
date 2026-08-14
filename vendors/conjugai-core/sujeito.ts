import { extrairVerbo, indiceDoVerboNaFrase } from "./conjugador";
import type { PessoaIndice } from "./types";
import {
  normalize,
  getPronomeInfo,
  isSubstantivoHumano,
  isStopword,
  isBasicPronoun,
} from "../nlp-pt-br-lite/src/index";

export type OpcoesSujeito = {
  /** SVP: tudo antes do verbo = sujeito; tudo depois = predicado. */
  ordemSintaticaForcada?: boolean;
  /** SVO: procura sujeito depois do verbo (VSO/VOS). Desligado por omissão. */
  normalizarSVO?: boolean;
};

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

function isToken(t: string, forms: string[]): boolean {
  const n = normalize(t);
  return forms.some((f) => n === f);
}

function temConectorE(tokens: string[]): boolean {
  return tokens.some((t) => normalize(t) === "e");
}

/** Índice do primeiro «que» subordinante antes do verbo a corrigir (telegrafia). */
function indiceQueAntesDoVerbo(tokens: string[], verbIdx: number): number {
  if (verbIdx <= 0) return -1;
  for (let i = 0; i < verbIdx; i++) {
    if (normalize(tokens[i]) === "que") return i;
  }
  return -1;
}

/** Prefixo antes do primeiro token verbal (infinitivo ou forma do léxico). */
function prefixoAntesDoVerbo(tokens: string[]): string[] | null {
  const inf = extrairVerbo(tokens);
  if (!inf) return null;
  const vi = indiceDoVerboNaFrase(tokens, inf);
  if (vi < 0) return null;
  return tokens.slice(0, vi);
}

/** Pessoa verbal para sujeito composto a partir dos núcleos normalizados do prefixo. */
function classificarSujeitoComposto(toks: string[], contexto: string): InfoSujeito {
  if (toks.some((t) => t === "eu")) {
    return {
      texto: "Nós",
      pessoa: 3,
      rotulo: `${contexto} (contém «eu») → 1ª plural`,
      implicito: false,
      composto: true,
    };
  }

  if (toks.some((t) => t === "tu" || t === "voce")) {
    return {
      texto: "Vocês",
      pessoa: 4,
      rotulo: `${contexto} (tu/você + …) → plural (forma verbal como «eles»)`,
      implicito: false,
      composto: true,
    };
  }

  return {
    texto: "Eles",
    pessoa: 4,
    rotulo: `${contexto} (dois+ núcleos sem eu/tu/você) → 3ª plural`,
    implicito: false,
    composto: true,
  };
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

  return classificarSujeitoComposto(prefix.map(normalize), "composto");
}

/**
 * Telegrafia CAA: **dois ou mais pronomes** antes do verbo, **sem** «e»
 * (ex.: *eu, ela brincar*, *ela ele comer* — vírgula removida na tokenização).
 */
export async function detectarSujeitoCompostoPronomes(
  prefixTokens: string[]
): Promise<InfoSujeito | null> {
  if (prefixTokens.length < 2) return null;

  let pronCount = 0;
  for (const t of prefixTokens) {
    const info = await getPronomeInfo(t);
    if (!info) return null;
    pronCount++;
  }

  if (pronCount < 2) return null;

  return classificarSujeitoComposto(
    prefixTokens.map(normalize),
    "composto (lista de pronomes)"
  );
}

/**
 * Núcleos de parentesco / tratamento em telegrafia CAA (PT-BR), **após** `normalize`
 * (sem acentos). Lista extensível (vocabulário tipo pictogramas / Arasaac «br»).
 */
const NUCLEO_FAMILIA_EU_COMPOSTO = new Set<string>([
  "mae",
  "mamae",
  "papai",
  "pai",
  "titio",
  "titia",
  "tio",
  "tia",
  "vovo",
  "avo",
  "irmao",
  "irma",
  "neto",
  "neta",
  "primo",
  "prima",
  "sobrinho",
  "sobrinha",
  "cunhado",
  "cunhada",
  "sogro",
  "sogra",
  "genro",
  "nora",
  "filho",
  "filha",
  "bebe",
  "nenem",
  "bisavo",
  "afilhado",
  "afilhada",
]);

function tokenEUmNucleoFamiliarComposto(tokenNorm: string): boolean {
  if (tokenNorm === "mamae" || tokenNorm.startsWith("mamae")) return true;
  if (NUCLEO_FAMILIA_EU_COMPOSTO.has(tokenNorm)) return true;
  if (
    tokenNorm.startsWith("titio") ||
    tokenNorm.startsWith("titia") ||
    tokenNorm.startsWith("vovo")
  ) {
    return true;
  }
  return false;
}

/**
 * Telegrafia CAA: «eu» + núcleo familiar (mamãe, papai, titio, vovô, etc.) **antes do verbo**,
 * **ordem livre**, sem conector «e». Só `tokens.slice(0, verbIdx)`.
 */
function prefixoTemEuEFamilia(prefixTokens: string[]): boolean {
  if (prefixTokens.length < 2) return false;
  const n = prefixTokens.map(normalize);
  if (!n.some((t) => t === "eu")) return false;
  return n.some((t) => tokenEUmNucleoFamiliarComposto(t));
}

async function isNounCandidate(token: string): Promise<boolean> {
  const n = normalize(token);
  if (n.length < 2) return false;

  // 1. Títulos de pessoas / Parentesco (comum em CAA)
  if (await isSubstantivoHumano(token)) return true;

  // 2. Nomes Próprios (começam com maiúscula na frase original)
  const isUpper = token.charAt(0) !== token.charAt(0).toLowerCase();
  if (isUpper) {
    // 2.1 Se for um pronome básico (Eu, Tu...), não é sujeito (já foi capturado no step 2)
    if (isBasicPronoun(token)) return false;

    // Se for uma stopword conhecida, mesmo em maiúscula, não é sujeito
    if (await isStopword(token)) return false;

    // Não rejeitar por colisão com forma rara do léxico (ex.: «Pedro» = presente de «pedrar»).
    return true;
  }

  return false;
}

const FUNCIONAIS_PREFIXO = new Set([
  "o",
  "a",
  "os",
  "as",
  "um",
  "uma",
  "uns",
  "umas",
  "e",
  "ou",
  "de",
  "do",
  "da",
  "dos",
  "das",
  "em",
  "no",
  "na",
  "nas",
  "meu",
  "minha",
  "meus",
  "minhas",
  "teu",
  "tua",
  "teus",
  "tuas",
  "seu",
  "sua",
  "seus",
  "suas",
  "nosso",
  "nossa",
  "nossos",
  "nossas",
  "este",
  "esta",
  "estes",
  "estas",
  "esse",
  "essa",
  "esses",
  "essas",
  "aquele",
  "aquela",
  "aqueles",
  "aquelas",
]);

const DET_SINGULAR = new Set([
  "o",
  "a",
  "um",
  "uma",
  "este",
  "esta",
  "esse",
  "essa",
  "aquele",
  "aquela",
  "meu",
  "minha",
  "teu",
  "tua",
  "seu",
  "sua",
  "nosso",
  "nossa",
]);

const DET_PLURAL = new Set([
  "os",
  "as",
  "uns",
  "umas",
  "estes",
  "estas",
  "esses",
  "essas",
  "aqueles",
  "aquelas",
  "meus",
  "minhas",
  "teus",
  "tuas",
  "seus",
  "suas",
  "nossos",
  "nossas",
]);

const MARCADORES_TEMPO_PREFIXO = new Set([
  "ontem",
  "hoje",
  "amanha",
  "agora",
  "depois",
  "antes",
  "ja",
  "ainda",
  "sempre",
  "antigamente",
  "enquanto",
]);

function nucleosDoPrefixo(prefixNorm: string[]): string[] {
  return prefixNorm.filter((t) => {
    if (t.length === 0) return false;
    if (isBasicPronoun(t)) return true;
    if (FUNCIONAIS_PREFIXO.has(t) || MARCADORES_TEMPO_PREFIXO.has(t)) return false;
    return true;
  });
}

function prefixoParecePlural(prefixNorm: string[], nucleos: string[]): boolean {
  if (prefixNorm.some((t) => DET_PLURAL.has(t))) return true;
  if (nucleos.length >= 2) return true;
  const ultimo = nucleos[nucleos.length - 1];
  if (!ultimo || ultimo.length < 3 || !ultimo.endsWith("s")) return false;
  if (ultimo.endsWith("us") || ultimo.endsWith("is")) return false;
  return true;
}

function temDeterminante(prefixNorm: string[]): boolean {
  return prefixNorm.some((t) => DET_SINGULAR.has(t) || DET_PLURAL.has(t));
}

function ehAGente(prefixNorm: string[], nucleos: string[]): boolean {
  const iGente = prefixNorm.indexOf("gente");
  if (iGente < 0) return false;
  if (iGente > 0 && prefixNorm[iGente - 1] === "a") {
    return nucleos.length <= 1;
  }
  return nucleos.length === 1 && nucleos[0] === "gente";
}

/**
 * Sujeito nominal no prefixo (sem inventar «eu»): «a gente», «as crianças», «a mãe».
 * Não trata substantivo comum solto («pizza comer») — isso ficaria objeto ou telegrafia sem sujeito.
 */
function classificarSujeitoNominalDoPrefixo(
  prefix: string[],
  start: number,
  rotuloBase: string
): InfoSujeito | null {
  const prefixNorm = prefix.map(normalize);
  const nucleos = nucleosDoPrefixo(prefixNorm);
  if (nucleos.length === 0) return null;

  if (ehAGente(prefixNorm, nucleos)) {
    return {
      texto: prefix.join(" "),
      pessoa: 2,
      rotulo: `${rotuloBase}: «a gente» → 3ª sg`,
      implicito: false,
      composto: false,
      posicaoOriginal: "antes",
      tokenIndex: start,
    };
  }

  if (!temDeterminante(prefixNorm)) return null;

  const plural = prefixoParecePlural(prefixNorm, nucleos);
  const superficie = prefix
    .filter((t) => !MARCADORES_TEMPO_PREFIXO.has(normalize(t)))
    .join(" ");
  return {
    texto: superficie,
    pessoa: plural ? 4 : 2,
    rotulo: plural
      ? `${rotuloBase}: SN plural «${superficie}» → 3ª pl`
      : `${rotuloBase}: SN «${superficie}» → 3ª sg`,
    implicito: false,
    composto: nucleos.length >= 2,
    posicaoOriginal: "antes",
    tokenIndex: start,
  };
}

/**
 * Modo Robson: o intervalo à esquerda do verbo (ou entre «que» e o verbo) é o sujeito;
 * nada à direita entra na busca. Pessoa sai do prefixo inteiro, não de um token isolado.
 */
async function detectarSujeitoOrdemForcada(tokens: string[]): Promise<InfoSujeito> {
  const inf = extrairVerbo(tokens);
  const verbIdx = inf ? indiceDoVerboNaFrase(tokens, inf) : -1;

  let start = 0;
  const queIdx = indiceQueAntesDoVerbo(tokens, verbIdx);
  if (verbIdx > 0 && queIdx >= 0) {
    start = queIdx + 1;
  }

  const prefix = verbIdx > 0 ? tokens.slice(start, verbIdx) : [];
  const prefixNorm = prefix.map(normalize);
  const nucleos = nucleosDoPrefixo(prefixNorm);

  if (prefix.length === 0) {
    return {
      texto: "Eu",
      pessoa: 0,
      rotulo: "ordem forçada: prefixo vazio → implícito 1ª sg",
      implicito: true,
      posicaoOriginal: "antes",
    };
  }

  // «nos»/«nós» (e outros pronomes) antes de filtrar funcionais — senão «nos» some
  // (colide com a contração em+os) e o modo inventa «eu».
  if (nucleos.length === 0) {
    for (let i = 0; i < prefix.length; i++) {
      const info = await getPronomeInfo(prefix[i]);
      if (info) {
        return {
          ...info,
          rotulo: `ordem forçada: explícito ${prefix[i]}`,
          tokenIndex: start + i,
          posicaoOriginal: "antes",
          implicito: false,
        };
      }
    }
    return {
      texto: "Eu",
      pessoa: 0,
      rotulo: "ordem forçada: prefixo sem núcleo → implícito 1ª sg",
      implicito: true,
      posicaoOriginal: "antes",
    };
  }

  if (prefix.length >= 3 && temConectorE(prefix)) {
    const comp = classificarSujeitoComposto(prefixNorm, "ordem forçada: composto");
    return { ...comp, posicaoOriginal: "antes" };
  }

  const compPron = await detectarSujeitoCompostoPronomes(prefix);
  if (compPron) return { ...compPron, posicaoOriginal: "antes" };

  if (ehAGente(prefixNorm, nucleos)) {
    return {
      texto: prefix.join(" "),
      pessoa: 2,
      rotulo: "ordem forçada: «a gente» → 3ª sg",
      implicito: false,
      composto: false,
      posicaoOriginal: "antes",
      tokenIndex: start,
    };
  }

  if (nucleos.includes("eu") && nucleos.length >= 2) {
    return {
      texto: "Nós",
      pessoa: 3,
      rotulo: "ordem forçada: prefixo com «eu» + outro núcleo → 1ª pl",
      implicito: false,
      composto: true,
      posicaoOriginal: "antes",
    };
  }

  if (nucleos.some((t) => t === "tu" || t === "voce") && nucleos.length >= 2) {
    return {
      texto: "Vocês",
      pessoa: 4,
      rotulo: "ordem forçada: prefixo com tu/você + outro núcleo → plural",
      implicito: false,
      composto: true,
      posicaoOriginal: "antes",
    };
  }

  if (nucleos.length === 1) {
    const iPron = prefix.findIndex((t) => nucleos[0] === normalize(t));
    if (iPron >= 0) {
      const info = await getPronomeInfo(prefix[iPron]);
      if (info) {
        return {
          ...info,
          rotulo: `ordem forçada: explícito ${prefix[iPron]}`,
          tokenIndex: start + iPron,
          posicaoOriginal: "antes",
          implicito: false,
        };
      }
    }
  }

  const plural = prefixoParecePlural(prefixNorm, nucleos);
  const superficie = prefix
    .filter((t) => !MARCADORES_TEMPO_PREFIXO.has(normalize(t)))
    .join(" ");
  return {
    texto: superficie,
    pessoa: plural ? 4 : 2,
    rotulo: plural
      ? `ordem forçada: SN plural «${superficie}» → 3ª pl`
      : `ordem forçada: SN «${superficie}» → 3ª sg`,
    implicito: false,
    composto: nucleos.length >= 2,
    posicaoOriginal: "antes",
    tokenIndex: start,
  };
}

/**
 * Identifica sujeito e pessoa (0–4).
 * Tenta primeiro sujeito composto (**X e Y** antes do verbo);
 * depois **dois+ pronomes** no prefixo (ex.: *eu, ela*);
 * depois **eu + núcleo familiar** no prefixo (ordem livre, sem «e»);
 * depois procura pronomes ou nomes antes do verbo.
 * Com `normalizarSVO`, também procura depois do verbo (VSO/VOS).
 * Com `ordemSintaticaForcada` (SVP), o prefixo inteiro é o sujeito e nada após o verbo é candidato.
 */
export async function detectarSujeito(
  tokens: string[],
  opcoes?: OpcoesSujeito
): Promise<InfoSujeito> {
  if (opcoes?.ordemSintaticaForcada) {
    return detectarSujeitoOrdemForcada(tokens);
  }

  const inf = extrairVerbo(tokens);
  const verbIdx = inf ? indiceDoVerboNaFrase(tokens, inf) : -1;

  // 1. Tentar Sujeito Composto (apenas antes do verbo por agora)
  if (verbIdx > 0) {
    const comp = detectarSujeitoComposto(tokens);
    if (comp) return { ...comp, posicaoOriginal: "antes" };
  }

  // 1a. Dois ou mais pronomes antes do verbo (ex.: «eu, ela brincar»)
  if (verbIdx >= 2) {
    const prefix = tokens.slice(0, verbIdx);
    const compPron = await detectarSujeitoCompostoPronomes(prefix);
    if (compPron) return { ...compPron, posicaoOriginal: "antes" };
  }

  // 1b. Eu + núcleo familiar antes do verbo (ordem livre; ex.: «eu titio gostar», «vovo eu comer»)
  if (verbIdx >= 2) {
    const prefix = tokens.slice(0, verbIdx);
    if (prefixoTemEuEFamilia(prefix)) {
      return {
        texto: "Nós",
        pessoa: 3,
        rotulo:
          "composto (Eu + família/parentesco antes do verbo, ordem livre) → 1ª plural",
        implicito: false,
        composto: true,
        posicaoOriginal: "antes",
      };
    }
  }

  // 2. Tentar Sujeito Explícito (Pronomes) - Busca Bidirecional

  // Após «que»: sujeito da oração dependente fica entre «que» e o infinitivo (ex.: «Ele disse que eles falar» → eles).
  const queIdx = indiceQueAntesDoVerbo(tokens, verbIdx);
  if (verbIdx > 0 && queIdx >= 0) {
    for (let i = verbIdx - 1; i > queIdx; i--) {
      const info = await getPronomeInfo(tokens[i]);
      if (info) {
        return {
          ...info,
          rotulo: `explícito (dependente de «que»): ${tokens[i]}`,
          tokenIndex: i,
          posicaoOriginal: "antes",
          implicito: false,
        };
      }
    }
  }

  // Prioridade 1: Pronome antes do verbo
  if (verbIdx > 0) {
    for (let i = 0; i < verbIdx; i++) {
      const info = await getPronomeInfo(tokens[i]);
      if (info) {
        return {
          ...info,
          rotulo: `explícito: ${tokens[i]}`,
          tokenIndex: i,
          posicaoOriginal: "antes",
          implicito: false,
        };
      }
    }
  }

  // Prioridade 2: Pronome depois do verbo (VSO/VOS) — só com SVO ligado
  if (opcoes?.normalizarSVO && verbIdx >= 0) {
    for (let i = verbIdx + 1; i < tokens.length; i++) {
      const info = await getPronomeInfo(tokens[i]);
      if (info) {
        return {
          ...info,
          rotulo: `explícito (pós-verbo): ${tokens[i]}`,
          tokenIndex: i,
          posicaoOriginal: "depois",
          implicito: false,
        };
      }
    }
  }

  // 3. Tentar Substantivo/Nome Próprio (Busca Bidirecional)
  // Prioridade: Antes do verbo
  if (verbIdx > 0) {
    for (let i = 0; i < verbIdx; i++) {
      if (await isNounCandidate(tokens[i])) {
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

  // Fallback: Depois do verbo — só com SVO ligado
  if (opcoes?.normalizarSVO && verbIdx >= 0) {
    for (let i = verbIdx + 1; i < tokens.length; i++) {
      if (await isNounCandidate(tokens[i])) {
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

  // 4. Prefixo nominal («a gente», «as crianças», «a mãe») — não inventar «eu»
  if (verbIdx > 0) {
    let start = 0;
    if (queIdx >= 0) start = queIdx + 1;
    const prefix = tokens.slice(start, verbIdx);
    const nominal = classificarSujeitoNominalDoPrefixo(prefix, start, "SN no prefixo");
    if (nominal) return nominal;
  }

  // 5. Fallback Final: Implícito Eu (só quando o prefixo não traz sujeito)
  return {
    texto: "Eu",
    pessoa: 0,
    rotulo: "implícito: 1ª pessoa do singular (frase sem sujeito identificado)",
    implicito: true,
    posicaoOriginal: "antes",
  };
}
