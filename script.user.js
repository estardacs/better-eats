// ==UserScript==
// @name         Better Eats
// @namespace    https://github.com/pxue/better-eats
// @version      0.4
// @description  Filtros de ofertas para Uber Eats Chile
// @author       pxue
// @match        https://www.ubereats.com/*feed*
// @match        https://www.ubereats.com/*store*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ubereats.com
// @resource     FRANKEN_CSS https://unpkg.com/franken-ui@2.1.0/dist/css/core.min.css
// @require      http://code.jquery.com/jquery-3.6.0.min.js
// @require      https://raw.githubusercontent.com/uzairfarooq/arrive/master/minified/arrive.min.js
// @grant        GM_getResourceText
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  "use strict";

  jQuery.noConflict();

  const myCss = GM_getResourceText("FRANKEN_CSS");
  GM_addStyle(myCss);

  // ─── Logging ──────────────────────────────────────────────────────────────
  function log(msg, data) {
    const prefix = "%c[BetterEats]%c";
    const style1 = "color:#fff;background:#111827;padding:1px 5px;border-radius:3px;font-weight:bold";
    const style2 = "color:inherit";
    if (data !== undefined) {
      console.log(prefix + " " + msg, style1, style2, data);
    } else {
      console.log(prefix + " " + msg, style1, style2);
    }
  }

  // ─── Page context ─────────────────────────────────────────────────────────
  const onFeedPage  = window.location.href.includes("/feed");
  const onStorePage = window.location.href.includes("/store");
  log("Iniciando script en: " + window.location.pathname);
  log("Contexto de pagina: " + (onFeedPage ? "FEED (correcto para filtrar)" : onStorePage ? "STORE (pagina de un restaurante)" : "otro"));

  // ─── Strings de ofertas (Uber Eats Chile) ─────────────────────────────────
  const dealStrs = {
    bogoOnly:    "2X1",
    spend10Get8: "Gasta",
    hasOffers:   "Ofertas disponibles",
  };

  // ─── jQuery icontains ─────────────────────────────────────────────────────
  jQuery.expr[":"].icontains = jQuery.expr.createPseudo(function (arg) {
    return function (elem) {
      return jQuery(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
    };
  });

  // ─── Storage ──────────────────────────────────────────────────────────────
  const raw = window.localStorage.getItem("ubereats");
  const storedData = raw
    ? JSON.parse(raw)
    : { bogoOnly: false, spend10Get8: false, hasOffers: false, deliveryTimeMax: 0, excludeList: [] };
  if (!raw) window.localStorage.setItem("ubereats", JSON.stringify(storedData));

  log("Configuracion cargada:", {
    "2X1": storedData.bogoOnly,
    "Gasta y ahorra": storedData.spend10Get8,
    "Con ofertas": storedData.hasOffers,
    "Tiempo maximo (min)": storedData.deliveryTimeMax || "sin limite",
    "Lista negra": storedData.excludeList.filter(x => x.trim()) || [],
  });

  // ─── Panel CSS ────────────────────────────────────────────────────────────
  GM_addStyle(`
    #be-panel {
      position: fixed;
      bottom: 20px;
      left: 20px;
      width: 310px;
      background: #fff;
      border-radius: 14px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.18);
      z-index: 99999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      color: #111827;
      overflow: hidden;
      border: 1px solid #e5e7eb;
    }
    #be-header {
      background: #1c1c1e;
      color: #fff;
      padding: 12px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      user-select: none;
    }
    #be-header-left {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      font-size: 14px;
    }
    #be-dot {
      width: 9px; height: 9px;
      border-radius: 50%;
      background: #6b7280;
      flex-shrink: 0;
      transition: background 0.4s;
    }
    #be-dot.waiting  { background: #f59e0b; box-shadow: 0 0 6px #f59e0b88; }
    #be-dot.active   { background: #22c55e; box-shadow: 0 0 6px #22c55e88; }
    #be-dot.inactive { background: #6b7280; }
    #be-badge {
      background: rgba(255,255,255,0.15);
      border-radius: 6px;
      padding: 2px 8px;
      font-size: 11px;
      font-weight: 500;
    }
    #be-min-btn {
      background: none; border: none; color: #fff;
      cursor: pointer; font-size: 18px; line-height: 1;
      padding: 0 0 0 6px; opacity: 0.6;
    }
    #be-min-btn:hover { opacity: 1; }
    #be-body { padding: 14px; }
    #be-context {
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 12px;
      font-size: 12px;
      display: flex;
      align-items: flex-start;
      gap: 7px;
      line-height: 1.4;
    }
    #be-context.ok     { background: #f0fdf4; color: #166534; }
    #be-context.warn   { background: #fef3c7; color: #92400e; }
    #be-context.info   { background: #f0f9ff; color: #0c4a6e; }
    #be-context-icon   { font-size: 14px; flex-shrink: 0; margin-top: 1px; }
    #be-stats {
      display: flex;
      justify-content: space-around;
      background: #f9fafb;
      border-radius: 10px;
      padding: 10px 8px;
      margin-bottom: 14px;
    }
    .be-stat { text-align: center; }
    .be-stat-n { font-size: 20px; font-weight: 700; line-height: 1; }
    .be-stat-n.g { color: #16a34a; }
    .be-stat-n.r { color: #dc2626; }
    .be-stat-n.d { color: #6b7280; }
    .be-stat-l { font-size: 10px; color: #9ca3af; margin-top: 3px; }
    .be-sep { width: 1px; background: #e5e7eb; }
    .be-section {
      font-size: 10px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.8px;
      color: #9ca3af; margin: 14px 0 8px;
    }
    .be-row {
      display: flex; align-items: center;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    .be-row:last-of-type { border-bottom: none; }
    .be-info { flex: 1; }
    .be-name { font-weight: 500; color: #111827; }
    .be-desc { font-size: 11px; color: #9ca3af; margin-top: 1px; }
    .be-toggle {
      position: relative; width: 40px; height: 22px;
      flex-shrink: 0; margin-left: 10px;
    }
    .be-toggle input { position: absolute; opacity: 0; width: 0; height: 0; }
    .be-slider {
      position: absolute; inset: 0;
      background: #d1d5db; border-radius: 22px;
      cursor: pointer; transition: background 0.2s;
    }
    .be-slider:before {
      content: ''; position: absolute;
      width: 16px; height: 16px;
      left: 3px; top: 3px;
      background: white; border-radius: 50%;
      transition: transform 0.2s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
    .be-toggle input:checked + .be-slider { background: #111827; }
    .be-toggle input:checked + .be-slider:before { transform: translateX(18px); }
    .be-input, .be-textarea {
      width: 100%;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 7px 10px;
      font-size: 13px;
      font-family: inherit;
      color: #111827;
      box-sizing: border-box;
      outline: none;
      margin-top: 6px;
    }
    .be-input:focus, .be-textarea:focus { border-color: #111827; }
    .be-textarea { resize: vertical; height: 68px; }
    .be-hint { font-size: 11px; color: #9ca3af; margin-top: 4px; line-height: 1.4; }
    #be-footer {
      padding: 10px 14px;
      border-top: 1px solid #f3f4f6;
      display: flex; gap: 8px;
    }
    .be-btn {
      flex: 1; padding: 7px 0;
      border-radius: 8px;
      font-size: 12px; font-weight: 500;
      cursor: pointer; font-family: inherit;
      border: 1px solid #e5e7eb;
      transition: background 0.15s;
    }
    .be-btn-ghost { background: #fff; color: #374151; }
    .be-btn-ghost:hover { background: #f9fafb; }
    .be-btn-dark { background: #111827; color: #fff; border-color: #111827; }
    .be-btn-dark:hover { background: #374151; }
    #be-log-area {
      background: #1c1c1e;
      color: #d1fae5;
      font-family: monospace;
      font-size: 11px;
      padding: 10px 12px;
      max-height: 90px;
      overflow-y: auto;
      line-height: 1.6;
      display: none;
    }
    #be-log-area p { margin: 0; }
    #be-log-area p.warn { color: #fef08a; }
    #be-log-area p.error { color: #fca5a5; }
    #be-log-toggle {
      text-align: center;
      padding: 5px;
      font-size: 11px;
      color: #9ca3af;
      cursor: pointer;
      border-top: 1px solid #f3f4f6;
    }
    #be-log-toggle:hover { color: #374151; }
  `);

  // ─── Main logic ───────────────────────────────────────────────────────────
  jQuery(document).ready(function ($) {
    let itemClass  = "";
    let feedEl     = null;
    let statsTimer = null;
    let panelReady = false;

    function saveData() {
      window.localStorage.setItem("ubereats", JSON.stringify(storedData));
    }

    // Extracts a readable name from the restaurant card link
    function getRestaurantName(el) {
      const href = $("a", el).first().attr("href") || "";
      const match = href.match(/\/store\/([^/?]+)/);
      if (match) return decodeURIComponent(match[1]).replace(/-/g, " ");
      return "(nombre desconocido)";
    }

    // Append a line to the in-panel log area
    function panelLog(msg, type) {
      if (!panelReady) return;
      const area = $("#be-log-area");
      const p = $("<p>").text(msg);
      if (type) p.addClass(type);
      area.append(p);
      area.scrollTop(area[0].scrollHeight);
    }

    function renderStats() {
      if (!panelReady) return;
      $("#be-stat-v").text(stats.visible);
      $("#be-stat-h").text(stats.hidden);
      $("#be-stat-t").text(stats.total);
      $("#be-badge").text(stats.total > 0 ? stats.visible + "/" + stats.total : "...");
    }

    const stats = { visible: 0, hidden: 0, total: 0 };

    function updateStats() {
      if (!feedEl) return;
      const all = $("> div", feedEl);
      stats.total   = all.length;
      stats.hidden  = all.filter(":hidden").length;
      stats.visible = stats.total - stats.hidden;
      log(`Resultado final: ${stats.visible} visibles / ${stats.hidden} ocultos / ${stats.total} total`);
      panelLog(`Mostrando ${stats.visible} de ${stats.total} restaurantes`);
      renderStats();
    }

    function scheduleStats() {
      if (statsTimer) clearTimeout(statsTimer);
      statsTimer = setTimeout(updateStats, 1400);
    }

    function refilterAll() {
      if (!feedEl) {
        log("refilterAll() llamado pero el feed aun no fue detectado");
        return;
      }
      const active = Object.keys(dealStrs)
        .filter(k => storedData[k])
        .map(k => dealStrs[k]);
      log("Re-filtrando todos los restaurantes. Filtros activos: " + (active.length ? active.join(", ") : "ninguno"));
      panelLog("Aplicando filtros...");
      $("> div", feedEl).each(function () {
        autoFilterItems($(this));
      });
      scheduleStats();
    }

    function autoFilterItems(el, retries = 6) {
      const text = $(el).text().trim();
      // A fully loaded card always has a delivery time ("min")
      // If it's missing, the offer badges haven't rendered yet either
      const isReady = text.length > 20 && text.includes("min");
      if (!isReady) {
        if (retries > 0) {
          setTimeout(() => autoFilterItems(el, retries - 1), 700);
        }
        return;
      }

      if (itemClass === "") {
        itemClass = $(el).attr("class");
      }

      function shouldHide() {
        // 1. Lista negra
        for (const ex of storedData.excludeList) {
          if (!ex.trim()) continue;
          const href = $("a", el).attr("href") || "";
          if (href.toLowerCase().includes(ex.toLowerCase()) ||
              text.toLowerCase().includes(ex.toLowerCase())) {
            return [true, 'lista negra ("' + ex + '")'];
          }
        }

        // 2. Filtros de oferta
        const checks = Object.keys(dealStrs)
          .map(k => (storedData[k] ? text.toUpperCase().includes(dealStrs[k].toUpperCase()) : null))
          .filter(v => v !== null);

        if (checks.length > 0 && checks.every(v => !v)) {
          return [true, "no cumple ninguna oferta activa"];
        }

        // 3. Tiempo de entrega
        if (storedData.deliveryTimeMax > 0) {
          const timeSpan = $("span", el).filter(function () {
            return $(this).text().includes("min") && $(this).children().length === 0;
          }).first();
          const timeText = timeSpan.text().replace(/min/i, "").trim();
          if (timeText) {
            const parts = timeText.split(/[-\u2013]/);
            const maxTime = parseFloat(parts[parts.length - 1]);
            if (!isNaN(maxTime) && maxTime > storedData.deliveryTimeMax) {
              return [true, "tiempo de entrega (" + maxTime + " min > " + storedData.deliveryTimeMax + " min)"];
            }
          }
        }

        return [false, ""];
      }

      const [hide, reason] = shouldHide();
      if (hide) {
        const name = getRestaurantName(el);
        log(`  OCULTAR: "${name}" — ${reason}`);
        $(el).hide();
      } else if ($(el).is(":hidden")) {
        $(el).show();
      }
    }

    // ─── Observer ─────────────────────────────────────────────────────────
    const observer = new MutationObserver(function (mutations) {
      let count = 0;
      mutations.forEach(function (mutation) {
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(function (node) {
            if (itemClass === "" || $(node).attr("class") === itemClass) {
              autoFilterItems(node);
              count++;
            }
          });
        }
      });
      if (count > 0) {
        log(`${count} tarjeta(s) nuevas detectadas por scroll infinito`);
        scheduleStats();
      }
    });

    // ─── Build UI ─────────────────────────────────────────────────────────
    setTimeout(function () {
      const contextClass = onFeedPage ? "ok" : onStorePage ? "info" : "warn";
      const contextIcon  = onFeedPage ? "✓" : onStorePage ? "ℹ" : "⚠";
      const contextMsg   = onFeedPage
        ? "Estas en la pagina de Ofertas. Los filtros estan activos."
        : onStorePage
        ? "Estas viendo un restaurante especifico. Los filtros aplican en la pagina de Ofertas."
        : "Ve a ubereats.com/cl/feed para usar los filtros.";

      const panel = $(`
        <div id="be-panel">

          <div id="be-header">
            <div id="be-header-left">
              <span id="be-dot" class="${onFeedPage ? 'waiting' : 'inactive'}"></span>
              <span>Better Eats</span>
              <span id="be-badge">...</span>
            </div>
            <button id="be-min-btn" title="Minimizar">−</button>
          </div>

          <div id="be-body">

            <div id="be-context" class="${contextClass}">
              <span id="be-context-icon">${contextIcon}</span>
              <span>${contextMsg}</span>
            </div>

            <div id="be-stats">
              <div class="be-stat">
                <div class="be-stat-n g" id="be-stat-v">—</div>
                <div class="be-stat-l">visibles</div>
              </div>
              <div class="be-sep"></div>
              <div class="be-stat">
                <div class="be-stat-n r" id="be-stat-h">—</div>
                <div class="be-stat-l">ocultos</div>
              </div>
              <div class="be-sep"></div>
              <div class="be-stat">
                <div class="be-stat-n d" id="be-stat-t">—</div>
                <div class="be-stat-l">total</div>
              </div>
            </div>

            <div class="be-section">Filtros de oferta</div>
            <div class="be-row">
              <div class="be-info">
                <div class="be-name">Solo 2X1</div>
                <div class="be-desc">Muestra unicamente restaurantes con oferta 2 por 1</div>
              </div>
              <label class="be-toggle">
                <input type="checkbox" id="be-bogo" ${storedData.bogoOnly ? "checked" : ""}>
                <span class="be-slider"></span>
              </label>
            </div>
            <div class="be-row">
              <div class="be-info">
                <div class="be-name">Gasta y ahorra</div>
                <div class="be-desc">Ej: "Gasta $12.000, ahorra $4.000"</div>
              </div>
              <label class="be-toggle">
                <input type="checkbox" id="be-spend" ${storedData.spend10Get8 ? "checked" : ""}>
                <span class="be-slider"></span>
              </label>
            </div>
            <div class="be-row">
              <div class="be-info">
                <div class="be-name">Con ofertas disponibles</div>
                <div class="be-desc">Tiene al menos una oferta activa</div>
              </div>
              <label class="be-toggle">
                <input type="checkbox" id="be-offers" ${storedData.hasOffers ? "checked" : ""}>
                <span class="be-slider"></span>
              </label>
            </div>

            <div class="be-section">Tiempo de entrega</div>
            <input type="number" id="be-delivery" class="be-input"
              placeholder="Ej: 35   (0 o vacio = sin limite)"
              value="${storedData.deliveryTimeMax || ""}">
            <div class="be-hint">Oculta restaurantes con tiempo de entrega mayor a este valor (en minutos)</div>

            <div class="be-section">Lista negra</div>
            <textarea id="be-exclude" class="be-textarea"
              placeholder="mcdonald&#10;subway&#10;pizza hut">${storedData.excludeList.filter(x => x.trim()).join("\n")}</textarea>
            <div class="be-hint">Un nombre por linea. Oculta cualquier restaurante que contenga ese texto.</div>

          </div>

          <div id="be-log-toggle">ver log de consola interno</div>
          <div id="be-log-area"></div>

          <div id="be-footer">
            <button class="be-btn be-btn-ghost" id="be-reset">Limpiar filtros</button>
            <button class="be-btn be-btn-dark"  id="be-apply">Recargar pagina</button>
          </div>

        </div>
      `);

      $("body").append(panel);
      panelReady = true;

      // Minimize toggle
      let collapsed = false;
      $("#be-min-btn").on("click", function (e) {
        e.stopPropagation();
        collapsed = !collapsed;
        if (collapsed) {
          $("#be-body, #be-footer, #be-log-area, #be-log-toggle").hide();
          $(this).text("+").attr("title", "Expandir");
        } else {
          $("#be-body, #be-footer, #be-log-toggle").show();
          $(this).text("−").attr("title", "Minimizar");
        }
      });

      // Log toggle
      let logOpen = false;
      $("#be-log-toggle").on("click", function () {
        logOpen = !logOpen;
        $("#be-log-area").toggle(logOpen);
        $(this).text(logOpen ? "ocultar log" : "ver log de consola interno");
      });

      // Toggles
      $("#be-bogo").on("change", function () {
        storedData.bogoOnly = $(this).is(":checked");
        log("Filtro 2X1: " + (storedData.bogoOnly ? "ACTIVADO" : "desactivado"));
        panelLog("Filtro 2X1: " + (storedData.bogoOnly ? "activado" : "desactivado"), storedData.bogoOnly ? "" : "warn");
        saveData(); refilterAll();
      });
      $("#be-spend").on("change", function () {
        storedData.spend10Get8 = $(this).is(":checked");
        log("Filtro Gasta y ahorra: " + (storedData.spend10Get8 ? "ACTIVADO" : "desactivado"));
        panelLog("Filtro Gasta y ahorra: " + (storedData.spend10Get8 ? "activado" : "desactivado"), storedData.spend10Get8 ? "" : "warn");
        saveData(); refilterAll();
      });
      $("#be-offers").on("change", function () {
        storedData.hasOffers = $(this).is(":checked");
        log("Filtro Con ofertas: " + (storedData.hasOffers ? "ACTIVADO" : "desactivado"));
        panelLog("Filtro Con ofertas: " + (storedData.hasOffers ? "activado" : "desactivado"), storedData.hasOffers ? "" : "warn");
        saveData(); refilterAll();
      });

      // Delivery time
      $("#be-delivery").on("blur", function () {
        const val = parseFloat($(this).val()) || 0;
        storedData.deliveryTimeMax = val;
        log("Tiempo maximo de entrega: " + (val > 0 ? val + " min" : "sin limite"));
        panelLog("Tiempo maximo: " + (val > 0 ? val + " min" : "sin limite"));
        saveData(); refilterAll();
      });

      // Exclusion list
      $("#be-exclude").on("blur", function () {
        storedData.excludeList = $(this).val().split("\n").map(x => x.trim()).filter(x => x);
        log("Lista negra actualizada:", storedData.excludeList);
        panelLog("Lista negra: " + storedData.excludeList.length + " entradas");
        saveData(); refilterAll();
      });

      // Reset
      $("#be-reset").on("click", function () {
        storedData.bogoOnly = false;
        storedData.spend10Get8 = false;
        storedData.hasOffers = false;
        storedData.deliveryTimeMax = 0;
        storedData.excludeList = [];
        $("#be-bogo").prop("checked", false);
        $("#be-spend").prop("checked", false);
        $("#be-offers").prop("checked", false);
        $("#be-delivery").val("");
        $("#be-exclude").val("");
        log("Todos los filtros limpiados");
        panelLog("Filtros limpiados — mostrando todo", "warn");
        saveData(); refilterAll();
      });

      // Apply (reload)
      $("#be-apply").on("click", function () {
        log("Recargando pagina...");
        location.reload();
      });

      log("Panel UI listo");
      panelLog("Panel listo. Esperando feed de Uber Eats...");

      // If feed already arrived before panel was ready, update dot now
      if (feedEl) {
        $("#be-dot").removeClass("waiting inactive").addClass("active");
        updateStats();
      }

    }, 2000);

    // ─── arrive: detectar el feed principal ───────────────────────────────
    $("main").arrive("div[data-test='feed-desktop']", { onlyOnce: true }, function () {
      if (feedEl) return;
      feedEl = $(this);

      log("Feed principal detectado — iniciando filtrado inicial");
      panelLog("Feed detectado. Filtrando...");

      $("#be-dot").removeClass("waiting inactive").addClass("active");

      feedEl.css("grid-template-columns", "repeat(5, 1fr)");
      feedEl.css("gap", "20px 8px");

      const activeFilters = Object.keys(dealStrs).filter(k => storedData[k]);
      if (activeFilters.length === 0 && !storedData.deliveryTimeMax && !storedData.excludeList.filter(x => x.trim()).length) {
        log("Sin filtros activos — mostrando todos los restaurantes");
        panelLog("Sin filtros activos");
      } else {
        log("Filtros activos: " + activeFilters.map(k => dealStrs[k]).join(", "));
      }

      $("> div", feedEl).each(function () {
        autoFilterItems($(this));
      });

      // Second pass after 3s to catch cards whose offer badges loaded late
      setTimeout(function () {
        log("Segundo pase de filtrado (badges con carga lenta)...");
        panelLog("Verificando ofertas que cargaron tarde...");
        $("> div", feedEl).each(function () {
          autoFilterItems($(this));
        });
        scheduleStats();
      }, 3000);

      scheduleStats();

      observer.observe(feedEl[0], { childList: true });
    });

    log("Script listo — esperando que cargue el feed");
  });

})();
