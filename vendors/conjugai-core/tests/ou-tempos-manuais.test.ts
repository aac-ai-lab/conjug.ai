import { describe, expect, it } from "vitest";
import { analisarFrase } from "../index";

/** «Eu comer ou ele dormir» com tempo manual na UI (Hoje / Ontem / Amanhã). */
describe("Coordenação «ou» + tempo manual", () => {
  const frase = "Eu comer ou ele dormir";

  it("presente (Hoje)", async () => {
    const r = await analisarFrase(frase, { tempo: "presente" });
    expect(r.erro).toBeUndefined();
    expect(r.composta).toBe(true);
    expect(r.correcao).toBe("Eu como ou ele dorme");
  });

  it("passado (Ontem)", async () => {
    const r = await analisarFrase(frase, { tempo: "passado" });
    expect(r.erro).toBeUndefined();
    expect(r.composta).toBe(true);
    expect(r.correcao).toBe("Eu comi ou ele dormiu");
  });

  it("futuro (Amanhã)", async () => {
    const r = await analisarFrase(frase, { tempo: "futuro" });
    expect(r.erro).toBeUndefined();
    expect(r.composta).toBe(true);
    expect(r.correcao).toBe("Eu comerei ou ele dormirá");
  });
});
