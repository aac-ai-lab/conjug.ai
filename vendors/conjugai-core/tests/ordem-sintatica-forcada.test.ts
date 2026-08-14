import { describe, expect, it } from "vitest";
import { analisarFrase } from "../index";

describe("analisarFrase — ordemSintaticaForcada", () => {
  const ctx = { ordemSintaticaForcada: true as const };

  it("«as crianças correr» → 3ª pl, sem Eu inserido", async () => {
    const r = await analisarFrase("as crianças correr", ctx);
    expect(r.erro).toBeUndefined();
    expect(r.sujeito.implicito).toBe(false);
    expect(r.sujeito.pessoa).toBe(4);
    expect(r.verbo.conjugado.toLowerCase()).toBe("correm");
    expect(r.correcao.toLowerCase()).not.toMatch(/\beu\b/);
    expect(r.correcao.toLowerCase()).toContain("correm");
  });

  it("«eu mamãe querer» → queremos (co-sujeito pela posição)", async () => {
    const r = await analisarFrase("eu mamãe querer", ctx);
    expect(r.sujeito.pessoa).toBe(3);
    expect(r.verbo.conjugado.toLowerCase()).toBe("queremos");
  });

  it("«eu querer mamãe» → quero (mamãe no predicado)", async () => {
    const r = await analisarFrase("eu querer mamãe", ctx);
    expect(r.sujeito.pessoa).toBe(0);
    expect(r.verbo.conjugado.toLowerCase()).toBe("quero");
    expect(r.correcao.toLowerCase()).toContain("mamãe");
  });

  it("«querer mamãe» → Eu quero mamãe (não «Mamãe quer»)", async () => {
    const r = await analisarFrase("querer mamãe", ctx);
    expect(r.sujeito.implicito).toBe(true);
    expect(r.verbo.conjugado.toLowerCase()).toBe("quero");
    expect(r.correcao.toLowerCase()).toMatch(/quero/);
    expect(r.correcao.toLowerCase()).toContain("mamãe");
  });

  it("por omissão, «querer mamãe» não promove mamãe (SVO desligado)", async () => {
    const r = await analisarFrase("querer mamãe");
    expect(r.sujeito.implicito).toBe(true);
    expect(r.correcao.toLowerCase()).toMatch(/quero/);
  });

  it("com SVO, «querer mamãe» promove mamãe a sujeito e reordena", async () => {
    const r = await analisarFrase("querer mamãe", { normalizarSVO: true });
    expect(r.sujeito.posicaoOriginal).toBe("depois");
    expect(r.correcao.toLowerCase()).toMatch(/quer/);
    expect(r.correcao.toLowerCase()).toMatch(/^mamãe/);
  });

  it("com SVO, «comer eu maçã» → Eu como maçã", async () => {
    const r = await analisarFrase("comer eu maçã", { normalizarSVO: true });
    expect(r.sujeito.pessoa).toBe(0);
    expect(r.correcao).toBe("Eu como maçã");
  });

  it("«a gente comer» → come (3ª sg)", async () => {
    const r = await analisarFrase("a gente comer", ctx);
    expect(r.sujeito.pessoa).toBe(2);
    expect(r.verbo.conjugado.toLowerCase()).toBe("come");
  });

  it("frase canónica «Eu comer maçã» não muda", async () => {
    const r = await analisarFrase("Eu comer maçã", ctx);
    expect(r.correcao).toBe("Eu como maçã");
  });

  it("«nos querer pizza» → Nós queremos pizza (não «Eu nos quero»)", async () => {
    const r = await analisarFrase("nos querer pizza", ctx);
    expect(r.sujeito.implicito).not.toBe(true);
    expect(r.sujeito.pessoa).toBe(3);
    expect(r.verbo.conjugado.toLowerCase()).toBe("queremos");
    expect(r.correcao.toLowerCase()).not.toMatch(/\beu\b/);
    expect(r.correcao.toLowerCase()).toMatch(/queremos/);
  });
});
