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

  it("«eu mamae gostar» (sem «e») → Nós, ordem eu–mamãe", async () => {
    const r = await detectarSujeito(["eu", "mamae", "gostar", "eles"]);
    expect(r.texto).toBe("Nós");
    expect(r.pessoa).toBe(3);
    expect(r.composto).toBe(true);
  });

  it("«mamãe eu gostar» (sem «e») → Nós, ordem mamãe–eu", async () => {
    const r = await detectarSujeito(["mamãe", "eu", "gostar"]);
    expect(r.texto).toBe("Nós");
    expect(r.composto).toBe(true);
  });

  it("«eu papai comer» → Nós", async () => {
    const r = await detectarSujeito(["eu", "papai", "comer", "pizza"]);
    expect(r.texto).toBe("Nós");
    expect(r.composto).toBe(true);
  });

  it("«eu titio gostar» e «vovo eu comer» → Nós (família, ordem livre)", async () => {
    const a = await detectarSujeito(["eu", "titio", "gostar"]);
    expect(a.texto).toBe("Nós");
    const b = await detectarSujeito(["vovo", "eu", "comer", "arroz"]);
    expect(b.texto).toBe("Nós");
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

  it("«eu ela brincar» (pronomes sem «e») → Nós, pessoa 3", async () => {
    const r = await detectarSujeito(["eu", "ela", "brincar"]);
    expect(r.texto).toBe("Nós");
    expect(r.pessoa).toBe(3);
    expect(r.composto).toBe(true);
  });

  it("«ela ele brincar» → Eles, pessoa 4", async () => {
    const r = await detectarSujeito(["ela", "ele", "brincar"]);
    expect(r.texto).toBe("Eles");
    expect(r.pessoa).toBe(4);
    expect(r.composto).toBe(true);
  });
});

describe("detectarSujeito — ordemSintaticaForcada", () => {
  const forced = { ordemSintaticaForcada: true };

  it("«as crianças correr» → SN plural, pessoa 4 (não insere Eu)", async () => {
    const r = await detectarSujeito(["as", "crianças", "correr"], forced);
    expect(r.implicito).toBe(false);
    expect(r.pessoa).toBe(4);
    expect(r.texto.toLowerCase()).toContain("crianças");
  });

  it("«eu mamãe querer» → Nós (prefixo inteiro = sujeito)", async () => {
    const r = await detectarSujeito(["eu", "mamãe", "querer"], forced);
    expect(r.pessoa).toBe(3);
    expect(r.composto).toBe(true);
  });

  it("«eu querer mamãe» → Eu (mamãe fica no predicado)", async () => {
    const r = await detectarSujeito(["eu", "querer", "mamãe"], forced);
    expect(r.texto).toBe("Eu");
    expect(r.pessoa).toBe(0);
    expect(r.implicito).toBe(false);
  });

  it("«querer mamãe» → implícito Eu (não promove mamãe a sujeito)", async () => {
    const r = await detectarSujeito(["querer", "mamãe"], forced);
    expect(r.implicito).toBe(true);
    expect(r.pessoa).toBe(0);
  });

  it("por omissão, «querer mamãe» não promove mamãe (SVO desligado)", async () => {
    const r = await detectarSujeito(["querer", "mamãe"]);
    expect(r.implicito).toBe(true);
    expect(r.pessoa).toBe(0);
  });

  it("com SVO, «querer mamãe» acha mamãe após o verbo", async () => {
    const r = await detectarSujeito(["querer", "mamãe"], { normalizarSVO: true });
    expect(r.implicito).not.toBe(true);
    expect(r.posicaoOriginal).toBe("depois");
  });

  it("«a gente comer» → 3ª sg", async () => {
    const r = await detectarSujeito(["a", "gente", "comer"], forced);
    expect(r.pessoa).toBe(2);
    expect(r.implicito).toBe(false);
  });

  it("«o menino correr» → 3ª sg", async () => {
    const r = await detectarSujeito(["o", "menino", "correr"], forced);
    expect(r.pessoa).toBe(2);
    expect(r.implicito).toBe(false);
  });

  it("«nos querer» (sem acento) → Nós, não implícito Eu", async () => {
    const r = await detectarSujeito(["nos", "querer", "pizza"], forced);
    expect(r.implicito).not.toBe(true);
    expect(r.pessoa).toBe(3);
    expect(r.texto).toBe("Nós");
  });
});
