/** Pessoa gramatical (0–4): eu, tu, ele/ela, nós, eles. */
export type PessoaIndice = 0 | 1 | 2 | 3 | 4;

export type TempoVerbal = "presente" | "futuro" | "passado";

export type ResultadoAnalise = {
  tokens: string[];
  sujeito: {
    texto: string;
    pessoa: number;
    rotulo?: string;
    implicito?: boolean;
    composto?: boolean;
  };
  tempo: {
    tipo: string;
  };
  verbo: {
    infinitivo: string;
    conjugado: string;
  };
  correcao: string;
  debug: {
    etapa1: string;
    etapa2: string;
    etapa3: string;
    etapa4: string;
  };
  /** Preenchido quando a análise não pôde completar (ex.: sem infinitivo). */
  erro?: string;
};
