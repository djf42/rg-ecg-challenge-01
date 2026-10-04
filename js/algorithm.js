/* RECOVER CPR ECG Algorithm (2024), redrawn so the path to any diagnosis can be highlighted.
   Algorithm.render(correctCat, chosenCat) returns the flowchart (correct path in red, learner's wrong pick
   outlined); tapping it opens a full-screen viewer with pinch / +/- zoom and panning. */
window.Algorithm = (function () {
  // nodes: x, y = center; w, h = size
  const N = {
    root: { x: 395, y: 34,  w: 210, h: 46, lines: ["Palpable pulse?"], q: true },
    cons: { x: 250, y: 132, w: 270, h: 56, lines: ["Consistent, repeating", "complexes on ECG?"], q: true },
    rosc: { x: 548, y: 132, w: 172, h: 56, lines: ["Perfusing rhythm", "= ROSC"], cat: "rosc" },
    rate: { x: 150, y: 236, w: 200, h: 46, lines: ["Rate > 200/min?"], q: true },
    flat: { x: 460, y: 236, w: 230, h: 46, lines: ["Is the ECG a flat line?"], q: true },
    pvt:  { x: 80,  y: 344, w: 144, h: 64, lines: ["Pulseless VT"], sub: "Shockable", cat: "pvt" },
    pea:  { x: 236, y: 344, w: 144, h: 64, lines: ["PEA"], sub: "Non-shockable", cat: "pea" },
    vf:   { x: 400, y: 344, w: 144, h: 64, lines: ["VF"], sub: "Shockable", cat: "vf" },
    asys: { x: 560, y: 344, w: 144, h: 64, lines: ["Asystole"], sub: "Non-shockable", cat: "asys" }
  };
  const E = [
    ["root", "cons", "No"], ["root", "rosc", "Yes"],
    ["cons", "rate", "Yes"], ["cons", "flat", "No"],
    ["rate", "pvt", "Yes"], ["rate", "pea", "No"],
    ["flat", "vf", "No"], ["flat", "asys", "Yes"]
  ];
  const PATH = {
    rosc: ["root", "rosc"],
    pvt:  ["root", "cons", "rate", "pvt"],
    pea:  ["root", "cons", "rate", "pea"],
    vf:   ["root", "cons", "flat", "vf"],
    asys: ["root", "cons", "flat", "asys"]
  };
  const RED = "#ee3c36", NAVY = "#022033", MUTED = "#9aa6af", LINE = "#cfd5da";
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  function svg(correct, chosen) {
    const path = PATH[correct] || [];
    const onPath = id => path.includes(id);
    const edgeOn = (a, b) => { const i = path.indexOf(a); return i >= 0 && path[i + 1] === b; };
    const wrongNode = chosen && chosen !== correct ? Object.keys(N).find(k => N[k].cat === chosen) : null;
    let out = '<svg viewBox="0 0 640 404" role="img" aria-label="RECOVER CPR ECG algorithm with the path to the correct diagnosis highlighted" xmlns="http://www.w3.org/2000/svg">';

    // edges first (behind the boxes)
    E.forEach(([a, b, label]) => {
      const A = N[a], B = N[b], on = edgeOn(a, b);
      const x1 = A.x + (B.x < A.x ? -1 : 1) * Math.min(A.w / 2 - 30, Math.abs(B.x - A.x) / 2), y1 = A.y + A.h / 2;
      const x2 = B.x, y2 = B.y - B.h / 2, ym = (y1 + y2) / 2;
      out += '<path d="M' + x1 + ' ' + y1 + ' V ' + ym + ' H ' + x2 + ' V ' + (y2 - 2) + '" fill="none" stroke="' + (on ? RED : LINE) + '" stroke-width="' + (on ? 4 : 2) + '" stroke-linejoin="round"/>';
      out += '<path d="M' + (x2 - 6) + ' ' + (y2 - 9) + ' L ' + x2 + ' ' + (y2 - 1) + ' L ' + (x2 + 6) + ' ' + (y2 - 9) + '" fill="none" stroke="' + (on ? RED : LINE) + '" stroke-width="' + (on ? 4 : 2) + '" stroke-linecap="round" stroke-linejoin="round"/>';
      // Yes/No pill on the horizontal run
      const lx = (x1 + x2) / 2 + (Math.abs(x2 - x1) < 10 ? 0 : 0);
      out += '<g><rect x="' + (lx - 20) + '" y="' + (ym - 11) + '" width="40" height="22" rx="11" fill="' + (on ? RED : "#ffffff") + '" stroke="' + (on ? RED : LINE) + '" stroke-width="1.5"/>' +
             '<text x="' + lx + '" y="' + (ym + 5) + '" text-anchor="middle" font-family="Source Sans 3, Arial, sans-serif" font-weight="700" font-size="13" fill="' + (on ? "#ffffff" : MUTED) + '">' + label + '</text></g>';
    });

    // boxes
    Object.entries(N).forEach(([id, n]) => {
      const on = onPath(id), isWrong = id === wrongNode;
      const fill = on ? (n.cat ? RED : NAVY) : "#ffffff";
      const stroke = on ? (n.cat ? RED : NAVY) : LINE;
      const color = on ? "#ffffff" : MUTED;
      const x = n.x - n.w / 2, y = n.y - n.h / 2;
      out += '<rect x="' + x + '" y="' + y + '" width="' + n.w + '" height="' + n.h + '" rx="10" fill="' + fill + '" stroke="' + stroke + '" stroke-width="2"/>';
      if (isWrong) {
        out += '<rect x="' + (x - 5) + '" y="' + (y - 5) + '" width="' + (n.w + 10) + '" height="' + (n.h + 10) + '" rx="13" fill="none" stroke="' + NAVY + '" stroke-width="2.5" stroke-dasharray="6 5"/>';
        out += '<text x="' + n.x + '" y="' + (y + n.h + 21) + '" text-anchor="middle" font-family="Source Sans 3, Arial, sans-serif" font-weight="700" font-size="12" letter-spacing="1" fill="' + NAVY + '">YOUR ANSWER</text>';
      }
      const big = n.cat ? 17 : 15, weight = n.cat ? 800 : 700;
      const lines = n.lines.concat(n.sub ? [] : []);
      const total = lines.length + (n.sub ? 1 : 0);
      const startY = n.y - (total - 1) * 9 + 5;
      lines.forEach((t, i) => {
        out += '<text x="' + n.x + '" y="' + (startY + i * 18) + '" text-anchor="middle" font-family="Outfit, Arial, sans-serif" font-weight="' + weight + '" font-size="' + big + '" fill="' + (on ? "#ffffff" : (isWrong ? NAVY : MUTED)) + '">' + esc(t) + '</text>';
      });
      if (n.sub) out += '<text x="' + n.x + '" y="' + (startY + lines.length * 18) + '" text-anchor="middle" font-family="Source Sans 3, Arial, sans-serif" font-weight="600" font-size="13" fill="' + (on ? "#ffffff" : (isWrong ? NAVY : MUTED)) + '">' + esc(n.sub) + '</text>';
    });
    return out + "</svg>";
  }

  // narrow screens: the same path as a list of steps
  function steps(correct) {
    const path = PATH[correct] || [];
    const ol = document.createElement("ol"); ol.className = "algo-steps";
    path.forEach((id, i) => {
      const n = N[id], li = document.createElement("li");
      if (n.q) {
        const next = path[i + 1], edge = E.find(e => e[0] === id && e[1] === next);
        const q = document.createElement("span"); q.textContent = n.lines.join(" ");
        const a = document.createElement("b"); a.textContent = edge ? edge[2] : "";
        li.append(q, a);
      } else {
        li.className = "final";
        li.textContent = n.lines.join(" ").replace("Perfusing rhythm = ROSC", "Perfusing rhythm = ROSC") + (n.sub ? " \u00B7 " + n.sub : "");
      }
      ol.appendChild(li);
    });
    return ol;
  }

  function render(correct, chosen) {
    const wrap = document.createElement("div"); wrap.className = "algo";
    const h = document.createElement("p"); h.className = "algo-title"; h.textContent = "RECOVER CPR ECG Algorithm";
    const chart = document.createElement("div"); chart.className = "algo-chart";
    chart.setAttribute("role", "button"); chart.tabIndex = 0;
    chart.setAttribute("aria-label", "Enlarge the RECOVER CPR ECG Algorithm");
    const markup = svg(correct, chosen);
    chart.innerHTML = markup;
    const hint = document.createElement("p"); hint.className = "algo-hint";
    hint.textContent = (matchMedia("(hover: none)").matches ? "Tap" : "Click") + " the algorithm to enlarge it";
    const open = () => Zoom.open(markup);
    chart.addEventListener("click", open);
    chart.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    wrap.append(h, chart, hint);
    return wrap;
  }

  // ---- full-screen viewer: pinch or +/- to zoom, drag to pan ----
  const Zoom = (function () {
    let el, stage, inner, zoom = 1, lastFocus = null;
    const MIN = 1, MAX = 4;
    function build() {
      el = document.createElement("div"); el.className = "algo-zoom"; el.setAttribute("role", "dialog");
      el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "RECOVER CPR ECG Algorithm, enlarged");
      el.innerHTML = '<div class="az-bar"><span class="az-title">RECOVER CPR ECG Algorithm</span>' +
        '<button type="button" class="az-close" aria-label="Close">\u00D7</button></div>' +
        '<div class="az-stage"><div class="az-inner"></div></div>' +
        '<div class="az-tools"><button type="button" data-z="-" aria-label="Zoom out">\u2212</button>' +
        '<button type="button" data-z="fit">Fit</button><button type="button" data-z="+" aria-label="Zoom in">+</button></div>';
      document.body.appendChild(el);
      stage = el.querySelector(".az-stage"); inner = el.querySelector(".az-inner");
      el.querySelector(".az-close").addEventListener("click", close);
      el.querySelectorAll(".az-tools button").forEach(b => b.addEventListener("click", () => {
        const z = b.dataset.z; setZoom(z === "fit" ? 1 : zoom * (z === "+" ? 1.4 : 1 / 1.4));
      }));
      document.addEventListener("keydown", e => {
        if (!el.classList.contains("open")) return;
        if (e.key === "Escape") close();
        if (e.key === "+" || e.key === "=") setZoom(zoom * 1.4);
        if (e.key === "-") setZoom(zoom / 1.4);
      });
      // pinch to zoom (two fingers), keeping the point between the fingers in place
      let pinch = null;
      stage.addEventListener("touchstart", e => {
        if (e.touches.length === 2) {
          const [a, b] = e.touches;
          pinch = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), z: zoom,
                    cx: (a.clientX + b.clientX) / 2, cy: (a.clientY + b.clientY) / 2 };
        }
      }, { passive: true });
      stage.addEventListener("touchmove", e => {
        if (pinch && e.touches.length === 2) {
          e.preventDefault();
          const [a, b] = e.touches;
          setZoom(pinch.z * Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) / pinch.d, pinch.cx, pinch.cy);
        }
      }, { passive: false });
      stage.addEventListener("touchend", e => { if (e.touches.length < 2) pinch = null; });
      // drag to pan with a mouse (touch scrolling pans natively)
      let drag = null;
      stage.addEventListener("mousedown", e => { drag = { x: e.clientX, y: e.clientY, l: stage.scrollLeft, t: stage.scrollTop }; stage.classList.add("dragging"); });
      window.addEventListener("mousemove", e => { if (drag) { stage.scrollLeft = drag.l - (e.clientX - drag.x); stage.scrollTop = drag.t - (e.clientY - drag.y); } });
      window.addEventListener("mouseup", () => { drag = null; stage && stage.classList.remove("dragging"); });
      // re-fit after rotating the phone or resizing the window, keeping the current zoom level
      const refit = () => { if (el.classList.contains("open")) requestAnimationFrame(() => setZoom(zoom)); };
      window.addEventListener("resize", refit);
      window.addEventListener("orientationchange", () => setTimeout(refit, 250));
      // double-tap / double-click toggles between fit and 2.5x
      stage.addEventListener("dblclick", e => setZoom(zoom > 1.2 ? 1 : 2.5, e.clientX, e.clientY));
    }
    // "Fit" = the largest size that fits BOTH the width and the height of the viewer,
    // so it works in portrait and landscape. Zoom levels are multiples of that size.
    const ASPECT = 404 / 640, PAD = 24;                     // chart height/width, and the white margin (px)
    function fitWidth() {
      const w = stage.clientWidth - 16, h = stage.clientHeight - 16;
      return Math.max(200, Math.min(w, (h - PAD) / ASPECT + PAD));
    }
    function setZoom(z, px, py) {
      z = Math.max(MIN, Math.min(MAX, z));
      const r = stage.getBoundingClientRect();
      px = px == null ? r.left + r.width / 2 : px; py = py == null ? r.top + r.height / 2 : py;
      // keep the content under (px, py) in place while zooming
      const fx = (stage.scrollLeft + px - r.left - inner.offsetLeft) / inner.offsetWidth;
      const fy = (stage.scrollTop + py - r.top - inner.offsetTop) / inner.offsetHeight;
      zoom = z;
      inner.style.width = Math.round(fitWidth() * zoom) + "px";
      stage.scrollLeft = fx * inner.offsetWidth + inner.offsetLeft - (px - r.left);
      stage.scrollTop = fy * inner.offsetHeight + inner.offsetTop - (py - r.top);
    }
    function open(markup) {
      if (!el) build();
      inner.innerHTML = markup;
      lastFocus = document.activeElement;
      el.classList.add("open"); document.documentElement.classList.add("az-lock");
      zoom = 1; inner.style.width = Math.round(fitWidth()) + "px"; stage.scrollLeft = 0; stage.scrollTop = 0;
      el.querySelector(".az-close").focus();
    }
    function close() {
      el.classList.remove("open"); document.documentElement.classList.remove("az-lock");
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }
    return { open, close };
  })();

  return { render, PATH };
})();
