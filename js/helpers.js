import { CAT_ICONS } from "./constants.js";
// ════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════
export const $       = (id) => document.getElementById(id);

// Renderiza un icono Material Symbols; si el valor persistido es legacy
// (glifo Unicode de versiones previas), cae a un span de fuente base.
export const KNOWN_ICONS = new Set(CAT_ICONS);
export function icon(ic) {
  const v = (ic || "").trim();
  if (KNOWN_ICONS.has(v)) return `<span class="ms" aria-hidden="true">${v}</span>`;
  return `<span class="legacy-glyph" aria-hidden="true">${v || "widgets"}</span>`;
}
