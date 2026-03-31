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
  it("«eu» explícito → Eu, pessoa 0", () => {
    const r = detectarSujeito(["Eu", "comer", "maçã"]);
    expect(r.texto).toBe("Eu");
    expect(r.pessoa).toBe(0);
    expect(r.implicito).toBe(false);
  });

  it("sem pronome → implícito Eu", () => {
    const r = detectarSujeito(["comer", "pizza"]);
    expect(r.texto).toBe("Eu");
    expect(r.pessoa).toBe(0);
    expect(r.implicito).toBe(true);
  });

  it("«Ele» → pessoa 2", () => {
    const r = detectarSujeito(["Ele", "viajar"]);
    expect(r.texto).toBe("Ele");
    expect(r.pessoa).toBe(2);
  });

  it("prioriza composto «Mamãe e eu…» via regra especial", () => {
    const r = detectarSujeito(["Mamãe", "e", "eu", "ir"]);
    expect(r.texto).toBe("Nós");
    expect(r.composto).toBe(true);
  });
});
