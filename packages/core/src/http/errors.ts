import { z } from "zod";

export type FieldErrors = Record<string, string[]>;

/** Base of every error a service may throw; apiHandler maps it to an HTTP status and envelope. */
export abstract class AppError extends Error {
  abstract readonly status: number;
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends AppError {
  readonly status = 404;
  readonly code = "not_found";

  constructor(message = "Resource not found") {
    super(message);
  }
}

export class UnauthorizedError extends AppError {
  readonly status = 401;
  readonly code = "unauthorized";

  constructor(message = "Authentication required") {
    super(message);
  }
}

export class ForbiddenError extends AppError {
  readonly status = 403;
  readonly code = "forbidden";

  constructor(message = "Access denied") {
    super(message);
  }
}

export class MethodNotAllowedError extends AppError {
  readonly status = 405;
  readonly code = "method_not_allowed";

  constructor(message = "Method not allowed") {
    super(message);
  }
}

export class ConflictError extends AppError {
  readonly status = 409;
  readonly code = "conflict";

  constructor(message = "Resource conflict") {
    super(message);
  }
}

export class ValidationError extends AppError {
  readonly status = 400;
  readonly code = "validation_error";
  readonly fieldErrors: FieldErrors;

  constructor(message = "Invalid input", fieldErrors: FieldErrors = {}) {
    super(message);
    this.fieldErrors = fieldErrors;
  }

  static fromZod(error: z.ZodError): ValidationError {
    const { fieldErrors } = z.flattenError(error);
    return new ValidationError("Invalid input", fieldErrors as FieldErrors);
  }
}
