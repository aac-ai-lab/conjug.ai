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
    {
      texto: "Eu comer e ele dormir",
      rotulo:
        "Oração composta coordenada: o «e» liga duas orações após o primeiro verbo; sujeito e tempo por oração.",
      badges: [
        { texto: "Oração composta", tipo: "other" },
        { texto: "2 sujeitos", tipo: "subject" },
        { texto: "Presente", tipo: "time" },
      ],
    },
    {
      texto: "Eu comer ou ele dormir",
      rotulo:
        "Coordenação disjuntiva («ou») após o primeiro verbo; teste com botão «Amanhã» (futuro) para conjugar as duas orações.",
      badges: [
        { texto: "Composta (ou)", tipo: "other" },
        { texto: "2 sujeitos", tipo: "subject" },
        { texto: "Ver futuro na UI", tipo: "time" },
      ],
    },
    {
      texto: "Eu comer pizza e dormir",
      rotulo:
        "Dois predicados (mesmo sujeito); a segunda parte sem pronome omite «eu» repetido na frase corrigida.",
      badges: [
        { texto: "Composta (e)", tipo: "other" },
        { texto: "Sujeito 1.ª sg.", tipo: "subject" },
        { texto: "Presente", tipo: "time" },
      ],
    },
    {
      texto: "Ele viajar mas eu ficar",
      rotulo:
        "Coordenação adversativa («mas»); conjugação e tempo calculados em cada oração em separado.",
      badges: [
        { texto: "Composta (mas)", tipo: "other" },
        { texto: "2 tempos/heur.", tipo: "time" },
        { texto: "Conjugação", tipo: "verb" },
      ],
    },
    {
      texto: "Eu ter que comer maçã",
      rotulo:
        "Locução verbal «ter que» + infinitivo: o núcleo é «ter»; «que» não dispara subjuntivo neste padrão.",
      badges: [
        { texto: "Locução verbal", tipo: "locucao" },
        { texto: "Presente", tipo: "time" },
        { texto: "Conjugação", tipo: "verb" },
      ],
    },
    {
      texto: "Tenho que comer pizza",
      rotulo:
        "«Tenho que»: forma flexionada de «ter» + locução; sujeito implícito «eu» na correção.",
      badges: [
        { texto: "ter + que", tipo: "locucao" },
        { texto: "Presente", tipo: "time" },
        { texto: "Sujeito implícito", tipo: "subject" },
      ],
    },
    {
      texto: "Posso nadar",
      rotulo:
        "«posso» + infinitivo: núcleo «poder» (evita colisão léxica «posso»/«possar»).",
      badges: [
        { texto: "Modal (poder)", tipo: "locucao" },
        { texto: "Presente", tipo: "time" },
        { texto: "Conjugação", tipo: "verb" },
      ],
    },
    {
      texto: "Eu começar a trabalhar amanhã",
      rotulo:
        "Locução «começar a» + infinitivo; «amanhã» → futuro na segunda parte do predicado.",
      badges: [
        { texto: "começar a", tipo: "locucao" },
        { texto: "Futuro", tipo: "time" },
        { texto: "Conjugação", tipo: "verb" },
      ],
    },
    {
      texto: "Eu acabar de dormir",
      rotulo:
        "«acabar de» + infinitivo: núcleo no verbo auxiliar «acabar».",
      badges: [
        { texto: "acabar de", tipo: "locucao" },
        { texto: "Presente", tipo: "time" },
        { texto: "Conjugação", tipo: "verb" },
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
    timeBtns: document.querySelectorAll(".time-btn"),
  };

  function badgeClass(tipo) {
    var m = {
      subject: "example-badge--subject",
      time: "example-badge--time",
      verb: "example-badge--verb",
      other: "example-badge--other",
      locucao: "example-badge--locucao",
    };
    return m[tipo] || m.other;
  }

  function selectExample(index, runAnalysisAfter) {
    if (index < 0 || index >= EXAMPLES.length) return;
    selectedExampleIndex = index;
    el.input.value = exemploTexto(EXAMPLES[index]);
    
    // Ao selecionar um exemplo, resetamos o tempo para Auto para deixar a heurística trabalhar,
    // a menos que o usuário queira testar manualmente.
    updateTimeSelection("auto");

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

  function updateTimeSelection(timeValue) {
    el.timeBtns.forEach(btn => {
      const active = btn.getAttribute("data-time") === timeValue;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-checked", active ? "true" : "false");
    });
  }

  function getSelectedTime() {
    const activeBtn = Array.from(el.timeBtns).find(btn => btn.classList.contains("is-active"));
    const val = activeBtn ? activeBtn.getAttribute("data-time") : "auto";
    return val === "auto" ? null : val;
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
   * @param {string|null} manualTime
   * @returns {{ ok: boolean, error?: string, analysis?: object }}
   */
  async function analyze(raw, manualTime) {
    var core = getCore();
    if (!core || typeof core.analisarFrase !== "function") {
      return {
        ok: false,
        error: "Biblioteca conjugai-core não carregada (assets/js/conjugai-core.js).",
      };
    }

    // Passamos o contexto manual para o motor
    var contexto = manualTime ? { tempo: manualTime } : {};
    var r = await core.analisarFrase(String(raw).trim(), contexto);
    
    if (r.erro) {
      return { ok: false, error: r.erro };
    }

    var nomeTempo = labelTempo(r.tempo.tipo);
    var ruleLine;
    if (r.composta && r.oracoes && r.oracoes.length > 1) {
      ruleLine = r.oracoes
        .map(function (o, i) {
          var nt = labelTempo(o.tempo.tipo);
          return "Oração " + (i + 1) + ": aplicar " + nt + " de «" + o.verbo.infinitivo + "» para " + o.sujeito.texto + ".";
        })
        .join(" ");
    } else {
      ruleLine = "Aplicar " + nomeTempo + " de «" + r.verbo.infinitivo + "» para " + r.sujeito.texto + ".";
    }

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

    var subjectDisplay =
      r.composta && r.oracoes && r.oracoes.length > 1
        ? r.oracoes
            .map(function (o, i) {
              return "Oração " + (i + 1) + ": " + o.sujeito.texto + " (pessoa " + o.sujeito.pessoa + ")";
            })
            .join(" | ")
        : r.sujeito.texto + " (pessoa " + r.sujeito.pessoa + ")";

    return {
      ok: true,
      analysis: {
        tokens: r.tokens,
        subject: {
          display: subjectDisplay,
          label: r.sujeito.rotulo || "—",
        },
        temporal: {
          label: r.debug.etapa3.replace(/^Tempo:\s*/, ""),
          isManual: !!manualTime
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
          oracaoComposta: !!r.composta,
          oracoes: r.oracoes || null,
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
      el.timeDesc.textContent = analysis.temporal.isManual ? "Prioridade de tempo manual ativada." : "Ler marcadores temporais na frase.";
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
    var manualTime = getSelectedTime();
    var result = await analyze(raw, manualTime);
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

  // --- Inicialização ---

  buildExampleList();

  el.btnAnalyze.addEventListener("click", runAnalysis);
  el.btnReset.addEventListener("click", function () {
    el.input.value = "";
    updateTimeSelection("auto");
    setStepsVisible(false);
    el.output.textContent = "O resultado aparecerá aqui após a análise.";
  });

  el.timeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      updateTimeSelection(btn.getAttribute("data-time"));
    });
  });

  // Modal handlers
  [el.tokenStepTrigger, el.subjectStepTrigger, el.tempoStepTrigger, el.ruleStepTrigger].forEach(function (trigger) {
    if (!trigger) return;
    trigger.addEventListener("click", function () {
      var dialogId = trigger.getAttribute("aria-controls");
      var dialog = document.getElementById(dialogId);
      if (dialog) {
        if (dialogId === "dialog-token-algo") renderTokenViz();
        if (dialogId === "dialog-subject-algo") renderSubjectViz();
        if (dialogId === "dialog-tempo-algo") renderTempoViz();
        if (dialogId === "dialog-conj-algo") renderConjViz();
        dialog.showModal();
      }
    });
  });

  el.btnProjectContext.addEventListener("click", function () {
    if (el.dialogProject) el.dialogProject.showModal();
  });

  document.querySelectorAll("[data-close-dialog]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var d = btn.closest("dialog");
      if (d) d.close();
    });
  });

  // Helpers auxiliares (copiados ou adaptados do diagram-logic.js para manter self-contained na demo)
  function layoutSubjectVizArc(host) {
    var svg = host.querySelector(".subject-viz__svg");
    var path = host.querySelector(".subject-viz__path");
    var diagram = host.querySelector(".subject-viz__diagram");
    if (!svg || !path || !diagram) return;

    var verbEl = host.querySelector('[data-viz-role="verb"]');
    var prefixEls = host.querySelectorAll(".subject-viz__wcell--prefix");
    var implicitEl = host.querySelector(".subject-viz__wcell--implicit");

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
  }

})();
