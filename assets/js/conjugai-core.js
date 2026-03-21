"use strict";
var ConjugaiCore = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // vendors/conjugai-core/index.ts
  var index_exports = {};
  __export(index_exports, {
    analisarFrase: () => analisarFrase,
    conjugar: () => conjugar,
    corrigir: () => corrigir,
    detectarSujeito: () => detectarSujeito,
    detectarSujeitoComposto: () => detectarSujeitoComposto,
    detectarTempo: () => detectarTempo,
    detectarVerboPorDicionario: () => detectarVerboPorDicionario,
    extrairVerbo: () => extrairVerbo,
    indiceDoVerboNaFrase: () => indiceDoVerboNaFrase,
    isVerbShape: () => isVerbShape,
    tokenize: () => tokenize
  });

  // vendors/conjugai-core/data/verbos.json
  var verbos_default = {
    comer: {
      presente: [
        "como",
        "comes",
        "come",
        "comemos",
        "comem"
      ],
      futuro: [
        "comerei",
        "comer\xE1s",
        "comer\xE1",
        "comeremos",
        "comer\xE3o"
      ],
      passado: [
        "comi",
        "comeste",
        "comeu",
        "comemos",
        "comeram"
      ]
    },
    ir: {
      presente: [
        "vou",
        "vais",
        "vai",
        "vamos",
        "v\xE3o"
      ],
      futuro: [
        "irei",
        "ir\xE1s",
        "ir\xE1",
        "iremos",
        "ir\xE3o"
      ],
      passado: [
        "fui",
        "foste",
        "foi",
        "fomos",
        "foram"
      ]
    },
    viajar: {
      presente: [
        "viajo",
        "viajas",
        "viaja",
        "viajamos",
        "viajam"
      ],
      futuro: [
        "viajarei",
        "viajar\xE1s",
        "viajar\xE1",
        "viajaremos",
        "viajar\xE3o"
      ],
      passado: [
        "viajei",
        "viajaste",
        "viajou",
        "viajamos",
        "viajaram"
      ]
    },
    querer: {
      presente: [
        "quero",
        "queres",
        "quer",
        "queremos",
        "querem"
      ],
      futuro: [
        "quererei",
        "querer\xE1s",
        "querer\xE1",
        "quereremos",
        "querer\xE3o"
      ],
      passado: [
        "quis",
        "quiseste",
        "quis",
        "quisemos",
        "quiseram"
      ]
    },
    fazer: {
      presente: [
        "fa\xE7o",
        "fazes",
        "faz",
        "fazemos",
        "fazem"
      ],
      futuro: [
        "farei",
        "far\xE1s",
        "far\xE1",
        "faremos",
        "far\xE3o"
      ],
      passado: [
        "fiz",
        "fizeste",
        "fez",
        "fizemos",
        "fizeram"
      ]
    }
  };

  // vendors/conjugai-core/data/verbos-data.ts
  var VERBOS = verbos_default;

  // vendors/conjugai-core/conjugador.ts
  var verbos = VERBOS;
  function normalizarToken(s) {
    return s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
  var cacheFormaParaInfinitivo = null;
  function getIndiceFormaParaInfinitivo() {
    if (cacheFormaParaInfinitivo) return cacheFormaParaInfinitivo;
    const m = /* @__PURE__ */ new Map();
    for (const infinitivo of Object.keys(verbos)) {
      m.set(normalizarToken(infinitivo), infinitivo);
      const entry = verbos[infinitivo];
      for (const col of ["presente", "futuro", "passado"]) {
        for (const forma of entry[col]) {
          if (forma) m.set(normalizarToken(forma), infinitivo);
        }
      }
    }
    cacheFormaParaInfinitivo = m;
    return m;
  }
  function isVerbShape(s) {
    return /(?:[aei]|pô)r$/i.test(String(s).trim());
  }
  function detectarVerboPorDicionario(tokens) {
    const m = getIndiceFormaParaInfinitivo();
    for (const t of tokens) {
      const lemma = m.get(normalizarToken(t));
      if (lemma) return lemma;
    }
    return null;
  }
  function indiceDoVerboNaFrase(tokens, infinitivo) {
    const inf = infinitivo.toLowerCase().trim();
    const m = getIndiceFormaParaInfinitivo();
    for (let i = 0; i < tokens.length; i++) {
      const nt = normalizarToken(tokens[i]);
      if (nt === normalizarToken(inf)) return i;
      if (m.get(nt) === inf) return i;
    }
    return -1;
  }
  function extrairVerbo(tokens) {
    const viaDict = detectarVerboPorDicionario(tokens);
    if (viaDict) return viaDict;
    for (const t of tokens) {
      if (isVerbShape(t)) {
        return t.trim().toLowerCase();
      }
    }
    return null;
  }
  function conjugarRegularPresente(infinitivo, pessoa) {
    const v = infinitivo.toLowerCase().trim();
    if (v.endsWith("ar")) {
      const p = v.slice(0, -2);
      const suf = ["o", "as", "a", "amos", "am"];
      return p + suf[pessoa];
    }
    if (v.endsWith("er")) {
      const p = v.slice(0, -2);
      const suf = ["o", "es", "e", "emos", "em"];
      return p + suf[pessoa];
    }
    if (v.endsWith("ir")) {
      const p = v.slice(0, -2);
      const suf = ["o", "es", "e", "imos", "em"];
      return p + suf[pessoa];
    }
    if (/p[oô]r$/i.test(v)) {
      return null;
    }
    return null;
  }
  function conjugar(verbo, pessoa, tempo) {
    const v = verbo.toLowerCase().trim();
    if (pessoa < 0 || pessoa > 4) return null;
    const entry = verbos[v];
    if (entry) {
      const col = tempo === "futuro" ? "futuro" : tempo === "passado" ? "passado" : "presente";
      const arr = entry[col];
      if (arr && arr[pessoa]) return arr[pessoa];
      return null;
    }
    if (tempo === "presente") {
      return conjugarRegularPresente(v, pessoa);
    }
    return null;
  }

  // vendors/conjugai-core/corretor.ts
  function corrigir(tokens, sujeito, infinitivo, conjugado, _tempoTipo) {
    const verbLower = conjugado.charAt(0).toLowerCase() + conjugado.slice(1);
    const vi = indiceDoVerboNaFrase(tokens, infinitivo);
    const resultado = [];
    for (let i = 0; i < tokens.length; i++) {
      if (i === vi) {
        resultado.push(verbLower);
      } else {
        resultado.push(tokens[i]);
      }
    }
    if (vi < 0) {
      const fallback = `${sujeito.texto} ${verbLower}`.replace(/\s+/g, " ").trim();
      return fallback.charAt(0).toUpperCase() + fallback.slice(1);
    }
    if (sujeito.implicito) {
      resultado.unshift(sujeito.texto);
    }
    const out = resultado.join(" ").replace(/\s+/g, " ").trim();
    return out.charAt(0).toUpperCase() + out.slice(1);
  }

  // vendors/conjugai-core/sujeito.ts
  function normalize(s) {
    return s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
  function temConectorE(tokens) {
    return tokens.some((t) => normalize(t) === "e");
  }
  function prefixoAntesDoVerbo(tokens) {
    const inf = extrairVerbo(tokens);
    if (!inf) return null;
    const vi = indiceDoVerboNaFrase(tokens, inf);
    if (vi < 0) return null;
    return tokens.slice(0, vi);
  }
  function detectarSujeitoComposto(tokens) {
    const prefix = prefixoAntesDoVerbo(tokens);
    if (!prefix || prefix.length < 3 || !temConectorE(prefix)) {
      return null;
    }
    const toks = prefix.map(normalize);
    if (toks.some((t) => t === "eu")) {
      return {
        texto: "N\xF3s",
        pessoa: 3,
        rotulo: "composto (cont\xE9m \xABeu\xBB) \u2192 1\xAA plural",
        implicito: false,
        composto: true
      };
    }
    if (toks.some((t) => t === "tu" || t === "voce")) {
      return {
        texto: "Voc\xEAs",
        pessoa: 4,
        rotulo: "composto (tu/voc\xEA + \u2026) \u2192 plural (forma verbal como \xABeles\xBB)",
        implicito: false,
        composto: true
      };
    }
    return {
      texto: "Eles",
      pessoa: 4,
      rotulo: "composto (dois n\xFAcleos sem eu/tu/voc\xEA) \u2192 3\xAA plural",
      implicito: false,
      composto: true
    };
  }
  function isCompostoEuOutra(tokens) {
    const lower = tokens.map(normalize);
    const hasEu = lower.includes("eu");
    if (!hasEu) return false;
    if (lower.includes("mamae") || lower.some((t) => t.startsWith("mamae"))) return true;
    if (lower.includes("papai")) return true;
    const joined = lower.join(" ");
    if (/(mamae|papai)\s+e\s+eu|eu\s+e\s+(mamae|papai)/.test(joined)) return true;
    return false;
  }
  function detectarSujeitoSimples(tokens) {
    const lower = tokens.map(normalize);
    if (isCompostoEuOutra(tokens)) {
      return {
        texto: "N\xF3s",
        pessoa: 3,
        rotulo: "composto (Eu + mam\xE3e/papai) \u2192 1\xAA plural",
        implicito: false,
        composto: true
      };
    }
    if (lower.includes("nos")) {
      return { texto: "N\xF3s", pessoa: 3, rotulo: "expl\xEDcito: n\xF3s", implicito: false };
    }
    if (lower.includes("eles")) {
      return { texto: "Eles", pessoa: 4, rotulo: "expl\xEDcito: eles", implicito: false };
    }
    if (lower.includes("ela")) {
      return { texto: "Ela", pessoa: 2, rotulo: "expl\xEDcito: ela", implicito: false };
    }
    if (lower.includes("ele")) {
      return { texto: "Ele", pessoa: 2, rotulo: "expl\xEDcito: ele", implicito: false };
    }
    if (lower.includes("eu")) {
      return { texto: "Eu", pessoa: 0, rotulo: "expl\xEDcito: eu", implicito: false };
    }
    if (lower.includes("tu")) {
      return { texto: "Tu", pessoa: 1, rotulo: "expl\xEDcito: tu", implicito: false };
    }
    return {
      texto: "Eu",
      pessoa: 0,
      rotulo: "impl\xEDcito: 1\xAA pessoa do singular (frase sem pronome expl\xEDcito)",
      implicito: true
    };
  }
  function detectarSujeito(tokens) {
    const comp = detectarSujeitoComposto(tokens);
    if (comp) return comp;
    return detectarSujeitoSimples(tokens);
  }

  // vendors/conjugai-core/tempo.ts
  function normalize2(s) {
    return s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
  function detectarTempo(tokens) {
    const lower = tokens.map(normalize2);
    const primeiro = lower[0] ?? "";
    const amanha = lower.includes("amanha");
    const perifrasisIrPresente = amanha && (primeiro === "vou" || primeiro === "vais" || primeiro === "vai" || primeiro === "vamos" || primeiro === "vao");
    if (perifrasisIrPresente) {
      return {
        tipo: "presente",
        rotulo: 'Marcador "amanh\xE3" com \xABvou/vai/\u2026 viajar\xBB (per\xEDfrase) \u2192 presente no verbo suporte.'
      };
    }
    if (amanha) {
      return {
        tipo: "futuro",
        rotulo: 'Marcador "amanh\xE3" \u2192 Futuro do Presente do indicativo.'
      };
    }
    if (lower.includes("ontem")) {
      return {
        tipo: "passado",
        rotulo: 'Marcador "ontem" \u2192 Pret\xE9rito Perfeito do indicativo.'
      };
    }
    return {
      tipo: "presente",
      rotulo: "Sem marcador de passado/futuro \u2192 Presente do indicativo."
    };
  }

  // vendors/conjugai-core/tokenizer.ts
  function tokenize(frase) {
    return frase.trim().split(/\s+/).filter(Boolean).map((t) => t.replace(/[.,!?;:]+$/g, ""));
  }

  // vendors/conjugai-core/index.ts
  function analisarFrase(frase) {
    const tokens = tokenize(frase);
    if (tokens.length === 0) {
      return {
        tokens: [],
        sujeito: { texto: "Eu", pessoa: 0, rotulo: "\u2014", implicito: true, composto: false },
        tempo: { tipo: "presente" },
        verbo: { infinitivo: "", conjugado: "" },
        correcao: "",
        erro: "Digite ou selecione uma frase.",
        debug: {
          etapa1: "Tokens: (vazio)",
          etapa2: "Sujeito: \u2014",
          etapa3: "Tempo: \u2014",
          etapa4: "Verbo: \u2014"
        }
      };
    }
    const sujeito = detectarSujeito(tokens);
    const tempo = detectarTempo(tokens);
    const infinitivo = extrairVerbo(tokens);
    if (!infinitivo) {
      return {
        tokens,
        sujeito: {
          texto: sujeito.texto,
          pessoa: sujeito.pessoa,
          rotulo: sujeito.rotulo,
          implicito: sujeito.implicito,
          composto: sujeito.composto
        },
        tempo: { tipo: tempo.tipo },
        verbo: { infinitivo: "", conjugado: "" },
        correcao: "",
        erro: "N\xE3o foi identificado verbo: nem forma no l\xE9xico (data/verbos.json) nem infinitivo por sufixo (-ar, -er, -ir, -p\xF4r).",
        debug: {
          etapa1: `Tokens: ${tokens.join(", ")}`,
          etapa2: `Sujeito: ${sujeito.texto} (${sujeito.rotulo})`,
          etapa3: `Tempo: ${tempo.tipo} \u2014 ${tempo.rotulo}`,
          etapa4: "Verbo: n\xE3o identificado"
        }
      };
    }
    const conjugado = conjugar(infinitivo, sujeito.pessoa, tempo.tipo);
    if (!conjugado) {
      return {
        tokens,
        sujeito: {
          texto: sujeito.texto,
          pessoa: sujeito.pessoa,
          rotulo: sujeito.rotulo,
          implicito: sujeito.implicito,
          composto: sujeito.composto
        },
        tempo: { tipo: tempo.tipo },
        verbo: { infinitivo, conjugado: "" },
        correcao: "",
        erro: `N\xE3o foi poss\xEDvel conjugar \xAB${infinitivo}\xBB no tempo ${tempo.tipo}.`,
        debug: {
          etapa1: `Tokens: ${tokens.join(", ")}`,
          etapa2: `Sujeito: ${sujeito.texto} (${sujeito.rotulo})`,
          etapa3: `Tempo: ${tempo.tipo} \u2014 ${tempo.rotulo}`,
          etapa4: `Infinitivo: ${infinitivo}`
        }
      };
    }
    const correcao = corrigir(tokens, sujeito, infinitivo, conjugado, tempo.tipo);
    return {
      tokens,
      sujeito: {
        texto: sujeito.texto,
        pessoa: sujeito.pessoa,
        rotulo: sujeito.rotulo,
        implicito: sujeito.implicito,
        composto: sujeito.composto
      },
      tempo: { tipo: tempo.tipo },
      verbo: { infinitivo, conjugado },
      correcao,
      debug: {
        etapa1: `Tokens: ${tokens.join(", ")}`,
        etapa2: `Sujeito: ${sujeito.texto} \u2014 ${sujeito.rotulo}`,
        etapa3: `Tempo: ${tempo.tipo} \u2014 ${tempo.rotulo}`,
        etapa4: `Verbo conjugado: ${conjugado} (\xAB${infinitivo}\xBB)`
      }
    };
  }
  return __toCommonJS(index_exports);
})();
