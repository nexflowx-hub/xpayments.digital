import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import type { ApiError, ApiResponse } from "@/types";
import { API_BASE_URL } from "@/config";

/**
 * XPayments centralized API client.
 *
 * - `request<T>()` — raw HTTP, returns `res.data` as-is (used by auth which has
 *   its own envelope mapping).
 * - `requestData<T>()` — unwraps the standard `{ success, data, message? }`
 *   envelope and returns `.data` directly. If `success === false` it throws an
 *   `ApiError`. If `.data` is null/undefined it returns `null` (callers must
 *   guard with `?? []` or `?.`).
 * - Request interceptor injects `Authorization: Bearer <token>`.
 * - Response interceptor handles 401 with a **request queue** (concurrent
 *   requests during refresh are queued, not dropped).
 */

const STORAGE = {
  access: "xp_access_token",
  refresh: "xp_refresh_token",
  user: "xp_user",
};

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

// ---- 401 refresh with request queue (fixes concurrent-401 bug) ----
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

let onLogout: (() => void) | null = null;
export function registerLogoutHandler(fn: () => void) {
  onLogout = fn;
}

function forceLogout() {
  tokenStore.clear();
  onLogout?.();
}

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  // Do NOT set Content-Type globally — let axios set it per-request based on
  // the data type. Setting it globally can trigger CORS preflight on every
  // request because it becomes a non-simple header.
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

// ---- Response interceptor: 401 → refresh with queue, else force logout ----
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

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

    // Protected route: 401 → refresh once, queue concurrent requests
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        // Queue this request — it will be retried after the refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ config: original, resolve, reject });
        });
      }

      if (!tokenStore.refresh) {
        forceLogout();
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
        tokenStore.set(
          newToken,
          data.refreshToken ?? tokenStore.refresh,
          data.user ?? data.data?.user ?? tokenStore.user
        );
        isRefreshing = false;
        processQueue(null, newToken);
        original.headers.set("Authorization", `Bearer ${newToken}`);
        return api(original);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);
        forceLogout();
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
      | { message?: string; error?: string; code?: string; details?: unknown }
      | undefined;
    return {
      message: data?.message || data?.error || err.message,
      code: data?.code,
      status: err.response?.status,
    };
  }
  return { message: "Unexpected error", status: 500 };
}

/**
 * Raw request — returns `res.data` as-is. Used by auth endpoints that have
 * their own envelope mapping (`mapEnvelopeToSession`).
 */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const res = await api(config);
  return res.data as T;
}

/**
 * Envelope-unwrapping request. Assumes the backend returns (API Contract v3.1):
 *   { success: true,  data: T, meta?: {} }
 *   { success: false, error: { code: "ERROR_CODE", message: "..." } }
 *
 * Returns `envelope.data` directly. If `success === false`, throws an `ApiError`
 * with the error code and message. If `envelope.data` is null/undefined,
 * returns null — callers MUST guard with `?? []` or optional chaining.
 */
export async function requestData<T>(config: AxiosRequestConfig): Promise<T> {
  const res = await api(config);
  const envelope = res.data as ApiResponse<T>;

  // Handle envelope responses
  if (envelope && typeof envelope === "object" && "success" in envelope) {
    if (!envelope.success) {
      const errMsg = envelope.error?.message || envelope.message || "Request failed.";
      const errCode = envelope.error?.code;
      throw { message: errMsg, code: errCode, status: res.status } as ApiError;
    }
    return envelope.data as T;
  }

  // No envelope — return raw data (backwards compatible)
  return res.data as T;
}

export { STORAGE };
