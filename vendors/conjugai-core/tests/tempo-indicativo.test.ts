import { describe, expect, it } from "vitest";
import { analisarFrase } from "../index";
import { detectarTempo } from "../tempo";

describe("detectarTempo — indicativo (perfeito/imperfeito, futuro/condicional)", () => {
  it("«antigamente» → pretérito imperfeito", async () => {
    const r = await detectarTempo(["Eu", "brincar", "antigamente"]);
    expect(r.tipo).toBe("preterito_imperfeito");
  });

  it("«enquanto» → pretérito imperfeito", async () => {
    const r = await detectarTempo(["Eu", "estudar", "enquanto"]);
    expect(r.tipo).toBe("preterito_imperfeito");
  });

  it("«sempre» sem passado → presente (não imperfeito)", async () => {
    const r = await detectarTempo(["Eu", "comer", "sempre"]);
    expect(r.tipo).toBe("presente");
  });

  it("«sempre» + «ontem» → pretérito imperfeito", async () => {
    const r = await detectarTempo(["Eu", "estudar", "sempre", "ontem"]);
    expect(r.tipo).toBe("preterito_imperfeito");
  });

  it("macro passado manual + «sempre» → pretérito imperfeito", async () => {
    const r = await detectarTempo(["Eu", "estudar", "sempre"], "passado");
    expect(r.tipo).toBe("preterito_imperfeito");
  });

  it("«ontem» → pretérito perfeito (passado)", async () => {
    const r = await detectarTempo(["Eu", "estudar", "ontem"]);
    expect(r.tipo).toBe("passado");
  });

  it("«disse que» → condicional", async () => {
    const r = await detectarTempo(["Ele", "disse", "que", "estudar"]);
    expect(r.tipo).toBe("condicional");
  });

  it("«gostaria» → condicional", async () => {
    const r = await detectarTempo(["Eu", "gostaria", "estudar"]);
    expect(r.tipo).toBe("condicional");
  });

  it("«se» + forma -ria → condicional (antes de subjuntivo)", async () => {
    const r = await detectarTempo(["Se", "tivesse", "tempo", "eu", "estudaria"]);
    expect(r.tipo).toBe("condicional");
  });

  it("«amanhã» → futuro do presente", async () => {
    const r = await detectarTempo(["Eu", "estudar", "amanhã"]);
    expect(r.tipo).toBe("futuro");
  });
});

describe("analisarFrase — refinamento de macro-tempos", () => {
  it("macro passado + «sempre» conjuga no imperfeito", async () => {
    const r = await analisarFrase("Eu estudar sempre", { tempo: "passado" });
    expect(r.tempo.tipo).toBe("preterito_imperfeito");
    expect(r.correcao).toMatch(/estudava/i);
  });

  it("«Ele disse que eu estudar» → condicional na dependente", async () => {
    const r = await analisarFrase("Ele disse que eu estudar");
    expect(r.tempo.tipo).toBe("condicional");
    expect(r.correcao).toMatch(/estudaria/i);
  });
});
