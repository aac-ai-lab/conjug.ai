/**
 * Tokenização: separa por espaços e remove pontuação final simples.
 */
export function tokenize(frase: string): string[] {
  return frase
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t.replace(/[.,!?;:]+$/g, ""));
}
