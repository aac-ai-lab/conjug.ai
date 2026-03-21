/**
 * ConjugAI — UI e orquestração. Lógica linguística em conjugai-core (assets/js/conjugai-core.js).
 */
(function () {
  "use strict";

  const EXAMPLES = [
    "Eu comer maçã",
    "Mamãe e eu ir shopping amanhã",
    "Ele viajar ontem",
    "Nós querer brincar",
  ];

  const el = {
    select: document.getElementById("example-select"),
    input: document.getElementById("raw-input"),
    btnAnalyze: document.getElementById("btn-analyze"),
    btnReset: document.getElementById("btn-reset"),
    placeholder: document.getElementById("logic-placeholder"),
    steps: document.getElementById("steps"),
    tokensOut: document.getElementById("tokens-out"),
    subjectDesc: document.getElementById("subject-desc"),
    subjectOut: document.getElementById("subject-out"),
    timeDesc: document.getElementById("time-desc"),
    timeOut: document.getElementById("time-out"),
    ruleDesc: document.getElementById("rule-desc"),
    ruleOut: document.getElementById("rule-out"),
    output: document.getElementById("output-text"),
  };

  function getCore() {
    var g = typeof globalThis !== "undefined" ? globalThis : window;
    return g && g.ConjugaiCore ? g.ConjugaiCore : null;
  }

  /**
   * @param {string} raw
   * @returns {{ ok: boolean, error?: string, analysis?: object }}
   */
  function analyze(raw) {
    var core = getCore();
    if (!core || typeof core.analisarFrase !== "function") {
      return {
        ok: false,
        error: "Biblioteca conjugai-core não carregada (assets/js/conjugai-core.js).",
      };
    }

    var r = core.analisarFrase(String(raw).trim());
    if (r.erro) {
      return { ok: false, error: r.erro };
    }

    var nomeTempo =
      r.tempo.tipo === "futuro"
        ? "Futuro do Presente"
        : r.tempo.tipo === "passado"
          ? "Pretérito Perfeito"
          : "Presente do indicativo";

    var ruleLine = "Aplicar " + nomeTempo + " de «" + r.verbo.infinitivo + "» para " + r.sujeito.texto + ".";

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
      },
    };
  }

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

  function runAnalysis() {
    var raw = el.input.value;
    var result = analyze(raw);
    if (!result.ok) {
      setStepsVisible(false);
      el.output.classList.remove("is-busy");
      el.output.removeAttribute("aria-busy");
      el.output.textContent = result.error || "Erro.";
      return;
    }
    runStepAnimation(result.analysis);
  }

  function syncSelectToInput() {
    var i = parseInt(el.select.value, 10);
    if (!Number.isNaN(i) && EXAMPLES[i] !== undefined) {
      el.input.value = EXAMPLES[i];
    }
  }

  function init() {
    el.select.innerHTML = EXAMPLES.map(function (ex, idx) {
      return '<option value="' + idx + '">' + ex + "</option>";
    }).join("");
    el.input.value = EXAMPLES[0];

    el.select.addEventListener("change", function () {
      syncSelectToInput();
      runAnalysis();
    });

    el.btnAnalyze.addEventListener("click", runAnalysis);
    el.btnReset.addEventListener("click", function () {
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
