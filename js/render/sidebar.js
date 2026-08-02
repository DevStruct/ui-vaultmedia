import { $, icon } from "../helpers.js";
import { cats, items, state } from "../state.js";
import { openCatModal } from "../modals/cat.js";
import { openDelCatModal } from "../modals/del-cat.js";
import { render } from "./index.js";
// ════════════════════════════════════════════════════════════════════════
// RENDER SIDEBAR
// ════════════════════════════════════════════════════════════════════════
export function renderSidebar() {
  const total = items.length;
  $("sb-all-count").textContent = total;
  $("sb-all").classList.toggle("active", state.selCat === "__all__");
  $("cat-count-label").textContent = `(${cats.length})`;

  const list = $("cats-list");
  list.innerHTML = "";

  if (!cats.length) {
    list.innerHTML = `<div class="sb-empty-hint">Sin categorías.<br>Crea la primera ↓</div>`;
  }

  cats.forEach((c) => {
    const cnt    = items.filter((i) => i.catId === c.id).length;
    const active = state.selCat === c.id;
    const el     = document.createElement("div");
    el.className = "sb-item" + (active ? " active" : "");
    el.style.setProperty("--cc", c.color);
    el.innerHTML = `
      <span class="sb-icon">${icon(c.icon)}</span>
      <span class="sb-name">${c.name}</span>
      <span class="sb-count">${cnt}</span>
      <div class="sb-cat-actions">
        <button class="cat-act-btn cat-act-table" title="Diseñar tabla" style="display:none"><span class="ms" aria-hidden="true">table_chart</span></button>
        <button class="cat-act-btn cat-act-edit"  title="Editar"><span class="ms" aria-hidden="true">edit</span></button>
        <button class="cat-act-btn cat-act-del"   title="Eliminar"><span class="ms" aria-hidden="true">delete</span></button>
      </div>`;
    el.addEventListener("click", () => { state.selCat = active ? "__all__" : c.id; render(); });
    el.querySelector(".cat-act-table").addEventListener("click", (e) => { e.stopPropagation(); openCatModal(c, "tab-schema"); });
    el.querySelector(".cat-act-edit").addEventListener("click",  (e) => { e.stopPropagation(); openCatModal(c); });
    el.querySelector(".cat-act-del").addEventListener("click",   (e) => { e.stopPropagation(); openDelCatModal(c); });
    list.appendChild(el);
  });

  // Distribución
  const dist = $("dist-section");
  dist.innerHTML = "";
  cats.forEach((c) => {
    const cnt = items.filter((i) => i.catId === c.id).length;
    const p   = total > 0 ? Math.round((cnt / total) * 100) : 0;
    dist.insertAdjacentHTML("beforeend", `
      <div style="margin-bottom:10px;--cc:${c.color}">
        <div class="dist-label-row">
          <span style="color:var(--cc)">${icon(c.icon)} ${c.name}</span>
          <span class="dist-pct">${p}%</span>
        </div>
        <div class="dist-track">
          <div class="dist-fill" style="width:${p}%"></div>
        </div>
      </div>`);
  });
}

