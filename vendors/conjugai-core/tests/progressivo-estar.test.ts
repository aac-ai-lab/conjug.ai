import { describe, expect, it } from "vitest";
import { analisarFrase } from "../index";
import { resolverConjugacaoProgressivaEstar } from "../progressivo-estar";

describe("resolverConjugacaoProgressivaEstar", () => {
  it("mapeia passado → imperfeito do auxiliar + gerúndio", () => {
    const r = resolverConjugacaoProgressivaEstar(
      ["Eu", "estar", "brincar"],
      "estar",
      0,
      "passado"
    );
    expect(r?.conjugado).toBe("estava brincando");
    expect(r?.omitirIndices.has(2)).toBe(true);
  });

  it("aceita «estar a brincar» (omite «a» e o infinitivo)", () => {
    const r = resolverConjugacaoProgressivaEstar(
      ["Eu", "estar", "a", "brincar"],
      "estar",
      0,
      "presente"
    );
    expect(r?.conjugado).toBe("estou brincando");
    expect(r?.omitirIndices.has(2)).toBe(true);
    expect(r?.omitirIndices.has(3)).toBe(true);
  });
});

describe("analisarFrase — progressiva estar + V", () => {
  it("com tempo passado (Ontem) → estava + gerúndio, sem infinitivo solto; dependente «quando ela chegar» → chegou", async () => {
    const r = await analisarFrase("Eu estar brincar quando ela chegar", { tempo: "passado" });
    expect(r.correcao.toLowerCase()).toMatch(/estava brincando/);
    expect(r.correcao.toLowerCase()).toMatch(/quando ela chegou/);
    expect(r.correcao.toLowerCase()).not.toMatch(/brincar/);
    expect(r.correcao.toLowerCase()).not.toMatch(/estive brincar/);
  });

  it("com presente, mantém «quando ela chegar»", async () => {
    const r = await analisarFrase("Eu estar brincar quando ela chegar", { tempo: "presente" });
    expect(r.correcao.toLowerCase()).toMatch(/quando ela chegar/);
  });

  it("futuro → estarei + gerúndio", async () => {
    const r = await analisarFrase("eu estar brincar", { tempo: "futuro" });
    expect(r.correcao.toLowerCase()).toMatch(/estarei brincando/);
  });

  it("presente → estou + gerúndio", async () => {
    const r = await analisarFrase("Eu estar brincar", { tempo: "presente" });
    expect(r.correcao.toLowerCase()).toMatch(/estou brincando/);
  });
});
