import { $ } from "../helpers.js";
import { cats, items, state, setCats, setItems } from "../state.js";
import { openModal, closeModal } from "./index.js";
import { render } from "../render/index.js";
// ════════════════════════════════════════════════════════════════════════
// DELETE CATEGORY MODAL
// ════════════════════════════════════════════════════════════════════════
export let delCatTarget = null;
export function openDelCatModal(cat) {
  delCatTarget = cat;
  const cnt = items.filter((i) => i.catId === cat.id).length;
  $("del-cat-msg").innerHTML = `Eliminarás la categoría <strong>${cat.name}</strong> y sus ${cnt} elemento${cnt!==1?"s":""}.<br><br><span class="danger-text">Esta acción no se puede deshacer.</span>`;
  openModal("modal-del-cat");
}
$("btn-confirm-del-cat").addEventListener("click", () => {
  if (!delCatTarget) return;
  const id = delCatTarget.id;
  setCats(cats.filter((c)  => c.id !== id));
  setItems(items.filter((i) => i.catId !== id));
  if (state.selCat  === id) state.selCat  = "__all__";
  if (state.selItem && !items.find((i) => i.id === state.selItem)) state.selItem = null;
  delCatTarget = null;
  closeModal("modal-del-cat");
  render();
  // Nota: eliminar la hoja en Sheets se implementará en el proxy
});
