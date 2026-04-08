import { describe, expect, it } from "vitest";
import { detectarSujeito, detectarSujeitoComposto } from "../sujeito";

describe("detectarSujeitoComposto", () => {
  it("«Mamãe e eu ir» → Nós, pessoa 3", () => {
    const r = detectarSujeitoComposto(["Mamãe", "e", "eu", "ir", "shopping"]);
    expect(r).not.toBeNull();
    expect(r!.texto).toBe("Nós");
    expect(r!.pessoa).toBe(3);
    expect(r!.composto).toBe(true);
  });

  it("«Ana e Pedro viajar» → Eles, pessoa 4", () => {
    const r = detectarSujeitoComposto(["Ana", "e", "Pedro", "viajar"]);
    expect(r).not.toBeNull();
    expect(r!.texto).toBe("Eles");
    expect(r!.pessoa).toBe(4);
  });
});

describe("detectarSujeito", () => {
  it("«eu» explícito → Eu, pessoa 0", async () => {
    const r = await detectarSujeito(["Eu", "comer", "maçã"]);
    expect(r.texto).toBe("Eu");
    expect(r.pessoa).toBe(0);
    expect(r.implicito).toBe(false);
  });

  it("sem pronome → implícito Eu", async () => {
    const r = await detectarSujeito(["comer", "pizza"]);
    expect(r.texto).toBe("Eu");
    expect(r.pessoa).toBe(0);
    expect(r.implicito).toBe(true);
  });

  it("«Ele» → pessoa 2", async () => {
    const r = await detectarSujeito(["Ele", "viajar"]);
    expect(r.texto).toBe("Ele");
    expect(r.pessoa).toBe(2);
  });

  it("prioriza composto «Mamãe e eu…» via regra especial", async () => {
    const r = await detectarSujeito(["Mamãe", "e", "eu", "ir"]);
    expect(r.texto).toBe("Nós");
    expect(r.composto).toBe(true);
  });

  it("«Ele disse que eles falar» → sujeito Eles (não Ele)", async () => {
    const r = await detectarSujeito(["Ele", "disse", "que", "eles", "falar", "muito"]);
    expect(r.texto).toBe("Eles");
    expect(r.pessoa).toBe(4);
  });

  it("«Eu sei que tu comer» → sujeito Tu", async () => {
    const r = await detectarSujeito(["Eu", "sei", "que", "tu", "comer"]);
    expect(r.texto).toBe("Tu");
    expect(r.pessoa).toBe(1);
  });
});
