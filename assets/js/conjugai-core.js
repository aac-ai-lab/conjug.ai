/**
 * conjugai-core — bundle IIFE (gerado a partir de src/lib/conjugai-core).
 * Rebuild: npm run build:core
 * @global ConjugaiCore
 */
(function (global) {
  "use strict";

  var VERBOS = {
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

  function normalize(s) {
    return String(s)
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function tokenize(frase) {
    return frase
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(function (t) {
        return t.replace(/[.,!?;:]+$/g, "");
      });
  }

  function isCompostoEuOutra(tokens) {
    var lower = tokens.map(normalize);
    var hasEu = lower.indexOf("eu") >= 0;
    if (!hasEu) return false;
    if (lower.indexOf("mamae") >= 0 || lower.some(function (t) { return t.indexOf("mamae") === 0; })) return true;
    if (lower.indexOf("papai") >= 0) return true;
    var joined = lower.join(" ");
    if (/(mamae|papai)\s+e\s+eu|eu\s+e\s+(mamae|papai)/.test(joined)) return true;
    return false;
  }

  function detectarSujeito(tokens) {
    var lower = tokens.map(normalize);
    if (isCompostoEuOutra(tokens)) {
      return { texto: "Nós", pessoa: 3, rotulo: "composto (Eu + outra pessoa) → 1ª plural" };
    }
    if (lower.indexOf("nos") >= 0) return { texto: "Nós", pessoa: 3, rotulo: "explícito: nós" };
    if (lower.indexOf("eles") >= 0) return { texto: "Eles", pessoa: 4, rotulo: "explícito: eles" };
    if (lower.indexOf("ela") >= 0) return { texto: "Ela", pessoa: 2, rotulo: "explícito: ela" };
    if (lower.indexOf("ele") >= 0) return { texto: "Ele", pessoa: 2, rotulo: "explícito: ele" };
    if (lower.indexOf("eu") >= 0) return { texto: "Eu", pessoa: 0, rotulo: "explícito: eu" };
    if (lower.indexOf("tu") >= 0) return { texto: "Tu", pessoa: 1, rotulo: "explícito: tu" };
    return { texto: "Ele", pessoa: 2, rotulo: "padrão: 3ª pessoa do singular (assumido)" };
  }

  function detectarTempo(tokens) {
    var lower = tokens.map(normalize);
    if (lower.indexOf("amanha") >= 0) {
      return { tipo: "futuro", rotulo: 'Marcador "amanhã" → Futuro do Presente do indicativo.' };
    }
    if (lower.indexOf("ontem") >= 0) {
      return { tipo: "passado", rotulo: 'Marcador "ontem" → Pretérito Perfeito do indicativo.' };
    }
    return { tipo: "presente", rotulo: "Sem marcador de passado/futuro → Presente do indicativo." };
  }

  function isVerbShape(s) {
    return /(?:[aei]|pô)r$/i.test(String(s).trim());
  }

  var cacheIndiceFormaParaInfinitivo = null;
  function getIndiceFormaParaInfinitivo() {
    if (cacheIndiceFormaParaInfinitivo) return cacheIndiceFormaParaInfinitivo;
    var m = {};
    for (var inf in VERBOS) {
      if (!Object.prototype.hasOwnProperty.call(VERBOS, inf)) continue;
      m[normalize(inf)] = inf;
      var entry = VERBOS[inf];
      var cols = ["presente", "futuro", "passado"];
      for (var c = 0; c < cols.length; c++) {
        var arr = entry[cols[c]];
        for (var x = 0; x < arr.length; x++) {
          if (arr[x]) m[normalize(arr[x])] = inf;
        }
      }
    }
    cacheIndiceFormaParaInfinitivo = m;
    return m;
  }

  function detectarVerboPorDicionario(tokens) {
    var mapa = getIndiceFormaParaInfinitivo();
    for (var i = 0; i < tokens.length; i++) {
      var lemma = mapa[normalize(tokens[i])];
      if (lemma) return lemma;
    }
    return null;
  }

  function indiceDoVerboNaFrase(tokens, infinitivo) {
    var inf = infinitivo.toLowerCase().trim();
    var mapa = getIndiceFormaParaInfinitivo();
    for (var j = 0; j < tokens.length; j++) {
      var nt = normalize(tokens[j]);
      if (nt === normalize(inf)) return j;
      if (mapa[nt] === inf) return j;
    }
    return -1;
  }

  function extrairVerbo(tokens) {
    var viaDict = detectarVerboPorDicionario(tokens);
    if (viaDict) return viaDict;
    for (var k = 0; k < tokens.length; k++) {
      if (isVerbShape(tokens[k])) return tokens[k].trim().toLowerCase();
    }
    return null;
  }

  function conjugarRegularPresente(infinitivo, pessoa) {
    var v = infinitivo.toLowerCase().trim();
    if (v.slice(-2) === "ar") {
      var p = v.slice(0, -2);
      var suf = ["o", "as", "a", "amos", "am"];
      return p + suf[pessoa];
    }
    if (v.slice(-2) === "er") {
      var p2 = v.slice(0, -2);
      var suf2 = ["o", "es", "e", "emos", "em"];
      return p2 + suf2[pessoa];
    }
    if (v.slice(-2) === "ir") {
      var p3 = v.slice(0, -2);
      var suf3 = ["o", "es", "e", "imos", "em"];
      return p3 + suf3[pessoa];
    }
    if (/p[oô]r$/i.test(v)) return null;
    return null;
  }

  function conjugar(verbo, pessoa, tempo) {
    var v = verbo.toLowerCase().trim();
    if (pessoa < 0 || pessoa > 4) return null;
    var entry = VERBOS[v];
    if (entry) {
      var col = tempo === "futuro" ? "futuro" : tempo === "passado" ? "passado" : "presente";
      var arr = entry[col];
      if (arr && arr[pessoa]) return arr[pessoa];
      return null;
    }
    if (tempo === "presente") return conjugarRegularPresente(v, pessoa);
    return null;
  }

  function corrigir(tokens, sujeito, infinitivo, conjugado, tempoTipo) {
    var pronoun = sujeito.texto;
    var verbLower = conjugado.charAt(0).toLowerCase() + conjugado.slice(1);
    var nv = normalize(infinitivo);
    var vi = indiceDoVerboNaFrase(tokens, infinitivo);
    var lower = tokens.map(normalize);
    var after = vi >= 0 ? tokens.slice(vi + 1) : [];
    var complemento = "";

    if (nv === "comer") {
      var obj = null;
      for (var k = 0; k < after.length; k++) {
        if (/ma[cç]a/i.test(after[k])) {
          obj = after[k];
          break;
        }
      }
      complemento = obj ? " uma maçã" : "";
    } else if (nv === "ir") {
      var hasShop = after.some(function (t) {
        return normalize(t) === "shopping";
      });
      if (hasShop) complemento = " ao shopping amanhã";
      else if (tempoTipo === "passado") complemento = " ontem";
      else {
        var rest = after.filter(function (t) {
          return ["amanha", "ontem"].indexOf(normalize(t)) < 0;
        });
        complemento = rest.length ? " " + rest.join(" ") : "";
      }
    } else if (nv === "querer") {
      var inf = null;
      for (var q = 0; q < after.length; q++) {
        if (normalize(after[q]) === "brincar") {
          inf = after[q];
          break;
        }
      }
      if (inf) complemento = " brincar";
      else {
        var rest2 = after.filter(Boolean);
        complemento = rest2.length ? " " + rest2.join(" ") : "";
      }
    } else {
      var rest3 = after.filter(function (t) {
        return ["amanha", "ontem"].indexOf(normalize(t)) < 0;
      });
      if (rest3.length) complemento = " " + rest3.join(" ");
      else if (lower.indexOf("ontem") >= 0) complemento = " ontem";
      else if (lower.indexOf("amanha") >= 0) complemento = " amanhã";
    }

    var core = (pronoun + " " + verbLower + complemento).replace(/\s+/g, " ").trim();
    if (!/[.!?]$/.test(core)) core += ".";
    return core.charAt(0).toUpperCase() + core.slice(1);
  }

  function analisarFrase(frase) {
    var tokens = tokenize(frase);
    if (tokens.length === 0) {
      return {
        tokens: [],
        sujeito: { texto: "Ele", pessoa: 2, rotulo: "—" },
        tempo: { tipo: "presente" },
        verbo: { infinitivo: "", conjugado: "" },
        correcao: "",
        erro: "Digite ou selecione uma frase.",
        debug: {
          etapa1: "Tokens: (vazio)",
          etapa2: "Sujeito: —",
          etapa3: "Tempo: —",
          etapa4: "Verbo: —",
        },
      };
    }

    var sujeito = detectarSujeito(tokens);
    var tempo = detectarTempo(tokens);
    var infinitivo = extrairVerbo(tokens);

    if (!infinitivo) {
      return {
        tokens: tokens,
        sujeito: { texto: sujeito.texto, pessoa: sujeito.pessoa, rotulo: sujeito.rotulo },
        tempo: { tipo: tempo.tipo },
        verbo: { infinitivo: "", conjugado: "" },
        correcao: "",
        erro:
          "Não foi identificado verbo: nem forma no léxico (verbos.json) nem infinitivo por sufixo (-ar, -er, -ir, -pôr).",
        debug: {
          etapa1: "Tokens: " + tokens.join(", "),
          etapa2: "Sujeito: " + sujeito.texto + " (" + sujeito.rotulo + ")",
          etapa3: "Tempo: " + tempo.tipo + " — " + tempo.rotulo,
          etapa4: "Verbo: não identificado",
        },
      };
    }

    var conjugado = conjugar(infinitivo, sujeito.pessoa, tempo.tipo);
    if (!conjugado) {
      return {
        tokens: tokens,
        sujeito: { texto: sujeito.texto, pessoa: sujeito.pessoa, rotulo: sujeito.rotulo },
        tempo: { tipo: tempo.tipo },
        verbo: { infinitivo: infinitivo, conjugado: "" },
        correcao: "",
        erro: "Não foi possível conjugar «" + infinitivo + "» no tempo " + tempo.tipo + ".",
        debug: {
          etapa1: "Tokens: " + tokens.join(", "),
          etapa2: "Sujeito: " + sujeito.texto + " (" + sujeito.rotulo + ")",
          etapa3: "Tempo: " + tempo.tipo + " — " + tempo.rotulo,
          etapa4: "Infinitivo: " + infinitivo,
        },
      };
    }

    var correcao = corrigir(tokens, sujeito, infinitivo, conjugado, tempo.tipo);

    return {
      tokens: tokens,
      sujeito: { texto: sujeito.texto, pessoa: sujeito.pessoa, rotulo: sujeito.rotulo },
      tempo: { tipo: tempo.tipo },
      verbo: { infinitivo: infinitivo, conjugado: conjugado },
      correcao: correcao,
      debug: {
        etapa1: "Tokens: " + tokens.join(", "),
        etapa2: "Sujeito: " + sujeito.texto + " — " + sujeito.rotulo,
        etapa3: "Tempo: " + tempo.tipo + " — " + tempo.rotulo,
        etapa4: "Verbo conjugado: " + conjugado + " («" + infinitivo + "»)",
      },
    };
  }

  global.ConjugaiCore = {
    analisarFrase: analisarFrase,
    tokenize: tokenize,
    conjugar: conjugar,
    extrairVerbo: extrairVerbo,
    detectarVerboPorDicionario: detectarVerboPorDicionario,
    indiceDoVerboNaFrase: indiceDoVerboNaFrase,
    isVerbShape: isVerbShape,
    detectarSujeito: detectarSujeito,
    detectarTempo: detectarTempo,
    corrigir: corrigir,
  };
})(typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : this);
