import { describe, expect, it } from "vitest";
import { tokenize } from "../../vendors/nlp-pt-br-lite/src/index";

describe("tokenize", () => {
  it("divide por um ou mais espaços", () => {
    expect(tokenize("Eu  comer   maçã")).toEqual(["Eu", "comer", "maçã"]);
  });

  it("remove pontuação final simples de cada token", () => {
    expect(tokenize("Eu comer maçã.")).toEqual(["Eu", "comer", "maçã"]);
    expect(tokenize("Olá, mundo!")).toEqual(["Olá", "mundo"]);
  });

  it("faz trim da frase inteira", () => {
    expect(tokenize("  a b  ")).toEqual(["a", "b"]);
  });

  it("frase vazia → lista vazia", () => {
    expect(tokenize("")).toEqual([]);
    expect(tokenize("   ")).toEqual([]);
  });
});
