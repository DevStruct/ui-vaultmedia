import { $ } from "../helpers.js";
import { state, items, cats, catById, setSyncing } from "../state.js";
import { COL_TYPES, uid, pct } from "../constants.js";
import { openModal, closeModal } from "./index.js";
import { render } from "../render/index.js";
import { itemToSheetRow } from "../data.js";
import { updateItem, insertItem } from "../api.js";
// ════════════════════════════════════════════════════════════════════════
// ITEM MODAL
// ════════════════════════════════════════════════════════════════════════
function renderSourcesList() {
  const list = $("sources-list");
  list.innerHTML = "";
  state.modalSources.forEach((src, i) => {
    const row = document.createElement("div");
    row.className = "source-row";
    row.innerHTML = `
      <span class="source-row-num">${String(i+1).padStart(2,"0")}</span>
      <input class="source-name-input" placeholder="Nombre (Netflix, Físico…)" value="${src.name}">
      ${state.modalSources.length > 1 ? `<button class="src-del-btn" data-idx="${i}" title="Quitar fuente"><span class="ms" aria-hidden="true">close</span></button>` : ""}`;
    row.querySelector(".source-name-input").addEventListener("input", (e) => { state.modalSources[i].name = e.target.value; });
    row.querySelector(".src-del-btn")?.addEventListener("click", () => { state.modalSources.splice(i,1); renderSourcesList(); });
    list.appendChild(row);
  });
}
$("btn-add-source").addEventListener("click", () => { state.modalSources.push({ id: uid(), name: "", url: "" }); renderSourcesList(); });

function renderCustomItemFields(catId) {
  const cat  = catById(catId);
  const area = $("item-custom-fields");
  area.innerHTML = "";
  if (!cat?.columns?.length) return;

  const sep    = document.createElement("div"); sep.className = "section-sep"; sep.style.margin = "4px 0 8px"; area.appendChild(sep);
  const header = document.createElement("div");
  header.className = "cf-header";
  header.textContent = "Campos personalizados — " + cat.name;
  area.appendChild(header);

  cat.columns.forEach((col) => {
    const wrap = document.createElement("div");
    const val  = state.modalCustomValues[col.key] ?? "";
    let inputHtml = "";
    if (col.type === "bool") {
      inputHtml = `<div style="display:flex;gap:10px;margin-top:4px">${["Sí","No"].map((opt) => `<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px"><input type="radio" name="cf_${col.key}" value="${opt}" ${val===opt?"checked":""} style="accent-color:var(--accent)"> ${opt}</label>`).join("")}</div>`;
    } else if (col.type === "date") {
      inputHtml = `<input class="f-input" type="date" id="cf_${col.key}" value="${val}" style="color-scheme:dark">`;
    } else {
      inputHtml = `<input class="f-input" id="cf_${col.key}" placeholder="${COL_TYPES[col.type]?.example||""}" value="${val}">`;
    }
    wrap.innerHTML = `<label class="f-label">${col.label}${col.required?` <span style="color:var(--danger)">*</span>`:""}<span class="type-badge ${COL_TYPES[col.type]?.badge}">${COL_TYPES[col.type]?.label}</span></label>${inputHtml}`;
    const bind = () => {
      if (col.type === "bool") { const checked = wrap.querySelector(`input[name="cf_${col.key}"]:checked`); state.modalCustomValues[col.key] = checked ? checked.value : ""; }
      else { state.modalCustomValues[col.key] = wrap.querySelector(`#cf_${col.key}`)?.value || ""; }
    };
    wrap.querySelectorAll("input").forEach((inp) => inp.addEventListener("input", bind));
    area.appendChild(wrap);
  });
}

function getItemUnit() {
  const preset = $("item-unit-preset")?.value;
  if (preset === "custom") return $("item-unit-custom")?.value.trim() || "unidad";
  return preset || "cap";
}
function updateUnitEcho() {
  const unit  = getItemUnit();
  const total = parseInt($("item-total")?.value) || 0;
  const prog  = parseInt($("item-progress")?.value) || 0;
  if ($("item-unit-echo"))       $("item-unit-echo").textContent  = unit;
  if ($("item-step-unit-echo"))  $("item-step-unit-echo").textContent = unit;
  if ($("item-total-echo"))      $("item-total-echo").textContent = total || "?";
  if ($("item-pct-echo"))        $("item-pct-echo").textContent   = total > 0 ? `${pct(prog,total)}%` : "";
}
$("item-unit-preset")?.addEventListener("change", () => { $("item-unit-custom-wrap").style.display = $("item-unit-preset").value === "custom" ? "block" : "none"; updateUnitEcho(); });
$("item-unit-custom")?.addEventListener("input", updateUnitEcho);
$("item-total")?.addEventListener("input",    updateUnitEcho);
$("item-progress")?.addEventListener("input", updateUnitEcho);
$("item-step")?.addEventListener("input",     updateUnitEcho);

