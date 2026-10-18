import type { ApiResponse } from "@/lib/types";

export class ApiClientError extends Error {
  code: string;
  status?: number;

  constructor(code: string, message: string, status?: number) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:3978";

async function fetchJson(path: string, init?: RequestInit): Promise<{ response: Response; payload: unknown }> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", Accept: "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiClientError("BACKEND_UNAVAILABLE", "The risk service is currently unreachable. Please try again shortly.");
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ApiClientError("INVALID_RESPONSE", "The service returned an unexpected response.", response.status);
  }

  return { response, payload };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { response, payload: rawPayload } = await fetchJson(path, init);
  const payload = rawPayload as ApiResponse<T>;

  // The deployed notification reactions endpoint returns `{ data: ... }`, while
  // other endpoints retain the older `{ success, data, error }` envelope.
  if (!response.ok || payload.success === false || payload.data === null || payload.data === undefined) {
    throw new ApiClientError(payload.error?.code ?? "REQUEST_FAILED", payload.error?.message ?? "The request could not be completed.", response.status);
  }
  return payload.data;
}

async function requestRaw<T>(path: string, init?: RequestInit): Promise<T> {
  const { response, payload } = await fetchJson(path, init);
  if (!response.ok) {
    const envelope = payload as Partial<ApiResponse<unknown>>;
    throw new ApiClientError(
      envelope.error?.code ?? "REQUEST_FAILED",
      envelope.error?.message ?? "The request could not be completed.",
      response.status,
    );
  }
  return payload as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  getRaw: <T>(path: string) => requestRaw<T>(path),
  post: <T, B>(path: string, body: B) => request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export const isDemoFallbackEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_FALLBACK === "true";
