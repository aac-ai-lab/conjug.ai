/**
 * Insere botão «Copiar código Mermaid» antes de cada diagrama e inicializa o Mermaid
 * com startOnLoad: false + mermaid.run().
 * Requer mermaid.min.js carregado antes deste ficheiro.
 *
 * @param {object} [mermaidOpts] - Opções passadas a mermaid.initialize (theme, themeVariables, flowchart, …).
 */
(function (global) {
  "use strict";

  function injectCopyButtons() {
    var sel = ".diagram-block .mermaid, .diagram-mermaid .mermaid";
    var els = document.querySelectorAll(sel);
    els.forEach(function (el) {
      var source = el.textContent.replace(/\r\n/g, "\n").trim();
      var toolbar = document.createElement("div");
      toolbar.className = "mermaid-toolbar";

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-ghost btn-mermaid-copy";
      btn.setAttribute("aria-label", "Copiar código fonte Mermaid deste diagrama");
      var label = "Copiar código Mermaid";
      btn.textContent = label;

      btn.addEventListener("click", function () {
        function flash(ok) {
          btn.textContent = ok ? "Copiado!" : "Erro ao copiar";
          setTimeout(function () {
            btn.textContent = label;
          }, 2000);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(source).then(function () {
            flash(true);
          }).catch(function () {
            flash(false);
          });
        } else {
          try {
            var ta = document.createElement("textarea");
            ta.value = source;
            ta.setAttribute("readonly", "");
            ta.style.position = "fixed";
            ta.style.left = "-9999px";
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
            flash(true);
          } catch (e) {
            flash(false);
          }
        }
      });

      toolbar.appendChild(btn);
      el.parentNode.insertBefore(toolbar, el);
    });
  }

  function initConjugaiMermaid(mermaidOpts) {
    if (typeof mermaid === "undefined") {
      console.warn("mermaid-copy: mermaid não está definido.");
      return;
    }

    injectCopyButtons();

    var base = {
      startOnLoad: false,
      theme: "dark",
      securityLevel: "loose",
    };
    var merged = Object.assign(base, mermaidOpts || {});
    mermaid.initialize(merged);

    if (typeof mermaid.run === "function") {
      return mermaid.run();
    }
    if (typeof mermaid.init === "function") {
      mermaid.init(undefined, document.querySelectorAll(".mermaid"));
    }
    return undefined;
  }

  global.initConjugaiMermaid = initConjugaiMermaid;
})(typeof globalThis !== "undefined" ? globalThis : window);
