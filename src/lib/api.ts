/**
 * JWT Token & Cookie Storage Management
 * Supports "Remember Me" with 1-month (30-day) cookie persistence.
 */
const TOKEN_STORAGE_KEY = "unlupa_jwt_token";
const TOKEN_COOKIE_NAME = "unlupa_token";
const REMEMBER_COOKIE_NAME = "unlupa_remember_me";
export const ONE_MONTH_SECONDS = 30 * 24 * 60 * 60; // 30 days = 2,592,000s

let inMemoryJwtToken: string | null = null;

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)"),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function setCookie(name: string, value: string, maxAgeSeconds?: number) {
  if (typeof document === "undefined") return;
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  const secureFlag = isSecure ? "; Secure" : "";
  const maxAgeFlag = typeof maxAgeSeconds === "number" ? `; max-age=${maxAgeSeconds}` : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Lax${maxAgeFlag}${secureFlag}`;
}

export function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  const secureFlag = isSecure ? "; Secure" : "";
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax${secureFlag}`;
}

export function setAuthToken(token: string | null, rememberMe: boolean = true) {
  inMemoryJwtToken = token;
  if (token) {
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      if (rememberMe) {
        localStorage.setItem(REMEMBER_COOKIE_NAME, "true");
        setCookie(TOKEN_COOKIE_NAME, token, ONE_MONTH_SECONDS);
        setCookie(REMEMBER_COOKIE_NAME, "true", ONE_MONTH_SECONDS);
      } else {
        localStorage.removeItem(REMEMBER_COOKIE_NAME);
        setCookie(TOKEN_COOKIE_NAME, token); // Session cookie (cleared when browser session ends)
        deleteCookie(REMEMBER_COOKIE_NAME);
      }
    } catch {}
  } else {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(REMEMBER_COOKIE_NAME);
    } catch {}
    deleteCookie(TOKEN_COOKIE_NAME);
    deleteCookie(REMEMBER_COOKIE_NAME);
  }
}

export function getAuthToken(): string | null {
  if (inMemoryJwtToken) return inMemoryJwtToken;

  // 1. Check cookie first (ensures cross-tab / 30-day persistence)
  const cookieToken = getCookie(TOKEN_COOKIE_NAME);
  if (cookieToken) {
    inMemoryJwtToken = cookieToken;
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, cookieToken);
    } catch {}
    return cookieToken;
  }

  // 2. Fallback to localStorage
  try {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored) {
      inMemoryJwtToken = stored;
      // Resynchronize cookie with 30-day expiration if remember-me was active
      const rememberMe = localStorage.getItem(REMEMBER_COOKIE_NAME) !== "false";
      if (rememberMe) {
        setCookie(TOKEN_COOKIE_NAME, stored, ONE_MONTH_SECONDS);
      } else {
        setCookie(TOKEN_COOKIE_NAME, stored);
      }
      return stored;
    }
  } catch {}

  return null;
}

export function clearAuthToken() {
  setAuthToken(null);
}

/**
 * Custom API Error class with detailed status code and error classification
 */
export class ApiError extends Error {
  public status: number;
  public code: string;
  public data?: unknown;

