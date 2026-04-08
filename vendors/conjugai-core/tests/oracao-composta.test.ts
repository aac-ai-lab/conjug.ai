import { describe, expect, it } from "vitest";
import { juntarCorrecoesOracoes, segmentarOracoesCoordenadas } from "../oracao-composta";

describe("segmentarOracoesCoordenadas", () => {
  it("não parte sujeito composto «X e Y» antes do verbo", () => {
    const t = ["Ana", "e", "Pedro", "viajar", "praia"];
    const b = segmentarOracoesCoordenadas(t);
    expect(b).toHaveLength(1);
    expect(b[0].tokens).toEqual(t);
    expect(b[0].conectorDepois).toBeNull();
  });

  it("parte «eu comer e ele dormir» em duas orações", () => {
    const t = ["Eu", "comer", "e", "ele", "dormir"];
    const b = segmentarOracoesCoordenadas(t);
    expect(b).toHaveLength(2);
    expect(b[0].tokens).toEqual(["Eu", "comer"]);
    expect(b[0].conectorDepois).toBe("e");
    expect(b[1].tokens).toEqual(["ele", "dormir"]);
    expect(b[1].conectorDepois).toBeNull();
  });

  it("parte em três com «e» após cada verbo", () => {
    const t = ["Eu", "comer", "e", "ele", "dormir", "e", "ela", "cantar"];
    const b = segmentarOracoesCoordenadas(t);
    expect(b).toHaveLength(3);
    expect(b[0].tokens).toEqual(["Eu", "comer"]);
    expect(b[1].tokens).toEqual(["ele", "dormir"]);
    expect(b[2].tokens).toEqual(["ela", "cantar"]);
  });

  it("reconhece «mas» entre orações", () => {
    const t = ["Eu", "comer", "mas", "ele", "dormir"];
    const b = segmentarOracoesCoordenadas(t);
    expect(b).toHaveLength(2);
    expect(b[0].conectorDepois).toBe("mas");
  });

  it("não parte sujeito «X ou Y» antes do verbo", () => {
    const t = ["Ana", "ou", "Pedro", "viajar", "praia"];
    const b = segmentarOracoesCoordenadas(t);
    expect(b).toHaveLength(1);
    expect(b[0].tokens).toEqual(t);
  });

  it("parte «eu comer ou ele dormir» com conector «ou»", () => {
    const t = ["Eu", "comer", "ou", "ele", "dormir"];
    const b = segmentarOracoesCoordenadas(t);
    expect(b).toHaveLength(2);
    expect(b[0].tokens).toEqual(["Eu", "comer"]);
    expect(b[0].conectorDepois).toBe("ou");
    expect(b[1].tokens).toEqual(["ele", "dormir"]);
  });
});

describe("juntarCorrecoesOracoes", () => {
  it("omite pronome repetido com sujeito implícito igual", () => {
    const out = juntarCorrecoesOracoes(
      [
        { correcao: "Eu como pizza", sujeito: { texto: "Eu", implicito: true } },
        { correcao: "Eu durmo", sujeito: { texto: "Eu", implicito: true } },
      ],
      ["e"]
    );
    expect(out).toBe("Eu como pizza e durmo");
  });
});
