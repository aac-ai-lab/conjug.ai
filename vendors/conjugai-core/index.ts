import { conjugar, conjugarPessoaTabela, conjugarTempo, extrairVerbo } from "./conjugador";
import { corrigir } from "./corretor";
import { detectarSujeito } from "./sujeito";
import { detectarTempo } from "./tempo";
import type { ResultadoAnalise } from "./types";
import { tokenize } from "./tokenizer";

export type {
  GeneroParticipio,
  NumeroParticipio,
  PessoaIndiceTabela,
  ResultadoAnalise,
  TempoVerbal,
} from "./types";
export { tokenize } from "./tokenizer";
export { detectarSujeito, detectarSujeitoComposto } from "./sujeito";
export { detectarTempo } from "./tempo";
export {
  conjugar,
  conjugarPessoaTabela,
  conjugarTempo,
  detectarVerboPorDicionario,
  extrairVerbo,
  gerundio,
  indiceDoVerboNaFrase,
  infinitivoLexico,
  isVerbShape,
  participio,
} from "./conjugador";
export { corrigir } from "./corretor";

/**
 * Pipeline principal: tokenização → sujeito → tempo → verbo → conjugação → correção.
 */
export function analisarFrase(frase: string): ResultadoAnalise {
  const tokens = tokenize(frase);

  if (tokens.length === 0) {
    return {
      tokens: [],
      sujeito: { texto: "Eu", pessoa: 0, rotulo: "—", implicito: true, composto: false },
      tempo: { tipo: "presente" },
      verbo: { infinitivo: "", conjugado: "" },
      correcao: "",
      erro: "Digite ou selecione uma frase.",
      debug: {
        etapa1: "Tokens: (vazio)",
        etapa2: "Sujeito: —",
        etapa3: "Tempo: —",
        etapa4: "Verbo: —",
      },
    };
  }

  const sujeito = detectarSujeito(tokens);
  const tempo = detectarTempo(tokens);
  const infinitivo = extrairVerbo(tokens);

  if (!infinitivo) {
    return {
      tokens,
      sujeito: {
        texto: sujeito.texto,
        pessoa: sujeito.pessoa,
        rotulo: sujeito.rotulo,
        implicito: sujeito.implicito,
        composto: sujeito.composto,
      },
      tempo: { tipo: tempo.tipo },
      verbo: { infinitivo: "", conjugado: "" },
      correcao: "",
      erro:
        "Não foi identificado verbo: nem forma no léxico (data/verbos.json) nem infinitivo por sufixo (-ar, -er, -ir, -pôr).",
      debug: {
        etapa1: `Tokens: ${tokens.join(", ")}`,
        etapa2: `Sujeito: ${sujeito.texto} (${sujeito.rotulo})`,
        etapa3: `Tempo: ${tempo.tipo} — ${tempo.rotulo}`,
        etapa4: "Verbo: não identificado",
      },
    };
  }

  const conjugado = conjugarTempo(infinitivo, sujeito.pessoa, tempo.tipo);

  if (!conjugado) {
    return {
      tokens,
      sujeito: {
        texto: sujeito.texto,
        pessoa: sujeito.pessoa,
        rotulo: sujeito.rotulo,
        implicito: sujeito.implicito,
        composto: sujeito.composto,
      },
      tempo: { tipo: tempo.tipo },
      verbo: { infinitivo, conjugado: "" },
      correcao: "",
      erro: `Não foi possível conjugar «${infinitivo}» no tempo ${tempo.tipo}.`,
      debug: {
        etapa1: `Tokens: ${tokens.join(", ")}`,
        etapa2: `Sujeito: ${sujeito.texto} (${sujeito.rotulo})`,
        etapa3: `Tempo: ${tempo.tipo} — ${tempo.rotulo}`,
        etapa4: `Infinitivo: ${infinitivo}`,
      },
    };
  }

  const correcao = corrigir(tokens, sujeito, infinitivo, conjugado, tempo.tipo);

  return {
    tokens,
    sujeito: {
      texto: sujeito.texto,
      pessoa: sujeito.pessoa,
      rotulo: sujeito.rotulo,
      implicito: sujeito.implicito,
      composto: sujeito.composto,
    },
    tempo: { tipo: tempo.tipo },
    verbo: { infinitivo, conjugado },
    correcao,
    debug: {
      etapa1: `Tokens: ${tokens.join(", ")}`,
      etapa2: `Sujeito: ${sujeito.texto} — ${sujeito.rotulo}`,
      etapa3: `Tempo: ${tempo.tipo} — ${tempo.rotulo}`,
      etapa4: `Verbo conjugado: ${conjugado} («${infinitivo}»)`,
    },
  };
}
