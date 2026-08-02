import { fetchAllCategories } from "./api.js";
import { CAT_ICONS, CAT_COLORS, BASE_COLS, uid, slugify } from "./constants.js";
import { cats, items, setCats, setItems, setSyncing } from "./state.js";
import { render } from "./render/index.js";
// ════════════════════════════════════════════════════════════════════════
// INITIAL LOAD — trae todo desde Google Sheets
// ════════════════════════════════════════════════════════════════════════
export async function loadAll() {
  setSyncing(true);
  try {
    const categorias = await fetchAllCategories();

    if (!Array.isArray(categorias)) {
      throw new Error("La respuesta no contiene un array de categorías. Respuesta: " + JSON.stringify(categorias));
    }

    // Mapear respuesta de AppScript → formato interno
    // Mapear por índice: evita que el match por sheetName falle si Google Sheets
    // trunca o escapa los caracteres especiales del nombre (||, iconos, colores).
    setCats(categorias.map(mapSheetCat));
    setItems(categorias.flatMap((sheetCat, i) => mapSheetItemsById(sheetCat, cats[i])));

    setSyncing(false);
  } catch (err) {
    setSyncing(false, err.message);
    console.error("[loadAll] ERROR:", err);
  }
  render();
}

// ── Mappers: formato AppScript → formato interno ──────────────────────────────

/**
 * Convierte una categoría devuelta por doGetAll en el objeto interno { id, name, icon, color, columns }
 */
export function mapSheetCat(sheetCat) {
  // Si la hoja fue creada por esta app, el nombre puede codificar icono y color
  // con el separador "||". Ej: "Películas||◈||#4dc8ff"
  // Si es una hoja simple, usa defaults.
  const parts = sheetCat.categoria.split("||");
  const name  = parts[0].trim();
  const icon  = parts[1]?.trim() || CAT_ICONS[0];
  const color = parts[2]?.trim() || CAT_COLORS[0];

  // Derivar columnas personalizadas comparando con BASE_COLS
  const baseKeys  = new Set(BASE_COLS.map((c) => c.key));
  const extraCols = (sheetCat.headers || [])
    .filter((h) => !baseKeys.has(slugify(h)))
    .map((h) => ({
      id:       uid(),
      key:      slugify(h),
      label:    h,
      type:     "text",
      required: false,
    }));

  return { id: uid(), name, icon, color, columns: extraCols, sheetName: sheetCat.categoria };
}

/**
 * Convierte las filas de datos de una categoría en ítems internos.
 */
export function mapSheetItems(sheetCat, mappedCats) {
  const cat = mappedCats.find((c) => c.sheetName === sheetCat.categoria);
  if (!cat) return [];

  // Filtrar filas completamente vacías que Sheets puede devolver
  const datosValidos = (sheetCat.datos || []).filter((row) => {
    const vals = Object.values(row);
    return vals.some((v) => v !== "" && v !== null && v !== undefined);
  });

  return datosValidos.map((row) => {
    // AppScript puede devolver keys como label ("Título") o como slug ("titulo").
    // get() prueba ambas variantes y también convierte a string para evitar
    // que Date objects o números rompan el render.
    const get = (slug, label) => {
      const v = row[slug] ?? row[label] ?? row[slugify(label)] ?? "";
      return v === null || v === undefined ? "" : String(v);
    };

    return {
      id:         get("id",                 "ID")                  || uid(),
      catId:      cat.id,
      title:      get("titulo",             "Título"),
      author:     get("autor",              "Autor / Director"),
      status:     get("estado",             "Estado")              || "pendiente",
      progress:   Number(get("progreso",    "Progreso"))           || 0,
      total:      Number(get("total",       "Total"))              || 0,
      unit:       get("unidad",             "Unidad")              || "cap",
      step:       1,
      score:      Number(get("puntuacion",  "Puntuación"))         || 0,
      notes:      get("notas",              "Notas"),
      sources:    parseSources(get("fuentes", "Fuentes")),
      customData: buildCustomData(cat, row),
      sessions:   [],
      createdAt:  get("fecha_creacion",     "Fecha creación")      || new Date().toISOString(),
      updatedAt:  get("fecha_actualizacion","Última actualización") || new Date().toISOString(),
    };
  });
}

/**
 * Versión simplificada de mapSheetItems que recibe la cat ya resuelta
 * (sin necesidad de buscarla por sheetName, evitando problemas con
 * nombres de hoja que contienen caracteres especiales).
 */
export function mapSheetItemsById(sheetCat, cat) {
  if (!cat) { console.warn("[mapSheetItemsById] cat es null para:", sheetCat.categoria); return []; }

  const todosLosDatos = sheetCat.datos || [];

  const datosValidos = todosLosDatos.filter((row) => {
    const vals = Object.values(row);
    return vals.some((v) => v !== "" && v !== null && v !== undefined);
  });

  const result = datosValidos.map((row) => {
    const get = (slug, label) => {
      const v = row[slug] ?? row[label] ?? row[slugify(label)] ?? "";
      return v === null || v === undefined ? "" : String(v);
    };

    const item = {
      id:         get("id",                 "ID")                  || uid(),
      catId:      cat.id,
      title:      get("titulo",             "Título"),
      author:     get("autor",              "Autor / Director"),
      status:     get("estado",             "Estado")              || "pendiente",
      progress:   Number(get("progreso",    "Progreso"))           || 0,
      total:      Number(get("total",       "Total"))              || 0,
      unit:       get("unidad",             "Unidad")              || "cap",
      step:       1,
      score:      Number(get("puntuacion",  "Puntuación"))         || 0,
      notes:      get("notas",              "Notas"),
      sources:    parseSources(get("fuentes", "Fuentes")),
      customData: buildCustomData(cat, row),
      sessions:   [],
      createdAt:  get("fecha_creacion",     "Fecha creación")      || new Date().toISOString(),
      updatedAt:  get("fecha_actualizacion","Última actualización") || new Date().toISOString(),
    };
    return item;
  });
  return result;
}

export function parseSources(raw) {
  if (!raw) return [];
  return raw.split(";").map((s) => {
    const [name, url = ""] = s.split("|");
    return { id: uid(), name: name?.trim(), url: url?.trim() };
  }).filter((s) => s.name);
}

export function buildCustomData(cat, row) {
  const data = {};
  (cat.columns || []).forEach((col) => {
    data[col.key] = row[col.label] ?? row[col.key] ?? "";
  });
  return data;
}

/**
 * Serializa fuentes al formato de la hoja: "Nombre|url;Nombre2|url2"
 */
export function serializeSources(sources) {
  return (sources || [])
    .filter((s) => s.name?.trim())
    .map((s) => `${s.name}${s.url ? `|${s.url}` : ""}`)
    .join(";");
}

/**
 * Convierte un ítem interno en el objeto plano que espera el proxy/AppScript.
 */
export function itemToSheetRow(it, cat) {
  const row = {
    id:                  it.id,
    titulo:              it.title,
    autor:               it.author,
    estado:              it.status,
    progreso:            it.progress,
    total:               it.total,
    unidad:              it.unit,
    puntuacion:          it.score,
    fuentes:             serializeSources(it.sources),
    notas:               it.notes,
    fecha_creacion:      it.createdAt,
    fecha_actualizacion: it.updatedAt,
  };
  // Columnas personalizadas
  (cat?.columns || []).forEach((col) => {
    row[col.label] = it.customData?.[col.key] ?? "";
  });
  return row;
}
