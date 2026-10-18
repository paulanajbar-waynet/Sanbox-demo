import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useApiQuery } from "../src";

const envelope = (data: unknown) => new Response(JSON.stringify({ ok: true, data }));
const failure = (message: string) =>
  new Response(JSON.stringify({ ok: false, error: { code: "internal_error", message } }), { status: 500 });

afterEach(() => vi.unstubAllGlobals());

describe("useApiQuery", () => {
  it("loads data", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => envelope({ n: 1 })));
    const { result } = renderHook(() => useApiQuery<{ n: number }>("/api/things"));

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual({ n: 1 });
    expect(result.current.error).toBeNull();
  });

  it("exposes the server message and recovers on reload", async () => {
    const fetchMock = vi.fn(async () => failure("Boom"));
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() => useApiQuery("/api/things"));
    await waitFor(() => expect(result.current.error).toBe("Boom"));

    fetchMock.mockImplementation(async () => envelope("ok"));
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.data).toBe("ok"));
    expect(result.current.error).toBeNull();
  });

  it("keeps the previous data while the next path loads", async () => {
    let resolveSecond: (r: Response) => void = () => undefined;
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () => envelope("page 1"))
      .mockImplementationOnce(() => new Promise<Response>((resolve) => (resolveSecond = resolve)));
    vi.stubGlobal("fetch", fetchMock);

    const { result, rerender } = renderHook(({ path }) => useApiQuery<string>(path), {
      initialProps: { path: "/api/things?page=1" },
    });
    await waitFor(() => expect(result.current.data).toBe("page 1"));

    rerender({ path: "/api/things?page=2" });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBe("page 1");

    await act(async () => resolveSecond(envelope("page 2")));
    await waitFor(() => expect(result.current.data).toBe("page 2"));
  });
});
