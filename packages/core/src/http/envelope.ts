import type { FieldErrors } from "./errors";

/** JSON envelope of every API response. `ui/src/backend/api` declares the same shape on its side. */
export type ApiSuccess<T> = { ok: true; data: T };
export type ApiFailure = { ok: false; error: { code: string; message: string; fieldErrors?: FieldErrors } };
export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

/** Custom header `apiCall` always sends; a plain cross-site form post cannot set it (CSRF defence). */
export const CSRF_HEADER = "x-devmentor-csrf";
export const CSRF_HEADER_VALUE = "1";
