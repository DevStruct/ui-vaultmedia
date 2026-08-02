import { $, icon } from "../helpers.js";
import { cats, items, state } from "../state.js";
import { STATUS_META } from "../constants.js";
import { selectItem, deleteItem, logSession } from "../actions.js";
import { openItemModal } from "../modals/item.js";
// ════════════════════════════════════════════════════════════════════════
// RENDER CARDS
// ════════════════════════════════════════════════════════════════════════
export function getFiltered() {
  return items.filter((it) => {
    const mCat    = state.selCat    === "__all__" || it.catId  === state.selCat;
    const mStatus = state.selStatus === "__all__" || it.status === state.selStatus;
    const q       = state.search.toLowerCase();
    const mSearch = !q
      || it.title.toLowerCase().includes(q)
      || (it.author || "").toLowerCase().includes(q)
      || (it.sources || []).some((s) => s.name.toLowerCase().includes(q));
    return mCat && mStatus && mSearch;
  });
}

export function renderCards() {
  const area     = $("cards-area");
  const filtered = getFiltered();
  area.innerHTML = "";

  if (!filtered.length) {
    const noItems = !items.length;
    const reason = noItems
      ? (!cats.length
          ? "Crea una categoría para empezar."
          : "Agrega tu primer elemento.")
      : "";
    let cta = "";
    if (noItems) {
      cta = cats.length
        ? `<button class="btn btn-primary btn-sm" id="empty-cta"><span class="ms" aria-hidden="true">add</span> Nuevo elemento</button>`
        : `<button class="btn btn-primary btn-sm" id="empty-cta"><span class="ms" aria-hidden="true">add</span> Nueva categoría</button>`;
    }
    area.innerHTML = `<div id="empty-state">
      <div class="empty-glyph"><span class="ms" aria-hidden="true">inbox</span></div>
      <div class="empty-title">${noItems ? "BIBLIOTECA VACÍA" : "SIN RESULTADOS"}</div>
      ${reason ? `<div class="empty-hint">${reason}</div>` : ""}
      ${cta}
    </div>`;
    const ctaBtn = $("empty-cta");
    if (ctaBtn) ctaBtn.addEventListener("click", () => (cats.length ? openItemModal() : openCatModal()));
    return;
  }

  const groups = {};
  cats.forEach((c) => { groups[c.id] = []; });
  filtered.forEach((it) => { if (!groups[it.catId]) groups[it.catId] = []; groups[it.catId].push(it); });

  cats.forEach((c) => {
    const grpItems = groups[c.id];
    if (!grpItems?.length) return;
    const sec = document.createElement("div");
    sec.className = "media-group";
    sec.style.setProperty("--cc", c.color);

    sec.insertAdjacentHTML("beforeend", `
      <div class="group-hdr">
        <span class="group-title">${icon(c.icon)} ${c.name}</span>
        <span class="group-count">— ${grpItems.length} elemento${grpItems.length !== 1 ? "s" : ""}</span>
        <div class="group-line"></div>
        <button class="group-schema-btn" data-catid="${c.id}"><span class="ms" aria-hidden="true">table_chart</span> Tabla</button>
      </div>`);

    sec.querySelector(".group-schema-btn").addEventListener("click", () => openCatModal(c, "tab-schema"));

    const grid = document.createElement("div");
    grid.className = "media-grid";
    grpItems.forEach((it, idx) => {
      const card = buildCard(it, c);
      card.style.animationDelay = `${idx * 0.08}s`;
      grid.appendChild(card);
    });
    sec.appendChild(grid);
    area.appendChild(sec);
  });
}

export function buildCard(it, c) {
  const smeta = STATUS_META[it.status] || STATUS_META["pendiente"];
  const cc    = c.color;

  const card = document.createElement("div");
  card.className = "media-card";
  card.style.setProperty("--cc", cc);
  card.addEventListener("click", () => selectItem(it.id));

  const visibleCols   = (c.columns || []).filter((col) => it.customData?.[col.key] != null && it.customData[col.key] !== "").slice(0, 2);
  const customFieldsHtml = visibleCols.map((col) => `
    <div class="mc-cf-row">
      <span class="mc-cf-key">${col.label}:</span>
      <span class="mc-cf-val">${it.customData[col.key]}</span>
    </div>`).join("");

  const progLine = it.total > 0 ? `
    <div class="mc-prog-widget">
      <div class="mc-session-row">
        <input class="mc-session-input" type="number" min="0" placeholder="${it.step || 1}" title="Ingresa cuánto avanzaste" onclick="event.stopPropagation()">
        <button class="mc-session-apply" data-action="session" title="Registrar avance"><span class="ms" aria-hidden="true">add</span></button>
      </div>
    </div>` : "";

  card.innerHTML = `
    <div class="mc-thumb">
      <div class="mc-thumb-shimmer"></div>
      ${it.total > 0 ? `<span class="mc-prog-stat">${it.progress}<small>${it.unit}</small></span>` : `<span class="mc-type-glyph">${icon(c.icon)}</span>`}
      <span class="mc-type-tag">${c.name}</span>
      <span class="mc-status-badge ${smeta.cls}">${smeta.label}</span>
    </div>
    <div class="mc-body">
      <div class="mc-title">${it.title}</div>
      ${customFieldsHtml ? `<div class="mc-custom-fields">${customFieldsHtml}</div>` : ""}
      ${progLine}
      <div class="mc-actions">
        <button class="mc-btn" data-action="edit" title="Editar"><span class="ms" aria-hidden="true">edit</span></button>
        <button class="mc-btn mc-btn-del" data-action="del" title="Eliminar"><span class="ms" aria-hidden="true">delete</span></button>
      </div>
    </div>`;

  const sessionInput = card.querySelector(".mc-session-input");
  card.querySelector('[data-action="session"]')?.addEventListener("click", (e) => {
    e.stopPropagation();
    const amt = parseInt(sessionInput?.value) || it.step || 1;
    logSession(it.id, amt);
    if (sessionInput) sessionInput.value = "";
  });
  sessionInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.stopPropagation(); const amt = parseInt(sessionInput.value) || it.step || 1; logSession(it.id, amt); sessionInput.value = ""; }
  });
  card.querySelector('[data-action="edit"]').addEventListener("click", (e) => { e.stopPropagation(); openItemModal(it); });
  card.querySelector('[data-action="del"]').addEventListener("click",  (e) => { e.stopPropagation(); deleteItem(it.id); });
  return card;
}

