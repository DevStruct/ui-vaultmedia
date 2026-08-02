// ════════════════════════════════════════════════════════════════════════
// ENTRY — arranca la app (módulos con binds de top-level vía imports de efecto)
// ════════════════════════════════════════════════════════════════════════
import "./state.js";
import "./clock.js";
import "./events.js";
import "./modals/index.js";
import "./modals/cat.js";
import "./modals/del-cat.js";
import "./modals/item.js";
import { loadAll } from "./data.js";

loadAll();
