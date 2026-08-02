import { $, icon } from "../helpers.js";
import { items, state, catById } from "../state.js";
import { STATUS_META, pct } from "../constants.js";
import { changeProgress, logSession } from "../actions.js";
import { openItemModal } from "../modals/item.js";
import { render } from "./index.js";
// ════════════════════════════════════════════════════════════════════════
// RENDER DETAIL (sin cambios funcionales)
// ════════════════════════════════════════════════════════════════════════
export function renderDetail() {
  const body     = $("detail-body");
  const empty    = $("detail-empty");
  const closeBtn = $("btn-close-detail");
  const detailEl = $("detail");

  if (detailEl) detailEl.classList.toggle("mobile-open", !!state.selItem);

  if (!state.selItem) { body.style.display = "none"; empty.style.display = "flex"; closeBtn.style.display = "none"; return; }
  const it = items.find((i) => i.id === state.selItem);
  if (!it) { state.selItem = null; renderDetail(); return; }

  const c    = catById(it.catId) || { icon: "widgets", name: "?", color: "#00bcd4", columns: [] };
  const cc   = c.color;
  const p    = pct(it.progress, it.total);
  const smeta= STATUS_META[it.status];

  if (detailEl) detailEl.style.setProperty("--cc", cc);

  empty.style.display = "none";
  body.style.display  = "flex";
  closeBtn.style.display = "block";

  const customRows = (c.columns || []).map((col) => {
    const val = it.customData?.[col.key] ?? "—";
    return `<div class="d-field"><span class="d-field-key">${col.label}</span><span class="d-field-val">${val}</span></div>`;
  }).join("");

  body.innerHTML = `
    <div class="d-cover">
      <div class="d-cover-shimmer"></div>
      <span style="font-size:24px;position:relative;z-index:1">${icon(c.icon)}</span>
    </div>
    <div>
      <div class="d-title">${it.title}</div>
      <div class="d-badges">
        <span class="d-cat-tag">${c.name}</span>
        <span class="st-badge ${smeta.cls}">${smeta.label}</span>
        ${it.score ? `<span class="d-score"><span class="ms" aria-hidden="true">star</span> ${it.score}</span>` : ""}
      </div>
    </div>
    ${it.author ? `<div class="d-field"><span class="d-field-key">Autor / Director</span><span class="d-field-val">${it.author}</span></div>` : ""}
    ${customRows ? `<div><div class="d-section-label">Campos personalizados</div><div class="d-custom-fields">${customRows}</div></div>` : ""}
    <div>
      <div class="d-section-label">Fuentes (${(it.sources || []).length})</div>
      <div class="d-sources">
        ${!(it.sources || []).length
          ? `<span style="font-size:11px;color:rgba(212,255,230,.25)">Sin fuentes</span>`
          : (it.sources || []).map((s, i) => `
            <div class="d-src-row">
              <span class="d-src-num">${String(i+1).padStart(2,"0")}</span>
              <span class="d-src-name">${s.name}</span>
              ${s.url ? `<a class="d-src-link" href="${s.url}" target="_blank" rel="noreferrer"><span class="ms" aria-hidden="true">open_in_new</span> Abrir</a>` : ""}
            </div>`).join("")}
      </div>
    </div>
    ${it.total > 0 ? `
    <div class="d-prog-section">
      <div class="d-prog-label">Progreso</div>
      <div class="d-prog-display">${it.unit.toUpperCase()}. ${it.progress} / ${it.total}</div>
      <div class="d-prog-bar-wrap"><div class="d-prog-bar-fill" style="width:${p}%"></div></div>
      <div class="d-prog-pct" style="margin-bottom:10px">${p}% completado</div>
      <div class="prog-modes" id="d-prog-modes">
        <button class="prog-mode-btn active" data-mode="steps">Pasos rápidos</button>
        <button class="prog-mode-btn" data-mode="session">Sesión</button>
        <button class="prog-mode-btn" data-mode="direct">Valor directo</button>
        <button class="prog-mode-btn" data-mode="percent">Porcentaje</button>
      </div>
      <div class="prog-mode-panel" id="d-mode-steps">
        <div class="prog-steps">
          <button class="prog-step-btn step-minus" data-step="-1">−1</button>
          ${it.step && it.step > 1 ? `<button class="prog-step-btn step-minus" data-step="${-it.step}">−${it.step}</button>` : ""}
          <button class="prog-step-btn step-plus" data-step="1">+1 ${it.unit}</button>
          ${it.step && it.step > 1 ? `<button class="prog-step-btn step-plus" data-step="${it.step}">+${it.step} ${it.unit}</button>` : ""}
          <button class="prog-step-btn step-plus" data-step="10">+10 ${it.unit}</button>
          <button class="prog-step-btn step-custom step-end" data-step="${it.total}"><span class="ms" aria-hidden="true">flag</span> Al final</button>
        </div>
      </div>
      <div class="prog-mode-panel" id="d-mode-session" style="display:none">
        <div class="prog-session">
          <div class="prog-session-row">
            <input class="prog-session-input" id="d-session-val" type="number" min="0" placeholder="${it.step || 1}">
            <span style="font-size:12px;color:rgba(212,255,230,.3);padding:0 6px">${it.unit}</span>
            <input class="f-input" id="d-session-note" placeholder="nota de sesión (opcional)" style="flex:1;font-size:11px;padding:7px 10px">
          </div>
          <div class="prog-session-hint">Ingresa cuánto consumiste en esta sesión.</div>
          <button class="btn btn-amber btn-sm" id="d-btn-log-session" style="align-self:flex-start"><span class="ms" aria-hidden="true">play_arrow</span> Registrar sesión</button>
        </div>
      </div>
      <div class="prog-mode-panel" id="d-mode-direct" style="display:none">
        <div class="prog-direct">
          <input class="prog-direct-input" id="d-direct-val" type="number" min="0" max="${it.total}" value="${it.progress}">
          <span class="prog-slash-big">/</span>
          <span class="prog-total-disp">${it.total}</span>
          <span style="font-size:12px;color:rgba(212,255,230,.35);margin-left:4px">${it.unit}</span>
          <button class="btn btn-primary btn-sm" id="d-btn-direct-apply" style="margin-left:4px">Aplicar</button>
        </div>
      </div>
      <div class="prog-mode-panel" id="d-mode-percent" style="display:none">
        <div class="prog-pct-wrap">
          <div class="pct-display" id="d-pct-display">${p}%</div>
          <input class="pct-slider" id="d-pct-slider" type="range" min="0" max="100" value="${p}">
          <button class="btn btn-primary btn-sm" id="d-btn-pct-apply" style="align-self:flex-end">Aplicar ${p}%</button>
        </div>
      </div>
    </div>
    ${(it.sessions || []).length ? `
    <div>
      <div class="d-section-label">Registro de sesiones (${(it.sessions || []).length})</div>
      <div class="session-log">
        ${[...(it.sessions || [])].reverse().map((s) => `
          <div class="session-log-entry">
            <span class="sle-amount">+${s.amount} ${it.unit}</span>
            <span class="sle-date">${s.date}</span>
            ${s.note ? `<span class="sle-note" title="${s.note}">— ${s.note}</span>` : ""}
          </div>`).join("")}
      </div>
    </div>` : ""}` : ""}
    <div>
      <div class="d-section-label">Estado</div>
      <div class="d-status-btns">
        ${Object.entries(STATUS_META).map(([val, m]) =>
          `<button class="d-status-opt${it.status === val ? " " + m.selCls : ""}" data-val="${val}">${m.label}</button>`
        ).join("")}
      </div>
    </div>
    ${it.notes ? `<div><div class="d-section-label">Notas</div><div class="d-notes">${it.notes}</div></div>` : ""}
    <button class="btn btn-amber btn-sm" id="d-btn-edit"><span class="ms" aria-hidden="true">edit</span> Editar elemento</button>`;

  body.querySelectorAll(".d-status-opt").forEach((btn) => {
    btn.addEventListener("click", () => { const ref = items.find((i) => i.id === state.selItem); if (!ref) return; ref.status = btn.dataset.val; render(); });
  });
  body.querySelector("#d-btn-edit")?.addEventListener("click", () => { const ref = items.find((i) => i.id === state.selItem); if (ref) openItemModal(ref); });

  body.querySelectorAll(".prog-mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      body.querySelectorAll(".prog-mode-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      body.querySelectorAll(".prog-mode-panel").forEach((p) => (p.style.display = "none"));
      body.querySelector(`#d-mode-${btn.dataset.mode}`).style.display = "";
    });
  });
  body.querySelectorAll(".prog-step-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const step = parseInt(btn.dataset.step) || 0;
      if (btn.classList.contains("step-end")) changeProgress(it.id, it.total);
      else logSession(it.id, step);
    });
  });
  body.querySelector("#d-btn-log-session")?.addEventListener("click", () => {
    const val  = parseInt(body.querySelector("#d-session-val")?.value) || 0;
    const note = body.querySelector("#d-session-note")?.value.trim()  || "";
    if (!val) return;
    logSession(it.id, val, note);
    if (body.querySelector("#d-session-val"))  body.querySelector("#d-session-val").value  = "";
    if (body.querySelector("#d-session-note")) body.querySelector("#d-session-note").value = "";
  });
  body.querySelector("#d-session-val")?.addEventListener("keydown", (e) => { if (e.key === "Enter") body.querySelector("#d-btn-log-session")?.click(); });
  const directInput = body.querySelector("#d-direct-val");
  body.querySelector("#d-btn-direct-apply")?.addEventListener("click", () => { const val = parseInt(directInput?.value); if (!isNaN(val)) changeProgress(it.id, val); });
  directInput?.addEventListener("keydown", (e) => { if (e.key === "Enter") body.querySelector("#d-btn-direct-apply")?.click(); });
  const slider  = body.querySelector("#d-pct-slider");
  const pctDisp = body.querySelector("#d-pct-display");
  const pctApply= body.querySelector("#d-btn-pct-apply");
  slider?.addEventListener("input", () => { pctDisp.textContent = slider.value + "%"; if (pctApply) pctApply.textContent = `Aplicar ${slider.value}%`; });
  pctApply?.addEventListener("click", () => { changeProgress(it.id, Math.round((parseInt(slider.value) / 100) * it.total)); });
}