  constructor(
    message: string,
    status: number,
    code: string = "API_ERROR",
    data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.data = data;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isNetworkError(): boolean {
    return (
      this.status === 0 && this.code !== "TIMEOUT" && this.code !== "ABORTED"
    );
  }

  get isTimeout(): boolean {
    return this.code === "TIMEOUT";
  }

  get isAborted(): boolean {
    return this.code === "ABORTED";
  }

  get isValidationError(): boolean {
    return this.status === 422 || this.status === 400;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  timeoutMs?: number;
  skipAuth?: boolean;
}

export interface BackendUserResponse {
  id: string;
  firebaseUid?: string | null;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  quranSpaceCode: string;
  role: "USER" | "ADMIN" | "SUPERADMIN";
  plan: "FREE" | "PREMIUM" | "INSTITUTIONAL";
  onboardingPreferences?: any | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    const defaultUrl = (import.meta as any).env?.VITE_API_BASE_URL ?? "";
    this.baseUrl = (baseUrl ?? defaultUrl).replace(/\/$/, "");
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Generic request method handling JSON serialization, JWT auth headers, timeouts, and errors.
   */
  async request<T>(
    path: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const {
      body,
      timeoutMs = 15000,
      skipAuth = false,
      headers: customHeaders = {},
      signal: externalSignal,
      ...fetchInit
    } = options;

    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    let targetUrl = `${this.baseUrl}${normalizedPath}`;
    const method = (fetchInit.method || "GET").toUpperCase();
    if (method === "GET") {
      const sep = targetUrl.includes("?") ? "&" : "?";
      targetUrl = `${targetUrl}${sep}_t=${Date.now()}`;
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      ...(customHeaders as Record<string, string>),
    };

    // Auto-inject JWT access token unless explicitly skipped or already specified
    const hasAuth = Object.keys(headers).some(
      (k) => k.toLowerCase() === "authorization",
    );
    if (!skipAuth && !hasAuth) {
      const token = getAuthToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    let serializedBody: BodyInit | undefined;
    if (body !== undefined && body !== null) {
      if (body instanceof FormData || typeof body === "string") {
        serializedBody = body;
      } else {
        headers["Content-Type"] = "application/json";
        serializedBody = JSON.stringify(body);
      }
    }

    // Setup Timeout & AbortController
    const controller = new AbortController();
    let timeoutId: any;

    if (timeoutMs > 0) {
      timeoutId = setTimeout(() => {
        controller.abort(new Error("TIMEOUT"));
      }, timeoutMs);
    }

    // Forward external signal abort if provided
    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort(externalSignal.reason);
      } else {
        externalSignal.addEventListener("abort", () => {
          controller.abort(externalSignal.reason);
        });
      }
    }

    try {
      const response = await fetch(targetUrl, {
        cache: "no-store",
        credentials: "same-origin",
        ...fetchInit,
        headers,
        body: serializedBody,
        signal: controller.signal,
      });

      if (timeoutId) clearTimeout(timeoutId);

      // Parse JSON response safely
      let responseData: any;
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        try {
          responseData = await response.json();
        } catch (jsonErr) {
          responseData = null;
        }
      } else {
        const text = await response.text();
        try {
          responseData = JSON.parse(text);
        } catch {
          responseData = { message: text };
        }
      }

      // Check HTTP Status
      if (!response.ok) {
        const errorMessage =
          responseData?.error?.message ||
          responseData?.message ||
          `HTTP Error ${response.status}: ${response.statusText}`;
        const errorCode =
          responseData?.error?.code ||
          responseData?.code ||
          `HTTP_${response.status}`;

        // If unauthorized due to expired/invalid token, clear token to avoid infinite loop
        if (response.status === 401 && !skipAuth) {
          clearAuthToken();
        }

        const errorDetails =
          responseData?.error?.details !== undefined
            ? responseData.error.details
            : responseData;
        throw new ApiError(
          errorMessage,
          response.status,
          errorCode,
          errorDetails,
        );
      }

      return responseData as ApiResponse<T>;
    } catch (err: any) {
      if (timeoutId) clearTimeout(timeoutId);

      if (err instanceof ApiError) {
        throw err;
      }

      // Distinguish Abort / Timeout from general network failures
      if (err.name === "AbortError" || controller.signal.aborted) {
        if (
          err.message === "TIMEOUT" ||
          controller.signal.reason?.message === "TIMEOUT"
        ) {
          throw new ApiError(
            "Waktu tunggu koneksi server habis (timeout).",
            0,
            "TIMEOUT",
          );
        }
        throw new ApiError("Permintaan dibatalkan.", 0, "ABORTED");
      }

      // Network unreachable or CORS failure
      throw new ApiError(
        "Tidak dapat terhubung ke server backend. Periksa koneksi internet Anda.",
        0,
        "NETWORK_ERROR",
        err,
      );
    }
  }

  get<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  post<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...options, method: "POST", body });
  }

  put<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...options, method: "PUT", body });
  }

  patch<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...options, method: "PATCH", body });
  }

  delete<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }

  /**
   * Register a new user via native backend API
   */
  async register(payload: {
    name: string;
    email: string;
    password: string;
    rememberMe?: boolean;
  }): Promise<{ user: BackendUserResponse; token: string }> {
    const res = await this.post<{ user: BackendUserResponse; token: string }>(
      "/api/v1/auth/register",
      payload,
      { skipAuth: true },
    );
    if (res.data?.token) {
      setAuthToken(res.data.token, payload.rememberMe ?? true);
    }
    return res.data;
  }

  /**
   * Log in user via native backend API
   */
  async login(payload: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }): Promise<{ user: BackendUserResponse; token: string }> {
    const res = await this.post<{ user: BackendUserResponse; token: string }>(
      "/api/v1/auth/login",
      payload,
      { skipAuth: true },
    );
    if (res.data?.token) {
      setAuthToken(res.data.token, payload.rememberMe ?? true);
    }
    return res.data;
  }

  /**
   * Log out user and wipe token
   */
  async logout(): Promise<void> {
    try {
      await this.post("/api/v1/auth/logout");
    } catch {
      // Ignore network errors on logout
    } finally {
      clearAuthToken();
    }
  }

  /**
   * Endpoint GET /api/v1/auth/me
   * Retrieves verified user profile from PostgreSQL via backend
   */
  async getMe(signal?: AbortSignal): Promise<BackendUserResponse> {
    const res = await this.get<BackendUserResponse>("/api/v1/auth/me", {
      signal,
    });
    return res.data;
  }

  /**
   * Quran Page API Endpoints
   */
  async getQuranPages(): Promise<any[]> {
    const res = await this.get<any[]>("/api/v1/quran/pages");
    return res.data || [];
  }

  async getQuranPage(pageNumber: number): Promise<any> {
    const res = await this.get<any>(`/api/v1/quran/pages/${pageNumber}`);
    return res.data;
  }

  async activateQuranPage(pageNumber: number): Promise<any> {
    const res = await this.post<any>(
      `/api/v1/quran/pages/${pageNumber}/activate`,
    );
    return res.data;
  }

  async deactivateQuranPage(pageNumber: number): Promise<any> {
    const res = await this.post<any>(
      `/api/v1/quran/pages/${pageNumber}/deactivate`,
    );
    return res.data;
  }

  async reviewQuranPage(
    pageNumber: number,
    payload: {
      rating: 1 | 2 | 3;
      notes?: string;
      issueTypes?: string[];
      problemAyahs?: string | string[];
      reviewerName?: string;
    },
  ): Promise<any> {
    const res = await this.post<any>(
      `/api/v1/quran/pages/${pageNumber}/review`,
      payload,
    );
    return res.data;
  }
}

export const api = new ApiClient();
