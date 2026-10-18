import { afterEach, describe, expect, it, vi } from "vitest";

import { apiCall, apiCallOrThrow, ApiError, CSRF_HEADER, readJsonSafe } from "../src";

const respond = (body: string, status = 200) => vi.fn(async () => new Response(body, { status }));

afterEach(() => vi.unstubAllGlobals());

describe("apiCall", () => {
  it("returns data from a success envelope", async () => {
    vi.stubGlobal("fetch", respond(JSON.stringify({ ok: true, data: [1, 2] })));
    expect(await apiCall<number[]>("/api/things")).toEqual({ ok: true, status: 200, data: [1, 2] });
  });

  it("returns the server error from a failure envelope", async () => {
    const error = { code: "validation_error", message: "Invalid input", fieldErrors: { name: ["Required"] } };
    vi.stubGlobal("fetch", respond(JSON.stringify({ ok: false, error }), 400));
    expect(await apiCall("/api/things")).toEqual({ ok: false, status: 400, error });
  });

  it("treats a non-JSON body as an invalid response instead of throwing", async () => {
    vi.stubGlobal("fetch", respond("<html>Bad gateway</html>", 502));
    const result = await apiCall("/api/things");
    expect(result).toMatchObject({ ok: false, status: 502, error: { code: "invalid_response" } });
  });

  it("reports network failures as a result", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );
    expect(await apiCall("/api/things")).toMatchObject({ ok: false, status: 0, error: { code: "network_error" } });
  });

  it("rethrows when the caller aborted the request", async () => {
    const controller = new AbortController();
    controller.abort();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new DOMException("Aborted", "AbortError");
      }),
    );
    await expect(apiCall("/api/things", { signal: controller.signal })).rejects.toThrow("Aborted");
  });

  it("always sends the CSRF header and serializes the body", async () => {
    const fetchMock = respond(JSON.stringify({ ok: true, data: null }));
    vi.stubGlobal("fetch", fetchMock);
    await apiCall("/api/things", { method: "POST", body: { name: "Ada" } });

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers[CSRF_HEADER]).toBe("1");
    expect(headers["Content-Type"]).toBe("application/json");
    expect(init.body).toBe('{"name":"Ada"}');
    expect(init.credentials).toBe("same-origin");
  });

  it("refuses to call anything outside /api/", async () => {
    await expect(apiCall("https://evil.example/api/x")).rejects.toThrow(TypeError);
  });
});

describe("apiCallOrThrow", () => {
  it("throws ApiError with status and field errors", async () => {
    const error = { code: "validation_error", message: "Invalid input", fieldErrors: { email: ["Taken"] } };
    vi.stubGlobal("fetch", respond(JSON.stringify({ ok: false, error }), 400));

    const thrown = await apiCallOrThrow("/api/things").catch((e: unknown) => e);
    expect(thrown).toBeInstanceOf(ApiError);
    expect(thrown).toMatchObject({ status: 400, code: "validation_error", fieldErrors: { email: ["Taken"] } });
  });
});

describe("readJsonSafe", () => {
  it("returns undefined for empty bodies", async () => {
    expect(await readJsonSafe(new Response(""))).toBeUndefined();
  });
});
