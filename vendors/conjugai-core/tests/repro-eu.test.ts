import { describe, it, expect } from 'vitest';
import { analisarFrase } from '../index';

describe('Correção de Conjugação para 1ª Pessoa', () => {
  it('deve conjugar "Eu comer" no pretérito (passado)', async () => {
    const res = await analisarFrase("Eu comer maçã", { tempo: "passado" });
    expect(res.sujeito.pessoa).toBe(0);
    expect(res.correcao).toContain("comi");
  });

  it('deve conjugar "Eu comer" no presente', async () => {
    const res = await analisarFrase("Eu comer maçã", { tempo: "presente" });
    expect(res.sujeito.pessoa).toBe(0);
    expect(res.correcao).toContain("como");
  });

  it('deve conjugar "Eu comer" no futuro', async () => {
    const res = await analisarFrase("Eu comer maçã", { tempo: "futuro" });
    expect(res.sujeito.pessoa).toBe(0);
    expect(res.correcao).toContain("comerei");
  });
});
