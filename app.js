"use strict";
// ════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════
const CAT_ICONS = ["◫", "◈", "◉", "▦", "◳", "◬", "⬡", "◎", "▣", "◇", "★", "♦"];
const CAT_COLORS = [
    "#39ff8a",
    "#4dc8ff",
    "#ffb347",
    "#ff4d6d",
    "#b87fff",
    "#39ffc8",
    "#ff8c39",
    "#ffec39",
];
const GRADIENTS = [
    "linear-gradient(160deg,#0d2b1a,#041409)",
    "linear-gradient(160deg,#0d1a2b,#04090f)",
    "linear-gradient(160deg,#1a1a0d,#0e0b04)",
    "linear-gradient(160deg,#2b0d1a,#120406)",
    "linear-gradient(160deg,#1a0d2b,#080415)",
    "linear-gradient(160deg,#0d2b2b,#021111)",
    "linear-gradient(160deg,#2b1a0d,#120904)",
    "linear-gradient(160deg,#1a2b0d,#0b1204)",
];
const STATUS_META = {
    pendiente: { label: "PENDIENTE", cls: "st-pending", selCls: "sel-pending" },
    "en progreso": {
        label: "EN CURSO",
        cls: "st-progress",
        selCls: "sel-progress",
    },
    completado: { label: "COMPLETO", cls: "st-done", selCls: "sel-done" },
    abandonado: { label: "ABANDONADO", cls: "st-dropped", selCls: "sel-dropped" },
};

// Column types with metadata
const COL_TYPES = {
    text: { label: "Texto", badge: "type-text", example: "Ejemplo de texto" },
    number: { label: "Número", badge: "type-number", example: "42" },
    date: { label: "Fecha", badge: "type-date", example: "2024-01-15" },
    bool: { label: "Sí / No", badge: "type-bool", example: "Sí" },
    url: { label: "URL", badge: "type-url", example: "https://..." },
    select: { label: "Selección", badge: "type-select", example: "Opción 1" },
};

// Base columns auto-added to every category sheet
const BASE_COLS = [
    {
        key: "id",
        label: "ID",
        type: "auto",
        desc: "Identificador único auto-generado",
        lock: true,
    },
    {
        key: "titulo",
        label: "Título",
        type: "text",
        desc: "Nombre del elemento",
        lock: true,
    },
    {
        key: "autor",
        label: "Autor / Director",
        type: "text",
        desc: "Creador del contenido",
        lock: true,
    },
    {
        key: "estado",
        label: "Estado",
        type: "select",
        desc: "pendiente / en progreso / completado / abandonado",
        lock: true,
    },
    {
        key: "progreso",
        label: "Progreso",
        type: "number",
        desc: "Unidad actual de avance",
        lock: true,
    },
    {
        key: "total",
        label: "Total",
        type: "number",
        desc: "Unidad máxima de avance",
        lock: true,
    },
    {
        key: "unidad",
        label: "Unidad",
        type: "text",
        desc: "cap / pág / ep / min …",
        lock: true,
    },
    {
        key: "puntuacion",
        label: "Puntuación",
        type: "number",
        desc: "Valoración personal 1–10",
        lock: true,
    },
    {
        key: "fuentes",
        label: "Fuentes",
        type: "text",
        desc: "Fuentes de acceso (nombre|url separadas por ;)",
        lock: true,
    },
    {
        key: "notas",
        label: "Notas",
        type: "text",
        desc: "Texto libre",
        lock: true,
    },
    {
        key: "fecha_creacion",
        label: "Fecha creación",
        type: "date",
        desc: "Fecha en que se registró",
        lock: true,
    },
    {
        key: "fecha_actualizacion",
        label: "Última actualización",
        type: "date",
        desc: "Última vez que se modificó",
        lock: true,
    },
];

const uid = () => Math.random().toString(36).slice(2, 9);
const pct = (p, t) => (t > 0 ? Math.min(100, Math.round((p / t) * 100)) : 0);
const slugify = (s) =>
    s
        .toLowerCase()
        .trim()
        .replace(/[áàä]/g, "a")
        .replace(/[éèë]/g, "e")
        .replace(/[íìï]/g, "i")
        .replace(/[óòö]/g, "o")
        .replace(/[úùü]/g, "u")
        .replace(/ñ/g, "n")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "");

// ════════════════════════════════════════════════════════════════════════
// DATA
// ════════════════════════════════════════════════════════════════════════
let cats = []; // starts empty — user must create
let items = [];

// State
const state = {
    selCat: "__all__",
    selStatus: "__all__",
    selItem: null,
    search: "",
    editingCat: null,
    editingItem: null,
    delCatTarget: null,
    // Cat modal temp state
    catIcon: CAT_ICONS[0],
    catColor: CAT_COLORS[0],
    customCols: [], // [{id,label,key,type,required}]
    // Item modal
    modalSources: [],
    modalStatus: "pendiente",
    modalCustomValues: {}, // colKey -> value
};

// ════════════════════════════════════════════════════════════════════════
// CLOCK
// ════════════════════════════════════════════════════════════════════════
function tickClock() {
    const d = new Date();
    document.getElementById("clock").textContent = [
        d.getHours(),
        d.getMinutes(),
        d.getSeconds(),
    ]
        .map((n) => String(n).padStart(2, "0"))
        .join(":");
}
tickClock();
setInterval(tickClock, 1000);

// ════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════
const $ = (id) => document.getElementById(id);
const catById = (id) => cats.find((c) => c.id === id);
const colorIdx = (col) => CAT_COLORS.indexOf(col);

