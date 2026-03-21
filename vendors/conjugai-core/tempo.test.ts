import { describe, expect, it } from "vitest";
import { detectarTempo } from "./tempo";

describe("detectarTempo", () => {
  it("«ontem» → passado", () => {
    const r = detectarTempo(["Ele", "viajar", "ontem"]);
    expect(r.tipo).toBe("passado");
    expect(r.rotulo.toLowerCase()).toContain("ontem");
  });

  it("«amanhã» sem perífrase de ir → futuro", () => {
    const r = detectarTempo(["Ela", "fazer", "bolo", "amanhã"]);
    expect(r.tipo).toBe("futuro");
  });

  it("«vou» + «amanhã» (perífrase) → presente no verbo suporte", () => {
    const r = detectarTempo(["Vou", "viajar", "amanhã"]);
    expect(r.tipo).toBe("presente");
    expect(r.rotulo.toLowerCase()).toMatch(/perífrase|amanhã/i);
  });

  it("sem marcadores → presente", () => {
    const r = detectarTempo(["Eu", "comer", "maçã"]);
    expect(r.tipo).toBe("presente");
  });
});
