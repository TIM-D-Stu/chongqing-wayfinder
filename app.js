/* =========================================================================
   app.js  —  UI wiring and event handlers
   -------------------------------------------------------------------------
   Computational Thinking: USER INTERACTION
   This file does no routing of its own. It listens for dropdown changes and
   button clicks, calls the router, and renders the result. The graph logic
   stays in router.js and the data stays in data.js, so the model and the
   view are cleanly separated.
   ========================================================================= */

(function () {
  "use strict";

  /* ------ DOM references ------ */
  const tabBtns    = document.querySelectorAll(".tab-btn");
  const pages      = document.querySelectorAll(".page");
  const startSel   = document.getElementById("start-select");
  const endSel     = document.getElementById("end-select");
  const findBtn    = document.getElementById("find-btn");
  const swapBtn    = document.getElementById("swap-btn");
  const formWrap   = document.getElementById("route-form-wrap");
  const resultBox  = document.getElementById("route-result");
  const errorArea  = document.getElementById("error-area");
  const lmGrid     = document.getElementById("landmarks-grid");

  /* ------ Tab navigation ------ */
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.toggle("active", b === btn));
      pages.forEach(p => p.classList.toggle("active", p.id === "page-" + target));
    });
  });

  /* ------ Populate the dropdowns from the LANDMARKS dataset ------ */
  function populateSelects() {
    const options = LANDMARKS.map(l =>
      `<option value="${l.id}">${l.name}  ·  ${l.cn}</option>`
    ).join("");
    startSel.innerHTML = options;
    endSel.innerHTML   = options;
    // Sensible defaults that produce an interesting route
    startSel.value = "jiefangbei";
    endSel.value   = "hongyadong";
  }

  /* ------ Populate the Landmarks tab ------ */
  function populateLandmarks() {
    lmGrid.innerHTML = LANDMARKS.map(l => `
      <div class="lm-card">
        <div class="lm-name">${l.name}</div>
        <div class="lm-cn">${l.cn.split("").join(" ")}</div>
        <div class="lm-elev">ELEVATION · L+${l.elevation}</div>
        <div class="lm-blurb">${l.blurb}</div>
      </div>
    `).join("");
  }

  /* ------ Swap button ------ */
  swapBtn.addEventListener("click", () => {
    const a = startSel.value;
    startSel.value = endSel.value;
    endSel.value   = a;
  });

  /* ------ Find Route ------ */
  findBtn.addEventListener("click", () => {
    errorArea.innerHTML = "";
    const startId = startSel.value;
    const endId   = endSel.value;

    if (startId === endId) {
      errorArea.innerHTML =
        `<div class="error">Pick two different landmarks to plan a route.</div>`;
      return;
    }

    const route = findRoute(startId, endId);
    if (!route || !route.steps || route.steps.length === 0) {
      errorArea.innerHTML =
        `<div class="error">No route found between those landmarks. Try a different pair.</div>`;
      return;
    }

    renderRoute(route, startId, endId);
  });

  /* ------ Render a computed route ------ */
  function renderRoute(route, startId, endId) {
    const start = LANDMARKS.find(l => l.id === startId);
    const end   = LANDMARKS.find(l => l.id === endId);
    const summary = summariseRoute(route);

    // Hide the form, show the result
    formWrap.style.display   = "none";
    resultBox.style.display  = "block";

    let html = `
      <div style="text-align:center; margin-bottom:8px;">
        <div style="font-family: var(--mono); font-size: 11px; letter-spacing: 0.3em; color: var(--gold); text-transform: uppercase; margin-bottom: 8px;">— Route —</div>
        <div style="font-size: 26px; font-weight: 600; color: var(--gold-light); line-height: 1.2;">
          ${start.name}
          <span style="color: var(--gold); margin: 0 8px;">→</span>
          ${end.name}
        </div>
        <div style="font-family: 'Noto Serif SC', serif; color: var(--text-dim); font-size: 14px; letter-spacing: 0.3em; margin-top: 6px;">
          ${start.cn} 至 ${end.cn}
        </div>
      </div>

      <div class="result-meta">
        <div class="stat">
          <div class="value">${summary.timeMinutes}</div>
          <div class="label">Minutes</div>
        </div>
        <div class="stat">
          <div class="value">${summary.totalMetres < 1000 ? summary.totalMetres + "m" : (summary.totalMetres/1000).toFixed(1) + "km"}</div>
          <div class="label">Distance</div>
        </div>
        <div class="stat">
          <div class="value">${summary.totalFloors}</div>
          <div class="label">Floors</div>
        </div>
        <div class="stat">
          <div class="value">${summary.stepCount}</div>
          <div class="label">Steps</div>
        </div>
      </div>

      <ol class="steps">
    `;

    // Start node
    html += `
      <li class="step">
        <div class="step-num">●</div>
        <div class="step-type">START</div>
        <div class="step-headline">${start.name}</div>
        <div class="step-detail">${start.cn} · Ground level L+${start.elevation}</div>
      </li>
    `;

    // Each step
    route.steps.forEach((edge, i) => {
      const style = EDGE_STYLE[edge.type] || EDGE_STYLE.walk;
      let floorText = "";
      if (edge.floors && edge.type !== "monorail") {
        floorText = ` · ${Math.abs(edge.floors)} ${Math.abs(edge.floors) === 1 ? "floor" : "floors"}`;
      }
      let distText = "";
      if (edge.dist) {
        distText = edge.dist < 1000 ? `${edge.dist}m` : `${(edge.dist/1000).toFixed(1)}km`;
      }
      const headline = `${style.icon} ${style.label}${distText ? " · " + distText : ""}${floorText}`;

      html += `
        <li class="step">
          <div class="step-num">${i + 1}</div>
          <div class="step-type">Step ${i + 1}</div>
          <div class="step-headline">${headline}</div>
          <div class="step-detail">${edge.text}</div>
        </li>
      `;
    });

    // End node
    html += `
      <li class="step terminus">
        <div class="step-num">★</div>
        <div class="step-type">Arrive</div>
        <div class="step-headline">${end.name}</div>
        <div class="step-detail">${end.cn} · L+${end.elevation}</div>
      </li>
    `;

    html += `</ol>
      <a class="reset-link" id="plan-another">↺  Plan another route</a>
    `;

    resultBox.innerHTML = html;
    // Smooth scroll to the top of the result
    window.scrollTo({ top: 0, behavior: "smooth" });

    document.getElementById("plan-another").addEventListener("click", () => {
      resultBox.style.display = "none";
      formWrap.style.display  = "block";
      errorArea.innerHTML = "";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ------ Init ------ */
  populateSelects();
  populateLandmarks();
})();
