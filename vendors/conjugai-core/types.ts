/** Pessoa gramatical (0–4): eu, tu, ele/ela, nós, eles. */
export type PessoaIndice = 0 | 1 | 2 | 3 | 4;
/** Pessoa gramatical para tabelas completas (0–5): eu, tu, ele/ela, nós, vós, eles/elas. */
export type PessoaIndiceTabela = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Tempos/modos com paradigma de 5 pessoas no `verbos.json` (MorphoBr → JSON).
 * Deteção na frase (CAA) usa sobretudo presente | futuro | passado.
 */
export type TempoVerbal =
  | "presente"
  | "futuro"
  | "passado"
  | "preterito_imperfeito"
  | "preterito_mais_que_perfeito"
  | "condicional"
  | "subjuntivo_presente"
  | "subjuntivo_imperfeito"
  | "subjuntivo_futuro"
  | "imperativo"
  | "infinitivo_pessoal"
  | "infinitivo"
  | "gerundio"
  | "participio"
  | "preterito_perfeito_composto"
  | "preterito_mais_que_perfeito_composto"
  | "preterito_mais_que_perfeito_anterior"
  | "futuro_composto"
  | "futuro_do_preterito_composto"
  | "subjuntivo_preterito_perfeito"
  | "subjuntivo_preterito_mais_que_perfeito"
  | "subjuntivo_futuro_composto"
  | "infinitivo_pessoal_composto";

export type GeneroParticipio = "m" | "f";
export type NumeroParticipio = "sg" | "pl";

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
