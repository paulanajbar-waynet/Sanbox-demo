import type { ApiErrorBody, ApiResult, FieldErrors } from "./types";

/** Sent on every call; `apiHandler` rejects state-changing requests without it (CSRF defence). */
export const CSRF_HEADER = "x-devmentor-csrf";
const CSRF_HEADER_VALUE = "1";
const API_PREFIX = "/api/";
/** Status used for failures that never got an HTTP response. */
const NO_RESPONSE_STATUS = 0;

export interface ApiCallOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly fieldErrors?: FieldErrors;

  constructor(status: number, { code, message, fieldErrors }: ApiErrorBody) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

/** Reads a body as JSON without throwing; `undefined` for an empty or non-JSON body. */
export async function readJsonSafe(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toResult<T>(status: number, body: unknown): ApiResult<T> {
  if (isRecord(body) && body.ok === true && "data" in body) {
    return { ok: true, status, data: body.data as T };
  }
  if (isRecord(body) && body.ok === false && isRecord(body.error) && typeof body.error.code === "string") {
    return { ok: false, status, error: body.error as unknown as ApiErrorBody };
  }
  return { ok: false, status, error: { code: "invalid_response", message: "Unexpected response from the server" } };
}

/** The only sanctioned `fetch()` call site for `/api/*`. Never throws for HTTP or network errors. */
export async function apiCall<T>(path: string, { method = "GET", body, signal }: ApiCallOptions = {}): Promise<ApiResult<T>> {
  if (!path.startsWith(API_PREFIX)) {
    throw new TypeError(`apiCall only calls this app's API (paths starting with ${API_PREFIX}), got: ${path}`);
  }

  const headers: Record<string, string> = { Accept: "application/json", [CSRF_HEADER]: CSRF_HEADER_VALUE };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "same-origin",
      signal,
    });
  } catch (error) {
    // A cancelled request is the caller's decision, not a failure to show.
    if (signal?.aborted) throw error;
    return { ok: false, status: NO_RESPONSE_STATUS, error: { code: "network_error", message: "Could not reach the server" } };
  }

  return toResult<T>(response.status, await readJsonSafe(response));
}

/** Like `apiCall`, but returns the data or throws `ApiError`. */
export async function apiCallOrThrow<T>(path: string, options?: ApiCallOptions): Promise<T> {
  const result = await apiCall<T>(path, options);
  if (!result.ok) throw new ApiError(result.status, result.error);
  return result.data;
}
