import { logger } from "../logger";
import { CSRF_HEADER, CSRF_HEADER_VALUE, type ApiFailure, type ApiSuccess } from "./envelope";
import { AppError, ForbiddenError, ValidationError } from "./errors";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const HTTP_OK = 200;
const HTTP_INTERNAL_ERROR = 500;

export type RouteHandler<Ctx> = (request: Request, context: Ctx) => Promise<Response>;

export interface ApiHandlerOptions {
  /** Status for a successful response, e.g. 201 for a create endpoint. */
  successStatus?: number;
}

function failure(error: AppError): Response {
  const body: ApiFailure = {
    ok: false,
    error: {
      code: error.code,
      message: error.message,
      ...(error instanceof ValidationError ? { fieldErrors: error.fieldErrors } : {}),
    },
  };
  return Response.json(body, { status: error.status });
}

function assertCsrfHeader(request: Request): void {
  if (SAFE_METHODS.has(request.method)) return;
  if (request.headers.get(CSRF_HEADER) !== CSRF_HEADER_VALUE) {
    throw new ForbiddenError("Missing or invalid CSRF header");
  }
}

/**
 * Wraps a route handler: enforces the CSRF header on state-changing methods, maps thrown
 * AppErrors to the JSON envelope, and logs anything unexpected without leaking it to the client.
 */
export function apiHandler<T, Ctx = unknown>(
  handler: (request: Request, context: Ctx) => Promise<T>,
  { successStatus = HTTP_OK }: ApiHandlerOptions = {},
): RouteHandler<Ctx> {
  return async (request, context) => {
    try {
      assertCsrfHeader(request);
      const body: ApiSuccess<T> = { ok: true, data: await handler(request, context) };
      return Response.json(body, { status: successStatus });
    } catch (error) {
      if (error instanceof AppError) return failure(error);

      logger.error(
        { err: error, method: request.method, path: new URL(request.url).pathname },
        "Unhandled error in API route",
      );
      const body: ApiFailure = { ok: false, error: { code: "internal_error", message: "Internal server error" } };
      return Response.json(body, { status: HTTP_INTERNAL_ERROR });
    }
  };
}