export function openItemModal(item = null) {
  state.editingItem       = item;
  state.modalStatus       = item?.status || "pendiente";
  state.modalCustomValues = item?.customData ? { ...item.customData } : {};

  $("modal-item-title").innerHTML = item ? `<span class="ms" aria-hidden="true">edit</span> Editar elemento` : `<span class="ms" aria-hidden="true">add</span> Nuevo elemento`;
  $("btn-save-item").textContent    = item ? "Guardar cambios"   : "Crear elemento";

  const hasCats = cats.length > 0;
  $("item-no-cats").style.display      = hasCats ? "none"     : "block";
  $("item-form-fields").style.display  = hasCats ? "contents" : "none";
  $("btn-save-item").style.display     = hasCats ? ""         : "none";

  if (hasCats) {
    const sel = $("item-cat");
    sel.innerHTML = cats.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
    if (item) sel.value = item.catId;

    $("item-title").value    = item?.title    || "";
    $("item-author").value   = item?.author   || "";
    $("item-progress").value = item?.progress != null ? item.progress : "";
    $("item-total").value    = item?.total    != null ? item.total    : "";
    $("item-step").value     = item?.step     || "";

    const unitPresets = ["cap","pág","ep","min","h","vol"];
    const unitVal     = item?.unit || "cap";
    const presetSel   = $("item-unit-preset");
    if (unitPresets.includes(unitVal)) { presetSel.value = unitVal; $("item-unit-custom-wrap").style.display = "none"; }
    else { presetSel.value = "custom"; $("item-unit-custom-wrap").style.display = "block"; $("item-unit-custom").value = unitVal; }
    updateUnitEcho();

    $("item-score").value = item?.score || "";
    $("item-notes").value = item?.notes || "";

    document.querySelectorAll("#item-status-group .status-pill").forEach((b) => {
      b.classList.toggle("active", b.dataset.val === state.modalStatus);
    });

    state.modalSources = item?.sources ? item.sources.map((s) => ({ ...s })) : [{ id: uid(), name: "", url: "" }];
    renderSourcesList();
    renderCustomItemFields(sel.value);
    sel.addEventListener("change", () => { state.modalCustomValues = {}; renderCustomItemFields(sel.value); });
  }
  openModal("modal-item");
  if (hasCats) setTimeout(() => $("item-title").focus(), 80);
}

$("btn-new-item").addEventListener("click", () => openItemModal());

document.querySelectorAll("#item-status-group .status-pill").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.modalStatus = btn.dataset.val;
    document.querySelectorAll("#item-status-group .status-pill").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

$("btn-save-item").addEventListener("click", async () => {
  const title = $("item-title").value.trim();
  const catId = $("item-cat").value;
  if (!title || !catId) { $("item-title").focus(); return; }

  const cat = catById(catId);
  const now  = new Date().toISOString();
  const data = {
    id:         state.editingItem?.id || uid(),
    catId,
    title,
    author:     $("item-author").value.trim(),
    status:     state.modalStatus,
    progress:   parseInt($("item-progress").value) || 0,
    total:      parseInt($("item-total").value)    || 0,
    unit:       getItemUnit(),
    step:       parseInt($("item-step").value)     || 1,
    score:      parseInt($("item-score").value)    || 0,
    notes:      $("item-notes").value.trim(),
    sources:    state.modalSources.filter((s) => s.name.trim()),
    customData: { ...state.modalCustomValues },
    sessions:   state.editingItem?.sessions || [],
    createdAt:  state.editingItem?.createdAt || now,
    updatedAt:  now,
  };

  // Optimistic update
  if (state.editingItem) {
    const idx = items.findIndex((i) => i.id === data.id);
    if (idx !== -1) items[idx] = data;
  } else {
    items.push(data);
  }
  state.selItem = data.id;
  closeModal("modal-item");
  render();

  // Sync remoto
  const row = itemToSheetRow(data, cat);
  setSyncing(true);
  try {
    if (state.editingItem) { await updateItem(cat.sheetName, data.id, row); }
    else                   { await insertItem(cat.sheetName, row); }
    setSyncing(false);
  } catch (err) {
    setSyncing(false, err.message);
  }
});
