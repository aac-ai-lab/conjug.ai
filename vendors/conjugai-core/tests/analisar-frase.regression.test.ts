import { describe, expect, it } from "vitest";
import { analisarFrase } from "../index";

/** Frases usadas na UI e casos críticos do pipeline — alterações no motor devem atualizar expectativas com critério. */
const CASOS = [
  {
    frase: "Eu comer maçã",
    esperado: {
      tokens: ["Eu", "comer", "maçã"],
      sujeito: "Eu",
      tempo: "presente" as const,
      infinitivo: "comer",
      conjugado: "como",
      correcao: "Eu como maçã",
    },
  },
  {
    frase: "Ele viajar ontem",
    esperado: {
      sujeito: "Ele",
      tempo: "passado" as const,
      infinitivo: "viajar",
      conjugado: "viajou",
      correcao: "Ele viajou ontem",
    },
  },
  {
    frase: "Mamãe e eu ir shopping amanhã",
    esperado: {
      sujeito: "Nós",
      tempo: "futuro" as const,
      infinitivo: "ir",
      conjugado: "iremos",
      correcao: "Mamãe e eu iremos ao shopping amanhã",
    },
  },
  {
    frase: "Vou viajar amanhã",
    esperado: {
      tempo: "presente" as const,
      infinitivo: "ir",
      conjugado: "vou",
    },
  },
  {
    frase: "Fazer jantar",
    esperado: {
      sujeito: "Eu",
      implicito: true,
      infinitivo: "fazer",
      tempo: "presente" as const,
    },
  },
  {
    frase: "Nós ir escola amanhã",
    esperado: {
      sujeito: "Nós",
      tempo: "futuro" as const,
      infinitivo: "ir",
      conjugado: "iremos",
      correcao: "Nós iremos à escola amanhã",
    },
  },
  {
    frase: "Nós ir trabalho amanhã",
    esperado: {
      sujeito: "Nós",
      tempo: "futuro" as const,
      infinitivo: "ir",
      conjugado: "iremos",
      correcao: "Nós iremos ao trabalho amanhã",
    },
  },
  {
    frase: "Eu ir praia",
    esperado: {
      sujeito: "Eu",
      tempo: "presente" as const,
      infinitivo: "ir",
      conjugado: "vou",
      correcao: "Eu vou à praia",
    },
  },
  {
    frase: "Ana e Pedro viajar praia",
    esperado: {
      sujeito: "Eles",
      tempo: "presente" as const,
      infinitivo: "viajar",
      conjugado: "viajam",
      correcao: "Ana e Pedro viajam à praia",
    },
  },
  {
    frase: "Eu comer e ele dormir",
    esperado: {
      composta: true,
      oracoes: 2,
      correcao: "Eu como e ele dorme",
    },
  },
  {
    frase: "Eu comer pizza e dormir",
    esperado: {
      composta: true,
      oracoes: 2,
      correcao: "Eu como pizza e durmo",
    },
  },
  {
    frase: "Eu comer mas ele dormir",
    esperado: {
      composta: true,
      oracoes: 2,
      correcao: "Eu como mas ele dorme",
    },
  },
];

describe("analisarFrase — regressão (integração)", () => {
  it("frase vazia → erro amigável", async () => {
    const r = await analisarFrase("   ");
    expect(r.erro).toBeTruthy();
    expect(r.tokens).toEqual([]);
  });

  it("sem verbo reconhecível → erro", async () => {
    const r = await analisarFrase("Eu qqqqqwwwww rrrrrrrrr");
    expect(r.erro).toBeTruthy();
    expect(r.verbo.infinitivo).toBe("");
  });

  for (const c of CASOS) {
    it(`«${c.frase}»`, async () => {
      const r = await analisarFrase(c.frase);
      expect(r.erro, r.erro).toBeUndefined();
      const e = c.esperado;
      if (e.tokens) expect(r.tokens).toEqual(e.tokens);
      if (e.sujeito) expect(r.sujeito.texto).toBe(e.sujeito);
      if (e.implicito !== undefined) expect(r.sujeito.implicito).toBe(e.implicito);
      if (e.tempo) expect(r.tempo.tipo).toBe(e.tempo);
      if (e.infinitivo) expect(r.verbo.infinitivo).toBe(e.infinitivo);
      if (e.conjugado) expect(r.verbo.conjugado).toBe(e.conjugado);
      if (e.correcao) expect(r.correcao).toBe(e.correcao);
      if ("composta" in e && e.composta !== undefined) expect(r.composta).toBe(e.composta);
      if ("oracoes" in e && typeof e.oracoes === "number") expect(r.oracoes?.length).toBe(e.oracoes);
    });
  }

  it("«Eu comer ou ele dormir» + tempo manual futuro (coordenação disjuntiva)", async () => {
    const r = await analisarFrase("Eu comer ou ele dormir", { tempo: "futuro" });
    expect(r.erro).toBeUndefined();
    expect(r.composta).toBe(true);
    expect(r.correcao).toBe("Eu comerei ou ele dormirá");
  });
});
