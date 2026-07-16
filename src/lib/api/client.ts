import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import type { ApiError, ApiResponse } from "@/types";
import { API_BASE_URL } from "@/config";
import { getMemToken, getMemRefresh, registerLogoutHandler } from "@/stores/auth";

/**
 * XPayments API client v2.
 * Uses in-memory token cache from auth store (no direct localStorage access).
 * 401 interceptor: single-flight session recovery, no loops.
 */

let sessionRecoveryRunning = false;

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Request interceptor: inject JWT
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getMemToken();
    if (token) config.headers.set("Authorization", `Bearer ${token}`);
    return config;
  },
  (err) => Promise.reject(err)
);

// Response interceptor: 401 → single-flight recovery
let isRefreshing = false;
let failedQueue: Array<{ config: AxiosRequestConfig; resolve: (v: unknown) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ config, resolve, reject }) => {
    if (error || !token) reject(error);
    else {
      (config.headers as Record<string, string>) = { ...(config.headers as Record<string, string>), Authorization: `Bearer ${token}` };
      resolve(api(config));
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const isAuthRoute = typeof original?.url === "string" &&
      (original.url.includes("auth/login") || original.url.includes("auth/register") ||
       original.url.includes("auth/refresh") || original.url.includes("auth/forgot") ||
       original.url.includes("auth/reset") || original.url.includes("auth/logout"));

    if (isAuthRoute) return Promise.reject(normalizeError(error));

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => { failedQueue.push({ config: original, resolve, reject }); });
      }
      const refreshToken = getMemRefresh();
      if (!refreshToken) {
        handleUnauthorized();
        return Promise.reject(normalizeError(error));
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post(`${API_BASE_URL}auth/refresh`, { refreshToken },
          { headers: { "Content-Type": "application/json" } });
        const newToken = data.data?.token ?? data.accessToken ?? data.token;
        if (!newToken || typeof newToken !== "string") throw new Error("Invalid refresh response");
        isRefreshing = false;
        processQueue(null, newToken);
        original.headers.set("Authorization", `Bearer ${newToken}`);
        return api(original);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);
        handleUnauthorized();
        return Promise.reject(normalizeError(error));
      }
    }
    return Promise.reject(normalizeError(error));
  }
);

/** Single-flight 401 handler — prevents loops */
function handleUnauthorized() {
  if (sessionRecoveryRunning) return;
  sessionRecoveryRunning = true;
  try {
    // Calls auth store clearSession via registerLogoutHandler
    // This clears auth storage but preserves preferences/locale/theme
    _onLogout?.("session_expired");
  } finally {
    setTimeout(() => { sessionRecoveryRunning = false; }, 1000);
  }
}

let _onLogout: ((reason?: string) => void) | null = null;
// Re-export for auth store to register
export { registerLogoutHandler };

function normalizeError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    if (err.code === "ECONNABORTED") return { message: "Request timed out.", code: err.code, status: 0 };
    if (err.code === "ERR_NETWORK") return { message: "Network error — could not reach the API.", code: err.code, status: 0 };
    const data = err.response?.data as { message?: string; error?: { code?: string; message?: string }; code?: string } | undefined;
    return { message: data?.error?.message || data?.message || err.message, code: data?.error?.code || data?.code, status: err.response?.status };
  }
  return { message: "Unexpected error", status: 500 };
}

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const res = await api(config);
  return res.data as T;
}

export async function requestData<T>(config: AxiosRequestConfig): Promise<T> {
  const res = await api(config);
  const envelope = res.data as ApiResponse<T>;
  if (envelope && typeof envelope === "object" && "success" in envelope) {
    if (!envelope.success) {
      throw { message: envelope.error?.message || envelope.message || "Request failed.", code: envelope.error?.code, status: res.status } as ApiError;
    }
    return envelope.data as T;
  }
  return res.data as T;
}
