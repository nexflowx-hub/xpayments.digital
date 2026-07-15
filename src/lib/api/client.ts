import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import type { ApiError, ApiResponse } from "@/types";
import { API_BASE_URL } from "@/config";

/**
 * XPayments centralized API client — v2 storage architecture.
 *
 * Storage keys (v2):
 *   xp-auth-v2     → { accessToken, refreshToken, user, authenticated }  (auth only)
 *   xp-locale       → { locale }  (preferences — never cleared on logout)
 *   xp-app-version  → frontend version string (triggers migration on change)
 *
 * Legacy keys (auto-cleaned on bootstrap):
 *   xp-auth, xp_access_token, xp_refresh_token, xp_user
 *
 * tokenStore is the low-level accessor for the interceptor. It reads from
 * the same xp-auth-v2 key that the Zustand persist middleware writes to,
 * via a shared in-memory cache that stays in sync.
 */

// ---- Shared in-memory auth state (synced with Zustand persist) ----
let _accessToken: string | null = null;
let _refreshToken: string | null = null;
let _user: unknown = null;

export function syncAuthState(access: string | null, refresh: string | null, user: unknown) {
  _accessToken = access;
  _refreshToken = refresh;
  _user = user;
}

export function clearAuthState() {
  _accessToken = null;
  _refreshToken = null;
  _user = null;
}

/** Low-level token access for the Axios interceptor. */
export const tokenStore = {
  get access() { return _accessToken; },
  get refresh() { return _refreshToken; },
  get user() { return _user; },
  set(access: string, refresh: string, user: unknown) {
    syncAuthState(access, refresh, user);
  },
  clear() {
    clearAuthState();
  },
};

// ---- Legacy key cleanup (runs once on bootstrap) ----
const LEGACY_KEYS = [
  "xp-auth",           // old Zustand persist key
  "xp_access_token",   // old raw token key
  "xp_refresh_token",  // old raw refresh key
  "xp_user",           // old raw user JSON
  "xp-local",          // old locale key
  "xpayments-auth",
  "auth-storage",
];

const AUTH_STORAGE_KEY = "xp-auth-v2";
const APP_VERSION_KEY = "xp-app-version";
export const APP_STORAGE_VERSION = "2026.07.15.1";

export function cleanupLegacyStorage() {
  if (typeof window === "undefined") return;
  for (const key of LEGACY_KEYS) {
    localStorage.removeItem(key);
  }
  // Check app version — if changed, only clean auth (preserve preferences)
  const storedVersion = localStorage.getItem(APP_VERSION_KEY);
  if (storedVersion && storedVersion !== APP_STORAGE_VERSION) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.setItem(APP_VERSION_KEY, APP_STORAGE_VERSION);
  } else if (!storedVersion) {
    localStorage.setItem(APP_VERSION_KEY, APP_STORAGE_VERSION);
  }
}

/** Bootstrap: load auth from xp-auth-v2 into in-memory cache. */
export function bootstrapAuthStorage() {
  if (typeof window === "undefined") return;
  cleanupLegacyStorage();
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const state = parsed?.state ?? parsed;
    if (state?.accessToken) _accessToken = state.accessToken;
    if (state?.refreshToken) _refreshToken = state.refreshToken;
    if (state?.user) _user = state.user;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

// ---- Logout handler (called by interceptor on 401) ----
let onLogout: ((reason?: string) => void) | null = null;
export function registerLogoutHandler(fn: (reason?: string) => void) {
  onLogout = fn;
}

let isRefreshing = false;
let failedQueue: Array<{
  config: AxiosRequestConfig;
  resolve: (v: unknown) => void;
  reject: (e: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ config, resolve, reject }) => {
    if (error || !token) {
      reject(error);
    } else {
      (config.headers as Record<string, string>) = {
        ...(config.headers as Record<string, string>),
        Authorization: `Bearer ${token}`,
      };
      resolve(api(config));
    }
  });
  failedQueue = [];
}

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// ---- Request interceptor: inject JWT ----
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStore.access;
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
    return config;
  },
  (err) => Promise.reject(err)
);

// ---- Response interceptor: 401 → refresh once, else graceful logout ----
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Auth routes are public — propagate 401 (bad credentials)
    const isAuthRoute =
      typeof original?.url === "string" &&
      (original.url.includes("auth/login") ||
        original.url.includes("auth/register") ||
        original.url.includes("auth/refresh") ||
        original.url.includes("auth/forgot") ||
        original.url.includes("auth/reset") ||
        original.url.includes("auth/logout"));

    if (isAuthRoute) {
      return Promise.reject(normalizeError(error));
    }

    // Protected route: 401 → attempt single refresh
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        // Queue this request — will be retried after refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ config: original, resolve, reject });
        });
      }

      if (!tokenStore.refresh) {
        // No refresh token — graceful logout (preserves preferences)
        onLogout?.("session_expired");
        return Promise.reject(normalizeError(error));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${API_BASE_URL}auth/refresh`,
          { refreshToken: tokenStore.refresh },
          { headers: { "Content-Type": "application/json" } }
        );
        const newToken = data.data?.token ?? data.accessToken ?? data.token;
        if (!newToken || typeof newToken !== "string") {
          throw new Error("Invalid refresh response");
        }
        // Update in-memory + persisted state
        syncAuthState(newToken, tokenStore.refresh ?? "", tokenStore.user);
        // Also update localStorage directly (Zustand persist will sync on next state change)
        try {
          const raw = localStorage.getItem(AUTH_STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.state) {
              parsed.state.accessToken = newToken;
              localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed));
            }
          }
        } catch {}
        isRefreshing = false;
        processQueue(null, newToken);
        original.headers.set("Authorization", `Bearer ${newToken}`);
        return api(original);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);
        // Graceful logout — only clears auth, preserves locale/theme
        onLogout?.("session_expired");
        return Promise.reject(normalizeError(error));
      }
    }

    return Promise.reject(normalizeError(error));
  }
);

function normalizeError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    if (err.code === "ECONNABORTED") {
      return { message: "Request timed out.", code: err.code, status: 0 };
    }
    if (err.code === "ERR_NETWORK") {
      return { message: "Network error — could not reach the API.", code: err.code, status: 0 };
    }
    const data = err.response?.data as
      | { message?: string; error?: { code?: string; message?: string }; code?: string }
      | undefined;
    return {
      message: data?.error?.message || data?.message || err.message,
      code: data?.error?.code || data?.code,
      status: err.response?.status,
    };
  }
  return { message: "Unexpected error", status: 500 };
}

// ---- Typed request wrappers ----

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const res = await api(config);
  return res.data as T;
}

export async function requestData<T>(config: AxiosRequestConfig): Promise<T> {
  const res = await api(config);
  const envelope = res.data as ApiResponse<T>;
  if (envelope && typeof envelope === "object" && "success" in envelope) {
    if (!envelope.success) {
      const errMsg = envelope.error?.message || envelope.message || "Request failed.";
      const errCode = envelope.error?.code;
      throw { message: errMsg, code: errCode, status: res.status } as ApiError;
    }
    return envelope.data as T;
  }
  return res.data as T;
}

export { AUTH_STORAGE_KEY };
