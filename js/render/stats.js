import { $ } from "../helpers.js";
import { items } from "../state.js";
// ════════════════════════════════════════════════════════════════════════
// RENDER STATS
// ════════════════════════════════════════════════════════════════════════
export function renderStats() {
  $("stat-total").textContent  = items.length;
  $("stat-inprog").textContent = items.filter((i) => i.status === "en progreso").length;
  $("stat-done").textContent   = items.filter((i) => i.status === "completado").length;
}

