import { describe, expect, it } from "vitest";
import {
  conjugar,
  conjugarPessoaTabela,
  conjugarTempo,
  detectarVerboPorDicionario,
  extrairVerbo,
  gerundio,
  indiceDoVerboNaFrase,
  isVerbShape,
  participio,
} from "../conjugador";

describe("isVerbShape", () => {
  it("reconhece infinitivos -ar/-er/-ir", () => {
    expect(isVerbShape("comer")).toBe(true);
    expect(isVerbShape("viajar")).toBe(true);
    expect(isVerbShape("partir")).toBe(true);
  });

  it("rejeita substantivo comum", () => {
    expect(isVerbShape("comida")).toBe(false);
  });
});

describe("extrairVerbo", () => {
  it("prioriza forma do léxico", () => {
    expect(extrairVerbo(["Eu", "como", "maçã"])).toBe("comer");
  });

  it("infinitivo literal na frase", () => {
    expect(extrairVerbo(["Eu", "comer", "maçã"])).toBe("comer");
  });

  it("heurística de sufixo quando fora do léxico", () => {
    expect(extrairVerbo(["Eu", "cantar", "hoje"])).toBe("cantar");
  });

  it("subordinação: infinitivo após «que» (não o da matriz)", () => {
    expect(extrairVerbo(["Ele", "dizer", "que", "eles", "falar", "muito"])).toBe("falar");
    expect(extrairVerbo(["Ele", "disse", "que", "eles", "falar", "muito"])).toBe("falar");
  });

  it("«ter que» continua a priorizar «ter»", () => {
    expect(extrairVerbo(["Eu", "ter", "que", "dizer", "que", "eles", "falar"])).toBe("ter");
  });
});

describe("detectarVerboPorDicionario", () => {
  it("mapeia forma conjugada → lema", () => {
    expect(detectarVerboPorDicionario(["vou", "lá"])).toBe("ir");
  });
});

describe("indiceDoVerboNaFrase", () => {
  it("encontra índice do infinitivo", () => {
    expect(indiceDoVerboNaFrase(["Eu", "comer", "maçã"], "comer")).toBe(1);
  });
});

describe("conjugar", () => {
  it("léxico: comer presente 1ª sg", () => {
    expect(conjugar("comer", 0, "presente")).toBe("como");
  });

  it("léxico: comer futuro 1ª sg", () => {
    expect(conjugar("comer", 0, "futuro")).toBe("comerei");
  });

  it("regular: cantar presente (fora do léxico)", () => {
    expect(conjugar("cantar", 2, "presente")).toBe("canta");
  });

  it("futuro sem lema no léxico → null", () => {
    expect(conjugar("verboinexistentexyz", 0, "futuro")).toBeNull();
  });

  it("léxico: comer subjuntivo presente 1ª sg", () => {
    expect(conjugar("comer", 0, "subjuntivo_presente")).toBe("coma");
  });

  it("léxico: gerúndio e particípio de comer", () => {
    expect(gerundio("comer")).toBe("comendo");
    expect(participio("comer", "m", "sg")).toBe("comido");
    expect(participio("comer", "f", "pl")).toBe("comidas");
  });

  it("conjugarTempo: pretérito perfeito composto", () => {
    expect(conjugarTempo("comer", 0, "preterito_perfeito_composto")).toBe("tenho comido");
  });

  it("conjugarTempo: infinitivo e particípio", () => {
    expect(conjugarTempo("comer", 0, "infinitivo")).toBe("comer");
    expect(conjugarTempo("comer", 0, "participio")).toBe("comido");
  });

  it("conjugarPessoaTabela: vós em tempos simples", () => {
    expect(conjugarPessoaTabela("comer", 4, "presente")).toBe("comeis");
    expect(conjugarPessoaTabela("comer", 4, "futuro")).toBe("comereis");
  });

  it("conjugarPessoaTabela: vós em tempos compostos", () => {
    expect(conjugarPessoaTabela("comer", 4, "preterito_perfeito_composto")).toBe("tendes comido");
    expect(conjugarPessoaTabela("comer", 4, "futuro_composto")).toBe("tereis comido");
  });
});
