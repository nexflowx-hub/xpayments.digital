/**
 * XPayments — Centralized Storage Module
 *
 * All storage keys, versioning, migration and cleanup logic lives here.
 * No other file in the project should reference localStorage directly.
 */

export const XP_STORAGE_KEYS = {
  auth: "xp-auth-v2",
  preferences: "xp-preferences-v1",
  workspace: "xp-workspace-v1",
  appVersion: "xp-app-version",
} as const;

export const LEGACY_STORAGE_KEYS = [
  "xp-auth",
  "xp-local",
  "xpayments-auth",
  "auth-storage",
  "xp-store",
  "xp_access_token",
  "xp_refresh_token",
  "xp_user",
] as const;

export const APP_STORAGE_VERSION = "2026.07.15.2";

/** Remove all legacy auth-related keys. Does NOT touch preferences. */
export function removeLegacyAuthStorage(): void {
  if (typeof window === "undefined") return;
  for (const key of LEGACY_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }
}

/** Clear ONLY authentication storage (xp-auth-v2 + legacy). Preserves preferences, locale, theme. */
export function clearAuthenticationStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(XP_STORAGE_KEYS.auth);
  removeLegacyAuthStorage();
}

/** Save a preference value (theme, locale, etc). */
export function setPreference(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(XP_STORAGE_KEYS.preferences);
    const prefs = raw ? JSON.parse(raw) : {};
    prefs[key] = value;
    localStorage.setItem(XP_STORAGE_KEYS.preferences, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

/** Read a preference value. */
export function getPreference<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(XP_STORAGE_KEYS.preferences);
    const prefs = raw ? JSON.parse(raw) : {};
    return (prefs[key] as T) ?? fallback;
  } catch {
    return fallback;
  }
}

/** Workspace storage */
export function getWorkspaceStoreId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(XP_STORAGE_KEYS.workspace);
    return raw ? JSON.parse(raw)?.storeId ?? null : null;
  } catch {
    return null;
  }
}

export function setWorkspaceStoreId(storeId: string | null): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(XP_STORAGE_KEYS.workspace, JSON.stringify({ storeId }));
}

/**
 * One-time migration: runs on app bootstrap.
 * - Checks app version; if changed, clears auth storage (forces re-login)
 * - Removes legacy keys
 * - Does NOT touch preferences, locale, or theme
 */
export function migrateClientStorage(): void {
  if (typeof window === "undefined") return;
  const currentVersion = localStorage.getItem(XP_STORAGE_KEYS.appVersion);
  if (currentVersion !== APP_STORAGE_VERSION) {
    // Version changed — clear auth only, preserve everything else
    clearAuthenticationStorage();
    localStorage.setItem(XP_STORAGE_KEYS.appVersion, APP_STORAGE_VERSION);
  }
  // Always clean legacy keys (in case they were left from a previous session)
  removeLegacyAuthStorage();
}
