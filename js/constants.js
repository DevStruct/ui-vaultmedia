// ════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════
export const CAT_ICONS = [
  "movie", "menu_book", "live_tv", "science", "import_contacts",
  "sports_esports", "auto_stories", "music_note",
  "smart_display", "diamond",
];
export const ICON_LABELS = {
  movie: "Película",
  menu_book: "Libro",
  live_tv: "Serie / TV",
  science: "Documental",
  import_contacts: "Manga / Comic",
  sports_esports: "Videojuego",
  auto_stories: "Lectura",
  music_note: "Música",
  smart_display: "Streaming",
  diamond: "Especial",
};
export const CAT_COLORS = [
  "#5c9ee0", "#c98fd6", "#5cc98a", "#e0596a",
  "#4fc9c0", "#c9975c", "#8f9ce0", "#d67f4f",
];
export const STATUS_META = {
  pendiente:    { label: "PENDIENTE",  cls: "st-pending",  selCls: "sel-pending"  },
  "en progreso":{ label: "EN CURSO",   cls: "st-progress", selCls: "sel-progress" },
  completado:   { label: "COMPLETO",   cls: "st-done",     selCls: "sel-done"     },
  abandonado:   { label: "ABANDONADO", cls: "st-dropped",  selCls: "sel-dropped"  },
};

export const COL_TYPES = {
  text:   { label: "Texto",     badge: "type-text",   example: "Ejemplo de texto" },
  number: { label: "Número",    badge: "type-number",  example: "42"              },
  date:   { label: "Fecha",     badge: "type-date",    example: "2024-01-15"      },
  bool:   { label: "Sí / No",   badge: "type-bool",    example: "Sí"              },
  url:    { label: "URL",       badge: "type-url",     example: "https://..."     },
  select: { label: "Selección", badge: "type-select",  example: "Opción 1"       },
};

// ── Columnas preestablecidas por tipo de categoría ────────────────────────────
// Cada preset define qué columnas aparecen activadas por defecto.
// El usuario puede activar/desactivar cualquiera antes de crear la hoja.
export const PRESET_COLS = {
  pelicula: {
    label: "Película",
    cols: [
      { key: "genero",    label: "Género",          type: "text",   on: true  },
      { key: "duracion",  label: "Duración (min)",  type: "number", on: true  },
      { key: "año",       label: "Año",             type: "number", on: true  },
      { key: "pais",      label: "País",            type: "text",   on: false },
      { key: "idioma",    label: "Idioma",          type: "text",   on: false },
      { key: "saga",      label: "Saga / Franquicia",type:"text",   on: false },
    ],
  },
  libro: {
    label: "Libro",
    cols: [
      { key: "genero",    label: "Género",          type: "text",   on: true  },
      { key: "editorial", label: "Editorial",       type: "text",   on: true  },
      { key: "año",       label: "Año",             type: "number", on: true  },
      { key: "isbn",      label: "ISBN",            type: "text",   on: false },
      { key: "saga",      label: "Saga",            type: "text",   on: false },
      { key: "idioma",    label: "Idioma",          type: "text",   on: false },
    ],
  },
  serie: {
    label: "Serie",
    cols: [
      { key: "genero",      label: "Género",         type: "text",   on: true  },
      { key: "temporadas",  label: "Temporadas",     type: "number", on: true  },
      { key: "año_inicio",  label: "Año inicio",     type: "number", on: true  },
      { key: "año_fin",     label: "Año fin",        type: "number", on: false },
      { key: "pais",        label: "País",           type: "text",   on: false },
      { key: "creador",     label: "Creador",        type: "text",   on: false },
    ],
  },
  documental: {
    label: "Documental",
    cols: [
      { key: "tema",      label: "Tema",            type: "text",   on: true  },
      { key: "duracion",  label: "Duración (min)",  type: "number", on: true  },
      { key: "año",       label: "Año",             type: "number", on: true  },
      { key: "pais",      label: "País",            type: "text",   on: false },
      { key: "formato",   label: "Formato",         type: "text",   on: false },
    ],
  },
  manga: {
    label: "Manga / Comic",
    cols: [
      { key: "genero",    label: "Género",          type: "text",   on: true  },
      { key: "editorial", label: "Editorial",       type: "text",   on: true  },
      { key: "año",       label: "Año",             type: "number", on: true  },
      { key: "demografia",label: "Demografía",      type: "text",   on: false },
      { key: "serializado",label:"Serializado en",  type: "text",   on: false },
    ],
  },
  videojuego: {
    label: "Videojuego",
    cols: [
      { key: "genero",      label: "Género",          type: "text",   on: true  },
      { key: "plataforma",  label: "Plataforma",      type: "text",   on: true  },
      { key: "año",         label: "Año",             type: "number", on: true  },
      { key: "estudio",     label: "Estudio",         type: "text",   on: false },
      { key: "modo",        label: "Modo de juego",   type: "text",   on: false },
      { key: "horas",       label: "Horas estimadas", type: "number", on: false },
    ],
  },
  custom: {
    label: "Personalizado",
    cols: [],
  },
};

// Columnas base fijas (siempre incluidas, no se pueden desactivar)
export const BASE_COLS = [
  { key: "id",                label: "ID",                 type: "auto",   desc: "UUID auto-generado",               lock: true },
  { key: "titulo",            label: "Título",             type: "text",   desc: "Nombre del elemento",              lock: true },
  { key: "autor",             label: "Autor / Director",   type: "text",   desc: "Creador del contenido",            lock: true },
  { key: "estado",            label: "Estado",             type: "select", desc: "pendiente / en progreso / completado / abandonado", lock: true },
  { key: "progreso",          label: "Progreso",           type: "number", desc: "Unidad actual de avance",          lock: true },
  { key: "total",             label: "Total",              type: "number", desc: "Unidad máxima de avance",          lock: true },
  { key: "unidad",            label: "Unidad",             type: "text",   desc: "cap / pág / ep / min …",          lock: true },
  { key: "puntuacion",        label: "Puntuación",         type: "number", desc: "Valoración personal 1–10",         lock: true },
  { key: "fuentes",           label: "Fuentes",            type: "text",   desc: "Fuentes (nombre|url separadas por ;)", lock: true },
  { key: "notas",             label: "Notas",              type: "text",   desc: "Texto libre",                      lock: true },
  { key: "fecha_creacion",    label: "Fecha creación",     type: "date",   desc: "Fecha de registro",                lock: true },
  { key: "fecha_actualizacion",label:"Última actualización",type:"date",   desc: "Última modificación",              lock: true },
];

export const uid   = () => Math.random().toString(36).slice(2, 9);
export const pct   = (p, t) => (t > 0 ? Math.min(100, Math.round((p / t) * 100)) : 0);
export const slugify = (s) =>
  s.toLowerCase().trim()
   .replace(/[áàä]/g,"a").replace(/[éèë]/g,"e")
   .replace(/[íìï]/g,"i").replace(/[óòö]/g,"o")
   .replace(/[úùü]/g,"u").replace(/ñ/g,"n")
   .replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");