// ════════════════════════════════════════════════════════════════════════
// RENDER SIDEBAR
// ════════════════════════════════════════════════════════════════════════
function renderSidebar() {
    const total = items.length;
    $("sb-all-count").textContent = total;
    $("sb-all").classList.toggle("active", state.selCat === "__all__");
    $("cat-count-label").textContent = `(${cats.length})`;

    const list = $("cats-list");
    list.innerHTML = "";

    if (!cats.length) {
        list.innerHTML = `<div style="font-size:10px;color:rgba(212,255,230,.2);padding:6px 14px;
      line-height:1.7;font-family:'Share Tech Mono',monospace">Sin categorías.<br>Crea la primera ↓</div>`;
    }

    cats.forEach((c) => {
        const cnt = items.filter((i) => i.catId === c.id).length;
        const active = state.selCat === c.id;
        const el = document.createElement("div");
        el.className = "sb-item" + (active ? " active" : "");
        el.style.setProperty("--cc", c.color);
        el.innerHTML = `
      <span class="sb-icon">${c.icon}</span>
      <span class="sb-name">${c.name}</span>
      <span class="sb-count">${cnt}</span>
      <div class="sb-cat-actions">
        <button class="cat-act-btn cat-act-table" title="Diseñar tabla">⊞</button>
        <button class="cat-act-btn cat-act-edit"  title="Editar">✎</button>
        <button class="cat-act-btn cat-act-del"   title="Eliminar">✕</button>
      </div>`;
        el.addEventListener("click", () => {
            state.selCat = active ? "__all__" : c.id;
            render();
        });
        el.querySelector(".cat-act-table").addEventListener("click", (e) => {
            e.stopPropagation();
            openCatModal(c, "tab-schema");
        });
        el.querySelector(".cat-act-edit").addEventListener("click", (e) => {
            e.stopPropagation();
            openCatModal(c);
        });
        el.querySelector(".cat-act-del").addEventListener("click", (e) => {
            e.stopPropagation();
            openDelCatModal(c);
        });
        list.appendChild(el);
    });

    // Distribution
    const dist = $("dist-section");
    dist.innerHTML = "";
    cats.forEach((c) => {
        const cnt = items.filter((i) => i.catId === c.id).length;
        const p = total > 0 ? Math.round((cnt / total) * 100) : 0;
        dist.insertAdjacentHTML(
            "beforeend",
            `
      <div style="margin-bottom:10px">
        <div class="dist-label-row">
          <span style="color:${c.color};letter-spacing:.06em">${c.icon} ${c.name}</span>
          <span style="color:rgba(212,255,230,.3);font-family:'Orbitron',monospace">${p}%</span>
        </div>
        <div class="dist-track">
          <div class="dist-fill" style="width:${p}%;background:${c.color};box-shadow:0 0 5px ${c.color}"></div>
        </div>
      </div>`,
        );
    });
}

// ════════════════════════════════════════════════════════════════════════
// RENDER STATS
// ════════════════════════════════════════════════════════════════════════
function renderStats() {
    $("stat-total").textContent = items.length;
    $("stat-inprog").textContent = items.filter(
        (i) => i.status === "en progreso",
    ).length;
    $("stat-done").textContent = items.filter(
        (i) => i.status === "completado",
    ).length;
}

// ════════════════════════════════════════════════════════════════════════
// RENDER CARDS
// ════════════════════════════════════════════════════════════════════════
function getFiltered() {
    return items.filter((it) => {
        const mCat = state.selCat === "__all__" || it.catId === state.selCat;
        const mStatus =
            state.selStatus === "__all__" || it.status === state.selStatus;
        const q = state.search.toLowerCase();
        const mSearch =
            !q ||
            it.title.toLowerCase().includes(q) ||
            (it.author || "").toLowerCase().includes(q) ||
            (it.sources || []).some((s) => s.name.toLowerCase().includes(q));
        return mCat && mStatus && mSearch;
    });
}

function renderCards() {
    const area = $("cards-area");
    const filtered = getFiltered();
    area.innerHTML = "";

    if (!filtered.length) {
        const reason = !items.length
            ? !cats.length
                ? "Crea una categoría desde el panel izquierdo para empezar."
                : "Agrega tu primer elemento con el botón + ELEMENTO."
            : "";
        area.innerHTML = `<div id="empty-state">
      <div class="empty-glyph">◻</div>
      <div class="empty-title">${!items.length ? "BIBLIOTECA VACÍA" : "SIN RESULTADOS"}</div>
      ${reason ? `<div class="empty-hint">${reason}</div>` : ""}
    </div>`;
        return;
    }

    // Group by cat
    const groups = {};
    cats.forEach((c) => {
        groups[c.id] = [];
    });
    filtered.forEach((it) => {
        if (!groups[it.catId]) groups[it.catId] = [];
        groups[it.catId].push(it);
    });

    cats.forEach((c) => {
        const grpItems = groups[c.id];
        if (!grpItems || !grpItems.length) return;
        const ci = colorIdx(c.color);
        const sec = document.createElement("div");
        sec.style.marginBottom = "18px";

        // Has custom cols?
        const hasCols = c.columns && c.columns.length > 0;
        const colBadge = hasCols
            ? `<span style="font-size:8px;padding:2px 7px;border:1px solid rgba(57,255,138,.2);
          background:rgba(57,255,138,.05);color:rgba(57,255,138,.5);border-radius:2px;
          font-family:'Share Tech Mono',monospace">${BASE_COLS.length + c.columns.length} cols</span>`
            : "";

        sec.insertAdjacentHTML(
            "beforeend",
            `
      <div class="group-hdr">
        <span class="group-title" style="color:${c.color};text-shadow:0 0 8px ${c.color}44">${c.icon} ${c.name}</span>
        ${colBadge}
        <span class="group-count">— ${grpItems.length} elemento${grpItems.length !== 1 ? "s" : ""}</span>
        <div class="group-line"></div>
        <button class="group-schema-btn" data-catid="${c.id}">⊞ Tabla</button>
      </div>`,
        );

        sec
            .querySelector(".group-schema-btn")
            .addEventListener("click", () => openCatModal(c, "tab-schema"));

        const grid = document.createElement("div");
        grid.className = "media-grid";
        grpItems.forEach((it, idx) => {
            const card = buildCard(it, c, ci);
            card.style.animationDelay = `${idx * 0.04}s`;
            grid.appendChild(card);
        });
        sec.appendChild(grid);
        area.appendChild(sec);
    });
}

