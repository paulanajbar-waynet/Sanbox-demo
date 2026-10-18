import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import {
  apiHandler,
  ConflictError,
  CSRF_HEADER,
  ForbiddenError,
  logger,
  NotFoundError,
  pageQuerySchema,
  parseJsonBody,
  parseQuery,
  UnauthorizedError,
  ValidationError,
} from "../src";

const url = "http://localhost/api/things";
const call = (handler: ReturnType<typeof apiHandler>, init: RequestInit = {}) => handler(new Request(url, init), {});

describe("apiHandler", () => {
  it("wraps the result in a success envelope", async () => {
    const res = await call(apiHandler(async () => ({ hello: "world" })));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, data: { hello: "world" } });
  });

  it("uses the configured success status", async () => {
    const res = await call(apiHandler(async () => null, { successStatus: 201 }), {
      method: "POST",
      headers: { [CSRF_HEADER]: "1" },
    });
    expect(res.status).toBe(201);
  });

  it.each([
    [new NotFoundError(), 404, "not_found"],
    [new UnauthorizedError(), 401, "unauthorized"],
    [new ForbiddenError(), 403, "forbidden"],
    [new ConflictError(), 409, "conflict"],
    [new ValidationError("Bad", { email: ["Required"] }), 400, "validation_error"],
  ])("maps %s to its status and code", async (error, status, code) => {
    const res = await call(
      apiHandler(async () => {
        throw error;
      }),
    );
    const body = await res.json();
    expect(res.status).toBe(status);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe(code);
    if (error instanceof ValidationError) expect(body.error.fieldErrors).toEqual({ email: ["Required"] });
  });

  it("logs unexpected errors and hides their details from the client", async () => {
    const logged = vi.spyOn(logger, "error").mockImplementation(() => undefined);
    const res = await call(
      apiHandler(async () => {
        throw new Error("db password is hunter2");
      }),
    );
    const text = await res.text();

    expect(res.status).toBe(500);
    expect(JSON.parse(text)).toEqual({ ok: false, error: { code: "internal_error", message: "Internal server error" } });
    expect(text).not.toContain("hunter2");
    expect(logged).toHaveBeenCalledOnce();
    logged.mockRestore();
  });

  it("rejects state-changing requests without the CSRF header", async () => {
    const handler = vi.fn(async () => "should not run");
    const res = await call(apiHandler(handler), { method: "POST" });

    expect(res.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });

  it("does not require the CSRF header for GET", async () => {
    const res = await call(apiHandler(async () => "ok"));
    expect(res.status).toBe(200);
  });
});

describe("parseQuery / pageQuerySchema", () => {
  const query = (qs: string) => parseQuery(new Request(`${url}?${qs}`), pageQuerySchema);

  it("applies pagination defaults", () => {
    expect(query("")).toEqual({ page: 1, pageSize: 20 });
  });

  it("coerces numbers", () => {
    expect(query("page=3&pageSize=50")).toEqual({ page: 3, pageSize: 50 });
  });

  it.each(["page=0", "pageSize=101", "pageSize=abc", "page=1.5"])("rejects %s", (qs) => {
    expect(() => query(qs)).toThrow(ValidationError);
  });
});

describe("parseJsonBody", () => {
  const schema = z.object({ name: z.string().min(1) });
  const post = (body: string) => new Request(url, { method: "POST", body });

  it("returns only the fields declared in the schema (no mass assignment)", async () => {
    expect(await parseJsonBody(post('{"name":"Ada","id":"x","role":"admin"}'), schema)).toEqual({ name: "Ada" });
  });

  it("rejects invalid JSON", async () => {
    await expect(parseJsonBody(post("{not json"), schema)).rejects.toThrow("valid JSON");
  });

  it("reports field errors", async () => {
    const error = await parseJsonBody(post('{"name":""}'), schema).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).fieldErrors.name).toHaveLength(1);
  });
});
