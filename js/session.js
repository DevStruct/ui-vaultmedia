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

/** Decodifica payload JWT (base64url) sin verificar firma */
function parseJwtPayload(token) {
  try {
    const payload = token.split(".")[0];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

/** Retorna timestamp de expiración (ms) o null si inválido */
export function getTokenExp() {
  const tok = getToken();
  if (!tok) return null;
  const payload = parseJwtPayload(tok);
  return payload?.exp ?? null;
}

/** True si token existe y no ha expirado (con margen 30s) */
export function isTokenValid() {
  const exp = getTokenExp();
  if (!exp) return false;
  return Date.now() < exp - 30000;
}