function buildCard(it, c, ci) {
    const p = pct(it.progress, it.total);
    const smeta = STATUS_META[it.status] || STATUS_META["pendiente"];
    const cc = c.color;
    const grad = GRADIENTS[ci % GRADIENTS.length];

    const card = document.createElement("div");
    card.className = "media-card";
    card.addEventListener("mouseenter", () => {
        card.style.borderColor = cc + "55";
        card.style.boxShadow = `0 0 22px ${cc}0d`;
    });
    card.addEventListener("mouseleave", () => {
        card.style.borderColor = "";
        card.style.boxShadow = "";
    });
    card.addEventListener("click", () => selectItem(it.id));

    // Custom cols preview (first 2 visible)
    const visibleCols = (c.columns || [])
        .filter(
            (col) =>
                it.customData &&
                it.customData[col.key] != null &&
                it.customData[col.key] !== "",
        )
        .slice(0, 2);
    const customFieldsHtml = visibleCols
        .map(
            (col) => `
    <div class="mc-cf-row">
      <span class="mc-cf-key">${col.label}:</span>
      <span class="mc-cf-val">${it.customData[col.key]}</span>
    </div>`,
        )
        .join("");

    const srcPills = (it.sources || [])
        .slice(0, 3)
        .map(
            (s) => `
    <span class="mc-src-pill${s.url ? " linked" : ""}" data-url="${s.url || ""}">${s.url ? "↗ " : ""}${s.name}</span>`,
        )
        .join("");
    const morePills =
        (it.sources || []).length > 3
            ? `<span class="mc-src-more">+${it.sources.length - 3}</span>`
            : "";

    const progLine =
        it.total > 0
            ? `
    <div class="mc-prog-widget">
      <div class="mc-prog-row">
        <span class="mc-prog-label">${it.unit} ${it.progress}/${it.total}</span>
        <span class="mc-prog-val" style="color:${cc}">${p}%</span>
      </div>
      <div class="mc-mini-bar">
        <div class="mc-mini-fill" style="width:${p}%;background:${cc};box-shadow:0 0 4px ${cc}"></div>
      </div>
      <div style="display:flex;gap:5px;align-items:center">
        <input class="mc-session-input" type="number" min="0" placeholder="${it.step || 1}"
          title="Ingresa cuánto avanzaste" onclick="event.stopPropagation()">
        <button class="mc-session-apply" data-action="session" title="Registrar avance">+ sesión</button>
      </div>
    </div>`
            : "";

    const plusBtn = "";

    card.innerHTML = `
    <div class="mc-thumb" style="background:${grad}">
      <div class="mc-thumb-shimmer"></div>
      <span class="mc-type-glyph">${c.icon}</span>
      <span class="mc-type-tag" style="background:${cc}20;color:${cc};border:1px solid ${cc}35">${c.name}</span>
      <span class="mc-status-badge ${smeta.cls}">${smeta.label}</span>
      ${it.total > 0 ? `<div class="mc-prog-bar"><div class="mc-prog-fill" style="width:${p}%;background:${cc};box-shadow:0 0 6px ${cc}"></div></div>` : ""}
    </div>
    <div class="mc-body">
      <div class="mc-title">${it.title}</div>
      ${it.author ? `<div class="mc-author">${it.author}</div>` : ""}
      ${customFieldsHtml ? `<div class="mc-custom-fields">${customFieldsHtml}</div>` : ""}
      <div class="mc-sources">${srcPills}${morePills}</div>
      ${progLine}
      <div class="mc-actions">
        ${plusBtn}
        <button class="mc-btn" data-action="edit">✎</button>
        <button class="mc-btn mc-btn-del" data-action="del">✕</button>
      </div>
    </div>`;

    card.querySelectorAll(".mc-src-pill.linked").forEach((pill) => {
        pill.addEventListener("click", (e) => {
            e.stopPropagation();
            window.open(pill.dataset.url, "_blank");
        });
    });

    // Session apply
    const sessionInput = card.querySelector(".mc-session-input");
    card
        .querySelector('[data-action="session"]')
        ?.addEventListener("click", (e) => {
            e.stopPropagation();
            const amt = parseInt(sessionInput?.value) || it.step || 1;
            logSession(it.id, amt);
            if (sessionInput) sessionInput.value = "";
        });
    // Enter key on session input
    sessionInput?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.stopPropagation();
            const amt = parseInt(sessionInput.value) || it.step || 1;
            logSession(it.id, amt);
            sessionInput.value = "";
        }
    });

    card.querySelector('[data-action="edit"]').addEventListener("click", (e) => {
        e.stopPropagation();
        openItemModal(it);
    });
    card.querySelector('[data-action="del"]').addEventListener("click", (e) => {
        e.stopPropagation();
        deleteItem(it.id);
    });
    return card;
}

