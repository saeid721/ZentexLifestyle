const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA:  'userData',
  REMEMBER_ME: 'rememberMe',
};

// ─── Safe JSON parse (never throws) ─────────────────────────────
const safeParseJSON = (str) => {
  if (!str || str === 'undefined' || str === 'null') return null;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
};

// ─── Remember Me ────────────────────────────────────────────────
export const shouldRememberMe = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
};

export const setRememberMe = (value) => {
  if (typeof window === 'undefined') return;
  if (value) {
    localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
  } else {
    localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
  }
};

// ─── Set Auth ────────────────────────────────────────────────────
// rememberMe=true  → localStorage  (survives browser close)
// rememberMe=false → sessionStorage (cleared when tab closes)
export const setAuth = (token, userData, rememberMe = false) => {
  if (typeof window === 'undefined') return;

  setRememberMe(rememberMe);

  // Always clear both storages first to avoid stale data
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.USER_DATA);

  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  storage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
};

// ─── Get Auth ────────────────────────────────────────────────────
export const getAuth = () => {
  if (typeof window === 'undefined') {
    return { token: null, user: null, isAuthenticated: false };
  }

  const token =
    localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) ||
    sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) ||
    null;

  const rawUser =
    localStorage.getItem(STORAGE_KEYS.USER_DATA) ||
    sessionStorage.getItem(STORAGE_KEYS.USER_DATA) ||
    null;

  const user = safeParseJSON(rawUser);

  return {
    token,
    user,
    isAuthenticated: !!token,
  };
};

// ─── Remove Auth ────────────────────────────────────────────────
export const removeAuth = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
  sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.USER_DATA);
};

// ─── Get Token ──────────────────────────────────────────────────
export const getToken = () => {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) ||
    sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) ||
    null
  );
};

// ─── Get User Data ───────────────────────────────────────────────
export const getUserData = () => {
  if (typeof window === 'undefined') return null;
  const raw =
    localStorage.getItem(STORAGE_KEYS.USER_DATA) ||
    sessionStorage.getItem(STORAGE_KEYS.USER_DATA) ||
    null;
  return safeParseJSON(raw);
};