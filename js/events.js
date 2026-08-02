import { state } from "./state.js";
import { $ } from "./helpers.js";
import { render } from "./render/index.js";
import { renderCards } from "./render/cards.js";
import { renderDetail } from "./render/detail.js";
// ════════════════════════════════════════════════════════════════════════
// STATUS NAV
// ════════════════════════════════════════════════════════════════════════
document.getElementById("status-nav").querySelectorAll(".snav-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.selStatus = btn.dataset.status;
    document.querySelectorAll(".snav-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    renderCards();
  });
});

// ════════════════════════════════════════════════════════════════════════
// SEARCH / CLOSE DETAIL
// ════════════════════════════════════════════════════════════════════════
$("search-input").addEventListener("input", (e) => { state.search = e.target.value; renderCards(); });
$("btn-close-detail").addEventListener("click", () => { state.selItem = null; renderDetail(); });
$("sb-all").addEventListener("click", () => { state.selCat = "__all__"; render(); });
