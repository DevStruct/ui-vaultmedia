"use strict";
// ════════════════════════════════════════════════════════════════════════
// API — Capa de comunicación con el proxy
// Todas las operaciones con Google Sheets pasan por aquí.
// Cuando el proxy esté listo, solo cambia PROXY_BASE_URL.
// ════════════════════════════════════════════════════════════════════════

const PROXY_BASE_URL = "https://proxy-vaultmedia.onrender.com";

// ── Utilidad interna ─────────────────────────────────────────────────────────
async function _request(method, path, body = null) {
  const opts = {
    method,
    credentials: "include", // ← necesario para Basic Auth cross-origin:
    //   hace que el navegador envíe el header
    //   Authorization en cada petición
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${PROXY_BASE_URL}${path}`, opts);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Error desconocido");
  return data;
}

// ── Categorías ────────────────────────────────────────────────────────────────

/**
 * Trae todas las categorías con sus datos desde Google Sheets.
 * @returns {Promise<Array>} categorias[]
 */
export async function fetchAllCategories() {
  const data = await _request("GET", "/categorias");
  return data.categorias; // [{ categoria, headers, datos }]
}

/**
 * Trae una categoría específica (recarga parcial).
 * @param {string} categoryName
 * @returns {Promise<Object>} { categoria, headers, datos }
 */
export async function fetchCategory(categoryName) {
  const data = await _request(
    "GET",
    `/categorias?categoria=${encodeURIComponent(categoryName)}`
  );
  return data; // { categoria, headers, datos }
}

/**
 * Crea una nueva hoja/categoría en Google Sheets.
 * @param {string} categoryName
 * @param {string[]} headers  — array de strings con los nombres de columna
 * @returns {Promise<Object>} { success, message }
 */
export async function createCategory(categoryName, headers) {
  return _request("POST", "/categorias", { categoryName, headers });
}

// ── Items ─────────────────────────────────────────────────────────────────────

/**
 * Inserta un nuevo ítem en la hoja correspondiente.
 * @param {string} categoryName
 * @param {Object} itemData  — objeto con los campos del ítem
 * @returns {Promise<Object>} { success, id }
 */
export async function insertItem(categoryName, itemData) {
  return _request("POST", "/items", { categoryName, ...itemData });
}

/**
 * Actualiza un ítem existente por su ID.
 * @param {string} categoryName
 * @param {string} itemId
 * @param {Object} itemData
 * @returns {Promise<Object>}
 */
export async function updateItem(categoryName, itemId, itemData) {
  return _request("PUT", `/items/${itemId}`, { categoryName, ...itemData });
}

/**
 * Elimina un ítem por su ID.
 * @param {string} categoryName
 * @param {string} itemId
 * @returns {Promise<Object>}
 */
export async function deleteItemRemote(categoryName, itemId) {
  return _request("DELETE", `/items/${itemId}`, { categoryName });
}