// ════════════════════════════════════════════════════════════════════════
// RENDER DETAIL
// ════════════════════════════════════════════════════════════════════════
function renderDetail() {
    const body = $("detail-body");
    const empty = $("detail-empty");
    const closeBtn = $("btn-close-detail");

    if (!state.selItem) {
        body.style.display = "none";
        empty.style.display = "flex";
        closeBtn.style.display = "none";
        return;
    }

    const it = items.find((i) => i.id === state.selItem);
    if (!it) {
        state.selItem = null;
        renderDetail();
        return;
    }

    const c = catById(it.catId) || {
        icon: "◫",
        name: "?",
        color: "#39ff8a",
        columns: [],
    };
    const cc = c.color;
    const ci = colorIdx(cc);
    const grad = GRADIENTS[ci % GRADIENTS.length];
    const p = pct(it.progress, it.total);
    const smeta = STATUS_META[it.status];

    empty.style.display = "none";
    body.style.display = "flex";
    closeBtn.style.display = "block";

    // Custom fields for detail
    const customRows = (c.columns || [])
        .map((col) => {
            const val = it.customData?.[col.key] ?? "—";
            return `<tr><td>${col.label}</td><td>${val}</td></tr>`;
        })
        .join("");

    body.innerHTML = `
    <div class="d-cover" style="background:${grad}">
      <div class="d-cover-shimmer"></div>
      <span style="font-size:24px;position:relative;z-index:1">${c.icon}</span>
    </div>
    <div>
      <div class="d-title">${it.title}</div>
      <div class="d-badges">
        <span style="font-size:8px;font-family:'Orbitron',monospace;font-weight:700;
          letter-spacing:.08em;text-transform:uppercase;padding:3px 7px;border-radius:2px;
          background:${cc}20;color:${cc};border:1px solid ${cc}35">${c.name}</span>
        <span class="st-badge ${smeta.cls}">${smeta.label}</span>
        ${it.score ? `<span class="d-score">★ ${it.score}</span>` : ""}
      </div>
    </div>
    ${it.author ? `<div class="d-field"><span class="d-field-key">Autor / Director</span><span class="d-field-val">${it.author}</span></div>` : ""}

    ${customRows
            ? `<div>
      <div class="d-section-label">Campos personalizados</div>
      <table class="d-custom-table">${customRows}</table>
    </div>`
            : ""
        }

    <div>
      <div class="d-section-label">Fuentes (${(it.sources || []).length})</div>
      <div class="d-sources">
        ${!(it.sources || []).length
            ? `<span style="font-size:11px;color:rgba(212,255,230,.25)">Sin fuentes</span>`
            : (it.sources || [])
                .map(
                    (s, i) => `
            <div class="d-src-row">
              <span class="d-src-num">${String(i + 1).padStart(2, "0")}</span>
              <span class="d-src-name">${s.name}</span>
              ${s.url ? `<a class="d-src-link" href="${s.url}" target="_blank" rel="noreferrer">↗ Abrir</a>` : ""}
            </div>`,
                )
                .join("")
        }
      </div>
    </div>

    ${it.total > 0
            ? `
    <div class="d-prog-section">
      <div class="d-prog-label">Progreso</div>
      <div class="d-prog-display" style="color:${cc};text-shadow:0 0 12px ${cc}66">${it.unit.toUpperCase()}. ${it.progress} / ${it.total}</div>
      <div class="d-prog-bar-wrap"><div class="d-prog-bar-fill" id="d-prog-fill" style="width:${p}%;background:${cc};box-shadow:0 0 8px ${cc}"></div></div>
      <div class="d-prog-pct" style="margin-bottom:10px">${p}% completado</div>

      <!-- MODE TABS -->
      <div class="prog-modes" id="d-prog-modes">
        <button class="prog-mode-btn active" data-mode="steps">Pasos rápidos</button>
        <button class="prog-mode-btn" data-mode="session">Sesión</button>
        <button class="prog-mode-btn" data-mode="direct">Valor directo</button>
        <button class="prog-mode-btn" data-mode="percent">Porcentaje</button>
      </div>

      <!-- STEPS MODE -->
      <div class="prog-mode-panel" id="d-mode-steps">
        <div class="prog-steps">
          <button class="prog-step-btn step-minus" data-step="-1">−1</button>
          ${it.step && it.step > 1 ? `<button class="prog-step-btn step-minus" data-step="${-it.step}">−${it.step}</button>` : ""}
          <button class="prog-step-btn step-plus" data-step="1">+1 ${it.unit}</button>
          ${it.step && it.step > 1 ? `<button class="prog-step-btn step-plus" data-step="${it.step}">+${it.step} ${it.unit}</button>` : ""}
          <button class="prog-step-btn step-plus" data-step="10">+10 ${it.unit}</button>
          <button class="prog-step-btn step-custom step-end" data-step="${it.total}">✓ Al final</button>
        </div>
      </div>

      <!-- SESSION MODE -->
      <div class="prog-mode-panel" id="d-mode-session" style="display:none">
        <div class="prog-session">
          <div class="prog-session-row">
            <input class="prog-session-input" id="d-session-val" type="number" min="0"
              placeholder="${it.step || 1}" style="">
            <span style="font-size:12px;color:rgba(212,255,230,.3);padding:0 6px">${it.unit}</span>
            <input class="f-input" id="d-session-note" placeholder="nota de sesión (opcional)"
              style="flex:1;font-size:11px;padding:7px 10px">
          </div>
          <div class="prog-session-hint">
            Ingresa cuánto consumiste en esta sesión.<br>
            Ejemplos: 45 min · 80 pág · 3 episodios
          </div>
          <button class="btn btn-amber btn-sm" id="d-btn-log-session" style="align-self:flex-start">▶ Registrar sesión</button>
        </div>
      </div>

      <!-- DIRECT MODE -->
      <div class="prog-mode-panel" id="d-mode-direct" style="display:none">
        <div class="prog-direct">
          <input class="prog-direct-input" id="d-direct-val" type="number" min="0" max="${it.total}"
            value="${it.progress}" placeholder="${it.progress}">
          <span class="prog-slash-big">/</span>
          <span class="prog-total-disp">${it.total}</span>
          <span style="font-size:12px;color:rgba(212,255,230,.35);margin-left:4px">${it.unit}</span>
          <button class="btn btn-primary btn-sm" id="d-btn-direct-apply" style="margin-left:4px">Aplicar</button>
        </div>
        <div style="font-size:10px;color:rgba(212,255,230,.25);margin-top:6px">
          Escribe el valor exacto actual (no la cantidad que avanzaste)
        </div>
      </div>

      <!-- PERCENT MODE -->
      <div class="prog-mode-panel" id="d-mode-percent" style="display:none">
        <div class="prog-pct-wrap">
          <div class="pct-display" id="d-pct-display">${p}%</div>
          <input class="pct-slider" id="d-pct-slider" type="range" min="0" max="100" value="${p}">
          <div style="display:flex;justify-content:space-between;font-size:9px;color:rgba(212,255,230,.25);margin-top:-4px">
            <span>0%</span><span>50%</span><span>100%</span>
          </div>
          <button class="btn btn-primary btn-sm" id="d-btn-pct-apply" style="align-self:flex-end">Aplicar ${p}%</button>
        </div>
      </div>
    </div>

    <!-- SESSION LOG -->
    ${(it.sessions || []).length
                ? `
    <div>
      <div class="d-section-label">Registro de sesiones (${(it.sessions || []).length})</div>
      <div class="session-log">
        ${[...(it.sessions || [])]
                    .reverse()
                    .map(
                        (s) => `
          <div class="session-log-entry">
            <span class="sle-amount" style="color:#ffb347">+${s.amount} ${it.unit}</span>
            <span class="sle-date">${s.date}</span>
            ${s.note ? `<span class="sle-note" title="${s.note}">— ${s.note}</span>` : ""}
          </div>`,
                    )
                    .join("")}
      </div>
    </div>`
                : ""
            }`
            : ""
        }

    <div>
      <div class="d-section-label">Estado</div>
      <div class="d-status-btns">
        ${Object.entries(STATUS_META)
            .map(
                ([val, m]) =>
                    `<button class="d-status-opt${it.status === val ? " " + m.selCls : ""}" data-val="${val}">${m.label}</button>`,
            )
            .join("")}
      </div>
    </div>

    ${it.notes ? `<div><div class="d-section-label">Notas</div><div class="d-notes">${it.notes}</div></div>` : ""}
    <button class="btn btn-amber btn-sm" id="d-btn-edit">✎ Editar elemento</button>`;

    body.querySelectorAll(".d-status-opt").forEach((btn) => {
        btn.addEventListener("click", () => {
            const ref = items.find((i) => i.id === state.selItem);
            if (!ref) return;
            ref.status = btn.dataset.val;
            render();
        });
    });
    body.querySelector("#d-btn-edit").addEventListener("click", () => {
        const ref = items.find((i) => i.id === state.selItem);
        if (ref) openItemModal(ref);
    });

    // ── Progress mode tabs
    body.querySelectorAll(".prog-mode-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            body
                .querySelectorAll(".prog-mode-btn")
                .forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            body
                .querySelectorAll(".prog-mode-panel")
                .forEach((p) => (p.style.display = "none"));
            body.querySelector(`#d-mode-${btn.dataset.mode}`).style.display = "";
        });
    });

    // ── STEPS MODE
    body.querySelectorAll(".prog-step-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const step = parseInt(btn.dataset.step) || 0;
            if (btn.classList.contains("step-end")) changeProgress(it.id, it.total);
            else logSession(it.id, step);
        });
    });

    // ── SESSION MODE
    body.querySelector("#d-btn-log-session")?.addEventListener("click", () => {
        const val = parseInt(body.querySelector("#d-session-val")?.value) || 0;
        const note = body.querySelector("#d-session-note")?.value.trim() || "";
        if (val === 0) return;
        logSession(it.id, val, note);
        if (body.querySelector("#d-session-val"))
            body.querySelector("#d-session-val").value = "";
        if (body.querySelector("#d-session-note"))
            body.querySelector("#d-session-note").value = "";
    });
    body.querySelector("#d-session-val")?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") body.querySelector("#d-btn-log-session")?.click();
    });

    // ── DIRECT MODE
    const directInput = body.querySelector("#d-direct-val");
    body.querySelector("#d-btn-direct-apply")?.addEventListener("click", () => {
        const val = parseInt(directInput?.value);
        if (isNaN(val)) return;
        changeProgress(it.id, val);
    });
    directInput?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") body.querySelector("#d-btn-direct-apply")?.click();
    });

    // ── PERCENT MODE
    const slider = body.querySelector("#d-pct-slider");
    const pctDisp = body.querySelector("#d-pct-display");
    const pctApply = body.querySelector("#d-btn-pct-apply");
    slider?.addEventListener("input", () => {
        pctDisp.textContent = slider.value + "%";
        if (pctApply) pctApply.textContent = `Aplicar ${slider.value}%`;
    });
    pctApply?.addEventListener("click", () => {
        const newProg = Math.round((parseInt(slider.value) / 100) * it.total);
        changeProgress(it.id, newProg);
    });
}

