import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  normalizarParaComparacao,
  parseUnimorphFeatures,
  parseUnimorphTsvLine,
  predictConjugaiForm,
} from "./unimorph/unimorph-map";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

function loadFixture(): string {
  const p = resolve(__dirname, "fixtures/unimorph-por-sample.tsv");
  return readFileSync(p, "utf-8");
}

describe("UniMorph × núcleo (validação cruzada, MorphoBr continua fonte única)", () => {
  it("amostra local bate com conjugar / formas não finitas", () => {
    const lines = loadFixture().split(/\r?\n/);
    const falhas: string[] = [];

    for (const line of lines) {
      const row = parseUnimorphTsvLine(line);
      if (!row) continue;

      const parsed = parseUnimorphFeatures(row.feats);
      if (parsed.kind === "skip") {
        falhas.push(`${line} → skip interno: ${parsed.reason}`);
        continue;
      }

      const pred = predictConjugaiForm(row.lemma, parsed);
      if (pred === null) {
        falhas.push(`${line} → sem predição (paradigma ausente no léxico?)`);
        continue;
      }

      const ok = normalizarParaComparacao(pred) === normalizarParaComparacao(row.gold);
      if (!ok) {
        falhas.push(
          `${row.lemma} / ${row.feats} → esperado UniMorph «${row.gold}», obtido «${pred}»`
        );
      }
    }

    expect(falhas, falhas.join("\n")).toHaveLength(0);
  });
});

/**
 * Com o ficheiro completo do repositório unimorph/por (dezenas de MB), gera estatísticas sem falhar o CI.
 * Uso: UNIMORPH_POR_PATH=/caminho/para/por UNIMORPH_MAX_LINES=8000 npm test -- unimorph
 */
describe("UniMorph ficheiro completo (opcional, só relatório)", () => {
  const porPath = process.env.UNIMORPH_POR_PATH;
  const max = Math.min(
    500_000,
    Math.max(1, parseInt(process.env.UNIMORPH_MAX_LINES ?? "5000", 10) || 5000)
  );

  it.skipIf(!porPath || !existsSync(porPath))("relatório de cobertura e divergências", () => {
    const buf = readFileSync(porPath!, "utf-8");
    const lines = buf.split(/\r?\n/);

    let linhas = 0;
    let mapeaveis = 0;
    let comPredicao = 0;
    let match = 0;
    let mismatch = 0;
    let skippedFeat = 0;
    const primeirasDivergencias: string[] = [];

    for (const line of lines) {
      if (linhas >= max) break;
      const row = parseUnimorphTsvLine(line);
      if (!row) continue;
      linhas++;

      const parsed = parseUnimorphFeatures(row.feats);
      if (parsed.kind === "skip") {
        skippedFeat++;
        continue;
      }
      mapeaveis++;

      const pred = predictConjugaiForm(row.lemma, parsed);
      if (pred === null) continue;
      comPredicao++;

      if (normalizarParaComparacao(pred) === normalizarParaComparacao(row.gold)) {
        match++;
      } else {
        mismatch++;
        if (primeirasDivergencias.length < 25) {
          primeirasDivergencias.push(
            `${row.lemma}\t${row.gold}\t${row.feats} => ${pred}`
          );
        }
      }
    }

    // eslint-disable-next-line no-console -- relatório manual
    console.info("[UniMorph] linhas lidas (max)", max);
    // eslint-disable-next-line no-console
    console.info("[UniMorph] mapeáveis (features conhecidas)", mapeaveis);
    // eslint-disable-next-line no-console
    console.info("[UniMorph] com predição não nula", comPredicao);
    // eslint-disable-next-line no-console
    console.info("[UniMorph] match / mismatch", match, mismatch);
    if (primeirasDivergencias.length) {
      // eslint-disable-next-line no-console
      console.info("[UniMorph] primeiras divergências:\n" + primeirasDivergencias.join("\n"));
    }

    expect(linhas).toBeGreaterThan(0);
  });
});
