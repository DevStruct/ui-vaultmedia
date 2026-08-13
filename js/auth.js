// ════════════════════════════════════════════════════════════════════════
// AUTH — flujo de login OTP (clave + código de Google Authenticator)
// Pantalla de acceso, llamado a POST /auth y cierre de sesión.
// ════════════════════════════════════════════════════════════════════════
import { $ } from "./helpers.js";
import { PROXY_BASE_URL } from "./api.js";
import { getToken, setToken } from "./session.js";

let onSuccess = null;

function showLogin() {
  setToken(null);
  const btn = $("btn-logout");
  if (btn) btn.hidden = true;
  const overlay = $("login-overlay");
  if (!overlay) return;
  overlay.classList.add("open");
  const pass = $("login-pass");
  if (pass) pass.focus();
}

function hideLogin() {
  const overlay = $("login-overlay");
  if (overlay) overlay.classList.remove("open");
  const btn = $("btn-logout");
  if (btn) btn.hidden = false;
}

function setError(msg) {
  const el = $("login-error");
  if (!el) return;
  el.textContent = msg;
  el.hidden = !msg;
}

async function doLogin() {
  const pass = $("login-pass")?.value ?? "";
  const otp = $("login-otp")?.value.trim() ?? "";
  setError("");

  if (!pass) return setError("Ingresá tu clave.");
  if (!/^\d{6}$/.test(otp)) return setError("El código debe tener 6 dígitos.");

  try {
    const res = await fetch(`${PROXY_BASE_URL}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pass, otp }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      setError(data.error || `HTTP ${res.status}`);
      return;
    }
    setToken(data.token);
    if ($("login-pass")) $("login-pass").value = "";
    if ($("login-otp")) $("login-otp").value = "";
    hideLogin();
    if (onSuccess) onSuccess();
  } catch (e) {
    setError(e.message || "Error de red");
  }
}

async function doLogout() {
  const token = getToken();
  if (token) {
    try {
      await fetch(`${PROXY_BASE_URL}/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      /* best-effort: el logout local no debe fallar por red */
    }
  }
  showLogin();
}

/**
 * Conecta la UI de login. `onSuccess` se ejecuta tras un login válido.
 */
export function initAuth(onSuccessCb) {
  onSuccess = onSuccessCb;
  const btn = $("btn-login");
  if (btn) btn.addEventListener("click", doLogin);
  for (const id of ["login-pass", "login-otp"]) {
    const el = $(id);
    if (el) el.addEventListener("keydown", (e) => { if (e.key === "Enter") doLogin(); });
  }
  const logoutBtn = $("btn-logout");
  if (logoutBtn) logoutBtn.addEventListener("click", doLogout);
}

/**
 * Si hay sesión activa revela el botón "Salir" y devuelve true;
 * si no, muestra la pantalla de login y devuelve false.
 */
export function ensureAuthed() {
  if (getToken()) {
    const btn = $("btn-logout");
    if (btn) btn.hidden = false;
    return true;
  }
  showLogin();
  return false;
}

/**
 * Fuerza el re-login: limpia el token y muestra la pantalla de acceso.
 * Se enlaza como handler de 401 (sesión expirada o perdida tras reinicio).
 */
export function forceLogin() {
  showLogin();
}