import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import type { ApiError } from "@/types";
import { API_BASE_URL } from "@/config";

/**
 * XPayments centralized API client.
 *
 * - Axios instance whose baseURL inherits from NEXT_PUBLIC_API_URL (see config).
 * - Request interceptor injects `Authorization: Bearer <token>` on every
 *   protected request, reading the JWT from `tokenStore`.
 * - Response interceptor catches 401: attempts a single token refresh; if that
 *   fails it clears the session, notifies the auth store via `onLogout`, and
 *   lets React re-render to the unauthenticated landing state.
 * - `request<T>()` is a thin typed wrapper — real HTTP only, no mock fallback.
 */

const STORAGE = {
  access: "xp_access_token",
  refresh: "xp_refresh_token",
  user: "xp_user",
};

/**
 * Low-level localStorage-backed token store (source of truth for the
 * interceptor). All reads are defensive: if the stored value is missing or not
 * valid JSON, the getter returns null and clears the corrupt entry instead of
 * throwing — a throw here would crash the entire client bundle at module load.
 */
export const tokenStore = {
  get access() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE.access);
  },
  get refresh() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE.refresh);
  },
  get user() {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(STORAGE.user);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      localStorage.removeItem(STORAGE.user);
      return null;
    }
  },
  set(access: string, refresh: string, user: unknown) {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE.access, access);
    localStorage.setItem(STORAGE.refresh, refresh);
    localStorage.setItem(STORAGE.user, JSON.stringify(user ?? null));
  },
  clear() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE.access);
    localStorage.removeItem(STORAGE.refresh);
    localStorage.removeItem(STORAGE.user);
  },
};

let isRefreshing = false;
let onLogout: (() => void) | null = null;
export function registerLogoutHandler(fn: () => void) {
  onLogout = fn;
}

/** Clear the session and reset auth state (no hard redirect). */
function forceLogout() {
  tokenStore.clear();
  onLogout?.();
}

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// ---- Request interceptor: inject JWT Bearer token ----
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

// ---- Response interceptor: 401 → refresh once, else force logout ----
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Auth routes are public — a 401 there means bad credentials. Propagate.
    const isAuthRoute =
      typeof original?.url === "string" &&
      (original.url.includes("auth/login") ||
        original.url.includes("auth/register") ||
        original.url.includes("auth/refresh") ||
        original.url.includes("auth/forgot") ||
        original.url.includes("auth/reset"));

    if (isAuthRoute) {
      return Promise.reject(normalizeError(error));
    }

    // Protected route: 401 → attempt a single token refresh.
    if (error.response?.status === 401 && !original._retry && tokenStore.refresh) {
      original._retry = true;
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const { data } = await axios.post(
            `${API_BASE_URL}auth/refresh`,
            { refreshToken: tokenStore.refresh },
            { headers: { "Content-Type": "application/json" } }
          );
          tokenStore.set(
            data.accessToken,
            data.refreshToken ?? tokenStore.refresh,
            data.user ?? tokenStore.user
          );
          isRefreshing = false;
          original.headers.set("Authorization", `Bearer ${data.accessToken}`);
          return api(original);
        } catch {
          isRefreshing = false;
          forceLogout();
          return Promise.reject(normalizeError(error));
        }
      }
    }

    // Any other 401 on a protected route → force logout.
    if (error.response?.status === 401 && !original._retry) {
      forceLogout();
    }

    return Promise.reject(normalizeError(error));
  }
);

function normalizeError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    if (err.code === "ECONNABORTED") {
      return { message: "Request timed out — the server took too long to respond.", code: err.code, status: 0 };
    }
    if (err.code === "ERR_NETWORK") {
      return { message: "Network error — could not reach the API.", code: err.code, status: 0 };
    }
    const data = err.response?.data as
      | { message?: string; error?: string; code?: string; details?: unknown }
      | undefined;
    return {
      message: data?.message || data?.error || err.message,
      code: data?.code,
      status: err.response?.status,
      details: data?.details as Record<string, unknown> | undefined,
    };
  }
  return { message: "Unexpected error", status: 500 };
}

/**
 * Typed request wrapper. Performs a real HTTP request via the configured Axios
 * instance and returns the response payload. Errors are normalized by the
 * response interceptor and rethrown as `ApiError`.
 */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const res = await api(config);
  return res.data as T;
}

export { STORAGE };