// ════════════════════════════════════════════════════════════════════════
// MAIN RENDER
// ════════════════════════════════════════════════════════════════════════
function render() {
    renderStats();
    renderSidebar();
    renderCards();
    renderDetail();
}

// ════════════════════════════════════════════════════════════════════════
// ACTIONS
// ════════════════════════════════════════════════════════════════════════
function selectItem(id) {
    state.selItem = state.selItem === id ? null : id;
    renderDetail();
}
function deleteItem(id) {
    items = items.filter((i) => i.id !== id);
    if (state.selItem === id) state.selItem = null;
    render();
}
function changeProgress(id, newVal) {
    const it = items.find((i) => i.id === id);
    if (!it) return;
    const prev = it.progress;
    it.progress = Math.max(0, Math.min(it.total, newVal));
    if (it.total > 0 && it.progress >= it.total) it.status = "completado";
    render();
}

function logSession(id, amount, note = "") {
    const it = items.find((i) => i.id === id);
    if (!it || !amount) return;
    if (!it.sessions) it.sessions = [];
    const prev = it.progress;
    const newProg = Math.max(
        0,
        Math.min(it.total || Infinity, it.progress + amount),
    );
    it.progress = newProg;
    if (it.total > 0 && it.progress >= it.total) it.status = "completado";
    // Record session
    const now = new Date();
    const dateStr =
        now.toLocaleDateString("es", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }) +
        " " +
        now.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
    it.sessions.push({
        amount,
        note,
        date: dateStr,
        before: prev,
        after: newProg,
    });
    it.updatedAt = now.toISOString();
    render();
}

// ════════════════════════════════════════════════════════════════════════
// MODAL UTILS
// ════════════════════════════════════════════════════════════════════════
function openModal(id) {
    $(id).classList.add("open");
}
function closeModal(id) {
    $(id).classList.remove("open");
}

document.querySelectorAll(".modal-overlay").forEach((ov) => {
    ov.addEventListener("click", (e) => {
        if (e.target === ov) ov.classList.remove("open");
    });
});
document.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", () => closeModal(btn.dataset.close));
});
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape")
        ["modal-cat", "modal-item", "modal-del-cat"].forEach((id) => {
            if ($(id).classList.contains("open")) closeModal(id);
        });
});

// ════════════════════════════════════════════════════════════════════════
// TABS (category modal)
// ════════════════════════════════════════════════════════════════════════
function switchTab(tabId) {
    document.querySelectorAll("#modal-cat .modal-tab").forEach((t) => {
        t.classList.toggle("active", t.dataset.tab === tabId);
    });
    document.querySelectorAll("#modal-cat .tab-panel").forEach((p) => {
        p.classList.toggle("active", p.id === tabId);
    });
    if (tabId === "tab-preview") buildSchemaPreview();
}
window.switchTab = switchTab; // used by inline onclick

document.querySelectorAll("#modal-cat .modal-tab").forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
});

