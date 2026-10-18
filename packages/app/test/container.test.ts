import { getOrm } from "@devmentor/db";
import { afterAll, describe, expect, it, vi } from "vitest";

import { getContainer, withRequestScope } from "../src/server/container";

afterAll(async () => {
  await (await getOrm()).close();
});

describe("withRequestScope", () => {
  it("resolves the user repository from the composed container", async () => {
    const count = await withRequestScope((scope) => scope.resolve("userRepository").count());
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it("gives every request its own EntityManager", async () => {
    const first = await withRequestScope(async (scope) => scope.resolve("em"));
    const second = await withRequestScope(async (scope) => scope.resolve("em"));
    expect(first).not.toBe(second);
    expect(first).not.toBe((await getOrm()).em);
  });

  it("disposes the scope even when the callback throws", async () => {
    const root = await getContainer();
    const createScope = root.createScope.bind(root);
    let dispose: ReturnType<typeof vi.fn> | undefined;
    const spy = vi.spyOn(root, "createScope").mockImplementation(() => {
      const scope = createScope();
      dispose = vi.spyOn(scope, "dispose") as unknown as ReturnType<typeof vi.fn>;
      return scope;
    });

    await expect(
      withRequestScope(async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    expect(dispose).toHaveBeenCalledOnce();

    spy.mockRestore();
  });
});
