import { $, icon } from "../helpers.js";
import { state, cats, setSyncing } from "../state.js";
import { CAT_ICONS, ICON_LABELS, CAT_COLORS, PRESET_COLS, BASE_COLS, COL_TYPES, uid, slugify } from "../constants.js";
import { openModal, closeModal } from "./index.js";
import { render } from "../render/index.js";
import { createCategory } from "../api.js";
// ════════════════════════════════════════════════════════════════════════
// TABS (category modal)
// ════════════════════════════════════════════════════════════════════════
export function switchTab(tabId) {
  document.querySelectorAll("#modal-cat .modal-tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === tabId));
  document.querySelectorAll("#modal-cat .tab-panel").forEach((p) => p.classList.toggle("active", p.id === tabId));
  if (tabId === "tab-preview") buildSchemaPreview();
}
window.switchTab = switchTab;
document.querySelectorAll("#modal-cat .modal-tab").forEach((tab) => { tab.addEventListener("click", () => switchTab(tab.dataset.tab)); });

// ════════════════════════════════════════════════════════════════════════
// CATEGORY MODAL — con presets y toggle de columnas
// ════════════════════════════════════════════════════════════════════════
export function buildIconPicker() {
  const p = $("icon-picker");
  p.innerHTML = "";
  CAT_ICONS.forEach((ic) => {
    const btn = document.createElement("button");
    btn.className = "icon-opt" + (ic === state.catIcon ? " selected" : "");
    btn.innerHTML = icon(ic);
    btn.title = ICON_LABELS[ic] || ic;
    btn.type = "button";
    btn.addEventListener("click", () => { state.catIcon = ic; p.querySelectorAll(".icon-opt").forEach((b) => b.classList.remove("selected")); btn.classList.add("selected"); });
    p.appendChild(btn);
  });
}

export function buildColorPicker() {
  const p = $("color-picker");
  p.innerHTML = "";
  CAT_COLORS.forEach((col) => {
    const el = document.createElement("div");
    el.className = "color-opt" + (col === state.catColor ? " selected" : "");
    el.style.background  = col;
    el.style.borderColor = col === state.catColor ? "white" : col + "44";
    el.addEventListener("click", () => {
      state.catColor = col;
      p.querySelectorAll(".color-opt").forEach((b) => { b.classList.remove("selected"); b.style.borderColor = b.style.background + "44"; });
      el.classList.add("selected"); el.style.borderColor = "white";
    });
    p.appendChild(el);
  });
}

// ── Preset selector ───────────────────────────────────────────────────────────
export function buildPresetSelector() {
  const wrap = $("preset-selector");
  wrap.innerHTML = "";
  Object.entries(PRESET_COLS).forEach(([key, preset]) => {
    const btn = document.createElement("button");
    btn.className  = "preset-btn" + (key === state.catPreset ? " active" : "");
    btn.textContent= preset.label;
    btn.addEventListener("click", () => {
      state.catPreset  = key;
      state.presetCols = preset.cols.map((c) => ({ ...c }));
      wrap.querySelectorAll(".preset-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderPresetCols();
    });
    wrap.appendChild(btn);
  });
}

// ── Preset cols toggle (columnas preestablecidas que se pueden activar/desactivar) ──
export function renderPresetCols() {
  const container = $("preset-cols-container");
  container.innerHTML = "";

  if (!state.presetCols.length) {
    container.innerHTML = `<div class="preset-empty">Sin columnas predefinidas para este tipo. Usa "Agregar columna" abajo.</div>`;
    return;
  }

  state.presetCols.forEach((col, i) => {
    const row = document.createElement("div");
    row.className = "preset-col-row" + (col.on ? " active" : "");
    row.innerHTML = `
      <label class="preset-col-toggle">
        <input type="checkbox" ${col.on ? "checked" : ""} class="preset-col-check">
        <span class="preset-col-label">${col.label}</span>
        <span class="type-badge ${COL_TYPES[col.type]?.badge}">${COL_TYPES[col.type]?.label}</span>
      </label>`;
    row.querySelector(".preset-col-check").addEventListener("change", (e) => {
      state.presetCols[i].on = e.target.checked;
      row.classList.toggle("active", e.target.checked);
    });
    container.appendChild(row);
  });
}

// ── Custom cols builder (columnas extra añadidas por el usuario) ──────────────
export function renderColBuilder() {
  const builder = $("col-builder");
  const hint    = $("no-cols-hint");
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
        <span class="col-num">${String(i+1).padStart(2,"0")}</span>
        <input class="col-label-input" placeholder="Nombre de columna" value="${col.label}" style="flex:1;min-width:0">
      </div>
      <select class="col-type-select f-select" style="padding:6px 8px;font-size:11px">
        ${Object.entries(COL_TYPES).map(([k,v]) => `<option value="${k}"${col.type===k?" selected":""}>${v.label}</option>`).join("")}
      </select>
      <label class="col-required-toggle">
        <input type="checkbox" class="col-req-check"${col.required?" checked":""}>
        <span>Req.</span>
      </label>
      <button class="col-del-btn" data-idx="${i}" title="Quitar columna"><span class="ms" aria-hidden="true">close</span></button>`;
    row.querySelector(".col-label-input").addEventListener("input",  (e) => { state.customCols[i].label = e.target.value; state.customCols[i].key = slugify(e.target.value) || `col_${i+1}`; });
    row.querySelector(".col-type-select").addEventListener("change", (e) => { state.customCols[i].type = e.target.value; });
    row.querySelector(".col-req-check").addEventListener("change",   (e) => { state.customCols[i].required = e.target.checked; });
    row.querySelector(".col-del-btn").addEventListener("click", () => { state.customCols.splice(i,1); renderColBuilder(); });
    builder.appendChild(row);
  });
}

export function buildBaseCols() {
  const t = $("base-cols-table");
  t.innerHTML = `<thead><tr>
    <th>Nombre</th><th>Clave</th><th>Tipo</th><th>Descripción</th><th></th>
  </tr></thead><tbody>${BASE_COLS.map((c) => `<tr>
    <td class="base-col-name">${c.label}</td>
    <td class="base-col-key">${c.key}</td>
    <td><span class="base-col-type ${COL_TYPES[c.type]?.badge||"type-auto"}">${COL_TYPES[c.type]?.label||"Auto"}</span></td>
    <td class="base-col-desc">${c.desc}</td>
    <td class="base-col-lock"><span class="ms" aria-hidden="true">lock</span></td>
  </tr>`).join("")}</tbody>`;
}

export function buildSchemaPreview() {
  const wrap    = $("schema-preview-wrap");
  const activePre= state.presetCols.filter((c) => c.on);
  const allCols = [
    ...BASE_COLS.map((c) => ({ ...c, origin: "sys" })),
    ...activePre.map((c)  => ({ ...c, origin: "preset" })),
    ...state.customCols.map((c) => ({ ...c, origin: "custom" })),
  ];
  wrap.innerHTML = `
    <div class="sp-head"><span class="ms" aria-hidden="true">table_chart</span> Hoja: ${($("cat-name").value || "CATEGORÍA").toUpperCase()}</div>
    <div style="overflow-x:auto">
      <table class="sp-table">
        <thead><tr>${allCols.map((c) => `
          <th class="${c.origin === "sys" ? "sys" : c.origin === "preset" ? "preset" : "custom"}${c.required?" req":""}">
            ${c.label}<span class="type-badge ${COL_TYPES[c.type]?.badge||"type-auto"}">${COL_TYPES[c.type]?.label||"Auto"}</span>
          </th>`).join("")}</tr></thead>
        <tbody><tr>${allCols.map((c) => `<td>${COL_TYPES[c.type]?.example||"..."}</td>`).join("")}</tr></tbody>
      </table>
    </div>
    <div style="padding:8px 14px;font-size:9px;color:var(--text-4);border-top:1px solid var(--border)">
      ${BASE_COLS.length} base + ${activePre.length} preestablecidas + ${state.customCols.length} personalizadas
      = <strong style="color:var(--accent)">${allCols.length} columnas totales</strong>
    </div>`;
}

$("btn-add-col").addEventListener("click", () => {
  state.customCols.push({ id: uid(), label: "", key: `col_${state.customCols.length+1}`, type: "text", required: false });
  renderColBuilder();
  $("no-cols-hint").style.display = "none";
});

export function openCatModal(cat = null, startTab = "tab-info") {
  state.editingCat  = cat;
  state.catIcon     = cat?.icon  || CAT_ICONS[0];
  state.catColor    = cat?.color || CAT_COLORS[0];
  state.catPreset   = "custom";
  state.presetCols  = [];
  state.customCols  = cat?.columns ? cat.columns.map((c) => ({ ...c })) : [];

  $("modal-cat-title").innerHTML  = cat ? `<span class="ms" aria-hidden="true">edit</span> Editar categoría` : `<span class="ms" aria-hidden="true">add</span> Nueva categoría`;
  $("btn-save-cat").textContent     = cat ? "Guardar cambios"    : "Crear en Google Sheets";
  $("cat-name").value               = cat?.name || "";
  $("cat-desc").value               = cat?.desc || "";

  buildIconPicker();
  buildColorPicker();
  buildBaseCols();
  buildPresetSelector();
  renderPresetCols();
  renderColBuilder();
  switchTab(startTab);
  openModal("modal-cat");
  if (startTab === "tab-info") setTimeout(() => $("cat-name").focus(), 80);
}

$("btn-new-cat").addEventListener("click", () => openCatModal());

$("btn-save-cat").addEventListener("click", async () => {
  const name = $("cat-name").value.trim();
  if (!name) { switchTab("tab-info"); $("cat-name").focus(); return; }

  // Construir lista de encabezados para Google Sheets:
  // BASE_COLS + presetCols activas + customCols con label
  const activePreset = state.presetCols.filter((c) => c.on);
  const extraCols    = state.customCols.filter((c) => c.label.trim());
  const allColDefs   = [
    ...activePreset,
    ...extraCols.map((c) => ({ ...c, key: slugify(c.label) || c.key })),
  ];

  // sheetName codifica nombre + icono + color para recuperarlos al leer
  const sheetName = `${name}||${state.catIcon}||${state.catColor}`;
  // Headers para Google Sheets: BASE_COLS + columnas extras
  const headers   = [
    ...BASE_COLS.map((c) => c.label),
    ...allColDefs.map((c) => c.label),
  ];

  if (state.editingCat) {
    // Edición local (la hoja ya existe en Sheets, solo actualizamos metadata interna)
    const data = {
      ...state.editingCat,
      name,
      desc:    $("cat-desc").value.trim(),
      icon:    state.catIcon,
      color:   state.catColor,
      columns: allColDefs,
    };
    const idx = cats.findIndex((c) => c.id === data.id);
    if (idx !== -1) cats[idx] = data;
    closeModal("modal-cat");
    render();
    return;
  }

  // ── Crear nueva hoja en Google Sheets ─────────────────────────────────
  const btn = $("btn-save-cat");
  btn.disabled    = true;
  btn.textContent = "Creando…";
  setSyncing(true);

  try {
    await createCategory(sheetName, headers);
    // Añadir a estado local
    cats.push({
      id:        uid(),
      name,
      desc:      $("cat-desc").value.trim(),
      icon:      state.catIcon,
      color:     state.catColor,
      columns:   allColDefs,
      sheetName,
    });
    setSyncing(false);
    closeModal("modal-cat");
    render();
  } catch (err) {
    setSyncing(false, err.message);
    btn.textContent = "Crear en Google Sheets";
    // Mostrar error inline en el modal
    let errEl = $("cat-save-error");
    if (!errEl) { errEl = document.createElement("div"); errEl.id = "cat-save-error"; errEl.className = "inline-error"; $("btn-save-cat").parentNode.insertBefore(errEl, $("btn-save-cat")); }
    errEl.textContent = `Error: ${err.message}`;
  } finally {
    btn.disabled = false;
    if (!state.syncing) btn.textContent = state.editingCat ? "Guardar cambios" : "Crear en Google Sheets";
  }
});