// ════════════════════════════════════════════════════════════════════════
// CATEGORY MODAL
// ════════════════════════════════════════════════════════════════════════
function buildIconPicker() {
    const p = $("icon-picker");
    p.innerHTML = "";
    CAT_ICONS.forEach((ic) => {
        const btn = document.createElement("button");
        btn.className = "icon-opt" + (ic === state.catIcon ? " selected" : "");
        btn.textContent = ic;
        btn.addEventListener("click", () => {
            state.catIcon = ic;
            p.querySelectorAll(".icon-opt").forEach((b) =>
                b.classList.remove("selected"),
            );
            btn.classList.add("selected");
        });
        p.appendChild(btn);
    });
}

function buildColorPicker() {
    const p = $("color-picker");
    p.innerHTML = "";
    CAT_COLORS.forEach((col) => {
        const el = document.createElement("div");
        el.className = "color-opt" + (col === state.catColor ? " selected" : "");
        el.style.background = col;
        el.style.borderColor = col === state.catColor ? "white" : col + "44";
        el.addEventListener("click", () => {
            state.catColor = col;
            p.querySelectorAll(".color-opt").forEach((b) => {
                b.classList.remove("selected");
                b.style.borderColor = b.style.background + "44";
            });
            el.classList.add("selected");
            el.style.borderColor = "white";
        });
        p.appendChild(el);
    });
}

function buildBaseCols() {
    const t = $("base-cols-table");
    t.innerHTML = `<thead><tr>
    <th>Nombre columna</th><th>Clave (Google Sheets)</th><th>Tipo</th><th>Descripción</th><th></th>
  </tr></thead><tbody>${BASE_COLS.map(
        (c) => `<tr>
      <td class="base-col-name">${c.label}</td>
      <td style="font-family:'Share Tech Mono',monospace;font-size:10px;color:rgba(212,255,230,.4)">${c.key}</td>
      <td><span class="base-col-type ${COL_TYPES[c.type]?.badge || "type-auto"}">${COL_TYPES[c.type]?.label || "Auto"}</span></td>
      <td class="base-col-desc">${c.desc}</td>
      <td class="base-col-lock">🔒</td>
    </tr>`,
    ).join("")}</tbody>`;
}

