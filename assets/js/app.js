/**
 * ConjugAI — UI e orquestração. Lógica linguística em conjugai-core (assets/js/conjugai-core.js).
 */
(function () {
  "use strict";

  /**
   * Cada exemplo: frase + badges na lista (tipo: subject | time | verb | other).
   * `rotulo` = descrição longa (tooltip no item).
   */
  const EXAMPLES = [
    {
      texto: "Eu comer maçã",
      rotulo:
        "Tokenização; sujeito explícito «eu»; tempo presente; conjugação do infinitivo para a pessoa certa (léxico).",
      badges: [
        { texto: "Sujeito explícito", tipo: "subject" },
        { texto: "Presente", tipo: "time" },
        { texto: "Conjugação (léxico)", tipo: "verb" },
      ],
    },
    {
      texto: "Mamãe e eu ir shopping amanhã",
      rotulo:
        "Sujeito composto (contém «eu» → rótulo «nós»); futuro; verbo «ir»; regência «ao shopping» (a + o).",
      badges: [
        { texto: "Sujeito composto", tipo: "subject" },
        { texto: "Futuro", tipo: "time" },
        { texto: "Ir + regência", tipo: "other" },
      ],
    },
    {
      texto: "Ele viajar ontem",
      rotulo: "Sujeito «ele»; tempo passado (marcador «ontem»); conjugação no pretérito.",
      badges: [
        { texto: "Sujeito «ele»", tipo: "subject" },
        { texto: "Passado", tipo: "time" },
        { texto: "Conjugação", tipo: "verb" },
      ],
    },
    {
      texto: "Nós querer brincar",
      rotulo: "Sujeito «nós» explícito; presente; conjugação de «querer» na 1.ª do plural.",
      badges: [
        { texto: "Sujeito plural", tipo: "subject" },
        { texto: "Presente", tipo: "time" },
        { texto: "Conjugação", tipo: "verb" },
      ],
    },
    {
      texto: "Tu fazer lição",
      rotulo: "Sujeito «tu»; 2.ª pessoa; presente; conjugação adequada a «tu».",
      badges: [
        { texto: "2.ª pessoa", tipo: "subject" },
        { texto: "Presente", tipo: "time" },
        { texto: "Conjugação", tipo: "verb" },
      ],
    },
    {
      texto: "Ela fazer bolo amanhã",
      rotulo: "Sujeito «ela»; tempo futuro («amanhã»); conjugação no futuro do presente.",
      badges: [
        { texto: "Sujeito «ela»", tipo: "subject" },
        { texto: "Futuro", tipo: "time" },
        { texto: "Conjugação", tipo: "verb" },
      ],
    },
    {
      texto: "Vou viajar amanhã",
      rotulo:
        "Forma já conjugada do verbo auxiliar («vou»); o motor reconhece a forma do léxico em vez de re-flexionar o infinitivo.",
      badges: [
        { texto: "Forma no léxico", tipo: "verb" },
        { texto: "Presente", tipo: "time" },
        { texto: "Perífrase", tipo: "other" },
      ],
    },
    {
      texto: "Fazer jantar",
      rotulo:
        "Sujeito implícito (1.ª pessoa, «eu»); frase sem pronome na superfície; presente; antecede «Eu» na correção.",
      badges: [
        { texto: "Sujeito implícito", tipo: "subject" },
        { texto: "Presente", tipo: "time" },
        { texto: "Correção + pronome", tipo: "other" },
      ],
    },
    {
      texto: "Eu e papai comer pizza",
      rotulo:
        "Padrão «eu + mamãe/papai» tratado como sujeito composto → «nós»; presente; conjugação na 1.ª do plural.",
      badges: [
        { texto: "Composto (eu+papai)", tipo: "subject" },
        { texto: "Presente", tipo: "time" },
        { texto: "Conjugação", tipo: "verb" },
      ],
    },
    {
      texto: "Ana e Pedro viajar praia",
      rotulo:
        "Sujeito composto sem «eu» (dois núcleos) → rótulo «eles» e 3.ª do plural; tempo conforme marcadores.",
      badges: [
        { texto: "Composto → eles", tipo: "subject" },
        { texto: "3.ª plural", tipo: "subject" },
        { texto: "Conjugação", tipo: "verb" },
      ],
    },
    {
      texto: "Ana e você viajar amanhã",
      rotulo:
        "Composto com «você» → rótulo «vocês» (forma verbal como 3.ª do plural); futuro.",
      badges: [
        { texto: "Composto + você", tipo: "subject" },
        { texto: "Futuro", tipo: "time" },
        { texto: "Conjugação", tipo: "verb" },
      ],
    },
    {
      texto: "Você e eu comer pizza",
      rotulo: "Composto que inclui «eu» → «nós»; presente; conjugação na 1.ª do plural.",
      badges: [
        { texto: "Composto → nós", tipo: "subject" },
        { texto: "Presente", tipo: "time" },
        { texto: "Conjugação", tipo: "verb" },
      ],
    },
    {
      texto: "Eles fazer trabalho ontem",
      rotulo: "Sujeito «eles» explícito; passado; concordância verbal na 3.ª do plural.",
      badges: [
        { texto: "Sujeito «eles»", tipo: "subject" },
        { texto: "Passado", tipo: "time" },
        { texto: "Conjugação", tipo: "verb" },
      ],
    },
    {
      texto: "Nós ir escola amanhã",
      rotulo:
        "Regência de «ir» + lugar: insere «à» antes de substantivo feminino conhecido («à escola»); futuro.",
      badges: [
        { texto: "Regência (à escola)", tipo: "other" },
        { texto: "Futuro", tipo: "time" },
        { texto: "Normalização", tipo: "verb" },
      ],
    },
  ];

  function exemploTexto(ex) {
    return ex.texto;
  }

  /** Última análise com `viz` para diagramas nos modais (passos 1–4). */
  var lastPipeline = null;
  /** Índice do exemplo destacado na lista (sidebar). */
  var selectedExampleIndex = 0;

  const el = {
    exampleList: document.getElementById("example-list"),
    input: document.getElementById("raw-input"),
    btnAnalyze: document.getElementById("btn-analyze"),
    btnReset: document.getElementById("btn-reset"),
    placeholder: document.getElementById("logic-placeholder"),
    steps: document.getElementById("steps"),
    tokensOut: document.getElementById("tokens-out"),
    subjectDesc: document.getElementById("subject-desc"),
    subjectOut: document.getElementById("subject-out"),
    subjectStepTrigger: document.getElementById("subject-step-trigger"),
    dialogSubject: document.getElementById("dialog-subject-algo"),
    timeDesc: document.getElementById("time-desc"),
    timeOut: document.getElementById("time-out"),
    ruleDesc: document.getElementById("rule-desc"),
    ruleOut: document.getElementById("rule-out"),
    output: document.getElementById("output-text"),
    subjectVizMount: document.getElementById("subject-viz-mount"),
    tokenStepTrigger: document.getElementById("token-step-trigger"),
    tempoStepTrigger: document.getElementById("tempo-step-trigger"),
    ruleStepTrigger: document.getElementById("rule-step-trigger"),
    dialogToken: document.getElementById("dialog-token-algo"),
    dialogTempo: document.getElementById("dialog-tempo-algo"),
    dialogConj: document.getElementById("dialog-conj-algo"),
    dialogProject: document.getElementById("dialog-project-context"),
    btnProjectContext: document.getElementById("btn-project-context"),
  };

  function badgeClass(tipo) {
    var m = {
      subject: "example-badge--subject",
      time: "example-badge--time",
      verb: "example-badge--verb",
      other: "example-badge--other",
    };
    return m[tipo] || m.other;
  }

  function selectExample(index, runAnalysisAfter) {
    if (index < 0 || index >= EXAMPLES.length) return;
    selectedExampleIndex = index;
    el.input.value = exemploTexto(EXAMPLES[index]);
    if (el.exampleList) {
      EXAMPLES.forEach(function (_, idx) {
        var li = document.getElementById("example-option-" + idx);
        if (!li) return;
        var on = idx === index;
        li.classList.toggle("is-selected", on);
        li.setAttribute("aria-selected", on ? "true" : "false");
      });
      el.exampleList.setAttribute("aria-activedescendant", "example-option-" + index);
    }
    if (runAnalysisAfter) runAnalysis();
  }

  function buildExampleList() {
    if (!el.exampleList) return;
    el.exampleList.innerHTML = "";
    EXAMPLES.forEach(function (ex, idx) {
      var li = document.createElement("li");
      li.id = "example-option-" + idx;
      li.className = "example-item";
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", idx === 0 ? "true" : "false");
      li.setAttribute("data-index", String(idx));
      li.setAttribute("title", ex.rotulo);
      if (idx === 0) li.classList.add("is-selected");

      var badges = document.createElement("div");
      badges.className = "example-item__badges";
      ex.badges.forEach(function (b) {
        var span = document.createElement("span");
        span.className = "example-badge " + badgeClass(b.tipo);
        span.textContent = b.texto;
        badges.appendChild(span);
      });

      var phrase = document.createElement("span");
      phrase.className = "example-item__phrase";
      phrase.textContent = ex.texto;

      li.appendChild(badges);
      li.appendChild(phrase);
      li.addEventListener("click", function () {
        selectExample(idx, true);
      });
      el.exampleList.appendChild(li);
    });
    el.exampleList.setAttribute("aria-activedescendant", "example-option-0");
  }

  function getCore() {
    var g = typeof globalThis !== "undefined" ? globalThis : window;
    return g && g.ConjugaiCore ? g.ConjugaiCore : null;
  }

  function labelTempo(tempo) {
    var labels = {
      presente: "Presente do indicativo",
      futuro: "Futuro do presente",
      passado: "Pretérito perfeito",
      preterito_imperfeito: "Pretérito imperfeito",
      preterito_mais_que_perfeito: "Pretérito mais-que-perfeito",
      condicional: "Futuro do pretérito",
      subjuntivo_presente: "Subjuntivo presente",
      subjuntivo_imperfeito: "Subjuntivo imperfeito",
      subjuntivo_futuro: "Subjuntivo futuro",
      imperativo: "Imperativo",
      infinitivo_pessoal: "Infinitivo pessoal",
      infinitivo: "Infinitivo",
      gerundio: "Gerúndio",
      participio: "Particípio",
      preterito_perfeito_composto: "Pretérito perfeito composto",
      preterito_mais_que_perfeito_composto: "Pretérito mais-que-perfeito composto",
      preterito_mais_que_perfeito_anterior: "Pretérito mais-que-perfeito anterior",
      futuro_composto: "Futuro composto",
      futuro_do_preterito_composto: "Futuro do pretérito composto",
      subjuntivo_preterito_perfeito: "Subjuntivo pretérito perfeito",
      subjuntivo_preterito_mais_que_perfeito: "Subjuntivo pretérito mais-que-perfeito",
      subjuntivo_futuro_composto: "Subjuntivo futuro composto",
      infinitivo_pessoal_composto: "Infinitivo pessoal composto",
    };
    return labels[tempo] || tempo;
  }

  /**
   * @param {string} raw
   * @returns {{ ok: boolean, error?: string, analysis?: object }}
   */
  async function analyze(raw) {
    var core = getCore();
    if (!core || typeof core.analisarFrase !== "function") {
      return {
        ok: false,
        error: "Biblioteca conjugai-core não carregada (assets/js/conjugai-core.js).",
      };
    }

    var r = await core.analisarFrase(String(raw).trim());
    if (r.erro) {
      return { ok: false, error: r.erro };
    }

    var nomeTempo = labelTempo(r.tempo.tipo);

    var ruleLine = "Aplicar " + nomeTempo + " de «" + r.verbo.infinitivo + "» para " + r.sujeito.texto + ".";

    var verbIndex =
      typeof core.indiceDoVerboNaFrase === "function"
        ? core.indiceDoVerboNaFrase(r.tokens, r.verbo.infinitivo)
        : -1;

    var lemmaViaDict =
      typeof core.detectarVerboPorDicionario === "function"
        ? core.detectarVerboPorDicionario(r.tokens)
        : null;
    var viaLexico = lemmaViaDict === r.verbo.infinitivo;

    var tempoRotulo = "";
    if (r.debug && r.debug.etapa3) {
      tempoRotulo = r.debug.etapa3.replace(/^Tempo:\s*[^\s]+\s*[—–-]\s*/, "").trim();
    }

    return {
      ok: true,
      analysis: {
        tokens: r.tokens,
        subject: {
          display: r.sujeito.texto + " (pessoa " + r.sujeito.pessoa + ")",
          label: r.sujeito.rotulo || "—",
        },
        temporal: {
          label: r.debug.etapa3.replace(/^Tempo:\s*/, ""),
        },
        verb: r.verbo.infinitivo,
        form: r.verbo.conjugado,
        ruleLine: ruleLine,
        finalSentence: r.correcao,
        debug: r.debug,
        viz: {
          rawInput: String(raw).trim(),
          tokens: r.tokens,
          verbIndex: verbIndex,
          infinitivo: r.verbo.infinitivo,
          conjugado: r.verbo.conjugado,
          sujeitoTexto: r.sujeito.texto,
          sujeitoPessoa: r.sujeito.pessoa,
          implicito: !!r.sujeito.implicito,
          composto: !!r.sujeito.composto,
          tempoTipo: r.tempo.tipo,
          tempoRotulo: tempoRotulo,
          nomeTempo: nomeTempo,
          viaLexico: viaLexico,
        },
      },
    };
  }
  
  window.ConjugaiAnalyzeAsync = analyze;

  function setStepsVisible(show) {
    if (show) {
      el.placeholder.hidden = true;
      el.placeholder.style.display = "none";
      el.steps.hidden = false;
      el.steps.classList.remove("hidden");
    } else {
      el.placeholder.hidden = false;
      el.placeholder.style.display = "";
      el.steps.hidden = true;
      el.steps.classList.add("hidden");
    }
  }

  function resetStepsUi() {
    el.tokensOut.innerHTML = "";
    ["subject-desc", "subject-out", "time-desc", "time-out", "rule-desc", "rule-out"].forEach(function (id) {
      var node = document.getElementById(id);
      if (node) node.textContent = "";
    });
    el.steps.querySelectorAll(".step").forEach(function (step) {
      step.classList.remove("is-active", "is-done");
    });
  }

  function runStepAnimation(analysis) {
    resetStepsUi();
    setStepsVisible(true);
    el.output.classList.add("is-busy");
    el.output.setAttribute("aria-busy", "true");
    el.output.textContent = "Processando análise…";

    var stepEls = Array.from(el.steps.querySelectorAll(".step"));
    var delays = [0, 420, 840, 1280];

    stepEls.forEach(function (s) {
      s.classList.remove("is-active", "is-done");
    });

    window.setTimeout(function () {
      el.tokensOut.innerHTML = "";
      analysis.tokens.forEach(function (tok, i) {
        var span = document.createElement("span");
        span.className = "token";
        span.textContent = tok;
        span.style.animationDelay = i * 0.05 + "s";
        el.tokensOut.appendChild(span);
      });
      stepEls[0].classList.add("is-active");
    }, delays[0]);

    window.setTimeout(function () {
      stepEls[0].classList.remove("is-active");
      stepEls[0].classList.add("is-done");
      el.subjectDesc.textContent = "Identificar núcleo do sujeito e pessoa gramatical.";
      el.subjectOut.textContent = analysis.subject.display + " — " + analysis.subject.label + ".";
      stepEls[1].classList.add("is-active");
    }, delays[1]);

    window.setTimeout(function () {
      stepEls[1].classList.remove("is-active");
      stepEls[1].classList.add("is-done");
      el.timeDesc.textContent = "Ler marcadores temporais na frase.";
      el.timeOut.textContent = analysis.temporal.label;
      stepEls[2].classList.add("is-active");
    }, delays[2]);

    window.setTimeout(function () {
      stepEls[2].classList.remove("is-active");
      stepEls[2].classList.add("is-done");
      el.ruleDesc.textContent = "Escolher desinência verbal adequada ao tempo e à pessoa.";
      el.ruleOut.textContent = analysis.ruleLine + " → «" + analysis.form + "».";
      stepEls[3].classList.add("is-active");
    }, delays[3]);

    window.setTimeout(function () {
      stepEls[3].classList.remove("is-active");
      stepEls[3].classList.add("is-done");
      el.output.classList.remove("is-busy");
      el.output.removeAttribute("aria-busy");
      el.output.textContent = analysis.finalSentence;
    }, delays[3] + 500);
  }

async function runAnalysis() {
    var raw = el.input.value;
    var result = await analyze(raw);
    if (!result.ok) {
      setStepsVisible(false);
      el.output.classList.remove("is-busy");
      el.output.removeAttribute("aria-busy");
      el.output.textContent = result.error || "Erro.";
      return;
    }
    if (result.analysis.viz) {
      lastPipeline = result.analysis.viz;
    }
    runStepAnimation(result.analysis);
  }

  var DEFAULT_PIPELINE = {
    rawInput: "Eu comer maçã",
    tokens: ["Eu", "comer", "maçã"],
    verbIndex: 1,
    infinitivo: "comer",
    conjugado: "como",
    sujeitoTexto: "Eu",
    sujeitoPessoa: 0,
    implicito: false,
    composto: false,
    tempoTipo: "presente",
    tempoRotulo: "Sem marcador de passado/futuro → Presente do indicativo.",
    nomeTempo: "Presente do indicativo",
    viaLexico: true,
  };

  function normalizeTok(s) {
    return String(s)
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function tagForToken(tok, i, verbIdx) {
    var n = normalizeTok(tok);
    if (verbIdx >= 0) {
      if (i < verbIdx) {
        if (n === "e") return { short: "conj", cls: "sv-tag--conj", hint: "Conector" };
        if (
          n === "eu" ||
          n === "tu" ||
          n === "ele" ||
          n === "ela" ||
          n === "eles" ||
          n === "nos" ||
          n === "voce"
        ) {
          return { short: "pron", cls: "sv-tag--pron", hint: "Pronome" };
        }
        return { short: "pre", cls: "sv-tag--pre", hint: "Prefixo (zona sujeito)" };
      }
      if (i === verbIdx) return { short: "V", cls: "sv-tag--verb", hint: "Verbo (alvo da conjugação)" };
    }
    if (n === "amanha" || n === "ontem" || n === "hoje") {
      return { short: "t", cls: "sv-tag--time", hint: "Marcador temporal" };
    }
    return { short: "·", cls: "sv-tag--rest", hint: "Resto da frase" };
  }

  function renderSubjectViz() {
    var host = el.subjectVizMount || document.getElementById("subject-viz-mount");
    if (!host) return;

    var data = lastPipeline && lastPipeline.tokens && lastPipeline.tokens.length ? lastPipeline : DEFAULT_PIPELINE;
    var tokens = data.tokens;
    var verbIdx = typeof data.verbIndex === "number" ? data.verbIndex : -1;
    var nCols = tokens.length + (verbIdx === 0 && data.implicito ? 1 : 0);

    var parts = [];
    parts.push('<div class="subject-viz" role="img" aria-label="Diagrama da frase token a token">');

    parts.push('<p class="subject-viz__caption">');
    parts.push(
      "<strong>Resultado:</strong> sujeito verbal «" +
        data.sujeitoTexto +
        "» · pessoa " +
        data.sujeitoPessoa +
        (data.implicito ? " · <em>implícito</em>" : "") +
        (data.composto ? " · <em>composto</em>" : "") +
        "</p>"
    );

    parts.push('<div class="subject-viz__diagram" style="--sv-cols:' + nCols + '">');
    parts.push('<div class="subject-viz__tags" aria-hidden="true">');

    var i;
    if (verbIdx === 0 && data.implicito) {
      parts.push(
        '<span class="subject-viz__cell subject-viz__cell--implicit"><span class="sv-tag sv-tag--implicit">∅</span><span class="sv-hint">implícito</span></span>'
      );
    }

    for (i = 0; i < tokens.length; i++) {
      var tag = tagForToken(tokens[i], i, verbIdx);
      parts.push(
        '<span class="subject-viz__cell"><span class="sv-tag ' +
          tag.cls +
          '" title="' +
          tag.hint +
          '">' +
          tag.short +
          "</span></span>"
      );
    }

    parts.push("</div>");

    parts.push('<div class="subject-viz__arc" aria-hidden="true">');
    parts.push(
      '<svg class="subject-viz__svg" viewBox="0 0 100 24" preserveAspectRatio="none"><path class="subject-viz__path" d="" /></svg>'
    );
    parts.push(
      '<span class="subject-viz__dep-label">arco: verbo ↔ zona do sujeito (prefixo)</span>'
    );
    parts.push("</div>");

    parts.push('<div class="subject-viz__words">');

    if (verbIdx === 0 && data.implicito) {
      parts.push(
        '<span class="subject-viz__wcell subject-viz__wcell--implicit"><span class="sv-word">—</span></span>'
      );
    }

    for (i = 0; i < tokens.length; i++) {
      var isVerb = verbIdx >= 0 && i === verbIdx;
      var wc = "subject-viz__wcell" + (isVerb ? " subject-viz__wcell--verb" : "");
      if (verbIdx >= 0 && i < verbIdx) wc += " subject-viz__wcell--prefix";
      parts.push(
        '<span class="' +
          wc +
          '" data-viz-i="' +
          i +
          '"' +
          (isVerb ? ' data-viz-role="verb"' : "") +
          "><span class=\"sv-word\">" +
          escapeHtml(tokens[i]) +
          "</span></span>"
      );
    }

    parts.push("</div>");
    parts.push("</div>");

    parts.push('<p class="subject-viz__micro">');
    parts.push(
      "O motor corta a frase no <strong>primeiro verbo</strong> reconhecido («" +
        (data.infinitivo || "…") +
        "»); à esquerda fica o <strong>prefixo</strong> onde se leem pronomes e «e»; daí a pessoa usada na conjugação."
    );
    parts.push("</p>");

    parts.push("</div>");

    host.innerHTML = parts.join("");

    window.requestAnimationFrame(function () {
      layoutSubjectVizArc(host);
      window.requestAnimationFrame(function () {
        layoutSubjectVizArc(host);
      });
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function isPerifrasisIr(tokens) {
    var lower = tokens.map(normalizeTok);
    var primeiro = lower[0] || "";
    if (lower.indexOf("amanha") < 0) return false;
    return ["vou", "vais", "vai", "vamos", "vao"].indexOf(primeiro) >= 0;
  }

  function renderTokenViz() {
    var host = document.getElementById("token-viz-mount");
    if (!host) return;
    var data = lastPipeline && lastPipeline.tokens && lastPipeline.tokens.length ? lastPipeline : DEFAULT_PIPELINE;
    var raw = data.rawInput || (data.tokens && data.tokens.join(" "));
    var tokens = data.tokens || [];
    var parts = [];
    parts.push('<div class="token-viz" role="img" aria-label="Tokenização da frase">');
    parts.push('<div class="token-viz__row">');
    parts.push('<span class="token-viz__label">Entrada</span>');
    parts.push('<div class="token-viz__raw"><code>' + escapeHtml(raw) + "</code></div>");
    parts.push("</div>");
    parts.push('<div class="token-viz__split" aria-hidden="true">⇣</div>');
    parts.push('<div class="token-viz__row">');
    parts.push('<span class="token-viz__label">Tokens</span>');
    parts.push('<div class="token-viz__chips">');
    for (var i = 0; i < tokens.length; i++) {
      parts.push('<span class="token-viz__chip">');
      parts.push('<span class="tv-chip tv-chip--idx">t' + i + "</span>");
      parts.push('<span class="token-viz__word">' + escapeHtml(tokens[i]) + "</span>");
      parts.push("</span>");
    }
    parts.push("</div></div>");
    parts.push(
      '<p class="subject-viz__micro">Cada espaço em branco separa tokens; pontuação final (.,…,…,…) é removida de cada pedaço.</p>'
    );
    parts.push("</div>");
    host.innerHTML = parts.join("");
  }

  function renderTempoViz() {
    var host = document.getElementById("tempo-viz-mount");
    if (!host) return;
    var data = lastPipeline && lastPipeline.tokens && lastPipeline.tokens.length ? lastPipeline : DEFAULT_PIPELINE;
    var tokens = data.tokens || [];
    var tipo = data.tempoTipo || "presente";
    var rotulo = data.tempoRotulo || "";
    var nome = data.nomeTempo || "Presente do indicativo";
    var badgeClass = "tempo-badge--pres";
    if (tipo === "futuro" || tipo === "futuro_composto" || tipo === "subjuntivo_futuro" || tipo === "subjuntivo_futuro_composto") {
      badgeClass = "tempo-badge--fut";
    }
    if (
      tipo === "passado" ||
      tipo === "preterito_imperfeito" ||
      tipo === "preterito_mais_que_perfeito" ||
      tipo === "preterito_perfeito_composto" ||
      tipo === "preterito_mais_que_perfeito_composto" ||
      tipo === "preterito_mais_que_perfeito_anterior"
    ) {
      badgeClass = "tempo-badge--past";
    }

    var parts = [];
    parts.push('<div class="tempo-viz" role="img" aria-label="Marcadores de tempo na frase">');
    parts.push('<p class="subject-viz__caption"><strong>Decisão:</strong> ');
    parts.push('<span class="tempo-badge ' + badgeClass + '">' + escapeHtml(nome) + "</span></p>");
    parts.push('<div class="tempo-viz__tokens" style="--sv-cols:' + tokens.length + '">');
    for (var i = 0; i < tokens.length; i++) {
      var n = normalizeTok(tokens[i]);
      var isMark = n === "amanha" || n === "ontem" || n === "hoje";
      var cls = "tempo-viz__tok" + (isMark ? " tempo-viz__tok--mark" : "");
      parts.push('<div class="' + cls + '">');
      if (isMark) parts.push('<span class="sv-tag sv-tag--time">t</span>');
      parts.push('<span class="tempo-viz__w">' + escapeHtml(tokens[i]) + "</span>");
      parts.push("</div>");
    }
    parts.push("</div>");
    parts.push('<p class="tempo-viz__rotulo">' + escapeHtml(rotulo) + "</p>");
    if (isPerifrasisIr(tokens)) {
      parts.push(
        '<p class="algo-dialog__note">Perífrase «vou/vai/…» + «amanhã» detectada: o verbo suporte permanece no <strong>presente</strong> (ex.: <em>vou viajar amanhã</em>).</p>'
      );
    }
    parts.push("</div>");
    host.innerHTML = parts.join("");
  }

  function renderConjViz() {
    var host = document.getElementById("conj-viz-mount");
    if (!host) return;
    var data = lastPipeline && lastPipeline.tokens && lastPipeline.tokens.length ? lastPipeline : DEFAULT_PIPELINE;
    var inf = data.infinitivo || "…";
    var p = typeof data.sujeitoPessoa === "number" ? data.sujeitoPessoa : 0;
    var pessoaLabels = ["eu", "tu", "ele/ela", "nós", "eles/vocês"];
    var tipo = data.tempoTipo || "presente";
    var form = data.conjugado || "…";
    var viaLexico = data.viaLexico !== false;
    var fonteLabel = viaLexico ? "verbos.json (léxico)" : "regra regular (presente · -ar/-er/-ir)";
    if (tipo !== "presente" && viaLexico) fonteLabel = "verbos.json (léxico)";
    if (tipo !== "presente" && !viaLexico) fonteLabel = "verbos.json ou —";

    var parts = [];
    parts.push('<div class="conj-viz" role="img" aria-label="Pipeline de conjugação">');
    parts.push('<div class="conj-pipe">');
    parts.push(
      '<div class="conj-pipe__col"><span class="conj-pipe__cap">Lema</span><span class="conj-pipe__box">' +
        escapeHtml(inf) +
        "</span></div>"
    );
    parts.push('<span class="conj-pipe__plus">+</span>');
    parts.push(
      '<div class="conj-pipe__col"><span class="conj-pipe__cap">Pessoa</span><span class="conj-pipe__box">' +
        p +
        " · " +
        (pessoaLabels[p] || "—") +
        "</span></div>"
    );
    parts.push('<span class="conj-pipe__plus">+</span>');
    parts.push(
      '<div class="conj-pipe__col"><span class="conj-pipe__cap">Tempo</span><span class="conj-pipe__box">' +
        escapeHtml(tipo) +
        "</span></div>"
    );
    parts.push('<span class="conj-pipe__arrow">→</span>');
    parts.push(
      '<div class="conj-pipe__col conj-pipe__col--out"><span class="conj-pipe__cap">Forma</span><span class="conj-pipe__box conj-pipe__box--out">«' +
        escapeHtml(form) +
        '»</span></div>'
    );
    parts.push("</div>");
    parts.push(
      '<p class="conj-viz__fonte">Fonte da forma: <strong class="' +
        (viaLexico ? "conj-src--lex" : "conj-src--reg") +
        '">' +
        fonteLabel +
        "</strong></p>"
    );
    parts.push("</div>");
    host.innerHTML = parts.join("");
  }

  function layoutSubjectVizArc(host) {
    var svg = host.querySelector(".subject-viz__svg");
    var path = host.querySelector(".subject-viz__path");
    var diagram = host.querySelector(".subject-viz__diagram");
    if (!svg || !path || !diagram) return;

    var verbEl = host.querySelector('[data-viz-role="verb"]');
    var prefixEls = host.querySelectorAll(".subject-viz__wcell--prefix");
    var implicitEl = host.querySelector(".subject-viz__wcell--implicit");

    var arcLayer = host.querySelector(".subject-viz__arc");
    if (!verbEl || !arcLayer) return;

    var dRect = diagram.getBoundingClientRect();
    var w = dRect.width;
    if (w < 8) return;

    svg.setAttribute("viewBox", "0 0 " + w + " 28");
    svg.style.width = "100%";
    svg.style.height = "28px";

    var x1 = verbEl.getBoundingClientRect().left + verbEl.offsetWidth / 2 - dRect.left;
    var x2;
    if (implicitEl) {
      x2 = implicitEl.getBoundingClientRect().left + implicitEl.offsetWidth / 2 - dRect.left;
    } else if (prefixEls.length) {
      var first = prefixEls[0];
      var last = prefixEls[prefixEls.length - 1];
      var cx1 = first.getBoundingClientRect().left - dRect.left;
      var cx2 = last.getBoundingClientRect().right - dRect.left;
      x2 = (cx1 + cx2) / 2;
    } else {
      x2 = x1;
    }

    var y = 24;
    var cx = (x1 + x2) / 2;
    var bump = Math.min(22, Math.abs(x2 - x1) * 0.35 + 8);
    var dPath = "M " + x1 + " " + y + " Q " + cx + " " + (y - bump) + " " + x2 + " " + y;
    path.setAttribute("d", dPath);
    path.setAttribute("stroke-linecap", "round");

    var show = prefixEls.length > 0 || implicitEl;
    path.style.opacity = show && Math.abs(x2 - x1) > 1 ? "1" : "0.35";
    var label = host.querySelector(".subject-viz__dep-label");
    if (label) {
      label.style.opacity = show ? "1" : "0.5";
    }
  }

  function openDialogWithRender(dialog, renderFn, focusEl) {
    if (!dialog || typeof dialog.showModal !== "function") return;
    dialog.showModal();
    window.requestAnimationFrame(function () {
      renderFn();
    });
    dialog.addEventListener(
      "close",
      function () {
        if (focusEl) focusEl.focus();
      },
      { once: true }
    );
  }

  function bindOneDialog(dialog, trigger, renderFn) {
    if (!dialog) return;
    var closeBtn = dialog.querySelector("[data-close-dialog]");
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        dialog.close();
      });
    }
    dialog.addEventListener("click", function (e) {
      if (e.target === dialog) dialog.close();
    });
    if (trigger) {
      trigger.addEventListener("click", function () {
        openDialogWithRender(dialog, renderFn, trigger);
      });
    }
  }

  function bindStaticDialog(dialog, openBtn) {
    if (!dialog) return;
    var closeBtn = dialog.querySelector("[data-close-dialog]");
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        dialog.close();
      });
    }
    dialog.addEventListener("click", function (e) {
      if (e.target === dialog) dialog.close();
    });
    if (openBtn) {
      openBtn.addEventListener("click", function () {
        if (typeof dialog.showModal === "function") dialog.showModal();
      });
    }
    dialog.addEventListener("close", function () {
      if (openBtn) openBtn.focus();
    });
  }

  function bindAlgoDialogs() {
    bindOneDialog(el.dialogToken, el.tokenStepTrigger, renderTokenViz);
    bindOneDialog(el.dialogSubject, el.subjectStepTrigger, renderSubjectViz);
    bindOneDialog(el.dialogTempo, el.tempoStepTrigger, renderTempoViz);
    bindOneDialog(el.dialogConj, el.ruleStepTrigger, renderConjViz);
    bindStaticDialog(el.dialogProject, el.btnProjectContext);

    window.addEventListener("resize", function () {
      if (el.dialogSubject && el.dialogSubject.open && el.subjectVizMount) {
        layoutSubjectVizArc(el.subjectVizMount);
      }
    });
  }

  function init() {
    bindAlgoDialogs();

    buildExampleList();
    selectedExampleIndex = 0;
    el.input.value = exemploTexto(EXAMPLES[0]);

    if (el.exampleList) {
      el.exampleList.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          selectExample(Math.min(selectedExampleIndex + 1, EXAMPLES.length - 1), true);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          selectExample(Math.max(selectedExampleIndex - 1, 0), true);
        } else if (e.key === "Home") {
          e.preventDefault();
          selectExample(0, true);
        } else if (e.key === "End") {
          e.preventDefault();
          selectExample(EXAMPLES.length - 1, true);
        }
      });
    }

    el.btnAnalyze.addEventListener("click", runAnalysis);
    el.btnReset.addEventListener("click", function () {
      lastPipeline = null;
      el.input.value = "";
      el.output.textContent = "O resultado aparecerá aqui após a análise.";
      el.output.classList.remove("is-busy");
      el.output.removeAttribute("aria-busy");
      setStepsVisible(false);
      resetStepsUi();
      el.placeholder.innerHTML =
        "<p>Selecione um exemplo ou digite uma frase e clique em <strong>Analisar</strong>.</p>";
    });

    el.input.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        runAnalysis();
      }
    });

    runAnalysis();
  }

  init();
})();
