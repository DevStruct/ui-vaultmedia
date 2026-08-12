// ════════════════════════════════════════════════════════════════════════
// SESSION — token de sesión (módulo hoja: sin imports de retorno,
// lo consumen api.js y auth.js sin circularidad)
// ════════════════════════════════════════════════════════════════════════
const KEY = "vault_token";

let token = (() => {
  try {
    return sessionStorage.getItem(KEY) || null;
  } catch {
    return null;
  }
})();

export function getToken() {
  return token;
}

export function setToken(t) {
  token = t || null;
  try {
    if (token) sessionStorage.setItem(KEY, token);
    else sessionStorage.removeItem(KEY);
  } catch {
    /* sin acceso a storage: la sesión vive en memoria */
  }
}