function renderColBuilder() {
    const builder = $("col-builder");
    const hint = $("no-cols-hint");
    if (!state.customCols.length) {
        builder.innerHTML = "";
        builder.appendChild(hint);
        hint.style.display = "";
        return;
    }
    builder.innerHTML = "";
    state.customCols.forEach((col, i) => {
        const row = document.createElement("div");
        row.className = "col-row";
        row.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;min-width:0">
        <span style="font-size:9px;color:rgba(212,255,230,.25);font-family:'Orbitron',monospace;flex-shrink:0">${String(i + 1).padStart(2, "0")}</span>
        <input class="col-label-input" placeholder="Nombre de columna" value="${col.label}" style="flex:1;min-width:0">
      </div>
      <select class="col-type-select f-select" style="padding:6px 8px;font-size:11px">
        ${Object.entries(COL_TYPES)
                .map(
                    ([k, v]) =>
                        `<option value="${k}"${col.type === k ? " selected" : ""}>${v.label}</option>`,
                )
                .join("")}
      </select>
      <label class="col-required-toggle">
        <input type="checkbox" class="col-req-check"${col.required ? " checked" : ""}>
        <span>Requerido</span>
      </label>
      <button class="col-del-btn" data-idx="${i}">✕</button>`;

        row.querySelector(".col-label-input").addEventListener("input", (e) => {
            state.customCols[i].label = e.target.value;
            state.customCols[i].key = slugify(e.target.value) || `col_${i + 1}`;
        });
        row.querySelector(".col-type-select").addEventListener("change", (e) => {
            state.customCols[i].type = e.target.value;
        });
        row.querySelector(".col-req-check").addEventListener("change", (e) => {
            state.customCols[i].required = e.target.checked;
        });
        row.querySelector(".col-del-btn").addEventListener("click", () => {
            state.customCols.splice(i, 1);
            renderColBuilder();
        });
        builder.appendChild(row);
    });
}

function buildSchemaPreview() {
    const wrap = $("schema-preview-wrap");
    const allCols = [
        ...BASE_COLS.map((c) => ({ ...c, origin: "sys" })),
        ...state.customCols.map((c) => ({ ...c, origin: "custom" })),
    ];

    wrap.innerHTML = `
    <div class="sp-head">⊞ Hoja: ${($("cat-name").value || "CATEGORÍA").toUpperCase()}</div>
    <div style="overflow-x:auto">
      <table class="sp-table">
        <thead><tr>${allCols
            .map(
                (c) => `
          <th class="${c.origin === "sys" ? "sys" : "custom"}${c.required ? " req" : ""}">
            ${c.label}<span class="type-badge ${COL_TYPES[c.type]?.badge || "type-auto"}">${COL_TYPES[c.type]?.label || "Auto"}</span>
          </th>`,
            )
            .join("")}</tr></thead>
        <tbody><tr>${allCols
            .map(
                (c) => `
          <td>${COL_TYPES[c.type]?.example || "..."}</td>`,
            )
            .join("")}</tr></tbody>
      </table>
    </div>
    <div style="padding:8px 14px;font-size:9px;color:rgba(212,255,230,.25);
      border-top:1px solid #1e3028;font-family:'Share Tech Mono',monospace">
      ${BASE_COLS.length} columnas base + ${state.customCols.length} personalizadas = <strong style="color:#39ff8a">${allCols.length} columnas totales</strong>
    </div>`;
}

$("btn-add-col").addEventListener("click", () => {
    state.customCols.push({
        id: uid(),
        label: "",
        key: `col_${state.customCols.length + 1}`,
        type: "text",
        required: false,
    });
    renderColBuilder();
    $("no-cols-hint").style.display = "none";
});

function openCatModal(cat = null, startTab = "tab-info") {
    state.editingCat = cat;
    state.catIcon = cat?.icon || CAT_ICONS[0];
    state.catColor = cat?.color || CAT_COLORS[0];
    state.customCols = cat?.columns ? cat.columns.map((c) => ({ ...c })) : [];

    $("modal-cat-title").textContent = cat
        ? "✎ EDITAR CATEGORÍA"
        : "+ NUEVA CATEGORÍA";
    $("btn-save-cat").textContent = cat ? "Guardar cambios" : "Crear categoría";
    $("cat-name").value = cat?.name || "";
    $("cat-desc").value = cat?.desc || "";

    buildIconPicker();
    buildColorPicker();
    buildBaseCols();
    renderColBuilder();
    switchTab(startTab);
    openModal("modal-cat");
    if (startTab === "tab-info") setTimeout(() => $("cat-name").focus(), 80);
}

$("btn-new-cat").addEventListener("click", () => openCatModal());

$("btn-save-cat").addEventListener("click", () => {
    const name = $("cat-name").value.trim();
    if (!name) {
        switchTab("tab-info");
        $("cat-name").focus();
        return;
    }
    const data = {
        id: state.editingCat?.id || uid(),
        name,
        desc: $("cat-desc").value.trim(),
        icon: state.catIcon,
        color: state.catColor,
        columns: state.customCols
            .filter((c) => c.label.trim())
            .map((c) => ({ ...c, key: slugify(c.label) || c.key })),
    };
    if (state.editingCat) {
        const idx = cats.findIndex((c) => c.id === data.id);
        if (idx !== -1) cats[idx] = data;
    } else {
        cats.push(data);
    }
    closeModal("modal-cat");
    render();
});

// ════════════════════════════════════════════════════════════════════════
// DELETE CATEGORY MODAL
// ════════════════════════════════════════════════════════════════════════
function openDelCatModal(cat) {
    state.delCatTarget = cat;
    const cnt = items.filter((i) => i.catId === cat.id).length;
    $("del-cat-msg").innerHTML =
        `Eliminarás la categoría <strong>${cat.name}</strong> y sus ${cnt} elemento${cnt !== 1 ? "s" : ""}.
     <br><br><span class="danger-text">Esta acción no se puede deshacer.</span>`;
    openModal("modal-del-cat");
}
$("btn-confirm-del-cat").addEventListener("click", () => {
    if (!state.delCatTarget) return;
    const id = state.delCatTarget.id;
    cats = cats.filter((c) => c.id !== id);
    items = items.filter((i) => i.catId !== id);
    if (state.selCat === id) state.selCat = "__all__";
    if (state.selItem && !items.find((i) => i.id === state.selItem))
        state.selItem = null;
    state.delCatTarget = null;
    closeModal("modal-del-cat");
    render();
});

// ════════════════════════════════════════════════════════════════════════
// ITEM MODAL — Sources
// ════════════════════════════════════════════════════════════════════════
function renderSourcesList() {
    const list = $("sources-list");
    list.innerHTML = "";
    state.modalSources.forEach((src, i) => {
        const row = document.createElement("div");
        row.className = "source-row";
        row.innerHTML = `
      <span class="source-row-num">${String(i + 1).padStart(2, "0")}</span>
      <input class="source-name-input" placeholder="Nombre (Netflix, Físico…)" value="${src.name}">
      <span class="source-sep">│</span>
      <input class="source-url-input" placeholder="URL opcional" value="${src.url}">
      ${state.modalSources.length > 1 ? `<button class="src-del-btn" data-idx="${i}">✕</button>` : ""}`;
        row.querySelector(".source-name-input").addEventListener("input", (e) => {
            state.modalSources[i].name = e.target.value;
        });
        row.querySelector(".source-url-input").addEventListener("input", (e) => {
            state.modalSources[i].url = e.target.value;
        });
        row.querySelector(".src-del-btn")?.addEventListener("click", () => {
            state.modalSources.splice(i, 1);
            renderSourcesList();
        });
        list.appendChild(row);
    });
}
$("btn-add-source").addEventListener("click", () => {
    state.modalSources.push({ id: uid(), name: "", url: "" });
    renderSourcesList();
});

// ════════════════════════════════════════════════════════════════════════
// ITEM MODAL — Custom fields injection
// ════════════════════════════════════════════════════════════════════════
function renderCustomItemFields(catId) {
    const cat = catById(catId);
    const area = $("item-custom-fields");
    area.innerHTML = "";
    if (!cat?.columns?.length) return;

    const sep = document.createElement("div");
    sep.className = "section-sep";
    sep.style.margin = "4px 0 8px";
    area.appendChild(sep);

    const header = document.createElement("div");
    header.style.cssText =
        "font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:rgba(57,255,138,.5);margin-bottom:12px;font-family:Share Tech Mono,monospace";
    header.textContent = "Campos personalizados — " + cat.name;
    area.appendChild(header);

    cat.columns.forEach((col) => {
        const wrap = document.createElement("div");
        const val = state.modalCustomValues[col.key] ?? "";

        let inputHtml = "";
        if (col.type === "bool") {
            inputHtml = `<div style="display:flex;gap:10px;margin-top:4px">
        ${["Sí", "No"]
                    .map(
                        (opt) => `
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px">
            <input type="radio" name="cf_${col.key}" value="${opt}" ${val === opt ? "checked" : ""}
              style="accent-color:#39ff8a"> ${opt}
          </label>`,
                    )
                    .join("")}
      </div>`;
        } else if (col.type === "date") {
            inputHtml = `<input class="f-input" type="date" id="cf_${col.key}" value="${val}" style="color-scheme:dark">`;
        } else {
            inputHtml = `<input class="f-input" id="cf_${col.key}" placeholder="${COL_TYPES[col.type]?.example || ""}" value="${val}">`;
        }

        wrap.innerHTML = `
      <label class="f-label">${col.label}${col.required ? ' <span style="color:#ff4d6d">*</span>' : ""}
        <span class="type-badge ${COL_TYPES[col.type]?.badge}">${COL_TYPES[col.type]?.label}</span>
      </label>${inputHtml}`;

        // Bind
        const bind = () => {
            if (col.type === "bool") {
                const checked = wrap.querySelector(
                    `input[name="cf_${col.key}"]:checked`,
                );
                state.modalCustomValues[col.key] = checked ? checked.value : "";
            } else {
                state.modalCustomValues[col.key] =
                    wrap.querySelector(`#cf_${col.key}`)?.value || "";
            }
        };
        wrap
            .querySelectorAll("input")
            .forEach((inp) => inp.addEventListener("input", bind));
        area.appendChild(wrap);
    });
}

