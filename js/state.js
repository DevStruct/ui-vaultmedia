import { CAT_ICONS, CAT_COLORS } from "./constants.js";
import { $ } from "./helpers.js";
// ════════════════════════════════════════════════════════════════════════
// DATA — estado local (espejo de Google Sheets)
// ════════════════════════════════════════════════════════════════════════
export let cats  = [];
export let items = [];

export function setCats(v) { cats = v; }
export function setItems(v) { items = v; }

// ════════════════════════════════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════════════════════════════════
export const state = {
  selCat:    "__all__",
  selStatus: "__all__",
  selItem:   null,
  search:    "",
  // Cat modal
  editingCat:    null,
  catIcon:       CAT_ICONS[0],
  catColor:      CAT_COLORS[0],
  catPreset:     "custom",       // key de PRESET_COLS activo
  presetCols:    [],             // copia mutable de PRESET_COLS[x].cols con .on
  customCols:    [],             // columnas extra añadidas manualmente
  // Item modal
  editingItem:   null,
  modalSources:  [],
  modalStatus:   "pendiente",
  modalCustomValues: {},
  // Sync
  syncing:  false,
  syncError: null,
};

// ════════════════════════════════════════════════════════════════════════
// SYNC HELPERS — feedback visual para operaciones de red
// ════════════════════════════════════════════════════════════════════════
export function setSyncing(active, error = null) {
  state.syncing   = active;
  state.syncError = error;
  const ind = $("sync-indicator");
  if (!ind) return;
  ind.className = "sync-indicator" + (active ? " syncing" : error ? " error" : " ok");
  ind.title     = active ? "Sincronizando…" : error ? `Error: ${error}` : "Sincronizado";
}
export const catById = (id) => cats.find((c) => c.id === id);
