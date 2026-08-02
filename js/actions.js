import { items, state, catById, setItems, setSyncing } from "./state.js";
import { render } from "./render/index.js";
import { renderDetail } from "./render/detail.js";
import { itemToSheetRow } from "./data.js";
import { updateItem, deleteItemRemote } from "./api.js";
// ════════════════════════════════════════════════════════════════════════
// ACTIONS
// ════════════════════════════════════════════════════════════════════════
export function selectItem(id) { state.selItem = state.selItem === id ? null : id; renderDetail(); }

export async function deleteItem(id) {
  const it  = items.find((i) => i.id === id);
  const cat = catById(it?.catId);
  setItems(items.filter((i) => i.id !== id));
  if (state.selItem === id) state.selItem = null;
  render();
  // Sync remoto
  if (it && cat) {
    setSyncing(true);
    try   { await deleteItemRemote(cat.sheetName, id); setSyncing(false); }
    catch (err) { setSyncing(false, err.message); }
  }
}

export function changeProgress(id, newVal) {
  const it = items.find((i) => i.id === id);
  if (!it) return;
  it.progress = Math.max(0, Math.min(it.total, newVal));
  if (it.total > 0 && it.progress >= it.total) it.status = "completado";
  render();
  _syncItem(it);
}

export function logSession(id, amount, note = "") {
  const it = items.find((i) => i.id === id);
  if (!it || !amount) return;
  if (!it.sessions) it.sessions = [];
  const prev   = it.progress;
  it.progress  = Math.max(0, Math.min(it.total || Infinity, it.progress + amount));
  if (it.total > 0 && it.progress >= it.total) it.status = "completado";
  const now    = new Date();
  const dateStr= now.toLocaleDateString("es", { day:"2-digit", month:"short", year:"numeric" }) + " " + now.toLocaleTimeString("es", { hour:"2-digit", minute:"2-digit" });
  it.sessions.push({ amount, note, date: dateStr, before: prev, after: it.progress });
  it.updatedAt = now.toISOString();
  render();
  _syncItem(it);
}

export async function _syncItem(it) {
  const cat = catById(it.catId);
  if (!cat) return;
  setSyncing(true);
  try {
    const row = itemToSheetRow(it, cat);
    await updateItem(cat.sheetName, it.id, row);
    setSyncing(false);
  } catch (err) {
    setSyncing(false, err.message);
  }
}