// ════════════════════════════════════════════════════════════════════════
// ITEM MODAL — Open / Save
// ════════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════════
// ITEM MODAL — Unit helpers & live echo
// ════════════════════════════════════════════════════════════════════════
function getItemUnit() {
    const preset = $("item-unit-preset")?.value;
    if (preset === "custom")
        return $("item-unit-custom")?.value.trim() || "unidad";
    return preset || "cap";
}

function updateUnitEcho() {
    const unit = getItemUnit();
    const total = parseInt($("item-total")?.value) || 0;
    const prog = parseInt($("item-progress")?.value) || 0;
    const step = parseInt($("item-step")?.value) || 1;
    if ($("item-unit-echo")) $("item-unit-echo").textContent = unit;
    if ($("item-step-unit-echo")) $("item-step-unit-echo").textContent = unit;
    if ($("item-total-echo")) $("item-total-echo").textContent = total || "?";
    if ($("item-pct-echo"))
        $("item-pct-echo").textContent = total > 0 ? `${pct(prog, total)}%` : "";
}

// Bind unit preset change
$("item-unit-preset")?.addEventListener("change", () => {
    const isCustom = $("item-unit-preset").value === "custom";
    $("item-unit-custom-wrap").style.display = isCustom ? "block" : "none";
    updateUnitEcho();
});
$("item-unit-custom")?.addEventListener("input", updateUnitEcho);
$("item-total")?.addEventListener("input", updateUnitEcho);
$("item-progress")?.addEventListener("input", updateUnitEcho);
$("item-step")?.addEventListener("input", updateUnitEcho);

function openItemModal(item = null) {
    state.editingItem = item;
    state.modalStatus = item?.status || "pendiente";
    state.modalCustomValues = item?.customData ? { ...item.customData } : {};

    $("modal-item-title").textContent = item
        ? "✎ EDITAR ELEMENTO"
        : "+ NUEVO ELEMENTO";
    $("btn-save-item").textContent = item ? "Guardar cambios" : "Crear elemento";

    const hasCats = cats.length > 0;
    $("item-no-cats").style.display = hasCats ? "none" : "block";
    $("item-form-fields").style.display = hasCats ? "contents" : "none";
    $("btn-save-item").style.display = hasCats ? "" : "none";

    if (hasCats) {
        const sel = $("item-cat");
        sel.innerHTML = cats
            .map((c) => `<option value="${c.id}">${c.icon} ${c.name}</option>`)
            .join("");
        if (item) sel.value = item.catId;

        $("item-title").value = item?.title || "";
        $("item-author").value = item?.author || "";
        $("item-progress").value = item?.progress != null ? item.progress : "";
        $("item-total").value = item?.total != null ? item.total : "";
        $("item-step").value = item?.step || "";

        // Unit preset
        const unitPresets = ["cap", "pág", "ep", "min", "h", "vol"];
        const unitVal = item?.unit || "cap";
        const presetSel = $("item-unit-preset");
        if (unitPresets.includes(unitVal)) {
            presetSel.value = unitVal;
            $("item-unit-custom-wrap").style.display = "none";
        } else {
            presetSel.value = "custom";
            $("item-unit-custom-wrap").style.display = "block";
            $("item-unit-custom").value = unitVal;
        }
        updateUnitEcho();
        $("item-score").value = item?.score || "";
        $("item-notes").value = item?.notes || "";

        // Status pills
        document
            .querySelectorAll("#item-status-group .status-pill")
            .forEach((b) => {
                b.classList.toggle("active", b.dataset.val === state.modalStatus);
            });

        // Sources
        state.modalSources = item?.sources
            ? item.sources.map((s) => ({ ...s }))
            : [{ id: uid(), name: "", url: "" }];
        renderSourcesList();

        // Custom fields for selected cat
        renderCustomItemFields(sel.value);
        sel.addEventListener("change", () => {
            state.modalCustomValues = {};
            renderCustomItemFields(sel.value);
        });
    }
    openModal("modal-item");
    if (hasCats) setTimeout(() => $("item-title").focus(), 80);
}

$("btn-new-item").addEventListener("click", () => openItemModal());

document.querySelectorAll("#item-status-group .status-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
        state.modalStatus = btn.dataset.val;
        document
            .querySelectorAll("#item-status-group .status-pill")
            .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
    });
});

$("btn-save-item").addEventListener("click", () => {
    const title = $("item-title").value.trim();
    const catId = $("item-cat").value;
    if (!title || !catId) {
        $("item-title").focus();
        return;
    }

    const data = {
        id: state.editingItem?.id || uid(),
        catId,
        title,
        author: $("item-author").value.trim(),
        status: state.modalStatus,
        progress: parseInt($("item-progress").value) || 0,
        total: parseInt($("item-total").value) || 0,
        unit: getItemUnit(),
        step: parseInt($("item-step").value) || 1,
        score: parseInt($("item-score").value) || 0,
        notes: $("item-notes").value.trim(),
        sources: state.modalSources.filter((s) => s.name.trim()),
        customData: { ...state.modalCustomValues },
        sessions: state.editingItem?.sessions || [],
        createdAt: state.editingItem?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    if (state.editingItem) {
        const idx = items.findIndex((i) => i.id === data.id);
        if (idx !== -1) items[idx] = data;
    } else {
        items.push(data);
    }
    state.selItem = data.id;
    closeModal("modal-item");
    render();
});

// ════════════════════════════════════════════════════════════════════════
// STATUS NAV
// ════════════════════════════════════════════════════════════════════════
document
    .getElementById("status-nav")
    .querySelectorAll(".snav-btn")
    .forEach((btn) => {
        btn.addEventListener("click", () => {
            state.selStatus = btn.dataset.status;
            document
                .querySelectorAll(".snav-btn")
                .forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            renderCards();
        });
    });

// ════════════════════════════════════════════════════════════════════════
// SEARCH / CLOSE DETAIL
// ════════════════════════════════════════════════════════════════════════
$("search-input").addEventListener("input", (e) => {
    state.search = e.target.value;
    renderCards();
});
$("btn-close-detail").addEventListener("click", () => {
    state.selItem = null;
    renderDetail();
});

// Sidebar all
$("sb-all").addEventListener("click", () => {
    state.selCat = "__all__";
    render();
});

// ════════════════════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════════════════════
render();
