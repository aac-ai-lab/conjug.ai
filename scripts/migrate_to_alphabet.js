import fs from "node:fs";
import path from "node:path";

/**
 * Script para converter as listas manuais legadas para o novo formato alfabético do nlp-pt-br-lite.
 * Versão JavaScript pura (CommonJS/ESM compatível).
 * ALVO: data/legacy/
 */

const DATA_DIR = "vendors/nlp-pt-br-lite/src/data";
const OUTPUT_DIR = path.join(DATA_DIR, "legacy");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const lexicon = {};

function normalize(s) {
  if (!s) return "";
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function addToLexicon(word, data) {
  const n = normalize(word);
  if (!n) return;
  if (!lexicon[n]) lexicon[n] = { cat: [] };
  if (data.cat) {
    for (const c of data.cat) {
      if (!lexicon[n].cat.includes(c)) lexicon[n].cat.push(c);
    }
  }
  if (data.p !== undefined) lexicon[n].p = data.p;
  if (data.reg !== undefined) lexicon[n].reg = data.reg;
  if (data.w !== undefined) lexicon[n].w = data.w;
}

// 1. Carregar pos-sujeito.json
const sujeito = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "pos-sujeito.json"), "utf8"));
for (const [p, info] of Object.entries(sujeito.pronomes)) {
  addToLexicon(p, { cat: ["PRONOME"], p: info.pessoa, w: info.texto });
}
for (const t of sujeito.titulos) {
  addToLexicon(t, { cat: ["PERSON", "SUBST_HUMANO"] });
}

// 2. Carregar pos-funcionais.json
const funcionais = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "pos-funcionais.json"), "utf8"));
const allFunc = [
  ...funcionais.artigos,
  ...funcionais.preposicoes,
  ...funcionais.conclusoes,
  ...funcionais.outras_funcionais
];
for (const f of allFunc) {
  addToLexicon(f, { cat: ["STOPWORD"] });
}

// 3. Carregar pos-tempo.json
const tempo = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "pos-tempo.json"), "utf8"));
for (const t of tempo.passado) addToLexicon(t, { cat: ["TEMPO", "PASSADO"] });
for (const t of tempo.presente) addToLexicon(t, { cat: ["TEMPO", "PRESENTE"] });
for (const t of tempo.futuro) addToLexicon(t, { cat: ["TEMPO", "FUTURO"] });
for (const t of tempo.imperfeito) addToLexicon(t, { cat: ["TEMPO", "IMPERFEITO"] });
for (const t of tempo.subjuntivo) addToLexicon(t, { cat: ["TEMPO", "SUBJUNTIVO"] });

// 4. Carregar regencia.json
const regencia = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "regencia.json"), "utf8"));
for (const v of regencia.verbos_movimento) {
  addToLexicon(v, { reg: "local" });
}
for (const l of regencia.lugares.femininos) {
  addToLexicon(l, { cat: ["LUGAR", "LUGAR_FEM"] });
}
for (const l of regencia.lugares.masculinos) {
  addToLexicon(l, { cat: ["LUGAR", "LUGAR_MASC"] });
}

// 5. Dividir e Salvar
const alphabet = {};

for (const [word, data] of Object.entries(lexicon)) {
  const letter = word.charAt(0).toLowerCase();
  const key = /^[a-z]$/.test(letter) ? letter : "others";
  if (!alphabet[key]) alphabet[key] = {};
  alphabet[key][word] = data;
}

for (const [letter, data] of Object.entries(alphabet)) {
  fs.writeFileSync(path.join(OUTPUT_DIR, `${letter}.json`), JSON.stringify(data, null, 2));
}

console.log(`Léxico LEGACY distribuído em ${Object.keys(alphabet).length} arquivos.`);
