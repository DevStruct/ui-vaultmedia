import { renderStats } from "./stats.js";
import { renderSidebar } from "./sidebar.js";
import { renderCards } from "./cards.js";
import { renderDetail } from "./detail.js";
// ════════════════════════════════════════════════════════════════════════
// MAIN RENDER
// ════════════════════════════════════════════════════════════════════════
export function render() { renderStats(); renderSidebar(); renderCards(); renderDetail(); }
