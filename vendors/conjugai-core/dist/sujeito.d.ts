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
/**
 * Sujeito composto com padrão **X e Y** antes do verbo (telegrafia).
 * — contém **eu** → 1.ª plural (Nós);
 * — contém **tu** ou **você** → Vocês (pessoa verbal 4, como *eles* em PT-BR);
 * — caso contrário (ex.: *João e Maria*, *meu pai e minha mãe*) → Eles.
 */
export declare function detectarSujeitoComposto(tokens: string[]): InfoSujeito | null;
/**
 * Identifica sujeito e pessoa (0–4).
 * Tenta primeiro sujeito composto (**X e Y** antes do verbo);
 * depois procura pronomes ou nomes em qualquer posição (bidirecional).
 */
export declare function detectarSujeito(tokens: string[]): Promise<InfoSujeito>;
