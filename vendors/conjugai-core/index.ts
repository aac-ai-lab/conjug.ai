import { conjugar, conjugarPessoaTabela, conjugarTempo, extrairVerbo } from "./conjugador";
import { corrigir } from "./corretor";
import { detectarSujeito } from "./sujeito";
import { detectarTempo } from "./tempo";
import type { ResultadoAnalise, ResultadoAnaliseClausula, TempoVerbal } from "./types";
import { juntarCorrecoesOracoes, segmentarOracoesCoordenadas } from "./oracao-composta";
import { tokenize } from "../nlp-pt-br-lite/src/index";

export type {
  GeneroParticipio,
  NumeroParticipio,
  PessoaIndice,
  PessoaIndiceTabela,
  InfoSujeitoAnalise,
  ResultadoAnalise,
  ResultadoAnaliseClausula,
  TempoVerbal,
} from "./types";
export { tokenize } from "../nlp-pt-br-lite/src/index";
export { detectarSujeito } from "./sujeito";
export { detectarTempo } from "./tempo";
export {
  conjugar,
  conjugarPessoaTabela,
  conjugarTempo,
  detectarLocucaoVerbalHeadLemma,
  detectarVerboPorDicionario,
  extrairVerbo,
  gerundio,
  indiceDoVerboNaFrase,
  infinitivoLexico,
  isVerbShape,
  participio,
} from "./conjugador";
export { corrigir } from "./corretor";
export { segmentarOracoesCoordenadas } from "./oracao-composta";

async function analisarOracaoUnica(
  tokens: string[],
  contexto?: { tempo?: TempoVerbal }
): Promise<ResultadoAnalise> {
  const sujeito = await detectarSujeito(tokens);
  const tempo = await detectarTempo(tokens, contexto?.tempo);
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
        posicaoOriginal: sujeito.posicaoOriginal,
        tokenIndex: sujeito.tokenIndex,
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

  const conjugado = conjugarTempo(infinitivo, sujeito.pessoa, tempo.tipo as TempoVerbal);

  if (!conjugado) {
    return {
      tokens,
      sujeito: {
        texto: sujeito.texto,
        pessoa: sujeito.pessoa,
        rotulo: sujeito.rotulo,
        implicito: sujeito.implicito,
        composto: sujeito.composto,
        posicaoOriginal: sujeito.posicaoOriginal,
        tokenIndex: sujeito.tokenIndex,
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

  const correcao = await corrigir(tokens, sujeito, infinitivo, conjugado, tempo.tipo as TempoVerbal);

  return {
    tokens,
    sujeito: {
      texto: sujeito.texto,
      pessoa: sujeito.pessoa,
      rotulo: sujeito.rotulo,
      implicito: sujeito.implicito,
      composto: sujeito.composto,
      posicaoOriginal: sujeito.posicaoOriginal,
      tokenIndex: sujeito.tokenIndex,
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

/**
 * Pipeline principal: tokenização → sujeito → tempo → verbo → conjugação → correção.
 * Orações coordenadas (por «e», «ou», «mas», «porém», «então») são segmentadas e analisadas em sequência.
 * @param frase Texto bruto para processar.
 * @param contexto Opções manuais para guiar a análise (ex: tempo verbal).
 */
export async function analisarFrase(
  frase: string,
  contexto?: { tempo?: TempoVerbal }
): Promise<ResultadoAnalise> {
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

  const blocos = segmentarOracoesCoordenadas(tokens);
  if (blocos.length === 1) {
    return analisarOracaoUnica(tokens, contexto);
  }

  const oracoes: ResultadoAnaliseClausula[] = [];
  for (let i = 0; i < blocos.length; i++) {
    const r = await analisarOracaoUnica(blocos[i].tokens, contexto);
    if (r.erro) {
      return {
        tokens,
        sujeito: r.sujeito,
        tempo: r.tempo,
        verbo: r.verbo,
        correcao: "",
        erro: `Oração ${i + 1} de ${blocos.length}: ${r.erro}`,
        debug: r.debug,
      };
    }
    oracoes.push({
      tokens: r.tokens,
      sujeito: r.sujeito,
      tempo: r.tempo,
      verbo: r.verbo,
      correcao: r.correcao,
      debug: r.debug,
    });
  }

  const conectoresEntre = blocos.slice(0, -1).map((b) => b.conectorDepois ?? "e");
  const correcao = juntarCorrecoesOracoes(
    oracoes.map((o) => ({ correcao: o.correcao, sujeito: o.sujeito })),
    conectoresEntre
  );

  const prime = oracoes[0];
  return {
    tokens,
    sujeito: prime.sujeito,
    tempo: prime.tempo,
    verbo: prime.verbo,
    correcao,
    composta: true,
    oracoes,
    debug: {
      etapa1: `Tokens: ${tokens.join(", ")}`,
      etapa2: `Sujeito: ${oracoes.map((o, i) => `(${i + 1}) ${o.sujeito.texto}`).join(" | ")}`,
      etapa3: `Tempo: ${oracoes.map((o, i) => `(${i + 1}) ${o.tempo.tipo}`).join(" | ")}`,
      etapa4: `Verbo: ${oracoes.map((o, i) => `(${i + 1}) ${o.verbo.conjugado}`).join(" | ")}`,
    },
  };
}
