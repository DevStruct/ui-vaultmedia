import { $ } from "./helpers.js";
// ════════════════════════════════════════════════════════════════════════
// CLOCK
// ════════════════════════════════════════════════════════════════════════
export function tickClock() {
  const d = new Date();
  $("clock").textContent = [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, "0")).join(":");
}
tickClock();
setInterval(tickClock, 1000);
