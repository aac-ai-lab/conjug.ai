import { describe, expect, it } from "vitest";
import { analisarFrase } from "../index";

describe("Robson — inserção indevida de «eu»", () => {
  it("«a gente querer pizza» → A gente quer pizza (sem Eu, 3ª sg)", async () => {
    const r = await analisarFrase("a gente querer pizza");
    expect(r.sujeito.implicito).not.toBe(true);
    expect(r.sujeito.pessoa).toBe(2);
    expect(r.correcao.toLowerCase()).not.toMatch(/\beu\b/);
    expect(r.verbo.conjugado.toLowerCase()).toBe("quer");
    expect(r.correcao).toBe("A gente quer pizza");
  });

  it("«Pedro poder sair» → Pedro pode sair (sem Eu)", async () => {
    const r = await analisarFrase("Pedro poder sair");
    expect(r.sujeito.implicito).not.toBe(true);
    expect(r.sujeito.pessoa).toBe(2);
    expect(r.correcao.toLowerCase()).not.toMatch(/\beu\b/);
    expect(r.verbo.infinitivo).toBe("poder");
    expect(r.verbo.conjugado.toLowerCase()).toBe("pode");
    expect(r.correcao).toBe("Pedro pode sair");
  });

  it("«as crianças correr na rua» → As crianças correm na rua (sem Eu)", async () => {
    const r = await analisarFrase("as crianças correr na rua");
    expect(r.sujeito.implicito).not.toBe(true);
    expect(r.sujeito.pessoa).toBe(4);
    expect(r.correcao.toLowerCase()).not.toMatch(/\beu\b/);
    expect(r.correcao).toBe("As crianças correm na rua");
  });

  it("«a mãe comer» e «os meninos brincar» sem Eu", async () => {
    const mae = await analisarFrase("a mãe comer");
    expect(mae.sujeito.implicito).not.toBe(true);
    expect(mae.correcao.toLowerCase()).not.toMatch(/\beu\b/);
    expect(mae.verbo.conjugado.toLowerCase()).toBe("come");

    const meninos = await analisarFrase("os meninos brincar");
    expect(meninos.sujeito.pessoa).toBe(4);
    expect(meninos.correcao.toLowerCase()).not.toMatch(/\beu\b/);
    expect(meninos.verbo.conjugado.toLowerCase()).toBe("brincam");
  });

  it("«fazer jantar» continua implícito Eu (telegrafia sem sujeito)", async () => {
    const r = await analisarFrase("fazer jantar");
    expect(r.sujeito.implicito).toBe(true);
    expect(r.sujeito.pessoa).toBe(0);
  });
});

describe("Robson — você + irregular ( MorphoBr truncado )", () => {
  it("«você fazer» + passado → Você fez", async () => {
    const r = await analisarFrase("você fazer", { tempo: "passado" });
    expect(r.verbo.conjugado.toLowerCase()).toBe("fez");
    expect(r.correcao).toBe("Você fez");
  });

  it("«você fazer bolo» → Você faz bolo", async () => {
    const r = await analisarFrase("você fazer bolo");
    expect(r.verbo.conjugado.toLowerCase()).toBe("faz");
    expect(r.correcao.toLowerCase()).toContain("faz");
    expect(r.correcao.toLowerCase()).not.toMatch(/\bfá\b/);
  });
});
