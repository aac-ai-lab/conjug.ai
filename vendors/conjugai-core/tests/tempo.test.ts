import { describe, expect, it } from "vitest";
import { detectarTempo } from "../tempo";

describe("detectarTempo", () => {
  it("tag explícita seleciona tempo", async () => {
    const r = await detectarTempo(["Eu", "comer", "[tempo=subjuntivo_futuro]"]);
    expect(r.tipo).toBe("subjuntivo_futuro");
  });

  it("«ontem» + «já» → pretérito perfeito composto", async () => {
    const r = await detectarTempo(["Eu", "comer", "ontem", "já"]);
    expect(r.tipo).toBe("preterito_perfeito_composto");
    expect(r.rotulo.toLowerCase()).toContain("passado");
  });

  it("«ontem» → passado", async () => {
    const r = await detectarTempo(["Ele", "viajar", "ontem"]);
    expect(r.tipo).toBe("passado");
    expect(r.rotulo.toLowerCase()).toContain("passado");
  });

  it("«amanhã» sem perífrase de ir → futuro", async () => {
    const r = await detectarTempo(["Ela", "fazer", "bolo", "amanhã"]);
    expect(r.tipo).toBe("futuro");
  });

  it("«vou» + «amanhã» (perífrase) → presente no verbo suporte", async () => {
    const r = await detectarTempo(["Vou", "viajar", "amanhã"]);
    expect(r.tipo).toBe("presente");
    expect(r.rotulo.toLowerCase()).toMatch(/perífrase|amanhã/i);
  });

  it("sem marcadores → presente", async () => {
    const r = await detectarTempo(["Eu", "comer", "maçã"]);
    expect(r.tipo).toBe("presente");
  });
});
