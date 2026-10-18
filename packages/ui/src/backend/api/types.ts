// Same envelope shape as `core/src/http/envelope.ts`; declared here because `ui` must not import `core`.
export type FieldErrors = Record<string, string[]>;

export interface ApiErrorBody {
  code: string;
  message: string;
  fieldErrors?: FieldErrors;
}

export type ApiResult<T> = { ok: true; status: number; data: T } | { ok: false; status: number; error: ApiErrorBody };

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
