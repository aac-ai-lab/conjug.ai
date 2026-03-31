import { describe, expect, it } from "vitest";
import { analisarFrase } from "../index";

describe("Temporal Context and Overrides", () => {
  it("deve priorizar o contexto manual de tempo (passado)", async () => {
    // Frase que seria presente por padrão
    const resultado = await analisarFrase("Eu comer maçã", { tempo: "passado" });
    
    expect(resultado.tempo.tipo).toBe("passado");
    expect(resultado.correcao).toContain("comi");
  });

  it("deve priorizar o contexto manual de tempo (futuro)", async () => {
    const resultado = await analisarFrase("Eu comer maçã", { tempo: "futuro" });
    
    expect(resultado.tempo.tipo).toBe("futuro");
    expect(resultado.correcao).toContain("comerei");
  });

  it("deve detectar 'ontem' corretamente e conjugar no passado (bug fix)", async () => {
    // Caso reportado pelo usuário: "Ele ver elas partir ontem"
    const resultado = await analisarFrase("Ele ver elas partir ontem");
    
    expect(resultado.tempo.tipo).toBe("passado");
    expect(resultado.correcao).toContain("viu");
    // "viu elas partir ontem" ou "viu-as partir ontem" dependendo da normalização, 
    // mas o foco aqui é o tempo do verbo principal.
  });

  it("deve detectar 'amanhã' corretamente e conjugar no futuro", async () => {
    const resultado = await analisarFrase("Ele ver elas partir amanhã");
    
    expect(resultado.tempo.tipo).toBe("futuro");
    expect(resultado.correcao).toContain("verá");
  });

  it("deve manter presente se não houver marcador nem contexto", async () => {
    const resultado = await analisarFrase("Ele comer maçã");
    
    expect(resultado.tempo.tipo).toBe("presente");
    expect(resultado.correcao).toContain("come");
  });
});
