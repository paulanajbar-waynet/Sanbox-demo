import type { z } from "zod";

import { ValidationError } from "./errors";

/** Parses query-string parameters through a schema; throws ValidationError with field errors. */
export function parseQuery<S extends z.ZodType>(request: Request, schema: S): z.output<S> {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const result = schema.safeParse(params);
  if (!result.success) throw ValidationError.fromZod(result.error);
  return result.data;
}

/** Parses a JSON body through a schema. Only the schema's output is returned, which prevents mass assignment. */
export async function parseJsonBody<S extends z.ZodType>(request: Request, schema: S): Promise<z.output<S>> {
  let raw: unknown;
  try {
    raw = JSON.parse(await request.text());
  } catch {
    throw new ValidationError("Request body must be valid JSON");
  }
  const result = schema.safeParse(raw);
  if (!result.success) throw ValidationError.fromZod(result.error);
  return result.data;
}
