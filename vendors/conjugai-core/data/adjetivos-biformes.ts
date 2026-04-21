/** Pares masculino/feminino de adjetivos biformes permitidos na concordância de gênero (lista controlada em `corretor.ts`). */
export type ParAdjetivoBiforme = readonly [masculino: string, feminino: string];

/**
 * Lista explícita: só entra em `corrigir` o que estiver aqui (evita heurística agressiva).
 * Adicione novas linhas no mesmo formato `[masc, fem]`.
 */
export const ADJETIVOS_BIFORMES: readonly ParAdjetivoBiforme[] = [
  ["bonito", "bonita"],
  ["lindo", "linda"],
  ["cansado", "cansada"],
  ["animado", "animada"],
  ["preparado", "preparada"],
  ["pronto", "pronta"],
];
