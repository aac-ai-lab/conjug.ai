/** Léxico verbal (espelha `verbos.json`; manter em sincrono ao editar). */
export const VERBOS: Record<
  string,
  { presente: string[]; futuro: string[]; passado: string[] }
> = {
  comer: {
    presente: ["como", "comes", "come", "comemos", "comem"],
    futuro: ["comerei", "comerás", "comerá", "comeremos", "comerão"],
    passado: ["comi", "comeste", "comeu", "comemos", "comeram"],
  },
  ir: {
    presente: ["vou", "vais", "vai", "vamos", "vão"],
    futuro: ["irei", "irás", "irá", "iremos", "irão"],
    passado: ["fui", "foste", "foi", "fomos", "foram"],
  },
  viajar: {
    presente: ["viajo", "viajas", "viaja", "viajamos", "viajam"],
    futuro: ["viajarei", "viajarás", "viajará", "viajaremos", "viajarão"],
    passado: ["viajei", "viajaste", "viajou", "viajamos", "viajaram"],
  },
  querer: {
    presente: ["quero", "queres", "quer", "queremos", "querem"],
    futuro: ["quererei", "quererás", "quererá", "quereremos", "quererão"],
    passado: ["quis", "quiseste", "quis", "quisemos", "quiseram"],
  },
};
