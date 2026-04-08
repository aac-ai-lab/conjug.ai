import { describe, expect, it } from "vitest";
import { analisarFrase } from "../index";
import {
  detectarLocucaoVerbalHeadLemma,
  detectarVerboPorDicionario,
  extrairVerbo,
} from "../conjugador";

describe("detectarLocucaoVerbalHeadLemma / extrairVerbo", () => {
  it("«ter que» + infinitivo → lema ter (não o segundo verbo)", () => {
    expect(detectarLocucaoVerbalHeadLemma(["Tenho", "que", "comer"])).toBe("ter");
    expect(extrairVerbo(["Tenho", "que", "comer"])).toBe("ter");
    expect(extrairVerbo(["Eu", "ter", "que", "comer", "maçã"])).toBe("ter");
  });

  it("«ter de» + infinitivo → ter", () => {
    expect(extrairVerbo(["Eu", "ter", "de", "sair"])).toBe("ter");
  });

  it("«poder» / «dever» + verbo → núcleo modal", () => {
    expect(extrairVerbo(["Eu", "poder", "nadar"])).toBe("poder");
    expect(extrairVerbo(["Ela", "dever", "estudar"])).toBe("dever");
  });

  it("«começar a» + infinitivo → começar", () => {
    expect(extrairVerbo(["Eu", "começar", "a", "trabalhar"])).toBe("começar");
  });

  it("«Posso nadar»: «posso» colide com «possar» no léxico; locução força lema «poder»", () => {
    expect(detectarVerboPorDicionario(["Posso"])).toBe("possar");
    expect(detectarLocucaoVerbalHeadLemma(["Posso", "nadar"])).toBe("poder");
    expect(extrairVerbo(["Posso", "nadar"])).toBe("poder");
  });
});

describe("analisarFrase — locuções verbais (integração)", () => {
  it("«Eu ter que comer maçã»", async () => {
    const r = await analisarFrase("Eu ter que comer maçã");
    expect(r.erro).toBeUndefined();
    expect(r.verbo.infinitivo).toBe("ter");
    expect(r.verbo.conjugado).toBe("tenho");
    expect(r.correcao).toBe("Eu tenho que comer maçã");
  });

  it("«Tenho que comer maçã» (forma já flexionada)", async () => {
    const r = await analisarFrase("Tenho que comer maçã");
    expect(r.erro).toBeUndefined();
    expect(r.verbo.infinitivo).toBe("ter");
    expect(r.correcao).toMatch(/^Eu tenho que comer maçã$/i);
  });

  it("«Posso nadar»", async () => {
    const r = await analisarFrase("Posso nadar");
    expect(r.erro).toBeUndefined();
    expect(r.verbo.infinitivo).toBe("poder");
    expect(r.correcao).toMatch(/^Eu posso nadar$/i);
  });
});
