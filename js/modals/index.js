import { $ } from "../helpers.js";
// ════════════════════════════════════════════════════════════════════════
// MODAL UTILS
// ════════════════════════════════════════════════════════════════════════
export function openModal(id)  { $(id).classList.add("open");    }
export function closeModal(id) { $(id).classList.remove("open"); }

document.querySelectorAll(".modal-overlay").forEach((ov) => {
  ov.addEventListener("click", (e) => { if (e.target === ov) ov.classList.remove("open"); });
});
document.querySelectorAll("[data-close]").forEach((btn) => {
  btn.addEventListener("click", () => closeModal(btn.dataset.close));
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") ["modal-cat","modal-item","modal-del-cat"].forEach((id) => { if ($(id).classList.contains("open")) closeModal(id); });
});

